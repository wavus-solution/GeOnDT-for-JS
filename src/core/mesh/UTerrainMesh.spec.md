# UTerrainMesh 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UTerrainMesh`는 쿼드트리 타일 한 장의 지형 격자 위에 이미지 레이어의 material을 그리는 메시이다. 타일 메시의 geometry를 새로 만들지 않고 공유해 받아 위치·크기·바운딩 구를 타일과 같게 맞추고, material의 `onBeforeCompile`·`onBeforeRender`·`customProgramCacheKey` 훅을 감싸 밝기·대비·채도·색조·색상톤 보정과 지형 도장(terrain stamp) 오버레이 shader를 기본값이 아닐 때만 GLSL에 넣는다.

### 1.2 책임 범위

- 타일 geometry의 공유분을 받거나 전용 geometry를 사용하여 타일과 같은 위치·크기·바운딩 구를 가진 메시를 만든다.
- 색상 보정 uniform을 소유하고 getter·setter로 값을 바꾸며, 기본값과 다른 기능만 bit mask에 켜서 shader variant를 결정한다.
- material의 컴파일 전·렌더 전·program cache key 훅을 감싸 기존 훅(terrain decal 등)을 보존한 채 색상 보정과 도장 오버레이 shader를 합성한다.
- 렌더된 프레임마다 자신을 자원 관리자에 등록한다.

책임 경계: material 자체의 생성과 texture 적용, 메시의 장면 추가·제거와 geometry 공유분 반납은 `U3dImageLayer`가 담당한다. 도장 상태의 보관과 uniform 계산은 `UTerrainStamp`가, geometry 소유자 수는 `UPlaneBufferGeometry`가 담당한다.

### 1.3 주요 동작 방식

생성자는 타일 메시의 geometry를 `share()`로 받아(전용 geometry가 주어지면 그것을) 기반 메시를 만들고, 타일 메시의 위치·scale·바운딩 구 객체를 그대로 참조하며 행렬 자동 갱신을 끈다. 이어 material의 세 훅을 감싼다. 컴파일 전 훅은 모든 variant가 같은 uniform 객체를 공유하도록 uniform을 먼저 연결하고 mask에 켜진 기능의 GLSL만 주입한 뒤 기존 훅과 도장 오버레이를 붙인다. 렌더 전 훅은 도장 활성 여부가 바뀔 때만 material 재컴파일을 요청하고 도장 uniform을 갱신한다. cache key 훅은 기존 base key(또는 기존 `onBeforeCompile` 소스의 해시)와 기능 mask, 도장 여부를 조합해 짧은 key를 만들어 재사용한다. setter는 uniform 값을 바꾸고 기본값과의 차이가 mask를 실제로 바꿀 때만 재컴파일을 요청한다.

### 1.4 주요 사용처와 연계 대상

- `U3dImageLayer.createMeshFromTile()`이 타일마다 이 메시를 만들고 밝기·대비·채도·색조·색상톤 값, 레이어 이름, render order, `userData.tileKey`를 설정한 뒤 terrain decal manager에 등록한다. `U3dPatternXYZLayer`도 타일마다 이 메시를 만들어 render order와 갱신 버전만 설정한다.
- `U3dImageLayer`의 색상 setter들이 cache·group의 이 메시에 값을 다시 적용하고, `deleteGeometry()`가 `geometry.dispose()`로 공유분을 돌려준다.
- `UMesh.applyShadow()`가 생성자가 `userData.useShadow`에 저장한 타일 메시의 그림자 설정을 표시 시점에 복원한다.
- `UResourceManager`가 `onAfterRender()`로 등록된 메시 목록을 프레임 자원 추적에 사용한다.
- `CustomLand`, `UClipImageFilter`가 `userData.tileinfo`로 메시가 속한 타일 정보를 읽는다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
타일 geometry를 공유하는 메시는 생성 시 share()로 공유분을 받아야 하며, 정리 시 dispose()로 그 공유분만 돌려주어야 한다.
색상 보정 값이 바뀌어도 shader 기능 mask가 같으면 material을 재컴파일하지 않아야 하며, 기본값과 비기본값 사이를 오갈 때만 재컴파일을 요청해야 한다.
material에 이미 등록된 onBeforeCompile·onBeforeRender·customProgramCacheKey 훅은 이 메시의 훅이 감싼 뒤에도 그대로 실행되어야 한다.
```

## 3. 정규 자연어 수도코드

```spec
SHADER_FEATURE: {BRIGHTNESS: 1, CONTRAST: 2, HUE_ROTATION: 4, SATURATION: 8, COLOR_TONE: 16} = 상수 객체
    색상 보정 기능별 bit 값이며 켜진 bit의 조합이 shader variant와 program cache key를 결정한다.

