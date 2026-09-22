# U3dModelShapeLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

GeoJSON 형태의 피처 좌표를 압출하여 건물 메시를 만들고, 타일별 표시·높이·라벨·재질과 층 선택·분리 이동을 관리한다. 생성 옵션의 FeatureCollection은 보관만 하며 실제 건물 생성은 addFeatureCollection() 또는 addFeature()로 요청한다. 기반 모델 레이어와 앱의 지형 높이 등록, UShpMesh·UExtrudeGeometry, 사용자 스타일·층별 재질 콜백을 연결한다.

## 3. 정규 자연어 수도코드

```spec
U3dModelShapeLayer extends U3dModelLayer 클래스 정의
    의존: U3dModelLayer — 공통 모델 레이어; 상속: {U3dModelLayer}

    heightFunction: ((feature: U3dModelShapeFeature) => number) | undefined
        건물 높이 콜백이며 레이어를 receiver로 호출한다.
    landHeightFunction: ((feature: U3dModelShapeFeature) => number) | undefined
        지면 높이 콜백이며 레이어를 receiver로 호출한다.
    depthOffset: number = 1
        단일 반투명 재질의 깊이 보정 값이다.
    styleFunction: U3dModelShapeStyleFunction | undefined
        피처 스타일 콜백이며 레이어를 receiver로 호출한다.

    constructor(opt: U3dModelShapeLayerCO = {})
        인터페이스: opt는 레이어 이름·좌표계·표시 레벨, 건물·지면·층 높이와 속성 필드, 스타일·라벨·텍스처 설정을 전달하는 생성 옵션이다.
        의존:
            U3dModelLayer — 기반 상태 초기화; 생성자: {super()}
            UCheckTime — 직접 호출; 생성자: {new UCheckTime()}
            UGroup — 직접 호출; 생성자: {new UGroup()}
            UMercator — 직접 호출; 생성자: {new UMercator()}
            defaultValue — 기본값 선택; 함수: {defaultValue()}
            defined — 존재 판정; 함수: {defined()}
            Guid — 직접 호출; 함수: {Guid()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_drawArg}
        동작:
            부모를 opt로 초기화한 뒤 클래스 이름과 기본 이름을 설정한다. opt.name이 있어도 기본값 인수 Guid()는 먼저 평가된다.
            drawline=true, crs=EPSG:3857, sourceCRS=EPSG:5179, minlevel=17을 기본으로 두며 maxlevel은 minlevel과 같다.
            피처 컬렉션·속성·모델·사용자 그룹·처리 대기열과 텍스처·타일·모델·선택 층 색인을 빈 상태로 만든다. opt.featureCollection은 배열에 보관만 하고 건물을 생성하지 않는다.
            공통 스타일 기본값은 DoubleSide, 색상 0xfaebd7, opacity=1, visible=true다. 전달된 style·labelInfo·textureurl 배열과 콜백은 복사하지 않고 보관한다.
            층 높이는 4, 윗면·옆면 분리 및 라벨 표시는 false, depthOffset=1, 텍스처 사용은 false가 기본이다. 높이·지면·라벨·층 속성 키와 높이·스타일 콜백을 보관한다.
            textureurl이 truthy면 먼저 쓰고 아니면 textureUrl을 사용하며 둘 다 없으면 빈 배열이다. _useproxy가 falsy이면 proxyurl을 빈 문자열로 바꾼다.
            시간 제한기·압출 모델 그룹·메르카토르 변환기를 생성한다. 그룹은 부모 _drawArg를 전달받는다.
            텍스처 초기화 반환값에 then/catch를 등록한다. 성공하면 정의된 resolve를 자신으로 호출하고, 실패하면 console.error 후 정의된 reject를 오류로 호출한다. 호출 시 receiver는 레이어다.

    textureInit() -> Promise<Array<void> | undefined> | void
        의존:
            defined — 존재 판정; 함수: {defined()}
        동작:
            텍스처 URL이 정의되어 있으면 setTexture의 반환값을 그대로 반환하며 아니면 undefined다.

    #applyUvArray(geometry: BufferGeometry, arr: Float32Array | Array<number>) -> void
        의존:
            THREE — 직접 호출; 생성자: {new THREE.Float32BufferAttribute()}
        동작:
            geometry.getAttribute가 없으면 종료한다. 기존 uv 또는 그 배열이 없거나 길이가 다르면 arr.slice()로 복사한 새 Float32BufferAttribute를 등록한다. 길이가 같으면 기존 배열에 set하고 needsUpdate=true로 표시한다.

    setUvMode(geometry: BufferGeometry | undefined, mode: 'origin' | 'converted') -> void
        동작:
            geometry가 없거나 userData._uvSource가 mode와 같으면 종료한다.
            geometry가 존재하면 모드에 따라 다음 배열을 적용한다.
                origin 모드에서 originUvArray가 있으면 원본 배열을 적용한다.
                그 외 모드에서 convertedUvArray가 있으면 변환 배열을 적용한다.
            선택 배열이 없으면 상태 변경 없이 종료한다. 적용했으면 geometry.userData._uvSource를 mode로 기록한다.

    async setTexture(url: string | Array<string>) -> Promise<Array<void> | undefined>
        의존:
            defined — 존재 판정; 함수: {defined()}
        동작:
            url이 정의되지 않았으면 undefined로 완료한다. 배열이면 순서대로 각 URL의 로딩을 시작하고, 스칼라이면 한 번 시작하여 Promise.all 결과를 반환한다. 하나라도 거부되면 반환 Promise도 거부된다.

    async changeTexture(url: string, index: number) -> Promise<void | undefined>
        의존:
            deferred — 완료·실패 통지; 함수: {deferred()}
            defined — 존재 판정; 함수: {defined()}
        동작:
            url이 없거나 내부 URL이 배열이 아니거나 index가 0 미만 또는 배열 길이 이상이면 undefined로 완료한다. 정수 여부는 검사하지 않는다.
            새 URL 로딩 성공 콜백에서 기존 URL 키의 텍스처 사전 항목을 삭제하고 공유 URL 배열을 splice로 교체한 뒤 별도 deferred를 resolve한다. 로딩을 await한 다음 해당 deferred를 반환한다. 이전 텍스처를 dispose하지 않는다.

    updateStyle() -> void
        동작:
            등록 모델 중 UMesh 또는 THREE.Mesh에 피처별 스타일 선택과 재질 적용을 수행한다.

    override dispose() -> Promise<boolean>
        의존:
            U3dModelLayer — 공통 해제; 함수: {U3dModelLayer.prototype.dispose.call()}
            defined — 존재 판정; 함수: {defined()}
            U3dModelLayer — 직접 호출; 함수: {U3dModelLayer.prototype.dispose.call()}
            UDEF — 직접 호출; 함수: {UDEF.disposeObject3D()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_scene, _app, _drawArg}
        동작:
            캐시 텍스처를 dispose하고 사전을 비운 뒤 존재하는 scene을 clear한다.
            모델의 자동 지형 높이 갱신을 해제하고 라벨을 해제한다. geometry의 원본·변환 UV 배열 및 userData 참조를 지운 뒤 모델을 해제한다.
            사용자 그룹의 Mesh 자식에 남은 라벨과 자식을 해제한다. 타일·모델 색인과 처리 수·대기열·사용자 그룹을 비우고 압출 그룹·모델 목록은 undefined로 만든다.
            공통 라벨을 제거하고 화면 갱신 시각을 변경한 다음 부모 dispose의 Promise를 반환한다. 활성 애니메이션 타이머는 여기서 취소하지 않는다.

    removeScene(mesh: U3dModelShapeMesh) -> void
        의존:
            defined — 존재 판정; 함수: {defined()}
            UDEF — 직접 호출; 함수: {UDEF.disposeObject3D()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_scene, _app}
        동작:
            mesh가 falsy면 종료한다. 모델을 숨기고 scene에서 분리한다.
            라벨과 앱의 주석 장면이 모두 있으면 라벨을 숨겨 분리·해제하고 label 참조를 지운다. 건물 모델 자체는 해제하지 않는다.

    addScene(mesh: U3dModelShapeMesh) -> void
        의존:
            defined — 존재 판정; 함수: {defined()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_scene, _app, _drawArg}
        동작:
            mesh가 falsy면 종료한다. 모델을 표시하여 scene에 넣고 수동 행렬 갱신을 적용한다.
            mesh가 존재하고 _isShowLabel이 true이면 기존 라벨을 주석 장면에 추가하거나 라벨을 만든 뒤 성공 콜백에서 표시·등록한다. 새 라벨 경로에는 별도 실패 콜백을 등록하지 않는다.

    getFeatureCollection() -> Array<U3dModelShapeFeatureCollection>
        동작:
            내부 _featureCollection 배열의 공유 참조를 그대로 반환한다.

    getParam() -> U3dModelShapeLayerParam
        의존:
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_transparent}
        동작:
            이름·레벨·투명 여부·URL·원본 좌표계·스타일·속성 키·층 높이·텍스처·프록시 설정을 담은 새 객체를 반환한다. style과 textureUrl은 내부 참조이며 피처 컬렉션과 레이어 콜백은 포함하지 않는다.

    getSourceCRS() -> string
        동작:
            보관한 _sourceCRS 문자열을 반환한다.

    setSourceCRS(sourceCRS: string) -> void
        동작:
            입력을 _sourceCRS에 저장한다. 기존 모델 좌표를 재투영하거나 재생성하지 않는다.

    addFeatureCollection(featureCollection: U3dModelShapeFeatureCollection) -> Promise<Array<U3dModelShapeMesh> | undefined> | undefined
        의존:
            deferred — 완료·실패 통지; 함수: {deferred()}
            defined — 존재 판정; 함수: {defined()}
            UDEF — 직접 호출; 함수: {UDEF.createUUID()}
            THREE — 직접 호출; 생성자: {new THREE.Box3()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_boundingBox}
        동작:
            입력이 정의되어 있으면 uuid를 새로 부여하고 원본 컬렉션을 목록에 추가하며, 아니면 undefined다.
            deferred를 만든 뒤 각 피처의 addFeature를 호출하지만 그 반환 완료를 기다리지는 않는다. _remainProcess가 0이면 공유 모델 목록으로 resolve하고 그 뒤 그룹의 바운딩 박스를 갱신하며, 아니면 인수 없이 reject한다.
            반복이나 경계 갱신 예외는 오류 값 없이 reject한다. 이미 추가한 컬렉션·모델은 롤백하지 않는다.

    addFeature(feature: U3dModelShapeFeature) -> Promise<U3dModelShapeMesh> | undefined
        인터페이스: heightFunction과 landHeightFunction의 this는 이 레이어다.
        의존:
            UExtrudeGeometry — 직접 호출; 생성자: {new UExtrudeGeometry()}
            UShpMesh — 직접 호출; 생성자: {new UShpMesh()}
            __GError__ — 직접 호출; 함수: {__GError__()}
            deferred — 완료·실패 통지; 함수: {deferred()}
            defined — 존재 판정; 함수: {defined()}
            UDEF — 직접 호출; 함수: {UDEF.createGoogleKey()}
            UMathEngine — 직접 호출; 함수: {UMathEngine.getRealScaleAtGoogle()}
            THREE — 직접 호출; 생성자: {new THREE.Shape(), new THREE.Vector3()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_drawArg, _app, dispatchEvent}
        동작:
            geometry·좌표 배열이 없거나 바깥 배열이 비어 있으면 undefined다. deferred를 만들고 진행 수를 증가시킨다.
            properties가 없으면 원본 피처에 빈 객체를 만든다. LineString 전체, Polygon의 첫 외곽선, MultiPolygon의 첫 폴리곤 첫 외곽선만 차례대로 위경도에서 월드 좌표로 변환한다. 나머지 링·폴리곤은 처리하지 않는다.
            지원하지 않는 종류 또는 로컬 변환 실패는 로그 후 undefined로 종료한다. 로컬 정점이 1개 이하이면 생성·완료 없이 deferred를 반환한다.
            정점이 2개 이상이면 Shape 윤곽을 구성한다. 층 높이는 fieldFloorHeight가 있으면 속성의 Number 변환값, 아니면 공통 층 높이다.
            건물 높이는 heightFunction(feature), hg, bd_height, fieldheight, fieldFloor 순으로 선택하고 기본값 100을 사용한다. fieldheight 옵션이 있으면 그 속성 값이 없어도 층수 경로로 넘어가지 않는다. 높이 콜백의 receiver는 레이어다.
            메르카토르 실제 스케일 역수를 높이에 곱하고 깊이/층 높이를 floor하여 압출 단계 수를 정한다. 층 강조 모델을 만들고 압출 geometry를 정리·중심 이동하며 UV 변환 예외는 로그만 남겨 계속한다.
            건물 Mesh를 만들고 강조 Mesh를 자식으로 배치하며 인덱스를 준비한다. 피처와 properties에 Mesh uuid를 기록하고 두 원본 참조를 모델에 연결하여 속성 목록에 추가한다.
            지면 높이는 landHeightFunction, el, fieldlandheight 순으로 선택하며 일반 속성 값의 NaN은 0으로 바꾼다. 콜백 반환은 별도 NaN 보정을 하지 않는다.
            _isShowLabel이 true이면 라벨을 먼저 만든다.
            landHeight·buildHeight 기록과 지형 높이 조회·자동 높이 갱신 등록은 _isShowLabel 여부와 관계없이 수행하며 이 구간의 예외는 로그만 남긴다. 자동 갱신 콜백은 지면+건물 반높이를 위치에 적용한 뒤 행렬과 라벨을 갱신한다.
            피처 id 또는 최초 좌표와 모델 z로 식별자를 만들고 스타일을 적용한다. 단일 재질일 때 불투명도 조건에 따라 깊이 보정을 설정한다.
            바운딩 박스·타일 색인·중심을 준비한다. _drawLine이 true이면 외곽선을 만든다. 모델을 숨긴 채 압출 그룹과 모델 목록에 등록하고 수동 행렬 갱신 후 MESH.LOADED 이벤트를 내보내고 모델로 resolve한다.
            외부 try의 예외는 값 없이 reject하며 이미 발생한 속성·객체 변경을 되돌리지 않는다. 조기 반환·성공·실패 모두 finally에서 진행 수를 감소시킨다.

    traverseAllFloor(mesh: U3dModelShapeMesh, callback: U3dModelShapeFloorCallback) -> void
        의존:
            __GError__ — 직접 호출; 함수: {__GError__()}
            defined — 존재 판정; 함수: {defined()}
            THREE — 직접 호출; 생성자: {new THREE.Vector3()}
        동작:
            mesh가 undefined면 콜백 없이 종료한다. geometry 또는 층 정보가 없으면 오류 로그 뒤 모든 인수가 undefined인 콜백을 한 번 호출한다.
            층별 삼각형을 인접한 둘씩 묶고 좌표 문자열 키로 중복 정점을 제거한다. 정점에 mesh.position을 더한 새 벡터 배열·첫 면 폭·층 값·첫 법선을 콜백에 전달한다. 홀수 마지막 삼각형은 처리하지 않으며 콜백 예외는 전파한다.

    traverseFloor(mesh: U3dModelShapeMesh, floor: number, callback: U3dModelShapeFloorCallback) -> void
        의존:
            __GError__ — 직접 호출; 함수: {__GError__()}
            defined — 존재 판정; 함수: {defined()}
        동작:
            mesh가 undefined면 종료한다. geometry·층 목록·지정 층이 없으면 로그 후 undefined 인수 다섯 개로 콜백을 호출한다.
            선택 층에서 인접한 두 삼각형씩 Map으로 중복을 제거한다. 로컬 정점에 mesh.position을 더한 새 배열·첫 면 폭·층 값·첫 법선을 콜백에 전달한다. 콜백 예외는 전파한다.

    getFloor(model: Mesh, vertices: WorldPositionVector3 | Array<WorldPositionVector3>) -> number | 'roof' | undefined
        의존:
            __GError__ — 직접 호출; 함수: {__GError__()}
            defined — 존재 판정; 함수: {defined()}
            THREE — 직접 호출; 생성자: {new THREE.Vector3()}
        동작:
            model.uuid로 실제 등록 모델을 찾고 없으면 undefined다. geometry·층 정보가 없으면 오류를 기록하고 undefined다.
            단일 정점도 배열로 바꿔 모델 위치를 뺀 정점들의 최저 z를 소수 둘째 자리 문자열로 만들고 층 계산 결과를 반환한다.

    setSelectFloor(model: Mesh, target: Array<WorldPositionVector3> | WorldPositionVector3 | number, option: Partial<{color: ColorRepresentation, opacity: number}> = {}) -> void
        의존:
            __GError__ — 직접 호출; 함수: {__GError__()}
            defined — 존재 판정; 함수: {defined()}
            THREE — 직접 호출; 생성자: {new THREE.Color(), new THREE.Vector3()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_app}
        동작:
            등록 모델을 uuid로 찾고 geometry·층 정보가 없으면 오류 후 종료한다. 배열 target은 모델 위치를 뺀 최저 상대 z를 소수 둘째 자리로 반올림해 층을 계산한다. Vector3 target도 모델 위치를 빼지만 반올림 없이 상대 z를 사용한다. 나머지는 층 번호로 사용한다.
            roof이면 마지막 steps 층으로 대체한다. 해당 층 정보가 없으면 로그 후 종료한다. 첫 면의 최저 z를 선택 높이로 쓴다.
            highLight 자식에 정의된 색·불투명도를 적용하고 transparent를 불투명도!=1로 정한다. 표시·높이·행렬을 갱신한 뒤 선택 사전 항목을 새 highLight 참조로 교체한다. opacity가 정확히 0이면 renderer.localClippingEnabled=true로 두고 클리핑을 설정한다.

    clearSelectFloor(mesh: Mesh) -> void
        의존:
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_app}
        동작:
            지정 mesh가 있으면 선택된 강조 모델을 숨기고 위·아래 평면이 둘 다 있을 때 부모 재질의 clippingPlanes를 비운 뒤 사전 항목을 삭제한다. 개별 삭제에서는 전역 클리핑 설정을 끄지 않는다.
            mesh가 없으면 모든 선택 항목에 같은 처리를 하고 삭제한 뒤 renderer.localClippingEnabled=false로 설정한다.

    removeModelAsFeatureCollection(featureCollection: U3dModelShapeFeatureCollection) -> void
        의존:
            defined — 존재 판정; 함수: {defined()}
        동작:
            uuid가 같은 첫 등록 컬렉션을 찾아 목록에서 제거한다. 찾은 등록 컬렉션의 피처마다 removeModel을 호출하며, 같은 uuid가 없는 입력의 피처는 제거하지 않는다.

    searchModelAsFeatureCollection(featureCollection: U3dModelShapeFeatureCollection) -> Array<U3dModelShapeMesh>
        의존:
            defined — 존재 판정; 함수: {defined()}
        동작:
            uuid가 같은 등록 컬렉션을 찾아 그 피처들의 모델을 순서대로 조회한다. 존재하는 공유 모델만 담은 새 배열을 반환하며 컬렉션이 없으면 빈 배열이다.

    searchModelAsFeature(feature: U3dModelShapeFeature) -> U3dModelShapeMesh | undefined
        동작:
            등록 모델 중 uuid가 feature.uuid와 같은 첫 모델을 반환하며 없으면 undefined다.

    searchFeatureAsMesh(mesh: Mesh) -> {featureCollection: U3dModelShapeFeatureCollection | undefined, feature: U3dModelShapeFeature | undefined}
        동작:
            mesh.uuid가 속한 컬렉션과 해당 uuid의 원본 피처를 각각 찾아 새 결과 객체에 넣는다. 찾지 못한 값은 undefined이며 저장된 _ufeature가 없는 모델의 접근 예외는 잡지 않는다.

    removeModel(feature: U3dModelShapeFeature | Mesh) -> void
        의존:
            UDEF — 직접 호출; 함수: {UDEF.disposeObject3D()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_app}
        동작:
            모델 목록을 뒤에서부터 순회하여 uuid가 일치하는 모델의 자동 높이 갱신을 해제하고 목록·그룹·scene에서 제거한다. 관련 타일 배열에서 uuid를 제거하고 빈 항목과 모델 색인을 지운 뒤 모델을 해제한다.
            사용자 그룹 자식 중 originMeshID가 일치하는 복제 모델의 라벨과 모델을 제거·해제한다. 속성 목록도 역순으로 같은 uuid를 제거한다.

    getBoundingBox() -> Box3 | undefined
        의존:
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_boundingBox}
        동작:
            내부 _boundingBox 참조를 그대로 반환한다.

    override update(drawArg: UDrawArg, curTime?: number) -> void
        의존:
            defined — 존재 판정; 함수: {defined()}
            UDEF — 직접 호출; 함수: {UDEF.createPromise()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_visible, dispatchEvent}
        동작:
            drawArg가 없으면 종료한다. 레이어가 숨겨졌으면 처리 대기열을 비우고 종료하며 대기열이 비어 있어도 종료한다.
            시간 제한기가 실행을 허용할 때만 UDEF.createPromise 안에서 최대 _maxProcess개 타일 키를 앞에서 꺼내고, 해당 타일 모델 중 아직 보이지 않는 모델을 scene에 추가한 뒤 MESH.DRAWN 이벤트를 보낸다. executor 예외는 reject하나 이 Promise를 반환하지 않는다.
            실행 허용 여부와 관계없이 이 경로 끝에서 다음 갱신 간격을 20으로 설정한다.

    override show(show: boolean) -> void
        의존:
            U3dModelLayer — 표시 상태; 함수: {U3dModelLayer.prototype.show.call()}
        동작:
            부모 show를 호출하되 그 결과를 반환하지 않는다. show가 falsy일 때만 라벨을 끈다.

    getDrawnModel() -> Array<Mesh>
        의존:
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_scene}
        동작:
            scene 직계 자식 중 THREE.Mesh 또는 UMesh인 참조를 새 배열로 반환한다. visible 값은 검사하지 않는다.

    showLabel(show: boolean) -> void
        의존:
            defined — 존재 판정; 함수: {defined()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_app, _drawArg}
        동작:
            각 Mesh의 기존 라벨을 show에 따라 주석 장면에 추가하거나 분리·해제한다. 라벨이 없고 show가 true이면 생성 성공 후 표시·등록하고 실패는 console.log로 기록한다.
            _isShowLabel은 실제 모델별 라벨 처리 경로에서만 변경한다. 공통 라벨이 있으면 별도로 표시 또는 숨김·장면 분리를 적용한다.

    override updateHeight(tile: U3dQuadTile, drawArg?: UDrawArg, force?: boolean) -> void
        동작:
            updateHeightFromMesh에 같은 인수를 전달하고 그 결과를 반환한다.

    override createModel(tile: U3dQuadTile) -> Promise<boolean> | undefined
        의존:
            U3dModelLayer — 타일 생성 조건; 함수: {U3dModelLayer.prototype.createModel.call()}
            defined — 존재 판정; 함수: {defined()}
            U3dModelLayer — 직접 호출; 함수: {U3dModelLayer.prototype.createModel.call()}
            UDEF — 직접 호출; 함수: {UDEF.createPromise()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {resetStateTile, _scene, _visible, getStateTile, setStateTile}
        동작:
            부모 createModel을 먼저 호출한다. 부모 결과가 false이면 해당 타일 레이어 상태를 초기화하고 undefined로 종료한다.
            그 뒤 tile·scene·drawArg가 없으면 초기화 후 종료한다. 레이어가 숨겨짐·이미 로딩 이상 상태·최소 레벨 미만이면 완료 상태로 바꿔 undefined로 종료한다.
            UDEF.createPromise를 반환한다. 키가 이미 대기열에 있으면 완료 상태와 true를 반환한다. 그 외에는 타일 색인의 모델별 키가 이미 truthy일 때만 true로 기록하고 키를 대기열에 넣는다. false 항목을 활성화하지 않는다.
            성공은 타일 완료 후 true로 resolve하며 try 내부 실패는 타일 초기화 후 false로 reject한다. 부모 호출과 앞선 상태 접근 예외는 이 try 밖이다.

    override disposeTile(tile: U3dQuadTile) -> void
        의존:
            defined — 존재 판정; 함수: {defined()}
            U3dMessage — 직접 호출; 함수: {U3dMessage.error()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {resetStateTile, createKeyFromTile}
        동작:
            tile이 없으면 종료한다. 타일 레이어 상태를 초기화하고 처리 대기열에서 같은 키 하나를 제거한다.
            그 키의 모델 참조 표시를 false로 바꾼 뒤 다른 타일 키가 하나라도 truthy인지 확인한다. 다른 참조가 없고 모델이 visible=true일 때 scene에서 제거하고 _allModelIsAddScene=false로 기록한다. 색인 처리 예외는 5436464 오류로 기록한다.

    updateHeightFromMesh(tile: U3dQuadTile, drawArg?: UDrawArg, force?: boolean) -> void
        의존:
            defined — 존재 판정; 함수: {defined()}
            THREE — 직접 호출; 생성자: {new THREE.Box3(), new THREE.Vector3()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {getCache}
        동작:
            tile·drawArg 또는 getCache(tile) 결과가 없으면 종료한다. 캐시 그룹의 각 자식에서 _bbox가 정의되지 않으면 Box3.setFromObject(mesh)한 값을 _bbox에 기록한다. _bbox의 존재 여부와 관계없이 getCenter(pos) 결과를 mesh._center에 보관한다.
            현재 타일의 높이를 적용한다. 실패하고 부모 타일이 있으면 같은 보조 함수로 부모 타일 높이를 다시 적용한다. 부모도 실패하거나 부모가 없으면 모델 z를 0으로 설정한다. 성공한 높이는 유지하며 기반 레이어의 updateHeight를 호출하지 않는다.

    setGroupOriginPosition() -> void
        동작:
            각 원본 모델의 position을 _oriPosition에 복제하고 그 모델의 직계 자식마다 position을 _oriPosition에 복제한다. 사용자 그룹 목록을 순회하지 않는다.

    setFloorFromGroupName(floorCount: number, height: number | undefined, commonName: string, propertyName: string) -> Array<UGroup> | undefined
        의존:
            UGroup — 직접 호출; 생성자: {new UGroup()}
            defined — 존재 판정; 함수: {defined()}
        동작:
            floorCount가 정의되지 않았거나 모델 목록이 비어 있으면 undefined다. height가 없으면 0을 쓴다.
            propertyName 값과 commonName으로 모델을 그룹화한다. 그룹 키의 첫 항목을 제외한 나머지부터 층별 새 UGroup을 만들며 UMesh만 clone한다.
            원본과 복제의 name을 같게 지정하고 _oriPosition 참조를 공유한다. 복제 z에 층 높이 배수를 더하고 층 설정 표시·비표시 상태·originMeshID를 기록한다.
            비어 있지 않은 그룹만 보관한다. 원본의 층 설정 표시를 해제한 뒤 _userGroupList를 새 목록으로 교체·반환하며 이전 그룹은 해제하지 않는다.

    moveUserGroupPosition(x: number, y: number, z: number) -> void
        인터페이스: x·y·z는 생략할 수 있으며 각각 0으로 처리한다.
        의존:
            defined — 존재 판정; 함수: {defined()}
        동작:
            사용자 그룹이 없으면 종료하며 정의되지 않은 x·y·z는 0이다. 전체 그룹 수와 역순 order를 전달하여 그룹별 위치를 설정한다.

    setUserGroupPosition(group: UGroup, position?: Vector3 | Vector3Like, floorCount: number, order: number) -> void
        인터페이스: position·floorCount·order는 생략할 수 있으며 각각 영벡터·1·0으로 처리한다.
        의존:
            defined — 존재 판정; 함수: {defined()}
            THREE — 직접 호출; 생성자: {new THREE.Vector3()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_drawArg, _group}
        동작:
            정의되지 않은 floorCount는 1, order는 0, position은 영벡터다. Vector3가 아니면 x·y·z를 복사한 벡터를 만든다.
            그림자가 켜져 있으면 needsUpdate를 설정한다. 그룹이 없으면 종료한다. 각 자식과 name이 같은 원본의 _oriPosition에 전체 이동량에서 order 배수를 뺀 값을 적용하고 층 이동 상태와 행렬을 갱신한다.

    animateInterval(interval: number, x: number, y: number, z: number) -> Promise<void> | undefined
        인터페이스: x·y·z는 생략할 수 있으며 각각 0으로 처리한다.
        의존:
            deferred — 완료·실패 통지; 함수: {deferred()}
            defined — 존재 판정; 함수: {defined()}
        동작:
            deferred 생성 후 interval이 없거나 유한수가 아니거나 0 이하이면 undefined다. x·y·z의 미정의 값은 0이다. 먼저 사용자 그룹 이동을 0으로 초기화한다.
            단계 수는 max(1, round(interval*10))이며 50ms마다 이동 비율을 증가시킨다. 기존 애니메이션이 있으면 타이머를 취소하고 기존 deferred를 인수 없이 reject한다.
            마지막 단계에서는 타이머를 취소하고 _activeInterval을 undefined로 바꾼 뒤 삭제하고 resolve한다. 새 타이머·deferred를 상태에 보관하여 deferred를 반환한다. 타이머 콜백 예외는 별도 처리하지 않는다.

    setShpPositionFromGeographic(geo: GeoPosition & Partial<{z: number}>) -> void
        의존:
            defined — 존재 판정; 함수: {defined()}
            THREE — 직접 호출; 생성자: {new THREE.Vector3()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_drawArg, getCenter, _boundingBox}
        동작:
            입력의 x·y, drawArg 또는 원본 경계 중심이 없으면 종료한다. 위경도를 월드 좌표로 바꾸고 z는 입력값 또는 기존 중심을 사용하여 상대 이동량을 계산한다.
            모델 색인만 비운 뒤 각 모델 위치·행렬·경계·중심·타일 색인을 갱신한다. 타일 색인 사전은 비우지 않는다. 라벨은 기존 위치에 모델 위치를 더하되 기존 z를 유지한다.
            압출 그룹으로 전체 경계를 다시 계산한다.

    setShpAllHeight(height: number, type: 'center' | 'bottom' | 'top') -> void
        인터페이스: type은 생략할 수 있으며 bottom으로 처리한다.
        의존:
            defined — 존재 판정; 함수: {defined()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_drawArg}
        동작:
            height 또는 drawArg가 없으면 종료한다. type이 falsy면 bottom이다. 각 모델의 목표 z는 center면 height, bottom이면 height+bbox.max.z, 그 외면 height-bbox.max.z이다. 계산한 높이를 적용한다.

    setShpMeshHeight(mesh: U3dModelShapeMesh, height: number, type: 'center' | 'bottom' | 'top') -> void
        인터페이스: type은 생략할 수 있으며 bottom으로 처리한다.
        의존:
            defined — 존재 판정; 함수: {defined()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_drawArg}
        동작:
            mesh·height·drawArg가 없으면 종료한다. type 기본과 높이 계산은 center=height, bottom=height+bbox.max.z, 나머지=height-bbox.max.z이며 단일 모델에 적용한다.

    setStyle(style: Partial<{color: ColorRepresentation, opacity: number, label: string}> = {}) -> void
        의존:
            defined — 존재 판정; 함수: {defined()}
        동작:
            정의된 color·opacity·label을 공유 _style에 반영한다. THREE.Mesh이면서 material이 있는 모델의 단일·배열 재질을 차례로 변경한다.
            기존 _oriColor가 정의되어 있으면 공통 색으로 바꾸고, _oriOpacity가 정의되어 있을 때만 변경 전 material.opacity를 기록한다. 새 색·불투명도·transparent를 적용한다.
            윗면·옆면 분리 설정일 때 opacity>=1이면 깊이 보정을 끄고 그 외에는 켠다. 재질을 갱신 상태로 표시한다. 공유 _style.label이 정의되어 있으면 이번 입력에 label이 없어도 공통 라벨을 교체한다.

    getStyle() -> U3dModelShapeStyle
        동작:
            공유 _style 객체를 그대로 반환한다.

    override getWorkingLevel3() -> number
        동작:
            진행 중 피처 수 _remainProcess와 타일 처리 대기열 길이의 합을 반환한다.

    removeLabelToBoundingBox() -> void
        의존:
            defined — 존재 판정; 함수: {defined()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_drawArg}
        동작:
            공통 라벨이 없으면 종료한다. 숨기고 주석 장면에서 제거한 뒤 참조를 undefined로 바꾼다. 이 함수는 라벨 자원을 dispose하지 않는다.

    setSideStyle(mesh: U3dModelShapeMesh, opt?: U3dModelShapeMaterialOptions) -> void
        의존:
            defaultValue — 기본값 선택; 함수: {defaultValue()}
            defined — 존재 판정; 함수: {defined()}
            THREE — 직접 호출; 생성자: {new THREE.Color(), new THREE.MeshPhysicalMaterial()}
        동작:
            mesh가 없거나 THREE.Mesh 인스턴스가 아니면 종료한다. opt가 falsy면 빈 객체를 쓴다. 색상 0xfaebd7, 발광색 0, metalness=0, roughness=0.8, opacity=1, DoubleSide가 기본이다. transparent 기본은 보정된 opacity가 아니라 opt.opacity<1이다.
            회색조이면 색상 최대 채널을 세 채널에 적용하고 그 색을 발광색으로도 쓴다. 새 MeshPhysicalMaterial을 만들고 깊이 쓰기·polygonOffset·원본 발광색을 설정한다.
            양수 숫자 scale은 세 축에 같게, 객체 scale은 축별로 적용한다. 기존 재질 배열이 비어 있지 않으면 정의된 두 번째 재질을 dispose하고 교체하며, 아니면 빈 배열의 인덱스 1에 새 재질을 넣는다.

    setTopStyle(mesh: U3dModelShapeMesh, opt?: U3dModelShapeMaterialOptions) -> void
        의존:
            defaultValue — 기본값 선택; 함수: {defaultValue()}
            defined — 존재 판정; 함수: {defined()}
            THREE — 직접 호출; 생성자: {new THREE.Color(), new THREE.MeshPhysicalMaterial()}
            U3dModelLayer — 기반 계열의 상태·API 접근; 속성 읽기: {_opacity}
        동작:
            mesh가 없거나 THREE.Mesh 인스턴스가 아니면 종료한다. 새 물리 재질의 색·발광·금속성·거칠기·면 방향·깊이 보정을 설정한다. opacity 기본은 레이어 _opacity이고 transparent 기본은 결정된 opacity<1이다.
            회색조·scale 반영 뒤 기존 비어 있지 않은 재질 배열의 첫 재질을 dispose하고 교체한다. 그 외에는 새 재질 한 항목의 배열을 만든다. 이 새 배열 경로에서 side가 DoubleSide일 때만 geometry.groups[0].count를 _topDrawCount로 설정한다.

    createLabel(mesh: U3dModelShapeMesh, opt: U3dModelShapeLabelOptions) -> Promise<void>
        의존:
            U3dPOI — 직접 호출; 생성자: {new U3dPOI()}
            deferred — 완료·실패 통지; 함수: {deferred()}
            defined — 존재 판정; 함수: {defined()}
            THREE — 직접 호출; 생성자: {new THREE.Vector3()}
        동작:
            deferred를 만든다. mesh가 없으면 reject하고 반환한다. opt에 label과 image가 모두 없으면 reject하고 정보 로그를 남겨 반환한다.
            바운딩 박스·중심을 준비하고 위치 입력이 없으면 모델 위치에서 건물 반높이만큼 위를 사용한다. U3dPOI를 생성하여 model.userData.label에 저장한다.
            라벨이 정의되면 인수 없이 resolve하고 아니면 reject한 deferred를 반환한다. 옵션 접근·POI 생성 중 동기 예외는 별도 catch가 없어 호출자에게 전파된다.

    updateLabel(mesh: U3dModelShapeMesh, position?: Vector3) -> void
        의존:
            defined — 존재 판정; 함수: {defined()}
        동작:
            mesh 또는 그 라벨이 없으면 종료한다. position이 없으면 모델 위치를 복제하고 라벨 setPosition에 전달한다.

setSelectTransparent(child: U3dModelShapeHighlightMesh, mesh: U3dModelShapeMesh, minHeight: number) -> void
    인터페이스: this는 U3dModelShapeLayer이며 호출한 레이어의 상태를 읽거나 변경한다.
    의존:
        THREE — 직접 호출; 생성자: {new THREE.Plane(), new THREE.Vector3()}
    동작:
        boundingSphere가 undefined일 때만 계산한다. 행렬의 월드 이동과 선택 높이·강조 깊이로 상하 경계를 계산한다.
        선택 사전 항목이 있고 두 평면이 모두 undefined일 때만 새 Plane 두 개를 만든다. 위쪽은 z 법선 +1, 아래쪽은 -1로 갱신한다.
        모델을 traverse하며 highLight를 제외한 자식의 각 재질에 clipIntersection=true와 두 평면 배열을 설정한다.

setMeshHeight(mesh: U3dModelShapeMesh, height: number) -> void
    인터페이스: this는 U3dModelShapeLayer이며 호출한 레이어의 상태를 읽거나 변경한다.
    의존:
        defined — 존재 판정; 함수: {defined()}
        THREE — 직접 호출; 생성자: {new THREE.Vector3()}
        Vector3 — 직접 호출; 생성자: {new Vector3()}
    동작:
        mesh.position.z를 height로 바꾸고 행렬·경계·중심·타일 색인을 갱신한다. 라벨이 있으면 기존 위치에 모델 위치를 더하되 z는 기존 라벨 값으로 되돌려 반영한다.

loadTexture(textureUrl: string) -> Promise<void>
    인터페이스: this는 U3dModelShapeLayer이며 호출한 레이어의 상태를 읽거나 변경한다.
    의존:
        UTextureLoader — 직접 호출; 생성자: {new UTextureLoader()}
        deferred — 완료·실패 통지; 함수: {deferred()}
        UDEF — 텍스처 크기 유지; 함수: {UDEF.noResizeTexture()}
    동작:
        프록시 문자열과 textureUrl을 합쳐 새 UTextureLoader로 요청한다. 성공 시 텍스처 리사이즈를 막고 최종 요청 URL을 키로 캐시에 저장한 뒤 deferred를 resolve한다.
        로딩 오류 콜백은 로그 뒤 같은 오류로 reject한다. 반환 객체는 프로젝트 deferred이며 네이티브 Promise의 체인 예외 전파로 해석하지 않는다.

setStyle(mesh: U3dModelShapeMesh) -> void
    인터페이스: this는 U3dModelShapeLayer이며 호출한 레이어의 상태를 읽거나 변경한다.
    의존:
        __GError__ — 직접 호출; 함수: {__GError__()}
        defaultValue — 기본값 선택; 함수: {defaultValue()}
        defined — 존재 판정; 함수: {defined()}
        THREE — 재질 생성; 생성자: {new THREE.MeshLambertMaterial()}
        __GInfo__ — 텍스처 진단; 함수: {__GInfo__()}
    동작:
        재질이 없으면 0468008 오류 후 종료한다. 원본 feature가 있고 styleFunction이 함수일 때 레이어 receiver로 호출한다. 반환값이 falsy면 공통 스타일 또는 빈 객체를 쓴다.
        색·불투명도는 피처 스타일, 모델 getter, 공통 스타일 순으로 선택하고 visible 기본은 true다. opacity<=0이면 visible=false로 만들며 이 값을 공유 공통 스타일에도 기록한다.
        userData.styleinfo에 새 visible 객체를 기록한다. 숨김이면 모델을 숨긴 뒤 재질을 교체하지 않고 종료한다.
        imgvisible=true 또는 미지정 imgvisible와 레이어 텍스처 사용 조건이 충족되면 텍스처 경로를 고른다. 단색 경로에서는 이전 map·재질을 해제하며 _setTopSideStyle이 true일 때 윗면·옆면 분리 재질을 만들고 아니면 단일 Lambert 재질을 만든다.
        multipleTexture이면 URL별 캐시 텍스처를 복제하여 재질 목록을 만들고 이전 재질을 해제한다. 하나면 단일 재질, 그 외면 배열이다. multiSideFunction이 있으면 converted UV로 바꾸고 면별 재질을 적용한다.
        기본 텍스처 경로는 imgurl 또는 레이어 URL을 배열로 만든다. 비어 있으면 단색 경로다. 캐시의 top·side 텍스처를 clone하고 origin UV를 적용한다. 상하면 분리가 없으면 단일 재질, 있으면 두 재질 배열이다. 없는 캐시의 clone 접근은 뒤의 존재 검사보다 먼저 실행될 수 있다.

setHighlightPolygon(points: Array<Array<number>>, floorHeight: number) -> U3dModelShapeHighlightMesh
    의존:
        UExtrudeGeometry — 직접 호출; 생성자: {new UExtrudeGeometry()}
        UMesh — 직접 호출; 생성자: {new UMesh()}
        THREE — 직접 호출; 생성자: {new THREE.MeshBasicMaterial(), new THREE.Shape(), new THREE.Vector3()}
        ol.geom.Polygon, ol.Feature, jsts.io.OL3Parser — 윤곽 버퍼; 생성자: {new ol.geom.Polygon(), new ol.Feature(), new __GEONDT__.jsts.io.OL3Parser()}
    동작:
        입력 윤곽으로 OpenLayers Polygon·Feature를 만들고 jsts OL3Parser로 읽어 0.5만큼 buffer한 좌표를 얻는다.
        버퍼 윤곽을 층 높이로 한 단계 압출하고 경계 중심을 뺀 뒤 초록색·opacity=0.7·alphaTest=0.3·깊이 보정 Basic 재질의 UMesh를 만든다. 중심 위치·경계구·renderOrder=10·name=highLight·visible=false를 설정하여 반환한다.

setMultipleSTexture(mesh: U3dModelShapeMesh, callback: U3dModelShapeMultiSideFunction) -> void
    인터페이스: this는 U3dModelShapeLayer이며 호출한 레이어의 상태를 읽거나 변경한다.
    의존:
        __GError__ — 직접 호출; 함수: {__GError__()}
        defined — 존재 판정; 함수: {defined()}
        THREE — 직접 호출; 생성자: {new THREE.Vector3()}
    동작:
        geometry 그룹을 비운다. _floor가 없으면 만들되 기존 층 배열을 비우지는 않는다. 모든 삼각형의 위치·법선·가장 긴 변을 읽어 층 높이를 제외한 폭을 구한다. 수평면은 아래쪽도 roof로 분류하며 그 외는 최저 z로 층을 계산한다.
        층마다 인접한 두 삼각형의 정점을 중복 제거하여 모델 위치를 더한 배열과 폭·층·법선을 callback에 직접 전달한다. callback 예외는 4680772로 기록하고 계속하며 falsy 결과는 제외한다. 같은 면 키에는 첫 스타일만 보관한다.
        면 순서대로 스타일을 조회한다. 없는 면은 진행 중 그룹을 마감하고 건너뛴다. materialIndex가 비면 로그를 남기지만 뒤 처리를 중단하지 않는다.
        인덱스가 둘 이상이면 앞의 두 재질만 합성 대상으로 쓰며 캐시 키와 재질 uuid로 기존 합성 재질을 찾는다. 결과 인덱스 0도 falsy라서 새 합성 경로로 들어간다. 새 합성 텍스처를 복제 재질에 설정하고 모델 재질 목록·공유 합성 캐시에 추가한다.
        repeat>1이고 재질에 _updateRepeat가 없으면 반복 텍스처로 교체·갱신 표시하고 _updateRepeat를 빈 객체로 둔다. 연속하는 같은 재질 인덱스의 면을 그룹으로 합치고 마지막 그룹도 등록한다.

setTileIndex(mesh: U3dModelShapeMesh) -> void
    인터페이스: this는 U3dModelShapeLayer이며 호출한 레이어의 상태를 읽거나 변경한다.
    의존:
        UDEF — 직접 호출; 함수: {UDEF.createKey()}
    동작:
        경계가 없으면 모델에서 얻는다. 모델 색인 항목이 없으면 model 참조를 넣어 만든다. 경계의 네 모서리를 월드 좌표(EPSG:3857)로 바꾸고 지정 최소 레벨 타일로 변환한다.
        각 타일 키에 대한 모델 표시를 false로 설정한다. 타일 색인이 없으면 uuid 한 개 배열을 만들고 있으면 중복 검사 없이 uuid를 추가한다.

createEdgeLine(mesh: U3dModelShapeMesh, opt?: Partial<{color: ColorRepresentation, linewidth: number}>) -> void
    인터페이스: this는 U3dModelShapeLayer이며 호출한 레이어의 상태를 읽거나 변경한다.
    의존:
        U3dPoint — 직접 호출; 생성자: {new U3dPoint()}
        defaultValue — 기본값 선택; 함수: {defaultValue()}
        THREE — 직접 호출; 생성자: {new THREE.Color(), new THREE.EdgesGeometry(), new THREE.LineBasicMaterial(), new THREE.LineSegments(), new THREE.Vector3()}
    동작:
        옵션이 falsy면 빈 객체로 바꾸고 전달 객체의 color·linewidth에 기본값 0x353535·1을 기록한다. EdgesGeometry와 색상 LineBasicMaterial로 LineSegments를 만들어 모델 자식으로 넣는다. linewidth는 생성 재질에 전달하지 않는다. test=false 분기는 실행하지 않는다.

getLabelText_(mesh: U3dModelShapeMesh) -> string | undefined
    인터페이스: this는 U3dModelShapeLayer이며 호출한 레이어의 상태를 읽거나 변경한다.
    의존:
        defined — 존재 판정; 함수: {defined()}
    동작:
        라벨 필드가 정의되어 있으면 모델 속성의 해당 값을 그대로 반환하되 undefined일 때만 빈 문자열로 바꾼다. 필드가 없으면 mesh._name을 반환하며 강제 문자열 변환은 하지 않는다.

getDefaultMaterial() -> MeshBasicMaterial
    인터페이스: this는 U3dModelShapeLayer이며 호출한 레이어의 상태를 읽거나 변경한다.
    의존:
        THREE — 직접 호출; 생성자: {new THREE.MeshBasicMaterial()}
    동작:
        호출되지 않는 보조 함수다. 호출하면 _opacity<1 여부로 transparent를 정한 새 MeshBasicMaterial을 반환한다.

updateHeightEx(pos: Vector3, level: number, model: U3dModelShapeMesh, tile: U3dQuadTile, drawArg: UDrawArg, force?: boolean) -> boolean
    의존:
        defined — 존재 판정; 함수: {defined()}
    동작:
        tile·model·drawArg가 없으면 false다. force가 정의되지 않았고 model.userData._rlevel이 tile._rlevel과 같으면 true다. force=false도 정의된 값이므로 재계산한다.
        높이 레이어가 없으면 모델 z를 0으로 설정하고 true다. 있으면 먼저 z를 0으로 만든 뒤 타일의 좌표 높이를 조회한다.
        높이가 정의되고 UDEF.INVALID·UDEF.TERRAIN_NO_DATA가 아니면 z와 _rlevel을 갱신하고 true를 반환하며 그 외에는 false다. level 매개변수는 판정에 사용하지 않는다.

setLabelToBoundingBox(labelText: string | undefined) -> void
    인터페이스: this는 U3dModelShapeLayer이며 호출한 레이어의 상태를 읽거나 변경한다.
    의존:
        U3dPOI — 직접 호출; 생성자: {new U3dPOI()}
        defined — 존재 판정; 함수: {defined()}
        THREE — 직접 호출; 생성자: {new THREE.Vector3()}
    동작:
        전체 경계 중심으로 새 U3dPOI를 만든다. labelText 미정의 값은 빈 문자열이다. 이전 공통 라벨이 있으면 장면에서만 분리하고 해제하지 않는다. 새 라벨을 저장·표시·주석 장면에 추가한다.

debugShape(shape: Shape, center: Vector2 | Vector3) -> void
    인터페이스: this는 U3dModelShapeLayer이며 호출한 레이어의 상태를 읽거나 변경한다.
    의존:
        THREE — 직접 호출; 생성자: {new THREE.BufferGeometry(), new THREE.LineBasicMaterial(), new THREE.LineLoop()}
    동작:
        현재 호출되지 않는 진단 함수다. 호출하면 shape.getPoints()로 만든 BufferGeometry에 빨간 LineLoop를 구성한다. 깊이 읽기·쓰기와 프러스텀 검사를 끄고 transparent=true·renderOrder=999999·matrixAutoUpdate=true로 둔다. 위치를 (center.x, center.y, 200)으로 정한 뒤 레이어 scene에 추가한다.

U3dModelShapeLayerParam 타입 정의
    name: string
    minlevel: number
    maxlevel: number
    transparent: boolean
    url: string | undefined
    sourceCRS: string
    style: U3dModelShapeStyle
    fieldHeight: string | undefined
    fieldLandHeight: string | undefined
    fieldLabelText: string | undefined
    fieldFloor: string | undefined
    floorHeight: number
    useTexture: boolean
    textureUrl: string | Array<string>
    proxyurl: string
    useproxy: boolean | undefined

U3dModelShapeStyle 타입 정의
    color: ColorRepresentation
    opacity: number
    visible: boolean
    side?: Side
    label?: string
    imgvisible?: boolean
    imgurl?: string | Array<string>
    multipleTexture?: boolean
    multiSideFunction?: U3dModelShapeMultiSideFunction

U3dModelShapeFaceStyleResult 타입 정의
    undefined | U3dModelShapeFaceStyle

U3dModelShapeFaceStyle 타입 정의
    materialIndex: Array<number>
    imageScale?: number
    imageSize?: number
    repeat?: number

U3dModelShapeFloorFace 타입 정의
    floor: number | 'roof'
    vertices: Array<Vector3>
    normals: Array<Vector3>
    width: number

U3dModelShapeFloorCallback 함수 타입 정의
    (mesh: U3dModelShapeMesh | undefined, vertices: Array<WorldPositionVector3> | undefined, width: number | undefined, floor: number | 'roof' | undefined, normal: Vector3 | undefined) -> void

U3dModelShapeMultiSideFunction 함수 타입 정의
    (mesh: U3dModelShapeMesh, vertices: Array<WorldPositionVector3>, width: number, floor: number | 'roof', normal: Vector3) -> U3dModelShapeFaceStyleResult

U3dModelShapeStyleResult 타입 정의
    undefined | Partial<U3dModelShapeStyle>

U3dModelShapeStyleFunction 함수 타입 정의
    (feature: U3dModelShapeFeature) -> U3dModelShapeStyleResult

U3dModelShapeGeometry_Content 타입 정의
    _floor?: Record<string, Array<U3dModelShapeFloorFace>>

U3dModelShapeGeometry 타입 정의
    UExtrudeGeometry & U3dModelShapeGeometry_Content

U3dModelShapeMeshUserData 타입 정의
    label?: U3dPOI
    landHeight?: number
    buildHeight?: number
    id?: string
    styleinfo?: {visible: boolean}
    originMeshID?: string
    _rlevel?: number

U3dModelShapeMesh_Content 타입 정의
    _center?: Vector3
    _oriPosition?: Vector3
    _isFloorSet?: boolean
    _name?: string
    _ufeature: U3dModelShapeFeature | undefined
    _uproperties: KeyValue | undefined
    geometry: U3dModelShapeGeometry
    userData: U3dModelShapeMeshUserData
    setManualUpdate: () => void

U3dModelShapeMesh 타입 정의
    UShpMesh & U3dModelShapeMesh_Content

U3dModelShapeHighlightMesh_Content 타입 정의
    material: MeshBasicMaterial
    geometry: UExtrudeGeometry
    setManualUpdate: () => void

U3dModelShapeHighlightMesh 타입 정의
    UMesh & U3dModelShapeHighlightMesh_Content

U3dModelShapeSelectedFloor 타입 정의
    highLight: U3dModelShapeHighlightMesh
    upPlane?: Plane
    downPlane?: Plane

U3dModelShapeModelIndex 타입 정의
    {model: U3dModelShapeMesh} & Record<string, boolean | U3dModelShapeMesh>

U3dModelShapeLabelOptions 타입 정의
    name?: string
    label?: string
    image?: string
    position?: Vector3
    color?: ColorRepresentation
    size?: number
    heightOffset?: number = 0
    imageSize?: number = 20

U3dModelShapeMaterialOptions 타입 정의
    color?: ColorRepresentation
    emissive?: ColorRepresentation
    metalness?: number
    roughness?: number
    opacity?: number
    transparent?: boolean
    side?: Side
    setGrayscale?: boolean
    depthWrite?: boolean
    polygonOffset?: number
    scale?: number | Vector3Like

U3dModelShapeLayerRuntimeFields 타입 정의
    Partial<{_activeInterval: U3dModelShapeActiveInterval, _allModelIsAddScene: boolean, _useproxy: boolean}>

U3dModelShapeActiveInterval 타입 정의
    timer: ReturnType<typeof setInterval>
    promise: DeferredObject<void>

U3dModelShapeGeoJSONGeometry 타입 정의
    type: 'Polygon' | 'MultiPolygon' | 'LineString'
    coordinates: Double_Array<number> | Triple_Array<number> | Array<Triple_Array<number>>

U3dModelShapeFeature 타입 정의
    uuid?: string
    id?: string
    properties?: KeyValue
    geometry: U3dModelShapeGeoJSONGeometry

U3dModelShapeFeatureCollection 타입 정의
    type?: string
    uuid?: string
    features: Array<U3dModelShapeFeature>

U3dModelShapeLayerCO_Content 타입 정의
    name?: string
    drawline?: boolean = true
    crs?: string = 'EPSG:3857'
    sourceCRS?: string = 'EPSG:5179'
    minlevel?: number = 17
    opacity?: number = 1
    transparent?: boolean = false
    url?: string = undefined
    featureCollection?: U3dModelShapeFeatureCollection = undefined
    labelInfo?: Array<KeyValue>
    style?: U3dModelShapeStyle
    setTopSideStyle?: boolean = false
    showLabel?: boolean = false
    fieldheight?: string
    fieldlandheight?: string = undefined
    fieldlabeltext?: string = undefined
    fieldFloor?: string = undefined
    floorHeight?: number = 4
    fieldFloorHeight?: string
    heightFunction?: (feature: U3dModelShapeFeature) => number = undefined
    landHeightFunction?: (feature: U3dModelShapeFeature) => number = undefined
    depthOffset?: number = 1
    styleFunction?: U3dModelShapeStyleFunction = undefined
    usetexture?: boolean = false
    textureurl?: string | Array<string>
    textureUrl?: string | Array<string>
    proxyurl?: string = ''

U3dModelShapeLayerCO 타입 정의
    U3dModelLayerCO & U3dModelShapeLayerCO_Content

```

## 4. 공통 처리 기준과 제약

```spec
좌표 변환과 지형 등록, 사용자 콜백·이벤트·완료 처리와 자원 해제의 순서는 이 단위에서 유지한다.
deferred 반환 경로는 프로젝트 대기 객체를 사용한다. 완료 전에 등록한 성공 콜백 예외는 deferred의 __GSError__로 기록하며 reject 콜백으로 전환하지 않는다. 완료 뒤 등록한 then 콜백은 직접 실행되므로 동기 예외가 전파될 수 있다.
피처·속성·스타일·모델·텍스처 URL의 공유 참조를 임의로 복사하거나 불변화하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
