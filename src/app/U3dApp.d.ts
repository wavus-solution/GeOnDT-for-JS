// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dComponentPosition } from "../3dLayer/U3dComponentPosition.js";
import type { U3dGridTileLayer } from "../3dLayer/U3dGridTileLayer.js";
import type { U3dGridTileLayerCO } from "../3dLayer/U3dGridTileLayer.types.js";
import type { U3dGroupLayer } from "../3dLayer/U3dGroupLayer.js";
import type { U3dHeightXYZLayer } from "../3dLayer/U3dHeightXYZLayer.js";
import type { U3dHeightXYZLayerCO } from "../3dLayer/U3dHeightXYZLayer.types.js";
import type { U3dImageLayerCO } from "../3dLayer/U3dImageLayer.types.js";
import type { U3dImageWMSLayer } from "../3dLayer/U3dImageWMSLayer.js";
import type { U3dImageWMTSLayer } from "../3dLayer/U3dImageWMTSLayer.js";
import type { U3dImageWMTSLayerCO } from "../3dLayer/U3dImageWMTSLayer.types.js";
import type { U3dImageXYZLayer } from "../3dLayer/U3dImageXYZLayer.js";
import type { U3dLayer } from "../3dLayer/U3dLayer.js";
import type { U3dLayerList } from "../3dLayer/U3dLayerList.js";
import type { U3dLayerListClassifiedLayersOption } from "../3dLayer/U3dLayerList.types.js";
import type { U3dModelBIMObjLayer } from "../3dLayer/U3dModelBIMObjLayer.js";
import type { U3dModelBIMObjLayerCO } from "../3dLayer/U3dModelBIMObjLayer.types.js";
import type { U3dModelLayerCO } from "../3dLayer/U3dModelLayer.types.js";
import type { U3dModelTdsLayer } from "../3dLayer/U3dModelTdsLayer.js";
import type { U3dModelU3FLayer } from "../3dLayer/U3dModelU3FLayer.js";
import type { U3dModelWFSLayer } from "../3dLayer/U3dModelWFSLayer.js";
import type { U3dMultipleComponentLayer, U3dMultipleComponentLayerCO } from "../3dLayer/U3dMultipleComponentLayer.js";
import type { U3dOpenLayer } from "../3dLayer/U3dOpenLayer.js";
import type { U3dOpenLayerCO } from "../3dLayer/U3dOpenLayer.types.js";
import type { U3dPatternXYZLayer } from "../3dLayer/U3dPatternXYZLayer.js";
import type { U3dPatternXYZLayerCO } from "../3dLayer/U3dPatternXYZLayer.types.js";
import type { U3dShaderMeasureLayer } from "../3dLayer/U3dShaderMeasureLayer.js";
import type { U3dTerrainLayer } from "../3dLayer/U3dTerrainLayer.js";
import type { U3dVideoLayer } from "../3dLayer/U3dVideoLayer.js";
import type { UAnaly } from "../analy/UAnaly.js";
import type { UAnimationController } from "../analy/UAnimationController.js";
import type { UAnimationControllerCO } from "../analy/UAnimationController.types.js";
import type { UAnimationManager } from "../analy/UAnimationManager.js";
import type { PIXELRE_SOLUTION_OPTION, U3dAnalysisTypeMap, U3dAppCallbackCopyOption, U3dAppEMI, U3dApp_Analysis } from "./U3dApp.types.js";
import type { UDevToolView } from "./UDevToolView.js";
import type { UAppCommand } from "../cmd/UAppCommand.js";
import type { U3dObject } from "../core/U3dObject.js";
import type { U3dOverviewMap } from "../core/U3dOverviewMap.js";
import type { U3dStats } from "../core/U3dStats.js";
import type { UBox3 } from "../core/UBox3.js";
import type { UCamera } from "../core/UCamera.js";
import type { UCameraState } from "../core/UCameraState.js";
import type { UCollapse } from "../core/UCollapse.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UGroup } from "../core/UGroup.js";
import type { UOrthographicCamera } from "../core/UOrthographicCamera.js";
import type { URaycasterCO } from "../core/URaycaster.js";
import type { URenderer } from "../core/URenderer.js";
import type { PostProcessParam } from "../core/URenderer.types.js";
import type { UScene } from "../core/UScene.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { UFog } from "../effect/UFog.js";
import type { ULensFlare } from "../effect/ULensFlare.js";
import type { UParticleEngine } from "../effect/UParticleEngine.js";
import type { U3dCloud } from "../env/U3dCloud.js";
import type { ULight } from "../env/ULight.js";
import type { USky } from "../env/USky.js";
import type { UUnderground } from "../env/UUnderground.js";
import type { VolumetricFire } from "../env/VolumetricFire.js";
import type { U3dAppEventHandler } from "../event/U3dAppEventHandler.js";
import type { U3dMouseEvent } from "../event/U3dMouseEvent.js";
import type { U3dPOI } from "../geometry/U3dPOI.js";
import type { U3dPOICO } from "../geometry/U3dPOI.types.js";
import type { UFrustumHelper } from "../helpers/UFrustumHelper.js";
import type { UFrustumHelperCO } from "../helpers/UFrustumHelper.types.js";
import type { UFrustumTerrainProjectionHelper, UFrustumTerrainProjectionHelperCO } from "../helpers/UFrustumTerrainProjectionHelper.js";
import type { UIndexManager } from "../manager/UIndexManager.js";
import type { UMixerManager } from "../manager/UMixerManager.js";
import type { UProcessManager } from "../manager/UProcessManager.js";
import type { UTestManager } from "../manager/UTestManager.js";
import type { UShaderTerrainDecalManager } from "../manager/terrain/UShaderTerrainDecalManager.js";
import type { UGeoRect } from "../math/UGeoRect.js";
import type { UCharacterControls } from "../mode/UCharacterControls.js";
import type { UFlyControls } from "../mode/UFlyControls.js";
import type { UMapControls } from "../mode/UMapControls.js";
import type { UOrbitAndPanControls } from "../mode/UOrbitAndPanControls.js";
import type { UPointLockFlyControls } from "../mode/UPointLockFlyControls.js";
import type { UPointerLockControls } from "../mode/UPointerLockControls.js";
import type { UPointerLockDriveControls } from "../mode/UPointerLockDriveControls.js";
import type { UWalkControls } from "../mode/UWalkControls.js";
import type { U3dOverlay, U3dOverlayCO } from "../overlay/U3dOverlay.js";
import type { U3dOverlayManager } from "../overlay/U3dOverlayManager.js";
import type { U3dQuadSet } from "../quadtree/U3dQuadSet.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { U3dSelect } from "../select/U3dSelect.js";
import type { ColorLike, Degree, GeoPosition, GeoPositionVector3, GooglePosition, KeyValue, Radian, WorldPosition, WorldPositionVector3 } from "../types/global.types.js";
import type { DeferredObject } from "../util/deferred.types.js";
import type { U3dView, U3dViewCO } from "../view/U3dView.js";
import type { U3dViewLight } from "../view/U3dViewLight.js";
import type { USpotLight } from "../view/USpotLight.js";

/**
 * 특정 지역 타일 Rectangle 옵션
 */
type TargetRectOption = {
    /**
     * 특정지역 구글맵 인덱스 x 값
     */
    x: number;
    /**
     * 특정지역 구글맵 인덱스 y 값
     */
    y: number;
    /**
     * 특정지역 구글맵 인덱스 level 값
     */
    z: number;
};

/**
 * Emap 계열 레이어를 만들 때 사용하는 공통 옵션
 */
type U3dEmapLayerCO_Content = {
    /**
     * 레이어 이름
     */
    name?: string;
    /**
     * WMTS 또는 템플릿 주소
     */
    baseurl?: string;
    /**
     * 직접 지정한 서비스 주소
     */
    url?: string;
    /**
     * 서비스 레이어 이름
     */
    layername?: string;
    /**
     * 요청 포맷 확장자
     */
    ext?: string;
    /**
     * 서비스 API 키
     */
    apikey?: string;
    /**
     * 프록시 사용 여부
     */
    useProxy?: boolean;
    /**
     * 프록시 주소
     */
    proxy?: string;
    /**
     * 드로잉 인자
     */
    drawarg?: any;
    /**
     * 서비스 적용 범위
     */
    geoextent?: Array<number>;
    /**
     * WMTS 매트릭스셋 이름
     */
    matrixsetname?: string;
    /**
     * 서비스 스타일 이름
     */
    stylename?: string;
    /**
     * EMap 종류
     */
    ekind?: string | number;
    /**
     * 좌표 순서
     */
    xyorder?: string;
};

/**
 * Emap 계열 레이어를 만들 때 사용하는 공통 옵션
 */
type U3dEmapLayerCO = Omit<Omit<U3dOpenLayerCO, never> & U3dEmapLayerCO_Content, never>;

/**
 * Emap 위성(SAT) 레이어 생성용 옵션
 */
type U3dEmapSatLayerCO_Content = {
    /**
     * 위성 서비스 레이어 이름
     */
    layername?: string;
    /**
     * 이미지 포맷
     */
    ext?: string;
    /**
     * 서비스 API 키
     */
    apikey?: string;
    /**
     * 프록시 사용 여부
     */
    useProxy?: boolean;
    /**
     * 프록시 주소
     */
    proxy?: string;
    /**
     * 드로잉 인자
     */
    drawarg?: any;
    /**
     * 서비스 적용 범위
     */
    geoextent?: Array<number>;
    /**
     * WMTS 매트릭스셋 이름
     */
    matrixsetname?: string;
    /**
     * 서비스 스타일 이름
     */
    stylename?: string;
    /**
     * EMap 종류
     */
    ekind?: string | number;
};

/**
 * Emap 위성(SAT) 레이어 생성용 옵션
 */
type U3dEmapSatLayerCO = Omit<Omit<U3dEmapLayerCO, never> & U3dEmapSatLayerCO_Content, never>;

/**
 * WMTS 레이어 생성용 공통 옵션
 */
type U3dWMTSLayerCO_Content = {
    /**
     * 레이어 이름
     */
    name?: string;
    /**
     * WMTS 서비스 URL
     */
    url?: string;
    /**
     * WMTS 기본 URL
     */
    baseurl?: string;
    /**
     * WMTS 레이어 이름
     */
    layername?: string;
    /**
     * 응답 포맷
     */
    ext?: string;
    /**
     * 좌표계
     */
    srs?: string;
    /**
     * 서비스 경계 박스
     */
    boundingbox?: object;
    /**
     * 지리 범위
     */
    geoextent?: Array<number>;
    /**
     * WMTS matrixSet 이름
     */
    matrixsetname?: string;
    /**
     * WMTS 스타일 이름
     */
    stylename?: string;
    /**
     * 프록시 사용 여부
     */
    useProxy?: boolean;
    /**
     * 프록시 주소
     */
    proxy?: string;
    /**
     * 드로잉 인자
     */
    drawarg?: UDrawArg;
    /**
     * 최대 줌 레벨
     */
    maxlevel?: number;
    /**
     * WMTS 해상도 배열
     */
    resolutions?: Array<number>;
    /**
     * capabilities XML 조회 여부
     */
    needXml?: boolean;
    /**
     * WMTS matrixSet 별칭 입력값
     */
    matrixSet?: string;
    /**
     * 내부 보정용 문자열
     */
    re?: string;
};

/**
 * WMTS 레이어 생성용 공통 옵션
 */
type U3dWMTSLayerCO = Omit<Omit<U3dOpenLayerCO, never> & U3dWMTSLayerCO_Content, never>;

/**
 * TMS 레이어 생성용 옵션
 */
type U3dTMSImageLayerCO_Content = {
    /**
     * 레이어 이름
     */
    name?: string;
    /**
     * 타일 서비스 주소
     */
    baseurl: string;
    /**
     * TMS 메타데이터
     */
    metadata: object;
    /**
     * 프록시 사용 여부
     */
    useproxy?: boolean;
    /**
     * 프록시 주소
     */
    proxyurl?: string;
    /**
     * 최소 줌 레벨
     */
    minlevel?: number;
    /**
     * 최대 줌 레벨
     */
    maxlevel?: number;
    /**
     * 드로잉 인자
     */
    drawarg?: any;
};

/**
 * TMS 레이어 생성용 옵션
 */
type U3dTMSImageLayerCO = Omit<Omit<U3dOpenLayerCO, never> & U3dTMSImageLayerCO_Content, never>;

/**
 * 레이어 생성에 자주 쓰이는 공통 옵션
 */
type U3dLayerCommonCO = {
    /**
     * 레이어 이름
     */
    name?: string;
    /**
     * 서비스 주소
     */
    url?: string;
    /**
     * 서비스 기본 주소
     */
    baseurl?: string;
    /**
     * 서비스 레이어 이름
     */
    layername?: string;
    /**
     * 복수 레이어 이름 문자열
     */
    layernames?: string;
    /**
     * 이미지 확장자 또는 포맷
     */
    ext?: string;
    /**
     * 투명 여부
     */
    transparent?: boolean;
    /**
     * Y축 반전 여부
     */
    reverseY?: boolean;
    /**
     * 프록시 사용 여부
     */
    useproxy?: boolean;
    /**
     * 프록시 주소
     */
    proxyurl?: string;
    /**
     * 드로우 인자
     */
    drawarg?: UDrawArg;
    /**
     * 최소 줌/레벨
     */
    minlevel?: number;
    /**
     * 최대 줌/레벨
     */
    maxlevel?: number;
    /**
     * capabilities XML 조회 필요 여부
     */
    needxml?: boolean;
    /**
     * XML 조회 주소
     */
    xmlurl?: string;
    /**
     * 메타데이터
     */
    metadata?: object;
    /**
     * 애니메이션 이름
     */
    animation?: string;
};

/**
 * 3D 모델 그룹 레이어 생성 옵션
 */
type U3dModelGroupLayerCO = U3dLayerCommonCO;

/**
 * U3F 3D 모델 레이어 생성 옵션
 */
type U3d3DFModelLayerCO = {
    /**
     * 레이어 이름
     */
    name: string;
    /**
     * U3F 레이어 이름
     */
    layername: string;
    /**
     * 모델 데이터 기본 주소
     */
    baseurl: string;
    /**
     * U3G 파일 이름 또는 기본 모델 이름
     */
    basename: string;
    /**
     * 모델 확장자
     */
    ext: string;
    /**
     * 그룹 레이어 이름
     */
    grouplayer: string;
    /**
     * 렌더 순서
     */
    renderorder: string;
    /**
     * 최소 레벨
     */
    minlevel?: number;
    /**
     * 최대 레벨
     */
    maxlevel?: number;
    /**
     * 프록시 사용 여부
     */
    useproxy?: boolean;
    /**
     * Y축 반전 여부
     */
    reverseY?: boolean;
    /**
     * 텍스처 사용 여부
     */
    usetexture?: boolean;
    /**
     * 프록시 주소
     */
    proxyurl?: string;
    /**
     * 모델 투명도
     */
    opacity?: number;
    /**
     * U3F 패키지 생성 방식
     */
    makeU3FPackage?: number;
    /**
     * 머티리얼 공유 여부
     */
    isShareMaterial?: number;
    /**
     * 텍스처 갱신 여부
     */
    isTextureUpdate?: boolean;
    /**
     * 텍스처 갱신 거리
     */
    textureDistance?: number;
};

/**
 * TDS 모델 레이어 생성 옵션
 */
type U3dTdsModelLayerCO = {
    /**
     * 레이어 이름
     */
    name: string;
    /**
     * 모델 기본 주소
     */
    baseurl: string;
    /**
     * 레이어 종류
     */
    type?: string;
    /**
     * 모델 파일 확장자
     */
    ext: string;
    /**
     * 외곽선 표시 여부
     */
    drawline?: boolean;
    /**
     * 텍스처 사용 여부
     */
    needtexture?: boolean;
    /**
     * XML 사용 여부
     */
    needxml?: boolean;
    /**
     * XML 주소
     */
    xmlurl?: string;
    /**
     * U3F 사용 여부
     */
    useu3f?: boolean;
    /**
     * U3F 주소
     */
    u3furl?: string;
    /**
     * 모델 목록
     */
    listmodel?: Array<object>;
    /**
     * 위치
     */
    position?: three.Vector3Like;
    /**
     * 크기
     */
    scale?: three.Vector3Like;
    /**
     * 회전
     */
    rotation?: three.Euler | three.Vector3Like;
};

/**
 * WMS 이미지 레이어 생성 옵션
 */
type U3dWMSImageLayerCO = U3dLayerCommonCO;

/**
 * WFS 모델 레이어 생성 옵션
 */
type U3dWFSModelLayerCO = U3dLayerCommonCO;

/**
 *
 * 이동 애니메이션 핸들
 */
type U3dAppPropertyMap = Record<string, any>;

/**
 *
 * 뷰를 순환하며 조회할 때 사용하는 커서 상태
 */
type U3dAppTweenHandle = {
    stop: Function;
};

/**
 * U3dApp에서 공통으로 쓰는 런타임 보조 타입
 */
type U3dAppRoundRobinState = {
    /**
     * 현재 조회 시작 위치
     *
     * 생성자에서 설정되는 화면 영역 정보
     */
    cursor: number;
};

/**
 * U3dApp에서 공통으로 쓰는 런타임 보조 타입
 */
type U3dAppWindowRect = {
    /**
     * 왼쪽 시작 위치
     */
    left: number;
    /**
     * 위쪽 시작 위치
     */
    top: number;
    /**
     * 영역 너비
     */
    width: number;
    /**
     * 영역 높이
     */
    height: number;
};

/**
 * U3dApp을 생성할 때 전달하는 초기 설정 옵션입니다.<br>
 * 지도를 그려 넣을 화면 영역, 홈 위치와 카메라 시점, 화면 품질과 성능, 타일·레이어 처리 기준을 한 번에 지정합니다.<br>
 * containername을 제외한 모든 속성은 생략할 수 있으며, 생략하면 각 항목에 적힌 기본값이 적용됩니다.<br>
 * 기본값이 `기기 성능에 따라 결정`이라고 적힌 속성은 실행 기기의 성능 점수에 따라 값이 달라집니다.<br>
 * 생성한 뒤에 값을 바꾸려면 각 항목에 대응하는 U3dApp의 설정 함수를 사용하십시오.
 */
type U3dAppCO = {
    /**
     * 지도 화면을 그려 넣을 div 엘리먼트의 id
     */
    containername: string;
    /**
     * 출력 지도의 타입. 입력하지 않으면 한반도 범위 지도만 출력하고, 'world'를 입력하면,전세계 범위로 확장하여 지도를 출력합니다.
     */
    type?: string | undefined;
    /**
     * 여러 U3dApp을 구분하기 위한 이름입니다.<br>
     * 생략하면 'U3dApp_'에 생성 순번을 붙인 이름이 자동으로 지정됩니다.
     */
    name?: string;
    /**
     * 인덱스맵(overview, 현재 보는 곳을 넓은 범위에서 보여 주는 보조 2D 지도)을 그려 넣을 div 엘리먼트의 id입니다.<br>
     * 값을 입력하면 앱을 만들 때 그 영역에 인덱스맵이 함께 생성되고, 생략하면 인덱스맵을 만들지 않습니다.
     */
    idoverview?: string;
    /**
     * 인덱스맵의 중심을 맞추는 기준입니다.<br>
     * true이면 카메라가 바라보는 지점을, false이면 카메라가 있는 위치를 인덱스맵의 중심으로 사용합니다.
     */
    camTargetType?: boolean;
    /**
     * 홈 위치이며 위경도 좌표계(EPSG:4326)로 입력합니다.<br>
     * x는 경도, y는 위도, z는 고도(m)이며 기본값은 { x: 0, y: 0, z: 0 }입니다.<br>
     * 앱을 만들 때 이 위치로 이동하지는 않으며, updateHomePosition()을 호출하면 카메라가 이 위치로 이동합니다.
     */
    homePosition?: GeoPosition;
    /**
     * 홈 위치로 이동할 때 적용할 방위각이며 0은 북쪽을 바라보는 방향
     */
    homeRotateLeft?: Degree;
    /**
     * 홈 위치로 이동할 때 적용할 고도각이며 0은 지면을 수직으로 내려다보는 방향
     */
    homeRotateDown?: Degree;
    /**
     * 카메라 투영 방식입니다.<br>
     * `perspective`는 멀리 있는 것이 작게 보이는 원근 투영, `orthographic`은 거리와 무관하게 크기가 유지되는 평행 투영입니다.
     */
    cameraType?: "perspective" | "orthographic";
    /**
     * 한 프레임에서 처리할 작업 개수의 상한입니다.<br>
     * 값을 키우면 데이터가 빨리 채워지는 대신 프레임이 끊길 수 있으며, 기본값은 기기 성능에 따라 결정됩니다.
     */
    maxprocess?: number;
    /**
     * 화면 상태에 맞춰 한 프레임의 작업량을 자동으로 조절할지 여부
     */
    frameOptimize?: boolean;
    /**
     * 화면 조작이 멈춘 유휴 상태에서 사용하지 않는 리소스와 메모리를 자동으로 정리할지 여부
     */
    autoClear?: boolean;
    /**
     * 이미지·고도 타일 한 장에 사용할 해상도 비율이며 값이 작을수록 타일이 흐려지고 가벼워짐
     */
    ratiotilesize?: number;
    /**
     * 모델 검색 타일 한 장에 사용할 해상도 비율이며 값이 작을수록 모델을 성기게 검색함
     */
    ratiomodeltilesize?: number;
    /**
     * 카메라 시점 주변에서 그릴 타일을 찾는 범위의 모양입니다.<br>
     * `sphere`는 구, `boundingbox`는 직육면체 범위로 검색합니다.
     */
    searchtype?: "boundingbox" | "sphere";
    /**
     * 지형 고도 데이터를 해석하고 타일 경계의 틈을 메우는 스커트를 만드는 방식
     */
    methodheight?: "raw" | "base" | "1_0";
    /**
     * 카메라 프러스텀(frustum, 화면에 보이는 원뿔 모양 영역)의 세로 시야각이며 도 단위
     */
    fov?: number;
    /**
     * 하늘을 생성할지 여부
     */
    usesky?: boolean;
    /**
     * 지도 화면의 배경색이며 RGB 또는 HEX 문자열
     */
    backgroundcolor?: string;
    /**
     * 먼 거리를 흐리게 보이도록 안개 효과를 적용할지 여부
     */
    useFog?: boolean;
    /**
     * 하늘에 구름 효과를 적용할지 여부
     */
    useCloud?: boolean;
    /**
     * 태양을 바라볼 때 나타나는 빛 번짐(플레어) 효과를 적용할지 여부이며, 기본값은 기기 성능에 따라 결정
     */
    useSunFlare?: boolean;
    /**
     * 그림자를 그릴지 여부
     */
    useShadowMap?: boolean;
    /**
     * 장면 전체를 밝히는 환경 광원의 세기
     */
    intensitylight?: number;
    /**
     * 최종 화면의 노출 밝기이며 값이 클수록 화면이 밝아짐
     */
    toneExposure?: number;
    /**
     * 지면 텍스처 품질 보정 단계이며, 단계가 올라갈수록 선명해지고 연산량이 늘어납니다.<br>
     * 기본값은 기기 성능에 따라 결정됩니다.
     */
    improveTexture?: "none" | "low" | "medium" | "high";
    /**
     * 렌더링에 사용할 해상도이며 사전 정의된 이름 또는 [가로, 세로] 픽셀 배열로 입력합니다.<br>
     * 예: 'FHD' 또는 [1122, 840]이며, 기본값은 기기 성능에 따라 결정됩니다.
     */
    pixelResolution?: "SD" | "HD" | "FHD" | "QHD" | "UHD" | Array<number>;
    /**
     * 해상도에 곱해지는 픽셀 밀도 배율이며 값이 클수록 선명해지고 연산량이 늘어남
     */
    pixelRatio?: number;
    /**
     * 렌더링 결과에 후처리 효과를 적용할지 여부이며, 기본값은 기기 성능에 따라 결정
     */
    usePostProcess?: boolean;
    /**
     * 후처리 효과의 세부 설정이며 생략하면 각 효과의 기본 설정 사용
     */
    postOption?: PostProcessParam;
    /**
     * 지형을 나누는 쿼드타일의 최대 분할 레벨이며 값이 클수록 가까이에서 더 세밀하게 표현됨
     */
    maxlevel?: number;
    /**
     * 카메라 프러스텀에서 가장 가까운 평면까지의 거리이며 미터 단위
     */
    near?: number;
    /**
     * 카메라 프러스텀에서 가장 먼 평면까지의 거리이며 미터 단위이고 기본값은 월드 영역 크기
     */
    far?: number;
    /**
     * 앱이 다룰 영역을 특정 타일 하나로 한정할 때 사용하는 타일 인덱스 옵션이며 생략하면 전체 영역 사용
     */
    targetrectopt?: TargetRectOption;
    /**
     * 타일 경계에 생기는 틈을 가리는 스커트를 생성할지 여부
     */
    skirt?: boolean;
    /**
     * 데이터를 불러오고 그리기 시작하는 최소 타일 레벨이며, 이보다 낮은 레벨의 타일은 화면에 나타나지 않습니다.<br>
     * 생략하면 레벨 제한을 두지 않습니다.
     */
    passlevel?: number;
    /**
     * 모든 이미지 레이어에 공통 투명도를 적용할지 여부
     */
    useimageopacity?: boolean;
    /**
     * 모든 이미지 레이어에 적용할 투명도이며 0은 완전 투명, 1은 불투명
     */
    imageopacity?: number;
    /**
     * 모든 모델 레이어에 공통 투명도를 적용할지 여부
     */
    usemodelopacity?: boolean;
    /**
     * 모든 모델 레이어에 적용할 투명도이며 0은 완전 투명, 1은 불투명
     */
    modelopacity?: number;
    /**
     * 모델 텍스처 해상도를 거리로 나누는 기준 거리이며 미터 단위입니다.<br>
     * 카메라가 이 거리 안에 있으면 가까울수록 높은 해상도의 텍스처를 사용하고, 이 거리보다 멀면 modelimagedefaultlevel의 해상도를 사용합니다.
     */
    modelimagedistance?: number;
    /**
     * modelimagedistance보다 멀리 있는 모델에 적용할 텍스처 해상도 레벨이며 0이 가장 낮은 해상도
     */
    modelimagedefaultlevel?: number;
    /**
     * 카메라 종횡비(화면 가로 길이를 세로 길이로 나눈 값)에 곱하는 보정 배율이며 1은 컨테이너 비율을 그대로 사용
     */
    viewportratio?: number;
    /**
     * 지도 확대 단계를 세는 Zoom 레벨의 시작값입니다.<br>
     * zoomIn()과 zoomOut()이 이 값을 1씩 올리거나 내려 화면을 확대·축소합니다.
     */
    zoomLevel?: number;
    /**
     * zoomOut()으로 내려갈 수 있는 Zoom 레벨의 하한
     */
    minZoomLevel?: number;
    /**
     * zoomIn()으로 올라갈 수 있는 Zoom 레벨의 상한
     */
    maxZoomLevel?: number;
    /**
     * 지면과 카메라 사이의 거리에 따라 확대·이동·회전 속도를 자동으로 조절할지 여부
     */
    useautospeed?: boolean;
    /**
     * 앱을 만들면서 렌더러·카메라·컨트롤·광원·하늘을 자동으로 생성하고 렌더링을 시작할지 여부입니다.<br>
     * false로 지정하면 필요한 구성 요소를 직접 생성한 뒤 start()를 호출하십시오.
     */
    auto?: boolean;
    /**
     * 비행 모드에서 지정한 경로를 따라 카메라가 자동으로 이동할지 여부
     */
    automove?: boolean;
    /**
     * 앱을 만든 직후 화면 그리기를 멈춘 상태로 둘지 여부
     */
    stoprender?: boolean;
    /**
     * 지하 모드에서 안개 효과를 적용할지 여부
     */
    undergroundFog?: boolean;
    /**
     * 지하 안개의 밀도이며 값이 클수록 시야가 빨리 흐려짐
     */
    undergroundFogDensity?: number;
    /**
     * 지하 안개가 시작되는 높이이며 미터 단위
     */
    undergroundFogStartHeight?: number;
    /**
     * 지하 안개가 가장 짙어지는 높이이며 미터 단위
     */
    undergroundFogEndHeight?: number;
    /**
     * 지하 안개 색상이며 x·y·z를 각각 0 이상 1 이하의 R·G·B 값으로 입력합니다.<br>
     * 기본값은 { x: 0.034, y: 0.034, z: 0.034 }입니다.
     */
    undergroundFogColor?: three.Vector3;
};

