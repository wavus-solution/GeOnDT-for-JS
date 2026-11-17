# UHeightFilter 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

지정한 위경도 영역에서 제한 높이를 넘는 모델을 찾아 결과와 change 이벤트로 전달하는 고도 필터다.

### 1.2 책임 범위

영역 교차 판정, 제한 높이의 돌출 메시 생성, 일반·병합·인스턴스 메시의 정점 높이 검사와 결과 캐시를 담당한다. 모델 수집·반복 호출은 필터 사용자에게 맡기며 find는 검색 요청 이벤트를 보낸다.

### 1.3 주요 동작 방식

폴리곤을 닫고 제한 높이의 판정 메시를 만든다. match는 가시성·대상 레이어·캐시·평면 교차를 확인한 뒤 메시 종류에 맞는 높이 검사를 선택한다. 일치 결과는 지형 높이와 실제 미터 단위 크기로 변환하여 저장한다.

### 1.4 주요 사용처와 연계 대상

높이 제한 분석에서 모델을 선별한다. U3dSelect는 병합 부품의 교차를 찾고 UHeightUtil은 정점 아래 필터 메시의 높이를 계산하며 UMathEngine과 앱은 좌표계·실제 길이 환산을 담당한다.

## 3. 정규 자연어 수도코드

```spec
UHeightFilterCO extends UEventDispatcherCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        id?: string
            필터 식별자이며 미지정 시 Guid를 생성한다.
        geometry?: object
            필터의 위경도 폴리곤이며 실행에서는 getCoordinates를 직접 호출한다.
        height?: number
            제한 높이
        layers?: Array<string>
            대상 레이어 이름 목록
        isAbsolute?: boolean = true
            절대 높이 여부로 보관하나 현재 높이 검사 분기에는 사용하지 않는다.
        extrudeOption?: ExtrudeGeometryOptions
            필터 메시 돌출 옵션
        materialOption?: MeshLambertMaterialParameters
            필터 메시 재질 옵션
        app?: U3dApp
            좌표 변환·선택기 등록·지형 높이를 제공한다.
        ignoreInitial?: boolean
            truthy이면 초기 돌출 메시 생성을 건너뛴다.

HeightFilterMatchInfo 부분 타입 명세
    이 명세에서 사용하는 필드:
        bbox?: Box3
            제공된 대상 경계
        height?: number
            이미 계산한 필터 교차 높이
        id?: number | string
            결과에 기록할 식별자
        instanceId?: number
            검사할 렌더 인스턴스 슬롯

HeightMeshExt extends UMesh 부분 타입 명세
    이 명세에서 사용하는 필드:
        isMerged?: function() -> boolean
            병합 메시 여부
        _ufeature?: {geometry: {coordinates: Triple_Array<number>}}
            교차 판정용 원본 피처 좌표
        _pickMaterials?: Array<number>
            선택된 병합 재질 그룹 인덱스
        filterHeight_?: number
            마지막 양수 교차 높이

HeightInstancedMesh extends UInstancedMesh 부분 타입 명세
    이 명세에서 사용하는 필드:
        filterHeight_?: number
            인스턴스 정점 검사에서 마지막 양수 교차 높이

olParser
    의존: jsts — OpenLayers geometry 변환; 생성자: {new io.OL3Parser(), new geom.GeometryFactory()}
    OpenLayers geometry를 교차 판정용 JSTS geometry로 바꾸는 공유 파서
TEMP_INSTANCE_MATRIX, TEMP_WORLD_MATRIX: Matrix4
    의존: THREE.Matrix4 — 인스턴스·월드 행렬 계산 공간; 생성자: {new Matrix4()}
    호출 간 재사용하는 임시 행렬
TEMP_VECTOR: Vector3
    의존: THREE.Vector3 — 인스턴스 정점 변환 공간; 생성자: {new Vector3()}
    호출 간 재사용하는 임시 벡터

UHeightFilter extends UEventDispatcher 클래스 정의
    의존: UEventDispatcher — 필터 change·find 이벤트; 상속: {UEventDispatcher}

    id: string
        필터 식별자
    geometry: OLGeometry | undefined
        닫힌 위경도 폴리곤
    height: number | undefined
        제한 높이
    layers: Array<string> | undefined
        대상 레이어 목록
    isAbsolute: boolean
        보관하는 절대 높이 옵션
    extrudeOption: ExtrudeGeometryOptions | undefined
        돌출 깊이 등을 정하는 옵션
    materialOption: MeshLambertMaterialParameters | undefined
        필터 메시 재질 옵션
    result: Array
        _result에 저장된 값의 배열을 조회하는 getter이며 조회마다 새 배열을 만든다.
    _app: U3dApp | undefined
        앱 실행 환경
    _result: KeyValue
        대상 키별 결과 캐시
    _selector: U3dSelect | undefined
        병합 메시 영역 선택기
    _mesh: UMesh | null
        높이 판정용 돌출 메시이며 초기 생성을 건너뛰면 런타임에서는 undefined이다. [확인 Q-001]

    constructor(options: UHeightFilterCO = {})
        의존:
            UEventDispatcher — 이벤트 초기화; 생성자: {super()}
            defaultValue — id·절대 높이 기본값; 함수: {defaultValue()}
            Guid — 미지정 필터 식별자 생성; 함수: {Guid()}
            U3dSelect — 자동 선택 없는 선택기; 생성자: {new U3dSelect()}
            U3dApp — 선택기 등록; 함수: {addSelect()}
            ol — 폴리곤 좌표 조회와 폐합; 함수: {geom.Polygon.getCoordinates()}; 생성자: {new geom.Polygon()}
        동작:
            이벤트 기반을 초기화하고 options의 id 또는 Guid, geometry·height·layers·돌출·재질 옵션·app을 저장한다. isAbsolute는 undefined일 때 true로 삼는다.
            빈 _result를 만들고 app이 있으면 auto=false인 U3dSelect를 만들어 앱에 등록한다.
            geometry 첫 좌표 링의 시작·끝 XY가 다르면 첫 좌표를 끝에 추가하고 새 Polygon으로 geometry를 바꾼다.
            options.ignoreInitial이 falsy이면 돌출 메시를 생성하여 _mesh에 저장한다.
            result 접근자를 등록하여 조회할 때마다 _result 값들의 새 배열을 반환하게 한다.

    match(mesh: UMesh, info: HeightFilterMatchInfo = {}) -> boolean
        의존:
            UMesh — 대상 가시성·레이어; 함수: {getLayerName()}; 속성 읽기: {visible}
            UEventDispatcher — 결과 통지; 함수: {dispatchEvent()}
        동작:
            mesh.visible이 false이거나 대상 레이어에 포함되지 않으면 false를 반환한다.
            이미 결과 캐시에 있으면 추가 검사 없이 true를 반환한다.
            영역과 교차하지 않으면 false를 반환한다.
            높이 검사를 수행하여 false 또는 빈 결과이면 false를 반환한다.
            매칭 항목마다 결과를 만들고 해당 키로 _result에 저장하며 data가 그 결과인 change 이벤트를 발행한다.
            매칭 항목이 하나 이상이면 true를 반환한다.

    isCache(mesh: UMesh) -> boolean
        동작: 대상 키에 해당하는 _result 값의 truthy 여부를 반환한다.

    isIncludeLayer(layerName: string | undefined) -> boolean
        의존: defined — 대상 목록·레이어 이름 존재 확인; 함수: {defined()}
        동작: layers가 정의되지 않았으면 true, 목록이 있는데 layerName이 없으면 false, 나머지는 layers의 이름 포함 여부를 반환한다.

    setHeight(height: number) -> void
        의존:
            UMesh — 필터 경계 중심 조회와 위치 반영; 함수: {getBoundingBox()}; 속성 쓰기: {position.z}
            THREE — 경계 중심을 받을 벡터; 생성자: {new Vector3()}; 함수: {Box3.getCenter()}
            UMathEngine — 중심점의 실제 길이 배율; 정적 함수: {getRealScaleAtGoogle()}
        동작:
            height를 저장하고 extrudeOption 또는 _mesh가 없으면 종료한다.
            메시 경계 중심의 실제 길이 배율 역수를 구하고 (height - extrudeOption.depth의 nullish 기본값 0)에 곱하여 필터 메시 position.z로 저장한다.

    getMesh() -> UMesh | null
        동작: _mesh 참조를 반환하며 초기 생성을 건너뛴 경우 undefined가 반환될 수 있다. [확인 Q-001]

    getColor() -> Color | null
        의존: UMesh — 필터 메시 색상; 속성 읽기: {material.color}
        동작: _mesh 또는 material이 없으면 undefined, 있으면 material.color를 반환한다. [확인 Q-001]

    setColor(color: ColorRepresentation) -> void
        의존: THREE.Color — 필터 재질 색 변경; 함수: {set()}
        동작: _mesh 또는 material이 없으면 호출을 건너뛰며, 있으면 material.color.set에 입력 색을 전달한다.

    getOpacity() -> number
        의존: UMesh — 필터 재질 투명도; 속성 읽기: {material.opacity}
        동작: _mesh 또는 material이 없으면 undefined, 있으면 material.opacity를 반환한다. [확인 Q-001]

    setOpacity(opacity: number) -> void
        의존:
            defined — 필터 메시 존재 판정; 함수: {defined()}
            U3dMessage — 메시 부재 안내; 정적 함수: {error()}; 상수: {CNT.MODEL.NON_MESH}
            UMesh — 재질 투명도 변경; 속성 쓰기: {material.opacity, material.transparent}
        동작: _mesh가 없으면 오류 로그를 출력하고 종료한다. 있으면 opacity를 저장하고 opacity < 1 판정으로 transparent를 설정한다.

    setVisible(visible: boolean) -> void
        의존:
            defined — 필터 메시 존재 판정; 함수: {defined()}
            U3dMessage — 메시 부재 안내; 정적 함수: {error()}; 상수: {CNT.MODEL.NON_MESH}
            UMesh — 가시성·재질 상태 반영; 속성 쓰기: {visible, material.transparent}
        동작: _mesh가 없으면 오류 로그를 출력하고 종료한다. 있으면 visible과 material.transparent를 모두 입력 visible로 설정한다.

    setRenderOrder(renderOrder: number) -> void
        의존:
            defined — 필터 메시 존재 판정; 함수: {defined()}
            U3dMessage — 메시 부재 안내; 정적 함수: {error()}; 상수: {CNT.MODEL.NON_MESH}
            UMesh — 렌더 순서 설정; 속성 쓰기: {renderOrder}
        동작: _mesh가 없으면 오류 로그를 출력하고 종료하며, 있으면 renderOrder를 저장한다.

    clear() -> void
        동작: _result를 새 빈 객체로 교체한다.

    find() -> void
        의존: UEventDispatcher — 재검색 요청; 함수: {dispatchEvent()}
        동작: 결과 캐시를 비운 뒤 find 이벤트를 발행한다.

    intersectMesh(mesh: UMesh, info: HeightFilterMatchInfo) -> boolean
        의존:
            jsts — 폴리곤 교차; 함수: {io.OL3Parser.read(), Geometry.intersects()}
            defined — 원본 피처·제공 경계 존재 판정; 함수: {defined()}
            ol — 원본·경계 폴리곤 구성; 생성자: {new geom.Polygon()}; 함수: {geom.Polygon.fromExtent(), geom.Polygon.transform()}
            UMesh — 대상 경계 조회; 함수: {getBBox()}
            U3dApp — 월드 경계를 위경도로 변환; 함수: {vector3ToGeoGraphic()}
        동작:
            필터 geometry를 JSTS geometry로 변환한다.
            mesh._ufeature가 정의되어 있으면 원본 coordinates[0]로 Polygon을 만들고 EPSG:3857에서 EPSG:4326으로 바꾼다.
            원본 피처가 없으면 app 부재 시 false를 반환한다. info.bbox가 정의되어 있으면 사용하고 아니면 메시 경계를 조회한다.
            경계 또는 최소·최대점의 위경도 변환 결과가 없으면 false를 반환하고, 유효하면 위경도 extent Polygon을 만든다.
            대상 폴리곤을 JSTS로 변환하여 필터와 intersects 결과를 반환한다.

    filterMeshHeight(mesh: UMesh, info: HeightFilterMatchInfo) -> Record<string, *> | false
        의존:
            U3dMessage — 필터 입력 부재; 함수: {__GError__()}
            defined — 정점·그룹 자료 존재 확인; 함수: {defined()}
            THREE — 정점 및 결과 경계; 생성자: {new Vector3(), new Box3()}; 함수: {Vector3.applyMatrix4(), BufferAttribute.getX(), BufferAttribute.getY(), BufferAttribute.getZ()}
            HeightMeshExt — 확장 메시의 병합 상태 판정; 함수: {isMerged()}
            UMesh — 레이어·영구 또는 인스턴스 키; 함수: {getLayerName()}; 정적 함수: {_getObjectId()}
            ol — 필터 영역 복사·좌표계 변환; 함수: {Geometry.clone(), Geometry.transform()}
            U3dSelect — 병합 모델 교차; 함수: {checkGeom()}
            U3dApp — 소속 레이어 조회; 함수: {getLayerByName()}
            병합 레이어 — 소속 레이어가 제공하는 조각 구성 정보; 함수: {getComposedInfo()}
            UHeightUtil — 정점 아래 필터 높이; 정적 함수: {getOriginZ()}
        동작:
            geometry 또는 _mesh가 없으면 오류 로그를 출력하고 false를 반환한다.
            isMerged 함수가 없거나 결과가 false이면 BufferGeometry·attributes·position이 있는지 확인하고 없으면 false를 반환한다.
                일반 높이 검사 결과를 반환한다.
            병합 메시이면 app과 selector가 없을 때 false를 반환한다. geometry 복사본을 EPSG:3857로 변환하여 checkGeom하고 첫 교차 객체가 없으면 false를 반환한다.
            첫 교차 객체의 _pickMaterials가 truthy이면 선택된 originIndex마다 geometry group을 찾는다.
                group·position이 없거나 isDivided·childMeshId가 없으면 해당 그룹을 건너뛴다.
                소속 레이어 getComposedInfo(gid, childMeshId)가 없거나 geometry index가 없으면 건너뛴다.
                composedInfo.start부터 count만큼 인덱스를 따라 로컬 정점을 읽고 필터 높이를 구한다.
                높이가 0 이하이거나 정점 z보다 크면 계속 검사한다. 나머지 경우 composedInfo.uid 키로 height·min/max Box3·id를 저장하고 해당 조각 검사를 끝낸다.
                일치한 조각이 있으면 모은 결과를, 아니면 false를 반환한다.
            _pickMaterials가 falsy이면 정점을 matrixWorld로 변환하며 검사한다.
                필터 높이가 0 이하이면 건너뛰고 양수이면 filterHeight_에 먼저 기록한다.
                높이가 정점 z보다 크면 계속 검사하고 아니면 대상 키로 height·선택적 _bbox 복사·객체 ID를 담아 즉시 반환한다.
            일치 정점이 없으면 false를 반환한다.

    _createExtrudeMesh() -> UMesh | null
        의존:
            ol — 폴리곤 좌표 조회; 함수: {Geometry.getCoordinates()}
            THREE — 중심 기준 돌출 형상과 재질; 생성자: {new Shape(), new ExtrudeGeometry(), new MeshLambertMaterial()}; 함수: {Shape.moveTo(), Shape.lineTo()}
            U3dMessage — 앱·좌표 부재 안내; 함수: {__GError__()}
            U3dApp — 위경도 정점의 월드 좌표 변환; 함수: {geographicToVector3()}
            UGPoint — 좌표 평균 중심; 생성자: {new UGPoint()}
            UMesh — 필터 메시 생성·경계·행렬 반영; 생성자: {new UMesh()}; 함수: {geometry.computeBoundingBox(), updateMatrixWorld()}
            UMathEngine — 제한 높이의 월드 배율; 정적 함수: {getRealScaleAtGoogle()}
        동작:
            geometry의 첫 좌표 링을 읽고 app이 없거나 좌표가 3개 미만이면 오류 로그 후 null을 반환한다.
            각 좌표의 z는 nullish일 때 0으로 삼아 월드 좌표로 변환하고 모든 점의 평균을 중심으로 삼는다.
            각 변환점을 중심 상대좌표로 바꿔 첫 점으로 moveTo하고 나머지 점으로 lineTo하여 Shape을 만든다.
            extrudeOption 또는 materialOption이 없으면 오류를 던진다.
            옵션으로 ExtrudeGeometry·MeshLambertMaterial·UMesh를 만들고 userData.exceptAO를 true로 설정한다.
            geometry 경계를 계산하고 XY는 평균 중심, Z는 (height의 nullish 기본값 0 - depth의 nullish 기본값 0)에 중심의 실제 길이 배율 역수를 곱한 값으로 정한다.
            uuid를 필터 id로 지정하고 그림자 생성·수신을 끈 뒤 월드 행렬을 갱신하여 메시를 반환한다.

    static _makeObjectKey(object: UMesh | object) -> string
        의존:
            THREE.Object3D — 렌더 객체 판별; 상속: {Object3D}
            UMesh — 소속 레이어와 객체 식별값; 함수: {getLayerName()}; 정적 함수: {_getObjectId()}
        동작:
            Object3D이면 getLayerName이 있을 때 조회하고 UMesh._getObjectId로 id를 정한다.
            나머지 Object이면 layerName과 id 필드를 읽는다.
            layerName + '^' + id를 반환하며 누락 값은 문자열 연결에서 undefined로 표현된다.

    _makeResult(mesh: UMesh, info: HeightFilterMatchInfo = {})
        의존:
            defined — 제공 경계 존재 판정; 함수: {defined()}
            UMesh — 경계·식별값·속성 조회; 함수: {getBBox()}; 정적 함수: {_getObjectId()}; 속성 읽기: {_uproperties, filterHeight_}
            THREE — 중심 계산; 생성자: {new Vector3()}; 함수: {Box3.getCenter()}
            UMathEngine — 실제 미터 배율; 정적 함수: {getRealScaleAtGoogle()}
            U3dApp — 위경도 중심과 지형 높이; 함수: {vector3ToGeoGraphic(), getHeightAtPoint()}
        동작:
            app이 없으면 오류를 던진다. info.bbox가 정의되지 않았으면 메시 경계를 쓰고 경계가 없으면 undefined를 반환한다.
            경계 중심의 실제 길이 배율을 구하여 필터 높이와 경계 z 크기를 미터로 환산한다. 필터 높이는 info.height, mesh.filterHeight_, 0 순으로 nullish 값을 대체한다.
            위경도 중심·지형 높이·메시 높이·필터 높이·원본 속성·경계·메시 참조를 반환 객체에 담는다.
            id는 info.id가 nullish가 아니면 그대로 쓰고 아니면 객체 식별값을 쓴다.

    _getHeightFiltered(mesh: UMesh, info: HeightFilterMatchInfo = {}) -> Record<string, *> | false
        의존:
            UInstancedMesh — 인스턴스 메시 종류 판별; 상속: {UInstancedMesh}
            THREE.Vector3 — 정점의 월드 변환; 생성자: {new Vector3()}; 함수: {applyMatrix4()}
            UHeightUtil — 필터 높이 계산; 정적 함수: {getOriginZ()}
            UMesh — 결과 경계·ID; 함수: {getBBox()}; 정적 함수: {_getObjectId()}
        동작:
            mesh가 UInstancedMesh이면 인스턴스 검사 결과를 반환한다.
            각 geometry 정점을 matrixWorld로 변환하고 필터 높이를 구한다.
            높이가 양수이면 filterHeight_를 갱신하고 그 높이가 정점 z보다 작을 때만 대상 키에 height·bbox·id를 담아 즉시 반환한다.
            조건을 만족한 정점이 없으면 false를 반환한다.

    #getHeightFilteredInstanced(mesh: HeightInstancedMesh, info: HeightFilterMatchInfo = {}) -> Record<string, *> | false
        의존:
            defined — 인스턴스 슬롯·행렬 함수 존재 판정; 함수: {defined()}
            UInstancedMesh — 슬롯 행렬·소속 조회; 함수: {getMatrixAt(), getLayerName()}; 속성 읽기: {geometry, matrixWorld, uuid}
            THREE — 인스턴스 행렬 결합과 정점 변환; 함수: {Matrix4.multiplyMatrices(), Vector3.applyMatrix4()}
            UHeightUtil — 필터 교차 높이; 정적 함수: {getOriginZ()}
        동작:
            instanceId 또는 getMatrixAt이 정의되지 않았으면 false를 반환한다.
            해당 슬롯 행렬을 읽고 mesh.matrixWorld와 곱하여 정점 변환에 사용할 월드 행렬을 만든다.
            각 정점을 결합 행렬로 변환하고 필터 높이를 구한다. 높이가 양수이면 mesh.filterHeight_를 먼저 바꾼다.
            높이가 정점 z보다 작으면 layerName과 mesh.uuid + '^' + instanceId로 캐시 키를 만든다.
                결과에는 height·info.bbox를 저장하고 info.id가 nullish가 아니면 해당 id, 아니면 uuid·슬롯 결합값을 id로 저장하여 반환한다.
            조건을 만족하는 정점이 없으면 false를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
일반·인스턴스 높이 판정은 필터 교차 높이가 양수이고 정점 z보다 작아야 한다. 병합 모델 경로는 양수이고 정점 z 이하이면 일치하므로 경계의 등호 처리가 다르다.
setHeight는 결과 캐시를 지우지 않는다. 재검색은 find가 clear 후 이벤트를 발행하는 경로를 사용한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
