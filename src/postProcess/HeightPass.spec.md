# HeightPass 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`HeightPass`는 프레임마다 장면을 `GWorldPositionMaterial`로 한 번 더 그려 픽셀 위치 렌더 타깃을 만들고, 그 위치 정보로 `GHeightShader` 합성 재질을 구동해 고도 범례 색상과 등고선을 화면에 입히는 후처리 패스다.

### 1.2 책임 범위

- 위치 렌더 타깃(Float RGBA)의 생성·크기 동기화·처분을 관리한다.
- 프레임마다 위치 override 렌더를 수행하고 합성 재질의 텍스처·카메라 상태·등고선 기준 uniform을 갱신한다.
- `customWorldPositionMaterial`을 가진 객체는 기본 override 렌더에서 숨기고 전용 재질로 다시 그려 화면 실루엣과 같은 위치 표본을 만든다.
- 고도 후처리 제외 루트 집합(Object3D 또는 컴포넌트 포지션)을 받아 렌더마다 Object3D 루트는 하위 전체 renderable 집합으로, 인스턴스 컴포넌트는 InstancedMesh별 제외 인스턴스 id 마스크 텍스처로 펼쳐 위치 재질에 전달한다.
- 책임 경계: 범례·등고선 스타일 uniform 값은 `UAnalyHeight` 계열 분석이 이 패스의 `uniforms`에 직접 기록하고, 패스 활성화 여부는 렌더러(`URenderer`)가 관리한다.

### 1.3 주요 동작 방식

렌더 시 먼저 `UPass.renderOverride()`로 장면 전체를 위치 재질로 위치 렌더 타깃에 그린다(환경 객체와 전용 재질 객체 숨김, 배경·안개 제거, 알파 0 클리어). 이어 전용 재질 객체를 원래 가시성으로 복구해 같은 타깃에 개별 렌더하고, 완성된 위치 타깃과 입력 색상 버퍼를 합성 재질에 연결해 풀스크린 쿼드로 최종 색을 출력한다.

### 1.4 주요 사용처와 연계 대상

- `URenderer`가 `UDEF.POSTPASS.HEIGHT` 이름으로 이 패스를 생성·활성화한다.
- `UAnalyHeight.setHeightVisible()`·`setUserStyle()`이 `uniforms`의 `isApply`·스타일 항목을, 등고선 분석이 `isTopo`·`topo*` 항목을 직접 읽고 쓴다.
- `UAnalyHeight`의 제외 목록 API(setExceptObjects 등)가 `_setExceptObjects()`로 제외 루트 집합(Object3D 또는 `U3dComponentPosition` 계열)을 전달한다.

## 2. 요구사항과 품질 기준

```spec
- 위치 렌더 타깃 크기는 패스 크기와 함께 변해야 하고 텍셀 크기 uniform도 같은 시점에 갱신되어야 한다.
- 합성 출력은 입력 색상 버퍼를 기반으로 하며 위치 표본이 없는 픽셀의 원본 색을 보존해야 한다.
- 위치 override 렌더가 실패해도 전용 재질 객체의 원래 가시성과 원본 재질은 복구되어야 한다.
```

## 3. 정규 자연어 수도코드

