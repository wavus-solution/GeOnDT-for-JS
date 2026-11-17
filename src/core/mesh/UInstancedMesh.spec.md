# UInstancedMesh 명세

> 상태: 구현 관찰 초안

## 1. 개요

InstancedMesh2의 슬롯·LOD·버퍼 관리를 바탕으로 GeOnDT 인스턴스 표시, 높이 갱신, 선택 색상과 외곽선, 밝기·대비·채도를 제어한다. 인스턴스 번호는 렌더링 슬롯이며 이 메시의 `getUid()`는 공유 렌더 객체의 uuid이다. 데이터 재로딩 식별자인 puid를 이 클래스에서 생성하거나 슬롯에 부여하지 않는다.

## 3. 정규 자연어 수도코드

```spec
UInstancedMeshCO extends U3dObjectCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        type?: string
            메시 분류
        capacity?: number
            기반 옵션의 용량; 생성자는 instanceLength로 덮어쓴다.
        castShadow?: boolean
            그림자 생성
        receiveShadow?: boolean
            그림자 수신
        layerName?: string
            소유 레이어 이름

InstancedMesh2Type 부분 타입 명세
    InstancedMesh2<THREE.BufferGeometry, THREE.Material | THREE.Material[], object>를 참조하는 구현 보조 별칭이다. 별도 데이터 필드를 추가하지 않는다.

UInstanceMaterial extends THREE.Material 부분 타입 명세
    이 명세에서 사용하는 필드:
        color?: THREE.Color
        _oriColor?: THREE.Color
        _isInstanceMaterial?: boolean
        map?: THREE.Texture

OriMatrixInfo_Param 부분 타입 명세
    이 명세에서 사용하는 필드:
        matrix: THREE.Matrix4
        position: THREE.Vector3
        quaternion: THREE.Quaternion
        scale: THREE.Vector3

UInstancedMesh extends InstancedMesh2 클래스 정의
    속성 — 집계와 소유
        geometry: TGeometry | undefined — 공유 기하
        material: TMaterial | undefined — 공유 단일·배열 재질
        name: string — opt.name 또는 UInstancedMesh
        castShadow: boolean — opt.castShadow의 boolean 값
        receiveShadow: boolean — opt.receiveShadow의 boolean 값
        frustumCulled: boolean = false
        uniformsTexture: object | null — 인스턴스별 효과 저장; 기반 클래스가 소유한다.
        matricesTexture: object | null — 슬롯 행렬 저장; 기반 클래스가 소유한다.
        static ALL_INSTANCES_COUNT: number = 0 — 살아 있는 메시의 용량 합
        static VISIBLE_INSTANCES_COUNT: number = 0 — 표시 허용 메시의 활성·가시 슬롯 수
        static LIVE_INSTANCED_MESHES: Set<UInstancedMesh> — 생성 후 미해제 메시 집합
        isUInstancedMesh: boolean — 생성 시 true
        _ulayername: string | undefined
        _utype: string — 기본 건물 분류
        _visibilityEnabled: boolean — 전역 가시 개수 집계에 포함할지 여부
        _objectName: string | undefined — 컴포넌트 표시 이름의 접두어
        _name: string | undefined
        _curUpdateDate: number | undefined
        _lastUpdateDate: number | undefined
        _meta: UMeta | null — U3dObject에서 혼합되는 메타정보
    속성 — 선택·표시 복원
        _opacityMap: Map<number, number> — 1 미만의 슬롯 불투명도
        _colorMap: Map<number, THREE.Color> — 적용한 선택 색상
        _oriColorMap: Map<number, THREE.Color> — 첫 선택 전 슬롯 색상
        _oriOpacityMap: Map<number, number> — 첫 변경 전 슬롯 불투명도
        _matrixMap: Map
        _oriMatrixMap: Map
        _barrierSet: Set | undefined
        _overrideColorInstanceIds: Set<number> — 텍스처 무시 효과가 켜진 슬롯
        _overrideColorSupportPrepared: boolean | undefined
        _overrideColorSupportEnabled: boolean | undefined
        _colorAdjustmentSupportEnabled: boolean = false
        _restoringOpacity: boolean | undefined — 복원 중 원본 덮어쓰기 방지
        _useDynamicCapcity: boolean = false
        _maxCapacity: number | undefined
        _capacityResizeStats: object — 재할당 횟수·이전/신규 용량·현재/최대 저장 바이트

    constructor(geometry: TGeometry, material: TMaterial, instanceLength: number, opt?: UInstancedMeshCO)
        인터페이스: geometry와 material을 공유하여 instanceLength 슬롯의 렌더 메시를 만든다.
        의존:
            InstancedMesh2 — 용량 지정 초기화·색상 텍스처; 생성자: {new InstancedMesh2()}; 함수: {initColorsTexture()}; 속성 읽기: {capacity}
            THREE.Object3D — 이 클래스가 소유하는 외곽선 자료의 보관 컨테이너; 속성 쓰기: {userData.edgeLines, userData.barrierInstances, userData.barrierMaterial}
            U3dObject — 공통 객체 설정 생성; 생성자: {new U3dObject()}
            assign — 공통 객체 속성 혼합; 함수: {assign()}
            defaultValue — 분류 기본값 결정; 함수: {defaultValue()}
            UDEF — 기본 메시 분류; 상수: {UMESH_TYPE._building}
        동작:
            opt가 falsy이면 빈 객체를 사용한다. 복사 옵션에 capacity=instanceLength와 그림자 false를 넣어 부모를 초기화한다.
            셰이더 캐시 키를 연결하고 U3dObject 속성을 혼합한다. 이름·분류·그림자는 사용자 옵션으로 반영하고 frustumCulled=false로 둔다.
            색상·불투명도·행렬 복원 사전, userData의 edgeLines·barrierInstances·barrierMaterial을 초기화한다.
            색상 텍스처와 선택 색상 지원을 준비한다. 용량 합과 생존 집합에 자신을 등록하고 동적 용량·상한·재할당 통계를 초기화한다.
    getUid() -> string
        의존: THREE.Object3D — 현재 렌더 객체 식별값; 속성 읽기: {uuid}
        동작: 현재 공유 렌더 메시의 uuid를 반환한다.
    static countRenderedInstances(mesh: UInstancedMesh<any, any, number, UInstancedMeshCO>) -> number
        동작: availabilityArray가 없으면 0이다. 배열의 슬롯 수와 유한한 _instancesArrayCount 중 작은 범위에서 가시·활성 값이 모두 엄격하게 true인 슬롯 수를 반환한다.
    static syncGlobalInstanceCounts() -> {capacity: number, active: number, visible: number, meshCount: number}
        동작:
            생존 집합에서 없거나 disposed=true인 객체를 제외한다. 유한한 capacity와 활성 슬롯 수를 누적한다.
            _visibilityEnabled가 false가 아닌 메시의 렌더 슬롯 수를 누적한다. 전역 용량·가시 개수를 덮어쓰고 네 집계를 반환한다.
    override dispose() -> void
        의존: InstancedMesh2 — 기반 자원 해제와 집계 입력; 함수: {dispose()}; 속성 읽기: {_disposed, availabilityArray, capacity}
        동작: 이미 해제되었으면 반환한다. 배열 전체에서 활성·가시 슬롯을 세어 표시 허용 상태일 때 전역 가시 개수에서 빼고 0 아래로 내리지 않는다. 이 집계 중 예외는 무시한다. 부모 해제 후 용량을 빼고 생존 집합에서 제거한다.
    getRenderedInstancesCount() -> number
        동작: 현재 메시의 활성·가시 슬롯 수를 반환한다.
    getActiveInstancesCount() -> number
        의존: InstancedMesh2 — 활성 슬롯 저장 범위; 속성 읽기: {availabilityArray, _instancesArrayCount}
        동작: 배열 슬롯 수와 유한한 _instancesArrayCount 중 작은 범위에서 활성 값이 엄격하게 true인 슬롯 수를 반환한다.
    setVisibilityEnabled(enabled: boolean) -> this
        동작: false만 비활성으로 취급한다. 현재 상태와 같으면 자신을 반환한다. 렌더 슬롯 수를 전역 가시 개수에 더하거나 빼고 0 아래로 내리지 않으며 상태를 저장한다.
    getLayerName() -> string | undefined
        동작: _ulayername을 반환한다. [확인 Q-001]
    setLayerName(name: string) -> void
        동작: _ulayername에 입력 이름을 저장한다. [확인 Q-001]
    getUType() -> string
        동작: _utype을 반환한다.
    setUType(type: string) -> void
        동작: _utype을 저장한다.
    getComponentNameAt(idx: number) -> string
        동작: _objectName과 밑줄, idx+1을 연결한 문자열을 반환한다.

    override resizeBuffers(capacity: number) -> this
        의존: InstancedMesh2 — 버퍼 용량 변경과 저장 바이트 집계; 함수: {resizeBuffers()}; 속성 읽기: {_capacity, matricesTexture, positionsLowTexture, colorsTexture, uniformsTexture, instanceIndex}
        동작: 이전 용량을 전역 합에서 빼고 부모 재할당 뒤 실제 새 용량을 더한다. 용량이 달라졌을 때만 재할당 횟수·용량 전후값·행렬/저위치/색상/uniform/index 저장 바이트와 최대 바이트를 갱신하고 자신을 반환한다.
    setDynamicCapacity(value: boolean) -> this
        동작: value가 true이고 유한한 상한이 없을 때만 동적 용량을 켜고 자신을 반환한다.
    getDynamicCapacity() -> boolean
        동작: 동적 용량 상태가 엄격하게 true인지 반환한다.
    setMaxCapacity(value: number | string | undefined | null) -> this
        동작: Number 변환값이 유한한 양수이면 floor한 값을, 아니면 undefined를 저장한다. 저장값이 유한하면 동적 용량을 끄고 자신을 반환한다. 양수 소수 입력은 내림 뒤 0이 될 수 있다.
    getMaxCapacity() -> number | undefined
        동작: 저장된 최대 용량을 반환한다.
    override setVisibilityAt(id: number, visible: boolean) -> void
        의존: InstancedMesh2 — 슬롯의 이전 상태·새 가시 상태; 함수: {getVisibilityAt(), getActiveAt(), setVisibilityAt()}
        동작: 가시 상태가 같으면 반환한다. 집계 허용 상태이고 이전 활성 값이 true이면 visible에 따라 전역 가시 수를 1 증감한다. 이후 부모에 가시 상태를 반영한다.
    override setActiveAt(id: number, active: boolean) -> void
        의존: InstancedMesh2 — 슬롯 상태 조회·활성 변경; 함수: {getActiveAt(), getVisibilityAt(), setActiveAt()}
        동작: 활성 상태가 같으면 반환한다. 집계 허용 상태이고 이전 가시 값이 true이면 active에 따라 전역 가시 수를 1 증감하고 부모에 활성 상태를 반영한다.
    override setActiveAndVisibilityAt(id: number, value: boolean) -> void
        의존: InstancedMesh2 — 슬롯의 가시·활성 일괄 변경; 함수: {getVisibilityAt(), getActiveAt(), setActiveAndVisibilityAt()}
        동작: 이전 두 상태가 모두 true인지와 새 value가 true인지를 비교하여 집계 허용 시 전역 가시 수를 보정한다. 부모에 두 상태를 함께 반영한다.

    _prepareOverrideColorSupport() -> void
        동작: 준비되었으면 반환한다. 준비 완료·효과 비활성으로 설정하고 재질 컴파일 연결만 마련한다.
    _enableOverrideColorSupport() -> void
        의존: InstancedMesh2 — 표시 효과 저장소; 속성 읽기: {uniformsTexture}
        동작:
            준비와 새 재질 패치를 수행한다.
            효과가 이미 활성이고 uniform 텍스처가 있으면 새 재질이 패치된 경우만 재컴파일을 요청하고 반환한다.
            아니면 효과를 활성화하고 uniform을 준비해 재질 재컴파일을 요청한다.
    _ensureOverrideColorSupport() -> void
        동작: 선택 색상 효과를 활성화한다.
    _enableColorAdjustmentSupport() -> void
        의존: InstancedMesh2 — 색상 조정 저장소; 속성 읽기: {uniformsTexture}
        동작: 준비와 새 재질 패치 후, 색상 조정이 이미 활성이고 uniform이 있으면 새 패치가 있을 때만 재컴파일한다. 아니면 조정을 활성화하고 uniform·재컴파일을 준비한다.
    _setInstanceMaterialsNeedsUpdate() -> void
        의존:
            InstancedMesh2 — LOD 목록; 속성 읽기: {LODinfo}
            THREE.Material — 셰이더 재컴파일 요청; 속성 쓰기: {needsUpdate}
        동작: LODinfo.objects가 배열이면 그 목록, 아니면 자신을 대상으로 단일·배열 재질의 needsUpdate를 true로 바꾼다.
    _patchInstanceAppearanceCacheKey(mesh: InstancedMesh2Type) -> void
        의존:
            InstancedMesh2 — 셰이더 프로그램 캐시 키 확장; 속성 읽기·쓰기: {_customProgramCacheKey}
            THREE.Object3D — 패치 소유자; 속성 읽기: {id}
        동작: 자신의 id로 이미 연결되었거나 기반 키 함수가 없으면 반환한다. 기반 함수 결과에 색상 조정·선택 색상 활성 비트를 붙이는 함수로 교체하고 소유 id를 기록한다.
    _ensureInstanceAppearanceUniforms() -> void
        의존: InstancedMesh2 — 인스턴스별 uniform 텍스처 생성; 함수: {initUniformsPerInstance()}; 속성 읽기: {uniformsTexture}
        동작: uniform 텍스처가 이미 있으면 반환하고, 없으면 선택 모드·불투명도·색상·텍스처 무시값과 밝기·대비·채도 offset 스키마를 등록한다.
    _isValidInstanceId(instanceId: number) -> boolean
        의존: InstancedMesh2 — 슬롯 용량; 속성 읽기: {capacity}
        동작: 정수이고 0 이상이며 capacity 미만인지 반환한다.
    _setColorAdjustmentAt(instanceId: number, uniformName: string, value: number) -> InstancedMesh2Type
        의존: InstancedMesh2 — uniform 기록; 함수: {setUniformAt()}
        동작: 슬롯이 유효하지 않거나 값이 유한하지 않으면 변경 없이 자신을 반환한다. 조정을 활성화하고 value-1을 해당 uniform에 저장한다.
    _getColorAdjustmentAt(instanceId: number, uniformName: string) -> number
        의존: InstancedMesh2 — uniform 조회; 함수: {getUniformAt()}; 속성 읽기: {uniformsTexture}
        동작: 슬롯이 유효하지 않으면 NaN, uniform 텍스처가 없으면 1, 있으면 uniform+1을 반환한다.
    setBrightnessAt(instanceId: number, value: number) -> InstancedMesh2Type
        동작: ez_brightnessOffset을 대상으로 밝기를 설정하고 자신을 반환한다.
    getBrightnessAt(instanceId: number) -> number
        동작: ez_brightnessOffset에 해당하는 밝기를 반환한다.
    setContrastAt(instanceId: number, value: number) -> InstancedMesh2Type
        동작: ez_contrastOffset을 대상으로 대비를 설정한다.
    getContrastAt(instanceId: number) -> number
        동작: ez_contrastOffset에 해당하는 대비를 반환한다.
    setSaturationAt(instanceId: number, value: number) -> InstancedMesh2Type
        동작: ez_saturationOffset을 대상으로 채도를 설정한다.
    getSaturationAt(instanceId: number) -> number
        동작: ez_saturationOffset에 해당하는 채도를 반환한다.
    resetColorAdjustmentAt(instanceId: number) -> InstancedMesh2Type
        의존: InstancedMesh2 — 등록된 uniform 초기화; 함수: {setUniformAt()}; 속성 읽기: {uniformsTexture._uniformMap}
        동작: 슬롯이 유효하지 않거나 uniform 텍스처가 없으면 자신을 반환한다. 밝기·대비·채도의 Offset와 Delta 여섯 이름 중 실제 등록된 항목만 0으로 바꾼다.
    addInstance(id: number, onCreation?: function(InstancedEntity, number): void) -> InstancedMesh2Type
        의존: InstancedMesh2 — 슬롯 생성·생성 콜백 전달; 함수: {prototype.addInstance.call()}
        동작: 재사용 슬롯의 색상 조정을 초기화하고 부모 생성 결과를 반환한다.
    removeInstances(...ids: number[]) -> InstancedMesh2Type
        의존: InstancedMesh2 — 슬롯 반환; 함수: {prototype.removeInstances.call()}
        동작: 모든 지정 슬롯의 색상 조정을 초기화하고 부모 제거 결과를 반환한다.
    addLOD(geometry: THREE.BufferGeometry, material: THREE.Material | Array<THREE.Material>, distance: number = 0, hysteresis: number = 0) -> InstancedMesh2Type
        의존: InstancedMesh2 — LOD 추가; 함수: {prototype.addLOD.call()}; 속성 읽기: {LODinfo.objects}
        동작: 부모에 LOD를 추가하고 전체 LOD 메시의 캐시 키를 연결한다. 새 재질이 패치되었고 효과 중 하나가 활성일 때 재컴파일을 요청한 뒤 자신을 반환한다.
    _patchMaterialsForOverrideColor() -> boolean
        의존:
            InstancedMesh2 — LOD 목록·uniform 저장소; 속성 읽기: {LODinfo, uniformsTexture}
            THREE.Object3D — 패치 소유자; 속성 읽기: {id}
            THREE.Material — 재질 종류·컴파일 콜백; 속성 읽기·쓰기: {onBeforeCompile, userData}; 콜백: {onBeforeCompile()}
            GBrightnessBlendingShader.INTERNAL — 밝기 셰이더; 함수: {getBrightnessFragmentShader()}
            GContrastBlendingShader.INTERNAL — 대비 셰이더; 함수: {getContrastFragmentShader()}
            GSaturationBlendingShader.INTERNAL — 채도 셰이더; 함수: {getSaturationFragmentShader()}
        동작:
            LODinfo.objects 배열 또는 자신에 속한 재질들을 검사한다. 없거나 이미 같은 소유자로 패치되었거나 ShaderMaterial이면 건너뛴다.
            기존 패치 연결의 바닥 onBeforeCompile을 찾아 재사용하고, 재질에 인스턴스 재질 표시와 새 컴파일 콜백·소유 id를 기록한다.
            콜백은 기존 컴파일 함수를 먼저 호출한다. shader·fragmentShader·uniform 텍스처가 없거나 두 효과가 모두 비활성이면 끝낸다.
            색상 조정이 활성이고 아직 삽입되지 않았다면 밝기→대비→채도 코드를 tonemapping 앞, 없으면 마지막 닫는 괄호 앞에 넣는다.
            선택 색상 효과가 활성이고 아직 삽입되지 않았다면 모드>0.5에서 텍스처 무시 시 지정 색상·불투명도로 대체하고, 아니면 원 색상·alpha에 곱하는 코드를 넣는다.
            삽입 위치는 premultiplied_alpha, dithering, colorspace, tonemapping, output 순으로 첫 존재 지시문 뒤이며 없으면 마지막 괄호 앞이다. 새 패치가 하나라도 있으면 true를 반환한다.

    setMatrixAtFast(id: number, matrix: THREE.Matrix4) -> void
        의존: InstancedMesh2 — 행렬·저위치·BVH 동기화; 함수: {_updatePositionLowAt(), matricesTexture.enqueueUpdate(), bvh.move()}
        동작: 행렬 텍스처가 없으면 반환한다. id의 16개 값에 행렬을 복사하고 translation xyz의 저위치, 텍스처 갱신 큐와 BVH를 갱신한다.
    override setMatrixAt(id: number, matrix: THREE.Matrix4) -> void
        의존:
            InstancedMesh2 — 기본 행렬 적용; 함수: {prototype.setMatrixAt.call()}
            THREE.Object3D — 외부 외곽선 연결을 보관하는 컨테이너; 속성 읽기: {userData}
        동작: 부모에 행렬을 적용한 뒤 barrier 재질 또는 외부 barrierAttribute가 있으면 외곽선 행렬도 맞춘다.
    override initSkeleton(object: THREE.SkinnedMesh, disableMatrixAutoUpdate?: boolean) -> void
        의존: InstancedMesh2 — 스켈레톤·스킨 데이터 연결; 함수: {initSkeleton(), bindData()}
        동작: object.skeleton을 부모에 초기화한 다음 원 object의 스킨 데이터를 바인딩한다.
    createBarrierAttribute() -> void
        의존:
            THREE — 외곽선 슬롯 속성 생성; 생성자: {new InstancedBufferAttribute()}; 함수: {BufferGeometry.setAttribute()}
            InstancedMesh2 — 슬롯 용량; 속성 읽기: {capacity}
        동작: geometry가 없으면 반환한다. capacity 길이 배열을 -1로 채워 항목 크기 1의 instanceBarrier 속성을 만든다.
    getBarrierAttribute() -> THREE.InstancedBufferAttribute | undefined
        의존: THREE.BufferGeometry — 외곽선 속성 조회; 함수: {getAttribute()}
        동작: geometry가 있으면 instanceBarrier 속성을 반환하고 없으면 undefined이다.
    createInstancedMatrixAttribute() -> void
        의존:
            THREE — 외곽선 행렬 속성 생성; 생성자: {new InstancedBufferAttribute()}; 함수: {BufferGeometry.setAttribute()}
            InstancedMesh2 — 슬롯 용량; 속성 읽기: {capacity}
        동작: geometry가 없으면 반환한다. capacity×16 배열을 0으로 채워 항목 크기 16의 instanceBarrierMatrix 속성을 만든다.
    getInstancedMatrixAttribute() -> THREE.InstancedBufferAttribute | undefined
        의존: THREE.BufferGeometry — 외곽선 행렬 조회; 함수: {getAttribute()}
        동작: geometry의 instanceBarrierMatrix를 반환한다.
    addBarrierInstance(idx: number, setAttribute: boolean = true) -> void
        의존: THREE.Object3D — 이 클래스가 초기화한 외곽선 선택 목록의 보관 컨테이너; 속성 읽기·쓰기: {userData.barrierInstances}
        동작: setAttribute이면 기존 barrier 속성의 idx를 1로 바꾸고 갱신 표시 후 행렬을 맞춘다. barrierInstances에 없는 idx만 추가한다.
    setBarrierMatrix(idx: number) -> void
        의존:
            InstancedMesh2 — 슬롯 행렬 조회; 함수: {getMatrixAt()}
            THREE — 슬롯 행렬 복사와 외곽선 연결 컨테이너; 생성자: {new Matrix4()}; 함수: {Matrix4.toArray()}; 속성 읽기: {userData}
        동작: 슬롯 행렬을 읽어 자체 외곽선 행렬 속성과 userData.barrierAttribute.matrix가 있으면 각각 idx×16 위치에 쓰고 needsUpdate=true로 만든다.
    removeBarrierInstance(idx: number, setAttribute: boolean = true) -> void
        의존: THREE.Matrix4 — 제거 슬롯의 단위 행렬; 생성자: {new Matrix4()}; 함수: {toArray()}
        동작:
            setAttribute이면 barrier 값은 -1, 해당 행렬은 단위 행렬로 설정하고 갱신한다.
            선택 목록이 이미 비어 있으면 목록·재질 제거를 하지 않는다. 비어 있지 않으면 idx를 찾아 제거하고, 그 결과 목록이 비었고 setAttribute이면 외곽선 재질도 해제한다.
    setBarrierMaterial(material: THREE.Material) -> void
        의존: THREE — 재질·기하 그룹 관리; 함수: {Material.dispose(), BufferGeometry.clearGroups(), BufferGeometry.addGroup()}; 속성 읽기·쓰기: {userData.barrierMaterial}
        동작:
            입력이 없으면 반환한다. 기존 barrier가 없으면 재질 목록 맨 앞에 넣고 원래 geometry groups를 저장한 뒤 각 재질에 전체 범위 그룹을 만든다.
            기존 barrier가 있고 배열 재질이면 해당 항목을 새 재질로 교체하고 이전 barrier를 해제한다. 단일 재질이면 새 배열·전체 범위 그룹을 구성한다. userData.barrierMaterial을 새 값으로 저장한다.
    removeBarrierMaterial() -> void
        의존: THREE — 기하 속성·재질 해제; 함수: {BufferGeometry.clearGroups(), BufferGeometry.deleteAttribute(), Material.dispose()}; 속성 쓰기: {userData.barrierMaterial}
        동작: barrier가 없으면 반환한다. 재질 배열에서 제거한 뒤 한 개만 남으면 단일 재질로 바꾸고 groups를 비우며, 여러 개면 원래 groups를 복원한다. 저장 groups와 두 barrier 속성을 제거하고 재질을 해제해 참조를 undefined로 만든다.
    getBarrierMaterial() -> THREE.Material | undefined
        의존: THREE.Object3D — 외곽선 재질 보관 컨테이너; 속성 읽기: {userData.barrierMaterial}
        동작: userData.barrierMaterial을 반환한다.
    getBarrierInstances() -> Array<number>
        의존: THREE.Object3D — 외곽선 선택 목록 보관 컨테이너; 속성 읽기: {userData.barrierInstances}
        동작: userData.barrierInstances 원본 배열을 반환한다.
    getEdgeLine(idx: number) -> THREE.Object3D | undefined
        의존: THREE.Object3D — 슬롯별 외곽선 보관 컨테이너; 속성 읽기: {userData.edgeLines}
        동작: userData.edgeLines 사전에서 idx 값을 반환한다.
    batchUpdateHeight(updateList: Set<number> = new Set(), updates: Map<number, number> = new Map()) -> void
        의존:
            defined — 높이 존재 확인; 함수: {defined()}
            InstancedMesh2 — GPU/BVH 갱신; 함수: {_updatePositionLowZAt(), matricesTexture.enqueueUpdate(), bvh.move()}; 속성 읽기·쓰기: {instances, matricesTexture._data}
        동작: 목록을 복사하여 순회한다. 높이가 없으면 건너뛴다. instances가 있으면 해당 position.z를 바꾸고 행렬 배열의 id×16+14, 저위치 z, 텍스처 큐와 BVH를 갱신한다.

    setColorAll(color: THREE.Color | string | number) -> void
        의존:
            THREE — 색상 변환·재질 원색 보존; 생성자: {new Color()}; 함수: {Color.clone(), Color.copy()}
            InstancedMesh2 — 텍스처 생성; 함수: {initColorsTexture()}; 속성 읽기: {colorsTexture}
        동작: Color로 변환하고 colorsTexture가 null이면 초기화한다. 직접 재질 목록의 원래 color를 최초 한 번 _oriColor에 복제하고 입력색을 적용한다.
    restoreColorAll() -> void
        의존: THREE.Material — 저장 재질색 복원; 속성 읽기·쓰기: {color, _oriColor}
        동작: 직접 재질 목록에 _oriColor가 있으면 색상을 복원하고 저장값을 지운다.
    setScaleAll(scaleVector: THREE.Vector3 = new THREE.Vector3(1,1,1)) -> void
        의존:
            InstancedMesh2 — 인스턴스 변환 콜백 적용; 함수: {updateInstances()}
            THREE.Object3D — 자식 메시 목록; 속성 읽기: {children}
        동작: 자신과 updateInstances 함수를 가진 모든 자식의 슬롯 scale을 입력값으로 복사한다.
    setScaleList(indexList: Array<number>, scaleVector: THREE.Vector3 | number | {x: number, y: number, z: number} = new THREE.Vector3(1, 1, 1)) -> void
        의존:
            defined — 입력 존재 확인; 함수: {defined()}
            THREE — 결과 크기 벡터 생성과 자식 열람; 생성자: {new Vector3()}; 속성 읽기: {children}
            InstancedEntity — 슬롯 행렬 갱신; 함수: {updateMatrix()}
        동작: 목록이 없거나 비면 반환한다. 숫자는 xyz에 반복하고 일반 xyz 객체는 각 성분을 사용한다. Vector3 입력일 때는 결과 벡터를 복사하지 않아 (0,0,0)이 남는다. 자신과 자식들의 지정 인스턴스 scale을 결과 벡터로 바꾸고 행렬을 갱신한다. [확인 Q-002]
    setVisibleList(indexList: Array<number>, visible: boolean) -> void
        의존:
            InstancedMesh2 — 자식 슬롯 상태와 자동 갱신; 함수: {setActiveAndVisibilityAt()}; 속성 쓰기: {autoUpdate}
            THREE.Object3D — 자식 목록·이전 결과 보관 컨테이너; 속성 읽기·쓰기: {children, userData}
            defined — 입력 존재 확인; 함수: {defined()}
        동작: 목록이 없거나 비면 반환한다. Boolean 변환한 visible을 자신과 자식의 지정 슬롯 활성·가시에 반영한다. 각 메시의 userData.lastResult를 지우고 autoUpdate=true로 만든다.
    override setOpacityAt(instanceId: number, opacity: number) -> void
        의존:
            THREE.MathUtils — 범위 제한; 함수: {clamp()}
            InstancedMesh2 — 원본 조회·부모 반영; 함수: {getOpacityAt(), setOpacityAt()}
            defined — 슬롯 번호 존재 판정; 함수: {defined()}
        동작:
            opacity를 0~1로 제한한다. 복원 중이 아니고 instanceId가 있으며 원본이 아직 없을 때 기존 opacity를 저장한다.
            1 미만이면 해당 슬롯을 _opacityMap에 넣고 LOD 재질을 투명으로 바꾼다. 그 외에는 해당 슬롯 기록이 있을 때만 기록을 제거하고, 그 결과 사전이 비었을 때 재질을 불투명으로 바꾼다. _keepTransparent 재질은 변경하지 않는다.
            부모 슬롯 opacity에 최종 값을 반영한다.
    setVisible(instanceIdx: number, visible: boolean) -> void
        의존: THREE.Object3D — 자식 메시와 외부 외곽선 저장소; 속성 읽기·쓰기: {children, userData.barrierAttribute}
        동작: 자신의 슬롯 가시 상태를 바꾼다. 자체·외부 barrier 속성의 해당 값이 -1이 아니면 1/0으로 맞춰 갱신한다. 자식에 setVisibilityAt이 있으면 같은 슬롯 가시 상태를 전달한다.
    pickMaterial(instanceId: number, color: THREE.Color | string | number, opacity: number = 1, opt?: boolean | object) -> void
        의존:
            defined — 슬롯 번호·옵션 존재 판정; 함수: {defined()}
            THREE — 색상 생성과 선택 기록 컨테이너; 생성자: {new Color()}; 속성 쓰기: {userData}
            InstancedMesh2 — 원색 조회·선택색과 uniform 반영; 함수: {getColorAt(), setColorAt(), uniformsTexture.setUniformAt(), uniformsTexture.enqueueUpdate()}
        동작:
            instanceId가 없으면 반환한다. opt boolean 또는 excludeTexture→ignoreTexture→반전 useTexture 순으로 텍스처 무시 여부를 정한다.
            텍스처 무시이면 효과와 재질 패치를 활성화한다.
            인스턴스 메시일 때 재질 원색을 백업하고 슬롯 원색을 최초 한 번 보관한다. 새 색상·opacity를 반영한다.
            uniform이 있으면 텍스처 무시 경로에 모드·색상·opacity·무시값을 기록하고 슬롯 집합에 넣는다. 기존 무시 슬롯을 일반 선택으로 바꾸면 모드·opacity·무시값을 초기화하고 집합에서 뺀다. pickedInfo에 슬롯 번호를 저장한다.
    pickMaterialList(indexList: Array<number>, color: THREE.Color | string | number, opacity: number = 1, opt?: boolean | object) -> void
        의존:
            defined — 목록·옵션 존재 판정; 함수: {defined()}
            THREE — 색상 변환; 생성자: {new Color()}
            InstancedMesh2 — 슬롯 원색·선택 uniform; 함수: {getColorAt(), setColorAt(), uniformsTexture.setUniformAt(), uniformsTexture.enqueueUpdate()}
        동작:
            빈 목록이면 반환한다. boolean 또는 excludeTexture→ignoreTexture→반전 useTexture 순으로 무시 여부를 정하고 필요하면 효과를 준비한다.
            색상을 한 번 변환하고 재질을 백업한다. 각 슬롯 원색을 최초 보관하고 선택색·opacity를 적용한다.
            각 슬롯의 텍스처 무시 uniform과 집합을 단일 선택과 같은 기준으로 설정·해제한다. pickedInfo는 변경하지 않는다.
    restoreMaterial(instanceId?: number) -> void
        의존:
            defined — 단일·전체 복원 판정; 함수: {defined()}
            InstancedMesh2 — 색상·uniform 복원; 함수: {setColorAt(), uniformsTexture.setUniformAt(), uniformsTexture.enqueueUpdate()}
            THREE.Object3D — 선택 기록을 보관하는 컨테이너; 속성 쓰기: {userData}
        동작:
            효과가 활성 또는 무시 슬롯이 있으면 재질 패치를 준비한다.
            번호가 없으면 저장한 모든 색상·opacity를 복원하고 세 복원 사전을 비운다. 번호가 있으면 저장색 또는 흰색, 저장opacity 또는 1을 복원하여 해당 기록만 지운다. opacity 복원 중에는 백업을 덮어쓰지 않는다.
            단일 복원은 해당 uniform 모드·opacity·무시값을 초기화한다. 전체 복원은 남은 무시 슬롯의 uniform을 모두 초기화하고 집합을 비운다.
            원색 사전이 비었으면 재질 원색도 복원한다. 복원 대상 번호나 남은 선택 수와 관계없이 pickedInfo는 undefined로 만든다.

forEachLodMaterial(mesh: InstancedMesh2Type, callback: Function) -> void
    인터페이스: callback은 중복 없는 각 재질을 동기적으로 받는다.
    의존: THREE.Material — 재컴파일 요청; 속성 쓰기: {needsUpdate}
    동작: 메시 또는 callback 함수가 없으면 반환한다. 비어 있지 않은 LODinfo.objects를 복사하고, 없으면 자신과 _parentLOD가 자신인 자식들을 대상으로 삼는다. 단일·배열 재질을 참조 중복 없이 callback에 전달한 뒤 needsUpdate=true로 만든다.
backupColorMaterial(mesh: InstancedMesh2Type, opacity: number, excludeTexture: boolean) -> void
    의존: THREE.Color — 원색 백업과 색상 설정; 함수: {clone(), copy(), set()}
    동작: LOD 재질 중 원색이 이미 있거나 color가 없으면 건너뛴다. 원색을 복제하고 map이 있거나 텍스처 무시이면 흰색, map이 없고 setSampleColor가 truthy이면 그 색상을 적용한다. transparent를 opacity<1로 설정한다.
restoreColorMaterial(mesh: InstancedMesh2Type) -> void
    의존: THREE.Color — 재질 원색 복원; 함수: {copy()}
    동작: LOD 재질에 원색과 color가 모두 있으면 원색을 복원하고 _oriColor를 지운다.
```

## 4. 공통 처리 기준과 제약

```spec
instanceId는 현재 메시의 렌더 슬롯이다. 슬롯 재사용 시 색상 조정 offset/delta를 초기화하며, 데이터·배치 영속 식별자를 이 클래스가 만들지 않는다.
가시 개수 집계는 availability의 가시·활성이 모두 true인 슬롯만 세며 메시별 표시 허용값도 반영한다. 통계 재계산은 syncGlobalInstanceCounts가 담당한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
