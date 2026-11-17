# UClipModelFilter 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

영역과 절단 축에 따라 모델 재질에 클리핑 평면을 적용하고 절단면의 교점·최고점·직경과 표시용 메시를 계산한다.

### 1.2 책임 범위

필터 영역 준비, 대상 레이어·메시 교차 판정, 재질의 절단 평면 추가·제거와 단면 geometry 생성을 담당한다. result에는 클리핑된 원래 메시를 보관하며 source 모델을 복제하여 교체하지 않는다.

### 1.3 주요 동작 방식

입력 폴리곤 또는 선에서 중심·폭·카메라 방향에 따른 수직 법선을 정하고 축별 Plane을 만든다. match는 교차하는 메시에 평면을 중복 없이 적용한다. getClipArea는 메시 삼각형과 평면의 교점을 모아 단면 결과를 만든다.

### 1.4 주요 사용처와 연계 대상

모델 클리핑·단면 분석에서 사용한다. U3dSelect는 병합 모델 부품의 교차를 찾고 OpenLayers·JSTS는 평면 영역 교차, Three.js는 평면과 삼각형의 교점을 계산한다.

## 3. 정규 자연어 수도코드

```spec
UClipModelFilterCO extends UEventDispatcherCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        id?: string
            필터 식별자이며 미지정 시 Guid를 생성한다.
        geometry?: OLGeometry
            폴리곤 또는 선 형태의 위경도 영역
        layers?: Array<string>
            적용할 레이어 이름 목록
        app?: U3dApp
            좌표 변환과 카메라 위치를 제공한다.
        type?: string = 'model'
            필터 유형
        axis?: string
            x·y·height·custom 등의 절단 축
        size?: number
            축 평면 거리 또는 사용자 정의 영역 폭
        style?: {color: number, opacity: number}
            필터에 보관할 스타일
        selector?: U3dSelect
            병합 메시 교차를 찾을 선택기

ANALY_MODEL: string = 'model'
    기본 필터 유형
RESET_SIZE: number = 500000
    기본·리셋 크기
CUSTOM_MAX_SIZE: number = 1000
    생성 시 custom 축의 크기 상한
mercator: UMercator
    의존: UMercator — 해상도 계산; 생성자: {new UMercator()}
    단계별 해상도를 계산하는 공유 객체

UClipModelFilter extends UEventDispatcher 클래스 정의
    의존: UEventDispatcher — change·find 이벤트 기반; 상속: {UEventDispatcher}

    id: string
        필터 식별자
    layers: Array<string> | undefined
        대상 레이어 이름
    defaultStyle, style: {color: number, opacity: number}
        기본 스타일과 적용 스타일
    axis: string
        저장한 절단 축
    size: number
        저장한 절단 크기
    type: string
        필터 유형
    result: Array<UMesh>
        현재 클리핑 결과 메시 목록
    normalVec, centerVec: Vector3 | undefined
        사용자 정의 평면 법선과 중심
    geometry: any
        입력 또는 선에서 확장한 폴리곤
    width: number = 0
        선택한 두 기준점의 거리
    sizePlane: Plane | undefined
        재질에 연결하는 클리핑 평면이며 생성 시 uuid를 덧붙인다.
    _app: U3dApp | undefined
        앱 실행 환경
    _selector: U3dSelect | undefined
        병합 모델 선택기
    _filterInfo: Record<string, UMesh>
        이번 교차에서 찾은 부품 메시
    _resolutions: Array<number> = 빈 배열
        0~31 단계의 해상도
    _initialized: boolean = false
        해상도 초기화 여부

    constructor(options: UClipModelFilterCO = {})
        의존:
            UEventDispatcher — 이벤트 초기화; 생성자: {super()}
            defaultValue — undefined 옵션 기본값; 함수: {defaultValue()}
            Guid — 필터 식별자 생성; 함수: {Guid()}
            UDEF — 축 종류; 상수: {CLIP_AXIS_TYPE.HEIGHT, CLIP_AXIS_TYPE.CUSTOM}
            U3dApp — 입력 좌표와 카메라 조회; 함수: {getGeographicToWorld(), getCameraPosition()}
            UDrawArg — 확장한 월드 점을 위경도로 변환; 함수: {getWorldToGeographic()}
            ol — geometry 종류 판별·좌표 조회·폴리곤 생성; 생성자: {new geom.Polygon()}; 함수: {geom.Polygon.getCoordinates(), geom.LineString.getCoordinates()}
            THREE.Vector3 — 기준점·법선·중심 계산; 생성자: {new Vector3()}; 함수: {distanceTo(), addVectors(), divideScalar(), subVectors(), normalize(), crossVectors(), setLength()}
        동작:
            이벤트 기반을 초기화하고 id는 지정값 또는 Guid, style은 지정값 또는 검정·opacity 0.8, axis는 지정값 또는 HEIGHT로 저장한다.
            options.layers·app·geometry·selector를 각각 layers·_app·geometry·_selector에 보관하고 defaultStyle에 검정·opacity 0.8을 저장한다.
            size는 지정값 또는 RESET_SIZE로 삼되 axis가 CUSTOM이고 size가 CUSTOM_MAX_SIZE보다 클 때만 1000으로 낮춘다.
            type은 지정값 또는 model로 삼고 result·_filterInfo·_resolutions를 비우며 중심·법선은 undefined, 초기화 상태는 false로 둔다.
            app이 있고 geometry가 Polygon이면 첫 링의 시작·끝 XY가 다를 때 폐합 좌표를 추가하여 새 Polygon으로 교체한다.
                첫 점과 그 첫 점에서 가장 먼 점을 월드 좌표로 정하고 두 점의 중간을 centerVec, 거리를 width로 저장한다.
                두 점 사이의 수평 단위 방향과 Z축의 양쪽 외적으로 법선 후보를 만든다.
                getCameraPosition 결과의 z를 0으로 바꾸고 중심에서 size만큼 이동한 두 후보점 중 카메라에서 더 먼 쪽의 법선을 normalVec로 선택한다.
            app이 있고 geometry가 LineString이면 첫 점과 마지막 점을 월드 기준점으로 사용하여 중심·폭·양쪽 법선 후보를 구한다.
                카메라에서 더 먼 쪽 법선을 normalVec로 삼고 반대쪽으로 size만큼 두 기준점을 이동한다.
                원래 두 끝점과 이동한 두 점 및 처음 점으로 닫힌 위경도 Polygon을 만들어 geometry를 교체한다.
            저장한 축과 크기로 절단 평면을 생성하여 sizePlane에 저장한다.

    initialize() -> void
        의존: UMercator — 단계별 해상도 계산; 함수: {Resolution()}
        동작: _resolutions를 비우고 0 이상 32 미만 단계의 해상도를 순서대로 저장한 뒤 _initialized를 true로 설정한다.

    setAxis(axis: string) -> void
        동작: axis 필드만 변경하며 기존 sizePlane을 재생성하지 않는다.

    setSize(size: number) -> void
        동작: size 필드만 변경하며 생성 시 CUSTOM_MAX_SIZE 제한을 다시 적용하거나 기존 sizePlane을 바꾸지 않는다.

    resetSize() -> void
        동작: size를 RESET_SIZE인 500000으로 바꾸며 평면을 재생성하지 않는다.

    match(mesh: UMesh) -> boolean
        의존:
            UMesh — 레이어·결과 식별값; 함수: {getLayerName(), getUid()}; 정적 함수: {_getObjectId()}
            UEventDispatcher — 클리핑 결과 통지; 함수: {dispatchEvent()}
        동작:
            대상 레이어가 아니면 false를 반환한다.
            _filterInfo를 비우고 영역 교차를 검사하여 false이면 false를 반환한다.
            _filterInfo에 항목이 있으면 forEach callback으로 각 부품 메시를 클리핑한다.
                클리핑 결과가 없으면 그 부품만 건너뛴다.
                결과 getUid가 undefined가 아니면 동일 _getObjectId를 가진 기존 결과를, undefined이면 같은 객체 참조의 기존 결과를 찾아 제거한다.
                결과 메시를 result 끝에 추가하고 change 이벤트를 발행한다.
                부품 항목이 있었으면 실제 추가 여부와 무관하게 true를 반환한다.
            _filterInfo가 비었으면 원래 mesh를 같은 방식으로 클리핑·중복 교체·추가하고 change를 발행한다.
            원래 mesh의 클리핑 결과가 없으면 false, 추가되면 true를 반환한다.

    find() -> void
        의존: UEventDispatcher — 검색 요청; 함수: {dispatchEvent()}
        동작: 기존 result를 지우지 않고 find 이벤트만 발행한다.

    getType() -> string
        동작: type 필드를 반환한다.

    reset(mesh: UMesh, layer: ClippingLayer) -> boolean
        의존: UMesh — 소속 레이어 조회; 함수: {getLayerName()}
        동작:
            대상 레이어가 아니면 false를 반환한다.
            현재 영역에 교차하면 resetResult의 복원 결과를 반환하고 아니면 false를 반환한다.

    isIncludeLayer(layerName: string | undefined) -> boolean
        의존: defined — 레이어·목록 존재 판정; 함수: {defined()}
        동작: layerName이 없으면 false를 반환하고 layers가 없으면 true, 나머지는 목록의 이름 포함 여부를 반환한다.

    filterMesh(mesh: UMesh) -> boolean
        의존: defined — 경계 조회 기능 존재 확인; 함수: {defined()}
        동작: mesh.getBBox가 없으면 false를 반환하고, 있으면 intersectMesh 결과를 boolean으로 변환하여 반환한다.

    intersectMesh(mesh: UMesh) -> boolean
        의존:
            UMesh — 확장 병합 판정·원본 피처·경계·식별값; 함수: {isMerged(), getBBox()}; 정적 함수: {_getObjectId()}
            U3dSelect — 병합 메시 교차; 함수: {clearSelect(), checkGeom()}
            ol — 복사·변환·폴리곤 생성; 함수: {Geometry.clone(), Geometry.transform(), geom.Polygon.fromExtent()}; 생성자: {new geom.Polygon()}
            jsts — 평면 geometry 교차; 생성자: {new io.OL3Parser(), new geom.GeometryFactory()}; 함수: {io.OL3Parser.read(), Geometry.intersects()}
            U3dApp — 경계의 위경도 변환; 함수: {vector3ToGeoGraphic()}
            defined — 원본 피처 존재 판정; 함수: {defined()}
        동작:
            isMerged가 있고 결과가 true이며 selector가 있으면 이전 선택을 지우고 필터 geometry 복사본을 EPSG:3857로 변환하여 checkGeom한다.
                교차 결과의 객체를 _getObjectId 키로 _filterInfo에 중복 없이 기록하고 결과가 하나 이상이면 true, 아니면 false를 반환한다.
            그 외에는 JSTS 파서를 만들고 필터 geometry를 읽는다.
                원본 _ufeature가 있으면 coordinates[0] Polygon을 EPSG:3857에서 EPSG:4326으로 바꾼다.
                원본 피처가 없으면 app 부재 시 false를 반환하며, 메시 경계의 최소·최대점을 위경도로 바꾸어 extent Polygon을 만든다.
                두 JSTS geometry의 intersects 결과를 반환한다.
            위 처리 중 예외가 나면 외부로 던지지 않고 false를 반환한다.

    getClipPoint(mesh: UMesh) -> Vector3 | undefined
        동작: getClipArea 결과에 highestPoint가 있으면 그 점을 반환하고 아니면 undefined를 반환한다.

    getClipArea(mesh: UMesh)
        의존:
            UMesh — 삼각형 정점 추출과 결과 메시 생성; 함수: {getVertexPosition()}; 생성자: {new UMesh()}; 속성 읽기: {geometry, material, matrixWorld, userData}
            THREE — 삼각형 변·평면 교차·단면 재질; 생성자: {new Vector3(), new Line3(), new MeshBasicMaterial()}; 함수: {Plane.distanceToPoint(), Plane.intersectLine(), Vector3.distanceTo()}; 상수: {DoubleSide}
            UBufferGeometry — 단면 정점·인덱스; 생성자: {new UBufferGeometry()}; 함수: {setFromPoints(), setIndex()}
            U3dMessage — 정점·교차·결과 구성 오류 안내; 함수: {__GInfo__()}
        동작:
            sizePlane·mesh·geometry·material 중 하나라도 없으면 undefined를 반환한다.
            drawRange.start는 0 이상으로 삼고 index가 있으면 index.count와 drawRange 끝 중 작은 값까지 3개씩 순회한다.
            index가 없으면 position 부재를 로그 후 undefined로 반환하고 position.count와 drawRange 끝 중 작은 값에서 2를 뺀 경계까지 1개씩 이동하여 연속한 세 점을 사용한다.
            인덱스 경로는 getVertexPosition으로, 비인덱스 경로는 position 배열에서 삼각형 세 점을 읽는다.
            세 점에는 matrixWorld의 평행이동 성분만 더하며 회전·스케일은 적용하지 않는다. 추출 오류는 안내 후 undefined로 종료한다.
            세 점의 평면 부호 중 하나라도 다르면 세 변과 sizePlane의 교점을 구한다.
                각 교점의 z를 0으로 놓은 임시 점과 centerVec의 거리가 width/2보다 작은 교점만 남긴다.
                남은 교점이 정확히 2개인 삼각형만 두 점의 복사본을 결과 목록에 추가한다.
                평면 검사 오류는 안내 후 undefined로 종료한다.
            모은 점이 없으면 undefined를 반환한다.
            모든 점의 평균 중심·최고 z점과 모든 점 쌍 중 가장 먼 두 점·거리를 구한다.
            중심을 0번 정점에 두고 교점을 뒤에 나열하여 연속 점 쌍과 중심으로 삼각형 인덱스를 만든다.
            양면 MeshBasicMaterial과 UBufferGeometry로 UMesh를 만들고 원본 userData 참조를 그대로 공유한다.
            points·center·clipMesh·highestPoint·diameterPoints·diameterLength를 반환한다. 결과 구성 예외는 안내 후 undefined로 끝낸다.

createAxisPlane(self: UClipModelFilter, axis: string, size: number) -> Plane | undefined
    의존:
        UDEF — 지원 축 종류; 상수: {CLIP_AXIS_TYPE.X, CLIP_AXIS_TYPE.Y, CLIP_AXIS_TYPE.HEIGHT, CLIP_AXIS_TYPE.CUSTOM}
        THREE — 축 평면 생성; 생성자: {new Plane(), new Vector3()}; 함수: {Plane.translate()}
        Guid — 평면 식별값; 함수: {Guid()}
        U3dMessage — 미지원 축·생성 오류 안내; 함수: {__GInfo__()}
    동작:
        X는 법선 (-1,0,0), Y는 (0,-1,0), HEIGHT는 (0,0,-1)과 constant=size인 Plane을 sizePlane에 저장한다.
        CUSTOM이면 normalVec로 Plane을 만들고 centerVec만큼 이동한다.
        그 밖의 축은 안내 후 생성을 건너뛰고, 생성된 sizePlane이 있으면 uuid를 부여한다.
        생성 중 예외는 안내만 하고 현재 self.sizePlane을 반환한다.

resetResult(mesh: UMesh, layer: ClippingLayer) -> boolean
    인터페이스: this는 복원할 UClipModelFilter이며 layer는 복원 대상 레이어의 존재를 확인하는 입력이다.
    의존:
        defined — 레이어·재질 존재 확인; 함수: {defined()}
        UMesh — 재질과 AO 상태 복원; 속성 읽기: {material, userData}; 속성 쓰기: {material.clippingPlanes}; 속성 삭제: {userData._oriExceptAO, userData.exceptAO}
    동작:
        layer 또는 mesh.material이 정의되지 않았으면 false를 반환한다.
        단일 재질 또는 각 배열 재질에서 clippingPlanes가 있으면 현재 sizePlane.uuid와 같은 평면을 첫 한 건만 제거한다. 평면 목록이 없거나 비었으면 빈 배열로 둔다.
        userData._oriExceptAO가 truthy이면 그 표식만 삭제하고 아니면 userData.exceptAO를 삭제한다.
        result 배열에서 메시를 제거하지 않고 true를 반환한다.

makeResult(mesh: UMesh) -> UMesh | undefined
    인터페이스: this는 적용할 UClipModelFilter이며 반환값은 입력 mesh와 같은 참조다.
    의존:
        defined — 재질·평면 존재 확인; 함수: {defined()}
        UMesh — 재질 클리핑과 AO 제외 상태; 속성 읽기: {material, userData}; 속성 쓰기: {material.clippingPlanes, userData._oriExceptAO, userData.exceptAO}
    동작:
        mesh.material 또는 sizePlane이 정의되지 않았으면 undefined를 반환한다.
        단일 재질 또는 각 배열 재질의 clippingPlanes에 같은 uuid가 있으면 추가하지 않고, 없으면 현재 평면을 추가한다. 목록이 없거나 비었으면 현재 평면 하나의 배열을 지정한다.
        userData.exceptAO가 truthy이면 _oriExceptAO를 true로 기록하고 아니면 exceptAO를 true로 켠다.
        입력 mesh를 반환한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
