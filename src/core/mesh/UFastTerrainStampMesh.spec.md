# UFastTerrainStampMesh 명세

> 상태: 구현 관찰 초안

## 1. 개요

표시 중인 지형 타일의 geometry를 share하여 단색 도장을 지형 위에 표시한다. 레이어가 표시 타일과 재질을 관리하며, 메시는 자신이 획득한 geometry 공유분만 반납한다. 일반 TerrainStamp 또는 terrain decal host에 등록하지 않는다.

## 2. 요구사항과 품질 기준

```spec
원본 타일의 형상과 world matrix를 사용하여 DEM 변경과 높이 scale을 표시 지형에 맞춘다.
geometry 공유분은 생성·교체·해제마다 정확히 한 번 획득하고 반납한다.
빌린 material을 메시가 해제하지 않는다. 분석형 경로는 texture를 사용하지 않는다.
```

## 3. 정규 자연어 수도코드

```spec
UFastTerrainStampMesh extends Mesh 클래스 정의
    의존: Mesh — 독립 지형 표시 객체; 상속: {Mesh}

    #tile: U3dQuadTile | undefined
    _disposed: boolean = false
    boundingSphere: Sphere = 빈 구
        의존: Sphere — 메시 culling 영역; 생성자: {new Sphere()}
    name: string
        FastTerrainStamp 접두어와 타일 key
    visible: boolean = false
    matrixAutoUpdate, matrixWorldAutoUpdate: boolean = false
        레이어 그룹 변환 대신 원본 지형의 world matrix를 유지한다.
    castShadow, receiveShadow: boolean = false
    userData.exceptAO: boolean = true
        같은 지형 normal을 다시 그리지 않도록 GTAO 기존 제외 규약을 사용한다.

    constructor(tile: U3dQuadTile, material: UFastTerrainStampMaterial)
        의존:
            UPlaneBufferGeometry — 타일 공유분; 함수: {share(), dispose()}
            Mesh — 기반 표시 객체와 후처리 제외 표식; 생성자: {super()}; 속성 읽기: {userData}; 속성 쓰기: {userData.exceptAO}
        동작:
            타일 geometry에 share가 없거나 전용 material이 아니거나 해제된 material이면 자원을 받기 전에 TypeError를 던진다.
            타일 geometry의 공유분을 받아 기반 Mesh에 넘긴다.
            기반 생성이 실패하면 받은 공유분을 반납하고 원래 오류를 다시 던진다.
            원본 타일을 보관하고 이름·가시성·수동 행렬·그림자 설정과 GTAO 제외 표식을 초기화한다.
            타일의 현재 형상과 변환을 동기화한다.

    _syncTile() -> boolean
        동작:
            해제 상태이거나 원본 타일 메시가 없으면 false를 반환한다.
            원본 타일을 내부 동기화에 전달하고 성공 여부를 반환한다.

    override onBeforeRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: Group | null) -> void
        의존:
            UFastTerrainStampMaterial — draw별 원점과 pixel ratio; 함수: {_setObject()}
            Mesh — 전용 재질 identity 확인; 속성 읽기: {material}
        동작: 해제 전이며 이번 material이 메시의 전용 material과 같을 때 현재 메시와 renderer를 전달한다. depth·world position 등의 override material이면 도장 uniform을 반영하지 않는다.

    override dispose() -> void
        의존:
            Mesh — 기반 dispose 알림; 함수: {super.dispose()}; 속성 읽기: {geometry}
            UPlaneBufferGeometry — 획득한 공유분 반납; 함수: {dispose()}
        동작:
            이미 해제되었으면 종료하고 최초 호출이면 _disposed를 먼저 true로 바꾼다.
            표시를 끄고 원본 타일 참조를 비운다.
            기반 dispose를 실행하며 이 알림이 오류를 던져도 finally에서 자신의 geometry 공유분을 한 번 반납한다.
            빌린 material은 해제하지 않는다.

```

## 4. 공통 처리 기준과 제약

```spec
레이어는 렌더 목록의 culling 전에 _syncTile을 호출하고 성공한 실제 표시 타일만 visible로 설정한다.
geometry 필드는 공유 수명 계약의 일부이므로 레이어가 별도 geometry로 덮어쓰지 않는다.
그룹 추가·제거는 공유분을 추가로 획득하거나 반납하지 않는다.
부모 레이어가 각 타일·부피 배치의 전용 material 수명을 관리한다. 분석형 부피 출력은 texture를 만들거나 빌리지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
