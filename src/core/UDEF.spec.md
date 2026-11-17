# UDEF 명세

> 상태: 구현 관찰 초안

## 1. 개요

엔진 전역에서 공유하는 분류값·기본 설정·리소스 경로와 공통 정적 유틸리티를 제공한다. 키·문자열·좌표·재질 초기화뿐 아니라 Object3D의 해제 소유권과 재진입 방지를 담당한다. 정적 설정은 MAP_REGION의 freeze를 제외하면 쓰기 가능하며 초기값과 이후 조회값을 동일한 불변 상수로 취급하지 않는다. 내부 WASM 경로도 외부 디코더처럼 쓰기 가능한 일반 필드로 선언하며 GeOnDT.setPath의 공통 초기화에서 등록 경로와 제품 루트를 반영한다.

## 3. 정규 자연어 수도코드

```spec
UDEF 클래스 정의
    의존:
        Copyright — 버전·저작권 초기값; 속성 읽기: {Version, Copyright}
        THREE — 렌더·색상·그림자 기본 설정; 상수: {FrontSide, BackSide, DoubleSide, ACESFilmicToneMapping, SRGBColorSpace, VSMShadowMap}
        UResourceManager — 전역 리소스 관리자; 생성자: {new UResourceManager()}
        UPackage — 외부 디코더와 내부 WASM 초기 경로; 속성 읽기: {WORKER.UTIL.DRACO_DECODER_PATH, WORKER.UTIL.TRANS_CODER_PATH, WASM.FILE.PBF_WASM_PATH, WASM.FILE.TERRAIN_DECAL_WASM_PATH}
        UDefaultSource — 구름·지형 노멀·노이즈·앵커 이미지 경로; 속성 읽기: {CLOUD_IMAGE, TERRAIN_NORMAL, BLUE_NOSIE, ANCHOR_POINT}
        UPassInfo — 후처리 패스 이름·순서·종류; 생성자: {new UPassInfo()}
        Web API — 바이트 문자열 디코더; 생성자: {new TextDecoder()}
    속성 — 전역 식별·분류·초기 설정
        static version: unknown = Version
        static copyright: unknown = Copyright
        static INVALID: unknown = Number.MAX_VALUE
        static path: string | undefined
            제품 루트의 일반 필드이며 설정 전에는 undefined다. 직접 대입은 다른 경로를 변경하지 않는다.
        static TERRAIN_NO_DATA: unknown = Math.fround(0.00002922)
        static HEIGHT_METHOD: object = { NOW:'', _RAW: 'raw' , _BASE: 'base' , _1_0: '1_0' }
        static SEARCH_TYPE: string = 'boundingbox'
        static EARTH_RADIUS: number = 6378137.0
        static HALF_WORLD: unknown = Math.PI * this.EARTH_RADIUS
        static DEG_TO_RAD: unknown = Math.PI / 180
        static RAD_TO_DEG: number = 180 / Math.PI
        static GoogleCoordWidth: unknown = Math.ceil(this.HALF_WORLD)
        static Prj: object — EPSG:5179·4326·3857·5186·5187·2097·5173~5177·5181의 proj4 문자열 사전
        static GEOGRAPHIC: string = 'epsg:4326'
        static GOOGLE: string = 'epsg:3857'
        static WORLD: string = '3d'
        static POINT_TYPE: object = { WORLD:'world', GEOGRAPHIC:'geographic' }
        static TILE_SEG: number = 65
        static TILE_SEG_L2: number = 33
        static g_countLayer: number = 0
        static OVERVIEW_STATE: object = { _NONE: 0 , _MOVING: 1 , _END: 2 }
        static FrontSide: unknown = THREE.FrontSide
        static BackSide: unknown = THREE.BackSide
        static DoubleSide: unknown = THREE.DoubleSide
        static resourceManager: unknown = new UResourceManager()
        static DEFAULT_TERRAIN_SHADOW_LEVEL: number = 15
        static TILES_STATE: object = { _NONE: 0, _DOWNLOADING: 1, _PARSING: 2, _FAIL:3, _END: 4, _CACHED: 5, _SKIP:6 }
        static TILES_DISPOSE_TYPE: object = { DISPOSE : 1, // 자식 타일 로드하여 부모 타일 dispose 타입 PARENTCULLED : 2 // parent tile frustum culled로 벗어난 dispose로 자식 tile dispose 타입 }
        static CUSTOM_MODEL: object = { TYPE: { EXTRUDE: 'extrude', //+ default -> extrude GEOMETRY: 'geometry', GROUP: 'group' }, DRAW: { GROUND: 'ground', OBJECT: 'object' } }
        static PACKAGED_MODEL: number = 1
        static NON_PACKAGED_MODEL: number = 0
        static U3F_DETACHED_TOKEN: string = '#detached'
        static U3F_WRITER_KEY: string = 'uu3fwriter'
        static U3F_PACKAGE_WRITER_KEY: string = 'uu3fpackagewriter'
        static U3F_DATA_CHUNK_KEY: string = "u3fdatachunk"
        static UMESH_EXTENSION: string = '.umesh'
        static UMESH_MAGIC_KEY: string = 'UMeshWriter'
        static UMESH_INSTANCE_MAGIC_KEY: string = 'InstanceModel'
        static UMESH_MESH_MAGIC_KEY: string = 'MeshModel'
        static RBUSH: unknown = undefined
        static BOUNDING_TYPE: object = { BOX : 'boundingBox', TREE: 'boundingTree' }
        static BOUNDING_METHOD: unknown = UDEF.BOUNDING_TYPE.BOX
        static MAP_REGION: unknown = Object.freeze({ WORLD: 'world', KOREA: 'korea', CUSTOM: 'custom' })
        static CAMERA_TYPE: object = { PERSPECTIVE : 'perspective', ORTHOGRAPHIC : 'orthographic', }
        static isImmediateUpdateImageModel: boolean = false
        static useSunFlare: boolean = true
        static APP_MODE: object = { _PAN: 1 , _SLOPE: 2 , _LANDSCAPE: 3 , _DISTANCE: 4 , _AREA: 5 , _HEIGHT: 6 , _SUNSHINE: 7 , _VISIBILITY: 8 , _PICK: 9 , _GIZMO: 10 , _FLY: 11 , _WALK: 12 , _POI: 13 , _CUSTOMMODEL: 14 , _PICKSTORE: 15 , _TRACKBALL: 16 , _COMPONENT: 17 , _ORBIT: 18 , _AVERAGEHEIGHT: 19 , _ROUTE: 20 , _USER: 21 , _UNDERGROUND: 22 , _DEPTH: 23 , _ALARM: 24 , _SECTION: 25 }
        static PROCESS: object = { TYPE:{ IMAGE:'TEXTURE', HEIGHT:'HEIGHT', MODEL:'MODEL', USER:'USER', GROUP:'GROUP', TERRAIN:'TERRAIN', MEASURE:'MEASURE' }, NAME:{ IMAGE:'texture', HEIGHT:'height', MODEL:'model', USER:'user', TERRAIN:'terrain' }, WORK_STATE:{ NONE:'none', SEARCH:'search', LOADING:'loading', CACHE:'cache', END:'end' }, WORK_NUM:3 }
        static APP_PROP: object = { IMAGE: { USE_OPACITY: 'image_use_opacity', //+ 이미지 레이어 투명도 값 OPACITY: 'image_opacity', //+ 이미지 레이어 투명도 }, MODEL: { USE_OPACITY: 'model_use_opacity', //+ 모델 레이어 투명도 값 OPACITY: 'model_opacity', //+ 모델 레이어 투명도 }, CLIP: { USE_CLIP: 'use_clipping', AXIS: 'axis', CLIP_X: 'clip_x', CLIP_Y: 'clip_y', CLIP_Z: 'clip_z' } }
        static LAYER_NAME: object = { TERRAIN: 'terrain' , MEASURE: 'measure', SELECT: 'select' }
        static LAYER_TYPE: object = { IMAGE: 'image' , HEIGHT: 'height' , MODEL: 'model' , GROUP: 'group' , WORK1: 'work' , WORK2: 'work2' , WORK3: 'work3' , USER: 'user' , MEASURE: 'measure' , TERRAIN: 'terrain' , SELECT: 'select' , VECTORTILE: 'vectorTile' }
        static VIEW_NAME: object = { SCENE : "viewScene" }
        static TILE_STATE: object = { _none: 0 , _start: 1 , _loading: 2 , _end: 3 , _failed: 4 }
        static TILE_TYPE: object = { TERRAIN: 'terrain' ,MODEL:'model' }
        static TILE_REFINE: object = { ADD: 'ADD' ,REPLACE:'REPLACE' }
        static TILE_QUADNAME: object = { NORTHWEST : 'northWest', NORTHEAST : 'northEast', SOUTHWEST : 'southWest', SOUTHEAST : 'southEast' }
        static PAN_MODE: object = { _default: 0x10 , _object3d: 0x11 }
        static UMESH_TYPE: object = { _default: 0 , _tile: 1 , _user: 2 , _building: 3 , _complexBuilding: 4 , _component: 5 }
        static OVERVIEW_MODE: object = { _map: 0 , _object: 1 }
        static CLIP_AXIS_TYPE: object = { X:'x', Y:'y', HEIGHT:'height', CUSTOM:'custom' }
        static _EMAP_KIND: object = { _BASE: 0, _SAT: 1 }
        static _MSG_WORK: object = { _WORK: 0 , _UPDATE_IMAGE_BUILDING: 1 //+ 건물에 이미지 로딩 , _UPDATE_MESH_BUILDING: 2 //+ 건물에 이미지 로딩 , _UPDATE_HEIGHT_BUILDING: 3 //+ 지형에 건물 반영 , _DELETE_MESH_BUILDING: 4 //+ 건물 삭제 }
        static _MSG: object = { _FAIL: 'failure', _SUCCESS: 'success' }
        static DEPTH_PREVLINE_TYPE: object = { BASE: 'base' , EXTENSIONS: 'extensions' }
        static MAJORFOLDER: object = { ROW: 'RowFirst', COLUM: 'ColumFirst' }
        static PIXEL_RESOLUTION: object = { SD: [720,480], HD: [1280,720], FHD: [1920,1080], QHD: [2560,1440], UHD: [3840,2160] }
        static DEFAULT_MAX_PROCESS: number = 24
        static DEFAULT_PIXEL_RATIO: number = 1.0
        static DEFAULT_RATIO_TILE_SIZE: number = 1.0
        static DEFAULT_RATIO_MODEL_TILE_SIZE: number = 1.0
        static FRAME_STATE: object = { IDLE:'IDLE', WORK:'WORK' }
        static SELECT_MODE: object = { POINT:'point', LINE:'line', AREA:'area', CIRCLE:'circle', BOX:'box' }
        static SELECT_TYPE: object = { COLOR:'color', OUTLINE:'outline', RING:'ring' }
        static SUN_AMOUNT_MODE: object = { POINT:'point', AREA:'area', }
        static MEASURE_TYPE: object = { NONE:'none', LINESTRING : 'LineString', MULTILINESTRING: 'MultiLineString', POLYGON : 'Polygon', MULTIPOLYGON : 'MultiPolygon', POINTBUFFER : 'PointBuffer', POINT : 'Point' }
        static RENDER_ORDER: object = { UNDER_PLANE: -101, UNDER_GRID: -100, SPEED_MODEL_FILTER: -99, MEASURE: 99, MODEL : 100, ROAD: 50, WATER: 200, USER: 500 }
        static POST_MATERIAL: object = { NORMAL : "GNormalMaterial", WORLD_POSITION : "GWorldPositionMaterial" }
        static COMPONENT_ANIMATION: object = { ROUTE: 'route', HOVER_UP: 'hoverUp', HOVER_DOWN: 'hoverDown', MOVE_POINT: 'movePoint', MOVE_SMOOTHLY: "moveSmoothly", CROWD: "crowd" }
        static TONEMAPPING: unknown = THREE.ACESFilmicToneMapping
        static TONEMAPPING_EXPOSURE: number = 1.2
        static DRACO_DECODER_PATH: unknown = UPackage.WORKER.UTIL.DRACO_DECODER_PATH
        static TRANS_CODER_PATH: unknown = UPackage.WORKER.UTIL.TRANS_CODER_PATH
        static PBF_WASM_PATH: string = UPackage.WASM.FILE.PBF_WASM_PATH
        static TERRAIN_DECAL_WASM_PATH: string = UPackage.WASM.FILE.TERRAIN_DECAL_WASM_PATH
            두 WASM 필드는 UPackage.WASM.FILE의 같은 이름 필드를 초기값으로 사용하며 .wasm 파일명을 포함한다. 파일명 뒤에 슬래시를 붙이지 않는다. 직접 지정한 값은 다음 setPath까지 그대로 유지한다.
        static MAX_HEIGHT: number = 99999
        static g_TextureEncoding: unknown = THREE.SRGBColorSpace
        static g_ShadowMapType: unknown = THREE.VSMShadowMap
        static debug: boolean = false
        static imageDebug: boolean = false
        static GLOBAL: object = { _APP: 'app', _GLOBAL: 'global' }
        static MaterialOpt: object = { image: { //shininess는 PhongMaterial에서 쓰임 color:0xffffff, shininess: 0, metalness: 0, roughness: 1, transparent: false, side: THREE.DoubleSide }, model: { //shininess는 PhongMaterial에서 쓰임 color:0xffffff, shininess : 1, metalness: 0, roughness: 1, transparent: false, opacity: 0.1 } }
        static POSTLOADSKIRT: object = { UP: 1, DOWN: -1, LEFT: 2, RIGHT: -2 }
        static DEFAULT_MODEL_EMISSIVE_COLOR: object = { r: 0.006, g: 0.006, b: 0.006 }
        static DEFAULT_IMAGE_EMISSIVE_COLOR: object = { r: 0.07, g: 0.07, b: 0.07 }
        static cloudImgUrl: unknown = UDefaultSource.CLOUD_IMAGE
        static fogColor: number = 0x79AEDA
        static fogValue: number = 0.0000138
        static APP_COMMAND_TPYE: object = { MAIN : 'main', SUB: 'sub', ENV:'env' }
        static RESOURCE: object = { TERRAIN_NORMAL:{ NAME: 'TERRAIN_NORMAL', URL: UDefaultSource.TERRAIN_NORMAL, TEXTURE: null }, BLUE_NOSIE:{ NAME: 'BLUE_NOSIE', URL: UDefaultSource.BLUE_NOSIE, TEXTURE: null }, ANCHOR_POINT:{ NAME: 'ANCHOR_POINT', URL: UDefaultSource.ANCHOR_POINT, TEXTURE: null } }
        static IMPROVE_TEXTURE_LEVEL: object = { none: 0, //모든 향상 효과 없음 low: 1, // anisotropy (비등방성) 적용 medium:2, //지면 노말 속성 재계산 high:3, //지면 노말 맵 적용 ultra:4 }
        static POSTPASS_TYPE: object = { DEFAULT_GRAPHIC:1, OPTIONAL_GRAPHIC:2, MAIN:3, ANALYSIS:4, UTIL:5 }
        static POSTPASS: object = { RENDER: new UPassInfo({name:'renderPass', order:1, type: UDEF.POSTPASS_TYPE.MAIN}), GTAO: new UPassInfo({name:'gtaoPass', order:3, type: UDEF.POSTPASS_TYPE.OPTIONAL_GRAPHIC}), OUTPUT_POST: new UPassInfo({name:'outputPostPass', order:4, type: UDEF.POSTPASS_TYPE.MAIN}), BLOOM: new UPassInfo({name:'bloomPass', order:5, type: UDEF.POSTPASS_TYPE.OPTIONAL_GRAPHIC}), SKYLINE: new UPassInfo({name:'skyLinePass', order:50, type: UDEF.POSTPASS_TYPE.ANALYSIS}), SUNAMOUNT : new UPassInfo({name:'sunAmountPass', order:51, type: UDEF.POSTPASS_TYPE.ANALYSIS}), HEIGHT : new UPassInfo({name:'heightPass', order:52, type: UDEF.POSTPASS_TYPE.ANALYSIS}), DRAW_OVERLAY : new UPassInfo({name:'drawOverlayPass', order:90, type: UDEF.POSTPASS_TYPE.UTIL}), FXAA_DITHER: new UPassInfo({name:'fxaaDitherPass', order:100, type: UDEF.POSTPASS_TYPE.DEFAULT_GRAPHIC}), UNKNOWN: new UPassInfo({name:'unknownPass', order:1000, type: UDEF.POSTPASS_TYPE.UTIL}), BLITL: new UPassInfo({name:'blitPass', order:1000, type: UDEF.POSTPASS_TYPE.UTIL}), OUTLINE: new UPassInfo({name:'outLine', order:1000, type: UDEF.POSTPASS_TYPE.UTIL}), }
        static RENDER_TYPE: object = { SCENE:'scene', GROUP:'group', MODEL: 'model', TERRAIN : 'terrain', ANALY: 'analy', CUSTOM: 'custom', USER: 'user' }
        static DRAW_TYPE: object = { DEFAULT: 1, BASE:2, SWIPE:3 }
        static IDLE_DRAW_SPEED: object = { FAST:10, DEFAULT:1, SLOW:0.5 }
        static U3DVIEW_CAMERA_NAME: string = '_viewCamera'
        static LABEL_DOM_CLASSNAME: string = 'GeOnDT-label-poi'
        static MODEL_IMAGE_UPDATE_DISTANCE: number = 800
        static #uuidStorage: string[] = [] — 미리 생성한 UUID의 후입선출 저장소
        static #textDecoder: TextDecoder — 모듈에서 공유하는 기본 UTF-8 디코더
        static TERRAIN_MAX_NORMAL_SIZE: number = 0.15
        static TERRAIN_MIN_NORMAL_SIZE: number = 0.02
        static NORMAL_REFER_LEVEL: number = 15
        static FAR_NORMAL_DECREASE_RATIO: number = 10
        static NEAR_NORMAL_DECREASE_RATIO: number = 20
        static ASSERT: unknown = UDEF.assert

    static getLabelDomClassName() -> string
        동작: 현재 LABEL_DOM_CLASSNAME을 반환한다.
    static setLabelDomClassName(name: string) -> void
        동작: LABEL_DOM_CLASSNAME을 입력 문자열로 바꾼다.
    static getUrlExtension(url: string) -> string
        동작: 첫 물음표 또는 해시 뒤를 제거하고 점으로 나눈 마지막 항목을 소문자로 반환한다. 점이 없으면 빈 문자열이다.
    static getVersion() -> string
        동작: version 객체의 현재 release 값을 반환한다.
    static getCopyright() -> string
        동작: 현재 copyright 값을 반환한다.
    static createKey(x: number | string, y: number | string, level: number | string, title?: string) -> string
        의존: defined — 제목 존재 여부; 함수: {defined()}
        동작: x_y_level 문자열을 만들고 title이 정의되었으면 밑줄과 title을 덧붙인다. 빈 문자열도 정의된 title이다.
    static createUUID() -> string
        의존: Guid — 미리 생성한 값이 없을 때 UUID 생성; 함수: {Guid()}
        동작: UUID 저장소가 비었으면 Guid 결과를 반환하고, 아니면 마지막 저장값을 pop하여 반환한다.
    static saveUUID() -> void
        의존: Guid — UUID 일괄 준비; 함수: {Guid()}
        동작: 저장 개수가 3000 미만이면 새 UUID 5개를 넣는다. 추가 후 길이가 3000을 넘는지 다시 제한하지 않는다.
    static createIDU3F(bbox: Array<number>, index: number | string) -> string
        동작: bbox 앞 여섯 값을 숫자 덧셈한 결과와 밑줄·index를 연결한다. 각 좌표를 구분자로 이어 붙이는 형식이 아니다.
    static numberPad(n: number | string, width: number) -> string
        동작: n을 문자열로 바꾸고 길이가 width 이상이면 그대로 반환한다. 짧으면 앞에 부족한 수만큼 0을 붙인다.
    static createPromise(callback: function(function(T | PromiseLike<T>): void, function(unknown): void): unknown, isYield: boolean = false) -> Promise<T>
        인터페이스: callback은 전달된 resolve/reject로 반환 Promise를 종결한다. callback의 반환값만으로 성공 종결되지는 않는다.
        의존:
            deferredPromise — 외부 종결 가능한 Promise; 함수: {deferredPromise()}
            Yield — 작업 시작 전 양보; 함수: {Yield(), forceYield()}
            callback — 작업 실행과 종결; 콜백: {callback(resolve, reject)}
        동작: deferred Promise를 만든다. isYield가 true이면 forceYield, 아니면 Yield를 기다린 뒤 callback을 await한다. 이 실행에서 던진 오류는 reject로 전달하고 deferred Promise를 즉시 반환한다.
    static setDracoDecoderPath(path: string) -> void
        의존: defined — 입력 유무; 함수: {defined()}
        동작: 입력이 정의되어 있을 때만 DRACO_DECODER_PATH를 교체한다.
    static getDracoDecoderPath() -> string
        동작: 현재 DRACO_DECODER_PATH를 반환한다.
    static setTransCoderPath(path: string) -> void
        의존: defined — 입력 유무; 함수: {defined()}
        동작: 입력이 정의되어 있을 때만 TRANS_CODER_PATH를 교체한다.
    static getTransCoderPath() -> string
        동작: 현재 TRANS_CODER_PATH를 반환한다.
    static createIDU3F_To_Version1_3(vertex: Array<number>, offsetX: number, offsetY: number, grRect: SimpleRect, grDataRect: SimpleRect) -> string | undefined
        의존:
            defined — 좌표 존재 확인; 함수: {defined()}
            translateRectToRect — 사각 영역 간 좌표 변환; 함수: {translateRectToRect()}
        동작: vertex가 없으면 undefined이다. xy를 소수 4자리로 반올림한 뒤 offset을 더하여 grRect에서 grDataRect로 변환한다. 변환 결과가 falsy이면 NaN_NaN, 아니면 floor한 x_y 문자열을 반환한다.
    static createGoogleKey(x: number | null | undefined, y: number | null | undefined) -> string
        의존:
            defined — 누락 좌표 판정; 함수: {defined()}
            __GSError__ — 누락 오류 알림; 함수: {__GSError__()}
        동작: x 또는 y가 없으면 오류를 알리고 non_xy_param을 반환한다. 각 값을 소수 4자리 반올림 후 소수 2자리 문자열로 바꾸고 길이 11의 0 채움을 적용하여 밑줄로 연결한다.
    static readString(buffer: UByteBuffer, length: number) -> string
        의존: UByteBuffer, Web API — 바이트 읽기·디코딩; 함수: {getByteArray(), TextDecoder.decode()}
        동작: 버퍼에서 length만큼 읽은 바이트 배열을 공유 TextDecoder로 문자열화하여 반환한다.
    static getShadowEncoding() -> THREE.ColorSpace
        동작: 현재 g_TextureEncoding을 반환한다.
    static getShadowMapType() -> THREE.ShadowMapType
        동작: 현재 g_ShadowMapType을 반환한다.
    static setShadowMapType(type: THREE.ShadowMapType) -> void
        동작: g_ShadowMapType을 입력값으로 바꾼다.
    static noResizeTexture(texture: THREE.Texture, wrapping?: THREE.Wrapping) -> void
        의존:
            defined — 랩 옵션 존재 확인; 함수: {defined()}
            THREE — 텍스처 기본 필터·랩 설정; 상수: {ClampToEdgeWrapping, LinearMipmapLinearFilter, LinearFilter}
        동작: wrapping이 없으면 ClampToEdgeWrapping을 선택한다. 입력 텍스처의 양축 wrap·축소 mipmap linear·확대 linear·현재 색 공간을 설정한다. 이미지 크기 자체는 바꾸지 않는다.
    static setTextureImprovement(texture: THREE.Texture, renderer?: THREE.WebGLRenderer | null | undefined) -> void
        의존: THREE — 랩·필터·이방성 한도; 상수: {ClampToEdgeWrapping, LinearMipmapLinearFilter, LinearFilter}; 함수: {WebGLRenderer.capabilities.getMaxAnisotropy()}
        동작: 텍스처 랩·필터·현재 색 공간을 설정한다. renderer의 최대 이방성 결과가 nullish이면 16, 아니면 그 결과를 anisotropy에 넣는다.
    static setTerrainNormalTexture(material: THREE.Material & {normalScale?: THREE.Vector2, normalMap?: THREE.Texture | null, normalMapType?: THREE.NormalMapTypes}, tileLevel?: number) -> void
        처리 기준: 공통 텍스처를 참조하며 복제·UV 변경·해제 책임을 재질에 추가하지 않는다. 리소스의 수명은 공통 소유자가 관리한다.
        의존: THREE — 노멀 배율·좌표계; 생성자: {new Vector2()}; 상수: {TangentSpaceNormalMap}
        동작:
            최대 노멀 크기를 시작값으로 둔다. tileLevel이 truthy이면 기준 레벨보다 작을 때 FAR 비율, 크거나 같을 때 NEAR 비율로 레벨 차이만큼 크기를 줄인다.
            계산 크기가 최소보다 작으면 기존 normalMap·normalScale·normalMapType을 유지하고 반환한다. 그 외에는 xy 노멀 배율, 공유 TERRAIN_NORMAL 텍스처와 TangentSpaceNormalMap을 넣는다. tileLevel 생략과 0은 감쇠 계산을 건너뛴다.
    static DegreesToRadians(degrees: number) -> number
        동작: degree 값을 라디안으로 변환하여 반환한다.
    static RadiansToDegrees(radians: number) -> number
        동작: 라디안 값을 degree로 변환하여 반환한다.
    static DegToRad(degrees: number) -> number
        동작: degree 값을 라디안으로 변환하여 반환한다.
    static RadToDeg(radians: number) -> number
        동작: 라디안 값을 degree로 변환하여 반환한다.
    static radians(e: number) -> number
        의존: THREE.MathUtils — 각도 단위 변환; 함수: {degToRad()}
        동작: 입력 degree를 라디안으로 바꿔 반환한다.
    static degrees(e: number) -> number
        의존: THREE.MathUtils — 각도 단위 변환; 함수: {radToDeg()}
        동작: 입력 라디안을 degree로 바꿔 반환한다.
    static checkInternetExplorer() -> boolean
        의존: Web API — 브라우저 식별 문자열; 속성 읽기: {navigator.userAgent, navigator.appName}
        동작: 소문자 userAgent에 msie가 있거나 appName=Netscape이고 trident가 있으면 true, 아니면 false이다.
    static getPath(fullPath: string) -> string
        동작: 역슬래시를 슬래시로 바꾸고 마지막 경로 항목을 제외한 부분을 끝 슬래시까지 연결해 반환한다.
    static getFilename(path: string) -> string
        동작: 슬래시로 나눈 마지막 항목을 반환한다. 역슬래시는 정규화하지 않는다.
    static removeExt(fileName: string) -> string
        동작: 마지막 점 앞 부분을 반환한다. 점이 없으면 substring의 음수 위치 처리에 따라 빈 문자열이다.
    static assert(condition: unknown, message?: string) -> void
        의존: Web API — 진단 출력; 함수: {console.error()}
        동작: condition이 falsy이면 Assert failed 접두어와 message 또는 빈 문자열을 출력하고 같은 메시지의 Error를 던진다.
    static createOrSetImageLayerMaterial(material?: THREE.Material | undefined) -> THREE.Material
        의존:
            defined — 기존 재질 존재 확인; 함수: {defined()}
            UTerrainMaterial — 없을 때 지형 재질 생성; 생성자: {new UTerrainMaterial()}
            THREE — 양면 재질 기본값; 상수: {DoubleSide}
        동작: 재질이 없으면 DoubleSide·forceSinglePass=true의 UTerrainMaterial을 만든다. 이미지 레이어 설정을 적용한 동일 재질을 반환한다.
    static settingImageLayerMaterial(material: THREE.Material) -> THREE.Material
        의존: THREE — 재질 하위 타입 판정·색상 설정; 함수: {Color.set()}; 상수: {MeshPhongMaterial, MeshStandardMaterial}
        동작:
            MaterialOpt.image의 color·transparent·side를 원본 재질에 적용한다.
            Phong이면 shininess=3·specular=0x484848, 아니면 Standard와 그 하위 타입이면 metalness=0·roughness=1로 설정한다.
            이름을 UImageLayerMaterial로 정하고 입력 재질을 반환한다.
    static settingModelLayerMaterial(material: THREE.Material) -> THREE.Material
        의존: THREE — 재질 종류별 표면 설정; 함수: {Color.set(), Color.setRGB()}; 상수: {MeshPhysicalMaterial, MeshStandardMaterial, MeshPhongMaterial, MeshLambertMaterial}
        동작:
            MaterialOpt.model의 color와 transparent를 원본 재질에 적용한다.
            Physical을 먼저 판정하여 transmission=1, metalness=0.01, roughness=0.68, thickness=0, reflectivity=0.7, ior=2, specularIntensity=1, specularColor=0xaaaaaa, clearcoat=1, envMapIntensity=1, clearcoatRoughness=1, flatShading=true로 둔다.
            Physical이 아닌 Standard이면 flatShading=false·metalness=0.01·roughness=0.75·toneMapped=true로 둔다.
            Phong이면 shininess=1·specular RGB=(1,1,1), Lambert이면 toneMapped=true로 두고 입력 재질을 반환한다.
    static setUseSunFlare(val: boolean) -> void
        동작: useSunFlare를 입력값으로 바꾼다.
    static getUseSunFlare() -> boolean
        동작: 현재 useSunFlare를 반환한다.
    static getDefaultFogInfo() -> {color: number, value: number}
        동작: 현재 fogColor와 fogValue를 담은 새 객체를 반환한다.
    static setCloudImgUrl(val: string) -> void
        동작: cloudImgUrl을 입력값으로 바꾼다.
    static getCloudImgUrl() -> string
        동작: 현재 path와 cloudImgUrl을 그대로 더한 값을 반환한다.
    static disposeObject3D(obj: Record<string, any>, callback?: function) -> void
        인터페이스: obj는 해제 대상이며 callback은 공통 자원 정리 경로에서 obj를 수신 객체·인자로 받는다. 자체 dispose만 실행하는 객체에는 공통 callback을 별도로 호출하지 않는다.
        의존:
            Object3D — 대상의 고유 해제·제거 이벤트; 함수: {dispose(), dispatchEvent()}
            THREE — 공통 정리가 추가로 필요한 기본 dispose 식별; 속성 읽기: {Object3D.prototype.dispose, InstancedMesh.prototype.dispose}
        동작:
            같은 객체가 현재 해제 중이면 반환하고, 아니면 재진입 방지 집합에 넣는다.
            dispose가 함수이면 그 객체를 this로 호출한다. dispose가 없거나 기본 Object3D/InstancedMesh 해제 함수인 경우에만 공통 자원 정리를 추가한다. 사용자 정의 dispose가 있으면 그 구현의 소유권을 존중한다.
            dispatchEvent가 있으면 removed를 발행한다. 어느 단계에서 예외가 나도 finally에서 재진입 집합을 해제하며, 예외는 전달한다. 영구적인 해제 완료 표식은 저장하지 않는다.
    static disposeResource(obj: Record<string, any>, callback?: function) -> void
        의존:
            THREE — 텍스처·재질·기하·자식 연결 해제; 함수: {Texture.dispose(), Material.dispose(), BufferGeometry.dispose(), Object3D.clear()}
            defined — 기하·자식 존재 판정; 함수: {defined()}
            callback — 대상별 정리 후 호출; 콜백: {callback.call(obj, obj)}
            obj — 사용자 이벤트 제거; 함수: {off()}
        동작:
            obj.material과 _opt.material의 단일·배열 재질을 참조 중복 없이 모은다. _opt.texture, 각 재질 map·_oriMap, skeleton.boneTexture도 중복 없이 모은다.
            재질 map을 undefined로 바꾸고 _oriMap을 지우며 boneTexture는 null로 만든다. 텍스처들을 먼저, 재질들을 다음에 해제한다.
            material을 undefined로 정리한다. obj._opt가 truthy이면 _opt도 undefined로 만든다. geometry가 있으면 해제하여 참조를 비운다.
            visible=false로 만든 뒤 callback이 있으면 실행한다.
            children이 있으면 목록 복사본의 각 자식을 객체 해제 진입점으로 정리하고 clear한다. _listeners와 off가 있으면 이벤트를 제거한다.
    static setDateFormat(date: Date & Record<string, any>) -> Date & Record<string, any>
        동작:
            없는 경우에만 String.prototype.string 반복 함수, String/Number.prototype.zf 0 채움 함수를 추가한다. 입력 date에 format이 없으면 토큰 치환 함수를 추가하고 같은 date를 반환한다.
            format은 valueOf가 falsy이면 한 칸 공백을 반환한다. 연도·월·일·한영 요일·12/24시간·분·초·오전/오후 토큰을 치환하며 yy는 연도%1000을 사용한다.
    static rgbToHsl(r: number, g: number, b: number) -> Array<number>
        인터페이스: 0~1 범위 RGB를 기준으로 계산한 [색상, 채도, 명도]를 반환하며 입력 범위를 별도로 제한하지 않는다.
        동작: 최댓값·최솟값 평균을 명도로 둔다. 두 값이 같으면 [0,0,명도]를 반환한다. 아니면 명도 0.5 기준 채도 식을 선택하고 최대 RGB 성분별 색상 구간을 구해 6으로 나눠 반환한다.
    static setRBush(val: boolean) -> void
        의존: ol.ext.rbush — XY 공간 인덱스; 상속: {rbush}; 생성자: {new RBUSH()}
        동작: box.min/max xy를 인덱스 경계로, 최소 x/y 차이를 정렬 기준으로 사용하는 지역 RBUSH 클래스를 정의한다. val이 truthy이면 새 인덱스를 저장하고 아니면 RBUSH를 undefined로 만든 뒤 속성 자체를 삭제한다.
    static rgbStringToHex(rgb: THREE.ColorRepresentation) -> string | null
        의존: THREE.Color — Color 객체의 HEX 조회; 함수: {getHexString()}
        동작: getHexString이 있으면 #와 그 결과를 반환한다. 아니면 입력의 숫자 문자열들을 추출하고 3개 미만이면 null이다. 첫 RGB를 16진수로 바꿔 최소 두 자리로 채운 뒤 #로 연결한다. 숫자형 입력이나 범위 초과값은 별도로 보정하지 않는다. [확인 Q-001]
    static isWorldCoordinate(geometry: THREE.BufferGeometry, threshold: number = 10000) -> boolean
        동작: geometry 또는 position 속성이 없으면 false이다. 앞 최대 30개 성분의 절댓값 최댓값이 threshold보다 큰지 반환한다. 전체 정점을 검증하는 함수는 아니다.
    static toVector3(value: THREE.Vector3 | THREE.Vector3Like | Array<number>) -> THREE.Vector3
        의존: THREE.Vector3 — 벡터 타입 판정·생성; 생성자: {new Vector3()}
        동작: 이미 Vector3이면 원본 참조를 그대로 반환한다. 배열이면 앞 세 값을, 그 외에는 xyz를 사용해 새 Vector3를 만든다.
```

## 4. 공통 처리 기준과 제약

```spec
공개 정적 설정은 호출 시 현재 값을 읽는다. 경로·기본 재질·그림자 설정을 외부에서 바꾸면 이후 생성·설정 결과가 바뀐다.
disposeObject3D의 재진입 방지는 동기 해제 호출이 끝날 때 해제한다. 사용자 정의 dispose의 자원 소유권을 공통 해제로 중복 처리하지 않는다.
disposeResource의 중복 제거 범위는 한 객체의 수집 단계이다. 별도 객체 사이에서 공유하는 재질·텍스처를 자동 참조 계수로 관리하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
