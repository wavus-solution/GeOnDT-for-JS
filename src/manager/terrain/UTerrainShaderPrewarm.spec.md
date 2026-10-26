# UTerrainShaderPrewarm 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

실제 terrain mesh가 사용할 shader 변형만 화면에 연결되기 전에 미리 link해, 최초 렌더의 동기 shader 준비가 남을 가능성을 줄인다. 예열만으로 GPU draw 비용이나 FPS 개선을 보장하지 않는다. 준비한 program이 실제 렌더 program과 같은지도 verbose 계측에서 한 번씩 대조한다.

### 1.2 책임 범위

prewarm template material cache, 실제 렌더 계측 callback 연결, 계측을 마친 cache key 집합, 그리고 비동기 컴파일과 reflection이 끝나지 않은 prewarm 수를 이 객체가 소유한다. terrain tile 상태와 앱 참조는 소유하지 않고 manager에서 조회한다. prewarm을 언제 요청할지, 적용 대상 program의 준비 상태를 조회해 apply를 미룰지는 manager가 결정한다. 다른 program의 예열은 준비된 표시를 막지 않는다.

### 1.3 주요 동작 방식

renderer·scene·camera가 준비된 뒤 현재 material의 확정된 정의·texture 메타데이터·실제 그림자 조건 하나만 복제한다. 일반 terrain RenderPass와 같은 비 XR RTT 문맥에서 compileAsync로 준비하고 uniform·attribute의 지연 reflection을 끝낸다. 실제 이미지 데이터는 template에 보유하지 않는다. 같은 renderer와 현재 조건의 template이 있으면 복제·컴파일을 반복하지 않으며, 준비하지 못한 조건은 기존 최초 렌더로 돌아간다.

### 1.4 주요 사용처와 연계 대상

`UShaderTerrainDecalManager`가 생성자에서 하나를 만들어 `shaderPrewarm` 필드로 소유하고, texture-ready가 확정된 material 등록·texture-ready 변경과 worker/합성 표시 정의가 결정된 지점에서 prewarmPrograms()를 호출한다. 생성자나 texture가 미정인 mesh 등록은 미래 조합을 준비하지 않는다. manager의 호환 접근자 `TERRAIN_SHADER_TEMPLATE_CACHE`, `TERRAIN_SHADER_PROGRAM_DIAGNOSTIC_BINDINGS`, `TERRAIN_SHADER_WARMUP_PENDING_COUNT`는 이 객체의 같은 이름 상태를 그대로 위임한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
prewarm은 실제 렌더가 사용할 program과 같은 cache key를 만들어야 하며, 현재 material의 색상 조정·overlay key 부분은 그대로 두고 terrain define 부분만 목표 값으로 바꿔야 한다.
같은 renderer와 최종 정의·현재 일반 terrain 표시 조건은 두 번 prewarm하지 않아야 한다. 서로 다른 renderer의 program 참조를 공유해서는 안 된다.
prewarm은 main terrain의 일반 RTT 문맥(작업 색 공간·무색조매핑)에서 현재 조명·그림자만 사용한다. map 미사용/사용과 그림자 유/무 조합을 추측해 만들거나 light.castShadow를 바꾸지 않는다. 임시 target 바인딩은 cube face·mipmap level과 함께 복원한다.
컴파일을 지원하지 않거나 실패하면 예외를 밖으로 내보내지 않고 이번에 만든 template만 정리해 기존 최초 렌더 컴파일 경로로 되돌아가야 한다.
verbose 계측에서만 실제 렌더 program key와 prewarm program key를 cache key마다 한 번 비교하고, 비교를 마치면 계측 callback을 원래 callback으로 복원해야 한다.
계측 callback은 기존 onAfterRender를 대체하지 않고 먼저 호출한 뒤 동작해야 한다.
manager는 적용 대상 material·define·map·normalMap·그림자 조건의 cache key가 실제 예열 중일 때만 apply를 미뤄야 한다. 예열하지 않았거나 실패하여 cache에서 제거된 변형은 최초 렌더 컴파일 경로를 유지한다. 대기 수는 계측용으로 유지한다.
```

### 2.2 성능 및 품질 요구사항

```spec
cache hit인 prewarm 요청은 material 복제와 컴파일을 하지 않아야 한다.
계측은 mesh마다 binding 하나만 유지하고, 같은 mesh에 대한 추가 요청은 기대 cache key만 병합해야 한다.
계측을 마친 cache key는 다시 계측 대상으로 삼지 않아야 한다.
template material과 임시 texture는 앱 공유 manager가 소유하며 같은 조건의 program 참조를 유지한다. 정리 중인 template이 compileAsync 대기 중이면 cache에서만 제거하고 완료 뒤 해제한다. 오래된 실패는 같은 key의 새 template을 삭제할 수 없다. renderer 식별은 약한 참조와 재사용하지 않는 번호를 사용한다.
```

## 3. 정규 자연어 수도코드

```spec
TerrainShaderProgramDiagnosticBinding 타입 정의
    tileKey: string
        계측 대상 terrain tile key
    expectedCacheKeys: Set<string>
        실제 렌더를 기다리는 prewarm cache key
    previousOnAfterRender: Object3D['onAfterRender']
        기존 렌더 완료 callback
    wrapper: Object3D['onAfterRender']
        계측을 연결한 렌더 완료 callback

