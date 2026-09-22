# U3dModelDxfLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

`U3dModelDxfLayer`는 DXF 로더의 객체를 지도 좌표에 배치하고 면·선·돌출 형상으로 표시하는 모델 레이어다. 원본 폴리라인을 보관하여 선과 돌출 형상의 전환, 돌출 높이 재생성 및 그룹의 고도 보정을 제공한다. `GeOnDT.model.U3dModelDxfLayer`로 제공되며 `U3dModelLayer`, `UDXFLoader`, `U3dPOI`, `UDrawArg`와 협력한다.

## 3. 정규 자연어 수도코드

```spec
U3dDxfEntity 타입 정의
    종류별 추가 필드는 파서 입력에 따라 달라지는 원본 엔티티다.
    기반 타입: Record<string, unknown>

U3dDxfData 부분 타입 명세
    로더에 전달하는 파싱 결과다. 엔티티 종류에 따라 tables·blocks·header 등의 추가 필드도 사용하며, 로더는 처리 도중 임시 속성을 제자리 추가·제거할 수 있다.
    이 명세에서 사용하는 필드:
        entities: Array<U3dDxfEntity>

U3dDxfStyle 타입 정의
    생성 시 전달한 객체를 공유하고 부분 입력의 누락 속성을 보충하지 않는다. setStyle은 같은 객체에 병합한다.
    color?: ColorRepresentation
    opacity?: number
    label?: string

U3dDxfLabelGetter 함수 타입 정의
    () -> U3dPOI | undefined
    연결된 라벨을 반환하며 없으면 undefined다.

U3dDxfObject 타입 정의
    기반 타입: Object3D & U3dDxfObject_Content
    Three.js 객체에 DXF 분류와 선택적인 조회·스타일 API를 합성한다.

U3dDxfObject_Content 부분 타입 명세
    callback에 전달하는 Mesh·Line·삽입 객체 등이다. userData.entity와 label은 원본 엔티티와 라벨 참조다. 선용 보충 함수는 이미 truthy인 값이 있으면 덮어쓰지 않으며 별도 this로 호출해도 원래 대상을 사용한다.
    이 명세에서 사용하는 필드:
        _type?: string
        geometry?: BufferGeometry
        material?: Material & {color: Color}
        getLayerName?: () => string
        getLabel?: () => U3dPOI | undefined
        setOpacity?: (opacity: number) => void
        setColor?: (color: ColorRepresentation) => void

U3dDxfStyleFunction 함수 타입 정의
    (entity: U3dDxfEntity | undefined, mesh: U3dDxfObject) -> void
    반환값을 사용하지 않는다. addDxfInfo·setUseExtrude의 this는 레이어이며 setStyleFunction의 즉시 순회는 this를 지정하지 않는다.

U3dModelDxfLayerCO 타입 정의
    기반 타입: U3dModelLayerCO & U3dModelDxfLayerCO_Content
    부모 옵션과 DXF 전용 입력 계약을 합성하며 생성자는 Partial을 받는다.

U3dModelDxfLayerCO_Content 부분 타입 명세
    DXF 생성자가 직접 읽는 옵션이다. 소문자 minlevel·dxfinfo를 읽고 옵션 기본값은 생성자의 nullish 처리에 따른다.
    이 명세에서 사용하는 필드:
        name?: string
        drawLine?: boolean
        crs?: string
        sourceCRS?: string
        minlevel?: number
        url?: string
        type?: string
        dxfinfo?: U3dDxfData
        labelInfo?: Array<unknown>
        useEdge?: boolean
        useExtrude?: boolean
        extrudeHeight?: number
        setAutoHeight?: boolean
        heightOffset?: number
        style?: U3dDxfStyle
        styleFunction?: U3dDxfStyleFunction

U3dDxfLayerParam 타입 정의
    getParam이 반환하는 일부 설정이다. style과 callback은 공유 참조이며 전체 생성 옵션의 복원용 형식은 아니다.
    name: string
    minlevel: number
    maxlevel: number
    transparent: boolean
    url: string | undefined
    style: U3dDxfStyle
    styleFunction: U3dDxfStyleFunction | undefined
    sourceCRS: string

U3dModelDxfLayer extends U3dModelLayer 클래스 정의
    의존: U3dModelLayer — 모델 레이어 기반; 상속: {U3dModelLayer}
    _sourceCRS: string = 'EPSG:5179'
    _drawLine: boolean = false
    _properties: Array = 빈 배열
    _url: string | undefined
    _2dLayer: U2dDxfLayer | undefined
    _dxfInfo
    _labelInfo: Array = 빈 배열
    _layerLabel: U3dPOI | undefined
    _useEdge: boolean = true
    _useExtrude: boolean = true
    _extrudeHeight: number = 2
    _setAutoHeight: boolean = true
    _heightOffset: number = 0
    _entity: Array = 빈 배열
        형상 전환에 사용할 원본 폴리라인 객체를 공유하여 보관한다.
    _style
        기본값은 color=0x3399CC, opacity=1, label=''이며 입력 스타일 객체는 복사하지 않는다.
    _styleFunction: function | undefined
    _bbox: Box3 | undefined

    U3dModelDxfLayer.constructor(opt: Partial<U3dModelDxfLayerCO> = {})
        의존:
            U3dModelLayer — 부모 초기화; 생성자: {new U3dModelLayer()}
            U3dLayer — 준비 완료; 함수: {resolve()}
            UDEF — 레이어 종류; 상수: {LAYER_TYPE.MODEL}
            Guid — 기본 이름 생성; 함수: {Guid()}
            defaultValue — nullish 기본값; 함수: {defaultValue()}
            defined — 정의 여부; 함수: {defined()}
        동작:
            부모를 같은 opt로 초기화한 뒤 클래스 종류와 이름을 설정한다. name 유무와 관계없이 Guid를 먼저 실행하고 name이 nullish일 때 그 결과를 사용한다.
            drawLine·crs·sourceCRS·소문자 minlevel이 nullish이면 각각 false·'EPSG:3857'·'EPSG:5179'·17을 사용하고, 입력값이 있으면 그대로 저장한다. maxlevel은 minlevel과 같게 둔다. type은 nullish이면 MODEL이며 startlevel·transparent는 이 생성자가 직접 읽지 않는다.
            properties·entity를 각각 빈 배열로, 2dLayer·layerLabel을 undefined로 시작한다. url·소문자 dxfinfo는 nullish이면 undefined이고 labelInfo는 nullish이면 빈 배열이다. dxfinfo를 저장만 하며 여기서 형상을 만들지 않는다.
            useEdge·useExtrude·setAutoHeight는 nullish일 때 true이고 extrudeHeight=2, heightOffset=0이다. style 전체가 nullish일 때만 기본 객체를 만들고 부분 스타일은 보충하지 않는다.
            styleFunction을 저장하고 상속 resolve가 정의되어 있으면 레이어 자체로 준비 상태를 완료한다. 이 완료는 DXF 객체 생성 완료가 아니다.

    override U3dModelDxfLayer.dispose() -> void
        의존:
            UGroup — 기존 객체 순회; 함수: {traverse()}
            THREE.Mesh — 메시 판별; 상수: {THREE.Mesh}
            UDEF — 라벨 자원 해제; 함수: {disposeObject3D()}
            U3dModelLayer — 부모 해제; 함수: {prototype.dispose.call()}
            U3dLayer — 그룹·앱 연결; 속성 읽기: {_group, _drawArg}
            UScene — 주석 장면에서 제거; 함수: {remove()}
            defined — 정의 여부; 함수: {defined()}
        동작:
            _group이 정의되면 순회한다. Mesh이고 userData.label이 정의되며 _drawArg·그 앱·그 주석 장면이 모두 정의된 경우에만 라벨을 해제하고 장면에서 제거한 뒤 userData.label을 undefined로 둔다.
            레이어 경계 라벨을 제거한다.
            부모 dispose를 호출하되 그 반환 Promise를 기다리거나 반환하지 않는다. [확인 Q-002]

    override U3dModelDxfLayer.createModel() -> undefined
        동작: 아무 객체도 생성하지 않고 undefined를 반환한다.

    U3dModelDxfLayer.getParam() -> U3dDxfLayerParam
        의존:
            U3dLayer — 투명 설정; 속성 읽기: {_transparent}
        동작: name·minlevel·maxlevel·transparent·url·style·styleFunction·sourceCRS를 가진 새 객체를 반환한다. style·styleFunction은 원본 참조이고 dxfInfo·돌출·고도 옵션은 포함하지 않는다.

    U3dModelDxfLayer.getStyle() -> U3dDxfStyle
        동작: _style 원본을 반환한다.

    U3dModelDxfLayer.getStyleFunction() -> U3dDxfStyleFunction | undefined
        동작: _styleFunction을 반환한다.

    U3dModelDxfLayer.getSourceCRS() -> string
        동작: _sourceCRS를 반환한다.

    U3dModelDxfLayer.setSourceCRS(sourceCRS: string) -> void
        동작: _sourceCRS를 교체하며 기존 객체를 재변환하지 않는다.

    U3dModelDxfLayer.addDxfInfo(data: U3dDxfData, sourceCRS?: string) -> void
        인터페이스: 생성 도중의 스타일 callback은 레이어를 this로 하여 entity·결과 객체를 받는다.
        의존:
            UDXFLoader — DXF 객체 생성; 생성자: {new UDXFLoader()}; 함수: {loadEntities()}
            UGroup — 그룹 생성·객체 이전; 생성자: {new UGroup()}; 함수: {add()}
            UScene — 레이어 그룹 등록; 함수: {add()}
            THREE.BufferGeometry — 정점 읽기·면 노멀; 함수: {getAttribute(), computeVertexNormals()}
            THREE.Vector3 — 삽입 객체 위치; 생성자: {new THREE.Vector3()}
            THREE.Box3 — 경계 갱신; 생성자: {new THREE.Box3()}; 함수: {setFromObject()}
            THREE.Color — 돌출 메시의 순환 색 적용; 함수: {set()}
            THREE.Material — 양면 표시; 속성 쓰기: {side}; 상수: {THREE.DoubleSide}
            OpenLayers(ol.proj) — 입력 좌표 변환; 함수: {transform()}
            UDrawArg — 지리 좌표를 월드로 변환; 함수: {getGeographicToWorld()}
            U3dLayer — 그룹·장면·그리기 인자; 속성 읽기: {_group, _scene, _drawArg}; 상수: {EVENT.LOADED}
            UEventDispatcher — 로드 후 고도 적용; 함수: {once()}
            사용자스타일 — 입력받아 _styleFunction에 보관한 callback으로 생성한 객체의 스타일 적용; 콜백: {styleFunction}
            defaultValue — 좌표계 기본값; 함수: {defaultValue()}
            전역 진단 — 모델 누락 로그; 함수: {__GError__()}
        동작:
            data를 _dxfInfo에 저장하고 loadEntities(data)의 결과 info를 얻은 뒤 sourceCRS가 nullish이면 기존 좌표계를 사용하여 _sourceCRS에 저장한다.
            info.entity가 falsy이면 오류를 기록하고 종료한다. info 자체나 개별 child의 geometry·material은 추가 검사하지 않는다.
            _group 직계 자식에서 이름이 faceGroup인 첫 그룹을 찾고 없으면 생성하여 등록한다. 같은 방법으로 polyGroup을 준비한다.
            _scene에 _group을 등록하고 polyGroup.position.z에 _heightOffset을 누적한다. 반복 입력은 기존 그룹·entity를 비우지 않는다.
            model.children의 현재 인덱스 순서로 child를 처리한다. child._type을 소문자로 바꾼 입력으로 처리 종류를 얻고 geometry의 position attribute를 읽는다.
                3dface이면 모든 정점의 XY를 변환하고 노멀을 다시 계산한다.
                    child의 라벨·메시 정보를 설정한 뒤 faceGroup으로 이전하고 인덱스를 하나 되돌려 빠져나간 자식 다음 항목을 처리한다.
                line이면 같은 정점 변환을 하고 child._type을 소문자로 저장한다. 원래 lwpolyline·polyline이면 _entity에 같은 child를 보관한다. polyGroup으로 이전한 뒤 선용 접근 함수를 부착하고 인덱스를 하나 되돌린다.
                insert이면 child.position의 XY를 _sourceCRS에서 EPSG:4326으로, 다시 월드 XY로 변환하고 기존 Z와 합쳐 position에 적용한다. polyGroup으로 이전하고 인덱스를 하나 되돌린다.
                돌출 lwpolyline·polyline이면 모든 정점에 같은 XY 변환을 적용하여 반환된 Z=0 벡터들을 모은다. 그 배열과 _extrudeHeight로 돌출 메시를 만든다.
                    모듈 공유 materialIndex로 colorList의 다섯 색을 순환 선택하고 인덱스를 늘린 뒤 생성 메시의 색을 덮어쓴다. 메시·원본 child의 종류를 설정하고 entity 참조를 메시로 전달한다. polyGroup에는 생성 메시를, _entity에는 원본 child를 보관한다. 원본 child는 model에서 제거하지 않는다.
                처리 종류가 어느 분기에도 해당하지 않으면 형상을 옮기지 않고 원본 child를 결과 객체로 유지한다.
            각 결과 객체에서 _styleFunction이 truthy이면 entity·결과 객체로 호출하고, callback 이후 material.side를 DoubleSide로 설정한다. callback의 side 변경은 덮어써진다.
            _setAutoHeight가 truthy이면 다음 LOADED 이벤트에 고도 갱신 callback을 once로 등록한다. 여기서 즉시 실행하거나 LOADED를 발생시키지는 않는다.
            _group에서 새 Box3를 계산하여 _bbox에 저장한다.

    U3dModelDxfLayer.setStyle(style?: U3dDxfStyle) -> void
        의존:
            UGroup — 메시 순회; 함수: {traverse()}
            THREE.Mesh — 메시 판별; 상수: {THREE.Mesh}
            THREE.Color — 색 교체; 생성자: {new THREE.Color()}
            UDrawArg — 화면 갱신 표시; 함수: {setUpdateDate()}
            U3dLayer — 그룹·그리기 인자; 속성 읽기: {_group, _drawArg}
            defined — 재질 정의 여부; 함수: {defined()}
        동작:
            falsy style은 빈 객체로 보고 기존 _style 원본에 Object.assign으로 합친다.
            그룹을 순회하여 Mesh이고 material이 정의된 대상에만 적용한다. 저장 color가 truthy이면 새 Color로 교체하고, 저장 opacity가 truthy이면 해당 값 아니면 1을 적용한다. opacity가 1 이상이면 transparent=false, 아니면 true다. 배열 재질의 요소를 따로 처리하지 않는다. [확인 Q-003]
            저장 label이 truthy일 때만 경계 라벨을 설정한다.
            마지막에 _drawArg.setUpdateDate를 호출한다.

    U3dModelDxfLayer.setStyleFunction(styleFunction: U3dDxfStyleFunction) -> void
        인터페이스: 이 메서드의 즉시 순회는 callback을 일반 함수로 호출하며 레이어 this를 지정하지 않는다. 생성·돌출 전환 중의 멤버 호출과 구분한다.
        의존:
            UGroup — 대상 순회; 함수: {traverse()}
            U3dLayer — 그룹; 속성 읽기: {_group}
            사용자스타일 — 사용자 지정 스타일 적용; 콜백: {styleFunction}
            defined — entity 정의 여부; 함수: {defined()}
        동작: _styleFunction을 교체한 뒤 그룹 전체를 순회하여 userData.entity가 정의된 객체에 입력 styleFunction(entity, mesh)을 호출한다. 함수 여부는 검사하지 않으며 별도 화면 갱신은 요청하지 않는다.

    U3dModelDxfLayer.setLabelToBoundingBox(labelText?: string) -> void
        의존:
            THREE.Box3 — 그룹 경계; 생성자: {new THREE.Box3()}; 함수: {setFromObject(), getCenter()}
            THREE.Vector3 — 중심; 생성자: {new THREE.Vector3()}
            U3dPOI — 경계 라벨; 생성자: {new U3dPOI()}; 함수: {setPosition(), setLabel(), show()}
            U3dLayer — 그룹·앱; 속성 읽기: {_group, _app}
            UScene — 주석 장면 등록; 함수: {add()}
        동작: 그룹 경계 중심을 구하고 labelText가 undefined일 때만 빈 문자열을 사용한다. _layerLabel이 truthy이면 위치와 문구를 바꾸고, 아니면 POI를 생성하여 _app._sceneComment에 등록한다. 마지막에 라벨을 표시한다.

    U3dModelDxfLayer.removeLabelToBoundingBox() -> void
        의존:
            U3dPOI — 숨김; 함수: {hide()}
            UDEF — 자원 해제; 함수: {disposeObject3D()}
            U3dLayer — 앱; 속성 읽기: {_app}
            UScene — 주석 장면 제거; 함수: {remove()}
            defined — 라벨 존재; 함수: {defined()}
        동작: _layerLabel이 정의되지 않으면 종료한다. 있으면 숨김·자원 해제·주석 장면 제거 순서로 처리하고 _layerLabel을 undefined로 바꾼다.

    U3dModelDxfLayer.parseDxfFromUrl(url: string) -> void
        의존:
            UDXFLoader — URL 로드; 생성자: {new UDXFLoader()}; 함수: {load()}
            THREE.Object3D — 행렬 갱신; 함수: {updateMatrix(), updateMatrixWorld()}
            U3dLayer — 장면; 속성 읽기: {_scene}
            UScene — 객체 등록; 함수: {add()}
        동작: 로더를 만들고 인수 url이 아닌 선언되지 않은 opt.url을 load에 전달한다. opt가 없는 환경에서는 ReferenceError가 발생한다. 성공 callback이 실행되면 data의 로컬·월드 행렬을 갱신하고 _scene에 추가한다. [확인 Q-004]

    override U3dModelDxfLayer.show(bShow: boolean) -> void
        의존:
            U3dLayer — 그리기 인자; 속성 읽기: {_drawArg}
            UDrawArg — 앱 확인; 속성 읽기: {_app}
            U2dDxfLayer — 연결된 2D 표시; 함수: {show()}
            U3dModelLayer — 부모 표시; 함수: {prototype.show.call()}
            defined — 정의 여부; 함수: {defined()}
        동작: _drawArg 또는 그 앱이 정의되지 않으면 종료한다. _2dLayer가 정의되면 먼저 표시 상태를 전달하고 부모 show를 호출한다. bShow가 falsy일 때만 라벨을 숨긴다. 부모가 그룹을 정리한 뒤 라벨 순회가 실행되는 순서를 유지한다.

    U3dModelDxfLayer.showLabel(show: boolean) -> void
        의존:
            UGroup — 객체 순회; 함수: {traverse()}
            THREE.Mesh — 메시 판별; 상수: {THREE.Mesh}
            U3dLayer — 그룹·앱·그리기 인자; 속성 읽기: {_group, _app, _drawArg}
            UDrawArg — 주석 장면 조회; 함수: {getSceneComment()}
            UScene — 라벨 연결; 함수: {add(), remove()}
            U3dPOI — 경계 라벨 표시; 함수: {show(), hide()}
            defined — 정의 여부; 함수: {defined()}
            Web API(console) — 장면 누락 진단; 함수: {info()}
        동작: 그룹을 순회하여 Mesh이고 userData.label이 truthy인 경우 show의 참·거짓에 따라 _app._sceneComment에 라벨을 추가·제거한다. 개별 라벨의 show·hide는 호출하지 않는다.
            _layerLabel이 정의되어 있으면 _drawArg.getSceneComment를 얻고 없으면 로그 후 종료한다. 있으면 경계 라벨을 show·hide한 뒤 그 장면에 추가·제거한다.

    U3dModelDxfLayer.getBoundingBox() -> Box3
        의존:
            THREE.Box3 — 경계; 생성자: {new THREE.Box3()}; 함수: {setFromObject()}
            U3dLayer — 그룹; 속성 읽기: {_group}
        동작: _group에서 매번 새 Box3를 계산하여 반환하며 _bbox를 읽거나 갱신하지 않는다.

    U3dModelDxfLayer.setUseExtrude(value: boolean) -> void
        인터페이스: 새 객체에 적용하는 스타일 callback의 this는 레이어다.
        의존:
            THREE.Object3D — 대상 순회·복제; 함수: {traverse(), clone()}
            THREE.BufferGeometry — 원본 정점·해제; 함수: {getAttribute(), dispose()}
            THREE.Material — 재질 해제; 함수: {dispose()}
            THREE.Color — 돌출 메시의 순환 색 적용; 함수: {set()}
            THREE.Vector3 — 돌출 입력 정점; 생성자: {new THREE.Vector3()}
            UDEF — 기존 라벨 해제; 함수: {disposeObject3D()}
            UGroup — 객체 교체; 함수: {add(), remove()}
            사용자스타일 — 입력받아 _styleFunction에 보관한 callback으로 전환한 객체의 스타일 적용; 콜백: {styleFunction}
        동작:
            기존 값과 엄격히 같으면 종료하고 아니면 먼저 _useExtrude를 저장한다. _entity가 없거나 비어 있으면 종료한다.
            polyGroup을 찾아 없으면 종료한다.
            그룹의 lwpolyline·polyline마다 자신과 하위 객체를 숨기고 geometry·material이 truthy이면 각각 해제한다. userData.label이 truthy이면 그것도 해제하고 기존 객체를 제거 목록에 담는다. _entity가 같은 geometry를 참조할 수 있어도 복제 전에 해제가 먼저다. [확인 Q-005]
            _entity의 각 원본 line을 처리한다.
                value가 falsy이면 line.clone 결과를 추가 목록에 담는다.
                value가 truthy이면 position attribute가 없는 원본은 건너뛰고 XYZ 정점 배열로 돌출 메시를 만든다. 모듈 공유 순환 색을 적용하여 추가 목록에 담는다.
                결과 객체에 선용 접근 함수를 부착하고 visible=true로 하며 entity와 _type을 원본에서 전달한다.
                _styleFunction과 결과가 truthy이면 레이어를 this로 하여 entity·결과 객체에 스타일을 적용한다.
            추가 목록을 polyGroup에 먼저 등록한 뒤 제거 목록을 그룹에서 뺀다. 경계 재계산·DoubleSide 적용·고도 갱신은 별도로 하지 않는다.

    U3dModelDxfLayer.getUseExtrude() -> boolean
        동작: _useExtrude를 반환한다.

    U3dModelDxfLayer.setExtrudeHeight(value: number) -> void
        의존:
            THREE.Object3D — 이전 형상 순회; 함수: {traverse()}
            THREE.BufferGeometry — 자원 해제; 함수: {dispose()}
            THREE.Material — 자원 해제; 함수: {dispose()}
            UGroup — 그룹 교체; 함수: {remove(), add()}
        동작:
            값이 엄격히 같으면 종료하고 아니면 _extrudeHeight를 먼저 저장한다. _useExtrude가 falsy이면 종료한다.
            _useExtrude가 truthy일 때 polyGroup을 찾아 없으면 종료한다.
                lwpolyline·polyline마다 기존 mesh와 value로 재생성을 시도한다. 원본 geometry.parameters.options의 depth도 제자리 변경된다.
                결과가 truthy인 경우에만 이전 mesh의 하위 객체를 숨기고 존재하는 geometry·material을 해제하여 교체 목록을 만든다. 새 메시에는 라벨 설정을 적용한 뒤 이전 mesh.position.z와 종류를 전달한다.
            제거 목록을 polyGroup에서 먼저 빼고 추가 목록을 등록한다. 스타일 callback·선용 접근 함수는 다시 적용하지 않는다.

    U3dModelDxfLayer.getExtrudeHeight() -> number
        동작: _extrudeHeight를 반환한다.

    U3dModelDxfLayer.setHeightOffset(value: number) -> void
        의존:
            THREE.Object3D — 라벨 순회; 함수: {traverse()}
        동작: 값이 엄격히 같으면 종료하고 이전 값을 보관한 뒤 _heightOffset을 저장한다. polyGroup이 있으면 그 Z와 하위 객체의 truthy userData.label.position.z에 새 값과 이전 값의 차이를 더한다.

    U3dModelDxfLayer.getHeightOffset() -> number
        동작: _heightOffset을 반환한다.

    U3dModelDxfLayer.updateHeightGroup() -> void
        의존:
            THREE.Box3 — 그룹 경계; 생성자: {new THREE.Box3()}; 함수: {setFromObject(), getCenter()}
            THREE.Vector3 — 중심; 생성자: {new THREE.Vector3()}
            UDrawArg — 렌더 고도; 함수: {getRenderHeightAtPoint()}
            U3dLayer — 그리기 인자; 속성 읽기: {_drawArg}
            UDEF — 고도 무효값; 상수: {INVALID, TERRAIN_NO_DATA}
            THREE.Object3D — 라벨 순회; 함수: {traverse()}
            defined — 정의 여부; 함수: {defined()}
        동작: polyGroup을 찾아 없으면 종료한다.
            그룹 경계 중심의 XY로 렌더 고도를 조회한다. nullish·INVALID·TERRAIN_NO_DATA이면 0으로 대체한다. NaN은 별도 검사하지 않는다.
            고도에 _heightOffset을 더한 값을 그룹 Z와 하위 객체의 truthy 라벨 Z에 절대값으로 대입한다.

extrudeDxf(vertex: Array<Vector3>, height: number) -> UMesh
    의존: UMesh — 결과 메시; 생성자: {new UMesh()}
    동작:
        geometry와 재질로 UMesh를 만든다.
        새 메시의 라벨·메시 정보를 설정하고 같은 메시를 반환한다.

transformPosition(posAttribute: BufferAttribute | InterleavedBufferAttribute, index: number) -> Vector3
    의존:
        OpenLayers(ol.proj) — 입력 좌표 변환; 함수: {transform()}
        UDrawArg — 지리 좌표를 월드로 변환; 함수: {getGeographicToWorld()}
        THREE.BufferAttribute — 원본 정점 읽기·쓰기; 함수: {getX(), getY(), setX(), setY()}
        THREE.Vector3 — 변환 결과; 생성자: {new THREE.Vector3()}
        U3dLayer — 그리기 인자; 속성 읽기: {_drawArg}
    동작: 지정 정점의 XY를 _sourceCRS에서 EPSG:4326으로 변환하고 그 결과를 월드 XY로 변환한다. 원본 attribute의 XY만 바꾸고 Z는 유지한다. 반환 벡터의 Z는 0이며 needsUpdate는 설정하지 않는다.

setLabel(mesh: UMesh) -> void
    의존:
        UMesh — 메시 경계; 함수: {getBBox()}
        THREE.Box3 — 중심; 함수: {getCenter()}
        THREE.Vector3 — 중심 계산; 생성자: {new THREE.Vector3()}
        UDrawArg — 식별용 좌표; 함수: {getWorldToGoogle()}
        UDEF — 객체 식별·종류; 함수: {createGoogleKey()}; 상수: {UMESH_TYPE._building}
        U3dPOI — 라벨; 생성자: {new U3dPOI()}; 함수: {setLabel(), setPosition(), show()}
        U3dLayer — 그리기 인자·앱; 속성 읽기: {_drawArg, _app}
        UScene — 라벨 등록; 함수: {add()}
    동작:
        메시 경계 중심을 구하고 그 XY를 Google 좌표로 바꿔 createGoogleKey 결과와 mesh.id를 '_'로 연결하여 userData.id에 저장한다. _utype은 building, _ulayername은 레이어 이름이다.
        userData.label이 falsy이면 style.label이 undefined일 때만 빈 문구로 POI를 생성하여 메시와 주석 장면에 등록한다. 기존 라벨이 있으면 style.label이 빈 문자열·undefined일 때 poi.label을 재사용하고 문구·위치를 바꾼다. 이후 라벨을 표시한다.
regenerateExtrudeMesh(mesh: UMesh, depth: number) -> UMesh | undefined
    동작: mesh·geometry·material·geometry.parameters 중 falsy 값이 있으면 undefined를 반환한다.
getFaceGroup() -> Object3D | undefined
    의존: U3dLayer — 검색할 레이어 그룹; 속성 읽기: {_group}
    동작: _group이 없거나 자식이 비어 있으면 undefined를 반환한다. 아니면 직계 자식 중 name이 'faceGroup'인 첫 객체를 반환한다.

getPolyGroup() -> Object3D | undefined
    의존: U3dLayer — 검색할 레이어 그룹; 속성 읽기: {_group}
    동작: _group이 없거나 자식이 비어 있으면 undefined를 반환한다. 아니면 직계 자식 중 name이 'polyGroup'인 첫 객체를 반환한다.

getDXFType(type?: string) -> string | undefined
    의존: defined — 정의 여부; 함수: {defined()}
    동작: type이 nullish이면 undefined를 반환한다. 3dface·insert·line은 _useExtrude와 무관하게 그대로 반환한다. 그 외에는 _useExtrude가 falsy이고 lwpolyline·polyline일 때 line을 반환하며 나머지는 undefined다. _useExtrude가 truthy이면 알려지지 않은 문자열도 그대로 반환한다.

setLineTypePrototype(line: U3dDxfObject) -> void
    의존:
        U3dObject — 현재 레이어 이름; 함수: {getName()}
        THREE.Material — 선의 불투명도와 투명 상태 변경; 속성 쓰기: {opacity, transparent}
        THREE.Color — 선 색상 변경; 함수: {set()}
    동작: line의 getLayerName·getLabel·setOpacity·setColor가 각각 falsy일 때만 함수를 부착한다. truthy인 기존 함수·값은 바꾸지 않는다.
        getLayerName은 포획한 레이어의 현재 getName 결과를, getLabel은 포획한 line의 현재 userData.label을 반환한다. 다른 this로 호출해도 포획 대상을 사용한다.
        setOpacity는 포획한 line.material이 falsy이면 종료하고 아니면 opacity와 transparent=(opacity<1)을 설정한다. setColor도 재질이 falsy이면 종료하고 아니면 color.set에 전달한다. 별도 화면 갱신·라벨 생성은 하지 않는다.

```

## 4. 공통 처리 기준과 제약

```spec
defined와 defaultValue는 null·undefined를 누락으로 취급한다. truthy 조건이 명시된 스타일·라벨·형상 분기와 혼동하지 않는다.
스타일·원본 entity·라벨 참조와 geometry 생성 options의 공유는 각 메서드의 제자리 변경 및 후속 형상 전환에 영향을 준다. 조회 결과를 일괄 읽기 전용 또는 복사본으로 보지 않는다.
모듈의 materialIndex는 인스턴스별 상태가 아니다. 돌출 형상 생성 순서에 따라 다섯 기본 색을 모든 레이어가 함께 순환한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
