# GWorldPositionShader 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`GWorldPositionShader`는 장면의 각 픽셀이 가리키는 표면의 카메라 상대 월드 좌표를 렌더 타깃 색상으로 기록하는 three.js `ShaderMaterial`용 셰이더 정의다. 위치 기반 후처리 분석(고도 범례, 등고선, 일조량, 오버레이)이 사용할 픽셀 위치 G-buffer를 만든다.

### 1.2 책임 범위

- `ShaderMaterial` 생성에 필요한 `name`, `uniforms`, `vertexShader`, `fragmentShader` 정의를 제공한다.
- 일반 Mesh, BatchedMesh, 인스턴싱, 간접 인스턴싱과 high/low 분해 좌표 경로에서 정점의 카메라 상대 월드 좌표를 계산한다.
- 책임 경계: uniform 값의 프레임별 갱신, 객체별 define 분기와 렌더 타깃 관리는 `GWorldPositionMaterial`과 각 후처리 패스가 담당한다.

### 1.3 주요 동작 방식

정점 셰이더가 인스턴싱·배칭 여부에 따라 정점의 월드 좌표를 카메라 위치 기준 상대 좌표(`vWorldPosition`)로 계산하고, 표본 표식(1.0 유효, -1.0 고도 후처리 제외)을 `sampleValidity` uniform과 간접 인스턴싱의 인스턴스 제외 마스크 텍스처로 확정해 varying으로 넘긴다. 프래그먼트 셰이더는 상대 좌표를 RGB에, 표본 표식을 알파에 기록한다. 32bit float 정밀도 손실을 줄이기 위해 카메라·모델 위치를 high/low 성분으로 분해해 합산하는 상대 좌표 경로를 조건부로 사용하고, 렌더러가 로그 깊이 버퍼를 사용하면 다른 화면·전용 위치 재질과 같은 로그 깊이를 기록한다.

### 1.4 주요 사용처와 연계 대상

- `GWorldPositionMaterial`이 이 정의를 복제해 uniform을 소유·갱신한다.
- `HeightPass`, `SunAmountPass`, `UDrawOverlayPass`가 이 셰이더로 찍은 위치 렌더 타깃을 소비하며, 알파 0(클리어 값)·1.0(유효 기록)·-1.0(고도 후처리 제외 표식)으로 표본 상태를 판정한다.

## 3. 정규 자연어 수도코드

