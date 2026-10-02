# U3dMultipleComponentLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dMultipleComponentLayer`는 여러 종류의 3D 에셋을 미리 로드한 뒤, 각 에셋을 위치·회전·크기·애니메이션·라벨·속성이 있는 컴포넌트로 반복 배치하고 하나의 레이어에서 관리한다. 동일 에셋을 많이 배치할 때는 인스턴스 렌더 구조를 사용하고, 개별 객체 제어가 필요할 때는 일반 컴포넌트를 사용한다.

### 1.2 책임 범위

- 원본 3D 에셋 목록을 기반 레이어에서 로드하고 이름으로 조회한다.
- 일반 컴포넌트와 인스턴스 컴포넌트를 생성하여 scene, 목록과 이름 색인에 연결한다.
- 인스턴스별 변환·가시성 metadata, 모델·그룹별 렌더 mesh와 cache를 관리한다.
- 컴포넌트의 검색, picking, 영역 판정, 애니메이션, 라벨, 카메라 추적과 스타일 제어 API를 제공한다.
- 컴포넌트 상태의 저장·복원과 부모·자식 계층 복구를 조정한다.
- 컴포넌트와 인스턴스 렌더 자원을 개별 또는 일괄 제거한다.

책임 경계: 모델 파일 형식별 파싱과 원본 모델 scene 관리는 `U3dModelBasicLayer`가 담당한다. 개별 컴포넌트의 이동 경로·라벨·충돌·카메라 추적 동작은 `U3dComponentPosition` 또는 `U3dComponentInstancedPosition`이 담당하고, 이 레이어는 생성 옵션과 공통 제어를 전달한다.

### 1.3 주요 동작 방식

모델을 먼저 로드하면 `addPosition()`이 입력 좌표와 모델을 정규화하고 일반 또는 인스턴스 생성 경로를 선택한다. 일반 경로는 원본 모델을 clone하여 컴포넌트가 직접 소유하고, 인스턴스 경로는 모델별 metadata Map에 ID를 발급한 뒤 ID를 최대 그룹 크기로 나누어 렌더 그룹과 mesh cache를 재사용한다. 생성 결과에는 라벨·가시성·경로·속성·재질·조명과 현재 애니메이션 상태를 적용하고, 이름이 중복되지 않은 결과만 목록·이름 색인에 등록한다.

인스턴스 mesh는 원본 child matrix와 컴포넌트 변환을 합성하여 instance matrix, 원본 matrix Map과 선택용 dummy 객체를 함께 관리한다. 제거할 때는 컴포넌트 metadata와 실제 instance, matrix Map, edge line을 정리하고, 모델 정보가 비거나 최고 사용 그룹이 낮아지면 해당 범위의 그룹과 cache를 제거한다.

관찰된 실행 특성: 프레임 갱신 대상이 550개를 넘으면 모든 컴포넌트의 카메라 거리는 매번 계산하고, 실제 `update()`는 cursor를 사용하여 한 번에 최대 550개씩 순환 실행한다. 따라서 갱신 본체는 분산되지만 거리 갱신 비용은 전체 컴포넌트 수에 비례한다.

### 1.4 주요 사용처와 연계 대상

- `U3dApp.createMultipleComponentLayer()`의 공개 layer 생성 경로
- `UAnalyMultipleComponent`의 분석 대상 컴포넌트 생성·조회 경로
- 애니메이션·비행·실내·대용량 컴포넌트 예제의 모델 로드와 반복 배치
- `U3dLodComponentLayer`가 재사용하는 다중 컴포넌트 관리 기반
- `U3dComponentPosition`과 `U3dComponentInstancedPosition`의 생성·공통 제어자

## 3. 정규 자연어 수도코드

