# UOutlinePass 명세

> 상태: 구현 관찰 초안

## 1. 개요

등록된 메시와 인스턴스의 외곽선을 후처리로 표시한다. 선택 대상의 깊이 제외와 마스크 생성, 스타일별 외곽선 검출, 우선순위 합성을 담당한다. `URenderer`가 생성하고 `U3dObjectBarrier`가 대상과 스타일을 등록한다.

## 2. 요구사항과 품질 기준

```spec
farPoint.enabled인 작은 BASIC·BOUNCE·FLOW·BLOOM 대상은 실제 대표 정점을 연결한 객체별 간략한 닫힌 외곽선으로 대체한다. 중심 점은 출력하지 않으며 서로 다른 객체·인스턴스를 합치지 않는다.
간략 윤곽은 축소 외곽선 마스크·검출·블러와 독립적으로 출력한다. 표현 전환은 등록·소유권·깊이 제외 정책을 바꾸지 않는다.
활성 네 모드는 상세·간략 모두 같은 CSS 픽셀 기본 두께를 사용한다. 두께는 farPoint.lineWidthPx → style.lineWidth → style.width → 명시적 setLineWidth 값 순서이며 초기값은 1.5다. 상세 표현은 원본 마스크의 실제 실루엣이다. 기존 edgeGlow·블러는 적용하지 않는다. BOUNCE는 기본 윤곽과 닫힌 파동, BLOOM은 외부 광채, FLOW는 두 색상의 이동을 합성한다. 모드별 속도·강도·밀도·비율·색상·시간 오프셋은 보존한다. 패턴·옵션 비활성 대상은 기존 출력 경로를 사용한다.
공식 인스턴스 LOD의 마스크 재질 동기화와 독립 출력 중복 제외는 표현 상태·옵션 여부와 관계없이 적용하며 미선택 인덱스의 형상을 남기지 않는다.
부분 선택·스타일 충돌·미지원 변형·불명확한 묶음처럼 하나의 간략 윤곽으로 선택 의미를 보존할 수 없으면 외곽선을 유지한다.
화면 크기와 최소 표시 크기는 CSS 픽셀이다. 작아질수록 허용 오차를 늘려 굴곡을 줄이며 최소 세 정점의 닫힌 선을 보존한다. 원본 모델은 계속 렌더링하고 간략 윤곽은 기존 우선순위별로 묶는다.
```

## 3. 정규 자연어 수도코드