UTerrainShaderPrewarmCO 타입 정의
    manager: UShaderTerrainDecalManager
        prewarm 대상 terrain 상태를 소유한 manager

UShaderTerrainDecalManager 부분 타입 명세
    이 명세에서 사용하는 필드:
        _app: object | undefined
            prewarm 이 renderer·camera·scene·drawWork 를 조회하는 앱 참조. 비동기 완료 시점에 바뀔 수 있다.
        tiles.registry: Map<string, object>
            tile key 별 등록 상태. 계측 연결 전 mesh 가 아직 그 tile 에 등록되어 있는지 확인할 때만 읽는다.

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
    의존:
        THREE — warmup material·mesh·offscreen RenderTarget 생성; 생성자: {new Group(), new Texture(), new Mesh(), new WebGLRenderTarget()}; 속성 읽기: {ColorManagement.workingColorSpace, Material.prototype.onBeforeCompile}
        TERRAIN_PERFORMANCE_PROFILER — prewarm cache·컴파일·reflection·program 비교 계측; 함수: {getMode(), record(), begin(), end(), mark()}
        getTerrainMaterialProgramCacheKey — terrain define만으로 만든 program key 계산; 함수: {getTerrainMaterialProgramCacheKey()}
        UShaderTerrainDecalManager — 앱과 tile registry 조회; 속성 읽기: {_app, tiles}

    _manager: UShaderTerrainDecalManager
        이 prewarm 상태를 소유한 manager. 앱과 tile registry를 조회할 때만 사용한다.

    templateCache: Map<string, UTerrainMaterial> = 빈 Map
        앱 수명 동안 prewarm한 shader program 참조를 유지하는 warmup material 목록

    rendererIds: WeakMap<WebGLRenderer, number> = 빈 WeakMap
        서로 다른 renderer의 program 참조를 구분한다. 번호는 모듈 수명 동안 재사용하지 않으며 renderer를 강하게 보유하지 않는다.

    diagnosedWarmupCacheKeys: Set<string> = 빈 Set
        실제 렌더 계측을 마친 prewarm cache key

    programDiagnosticBindings: Map<Mesh, TerrainShaderProgramDiagnosticBinding> = 빈 Map
        mesh별 렌더 계측 callback 연결

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
            templateCache, rendererIds, diagnosedWarmupCacheKeys, programDiagnosticBindings, pendingWarmupMaterials 를 빈 컬렉션으로, warmupPendingCount 를 0 으로 만든다.

    isProgramReady(material, defines = {}, mesh = undefined) -> boolean
        역할: 적용 대상 program의 예열 대기 여부를 읽기 전용으로 조회한다.
        처리 기준:
            pendingWarmupMaterials가 비었으면 장면·key를 다시 계산하지 않고 즉시 true를 반환한다.
            같은 cache key의 template이 pendingWarmupMaterials에 있으면 false를 반환한다.
            template이 없거나 예열이 완료됐으면 true를 반환하며 다른 program의 대기 수는 보지 않는다.
        동작:
            renderer·scene·camera 또는 mesh가 없으면 준비를 막지 않는다. 현재 material·mesh·정의·렌더 문맥으로 cache key를 만들고 templateCache와 pendingWarmupMaterials를 확인한다.

    #getProgramCacheKey(material, defines = {}) -> string
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

    #getWarmupCacheKey(material, defines, mesh, renderer, scene, camera) -> string | undefined
        역할: 확정된 공통 terrain 표시 요청을 구분한다. Three의 전체 program key를 재구현하는 API는 아니다.
        처리 기준:
            현재 custom key의 색상 조정·Stamp·Fast 접미사를 유지한다. 기존 terrain 6개 정의를 제거한 후 목표 정의를 대입한 최종 항목 순서를 사용한다.
            등록의 전체 defines와 합성의 terrain-only defines가 같은 최종 적용 순서를 만들면 같은 요청으로 본다.
            renderer 식별·작업 색 공간·현재 texture channel/색 공간/format·normal 유형·재질 shader 분기·geometry attribute·실제 receiveShadow·fog·가시 조명/그림자·clipping 조건을 구분한다.
            일반 MeshPhong 이외 재질·환경맵·동영상·instanced/skinned/batched/morph mesh는 미래 변형을 추정하지 않고 미정의를 반환하여 기존 렌더로 폴백한다.

    #bindProgramDiagnostics(tileKey, mesh, cacheKeys) -> void
        역할: 실제 렌더 program과 prewarm program key를 cache key마다 한 번 비교하도록 mesh 렌더 완료 callback을 감싼다.

        처리 기준:
            계측 mode 가 verbose 가 아니면 아무 것도 하지 않는다.
            이미 계측을 마친 cache key 는 기대 목록에서 제외하고, 남는 key 가 없으면 연결하지 않는다.
            같은 mesh 에 binding 이 이미 있으면 tileKey 를 갱신하고 기대 cache key 만 병합한다.
            감싼 callback 은 기존 onAfterRender 를 먼저 호출한다.
            실제 program key 를 알 수 없거나 prewarm program key 가 하나도 없으면 기록하지 않는다.
            prewarm program key 집합은 warmup material 의 program 목록에서 각 program.cacheKey 를 우선하고 없으면 목록의 key 인 cacheKey 로 대체해 모으며, 현재 program 의 key 도 더한다.
            기대하던 cache key 를 모두 확인하면 그 mesh 의 계측을 해제한다.

        의존:
            TERRAIN_PERFORMANCE_PROFILER — 계측 mode 확인과 program 비교 기록; 함수: {getMode(), mark()}

        동작:
            기대 cache key 를 정리하고 기존 binding 이 있으면 병합만 하고 끝낸다.
            기존 onAfterRender 를 보관한 binding 을 만들고 감싼 callback 을 mesh.onAfterRender 로 설치한다.
            렌더 완료 시 실제 material 의 cache key 를 계산해 기대 목록에 있는지 확인한다.
            renderer 에서 실제 program key 와 prewarm material 의 program key 집합을 읽어 일치 여부를 기록한다.
            확인한 cache key 를 기대 목록에서 지우고 diagnosedWarmupCacheKeys 에 넣는다.
            기대 목록이 비면 계측을 해제한다.

    disposeProgramDiagnostics(mesh = undefined) -> void
        역할: Terrain shader program 계측 callback을 원래 상태로 복원한다.

        인터페이스:
            mesh: 복원할 mesh 이며 생략하면 연결된 모든 mesh 를 복원한다.

        처리 기준:
            현재 onAfterRender 가 이 객체가 설치한 callback 일 때만 원래 callback 으로 되돌린다.
            binding 이 없는 mesh 는 건너뛴다.

        동작:
            대상 binding 목록을 만들고 각 mesh 의 onAfterRender 를 복원한 뒤 programDiagnosticBindings 에서 제거한다.

    prewarmPrograms(mesh, material, defines = {}, tileKey = '') -> boolean
        역할: 실제 terrain mesh의 현재 확정된 표시 변형 하나를 준비한다.
        인터페이스:
            mesh와 material: 실제 표시 입력
            defines: 적용 예정인 terrain 정의
            tileKey: 실제 렌더 진단 대상 식별자
            반환: 비동기 준비를 시작하면 true, 문맥 미준비·지원 범위 밖·기존 template 재사용·동기 실패면 false
        동작:
            앱의 renderer·scene·camera와 compileAsync/getRenderTarget/setRenderTarget이 준비됐는지 확인한다.
            현재 요청 key가 cache에 있으면 진단 연결만 확인하고 false를 반환한다.
            재질을 복제하고 현재 texture 메타데이터만 가진 placeholder를 연결한다. live onBeforeCompile의 runtime shader 참조는 보존한다.
            clone의 기본 투명 상태를 기존 setter로 복원하고 목표 정의와 고정 custom key를 적용한다.
            실제 geometry·castShadow·receiveShadow를 가진 임시 mesh 하나를 만들고 template과 pending 집합에 등록한다.
            1×1 일반 RTT를 바인딩하여 시작 시 renderer로 현재 scene·camera를 compileAsync에 전달하고 바인딩을 즉시 복원한다.
            완료 시 해당 template이 여전히 동일한 소유 항목이고 앱이 같으면 시작한 renderer에서 program별 getUniforms/getAttributes를 한 번씩 호출한다.
            mesh가 아직 등록되어 있고 verbose면 실제 program 비교 callback을 연결한다.
            실패 시 captured material과 같은 항목만 cache에서 제거하여 새 요청을 보존한다.
            성공·실패와 무관하게 임시 RTT와 pending 상태를 정리하고 cache에서 빠진 template만 해제한다. 같은 앱이면 다음 프레임을 요청한다.

    disposeTemplates(cacheKeys = Array.from(this.templateCache.keys())) -> void
        역할: prewarm program을 유지하던 material과 임시 texture를 정리한다.

        인터페이스:
            cacheKeys: 정리할 prewarm cache key 이며 생략하면 cache 전체를 정리한다.

        처리 기준:
            cache 에 없는 key 는 건너뛴다.
            compileAsync 대기 중인 material 은 cache 에서만 제거하고 실제 해제는 완료 처리에 맡긴다.

        동작:
            각 cache key 를 templateCache 에서 제거하고, 대기 중이 아닌 material 만 해제한다.

    #disposeWarmupMaterial(material) -> void
        역할: warmup material과 임시 texture를 해제한다.

        동작:
            material 의 onBeforeCompile 을 기본 구현으로 되돌린 뒤 일반 terrain texture slot의 소유 placeholder와 material을 해제한다.
```

## 4. 공통 처리 기준과 제약

```spec
계측은 TERRAIN_PERFORMANCE_PROFILER 의 mode 가 verbose 일 때만 동작하며, 그 밖의 mode 에서는 mesh 의 callback 을 바꾸지 않는다.
prewarm 실패는 화면 동작을 막지 않는다. 실패 시 기존 최초 렌더 컴파일 경로로 되돌아간다.
이 객체는 terrain tile 상태를 바꾸지 않고 조회만 한다.
manager의 앱·renderer는 대기 중 바뀔 수 있다. 프로그램 조회는 captured renderer에만 수행하며, 앱이 해제되거나 template 소유 항목이 교체되면 후속 reflection·진단을 생략한다. Promise 정리는 동일 material identity를 확인한다.
예열은 표시 최적화이며 CPU 회귀검사만으로 GPU 시간이나 FPS 개선을 주장하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
