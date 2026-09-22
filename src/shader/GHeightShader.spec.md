# GHeightShader 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`GHeightShader`는 원본 장면 색상(`tDiffuse`)과 픽셀 위치 G-buffer(`tPosition`)를 입력으로 받아, 픽셀 고도에 따른 사용자 범례 색상과 등고선을 원본 색 위에 합성하는 풀스크린 후처리 셰이더 정의다.

### 1.2 책임 범위

- 위치 표본의 유효성 판정과 절대 고도 복원 규칙을 정의한다.
- 사용자 범례 스타일 텍스처를 해석해 고도별 색상을 선택·보간한다.
- 등고선 간격·스타일 텍스처를 해석해 안티에일리어싱된 등고선 마스크를 계산한다.
- 책임 경계: uniform 값의 갱신과 위치 렌더 타깃 생성은 `HeightPass`가, 스타일 텍스처 생성은 `UAnalyHeight` 계열 분석이 담당한다.

### 1.3 주요 동작 방식

프래그먼트 셰이더가 픽셀마다 위치 표본을 읽어 알파로 유효성을 판정하고, 유효한 픽셀의 절대 고도를 카메라 위치 high/low uniform으로 복원한 뒤, `isApply`가 참이면 범례 색상을, `isTopo`가 참이면 등고선을 원본 색에 혼합한다. 위치 표본이 없는 픽셀은 원본 색을 그대로 통과시킨다.

### 1.4 주요 사용처와 연계 대상

- `HeightPass`가 이 정의로 합성용 `ShaderMaterial`을 만들고 프레임마다 uniform을 채운다.
- `tPosition`은 `GWorldPositionShader`가 기록한 카메라 상대 좌표(RGB)와 유효 표식(알파) 계약을 따른다.
- `UAnalyHeight`가 `userStyleData`·`styleMode`·`styleCount`·`isApply`를, 등고선 분석이 `topo*` uniform을 채운다.

## 2. 요구사항과 품질 기준

```spec
- 위치 표본 알파가 0.5 미만인 픽셀에는 범례 색상과 등고선을 적용하지 않고 원본 색을 보존해야 한다.
- 범례와 등고선 합성은 원본 색 위의 알파 혼합이며 원본 색 채널 자체를 파괴해서는 안 된다.
- 서로 다른 표면이 만나는 화면 경계에서 다른 표면의 위치 표본이 섞여 만들어지는 거짓 등고선은 억제해야 한다.
```

## 3. 정규 자연어 수도코드