```spec
UOutlinePass extends OutlinePass 클래스 정의
    의존:
        OutlinePass — 마스크·깊이 타깃과 화면 사각형 자원; 상속: {OutlinePass}
        getOutlineMaterial — 스타일별 외곽선 셰이더; 함수: {getOutlineMaterial()}

    edgeStrength: number = 2
        최종 밝기 배율이다.
    edgeGlow: number = 0.2
        블러 외곽선 합성 배율이다.
    edgeThickness: number = 3
        기반 패스 두께 설정이다.
    lineWidth: number = 5
        전체 외곽선 검출 폭이다.
    mode: number = 1
        BASIC=1, BOUNCE=2, FLOW=3, BLOOM=4다.
    enabled, renderToScreen: boolean
        패스 실행 여부와 화면 최종 출력 여부다.
    usePatternTexture: boolean
        기반 패스의 패턴 사용 설정이며 참이면 일정 CSS 두께 합성과 간략 윤곽을 생략한다.
    selectedObjects: Array<Object3D>
        등록 루트 목록이며 직접 반환하는 API가 원본 배열을 노출한다.
    prepareMaskMaterialInstanced, edgeDetectionMaterial, separableBlurMaterial1, separableBlurMaterial2, materialCopy: ShaderMaterial | undefined
        마스크·검출·블러·합성 재질이며 dispose 후 참조를 비운다.
    prepareMaskMaterial: ShaderMaterial | undefined
        dispose에서 undefined로 비우며 #getMaskMaterials의 this.prepareMaskMaterial 조건으로 사용 여부를 판정한다.
    overlayMaterial: ShaderMaterial | undefined
        dispose에서 undefined로 비우며 getSelectedBlending와 setSelectedBlending의 this.overlayMaterial 조건으로 사용 여부를 판정한다.
    depthMaterial: MeshDepthMaterial | undefined
        비선택 객체의 깊이를 기록하는 기반 재질이다.
    renderTargetMaskBuffer, renderTargetDepthBuffer, renderTargetMaskDownSampleBuffer, renderTargetBlurBuffer1, renderTargetBlurBuffer2, renderTargetEdgeBuffer1, renderTargetEdgeBuffer2: WebGLRenderTarget | undefined
        기반 패스가 소유한 렌더 타깃이며 dispose 후 참조를 비운다.
    oldClearAlpha: number
        렌더 시작 전 배경 투명도 백업이다.
    _styleIdByObject: WeakMap<Object3D, number>
        직접 지정한 객체 스타일 ID다.
    _styleIdByInstancedMesh: WeakMap<Object3D, Map<number, number>>
        공유 메시의 인덱스별 스타일 ID다.
    _styleMap: Map<number, object>
        직접 입력한 스타일의 CPU 보관소다.
    _styleTexture: DataTexture | null
        스타일별 색상·두께·모드 값을 네 행에 저장한다.
    _maskRenderObjects: Array<Object3D>
        현재 선택 루트를 순회해 수집한 메시 목록이다.
    _maskRenderStyleIds: Array<number>
        수집한 메시별 실제 적용할 스타일 ID다.
    #maskPerspective: boolean
        두 마스크 셰이더의 현재 깊이 변환 방식이며 생성 카메라의 투영 종류로 초기화한다.
    #farPointStyleCount: number = 0
        간략 윤곽 사용 스타일 수이며 0이면 간략 윤곽 계산과 GPU 출력을 생략한다.
    #farPointRoots: Array<Object3D> = 빈 배열
        현재 마스크 메시의 등록 루트이다. 실제 해제 시 참조를 비운다.
    #farPointFrame: UOutlineFarPointFrame | undefined
        깊이 캐시와 별도로 파생한 마스크 제외 목록과 간략 윤곽 출력 목록이다.
    #farPointLineWidth: number = 1.5
        양수인 명시적 setLineWidth 값이 갱신하는 활성 외곽의 기본 CSS 두께이다.
    #farPoints: FarPoints | undefined
        실제 간략 윤곽 출력 때 생성한 GPU 자원의 내부 소유자다.

    static _normalizeStyle(style: UOutlineStyleOption) -> UOutlineStyleOption
        동작:
            farPoint가 undefined 또는 null이면 기존 입력 참조를 그대로 반환한다. 그렇지 않으면 배열 아닌 객체, 선택적인 enabled의 boolean 타입, 양수·유한수 화면 크기를 검증한다.
            option.thresholdSizePx가 undefined이고 기존 enterSizePx 또는 exitSizePx 중 하나가 undefined가 아니면 기존 두 기준을 사용한다. 이 경로는 enterSizePx=16·exitSizePx=24를 생략값으로 적용하며 진입값이 복원값보다 작아야 한다. 그 밖에는 option.thresholdSizePx → 16 순서로 null 또는 undefined가 아닌 값을 우선하여 단일 thresholdSizePx만 저장하고 기존 두 기준은 저장하지 않는다. 따라서 명시적인 단일 기준은 기존 두 기준보다 우선하며 정규화된 스타일을 다시 정규화해도 전환 정책을 바꾸지 않는다.
            사용한 전환 기준·simplifyTolerancePx=2·최소 표시 크기는 모두 숫자·양수·유한수여야 한다. pointSizePx와 lineWidthPx가 지정되면 해당 입력도 숫자·양수·유한수로 검증하지만 기본값을 추가하지 않는다. minSizePx는 option.minSizePx → option.pointSizePx → 12 순서로 null 또는 undefined가 아닌 값을 우선 사용한다. group이 지정되면 isObject3D가 참이어야 한다.
            잘못된 타입은 TypeError, 수치 범위는 RangeError이다. 원래 스타일을 얕게 복사하고 기본 enabled=false와 검증한 옵션의 복사본을 동결하여 반환한다. 최소 크기는 minSizePx만 저장하며 호환 입력 pointSizePx는 저장하지 않는다. 지정한 lineWidthPx는 동결 복사에 보관한다.

    #invalidateFarPoints(object: Object3D, instanceIndex?: number) -> void
        동작:
            내부 상태 소유자가 있으면 해당 객체·인덱스의 전환 이력과 프레임 참조를 비운다. 다른 대상의 전환 이력은 보존한다.
            간략 윤곽 프레임과 등록 루트의 강한 참조를 비운다. 사용 스타일 수가 0 이하이면 간략 윤곽 소유 자원을 해제하고 상태 소유자 참조를 비운다.

    _clearFarPoints() -> void
        동작:
            후처리 비활성화 시 간략 윤곽 소유 자원을 해제하고 소유자·프레임 참조를 비운다. 등록·스타일은 변경하지 않는다.

    #prepareFarPoints(renderer: WebGLRenderer) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {usePatternTexture, renderCamera}
        동작:
            현재 간략 윤곽 프레임을 비운다. 사용 스타일 수가 0 또는 usePatternTexture이면 간략 윤곽 자원을 해제하고 종료한다.
            내부 상태 소유자가 없으면 INTERNAL.createFarPoints로 생성한다. 마스크 메시와 대응하는 등록 루트에서 출력 구성원을 만든다.
            _parentLOD의 LODinfo.objects에 포함된 공식 대체 메시는 구성원 수집에서 생략한다. 엔진 인스턴스 원본이면 getBarrierInstances의 각 인덱스와 실제 인덱스 스타일 ID를 사용한다. 일반 메시이면 현재 캐시의 스타일 ID를 사용한다. 스타일의 기존 정규화 우선순위가 0이면 3을 사용한다.
            등록 전체에서 파생한 구성원·스타일·기존 색상 텍스처·기본 모드·카메라·렌더러를 내부 _prepare에 전달하여 출력 전용 프레임을 받는다. 원래 등록과 깊이 캐시는 변경하지 않는다.

            object.isInstancedMesh && typeof object.getBarrierInstances === 'function'의 결과가 false인 경우 #getRenderOrderFromStyleId 단계의 결과를 현재 흐름에 반영한다.
            object.isInstancedMesh && typeof object.getBarrierInstances === 'function'의 결과가 true인 경우 #getRenderOrderFromStyleId 단계의 결과를 현재 흐름에 반영한다.

    constructor(resolution: Vector2 | undefined, scene: Scene, camera: Camera, selectedObjects: Array<Object3D> | undefined, app: U3dApp)
        의존:
            getOutlineMaterial — 실제 렌더링·스타일·자원 의존; 함수: {getOutlineMaterial()}
            Color — 실제 렌더링·스타일·자원 의존; 생성자: {new Color()}
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {visibleEdgeColor, hiddenEdgeColor, depthMaterial, prepareMaskMaterial, overlayMaterial}
        동작:
            기반 패스 자원을 생성하고 객체·인스턴스 스타일 저장소를 초기화한다.
            깊이·마스크·축소 마스크 필터를 최근접으로 바꾸고 인스턴스 전용 마스크 재질을 복제한다.
            스타일 텍스처 용량 256을 만들고 마스크에 스타일 ID·가시성 강제 표시를 기록하도록 셰이더를 패치한다.
            합성은 NormalBlending, 초기 모드는 BASIC으로 지정한다.

            edgeDetectionMaterial가 falsy인 경우 edgeDetectionMaterial에 getOutlineMaterial()를 저장한다.
            _styleIdByObject에 new WeakMap()를 저장한다.
            _styleIdByInstancedMesh에 new WeakMap()를 저장한다.
            _instanceStyleTexByInstancedMesh에 new WeakMap()를 저장한다.
            _freeStyleIds에 []를 저장한다.
            _nextStyleId에 1를 저장한다.
            _styleCapacity에 0를 저장한다.
            _styleTexture에 null를 저장한다.
            _setStyleFlag에 false를 저장한다.
            _tmpStyleVis에 new Color()를 저장한다.
            _tmpStyleHid에 new Color()를 저장한다.
            _tmpStyleDash에 new Color()를 저장한다.
            _styleMap에 new Map()를 저장한다.
            edgeStrength에 2를 저장한다.
            edgeGlow에 0.2를 저장한다.
            edgeThickness에 3를 저장한다.
            lineWidth에 5를 저장한다.
            _app에 app를 저장한다.
            _layerVisibleMap에 new Map()를 저장한다.
            _maskRenderObjects에 []를 저장한다.
            _maskRenderStyleIds에 []를 저장한다.
            prepareMaskMaterialInstanced에 this.#createInstancedMaskMaterial()를 저장한다.
            _renderOrderCache에 { hasRenderOrder: false, dirty: true }를 저장한다.
            _instancedOrderCache에 new Map()를 저장한다.
            #applyNearestFiltersToOutlineTargets 단계의 결과를 현재 흐름에 반영한다.
            #createInstancedMaskMaterial 단계의 결과를 현재 흐름에 반영한다.
            #ensureStyleCapacity 단계의 결과를 현재 흐름에 반영한다.
            #patchPrepareMaskMaterialForStyleId 단계의 결과를 현재 흐름에 반영한다.
            setMode 단계의 결과를 현재 흐름에 반영한다.

    override setSize(width: number, height: number) -> void
        동작:
            기반 패스 타깃 크기를 변경한 뒤 깊이·마스크·축소 마스크 필터를 최근접으로 지정한다.

            #applyNearestFiltersToOutlineTargets 단계의 결과를 현재 흐름에 반영한다.

    setLineWidth(width: number) -> void
        의존:
            getOutlineMaterial — 실제 렌더링·스타일·자원 의존; 함수: {getOutlineMaterial()}
        동작:
            유한수가 아니면 종료하고, 그렇지 않으면 폭을 저장하고 검출 재질 uniform에 반영한다. width > 0인 경우 #farPointLineWidth에 width를 저장한다. 0·음수는 기존 검출 경로만 변경하고 활성 CSS 두께는 보존한다.

            edgeDetectionMaterial가 falsy인 경우 edgeDetectionMaterial에 getOutlineMaterial()를 저장한다.
            lineWidth에 width를 저장한다.

    updateState(camera: Camera) -> void
        역할: 선택·스타일을 유지한 채 이번 프레임의 카메라와 마스크 깊이 변환을 동기화한다.
        의존:
            URenderer — 활성 요청한 패스의 프레임별 카메라 전달; 함수: {updateComposer()}
            OutlinePass — 현재 카메라 참조; 속성 쓰기: {renderCamera}
            ShaderMaterial — 투영 종류 변경 시 프로그램 갱신; 속성 쓰기: {fragmentShader, needsUpdate}
        동작:
            패스 해제 후에는 아무 작업도 하지 않는다. 그 외에는 renderCamera를 입력 카메라로 갱신한다.
            입력과 현재 마스크의 투영 종류가 같으면 셰이더를 변경하지 않는다. 같은 종류의 다른 카메라도 참조는 갱신한다.
            투영 종류가 바뀌면 일반·인스턴스 마스크의 깊이 변환 함수를 현재 원근·직교 방식으로 교체하고 변경한 재질만 재컴파일 대상으로 표시한다.
            선택 등록·스타일 텍스처·마스크 재질·패스 활성 상태를 보존한다. 기존 깊이·간략 윤곽 렌더는 동일한 renderCamera를 사용한다.

    setMode(mode: number) -> void
        의존:
            getOutlineMaterial — 실제 렌더링·스타일·자원 의존; 함수: {getOutlineMaterial()}
        동작:
            1·2·3·4 이외이면 종료하며 유효한 모드를 저장하고 검출 재질이 없으면 생성한다.

            edgeDetectionMaterial가 falsy인 경우 edgeDetectionMaterial에 getOutlineMaterial()를 저장한다.
            mode에 mode를 저장한다.

    getMode() -> number
        동작:
            현재 mode를 반환한다.

    addSelectedObject(object: Object3D) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {selectedObjects, enabled}
        동작:
            목록에 없는 객체만 추가하고 패스를 활성화한다.

    removeSelectedObject(object: Object3D) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {selectedObjects, enabled}
        동작:
            실제 해제 객체의 전환 이력과 프레임 참조를 무효화한다.
            해당 객체가 있으면 제거하고 마지막 대상이 제거되면 패스를 비활성화한다.

            #invalidateFarPoints 단계의 결과를 현재 흐름에 반영한다.

    override dispose() -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {renderTargetMaskBuffer, renderTargetDepthBuffer, renderTargetMaskDownSampleBuffer, renderTargetBlurBuffer1, renderTargetBlurBuffer2, renderTargetEdgeBuffer1, renderTargetEdgeBuffer2, depthMaterial, prepareMaskMaterial, separableBlurMaterial1, separableBlurMaterial2, overlayMaterial, materialCopy, _fsQuad}
        동작:
            간략 윤곽 전용 소유 자원·프레임·등록 루트 참조를 먼저 비운다.
            기반 패스 자원을 해제하고 별도로 복제한 인스턴스 마스크 재질을 해제한다.
            렌더 타깃·재질·화면 사각형의 참조를 undefined로 비운다. 현재 자체 스타일 텍스처를 명시적으로 해제하는 경로는 없다.

    getEdgeColor() -> Color
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {visibleEdgeColor}
        동작:
            visibleEdgeColor의 원본 참조를 반환한다.

    clearSelectedObjects() -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {selectedObjects, _selectionCache, _visibilityCache}
        동작:
            간략 윤곽 소유 자원과 프레임·등록 루트 참조를 비운다.
            선택 목록을 빈 배열로 바꾸고 선택·가시성 캐시를 비운다.
            이전 객체 및 그룹의 자식 메시에서 직접 스타일을 해제하고 부분 선택 배열을 비운다.

            !obj의 결과가 false인 경우 clearOutlineStyleForObject 단계의 결과를 현재 흐름에 반영한다.

    getSelectedObjects() -> Array<Object3D>
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {selectedObjects}
        동작:
            selectedObjects의 원본 배열을 반환한다.

    getSelectedBlending() -> Blending | undefined
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {overlayMaterial}
        동작:
            합성 재질이 있으면 blending을 반환하며 없으면 undefined다.

    setSelectedBlending(blending: Blending) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {overlayMaterial}
        동작:
            합성 재질이 있으면 blending을 변경한다.

    override _updateSelectionCache() -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {_selectionCache, selectedObjects}
        동작:
            마스크 메시를 수집할 때 각 메시에 대응하는 등록 루트를 #farPointRoots에 함께 저장한다.
            dispose·sleep 상태 또는 형상·재질·레이어 가시성이 유효하지 않은 자식을 가진 등록 루트를 제거한다.
            선택 캐시와 마스크 목록을 비우고 등록 루트의 부모가 있는 메시를 수집한다.
            각 메시에 직접 스타일이 없으면 부모 체인에서 가까운 스타일을 적용한다.
            renderOrder 재계산을 예약하고 인스턴스별 우선순위 캐시를 비운다.

            #removeParentsOfInvalidMeshes 단계의 결과를 현재 흐름에 반영한다.
            object.isMesh && object.parent의 결과가 true인 경우 #getEffectiveStyleId 단계의 결과를 현재 흐름에 반영한다.

    override _getEdgeDetectionMaterial() -> ShaderMaterial
        의존:
            getOutlineMaterial — 실제 렌더링·스타일·자원 의존; 함수: {getOutlineMaterial()}
        동작:
            getOutlineMaterial로 검출 재질을 생성하여 반환한다.

    setOutlineStyleForObject(object: Object3D, style: object = {}) -> number
        동작:
            유효 대상을 확인한 뒤 새 간략 윤곽 옵션을 ID 할당 전에 검증·복사한다.
            대상이 없으면 0을 반환한다. 직접 스타일 ID가 없으면 반환된 ID 또는 새 ID를 할당한다.
            스타일을 GPU 텍스처에 기록하고 CPU 참조를 저장하며 업로드를 예약한 뒤 ID를 반환한다.

            object가 truthy인 경우 _normalizeStyle 단계의 결과를 현재 흐름에 반영한다.
            object가 truthy인 경우이고 styleId === undefined의 결과가 true인 경우 #allocateStyleId 단계의 결과를 현재 흐름에 반영한다.
            object가 truthy인 경우 #writeStyle 단계의 결과를 현재 흐름에 반영한다.

    getOutlineStyleForObject(object: Object3D, effective: boolean = true) -> object | null | undefined
        동작:
            대상이 없거나 effective가 false인데 직접 스타일이 없으면 null이다.
            effective이면 부모 체인에서 가까운 ID를, 아니면 직접 ID를 사용해 CPU 스타일을 반환한다. 미등록 기본 ID의 스타일은 undefined일 수 있다.

            object가 truthy인 경우 #getEffectiveStyleId 단계의 결과를 현재 흐름에 반영한다.

    setOutlineColorForObject(object: Object3D, color: ColorRepresentation, style: object = {}) -> number
        동작:
            style 복사본에 color를 덮어쓰고 스타일 설정 결과를 반환한다.

            setOutlineStyleForObject 단계의 결과를 현재 흐름에 반영한다.

    setOutlineStyleForInstance(instancedMesh: Object3D, instanceIndex: number, style: object = {}) -> number
        동작:
            유효 메시·인덱스를 확인한 뒤 새 간략 윤곽 옵션을 ID 할당 전에 검증·복사한다.
            메시·인덱스가 없거나 정수 변환 결과가 음수이면 0이다.
            인덱스별 스타일 ID를 만들고 스타일을 저장한다.
            간접 인스턴스는 데이터 텍스처, 일반 인스턴스는 instanceStyleId attribute에 기록한다. 저장 용량 밖이면 스타일 ID만 반환한다.

            !instancedMesh || instanceIndex === undefined || instanceIndex === null의 결과가 false인 경우이고 idx < 0의 결과가 false인 경우 _normalizeStyle 단계의 결과를 현재 흐름에 반영한다.
            !instancedMesh || instanceIndex === undefined || instanceIndex === null의 결과가 false인 경우이고 idx < 0의 결과가 false인 경우 #getOrCreateInstanceStyleIdMap 단계의 결과를 현재 흐름에 반영한다.
            !instancedMesh || instanceIndex === undefined || instanceIndex === null의 결과가 false인 경우이고 idx < 0의 결과가 false인 경우이고 styleId === undefined의 결과가 true인 경우 #allocateStyleId 단계의 결과를 현재 흐름에 반영한다.
            !instancedMesh || instanceIndex === undefined || instanceIndex === null의 결과가 false인 경우이고 idx < 0의 결과가 false인 경우 #writeStyle 단계의 결과를 현재 흐름에 반영한다.
            !instancedMesh || instanceIndex === undefined || instanceIndex === null의 결과가 false인 경우이고 idx < 0의 결과가 false인 경우이고 instancedMesh.instanceIndex가 truthy인 경우 #ensureInstanceStyleIdTexture 단계의 결과를 현재 흐름에 반영한다.
            !instancedMesh || instanceIndex === undefined || instanceIndex === null의 결과가 false인 경우이고 idx < 0의 결과가 false인 경우이고 instancedMesh.instanceIndex가 falsy인 경우 #ensureInstanceStyleIdAttribute 단계의 결과를 현재 흐름에 반영한다.

    getOutlineStyleForInstance(instancedMesh: Object3D, instanceIndex: number, effective: boolean = true) -> object | null | undefined
        동작:
            메시·인덱스가 없거나 음수이면 null이다. effective가 false인데 직접 스타일이 없으면 null이다.
            인덱스의 스타일 또는 기본 ID의 CPU 스타일을 반환하며 기본값은 undefined일 수 있다.

    setOutlineColorForInstance(instancedMesh: Object3D, instanceIndex: number, color: ColorRepresentation, style: object = {}) -> number
        동작:
            style 복사본에 color를 덮어쓰고 인스턴스 스타일 설정 결과를 반환한다.

            setOutlineStyleForInstance 단계의 결과를 현재 흐름에 반영한다.

    clearOutlineStyleForInstance(instancedMesh: Object3D, instanceIndex: number) -> void
        동작:
            해당 스타일의 간략 윤곽 사용 개수를 반납하고 해당 인덱스의 전환 이력을 무효화한다.
            메시·인덱스가 없으면 종료한다. 해당 texture 또는 attribute 항목을 0으로 바꾼다.
            직접 스타일이 있으면 매핑과 CPU 스타일을 제거하고 양수 ID를 재사용 목록에 반환한다.

            !instancedMesh || instanceIndex === undefined || instanceIndex === null의 결과가 false인 경우이고 !map의 결과가 false인 경우이고 styleId === undefined의 결과가 false인 경우 #invalidateFarPoints 단계의 결과를 현재 흐름에 반영한다.

    clearOutlineStyleForObject(object: Object3D) -> void
        동작:
            해당 스타일의 간략 윤곽 사용 개수를 반납하고 해당 객체의 전환 이력을 무효화한다.
            직접 스타일이 없으면 종료한다. 매핑과 CPU 스타일을 제거하고 양수 ID를 재사용 목록에 반환한다.

            object가 truthy인 경우이고 styleId === undefined의 결과가 false인 경우 #invalidateFarPoints 단계의 결과를 현재 흐름에 반영한다.

    override render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget, deltaTime: number, maskActive: boolean) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {selectedObjects, _oldClearColor, oldClearAlpha}
        동작:
            시간·검출 uniform을 갱신하고 렌더러의 autoClear·clearColor·clearAlpha를 보관한다.
            선택 캐시를 원래 등록으로 갱신하고 간략 윤곽 출력 목록을 파생한다. selectedObjects가 있으면 문맥을 만들고 기존 깊이 제외와 마스크 준비를 실행한 뒤 우선순위별 상세·간략 외곽선을 합성한다.
            대상이 없거나 프레임 처리가 실패해도 finally에서 clearColor·clearAlpha·autoClear를 복원한다. 실패는 그대로 전파하며 정상 처리 후 최종 화면 합성을 수행한다.

            #updateTime 단계의 결과를 현재 흐름에 반영한다.
            #updateEdgeUniforms 단계의 결과를 현재 흐름에 반영한다.
            #beginRender 단계의 결과를 현재 흐름에 반영한다.
            _updateSelectionCache 단계의 결과를 현재 흐름에 반영한다.
            #prepareFarPoints 단계의 결과를 현재 흐름에 반영한다.
            this.selectedObjects.length > 0의 결과가 true인 경우 #buildRenderContext 단계의 결과를 현재 흐름에 반영한다.
            this.selectedObjects.length > 0의 결과가 true인 경우 #renderDepthPass 단계의 결과를 현재 흐름에 반영한다.
            this.selectedObjects.length > 0의 결과가 true인 경우 #prepareMaskPass 단계의 결과를 현재 흐름에 반영한다.
            this.selectedObjects.length > 0의 결과가 true인 경우 #renderOutlineLayers 단계의 결과를 현재 흐름에 반영한다.
            #finalComposite 단계의 결과를 현재 흐름에 반영한다.

    #setInstancedMeshPrepareWithIndices(renderer: import('three').WebGLRenderer, selectedObject: import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh, indices: Array<number>) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {renderCamera}
        동작:
            활성·표시 중인 인스턴스의 가시성을 보관하고 지정한 인덱스만 마스크에 출력한 뒤 원래 가시성을 복원한다.

    #getRenderOrderFromStyleId(styleId: unknown) -> number
        동작:
            CPU 스타일의 renderOrder를 숫자로 변환하여 유한수가 아니면 0, 그렇지 않으면 정수화하여 1부터 3까지 보정한다.

    #getRenderOrderForInstance(instancedMesh: unknown, instanceIndex: unknown) -> number
        동작:
            메시가 없으면 0이다. 인덱스별 스타일 ID 또는 기본 0의 우선순위를 반환한다.

            instancedMesh가 truthy인 경우 #getRenderOrderFromStyleId 단계의 결과를 현재 흐름에 반영한다.

    #applyNearestFiltersToOutlineTargets() -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {renderTargetDepthBuffer, renderTargetMaskBuffer, renderTargetMaskDownSampleBuffer}
        동작:
            깊이·마스크·축소 마스크의 texture가 존재하는 경우 minFilter와 magFilter를 NearestFilter로 지정한다.

    #removeParentsOfInvalidMeshes() -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {selectedObjects, enabled}
        동작:
            dispose·sleep 또는 형상·재질·레이어 가시성이 유효하지 않은 자식을 가진 등록 루트를 제거하고 남은 등록 수로 enabled를 변경한다.

    #getOrCreateInstanceStyleIdMap(instancedMesh: unknown) -> Map<number, number>
        동작:
            메시에 해당하는 인덱스별 Map을 반환하며 없으면 생성하여 WeakMap에 보관한다.

    #ensureInstanceStyleIdAttribute(instancedMesh: unknown) -> InstancedBufferAttribute | undefined
        의존:
            InstancedBufferAttribute — 실제 렌더링·스타일·자원 의존; 생성자: {new InstancedBufferAttribute()}
        동작:
            geometry가 없으면 종료한다. 공유 메시의 용량에 맞는 스타일 ID attribute를 재사용하거나 이전 값을 복사해 새로 생성한다.

            instancedMesh.capacity → instancedMesh.count → instancedMesh.instanceMatrix.count 순서로 null 또는 undefined가 아닌 선행 값을 우선 사용한다.

    #ensureInstanceStyleIdTexture(instancedMesh: unknown) -> DataTexture | undefined
        의존:
            DataTexture — 실제 렌더링·스타일·자원 의존; 생성자: {new DataTexture()}
        동작:
            필요 용량에 맞는 최근접 RGBA 스타일 ID 텍스처를 재사용하거나 이전 값을 복사해 확장한다. 이전 텍스처는 해제한다.

            instancedMesh.capacity → instancedMesh.count 순서로 null 또는 undefined가 아닌 선행 값을 우선 사용한다.

    #getEffectiveStyleId(object: unknown) -> number
        동작:
            객체에서 부모로 올라가 처음 발견한 직접 스타일 ID를 반환하며 없으면 0이다.

    #allocateStyleId() -> number
        동작:
            반환된 ID가 있으면 재사용한다. 없으면 다음 ID를 증가시키고 스타일 용량을 확보한 뒤 반환한다.

            reused !== undefined의 결과가 false인 경우 #ensureStyleCapacity 단계의 결과를 현재 흐름에 반영한다.

    #ensureStyleCapacity(required: unknown) -> void
        의존:
            DataTexture — 실제 렌더링·스타일·자원 의존; 생성자: {new DataTexture()}
        동작:
            기존 용량이 충분하면 종료한다. 두 배씩 확장한 네 행 텍스처에 기존 값을 복사하고 이전 텍스처를 해제한 뒤 uniform 연결을 갱신한다.

            this._styleCapacity >= required의 결과가 false인 경우 #bindStyleUniformsToEdgeMaterial 단계의 결과를 현재 흐름에 반영한다.

    #writeStyle(styleId: number, style: UOutlineStyleOption) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {visibleEdgeColor, hiddenEdgeColor}
        동작:
            기존 해당 ID의 간략 윤곽 사용 여부를 반납하고 새 enabled 스타일이면 사용 스타일 수를 증가시킨다.
            색상 별칭의 우선순위를 반영하고 색상·두께·모드·속도·광채·위상을 네 행의 RGBA 바이트로 기록한다. CPU 보관소에는 입력 스타일 참조를 저장한다.
            가림 색상 행의 alpha에 style.farPoint.enabled가 참이면 255, 아니면 0을 기록하여 네 모드의 안정화 출력 여부를 구분한다. RGB와 기존 모드·두께 바이트는 보존한다.

            style.visibleEdgeColor → style.visibleColor → style.visibleColorHex → style.visibleColorHexString → style.color 순서로 null 또는 undefined가 아닌 선행 값을 우선 사용한다.
            style.hiddenEdgeColor → style.hiddenColor → style.hiddenColorHex → style.hiddenColorHexString → style.color 순서로 null 또는 undefined가 아닌 선행 값을 우선 사용한다.
            style.dashColor → style.dashEdgeColor → style.dashColorHex → style.dashColorHexString → style.dash → visValue 순서로 null 또는 undefined가 아닌 선행 값을 우선 사용한다.
            style.lineWidth → style.width → style.widthScale → style.thicknessScale → NaN 순서로 null 또는 undefined가 아닌 선행 값을 우선 사용한다.
            style.lineWidth → style.thickness → NaN 순서로 null 또는 undefined가 아닌 선행 값을 우선 사용한다.
            style.flowSpeed → style.dashSpeed → style.speed 순서로 null 또는 undefined가 아닌 선행 값을 우선 사용한다.
            style.bounceSpeed → style.speed 순서로 null 또는 undefined가 아닌 선행 값을 우선 사용한다.
            #ensureStyleCapacity 단계의 결과를 현재 흐름에 반영한다.
            #normalizeStyleColorInput 단계의 결과를 현재 흐름에 반영한다.

    #normalizeStyleColorInput(v: unknown) -> unknown
        동작:
            접두어 없는 3·6자리 16진 문자열에는 #을 붙이고 0x 접두어 문자열은 숫자로 바꾼다. 나머지는 입력값을 반환한다.

    #flushStyleTexturesIfNeeded() -> void
        동작:
            업로드 예약이 있으면 스타일 텍스처의 needsUpdate를 설정한 뒤 예약을 해제한다.

    #bindStyleUniformsToEdgeMaterial() -> void
        동작:
            검출 재질 uniform이 있으면 스타일 텍스처와 현재 용량을 연결한다.

    #createInstancedMaskMaterial() -> ShaderMaterial | undefined
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {prepareMaskMaterial}
        동작:
            기본 마스크 재질을 복제할 수 없으면 undefined다. 복제한 재질에 인스턴스 전용 표시를 설정하여 반환한다.

    #getMaskMaterials() -> Array<ShaderMaterial>
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {prepareMaskMaterial}
        동작:
            현재 존재하는 일반·인스턴스 마스크 재질을 배열로 반환한다.

    #getMaskMaterialFor(object: import('three').Object3D) -> ShaderMaterial
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {prepareMaskMaterial}
        동작:
            인스턴스 메시에는 전용 마스크 재질을 우선 반환하고 나머지는 일반 마스크 재질을 반환한다.

    #patchPrepareMaskMaterialForStyleId(material: import('three').ShaderMaterial) -> void
        동작:
            마스크 재질의 vertex·fragment 셰이더에 객체·인스턴스 스타일 ID와 forceVisible 기록을 추가한다. 간접 인스턴스는 텍스처, 일반 인스턴스는 attribute로 ID를 읽는다.

            material.uniforms.instanceStyleIdTexture가 falsy인 경우 instanceStyleIdTexture에 { value: null }를 저장한다.
            styleIdLo에 { value: 0 }를 저장한다.
            styleIdHi에 { value: 0 }를 저장한다.
            forceVisible에 { value: 0 }를 저장한다.
            material.uniforms.instanceStyleTexSize가 falsy인 경우 instanceStyleTexSize에 { value: 1 }를 저장한다.

    #setCurrentStyleId(styleId: unknown) -> void
        동작:
            ID를 0부터 65535까지 보정하여 하위·상위 바이트를 두 마스크 재질 uniform에 설정한다.

            #getMaskMaterials 단계의 결과를 현재 흐름에 반영한다.

    #setInstancedMeshPrepare(renderer: import('three').WebGLRenderer, selectedObject: unknown) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {renderCamera}
        동작:
            활성·표시 중인 인스턴스의 가시성을 보관하고 barrier 인덱스만 마스크에 출력한 뒤 원래 가시성을 복원한다.

    #setArrayMergedMeshPrepare(renderer: import('three').WebGLRenderer, selectedObject: unknown) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {renderCamera}
        동작:
            geometry 그룹 중 _pickMaterials에 해당하는 originIndex만 drawRange로 출력한다. 마지막에 원래 drawRange를 복원한다.

    #renderObjectToMask(renderer: import('three').WebGLRenderer, object: import('three').Mesh, styleId: number, originalMaterialOverride: import('three').Material | Array<import('three').Material> | undefined, instancedIndicesOverride: Array<number> | undefined) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {prepareMaskMaterial, renderCamera}
        동작:
            대상이 없으면 종료한다. 스타일 ID를 설정하고 일반 또는 전용 인스턴스 마스크 재질로 대체한다. 인스턴스·병합 부분 선택·일반 메시를 구분해 렌더링하고 finally에서 원래 재질과 일반 재질의 defines를 복원한다.
            모든 표현 상태에서 LODinfo.objects의 _parentLOD가 object인 공식 대체 메시의 재질을 lodMaterials에 보관하고 같은 마스크 재질로 임시 대체한다. 현재 LOD에서도 원본의 스타일 ID·선택 인덱스로 마스크를 출력하며 성공·실패 모두 finally에서 각 대체 메시의 원래 material 참조를 복원한다.

            object가 truthy인 경우 #setCurrentStyleId 단계의 결과를 현재 흐름에 반영한다.
            object가 truthy인 경우 #getMaskMaterialFor 단계의 결과를 현재 흐름에 반영한다.
            object가 truthy인 경우이고 object?.isInstancedMesh && object?.instanceIndex && maskMaterial?.uniforms?.instanceStyleIdTexture의 결과가 true인 경우 #ensureInstanceStyleIdTexture 단계의 결과를 현재 흐름에 반영한다.
            instancedIndicesOverride가 truthy인 경우이고 object가 truthy인 경우이고 object.isInstancedMesh && object.getBarrierInstances && object.getBarrierInstances() && object.getBarrierInstances().length > 0의 결과가 true인 경우 #setInstancedMeshPrepareWithIndices 단계의 결과를 현재 흐름에 반영한다.
            instancedIndicesOverride가 falsy인 경우이고 object가 truthy인 경우이고 object.isInstancedMesh && object.getBarrierInstances && object.getBarrierInstances() && object.getBarrierInstances().length > 0의 결과가 true인 경우 #setInstancedMeshPrepare 단계의 결과를 현재 흐름에 반영한다.
            Array.isArray(originalMaterial) && object._pickMaterials && object._pickMaterials.length > 0의 결과가 true인 경우이고 object가 truthy인 경우이고 object.isInstancedMesh && object.getBarrierInstances && object.getBarrierInstances() && object.getBarrierInstances().length > 0의 결과가 false인 경우 #setArrayMergedMeshPrepare 단계의 결과를 현재 흐름에 반영한다.

    #updateTime(deltaTime: unknown) -> void
        동작:
            기존 시간에 deltaTime을 더한다.

    #updateEdgeUniforms() -> void
        동작:
            예약된 스타일 텍스처 업로드와 검출 uniform 연결을 반영하고 존재하는 time uniform에 누적 시간을 지정한다.

            #flushStyleTexturesIfNeeded 단계의 결과를 현재 흐름에 반영한다.
            #bindStyleUniformsToEdgeMaterial 단계의 결과를 현재 흐름에 반영한다.

    #beginRender(renderer: unknown, maskActive: unknown) -> boolean
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {_oldClearColor, oldClearAlpha}
        동작:
            예약된 우선순위를 재계산하고 원래 autoClear·배경색·투명도를 저장한다. autoClear를 끄고 필요하면 stencil 검사를 끈 뒤 흰 배경을 지정하며 원래 autoClear를 반환한다.

            this._renderOrderCache.dirty가 truthy인 경우 #computeRenderOrderFlag 단계의 결과를 현재 흐름에 반영한다.

    #buildRenderContext() -> object
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {renderScene}
        동작:
            수집한 메시·스타일 ID, 우선순위 사용 여부, 원래 장면 background·overrideMaterial을 반환한다. 우선순위 사용이면 3·2·1 순서를 사용한다.

    #renderDepthPass(renderer: import('three').WebGLRenderer) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {renderScene, depthMaterial, renderTargetDepthBuffer, renderCamera}; 함수: {_changeVisibilityOfSelectedObjects()}
        동작:
            선택 캐시의 메시를 숨기고 전체 장면을 깊이 재질로 깊이 타깃에 렌더링한다. 오류는 정보 로그로 처리한다.

    #prepareMaskPass() -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {_visibilityCache}; 함수: {_changeVisibilityOfSelectedObjects(), _updateTextureMatrix()}
        동작:
            선택 메시의 원래 가시성을 복원하고 가시성 캐시를 비운 뒤 깊이 비교 textureMatrix를 갱신한다.

    #renderOutlineLayers(renderer: WebGLRenderer, readBuffer: WebGLRenderTarget, maskActive: boolean, context: object) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {renderCamera, renderTargetDepthBuffer, renderTargetMaskBuffer, prepareMaskMaterial, overlayMaterial, renderScene, usePatternTexture}
        동작:
            마스크 재질 상태를 보관한다. 문맥의 우선순위 3·2·1 또는 0마다 출력 전용 목록과 해당 간략 윤곽의 유무를 확인한다.
            상세 외곽선과 간략 윤곽이 모두 없으면 해당 우선순위를 생략한다. 하나라도 있으면 기존 마스크의 깊이·forceVisible 정책을 준비한다.
            외곽선이 있으면 마스크·축소·색상·검출·블러·합성을 기존 순서로 실행한다. 같은 우선순위 위치에서 그 뒤에 독립 간략 윤곽 배치를 출력한다.
            info.objects.length > 0이고 #farPointStyleCount > 0 && !this.usePatternTexture이면 기존 합성 뒤에 #farPoints._renderDetailed로 원본 마스크·스타일 텍스처·카메라·edgeStrength·stencil·기존 blending·누적 #time을 전달한다. 해당 우선순위의 활성 네 모드를 실제 실루엣과 모드별 효과로 합성하고 이어서 간략 윤곽을 출력한다.
            간략 윤곽에는 실제 prepareMaskMaterial.uniforms.forceVisible 값과 edgeStrength·기존 blending·깊이 텍스처·#time을 전달한다. 같은 우선순위 간략 윤곽끼리는 구성원 순서대로 합성한다.
            성공·실패 모두 finally에서 장면 background·overrideMaterial과 마스크 depthTest·depthWrite를 복원한다. 기존 forceVisible의 잔류 정책은 변경하지 않는다.

            #storeMaskMaterialState 단계의 결과를 현재 흐름에 반영한다.
            #buildInfo 단계의 결과를 현재 흐름에 반영한다.
            #setupMaskMaterial 단계의 결과를 현재 흐름에 반영한다.
            info.objects.length > 0의 결과가 true인 경우 #renderMask 단계의 결과를 현재 흐름에 반영한다.
            info.objects.length > 0의 결과가 true인 경우 #downSample 단계의 결과를 현재 흐름에 반영한다.
            info.objects.length > 0의 결과가 true인 경우 #applyPulseColors 단계의 결과를 현재 흐름에 반영한다.
            info.objects.length > 0의 결과가 true인 경우 #edgeDetect 단계의 결과를 현재 흐름에 반영한다.
            info.objects.length > 0의 결과가 true인 경우 #blur 단계의 결과를 현재 흐름에 반영한다.
            info.objects.length > 0의 결과가 true인 경우 #overlay 단계의 결과를 현재 흐름에 반영한다.
            #restoreMaskMaterialState 단계의 결과를 현재 흐름에 반영한다.

    #storeMaskMaterialState() -> object
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {prepareMaskMaterial}
        동작:
            일반 마스크 재질의 depthTest·depthWrite·forceVisible 값을 반환한다.

    #restoreMaskMaterialState(state: unknown) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {_selectionCache}
        동작:
            두 마스크 재질의 depthTest·depthWrite를 복원하고 선택 캐시를 비운다. 현재 forceVisible 복원 코드는 주석 상태다.

            #getMaskMaterials 단계의 결과를 현재 흐름에 반영한다.

    #buildInfo(context: object, renderOrder: number) -> object
        동작:
            간략 윤곽 프레임의 일반 메시·인스턴스 인덱스를 출력 목록에서만 제외한다. 원래 캐시와 등록을 수정하지 않으며 인스턴스 필터는 복사한다.
            objects로 registered Set을 만든다. _parentLOD의 LODinfo.objects에 포함되고 원본도 registered에 있으면 대체 메시의 독립 마스크 출력을 생략한다. 혼합·전체 상세·옵션 비활성 모두 원본의 선택 인덱스 필터와 렌더 순회에서 LOD를 출력한다. 원본 없이 별도로 등록한 대체 메시는 생략하지 않는다.
            현재 레이어와 같은 우선순위의 메시와 인스턴스 인덱스를 반환한다. 인스턴스 기본 우선순위는 3이며 목록을 프레임 캐시에 보관한다.

            !cache의 결과가 true인 경우이고 object?.isInstancedMesh && object.getBarrierInstances의 결과가 true인 경우 #getRenderOrderForInstance 단계의 결과를 현재 흐름에 반영한다.
            #getRenderOrderFromStyleId 단계의 결과를 현재 흐름에 반영한다.

    #setupMaskMaterial(hasRenderOrder: unknown, prevState: unknown) -> void
        동작:
            우선순위를 사용하면 두 마스크 재질의 depthTest·depthWrite를 끄고 forceVisible=1로 설정한다. 사용하지 않으면 깊이 설정을 저장값으로 되돌린다.

            #getMaskMaterials 단계의 결과를 현재 흐름에 반영한다.

    #renderMask(renderer: unknown, info: unknown, context: unknown) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {_changeVisibilityOfNonSelectedObjects, renderScene, prepareMaskMaterial, renderCamera, renderTargetDepthBuffer, textureMatrix, renderTargetMaskBuffer, _visibilityCache}
        동작:
            비선택 객체를 숨기고 두 마스크 재질에 카메라·깊이·투영 uniform을 연결한다. 타깃을 비우고 해당 객체·인덱스를 출력한 뒤 비선택 가시성과 장면 상태를 복원한다.

            #getMaskMaterials 단계의 결과를 현재 흐름에 반영한다.
            #renderObjectToMask 단계의 결과를 현재 흐름에 반영한다.

    #downSample(renderer: WebGLRenderer) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {_fsQuad, materialCopy, copyUniforms, renderTargetMaskBuffer, renderTargetMaskDownSampleBuffer, renderCamera, usePatternTexture}
        동작:
            #farPointStyleCount > 0 && !this.usePatternTexture이면 #farPoints._filterLegacyMask로 원본 마스크와 스타일 텍스처를 전달하여 일정 CSS 두께 대상만 축소 마스크에서 제외하고 종료한다. 원본 마스크는 보존한다.
            나머지는 전체 마스크를 기존 복사 재질로 축소 마스크 타깃에 복사한다.

    #applyPulseColors() -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {tempPulseColor1, visibleEdgeColor, tempPulseColor2, hiddenEdgeColor, pulsePeriod}
        동작:
            기본 가림·비가림 색상을 복사하고 pulsePeriod가 양수이면 시간에 따른 배율을 적용한다.

    #clearRenderTarget(renderer: unknown, target: unknown, color: unknown = 0x000000, alpha: unknown = 0) -> void
        의존:
            Color — 실제 렌더링·스타일·자원 의존; 생성자: {new Color()}
        동작:
            현재 렌더러 배경을 저장하고 지정 타깃을 지정 색·투명도로 비운 뒤 배경을 복원한다.

    #edgeDetect(renderer: unknown) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {_fsQuad, renderTargetMaskDownSampleBuffer, tempPulseColor1, tempPulseColor2, renderTargetEdgeBuffer1}
        동작:
            축소 마스크와 현재 크기·스타일·색상을 검출 재질에 전달하여 외곽선 타깃을 비우고 출력한다.

            #clearRenderTarget 단계의 결과를 현재 흐름에 반영한다.

    #blur(renderer: unknown) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {separableBlurMaterial2, _fsQuad, renderTargetEdgeBuffer1, renderTargetBlurBuffer2, renderTargetEdgeBuffer2}
        동작:
            외곽선 텍스처를 가로·세로 방향으로 두 번 블러하여 합성용 타깃에 기록한다.

            #clearRenderTarget 단계의 결과를 현재 흐름에 반영한다.

    #overlay(renderer: unknown, readBuffer: unknown, maskActive: unknown) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {_fsQuad, overlayMaterial, renderTargetMaskBuffer, renderTargetEdgeBuffer1, renderTargetEdgeBuffer2, patternTexture, usePatternTexture}
        동작:
            마스크·외곽선·패턴·광채 uniform을 연결하고 필요하면 stencil 검사를 켜 readBuffer에 합성한 뒤 끈다.

    #finalComposite(renderer: unknown, readBuffer: unknown) -> void
        의존:
            OutlinePass — 기반 렌더링 상태·자원과 복원 경로 재사용; 속성 읽기·쓰기: {renderToScreen, _fsQuad, materialCopy, copyUniforms}
        동작:
            renderToScreen이 false이면 종료한다. readBuffer를 기본 화면에 복사한다.

    #computeRenderOrderFlag() -> boolean
        동작:
            메시 스타일 또는 barrier 인스턴스 중 양수 renderOrder가 있으면 true, 없으면 false를 반환한다.

            #getRenderOrderFromStyleId 단계의 결과를 현재 흐름에 반영한다.
            object?.isInstancedMesh && object.getBarrierInstances의 결과가 true인 경우 #getRenderOrderForInstance 단계의 결과를 현재 흐름에 반영한다.
UOutlineFarPointRenderer 타입 정의
    _clear, _invalidate, _prepare, _render, _renderDetailed, _filterLegacyMask, _dispose: Function
        일반 패스가 프레임 구성·출력·대상 이력 무효화·소유 자원 해제를 호출하는 내부 연결 계약이다.
UOutlineFarPointMesh 타입 정의
    Mesh와 엔진 인스턴스 조회·부분 선택 필드를 함께 사용하는 내부 계약이다.
    _parentLOD와 LODinfo.objects는 인스턴스 원본과 공식 대체 메시의 소유 연결을 확인한다.
UOutlineFarPointMember 타입 정의
    object: UOutlineFarPointMesh
    root: Object3D
    styleId, order: number
    instanceIndex?: number
        원래 등록에서 파생한 개별 출력 구성원이다.
UOutlineFarPointVertex 타입 정의
    x, y, depth: number
        NDC 좌표와 양수 카메라 공간 깊이다.
UOutlineFarPointDraw 타입 정의
    x, y, depth, order, lineWidth: number
    vertices: Array<UOutlineFarPointVertex>
    effect: Array<number>
        GPU 바이트에서 읽은 모드·속도·광채 강도·흐름 밀도·비율·시간 오프셋·대시 RGB의 아홉 값이다.
    visibleColor, hiddenColor: Array<number>
        NDC 중심·양수 깊이·닫힌 윤곽 정점과 기존 GPU 색상을 보관한다.
UOutlineFarPointFrame 타입 정의
    objects: Set<UOutlineFarPointMesh>
    instances: Map<UOutlineFarPointMesh, Set<number>>
    points: Array<UOutlineFarPointDraw>
        마스크 출력 제외 목록과 닫힌 윤곽 목록이며 등록·깊이 목록과 독립이다.

```

