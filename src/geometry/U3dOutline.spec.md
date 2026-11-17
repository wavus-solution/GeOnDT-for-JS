# U3dOutline 명세

> 상태: 구현 관찰 초안

## 1. 개요

자동 외곽선의 렌더 객체와 보조 재질 수명을 한곳에서 관리한다. U3dLine을 상속하지 않는 엔진 내부 컨트롤러이며 U3dGeometry가 소유한다. 색상·두께·투명도와 공개 setter는 도형에 남기고, 코너 반경 비율은 컨트롤러의 공유 uniform에 저장하며 도형별 생성 전략은 기존 protected 호출을 통해 선택한다.

도형당 외곽선 렌더 객체는 최대 하나이며 `owner._outline`이 유일한 보관 참조다. 별도 등록 집합은 두지 않고 새 외곽선을 등록하면 기존 객체와 소유 자원을 교체한다. 보조 깊이 메시는 이 외곽선의 자식으로 관리한다.

**박스·사용자 도형·Loft는 추출 모서리, 원판은 평면 띠, 원기둥·파이프는 시점별 실루엣, 구는 반 두께 확장 곡면과 축소 실루엣 마스크를 사용한다.** 색상·깊이·AO 출력은 같은 렌더 형상을 사용한다. GeGTAOPass는 도형 종류를 구분하지 않고 소유자가 제공한 법선 재질을 조회한다. 구름 합성에 필요한 불투명 내부 깊이도 등록 시 연결한다.

| 도형  | 렌더 객체·재질 |
|---|---|
| 박스·사용자 도형·Loft  | `U3dLine` + 코너 셰이더 |
| 원판·파이프  | 본체와 별도인 `BufferGeometry`와 전용 셰이더를 사용하는 `Mesh` |
| 원기둥 | `U3dLine`(원둘레·옆면 실루엣) + 실루엣 셰이더 |
| 구  | 본체 Geometry를 복제한 별도 `Mesh` + 전용 셰이더 |

- **원판:** 외곽선의 위치·깊이·법선을 원판 평면에 맞추고 안팎 경계의 AA를 직접 제어하기 위해 전용 평면 띠 `Mesh`를 사용한다.
- **파이프:** 굽은 경로의 단면별 실루엣을 공유 정점으로 연결하고, 본체 표면에 가려지는 안쪽 반 두께와 다른 관 구간에 의한 가림을 처리하기 위해 전용 `Mesh`를 사용한다.
- **원기둥:** 기존 선폭·접합부 표현과 깊이·가림 처리를 보존하기 위해 `U3dLine`을 유지한다. 검토한 전용 `Mesh` 띠 방식은 일부 시점에서 선폭·접합부 표현이 달라졌고, 일관된 성능 이점도 확인되지 않았다.
- **구:** 시점에 따라 바뀌는 곡면 경계의 안팎에 반 두께씩 표시하기 위해 본체를 복제한 `Mesh`를 확장하고, 축소 실루엣 마스크로 내부를 제외한다.

원판·파이프는 U3dLine을 경유하지 않고 전용 BufferGeometry·ShaderMaterial을 가진 Mesh로 생성한다. 공통 스타일·단위 갱신과 좌표 재질 수명은 전용 메시 생성부가 연결하고 AO·불투명 깊이·부모 변환은 공통 등록부를 따른다.

구의 외곽선은 확장한 구에서 축소 구의 실루엣 영역을 마스크로 제외해서, 가운데가 빈 테두리처럼 보이게 하는 방식을 사용한다.  
축소 마스크는 기존 렌더 타깃 또는 기본 캔버스에서 복사한 지형 깊이로 가림을 검사한다. 깊이 텍스처 크기를 유지하며 실제 색상 렌더 목록의 구 마스크 영역을 본체 draw 전에 한 번 복사한다. 객체·재질 콜백이 끝난 변환을 반영하며 구에 추가 렌더 콜백이 등록되어 이후 변환을 예측할 수 없으면 전체 뷰포트를 보관한다. 지형에 가린 마스크 영역은 테두리에서 제외하지 않으므로 본체 아래의 틈을 외곽선 색으로 메운다. 다른 도형의 외곽선 형상과 코너·내부 모서리 처리는 유지한다.