```spec
HeightPass extends UPass 클래스 정의
    의존: UPass — 후처리 공통 상태(scene·camera·app·크기) 보관, override 렌더와 카메라 상태 uniform 갱신 제공; 상속: {UPass}

    uniforms: Record<string, {value: unknown}>
        GHeightShader.uniforms를 복제한 집합이며 합성 재질과 같은 객체를 공유하고 분석 객체가 패스 인스턴스에서 직접 읽고 쓴다.

    material: ShaderMaterial
        GHeightShader로 만든 풀스크린 합성 재질이며 depthWrite를 끄고 불투명으로 동작하며 미분(derivatives) 확장을 사용한다.

    positionMaterial: GWorldPositionMaterial
        위치 override 렌더에 사용하는 재질이며 앱 경계 상자의 min·max로 생성한다.

    positionRenderTarget: WebGLRenderTarget
        픽셀 위치를 담는 Nearest 필터·RGBA·Float 타입 렌더 타깃이다.

    fsQuad: FullScreenQuad
        합성 재질을 그리는 풀스크린 쿼드다.

    width, height: number
        setSize()가 1 이상 내림 정수로 보정해 다시 기록하는 패스 크기이며 UPass 생성자가 선언한 멤버다.

    camera: Camera
        updateState()가 교체하는 활성 카메라이며 UPass 생성자가 선언한 멤버다.

    #exceptObjects: Set<Object3D | U3dComponentPosition> | null = null
        고도 후처리 제외 루트 집합이며 UAnalyHeight가 소유한 Set을 참조로 공유한다.

    #excludeSet: Set<Object3D>
        렌더마다 제외 루트를 하위 전체로 펼친 renderable 집합이며 재사용을 위해 인스턴스에 보관한다.

    #instanceExcludeState: Map<Object3D, {texture: DataTexture, capacity: number, ids: Set<number>}>
        인스턴스 컴포넌트 제외용 마스크 텍스처 캐시이며 InstancedMesh별로 제외 id 집합과 함께 보관해 목록이 바뀔 때만 다시 채운다.

    #instanceExcludeMap: Map<Object3D, DataTexture>
        위치 재질에 넘기는 InstancedMesh → 제외 마스크 텍스처 맵이다.

    #hiddenCustomWorldPositionObjects: Map<Object3D, boolean> = 빈 Map
        전용 월드 위치 재질 객체의 원래 가시성을 보관해 기본 override 렌더에서 숨기고 추가 렌더 전후에 복구하는 저장소다.

    #renderCustomWorldPositionObjectsCallback: function
        render마다 bind 함수를 만들지 않도록 #renderCustomWorldPositionObjects()에 한 번 바인딩해 재사용하는 callback이다.

    constructor(scene, camera, app, width, height, materials)
        역할: 합성 재질, 위치 재질과 위치 렌더 타깃을 구성하고 초기 uniform 상태를 채운다.
        인터페이스: width와 height를 생략하면 UPass 기본 512를 사용하며 materials는 현재 구현에서 사용하지 않는다.
        의존:
            UPass — 공통 상태 보관과 앱 참조 제공; 생성자: {new UPass()}; 속성 읽기: {app}
            GHeightShader — 합성 셰이더 정의; 상수: {GHeightShader}
            UniformsUtils — uniform 정의 복제; 정적 함수: {clone()}
            ShaderMaterial — 합성 재질 생성; 생성자: {new ShaderMaterial()}
            GWorldPositionMaterial — 위치 재질 생성; 생성자: {new GWorldPositionMaterial()}
            FullScreenQuad — 합성용 풀스크린 쿼드 생성; 생성자: {new FullScreenQuad()}
            U3dApp(app) — 장면 경계 상자 제공; 속성 읽기: {_box}
        동작:
            상위 생성자로 장면·카메라·앱·크기를 보관한다.
            GHeightShader uniform을 복제해 depthWrite 없는 불투명 합성 재질을 만들고 미분 확장을 켠다.
            앱 경계 상자의 min·max를 합성 재질 minBounds·maxBounds uniform에 기록하고 같은 경계로 위치 재질을 생성한다.
            위치 렌더 타깃을 만들고 합성용 풀스크린 쿼드를 준비한다.
            텍셀 크기 uniform과 카메라 상태 uniform을 초기화한다.
            전용 월드 위치 재질 객체 렌더 함수를 현재 인스턴스에 바인딩해 callback으로 보관한다.

    _setExceptObjects(objects: Set<Object3D | U3dComponentPosition> | null) -> void
        역할: 고도 범례·등고선 후처리에서 제외할 루트 집합을 등록한다.
        인터페이스: Set이 아닌 입력은 null(제외 없음)로 처리한다. Object3D 루트는 렌더 시점의 하위 전체가, 컴포넌트 포지션은 그 컴포넌트만(인스턴스 타입이면 해당 인스턴스만) 제외된다.
        동작:
            입력이 Set이면 참조를 보관하고 아니면 null로 비운다.
            패스가 비활성이라 렌더가 멈춰 있어도 해제된 마스크 텍스처와 메쉬 참조가 남지 않도록 펼침 집합을 즉시 갱신한다.

    #updateExcludeSet() -> void
        역할: 제외 루트 집합을 위치 재질이 O(1)로 판정할 renderable 집합과 InstancedMesh별 제외 인스턴스 id 집합으로 펼친다.
        처리 기준:
            그룹 등록 뒤 동적으로 추가된 자식도 반영되도록 렌더마다 다시 펼친다.
            컴포넌트 포지션은 getObject()·getInstancedId() 계약으로 판별하며 getObject() 결과가 Object3D가 아니면 무시한다.
        의존:
            Object3D(root) — 제외 루트 하위 순회; 함수: {traverse()}
            U3dComponentPosition(root) — 컴포넌트 형상 루트와 인스턴스 index 조회; 함수: {getObject(), getInstancedId()}
        동작:
            보관 중인 펼침 집합을 비우고 각 제외 루트를 종류별로 처리한다.
            Object3D 루트는 자신과 하위 전체를 renderable 집합에 추가한다.
            getInstancedId()가 유한 숫자인 인스턴스 컴포넌트는 getObject() 하위의 InstancedMesh들(isInstancedMesh2 또는 instances를 가진 isInstancedMesh)에 그 index를 제외 id 집합으로 모은다.
            그 밖의 컴포넌트는 getObject()의 자신과 하위 전체를 renderable 집합에 추가한다.
            모은 id 집합을 마스크 텍스처에 반영한다.
            renderable 집합과 마스크 맵이 비어 있지 않으면 각각을, 비어 있으면 null을 positionMaterial의 _excludeSet과 _instanceExcludeMap에 기록한다.

    #updateInstanceExcludeTextures(instanceIds: Map<Object3D, Set<number>>) -> void
        역할: InstancedMesh별 제외 인스턴스 id 집합을 위치 셰이더가 조회할 R8 마스크 DataTexture로 유지한다.
        처리 기준:
            텍스처는 메쉬 capacity(없으면 최대 id + 1) 이상을 덮는 정사각형에 가까운 크기로 만들고, 기존 텍스처 용량이 부족할 때만 새로 만든다.
            id 집합이 캐시와 같으면 텍스처를 다시 채우지 않는다.
            이번 집합에 없는 메쉬의 캐시 항목과 텍스처는 해제·제거한다.
        의존:
            DataTexture — R8 마스크 텍스처 생성; 생성자: {new DataTexture()}; 함수: {dispose()}
            NearestFilter, RedFormat, UnsignedByteType — 텍스처 파라미터 상수; 상수: {NearestFilter, RedFormat, UnsignedByteType}
            InstancedMesh2(mesh) — 마스크 크기 산정용 인스턴스 용량; 속성 읽기: {capacity}
        동작:
            목록에서 빠진 메쉬의 텍스처를 처분하고 캐시·맵에서 제거한다.
            메쉬별로 필요한 용량을 계산해 부족하면 행 정렬 1바이트(unpackAlignment)의 R8 텍스처를 새로 만든다.
            id 집합이 바뀐 경우에만 데이터를 0으로 지우고 제외 id 위치를 255로 기록한 뒤 needsUpdate를 켠다.
            완성된 텍스처를 메쉬 키로 마스크 맵에 기록한다.

    createRenderTarget() -> void
        의존:
            UPass — 타깃 크기 제공; 속성 읽기: {width, height}
            WebGLRenderTarget — 위치 렌더 타깃 생성; 생성자: {new WebGLRenderTarget()}
            NearestFilter — 필터 상수; 상수: {NearestFilter}
            RGBAFormat — 포맷 상수; 상수: {RGBAFormat}
            FloatType — 픽셀 타입 상수; 상수: {FloatType}
        동작: 현재 크기로 Nearest 필터·RGBA·Float 타입 위치 렌더 타깃을 만들어 positionRenderTarget에 보관한다.

    setSize(width, height) -> void
        처리 기준: 숫자가 아니거나 1 미만인 입력은 1로 보정하고 내림 정수로 저장한다.
        의존:
            UPass — 보정한 크기 저장; 속성 쓰기: {width, height}
            WebGLRenderTarget(positionRenderTarget) — 타깃 크기 변경; 함수: {setSize()}
        동작: 보정한 크기를 저장하고 위치 렌더 타깃 크기를 맞춘 뒤 텍셀 크기 uniform을 갱신한다.

    updateTexelSize() -> void
        역할: 위치 렌더 타깃 한 텍셀의 UV 크기를 합성 재질에 반영한다.
        처리 기준: tPositionTexelSize uniform이 없으면 아무것도 하지 않는다.
        의존: UPass — 타깃이 없을 때 크기 fallback; 속성 읽기: {width, height}
        동작: 타깃 크기(없으면 보관 크기, 최소 1)의 역수를 tPositionTexelSize uniform의 x·y에 기록한다.

    dispose() -> void
        의존:
            ShaderMaterial(material) — 합성 재질 처분; 함수: {dispose()}
            GWorldPositionMaterial(positionMaterial) — 위치 재질 처분; 함수: {dispose()}
            WebGLRenderTarget(positionRenderTarget) — 타깃 처분; 함수: {dispose()}
            FullScreenQuad(fsQuad) — 쿼드 처분; 함수: {dispose()}
            Texture — tPosition uniform에 연결된 텍스처 처분; 함수: {dispose()}
        동작:
            제외 루트 참조와 펼침 집합을 비우고 인스턴스 마스크 텍스처를 모두 처분한 뒤 위치 재질의 _excludeSet과 _instanceExcludeMap을 null로 되돌린다.
            tPosition uniform에 연결된 텍스처, 합성 재질, 위치 재질, 위치 렌더 타깃과 풀스크린 쿼드를 순서대로 처분한다.

    render(renderer, writeBuffer, readBuffer) -> void
        역할: 위치 렌더 타깃을 갱신하고 범례·등고선 합성 결과를 출력 버퍼에 그린다.
        의존:
            UPass — 출력 대상 플래그 제공; 속성 읽기: {renderToScreen, clear}
            WebGLRenderer(renderer) — 출력 대상 전환·클리어; 함수: {setRenderTarget(), clear()}; 속성 읽기: {autoClearColor, autoClearDepth, autoClearStencil}
            FullScreenQuad(fsQuad) — 합성 쿼드 렌더; 함수: {render()}
        동작:
            텍셀 크기 uniform과 합성 재질의 카메라 상태·등고선 기준 uniform을 갱신한다.
            제외 루트 집합을 renderable 집합과 인스턴스 마스크로 펼쳐 위치 재질에 전달한다.
            위치 재질과 전용 월드 위치 재질로 장면을 렌더해 위치 렌더 타깃을 채운다.
            위치 렌더 타깃 텍스처를 tPosition에, readBuffer 텍스처를 tDiffuse에 연결한다.
            renderToScreen이면 기본 프레임버퍼에, 아니면 writeBuffer에 풀스크린 쿼드를 렌더하며 clear 플래그가 켜져 있으면 렌더러 autoClear 설정대로 먼저 지운다.

    override renderOverride(renderer) -> void
        역할: 기본 위치 override 렌더와 전용 월드 위치 재질 객체 렌더를 같은 위치 타깃에 수행한다.
        처리 기준:
            보이지 않는 객체와 보이지 않는 상위 객체 아래의 자식은 전용 재질 렌더 대상으로 수집하지 않는다.
            기본 장면 렌더나 전용 재질 렌더가 실패해도 수집한 객체의 가시성을 복구하고 저장소를 비운다.
        의존: UPass — 환경 객체·배경·안개를 제외한 위치 override 렌더와 같은 렌더 상태 안의 사후 callback 실행; 함수: {renderOverride()}; 속성 읽기: {scene}
        동작:
            이전 수집 결과를 비우고 장면의 전용 월드 위치 재질 객체를 찾아 원래 가시성을 보관한 뒤 숨긴다.
            UPass.renderOverride()에 위치 재질·위치 타깃과 생성자에서 바인딩한 전용 객체 렌더 callback을 전달한다.
            성공·실패와 관계없이 수집한 객체의 가시성을 복구하고 저장소를 비운다.

    override updateDecodeState(targetMaterial?: ShaderMaterial) -> void
        역할: 공통 카메라 정밀도 uniform과 HeightPass 전용 등고선 기준값을 갱신한다.
        처리 기준:
            topoReference uniform 또는 카메라 matrixWorld z가 없으면 공통 uniform만 갱신한다.
            topoInterval이 유한한 양수이면 카메라 z의 양의 나머지를 topoReference에 기록하고, 아니면 0을 기록한다.
        의존: UPass — 공통 카메라 정밀도 uniform 갱신과 현재 카메라 제공; 함수: {updateDecodeState()}; 속성 읽기: {camera}
        동작:
            상위 updateDecodeState()로 공통 카메라 uniform을 갱신한다.
            topoReference와 카메라 z가 있으면 topoInterval로 등고선 기준 나머지를 계산해 기록한다.

    #collectCustomWorldPositionObjects(root: Object3D, ancestorsVisible: boolean = true) -> void
        역할: 전용 월드 위치 재질 객체를 수집하고 기본 override 렌더에서 임시로 숨긴다.
        동작:
            입력이나 가시적인 상위 경로가 없거나 root가 보이지 않으면 하위를 순회하지 않는다.
            root에 customWorldPositionMaterial이 있으면 원래 가시성을 저장하고 숨긴 뒤 하위 순회를 끝낸다.
            그 밖에는 자식 배열을 같은 기준으로 재귀 순회한다.

    #restoreCustomWorldPositionVisibility() -> void
        역할: 전용 월드 위치 재질 객체의 가시성을 수집 전 값으로 복구한다.
        동작: 저장소의 객체별 visible 값을 원래 값으로 되돌린다.

    #renderCustomWorldPositionObjects(renderer, camera) -> void
        역할: 전용 월드 위치 재질 객체를 기본 override 렌더와 같은 위치 타깃에 개별 렌더한다.
        처리 기준:
            positionMaterial._excludeSet에 포함된 객체와 실행 시점에 전용 재질이 없는 객체는 렌더하지 않는다.
            객체 렌더가 실패해도 원본 material을 복구한다.
        의존:
            WebGLRenderer(renderer) — 객체별 위치 렌더; 함수: {render()}
            UPass — 현재 장면 참조; 속성 읽기·쓰기: {scene}
        동작:
            개별 객체 렌더의 visible 판정을 통과하도록 수집한 객체의 원래 가시성을 먼저 복구한다.
            장면 override 재질을 제거한다.
            제외 집합에 없는 객체마다 material을 customWorldPositionMaterial로 임시 교체해 렌더하고 원본 material로 복구한다.

    updateState(camera) -> void
        의존: UPass — 활성 카메라 교체; 속성 쓰기: {camera}
        동작: 보관 카메라를 입력 카메라로 교체하여 이후 카메라 상태 uniform 갱신에 사용한다.
```