```spec
HEIGHT_STYLE_MODE: {MIX: 0, BAND: 1}
    범례 보간 모드 상수 집합이며 styleMode uniform 초기값에 사용한다.

HEIGHT_STYLE_MODE.MIX, HEIGHT_STYLE_MODE.BAND: number
    MIX는 0(구간 보간), BAND는 1(구간 단색)이다.

GHeightShader: 모듈 상수 셰이더 정의 객체
    ShaderMaterial 구성에 필요한 name, uniforms, vertexShader, fragmentShader를 담아 export한다.

GHeightShader.name: string = 'GHeightShader'
    셰이더 정의 이름이다.

GHeightShader.uniforms: Record<string, {value: unknown}>
    합성 입력과 스타일 설정 uniform의 초기 정의 집합이며 사용 시 복제된다.

GHeightShader.uniforms.styleMode: {value: 0}
    범례 보간 모드이며 0(MIX) 구간 보간, 1(BAND) 구간 단색이다.

GHeightShader.uniforms.tDiffuse: {value: null}
    합성 대상 원본 장면 색상 텍스처다.

GHeightShader.uniforms.tPosition: {value: null}
    GWorldPositionShader가 기록한 픽셀 위치 렌더 타깃 텍스처다.

GHeightShader.uniforms.minBounds, GHeightShader.uniforms.maxBounds: {value: null}
    장면 경계 uniform 자리이며 프래그먼트 셰이더에 선언만 있고 현재 계산에는 사용되지 않는다. [확인 Q-001]

GHeightShader.uniforms.positionOrigin, GHeightShader.uniforms.positionOriginLow: {value: {x: 0.0, y: 0.0, z: 0.0}}
    절대 좌표 복원에 더하는 카메라 월드 위치의 high 성분과 low 성분이며 UPass가 프레임마다 채운다.

GHeightShader.uniforms.tPositionTexelSize: {value: {x: 1.0/512.0, y: 1.0/512.0}}
    위치 텍스처 한 텍셀의 UV 크기이며 이웃 표본 조회 간격으로 사용한다.

GHeightShader.uniforms.styleCount: {value: 0}
    userStyleData에 기록된 범례 스타일 항목 수이며 0 이하이면 범례 색을 만들지 않는다.

GHeightShader.uniforms.userStyleData: {value: null}
    범례 스타일 DataTexture이며 0행에 RGBA 색, 1행 r 채널에 기준 고도를 담는 폭 styleCount, 높이 2 구조다.

GHeightShader.uniforms.isApply: {value: false}
    참이면 범례 색상 합성을 수행한다.

GHeightShader.uniforms.isTopo: {value: false}
    참이면 등고선 합성을 수행한다.

GHeightShader.uniforms.topoInterval: {value: 100.0}
    topoStyleData가 없을 때 사용하는 기본 등고선 간격이다.

GHeightShader.uniforms.topoWidth: {value: 3}
    등고선 선 굵기(픽셀)이며 절반 폭에 안티에일리어싱 반경 3픽셀을 더해 커버리지를 만든다.

GHeightShader.uniforms.topoReference: {value: 0.0}
    등고선 위상 기준값이며 UPass가 카메라 z를 간격으로 나눈 나머지로 채우고, topoStyleCount가 0보다 크면 셰이더가 카메라 원점 z와 스타일 시작 고도로 다시 계산한다.

GHeightShader.uniforms.topoFadeStartDistance, GHeightShader.uniforms.topoFadeEndDistance: {value: number}
    카메라 거리 기반 등고선 페이드 시작·종료 거리이며 초기값은 2000.0과 6000.0이다.

GHeightShader.uniforms.topoColor: {value: {r: 0.0, g: 0.0, b: 0.0}}
    topoStyleData가 없을 때 사용하는 기본 등고선 색이다.

GHeightShader.uniforms.topoOpacity: {value: 1.0}
    등고선 혼합 불투명도다.

GHeightShader.uniforms.topoStyleCount: {value: 0}
    topoStyleData에 기록된 등고선 스타일 항목 수이며 0 이하이면 기본 색·간격을 사용한다.

GHeightShader.uniforms.topoStyleData: {value: null}
    등고선 스타일 DataTexture이며 0행에 RGBA 색, 1행에 (r 시작 고도, g 간격)을 담는 폭 topoStyleCount, 높이 2 구조다.

GHeightShader.uniforms.styleMode.value, GHeightShader.uniforms.styleCount.value, GHeightShader.uniforms.topoStyleCount.value: number = 0
    복제 전 초기값이다.

GHeightShader.uniforms.tDiffuse.value, GHeightShader.uniforms.tPosition.value, GHeightShader.uniforms.minBounds.value, GHeightShader.uniforms.maxBounds.value, GHeightShader.uniforms.userStyleData.value, GHeightShader.uniforms.topoStyleData.value: null
    복제 전 초기값이며 실제 텍스처·경계 값은 패스와 분석이 채운다.

GHeightShader.uniforms.isApply.value, GHeightShader.uniforms.isTopo.value: boolean = false
    복제 전 초기값이며 기본적으로 두 합성 모두 꺼져 있다.

GHeightShader.uniforms.topoInterval.value: number = 100.0
    복제 전 초기 등고선 간격이다.

GHeightShader.uniforms.topoWidth.value: number = 3
    복제 전 초기 선 굵기다.

GHeightShader.uniforms.topoReference.value: number = 0.0
    복제 전 초기 위상 기준값이다.

GHeightShader.uniforms.topoFadeStartDistance.value: number = 2000.0
    복제 전 초기 페이드 시작 거리다.

GHeightShader.uniforms.topoFadeEndDistance.value: number = 6000.0
    복제 전 초기 페이드 종료 거리다.

GHeightShader.uniforms.topoOpacity.value: number = 1.0
    복제 전 초기 등고선 불투명도다.

GHeightShader.uniforms.positionOrigin.value, GHeightShader.uniforms.positionOriginLow.value: {x: 0.0, y: 0.0, z: 0.0}
    복제 전 초기 카메라 위치 성분이다.

GHeightShader.uniforms.positionOrigin.value.x, GHeightShader.uniforms.positionOrigin.value.y, GHeightShader.uniforms.positionOrigin.value.z, GHeightShader.uniforms.positionOriginLow.value.x, GHeightShader.uniforms.positionOriginLow.value.y, GHeightShader.uniforms.positionOriginLow.value.z: number = 0.0
    카메라 위치 성분 초기 좌표값이다.

GHeightShader.uniforms.tPositionTexelSize.value: {x: 1.0/512.0, y: 1.0/512.0}
    복제 전 초기 텍셀 크기다.

GHeightShader.uniforms.tPositionTexelSize.value.x, GHeightShader.uniforms.tPositionTexelSize.value.y: number
    텍셀 크기 초기 성분이며 1.0/512.0이다.

GHeightShader.uniforms.topoColor.value: {r: 0.0, g: 0.0, b: 0.0}
    복제 전 초기 등고선 색이다.

GHeightShader.uniforms.topoColor.value.r, GHeightShader.uniforms.topoColor.value.g, GHeightShader.uniforms.topoColor.value.b: number = 0.0
    등고선 색 초기 성분이다.

GHeightShader.vertexShader: string
    GLSL 정점 셰이더 원문이며 uv를 varying으로 넘기고 표준 투영으로 gl_Position을 계산하는 풀스크린 통과 셰이더다.

GHeightShader.fragmentShader: string
    GLSL 프래그먼트 셰이더 원문이며 다음 규칙으로 픽셀 색을 만든다.
        위치 표본 조회와 유효성 판정 규칙은 다음과 같다.
            위치 표본은 tPosition을 textureLod 0레벨로 읽는다.
            표본 알파에 step(0.5)을 적용해 0.5 이상이면 유효, 미만이면 무효로 판정한다.
            절대 좌표 복원은 표본 RGB에 positionOriginLow와 positionOrigin을 더하고, 분석 좌표는 표본 RGB(카메라 상대)를 그대로 사용한다.
            구멍 메꾸기 조회는 중심 표본 알파가 -0.5 미만(고도 후처리 제외 표식)이면 빈 픽셀이 아니므로 대체 없이 그대로 반환하고, 그 외 무효 표본이면 좌우상하 1텍셀 이웃 중 첫 유효 표본으로 대체하며, 모두 무효이면 중심 표본을 유지한다.
        본문은 tDiffuse 원본 색으로 시작해 다음 두 합성을 차례로 적용한다.
        범례 합성은 isApply가 참이고 구멍 메꾸기 표본이 유효하며 복원한 절대 고도가 5000 미만일 때만 수행한다.
            styleCount가 0 이하이면 투명 스타일을 반환해 원본 색을 유지한다.
            userStyleData에서 고도 구간을 찾아 band 모드(1)는 구간 하한 색을 그대로, mix 모드(0)는 구간 양 끝 색을 smoothstep으로 보간해 선택한다. 첫 기준 고도 이하는 첫 스타일, 마지막 기준 고도 초과는 마지막 스타일을 사용한다.
            선택한 스타일의 알파로 원본 색과 혼합한다.
        등고선 합성은 isTopo가 참이고 중심 표본이 유효할 때만 수행한다.
            topoStyleCount가 0보다 크면 topoStyleData에서 현재 고도 구간의 색·간격·시작 고도를 선택하고, 가장 가까운 등고선 고도가 다음 구간 시작에 더 가까우면 그 구간 스타일로 재선택한다. 0 이하이면 topoColor와 topoInterval을 사용한다.
            등고선 마스크 계산은 다음 판정을 통과한 픽셀에만 값을 만든다.
                중심 표본이 무효이거나 간격이 0 이하이면 0을 반환한다.
                좌우·상하 이웃에서 유효하고 거리가 0이 아닌 쪽을 골라 축 변화량을 만들며, 양쪽 모두 없으면 0을 반환한다.
                축 변화량이 dFdx·dFdy 기대 변화량의 5배를 넘는 불연속(다른 표면 혼입)이면 0을 반환한다.
                축 변화량 외적으로 만든 표면 법선의 z 절대값이 0.3 미만(수직에 가까운 표면)이면 0을 반환한다.
            등고선 위상은 topoReference(스타일 사용 시 카메라 원점 z와 시작 고도로 재계산한 나머지)를 더한 분석 고도를 간격으로 나눈 소수 위상으로 계산하고, 위상을 기울기로 나눈 픽셀 거리에 topoWidth 절반과 안티에일리어싱 반경 3픽셀의 smoothstep을 적용해 커버리지를 만든다.
            커버리지에 고빈도 페이드(기울기 0.5~1.0), z-fight 억제와 카메라 거리 페이드(topoFadeStartDistance~topoFadeEndDistance)를 곱해 마스크를 확정한다. z-fight 억제는 먼 평면 거리·고도 0 부근·평탄·수평 네 조건의 페이드 곱이 높을 때만 등고선을 지운다.
            스타일 알파, topoOpacity와 마스크로 원본 색과 혼합한다.
        최종 색을 gl_FragColor로 출력하며 알파는 tDiffuse의 알파를 유지한다.
```

## 4. 공통 처리 기준과 제약

```spec
- 스타일 DataTexture 계약: 0행은 RGBA 색, 1행은 기준 값(범례: r 고도, 등고선: r 시작 고도·g 간격)이며 폭은 항목 수, 높이는 2다. 이 구조를 바꾸면 UAnalyHeight의 텍스처 생성과 함께 바꿔야 한다.
- 위치 표본 알파 계약: 0(클리어)은 지오메트리 없음, 1.0은 유효 표본, -1.0은 고도 후처리 제외 표식이며 GWorldPositionShader의 기록 값과 HeightPass의 클리어 값에 의존한다. 제외 표식 픽셀은 유효 판정(step 0.5)에서 자동으로 걸러져 범례·등고선이 적용되지 않고 원본 색이 보존된다.
- 절대 고도 5000 이상인 픽셀은 범례 적용 대상에서 제외한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
