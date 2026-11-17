# GeGTAOPass 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

Three.js GTAOPass에 지도 장면의 객체 제외 규칙과 bind-space 스키닝 법선 출력을 결합한다. AO는 깊이·법선으로 표면 근처의 차폐를 추정하는 후처리다.

### 1.2 책임 범위

장면의 임시 가시성과 스키닝 재질을 바꾸고 복원하며, 법선·깊이 버퍼를 만든 뒤 기반 GTAO 계산과 합성에 위임한다. 카메라 변경 시 직교 카메라의 패스를 끈다. 패스 생성·등록과 사용자 사용 요청은 URenderer가 소유한다.

### 1.3 주요 동작 방식

일반 객체는 양면 MeshNormalMaterial로 그린다. U3dOutline에 등록된 전용 법선 재질을 가진 외곽선은 실제로 확장한 표면을 기록하고 나머지 선·입자·일부 인스턴스 객체와 명시적 AO 제외 객체는 잠시 숨긴다. bind-space 본 행렬이 있는 객체는 일반 override에서 제외하고 전용 재질로 같은 법선 타깃에 덧그린다.

### 1.4 주요 사용처와 연계 대상

URenderer.initComposer가 생성하며 updateGtaoMaterial과 updatePdMaterial은 기반 GTAOPass의 설정 인터페이스를 사용한다. UHighLowPatch의 법선 재질 캐시를 재사용한다.

자체 G-buffer의 법선 RGB는 표면을, alpha는 AO 색상 적용 비율을 기록한다. 일반 본체와 배경은 1, 외곽선은 0이다. 최종 기본 합성에서 이 비율로 AO 곱셈을 제한하여 본체 AO와 깊이 가림을 유지하고 외곽선 색상은 보존한다. 외부 normalTexture를 제공한 경우 이 내부 alpha 계약을 적용하지 않는다.

## 3. 정규 자연어 수도코드

