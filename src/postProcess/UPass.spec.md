# UPass 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UPass`는 분석용 후처리 패스가 장면을 별도 재질과 렌더 타깃으로 다시 그릴 때 필요한 공통 상태 전환을 제공하고, 큰 월드 좌표를 high/low 성분으로 나누어 위치 셰이더 uniform에 전달한다.

### 1.2 책임 범위

- 후처리 패스가 공유하는 장면·카메라·앱·크기 상태를 보관한다.
- override 렌더 동안 환경 객체, 배경과 안개를 제외하고 렌더러·장면 상태를 임시 변경한 뒤 원래 값으로 복구한다.
- 카메라 월드 위치를 high/low 성분으로 분리하고 회전 view matrix를 대상 재질의 선택적 uniform에 기록한다.
- override 렌더의 전후 callback을 호출해 파생 패스가 같은 렌더 타깃 안에서 추가 처리를 수행할 수 있게 한다.

### 1.3 주요 동작 방식

`renderOverride()`는 현재 렌더러·장면 상태를 저장하고 환경 객체를 숨긴 뒤 대상 타깃을 투명하게 지운다. 선택적인 사전 callback, 장면 전체 override 렌더, 선택적인 사후 callback을 순서대로 실행하고 성공·실패와 관계없이 저장한 상태와 가시성을 복구한다.

### 1.4 주요 사용처와 연계 대상

- `HeightPass`가 위치 렌더 타깃 생성과 전용 월드 위치 재질 객체의 추가 렌더에 사용한다.
- `SunAmountPass`가 normal·position 렌더 타깃 생성에 사용한다.
- `URenderer.getPositionScreen()`이 export 함수 `updateMaterialCameraState()`로 픽셀 위치 조회용 재질의 카메라 정밀도 uniform을 갱신한다.

## 3. 정규 자연어 수도코드

