# UAnalyGizmoModel 명세

> 상태: 구현 관찰 초안

## 1. 개요

모델의 위치·회전·배율을 기즈모로 편집하고 변경·종료 알림을 전달한다.
선택 대상의 변환, 교차 조회, 보조 레이저와 오버레이 위치 연계를 담당한다.
앱의 GizmoModel 분석 생성 경로와 UAnalyAlignModel에서 사용한다.

## 3. 정규 자연어 수도코드

```spec
UAnalyGizmoModelCO extends UAnalyCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string = 'GizmoModel'
            분석 이름이며 부모 생성자에는 옵션을 전달하지 않는다.

GizmoControlObject extends Object3D 부분 타입 명세
    이 명세에서 사용하는 필드:
        _basePos: import('three').Vector3
            직전 적용 위치
        _baseQuat: import('three').Quaternion
            직전 적용 회전
        _baseScl: import('three').Vector3
            직전 적용 배율

UGizmoControlsTC 부분 타입 명세
    이 명세에서 사용하는 필드:
        object?: Object3D
            연결한 편집 제어 객체
        mode: string
            현재 편집 모드
        axis: string | null
            편집 축
        _offset: Vector3
            편집 종료 알림의 이동량 참조
        _listeners: Record<string, Array<Function>>
            비활성화에서 직접 비우는 이벤트 목록

GizmoXmlOption 부분 타입 명세
    이 명세에서 사용하는 필드:
        name: string
            모델 이름
        title: string | undefined
            제목과 ModelUrl에 사용하는 값
        location, rotation, scale: Vector3Like
            위치·도 단위 회전·배율
        box: object
            min과 max의 각 x·y·z 경계

UAnalyGizmoModelLaserStyle 부분 타입 명세
    이 명세에서 사용하는 필드:
        color?: import('three').Color | string | number
            생성된 레이저의 표시 색상
        opacity?: number
            0~1로 제한할 불투명도
        radius?: number
            두께 배율

UAnalyGizmoModelIntersection 부분 타입 명세
    이 명세에서 사용하는 필드:
        distance: number
            어댑터가 계산한 교차 거리
        object: import('@union3d/geometry/U3dAdaptedGeometry').U3dAdaptedGeometry
            교차한 형상

UAnalyGizmoModelCallback 함수 타입 정의
    (this: UAnalyGizmoModel, self: UAnalyGizmoModel, target: Array<Object3D>, controlObj: undefined | GizmoControlObject, controlBound: Box3) -> void
    인터페이스: this와 self는 분석 인스턴스이며 target·controlObj·controlBound는 선택 루트 배열·편집 제어 객체·편집 경계의 원본 참조이다.

UAnalyGizmoModel extends UAnaly 클래스 정의
    의존: UAnaly — 분석 기반 기능; 상속: {UAnaly}

    static OPT_KEYS: Array<string>
        의존: UAnaly — 상속 옵션 키; 속성 읽기: {OPT_KEYS}
        name과 부모의 정본 옵션 키 목록

    static EVENT: object = CHANGE가 'change'인 객체
        대상 객체의 변경 알림 이름이며 외부 쓰기가 차단되지 않는다.
    name: string = 'GizmoModel'
        분석 등록 이름
    #target: Array<Object3D> = 빈 배열
        중복과 선택 조상을 가진 자식을 제외한 편집 대상; target getter가 원본을 노출한다.
    #controlObj: GizmoControlObject | undefined
        편집 제어 객체
    #controlBound: Box3
        선택 경계이며 편집 중 중심을 이동한다.
    #needUpdateWorld: boolean = false
        대상 적용 중 최초 월드 행렬 강제 갱신 여부
    #overlay: U3dOverlay | undefined
        편집 위치와 연계할 오버레이
    #useLaser: boolean = true
        드래그 이벤트와 갱신 시 보조 레이저 사용 여부
    #lasers: Array<UAnalyGizmoModelLaser> = 빈 배열
        mesh와 축 방향을 가진 레이저 목록
    #isDrag: boolean = false
        dragging-changed의 마지막 진릿값
    #updateFunc, #endFunc: UAnalyGizmoModelCallback | undefined
        사용자 콜백
    _control: UGizmoControls | undefined
        편집 컨트롤
    _clickId: string | null | undefined
        활성화 때 해제할 앱 클릭 등록 식별자
    _targetScenes: Array<Object3D> = 빈 배열
        setTargetScene이 추가하는 장면 목록

    constructor(opt?: UAnalyGizmoModelCO)
        의존:
            UAnaly — 기반 초기화와 분석 장면; 생성자: {new UAnaly()}; 속성 읽기: {_scene}
            normalizeOptionKeys — 정본 생성 옵션 키 변환; 함수: {normalizeOptionKeys()}
            defaultValue — 이름 기본값; 함수: {defaultValue()}
            THREE — 경계 생성; 생성자: {new Box3()}
            UScene(_scene) — 제어 객체 등록; 함수: {add()}
        동작:
            부모를 인수 없이 초기화하고 falsy 옵션을 빈 객체로 대체한다.
            new.target의 정본 옵션 키로 정규화하며 복사된 객체의 원래 prototype을 복구한다.
            name이 undefined이면 GizmoModel을 사용하고 null·빈 문자열은 보존한다.
            대상·컨트롤·콜백·레이저 상태를 초기화한다.
            숨긴 제어 객체를 생성하여 분석 장면에 추가한다.
            종료 콜백 실행 함수를 이 인스턴스에 bind하여 보관한다.
    get isDrag() -> boolean
        동작: #isDrag를 반환한다.
    get target() -> Array<Object3D>
        동작: #target 원본 배열을 반환한다.
    setUseLaser(use: boolean) -> void
        동작: boolean만 #useLaser에 저장하며 이미 표시한 레이저를 즉시 숨기지는 않는다.
    setLaserStyle(style: UAnalyGizmoModelLaserStyle) -> void
        인터페이스: style은 필수 객체이고 color·opacity·radius는 선택 속성이며 인수 생략과 null은 구조 분해에서 예외가 발생한다.
        의존:
            THREE — 색 생성과 투명도 제한; 생성자: {new Color()}; 함수: {MathUtils.clamp()}
            defined — 설정·재질의 존재 판정; 함수: {defined()}
        동작:
            인수에서 color·opacity·radius를 읽으며 레이저가 없으면 종료한다.
            material이 있는 각 레이저에 정의된 색상과 0~1로 제한한 투명도를 적용한다.
            정의된 radius를 숫자로 변환하고 falsy이면 1을 사용한 뒤 0.001 이상으로 제한한다.
            길이 축은 유지하고 x·z 배율과 userData.radius에 반영한다.
    #mouseUpListener() -> void
        인터페이스: 등록한 종료 콜백의 this는 분석 인스턴스이다.
        동작: 종료 콜백이 있으면 분석 객체·대상 배열·제어 객체·경계의 원본 참조를 순서대로 전달한다.
    setEndFunc(func: UAnalyGizmoModelCallback) -> void
        의존: __GError__ — 인수 오류 알림; 함수: {__GError__()}
        동작: 함수이면 #endFunc에 저장하고 아니면 7054644 오류를 기록하며 기존 콜백을 유지한다.
    setUpdateFunc(func: UAnalyGizmoModelCallback) -> void
        의존: __GError__ — 인수 오류 알림; 함수: {__GError__()}
        동작: 함수이면 #updateFunc에 저장하고 아니면 7054981 오류를 기록하며 기존 콜백을 유지한다.
    getControlPosition() -> Vector3
        동작: 제어 객체의 matrixWorld를 분해하여 공유 임시 위치 벡터를 반환하며 이후 호출·편집 계산에서 값이 덮어써질 수 있다.
    getControlObj() -> GizmoControlObject
        의존:
            UAnaly — 분석 장면 참조; 속성 읽기: {_scene}
            defined — 제어 객체 존재 판정; 함수: {defined()}
            UScene(_scene) — 제어 객체 등록; 함수: {add()}
            UGizmoControls(_control) — 편집 대상 연결; 함수: {attach()}
        동작:
            #controlObj가 nullish일 때만 생성하여 장면에 추가하고 컨트롤이 있으면 attach한다.
            제어 객체 참조를 반환한다.
    #isChildrenAdapter(adapter: U3dAdaptedGeometry) -> boolean
        동작: 현재 선택 루트와 adapter로 자손 여부를 판정하여 반환한다.
    intersectAdapter(adapter: U3dAdaptedGeometry) -> UAnalyGizmoModelIntersection | undefined
        의존:
            U3dAdaptedGeometry — 종류·수명·경계 교차; 속성 읽기: {_disposed}; 함수: {intersectBox()}
            defined — 입력 존재 판정; 함수: {defined()}
        동작:
            adapter가 없거나 U3dAdaptedGeometry 및 하위 타입이 아니거나 _disposed이면 undefined로 종료한다.
            선택 대상의 후손이면 undefined로 종료한다.
            #controlBound를 전달한 intersectBox 결과를 그대로 반환한다.
    intersectAdapters(adapters: Array<U3dAdaptedGeometry>) -> Array<UAnalyGizmoModelIntersection>
        의존: defined — 교차 결과 존재 판정; 함수: {defined()}
        동작:
            배열이 아니거나 비었으면 빈 배열을 반환한다.
            각 adapter의 정의된 교차 결과를 모은다.
            유한 distance를 오름차순으로 정렬하며 비유한 값은 Infinity로 취급한다.
    setManualUpdate(position: WorldPositionVector3) -> void
        의존: UGizmoControls(_control) — 연결 대상 변경; 속성 읽기: {object}; 함수: {detach(), attach()}
        동작:
            isVector3가 truthy가 아니면 종료한다.
            이미 제어 객체에 연결되어 있으면 위치 복사와 월드 행렬 갱신만 수행한다.
            그 밖에는 컨트롤을 detach하고 제어 객체 위치·월드 행렬을 갱신한 뒤 attach한다.
            대상 모델의 변환은 여기서 적용하지 않는다.
    #createControlObject() -> GizmoControlObject
        동작: 선택 전 기준값을 가진 숨겨진 편집 제어 객체를 준비하여 반환한다.
    #getCentroidOfTargets(target: Array<Object3D> = []) -> Vector3 | undefined
        의존:
            THREE — 합산 위치; 생성자: {new Vector3()}
            defined — 유효 위치 판정; 함수: {defined()}
        동작:
            비었으면 undefined를 반환한다.
            각 대상에서 정의된 위치만 합산하고 그 개수로 나눈 새 벡터를 반환하며 유효 위치가 없으면 undefined를 반환한다.
    #canUseThreeWorld(obj: Object3D) -> boolean
        의존: defined — 조상 갱신 함수 존재 판정; 함수: {defined()}
        동작: 조상 중 isObject3D가 falsy이거나 updateMatrixWorld가 정의되지 않은 객체가 있으면 false를 반환하며 나머지는 true를 반환한다.
    #asPoint3(obj: Object3D) -> Vector3 | undefined
        의존:
            THREE — 위치·회전·행렬 변환; 생성자: {new Vector3()}; 함수: {Object3D.getWorldPosition()}
            defined — 입력·위치 존재 판정; 함수: {defined()}
        동작:
            obj가 정의되지 않았으면 undefined를 반환한다.
            obj가 defined인 경우:
                isObject3D가 truthy인 경우:
                    조상이 Three.js 월드 조회를 지원하면 getWorldPosition의 새 벡터를 반환한다.
                    조상이 지원하지 않으면 위치·quaternion 또는 Euler·배율을 사용하여 로컬 행렬을 합성한다.
                    이 경로의 누락 위치·회전·배율은 각각 0·단위 회전·1로 대체하고 부모 월드 행렬과 곱한 위치를 공유 임시 벡터에 반환한다.
            Object3D가 아니면 position.x가 숫자인 경우 로컬 position의 새 벡터를 반환하며 그 밖에는 undefined를 반환한다.
    #applyControlObject(target: Array<Object3D> = []) -> void
        의존: THREE — 경계·변환 계산; 생성자: {new Vector3()}; 함수: {Object3D.updateMatrixWorld(), Object3D.dispatchEvent()}
        동작:
            대상이 비었으면 종료하고 대상 중심이 없으면 종료한다.
            경계 크기를 유지하여 제어 객체 월드 위치로 중심을 이동하고 제어 객체의 현재 위치·회전·배율을 복사한다.
            각 Object3D는 #needUpdateWorld가 false일 때만 updateMatrixWorld(true)를 실행하고 플래그를 true로 만든 뒤 월드 행렬을 분해한다.
            그 밖의 대상은 로컬 위치·Euler·배율을 사용하고 누락값은 0·단위 회전·1로 대체한다.
            회전 변화는 현재 제어 회전과 직전 기준 회전의 역을 곱해 정규화하고 대상 회전 뒤에 곱한다.
            대상 중심으로부터의 위치 차이를 새 중심에 더하며 회전·배율로 그 위치 차이를 변형하지 않는다.
            각 축의 현재 제어 배율을 기준 배율과 0.000001 중 큰 값으로 나누어 대상 배율에 곱한다.
            obj.isObject3D가 truthy이면 월드 변환 전체를 적용한다.
            obj.isObject3D가 falsy이면 mode가 rotate·scale일 때 해당 setter를, 나머지는 위치 setter를 사용한다.
            각 대상의 dispatchEvent가 있으면 현재 EVENT.CHANGE를 type으로 하고 대상 자신을 data로 알린다.
            대상 순회가 끝나면 제어 기준 위치·정규화 회전·배율을 갱신한다.
            마지막 계산에서 공유 임시 위치에 남은 값으로 오버레이를 갱신한다.
    #applyWorldMat(obj: Object3D, param1: object = {}) -> void
        인터페이스: param1의 pos·rot·scl은 선택 속성이며 전체 인수의 undefined는 빈 객체, null은 구조 분해 예외이다.
        의존:
            THREE — 자식 행렬 갱신; 함수: {Object3D.updateMatrixWorld()}
            defined — 부모 존재 판정; 함수: {defined()}
        동작:
            기존 월드 변환을 분해하고 pos·rot·scl의 nullish 입력만 기존 값으로 대체하여 새 월드 행렬을 합성한다.
            obj.parent가 defined이면 부모 월드 행렬의 역과 곱하여 로컬 행렬을 구한다.
            obj.parent가 nullish이면 월드 행렬을 그대로 사용한다.
            matrixAutoUpdate를 false로 바꾸고 로컬 행렬·position·quaternion·scale과 계산한 matrixWorld를 기록한다.
            matrixWorldNeedsUpdate를 true로 하고 각 직계 자식에 updateMatrixWorld(true)를 호출하여 변경 알림 전에 하위를 갱신한다.
            matrixWorldAutoUpdate가 false인 대상의 계산된 월드 행렬을 이 단계에서 다시 부모로부터 덮어쓰지 않는다.
    #getWorldMatrixOf(node: Object3D | null) -> Matrix4
        의존: 컴포넌트 부모(node) — 월드 행렬 공급; 함수: {getMatrixWorld()}
        동작:
            직계 node가 Object3D이면 그 matrixWorld를 공유 부모 행렬에 복사하여 반환한다.
            그 밖에는 단위 행렬로 시작하고 조상 경로를 역순으로 탐색한다.
            Object3D를 만나면 그 matrixWorld를 앞에 곱하고 중단하며 다른 부모는 getMatrixWorld 결과로 덮어쓴다.
            공유 부모 행렬을 반환한다.
    #setTargetPosition(obj: Object3D, position: Vector3) -> void
        의존:
            편집 대상(obj) — 위치 변경; 함수: {setPosition(), updateMatrixWorld()}
            defined — 대상 존재 판정; 함수: {defined()}
        동작: obj가 정의되지 않았으면 종료하고 setPosition이 truthy이면 호출하며 아니면 position.copy가 있을 때 복사한 뒤 updateMatrixWorld(true)를 호출한다.
    #setTargetRotation(obj: Object3D, rotation: Quaternion | Euler) -> void
        의존:
            편집 대상(obj) — 회전 변경; 함수: {setRotation(), updateMatrixWorld()}
            __GError__ — 회전 타입 오류; 함수: {__GError__()}
        동작:
            obj가 falsy이면 종료한다.
            Euler는 그대로 쓰고 Quaternion은 공유 Euler로 변환하며 나머지는 0516652 오류를 기록하고 종료한다.
            setRotation이 truthy이면 호출하고 아니면 rotation.copy가 있을 때 복사한 뒤 updateMatrixWorld(true)를 호출한다.
    #setTargetScale(obj: Object3D, scale: Vector3) -> void
        의존: 편집 대상(obj) — 배율 변경; 함수: {setScale(), updateMatrixWorld()}
        동작: obj가 falsy이면 종료하고 setScale이 truthy이면 호출하며 아니면 scale.copy가 있을 때 복사한 뒤 updateMatrixWorld(true)를 호출한다.
    #updateOverlay(position: Vector3) -> void
        의존:
            UAnaly — 앱 참조; 속성 읽기: {_app}
            defined — 오버레이·변환 결과 존재 판정; 함수: {defined()}
            U3dApp(_app) — 위경도 변환; 함수: {vector3ToGeoGraphic()}
            U3dOverlay — 위치와 변경 알림; 함수: {setPosition(), callOnchange()}
        동작: 오버레이나 변환한 위경도가 없으면 종료하고 위경도·원본 위치로 setPosition한 뒤 callOnchange를 호출한다.
    getControl() -> UGizmoControls | undefined
        동작: _control 참조를 생성 없이 반환한다.
    override update() -> void
        인터페이스: 등록한 갱신 콜백의 this는 분석 인스턴스이다.
        의존: UAnaly — 앱 화면 갱신 요청; 함수: {update()}
        동작:
            부모 update를 먼저 호출한다.
            현재 대상 변환을 적용한다.
            보조 레이저를 갱신한다.
            사용자 갱신 콜백이 있으면 분석 객체·대상 배열·제어 객체·경계 참조를 순서대로 전달한다.
    createGizmo() -> void
        의존:
            UAnaly — 앱·주석 장면 참조; 속성 읽기: {_app, _sceneComment}
            __GInfo__ — 앱 누락 안내; 함수: {__GInfo__()}
            U3dApp(_app) — 카메라·DOM 공급; 함수: {getCamera(), getRenderer()}
            UGizmoControls — 컨트롤 생성·이벤트; 생성자: {new UGizmoControls()}; 함수: {addEventListener()}
            UScene(_sceneComment) — 컨트롤 등록; 함수: {add()}
        동작:
            앱 또는 주석 장면이 없으면 5561263 안내만 출력하고 종료한다.
            기존 기즈모를 제거한다.
            현재 카메라·renderer의 DOM·앱으로 컨트롤을 만들고 mouseUp에 생성자에서 바인딩해 보관한 종료 콜백을 등록한다.
            dragging-changed 콜백을 등록한다.
                e.value의 진릿값을 #isDrag에 저장한다.
                #useLaser가 falsy이면 레이저를 숨기고 콜백을 종료한다.
                그 외에는 e.value가 truthy이면 레이저를 표시하고 falsy이면 숨긴다.
            주석 장면에 컨트롤을 추가하며 제어 객체는 재생성·attach하지 않는다. [확인 Q-002]
    removeGizmo() -> void
        의존:
            UAnaly — 분석·주석 장면 참조; 속성 읽기: {_scene, _sceneComment}
            defined — 자원·저장값 존재 판정; 함수: {defined()}
            UGizmoControls — 연결·자원 해제; 함수: {removeEventListener(), detach(), dispose()}
            UScene — 장면 분리; 함수: {remove()}
            UDEF — 제어 객체 해제; 정적 함수: {disposeObject3D()}
        동작:
            컨트롤이 있으면 주석 장면에서 분리하고 mouseUp 등록을 해제한 뒤 detach·dispose하고 _control을 undefined로 만든다.
            제어 객체가 있으면 분석 장면에서 분리·해제하고 참조를 비운다.
            레이저를 제거한다.
            현재 대상들의 정의된 userData.origin을 undefined로 만들고 비어 있지 않았던 대상 목록을 새 빈 배열로 교체한다.
            오버레이 참조가 있으면 비우며 오버레이 자체를 해제하지 않는다.
    #getRootObject(objects: Array<Object3D>) -> Array<Object3D>
        동작: 선택 후보에서 부모·자식 중복 없는 루트 목록을 구하여 반환한다.
    #setTargetBound() -> void
        동작: 현재 선택 루트와 #controlBound를 전달하여 편집 경계를 갱신한다.
    setObject(object: Array<Object3D> | Object3D) -> void
        의존:
            __GSError__ — 경계 오류 기록; 함수: {__GSError__()}
            defined — 부모·원본 변환 존재 판정; 함수: {defined()}
            UAnaly — 활성 상태; 속성 읽기: {_isActive}
        동작:
            _isActive가 falsy이면 종료한다.
            _isActive가 truthy인 경우:
                제어 객체를 확보한다.
                단일 입력을 배열로 감싸고 필터한 루트를 #target으로 교체한다.
                경계 계산 오류는 기록하고 후속 초기화를 계속한다.
                루트 배열이 아닌 원래 입력 배열로 제어 중심·기준 변환을 초기화하고 #needUpdateWorld를 false로 만든다.
                각 루트와 직계 부모의 hasGizmo에 현재 컨트롤을 기록한다.
                obj.userData가 nullish이면 userData를 만든다.
                origin이 없을 때만 로컬 position·rotation·scale의 복사본을 저장한다.
    objectChange() -> void
        의존:
            이벤트 수신 객체(userData.class) — 변경 알림; 함수: {dispatchEvent()}
            defined — 컨트롤·수신 객체 존재 판정; 함수: {defined()}
            UAnaly — 분석 알림; 함수: {dispatchEvent()}
        동작:
            _control이 nullish이면 생성을 시도한다.
            각 대상의 userData.class가 정의되었으면 해당 객체에 onChange와 data·control을 전달한다.
            userData.class의 정의 여부와 관계없이 각 대상에 대해 분석 객체에 onChange와 userData.class를 data로 전달한다.
    override clear() -> void
        동작:
            _targetScenes를 새 빈 배열로 바꾼다.
            _control이 truthy일 때만 기즈모를 제거한다.
    reset(object?: Array<Object3D> | Object3D) -> void
        의존: defined — 대상·원본 변환 존재 판정; 함수: {defined()}
        동작:
            object가 nullish이면 현재 대상을 사용하고 단일 입력을 배열로 감싼다.
            obj.userData.origin이 defined이면 저장한 위치·회전·배율을 순서대로 적용한다.
            전달한 대상 배열로 제어 중심과 기준을 초기화하며 선택 경계와 #needUpdateWorld는 다시 계산하지 않는다.
    #resetGizmo(object: Array<Object3D>, controlObj: GizmoControlObject | undefined) -> void
        의존:
            THREE — 제어 행렬·기준 위치; 생성자: {new Vector3()}; 함수: {Object3D.updateMatrixWorld()}
            defined — 대상·제어 객체 존재 판정; 함수: {defined()}
        동작:
            제어 객체나 대상이 nullish이거나 빈 배열이면 종료한다.
            대상 중심을 구하여 정의되었으면 제어 위치로 복사한다.
            제어 회전은 0·배율은 1로 만들고 월드 행렬을 갱신한다.
            기준 위치는 중심 또는 새 영벡터, 기준 회전은 단위 회전, 기준 배율은 1로 기록한다.
    setOverlay(overlay: U3dOverlay) -> void
        동작: U3dOverlay와 하위 타입이면 #overlay에 저장하고 그 밖의 값은 무시한다.
    getOverlay() -> U3dOverlay | undefined
        동작: #overlay 원본 참조를 반환한다.
    setMode(mode: string | number) -> void
        의존:
            defined — 컨트롤 존재 판정; 함수: {defined()}
            UGizmoControls — 모드 조회·변경; 함수: {getMode(), setMode()}
            Web API — 미지원 모드 경고; 함수: {console.warn()}
        동작:
            _control이 nullish이면 생성을 시도한다.
            숫자는 0·1·2를 translate·rotate·scale로 치환하고 문자열은 소문자로 바꾼다.
            허용 목록에 없으면 경고하고 종료하며 현재 모드와 같으면 종료한다.
            컨트롤이 있으면 setMode에 전달한다.
    getMode() -> string
        의존:
            UGizmoControls — 모드 조회; 함수: {getMode()}
            defined — 컨트롤 존재 판정; 함수: {defined()}
        동작:
            _control이 nullish이면 생성을 시도한다.
            getMode의 nullish 결과를 translate로 대체하여 반환한다.
    #initLasers() -> void
        의존:
            UAnaly — 분석 장면 참조; 속성 읽기: {_scene}
            THREE — 공유 형상·기본 스타일·축; 생성자: {new CylinderGeometry(), new MeshBasicMaterial(), new Vector3()}
            UScene(_scene) — 레이저 등록; 함수: {add()}
        동작:
            레이저 목록 길이가 0이 아니면 종료한다.
            반지름 0.05·길이 1·둘레 분할 8의 원기둥 형상과 초록색·투명·불투명도 0.7의 기본 재질을 만든다.
            x·y·z 축마다 공유 형상과 복제 재질의 메시를 준비한 뒤 장면·목록에 추가한다.
    removeLasers() -> void
        의존:
            UAnaly — 분석 장면 참조; 속성 읽기: {_scene}
            UScene(_scene) — 레이저 분리; 함수: {remove()}
            UDEF — 레이저 해제; 정적 함수: {disposeObject3D()}
        동작: 목록이 비었으면 종료하고 각 메시를 장면에서 분리·해제한 뒤 배열 길이를 0으로 만든다.
    showLaser() -> void
        동작: 레이저를 준비한 뒤 모든 메시를 표시한다.
    hideLaser() -> void
        동작: 목록이 비었으면 종료하고 모든 메시를 숨긴다.
    #updateLaser() -> void
        의존: UGizmoControls — 편집 모드; 함수: {getMode()}
        동작:
            레이저 미사용·비드래그·빈 목록이면 종료한다.
            모드가 translate가 아니면 숨기고 종료한다.
            제어 객체의 월드 위치로 각 레이저를 이동하고 y축을 각 축으로 회전한다.
            userData.radius의 nullish 값만 1로 대체하여 두께에 쓰고 길이 배율은 3000으로 설정한다.
    override active() -> void
        의존:
            UAnaly — 활성 상태와 앱 참조; 함수: {active()}; 속성 읽기: {_isActive, _app}
            U3dApp — 기존 클릭 해제; 함수: {unkey()}
            UGizmoControls — 이벤트 연결; 함수: {addEventListener()}
        동작:
            _isActive가 truthy이면 종료한다.
            _isActive가 falsy인 경우:
                부모 active를 호출한다.
                _clickId가 nullish가 아니면 앱의 click 등록을 해제한다.
                _control이 falsy이면 생성한다.
                컨트롤이 있으면 change·objectChange·mouseUp에 이 분석 객체를 this로 bind한 함수를 등록한다.
    override deactive() -> void
        의존: UAnaly — 비활성 상태·분석 이벤트 해제; 함수: {deactive()}; 속성 읽기: {_isActive}
        동작:
            _isActive가 falsy이면 종료한다.
            _isActive가 truthy인 경우:
                부모 deactive를 호출한 뒤 _clickId를 undefined로 만든다.
                _control이 truthy이면 리스너의 change·objectChange·mouseUp 배열을 새 빈 배열로 바꾸고 clear한다.
    onEnd() -> void
        의존:
            defined — 컨트롤·원본 변환·ID 존재 판정; 함수: {defined()}
            UAnaly — 앱 참조와 종료 알림; 함수: {dispatchEvent()}; 속성 읽기: {_app}
            UGizmoControls — 편집 정보; 함수: {getMode()}; 속성 읽기: {_offset, axis}
            U3dApp — 편집 완료 통지; 함수: {editedMesh()}
        동작:
            _control이 nullish이면 생성을 시도한다.
            모드가 nullish이면 translate를 사용한다.
            각 대상의 이동량·rotation·scale 참조와 정의된 origin.position을 editData로 구성한다.
            id는 정의된 userData.id, 정의된 _opt.id, Object3D.id 순서로 선택한다.
            position 참조·editData·모드·nullish일 때 null인 axis를 앱의 editedMesh에 전달한 뒤 분석 end 이벤트를 알린다.
    setTargetScene(scene?: Object3D) -> void
        의존: defined — 장면 존재 판정; 함수: {defined()}
        동작: scene이 정의되었으면 _targetScenes에 추가하고 아니면 새 빈 배열로 교체한다.
    getMetaXML() -> Document | undefined
        의존:
            UAnaly — 앱·좌표 변환 문맥 참조; 속성 읽기: {_app, _drawArg}
            defined — 메타 XML 입력 존재 판정; 함수: {defined()}
            UDrawArg — 위치·경계 환산; 함수: {getWorldToGeographic(), getWorldToGoogle()}
            UDEF — 회전 단위 환산; 정적 함수: {degrees()}
            THREE — 모델 경계; 생성자: {new Box3()}; 함수: {Box3.setFromObject()}
            Web API — XML 해석; 생성자: {new DOMParser()}; 함수: {DOMParser.parseFromString()}
        동작:
            앱·컨트롤·target·drawArg 중 nullish 값이 있으면 undefined로 종료한다.
            target 배열을 단일 객체로 간주하여 position·rotation·scale을 읽으므로 일반 선택 상태에서 TypeError가 발생한다. [확인 Q-001]
            객체형 속성이 별도로 공급된 경로에서는 위치·도 단위 회전·배율·월드 경계를 구성한다.
            제목은 _xml이 있으면 _title만 사용하고 없으면 _name을 사용한다.
            생성한 XML 문자열을 application/xml로 해석하여 반환한다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