/**
 * ~extends import('@U3dObject').U3dObject <br>
 *
 * 3D 어플리케이션 메인 클래스입니다. <br>
 * 3D 서비스를 제공하기 위해 기본이 되며 지도를 생성하고 조작하기 위한 속성 및 함수로 구성되어 있습니다.<br>
 * Layer, Control 등을 등록하기 위한 기본 컨테이너입니다.
 *
 * @group app
 * @extends {U3dObject}
 */
declare class U3dApp extends U3dObject {
    /** @type {U3dAppEMI} */ static EVENT: U3dAppEMI;
    /** @type {U3dApp_Analysis} */ static ANALYSIS: U3dApp_Analysis;
    /**
     * U3dApp 클래스 생성자입니다.<br>
     * opt.containername으로 지정한 div 엘리먼트를 지도 화면 영역으로 사용하며, 그 안에 지도를 그릴 캔버스를 만듭니다.<br>
     * 인터넷 익스플로러에서 실행하면 지도를 만들지 않고 지원하지 않는다는 오류만 알립니다.
     *
     * @param {U3dAppCO} opt 지도 화면 영역과 홈 위치, 화면 품질, 타일 처리 기준을 담은 생성 옵션
     */
    constructor(opt: U3dAppCO);
    /** @type {import('@union3d/core/UCamera').UCamera | undefined} */ _camera: UCamera | undefined;
    /** @type {string} */
    _classtype: string;
    /** @type {boolean} */
    _disposed: boolean;
    /** @type {typeof THREE} */
    _THREE: typeof three;
    /** @type {boolean} */
    _bInitialized: boolean;
    /** @type {import('@union3d/env/UUnderground').UUnderground | undefined} */
    _underground: UUnderground | undefined;
    /** @type {string | undefined} */
    _undergroundId: string | undefined;
    /** @type {boolean} */
    _stopModel: boolean;
    /** @type {number} */
    _mode: number;
    /** @type {any | undefined} */
    _sunSphere: any | undefined;
    _frustum: any;
    /** @type {import('@union3d/core/UCollapse').UCollapse | undefined} */
    _collapse: UCollapse | undefined;
    /** @type {import('@union3d/mode/UMapControls').UMapControls} */
    _mapControl: UMapControls;
    /** @type {any} */ _undergroundControl: any;
    /** @type {import('@union3d/mode/UWalkControls').UWalkControls | undefined} */ _walkControl: UWalkControls | undefined;
    /** @type {import('@union3d/mode/UFlyControls').UFlyControls | undefined} */ _flyControl: UFlyControls | undefined;
    /** @type {import('@UScene').UScene} */
    _scene: UScene;
    _terrainLayer: any;
    _measureLayer: any;
    /** @type {import('@UScene').UScene} */
    _sceneComment: UScene;
    /** @type {import('@URenderer').URenderer} */
    _renderer: URenderer;
    /** @type {Array<*>} */
    _listQuadtreeSet: Array<any>;
    /** @type {import('@UDrawArg').UDrawArg} */
    _drawArg: UDrawArg;
    _terrainDecalManager: UShaderTerrainDecalManager;
    /** @type {import('@union3d/core/UBox3').UBox3 | undefined} */
    _box: UBox3 | undefined;
    /** @type {*} */
    _overviewmap: any;
    /** @type {boolean} */
    _appUpdate3d: boolean;
    /** @type {import('@union3d/event/U3dAppEventHandler').U3dAppEventHandler | undefined} */
    _eventHandler: U3dAppEventHandler | undefined;
    /** @type {boolean} */
    _isTwenning: boolean;
    /** @type {*} */ _tweenfrom2To: any;
    /** @type {*} */ _tweenMid2To: any;
    /** @type {*} */ _tweenFrom2Mid: any;
    /** @type {*} */ _tweenFrom2Mid2: any;
    /** @type {string | undefined} */
    _gizmoType: string | undefined;
    _stopUpdate: any;
    _stopRender: any;
    _maxProcess: any;
    _maxDistanceModel: any;
    _nameBaseLayer: string;
    _wireFrameRendering: boolean;
    _sizeWorld: number;
    /** @type {U3dAppPropertyMap} */
    _properties: U3dAppPropertyMap;
    /** @type {string | undefined} */
    _idLoad: string | undefined;
    /** @type {import('@UGeoRect').UGeoRect | undefined} */
    _rectangle: UGeoRect | undefined;
    /** @type {boolean} */
    _skirt: boolean;
    /** @type {boolean} */
    _useAutoSpeed: boolean;
    /** @type {boolean} */
    _auto: boolean;
    /** @type {string} */
    _containername: string;
    /** @type {HTMLElement} */
    _container: HTMLElement;
    /** @type {U3dAppWindowRect} */
    _rectBaseWindow: U3dAppWindowRect;
    /** @type {U3dAppWindowRect} */
    _rectSwipeWindow: U3dAppWindowRect;
    /** @type {number} */
    _ratioTileSize: number;
    /** @type {number} */
    _ratioModelTileSize: number;
    /** @type {boolean} */
    _frameOptimize: boolean;
    /** @type {boolean} */
    _autoClear: boolean;
    /** @type {boolean} */
    _logarithmicDepthBuffer: boolean;
    /** @type {boolean} */
    _preserveDrawingBuffer: boolean;
    /** @type {number} */
    _improveTexture: number;
    /** @type {number} */
    _toneExposure: number;
    /** @type {boolean} */
    _useSky: boolean;
    /** @type {boolean} */
    _useFog: boolean;
    /** @type {import('three').ColorRepresentation} */
    _fogColor: three.ColorRepresentation;
    _defaultFog: UFog;
    /** @type {import('three').Color | undefined} */
    _background: three.Color | undefined;
    /** @type {ColorLike} */
    _backgroundColor: ColorLike;
    /** @type {import('@union3d/3dLayer/U3dLayerList').U3dLayerList | undefined} */
    _layerlist: U3dLayerList | undefined;
    /** @type {Array<*>} */ _overlayList: Array<any>;
    /** @type {Array<*>} */ _viewList: Array<any>;
    /** @type {Array<*>} */ _viewLightList: Array<any>;
    /** @type {Array<*>} */ _lightList: Array<any>;
    /** @type {Array<*>} */ _poiList: Array<any>;
    /** @type {Array<*>} */ _objectList: Array<any>;
    /** @type {Map<string, *>} */
    _editHeightBoxList: Map<string, any>;
    /** @type {*} */
    _selected: any;
    getViewLightList: () => any[];
    getSelected: () => any;
    /** @type {TargetRectOption | undefined} */
    _targetrectopt: TargetRectOption | undefined;
    /** @type {number | undefined} */
    _passlevel: number | undefined;
    /** @type {number | undefined} */
    _datalevel: number | undefined;
    /** @type {number | undefined} */
    _startlevel: number | undefined;
    /** @type {number} */
    _viewportRatio: number;
    /** @type {number} */
    _fov: number;
    /** @type {number} */
    _near: number;
    /** @type {number} */
    _far: number;
    /** @type {'perspective' | 'orthographic'} */
    _cameraType: "perspective" | "orthographic";
    /** @type {number} */
    _modelImageDistance: number;
    /** @type {number} */
    _modelImageDefaultLevel: number;
    /** @type {number} */
    _modelUpdateOffset: number;
    /** @type {number} */
    _homeRotateLeft: number;
    /** @type {number} */
    _homeRotateDown: number;
    /** @type {number | undefined} */
    _resolution: number | undefined;
    /** @type {number} */
    _zoomLevel: number;
    /** @type {number} */
    _minZoomLevel: number;
    /** @type {number} */
    _maxZoomLevel: number;
    /** @type {number} */
    _minlevel: number;
    /** @type {number} */
    _maxlevel: number;
    /** @type {boolean} */
    _useSunFlare: boolean;
    /** @type {boolean} */
    _useCloud: boolean;
    /** @type {boolean} */
    _useShadowMap: boolean;
    /** @type {import('@union3d/effect/ULensFlare').ULensFlare | undefined} */
    _sunFlare: ULensFlare | undefined;
    /** @type {boolean} */
    _autoMove: boolean;
    /** @type {Date | undefined} */
    _curtime: Date | undefined;
    _removedModel: any[];
    /** @type {U3dAppTweenHandle | undefined} */
    _currentTween: U3dAppTweenHandle | undefined;
    _isCameraRest: boolean;
    /** @type {Array<*>} */
    _particles: Array<any>;
    /** @type {Array<*>} */
    _fires: Array<any>;
    /** @type {import('three').Plane} */
    _globalPlaneX: three.Plane;
    /** @type {import('three').Plane} */
    _globalPlaneY: three.Plane;
    /** @type {import('three').Plane} */
    _globalPlaneZ: three.Plane;
    /** @type {Array<import('three').Plane>} */
    _clippingPlanes: Array<three.Plane>;
    /** @type {Array<*>} */
    _analysisList: Array<any>;
    /** @type {number} */
    _undergroundDepth: number;
    /** @type {number} */
    _undergroundColor: number;
    /** @type {number} */
    _undergroundOpacity: number;
    /** @type {boolean} */
    _undergroundGrid: boolean;
    /** @type {number} */
    _undergroundGridDivide: number;
    /** @type {boolean} */
    _undergroundSetTexture: boolean;
    /** @type {boolean} */
    _undergroundEdge: boolean;
    /** @type {number} */
    _undergroundEdgeThickness: number;
    /** @type {boolean} */
    _undergroundFog: boolean;
    /** @type {number} */
    _undergroundFogDensity: number;
    /** @type {number} */
    _undergroundFogStartHeight: number;
    /** @type {number} */
    _undergroundFogEndHeight: number;
    /** @type {import('three').ColorRepresentation | import('three').Vector3} */
    _undergroundFogColor: three.ColorRepresentation | three.Vector3;
    /** @type {U3dStats} */
    _rStats: U3dStats;
    /** @type {U3dStats} */
    _uStats: U3dStats;
    /** @type {U3dStats} */
    _uwStats: U3dStats;
    /** @type {U3dStats} */
    _ulStats: U3dStats;
    /** @type {U3dStats} */
    _dStats: U3dStats;
    /** @type {UAnimationManager} */
    _animationManager: UAnimationManager;
    /** @type {import('@union3d/manager/UMixerManager').UMixerManager} */
    _mixerManager: UMixerManager;
    /** @type {U3dAppRoundRobinState} */
    _viewRR: U3dAppRoundRobinState;
    /** @type {import('@union3d/overlay/U3dOverlayManager').U3dOverlayManager | null} */
    _overlayManager: U3dOverlayManager | null;
    getParam(): {
        name: string;
        containername: string;
        idoverview: string;
        camTargetType: boolean;
        homePosition: three.Vector3;
        homeRotateDown: number;
        homeRotateLeft: number;
        maxProcess: any;
        frameOptimize: boolean;
        autoClear: boolean;
        ratioTileSize: number;
        ratioModelTileSize: number;
        useSunFlare: boolean;
        useshadowmap: boolean;
        intensitylight: number;
        intensitysunlight: number;
        toneExposure: number;
        usesky: boolean;
        usefog: boolean;
        useCloud: boolean;
        backgroundcolor: three.ColorRepresentation;
        fov: number;
        cameraType: "perspective" | "orthographic";
        improveTexture: string;
        pixelResolution: number[];
        pixelRatio: number;
        usePostProcess: boolean;
        postOption: PostProcessParam;
        datalevel: number;
        passlevel: number;
        minlevel: number;
        maxlevel: number;
        size: number;
        rectangle: UGeoRect;
        useimageopacity: any;
        imageopacity: any;
        usemodelopacity: any;
        modelopacity: any;
        methodheight: any;
        searchtype: string;
        modelimagedistance: number;
        modelimagedefaultlevel: number;
        viewportratio: number;
        near: number;
        far: number;
        minZoomLevel: number;
        maxZoomLevel: number;
        automove: boolean;
    };
    /**
     * U3dApp의 main 카메라를 반환합니다.
     *
     * @returns {import('@UCamera').UCamera | undefined} U3dApp main 카메라
     *
     * @example
     * const camera = app.getCamera();
     */
    getCamera(): UCamera | undefined;
    /**
     * 이 앱에 속한 shader layer가 공유할 terrain decal manager를 반환합니다.
     * 사용하지 않는 앱에서는 worker와 registry를 만들지 않도록 최초 요청 시 생성합니다.
     *
     * @returns {import('@union3d/manager/terrain/UShaderTerrainDecalManager.js').UShaderTerrainDecalManager} 앱 단위 공유 manager입니다.
     */
    getTerrainDecalManager(): UShaderTerrainDecalManager;
    /**
     * 작업 처리기와 측정을 먼저 종료한 뒤 앱이 소유한 자원을 정리합니다.
     * 종료 콜백에서 다시 호출하거나 이미 종료된 경우에는 중복 정리를 하지 않습니다.
     */
    dispose(): void;
    getMetaData(): any;
    /**
     * 현재 전체 작업 진행률을 0~1 범위의 비율로 반환한다.
     * @returns {number}
     */
    getLoadingRate(): number;
    /**
     * 현재 완료된 전체 작업량을 반환한다.
     * @returns {number}
     */
    getLoadingNow(): number;
    /**
     * 전체 작업량을 반환한다.
     * @returns {number}
     */
    getLoadingTotal(): number;
    /**
     * 지도화면 resize 함수
     */
    resize(): void;
    /**
     * 화면의 픽셀 비율을 설정합니다.
     *
     * @param {number} [pixelRatio=1] 픽셀 비율
     * @returns {U3dApp | undefined} 현재 앱
     *
     * @example
     * app.setPixelRatio(1.0);
     */
    setPixelRatio(pixelRatio?: number): U3dApp | undefined;
    /**
     * 현재 화면의 픽셀 비율을 반환합니다.
     *
     * @returns {number} 픽셀 비율
     *
     * @example
     * const pixelRatio = app.getPixelRatio();
     */
    getPixelRatio(): number;
    /**
     * 화면을 그릴 때 사용할 기준 해상도를 설정합니다.
     *
     * @param {PIXELRE_SOLUTION_OPTION | Array<number> | number} [width] 해상도 단계, 해상도 배열 또는 가로 크기
     * @param {number} [height] 세로 크기
     * @returns {U3dApp} 현재 앱
     *
     * @example
     * app.setPixelResolution('FHD'); // 또는
     */
    setPixelResolution(width?: PIXELRE_SOLUTION_OPTION | Array<number> | number, height?: number): U3dApp;
    /**
     * 현재 설정된 화면 해상도를 반환합니다.
     *
     * @returns {Array<number>} 가로와 세로 해상도
     *
     * @example
     * const resolution = app.getPixelResolution();
     */
    getPixelResolution(): Array<number>;
    /**
     * 현재 화면 해상도의 단계 이름을 반환합니다.
     *
     * @returns {PIXELRE_SOLUTION_OPTION} 해상도 단계
     *
     * @example
     * const level = app.getPixelResolutionLevel();
     */
    getPixelResolutionLevel(): PIXELRE_SOLUTION_OPTION;
    /**
     * 나중에 다시 불러올 카메라 상태를 저장합니다.
     *
     * @param {import('@union3d/core/UCameraState').UCameraState} cameraStateInfo 저장할 카메라 상태
     *
     * @example
     * app.setSavedCameraState(app.getCameraState());
     */
    setSavedCameraState(cameraStateInfo: UCameraState): void;
    /**
     * 저장된 카메라 상태를 반환합니다.
     * 저장된 상태가 없으면 `undefined`를 반환합니다.
     *
     * @returns {import('@union3d/core/UCameraState').UCameraState | undefined} 저장된 카메라 상태
     *
     * @example
     * const state = app.getSavedCameraState();
     */
    getSavedCameraState(): UCameraState | undefined;
    /**
     * Renderer를 생성하는 함수
     * @param {HTMLElement} container 3dMap div 객체
     * @return {import('@union3d/core/URenderer').URenderer} renderer 객체
     *
     * @ignore
     */
    createRenderer(container: HTMLElement): URenderer;
    /**
     * 후처리 적용 여부를 반환 하는 함수
     * @returns {boolean} 후처리 적용 여부
     */
    isPostProcess(): boolean;
    /**
     * 화면 전체에 적용하는 후처리(post process) 보정을 켜거나 끕니다.<br>
     * 후처리는 장면을 다 그린 뒤 화면 전체에 대비·밝기·주변광 차폐·빛 번짐·색 띠 완화 같은 품질 보정을 덧입히는 단계입니다.<br>
     * 켜면 setPostOption()으로 저장해 둔 설정을 그대로 다시 적용하고, 끄면 품질 보정 단계만 내려놓습니다.<br>
     * 꺼도 장면을 화면에 내보내는 단계와 분석 기능이 사용하는 단계는 그대로 남으므로 지도 화면은 계속 보입니다.<br>
     * 현재 설정과 같은 값을 넘기면 아무것도 바꾸지 않고 끝납니다.<br>
     * 하늘을 사용 중이면 켜는 경우와 끄는 경우 모두 하늘을 지우고 다시 만들기 때문에 태양 시각이 기본값으로 되돌아가고 구름도 함께 사라집니다.<br>
     * 구름은 앱 생성 옵션 useCloud를 켠 상태에서 후처리를 켤 때만 다시 만들어지므로 후처리를 끄면 구름이 사라진 채로 남습니다.<br>
     * 태양 시각을 직접 설정해 두었다면 이 함수를 호출한 뒤 다시 설정하여 사용을 권합니다.
     *
     * @param {boolean} usePostProcess true이면 후처리 보정을 적용하고 false이면 해제
     */
    setPostProcess(usePostProcess: boolean): void;
    /**
     * 3D 공간에 하늘 영역을 생성하는 함수
     */
    createSky(): void;
    /**
     * 하늘을 제거하는 함수
     */
    removeSky(): void;
    /**
     * 하늘 객체를 반환 하는 함수
     * @returns {import('@union3d/env/USky').USky}
     */
    getSky(): USky;
    /**
     * 구름 객체를 제거하는 함수
     */
    removeCloud(): void;
    _cloud: U3dCloud;
    /**
     * @description 구름을 생성하는 함수
     *
     * @return {import('@union3d/env/U3dCloud').U3dCloud} 구를 객체
     * @ignore
     */
    createCloud(): U3dCloud;
    /**
     * @description 하늘의 생성된 구름을 반환하는 함수
     *
     * @returns {import('@union3d/env/U3dCloud').U3dCloud} 생성된 구름
     */
    getCloud(): U3dCloud;
    /**
     * @description 하늘의 생성된 구름의 출력을 제어하는 함수
     * @param {boolean} isShow 출력여부
     */
    showCloud(isShow: boolean): void;
    /**
     * 후처리 보정 항목의 값을 바꾸고 화면에 반영합니다.<br>
     * 넘긴 항목만 덮어쓰고 넘기지 않은 항목은 지금 값을 그대로 두므로 바꿀 항목 하나만 담아 호출해도 됩니다.<br>
     * PostProcessParam에 없는 이름은 저장하지 않습니다.<br>
     * fxaaSharpness는 이 호출로 값만 저장되고 화면 크기를 다시 계산할 때 반영되므로 곧바로 화면이 달라지지 않습니다.<br>
     * 후처리를 꺼 둔 상태에서 호출하면 값만 저장되며 setPostProcess(true)로 켤 때 화면에 적용됩니다.
     *
     * @param {PostProcessParam} option 바꿀 항목만 담은 후처리 설정
     */
    setPostOption(option: PostProcessParam): void;
    /**
     * 지금 적용 중인 후처리 설정을 반환합니다.<br>
     * 후처리가 켜져 있지 않으면 undefined를 반환하므로 값을 읽기 전에 후처리 사용 여부를 확인하십시오.<br>
     * 반환값은 엔진이 보관 중인 설정 객체 자체이므로 속성을 직접 고쳐도 그것만으로는 화면이 달라지지 않습니다.<br>
     * 고친 값을 적용하려면 고친 객체를 그대로 setPostOption()에 넘기십시오.<br>
     * 고친 값은 다음에 후처리 설정이 적용될 때 함께 반영되므로, 지금 값을 유지하려면 반환값을 복사해서 사용을 권장드립니다.
     *
     * @returns {PostProcessParam | undefined} 모든 항목이 채워진 현재 후처리 설정이며, 후처리가 켜져 있지 않으면 undefined
     */
    getPostOption(): PostProcessParam | undefined;
    hasRenderAfter(): boolean;
    setRenderAfter(key: any, callback: any): void;
    removeRenderAfter(key: any): void;
    exeRenderAfter(renderer: any, scene: any, camera: any): void;
    /**
     * 렌더링 직전에 실행할 콜백이 등록되어 있는지 확인합니다. <br>
     * `key`를 넘기면 그 키로 등록된 콜백이 있는지, 생략하면 등록된 콜백이 하나라도 있는지 반환합니다.
     *
     * @param {string} [key] 확인할 콜백 등록 키
     * @returns {boolean} 콜백 등록 여부
     *
     * @example
     * if (app.hasRenderBefore(HELPER_UPDATE_KEY)) app.removeRenderBefore(HELPER_UPDATE_KEY);
     */
    hasRenderBefore(key?: string): boolean;
    setRenderBefore(key: any, callback: any): void;
    removeRenderBefore(key: any): void;
    exeRenderBefore(renderer: any, scene: any, camera: any): void;
    hasUpdateBefore(key: any): boolean;
    setUpdateBefore(key: any, callback: any): void;
    removeUpdateBefore(key: any): void;
    exeUpdateBefore(curTime: any): void;
    createExecuteCommand(): void;
    getExecuteCommand(): UAppCommand;
    /**
     * 데이터프레임을 업데이트하는 함수
     * @param {number} curTime 최근 시간
     * @return {boolean} 업데이트 결과 [true : 업데이트 성공, false : 업데이트 실패]
     *
     * @ignore
     */
    updateWorkFrame(curTime: number): boolean;
    updateLayerFrame(curTime: any): boolean;
    addExecuteCommand(id: any, callback: any, type?: string): boolean;
    removeExecuteCommand(id: any): boolean;
    setCameraTargetType(isTarget: any): void;
    getCameraTargetType(): boolean;
    /**
     * 지도화면 밝기 값을 반환합니다.
     * @returns {number} 화면 밝기 factor
     */
    getIntensityLight(): number;
    /**
     * 지도화면 밝기 설정 함수
     * @param {number} intensity 화면 밝기 factor
     * @returns {boolean} 정상 동작 여부
     */
    setIntensityLight(intensity?: number): boolean;
    /**
     * 지도화면 태양 밝기 값을 반환합니다.
     * @returns {number} 화면 밝기 factor
     */
    getIntensitySunLight(): number;
    /**
     * 지도화면 태양 밝기 설정 함수
     * @param {number} intensity 화면 밝기 factor
     * @returns {boolean} 정상 동작 여부
     */
    setIntensitySunLight(intensity?: number): boolean;
    createLight(size: any, drawArg: any): ULight;
    getVertexLevel(): number;
    getSegVertex(): number;
    /**
     * 시간에 따른 태양 정보(위치/일조량 등)를 설정하는 함수
     * @param {Date} date 설정 시간
     * @ignore
     */
    setTimeSun(date: Date): void;
    /**
     * 현재 시간을 반환하는 함수
     * @returns {object}
     * @example Tue Jun 27 2023 17:47:38 GMT+0900 (한국 표준시)
     */
    getTimeSun(): object;
    getLight(): ULight;
    /**
     * 태양 플레어 효과를 설정하는 함수
     * @param {boolean} show 출력 / 비출력 여부
     */
    setSunFlare(show: boolean): void;
    createSunFlare(): void;
    /**
     * 태양 플레어 효과를 설정 여부를 리턴하는 함수
     * @returns {boolean} 태양 플레어 효과를 설정 여부
     */
    getSunFlare(): boolean;
    /**
     * 일조량 분석 결과 초기화 함수
     *
     * @ignore
     */
    endAnalySunAmount(): void;
    /**
     * 일조량 분석 mesh들을 반환 하는 함수
     * @returns {Array<import('@UMesh').UMesh | undefined>}  일조량 분석 mesh 목록
     *
     * @ignore
     */
    getSunAmountDrawMeshes(): Array<UMesh | undefined>;
    /**
     * 분석 mesh 이름을 파라미터로 받아 해당하는 mesh를 제거하는 함수
     * @param {string} name 제거할 분석 mesh 이름
     * @ignore
     */
    removeAnalySunAmount(name: string): void;
    /**
     * 입력한 시간,위치에 그림자가 드는지 계산하는 함수
     * @param {Date} date Date객체
     * @param {GeoPosition} position 계산할 위치 - 위경도 Object ex) {x: 127, y:36, z:10}
     * @returns {boolean} 그림자 여부
     *
     * @ignore
     */
    isShadowAtTime(date: Date, position: GeoPosition): boolean;
    setSunTargetPoint(point: any): boolean;
    getSunAmountParam(): void;
    setShadow(enable: any): boolean;
    /**
     * 일조권 측정 모드로 전환하는 함수
     * @param {boolean} [active=true] 일조권 측정 모드 활성화 여부 [ true : 활성 / false : 비활성 ]
     */
    setSunShineMode(active?: boolean): void;
    /**
     * 지도 그림자 설정 함수 <br>
     * true로 설정하면 지도 화면에 광원에 따른 지형 및 모델의 그림자가 표현된다.
     * @param {boolean} enable 그림자 설정 여부 (true면 설정, false면 설정하지 않는다.)
     */
    enableShadowMap(enable: boolean): boolean;
    /**
     * 그림자를 사용하고 있는지 여부를 리턴하는 함수
     * @returns {boolean} 그림자 사용 여부
     */
    isUseShadow(): boolean;
    /**
     * app의 scene을 반환하는 함수
     * @returns {import('@UScene').UScene} scene
     */
    getScene(): UScene;
    getRenderGroup(): UGroup;
    /**
     * 외부 THREE.js object를 랜더링 하는 Scene을 반환하는 함수
     * @returns {import('@UScene').UScene} scene
     */
    getExternalScene(): UScene;
    /**
     * app의 scene을 생성하는 함수
     * @return {import('@UScene').UScene} scene
     *
     * @ignore
     */
    createScene(): UScene;
    /**
     * 주석(Comment) 전용 Scene을 반환합니다. <br>
     * 지형이나 모델에 가려지지 않고 항상 위에 그려져야 하는 객체를 이 Scene에 추가합니다.
     *
     * @returns {import('@UScene').UScene | undefined} 주석 전용 Scene
     *
     * @example
     * app.getSceneComment().add(markerGroup);
     */
    getSceneComment(): UScene | undefined;
    getCommentRenderGroup(): UGroup;
    /**
     * app의 sceneComment를 생성하는 함수
     * @return {import('@UScene').UScene} app의 sceneComment
     * @ignore
     */
    createSceneComment(): UScene;
    /**
     * 프로세스 메니져 객체를 반환하는 함수
     * @return {import('@union3d/manager/UProcessManager').UProcessManager} 프로세스 메니져 객체
     *
     * @ignore
     */
    getProcessManager(): UProcessManager;
    getIndexManager(): UIndexManager;
    /**
     * @returns {import('@union3d/manager/UTestManager').UTestManager}
     */
    getTestManager(): UTestManager;
    /**
     * @description 고도가 업데이트 될때 입력한 위치의 고도값을 추출해 입력한 함수를 실행시켜 준다
     * @param {number} x  업데이트할 위치의 x (월드좌표)
     * @param {number} y  업데이트할 위치의 y (월드좌표)
     * @param {import('three').Object3D} object  업데이트 할 객체
     * @param {Function} updateFnc  업데이트 시 실행 함수, 함수의 파라메터로 입력되는 값과 그 순서 updateFnc(object, tile, 고도값)
     *
     * @ignore
     */
    addAutoHeightUpdate(x: number, y: number, object: three.Object3D, updateFnc: Function): void;
    /**
     * @param {number} x  addAutoHeightUpdate로 등록된 업데이트할 위치의 x (월드좌표)
     * @param {number} y  addAutoHeightUpdate로 등록된업데이트할 위치의 y (월드좌표)
     * @param {import('three').Object3D} object addAutoHeightUpdate로 등록된 업데이트 할 객체
     *
     * @ignore
     */
    removeAutoHeightUpdate(x: number, y: number, object: three.Object3D): void;
    /**
     * @description 고도가 로드되었을때 addAutoHeightUpdate로 등록된 업데이트 함수를 실행시켜주는 함수, 고도가 로드되었을때 실행된다.
     *
     * @param {event} event  U3dQuadSet이 initialize 할때 tile loaded 이벤트에 등록 시킨다
     *
     * @ignore
     */
    execAutoHeightUpdate(event: Event): void;
    /**
     * app의 렌더링 대상 컨테이너를 반환하는 함수
     * @returns {HTMLElement | null} 렌더링 대상 컨테이너 DOM 요소. 컨테이너를 찾지 못하면 `null`
     */
    getContainer(): HTMLElement | null;
    /**
     * 오버뷰를 반환하는 함수
     * @returns {import('@union3d/core/U3dOverviewMap').U3dOverviewMap} 오버뷰 객체 (인덱스 맵)
     */
    getOverviewMap(): U3dOverviewMap;
    /**
     * 오버뷰를 생성하는 함수
     * @param {import('@union3d/core/U3dOverviewMap').U3dOverviewMap} idoverview 오버뷰 아이디
     * @returns {boolean}
     */
    createOverviewMap(idoverview: U3dOverviewMap): boolean;
    /**
     * AutoClear 설정을 반환하는 함수
     * @returns {boolean} AutoClear 여부
     */
    isAutoClear(): boolean;
    /**
     * AutoClear 옵션을 설정하는 함수
     * @param {boolean} autoClear 설정할 AutoClear 옵션
     */
    setAutoClear(autoClear: boolean): void;
    getDrawFps(): number;
    /**
     * 일반 렌더링 FPS를 엔진 상한 이내로 설정합니다.
     * 유한한 양수가 아니면 기존 설정을 유지합니다.
     * @param {number} fps 설정할 초당 프레임 수
     * @returns {void} 반환값 없음
     */
    setDrawFps(fps: number): void;
    getIdleDrawFps(): number;
    /**
     * 유휴 렌더링 FPS를 엔진 상한 이내로 설정합니다.
     * 유한한 양수가 아니면 기존 설정을 유지합니다.
     * @param {number} fps 설정할 초당 프레임 수
     * @returns {void} 반환값 없음
     */
    setIdleDrawFps(fps: number): void;
    isIdleDraw(): boolean;
    getUpdateFps(): number;
    setUpdateFps(fps: any): void;
    /**
     * 일정시간동간 렌더링 작업상태를 WORK 상태로 변경한다.
     * @param {number} workTime WORK 상태를 유지할 프래임 수, 20 입력시 20프레임 동안 WORK 상태 유지
     */
    drawWork(workTime: number): void;
    /**
     * 렌더링 작업 속도를 기본 속도보다 빠르게 설정합니다.
     *
     * @example
     * app.drawFast();
     */
    drawFast(): void;
    /**
     * 렌더링 작업 속도를 기본 속도로 설정합니다.
     *
     * @example
     * app.drawDefault();
     */
    drawDefault(): void;
    /**
     * 렌더링 작업 속도를 기본 속도보다 느리게 설정합니다.
     *
     * @example
     * app.drawSlow();
     */
    drawSlow(): void;
    setDrawSpeed(speed?: number): void;
    getDrawSpeed(): number;
    start(time: any): void;
    isFrameMove(): boolean;
    frameMove(): boolean;
    positionX_: number;
    positionY_: number;
    positionZ_: number;
    rotationX_: number;
    rotationY_: number;
    rotationZ_: number;
    renderFrame(delta: any): boolean;
    updateFrame(delta: any): void;
    tweenFrame(delta: any): void;
    /**
     * 스와이프 영역에 출력 설정된 레이어를 리턴합니다.
     * @returns {Map<string, U3dAppCallbackCopyOption>} 레이어 설정 정보
     * */
    getNameSwipeLayers(): Map<string, U3dAppCallbackCopyOption>;
    /**
     * 스와이프 영역에 출력 될 레이어을 설정합니다.
     * @param {string} name 스와이프 영역에 출력 될 레이어 이름
     * @param {boolean} [isCopy=false] 메인영역에도 함께 출력 될건지의 여부, false 일경우 스와이프영역에만 출력, true 일경우 메인영역과 함께 출력
     * @returns {boolean} 작동 완료 여부
     */
    addNameSwipeLayer(name: string, isCopy?: boolean): boolean;
    /**
     * 스와이프 영역에 출력 설정 된 레이어를 원복합니다.
     * @param {string} name 스와이프 영역에 출력 설정에서 제거될 레이어 이름
     * @returns {boolean} 작동 완료 여부
     */
    removeNameSwipeLayer(name: string): boolean;
    /**
     * 스와이프 영역 출력 여부를 리턴합니다.
     * @returns {boolean} 스와이프 영역 출력 여부
     */
    getEnableSwipe(): boolean;
    /**
     * 스와이프 영역 출력 여부를 설정합니다.
     * @param {boolean} [enable=true] 스와이프 영역 출력 여부
     * @returns {boolean} 스와이프 영역 출력 설정 완료 여부
     */
    setEnableSwipe(enable?: boolean): boolean;
    /**
     * 스와이프 영역 출력 여부를 설정합니다.
     * @param {boolean} [enable=true] 스와이프 영역 출력 여부
     * @returns {boolean} 스와이프 영역 출력 설정 완료 여부
     */
    enableSwipe(enable?: boolean): boolean;
    /**
     * FPS 디버그 정보를 화면에 출력합니다.
     * UDevToolView의 Draw FPS와 같은 측정값을 사용하며, 그리기 통계가 기록될 때 갱신합니다.
     * @param {boolean} [visible=true] FPS 디버그 정보 출력 여부
     * @param {number} [left=1] 화면 좌측부터의 위치 비율 (%)
     * @param {number} [top=1] 화면 상단부터의 위치 비율 (%)
     * @returns {boolean} FPS 디버그 정보 출력 여부
     */
    debugFps(visible?: boolean, left?: number, top?: number): boolean;
    /**
     * 지도 조작을 담당하는 컨트롤 객체를 반환합니다.
     *
     * @returns {import('@union3d/mode/UMapControls').UMapControls | undefined} 지도 컨트롤 객체
     *
     * @example
     * app.getMapControl().getFactor().maxDistance = 10200000;
     */
    getMapControl(): UMapControls | undefined;
    getLodingDom(): HTMLElement;
    /**
     * GeOnDT for JS 의 메모리 및 작업 상태, 프레임 상태 등을 화면에 출력합니다.
     * @param {string} [id='loading-canvas'] 출력할 캔버스의 DOM ID 입니다.
     */
    createLoadingCanvas(id?: string): void;
    removeLoadingCanvas(): void;
    setVisibleLoading(visible?: boolean): void;
    addTotalProcessLoading(total?: number): void;
    addNowProcessLoading(now?: number): void;
    addTotalWorkLoading(total?: number): void;
    addNowWorkLoading(now?: number): void;
    addTotalUserLoading(total?: number): void;
    addNowUserLoading(now?: number): void;
    clearUserLoading(): void;
    updateLoading(): void;
    clearLoadingCount(): void;
    /**
     * 등록된 전체 레이어의 경계 상자를 표시하거나 숨깁니다.
     *
     * @param {boolean} isDebug 경계 상자 표시 여부 (true면 표시, false면 숨김)
     *
     * @example
     * app.debugBound(true);
     * app.debugBound(false);
     */
    debugBound(isDebug: boolean): void;
    /**
     * 지하 안개 색상을 설정합니다.
     * @param {import('three').ColorRepresentation} color 지하 안개 색상
     */
    setUndergroundFogColor(color: three.ColorRepresentation): void;
    /**
     * 지하 안개 색상을 리턴합니다.
     * @returns {import('three').ColorRepresentation} 지하 안개 색상
     */
    getUndergroundFogColor(): three.ColorRepresentation;
    /**
     * 지하 안개 밀도를 설정합니다.
     * @param {number} density 지하 안개 밀도
     */
    setUndergroundFogDensity(density: number): void;
    /**
     * 지하 안개 밀도를 리턴합니다.
     * @returns {number} 지하 안개 밀도
     */
    getUndergroundFogDensity(): number;
    /**
     * 지하 안개 시작 높이를 설정합니다.
     * @param {number} height 지하 안개 시작 높이
     */
    setUndergroundFogStartHeight(height: number): void;
    /**
     * 지하 안개 시작 높이를 리턴합니다.
     * @returns {number} 지하 안개 시작 높이
     */
    getUndergroundFogStartHeight(): number;
    /**
     * 지하 안개 끝 높이를 설정합니다.
     * @param {number} height 지하 안개 끝 높이
     */
    setUndergroundFogEndHeight(height: number): void;
    /**
     * 지하 안개 끝 높이를 리턴합니다.
     * @returns {number} 지하 안개 끝 높이
     */
    getUndergroundFogEndHeight(): number;
    createControls(): void;
    _controls: {};
    _curControl: UMapControls | UFlyControls;
    createMapControls(): void;
    getDrawBufferHeight(): number;
    getDrawBufferWidth(): number;
    /**
     * QuadTree의 업데이트 min level을 설정하는 함수
     * QuadTree의 업데이트 대상 최소 레벨을 설정합니다.
     * @param {number} level min level 값
     * @param {string} type 대상 quadTree ( U3dQuadTile : 'terrain', U3dQuadModelTile : 'model')
     * @returns {boolean} 적용 여부
     */
    setMinQuadTreeLevel(level: number, type?: string): boolean;
    /**
     * QuadTree의 업데이트 max level을 설정하는 함수
     * QuadTree의 업데이트 대상 최대 레벨을 설정합니다.
     * model type의 레이어 생성시 maxlevel이 기본 설정된 (기본값 17) 보다 높을 경우 해당 함수를 호출하여 maxLevel을 높여서 사용을 권장합니다.
     * @param {number} level max level 값
     * @param {string} type 대상 quadTree ( U3dQuadTile : 'terrain', U3dQuadModelTile : 'model')
     * @returns {boolean} 적용 여부
     */
    setMaxQuadTreeLevel(level: number, type?: string): boolean;
    /**
     * 앱 설정을 실행 중에 확인하고 바꿀 수 있는 개발 도구(DevTool) 창(View)을 만들어 반환하는 메서드입니다. <br>
     * 창은 앱의 컨테이너 Element 안에 만들어지며 만든 즉시 화면에 표시됩니다. <br>
     * 이미 만든 창이 있으면 새로 만들지 않고 그 창을 그대로 반환합니다. <br>
     * 앱의 컨테이너 Element가 없으면 창을 만들지 않고 undefined를 반환합니다. <br>
     * 반환된 창은 이 앱이 관리하므로 창의 dispose를 직접 호출하지 말고 removeDevToolView로 제거하십시오.
     *
     * @returns {import('@union3d/app/UDevToolView.js').UDevToolView | undefined} 이 앱의 개발 도구 창, 만들 수 없으면 undefined
     */
    createDevToolView(): UDevToolView | undefined;
    /**
     * 이 앱에 만들어 둔 개발 도구(DevTool) 창(View)을 새로 만들지 않고 반환하는 메서드입니다. <br>
     * 창을 아직 만들지 않았거나 removeDevToolView로 제거한 뒤에는 undefined를 반환합니다. <br>
     * 창이 없을 때 새로 만들어야 하면 createDevToolView를 사용하십시오.
     *
     * @returns {import('@union3d/app/UDevToolView.js').UDevToolView | undefined} 이 앱의 개발 도구 창, 없으면 undefined
     */
    getDevToolView(): UDevToolView | undefined;
    /**
     * 이 앱의 개발 도구(DevTool) 창(View)을 해제하고 화면에서 제거하는 메서드입니다. <br>
     * 창에 추가한 탭, 컨트롤러, 그래프와 등록한 갱신 콜백도 함께 사라집니다. <br>
     * 제거한 뒤에는 getDevToolView가 undefined를 반환하며, 다시 필요하면 createDevToolView나 showDevToolView로 새 창을 만드십시오. <br>
     * 창이 없으면 아무 작업도 하지 않습니다.
     */
    removeDevToolView(): void;
    /**
     * 이 앱의 개발 도구(DevTool) 창(View)을 화면에 표시하는 메서드입니다. <br>
     * 창이 없으면 createDevToolView와 같은 방식으로 새 창을 만든 뒤 표시합니다. <br>
     * hideDevToolView로 숨긴 창은 숨기기 전의 구성 그대로 다시 표시합니다.
     */
    showDevToolView(): void;
    /**
     * 이 앱의 개발 도구(DevTool) 창(View)을 화면에서 숨기는 메서드입니다. <br>
     * 숨긴 창은 구성과 등록한 갱신 콜백을 그대로 유지하므로 showDevToolView로 다시 표시할 수 있습니다. <br>
     * 창이 없으면 아무 작업도 하지 않으며 새 창을 만들지도 않습니다.
     */
    hideDevToolView(): void;
    createApp(opt: any): U3dApp;
    isDisposed(): boolean;
    saveJson(): {
        name: string;
        containername: string;
        idoverview: string;
        camTargetType: boolean;
        homePosition: three.Vector3;
        homeRotateDown: number;
        homeRotateLeft: number;
        maxProcess: any;
        frameOptimize: boolean;
        autoClear: boolean;
        ratioTileSize: number;
        ratioModelTileSize: number;
        useSunFlare: boolean;
        useshadowmap: boolean;
        intensitylight: number;
        intensitysunlight: number;
        toneExposure: number;
        usesky: boolean;
        usefog: boolean;
        useCloud: boolean;
        backgroundcolor: three.ColorRepresentation;
        fov: number;
        cameraType: "perspective" | "orthographic";
        improveTexture: string;
        pixelResolution: number[];
        pixelRatio: number;
        usePostProcess: boolean;
        postOption: PostProcessParam;
        datalevel: number;
        passlevel: number;
        minlevel: number;
        maxlevel: number;
        size: number;
        rectangle: UGeoRect;
        useimageopacity: any;
        imageopacity: any;
        usemodelopacity: any;
        modelopacity: any;
        methodheight: any;
        searchtype: string;
        modelimagedistance: number;
        modelimagedefaultlevel: number;
        viewportratio: number;
        near: number;
        far: number;
        minZoomLevel: number;
        maxZoomLevel: number;
        automove: boolean;
    };
    /**
     * canvas 화면을 캡쳐하여 스크린샷 이미지를 반환합니다. <br>
     * 기본적으로 WebGL 화면 위에 겹쳐진 DOM 레이어(U3dPOI의 라벨·마커, U3dOverlay 등)도 함께 합성됩니다. <br>
     * DOM 합성에 실패하면 WebGL 화면만 반환합니다. (리소스 제약은 captureDomLayer 참고)
     * @param {Partial<{dom: boolean}>} [opt={}] 캡처 옵션. dom: DOM 레이어 합성 여부, defaultValue(opt.dom, true)
     * @returns {Promise} then의 파라메터로 스크린샷 이미지의 dataURL 문자열 반한
     */
    capture(opt?: Partial<{
        dom: boolean;
    }>): Promise<any>;
    /**
     * canvas 화면을 캡쳐하여 스크린샷 이미지를 반환합니다. <br>
     * 기본적으로 WebGL 화면 위에 겹쳐진 DOM 레이어(U3dPOI의 라벨·마커, U3dOverlay 등)도 함께 합성됩니다. <br>
     * DOM 합성에 실패하면 WebGL 화면만 반환합니다. (리소스 제약은 captureDomLayer 참고)
     * @param {Partial<{dom: boolean}>} [opt={}] 캡처 옵션. dom: DOM 레이어 합성 여부, defaultValue(opt.dom, true)
     * @returns {Promise} then의 파라메터로 스크린샷 이미지의 Blob 반환
     */
    captureToBlob(opt?: Partial<{
        dom: boolean;
    }>): Promise<any>;
    getSearchType(): string;
    /**
     * U3dApp의 작동이 중지된 상태인지 반환합니다.
     * @returns {boolean} 작동 중지 여부
     */
    getStopRender(): boolean;
    /**
     * U3dApp의 작동을 중지 하거나 재게합니다.
     * @param {boolean} stop 작동 중지 / 재게 여부
     */
    setStopRender(stop: boolean): void;
    /**
     * 모델 이미지 제한 거리를 반환합니다.
     * @returns {number} 설정된 모델 이미지 제한 거리
     */
    getModelImageDistance(): number;
    /**
     * 모델 이미지 제한 거리를 설정합니다.
     * @param {number} val 모델 이미지 제한 거리
     */
    setModelImageDistance(val: number): void;
    /**
     * 모델 업데이트 중심점을 카메라 앞 혹은 뒤로 이동시키는 _modelUpdateOffset 속성값을 리턴합니다.
     * @returns {number} 모델 업데이트 중심점 이동 값
     */
    getModelUpdateOffset(): number;
    /**
     * 모델 업데이트 중심점을 카메라 앞 혹은 뒤로 이동시키는 _modelUpdateOffset 속성값을 설정합니다.
     * @param {number} val 모델 업데이트 중심점 이동 값
     */
    setModelUpdateOffset(val: number): void;
    getModelImageDefaultLevel(): number;
    setModelImageDefaultLevel(val: any): void;
    getMethodHeight(): any;
    setMethodHeight(val: any): void;
    _methodHeight: any;
    setBoundingTree(val: any): void;
    /**
     * 타일 Key 값으로 생성된 타일을 검색하여 반환합니다.
     * @param {string} key 타일 key
     * @param {string} type 타일의 타입(terrain, model)
     * @returns {undefined|import('@U3dQuadTile').U3dQuadTile} 타일
     */
    getTile(key: string, type?: string): undefined | U3dQuadTile;
    setMaxDistanceModel(val: any): void;
    getMaxDistanceModel(): any;
    setStopModel(val: any): void;
    getStopModel(): boolean;
    /**
     * 타일의 가로세로 비율을 설정하는 함수
     * @param {number} [val=0.7] 타일의 가로세로 비율, 값이 증가 할 수록 검색 되어 출력되는 양이 많아집니다. 그러나 속도가 느려질 수 있습니다.
     */
    setRatioTileSize(val?: number): void;
    /**
     * 모델 타일의 가로세로 비율을 설정하는 함수
     * @param {number} val=1.0 타일의 가로세로 비율, 값이 증가 할 수록 검색 되어 출력되는 양이 많아집니다. 그러나 속도가 느려질 수 있습니다.
     */
    setRatioModelTileSize(val: number): void;
    /**
     * 타일의 가로세로 비율을 반환하는 함수
     * @returns {number} 타일의 가로세로 비율
     */
    getRatioTileSize(): number;
    /**
     * 모델 타일의 가로세로 비율을 반환하는 함수
     * @returns {number} 모델 타일의 가로세로 비율
     */
    getRatioModelTileSize(): number;
    MetersToPixels(mx: any, my: any, zoom: any, px: any, py: any): boolean;
    setFrameOptimize(useFrameOptimize?: boolean): void;
    /**
     * 프레임 최적화 사용 여부를 반환합니다.
     *
     * @returns {boolean} 프레임 최적화 사용 여부
     */
    getFrameOptimize(): boolean;
    /**
     * 입력한 이름의 레이어에 투명도를 설정하는 함수
     * @param {string } name 레이어 이름
     * @param {number} val 설정할 투명도
     * @returns {boolean} 실행 결과
     */
    setOpacity(name: string, val: number): boolean;
    /**
     * 입력한 이름의 레이어에 투명도를 리턴하는 함수
     * @returns {number | null} 레이어의 투명도
     */
    getOpacity(name: any): number | null;
    getBox(): UBox3;
    createBox(): three.Box3;
    create2DShapeLayer(opt: any, featureCollection: any): any;
    /**
     * 해당 레이어 범위로 지도 화면을 위치시키는 함수
     * @param {string} layername 레이어 이름
     * @param {boolean} [useFly=false] 이동 시 애니메이션 사용 유무
     * @param {number} [offsetZ=0] 이동 시 카메라 타겟과 카메라와의 거리
     * @param {number} [leftrotate=0] 이동 시 카메라 좌우 각도
     * @param {number} [downrotate=0] 이동 시 카메라 상하 각도
     * @returns {Promise<boolean>} 수행여부
     */
    fitLayerExtent(layername: string, useFly?: boolean, offsetZ?: number, leftrotate?: number, downrotate?: number): Promise<boolean>;
    drawLayerExtent(layername: any, color: any): DeferredObject<unknown>;
    getEditHeightBoxList(): Map<string, any>;
    updateHeightLayers(box: any, minlevel: any, maxlevel: any): void;
    defined(value: any): boolean;
    assert(condition: any, message: any): void;
    setHighlightByMesh(mesh: any, opt: any): void;
    removeHighlightByMesh(mesh: any, opt: any): void;
    getPropertiesKeys(): string[];
    addProperties(key: any, value: any): void;
    getProperties(key: any): any;
    setProperties(key: any, value: any): void;
    removeProperties(key: any): void;
    getPoiList(): any[];
    /**
     * 한 프레임당 최대 작업 프로세스를 설정하는 함수
     * @param {number} maxProcess 최대 프로세스 수
     */
    setMaxProcess(maxProcess?: number): void;
    /**
     * 한 프레임당 최대 작업 프로세스 수를 반환하는 함수
     * @returns {number} 최대 프로세스 수
     */
    getMaxProcess(): number;
    applyMaxProcess(maxProcess?: number): void;
    /**
     * @description U3dApp에 출력을 지시하는 함수
     * @param {import('three').Object3D} object 출력할 3D object
     */
    addObject(object: three.Object3D): void;
    /**
     * @description U3dApp에서 출력하고 있는 객체를 제거하는 함수
     * @param {import('three').Object3D} object 제거할 3D object
     */
    removeObject(object: three.Object3D): void;
    /**
     * POI의 id로 해당 POI를 반환하는 함수
     * @param {string} id POI의 id
     * @returns {import('@union3d/geometry/U3dPOI').U3dPOI | undefined} U3dPOI 객체
     */
    getPoiById(id: string): U3dPOI | undefined;
    /**
     * 지도에 POI를 생성하여 추가하는 함수
     * @param {U3dPOICO} opt POI 생성 옵션
     * @param {string} opt.name POI 이름
     * @param {WorldPosition} opt.position POI 생성 위치 (월드 좌표)
     * @param {ColorLike} opt.color POI 츌력 라벨 색상
     * @param {number} opt.size 텍스트 크기
     * @param {string} [opt.image] POI 출력 이미지 경로
     * @param {number} [opt.imageSize] POI 출력 이미지 크기
     * @param {string} [opt.label] POI 출력 라벨
     * @param {import('three').Vector3} [opt.heightOffset] 텍스트 높이 보정 값
     * @param {boolean} [opt.select=false] POI 츌력 박스 여부
     * @param {boolean} [opt.depthTest=fals]e POI 출력시, 다른 객체에 의해 가려지는지 깊이 계산 실행 여부
     * @returns {Promise<import('@U3dPOI').U3dPOI> | null} 실행 완료 여부
     */
    createPOI(opt: U3dPOICO): Promise<U3dPOI> | null;
    /**
     * POI를 지도에 추가하는 함수
     * @param {import('@union3d/geometry/U3dPOI').U3dPOI} poi U3dPOI 객체
     */
    addPOI(poi: U3dPOI): void;
    /**
     * POI를 지도에서 삭제하는 함수
     * @param {import('@union3d/geometry/U3dPOI').U3dPOI} poi U3dPOI 객체
     */
    removePOI(poi: U3dPOI): void;
    /**
     * 지도에 추가된 모든 POI를 삭제하는 함수
     *
     * @deprecated `removeAllPOI`를 사용하세요. 이 함수는 곧 제거됩니다.
     */
    removeAllPoi(): void;
    /**
     * 지도에 추가된 모든 POI를 삭제합니다.
     *
     */
    removeAllPOI(): void;
    /**
     * 등록된 모든 POI를 지도에서 출력제어하는 함수
     * @param {boolean} show 출력여부
     */
    showAllPOI(show?: boolean): void;
    /**
     * 등록된 POI를 지도에서 출력제어하는 함수
     * @param {boolean} show 출력여부
     * @param {import('@union3d/geometry/U3dPOI').U3dPOI} poi U3dPOI 객체
     */
    showPOI(show: boolean, poi: U3dPOI): void;
    selectPoi(e: any): any;
    removeAllObject(): void;
    getImageLayerByRenderOrder(order: any): U3dLayer;
    getInstanceBaseLayer(): U3dLayer;
    getInstanceBaseHeightLayer(): U3dLayer;
    /**
     * 기본 지도로 사용 중인 이미지 레이어의 이름을 반환합니다.
     *
     * @returns {string} 레이어 이름
     *
     * @example
     * const name = app.getNameBaseLayer();
     */
    getNameBaseLayer(): string;
    /**
     * 기본 지도로 사용할 이미지 레이어의 이름을 설정합니다.
     *
     * @param {string} name 레이어 이름
     *
     * @example
     * app.setNameBaseLayer('satellite');
     */
    setNameBaseLayer(name: string): void;
    getCanvas(): HTMLCanvasElement;
    /**
     * 로딩 화면으로 사용할 HTML 요소를 등록합니다.
     *
     * @param {string} containerid 로딩 화면으로 사용할 HTML 요소의 ID
     *
     * @example
     * app.createloadingBar('load');
     * app.loadingBar();
     */
    createloadingBar(containerid: string): void;
    /**
     * 등록한 로딩 화면을 표시합니다.
     *
     * 사용하기 전에 `createloadingBar()`로 로딩 화면의 HTML ID를 등록해야 합니다.
     * 작업이 끝나면 `endloadingBar()`로 로딩 화면을 숨깁니다.
     *
     * @example
     * app.createloadingBar('load');
     * app.loadingBar();
     * // 작업 완료 후
     * app.endloadingBar();
     */
    loadingBar(): void;
    /**
     * 등록한 로딩 화면을 종료하고 화면에서 숨깁니다.
     *
     * @example
     * app.loadingBar();
     * // 작업 완료 후
     * app.endloadingBar();
     */
    endloadingBar(): void;
    /**
     * 디버그 화면을 제거합니다.
     *
     * @example
     * app.removeDebugCanvas();
     */
    removeDebugCanvas(): void;
    /**
     * 앱 설정을 확인할 수 있는 디버그 화면을 생성합니다.
     *
     * @example
     * app.createDebugCanvas();
     */
    createDebugCanvas(): void;
    setSizeBaseWindow(left: any, top: any, width: any, height: any): void;
    setSizeSwipeWindow(left: any, top: any, width: any, height: any): void;
    /**
     * 출력되고 있는 모델 레이어들의 전체 투명도 적용 여부를 리턴하는 함수
     * @returns {boolean} 모델 레이어들의 전체 투명도 적용 여부
     */
    getEnableOpacityModelLayers(): boolean;
    /**
     * 출력되고 있는 이미지 레이어들의 전체 투명도 적용 여부를 리턴하는 함수
     * @returns {boolean} 이미지 레이어들의 전체 투명도 적용 여부
     */
    getEnableOpacityImageLayers(): boolean;
    /**
     * 출력되고 있는 모델 레이어들의 설정된 투명도를 적용하는 함수
     * @param {boolean} enable 모델 레이어에 투명도 적용 여부
     */
    setEnableOpacityModelLayers(enable: boolean): boolean;
    /**
     * 출력되고 있는 이미지 레이어들의 설정된 투명도를 적용하는 함수
     * @param {boolean} enable 이미지 레이어에 투명도 적용 여부
     */
    setEnableOpacityImageLayers(enable: boolean): boolean;
    /**
     * 출력되고 있는 모델 레이어들의 전체 투명도 설정 값을 리턴하는 함수
     * @returns {number} 모델 레이어들의 전체 투명도 설정 값
     */
    getOpacityModelLayers(): number;
    /**
     * 출력되고 있는 이미지 레이어들의 전체 투명도 설정 값을 리턴하는 함수
     * @returns {number} 이미지 레이어들의 전체 투명도 설정 값
     */
    getOpacityImageLayers(): number;
    /**
     * 출력되고 있는 모델 레이어들의 투명도를 설정하는 함수
     * @param {number} value 모델 레이어에 적용될 투명도
     */
    setOpacityModelLayers(value: number): void;
    /**
     * 출력되고 있는 이미지 레이어들의 투명도를 설정하는 함수
     * @param {number} value 이미지 레이어에 적용될 투명도
     */
    setOpacityImageLayers(value: number): void;
    /**
     * 전역 클립핑 활성화 함수
     * @param {boolean} enable 활성화 여부
     * @returns {boolean} 실행 성공 여부
     */
    setEnableClipping(enable: boolean): boolean;
    setClippingAxisX(value: any): void;
    setClippingAxisY(value: any): void;
    setClippingAxisZ(value: any): void;
    setClippingAxisHeight(value: any): void;
    /**
     * 전역 클립핑 X축 적용 함수
     * @param {number} value -1 ~ 1 사이의 실수 입력, 카메라의 X축(양수 일때 왼쪽에서 오른쪽, 음수일때 오른쪽에서 왼쪽)으로 입력 값을 비율값으로 환산 후 클립핑 적용
     */
    setClippingAxisXByRatio(value: number): void;
    /**
     * 전역 클립핑 Y축 적용 함수
     * @param {number} value -1 ~ 1 사이의 실수 입력, 카메라의 Y축(양수 음수 상관없이 카메라가 바라보는 방향)으로 입력 값을 비율값으로 환산 후 클립핑 적용
     */
    setClippingAxisYByRatio(value: number): void;
    /**
     * 전역 클립핑 Z축 적용 함수
     * @param {number} value -1 ~ 1 사이의 실수 입력, 해발 고도 0m를 기준으로 (양수 일시 0m 위 방향, 음수 일시 0m 아래 방향)입력 값을 비율값으로 환산 후 클립핑 적용
     */
    setClippingAxisHeightByRatio(value: number): void;
    /**
     * 전역 클립핑 초기화 함수
     */
    clearClippingAxis(): void;
    setClippingAxisZByRatio(value: any): void;
    /**
     * app 초기화(Initialized) 여부를 반환하는 함수
     * @returns {boolean} app 초기화 여부
     */
    isInitialized(): boolean;
    /**
     * 지도의 모드를 지정하는 함수 <br>
     * 모드를 바꾸면 화면에 떠 있던 팝업은 모두 닫힙니다.
     * @param {number} mode 지정할 지도 모드 [1 : Pan] (`UDEF.APP_MODE` 참고)
     */
    setMode(mode: number): void;
    /**
     * 현재 지도의 모드를 반환하는 함수
     * @returns {number} 지도 모드 [1 : Pan]
     */
    getMode(): number;
    isSimulationMode(): boolean;
    /**
     * 현재 설정된 fov(화각, Field of View) 반환 함수
     * @returns {number} fov(화각, Field of View) 수치
     */
    getFov(): number;
    /**
     * Fov(Field of View, 화각) 설정 함수
     * @param {number} fov fov 값
     * @returns {boolean} 실행 결과
     */
    setFov(fov: number): boolean;
    /**
     * 지도화면 fov(화각, Field of View) 설정 함수
     * @param {number} fov 수치
     * @returns {boolean} 설정 성공 여부. 카메라가 없으면 `false`
     */
    setCameraFov(fov: number): boolean;
    /**
     * 현재 설정된 fov(화각, Field of View) 반환 함수
     * @returns {number} fov(화각, Field of View) 수치
     */
    getCameraFov(): number;
    /**
     * 지도이동 모드(Pan 모드)로 전환하는 함수
     * @param {number} [type=1] app 컨트롤 모드 [1 : PAN 모드]
     */
    setPanMode(type?: number): void;
    /**
     * 지하모드 시 지하 공간에 격자를 가시화하는 함수
     * @param {boolean} show 지하격자 가시화 여부 [ true : 활성 / false : 비활성 ]
     */
    showUnderGroundGrid(show: boolean): void;
    /**
     * 지하모드를 활성화 여부 반환 함수
     * @returns {boolean} 지하모드 활성 여부 [ true : 활성 / false : 비활성 ]
     */
    isUnderGroundMode(set: any): boolean;
    /**
     * 지하모드를 활성하는 함수
     * @param {boolean} set 지하모드 활성 여부 [ true : 활성 / false : 비활성 ]
     */
    setUnderGroundMode(set: boolean): void;
    /**
     * 보행모드로 전환하는 함수
     * @ignore
     */
    setWalkMode(position: any, target: any, minHeight: any): any;
    /**
     * 비행모드로 전환하는 함수
     * @ignore
     */
    setFlyMode(): void;
    /**
     * 경사도 측정 모드로 전환하는 함수
     */
    setSlopeMode(): void;
    /**
     * app의 컨트롤 모드를 활성하는 함수
     * @param {string} mode app의 컨트롤 모드 값 `map` `walk` `fly`
     */
    activeMode(mode: string): void;
    /**
     * 지정된 위치로 부드럽게 이동하며 타겟을 바라보는 함수 (Tween 애니메이션 사용)
     *
     * 2D 지도 모드에서는 시선이 TopView에 고정되므로, target을 화면 중심으로 유지하고
     * 카메라를 그 바로 위 `position.z` 높이에 배치합니다. 이때 `position`의 x, y는 사용되지 않습니다.
     *
     * @param {WorldPosition} position 이동할 3D 월드 좌표
     * @param {WorldPosition} [target] 바라볼 3D 월드 좌표 (생략 시 현재 타겟 유지)
     * @param {number} [duration] 이동에 걸리는 시간 (밀리초)
     * @returns {Promise<boolean>} 이동 완료 시점의 Promise
     */
    flyToPosition(position: WorldPosition, target?: WorldPosition, duration?: number): Promise<boolean>;
    /**
     * 입력받은 지리좌표(GeoPosition)로 카메라를 이동시키는 함수
     * @param {GeoPosition} position 이동할 위경도 좌표
     * @param {number} [duration=3000] 애니메이션 시간 (밀리초)
     * @returns {Promise<boolean>} 이동 완료 시점의 Promise
     */
    flyTo(position: GeoPosition, duration?: number): Promise<boolean>;
    /**
     * @deprecated  flyToVector3_ API 가 flyToPosition로 변경 되었습니다. API 호출을 flyToPosition로 변경하여 주십시오.
     *
     * @param {WorldPosition} position 이동 할 3D 월드 좌표
     * @param {WorldPosition} [target] 바라볼 3D 월드 좌표 (생략 시 현재 타겟 유지)
     * @param {number} [duration] 이동에 걸리는 시간 (밀리초)
     * @returns {Promise<boolean>} 이동 완료 시전의 Promise
     */
    flyToVector3_(position: WorldPosition, target?: WorldPosition, duration?: number): Promise<boolean>;
    /**
     * 입력받은 클릭 이벤트로 카메라를 이동시키는 함수
     * @param {import('@U3dMouseEvent').U3dMouseEvent} event 마우스 이벤트 객체
     * @param {number} [offset = 1] 추가 이동 오프셋
     * @returns {Promise<boolean>} 이동 완료 시점의 Promise
     */
    flyToClick(event: U3dMouseEvent, offset?: number): Promise<boolean>;
    /**
     * 카메라가 향해있는 타겟으로 이동하는 함수
     *
     * @param {number} [offset=1] 타겟에서 카메라 쪽으로 떨어질 거리
     * @param {number} [duration=3000] 애니메이션 시간 밀리세컨드 단위
     * @returns {Promise<boolean>} 이동 완료 시점의 Promise
     */
    flyToTarget(offset?: number, duration?: number): Promise<boolean>;
    /**
     * 현재 카메라 타겟의 포지션을 리턴하는 함수
     * @returns {GeoPosition} 위경도 좌표 x,y,z
     */
    getLandTargetPosition(): GeoPosition;
    initOpenLayers(): void;
    /**
     * 기본위치(홈) 정보를 반환하는 함수(경도, 위도, 고도, 방위각, 고도각)
     * @returns {object} {x: {number}, y: {number}, height: {number}, rotateLeft: {number}, rotatedown: {number}}
     */
    getHomePosition(): object;
    /**
     * 기본 위치(홈)를 설정하는 함수
     * @param {number} geox 위경도 x값
     * @param {number} geoy 위경도 y값
     * @param {number} height 고도값
     * @param {number} [rotateleft] 방위각
     * @param {number} [rotatedown] 고도각
     * @returns {Promise<boolean>} 이동 완료 promise 반환
     */
    setHomePosition(geox: number, geoy: number, height: number, rotateleft?: number, rotatedown?: number): Promise<boolean>;
    _homePosition: three.Vector3;
    /**
     * 설정된 homePosition 의 위치로 이동하는 함수
     * @param {number} duration 카메라가 해당 위치로 이동하는데 소요 시간
     * @returns {Promise<boolean>} 이동 완료 Promise 반환
     */
    updateHomePosition(duration?: number): Promise<boolean>;
    /**
     * OpenLayers 기반 이미지 타일 레이어 생성 함수
     * @param {U3dOpenLayerCO} opt U3dOpenLayer 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayer | undefined} U3dOpenLayer 레이어 객체
     */
    create3dOpenLayer(opt: U3dOpenLayerCO): U3dOpenLayer | undefined;
    /**
     * `OGC WMTS`를 이용한 이미지 레이어로를 생성합니다.
     * @param {U3dImageWMTSLayerCO} opt U3dImageWMTSLayer 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dImageWMTSLayer').U3dImageWMTSLayer | undefined} U3dImageWMTSLayer 레이어 객체 반환
     */
    create3dImageWMTSLayer(opt: U3dImageWMTSLayerCO): U3dImageWMTSLayer | undefined;
    /**
     * 데칼 영역 및 데칼 표현 레이어 생성 함수입니다.
     * @param {U3dPatternXYZLayerCO} opt U3dPatternXYZLayer 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dPatternXYZLayer').U3dPatternXYZLayer | undefined} U3dPatternXYZLayer 레이어 객체 반환
     */
    createPatternLayer(opt: U3dPatternXYZLayerCO): U3dPatternXYZLayer | undefined;
    /**
     * Emap 기본 지도를 생성하는 레이어 함수입니다.
     * @param {U3dEmapLayerCO} opt Emap 기본 지도 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayer | undefined} 생성된 U3dOpenLayer 레이어
     */
    createEmapBaseLayer(opt: U3dEmapLayerCO): U3dOpenLayer | undefined;
    /**
     * Emap 위성 지도를 생성하는 레이어 함수입니다.
     * @param {U3dEmapSatLayerCO} opt Emap 위성 지도 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayer | undefined} 생성된 U3dOpenLayer 레이어
     */
    createEmapSatLayer(opt: U3dEmapSatLayerCO): U3dOpenLayer | undefined;
    /**
     * Emap 공통 WMTS 템플릿 레이어를 생성하는 함수입니다.
     * @param {U3dEmapLayerCO} opt Emap 템플릿 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayer | undefined} 생성된 U3dOpenLayer 레이어
     */
    createEmapTemplateLayer(opt: U3dEmapLayerCO): U3dOpenLayer | undefined;
    /**
     * XML capabilities 조회가 필요한 WMTS 레이어를 생성하는 함수입니다.
     * @param {U3dWMTSLayerCO} opt WMTS 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayer | undefined} 생성된 U3dOpenLayer 레이어
     */
    createWMTSLayer(opt: U3dWMTSLayerCO): U3dOpenLayer | undefined;
    /**
     * WMTS 공통 템플릿 레이어를 생성하는 함수입니다.
     * @param {U3dWMTSLayerCO} opt WMTS 템플릿 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayer | undefined} 생성된 U3dOpenLayer 레이어
     */
    createWMTSTemplateLayer(opt: U3dWMTSLayerCO): U3dOpenLayer | undefined;
    /**
     * TMS 이미지 레이어를 생성하는 함수입니다.
     * @param {U3dTMSImageLayerCO} opt TMS 이미지 레이어 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayer | undefined} 생성된 U3dOpenLayer 레이어
     */
    createTMSImageLayer(opt: U3dTMSImageLayerCO): U3dOpenLayer | undefined;
    /**
     * 입력받은 값으로 TMS 이미지 레이어를 생성하는 함수
     * @param {string} name 레이어 이름
     * @param {string} baseurl 레이어 데이터 주소
     * @param {string} srs 데이터 소스 좌표계
     * @param {object} boundingBox 타일 경계 박스
     * @param {'raster' | 'mercator' | undefined} profile 타일 프로필. 기본값 'raster'
     * @param {string} ext 데이터 포맷 확장자
     * @param {number} minlevel 최소 줌 레벨
     * @param {number} maxlevel 최대 줌 레벨
     * @param {number | undefined} tileWidth 타일 너비. 기본값 256
     * @param {number} maxresolution 최고 해상도
     * @param {string | undefined} proj 좌표계 투사 보정값
     * @param {string} proxyurl 프록시 주소
     * @param {boolean} useproxy 프록시 사용 여부
     * @param {boolean | undefined} reverseY Y 반전 여부. 기본값 false
     * @param {string | undefined} majorFolder 폴더 구조 방식 (ColumFirst:z/x/y ,RowFirst:z/y/x). 기본값 'ColumFirst'
     * @param {{ x: number, y: number } | undefined} origin 원점 좌표
     * @returns {import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayer | undefined} 생성된 U3dOpenLayer 레이어
     */
    createTMSImageLayerAsXML(name: string, baseurl: string, srs: string, boundingBox: object, profile: "raster" | "mercator" | undefined, ext: string, minlevel: number, maxlevel: number, tileWidth: number | undefined, maxresolution: number, proj: string | undefined, proxyurl: string, useproxy: boolean, reverseY: boolean | undefined, majorFolder: string | undefined, origin: {
        x: number;
        y: number;
    } | undefined): U3dOpenLayer | undefined;
    /**
     * TMS 템플릿 레이어를 생성하는 함수
     * @param {string} baseurl 타일 서비스 주소
     * @param {string} srs 좌표계
     * @param {'raster' | 'mercator'} profile 타일 프로필
     * @param {Array<number>} extent 범위
     * @param {number} tileSize 타일 크기
     * @param {Array<number>} matrixIds 매트릭스 ID 배열
     * @param {Array<number>} resolutions 해상도 배열
     * @param {string} ext 파일 확장자
     * @param {string | undefined} proj proj4 정의 문자열
     * @param {number} minZoom 최소 줌 레벨
     * @param {string} proxyurl 프록시 주소
     * @param {boolean} useproxy 프록시 사용 여부
     * @param {boolean} reverseY Y축 반전 여부
     * @param {string | undefined} majorFolder 폴더 구조 방식
     * @param {{ x: number, y: number } | undefined} origin 원점 좌표
     * @param {object} [sharedSource] U3dOpenLayer가 등록 레이어 단위로 재사용하는 기존 OL source
     * @returns {object} 생성된 타일 레이어 {ol.layer.Tile}
     */
    createTempleteTMSImageLayer(baseurl: string, srs: string, profile: "raster" | "mercator", extent: Array<number>, tileSize: number, matrixIds: Array<number>, resolutions: Array<number>, ext: string, proj: string | undefined, minZoom: number, proxyurl: string, useproxy: boolean, reverseY: boolean, majorFolder: string | undefined, origin: {
        x: number;
        y: number;
    } | undefined, sharedSource?: object): object;
    /**
     * 현재 U3dApp에 등록된 지형(Terrain) 레이어를 반환하는 함수
     * @returns {import('@union3d/3dLayer/U3dTerrainLayer').U3dTerrainLayer | undefined} 지형 레이어
     */
    getTerrainLayer(): U3dTerrainLayer | undefined;
    /**
     * 지형을 표시하는 레이어를 생성해 앱에 추가합니다.
     * 이미 지형 레이어가 있으면 새로 만들지 않습니다.
     *
     * @param {U3dModelLayerCO} [opt={}] 지형 레이어 생성 옵션
     *
     * @example
     * app.createTerrainLayer({
     *     name: 'terrain'
     * });
     */
    createTerrainLayer(opt?: U3dModelLayerCO): void;
    /**
     * 현재 U3dApp에 등록된 측정(Measure) 레이어를 반환하는 함수
     * @returns {import('@union3d/3dLayer/U3dShaderMeasureLayer').U3dShaderMeasureLayer | undefined} 측정 레이어
     */
    getMeasureLayer(): U3dShaderMeasureLayer | undefined;
    /**
     * U3dApp에 측정(Measure) 레이어를 생성하고 등록하는 함수
     * @param {object} opt 측정 레이어 생성 옵션
     * @returns {boolean} 생성 성공 여부
     */
    createMeasureLayer(opt: object): boolean;
    /**
     * 입력 받은 위경도 좌표를 3D 월드 좌표로 변환하는 함수
     * @param {number} geoX 위경도 X좌표
     * @param {number} geoY 위경도 Y좌표
     * @param {number} height 높이
     * @returns {WorldPosition} 3D 월드 좌표
     */
    getGeographicToWorld(geoX: number, geoY: number, height: number): WorldPosition;
    /**
     * 오버뷰 지도의 회전값을 설정합니다.
     *
     * @param {number} rad 회전값(라디안)
     * @returns {boolean} 설정 성공 여부
     *
     * @example
     * app.setRotationOverviewMap(rad);
     */
    setRotationOverviewMap(rad: number): boolean;
    /**
     * 오버뷰 지도의 중심 위치를 설정합니다.
     *
     * @param {number} geox 경도
     * @param {number} geoy 위도
     * @returns {boolean} 설정 성공 여부
     *
     * @example
     * app.setGeoCenterToOverviewMap(127, 37);
     */
    setGeoCenterToOverviewMap(geox: number, geoy: number): boolean;
    /**
     * 지도 화면의 방위각(정북 기준 회전값)을 반환합니다.
     *
     * @param {boolean} [bAngle=false] `true`면 도(degree) 단위로, 생략하거나 `false`면 라디안으로 반환합니다
     * @returns {number | undefined} 방위각. 지도 컨트롤이 방위각을 지원하지 않으면 `undefined`
     *
     * @example
     * const degree = app.getRotation(true);
     */
    getRotation(bAngle?: boolean): number | undefined;
    /**
     * 지도 화면의 극각(카메라가 수직에서 기울어진 회전값)을 반환합니다.
     *
     * @param {boolean} [bAngle=false] `true`면 도(degree) 단위로, 생략하거나 `false`면 라디안으로 반환합니다
     * @returns {number} 극각
     *
     * @example
     * const degree = app.getRotationPolar(true);
     */
    getRotationPolar(bAngle?: boolean): number;
    /**
     * 지도를 한 단계 확대합니다.<br>
     * 카메라와 화면 중심 사이의 거리를 절반으로 줄여 줌 레벨 1칸에 해당하는 만큼 다가갑니다.<br>
     * 목표 레벨을 지정하는 것이 아니라 현재 거리를 기준으로 움직이므로, 지형 충돌 보정으로 요청만큼 다가가지 못해도 다음 호출이 이어서 동작합니다.<br>
     * 현재 레벨이 이미 최대 줌 레벨 이상이면 아무것도 하지 않습니다.<br>
     * 지도 컨트롤이 아직 만들어지지 않았어도 아무것도 하지 않습니다.<br>
     * getZoom()이 돌려주는 레벨은 이 호출이 아니라 다음 화면 갱신에서 실측값으로 바뀝니다.
     */
    zoomIn(): void;
    /**
     * 지도를 한 단계 축소합니다.<br>
     * 카메라와 화면 중심 사이의 거리를 두 배로 늘려 줌 레벨 1칸에 해당하는 만큼 멀어집니다.<br>
     * 현재 레벨이 이미 최소 줌 레벨 이하이면 아무것도 하지 않으며, 그 밖의 동작 방식은 zoomIn()과 같습니다.
     *
     * @see {@link U3dApp#zoomIn}
     */
    zoomOut(): void;
    /**
     * 거리에 따른 화면 해상도(Resolution)를 설정하는 함수
     * @param {number} distance 거리
     */
    setResolution(distance: number): void;
    /**
     * 화면 해상도(Resolution)를 반환하는 함수, 카메라와 컨트롤러 타겟의 거리를 의미, onChange 이벤트에서 자동으로 갱신하여 준다.
     * @returns {number} 설정된 화면 해상도 (ex : 350)
     */
    getResolution(): number;
    getResolutionFromZoom(zoom: any): number;
    getZoomFromResolution(resolution: any): number;
    /**
     * 현재 지도의 줌 레벨을 반환합니다.
     *
     * @returns {number} 줌 레벨
     */
    getZoom(): number;
    /**
     * 지도를 지정한 줌 레벨로 곧바로 옮깁니다.<br>
     * 레벨을 카메라와 화면 중심 사이의 거리로 환산한 뒤 현재 바라보는 방향을 유지한 채 그 거리에 카메라를 놓습니다.<br>
     * 레벨이 1 커질 때마다 거리가 절반이 되므로 값이 클수록 확대됩니다.<br>
     * zoomIn()이나 zoomOut()과 달리 최소·최대 줌 레벨을 확인하지 않으므로, 범위를 벗어난 값을 넘기면 그대로 적용을 시도합니다.<br>
     * 배치 뒤 화면을 갱신하면서 지형 충돌 보정이 카메라를 밀어 올릴 수 있어 실제 도달 레벨이 요청값과 달라질 수 있습니다.<br>
     * getZoom()이 돌려주는 레벨은 이 호출이 아니라 다음 화면 갱신에서 실측값으로 바뀝니다.
     *
     * @param {number} zoom 적용할 줌 레벨이며 정수가 아닌 값도 그대로 거리로 환산
     */
    setZoom(zoom: number): void;
    /**
     * 위경도 좌표(EPSG:4326)값을 받아 google 좌표(EPSG:3857)로 변환하는 함수
     * @param {number} geoX 위경도 좌표 X
     * @param {number} geoY 위경도 좌표 Y
     * @param {number} height 해발 고도
     * @returns {GooglePosition} google 좌표
     */
    getGeographicToGoogle(geoX: number, geoY: number, height?: number): GooglePosition;
    /**
     * google 좌표(EPSG:3857)값을 받아 위경도 좌표(EPSG:4326)로 변환하는 함수
     * @param {number} googlex google 좌표 X
     * @param {number} googley google 좌표 Y
     * @param {number} googlez google 좌표 Z
     * @returns {GeoPosition} 위경도 좌표
     */
    getGoogleToGeographic(googlex: number, googley: number, googlez?: number): GeoPosition;
    /**
     * 3D 공간 바닥면 사각형(Rectangle)을 반환하는 함수. `위경도 좌표`를 가지고 있다.
     * @returns {import('@UGeoRect').UGeoRect} 3D 공간 바닥면 사각형(Rectangle)
     */
    getRectangle(): UGeoRect;
    /**
     * 고도 레이어를 생성하는 함수
     * @param {string} name 고도 레이어 이름
     * @param {U3dHeightXYZLayerCO} opt  U3dHeightXYZLayer 레이어를 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dHeightXYZLayer').U3dHeightXYZLayer} U3dHeightXYZLayer 레이어 객체 반환
     */
    createHeightXYZLayer(name: string, opt: U3dHeightXYZLayerCO): U3dHeightXYZLayer;
    /**
     * 타일 레벨에 따른 화면 해상도(Resolution)을 반환하는 함수
     * @param {number} level 타일 레벨
     * @returns {number} 화면 해상도(Resolution)
     */
    googleResolution(level: number): number;
    /**
     * 타일을 순회하면서 callback 함수를 호출하는 함수
     * @param {function} callback 콜백 함수
     */
    traverseTiles(callback: Function): void;
    setWireFrameRendering(value: any): boolean;
    getWireFrameRendering(): boolean;
    /**
     * 레이어의 프로세스 업데이트 여부를 확인하는 함수
     * @param {String} [name] 레이어 이름 (undefined 일 경우 전체 레이어에 해당하는 값 반환)
     * @returns {boolean} 프로세스 업데이트 여부 [true : 업데이트 중, false : 업데이트 완료]
     */
    isUpdateProcess(name?: string): boolean;
    /**
     * 레이어의 프로세스 동작 여부를 반환하는 함수
     * @param {String} [name] 레이어 이름 (undefined 일 경우 전체 레이어에 해당하는 값 반환)
     * @returns {boolean} 프로세스 동작 여부 [true : 동작 중, false : 동작 안함]
     */
    getWorking(name?: string): boolean;
    createWorkingEndEvent(name: any): void;
    /**
     * 동작 중인 프로세스 수를 반환하는 함수
     * @returns {number} 동작 중인 프로세스 수
     */
    getWorkingCount(): number;
    getWorkingLevel2(): any;
    getWorkingLevel3(): any;
    getWorkingImage(): number;
    getWorkingHeight(name: any): number;
    getWorkingModel(): number;
    getWorkingInDistance(opt: any): number;
    listenEndWork(callback: any, param: any): void;
    /**
     * 3D 모델 레이어를 정적으로 로딩시켜, 한 번 가시화된 모델을 사라지지 않게 설정하는 함수
     * @param {boolean} tileloadall 정적로딩 활성 여부
     * @param {number} [maxDistance] 모델을 사라지지 않게 유지할 최대 거리
     * @returns {Promise<boolean>} 설정 적용이 끝난 시점의 Promise
     *
     * @example
     * app.keepModelByDistance(true).then(() => console.log('적용 완료'));
     * */
    keepModelByDistance(tileloadall: boolean, maxDistance?: number): Promise<boolean>;
    /**
     * 3D 모델 레이어를 정적으로 로딩시켜, 한 번 가시화된 모델을 사라지지 않게 설정하는 함수
     * @param {object} opt 정적로딩 parameter
     * @param {boolean} opt.tileloadall 정적로딩 활성 여부
     * @param {boolean} [opt.ratiotilesize] 타일 가로세로 비율
     * @param {boolean} [opt.stopmodel] 정적 모델 여부
     * @param {Function} [callback] 콜백함수
     * @param {object} [param] 콜백함수의 parameter
     */
    applyAppFromParameter(opt: {
        tileloadall: boolean;
        ratiotilesize?: boolean;
        stopmodel?: boolean;
    }, callback?: Function, param?: object): void;
    /**
     * dispose된 타일 위의 모델을 전체 제거하는 함수
     */
    disposeTileModelAll(): void;
    redraw(layername: any): void;
    forceOuterDeleteModel(layername: any, limit?: any): void;
    /**
     * 쿼드타일(QuadTile)울 새로고침합니다. <br>
     * 타일 출력을 초기화하고 현제 카메라 상태에 따른 타일을 다시 출력합니다.
     */
    restartQuadTree(): void;
    disposeQuadTree(): void;
    /**
     * U3dApp의 레이어를 삭제하는 함수
     * @param {string | import('@U3dLayer').U3dLayer} name 레이어 이름 또는 레이어 객체
     */
    removeLayer(name: string | U3dLayer): void;
    /**
     * 앱에 등록된 레이어를 관리하는 목록 객체를 반환합니다.
     *
     * @returns {import('@union3d/3dLayer/U3dLayerList').U3dLayerList | undefined} 레이어 목록 객체
     *
     * @example
     * const layerList = app.getLayerList();
     */
    getLayerList(): U3dLayerList | undefined;
    /**
     * 레이어를 화면에 표시하거나 숨깁니다. <br>
     * 표시할 때는 레이어 로딩이 끝난 시점에 완료되므로, 이후 작업을 이어서 하려면 `await`로 기다립니다.
     *
     * @param {string} name 레이어 이름
     * @param {boolean} [show=true] 표시 여부. `false`면 숨깁니다
     * @param {boolean} [deleteCache=false] `true`면 레이어가 들고 있던 캐시를 모두 비우고 다시 불러옵니다
     * @returns {Promise<{result: string, content: import('@U3dLayer').U3dLayer}> | false} 표시(또는 숨김)가 끝난 시점의 Promise. 이름이 없거나 지도가 아직 준비되지 않았으면 `false`를 반환하고, 이름에 해당하는 레이어가 없으면 reject 됩니다
     *
     * @example
     * await app.showLayer('satellite');            // 표시하고 로딩까지 기다립니다.
     * app.showLayer('satellite', false);           // 숨깁니다.
     * app.showLayer('satellite', true, true);      // 캐시를 비우고 다시 표시합니다.
     */
    showLayer(name: string, show?: boolean, deleteCache?: boolean): Promise<{
        result: string;
        content: U3dLayer;
    }> | false;
    /**
     * 이미지 레이어를 화면에 표시하거나 숨깁니다. <br>
     * `showLayer`와 동작이 같으며, 이미지 레이어를 다룰 때 뜻이 드러나도록 만든 별칭입니다.
     *
     * @param {[name: string, show?: boolean, deleteCache?: boolean]} args `showLayer`와 같은 인자
     * @returns {Promise<{result: string, content: import('@U3dLayer').U3dLayer}> | false} `showLayer`의 반환값
     *
     * @example
     * await app.showImageLayer('satellite');
     */
    showImageLayer(name: string, show?: boolean, deleteCache?: boolean): Promise<{
        result: string;
        content: U3dLayer;
    }> | false;
    /**
     * 이름이 같은 레이어를 찾아 반환합니다.
     *
     * @param {string} name 찾을 레이어 이름
     * @returns {import('@U3dLayer').U3dLayer | undefined} 찾은 레이어
     *
     * @example
     * const componentLayer = app.getLayer("component_01");
     */
    getLayer(name: string): U3dLayer | undefined;
    /**
     * 이름이 같은 레이어를 찾아 반환합니다.
     *
     * @param {string} [name] 찾을 레이어 이름
     * @returns {import('@U3dLayer').U3dLayer | undefined} 찾은 레이어
     *
     * @example
     * const layer = app.getLayerByName('satellite');
     */
    getLayerByName(name?: string): U3dLayer | undefined;
    /**
     * 추가된 모든 레이어 목록을 반환하는 함수
     * @returns {Array<import('@U3dLayer').U3dLayer>} 레이어 목록 배열
     */
    getLayers(): Array<U3dLayer>;
    isLoadingHeightLayers(): boolean;
    isLoadingImageLayers(): boolean;
    getInstanceScenesFromAll(): UScene[];
    getInstanceScenesFromVisibleImageLayer(): UScene;
    getInstanceScenesFromVisibleImageLayers(): UScene[];
    /**
     * 첫 번째 지형 레이어의 Scene을 반환합니다.
     *
     * @returns {import('@UScene').UScene | undefined} 지형 Scene. 지형 레이어가 없으면 undefined
     *
     * @example
     * const terrainScene = app.getTerrainScene();
     */
    getTerrainScene(): UScene | undefined;
    getInstanceUserLayers(): U3dLayer[];
    getInstanceMeasureLayers(): U3dLayer[];
    getInstanceMultipleComponentLayers(): U3dLayer[];
    getInstanceVectorTileLayers(): U3dLayer[];
    /**
     * 앱에 등록된 모델 레이어와 지형 레이어를 반환합니다.
     *
     * @returns {Array<import('@U3dLayer').U3dLayer>} 모델 및 지형 레이어 목록
     *
     * @example
     * const layers = app.getInstanceModelAndTerrainLayers();
     */
    getInstanceModelAndTerrainLayers(): Array<U3dLayer>;
    /**
     * 앱에 등록된 지형 레이어를 반환합니다.
     *
     * @returns {Array<import('@U3dLayer').U3dLayer>} 지형 레이어 목록
     *
     * @example
     * const terrainLayers = app.getInstanceTerrainLayers();
     */
    getInstanceTerrainLayers(): Array<U3dLayer>;
    /**
     * 화면에 보이는 사용자 레이어의 Scene을 반환합니다.
     *
     * @returns {Array<import('@UScene').UScene>} Scene 목록
     *
     * @example
     * const scenes = app.getInstanceSceneUserLayers();
     */
    getInstanceSceneUserLayers(): Array<UScene>;
    getInstanceScenesFromModelLayers(): UScene[];
    getInstanceScenesFromTerrainLayers(): UScene[];
    getInstanceScenesFromModelAndTerrainLayers(): UScene[];
    /**
     * U3dApp에 있는 모델(3d) 레이어들을 반환하는 함수
     * @returns {Array} 모델 레이어 목록
     */
    getInstanceModelLayers(): any[];
    getInstanceModelAndGroupLayers(): U3dLayer[];
    /**
     * U3dApp에 있는 비디오 모델 레이어들을 반환하는 함수
     * @returns {Array<import('@U3dLayer').U3dLayer>} 비디오 모델 레이어 목록
     */
    getInstanceVideoLayers(): Array<U3dLayer>;
    /**
     * U3dApp에 있는 애니매이션 모델 레이어들을 반환하는 함수
     * @returns {Array<import('@U3dLayer').U3dLayer>} 애니매이션 모델 레이어 목록
     */
    getInstanceAnimationLayers(): Array<U3dLayer>;
    /**
     * U3dApp에 있는 입력 받은 classtype과 같은 레이어들을 반환 하는 함수
     * @returns {Array<import('@U3dLayer').U3dLayer>} classtype 레이어 목록
     */
    getInstanceByClassTypeLayers(classType: any): Array<U3dLayer>;
    /**
     * U3dApp에 있는 고도 레이어들을 반환하는 함수
     * @returns {Array<import('@U3dLayer').U3dLayer>} 고도 레이어 목록
     */
    getInstanceHeightLayers(): Array<U3dLayer>;
    getInstanceImageAndUserLayers(): U3dLayer[];
    /**
     * U3dApp에 있는 이미지 레이어들을 반환하는 함수
     * @returns {Array<import('@U3dLayer').U3dLayer> | undefined} 이미지 레이어 목록. 레이어 목록이 준비되지 않았으면 `undefined`
     */
    getInstanceImageLayers(): Array<U3dLayer> | undefined;
    getImageLayer(layername: any): U3dLayer;
    getInstanceClassifiedLayers(opt: any): U3dLayerListClassifiedLayersOption;
    getInstanceLoadingLayers(): U3dLayer[];
    getInstanceTypeLayers(array: any): U3dLayer[];
    getHeightLayer(layername: any): U3dLayer;
    /**
     * 등록된 높이(Height) 레이어 배열을 반환합니다.
     *
     * @returns {Array<import('@U3dLayer').U3dLayer>} 높이 레이어 배열
     *
     * @example
     * const heightLayers = app.getHeightLayers();
     */
    getHeightLayers(): Array<U3dLayer>;
    getImageLayers(layername: any): U3dLayer[];
    getImageLayerLength(): number;
    getHeightLayerLength(): number;
    getModelLayerLength(): number;
    getUserLayers(): U3dLayer[];
    getUserLayerLength(): number;
    setLineStringMeasureType(): void;
    setPolygonMeasureType(): void;
    setMeasureType(type: any): boolean;
    /**
     * 지도상에 그려진 측정 POI들을 삭제하는 함수
     * @returns {boolean} 결과
     */
    clearMeasure(): boolean;
    /**
     * 지도상에 측정을 위한 POI를 추가하는 함수
     * @param {GeoPosition} geo 위경도 좌표를 담은 object
     * @returns {function} measureLayer.addMeasurePoint(geo) 콜백함수
     * @example
     *  let geo = {x: 126.9380132919261, y: 37.51935824743521, z: 0}
     *  app.addMeasurePoint(geo);
     */
    addMeasurePoint(geo: GeoPosition): Function;
    removeMeasureFeature(feature: any): any;
    commitMeasurePoint(): any;
    getTextPositionToMeasureArea(): any;
    getMeasureArea(): any;
    getMeasureLength(): any;
    getMeasureExtent(): any;
    /**
     * 3D 그룹 모델 레이어를 생성하는 함수입니다.
     * @param {U3dModelGroupLayerCO} opt 그룹 레이어 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dGroupLayer').U3dGroupLayer | false} 생성된 그룹 레이어
     */
    createModelGroupLayer(opt: U3dModelGroupLayerCO): U3dGroupLayer | false;
    /**
     * 격자 타일 레이어를 생성해 앱에 추가합니다. <br>
     * 옵션이 없거나 같은 이름의 레이어가 이미 있으면 생성하지 않고 `false`를 반환하므로, 반환값을 확인한 뒤 사용합니다.
     *
     * @param {U3dGridTileLayerCO} opt 레이어 생성 옵션. `name`이 이미 등록된 이름이면 생성하지 않습니다
     * @returns {import('@union3d/3dLayer/U3dGridTileLayer').U3dGridTileLayer | boolean} 생성된 레이어. 생성하지 못하면 `false`
     *
     * @example
     * const gridLayer = app.createGridTileLayer(opt);
     * if (gridLayer) app.showLayer(opt.name);
     */
    createGridTileLayer(opt: U3dGridTileLayerCO): U3dGridTileLayer | boolean;
    /**
     * U3F 포맷의 건물 레이어를 생성하는 함수
     * @param opt
     * @param {string} opt.name U3F 3D 모델 레이어 이름
     * @param {string} opt.layername U3F 레이어의 이름
     * @param {string} opt.baseurl U3F 모델 데이터 기본 URL 경로
     * @param {string} opt.basename U3F 데이터 dml 정보가 있는 U3G 파일 이름
     * @param {string} opt.ext U3F 데이터 형식(format)
     * @param {string} opt.grouplayer 그룹레이어 객체
     * @param {string} opt.renderorder U3F 모델 레이어 랜더 우선순위 (클수록 우선적으로 랜더링)
     * @param {number} [opt.minlevel] 가시화 최소레벨
     * @param {number} [opt.maxlevel] 가시화 최대레벨
     * @param {boolean} [opt.useproxy] 프록시 사용 여부
     * @param {boolean} [opt.reverseY] Y축 반전(reverse) 여부
     * @param {boolean} [opt.usetexture] 텍스쳐 사용 여부
     * @param {string} [opt.proxyurl] 프록시 URL
     * @param {number} [opt.opacity] 모델의 투명도 값
     * @param {Number} [opt.makeU3FPackage=1] 병합된 u3f.package 파일을 사용할 건지의 여부 (1 사용, 0 미사용)
     * @param {Number} [opt.isShareMaterial=0] 텍스쳐가 없은 u3f일경우 머터리얼을 공유할건지의 여부 (1 사용, 0 미사용)
     * @param {Boolean} [opt.isTextureUpdate=true] 텍스쳐가 있는 u3f일경우 텍스쳐 업데이트를 사용하는지의 여부
     * @param {Number} [opt.textureDistance] 텍스터 업데이트 시 업데이트 거리 강제 설정
     * @returns {import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer} U3dModelU3FLayer
     */
    /**
     * U3F 3D 모델 레이어를 생성하는 함수입니다.
     * @param {U3d3DFModelLayerCO} opt U3F 3D 모델 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer | false} 생성된 U3F 모델 레이어
     */
    create3DFModelLayer(opt: U3d3DFModelLayerCO): U3dModelU3FLayer | false;
    /**
     * 여러 컴포넌트로 구성된 모델 레이어를 생성하는 함수입니다.
     * @param {import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayerCO} opt 다중 컴포넌트 레이어 옵션
     * @returns {import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayer | false} 생성된 레이어
     */
    createMultipleComponentLayer(opt: U3dMultipleComponentLayerCO): U3dMultipleComponentLayer | false;
    /**
     * BIM 객체 모델 레이어를 생성하는 함수입니다.
     * @param {U3dModelBIMObjLayerCO} opt BIM 객체 모델 레이어 옵션
     * @returns {import('@union3d/3dLayer/U3dModelBIMObjLayer').U3dModelBIMObjLayer | undefined} 생성된 레이어
     */
    createModelBIMObjLayer(opt: U3dModelBIMObjLayerCO): U3dModelBIMObjLayer | undefined;
    /**
     * 3D 모델 레이어를 생성하는 함수
     * @param option
     * @param {string} option.name 레이어 이름
     * @param {string} option.baseurl 모델 데이터의 기본경로
     * @param {string} [option.type] 레이어 타입
     * @param {string} option.ext 모델 데이터 확장자
     * @param {boolean} [option.drawline] 모델의 테두리 가시화 유무
     * @param {boolean} [option.needtexture] 모델의 텍스쳐 가시화 유무
     * @param {boolean} [option.needxml] 모델의 메타데이터(XML) 유무
     * @param {boolean} [option.xmlurl] 모델의 메타데이터(XML) 경로
     * @param {boolean} [option.useu3f] U3F 모델 사용 유무
     * @param {string} [option.u3furl] U3F 모델의 경로
     * @param {object[]} option.listmodel 모델 레이어를 구성할 모델 데이터 리스트
     * @param {object[]} [option.listmodel.name] 모델의 이름
     * @param {object[]} option.listmodel.baseurl 모델 데이터의 기본경로
     * @param {object[]} option.listmodel.fileName 모델 데이터의 이름
     * @param {import('three').Vector3Like} [option.position] 3D 모델의 위치
     * @param {import('three').Vector3Like} [option.scale] 3D 모델의 스케일(크기)
     * @param {import('three').Vector3Like} [option.rotation] 3D 모델의 회전
     * @returns {*}
     */
    /**
     * TDS 모델 레이어를 생성하는 함수입니다.
     * @param {U3dTdsModelLayerCO} option TDS 모델 레이어 옵션
     * @returns {import('@union3d/3dLayer/U3dModelTdsLayer').U3dModelTdsLayer | false} 생성된 레이어
     */
    createTdsModelLayer(option: U3dTdsModelLayerCO): U3dModelTdsLayer | false;
    /**
     * 일반 XYZ 이미지 레이어를 생성하는 함수입니다.
     * @param {U3dImageLayerCO} opt XYZ 이미지 레이어 옵션
     * @returns {import('@union3d/3dLayer/U3dImageXYZLayer').U3dImageXYZLayer | false | undefined} 생성된 레이어
     */
    createXYZImageLayer(opt: U3dImageLayerCO): U3dImageXYZLayer | false | undefined;
    /**
     * 단순 이미지 레이어를 생성하는 함수
     * @param {U3dImageLayerCO} opt 이미지 레이어 옵션
     * @returns {import('@union3d/3dLayer/U3dImageXYZLayer').U3dImageXYZLayer | false | undefined} 생성된 레이어
     */
    createImageLayer(opt: U3dImageLayerCO): U3dImageXYZLayer | false | undefined;
    /**
     * WMS 이미지 레이어를 생성하는 함수입니다.
     * @param {U3dWMSImageLayerCO} opt WMS 이미지 레이어 옵션
     * @returns {import('@union3d/3dLayer/U3dImageWMSLayer').U3dImageWMSLayer | false} 생성된 레이어
     */
    createWMSImageLayer(opt: U3dWMSImageLayerCO): U3dImageWMSLayer | false;
    /**
     * WFS 모델 레이어를 생성하는 함수입니다.
     * @param {U3dWFSModelLayerCO} opt WFS 모델 레이어 옵션
     * @returns {import('@union3d/3dLayer/U3dModelWFSLayer').U3dModelWFSLayer | false} 생성된 레이어
     */
    createWFSModelLayer(opt: U3dWFSModelLayerCO): U3dModelWFSLayer | false;
    /**
     * 지도화면의 컨테이너(div)를 반환하는 함수
     * @returns {HTMLElement} 지도화면의 div Element
     */
    container(): HTMLElement;
    /**
     * 이벤트 핸들러를 생성하는 함수
     * @param {object} container
     * @param {U3dApp} app
     * @return {object} 이벤트 핸들러
     * @ignore
     */
    createEventHandler(container: object, app: U3dApp): object;
    /**
     * 현재 적용된 톤 매핑 노출값을 반환합니다. <br>
     * 설정한 적이 없을 때의 기본값은 `getDefaultToneMappingExposure`로 확인합니다.
     *
     * @returns {number} 현재 노출값
     *
     * @example
     * const exposure = app.getToneMappingExposure();
     */
    getToneMappingExposure(): number;
    /**
     * 기본 톤 매핑 노출값을 반환합니다.
     *
     * @returns {number} 기본 노출값
     *
     * @example
     * const exposure = app.getDefaultToneMappingExposure();
     */
    getDefaultToneMappingExposure(): number;
    /**
     * 화면 밝기를 조절하는 톤 매핑 노출값을 설정합니다.
     *
     * @param {number} exposure 노출값
     *
     * @example
     * app.setToneMappingExposure(1.5);
     */
    setToneMappingExposure(exposure: number): void;
    /**
     * 이 앱의 3D 지도 화면을 그리는 렌더러(renderer) 객체를 반환합니다.<br>
     * 화면이 그려지는 canvas 요소(domElement)나 렌더링 설정을 직접 다룰 때 사용합니다.<br>
     * WebGL 컨텍스트(context)를 잃으면 앱이 렌더러를 새로 만들어 교체하므로, 반환값을 보관해 두지 말고 필요할 때마다 이 메서드로 다시 조회하십시오.
     *
     * @returns {import('@URenderer').URenderer} 현재 3D 지도 화면을 그리고 있는 렌더러
     *
     * @example
     * const canvas = app.getRenderer().domElement;
     */
    getRenderer(): URenderer;
    createSpreadObject(opt: any): UParticleEngine;
    createWindFlow(opt: any): UParticleEngine;
    /**
     * 3D 라이브러리(THREE)를 반환하는 함수
     * @returns {THREE} THREE Libary
     */
    get3DLibrary(): typeof three;
    /**
     * 전체 분석(analaysis)모드를 생성하는 함수
     * @ignore
     */
    createAnalysis(): void;
    /**
     * 분석 타입과 이름을 입력받아 분석모드를 생성하는 함수
     * @param type 분석 모드 타입 ('Area', 'Distance', 'Height' 등...)
     * @param name 분석 모드 이름
     * @returns {void|undefined|*} 분석모드(analy)
     */
    createAnalysisByTypeAndName(type: any, name: any): void | undefined | any;
    /**
     * 분석모드를 추가하는 함수
     * @param {import('@UAnaly').UAnaly} analy 추가할 분석모드
     */
    addAnalysis(analy: UAnaly): void;
    /**
     * 선택(select)을 추가하는 함수
     * @param {import('@union3d/select/U3dSelect').U3dSelect} select 선택 객체
     */
    addSelect(select: U3dSelect): void;
    /**
     * 선택(select)을 제거하는 함수
     * @param {import('@union3d/select/U3dSelect').U3dSelect} select 선택 객체
     */
    removeSelect(select: U3dSelect): void;
    /**
     * 분석모드 이름을 입력받아 분석모드를 제거하는 함수
     * @param {string} name 분석모드 이름
     */
    removeAnalysis(name: string): void;
    /**
     * 입력받은 이름의 분석모드를 반환하는 함수
     *
     * 기본 분석 이름을 전달하면 해당 분석 클래스의 타입을 반환하고,
     * 그 밖의 문자열은 공통 분석 타입으로 반환합니다.
     *
     * @template {string} TAnalysisName
     * @param {TAnalysisName} name 분석모드 이름
     * @returns {(TAnalysisName extends keyof U3dAnalysisTypeMap ? U3dAnalysisTypeMap[TAnalysisName] : import('@UAnaly').UAnaly) | undefined} 해당 이름의 분석모드. 등록되어 있지 않으면 `undefined`
     * @example
     * const averageHeight = app.getAnalysis('AverageHeight'); // UAnalyAverageHeight | undefined
     * const landScape = app.getAnalysis('LandScape'); // UAnalyLandScape | undefined
     * const componentAnaly = app.getAnalysis('multipleComponent'); // UAnalyMultipleComponent | undefined
     */
    getAnalysis<TAnalysisName extends string>(name: TAnalysisName): (TAnalysisName extends keyof U3dAnalysisTypeMap ? U3dAnalysisTypeMap[TAnalysisName] : UAnaly) | undefined;
    /**
     * 입력받은 이름의 Analysis(분석모듈)을 활성화 하는 함수
     * @template {string} TAnalysisName
     * @param {TAnalysisName} name Analysis의 이름
     * @returns {(TAnalysisName extends keyof U3dAnalysisTypeMap ? U3dAnalysisTypeMap[TAnalysisName] : import('@UAnaly').UAnaly) | undefined} 활성화된 분석모드. 이름에 해당하는 분석모드가 없으면 `undefined`
     */
    activeAnalysis<TAnalysisName extends string>(name: TAnalysisName): (TAnalysisName extends keyof U3dAnalysisTypeMap ? U3dAnalysisTypeMap[TAnalysisName] : UAnaly) | undefined;
    /**
     * 입력받은 이름의 Analysis(분석모듈)을 비활성화 하는 함수
     * @param {string} name Analysis의 이름
     * @returns {import('@UAnaly').UAnaly | undefined} 비활성화된 분석모드. 이름에 해당하는 분석모드가 없으면 `undefined`
     */
    deactiveAnalysis(name: string): UAnaly | undefined;
    /**
     * 입력받은 이름의 Analysis(분석모듈)의 내용을 초기화 하는 함수
     * @param {string} name Analysis의 이름
     * @returns {import('@UAnaly').UAnaly | undefined} 내용이 초기화된 분석모드. 이름에 해당하는 분석모드가 없으면 `undefined`
     */
    clearAnalysis(name: string): UAnaly | undefined;
    /**
     * 모든 Analysis(분석모듈)를 비활성화 하는 함수 (ex. UAnalyArea(면적), UAnalyHeight(고도), UAnalyLandScape(조망권) etc.)
     */
    deactiveAllAnalysis(): void;
    /**
     * 모든 Analysis(분석모듈)의 내용을 초기화하는 함수
     */
    clearAllAnalysis(): void;
    /**
     * app의 Camera를 생성하는 함수
     * @param near 카메라 최소 거리
     * @param far 카메라 최대 거리
     * @param fov 카메라 시야각
     * @return {import('@UCamera').UCamera} app의 Camera
     * @ignore
     */
    createCamera(near: any, far: any, fov: any): UCamera;
    /**
     * 요청한 유형으로 카메라를 교체합니다.<br>
     * 전환한 카메라는 위치와 방향을 유지하고, 화면상 시야 크기를 맞춥니다.<br>
     * 카메라 또는 지도 제어기가 준비되지 않았으면 카메라를 교체하지 않고 현재 값을 반환합니다.
     *
     * @param {'perspective' | 'orthographic'} type 교체할 카메라 유형. perspective(원근) 또는 orthographic(직교)
     * @returns {UCamera | UOrthographicCamera | undefined} 호출 후 앱에서 사용하는 카메라 또는 카메라가 없을 때 `undefined`
     */
    setCameraType(type: "perspective" | "orthographic"): UCamera | UOrthographicCamera | undefined;
    /**
     * 앱에서 사용하는 현재 카메라 유형을 반환합니다.
     *
     * @returns {'perspective' | 'orthographic'} 현재 카메라 유형. perspective(원근) 또는 orthographic(직교)
     */
    getCameraType(): "perspective" | "orthographic";
    /**
     * 한반도를 비추도록 카메라를 이동시키는 함수
     *
     * @param {import('@UCamera').UCamera} camera 이동시킬 카메라
     */
    setCameraFitKorea(camera: UCamera): void;
    /**
     * 카메라 상태를 반환하는 함수 (위경도 좌표)
     * @returns {import('@union3d/core/UCameraState').UCameraState} 카메라 상태 객체
     * @example
     * return {
     *              camera: {x: 126.78771616171915, y: 37.64258233377268, z: 69.07397201920645},   // 카메라 위경도 좌표
     *              center: {x: 126.78804853837431, y: 37.64305180239932, z: -1.8135857117912865e-15},     // 카메라 센터 위경도 좌표
     *              distance: 91.46842267444386,     // 카메라 거리
     *              azimuth: -0.5047492202833259,    // 카메라 방위각
     *              polar: 0.7148868616164354,       // 카메라 극선
     *              homePosition: [126.78804853837431, 37.64305180239932, 91.46842267444386, -28.92000003475366, 40.95999999997468], // 카메라 초기 세팅 위치
     *              height :855 //해발고도를 기준으로 하는 카메라 높이 (m)
     *         }
     */
    getCameraState(): UCameraState;
    /**
     * 현재 카메라 상태를 저장하는 함수
     * 이후에 loadSavedCameraState API 를 사용 하여 현재의 위치와 각도로 불러오는 방식으로 사용 가능
     *
     * @returns {import('@union3d/core/UCameraState').UCameraState | undefined} 저장된 카메라 상태
     *
     * @example
     * const info = app.saveCameraState();
     */
    saveCameraState(): UCameraState | undefined;
    /**
     * saveCameraState API를 통해서 저장된 카메라 상태로 이동 및 회전 하는 함수
     *
     * @param {import('@union3d/core/UCameraState').UCameraState} [info] 이전에 저장한 카메라 상태 정보.
     * 생략하면 saveCameraState로 저장한 상태를 사용하며, toJSON 결과와 같은 평문 상태 객체도 받는다.
     * @param {number} [duration] 이동 및 회전 완료까지 시간 (밀리초)
     * @returns {undefined | Promise<boolean>} 이동 완료 시점의 Promise. 사용할 카메라 상태가 없거나 형식이 올바르지 않으면 `undefined`
     *
     * @example
     * app.saveCameraState();
     * await app.loadCameraState(undefined, 3000);
     */
    loadCameraState(info?: UCameraState, duration?: number): undefined | Promise<boolean>;
    /**
     * 카메라 상태를 반환하는 함수(3D world 좌표)
     * @returns {import('@union3d/core/UCameraState').UCameraState} 카메라 상태 객체
     * @example
     * return {
     *              camera: {x: -225320.4408186387, y: 117010.25480977932, z: 69.07397201920645, isVector3: true},         // 카메라 world 좌표
     *              center: {x: -225291.4446548051, y: 117062.7379615423, z: -1.8135857117912865e-15, isVector3: true},    // 카메라 센터 world 좌표
     *              distance: 91.46842267444386,     // 카메라 거리
     *              azimuth: -0.5047492202833259,    // 카메라 방위각
     *              polar: 0.7148868616164354,       // 카메라 극선
     *              homePosition: [126.78804853837431, 37.64305180239932, 91.46842267444386, -28.92000003475366, 40.95999999997468] // 카메라 초기 세팅 위치
     *         }
     */
    getCameraStateFromWorld(): UCameraState;
    /**
     * 카메라의 위치를 반환하는 함수
     * @returns {WorldPositionVector3} 카메라 위치 좌표
     */
    getCameraPosition(): WorldPositionVector3;
    /**
     * 카메라가 비추는 target의 위치를 반환하는 함수
     * @returns {WorldPosition} 카메라 target 위치 좌표
     */
    getCameraTargetPosition(): WorldPosition;
    /**
     * 카메라의 위경도 위치를 반환하는 함수
     * @returns {GeoPosition|null} 카메라의 위경도 위치 좌표
     */
    getCameraGeographicPosition(): GeoPosition | null;
    /**
     * 지면 높이를 높이를 반영하여 카메라의 고도값을 반환하는 함수
     * @returns {number} 카메라 고도값 (미터)
     */
    getCameraRelativeHeight(): number;
    /**
     * 해발 고도 기준 카메라의 고도값을 반환하는 함수
     * @returns {number} 카메라 고도값 (미터)
     */
    getCameraHeight(): number;
    /**
     * 카메라 타겟의 위경도 좌표를 반환하는 함수
     * @returns {GeoPosition} 타겟의 위경도 좌표
     */
    getCameraGeographicTargetPoint(): GeoPosition;
    /**
     * 카메라 타겟의 좌표를 반환하는 함수
     * @returns {WorldPosition} 타켓의 좌표
     */
    getCameraTargetPoint(): WorldPosition;
    /**
     * 위경도 좌표로 지도를 이동하는 함수
     * @param {number} geoX 경도
     * @param {number} geoY 위도
     * @param {number} Z 높이
     * @param {Degree} [leftRotate] 방위각
     * @param {Degree} [downRotate] 고도각
     * @param {number} [targetZ] 카메라 Target의 높이
     * @param {number} [durationTime] 지도 애니매이션(flyTo) 시간(ms). 이동 시 해당 시간 만큼 카메라 애니메이션 재생
     * @returns {Promise<boolean>} 프로미스 반환
     */
    setCameraGeographicPosition(geoX: number, geoY: number, Z: number, leftRotate?: Degree, downRotate?: Degree, targetZ?: number, durationTime?: number): Promise<boolean>;
    /**
     * goolge좌표계로 카메라 위치를 설정하는 함수
     * @param {number} googleX goolge좌표계 X값
     * @param {number} googleY goolge좌표계 Y값
     * @param {number} Z Z값
     * @param {Degree} [leftRotate] 방위각
     * @param {Degree} [downRotate] 고도각
     * @param {number} [targetZ] 카메라 Target의 높이
     * @param {number} [durationTime] 카메라가 해당 위치로 이동하는데 소요 시간
     * @return {Promise<boolean>} 이동 완료 Promise 반환
     */
    setCameraGooglePosition(googleX: number, googleY: number, Z: number, leftRotate?: Degree, downRotate?: Degree, targetZ?: number, durationTime?: number): Promise<boolean>;
    /**
     * 3D 월드 좌표(구글 좌표계 기준)로 카메라 위치를 설정하는 함수
     * @param {object} opt 3D 월드 좌표 옵션
     * @param {Degree} [opt.rotateX] 3D 월드 좌표 x축 회전값(Degree)
     * @param {Degree} [opt.rotateY] 3D 월드 좌표 y축 회전값(Degree)
     * @param {number} opt.x 3D 월드 좌표 x
     * @param {number} opt.y 3D 월드 좌표 y
     * @param {number} opt.z 3D 월드 좌표 z
     * @returns {Promise<boolean> | undefined} 이동 완료 Promise 반환
     */
    setCameraWorldPosition(opt: {
        rotateX?: Degree;
        rotateY?: Degree;
        x: number;
        y: number;
        z: number;
    }): Promise<boolean> | undefined;
    /**
     * 카메라 타겟의 z값을 0으로 조정하는 함수
     */
    setCameraTargetZeroZ(): void;
    /**
     * 카메라 기준 중심점의 높이를 현재 카메라의 높이 값과 동일하게 조정하는 함수
     */
    setCameraTargetZ(): void;
    /**
     * 카메라가 입력된 좌표를 바라보도록 하는 함수
     * @param {object} position 세팅 옵션
     * @param {number} position.x 타겟 x좌표
     * @param {number} position.y 타겟 y좌표
     * @param {number} position.z 타겟 z좌표
     * @param {string} [positionType = 'geographic'] 좌표의 타입 (geographic = 입력좌표가 위경도 좌표, world = 입력좌표가 월드 좌표)
     * @param {number} [distance] 입력 좌표와의 거리 (0보다 큰 수)
     * @returns {Promise<boolean> | undefined}
     * @example
     * u3dApp.setCameraTarget({ x:127.347, y:36.122 },'geographic');
     * u3dApp.setCameraTarget({ x:-211974.7455, y:103035.0117800 },'world', 500);
     */
    setCameraTarget(position: {
        x: number;
        y: number;
        z: number;
    }, positionType?: string, distance?: number): Promise<boolean> | undefined;
    /**
     * 지정한 지점을 바라보도록 카메라를 옮기고 방향과 거리까지 한 번에 맞춥니다.<br>
     * x, y, z는 카메라를 놓을 자리가 아니라 카메라가 바라볼 지점의 월드 좌표(EPSG:3857)이며, 카메라는 그 지점에서 targetZ만큼 떨어진 곳에 자리를 잡습니다.<br>
     * leftrotate와 downrotate는 그 지점을 기준으로 카메라가 어느 방향 어느 높이에 설지를 정합니다.<br>
     * 이동은 곧바로 끝나지 않고 출발점과 도착점 사이를 한 번 솟아올랐다 내려오는 곡선을 그리며 durationTime 동안 진행합니다.<br>
     * 호출하면 진행 중이던 카메라 이동과 2D·3D 시점 전환을 먼저 멈춥니다.<br>
     * 카메라나 지도 컨트롤러가 아직 만들어지지 않았으면 아무것도 하지 않고 promise가 reject를 반환하므로 실패 처리를 함께 연결하여 사용을 권장드립니다.
     *
     * @param {number} x 카메라가 바라볼 지점의 월드 좌표(EPSG:3857) X
     * @param {number} y 카메라가 바라볼 지점의 월드 좌표(EPSG:3857) Y
     * @param {number} z 카메라가 바라볼 지점의 높이이며, 그 자리의 지형 높이를 더하지 않은 월드 좌표(EPSG:3857) Z 값
     * @param {Degree} [leftrotate=0] 카메라가 바라볼 방위이며 degree 단위.<br>
     * 0이면 북쪽을 바라보고 값이 커질수록 시선이 왼쪽으로 돌아 90이면 서쪽을 바라봅니다
     * @param {Degree} [downrotate=60] 바라볼 지점에서 카메라 쪽을 올려다본 각도이며 degree 단위.<br>
     * 0이면 바로 위에서 수직으로 내려다보고 90이면 같은 높이에서 수평으로 바라보며, 90을 넘기면 카메라가 그 지점보다 아래에 놓여 올려다보게 됩니다.<br>
     * 0.1보다 작거나 179.9보다 큰 값은 그 범위 안으로 잘립니다
     * @param {number} [targetZ=100] 바라볼 지점에서 카메라까지의 거리이며 월드 좌표(EPSG:3857)와 같은 단위.<br>
     * 값이 클수록 멀리서 보게 되며, 0을 지정하면 기본값 100이 대신 쓰입니다
     * @param {number} [durationTime=100] 이동에 사용할 전체 시간이며 ms 단위
     * @returns {Promise<void>} 이동을 마치고 화면 자료를 모두 불러오면 완료되는 promise이며, 이동이 도중에 멈추면 그 시점에 완료를 반환합니다.
     */
    setCameraPosition(x: number, y: number, z: number, leftrotate?: Degree, downrotate?: Degree, targetZ?: number, durationTime?: number): Promise<void>;
    setCameraPositionDirect(x: any, y: any, z: any, leftrotate: any, downrotate: any): boolean;
    /**
     * UAnimationController 생성 헬퍼.
     * drawArg는 현재 app의 drawArg로 자동 주입된다.
     * @param {Partial<UAnimationControllerCO>} opt
     * @returns {import('@UAnimationController').UAnimationController|undefined}
     */
    makeAnimationController(opt?: Partial<UAnimationControllerCO>): UAnimationController | undefined;
    createCharacterControls(opt: any): UCharacterControls;
    createPointerLockControls(camera: any, renderer: any, pos: any, dir: any, minHeight: any): UPointerLockControls;
    createPointerLockDriveControls(camera: any, renderer: any, pos: any, dir: any, speed: any, minHeight: any, viewType: any, mirrorStat: any): UPointerLockDriveControls;
    /**
     * 자유 비행 컨트롤러를 생성하는 함수
     * @param {object} option 컨트롤러 생성 정보
     * @param {UCamera} option.camera 컨트롤러가 제어할 카메라 객체
     * @param {import('@URenderer').URenderer} option.renderer 컨트롤러가 제어할 DOM 요소를 찾기위한 렌더러 객체
     * @param { import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition} option.component 컨트롤러가 제어할 컴포넌트포지션 객체
     * @param {Number} [option.maxSpeed = 400] 이동 최대속도
     * @param {Number} [option.minSpeed = 0] 이동 최저속도
     * @param {Number} [option.accSpeed = 10] 가속 속도
     * @param {Number} [option.rollSpeed = 0.001] 회전 속도
     * @param {Number} option.flyShift 컴포넌트 포지션 객체와 카메라 사이의 시프트 이동값 {front: 10, up: 0}
     * @param {Number} option.flyRotation 컴포넌트 포지션 객체의 기본 회전 값 {x:0, y:0, z:0}
     * @param {Element} option.pointerElement 마우스 이동 표현 돔객체
     * @param {Element} option.horizonElement 수평선 표현 돔객체
     * @param {Element} option.speedElement 속도 표현 돔객체
     * @param {Element} option.heightElement 고도 표현 돔객체
     * @param {Number} option.limitHeight 고도 제한 높이
     * @returns {UPointLockFlyControls} 생성된 컨트롤러
     */
    createPointerLockFlyControls(option?: {
        camera: UCamera;
        renderer: URenderer;
        component: U3dComponentPosition;
        maxSpeed?: number;
        minSpeed?: number;
        accSpeed?: number;
        rollSpeed?: number;
        flyShift: number;
        flyRotation: number;
        pointerElement: Element;
        horizonElement: Element;
        speedElement: Element;
        heightElement: Element;
        limitHeight: number;
    }): UPointLockFlyControls;
    _freeFlyControl: UPointLockFlyControls;
    /**
     * 자유 비행 컨트롤러를 반환하는 함수
     * @returns {UPointLockFlyControls} 자유비행 컨트롤러
     */
    getFreeFlyControl(): UPointLockFlyControls;
    createUOrbitAndPanControls(opt: any): Promise<UOrbitAndPanControls>;
    /**
     * 입력 받은 날짜(date)에 따른 일몰(sunset) 시간을 반환하는 함수
     * @param {Date|object} date 날짜
     * @return {{start: Date, end: Date}|{start: Date, end: Date}|*|undefined}
     * @ignore
     */
    getTimeSunset(date: Date | object): {
        start: Date;
        end: Date;
    } | {
        start: Date;
        end: Date;
    } | any | undefined;
    /**
     * 입력 받은 날짜(date)에 따른 일출(sunrise) 시간을 반환하는 함수
     * @param {Date|object} date 날짜
     * @return {{start: Date, end: Date}|{start: Date, end: Date}|*|undefined}
     * @ignore
     */
    getTimeSunrise(date: Date | object): {
        start: Date;
        end: Date;
    } | {
        start: Date;
        end: Date;
    } | any | undefined;
    /**
     * 기본 날짜로 일조량을 설정하는 함수
     * @example
     * 년도 : 2018, 월 : 10, 날짜 : 30, 시간 : 8
     * @ignore
     */
    setDefaultTimeSun(): void;
    /**
     * Quad tree set을 업데이트 하는 함수
     * @param {number} force 업데이트 정도 (force가 클수록 업데이트되는 타일 증가)
     * @ignore
     */
    updateQuadtree(force: number): void;
    /**
     * 설정된 분석 시간과 위치에서 일조량을 계산하는 함수
     * @param {Date} start 분석 시작시간
     * @param {Date} end 분석 종료시간
     * @param {GeoPosition} position 일조량을 계산할 위치 - 위경도 Object ex) {x: 127, y:36, z:10}
     * @param {number} step 분석 시간 간격 (분단위 입력) ex) 10 -> 10분단위로 분석. 기본값 1(분)
     * @param {object} [drawOpt={}] 일조량 분석 결과를 3D 가시화 할 때 옵션
     * @param {boolean} [drawOpt.isDraw] 일조량 분석 결과를 3D 가시화 할지 여부
     * @param {string} [drawOpt.name] 일조량 분석 결과 mesh 큐브 개체 이름, 기본값은 분석지점 0번, 분석지점 1번... 등 자동할당.
     * @param {number} [drawOpt.boxWidth] 일조량 분석 결과 mesh 큐브 한개 당 너비. 기본값 1(m)
     * @param {number} [drawOpt.boxNum] 일조량 분석 결과 mesh 큐브를 구성할 큐브 개수. 6이면 6*6*6 큐브 지정. 기본값 6
     * @param {function} [drawOpt.styleFun] 일조량 분석 결과 mesh 큐브의 사용자 범례 지정 함수
     * @param {number} [dist=5000] 일조량 계산에 포함할 주변 객체의 최대 거리(m)
     * @returns {Array<{start: Date, end: Date, amount: number}>} 구간별 일조 시작시간, 종료시간, 일조량 목록
     * @example
     * // ex) [{start: Date, end: Date, amount: 10}, {start: Date, end: Date, amount: 10} ...]
     * const result = app.analySunAmount(start, end, {x: 127, y: 36, z: 10}, 10);
     * @ignore
     */
    analySunAmount(start: Date, end: Date, position: GeoPosition, step: number, drawOpt?: {
        isDraw?: boolean;
        name?: string;
        boxWidth?: number;
        boxNum?: number;
        styleFun?: Function;
    }, dist?: number): Array<{
        start: Date;
        end: Date;
        amount: number;
    }>;
    /**
     * @description 안개를 설정하는 함수
     * @param {ColorLike} color 안개 색상
     * @param {number} [value=0.0000138] 안개 밀도
     * @param {boolean} isDynamic 카메라 고도에 따른 안개 밀도 동적 설정 여부
     */
    setFog(color?: ColorLike, value?: number, isDynamic?: boolean): void;
    /**
     * @description 안개를 설정을 초기화 하는 함수
     */
    resetFog(): void;
    /**
     * @description 안개를 출력을 설정하는 함수
     * @param {boolean} isShow 출력여부
     */
    showFog(isShow: boolean): void;
    createFire(pos: any, params: any, url1: any, url2: any): VolumetricFire;
    removeFire(fire: any): void;
    createGrid(size: any, divisions: any): void;
    /**
     * 입력받은 Frustum으로 UFrustumHelper를 생성합니다.
     *
     * @param {import('three').Frustum} frustum
     * @param {UFrustumHelperCO} [options]
     * @returns {UFrustumHelper | undefined}
     */
    setFrustumHelper(frustum: three.Frustum, options?: UFrustumHelperCO): UFrustumHelper | undefined;
    /**
     * 입력받은 Frustum으로 지면 접촉 전용 UFrustumTerrainProjectionHelper를 생성합니다.
     * 기존 UFrustumHelper의 주요 스타일 인터페이스와 호환하며, terrain:true일 때 OOR 성분을 표시하지 않습니다.
     *
     * @param {import('three').Frustum} frustum
     * @param {import('@union3d/helpers/UFrustumTerrainProjectionHelper').UFrustumTerrainProjectionHelperCO} [options]
     * @returns {import('@union3d/helpers/UFrustumTerrainProjectionHelper').UFrustumTerrainProjectionHelper | undefined}
     */
    setFrustumTerrainProjectionHelper(frustum: three.Frustum, options?: UFrustumTerrainProjectionHelperCO): UFrustumTerrainProjectionHelper | undefined;
    createCollapse(camera: any, drawarg: any): void;
    getCollapse(): UCollapse;
    createDrawArg(opt: any, app: any, scene: any, sceneComment: any, camera: any, frustum: any, grRect: any, gr3dRect: any): UDrawArg;
    /**
     * 카메라 이동·회전에 따른 타일 데이터 업데이트의 민감도를 반환합니다.
     * 기본값은 1이며, 값이 클수록 작은 카메라 변화에도 지형·영상·모델 타일을 갱신합니다.
     * 타일이 생성되기 전이나 다시 생성되는 동안에는 앱에 보관된 설정값을 반환합니다.
     *
     * @returns {number} 0보다 큰 유한한 민감도 배율. 기본값 1
     *
     * @example
     * const sensitivity = app.getTileUpdateSensitivity();
     */
    getTileUpdateSensitivity(): number;
    /**
     * 카메라 이동·회전에 따른 타일 데이터 업데이트의 민감도를 설정합니다.
     * 마지막 타일 업데이트 이후 누적된 카메라 이동 거리와 회전각을 기준으로,
     * 지형·영상·모델 타일을 다시 갱신할 만큼 시점이 바뀌었는지를 판단하는 배율입니다.
     *
     * 기본값 1을 기준으로 2는 약 절반의 움직임에도 갱신하고, 0.5는 약 두 배의 움직임까지 기다립니다.
     * 값을 높이면 작은 움직임에 빠르게 반응하는 대신 타일 처리 부하가 늘어날 수 있습니다.
     * 값을 낮추면 작은 움직임을 더 많이 생략하여 갱신 빈도를 줄입니다.
     * 생략한 움직임은 마지막 실제 업데이트 시점부터 누적하여 비교합니다.
     *
     * 설정은 다음 타일 업데이트 판별부터 적용되며, 타일을 다시 생성해도 유지됩니다.
     * 숫자가 아니거나 유한하지 않은 값, 0 이하의 값은 적용하지 않습니다.
     * 잘못된 입력은 __GError__로 원인을 기록하고 기존 설정과 갱신 예약을 유지한 채 현재 앱을 반환합니다.
     *
     * @param {number} sensitivity 0보다 큰 유한한 민감도 배율. 1은 기본, 큰 값은 더 민감한 갱신
     * @returns {U3dApp} 현재 앱
     *
     * @example
     * app.setTileUpdateSensitivity(1);   // 기본 민감도
     * app.setTileUpdateSensitivity(2);   // 더 작은 카메라 움직임에도 갱신
     * app.setTileUpdateSensitivity(0.5); // 작은 움직임을 더 많이 생략
     */
    setTileUpdateSensitivity(sensitivity: number): U3dApp;
    /**
     * Quad Tile Tree Set을 생성하는 함수
     * @param {import('@UGeoRect').UGeoRect} [rectangle] 실제 화면에 가시화할 3차원 영역 나타내는 Rectangle
     * @param {number} [minlevel=5] 타일 서버에서 받아 올 타일의 최소 레벨. (데이터 가시화 레벨)
     * @return {null|import('@U3dQuadSet').U3dQuadSet} 생성된 Quad Tile Tree Set
     * @ignore
     */
    createQuadTreeSet(rectangle?: UGeoRect, minlevel?: number): null | U3dQuadSet;
    _quadtreeSet: U3dQuadSet;
    /**
     * 지도 위에 타일 경계 이미지를 출력할지 설정하는 함수
     * @param {boolean} val 이미지 디버그 모드 활성화 여부 [true : 활성, false : 비활성]
     */
    setImageDebug(val: boolean): void;
    /**
     * 이미지 디버그 모드 활성화 여부를 반환하는 함수
     * @returns {boolean} 이미지 디버그 모드 활성화 여부 [true : 활성, false : 비활성]
     */
    isImageDebug(): boolean;
    writeImageDebug(): void;
    /**
     * app의 FPS(초당 프레임 수)를 출력하는 모드를 설정하는 함수
     * @param {boolean} val FPS(초당 프레임 수) 출력 모드 활성 여부 [true : 활성, false : 비활성]
     */
    setDebug(val: boolean): void;
    /**
     *  FPS(초당 프레임 수) 출력 모드 활성 여부를 반환하는 함수
     * @returns {boolean}  FPS(초당 프레임 수) 출력 모드 활성 여부 [true : 활성, false : 비활성]
     */
    isDebug(): boolean;
    updateFrustum(): void;
    getCollapsePosition(vec: any, scenes: any): any;
    getWalkCollapsePosition(vec: any, scenes: any): any;
    isUpdateFrame(): boolean;
    createVideoLayer(opt: any): false | U3dVideoLayer;
    /**
     * 3D 애니메이션 모델 레이어를 생성해 앱에 추가합니다. <br>
     * 3ds 파일 시퀀스를 불러와 애니메이션으로 재생하는 레이어입니다. <br>
     * 옵션이 없거나 같은 이름의 레이어가 이미 있으면 생성하지 않고 `false`를 반환하므로, 반환값을 확인한 뒤 사용합니다.
     *
     * @param {object} opt 레이어 생성 옵션
     * @param {string} opt.name 레이어 이름. 이미 등록된 이름이면 생성하지 않습니다
     * @param {string} opt.baseurl 애니메이션 모델 URL
     * @param {import('three').Vector3Like} [opt.position] 모델의 위치
     * @param {import('three').Vector3Like} [opt.scale] 모델의 크기
     * @param {import('three').Vector3Like} [opt.rotation] 모델의 회전
     * @param {number} [opt.animationspeed=1] 애니메이션 속도
     * @returns {import('@union3d/3dLayer/U3dModelTdsLayer').U3dModelTdsLayer | boolean} 생성된 레이어. 생성하지 못하면 `false`
     *
     * @example
     * const layer = app.createModelTdsLayer(opt);
     * if (layer) app.showLayer(opt.name);
     */
    createModelTdsLayer(opt: {
        name: string;
        baseurl: string;
        position?: three.Vector3Like;
        scale?: three.Vector3Like;
        rotation?: three.Vector3Like;
        animationspeed?: number;
    }): U3dModelTdsLayer | boolean;
    update(list: any, event: any, force: any, change: any): void;
    particleUpdate(): void;
    /**
     * 강력 업데이트 실행 함수
     * @returns {Promise} 업데이트 수행 Promise
     */
    forceUpdate(): Promise<any>;
    /**
     * 업데이트 실행 함수
     */
    changeUpdate(): void;
    /**
     * 생성된 모델 레이어들에게서 입력된 박스 영역의 모델 객체를 타일단위로 강제 로드 하는 함수
     * @param {boolean} visible 검색 영역 표시 여부
     * @param {number} minx box 영역의 min X 좌표 값 (월드 좌표)
     * @param {number} maxx box 영역의 max X 좌표 값 (월드 좌표)
     * @param {number} miny box 영역의 min Y 좌표 값 (월드 좌표)
     * @param {number} maxy box 영역의 max Y 좌표 값 (월드 좌표)
     * @return {Promise} 업데이트 수행 Promise
     * @ignore
     */
    forceLoadModel(visible?: boolean, minx?: number, maxx?: number, miny?: number, maxy?: number): Promise<any>;
    /**
     * 실내, 객체 내부 또는 자세한 카메라 조작을 지원하는 1인칭 컨트롤 변경 함수
     * @param {boolean} set 1인칭 컨트롤 활성 여부 [ true : 활성 / false : 비활성 ]
     */
    setInteriorPanControl(set: boolean): void;
    /**
     * 카메라 컨트롤 동적타겟 사용 설정 함수
     */
    setDynamicPanControl(checkpick: any): void;
    /**
     * 다음 프래임에서 업데이트시 change 옵션 (타일 검색시 캐쉬된 타일을 사용하며 후처리 작업까지 진행 => tile.loaded 이벤트가 호출 )을 적용하는 함수
     * @ignore
     */
    saveChangeUpdate(): void;
    _saveChange: boolean;
    /**
     * 다음 프래임에서 업데이트시 force 옵션 (타일 검색시 캐쉬된 타일을 사용하지 않고 다시 로드)을 적용하는 함수
     * @ignore
     */
    saveForceUpdate(): void;
    _saveForce: boolean;
    /**
     * 지도화면 새로고침 함수
     * @ignore
     */
    setUpdateDate(event: any): void;
    cancelrenderFrame(time: any): void;
    setSearchPosition(worldX: any, worldY: any): void;
    getSearchPosition(): three.Vector3;
    clearSearchPosition(): void;
    /**
     * U3dApp의 사용 자원을 출력하는 함수
     */
    printResource(): void;
    /**
     * U3dApp의 사용 자원 중 필요없는 자원을 청소하는 함수
     */
    clearResource(): void;
    /**
     * app에 새로운 뷰 (U3dView) 를 생성하고 추가하는 함수
     * @param {import('@U3dView').U3dViewCO} opt 뷰 생성 옵션
     * @returns {Promise<import('@U3dView').U3dView>} 성공 시 U3dView 실패시 에러 메세지
     */
    createView(opt: U3dViewCO): Promise<U3dView>;
    compileAsync(target: any): Promise<three.Object3D<three.Object3DEventMap>>;
    draw(clear: any): void;
    /**
     * 추가한 view들을 라운드로빈 방식으로 순회하여 현재 프레임에서 그릴 view을 찾는 함수
     * forceSnapshot true인 뷰는 우선순위 1
     * 시간 복잡도: O(min(list.length, maxScanPerTick))
     * @param {number} [maxPerTick=5]  한 틱에서 실제로 처리할 최대 뷰 수(상한)
     * @param {number} [maxScanPerTick=5] 라운드로빈으로 스캔할 최대 뷰 수(스캔 상한)
     * @returns {Array<import('@U3dView').U3dView>} draw할 views
     */
    getRenderViewList(maxPerTick?: number, maxScanPerTick?: number): Array<U3dView>;
    drawModel(clear: any): void;
    isStopUpdate(): any;
    setStopUpdate(val: any): void;
    /**
     * 화면 위쪽이 북쪽을 향하도록 지도를 돌립니다.<br>
     * 좌우 방위만 되돌리며 내려다보는 상하 각도와 카메라가 서 있는 자리는 그대로 둡니다.<br>
     * 호출하면 진행 중이던 카메라 이동과 2D·3D 시점 전환을 먼저 멈춥니다.<br>
     * 현재 방위 값을 0도까지 줄이는 방향으로 돌기 때문에 북쪽까지 늘 가까운 쪽으로 도는 것은 아닙니다.<br>
     * 지도 컨트롤러가 만들어진 뒤에 올바른 동작이 실행됩니다.
     *
     * @param {number} [duration=1000] 회전에 사용할 시간이며 ms 단위
     * @returns {Promise<void>} 회전을 마치거나 도중에 멈추면 완료되는 promise 객체
     */
    alignNorth(duration?: number): Promise<void>;
    /**
     * 특정 영역(BoundingBox) 으로 카메라를 조정하는 함수
     * @param {object} boundingBox 영역(BoundingBox) 정보
     * @param {object} boundingBox.min 영역의 min x, y, z, 4326 위경도 좌표계가 아닌 3857 world 좌표계입니다.
     * @param {object} boundingBox.max 영역의 max x, y, z  4326 위경도 좌표계가 아닌 3857 world 좌표계입니다.
     * @param {boolean} useFly 이동 시 애니메이션 사용 유무
     * @param {number} offsetZ 이동 시 카메라 타겟과의 거리
     * @param {number} leftrotate 이동 시 카메라 좌우 각도
     * @param {number} downrotate 이동 시 카메라 상하 각도
     */
    fitExtentToBoundingBox(boundingBox: {
        min: object;
        max: object;
    }, useFly: boolean, offsetZ: number, leftrotate?: number, downrotate?: number): DeferredObject<unknown>;
    /**
     * 입력한 오브젝트 범위로 카메라를 조정하는 함수
     * @param {import('three').Object3D} object 이동할 오브젝트
     * @param {boolean} useFly 이동 시 애니메이션 사용 유무
     * @param {number} offsetZ 이동 시 카메라 타겟과의 거리
     * @param {number} leftrotate 이동 시 카메라 좌우 각도
     * @param {number} downrotate 이동 시 카메라 상하 각도
     */
    fitExtentToObject(object: three.Object3D, useFly: boolean, offsetZ: number, leftrotate?: number, downrotate?: number): void;
    refresh(): void;
    /**
     * 지도화면 이동 애니매이션 정지 함수
     */
    stopFly(): void;
    /**
     * 휠 줌 감도를 설정합니다.<br>
     * 입력값 자체는 검증하지 않으므로 호출 전에 유한한 양수인지 확인해야 합니다.<br>
     * 0·NaN은 감도 계산 시 기본값으로 대체되며, 음수·Infinity는 그대로 계산에 사용될 수 있습니다.
     * 따라서 0을 입력 비활성화 용도로 사용하지 않습니다.
     *
     * @param {number} [factor=1] 감도 배율. 생략하면 기본값 1로 복원합니다.
     * @returns {boolean} 값을 저장하면 true, 지도 컨트롤러 또는 getFactor가 없으면 변경 없이 false. true는 입력값의 유효성을 보장하지 않습니다.
     */
    setZoomSpeed(factor?: number): boolean;
    /**
     * 팬 이동 감도를 설정합니다.<br>
     * 입력값 자체는 검증하지 않으므로 호출 전에 유한한 양수인지 확인해야 합니다.<br>
     * 0·NaN은 감도 계산 시 기본값으로 대체되며, 음수·Infinity는 그대로 계산에 사용될 수 있습니다.
     * 따라서 0을 입력 비활성화 용도로 사용하지 않습니다.
     *
     * @param {number} [factor=1] 감도 배율. 생략하면 기본값 1로 복원합니다.
     * @returns {boolean} 값을 저장하면 true, 지도 컨트롤러 또는 getFactor가 없으면 변경 없이 false. true는 입력값의 유효성을 보장하지 않습니다.
     */
    setPanSpeed(factor?: number): boolean;
    /**
     * 공통 회전 감도를 설정합니다.<br>
     * 입력값 자체는 검증하지 않으므로 호출 전에 유한한 양수인지 확인해야 합니다.<br>
     * 0·NaN은 감도 계산 시 기본값으로 대체되며, 음수·Infinity는 그대로 계산에 사용될 수 있습니다.
     * 따라서 0을 입력 비활성화 용도로 사용하지 않습니다.
     *
     * @param {number} [factor=1] 감도 배율. 생략하면 기본값 1로 복원합니다.
     * @returns {boolean} 값을 저장하면 true, 지도 컨트롤러 또는 getFactor가 없으면 변경 없이 false. true는 입력값의 유효성을 보장하지 않습니다.
     */
    setRotateSpeed(factor?: number): boolean;
    /**
     * 수평 입력 회전 감도를 공통 회전 감도에 곱할 배율로 설정합니다.
     * 마우스·터치·회전 관성에 적용하며 각도 지정 및 자동 회전에는 적용하지 않습니다.<br>
     * 음수·NaN·Infinity·숫자가 아닌 값은 예외를 던지지 않고 false를 반환하며 기존 값을 유지합니다.<br>
     * 인자를 생략하면 해당 축만 1로 복원하며 공통 회전 감도와 다른 축의 감도는 유지합니다.
     *
     * @param {number} [factor=1] 유한한 0 이상 배율. 0이면 수평 입력 회전을 막습니다.
     * @returns {boolean} 적용하면 true, 잘못된 값이거나 지도 컨트롤러가 없으면 변경 없이 false
     */
    setRotateHorizontalSpeed(factor?: number): boolean;
    /**
     * 수직 입력 회전 감도를 기존 상하 회전량에 곱할 배율로 설정합니다.
     * 마우스·터치·회전 관성에 적용하며 각도 지정 및 자동 회전에는 적용하지 않습니다.<br>
     * 음수·NaN·Infinity·숫자가 아닌 값은 예외를 던지지 않고 false를 반환하며 기존 값을 유지합니다.<br>
     * 인자를 생략하면 해당 축만 1로 복원하며 공통 회전 감도와 다른 축의 감도는 유지합니다.
     *
     * @param {number} [factor=1] 유한한 0 이상 배율. 0이면 수직 입력 회전을 막습니다.
     * @returns {boolean} 적용하면 true, 잘못된 값이거나 지도 컨트롤러가 없으면 변경 없이 false
     */
    setRotateVerticalSpeed(factor?: number): boolean;
    getUseCollison(): boolean;
    setUseCollision(value: any): void;
    setFreePolarAngle(value: any): void;
    /**
     * GeOnDT for JS 버전정보 반환 함수
     * @returns {string} GeOnDT for JS 버전정보
     */
    getVersion(): string;
    /**
     * 지도화면의 domElement(canvas) 반환 함수
     * @returns {undefined | HTMLCanvasElement} canvas Element
     */
    getDomElement(): undefined | HTMLCanvasElement;
    setBackgroundColor(rgbString: any): boolean;
    /**
     * 2D 지도 모드 활성 여부를 반환하는 함수
     * @returns {boolean} 2D 지도 모드 활성 여부
     */
    is2DMode(): boolean;
    /**
     * 화면을 2D 지도 모드로 전환하는 함수입니다.<br>
     * 2D 지도 모드에서는 카메라가 지면을 수직으로 내려다보는 시점(TopView)과 화면 위쪽이 북쪽을 향하는 방향으로 고정되어, 일반 2D 지도처럼 이동과 확대·축소만 할 수 있습니다.<br>
     * 전환은 고도각(위아래로 내려다보는 각도)과 방위각(나침반 방향)을 각각 0.5초 동안 회전시키는 애니메이션으로 진행되며, 회전이 끝난 뒤에 두 각도가 고정됩니다.<br>
     * 이미 2D 지도 모드이면 화면을 움직이지 않고 즉시 완료됩니다.<br>
     * 전환이 끝나기 전에 다른 모드 전환이나 카메라 이동 함수가 호출되면 이번 전환은 취소되며, 이때에도 2D 지도 모드 상태이면 각도 고정은 그대로 유지됩니다.
     *
     * @returns {Promise<void>} 전환 결과를 알리는 promise 객체입니다.<br>
     * 전환이 끝나면 값 없이 resolve()되고, 지도 조작 컨트롤이 준비되지 않았거나 전환이 취소되면 reject()됩니다.
     */
    set2DMode(): Promise<void>;
    /**
     * 화면을 3D 지도 모드로 전환하는 함수입니다.<br>
     * 2D 지도 모드에서 걸려 있던 고도각(위아래로 내려다보는 각도)과 방위각(나침반 방향) 고정을 해제하여, 사용자가 다시 화면을 기울이고 회전시킬 수 있게 합니다.<br>
     * 카메라는 지면을 수직으로 내려다보는 방향을 0도로 하는 기준에서 60도 기울인 기본 3D 시점으로 회전합니다.<br>
     * target을 입력하면 각도 해제와 함께 카메라가 그 좌표를 바라보도록 이동하며, 이때 현재 방위각과 카메라·목표 지점 사이의 거리는 그대로 유지됩니다.<br>
     * target 없이 호출했을 때 이미 3D 지도 모드이면 화면을 움직이지 않고 즉시 완료됩니다.<br>
     * 전환이 끝나기 전에 다른 모드 전환이나 카메라 이동 함수가 호출되면 이번 전환은 취소됩니다.
     *
     * @param {null|WorldPositionVector3} [target=null] 카메라가 바라볼 목표 좌표이며 월드 좌표(EPSG:3857)로 입력합니다.<br>
     * null을 입력하면 목표 좌표를 바꾸지 않고 카메라 각도만 3D 시점으로 되돌립니다.
     * @returns {Promise<void|boolean>} 전환 결과를 알리는 promise 객체입니다.<br>
     * 전환이 끝나면 resolve()되며, target을 입력한 경우에는 resolve() 값으로 true가 전달됩니다.<br>
     * 지도 조작 컨트롤이 준비되지 않았거나 전환이 취소되면 reject()됩니다.
     */
    set3DMode(target?: null | WorldPositionVector3): Promise<void | boolean>;
    /**
     * U3dApp에 레이어를 추가하는 함수
     * @param {import('@union3d/3dLayer/U3dLayer').U3dLayer} layer 추가할 레이어 객체 (예: U3dImageXYZLayer, U3dHeightXYZLayer 등)
     * @returns {import('@union3d/3dLayer/U3dLayer').U3dLayer | undefined} 추가된 레이어 객체
     */
    addLayer(layer: U3dLayer): U3dLayer | undefined;
    shareLayer(layer: any): boolean;
    /**
     * U3dApp에 뷰를 추가하는 함수
     * @param {import('@U3dView').U3dView} view U3dView 객체
     * @returns {Promise<import('@U3dView').U3dView>} 추가가 끝난 시점의 Promise. 뷰가 아니거나 이미 추가된 뷰면 reject 됩니다
     *
     * @example
     * app.addView(view).then((added) => console.log(added));
     */
    addView(view: U3dView): Promise<U3dView>;
    /**
     * 카메라뷰 ID로 해당 뷰를 반환하는 함수
     * @param {string} id U3dView의 ID
     * @returns {import('@U3dView').U3dView} U3dView 객체
     */
    getViewById(id: string): U3dView;
    /**
     * 카메라 뷰(화면)를 삭제하는 함수
     * @param {import('@U3dView').U3dView} view 카메라뷰
     */
    removeView(view: U3dView): void;
    /**
     * 이름이 같은 카메라 뷰를 찾아 반환합니다.
     *
     * @param {string} viewName 찾을 카메라 뷰 이름
     * @returns {import('@U3dView').U3dView | undefined} 찾은 카메라 뷰
     *
     * @example
     * const view = app.findViewByName('mainView');
     */
    findViewByName(viewName: string): U3dView | undefined;
    /**
     * 화면에 추가된 카메라뷰를 모두 제거하는 함수
     */
    removeAllView(): void;
    /**
     * @deprecated
     * U3dApp에 광원뷰를 추가하는 함수
     * @param {import('@U3dViewLight').U3dViewLight} viewlight U3dViewLight 광원뷰
     * @ignore
     */
    addViewLight(viewlight: U3dViewLight): void;
    /**
     * @deprecated
     * 광원뷰의 ID로 해당 광원뷰를 반환하는 함수
     * @param {string} id U3dViewLight의 ID
     * @returns {import('@U3dViewLight').U3dViewLight} U3dViewLight 객체
     * @ignore
     */
    getViewLightById(id: string): U3dViewLight;
    /**
     * @deprecated
     * 광원뷰를 삭제하는 함수
     * @param {import('@U3dViewLight').U3dViewLight} viewLight U3dViewLight 객체
     * @ignore
     */
    removeViewLight(viewLight: U3dViewLight): void;
    /**
     * @deprecated
     * 화면에 추가된 광원뷰를 모두 제거하는 함수
     * @ignore
     */
    removeAllViewLight(): void;
    /**
     * 앱에 등록된 오버레이를 반환합니다.
     *
     * @returns {Array<import('@U3dOverlay').U3dOverlay>} 오버레이 목록
     *
     * @example
     * const overlays = app.getOverlayList();
     */
    getOverlayList(): Array<U3dOverlay>;
    /**
     * 앱에 등록된 카메라 뷰를 반환합니다.
     *
     * @returns {Array<import('@U3dView').U3dView>} 카메라 뷰 목록
     *
     * @example
     * const views = app.getViewList();
     */
    getViewList(): Array<U3dView>;
    /**
     * 앱에 등록된 광원을 반환합니다.
     *
     * @returns {Array<import('@USpotLight').USpotLight>} 광원 목록
     *
     * @example
     * const lights = app.getLightList();
     */
    getLightList(): Array<USpotLight>;
    /**
     * 광원을 추가합니다.
     * @param {import('@USpotLight').USpotLight} light USpotLight (광원)
     */
    addLight(light: USpotLight): void;
    /**
     * 광원을 삭제하는 함수
     * @param {import('@USpotLight').USpotLight} light 광원
     */
    removeLight(light: USpotLight): void;
    /**
     * 이름이 같은 광원을 찾아 반환합니다.
     *
     * @param {string} lightName 찾을 광원 이름
     * @returns {import('@USpotLight').USpotLight | undefined} 찾은 광원
     *
     * @example
     * const light = app.findLightByName('mainLight');
     */
    findLightByName(lightName: string): USpotLight | undefined;
    /**
     * 화면에 추가된 광원을 모두 제거하는 함수
     */
    removeAllLight(): void;
    /**
     * 지정한 위치에 HTML 오버레이를 만들어 화면에 추가합니다.
     *
     * @param {string | HTMLElement} html 화면에 표시할 HTML
     * @param {import('@U3dOverlay').U3dOverlayCO} option 오버레이 설정
     * @param {GeoPosition} option.position 표시할 위치
     * @param {string} [option.uuid] 오버레이 ID
     * @param {boolean} [option.useanchor] 앵커 사용 여부
     * @param {Array<number>} [option.anchor] 앵커 위치
     * @param {{x: number, y: number}} [option.balloon] 말풍선 꼭지점 위치
     * @returns {import('@U3dOverlay').U3dOverlay | undefined} 생성된 오버레이
     *
     * @example
     * const overlay = app.createOverlay('<div>서울</div>', {
     *     position: {x: 126.97, y: 37.56, z: 0}
     * });
     */
    createOverlay(html: string | HTMLElement, option: U3dOverlayCO): U3dOverlay | undefined;
    /**
     * U3dApp에 오버레이를 추가하는 함수
     * @param {import('@U3dOverlay').U3dOverlay} overlay U3dOverlay 객체
     */
    addOverlay(overlay: U3dOverlay): void;
    /**
     * 오버레이의 ID로 해당 오버레이를 반환하는 함수
     * @param {string} id U3dOverlay의 ID
     * @returns {import('@U3dOverlay').U3dOverlay} U3dOverlay 객체
     */
    getOverlayById(id: string): U3dOverlay;
    /**
     * 오버레이를 삭제하는 함수
     * @param {import('@U3dOverlay').U3dOverlay} overlay U3dOverlay 객체
     */
    removeOverlay(overlay: U3dOverlay): void;
    /**
     * 화면에 추가된 오버레이를 모두 제거하는 함수
     */
    removeAllOverlay(): void;
    /**
     * 설정된 홈 위치로 이동하는 함수
     * @param {number} [duration] 홈 위치로 이동 시 애니메이션 시간(ms)
     */
    goToHome(duration?: number): void;
    /**
     * 등록된 canvas에 click 동작을 실행하는 함수
     * @param {import('@U3dMouseEvent').U3dMouseEvent} u3dMouseEvent 마우스 이벤트 정보 객체
     */
    click(u3dMouseEvent: U3dMouseEvent): void;
    /**
     * 등록된 canvas에 double click 동작을 실행하는 함수
     * @param {import('@U3dMouseEvent').U3dMouseEvent} u3dMouseEvent 마우스 이벤트 정보 객체
     */
    dbclick(u3dMouseEvent: U3dMouseEvent): void;
    /**
     * map control 이동 완료 시에 이벤트 등록 함수
     * @param {Function} listener 이동 완료 후 이벤트 등록 함수
     * @param {boolean} once 한번만 실행 여부
     * @param {string} name 이벤트 등록시 설정할 이름
     */
    onFlyEnd(listener: Function, once: boolean, name: string): void;
    /**
     * map control 이동 완료 시에 이벤트 제거 함수
     * @param  {Function} listener 이동 완료 후 등록된 이벤트 제거 함수
     */
    offFlyEnd(listener: Function): void;
    /**
     * 월드 좌표(EPSG:3857)를 입력받아 해당 좌표의 구글 스케일이 적용된 z 값을 반환하는 함수
     * @param {WorldPosition} world 월드 좌표
     * @param {boolean} [useRaycaster=false] Raycaster를 사용하여 높이를 정밀하게 측정할건지의 여부, 사용시 API 성능이 떨어질 수 있습니다.
     * @param {Partial<{ useCache: boolean }>} [options={}] 근접 좌표 height cache 사용 옵션.
     * @returns {number} z 값(구글 스케일이 적용, m가 아님)
     */
    getRenderHeightAtPoint(world: WorldPosition, useRaycaster?: boolean, options?: Partial<{
        useCache: boolean;
    }>): number;
    /**
     * 월드 좌표(EPSG:3857)를 입력받아 해당 좌표의 높이(m)를 반환하는 함수
     * @param {WorldPosition} world 월드 좌표
     * @param {boolean} [useRaycaster=false] Raycaster를 사용하여 높이를 정밀하게 측정할건지의 여부, 사용시 API 성능이 떨어질 수 있습니다.
     * @param {Partial<{ useCache: boolean }>} [options={}] 근접 좌표 height cache 사용 옵션.
     * @returns {number} height 높이(m)
     */
    getHeightAtPoint(world: WorldPosition, useRaycaster?: boolean, options?: Partial<{
        useCache: boolean;
    }>): number;
    /**
     * 입력받은 위경도 좌표의 높이(고도m)값을 리턴해주는 함수
     * @param {GeoPosition} geo 위경도 좌표
     * @param {boolean} [useRaycaster=false] Raycaster를 사용하여 높이를 정밀하게 측정할건지의 여부, 사용시 API 성능이 떨어질 수 있습니다.
     * @returns {number} 고도값
     */
    getHeightAtGeographicPoint(geo: GeoPosition, useRaycaster?: boolean): number;
    /**
     * 화면에서 선택한 위치와 만나는 3D 객체를 찾습니다. <br>
     * 카메라에 보이는 범위(절두체) 안에 있는 객체만 검색 대상으로 삼습니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent | MouseEvent | import('three').Vector3 | {normalizedX: number | undefined, normalizedY: number | undefined}} e 화면 위치 정보.
     * @param {boolean} [onlyTerrain=true] 지형에서만 찾을지 여부. `false`면 모델·사용자 레이어까지 함께 찾습니다
     * @param {boolean} [recursive] 각 객체의 하위 객체까지 파고들어 찾을지 여부
     * @returns {Array<import('three').Intersection<import('three').Object3D>>} 광선과 만난 객체 목록
     *
     * @example
     * const intersects = app.intersectInFrustum(event);
     * if (intersects.length > 0) console.log(intersects[0].object.name);
     */
    intersectInFrustum(e: U3dMouseEvent | MouseEvent | three.Vector3 | {
        normalizedX: number | undefined;
        normalizedY: number | undefined;
    }, onlyTerrain?: boolean, recursive?: boolean): Array<three.Intersection<three.Object3D>>;
    /**
     * 시작점과 방향을 지정해 광선을 쏘고, 그 광선과 만나는 3D 객체를 찾습니다.
     *
     * @param {WorldPositionVector3} position 광선 시작점 (월드 좌표, EPSG:3857)
     * @param {import('three').Vector3} direction 광선 방향 벡터
     * @param {boolean} [onlyTerrain] 지형에서만 찾을지 여부. `false`면 모델·사용자 레이어까지 함께 찾습니다
     * @param {boolean} [recursive] 각 객체의 하위 객체까지 파고들어 찾을지 여부
     * @returns {Array<import('three').Intersection<import('three').Object3D>>} 광선과 만난 객체 목록
     *
     * @ignore
     */
    intersect_(position: WorldPositionVector3, direction: three.Vector3, onlyTerrain?: boolean, recursive?: boolean): Array<three.Intersection<three.Object3D>>;
    /**
     * 지정한 검색 대상 안에서 3D 객체를 찾습니다. <br>
     * 마우스 이벤트를 넘기면 카메라에서 화면 위치를 향해 광선을 쏘고, 월드 좌표를 넘기면 그 지점의 상공에서 지면을 향해 수직으로 광선을 쏩니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent | MouseEvent | import('three').Vector3 | {normalizedX: number | undefined, normalizedY: number | undefined}} e 화면 위치 정보 또는 월드 좌표 (EPSG:3857)
     * @param {Array<import('three').Object3D>} scenes 검색 대상 목록. 레이어의 Scene뿐 아니라 개별 3D 객체도 넣을 수 있습니다
     * @param {boolean} [recursive] 각 대상의 하위 객체까지 파고들어 찾을지 여부
     * @param {import('@URaycaster').URaycasterCO} [params] 검색 옵션 (보이지 않는 객체 포함 여부, 정밀도 등)
     * @returns {Array<import('three').Intersection<import('three').Object3D>>} 광선과 만난 객체 목록
     *
     * @example
     * const intersects = app.intersectFromScene(event, [layer.getScene()]);
     */
    intersectFromScene(e: U3dMouseEvent | MouseEvent | three.Vector3 | {
        normalizedX: number | undefined;
        normalizedY: number | undefined;
    }, scenes: Array<three.Object3D>, recursive?: boolean, params?: URaycasterCO): Array<three.Intersection<three.Object3D>>;
    /**
     * 화면에서 선택한 위치와 만나는 3D 객체를 찾습니다. <br>
     * 카메라에서 선택 지점을 향해 광선을 쏘아, 그 광선이 지나는 객체를 모두 찾습니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent | MouseEvent | import('three').Vector3 | {normalizedX: number | undefined, normalizedY: number | undefined}} e 화면 위치 정보
     * @param {boolean} [onlyTerrain=false] 지형에서만 찾을지 여부. `true`면 건물·시설물 같은 모델을 무시하고 지표면만 찾습니다
     * @param {boolean} [recursive=true] 각 객체의 하위 객체까지 파고들어 찾을지 여부
     * @param {import('@UScene').UScene | Array<import('@UScene').UScene>} [appendScenes] 기본 검색 대상에 더해서 함께 검색할 Scene
     * @param {import('@URaycaster').URaycasterCO} [params] 검색 옵션 (보이지 않는 객체 포함 여부, 정밀도 등)
     * @returns {Array<import('three').Intersection<import('three').Object3D>>} 광선과 만난 객체 목록
     *
     * @example
     * const intersects = app.intersectAtPixel(event, true);
     *
     * @example
     * app.on('click', (e) => {
     *     const intersects = app.intersectAtPixel(e);
     *     if (intersects.length > 0) console.log(intersects[0].object.name);
     * });
     */
    intersectAtPixel(e: U3dMouseEvent | MouseEvent | three.Vector3 | {
        normalizedX: number | undefined;
        normalizedY: number | undefined;
    }, onlyTerrain?: boolean, recursive?: boolean, appendScenes?: UScene | Array<UScene>, params?: URaycasterCO): Array<three.Intersection<three.Object3D>>;
    /**
     * 지정한 월드 좌표 지점의 상공에서 지면을 향해 수직으로 광선을 쏘아, 그 아래에 있는 3D 객체를 찾습니다.
     *
     * @param {WorldPositionVector3} vec3 검색할 월드 좌표 (EPSG:3857)
     * @param {boolean} [onlyTerrain] 지형에서만 찾을지 여부. `true`면 지표면만 찾습니다
     * @param {boolean} [recursive] 각 객체의 하위 객체까지 파고들어 찾을지 여부
     * @param {import('@UScene').UScene | Array<import('@UScene').UScene>} [appendScenes] 기본 검색 대상에 더해서 함께 검색할 Scene
     * @param {import('@URaycaster').URaycasterCO} [params] 검색 옵션 (보이지 않는 객체 포함 여부, 정밀도 등)
     * @returns {Array<import('three').Intersection<import('three').Object3D>>} 광선과 만난 객체 목록
     *
     * @ignore
     */
    intersectAtVector3_(vec3: WorldPositionVector3, onlyTerrain?: boolean, recursive?: boolean, appendScenes?: UScene | Array<UScene>, params?: URaycasterCO): Array<three.Intersection<three.Object3D>>;
    /**
     * 지정한 월드 좌표와 그 주변 범위를 격자로 훑어, 그 자리에 있는 객체를 찾습니다. <br>
     * 중심에서 `gapPixel`만큼 떨어진 범위를 1단위 간격으로 이동하며 좌표마다 광선을 쏘고, 결과에서 같은 객체는 한 번만 남깁니다.
     *
     * @param {WorldPositionVector3} world 검색할 월드 좌표 (EPSG:3857)
     * @param {number} [gapPixel=5] 중심에서 상하좌우로 훑을 범위. 픽셀이 아니라 월드 좌표 단위입니다
     * @param {boolean} [closedobject=false] `true`면 찾은 객체 목록 대신 교차점 좌표 하나만 반환합니다
     * @param {import('@UScene').UScene | Array<import('@UScene').UScene> | null} [scenes] 검색 대상 Scene 목록. 넘기지 않으면 모델·지형 레이어 전체에서 찾습니다
     * @returns {Array<import('three').Intersection<import('three').Object3D>> | WorldPositionVector3 | undefined} 중복을 제거한 객체 목록. `closedobject`가 `true`면 처음 만난 교차점 좌표이며, 만나는 객체가 없으면 `undefined`
     *
     * @example
     * const intersects = app.intersectModelAtWorldPoint(world, 3);
     */
    intersectModelAtWorldPoint(world: WorldPositionVector3, gapPixel?: number, closedobject?: boolean, scenes?: UScene | Array<UScene> | null): Array<three.Intersection<three.Object3D>> | WorldPositionVector3 | undefined;
    /**
     * 지정한 위경도 좌표와 그 주변 범위를 격자로 훑어, 그 자리에 있는 객체를 찾습니다. <br>
     * 넘긴 위경도를 월드 좌표로 변환한 뒤 검색합니다.
     *
     * @param {GeoPosition} geo 검색할 위경도 좌표 (EPSG:4326)
     * @param {number} [gapPixel] 중심에서 상하좌우로 훑을 범위. 픽셀이 아니라 월드 좌표 단위이며, 넘기지 않으면 `5`가 적용됩니다
     * @param {boolean} [closedobject=false] `true`면 찾은 객체 목록 대신 교차점 좌표 하나만 반환합니다
     * @param {import('@UScene').UScene | Array<import('@UScene').UScene> | null} [scenes] 검색 대상 Scene 목록. 넘기지 않으면 모델·지형 레이어 전체에서 찾습니다
     * @returns {Array<import('three').Intersection<import('three').Object3D>> | WorldPositionVector3 | undefined} 중복을 제거한 객체 목록. `closedobject`가 `true`면 처음 만난 교차점 좌표이며, 만나는 객체가 없으면 `undefined`
     *
     * @example
     * const intersects = app.intersectModelAtGeographicPoint({x: 126.9393, y: 37.5194}, 3);
     */
    intersectModelAtGeographicPoint(geo: GeoPosition, gapPixel?: number, closedobject?: boolean, scenes?: UScene | Array<UScene> | null): Array<three.Intersection<three.Object3D>> | WorldPositionVector3 | undefined;
    /**
     * 화면에서 선택한 위치가 3D 공간의 어느 지점인지 좌표로 반환합니다. <br>
     * 카메라에서 선택 지점을 향해 광선을 쏘아, 가장 가까운 교차 지점의 좌표를 반환합니다. 만나는 객체가 없으면 `undefined`를 반환합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent | MouseEvent | import('three').Vector3 | {normalizedX: number | undefined, normalizedY: number | undefined}} e 화면 위치 정보
     * @param {boolean} [onlyTerrain] 지형만 체크할지 여부. `true`면 건물·시설물 같은 모델을 무시하고 지표면에 닿는 좌표만 구합니다
     * @param {boolean} [recursive] 각 객체의 하위 객체까지 파고들어 찾을지 여부
     * @param {Array<import('@UScene').UScene> | import('@UScene').UScene} [scenes] 기본 검색 대상에 더해서 함께 검색할 Scene
     * @returns {WorldPositionVector3} 가장 가까운 교차점의 월드 좌표 (EPSG:3857)
     *
     * @example
     * app.on('click', (e) => {
     *     const world = app.closestPointAtPixel(e, true);
     *     if (!world) return;
     *     const lonlat = app.vector3ToGeoGraphic(world);
     * });
     */
    closestPointAtPixel(e: U3dMouseEvent | MouseEvent | three.Vector3 | {
        normalizedX: number | undefined;
        normalizedY: number | undefined;
    }, onlyTerrain?: boolean, recursive?: boolean, scenes?: Array<UScene> | UScene): WorldPositionVector3;
    /**
     * 지정한 월드 좌표의 상공에서 지면을 향해 수직으로 광선을 쏘아, 처음 닿는 지점의 좌표를 반환합니다. <br>
     * 만나는 객체가 없으면 `undefined`를 반환합니다.
     *
     * @param {WorldPositionVector3} vec3 검색할 월드 좌표 (EPSG:3857)
     * @param {boolean} [onlyTerrain] 지형만 체크할지 여부. `true`면 지표면 높이만 구합니다
     * @param {boolean} [recursive] 각 객체의 하위 객체까지 파고들어 찾을지 여부
     * @param {import('@UScene').UScene | Array<import('@UScene').UScene>} [scenes] 기본 검색 대상에 더해서 함께 검색할 Scene
     * @returns {WorldPositionVector3} 처음 닿은 지점의 월드 좌표 (EPSG:3857)
     *
     * @ignore
     */
    closestPointAtVector3_(vec3: WorldPositionVector3, onlyTerrain?: boolean, recursive?: boolean, scenes?: UScene | Array<UScene>): WorldPositionVector3;
    /**
     * 지정한 위경도 지점의 상공에서 지면을 향해 수직으로 광선을 쏘아, 처음 닿는 지점의 좌표를 반환합니다. <br>
     * 넘긴 위경도를 월드 좌표로 변환한 뒤 검색하며, 만나는 객체가 없으면 `undefined`를 반환합니다.
     *
     * @param {GeoPosition} position 검색할 위경도 좌표 (EPSG:4326)
     * @param {boolean} [onlyTerrain] 지형만 체크할지 여부. `true`면 건물·시설물을 무시하고 지표면 높이만 구합니다
     * @param {boolean} [recursive] 각 객체의 하위 객체까지 파고들어 찾을지 여부
     * @returns {WorldPositionVector3} 처음 닿은 지점의 월드 좌표 (EPSG:3857)
     *
     * @example
     * const world = app.closestPointAtGeographic({x: 126.9393, y: 37.5194}, true);
     * if (world) console.log(world.z);
     */
    closestPointAtGeographic(position: GeoPosition, onlyTerrain?: boolean, recursive?: boolean): WorldPositionVector3;
    /**
     * 마우스 좌표를 위경도 좌표로 반환하는 함수
     * @param {import('@U3dMouseEvent').U3dMouseEvent} event 마우스 이벤트 결과값 객체
     * @returns {GeoPosition} 위경도 좌표
     */
    getMouseToGeographic(event: U3dMouseEvent): GeoPosition;
    /**
     * 픽셀좌표(화면좌표)를 3D좌표로 변환하는 함수. <br>
     * 교차 검색(intersect)를 통해 픽셀좌표(화면좌표)를 3D좌표로 변환한다.
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e GeOnDT 마우스 이벤트 객체
     * @param {boolean} onlyTerrain 교차 검색 지형만 대상으로 할 것인지 여부. false면 씬에 추가된 모델까지 포함한다.
     * @param {boolean} recursive 교차 검색 시 자식 Object까지 포함할지 여부
     * @returns {WorldPosition} 3D좌표
     */
    pixelToVector3(e: U3dMouseEvent, onlyTerrain: boolean, recursive: boolean): WorldPosition;
    /**
     * 픽셀좌표(화면좌표)를 위경도좌표로 변환하는 함수.<br>
     * 교차 검색(intersect)를 통해 픽셀좌표(화면좌표)를 위경도좌표로 변환한다.
     * @param {import('@U3dMouseEvent').U3dMouseEvent | MouseEvent} e GeOnDT 마우스 이벤트 객체
     * @param {boolean} onlyTerrain 교차 검색 지형만 대상으로 할 것인지 여부. false면 씬에 추가된 모델까지 포함한다.
     * @param {boolean} recursive 교차 검색 시 자식 Object까지 포함할지 여부
     * @returns {GeoPosition} 위경도좌표
     */
    pixelToGeographic(e: U3dMouseEvent | MouseEvent, onlyTerrain: boolean, recursive: boolean): GeoPosition;
    /**
     * 3D 월드 좌표를 픽셀 좌표(화면 좌표)로 변환하는 함수입니다.
     * @param {WorldPositionVector3} vec3 3D 월드 좌표 (EPSG:3857)
     * @returns {import('three').Vector2Like} 픽셀 좌표 (화면 좌표) {x: number, y: number}
     */
    vector3ToPixel(vec3: WorldPositionVector3): three.Vector2Like;
    /**
     * 웹 메르카토르(Web Mercator) 월드 좌표(EPSG:3857)를 WGS84 위경도 좌표계(EPSG:4326)로 변환합니다.<br>
     * 반환 객체의 x는 경도(도), y는 위도(도), z는 지면으로부터의 실제 높이(미터)입니다.<br>
     * 입력 z는 월드 좌표(EPSG:3857)의 z 값이며 위도별 축척을 곱해 실제 높이(미터)로 환산합니다.<br>
     * vec3가 undefined이거나 null이면 변환을 건너뛰고 x·y·z가 모두 0인 벡터를 반환합니다.<br>
     * 이 반환값은 경도 0도·위도 0도 지점과 구분되지 않으므로, 두 경우를 구분해야 하면 호출 전에 vec3가 있는지 확인하십시오.
     *
     * @param {WorldPosition | undefined} vec3 변환할 웹 메르카토르(Web Mercator) 월드 좌표(EPSG:3857) 위치입니다.
     * @returns {GeoPositionVector3} 변환한 WGS84 위경도 좌표계(EPSG:4326) 위치이며, 지도 API나 서버처럼 위경도를 받는 대상에 넘길 때 사용합니다.
     */
    vector3ToGeoGraphic(vec3: WorldPosition | undefined): GeoPositionVector3;
    /**
     * WGS84 위경도 좌표계(EPSG:4326)를 웹 메르카토르(Web Mercator) 월드 좌표(EPSG:3857)로 변환합니다.<br>
     * 입력 x는 경도(도), y는 위도(도), z는 지면으로부터의 실제 높이(미터)입니다.<br>
     * z를 생략하거나 0을 넣으면 높이 0으로 처리합니다.<br>
     * 반환 객체의 x·y는 미터 단위 월드 좌표(EPSG:3857)이고, z는 입력 높이를 위도별 축척으로 나눠 환산한 월드 좌표(EPSG:3857)의 z 값이므로 입력한 미터 값과 같지 않습니다.
     *
     * @param {GeoPosition} position 변환할 WGS84 위경도 좌표계(EPSG:4326) 위치이며, 값을 넘기지 않으면 오류가 발생하므로 반드시 전달하십시오.
     * @returns {WorldPositionVector3} 변환한 웹 메르카토르(Web Mercator) 월드 좌표(EPSG:3857) 위치이며, 3D 장면에 객체를 배치하거나 거리를 계산할 때 사용합니다.
     */
    geographicToVector3(position: GeoPosition): WorldPositionVector3;
    /**
     * 위경도 좌표를 픽셀 좌표(화면 좌표)로 변환하는 함수
     * @param {GeoPosition} position 위경도 좌표
     * @returns {{x: number, y: number}} 픽셀 좌표 (x, y)
     */
    geographicToPixel(position: GeoPosition): {
        x: number;
        y: number;
    };
    /**
     * 카메라 줌, 패닝, 회전속도(factor)를 지면과의 거리에 따라 자동으로 변경하는 기능 사용여부 설정 함수
     * @param {boolean} [use=true] 기능 사용여부
     */
    setAutoSpeed(use?: boolean): void;
    /**
     * U3dApp 데이터 변경 시간을 갱신합니다.
     *
     * @example
     * app.updateData();
     */
    updateData(): void;
    /**
     * 현재 앱의 카메라 움직임을 다른 앱의 카메라에 동기화합니다.
     *
     * @param {U3dApp} app 카메라를 함께 움직일 앱
     * @param {number} [reactiveOffset] 카메라 거리 배율
     * @returns {string | null | undefined} 동기화 해제에 사용할 이벤트 ID
     *
     * @example
     * const syncId = app1.syncCamera(app2);
     * app1.unkey('change', syncId);
     */
    syncCamera(app: U3dApp, reactiveOffset?: number): string | null | undefined;
    /**
     * 건물 지우기 등록 함수
     * 입력받은 데이터에 제거할 건물을 등록한다.
     * @param {Array<KeyValue> | KeyValue} data 건물 지우기 데이터 배열 또는 오브젝트 (Object 구성 {layer : 레이어이름, uid : 유니크아이디})
     */
    registerRemoveModel(data: Array<KeyValue> | KeyValue): void;
    /**
     * 건물 지우기 등록 함수
     * 입력받은 데이터에 제거할 건물을 등록삭제한다.
     * @param {Array<KeyValue> | KeyValue} data 건물 지우기 데이터 배열 또는 오브젝트 (Object 구성 {layer : 레이어이름, uid : 유니크아이디})
     */
    deleteRemoveModel(data: Array<KeyValue> | KeyValue): void;
    /**
     * 건물 지우기 함수
     * 입력받은 데이터에 해당하는 건물을 제거한다.
     * @param {Array<KeyValue> | KeyValue} data 건물 지우기 데이터 배열 또는 오브젝트 (Object 구성 {layer : 레이어이름, uid : 유니크아이디})
     */
    removeModel(data: Array<KeyValue> | KeyValue): void;
    /**
     * 건물 지우기 내역을 모두 취소하고, 지워진 건물을 가시화 하는 함수.
     */
    cancelAllRemoveModel(): void;
    /**
     * 입력받은 레이어의 UniqueId를 가진 건물을 다시 가시화 하는 함수
     * @param {string} layerName 레이어 이름
     * @param {string|number} uid 건물 UniqueId
     */
    cancelRemoveModel(layerName: string, uid: string | number, autoSave: any): void;
    /**
     * 지워진 건물 목록을 반환 하는 함수
     * @returns {Array<KeyValue>} 지워진 건물 목록 배열
     */
    getRemovedModelList(): Array<KeyValue>;
    /**
     * 레이어 이름과 id를 입력 받아 지워진 건물에 정보를 반환하는 함수
     * @param {string} layerName 레이어 이름
     * @param {string} uid 대상 uid
     * @returns {object} 지워진 건물 정보
     */
    getRemovedModel(layerName: string, uid: string): object;
    /**
     * 지도화면 제어(이동(Pan), 줌(ZoomIn-ZoomOut), 회전(Rotation)) 함수
     * @param {boolean} [bool=true] 지도화면 제어 유무
     */
    disableCameraMove(bool?: boolean): void;
    /**
     * 지도화면 줌(확대/축소) 제어 함수
     * @param {boolean} [bool=true] 지도화면 줌(확대/축소) 제어 유무
     */
    disableCameraZoom(bool?: boolean): void;
    /**
     * 지도화면 이동(Pan) 제어 함수
     * @param {boolean} [bool=true] 지도화면 이동(Pan) 제어 유무
     */
    disableCameraPan(bool?: boolean): void;
    /**
     * 지도화면 회전(Rotation) 제어 함수
     * @param {boolean} [bool=true] 지도화면 회전(Rotation) 제어 유무
     */
    disableCameraRotate(bool?: boolean): void;
    /**
     * 화면 중앙이 바라보는 지점을 중심으로 카메라를 위아래로 돌려 시점의 기울기를 바꿉니다.<br>
     * 목표 각도를 지정하는 것이 아니라 현재 각도에 넘긴 값을 더하며, setCameraPosition()의 downrotate와 같은 기준의 각도입니다.<br>
     * 양수를 넘기면 카메라가 그 지점 주위를 따라 아래로 내려와 수직으로 내려다보던 시점이 수평에 가까워집니다.<br>
     * 음수를 넘기면 반대로 카메라가 올라가 더 내려다보는 시점이 됩니다.<br>
     * 더한 결과는 지도 컨트롤러에 설정된 상하 회전 허용 범위 안으로 잘리며, 기본 범위는 0.1도부터 85도까지입니다.<br>
     * 애니메이션 없이 곧바로 화면에 반영합니다.<br>
     * 지도 컨트롤러가 만들어진 뒤에 올바른 동작이 실행됩니다.
     *
     * @param {number} value 현재 상하 각도에 더할 회전량이며 isDegree에 따라 degree 또는 radian으로 해석
     * @param {boolean} [isDegree=true] 참이면 value를 degree로, 거짓이면 radian으로 해석
     */
    setCameraDownRotate(value: number, isDegree?: boolean): void;
    /**
     * 화면 중앙이 바라보는 지점을 중심으로 카메라를 좌우로 돌려 지도의 방위를 바꿉니다.<br>
     * 목표 각도를 지정하는 것이 아니라 현재 방위 각도에 넘긴 값을 더하며, setCameraPosition()의 leftrotate와 같은 기준의 각도입니다.<br>
     * 양수를 넘기면 시선이 왼쪽으로 돌아 북쪽을 보고 있었다면 서쪽 방향을 향하고, 음수를 넘기면 그 반대쪽으로 돌아갑니다.<br>
     * 상하 회전과 달리 좌우 회전에는 기본적으로 허용 범위 제한이 없어 넘긴 값이 잘리지 않고 그대로 적용됩니다.<br>
     * 애니메이션 없이 곧바로 화면에 반영합니다.<br>
     * 지도 컨트롤러가 만들어진 뒤에 올바른 동작이 실행됩니다.
     *
     * @param {number} value 현재 방위 각도에 더할 회전량이며 isDegree에 따라 degree 또는 radian으로 해석
     * @param {boolean} [isDegree=true] 참이면 value를 degree로, 거짓이면 radian으로 해석
     */
    setCameraLeftRotate(value: number, isDegree?: boolean): void;
    /**
     * @description 카메라의 출력 최소거리와 최대거리를 설정하는 함수
     * @param {Number} min 카메라의 출력 최소거리
     * @param {Number} max 카메라의 출력 최대거리
     */
    setCameraLimitDistance(min: number, max: number): void;
    resetCameraLimitDistance(): void;
    /**
     * UMapcontrol의 충돌계수(collisionFactor)를 설정하는 함수
     * @param {number} factor 충돌계수 (ex:2)
     */
    setCollisionFactor(factor: number): void;
    /**
     * UMapcontrol의 충돌계수(collisionFactor)를 반환하는 함수
     * @returns {number} 충돌계수 (ex:2)
     */
    getCollisionFactor(): number;
    editedMesh(mesh: any, editedEvent: any): void;
    /**
     * 사용자가 선택(클릭)한 USpotLight 반환하는 함수
     * @param {import('@U3dMouseEvent').U3dMouseEvent | MouseEvent} e 사용자 이벤트 (click, mouseover 등)
     * @returns {import('@USpotLight').USpotLight | undefined} 사용자가 선택한 USpotLight. 선택된 광원이 없으면 `undefined`
     *
     * @example
     * app.on('click', (e) => {
     *     const light = app.getLightdIsSelected(e);
     *     if (light) console.log(light.getId());
     * });
     */
    getLightdIsSelected(e: U3dMouseEvent | MouseEvent): USpotLight | undefined;
    /**
     * 사용자가 선택(클릭)한 U3dView를 반환하는 함수
     * @param {import('@U3dMouseEvent').U3dMouseEvent | MouseEvent} e 사용자 이벤트 (click, mouseover 등)
     * @returns {import('@union3d/view/U3dView').U3dView | undefined} 사용자가 선택한 U3dView. 선택된 뷰가 없으면 `undefined`
     *
     * @example
     * app.on('click', (e) => {
     *     const view = app.getViewIsSelected(e);
     *     if (view) console.log(view.getId());
     * });
     */
    getViewIsSelected(e: U3dMouseEvent | MouseEvent): U3dView | undefined;
    /**
     * 각도 값을 라디안 값으로 변환합니다.
     *
     * @param {Degree} degree 각도 값
     * @returns {Radian | undefined} 변환된 라디안 값
     *
     * @example
     * const radian = app.setDegreeToRadian(180);
     */
    setDegreeToRadian(degree: Degree): Radian | undefined;
    /**
     * 라디안 값을 각도 값으로 변환합니다.
     *
     * @param {Radian} radian 라디안 값
     * @returns {Degree | undefined} 변환된 각도 값
     *
     * @example
     * const degree = app.setRadianToDegree(Math.PI);
     */
    setRadianToDegree(radian: Radian): Degree | undefined;
    /**
     * 지면 그림자 출력 레벨를 리턴하는 함수
     * @returns {number} 지면 그림자 출력 레벨 (기본값 13)
     */
    getTerrainShadowLevel(): number;
    /**
     * 지면 그림자 출력 레벨을 설정하는 함수
     * @param {number} [terrainShadowLevel=13] 지면 그림자 출력 레벨 설정 값
     */
    setTerrainShadowLevel(terrainShadowLevel?: number): void;
    /**
     * 향상된 지면처리 여부를 반환하는 함수
     * @returns {string} 향상된 지면처리 여부
     */
    getImproveLevel(): string;
    /**
     * 현재 지면 처리 품질 단계를 반환합니다.
     *
     * @returns {number} 품질 단계 값 (none `0`, low `1`, medium `2`, high `3`, ultra `4`)
     *
     * @example
     * app.setImproveValue('high');
     * const level = app.getImproveValue(); // 3
     */
    getImproveValue(): number;
    /**
     * 지면 처리 품질 단계를 설정합니다.
     *
     * @param {string} value 품질 단계 이름
     *
     * @example
     * app.setImproveValue('high');
     */
    setImproveValue(value: string): void;
    #private;
}

export type { TargetRectOption, U3d3DFModelLayerCO, U3dApp, U3dAppCO, U3dAppPropertyMap, U3dAppRoundRobinState, U3dAppTweenHandle, U3dAppWindowRect, U3dEmapLayerCO, U3dEmapLayerCO_Content, U3dEmapSatLayerCO, U3dEmapSatLayerCO_Content, U3dLayerCommonCO, U3dModelGroupLayerCO, U3dTMSImageLayerCO, U3dTMSImageLayerCO_Content, U3dTdsModelLayerCO, U3dWFSModelLayerCO, U3dWMSImageLayerCO, U3dWMTSLayerCO, U3dWMTSLayerCO_Content };