## 4. 공통 처리 기준과 제약

```spec
스타일 텍스처는 최근접 필터를 사용하는 네 행의 RGBA 바이트 저장소다. 색상·폭·모드·흐름·광채 매개변수를 정규화해 기록한다. 일반 객체와 인스턴스는 각각 ID를 할당하며 해제된 ID를 재사용한다.
farPoint가 없는 기존 스타일은 입력 참조를 CPU 캐시에 보관하고 getter가 이를 반환하므로 외부 수정 가능성이 있다. farPoint가 있으면 스타일을 얕게 복사하고 간략 윤곽 옵션을 동결하지만 원래 객체·group 자체를 동결하지는 않는다. 직접 setter 없이 바꾸면 GPU 업로드와 일치하지 않을 수 있다.
인스턴스 마스크는 원래 활성·가시성 상태를 보관한 뒤 선택된 인덱스만 보이게 렌더링하고 복원한다. 깊이 제외는 기반 패스의 선택 캐시 단위다.
현재 모드·우선순위·패턴의 외부 변경과 선택 등록은 각 프레임 합성 결과에 영향을 준다.
간략 윤곽은 대표 극점의 볼록 경계이므로 오목한 부분·구멍은 생략한다. 스킨 인스턴스는 기존처럼 기본 position 형상을 사용하며 개별 포즈를 재계산하지 않는다. 일반 SkinnedMesh·모프·퇴화 형상은 상세 외곽을 유지한다. 최소 표시 크기는 간략 윤곽의 선 중심 경계 기준이며 실제 픽셀 경계는 선 두께·안티앨리어싱만큼 더 크다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
