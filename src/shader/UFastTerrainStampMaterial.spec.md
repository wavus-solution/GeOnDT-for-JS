# UFastTerrainStampMaterial 명세

> 상태: 구현 관찰 초안

## 1. 개요

CPU에서 확정한 지면 도형의 거리 snapshot을 읽어 채움과 외곽선을 합성하며 선택적으로 채움의 두 색 Gradient를 보간한다. 경계에서 충분히 떨어진 내부는 관리자가 미리 합성한 채움색을 재사용하고, 경계 부근만 도형별 거리 snapshot으로 평가한다. 기존 지형 draw에 GLSL과 uniform을 연결하므로 새 지형 메시나 화면 깊이 캡처를 요구하지 않는다. 원래 polygon의 모든 변을 매 화면 픽셀마다 순회하지 않는다. snapshot·내부 합성 texture는 관리자가, metadata texture는 이 재질이, cached shader의 고정 uniform binding은 지형 메시가 소유한다.

## 2. 요구사항과 품질 기준

```spec
도형별 채움 뒤 선, Helper의 낮은 renderOrder 뒤 높은 순서로 source-over를 적용한다.
큰 world 원점 차이는 CPU double에서 계산하고 GPU에는 상대 좌표를 전달한다.
CSS 선폭은 renderer의 pixel ratio와 화면 XY 미분으로 유지하며 world 선폭은 거리 단위를 그대로 쓴다. 원경·수평에 가까운 시점에서 유효한 거리 저장 범위를 넘으면 선폭과 AA 폭을 함께 축소하여 경계 밖 번짐을 방지한다.
관리자 재생성 뒤 같은 GLSL program을 재사용해도 종료된 관리자의 count와 texture를 참조하지 않는다.
비동기 준비 중 관리자의 구성이나 수명이 바뀌어도 컴파일 시작 때 고정한 key와 GLSL의 page 수·Gradient 여부를 일치시킨다.
일반 TerrainStamp·terrain decal·기존 조명 및 fog 훅은 보존한다.
```

## 3. 정규 자연어 수도코드

