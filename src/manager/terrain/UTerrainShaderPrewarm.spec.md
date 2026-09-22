# UTerrainShaderPrewarm 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

실제 terrain mesh가 사용할 shader 변형만 화면에 연결되기 전에 미리 link해, 최초 렌더에서 동기 shader 컴파일이 일어나 프레임이 끊기는 것을 막는다. 준비한 program이 실제 렌더 program과 같은지도 verbose 계측에서 한 번씩 대조한다.

### 1.2 책임 범위

prewarm template material cache, 실제 렌더 계측 callback 연결, 계측을 마친 cache key 집합, 그리고 아직 실제 렌더로 확인되지 않은 prewarm 수를 이 객체가 소유한다. terrain tile 상태와 앱 참조는 소유하지 않고 manager에서 조회한다. prewarm을 언제 요청할지, 대기 수를 보고 apply를 미룰지는 manager가 결정한다.

### 1.3 주요 동작 방식

현재 material을 복제해 목표 define과 map·normalMap 유무만 바꾼 warmup material을 만들고, 이를 담은 임시 Group을 offscreen RenderTarget 문맥에서 `compileAsync`로 컴파일한다. 컴파일이 끝나면 program uniform을 한 번 조회해 지연 reflection까지 미리 끝내고, 그 mesh가 아직 tile에 등록되어 있으면 실제 렌더 계측 callback을 연결한다. cache key가 이미 있으면 아무 것도 컴파일하지 않는다.

### 1.4 주요 사용처와 연계 대상

`UShaderTerrainDecalManager`가 생성자에서 하나를 만들어 `shaderPrewarm` 필드로 소유하고, terrain mesh material이 결정되는 지점 3곳에서 `prewarmPrograms()`를 호출한다. manager의 호환 접근자 `TERRAIN_SHADER_TEMPLATE_CACHE`, `TERRAIN_SHADER_PROGRAM_DIAGNOSTIC_BINDINGS`, `TERRAIN_SHADER_WARMUP_PENDING_COUNT`는 이 객체의 같은 이름 상태를 그대로 위임한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
prewarm은 실제 렌더가 사용할 program과 같은 cache key를 만들어야 하며, 현재 material의 색상 조정·overlay key 부분은 그대로 두고 terrain define 부분만 목표 값으로 바꿔야 한다.
같은 cache key를 두 번 prewarm하지 않아야 한다.
prewarm은 실제 화면 렌더의 RenderTarget·그림자 문맥과 같은 조건에서 컴파일해야 하며, 컴파일 중 바꾼 renderer 상태와 light의 castShadow는 원래대로 복원해야 한다.
컴파일을 지원하지 않거나 실패하면 예외를 밖으로 내보내지 않고 이번에 만든 template만 정리해 기존 최초 렌더 컴파일 경로로 되돌아가야 한다.
verbose 계측에서만 실제 렌더 program key와 prewarm program key를 cache key마다 한 번 비교하고, 비교를 마치면 계측 callback을 원래 callback으로 복원해야 한다.
계측 callback은 기존 onAfterRender를 대체하지 않고 먼저 호출한 뒤 동작해야 한다.
prewarm이 진행 중인 동안 대기 수를 유지해, manager가 그 값으로 apply 처리를 미룰 수 있어야 한다.
```

### 2.2 성능 및 품질 요구사항

```spec
cache hit인 prewarm 요청은 material 복제와 컴파일을 하지 않아야 한다.
계측은 mesh마다 binding 하나만 유지하고, 같은 mesh에 대한 추가 요청은 기대 cache key만 병합해야 한다.
계측을 마친 cache key는 다시 계측 대상으로 삼지 않아야 한다.
template material과 그 임시 texture는 정리 시 함께 해제해 앱 수명 동안 누적되지 않아야 한다.
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
            prewarm 이 renderer·camera·scene·light·compileAsync·drawWork 를 조회하는 앱 참조. 비동기 완료 시점에 바뀔 수 있다.
        tiles.registry: Map<string, object>
            tile key 별 등록 상태. 계측 연결 전 mesh 가 아직 그 tile 에 등록되어 있는지 확인할 때만 읽는다.

TerrainMaterial 부분 타입 명세
    이 명세에서 사용하는 필드:
        clone(): TerrainMaterial
            warmup material 을 만들 때 원본을 복제한다.
        map, normalMap, normalMapType
            cache key 와 warmup material 의 texture 유무·normalMap 유형을 정한다.
        onBeforeCompile, _decalShader, _baseShaderUniforms
            원본의 shader 주입을 warmup 에 재사용하되 원본 runtime 참조는 컴파일 전후로 보존한다.
        defines, applyTerrainDecalState(state), customProgramCacheKey()
            terrain define 과 program cache key 를 warmup material 에 적용·환산한다.

