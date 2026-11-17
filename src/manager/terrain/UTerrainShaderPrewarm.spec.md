# UTerrainShaderPrewarm 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

실제 terrain mesh가 사용할 shader 변형만 화면에 연결되기 전에 미리 link해, 최초 렌더의 동기 shader 준비가 남을 가능성을 줄인다. 예열만으로 GPU draw 비용이나 FPS 개선을 보장하지 않는다.

### 1.2 책임 범위

prewarm template material cache와 비동기 컴파일·reflection 대기 재질 및 대기 수를 이 객체가 소유한다. terrain tile 상태와 앱 참조는 소유하지 않고 manager에서 조회한다. prewarm을 언제 요청할지, 적용 대상 program의 준비 상태를 조회해 새 표면의 표시와 apply를 미룰지는 manager가 결정한다. 다른 program의 예열은 준비된 표시를 막지 않는다.

### 1.3 주요 동작 방식

renderer·scene·camera가 준비된 뒤 현재 material의 확정된 정의·texture 메타데이터·실제 그림자 조건 하나만 복제한다. 일반 terrain RenderPass와 같은 1×1 RTT 문맥에서 compileAsync로 준비하고 uniform·attribute의 지연 reflection을 끝낸다. 실제 이미지 데이터는 template에 보유하지 않는다. 같은 renderer와 현재 조건의 template이 있으면 복제·컴파일을 반복하지 않으며, 준비하지 못한 조건은 기존 최초 렌더로 돌아간다.

### 1.4 주요 사용처와 연계 대상

`UShaderTerrainDecalManager`가 생성자에서 하나를 만들어 `shaderPrewarm` 필드로 소유하고, texture-ready가 확정된 material 등록·texture-ready 변경과 worker/합성 표시 정의가 결정된 지점에서 prewarmPrograms()를 호출한다. 생성자나 texture가 미정인 mesh 등록은 미래 조합을 준비하지 않는다. manager의 호환 접근자 `TERRAIN_SHADER_TEMPLATE_CACHE`, `TERRAIN_SHADER_WARMUP_PENDING_COUNT`는 이 객체의 같은 이름 상태를 그대로 위임한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
prewarm은 실제 렌더가 사용할 program과 같은 cache key를 만들어야 하며, 현재 material의 색상 조정·overlay key 부분은 그대로 두고 terrain define 부분만 목표 값으로 바꿔야 한다.
현재 TERRAIN_DECAL_TYPE_ORDER 와 HYBRID_RUN 은 일반 define 으로 보존하지 않으며, 목표 순서가 없는 canonical 예열에 이전 순서가 섞이지 않아야 한다.
같은 renderer와 최종 정의·현재 일반 terrain 표시 조건은 두 번 prewarm하지 않아야 한다. 서로 다른 renderer의 program 참조를 공유해서는 안 된다.
prewarm은 main terrain의 일반 RTT 문맥(작업 색 공간·무색조매핑)에서 현재 조명·그림자만 사용한다. map 미사용/사용과 그림자 유/무 조합을 추측해 만들거나 light.castShadow를 바꾸지 않는다. 임시 target 바인딩은 cube face·mipmap level과 함께 복원한다.
컴파일을 지원하지 않거나 실패하면 예외를 밖으로 내보내지 않고 이번에 만든 template만 정리해 기존 최초 렌더 컴파일 경로로 되돌아가야 한다.
manager는 적용 대상 material·define·map·normalMap·그림자 조건의 cache key가 실제 예열 중일 때만 apply를 미뤄야 한다. 예열하지 않았거나 실패하여 cache에서 제거된 변형은 최초 렌더 컴파일 경로를 유지한다. 대기 수는 준비 중인 재질의 수를 나타낸다.
```

### 2.2 성능 및 품질 요구사항

```spec
cache hit인 prewarm 요청은 material 복제와 컴파일을 하지 않아야 한다.
template material과 임시 texture는 앱 공유 manager가 소유하며 같은 조건의 program 참조를 유지한다. 정리 중인 template이 compileAsync 대기 중이면 cache에서만 제거하고 완료 뒤 해제한다. 오래된 실패는 같은 key의 새 template을 삭제할 수 없다. renderer 식별은 약한 참조와 재사용하지 않는 번호를 사용한다.
```

## 3. 정규 자연어 수도코드

```spec
UTerrainShaderPrewarmCO 타입 정의
    manager: UShaderTerrainDecalManager
        prewarm 대상 terrain 상태를 소유한 manager