```spec
UPass extends Pass 클래스 정의
    의존: Pass — Three.js 후처리 패스 기반 상태 제공; 상속: {Pass}

    width, height: number
        생성 시 전달값을 보관하며 생략하면 각각 512를 사용한다.

    app: U3dApp
        패스를 소유한 앱 참조다.

    scene: Object3D
        override 렌더 대상 장면 루트다.

    camera: Camera
        override 렌더와 카메라 정밀도 uniform 갱신에 사용할 카메라다.

    #hiddenEnvironmentObjects: Map<Object3D, boolean> = 빈 Map
        현재 override 렌더에서 임시로 숨긴 환경 객체의 원래 가시성 저장소다.

    constructor(scene, camera, app, width, height, materials)
        역할: 공통 후처리 상태를 초기화한다.
        인터페이스: width와 height를 생략하면 각각 512를 사용하며 materials는 현재 구현에서 사용하지 않는다.
        의존: Pass — 후처리 기반 상태 초기화; 생성자: {new Pass()}
        동작:
            상위 생성자를 호출하고 크기·앱·장면·카메라를 보관한다.

    #hideEnvironmentObjects() -> void
        역할: override 위치·normal 타깃에 포함하지 않을 환경 객체를 임시로 숨긴다.
        처리 기준: 장면 루트와 이미 보이지 않는 객체는 변경하지 않으며 `_isEnvironment`가 true이거나 생성자명·객체명에 sky, cloud, lensflare가 포함되거나 생성자명에 ufrustumterrainprojectionhelper와 ufrustumhelper가 포함된 객체를 환경 객체로 판정한다.
        의존: Object3D(scene) — 장면 하위 객체 순회; 함수: {traverse()}
        동작: 장면 순회 callback에서 isEnvironmentObject()로 판정한 환경 객체의 현재 visible 값을 #hiddenEnvironmentObjects에 보관하고 visible을 false로 바꾼다.

    #restoreEnvironmentVisibility() -> void
        역할: 임시로 숨긴 객체의 가시성을 복구한다.
        동작: #hiddenEnvironmentObjects의 객체별 visible 값을 저장된 원래 값으로 되돌리고 Map을 비운다.

    updateDecodeState(targetMaterial) -> void
        역할: 현재 카메라 상태를 대상 재질의 선택적 정밀도 uniform에 반영한다.
        동작: 현재 카메라와 대상 재질을 updateMaterialCameraState()에 전달한다.

    renderOverride(renderer, overrideMaterial, renderTarget, beforeRender?: function, afterRender?: function) -> void
        역할: 장면을 별도 재질로 지정 렌더 타깃에 그리고 파생 패스의 전후 처리를 같은 상태 범위에서 실행한다.
        인터페이스:
            함수인 beforeRender와 afterRender에는 renderer와 현재 camera를 순서대로 전달하며 함수가 아닌 값은 무시한다.
            afterRender는 장면 전체 override 렌더가 성공한 경우에만 호출한다.
        처리 기준: 장면 렌더나 callback이 실패해도 장면 override 재질·배경·안개, 숨긴 객체의 가시성, 렌더러 clear 색·alpha와 autoClear를 원래 값으로 복구한다.
        의존:
            WebGLRenderer(renderer) — 대상 전환·클리어와 장면 렌더; 함수: {getClearAlpha(), getClearColor(), setRenderTarget(), setClearColor(), clear(), render()}; 속성 읽기·쓰기: {autoClear}
            Object3D(scene) — 배경·안개·override 재질 임시 변경; 속성 읽기·쓰기: {background, fog, overrideMaterial}
        동작:
            렌더러·장면 원래 상태를 저장하고 임시 가시성 Map을 비운 뒤 환경 객체를 숨긴다.
            장면 배경·안개를 제거하고 override 재질의 카메라 uniform을 갱신한다.
            지정 렌더 타깃으로 전환해 autoClear를 끄고 투명 검정으로 color·depth·stencil을 지운다.
            beforeRender가 있으면 renderer와 camera를 전달해 호출한다.
            장면 override 재질을 설정하고 장면 전체를 렌더한다.
            afterRender가 있으면 renderer와 camera를 전달해 호출한다.
            성공·실패와 관계없이 저장한 장면·렌더러 상태와 환경 객체 가시성을 복구한다.

updateMaterialCameraState(targetMaterial, camera) -> void
    역할: 큰 월드 좌표의 정밀도를 보존하도록 카메라 위치와 view 회전을 대상 재질 uniform에 기록한다.
    처리 기준:
        카메라 matrixWorld 요소가 없으면 아무것도 하지 않는다.
        대상 uniform이 있을 때만 값을 갱신한다.
    의존:
        Camera(camera) — 월드 위치와 역행렬 조회; 속성 읽기: {matrixWorld, matrixWorldInverse}
        Matrix3 — view 행렬의 회전 성분 추출; 함수: {setFromMatrix4(), copy()}
    동작:
        카메라 월드 위치 각 성분을 Math.fround high 값과 원본에서 high를 뺀 low 값으로 분리한다.
        positionOrigin에는 high 위치를, positionOriginLow와 cameraPositionLow에는 low 위치를 기록한다.
        viewMatrix3가 있으면 카메라 matrixWorldInverse의 3x3 성분을 기록한다.

isEnvironmentObject(object: Object3D) -> boolean
    역할: override 위치·normal 타깃에서 제외할 환경 객체인지 판정한다.
    인터페이스: 환경 객체이면 true를 반환한다.
    동작:
        입력이 없으면 false를 반환한다.
        _isEnvironment가 true이거나 생성자명·객체명에 sky, cloud, lensflare가 포함되거나 생성자명에 ufrustumterrainprojectionhelper가 포함되면 true를 반환하고, 그 밖에는 false를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
- 대상 재질이 일부 uniform만 제공해도 존재하는 항목만 갱신하고 오류 없이 동작해야 한다.
- override 렌더의 임시 장면·렌더러 상태는 호출 전 값으로 복구해야 한다.
- UFrustumTerrainProjectionHelper는 루트가 환경 객체로 숨겨져 자식 선·옆면·투영선이 위치·normal 기반 후처리 입력에서 제외되며, 별도 terrain tile에 합성되는 UTerrainStamp 결과는 제외하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
