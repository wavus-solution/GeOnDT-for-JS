# U3dApp 명세

> 상태: 구현 관찰 초안

## 1. 개요

3D 지도 앱의 컨테이너, 카메라와 렌더러를 구성하고 지도·레이어 작업과 프레임 렌더링을 연결한다. 지도 컨트롤, 환경, 분석, 보기·오버레이와 로딩 상태를 공개 API로 제어한다. UDevToolView와 U3dAppEventHandler가 앱 설정·입력을 연결하고, 생성 옵션의 auto가 true이면 초기화 후 렌더러 루프를 시작한다.

## 2. 요구사항과 품질 기준

```spec
사용자 로딩 총량·현재량과 엔진 로딩 상태를 기존 계산 기준으로 합쳐 진행률을 표시한다.
로딩 root와 채움 요소는 DOM으로 생성하며 사용자 CSS로 위치·크기·색상·모양을 지정할 수 있어야 한다.
공개 로딩 API 이름과 기본 DOM ID loading-canvas를 보존한다.
비동기 작업 결과는 표준 Promise 체이닝을 따른다. then 콜백은 마이크로태스크로 실행되고 반환값은 다음 체인 결과가 되며 예외는 거부로 전달된다.
```

## 3. 정규 자연어 수도코드

```spec
TargetRectOption 부분 타입 명세
    이 명세에서 사용하는 필드:
        x: number
        y: number
        level?: number = 5
        z?: number (기존 타일 레벨 별칭이며 level이 우선)

U3dEmapLayerCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
        baseurl?: string
        url?: string
        layername?: string
        ext?: string
        apikey?: string
        useProxy?: boolean = false
        proxy?: string = 'proxy.jsp?url='
        drawarg?: UDrawArg
        geoextent?: Array<number>
        matrixsetname?: string
        stylename?: string
        ekind?: string | number
        xyorder?: string

U3dEmapLayerCO 타입 정의
    U3dOpenLayerCO & U3dEmapLayerCO_Content

U3dEmapSatLayerCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        layername?: string = 'AIRPHOTO'
        ext?: string = 'image/jpg'
        apikey?: string
        useProxy?: boolean = false
        proxy?: string = 'proxy.jsp?url='
        drawarg?: UDrawArg
        geoextent?: Array<number>
        matrixsetname?: string = 'NGIS_AIR'
        stylename?: string = ''
        ekind?: string | number

U3dEmapSatLayerCO 타입 정의
    U3dEmapLayerCO & U3dEmapSatLayerCO_Content

U3dTMSImageLayerCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
        baseurl: string
        metadata: object
        useproxy?: boolean = false
        proxyurl?: string = './proxy.jsp?url='
        minlevel?: number (원본 TileGrid의 포함형 최소 줌)
        maxlevel?: number (0~32. mercator는 포함형 최대 줌, raster는 1~32의 배타형 상한)
        drawarg?: UDrawArg

U3dTMSImageLayerCO 타입 정의
    U3dOpenLayerCO & U3dTMSImageLayerCO_Content

U3dTempleteTMSImageLayerParam 부분 타입 명세
    이 명세에서 사용하는 필드:
        baseurl: string
        srs: string
        profile: 'raster' | 'mercator'
        extent: Array<number>
        tileSize: number
        matrixIds: Array<number>
        resolutions: Array<number>
        ext: string
        proj?: string | undefined
        minZoom: number
        proxyurl: string
        useproxy: boolean
        reverseY: boolean
        majorFolder?: string | undefined
        origin?: { x: number, y: number } | undefined

U3dLayerCommonCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
        url?: string
        baseurl?: string
        layername?: string
        layernames?: string
        ext?: string
        transparent?: boolean
        reverseY?: boolean
        useproxy?: boolean
        proxyurl?: string
        drawarg?: UDrawArg
        minlevel?: number
        maxlevel?: number
        needxml?: boolean
        xmlurl?: string
        metadata?: object
        animation?: string

U3dModelGroupLayerCO 타입 정의
    U3dLayerCommonCO

U3d3DFModelLayerCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name: string
        layername: string
        baseurl: string
        basename: string
        ext: string
        grouplayer: string
        renderorder: string
        minlevel?: number
        maxlevel?: number
        useproxy?: boolean
        reverseY?: boolean
        usetexture?: boolean
        proxyurl?: string
        opacity?: number
        makeU3FPackage?: number
        isShareMaterial?: number
        isTextureUpdate?: boolean
        textureDistance?: number

U3dTdsModelLayerCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name: string
        baseurl: string
        type?: string
        ext: string
        drawline?: boolean
        needtexture?: boolean
        needxml?: boolean
        xmlurl?: string
        useu3f?: boolean
        u3furl?: string
        listmodel?: Array<object>
        position?: Vector3Like
        scale?: Vector3Like
        rotation?: Euler | Vector3Like

U3dWMSImageLayerCO 타입 정의
    U3dLayerCommonCO

U3dWFSModelLayerCO 타입 정의
    U3dLayerCommonCO

U3dAppPropertyMap 타입 정의
    Record<string, *>

U3dAppTweenHandle 타입 정의
    { stop: Function }

U3dAppRoundRobinState 부분 타입 명세
    이 명세에서 사용하는 필드:
        cursor: number

U3dAppWindowRect 부분 타입 명세
    이 명세에서 사용하는 필드:
        left: number
        top: number
        width: number
        height: number

U3dAppCameraRuntimeState 부분 타입 명세
    이 명세에서 사용하는 필드:
        viewportRatio: number
        fov: number
        near: number
        far: number
        cameraType: 'perspective' | 'orthographic'
        homePosition: Vector3
        homeRotateLeft: number
        homeRotateDown: number
        resolution: number
        zoomLevel: number
        minZoomLevel: number
        maxZoomLevel: number
        modelImageDistance: number
        modelImageDefaultLevel: number
        modelUpdateOffset: number

U3dAppRenderRuntimeState 부분 타입 명세
    이 명세에서 사용하는 필드:
        autoClear: boolean
        logarithmicDepthBuffer: boolean
        preserveDrawingBuffer: boolean
        improveTexture: number
        toneExposure: number
        useSky: boolean
        useFog: boolean
        fogColor: ColorLike | Vector3
        backgroundColor: string
        useSunFlare: boolean
        useCloud: boolean
        useShadowMap: boolean
        autoMove: boolean
        useAutoSpeed: boolean
        frameOptimize: boolean
        ratioTileSize: number
        ratioModelTileSize: number

U3dAppCollectionRuntimeState 부분 타입 명세
    이 명세에서 사용하는 필드:
        overlayList: Array<*>
        viewList: Array<*>
        viewLightList: Array<*>
        lightList: Array<*>
        poiList: Array<*>
        objectList: Array<*>
        editHeightBoxList: Map<string, *>
        listQuadtreeSet: Array<*>
        particles: Array<*>
        fires: Array<*>
        analysisList: Array<*>
        clippingPlanes: Array<*>

U3dAppUndergroundRuntimeState 부분 타입 명세
    이 명세에서 사용하는 필드:
        undergroundDepth: number
        undergroundColor: number
        undergroundOpacity: number
        undergroundGrid: boolean
        undergroundGridDivide: number
        undergroundSetTexture: boolean
        undergroundEdge: boolean
        undergroundEdgeThickness: number
        undergroundFog: boolean
        undergroundFogDensity: number
        undergroundFogStartHeight: number
        undergroundFogEndHeight: number
        undergroundFogColor: Vector3

U3dAppRuntimeState 부분 타입 명세
    이 명세에서 사용하는 필드:
        initialized: boolean
        stopModel: boolean
        stopUpdate: boolean
        stopRender: boolean
        maxProcess: number
        maxDistanceModel: number
        wireFrameRendering: boolean
        nameBaseLayer: string
        containerName: string
        container: HTMLElement
        name: string
        sizeWorld: number
        minlevel: number
        maxlevel: number

U3dAppCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        containername: string
        type?: string | undefined = undefined
        name?: string
        idoverview?: string
        camTargetType?: boolean = true
        homePosition?: GeoPosition
        homeRotateLeft?: Degree = 0
        homeRotateDown?: Degree = 0
        cameraType?: 'perspective' | 'orthographic' = 'perspective'
        maxprocess?: number
        frameOptimize?: boolean = true
        autoClear?: boolean = true
        ratiotilesize?: number = 1.0
        ratiomodeltilesize?: number = 1.0
        searchtype?: 'boundingbox' | 'sphere' = 'sphere'
        methodheight?: 'raw' | 'base' | '1_0' = 'raw'
        fov?: number = 50
        usesky?: boolean = true
        backgroundcolor?: string = 'rgb(200, 200, 200)'
        useFog?: boolean = true
        useCloud?: boolean = true
        useSunFlare?: boolean
        useShadowMap?: boolean = true
        intensitylight?: number = 1.1
        toneExposure?: number = 1.2
        improveTexture?: 'none' | 'low' | 'medium' | 'high'
        pixelResolution?: 'SD' | 'HD' | 'FHD' | 'QHD' | 'UHD' | Array<number>
        logarithmicDepthBuffer?: boolean = true
        pixelRatio?: number = 1.0
        usePostProcess?: boolean
        postOption?: PostProcessParam
        maxlevel?: number = 19
        near?: number = 1
        far?: number = 4007502
        targetrectopt?: TargetRectOption
        skirt?: boolean = true
        passlevel?: number
        useimageopacity?: boolean = false
        imageopacity?: number = 1
        usemodelopacity?: boolean = false
        modelopacity?: number = 1
        modelimagedistance?: number = 800
        modelimagedefaultlevel?: number = 0
        viewportratio?: number = 1
        zoomLevel?: number = 10
        minZoomLevel?: number = 6
        maxZoomLevel?: number = 19
        useautospeed?: boolean = true
        auto?: boolean = true
        automove?: boolean = false
        stoprender?: boolean = false
        undergroundFog?: boolean = false
        undergroundFogDensity?: number = 0.005
        undergroundFogStartHeight?: number = 0
        undergroundFogEndHeight?: number = -5000
        undergroundFogColor?: Vector3

PIXELRE_SOLUTION_OPTION 타입 정의
    'SD' | 'HD' | 'FHD' | 'QHD'| 'UHD' | 'CUSTOM'

U3dAppEMI 부분 타입 명세
    이 명세에서 사용하는 필드:
        LAYER_CREATE: string

U3dApp_Analysis 부분 타입 명세
    이 명세에서 사용하는 필드:
        AREA: 'Area'
        DISTANCE: 'Distance'
        HEIGHT: 'Height'
        CONTOUR: 'Contour'
        LAND_SCAPE: 'LandScape'
        SURFACE_VOLUME: 'SurfaceVolume'
        SLOPE: 'Slope'
        GIZMO_MODEL: 'GizmoModel'
        ALIGN_MODEL: 'AlignModel'
        MULTIPLE_COMPONENT: 'multipleComponent'
        ROAD: 'Road'
        CUSTOM_MODEL: 'CustomModel'
        SLOPE_ASPECT: 'SlopeAspect'
        CUSTOM_LAND: 'CustomLand'
        ROUTE: 'Route'
        AVERAGE_HEIGHT: 'AverageHeight'
        HEIGHT_LIMIT: 'HeightLimit'
        VIEW_CONE: 'ViewCone'
        CLIPPING: 'Clipping'
        ALARM: 'Alarm'
        DEPTH: 'Depth'
        SECTION: 'Section'
        PARTICLE: 'Particle'
        SUN_AMOUNT: 'SunAmount'
        PHYSICAL_FLOW: 'PhysicalFlow'
        SKY_LINE: 'SkyLine'

U3dAppCallbackCopyOption 부분 타입 명세
    이 명세에서 사용하는 필드:
        copy: boolean

U3dAppCallbackMap 타입 정의
    Map<string, Array<Function>>

U3dAppFrameState 부분 타입 명세
    이 명세에서 사용하는 필드:
        updateFps: number
        updateFrameUnit: number
        updateFrameTime: number
        updateWorkFps: number
        updateWorkFrameUnit: number
        updateWorkFrameTime: number
        updateLayerFps: number
        updateLayerFrameUnit: number
        updateLayerFrameTime: number
        updateShadowFrameTime: number
        updateShadowLayerCurser: number
        drawMaxFps: number
        drawFps: number
        drawFrameUnit: number
        drawFrameTime: number
        drawNextFrameTime: number
        drawScheduleStartTime: number
        drawScheduleFrameUnit: number
        drawReadyFrame: number
        drawReadyList: Array<Function>
        drawIdleFps: number
        drawIdleFrameUnit: number
        drawIdleSpeed: number
        drawIdleFrameCount: number
        drawIdleFrame: number
        isIdleDraw: boolean
        tweenFps: number
        tweenFrameUnit: number
        tweenFrameTime: number

U3dAppDrawState 부분 타입 명세
    이 명세에서 사용하는 필드:
        pixelResolution: [number, number]
        pixelRatio: number
        callbackRenderAfter: U3dAppCallbackMap
        callbackRenderBefore: U3dAppCallbackMap
        renderGroup: UGroup | undefined
        externalScene: UScene | undefined
        commentRenderGroup: UGroup | undefined
        enableSwipe: boolean
        nameSwipeLayers: Map<string, U3dAppCallbackCopyOption>

U3dAppUpdateState 부분 타입 명세
    이 명세에서 사용하는 필드:
        callbackUpdateBefore: U3dAppCallbackMap

U3dAppPostProcessState 부분 타입 명세
    이 명세에서 사용하는 필드:
        usePostProcess: boolean | undefined
        postOption: object | undefined

executeCommandParam 부분 타입 명세
    이 명세에서 사용하는 필드:
        id: number
        callback: Function

U3dAppProcessState 부분 타입 명세
    이 명세에서 사용하는 필드:
        appCommand: UAppCommand | undefined
        executeCommandList: Array<executeCommandParam> | undefined
        executeMainCommandList: Array<executeCommandParam> | undefined

U3dAppOverviewState 부분 타입 명세
    이 명세에서 사용하는 필드:
        camTargetType: boolean
        idoverview: string | undefined

U3dAppEnvState 부분 타입 명세
    이 명세에서 사용하는 필드:
        intensityLight: number
        intensitySunLight: number
        sky: USky | undefined
        light: ULight | undefined

U3dAppManagerState 부분 타입 명세
    이 명세에서 사용하는 필드:
        indexManager: UIndexManager | undefined
        processManager: UProcessManager | undefined
        testManager: UTestManager | undefined

U3dAppCameraStateStore 부분 타입 명세
    이 명세에서 사용하는 필드:
        savedInfo: UCameraState | UCameraStateJSON | undefined

U3dAppDebugState 부분 타입 명세
    이 명세에서 사용하는 필드:
        loadingBar: HTMLDivElement | undefined
        loadingBarFill: HTMLDivElement | undefined
        loadingBarEventKey: string | null | undefined
        loadingVisible: boolean
        loadingFrame: number
        loadingDelayCount: number
        loadingProcessTotal: number
        loadingProcessNow: number
        loadingWorkTotal: number
        loadingWorkNow: number
        loadingUserTotal: number
        loadingUserNow: number
        loadingTotal: number
        loadingNow: number
        loadingRate: number

U3dRemovedModelInfo 부분 타입 명세
    이 명세에서 사용하는 필드:
        layer: string
        uid: string

U3dAnalysisTypeMap 부분 타입 명세
    이 명세에서 사용하는 필드:
        Area: UAnalyArea
        Distance: UAnalyDistance
        Height: UAnalyHeight
        Contour: UAnalyContour
        LandScape: UAnalyLandScape
        SurfaceVolume: UAnalySurfaceVolume
        Slope: UAnalySlope
        GizmoModel: UAnalyGizmoModel
        AlignModel: UAnalyAlignModel
        multipleComponent: UAnalyMultipleComponent
        Road: UAnalyRoad
        CustomModel: UAnalyCustomModel
        SlopeAspect: UAnalySlopeAspect
        CustomLand: UAnalyCustomLand
        Route: UAnalyRoute
        AverageHeight: UAnalyAverageHeight
        HeightLimit: UAnalyHeightLimit
        ViewCone: UAnalyViewCone
        Clipping: UAnalyClipping
        Alarm: UAnalyAlarm
        Depth: UAnalyDepth
        Section: UAnalySection
        Particle: UAnalyParticle
        SunAmount: UAnalySun
        PhysicalFlow: UAnalyPhysicalFlow
        SkyLine: UAnalySkyLine

U3dAppShadowLayer 부분 타입 명세
    이 명세에서 사용하는 필드:
        getVisible: U3dLayer['getVisible']
        isUseShadowUpdate: U3dLayer['isUseShadowUpdate']
        getGroup: U3dLayer['getGroup']
        updateShadow?: function(number): void

U3dAppCommandQueue 타입 정의
    Array<T> & {index: number}

U3dAppDrawReadySource 타입 정의
    Pick<U3dApp, '_animationManager' | '_mixerManager' | '_freeFlyControl' | '_drawArg' | '_fires' | '_particles' | 'getAnalysis' | 'getSky' | 'getLight'>

U3dAppClippingPlaneSource 부분 타입 명세
    이 명세에서 사용하는 필드:
        _mapControl: {target: Vector3}
        _camera: {position: Vector3}

U3dApp extends U3dObject 클래스 정의
    의존: U3dObject — 기본 객체와 이벤트; 상속: {U3dObject}

    static EVENT: U3dAppEMI = U3dAppEMD
    static ANALYSIS: U3dApp_Analysis = U3dAppAnalysis
    #tileUpdateSensitivity: number = 1
        쿼드트리 교체 사이에도 보존하는 업데이트 민감도이다.
    #beforeUnloadHandler: Function | undefined
        등록한 페이지 종료 리스너이다.
    #frame: U3dAppFrameState
        활성·유휴 그리기와 데이터·작업·레이어·트윈의 시각, 주기와 준비 단계 상태이다.
        초기 활성 drawFps=60, 유휴 drawIdleFps=5, updateFps=10, updateWorkFps=120, updateLayerFps=60, tweenFps=30이다.
        drawFrameUnit=1000/60, 초기 drawIdleFrameUnit=200, updateFrameUnit=100, updateWorkFrameUnit=8, updateLayerFrameUnit=16, tweenFrameUnit=33이며 활성 지속 기준은 15프레임이다.
    #world: object
        vertexlevel=1과 segVertex=UDEF.TILE_SEG로 시작하는 지형 정점 설정이다.
    #draw: U3dAppDrawState
        픽셀 설정, 장면 그룹과 렌더 이전·이후 콜백, 스와이프 이름별 copy 상태이다.
    #update: U3dAppUpdateState
        업데이트 이전의 키별 콜백 목록이다.
    #postProcess: U3dAppPostProcessState
    #process: U3dAppProcessState
        메인·보조 작업은 원본 배열과 그 배열에 붙인 index를 사용한다.
    #overview: U3dAppOverviewState
    #env: U3dAppEnvState
    #manager: U3dAppManagerState
    #cameraState: U3dAppCameraStateStore
    #debug: U3dAppDebugState
        각 로딩 카운트는 0, loadingFrame은 0, 완료 지연 loadingDelayCount는 4로 시작한다.
        loadingVisible=false이며 root·fill·이벤트 키는 undefined로 시작한다.
    #settingGUI: UDevToolView | undefined
    #domFps: HTMLDivElement | undefined
    #viewAngleChangeId: number = 0
    #viewMode: string | undefined
    #viewAngleCanceled: Function | undefined
    positionX_, positionY_, positionZ_, rotationX_, rotationY_, rotationZ_: number | undefined
        외부에서 쓸 수 있는 직전 카메라 위치·회전 값이며 frameMove()의 움직임 판정에 반영된다.

    getViewLightList: () -> Array<*>
        생성자에서 앱을 캡처한 함수로 _viewLightList 원본 배열을 반환한다.
    getSelected: () -> any
        생성자에서 앱을 캡처한 함수로 현재 _selected 참조를 반환한다.

    constructor(opt: U3dAppCO)
        의존:
            U3dObject — 기본 상태 초기화; 생성자: {super()}
            Web API — 컨테이너 조회와 종료 리스너; 함수: {document.getElementById(), window.addEventListener()}
            U3dLayerList — 실제 직접 import API; 생성자: {new U3dLayerList()}
            U3dStats — 실제 직접 import API; 생성자: {new U3dStats()}
            UAnimationManager — 실제 직접 import API; 생성자: {new UAnimationManager()}
            UFog — 실제 직접 import API; 생성자: {new UFog()}
            UFrustum — 실제 직접 import API; 생성자: {new UFrustum()}
            UIndexManager — 실제 직접 import API; 생성자: {new UIndexManager()}
            UMixerManager — 실제 직접 import API; 생성자: {new UMixerManager()}
            UProcessManager — 실제 직접 import API; 생성자: {new UProcessManager()}
            __GError__ — 실제 직접 import API; 함수: {__GError__()}
            defaultValue — 실제 직접 import API; 함수: {defaultValue()}
            defined — 실제 직접 import API; 함수: {defined()}
            U3dQuadTile — 실제 직접 import API; 함수: {U3dQuadTile.setMaxLevel(), U3dQuadTile.setMinLevel()}
            UDEF — 실제 직접 import API; 함수: {UDEF.checkInternetExplorer(), UDEF.setUseSunFlare()}
            THREE — 실제 직접 import API; 생성자: {new THREE.Plane(), new THREE.Vector3()}
        동작:
            super()로 객체 기반을 초기화하고 _classtype=U3dApp·_disposed=false를 저장한다.
            인터넷 익스플로러이면 지원 오류를 기록하고 나머지 초기화 없이 반환한다.
            _THREE에 THREE를 연결하고 _bInitialized·_stopModel·_appUpdate3d·_isTwenning을 false, _mode를 PAN으로 초기화한다.
            _underground·_undergroundId·_sunSphere·_camera·_frustum·_collapse·_mapControl·_undergroundControl·_walkControl·_flyControl을 undefined로 초기화한다.
            _scene·_sceneComment·_terrainLayer·_measureLayer·_renderer·_drawArg·_terrainDecalManager·_box·_overviewmap·#settingGUI·_eventHandler를 undefined로 초기화하고 _listQuadtreeSet을 빈 배열로 만든다.
            _tweenfrom2To·_tweenMid2To·_tweenFrom2Mid·_tweenFrom2Mid2·_gizmoType를 undefined로 초기화한다.
            opt의 searchtype과 작업 옵션을 먼저 읽으므로 생략 입력은 최초 필드 접근에서 실패한다. stopupdate || stopUpdate를 _stopUpdate에, stoprender || stopRender를 _stopRender에 저장하며 부재이면 false로 보완한다. maxprocess || maxProcess를 _maxProcess에 저장하며 부재이면 장치 기본값으로 대체한다. _maxDistanceModel은 maxdistancemodel 또는 기본값 3000이다.
            _nameBaseLayer는 baseLayer, _wireFrameRendering은 false, _sizeWorld는 0, _properties는 빈 객체로 초기화한다. setProperties()로 이미지·모델 불투명도와 클리핑 옵션을 저장하고 _idLoad·_rectangle을 undefined로 초기화한다.
            뒤에서 opt가 falsy이면 빈 객체로 보완하고 makeName()으로 생성한 기본 이름 또는 opt.name을 _name에 저장한다.
            vertexlevel || vertexLevel || 1로 정점 레벨을 선택하고 getVertexLevel() 결과가 2이면 TILE_SEG_L2, 그 외에는 TILE_SEG를 사용한다. _skirt·_useAutoSpeed·_auto는 각각 옵션값 또는 기본값 true로 저장한다.
            _containername은 opt.containername을 우선하고 null·undefined이면 opt.containerName, 그것도 부재이면 union3d-container로 대체한다. 해당 이름의 DOM을 조회하여 _container에 저장한다.
            _container가 null·undefined이면 container is required. 오류를 던진다.
            컨테이너 조회 성공 후 높이 처리 방식을 옵션 또는 RAW로 setMethodHeight()에 전달하고 createExecuteCommand()를 실행한다. _rectBaseWindow·_rectSwipeWindow에 컨테이너를 반으로 나눈 영역을 저장한다.
            camTargetType || camtargettype || true로 오버뷰 기준을 선택하므로 false 입력도 true가 된다. idoverview || idOverview는 선택적 오버뷰 ID이다. [확인 Q-008]
            ratiotilesize || ratioTileSize와 ratiomodeltilesize || ratioModelTileSize의 truthy 별칭 또는 각 기본값을 _ratioTileSize·_ratioModelTileSize에 저장하고 _frameOptimize는 옵션 또는 기본 true로 저장한다.
            _autoClear는 opt.autoClear를 우선하고 null·undefined이면 opt.autoclear, 둘 다 부재이면 true로 대체한다.
            픽셀 비율은 opt.pixelRatio를 우선하고 null·undefined이면 opt.pixelratio로 대체하여 setPixelRatio()에 전달한다.
            픽셀 해상도는 opt.pixelResolution을 우선하고 null·undefined이면 opt.pixelresolution으로 대체하여 setPixelResolution()에 전달한다.
            _logarithmicDepthBuffer는 기본 true, _preserveDrawingBuffer는 기본 false로 저장한다. _improveTexture는 improveTexture 또는 improvetexture 이름을 전역 단계값에 매핑하고 실패하면 장치 기본값으로 대체한다.
            후처리는 opt.usePostProcess ?? opt.usepostprocess ?? 장치 기본값으로 선택하며 postOption은 opt.postOption을 우선하고 null·undefined이면 opt.postoption, 둘 다 부재이면 undefined로 대체한다.
            intensitylight || intensityLight 및 intensitysunlight || intensitySunLight로 환경·태양광 값을 선택하여 기본값으로 보완하고 _toneExposure는 옵션 또는 기본 노출로 저장한다.
            _useSky는 옵션 또는 기본 true로 저장한다. _useFog는 opt.usefog를 우선하고 null·undefined이면 opt.useFog, 둘 다 부재이면 true로 대체한다.
            _fogColor는 opt.fogcolor를 우선하고 null·undefined이면 opt.fogColor, 둘 다 부재이면 UDEF.fogColor로 대체한다. 선택 색과 UDEF.fogValue로 _defaultFog를 만들고 _background는 undefined, _backgroundColor는 옵션 또는 기본 rgb(200, 200, 200)으로 저장한다.
            _layerlist는 undefined, _overlayList·_viewList·_viewLightList·_lightList·_poiList·_objectList는 빈 배열, _editHeightBoxList는 새 Map, _selected는 undefined로 초기화한다. getViewLightList와 getSelected에 원본 목록·선택값을 반환하는 함수를 저장한다.
            getOptionRegion(opt)의 지역 결과로 _sizeWorld·_rectangle·_datalevel·_startlevel을 저장하고 _targetrectopt·_passlevel을 옵션에서 반영한다. createBox() 결과를 _box에 저장한다.
            _viewportRatio=1·_fov=50·_near=1·_far=지역 size·_cameraType=perspective를 기본으로 사용한다. [확인 Q-012]
            _modelImageDistance·_modelImageDefaultLevel·_modelUpdateOffset에 모델 옵션과 fallback을 저장한다.
            opt.homePosition이 defined이면 입력의 종류를 판정한다.
                객체이면 x·y·z로 만든 새 Vector3를 _homePosition에 저장하고 비객체이면 _homePosition을 초기화하지 않는다.
            opt.homePosition이 null·undefined이면 (0,0,0)의 새 Vector3를 _homePosition에 저장한다.
            _homeRotateLeft와 _homeRotateDown은 각각 입력값 또는 기본값 0으로 저장한다.
            _resolution은 undefined로 초기화하고 _zoomLevel=10·_minZoomLevel=6·_maxZoomLevel=19를 기본값으로 저장한다. _minlevel은 옵션과 무관하게 0, _maxlevel은 opt.maxlevel 또는 19로 저장하여 U3dQuadTile 전역에 반영한다.
            _useSunFlare는 opt.useSunFlare를 우선하고 null·undefined이면 opt.usesunflare, 둘 다 부재이면 장치 기본값으로 대체한다. _useCloud는 기본 true로 저장한다.
            _useShadowMap은 opt.useshadowmap을 우선하고 null·undefined이면 opt.useShadowMap, 둘 다 부재이면 true로 대체한다. _sunFlare·_curtime·_currentTween은 undefined, _autoMove는 기본 false, _removedModel은 빈 배열, _isCameraRest는 false로 초기화한다.
            initialize 블록에서 initOpenLayers() 후 createEventHandler()를 실행하고 성공할 때 createScene(), createSceneComment(), createDrawArg()를 순서대로 실행한다. 각 생성 실패는 오류를 기록하여 블록을 즉시 중단하므로 뒤쪽 생성은 건너뛰며 이후 생성자 흐름은 계속한다.
            initialize 블록 생성에 성공하면 U3dLayerList를 _layerlist에, 카메라 투영 종류에 맞춘 UFrustum을 _frustum에 보관하고 createQuadTreeSet()을 실행한다.
                self.#overview.idoverview가 defined이면 해당 ID로 createOverviewMap()을 실행한다.
                지역 UIndexManager·앱 UProcessManager와 _userProcess·_imageProcess·_heightProcess·_modelProcess·_modelWorkProcesses·_customProcess 작업 큐와 UTestManager를 연결한다.
                _createMeasureLayer()의 반환값을 _measureLayer에 저장한다.
                측정 레이어 참조를 저장한 뒤 updateData()를 실행한다.
                _createTerrainLayer()를 실행한 뒤 _bInitialized=true를 저장한다.
            블록 종료 후 _particles·_fires·_analysisList를 빈 배열로 만들고 _globalPlaneX·_globalPlaneY·_globalPlaneZ와 빈 _clippingPlanes를 구성한 뒤 createAnalysis()를 실행한다.
            _undergroundDepth=95000·_undergroundColor=0x050505·_undergroundOpacity=.95·_undergroundGrid=true·_undergroundGridDivide=50·_undergroundSetTexture=false·_undergroundEdge=false·_undergroundEdgeThickness=1을 기본값으로 저장한다. _undergroundFog=false·_undergroundFogDensity=.005·_undergroundFogStartHeight=0·_undergroundFogEndHeight=-5000·_undergroundFogColor=(.034,.034,.034)를 기본값으로 저장한다.
            스와이프는 opt.enableswipe를 우선하고 null·undefined이면 opt.enableSwipe, 둘 다 부재이면 false로 대체한다. nameswipelayers || nameSwipeLayers가 배열이면 각 이름을 스와이프 맵에 copy=false로 등록한다.
            공개 U3dAppCO에 없는 보존 버퍼·클리핑·지하·스와이프 필드와 여러 별칭도 런타임에서 읽는다. [확인 Q-009]
            _rStats·_uStats·_uwStats·_ulStats·_dStats에 통계 객체를 만들고 _animationManager·_mixerManager·_viewRR을 초기화한 뒤 #setDrawTickFrame()을 실행한다.
            #beforeUnloadHandler에 종료 로그와 dispose()를 실행하는 함수를 저장하여 등록한다.
            _auto가 true이면 렌더 환경 생성과 자동 시작을 실행한다.
                createRenderer()가 실패하면 오류를 기록하고 이어서 createLoadingCanvas()와 setVisibleLoading(false)를 실행한다.
                createCamera()가 실패하면 오류를 기록하고 createControls(), createLight(), createSky() 순서로 실행한다. 광원 생성 실패도 오류를 기록하고 계속한다.
                UDEF에 _useSunFlare를 반영하고 사용 설정이 truthy이며 기존 플레어가 defined가 아니면 createSunFlare()를 실행한다.
                enableShadowMap(), setCameraFitKorea(), setDefaultTimeSun(), resize(), start()를 순서대로 실행한다.
            자동 시작 분기 후 _overlayManager를 null로 초기화한다.

    getParam()
        동작:
            현재 카메라·렌더·환경·지역·타일·레이어 표현 상태를 생성 옵션 이름으로 조합한 새 객체를 반환한다. homePosition, rectangle, postOption은 현재 참조를 사용한다.

    getCamera() -> UCamera | undefined
        동작:
            this._camera 값을 반환한다.

    getTerrainDecalManager() -> UShaderTerrainDecalManager
        의존:
            UShaderTerrainDecalManager — 실제 직접 import API; 생성자: {new UShaderTerrainDecalManager()}
        동작:
            _terrainDecalManager가 없으면 현재 앱을 가진 UShaderTerrainDecalManager를 생성하여 보관한다.
            저장된 앱 공유 매니저를 반환한다.

    dispose() -> void
        의존:
            UErrorCollector — 동기 해제 오류 수집과 최종 전달; 생성자: {new UErrorCollector()}; 함수: {attempt(), finish()}
            UEventDispatcher — 앱 이벤트 연결 해제; 함수: {removeEventListenerAll()}
            UProcessManager — 작업 취소·종결; 함수: {dispose()}
            URenderer — 렌더러·DOM 정리; 함수: {clear(), dispose(), domElement.remove()}
            U3dLayerList — 등록 레이어 정리; 함수: {disposeAll()}
            UMapControls — 입력 연결 정리; 함수: {dispose()}
            U3dOverviewMap — 오버뷰 정리; 함수: {dispose()}
            UDrawArg — 드로잉 상태 정리; 함수: {dispose()}
            Web API — 종료 리스너 제거; 함수: {window.removeEventListener()}
            U3dObject — 상속된 기반 객체·이벤트 API; 함수: {removeEventListenerAll()}
            defined — 실제 직접 import API; 함수: {defined()}
            U3dBilboard — 실제 직접 import API; 함수: {U3dBilboard.removeAll()}
        동작:
            _disposed가 truthy이면 중복 정리 없이 반환한다.
            UErrorCollector의 attempt()로 동기 해제 호출의 오류를 개별 수집하여 이후 자원 정리와 참조 제거를 계속한다. 종료 콜백의 재진입과 종료 후 재호출은 중복 정리하지 않는다.
            _disposed가 falsy인 첫 종료 경로이면 다음 순서로 자원을 정리한다.
                _disposed를 먼저 true로 바꿔 재진입을 차단하고 지도 영역 전환을 취소한 뒤 _bInitialized를 false로 만들고 processManager를 종료한다. 모델 작업은 이후 트리 해제 단계에서 루트의 DISPOSE 이벤트로 취소한다.
                #beforeUnloadHandler가 truthy이면 beforeunload 리스너를 제거하고 #beforeUnloadHandler를 undefined로 만든다.
                _terrainLayer·_measureLayer 참조를 undefined로 만든다.
                _eventHandler가 defined이면 이벤트 핸들러를 해제하고 _eventHandler를 undefined로 만든다.
                #removeFpsDom()으로 FPS DOM을 제거하고 모든 앱 이벤트 연결을 해제한 뒤 _editHeightBoxList를 undefined로 만든다.
                _isTwenning이 truthy이면 defined인 _tweenfrom2To·_tweenMid2To·_tweenFrom2Mid·_tweenFrom2Mid2를 각각 정지하고 _isTwenning을 false로 만든다.
                _gizmoType을 undefined로 만든 뒤 removeAllPOI(), removeAllObject(), removeAllOverlay(), removeAllView(), removeAllViewLight()를 순서대로 실행한다.
                defined인 지도 컨트롤을 해제하고 _mapControl을 undefined로 만든 뒤 disposeQuadTree()를 실행한다.
                defined인 레이어 목록을 해제하고 _layerlist를 undefined로 만든다. terrain decal manager를 해제하고 _terrainDecalManager를 undefined로 만든다.
                defined인 메인 장면과 주석 장면에서 빌보드를 제거하고 장면을 해제한 뒤 _scene·_sceneComment를 undefined로 만든다. defined인 오버뷰도 해제한다.
                _renderer가 defined이면 clear(), DOM 제거와 domElement 참조 제거, dispose()를 순서대로 수행한 뒤 _renderer를 undefined로 만든다.
                _properties를 빈 객체로 바꾸고 defined인 드로잉 인자를 해제한 뒤 _drawArg를 undefined로 만든다.
                removeSky()를 실행하고 _sunSphere·_camera를 undefined로 만든다. truthy인 광원을 해제하고 광원 참조를 undefined로 만든다.
                _frustum·_overviewmap을 undefined로 만든다.
                #settingGUI가 truthy이면 removeDevToolView()로 개발 도구를 제거한다.
                _appUpdate3d를 false, _measureLayer를 undefined, _nameBaseLayer를 baseLayer, _sizeWorld를 0, _idLoad·_rectangle을 undefined로 만든다.
                등록 객체와 콜백을 참조하는 indexManager를 undefined로 만든다. 공유 파서 풀의 종료는 레이어의 마지막 사용자 해제에 위임한다.
            disposeQuadTree()가 실패해도 레이어·장면·렌더러·UDrawArg 등의 후속 정리를 시도하며, 렌더러 clear()가 실패해도 DOM 제거와 dispose()를 각각 시도한다.
            정리가 끝난 뒤 수집기의 finish()를 호출한다. 오류가 하나이면 원래 사유를 그대로 전달하고, 여러 개이면 호출 순서대로 원래 사유를 담은 errors 배열을 가진 Error를 전달한다. null·undefined도 실패로 전달하며 하위 정리가 모아 전달한 오류는 해당 객체로 보존한다.
            동기 메서드로 유지하며 하위 해제 메서드가 반환한 Promise의 완료를 기다리거나 비동기 거부를 수집하지 않는다.

    override getMetaData()
        의존:
            U3dObject — 기반 metadata 생성; 함수: {getMetaData(), createMeta()}
            U3dObject — 상속된 기반 객체·이벤트 API; 함수: {createMeta()}
            defined — 실제 직접 import API; 함수: {defined()}
            U3dObject — 실제 직접 import API; 함수: {U3dObject.prototype.getMetaData.call()}
        동작:
            U3dObject의 metadata에 getParam() 옵션과 홈 위치·회전을 추가한다.
            등록된 레이어들의 getMetaData() 결과를 Layers 하위로 모아 반환한다.

    getLoadingRate() -> number
        동작:
            this.#debug.loadingRate 값을 반환한다.

    getLoadingNow() -> number
        동작:
            this.#debug.loadingNow 값을 반환한다.

    getLoadingTotal() -> number
        동작:
            this.#debug.loadingTotal 값을 반환한다.

    resize() -> void
        의존:
            URenderer — 버퍼 크기 갱신; 함수: {setDrawingBufferSize()}
            UCamera — 투영 비율 갱신; 함수: {setAspect()}
            U3dQuadSet — 화면 변화 반영; 함수: {update()}
            __GInfo__ — 실제 직접 import API; 함수: {__GInfo__()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            컨테이너 너비 또는 높이가 0이면 안내하고 반환한다.
            픽셀 비율이 falsy이면 UDEF 기본값, 해상도가 없거나 길이가 2가 아니면 장치 기본값으로 교체한다.
            설정한 총 픽셀 수와 컨테이너 면적으로 실효 픽셀 비율을 계산하여 렌더러 버퍼 크기에 적용한다.
            카메라 종횡비에 _viewportRatio를 곱해 적용하고 쿼드트리를 갱신한다.

    setPixelRatio(pixelRatio: number = UDEF.DEFAULT_PIXEL_RATIO) -> U3dApp | undefined
        동작:
            #draw.pixelRatio에 입력을 저장한다.
            _renderer가 falsy이면 undefined를 반환한다.
            _renderer가 truthy이면 resize()를 수행한 뒤 앱을 반환한다.

    getPixelRatio() -> number
        동작:
            this.#draw.pixelRatio 값을 반환한다.

    setPixelResolution(width: PIXELRE_SOLUTION_OPTION | Array<number> | number, height: number) -> U3dApp
        동작:
            문자열이면 대문자 UDEF 해상도, 길이 2 배열이면 그 두 값, 너비·높이가 둘 다 truthy이면 그 쌍을 선택한다.
            선택하지 못하면 장치 기본 해상도로 대체하고 복사한 배열을 저장한다.
            resize()로 반영한 뒤 앱을 반환한다.

    getPixelResolution() -> Array<number>
        동작:
            this.#draw.pixelResolution 값을 반환한다.

    getPixelResolutionLevel() -> PIXELRE_SOLUTION_OPTION
        동작:
            UDEF 해상도들의 두 값과 현재 해상도가 모두 같은 키를 반환하고 없으면 CUSTOM을 반환한다.

    setSavedCameraState(cameraStateInfo: UCameraState | UCameraStateJSON) -> void
        동작:
            this.#cameraState.savedInfo에 cameraStateInfo 값을 저장한다.

    getSavedCameraState() -> UCameraState | UCameraStateJSON | undefined
        의존:
            __GInfo__ — 실제 직접 import API; 함수: {__GInfo__()}
        동작:
            저장 정보·camera·center 중 하나가 falsy이면 안내하고 undefined를 반환한다.
            그 외에는 저장한 정보의 원본 참조를 반환한다.

    createRenderer(container: HTMLElement) -> URenderer
        의존:
            Web API — DOM 배치; 함수: {HTMLElement.appendChild()}
            URenderer — 실제 직접 import API; 생성자: {new URenderer()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            기존 _renderer가 있으면 MSAA 요청값을 읽어 재생성에 사용한다.
            _renderer가 defined이면 기존 렌더러를 clear()한 뒤 자원을 정리한다.
                기존 렌더러의 domElement가 truthy이면 DOM을 제거하고 domElement를 undefined로 만든다.
                기존 렌더러를 dispose()한다.
            isPostProcess()·getPostOption() 결과와 로그 깊이·드로잉 버퍼·MSAA 요청값으로 URenderer를 만든다.
            새 _renderer에 앱을 연결하고 sortObjects=true, toneMapping=UDEF.TONEMAPPING, toneMappingExposure=_toneExposure를 저장한다. 후처리 옵션을 새 렌더러 결과로 반영한다.
            enableSwipe()로 저장 스와이프 설정을 적용하고 컨테이너에 렌더러 DOM을 추가한다.
            드로잉 인자가 truthy이면 그 렌더러 참조를 교체하고 새 렌더러를 반환한다.

    isPostProcess() -> boolean
        동작:
            this.#postProcess.usePostProcess 값을 반환한다.

    setPostProcess(usePostProcess: boolean) -> void
        의존:
            URenderer — 후처리 사용 상태 변경; 함수: {setPostProcess()}
        동작:
            isPostProcess()와 입력이 같으면 반환한다.
            후처리 사용 상태를 바꾸고 하늘이 있으면 removeSky(), createSky(), setDefaultTimeSun()으로 재생성한다.
            렌더러에 후처리 사용값을 전달한다.

    createSky() -> void
        의존:
            USky — 실제 직접 import API; 생성자: {new USky()}
            __GInfo__ — 실제 직접 import API; 함수: {__GInfo__()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            _scene이 null·undefined이면 반환한다.
            _scene이 defined이면 하늘 사용 설정을 판정한다.
                _useSky가 falsy이면 반환한다.
                _useSky가 truthy이면 getSky()로 기존 하늘을 조회하여 있으면 안내하고 반환한다.
                    isPostProcess() 결과를 보관하고 USky를 WORLD_SIZE의 10배로 확대하여 행렬을 갱신한 뒤 장면과 #env.sky에 등록한다.
                    구름 사용 설정과 보관한 후처리 설정이 모두 truthy이면 createCloud()를 실행한다.

    removeSky() -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            getSky()로 기존 하늘을 가져온다.
            하늘이 falsy이거나 장면이 null·undefined이면 반환한다.
            하늘과 장면이 있는 경로에서 _cloud가 truthy이면 removeCloud()를 실행한다.
            하늘을 장면에서 제거하고 defined인 material·geometry를 각각 해제하여 해당 참조를 undefined로 만든다. #env.sky도 undefined로 만든다.

    getSky() -> USky
        동작:
            this.#env.sky 값을 반환한다.

    removeCloud() -> void
        동작:
            구름이 있으면 장면에서 제거하고 dispose()한 뒤 _cloud를 undefined로 만든다.

    createCloud() -> U3dCloud
        의존:
            U3dCloud — 실제 직접 import API; 생성자: {new U3dCloud()}
            __GInfo__ — 실제 직접 import API; 함수: {__GInfo__()}
        동작:
            후처리가 꺼져 있거나 기존 구름이 있으면 안내하고 undefined를 반환한다.
            지역 중심에 U3dCloud를 생성하여 장면에 추가하고 active=true로 설정한 뒤 반환한다.

    getCloud() -> U3dCloud
        동작:
            this._cloud 값을 반환한다.

    showCloud(isShow: boolean) -> void
        동작:
            _cloud가 있으면 visible에 isShow를 저장한다.

    setPostOption(option: PostProcessParam) -> void
        의존:
            URenderer — 옵션 적용·조회; 함수: {setPostOption(), getPostOption()}
        동작:
            렌더러 setPostOption(option)에 위임한 뒤 렌더러가 반환한 현재 옵션을 #postProcess에 저장한다.

    getPostOption() -> PostProcessParam | undefined
        의존:
            URenderer — 현재 옵션 조회; 함수: {getPostOption()}
        동작:
            후처리가 꺼져 있으면 undefined를 반환한다.
            저장 옵션이 없거나 빈 객체이고 렌더러가 있으면 렌더러 옵션을 가져와 저장한다.
            저장한 옵션의 원본 참조를 반환한다.

    hasRenderAfter()
        동작:
            this.#draw.callbackRenderAfter.size > 0 값을 반환한다.

    setRenderAfter(key, callback) -> void
        동작:
            callback이 함수가 아니거나 falsy이면 반환한다.
            키가 없으면 callback 배열을 만들고 있으면 기존 배열에 callback을 추가한다.

    removeRenderAfter(key) -> void
        동작:
            this.#draw.callbackRenderAfter.delete(key)에 입력을 전달한다.

    exeRenderAfter(renderer, scene, camera) -> void
        동작:
            등록 순서대로 모든 callback(renderer, scene, camera)을 실행하며 예외를 가로채지 않는다.

    hasRenderBefore(key: string) -> boolean
        동작:
            key가 truthy이면 해당 키 존재 여부, 그 외에는 렌더 이전 콜백 맵이 비어 있지 않은지 반환한다.

    setRenderBefore(key, callback) -> void
        동작:
            callback이 함수가 아니거나 falsy이면 반환한다.
            hasRenderBefore(key)가 false이면 callback 배열을 만들고 true이면 기존 배열에 추가한다.

    removeRenderBefore(key) -> void
        동작:
            this.#draw.callbackRenderBefore.delete(key)에 입력을 전달한다.

    exeRenderBefore(renderer, scene, camera) -> void
        동작:
            등록 순서대로 모든 callback(renderer, scene, camera)을 실행하며 예외를 가로채지 않는다.

    hasUpdateBefore(key)
        동작:
            key가 truthy이면 해당 키 존재 여부, 그 외에는 업데이트 이전 콜백 맵이 비어 있지 않은지 반환한다.

    setUpdateBefore(key, callback) -> void
        동작:
            callback이 함수가 아니거나 falsy이면 반환한다.
            hasUpdateBefore(key)가 false이면 callback 배열을 만들고 true이면 기존 배열에 추가한다.

    removeUpdateBefore(key) -> void
        동작:
            this.#update.callbackUpdateBefore.delete(key)에 입력을 전달한다.

    exeUpdateBefore(curTime) -> void
        동작:
            등록 순서대로 모든 callback(curTime)을 실행하며 예외를 가로채지 않는다.

    createExecuteCommand() -> void
        의존:
            UAppCommand — 실제 직접 import API; 생성자: {new UAppCommand()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            UAppCommand가 없으면 앱을 연결한 새 명령 객체를 생성한다.
            메인 순환 배열이 없으면 index=0으로 만들고 이미지·고도 process 명령을 등록한다.
            보조 순환 배열이 없으면 index=0으로 만들고 이미지·고도 layer, 모델 process·layer, 사용자 process와 기타 process·layer 명령을 등록한다.

    getExecuteCommand()
        동작:
            this.#process.appCommand 값을 반환한다.

    updateWorkFrame(curTime: number) -> boolean
        의존:
            U3dStats — 작업 프레임 통계; 함수: {check(), update()}
            UAppCommand — 등록 콜백 receiver; 콜백: {command.callback.call()}
            defined — 실제 직접 import API; 함수: {defined()}
            UDEF — 실제 직접 import API; 함수: {UDEF.saveUUID()}
        동작:
            UDEF.saveUUID() 후 isWorkFrameDue()가 false이면 대기 통계를 기록하고 false를 반환한다.
            실행 시각을 저장하고 getExecuteCommand()와 getInstanceClassifiedLayers()로 명령 수신 객체와 레이어 분류를 가져온다.
            self.#process.executeMainCommandList가 null·undefined이면 false를 반환한다.
            self.#process.executeMainCommandList가 defined이면 takeNextCommand()로 원본 목록의 명령을 선택하고 appCommand를 this로 curTime과 레이어 분류를 전달한다.
                정상 호출 뒤에만 finishCommandCycle()로 순환 순번을 정리하고 실행 통계를 기록하여 true를 반환한다. 콜백 예외는 전달된다.

    updateLayerFrame(curTime)
        의존:
            U3dStats — 레이어 프레임 통계; 함수: {check(), update()}
            UAppCommand — 등록 콜백 receiver; 콜백: {command.callback.call()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            isLayerFrameDue()가 false이면 대기 통계를 기록하고 false를 반환한다.
            실행 시각을 저장하고 getExecuteCommand()와 getInstanceClassifiedLayers()로 명령 수신 객체와 레이어 분류를 가져온다.
            self.#process.executeCommandList가 null·undefined이면 false를 반환한다.
            self.#process.executeCommandList가 defined이면 업데이트 이전 콜백의 존재를 hasUpdateBefore()로 판정한다.
                콜백이 있으면 exeUpdateBefore(curTime)를 실행한다.
                takeNextCommand()로 원본 목록의 명령을 선택하여 appCommand를 this로 curTime과 레이어 분류를 전달한다.
                정상 호출 뒤에만 finishCommandCycle()로 변경된 목록 길이를 반영하여 순환하고 실행 통계를 기록하여 true를 반환한다. 콜백 예외는 전달된다.

    addExecuteCommand(id, callback, type = UDEF.APP_COMMAND_TPYE.SUB)
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            type이 MAIN이면 메인 목록, SUB이면 보조 목록을 선택하고 다른 값이면 false를 반환한다.
            선택한 목록에 같은 id가 없을 때만 id와 callback을 추가하고 true, 그 외에는 false를 반환한다.

    removeExecuteCommand(id)
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            보조 목록에서 같은 id를 찾아 제거하고 true를 반환한다.
            찾지 못하면 메인 목록에서 찾아 제거하고 true를 반환하며 양쪽 모두 없으면 false를 반환한다.

    setCameraTargetType(isTarget) -> void
        동작:
            this.#overview.camTargetType에 isTarget 값을 저장한다.

    getCameraTargetType()
        동작:
            this.#overview.camTargetType 값을 반환한다.

    getIntensityLight() -> number
        동작:
            this.#env.intensityLight 값을 반환한다.

    setIntensityLight(intensity: number = DEFAULT_ENV_INTENSITY) -> boolean
        의존:
            ULight — 환경광 변경; 함수: {setIntensityEnviLight()}
        동작:
            광원이 없으면 false를 반환한다.
            저장 환경광 값을 바꾸고 광원 setIntensityEnviLight(intensity)를 실행한 뒤 true를 반환한다.

    getIntensitySunLight() -> number
        동작:
            this.#env.intensitySunLight 값을 반환한다.

    setIntensitySunLight(intensity: number = DEFAULT_MAX_SUN_INTENSITY) -> boolean
        의존:
            ULight — 태양광 변경; 함수: {setIntensitySuniLight()}
        동작:
            광원이 없으면 false를 반환한다.
            저장 태양광 값을 바꾸고 광원 setIntensitySuniLight(intensity)를 실행한 뒤 true를 반환한다.

    createLight(size, drawArg)
        의존:
            ULight — 실제 직접 import API; 생성자: {new ULight()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            drawArg가 null·undefined이면 undefined를 반환한다.
            drawArg가 defined이면 장면 존재를 확인하고 장면이 null·undefined이면 경고 후 undefined를 반환한다.
                getIntensityLight()·getIntensitySunLight()의 환경·태양광 값과 drawArg로 ULight를 생성하여 #env.light에 보관하고 반환한다.

    getVertexLevel()
        동작:
            this.#world.vertexlevel 값을 반환한다.

    getSegVertex()
        동작:
            this.#world.segVertex 값을 반환한다.

    setTimeSun(date: Date) -> void
        의존:
            USky — 태양 시각·경위도 설정; 함수: {setTime()}
            defined — 실제 직접 import API; 함수: {defined()}
            UDEF — 실제 직접 import API; 함수: {UDEF.setDateFormat()}
        동작:
            date가 없으면 현재 _curtime을 사용하고 저장한 시각을 UDEF 날짜 형식에 반영한다.
            하늘과 광원이 있을 때 카메라의 지리 타겟이 없으면 반환하고 있으면 해당 경위도로 하늘 시각을 갱신한다.

    getTimeSun() -> object
        동작:
            this._curtime 값을 반환한다.

    getLight()
        동작:
            this.#env.light 값을 반환한다.

    setSunFlare(show: boolean) -> void
        의존:
            UDEF — 실제 직접 import API; 함수: {UDEF.disposeObject3D(), UDEF.setUseSunFlare()}
        동작:
            입력 show를 _useSunFlare에 저장하고 UDEF에 반영한다.
            _useSunFlare가 true인 경우 getLight()로 광원 존재를 확인한다.
            광원도 있으면 _sunFlare가 falsy인 경우 createSunFlare()로 새 플레어를 생성한다.
            활성 조건을 충족하지 못하고 _sunFlare가 truthy이면 uniform enabled를 false로 바꾸고 getScene()의 장면에서 제거·해제한 뒤 _sunFlare를 undefined로 만든다.

    createSunFlare() -> void
        의존:
            ULensFlare — 실제 직접 import API; 생성자: {new ULensFlare()}
            THREE — 실제 직접 import API; 생성자: {new THREE.Vector3()}
        동작:
            광원 또는 renderer.shadowMap이 없으면 반환한다.
            현재 태양 위치와 후처리에 따른 opacity 0.4 또는 1로 ULensFlare를 만든다.
            렌더 순서를 Infinity로 하고 material.onBeforeRender를 앱과 렌더러·장면·카메라에 bind하여 장면에 추가·보관한다.

    getSunFlare() -> boolean
        동작:
            this._useSunFlare 값을 반환한다.

    endAnalySunAmount() -> void
        동작:
            SunAmount 분석을 찾고 있으면 clear()를 실행한다.

    getSunAmountDrawMeshes() -> Array<UMesh | undefined>
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            광원이 있으면 그 _sunAmountDrawMesh 원본 참조, 없으면 빈 배열을 반환한다.

    removeAnalySunAmount(name: string) -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            SunAmount 분석이 없으면 반환하고 있으면 removeSunAmountByName(name)을 실행한다.

    isShadowAtTime(date: Date, position: GeoPosition) -> boolean
        동작:
            광원이 있으면 light.isShadowAtTime(date, position)의 결과, 없으면 false를 반환한다.

    setSunTargetPoint(point)
        동작:
            광원과 point가 truthy이면 광원의 _targetPoint를 교체하고 true, 그 외에는 false를 반환한다.

    getSunAmountParam()
        동작:
            광원이 있으면 getParam() 결과를 반환하며 없으면 undefined를 반환한다.

    setShadow(enable)
        의존:
            UDEF — 실제 직접 import API; 함수: {UDEF.getShadowMapType()}
        동작:
            _renderer가 falsy이면 false를 반환한다.
            _renderer가 truthy이면 getLight()로 광원을 가져온다.
                enable이 truthy이고 광원의 그림자가 false이면 광원 그림자와 renderer.shadowMap을 켜고 UDEF의 그림자 타입을 적용한다.
                enable이 falsy이면 true인 광원 그림자를 끄고 renderer.shadowMap.enabled를 false로 만든다.

    setSunShineMode(active: boolean = true) -> void
        동작:
            active이면 setShadow(true), 비활성이고 앱의 그림자 사용값이 false이면 setShadow(false)를 실행한다.

    enableShadowMap(enable: boolean)
        동작:
            _renderer가 falsy이면 false를 반환한다.
            _renderer가 truthy이면 setShadow(enable)을 실행하고 _useShadowMap에 입력을 저장한 뒤 true를 반환한다.

    isUseShadow() -> boolean
        동작:
            this._useShadowMap 값을 반환한다.

    getScene() -> UScene
        동작:
            this._scene 값을 반환한다.

    getRenderGroup()
        동작:
            this.#draw.renderGroup 값을 반환한다.

    getExternalScene() -> UScene
        동작:
            this.#draw.externalScene 값을 반환한다.

    createScene() -> UScene
        의존:
            UGroup — 실제 직접 import API; 생성자: {new UGroup()}
            UScene — 실제 직접 import API; 생성자: {new UScene()}
        동작:
            UScene과 렌더 그룹을 만들고 모델·지형·분석·사용자 그룹과 외부 UScene을 추가한다.
            메인 장면에 렌더 그룹을 추가하고 장면을 반환한다.

    getSceneComment() -> UScene | undefined
        동작:
            this._sceneComment 값을 반환한다.

    getCommentRenderGroup()
        동작:
            this.#draw.commentRenderGroup 값을 반환한다.

    createSceneComment() -> UScene
        의존:
            UGroup — 실제 직접 import API; 생성자: {new UGroup()}
            UScene — 실제 직접 import API; 생성자: {new UScene()}
        동작:
            renderOrder=999999999이고 autoClear=false인 주석 UScene을 만들고 주석 렌더 그룹을 추가한 뒤 반환한다.

    getProcessManager() -> UProcessManager
        동작:
            this.#manager.processManager 값을 반환한다.

    getIndexManager()
        동작:
            this.#manager.indexManager 값을 반환한다.

    getTestManager() -> UTestManager
        동작:
            this.#manager.testManager 값을 반환한다.

    addAutoHeightUpdate(x: number, y: number, object: Object3D, updateFnc: Function) -> void
        의존:
            UIndexManager — 위치별 갱신 등록; 함수: {insertAtPoint()}
        동작:
            this.getIndexManager().insertAtPoint( x, y, object, updateFnc, U3dEvent.MESH.UPDATE_HEIGHT_MESH )에 입력을 전달한다.

    removeAutoHeightUpdate(x: number, y: number, object: Object3D) -> void
        의존:
            UIndexManager — 위치별 갱신 제거; 함수: {removeAtPoint()}
        동작:
            this.getIndexManager().removeAtPoint( x, y, object, U3dEvent.MESH.UPDATE_HEIGHT_MESH )에 입력을 전달한다.

    execAutoHeightUpdate(event: {data: U3dQuadTile}) -> void
        의존:
            U3dQuadSet — 소속 지형의 고도 적용; 함수: {updateAutoHeight()}
        동작:
            기존 호출 호환을 위해 현재 쿼드셋의 updateAutoHeight(event.data)에 위임한다.
            지형 식별·중복 판정·콜백 실행은 쿼드셋이 담당하며 쿼드셋이 없으면 아무 작업도 하지 않는다.

    getContainer() -> HTMLElement | null
        동작:
            this._container 값을 반환한다.

    getOverviewMap() -> U3dOverviewMap
        동작:
            this._overviewmap 값을 반환한다.

    createOverviewMap(idoverview: string) -> boolean
        의존:
            U3dOverviewMap — 실제 직접 import API; 생성자: {new U3dOverviewMap()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            idoverview가 없으면 false를 반환한다.
            기존 오버뷰를 dispose()하고 현재 앱·드로잉 인자·컨테이너 ID로 U3dOverviewMap을 생성하여 true를 반환한다.

    isAutoClear() -> boolean
        동작:
            this._autoClear 값을 반환한다.

    setAutoClear(autoClear: boolean) -> void
        동작:
            this._autoClear에 autoClear 값을 저장한다.

    getDrawFps()
        동작:
            this.#frame.drawFps 값을 반환한다.

    setDrawFps(fps: number) -> void
        동작:
            fps가 유한한 양수가 아니면 설정을 보존하고 반환한다.
            엔진 drawMaxFps 이내로 상한을 적용하여 drawFrameUnit=1000/fps와 drawFps를 저장한다.

    getIdleDrawFps()
        동작:
            this.#frame.drawIdleFps 값을 반환한다.

    setIdleDrawFps(fps: number) -> void
        동작:
            fps가 유한한 양수가 아니면 설정을 보존하고 반환한다.
            엔진 drawMaxFps 이내로 상한을 적용하여 drawIdleFrameUnit=1000/fps와 drawIdleFps를 저장한다.

    isIdleDraw()
        동작:
            this.#frame.isIdleDraw 값을 반환한다.

    getUpdateFps()
        동작:
            this.#frame.updateFps 값을 반환한다.

    setUpdateFps(fps) -> void
        동작:
            updateFrameUnit에 1000/fps, updateFps에 fps를 저장한다. 입력 제한은 하지 않는다.

    drawWork(workTime: number) -> void
        동작:
            workTime이 falsy이면 drawIdleFrameCount로 대체한다.
            현재 값과 관계없이 drawIdleFrame을 workTime으로 덮어쓴다.

    drawFast() -> void
        동작:
            this.setDrawSpeed(UDEF.IDLE_DRAW_SPEED.FAST)에 입력을 전달한다.

    drawDefault() -> void
        동작:
            this.setDrawSpeed(UDEF.IDLE_DRAW_SPEED.DEFAULT)에 입력을 전달한다.

    drawSlow() -> void
        동작:
            this.setDrawSpeed(UDEF.IDLE_DRAW_SPEED.SLOW)에 입력을 전달한다.

    setDrawSpeed(speed = UDEF.IDLE_DRAW_SPEED.DEFAULT) -> void
        동작:
            drawIdleSpeed를 저장하고 FAST 이상이면 활성 drawFrameUnit을 유휴 주기로 사용한다.
            그 외에는 (1000/drawIdleFps)/drawIdleSpeed를 유휴 주기로 저장한다.

    getDrawSpeed()
        동작:
            this.#frame.drawIdleSpeed 값을 반환한다.

    start(time) -> void
        의존:
            URenderer — 렌더 루프 등록; 함수: {setAnimationLoop()}
            Web API — 렌더러 준비 대기; 함수: {setTimeout()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            time이 null·undefined이면 0으로 대체한다.
            설정 시간 뒤 실행할 타이머를 등록한다.
                타이머 시점에 _renderer가 falsy이면 start(1000)으로 다시 대기한다.
                타이머 시점에 _renderer가 truthy이면 renderFrame을 앱에 bind하여 렌더러 애니메이션 루프로 등록한다.

    #updateShadowFrame() -> void
        동작:
            getLayers()가 빈 배열이면 반환한다.
            updateShadowLayers()에 레이어 원본 배열과 프레임 상태를 전달한다.

    #setDrawTickFrame() -> void
        동작:
            준비 단계의 순번을 0, 목록을 빈 배열로 만든 뒤 configureDrawReadyStages()에 앱과 공유 불 타이머를 전달한다.

    isFrameMove()
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            카메라가 없으면 false를 반환한다.
            저장한 positionX_/Y_/Z_, rotationX_/Y_/Z_와 현재 카메라 좌표·회전 중 하나라도 다른지 반환한다.

    frameMove()
        동작:
            isFrameMove()가 false이면 false를 반환한다.
            현재 카메라 좌표·회전을 저장하고 updateFrustum()을 수행한 뒤 true를 반환한다.

    renderFrame(delta: number) -> false | undefined
        의존:
            U3dStats — RAF·그리기 통계; 함수: {update(), check()}
            UProcessManager — 프레임 기록; 함수: {_recordFrame()}
        동작:
            RAF 통계와 processManager 프레임 기록 후 미초기화·종료·렌더 중지 상태이면 반환한다.
            frameMove()가 true이면 활성 프레임 수와 그림자 갱신 시각을 설정한다.
            getDrawFrameMode()로 활성·유휴 그리기 시점을 판정하고 활성에서는 카운트를 감소시키며 유휴 상태를 저장한다.
            #updateShadowFrame()을 실행한다. 아직 그리기 시점이 아니면 #drawTickFrame(delta)과 대기 통계를 실행하고 false를 반환한다.
            그리기 시점에는 #drawTickFrame(delta,true)로 남은 준비를 완료하고 draw()를 수행한 뒤 준비 순번을 0으로 만든다.
            finishDrawFrame()에 판정 당시 주기를 전달해 일정을 저장한 뒤 실행 통계와 #canvasLoadingFrame()을 실행한다.

    #drawTickFrame(delta, all) -> void
        동작:
            updateFrame(), updateWorkFrame(), updateLayerFrame(), tweenFrame()을 순서대로 실행한 뒤 runDrawReadyStages()로 전체 또는 한 준비 단계를 실행한다.

    updateFrame(delta) -> void
        의존:
            U3dObject — 갱신일 비교; 함수: {getLastUpdateDate(), getUpdateDate()}
            U3dStats(_uStats) — 업데이트 통계; 함수: {check(), update()}
            U3dObject — 상속된 기반 객체·이벤트 API; 함수: {getLastUpdateDate()}
            U3dObject — 상속된 기반 객체·이벤트 API; 함수: {getUpdateDate()}
        동작:
            isAppFrameDue()가 false이면 대기 통계를 기록하고 반환한다.
            실행 시각을 저장하고 마지막 갱신일과 현재 갱신일 차이를 판정한다.
            유휴가 아니거나 데이터 변경이 있으면 _appUpdate3d를 false로 바꾸고 update()와 실행 통계를 수행하며 그 외에는 대기 통계를 기록한다.

    tweenFrame(delta) -> void
        의존:
            TWEEN — 실제 직접 import API; 함수: {TWEEN.update()}
        동작:
            isTweenFrameDue()가 false이면 반환한다.
            tweenFrameTime에 delta를 저장하고 TWEEN.update()를 실행한다.

    #domFpsFrame(frame)
        동작:
            FPS DOM이 없으면 반환한다.
            DOM 텍스트를 frame.toFixed(0)의 정수 FPS 표시로 바꾼다.

    #canvasLoadingFrame() -> void
        동작:
            loadingUserTotal이 0이고 loadingNow·loadingTotal이 각각 300보다 크면 loadingNow와 loadingTotal에서 300씩 뺀다.
            일반·사용자 총량 합이 falsy이면 분모를 1로 대체하고 현재값 합을 나누어 1 초과만 1로 제한한다.
            진행률 변화가 없고 loadingFrame이 0이면 #updateLoadingBar()를 수행하고 반환한다.
            그 외에는 계산 결과를 loadingRate에 저장한다.
            진행률이 1이면 loadingFrame이 loadingDelayCount=4인 시점에 clearUserLoading(), clearLoadingCount()를 순서대로 실행하고 loadingRate를 0으로 바꾼 뒤 #updateLoadingBar()를 수행하여 반환한다. 아직 4가 아니면 프레임을 증가한다.
            진행률이 1이 아니면 loadingFrame을 0으로 만든다.
            조기 반환하지 않은 경로에서 #updateLoadingBar()로 현재 진행률을 DOM에 반영한다.

    #updateLoadingBar() -> void
        의존:
            Web API — 진행률 스타일과 접근성 값; 함수: {HTMLElement.getAttribute(), HTMLElement.setAttribute()}; 속성 쓰기: {HTMLElement.style.width}
        동작:
            root 또는 fill이 없으면 반환한다.
            loadingVisible이 true이거나 사용자 총량이 0이 아니면 저장 진행률을 선택하고 그 외에는 0을 선택한다.
            선택률이 0보다 크면 100을 곱한 백분율, 그 외에는 0을 사용한다.
            root의 aria-valuenow가 백분율 문자열과 다를 때만 fill.style.width를 백분율로 쓰고 aria-valuenow를 함께 갱신한다.

    getNameSwipeLayers() -> Map<string, U3dAppCallbackCopyOption>
        동작:
            this.#draw.nameSwipeLayers 값을 반환한다.

    addNameSwipeLayer(name: string, isCopy: boolean = false) -> boolean
        의존:
            __GSError__ — 실제 직접 import API; 함수: {__GSError__()}
        동작:
            같은 이름이 없을 때 copy값을 보관하고 true를 반환한다.
            예외는 __GSError__로 기록하고 false를 반환한다.

    removeNameSwipeLayer(name: string) -> boolean
        의존:
            __GSError__ — 실제 직접 import API; 함수: {__GSError__()}
        동작:
            있는 이름을 제거하고 true를 반환한다.
            예외는 __GSError__로 기록하고 false를 반환한다.

    getEnableSwipe() -> boolean
        동작:
            this.#draw.enableSwipe 값을 반환한다.

    setEnableSwipe(enable: boolean) -> boolean
        동작:
            this.enableSwipe(enable) 값을 반환한다.

    enableSwipe(enable: boolean = true) -> boolean
        의존:
            __GError__ — 실제 직접 import API; 함수: {__GError__()}
            __GInfo__ — 실제 직접 import API; 함수: {__GInfo__()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            렌더러가 없으면 안내하고 false를 반환한다.
            setScissorTest(enable), 저장 상태 변경과 setUpdateDate()를 수행하여 true를 반환한다.
            예외를 오류로 기록하고 false를 반환한다.

    debugFps(visible: boolean = true, left: number = 1, top: number = 1) -> boolean
        동작:
            visible=false이면 #removeFpsDom()을 실행하고 false를 반환한다.
            기존 FPS DOM이 있으면 left·top 백분율 위치를 바꾸고 true를 반환한다.
            컨테이너가 없으면 false를 반환하며 static 위치이면 relative로 변경한다.
            u3d-fps div에 기본 표시·글꼴·배경·위치를 적용하여 컨테이너에 추가·보관하고 true를 반환한다.

    #removeFpsDom() -> void
        동작:
            FPS DOM이 없으면 반환하고 있으면 제거한 뒤 참조를 undefined로 만든다.

    getMapControl() -> UMapControls | undefined
        동작:
            this._mapControl 값을 반환한다.

    getLodingDom() -> HTMLDivElement | undefined
        동작:
            저장한 #debug.loadingBar 루트 DOM을 반환하며 생성 전이나 제거 후에는 undefined를 반환한다.

    createLoadingCanvas(id: string = 'loading-canvas') -> void
        의존:
            UEventDispatcher — 완료 이벤트 등록; 함수: {on()}
            Web API — DOM 진행률 구성; 함수: {document.createElement(), document.getElementById(), HTMLElement.appendChild(), HTMLElement.addEventListener(), HTMLElement.setAttribute(), Event.preventDefault()}
            U3dObject — 상속된 기반 객체·이벤트 API; 함수: {on()}
            setGlobalFunction — 실제 직접 import API; 함수: {setGlobalFunction()}
        동작:
            기존 root가 있으면 setVisibleLoading(true)를 수행하고 id를 입력으로 바꿔 반환한다.
            u3d-loading-bar 클래스의 div에 id와 role=progressbar, aria-label=로딩 진행률, min=0·max=100·now=0을 지정하고 contextmenu 기본 동작을 막는다.
            root 안 style의 :where(.u3d-loading-bar)는 기본 absolute·bottom=5px·left=16px·width=calc(100% - 32px)·height=5px·border-radius=999px·background=rgba(174,206,216,0.2)·box-shadow=0 1px 4px rgba(12,24,34,0.08)·overflow=hidden·pointer-events=none을 선언한다.
            기본 opacity는 1이며 :where(.u3d-loading-bar[aria-valuenow="0"]) 선택자는 opacity=0을 선언한다. opacity 전환은 140ms ease-out이고 prefers-reduced-motion: reduce에서는 transition=none을 선언한다.
            직계 fill의 :where() 선택자는 기본 width=0·height=100%·border-radius=inherit·background-color=rgba(105,190,214,0.98)·background-image=linear-gradient(90deg, rgba(134,218,184,0), rgba(134,218,184,0.98))·box-shadow=inset 0 1px 0 rgba(255,255,255,0.14)를 선언한다.
            u3d-loading-bar__fill 클래스의 div를 너비0%로 만들어 style과 함께 root에 넣고 현재 컨테이너에 root를 추가한다.
            root·fill을 상태에 저장하고 setVisibleLoading(true)로 현재 진행률을 반영한다.
            LOADED 이벤트에서 일반 총량 또는 현재값이 truthy이면 clearLoadingCount()를 실행할 콜백을 등록하고 그 키를 보관한다.
            전역 __GLoadingAddTotal__·__GLoadingAddNow__에 현재 앱의 사용자 로딩 API를 bind하여 등록한다.

    removeLoadingCanvas() -> void
        의존:
            UEventDispatcher — 등록한 완료 이벤트 제거; 함수: {unkey()}
            Web API — 로딩 DOM 제거; 함수: {HTMLElement.remove()}
            U3dObject — 상속된 기반 객체·이벤트 API; 함수: {unkey()}
        동작:
            this.#debug.loadingBar가 falsy이면 반환한다.
            this.#debug.loadingBar가 truthy이면 저장 이벤트 키가 문자열일 때 LOADED 등록 키를 unkey()한다.
                setVisibleLoading(false)로 채움을 지운 뒤 로딩 DOM을 제거하고 loadingBar·loadingBarFill·loadingBarEventKey 참조를 undefined로 만든다.

    setVisibleLoading(visible: boolean = true) -> void
        의존:
            Web API — 채움 초기화; 함수: {HTMLElement.setAttribute()}; 속성 쓰기: {HTMLElement.style.width}
        동작:
            loadingVisible에 입력을 저장한다.
            visible이 falsy이면 존재하는 fill 너비를 0%, root aria-valuenow를 0으로 바꾼다. 사용자 작업은 다음 #canvasLoadingFrame() 갱신에서 다시 표시될 수 있다.
            visible이 truthy이면 #updateLoadingBar()로 현재 진행률을 반영한다.

    addTotalProcessLoading(total = 1) -> void
        동작:
            일반 loadingTotal과 loadingProcessTotal에 total을 각각 더한다.

    addNowProcessLoading(now = 1) -> void
        동작:
            일반 loadingNow와 loadingProcessNow에 now를 각각 더한다.

    addTotalWorkLoading(total = 1) -> void
        동작:
            일반 loadingTotal과 loadingWorkTotal에 total을 각각 더한다.

    addNowWorkLoading(now = 1) -> void
        동작:
            일반 loadingNow와 loadingWorkNow에 now를 각각 더한다.

    addTotalUserLoading(total = 1) -> void
        동작:
            this.#debug.loadingUserTotal에 this.#debug.loadingUserTotal + total 값을 저장한다.

    addNowUserLoading(now = 1) -> void
        동작:
            this.#debug.loadingUserNow에 this.#debug.loadingUserNow + now 값을 저장한다.

    clearUserLoading() -> void
        동작:
            loadingUserNow와 loadingUserTotal을 각각 0으로 만든다.

    updateLoading() -> void
        동작:
            this.#canvasLoadingFrame()을 호출한다.

    clearLoadingCount() -> void
        동작:
            loadingTotal, loadingProcessTotal, loadingWorkNow, loadingNow, loadingProcessNow를 0으로 만든다. loadingWorkTotal은 보존된다. [확인 Q-002]

    debugBound(isDebug: boolean) -> void
        동작:
            isDebug가 truthy이면 hasRenderBefore()로 appDebugBound 등록 여부를 판정하여 이미 있으면 반환한다.
                등록이 없으면 setRenderBefore()로 렌더 시점에 실행할 콜백을 등록한다.
                    콜백에서 getLayers()로 가져온 레이어 중 debugBound가 있는 대상의 visible값에 따라 경계를 표시하거나 숨긴다.
            isDebug가 falsy이면 getLayers()로 가져온 각 레이어의 경계를 끄고 removeRenderBefore()로 해당 콜백을 제거한다.

    setUndergroundFogColor(color: ColorRepresentation) -> void
        동작:
            저장 안개 색을 바꾸고 지하 객체가 있으면 setFogColor(color)를 전달한다.

    getUndergroundFogColor() -> ColorRepresentation
        동작:
            this._undergroundFogColor 값을 반환한다.

    setUndergroundFogDensity(density: number) -> void
        동작:
            저장 안개 밀도를 바꾸고 지하 객체가 있으면 setFogDensity(density)를 전달한다.

    getUndergroundFogDensity() -> number
        동작:
            this._undergroundFogDensity 값을 반환한다.

    setUndergroundFogStartHeight(height: number) -> void
        동작:
            저장 시작 높이를 바꾸고 지하 객체가 있으면 setFogStartHeight(height)를 전달한다.

    getUndergroundFogStartHeight() -> number
        동작:
            this._undergroundFogStartHeight 값을 반환한다.

    setUndergroundFogEndHeight(height: number) -> void
        동작:
            저장 끝 높이를 바꾸고 지하 객체가 있으면 setFogEndHeight(height)를 전달한다.

    getUndergroundFogEndHeight() -> number
        동작:
            this._undergroundFogEndHeight 값을 반환한다.

    createControls() -> void
        의존:
            __GError__ — 실제 직접 import API; 함수: {__GError__()}
        동작:
            _controls를 빈 객체로 만든다. 카메라가 없으면 오류를 기록하고 반환한다.
            createMapControls(), createWalkControls.call(this), createFlyControls.call(this)를 실행한 뒤 현재 컨트롤을 지도로 설정한다.

    createMapControls() -> void
        의존:
            UCamera — 회전 초기화; 함수: {rotation.set()}
            UMapControls — 실제 직접 import API; 생성자: {new UMapControls()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            _mapControl이 defined이면 반환한다.
            _mapControl이 null·undefined이면 드로잉 인자·카메라·컨테이너로 UMapControls를 만들고 카메라 회전을 0으로 초기화한다.
                생성한 컨트롤을 _mapControl·_controls.map에 저장하고 initMapControl.call(this, control)을 실행한다.

    getDrawBufferHeight()
        동작:
            렌더러가 있으면 WebGL drawingBufferHeight, 없으면 컨테이너 clientHeight를 반환한다.

    getDrawBufferWidth()
        동작:
            렌더러가 있으면 WebGL drawingBufferWidth, 없으면 컨테이너 clientWidth를 반환한다.

    #setQuadTreeLevel(level: number, type: string, setterName: 'setMinLevel' | 'setMaxLevel') -> boolean
        의존:
            U3dQuadSet — 전체 루트 목록 조회; 함수: {getQuadTrees()}
            __GError__ — 실제 직접 import API; 함수: {__GError__()}
        동작:
            레벨이 0 이상의 유한한 정수가 아니면 false를 반환하고 기존 설정을 유지한다. 지형 최소 레벨은 지형 상한 이하, 지형 상한은 최소·현재 영역 시작 레벨 이상이어야 한다. 모델 상한은 모델 최소·현재 영역 시작 레벨 이상이어야 한다. 범위 검사도 대입 전에 수행하며 실패하면 설정을 바꾸지 않는다.
            지형이면 setterName에 따라 앱의 _minlevel 또는 _maxlevel을 변경하고 true를 반환한다. 모델 최대 레벨은 _modelMaxLevel에 저장하고 true를 반환한다. 이 설정은 트리 생성 여부와 무관하게 보관하고 다음 타일 갱신에서 사용한다.
            나머지 호출은 getQuadTrees(type)로 대상 루트 목록의 복사본을 조회하며 배열이 아니거나 비었으면 오류를 기록하고 false를 반환한다.
            getType()이 type과 같은 항목 중 setterName이 함수인 것에 level을 전달한다.
            하나라도 적용했는지 반환한다.

    setMinQuadTreeLevel(level: number, type: string = UDEF.TILE_TYPE.TERRAIN) -> boolean
        동작:
            this.#setQuadTreeLevel(level, type, 'setMinLevel') 값을 반환한다. 지형은 루트 인스턴스에 없는 정적 setter를 찾지 않고 앱의 최소 레벨을 변경한다. 실제 타일 레벨이 설정 최소보다 낮으면 하위 탐색을 중단한다. world·custom의 시작 레벨에도 예외를 두지 않으며 앱 설정을 임의로 낮추거나 최소 레벨까지 강제 분화하지 않는다.

    setMaxQuadTreeLevel(level: number, type: string = UDEF.TILE_TYPE.TERRAIN) -> boolean
        동작:
            this.#setQuadTreeLevel(level, type, 'setMaxLevel') 값을 반환한다. 지형·모델은 루트 유무와 무관하게 해당 앱 설정에 저장하고 true를 반환한다. 잘못된 값·범위는 false로 거절하며 이후 재시작에 필요한 시작 레벨 조건을 보존한다. 모델의 일반·강제 탐색은 모델 고유의 최소·최대 기준으로 판단하여 지형 설정의 영향을 받지 않으며, 상한 레벨에서 자식 생성을 중단한다.

    getModelMaxLevel() -> number
        동작: 앱의 일반 속성 _modelMaxLevel에 지정한 탐색 상한을 반환한다. 미지정이면 공개 정적 속성 U3dQuadModelTile.g_maxLevel을 사용하며 초기 기본값은 17이다. 이 조회는 트리 생성 여부와 무관하다.

    createDevToolView() -> UDevToolView | undefined
        의존:
            UDevToolView — 실제 직접 import API; 생성자: {new UDevToolView()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            이미 저장된 개발 도구가 있으면 반환한다.
            컨테이너가 없으면 undefined, 있으면 UDevToolView(this)를 만들어 저장·반환한다.

    getDevToolView() -> UDevToolView | undefined
        동작:
            this.#settingGUI 값을 반환한다.

    removeDevToolView() -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            개발 도구가 없으면 반환하고 있으면 dispose()한 뒤 참조를 undefined로 만든다.

    showDevToolView() -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            createDevToolView() 결과가 있으면 show()를 실행한다.

    hideDevToolView() -> void
        동작:
            this.#settingGUI?.hide?.()에 입력을 전달한다.

    createApp(opt)
        동작:
            new U3dApp(opt) 값을 반환한다.

    isDisposed()
        동작:
            this._disposed 값을 반환한다.

    saveJson()
        동작:
            this.getParam() 값을 반환한다.

    capture(opt: Partial<{dom: boolean}> = {}) -> Promise<string>
        의존:
            URenderer — 기반 이미지 캡처; 함수: {capture()}
            defaultValue — 실제 직접 import API; 함수: {defaultValue()}
            deferredPromise — 실제 직접 import API; 함수: {deferredPromise()}
        동작:
            deferredPromise 결과와 렌더러 캡처를 만든다. opt.dom이 false이면 기반 캡처 성공·실패를 그대로 전달한다.
            기반 캡처 성공 시 #compositeDomLayer()로 DOM을 합성하여 PNG dataURL로 resolve한다.
            기반 캡처를 await한 뒤 DOM 합성과 PNG 인코딩을 진행한다. DOM 합성·인코딩 실패에는 기반 이미지를 반환하고 기반 캡처 실패는 호출자의 Promise를 reject한다.

    captureToBlob(opt: Partial<{dom: boolean}> = {}) -> Promise<Blob | null>
        의존:
            URenderer — 기반 이미지·Blob 캡처; 함수: {capture(), captureToBlob()}
            defaultValue — 실제 직접 import API; 함수: {defaultValue()}
            deferredPromise — 실제 직접 import API; 함수: {deferredPromise()}
        동작:
            opt.dom이 false이면 렌더러 captureToBlob()에 결과를 전달하여 반환한다.
            기반 이미지 캡처 후 #compositeDomLayer()로 합성하여 canvas.toBlob 콜백의 Blob 또는 null로 resolve한다.
            DOM 합성 실패이면 렌더러 captureToBlob()으로 대체하고 기반 캡처 실패는 reject한다.

    #compositeDomLayer(baseImageUrl: string) -> Promise<HTMLCanvasElement>
        의존:
            Web API — 이미지 로드·캔버스 합성; 생성자: {new Image()}; 함수: {document.createElement(), HTMLCanvasElement.getContext(), CanvasRenderingContext2D.drawImage()}
            deferredPromise — 실제 직접 import API; 함수: {deferredPromise()}
        동작:
            입력 URL로 Image를 로드한다. 이미지 오류는 reject한다.
            로드되면 렌더러 캔버스 너비/컨테이너 너비로 스케일을 구하고 captureDomLayer()를 실행한다.
            이미지 load 콜백 안에서 DOM 캡처를 await하고 새 캔버스에 기반 이미지와 DOM 캔버스를 차례로 그려 resolve한다. 컨테이너 조회·캡처·합성의 동기 예외와 비동기 실패는 모두 reject한다.

    getSearchType()
        동작:
            UDEF.SEARCH_TYPE 값을 반환한다.

    getStopRender() -> boolean
        동작:
            this._stopRender 값을 반환한다.

    setStopRender(stop: boolean) -> void
        동작:
            this._stopRender에 stop 값을 저장한다.

    getModelImageDistance() -> number
        동작:
            this._modelImageDistance 값을 반환한다.

    setModelImageDistance(val: number) -> void
        동작:
            this._modelImageDistance에 val 값을 저장한다.

    getModelUpdateOffset() -> number
        동작:
            this._modelUpdateOffset 값을 반환한다.

    setModelUpdateOffset(val: number) -> void
        동작:
            this._modelUpdateOffset에 val 값을 저장한다.

    getModelImageDefaultLevel()
        동작:
            this._modelImageDefaultLevel 값을 반환한다.

    setModelImageDefaultLevel(val) -> void
        동작:
            this._modelImageDefaultLevel에 val 값을 저장한다.

    getMethodHeight()
        동작:
            this._methodHeight 값을 반환한다.

    setMethodHeight(val) -> void
        동작:
            기존 UDEF.HEIGHT_METHOD.NOW가 _1_0이면 DynamicSkirt1_0 렌더 이전 콜백을 제거한다.
            전역 NOW와 앱 _methodHeight에 입력을 저장한다.
            새 NOW가 _1_0이면 렌더 이전에 UHeightSkirt1_0.computeDynamicSkirt(this)를 실행할 콜백을 등록한다.

    setBoundingTree(val) -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            val이 truthy이면 THREE.BufferGeometry의 computeBoundsTree·disposeBoundsTree를 설치하고 기존 Mesh.raycast를 UDEF._originRaycast에 저장하여 acceleratedRaycast로 교체한 뒤 UDEF.BOUNDING_METHOD를 TREE로 설정한다.
            val이 falsy이면 두 geometry prototype 멤버를 undefined로 만든 뒤 삭제한다.
                UDEF._originRaycast가 defined이면 저장한 raycast를 Mesh에 복구하고 _originRaycast를 undefined로 만든 뒤 삭제한다.
                UDEF.BOUNDING_METHOD를 BOX로 설정한다.

    getTile(key: string, type: string = UDEF.TILE_TYPE.TERRAIN) -> undefined|U3dQuadTile
        의존:
            UDrawArg — 현재 타일 조회; 함수: {getTile()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            드로잉 인자가 있으면 getTile(key,type) 결과, 없으면 undefined를 반환한다.

    setMaxDistanceModel(val) -> void
        동작:
            기존값을 저장하고 _maxDistanceModel을 바꾼다.
            값이 달라졌을 때 update()를 실행한다.

    getMaxDistanceModel()
        동작:
            this._maxDistanceModel 값을 반환한다.

    setStopModel(val) -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            val이 없으면 true로 보완한 뒤 _stopModel에 저장한다.

    getStopModel()
        동작:
            this._stopModel 값을 반환한다.

    setRatioTileSize(val: number) -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            val이 없으면 반환하고 그 외에는 _ratioTileSize에 저장한다.

    setRatioModelTileSize(val: number) -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            val이 없으면 반환하고 그 외에는 _ratioModelTileSize에 저장한다.

    getRatioTileSize() -> number
        동작:
            this._ratioTileSize 값을 반환한다.

    getRatioModelTileSize() -> number
        동작:
            this._ratioModelTileSize 값을 반환한다.

    MetersToPixels(mx, my, zoom, px, py)
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            드로잉 인자가 있으면 false를 반환한다.
            없으면 그 MetersToPixels를 호출하려 하므로 예외가 발생한다. [확인 Q-003]

    setFrameOptimize(useFrameOptimize = true) -> void
        동작:
            this._frameOptimize에 useFrameOptimize 값을 저장한다.

    getFrameOptimize() -> boolean
        동작:
            this._frameOptimize 값을 반환한다.

    setOpacity(name: string, val: number) -> boolean
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            name·val·레이어 목록이 없으면 false를 반환한다.
            같은 이름의 첫 레이어에 setOpacity(val)를 실행하고 true, 찾지 못하면 false를 반환한다.

    getOpacity(name) -> number | null
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            name이 null·undefined이면 null을 반환한다.
            name이 defined이면 isInitialized()로 초기화 여부를 판정하여 false이면 null을 반환한다.
                같은 이름의 첫 레이어 getOpacity() 결과를 반환하며 찾지 못하면 null을 반환한다.

    getBox()
        동작:
            this._box 값을 반환한다.

    createBox()
        의존:
            THREE — 실제 직접 import API; 생성자: {new THREE.Box3(), new THREE.Vector3()}
        동작:
            지역 사각형의 좌상·우하 좌표로 최소 z=0, 최대 z=maxY인 THREE.Box3를 생성하여 반환한다.

    fitLayerExtent(layername: string, useFly: boolean, offsetZ: number, leftrotate: number = 0, downrotate: number = 0) -> Promise<boolean | void>
        의존:
            __GError__ — 실제 직접 import API; 함수: {__GError__()}
            deferredPromise — 실제 직접 import API; 함수: {deferredPromise()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            이름·레이어·getBoundingBox 함수·bounding box가 없으면 실패를 기록하고 false로 reject한 deferredPromise를 반환한다.
            상자가 있으면 fitExtentToBoundingBox()에 useFly·offsetZ·좌우/상하 회전을 전달한 결과를 반환한다.

    drawLayerExtent(layername, color)
        의존:
            UBox3 — 실제 직접 import API; 생성자: {new UBox3()}
            deferredPromise — 실제 직접 import API; 함수: {deferredPromise()}
            defined — 실제 직접 import API; 함수: {defined()}
            U3dMessage — 실제 직접 import API; 함수: {U3dMessage.error()}
            THREE — 실제 직접 import API; 생성자: {new THREE.Box3Helper(), new THREE.Vector3()}
        동작:
            이름·getBoundingBox 함수·상자가 없으면 false로 reject한 deferredPromise를 반환한다.
            UBox3와 THREE.Box3Helper를 생성하여 레이어 장면이 있으면 그 장면, 없으면 앱 장면에 추가한다.
            성공이면 값 없이 resolve하고 생성·추가 예외는 e.message로 reject한다.

    getEditHeightBoxList()
        동작:
            this._editHeightBoxList 값을 반환한다.

    updateHeightLayers(box, minlevel, maxlevel) -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
            U3dQuadTile — 실제 직접 import API; 함수: {U3dQuadTile.getMaxLevel()}
            UMathEngine — 실제 직접 import API; 함수: {UMathEngine.MetersToTile(), UMathEngine.TileBounds()}
        동작:
            box나 드로잉 인자가 없으면 반환한다.
            minlevel이 없으면 passLevel, maxlevel이 없으면 전역 최대 타일 레벨을 사용하고 고도 레이어가 없으면 반환한다.
            상자를 사방 100씩 확장하고 각 레이어의 truthy _minlevel 또는 지정 최소부터 최대까지 타일 인덱스 범위를 구한다.
            범위의 각 타일 경계를 계산하여 updateHeightByUser(infoTile)에 전달한다.

    defined(value)
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            defined(value) 값을 반환한다.

    assert(condition, message)
        의존:
            UDEF — 실제 직접 import API; 함수: {UDEF.assert()}
        동작:
            UDEF.assert(condition, message) 값을 반환한다.

    setHighlightByMesh(mesh, opt) -> void
        의존:
            defaultValue — 실제 직접 import API; 함수: {defaultValue()}
            UHighLightControl — 실제 직접 import API; 함수: {UHighLightControl.setHighlight()}
        동작:
            opt가 falsy이면 새 객체로 보완하고 type이 없으면 color로 설정한다.
            UHighLightControl.setHighlight(mesh,opt,this)에 전달한다.

    removeHighlightByMesh(mesh, opt) -> void
        의존:
            UHighLightControl — 실제 직접 import API; 함수: {UHighLightControl.removeHighlight()}
        동작:
            opt가 falsy이면 새 객체로 보완하고 UHighLightControl.removeHighlight(mesh,opt,this)에 전달한다.

    getPropertiesKeys()
        동작:
            Object.keys(this._properties) 값을 반환한다.

    addProperties(key, value) -> void
        동작:
            this._properties[key]에 value 값을 저장한다.

    getProperties(key)
        동작:
            this._properties[key] 값을 반환한다.

    setProperties(key, value) -> void
        동작:
            this._properties[key]에 value 값을 저장한다.

    removeProperties(key) -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            해당 속성값이 defined인 경우에만 키를 삭제한다.

    getPoiList()
        동작:
            this._poiList 값을 반환한다.

    setMaxProcess(maxProcess: number = UDEF.DEFAULT_MAX_PROCESS) -> void
        동작:
            _maxProcess를 저장하고 applyMaxProcess(maxProcess)에 전달한다.

    getMaxProcess() -> number
        동작:
            this._maxProcess 값을 반환한다.

    applyMaxProcess(maxProcess = UDEF.DEFAULT_MAX_PROCESS) -> void
        의존:
            UProcessManager — 작업량 상한 적용; 함수: {applyMaxProcess()}
        동작:
            this.getProcessManager().applyMaxProcess(maxProcess)에 입력을 전달한다.

    addObject(object: Object3D) -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            object가 없으면 반환하고 그 외에는 메인 장면에 추가한다.

    removeObject(object: Object3D) -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
            UDEF — 실제 직접 import API; 함수: {UDEF.disposeObject3D()}
        동작:
            object가 없으면 반환한다.
            메인·주석 장면에서 제거하고 UDEF.disposeObject3D(object)를 실행한다.

    getPoiById(id: string) -> U3dPOI | undefined
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            POI 목록이 없거나 비어 있으면 undefined를 반환한다.
            uuid가 id와 같은 첫 POI를 반환하고 없으면 undefined를 반환한다.

    createPOI(opt: U3dPOICO) -> Promise<U3dPOI> | null
        의존:
            U3dPOI — 실제 직접 import API; 생성자: {new U3dPOI()}
            defaultValue — 실제 직접 import API; 함수: {defaultValue()}
            deferredPromise — 실제 직접 import API; 함수: {deferredPromise()}
        동작:
            name·position·color·size와 POI 부가 옵션을 U3dPOI에 전달한다. heightOffset 기본값은 0, drawArg는 앱의 값, depthTest는 false이다.
            생성 POI가 undefined이면 null을 반환하고 그 외에는 addPOI()로 등록한 뒤 POI로 resolve한 deferredPromise를 반환한다.

    addPOI(poi: U3dPOI) -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            poi가 null·undefined이면 반환한다.
            poi가 defined이면 드로잉 인자를 연결한다.
                poi.on이 defined이면 POI change 이벤트에서 앱 setUpdateDate()를 실행할 콜백을 등록한다.
                depthTest가 truthy이면 메인 장면, 그 외에는 주석 장면에 추가하고 _poiList에도 보관한다.

    removePOI(poi: U3dPOI) -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
            UDEF — 실제 직접 import API; 함수: {UDEF.disposeObject3D()}
        동작:
            POI가 없으면 반환한다.
            depthTest에 따라 해당 장면에서 제거하고 id가 같은 첫 목록 항목을 제거한다.
            객체 자원을 해제하고 POI off()가 있으면 모든 이벤트를 해제한다.

    removeAllPoi() -> void
        동작:
            this.removeAllPOI()에 입력을 전달한다.

    removeAllPOI() -> void
        의존:
            UDEF — 실제 직접 import API; 함수: {UDEF.disposeObject3D()}
        동작:
            초기 목록 길이만큼 POI를 pop하여 depthTest에 따라 장면에서 제거하고 객체 자원을 해제한다.
            updateData()로 갱신한다.

    showAllPOI(show: boolean = true) -> void
        동작:
            각 POI에 show값이 truthy이면 show(), 그 외에는 hide()를 실행한다.

    showPOI(show: boolean = true, poi: U3dPOI) -> void
        동작:
            poi가 없으면 반환하고 같은 id의 첫 등록 항목에 show 또는 hide를 실행한다.

    selectPoi(e)
        의존:
            URaycaster — 실제 직접 import API; 생성자: {new URaycaster()}
        동작:
            이벤트 정규화 좌표에서 POI 목록을 raycast하고 object 참조가 같은 결과를 중복 제거한다.
            parent가 U3dPOI인 결과마다 선택값을 교체하여 마지막 선택 POI 또는 undefined를 반환한다.

    removeAllObject() -> void
        동작:
            초기 _objectList 길이만큼 pop하여 메인 장면에서 object._name으로 제거하고 매번 updateData()를 실행한다.

    getImageLayerByRenderOrder(order)
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            order가 없으면 high를 사용한다. 드로잉 인자가 없으면 오류를 던진다.
            이미지 레이어를 high이면 renderOrder 내림차순, 그 외에는 오름차순으로 정렬한다.
            U3dMeasureLayer를 제외한 첫 visible 레이어 또는 undefined를 반환한다.

    getInstanceBaseLayer()
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            드로잉 인자가 없으면 오류를 던진다.
            기반 레이어 이름의 이미지 레이어가 visible이면 반환하고 그 외에는 getImageLayerByRenderOrder(low) 결과를 반환한다.

    getInstanceBaseHeightLayer()
        동작:
            고도 목록에서 U3dMeasureLayer를 제외한 첫 visible 레이어 또는 undefined를 반환한다.

    getNameBaseLayer() -> string
        동작:
            this._nameBaseLayer 값을 반환한다.

    setNameBaseLayer(name: string) -> void
        동작:
            this._nameBaseLayer에 name 값을 저장한다.

    getCanvas()
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            렌더러가 있으면 domElement, 없으면 undefined를 반환한다.

    createloadingBar(containerid: string) -> void
        동작:
            this._idLoad에 containerid 값을 저장한다.

    loadingBar() -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            _idLoad가 없으면 반환하고 그 ID의 DOM이 있으면 display를 빈 문자열로 바꾼다.

    endloadingBar() -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            _idLoad가 없으면 반환하고 그 ID의 DOM이 있으면 display=none으로 바꾼다.

    removeDebugCanvas() -> void
        동작:
            this.removeDevToolView()에 입력을 전달한다.

    createDebugCanvas() -> void
        동작:
            this.createDevToolView()에 입력을 전달한다.

    setSizeBaseWindow(left, top, width, height) -> void
        동작:
            기반 렌더 영역의 left·top·width·height를 입력으로 교체하고 setUpdateDate()를 실행한다.

    setSizeSwipeWindow(left, top, width, height) -> void
        동작:
            스와이프 렌더 영역의 left·top·width·height를 입력으로 교체하고 setUpdateDate()를 실행한다.

    getEnableOpacityModelLayers() -> boolean
        동작:
            this.getProperties(UDEF.APP_PROP.MODEL.USE_OPACITY) 값을 반환한다.

    getEnableOpacityImageLayers() -> boolean
        동작:
            this.getProperties(UDEF.APP_PROP.IMAGE.USE_OPACITY) 값을 반환한다.

    setEnableOpacityModelLayers(enable: boolean)
        동작:
            모델 레이어를 getInstanceModelLayers()로 가져온다.
            enable이 truthy이면 사용 속성을 setProperties()로 true로 저장하고 getProperties()로 가져온 저장 불투명도를 모든 레이어에 적용한다.
            enable이 falsy이면 사용 속성을 setProperties()로 false로 저장하고 모든 레이어에 resetOpacity()를 실행한다.
            true를 반환한다.

    setEnableOpacityImageLayers(enable: boolean)
        동작:
            이미지 레이어를 getInstanceImageLayers()로 가져온다.
            enable이 truthy이면 사용 속성을 setProperties()로 true로 저장하고 getProperties()로 가져온 저장 불투명도를 모든 레이어에 적용한다.
            enable이 falsy이면 사용 속성을 setProperties()로 false로 저장하고 모든 레이어에 resetOpacity()를 실행한다.
            true를 반환한다.

    getOpacityModelLayers() -> number
        동작:
            this.getProperties(UDEF.APP_PROP.MODEL.OPACITY) 값을 반환한다.

    getOpacityImageLayers() -> number
        동작:
            this.getProperties(UDEF.APP_PROP.IMAGE.OPACITY) 값을 반환한다.

    setOpacityModelLayers(value: number) -> void
        동작:
            모델 불투명도를 속성에 저장하고 사용 옵션이 false이면 반환한다.
            그 외에는 현재 모든 모델 레이어에 불투명도를 적용한다.

    setOpacityImageLayers(value: number) -> void
        동작:
            이미지 불투명도를 속성에 저장하고 사용 옵션이 false이면 반환한다.
            그 외에는 현재 모든 이미지 레이어에 불투명도를 적용한다.

    setEnableClipping(enable: boolean) -> boolean
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            렌더러가 없으면 안내하고 false를 반환한다.
            클리핑 사용 속성과 renderer.localClippingEnabled를 입력으로 바꾸고 setUpdateDate()를 실행하여 true를 반환한다.

    setClippingAxisX(value) -> void
        동작:
            clipAxis.call(self, 'x', value)에 입력을 전달한다.

    setClippingAxisY(value) -> void
        동작:
            clipAxis.call(self, 'y', value)에 입력을 전달한다.

    setClippingAxisZ(value) -> void
        동작:
            clipAxis.call(self, 'z', value)에 입력을 전달한다.

    setClippingAxisHeight(value)
        동작:
            this.setClippingAxisZ(value) 값을 반환한다.

    setClippingAxisXByRatio(value: number) -> void
        의존:
            UDEF — 실제 직접 import API; 함수: {UDEF.assert()}
        동작:
            value가 -1 이상 1 이하인지 UDEF.assert()한 뒤 clipAxisByRatio.call(this,x,value)를 실행한다.

    setClippingAxisYByRatio(value: number) -> void
        의존:
            UDEF — 실제 직접 import API; 함수: {UDEF.assert()}
        동작:
            value가 -1 이상 1 이하인지 UDEF.assert()한 뒤 clipAxisByRatio.call(this,y,value)를 실행한다.

    setClippingAxisHeightByRatio(value: number)
        동작:
            this.setClippingAxisZByRatio(value) 값을 반환한다.

    clearClippingAxis() -> void
        동작:
            this._clippingPlanes에 [] 값을 저장한다.

    setClippingAxisZByRatio(value) -> void
        의존:
            UDEF — 실제 직접 import API; 함수: {UDEF.assert()}
        동작:
            value가 -1 이상 1 이하인지 UDEF.assert()한 뒤 clipAxisByRatio.call(this,z,value)를 실행한다.

    override getName() -> string
        동작:
            this._name 값을 반환한다.

    isInitialized() -> boolean
        동작:
            this._bInitialized 값을 반환한다.

    setMode(mode: number) -> void
        동작:
            _mode에 입력을 저장하고 u3-popup 클래스 DOM의 display를 none으로 바꾼다.

    getMode() -> number
        동작:
            this._mode 값을 반환한다.

    isSimulationMode()
        동작:
            현재 mode가 FLY 또는 WALK이면 true, 그 외에는 false를 반환한다.

    getFov() -> number
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            카메라가 있으면 fov, 없으면 undefined를 반환한다. [확인 Q-010]

    setFov(fov: number) -> boolean
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            _camera가 null·undefined이면 false를 반환한다.
            _camera가 defined이면 카메라 종류를 판정한다.
                직교 카메라이면 camera._fov만 바꾸고 true를 반환한다.
                그 외에는 camera.fov를 저장하고 denominator·투영행렬을 갱신한 뒤 setUpdateDate()로 앱 갱신일을 바꿔 true를 반환한다.

    setCameraFov(fov: number) -> boolean
        동작:
            this.setFov(fov) 값을 반환한다.

    getCameraFov() -> number
        동작:
            this.getFov() 값을 반환한다.

    setPanMode(type: number) -> void
        의존:
            UMapControls — 지도 입력 모드 변경; 함수: {setMode()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            type이 없으면 PAN을 사용하여 지도 컨트롤 모드를 바꾼다.
            2D 상태이면 #lockViewAngleLimit()로 각도 제한을 고정한다.
            앱이 이미 PAN이면 반환하고 그 외에는 stopFly(), activeMode(map)를 실행한 뒤 앱 mode를 PAN으로 바꾼다.

    showUnderGroundGrid(show: boolean) -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            지하 객체가 있을 때 show가 정확히 true이면 장면에 추가하고 그 외에는 제거한다.

    isUnderGroundMode(set) -> boolean
        동작:
            this._mode === UDEF.APP_MODE._UNDERGROUND 값을 반환한다.

    setUnderGroundMode(set: boolean) -> void
        의존:
            UUnderground — 실제 직접 import API; 생성자: {new UUnderground()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            set이 null·undefined이거나 truthy이면 setUseCollision(false)와 setFreePolarAngle(true)로 충돌을 끄고 고도각을 자유롭게 한다.
                이미 UNDERGROUND이면 반환한다. 그 외에는 _mode를 UNDERGROUND로 바꾼다.
                self._undergroundId가 null·undefined이면 지역 중심·절반 크기와 저장 지하 표현 옵션으로 UUnderground를 만들어 _undergroundId와 객체 참조에 보관하고 장면에 추가한다.
            set이 defined이며 falsy이면 충돌을 켜고 각도를 제한한 뒤 UNDERGROUND 상태일 때 _mode를 PAN으로 바꾼다.
                지하 ID가 defined이면 장면의 해당 객체를 찾아 제거·해제하고 객체와 ID 참조를 undefined로 만든다.

    setWalkMode(position, target, minHeight)
        의존:
            U3dObject — 상속된 기반 객체·이벤트 API; 함수: {unkey()}
            U3dObject — 상속된 기반 객체·이벤트 API; 함수: {on()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            이미 WALK이면 반환한다. 지도 컨트롤 상태를 저장하고 setUseCollision(true)로 충돌을 켠다.
            position이 null·undefined이면 기존 클릭 키를 해제하고 새 클릭 리스너를 등록하여 반환한다.
                클릭 시 mode가 WALK가 아니면 키를 해제하고 반환한다. WALK이면 closestPointAtPixel() 결과 높이에 5를 더하고 setWalkMode_.call(this, point, target, minHeight)를 실행한 뒤 클릭 키를 해제한다.
            position이 defined이면 setWalkMode_.call(this, position, target, minHeight)를 실행한다.
            position이 null·undefined이면 실행하는 후반 대체 분기에는 activeMode(walk)가 있으나 앞선 클릭 등록 분기가 반환하므로 정상 입력 흐름에서는 도달하지 않는다.

    setFlyMode() -> void
        동작:
            이미 FLY이면 반환한다.
            지도 컨트롤 상태를 저장하고 충돌을 켠 뒤 mode를 FLY, 현재 컨트롤을 fly로 바꾸어 activeMode(fly)를 실행한다.

    setSlopeMode() -> void
        동작:
            mode를 SLOPE로 바꾸고 선형 거리 측정 모드를 설정한다.

    activeMode(mode: string) -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            선택하지 않은 모든 컨트롤에 deactive()를 실행한다.
            선택한 컨트롤이 있으면 active()를 실행하고 _curControl에 저장한다.

    #getTopViewFlyPosition(position: WorldPosition, target: WorldPosition) -> {position: WorldPosition, target: WorldPosition | undefined}
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            2D가 아니거나 컨트롤 또는 position이 없으면 입력 position·target 참조를 그대로 묶어 반환한다.
            2D이면 현재 카메라 위치와 컨트롤로 getTopViewFlyPosition()이 생성한 수직 시점 이동 좌표를 반환한다.

    flyToPosition(position: WorldPosition, target: WorldPosition, duration: number) -> Promise<void>
        의존:
            UMapControls — 카메라 이동 시작; 함수: {flyTo()}
            deferredPromise — 실제 직접 import API; 함수: {deferredPromise()}
        동작:
            stopFly()로 기존 이동을 중단하고 deferredPromise 결과를 만든다.
            #getTopViewFlyPosition()으로 이동 좌표를 준비한 뒤 mapControl.flyTo()에 position·target·duration과 stop·complete 시 resolve할 콜백을 전달한다.
            트윈을 _currentTween에 저장하고 deferredPromise를 반환한다.

    flyTo(position: GeoPosition, duration: number) -> Promise<boolean>
        동작:
            position이 falsy이면 new Promise.resolve(false)를 실행하여 생성자 사용 오류가 발생한다. [확인 Q-004]
            position이 truthy이면 geographicToVector3()로 월드 좌표를 만들고 z를 0으로 바꾼다.
                getCameraPosition()·getCameraTargetPosition()으로 가져온 카메라와 타겟에서 새 월드 좌표의 오프셋을 반영하고 flyToPosition()에 카메라 좌표·undefined 타겟·duration을 전달하여 결과를 반환한다.

    flyToVector3_(position: WorldPosition, target: WorldPosition, duration: number) -> Promise<boolean>
        의존:
            __GInfo__ — 실제 직접 import API; 함수: {__GInfo__()}
        동작:
            API 이름 변경 안내를 출력하고 flyToPosition(position,target,duration) 결과를 반환한다.

    flyToClick(event: U3dMouseEvent, offset: number = 1) -> Promise<boolean>
        의존:
            __GWarn__ — 실제 직접 import API; 함수: {__GWarn__()}
            defined — 실제 직접 import API; 함수: {defined()}
            THREE — 실제 직접 import API; 생성자: {new THREE.Vector3()}
        동작:
            closestPointAtPixel()로 클릭점 위치를 구하고 부재이면 경고 후 new Promise.resolve(false)를 실행하여 생성자 사용 오류가 발생한다. [확인 Q-005]
            클릭점을 복사하여 새 타겟으로 보관한다.
            offset이 defined이면 is2DMode()로 방향을 선택한다.
                2D이면 수직 방향, 그 외에는 getCameraPosition()에서 클릭점으로 향하는 반대 방향을 정규화하여 offset만큼 떨어진 새 카메라 위치를 만든다.
            self._mapControl.object.isOrthographicCamera가 truthy이면 현재 카메라 z를 읽어 이동점 z에 저장한다.
            flyToPosition(이동점, 새 타겟)의 결과를 반환한다.

    flyToTarget(offset: number = 1, duration: number = 3000) -> Promise<boolean>
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
            THREE — 실제 직접 import API; 생성자: {new THREE.Vector3()}
        동작:
            getCameraTargetPosition()으로 타겟을 가져와 카메라에서 타겟 방향으로 getInstanceScenesFromTerrainLayers()의 지형 장면을 raycast한다. 첫 교차점이 있으면 그 점, 없으면 타겟 복사본을 이동점으로 선택한다.
            offset이 defined이면 getCameraPosition()에서 이동점으로 향하는 반대 방향으로 offset만큼 이동점을 옮긴다.
            현재 타겟 복사본과 duration을 flyToPosition()에 전달하여 결과를 반환한다.

    getLandTargetPosition() -> GeoPosition
        의존:
            URaycaster — 실제 직접 import API; 생성자: {new URaycaster()}
            defined — 실제 직접 import API; 함수: {defined()}
            THREE — 실제 직접 import API; 생성자: {new THREE.Vector3()}
        동작:
            카메라에서 타겟 방향으로 지형을 raycast하여 첫 교차점 또는 타겟 복사본을 선택한다.
            선택점 x,y를 지리좌표로 바꾸고 z는 월드 높이를 유지하여 반환한다.

    initOpenLayers() -> void
        동작:
            전역 proj4를 OpenLayers에 연결하고 EPSG:2097·5173·5174·5175·5176·5177·5179·5181·5183·5186·5187·4978의 좌표 변환 정의와 지정 extent를 등록한다.
            EPSG:3857에는 zoom 0부터 32의 XYZ 기본 타일 그리드를 연결한다.

    getHomePosition() -> object
        동작:
            저장 홈 좌표를 x,y,height로, 회전을 rotateLeft,rotatedown으로 담은 새 객체를 반환한다.

    setHomePosition(geox: number, geoy: number, height: number, rotateleft: number, rotatedown: number) -> Promise<boolean>
        의존:
            THREE — 실제 직접 import API; 생성자: {new THREE.Vector3()}
        동작:
            경위도·높이로 새 Vector3를 저장하고 rotateleft·rotatedown을 각각 홈 회전에 저장한다. 반환값 없이 종료한다. [확인 Q-011]

    updateHomePosition(duration: number = 100) -> Promise<boolean>
        동작:
            this.setCameraGeographicPosition( this._homePosition.x, this._homePosition.y, 0, this._homeRotateLeft, this._homeRotateDown, this._homePosition.z, duration ) 값을 반환한다.

    createOpenLayer(opt: U3dOpenLayerCO) -> U3dOpenLayer | null
        의존:
            U3dOpenLayer — 실제 직접 import API; 생성자: {new U3dOpenLayer()}
            U3dLayerList — 등록 이름 조회; 함수: {getLayer()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            opt가 null·undefined이면 빈 옵션으로 보완한다.
            보완한 옵션의 name으로 등록 목록을 조회하여 같은 이름의 레이어가 있으면 null을 반환한다.
            중복 이름이 없으면 보완한 옵션으로 U3dOpenLayer를 생성한다.
            새 레이어를 addLayer()에 전달한 뒤 그 레이어 자체를 반환한다.

    createWMTSImageLayer(opt: U3dImageWMTSLayerCO) -> U3dImageWMTSLayer | null
        의존:
            U3dImageWMTSLayer — 실제 직접 import API; 생성자: {new U3dImageWMTSLayer()}
            U3dLayerList — 등록 이름 조회; 함수: {getLayer()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            opt가 null·undefined이면 빈 옵션으로 보완한다.
            보완한 옵션의 name으로 등록 목록을 조회하여 같은 이름의 레이어가 있으면 null을 반환한다.
            중복 이름이 없으면 보완한 옵션으로 U3dImageWMTSLayer를 생성한다.
            새 레이어를 addLayer()에 전달한 뒤 그 레이어 자체를 반환한다.

    createPatternLayer(opt: U3dPatternXYZLayerCO) -> U3dPatternXYZLayer | null
        의존:
            U3dPatternXYZLayer — 실제 직접 import API; 생성자: {new U3dPatternXYZLayer()}
            defined — 실제 직접 import API; 함수: {defined()}
            U3dMessage — 실제 직접 import API; 함수: {U3dMessage.error()}
        동작:
            opt가 falsy이면 새 객체로 보완하고 이름이 없으면 patternImageLayer를 사용한다.
            같은 이름 레이어가 있으면 오류를 안내하고 null을 반환한다.
            U3dPatternXYZLayer를 만들어 등록한 뒤 반환한다.

    createEmapBaseLayer(opt: U3dEmapLayerCO) -> U3dOpenLayer | null
        의존:
            UDEF — 기본 지도 분류; 상수: {_EMAP_KIND._BASE}
            defaultValue — 실제 직접 import API; 함수: {defaultValue()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            opt를 보완하고 같은 이름 레이어가 있으면 null을 반환한다.
            원본 opt의 layername 기본값을 korean_map, ext를 image/png, API key를 내장 기본값, useProxy=false, proxy=proxy.jsp?url=, drawarg=현재 앱 값, geoextent=getEmapGeoExtent_()로 보완한다.
            matrixsetname·stylename을 korean, ekind를 BASE로 강제하여 createEmapTemplateLayer(opt) 결과를 반환한다.

    createEmapSatLayer(opt: U3dEmapSatLayerCO) -> U3dOpenLayer | null
        의존:
            UDEF — 위성 지도 분류; 상수: {_EMAP_KIND._SAT}
            defaultValue — 실제 직접 import API; 함수: {defaultValue()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            opt를 보완하고 같은 이름 레이어가 있으면 null을 반환한다.
            원본 opt의 layername 기본값을 AIRPHOTO, ext를 image/jpg, API key를 내장 기본값, useProxy=false, proxy=proxy.jsp?url=, drawarg=현재 앱 값, geoextent=getEmapGeoExtent_()로 보완한다.
            matrixsetname=NGIS_AIR·stylename=빈 문자열·ekind=SAT로 강제하여 createEmapTemplateLayer(opt) 결과를 반환한다.

    createEmapTemplateLayer(opt: U3dEmapLayerCO) -> U3dOpenLayer | null
        의존:
            U3dLayerList — 등록 이름 조회; 함수: {getLayer()}
            UDEF — 기본 지도와 위성 지도 구분; 상수: {_EMAP_KIND._BASE, _EMAP_KIND._SAT}
            OpenLayers(ol) — Emap 투영·격자·공유 source와 타일 레이어 구성; 함수: {proj.get()}; 생성자: {new tilegrid.WMTS(), new source.WMTS(), new layer.Tile()}
            __GInfo__ — 실제 직접 import API; 함수: {__GInfo__()}
            defaultValue — 실제 직접 import API; 함수: {defaultValue()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            opt를 보완하고 같은 이름 레이어가 있으면 null을 반환한다.
            원본 opt에 ekind=SAT·내장 API key·xyorder=xy를 기본값으로 보완하고 defined인 url, defined인 baseurl, 기본 서비스 URL 순으로 opt.url을 결정한다.
            타일 레이어 callback을 opt.layers 배열의 emap 항목으로 등록한다.
                callback에서 sharedSources[0]이 defined이면 그 source를 사용하는 새 Tile을 바로 반환한다.
                callback에서 sharedSources[0]이 null·undefined이면 EPSG:5179와 256 크기 WMTS 그리드를 구성한다.
                    고정 해상도 2088.96부터 0.255의 14개 단계를 사용한다. BASE이면 pad()로 2자리 레벨을 만들어 L05부터 matrix ID를 붙이고 그 외에는 5부터의 숫자 ID를 사용한다.
                    callback parameter를 원본 opt에 병합하고 WMTS source를 생성한다. 이미지 로드 URL에 API key를 추가하고 사용 설정에 따라 proxy를 앞에 붙인다.
                    xyorder가 yx이면 TileCol·TileRow를 교환하여 이미지 src를 반영하고 callback은 새 Tile을 반환한다.
            createOpenLayer(opt) 결과를 그대로 반환한다.

    createTMSImageLayer(opt: U3dTMSImageLayerCO) -> U3dOpenLayer | null
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
            UDEF — 실제 직접 import API; 함수: {UDEF.assert()}
            __GError__ — TMS 입력 검증 실패·안전한 엔진 레벨 부재를 오류로 안내; 함수: {__GError__()}
            OpenLayers(ol) — TMS 좌표 변환·투영 동등성 검사와 타일 source 구성; 함수: {proj.get(), proj.equivalent(), proj.transform()}; 생성자: {new layer.Tile(), new source.XYZ()}
        동작:
            opt가 falsy이면 빈 객체로 보완하고 같은 이름의 기존 레이어가 defined이면 null을 반환한다.
            기존 레이어가 없으면 다음 생성 경로를 실행한다.
                opt.name·opt.baseurl·metadata·srs·tileFormat·raster·boundingBox·profile의 존재를 assert한다.
                srs가 비어 있지 않은 문자열인지, profile을 양끝 공백 제거·소문자 변환한 값이 mercator 또는 raster인지 검사하고 boundingBox의 네 좌표를 유한수로 정규화하여 min<max인지 검사한다. 하나라도 무효이면 __GError__로 알리고 null을 반환하며 레이어를 만들지 않는다.
                메타데이터 srs의 양끝 공백을 제거하고 대문자로 하여 opt.srs에 저장한다. tileFormat.reverseY가 null 또는 undefined이면 false를 사용한다. 값이 있으면 boolean 또는 양끝 공백과 대소문자를 정규화한 true·false 문자열만 허용한다. 그 밖의 값이면 __GError__로 알리고 null을 반환하며 레이어를 만들지 않는다.
                opt.boundingbox에 정규화한 새 경계를 저장하고 정규화한 profile을 지역 profile과 opt.profile에 저장한다.
                비mercator에서 metadata.origin이 defined이면 x·y를 유한수로 정규화한다. 둘 중 하나라도 무효이면 __GError__로 알리고 null을 반환하며, 유효하면 정규화한 새 원점을 TileGrid 생성 경로에 사용한다.
                tileFormat.width가 null 또는 undefined이면 기존 OpenLayers 동작과 같은 256을 사용한다. 값이 있으면 양의 안전한 정수로 정규화하고, 무효이면 __GError__로 알린 뒤 null을 반환하여 레이어를 만들지 않는다. XML 숫자 문자열은 숫자로 변환한다.
                opt.useproxy가 truthy이면 proxyurl의 존재와 빈 문자열을 판정한다.
                    proxyurl이 null·undefined이거나 빈 문자열이면 opt.proxyurl을 ./proxy.jsp?url=로 보완한다.
                opt.useproxy가 falsy이면 opt.proxyurl을 빈 문자열로 저장한다.
                source maxZoom은 0~32 범위의 정수인 opt.maxlevel, metadata.raster.maxlevel, 기본값 19 순서로 정한다. 비mercator의 0은 빈 해상도 배열을 만들므로 무효로 취급하며 32 상한으로 과도한 해상도 배열 생성을 막는다.
                Mercator maxZoom은 포함형이고 비mercator maxZoom은 배타형이므로 마지막 source 줌을 각각 maxZoom과 maxZoom-1로 정한다.
                source minZoom은 범위 안의 opt.minlevel, metadata.raster.minlevel 순서로 정한다. 둘 다 무효이면 범위 안의 기존 기본값 14를 사용한다.
                기본값 14가 범위를 벗어나면 길이가 지원 원본 줌 수 33 이하인 Array의 tilesets만 인덱스로 순회하여 유효한 order 중 최솟값을 사용한다. 목록이 지나치게 길거나 비었거나 유효 order가 없으면 max(0,maxZoom-1)을 사용한다. 계산값을 opt.minlevel에 저장한다.
                profile이 mercator이면 경위도 경계를 3857로 변환한다.
                    metadata srs가 등록되어 있고 EPSG:3857과 동등한지 먼저 검사한다. 미등록 또는 비동등 좌표계이면 __GError__로 알리고 null을 반환하며 레이어를 만들지 않는다.
                    변환이 예외를 내거나 변환 경계가 유한하지 않거나 min<max를 만족하지 않으면 __GError__로 알리고 null을 반환하며 레이어를 만들지 않는다.
                    callback은 실행 시 전달된 sharedSources[0]이 defined이면 공유 source로 새 Tile을 만들어 즉시 반환한다.
                    callback의 공유 source가 부재이면 ROW 여부와 reverseY에 맞는 XYZ URL을 구성하고 원본 minZoom·maxZoom과 정규화한 tileSize를 적용한 새 source로 Tile을 반환한다.
                    복사 옵션에서 minlevel·maxlevel의 모든 대소문자 별칭을 제거하고 계산한 원본 minZoom·maxZoom을 엔진 레이어의 minLevel·maxLevel에 각각 저장한다. 이미 변환한 경계를 다시 변환하지 않도록 srs를 EPSG:3857로 정규화하고 변환 경계·callback·transparent=true를 함께 반영하여 createOpenLayer()에 전달한다.
                    생성 결과가 null이면 그대로 반환하고, 레이어이면 tms_=true를 저장하여 반환한다.
                profile이 mercator가 아니면 maxZoom을 배타 상한으로 하여 0..maxZoom-1의 matrix와 maxresolution/2^i 해상도를 만든다.
                    raster.maxresolution이 양의 유한수인지 검사한다. 무효이면 __GError__로 알리고 null을 반환하며 레이어를 만들지 않는다. XML 숫자 문자열은 숫자로 변환한다.
                    callback은 실행 시 originBox에서 extent를 만들고 메타데이터 projection·공유 source와 source 격자의 minZoom을 createTemplateTMSImageLayer()에 전달한다.
                    원본 opt.minresolution·opt.maxresolution에 끝·첫 해상도를 저장하고 opt.transparent=true와 opt.layers의 callback을 저장한다.
                    앱의 유효 최대 레벨과 지원 상한 32 중 작은 값을 자동 하한 탐색 상한으로 정한다. opt.maxLevel은 유효한 값 또는 U3dLayer 기본값 19로 정한 뒤 이 탐색 상한 이하로 제한하지만, 자동 하한 계산 자체에는 사용하지 않는다.
                    source minZoom 해상도를 경계 3×3 표본에서 월드 좌표(EPSG:3857) 엔진 해상도로 환산하여 자동 minLevel을 계산한다.
                    투영·경계·해상도 입력을 검증할 수 없어 자동 minLevel이 undefined이면 __GError__로 원인을 알리고 null을 반환한다. 레이어를 만들지 않으며 opt.metadata를 보존한다.
                    유효한 opt.minLevel이 자동 minLevel보다 크면 더 높은 값을 사용하되 앱·지원 상한 이하로 제한한다. opt.maxLevel이 최종 minLevel보다 낮으면 최종 minLevel까지 올려 사용자의 낮은 값이 자동 안전 하한을 낮추지 못하게 한다.
                    탐색 상한 안에 안전한 레벨이 없으면 __GError__로 원인을 알린다. minLevel을 앱 최대 레벨+1, maxLevel을 탐색 상한으로 만들어 타일 요청을 차단한다.
                    opt.metadata를 삭제한다. 레이어 생성용 복사 옵션에서는 minlevel·maxlevel의 모든 대소문자 별칭을 제거하고, 계산한 엔진 minLevel·maxLevel을 camelCase로 전달하여 createOpenLayer()를 호출한다.
                    생성 결과가 null이면 그대로 반환하고, 레이어이면 tms_=true를 저장하여 반환한다.

    createTMSImageLayerAsXML(name: string, baseurl: string, srs: string, boundingBox: object, profile: 'raster' | 'mercator', ext: string, minlevel: number, maxlevel: number, tileWidth: number | undefined, maxresolution: number, proj: string | undefined, proxyurl: string, useproxy: boolean, reverseY: boolean | undefined, majorFolder: string | undefined, origin: { x: number, y: number } | undefined) -> U3dOpenLayer | null
        의존:
            defaultValue — 실제 직접 import API; 함수: {defaultValue()}
            defined — 실제 직접 import API; 함수: {defined()}
            UDEF — 실제 직접 import API; 함수: {UDEF.assert()}
        동작:
            같은 이름 레이어가 있으면 null을 반환하고 name·baseurl·srs·boundingBox·ext·profile을 assert한다.
            useproxy에 따라 proxyurl을 보완 또는 비우고 boundingbox는 입력 원본 참조로 보관한다.
            maxlevel이 없으면 19, 그 외에는 parseInt 값이며 minlevel이 없으면 지정 양수 maxlevel의 바로 아래 또는 14를 사용한다.
            mercator이면 경계를 3857로 바꾸고 옵션·상자 복사본을 만든다. ROW와 reverseY에 따라 URL을 선택하고 minZoom 최소7·maxZoom 최소8을 적용한다.
            callback은 공유 source 또는 새 XYZ로 Tile을 만들어 반환한다.
            비mercator이면 tileWidth가 없을 때 256을 사용하여 해상도·matrix를 만든다. callback은 originBox와 projection, sharedSource를 createTemplateTMSImageLayer()에 전달한다.
            해상도·transparent·callback을 옵션에 저장하여 createOpenLayer() 결과가 null이면 그대로 반환하고, 레이어이면 tms_=true를 붙여 반환한다.

    createTemplateTMSImageLayer(baseurl: string, srs: string, profile: 'raster' | 'mercator', extent: Array<number>, tileSize: number, matrixIds: Array<number>, resolutions: Array<number>, ext: string, proj: string | undefined, minZoom: number, proxyurl: string, useproxy: boolean, reverseY: boolean, majorFolder: string | undefined, origin: { x: number, y: number } | undefined, sharedSource: object) -> object
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            sharedSource가 있으면 그 source의 새 Tile을 반환하여 나머지 옵션 처리를 건너뛴다.
            proxy 사용에 따라 prefix를 선택하고 미등록 좌표계에는 proj가 있으면 전역 proj4 정의를 추가하며 없으면 안내한다.
            minZoom이 없으면 14, 그 외에는 parseInt 값을 사용한다. origin이 있으면 x,y를 쓰고 없으면 extent의 첫 두 값을 쓴다.
            지정 해상도·matrix·extent·origin·tileSize로 TileGrid와 XYZ를 만든다. 사용자 TileGrid가 XYZ의 tileSize 옵션보다 우선하므로 TileGrid 자체에도 정사각 타일의 숫자 tileSize를 저장한다. ROW이면 reverseY에 따른 y 경로를 적용한다.
            ROW가 아니면 타일 extent·origin·해상도로 x,y를 각각 Math.round()하여 재계산하고 urlTileCoord 원본의 인덱스를 바꾸어 y-1 경로를 반환하는 콜백을 등록한다.
            그 XYZ의 새 Tile을 반환한다.

    getTerrainLayer() -> U3dTerrainLayer | undefined
        동작:
            this._terrainLayer 값을 반환한다.

    _createTerrainLayer(opt: U3dModelLayerCO = {}) -> U3dTerrainLayer | null
        의존:
            U3dTerrainLayer — 실제 직접 import API; 생성자: {new U3dTerrainLayer()}
            U3dLayerList — 같은 이름의 레이어 조회; 함수: {getLayer()}
            __GInfo__ — 실제 직접 import API; 함수: {__GInfo__()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            기존 _terrainLayer가 있으면 안내하고 null을 반환한다.
            opt를 생략하거나 undefined이면 빈 객체를 사용한다.
            opt가 null이거나 같은 이름의 레이어가 등록되어 있으면 null을 반환한다.
            U3dTerrainLayer(opt)를 생성하여 등록한 뒤 _terrainLayer에 보관하고 생성한 레이어를 반환한다.

    getMeasureLayer() -> U3dShaderMeasureLayer | null | undefined
        동작:
            this._measureLayer 값을 반환한다. 생성 실패 시 null이며 초기화 전이나 해제 후에는 undefined이다.

    _createMeasureLayer(opt: object) -> U3dShaderMeasureLayer | null
        의존:
            U3dShaderMeasureLayer — 실제 직접 import API; 생성자: {new U3dShaderMeasureLayer()}
            U3dLayerList — 같은 이름의 레이어 조회; 함수: {getLayer()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            opt가 null·undefined이면 새 빈 객체를 사용한다.
            같은 이름의 레이어가 등록되어 있으면 null을 반환한다.
            U3dShaderMeasureLayer(opt)를 생성하여 등록하고 생성한 레이어를 반환한다.
            _measureLayer 저장과 updateData() 실행은 호출자가 담당한다.

    getGeographicToWorld(geoX: number, geoY: number, height: number) -> WorldPosition
        의존:
            UDrawArg — 지리→월드 좌표; 함수: {getGeographicToWorld()}
        동작:
            this._drawArg.getGeographicToWorld(geoX, geoY, height) 값을 반환한다.

    setRotationOverviewMap(rad: number) -> boolean
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            오버뷰가 없으면 false를 반환하고 있으면 setRotation(rad) 후 true를 반환한다.

    setGeoCenterToOverviewMap(geox: number, geoy: number) -> boolean
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            오버뷰가 없으면 false를 반환하고 있으면 setGeoCenter(geox,geoy,false) 후 true를 반환한다.

    getRotation(bAngle: boolean) -> number | undefined
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
            UMathEngine — 실제 직접 import API; 함수: {UMathEngine.RadiansToDegrees()}
        동작:
            지도 컨트롤 getAzimuthalAngle 멤버가 없으면 undefined를 반환한다.
            현재 방위각 rad를 얻어 bAngle이 없거나 false이면 그대로 반환한다.
            그 외에는 degree로 바꾸고 음수이면 360을 더해 반환한다.

    getRotationPolar(bAngle: boolean) -> number
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
            UMathEngine — 실제 직접 import API; 함수: {UMathEngine.RadiansToDegrees()}
        동작:
            현재 고도각 rad를 얻어 bAngle이 없거나 false이면 그대로 반환한다.
            그 외에는 degree로 바꾸고 음수이면 360을 더해 반환한다.

    zoomIn() -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            _mapControl이 null·undefined이면 반환한다.
            _mapControl이 defined이면 초점 거리를 getZoomFromResolution()으로 환산한다. 계산한 zoom이 _maxZoomLevel 이상이면 반환하고 그 외에는 지도 컨트롤 zoomIn(0.5)를 실행한다.

    zoomOut() -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            _mapControl이 null·undefined이면 반환한다.
            _mapControl이 defined이면 원근에서만 초점 거리를 getZoomFromResolution()으로 환산해 _minZoomLevel 이하를 차단한다. 직교에서는 버튼과 휠이 같은 maxDistance를 사용하며 지도 컨트롤 zoomOut(0.5)를 실행한다.

    setResolution(distance: number) -> void
        의존:
            THREE — 실제 직접 import API; 생성자: {new THREE.Vector3()}
        동작:
            카메라 좌표나 지도 타겟이 없으면 반환한다.
            타겟에서 현재 카메라 방향으로 distance 떨어진 새 위치를 구하고 _resolution을 저장한다.
            카메라 위치를 교체하고 지도 컨트롤 zoomChanged(true).update()를 실행한다.

    getResolution() -> number
        동작:
            this._resolution ?? DEFAULT_RESOLUTION 값을 반환한다.

    getResolutionFromZoom(zoom)
        동작:
            ((UDEF.GoogleCoordWidth * 2) / Math.pow(2, zoom)) 값을 반환한다.

    getZoomFromResolution(resolution)
        동작:
            Math.log2((UDEF.GoogleCoordWidth * 2) / resolution) 값을 반환한다.

    getZoom() -> number
        동작:
            this._zoomLevel 값을 반환한다.

    setZoom(zoom: number) -> void
        동작:
            getResolutionFromZoom(zoom)으로 얻은 거리값을 setResolution()에 전달한다.

    getGeographicToGoogle(geoX: number, geoY: number, height: number = 0) -> GooglePosition
        의존:
            UDrawArg — 지리→Google 좌표; 함수: {getGeographicToGoogle()}
        동작:
            this._drawArg.getGeographicToGoogle(geoX, geoY, height) 값을 반환한다.

    getGoogleToGeographic(googlex: number, googley: number, googlez: number = 0) -> GeoPosition
        의존:
            UDrawArg — Google→지리 좌표; 함수: {getGoogleToGeographic()}
        동작:
            this._drawArg.getGoogleToGeographic(googlex, googley, googlez) 값을 반환한다.

    getRectangle() -> UGeoRect
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            미초기화 또는 드로잉 인자가 없으면 undefined를 반환한다.
            그 외에는 드로잉 인자의 getRectangle() 결과를 반환한다.

    createHeightXYZLayer(opt: U3dHeightXYZLayerCO) -> U3dHeightXYZLayer | null
        의존:
            U3dHeightXYZLayer — 실제 직접 import API; 생성자: {new U3dHeightXYZLayer()}
            U3dLayerList — 같은 이름의 레이어 조회; 함수: {findLayer()}
            __GWarn__ — 실제 직접 import API; 함수: {__GWarn__()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            장면 또는 opt가 null·undefined이면 null을 반환한다.
            같은 이름의 레이어가 있으면 경고하고 null을 반환한다.
            U3dHeightXYZLayer(opt)를 생성·등록하여 반환한다.

    googleResolution(level: number) -> number
        의존:
            UMathEngine — 실제 직접 import API; 함수: {UMathEngine.googleResolution()}
        동작:
            UMathEngine.googleResolution(level) 값을 반환한다.

    traverseTiles(callback: function) -> void
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            쿼드트리가 있으면 traverse(callback)에 위임한다.

    setWireFrameRendering(value)
        의존:
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            self._quadtreeSet이 null·undefined이면 debug일 때 안내하고 false를 반환한다.
            self._quadtreeSet이 defined이면 _wireFrameRendering에 value를 저장하고 쿼드트리에 드로잉 인자와 value를 전달한 뒤 draw()를 실행한다.

    getWireFrameRendering()
        동작:
            this._wireFrameRendering 값을 반환한다.

    isUpdateProcess(name: String) -> boolean
        동작:
            this.getWorking(name) 값을 반환한다.

    getWorking(name: String) -> boolean
        의존:
            U3dLayerList — 단일 이름 조회와 목록; 속성 읽기: {_listmap}
            U3dLayer — 남은 작업량; 함수: {getWorkingCount()}
            defined — 실제 직접 import API; 함수: {defined()}
        동작:
            _layerlist가 defined가 아니면 false를 반환한다.
            _layerlist가 defined인 경우:
                name이 defined인 경우:
                    getLayer(name)으로 조회한 레이어가 defined이고 getWorkingCount()가 0보다 크면 true를 반환한다.
                name이 defined가 아닌 경우:
                    _layerlist._listmap을 순회하며 getWorkingCount()가 0보다 큰 첫 레이어에서 true를 반환한다.
                조회 레이어가 없거나 모든 검사에서 작업 수가 양수가 아니면 false를 반환한다.

    createWorkingEndEvent(name) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dAppEventHandler — 직접 런타임 연계; 함수: {createWorkingEndEvent()}
            U3dLayer — 직접 런타임 연계; 함수: {getVisible(), createWorkingEndEvent()}
        동작:
            이벤트 핸들러가 있으면 createWorkingEndEvent(name)를 호출한다.
            레이어 목록이 있으면 표시 중인 각 레이어에 createWorkingEndEvent()를 호출한다.

    getWorkingCount() -> number
        의존:
            UProcessManager — 작업 수 조회; 함수: {getWorkingCount()}
        동작:
            프로세스 매니저의 getWorkingCount() 결과를 반환하며 매니저가 없거나 결과가 falsy이면 0을 반환한다.

    getWorkingLevel2() -> number
        의존:
            UProcessManager — 작업 수 조회; 함수: {getWorkingLevel2()}
        동작:
            프로세스 매니저의 getWorkingLevel2() 결과를 반환하며 매니저가 없거나 결과가 falsy이면 0을 반환한다.

    getWorkingLevel3() -> number
        의존:
            UProcessManager — 작업 수 조회; 함수: {getWorkingLevel3()}
        동작:
            프로세스 매니저의 getWorkingLevel3() 결과를 반환하며 매니저가 없거나 결과가 falsy이면 0을 반환한다.

    getWorkingImage() -> number
        의존:
            U3dLayer — 직접 런타임 연계; 함수: {getWorkingLevel2()}
        동작:
            모델 레이어 목록의 각 getWorkingLevel2() 결과를 합산해 반환한다.

    getWorkingHeight(name) -> number
        의존:
            U3dLayer — 직접 런타임 연계; 함수: {getWorkingLevel2()}
        동작:
            높이 레이어 목록의 각 getWorkingLevel2() 결과를 합산해 반환하며 name은 사용하지 않는다.

    getWorkingModel() -> number
        의존:
            U3dLayer — 직접 런타임 연계; 함수: {getWorkingLevel3()}
        동작:
            모델 레이어 목록의 각 getWorkingLevel3() 결과를 합산해 반환한다.

    getWorkingInDistance(opt) -> number
        의존:
            U3dLayer — 직접 런타임 연계; 함수: {getWorkingInDistance()}
        동작:
            opt가 falsy이면 {distance:2000}을 적용한다.
            전체 레이어의 getWorkingInDistance(opt) 결과를 합산해 반환한다.

    listenEndWork(callback, param) -> void
        의존:
            Web API — 직접 런타임 연계; 함수: {setTimeout()}
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            500ms 타이머 뒤 모듈 listenEndWork()를 호출한다.
            완료 시 callback이 있으면 앱 this와 param으로 callback.call()을 호출한다.

    keepModelByDistance(tileloadall: boolean, maxDistance?: number) -> Promise<boolean>
        의존:
            deferredPromise — 직접 런타임 연계; 함수: {deferredPromise()}
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            deferredPromise를 만들고 기존 _maxDistanceModel을 보관한다.
            maxDistance가 defined인 경우:
                _maxDistanceModel에 maxDistance를 저장한다.
                기존 거리와 maxDistance가 엄격히 다르면 update()를 호출한다.
            applyAppFromParameter({tileloadall})를 호출하고 완료 콜백에서 deferredPromise를 true로 resolve한다.
            deferredPromise를 반환한다.

    applyAppFromParameter(opt: object, callback?: Function, param?: object) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            갱신 표시 redraw를 false로 시작한다.
            opt.ratiotilesize가 defined인 경우:
                setRatioTileSize(opt.ratiotilesize)를 호출하고 redraw를 true로 설정한다.
            지역 rRatioTileSize_를 undefined로 둔다.
            opt.tileloadall이 defined인 경우:
                그 선택값이 true인 경우:
                    setStopModel(true)로 모델 정지를 설정한다.
                    listenEndWork()에 작업 완료 콜백을 등록한다.
                        callback이 defined이면 완료 콜백의 앱 this와 param으로 callback.call(this,param)을 호출한다.
                그 선택값이 true가 아닌 경우:
                    rRatioTileSize_가 defined이면 setRatioTileSize(rRatioTileSize_)로 복구하나 현재 지역값이 undefined여서 이 복구는 실행되지 않는다.
                    setStopModel(false)로 모델 정지를 해제한다.
                    disposeTileModelAll()로 모델을 모두 지운 뒤 update()를 호출한다.
                    listenEndWork()에 작업 완료 콜백을 등록한다.
                        callback이 defined이면 완료 콜백의 앱 this와 param으로 callback.call(this,param)을 호출한다.
            redraw가 true이면 update()를 호출한다.
            opt.stopmodel이 defined이면 마지막에 setStopModel(opt.stopmodel)을 호출한다.

    disposeTileModelAll() -> void
        의존:
            U3dLayer — 직접 런타임 연계; 함수: {disposeTileModelAll()}
        동작:
            모든 모델 레이어에 disposeTileModelAll()을 호출한다.

    redraw(layername) -> void
        의존:
            __GInfo__ — 직접 런타임 연계; 함수: {__GInfo__()}
        동작:
            U3dLayer.refresh()로 대체되었다는 안내만 출력한다.

    forceOuterDeleteModel(layername, limit = this.getMaxDistanceModel()) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dLayer — 직접 런타임 연계; 함수: {disposeTileFromDistance()}
        동작:
            생략한 limit의 기본값은 getMaxDistanceModel() 결과를 사용한다.
            limit가 defined가 아니면 종료한다.
            limit가 defined인 경우:
                getInstanceModelLayers()로 모델 레이어 배열을 조회한다.
                각 레이어에 disposeTileFromDistance(limit)를 호출한다.
                layername이 defined이고 현재 레이어 객체 자체와 엄격히 같으면 해당 처리 뒤 순회를 중단한다.

    restartQuadTree() -> void
        동작:
            현재 영역·카메라·배경·레이어 표시와 업데이트 민감도를 유지하며 타일 트리를 교체한다.
            초기화 전·앱 해제 후·이미 트리 교체 중인 중복 요청은 실행하지 않는다.
            영역 적용 중 요청은 INTERNAL의 영역 상태에서 종류별로 모은다. 정상 영역 전체 교체가 이전 요청을 소비하고, 표시 변경 콜백의 추가 요청은 영역 확정 전에 한 번 처리한다. 별도 마이크로태스크를 예약하지 않는다.
            영역과 시작 레벨을 검증하고 앱·레이어 연결과 완료 대기를 정리한 뒤 U3dQuadSet.restartQuadTree()에 실제 두 종류 교체를 위임한다. 일반 재시작은 updateData()를 한 번 실행하며 영역 전환은 확정 뒤에 갱신한다. 외부에서 호출하는 영역 전용 재시작 메서드는 제공하지 않는다.
            생성·해제의 단일 실패는 원래 오류를, 복수 실패는 호출 순서대로 담은 errors 배열을 가진 Error로 전달한다. 하위에서 묶어 전달한 오류는 해당 객체로 보존하며 교체 가드는 항상 해제한다. 구 트리 해제 후 실패하면 활성 트리 없이 남을 수 있고 다음 재시작으로 재생성할 수 있다.
            타일 다운로드 완료를 기다리지 않는다.

    restartTerrainQuadTree() -> void
        동작:
            재시작 전용 #rebuildQuadTree 경로에서 앱 연결을 정리하고 U3dQuadSet에 지형·영상 루트 교체를 위임한다.
            모델 루트·프레임·로딩 대기·강제 로딩·분석 작업과 탐색 상한을 유지한다.
            영역 적용 중 요청은 다른 개별 요청과 합치며 정상 영역 전체 재시작이 예약을 소비한다.
            생성 실패 시 모델은 유지하며 다음 호출로 지형을 다시 생성할 수 있다. 정상 완료 후 updateData()를 한 번 실행한다.

    restartModelQuadTree() -> void
        동작:
            재시작 전용 #rebuildQuadTree 경로에서 앱 연결을 정리하고 U3dQuadSet에 모델 루트 교체를 위임한다.
            지형·영상 루트·프레임·고도 캐시·고도 적용 기록을 유지한다.
            모델 루트의 해제 이벤트로 강제 로딩과 분석 대기를 취소한다.
            재진입·예약·갱신 및 실패 뒤 재시도는 지형 개별 재시작과 같은 기준을 적용한다.

    disposeQuadTree() -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dQuadSet — 민감도 보존과 실제 타일 해제; 함수: {getUpdateSensitivity(), disposeQuadTree()}
        동작:
            쿼드 세트가 있으면 getUpdateSensitivity()를 #tileUpdateSensitivity에 보존하고 앱·레이어의 구 트리 참조를 취소 알림 전에 분리한다.
            앱과 레이어의 로딩 완료 예약을 초기화한다. 구 모델 루트의 해제 이벤트가 강제 로딩·마스크 작업을 취소하며, 각 작업은 루트에 등록한 이벤트를 정리한다.
            U3dQuadSet.disposeQuadTree()로 두 종류를 해제한다. 고도 적용 기록은 기존 지형 루트의 이름으로 구분하므로 같은 레벨의 새 타일도 다시 적용하며 해제된 루트 객체를 보관하지 않는다.
            생성은 #createQuadTreeSet, 해제는 #disposeQuadTree, 재시작은 #rebuildQuadTree 전용 경로에서 해당 작업만 수행하고 _quadTreeChanging 하나로 재진입을 차단한다. 해제·재시작의 앱 참조 분리는 #disconnectQuadTree, 새 연결은 #connectQuadTree, 종료 정리와 오류 전달은 #finishQuadTreeOperation이 담당하며 쿼드셋의 해제 상태는 isDisposed()로 조회한다. 한 완료 대기 정리가 실패해도 다른 레이어와 실제 타일 정리를 이어간 뒤 오류를 전달한다.

    disposeTerrainQuadTree() -> void
        동작:
            지형·영상 레이어의 트리 참조와 전체·영상·고도 완료 예약만 분리한다.
            지형 루트와 해당 프레임·가시 상태만 해제하며 모델 루트·프레임·완료 예약을 유지한다.
            마지막 종류를 해제하면 앱의 컨테이너 참조도 분리한다. 대상이 없으면 아무 작업도 하지 않는다.
            공유 워커 풀은 레이어 소유권으로 유지하며 개별 트리 해제에서 dispose하지 않는다.

    disposeModelQuadTree() -> void
        동작:
            모델 레이어의 트리 참조와 전체·모델·거리별 완료 예약만 분리한다.
            모델 루트 해제 이벤트로 작업을 취소하고 지연된 이전 결과를 무시한다. 앱별 탐색 상한은 기존처럼 접근 가능한 일반 속성 _modelMaxLevel에 보관하며 getModelMaxLevel()과 기존 setMaxQuadTreeLevel(level, MODEL)로 조회·변경한다. 미지정 앱은 기존 공개 정적 속성 U3dQuadModelTile.g_maxLevel을 사용한다. 트리가 없어도 모델 설정을 변경할 수 있고 앱별 지정값은 재생성 후에도 유지하며 다른 앱의 지정값에 영향을 주지 않는다. 모델 타일의 기존 상한 메서드는 이 앱 설정으로 위임한다. 마스크 작업 종료 시에는 미지정 여부까지 복원하여 공용 기본값을 계속 따르게 한다. 레이어별 완료 알림의 타일 키는 요청 내부 Set에 수집하여 같은 타일의 마스크 생성과 값 계산을 한 번만 수행한다.
            모델 루트와 해당 프레임만 해제하며 지형과 고도 캐시를 유지한다.
            두 개별 해제는 중첩 실행을 차단한다. 단일 실패는 원래 오류를, 복수 실패는 errors 배열을 가진 Error로 전달하며 하위 오류 묶음도 보존한다. 해제 콜백에서 앱이 종료되면 남은 종류도 정리한다.

    removeLayer(name: string | U3dLayer) -> void
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getLayer(), removeLayer()}
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dMessage — 직접 런타임 연계; 정적 함수: {info()}
            U3dLayer — 직접 런타임 연계; 함수: {getName()}
        동작:
            앱이 dispose 상태이면 종료한다.
            U3dLayer 입력은 직접 사용하고 나머지는 레이어 목록에서 이름으로 찾는다.
            찾지 못하면 안내 후 종료한다.
            레이어 목록 removeLayer(layer.getName())가 성공하고 높이 레이어이면 지형·영상만 재시작한다.

    getLayerList() -> U3dLayerList | undefined
        동작:
            this._layerlist 결과를 반환한다.

    showLayer(name: string, show: boolean = true, deleteCache: boolean = false) -> Promise<{result: string, content: U3dLayer}> | false
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UDEF — 직접 런타임 연계; 정적 함수: {createPromise()}
            U3dLayerList — 직접 런타임 연계; 함수: {show()}
            U3dMessage — 직접 런타임 연계; 정적 함수: {info()}
            U3dLayer — 직접 런타임 연계; 함수: {disposeCache(), once()}
        동작:
            name 또는 쿼드 세트가 없으면 false를 반환한다.
            UDEF.createPromise() 안에서 레이어 목록 show(name,show)를 호출한다.
            결과가 없으면 안내하고 {result:FAIL,content:layer}로 reject한다.
            deleteCache가 true이면 disposeCache()를 호출한다.
            show가 truthy이면 레이어 생성자의 EVENT.LOADED를 한 번 기다려 {result:SUCCESS,content:layer}로 resolve한다.
            숨김은 즉시 같은 성공 객체로 resolve한다.

    showImageLayer(...args: [name: string, show?: boolean, deleteCache?: boolean]) -> Promise<{result: string, content: U3dLayer}> | false
        동작:
            this.showLayer(...args) 결과를 반환한다.

    getLayer(name: string) -> U3dLayer | undefined
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {findLayer()}
        동작:
            this._layerlist.findLayer(name) 결과를 반환한다.

    getLayerByName(name?: string) -> U3dLayer | undefined
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getLayerByName()}
        동작:
            this._layerlist.getLayerByName(name) 결과를 반환한다.

    getLayers() -> Array<U3dLayer>
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getLayers()}
        동작:
            this._layerlist.getLayers() 결과를 반환한다.

    isLoadingHeightLayers() -> boolean
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceHeightLayers()}
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dLayer — 타일 로딩 여부; 함수: {isLoadingTile()}
        동작:
            높이 레이어 목록이 없으면 false를 반환한다.
            isLoadingTile()이 true인 첫 레이어에서 true를 반환하며 없으면 false를 반환한다.

    isLoadingImageLayers() -> boolean
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceImageLayers()}
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dLayer — 타일 로딩 여부; 함수: {isLoadingTile()}
        동작:
            이미지 레이어 목록이 없으면 false를 반환한다.
            isLoadingTile()이 true인 첫 레이어에서 true를 반환하며 없으면 false를 반환한다.

    getInstanceScenesFromAll() -> UScene[]
        의존:
            U3dLayer — 직접 런타임 연계; 함수: {getScene(), getVisible()}
        동작:
            전체 레이어 중 Scene이 truthy이고 표시 중인 레이어의 Scene 배열을 반환한다.

    getInstanceScenesFromVisibleImageLayer() -> UScene | undefined
        의존:
            U3dLayer — 직접 런타임 연계; 함수: {getScene(), getVisible()}
        동작:
            이미지 레이어 중 Scene이 truthy이고 표시 중인 첫 레이어의 Scene 또는 undefined를 반환한다.

    getInstanceScenesFromVisibleImageLayers() -> UScene[]
        의존:
            U3dLayer — 직접 런타임 연계; 함수: {getScene(), getVisible()}
        동작:
            이미지 레이어 중 Scene이 truthy이고 표시 중인 레이어의 Scene 배열을 반환한다.

    getTerrainScene() -> UScene | undefined
        의존:
            U3dLayer — 직접 런타임 연계; 함수: {getScene()}
        동작:
            지형 레이어가 있으면 첫 레이어 getScene() 결과를, 없으면 undefined를 반환한다.

    getInstanceUserLayers()
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceUserLayers()}
        동작:
            this._layerlist.getInstanceUserLayers() 결과를 반환한다.

    getInstanceMeasureLayers()
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceMeasureLayers()}
        동작:
            this._layerlist.getInstanceMeasureLayers() 결과를 반환한다.

    getInstanceMultipleComponentLayers()
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceMultipleComponentLayers()}
        동작:
            this._layerlist.getInstanceMultipleComponentLayers() 결과를 반환한다.

    getInstanceVectorTileLayers()
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceVectorTileLayers()}
        동작:
            this._layerlist.getInstanceVectorTileLayers() 결과를 반환한다.

    getInstanceModelAndTerrainLayers() -> Array<U3dLayer>
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceModelAndTerrainLayers()}
        동작:
            this._layerlist.getInstanceModelAndTerrainLayers() 결과를 반환한다.

    getInstanceTerrainLayers() -> Array<U3dLayer>
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceTerrainLayers()}
        동작:
            this._layerlist.getInstanceTerrainLayers() 결과를 반환한다.

    getInstanceSceneUserLayers() -> Array<UScene>
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceUserLayers()}
            U3dLayer — 직접 런타임 연계; 함수: {getVisible(), getScene()}
        동작:
            레이어 목록의 사용자 레이어 중 표시 중인 레이어의 Scene 배열을 반환한다.

    getInstanceScenesFromModelLayers() -> UScene[]
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceModelLayers(), getInstanceUserLayers()}
            U3dLayer — 직접 런타임 연계; 함수: {getVisible(), getScene()}
            defined — 직접 런타임 연계; 함수: {defined()}
            UAnaly — 직접 런타임 연계; 함수: {getScene()}
        동작:
            표시 중인 모델·사용자 레이어의 Scene을 모은다.
            존재하는 CustomModel,ViewCone,HeightLimit 분석의 Scene을 추가하여 배열을 반환한다.

    getInstanceScenesFromTerrainLayers() -> UScene[]
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceTerrainLayers()}
            U3dLayer — 직접 런타임 연계; 함수: {getScene()}
        동작:
            지형 레이어의 Scene을 가시성 확인 없이 배열에 모아 반환한다.

    getInstanceScenesFromModelAndTerrainLayers() -> UScene[]
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceModelAndTerrainLayers(), getInstanceUserLayers()}
            U3dLayer — 직접 런타임 연계; 함수: {getVisible(), getScene()}
            defined — 직접 런타임 연계; 함수: {defined()}
            UAnaly — 직접 런타임 연계; 함수: {getScene()}
        동작:
            모델·지형 목록 중 _type이 terrain이거나 표시 중인 레이어의 Scene을 모은다.
            표시 중인 사용자 레이어와 존재하는 CustomModel 분석의 Scene을 추가하여 반환한다.

    getInstanceModelLayers() -> Array
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceModelLayers()}
        동작:
            this._layerlist.getInstanceModelLayers() 결과를 반환한다.

    getInstanceModelAndGroupLayers()
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceModelAndGroupLayers()}
        동작:
            this._layerlist.getInstanceModelAndGroupLayers() 결과를 반환한다.

    getInstanceAnimationLayers() -> Array<U3dLayer>
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceAnimationLayers()}
        동작:
            this._layerlist.getInstanceAnimationLayers() 결과를 반환한다.

    getInstanceByClassTypeLayers(classType) -> Array<U3dLayer>
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceByClassType()}
        동작:
            this._layerlist.getInstanceByClassType(classType) 결과를 반환한다.

    getInstanceHeightLayers() -> Array<U3dLayer>
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceHeightLayers()}
        동작:
            this._layerlist.getInstanceHeightLayers() 결과를 반환한다.

    getInstanceImageAndUserLayers()
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceImageAndUserLayers()}
        동작:
            레이어 목록이 없으면 undefined를 반환한다.
            레이어 목록 getInstanceImageAndUserLayers()에 입력을 전달해 반환한다.

    getInstanceImageLayers() -> Array<U3dLayer> | undefined
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceImageLayers()}
        동작:
            레이어 목록이 없으면 undefined를 반환한다.
            레이어 목록 getInstanceImageLayers()에 입력을 전달해 반환한다.

    getImageLayer(layername: string) -> U3dLayer | null
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceImageLayers()}
            U3dLayer — 직접 런타임 연계; 함수: {getName()}
        동작:
            이미지 레이어 중 getName()이 layername과 같은 첫 레이어를 반환하고, 일치하는 레이어가 없으면 null을 반환한다.

    getInstanceClassifiedLayers(opt)
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceClassifiedLayers()}
        동작:
            _layerlist가 defined가 아니면 undefined를 반환한다.
            _layerlist가 defined인 경우:
                _layerlist.getInstanceClassifiedLayers(opt)로 분류 결과 객체를 얻는다.
                getInstanceBaseLayer() 결과를 분류 객체의 baselayer에 저장하고 같은 분류 객체를 반환한다.

    getInstanceLoadingLayers()
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceLoadingLayers()}
        동작:
            레이어 목록이 없으면 undefined를 반환한다.
            레이어 목록 getInstanceLoadingLayers()에 입력을 전달해 반환한다.

    getInstanceTypeLayers(array)
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceTypeLayers()}
        동작:
            레이어 목록이 없으면 undefined를 반환한다.
            레이어 목록 getInstanceTypeLayers()에 입력을 전달해 반환한다.

    getHeightLayer(layername: string) -> U3dLayer | null
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getInstanceHeightLayers()}
            U3dLayer — 직접 런타임 연계; 함수: {getName()}
        동작:
            높이 레이어 중 getName()이 layername과 같은 첫 레이어를 반환하고, 일치하는 레이어가 없으면 null을 반환한다.

    getHeightLayers() -> Array<U3dLayer>
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getHeightLayers()}
        동작:
            this._layerlist.getHeightLayers() 결과를 반환한다.

    getImageLayers() -> Array<U3dLayer>
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getImageLayers()}
        동작:
            인수 없이 전체 이미지 레이어 배열을 반환하고, 등록된 이미지 레이어가 없으면 빈 배열을 반환한다.

    getImageLayerLength() -> number
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getImageLayers()}
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            레이어 목록 getImageLayers()의 결과가 정의되면 length를,없으면 0을 반환한다.

    getHeightLayerLength() -> number
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getHeightLayers()}
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            레이어 목록 getHeightLayers()의 결과가 정의되면 length를,없으면 0을 반환한다.

    getModelLayerLength() -> number
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getModelLayers()}
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            레이어 목록 getModelLayers()의 결과가 정의되면 length를,없으면 0을 반환한다.

    getUserLayers()
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getUserLayers()}
        동작:
            this._layerlist.getUserLayers() 결과를 반환한다.

    getUserLayerLength() -> number
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {getUserLayers()}
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            레이어 목록 getUserLayers()의 결과가 정의되면 length를,없으면 0을 반환한다.

    setLineStringMeasureType() -> void
        동작:
            setMeasureType("LineString")를 호출한다.

    setPolygonMeasureType() -> void
        동작:
            setMeasureType("Polygon")를 호출한다.

    setMeasureType(type) -> false | void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 직접 런타임 연계; 함수: {console.info()}
            U3dShaderMeasureLayer — 직접 런타임 연계; 함수: {setMeasureType()}
        동작:
            측정 레이어가 없으면 안내하고 false를 반환한다.
            측정 레이어 setMeasureType(type)을 호출하며 성공 경로는 반환값이 없다.

    clearMeasure() -> boolean
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 직접 런타임 연계; 함수: {console.info()}
            U3dShaderMeasureLayer — 직접 런타임 연계; 함수: {clearMeasure()}
            U3dBilboard — 직접 런타임 연계; 정적 함수: {removeAll()}
        동작:
            측정 레이어가 없으면 안내하고 false를 반환한다. [확인 Q-103]
            측정 레이어 clearMeasure() 뒤 _scene과 _sceneComment의 billboard를 U3dBilboard.removeAll()로 제거한다.
            성공 경로는 반환값이 없다.

    addMeasurePoint(geo: GeoPosition) -> function
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 직접 런타임 연계; 함수: {console.info()}
            U3dShaderMeasureLayer — 직접 런타임 연계; 함수: {addMeasurePoint()}
        동작:
            측정 레이어가 없으면 안내하고 false를 반환한다. [확인 Q-113]
            측정 레이어 addMeasurePoint()에 입력 인수를 전달하여 반환한다.

    removeMeasureFeature(feature)
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 직접 런타임 연계; 함수: {console.info()}
            U3dShaderMeasureLayer — 직접 런타임 연계; 함수: {removeFeature()}
        동작:
            측정 레이어가 없으면 안내하고 false를 반환한다.
            측정 레이어 removeFeature()에 입력 인수를 전달하여 반환한다.

    commitMeasurePoint()
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 직접 런타임 연계; 함수: {console.info()}
            U3dShaderMeasureLayer — 직접 런타임 연계; 함수: {commitFeature()}
        동작:
            측정 레이어가 없으면 안내하고 false를 반환한다.
            측정 레이어 commitFeature()에 입력 인수를 전달하여 반환한다.

    getTextPositionToMeasureArea()
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 직접 런타임 연계; 함수: {console.info()}
            U3dShaderMeasureLayer — 직접 런타임 연계; 함수: {getTextPositionToMeasureArea()}
        동작:
            측정 레이어가 없으면 안내하고 undefined를 반환한다.
            측정 레이어 getTextPositionToMeasureArea()에 입력 인수를 전달하여 반환한다.

    getMeasureArea()
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 직접 런타임 연계; 함수: {console.info()}
            U3dShaderMeasureLayer — 직접 런타임 연계; 함수: {getMeasureArea()}
        동작:
            측정 레이어가 없으면 안내하고 undefined를 반환한다.
            측정 레이어 getMeasureArea()에 입력 인수를 전달하여 반환한다.

    getMeasureLength()
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 직접 런타임 연계; 함수: {console.info()}
            U3dShaderMeasureLayer — 직접 런타임 연계; 함수: {getMeasureLength()}
        동작:
            측정 레이어가 없으면 안내하고 undefined를 반환한다.
            측정 레이어 getMeasureLength()에 입력 인수를 전달하여 반환한다.

    getMeasureExtent()
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 직접 런타임 연계; 함수: {console.info()}
            U3dShaderMeasureLayer — 직접 런타임 연계; 함수: {getMeasureExtent()}
        동작:
            측정 레이어가 없으면 안내하고 undefined를 반환한다.
            측정 레이어 getMeasureExtent()에 직접 위임하며 현재 의존 구현도 본문이 비어 undefined를 반환한다.

    createGroupLayer(opt: U3dModelGroupLayerCO) -> U3dGroupLayer | null
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 직접 런타임 연계; 함수: {console.info()}
            U3dLayerList — 직접 런타임 연계; 함수: {getLayer()}
            U3dMessage — 직접 런타임 연계; 정적 함수: {error()}
            U3dGroupLayer — 직접 런타임 연계; 생성자: {new U3dGroupLayer()}
        동작:
            옵션이 없거나 이름이 중복되면 null을 반환한다.
            원본 opt에 app=this,drawarg=this._drawArg를 저장한다.
            U3dGroupLayer를 생성해 addLayer()에 전달하고 생성한 객체를 반환한다.

    createGridTileLayer(opt: U3dGridTileLayerCO) -> U3dGridTileLayer | null
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 직접 런타임 연계; 함수: {console.info()}
            U3dLayerList — 직접 런타임 연계; 함수: {getLayer()}
            U3dMessage — 직접 런타임 연계; 정적 함수: {error()}
            U3dGridTileLayer — 직접 런타임 연계; 생성자: {new U3dGridTileLayer()}
        동작:
            옵션이 없거나 이름이 중복되면 null을 반환한다.
            원본 opt에 app=this,drawarg=this._drawArg를 저장한다.
            U3dGridTileLayer를 생성해 addLayer()에 전달하고 생성한 객체를 반환한다.

    create3DFModelLayer(opt: U3d3DFModelLayerCO) -> U3dModelU3FLayer | null
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dMessage — 직접 런타임 연계; 정적 함수: {info(), error()}
            U3dLayerList — 직접 런타임 연계; 함수: {getLayer()}
            U3dModelU3FLayer — 직접 런타임 연계; 생성자: {new U3dModelU3FLayer()}
        동작:
            옵션이 없거나 이름이 중복되면 null을 반환한다.
            U3dModelU3FLayer를 생성해 addLayer()에 전달하고 생성한 객체를 반환한다.

    createMultipleComponentLayer(opt: U3dMultipleComponentLayerCO) -> U3dMultipleComponentLayer | null
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            __GInfo__ — 직접 런타임 연계; 함수: {__GInfo__()}
            U3dLayerList — 이름 중복 검사; 함수: {getLayer()}
            U3dMessage — 중복 이름 안내; 정적 함수: {error()}
            U3dMultipleComponentLayer — 직접 런타임 연계; 생성자: {new U3dMultipleComponentLayer()}
        동작:
            옵션이 없으면 안내하고 null을 반환한다.
            같은 이름의 레이어가 있으면 오류를 안내하고 null을 반환한다.
            U3dMultipleComponentLayer(opt)를 생성해 addLayer()에 전달하고 생성한 객체를 반환한다.

    createBIMObjModelLayer(opt: U3dModelBIMObjLayerCO) -> U3dModelBIMObjLayer | null
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 직접 런타임 연계; 함수: {console.info()}
            U3dLayerList — 이름 중복 검사; 함수: {getLayer()}
            U3dMessage — 중복 이름 안내; 정적 함수: {error()}
            U3dModelBIMObjLayer — 직접 런타임 연계; 생성자: {new U3dModelBIMObjLayer()}
        동작:
            옵션이 없으면 안내하고 null을 반환한다.
            같은 이름의 레이어가 있으면 오류를 안내하고 null을 반환한다.
            U3dModelBIMObjLayer를 생성한다.
            결과의 _classtype이 U3dModelBIMObjLayer가 아니면 null을 반환한다.
            addLayer() 결과가 falsy이면 null을 반환하고, truthy이면 생성한 레이어를 반환한다.

    createTdsModelLayer(option: U3dTdsModelLayerCO) -> U3dModelTdsLayer | null
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 직접 런타임 연계; 함수: {console.info()}
            U3dLayerList — 직접 런타임 연계; 함수: {getLayer()}
            U3dModelTdsLayer — 직접 런타임 연계; 생성자: {new U3dModelTdsLayer()}
        동작:
            옵션이 없거나 이름이 중복되면 null을 반환한다.
            U3dModelTdsLayer를 생성해 addLayer()에 전달하고 생성한 객체를 반환한다.

    createXYZImageLayer(opt: U3dImageXYZLayerCO) -> U3dImageXYZLayer | null
        동작:
            createImageLayer(opt) 결과를 반환한다.

    createImageLayer(opt: U3dImageXYZLayerCO) -> U3dImageXYZLayer | null
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dLayerList — 직접 런타임 연계; 함수: {getLayer()}
            U3dMessage — 직접 런타임 연계; 정적 함수: {error()}
            U3dImageXYZLayer — 직접 런타임 연계; 생성자: {new U3dImageXYZLayer()}
        동작:
            opt가 defined가 아니면 null을 반환한다.
            opt가 defined인 경우:
                _layerlist에서 opt.name의 레이어가 조회되면 오류를 안내하고 null을 반환한다.
                같은 이름의 레이어가 없으면 U3dImageXYZLayer(opt)를 생성한다.
                생성한 layer가 defined이면 addLayer(layer)를 호출한다.
                생성 결과 layer를 반환한다.

    createWMSImageLayer(opt: U3dWMSImageLayerCO) -> U3dImageWMSLayer | null
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dLayerList — 직접 런타임 연계; 함수: {getLayer()}
            U3dMessage — 직접 런타임 연계; 정적 함수: {error()}
            U3dImageWMSLayer — 직접 런타임 연계; 생성자: {new U3dImageWMSLayer()}
        동작:
            opt가 defined가 아니면 null을 반환한다.
            opt가 defined인 경우:
                _layerlist에서 opt.name의 레이어가 조회되면 오류를 안내하고 null을 반환한다.
                같은 이름의 레이어가 없으면 입력 opt 자체를 보정한다.
                    opt.layernames가 defined이면 opt.layername을 opt.layernames로 덮어쓴다.
                    opt.url이 defined이면 opt.baseurl을 opt.url로 덮어쓴다.
                    opt.transparent를 true로 설정한다.
                보정한 opt로 U3dImageWMSLayer를 생성한다.
                생성한 layer가 defined이면 addLayer(layer)를 호출한다.
                생성 결과 layer를 반환한다.

    createWFSModelLayer(opt: U3dWFSModelLayerCO) -> U3dModelWFSLayer | null
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dLayerList(_layerlist) — 직접 런타임 연계; 함수: {getLayer()}
            U3dMessage — 직접 런타임 연계; 정적 함수: {error()}
            U3dModelWFSLayer — 직접 런타임 연계; 생성자: {new U3dModelWFSLayer()}
        동작:
            opt가 defined가 아니면 null을 반환한다.
            opt가 defined인 경우:
                _layerlist에서 opt.name의 기존 레이어가 조회되는 경우:
                    오류를 안내하고 null을 반환하여 생성을 종료한다.
                같은 이름의 레이어가 없으면 입력 opt 자체를 보정한다.
                    opt.layernames가 defined이면 opt.layername을 opt.layernames로 덮어쓴다.
                    opt.url이 defined이면 opt.baseurl을 opt.url로 덮어쓴다.
                    opt.transparent를 true로 설정한다.
                보정한 opt로 U3dModelWFSLayer를 생성한다.
                생성한 layer를 addLayer(layer)에 전달한다.
                생성 결과 layer를 반환한다.

    container() -> HTMLElement
        동작:
            this._container 결과를 반환한다.

    createEventHandler(container: object, app: U3dApp) -> object
        의존:
            U3dAppEventHandler — 직접 런타임 연계; 생성자: {new U3dAppEventHandler()}
        동작:
            U3dAppEventHandler(container,app)를 생성해 _eventHandler에 저장하고 반환한다.

    getToneMappingExposure() -> number
        동작:
            this._toneExposure 결과를 반환한다.

    getDefaultToneMappingExposure() -> number
        의존:
            UDEF — 기본 톤 매핑 노출; 상수: {TONEMAPPING_EXPOSURE}
        동작:
            UDEF.TONEMAPPING_EXPOSURE 결과를 반환한다.

    setToneMappingExposure(exposure: number) -> void
        의존:
            URenderer — 노출 반영; 속성 쓰기: {toneMappingExposure}
        동작:
            _toneExposure와 렌더러 toneMappingExposure에 exposure를 저장한다.

    getRenderer() -> URenderer
        동작:
            this._renderer 결과를 반환한다.

    createSpreadObject(opt)
        의존:
            UParticleEngine — 직접 런타임 연계; 생성자: {new UParticleEngine()}
            UParticleEngine — 직접 런타임 연계; 함수: {setValues(), initialize()}
        동작:
            UParticleEngine(this)에 setValues(opt) 뒤 initialize()를 호출한다.
            결과를 _particles에 저장하고 반환한다.

    createWindFlow(opt)
        의존:
            UParticleEngine — 직접 런타임 연계; 생성자: {new UParticleEngine()}
            defined — 직접 런타임 연계; 함수: {defined()}
            UParticleEngine — 직접 런타임 연계; 함수: {setWindValues(), initializeWind()}
        동작:
            UParticleEngine(this)에 opt.windData와 opt.extents로 setWindValues()를 호출한다.
            로컬 height는 10으로 설정하며 initializeWind(opt.segments,height) 결과를 _particles에 저장하고 반환한다.

    get3DLibrary() -> THREE
        동작:
            this._THREE 결과를 반환한다.

    createAnalysis() -> void
        의존:
            globalThis.GeOnDT.analysis — 직접 런타임 연계; 생성자: {본문의 type별 UAnaly 생성자}
        동작:
            globalThis.GeOnDT.analysis의 Area,Distance,Height,Contour,LandScape,SurfaceVolume,Slope,GizmoModel,AlignModel,MultipleComponent,Road,CustomModel,SlopeAspect,CustomLand,Route,AverageHeight,HeightLimit,ViewCone,Clipping,Alarm,Depth,Section,Particle,Sun,PhysicalFlow,SkyLine에 대응하는 UAnaly 생성자를 순서대로 생성하여 addAnalysis()에 전달한다.
            UAnalySlopeAspect에는 {app:this}를 전달한다.

    createAnalysisByTypeAndName(type, name) -> void|undefined|*
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 직접 런타임 연계; 함수: {console.info(), console.error()}
            UDEF — 직접 런타임 연계; 정적 함수: {assert()}
            globalThis.GeOnDT.analysis — 직접 런타임 연계; 생성자: {본문의 type별 UAnaly 생성자}
        동작:
            type 또는 name이 없으면 안내하고 undefined를 반환한다.
            이름이 중복되면 초기화 전 analy.name을 참조해 오류 메시지를 만들려고 한다. [확인 Q-101]
            type에 대응하는 globalThis.GeOnDT.analysis 생성자에 {name}을 전달한다.
            지원 타입은 Area,Distance,Height,Contour,LandScape,SurfaceVolume,Slope,GizmoModel,AlignModel,multipleComponent,Road,CustomModel,SlopeAspect,CustomLand,Route,AverageHeight,HeightLimit,ViewCone,Clipping,Alarm,Depth,Section,Particle,SunAmount,PhysicalFlow,SkyLine이다.
            Height 분기는 break가 없어 생성된 UAnalyHeight를 UAnalyContour로 대체한다. [확인 Q-111]
            미지원 타입은 오류를 출력하고 undefined로 종료한다.
            생성 결과를 assert하고 addAnalysis()에 등록한 뒤 반환한다.

    addAnalysis(analy: UAnaly)
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 직접 런타임 연계; 함수: {console.error()}
            UAnaly — 직접 런타임 연계; 함수: {setApp()}
        동작:
            같은 analy.name이 있으면 콘솔 오류 후 종료한다.
            analy.setApp(this) 뒤 _analysisList에 추가한다.

    addSelect(select: U3dSelect) -> void
        의존:
            U3dSelect — 직접 런타임 연계; 함수: {setApp()}
        동작:
            select.setApp(this)를 호출한다.

    removeSelect(select: U3dSelect) -> void
        의존:
            U3dSelect — 직접 런타임 연계; 함수: {remove()}
        동작:
            select.remove()를 호출한다.

    removeAnalysis(name: string)
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 직접 런타임 연계; 함수: {console.error()}
            UAnaly — 직접 런타임 연계; 함수: {deactive(), clear()}
        동작:
            name으로 분석을 찾고 없으면 콘솔 오류 후 종료한다.
            분석 deactive(),clear() 뒤 _analysisList에서 객체를 제거한다.

    getAnalysis(name: TAnalysisName) -> (TAnalysisName extends keyof U3dAnalysisTypeMap ? U3dAnalysisTypeMap[TAnalysisName] : UAnaly) | undefined
        동작:
            name이 문자열이면 _analysisList에서 analy.name이 같은 첫 객체를 찾는다.
            문자열이 아니면 입력 객체의 indexOf()로 소속을 찾는다.
            찾은 객체 또는 undefined를 반환한다.

    activeAnalysis(name: TAnalysisName) -> (TAnalysisName extends keyof U3dAnalysisTypeMap ? U3dAnalysisTypeMap[TAnalysisName] : UAnaly) | undefined
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UAnaly — 직접 런타임 연계; 함수: {active()}
        동작:
            분석이 없으면 undefined로 종료하고 있으면 active() 뒤 분석 객체를 반환한다.

    deactiveAnalysis(name: string) -> UAnaly | undefined
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UAnaly — 직접 런타임 연계; 함수: {deactive()}
        동작:
            분석이 없으면 undefined로 종료하고 있으면 deactive() 뒤 분석 객체를 반환한다.

    clearAnalysis(name: string) -> UAnaly | undefined
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UAnaly — 직접 런타임 연계; 함수: {clear()}
        동작:
            분석이 없으면 undefined로 종료하고 있으면 clear() 뒤 분석 객체를 반환한다.

    deactiveAllAnalysis() -> void
        동작:
            _analysisList 각 분석 객체의 deactive()를 호출한다.

    clearAllAnalysis() -> void
        동작:
            _analysisList 각 분석 객체의 clear()를 호출한다.

    createCamera(near, far, fov) -> UCamera
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UOrthographicCamera — 직접 런타임 연계; 생성자: {new UOrthographicCamera()}
            UCamera — 직접 런타임 연계; 생성자: {new UCamera()}
            THREE — 직접 런타임 연계; 정적 함수: {new THREE.Vector3()}
            UDrawArg — 직접 런타임 연계; 함수: {setCamera()}
        동작:
            컨테이너 clientWidth/clientHeight로 aspect를 계산하며 undefined 또는 NaN이면 1을 적용한다. [확인 Q-104]
            _cameraType이 orthographic이면 양수 homePosition.z 또는 1000과 fov 또는 50으로 반폭·반높이를 계산해 UOrthographicCamera를 생성한다.
            그 외에는 fov,aspect,near,far,drawarg로 UCamera를 생성한다.
            카메라 up을 (0,0,1)로 설정하고 drawArg.setCamera()에 연결한다.
            _collapse가 없으면 createCollapse()를 호출하고 카메라를 반환한다.

    setCameraType(type: 'perspective' | 'orthographic') -> UCamera | UOrthographicCamera | undefined
        의존:
            THREE — 직접 런타임 연계; 정적 함수: {MathUtils.degToRad()}
            UCamera — 직접 런타임 연계; 함수: {position.clone(), quaternion.clone(), up.set(), position.copy(), quaternion.copy(), updateMatrixWorld(), updateAutoClip()}
            UMapControls — 직접 런타임 연계; 함수: {target.clone()}
            UOrthographicCamera — 직접 런타임 연계; 생성자: {new UOrthographicCamera()}
            UCamera — 직접 런타임 연계; 생성자: {new UCamera()}
            UDrawArg — 직접 런타임 연계; 함수: {setCamera()}
        동작:
            카메라 또는 컨트롤이 없으면 기존 카메라를 반환한다.
            type===orthographic의 결과가 기존 isOrthographicCamera와 같으면 기존 카메라를 반환한다.
            회전·target·실제 화각·컨테이너 aspect를 보존한다. 원근 배율과 직교 화면 높이를 반영한 동등 거리로 투영을 교체한다.
            직교 전환은 거리와 FOV에 맞는 시야의 UOrthographicCamera를 생성한다.
            원근 전환은 UCamera를 만들고 기존 직교 시야 높이/zoom에 맞는 카메라 거리를 target로부터 재배치한다.
            up,위치,회전과 행렬을 설정하고 _camera,_cameraType,drawArg 카메라,control.object와 존재하는 collapse 카메라를 교체한다.
            프러스텀 type을 바꾸고 _tc_o를 null로 초기화한다.
            직교 카메라 updateAutoClip()이 있으면 호출하고 resize() 뒤 새 카메라를 반환한다.

    getCameraType() -> 'perspective' | 'orthographic'
        동작:
            this._cameraType 결과를 반환한다.

    setCameraFitKorea(camera: UCamera) -> void
        의존:
            UCamera — 직접 런타임 연계; 함수: {position.copy(), updateMatrixWorld()}
        동작:
            (126.995168,37.5696041,1000)을 월드로 변환해 입력 카메라 위치에 복사한다.
            행렬을 갱신하고 컨트롤 target의 x,y를 카메라 x,y에 맞춘다.

    getCameraState() -> UCameraState
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UMapControls — 직접 런타임 연계; 함수: {getAzimuthalAngle(), getPolarAngle()}
            UCameraState — 직접 런타임 연계; 생성자: {new UCameraState()}
        동작:
            카메라 위치와 타겟을 위경도로 조회하며 하나라도 없으면 Error를 던진다.
            resolution,방위각·고도각,homePosition 배열,GEOGRAPHIC 타입,해발고도와 app으로 UCameraState를 생성하여 반환한다.

    saveCameraState() -> UCameraState | UCameraStateJSON | undefined
        의존:
            __GInfo__ — 직접 런타임 연계; 함수: {__GInfo__()}
        동작:
            getCameraStateFromWorld()를 setSavedCameraState()에 저장한다.
            저장 안내 뒤 getSavedCameraState()를 반환한다.

    loadCameraState(info?: UCameraState | UCameraStateJSON, duration?: number) -> undefined | Promise<boolean>
        의존:
            UCameraState — 직접 런타임 연계; 생성자: {new UCameraState()}
            __GInfo__ — 직접 런타임 연계; 함수: {__GInfo__()}
            THREE — 직접 런타임 연계; 정적 함수: {new THREE.Vector3()}
        동작:
            info가 falsy이면 저장된 상태를 사용한다.
            평문 상태 객체는 원본 option.app이 falsy이면 this를 넣고 UCameraState로 생성한다.
            getPosition(),getPositionTarget() 조회 예외는 형식 오류 안내 후 undefined로 종료한다.
            위치나 타겟이 없으면 부재 안내 후 undefined로 종료한다.
            2D 모드이면 기존 카메라·타겟 거리를 타겟 위 수직 높이로 바꾼 새 위치를 만든다.
            flyToPosition(position,target,duration) 결과를 반환한다.

    getCameraStateFromWorld() -> UCameraState
        의존:
            UMapControls — 직접 런타임 연계; 함수: {getAzimuthalAngle(), getPolarAngle()}
            UCameraState — 직접 런타임 연계; 생성자: {new UCameraState()}
        동작:
            resolution,월드 카메라 위치·타겟,컨트롤 방위각·고도각을 조회한다.
            camera,center,homePosition 배열,WORLD 타입,app으로 UCameraState를 생성하여 반환한다.

    getCameraPosition() -> WorldPositionVector3
        의존:
            UDrawArg — 직접 런타임 연계; 함수: {getCameraPosition()}
        동작:
            this._drawArg.getCameraPosition() 결과를 반환한다.

    getCameraTargetPosition() -> WorldPosition
        의존:
            UMapControls — 직접 런타임 연계; 함수: {target.clone()}
        동작:
            컨트롤 target의 복제본을 반환한다.

    getCameraGeographicPosition() -> GeoPosition | null
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            drawArg가 없으면 null을 반환한다.
            카메라 위치가 있으면 x,y,z를 drawArg.getWorldToGeographic()에 전달한다.
            정의된 변환 결과 또는 null을 반환한다.

    getCameraRelativeHeight() -> number
        의존:
            UDrawArg — 직접 런타임 연계; 함수: {getRenderHeightAtPoint()}
            UMathEngine — 직접 런타임 연계; 정적 함수: {getRealScaleAtGoogle()}
        동작:
            카메라 x,y의 렌더 지면 높이를 drawArg에서 구한다.
            카메라 z에서 지면 높이를 빼고 y좌표의 실제 스케일을 곱해 미터 높이를 반환한다.

    getCameraHeight() -> number
        의존:
            UMathEngine — 직접 런타임 연계; 정적 함수: {getRealScaleAtGoogle()}
        동작:
            카메라 position.z에 y좌표 실제 스케일을 곱해 해발 미터 높이를 반환한다.

    getCameraGeographicTargetPoint() -> GeoPosition | null
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            컨트롤 target 또는 drawArg가 없으면 null을 반환한다.
            target 복제본의 vector3ToGeoGraphic() 결과가 정의되면 반환하고 없으면 null을 반환한다.
            복제·변환 예외는 호출자에게 전달한다.

    getCameraTargetPoint() -> WorldPosition
        의존:
            UMapControls — 직접 런타임 연계; 함수: {target.clone()}
        동작:
            컨트롤 target의 복제본을 반환한다.

    setCameraGeographicPosition(geoX: number, geoY: number, Z: number, leftRotate?: Degree, downRotate?: Degree, targetZ?: number, durationTime?: number) -> Promise<boolean>
        의존:
            UMathEngine — 직접 런타임 연계; 정적 함수: {getGeographicToGoogle()}
        동작:
            geoX,geoY,Z와 회전각을 Number로 변환한다.
            경도·위도·높이 중 NaN이 있으면 new Promise.resolve(false)를 실행하려고 한다. [확인 Q-102]
            회전각의 NaN은 0으로 대체한다.
            UMathEngine.getGeographicToGoogle()로 변환한 x,y와 원본 Z,회전각,targetZ,durationTime을 setCameraGooglePosition()에 전달하여 반환한다. [확인 Q-112]

    setCameraGooglePosition(googleX: number, googleY: number, Z: number, leftRotate?: Degree, downRotate?: Degree, targetZ?: number, durationTime?: number) -> Promise<boolean>
        동작:
            this.setCameraPosition(googleX, googleY, Z, leftRotate, downRotate, targetZ, durationTime) 결과를 반환한다. [확인 Q-112]

    setCameraWorldPosition(opt: object) -> Promise<boolean> | undefined
        의존:
            U3dMessage — 직접 런타임 연계; 정적 함수: {info()}
        동작:
            falsy opt에는 빈 객체를 적용한다. [확인 Q-112]
            rectangle.contain(opt.x,opt.y)가 false이면 범위 밖 안내 후 undefined로 종료한다.
            opt의 x,y,z,rotateX,rotateY로 setCameraPosition()을 호출하여 반환한다.

    setCameraTargetZeroZ() -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            카메라가 있으면 컨트롤 target.z=0으로 설정한다.

    setCameraTargetZ() -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UMapControls — 직접 런타임 연계; 함수: {getAzimuthalAngle(), getPolarAngle(), rotateLeftDegree(), rotateDownDegree(), update()}
            THREE — 직접 런타임 연계; 정적 함수: {MathUtils.radToDeg()}
        동작:
            카메라가 있으면 컨트롤의 기존 방위각·고도각을 degree로 구한다.
            target.z=camera.position.z-0.1로 저장한 뒤 기존 각도를 rotateLeftDegree(),rotateDownDegree()에 적용하고 update()한다.

    setCameraTarget(position: object, positionType: string = UDEF.POINT_TYPE.GEOGRAPHIC, distance?: number) -> Promise<boolean> | undefined
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            deferredPromise — 직접 런타임 연계; 함수: {deferredPromise()}
            THREE — 직접 런타임 연계; 정적 함수: {new THREE.Vector3()}
            UMapControls — 직접 런타임 연계; 함수: {target.copy(), update()}
            UCamera — 직접 런타임 연계; 함수: {position.addVectors()}
            Web API — 직접 런타임 연계; 함수: {setTimeout()}
            __GError__ — 직접 런타임 연계; 함수: {__GError__()}
        동작:
            position이 defined가 아니면 undefined로 종료한다.
            position이 defined인 경우:
                deferredPromise를 만든다.
                positionType이 GEOGRAPHIC이면 getGeographicToWorld(position.x,position.y,position.z)로 target을 구한다.
                그 외 positionType이면 입력 x,y,z의 Vector3로 target을 만든다.
                try 안에서 기존 target 방향의 수평 길이를 보존한 새 방향을 계산한다.
                새 방향의 z를 -camera.position.z로 설정한 뒤 카메라 위치를 더하여 새 타겟의 z를 0으로 만든다.
                계산한 target과 새 타겟의 x,y 차이만큼 카메라 x,y와 컨트롤 target을 함께 옮긴다.
                distance가 truthy이면 카메라와 컨트롤 target의 거리를 distance로 조정한다.
                컨트롤 update()를 호출한 뒤 0.1ms 타이머에서 changeUpdate()를 호출하고 deferredPromise를 true로 resolve한다.
                try 처리 중 예외가 발생하면 오류를 안내하고 deferredPromise를 false로 reject한다.
                deferredPromise를 반환한다.

    setCameraPosition(x: number, y: number, z: number, leftrotate?: Degree, downrotate?: Degree, targetZ?: number, durationTime?: number) -> Promise<void>
        의존:
            deferredPromise — 직접 런타임 연계; 함수: {deferredPromise()}
            defined — 직접 런타임 연계; 함수: {defined()}
            THREE — 직접 런타임 연계; 정적 함수: {MathUtils.clamp(), new THREE.Vector3(), MathUtils.degToRad()}
            UMapControls — 직접 런타임 연계; 함수: {flyTo()}
            __GSError__ — 직접 런타임 연계; 함수: {__GSError__()}
            U3dObject — 상속된 기반 객체·이벤트 API; 함수: {once()}
        동작:
            nullish 입력에 leftrotate=0,downrotate=60,targetZ=100,durationTime=100을 적용한다.
            deferredPromise를 만들고 stopFly(),#cancelViewAngleChange()를 호출한다.
            카메라 또는 컨트롤이 없으면 reject 결과를 반환한다.
            downrotate를 0.1~179.9로 제한하고 targetZ=0이면 100으로 대체한다.
            x,y,z 타겟과 방위각·고도각 방향 벡터를 만들어 targetZ 거리의 카메라 위치를 계산한다.
            _isTwenning=true로 설정하고 컨트롤 flyTo()에 완료·중지 콜백을 전달한다.
            완료 콜백은 _isTwenning=false와 changeUpdate() 뒤 앱 EVENT.LOADED를 한 번 기다려 void로 resolve한다.
            중지 콜백은 _isTwenning=false 뒤 즉시 void로 resolve한다.
            예외는 __GSError__로 보고하고 오류로 reject하며 deferredPromise를 반환한다.

    setCameraPositionDirect(x, y, z, leftrotate, downrotate) -> boolean
        의존:
            __GError__ — 비동기 이동 실패 기록; 함수: {__GError__()}
        동작:
            setCameraGeographicPosition()을 durationTime=0으로 호출하며 Promise를 기다리지 않는다.
            이동 Promise의 비동기 실패는 __GError__로 기록하여 처리한다.
            동기 예외가 없으면 true,있으면 false를 반환한다.

    makeAnimationController(opt: Partial<UAnimationControllerCO> = {}) -> UAnimationController|undefined
        의존:
            UAnimationController — 직접 런타임 연계; 생성자: {new UAnimationController()}
            __GError__ — 직접 런타임 연계; 함수: {__GError__()}
        동작:
            기본 drawArg를 opt와 Object.assign()으로 합쳐 UAnimationController를 생성해 반환한다.
            오류는 안내하고 undefined로 종료한다.

    createCharacterControls(opt) -> UCharacterControls
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UMapControls — 직접 런타임 연계; 함수: {dispose()}
            defaultValue — 직접 런타임 연계; 함수: {defaultValue()}
            UCharacterControls — 직접 런타임 연계; 생성자: {new UCharacterControls()}
            UScene — 직접 런타임 연계; 함수: {add()}
        동작:
            기존 지도 컨트롤이 있으면 dispose()한다.
            camera,domElement,pos,minHeight를 입력 또는 앱 값으로 채우고 미정 minHeight는 원본 opt에 0으로 저장한다.
            원본 opt.pos,opt.dir로 flyToPosition()을 호출한 뒤 정규화 옵션을 원본 opt에 합친다.
            UCharacterControls를 만들고 기존 지도 컨트롤을 비활성화하여 _orimapControl에 연결하며 _curControl에 저장한다.
            target=domElement 설정,lock() 뒤 컨트롤 객체를 Scene에 추가하고 반환한다.

    createPointerLockControls(camera, renderer, pos, dir, minHeight) -> UPointerLockControls
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UMapControls — 직접 런타임 연계; 함수: {dispose()}
            UPointerLockControls — 직접 런타임 연계; 생성자: {new UPointerLockControls()}
            UScene — 직접 런타임 연계; 함수: {add()}
        동작:
            기존 지도 컨트롤이 있으면 dispose()한다.
            미정 minHeight=0을 적용하고 flyToPosition(pos,dir)을 호출한다.
            camera,renderer DOM,drawArg,pos,minHeight로 UPointerLockControls를 생성한다.
            기존 컨트롤을 _orimapControl에 연결하고 target=renderer 설정,lock() 뒤 getObject()를 Scene에 추가하여 반환한다.

    createPointerLockDriveControls(camera, renderer, pos, dir, speed, minHeight, viewType, mirrorStat) -> UPointerLockDriveControls | undefined
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            THREE — 직접 런타임 연계; 정적 함수: {new THREE.Vector3()}
            UPointerLockDriveControls — 직접 런타임 연계; 생성자: {new UPointerLockDriveControls()}
            UScene — 직접 런타임 연계; 함수: {add()}
            Web API — 직접 런타임 연계; 함수: {console.log()}
        동작:
            minHeight가 defined가 아니면 0을 적용한다.
            pos가 defined가 아니면 undefined로 종료한다.
            pos가 defined인 경우:
                speed가 defined가 아니면 100을, viewType이 defined가 아니면 FrontView를 적용한다.
                mirrorStat이 defined가 아니면 left,right,back을 모두 false로 설정한다.
                start를 pos로 만들고 dir가 defined가 아니면 end를 pos로, 그 외에는 dir로 만든다.
                try 안에서 flyToPosition(start,end)을 호출한다.
                camera,renderer,drawArg,pos,minHeight,speed,viewType,mirrorStat,app의 옵션으로 UPointerLockDriveControls를 생성한다.
                _mapControl이 defined이면 기존 지도 컨트롤을 생성 컨트롤의 _orimapControl에 연결한다.
                생성 컨트롤의 target을 renderer로 설정하고 lock() 후 getObject()를 Scene에 추가한다.
                try 처리 중 예외는 콘솔에 기록하며 생성된 컨트롤 또는 undefined를 반환한다.

    createPointerLockFlyControls(option: object = {}) -> UPointLockFlyControls
        의존:
            UPointLockFlyControls — 직접 런타임 연계; 생성자: {new UPointLockFlyControls()}
        동작:
            원본 option.camera,option.renderer가 falsy이면 앱 값으로 저장한다.
            camera,app,renderer.domElement,component와 속도·가속·roll·이동·회전·계기 DOM·고도 제한 옵션을 UPointLockFlyControls에 전달한다.
            lock() 뒤 _freeFlyControl에 저장하고 반환한다.

    getFreeFlyControl() -> UPointLockFlyControls
        동작:
            this._freeFlyControl 결과를 반환한다.

    async createUOrbitAndPanControls(opt) -> Promise<UOrbitAndPanControls | undefined>
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            THREE — 직접 런타임 연계; 정적 함수: {new THREE.Vector3()}
            defaultValue — 직접 런타임 연계; 함수: {defaultValue()}
            UOrbitAndPanControls — 직접 런타임 연계; 생성자: {new UOrbitAndPanControls()}
            Web API — 직접 런타임 연계; 함수: {console.log()}
        동작:
            opt.minHeight가 defined가 아니면 원본 opt.minHeight에 0을 설정한다.
            opt.pos가 defined가 아니면 undefined로 종료한다.
            opt.pos가 defined인 경우:
                opt.mirrorStat이 defined가 아니면 원본 opt.mirrorStat에 세 방향 false를 설정한다.
                start를 opt.pos로 만들고 opt.dir가 defined가 아니면 end를 opt.pos로, 그 외에는 opt.dir로 만든다.
                try 안에서 flyToPosition(start,end)의 완료를 await한다.
                defaultValue로 camera와 domElement의 앱 기본값, drawArg, pos, minHeight, speed=100, mirrorStat, app을 채울 옵션을 만든다.
                pos 기본값 인수 평가에 getCameraPosition()을 호출한다.
                Object.assign으로 계산한 옵션을 원본 opt에 합친 뒤 UOrbitAndPanControls를 생성한다.
                _mapControl이 defined이면 기존 컨트롤을 생성 컨트롤의 _orimapControl에 연결한다.
                생성 컨트롤의 target을 opt.domElement로 설정한다.
                try 처리 중 예외는 콘솔에 기록하며 생성된 컨트롤 또는 undefined로 완료한다.

    getTimeSunset(date: Date|object) -> {start: Date, end: Date}|{start: Date, end: Date}|*|undefined
        의존:
            USunCalc — 직접 런타임 연계; 정적 함수: {getTimes()}
            defined — 직접 런타임 연계; 함수: {defined()}
            UDEF — 직접 런타임 연계; 정적 함수: {setDateFormat()}
            UDEF — Date 포맷 보강; 정적 함수: {setDateFormat()}
        동작:
            고정 위도 37.53189615862187와 경도 126.91415231094318로 USunCalc.getTimes(date)를 호출한다. [확인 Q-107]
            결과가 있으면 sunset을 UDEF.setDateFormat()에 전달하여 format 함수가 보강된 같은 Date를 반환하며 없으면 undefined를 반환한다.

    getTimeSunrise(date: Date|object) -> {start: Date, end: Date}|{start: Date, end: Date}|*|undefined
        의존:
            USunCalc — 직접 런타임 연계; 정적 함수: {getTimes()}
            defined — 직접 런타임 연계; 함수: {defined()}
            UDEF — 직접 런타임 연계; 정적 함수: {setDateFormat()}
            UDEF — Date 포맷 보강; 정적 함수: {setDateFormat()}
        동작:
            고정 위도 37.53189615862187와 경도 126.91415231094318로 USunCalc.getTimes(date)를 호출한다. [확인 Q-107]
            결과가 있으면 sunrise를 UDEF.setDateFormat()에 전달하여 format 함수가 보강된 같은 Date를 반환하며 없으면 undefined를 반환한다.

    setDefaultTimeSun() -> void
        동작:
            현재 Date를 만들고 2023-12-01 15:30을 적용해 _curtime에 저장한다.
            setTimeSun(_curtime)을 호출한다.

    updateQuadtree(force: number) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dQuadSet — 직접 런타임 연계; 함수: {update()}
        동작:
            쿼드 세트가 있으면 update(undefined,null,"all",force)를 호출한다.

    analySunAmount(start: Date, end: Date, position: GeoPosition, step: number, drawOpt: object = {}, dist?: number) -> Array<{start: Date, end: Date, amount: number}>
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UAnaly — 직접 런타임 연계; 함수: {active(), analySunAmount()}
        동작:
            SunAmount 분석을 찾고 undefined dist에는 5000을 적용한다.
            분석이 있으면 active() 뒤 analySunAmount()에 입력 인수를 전달해 결과를 반환한다.
            분석이 없으면 빈 배열을 반환한다.

    setFog(color: ColorLike = this._fogColor, value: number = UDEF.fogValue, isDynamic: boolean = true) -> void
        의존:
            UFog — 직접 런타임 연계; 함수: {set()}
            UFog — 직접 런타임 연계; 생성자: {new UFog()}
        동작:
            기존 _defaultFog가 있으면 set(color,value,isDynamic)을 호출하며 없으면 UFog를 생성하여 저장한다.

    resetFog() -> void
        의존:
            UFog — 직접 런타임 연계; 함수: {set()}
            UFog — 직접 런타임 연계; 생성자: {new UFog()}
        동작:
            기존 _defaultFog가 있으면 앱 _fogColor와 UDEF.fogValue로 set()을 호출하며 없으면 UFog를 생성하여 저장한다.

    showFog(isShow: boolean) -> void
        동작:
            isShow 값을 this._useFog에 저장한다.

    createFire(pos, params, url1, url2)
        의존:
            VolumetricFire — 직접 런타임 연계; 생성자: {new VolumetricFire()}
            VolumetricFire — 직접 런타임 연계; 함수: {mesh.position.copy(), mesh.rotateX()}
            UScene — 직접 런타임 연계; 함수: {add()}
        동작:
            params의 fireWidth,fireHeight,fireDepth,sliceSpacing과 카메라,url1,url2로 VolumetricFire를 생성한다.
            mesh 위치에 pos를 복사하고 X축 π/2 회전 뒤 _fires에 저장하고 Scene에 추가하여 fire를 반환한다.

    removeFire(fire) -> void
        의존:
            UDEF — 직접 런타임 연계; 정적 함수: {disposeObject3D()}
        동작:
            fire가 falsy이면 종료한다.
            _fires의 등록 항목이면 배열에서 제거한다.
            등록된 fire의 mesh가 있으면 숨기고 Scene에서 제거하며 UDEF.disposeObject3D()로 해제한다.

    createGrid(size, divisions) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UGridHelper — 직접 런타임 연계; 생성자: {new UGridHelper()}
            UScene — 직접 런타임 연계; 함수: {add()}
        동작:
            Scene이 없으면 종료한다.
            미정 size=1000,divisions=100을 적용하여 UGridHelper를 Scene에 추가하며 반환하지 않는다.

    setFrustumHelper(frustum: Frustum, options: UFrustumHelperCO = {}) -> UFrustumHelper | undefined
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UFrustumHelper — 직접 런타임 연계; 생성자: {new UFrustumHelper()}
        동작:
            frustum이 없으면 undefined로 종료한다.
            options 뒤 drawArg=this._drawArg를 덮어쓴 옵션으로 UFrustumHelper를 생성하여 반환한다.

    setFrustumTerrainProjectionHelper(frustum: Frustum, options: UFrustumTerrainProjectionHelperCO = {}) -> UFrustumTerrainProjectionHelper | undefined
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UFrustumTerrainProjectionHelper — 직접 런타임 연계; 생성자: {new UFrustumTerrainProjectionHelper()}
        동작:
            frustum이 없으면 undefined로 종료한다.
            options 뒤 drawArg=this._drawArg를 덮어쓴 옵션으로 UFrustumTerrainProjectionHelper를 생성하여 반환한다.

    createCollapse(camera, drawarg) -> void
        의존:
            UCollapse — 직접 런타임 연계; 생성자: {new UCollapse()}
        동작:
            camera,drawarg,simplepick=false로 UCollapse를 생성해 _collapse에 저장한다.

    getCollapse()
        동작:
            this._collapse 결과를 반환한다.

    createDrawArg(opt, app, scene, sceneComment, camera, frustum, grRect, gr3dRect) -> UDrawArg
        의존:
            UDrawArg — 직접 런타임 연계; 생성자: {new UDrawArg()}
        동작:
            app,scene,sceneComment,camera,frustum,grRect,gr3dRect로 UDrawArg를 생성해 _drawArg에 저장하고 반환한다.
            opt는 사용하지 않는다.

    getTileUpdateSensitivity() -> number
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dQuadSet — 직접 런타임 연계; 함수: {getUpdateSensitivity()}
        동작:
            쿼드 세트가 있으면 getUpdateSensitivity(),없으면 #tileUpdateSensitivity를 반환한다.

    setTileUpdateSensitivity(sensitivity: number) -> U3dApp
        의존:
            __GError__ — 직접 런타임 연계; 함수: {__GError__()}
            U3dQuadSet — 직접 런타임 연계; 함수: {setUpdateSensitivity()}
        동작:
            number가 아니면 타입 오류를 안내하고 this를 반환한다.
            유한하지 않거나 0 이하이면 값 오류를 안내하고 this를 반환한다.
            기존 민감도를 조회하고 존재하는 쿼드 세트에 setUpdateSensitivity()를 호출한다.
            #tileUpdateSensitivity에 저장하고 달라졌으면 setUpdateDate()를 호출한다.
            this를 반환한다.

    createQuadTreeSet(rectangle: UGeoRect = this._rectangle, minlevel: number = this._datalevel) -> null|U3dQuadSet
        동작:
            생성 전용 #createQuadTreeSet 경로에서 U3dQuadSet.createQuadTreeSet()에 종류별 생성을 위임하고 기존 반환형을 유지한다.
            누락된 종류만 생성하며 두 종류가 모두 있으면 기존 컨테이너를 반환한다.
            새 컨테이너 생성 도중 실패하면 먼저 생성한 종류도 정리한다. 기존 반대쪽 종류는 유지한다.

    createTerrainQuadTreeSet(rectangle: UGeoRect = this._rectangle, minlevel: number = this._datalevel) -> null|U3dQuadSet
        동작:
            지형·영상만 생성하고 해당 레이어에 컨테이너를 연결한다.
            현재 컨테이너에 지형이 있으면 그대로 반환한다. 반대쪽만 있으면 그 컨테이너에 지형 루트를 추가한다.
            앱 해제·생성·트리 교체·영역 적용 중에는 null을 반환하여 재진입을 차단한다.
            경계는 유한하고 양의 면적이어야 하며 시작 레벨은 0 이상 앱 최대 레벨 이하의 정수여야 한다. 잘못된 입력은 null을 반환한다.
            반대쪽 트리가 남아 있으면 그 영역·시작 레벨과 일치해야 한다. 다르면 RangeError를 전달하며 지도 영역 변경은 setMapRegion()을 사용한다.
            생성 오류는 호출자에게 전달한다. 민감도를 적용하고 _appUpdate3d=false로 설정한다.

    createModelQuadTreeSet(rectangle: UGeoRect = this._rectangle, minlevel: number = this._datalevel) -> null|U3dQuadSet
        동작:
            모델만 생성하고 모델 레이어에 컨테이너를 연결한다.
            기존 종류의 보존·입력 검사·재진입 차단·반환·오류는 지형 개별 생성과 같은 기준을 적용한다.

    setImageDebug(val: boolean) -> void
        의존:
            UDEF — 전역 이미지 디버그 상태; 속성 쓰기: {imageDebug}
        동작:
            val 값을 UDEF.imageDebug에 저장한다.

    isImageDebug() -> boolean
        의존:
            UDEF — 전역 이미지 디버그 상태; 속성 읽기: {imageDebug}
        동작:
            UDEF.imageDebug 결과를 반환한다.

    writeImageDebug() -> void
        의존:
            UDEF — 전역 이미지 디버그 상태; 속성 쓰기: {imageDebug}
        동작:
            UDEF.imageDebug=true로 설정한다.

    setDebug(val: boolean) -> void
        의존:
            UDEF — 전역 디버그 상태; 속성 쓰기: {debug}
        동작:
            val 값을 UDEF.debug에 저장한다.

    isDebug() -> boolean
        의존:
            UDEF — 전역 디버그 상태; 속성 읽기: {debug}
        동작:
            UDEF.debug 결과를 반환한다.

    updateFrustum() -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UFrustum — 직접 런타임 연계; 함수: {update()}
            U3dAppEventHandler — 직접 런타임 연계; 함수: {onchange()}
        동작:
            카메라가 없으면 종료한다.
            프러스텀이 있으면 update(camera) 뒤 drawArg._frustum에 같은 참조를 저장한다.
            이벤트 핸들러 onchange()를 호출한다.

    getCollapsePosition(vec, scenes)
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UDrawArg — 직접 런타임 연계; 함수: {getFrustumNearCenter()}
            UCollapse — 직접 런타임 연계; 함수: {getCollapsePosition()}
        동작:
            vec가 없으면 drawArg.getFrustumNearCenter()를 사용한다.
            collapse가 있으면 getCollapsePosition(vec,scenes) 결과를,없으면 undefined를 반환한다.

    getWalkCollapsePosition(vec, scenes)
        의존:
            UDrawArg — 직접 런타임 연계; 함수: {getFrustumNearCenter()}
            THREE — 직접 런타임 연계; 정적 함수: {new THREE.Vector3()}
            defined — 직접 런타임 연계; 함수: {defined()}
            UCollapse — 직접 런타임 연계; 함수: {getCollapsePosition()}
            THREE.Vector3 — 주변 충돌 표본 구성; 생성자: {new Vector3()}
        동작:
            입력 vec를 사용하지 않고 frustum near 중심과 x,y 각각 ±10인 다섯 점을 만든다.
            collapse가 있으면 각 점의 정의된 충돌 결과를 모으며 결과가 없으면 undefined를 반환한다.
            첫 결과 z=0이면 더 큰 z의 나머지 결과로 교체하고 그 외에는 첫 결과를 반환한다.

    isUpdateFrame() -> boolean
        동작:
            this._appUpdate3d 결과를 반환한다.

    update(list, event, force, change) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dQuadSet — 직접 런타임 연계; 함수: {update()}
            U3dObject — 상속된 기반 객체·이벤트 API; 함수: {setLastUpdateDate()}
            U3dObject — 상속된 기반 객체·이벤트 API; 함수: {getUpdateDate()}
        동작:
            isUpdateFrame()으로 현재 프레임 갱신 여부를 판정한다.
            프레임 갱신 중이 아닌 경우:
                _appUpdate3d를 true로 설정한다.
                force가 falsy이고 _saveForce가 truthy이면 force에 저장된 값을 가져오고 _saveForce를 false로 비운다.
                change가 falsy이고 _saveChange가 truthy이면 change에 저장된 값을 가져오고 _saveChange를 false로 비운다.
                쿼드 세트가 defined이면 isStopUpdate()로 중지 여부를 판정한다.
                쿼드 세트가 defined이고 갱신 중지가 아니면 마지막 갱신 시각을 저장하고 쿼드 세트 update(list,all,force,event,change)를 호출한다.
            프레임 갱신 중인 경우:
                force가 truthy인 경우:
                    _saveForce를 true로 저장하고 setUpdateDate()를 호출한다.
                force가 falsy인 경우:
                    change가 truthy이면 _saveChange를 true로 저장하고 setUpdateDate()를 호출한다.

    particleUpdate() -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            _particles가 있고 길이가 양수이면 Particle 분석의 update()를 호출한다.
            분석 객체 존재 여부를 별도로 검사하지 않는다.

    forceUpdate() -> Promise<U3dApp>
        의존:
            deferredPromise — 직접 런타임 연계; 함수: {deferredPromise()}
            U3dObject — 상속된 기반 객체·이벤트 API; 함수: {once()}
        동작:
            deferredPromise를 만들고 앱 EVENT.LOADED를 한 번 기다려 this로 resolve한다.
            saveForceUpdate(),setUpdateDate()를 호출하고 deferredPromise를 반환한다.

    changeUpdate() -> void
        동작:
            saveChangeUpdate() 뒤 setUpdateDate()를 호출한다.

    forceLoadModel(visible: boolean = true, minx: number = -213890.2, maxx: number = -212195.6, miny: number = 102175.8, maxy: number = 104582.4) -> Promise<void> | undefined
        의존:
            U3dQuadSet — 모델 루트 존재 판정·범위 갱신; 함수: {hasQuadTree(), on(), off(), updateModel()}
            UScene / THREE — 임시 범위·타일 박스와 자원 해제
            U3dApp — 모델 완료 대기; 상수: {EVENT.MODEL_LOADED}
            U3dQuadModelTile — 모델 루트 수명 알림; 이벤트: {TILE.DISPOSE}
        동작:
            유한하지 않거나 순서가 잘못된 경계는 RangeError로 거절한다. 앱 해제·영역 적용·트리 교체 중이거나 모델 루트가 없거나 갱신 중지이면 undefined로 종료한다.
            getQuadTrees(MODEL)로 모델 루트를 조회하고 컨테이너와 함께 기록한 뒤 앱 갱신을 중지하고 FORCE_MODEL_LOADED 수집과 MODEL_LOADED 완료 대기를 등록한다. 각 모델 루트의 DISPOSE 이벤트로 취소하며 별도의 앱 세대값이나 취소 목록은 두지 않는다.
            visible이면 적색 범위 박스를 지면 고도+30에, 완료된 녹색 타일 박스를 지면 고도+50에 표시한다.
            지형 개별 재시작은 모델 대기를 유지한다. 모델 해제·재시작과 앱 종료는 등록 작업을 취소하여 Promise를 거절한다.
            정상 완료·취소·예외 모두 표시 여부와 관계없이 트리·앱·루트 이벤트와 임시 박스의 geometry·material을 정리하고 갱신 중지를 해제한다. 트리 교체 도중 이전 완료 알림은 무시한다.
            정리 시작 시 재진입을 차단하고 이벤트·각 박스의 분리·재질·형상 정리를 독립적으로 시도한다. 정리 오류가 있어도 갱신 중지를 복원하고 Promise를 종료한다. 오류 하나는 원래 객체를, 여러 오류는 기존 실패·취소 원인을 먼저 담고 정리 순서대로 수집한 errors 배열을 가진 Error로 거절한다. 오류 없이 완료하면 완료값은 undefined다.

    setInteriorPanControl(set: boolean) -> void
        의존:
            __GInfo__ — 직접 런타임 연계; 함수: {__GInfo__()}
            UMapControlBase — 직접 런타임 연계; 함수: {setControlType()}
        동작:
            현재 컨트롤 setControlType이 없으면 지원 불가 안내 후 종료한다.
            set이 truthy이면 FIRST_PERSON,그 외에는 FIX_ANCHOR를 적용한다.

    setDynamicPanControl(checkpick) -> void
        의존:
            __GInfo__ — 직접 런타임 연계; 함수: {__GInfo__()}
            UMapControlBase — 직접 런타임 연계; 함수: {setControlType()}
        동작:
            현재 컨트롤 setControlType이 없으면 지원 불가 안내 후 종료한다.
            checkpick이 truthy이면 FIX_ANCHOR,그 외에는 NON_ANCHOR를 적용한다.

    saveChangeUpdate() -> void
        동작:
            true 값을 this._saveChange에 저장한다.

    saveForceUpdate() -> void
        동작:
            true 값을 this._saveForce에 저장한다.

    override setUpdateDate(event) -> void
        의존:
            U3dObject — 갱신 시각 반영; 함수: {setUpdateDate()}
            U3dObject — 실제 직접 import API; 함수: {U3dObject.prototype.setUpdateDate.call()}
        동작:
            앱이 초기화되지 않았으면 종료한다.
            U3dObject.prototype.setUpdateDate를 앱 this로 호출하며 undefined,event를 전달한다.

    cancelrenderFrame(time) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 직접 런타임 연계; 함수: {setTimeout()}
            URenderer — 직접 런타임 연계; 함수: {setAnimationLoop()}
        동작:
            미정 time은 0을 적용하며 타이머 뒤 렌더러 setAnimationLoop(null)를 호출한다.

    setSearchPosition(worldX, worldY) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            THREE — 직접 런타임 연계; 정적 함수: {new THREE.Vector3()}
            UDrawArg — 직접 런타임 연계; 함수: {setSearchPosition()}
        동작:
            worldX,worldY가 정의되어 있으면 z=0 Vector3로 만들어 drawArg.setSearchPosition()에 전달한다.

    getSearchPosition()
        의존:
            UDrawArg — 직접 런타임 연계; 함수: {getSearchPosition()}
        동작:
            this._drawArg.getSearchPosition() 결과를 반환한다.

    clearSearchPosition() -> void
        의존:
            UDrawArg — 직접 런타임 연계; 함수: {clearSearchPosition()}
        동작:
            drawArg.clearSearchPosition()를 호출한다.

    printResource() -> void
        의존:
            U3dMessage — 직접 런타임 연계; 정적 함수: {info()}
            UResourceManager(UDEF.resourceManager) — 렌더 자원 관리; 함수: {getTextureCount(), resourceManager.getTextures(), resourceManager.getGeometryCount(), resourceManager.getGeometries()}
            Web API — 직접 런타임 연계; 함수: {console.dir()}
            U3dMessage — 실제 직접 import API; 함수: {U3dMessage.info()}
            UDEF — 실제 직접 import API; 함수: {UDEF.resourceManager.getGeometries(), UDEF.resourceManager.getGeometryCount(), UDEF.resourceManager.getTextureCount(), UDEF.resourceManager.getTextures()}
        동작:
            UDEF.resourceManager의 텍스처·geometry 개수를 U3dMessage.info()로,각 자원 목록을 console.dir()로 출력한다.

    clearResource() -> void
        의존:
            UResourceManager(UDEF.resourceManager) — 렌더 자원 관리; 함수: {clear()}
            UDEF — 실제 직접 import API; 함수: {UDEF.resourceManager.clear()}
        동작:
            UDEF.resourceManager.clear()를 호출한다.

    createView(opt: U3dViewCO) -> Promise<U3dView>
        의존:
            U3dView — 직접 런타임 연계; 생성자: {new U3dView()}
        동작:
            U3dView(opt)를 생성해 addView() 결과를 반환한다.

    compileAsync(target)
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            URenderer — 직접 런타임 연계; 함수: {compileAsync()}
        동작:
            렌더러가 없으면 undefined로 종료한다.
            renderer.compileAsync(target,camera,scene.parent) 결과를 반환한다.

    draw(clear) -> void
        의존:
            UDrawArg — 직접 런타임 연계; 함수: {getInstanceModelLayers()}
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dLayer — 직접 런타임 연계; 함수: {setWireframe()}
            URenderer — 직접 런타임 연계; 함수: {getScissorTest(), setScissor(), draw(), removeRenderObjByName(), drawRenderTarget()}
            U3dView — 직접 런타임 연계; 함수: {getCamera(), drawViewImage()}
        동작:
            _renderer가 falsy이면 종료하고 이어서 _drawArg가 falsy이면 종료한다.
            _renderer와 _drawArg가 모두 truthy인 경우:
                _drawArg.getInstanceModelLayers()로 모델 레이어를 순회한다.
                layer._setWireframe이 defined이면 해당 레이어 setWireframe(layer._setWireframe)을 호출한다.
                getEnableSwipe()로 스와이프 활성 여부를 조회한다.
                스와이프가 활성이고 렌더러 scissor test가 켜졌으면 기본 창과 스와이프 창의 scissor를 순서대로 적용하여 BASE,SWIPE 타입으로 각각 draw한다.
                그 외에는 DEFAULT 타입으로 draw한다.
                getRenderViewList(2,4)가 있으면 호출 결과를 사용하고 nullish이면 _viewList를 사용한다.
                카메라가 defined이고 visible인 각 뷰에서 CUSTOM 렌더 객체를 첫 처리 여부와 함께 제거한다.
                drawRenderTarget(camera,view.snapshotRT,view.usePostProcess) 뒤 view.drawViewImage()를 호출한다.

    getRenderViewList(maxPerTick: number = 5, maxScanPerTick: number = 10) -> Array<U3dView>
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            _viewList가 없거나 비었으면 빈 배열을 반환한다.
    drawModel(clear)
        동작:
            this.draw(clear) 결과를 반환한다.

    isStopUpdate() -> boolean
        동작:
            this._stopUpdate 결과를 반환한다.

    setStopUpdate(val) -> void
        동작:
            val 값을 this._stopUpdate에 저장한다.

    alignNorth(duration?: number) -> Promise<void>
        의존:
            UMapControls — 직접 런타임 연계; 함수: {lookAtNorth()}
        동작:
            #cancelViewAngleChange() 뒤 컨트롤 lookAtNorth(duration)의 결과를 반환한다.

    fitExtentToBoundingBox(boundingBox: object, useFly: boolean, offsetZ: number, leftrotate: number = 0, downrotate: number = 0) -> Promise<boolean | void>
        의존:
            deferredPromise — 직접 런타임 연계; 함수: {deferredPromise()}
            isWrong — 직접 런타임 연계; 함수: {isWrong()}
            __GError__ — 직접 런타임 연계; 함수: {__GError__()}
            THREE — 직접 런타임 연계; 정적 함수: {new THREE.Vector3(), new THREE.Box3()}
            __GInfo__ — 직접 런타임 연계; 함수: {__GInfo__()}
            defined — 직접 런타임 연계; 함수: {defined()}
            UMapControls — 직접 런타임 연계; 함수: {tween.stop()}
            UCamera — 직접 런타임 연계; 함수: {lookAt()}
        동작:
            stopFly()로 진행 중인 이동을 멈춘 뒤 deferredPromise를 만든다.
            boundingBox,min,max가 없거나 min,max가 isWrong이면 오류를 안내하고 값 없이 resolve한 deferredPromise를 즉시 반환한다.
            try 안에서 복사한 min,max의 Box3로 중심과 크기를 구한다.
            x,y 크기가 10000000을 초과하거나 NaN이면 안내 후 false로 reject한 deferredPromise를 즉시 반환한다.
            getRectangle()으로 앱 범위를 조회하고 중심이 그 밖이면 안내 후 false로 reject한 deferredPromise를 즉시 반환한다.
            최대 x,y,z 크기의 절반에 tan(45*2)의 절대값을 적용하여 cameraZ를 계산한다.
            offsetZ가 defined이면 cameraZ에 더한다.
            self._mapControl이 truthy인 경우:
                기존 tween이 undefined가 아니면 중지한 뒤 참조를 undefined로 비운다.
                useFly에 따라 2000ms 또는 0ms로 setCameraPosition()을 호출하고 완료는 true로 resolve하며 실패는 false로 reject한다.
            self._mapControl이 falsy인 경우:
                카메라 lookAt(center) 뒤 updateData()를 호출하고 true로 resolve한다.
            try 처리 중 예외는 오류를 안내한 뒤 false로 reject하며 deferredPromise를 반환한다.

    fitExtentToObject(object: Object3D, useFly: boolean, offsetZ: number, leftrotate: number = 0, downrotate: number = 0) -> void
        의존:
            THREE — 직접 런타임 연계; 정적 함수: {new THREE.Box3()}
        동작:
            입력 object의 Box3를 setFromObject()로 생성한다.
            fitExtentToBoundingBox()를 호출하며 그 결과를 반환하지 않는다. 실패는 내부 catch에서 __GError__로 기록한다.

    refresh() -> void
        동작:
            restartQuadTree()를 호출한다.

    stopFly() -> void
        동작:
            앱 this로 모듈 stopFly_(),stopTween_()를 순서대로 호출한다.

    setZoomSpeed(factor: number = DEFAULT_CONTROL_FACTOR.ZOOM_SPEED) -> boolean
        의존:
            UMapControls — 직접 런타임 연계; 함수: {getFactor()}
        동작:
            컨트롤 또는 getFactor가 없으면 false를 반환한다.
            getFactor().zoomSpeed에 factor를 저장하고 true를 반환한다.

    setPanSpeed(factor: number = DEFAULT_CONTROL_FACTOR.MOVE_SPEED) -> boolean
        의존:
            UMapControls — 직접 런타임 연계; 함수: {getFactor()}
        동작:
            컨트롤 또는 getFactor가 없으면 false를 반환한다.
            getFactor().panSpeed에 factor를 저장하고 true를 반환한다.

    setRotateSpeed(factor: number = DEFAULT_CONTROL_FACTOR.ROTATE_SPEED) -> boolean
        의존:
            UMapControls — 직접 런타임 연계; 함수: {getFactor()}
        동작:
            컨트롤 또는 getFactor가 없으면 false를 반환한다.
            getFactor().rotateSpeed에 factor를 저장하고 true를 반환한다.

    setRotateHorizontalSpeed(factor: number = 1) -> boolean
        의존:
            UMapControls — 직접 런타임 연계; 함수: {getFactor()}
        동작:
            factor가 유한하지 않거나 0 미만이거나 컨트롤·getFactor가 없으면 false를 반환한다.
            factor.rotateHorizontalSpeed를 설정하고 true를 반환한다.

    setRotateVerticalSpeed(factor: number = 1) -> boolean
        의존:
            UMapControls — 직접 런타임 연계; 함수: {getFactor()}
        동작:
            factor가 유한하지 않거나 0 미만이거나 컨트롤·getFactor가 없으면 false를 반환한다.
            factor.rotateVerticalSpeed를 설정하고 true를 반환한다.

    getUseCollison() -> boolean
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UMapControls — 직접 런타임 연계; 함수: {getUseCollision()}
        동작:
            컨트롤이 없거나 UMapControls가 아니면 false를 반환하며 그 외에는 getUseCollision()을 반환한다.

    setUseCollision(value) -> void
        의존:
            UMapControls — 직접 런타임 연계; 함수: {setUseCollision()}
        동작:
            컨트롤 setUseCollision이 있을 때만 value를 전달한다.

    setFreePolarAngle(value) -> void
        의존:
            UMapControls — 직접 런타임 연계; 함수: {setFreePolarAngle()}
        동작:
            컨트롤 setFreePolarAngle이 있을 때만 value를 전달한다.

    getVersion() -> string
        의존:
            UDEF — 직접 런타임 연계; 정적 함수: {getVersion()}
        동작:
            UDEF.getVersion() 결과를 반환한다.

    getDomElement() -> undefined | HTMLCanvasElement
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            렌더러가 있으면 domElement를,없으면 undefined를 반환한다.

    setBackgroundColor(rgbString) -> boolean
        의존:
            THREE — 직접 런타임 연계; 정적 함수: {new THREE.Color()}
        동작:
            _backgroundColor에 rgbString 또는 0xffffff를 저장한다.
            기존 _background가 truthy이면 새 THREE.Color로 교체한다.
            동기 처리 성공은 true,예외는 false를 반환한다.

    #changeViewAngle(polarDegree: Degree, azimuthDegree: Degree|null = null, onArrived?: function():void, onCanceled?: function():void) -> Promise<void>
        의존:
            deferredPromise — 직접 런타임 연계; 함수: {deferredPromise()}
            defined — 직접 런타임 연계; 함수: {defined()}
            UMapControls — 직접 런타임 연계; 함수: {lookAtPolar(), lookAtAzimuth()}
            U3dObject — 상속된 기반 객체·이벤트 API; 함수: {once()}
        동작:
            deferredPromise를 만들고 컨트롤 또는 lookAtPolar가 없으면 reject한다.
            #cancelViewAngleChange()로 changeId를 얻고 onCanceled를 #viewAngleCanceled에 저장한다.
            _isTwenning=true로 설정하여 lookAtPolar(polarDegree,500)를 호출한다.
            고도각 회전을 await한 뒤 식별자가 바뀌면 reject하며 azimuthDegree가 정의되면 lookAtAzimuth(azimuthDegree,500)를 이어 호출하고 await한다.
            완료 콜백은 취소를 재확인하고 _isTwenning=false와 취소 콜백 해제 후 onArrived를 호출한다.
            changeUpdate() 뒤 앱 EVENT.LOADED를 한 번 기다려 void로 resolve한다.
            회전 시작·대기·도착 후처리의 예외는 실패 처리로 전달한다. 아직 취소되지 않았을 때만 _isTwenning=false와 취소 콜백 해제 후 onCanceled를 호출한다. 취소 후처리가 던지면 그 오류로, 그렇지 않으면 원래 오류로 reject한다.
            deferredPromise를 반환한다.

    #cancelViewAngleChange() -> number
        동작:
            기존 취소 콜백을 보존하고 #viewAngleCanceled를 undefined로 비운다.
            #viewAngleChangeId를 증가시키고 취소 콜백이 있으면 호출한 뒤 식별자를 반환한다.

    #lockViewAngleLimit() -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UMapControls — 직접 런타임 연계; 함수: {updatePolarAngle()}
        동작:
            _mapControl이 defined가 아니면 종료한다.
            _mapControl이 defined인 경우:
                updatePolarAngle이 있으면 최소와 최대 고도각을 모두 0으로 고정한다.
                #updateAzimuthLimit(0,0)을 호출하여 최소와 최대 방위각을 모두 0으로 설정한다.

    #unlockViewAngleLimit() -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UMapControls — 직접 런타임 연계; 함수: {updatePolarAngle()}
        동작:
            컨트롤 또는 updatePolarAngle이 없으면 종료한다.
            기존 고도각 최소·최대가 같으면 기본 최대값을,다르면 현재 최대값을 사용한다.
            최소 0과 계산한 최대 고도각을 적용하고 기본 방위각 제한을 복원한다.

    #updateAzimuthLimit(min: Radian|number, max: Radian|number) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            컨트롤이 있으면 minAzimuthAngle,maxAzimuthAngle에 min,max를 설정한다.

    is2DMode() -> boolean
        동작:
            #viewMode가 VIEW_MODE.TWO_D와 같은지 반환한다.

    set2DMode() -> Promise<void>
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            현재 #viewMode가 TWO_D이면 값 없이 resolve한 표준 Promise를 즉시 반환한다.
            _mapControl이 defined가 아니면 reject한 표준 Promise를 즉시 반환한다.
            현재 #viewMode가 TWO_D가 아니고 _mapControl이 defined인 경우:
                #viewMode를 TWO_D로 저장한다.
                #unlockViewAngleLimit()로 각도 제한을 먼저 해제한다.
                #changeViewAngle(0,0)에 정상 도착과 취소 콜백을 전달하고 그 이동 결과를 반환한다.
                    정상 도착 콜백은 #lockViewAngleLimit()로 각도 제한을 잠근다.
                    취소 콜백은 현재 #viewMode가 TWO_D인 경우 #lockViewAngleLimit()로 각도 제한을 다시 잠근다.

    set3DMode(target: null|WorldPositionVector3 = null) -> Promise<void>
        의존:
            isVector3Like — 직접 런타임 연계; 함수: {isVector3Like()}
            defined — 직접 런타임 연계; 함수: {defined()}
            UMapControls — 직접 런타임 연계; 함수: {resetPolarAngle(), getAzimuthalAngle()}
            THREE — 직접 런타임 연계; 정적 함수: {MathUtils.radToDeg()}
        동작:
            truthy target이고 isVector3Like이면 유효한 target으로 판정한다.
            유효 target이 없고 이미 THREE_D이면 void resolve한 표준 Promise를 반환한다.
            #viewMode=THREE_D로 저장하고 컨트롤 resetPolarAngle이 있으면 호출한다.
            기본 방위각 제한을 복원한다.
            유효 target이 있으면 현재 방위각 또는 0과 카메라·타겟 거리를 보존한 setCameraPosition(target,방위각,60,거리,500) 결과를 반환한다.
            그 외에는 #changeViewAngle(60) 결과를 반환한다.

    addLayer(layer: U3dLayer) -> U3dLayer | undefined
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {addLayer()}
            U3dLayer — 직접 런타임 연계; 함수: {_rejectReady(), setApp(), setOpacity(), isDisposed(), getName()}; 속성 읽기: {ready}
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            layer가 없거나 레이어 목록 addLayer()가 falsy이면 레이어가 있으면 추가 실패 Error를 _rejectReady에 전달한 뒤 입력 layer를 반환한다.
            성공 경로는 layer.setApp(this)를 호출한다.
            U3dImageLayer,U3dImageXYZLayer,U3dOpenLayer 계열은 이미지 불투명도 사용·값 속성을 조회한다.
            U3dModelTilesLayer,U3dModelBasicLayer,U3dModelStaticLayer,U3dModelWFSLayer,U3dModelU3FLayer,U3dModelI3FLayer 계열은 모델 불투명도 사용·값 속성을 조회한다.
            사용 속성이 true이면 ready.then에서 setOpacity(value)를 호출한다. 콜백 실행 전에 앱·레이어가 해제되었거나 같은 이름의 등록 객체가 달라졌으면 적용하지 않는다. 초기화 실패 또는 불투명도 처리 예외는 오류 로그로 남긴다.
            layer를 반환한다.

    shareLayer(layer)
        의존:
            U3dLayerList — 직접 런타임 연계; 함수: {addLayer()}
        동작:
            this._layerlist.addLayer(layer) 결과를 반환한다.

    addView(view: U3dView) -> Promise<U3dView>
        의존:
            deferredPromise — 직접 런타임 연계; 함수: {deferredPromise()}
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dView — 직접 런타임 연계; 함수: {getElement(), setApp()}
            U3dOverlayManager — 직접 런타임 연계; 생성자: {new U3dOverlayManager()}
            Web API — 래퍼 DOM 조회·배치; 함수: {HTMLElement.appendChild(), HTMLElement.getElementsByClassName()}; 속성 읽기·쓰기: {HTMLElement.style}
        동작:
            deferredPromise를 만들고 view가 없거나 isView가 false이면 문자열 오류로 reject한다.
            동일 객체가 이미 목록에 있으면 문자열 오류로 reject한다.
            먼저 _viewList에 추가하고 getViewWrapper()와 view.getElement()의 정규화 DOM을 얻는다.
            DOM이 없으면 reject하며 이미 추가한 목록 항목은 남는다.
            DOM이 문서에 연결되어 있지 않을 때만 wrapper에 추가하고 display=block을 적용한다.
            오버레이 매니저가 없으면 생성한다.
            view.setApp(this) 뒤 view로 resolve하며 예외는 reject하고 deferredPromise를 반환한다.

    getViewById(id: string) -> U3dView
        동작:
            목록에서 id가 같은 첫 항목 또는 undefined를 반환한다. [확인 Q-105]

    removeView(view: U3dView) -> void
        의존:
            U3dView — 직접 런타임 연계; 함수: {remove()}
        동작:
            같은 id의 첫 목록 항목을 제거한다.
            목록 검색 성공 여부와 무관하게 입력 view.remove()가 있으면 호출한다.

    findViewByName(viewName: string) -> U3dView | undefined
        동작:
            목록에서 입력 name과 같은 첫 항목 또는 undefined를 반환한다.

    removeAllView() -> void
        의존:
            U3dView — 직접 런타임 연계; 함수: {remove()}
        동작:
            _viewList를 인덱스로 순회하며 현재 항목의 remove()를 호출한 뒤 배열 length를 0으로 만든다.

    addViewLight(viewlight: U3dViewLight) -> void
        의존:
            U3dViewLight — 직접 런타임 연계; 함수: {getElement(), setApp()}
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 래퍼 DOM 조회·배치; 함수: {HTMLElement.appendChild(), HTMLElement.getElementsByClassName()}; 속성 읽기·쓰기: {HTMLElement.style}
        동작:
            먼저 _viewLightList에 추가하고 getViewLightWrapper()를 얻는다.
            getElement()의 정규화 DOM이 없으면 종료한다.
            wrapper에 DOM을 추가하고 display를 빈 문자열로 설정한 뒤 setApp(this)를 호출한다.

    getViewLightById(id: string) -> U3dViewLight
        동작:
            목록에서 id가 같은 첫 항목 또는 undefined를 반환한다. [확인 Q-117]

    removeViewLight(viewLight: U3dViewLight) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            같은 id의 목록 항목이 없으면 종료한다.
            찾은 객체를 배열에서 제거하고 remove()를 호출한다.

    removeAllViewLight() -> void
        의존:
            U3dView — 직접 런타임 연계; 함수: {remove()}
        동작:
            _viewLightList를 인덱스로 순회하며 현재 항목의 remove()를 호출한 뒤 새 빈 배열로 교체한다.

    getOverlayList() -> Array<U3dOverlay>
        동작:
            this._overlayList 결과를 반환한다.

    getViewList() -> Array<U3dView>
        동작:
            this._viewList 결과를 반환한다.

    getLightList() -> Array<USpotLight>
        동작:
            this._lightList 결과를 반환한다.

    addLight(light: USpotLight) -> void
        의존:
            USpotLight — 직접 런타임 연계; 함수: {setApp()}
        동작:
            _lightList에 light를 추가하고 light.setApp(this)를 호출한다.

    removeLight(light: USpotLight) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            같은 id의 목록 항목이 없으면 종료한다.
            연결 view가 있으면 removeView() 뒤 view를 undefined로 비운다.
            목록에서 제거하고 찾은 light의 remove()를 호출한다.

    findLightByName(lightName: string) -> USpotLight | undefined
        동작:
            목록에서 입력 name과 같은 첫 항목 또는 undefined를 반환한다.

    removeAllLight() -> void
        의존:
            USpotLight — 직접 런타임 연계; 함수: {dispose()}
        동작:
            _lightList를 인덱스로 순회하며 현재 항목의 dispose()를 호출한 뒤 새 빈 배열로 교체한다.

    createOverlay(html: string | HTMLElement, option: U3dOverlayCO) -> U3dOverlay | undefined
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dOverlay — 직접 런타임 연계; 생성자: {new U3dOverlay()}
        동작:
            html 또는 option.position이 없으면 undefined로 종료한다.
            name=overlay,id=option.uuid,element=html,position,useanchor,anchor,balloon으로 U3dOverlay를 만든다.
            addOverlay() 뒤 overlay를 반환한다.

    addOverlay(overlay: U3dOverlay) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dOverlayManager — 직접 런타임 연계; 생성자: {new U3dOverlayManager()}
            U3dOverlay — 직접 런타임 연계; 함수: {getElement(), setApp()}
            Web API — 래퍼 DOM 조회·배치; 함수: {HTMLElement.appendChild(), HTMLElement.getElementsByClassName()}; 속성 읽기·쓰기: {HTMLElement.style}
        동작:
            오버레이 매니저가 없으면 생성한다.
            먼저 _overlayList에 추가하고 getOverlayWrapper()를 얻는다.
            getElement()의 정규화 DOM이 없으면 종료한다.
            wrapper에 DOM을 추가하고 display를 빈 문자열로 설정한 뒤 setApp(this)를 호출한다.

    getOverlayById(id: string) -> U3dOverlay
        동작:
            목록에서 id가 같은 첫 항목 또는 undefined를 반환한다. [확인 Q-118]

    removeOverlay(overlay: U3dOverlay) -> void
        동작:
            같은 id의 첫 목록 항목이 없으면 종료한다.
            배열에서 제거한 객체의 remove()를 호출한다.

    removeAllOverlay() -> void
        의존:
            U3dOverlay — 직접 런타임 연계; 함수: {remove()}
        동작:
            선택적 overlay.remove()를 각 항목에 호출한 뒤 _overlayList.length=0으로 비운다.

    goToHome(duration?: number)
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            __GError__ — 이동 중 비동기 실패 기록; 함수: {__GError__()}
            Web API — 직접 런타임 연계; 함수: {console.error()}
        동작:
            self._homePosition이 defined가 아니면 콘솔 오류를 기록하고 종료한다.
            self._homePosition이 defined인 경우:
                duration이 defined가 아니면 1을 적용한다.
                duration이 truthy이면 그 값으로, 그 외에는 3000으로 사용할 이동 시간을 정한다.
                홈 위치와 회전값, 정한 이동 시간을 setCameraGeographicPosition()에 전달하며 결과는 반환하지 않는다. 비동기 실패는 __GError__로 기록하여 처리한다.

    click(u3dMouseEvent: U3dMouseEvent) -> void
        의존:
            U3dAppEventHandler — 직접 런타임 연계; 함수: {click()}
        동작:
            이벤트가 truthy일 때 이벤트 핸들러 click()에 전달한다.

    dbclick(u3dMouseEvent: U3dMouseEvent) -> void
        의존:
            U3dAppEventHandler — 직접 런타임 연계; 함수: {dbclick()}
        동작:
            이벤트가 truthy일 때 이벤트 핸들러 dbclick()에 전달한다.

    onFlyEnd(listener: Function, once: boolean, name: string) -> void
        의존:
            __GError__ — 직접 런타임 연계; 함수: {__GError__()}
            UMapControls — 직접 런타임 연계; 함수: {addEventListener()}
        동작:
            컨트롤이 없으면 오류를 안내하되 중단하는 return은 없다.
            addEventListener("flyend",listener,once,name)을 호출한다.

    offFlyEnd(listener: Function) -> void
        의존:
            __GError__ — 직접 런타임 연계; 함수: {__GError__()}
            UMapControls — 직접 런타임 연계; 함수: {removeEventListener()}
        동작:
            컨트롤이 없으면 오류를 안내하되 중단하는 return은 없다.
            removeEventListener("flyend",listener)을 호출한다.

    getRenderHeightAtPoint(world: WorldPosition, useRaycaster: boolean = false, options: Partial<{ useCache: boolean }> = {}) -> number
        의존:
            UDrawArg — 직접 런타임 연계; 함수: {getRenderHeightAtPoint()}
        동작:
            useRaycaster가 falsy이면 _drawArg.getRenderHeightAtPoint(world.x,world.y,options)를 반환한다.
            useRaycaster가 truthy인 경우:
                intersectAtVector3_(world,true,true)로 지형 교차 목록을 얻는다.
                getUType()이 타일이고 distance가 0이 아닌 첫 교차점의 point.z를 반환한다.
                해당 교차가 없으면 TERRAIN_NO_DATA를 반환한다.

    getHeightAtPoint(world: WorldPosition, useRaycaster: boolean = false, options: Partial<{ useCache: boolean }> = {}) -> number
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UMathEngine — 직접 런타임 연계; 정적 함수: {getRealScaleAtGoogle()}
        동작:
            getRenderHeightAtPoint()가 undefined/null,TERRAIN_NO_DATA,INVALID이면 TERRAIN_NO_DATA를 반환한다.
            렌더 높이에 world.y의 실제 스케일을 곱해 미터 높이를 반환한다.

    getHeightAtGeographicPoint(geo: GeoPosition, useRaycaster: boolean = false) -> number
        동작:
            geo.x,y를 월드로 변환해 getHeightAtPoint(world,useRaycaster) 결과를 반환한다.

    intersectInFrustum(e: U3dMouseEvent | MouseEvent | Vector3 | {normalizedX: number | undefined, normalizedY: number | undefined}, onlyTerrain: boolean = true, recursive?: boolean) -> Array<Intersection<Object3D>>
        의존:
            UCamera — 직접 런타임 연계; 함수: {updateProjectionMatrix()}
            UFrustum — 직접 런타임 연계; 함수: {intersectsObject()}
        동작:
            카메라 updateProjectionMatrix() 후 onlyTerrain에 따라 지형 또는 모델·지형 Scene을 얻는다.
            Scene 자식 group의 child 중 frustum.intersectsObject()가 true인 객체를 모은다.
            공유 RAYCASTER를 normalizedX,normalizedY와 카메라로 설정하고 intersectObjects(targetList,recursive)를 반환한다.

    intersect_(position: WorldPositionVector3, direction: Vector3, onlyTerrain?: boolean, recursive?: boolean) -> Array<Intersection<Object3D>>
        의존:
            URaycaster — 직접 런타임 연계; 함수: {set()}
        동작:
            onlyTerrain에 따라 지형 또는 모델·지형 Scene을 얻는다.
            공유 RAYCASTER.set(position,direction).intersectObjects(scenes,recursive)를 반환한다.

    intersectFromScene(e: U3dMouseEvent | MouseEvent | Vector3 | {normalizedX: number | undefined, normalizedY: number | undefined}, scenes: Array<Object3D>, recursive?: boolean, params?: URaycasterCO) -> Array<Intersection<Object3D>>
        의존:
            URaycaster — 직접 런타임 연계; 함수: {setParams(), set(), setFromCamera(), intersectObjects()}
        동작:
            공유 RAYCASTER.setParams(params)를 호출한다.
            e.isVector3가 truthy이면 입력 z+10000에서 아래 방향 레이를 설정한다.
            그 외에는 normalizedX,normalizedY와 카메라로 레이를 설정한다.
            intersectObjects(scenes,recursive)를 반환한다.

    intersectAtPixel(e: U3dMouseEvent | MouseEvent | Vector3 | {normalizedX: number | undefined, normalizedY: number | undefined}, onlyTerrain?: boolean, recursive?: boolean, appendScenes?: UScene | Array<UScene>, params?: URaycasterCO) -> Array<Intersection<Object3D>>
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            onlyTerrain에 따라 지형 또는 모델·지형 Scene을 얻는다.
            appendScenes가 정의되면 배열은 펼쳐서,단일 객체는 한 항목으로 추가한다.
            입력 좌표·Scene·recursive·params를 intersectFromScene()에 전달해 반환한다.

    intersectAtVector3_(vec3: WorldPositionVector3, onlyTerrain?: boolean, recursive?: boolean, appendScenes?: UScene | Array<UScene>, params?: URaycasterCO) -> Array<Intersection<Object3D>>
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            onlyTerrain에 따라 지형 또는 모델·지형 Scene을 얻는다.
            appendScenes가 정의되면 배열은 펼쳐서,단일 객체는 한 항목으로 추가한다.
            입력 좌표·Scene·recursive·params를 intersectFromScene()에 전달해 반환한다.

    intersectModelAtWorldPoint(world: WorldPositionVector3, gapPixel: number = 5, closedobject: boolean = false, scenes?: UScene | Array<UScene> | null) -> Array<Intersection<Object3D>> | WorldPositionVector3 | undefined
        의존:
            THREE — 직접 런타임 연계; 정적 함수: {new THREE.Vector3()}
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            world.x,y의 ±gapPixel 범위를 양끝 포함 1 간격으로 순회하여 world.z의 Vector3 목록을 만든다.
            scenes가 falsy이면 getInstanceScenesFromModelAndTerrainLayers()로 검색 Scene을 얻는다.
            scenes가 배열이 아니면 단일 항목 배열로 감싼다.
            각 점에서 intersectFromScene(point,scenes,true)를 호출한다.
            교차 결과가 falsy이면 그 점을 건너뛰고, 단일 결과이면 배열로 감싼 뒤 같은 object 참조의 중복을 제거해 첫 교차만 모은다.
            closedobject가 truthy이면 getFristPoint(result)의 첫 point 또는 undefined를 반환한다.
            closedobject가 falsy이면 교차 배열을 반환한다.

    intersectModelAtGeographicPoint(geo: GeoPosition, gapPixel?: number, closedobject: boolean = false, scenes?: UScene | Array<UScene> | null) -> Array<Intersection<Object3D>> | WorldPositionVector3 | undefined
        의존:
            UDrawArg — 직접 런타임 연계; 함수: {getGeographicToWorld()}
        동작:
            geo.x,y와 z=0을 drawArg.getGeographicToWorld()로 변환한다.
            월드 좌표와 나머지 인수로 intersectModelAtWorldPoint()를 호출하여 반환한다.

    closestPointAtPixel(e: U3dMouseEvent | MouseEvent | Vector3 | {normalizedX: number | undefined, normalizedY: number | undefined}, onlyTerrain?: boolean, recursive?: boolean, scenes?: Array<UScene> | UScene) -> WorldPositionVector3
        동작:
            intersectAtPixel() 결과를 getFristPoint()에 전달해 첫 point 또는 undefined를 반환한다. [확인 Q-119]

    closestPointAtVector3_(vec3: WorldPositionVector3, onlyTerrain?: boolean, recursive?: boolean, scenes?: UScene | Array<UScene>) -> WorldPositionVector3
        동작:
            intersectAtVector3_() 결과를 getFristPoint()에 전달해 첫 point 또는 undefined를 반환한다. [확인 Q-120]

    closestPointAtGeographic(position: GeoPosition, onlyTerrain?: boolean, recursive?: boolean) -> WorldPositionVector3
        동작:
            geographicToVector3() 결과를 closestPointAtVector3_()에 전달해 반환한다. [확인 Q-121]

    getMouseToGeographic(event: U3dMouseEvent) -> GeoPosition
        동작:
            pixelToGeographic(event,true,true)를 반환한다. [확인 Q-122]

    pixelToVector3(e: U3dMouseEvent, onlyTerrain: boolean, recursive: boolean) -> WorldPosition
        동작:
            this.closestPointAtPixel(e, onlyTerrain, recursive) 결과를 반환한다. [확인 Q-123]

    pixelToGeographic(e: U3dMouseEvent | MouseEvent, onlyTerrain: boolean, recursive: boolean) -> GeoPosition
        동작:
            pixelToVector3()가 truthy이면 vector3ToGeoGraphic() 결과를 반환하며 없으면 undefined로 종료한다. [확인 Q-124]

    vector3ToPixel(vec3: WorldPositionVector3) -> Vector2Like
        의존:
            URenderer — 직접 런타임 연계; 함수: {getContext()}
            UCamera — 직접 런타임 연계; 함수: {updateMatrixWorld()}
        동작:
            renderer context.canvas의 width,height를 읽고 카메라 행렬을 갱신한다.
            공유 projectionVec에 vec3를 복사하여 카메라로 project()한다.
            x=(projectedX+1)/2*width,y=(projectedY-1)/2*height를 계산하며 projectedZ>1이면 y 부호를 반전한다.
            {x,y}를 반환한다.

    vector3ToGeoGraphic(vec3: WorldPosition | undefined) -> GeoPositionVector3
        의존:
            THREE — 직접 런타임 연계; 정적 함수: {new THREE.Vector3()}
            UDrawArg — 직접 런타임 연계; 함수: {getWorldToGeographic()}
        동작:
            vec3가 falsy이면 새 THREE.Vector3()를 반환한다.
            drawArg.getWorldToGeographic(vec3.x,vec3.y,vec3.z)를 반환한다.

    geographicToVector3(position: GeoPosition) -> WorldPositionVector3
        의존:
            UDrawArg — 직접 런타임 연계; 함수: {getGeographicToWorld()}
        동작:
            position.z가 falsy이면 0을 적용하여 drawArg.getGeographicToWorld() 결과를 반환한다.

    geographicToPixel(position: GeoPosition) -> {x: number, y: number}
        동작:
            geographicToVector3() 결과를 vector3ToPixel()에 전달하여 반환한다.

    setAutoSpeed(use?: boolean) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            use가 없으면 true를 적용하고 _useAutoSpeed에 저장한다.

    updateData() -> void
        동작:
            setUpdateDate()를 호출한다.

    syncCamera(app: U3dApp, reactiveOffset?: number) -> string | null | undefined
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            Web API — 직접 런타임 연계; 함수: {console.info(), console.warn()}
            U3dObject — 상속된 기반 객체·이벤트 API; 함수: {on()}
            U3dObject — 상속된 기반 객체·이벤트 API; 함수: {once()}
        동작:
            app이 없으면 안내 후 undefined로 종료한다. [확인 Q-106]
            지역 setControlCam()을 앱 this로 즉시 호출하고 change 이벤트에도 같은 동기화를 등록한다.
            앱 EVENT.LOADED에 한 번 동기화를 등록하며 change 리스너 식별자를 반환한다.
            setControlCam()은 원본 또는 대상 지도 컨트롤이 없으면 경고 후 종료한다.
            현재 카메라 위치 복제본에 reactiveOffset이 정의되고 양수이면 원본 타겟으로부터 거리를 해당 비율로 조정한다.
            대상 카메라 위치와 target에 원본 위치 복제본과 target을 복사한다.
            원본 getPolarAngle,getAzimuthalAngle 함수 객체 자체를 대상 setPolarAngle(),setAzimuthalAngle()에 전달한다.
            대상 update(false,false),end 이벤트 dispatch 뒤 대상 app.setUpdateDate()를 호출한다.

    registerRemoveModel(data: Array<KeyValue> | KeyValue) -> void
        동작:
            배열이면 각 항목에 재귀 호출한다.
            그 외 Object이면 registerRemoveModelByObject()를 앱 this로 호출한다.

    deleteRemoveModel(data: Array<KeyValue> | KeyValue) -> void
        동작:
            배열이면 각 항목에 재귀 호출한다.
            그 외 Object이면 deleteRemoveModelByObject()를 앱 this로 호출한다.

    removeModel(data: Array<KeyValue> | KeyValue) -> void
        동작:
            배열이면 각 항목에 재귀 호출한다.
            UMesh이면 removeModelByUMesh()를 앱 this로 호출한다.
            그 외 Object이면 removeModelByObject()를 앱 this로 호출한다.

    cancelAllRemoveModel() -> void
        동작:
            falsy _removedModel을 빈 배열로 초기화한다.
            각 기록에 cancelRemoveModel(layer,uid,true)를 호출하여 반복 중 기록을 유지한다.
            _removedModel을 새 빈 배열로 교체한다.

    cancelRemoveModel(layerName: string, uid: string|number, autoSave) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            U3dLayer — 직접 런타임 연계; 함수: {cancelRemoveByUid()}
        동작:
            _removedModel에서 layerName,uid가 모두 엄격히 같은 첫 기록의 idx를 찾는다.
            idx가 defined가 아니면 종료한다.
            찾은 기록의 layer 이름으로 getLayer()를 조회한다.
            조회 레이어가 defined이면 기록의 uid로 cancelRemoveByUid()를 호출한다.
            autoSave가 falsy이면 _removedModel에서 해당 idx의 기록을 제거한다.

    getRemovedModelList() -> Array<KeyValue>
        동작:
            this._removedModel 결과를 반환한다.

    getRemovedModel(layerName: string, uid: string) -> object
        동작:
            layerName,uid가 엄격히 같은 첫 기록 또는 undefined를 반환한다.

    disableCameraMove(bool?: boolean) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            bool이 없으면 false,정의되면 논리 부정값을 사용한다.
            컨트롤이 있으면 enableZoom,enablePan,enableRotate에 계산한 값을 저장한다.

    disableCameraZoom(bool?: boolean) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            bool이 없으면 false,정의되면 논리 부정값을 사용한다.
            컨트롤이 있으면 enableZoom에 계산한 값을 저장한다.

    disableCameraPan(bool?: boolean) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            bool이 없으면 false,정의되면 논리 부정값을 사용한다.
            컨트롤이 있으면 enablePan에 계산한 값을 저장한다.

    disableCameraRotate(bool?: boolean) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            bool이 없으면 false,정의되면 논리 부정값을 사용한다.
            컨트롤이 있으면 enableRotate에 계산한 값을 저장한다.

    setCameraDownRotate(value: number, isDegree: boolean = true) -> void
        의존:
            __GInfo__ — 직접 런타임 연계; 함수: {__GInfo__()}
            THREE — 직접 런타임 연계; 정적 함수: {MathUtils.radToDeg()}
            UMapControls — 직접 런타임 연계; 함수: {rotateDownDegree(), update()}
        동작:
            컨트롤이 없으면 안내하되 계속 진행한다.
            isDegree가 false이면 radToDeg()로 변환하고 rotateDownDegree() 뒤 update()를 호출한다.

    setCameraLeftRotate(value: number, isDegree: boolean = true) -> void
        의존:
            __GInfo__ — 직접 런타임 연계; 함수: {__GInfo__()}
            THREE — 직접 런타임 연계; 정적 함수: {MathUtils.radToDeg()}
            UMapControls — 직접 런타임 연계; 함수: {rotateLeftDegree(), update()}
        동작:
            컨트롤이 없으면 안내하되 계속 진행한다.
            isDegree가 false이면 radToDeg()로 변환하고 rotateLeftDegree() 뒤 update()를 호출한다.

    setCameraLimitDistance(min: Number, max: Number) -> void
        의존:
            UMapControls — 직접 런타임 연계; 함수: {getFactor()}
        동작:
            컨트롤과 getFactor가 있으면 truthy min,max만 factor.minDistance,maxDistance에 저장한다.

    resetCameraLimitDistance() -> void
        의존:
            UMapControls — 직접 런타임 연계; 함수: {getFactor()}
        동작:
            컨트롤과 getFactor가 있으면 minDistance를 기본 최소값,maxDistance를 최소 줌의 resolution*0.7로 설정한다.

    setCollisionFactor(factor: number) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UMapControls — 직접 런타임 연계; 함수: {getFactor()}
        동작:
            factor가 없으면 종료한다.
            컨트롤이 있으면 factor.collisionFactor에 저장한다.

    getCollisionFactor() -> number
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UMapControls — 직접 런타임 연계; 함수: {getFactor()}
        동작:
            컨트롤이 있으면 getFactor().collisionFactor를,없으면 undefined를 반환한다. [확인 Q-125]

    editedMesh(mesh, editedEvent) -> void
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
            UMesh — 직접 런타임 연계; 함수: {getLayerName(), position.copy()}
            U3dLayer — 직접 런타임 연계; 함수: {editedModel(), setTileFromEditedModel()}
        동작:
            mesh.getLayerName이 defined가 아니면 종료한다.
            mesh.getLayerName이 defined인 경우:
                mesh.getLayerName()으로 얻은 레이어 이름을 getLayerByName()에 전달한다.
                조회 layer와 mesh._tile이 모두 defined인 경우:
                    editedEvent.position을 mesh.position에 복사한다.
                    editData.rotate의 _x,_y,_z 중 하나가 0이 아니면 세 회전값을 모두 반영한다.
                    editData.scale의 x,y,z 중 하나가 1이 아니면 세 스케일값을 모두 반영한다.
                    layer.editedModel과 layer.setTileFromEditedModel이 모두 truthy이면 editedModel(mesh,editedEvent) 뒤 setTileFromEditedModel(mesh,layer,layer._drawArg)을 호출한다.

    getLightdIsSelected(e: U3dMouseEvent | MouseEvent) -> USpotLight | undefined
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            light의 _scene을 모아 intersectFromScene()에 전달한다.
            교차 배열이 비었으면 undefined를 반환한다.
            _type=controlObj인 교차 객체의 _parents 중 마지막 값을 _selected에 저장해 반환하며 없으면 undefined를 반환한다.

    getViewIsSelected(e: U3dMouseEvent | MouseEvent) -> U3dView | undefined
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            view의 scene을 모아 intersectFromScene()에 전달한다.
            교차 배열이 비었으면 undefined를 반환한다.
            _type=controlObj인 교차 객체의 _parents 중 마지막 값을 _selected에 저장해 반환하며 없으면 undefined를 반환한다.

    setDegreeToRadian(degree: Degree) -> Radian | undefined
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            degree가 정의되지 않았으면 undefined를,그 외에는 degree*π/180을 반환한다.

    setRadianToDegree(radian: Radian) -> Degree | undefined
        의존:
            defined — 직접 런타임 연계; 함수: {defined()}
        동작:
            radian이 정의되지 않았으면 undefined를,그 외에는 radian*180/π를 반환한다.

    getTerrainShadowLevel() -> number
        의존:
            UDrawArg — 직접 런타임 연계; 함수: {getTerrainShadowLevel()}
            UDEF — 지형 그림자 기본 레벨; 상수: {DEFAULT_TERRAIN_SHADOW_LEVEL}
        동작:
            this._drawArg.getTerrainShadowLevel() 결과를 반환한다.

    setTerrainShadowLevel(terrainShadowLevel: number = UDEF.DEFAULT_TERRAIN_SHADOW_LEVEL) -> void
        의존:
            UDrawArg — 직접 런타임 연계; 함수: {setTerrainShadowLevel()}
            UDEF — 지형 그림자 기본 레벨; 상수: {DEFAULT_TERRAIN_SHADOW_LEVEL}
        동작:
            drawArg.setTerrainShadowLevel(terrainShadowLevel)를 호출한다.

    getImproveLevel() -> string
        동작:
            UDEF.IMPROVE_TEXTURE_LEVEL 값이 _improveTexture와 같은 첫 키 또는 undefined를 반환한다. [확인 Q-126]

    getImproveValue() -> number
        동작:
            this._improveTexture 결과를 반환한다.

    setImproveValue(value: string) -> void
        동작:
            UDEF.IMPROVE_TEXTURE_LEVEL[value]가 truthy일 때만 _improveTexture에 저장한다.

setStyleDrawSunAmount(mesh, total) -> string
    동작:
        total<0이면 #6FED9C를 반환한다.
        그 외 total을 0~900으로 제한하고 [0,100),[100,200),[200,250),[250,300),[300,350),[350,400),[400,450),[450,500),[500,550),[550,600),[600,700),[700,900)의 경계로 색상 구간을 고른다.
        색상은 순서대로 #FFFFDB,#FFFF73,#FFFF00,#FFDC00,#FFD200,#FFBE00,#FFA000,#FF8200,#FF6E00,#FF6400,#FF4600,#FF0000이며 900은 마지막 색상을 사용한다.
        mesh는 사용하지 않는다.

getIntersectNormal(vector, intersect) -> {normal: Vector3, point: Vector3} | undefined
    인터페이스: this는 호출한 U3dApp이다.
    의존:
        THREE — 직접 런타임 연계; 정적 함수: {new THREE.Vector3()}
        URaycaster — 직접 런타임 연계; 생성자: {new URaycaster()}
        URaycaster — 직접 런타임 연계; 함수: {set(), intersectObjects()}
        __GInfo__ — 직접 런타임 연계; 함수: {__GInfo__()}
    동작:
        intersect가 undefined이면 undefined를 반환한다.
        mesh boundingSphere.center를 월드로 바꾸고 vector 방향의 URaycaster를 만든다.
        같은 uuid의 UMesh 또는 THREE.Mesh 교차 중 vector와 거리가 가장 가까운 항목을 찾는다.
        교차 배열이 비었으면 안내한다.
        선택 교차의 face.normal,point 또는 입력 intersect의 face.normal,point를 반환한다.

drawSunAmount(total, vector, drawOpt, intersect) -> void
    인터페이스: this는 호출한 U3dApp이다.
    의존:
        THREE — 직접 런타임 연계; 정적 함수: {new THREE.Vector3(), new THREE.Box3(), new THREE.Plane()}
        UGroup — 직접 런타임 연계; 생성자: {new UGroup()}
        UScene — 직접 런타임 연계; 함수: {add()}
        defined — 직접 런타임 연계; 함수: {defined()}
        UMesh — 직접 런타임 연계; 함수: {position.distanceTo(), material.dispose(), setManualUpdate()}
        UGroup — 직접 런타임 연계; 함수: {add(), scale.multiplyScalar()}
    동작:
        drawOpt.boxWidth 또는 drawOpt.boxNum이 falsy이면 종료한다. [확인 Q-108]
        vector를 내림한 중심과 boxNum 범위의 rootBox를 만들고 name과 _totalSunAmount를 설정한 UGroup을 Scene에 추가한다.
        findIntersectingCubes()로 기존 겹침 큐브를 구한 뒤 createCubes()로 신규 후보를 구한다.
        drawOpt.usePlane이 truthy인 경우:
            교차 대상 geometry가 UPlaneBufferGeometry가 아닌 경우:
                renderer.localClippingEnabled를 true로 설정하고 getIntersectNormal()을 앱 this로 호출한다.
                노멀 결과가 defined이면 normal과 point로 clipping 평면을 만든다.
        각 후보 큐브에 checkCollision(intersect.object,cube)을 적용한다.
            충돌 결과가 true인 경우:
                drawCube()를 앱 this로 호출해 mesh를 만들고 castShadow,receiveShadow를 false로 설정한다.
                평면이 있고 평면 거리에 width/2를 더한 값이 0보다 작으면 해당 mesh의 후속 처리를 건너뛴다.
                기존 교차 큐브 중 mesh와의 거리가 width/2 미만인 항목을 순회한다.
                    intersectTotal은 0에서 시작하여 truthy이고 기존 total보다 작을 때만 갱신되므로 현재 기존 일조량 병합은 작동하지 않는다.
                    intersectCube.parent가 truthy이면 parent에서 기존 큐브를 제거한다.
                    기존 큐브를 교차 검색 배열에서도 제거하고 인덱스를 되돌려 순회를 이어간다.
                intersectTotal이 양수이면 기존 값과 total의 평균을, 그 외에는 total을 cube.total로 저장한다.
                drawOpt.styleFun을 앱 this로 호출한다.
                반환 color가 falsy이면 setStyleDrawSunAmount()를 앱 this로 호출하여 색을 구한다.
                기존 material을 dispose한 뒤 getCubeMaterial()을 앱 this로 호출한 공유 material로 교체한다.
                mesh를 group에 추가하고 setManualUpdate()를 호출한다.
        group.scale을 width배하고 light._sunAmountDrawMesh에 group을 저장한다.

getCubeMaterial(color, plane) -> THREE.MeshBasicMaterial
    의존:
        THREE — 직접 런타임 연계; 정적 함수: {new THREE.MeshBasicMaterial()}
    동작:
        color와 plane이 있으면 소수 셋째 자리로 반올림한 constant,normal 성분을 합쳐 캐시 키를 만든다.
        캐시에 없으면 DoubleSide,opacity=0.8,transparent=true,fog=false,forceSinglePass=true,precision=lowp MeshBasicMaterial을 만들고 plane이 있으면 clippingPlanes에 저장한다.
        공유 material을 반환한다.

drawCube(rect) -> UMesh
    의존:
        THREE — 직접 런타임 연계; 정적 함수: {new THREE.Vector3(), new THREE.BufferAttribute()}
        UBufferGeometry — 직접 런타임 연계; 생성자: {new UBufferGeometry()}
        UMesh — 직접 런타임 연계; 생성자: {new UMesh()}
        UMesh — 직접 런타임 연계; 함수: {position.copy(), setManualUpdate()}
    동작:
        rect의 여덟 정점과 평균 중심을 구한다.
        sharedGeometry가 없을 때만 중심 상대 정점과 6면 인덱스로 UBufferGeometry를 만들고 boundingBox를 계산한다.
        공유 geometry의 UMesh를 만들고 exceptAO=true,위치=중심,setManualUpdate()를 적용해 반환한다.

findIntersectingCubes(rootBox, prevCubes, total, uuid) -> UMesh[]
    의존:
        UGroup — 직접 런타임 연계; 함수: {children.forEach()}
    동작:
        prevCubes 중 uuid가 입력과 같은 group을 제외한다.
        각 자식 geometry boundingBox의 복제본에 matrixWorld를 적용한다.
        rootBox와 intersectsBox()인 자식 mesh 배열을 반환한다.

createCubes(startX, startY, startZ, length, width) -> THREE.Box3[]
    의존:
        THREE — 직접 런타임 연계; 정적 함수: {new THREE.Box3(), new THREE.Vector3()}
    동작:
        0 이상 length 미만인 i,j,k를 width 간격으로 반복한다.
        start 좌표에 각 오프셋과 width를 더한 여덟 정점의 Box3를 만들고 배열로 반환한다.

checkCollision(mesh, cubeBox) -> boolean
    의존:
        UMesh — 직접 런타임 연계; 함수: {geometry.computeBoundsTree(), geometry.boundsTree.intersectsBox()}
        THREE — 직접 런타임 연계; 정적 함수: {new THREE.Matrix4()}
    동작:
        mesh.geometry가 없으면 false를 반환한다.
        boundsTree가 없으면 computeBoundsTree()로 생성한다.
        mesh.matrixWorld의 역행렬로 cubeBox를 로컬로 해석한 boundsTree.intersectsBox() 결과를 반환한다.

setMapRegion(region: MapRegion, options?: MapRegionTransitionOptions) -> Promise<boolean>
    입력:
        MapRegion은 UDEF.MAP_REGION의 문자열 값에서 유도한다.
        UDEF.MAP_REGION.WORLD='world', KOREA='korea', CUSTOM='custom'을 사용하며 기존 문자열 입력도 유지한다.
    동작:
        korea, world, custom을 구분한다. custom 범위 생략 시 마지막 성공 범위 또는 기본 타일을 사용한다.
        전체 옵션은 선택이고 baseLayerName 생략 시 현재 배경을 유지한다.
        목적 영역의 시작 레벨이 앱의 _maxlevel을 넘으면 현재 영역·진행 중 이동을 유지하고 거절한다.
        view의 경도·위도·거리·방위·기울기는 모두 선택이며 생략 값은 현재 카메라에서 읽는다.
        수직 시점은 위치와 별도로 방위각을 전달해 실제 화면 방향과 컨트롤 각도를 유지한다.
        즉시·애니메이션·일반 갱신·실패 복구에서 같은 방향 규칙을 사용하며 현재 모드의 회전 제한을 우선한다.
        생략한 시점은 목적 경계와 거리 제한에 맞추며, 명시한 좌표 축이 영역 밖이면 거절한다.
        duration 기본은 100ms이며 0은 즉시 적용한다.
        영역 종류 또는 사용자 타일 인덱스가 바뀌면 restartQuadTree 공통 경로로 트리를 교체한다.
        동일 영역·동일 타일은 트리와 현재 카메라 제한을 유지한다.
        영역 종류나 타일이 달라지면 목적 영역의 기본 줌·최대 거리·far를 계산하고 현재 최소 거리를 유지한다. 이전 영역의 사용자 제한은 재사용하지 않는다.
        영역 적용 직전의 범위·카메라·제한·배경은 실패 복구에만 사용하고 적용 처리 종료 시 복사본 참조를 제거한다.
        예약된 트리 재시작까지 성공한 뒤에만 customIndex를 갱신하므로 실패한 범위가 이후 생략 요청에 남지 않는다.
        적용이 끝난 뒤 이동 중단·실패는 적용 영역을 유지하며 이전 요청 취소 계약도 유지한다.
        getMapRegion은 custom 생성·전환을 custom으로 반환한다.

removeModelByObject(obj) -> void
    인터페이스: this는 호출한 U3dApp이다.
    동작:
        obj.layer,obj.uid를 앱 this로 removeModel_()에 전달한다.

removeModelByUMesh(mesh) -> void
    인터페이스: this는 호출한 U3dApp이다.
    의존:
        UMesh — 직접 런타임 연계; 함수: {getUid(), getLayerName()}
    동작:
        mesh.getLayerName(),mesh.getUid()를 앱 this로 removeModel_()에 전달한다.

removeModel_(layerName, uid) -> void
    인터페이스: this는 호출한 U3dApp이다.
    의존:
        defined — 직접 런타임 연계; 함수: {defined()}
        U3dLayer — 직접 런타임 연계; 함수: {removeModelByUid()}
    동작:
        layerName 레이어가 없거나 같은 삭제 기록이 있으면 종료한다.
        레이어 removeModelByUid(uid) 뒤 addRemovedModelInfo()를 호출한다.

addRemovedModelInfo(layerName, uid) -> void
    인터페이스: this는 호출한 U3dApp이다.
    동작:
        falsy _removedModel을 빈 배열로 초기화하고 {layer:layerName,uid:uid.toString()}을 추가한다.

deleteRemoveModelByObject(obj) -> void
    인터페이스: this는 호출한 U3dApp이다.
    동작:
        obj.layer,obj.uid를 앱 this로 deleteRemoveModel_()에 전달한다.

deleteRemoveModel_(layerName, uid) -> void
    인터페이스: this는 호출한 U3dApp이다.
    의존:
        defined — 직접 런타임 연계; 함수: {defined()}
        U3dLayer — 직접 런타임 연계; 함수: {deleteRemovedUidList()}
    동작:
        레이어가 없으면 종료한다.
        앱 cancelRemoveModel(layerName,uid) 뒤 layer.deleteRemovedUidList(uid)를 호출한다.

registerRemoveModelByObject(obj) -> void
    인터페이스: this는 호출한 U3dApp이다.
    동작:
        obj.layer,obj.uid를 앱 this로 resigterRemoveModel_()에 전달한다.

resigterRemoveModel_(layerName, uid) -> void
    인터페이스: this는 호출한 U3dApp이다.
    의존:
        defined — 직접 런타임 연계; 함수: {defined()}
        U3dLayer — 직접 런타임 연계; 함수: {registerRemovedUidList()}
    동작:
        레이어가 없으면 종료한다.
        layer.registerRemovedUidList(uid) 뒤 addRemovedModelInfo()를 호출한다.

getFristPoint(intersects) -> WorldPositionVector3 | undefined
    동작:
        intersects[0]이 있으면 해당 point를 반환한다.
        접근 예외는 무시하며 첫 항목이 없으면 undefined를 반환한다.

getOverlayWrapper() -> HTMLElement
    인터페이스: this는 호출한 U3dApp이다.
    의존:
        defined — 직접 런타임 연계; 함수: {defined()}
        Web API — 직접 런타임 연계; 함수: {document.createElement()}
        Web API — 래퍼 DOM 조회·배치; 함수: {HTMLElement.appendChild(), HTMLElement.getElementsByClassName()}; 속성 읽기·쓰기: {HTMLElement.style}
    동작:
        container()의 u3d-overlay-wrapper 클래스 요소를 조회한다.
        조회 결과가 없거나 비었으면 div를 만들고 해당 class와 absolute 위치를 적용하여 컨테이너에 추가한다.
        기존 요소가 있으면 첫 항목을 사용하며 DOM을 반환한다.

getDomElementFromMaybeWrapped(element) -> HTMLElement | undefined
    의존:
        Web API — DOM 요소 판별; 속성 읽기: {Node.nodeType}
    동작:
        element.nodeType=1이면 element를 반환한다.
        element[0].nodeType=1이면 element[0]을 반환한다.
        그 외에는 undefined를 반환한다.

getViewLightWrapper() -> HTMLElement
    인터페이스: this는 호출한 U3dApp이다.
    의존:
        defined — 직접 런타임 연계; 함수: {defined()}
        Web API — 직접 런타임 연계; 함수: {document.createElement()}
        Web API — 래퍼 DOM 조회·배치; 함수: {HTMLElement.appendChild(), HTMLElement.getElementsByClassName()}; 속성 읽기·쓰기: {HTMLElement.style}
    동작:
        container()의 u3d-view-light-wrapper 클래스 요소를 조회한다.
        조회 결과가 없거나 비었으면 div를 만들고 해당 class와 absolute 위치를 적용하여 컨테이너에 추가한다.
        기존 요소가 있으면 첫 항목을 사용하며 DOM을 반환한다.

getViewWrapper() -> HTMLElement
    인터페이스: this는 호출한 U3dApp이다.
    의존:
        defined — 직접 런타임 연계; 함수: {defined()}
        Web API — 직접 런타임 연계; 함수: {document.createElement()}
        Web API — 래퍼 DOM 조회·배치; 함수: {HTMLElement.appendChild(), HTMLElement.getElementsByClassName()}; 속성 읽기·쓰기: {HTMLElement.style}
    동작:
        container()의 u3d-view-wrapper 클래스 요소를 조회한다.
        조회 결과가 없거나 비었으면 div를 만들고 해당 class와 absolute 위치를 적용하여 컨테이너에 추가한다.
        기존 요소가 있으면 첫 항목을 사용하며 DOM을 반환한다.

stopTween_() -> void
    인터페이스: this는 호출한 U3dApp이다.
    의존:
        defined — 직접 런타임 연계; 함수: {defined()}
    동작:
        정의된 _tweenFrom2Mid,_tweenMid2To에 stop()을 호출한다.
        _isTwenning이 true이면 두 tween을 다시 정지시키고 참조를 undefined로 비우며 _isTwenning=false로 설정한다.

stopFly_() -> void
    인터페이스: this는 호출한 U3dApp이다.
    의존:
        defined — 직접 런타임 연계; 함수: {defined()}
    동작:
        _isCameraRest이면 종료한다.
        _currentTween이 있으면 stop() 뒤 undefined로 해제한다.

clipAxis(type, value) -> void
    인터페이스: this는 호출한 U3dApp이다.
    동작:
        앱 CLIP_X,CLIP_Y,CLIP_Z 속성을 모두 undefined로 비운다.
        type=x,y,z에 대해 value가 THREE.Plane이면 해당 속성에 constant를 저장하고 입력 plane을 _clippingPlanes로 설정한다.
        숫자 입력이면 해당 속성과 전역 plane.constant를 저장하고 전역 plane을 _clippingPlanes로 설정한다.
        미지원 type이면 Error를 던진다.
        CLIP.AXIS 속성을 type으로 저장하고 updateData()를 호출한다.

clipAxisByRatio(type: string, value: number | string = 0) -> void
    인터페이스: this는 호출한 U3dApp이다.
    동작:
        문자열 value를 Number로 변환한다.
        type=x,y,z에 따라 setClippingAxisX/Y/Z()에 plane을 전달한다.

initMapControl(control) -> UMapControls
    인터페이스: this는 호출한 U3dApp이다.
    의존:
        UMapControls — 직접 런타임 연계; 함수: {setApp(), addEventListener()}
        U3dAppEventHandler — 직접 런타임 연계; 함수: {onStart(), onEnd()}
    동작:
        앱 pan,rotate,zoom 속도와 거리 제한을 초기화한다.
        control.setApp(this)를 호출한다.
        start,end 이벤트에 control.enabled일 때만 앱 이벤트 핸들러 onStart(),onEnd()를 호출하는 리스너를 등록한다.
        control을 반환한다.

setWalkMode_(position, target, minHeight) -> void
    인터페이스: this는 호출한 U3dApp이다.
    의존:
        UWalkControls — 직접 런타임 연계; 함수: {setMinHeight(), getMinHeight()}
        THREE — 직접 런타임 연계; 정적 함수: {MathUtils.radToDeg()}
        UMapControls — 직접 런타임 연계; 함수: {getAzimuthalAngle(), removeEventListener(), addEventListener()}
    동작:
        walk 컨트롤 최소 높이를 설정하고 원본 position.z를 최소 높이 이상으로 바꾼다.
        flyToPosition() 뒤 flyend 리스너를 등록한다.
        flyend에서 mode=WALK,walk.lat=현재 방위각 degree,walk.object.position.z=최소 높이를 적용한다.
        리스너를 제거하고 map 컨트롤 deactive() 뒤 activeMode("walk")를 호출한다.

createWalkControls() -> void
    인터페이스: this는 호출한 U3dApp이다.
    의존:
        UWalkControls — 직접 런타임 연계; 생성자: {new UWalkControls()}
    동작:
        drawarg,camera,domelement로 UWalkControls를 만든다. [확인 Q-109]
        movementSpeed=20,lookVertical=true,activeLook=false를 설정한다.
        _walkControl과 _controls.walk에 저장하고 eanbled=false를 설정한다.

createFlyControls() -> void
    인터페이스: this는 호출한 U3dApp이다.
    의존:
        UFlyControls — 직접 런타임 연계; 생성자: {new UFlyControls()}
    동작:
        drawarg,camera,domelement,automove로 UFlyControls를 만든다. [확인 Q-109]
        movementSpeed=100,rollSpeed=π/12,autoForward=true,dragToLook=false를 설정한다.
        _flyControl과 _controls.fly에 저장하고 eanbled=false를 설정한다.

listenEndWork(self: U3dApp, callback: Function, param: unknown) -> void
    의존:
        defined — 직접 런타임 연계; 함수: {defined()}
        Web API — 직접 런타임 연계; 함수: {setTimeout()}
    동작:
        self.getWorkingLevel2()<=0이면 정의된 callback을 self this와 param으로 호출하고 종료한다.
        그 외에는 같은 self,callback,param으로 500ms 뒤 다시 실행한다.

rotateObject(model, scene, degreeX, degreeY, degreeZ) -> void
    의존:
        defined — 직접 런타임 연계; 함수: {defined()}
    동작:
        scene.getObjectById(model._meshIDs[0])로 mesh를 찾는다.
        mesh와 mesh.geometry가 모두 defined인 경우:
            mesh.visible을 true로 설정한다.
            degreeX가 변환 전 defined인 경우:
                degreeX를 degreeX*Math.PI/180으로 변환한 결과를 mesh.rotation.x에 저장한다.
            degreeY가 변환 전 defined인 경우:
                degreeY를 degreeY*Math.PI/180으로 변환한 결과를 mesh.rotation.y에 저장한다.
            degreeZ가 변환 전 defined인 경우:
                degreeZ를 degreeZ*Math.PI/180으로 변환한 결과를 mesh.rotation.z에 저장한다.

getEmapGeoExtent_() -> number[]
    동작:
        ol.proj.get()으로 EPSG:5179와 EPSG:4326을 조회한다.
        5179 getExtent()의 두 모서리를 4326으로 transform()하여 [minX,minY,maxX,maxY]를 반환한다.

pad(n, width, z) -> string
    동작:
        falsy z는 0 문자로 적용하고 n을 문자열로 변환한다.
        길이가 width 이상이면 그대로 반환하며 짧으면 부족한 길이만큼 z를 앞에 붙여 반환한다.

makeName() -> string
    의존: UDEF — 앱 이름 순번; 속성 읽기·쓰기: {appNameCount}
    동작:
        appNameCount가 undefined이면 1로 만들고 U3dApp_ 접두어에 현재 순번을 붙여 반환하면서 전역 순번을 증가시킨다.

DEFAULT_TMS_MAX_ZOOM: number = 19
    TMS 메타데이터에 유효한 원본 최대 줌이 없을 때 사용하는 호환 기본값이다.

MAX_TMS_SOURCE_ZOOM: number = 32
    비정상 입력으로 원본 해상도 배열이 과도하게 커지지 않도록 제한하는 TMS 원본 줌 상한이다.

DEFAULT_TMS_MIN_ZOOM: number = 14
    TMS 메타데이터에 유효한 원본 최소 줌이 없을 때 우선 적용하는 기존 호환값이다.

DEFAULT_TMS_ENGINE_MAX_LEVEL: number = 19
    U3dLayer 기본값과 동일하게 사용하는 TMS 엔진 최대 레벨 기본값이다.

MAX_TMS_ENGINE_LEVEL: number = 32
    비정상 입력으로 비-Mercator 엔진 레벨 환산이 과도하게 반복되지 않도록 제한하는 상한이다.

DEFAULT_TMS_TILE_SIZE: number = 256
    TMS 메타데이터에 타일 너비가 생략됐을 때 OpenLayers와 동일하게 사용하는 기본값이다.

parseTMSLevel(value: *) -> number | undefined
    동작:
        숫자 또는 비어 있지 않은 숫자 문자열을 Number로 변환하고 0 이상의 안전한 정수이면 반환한다.
        그 밖의 타입, 일부만 숫자인 문자열, 빈 문자열, NaN·Infinity·음수·소수·안전한 정수 범위 밖의 값이면 undefined를 반환한다.

parseTMSBoolean(value: *) -> boolean | undefined
    동작:
        boolean 값은 그대로 반환한다.
        문자열은 양끝 공백을 제거하고 소문자로 변환한 값이 true 또는 false이면 대응하는 boolean을 반환한다.
        그 밖의 문자열과 타입은 JavaScript의 truthy/falsy 값으로 강제 변환하지 않고 undefined를 반환한다.

parseFiniteTMSNumber(value: *) -> number | undefined
    동작:
        숫자 또는 비어 있지 않은 숫자 문자열을 Number로 변환하고 유한수이면 반환한다.
        그 밖의 타입, 빈 문자열, NaN·Infinity이면 undefined를 반환한다.

normalizeTMSBoundingBox(boundingBox: *) -> object | undefined
    의존:
        defined — 정규화한 네 좌표의 존재 검사; 함수: {defined()}
    동작:
        객체가 아니면 undefined를 반환한다.
        minx·miny·maxx·maxy를 각각 유한수로 변환한 새 객체를 만든다.
        네 값이 모두 존재하고 minx<maxx·miny<maxy이면 새 객체를 반환하며, 아니면 undefined를 반환한다.

normalizeTMSOrigin(origin: *) -> object | undefined
    의존:
        defined — 정규화한 x·y의 존재 검사; 함수: {defined()}
    동작:
        객체가 아니면 undefined를 반환한다.
        x·y를 각각 유한수로 변환한다. 둘 다 유효하면 새 {x, y} 객체를 반환하고 하나라도 무효이면 undefined를 반환한다.

copyWithoutTMSLevelAliases(option: object) -> object
    동작:
        option의 얕은 복사본을 만든다.
        키를 소문자로 바꾼 값이 minlevel 또는 maxlevel인 모든 속성을 복사본에서 제거하고 반환한다.

calculateNonMercatorTMSMinLevel(option: object) -> number | undefined
    의존:
        defined — 투영과 proj4 정의 존재 검사; 함수: {defined()}
        UMathEngine — 엔진 레벨별 월드 좌표(EPSG:3857) 해상도; 정적 함수: {googleResolution()}
        OpenLayers(ol) — 투영 등록·좌표 변환·source 해상도 계산; 함수: {proj.get(), proj.setProj4(), proj.transform(), reproj.calculateSourceResolution()}
        전역 __UNION3D__.proj4 — 미등록 source 좌표계 정의; 함수: {defs()}
    동작:
        요청 차단 레벨을 maxEngineLevel+1로 정한다.
        source 좌표계가 등록되지 않았고 projectionDefinition이 있으면 전역 proj4를 OpenLayers에 연결하고 srs 정의를 등록한 뒤 다시 조회한다.
        source·EPSG:3857 투영, 양의 sourceMinResolution, 유한한 경계가 하나라도 없으면 undefined를 반환한다.
        source 경계의 x·y 각각 최소·중앙·최대 조합 9개를 EPSG:3857로 변환한다. 변환 결과가 하나라도 유한하지 않으면 undefined를 반환한다.
        0부터 maxEngineLevel까지 순회하며 각 엔진 해상도를 9개 표본 위치의 source 해상도로 환산한다.
        표본의 source 해상도가 양의 유한수가 아니면 undefined를 반환한다.
        모든 표본의 환산 해상도가 sourceMinResolution 이하가 되는 첫 레벨을 반환한다.
        상한까지 조건을 만족하지 않으면 안전한 레벨이 없음을 나타내도록 maxEngineLevel+1을 반환한다.
        투영 등록·변환·계산이 예외를 내면 undefined를 반환한다.

U3dAppEMD: U3dAppEMI
    U3dAppEventHandler.EVENT를 펼친 공유 공개 이벤트 객체이다.
U3dAppEMD.LAYER_CREATE: string = 'layer-create'

U3dAppAnalysis: U3dApp_Analysis
    분석 이름의 공유 공개 대응 객체이다.
U3dAppAnalysis.AREA: string = 'Area'
U3dAppAnalysis.DISTANCE: string = 'Distance'
U3dAppAnalysis.HEIGHT: string = 'Height'
U3dAppAnalysis.CONTOUR: string = 'Contour'
U3dAppAnalysis.LAND_SCAPE: string = 'LandScape'
U3dAppAnalysis.SURFACE_VOLUME: string = 'SurfaceVolume'
U3dAppAnalysis.SLOPE: string = 'Slope'
U3dAppAnalysis.GIZMO_MODEL: string = 'GizmoModel'
U3dAppAnalysis.ALIGN_MODEL: string = 'AlignModel'
U3dAppAnalysis.MULTIPLE_COMPONENT: string = 'multipleComponent'
U3dAppAnalysis.ROAD: string = 'Road'
U3dAppAnalysis.CUSTOM_MODEL: string = 'CustomModel'
U3dAppAnalysis.SLOPE_ASPECT: string = 'SlopeAspect'
U3dAppAnalysis.CUSTOM_LAND: string = 'CustomLand'
U3dAppAnalysis.ROUTE: string = 'Route'
U3dAppAnalysis.AVERAGE_HEIGHT: string = 'AverageHeight'
U3dAppAnalysis.HEIGHT_LIMIT: string = 'HeightLimit'
U3dAppAnalysis.VIEW_CONE: string = 'ViewCone'
U3dAppAnalysis.CLIPPING: string = 'Clipping'
U3dAppAnalysis.ALARM: string = 'Alarm'
U3dAppAnalysis.DEPTH: string = 'Depth'
U3dAppAnalysis.SECTION: string = 'Section'
U3dAppAnalysis.PARTICLE: string = 'Particle'
U3dAppAnalysis.SUN_AMOUNT: string = 'SunAmount'
U3dAppAnalysis.PHYSICAL_FLOW: string = 'PhysicalFlow'
U3dAppAnalysis.SKY_LINE: string = 'SkyLine'

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
