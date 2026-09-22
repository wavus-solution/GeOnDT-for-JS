# UTerrainMaterial 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

지형 image material에 terrain decal 평가 shader를 주입하고, manager가 만든 decal define·uniform 묶음을 실행 중에 교체한다. 교체할 때 이전 경로의 define이 남지 않게 하고, 같은 규격의 packed DataTexture는 GPU texture를 재사용해 업로드를 줄인다.

### 1.2 책임 범위

decal define 목록의 제거·적용, decal uniform 상태의 정규화·교체·해제, program cache key, 기본 shader uniform 복원, 이미지 레이어 기준 투명 상태 동기화를 이 단위가 소유한다. 어떤 define과 uniform을 넣을지는 manager가 결정하고, shader 문자열 조립은 `GDecalTerrainShader`가 소유한다. 합성 결과 RenderTarget texture는 참조만 보관하고 해제하지 않는다.

### 1.3 주요 동작 방식

생성 시 program cache key 함수와 `onBeforeCompile`을 설치해 컴파일마다 decal 선언과 평가 함수를 주입한다. decal 상태를 적용하면 terrain decal define을 모두 지운 뒤 새 define을 넣고, uniform은 값을 복제하되 같은 규격의 `DataTexture`는 변경 행만 GPU에 올려 재사용한다. 새 상태에서 사라진 uniform은 기본 shader와 이름이 겹치면 컴파일 당시 객체로 되돌리고, 그렇지 않으면 키를 남기고 값만 비운다. 적용 전후의 program cache key가 다르거나 투명 상태가 바뀌었거나 호출자가 강제 갱신을 요청하면 material 갱신을 요청한다.

### 1.4 주요 사용처와 연계 대상

`UShaderTerrainDecalTileStateManager`의 `applyTerrainBufferStateToMaterial`이 buffer 상태의 define·uniform과 host 구간 합성 texture를 이 material에 넘긴다. `UTerrainShaderPrewarm`은 `getTerrainMaterialProgramCacheKey`로 현재와 목표 program을 비교해 예열 필요 여부를 판단한다. decal이 사라질 때는 `clearTerrainDecalState`로 이미지 레이어의 원래 투명 상태를 되돌린다.

## 2. 요구사항과 품질 기준

```spec
decal 상태를 교체할 때 이전 경로의 terrain decal define 이 남아서는 안 된다. direct, precomposed, hybrid 세 경로는 fragment 분기가 다르므로 남은 define 하나가 잘못된 분기를 만든다.
terrain decal 이 아닌 define 은 교체에서 건드리지 않아야 한다.
program cache key 는 fragment 경로를 가르는 define 조합마다 달라야 한다. 같은 조합은 같은 key 여야 program 을 재사용한다.
material 이 소유하지 않은 GPU 전용 texture 는 복제하거나 해제하지 않아야 한다.
같은 규격의 packed DataTexture 는 새 texture 를 만들지 않고 변경 행만 올려야 한다.
새 상태에서 사라진 uniform 은 컴파일된 shader 에서 키를 지우지 않고 기본 객체나 빈 값으로 되돌려야 한다.
```

## 3. 정규 자연어 수도코드

