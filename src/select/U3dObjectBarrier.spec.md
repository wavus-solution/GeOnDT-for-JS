# U3dObjectBarrier 명세

> 상태: 구현 관찰 초안

## 1. 개요

메시·도형·컴포넌트를 강조한다. 후처리에서는 외곽선 패스에 등록하고, 후처리를 사용할 수 없으면 재질을 대체한다. 선택 효과와 사용자 효과의 백업·복원, 공유 등록과 해제를 관리하며 `U3dSelect`와 앱의 강조 도구에서 사용한다.

## 3. 정규 자연어 수도코드

```spec
U3dObjectBarrier 클래스 정의
    static materialMap: Map<object, Array<ShaderMaterial>>
        재질 대체 하이라이트의 현재 재질 목록이다.
    static effectMap: WeakMap<object, Array<U3dObjectBarrier>>
        객체에 등록한 도구 목록이다.
    static useEffectMap, selectMap: WeakSet<object>
        사용자 효과와 선택 하이라이트가 등록된 객체 목록이다.
    static selectStyleMap, selectBackupStyleMap: WeakMap<object, object>
        선택 스타일과 선택 이전 사용자 스타일의 백업이다.
    static styleRefSet: Set<object>
        매 프레임 갱신이 필요한 움직이는 효과 대상이다.
    static barrierGroup: UGroup
        보조 하이라이트 객체의 공유 그룹이다.
    static barrierMeshMap: Map<object, InstancedMesh>
        복잡한 인스턴스 형상의 보조 메시다.
    static isActive, setDrawFast: boolean = false
        외곽선 활성 상태와 빠른 그리기 callback 등록 여부다.
    static barrierList: Array<U3dObjectBarrier>
        현재 도구 목록이다.
    static MODE: UOutlineMode
        BASIC=1, BOUNCE=2, FLOW=3, BLOOM=4다.
    static RENDER_ORDER: object
        PASS1=1, PASS2=2, PASS3=3이며 작은 값이 나중에 합성된다.
    static #materialFarPoints: WeakMap<object, UOutlineFarPointOption | null>
        후처리가 꺼진 동안 유효한 간략 윤곽 옵션을 보존한다. 재질 경로에서는 간략 윤곽을 그리지 않는다.

    constructor(app: U3dApp)
        동작:
            앱과 렌더러를 저장하고 자체 재질 목록을 초기화한다.
            공유 보조 그룹을 장면에 붙이고 정적 도구 목록에 중복 없이 등록한 뒤 외곽선 패스를 활성화한다.

    addGroup() -> void
        동작:
            앱이 있으면 공유 barrierGroup을 장면에 붙이고 도구 목록에 중복 없이 등록한다.

    active() -> void
        동작:
            렌더러가 없으면 종료한다. 정적 활성 상태를 true로 바꾸고 현재 패스를 받아 렌더러의 OUTLINE 패스를 활성화한다.

    deactive() -> void
        동작:
            정적 활성 상태를 false로 바꾸고 렌더러가 있으면 OUTLINE 패스를 비활성화한다.
            UOutlinePass이면 간략 윤곽 소유 자원만 해제한다. 기존 등록·스타일은 유지한다.

    setStyle(object: Mesh | U3dComponentPosition | U3dGeometry, style: UOutlineStyleOption) -> boolean
        동작:
            패스가 없거나 대상의 모델을 찾지 못하면 false다.
            색상·숫자·별칭·모드·우선순위를 정규화한다.
            #normalizeFarPointStyle로 간략 윤곽 옵션의 기본값을 보완·검증·복사한다. 잘못된 타입은 TypeError, 수치는 RangeError이다.
            인스턴스 컴포넌트는 하위 공유 메시의 해당 인덱스, 일반 컴포넌트는 모델 루트, 일반 메시·도형은 자신에게 스타일을 지정한다.
            대상은 패스에 추가하고 일반 대상은 움직이는 모드에 맞춰 프레임 갱신 여부를 변경한다.

    getStyle(object: Mesh | U3dComponentPosition | U3dGeometry, effective: boolean = true) -> object | Array<object> | null
        동작:
            패스·대상·조회 함수가 없으면 null이다.
            일반 대상의 유효 또는 직접 스타일을 반환한다. 인스턴스는 각 공유 메시·인덱스·스타일의 배열을 반환한다.

    setBarrier(object: Mesh | U3dComponentPosition | U3dGeometry, style: UOutlineStyleOption, useEffect: boolean = true) -> void
        동작:
            UTileMesh는 제외하며 활성 상태인데 패스가 없으면 활성화를 시도한다.
            선택·소유권 변경 전에 #normalizeFarPointStyle로 간략 윤곽 기본값을 보완하고 옵션 오류를 검증한다.
            useEffect가 false이면 선택 목록·스타일을 저장한다. 기존 사용자 효과가 있으면 현재 스타일을 한 번 백업하고 선택 스타일만 적용한 뒤 종료한다.
            후처리 또는 패스가 있으면 setPassBarrier, 없으면 color·opacity·pulse를 이용한 재질 대체를 사용한다.
            재질 대체에서는 간략 윤곽 옵션만 #materialFarPoints에 보존하며 간략 윤곽을 출력하지 않는다.
            생성이 실패하면 종료하고 성공하면 사용자 효과 여부와 도구 목록을 저장한다. 같은 도구는 중복 추가하지 않는다.
            모드별 빠른 그리기 등록을 갱신한다. 사용자 효과 설정 중 선택이 켜져 있으면 사용자 스타일을 백업하고 선택 스타일을 다시 적용한다.

    setPassBarrier(object: Mesh | U3dComponentPosition | U3dGeometry, style: UOutlineStyleOption) -> boolean
        동작:
            현재 패스가 없으면 false다. 스타일을 정규화한 뒤 대상 종류를 구분한다.
            인스턴스 컴포넌트는 각 UInstancedMesh의 barrier 인덱스를 추가하고 해당 스타일을 설정하며 component 연결 정보를 중복 없이 저장한 뒤 true다.
            일반 컴포넌트는 현재 모델 루트에 component 연결을 저장한다. 메시·도형은 자신의 dispose 이벤트에 스타일·등록·공유 참조 정리를 한 번 연결한다.
            일반 대상 루트를 패스에 등록한다. 해당 도구가 아직 등록되지 않았으면 모델 루트의 refCount를 증가시키고 true를 반환한다.

    setMaterialBarrier(object: Mesh | U3dComponentPosition | U3dGeometry, color: ColorRepresentation = 0xffaa00, opacity: number = 1, pulse: number = 1) -> boolean
        동작:
            이미 재질이 있으면 색상·투명도·크기·부분 선택 값을 갱신하고 true다.
            일반 컴포넌트·인스턴스 컴포넌트·일반 메시를 구분하여 하이라이트 재질을 생성한다. 컴포넌트 생성 오류는 로그 후 false다.
            생성된 재질이 있으면 공유 보관소와 자체 목록에 추가한다. 지원 대상에서 재질 목록이 비어도 현재 true를 반환한다.

    removeBarrier(object: Mesh | U3dComponentPosition | U3dGeometry, useEffect: boolean = true) -> boolean
        동작:
            선택 해제이면 선택 목록·스타일을 제거한다. 백업과 사용자 효과가 남아 있으면 선택 도구의 등록을 반납하고 백업 스타일을 복원한 뒤 true다.
            사용자 효과 해제 중 선택이 남아 있으면 사용자 등록만 반납하고 선택 스타일을 유지한 뒤 true다.
            그 밖에는 후처리 등록 또는 재질 대체를 제거하고 도구 목록·스타일 프레임 등록을 정리하여 true다.

    removePassBarrier(object: Mesh | U3dComponentPosition | U3dGeometry, pass?: UOutlinePass) -> boolean | undefined
        동작:
            자체 패스 또는 전달받은 패스가 없으면 false다.
            인스턴스 컴포넌트는 각 공유 메시의 인덱스·스타일을 제거하고 남은 barrier 인덱스가 없으면 메시 등록도 제거한다. component 연결을 정리한 뒤 undefined다.
            일반 대상은 현재 도구가 등록되어 있으면 refCount를 반납한다. 마지막 참조이면 스타일·패스 등록을 제거하고 true다.

    removeMaterialBarrier(object: Mesh | U3dComponentPosition | U3dGeometry, isSwap?: boolean) -> boolean
        동작:
            대상 종류에 맞춰 일반·인스턴스·병합 재질을 원래대로 복원한다. 현재 재질 보관소가 없는 일반 대상은 false다.
            isSwap이 아니면 재질과 참조를 정리한다. 후처리 전환이면 공유 효과 연결을 보존한다.

    static swapSelectedObject(renderer: URenderer, isPostProcess: boolean, pass: UOutlinePass) -> void
        동작:
            후처리를 켤 때 패스가 없으면 종료한다. 재질 경로의 색상·투명도를 읽고 관련 도구와 컴포넌트를 원래 재질로 되돌린 뒤 후처리에 재등록한다.
            후처리를 끌 때 패스가 없으면 종료한다. 선택 목록을 보관한 뒤 비우고 component 연결로 등록을 반납한 후 재질 하이라이트를 만든다.
            비우기 전에 일반 대상과 인스턴스별 간략 윤곽 옵션을 보존하며 후처리로 복귀할 때 기존 색상·투명도 전달에 해당 옵션을 함께 전달한다.
            이 경로는 현재 전체 스타일을 재질 경로에 보존하지 않고 색상·투명도 또는 패스 기본 색상을 사용한다.

    #normalizeFarPointStyle(style: UOutlineStyleOption) -> UOutlineStyleOption
        동작:
            farPoint가 null이면 입력 스타일을 반환하며 객체·undefined 이외의 입력은 TypeError를 전달한다.
            생략·부분 입력은 U3dSelect와 같은 enabled true, thresholdSizePx 24, minSizePx 5, simplifyTolerancePx 0.1로 보완하고 명시적 입력을 우선한다.
            단일 기준 없이 기존 enterSizePx·exitSizePx 중 하나를 지정하면 기본 단일 기준을 제거하고 기존 진입·복원 기준을 사용한다.
            minSizePx 없이 pointSizePx를 지정하면 최소 크기로 사용한다.
            UOutlinePass._normalizeStyle에 보완한 스타일을 전달하여 타입·양수·유한수·기준 순서를 검증하고 복사한 옵션의 스타일을 반환한다.

    #validateStyle(style: UOutlineStyleOption) -> UOutlineStyleOption
        동작:
            #normalizeFarPointStyle을 먼저 호출하여 간략 윤곽 기본값을 보완·검증·복사한다. 기존 색상·별칭·모드·우선순위 정규화는 유지한다.
            farPoint가 null이면 null, 그 밖에는 보완한 옵션의 복사본을 전달한다.

    #snapshotCurrentBarrierStyle(object: Mesh | U3dComponentPosition | U3dGeometry) -> object | null
        동작:
            후처리에서는 해당 일반 객체 또는 인스턴스의 직접 스타일을 백업한다. 인스턴스는 첫 공유 메시의 스타일을 사용한다.
            재질 경로에서는 첫 재질의 색상·투명도·pulse와 #materialFarPoints의 간략 윤곽 옵션을 material 백업으로 반환한다. 백업 대상이 없으면 null이다.

    #applyBarrierStyleOnly(object: Mesh | U3dComponentPosition | U3dGeometry, style: object) -> boolean
        동작:
            후처리 또는 패스가 있으면 setStyle을 호출한다. 그렇지 않으면 간략 윤곽 옵션을 #materialFarPoints에 보존하고 기존 재질 색상·투명도·pulse만 적용한다.
            새 등록·소유권을 추가하지 않고 적용 결과를 반환한다.

    createMaterial(color: ColorRepresentation, opacity: number, pulseScale: number = 1, isInstanced: boolean = false, name: string = 'barrierMaterial') -> ShaderMaterial
        동작:
            일반 또는 인스턴스 vertex 셰이더, 하이라이트 fragment 셰이더와 색상·투명도·맥동 uniform을 가진 ShaderMaterial을 생성한다.

    dispose() -> void
        동작:
            자체 생성 재질 목록과 프레임 callback을 정리하고 정적 도구 목록에서 제거한다.
            마지막 도구이면 정적 활성 상태를 끄고 패스를 비활성화한다.

UOutlineStyleOption 부분 타입 명세
    이 명세에서 사용하는 필드:
        color, visibleEdgeColor, hiddenEdgeColor, dashColor?: ColorRepresentation
            공통·비가림·가림·흐름 색상이다. visibleEdgeColor는 color보다 우선한다.
        lineWidth, width?: number
            lineWidth를 우선 사용하는 선 폭이다. 활성 farPoint에서는 CSS 픽셀 두께이며 farPoint.lineWidthPx가 더 우선한다. 비활성은 기존 폭 배율이다.
        mode, renderOrder?: number
            표현 모드와 선택적인 1부터 3까지 합성 순서다.
        bounceSpeed, glowIntensity, dashDensity, dashRatio, timeOffset?: number
            각 모드의 움직임·광채·점선·위상 설정이다.
        flowSpeed, dashSpeed, speed?: number
            흐름 속도는 flowSpeed·dashSpeed·speed 순서로 전달한다.
        opacity, pulse?: number
            재질 대체 경로의 투명도와 크기 확장값이다.
        farPoint?: UOutlineFarPointOption | null
            간략 닫힌 윤곽 보완 옵션이다. 배리어는 미지정·부분 입력을 선택기와 같은 기본값으로 보완하며 null 또는 enabled false는 해제다. 기존 스타일과 병합하지 않는다.

UOutlineFarPointOption 타입 정의
    대표 정점의 볼록한 닫힌 외곽을 사용하며 오목한 부분·구멍은 생략한다.
    활성 네 모드는 상세·간략 모두 같은 CSS 두께로 출력한다. 두께는 lineWidthPx → 스타일 lineWidth → width → 양수인 명시적 setLineWidth 값 순이며 초기값은 1.5다. 기존 edgeGlow·블러는 적용하지 않는다. 상세 표현은 실제 원본 마스크 실루엣이다. 패턴·옵션 비활성은 기존 출력 경로를 사용한다.
    BOUNCE는 기본 윤곽과 닫힌 파동, BLOOM은 외부 광채, FLOW는 기본·대시 두 색상의 이동을 상세·간략 모두 출력한다. bounceSpeed·glowIntensity·dashDensity·dashRatio·dashColor·flowSpeed·timeOffset은 유지한다. 상세 BOUNCE·BLOOM 또는 1.5와 다른 두께에 소유 거리 계산 타깃을 사용하며 리사이즈·해제 때 정리한다.
    enabled?: boolean
        배리어·선택기는 기본 true이며 패스 직접 설정은 false다. BASIC·BOUNCE·FLOW·BLOOM 후처리 간략 윤곽 대체를 사용한다.
    lineWidthPx?: number
        숫자·양수·유한수인 기본 선의 CSS 두께이다. 스타일과 전역 두께보다 우선한다. BOUNCE 파동은 기본 선의 5/3배이며 minSizePx와 별개다.
    thresholdSizePx?: number
        새 호출의 단일 전환 기준이며 배리어·선택기는 기본 24, 패스 직접 설정은 16 CSS 픽셀의 숫자·양수·유한수이다. 투영 경계 크기가 이 값 이하이면 간략 윤곽으로 전환하고, 내부에서 기준의 10%와 2픽셀 중 큰 여유를 더한 크기 이상이면 상세 외곽선으로 복원한다. 중간은 이전 표현을 유지하며 명시적인 단일 기준은 기존 두 기준보다 우선한다.
    enterSizePx?: number
        기존 호출 호환용 진입 기준이다. thresholdSizePx 없이 기존 두 기준 중 하나를 지정하면 사용하며 생략값은 16 CSS 픽셀이다. 양수·유한수이고 크기가 이 값 이하이면 간략 윤곽으로 전환한다.
    exitSizePx?: number
        기존 호출 호환용 복원 기준이다. thresholdSizePx 없이 기존 두 기준 중 하나를 지정하면 사용하며 생략값은 24 CSS 픽셀이다. 양수·유한수이며 진입값보다 커야 한다. 화면 크기가 이 값 이상이면 외곽선으로 복원하고, 두 값 사이에서는 이전 상태를 유지한다.
    minSizePx?: number
        양수·유한수이며 배리어·선택기는 기본 5, 패스 직접 설정은 12 CSS 픽셀이다. 기존 pointSizePx만 지정하면 그 값을 사용한다. 간략 윤곽의 최소 가로·세로 중 큰 값이며 가는 폭은 최소 4픽셀로 보완한다.
    pointSizePx?: number
        기존 호출 호환용 최소 표시 크기 입력이다. minSizePx가 있으면 우선하며 정규화 결과에는 minSizePx만 저장한다. 새 호출은 minSizePx를 사용하며 중심 점 출력은 없다.
    simplifyTolerancePx?: number
        배리어·선택기는 기본 0.1, 패스 직접 설정은 2 CSS 픽셀의 숫자·양수·유한수이다. 가장 간략한 단계의 정점 제거 허용 오차이며 간략 0단계는 건너뛰며 간략 1단계는 이 값의 1/2, 간략 2단계는 전체값을 사용한다. 낮출수록 더 많은 굴곡을 보존하지만 대표 정점의 볼록 윤곽을 벗어나 오목한 부분·구멍을 복원하지 않는다.
    group?: Object3D
        일반 메시의 명시적 논리적 묶음 루트이다. 인스턴스는 기존 컴포넌트 연결을 사용하고 group을 지정하면 외곽선을 유지한다.
```

## 4. 공통 처리 기준과 제약

```spec
선택 효과는 사용자 효과보다 우선한다. 현재 스타일의 백업과 복원은 등록·참조 반납과 구분된다.
일반 대상은 모델 또는 메시의 공유 refCount를 사용한다. 인스턴스 제거는 현재 인덱스별 barrier·스타일을 직접 제거하므로 새 기능이 별도 소유권 정책을 추가하지 않는다.
재질 대체는 메시 크기·메시 종류·부분 선택에 따라 직접 셰이더 재질 또는 convex 보조 메시를 사용한다. 인스턴스 행렬은 원본과 연동하고 마지막 항목 제거 시 보조 geometry·material·texture를 해제한다.
병합 메시의 _pickMaterials는 선택 그룹과 materialIndex attribute를 제어한다. 원래 재질·투명도·깊이 설정·형상 그룹은 해제 또는 경로 전환 시 복원한다.
BOUNCE·FLOW 또는 소유 재질의 시간 갱신은 앱의 renderBefore callback을 사용한다. 공유 styleRefSet이 비면 callback 등록을 제거하며 다른 활성 효과가 있으면 유지한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