UShaderTerrainDecalManager 부분 타입 명세
    이 명세에서 사용하는 필드:
        _app: object | undefined
            prewarm 이 renderer·camera·scene·drawWork·changeUpdate 를 조회하는 앱 참조. 비동기 완료 시점에 바뀔 수 있다.
        tiles.registry: Map<string, object>
            tile key 별 등록 상태. 준비 완료 뒤 실제 LOD 대기 대상을 찾을 때 읽는다.
        present.swapReadyPromises: Map<string, object>
            같은 프로그램을 공유하는 타일의 기존 표시 준비 대기 목록이다. 새 예열 전용 대기 목록은 만들지 않는다.

TerrainMaterial 부분 타입 명세
    이 명세에서 사용하는 필드:
        clone(): TerrainMaterial
            warmup material 을 만들 때 원본을 복제한다.
        map, normalMap, alphaMap, aoMap, lightMap, bumpMap, displacementMap, emissiveMap, specularMap, normalMapType
            현재 texture 유무·UV channel·색 공간·format·normal 유형을 구분한다. placeholder는 이미지 참조 없이 이 메타데이터만 보존한다.
        transparent, setTerrainBaseTransparent(value)
            기본 투명 상태를 clone의 내부 기준에도 복원하여 목표 정의 적용 후 불투명 분기가 바뀌지 않게 한다.
        onBeforeCompile, _decalShader, _baseShaderUniforms
            원본의 shader 주입을 warmup 에 재사용하되 원본 runtime 참조는 컴파일 전후로 보존한다.
        defines, applyTerrainDecalState(state), customProgramCacheKey()
            terrain define 과 program cache key 를 warmup material 에 적용·환산한다.