```spec
U3dMultipleComponentLayerCO 타입 정의
    U3dModelBasicLayerCO와 U3dMultipleComponentLayerCO_Content를 합성하여 기반 모델 옵션과 컴포넌트 기본 설정을 함께 받는다.

U3dMultipleComponentLayerCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        scale?: Vector3Like
            이후 생성하는 컴포넌트의 layerScale 저장값이며 생략하면 각 축에 1을 사용한다. 개별 렌더 scale은 별도 opt.scale이 결정한다. [확인 Q-009]
        rotation?: Vector3Like
            이후 생성하는 모든 컴포넌트에 전달할 레이어 회전이며 생략하면 각 축에 0을 사용한다. [확인 Q-009]
        collisiondistance?: number
            생성하는 컴포넌트에 전달할 충돌 감지 거리이며 생략하면 10을 사용한다.
        collisionFunction?: function
            컴포넌트의 충돌 처리에 전달할 callback이다.
        setInstanced?: boolean
            기본 컴포넌트 생성 방식을 지정하며 생략하면 true이다.
        instancedMaxCount?: number
            한 인스턴스 렌더 그룹이 보유할 최대 ID 범위이며 생략하면 500이다.
        labelVisible?: boolean
            새 컴포넌트의 기본 라벨 가시성이며 생략하면 false이다.
        image?: string
            이후 생성하는 컴포넌트에 공통으로 전달할 image 설정이다.
        drawPath?: boolean
            레이어의 경로 표시 설정으로 저장하며 생략하면 false를 사용하지만, 현재 논리적 소스 단위에는 이 값을 다시 읽는 경로가 없다. [확인 Q-021]
        typePath?: string
            레이어의 경로 유형으로 저장하며 생략하면 `line`을 사용하지만, 현재 논리적 소스 단위에는 이 값을 다시 읽는 경로가 없다. [확인 Q-021]
        axis?: Vector3Like
            레이어의 회전축 설정으로 저장하며 생략하면 각 축에 0을 사용하지만, 현재 논리적 소스 단위에는 이 값을 다시 읽는 경로가 없다. [확인 Q-021]
        rotateAngle?: number
            레이어의 회전 각도 설정으로 저장하며 생략하면 0을 사용하지만, 현재 논리적 소스 단위에는 이 값을 다시 읽는 경로가 없다. [확인 Q-021]

ComponentCreateOption 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
            생성할 컴포넌트 이름이며 레이어 이름 색인의 key로 사용한다.
        object?: string
            미리 로드한 모델 이름이다.
        loadedModel?: string
            object가 없을 때 대신 사용할 미리 로드한 모델 이름이다.
        geoPosition?: GeoPosition
            geographic 좌표로 입력하는 생성 위치이다.
        worldPos, google, position?: Vector3Like
            world 좌표로 입력하는 생성 위치 후보이다.
        rotation?: Euler | Vector3Like
            컴포넌트 회전이다.
        scale?: Vector3 | Vector3Like
            컴포넌트 크기이다.
        instanced?: boolean
            이 컴포넌트에 적용할 생성 방식이며 생략하면 레이어 기본값을 사용한다.
        visible?: boolean
            생성 직후 컴포넌트 가시성이다.
        labelVisible?: boolean
            생성 직후 라벨 가시성이며 생략하면 레이어 기본값을 사용한다.
        movepointlist?: Array<object>
            경로 이동에 사용할 위치 목록이다.
        pitchyawrolllist?: Array<object>
            이동 위치별 자세 목록이다.
        pathgeometry?: object
            U3dComponentPosition 계열 컴포넌트에 연결할 경로 geometry이다.
        properties?: Record<string, unknown>
            컴포넌트에 저장할 사용자 속성이다.
        style?: object
            색상·불투명도·밝기·대비·채도와 mesh의 depthTest·depthWrite·renderOrder 설정이다.
            brightness와 contrast는 0 이상의 유한한 숫자이며 Float32로 표현 가능해야 한다. undefined·null은 생략으로 처리한다.
        lights?: Array<object>
            컴포넌트에 연결할 spot light 옵션 목록이다.
        animationNum?: number
            legacy batched skinned mesh에 적용할 animation clip index이며 생략하면 0을 사용한다.
        type?: string
            `batchedMesh`이면 legacy batched skinned mesh 생성 경로를 선택한다.
        drawPolygon?: Object3D | Record<string, unknown>
            값이 존재하고 이동점 목록이 없을 때 polygon 경로 입력을 시작하도록 빈 이동점 목록을 준비한다.
        pathOpacity, pathopacity?: number
            생성한 컴포넌트의 경로 불투명도 설정에 전달한다.
        pathColor, pathcolor?: ColorLike
            생성한 컴포넌트의 경로 색상 설정에 전달한다.
        hovering?: boolean
            생성한 컴포넌트의 hovering 설정에 전달한다.
        color?: ColorLike
            생성한 컴포넌트의 기본 색상 설정에 전달한다.
        isUpdate?: boolean
            새 instance 생성 시 entity 전체에 변환을 즉시 반영할지 제어하며 componentSetting 단계에서 생략하면 true로 정규화한다.
        mixers?: Array<AnimationMixer>
            생성 과정에서 초기화되어 원본 모델 animation mixer를 컴포넌트에 전달하는 내부 확장 필드이다.

U3dMultipleComponentLayerStyle 타입 정의
    color?: ColorLike
        전체 컴포넌트에 적용할 색상이다.
    opacity?: number
        전체 컴포넌트에 적용할 불투명도이며 0 이상 1 이하이다.
    visible?: boolean
        전체 컴포넌트의 가시화 여부이다.
    brightness?: number
        전체 컴포넌트에 적용할 밝기 배율이며 0 이상의 Float32 유한값이다.
    contrast?: number
        전체 컴포넌트에 적용할 대비 배율이며 0 이상의 Float32 유한값이다.

U3dMultipleComponentModelInfo 타입 정의
    이 명세에서 사용하는 필드:
        name: string
            사용자가 지정한 원본 3D 에셋 이름이다.
        baseurl: string
            모델 파일을 불러올 기본 URL이다.
        fileName: string
            확장자를 포함한 원본 모델 파일명이다.
        ext: string
            모델 파일의 형식을 지정한다.

ComponentSaveDate 타입 정의
    layer: string
        저장된 컴포넌트가 사용하는 원본 모델 이름이다.
    components: Array<ComponentParam>
        해당 모델에서 복원할 컴포넌트 parameter 목록이다.

ChangeObjectOpt 타입 정의
    이 명세에서 사용하는 필드:
        object: string
            컴포넌트가 교체하여 사용할 미리 로드한 모델 이름이다.
        animationNum: number
            교체 요청에서 새 모델에 지정할 animation clip index이다. 현재 changeObject의 일반·인스턴스 교체 경로 모두 이 값을 실제 animation 선택에 적용하지 않는다. [확인 Q-015]
        position: WorldPosition
            인스턴스 교체 모델의 world 위치이며 생략하면 기존 object 위치를 사용한다. 일반 컴포넌트 교체 경로에서는 입력값을 읽지 않는다. [확인 Q-016]
        scale: Vector3Like
            새 모델의 축별 크기이다.
        rotation: Vector3Like
            새 모델의 축별 degree 회전으로 선언되어 있다. 현재 인스턴스 교체 경로는 축값 크기로 단위를 추정하고 컴포넌트 상태에 다시 degree 변환을 적용한다. [확인 Q-017]

InstancedInputOption 부분 타입 명세
    이 명세에서 사용하는 필드:
        position?: WorldPositionVector3
            instance의 world 위치이다.
        rotation?: Euler | Vector3Like
            instance의 축별 회전이다.
        scale?: Vector3 | Vector3Like
            instance의 축별 크기이다.
        visible?: boolean
            instance의 초기 가시성이다.
        labelVisible?: boolean
            instance 컴포넌트의 초기 라벨 가시성이다.
        name?: string
            instance를 소유하는 컴포넌트 이름이다.

CameraViewOption 타입 정의
    이 명세에서 사용하는 필드:
        component: ComponentObject
            카메라가 추적할 대상 컴포넌트이다.
        view: string
            대상의 정면·상단 또는 3인칭 방향을 나타내는 view 이름이다.
        active: boolean
            대상 컴포넌트의 카메라 추적 활성 여부이다.
        offset: Vector3Like
            대상 기준 카메라 위치 보정값이다.
        targetOffset?: Vector3Like
            카메라가 바라볼 지점의 보정값이다.

InstancedComponentInfo 타입 정의
    이 명세에서 사용하는 필드:
        position: Vector3
            instance의 world 위치이다.
        rotation: Euler
            instance에 적용할 회전이다.
        scale: Vector3
            instance에 적용할 크기이다.
        visible: boolean
            instance 가시성이다.
        labelVisible: boolean
            instance 컴포넌트의 라벨 가시성이다.
        name: string
            레이어 이름 색인에서 컴포넌트를 찾을 이름이다.
        mixers?: Array<AnimationMixer>
            인스턴스 모델 교체 경로에서 임시로 수집하는 animation mixer 목록이다. 새 mixer를 수집하지만 기존 컴포넌트에 연결하지 않는다. [확인 Q-018]

InstancedInfo_Content 타입 정의
    lastIndex?: number
        다음 instance ID 발급과 마지막 유지 렌더 그룹 계산의 기준이 되는 현재 최고 ID이다.

InstancedInfo 타입 정의
    Map<number, InstancedComponentInfo>와 InstancedInfo_Content를 합성한다. 숫자 ID의 배치 정보와 lastIndex를 같은 Map 객체에 보관한다.

InstancedInfoStore 타입 정의
    모델 이름을 key로 하고 `InstancedInfo`를 값으로 갖는 Map이다.

ComponentObjectBase 타입 정의
    일반 U3dComponentPosition 또는 U3dComponentInstancedPosition의 공통 제어 대상을 나타낸다.

ComponentObject 타입 정의
    ComponentObjectBase와 Record<string, any>를 합성한 타입이며 현재 목록·조회·생성 API에서 사용한다.

U3dMultipleComponentLayerEMI_Content 타입 정의
    BEFORE_CREATE: string
        컴포넌트용 모델을 복사하기 전의 이벤트 이름이다.
    CREATE: string
        컴포넌트 생성 후 결과를 전달하는 이벤트 이름이다.

U3dMultipleComponentLayerEMI 타입 정의
    U3dLayerEMI와 U3dMultipleComponentLayerEMI_Content를 합성하여 기반 레이어 이벤트와 생성 이벤트를 함께 제공한다.

TypedUInstancedMesh 타입 정의
    UInstancedMesh에 모델명, 그룹 번호, instance 원본·적용 행렬 Map과 barrier 정보를 함께 기록하는 확장 타입이다.

InstancedMeshLike 타입 정의
    일반·skinned용 TypedUInstancedMesh 또는 legacy batched skinned mesh를 함께 나타낸다.

SearchArea 타입 정의
    polyPoints: Array<Vector2>
        geographic 입력을 world XY 평면으로 변환한 polygon 꼭짓점이다.
    polyBox: Box2
        빠른 사전 교차 판정에 사용하는 polygon 축 정렬 경계이다.
    polyEdges: Array<Array<Vector2>>
        정밀 선분 교차 판정에 사용하는 polygon 변 목록이다.

U3dMultipleComponentLayer extends U3dModelBasicLayer 클래스 정의
    의존: U3dModelBasicLayer — 원본 모델 load·scene·layer 생명주기 기반 상속; 상속: {U3dModelBasicLayer}

    static OPT_KEYS: Array<string>
        의존: U3dModelBasicLayer — 기반 옵션 정규화 key 재사용; 속성 읽기: {OPT_KEYS}
        기반 옵션과 컴포넌트 레이어 옵션의 대소문자 정규화 기준이다.

    static EVENT: object
        의존: U3dModelBasicLayer — 기반 layer event 재사용; 속성 읽기: {EVENT}
        기반 이벤트에 모델 복사 직전 `BEFORE_CREATE`와 컴포넌트 생성 완료 `CREATE`를 추가한다.

    #updateState: object
        대량 컴포넌트 프레임 갱신의 다음 시작 cursor를 보관한다.

    _renderIndex: number = 0
        legacy 순환 렌더 조회가 다음에 반환할 컴포넌트를 결정하는 index이다.

    _componentList: Array<ComponentObject> = 빈 배열
        생성 순서대로 컴포넌트를 보관하는 순회 기준 목록이다.

    _componentMap: Map<string, ComponentObject> = 빈 Map
        컴포넌트 이름으로 대상을 찾는 색인이다.

    _setInstanced: boolean
        새 컴포넌트의 기본 생성 방식을 제어한다.

    _instancedInfo: InstancedInfoStore = 빈 Map
        모델 이름별 instance ID와 변환·가시성 정보를 보관한다.

    _instancedObject: UGroup | undefined
        모델과 ID 구간별 인스턴스 렌더 그룹을 scene에 연결하는 상위 그룹이다.

    _cacheMeshList: Record<string, Object3D> = 빈 객체
        모델·child 순서·그룹 번호별 인스턴스 렌더 mesh를 재사용한다.

    _instancedMaxCount: number = 500
        하나의 인스턴스 그룹에 배정하는 ID 구간 크기이다.

    _bboxMap: Map<string, UBox3> = 빈 Map
        모델 이름별 원본 경계 상자를 보관한다.

    _animateList: Array<string> = 빈 배열
        레이어에 등록된 주행 애니메이션 이름 목록이다.

    _animationPlaybackState: 'playing' | 'paused' | 'stopped' = 'stopped'
        새 컴포넌트 생성 시 이어받을 이동·내장 애니메이션 재생 상태이다.

    _scale: Vector3Like
        이후 생성하는 컴포넌트의 layerScale metadata로 전달하는 값이며 개별 렌더 scale에는 직접 적용하지 않는다.

    _rotation: Euler
        이후 생성하는 컴포넌트에 전달할 레이어 회전이다.

    _image: string | undefined
        이후 생성하는 컴포넌트에 공통으로 전달하는 layer image 설정이다.

    labelVisible: boolean = false
        레이어 전체 라벨 가시성과 새 컴포넌트의 기본값이다.

    constructor(opt: Partial<U3dMultipleComponentLayerCO>)
        역할: 다중 컴포넌트와 인스턴스 렌더 상태를 관리할 레이어를 초기화한다.
        의존:
            normalizeOptionKeys — 생성 옵션 key 정규화; 함수: {normalizeOptionKeys()}
            defined — 생성 옵션 존재 여부 판정; 함수: {defined()}
            console — 생성 옵션 누락 안내 출력; 함수: {info()}
            U3dModelBasicLayer — 모델 레이어 기반 상태 초기화; 생성자: {super()}
            defaultValue — 선택 옵션 기본값 적용; 함수: {defaultValue()}
            THREE — 레이어 회전값 생성; 생성자: {new Euler()}
            UScene — 컴포넌트 POI scene 생성; 생성자: {new UScene()}
            UCheckTime — 갱신 시간 검사 객체 생성; 생성자: {new UCheckTime()}
            UGroup — 인스턴스 상위 그룹 생성; 생성자: {new UGroup()}
        동작:
            옵션 key를 현재 클래스의 OPT_KEYS에 맞게 정규화한다. 입력 생략·null·비객체는 normalizeOptionKeys가 빈 객체로 바꾼다.
            정규화 결과가 없다면 안내 후 super 호출 전에 종료를 시도하지만 현재 정규화 함수의 정상 반환으로는 이 분기에 들어가지 않는다. 결과가 있으면 기반 모델 레이어를 초기화한다.
            컴포넌트 목록·이름 색인과 모델별 instance 정보·경계·mesh cache를 빈 상태로 만든다.
            scale, rotation, image, 충돌 설정, 인스턴스 기본 모드·그룹 크기와 라벨 기본값을 저장한다. camel 표기의 collisionDistance는 정규화 뒤 생성자가 읽는 key와 다를 수 있다. [확인 Q-001]
            drawPath, typePath, axis와 rotateAngle도 레이어 속성에 저장하지만 현재 논리적 소스 단위에서는 다시 사용하지 않는다. [확인 Q-021]
            인스턴스 모드이면 scene에 연결할 상위 UGroup을 만들고 프레임 갱신 cursor를 0으로 초기화한다.

    표시와 생명주기 책임 그룹
        역할: 레이어와 소속 컴포넌트의 표시·갱신·해제를 함께 제어한다.

        override show() -> void
            의존:
                U3dModelBasicLayer — 기반 layer 표시; 함수: {show()}
                ComponentObject — 개별 컴포넌트 표시; 함수: {show()}
            동작:
                기반 layer를 표시하고 현재 목록의 모든 컴포넌트를 표시한다.
                이동 경로 애니메이션을 시작한다.

        hide() -> void
            의존:
                U3dModelBasicLayer — 기반 layer 숨김; 함수: {show()}
                ComponentObject — 개별 컴포넌트 숨김; 함수: {hide()}
            동작:
                기반 layer와 현재 목록의 모든 컴포넌트를 숨긴다.
                이동 경로 애니메이션을 중지한다.

        setStyle(option: U3dMultipleComponentLayerStyle) -> void
            인터페이스: option에서 값이 있는 속성만 호출 시점에 등록된 모든 컴포넌트에 적용하고, 이후 생성하는 컴포넌트의 기본값은 바꾸지 않는다.
            처리 기준:
                option이 객체가 아니거나 color, opacity, visible, brightness, contrast의 값이 선언된 타입·범위를 벗어나면 상태 변경 전에 TypeError 또는 RangeError를 throw한다.
                undefined와 null인 속성은 생략으로 처리하며 opacity와 brightness의 0, visible의 false는 유효값으로 적용한다.
            의존:
                defined — 각 스타일 속성의 적용 여부 판정; 함수: {defined()}
                THREE — 색상 객체 종류 판정; 생성자: {Color}
                ComponentObject — 개별 스타일과 가시성 적용; 함수: {setColor(), setOpacity(), show(), hide(), setBrightness(), setContrast()}
            동작:
                option의 색상, 불투명도, 가시성, 밝기와 대비를 한 번 읽고 모든 입력을 먼저 검증한다.
                현재 컴포넌트 목록을 순회하여 값이 있는 속성에 대응하는 컴포넌트 메서드만 호출한다.

        override dispose() -> DeferredObject<boolean>
            의존: U3dModelBasicLayer — 기반 layer 자원 해제; 함수: {dispose()}
            동작:
                deprecated 호환 API를 통해 모든 컴포넌트를 제거한다.
                기반 layer의 dispose 결과를 반환한다.

        override update(drawArg?: UDrawArg, curTime?: number) -> void
            처리 기준: app, camera 또는 컴포넌트가 없으면 갱신하지 않는다.
            의존:
                U3dLayer — 상속된 앱 참조 조회; 속성 읽기: {_app}
                U3dApp — idle draw 여부와 카메라 위치·객체 조회; 함수: {isIdleDraw(), getCameraPosition()}; 속성 읽기: {_camera}
            동작:
                _app이 없으면 종료한다.
                _app이 있으면 idle 상태를 읽은 뒤 현재 컴포넌트 목록과 그 길이를 가져온다.
                빈 목록이면 종료하고, 비어 있지 않으면 갱신 cursor 상태와 카메라 위치를 조회한다. 카메라 객체가 없으면 종료한다.
                _app과 app._camera가 있으면 목록·cursor 상태·먼저 읽은 목록 길이·카메라 위치·idle 상태·현재 시각을 내부 배분 계산에 전달한다.

    생성 방식 설정 책임 그룹
        역할: 이후 생성할 컴포넌트의 기본 일반·인스턴스 방식을 관리한다.

        setInstanced(val: boolean) -> void
            의존:
                defined — 인스턴스 상위 그룹 존재 여부 판정; 함수: {defined()}
                UGroup — 누락된 인스턴스 상위 그룹 생성; 생성자: {new UGroup()}
            동작:
                _setInstanced를 입력값으로 바꾼다.
                _instancedObject가 없으면 새 UGroup을 만들어 그 속성에 저장한다.

        isInstanced() -> boolean
            동작: 현재 기본 인스턴스 생성 여부를 반환한다.

    기본 목록 조회 책임 그룹
        역할: 컴포넌트, 모델과 인스턴스 상태를 외부 조회에 제공한다.

        getComponents() -> Array<ComponentObject>
            동작: 현재 컴포넌트 목록 원본을 반환한다.

        getComponentList() -> Array<ComponentObject>
            처리 기준: deprecated API이며 getComponents()와 같은 목록을 반환한다.
            동작: 현재 컴포넌트 목록 원본을 반환한다.

        getPositionList() -> Array<ComponentObject>
            처리 기준: deprecated API이며 getComponents() 사용을 안내한다.
            의존: console — deprecated 안내 출력; 함수: {info()}
            동작: 현재 컴포넌트 목록을 반환한다.

        getListModel() -> Array<U3dMultipleComponentModelInfo>
            의존: U3dModelBasicLayer — 기반 레이어가 관리하는 원본 모델 정보 목록 조회; 속성 읽기: {_listModel}
            동작: 기반 레이어에 로드된 원본 모델 정보 목록을 반환한다.

        getListModelByName(name: string) -> U3dMultipleComponentModelInfo | undefined
            의존: U3dModelBasicLayer — 기반 레이어가 관리하는 원본 모델 정보 목록 검색; 속성 읽기: {_listModel}
            동작: 원본 모델 정보 목록에서 이름이 같은 첫 항목을 반환하고 없으면 undefined를 반환한다.

        getInstancedInfo() -> InstancedInfoStore
            의존: defined — 인스턴스 정보 상태 존재 여부 판정; 함수: {defined()}
            동작: 현재 인스턴스 정보 Map을 반환하고 상태가 없으면 저장되지 않는 빈 Map을 반환한다.

        getComponentByName(name: string) -> ComponentObject | undefined
            처리 기준: 이름 또는 컴포넌트 색인이 없으면 undefined를 반환한다.
            의존: defined — 입력 이름 존재 여부 판정; 함수: {defined()}
            동작: 이름 색인에서 같은 이름의 컴포넌트를 반환한다.

        getComponentsByModel(modelName: string) -> Array<ComponentObject>
            의존: ComponentObject — 컴포넌트가 참조하는 원본 모델명 조회; 속성 읽기: {_object}
            동작: 컴포넌트 목록을 순회하여 원본 object 이름이 입력 모델명과 같은 컴포넌트만 새 배열에 담아 반환한다.

        getComponentsByProperty(callback: Function) -> Array<ComponentObject>
            인터페이스:
                callback 입력: 현재 컴포넌트와 getProperties() 결과
                callback의 this: 현재 U3dMultipleComponentLayer
                반환: callback이 정의된 값을 반환한 항목의 수집 결과
            의존:
                defined — callback 결과 존재 여부 판정; 함수: {defined()}
                주입 callback — 컴포넌트와 속성에 대한 선택·변환 결과 생성; 콜백: {callback(component, properties)}
                ComponentObject — 사용자 속성 조회; 함수: {getProperties()}
            동작:
                각 컴포넌트의 속성을 callback에 전달한다.
                callback 반환값이 undefined가 아니면 컴포넌트가 아니라 반환값 자체를 결과 배열에 추가한다. 선언 반환형과 callback 사용 방식이 일치하는지 확인이 필요하다. [확인 Q-002]
                수집한 배열을 반환한다.

    선택과 공간 검색 책임 그룹
        역할: intersection, trail, 사용자 조건과 geographic polygon을 컴포넌트 선택 결과로 변환한다.

        getComponentByIntersect(intersect: Intersection) -> ComponentObject | undefined
            인터페이스:
                intersect: Three raycaster가 반환한 교차 결과
                반환: 교차 mesh 또는 instance에 대응하는 컴포넌트
            의존:
                defined — 교차 object, metadata와 instance 식별값 존재 여부 판정; 함수: {defined()}
                ComponentObject — 일반·인스턴스 컴포넌트의 렌더 object와 instance 식별 상태 조회; 속성 읽기: {_object, _setInstanced, instanceId}
                THREE.Object3D — 일반 컴포넌트의 object tree 순회; 함수: {traverse()}
            동작:
                교차 object가 없으면 undefined를 반환한다.
                교차 object가 instanced mesh이면 누락된 mesh 그룹 번호와 교차 instanceId를 각각 0으로 대체한 뒤 두 값을 합쳐 모델 전체 instance ID를 계산한다.
                intersect.object가 있고 mesh._objectName이 존재하면 모델별 instance metadata를 조회하고 컴포넌트 이름이 있는 경우 이름 색인으로 반환한다.
                metadata 이름으로 찾지 못하면 컴포넌트 목록에서 같은 모델명과 전체 instance ID를 가진 인스턴스 컴포넌트를 찾는다.
                일반 mesh이면 각 일반 컴포넌트의 object tree에서 교차 mesh와 uuid가 같은 mesh를 가진 컴포넌트를 반환한다.
                어느 경로에서도 찾지 못하면 undefined를 반환한다.

        selectComponentByTrails(e: MouseEvent) -> Array<ComponentObject>
            의존:
                defined — trail 선택 결과 존재 여부 판정; 함수: {defined()}
                ComponentObject — 누적 경로의 event 선택 판정; 함수: {selectedByTrail()}
            동작:
                현재 컴포넌트마다 trail 선택을 실행하고 undefined가 아닌 결과만 배열에 담아 반환한다.

        onSelectHelperMeshes() -> void
            의존: ComponentObject — 선택 helper mesh 활성화; 함수: {onSelectHelperMesh()}
            동작: 현재 모든 컴포넌트의 선택 helper mesh를 활성화한다.

        offSelectHelperMeshes() -> void
            의존: ComponentObject — 선택 helper mesh 비활성화; 함수: {offSelectHelperMesh()}
            동작: 현재 모든 컴포넌트의 선택 helper mesh를 비활성화한다.

        getComponentsByArea(points: Array<GeoPosition>) -> Array<ComponentObject>
            인터페이스:
                points: 검색 polygon을 구성하는 세 개 이상의 geographic 좌표
                반환: polygon과 경계 또는 중심점이 겹치는 컴포넌트 목록
            처리 기준: app이 없거나 점이 세 개 미만이면 빈 배열을 반환한다.
            의존:
                defined — app, 경계와 위치 존재 여부 판정; 함수: {defined()}
                U3dLayer — 상속된 앱 참조 조회; 속성 읽기: {_app}
                ComponentObject — world 경계 상자 조회; 함수: {getBoundingBox()}; 속성 읽기: {position}
            동작:
                geographic 점 목록을 world XY 검색 영역으로 변환하고 실패하면 빈 배열을 반환한다.
                경계 상자가 있는 컴포넌트는 상자의 XY 투영과 검색 polygon의 교차 여부를 검사한다.
                경계 상자가 없고 위치가 있는 컴포넌트는 중심점이 검색 polygon 안에 있는지 검사한다.
                두 판정 중 하나를 통과한 컴포넌트를 입력 목록 순서대로 반환한다.

        #computeSearchArea(points: Array<GeoPosition>) -> SearchArea | undefined
            처리 기준: 점이 세 개 미만이면 undefined를 반환한다.
            의존:
                U3dLayer — 좌표 변환을 요청할 앱 참조 조회; 속성 읽기: {_app}
                U3dApp — geographic 좌표의 world 좌표 변환; 함수: {geographicToVector3()}
                THREE — world XY 꼭짓점과 축 정렬 경계 생성; 생성자: {new Vector2(), new Box2()}; 함수: {setFromPoints()}
            동작:
                각 geographic 좌표를 world 좌표로 변환하고 world x와 y를 polygon의 Vector2 꼭짓점으로 저장한다.
                모든 꼭짓점을 포함하는 Box2를 만들어 빠른 사전 판정 경계로 사용한다.
                마지막 점과 첫 점을 연결하는 변을 포함하여 인접 꼭짓점 쌍의 polygon 변 목록을 만든다.
                꼭짓점·경계·변 목록을 SearchArea로 반환한다.

    컴포넌트 생성과 등록 책임 그룹
        역할: 미리 로드한 모델과 위치 옵션을 일반 또는 인스턴스 컴포넌트로 만들고 레이어 상태에 등록한다.

        addPosition(opt: ComponentCreateOption) -> ComponentObject | undefined
            인터페이스:
                opt: 모델, 좌표, 표현, 경로와 사용자 속성을 가진 컴포넌트 생성 옵션
                반환: 생성한 컴포넌트이며 생성 설정이 실패하면 undefined를 반환할 수 있다.
                style의 밝기·대비 타입이 숫자가 아니면 TypeError, 음수·비유한 값·Float32 표현 범위 초과이면 RangeError를 생성 전에 전달한다.
            의존:
                defined — 생성 결과와 선택 입력·상태 존재 여부 판정; 함수: {defined()}
                UScene — 원본 model group과 생성 object의 scene 연결; 함수: {remove(), add()}
                U3dLayer — 상속 scene·앱 조회와 animation 존재 표식 기록; 속성 읽기: {_scene, _app}; 속성 쓰기: {_animation}
                ComponentObject — 라벨·가시성·경로·속성·색상·불투명도·animation 상태 적용과 등록 식별값 조회; 함수: {setLabel(), showLabel(), hideLabel(), show(), hide(), addMovePoint(), addPathGeometry(), addProperties(), setColor(), setOpacity(), setBrightness(), setContrast(), setSaturation(), startMixer(), stopMixer(), getAnimationNow(), moveResume(), moveStart(), movePause()}; 속성 읽기: {_setInstanced, instanceId, _object, name, _lightList}
                U3dComponentPosition — U3dComponentPosition 계열의 path geometry 지원 대상 판정; 상수: {U3dComponentPosition}
                U3dLayer — spot light option에 전달할 기반 draw context 조회; 속성 읽기: {_drawArg}
                USpotLight — 컴포넌트 조명 생성과 회전 초기화; 생성자: {new USpotLight()}; 함수: {resetRotation()}
                U3dApp — 생성한 spot light 등록; 함수: {addLight()}
                defaultValue — 라벨 기본값 결정; 함수: {defaultValue()}
                __GError__ — 생성 실패 메시지 출력; 함수: {__GError__()}
                UEventDispatcher — 컴포넌트 생성 완료 통지; 함수: {dispatchEvent()}
            동작:
                style의 밝기·대비를 한 번씩 읽어 보관하고 두 값을 모두 검증한 뒤 생성을 진행한다. undefined·null은 건너뛰며 0은 유효하다. 실패하면 원본 모델의 scene 연결, 컴포넌트 목록·이름 Map과 인스턴스 저장소를 변경하지 않고 생성 이벤트도 발생시키지 않는다.
                기반 레이어가 scene에 둔 원본 모델 그룹을 제거하여 원본 에셋 자체가 화면에 표시되지 않게 한다.
                일반 또는 인스턴스 컴포넌트를 생성한다. 생성 설정이 위치·모델 문제로 실패할 때 undefined가 아니라 예외가 발생할 수 있다. [확인 Q-003]
                생성에 실패하면 오류를 출력하고 undefined를 반환한다.
                인스턴스 컴포넌트이면 공용 인스턴스 상위 그룹을, 일반 컴포넌트이면 자체 object를 부모가 없을 때만 scene에 추가한다.
                labelVisible에 따라 라벨을 만들고 표시하거나 숨긴다.
                visible이 있으면 컴포넌트를 표시하거나 숨긴다.
                drawPolygon이 존재하지만 이동점 목록이 없으면 원본 opt.movepointlist에 빈 배열을 저장한다.
                이동점·자세 목록 또는 path geometry를 연결하고 해당 레이어에 애니메이션이 있음을 기록한다.
                사용자 properties를 적용한다. style은 생성 후 다시 읽어 현재 색상·불투명도·밝기·대비·채도의 정의된 항목을 순서대로 적용한다.
                그 다음 생성 전에 보관·검증한 밝기·대비가 있으면 다시 적용하므로 이 두 값은 마지막에 최초 보관값으로 확정된다. 생성 후 style getter·설정 callback에서 예외가 나면 이미 생성된 상태는 되돌리지 않는다.
                같은 이름이 색인에 없을 때만 목록·이름 Map에 등록한다. 요청된 light 옵션 원본마다 생성 이름·drawarg를 기록한 뒤 spot light를 만들어 app과 컴포넌트에 연결하므로 입력 light 객체도 변경된다.
                이름이 중복되면 scene과 앞선 설정은 이미 적용되지만 목록·이름 Map에는 등록하지 않은 채 CREATE 이벤트와 반환을 계속한다. [확인 Q-004]
                현재 재생 상태가 playing이면 mixer와 이동을 시작·재개하고 paused이면 mixer와 이동을 일시정지한다.
                CREATE 이벤트를 발생시키고 생성한 컴포넌트를 반환한다.

        addComponent(opt: ComponentCreateOption) -> void
            처리 기준: deprecated API이며 현재 활성 경로는 addPosition() 호출 직후 종료한다.
            의존:
                UGroup — 무조건 return 뒤 비활성 legacy 경로에만 남은 그룹 생성; 생성자: {new UGroup()}
                __GInfo__ — 비활성 legacy 경로의 모델 생성 안내; 함수: {__GInfo__()}
                defined — 비활성 legacy 경로의 옵션·결과 존재 판정; 함수: {defined()}
                UDEF — 비활성 legacy 경로의 완료 객체 구성; 함수: {createPromise()}
            동작:
                addPosition()을 호출하고 반환값을 전달하지 않은 채 종료한다.
                함수 아래에 남아 있는 legacy crowd 생성 코드는 무조건 return 뒤에 있어 실행되지 않는다.

        checkIsExistPosition(component: ComponentObject) -> boolean
            처리 기준: 입력 컴포넌트에 위치가 없으면 false를 반환한다.
            의존:
                defined — 입력 위치 존재 여부 판정; 함수: {defined()}
                ComponentObject — 비교할 컴포넌트 위치 조회; 속성 읽기: {position}
                THREE — 입력 위치 비교용 Vector 생성; 생성자: {new Vector3()}; 함수: {equals()}
            동작:
                입력 위치와 같은 좌표의 컴포넌트가 현재 목록에 하나라도 있으면 true를 반환하고 없으면 false를 반환한다.

        loadModel(modelInfo?: U3dMultipleComponentModelInfo) -> DeferredObject<void | ModelObject3D>
            의존:
                deferred — 호출자에게 반환할 완료 객체 생성; 함수: {deferred()}
                DeferredObject — 기반 로드 성공 결과와 실패 이유 전달; 함수: {resolve(), reject()}
                U3dModelBasicLayer — 단일 원본 모델 load 또는 기존 설정 reload; 함수: {load(), prototype.reLoad.call()}
            동작:
                modelInfo가 있으면 기반 load를 시작하고 성공 object로 반환 deferred를 resolve하며, 지원하지 않는 확장자·잘못된 경로·네트워크 오류 등 load의 실패 이유로 reject한다.
                modelInfo가 없으면 기반 reLoad를 시작하고 성공 시 반환 deferred를 resolve한다. reLoad의 실패는 연결하지 않는다.
                반환 deferred를 즉시 반환한다.

    저장과 복원 책임 그룹
        역할: 현재 컴포넌트 상태를 저장 형식으로 내보내고 저장 입력에서 컴포넌트와 계층을 다시 만든다.

        saveWork() -> {component: Array<ComponentSaveDate>} | undefined
            의존:
                defined — 원본 모델과 저장 결과 존재 여부 판정; 함수: {defined()}
                ComponentObject — 원본 모델과 저장 parameter 조회; 함수: {getModel(), getParam()}
                UEventDispatcher — save 결과 통지; 함수: {dispatchEvent()}
            동작:
                컴포넌트가 없으면 undefined를 반환한다.
                getModel과 getParam을 제공하고 원본 모델을 찾을 수 있는 각 컴포넌트에서 모델명과 단일 parameter 배열을 수집한다.
                수집 결과가 없으면 undefined를 반환한다.
                `save` 이벤트와 반환에는 각각 새 `{component: 결과}` wrapper를 사용하되 component 배열 참조는 공유한다.

        loadWork(savedData: ComponentParam | Array<ComponentParam>) -> Promise<Array<ComponentObject | undefined>>
            인터페이스:
                savedData: 단일 또는 배열 형태의 저장된 컴포넌트 parameter
                반환: 각 입력의 생성 결과를 입력 순서대로 모으는 Promise
            의존:
                defined — legacy world 위치 존재 여부 판정; 함수: {defined()}
                UEventDispatcher — 개별 load 완료 통지; 함수: {dispatchEvent()}
            동작:
                각 입력을 얕게 복사하고 좌표계 안정화 이전 값인 worldPos가 있으면 복사본에서 제거한다.
                각 복사본의 컴포넌트 생성 Promise를 시작하여 목록에 저장한다.
                생성 Promise가 완료되면 `load` 이벤트를 발생시키고 생성된 컴포넌트의 저장 계층 연결을 후속 실행한다.

                모든 생성 Promise를 합친 Promise를 반환한다. 중복 이름은 undefined가 아니라 reject로 전달되며 선언 주석과의 차이는 확인 대상이다. [확인 Q-024]
                완료 후 이벤트·계층 연결을 수행하는 then 결과는 반환 Promise 목록에 넣지 않으므로 그 callback 예외는 별도 후속 Promise의 실패가 된다.

        async #loadComponent(data: ComponentParam) -> Promise<ComponentObject | undefined>
            처리 기준: 같은 이름의 컴포넌트가 이미 있으면 이름을 포함한 오류를 throw한다. [확인 Q-024]
            동작:
                저장값의 instanced 여부를 레이어 기본 생성 모드로 설정한다.
                같은 이름의 기존 컴포넌트를 조회한다.
                기존 컴포넌트가 없으면 addPosition()으로 생성하고, 예외가 발생하면 오류 객체에 실패한 컴포넌트 이름을 기록하여 다시 throw한다.
                기존 컴포넌트가 있으면 중복 오류를 만들고 실패한 이름을 기록하여 throw한다.

        #setHierarchyFromSavedData(component: ComponentObject, savedData: ComponentParam) -> void
            의존:
                defined — 저장된 부모와 조회 결과 존재 여부 판정; 함수: {defined()}
                U3dComponentPosition — 컴포넌트 계열 판정과 부모·자식 연결; 상수: {U3dComponentPosition}; 함수: {setParent(), setChild()}
                THREE — 누락된 부모 회전 기본값 생성; 생성자: {new Euler()}; 함수: {setFromEuler()}
            동작:
                저장된 parent 이름이 있으면 이름 색인에서 부모를 찾고 부모 quaternion을 현재 rotation으로 갱신한다.
                찾은 parent가 U3dComponentPosition 계열이면 현재 컴포넌트의 부모로 연결한다.
                저장된 children을 순회하여 각 이름의 컴포넌트를 찾고 현재 컴포넌트의 자식으로 연결한다.

    색상 조정 책임 그룹
        역할: 현재 컴포넌트가 제공하는 색상 조정 기능을 호출하고 처음 발견한 유효 값을 조회한다.

        setBrightness(brightness: number = 1) -> boolean
            처리 기준: 유한한 숫자가 아니면 컴포넌트를 변경하지 않고 false를 반환한다.
            동작: 현재 컴포넌트의 setBrightness에 입력을 전달하여 하나 이상 성공했는지 반환한다.

        getBrightness() -> number
            동작: 현재 컴포넌트에서 처음 얻은 유한한 밝기값을 반환하고 없으면 NaN을 반환한다.

        setContrast(contrast: number = 1) -> boolean
            처리 기준: 유한한 숫자가 아니면 컴포넌트를 변경하지 않고 false를 반환한다.
            동작: 현재 컴포넌트의 setContrast에 입력을 전달하여 하나 이상 성공했는지 반환한다.

        getContrast() -> number
            동작: 현재 컴포넌트에서 처음 얻은 유한한 대비값을 반환하고 없으면 NaN을 반환한다.

        setSaturation(saturation: number = 1) -> boolean
            처리 기준: 유한한 숫자가 아니면 컴포넌트를 변경하지 않고 false를 반환한다.
            동작: 현재 컴포넌트의 setSaturation에 입력을 전달하여 하나 이상 성공했는지 반환한다.

        getSaturation() -> number
            동작: 현재 컴포넌트에서 처음 얻은 유한한 채도값을 반환하고 없으면 NaN을 반환한다.

        resetColorAdjustment() -> boolean
            동작: 현재 컴포넌트의 resetColorAdjustment를 인수 없이 호출하여 하나 이상 성공했는지 반환한다.

        #applyColorAdjustmentToComponents(methodName: 'setBrightness' | 'setContrast' | 'setSaturation' | 'resetColorAdjustment', value?: number) -> boolean
            의존:
                defined — 전달할 설정값의 존재 여부 판정; 함수: {defined()}
                ComponentObject — 지정된 색상 조정 메서드 호출; 함수: {setBrightness(), setContrast(), setSaturation(), resetColorAdjustment()}
            동작:
                현재 목록을 순회하며 지정 이름의 멤버가 함수인 컴포넌트만 처리한다.
                컴포넌트를 receiver로 하여 값이 정의되어 있으면 그 값을 전달하고 그 외에는 인수 없이 호출한다.
                명시적 false가 아닌 반환은 undefined도 성공으로 집계하고 하나 이상 성공하면 true, 없으면 false를 반환한다.
                새 컴포넌트의 기본 설정은 저장하지 않으며 예외가 나면 앞서 적용한 항목을 되돌리지 않고 뒤 항목 처리도 중단한다.

        #getColorAdjustmentFromComponents(methodName: 'getBrightness' | 'getContrast' | 'getSaturation') -> number
            의존: ComponentObject — 지정된 색상 조정값 조회; 함수: {getBrightness(), getContrast(), getSaturation()}
            동작:
                현재 목록에서 지정 이름의 메서드를 컴포넌트 자신을 receiver로 호출하고 유한한 숫자를 처음 얻으면 즉시 반환한다.
                함수가 없거나 결과가 비유한 값이면 다음 항목을 검사하고 끝까지 유효값이 없으면 NaN을 반환한다.

    애니메이션과 경로 표시 책임 그룹
        역할: 이동 경로 애니메이션, 모델 내장 mixer와 누적 경로 표시를 서로 구분하여 제어한다.

        getAnimateList() -> Array<string>
            동작: 현재 등록된 주행 애니메이션 이름 목록 원본을 반환한다.

        addAnimateList(name: string) -> void
            동작: 같은 이름이 목록에 없을 때만 주행 애니메이션 이름을 추가한다.

        removeAnimateList(name: string) -> void
            동작: 같은 이름이 목록에 있으면 해당 항목 하나를 제거하고 없으면 현재 상태를 유지한다.

        visibleCumulativeRoute(isVisible: boolean) -> void
            의존: ComponentObject — 누적 경로 표시·숨김; 함수: {showCumulativeRoute(), hideCumulativeRoute()}
            동작:
                현재 컴포넌트 목록을 가져온다.
                isVisible이 true이면 각 컴포넌트의 누적 경로를 표시하고 false이면 숨긴다.

        startAnimation() -> void
            처리 기준: 이동 경로 애니메이션만 제어하며 모델 내장 mixer는 시작하지 않는다.
            의존:
                defined — 현재 이동 animation 존재 여부 판정; 함수: {defined()}
                ComponentObject — 현재 이동 animation 조회와 시작·재개; 함수: {getAnimationNow(), moveResume(), moveStart()}
            동작:
                레이어 재생 상태를 playing으로 바꾼다.
                컴포넌트를 순서대로 검사하고 현재 이동 animation이 일시정지 상태이면 재개하며 그 외에는 처음부터 시작한다.
                이동 animation이 없는 첫 컴포넌트를 만나면 해당 항목만 건너뛰지 않고 함수 전체를 종료하므로 뒤 컴포넌트는 시작하지 않는다. [확인 Q-006]

        stopMixers() -> void
            의존: ComponentObject — 모델 내장 animation mixer 정지; 함수: {stopMixer()}
            동작: 현재 모든 컴포넌트의 모델 내장 mixer를 정지한다.

        startMixers() -> void
            의존: ComponentObject — 모델 내장 animation mixer 시작; 함수: {startMixer()}
            동작: 현재 모든 컴포넌트의 모델 내장 mixer를 시작한다.

        stopAnimation() -> void
            의존: ComponentObject — 이동 경로 animation 정지; 함수: {moveStop()}
            동작: 레이어 재생 상태를 stopped로 바꾸고 현재 모든 컴포넌트의 이동을 정지한다.

        pauseAnimation() -> void
            의존: ComponentObject — 이동 경로 animation 일시정지; 함수: {movePause()}
            동작: 레이어 재생 상태를 paused로 바꾸고 현재 모든 컴포넌트의 이동을 일시정지한다.

        restartAnimation() -> void
            의존: ComponentObject — 이동 경로 animation 초기화·재시작; 함수: {restart()}
            동작: 레이어 재생 상태를 playing으로 바꾸고 현재 모든 컴포넌트의 이동을 초기화하여 다시 시작한다.

        showComponent(component: ComponentObject) -> DeferredObject<void>
            의존:
                defined — 입력 컴포넌트 존재 여부 판정; 함수: {defined()}
                deferred — 표시 결과를 전달할 완료 객체 생성; 함수: {deferred()}
                DeferredObject — 표시 성공·실패 결과 전달; 함수: {resolve(), reject()}
                ComponentObject — 개별 컴포넌트 표시; 함수: {show()}
            동작:
                입력 컴포넌트가 없으면 반환 deferred를 reject한 상태로 즉시 반환한다.
                컴포넌트 show가 Promise를 반환하면 그 성공·실패를 반환 deferred의 resolve·reject로 전달한다.
                show가 이미 표시된 상태 등의 이유로 undefined를 반환하면 optional chaining 뒤에 후속 처리가 없어 반환 deferred가 완료되지 않을 수 있다. [확인 Q-007]

        hideComponent(component: ComponentObject) -> DeferredObject<void>
            의존:
                defined — 입력 컴포넌트 존재 여부 판정; 함수: {defined()}
                deferred — 숨김 결과를 전달할 완료 객체 생성; 함수: {deferred()}
                DeferredObject — 숨김 성공·실패 결과 전달; 함수: {resolve(), reject()}
                ComponentObject — 개별 컴포넌트 숨김; 함수: {hide()}
            동작:
                입력 컴포넌트가 없으면 반환 deferred를 reject한 상태로 즉시 반환한다.
                컴포넌트 hide가 Promise를 반환하면 그 성공·실패를 반환 deferred의 resolve·reject로 전달한다.
                hide가 이미 숨겨진 상태 등의 이유로 undefined를 반환하면 optional chaining 뒤에 후속 처리가 없어 반환 deferred가 완료되지 않을 수 있다. [확인 Q-007]

    디버그와 순환 렌더 조회 책임 그룹
        역할: 컴포넌트 경계를 디버그 렌더에 제공하고 레거시 순환 소비자에 다음 컴포넌트를 제공한다.

        override debugBound(isDebug: boolean, color: ColorRepresentation = 0xffff00) -> boolean
            의존:
                THREE — 문자열·객체 색상을 정수 색상으로 변환; 생성자: {new Color()}; 함수: {getHex()}
                U3dModelBasicLayer — 기반 경계 디버그 상태 설정; 함수: {debugBound()}
                U3dLayer — 상속된 debug helper·이벤트 식별과 앱 참조 조회; 속성 읽기: {_debug, _app}
                U3dApp — 렌더 직전 callback 등록; 함수: {setRenderBefore()}
                ComponentObject — 개별 경계 조회; 함수: {getBoundingBox()}
                UBox3HelperGroup — 경계 누적과 GPU 반영; 함수: {add(), commit()}
            동작:
                입력 색상을 정수 색상으로 바꾸고 기반 경계 디버그 설정이 실패하면 false를 반환한다.
                isDebug가 true이면 매 렌더 직전 callback을 등록한다.
                    callback 실행 시 self._debug.objectBound가 있으면 현재 컴포넌트 목록의 경계를 helper에 추가하고 한 번에 반영한다. 없으면 목록 조회 없이 종료한다.
                설정을 마치면 true를 반환한다.

        getRenderPosition() -> {position: ComponentObject, needClear: boolean} | undefined
            처리 기준: 컴포넌트가 없으면 undefined를 반환한다.
            의존: defined — 컴포넌트 목록과 순환 index 존재 여부 판정; 함수: {defined()}
            동작:
                컴포넌트가 하나이면 그 항목과 순환 완료를 뜻하는 needClear true를 반환한다.
                컴포넌트가 둘 이상이면 현재 index를 먼저 1 증가시켜 해당 항목을 반환하고, 마지막 index에서 다음 호출이 오면 0으로 되돌려 첫 항목과 needClear true를 반환한다.
                초기 index가 0이므로 컴포넌트가 둘 이상일 때 첫 호출은 index 0이 아니라 index 1을 반환한다. [확인 Q-012]

        override getBoundingBox() -> Box3
            의존:
                THREE — 빈 결과와 합산 경계 생성; 생성자: {new Box3()}; 함수: {union()}
                ComponentObject — 개별 컴포넌트 경계 조회; 함수: {getBoundingBox()}
            동작:
                컴포넌트가 없으면 빈 Box3를 반환한다.
                현재 컴포넌트 목록을 가져와 각 경계를 결과 Box3에 합친다.
                일반 object와 instanced object를 함께 포함한 합산 경계를 반환한다.

    컴포넌트 제거 책임 그룹
        역할: deprecated 제거 API, 공개 제거 API와 실제 일반·인스턴스 자원 정리 경로를 연결한다.

        removeAllPosition() -> void
            처리 기준: deprecated API이며 removeAllComponent() 사용을 안내한다.
            의존: __GInfo__ — deprecated 안내 출력; 함수: {__GInfo__()}
            동작: 변경된 API 이름을 안내하고 모든 컴포넌트를 제거한다.

        removePositionByName(name: string) -> void
            처리 기준: deprecated API이며 removeComponentByName() 사용을 안내한다.
            의존: __GInfo__ — deprecated 안내 출력; 함수: {__GInfo__()}
            동작: 변경된 API 이름을 안내하고 입력 이름으로 컴포넌트를 제거한다.

        removePosition(selected: ComponentObject) -> void
            처리 기준: deprecated API이며 removeComponentByName() 사용을 안내한다.
            동작: 입력 컴포넌트를 공개 제거 API에 전달한다.

        removeAllComponent() -> void
            의존:
                UDEF — Three object와 GPU 자원 해제; 함수: {disposeObject3D()}
                ComponentObject — 원본 모델명 조회와 컴포넌트 수명주기 종료; 함수: {dispose()}; 속성 읽기: {_object}
                InstancedMeshLike — 보유 instance 일괄 해제와 참조 정리; 함수: {clearInstances()}; 속성 읽기·쓰기: {instances}
                THREE.Object3D — cache mesh와 인스턴스 그룹을 부모에서 분리; 함수: {remove()}
                UGroup — 제거 뒤 비어 있는 인스턴스 상위 그룹 재생성; 생성자: {new UGroup()}
            동작:
                각 컴포넌트의 원본 모델 이름으로 모델별 instance 정보 Map을 비우고 상위 `_instancedInfo`에서 제거한다.
                각 컴포넌트를 처리할 때마다 전체 mesh cache를 순회하여 instance 일괄 해제 기능이 있으면 실행하고 instances 참조를 제거한다.
                현재 모델명이 같은 cache mesh는 GPU 자원을 해제하고 부모에서 분리한 뒤 cache key를 삭제한다.
                각 컴포넌트를 dispose한다.
                인스턴스 상위 그룹의 children을 순방향 `forEach`로 순회하면서 현재 자식을 부모에서 제거한다. 같은 children 배열이 순회 중 축소되어 다음 자식이 건너뛰어질 수 있고, 기존 상위 그룹을 scene에서 제거하지 않은 채 새 UGroup으로 참조를 교체한다. [확인 Q-019]
                컴포넌트 목록과 이름 색인을 새 빈 저장소로 바꾸고 모델 경계 Map을 비운다.

        removeComponentByName(name: string) -> void
            인터페이스:
                name: 제거할 컴포넌트 이름 또는 ID
                반환: 없음
            처리 기준: 컴포넌트 목록이 비어 있으면 아무 작업도 하지 않는다.
            의존: defined — 입력 이름과 제거 대상 존재 여부 판정; 함수: {defined()}
            동작:
                name이 있으면 그 입력값을 이름 색인의 key로 먼저 삭제하고 목록에서 ID 또는 이름이 같은 index를 찾는다. ID로 인스턴스 컴포넌트를 찾으면 실제 component.name key는 이 경로와 내부 인스턴스 제거에서 삭제하지 않는다. [확인 Q-013]
                찾은 컴포넌트가 있으면 동명 공개 API가 아닌 `컴포넌트 제거 내부 함수 책임 그룹`의 removeComponent()로 계층과 실제 렌더 자원을 정리한다.
                name이 없으면 목록의 마지막 컴포넌트를 제거한다. 마지막 대상이 인스턴스 컴포넌트이면 이 경로에서는 이름 색인의 해당 항목을 삭제하지 않는다. 공개 인터페이스가 이름을 필수로 설명하는 것과 실제 fallback의 의도가 일치하는지 확인이 필요하다. [확인 Q-013]

        U3dMultipleComponentLayer.removeComponent(selected: ComponentObject) -> void
            처리 기준: 컴포넌트 목록이 비어 있으면 아무 작업도 하지 않는다.
            의존:
                defined — 입력 컴포넌트 존재 여부 판정; 함수: {defined()}
                console — 입력 누락 오류 출력; 함수: {error()}
                ComponentObject — 제거 API에 전달할 이름 또는 ID 조회; 속성 읽기: {name, id}
            동작:
                selected가 있으면 name을 우선 사용하고 없으면 id를 사용하여 이름 기반 제거를 실행한다.
                selected가 없으면 오류를 출력하고 상태를 변경하지 않는다.

    모델 교체와 메타데이터 책임 그룹
        역할: 기존 컴포넌트의 모델을 교체하고 레이어 metadata에 컴포넌트 위치를 합친다.

        changeObject(id: string, option: ChangeObjectOpt) -> void
            인터페이스:
                id: 교체할 기존 컴포넌트 ID
                option.object: 미리 로드한 교체 대상 모델 이름
                option.position: 인스턴스 교체 모델에 선택 적용할 world 위치이며 일반 교체 경로에서는 적용되지 않는다. [확인 Q-016]
                option.rotation, option.scale: 교체 모델에 선택 적용할 회전과 크기
            처리 기준: id 또는 option이 없거나 대상 컴포넌트·모델을 찾지 못하면 상태를 바꾸지 않는다.
            의존:
                defined — 교체 대상, 모델과 변환값 존재 여부 판정; 함수: {defined()}
                U3dComponentInstancedPosition — 인스턴스 교체 경로 판정과 새 모델의 초기 변환 기록; 상수: {U3dComponentInstancedPosition}; 속성 쓰기: {_initPosition, _initRotation, _initScale}
                U3dModelBasicLayer — 교체 대상 원본 model group 조회와 일반 모델 clone; 함수: {skClone()}; 속성 읽기: {_object}
                ComponentObject — 대상 ID와 모델 교체에 필요한 object·변환·경계 상태 및 mixer 갱신; 함수: {setMixers(), getBrightness(), setBrightness()}; 콜백: {getBoundingBox}; 속성 읽기·쓰기: {id, _object, _bbox, position, rotation, scale, instanceId, name}
                UBox3 — 교체 모델 경계 계산; 생성자: {new UBox3()}; 함수: {setFromObject(), setFromCenterAndSize()}
                THREE — 일반 모델 mesh 판정, mixer·회전과 object 변환 복사; 생성자: {new AnimationMixer(), new Euler()}; 함수: {clone(), copy(), set()}; 상수: {Mesh}
                THREE.Object3D — 교체한 모델과 child의 렌더·선택 metadata 기록; 속성 쓰기: {type, mixer, name, _bbox, getBBox, _utype, _rootObject, _ulayername}
                UGroup — 일반 교체 object 그룹 생성과 tree 구성; 생성자: {new UGroup()}; 함수: {add(), traverse()}
                UScene — 이전 object 분리와 새 object·인스턴스 그룹 연결; 함수: {remove(), add()}
                U3dLayer — 교체 object를 연결할 상속 scene 조회; 속성 읽기: {_scene}
                UDEF — 이전 일반 object 자원 해제와 mesh 유형 표시; 함수: {disposeObject3D()}; 상수: {UMESH_TYPE._component}
                U3dObject — 교체한 일반 모델 child에 기록할 레이어 이름 조회; 속성 읽기: {_name}
            동작:
                ID가 같은 컴포넌트와 option.object 이름이 같은 로드 모델을 찾고 기존 object가 없으면 종료한다.
                인스턴스 컴포넌트에서 모델명이 같으면 변경하지 않는다.
                인스턴스 교체 입력의 name 속성에 component.name을 저장한다.
                인스턴스 교체 입력의 position이 없으면 이전 object 위치 clone을 option.position에 저장한다.
                component._object가 있고 인스턴스 경로이면 새 모델을 skinned 구조로 정규화하고 새 모델명으로 instance metadata와 렌더 mesh를 먼저 만든다.
                교체 옵션의 animationNum은 addInstancedInfo 결과에 복사되지 않아 createInstancedMesh에 전달되지 않는다. [확인 Q-015]
                component._object가 있고 인스턴스 교체 경로이면 새 변환 초기값과 경계를 컴포넌트에 기록한 뒤 이전 모델의 instance 정보·mesh·matrix를 제거한다.
                회전이나 크기를 생략하면 새 instance 정보에는 각각 0 회전과 단위 크기를 사용한다.
                component._object가 있고 인스턴스 교체 경로이면 컴포넌트의 instance ID·모델명·회전을 새 정보에 맞추고 새 그룹과 metadata를 다시 연결한다.
                이때 instance matrix는 addInstancedInfo가 축값 크기로 보정한 rotation을 사용하지만 component.rotation에는 같은 값에 π/180을 다시 곱한다. [확인 Q-017]
                scale 입력이 있으면 component.scale과 새 object scale을 바꾸고, 생략하면 두 값은 기존 크기를 유지한다. 따라서 생략 시 새 instance matrix는 단위 크기의 info.scale을 사용하지만 컴포넌트 상태와 object scale은 기존 크기를 유지한다. [확인 Q-023]
                새 모델의 animation mixer는 info.mixers에 수집되지만 component.setMixers()로 기존 컴포넌트에 연결하지 않는다. [확인 Q-018]
                현재 밝기를 setter로 다시 전달하여 저장된 대비와 함께 새 인스턴스 그룹에 적용한다. 인스턴스 상위 그룹이 scene에 없으면 한 번 추가하고 교체를 종료한다.
                일반 컴포넌트 경로에서는 새 모델을 clone하여 mixer, 회전·크기, mesh 경계·레이어 metadata와 기존 비모델 자식을 새 그룹에 연결한다. 회전이나 크기를 생략하면 기존 컴포넌트 값을 유지하고, 새 그룹의 위치는 option.position을 읽지 않고 기존 object 위치를 복사한다. [확인 Q-016]
                새 mesh의 getBBox callback에는 component.getBoundingBox를 수신 객체 고정 없이 대입한다. callback이 mesh를 this로 받아 실행되면 component의 getRectangle()을 찾지 못할 수 있다. [확인 Q-020]
                animationNum은 일반 교체 경로에서도 읽거나 clip 선택에 적용하지 않으며, 새 mixer에 모델 animation의 clip action도 준비하지 않는다. [확인 Q-015]
                현재 밝기를 setter로 다시 전달하여 저장된 대비와 함께 새 일반 모델에 적용한다. 기존 일반 object를 scene에서 제거·해제하고 같은 위치의 새 그룹을 scene에 추가한다.

        override getMetaData() -> UMeta | undefined
            의존:
                defined — 기반 metadata 존재 여부 판정; 함수: {defined()}
                U3dModelBasicLayer — 기반 metadata 조회; 함수: {prototype.getMetaData.call()}
                U3dObject — position metadata 생성; 함수: {createMeta()}
                UMeta — 컴포넌트 위치 metadata 값 기록과 연결; 함수: {addChild()}; 속성 쓰기: {attribute}
            동작:
                기반 모델 metadata가 없으면 undefined를 반환한다.
                각 컴포넌트마다 position 유형의 metadata를 만들어 현재 위치를 attribute로 기록하고 기반 metadata의 자식으로 추가한다.
                컴포넌트 위치가 합쳐진 기반 metadata를 반환한다.

    라벨과 모델 표현 책임 그룹
        역할: 레이어 전체 라벨 상태와 로드 모델의 alpha 표현 속성을 제어한다.

        showLabel() -> DeferredObject<boolean>
            의존:
                deferred — 완료 결과 객체 생성; 함수: {deferred()}
                DeferredObject — 라벨 표시 완료 결과 전달; 함수: {resolve()}
                ComponentObject — 개별 라벨 표시; 함수: {showLabel()}
            동작:
                labelVisible이 이미 true이면 true로 완료한 deferred를 반환한다.
                아니면 현재 모든 컴포넌트의 라벨을 표시하고 labelVisible을 true로 바꾼 뒤 true로 완료한다.

        hideLabel() -> DeferredObject<boolean>
            의존:
                defined — 컴포넌트 라벨 객체 존재 여부 판정; 함수: {defined()}
                deferred — 완료 결과 객체 생성; 함수: {deferred()}
                DeferredObject — 라벨 숨김 결과 전달; 함수: {resolve()}
                ComponentObject — 라벨 존재 여부 조회와 개별 라벨 숨김; 함수: {hideLabel()}; 속성 읽기: {poi}
            동작:
                labelVisible이 이미 false이면 true로 완료한 deferred를 반환한다.
                아니면 labelVisible을 false로 바꾸고 컴포넌트를 순회한다.
                poi가 없는 항목은 false로, 있는 항목은 라벨을 숨긴 뒤 true로 같은 deferred를 각각 완료하려고 한다.
                컴포넌트가 없으면 한 번도 완료되지 않고 여러 항목의 결과는 최초 완료에 좌우될 수 있다. [확인 Q-008]

        removeLabel() -> DeferredObject<boolean>
            의존:
                defined — 컴포넌트 라벨 객체 존재 여부 판정; 함수: {defined()}
                deferred — 완료 결과 객체 생성; 함수: {deferred()}
                DeferredObject — 라벨 제거 성공·실패 결과 전달; 함수: {resolve(), reject()}
                ComponentObject — 라벨 존재 여부 조회와 개별 라벨 제거; 함수: {removeLabel()}; 속성 읽기: {poi}
            동작:
                컴포넌트를 순회하며 poi가 없는 첫 항목에서는 deferred를 reject하고 즉시 반환한다.
                poi가 있으면 라벨을 제거하고 같은 deferred를 true로 완료하려고 한다.
                컴포넌트가 없으면 한 번도 완료되지 않고 여러 항목의 결과는 최초 완료에 좌우될 수 있다. [확인 Q-008]

        getLoadedModel(name: string) -> Object3D | undefined
            의존: U3dModelBasicLayer — 기반 원본 모델 그룹 검색; 속성 읽기: {_object}
            동작: 기반 원본 model group의 자식에서 이름이 같은 첫 object를 반환하고 없으면 undefined를 반환한다.

        removeModelAlphaMap(name: string) -> void
            의존:
                U3dModelBasicLayer — 상속된 원본 모델 목록·그룹 조회; 속성 읽기: {_objectList, _object}
                ModelObject3D — alpha map 제거; 함수: {removeAlphaMap()}
            동작: 별도 object 목록이 비어 있으면 원본 model group 자식을 사용하고, 아니면 object 목록을 사용하여 이름이 같은 모든 모델의 alpha map을 제거한다.

        resetModelAlphaMap(name: string) -> void
            의존:
                U3dModelBasicLayer — 복원 대상 원본 모델 목록·그룹 조회; 속성 읽기: {_objectList, _object}
                ModelObject3D — alpha map 원본 복구; 함수: {resetAlphaMap()}
            동작: 별도 object 목록이 비어 있으면 원본 model group 자식을 사용하고, 아니면 object 목록을 사용하여 이름이 같은 모든 모델의 alpha map을 원본으로 복구한다.

        setModelAlphaTest(name: string, alphaFilter: number) -> void
            인터페이스:
                name: 설정할 로드 모델 이름
                alphaFilter: 픽셀을 폐기할 alpha 임계값
            의존:
                U3dModelBasicLayer — alpha test 대상 원본 모델 목록·그룹 조회; 속성 읽기: {_objectList, _object}
                ModelObject3D — alpha test 설정; 함수: {setAlphaTest()}
            동작: 별도 object 목록이 비어 있으면 원본 model group 자식을 사용하고, 아니면 object 목록을 사용하여 이름이 같은 모든 모델에 alphaFilter를 적용한다.

        setScale(scale: Vector3Like | number) -> void
            인터페이스:
                scale: 축별 값 객체 또는 세 축에 공통 적용할 숫자
                반환: 없음
            동작:
                객체이면 레이어 `_scale`의 x·y·z를 입력 축 값으로 바꾼다.
                숫자이면 레이어 `_scale`의 세 축을 같은 값으로 바꾼다.
                값은 이후 컴포넌트 생성 option의 layerScale에 전달되지만 개별 컴포넌트 렌더 scale이나 기존 instance matrix에는 적용되지 않는다. 설명된 전체 일괄 적용과 실제 반영 범위가 다를 수 있다. [확인 Q-009]

        setRotation(degree: number, axis?: Vector3Like) -> void
            인터페이스:
                degree: -360 이상 360 이하의 회전각
                axis: 회전축이며 생략하면 world Z축 `(0, 0, 1)`을 사용한다.
            처리 기준: 허용 범위를 벗어난 degree이면 오류를 throw한다.
            의존:
                defined — 회전축 입력 존재 여부 판정; 함수: {defined()}
                THREE — 축·각 회전을 Euler로 변환; 생성자: {new Quaternion(), new Euler()}; 함수: {setFromAxisAngle(), setFromQuaternion()}
            동작:
                degree를 radian으로 변환하고 axis-angle quaternion을 만든 뒤 Euler로 변환하여 레이어 `_rotation` 참조를 교체한다.
                새 값은 이후 회전 입력이 없는 컴포넌트의 기본 회전에만 사용되고 기존 컴포넌트나 instance matrix는 순회·갱신하지 않는다. 설명된 전체 일괄 적용과 실제 반영 범위가 다를 수 있다. [확인 Q-009]

        setCameraTrace(opt: CameraViewOption) -> void
            의존: ComponentObject — 대상 이름 비교와 카메라 추적 상태·시점 설정; 함수: {setCameraTrace()}; 속성 읽기: {name}
            동작:
                대상과 이름이 다른 모든 컴포넌트에는 opt.active의 반대값만 전달한다.
                대상 컴포넌트에는 active, view, offset과 targetOffset을 전달한다.
                대상을 비활성화하면 다른 모든 컴포넌트에 true가 전달되는 동작이 의도한 단일 추적 정책인지 확인이 필요하다. [확인 Q-010]

        setHelperPosition(position?: WorldPositionVector3) -> void
            처리 기준: position이 없으면 현재 값을 유지한다.
            의존: defined — 위치 입력 존재 여부 판정; 함수: {defined()}
            동작: 입력 world 위치를 레이어 helper 위치로 저장한다.

    picking과 모델 경계 책임 그룹
        역할: 이벤트 ray와 컴포넌트 렌더 객체의 교차를 컴포넌트로 해석하고 모델별 원본 경계를 저장한다.

        getIntersect(event: Event & {normalizedX: number, normalizedY: number}, raycaster?: URaycaster) -> ComponentObject | undefined
            인터페이스:
                event: normalizedX와 normalizedY가 포함된 사용자 입력 이벤트
                raycaster: 선택적으로 재사용할 raycaster
                반환: 교차한 컴포넌트 또는 undefined
            처리 기준: event가 없거나 raycaster를 만들 카메라가 없으면 undefined를 반환한다.
            의존:
                defined — event, raycaster, camera와 교차 식별값 존재 여부 판정; 함수: {defined()}
                UDrawArg — 현재 카메라 조회; 함수: {getCamera()}
                U3dLayer — 카메라 조회에 사용할 상속 draw context; 속성 읽기: {_drawArg}
                URaycaster — normalized 화면 좌표로 ray 구성과 object 교차; 생성자: {new URaycaster()}; 함수: {setFromCamera(), intersectObject()}
                THREE — normalized 좌표 생성; 생성자: {new Vector2()}
                ComponentObject — 표시·렌더 object·instance 그룹·식별 상태 조회와 교차 거리 기록; 속성 읽기: {_show, _object, instancedGroup, _setInstanced, instanceId, groupIndex}; 속성 쓰기: {distance}
            동작:
                raycaster가 없으면 event의 normalized 좌표와 현재 카메라로 새 raycaster를 구성한다.
                표시 중인 컴포넌트를 순회하고 일반 컴포넌트는 자체 object를, 인스턴스 컴포넌트는 렌더 그룹을 교차 대상으로 사용한다.
                교차가 있으면 첫 교차 거리를 컴포넌트에 기록한다.
                일반 컴포넌트는 후보 목록에 모으고 모든 순회 후 거리 오름차순의 첫 항목을 반환한다.
                인스턴스 교차는 mesh 그룹 번호와 교차 instanceId로 전체 instance ID를 계산하고 같은 모델명·그룹·ID인 컴포넌트를 찾는 즉시 반환한다.
                따라서 먼저 순회한 인스턴스 후보와 뒤의 더 가까운 일반·인스턴스 후보 사이에서는 전체 최단 거리 비교가 수행되지 않는다. [확인 Q-011]

        setBbox(key: string, value: UBox3) -> void
            동작: 모델 이름 key와 원본 경계 value를 경계 Map에 저장한다.

        getBbox(key: string) -> UBox3 | undefined
            동작: 모델 이름 key에 저장된 원본 경계를 반환하고 없으면 undefined를 반환한다.

        checkObjectSize(model: Object3D) -> boolean
            의존:
                THREE — mesh 경계 크기 저장과 계산; 생성자: {new Vector3()}; 함수: {Box3.getSize()}
                THREE.Object3D — 하위 mesh 순회; 함수: {traverse()}
                확장 mesh — 선택적으로 제공되는 자체 경계 조회; 함수: {getBoundingBox()}
            동작:
                model의 모든 mesh를 순회하고 getBoundingBox를 제공하는 mesh의 경계 크기를 구한다.
                어느 한 mesh라도 x·y·z 중 하나가 1 이하이면 false를 반환하고, 검사한 모든 mesh가 세 축 모두 1보다 크면 true를 반환한다.

비공개 공간 판정과 프레임 배분 책임 그룹
    역할: 공개 검색·갱신 API가 준비한 입력의 공간 판정과 갱신 순서를 계산한다.

U3dMultipleComponentMeshSource 부분 타입 명세
    이 명세에서 사용하는 필드:
        _cacheMeshList: object
            원본과 인스턴스 mesh를 저장하는 레이어의 cache 참조이다.
        _instancedMaxCount: number
            모델별 인스턴스 그룹의 최대 수이다.
        _app: U3dApp
            인스턴스 mesh에 전달할 renderer를 조회하는 앱이다.
        _drawLine: boolean
            instance 설정의 마지막 단계에서 표시용 외곽선을 만들지 결정한다.
        getName: () -> string
            메시의 picking 식별 상태에 기록할 레이어 이름 조회 함수이다.

인스턴스 정보와 그룹 내부 함수 책임 그룹
    역할: 모델별 instance ID, 변환 정보와 ID 구간별 렌더 그룹의 대응 관계를 유지한다.

    addInstancedInfo(name: string, opt: InstancedInputOption) -> InstancedComponentInfo
        인터페이스:
            this: 모델별 instance 정보 저장소와 그룹 한도를 소유하는 현재 레이어
            name: instance를 생성할 원본 모델 이름
            opt: 위치·회전·크기·가시성과 컴포넌트 이름 입력
            반환: 새 ID로 저장한 instance 정보
        의존:
            defined — 저장소와 선택 입력값 존재 여부 판정; 함수: {defined()}
            THREE — 위치·회전·크기 값 생성, 축별 입력 복사와 degree 회전 보정; 생성자: {new Vector3(), new Euler()}; 함수: {set()}; 속성 쓰기: {Euler.x, Euler.y, Euler.z}
            UDEF — degree를 radian으로 변환; 함수: {DegreesToRadians()}
            defaultValue — 누락된 컴포넌트 이름 기본값 적용; 함수: {defaultValue()}
        동작:
            모델 이름의 정보 Map이 없으면 새 Map을 만든다.
            위치는 기본 0, 회전은 기본 0, 크기는 기본 1로 만들고 입력값이 있으면 각 축을 복사한다. [확인 Q-023]
            각 회전축 절댓값이 π보다 크면 해당 축 입력을 degree로 보고 radian으로 변환하고, π 이하이면 입력값을 그대로 radian처럼 사용한다. [확인 Q-017]
            visible 기본값은 true, labelVisible 기본값은 false로 두고 컴포넌트 이름과 함께 instance 정보를 만든다.
            animationNum을 포함한 그 밖의 입력 필드는 생성한 instance 정보에 복사하지 않는다. [확인 Q-015]
            모델 Map의 lastIndex가 있으면 그 값, 없으면 현재 size - 1에서 1 증가한 ID를 새 key로 사용한다.
            정보 Map과 lastIndex에 새 값을 기록하고 생성한 정보를 반환한다.

    removeInstancedInfo(name: string, idx: number) -> void
        인터페이스: this: 모델별 instance 정보 저장소를 소유하는 현재 레이어
        의존: defined — 전체·모델별 instance 정보 존재 여부 판정; 함수: {defined()}
        동작:
            전체 또는 모델별 instance 정보 Map이 없으면 종료한다.
            모델 Map에서 idx를 삭제하고 비었으면 모델 이름 자체를 전체 Map에서 삭제한다.
            삭제한 idx가 lastIndex이면 남은 key 중 가장 큰 값을 다시 lastIndex로 저장한다.

    getInstancedGroup(name: string, index: number = 0) -> Object3D | undefined
        인터페이스: this: 모델·ID 구간별 렌더 그룹을 소유하는 현재 레이어
        처리 기준: 인스턴스 상위 그룹이 없거나 비어 있으면 undefined를 반환한다.
        의존: defined — 인스턴스 상위 그룹 존재 여부 판정; 함수: {defined()}
        동작: `<모델명>^<그룹 번호>` 이름과 같은 첫 렌더 그룹을 찾아 반환하고 없으면 undefined를 반환한다.

    setInstancedGroup(name: string, offset: number = 0) -> UGroup | undefined
        인터페이스: this: 인스턴스 상위 그룹을 소유하는 현재 레이어
        처리 기준: 인스턴스 상위 그룹이 없으면 undefined를 반환한다.
        의존: UGroup — 모델·ID 구간 렌더 그룹 생성·식별과 상위 그룹 연결; 생성자: {new UGroup()}; 함수: {add()}; 속성 쓰기: {name, _objectName}
        동작:
            _instancedObject가 있으면 같은 모델명과 offset의 그룹을 조회하고 이미 있으면 새 그룹을 만들지 않는다.
            없으면 `<모델명>^<offset>` 이름과 원본 모델명을 가진 UGroup을 만들어 인스턴스 상위 그룹에 추가하고 반환한다.

컴포넌트 생성 내부 함수 책임 그룹
    역할: 좌표와 원본 모델을 정규화하고 일반·인스턴스 렌더 구조를 만든 뒤 컴포넌트 객체에 연결한다.

    componentSetting(opt: ComponentCreateOption, obj: UGroup) -> ComponentCreateOption | undefined
        인터페이스: this: 생성 기준과 원본 모델 저장소를 제공하는 현재 레이어
        처리 기준: 위치 입력이나 사용할 원본 모델이 없으면 undefined를 반환한다.
        의존:
            defined — 위치·모델·선택 옵션과 생성 횟수 상태 존재 여부 판정; 함수: {defined()}
            UDrawArg — geographic 좌표를 world 좌표로 변환; 함수: {getGeographicToWorld()}
            THREE — world 위치와 일반 모델 mixer·clip action 생성; 생성자: {new Vector3(), new AnimationMixer()}; 함수: {clipAction()}
            U3dModelBasicLayer — 원본·기본 모델 조회와 일반 컴포넌트가 소유할 skeleton clone 생성; 함수: {skClone()}; 속성 읽기: {_object, _drawObject}
            UGroup — 출력 그룹 식별과 일반 컴포넌트가 소유할 clone 연결; 함수: {add()}; 속성 쓰기: {name}
            ExtObject3D — 모델·animation 식별과 원본 형식·가시성·mixer 상태 전달; 속성 읽기: {name, animations}; 속성 쓰기: {_ext, visible, mixer}
            UEventDispatcher — 모델 복사 직전 통지; 함수: {dispatchEvent()}
            __GError__ — 로드 모델 누락 오류 출력; 함수: {__GError__()}
        동작:
            geoPosition이 있으면 drawArg 변환을 사용해 world position으로 바꾼다.
            아니면 worldPos 또는 google이 있으면 각 축에서 worldPos 값을 우선하고 null·undefined인 경우만 google 값으로 보충하여 새 world position을 만든다. x는 worldPos.x 다음 google.x, y는 worldPos.y 다음 google.y, z는 worldPos.z 다음 google.z의 순서이다.
            어떤 위치 입력도 없으면 undefined를 반환한다. [확인 Q-003]
            loadedModel이 있고 object가 없으면 loadedModel 이름을 object로 사용한다.
            컴포넌트별 instanced가 있으면 그 값을, 없으면 레이어 기본 모드를 선택한다.
            object 이름이 있으면 원본 model group에서 같은 모델을 찾고, 없으면 기본 drawObject를 사용한다. 일반 모드에서는 선택한 원본을 skeleton clone한다.
            사용할 모델이 없으면 오류를 출력하거나 undefined를 반환한다.
            isUpdate가 없으면 true를 기본값으로 두고 출력 그룹 이름을 모델명으로 설정한 뒤 BEFORE_CREATE 이벤트를 발생시킨다.
            일반 모드에서는 clone을 보이게 하여 출력 그룹에 추가하고, animation clip마다 mixer action을 준비하여 opt.mixers에 넣는다.
            인스턴스 모드에서는 필요하면 비-skinned animation 모델을 skinned 구조로 변환하고 모델별 instance 정보를 추가한 뒤 렌더 mesh를 구성한다.
            인스턴스 원본 object는 숨기고 opt.instanced를 true로, 일반 모드는 false로 확정한다.
            모델별 생성 횟수 정보를 1 증가시키고 정규화한 opt를 반환한다.

    createInstancedMesh(object: Object3D, opt: ComponentCreateOption, objGroup: UGroup) -> UGroup | undefined
        인터페이스: this: instance 정보·렌더 그룹·mesh cache를 소유하는 현재 레이어
        처리 기준: object나 모델별 instance 정보가 없으면 undefined를 반환한다. 그룹도 준비할 수 없으면 종료한다.
        의존:
            defined — 원본 object와 렌더 그룹 존재 여부 판정; 함수: {defined()}
            THREE.Object3D — 원본 world matrix 갱신과 animation 상태 기록; 함수: {updateMatrixWorld()}; 속성 읽기·쓰기: {parent.position, position, mixer, animations}
            THREE — 원본·부모 위치 초기화와 모델 animation mixer 구성; 생성자: {new AnimationMixer()}; 함수: {Vector3.set(), clipAction()}
            UGroup — 그룹 animation 목록 기록; 속성 쓰기: {animations}
        동작:
            원본 이름을 먼저 보관하고 모델 정보의 lastIndex 또는 size - 1을 현재 instance ID로 사용하며 floor(ID / instancedMaxCount)로 그룹 번호를 계산한다.
            self._instancedInfo가 있고 모델별 정보도 있으면 해당 모델·그룹 번호의 렌더 그룹을 조회하고 없으면 만들어 사용한다.
            원본 모델과 부모의 위치를 0으로 맞추고 world matrix를 갱신한다.
            self._instancedInfo가 있고 모델별 정보와 렌더 그룹이 준비된 경우 레이어 상태·원본·옵션·선택 그룹·instance 정보·ID·그룹 번호·렌더 그룹·cache와 먼저 보관한 모델명을 내부 조립 함수에 전달한다.
            모델 animation이 있으면 원본 object용 mixer와 clip action을 준비하여 그룹의 animation과 opt.mixers에 연결한다.
            모델·ID 구간 렌더 그룹을 반환한다.

    createComponent(opt: ComponentCreateOption) -> ComponentObject | undefined
        인터페이스: this: 레이어의 생성 기준과 draw context를 제공하는 현재 레이어
        의존:
            defined — 생성 옵션과 style·material 존재 여부 판정; 함수: {defined()}
            UDEF — 생성 mesh의 기본 모델 render order 결정; 상수: {RENDER_ORDER.MODEL}
            UGroup — 컴포넌트 출력 그룹 생성; 생성자: {new UGroup()}
            U3dComponentPosition — 일반 컴포넌트 생성; 생성자: {new U3dComponentPosition()}
            U3dComponentInstancedPosition — 인스턴스 컴포넌트 생성; 생성자: {new U3dComponentInstancedPosition()}
            U3dLayer — 생성 option에 전달할 기반 draw context 조회; 속성 읽기: {_drawArg}
            ComponentObject — 생성 결과의 일반·인스턴스 렌더 tree 조회; 속성 읽기: {instancedGroup, _object}
            THREE.Object3D — 생성 컴포넌트의 mesh tree 순회; 함수: {traverse()}
            THREE.Mesh — 기본 render order 적용; 속성 쓰기: {renderOrder}
        동작:
            출력 그룹을 만들고 입력 opt.mixers에 빈 배열을 저장한 뒤 위치·모델·일반/인스턴스 경로를 정규화한다.
            정규화 결과를 확인하기 전에 labelVisible을 읽으므로 componentSetting이 undefined를 반환하면 예외가 발생할 수 있다. [확인 Q-003]
            labelVisible이 정의되지 않았으면 opt.labelVisible에 레이어의 labelVisible을 저장하고, 정의된 입력은 그대로 둔다.
            정규화 결과가 있으면 기반 layer·drawArg·공통 scale·rotation·image·충돌·경로·표현 설정을 합친 component option을 만든다. type이 없으면 `component`를 사용하고, image는 개별 생성 opt가 아니라 레이어의 `_image` 값을 사용한다.
            pathopacity와 pathOpacity, pathcolor와 pathColor는 각각 소문자 alias를 먼저 truthy 검사한다. 소문자 alias가 숫자 0이면 뒤의 camelCase 값으로 대체되지만, 마지막 피연산자인 camelCase 값 0은 보존된다. [확인 Q-022]
            opt가 있고 opt.instanced가 true인 경우 마지막 instance ID·그룹·정보를 option에 연결한 뒤 인스턴스 컴포넌트를 만든다.
            일반 모드에서는 일반 컴포넌트를 만든다.
            opt가 있으면 생성된 일반·인스턴스 컴포넌트의 렌더 tree를 순회한다.
                child.isMesh가 true인 경우 `UDEF.RENDER_ORDER.MODEL`을 기본 renderOrder로 설정하고 style이 정의되어 있으면 depthTest·depthWrite·renderOrder를 적용한다.
            생성한 컴포넌트를 반환하고 정규화 결과가 없으면 undefined를 반환한다.

    setComponentDepth(mesh: Mesh, style: object) -> void
        처리 기준: mesh material이 없으면 변경하지 않는다.
        의존:
            defined — material과 선택 style 값 존재 여부 판정; 함수: {defined()}
            THREE.Material — 깊이 판정 설정; 속성 읽기·쓰기: {depthTest, depthWrite}
            THREE.Mesh — 렌더 순서 설정; 속성 읽기·쓰기: {renderOrder}
        동작:
            material이 배열이면 각 material에, 단일이면 그 material에 style의 depthTest와 depthWrite가 정의된 값만 적용한다.
            style.renderOrder가 있으면 mesh renderOrder를 바꾸고 없으면 기존 값을 유지한다.

    setInstancedProperty(option: object, name: string) -> object | undefined
        인터페이스: this: 모델별 instance 정보와 렌더 그룹을 소유하는 현재 레이어
        처리 기준: 전체 또는 모델별 instance 정보와 마지막 ID가 없으면 undefined를 반환한다.
        의존: defined — instance 저장소, 모델 정보와 ID 존재 여부 판정; 함수: {defined()}
        동작:
            모델 정보의 lastIndex를 우선 사용하고 없으면 size - 1을 현재 instance ID로 선택한다.
            ID를 instancedMaxCount로 나눈 몫을 그룹 번호로 계산한다.
            같은 모델명·그룹 번호의 렌더 그룹을 찾아 option에 연결한다.
            최대 그룹 용량, 현재 ID의 instance 정보와 인스턴스 활성 표시를 option에 기록하고 반환한다.

컴포넌트 제거 내부 함수 책임 그룹
    역할: 일반·인스턴스 컴포넌트의 계층, metadata, 렌더 instance와 GPU 자원을 함께 정리한다.

    removeComponent(component: ComponentObject) -> void
        인터페이스: this: 컴포넌트 목록·이름 색인과 instance 자원을 소유하는 현재 레이어
        의존:
            defined — instance ID 존재 여부 판정; 함수: {defined()}
            U3dComponentPosition — U3dComponentPosition 계열 부모 관계 판정과 해제; 상수: {U3dComponentPosition}; 함수: {removeChild()}
            ComponentObject — 계층·instance 식별 상태 조회와 라벨·컴포넌트 자원 해제; 함수: {removeLabel(), dispose()}; 속성 읽기·쓰기: {children, parent, instanceId, name}
        동작:
            자식 목록을 뒤에서부터 순회하여 각 자식을 이름으로 재귀 제거하고 자식 목록을 빈 배열로 바꾼다.
            부모와 현재 대상이 모두 U3dComponentPosition 계열이면 부모에서 현재 대상을 분리한다.
            instance ID가 있는 인스턴스 컴포넌트이면 instance 렌더 자원 제거 경로를 실행한다.
            일반 컴포넌트이면 라벨과 컴포넌트를 해제하고 목록에서 제거한 뒤 이름 색인에서도 삭제한다.

    removeInstancedComponent(component: U3dComponentInstancedPosition) -> void
        인터페이스: this: instance metadata·경계 cache와 컴포넌트 목록을 소유하는 현재 레이어
        의존: ComponentObject — 원본 모델명 조회와 라벨·컴포넌트 자원 해제; 함수: {removeLabel(), dispose()}; 속성 읽기: {_object}
        동작:
            컴포넌트의 instance metadata와 렌더 상태를 제거한다.
            원본 모델 이름의 경계 cache를 삭제한다.
            라벨과 컴포넌트 자원을 해제하고 컴포넌트 목록에서 대상 항목을 제거한다.

    removeInstancedInfoAtComponent(component: U3dComponentInstancedPosition) -> void
        인터페이스: this: instance 정보·렌더 그룹과 mesh cache를 소유하는 현재 레이어
        처리 기준: 모델명 또는 instance ID가 없으면 제거를 중단하며 ID 누락은 오류를 출력한다.
        의존:
            defined — instance ID 존재 여부 판정; 함수: {defined()}
            __GError__ — instance ID 누락 오류 출력; 함수: {__GError__()}
            U3dComponentInstancedPosition — instance ID와 그룹 상태 조회; 함수: {getInstanceId()}; 속성 읽기: {_object, _instancedMaxCount, groupIndex}
            THREE.Object3D — instance 렌더 그룹 순회; 함수: {traverse()}
            UInstancedBatchedSkinnedMesh — runtime class 판정과 legacy instance 숨김·삭제; 상수: {UInstancedBatchedSkinnedMesh}; 함수: {setVisible(), deleteInstance()}
            UInstancedMesh — runtime class 판정, instance 숨김·삭제, matrix map·edge 조회와 경계 갱신; 상수: {UInstancedMesh}; 함수: {setVisible(), removeInstances(), getEdgeLine(), computeBoundingSphere()}; 속성 읽기: {_matrixMap, _oriMatrixMap}
        동작:
            component._object.name이 있고 instance ID도 존재하는 경우 모델 전체 ID를 instancedMaxCount로 나눈 나머지를 그룹 내부 ID로 계산하고 모델별 instance 정보를 삭제한다.
            component._object.name이 있는 경우 같은 모델명·컴포넌트 그룹 번호의 렌더 그룹을 찾는다.
            component._object.name이 있고 렌더 그룹이 있으면 mesh를 순회한다.
                종류에 맞게 그룹 내부 instance를 숨기고 삭제하며, UInstancedMesh인 경우에는 즉시 경계구도 다시 계산한다.
                적용·원본 matrix Map이 둘 다 있는 mesh만 양쪽 Map에서 그룹 내부 ID를 삭제한다.
                instancedMesh.getEdgeLine이 있으면 해당 ID의 edge line을 조회하고 반환된 line이 있으면 해제·분리한다.
            component._object.name이 있는 제거 경로에서 모델별 instance 정보가 비었으면 해당 모델의 모든 렌더 그룹과 cache를 제거하고 종료한다.
            component._object.name이 있고 남은 정보가 있으면 최고 ID가 속한 그룹보다 큰 렌더 그룹과 cache만 정리한다.

    clearInstancedObject(name: string, info: InstancedInfo, component: U3dComponentInstancedPosition) -> void
        인터페이스: this: 인스턴스 상위 그룹과 mesh cache를 소유하는 현재 레이어
        의존: U3dComponentInstancedPosition — 마지막 유지 렌더 그룹 계산에 사용할 그룹 한도 조회; 속성 읽기: {_instancedMaxCount}
        동작:
            info.lastIndex가 null·undefined이면 -1로 시작하고 그 값이 0 미만일 때만 남은 key 중 최댓값을 구한다. 유한성 검사는 따로 하지 않는다.
            최고 ID를 instancedMaxCount로 나눈 몫을 마지막 유지 그룹 번호로 계산한다.
            인스턴스 상위 그룹과 mesh cache를 뒤에서 순회하여 같은 모델이면서 마지막 유지 그룹보다 번호가 큰 그룹·mesh를 해제하고 부모에서 분리하며, mesh cache key도 삭제한다.

    removeByName(name: string) -> void
        인터페이스: this: 인스턴스 상위 그룹과 mesh cache를 소유하는 현재 레이어
        동작:
            인스턴스 상위 그룹과 mesh cache를 뒤에서 순회하여 원본 모델명이 같은 모든 그룹·mesh를 해제하고 부모에서 분리하며, mesh cache key도 삭제한다.

    disposeAndRemove(object: Object3D) -> void
        의존:
            UDEF — Three object와 연결된 GPU 자원 해제; 함수: {disposeObject3D()}
            THREE.Object3D — 부모 scene·group에서 분리; 함수: {remove()}
        동작: object의 렌더 자원을 해제하고 부모가 있으면 부모에서 object를 제거한다.
```

## 4. 공통 처리 기준과 제약

```spec
컴포넌트를 생성하려면 사용할 원본 모델이 기반 레이어에 먼저 로드되어 있어야 한다.
컴포넌트 이름은 이름 색인의 key와 저장·복원 계층 참조에 함께 사용되며 두 경로가 같은 식별값을 전제로 한다.
일반 컴포넌트는 clone object를 개별 소유하고, 인스턴스 컴포넌트는 모델·ID 구간별 렌더 그룹과 mesh를 공유한다.
새 instance ID는 모델별 현재 lastIndex의 다음 값으로 정하며, 그룹 번호는 floor(ID / instancedMaxCount), 그룹 내부 ID는 ID % instancedMaxCount로 계산한다.
인스턴스 제거 뒤 남은 ID는 재배열하지 않으며 lastIndex만 남은 최댓값으로 조정한다.
이동 경로 animation 상태와 모델 내장 mixer 상태는 별개이며 show·hide는 이동 경로 animation만 자동 제어한다.
영역 검색은 world XY 평면을 사용하고 선분 방향 판정의 공선 허용 오차는 1e-12이다.
deprecated API는 현재 활성 대체 API에 직접 전달한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