## 4. 공통 처리 기준과 제약

```spec
- uniforms는 합성 재질의 uniforms와 같은 객체이므로 어느 쪽을 수정해도 함께 반영된다.
- 위치 렌더 타깃의 알파 0(클리어)·1.0(유효)·-1.0(고도 후처리 제외) 표본 계약은 GWorldPositionShader와 GHeightShader 사이의 계약이며 이 패스의 클리어 색(알파 0)이 그 전제를 만든다.
- 불투명 제외 객체는 위치 패스에 계속 참여해 깊이를 기록하므로 제외 객체 뒤 표면의 범례 색이 실루엣 안으로 새어 들어오지 않는다.
- 투명(transparent이며 표면 알파 상한이 1 미만) 제외 객체는 위치 재질이 그 드로우의 colorWrite·depthWrite를 꺼서 위치 표본을 남기지 않으므로, 그 픽셀에는 뒤 표면의 표본이 그대로 남아 범례와 등고선이 투시된다. 표면 알파는 material.opacity와 알파 uniform을 함께 보고 상한으로 판정한다. 인스턴스 단위 제외는 드로우 단위 상태로 나눌 수 없어 투명 여부와 무관하게 -1 표식을 유지한다.
- customWorldPositionMaterial 보유 객체(U3dLine, USimpleTail)는 제외 시 개별 렌더 자체를 건너뛰므로 투명 여부와 무관하게 위치 표본을 남기지 않는다. 이 경로는 위 판정을 거치지 않으며 불투명 제외 객체의 실루엣 보호가 적용되지 않는다.
- 인스턴스 마스크 텍스처의 texel index는 InstancedMesh의 원본 인스턴스 id(instanceIndex attribute)와 같아야 하며, 이 계약은 GWorldPositionShader의 마스크 조회 수식과 공유된다.
- 컴포넌트 포지션 판별은 U3dComponentPosition 계열의 getObject()·getInstancedId() 공개 계약에 의존하며 해당 클래스 구현을 import하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