```spec
TERRAIN_MATERIAL_PROGRAM_KEYS: Array<string>
    terrain/path/area/circle/composite/hybrid decal 여섯 boolean 조합에 대응하는 사전 생성 program cache key 64개. 호출마다 문자열을 조립하지 않기 위해 미리 만든다.

TERRAIN_MATERIAL_DECAL_DEFINE_KEYS: ReadonlyArray<string>
    decal 상태 교체마다 제거해야 하는 terrain decal define 목록. direct 와 composite 는 상호 배타이고 hybrid 는 두 경로를 함께 쓰므로, 세 경로의 define 을 함께 지워야 이전 경로가 되살아나지 않는다.

DATA_TEXTURE_COMPONENTS_PER_TEXEL: number = 4
    DataTexture texel 하나의 component 수

MAX_DATA_TEXTURE_PARTIAL_UPDATE_ROWS: number = 128
    부분 업로드로 처리할 최대 변경 행 수. 이보다 많으면 여러 GPU 호출보다 전체 업로드가 유리하다.

TERRAIN_DATA_TEXTURE_UPLOADED_KEY: string
    DataTexture 가 한 번이라도 업로드됐는지 표시하는 내부 key

TERRAIN_MATERIAL_OWNED_TEXTURE_KEY: string
    material 이 복제해 소유한 texture 임을 표시하는 내부 key

getTerrainMaterialProgramCacheKey(defines: Record<string, number | undefined> = {}) -> string
    역할: terrain decal define 조합에 대응하는 사전 생성 program cache key 를 반환한다.

    인터페이스:
        defines: terrain material 에 적용할 define
        반환: Three.js custom program cache key

    처리 기준:
        terrain, path, area, circle 사용 여부를 하위 네 bit 로 담는다.
        direct 와 composite 는 fragment 경로가 다르므로 전환 시 반드시 다시 컴파일해야 한다. composite 를 다섯째 bit 로 담는다.
        hybrid 는 두 경로를 함께 쓰는 세 번째 분기이므로 composite 만 켠 상태와 같은 program 으로 볼 수 없다. 여섯째 bit 로 담는다.
        이 함수는 prewarm 의 예열 판단과 상태 적용의 program 변경 판단에도 쓰이므로 경로를 가르는 define 을 빠뜨리면 갱신이 일어나지 않는다.

    동작:
        여섯 define 의 사용 여부로 bit mask 를 만들어 대응하는 사전 생성 key 를 반환한다.

isExternalGpuTexture(value: unknown) -> boolean
    역할: 다른 모듈이 소유한 GPU 전용 texture 인지 확인한다.

    인터페이스:
        value: 확인할 uniform 값
        반환: material 이 복제·해제하면 안 되는 texture 이면 true 다.

    처리 기준:
        RenderTarget texture 는 GPU 에만 있고 CPU 이미지 데이터가 없어 복제하면 빈 texture 가 된다. 해제 책임도 RenderTarget 을 만든 쪽에 있다.

    동작:
        Texture 이면서 RenderTarget texture 표시가 있으면 true 를 반환한다.

isMaterialOwnedTexture(value: unknown) -> boolean
    역할: material 이 복제해 소유한 texture 인지 확인한다.

    인터페이스:
        value: 확인할 uniform 값
        반환: material 이 해제해야 하는 texture 이면 true 다.

    처리 기준:
        소유 표시가 있는 texture 만 해제한다. 참조만 보관한 외부 texture 를 해제하면 소유자의 화면까지 깨진다.

    동작:
        Texture 이면서 소유 표시 key 가 참이면 true 를 반환한다.

cloneUniformValue(value: unknown, previousValue: unknown) -> unknown
    역할: uniform 값을 복제하되 같은 규격의 DataTexture 는 기존 GPU texture 를 재사용한다.

    인터페이스:
        value: 새 uniform 값
        previousValue: 이전 uniform 값
        반환: material 이 보관할 uniform 값

    처리 기준:
        외부 GPU texture 는 그대로 참조한다.
        같은 규격의 DataTexture 는 새로 만들지 않고 변경 행만 올려 재사용한다.
        복제한 texture 에는 소유 표시를 남겨 해제 대상임을 알린다.
        복제할 수 없는 값은 그대로 쓴다.

    동작:
        외부 GPU texture 면 그대로 반환한다.
        재사용 가능한 DataTexture 가 있으면 그것을 반환한다.
        배열이면 항목별로 복제하고, 복제 가능한 값이면 복제한 뒤 texture 에는 소유 표시와 갱신 표시를 남긴다.
        그 밖의 값은 그대로 반환한다.

updateReusableDataTexture(previousValue: unknown, nextValue: unknown) -> DataTexture | undefined
    역할: 같은 규격의 DataTexture 데이터를 비교해 변경 행만 update range 로 등록한다.

    인터페이스:
        previousValue: 현재 material 에 연결된 값
        nextValue: 새 buffer 상태의 값
        반환: 재사용할 texture 이며 재사용할 수 없으면 undefined 다.

    처리 기준:
        두 값이 모두 DataTexture 이고 크기·형식·규격이 같아야 재사용한다.
        변경 행이 없으면 업로드하지 않고 그대로 재사용한다.
        변경 행이 부분 업로드 상한을 넘으면 여러 GPU 호출보다 전체 업로드가 유리하므로 전체 갱신으로 바꾼다.
        한 번도 업로드되지 않은 texture 는 부분 갱신으로 시작할 수 없으므로 전체 업로드한다.

    동작:
        규격이 다르면 undefined 를 반환한다.
        행 단위로 데이터를 비교해 변경 범위를 모은다.
        변경이 없으면 이전 texture 를 그대로 반환한다.
        부분 갱신이 가능하면 대기 범위를 병합해 등록하고, 아니면 전체 갱신을 표시한 뒤 이전 texture 를 반환한다.

mergeDataTextureUpdateRanges(currentRanges: Array<{start: number, count: number}>, nextRanges: Array<{start: number, count: number}>, rowComponentCount: number) -> Array<{start: number, count: number}>
    역할: 렌더 전에 누적된 같은 행의 겹치거나 인접한 texture 범위를 병합한다.

    인터페이스:
        currentRanges: 기존 대기 범위
        nextRanges: 새 변경 범위
        rowComponentCount: texture 한 행의 component 수
        반환: GPU 호출 기준으로 병합한 범위

    처리 기준:
        범위를 시작 위치로 정렬해 인접·중복 구간을 하나로 합쳐 GPU 호출 수를 줄인다.

    동작:
        기존 범위와 새 범위를 합쳐 정렬하고 인접·중복 구간을 병합한 목록을 반환한다.

UTerrainMaterial extends THREE.MeshPhongMaterial 클래스 정의
    의존:
        THREE.MeshPhongMaterial — 기본 지형 image material 상태와 컴파일 확장 지점 제공; 상속: {THREE.MeshPhongMaterial}

    name: string
        material 이름이며 항상 UTerrainMaterial 이다.
    _decalShader: object | undefined
        마지막 컴파일에서 받은 shader 객체이며 uniform 재연결에 쓴다.
    _baseShaderUniforms: Map<string, IUniform>
        decal uniform 과 이름이 겹친 기본 shader uniform 의 컴파일 당시 객체
    _terrainBaseTransparent: boolean
        이미지 레이어가 지정한 기본 투명 상태
    _terrainDecalState: {defines: Record<string, number>, uniforms: Record<string, IUniform>, hasTranslucentDecal: boolean, forceMaterialUpdate: boolean}
        현재 적용된 decal 상태
    needsUpdate: boolean
        material 재컴파일 요청 표시이며 three 에서 setter 전용이다.
    transparent: boolean
        실제 material 투명 상태
    customProgramCacheKey: () => string
        Three.js 가 program 을 구분할 때 호출하는 key 함수
    onBeforeCompile: (shader: object, renderer: object) => void
        컴파일마다 decal 선언과 평가 함수를 주입하는 hook
    defines: Record<string, number>
        현재 material define 집합

    constructor(opt: object = {})
        역할: 기본 material 옵션으로 초기화하고 decal 상태와 shader 주입을 준비한다.

        인터페이스:
            opt: MeshPhongMaterial 옵션

        처리 기준:
            이미지 레이어 기준 투명 상태는 생성 시점의 material 투명 상태로 시작한다.

        의존:
            MeshPhongMaterial — 기본 material 초기화와 시작 투명 상태 확인; 속성 읽기: {transparent}

        동작:
            기본 material 을 초기화하고 이름과 빈 decal 상태를 만든다.
            program cache key 함수와 컴파일 hook 을 설치한다.

    applyTerrainDecalState(state: object = {}) -> void
        역할: manager 가 전달한 decal define·uniform 묶음으로 material 상태를 교체한다.

        인터페이스:
            state.defines: 적용할 terrain decal define
            state.uniforms: 적용할 decal uniform
            state.hasTranslucentDecal: 알파 1 미만 decal 포함 여부
            state.forceMaterialUpdate: material 강제 갱신 요청 여부

        처리 기준:
            빈 상태를 기본값으로 두고 전달된 값만 덮어쓴다.
            교체 전 program cache key 를 기억해 교체 뒤 값과 비교한다.
            강제 갱신 요청, 투명 상태 변경, program 변경 중 하나라도 있으면 갱신을 요청한다. 세 조건이 모두 없으면 갱신을 요청하지 않아 같은 상태 재적용이 재컴파일을 만들지 않는다.

        의존:
            MeshPhongMaterial — program key 조회와 갱신 요청; 속성 읽기: {customProgramCacheKey}; 속성 쓰기: {needsUpdate}

        동작:
            빈 상태와 전달 상태를 합치고 현재 program cache key 를 기억한다.
            define 과 uniform 을 교체한다.
            decal 상태를 갱신하고 uniform 을 컴파일된 shader 에 다시 연결한다.
            투명 상태를 동기화하고 program 변경을 판정해 갱신 요청 여부를 정한다.

    clearTerrainDecalState() -> void
        역할: terrain decal 상태를 제거하고 이미지 레이어의 투명 상태를 복원한다.

        처리 기준:
            빈 define 과 빈 uniform 으로 적용하며 강제 갱신을 요청한다.

        동작:
            빈 decal 상태를 적용한다.

    setTerrainBaseTransparent(transparent: boolean) -> void
        역할: 이미지 레이어가 지정한 기본 투명 상태를 갱신한다.

        인터페이스:
            transparent: 이미지 레이어 기준 투명 상태

        의존:
            MeshPhongMaterial — 투명 상태 변경 시 갱신 요청; 속성 쓰기: {needsUpdate}

        동작:
            기본 투명 상태를 기록하고 실제 material 투명 상태가 바뀌면 갱신을 요청한다.

    refreshDecalShaderUniforms() -> void
        역할: 현재 decal uniform 객체를 컴파일된 shader 에 연결한다.

        처리 기준:
            아직 컴파일되지 않았으면 아무 것도 하지 않는다.
            기본 material uniform 과 이름이 같아도 원본 객체를 덮어쓰지 않고 decal 객체를 따로 연결한다.

        동작:
            decal uniform 을 순회해 컴파일된 shader uniform 에 연결한다.

    override dispose() -> void
        역할: material 이 소유한 terrain uniform texture 와 기본 material 자원을 정리한다.

        처리 기준:
            소유 표시가 있는 texture 만 해제한다.

        동작:
            decal uniform 의 소유 texture 를 해제하고 기본 material 정리를 이어서 호출한다.

    #createEmptyState() -> object
        역할: 비어 있는 terrain decal 상태를 만든다.

        처리 기준:
            threshold, depthOffset, tileScale 기본 uniform 을 항상 담아 decal 이 없을 때도 shader 계약을 유지한다.

        동작:
            빈 define 과 기본 uniform 세 개, 반투명·강제 갱신 거짓을 담은 상태를 반환한다.

    #syncTerrainTransparency() -> boolean
        역할: 이미지 레이어 기준으로 실제 material 투명 상태를 동기화한다.

        인터페이스:
            반환: material 투명 상태가 바뀌었으면 true 다.

        의존:
            MeshPhongMaterial — 실제 투명 상태 확인과 반영; 속성 읽기: {transparent}; 속성 쓰기: {transparent}

        동작:
            기본 투명 상태와 현재 값이 다르면 바꾸고 변경 여부를 반환한다.

    #readyTerrainMaterial() -> void
        역할: terrain decal shader 주입과 program cache key 를 material 에 설정한다.

        처리 기준:
            사전 생성 key 를 돌려주므로 호출마다 새 문자열을 만들지 않는다.
            컴파일 시점에 decal uniform 과 이름이 겹치는 기본 shader uniform 을 복원용으로 보관한다.

        의존:
            MeshPhongMaterial — program key·컴파일 hook 설치와 첫 컴파일 요청; 속성 읽기: {defines}; 속성 쓰기: {customProgramCacheKey, onBeforeCompile, needsUpdate}

        동작:
            program cache key 함수를 설치한다.
            컴파일 hook 에서 shader 를 보관하고 기본 uniform 을 갈무리한 뒤 decal uniform 을 넣고 vertex·fragment shader 를 교체한다.
            첫 컴파일을 요청한다.

    #applyDefines(defines: Record<string, number> = {}) -> void
        역할: terrain decal define 을 모두 지운 뒤 새 define 을 넣는다.

        처리 기준:
            제거 목록에 있는 define 만 지우므로 terrain decal 이 아닌 define 은 그대로 남는다.

        의존:
            MeshPhongMaterial — material define 집합 확보와 교체; 속성 읽기: {defines}; 속성 쓰기: {defines}

        동작:
            define 집합을 확보하고 제거 목록의 key 를 지운 뒤 전달된 define 을 넣는다.

    #replaceUniformState(nextUniforms: object = {}) -> void
        역할: decal uniform 집합을 정규화해 교체하고 사라진 uniform 을 되돌린다.

        처리 기준:
            값은 복제하되 같은 규격의 DataTexture 는 GPU texture 를 재사용한다.
            새 상태에서 사라진 uniform 은 기본 shader 와 이름이 겹치면 컴파일 당시 객체로 복원한다.
            겹치지 않으면 컴파일된 WebGL uniform 조회가 같은 객체를 참조할 수 있어 키는 유지하고 값만 비운다.
            재사용하지 않는 이전 소유 texture 만 해제한다.

        동작:
            새 uniform 을 값 복제 규칙으로 정규화한다.
            컴파일된 shader 가 있으면 기본 uniform 을 갈무리하고 사라진 key 를 복원하거나 값만 비운다.
            교체로 버려지는 소유 texture 를 해제하고 decal 상태의 uniform 을 새 집합으로 바꾼다.

    #captureBaseShaderUniforms(shaderUniforms: object = {}, nextUniforms: object = {}, prevUniforms: object = {}) -> void
        역할: 새 decal uniform 과 이름이 겹치는 기본 shader uniform 객체를 복원용으로 보관한다.

        처리 기준:
            직전 decal uniform 에 이미 있던 key 와 이미 보관한 key 는 다시 담지 않는다.
            컴파일된 shader 에 없는 key 도 담지 않는다.

        동작:
            새 uniform key 를 순회해 조건에 맞는 기본 shader uniform 객체를 보관한다.

    #disposeUniformTextures(uniforms: object = {}) -> void
        역할: uniform map 이 소유한 texture 를 정리한다.

        처리 기준:
            참조만 보관한 외부 GPU texture 를 해제하면 소유자의 화면까지 깨지므로 소유 표시가 있는 texture 만 해제한다.

        동작:
            uniform 값을 순회해 소유 texture 를 해제한다.

    #disposeReplacedUniformTextures(prevUniforms: object = {}, nextUniforms: object = {}) -> void
        역할: 새 uniform 에서 재사용하지 않는 이전 texture 만 정리한다.

        처리 기준:
            같은 key 에 같은 객체가 그대로 쓰이면 해제하지 않는다.

        동작:
            이전 uniform 을 순회해 소유 texture 중 재사용하지 않는 것만 해제한다.
```

## 4. 공통 처리 기준과 제약

```spec
shader 문자열 조립은 GDecalTerrainShader 가 소유하며 이 단위는 주입 시점과 uniform 연결만 담당한다.
어떤 define 과 uniform 을 적용할지는 manager 가 결정하고 이 단위는 전달된 묶음을 그대로 반영한다.
합성 결과 RenderTarget texture 는 참조만 보관하며 복제하거나 해제하지 않는다.
program cache key 는 prewarm 의 예열 판단과 상태 적용의 program 변경 판단이 함께 쓰므로 fragment 경로를 가르는 define 을 빠뜨리면 두 판단이 함께 틀린다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