UTerrainShaderPrewarm 클래스 정의
    의존:
        THREE — warmup material·mesh·offscreen RenderTarget 생성; 생성자: {new Group(), new Texture(), new Mesh(), new WebGLRenderTarget()}; 속성 읽기: {TangentSpaceNormalMap, SRGBColorSpace, Material.prototype.onBeforeCompile}
        TERRAIN_PERFORMANCE_PROFILER — prewarm cache·컴파일·reflection·program 비교 계측; 함수: {getMode(), record(), begin(), end(), mark()}
        getTerrainMaterialProgramCacheKey — terrain define만으로 만든 program key 계산; 함수: {getTerrainMaterialProgramCacheKey()}
        UShaderTerrainDecalManager — 앱과 tile registry 조회; 속성 읽기: {_app, tiles}

    _manager: UShaderTerrainDecalManager
        이 prewarm 상태를 소유한 manager. 앱과 tile registry를 조회할 때만 사용한다.

    templateCache: Map<string, UTerrainMaterial> = 빈 Map
        앱 수명 동안 prewarm한 shader program 참조를 유지하는 warmup material 목록

    diagnosedWarmupCacheKeys: Set<string> = 빈 Set
        실제 렌더 계측을 마친 prewarm cache key

    programDiagnosticBindings: Map<Mesh, TerrainShaderProgramDiagnosticBinding> = 빈 Map
        mesh별 렌더 계측 callback 연결

    warmupPendingCount: number = 0
        아직 실제 렌더를 확인하지 못한 prewarm 수

    pendingWarmupMaterials: Set<UTerrainMaterial> = 빈 Set
        compileAsync 완료를 기다리는 warmup material. 대기 중에 정리가 요청되면 cache 에서만 먼저 빼고 실제 해제는 완료 뒤로 미룬다. three.js 의 준비 확인 루프가 해제된 material 의 program 을 읽으면 예외가 나고 Promise 가 끝나지 않기 때문이다.

    constructor(opt: UTerrainShaderPrewarmCO)
        역할: manager 참조를 보관하고 prewarm 상태를 빈 값으로 시작한다.

        인터페이스:
            opt.manager: prewarm 대상 terrain 상태를 소유한 manager이며 필수다.

        동작:
            opt.manager 를 _manager 에 보관한다.
            templateCache, diagnosedWarmupCacheKeys, programDiagnosticBindings 를 빈 컬렉션으로, warmupPendingCount 를 0 으로 만든다.

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

    #getWarmupCacheKey(material, defines = {}, useMap = !!material.map) -> string
        역할: prewarm과 실제 렌더가 공유할 cache key를 만든다.

        처리 기준:
            program key, map 사용 여부, normalMap 유형, 그림자 light 사용 여부를 `:` 로 이어 한 key 로 만든다.
            normalMapType 이 없으면 THREE.TangentSpaceNormalMap 을 사용한다.
            그림자 여부는 manager 가 보유한 앱의 light 에서 조회하며, 앱이나 light 가 없으면 그림자 없음으로 본다.

        의존:
            UShaderTerrainDecalManager — 그림자 light 조회; 속성 읽기: {_app}

        동작:
            #getProgramCacheKey 로 program key 를 구한다.
            map·normalMap·그림자 light 표식을 붙여 cache key 를 만든다.

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
        역할: 실제 terrain mesh에서 사용할 shader 변형만 미리 link한다.

        인터페이스:
            mesh: 화면에 연결될 terrain mesh
            material: terrain mesh 가 사용할 material
            defines: 적용 예정인 terrain decal define 이며 생략하면 빈 객체다.
            tileKey: 실제 렌더 program 을 연결할 terrain tile key 이며 생략하면 빈 문자열이다.
            반환: prewarm 을 시작했으면 true, 준비할 것이 없거나 컴파일을 시작하지 못했으면 false 다.

        처리 기준:
            mesh.geometry, material.clone, 앱의 compileAsync 중 하나라도 없으면 false 를 돌려준다.
            최초 terrain texture 가 늦게 연결되므로 map 이 이미 있으면 map 사용 변형만, 없으면 map 미사용과 사용 두 변형을 준비한다.
            cache 에 이미 있는 cache key 는 건너뛰고 cache hit 로만 기록한다.
            warmup material 은 원본을 복제해 만들고, 원본 material 의 _decalShader 와 _baseShaderUniforms 는 컴파일 전후로 보존한다.
            renderer·camera·scene 과 RenderTarget 조작이 모두 가능하면 offscreen RenderTarget 문맥에서 컴파일하고, 아니면 앱의 compileAsync 를 사용한다.
            앱 그림자 기능이 켜져 있고 scene 에 그림자를 만들 수 있는 light(shadow 를 가진 가시 light) 가 있으면, 현재 castShadow 값과 무관하게 그 light 의 castShadow 를 true 로 강제한 변형과 false 로 강제한 변형을 차례로 컴파일하고 castShadow 를 원래 값으로 되돌린다. 실제 렌더는 카메라 고도에 따라 두 변형을 모두 사용하므로 한 변형만 준비하면 나머지 변형 program 은 template 이 잡지 못해 tile 소멸 시 삭제되고 재방문 첫 draw 에서 다시 link 를 기다린다.
            그림자 기능이 꺼져 있거나 그림자 가능 light 가 없으면 현재 상태 그대로 한 변형만 컴파일한다.
            offscreen RenderTarget 은 성공·실패와 무관하게 해제한다.
            컴파일을 시작한 warmup material 은 pendingWarmupMaterials 에 넣고, 완료 뒤에 뺀다.
            두 번째 그림자 변형 컴파일과 완료 후 reflection·계측 연결은 이번 cache key 의 template 이 모두 아직 cache 에 그대로 등록되어 있을 때만 수행한다. 대기 중 정리(manager dispose 등)가 있었으면 program 을 다시 만들지 않는다.
            컴파일 완료 후 manager 의 앱이 바뀌었으면 이후 처리를 중단한다.
            계측 callback 은 그 mesh 가 아직 해당 tile 의 mesh 또는 material binding 으로 등록되어 있을 때만 연결한다.
            준비할 변형이 없으면(Group 이 비어 있으면) 계측만 연결하고 false 를 돌려준다.
            컴파일이 실패하면 이번에 만든 cache key 의 template 만 정리한다.
            완료 처리의 마지막에 cache 에서 이미 빠진 warmup material 은 그 시점에 실제로 해제한다.

        의존:
            THREE — warmup material·mesh 와 offscreen RenderTarget 생성; 생성자: {new Group(), new Texture(), new Mesh(), new WebGLRenderTarget()}
            TERRAIN_PERFORMANCE_PROFILER — cache hit·컴파일·reflection 계측; 함수: {getMode(), record(), begin(), end()}
            UShaderTerrainDecalManager — 앱 조회, tile 등록 확인, 다음 프레임 요청; 속성 읽기: {_app, tiles}

        동작:
            map 사용 변형마다 cache key 를 만들고 cache 에 없으면 warmup material 과 warmup mesh 를 만들어 Group 에 넣는다.
            준비할 변형이 없으면 계측만 연결하고 종료한다.
            offscreen 또는 앱 경로로 컴파일을 시작하고 warmupPendingCount 를 1 늘린다.
            컴파일이 끝나면 warmup material 의 onBeforeCompile 을 기본 구현으로 되돌리고 program uniform 을 한 번 조회해 지연 reflection 을 끝낸다.
            해당 mesh 가 tile 에 등록되어 있으면 계측을 연결한다.
            컴파일 시작이 동기 예외로 실패하면 이번 template 을 정리하고 false 를 반환한다.
            비동기 컴파일이 실패하면 후속 처리에서 이번 template 을 정리한다.
            성공·실패와 무관하게 warmupPendingCount 를 1 줄이고, 대기 목록에서 뺀 warmup material 중 cache 에 없는 것을 해제한 뒤 앱에 다음 프레임 처리를 요청한다.

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
            material 의 onBeforeCompile 을 기본 구현으로 되돌린 뒤 map·normalMap 과 material 을 해제한다.
```

## 4. 공통 처리 기준과 제약

```spec
계측은 TERRAIN_PERFORMANCE_PROFILER 의 mode 가 verbose 일 때만 동작하며, 그 밖의 mode 에서는 mesh 의 callback 을 바꾸지 않는다.
prewarm 실패는 화면 동작을 막지 않는다. 실패 시 기존 최초 렌더 컴파일 경로로 되돌아간다.
이 객체는 terrain tile 상태를 바꾸지 않고 조회만 한다.
manager 의 앱 참조는 prewarm 도중에도 바뀔 수 있으므로, 비동기 완료 처리에서 시작 시점의 앱과 같은지 확인한 뒤에만 이어서 처리한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