```spec
GWorldPositionShader: 모듈 상수 셰이더 정의 객체
    ShaderMaterial 구성에 필요한 name, uniforms, vertexShader, fragmentShader를 담아 export한다.

GWorldPositionShader.name: string = 'GPositionShader'
    셰이더 정의 이름이며 모듈 변수명과 다른 값이다.

GWorldPositionShader.uniforms: Record<string, {value: unknown}>
    셰이더가 사용하는 uniform 초기 정의 집합이며 사용 시 UniformsUtils.clone으로 복제된다.

GWorldPositionShader.uniforms.minBounds, GWorldPositionShader.uniforms.maxBounds: {value: null}
    장면 경계 uniform 자리이며 프래그먼트 셰이더에 선언만 있고 현재 계산에는 사용되지 않는다. [확인 Q-001]

GWorldPositionShader.uniforms.cameraPositionLow: {value: null}
    카메라 월드 위치의 low 성분이며 high/low 상대 좌표 계산에 사용한다.

GWorldPositionShader.uniforms.modelPositionLow: {value: null}
    모델 월드 이동의 low 성분이며 high/low 상대 좌표 계산에 사용한다.

GWorldPositionShader.uniforms.modelMatrix3: {value: null}
    모델 월드 행렬의 회전·스케일 3x3 성분이며 이동 성분 없이 로컬 좌표를 회전한다.

GWorldPositionShader.uniforms.viewMatrix3: {value: null}
    뷰 행렬의 회전 3x3 성분이며 카메라 상대 좌표를 뷰 공간으로 회전한다.

GWorldPositionShader.uniforms.useHighLowProjection: {value: 0.0}
    0.5 초과이면 인스턴싱 high/low define이 없는 경로에서도 상대 좌표 기반 투영을 사용한다.

GWorldPositionShader.uniforms.sampleValidity: {value: 1.0}
    객체 단위 표본 표식이며 1.0은 유효 표본, -1.0은 고도 후처리 제외 표식이다. GWorldPositionMaterial이 객체별로 채운다.

GWorldPositionShader.uniforms.sampleValidity.value: number = 1.0
    복제 전 초기값이며 기본은 유효 표본이다.

GWorldPositionShader.uniforms.useInstanceExclusion: {value: 0.0}
    0.5 초과이면 간접 인스턴싱 경로에서 인스턴스 제외 마스크 텍스처 조회를 수행한다. GWorldPositionMaterial이 객체별로 채운다.

GWorldPositionShader.uniforms.instanceExcludeTexture: {value: null}
    인스턴스 단위 고도 후처리 제외 마스크(R 채널, 0.5 초과 = 제외)이며 간접 인스턴싱 경로에서만 선언·사용된다.

GWorldPositionShader.uniforms.useInstanceExclusion.value: number = 0.0
    복제 전 초기값이며 기본적으로 인스턴스 제외 조회를 사용하지 않는다.

GWorldPositionShader.uniforms.instanceExcludeTexture.value: null
    복제 전 초기값이며 실제 마스크 텍스처는 GWorldPositionMaterial이 드로우별로 채운다.

GWorldPositionShader.uniforms.minBounds.value, GWorldPositionShader.uniforms.maxBounds.value, GWorldPositionShader.uniforms.cameraPositionLow.value, GWorldPositionShader.uniforms.modelPositionLow.value, GWorldPositionShader.uniforms.modelMatrix3.value, GWorldPositionShader.uniforms.viewMatrix3.value: null
    복제 전 초기값이며 실제 값은 재질과 패스가 렌더 시점에 채운다.

GWorldPositionShader.uniforms.useHighLowProjection.value: number = 0.0
    복제 전 초기값이며 기본적으로 상대 좌표 투영을 사용하지 않는다.

GWorldPositionShader.vertexShader: string
    GLSL 정점 셰이더 원문이며 다음 순서로 정점을 처리한다.
        three.js common과 로그 깊이 선언 chunk를 포함해 투영 뒤 로그 깊이 계산에 필요한 공통 함수와 varying을 준비한다.
        three.js batching chunk를 포함하고 USE_BATCHING이 정의되면 batchingMatrix로 로컬 좌표를 변환한다.
        표본 표식을 sampleValidity uniform으로 시작하고, USE_INSTANCING_INDIRECT가 정의되고 useInstanceExclusion이 0.5 초과이면 인스턴싱 확장이 주입한 instanceIndex attribute(원본 인스턴스 id)로 instanceExcludeTexture를 texelFetch(index % 폭, index / 폭)하여 R값이 0.5 초과인 인스턴스의 표식을 -1.0으로 바꾼 뒤 varying vSampleValidity로 넘긴다.
        USE_INSTANCING 또는 USE_INSTANCING_INDIRECT가 정의된 인스턴싱 경로에서 다음과 같이 분기한다.
            USE_INSTANCING_HIGHLOW_POSITION이 정의되면 instanceMatrix의 이동 high 성분, 확장 모듈이 제공하는 인스턴스 low 성분(getInstancedPositionLow, combinedLow)과 모델 행렬을 조합해 카메라 상대 좌표를 만들고 viewMatrix3 기반 뷰 좌표를 사용한다.
            정의되지 않으면 instanceMatrix로 변환한 좌표에 modelPositionLow와 cameraPositionLow 차이를 더해 카메라 상대 좌표를 만들고, uniform useHighLowProjection이 0.5 초과일 때만 viewMatrix3 기반 뷰 좌표로 교체한다.
        인스턴싱이 아니면 모델 행렬 회전 성분과 high/low 이동 성분으로 카메라 상대 좌표를 만들고, uniform useHighLowProjection이 0.5 초과일 때만 viewMatrix3 기반 뷰 좌표로 교체한다.
        계산한 카메라 상대 좌표를 varying vWorldPosition으로 넘기고 projectionMatrix와 뷰 좌표로 gl_Position을 확정한 뒤 로그 깊이 정점 chunk로 깊이 계산용 값을 넘긴다.

GWorldPositionShader.fragmentShader: string
    GLSL 프래그먼트 셰이더 원문이다.
        vWorldPosition을 RGB에, varying vSampleValidity 값을 알파에 기록한 vec4를 출력한다.
        렌더러가 USE_LOGDEPTHBUF를 정의하면 로그 깊이 프래그먼트 chunk로 gl_FragDepth를 기록하고, 그렇지 않으면 기본 투영 깊이를 유지한다.
```

## 4. 공통 처리 기준과 제약

```spec
- vWorldPosition은 절대 월드 좌표가 아니라 카메라 위치를 뺀 카메라 상대 월드 좌표이며, 소비자가 절대 좌표를 복원하려면 카메라 위치 high/low 성분을 더해야 한다.
- 프래그먼트 알파는 표본 상태 계약이다: 0(클리어)은 지오메트리 없음, 1.0은 유효 표본, -1.0은 깊이는 기록하되 고도 범례·등고선을 적용하지 않는 제외 표식이며 임의로 변경해서는 안 된다.
- 같은 위치 렌더 타깃에 추가로 그리는 전용 월드 위치 재질과의 깊이 비교가 일관되도록 렌더러의 USE_LOGDEPTHBUF 정의를 따르며, 로그 깊이가 비활성화된 렌더러에서는 기본 투영 깊이를 사용한다.
- USE_INSTANCING_HIGHLOW_POSITION 경로의 getInstancedPositionLow()와 combinedLow, USE_INSTANCING_INDIRECT 경로의 instanceIndex attribute는 인스턴싱 확장 모듈이 셰이더 패치로 제공하는 심벌이며 이 정의 안에는 선언이 없다.
- 인스턴스 제외 마스크의 texel 배치는 index % 텍스처폭, index / 텍스처폭이며 HeightPass의 마스크 텍스처 생성 수식과 같아야 한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
