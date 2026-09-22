# U3dModelStaticLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

모델 목록을 병렬로 읽어 하나의 렌더 그룹에 등록하고, 로딩 완료 시 그룹 경계와 중심을 계산하는 레이어다. `GeOnDT.model.U3dModelStaticLayer`로 공개되며 앱의 모델 레이어 처리에서 타입을 구분한다. 모델 선택 표시, 이름 조회, 직접 추가와 정점 Y/Z 교환을 제공한다. 로더 자체는 기반 레이어에 의존한다.

## 3. 정규 자연어 수도코드

```spec
U3dModelStaticLayerCO 타입 정의
    기반 타입: U3dModelBasicLayerCO & U3dModelStaticLayerCO_Content
    부모 옵션을 보존하고 정적 레이어의 XML 기본값과 모델 목록 설명을 구체화한다.

U3dModelStaticLayerCO_Content 부분 타입 명세
    needXml: boolean 선택 = false
        XML 사용 여부이며 undefined일 때만 false를 적용한다.
    listModel: Array<U3dModelStaticInfo> 선택 = 빈 배열
        입력 모델 목록이며 성공 콜백에서 현재 항목의 crs와 ext를 다시 읽는다.

U3dModelStaticInfo 타입 정의
    기반 타입: ModelInfo & U3dModelStaticInfo_Content
    기반 모델 정보에 정적 배치 좌표계를 더한다.

U3dModelStaticInfo_Content 부분 타입 명세
    crs: string 선택
        원본 중심의 좌표계이며 미정의 또는 빈 문자열이면 월드 좌표로 직접 사용한다.

U3dModelStaticObject 타입 정의
    기반 타입: Object3D & U3dModelStaticObject_Content
    로딩 후 좌표계·확장자를 연결하고 위치를 변경할 객체다.

U3dModelStaticObject_Content 부분 타입 명세
    _crs: string 선택
    _ext: string 선택

ol: object
    모듈 평가 시 __GEONDT__.ol 참조를 보관한다.

U3dModelStaticLayer extends U3dModelBasicLayer 클래스 정의
    의존: U3dModelBasicLayer — 모델 로딩 기반; 상속: {U3dModelBasicLayer}

    static OPT_KEYS: Array<string>
        의존: U3dModelBasicLayer — 상속 옵션 목록; 속성 읽기: {OPT_KEYS}
        부모 OPT_KEYS를 펼친 새 배열이며 needXml을 포함한다.
    _classtype: string = U3dModelStaticLayer
    _type: string = UDEF.LAYER_TYPE.MODEL
    _renderBuffer: UGroup
        정적 모델을 모으는 그룹이며 children과 _objectList는 같은 배열이다.
    _objectList: Array<Object3D> | undefined
        생성 시 빈 배열이며 dispose에서 참조만 undefined로 바뀐다.
    _objectLoadCount: number = 0
    _needXml: boolean = false

    constructor(opt: Partial<U3dModelStaticLayerCO> = {})
        의존:
            U3dModelBasicLayer — 기반 생성과 상태; 생성자: {super()}; 속성 읽기: {_drawArg, _name}
            normalizeOptionKeys — 옵션 키 정규화; 함수: {normalizeOptionKeys()}
            defaultValue — undefined 기본값; 함수: {defaultValue()}
            UGroup — 렌더 그룹; 생성자: {new UGroup()}
            UDEF — 모델 종류; 상수: {LAYER_TYPE.MODEL}
        동작:
            opt와 new.target으로 옵션을 정규화한 결과를 부모 생성자에 전달한다. needXml은 정규 키이며 needxml 등 대소문자 변형도 지원한다.
            정규화 유틸리티는 자신의 별칭 키를 순회 순서대로 정규 키에 덮어쓰고, 별칭 변환이 필요할 때만 복사하므로 호출자가 전달한 객체는 변경하지 않는다. null 또는 객체가 아닌 옵션은 빈 객체로 처리하여 이 클래스 초기화를 계속한다.
            식별자·모델 종류를 지정하고 _drawArg로 UGroup을 생성하여 _name을 이름으로 지정한다.
            빈 _objectList와 0인 로딩 수를 만들고 정규화된 opt.needXml이 undefined일 때만 false를 적용한다. null 값은 그대로 남는다.
            그룹 children을 _objectList 참조로 교체한다.

    override initialize() -> void
        의존:
            U3dModelLayer — 공통 초기화와 장면 상태; 함수: {U3dModelLayer.prototype.initialize.call()}; 속성 읽기: {_scene, _object}; 속성 쓰기: {_bbox, _center}
            U3dModelBasicLayer — 모델 로더와 목록; 함수: {load()}; 속성 읽기: {_listModel}
            U3dLayer — 완료 통지; 함수: {resolve()}
            defined — 장면과 객체 존재; 함수: {defined()}
            THREE — 그룹 경계와 중심; 생성자: {new THREE.Box3(), new THREE.Vector3()}; 함수: {THREE.Box3.setFromObject(), THREE.Box3.getCenter()}
            장면과 그룹 — 객체 등록; 함수: {_scene.remove(), _renderBuffer.add()}
        동작:
            즉시 부모의 initialize가 아니라 U3dModelLayer.prototype.initialize를 현재 receiver로 호출한다.
            _scene과 _object가 모두 정의된 경우만 기존 _object를 장면에서 제거한다.
            load가 truthy인 경우만 _listModel.length로 로딩 수를 설정한다. 빈 목록은 바로 자신을 resolve하며 경계와 중심을 새로 만들지 않는다.
            현재 목록 길이를 조건으로 순회하여 각 항목의 load 반환값에 성공 콜백만 등록한다. 반환은 항상 undefined이며 전체 완료 Promise를 만들지 않는다.
            각 성공 콜백은 로딩 수를 먼저 줄이고, 콜백 실행 시점의 _listModel[i]에서 crs와 ext를 읽어 객체에 기록한다.
            load가 truthy인 경우 등록한 성공 콜백에서 객체를 배치한 뒤 렌더 그룹에 추가한다.
            이때 로딩 수가 정확히 0이면 그룹 경계의 새 Box3와 새 Vector3 중심을 저장하고 자신을 resolve한다. 실패 콜백·취소·재호출 세대 구분은 없다. 배치 예외는 이후 추가와 완료를 중단하며 이미 감소한 수를 복원하지 않는다.

    override dispose() -> void
        의존:
            U3dModelBasicLayer — 기반 정리; 함수: {U3dModelBasicLayer.prototype.dispose.call()}; 속성 읽기: {_drawArg, _name}
            U3dModelLayer — 장면 참조; 속성 읽기: {_scene}
            defined — 앱과 장면 존재; 함수: {defined()}
            장면과 그룹 — 정적 모델 제거; 함수: {_scene.remove(), _renderBuffer.removeMesh()}
        동작:
            _drawArg._app을 먼저 읽고 앱이 정의되지 않으면 반환한다. _drawArg 자체가 없으면 접근 예외가 발생한다.
            장면이 정의되어 있으면 그룹을 제거한다. _objectList를 undefined로 바꾸고 그룹 removeMesh에 _name을 전달한다.
            기반 dispose를 호출하되 반환값은 전달하지 않는다. 그룹 children 배열 참조는 여기서 교체하지 않는다. [확인 Q-001]

    override getBoundingBox() -> Box3
        의존:
            U3dModelLayer — 경계 상태; 속성 읽기: {_bbox}; 속성 쓰기: {_bbox}
            defined — 기존 경계 존재; 함수: {defined()}
            THREE.Box3 — 그룹 경계; 생성자: {new THREE.Box3()}; 함수: {THREE.Box3.setFromObject()}
        동작:
            _bbox가 없으면 새 Box3에 그룹 경계를 계산하여 저장한다. 있으면 같은 Box3에 다시 계산한다. 저장된 경계 참조를 반환한다.

    override show(show: boolean) -> void
        의존:
            U3dModelLayer — 공통 표시; 함수: {U3dModelLayer.prototype.show.call()}; 속성 읽기: {_drawArg, _scene}
            defined — drawArg·앱·검색 결과 존재; 함수: {defined()}
            장면 — 그룹 조회와 등록; 함수: {_scene.getObjectById(), _scene.add(), _scene.remove()}
        동작:
            _drawArg 또는 _drawArg._app이 정의되지 않으면 종료한다.
            그룹 ID 검색 결과가 없고 show가 truthy이면 그룹을 추가한다. 그렇지 않으면 ID를 다시 조회하여 결과가 있고 show가 falsy인 경우 그룹을 제거한다.
            이어 U3dModelLayer.prototype.show를 현재 receiver와 show로 호출한다. 장면 미정의나 호출 실패를 잡지 않는다.

    showObject(name: string, show: boolean) -> void
        의존:
            U3dModelLayer — 표시 문맥; 속성 읽기: {_drawArg, _scene}
            defined — 문맥·검색 결과 존재; 함수: {defined()}
            장면 — 이름 조회; 함수: {_scene.getObjectByName()}
        동작:
            _drawArg가 없으면 종료하고, 있으면 장면 전체에서 이름을 검색하여 찾은 객체의 visible을 show로 대입한다. 렌더 그룹 범위로 제한하지 않는다.

    getObject(name: string) -> Object3D | undefined
        의존: U3dModelLayer — 장면 조회; 속성 읽기: {_scene}; 함수: {_scene.getObjectByName()}
        동작:
            장면 전체의 이름 검색 결과를 그대로 반환하며 미정의 장면을 별도로 검사하지 않는다.

    setFlipY(mesh: Iterable<Object3D> | undefined) -> void
        의존:
            U3dModelLayer — 경계 상태; 속성 읽기: {_bbox}
            defined — 선택 목록 존재; 함수: {defined()}
            그룹과 경계 — 순회와 전체 경계 갱신; 함수: {_renderBuffer.children.traverse(), _bbox.setFromObject()}
        동작:
            렌더 그룹의 각 직계 자식에서 traverse를 수행한다. mesh가 정의되어 있으면 방문 항목마다 iterable을 새 배열로 펼쳐 uuid가 같은 선택 항목마다 교환 처리를 반복하며, 없으면 모든 방문 항목을 처리한다.
            중복 uuid 선택과 공유 geometry를 중복 제거하지 않는다. 마지막에 기존 _bbox로 전체 그룹 경계를 다시 계산하며 _bbox가 없으면 앞선 변경 후 예외가 발생한다.

    addModel(mesh: Object3D) -> void
        의존: UGroup — 객체 등록; 함수: {_renderBuffer.add()}
        동작:
            mesh를 렌더 그룹에 추가한다. 경계·중심·로딩 수를 별도로 갱신하지 않고 반환값도 전달하지 않는다.

afterLoad(object: U3dModelStaticObject) -> void
    인터페이스: this는 U3dModelStaticLayer이며 상속 setOriginCenter를 동적으로 호출한다.
    의존:
        THREE — 메시 판별과 중심 벡터; 속성 읽기: {THREE.Mesh}; 생성자: {new THREE.Vector3()}
        U3dModelLayer — 메시 중심 이동; 함수: {setOriginCenter()}; 속성 읽기: {_drawArg}
        UDrawArg — 지리좌표의 월드 변환; 함수: {_drawArg.getGeographicToWorld()}
        defined — CRS 존재; 함수: {defined()}
        ol.proj — 좌표계 변환; 함수: {ol.proj.get(), ol.proj.transform()}
        Object3D — 순회·제거·행렬 갱신; 함수: {object.traverse(), object.remove(), object.position.copy(), object.updateMatrix(), object.updateMatrixWorld()}
    동작:
        this는 레이어다. 객체를 traverse하여 THREE.Mesh의 geometry.attributes 키가 없으면 최상위 object.remove에 해당 메시를 전달한다. 중첩 메시의 실제 부모에서 제거하지 않으며 순회 중 제거에 따른 순서 영향을 유지한다.
        속성이 있으면 레이어 setOriginCenter를 동적으로 호출한 뒤 mesh._oriCenter 참조를 목록에 담는다. [확인 Q-002]
        object._crs가 정의되어 있고 빈 문자열이 아니면 ol.proj.get으로 입력 CRS와 EPSG:4326을 구하여 평균 좌표를 transform하고, 지리좌표의 월드 변환 결과를 새 Vector3로 복사한다. 그 외에는 평균 좌표 그대로 새 Vector3를 만든다.
        object.position.copy로 위치를 반영하고 matrixWorldNeedsUpdate=true 뒤 updateMatrix와 updateMatrixWorld를 순서대로 호출한다. 예외를 잡거나 이전 변경을 되돌리지 않는다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