hashShaderSource(source: string) -> string
    역할: 기존 onBeforeCompile 함수 소스를 짧은 program cache key 조각으로 축약한다.
    처리 기준: FNV-1a 32-bit 해시를 부호 없는 정수로 만들어 36진수 문자열로 반환한다.
    동작: source의 각 문자 코드를 XOR하고 16777619를 곱하는 반복으로 해시를 만들어 36진수 문자열로 반환한다.

option 타입 정의
    tile?: U3dQuadTile
        생성자가 입력 tile로 덮어써 기반 메시에 전달하는 타일
    ownerLayer?: any
        도장 상태 조회에 쓰는 소유 레이어이며 생략하면 도장 오버레이가 없는 메시가 된다.
    geometry?: UPlaneBufferGeometry
        지정하면 타일 geometry를 공유하지 않고 이 geometry를 그대로 쓴다.

UTerrainMesh extends UMesh 클래스 정의
    의존:
        UMesh — 타일 참조·레이어 이름·그림자 적용과 mesh 공통 상태 제공; 상속: {UMesh}
        GBrightnessBlendingShader — 밝기 uniform 초기 객체; 함수: {getBrightnessUniform()}
        GContrastBlendingShader — 대비 uniform 초기 객체; 함수: {getContrastUniform()}
        GSaturationBlendingShader — 채도 uniform 초기 객체; 함수: {getSaturationUniform()}
        GHueRotationBlendingShader — 색조 회전 uniform 초기 객체; 함수: {getHueRotationUniform()}
        GColorToneBlendingShader — 색상톤 uniform 초기 객체; 함수: {getColorToneUniform()}

    #boundingSphere: Three.js Sphere | null | undefined = undefined
        타일 메시의 바운딩 구 객체를 그대로 참조한다.

    #tileScale: Three.js Vector3
        타일 메시의 scale 객체를 그대로 참조하며 boundingSphere getter가 이 값으로 자기 scale을 맞춘다.

    #shaderFeatureMask: number = 0
        현재 GLSL에 실제로 포함할 색상 보정 기능의 SHADER_FEATURE bit 조합

    #terrainStampShaderEnabled: boolean = false
        마지막 렌더 전 훅에서 관찰한 도장 오버레이 활성 여부

    #terrainStampLayer: any = undefined
        도장 상태를 조회할 소유 레이어

    override geometry: UPlaneBufferGeometry
        기반 메시가 받은 타일 공유 geometry 또는 전용 geometry이며 초기값 없는 재선언이다. [확인 Q-003]

    override material: Material
        훅을 감싼 대상 material이며 초기값 없는 재선언이다. [확인 Q-003]

    _brightnessUniforms, _contrastUniforms, _saturationUniforms, _hueRotationUniforms: {value: number} = 각 shader 모듈의 기본값 uniform
        밝기·대비·채도·색조 회전 uniform이며 모든 program variant가 같은 객체를 공유한다.

    _colorToneUniforms: {light: {value: Color}, dark: {value: Color}, lightEnabled: {value: boolean}, darkEnabled: {value: boolean}, lightExposure: {value: number}, darkExposure: {value: number}} = 색상톤 기본값 uniform 묶음
        밝은·어두운 영역 색상톤과 활성 여부, 민감도 uniform

    constructor(tile: U3dQuadTile, material: Material, opt: option = {})
        역할: 타일 geometry를 공유하는 메시를 만들고 material 훅에 색상 보정과 도장 오버레이를 합성한다.

        인터페이스:
            tile은 geometry·위치·scale·바운딩 구·그림자 설정을 제공하는 타일이며 tile._mesh.geometry가 있어야 한다.
            material은 이 메시 전용 material이며 세 훅을 감싸 덮어쓴다.
            opt.geometry를 주면 공유 대신 그 geometry를 쓰고, opt.ownerLayer가 도장 상태의 소유 레이어가 된다.

        처리 기준:
            tile._mesh.geometry가 없으면 오류 코드 4015813을 기록하고 기반 생성자를 호출하지 않은 채 반환한다. [확인 Q-001]
            opt.geometry가 없으면 tile._mesh.geometry.share()로 공유분을 받고, 있으면 share()를 호출하지 않는다.
            opt.tile은 입력 tile로 덮어쓴다.
            메시의 castShadow·receiveShadow는 false로 두고 타일 메시의 두 값을 userData.useShadow에 보관한다.
            material의 기존 onBeforeCompile·onBeforeRender·customProgramCacheKey는 보관 뒤 감싼 훅 안에서 그대로 호출한다. 훅은 이 메시 하나를 가리키므로 material은 메시마다 달라야 한다. [확인 Q-002]
            기존 customProgramCacheKey가 Material 기본 구현과 같으면 기존 onBeforeCompile 소스의 해시로 만든 `M_<해시>`를 base key로 쓰고, 다르면 기존 훅이 돌려주는 key를 base key로 쓴다.
            타일 메시에 바운딩 구가 없으면 오류 코드 0151609를 기록하고 #boundingSphere를 undefined로 둔다.

        의존:
            __GError__ — 형상 부재와 바운딩 구 부재 오류 기록; 함수: {__GError__()}
            UPlaneBufferGeometry — 타일 geometry 공유분 획득; 함수: {share()}
            UMesh — 기반 메시 초기화와 타일 참조 저장; 함수: {constructor()}
            U3dQuadTile — 타일 키·타일 메시·타일 정보 조회; 함수: {info()}; 속성 읽기: {_key, _mesh}
            UTileMesh — 위치·scale·바운딩 구·그림자 설정과 geometry 제공; 속성 읽기: {geometry, scale, position, castShadow, receiveShadow, boundingSphere}
            ThreeExtend — 행렬 자동 갱신 해제와 현재 행렬 계산; 함수: {setManualUpdate()}
            Three.js — 위치 복사와 기본 cache key 구현 비교; 함수: {Vector3.copy()}; 속성 읽기: {Material.prototype.customProgramCacheKey}
            UDEF — 타일 메시 종류 식별자; 상수: {UMESH_TYPE._tile}

        동작:
            타일 메시 geometry가 없으면 오류를 기록하고 종료한다. [확인 Q-001]
            opt.tile을 tile로 두고 전용 geometry 또는 공유받은 타일 geometry로 기반 메시를 만든다.
            클래스 식별자를 기록하고 이름을 타일 키로, visible을 false로 둔다.
            타일 메시의 scale 객체를 #tileScale로 참조하고 위치를 복사한 뒤 행렬 자동 갱신을 끄고 현재 행렬을 계산한다.
            그림자를 끄고 타일 메시의 그림자 설정을 userData.useShadow에 보관하며 opt.ownerLayer를 #terrainStampLayer로 둔다.
            material의 기존 세 훅과 base key 계산 방식을 보관하고, 기존 onBeforeCompile 소스의 해시로 기본 base key를 만든다.
            material의 onBeforeCompile, onBeforeRender, customProgramCacheKey를 이 메시의 uniform·mask·도장 상태를 참조하는 훅으로 교체한다.
            _utype을 타일 메시 종류로 두고 userData.tileinfo에 타일의 x·y·level·영역·키 정보를 저장한다.
            타일 메시의 바운딩 구 객체를 #boundingSphere로 참조하고, 없으면 오류를 기록한다.

    material.onBeforeCompile(shader: WebGLProgramParametersWithUniforms, renderer: WebGLRenderer) -> void
        역할: 컴파일될 shader에 색상 보정 uniform·GLSL과 기존 훅, 도장 오버레이를 합성한다.

        처리 기준:
            열 개의 색상 보정 uniform은 mask와 무관하게 항상 shader.uniforms에 연결하여 이전 program variant를 재사용할 때도 같은 객체를 공유한다.
            GLSL 주입 순서는 색상톤, 밝기, 대비, 색조 회전, 채도이며 mask에 켜진 기능만 주입한다.
            기존 onBeforeCompile은 material을 this로 하여 색상 보정 뒤에 호출한다.
            소유 레이어의 도장 render state가 있으면 그 uniform으로 도장 오버레이 shader를 마지막에 붙인다.

        의존:
            GColorToneBlendingShader — 색상톤 GLSL 주입; 함수: {addColorToneShader()}
            GBrightnessBlendingShader — 밝기 GLSL 주입; 함수: {addBrightnessShader()}
            GContrastBlendingShader — 대비 GLSL 주입; 함수: {addContrastShader()}
            GHueRotationBlendingShader — 색조 회전 GLSL 주입; 함수: {addHueRotationShader()}
            GSaturationBlendingShader — 채도 GLSL 주입; 함수: {addSaturationShader()}
            UTerrainStamp — 소유 레이어의 도장 render state 조회; 정적 함수: {getRenderState()}
            GTerrainOverlayShader — 도장 오버레이 GLSL 주입; 함수: {addTerrainOverlayShader()}
            기존 onBeforeCompile(prevBeforeCompile) — material에 먼저 등록된 shader 처리 실행; 콜백: {prevBeforeCompile.call()}

        동작:
            u_brightness, u_contrast, u_hue_rotation, u_saturation과 여섯 색상톤 uniform을 이 메시의 uniform 객체로 연결한다.
            mask에 켜진 기능만 순서대로 GLSL을 주입한다.
            보관한 기존 onBeforeCompile을 호출한다.
            도장 render state가 있으면 그 uniform으로 오버레이 shader를 붙인다.

    material.onBeforeRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, object: Object3D, group: Group) -> void
        역할: 렌더 직전에 도장 오버레이 활성 여부 변화를 반영하고 도장 uniform을 갱신한다.

        처리 기준:
            도장 활성 여부가 직전 관찰값과 다를 때만 material.needsUpdate를 true로 하여 다음 렌더에서 맞는 variant를 고르게 한다.
            도장이 활성이면 소유 레이어의 도장 uniform을 현재 renderer·scene·camera·geometry·object·group으로 갱신한다.
            기존 onBeforeRender는 material을 this로 하여 마지막에 호출한다.

        의존:
            UTerrainStamp — 도장 활성 판정과 uniform 갱신; 정적 함수: {getRenderState(), updateRenderUniforms()}
            Three.js Material — 재컴파일 요청; 속성 쓰기: {needsUpdate}
            기존 onBeforeRender(prevBeforeRender) — material에 먼저 등록된 렌더 전 처리 실행; 콜백: {prevBeforeRender.call()}

        동작:
            도장 render state 존재 여부를 활성값으로 읽고 #terrainStampShaderEnabled와 다르면 갱신한 뒤 material 재컴파일을 요청한다.
            활성이면 도장 uniform을 현재 렌더 문맥으로 갱신한다.
            보관한 기존 onBeforeRender를 호출한다.

    material.customProgramCacheKey() -> string
        역할: base key, 색상 기능 mask, 도장 여부를 조합한 program cache key를 만든다.

        처리 기준:
            base key는 기존 구현이 Material 기본이면 생성자가 만든 `M_<해시>`, 아니면 기존 훅의 반환값이며 반환값이 없으면 `M_<해시>`로 대체한다.
            base key가 직전과 다르면 mask별 key 캐시를 비운다.
            mask별 key는 `<base>|UTC_<mask의 36진수>`로 한 번만 만들어 재사용한다.
            도장이 활성이면 뒤에 `|` 와 도장 오버레이 cache key를 붙인다.

        의존:
            기존 customProgramCacheKey(prevCustomProgramCacheKey) — 기존 base key 계산; 콜백: {prevCustomProgramCacheKey.call()}
            GTerrainOverlayShader — 도장 오버레이 cache key; 상수: {TERRAIN_OVERLAY_SHADER.CACHE_KEY}
            UTerrainStamp — 도장 활성 판정; 정적 함수: {getRenderState()}

        동작:
            base key를 정하고 직전 base key와 다르면 캐시를 비운 뒤 기억한다.
            현재 mask의 key가 없으면 만들어 캐시하고, 도장 활성이면 오버레이 cache key를 붙여 반환한다.

    색상 보정 값 책임 그룹
        역할: 색상 보정 uniform 값을 읽고 쓰며 기본값 여부에 따라 shader 기능 bit를 갱신한다.

        get brightness() -> number | null
            동작: _brightnessUniforms가 있으면 그 value를, 없으면 null을 반환한다.

        set brightness(value: number | null) -> void
            처리 기준: null이면 DEFAULT_BRIGHTNESS(1.0)를 적용하고, 적용값이 기본값과 다를 때만 BRIGHTNESS bit를 켠다.
            의존: GBrightnessBlendingShader — 기본값; 상수: {DEFAULT_BRIGHTNESS}
            동작: uniform이 없으면 종료하고, 있으면 값을 기록한 뒤 기본값 여부로 기능 bit를 갱신한다.

        get contrast() -> number | null
            동작: _contrastUniforms가 있으면 그 value를, 없으면 null을 반환한다.

        set contrast(value: number | null) -> void
            처리 기준: null이면 DEFAULT_CONTRAST(1.0)를 적용하고, 적용값이 기본값과 다를 때만 CONTRAST bit를 켠다.
            의존: GContrastBlendingShader — 기본값; 상수: {DEFAULT_CONTRAST}
            동작: uniform이 없으면 종료하고, 있으면 값을 기록한 뒤 기본값 여부로 기능 bit를 갱신한다.

        get saturation() -> number | null
            동작: _saturationUniforms가 있으면 그 value를, 없으면 null을 반환한다.

        set saturation(value: number | null) -> void
            처리 기준: null이면 DEFAULT_SATURATION(1.0)를 적용하고, 적용값이 기본값과 다를 때만 SATURATION bit를 켠다.
            의존: GSaturationBlendingShader — 기본값; 상수: {DEFAULT_SATURATION}
            동작: uniform이 없으면 종료하고, 있으면 값을 기록한 뒤 기본값 여부로 기능 bit를 갱신한다.

        get hueRotation() -> number | null
            동작: _hueRotationUniforms가 있으면 그 value를, 없으면 null을 반환한다.

        set hueRotation(value: number | null) -> void
            처리 기준: null이면 DEFAULT_HUE_ROTATION(0.0)을 적용하고, 적용값이 기본값과 다를 때만 HUE_ROTATION bit를 켠다.
            의존: GHueRotationBlendingShader — 기본값; 상수: {DEFAULT_HUE_ROTATION}
            동작: uniform이 없으면 종료하고, 있으면 값을 기록한 뒤 기본값 여부로 기능 bit를 갱신한다.

    색상톤 책임 그룹
        역할: 밝은·어두운 영역 색상톤의 색, 활성 여부, 민감도를 읽고 쓴다. COLOR_TONE bit는 활성 여부로만 결정된다.

        get lightColorTone() -> Color | null
            동작: _colorToneUniforms가 없으면 null, 있으면 light.value 색 객체를 반환한다.

        set lightColorTone(value: ColorRepresentation | null) -> void
            처리 기준: null이면 DEFAULT_LIGHT_COLOR_TONE(0xffffff)을 적용하며 기능 bit는 바꾸지 않는다.
            의존:
                GColorToneBlendingShader — 기본 밝은 색; 상수: {DEFAULT_LIGHT_COLOR_TONE}
                Three.js — 색 객체 값 갱신; 함수: {Color.set()}
            동작: uniform이 없으면 종료하고, 있으면 light.value 색을 입력값 또는 기본값으로 설정한다.

        get darkColorTone() -> Color | null
            동작: _colorToneUniforms가 없으면 null, 있으면 dark.value 색 객체를 반환한다.

        set darkColorTone(value: ColorRepresentation | null) -> void
            처리 기준: null이면 DEFAULT_DARK_COLOR_TONE(0x000000)을 적용하며 기능 bit는 바꾸지 않는다.
            의존:
                GColorToneBlendingShader — 기본 어두운 색; 상수: {DEFAULT_DARK_COLOR_TONE}
                Three.js — 색 객체 값 갱신; 함수: {Color.set()}
            동작: uniform이 없으면 종료하고, 있으면 dark.value 색을 입력값 또는 기본값으로 설정한다.

        get lightColorToneEnabled() -> boolean | null
            동작: _colorToneUniforms가 없으면 null, 있으면 lightEnabled.value를 반환한다.

        set lightColorToneEnabled(value: boolean | null) -> void
            처리 기준: null이면 DEFAULT_LIGHT_COLOR_TONE_ENABLED(false)를 적용한다.
            의존: GColorToneBlendingShader — 기본 활성값; 상수: {DEFAULT_LIGHT_COLOR_TONE_ENABLED}
            동작: uniform이 없으면 종료하고, 있으면 lightEnabled.value를 기록한 뒤 색상톤 기능 bit를 다시 판정한다.

        get darkColorToneEnabled() -> boolean | null
            동작: _colorToneUniforms가 없으면 null, 있으면 darkEnabled.value를 반환한다.

        set darkColorToneEnabled(value: boolean | null) -> void
            처리 기준: null이면 DEFAULT_DARK_COLOR_TONE_ENABLED(false)를 적용한다.
            의존: GColorToneBlendingShader — 기본 활성값; 상수: {DEFAULT_DARK_COLOR_TONE_ENABLED}
            동작: uniform이 없으면 종료하고, 있으면 darkEnabled.value를 기록한 뒤 색상톤 기능 bit를 다시 판정한다.

        get lightColorToneExposure() -> number | null
            동작: _colorToneUniforms가 없으면 null, 있으면 lightExposure.value를 반환한다.

        set lightColorToneExposure(value: number | null) -> void
            처리 기준: null이면 DEFAULT_LIGHT_COLOR_TONE_EXPOSURE(1.0)를 적용하며 기능 bit는 바꾸지 않는다.
            의존: GColorToneBlendingShader — 기본 민감도; 상수: {DEFAULT_LIGHT_COLOR_TONE_EXPOSURE}
            동작: uniform이 없으면 종료하고, 있으면 lightExposure.value를 입력값 또는 기본값으로 기록한다.

        get darkColorToneExposure() -> number | null
            동작: _colorToneUniforms가 없으면 null, 있으면 darkExposure.value를 반환한다.

        set darkColorToneExposure(value: number | null) -> void
            처리 기준: null이면 DEFAULT_DARK_COLOR_TONE_EXPOSURE(1.0)를 적용하며 기능 bit는 바꾸지 않는다.
            의존: GColorToneBlendingShader — 기본 민감도; 상수: {DEFAULT_DARK_COLOR_TONE_EXPOSURE}
            동작: uniform이 없으면 종료하고, 있으면 darkExposure.value를 입력값 또는 기본값으로 기록한다.

    #hasShaderFeature(feature: number) -> boolean
        동작: #shaderFeatureMask에 feature bit가 켜져 있으면 true, 아니면 false를 반환한다.

    #setShaderFeature(feature: number, enabled: boolean) -> void
        역할: 기능 bit를 켜거나 끄고 mask가 실제로 바뀔 때만 material 재컴파일을 요청한다.
        처리 기준: 같은 활성 상태에서 값만 바뀐 호출은 mask가 같으므로 needsUpdate를 건드리지 않는다.
        의존: Three.js Material — 재컴파일 요청; 속성 쓰기: {needsUpdate}
        동작:
            enabled이면 OR로 bit를 켠, 아니면 반전 mask와 AND로 bit를 끈 다음 mask를 계산한다.
            다음 mask가 현재와 같으면 종료하고, 다르면 mask를 바꾸고 material.needsUpdate를 true로 둔다.

    #updateColorToneShaderFeature() -> void
        처리 기준: 밝은 영역 또는 어두운 영역 중 하나라도 활성이면 COLOR_TONE bit를 켜고 둘 다 꺼졌을 때만 끈다.
        동작: lightEnabled 또는 darkEnabled 값으로 활성 여부를 정해 COLOR_TONE bit를 갱신한다.

    get boundingSphere() -> Three.js Sphere | null | undefined
        역할: 타일과 같은 바운딩 구를 돌려주면서 메시 scale을 타일 메시 scale과 맞춘다.
        처리 기준: 자기 scale이 #tileScale과 다르면 scale을 복사하고 행렬을 다시 계산하는 부수 효과가 있다. [확인 Q-004]
        의존:
            Three.js — scale 비교와 복사; 함수: {Vector3.equals(), Vector3.copy()}
            ThreeExtend — 행렬 자동 갱신 해제와 현재 행렬 계산; 함수: {setManualUpdate()}
        동작:
            scale이 #tileScale과 다르면 #tileScale을 복사하고 행렬을 다시 계산한다.
            #boundingSphere를 반환한다.

    set boundingSphere(value: Three.js Sphere | null | undefined) -> void
        처리 기준: falsy 값만 받아들여 #boundingSphere를 비우고, 그 외 값은 오류 코드 0151896을 기록한 뒤 무시한다. [확인 Q-004]
        의존: __GError__ — 바운딩 구 재설정 시도 오류 기록; 함수: {__GError__()}
        동작: value가 falsy이면 #boundingSphere에 저장하고 종료하며, 아니면 오류를 기록한다.

    override onAfterRender() -> void
        역할: 렌더된 메시를 프레임 자원 관리자에 등록한다.
        의존: UDEF — 자원 관리자의 렌더 객체 등록; 함수: {resourceManager.addObjectResource()}
        동작: 자원 관리자에 이 메시를 현재 프레임 렌더 객체로 추가한다.
```

## 4. 공통 처리 기준과 제약

```spec
material의 세 훅과 uniform 객체는 메시 하나에 묶이므로 한 material을 여러 UTerrainMesh가 공유하면 나중 메시의 훅이 앞선 메시의 훅을 감싸 두 메시의 uniform 연결과 GLSL 주입이 중첩 실행된다.
색상 보정 uniform 객체는 생성 시 한 번 만들어 모든 program variant가 공유하며, 값 변경은 uniform만 바꾸고 GLSL 포함 여부는 기능 bit mask가 결정한다.
#tileScale과 #boundingSphere는 타일 메시의 Vector3·Sphere 객체를 참조로 공유하므로 타일 쪽 값 변화가 그대로 반영된다.
이 단위는 spec 검사기가 지원하지 않는 TypeScript 소스이므로 동기화 기준 블록을 두지 않으며, source 대조는 수동 검토로 대신한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