```spec
UFastTerrainStampMaterial extends MeshLambertMaterial 클래스 정의
    처리 기준: Helper 내부 표시 도구로 JSDoc @private 분류를 사용한다.
    #uniforms: UFastTerrainStampMaterialUniforms = INTERNAL.createUniforms()
        필드 초기화로 공용 uniform을 준비한다.
    #origin: Vector3 = 원점
    #pages: number = 0
    #gradients: boolean = false
        실제 Gradient 채움이 있을 때만 보간 GLSL을 컴파일한다.
    #pageKeys: Array<string> = 빈 배열
        page 구성 변경 때만 uniform 이름을 만들어 매 타일 draw에서 재사용한다.
    #programKey: string = 'UFastTerrainStampMaterial_footprint3_0'
        현재 shader 구성을 나타내는 문자열을 보관하여 매 타일의 key 조회에서 재사용한다.
    _disposed: boolean = false
    name: string = 'UFastTerrainStampMaterial'
        기반 재질에서 상속한 표시 이름
    forceSinglePass: boolean = true
        기반 재질에서 상속한 투명 양면 표시 기준
    needsUpdate: boolean
        기반 재질에서 상속한 갱신 요청이며 texture page 수 또는 Gradient 활성 여부 변경 시 true를 대입한다.

    constructor()
        의존: MeshLambertMaterial — 기본 표시 재질 생성; 생성자: {super()}
        동작:
            흰색·투명·depthTest true·depthWrite false·DoubleSide 재질을 만든다.
            name을 UFastTerrainStampMaterial, forceSinglePass를 true로 둔다.

    _setFootprints(records: Array<UFastTerrainStampSnapshot>, origin: Vector3, textures: Array<Texture>, composite?: UFastTerrainStampManagerState['composite']) -> void
        의존: MeshLambertMaterial — page 구성 변경 시 program 갱신; 속성 쓰기: {needsUpdate}
        동작:
            _disposed가 true이면 종료한다.
            polyline이 아니고 gradientColor가 있으며 fillOpacity를 우선하고 없으면 opacity를 사용하여 양수인 행이 있는지 판정한다. page 수나 이 활성 여부가 달라지면 기억한 값·page 이름 목록·program key·needsUpdate를 바꾼다. 빈 textures이면 page 수는 0이다.
            _disposed가 false인 경우에 원점을 복사하고 순서 있는 snapshot의 표현 자료를 포장한다.
            composite가 있으면 채움·경계 거리 하한 texture와 원점 상대 bounds, 최대 pixels·meters 선폭을 uniform에 연결하고 내부 합성을 활성화한다. 없으면 내부 합성만 비활성화한다.

    _createBinding() -> UFastTerrainStampMaterialUniforms
        동작: 지형 메시가 자신의 수명 동안 유지할 새 uniform 객체를 반환한다.

    static _applyToTerrainShader(shader: WebGLProgramParametersWithUniforms, binding: UFastTerrainStampMaterialUniforms | undefined, programKey: string) -> UFastTerrainStampMaterialUniforms | undefined
        동작: 관리자 인스턴스와 독립적으로 고정 key의 지형 합성 구성을 연결하고 재사용 또는 생성한 binding을 반환한다.

    _setObject(object: Object3D, renderer: WebGLRenderer, binding: UFastTerrainStampMaterialUniforms = this.#uniforms) -> void
        의존:
            Object3D — 현재 표시 지형 변환; 속성 읽기: {matrixWorld}
            WebGLRenderer — CSS pixel 비율; 함수: {getPixelRatio()}
        동작:
            외부 binding이면 기존 uniform 객체를 교체하지 않고 활성 수·metadata·모든 현재 page texture·내부 합성 자료의 value를 공용 자료에서 연결한다.
            object의 world translation에서 origin을 CPU double로 뺀 값을 binding의 objectRelative에 기록한다. 고정 네 합성 uniform은 직접 연결하고 page 이름은 보관 목록을 사용하여 타일마다 임시 배열·문자열을 만들지 않는다.
            binding의 pixelRatio를 renderer 값으로 갱신한다.
            원래 지형 geometry나 material의 표현 값은 변경하지 않는다.

    _applyToShader(shader: WebGLProgramParametersWithUniforms, binding: UFastTerrainStampMaterialUniforms = this.#uniforms) -> void
        동작: shader의 고정 customProgramCacheKey를 우선하고 없으면 현재 #programKey를 사용하여 지형 합성 구성을 연결한다.

    _getCount() -> number
        동작: 공용 uniform의 현재 활성 도형 수를 반환한다.

    override onBeforeCompile(shader: WebGLProgramParametersWithUniforms, renderer: WebGLRenderer) -> void
        동작:
            기반 재질의 훅을 호출한다.
            독립 FastMesh용 RGBA 출력 모드로 공용 자료를 연결한다.

    override customProgramCacheKey() -> string
        동작: 보관한 #programKey를 반환한다. 키는 UFastTerrainStampMaterial_footprint3_ 접두어와 page 수, Gradient 활성 시 _gradient를 붙인 문자열이며 구성 변경 시에만 만든다. 같은 variant의 도형 수·색 변경은 key를 바꾸지 않는다.

    override dispose() -> void
        동작:
            이미 해제했으면 종료한다. 최초 호출이면 해제 상태를 먼저 기록한다.
            공용 활성 수를 0으로 비우고 자신이 소유한 metadata texture와 기반 재질만 처분한다.
            관리자의 page texture·지형 geometry는 처분하지 않는다.

UFastTerrainStampMaterialUniforms 부분 타입 명세
    이 명세에서 사용하는 필드:
        u_fastFootprintCount: IUniform<number>
        u_fastFootprintMetadata: IUniform<DataTexture | null>
        u_fastFootprintObjectRelative: IUniform<Vector3>
        u_fastFootprintPixelRatio: IUniform<number>
        u_fastCompositeFill: IUniform<Texture | null>
            순서대로 미리 합성한 내부 채움색
        u_fastCompositeMargin: IUniform<Texture | null>
            모든 도형 경계까지의 보수적인 거리 하한
        u_fastCompositeBounds: IUniform<Vector4>
            합성 범위의 상대 원점과 폭·높이
        u_fastCompositeWidth: IUniform<Vector3>
            최대 pixels 선폭·world 선폭과 내부 합성 활성 여부
    처리 기준: u_fastFootprintPageN uniform은 필요한 page 생성 시 추가한다.

```

## 4. 공통 처리 기준과 제약

```spec
거리 texture의 해상도와 최초 지면 polygon의 정확도는 구분한다. 색 변경만으로 거리 raster를 반복하지 않는다.
지형 메시 수명 동안 binding의 uniform 객체를 보존하며 Fast 없는 variant를 컴파일할 때도 이미 존재하는 binding은 연결한다. 관리자 종료 시 공용 count는 0이 되며 재생성 시 value를 새 자료로 갱신한다.
page 수가 바뀌면 GLSL sampler 구성이 달라져 별도 program key를 사용한다.
두 색 Gradient는 현재 footprint의 공통 frame을 사용한다. 이미지·mask·대상 레이어 기능은 제공하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