UTerrainShaderPrewarm 클래스 정의

    _manager: UShaderTerrainDecalManager
        이 prewarm 상태를 소유한 manager. 앱과 tile registry를 조회할 때만 사용한다.

    templateCache: Map<string, UTerrainMaterial> = 빈 Map
        앱 수명 동안 prewarm한 shader program 참조를 유지하는 warmup material 목록

    rendererIds: WeakMap<WebGLRenderer, number> = 빈 WeakMap
        서로 다른 renderer의 program 참조를 구분한다. 번호는 모듈 수명 동안 재사용하지 않으며 renderer를 강하게 보유하지 않는다.

    warmupPendingCount: number = 0
        pendingWarmupMaterials의 크기와 같은 준비 대기 수

    pendingWarmupMaterials: Set<UTerrainMaterial> = 빈 Set
        compileAsync 완료를 기다리는 warmup material. 대기 중에 정리가 요청되면 cache 에서만 먼저 빼고 실제 해제는 완료 뒤로 미룬다. three.js 의 준비 확인 루프가 해제된 material 의 program 을 읽으면 예외가 나고 Promise 가 끝나지 않기 때문이다.

    constructor(opt: UTerrainShaderPrewarmCO)
        역할: manager 참조를 보관하고 prewarm 상태를 빈 값으로 시작한다.

        인터페이스:
            opt.manager: prewarm 대상 terrain 상태를 소유한 manager이며 필수다.

        동작:
            opt.manager 를 _manager 에 보관한다.
            templateCache, rendererIds, pendingWarmupMaterials 를 빈 컬렉션으로, warmupPendingCount 를 0 으로 만든다.

    isProgramReady(material: TerrainMaterial, defines: Record<string, number|undefined> = {}, mesh: Mesh = undefined) -> boolean
        역할: 적용 대상 program의 예열 대기 여부를 읽기 전용으로 조회한다.
        처리 기준:
            pendingWarmupMaterials가 비었으면 장면·key를 다시 계산하지 않고 즉시 true를 반환한다.
            같은 cache key의 template이 pendingWarmupMaterials에 있으면 false를 반환한다.
            template이 없거나 예열이 완료됐으면 true를 반환하며 다른 program의 대기 수는 보지 않는다.
        동작:
            renderer·scene·camera 또는 mesh가 없으면 준비를 막지 않는다. 현재 material·mesh·정의·렌더 문맥으로 cache key를 만들고 templateCache와 pendingWarmupMaterials를 확인한다.

    #getProgramCacheKey(material: TerrainMaterial, defines: Record<string, number|undefined> = {}) -> string
        역할: 현재 material이 실제로 쓰는 program key에서 terrain define 부분만 목표 define으로 바꾼 key를 만든다.

        처리 기준:
            UTerrainMesh 는 material 의 terrain program key 뒤에 색상 조정과 overlay key 를 덧붙이므로, 그 뒷부분은 유지해야 실제 렌더와 같은 program 을 준비할 수 있다.
            material 의 customProgramCacheKey 가 없으면 현재 terrain key 를 실제 key 로 본다.
            실제 key 가 현재 terrain key 와 같으면 목표 terrain key 를 그대로 돌려준다.
            실제 key 가 `현재 terrain key|` 로 시작하면 앞부분만 목표 terrain key 로 교체하고 나머지 접미사를 유지한다.
            두 조건에 모두 맞지 않으면 실제 key 를 그대로 돌려준다.

        의존:
            getTerrainMaterialProgramCacheKey — 현재·목표 define 의 terrain program key 계산; 함수: {getTerrainMaterialProgramCacheKey()}

        동작:
            현재 define 과 목표 define 의 terrain program key 를 각각 구한다.
            material 의 실제 program key 를 확인해 terrain key 부분만 목표 값으로 교체한 key 를 돌려준다.

    #getWarmupCacheKey(material: TerrainMaterial, defines: Record<string, number|undefined>, mesh: THREE.Mesh, renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) -> string | undefined
        역할: renderer와 실제 표시 조건이 같은 예열 프로그램을 구분한다.
        처리 기준:
            MeshPhongMaterial과 그 하위 타입만 지원한다. 환경맵·동영상 texture·instanced/skinned/batched mesh·morph attribute가 있으면 undefined를 반환한다.
            geometry·renderer·scene·camera가 없으면 undefined를 반환하며 미지원 변형을 예측하지 않는다.
        의존:
            THREE.MeshPhongMaterial — 지원 재질 판정; 상속: {THREE.MeshPhongMaterial}
            THREE.Scene — 카메라 레이어에 참여하는 가시 조명 조회; 함수: {traverseVisible()}
            THREE.ColorManagement — 작업 색 공간 구분; 속성 읽기: {workingColorSpace}
        동작:
            재질 종류와 mesh·렌더 문맥·texture 슬롯을 검사하여 지원하지 않는 입력이면 undefined를 반환한다.
            renderer의 WeakMap 식별자가 없으면 일련번호를 부여한다.
            가시 장면에서 camera.layers와 교차하는 조명의 종류·그림자·조명 map 유무를 모아 정렬한다.
            현재 defines에서 terrain decal·composite·hybrid·hybrid run·선·면·원·직접 타입 순서 정의를 제거한 뒤 목표 defines를 합친다.
            재질의 현재 program key 접미사를 보존한 목표 key를 계산한다.
            renderer 식별자, 목표 key, 합친 defines의 순서, 작업 색 공간, texture 슬롯의 channel·colorSpace·format을 직렬화한다.
            재질 shader 분기·투명·blending·alpha 조건, geometry attribute, receiveShadow·fog·조명, renderer 그림자·clipping과 재질 clipping 조건을 같은 직렬화 결과에 담아 반환한다.

    prewarmPrograms(mesh: UTerrainMesh | THREE.Mesh, material: TerrainMaterial, defines: Record<string, number|undefined> = {}, tileKey: string = '') -> boolean
        역할: 실제 지형 표시와 같은 프로그램 변형을 비동기로 예열한다.
        인터페이스: true는 새 컴파일을 시작했다는 의미이며 GPU 완료를 기다리는 Promise가 아니다. 캐시 재사용·미지원 입력·시작 실패는 false다. tileKey는 현재 동작에서 사용하지 않고 호출 호환을 위해 유지한다.
        처리 기준:
            MeshPhongMaterial과 그 하위 타입, geometry·앱·renderer·camera·scene, clone·compileAsync·render target 접근 함수가 있어야 시작한다.
            시작 try 이전의 재질 복제·placeholder·임시 객체 생성 예외는 호출자에게 전파된다.
            compileAsync 시작·완료 실패는 잡아서 해당 template을 제거하며 같은 key로 교체된 새 template은 지우지 않는다.
        의존:
            UShaderTerrainDecalManager — 앱·타일·표시 대기 조회; 속성 읽기: {_app, tiles, present}
            U3dApp — 렌더 문맥 조회와 후속 갱신 요청; 함수: {getRenderer(), getCamera(), getScene(), changeUpdate(), drawWork()}
            THREE.MeshPhongMaterial — 지원 재질과 복제; 함수: {clone()}
            THREE.Texture — 실제 영상 참조 없는 placeholder 생성; 생성자: {new THREE.Texture()}
            THREE.Group — 예열 mesh의 임시 장면 묶음; 생성자: {new THREE.Group()}; 함수: {add()}
            THREE.Mesh — 원본 geometry를 빌려 예열 mesh 생성; 생성자: {new THREE.Mesh()}
            THREE.WebGLRenderTarget — 1×1 예열 렌더 문맥; 생성자: {new THREE.WebGLRenderTarget()}; 함수: {dispose()}
            THREE.WebGLRenderer — 현재 target 보존과 프로그램 준비·정보 조회; 함수: {getRenderTarget(), getActiveCubeFace(), getActiveMipmapLevel(), setRenderTarget(), compileAsync()}; 속성 읽기: {properties}
            UTerrainMaterial — 예열용 정의와 기본 투명 상태 적용; 함수: {setTerrainBaseTransparent(), applyTerrainDecalState()}
            notifyTerrainTileSwapReady — 현재 타일의 준비 재평가 통지; 함수: {notifyTerrainTileSwapReady()}
        동작:
            앱과 지원 함수를 확인하고 실제 표시 조건의 key를 계산한다. key를 만들 수 없으면 false를 반환한다.
            template이 있으면 새 복제·컴파일 없이 false를 반환한다.
            재질을 복제하고 목표 program key를 고정한다.
            예열 onBeforeCompile은 복제 재질을 this로 원래 callback을 실행하며, 원본의 _decalShader·_baseShaderUniforms 참조를 finally에서 복원한다.
            texture 슬롯마다 원본 image를 보유하지 않는 placeholder를 만들고 channel·colorSpace·format만 복사한다.
            기본 투명 상태와 목표 decal 정의를 복제 재질에 적용하고 원본 geometry를 빌린 mesh에 castShadow·receiveShadow를 복사한다.
            templateCache와 pendingWarmupMaterials에 같은 재질을 등록하고 pending 수를 맞춘다. depth·stencil 없는 1×1 target을 만든다.
            현재 render target·cube face·mipmap level을 저장하고 임시 target에서 compileAsync를 시작한다. 시작의 성공·실패와 무관하게 기존 target을 복원한다.
            Promise가 성공하면 예열 callback을 기본 구현으로 돌린다. 앱 또는 template 동일성이 바뀌었으면 reflection을 생략한다.
            시작할 때의 renderer에서 고유 program 집합을 만들고 getUniforms·getAttributes를 조회하여 지연 reflection을 끝낸다.
            비동기 실패 또는 동기 시작 실패에서는 아직 같은 재질이 등록된 경우만 template을 제거한다. 동기 시작 실패는 정리 후 false를 반환한다.
            완료 finally는 임시 target을 해제하고 pending 집합과 수를 갱신한다. 캐시에서 제거된 예열 재질만 placeholder와 함께 해제한다.
            앱과 renderer가 여전히 같으면 swap 대기 key와 가시 부모의 숨은 자식·LOD 대기 중인 가시 타일을 모은다. 취소·제거된 타일을 제외하고 준비 재평가를 알린 뒤 LOD와 그리기를 요청한다.
            비동기 컴파일 등록이 끝나면 true를 반환한다.

    disposeTemplates(cacheKeys: Array<string> = Array.from(this.templateCache.keys())) -> void
        역할: prewarm program을 유지하던 material과 임시 texture를 정리한다.

        인터페이스:
            cacheKeys: 정리할 prewarm cache key 이며 생략하면 cache 전체를 정리한다.

        처리 기준:
            cache 에 없는 key 는 건너뛴다.
            compileAsync 대기 중인 material 은 cache 에서만 제거하고 실제 해제는 완료 처리에 맡긴다.

        동작:
            각 cache key 를 templateCache 에서 제거하고, 대기 중이 아닌 material 만 해제한다.

    #disposeWarmupMaterial(material: UTerrainMaterial) -> void
        역할: warmup material과 임시 texture를 해제한다.

        동작:
            material 의 onBeforeCompile 을 기본 구현으로 되돌린 뒤 일반 terrain texture slot의 소유 placeholder와 material을 해제한다.
```

## 4. 공통 처리 기준과 제약

```spec
compileAsync의 시작·완료 실패는 해당 template을 제거하여 후속 표시가 기존 최초 렌더 컴파일 경로를 사용하게 한다.
이 객체는 terrain tile 상태를 소유하거나 직접 변경하지 않으며 준비 완료 통지는 기존 TileState 경계에 맡긴다.
manager의 앱·renderer는 대기 중 바뀔 수 있다. 프로그램 조회는 captured renderer에만 수행하며, 앱이 해제되거나 template 소유 항목이 교체되면 후속 reflection을 생략한다. Promise 정리는 동일 material identity를 확인한다.
예열은 표시 최적화이며 CPU 회귀검사만으로 GPU 시간이나 FPS 개선을 주장하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
