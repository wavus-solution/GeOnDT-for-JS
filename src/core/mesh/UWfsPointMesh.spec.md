# UWfsPointMesh 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

WFS 점 피처를 Three.js Points로 표시하면서 모델 선택·높이 처리에서 사용하는 식별값과 공통 메시 접근자를 제공한다.

### 1.2 책임 범위

점의 geometry·material과 WFS 메타데이터를 보관하고, 식별값 조회·투명도 애니메이션 위임·선택용 경계 상자 조회를 담당한다. 피처 로딩과 puid 부여는 데이터 사용자가 담당한다.

### 1.3 주요 동작 방식

생성한 점은 주어진 geometry와 material을 사용한다. 식별값은 puid를 우선하고 미등록 객체는 uuid를 사용한다. 경계 상자는 최초 요청 당시 position 주위의 한 변 길이 2인 상자로 만들고 재사용한다.

### 1.4 주요 사용처와 연계 대상

U3dModelWFSLayer의 점 피처 생성 경로에서 사용하며 UMesh의 투명도 애니메이션 구현을 재사용한다.

## 3. 정규 자연어 수도코드

```spec
UWfsPointMesh extends Points 클래스 정의
    의존: THREE.Points — 점 렌더 객체의 기반; 상속: {Points}

    puid: string | undefined
        WFS 데이터 사용자가 부여하는 재로딩 식별값이며 미등록 상태에서는 undefined이다.
    geometry: ModelBufferGeometry
        점의 정점 자료를 보유한다.
    material: ModelMaterial | Array<ModelMaterial>
        점의 렌더 재질을 보유한다.
    _ulayername: string | null | undefined = null
        소속 레이어 이름을 보관한다.
    _ufeature, _uvecBottom, _uproperties = undefined
        WFS 원본 피처, 바닥 좌표와 데이터 속성을 연결한다.
    _tile = null
        관련 타일을 보관한다.
    _bbox: Box3 | null = null
        최초 경계 조회에서 만든 상자를 캐시한다.

    constructor(geometry: ModelBufferGeometry, material: ModelMaterial | Array<ModelMaterial>)
        의존: THREE.Points — 입력 geometry와 material로 점 생성; 생성자: {super()}
        동작: 기반 Points를 초기화하고 입력 geometry와 material 참조를 그대로 보관한다.

    getUid() -> string
        의존: THREE.Object3D — 현재 인스턴스 식별자; 속성 읽기: {uuid}
        동작: puid가 null 또는 undefined가 아니면 그 값을 반환하고, 아니면 현재 객체의 uuid를 반환한다.

    get brightness() -> number | null
        동작: 밝기 기능을 제공하지 않으므로 null을 반환한다.

    set brightness(value: number | null) -> void
        동작: 입력을 사용하지 않고 아무 상태도 변경하지 않는다.

    get contrast() -> number | null
        동작: 대비 기능을 제공하지 않으므로 null을 반환한다.

    set contrast(value: number | null) -> void
        동작: 입력을 사용하지 않고 아무 상태도 변경하지 않는다.

    animationOpacity(layer: U3dLayer, min: number = 0.3, max: number = 1) -> void
        인터페이스: layer는 애니메이션 실행 환경이며 min과 max는 시작·종료 투명도이다.
        의존: UMesh — 공통 투명도 애니메이션; 함수: {prototype.animationOpacity.call()}
        동작: 현재 점을 this로 하여 UMesh.prototype.animationOpacity에 layer·min·max를 전달하고 반환값은 전달하지 않는다.

    getBoundingBox() -> Box3
        의존:
            THREE — 점 주위의 선택 영역 생성; 생성자: {new Box3(), new Vector3()}
            THREE.Object3D — 최초 경계 기준 위치; 속성 읽기: {position}
        동작:
            _bbox가 없으면 현재 position의 각 축에서 1을 뺀 최소점과 1을 더한 최대점으로 Box3를 만들어 보관한다.
            이미 상자가 있으면 position을 다시 읽어 갱신하지 않고 보관된 상자를 반환한다.

    getBBox() -> Box3
        동작: getBoundingBox의 상자 참조를 그대로 반환한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
