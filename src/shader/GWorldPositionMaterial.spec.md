# GWorldPositionMaterial 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`GWorldPositionMaterial`은 `GWorldPositionShader` 정의로 장면 전체를 다시 그려 픽셀별 카메라 상대 월드 좌표를 렌더 타깃에 기록하는 `ShaderMaterial` 파생 재질이다. `scene.overrideMaterial`로 모든 객체가 하나의 인스턴스를 공유하므로, 객체 드로우 직전에 객체별 인스턴싱 define과 high/low 좌표 uniform을 맞추는 책임을 함께 진다.

### 1.2 책임 범위

- 위치 기록에 필요한 셰이더, 불투명·NoBlending·깊이 렌더 상태를 구성한다.
- 객체별로 인스턴싱 변형 define을 설정·복원하고 모델 위치 low 성분과 high/low 투영 사용 여부 uniform을 갱신한다.
- 드로우 대상 재질의 side를 따라 위치 패스의 face culling을 본 렌더와 일치시킨다.
- 제외 집합(`_excludeSet`)에 든 객체의 표본 표식(sampleValidity)을 -1.0으로 바꿔 고도 후처리 제외를 픽셀에 기록한다.
- 인스턴스 제외 맵(`_instanceExcludeMap`)에 마스크가 등록된 InstancedMesh2 드로우에 마스크 텍스처와 사용 플래그 uniform을 연결해 인스턴스 단위 제외를 셰이더에 전달한다.
- 책임 경계: 카메라 위치 high/low 성분과 viewMatrix3 갱신은 각 패스(`UPass.updateDecodeState()`)가, 렌더 타깃 관리와 결과 소비는 후처리 패스가 담당한다.

### 1.3 주요 동작 방식

생성 시 셰이더 원본의 uniform을 복제하고 렌더 상태를 고정한 뒤, three.js가 객체 드로우 직전마다 호출하는 `onBeforeRender` callback에서 객체 종류(일반, InstancedMesh2, high/low 인스턴싱)에 맞게 define과 객체별 uniform을 다시 채운다.

### 1.4 주요 사용처와 연계 대상

- `HeightPass`, `SunAmountPass`, `UDrawOverlayPass`가 각자 인스턴스를 생성하여 `UPass.renderOverride()`류 override 렌더에 사용한다.
- 인스턴싱 확장 모듈(InstancedMesh2)이 `_isInstanceMaterial`과 `userData.__variant`를 읽어 인스턴싱 셰이더 패치를 적용한다.
- `HeightPass`가 렌더마다 `_excludeSet`에 고도 후처리 제외 renderable 집합을, `_instanceExcludeMap`에 InstancedMesh별 제외 마스크 텍스처를 채워 넣으며, 다른 패스는 null로 두어 제외 판정 없이 사용한다.

## 2. 요구사항과 품질 기준

```spec
- scene.overrideMaterial로 모든 객체가 이 재질을 공유해도 각 객체의 인스턴싱 define과 모델 변환 uniform 상태가 다른 객체 드로우로 오염되어서는 안 된다.
- 위치 렌더는 NoBlending·불투명·깊이 검사·깊이 기록 상태를 유지하여 픽셀별 최전방 표면의 좌표만 남겨야 한다.
- 단, 제외 집합에 든 투명(transparent이며 표면 알파 상한이 1 미만) 객체는 colorWrite·depthWrite를 끈 드로우로 그려 위치 표본을 남기지 않아야 한다. 그래야 그 뒤 표면의 좌표가 보존되어 고도 범례와 등고선이 투시된다.
- 표면 알파 판정은 항상 상한으로 해야 한다. 반투명을 불투명으로 오판하면 투시가 되지 않을 뿐이지만, 불투명을 반투명으로 오판하면 제외 객체 실루엣 안으로 뒤 표면의 범례 색이 새어 들어와 제외 계약이 깨진다.
```

## 3. 정규 자연어 수도코드