```spec
createBindSkinnedAOPass(pass: GeGTAOPass) -> object
    역할: bind-space 스키닝 객체의 조회·임시 가시성·법선 재질 교체와 캐시 수명을 연결한다.
    의존:
        createBindSkinnedNormalMaterialCache — UHighLowPatch의 스키닝 법선 재질 캐시 생성; 함수: {createBindSkinnedNormalMaterialCache()}
    동작:
        재질 캐시를 생성하고 조회·숨김·복원·추가 렌더·해제 함수를 가진 객체를 반환한다.
        조회 시 scene.traverse로 자체 visible이 true인 객체를 검사한다. 객체 또는 skeleton의 userData.__bindBoneMatrices가 truthy이고 isSkinnedMesh이거나, isInstancedMesh2와 boneTexture가 truthy인 객체를 선택한다. 상위 객체의 가시성은 조회 조건에 포함하지 않는다.
        지정 객체 숨김은 현재 visible인 객체만 기록한 뒤 false로 바꾸며 복원은 기록된 객체의 visible을 true로 되돌린다. 빈 입력은 빈 결과 또는 무동작이다.
        추가 렌더 대상이 없으면 종료한다. 있으면 대상 Set을 만들고 자체 visible인 나머지 Mesh를 숨긴다. 대상 중 isMesh인 객체의 원래 material을 기록하고 캐시의 객체별 재질로 바꾼다.
        기존 clear 색·알파와 autoClear를 보관하고 normalRenderTarget에 autoClear=false로 기존 내용을 지우지 않고 장면을 그린다. 정상 반환 시 autoClear·clear 색·알파를 복원한다. 렌더 타깃은 복원하지 않는다.
        추가 렌더의 성공·실패와 관계없이 교체한 material과 숨긴 일반 Mesh의 visible을 복원한다.
        반환 객체의 dispose는 스키닝 재질 캐시의 dispose가 있으면 호출한다.

GeGTAOPass extends GTAOPass 클래스 정의
    의존:
        THREE.GTAOPass — AO 버퍼·계산·합성과 자원 해제; 상속: {GTAOPass}

    _bindSkinnedAOPass: object
        스키닝 보조 연산과 재질 캐시의 수명 객체
    _normalMaterialRecords: Array<U3dOutlineMaterialState> = 빈 배열
        AO 법선 렌더에서 교체한 객체와 원래 재질·이전 스타일 연결
    option: undefined
        생성 시 미지정 상태로 두는 값
    normalMaterial: MeshNormalMaterial
        교체한 양면 법선 재질. 매 그리기에서 본체의 polygonOffset·factor·units를 따른다.
    output: number = 0
        기반 GTAOPass의 출력 종류
    camera: Camera
        기반 패스의 현재 카메라
    enabled: boolean
        카메라 갱신 시 직교 여부로 결정하는 실행 상태

    constructor(scene: Scene, camera: Camera, width?: number, height?: number, parameters?: object, aoParameters?: object, pdParameters?: object)
        의존:
            MeshNormalMaterial — 양면 법선 재질 생성; 생성자: {new MeshNormalMaterial()}
            THREE.GTAOPass — 입력을 전달하는 기반 초기화; 생성자: {super()}
        동작:
            모든 인수를 기반 생성자에 전달한다. 생략된 크기와 설정의 기본값은 기반 생성자가 결정한다.
            기반 normalMaterial을 해제하고 DoubleSide·NoBlending의 MeshNormalMaterial로 교체한다.
            스키닝 보조 연산을 만들고 output=0, option=undefined로 초기화한다.

    dispose() -> void
        동작:
            스키닝 보조 캐시가 있고 dispose가 있으면 호출한 뒤 기반 dispose로 AO 자원을 해제한다.

    override render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget, deltaTime?: number, maskActive?: boolean) -> void
        의존:
            GTAOPass — 일반 법선 렌더와 AO 계산·합성; 함수: {render()}; 속성 읽기: {_renderGBuffer, normalRenderTarget}; 속성 쓰기: {_renderGBuffer}
        동작:
            현재 _renderGBuffer를 보관한다. AO 합성 재질에 현재 normalTexture와 자체 G-buffer 사용 여부를 전달한다.
            _renderGBuffer가 true이면:
                스키닝 객체를 bindSkinned로 조회한다.
                bindSkinned.length가 0이면 기반 render에 모든 인수를 전달하고 반환한다. 성공·실패와 관계없이 임시 가시성과 교체한 외곽선 색상 재질을 복원한다.
                bindSkinned.length가 0이 아니면 일반 제외 가시성과 외곽선 법선 재질을 적용한다.
                스키닝 객체를 추가로 숨겨 normalMaterial의 override로 normalRenderTarget을 0x7777ff·알파 1로 초기화하여 그리고, 성공·실패와 관계없이 스키닝 객체 가시성을 복원한다.
                스키닝 전용 추가 렌더를 실행하고 성공·실패와 관계없이 일반 제외 가시성과 교체한 외곽선 색상 재질을 복원한다.
            _renderGBuffer가 false이거나 스키닝 전용 렌더를 끝냈으면 _renderGBuffer=false로 기반 render를 호출하고 성공·실패와 관계없이 원래 값을 복원한다.

    _traverseForOverride(object: Object3D, visibilityCache: Array<Object3D>) -> void
        의존:
            THREE — 인스턴스·배치 객체 구분; 속성 읽기: {InstancedMesh, BatchedMesh}
            UDEF — 지형 그룹 이름 판정; 속성 읽기: {RENDER_TYPE.TERRAIN}
            U3dOutline — 전용 법선 조회와 재질·스타일 연결 보관; 함수: {_getNormalMaterial(), _pushMaterialOverride()}
        동작:
            object.visible이 false이거나 object.children이 없거나 길이가 0이거나 object.name이 UDEF.RENDER_TYPE.TERRAIN이면 하위 탐색을 종료한다.
            자식 중 child.visible=false인 객체는 건너뛴다.
            U3dOutline._getNormalMaterial(child)가 재질을 반환하고 원래 material.visible이 false가 아니며 expectAO·exceptAO가 모두 falsy이면 U3dOutline._pushMaterialOverride로 객체와 재질·이전 스타일 연결을 _normalMaterialRecords에 보관하고 전용 법선 재질로 바꾼다. 이 객체는 일반 선 제외 조건을 적용하지 않고 자식까지 재귀 탐색한다.
            InstancedMesh·BatchedMesh 또는 userData.expectAO·exceptAO, isPoints·isLine·isLine2·isLineSegments2·isParticleScene·isFire가 truthy인 자식은 cache에 넣고 숨긴다. expectAO와 exceptAO 모두 제외 조건으로 사용한다.
            그 밖의 자식은 같은 제외 규칙으로 재귀 탐색한다.

    override _overrideVisibility() -> void
        의존:
            GTAOPass — 현재 장면과 가시성 복원 목록; 속성 읽기: {scene, _visibilityCache}
        동작: 현재 scene과 기반 _visibilityCache에 제외 순회를 적용한다.

    override _renderOverride(renderer: WebGLRenderer, overrideMaterial: Material, renderTarget: WebGLRenderTarget, clearColor: ColorRepresentation, clearAlpha: number) -> void
        의존:
            GTAOPass — 법선 override 출력; 함수: {super._renderOverride()}
            U3dOutline — 보조 렌더 상태 보관·복원; 함수: {_withRenderState()}
        동작: U3dOutline._withRenderState 안에서 기반 법선 출력을 실행한다. 성공·실패 모두 렌더 타깃·뷰포트·지우기·장면 override 상태를 호출 전으로 복원하고 실패는 다시 전달한다.

    override _restoreVisibility() -> void
        의존:
            GTAOPass — 임시 가시성 복원; 함수: {_restoreVisibility()}
            U3dOutline — 재질·스타일 연결 역순 복원; 함수: {_restoreMaterialOverrides()}
        동작: 기반 가시성 복원을 실행하고 성공·실패와 관계없이 U3dOutline._restoreMaterialOverrides로 기록한 원래 재질과 이전 스타일 연결을 역순으로 복원하여 목록을 비운다. 전용 법선 재질의 생성·해제는 외곽선 소유자가 담당한다.

    updateState(camera: Camera) -> void
        의존:
            GTAOPass — 현재 카메라와 활성 상태; 속성 쓰기: {camera, enabled}
        동작: camera를 현재 카메라로 저장하고 enabled를 !camera.isOrthographicCamera로 설정한다. 사용자 사용 요청은 저장하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