외곽선은 실제 경계 중심에 lineWidth 전체를 표시하며 안쪽과 바깥쪽에 절반씩 걸친다. 원판·구도 같은 중앙 정렬을 따른다. 선의 폭을 두 배로 바꾸거나 내부·외부 판정에 따라 폭·투명도를 보간하지 않는다. 본체 형상은 변경하지 않는다.

모서리 기반 외곽선은 outlineTension으로 각진 연결부터 둥근 연결까지 조절한다. 선분과 렌더 객체를 유지하며 같은 U3dLine의 연결 영역을 꼭짓점당 한 번 그린다. 기본값 1은 기존 둥근 끝을 사용하고 연결 영역을 그리지 않는다. 값이 1 미만이면 인접 모서리로 연결부를 계산하며 미터 원근 모드는 직선의 실제 두께를 포함한 접선과 꼭짓점 구의 투영을 공유한다. 급각은 연결 좌표계에서 반 두께의 네 배로 제한하며 원판·구·원기둥·파이프의 곡면 실루엣은 바꾸지 않는다.

## 3. 정규 자연어 수도코드

```spec
UGeometryOutlineTarget 타입 정의
    일반 도형의 UMesh 또는 별도 렌더 본체인 USpeedModelFilterMesh다.

U3dOutlineFactory 콜백 타입 정의
    geometry: BufferGeometry는 갱신 시점의 본체 형상이다. 반환은 생성한 Mesh 또는 그릴 형상이 없음을 나타내는 undefined다.

U3dOutlineMaterialState 타입 정의
    object: Mesh는 임시 재질을 적용한 객체다.
    material: Material | Array<Material>은 복원할 원래 재질이다.
    styleMaterial: Material | Array<Material> | undefined는 이전 스타일 연결이다.

UOutlineCornerNode 타입 정의
    position: Vector4는 모서리의 로컬 정점이다.
    screen: Vector3는 원근 나누기 전 화면 X·Y와 clip W이며 valid는 근접면과 원거리면 안의 유효 정점 여부다.
    directions는 인접 정점 인덱스·정규화한 화면 방향·방위각과 미터 원근 모드의 덮임 구간 끝각을 재사용하는 배열이다.

U3dOutline 클래스 정의
    _tension: {value: number} = {value: 1}
        소유 도형의 생성 옵션·공개 API가 갱신하며 색상·좌표·AO·깊이 재질이 공유하는 코너 반경 비율이다.
    #owner: 도형
        외곽선의 스타일·생성 방법·수명을 관리하는 소유 도형이다. 실제 렌더 메시와 다를 수 있다.
    _targetMesh: UGeometryOutlineTarget | undefined
        외곽선을 추출할 geometry를 가지며 생성된 외곽선을 자식으로 포함하는 실제 렌더 메시다. 일반 도형은 #owner와 같고, 별도 메시를 사용하는 도형은 해당 메시를 저장한다.
    #create: U3dOutlineFactory | undefined
        현재 본체 형상을 받는 생성 전략이다. 표시를 꺼도 유지하여 다음 표시와 형상 교체에 재사용한다.
    #offset: number = 0
        본체 기준 외곽선의 렌더 순서 차이다.

    constructor(owner: 도형)
        동작: 도형을 보관한다. 외곽선을 미리 생성하지 않는다.

    static _getNormalMaterial(object: Object3D) -> Material | undefined
        동작: 소유자가 등록한 렌더 객체의 전용 법선 재질을 반환한다. 일반 선과 등록 해제 객체는 undefined다. 사용자 userData에 컨트롤러를 넣지 않고 WeakMap으로 소유자를 연결한다.

    static _getStyleMaterial(object: Object3D) -> Material | Array<Material> | undefined
        동작: 선택 마스크의 임시 교체 중에는 저장한 원본을, AO 법선·보조 깊이 객체에는 소유한 색상 재질을 반환한다. 일반 객체는 현재 재질을 반환한다. 깊이·밝기·대비의 uniform을 임시 출력 재질에 중복 주입하지 않는다.
    static _setStyleMaterial(object: Object3D, material: Material | Array<Material> | undefined) -> Material | Array<Material> | undefined
        동작: 임시 패스의 원본 스타일 재질을 저장하고 이전 연결을 반환한다. undefined는 연결을 해제한다. 호출자는 finally에서 이전 연결을 복원한다.

    static _pushMaterialOverride(records: Array<U3dOutlineMaterialState>, object: Mesh, material: Material | Array<Material>, originalMaterial: Material | Array<Material> = object.material) -> void
        동작: 객체·복원할 재질·이전 스타일 연결을 records에 쌓고 보조 재질로 바꾼다. 이미 연결한 색상 원본이 있으면 중첩 패스에서도 유지하고, 없으면 originalMaterial을 스타일 원본으로 연결한다.

    static _restoreMaterialOverrides(records: Array<U3dOutlineMaterialState>) -> void
        동작: records의 마지막 상태부터 객체의 재질과 이전 스타일 연결을 복원하고 목록을 비운다. 호출자는 성공·실패 모두 finally에서 복원한다.

    static _withRenderState(renderer: URenderer, scene: UScene, render: () -> void) -> void
        동작: 동기 보조 그리기를 실행하고 렌더 상태를 복원한다. [위임: withOutlineRenderState(renderer, scene, render)]

    _replace(create: U3dOutlineFactory, offset: number = 0) -> void
        동작: 소유 도형을 렌더 본체로 저장하고 생성 전략과 렌더 순서 차이를 보관한 뒤 현재 형상으로 갱신한다.

    _refresh() -> void
        동작:
            외곽선 미지원 도형은 종료한다. 생성 전략이 없으면 공통 전략을 설정한다.
            기존 주 외곽선을 해제한다. 표시가 꺼졌거나 소유 도형이 해제됐으면 종료한다.
            실제 렌더 본체의 현재 geometry에 position이 없거나 비어 있으면 종료한다.
            현재 형상을 저장한 생성 전략에 전달한다. 결과가 없으면 종료한다.
            생성한 객체에 렌더 본체와 저장한 순서 차이를 연결하고 _outline에 보관하여 본체의 자식으로 추가한다.

    _update(targetMesh?: UGeometryOutlineTarget) -> void
        동작: 공통 렌더 본체와 순서 차이 0, 현재 geometry를 받는 생성 전략을 저장한 뒤 갱신한다. 전략은 본체의 첫 재질이 없으면 생성하지 않고, TubeGeometry·CircleGeometry는 도형의 전용 생성 함수를 호출하며 나머지는 모서리를 추출한다. 실제 렌더 본체의 깊이 검사·월드 변환·렌더 순서를 따르고 raycast는 비활성화한다.

    _createEdge(geometry: BufferGeometry, depthTest: boolean, thresholdAngle: number = 1, LineType?: U3dLine 생성자) -> Mesh
        동작: EdgesGeometry로 추출한 선분을 _createSegments에 전달하고 임시 추출 형상을 해제한다. U3dLine으로 만든 메시 엣지는 #retainBranchCaps와 bindOutlineCorners를 적용한다. 전용 원판·원기둥·파이프의 선분 생성 경로에는 적용하지 않는다.
    #retainBranchCaps(outline: 인덱스 선분 외곽선) -> void
        동작: 세 선분 이상이 만나는 메시 분기점은 특정 두 선분의 경로로 연결하지 않고 각각의 둥근 끝마개를 유지한다. 해당 끝의 이웃 attribute를 자기 끝점으로 바꾸고, 남은 연결이 없으면 연결 attribute와 U_LINE_JOIN을 제거한다. 두 선분만 만나는 경로의 중복 합성 방지 마스크는 유지한다. 일반 U3dLine의 연결 정책은 바꾸지 않는다.
    _createSegments(edges: BufferGeometry, depthTest: boolean = true, LineType?: U3dLine 생성자) -> Mesh
        동작: 지정한 선 생성자는 공유 정점과 인덱스 선분으로 구성하고, 생략하면 LineSegments2와 ULineMaterial을 사용한다. 위도 보정한 미터 두께 또는 픽셀 두께와 독립적인 외곽선 투명도를 적용한다. 색상 재질은 depthWrite=false이며 깊이 편향과 렌더 직전 뷰포트·단위·두께 갱신을 연결한다. 보조 재질을 먼저 그릴 때도 선에 적용한 렌더 두께를 색상 원본에 반영해 좌표·AO 동기화가 이전 두께를 복원하지 않도록 한다. 입력 형상은 호출자가 소유한다.
    _createCircle(geometry: BufferGeometry, depthTest: boolean) -> Mesh
        동작: 공유 둘레 정점의 평면 띠를 구성하고 실제 경계 양쪽에 반 두께씩 단위별 확장을 적용한다. U3dCircle은 전용 평면 셰이더 전략으로 재정의할 수 있다.
    _createSilhouette(geometry: BufferGeometry, depthTest: boolean = true) -> Mesh
        동작: 복제 곡면의 앞면을 반 두께만 확장하고 같은 양만큼 축소한 실루엣 마스크를 제외하여 원래 경계 중심의 테두리를 만든다.
            생성 시 본체의 경계 구를 복제해 외곽선의 로컬 경계로 보관하며, 위도 이동으로 본체 경계가 갱신되어도 외곽선 월드 배율은 한 번만 적용하여 축소 비율을 계산한다.
            축소 변환은 별도 행렬에만 적용하므로 본체 정점을 보존한다. meter/pixel 단위와 DPR을 반영하고 색상·법선은 같은 형상과 마스크를 따른다. frustumCulled=false로 확장 부분의 화면 경계 표시를 유지하며 형상·재질은 독립적으로 소유한다.
            SphereGeometry에는 본체를 occlusionSource로 전달해 지형에 가려진 축소 마스크를 제거한다. 외곽 곡면 자체의 앞면 깊이 검사는 유지하며 지형 접점에 새로운 모서리선을 만들지 않는다.

    _register(outline: Object3D, offset: number = 0, owner: UGeometryOutlineTarget = this.#owner) -> void
        동작: owner._outline과 다른 객체면 기존 외곽선과 소유 자원을 제거·해제한다. 자동 외곽선 표식과 소유자를 등록하고 저장 투명도를 적용한다. matrixWorld와 renderOrder는 렌더 목록 수집 시점부터 실제 본체의 최신 값과 로컬 변환·offset을 따른다. 전용 법선 재질이 없으면 공통 AO 재질을 연결하고, 색상에 깊이를 쓰지 않는 셰이더 선에는 불투명 내부 깊이 그리기를 연결한다. 동일 객체의 반복 등록은 자원과 보조 재질을 유지한다. 등록을 마치면 owner._outline에 유일한 외곽선 객체를 보관한다. 형상 dispose에서는 소유자와 원본 색상 재질 조회를 제거한다.

    _bindPixelWidth(outline: Mesh, widthRatio: number = 1) -> void
        동작: 메시의 색상·좌표 재질이 같은 픽셀 폭을 사용하도록 uniform과 렌더 직전 갱신을 연결한다. 미터 모드는 기존 월드 폭을 유지한다.
    _applyOpacity(outline: Object3D) -> void
        동작: 소유 도형의 lineOpacity를 색상 재질과 해당 opacity uniform에 반영한다. 0이면 숨기며 일반 자식과 본체의 투명도를 바꾸지 않는다.
    _dispose() -> void
        동작: 기존 _outline 조회와 부모 연결을 제거한다. U3dLine은 좌표 출력 재질을 포함한 기존 dispose를 호출하고 메시 외곽선은 소유 형상과 색상 재질을 해제한다. 공유 본체 형상과 사용자 자식은 해제하지 않는다.

```