```spec
INSTANCED_MESH_HIGHLOW_VARIANT: number = 1
    InstancedMesh2MaterialVariant.HIGHLOW 값의 모듈 로컬 사본이며 인스턴싱 확장 모듈 전체를 역참조하지 않기 위해 둔다.

getSurfaceOpacityUpperBound(material: {opacity?: number, uniforms?: Record<string, {value?: unknown}>} | undefined) -> number
    역할: 드로우 재질이 화면에 그릴 표면 알파의 상한을 구한다.
    인터페이스: 판정 근거를 찾지 못하면 1(불투명)을 반환한다.
    동작:
        uniforms가 없는 내장 재질은 material.opacity가 곧 표면 알파이므로 숫자면 그 값을, 아니면 1을 반환한다.
        uniforms.opacity 또는 uniforms.uOpacity의 값이 숫자면 그 값을 반환한다. three는 ShaderMaterial에 material.opacity를 uniform으로 올려주지 않아 ShaderMaterial의 material.opacity는 셰이더에 도달하지 않는 값이기 때문이다.
        uBaseOpacity 또는 uFlowOpacity를 가진 흐름 재질은 몸통·흐름 알파와, uSectionEnabled가 켜졌을 때의 uSectionOpacity까지 포함한 최댓값을 반환한다. 구간 강조는 그 구간의 알파를 덧칠이 아니라 치환하므로 한 픽셀이라도 불투명할 수 있으면 투시해서는 안 된다.
        알려진 알파 uniform이 없는 ShaderMaterial은 셰이더가 알파를 직접 계산해 판정 근거가 없으므로 1을 반환한다.

GWorldPositionMaterial extends ShaderMaterial 클래스 정의
    의존: ShaderMaterial — three.js 재질 기반 동작 제공; 상속: {ShaderMaterial}

    name: string
        UDEF.POST_MATERIAL.WORLD_POSITION 값의 재질 이름이다.

    uniforms: Record<string, {value: unknown}>
        GWorldPositionShader.uniforms를 복제한 이 인스턴스 소유의 uniform 집합이다.

    vertexShader, fragmentShader: string
        GWorldPositionShader의 GLSL 원문을 그대로 사용한다.

    transparent: boolean = false
        위치 기록은 항상 불투명 렌더로 수행한다.

    blending: number = NoBlending
        위치 값이 색상 블렌딩으로 훼손되지 않도록 블렌딩을 끈다.

    depthTest, depthWrite: boolean = true
        가림 관계가 위치 G-buffer에 보존되도록 깊이 검사와 기록을 켠다.
        depthWrite와 colorWrite는 onBeforeRender가 드로우마다 다시 정하며, 투명 제외 객체 드로우에서만 꺼진다.

    _isInstanceMaterial: boolean = true
        인스턴싱 확장 모듈이 인스턴싱 지원 재질로 인식하게 하는 플래그다.

    _positionInstancingVariant: number = 0
        직전 드로우 객체에 적용한 인스턴싱 변형이며 0 일반, 1 간접 인스턴싱, 2 간접 인스턴싱+high/low를 뜻한다.

    _minBounds: Vector3
        생성자 minBounds 인수 또는 기본 (0,0,0)이며 minBounds uniform 값으로 공유된다.

    _maxBounds: Vector3
        생성자 maxBounds 인수 또는 기본 (0,0,0)이며 maxBounds uniform 값으로 공유된다.

    _excludeSet: Set<Object3D> | null = null
        고도 후처리 제외 renderable 집합이며 null이면 제외 판정을 건너뛴다. HeightPass가 렌더마다 채워 넣는다.

    _instanceExcludeMap: Map<Object3D, DataTexture> | null = null
        InstancedMesh별 인스턴스 단위 제외 마스크 텍스처 맵이며 null이면 인스턴스 제외 판정을 건너뛴다. HeightPass가 렌더마다 채워 넣는다.

    side: number
        상속 face culling 상태이며 onBeforeRender가 드로우 대상 재질의 side로 객체별 교체한다.

    needsUpdate: boolean
        상속 재컴파일 요청 플래그이며 인스턴싱 define 변형이 바뀔 때 true로 설정한다.

    uniformsNeedUpdate: boolean
        상속 uniform 강제 재업로드 플래그이며 객체별 모델 변환 uniform을 같은 ShaderMaterial의 연속 드로우에도 반영하기 위해 각 onBeforeRender 끝에서 true로 설정한다.

    onBeforeRender: (renderer, scene, camera, geometry, object, group) => void
        공유 override 재질을 각 객체 드로우 직전에 그 객체 상태로 맞추는 callback이며 생성자에서 등록된다.
        객체의 isInstancedMesh2 여부와 positionsLowTexture 보유 여부로 인스턴싱 변형(0 일반, 1 간접, 2 간접+high/low)을 판정한다.
        드로우 대상 재질(배열이면 group의 materialIndex 항목, 없으면 첫 항목)의 side를 자신의 side에 기록한다. DoubleSide 재질의 뒤집힌 면이 기본 FrontSide 위치 패스에서만 컬링되면 그 픽셀에 뒤 표면의 위치가 찍혀 고도 범례·제외가 카메라 각도에 따라 면 단위로 어긋나기 때문이다. 재질이 없으면 FrontSide(0)를 사용하며, needsUpdate는 세우지 않는다 — culling 상태는 three가 드로우마다 material.side에서 직접 읽고 side가 바꾸는 FLIP_SIDED·DOUBLE_SIDED define은 이 셰이더가 사용하지 않으므로 재컴파일이 불필요하고, 세우면 side 경계마다 프로그램 캐시 키 재계산으로 프레임 비용이 커진다.
        현재 객체가 _excludeSet에 들었고 드로우 대상 재질이 transparent이며 getSurfaceOpacityUpperBound()가 1 미만이면 그 드로우만 colorWrite와 depthWrite를 false로, 그 밖에는 true로 매 드로우 대입한다. 위치 패스는 픽셀당 최전방 표면 한 장만 담는 단일 레이어라 제외 객체가 뒤 표면의 표본을 덮어써 버리므로, 실제로 뒤가 비쳐 보이는 제외 객체는 위치도 깊이도 기록하지 않아야 그 뒤 표면에 고도 범례와 등고선이 투시된다. 불투명 제외 객체는 기존대로 깊이를 점유해 뒤 표면의 범례 색이 실루엣 안으로 새어 들어오지 않게 한다. 공유 재질이므로 조건에 해당하지 않는 드로우에서도 반드시 true를 재대입해 직전 드로우 상태가 누수되지 않게 하며, 두 값은 프로그램 캐시 키가 아닌 드로우 상태라 재컴파일을 유발하지 않는다.
        판정한 변형이 _positionInstancingVariant와 다르면 저장 값을 교체하고 USE_INSTANCING_INDIRECT·USE_INSTANCING_HIGHLOW_POSITION define을 변형에 맞게 설정·제거한 뒤 needsUpdate를 true로 하여 재컴파일을 요청한다. InstancedMesh2의 onBeforeCompile이 defines를 직접 바꾸므로 일반 Mesh가 간접 인스턴싱 정의를 물려받지 않도록 객체별로 복원하는 동작이다.
        sampleValidity uniform이 있으면 현재 객체가 _excludeSet에 들었는지로 표본 표식(-1.0 제외, 1.0 유효)을 정하고, 값이 직전과 다를 때만 uniform을 교체하며 uniformsNeedUpdate를 true로 하여 공유 재질의 연속 드로우에서도 재업로드되게 한다.
        useInstanceExclusion·instanceExcludeTexture uniform이 있으면 간접 인스턴싱 객체에 한해 _instanceExcludeMap에서 현재 객체의 마스크 텍스처를 찾고, 마스크 유무에 따른 사용 플래그(1.0/0.0)와 텍스처를 uniform 쌍에 기록하되 직전 드로우와 다를 때만 교체하며 uniformsNeedUpdate를 true로 설정한다. 일반 객체나 마스크가 없는 인스턴스 메쉬는 사용 플래그 0.0과 null 텍스처로 되돌린다.
        uniforms가 없거나 객체 월드 행렬 요소가 없으면 이후 uniform 갱신을 건너뛴다.
        객체 월드 이동 성분과 Math.fround 반올림 값의 차를 modelPositionLow uniform에, 월드 행렬 3x3 성분을 modelMatrix3 uniform에 기록한다.
        객체 재질(배열이면 하나라도)의 userData.__highLowPatched 또는 객체 userData.useHighLowPosition이 true이면 useHighLowProjection uniform을 1.0, 아니면 0.0으로 기록한다.
        modelPositionLow·modelMatrix3·useHighLowProjection을 포함한 객체별 uniform이 현재 드로우에 반드시 업로드되도록 uniformsNeedUpdate를 true로 설정한다. 이 처리가 없으면 scene.overrideMaterial의 같은 재질을 쓰는 연속 지형 tile에서 직전 tile의 회전·scale이 남아 고도 범례가 타일 경계의 반복 띠나 사각 패턴으로 끊어질 수 있다.

    constructor(minBounds, maxBounds)
        역할: 위치 G-buffer 렌더에 필요한 셰이더, 렌더 상태와 객체별 갱신 callback을 구성한다.
        인터페이스: minBounds와 maxBounds는 장면 경계 Vector3이며 생략하면 (0,0,0)을 사용한다.
        의존:
            ShaderMaterial — 기반 재질 초기화와 상속 상태 기록; 생성자: {new ShaderMaterial()}; 속성 쓰기: {userData, defines}
            GWorldPositionShader — uniform 정의와 GLSL 원문 제공; 상수: {GWorldPositionShader}
            UniformsUtils — uniform 정의 복제; 정적 함수: {clone()}
            Vector3 — uniform 초기 벡터 생성; 생성자: {new Vector3()}
            Matrix3 — uniform 초기 행렬 생성; 생성자: {new Matrix3()}
            NoBlending — 블렌딩 끔 상수; 상수: {NoBlending}
            defaultValue — 경계 인수 기본값 대체; 함수: {defaultValue()}
            UDEF — 재질 이름 상수; 상수: {POST_MATERIAL.WORLD_POSITION}
        동작:
            셰이더 원본에서 uniform을 복제하고 GLSL 원문, 재질 이름과 불투명·NoBlending·깊이 상태, 인스턴싱 플래그, 변형 초기 상태를 설정한다.
            상속 userData의 __variant에 INSTANCED_MESH_HIGHLOW_VARIANT를 기록하여 인스턴스별 색상·사용자 uniform이 없는 변형으로 셰이더 패치가 이루어지게 한다.
            경계 인수를 기본값으로 보정해 _minBounds·_maxBounds에 보관하고 minBounds·maxBounds·cameraPositionLow·modelPositionLow·modelMatrix3·viewMatrix3·useHighLowProjection uniform 값을 초기화한다.
            객체별 인스턴싱 define과 uniform을 갱신하는 callback을 상속 onBeforeRender 필드에 등록한다.

    setUniform(key: string, value: unknown) -> void
        동작: 이름이 key인 uniform의 value를 입력 값으로 교체한다.
```

## 4. 공통 처리 기준과 제약

```spec
- 이 재질은 여러 객체가 공유하므로 객체별 상태는 onBeforeRender에서만 기록하고, 특정 객체를 가정한 값을 생성 시점에 고정해서는 안 된다.
- 같은 재질과 프로그램을 연속 사용하더라도 객체마다 달라지는 모델 위치·행렬 uniform은 매 드로우 강제 업로드해야 한다.
- minBounds·maxBounds uniform 값은 _minBounds·_maxBounds 객체를 참조로 공유하므로 외부에서 해당 Vector3를 수정하면 uniform 값도 함께 바뀐다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