## 4. 공통 처리 기준과 제약

```spec
외곽선 스타일·getOutlineObject·isOutline을 유지한다. 원판·파이프는 전용 Mesh로 반환하며 U3dLine 전용 API는 제공하지 않는다. 컨트롤러 자체는 사용자 렌더 객체가 아니다.
외곽선의 생성·교체·스타일 변경·해제는 owner._outline 하나를 대상으로 하며, 원판·원기둥·코너 처리로 독립 외곽선 객체를 추가하지 않는다.
도형별 셰이더는 색상·좌표 패스에서 같은 경계를 사용한다. 원판은 평면 법선을 직접 제공하고 나머지는 확장한 형상으로 공통 법선을 제공한다.
법선 버퍼의 alpha는 GeGTAOPass 내부 합성 계약이다. 외곽선이 가림에 참여하더라도 장식 색상에는 AO를 다시 곱하지 않으며 일반 본체의 AO는 유지한다.
구름의 선행 합성과 불투명 외곽선 내부 깊이 계약은 소유권 이동으로 바꾸지 않는다.
외곽선과 보조 깊이는 Three.js의 기존 intersectsFrustum 경로에서 실제 렌더 부모가 받은 판정 결과를 공유한다. 스타일 소유자가 별도 객체인 경우에도 실제 부모에 연결한다. 부모 판정을 다시 실행하지 않으며 프레임별 상자 투영·코너 확장·재질 검사·렌더 목록 push 래핑은 하지 않는다. 제외된 외곽선은 형상 업로드 전부터 빠져 실루엣·코너 자료 계산, 해당 DataTexture 업로드, 마스크·표면 기록과 draw를 생략한다. API setter의 본체 형상 갱신은 유지한다.
부모의 기본 경계를 그대로 따른다. 외곽선 두께나 외곽선 객체의 별도 변환을 확인하지 않으므로 본체가 시야 밖으로 판정되면 화면 가장자리에 남아 있던 외곽선도 생략된다. 가장자리 잘림을 허용한 정책이며 사용자 visible·본체 경계는 바꾸지 않는다.
긴 파이프의 기본 경계 구가 화면과 겹치면 실제 관이 화면 밖이어도 자식이 통과할 수 있다. 이 경우 이전 개별 외곽선 컬링보다 계산·업로드·그리기가 늘 수 있으며 이 손실도 허용한 단순 공유 정책이다. 본체 경계 정밀화는 추가하지 않는다.
장면 렌더 준비의 수집 순번과 실제 Frustum/FrustumArray 식별자를 함께 기록한다. 다른 카메라·렌더러·패스·layers에서 이전 결과를 쓰지 않는다. 부모 frustumCulled=false, 부모 layers 제외, 연결 뒤 사용자 판정 훅 교체 등 현재 부모 결과가 없으면 자식은 통과시키며 별도 경계를 계산하지 않는다.
부모 그룹의 장면 이동과 형상 해제를 추적하고 마지막 사용 해제에서 부모·자식·장면의 원래 훅과 속성을 복원한다. WebGLRenderer나 renderLists를 수정하지 않아 컨텍스트 복구 뒤에도 새 네이티브 판정을 그대로 공유한다.
화면 밖 형상 변경 dirty는 유지하며 재진입한 실제 렌더에서 실루엣·텍스처를 갱신한다. 파이프 표면 기록용 단면 경계와 기존 viewport 예산·LRU는 유지한다.
원기둥 접선 외곽선의 해석 표면 깊이는 본체의 래스터 깊이와 반올림 오차가 남지 않도록 화면 깊이 미분을 0.00000024 이상 0.00001 이하로 제한하여 앞당긴다. 최소값은 24비트 깊이 네 단계 상당이며 색상·좌표·AO에서 같은 보정을 사용한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
