import {setGlobalFunction} from '@union3d/app/TPImporter';
import * as THREE from 'three';
import {defined} from '@union3d/util/defined';
import {defaultValue} from '@union3d/util/defaultValue';
import {UDrawArg} from '@union3d/core/UDrawArg';
import {UCamera} from '@union3d/core/UCamera.js';
import {UOrthographicCamera} from '@union3d/core/UOrthographicCamera';
import {UScene} from '@union3d/core/UScene';
import {URenderer} from '@union3d/core/URenderer';
import {UDEF} from '@union3d/core/UDEF';
import {UMesh} from '@union3d/core/mesh/UMesh';
import {UFrustum} from '@union3d/core/UFrustum';
import {UGroup} from '@union3d/core/UGroup';
import {U3dObject} from '@union3d/core/U3dObject.js';
import {UCollapse} from '@union3d/core/UCollapse';
import {URaycaster} from '@union3d/core/URaycaster';
import {UGridHelper} from '@union3d/core/UGridHelper';
import {UFrustumHelper} from '@union3d/helpers/UFrustumHelper.js';
import {UFrustumTerrainProjectionHelper} from '@union3d/helpers/UFrustumTerrainProjectionHelper';
import {U3dOverviewMap} from '@union3d/core/U3dOverviewMap';
import {U3dQuadTile} from '@union3d/quadtree/U3dQuadTile';
import {U3dQuadSet} from '@union3d/quadtree/U3dQuadSet';
import {UMathEngine} from '@union3d/math/UMathEngine';
import {UGeoRect} from '@union3d/math/UGeoRect';
import {U3dLayerList} from '@union3d/3dLayer/U3dLayerList';
import {U3dImageXYZLayer} from '@union3d/3dLayer/U3dImageXYZLayer';
import {U3dImagePBFLayer} from '@union3d/3dLayer/U3dImagePBFLayer';
import {U3dVideoLayer} from '@union3d/3dLayer/U3dVideoLayer';
import {U3dModelTdsLayer} from '@union3d/3dLayer/U3dModelTdsLayer';
import {U3dImageWMSLayer} from '@union3d/3dLayer/U3dImageWMSLayer';
import {U3dImageWMTSLayer} from '@union3d/3dLayer/U3dImageWMTSLayer';
import {U3dLayer} from '@union3d/3dLayer/U3dLayer';
import {U3dHeightLayer} from '@union3d/3dLayer/U3dHeightLayer';
import {U3dHeightXYZLayer} from '@union3d/3dLayer/U3dHeightXYZLayer';
import {U3dModelTilesLayer} from '@union3d/3dLayer/U3dModelTilesLayer';
import {U3dShaderMeasureLayer} from '@union3d/3dLayer/U3dShaderMeasureLayer';
import {U3dOpenLayer} from '@union3d/3dLayer/U3dOpenLayer';
import {U3dModelU3FLayer} from '@union3d/3dLayer/U3dModelU3FLayer';
import {U3dModelI3FLayer} from '@union3d/3dLayer/U3dModelI3FLayer';
import {U3dGroupLayer} from '@union3d/3dLayer/U3dGroupLayer';
import {U3dModelBasicLayer} from '@union3d/3dLayer/U3dModelBasicLayer';
import {U3dModelStaticLayer} from '@union3d/3dLayer/U3dModelStaticLayer';
import {U3dMultipleComponentLayer} from '@union3d/3dLayer/U3dMultipleComponentLayer';
import {U3dModelBIMObjLayer} from '@union3d/3dLayer/U3dModelBIMObjLayer';
import {U3dModelWFSLayer} from '@union3d/3dLayer/U3dModelWFSLayer';
import {U3dTerrainLayer} from '@union3d/3dLayer/U3dTerrainLayer';
import {U3dImageLayer} from '@union3d/3dLayer/U3dImageLayer';
import {U3dGridTileLayer} from '@union3d/3dLayer/U3dGridTileLayer';
import {U3dAppEventHandler} from '@union3d/event/U3dAppEventHandler';
import {U3dBilboard} from '@union3d/geometry/U3dBilboard';
import {UPlaneBufferGeometry} from '@union3d/geometry/UPlaneBufferGeometry';
import {U3dPOI} from '@union3d/geometry/U3dPOI';
import {TWEEN} from '@union3d/lib/Tween';
import {UFlyControls} from '@union3d/mode/UFlyControls';
import {UWalkControls} from '@union3d/mode/UWalkControls';
import {UMapControls} from '@union3d/mode/UMapControls';
import {UPointerLockControls} from '@union3d/mode/UPointerLockControls';
import {UCharacterControls} from '@union3d/mode/UCharacterControls';
import {UPointerLockDriveControls} from '@union3d/mode/UPointerLockDriveControls';
import {UOrbitAndPanControls} from '@union3d/mode/UOrbitAndPanControls';
import {U3dStats} from '@union3d/core/U3dStats';
import {UCameraState} from '@union3d/core/UCameraState';
import {U3dEvent} from '@union3d/event/U3dEvent';
import {UHighLightControl} from '@union3d/core/UHighLightControl';
import {UAppCommand} from '@union3d/cmd/UAppCommand';
import {U3dOverlay} from '@union3d/overlay/U3dOverlay';
import {UAnimationController} from '@union3d/analy/UAnimationController';
import {__GError__, __GInfo__, __GSError__, __GWarn__, U3dMessage} from '@union3d/message/U3dMessage';
import {ULensFlare} from '@union3d/effect/ULensFlare';
import {UParticleEngine} from '@union3d/effect/UParticleEngine';
import {UProcessManager} from '@union3d/manager/UProcessManager';
import {UShaderTerrainDecalManager} from '@union3d/manager/terrain/UShaderTerrainDecalManager';
import {U3dView} from '@union3d/view/U3dView';
import {DEFAULT_ENV_INTENSITY, ULight} from '@union3d/env/ULight';
import {USunCalc} from '@union3d/env/USunCalc';
import {USky} from '@union3d/env/USky';
import {U3dCloud} from '@union3d/env/U3dCloud';
import {VolumetricFire} from '@union3d/env/VolumetricFire';
import {UUnderground} from '@union3d/env/UUnderground';
import {UPointLockFlyControls} from '@union3d/mode/UPointLockFlyControls';
import {deferred} from '@union3d/util/deferred';
import {captureDomLayer} from '@union3d/util/captureDomLayer';
import {UBox3} from '@union3d/core/UBox3';
import {acceleratedRaycast, computeBoundsTree, disposeBoundsTree} from '@union3d/lib/meshBVH/src/index';
import {UBufferGeometry} from '@union3d/core/geometry/UBufferGeometry';
import {UFog} from '@union3d/effect/UFog';
import {UDeviceOption} from '@union3d/core/UDeviceOption';
import {UAnimationManager} from '@union3d/analy/UAnimationManager';
import {U3dPatternXYZLayer} from '@union3d/3dLayer/U3dPatternXYZLayer';
import {UIndexManager} from '@union3d/manager/UIndexManager';
import {UHeightSkirt1_0} from '@union3d/core/height/Skirt1_0/UHeightSkirt1_0';
import {UTestManager} from "/union3d/manager/UTestManager.ts";
import {CONTROL_TYPE, DEFAULT_CONTROL_FACTOR} from "@union3d/mode/UMapControlBase.js";
import {isWrong} from "@util/isWrong.js";
import {U3dOverlayManager} from "@union3d/overlay/U3dOverlayManager.js";
import {UTimer} from "@union3d/core/UTimer.js";
import {isVector3Like} from "@util/isVectorLike.js";
import {DEFAULT_MAX_SUN_INTENSITY} from "@union3d/env/USunLight.js";
import {UMixerManager} from "@union3d/manager/UMixerManager.js";
import {UDevToolView} from '@union3d/app/UDevToolView.js';
import {INTERNAL} from '@union3d/app/U3dApp.internal';

function makeName() {
    if(UDEF.appNameCount === undefined)
        UDEF.appNameCount  = 1;
    return uuid + UDEF.appNameCount++;
}

const DEFAULT_WORLD_SIZE = Math.round(UDEF.GoogleCoordWidth / 5);
const DEFAULT_WORLD_INDEX = {x: 27, y: 19, level: 5};
const DEFAULT_MIN_ZOOM_LEVEL = 6;
/** 줌 버튼 한 번에 적용할 카메라 거리 배율이며 0.5는 zoom 한 단계(거리 절반 또는 2배)에 해당한다 */
const ZOOM_BUTTON_SCALE = 0.5;

const ol = (/** @type {any} */ (globalThis)).__GEONDT__.ol;
const RAYCASTER = new URaycaster();
const VECTOR_TO_GROUND = new THREE.Vector3(0, 0, -1);
const uuid = 'U3dApp_';
const MAX_PLANE_HEIGHT = 3000;
const clock2 = new UTimer(document);
const g_lat = 37.53189615862187;
const g_lon = 126.91415231094318;
const intersectOriginVec = new THREE.Vector3();
const projectionVec = new THREE.Vector3();
const DEFAULT_RESOLUTION = 1000;
/** 2D/3D 지도 모드 전환 단계별 애니메이션 시간(ms) */
const MODE_CHANGE_DURATION = 500;
/** 2D 지도 모드(TopView)의 고도각(degree) */
const MODE_2D_POLAR_DEGREE = 0;
/** 2D 지도 모드(정북)의 방위각(degree) */
const MODE_2D_AZIMUTH_DEGREE = 0;
/** 3D 지도 모드의 기본 고도각(degree) */
const MODE_3D_POLAR_DEGREE = 60;
/** 2D 지도 모드 고정에 사용하는 고도각(radian) */
const MODE_2D_POLAR_RADIAN = 0;
/** 2D 지도 모드 고정에 사용하는 방위각(radian) */
const MODE_2D_AZIMUTH_RADIAN = 0;
/** 지도 모드 식별자 */
const VIEW_MODE = {
    TWO_D: '2d',
    THREE_D: '3d'
};
const CAMERA_STATE_TYPE = {
    GEOGRAPHIC: 'GEOGRAPHIC',
    WORLD: 'WORLD'
}
const WORLD_SIZE = UDEF.HALF_WORLD * 2;

/**
 * 특정 지역 타일 Rectangle 옵션
 * @typedef {object} TargetRectOption
 * @property {number} x 특정지역 구글맵 인덱스 x 값
 * @property {number} y 특정지역 구글맵 인덱스 y 값
 * @property {number} z 특정지역 구글맵 인덱스 level 값
 */

/**
 * Emap 계열 레이어를 만들 때 사용하는 공통 옵션
 * @typedef {object} U3dEmapLayerCO_Content
 * @property {string} [name] 레이어 이름
 * @property {string} [baseurl] WMTS 또는 템플릿 주소
 * @property {string} [url] 직접 지정한 서비스 주소
 * @property {string} [layername] 서비스 레이어 이름
 * @property {string} [ext] 요청 포맷 확장자
 * @property {string} [apikey] 서비스 API 키
 * @property {boolean} [useProxy=false] 프록시 사용 여부
 * @property {string} [proxy='proxy.jsp?url='] 프록시 주소
 * @property {import('@UDrawArg.js').UDrawArg} [drawarg] 드로잉 인자
 * @property {Array<number>} [geoextent] 서비스 적용 범위
 * @property {string} [matrixsetname] WMTS 매트릭스셋 이름
 * @property {string} [stylename] 서비스 스타일 이름
 * @property {string | number} [ekind] EMap 종류
 * @property {string} [xyorder] 좌표 순서
 *
 * @memberof U3dApp
 * @inner
 *
 * @typedef {Omit<U3dOpenLayerCO, never> & U3dEmapLayerCO_Content} U3dEmapLayerCO
 */

/**
 * Emap 위성(SAT) 레이어 생성용 옵션
 * @typedef {object} U3dEmapSatLayerCO_Content
 * @property {string} [layername='AIRPHOTO'] 위성 서비스 레이어 이름
 * @property {string} [ext='image/jpg'] 이미지 포맷
 * @property {string} [apikey] 서비스 API 키
 * @property {boolean} [useProxy=false] 프록시 사용 여부
 * @property {string} [proxy='proxy.jsp?url='] 프록시 주소
 * @property {import('@UDrawArg.js').UDrawArg} [drawarg] 드로잉 인자
 * @property {Array<number>} [geoextent] 서비스 적용 범위
 * @property {string} [matrixsetname='NGIS_AIR'] WMTS 매트릭스셋 이름
 * @property {string} [stylename=''] 서비스 스타일 이름
 * @property {string | number} [ekind] EMap 종류
 *
 * @memberof U3dApp
 * @inner
 *
 * @typedef {Omit<U3dEmapLayerCO, never> & U3dEmapSatLayerCO_Content} U3dEmapSatLayerCO
 */

/**
 * WMTS 레이어 생성용 공통 옵션
 * @typedef {object} U3dWMTSLayerCO_Content
 * @property {string} [name] 레이어 이름
 * @property {string} [url] WMTS 서비스 URL
 * @property {string} [baseurl] WMTS 기본 URL
 * @property {string} [layername] WMTS 레이어 이름
 * @property {string} [ext] 응답 포맷
 * @property {string} [srs] 좌표계
 * @property {object} [boundingbox] 서비스 경계 박스
 * @property {Array<number>} [geoextent] 지리 범위
 * @property {string} [matrixsetname] WMTS matrixSet 이름
 * @property {string} [stylename] WMTS 스타일 이름
 * @property {boolean} [useProxy=false] 프록시 사용 여부
 * @property {string} [proxy='proxy.jsp?url='] 프록시 주소
 * @property {import('@UDrawArg').UDrawArg} [drawarg] 드로잉 인자
 * @property {number} [maxlevel] 최대 줌 레벨
 * @property {Array<number>} [resolutions] WMTS 해상도 배열
 * @property {boolean} [needXml=false] capabilities XML 조회 여부
 * @property {string} [matrixSet] WMTS matrixSet 별칭 입력값
 * @property {string} [re] 내부 보정용 문자열
 *
 * @memberof U3dApp
 * @inner
 *
 * @typedef {Omit<U3dOpenLayerCO, never> & U3dWMTSLayerCO_Content} U3dWMTSLayerCO
 */

/**
 * TMS 레이어 생성용 옵션
 * @typedef {object} U3dTMSImageLayerCO_Content
 * @property {string} [name] 레이어 이름
 * @property {string} baseurl 타일 서비스 주소
 * @property {object} metadata TMS 메타데이터
 * @property {boolean} [useproxy=false] 프록시 사용 여부
 * @property {string} [proxyurl='./proxy.jsp?url='] 프록시 주소
 * @property {number} [minlevel] 최소 줌 레벨
 * @property {number} [maxlevel] 최대 줌 레벨
 * @property {import('@UDrawArg.js').UDrawArg} [drawarg] 드로잉 인자
 *
 * @memberof U3dApp
 * @inner
 *
 * @typedef {Omit<U3dOpenLayerCO, never> & U3dTMSImageLayerCO_Content} U3dTMSImageLayerCO
 */

/**
 * TMS 템플릿 생성 함수의 개별 인자
 * @typedef {object} U3dTempleteTMSImageLayerParam
 * @property {string} baseurl 타일 서비스 주소
 * @property {string} srs 좌표계
 * @property {'raster' | 'mercator'} profile 타일 프로필
 * @property {Array<number>} extent 범위
 * @property {number} tileSize 타일 크기
 * @property {Array<number>} matrixIds 매트릭스 ID 배열
 * @property {Array<number>} resolutions 해상도 배열
 * @property {string} ext 파일 확장자
 * @property {string | undefined} [proj] proj4 정의 문자열
 * @property {number} minZoom 최소 줌 레벨
 * @property {string} proxyurl 프록시 주소
 * @property {boolean} useproxy 프록시 사용 여부
 * @property {boolean} reverseY Y축 반전 여부
 * @property {string | undefined} [majorFolder] 폴더 구조 방식
 * @property {{ x: number, y: number } | undefined} [origin] 원점 좌표
 */

/**
 * 레이어 생성에 자주 쓰이는 공통 옵션
 * @typedef {object} U3dLayerCommonCO
 * @property {string} [name] 레이어 이름
 * @property {string} [url] 서비스 주소
 * @property {string} [baseurl] 서비스 기본 주소
 * @property {string} [layername] 서비스 레이어 이름
 * @property {string} [layernames] 복수 레이어 이름 문자열
 * @property {string} [ext] 이미지 확장자 또는 포맷
 * @property {boolean} [transparent] 투명 여부
 * @property {boolean} [reverseY] Y축 반전 여부
 * @property {boolean} [useproxy] 프록시 사용 여부
 * @property {string} [proxyurl] 프록시 주소
 * @property {import('@UDrawArg').UDrawArg} [drawarg] 드로우 인자
 * @property {number} [minlevel] 최소 줌/레벨
 * @property {number} [maxlevel] 최대 줌/레벨
 * @property {boolean} [needxml] capabilities XML 조회 필요 여부
 * @property {string} [xmlurl] XML 조회 주소
 * @property {object} [metadata] 메타데이터
 * @property {string} [animation] 애니메이션 이름
 */

/**
 * 3D 모델 그룹 레이어 생성 옵션
 * @typedef {U3dLayerCommonCO} U3dModelGroupLayerCO
 */

/**
 * U3F 3D 모델 레이어 생성 옵션
 * @typedef {object} U3d3DFModelLayerCO
 * @property {string} name 레이어 이름
 * @property {string} layername U3F 레이어 이름
 * @property {string} baseurl 모델 데이터 기본 주소
 * @property {string} basename U3G 파일 이름 또는 기본 모델 이름
 * @property {string} ext 모델 확장자
 * @property {string} grouplayer 그룹 레이어 이름
 * @property {string} renderorder 렌더 순서
 * @property {number} [minlevel] 최소 레벨
 * @property {number} [maxlevel] 최대 레벨
 * @property {boolean} [useproxy] 프록시 사용 여부
 * @property {boolean} [reverseY] Y축 반전 여부
 * @property {boolean} [usetexture] 텍스처 사용 여부
 * @property {string} [proxyurl] 프록시 주소
 * @property {number} [opacity] 모델 투명도
 * @property {number} [makeU3FPackage] U3F 패키지 생성 방식
 * @property {number} [isShareMaterial] 머티리얼 공유 여부
 * @property {boolean} [isTextureUpdate] 텍스처 갱신 여부
 * @property {number} [textureDistance] 텍스처 갱신 거리
 */

/**
 * TDS 모델 레이어 생성 옵션
 * @typedef {object} U3dTdsModelLayerCO
 * @property {string} name 레이어 이름
 * @property {string} baseurl 모델 기본 주소
 * @property {string} [type] 레이어 종류
 * @property {string} ext 모델 파일 확장자
 * @property {boolean} [drawline] 외곽선 표시 여부
 * @property {boolean} [needtexture] 텍스처 사용 여부
 * @property {boolean} [needxml] XML 사용 여부
 * @property {string} [xmlurl] XML 주소
 * @property {boolean} [useu3f] U3F 사용 여부
 * @property {string} [u3furl] U3F 주소
 * @property {Array<object>} [listmodel] 모델 목록
 * @property {import('three').Vector3Like} [position] 위치
 * @property {import('three').Vector3Like} [scale] 크기
 * @property {import('three').Euler | import('three').Vector3Like} [rotation] 회전
 */

/**
 * WMS 이미지 레이어 생성 옵션
 * @typedef {U3dLayerCommonCO} U3dWMSImageLayerCO
 */

/**
 * WFS 모델 레이어 생성 옵션
 * @typedef {U3dLayerCommonCO} U3dWFSModelLayerCO
 */

/**
 * U3dApp에서 공통으로 쓰는 런타임 보조 타입
 * @typedef {Record<string, *>} U3dAppPropertyMap
 *
 * 이동 애니메이션 핸들
 * @typedef {{ stop: Function }} U3dAppTweenHandle
 *
 * 뷰를 순환하며 조회할 때 사용하는 커서 상태
 * @typedef {object} U3dAppRoundRobinState
 * @property {number} cursor 현재 조회 시작 위치
 *
 * 생성자에서 설정되는 화면 영역 정보
 * @typedef {object} U3dAppWindowRect
 * @property {number} left 왼쪽 시작 위치
 * @property {number} top 위쪽 시작 위치
 * @property {number} width 영역 너비
 * @property {number} height 영역 높이
 */

/**
 * 생성자에서 설정되는 카메라/뷰 관련 상태
 * @typedef {object} U3dAppCameraRuntimeState
 * @property {number} viewportRatio 뷰포트 비율
 * @property {number} fov 카메라 시야각
 * @property {number} near 근거리 클리핑 값
 * @property {number} far 원거리 클리핑 값
 * @property {'perspective' | 'orthographic'} cameraType 카메라 타입
 * @property {import('three').Vector3} homePosition 초기 카메라 위치
 * @property {number} homeRotateLeft 초기 좌우 회전값
 * @property {number} homeRotateDown 초기 상하 회전값
 * @property {number} resolution 현재 해상도
 * @property {number} zoomLevel 현재 줌 레벨
 * @property {number} minZoomLevel 최소 줌 레벨
 * @property {number} maxZoomLevel 최대 줌 레벨
 * @property {number} modelImageDistance 모델 이미지 거리 기준
 * @property {number} modelImageDefaultLevel 모델 이미지 기본 레벨
 * @property {number} modelUpdateOffset 모델 갱신 오프셋
 */

/**
 * 생성자에서 설정되는 렌더/표시 옵션
 * @typedef {object} U3dAppRenderRuntimeState
 * @property {boolean} autoClear 자동 클리어 여부
 * @property {boolean} logarithmicDepthBuffer 로그 깊이 버퍼 사용 여부
 * @property {boolean} preserveDrawingBuffer 드로잉 버퍼 보존 여부
 * @property {number} improveTexture 텍스처 보정 단계
 * @property {number} toneExposure 톤 노출값
 * @property {boolean} useSky 하늘 사용 여부
 * @property {boolean} useFog 안개 사용 여부
 * @property {ColorLike | import('three').Vector3} fogColor 안개 색상
 * @property {string} backgroundColor 배경색
 * @property {boolean} useSunFlare 태양 플레어 사용 여부
 * @property {boolean} useCloud 구름 사용 여부
 * @property {boolean} useShadowMap 그림자 사용 여부
 * @property {boolean} autoMove 비행 모드 자동 이동 여부
 * @property {boolean} useAutoSpeed 거리 기반 속도 자동 조절 여부
 * @property {boolean} frameOptimize 프레임 최적화 여부
 * @property {number} ratioTileSize 이미지 타일 크기 비율
 * @property {number} ratioModelTileSize 모델 타일 크기 비율
 */

/**
 * 생성자에서 설정되는 레이어/목록 상태
 * @typedef {object} U3dAppCollectionRuntimeState
 * @property {Array<*>} overlayList 오버레이 목록
 * @property {Array<*>} viewList 카메라 뷰 목록
 * @property {Array<*>} viewLightList 광원 뷰 목록
 * @property {Array<*>} lightList 광원 목록
 * @property {Array<*>} poiList POI 목록
 * @property {Array<*>} objectList 객체 목록
 * @property {Map<string, *>} editHeightBoxList 높이 편집 박스 목록
 * @property {Array<*>} listQuadtreeSet 쿼드트리 셋 목록
 * @property {Array<*>} particles 파티클 목록
 * @property {Array<*>} fires 불 효과 목록
 * @property {Array<*>} analysisList 분석 객체 목록
 * @property {Array<*>} clippingPlanes 클리핑 평면 목록
 */

/**
 * 생성자에서 설정되는 지형/지하 모드 상태
 * @typedef {object} U3dAppUndergroundRuntimeState
 * @property {number} undergroundDepth 지하 깊이
 * @property {number} undergroundColor 지하 색상
 * @property {number} undergroundOpacity 지하 투명도
 * @property {boolean} undergroundGrid 지하 격자 사용 여부
 * @property {number} undergroundGridDivide 지하 격자 분할 수
 * @property {boolean} undergroundSetTexture 지하 텍스처 사용 여부
 * @property {boolean} undergroundEdge 지하 엣지 사용 여부
 * @property {number} undergroundEdgeThickness 지하 엣지 두께
 * @property {boolean} undergroundFog 지하 안개 사용 여부
 * @property {number} undergroundFogDensity 지하 안개 밀도
 * @property {number} undergroundFogStartHeight 지하 안개 시작 높이
 * @property {number} undergroundFogEndHeight 지하 안개 종료 높이
 * @property {import('three').Vector3} undergroundFogColor 지하 안개 색상
 */

/**
 * 생성자에서 설정되는 실행/제어 상태
 * @typedef {object} U3dAppRuntimeState
 * @property {boolean} initialized 초기화 완료 여부
 * @property {boolean} stopModel 모델 처리 중지 여부
 * @property {boolean} stopUpdate 업데이트 중지 여부
 * @property {boolean} stopRender 렌더링 중지 여부
 * @property {number} maxProcess 최대 프로세스 수
 * @property {number} maxDistanceModel 모델 거리 제한
 * @property {boolean} wireFrameRendering 와이어프레임 렌더링 여부
 * @property {string} nameBaseLayer 기본 베이스 레이어 이름
 * @property {string} containerName 컨테이너 DOM id
 * @property {HTMLElement} container 컨테이너 엘리먼트
 * @property {string} name 앱 이름
 * @property {number} sizeWorld 월드 크기
 * @property {number} minlevel 최소 쿼드레벨
 * @property {number} maxlevel 최대 쿼드레벨
 */

/**
 * U3dApp을 생성할 때 전달하는 초기 설정 옵션입니다.<br>
 * 지도를 그려 넣을 화면 영역, 홈 위치와 카메라 시점, 화면 품질과 성능, 타일·레이어 처리 기준을 한 번에 지정합니다.<br>
 * containername을 제외한 모든 속성은 생략할 수 있으며, 생략하면 각 항목에 적힌 기본값이 적용됩니다.<br>
 * 기본값이 `기기 성능에 따라 결정`이라고 적힌 속성은 실행 기기의 성능 점수에 따라 값이 달라집니다.<br>
 * 생성한 뒤에 값을 바꾸려면 각 항목에 대응하는 U3dApp의 설정 함수를 사용하십시오.
 *
 * @typedef {object} U3dAppCO
 *
 * @property {string} containername 지도 화면을 그려 넣을 div 엘리먼트의 id
 * @property {string | undefined} [type=undefined] 출력 지도의 타입. 입력하지 않으면 한반도 범위 지도만 출력하고, 'world'를 입력하면,전세계 범위로 확장하여 지도를 출력합니다.
 * @property {string} [name] 여러 U3dApp을 구분하기 위한 이름입니다.<br>
 * 생략하면 'U3dApp_'에 생성 순번을 붙인 이름이 자동으로 지정됩니다.
 * @property {string} [idoverview] 인덱스맵(overview, 현재 보는 곳을 넓은 범위에서 보여 주는 보조 2D 지도)을 그려 넣을 div 엘리먼트의 id입니다.<br>
 * 값을 입력하면 앱을 만들 때 그 영역에 인덱스맵이 함께 생성되고, 생략하면 인덱스맵을 만들지 않습니다.
 * @property {boolean} [camTargetType=true] 인덱스맵의 중심을 맞추는 기준입니다.<br>
 * true이면 카메라가 바라보는 지점을, false이면 카메라가 있는 위치를 인덱스맵의 중심으로 사용합니다.
 * @property {GeoPosition} [homePosition] 홈 위치이며 위경도 좌표계(EPSG:4326)로 입력합니다.<br>
 * x는 경도, y는 위도, z는 고도(m)이며 기본값은 { x: 0, y: 0, z: 0 }입니다.<br>
 * 앱을 만들 때 이 위치로 이동하지는 않으며, updateHomePosition()을 호출하면 카메라가 이 위치로 이동합니다.
 * @property {Degree} [homeRotateLeft=0] 홈 위치로 이동할 때 적용할 방위각이며 0은 북쪽을 바라보는 방향
 * @property {Degree} [homeRotateDown=0] 홈 위치로 이동할 때 적용할 고도각이며 0은 지면을 수직으로 내려다보는 방향
 * @property {'perspective' | 'orthographic'} [cameraType='perspective'] 카메라 투영 방식입니다.<br>
 * `perspective`는 멀리 있는 것이 작게 보이는 원근 투영, `orthographic`은 거리와 무관하게 크기가 유지되는 평행 투영입니다.
 *
 * @property {number} [maxprocess] 한 프레임에서 처리할 작업 개수의 상한입니다.<br>
 * 값을 키우면 데이터가 빨리 채워지는 대신 프레임이 끊길 수 있으며, 기본값은 기기 성능에 따라 결정됩니다.
 * @property {boolean} [frameOptimize=true] 화면 상태에 맞춰 한 프레임의 작업량을 자동으로 조절할지 여부
 * @property {boolean} [autoClear=true] 화면 조작이 멈춘 유휴 상태에서 사용하지 않는 리소스와 메모리를 자동으로 정리할지 여부
 * @property {number} [ratiotilesize=1.0] 이미지·고도 타일 한 장에 사용할 해상도 비율이며 값이 작을수록 타일이 흐려지고 가벼워짐
 * @property {number} [ratiomodeltilesize=1.0] 모델 검색 타일 한 장에 사용할 해상도 비율이며 값이 작을수록 모델을 성기게 검색함
 * @property {'boundingbox' | 'sphere'} [searchtype='sphere'] 카메라 시점 주변에서 그릴 타일을 찾는 범위의 모양입니다.<br>
 * `sphere`는 구, `boundingbox`는 직육면체 범위로 검색합니다.
 * @property {'raw' | 'base' | '1_0'} [methodheight='raw'] 지형 고도 데이터를 해석하고 타일 경계의 틈을 메우는 스커트를 만드는 방식
 *
 * @property {number} [fov=50] 카메라 프러스텀(frustum, 화면에 보이는 원뿔 모양 영역)의 세로 시야각이며 도 단위
 * @property {boolean} [usesky=true] 하늘을 생성할지 여부
 * @property {string} [backgroundcolor='rgb(200, 200, 200)'] 지도 화면의 배경색이며 RGB 또는 HEX 문자열
 * @property {boolean} [useFog=true] 먼 거리를 흐리게 보이도록 안개 효과를 적용할지 여부
 * @property {boolean} [useCloud=true] 하늘에 구름 효과를 적용할지 여부
 * @property {boolean} [useSunFlare] 태양을 바라볼 때 나타나는 빛 번짐(플레어) 효과를 적용할지 여부이며, 기본값은 기기 성능에 따라 결정
 * @property {boolean} [useShadowMap=true] 그림자를 그릴지 여부
 * @property {number} [intensitylight=1.1] 장면 전체를 밝히는 환경 광원의 세기
 * @property {number} [toneExposure=1.2] 최종 화면의 노출 밝기이며 값이 클수록 화면이 밝아짐
 * @property {'none' | 'low' | 'medium' | 'high'} [improveTexture] 지면 텍스처 품질 보정 단계이며, 단계가 올라갈수록 선명해지고 연산량이 늘어납니다.<br>
 * 기본값은 기기 성능에 따라 결정됩니다.
 * @property {'SD' | 'HD' | 'FHD' | 'QHD' | 'UHD' | Array<number>} [pixelResolution] 렌더링에 사용할 해상도이며 사전 정의된 이름 또는 [가로, 세로] 픽셀 배열로 입력합니다.<br>
 * 예: 'FHD' 또는 [1122, 840]이며, 기본값은 기기 성능에 따라 결정됩니다.
 * @property {number} [pixelRatio=1.0] 해상도에 곱해지는 픽셀 밀도 배율이며 값이 클수록 선명해지고 연산량이 늘어남
 * @property {boolean} [usePostProcess] 렌더링 결과에 후처리 효과를 적용할지 여부이며, 기본값은 기기 성능에 따라 결정
 * @property {PostProcessParam} [postOption] 후처리 효과의 세부 설정이며 생략하면 각 효과의 기본 설정 사용
 *
 * @property {number} [maxlevel=19] 지형을 나누는 쿼드타일의 최대 분할 레벨이며 값이 클수록 가까이에서 더 세밀하게 표현됨
 * @property {number} [near=1] 카메라 프러스텀에서 가장 가까운 평면까지의 거리이며 미터 단위
 * @property {number} [far=4007502] 카메라 프러스텀에서 가장 먼 평면까지의 거리이며 미터 단위이고 기본값은 월드 영역 크기
 * @property {TargetRectOption} [targetrectopt] 앱이 다룰 영역을 특정 타일 하나로 한정할 때 사용하는 타일 인덱스 옵션이며 생략하면 전체 영역 사용
 * @property {boolean} [skirt=true] 타일 경계에 생기는 틈을 가리는 스커트를 생성할지 여부
 * @property {number} [passlevel] 데이터를 불러오고 그리기 시작하는 최소 타일 레벨이며, 이보다 낮은 레벨의 타일은 화면에 나타나지 않습니다.<br>
 * 생략하면 레벨 제한을 두지 않습니다.
 *
 * @property {boolean} [useimageopacity=false] 모든 이미지 레이어에 공통 투명도를 적용할지 여부
 * @property {number} [imageopacity=1] 모든 이미지 레이어에 적용할 투명도이며 0은 완전 투명, 1은 불투명
 * @property {boolean} [usemodelopacity=false] 모든 모델 레이어에 공통 투명도를 적용할지 여부
 * @property {number} [modelopacity=1] 모든 모델 레이어에 적용할 투명도이며 0은 완전 투명, 1은 불투명
 * @property {number} [modelimagedistance=800] 모델 텍스처 해상도를 거리로 나누는 기준 거리이며 미터 단위입니다.<br>
 * 카메라가 이 거리 안에 있으면 가까울수록 높은 해상도의 텍스처를 사용하고, 이 거리보다 멀면 modelimagedefaultlevel의 해상도를 사용합니다.
 * @property {number} [modelimagedefaultlevel=0] modelimagedistance보다 멀리 있는 모델에 적용할 텍스처 해상도 레벨이며 0이 가장 낮은 해상도
 *
 * @property {number} [viewportratio=1] 카메라 종횡비(화면 가로 길이를 세로 길이로 나눈 값)에 곱하는 보정 배율이며 1은 컨테이너 비율을 그대로 사용
 * @property {number} [zoomLevel=10] 지도 확대 단계를 세는 Zoom 레벨의 시작값입니다.<br>
 * zoomIn()과 zoomOut()이 이 값을 1씩 올리거나 내려 화면을 확대·축소합니다.
 * @property {number} [minZoomLevel=6] zoomOut()으로 내려갈 수 있는 Zoom 레벨의 하한
 * @property {number} [maxZoomLevel=19] zoomIn()으로 올라갈 수 있는 Zoom 레벨의 상한
 * @property {boolean} [useautospeed=true] 지면과 카메라 사이의 거리에 따라 확대·이동·회전 속도를 자동으로 조절할지 여부
 * @property {boolean} [auto=true] 앱을 만들면서 렌더러·카메라·컨트롤·광원·하늘을 자동으로 생성하고 렌더링을 시작할지 여부입니다.<br>
 * false로 지정하면 필요한 구성 요소를 직접 생성한 뒤 start()를 호출하십시오.
 * @property {boolean} [automove=false] 비행 모드에서 지정한 경로를 따라 카메라가 자동으로 이동할지 여부
 * @property {boolean} [stoprender=false] 앱을 만든 직후 화면 그리기를 멈춘 상태로 둘지 여부
 *
 * @property {boolean} [undergroundFog=false] 지하 모드에서 안개 효과를 적용할지 여부
 * @property {number} [undergroundFogDensity=0.005] 지하 안개의 밀도이며 값이 클수록 시야가 빨리 흐려짐
 * @property {number} [undergroundFogStartHeight=0] 지하 안개가 시작되는 높이이며 미터 단위
 * @property {number} [undergroundFogEndHeight=-5000] 지하 안개가 가장 짙어지는 높이이며 미터 단위
 * @property {import('three').Vector3} [undergroundFogColor] 지하 안개 색상이며 x·y·z를 각각 0 이상 1 이하의 R·G·B 값으로 입력합니다.<br>
 * 기본값은 { x: 0.034, y: 0.034, z: 0.034 }입니다.
 */

/** @type {U3dAppEMI} */
export const U3dAppEMD = {
    ...U3dAppEventHandler.EVENT,
    LAYER_CREATE: 'layer-create'
}

/** @type {U3dApp_Analysis} */
export const U3dAppAnalysis = {
    AREA: 'Area',
    DISTANCE: 'Distance',
    HEIGHT: 'Height',
    CONTOUR: 'Contour',
    LAND_SCAPE: 'LandScape',
    SURFACE_VOLUME: 'SurfaceVolume',
    SLOPE: 'Slope',
    OBJECT_INFO: 'ObjectInfo',
    GIZMO_MODEL: 'GizmoModel',
    ALIGN_MODEL: 'AlignModel',
    MULTIPLE_COMPONENT: 'multipleComponent',
    ROAD: 'Road',
    CUSTOM_MODEL: 'CustomModel',
    SLOPE_ASPECT: 'SlopeAspect',
    CUSTOM_LAND: 'CustomLand',
    ROUTE: 'Route',
    AVERAGE_HEIGHT: 'AverageHeight',
    HEIGHT_LIMIT: 'HeightLimit',
    VIEW_CONE: 'ViewCone',
    CLIPPING: 'Clipping',
    ALARM: 'Alarm',
    DEPTH: 'Depth',
    SECTION: 'Section',
    PARTICLE: 'Particle',
    SUN_AMOUNT: 'SunAmount',
    PHYSICAL_FLOW: 'PhysicalFlow',
    SKY_LINE: 'SkyLine',
}

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
class U3dApp extends U3dObject {
    /** @type {U3dAppEMI} */ static EVENT = U3dAppEMD;
    /** @type {U3dApp_Analysis} */ static ANALYSIS = U3dAppAnalysis;

    /** @type {import('@union3d/core/UCamera').UCamera | undefined} */ _camera;

    // 쿼드트리가 없거나 다시 생성되는 동안에도 앱에서 설정한 민감도를 유지합니다.
    /** @type {number} */
    #tileUpdateSensitivity = 1;

    // 페이지를 닫을 때 앱을 정리하는 beforeunload 리스너입니다. dispose()에서 떼어 내야 하므로 함수를 보관합니다.
    /** @type {(() => void) | undefined} */
    #beforeUnloadHandler;

    /** @type {U3dAppFrameState} */
    #frame = {
        updateFps: 10,
        updateFrameUnit: Math.floor(1000 / 10),
        updateFrameTime: 0,

        updateWorkFps: 120,
        updateWorkFrameUnit: Math.floor(1000 / 120),
        updateWorkFrameTime: 0,

        updateLayerFps: 60,
        updateLayerFrameUnit: Math.floor(1000 / 60),
        updateLayerFrameTime: 0,

        updateShadowFrameTime: 0,
        updateShadowLayerCurser: 0,

        drawMaxFps: 60,
        drawFps: 60,
        drawFrameUnit: Math.floor((1000 / 60)),
        drawFrameTime: 0,

        drawReadyFrame: 0,
        drawReadyList: [],

        drawIdleFps: 5,
        drawIdleFrameUnit: Math.floor((1000 / 5)),
        drawIdleSpeed: UDEF.IDLE_DRAW_SPEED.DEFAULT,
        drawIdleFrameCount: 15,
        drawIdleFrame: 0,
        isIdleDraw: false,

        tweenFps: 30,
        tweenFrameUnit: Math.floor(1000 / 30),
        tweenFrameTime: 0,
    }
    /** @type {{ segVertex: number, vertexlevel: number }} */
    #world = {
        segVertex: UDEF.TILE_SEG,
        vertexlevel: 1
    }
    /** @type {U3dAppDrawState} */
    #draw = {
        pixelResolution: UDEF.PIXEL_RESOLUTION.QHD,
        pixelRatio: UDEF.DEFAULT_PIXEL_RATIO,
        callbackRenderAfter: new Map(),
        callbackRenderBefore: new Map(),
        renderGroup: undefined,
        externalScene: undefined,
        commentRenderGroup: undefined,
        enableSwipe: false,
        nameSwipeLayers: new Map()
    }
    /** @type {U3dAppUpdateState} */
    #update = {
        callbackUpdateBefore: new Map()
    }
    /** @type {U3dAppPostProcessState} */
    #postProcess = {
        usePostProcess: undefined,
        postOption: undefined
    }
    /** @type {U3dAppProcessState} */
    #process = {
        appCommand: undefined,
        executeCommandList: undefined,
        executeMainCommandList: undefined
    }
    /** @type {U3dAppOverviewState} */
    #overview = {
        camTargetType: true,
        idoverview: undefined
    }
    /** @type {U3dAppEnvState} */
    #env = {
        intensityLight: DEFAULT_ENV_INTENSITY,
        intensitySunLight: DEFAULT_MAX_SUN_INTENSITY,
        sky: undefined,
        light: undefined
    }
    /** @type {U3dAppManagerState} */
    #manager = {
        indexManager: undefined,
        processManager: undefined,
        testManager: undefined
    }
    /** @type {U3dAppCameraStateStore} */
    #cameraState = {
        savedInfo: undefined
    }
    /** @type {U3dAppDebugState} */
    #debug = {
        canvasLoading: undefined,
        canvasLoadingContext: undefined,
        canvasLoadingVisible: false,
        canvasLoadingColor: "rgba(7,85,156,0.7)",
        loadingFrame: 0,
        loadingDelayCount: 4,
        loadingProcessTotal: 0,
        loadingProcessNow: 0,
        loadingWorkTotal: 0,
        loadingWorkNow: 0,
        loadingUserTotal: 0,
        loadingUserNow: 0,
        loadingTotal: 0,
        loadingNow: 0,
        loadingRate: 0
    }
    #settingGUI

    /** @type {HTMLDivElement | undefined} */
    #domFps

    /**
     * 진행 중인 2D/3D 모드 전환을 구분하는 식별자.
     * 전환 도중 다른 카메라 조작이 들어오면 값이 바뀌어 이전 전환의 후속 단계가 취소된다.
     * @type {number}
     */
    #viewAngleChangeId = 0

    /**
     * 현재 적용된 지도 모드. 2D/3D 전환을 아직 호출한 적이 없으면 undefined 이다.
     * @type {string | undefined}
     */
    #viewMode

    /**
     * 진행 중인 모드 전환이 취소될 때 실행할 처리
     * @type {(function():void) | undefined}
     */
    #viewAngleCanceled
    //Define End
    /**
     * U3dApp 클래스 생성자입니다.<br>
     * opt.containername으로 지정한 div 엘리먼트를 지도 화면 영역으로 사용하며, 그 안에 지도를 그릴 캔버스를 만듭니다.<br>
     * 인터넷 익스플로러에서 실행하면 지도를 만들지 않고 지원하지 않는다는 오류만 알립니다.
     *
     * @param {U3dAppCO} opt 지도 화면 영역과 홈 위치, 화면 품질, 타일 처리 기준을 담은 생성 옵션
     */
    constructor(opt) {
        //opt.type = 'world';

        super();
        const self = this;

        /** @type {string} */
        self._classtype = 'U3dApp';
        /** @type {boolean} */
        self._disposed = false;

        if(UDEF.checkInternetExplorer()){
            __GError__(self,'GeOnDT for JS는 인터넷 익스플로러를 지원하지 않습니다.', '1215055');
            return;
        }

        //+ 지역영역설정
        /** @type {typeof THREE} */
        self._THREE = THREE;
        /** @type {boolean} */
        self._bInitialized = false;

        /** @type {import('@union3d/env/UUnderground').UUnderground | undefined} */
        self._underground = undefined;
        /** @type {string | undefined} */
        self._undergroundId = undefined;

        /** @type {boolean} */
        self._stopModel = false;

        /** @type {number} */
        self._mode = UDEF.APP_MODE._PAN;
        /** @type {any | undefined} */
        self._sunSphere = undefined;

        /** @type {import('@UCamera').UCamera | undefined} */
        self._camera = undefined;
        // /** @type {import('@UFrustum').UFrustum | undefined} */
        self._frustum = undefined;

        /** @type {import('@union3d/core/UCollapse').UCollapse | undefined} */
        self._collapse = undefined;
        /** @type {import('@union3d/mode/UMapControls').UMapControls} */
        self._mapControl = /** @type {import('@union3d/mode/UMapControls').UMapControls} */ (/** @type {unknown} */ (undefined));
        /** @type {any} */ self._undergroundControl = undefined;
        /** @type {import('@union3d/mode/UWalkControls').UWalkControls | undefined} */ self._walkControl = undefined;
        /** @type {import('@union3d/mode/UFlyControls').UFlyControls | undefined} */ self._flyControl = undefined;

        /** @type {import('@UScene').UScene} */
        self._scene = /** @type {import('@UScene').UScene} */ (/** @type {unknown} */ (undefined));
        //+ 참조용
        ///** @type {import('@union3d/3dLayer/U3dTerrainLayer').U3dTerrainLayer | undefined} */
        self._terrainLayer = undefined;
        ///** @type {import('@union3d/3dLayer/U3dShaderMeasureLayer').U3dShaderMeasureLayer | undefined} */
        self._measureLayer = undefined;

        /** @type {import('@UScene').UScene} */
        self._sceneComment = /** @type {import('@UScene').UScene} */ (/** @type {unknown} */ (undefined));

        /** @type {import('@URenderer').URenderer} */
        self._renderer = /** @type {import('@URenderer').URenderer} */ (/** @type {unknown} */ (undefined));

        /** @type {Array<*>} */
        self._listQuadtreeSet = [];
        /** @type {import('@UDrawArg').UDrawArg} */
        self._drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (/** @type {unknown} */ (undefined));
        self._terrainDecalManager = undefined;
        /** @type {import('@union3d/core/UBox3').UBox3 | undefined} */
        self._box = undefined;
        /** @type {*} */
        self._overviewmap = undefined;
        /** @type {import('@union3d/app/UGUI').UGUI} */
        self.#settingGUI = undefined;
        /** @type {boolean} */
        self._appUpdate3d = false;
        // 190827 add
        /** @type {import('@union3d/event/U3dAppEventHandler').U3dAppEventHandler | undefined} */
        self._eventHandler = undefined;
        // hskim add 190418 tween list
        /** @type {boolean} */
        self._isTwenning = false;
        /** @type {*} */ self._tweenfrom2To = undefined;
        /** @type {*} */ self._tweenMid2To = undefined;
        /** @type {*} */ self._tweenFrom2Mid = undefined;
        /** @type {*} */ self._tweenFrom2Mid2 = undefined;

        /** @type {string | undefined} */
        self._gizmoType = undefined;

        UDEF.SEARCH_TYPE = defaultValue(opt.searchtype, 'sphere');
        self._stopUpdate = defaultValue(opt.stopupdate || opt.stopUpdate, false);
        self._stopRender = defaultValue(opt.stoprender || opt.stopRender, false);
        self._maxProcess = defaultValue(opt.maxprocess || opt.maxProcess, UDeviceOption.MAX_PROCESS);
        //+ 정적로딩시 거리제한 설정
        self._maxDistanceModel = defaultValue(opt.maxdistancemodel, 3000);

        // merge ver에서 삭제됨
        // self._baseImageLayer = undefined;
        self._nameBaseLayer = 'baseLayer';

        self._wireFrameRendering = false;
        self._sizeWorld = 0;
        /** @type {U3dAppPropertyMap} */
        self._properties = {};

        //+ 이미지 레이어 투명도 설정 //////////////////////
        self.setProperties(UDEF.APP_PROP.IMAGE.USE_OPACITY, defaultValue(opt.useimageopacity, false));
        self.setProperties(UDEF.APP_PROP.IMAGE.OPACITY, defaultValue(opt.imageopacity, 1));

        //+ 모델 레이어 투명도 설정 ////////////////////////
        self.setProperties(UDEF.APP_PROP.MODEL.USE_OPACITY, defaultValue(opt.usemodelopacity, false));
        self.setProperties(UDEF.APP_PROP.MODEL.OPACITY, defaultValue(opt.modelopacity, 1));

        //+ 클리핑
        self.setProperties(UDEF.APP_PROP.CLIP.USE_CLIP, defaultValue(opt.useclip, false));
        self.setProperties(UDEF.APP_PROP.CLIP.AXIS, defaultValue(opt.clipaxis, 'z'));
        self.setProperties(UDEF.APP_PROP.CLIP.CLIP_X, defaultValue(opt.clipx, undefined));
        self.setProperties(UDEF.APP_PROP.CLIP.CLIP_Y, defaultValue(opt.clipy, undefined));
        self.setProperties(UDEF.APP_PROP.CLIP.CLIP_Z, defaultValue(opt.clipz, undefined));

        /** @type {string | undefined} */
        self._idLoad = undefined;
        /** @type {import('@UGeoRect').UGeoRect | undefined} */
        self._rectangle = undefined;

        opt = opt || {};
        /** @type {string} */
        self._name = defaultValue(opt.name, makeName());
        self.#world.vertexlevel = opt.vertexlevel || opt.vertexLevel || 1;
        /** @type {boolean} */
        self._skirt = defaultValue(opt.skirt, true);

        // 줌, 패닝, 회전속도를 거리에 따라 자동설정 유무
        /** @type {boolean} */
        self._useAutoSpeed = defaultValue(opt.useautospeed, true);

        self.#world.segVertex = self.getVertexLevel() === 2 ? UDEF.TILE_SEG_L2 : UDEF.TILE_SEG;
        /** @type {boolean} */
        self._auto = defaultValue(opt.auto, true);
        /** @type {string} */
        self._containername = defaultValue(opt.containername ?? opt.containerName, 'union3d-container');
        /** @type {HTMLElement} */
        self._container = document.getElementById(self._containername);
        if (!defined(self._container)) throw new Error('container is required.');

        //+ 고도처리 방법 /////////////////////////
        self.setMethodHeight(defaultValue(opt.methodheight, UDEF.HEIGHT_METHOD._RAW));

        self.createExecuteCommand();

        /** @type {U3dAppWindowRect} */
        self._rectBaseWindow = {
            left: 0,
            top: 0,
            width: self._container.clientWidth / 2,
            height: self._container.clientHeight
        };

        /** @type {U3dAppWindowRect} */
        self._rectSwipeWindow = {
            left: self._container.clientWidth / 2,
            top: 0,
            width: self._container.clientWidth / 2,
            height: self._container.clientHeight
        };

        self.#overview.camTargetType = opt.camTargetType || opt.camtargettype || true;
        self.#overview.idoverview = opt.idoverview || opt.idOverview || undefined;

        /** @type {number} */
        self._ratioTileSize = defaultValue((opt.ratiotilesize || opt.ratioTileSize), UDEF.DEFAULT_RATIO_TILE_SIZE);
        /** @type {number} */
        self._ratioModelTileSize = defaultValue((opt.ratiomodeltilesize || opt.ratioModelTileSize), UDEF.DEFAULT_RATIO_MODEL_TILE_SIZE);
        /** @type {boolean} */
        self._frameOptimize = defaultValue(opt.frameOptimize, true);

        //inProcessing
        /** @type {boolean} */
        self._autoClear = opt.autoClear ?? opt.autoclear ?? true;
        self.setPixelRatio(opt.pixelRatio ?? opt.pixelratio); //self.#draw.pixelRatio 설정
        self.setPixelResolution(opt.pixelResolution ?? opt.pixelresolution); // self.#draw.pixelResolution 설정

        /** @type {boolean} */
        self._logarithmicDepthBuffer = defaultValue(opt.logarithmicDepthBuffer, true);
        /** @type {boolean} */
        self._preserveDrawingBuffer = defaultValue(opt.preserveDrawingBuffer, false);
        /** @type {number} */
        self._improveTexture =
            UDEF.IMPROVE_TEXTURE_LEVEL[opt.improveTexture]
            ?? UDEF.IMPROVE_TEXTURE_LEVEL[opt.improvetexture]
            ?? UDeviceOption.IMPROVE_TEXTURE_LEVEL;

        //postProcessing
        self.#postProcess.usePostProcess = opt.usePostProcess ?? opt.usepostprocess ?? UDeviceOption.USE_POSTPROCESS;
        self.#postProcess.postOption = opt.postOption ?? opt.postoption ?? undefined;

        // Light intensity
        self.#env.intensityLight = opt.intensitylight || opt.intensityLight || DEFAULT_ENV_INTENSITY;
        self.#env.intensitySunLight = opt.intensitysunlight || opt.intensitySunLight || DEFAULT_MAX_SUN_INTENSITY;
        /** @type {number} */
        self._toneExposure = defaultValue(opt.toneExposure, UDEF.TONEMAPPING_EXPOSURE);

        // Use sky boolean
        /** @type {boolean} */
        self._useSky = defaultValue(opt.usesky, true);
        /** @type {boolean} */
        self._useFog = opt.usefog ?? opt.useFog ?? true;
        /** @type {import('three').ColorRepresentation} */
        self._fogColor = opt.fogcolor ?? opt.fogColor ?? UDEF.fogColor;
        self._defaultFog = new UFog(self._fogColor, UDEF.fogValue);
        /** @type {import('three').Color | undefined} */
        self._background = undefined;
        /** @type {ColorLike} */
        self._backgroundColor = defaultValue(opt.backgroundcolor, 'rgb(200, 200, 200)');

        /** @type {import('@union3d/3dLayer/U3dLayerList').U3dLayerList | undefined} */
        self._layerlist = undefined;
        /** @type {Array<*>} */ self._overlayList = []; //+ 오버레이 목록
        /** @type {Array<*>} */ self._viewList = []; //+ 카메라뷰창 목록
        /** @type {Array<*>} */ self._viewLightList = []; //+ 광원뷰창 목록
        /** @type {Array<*>} */ self._lightList = []; //+ 광원 목록
        /** @type {Array<*>} */ self._poiList = []; //+ poi 목록
        /** @type {Array<*>} */ self._objectList = []; //+ object 목록
        /** @type {Map<string, *>} */
        self._editHeightBoxList = new Map();
        /** @type {*} */
        self._selected = undefined; // 선택된(raycsating) object

        self.getViewLightList = function () {
            return self._viewLightList;
        }

        self.getSelected = function () {
            return self._selected
        }

        const regionOption = getOptionRegion(opt);

        /** @type {TargetRectOption | undefined} */
        self._targetrectopt = defaultValue(opt.targetrectopt, undefined);
        /** @type {number | undefined} */
        self._passlevel = defaultValue(opt.passlevel, undefined);

        /** @type {number} */
        self._sizeWorld = defaultValue(regionOption.size, DEFAULT_WORLD_SIZE); //사용자 옵션으로 받지 않고 getOptionRegion에서 설정됨
        /** @type {import('@UGeoRect').UGeoRect | undefined} */
        self._rectangle = defaultValue(regionOption.rectangle, undefined); //사용자 옵션으로 받지 않고 getOptionRegion에서 설정됨
        /** @type {number | undefined} */
        self._datalevel = defaultValue(regionOption.datalevel, undefined); //사용자 옵션으로 받지 않고 getOptionRegion에서 설정됨
        /** @type {number | undefined} */
        self._startlevel = defaultValue(regionOption.startlevel, undefined); //사용자 옵션으로 받지 않고 getOptionRegion에서 설정됨

        self._box = self.createBox();
        //+ camera option ///////////////////////////////////////////////////
        /** @type {number} */
        self._viewportRatio = defaultValue(opt.viewportratio, 1);
        /** @type {number} */
        self._fov = defaultValue(opt.fov, 50);
        /** @type {number} */
        self._near = defaultValue(opt.near, 1); //+ 약간 뒤쪽을 잡아야  카메라 근접도 잡힌다.
        /** @type {number} */
        self._far = defaultValue(opt.far, self._sizeWorld);
        /** @type {'perspective' | 'orthographic'} */
        self._cameraType = defaultValue(opt.cameraType, 'perspective'); // 'perspective' | 'orthographic'

        //+ 모델 lod 거리제한
        /** @type {number} */
        self._modelImageDistance = defaultValue(opt.modelimagedistance, UDEF.MODEL_IMAGE_UPDATE_DISTANCE);
        /** @type {number} */
        self._modelImageDefaultLevel = defaultValue(opt.modelimagedefaultlevel, 0);
        /** @type {number} */
        self._modelUpdateOffset = opt.modelUpdateOffset || opt.modelupdateoffset || 0;

        //+ home position ///////////////////////////////////////////////////
        if (defined(opt.homePosition)) {
            if (typeof (opt.homePosition) === "object") {
                /** @type {import('three').Vector3} */
                self._homePosition = new THREE.Vector3(opt.homePosition.x, opt.homePosition.y, opt.homePosition.z);
            }
        } else {
            /** @type {import('three').Vector3} */
            self._homePosition = new THREE.Vector3(0, 0, 0);
        }
        /** @type {number} */
        self._homeRotateLeft = defaultValue(opt.homeRotateLeft, 0);
        /** @type {number} */
        self._homeRotateDown = defaultValue(opt.homeRotateDown, 0);

        //+ zoom Level & resolution
        /** @type {number | undefined} */
        self._resolution = undefined;
        /** @type {number} */
        self._zoomLevel = defaultValue(opt.zoomLevel, 10);
        /** @type {number} */
        self._minZoomLevel = defaultValue(opt.minZoomLevel, DEFAULT_MIN_ZOOM_LEVEL);  //world = 3, korea = 6
        /** @type {number} */
        self._maxZoomLevel = defaultValue(opt.maxZoomLevel, 19);

        //+ quadtree level setting////////////////////////////////////////////
        /** @type {number} */
        self._minlevel = 0; //minlevel은 사용자 옵션으로 받지않고 0 고정으로 넣는다.
        /** @type {number} */
        self._maxlevel = defaultValue(opt.maxlevel, 19);
        U3dQuadTile.setMinLevel(self._minlevel);
        U3dQuadTile.setMaxLevel(self._maxlevel);

        //+ sun Flare settitng /////////////
        /** @type {boolean} */
        self._useSunFlare = defaultValue((opt.useSunFlare ?? opt.usesunflare), UDeviceOption.USE_SUN_FLARE);
        /** @type {boolean} */
        self._useCloud = defaultValue(opt.useCloud, true);
        /** @type {boolean} */
        self._useShadowMap = defaultValue((opt.useshadowmap ?? opt.useShadowMap), true);
        /** @type {import('@union3d/effect/ULensFlare').ULensFlare | undefined} */
        self._sunFlare = undefined;
        // 비행모드 autoMove
        /** @type {boolean} */
        self._autoMove = defaultValue(opt.automove, false);
        //+ jykim 일조권 설정시간 변수
        /** @type {Date | undefined} */
        self._curtime = undefined;

        //건물지우기 내역
        // /** @type {Array<U3dRemovedModelInfo>} */
        self._removedModel = [];
        //현재 카메라 애니메이션
        /** @type {U3dAppTweenHandle | undefined} */
        self._currentTween = undefined;
        //카메라 초기화 중에는 fly 캔슬 못하게하는 변수
        self._isCameraRest = false;

        initialize: {
            self.initOpenLayers();
            if (!self.createEventHandler(self._container, self)) {
                __GError__(self, 'EVENT 연결 객체를 생성하는중 오류가 발생하였습니다.', '2526393');
                break initialize;
            }

            if (!self.createScene() || !self.createSceneComment()) {
                __GError__(self, 'SCENE 객체를 생성하는중 오류가 발생하였습니다.', '2526589');
                break initialize;
            }

            if (!self.createDrawArg(
                opt,
                self,
                self._scene,
                self._sceneComment,
                null,
                self._frustum,
                self._rectangle
            )) {
                __GError__(self, '렌더링 속성 객체를 생성하는중 오류가 발생하였습니다.', '2527045');
                break initialize;
            }

            self._layerlist = new U3dLayerList({
                drawarg: self._drawArg
            });


            let cameraType = 'frustum'
            if (self._cameraType === UDEF.CAMERA_TYPE.ORTHOGRAPHIC) {
                cameraType = 'orthofrustum'
            }
            self._frustum = new UFrustum({
                type: cameraType,
                drawArg: self._drawArg
            });

            self.createQuadTreeSet(
                self._rectangle,
                self._datalevel
            );

            if (defined(self.#overview.idoverview)) {
                self.createOverviewMap(self.#overview.idoverview);
            }

            //검색을 위한 인덱싱매니저 생성
            self.#manager.indexManager = new UIndexManager(self._rectangle);
            //전역 프로세스 생성
            self.#manager.processManager = new UProcessManager(self, self._maxProcess);
            self._userProcess = self.#manager.processManager.getUserProcess();
            self._imageProcess = self.#manager.processManager.getImageProcess();
            self._heightProcess = self.#manager.processManager.getHeightProcess();
            self._modelProcess = self.#manager.processManager.getModelProcess();
            self._modelWorkProcesses = self.#manager.processManager.getModelWorkProcesses();
            self._customProcess = self.#manager.processManager.getCustomProcess();

            self.#manager.testManager = new UTestManager(self);

            self.createMeasureLayer({  //+ 측정(거리, 면적)
                name: UDEF.LAYER_NAME.MEASURE,
                maxlevel: 19
            });
            self.createTerrainLayer({name: UDEF.LAYER_TYPE.TERRAIN}); //+ 지형
            self._bInitialized = true;
        }

        /** @type {Array<*>} */
        self._particles = [];
        /** @type {Array<*>} */
        self._fires = [];

        /** @type {import('three').Plane} */
        self._globalPlaneX = new THREE.Plane(new THREE.Vector3(-1, 0, 0), self._rectangle.width);
        /** @type {import('three').Plane} */
        self._globalPlaneY = new THREE.Plane(new THREE.Vector3(0, -1, 0), self._rectangle.height);
        /** @type {import('three').Plane} */
        self._globalPlaneZ = new THREE.Plane(new THREE.Vector3(0, 0, -1), MAX_PLANE_HEIGHT);
        /** @type {Array<import('three').Plane>} */
        self._clippingPlanes = [];
        /** @type {Array<*>} */
        self._analysisList = [];
        self.createAnalysis();

        //지하 box 메쉬 설정
        /** @type {number} */
        self._undergroundDepth = defaultValue(opt.undergroundDepth, 95000);
        /** @type {number} */
        self._undergroundColor = defaultValue(opt.undergroundColor, 0x050505);
        //self._undergroundColor = defaultValue(opt.undergroundColor, 0x000055);
        /** @type {number} */
        self._undergroundOpacity = defaultValue(opt.undergroundOpacity, 0.95);
        /** @type {boolean} */
        self._undergroundGrid = defaultValue(opt.undergroundGrid, true);
        /** @type {number} */
        self._undergroundGridDivide = defaultValue(opt.undergroundGridDivide, 50);
        /** @type {boolean} */
        self._undergroundSetTexture = defaultValue(opt.undergroundSetTexture, false);
        /** @type {boolean} */
        self._undergroundEdge = defaultValue(opt.undergroundEdge, false);
        /** @type {number} */
        self._undergroundEdgeThickness = defaultValue(opt.undergroundEdgeThickness, 1);
        /** @type {boolean} */
        self._undergroundFog = defaultValue(opt.undergroundFog, false);
        /** @type {number} */
        self._undergroundFogDensity = defaultValue(opt.undergroundFogDensity, 0.005);
        /** @type {number} */
        self._undergroundFogStartHeight = defaultValue(opt.undergroundFogStartHeight, 0);
        /** @type {number} */
        self._undergroundFogEndHeight = defaultValue(opt.undergroundFogEndHeight, -5000);
        /** @type {import('three').ColorRepresentation | import('three').Vector3} */
        self._undergroundFogColor = defaultValue(opt.undergroundFogColor, new THREE.Vector3(0.034, 0.034, 0.034));

        //+ 스와이프 /////////////////////////////
        self.#draw.enableSwipe = (opt.enableswipe ?? opt.enableSwipe ?? false);

        const nameSwipeLayers = opt.nameswipelayers || opt.nameSwipeLayers || null;
        if (nameSwipeLayers instanceof Array) {
            for (let nameSwipeLayer of nameSwipeLayers) {
                self.#draw.nameSwipeLayers.set(nameSwipeLayer, {copy: false});
            }
        }

//+ auto start
        /** @type {U3dStats} */
        self._rStats = new U3dStats();
        /** @type {U3dStats} */
        self._uStats = new U3dStats();
        /** @type {U3dStats} */
        self._uwStats = new U3dStats();
        /** @type {U3dStats} */
        self._ulStats = new U3dStats();
        /** @type {U3dStats} */
        self._dStats = new U3dStats();

        /** @type {UAnimationManager} */
        self._animationManager = new UAnimationManager(self);

        /** @type {import('@union3d/manager/UMixerManager').UMixerManager} */
        self._mixerManager = new UMixerManager(self);

        /** @type {U3dAppRoundRobinState} */
        self._viewRR = {cursor: 0}

        self.#setDrawTickFrame();

        self.#beforeUnloadHandler = () => {
            U3dMessage.info(self._classtype, U3dMessage.CNT.CMM.EXIT_APP, '2630383');
            self.dispose();
        };
        window.addEventListener('beforeunload', self.#beforeUnloadHandler);

        if (self._auto === true) {
            if (!self.createRenderer(self._container)) {
                __GError__(self, '렌더러 객체를 생성하는 중 오류가 발생하였습니다.', '2531683');
            }

            self.createLoadingCanvas();
            self.setVisibleLoading(false);

            if (!self.createCamera(self._near, self._far, self._fov)) {
                __GError__(self, '카메라 객체를 생성하는 중 오류가 발생하였습니다.', '2531846');
            }

            self.createControls();

            if (!self.createLight(self._sizeWorld, self._drawArg)) {
                __GError__(self, '광원 객체를 생성하는 중 오류가 발생하였습니다.', '2532045');
            }

            self.createSky();

            UDEF.setUseSunFlare(self._useSunFlare);
            if (self._useSunFlare && !defined(self._sunFlare)) {
                self.createSunFlare();
            }

            self.enableShadowMap(self._useShadowMap);
            self.setCameraFitKorea(self._camera);
            self.setDefaultTimeSun();
            self.resize();
            self.start();
        }
        /** @type {import('@union3d/overlay/U3dOverlayManager').U3dOverlayManager | null} */
        self._overlayManager = null;
    }

    //Constructor End

    getParam() {
        return {
            name: this._name,
            containername: this._container.id,
            idoverview: this.#overview.idoverview,
            camTargetType: this.getCameraTargetType(),
            homePosition: this._homePosition,
            homeRotateDown: this._homeRotateDown,
            homeRotateLeft: this._homeRotateLeft,
            maxProcess: this._maxProcess,
            frameOptimize: this._frameOptimize,
            autoClear: this._autoClear,
            ratioTileSize: this._ratioTileSize,
            ratioModelTileSize: this._ratioModelTileSize,
            useSunFlare: this._useSunFlare,
            useshadowmap: this._useShadowMap,
            intensitylight: this.getIntensityLight(),
            intensitysunlight: this.getIntensitySunLight(),
            toneExposure: this._toneExposure,
            usesky: this._useSky,
            usefog: this._useFog,
            useCloud: this._useCloud,
            backgroundcolor: this._backgroundColor,
            fov: this._fov,
            cameraType: this._cameraType,
            improveTexture: this.getImproveLevel(),
            pixelResolution: this.getPixelResolution(),
            pixelRatio: this.getPixelRatio(),
            usePostProcess: this.isPostProcess(),
            postOption: this.getPostOption(),
            datalevel: this._datalevel,
            passlevel: this._passlevel,
            minlevel: this._minlevel,
            maxlevel: this._maxlevel,
            size: this._sizeWorld,
            rectangle: this._rectangle,
            useimageopacity: this._properties["image_use_opacity"],
            imageopacity: this._properties["image_opacity"],
            usemodelopacity: this._properties["model_use_opacity"],
            modelopacity: this._properties["model_opacity"],
            methodheight: this._methodHeight,
            searchtype: this.getSearchType(),
            modelimagedistance: this._modelImageDistance,
            modelimagedefaultlevel: this._modelImageDefaultLevel,
            viewportratio: this._viewportRatio,
            near: this._near,
            far: this._far,
            minZoomLevel: this._minZoomLevel,
            maxZoomLevel: this._maxZoomLevel,
            automove: this._autoMove
        }
    }

    /**
     * U3dApp의 main 카메라를 반환합니다.
     *
     * @returns {import('@UCamera').UCamera | undefined} U3dApp main 카메라
     *
     * @example
     * const camera = app.getCamera();
     */
    getCamera() {
        return this._camera;
    }

    /**
     * 이 앱에 속한 shader layer가 공유할 terrain decal manager를 반환합니다.
     * 사용하지 않는 앱에서는 worker와 registry를 만들지 않도록 최초 요청 시 생성합니다.
     *
     * @returns {import('@union3d/manager/terrain/UShaderTerrainDecalManager.js').UShaderTerrainDecalManager} 앱 단위 공유 manager입니다.
     */
    getTerrainDecalManager() {
        if (!this._terrainDecalManager) {
            this._terrainDecalManager = new UShaderTerrainDecalManager({app: this});
        }
        return this._terrainDecalManager;
    }

    /**
     * 작업 처리기와 측정을 먼저 종료한 뒤 앱이 소유한 자원을 정리합니다.
     * 종료 콜백에서 다시 호출하거나 이미 종료된 경우에는 중복 정리를 하지 않습니다.
     */
    dispose() {
        if (this._disposed) return;
        // 작업 취소 알림에서 앱 종료를 다시 요청할 수 있으므로 외부 콜백보다 먼저 차단합니다.
        this._disposed = true;
        const self = this;

        self._bInitialized = false;
        // 취소 콜백은 레이어와 그리기 인자를 사용하므로 해당 자원이 살아 있을 때 종결합니다.
        self.#manager.processManager?.dispose();

        // 페이지를 닫기 전에 dispose()를 부른 경우에도 window가 이 앱을 계속 참조하지 않도록 리스너를 뗍니다.
        if (self.#beforeUnloadHandler) {
            window.removeEventListener('beforeunload', self.#beforeUnloadHandler);
            self.#beforeUnloadHandler = undefined;
        }

        //  self._queueTiles.clear();
        //   self._queueTileModels.clear();
        //   self._queueDraw.clear();
        //   self._queueDrawModel.clear();

        //+ 참조용 - 제거한다.
        self._terrainLayer = undefined;
        self._measureLayer = undefined;

        if (defined(self._eventHandler)) {
            self._eventHandler.dispose();
            self._eventHandler = undefined;
        }

        self.#removeFpsDom();

        self.removeEventListenerAll();

        self._editHeightBoxList = undefined;

        if (self._isTwenning) {
            if (defined(self._tweenfrom2To))
                self._tweenfrom2To.stop();

            if (defined(self._tweenMid2To))
                self._tweenMid2To.stop();

            if (defined(self._tweenFrom2Mid))
                self._tweenFrom2Mid.stop();

            if (defined(self._tweenFrom2Mid2))
                self._tweenFrom2Mid2.stop();

            self._isTwenning = false;
        }

        self._gizmoType = undefined;

        self.removeAllPOI();

        self.removeAllObject();

        self.removeAllOverlay();

        self.removeAllView();

        self.removeAllViewLight();

        // UMapControls dispose
        if (defined(self._mapControl))
            self._mapControl.dispose();

        /** @type {{_mapControl: import('@union3d/mode/UMapControls').UMapControls | undefined}} */ (self)._mapControl = undefined;

        // QuadTree dispose
        self.disposeQuadTree();

        // layerlist dispose
        if (defined(self._layerlist))
            self._layerlist.disposeAll();

        self._layerlist = undefined;

        self._terrainDecalManager?.dispose();
        self._terrainDecalManager = undefined;

        // scene dispose
        if (defined(self._scene)) {
            U3dBilboard.removeAll(self._scene);
            self._scene.dispose();
        }

        /** @type {{_scene: import('@UScene').UScene | undefined}} */ (self)._scene = undefined;

        if (defined(self._sceneComment)) {
            // sceneComment dispsoe
            U3dBilboard.removeAll(self._sceneComment);
            self._sceneComment.dispose();
        }
        /** @type {{_sceneComment: import('@UScene').UScene | undefined}} */ (self)._sceneComment = undefined;

        if (defined(self._overviewmap))
            self._overviewmap.dispose();

        // renderer dispose
        if (defined(self._renderer)) {
            self._renderer.clear();
            self._renderer.domElement.remove();
            // self._renderer.context = undefined;
            self._renderer.domElement = undefined;
            self._renderer.dispose();
            /** @type {{_renderer: import('@URenderer').URenderer | undefined}} */ (self)._renderer = undefined;
        }

        // if (defined(self._frameCheck)) {
        //     delete self._frameCheck;
        //     self._frameCheck = undefined;
        // }
        //
        // if (defined(self._frameUpdateCheck)) {
        //     delete self._frameUpdateCheck;
        //     self._frameUpdateCheck = undefined;
        // }

        self._properties = {};

        // drawArg dispose
        if (defined(self._drawArg))
            self._drawArg.dispose();

        /** @type {{_drawArg: import('@UDrawArg').UDrawArg | undefined}} */ (self)._drawArg = undefined;

        self.removeSky();

        self._sunSphere = undefined;

        self._camera = undefined;

        if (self.#env.light)
            self.#env.light.dispose();
        self.#env.light = undefined;

        self._frustum = undefined;
        self._overviewmap = undefined;

        if (self.#settingGUI)
            self.removeDevToolView();

        self._appUpdate3d = false;

        self._measureLayer = undefined;
        self._nameBaseLayer = 'baseLayer';

        self._sizeWorld = 0;//(UDEF.GoogleCoordWidth);

        self._idLoad = undefined;
        self._rectangle = undefined;

        //+ webworker height ..
        if (defined(U3dHeightLayer.g_taskProcessor)) {
            U3dHeightLayer.g_taskProcessor.dispose();
            U3dHeightLayer.g_taskProcessor = undefined;
        }

        //+ webworker model ..
        if (defined(U3dModelU3FLayer.g_taskProcessor)) {
            U3dModelU3FLayer.g_taskProcessor.dispose();
            U3dModelU3FLayer.g_taskProcessor = undefined;
        }

        if (defined(U3dImagePBFLayer.g_taskProcessor)) {
            U3dImagePBFLayer.g_taskProcessor.dispose();
            U3dImagePBFLayer.g_taskProcessor = undefined;
        }

    };

    getMetaData() {
        const meta = U3dObject.prototype.getMetaData.call(this);
        const self = this;

        meta.addChild({
            AppOptions: self.getParam()
        });

        //카메라정보
        const homePosition = self.createMeta('HomePosition');
        homePosition.addChild({
            position: self._homePosition,
            rotateLeft: self._homeRotateLeft,
            rotateDown: self._homeRotateDown
        });
        meta.addChild(homePosition);


        //레이어정보
        if (defined(self._layerlist)) {
            const layers = self.createMeta('Layers');
            self._layerlist._listmap.forEach(function (v) {
                const lm = v.getMetaData();
                layers.addChild(lm);
            });
            meta.addChild(layers);
        }
        return meta;
    };


    /**
     * 현재 전체 작업 진행률을 0~1 범위의 비율로 반환한다.
     * @returns {number}
     */
    getLoadingRate() {
        return this.#debug.loadingRate;
    }

    /**
     * 현재 완료된 전체 작업량을 반환한다.
     * @returns {number}
     */
    getLoadingNow() {
        return this.#debug.loadingNow;
    }

    /**
     * 전체 작업량을 반환한다.
     * @returns {number}
     */
    getLoadingTotal() {
        return this.#debug.loadingTotal;
    }

    /**
     * 지도화면 resize 함수
     */
    resize() {
        const width = this._container.clientWidth;
        const height = this._container.clientHeight;

        if (width === 0 || height === 0) {
            __GInfo__(this, 'Container has zero size, skipping resize');
            return;
        }

        if (!this.#draw.pixelRatio)
            this.#draw.pixelRatio = UDEF.DEFAULT_PIXEL_RATIO;

        if (!this.#draw.pixelResolution || !this.#draw.pixelResolution.length || this.#draw.pixelResolution.length !== 2)
            this.#draw.pixelResolution = UDeviceOption.PIXEL_RESOLUTION;

        const pixelResolution = this.#draw.pixelResolution[0] * this.#draw.pixelResolution[1];
        const pixelRatio = Math.sqrt((this.#draw.pixelRatio * pixelResolution) / (width * height));

        if (this._renderer)
            this._renderer.setDrawingBufferSize(width, height, pixelRatio, true);

        if (this._camera) {
            this._camera.setAspect(width / height * this._viewportRatio);
        }

        if (defined(this._quadtreeSet))
            this._quadtreeSet.update(undefined);
    };

    /**
     * 화면의 픽셀 비율을 설정합니다.
     *
     * @param {number} [pixelRatio=1] 픽셀 비율
     * @returns {U3dApp | undefined} 현재 앱
     *
     * @example
     * app.setPixelRatio(1.0);
     */
    setPixelRatio(pixelRatio = UDEF.DEFAULT_PIXEL_RATIO) {
        this.#draw.pixelRatio = pixelRatio;

        if (!this._renderer) return;

        this.resize();

        return this;
    }

    /**
     * 현재 화면의 픽셀 비율을 반환합니다.
     *
     * @returns {number} 픽셀 비율
     *
     * @example
     * const pixelRatio = app.getPixelRatio();
     */
    getPixelRatio(){ return this.#draw.pixelRatio; }

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
    setPixelResolution(width, height) {
        let pixelResolution;
        if (typeof width === 'string') {
            pixelResolution = UDEF.PIXEL_RESOLUTION[width.toUpperCase()];
        } else if (width instanceof Array && width.length === 2) {
            pixelResolution = [width[0], width[1]];
        } else if (width && height) {
            pixelResolution = [width, height];
        }

        if (!pixelResolution)
            pixelResolution = UDeviceOption.PIXEL_RESOLUTION;

        this.#draw.pixelResolution = [...pixelResolution];

        this.resize();

        return this;
    }

    /**
     * 현재 설정된 화면 해상도를 반환합니다.
     *
     * @returns {Array<number>} 가로와 세로 해상도
     *
     * @example
     * const resolution = app.getPixelResolution();
     */
    getPixelResolution() {
        return this.#draw.pixelResolution;
    }

    /**
     * 현재 화면 해상도의 단계 이름을 반환합니다.
     *
     * @returns {PIXELRE_SOLUTION_OPTION} 해상도 단계
     *
     * @example
     * const level = app.getPixelResolutionLevel();
     */
    getPixelResolutionLevel() {
        for (const [key, value] of Object.entries(UDEF.PIXEL_RESOLUTION)) {
            if (value[0] === this.#draw.pixelResolution[0] && value[1] === this.#draw.pixelResolution[1])
                return key;
        }
        return 'CUSTOM';
    }

    /**
     * 나중에 다시 불러올 카메라 상태를 저장합니다.
     *
     * @param {import('@union3d/core/UCameraState').UCameraState} cameraStateInfo 저장할 카메라 상태
     *
     * @example
     * app.setSavedCameraState(app.getCameraState());
     */
    setSavedCameraState(cameraStateInfo) {
        const self = this;
        self.#cameraState.savedInfo = cameraStateInfo;
    };

    /**
     * 저장된 카메라 상태를 반환합니다.
     * 저장된 상태가 없으면 `undefined`를 반환합니다.
     *
     * @returns {import('@union3d/core/UCameraState').UCameraState | undefined} 저장된 카메라 상태
     *
     * @example
     * const state = app.getSavedCameraState();
     */
    getSavedCameraState() {
        const self = this;
        const info = self.#cameraState.savedInfo;
        if (!info || !info.camera || !info.center) {
            __GInfo__(self, '저장된 카메라 상태가 없습니다. 이전에 saveCameraState API 를 호출하여 저장하여 주십시오.', '4742518');
            return;
        }
        return info;
    };

    /**
     * Renderer를 생성하는 함수
     * @param {HTMLElement} container 3dMap div 객체
     * @return {import('@union3d/core/URenderer').URenderer} renderer 객체
     *
     * @ignore
     */
    createRenderer(container) {
        const self = this;

        if (defined(self._renderer)) {
            self._renderer.clear();
            if (self._renderer.domElement) {
                self._renderer.domElement.remove();
                self._renderer.domElement = undefined;
            }
            self._renderer.dispose();
        }

        const opt = {
            antialias: false,
            logarithmicDepthBuffer: self._logarithmicDepthBuffer,
            preserveDrawingBuffer: self._preserveDrawingBuffer,   // required to support .toDataURL()
            powerPreference: 'high-performance',
            usePostProcess: self.isPostProcess(),
            postOption: self.getPostOption()
        };

        self._renderer = new URenderer(opt);
        self._renderer.setApp(self);
        self._renderer.sortObjects = true;
        self.#postProcess.postOption = self._renderer.getPostOption();

        self._renderer.toneMapping = UDEF.TONEMAPPING;
        self._renderer.toneMappingExposure = self._toneExposure;
        // THREE.ShaderChunk.tonemapping_pars_fragment 톤매핑 쉐이더 위치

        //클리핑 설정
        self.enableSwipe(self.#draw.enableSwipe);

        //+ 단 투명도 설정(중첩)에서 sort 안되어 있어야 개발자가 원하는 방향으로 처리할 수있다
        container.appendChild(self._renderer.domElement);
        if (self._drawArg)
            self._drawArg._renderer = self._renderer;
        return self._renderer;
    };

    /**
     * 후처리 적용 여부를 반환 하는 함수
     * @returns {boolean} 후처리 적용 여부
     */
    isPostProcess() {
        return this.#postProcess.usePostProcess;
    };

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
    setPostProcess(usePostProcess) {
        if (this.isPostProcess() === usePostProcess) return;

        this.#postProcess.usePostProcess = usePostProcess;

        if (this.getSky()) {
            this.removeSky();
            this.createSky();
            this.setDefaultTimeSun();
        }
        this._renderer.setPostProcess(usePostProcess);

    };

    /**
     * 3D 공간에 하늘 영역을 생성하는 함수
     */
    createSky() {
        const self = this;
        if (!defined(self._scene))
            return;

        if (!self._useSky)
            return;

        if (self.getSky()) {
            __GInfo__(self, '이미 Sky 객체가 존재 합니다.', '3271569');
            return;
        }
        const usePostProcess = self.isPostProcess();
        // Add Sky
        const sky = new USky();
        sky.scale.setScalar(WORLD_SIZE * 10);
        sky.updateMatrix();

        self._scene.add(sky);
        self.#env.sky = sky;

        if (self._useCloud && usePostProcess) {
            self.createCloud();
        }
    };

    /**
     * 하늘을 제거하는 함수
     */
    removeSky() {
        const self = this;
        const sky = self.getSky();
        if (!sky || !defined(self._scene))
            return;

        if (self._cloud) {
            self.removeCloud();
        }

        self._scene.remove(sky);

        if (defined(sky.material)) {
            sky.material.dispose();
            sky.material = undefined;
        }

        if (defined(sky.geometry)) {
            sky.geometry.dispose();
            sky.geometry = undefined;
        }
        self.#env.sky = undefined;
    };

    /**
     * 하늘 객체를 반환 하는 함수
     * @returns {import('@union3d/env/USky').USky}
     */
    getSky() {
        return this.#env.sky;
    };

    /**
     * 구름 객체를 제거하는 함수
     */
    removeCloud() {
        if (this._cloud) {
            this._scene.remove(this._cloud);
            this._cloud.dispose();
            this._cloud = undefined;
        }
    }

    /**
     * @description 구름을 생성하는 함수
     *
     * @return {import('@union3d/env/U3dCloud').U3dCloud} 구를 객체
     * @ignore
     */
    createCloud() {
        if (!this.isPostProcess()) {
            __GInfo__(this, 'usePostProcess 옵션이 false 입니다. usePostProcess 옵션을 true 설정 후 API를 다시 호출하여 주십시오', '3272336');
            return;
        }

        if (this._cloud) {
            __GInfo__(this, '이미 cloud 객체가 존재합니다.', '3272443');
            return;
        }
        const self = this;
        self._cloud = new U3dCloud(self._rectangle.centerMap());
        self._scene.add(self._cloud);
        self._cloud.active = true;
        return self._cloud;
    };

    /**
     * @description 하늘의 생성된 구름을 반환하는 함수
     *
     * @returns {import('@union3d/env/U3dCloud').U3dCloud} 생성된 구름
     */
    getCloud() {
        return this._cloud;
    }

    /**
     * @description 하늘의 생성된 구름의 출력을 제어하는 함수
     * @param {boolean} isShow 출력여부
     */
    showCloud(isShow) {
        this._cloud ? this._cloud.visible = isShow : undefined;
    }

    /**
     * 후처리 보정 항목의 값을 바꾸고 화면에 반영합니다.<br>
     * 넘긴 항목만 덮어쓰고 넘기지 않은 항목은 지금 값을 그대로 두므로 바꿀 항목 하나만 담아 호출해도 됩니다.<br>
     * PostProcessParam에 없는 이름은 저장하지 않습니다.<br>
     * fxaaSharpness는 이 호출로 값만 저장되고 화면 크기를 다시 계산할 때 반영되므로 곧바로 화면이 달라지지 않습니다.<br>
     * 후처리를 꺼 둔 상태에서 호출하면 값만 저장되며 setPostProcess(true)로 켤 때 화면에 적용됩니다.
     *
     * @param {PostProcessParam} option 바꿀 항목만 담은 후처리 설정
     */
    setPostOption(option) {
        this._renderer.setPostOption(option);
        this.#postProcess.postOption = this._renderer.getPostOption();
    };

    /**
     * 지금 적용 중인 후처리 설정을 반환합니다.<br>
     * 후처리가 켜져 있지 않으면 undefined를 반환하므로 값을 읽기 전에 후처리 사용 여부를 확인하십시오.<br>
     * 반환값은 엔진이 보관 중인 설정 객체 자체이므로 속성을 직접 고쳐도 그것만으로는 화면이 달라지지 않습니다.<br>
     * 고친 값을 적용하려면 고친 객체를 그대로 setPostOption()에 넘기십시오.<br>
     * 고친 값은 다음에 후처리 설정이 적용될 때 함께 반영되므로, 지금 값을 유지하려면 반환값을 복사해서 사용을 권장드립니다.
     *
     * @returns {PostProcessParam | undefined} 모든 항목이 채워진 현재 후처리 설정이며, 후처리가 켜져 있지 않으면 undefined
     */
    getPostOption() {
        if (!this.isPostProcess()) {
            return;
        }

        if ((!this.#postProcess.postOption || Object.keys(this.#postProcess.postOption).length === 0) && this._renderer) {
            this.#postProcess.postOption = this._renderer.getPostOption();
        }

        return this.#postProcess.postOption;
    };

    hasRenderAfter() {
        return this.#draw.callbackRenderAfter.size > 0;
    }

    setRenderAfter(key, callback) {
        if (!callback || typeof callback !== 'function') return;

        if (!this.#draw.callbackRenderAfter.has(key)) {
            this.#draw.callbackRenderAfter.set(key, [callback]);
            return;
        }

        this.#draw.callbackRenderAfter.get(key).push(callback);
    }

    removeRenderAfter(key) {
        this.#draw.callbackRenderAfter.delete(key);
    }

    exeRenderAfter(renderer, scene, camera) {
        const values = this.#draw.callbackRenderAfter.values();
        for (const callbackList of values) {
            for (const callback of callbackList) {
                callback(renderer, scene, camera);
            }
        }
    }

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
    hasRenderBefore(key) {
        if (key) {
            return this.#draw.callbackRenderBefore.has(key);
        }
        return this.#draw.callbackRenderBefore.size > 0;
    }

    setRenderBefore(key, callback) {
        if (!callback || typeof callback !== 'function') return;

        if (!this.hasRenderBefore(key)) {
            this.#draw.callbackRenderBefore.set(key, [callback]);
            return;
        }

        this.#draw.callbackRenderBefore.get(key).push(callback);
    }

    removeRenderBefore(key) {
        this.#draw.callbackRenderBefore.delete(key);
    }

    exeRenderBefore(renderer, scene, camera) {
        const values = this.#draw.callbackRenderBefore.values();
        for (const callbackList of values) {
            for (const callback of callbackList) {
                callback(renderer, scene, camera);
            }
        }
    }

    hasUpdateBefore(key) {
        if (key) {
            return this.#update.callbackUpdateBefore.has(key);
        }
        return this.#update.callbackUpdateBefore.size > 0;
    }

    setUpdateBefore(key, callback) {
        if (!callback || typeof callback !== 'function') return;

        if (!this.hasUpdateBefore(key)) {
            this.#update.callbackUpdateBefore.set(key, [callback]);
            return;
        }

        this.#update.callbackUpdateBefore.get(key).push(callback);
    }

    removeUpdateBefore(key) {
        this.#update.callbackUpdateBefore.delete(key);
    }

    exeUpdateBefore(curTime) {
        const values = this.#update.callbackUpdateBefore.values();
        for (const callbackList of values) {
            for (const callback of callbackList) {
                callback(curTime);
            }
        }
    }

    createExecuteCommand() {
        const self = this;
        if (!self.getExecuteCommand()) {
            self.#process.appCommand = new UAppCommand(self);
        }
        const appCommand = self.getExecuteCommand();

        if (!defined(self.#process.executeMainCommandList)) {
            self.#process.executeMainCommandList = [];
            self.#process.executeMainCommandList.index = self.#process.executeMainCommandList.index || 0;
            self.addExecuteCommand('executeImageProcess_', appCommand.executeImageProcess_, UDEF.APP_COMMAND_TPYE.MAIN);
            self.addExecuteCommand('executeHeightProcess_', appCommand.executeHeightProcess_, UDEF.APP_COMMAND_TPYE.MAIN);
        }
        if (!defined(self.#process.executeCommandList)) {
            self.#process.executeCommandList = [];
            self.#process.executeCommandList.index = self.#process.executeCommandList.index || 0;

            self.addExecuteCommand('executeImageLayer_', appCommand.executeImageLayer_);
            self.addExecuteCommand('executeHeightLayer_', appCommand.executeHeightLayer_);

            self.addExecuteCommand('executeModelProcess_', appCommand.executeModelProcess_);
            self.addExecuteCommand('executeModelLayer_', appCommand.executeModelLayer_);

            self.addExecuteCommand('executeCustomProcess_', appCommand.executeCustomProcess_);

            self.addExecuteCommand('executeEtcProcess_', appCommand.executeEtcProcess_);
            self.addExecuteCommand('executeEtcLayer_', appCommand.executeEtcLayer_);
        }
    }

    getExecuteCommand() {
        return this.#process.appCommand;
    }

    /**
     * 등록된 메인 작업의 프레임 갱신을 수행합니다.
     * 실행 주기를 기다리거나 작업 목록이 없으면 false를 반환합니다.
     * 선택한 콜백은 앱 명령 객체를 this로 사용하며, 콜백의 예외는 호출자에게 전달합니다.
     *
     * @param {number} curTime 프레임 시각(ms)
     * @returns {boolean} 선택한 작업의 호출을 마쳤는지 여부
     *
     * @ignore
     */
    updateWorkFrame(curTime) {
        UDEF.saveUUID();

        // 실행 시점만 내부 정책으로 판정하고, 대기 통계와 실행 시각의 반영은 이 진입점에서 유지한다.
        if (!INTERNAL.isWorkFrameDue(this.#frame, curTime)) {
            this._uwStats.check(1000);
            return false;
        }
        this.#frame.updateWorkFrameTime = curTime;

        const self = this;
        const appCommand = self.getExecuteCommand();
        const option = self.getInstanceClassifiedLayers();

        if (!defined(self.#process.executeMainCommandList))
            return false;

        const execList = /** @type {U3dAppCommandQueue<executeCommandParam>} */ (self.#process.executeMainCommandList);
        // 순환 순번으로 작업을 선택하되, 공개 콜백의 receiver와 호출 순서는 그대로 유지한다.
        const command = INTERNAL.takeNextCommand(execList);
        command.callback.call(appCommand, curTime, option);
        // 정상 호출을 마친 경우에만 다음 순환을 정리한다. 예외 경로에는 새 복구 처리를 추가하지 않는다.
        INTERNAL.finishCommandCycle(execList);

        self._uwStats.update(1000);
        return true;
    }

    updateLayerFrame(curTime) {
        // 실행 시점만 내부 정책으로 판정하고, 대기 통계와 실행 시각의 반영은 이 진입점에서 유지한다.
        if (!INTERNAL.isLayerFrameDue(this.#frame, curTime)) {
            this._ulStats.check(1000);
            return false;
        }
        this.#frame.updateLayerFrameTime = curTime;

        const self = this;
        const appCommand = self.getExecuteCommand();
        const option = self.getInstanceClassifiedLayers();

        if (!defined(self.#process.executeCommandList))
            return false;

        if (self.hasUpdateBefore()) {
            self.exeUpdateBefore(curTime);
        }

        const execList = /** @type {U3dAppCommandQueue<executeCommandParam>} */ (self.#process.executeCommandList);
        // 갱신 전 콜백 뒤에 이번 순번의 작업을 실행하며, 등록된 앱 명령 객체를 receiver로 유지한다.
        const command = INTERNAL.takeNextCommand(execList);
        command.callback.call(appCommand, curTime, option);
        // 콜백이 변경한 목록 길이와 순번을 기준으로 다음 순환을 정리한다.
        INTERNAL.finishCommandCycle(execList);

        self._ulStats.update(1000);
        return true;
    }

    addExecuteCommand(id, callback, type = UDEF.APP_COMMAND_TPYE.SUB) {
        let list;
        if (type === UDEF.APP_COMMAND_TPYE.MAIN) {
            list = this.#process.executeMainCommandList;
        } else if (type === UDEF.APP_COMMAND_TPYE.SUB) {
            list = this.#process.executeCommandList;
        }
        if (list) {
            let object = list.find(function (item) {
                return item.id === id;
            });

            if (!defined(object)) {
                list.push({id: id, callback: callback});
                return true;
            }
        }
        return false;
    }

    removeExecuteCommand(id) {
        let object = this.#process.executeCommandList.find(function (item) {
            return item.id === id;
        });

        if (defined(object)) {
            let index = this.#process.executeCommandList.indexOf(object);
            this.#process.executeCommandList.splice(index, 1);
            return true;
        }

        object = this.#process.executeMainCommandList.find(function (item) {
            return item.id === id;
        });

        if (defined(object)) {
            let index = this.#process.executeMainCommandList.indexOf(object);
            this.#process.executeMainCommandList.splice(index, 1);
            return true;
        }

        return false;
    }

    setCameraTargetType(isTarget) {
        this.#overview.camTargetType = isTarget;
    };

    getCameraTargetType() {
        return this.#overview.camTargetType;
    };

    /**
     * 지도화면 밝기 값을 반환합니다.
     * @returns {number} 화면 밝기 factor
     */
    getIntensityLight() {
        return this.#env.intensityLight;
    };

    /**
     * 지도화면 밝기 설정 함수
     * @param {number} intensity 화면 밝기 factor
     * @returns {boolean} 정상 동작 여부
     */
    setIntensityLight(intensity = DEFAULT_ENV_INTENSITY) {
        const light = this.getLight();
        if (!light) return false;

        this.#env.intensityLight = intensity;
        light.setIntensityEnviLight(intensity);
        return true;
    };

    /**
     * 지도화면 태양 밝기 값을 반환합니다.
     * @returns {number} 화면 밝기 factor
     */
    getIntensitySunLight() {
        return this.#env.intensitySunLight;
    };

    /**
     * 지도화면 태양 밝기 설정 함수
     * @param {number} intensity 화면 밝기 factor
     * @returns {boolean} 정상 동작 여부
     */
    setIntensitySunLight(intensity = DEFAULT_MAX_SUN_INTENSITY) {
        const light = this.getLight();
        if (!light) return false;

        this.#env.intensitySunLight = intensity;
        light.setIntensitySuniLight(intensity);
        return true;
    };

    createLight(size, drawArg) {
        if (!defined(drawArg))
            return undefined;
        const self = this;

        if (!defined(self._scene)) {
            console.warn('creating light failed. because scene is not null');
            return undefined;
        }

        self.#env.light = new ULight({
            drawarg: drawArg,
            intensityEnv: self.getIntensityLight(),
            intensitySun: self.getIntensitySunLight()
        });
        return self.#env.light;
    };

    getVertexLevel() {
        return this.#world.vertexlevel;
    }

    getSegVertex() {
        return this.#world.segVertex;
    };

    /**
     * 시간에 따른 태양 정보(위치/일조량 등)를 설정하는 함수
     * @param {Date} date 설정 시간
     * @ignore
     */
    setTimeSun(date) {
        const self = this;
        if (!defined(date))
            date = self._curtime;

        self._curtime = date;
        UDEF.setDateFormat(self._curtime);

        const sky = self.getSky();
        const light = self.getLight();
        if (light && sky) {
            const geo = self.getCameraGeographicTargetPoint();
            sky.setTime(date, geo.x, geo.y);
        }
    };

    /**
     * 현재 시간을 반환하는 함수
     * @returns {object}
     * @example Tue Jun 27 2023 17:47:38 GMT+0900 (한국 표준시)
     */
    getTimeSun() {
        return this._curtime;
    };

    getLight() {
        return this.#env.light;
    };

    /**
     * 태양 플레어 효과를 설정하는 함수
     * @param {boolean} show 출력 / 비출력 여부
     */
    setSunFlare(show) {
        const self = this;
        self._useSunFlare = show;
        UDEF.setUseSunFlare(show);
        if (self._useSunFlare === true && self.getLight()) {
            if (!self._sunFlare) self.createSunFlare();
        } else if (self._sunFlare) {
            self._sunFlare.material.uniforms.enabled.value = false;
            self.getScene().remove(self._sunFlare);
            UDEF.disposeObject3D(self._sunFlare);
            self._sunFlare = undefined;
        }
    }

    createSunFlare() {
        const self = this;
        const light = self.getLight();
        if (!light || !self._renderer.shadowMap)
            return;

        const sunPosition = new THREE.Vector3();
        sunPosition.set(
            light._sunPosition.x,
            light._sunPosition.y,
            light._sunPosition.z
        )
        const lensOpacity = self.isPostProcess() ? 0.4 : 1.0;
        const lens = new ULensFlare(true, sunPosition, lensOpacity);
        lens.renderOrder = Infinity;
        lens.material.onBeforeRender = lens.material.onBeforeRender.bind(self, self._renderer, self._scene, self._camera);
        self._scene.add(lens);
        self._sunFlare = lens;
    }

    /**
     * 태양 플레어 효과를 설정 여부를 리턴하는 함수
     * @returns {boolean} 태양 플레어 효과를 설정 여부
     */
    getSunFlare() {
        return this._useSunFlare;
    }

    /**
     * 일조량 분석 결과 초기화 함수
     *
     * @ignore
     */
    endAnalySunAmount() {
        const self = this;
        const light = self.getLight();
        const analy = this.getAnalysis('SunAmount');
        analy?.clear?.();

        // if (light) {
        //     const removeMeshGroup = light._sunAmountDrawMesh;
        //     for (let i = 0; i < removeMeshGroup.length; i++) {
        //         for(let mesh of removeMeshGroup[i].children) {
        //             mesh.geometry.dispose();
        //             mesh.material.dispose();
        //         }
        //         self._scene.remove(removeMeshGroup[i]);
        //     }
        //     light._sunAmountDrawMesh = [];
        //     sharedGeometry = undefined;
        //     sharedMaterials = {};
        // }
    };

    /**
     * 일조량 분석 mesh들을 반환 하는 함수
     * @returns {Array<import('@UMesh').UMesh | undefined>}  일조량 분석 mesh 목록
     *
     * @ignore
     */
    getSunAmountDrawMeshes() {
        const self = this;
        const light = self.getLight();
        if (defined(light)) {
            return light._sunAmountDrawMesh
        } else {
            return [];
        }
    }

    /**
     * 분석 mesh 이름을 파라미터로 받아 해당하는 mesh를 제거하는 함수
     * @param {string} name 제거할 분석 mesh 이름
     * @ignore
     */
    removeAnalySunAmount(name) {
        const self = this;
        const analy = self.getAnalysis("SunAmount");
        if (!defined(analy)) return;

        analy.removeSunAmountByName(name);

        // const light = self.getLight();
        // if (defined(name) && light) {
        //     let cubeMeshGroup = light._sunAmountDrawMesh;
        //     for (let i=0; i< cubeMeshGroup.length; i++) {
        //         if(cubeMeshGroup[i].name === name) {
        //             for(let mesh of cubeMeshGroup[i].children) {
        //                 mesh.geometry.dispose();
        //                 mesh.material.dispose();
        //             }
        //             self._scene.remove(cubeMeshGroup[i]);
        //             cubeMeshGroup.splice(i, 1);
        //             break;
        //         }
        //     }
        //
        //     if(light._sunAmountDrawMesh.length === 0){
        //         sharedGeometry = undefined;
        //         sharedMaterials = {};
        //     }
        //
        //     //
        //     // for(let cube of  cubeMeshGroup) {
        //     //     if(cube.name === name) {
        //     //         self._scene.remove(cube);
        //     //         break;
        //     //     }
        //     // }
        // }
    }

    /**
     * 입력한 시간,위치에 그림자가 드는지 계산하는 함수
     * @param {Date} date Date객체
     * @param {GeoPosition} position 계산할 위치 - 위경도 Object ex) {x: 127, y:36, z:10}
     * @returns {boolean} 그림자 여부
     *
     * @ignore
     */
    isShadowAtTime(date, position) {
        const self = this;
        const light = self.getLight();
        if (light) {
            return light.isShadowAtTime(date, position);
        }
        return false;
    }

    setSunTargetPoint(point) {
        const self = this;
        const light = self.getLight();
        if (light && point) {
            light._targetPoint = point;
            return true;
        } else {
            return false;
        }
    }

    getSunAmountParam() {
        const self = this;
        const light = self.getLight();

        if (light) {
            return light.getParam();
        }
    };

    setShadow(enable) {
        const self = this;
        const renderer = self._renderer;
        if (!renderer)
            return false;

        const light = self.getLight();
        if (enable) {
            if (light && light.isShadowEnable() === false) {
                light.setShadow(true);
                renderer.shadowMap.enabled = true;

                //버전업으로 수정됨
                //renderer.outputEncoding = THREE.LinearEncoding;

                //속도에 영향끼치는 옵션
                // renderer.physicallyCorrectLights = true;
                //속도에 영향끼치는 옵션
                //renderer.shadowMap.type  = THREE.BasicShadowMap; // 제일 빠른거
                //renderer.shadowMap.type  = THREE.PCFShadowMap;
                renderer.shadowMap.type = UDEF.getShadowMapType();
            }

        } else {
            if (light && light.isShadowEnable() === true) {
                light.setShadow(false);
            }

            renderer.shadowMap.enabled = false;
        }
    }

    /**
     * 일조권 측정 모드로 전환하는 함수
     * @param {boolean} [active=true] 일조권 측정 모드 활성화 여부 [ true : 활성 / false : 비활성 ]
     */
    setSunShineMode(active = true) {
        const self = this;

        if (active) {
            self.setShadow(true);
        } else {
            if (!self._useShadowMap) {
                self.setShadow(false);
            }
        }
    }

    /**
     * 지도 그림자 설정 함수 <br>
     * true로 설정하면 지도 화면에 광원에 따른 지형 및 모델의 그림자가 표현된다.
     * @param {boolean} enable 그림자 설정 여부 (true면 설정, false면 설정하지 않는다.)
     */
    enableShadowMap(enable) {
        const self = this;
        const renderer = self._renderer;
        if (!renderer)
            return false;

        self.setShadow(enable);
        self._useShadowMap = enable; //api 사용만으로 그림자를 따로 제어 할 수 있기 때문에 app 속성을 변경해 준다.

        return true;
    };

    /**
     * 그림자를 사용하고 있는지 여부를 리턴하는 함수
     * @returns {boolean} 그림자 사용 여부
     */
    isUseShadow() {
        return this._useShadowMap;
    };

    /**
     * app의 scene을 반환하는 함수
     * @returns {import('@UScene').UScene} scene
     */
    getScene() {
        return this._scene;
    };

    getRenderGroup() {
        return this.#draw.renderGroup;
    };

    /**
     * 외부 THREE.js object를 랜더링 하는 Scene을 반환하는 함수
     * @returns {import('@UScene').UScene} scene
     */
    getExternalScene() {
        return this.#draw.externalScene;
    };

    /**
     * app의 scene을 생성하는 함수
     * @return {import('@UScene').UScene} scene
     *
     * @ignore
     */
    createScene() {
        this._scene = new UScene({name: UDEF.RENDER_TYPE.SCENE});
        this._scene.renderOrder = 0;

        this.#draw.renderGroup = new UGroup({name: UDEF.RENDER_TYPE.GROUP});
        this.#draw.renderGroup.add(new UGroup({name: UDEF.RENDER_TYPE.MODEL}));
        this.#draw.renderGroup.add(new UGroup({name: UDEF.RENDER_TYPE.TERRAIN}));
        this.#draw.renderGroup.add(new UGroup({name: UDEF.RENDER_TYPE.ANALY}));
        this.#draw.renderGroup.add(new UGroup({name: UDEF.RENDER_TYPE.CUSTOM}));

        this.#draw.externalScene = new UScene({name: UDEF.RENDER_TYPE.USER});
        this.#draw.renderGroup.add(this.#draw.externalScene);

        this._scene.add(this.#draw.renderGroup);
        return this._scene;
    };

    /**
     * 주석(Comment) 전용 Scene을 반환합니다. <br>
     * 지형이나 모델에 가려지지 않고 항상 위에 그려져야 하는 객체를 이 Scene에 추가합니다.
     *
     * @returns {import('@UScene').UScene | undefined} 주석 전용 Scene
     *
     * @example
     * app.getSceneComment().add(markerGroup);
     */
    getSceneComment() {
        return this._sceneComment;
    }

    getCommentRenderGroup() {
        return this.#draw.commentRenderGroup;
    }

    /**
     * app의 sceneComment를 생성하는 함수
     * @return {import('@UScene').UScene} app의 sceneComment
     * @ignore
     */
    createSceneComment() {
        this._sceneComment = new UScene({name: 'CommentRenderScene'});
        this._sceneComment.renderOrder = 999999999;
        this._sceneComment.autoClear = false;

        this.#draw.commentRenderGroup = new UGroup({name: 'CommentRenderGroup'});
        this._sceneComment.add(this.#draw.commentRenderGroup);

        return this._sceneComment;
    };

    /**
     * 프로세스 메니져 객체를 반환하는 함수
     * @return {import('@union3d/manager/UProcessManager').UProcessManager} 프로세스 메니져 객체
     *
     * @ignore
     */
    getProcessManager() {
        return this.#manager.processManager;
    }

    getIndexManager() {
        return this.#manager.indexManager;
    }

    /**
     * @returns {import('@union3d/manager/UTestManager').UTestManager}
     */
    getTestManager() {
        return this.#manager.testManager;
    }

    /**
     * @description 고도가 업데이트 될때 입력한 위치의 고도값을 추출해 입력한 함수를 실행시켜 준다
     * @param {number} x  업데이트할 위치의 x (월드좌표)
     * @param {number} y  업데이트할 위치의 y (월드좌표)
     * @param {import('three').Object3D} object  업데이트 할 객체
     * @param {Function} updateFnc  업데이트 시 실행 함수, 함수의 파라메터로 입력되는 값과 그 순서 updateFnc(object, tile, 고도값)
     *
     * @ignore
     */
    addAutoHeightUpdate(x, y, object, updateFnc) {
        this.getIndexManager().insertAtPoint(
            x, y, object, updateFnc, U3dEvent.MESH.UPDATE_HEIGHT_MESH
        )
    }

    /**
     * @param {number} x  addAutoHeightUpdate로 등록된 업데이트할 위치의 x (월드좌표)
     * @param {number} y  addAutoHeightUpdate로 등록된업데이트할 위치의 y (월드좌표)
     * @param {import('three').Object3D} object addAutoHeightUpdate로 등록된 업데이트 할 객체
     *
     * @ignore
     */
    removeAutoHeightUpdate(x, y, object) {
        this.getIndexManager().removeAtPoint(
            x, y, object, U3dEvent.MESH.UPDATE_HEIGHT_MESH
        )
    }

    /**
     * @description 고도가 로드되었을때 addAutoHeightUpdate로 등록된 업데이트 함수를 실행시켜주는 함수, 고도가 로드되었을때 실행된다.
     *
     * @param {event} event  U3dQuadSet이 initialize 할때 tile loaded 이벤트에 등록 시킨다
     *
     * @ignore
     */
    execAutoHeightUpdate(event) {
        const tile = event.data;

        if (!tile || (tile._childTiles && tile._childTiles?.length !== 0) || !tile.isHeightLoaded()) {
            return;
        }

        const boundingBox = tile.getBoundingbox();
        const results = this.getIndexManager().search(
            boundingBox.min.x, boundingBox.min.y, boundingBox.max.x, boundingBox.max.y, U3dEvent.MESH.UPDATE_HEIGHT_MESH);
        //!!데이터 정리를 위해 순회하는 함수 concat등의 함수를 안쓰고 그냥 [[],[],[]] 구조로 리턴된다
        for (let result of results) {
            for (let item of result) {
                if (item.level && item.level === tile._rlevel) {
                    continue;
                }
                item.level = tile._rlevel;
                item.value(item.key, tile, tile.getHeightAtPoint(item.minX + 0.5, item.minY + 0.5)); //확인됨. 타일z (3857스케일) 그대로 넣는다.
            }
        }
    }

    /**
     * app의 렌더링 대상 컨테이너를 반환하는 함수
     * @returns {HTMLElement | null} 렌더링 대상 컨테이너 DOM 요소. 컨테이너를 찾지 못하면 `null`
     */
    getContainer() {
        return this._container
    }

    /**
     * 오버뷰를 반환하는 함수
     * @returns {import('@union3d/core/U3dOverviewMap').U3dOverviewMap} 오버뷰 객체 (인덱스 맵)
     */
    getOverviewMap() {
        return this._overviewmap;
    };

    /**
     * 오버뷰를 생성하는 함수
     * @param {import('@union3d/core/U3dOverviewMap').U3dOverviewMap} idoverview 오버뷰 아이디
     * @returns {boolean}
     */
    createOverviewMap(idoverview) {
        if (!defined(idoverview))
            return false;

        this._overviewmap = new U3dOverviewMap({
            app: this,
            drawarg: this._drawArg,
            idoverview: idoverview
        });
        return true;
    };

    /**
     * AutoClear 설정을 반환하는 함수
     * @returns {boolean} AutoClear 여부
     */
    isAutoClear() {
        return this._autoClear;
    }

    /**
     * AutoClear 옵션을 설정하는 함수
     * @param {boolean} autoClear 설정할 AutoClear 옵션
     */
    setAutoClear(autoClear) {
        this._autoClear = autoClear;
    }

    getDrawFps() {
        return this.#frame.drawFps;
    };

    /**
     * 일반 렌더링 FPS를 엔진 상한 이내로 설정합니다.
     * 유한한 양수가 아니면 기존 설정을 유지합니다.
     * @param {number} fps 설정할 초당 프레임 수
     * @returns {void} 반환값 없음
     */
    setDrawFps(fps) {
        if (!Number.isFinite(fps) || fps <= 0) return;

        fps = Math.min(fps, this.#frame.drawMaxFps);
        this.#frame.drawFrameUnit = (1000 / fps);
        this.#frame.drawFps = fps;
    };

    getIdleDrawFps() {
        return this.#frame.drawIdleFps;
    };

    /**
     * 유휴 렌더링 FPS를 엔진 상한 이내로 설정합니다.
     * 유한한 양수가 아니면 기존 설정을 유지합니다.
     * @param {number} fps 설정할 초당 프레임 수
     * @returns {void} 반환값 없음
     */
    setIdleDrawFps(fps) {
        if (!Number.isFinite(fps) || fps <= 0) return;

        fps = Math.min(fps, this.#frame.drawMaxFps);
        this.#frame.drawIdleFrameUnit = (1000 / fps);
        this.#frame.drawIdleFps = fps;
    };

    isIdleDraw() {
        return this.#frame.isIdleDraw;
    }

    getUpdateFps() {
        return this.#frame.updateFps;
    };

    setUpdateFps(fps) {
        this.#frame.updateFrameUnit = 1000 / fps;
        this.#frame.updateFps = fps;
    };

    /**
     * 일정시간동간 렌더링 작업상태를 WORK 상태로 변경한다.
     * @param {number} workTime WORK 상태를 유지할 프래임 수, 20 입력시 20프레임 동안 WORK 상태 유지
     */
    drawWork(workTime) {
        if (!workTime) workTime = this.#frame.drawIdleFrameCount;

        if (this.#frame.drawIdleFrame < workTime)
            this.#frame.drawIdleFrame = workTime;

        this.#frame.drawIdleFrame = workTime;
    }

    /**
     * 렌더링 작업 속도를 기본 속도보다 빠르게 설정합니다.
     *
     * @example
     * app.drawFast();
     */
    drawFast() {
        this.setDrawSpeed(UDEF.IDLE_DRAW_SPEED.FAST);
    }

    /**
     * 렌더링 작업 속도를 기본 속도로 설정합니다.
     *
     * @example
     * app.drawDefault();
     */
    drawDefault() {
        this.setDrawSpeed(UDEF.IDLE_DRAW_SPEED.DEFAULT);
    }

    /**
     * 렌더링 작업 속도를 기본 속도보다 느리게 설정합니다.
     *
     * @example
     * app.drawSlow();
     */
    drawSlow() {
        this.setDrawSpeed(UDEF.IDLE_DRAW_SPEED.SLOW);
    }

    setDrawSpeed(speed = UDEF.IDLE_DRAW_SPEED.DEFAULT) {
        this.#frame.drawIdleSpeed = speed;

        if (this.#frame.drawIdleSpeed >= UDEF.IDLE_DRAW_SPEED.FAST) {
            this.#frame.drawIdleFrameUnit = this.#frame.drawFrameUnit;
        } else {
            this.#frame.drawIdleFrameUnit = (1000 / this.#frame.drawIdleFps) / this.#frame.drawIdleSpeed;
        }
    }

    getDrawSpeed() {
        return this.#frame.drawIdleSpeed;
    }

    start(time) {
        const self = this;
        if (!defined(time))
            time = 0;

        setTimeout(function () {
            if (!self._renderer) {
                self.start(1000);
            } else {
                self._renderer.setAnimationLoop(self.renderFrame.bind(self));
            }
        }, time);
    };

    #updateShadowFrame() {
        const layers = this.getLayers();
        if (layers.length === 0) return;

        // 표시 중이며 그림자 갱신을 허용한 레이어를 갱신하고, 다음 프레임의 순회 위치를 보관한다.
        INTERNAL.updateShadowLayers(layers, this.#frame);
    }

    #setDrawTickFrame() {
        const self = this;
        self.#frame.drawReadyFrame = 0;
        self.#frame.drawReadyList = [];

        // 애니메이션·동영상·환경 효과의 준비 작업을 등록한다. 작업은 실행 시점의 앱 상태를 참조한다.
        INTERNAL.configureDrawReadyStages(self.#frame, self, clock2);
    }

    isFrameMove() {
        if (!defined(this._camera))
            return false;

        return this.positionX_ !== this._camera.position.x
            || this.positionY_ !== this._camera.position.y
            || this.positionZ_ !== this._camera.position.z
            || this.rotationX_ !== this._camera.rotation.x
            || this.rotationY_ !== this._camera.rotation.y
            || this.rotationZ_ !== this._camera.rotation.z;
    }

    frameMove() {
        let self = this;

        if (!self.isFrameMove())
            return false;

        this.positionX_ = this._camera.position.x;
        this.positionY_ = this._camera.position.y;
        this.positionZ_ = this._camera.position.z;
        this.rotationX_ = this._camera.rotation.x;
        this.rotationY_ = this._camera.rotation.y;
        this.rotationZ_ = this._camera.rotation.z;

        self.updateFrustum();

        return true;
    };

    renderFrame(delta) {
        const self = this;
        self._rStats.update(1000, true);
        self.#manager.processManager?._recordFrame(delta);

        if (!self.isInitialized())
            return;

        if (self.isDisposed() || self.getStopRender())
            return;

        let isDrawTiming = false;
        if (self.frameMove()) {
            self.#frame.drawIdleFrame = self.#frame.drawIdleFrameCount;
            self.#frame.updateShadowFrameTime = delta;
        }

        // 이번 프레임의 그리기 여부·모드를 판정하고, 선택된 모드의 공개 관찰 상태는 여기서 반영한다.
        const drawMode = INTERNAL.getDrawFrameMode(this.#frame, delta);
        if (drawMode === 'active') {
            self.#frame.drawIdleFrame--;
            self.#frame.isIdleDraw = false;
            isDrawTiming = true;
        } else if (drawMode === 'idle') {
            self.#frame.isIdleDraw = true;
            isDrawTiming = true;
        }

        self.#updateShadowFrame();

        if (!isDrawTiming) {
            self.#drawTickFrame(delta);
            self._dStats.check(1000, self.isIdleDraw(), self.#domFpsFrame);
            return false;
        }

        // self._animationManager.setTimeStamp?.(performance.now());
        this.#drawTickFrame(delta, true);

        self.draw();

        self.#frame.drawReadyFrame = 0;
        self.#frame.drawFrameTime = delta;

        self._dStats.update(1000, self.isIdleDraw(), self.#domFpsFrame);

        self.#canvasLoadingFrame();
    }

    #drawTickFrame(delta, all) {
        this.updateFrame(delta);
        this.updateWorkFrame(delta);
        this.updateLayerFrame(delta);
        this.tweenFrame(delta);

        // 기본 업데이트 뒤 등록된 준비 작업을 실행한다. 분할 실행은 다음 작업 위치를 갱신한다.
        INTERNAL.runDrawReadyStages(this.#frame, delta, all);
    }

    updateFrame(delta) {
        // 갱신 주기를 판정한 뒤 데이터 변경 확인과 실제 업데이트 호출은 공개 흐름에 남긴다.
        if (!INTERNAL.isAppFrameDue(this.#frame, delta)) {
            this._uStats.check(1000, true);
            return;
        }

        this.#frame.updateFrameTime = delta;

        const updateData = this.getLastUpdateDate() !== this.getUpdateDate();

        if (!this.isIdleDraw() || updateData) {
            this._appUpdate3d = false;
            this.update();
            this._uStats.update(1000, true);
            // 쿼드타일 순회 검색 => 일해야 되는 타일을 찾아낸다  => 찾아낸 일해야 되는 타일을 app._mastProcess 인큐
        } else {
            this._uStats.check(1000, true);
        }
    }

    tweenFrame(delta) {
        // 트윈 갱신 시점만 내부 정책으로 결정하며 실제 라이브러리 호출과 시각 반영은 유지한다.
        if (!INTERNAL.isTweenFrameDue(this.#frame, delta)) {
            return;
        }

        this.#frame.tweenFrameTime = delta;

        TWEEN.update();
    }

    #domFpsFrame = (frame) => {
        const dom = this.#domFps;
        if (!dom) return;

        dom.textContent = `FPS ${frame.toFixed(0)}`;
    };

    #canvasLoadingFrame() {
        if (this.#debug.loadingUserTotal === 0 && this.#debug.loadingNow > 300 && this.#debug.loadingTotal > 300) {
            this.#debug.loadingNow = this.#debug.loadingNow - 300;
            this.#debug.loadingTotal = this.#debug.loadingTotal - 300;
        }
        const total = (this.#debug.loadingTotal + this.#debug.loadingUserTotal) || 1;
        const now = this.#debug.loadingNow + this.#debug.loadingUserNow;
        let loadingRate = now / total;
        if (loadingRate > 1) loadingRate = 1;

        let isChange = this.#debug.loadingRate !== loadingRate;
        if (!isChange && this.#debug.loadingFrame === 0)
            return;

        this.#debug.loadingRate = loadingRate;

        if (loadingRate === 1) {
            if (this.#debug.loadingFrame === this.#debug.loadingDelayCount) {
                if (this.#debug.canvasLoading && (this.#debug.canvasLoadingVisible || this.#debug.loadingUserTotal !== 0)) {
                    this.#debug.canvasLoadingContext?.clearRect(0, 0, this.#debug.canvasLoading.width, this.#debug.canvasLoading.height);
                }
                this.clearUserLoading();
                this.clearLoadingCount();
                this.#debug.loadingRate = 0;
                return;
            } else {
                this.#debug.loadingFrame++;
            }
        } else {
            this.#debug.loadingFrame = 0;
        }

        if (!this.#debug.canvasLoading || (!this.#debug.canvasLoadingVisible && this.#debug.loadingUserTotal === 0)) return;

        if (isChange) {
            this.#debug.canvasLoadingContext.clearRect(0, 0, this.#debug.canvasLoading.width, this.#debug.canvasLoading.height);
            this.#debug.canvasLoadingContext.fillRect(0, 0, this.#debug.canvasLoading.width * loadingRate, this.#debug.canvasLoading.height);
        }
    }

    /**
     * 스와이프 영역에 출력 설정된 레이어를 리턴합니다.
     * @returns {Map<string, U3dAppCallbackCopyOption>} 레이어 설정 정보
     * */
    getNameSwipeLayers() {
        return this.#draw.nameSwipeLayers;
    }

    /**
     * 스와이프 영역에 출력 될 레이어을 설정합니다.
     * @param {string} name 스와이프 영역에 출력 될 레이어 이름
     * @param {boolean} [isCopy=false] 메인영역에도 함께 출력 될건지의 여부, false 일경우 스와이프영역에만 출력, true 일경우 메인영역과 함께 출력
     * @returns {boolean} 작동 완료 여부
     */
    addNameSwipeLayer(name, isCopy = false) {
        try {
            if (!this.#draw.nameSwipeLayers.has(name))
                this.#draw.nameSwipeLayers.set(name, {copy: isCopy});
            return true;
        } catch (e) {
            __GSError__(e);
        }
        return false;
    }

    /**
     * 스와이프 영역에 출력 설정 된 레이어를 원복합니다.
     * @param {string} name 스와이프 영역에 출력 설정에서 제거될 레이어 이름
     * @returns {boolean} 작동 완료 여부
     */
    removeNameSwipeLayer(name) {
        try {
            if (this.#draw.nameSwipeLayers.has(name)) {
                this.#draw.nameSwipeLayers.delete(name);
            }
            return true;
        } catch (e) {
            __GSError__(e);
        }
        return false;
    }

    /**
     * 스와이프 영역 출력 여부를 리턴합니다.
     * @returns {boolean} 스와이프 영역 출력 여부
     */
    getEnableSwipe() {
        return this.#draw.enableSwipe;
    }

    /**
     * 스와이프 영역 출력 여부를 설정합니다.
     * @param {boolean} [enable=true] 스와이프 영역 출력 여부
     * @returns {boolean} 스와이프 영역 출력 설정 완료 여부
     */
    setEnableSwipe(enable) {
        return this.enableSwipe(enable);
    }

    /**
     * 스와이프 영역 출력 여부를 설정합니다.
     * @param {boolean} [enable=true] 스와이프 영역 출력 여부
     * @returns {boolean} 스와이프 영역 출력 설정 완료 여부
     */
    enableSwipe(enable = true) {
        if (!defined(this._renderer)) {
            __GInfo__(this, '기능을 수행하기 위한 렌더러가 생성되지 않았습니다.', '1288260');
            return false;
        }
        try {
            this._renderer.setScissorTest(enable);
            this.#draw.enableSwipe = enable;
            this.setUpdateDate();
            return true;
        } catch (e) {
            __GError__(this, `스와이프 출력을 설정하는 중 오류가 발생 하였습니다. ${e}`, '1288572');
        }
        return false;
    }

    /**
     * FPS 디버그 정보를 화면에 출력합니다.
     * UDevToolView의 Draw FPS와 같은 측정값을 사용하며, 그리기 통계가 기록될 때 갱신합니다.
     * @param {boolean} [visible=true] FPS 디버그 정보 출력 여부
     * @param {number} [left=1] 화면 좌측부터의 위치 비율 (%)
     * @param {number} [top=1] 화면 상단부터의 위치 비율 (%)
     * @returns {boolean} FPS 디버그 정보 출력 여부
     */
    debugFps(visible = true, left = 1, top = 1) {
        if (!visible) {
            this.#removeFpsDom();
            return false;
        }

        if (this.#domFps) {
            this.#domFps.style.left = `${left}%`;
            this.#domFps.style.top = `${top}%`;
            return true;
        }

        const container = this._container || document.getElementById(this._containername);
        if (!container) return false;

        if (getComputedStyle(container).position === 'static')
            container.style.position = 'relative';

        const dom = document.createElement('div');
        dom.id = 'u3d-fps';
        dom.textContent = 'FPS --';
        dom.style.cssText = `position:absolute;left:${left}%;top:${top}%;z-index:999999;pointer-events:none;background:rgba(0,0,0,0.55);color:#fff;font:14px Arial;padding:4px 8px;`;
        container.appendChild(dom);
        this.#domFps = dom;

        return true;
    }

    #removeFpsDom() {
        if (!this.#domFps) return;

        this.#domFps.remove();
        this.#domFps = undefined;
    }

    /**
     * 지도 조작을 담당하는 컨트롤 객체를 반환합니다.
     *
     * @returns {import('@union3d/mode/UMapControls').UMapControls | undefined} 지도 컨트롤 객체
     *
     * @example
     * app.getMapControl().getFactor().maxDistance = 10200000;
     */
    getMapControl() {
        return this._mapControl;
    }

    getLodingDom() {
        if (this.#debug.canvasLoading)
            return;

        return this.#debug.canvasLoading.parentElement;
    }

    /**
     * GeOnDT for JS 의 메모리 및 작업 상태, 프레임 상태 등을 화면에 출력합니다.
     * @param {string} [id='loading-canvas'] 출력할 캔버스의 DOM ID 입니다.
     */
    createLoadingCanvas(id = 'loading-canvas') {
        if (this.#debug.canvasLoading) {
            this.setVisibleLoading(true);
            const div = this.#debug.canvasLoading.parentElement;
            if (div)
                div.id = id;
            return;
        }

        const divNew = document.createElement('div');
        divNew.id = id;
        divNew.style = `position:absolute; bottom:0px; width:100%; height:7px;overflow:hidden;`;
        divNew.addEventListener('contextmenu', function (e) {
            e.preventDefault();
        });
        const self = this;
        self.#debug.canvasLoading = document.createElement('canvas');
        self.#debug.canvasLoading.style = `width:100%; height:100%;float:left;`;

        divNew.appendChild(self.#debug.canvasLoading);
        document.getElementById(self._container.id).appendChild(divNew);

        self.#debug.canvasLoadingContext = self.#debug.canvasLoading.getContext('2d');
        self.#debug.canvasLoadingContext.fillStyle = self.#debug.canvasLoadingColor;
        self.setVisibleLoading(true);

        self.#debug.canvasLoading.eventKey = self.on(self.constructor.EVENT.LOADED, () => {
            if (self.#debug.loadingTotal || self.#debug.loadingNow)
                self.clearLoadingCount();
        });

        setGlobalFunction('__GLoadingAddTotal__', self.addTotalUserLoading.bind(self));
        setGlobalFunction('__GLoadingAddNow__', self.addNowUserLoading.bind(self));
    }

    removeLoadingCanvas() {
        if (!this.#debug.canvasLoading) return;
        const div = this.#debug.canvasLoading.parentElement;
        this.unkey(this.constructor.EVENT.LOADED, this.#debug.canvasLoading.eventKey);

        this.setVisibleLoading(false);
        this.#debug.canvasLoadingContext = undefined;
        this.#debug.canvasLoading.remove();
        this.#debug.canvasLoading = undefined;

        if (div) div.remove();
    }

    setVisibleLoading(visible = true) {
        this.#debug.canvasLoadingVisible = visible;
        if (!visible) {
            this.#debug.canvasLoadingContext?.clearRect(0, 0, this.#debug.canvasLoading.width, this.#debug.canvasLoading.height);
        }
    }

    addTotalProcessLoading(total = 1) {
        this.#debug.loadingTotal = this.#debug.loadingTotal + total;
        this.#debug.loadingProcessTotal = this.#debug.loadingProcessTotal + total;
    }

    addNowProcessLoading(now = 1) {
        this.#debug.loadingNow = this.#debug.loadingNow + now;
        this.#debug.loadingProcessNow = this.#debug.loadingProcessNow + now;
    }

    addTotalWorkLoading(total = 1) {
        this.#debug.loadingTotal = this.#debug.loadingTotal + total;
        this.#debug.loadingWorkTotal = this.#debug.loadingWorkTotal + total;
    }

    addNowWorkLoading(now = 1) {
        this.#debug.loadingNow = this.#debug.loadingNow + now;
        this.#debug.loadingWorkNow = this.#debug.loadingWorkNow + now;
    }

    addTotalUserLoading(total = 1) {
        this.#debug.loadingUserTotal = this.#debug.loadingUserTotal + total;
    }

    addNowUserLoading(now = 1) {
        this.#debug.loadingUserNow = this.#debug.loadingUserNow + now;
    }

    clearUserLoading() {
        this.#debug.loadingUserNow = 0;
        this.#debug.loadingUserTotal = 0;
    }

    updateLoading() {
        this.#canvasLoadingFrame();
    }

    clearLoadingCount() {
        this.#debug.loadingTotal = 0;
        this.#debug.loadingProcessTotal = 0;
        this.#debug.loadingWorkNow = 0;
        this.#debug.loadingNow = 0;
        this.#debug.loadingProcessNow = 0;
        this.#debug.loadingWorkNow = 0;
    }

    /**
     * 등록된 전체 레이어의 경계 상자를 표시하거나 숨깁니다.
     *
     * @param {boolean} isDebug 경계 상자 표시 여부 (true면 표시, false면 숨김)
     *
     * @example
     * app.debugBound(true);
     * app.debugBound(false);
     */
    debugBound(isDebug) {
        if (isDebug) {
            if (this.hasRenderBefore('appDebugBound')) return;
            this.setRenderBefore('appDebugBound', () => {
                const layers = this.getLayers();
                for (const layer of layers) {
                    if (!layer.debugBound) continue;
                    if (layer.getVisible())
                        layer.debugBound(true);
                    else {
                        layer.debugBound(false);
                    }
                }
            });
        } else {
            const layers = this.getLayers();
            for (const layer of layers) {
                if (layer.debugBound)
                    layer.debugBound(false);
            }
            this.removeRenderBefore('appDebugBound');
        }
    }

    /**
     * 지하 안개 색상을 설정합니다.
     * @param {import('three').ColorRepresentation} color 지하 안개 색상
     */
    setUndergroundFogColor(color) {
        const self = this;
        self._undergroundFogColor = color;
        if (!self._underground) return;
        self._underground.setFogColor(color);
    }

    /**
     * 지하 안개 색상을 리턴합니다.
     * @returns {import('three').ColorRepresentation} 지하 안개 색상
     */
    getUndergroundFogColor() {
        const self = this;
        return self._undergroundFogColor;
    }

    /**
     * 지하 안개 밀도를 설정합니다.
     * @param {number} density 지하 안개 밀도
     */
    setUndergroundFogDensity(density) {
        const self = this;
        self._undergroundFogDensity = density
        if (!self._underground) return;
        self._underground.setFogDensity(density);
    }

    /**
     * 지하 안개 밀도를 리턴합니다.
     * @returns {number} 지하 안개 밀도
     */
    getUndergroundFogDensity() {
        const self = this;
        return self._undergroundFogDensity;
    }

    /**
     * 지하 안개 시작 높이를 설정합니다.
     * @param {number} height 지하 안개 시작 높이
     */
    setUndergroundFogStartHeight(height) {
        const self = this;
        self._undergroundFogStartHeight = height;
        if (!self._underground) return;
        self._underground.setFogStartHeight(height);
    }

    /**
     * 지하 안개 시작 높이를 리턴합니다.
     * @returns {number} 지하 안개 시작 높이
     */
    getUndergroundFogStartHeight() {
        const self = this;
        return self._undergroundFogStartHeight;
    }

    /**
     * 지하 안개 끝 높이를 설정합니다.
     * @param {number} height 지하 안개 끝 높이
     */
    setUndergroundFogEndHeight(height) {
        const self = this;
        self._undergroundFogEndHeight = height;
        if (!self._underground) return;
        self._underground.setFogEndHeight(height);
    }

    /**
     * 지하 안개 끝 높이를 리턴합니다.
     * @returns {number} 지하 안개 끝 높이
     */
    getUndergroundFogEndHeight() {
        const self = this;
        return self._undergroundFogEndHeight;
    }

    createControls() {
        this._controls = {};

        if (!this._camera) {
            __GError__(this, '컨트롤러에 연결될 카메라 객체가 생성되지 않았습니다.', '2595736');
            return;
        }

        this.createMapControls();
        createWalkControls.call(this);
        createFlyControls.call(this);

        this._curControl = this._mapControl;
    }

    createMapControls() {
        const self = this;
        if (defined(self._mapControl)) {
            return;
        }
        const control = new UMapControls({
            drawarg: self._drawArg,
            camera: self._camera,
            domelement: self._container
        });

        //Init Camera State
        self._camera.rotation.set(0, 0, 0);
        self._mapControl = control;
        self._controls['map'] = control;
        initMapControl.call(self, control);
    }

    getDrawBufferHeight() { //GPU
        const renderer = this.getRenderer();
        if (renderer)
            return renderer.getContext().drawingBufferHeight;
        else
            return this._container.clientHeight;
    }

    getDrawBufferWidth() { //GPU
        const renderer = this.getRenderer();
        if (renderer)
            return renderer.getContext().drawingBufferWidth;
        else
            return this._container.clientWidth;
    }

    /**
     * QuadTree level 설정 공통 처리 함수
     * @param {number} level 설정할 level 값
     * @param {string} type 대상 quadTree 타입
     * @param {'setMinLevel' | 'setMaxLevel'} setterName 호출할 setter 함수명
     * @returns {boolean} 적용 여부
     *
     * @ignore
     */
    #setQuadTreeLevel(level, type, setterName) {
        const listQuadtree = this._quadtreeSet?._listQuadtree;
        if (!Array.isArray(listQuadtree) || listQuadtree.length === 0) {
            __GError__('해당 type의 QuadTree가 생성되지 않아 작업이 중단되었습니다.', '1799350');
            return false;
        }

        let applied = false;
        for (let i = 0; i < listQuadtree.length; i++) {
            const quadTree = listQuadtree[i];

            if (quadTree?.getType?.() !== type) continue;
            if (typeof quadTree[setterName] !== 'function') continue;

            quadTree[setterName](level);
            applied = true;
        }
        return applied;
    }

    /**
     * QuadTree의 업데이트 min level을 설정하는 함수
     * QuadTree의 업데이트 대상 최소 레벨을 설정합니다.
     * @param {number} level min level 값
     * @param {string} type 대상 quadTree ( U3dQuadTile : 'terrain', U3dQuadModelTile : 'model')
     * @returns {boolean} 적용 여부
     */
    setMinQuadTreeLevel(level, type = UDEF.TILE_TYPE.TERRAIN) {
        return this.#setQuadTreeLevel(level, type, 'setMinLevel');
    }

    /**
     * QuadTree의 업데이트 max level을 설정하는 함수
     * QuadTree의 업데이트 대상 최대 레벨을 설정합니다.
     * model type의 레이어 생성시 maxlevel이 기본 설정된 (기본값 17) 보다 높을 경우 해당 함수를 호출하여 maxLevel을 높여서 사용을 권장합니다.
     * @param {number} level max level 값
     * @param {string} type 대상 quadTree ( U3dQuadTile : 'terrain', U3dQuadModelTile : 'model')
     * @returns {boolean} 적용 여부
     */
    setMaxQuadTreeLevel(level, type = UDEF.TILE_TYPE.TERRAIN) {
        return this.#setQuadTreeLevel(level, type, 'setMaxLevel');
    }


    /**
     * 앱 설정을 실행 중에 확인하고 바꿀 수 있는 개발 도구(DevTool) 창(View)을 만들어 반환하는 메서드입니다. <br>
     * 창은 앱의 컨테이너 Element 안에 만들어지며 만든 즉시 화면에 표시됩니다. <br>
     * 이미 만든 창이 있으면 새로 만들지 않고 그 창을 그대로 반환합니다. <br>
     * 앱의 컨테이너 Element가 없으면 창을 만들지 않고 undefined를 반환합니다. <br>
     * 반환된 창은 이 앱이 관리하므로 창의 dispose를 직접 호출하지 말고 removeDevToolView로 제거하십시오.
     *
     * @returns {import('@union3d/app/UDevToolView.js').UDevToolView | undefined} 이 앱의 개발 도구 창, 만들 수 없으면 undefined
     */
    createDevToolView() {
        // 이미 있으면 조기 탈출
        if (defined(this.#settingGUI)) {
            return this.#settingGUI;
        }

        if (!this._container) {
            return undefined;
        }

        this.#settingGUI = new UDevToolView(this);

        return this.#settingGUI;
    }

    /**
     * 이 앱에 만들어 둔 개발 도구(DevTool) 창(View)을 새로 만들지 않고 반환하는 메서드입니다. <br>
     * 창을 아직 만들지 않았거나 removeDevToolView로 제거한 뒤에는 undefined를 반환합니다. <br>
     * 창이 없을 때 새로 만들어야 하면 createDevToolView를 사용하십시오.
     *
     * @returns {import('@union3d/app/UDevToolView.js').UDevToolView | undefined} 이 앱의 개발 도구 창, 없으면 undefined
     */
    getDevToolView() {
        return this.#settingGUI;
    }

    /**
     * 이 앱의 개발 도구(DevTool) 창(View)을 해제하고 화면에서 제거하는 메서드입니다. <br>
     * 창에 추가한 탭, 컨트롤러, 그래프와 등록한 갱신 콜백도 함께 사라집니다. <br>
     * 제거한 뒤에는 getDevToolView가 undefined를 반환하며, 다시 필요하면 createDevToolView나 showDevToolView로 새 창을 만드십시오. <br>
     * 창이 없으면 아무 작업도 하지 않습니다.
     */
    removeDevToolView() {
        if (!defined(this.#settingGUI)) return;
        this.#settingGUI.dispose();
        this.#settingGUI = undefined;
    }

    /**
     * 이 앱의 개발 도구(DevTool) 창(View)을 화면에 표시하는 메서드입니다. <br>
     * 창이 없으면 createDevToolView와 같은 방식으로 새 창을 만든 뒤 표시합니다. <br>
     * hideDevToolView로 숨긴 창은 숨기기 전의 구성 그대로 다시 표시합니다.
     */
    showDevToolView() {
        const gui = this.createDevToolView();
        if (!defined(gui)) return;
        gui?.show?.();
    }

    /**
     * 이 앱의 개발 도구(DevTool) 창(View)을 화면에서 숨기는 메서드입니다. <br>
     * 숨긴 창은 구성과 등록한 갱신 콜백을 그대로 유지하므로 showDevToolView로 다시 표시할 수 있습니다. <br>
     * 창이 없으면 아무 작업도 하지 않으며 새 창을 만들지도 않습니다.
     */
    hideDevToolView() {
        this.#settingGUI?.hide?.();
    }

    createApp(opt) {
        return new U3dApp(opt);
    }

    isDisposed() {
        return this._disposed;
    }

    saveJson() {
        return this.getParam();
    }

    /**
     * canvas 화면을 캡쳐하여 스크린샷 이미지를 반환합니다. <br>
     * 기본적으로 WebGL 화면 위에 겹쳐진 DOM 레이어(U3dPOI의 라벨·마커, U3dOverlay 등)도 함께 합성됩니다. <br>
     * DOM 합성에 실패하면 WebGL 화면만 반환합니다. (리소스 제약은 captureDomLayer 참고)
     * @param {Partial<{dom: boolean}>} [opt={}] 캡처 옵션. dom: DOM 레이어 합성 여부, defaultValue(opt.dom, true)
     * @returns {Promise} then의 파라메터로 스크린샷 이미지의 dataURL 문자열 반한
     */
    capture(opt = {}) {
        const self = this;
        const promise = deferred();
        const basePromise = deferred();

        self._renderer.capture(basePromise);

        if (defaultValue(opt.dom, true) === false) {
            basePromise.then(function (baseImageUrl) {
                    promise.resolve(baseImageUrl);
                },
                function (error) {
                    promise.reject(error);
                });
            return promise;
        }

        basePromise.then(function (baseImageUrl) {
            self.#compositeDomLayer(baseImageUrl).then(function (canvas) {
                promise.resolve(canvas.toDataURL('image/png'));
            }).catch(function () {
                promise.resolve(baseImageUrl); //+ DOM 합성 실패 시 WebGL 화면만 반환
            });
        }, function (error) {
            promise.reject(error);
        });

        return promise;
    }

    /**
     * canvas 화면을 캡쳐하여 스크린샷 이미지를 반환합니다. <br>
     * 기본적으로 WebGL 화면 위에 겹쳐진 DOM 레이어(U3dPOI의 라벨·마커, U3dOverlay 등)도 함께 합성됩니다. <br>
     * DOM 합성에 실패하면 WebGL 화면만 반환합니다. (리소스 제약은 captureDomLayer 참고)
     * @param {Partial<{dom: boolean}>} [opt={}] 캡처 옵션. dom: DOM 레이어 합성 여부, defaultValue(opt.dom, true)
     * @returns {Promise} then의 파라메터로 스크린샷 이미지의 Blob 반환
     */
    captureToBlob(opt = {}) {
        const self = this;
        const promise = deferred();

        if (defaultValue(opt.dom, true) === false) {
            self._renderer.captureToBlob(promise);
            return promise;
        }

        const basePromise = deferred();
        self._renderer.capture(basePromise);

        // webGlImageUrl : WebGL 캔버스만 찍은 순수 3D 화면 캡처
        basePromise.then(function (baseImageUrl) {
            self.#compositeDomLayer(baseImageUrl).then(function (canvas) {
                canvas.toBlob(function (blob) {
                    promise.resolve(blob);
                });
            }).catch(function () {
                self._renderer.captureToBlob(promise); //+ DOM 합성 실패 시 기존 동작으로 폴백
            });
        }, function (error) {
            promise.reject(error);
        });

        return promise;
    }

    /**
     * WebGL 캡처 이미지 위에 지도 컨테이너의 DOM 레이어를 합성한 캔버스를 반환합니다.
     * @param {string} baseImageUrl WebGL 캡처 이미지의 dataURL
     * @returns {Promise<HTMLCanvasElement>} 합성된 캔버스
     * @ignore
     */
    #compositeDomLayer(baseImageUrl) {
        const self = this;
        // 이 메서드의 최종 결과(합성 Canvas) 또는 오류를 호출자에게 전달한다.
        const promise = deferred();
        const baseImage = new Image();

        // renderer.capture()가 만든 WebGL dataURL을 먼저 Image로 디코딩해야
        // 이후 2D Canvas에 drawImage()로 그릴 수 있다.
        baseImage.onload = function () {
            const container = self.container();
            //+ DOM은 CSS pixel, WebGL Canvas는 devicePixelRatio가 반영된 buffer pixel을 사용하므로
            //+ 두 레이어의 출력 해상도가 일치하도록 배율을 계산한다.
            const scale = self._renderer.domElement.width / container.clientWidth; //+ WebGL 버퍼 해상도와 일치

            // U3dPOI·U3dOverlay 등 WebGL Scene 밖의 DOM을 투명 Canvas로 래스터화한다.
            captureDomLayer(container, scale).then(function (domCanvas) {
                try {
                    //+ 최종 Canvas는 WebGL 캡처 이미지와 동일한 buffer 크기로 생성한다.
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = baseImage.naturalWidth || baseImage.width;
                    canvas.height = baseImage.naturalHeight || baseImage.height;

                    // 실제 화면의 쌓임 순서와 같게 WebGL을 배경으로 먼저 그리고,
                    // 투명 배경의 DOM Canvas를 그 위에 덮어 하나의 이미지로 합성한다.
                    context.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
                    context.drawImage(domCanvas, 0, 0, canvas.width, canvas.height);
                    promise.resolve(canvas);
                } catch (error) {
                    // 합성 실패는 capture()/captureToBlob()의 WebGL-only 폴백으로 전달된다.
                    promise.reject(error);
                }
            }, function (error) {
                // DOM 래스터화 실패도 동일하게 호출자의 폴백 경로로 전달한다.
                promise.reject(error);
            });
        };
        baseImage.onerror = function (error) {
            // WebGL dataURL 자체를 디코딩하지 못한 경우에는 합성을 진행할 수 없다.
            promise.reject(error);
        };
        // 이벤트 핸들러 등록 후 src를 지정해야 캐시된 이미지의 load 이벤트도 놓치지 않는다.
        baseImage.src = baseImageUrl;

        return promise;
    }

    getSearchType() {
        return UDEF.SEARCH_TYPE;
    }

    /**
     * U3dApp의 작동이 중지된 상태인지 반환합니다.
     * @returns {boolean} 작동 중지 여부
     */
    getStopRender() {
        return this._stopRender;
    }

    /**
     * U3dApp의 작동을 중지 하거나 재게합니다.
     * @param {boolean} stop 작동 중지 / 재게 여부
     */
    setStopRender(stop) {
        this._stopRender = stop;
    }

    /**
     * 모델 이미지 제한 거리를 반환합니다.
     * @returns {number} 설정된 모델 이미지 제한 거리
     */
    getModelImageDistance() {
        return this._modelImageDistance;
    }

    /**
     * 모델 이미지 제한 거리를 설정합니다.
     * @param {number} val 모델 이미지 제한 거리
     */
    setModelImageDistance(val) {
        this._modelImageDistance = val;
    }

    /**
     * 모델 업데이트 중심점을 카메라 앞 혹은 뒤로 이동시키는 _modelUpdateOffset 속성값을 리턴합니다.
     * @returns {number} 모델 업데이트 중심점 이동 값
     */
    getModelUpdateOffset() {
        return this._modelUpdateOffset;
    }

    /**
     * 모델 업데이트 중심점을 카메라 앞 혹은 뒤로 이동시키는 _modelUpdateOffset 속성값을 설정합니다.
     * @param {number} val 모델 업데이트 중심점 이동 값
     */
    setModelUpdateOffset(val) {
        this._modelUpdateOffset = val;
    }

    getModelImageDefaultLevel() {
        return this._modelImageDefaultLevel;
    }

    setModelImageDefaultLevel(val) {
        this._modelImageDefaultLevel = val;
    }

    getMethodHeight() {
        return this._methodHeight;
    }

    setMethodHeight(val) {
        const self = this;
        if (UDEF.HEIGHT_METHOD.NOW === UDEF.HEIGHT_METHOD._1_0) {
            self.removeRenderBefore('DynamicSkirt1_0');
        }

        UDEF.HEIGHT_METHOD.NOW = val;
        self._methodHeight = val;

        if (UDEF.HEIGHT_METHOD.NOW === UDEF.HEIGHT_METHOD._1_0) {
            self.setRenderBefore('DynamicSkirt1_0', () => {
                UHeightSkirt1_0.computeDynamicSkirt(self);
            })
        }
    }

    setBoundingTree(val) {
        if (val) {
            THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
            THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
            UDEF._originRaycast = THREE.Mesh.prototype.raycast
            THREE.Mesh.prototype.raycast = acceleratedRaycast;
            UDEF.BOUNDING_METHOD = UDEF.BOUNDING_TYPE.TREE;
        } else {
            THREE.BufferGeometry.prototype.computeBoundsTree = undefined;
            delete THREE.BufferGeometry.prototype.computeBoundsTree
            THREE.BufferGeometry.prototype.disposeBoundsTree = undefined;
            delete THREE.BufferGeometry.prototype.disposeBoundsTree
            if (defined(UDEF._originRaycast)) {
                THREE.Mesh.prototype.raycast = UDEF._originRaycast
                UDEF._originRaycast = undefined;
                delete UDEF._originRaycast
            }
            UDEF.BOUNDING_METHOD = UDEF.BOUNDING_TYPE.BOX;
        }
    }

    /**
     * 타일 Key 값으로 생성된 타일을 검색하여 반환합니다.
     * @param {string} key 타일 key
     * @param {string} type 타일의 타입(terrain, model)
     * @returns {undefined|import('@U3dQuadTile').U3dQuadTile} 타일
     */
    getTile(key, type = UDEF.TILE_TYPE.TERRAIN) {
        if (defined(this._drawArg)) {
            return this._drawArg.getTile(key, type);
        }
        return undefined;
    }

    setMaxDistanceModel(val) {

        var save = this._maxDistanceModel;
        this._maxDistanceModel = val;

        if (save !== val)
            this.update();
    }

    getMaxDistanceModel() {
        return this._maxDistanceModel;
    }

    setStopModel(val) {
        if (!defined(val)) val = true;

        this._stopModel = val;
    }

    getStopModel() {
        return this._stopModel;
    }

    /**
     * 타일의 가로세로 비율을 설정하는 함수
     * @param {number} [val=0.7] 타일의 가로세로 비율, 값이 증가 할 수록 검색 되어 출력되는 양이 많아집니다. 그러나 속도가 느려질 수 있습니다.
     */
    setRatioTileSize(val) {
        if (!defined(val)) return;

        this._ratioTileSize = val;
    }

    /**
     * 모델 타일의 가로세로 비율을 설정하는 함수
     * @param {number} val=1.0 타일의 가로세로 비율, 값이 증가 할 수록 검색 되어 출력되는 양이 많아집니다. 그러나 속도가 느려질 수 있습니다.
     */
    setRatioModelTileSize(val) {
        if (!defined(val)) return;

        this._ratioModelTileSize = val;
    }

    /**
     * 타일의 가로세로 비율을 반환하는 함수
     * @returns {number} 타일의 가로세로 비율
     */
    getRatioTileSize() {
        return this._ratioTileSize;
    }

    /**
     * 모델 타일의 가로세로 비율을 반환하는 함수
     * @returns {number} 모델 타일의 가로세로 비율
     */
    getRatioModelTileSize() {
        return this._ratioModelTileSize;
    }

    MetersToPixels(mx, my, zoom, px, py) {
        var self = this;
        if (defined(self._drawArg)) return false;

        self._drawArg.MetersToPixels(mx, my, zoom, px, py);
        return true;
    }

    setFrameOptimize(useFrameOptimize = true) {
        this._frameOptimize = useFrameOptimize;
    }

    /**
     * 프레임 최적화 사용 여부를 반환합니다.
     *
     * @returns {boolean} 프레임 최적화 사용 여부
     */
    getFrameOptimize() {
        return this._frameOptimize;
    }

    /**
     * 입력한 이름의 레이어에 투명도를 설정하는 함수
     * @param {string } name 레이어 이름
     * @param {number} val 설정할 투명도
     * @returns {boolean} 실행 결과
     */
    setOpacity(name, val) {
        if (!defined(name) || !defined(val))
            return false;

        const layers = this._layerlist.getInstanceLayers();
        if (!defined(layers))
            return false;

        for (let layer of layers) {
            if (layer.getName && layer.getName() === name) {
                layer.setOpacity(val);
                return true;
            }
        }
        return false;
    }

    /**
     * 입력한 이름의 레이어에 투명도를 리턴하는 함수
     * @returns {number | null} 레이어의 투명도
     */
    getOpacity(name) {
        if (!defined(name)) return null;

        if (!this.isInitialized())
            return null;

        const layers = this._layerlist.getInstanceLayers();

        for (let layer of layers) {
            if (layer.getName && layer.getName() === name)
                return layer.getOpacity();
        }

        return null;
    }

    getBox() {
        return this._box;
    }

    createBox() {
        const minX = this._rectangle.ptLeftTop.x
        const minY = this._rectangle.ptLeftTop.y;
        const maxX = this._rectangle.ptRightBottom.x;
        const maxY = this._rectangle.ptRightBottom.y;

        return new THREE.Box3(
            new THREE.Vector3(minX, minY, 0),
            new THREE.Vector3(maxX, maxY, maxY)
        );
    }

    create2DShapeLayer(opt, featureCollection) {
        let layer = new (/** @type {any} */ (globalThis)).Union3D.image.U2dShpLayer(opt);
        this.addLayer(layer);
        this.showLayer(layer.getName(), true);
        try {
            layer.addFeatureCollection(featureCollection);
        } catch (e) {
            console.error("add featureCollection is fail. " + e.message);
        }

        return layer;
    }

    /**
     * 해당 레이어 범위로 지도 화면을 위치시키는 함수
     * @param {string} layername 레이어 이름
     * @param {boolean} [useFly=false] 이동 시 애니메이션 사용 유무
     * @param {number} [offsetZ=0] 이동 시 카메라 타겟과 카메라와의 거리
     * @param {number} [leftrotate=0] 이동 시 카메라 좌우 각도
     * @param {number} [downrotate=0] 이동 시 카메라 상하 각도
     * @returns {Promise<boolean>} 수행여부
     */
    fitLayerExtent(layername, useFly, offsetZ, leftrotate = 0, downrotate = 0) {
        const self = this;
        /** @type {DeferredObject<boolean>} */
        const promise = deferred();

        if (!defined(layername)) {
            promise.reject(false);
            return promise;
        }
        const layer = self._layerlist.getLayer(layername);
        if (!defined(layer)) {
            __GError__('U3dApp', layername + " 이름을 가진 레이어가 존재하지 않습니다.", '7849642');
            promise.reject(false);
            return promise;
        }
        if (!defined(layer.getBoundingBox)) {
            __GError__('U3dApp', layername + "layer bounding box function is undefined", '7849642');
            promise.reject(false);
            return promise;
        }
        const bbox = layer.getBoundingBox();
        if (!defined(bbox)) {
            __GError__('U3dApp', layername + "layer bounding box is undefined", '7849914');
            promise.reject(false);
            return promise;
        }

        return self.fitExtentToBoundingBox(bbox, useFly, offsetZ, leftrotate, downrotate);
    }


    drawLayerExtent(layername, color) {
        const self = this;
        let promise = deferred();

        if (!defined(layername)) {
            promise.reject(false);
            return promise;
        }
        const layer = self._layerlist.getLayer(layername);
        if (!defined(layer.getBoundingBox)) {
            U3dMessage.error('U3dApp', layername + "layer bounding box function is undefined", '7849642');
            promise.reject(false);
            return promise;
        }
        const bbox = layer.getBoundingBox();
        if (!defined(bbox)) {
            U3dMessage.error('U3dApp', layername + "layer bounding box is undefined", '7849914');
            promise.reject(false);
            return promise;
        }
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        bbox.getCenter(center);
        bbox.getSize(size);

        try {
            const cube = new UBox3(bbox.min, bbox.max);
            let box = new THREE.Box3Helper(cube, color);

            if (defined(layer._scene) || defined(layer.scene)) {
                let scene = layer._scene || layer.scene;
                scene.add(box);
            } else {
                self._scene.add(box);
            }
            promise.resolve();
        } catch (e) {
            promise.reject(e.message);
        }
        return promise;
    }

    getEditHeightBoxList() {
        return this._editHeightBoxList;
    }

    updateHeightLayers(box, minlevel, maxlevel) {
        if (!defined(box) || !defined(this._drawArg))
            return;

        if (!defined(minlevel)) minlevel = this._drawArg.getPassLevel();
        if (!defined(maxlevel)) maxlevel = U3dQuadTile.getMaxLevel();

        const layers = this.getInstanceHeightLayers();
        if (layers.length === 0)
            return;

        const size = 100;
        const minx = box.min.x - size;
        const miny = box.min.y - size;
        const maxx = box.max.x + size;
        const maxy = box.max.y + size;

        for (let layer of layers) {
            for (let level = (layer._minlevel || minlevel); level <= maxlevel; level++) {

                const minTileIndex = UMathEngine.MetersToTile(minx, miny, level);
                const maxTileIndex = UMathEngine.MetersToTile(maxx, maxy, level);

                for (let tx = minTileIndex.x; tx <= maxTileIndex.x; tx++) {
                    for (let ty = minTileIndex.y; ty <= maxTileIndex.y; ty++) {
                        const bound = UMathEngine.TileBounds(tx, ty, level);
                        const infoTile = {
                            x: tx,
                            y: ty,
                            level: level,
                            minx: bound[0],
                            maxx: bound[2],
                            miny: bound[1],
                            maxy: bound[3]
                        }
                        layer.updateHeightByUser(infoTile);
                    }
                }
            }
        }
    }

    defined(value) {
        return defined(value);
    }

    assert(condition, message) {
        return UDEF.assert(condition, message);
    }

    setHighlightByMesh(mesh, opt) {
        opt = opt || {};
        opt.type = defaultValue(opt.type, 'color');
        UHighLightControl.setHighlight(mesh, opt, this);
    }

    removeHighlightByMesh(mesh, opt) {
        opt = opt || {};
        UHighLightControl.removeHighlight(mesh, opt, this);
    }

    getPropertiesKeys() {
        return Object.keys(this._properties);
    }

    addProperties(key, value) {
        this._properties[key] = value;
    }

    getProperties(key) {
        return this._properties[key];
    }

    setProperties(key, value) {
        this._properties[key] = value;
    }

    removeProperties(key) {
        if (defined(this._properties[key]))
            delete this._properties[key];
    }

    getPoiList() {
        var self = this;
        return self._poiList;
    }

    /**
     * 한 프레임당 최대 작업 프로세스를 설정하는 함수
     * @param {number} maxProcess 최대 프로세스 수
     */
    setMaxProcess(maxProcess = UDEF.DEFAULT_MAX_PROCESS) {
        this._maxProcess = maxProcess;
        this.applyMaxProcess(maxProcess);
    }

    /**
     * 한 프레임당 최대 작업 프로세스 수를 반환하는 함수
     * @returns {number} 최대 프로세스 수
     */
    getMaxProcess() {
        return this._maxProcess;
    }

    applyMaxProcess(maxProcess = UDEF.DEFAULT_MAX_PROCESS) {
        this.getProcessManager().applyMaxProcess(maxProcess);
    }

    /**
     * @description U3dApp에 출력을 지시하는 함수
     * @param {import('three').Object3D} object 출력할 3D object
     */
    addObject(object) {
        if (!defined(object)) return;
        const self = this;
        self._scene.add(object);
    }

    /**
     * @description U3dApp에서 출력하고 있는 객체를 제거하는 함수
     * @param {import('three').Object3D} object 제거할 3D object
     */
    removeObject(object) {
        if (!defined(object)) return;

        const self = this;
        self._scene.remove(object);
        self._sceneComment.remove(object);

        UDEF.disposeObject3D(object);
    }

    /**
     * POI의 id로 해당 POI를 반환하는 함수
     * @param {string} id POI의 id
     * @returns {import('@union3d/geometry/U3dPOI').U3dPOI | undefined} U3dPOI 객체
     */
    getPoiById(id) {
        const poiList = this._poiList;
        if (!defined(poiList) || poiList.length === 0) return undefined;

        for (const poi of poiList) {
            if (poi.uuid === id) return poi;
        }
    }

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
    createPOI(opt) {
        const self = this;
        const promise = deferred();
        const poi = new U3dPOI({
            name: opt.name,
            position: opt.position,
            color: opt.color,
            size: opt.size,
            heightOffset: defaultValue(opt.heightOffset, 0),
            image: defaultValue(opt.image, undefined),
            imageSize: defaultValue(opt.imageSize, undefined),
            label: defaultValue(opt.label, undefined),
            text: defaultValue(opt.text, undefined),
            select: defaultValue(opt.select, undefined),
            drawArg: defaultValue(opt.drawArg, self._drawArg),
            depthTest: defaultValue(opt.depthTest, false)
        });
        if (poi === undefined) return null;
        self.addPOI(poi);
        promise.resolve(poi);
        return promise
    }

    /**
     * POI를 지도에 추가하는 함수
     * @param {import('@union3d/geometry/U3dPOI').U3dPOI} poi U3dPOI 객체
     */
    addPOI(poi) {
        if (!defined(poi)) return;

        var self = this;
        poi._drawArg = self._drawArg;
        if (defined(poi.on)) {
            poi.on('change', function () {
                self.setUpdateDate();
            });
        }

        if (poi.depthTest) {
            self._scene.add(poi);
        } else {
            self._sceneComment.add(poi);
        }


        self._poiList.push(poi);
    }

    /**
     * POI를 지도에서 삭제하는 함수
     * @param {import('@union3d/geometry/U3dPOI').U3dPOI} poi U3dPOI 객체
     */
    removePOI(poi) {
        if (!defined(poi)) return;

        const self = this;
        let scene;

        if (poi.depthTest)
            scene = self._scene;
        else
            scene = self._sceneComment;

        scene.remove(poi);

        for (let i = 0; i < self._poiList.length; i++) {
            if (self._poiList[i].id === poi.id) {
                self._poiList.splice(i, 1);
                break;
            }
        }

        UDEF.disposeObject3D(poi);
        // dispose 이벤트의 구독자가 해제 알림을 받은 뒤 앱에 연결된 나머지 구독을 정리한다.
        if (defined(poi.off)) poi.off();
    }

    /**
     * 지도에 추가된 모든 POI를 삭제하는 함수
     *
     * @deprecated `removeAllPOI`를 사용하세요. 이 함수는 곧 제거됩니다.
     */
    removeAllPoi() {
        this.removeAllPOI();
    }

    /**
     * 지도에 추가된 모든 POI를 삭제합니다.
     *
     */
    removeAllPOI() {
        var self = this;
        var poiList = self._poiList;
        var poiListLength = self._poiList.length;

        for (let i = 0; i < poiListLength; i++) {
            const poi = poiList.pop();
            if (poi.depthTest)
                self._scene.remove(poi);
            else {
                self._sceneComment.remove(poi);
            }
            UDEF.disposeObject3D(poi);
        }
        self.updateData();

    }

    /**
     * 등록된 모든 POI를 지도에서 출력제어하는 함수
     * @param {boolean} show 출력여부
     */
    showAllPOI(show = true) {
        for (let poi of this._poiList) {
            if (show)
                poi.show();
            else {
                poi.hide();
            }
        }
    }

    /**
     * 등록된 POI를 지도에서 출력제어하는 함수
     * @param {boolean} show 출력여부
     * @param {import('@union3d/geometry/U3dPOI').U3dPOI} poi U3dPOI 객체
     */
    showPOI(show = true, poi) {
        if (!poi) return;
        for (let item of this._poiList) {
            if (item.id === poi.id) {
                if (show)
                    item.show();
                else {
                    item.hide();
                }
                break;
            }
        }
    }

    selectPoi(e) {
        const self = this;

        // let intersect = this.intersectFromScene(e, self._sceneComment.children);
        var raycaster = new URaycaster();
        raycaster.setFromCamera({x: e.normalizedX, y: e.normalizedY}, this._camera);
        let intersects = raycaster.intersectObjects(this._poiList);

        const uniqueIntersects = [];
        const encounteredObjects = new Set();

        intersects.forEach((intersect) => {
            const object = intersect.object;

            if (!encounteredObjects.has(object)) {
                encounteredObjects.add(object);
                uniqueIntersects.push(intersect);
            }
        });

        let selected = undefined;
        uniqueIntersects.forEach((intersect) => {
            if (intersect.length === 0) return undefined;


            if (intersect.object.parent instanceof U3dPOI) {
                selected = intersect.object.parent;
            }
        });
        return selected;
    }

    removeAllObject() {
        var self = this;
        var objectList = self._objectList;
        var objectListLength = self._objectList.length;

        for (var i = 0; i < objectListLength; i++) {
            var object = objectList.pop();
            self._scene.remove(object._name);
            self.updateData();
        }
    }

    getImageLayerByRenderOrder(order) {
        if (!defined(order)) order = 'high';
        var self = this;
        if (!defined(self._drawArg))
            throw new Error('getInstanceBaseLayer() is null!');

        var layers = self._layerlist.getInstanceImageLayers();
        if (order == 'high')
            layers.sort(function (a, b) {
                return b._renderOrder - a._renderOrder;
            });
        else
            layers.sort(function (a, b) {
                return a._renderOrder - b._renderOrder;
            });

        for (var i = 0; i < layers.length; i++) {
            if (layers[i]._className === 'U3dMeasureLayer')
                continue; //Measure레이어 건너뛰기

            /*                if (layers[i]._minlevel > self._drawArg.getPassLevel())
                        continue;*/

            if (layers[i].getVisible())
                return layers[i];
        }

        return undefined;
    }

    getInstanceBaseLayer() {
        var self = this;
        if (!defined(self._drawArg))
            throw new Error('getInstanceBaseLayer() is null!');

        var name = self.getNameBaseLayer();
        var imagelayer = self.getImageLayer(name);
        if (defined(imagelayer) && imagelayer.getVisible())
            return imagelayer;
        else
            return self.getImageLayerByRenderOrder('low');

        return undefined;
    }

    getInstanceBaseHeightLayer() {
        var self = this;
        // var name = U3dQuadTile.getNameBaseLayer();
        // return self.getImageLayer(name);

        //+jykim 수정 가시화중인 첫번째 레이어 가져오기
        var layers = self._layerlist.getInstanceHeightLayers();
        for (var i = 0; i < layers.length; i++) {
            if (layers[i]._className === 'U3dMeasureLayer')
                continue; //Measure레이어 건너뛰기
            if (layers[i].getVisible()) {
                return layers[i];
            }
        }
        return undefined;
    }

    /**
     * 기본 지도로 사용 중인 이미지 레이어의 이름을 반환합니다.
     *
     * @returns {string} 레이어 이름
     *
     * @example
     * const name = app.getNameBaseLayer();
     */
    getNameBaseLayer() {
        return this._nameBaseLayer;
    }

    /**
     * 기본 지도로 사용할 이미지 레이어의 이름을 설정합니다.
     *
     * @param {string} name 레이어 이름
     *
     * @example
     * app.setNameBaseLayer('satellite');
     */
    setNameBaseLayer(name) {
        this._nameBaseLayer = name;
    }

    getCanvas() {
        var self = this;
        if (defined(self._renderer)) {
            return self._renderer.domElement;
        } else
            return undefined;
    }

    /**
     * 로딩 화면으로 사용할 HTML 요소를 등록합니다.
     *
     * @param {string} containerid 로딩 화면으로 사용할 HTML 요소의 ID
     *
     * @example
     * app.createloadingBar('load');
     * app.loadingBar();
     */
    createloadingBar(containerid) {
        var self = this;
        self._idLoad = containerid;
    }

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
    loadingBar() {
        var self = this;
        if (!defined(self._idLoad)) return;

        const load = document.getElementById(self._idLoad);
        if (load) {
            load.style.display = '';
        }
    }

    /**
     * 등록한 로딩 화면을 종료하고 화면에서 숨깁니다.
     *
     * @example
     * app.loadingBar();
     * // 작업 완료 후
     * app.endloadingBar();
     */
    endloadingBar() {
        var self = this;
        if (!defined(self._idLoad)) return;

        const load = document.getElementById(self._idLoad);
        if (load) {
            load.style.display = 'none';
        }
    }

    /**
     * 디버그 화면을 제거합니다.
     *
     * @example
     * app.removeDebugCanvas();
     */
    removeDebugCanvas() {
        this.removeDevToolView();
    }

    /**
     * 앱 설정을 확인할 수 있는 디버그 화면을 생성합니다.
     *
     * @example
     * app.createDebugCanvas();
     */
    createDebugCanvas() {
        this.createDevToolView();
    }

    setSizeBaseWindow(left, top, width, height) {
        this._rectBaseWindow.left = left;
        this._rectBaseWindow.top = top;
        this._rectBaseWindow.width = width;
        this._rectBaseWindow.height = height;
        this.setUpdateDate();
    }

    setSizeSwipeWindow(left, top, width, height) {
        this._rectSwipeWindow.left = left;
        this._rectSwipeWindow.top = top;
        this._rectSwipeWindow.width = width;
        this._rectSwipeWindow.height = height;
        this.setUpdateDate();
    }

    /**
     * 출력되고 있는 모델 레이어들의 전체 투명도 적용 여부를 리턴하는 함수
     * @returns {boolean} 모델 레이어들의 전체 투명도 적용 여부
     */
    getEnableOpacityModelLayers() {
        return this.getProperties(UDEF.APP_PROP.MODEL.USE_OPACITY);
    }

    /**
     * 출력되고 있는 이미지 레이어들의 전체 투명도 적용 여부를 리턴하는 함수
     * @returns {boolean} 이미지 레이어들의 전체 투명도 적용 여부
     */
    getEnableOpacityImageLayers() {
        return this.getProperties(UDEF.APP_PROP.IMAGE.USE_OPACITY);
    }

    /**
     * 출력되고 있는 모델 레이어들의 설정된 투명도를 적용하는 함수
     * @param {boolean} enable 모델 레이어에 투명도 적용 여부
     */
    setEnableOpacityModelLayers(enable) {
        const self = this;
        const layers = self.getInstanceModelLayers();
        if (enable) {

            self.setProperties(UDEF.APP_PROP.MODEL.USE_OPACITY, true);

            const value = self.getProperties(UDEF.APP_PROP.MODEL.OPACITY);
            //+ 설정

            for (let layer of layers) {
                layer.setOpacity(value);
            }
        } else {

            //+ 프로퍼티 등록
            self.setProperties(UDEF.APP_PROP.MODEL.USE_OPACITY, false);

            for (let layer of layers) {
                layer.resetOpacity();
            }
        }
        return true;
    }

    /**
     * 출력되고 있는 이미지 레이어들의 설정된 투명도를 적용하는 함수
     * @param {boolean} enable 이미지 레이어에 투명도 적용 여부
     */
    setEnableOpacityImageLayers(enable) {
        const self = this;
        const layers = self.getInstanceImageLayers();
        if (enable) {
            //+ 프로퍼티 등록
            self.setProperties(UDEF.APP_PROP.IMAGE.USE_OPACITY, true);

            const value = self.getProperties(UDEF.APP_PROP.IMAGE.OPACITY);

            for (let layer of layers) {
                layer.setOpacity(value);
            }
        } else {
            //+ 프로퍼티 등록
            self.setProperties(UDEF.APP_PROP.IMAGE.USE_OPACITY, false);

            for (let layer of layers) {
                layer.resetOpacity();
            }
        }
        return true;
    }

    /**
     * 출력되고 있는 모델 레이어들의 전체 투명도 설정 값을 리턴하는 함수
     * @returns {number} 모델 레이어들의 전체 투명도 설정 값
     */
    getOpacityModelLayers() {
        return this.getProperties(UDEF.APP_PROP.MODEL.OPACITY);
    }

    /**
     * 출력되고 있는 이미지 레이어들의 전체 투명도 설정 값을 리턴하는 함수
     * @returns {number} 이미지 레이어들의 전체 투명도 설정 값
     */
    getOpacityImageLayers() {
        return this.getProperties(UDEF.APP_PROP.IMAGE.OPACITY);
    }

    /**
     * 출력되고 있는 모델 레이어들의 투명도를 설정하는 함수
     * @param {number} value 모델 레이어에 적용될 투명도
     */
    setOpacityModelLayers(value) {
        const self = this;
        self.setProperties(UDEF.APP_PROP.MODEL.OPACITY, value);
        const enable = self.getProperties(UDEF.APP_PROP.MODEL.USE_OPACITY);
        if (!enable)
            return;

        const layers = self.getInstanceModelLayers();

        for (let layer of layers) {
            layer.setOpacity(value);
        }
    }

    /**
     * 출력되고 있는 이미지 레이어들의 투명도를 설정하는 함수
     * @param {number} value 이미지 레이어에 적용될 투명도
     */
    setOpacityImageLayers(value) {
        const self = this;
        self.setProperties(UDEF.APP_PROP.IMAGE.OPACITY, value);
        const enable = self.getProperties(UDEF.APP_PROP.IMAGE.USE_OPACITY);
        if (!enable)
            return;

        const layers = self.getInstanceImageLayers();
        for (let layer of layers) {
            layer.setOpacity(value);
        }
    }

    /**
     * 전역 클립핑 활성화 함수
     * @param {boolean} enable 활성화 여부
     * @returns {boolean} 실행 성공 여부
     */
    setEnableClipping(enable) {
        if (!defined(this._renderer)) {
            console.info('renderer is null!');
            return false;
        }

        const renderer = this._renderer;
        this.setProperties(UDEF.APP_PROP.CLIP.USE_CLIP, enable);
        if (enable) {
            renderer.localClippingEnabled = true;
        } else {
            renderer.localClippingEnabled = false;
        }

        this.setUpdateDate();

        return true;
    }

    setClippingAxisX(value) {
        var self = this;
        clipAxis.call(self, 'x', value);
    }

    setClippingAxisY(value) {
        var self = this;
        clipAxis.call(self, 'y', value);
    }

    setClippingAxisZ(value) {
        var self = this;
        clipAxis.call(self, 'z', value);
    }

    setClippingAxisHeight(value) {
        return this.setClippingAxisZ(value);
    }

    /**
     * 전역 클립핑 X축 적용 함수
     * @param {number} value -1 ~ 1 사이의 실수 입력, 카메라의 X축(양수 일때 왼쪽에서 오른쪽, 음수일때 오른쪽에서 왼쪽)으로 입력 값을 비율값으로 환산 후 클립핑 적용
     */
    setClippingAxisXByRatio(value) {
        UDEF.assert(value >= -1 && value <= 1);

        clipAxisByRatio.call(this, 'x', value);
    }

    /**
     * 전역 클립핑 Y축 적용 함수
     * @param {number} value -1 ~ 1 사이의 실수 입력, 카메라의 Y축(양수 음수 상관없이 카메라가 바라보는 방향)으로 입력 값을 비율값으로 환산 후 클립핑 적용
     */
    setClippingAxisYByRatio(value) {
        UDEF.assert(value >= -1 && value <= 1);

        clipAxisByRatio.call(this, 'y', value);

    }

    /**
     * 전역 클립핑 Z축 적용 함수
     * @param {number} value -1 ~ 1 사이의 실수 입력, 해발 고도 0m를 기준으로 (양수 일시 0m 위 방향, 음수 일시 0m 아래 방향)입력 값을 비율값으로 환산 후 클립핑 적용
     */
    setClippingAxisHeightByRatio(value) {
        return this.setClippingAxisZByRatio(value);
    }

    /**
     * 전역 클립핑 초기화 함수
     */
    clearClippingAxis() {
        this._clippingPlanes = [];
    }

    setClippingAxisZByRatio(value) {
        UDEF.assert(value >= -1 && value <= 1);

        clipAxisByRatio.call(this, 'z', value);
    }

    /**
     * U3dApp의 이름을 반환하는 함수
     * @returns {string} U3dApp의 이름
     */
    getName() {
        var self = this;
        return self._name;
    }

    /**
     * app 초기화(Initialized) 여부를 반환하는 함수
     * @returns {boolean} app 초기화 여부
     */
    isInitialized() {
        return this._bInitialized;
    }

    /**
     * 지도의 모드를 지정하는 함수 <br>
     * 모드를 바꾸면 화면에 떠 있던 팝업은 모두 닫힙니다.
     * @param {number} mode 지정할 지도 모드 [1 : Pan] (`UDEF.APP_MODE` 참고)
     */
    setMode(mode) {
        var self = this;
        self._mode = mode;

        [...document.getElementsByClassName('u3-popup')].forEach(element => element.style.display = 'none');
    }

    /**
     * 현재 지도의 모드를 반환하는 함수
     * @returns {number} 지도 모드 [1 : Pan]
     */
    getMode() {
        var self = this;
        return self._mode;
    }

    isSimulationMode() {
        var self = this;

        if (self._mode === UDEF.APP_MODE._FLY
            || self._mode === UDEF.APP_MODE._WALK)
            return true;

        return false;
    }

    /**
     * 현재 설정된 fov(화각, Field of View) 반환 함수
     * @returns {number} fov(화각, Field of View) 수치
     */
    getFov() {
        const self = this;

        if (defined(self._camera)) {
            return self._camera.fov;
        }
    }

    /**
     * Fov(Field of View, 화각) 설정 함수
     * @param {number} fov fov 값
     * @returns {boolean} 실행 결과
     */
    setFov(fov) {
        const self = this;
        const camera = self._camera;
        if (!defined(camera))
            return false;

        if (camera.isOrthographicCamera) {
            // orthographic: FOV 변경 대신 뷰 크기를 재계산
            camera._fov = fov;
            return true;
        }

        camera.fov = fov;
        camera.setDenominator();
        camera.updateProjectionMatrix();
        self.setUpdateDate();
        return true;
    }

    /**
     * 지도화면 fov(화각, Field of View) 설정 함수
     * @param {number} fov 수치
     * @returns {boolean} 설정 성공 여부. 카메라가 없으면 `false`
     */
    setCameraFov(fov) {
        return this.setFov(fov);
    }

    /**
     * 현재 설정된 fov(화각, Field of View) 반환 함수
     * @returns {number} fov(화각, Field of View) 수치
     */
    getCameraFov() {
        return this.getFov();
    }

    //모드 전환/////////////////////////////////////////////////////////////////////////////////////
    /**
     * 지도이동 모드(Pan 모드)로 전환하는 함수
     * @param {number} [type=1] app 컨트롤 모드 [1 : PAN 모드]
     */
    setPanMode(type) {
        var self = this;
        if (!defined(type))
            type = UDEF.APP_MODE._PAN;

        self._mapControl.setMode(type);
        // setMode 는 각도 제한을 기본값으로 되돌리므로 2D 모드에서는 고정 상태를 다시 적용한다.
        if (self.#viewMode === VIEW_MODE.TWO_D) {
            self.#lockViewAngleLimit();
        }
        if (self._mode === UDEF.APP_MODE._PAN) return;

        this.stopFly();
        self.activeMode('map');
        self._mode = UDEF.APP_MODE._PAN;
    }

    /**
     * 지하모드 시 지하 공간에 격자를 가시화하는 함수
     * @param {boolean} show 지하격자 가시화 여부 [ true : 활성 / false : 비활성 ]
     */
    showUnderGroundGrid(show) {
        var self = this;
        if (defined(self._underground)) {
            if (show === true)
                self._scene.add(self._underground);
            else
                self._scene.remove(self._underground);
        }
    }

    /**
     * 지하모드를 활성화 여부 반환 함수
     * @returns {boolean} 지하모드 활성 여부 [ true : 활성 / false : 비활성 ]
     */
    isUnderGroundMode(set) {
        return this._mode === UDEF.APP_MODE._UNDERGROUND;
    }

    /**
     * 지하모드를 활성하는 함수
     * @param {boolean} set 지하모드 활성 여부 [ true : 활성 / false : 비활성 ]
     */
    setUnderGroundMode(set) {
        var self = this;

        if (!defined(set) || set) {
            self.setUseCollision(false);
            self.setFreePolarAngle(true);
            if (self._mode === UDEF.APP_MODE._UNDERGROUND) return;
            self._mode = UDEF.APP_MODE._UNDERGROUND;

            if (!defined(self._undergroundId)) {
                let option = {
                    position: self._rectangle.centerMap(),
                    nWidth: self._rectangle.nWidth / 2,
                    nHeight: self._rectangle.nHeight / 2,
                    depth: self._undergroundDepth,
                    color: self._undergroundColor,
                    opacity: self._undergroundOpacity,
                    grid: self._undergroundGrid,
                    gridDivide: self._undergroundGridDivide,
                    setTexture: self._undergroundSetTexture,
                    edge: self._undergroundEdge,
                    edgeThickness: self._undergroundEdgeThickness,
                    fog: self._undergroundFog,
                    fogDensity: self._undergroundFogDensity,
                    fogStartHeight: self._undergroundFogStartHeight,
                    fogEndHeight: self._undergroundFogEndHeight,
                    fogColor: self._undergroundFogColor,
                }
                let underGround = new UUnderground(option, self);
                self._undergroundId = underGround.id;
                self._underground = underGround;
                self._scene.add(underGround);
            }
        } else {
            self.setUseCollision(true);
            self.setFreePolarAngle(false);
            if (self._mode === UDEF.APP_MODE._UNDERGROUND) {
                self._mode = UDEF.APP_MODE._PAN;
            }
            if (defined(self._undergroundId)) {
                let underGround = self._scene.getObjectById(self._undergroundId);
                self._scene.remove(underGround);
                underGround.dispose();
                self._underground = undefined;
                self._undergroundId = undefined;
            }
        }
    }

    /**
     * 보행모드로 전환하는 함수
     * @ignore
     */
    setWalkMode(position, target, minHeight) {
        var self = this;
        if (self._mode === UDEF.APP_MODE._WALK) return;


        self._mapControl.saveState();
        self.setUseCollision(true);

        //위치가 없을경우 클릭이벤트 등록
        if (!defined(position)) {
            //중복등록 방지
            if (defined(self._walkEvent)) {
                self.unkey('click', self._walkEvent);
            }
            self._walkEvent = self.on('click', function (e) {
                if (self._mode !== UDEF.APP_MODE._WALK) {
                    self.unkey('click', self._walkEvent);
                    self._walkEvent = undefined;
                    return;
                }
                var point = self.closestPointAtPixel(e);
                point.z += 5;
                setWalkMode_.call(this, point, target, minHeight);
                self.unkey('click', self._walkEvent);
                self._walkEvent = undefined;
                delete self._walkEvent;
            });
            return;
        }

        if (defined(position)) {
            setWalkMode_.call(this, position, target, minHeight);
        } else {
            self.activeMode('walk');
        }
        return undefined;
    }

    /**
     * 비행모드로 전환하는 함수
     * @ignore
     */
    setFlyMode() {
        var self = this;
        if (self._mode === UDEF.APP_MODE._FLY) return;

        self._mapControl.saveState();
        self.setUseCollision(true);
        self._mode = UDEF.APP_MODE._FLY;
        self._curControl = self._flyControl;

        self.activeMode('fly');
    }

    /**
     * 경사도 측정 모드로 전환하는 함수
     */
    setSlopeMode() {
        var self = this;
        self._mode = UDEF.APP_MODE._SLOPE;

        self.setLineStringMeasureType();
    }

    /**
     * app의 컨트롤 모드를 활성하는 함수
     * @param {string} mode app의 컨트롤 모드 값 `map` `walk` `fly`
     */
    activeMode(mode) {
        var self = this;
        var keys = Object.keys(self._controls);
        keys.forEach(function (key) {
            if (key !== mode) {
                self._controls[key].deactive();
            }
        });
        if (defined(self._controls[mode])) {
            self._controls[mode].active();
            self._curControl = self._controls[mode]
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * 2D 지도 모드에서 flyToPosition 입력 좌표를 TopView 기준으로 보정하는 내부 함수
     *
     * 2D 모드는 시선이 수직으로 고정되어 기울어진 시점을 만들 수 없다.
     * 입력한 (position, target)을 그대로 쓰면 두 점 사이의 기울어진 거리가 그대로 카메라 고도가 되어
     * 수평 거리가 멀수록 입력한 높이보다 훨씬 높은 곳에 카메라가 놓인다.
     * 그래서 target을 화면 중심으로 유지하고 카메라는 그 바로 위 `position.z` 높이에 배치한다.
     *
     * target을 생략하면 원래 동작은 카메라 이동량만큼 target도 함께 옮기는 것인데,
     * 수직 성분까지 따라가면 카메라 고도를 낮출 때 target이 지면 아래로 내려간다.
     * 이 경우 수평 이동량만 반영하고 target 높이는 유지한다.
     *
     * @param {WorldPosition} position 요청한 카메라 좌표
     * @param {WorldPosition} [target] 요청한 타겟 좌표
     * @returns {{position: WorldPosition, target: WorldPosition | undefined}} 보정한 좌표
     *
     * @ignore
     */
    #getTopViewFlyPosition(position, target) {
        const self = this;
        const control = self._mapControl;
        if (!self.is2DMode() || !defined(control) || !defined(position)) {
            return {position: position, target: target};
        }

        const camera = self.getCameraPosition();
        // 2D 이동에 사용할 수직 시점의 새 좌표를 구하며, 입력 좌표와 현재 컨트롤은 변경하지 않는다.
        return INTERNAL.getTopViewFlyPosition(position, target, camera, control);
    }

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
    flyToPosition(position, target, duration) {
        const self = this;
        self.stopFly();
        const mapControl = self._mapControl;
        const promise = deferred();
        const callbacks = {
            stop: promise.resolve,
            complete: promise.resolve
        }
        const flyTo = self.#getTopViewFlyPosition(position, target);
        self._currentTween = mapControl.flyTo(flyTo.position, flyTo.target, duration, null, callbacks);
        return promise;
    }

    /**
     * 입력받은 지리좌표(GeoPosition)로 카메라를 이동시키는 함수
     * @param {GeoPosition} position 이동할 위경도 좌표
     * @param {number} [duration=3000] 애니메이션 시간 (밀리초)
     * @returns {Promise<boolean>} 이동 완료 시점의 Promise
     */
    flyTo(position, duration) {
        if (!position) return new Promise.resolve(false);
        let vector3 = this.geographicToVector3(position);
        vector3.z = 0;
        let camPosition = this.getCameraPosition();
        let camTarget = this.getCameraTargetPosition();
        let offset = camTarget.sub(vector3);
        camPosition.sub(offset);
        return this.flyToPosition(camPosition, undefined, duration);

    }

    /**
     * @deprecated  flyToVector3_ API 가 flyToPosition로 변경 되었습니다. API 호출을 flyToPosition로 변경하여 주십시오.
     *
     * @param {WorldPosition} position 이동 할 3D 월드 좌표
     * @param {WorldPosition} [target] 바라볼 3D 월드 좌표 (생략 시 현재 타겟 유지)
     * @param {number} [duration] 이동에 걸리는 시간 (밀리초)
     * @returns {Promise<boolean>} 이동 완료 시전의 Promise
     */
    flyToVector3_(position, target, duration) {
        const self = this;
        __GInfo__(self, 'flyToVector3_ API 가 flyToPosition로 변경 되었습니다. API 호출을 flyToPosition로 변경하여 주십시오.', '7125330');
        return self.flyToPosition(position, target, duration);
    }

    /**
     * 입력받은 클릭 이벤트로 카메라를 이동시키는 함수
     * @param {import('@U3dMouseEvent').U3dMouseEvent} event 마우스 이벤트 객체
     * @param {number} [offset = 1] 추가 이동 오프셋
     * @returns {Promise<boolean>} 이동 완료 시점의 Promise
     */
    flyToClick(event, offset = 1) {
        const self = this;
        let point = self.closestPointAtPixel(event);
        if (!defined(point)) {
            __GWarn__(self, `클릭 좌표를 찾을 수 없습니다.`, '1144119');
            return new Promise.resolve(false);
        }
        const newTarget = point.clone();
        if (defined(offset)) {
            const dir = new THREE.Vector3();
            if (self.is2DMode()) {
                // 2D 모드는 시선이 TopView로 고정되므로 offset도 수직 방향으로 적용해야
                // 클릭 지점과의 거리가 입력한 offset 그대로 유지된다.
                dir.set(0, 0, 1);
            } else {
                dir.subVectors(self.getCameraPosition(), point).normalize();
            }
            dir.multiplyScalar(offset);
            dir.add(point);
            point = dir;
        }

        if (self._mapControl.object.isOrthographicCamera) {
            point.z = self.getCameraPosition().z;
        }
        return self.flyToPosition(point, newTarget);
    }

    /**
     * 카메라가 향해있는 타겟으로 이동하는 함수
     *
     * @param {number} [offset=1] 타겟에서 카메라 쪽으로 떨어질 거리
     * @param {number} [duration=3000] 애니메이션 시간 밀리세컨드 단위
     * @returns {Promise<boolean>} 이동 완료 시점의 Promise
     */
    flyToTarget(offset = 1, duration = 3000) {
        const self = this;

        const direction = new THREE.Vector3();
        const target = self.getCameraTargetPosition();
        direction.subVectors(target, self._camera.position).normalize();

        RAYCASTER.set(self._camera.position, direction);

        let scenes = self.getInstanceScenesFromTerrainLayers();
        let objects = RAYCASTER.intersectObjects(scenes);

        let point;
        if (defined(objects[0])) {
            point = objects[0].point;
        } else {
            point = target.clone();
        }

        let newTarget = target.clone();
        if (defined(offset)) {
            let dir = new THREE.Vector3();
            dir.subVectors(self.getCameraPosition(), point).normalize();
            dir.multiplyScalar(offset);
            dir.add(point);
            point = dir;
        }

        return self.flyToPosition(point, newTarget, duration);
    }

    /**
     * 현재 카메라 타겟의 포지션을 리턴하는 함수
     * @returns {GeoPosition} 위경도 좌표 x,y,z
     */
    getLandTargetPosition() {
        var self = this;
        var raycaster = new URaycaster();

        var direction = new THREE.Vector3();
        direction.subVectors(this._mapControl.target, this._camera.position).normalize();

        raycaster.set(this._camera.position, direction);

        var scenes = this.getInstanceScenesFromTerrainLayers();
        var objects = raycaster.intersectObjects(scenes);

        var point;
        if (defined(objects[0])) {
            point = objects[0].point;
        } else {
            point = this._mapControl.target.clone();
        }

        var geo = this._drawArg.getWorldToGeographic(point.x, point.y);
        geo.z = point.z;

        return geo;
    }

    initOpenLayers() {
        ol.proj.setProj4((/** @type {any} */ (globalThis)).__UNION3D__.proj4);
        (/** @type {any} */ (globalThis)).__UNION3D__.proj4.defs(
            'EPSG:2097',
            '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43'
        );
        (/** @type {any} */ (globalThis)).__UNION3D__.proj4.defs(
            'EPSG:5173',
            '+proj=tmerc +lat_0=38 +lon_0=125.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43'
        );
        (/** @type {any} */ (globalThis)).__UNION3D__.proj4.defs(
            'EPSG:5174',
            '+proj=tmerc +lat_0=38 +lon_0=127.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43'
        );
        (/** @type {any} */ (globalThis)).__UNION3D__.proj4.defs(
            'EPSG:5175',
            '+proj=tmerc +lat_0=38 +lon_0=127.0028902777778 +k=1 +x_0=200000 +y_0=550000 +ellps=bessel +units=m +no_defs  +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43'
        );
        (/** @type {any} */ (globalThis)).__UNION3D__.proj4.defs(
            'EPSG:5176',
            '+proj=tmerc +lat_0=38 +lon_0=129.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43'
        );
        (/** @type {any} */ (globalThis)).__UNION3D__.proj4.defs(
            'EPSG:5177',
            '+proj=tmerc +lat_0=38 +lon_0=131.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs  +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43'
        );
        (/** @type {any} */ (globalThis)).__UNION3D__.proj4.defs(
            "EPSG:5179",
            "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
        );
        (/** @type {any} */ (globalThis)).__UNION3D__.proj4.defs(
            'EPSG:5181',
            '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs'
        );
        (/** @type {any} */ (globalThis)).__UNION3D__.proj4.defs(
            'EPSG:5183',
            '+proj=tmerc +lat_0=38 +lon_0=129 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs'
        );
        (/** @type {any} */ (globalThis)).__UNION3D__.proj4.defs(
            'EPSG:5186',
            '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs'
        );
        (/** @type {any} */ (globalThis)).__UNION3D__.proj4.defs(
            'EPSG:5187',
            '+proj=tmerc +lat_0=38 +lon_0=129 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs'
        );

        (/** @type {any} */ (globalThis)).__UNION3D__.proj4.defs('EPSG:4978', '+proj=geocent +datum=WGS84 +units=m +no_defs');


        ol.proj.get('EPSG:2097').setExtent([107581.17, 52224.72, 287427.97, 537099.14]);
        ol.proj.get('EPSG:5173').setExtent([156312.03, 55202.27, 287521.60, 504908.71]);
        ol.proj.get('EPSG:5174').setExtent([107314.04, 52227.33, 287175.27, 537096.41]);
        ol.proj.get('EPSG:5175').setExtent([114831.13, 11204.95, 200659.74, 62956.79]);
        ol.proj.get('EPSG:5176').setExtent([107892.86, 111015.49, 256333.25, 571232.64]);
        ol.proj.get('EPSG:5177').setExtent([174066.18, 432343.17, 200627.60, 457827.25]);
        ol.proj.get('EPSG:5179').setExtent([-200000.0, -3015.4524155292, 3803015.45241553, 4000000.0]);
        ol.proj.get('EPSG:5181').setExtent([-219825.99, -535028.96, 819486.07, 777525.22]);
        ol.proj.get('EPSG:5186').setExtent([-219825.99, -435028.96, 819486.07, 877525.22]);

        //+ EPSG:3857 resolution 동기화
        var grid = ol.tilegrid.createXYZ({maxZoom: 32, minZoom: 0});
        ol.proj.get('EPSG:3857').setDefaultTileGrid(grid);
    }

    /**
     * 기본위치(홈) 정보를 반환하는 함수(경도, 위도, 고도, 방위각, 고도각)
     * @returns {object} {x: {number}, y: {number}, height: {number}, rotateLeft: {number}, rotatedown: {number}}
     */
    getHomePosition() {
        var self = this;
        return {
            x: self._homePosition.x
            , y: self._homePosition.y
            , height: self._homePosition.z
            , rotateLeft: self._homeRotateLeft
            , rotatedown: self._homeRotateDown
        };
    }

    /**
     * 기본 위치(홈)를 설정하는 함수
     * @param {number} geox 위경도 x값
     * @param {number} geoy 위경도 y값
     * @param {number} height 고도값
     * @param {number} [rotateleft] 방위각
     * @param {number} [rotatedown] 고도각
     * @returns {Promise<boolean>} 이동 완료 promise 반환
     */
    setHomePosition(geox, geoy, height, rotateleft, rotatedown) {
        var self = this;
        self._homePosition = new THREE.Vector3(geox, geoy, height);
        self._homeRotateLeft = rotateleft;
        self._homeRotateDown = rotatedown;

    }

    /**
     * 설정된 homePosition 의 위치로 이동하는 함수
     * @param {number} duration 카메라가 해당 위치로 이동하는데 소요 시간
     * @returns {Promise<boolean>} 이동 완료 Promise 반환
     */
    updateHomePosition(duration = 100) {
        const self = this;

        return self.setCameraGeographicPosition(
            self._homePosition.x,
            self._homePosition.y,
            0,
            self._homeRotateLeft,
            self._homeRotateDown,
            self._homePosition.z,
            duration
        );
    }

    /**
     * OpenLayers 기반 이미지 타일 레이어 생성 함수
     * @param {U3dOpenLayerCO} opt U3dOpenLayer 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayer | undefined} U3dOpenLayer 레이어 객체
     */
    create3dOpenLayer(opt) {
        var self = this;

        if (!defined(opt)) opt = {};

        var layer = self._layerlist.getLayer(opt.name);
        if (!defined(layer)) {
            layer = new U3dOpenLayer(opt);
            if (defined(layer)) {
                self.addLayer(layer);
                return layer;
            }
        }

        return undefined;
    }

    /**
     * `OGC WMTS`를 이용한 이미지 레이어로를 생성합니다.
     * @param {U3dImageWMTSLayerCO} opt U3dImageWMTSLayer 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dImageWMTSLayer').U3dImageWMTSLayer | undefined} U3dImageWMTSLayer 레이어 객체 반환
     */
    create3dImageWMTSLayer(opt) {
        const self = this;

        if (!defined(opt)) opt = {};

        let layer = self._layerlist.getLayer(opt.name);
        if (!defined(layer)) {
            layer = new U3dImageWMTSLayer(opt);
            if (defined(layer)) {
                self.addLayer(layer);
                return layer;
            }
        }

        return undefined;
    }

    /**
     * 데칼 영역 및 데칼 표현 레이어 생성 함수입니다.
     * @param {U3dPatternXYZLayerCO} opt U3dPatternXYZLayer 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dPatternXYZLayer').U3dPatternXYZLayer | undefined} U3dPatternXYZLayer 레이어 객체 반환
     */
    createPatternLayer(opt) {
        const self = this;
        opt = opt || {}
        if (!defined(opt.name))
            opt.name = 'patternImageLayer';

        if (self._layerlist.getLayer(opt.name)) {
            U3dMessage.error('U3dApp', U3dMessage.CNT.CMM.EXIST_LAYER);
            return undefined;
        }

        const layer = new U3dPatternXYZLayer(opt);

        if (defined(layer))
            self.addLayer(layer);

        return layer;
    }

    /**
     * Emap 기본 지도를 생성하는 레이어 함수입니다.
     * @param {U3dEmapLayerCO} opt Emap 기본 지도 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayer | undefined} 생성된 U3dOpenLayer 레이어
     */
    createEmapBaseLayer(opt) {
        opt = opt || {};
        const self = this;
        const layer = self.getLayerByName(opt.name);
        if (defined(layer)) return undefined;
        opt.layername = defaultValue(opt.layername, 'korean_map');
        opt.ext = defaultValue(opt.ext, 'image/png');
        opt.apikey = defaultValue(opt.apikey, '04trYP9_xwLAfALjwZ-B8g');
        opt.useProxy = defaultValue(opt.useProxy, false);
        opt.proxy = defaultValue(opt.proxy, 'proxy.jsp?url=');
        opt.drawarg = defaultValue(opt.drawarg, self._drawArg);

        // 기본 지도와 같은 범위를 사용한다.
        opt.geoextent = defaultValue(opt.geoextent, getEmapGeoExtent_());

        opt.matrixsetname = 'korean';
        opt.stylename = 'korean';
        opt.ekind = UDEF._EMAP_KIND._BASE;

        return self.createEmapTemplateLayer(opt);
    }

    /**
     * Emap 위성 지도를 생성하는 레이어 함수입니다.
     * @param {U3dEmapSatLayerCO} opt Emap 위성 지도 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayer | undefined} 생성된 U3dOpenLayer 레이어
     */
    createEmapSatLayer(opt) {
        opt = opt || {};
        const self = this;
        const layer = self.getLayerByName(opt.name);
        if (defined(layer)) return undefined;

        opt.layername = defaultValue(opt.layername, 'AIRPHOTO');
        opt.ext = defaultValue(opt.ext, 'image/jpg');
        opt.apikey = defaultValue(opt.apikey, '04trYP9_xwLAfALjwZ-B8g');
        opt.useProxy = defaultValue(opt.useProxy, false);
        opt.proxy = defaultValue(opt.proxy, 'proxy.jsp?url=');
        opt.drawarg = defaultValue(opt.drawarg, self._drawArg);

        //+ 영역
        opt.geoextent = defaultValue(opt.geoextent, getEmapGeoExtent_());

        opt.matrixsetname = 'NGIS_AIR';
        opt.stylename = '';
        opt.ekind = UDEF._EMAP_KIND._SAT;

        return self.createEmapTemplateLayer(opt);

    }

    /**
     * Emap 공통 WMTS 템플릿 레이어를 생성하는 함수입니다.
     * @param {U3dEmapLayerCO} opt Emap 템플릿 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayer | undefined} 생성된 U3dOpenLayer 레이어
     */
    createEmapTemplateLayer(opt) {
        opt = opt || {};
        const self = this;
        const layer = self._layerlist.getLayer(opt.name);
        if (defined(layer)) return undefined;
        opt.ekind = defaultValue(opt.ekind, UDEF._EMAP_KIND._SAT);
        opt.apikey = defaultValue(opt.apikey, '04trYP9_xwLAfALjwZ-B8g');
        opt.xyorder = defaultValue(opt.xyorder, 'xy');

        let url;
        if (defined(opt.url)) {
            url = opt.url;
        } else if (defined(opt.baseurl)) {
            url = opt.baseurl;
        } else {
            __GInfo__(self, "생성 옵션 중 baseurl(또는 url)이 누락되었습니다. 기본이미지로 대체합니다.", '4123252');
            url = 'http://210.117.198.120:8081/o2map/services'
        }
        opt.url = url;

        const callback = function (parameter, sharedSources) {
            // U3dOpenLayer는 OL layer는 타일마다 만들되 source는 등록 레이어 단위로 공유합니다.
            // 기존 source가 전달되면 WMTS 설정과 source 생성을 반복하지 않고 새 layer에 바로 연결합니다.
            if (defined(sharedSources?.[0])) {
                return new ol.layer.Tile({
                    opacity: 1,
                    source: sharedSources[0],
                    transition: false
                });
            }
            const proj5179 = ol.proj.get('EPSG:5179');
            const projectionExtent = proj5179.getExtent();
            const size = ol.extent.getWidth(projectionExtent) / 256;
            let resolutions = new Array(14);
            const matrixIds = new Array(14);
            for (let z = 0; z < 14; ++z) {
                // WMTS용 해상도와 매트릭스 ID를 계산한다.
                resolutions[z] = size / Math.pow(2, z);
                if (opt.ekind === UDEF._EMAP_KIND._BASE) {
                    const level = pad(z + 5, 2);
                    matrixIds[z] = 'L' + level;
                } else {
                    matrixIds[z] = z + 5;
                }
            }

            resolutions = [2088.96, 1044.48, 522.24, 261.12, 130.56, 65.28, 32.64, 16.32, 8.16, 4.08, 2.04, 1.02, 0.51, 0.255];

            function loadTileUrl(imageTile, url) {
                if (defined(opt.apikey)) {
                    url = url + '&apikey=' + opt.apikey;
                }
                if (opt.useProxy) {
                    url = opt.proxy + url;
                }

                if (opt.xyorder === 'yx') {
                    //Col Row 반전 해서 보내기
                    const tmp = url.split('&');
                    const paramMap = {};
                    for (let i = 1; i < tmp.length; i++) {
                        const kv = tmp[i].split('=');
                        paramMap[kv[0]] = kv[1];
                    }
                    const col = paramMap['TileCol'];
                    paramMap['TileCol'] = paramMap['TileRow'];
                    paramMap['TileRow'] = col;
                    let newUrl = tmp[0];
                    const keys = Object.keys(paramMap);
                    for (let i = 0; i < keys.length; i++) {
                        newUrl += '&' + keys[i] + '=' + paramMap[keys[i]];
                    }
                    url = newUrl;
                }

                imageTile.getImage().src = url;
            }

            const tilegrid = new ol.tilegrid.WMTS({
                origin: [-200000.000000000, 4000000],
                resolutions: resolutions,
                matrixIds: matrixIds,
                tileSize: 256,
                extent: [-200000.0, -3015.4524155292, 3803015.45241553, 4000000.0],
                opacity: 1,
                transition: 0
            });
            //+jykim
            // WMTS 파라미터 변경위해 임시 추가
            parameter = parameter || {};
            Object.assign(opt, parameter);
            const source = new ol.source.WMTS({
                url: opt.url,
                layer: opt.layername,
                matrixSet: opt.matrixsetname,
                format: opt.ext,
                projection: proj5179,
                tileGrid: tilegrid,
                style: opt.stylename,
                crossOrigin: "Anonymous",
                opacity: 1,
                transition: 0
                // wrapX     : true, //+ x축으로 무한대로 표출
            });

            source.setTileLoadFunction(loadTileUrl);
            return new ol.layer.Tile({
                opacity: 1,
                source: source,
                transition: false
            });
        };

        const layers = [];
        layers.push({name: 'emap', callback: callback});

        opt.layers = layers;

        return self.create3dOpenLayer(opt);
    }


    /**
     * XML capabilities 조회가 필요한 WMTS 레이어를 생성하는 함수입니다.
     * @param {U3dWMTSLayerCO} opt WMTS 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayer | undefined} 생성된 U3dOpenLayer 레이어
     */
    createWMTSLayer(opt) {
        opt = opt || {};
        var self = this;
        var layer = self.getLayerByName(opt.name);
        if (defined(layer)) return undefined;

        opt.useProxy = defaultValue(opt.useProxy, false);
        opt.proxy = defaultValue(opt.proxy, 'proxy.jsp?url=');
        opt.drawarg = defaultValue(opt.drawarg, self._drawArg);
        // opt.proj = defaultValue(opt.proj, undefined);
        opt.matrixsetname = opt.matrixSet
        opt.stylename = ''
        opt.re = ''

        if (opt.needXml) {
            getWMTSLayerCapabilities.call(this, opt).then((xml) => {
                const xmlDoc = xml.responseXML;
                opt.geoextent = [
                    Number(xmlDoc.getElementsByTagName("LatLonBoundingBox")[0].getAttribute('minx')),
                    Number(xmlDoc.getElementsByTagName("LatLonBoundingBox")[0].getAttribute('miny')),
                    Number(xmlDoc.getElementsByTagName("LatLonBoundingBox")[0].getAttribute('maxx')),
                    Number(xmlDoc.getElementsByTagName("LatLonBoundingBox")[0].getAttribute('maxy'))
                ];

                if (opt.srs === undefined)
                    opt.srs = xmlDoc.getElementsByTagName("BoundingBox")[0].getAttribute('SRS')

                opt.boundingbox = {
                    minx: Number(xmlDoc.getElementsByTagName("BoundingBox")[0].getAttribute('minx')),
                    miny: Number(xmlDoc.getElementsByTagName("BoundingBox")[0].getAttribute('miny')),
                    maxx: Number(xmlDoc.getElementsByTagName("BoundingBox")[0].getAttribute('maxx')),
                    maxy: Number(xmlDoc.getElementsByTagName("BoundingBox")[0].getAttribute('maxy'))
                };
                return this.createWMTSTemplateLayer(opt);
            }).catch(() => {
                console.error('Capabilities 파일을 불러오는데 실패했습니다. 다시 시도해주세요');
            });
        }
    }

    /**
     * WMTS 공통 템플릿 레이어를 생성하는 함수입니다.
     * @param {U3dWMTSLayerCO} opt WMTS 템플릿 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayer | undefined} 생성된 U3dOpenLayer 레이어
     */
    createWMTSTemplateLayer(opt) {
        opt = opt || {};
        const self = this;
        let layer = self._layerlist.getLayer(opt.name);
        if (defined(layer)) return undefined;
        let url;
        if (defined(opt.url)) {
            url = opt.url;
        } else if (defined(opt.baseurl)) {
            url = opt.baseurl;
        } else {
            __GInfo__(self, "생성 옵션 중 baseurl(또는 url)이 누락되었습니다.", '4129769');
        }
        opt.url = url;
        const callback = function (parameter) {
            //const box = parameter.boundingbox;
            const maxLevel = opt.maxlevel
            const projSrs = ol.proj.get(opt.srs);
            let tilegrid;

            if (projSrs.code_ === "EPSG:5179") {
                const proj3857 = ol.proj.get("EPSG:3857");
                let projectionExtent = projSrs.getExtent();
                //const proj3857Extent = proj3857.getExtent();

                // let extent = [box.minx, box.miny, box.maxx, box.maxy];
                // extent = ol.proj.transformExtent(extent, projSrs, proj3857);
                // const size = ol.extent.getWidth(extent) / 256;

                let extent = ol.proj.transformExtent(projectionExtent, projSrs, proj3857);
                const size = ol.extent.getWidth(extent) / 256;

                let resolutions = new Array(14);
                let matrixIds = new Array(14);
                for (let z = 0; z < maxLevel; ++z) {
                    resolutions[z] = size / Math.pow(2, z);
                    matrixIds[z] = z + 5;
                }

                if (defined(opt.resolutions))
                    resolutions = opt.resolutions;

                tilegrid = new ol.tilegrid.WMTS({
                    // extent: projectionExtent,
                    tileSize: 256,
                    resolutions: resolutions,
                    origin: ol.extent.getTopLeft(projectionExtent),
                    matrixIds: matrixIds,
                });
            } else {
                const projectionExtent = projSrs.getExtent();
                const size = ol.extent.getWidth(projectionExtent) / 256;

                let resolutions = new Array(maxLevel);
                let matrixIds = new Array(maxLevel);
                for (let z = 0; z < maxLevel; ++z) {
                    resolutions[z] = size / Math.pow(2, z);
                    matrixIds[z] = z;
                }

                tilegrid = new ol.tilegrid.WMTS({
                    // extent: projectionExtent,
                    tileSize: 256,
                    resolutions: resolutions,
                    origin: ol.extent.getTopLeft(projectionExtent),
                    matrixIds: matrixIds,
                });
            }


            if (tilegrid === undefined)
                return

            // WMTS 파라미터를 전달받아 임시로 반영한다.
            parameter = parameter || {};
            Object.assign(opt, parameter);
            const source = new ol.source.WMTS({
                url: opt.url,
                layer: opt.layername,
                matrixSet: opt.matrixsetname,
                format: opt.ext,
                projection: projSrs,
                tileGrid: tilegrid,
                style: opt.stylename,
            });

            function loadTileUrl(imageTile, url) {
                if (opt.useProxy) {
                    url = opt.proxy + url;
                }

                let tmp = url.split('&');
                let paramMap = {};
                for (let i = 1; i < tmp.length; i++) {
                    let kv = tmp[i].split('=');
                    paramMap[kv[0]] = kv[1];
                }
                let tileMatrix = paramMap['TileMatrix'];
                let tilematrixset = paramMap['tilematrixset'];
                paramMap['TileMatrix'] = tilematrixset + ":" + tileMatrix


                let newUrl = tmp[0];
                let keys = Object.keys(paramMap);
                for (let i = 0; i < keys.length; i++) {
                    newUrl += '&' + keys[i] + '=' + paramMap[keys[i]];
                }
                url = newUrl;
                imageTile.getImage().src = url;
            }

            source.setTileLoadFunction(loadTileUrl);

            return new ol.layer.Tile({
                opacity: 1,
                source: source,
                transition: false
            });
        };

        const layers = [];
        layers.push({name: 'wmts', callback: callback});

        opt.layers = layers;
        return self.create3dImageWMTSLayer(opt);
    }

    /**
     * TMS 이미지 레이어를 생성하는 함수입니다.
     * @param {U3dTMSImageLayerCO} opt TMS 이미지 레이어 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayer | undefined} 생성된 U3dOpenLayer 레이어
     */
    createTMSImageLayer(opt) {
        opt = opt || {};
        var self = this;
        var layer = self._layerlist.getLayer(opt.name);
        if (defined(layer)) return undefined;

        var o3dLayer = undefined;

        UDEF.assert(defined(opt.name), '[name]param is null!');
        UDEF.assert(defined(opt.baseurl), '[baseurl]param is null!');

        var meta = opt.metadata;
        UDEF.assert(defined(meta), '[metadata]param is null!');
        UDEF.assert(defined(meta.srs), '[srs]param is null!');
        UDEF.assert(defined(meta.tileFormat), '[tileFormat]param is null!');
        UDEF.assert(defined(meta.raster), '[raster]param is null!');
        UDEF.assert(defined(meta.boundingBox), '[boundingBox]param is null!');
        UDEF.assert(defined(meta.profile), '[profile]param is null!');
        let srs = meta.srs.toUpperCase();
        let baseurl = opt.baseurl;
        let ext = meta.tileFormat.ext;
        let reverseY = meta.tileFormat.reverseY;
        if (!reverseY)
            reverseY = false;
        else {
            if (typeof (reverseY) === "string") {
                reverseY = JSON.parse(reverseY);
            }
        }

        let majorFolder = meta.majorFolder;
        let origin = meta.origin;

        opt.srs = srs;
        opt.boundingbox = Object.assign(meta.boundingBox);
        let profile = meta.profile;
        opt.profile = profile;

        if (opt.useproxy) {
            if (!defined(opt.proxyurl) || opt.proxyurl === '') {
                opt.proxyurl = './proxy.jsp?url=';
            }
        } else {
            opt.proxyurl = '';
        }

        let maxZoom = parseInt(meta.raster.maxlevel);
        if (defined(opt.maxlevel)) {
            maxZoom = parseInt(opt.maxlevel);
        }
        if (!defined(maxZoom))
            maxZoom = 19;

        let minZoom;
        if (!defined(opt.minlevel)) {
            minZoom = 14;
            if (minZoom >= maxZoom) {
                if (defined(meta.tilesets) && defined(meta.tilesets.list) && meta.tilesets.list instanceof Array) {
                    for (let tileset of meta.tilesets.list) {
                        if (defined(tileset.order) && minZoom > tileset.order) {
                            minZoom = tileset.order;
                        }
                    }
                } else {
                    minZoom = maxZoom - 1;
                }
            }
            opt.minlevel = minZoom;
        } else {
            minZoom = parseInt(opt.minlevel);
        }
        //+ 전지구 좌표에 격자로 쓰여지므로 3d에 대입 할 수 있다
        if (profile === 'mercator') {
            var proj3857 = ol.proj.get('EPSG:3857');
            var proj4326 = ol.proj.get('EPSG:4326');
            var minxy = ol.proj.transform([opt.boundingbox.minx, opt.boundingbox.miny], proj4326, proj3857);
            var maxxy = ol.proj.transform([opt.boundingbox.maxx, opt.boundingbox.maxy], proj4326, proj3857);
            let extent = [minxy[0], minxy[1], maxxy[0], maxxy[1]];

            let callback = function (parameter, sharedSources) {
                if (defined(sharedSources?.[0]))
                    return new ol.layer.Tile({opacity: 1, source: sharedSources[0], extent: extent});

                let url;
                let reverseStr = '-';
                if (reverseY) {
                    reverseStr = '';
                }

                if (defined(majorFolder) && majorFolder !== '' && majorFolder === UDEF.MAJORFOLDER.ROW) {
                    url = opt.proxyurl + baseurl + '/{z}/{' + reverseStr + 'y}/{x}' + "." + ext;
                } else {
                    url = opt.proxyurl + baseurl + '/{z}/{x}/{' + reverseStr + 'y}' + "." + ext;
                }
                //상수값 UDEF에 작성 예정
                if (minZoom < 7) {
                    minZoom = 7;
                }
                if (maxZoom < 8) {
                    maxZoom = 8;
                }
                var xyzSource = new ol.source.XYZ({
                    url: url,
                    minZoom: minZoom,
                    maxZoom: maxZoom,
                    transition: 1,
                    crossOrigin: "Anonymous"
                });
                return new ol.layer.Tile({opacity: 1, source: xyzSource, extent: extent});
            }

            let params = Object.assign({}, opt);
            params.boundingbox = Object.assign({}, opt.boundingbox);
            params.boundingbox.minx = minxy[0];
            params.boundingbox.miny = minxy[1];
            params.boundingbox.maxx = maxxy[0];
            params.boundingbox.maxy = maxxy[1];

            params.layers = [{name: params.name, callback: callback}];
            params.transparent = true;
            o3dLayer = self.create3dOpenLayer(params);
            o3dLayer.tms_ = true;
            return o3dLayer;
        }

        //+ 다른 tms는 전지구좌표의 격자에 맞게 바운더리가 재설정되어야 한다. (참조: 글로벌-타일-오버뷰.PNG)

        var tileSize = meta.tileFormat.width;
        var matrixIds = [];
        var resolutions = [];
        for (var i = 0; i <= maxZoom - 1; i++) {
            matrixIds[i] = i;
            resolutions[i] = meta.raster.maxresolution / Math.pow(2, i);
        }

        var callback = function (param, sharedSources) {
            let boundingBox = param.originBox;
            let extent = [boundingBox.minx, boundingBox.miny, boundingBox.maxx, boundingBox.maxy];
            let projection = undefined;
            if (defined(meta.proj) && defined(meta.proj.proj)) {
                projection = meta.proj.proj;
            }
            return self.createTempleteTMSImageLayer(baseurl, srs, profile, extent, tileSize, matrixIds, resolutions, ext, projection, minZoom, opt.proxyurl, opt.useproxy, reverseY, majorFolder, origin, sharedSources?.[0]);
        }

        opt.minresolution = resolutions[maxZoom - 1];
        opt.maxresolution = resolutions[0];
        opt.transparent = true;
        opt.layers = [{name: opt.name, callback: callback}];
        delete opt.metadata;
        o3dLayer = self.create3dOpenLayer(opt);
        o3dLayer.tms_ = true;
        return o3dLayer;
    }

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
    createTMSImageLayerAsXML(name, baseurl, srs, boundingBox, profile, ext, minlevel, maxlevel, tileWidth, maxresolution, proj, proxyurl, useproxy, reverseY, majorFolder, origin) {
        let opt = {};
        var self = this;
        var layer = self._layerlist.getLayer(name);
        if (defined(layer)) return undefined;

        var o3dLayer = undefined;

        opt.name = name;
        opt.baseurl = baseurl;
        UDEF.assert(defined(name), '[name]param is null!');
        UDEF.assert(defined(baseurl), '[baseurl]param is null!');
        UDEF.assert(defined(srs), '[srs]param is null!');
        UDEF.assert(defined(boundingBox), '[boundingBox]param is null!');
        UDEF.assert(defined(ext), '[ext]param is null!');
        UDEF.assert(defined(tileWidth), '[tileWidth]param is null!');
        UDEF.assert(defined(profile), '[profile]param is null!');

        if (useproxy) {
            if (!defined(proxyurl) || proxyurl === '') {
                proxyurl = './proxy.jsp?url=';
            }
        } else {
            proxyurl = '';
        }

        opt.useproxy = useproxy;
        opt.proxyurl = proxyurl;
        opt.srs = srs.toUpperCase();
        opt.boundingbox = Object.assign(boundingBox);
        opt.profile = profile;

        let maxZoom = parseInt(maxlevel);
        if (!defined(maxlevel)) {
            maxZoom = 19;
        } else {
            maxZoom = parseInt(maxlevel);
        }

        let minZoom;
        if (!defined(minlevel)) {
            if (defined(maxlevel) && maxlevel > 0)
                minZoom = maxZoom - 1;
            else
                minZoom = 14;
        } else {
            minZoom = parseInt(minlevel);
        }
        opt.minlevel = minZoom;
        //+ 전지구 좌표에 격자로 쓰여지므로 3d에 대입 할 수 있다
        if (profile === 'mercator') {
            const proj3857 = ol.proj.get('EPSG:3857');
            const proj4326 = ol.proj.get('EPSG:4326');
            const minxy = ol.proj.transform([boundingBox.minx, boundingBox.miny], proj4326, proj3857);
            const maxxy = ol.proj.transform([boundingBox.maxx, boundingBox.maxy], proj4326, proj3857);
            let extent = [minxy[0], minxy[1], maxxy[0], maxxy[1]];
            let url = "";
            let reverseStr = '-';

            if (reverseY) {
                reverseStr = '';
            }
            if (defined(majorFolder) && majorFolder !== '' && majorFolder === UDEF.MAJORFOLDER.ROW) {
                url = proxyurl + baseurl + '/{z}/{' + reverseStr + 'y}/{x}' + "." + ext;
            } else {
                url = proxyurl + baseurl + '/{z}/{x}/{' + reverseStr + 'y}' + "." + ext;
            }
            // 상수값 UDEF에 작성 예정
            if (minZoom < 7) {
                minZoom = 7;
            }
            if (maxZoom < 8) {
                maxZoom = 8;
            }
            opt.maxlevel = maxZoom;

            const callback = function (parameter, sharedSources) {
                if (defined(sharedSources?.[0]))
                    return new ol.layer.Tile({opacity: 1, source: sharedSources[0], extent: extent});

                var xyzSource = new ol.source.XYZ({
                    url: url,
                    minZoom: minZoom,
                    maxZoom: maxZoom,
                    transition: 1,
                    crossOrigin: "Anonymous"
                });
                return new ol.layer.Tile({opacity: 1, source: xyzSource, extent: extent});
            }

            let params = Object.assign({}, opt);
            params.boundingbox = Object.assign({}, opt.boundingbox);
            params.boundingbox.minx = minxy[0];
            params.boundingbox.miny = minxy[1];
            params.boundingbox.maxx = maxxy[0];
            params.boundingbox.maxy = maxxy[1];

            params.transparent = true;
            params.layers = [{name: params.name, callback: callback}];
            o3dLayer = self.create3dOpenLayer(params);
            o3dLayer.tms_ = true;
            return o3dLayer;
        }
        //+ 다른 tms는 전지구좌표의 격자에 맞게 바운더리가 재설정되어야 한다. (참조: 글로벌-타일-오버뷰.PNG)
        const tileSize = defaultValue(tileWidth, 256);
        var matrixIds = [];
        var resolutions = [];
        for (var i = 0; i <= maxZoom - 1; i++) {
            matrixIds[i] = i;
            resolutions[i] = maxresolution / Math.pow(2, i);
        }

        var callback = function (param, sharedSources) {
            let boundingBox = param.originBox;
            let extent = [boundingBox.minx, boundingBox.miny, boundingBox.maxx, boundingBox.maxy];
            if (proj && proj.proj) {
                proj = proj.proj;
            }
            return self.createTempleteTMSImageLayer(baseurl, srs.toUpperCase(), profile, extent, tileSize, matrixIds, resolutions, ext, proj, minZoom, proxyurl, useproxy, reverseY, majorFolder, origin, sharedSources?.[0]);
        }

        opt.minresolution = resolutions[maxZoom - 1];
        opt.maxresolution = resolutions[0];
        opt.transparent = true;
        opt.layers = [{name: name, callback: callback}];
        o3dLayer = self.create3dOpenLayer(opt);
        o3dLayer.tms_ = true;
        return o3dLayer;
    }

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
    createTempleteTMSImageLayer(baseurl, srs, profile, extent, tileSize, matrixIds, resolutions, ext, proj, minZoom, proxyurl, useproxy, reverseY, majorFolder, origin, sharedSource) {
        // 공유 source가 있으면 타일그리드와 XYZ source를 다시 만들지 않고 타일 전용 layer만 생성합니다.
        if (defined(sharedSource))
            return new ol.layer.Tile({source: sharedSource});

        if (useproxy) {
            if (!defined(proxyurl) || proxyurl === '') {
                proxyurl = './proxy.jsp?url=';
            }
        } else {
            proxyurl = '';
        }

        if (!defined(ol.proj.get(srs))) {
            if (!defined(proj)) {
                console.info('지원하지 않는 좌표계입니다. 좌표변환 시 정확한 값이 나오기 위해선 [proj] parameter가 필요합니다.');
            } else {
                ol.proj.setProj4((/** @type {any} */ (globalThis)).__UNION3D__.proj4);
                (/** @type {any} */ (globalThis)).__UNION3D__.proj4.defs(srs, proj);
            }
        }

        if (!defined(minZoom)) {
            minZoom = 14;
        } else {
            minZoom = parseInt(minZoom);
        }

        if (defined(origin)) {
            origin = [origin.x, origin.y];
        } else {
            origin = [extent[0], extent[1]];
        }

        var tileGrid = new ol.tilegrid.TileGrid({
            extent: extent,
            origin: origin,
            minZoom: minZoom,
            resolutions: resolutions,
            matrixIds: matrixIds,
            transition: 1
        });

        let url = "";
        let reverseStr = '';
        if (reverseY) {
            reverseStr = '-';
        }

        var xyzSource = new ol.source.XYZ({
            url: url,
            projection: srs,
            tileGrid: tileGrid,
            tileSize: [tileSize, tileSize],
            transition: 1,
            crossOrigin: "Anonymous"
        });

        if (defined(majorFolder) && majorFolder !== '' && majorFolder === UDEF.MAJORFOLDER.ROW) {
            url = proxyurl + baseurl + '/{z}/{' + reverseStr + 'y}/{x}' + "." + ext;
            xyzSource.setUrl(url);
        } else {
            url = proxyurl + baseurl + '/{z}/{x}/{' + reverseStr + 'y}' + "." + ext;

            function setTileUrlFunc(urlTileCoord) {
                var extent = this.tileGrid.getTileCoordExtent(urlTileCoord);
                var left = extent[0];
                var bottom = extent[3];
                var tilesize = this.tileGrid.getTileSize();
                var origin = this.tileGrid.getOrigin();
                var resolutions = this.getResolutions();
                var res = resolutions[urlTileCoord[0]];

                var x = Math.round((left - origin[0]) / (res * tilesize));
                var y = Math.round((bottom - origin[1]) / (res * tilesize));
                urlTileCoord[1] = x;
                urlTileCoord[2] = y - 1;
                //  console.log( '/' + urlTileCoord[0] + '/' + urlTileCoord[1] + '/' + urlTileCoord[2] );
                return proxyurl + baseurl + '/' + urlTileCoord[0] + '/' + urlTileCoord[1] + '/' + urlTileCoord[2] + "." + ext;
            }

            xyzSource.setUrl(url);
            xyzSource.setTileUrlFunction(setTileUrlFunc);
        }

        return new ol.layer.Tile({
            source: xyzSource
        });
    }

    /**
     * 현재 U3dApp에 등록된 지형(Terrain) 레이어를 반환하는 함수
     * @returns {import('@union3d/3dLayer/U3dTerrainLayer').U3dTerrainLayer | undefined} 지형 레이어
     */
    getTerrainLayer() {
        return this._terrainLayer;
    }

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
    createTerrainLayer(opt = {}) {
        const self = this;

        if (self._terrainLayer) {
            __GInfo__(this, "이미 TerrainLayer가 생성되어 등록되어 있습니다.", '0162978');
            return;
        }

        const layer = new U3dTerrainLayer(opt);

        if (defined(layer)) {
            self.addLayer(layer);
            self._terrainLayer = layer;
            //self._scene.add(layer.getScene());
        }
    }

    /**
     * 현재 U3dApp에 등록된 측정(Measure) 레이어를 반환하는 함수
     * @returns {import('@union3d/3dLayer/U3dShaderMeasureLayer').U3dShaderMeasureLayer | undefined} 측정 레이어
     */
    getMeasureLayer() {
        return this._measureLayer;
    }

    /**
     * U3dApp에 측정(Measure) 레이어를 생성하고 등록하는 함수
     * @param {object} opt 측정 레이어 생성 옵션
     * @returns {boolean} 생성 성공 여부
     */
    createMeasureLayer(opt) {
        var self = this;

        if (!defined(opt)) opt = {};

        var layer = new U3dShaderMeasureLayer(opt);

        if (defined(layer)) {
            self.addLayer(layer);
            self._measureLayer = layer;
        }

        self.updateData();

        return true;
    }


    /**
     * 입력 받은 위경도 좌표를 3D 월드 좌표로 변환하는 함수
     * @param {number} geoX 위경도 X좌표
     * @param {number} geoY 위경도 Y좌표
     * @param {number} height 높이
     * @returns {WorldPosition} 3D 월드 좌표
     */
    getGeographicToWorld(geoX, geoY, height) {
        return this._drawArg.getGeographicToWorld(geoX, geoY, height);
    }

    /**
     * 오버뷰 지도의 회전값을 설정합니다.
     *
     * @param {number} rad 회전값(라디안)
     * @returns {boolean} 설정 성공 여부
     *
     * @example
     * app.setRotationOverviewMap(rad);
     */
    setRotationOverviewMap(rad) {
        var self = this;
        if (!defined(self._overviewmap)) {
            ////   console.info('overviewmap is null!');
            return false;
        }

        self._overviewmap.setRotation(rad);
        return true;
    }

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
    setGeoCenterToOverviewMap(geox, geoy) {
        var self = this;
        if (!defined(self._overviewmap)) {
            //     console.info('overviewmap is null!');
            return false;
        }

        self._overviewmap.setGeoCenter(geox, geoy, false);
        return true;
    }

    /**
     * 지도 화면의 방위각(정북 기준 회전값)을 반환합니다.
     *
     * @param {boolean} [bAngle=false] `true`면 도(degree) 단위로, 생략하거나 `false`면 라디안으로 반환합니다
     * @returns {number | undefined} 방위각. 지도 컨트롤이 방위각을 지원하지 않으면 `undefined`
     *
     * @example
     * const degree = app.getRotation(true);
     */
    getRotation(bAngle) {
        var self = this;
        if (!defined(self._mapControl.getAzimuthalAngle))
            return;
        var rad = self._mapControl.getAzimuthalAngle();
        if (!defined(bAngle) || bAngle === false) {
            return rad;
        } else {
            var angle = UMathEngine.RadiansToDegrees(rad);
            if (angle < 0) {
                angle = 360 + angle;
            }
            return angle;
        }
    }

    // hskim add 190219
    /**
     * 지도 화면의 극각(카메라가 수직에서 기울어진 회전값)을 반환합니다.
     *
     * @param {boolean} [bAngle=false] `true`면 도(degree) 단위로, 생략하거나 `false`면 라디안으로 반환합니다
     * @returns {number} 극각
     *
     * @example
     * const degree = app.getRotationPolar(true);
     */
    getRotationPolar(bAngle) {
        var self = this;

        var rad = self._mapControl.getPolarAngle();
        if (!defined(bAngle) || bAngle === false) {
            return rad;
        } else {
            var angle = UMathEngine.RadiansToDegrees(rad);

            if (angle < 0) {
                angle = 360 + angle;
            }

            return angle;
        }
    }

    /**
     * 지도를 한 단계 확대합니다.<br>
     * 카메라와 화면 중심 사이의 거리를 절반으로 줄여 줌 레벨 1칸에 해당하는 만큼 다가갑니다.<br>
     * 목표 레벨을 지정하는 것이 아니라 현재 거리를 기준으로 움직이므로, 지형 충돌 보정으로 요청만큼 다가가지 못해도 다음 호출이 이어서 동작합니다.<br>
     * 현재 레벨이 이미 최대 줌 레벨 이상이면 아무것도 하지 않습니다.<br>
     * 지도 컨트롤이 아직 만들어지지 않았어도 아무것도 하지 않습니다.<br>
     * getZoom()이 돌려주는 레벨은 이 호출이 아니라 다음 화면 갱신에서 실측값으로 바뀝니다.
     */
    zoomIn() {
        // 절대 줌 레벨을 지정하지 않고 현재 카메라 거리를 기준으로 상대 이동한다.
        // 절대 레벨 방식은 요청 거리를 setResolution()으로 쓰고 실제 도달 거리를 floor 해서
        // 다시 읽는 구조라, 지형 충돌이나 거리 클램프로 요청 거리에 도달하지 못하면
        // 레벨이 제자리로 되돌아가 버튼이 멈춘다.
        //
        // _zoomLevel 은 frameMove() -> updateFrustum() -> onchange() 가 매 프레임 실측값으로
        // 갱신하므로 여기서 직접 쓰지 않아도 정수 레벨 장부는 그대로 유지된다.
        const mapControl = this._mapControl;
        if (!defined(mapControl)) return;

        // 컨트롤의 근거리 하한이 사실상 없어(minDistance 기본값 -1) 여기서 확대 상한을 잡지 않으면
        // 지형 충돌 보정이 꺼진 구간에서 카메라가 target에 붙어 줌 자체가 멈춘다.
        // onchange()와 같은 식을 써야 _zoomLevel 장부와 경계가 어긋나지 않는다.
        if (this.getZoomFromResolution(mapControl.getFocalDistance()) >= this._maxZoomLevel) return;

        mapControl.zoomIn(ZOOM_BUTTON_SCALE);
    }

    /**
     * 지도를 한 단계 축소합니다.<br>
     * 카메라와 화면 중심 사이의 거리를 두 배로 늘려 줌 레벨 1칸에 해당하는 만큼 멀어집니다.<br>
     * 현재 레벨이 이미 최소 줌 레벨 이하이면 아무것도 하지 않으며, 그 밖의 동작 방식은 zoomIn()과 같습니다.
     *
     * @see {@link U3dApp#zoomIn}
     */
    zoomOut() {
        const mapControl = this._mapControl;
        if (!defined(mapControl)) return;
        if (this.getZoomFromResolution(mapControl.getFocalDistance()) <= this._minZoomLevel) return;

        mapControl.zoomOut(ZOOM_BUTTON_SCALE);
    }

    /**
     * 거리에 따른 화면 해상도(Resolution)를 설정하는 함수
     * @param {number} distance 거리
     */
    setResolution(distance) {
        const camPos = this.getCamera().position;
        const targetPos = this.getMapControl().target;

        if (!camPos || !targetPos) return;

        const newPos = new THREE.Vector3();
        newPos.subVectors(camPos, targetPos).normalize().multiplyScalar(distance).add(targetPos);

        this._resolution = distance;
        this.getCamera().position.copy(newPos);
        this.getMapControl().zoomChanged(true).update();
    }

    /**
     * 화면 해상도(Resolution)를 반환하는 함수, 카메라와 컨트롤러 타겟의 거리를 의미, onChange 이벤트에서 자동으로 갱신하여 준다.
     * @returns {number} 설정된 화면 해상도 (ex : 350)
     */
    getResolution() {
        return this._resolution ?? DEFAULT_RESOLUTION;
    }

    getResolutionFromZoom(zoom) {
        return ((UDEF.GoogleCoordWidth * 2) / Math.pow(2, zoom));
    }

    getZoomFromResolution(resolution) {
        return Math.log2((UDEF.GoogleCoordWidth * 2) / resolution);
    }

    /**
     * 현재 지도의 줌 레벨을 반환합니다.
     *
     * @returns {number} 줌 레벨
     */
    getZoom() {
        return this._zoomLevel;
    }

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
    setZoom(zoom) {
        var resolution = this.getResolutionFromZoom(zoom);
        this.setResolution(resolution);
    }

    /**
     * 위경도 좌표(EPSG:4326)값을 받아 google 좌표(EPSG:3857)로 변환하는 함수
     * @param {number} geoX 위경도 좌표 X
     * @param {number} geoY 위경도 좌표 Y
     * @param {number} height 해발 고도
     * @returns {GooglePosition} google 좌표
     */
    getGeographicToGoogle(geoX, geoY, height = 0) {
        return this._drawArg.getGeographicToGoogle(geoX, geoY, height);
    }

    /**
     * google 좌표(EPSG:3857)값을 받아 위경도 좌표(EPSG:4326)로 변환하는 함수
     * @param {number} googlex google 좌표 X
     * @param {number} googley google 좌표 Y
     * @param {number} googlez google 좌표 Z
     * @returns {GeoPosition} 위경도 좌표
     */
    getGoogleToGeographic(googlex, googley, googlez = 0) {
        return this._drawArg.getGoogleToGeographic(googlex, googley, googlez);
    }

    /**
     * 3D 공간 바닥면 사각형(Rectangle)을 반환하는 함수. `위경도 좌표`를 가지고 있다.
     * @returns {import('@UGeoRect').UGeoRect} 3D 공간 바닥면 사각형(Rectangle)
     */
    getRectangle() {
        if (!this.isInitialized())
            return undefined;

        if (defined(this._drawArg))
            return this._drawArg.getRectangle();

        return undefined;
    }

    /**
     * 고도 레이어를 생성하는 함수
     * @param {string} name 고도 레이어 이름
     * @param {U3dHeightXYZLayerCO} opt  U3dHeightXYZLayer 레이어를 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dHeightXYZLayer').U3dHeightXYZLayer} U3dHeightXYZLayer 레이어 객체 반환
     */
    createHeightXYZLayer(name, opt) {
        const self = this;
        if (!defined(self._scene) || !defined(name))
            return undefined;

        if (name instanceof Object) {
            opt = name;
        } else {
            if (!defined(opt))
                return undefined;

            opt.name = name;
        }

        if (self._layerlist.findLayer(opt.name)) {
            __GWarn__(this, '[' + opt.name + '] 이름의 레이어가 이미 존재 합니다.', '*code=>');
            return undefined;
        }

        const layer = new U3dHeightXYZLayer(opt);
        if (defined(layer))
            self.addLayer(layer);

        return layer;
    }

    /**
     * 타일 레벨에 따른 화면 해상도(Resolution)을 반환하는 함수
     * @param {number} level 타일 레벨
     * @returns {number} 화면 해상도(Resolution)
     */
    googleResolution(level) {
        return UMathEngine.googleResolution(level);
    }

    /**
     * 타일을 순회하면서 callback 함수를 호출하는 함수
     * @param {function} callback 콜백 함수
     */
    traverseTiles(callback) {
        const self = this;
        if (defined(self._quadtreeSet))
            self._quadtreeSet.traverse(callback);
    }

    // TODO 실제 사용/동작 되는 함수인지 확인
    setWireFrameRendering(value) {
        var self = this;
        if (!defined(self._quadtreeSet) && UDEF.debug) {
            console.info('redraw failure. because of quadtree! ');
            return false;
        }
        if (!defined(self._quadtreeSet))
            return false;

        self._wireFrameRendering = value;

        self._quadtreeSet.setWireFrameRendering(self._drawArg, value);
        self.draw();
    }

    getWireFrameRendering() {
        var self = this;
        return self._wireFrameRendering;
    }

    /**
     * 레이어의 프로세스 업데이트 여부를 확인하는 함수
     * @param {String} [name] 레이어 이름 (undefined 일 경우 전체 레이어에 해당하는 값 반환)
     * @returns {boolean} 프로세스 업데이트 여부 [true : 업데이트 중, false : 업데이트 완료]
     */
    isUpdateProcess(name) {
        const self = this;
        return self.getWorking(name);
    }

    /**
     * 레이어의 프로세스 동작 여부를 반환하는 함수
     * @param {String} [name] 레이어 이름 (undefined 일 경우 전체 레이어에 해당하는 값 반환)
     * @returns {boolean} 프로세스 동작 여부 [true : 동작 중, false : 동작 안함]
     */
    getWorking(name) {
        const self = this;
        if (!defined(self._layerlist))
            return false;

        if (defined(name)) {
            const layer = self.getLayer(name);
            if (defined(layer)) {
                if (layer.getWorkingCount() > 0)
                    return true;
            }
        } else {
            const layers = self._layerlist._listmap;
            for (let i = 0; i < layers.length; i++) {
                if (layers[i].getWorkingCount() > 0)
                    return true;
            }
        }
        return false;
    }

    createWorkingEndEvent(name) {
        var self = this;
        if (defined(self._eventHandler)) {
            //   console.info(self._eventHandler._id);
            self._eventHandler.createWorkingEndEvent(name);
        }

        if (defined(self._layerlist)) {
            var layers = self._layerlist._listmap;
            layers.forEach(function (layer) {
                if (layer.getVisible()) {
                    layer.createWorkingEndEvent();
                }
            });
        }
    }

    /**
     * 동작 중인 프로세스 수를 반환하는 함수
     * @returns {number} 동작 중인 프로세스 수
     */
    getWorkingCount() {
        const self = this;
        return self.getProcessManager()?.getWorkingCount() || 0;
    }

    getWorkingLevel2() {
        const self = this;
        return self.getProcessManager()?.getWorkingLevel2() || 0;
    }

    getWorkingLevel3() {
        const self = this;
        return self.getProcessManager()?.getWorkingLevel3() || 0;
    }

    getWorkingImage() {
        var self = this;
        var count = 0;
        var layers = self.getInstanceModelLayers();
        layers.forEach(function (layer) {
            var layercount = layer.getWorkingLevel2();
            count += layercount;
        });

        return count;
    }

    getWorkingHeight(name) {
        var self = this;
        var count = 0;
        var layers = self.getInstanceHeightLayers();
        layers.forEach(function (layer) {
            var layercount = layer.getWorkingLevel2();
            count += layercount;
        });

        return count;
    }

    getWorkingModel() {
        var self = this;
        var count = 0;
        var layers = self.getInstanceModelLayers();
        layers.forEach(function (layer) {
            var layercount = layer.getWorkingLevel3();
            count += layercount;
        });

        return count;
    }

    getWorkingInDistance(opt) {
        opt = opt || {distance: 2000};
        var self = this;
        var count = 0;
        var layers = self._layerlist._listmap;
        layers.forEach(function (layer) {
            var layercount = layer.getWorkingInDistance(opt);
            count += layercount;
        });

        return count;
    }

    listenEndWork(callback, param) {
        var self = this;
        setTimeout(function () {
            listenEndWork(self, function () {
                if (defined(callback))
                    callback.call(self, param);
            }, param);

        }, 500);
    }

    /**
     * 3D 모델 레이어를 정적으로 로딩시켜, 한 번 가시화된 모델을 사라지지 않게 설정하는 함수
     * @param {boolean} tileloadall 정적로딩 활성 여부
     * @param {number} [maxDistance] 모델을 사라지지 않게 유지할 최대 거리
     * @returns {Promise<boolean>} 설정 적용이 끝난 시점의 Promise
     *
     * @example
     * app.keepModelByDistance(true).then(() => console.log('적용 완료'));
     * */
    keepModelByDistance(tileloadall, maxDistance) {
        let promise = deferred();
        var save = this._maxDistanceModel;
        if (defined(maxDistance)) {
            this._maxDistanceModel = maxDistance;

            if (save !== maxDistance)
                this.update();
        }

        this.applyAppFromParameter({tileloadall: tileloadall}, function () {
            promise.resolve(true);
        });

        return promise;
    }

    /**
     * 3D 모델 레이어를 정적으로 로딩시켜, 한 번 가시화된 모델을 사라지지 않게 설정하는 함수
     * @param {object} opt 정적로딩 parameter
     * @param {boolean} opt.tileloadall 정적로딩 활성 여부
     * @param {boolean} [opt.ratiotilesize] 타일 가로세로 비율
     * @param {boolean} [opt.stopmodel] 정적 모델 여부
     * @param {Function} [callback] 콜백함수
     * @param {object} [param] 콜백함수의 parameter
     */
    applyAppFromParameter(opt, callback, param) {
        const self = this;
        let redraw = false;

        //+ 표출되는 자료에 대한 범위 설정
        if (defined(opt.ratiotilesize)) {
            self.setRatioTileSize(opt.ratiotilesize);
            redraw = true;
        }

        let rRatioTileSize_ = undefined;

        if (defined(opt.tileloadall)) {
            if (opt.tileloadall === true) {
                // if (!defined(rRatioTileSize_)) rRatioTileSize_ = self.getRatioTileSize();

                self.setStopModel(true);
                self.listenEndWork(function () {
                    if (defined(callback))
                        callback.call(this, param);
                }, param);
            } else {

                //+ 쓰레기값 방지
                if (defined(rRatioTileSize_)) {
                    self.setRatioTileSize(rRatioTileSize_);
                }

                self.setStopModel(false);
                self.disposeTileModelAll(); //+  모델은 모두 지운다
                self.update();
                self.listenEndWork(function () {
                    if (defined(callback))
                        callback.call(this, param);
                }, param);
            }
        }

        if (redraw) {
            self.update(); //+ 네무 타이머 사용
        }

        if (defined(opt.stopmodel)) {
            self.setStopModel(opt.stopmodel);
        }
    }

    /**
     * dispose된 타일 위의 모델을 전체 제거하는 함수
     */
    disposeTileModelAll() {
        const self = this;
        const layers = self.getInstanceModelLayers();
        for (let i = 0; i < layers.length; i++)
            layers[i].disposeTileModelAll();
    }

    redraw(layername) {
        __GInfo__(this, 'redraw는 U3dLayer의 refresh 로 대체 되었습니다.', '5195046');
    }

    forceOuterDeleteModel(layername, limit = this.getMaxDistanceModel()) {
        if (!defined(limit)) return;

        const layers = this.getInstanceModelLayers();
        for (let i = 0; i < layers.length; i++) {
            if (defined(layername) && layername === layers[i]) {
                layers[i].disposeTileFromDistance(limit);
                break;
            } else
                layers[i].disposeTileFromDistance(limit);
        }
    }

    /**
     * 쿼드타일(QuadTile)울 새로고침합니다. <br>
     * 타일 출력을 초기화하고 현제 카메라 상태에 따른 타일을 다시 출력합니다.
     */
    restartQuadTree() {
        this.disposeQuadTree();
        this.createQuadTreeSet();

        this.updateData();
    }

    disposeQuadTree() {
        if (defined(this._quadtreeSet)) {
            this.#tileUpdateSensitivity = this._quadtreeSet.getUpdateSensitivity();
            this._quadtreeSet.dispose();
            /** @type {{_quadtreeSet: import('@U3dQuadSet').U3dQuadSet | undefined}} */ (this)._quadtreeSet = undefined;
        }
    }

    /**
     * U3dApp의 레이어를 삭제하는 함수
     * @param {string | import('@U3dLayer').U3dLayer} name 레이어 이름 또는 레이어 객체
     */
    removeLayer(name) {
        if (this.isDisposed())
            return;

        const self = this;
        let layer;
        if (name instanceof U3dLayer) {
            layer = name;
        } else {
            layer = self._layerlist.getLayer(name);
        }
        if (!defined(layer)) {
            U3dMessage.info('U3dApp', U3dMessage.CNT.CMM.NON_LAYER_AT_NAME, '8234115');
            return;
        }

        if (self._layerlist.removeLayer(layer.getName())) {
            //레이어 제거 성공 후 동작
            if (layer instanceof U3dHeightLayer) {
                self.disposeQuadTree();
                self.createQuadTreeSet();
            }
        }
    }

    /**
     * 앱에 등록된 레이어를 관리하는 목록 객체를 반환합니다.
     *
     * @returns {import('@union3d/3dLayer/U3dLayerList').U3dLayerList | undefined} 레이어 목록 객체
     *
     * @example
     * const layerList = app.getLayerList();
     */
    getLayerList() {
        return this._layerlist;
    }

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
    showLayer(name, show = true, deleteCache = false) {
        //+ 캐쉬 지우기 엽주
        const self = this;
        if (!defined(name) || !defined(self._quadtreeSet))
            return false;

        return UDEF.createPromise(function (resolve, reject) {
            const layer = self._layerlist.show(name, show);
            if (!defined(layer)) {
                U3dMessage.info('U3dApp', U3dMessage.CNT.CMM.NON_LAYER_AT_NAME + ` => [${name}]`, '9238521');
                reject({result: UDEF._MSG._FAIL, content: layer})
                return;
            }
            //+ 캐쉬 전체 지우기
            if (deleteCache === true)
                layer.disposeCache();

            if (show) {
                layer.once((/** @type {U3dLayer} */(layer)).constructor.EVENT.LOADED, () => {
                    resolve({result: UDEF._MSG._SUCCESS, content: layer});
                });
            } else {
                resolve({result: UDEF._MSG._SUCCESS, content: layer});
            }
        });
    }

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
    showImageLayer(...args) {
        return this.showLayer(...args);
    }

    /**
     * 이름이 같은 레이어를 찾아 반환합니다.
     *
     * @param {string} name 찾을 레이어 이름
     * @returns {import('@U3dLayer').U3dLayer | undefined} 찾은 레이어
     *
     * @example
     * const componentLayer = app.getLayer("component_01");
     */
    getLayer(name) {
        return this._layerlist.findLayer(name);
    }

    /**
     * 이름이 같은 레이어를 찾아 반환합니다.
     *
     * @param {string} [name] 찾을 레이어 이름
     * @returns {import('@U3dLayer').U3dLayer | undefined} 찾은 레이어
     *
     * @example
     * const layer = app.getLayerByName('satellite');
     */
    getLayerByName(name) {
        return this._layerlist.getLayerByName(name);
    }

    /**
     * 추가된 모든 레이어 목록을 반환하는 함수
     * @returns {Array<import('@U3dLayer').U3dLayer>} 레이어 목록 배열
     */
    getLayers() {
        return this._layerlist.getLayers();
    }

    isLoadingHeightLayers() {
        var self = this;
        var list = self._layerlist.getInstanceHeightLayers();
        if (!defined(list)) return false;

        for (var i = 0; i < list.length; i++) {
            if (list[i].isLoadingTile())
                return true;
        }
        return false;
    }

    isLoadingImageLayers() {
        var self = this;
        var list = self._layerlist.getInstanceImageLayers();
        if (!defined(list)) return false;

        for (var i = 0; i < list.length; i++) {
            if (list[i].isLoadingTile())
                return true;
        }
        return false;
    }

    getInstanceScenesFromAll() {
        var self = this;
        var layers = self.getLayers();
        var scenes = [];
        for (var i = 0; i < layers.length; i++) {
            if (layers[i].getScene() && layers[i].getVisible())
                scenes.push(layers[i].getScene())
        }

        return scenes;
    }

    getInstanceScenesFromVisibleImageLayer() {
        var self = this;
        var layers = self.getInstanceImageLayers();

        for (var i = 0; i < layers.length; i++) {
            if (layers[i].getScene() && layers[i].getVisible())
                return layers[i].getScene();
        }

        return undefined;
    }

    getInstanceScenesFromVisibleImageLayers() {
        var self = this;
        var layers = self.getInstanceImageLayers();
        var scenes = [];
        for (var i = 0; i < layers.length; i++) {
            if (layers[i].getScene() && layers[i].getVisible())
                scenes.push(layers[i].getScene())
        }

        return scenes;
    }

    /**
     * 첫 번째 지형 레이어의 Scene을 반환합니다.
     *
     * @returns {import('@UScene').UScene | undefined} 지형 Scene. 지형 레이어가 없으면 undefined
     *
     * @example
     * const terrainScene = app.getTerrainScene();
     */
    getTerrainScene() {
        var self = this;
        var layer = self.getInstanceTerrainLayers();
        if (layer.length > 0)
            return layer[0].getScene();
        else
            return undefined;
    }

    getInstanceUserLayers() {
        var self = this;
        return self._layerlist.getInstanceUserLayers();
    }

    getInstanceMeasureLayers() {
        var self = this;
        return self._layerlist.getInstanceMeasureLayers();
    }

    getInstanceMultipleComponentLayers() {
        var self = this;
        return self._layerlist.getInstanceMultipleComponentLayers();
    }

    getInstanceVectorTileLayers() {
        let self = this;
        return self._layerlist.getInstanceVectorTileLayers();
    }

    /**
     * 앱에 등록된 모델 레이어와 지형 레이어를 반환합니다.
     *
     * @returns {Array<import('@U3dLayer').U3dLayer>} 모델 및 지형 레이어 목록
     *
     * @example
     * const layers = app.getInstanceModelAndTerrainLayers();
     */
    getInstanceModelAndTerrainLayers() {
        var self = this;
        return self._layerlist.getInstanceModelAndTerrainLayers();
    }

    /**
     * 앱에 등록된 지형 레이어를 반환합니다.
     *
     * @returns {Array<import('@U3dLayer').U3dLayer>} 지형 레이어 목록
     *
     * @example
     * const terrainLayers = app.getInstanceTerrainLayers();
     */
    getInstanceTerrainLayers() {
        var self = this;
        return self._layerlist.getInstanceTerrainLayers();
    }

    /**
     * 화면에 보이는 사용자 레이어의 Scene을 반환합니다.
     *
     * @returns {Array<import('@UScene').UScene>} Scene 목록
     *
     * @example
     * const scenes = app.getInstanceSceneUserLayers();
     */
    getInstanceSceneUserLayers() {
        const self = this;
        const layers = self._layerlist.getInstanceUserLayers();
        const scenes = [];
        for (let layer of layers) {
            if (layer.getVisible()) {
                scenes.push(layer.getScene());
            }
        }

        return scenes;
    }

    getInstanceScenesFromModelLayers() {
        const self = this;
        const scenes = [];
        let layers = self._layerlist.getInstanceModelLayers();
        for (let layer of layers) {
            if (layer.getVisible()) {
                scenes.push(layer.getScene());
            }
        }

        layers = self._layerlist.getInstanceUserLayers();
        for (let layer of layers) {
            if (layer.getVisible()) {
                scenes.push(layer.getScene());
            }
        }

        let analy = this.getAnalysis('CustomModel');
        if (defined(analy)) {
            scenes.push(analy.getScene());
        }

        analy = this.getAnalysis('ViewCone');
        if (defined(analy)) {
            scenes.push(analy.getScene());
        }


        analy = this.getAnalysis('HeightLimit');
        if (defined(analy)) {
            scenes.push(analy.getScene());
        }

        return scenes;
    }

    getInstanceScenesFromTerrainLayers() {
        const self = this;
        const layers = self._layerlist.getInstanceTerrainLayers();
        const scenes = [];
        for (let layer of layers) {
            scenes.push(layer.getScene())
        }
        return scenes;
    }

    getInstanceScenesFromModelAndTerrainLayers() {
        const self = this;
        const scenes = [];
        let layers = self._layerlist.getInstanceModelAndTerrainLayers();
        for (let layer of layers) {
            if (layer._type === 'terrain' || layer.getVisible()) {
                scenes.push(layer.getScene());
            }
        }
        layers = self._layerlist.getInstanceUserLayers();
        for (let layer of layers) {
            if (layer.getVisible())
                scenes.push(layer.getScene());
        }

        //+ 가상건물 추가
        const analy = this.getAnalysis('CustomModel');
        if (defined(analy)) {
            scenes.push(analy.getScene());
        }

        return scenes;
    }

    /**
     * U3dApp에 있는 모델(3d) 레이어들을 반환하는 함수
     * @returns {Array} 모델 레이어 목록
     */
    getInstanceModelLayers() {
        return this._layerlist.getInstanceModelLayers();
    }

    getInstanceModelAndGroupLayers() {
        return this._layerlist.getInstanceModelAndGroupLayers();
    }

    /**
     * U3dApp에 있는 비디오 모델 레이어들을 반환하는 함수
     * @returns {Array<import('@U3dLayer').U3dLayer>} 비디오 모델 레이어 목록
     */
    getInstanceVideoLayers() {
        return this._layerlist.getInstanceVideoLayers();
    }

    /**
     * U3dApp에 있는 애니매이션 모델 레이어들을 반환하는 함수
     * @returns {Array<import('@U3dLayer').U3dLayer>} 애니매이션 모델 레이어 목록
     */
    getInstanceAnimationLayers() {
        return this._layerlist.getInstanceAnimationLayers();
    }

    /**
     * U3dApp에 있는 입력 받은 classtype과 같은 레이어들을 반환 하는 함수
     * @returns {Array<import('@U3dLayer').U3dLayer>} classtype 레이어 목록
     */
    getInstanceByClassTypeLayers(classType) {
        return this._layerlist.getInstanceByClassType(classType);
    }

    /**
     * U3dApp에 있는 고도 레이어들을 반환하는 함수
     * @returns {Array<import('@U3dLayer').U3dLayer>} 고도 레이어 목록
     */
    getInstanceHeightLayers() {
        return this._layerlist.getInstanceHeightLayers();
    }

    getInstanceImageAndUserLayers() {
        if (!defined(this._layerlist)) return undefined;
        return this._layerlist.getInstanceImageAndUserLayers();
    }

    /**
     * U3dApp에 있는 이미지 레이어들을 반환하는 함수
     * @returns {Array<import('@U3dLayer').U3dLayer> | undefined} 이미지 레이어 목록. 레이어 목록이 준비되지 않았으면 `undefined`
     */
    getInstanceImageLayers() {
        if (!defined(this._layerlist)) return undefined;
        return this._layerlist.getInstanceImageLayers();
    }

    getImageLayer(layername) {
        const layers = this._layerlist.getInstanceImageLayers();
        for (let layer of layers) {
            if (layer.getName() === layername)
                return layer;
        }
    }

    getInstanceClassifiedLayers(opt) {
        if (!defined(this._layerlist)) return undefined;

        const layers = this._layerlist.getInstanceClassifiedLayers(opt);
        layers.baselayer = this.getInstanceBaseLayer();
        return layers;
    }

    getInstanceLoadingLayers() {
        var self = this;
        if (!defined(self._layerlist)) return undefined;

        return self._layerlist.getInstanceLoadingLayers();
    }

    getInstanceTypeLayers(array) {
        var self = this;
        if (!defined(self._layerlist)) return undefined;

        return self._layerlist.getInstanceTypeLayers(array);
    }

    getHeightLayer(layername) {
        const layers = this._layerlist.getInstanceHeightLayers();
        for (let layer of layers) {
            if (layer.getName() === layername)
                return layer;
        }
    }

    /**
     * 등록된 높이(Height) 레이어 배열을 반환합니다.
     *
     * @returns {Array<import('@U3dLayer').U3dLayer>} 높이 레이어 배열
     *
     * @example
     * const heightLayers = app.getHeightLayers();
     */
    getHeightLayers() {
        return this._layerlist.getHeightLayers();
    }

    getImageLayers(layername) {
        return this._layerlist.getImageLayers();
    }

    getImageLayerLength() {
        const layers = this._layerlist.getImageLayers();
        if (!defined(layers)) {
            return 0;
        } else {
            return layers.length;
        }
    }

    getHeightLayerLength() {
        const layers = this._layerlist.getHeightLayers();
        if (defined(layers)) {
            return layers.length;
        } else {
            return 0;
        }
    }

    getModelLayerLength() {
        const layers = this._layerlist.getModelLayers();
        if (!defined(layers)) {
            return 0;
        } else {
            return layers.length;
        }
    }

    getUserLayers() {
        return this._layerlist.getUserLayers();
    }

    getUserLayerLength() {
        const layers = this._layerlist.getUserLayers();
        if (!defined(layers)) {
            return 0;
        } else {
            return layers.length;
        }
    }

    setLineStringMeasureType() {
        var self = this;
        self.setMeasureType('LineString');
    }

    setPolygonMeasureType() {
        var self = this;
        self.setMeasureType('Polygon');
    }

    setMeasureType(type) {
        var self = this;
        if (!defined(self._measureLayer)) {
            console.info('it is not initialized! because of measureLayer! ');
            return false;
        }

        self._measureLayer.setMeasureType(type);
    }

    /**
     * 지도상에 그려진 측정 POI들을 삭제하는 함수
     * @returns {boolean} 결과
     */
    clearMeasure() {
        var self = this;
        if (!defined(self._measureLayer)) {
            console.info('it is not initialized! because of measureLayer! ');
            return false;
        }

        self._measureLayer.clearMeasure();
        U3dBilboard.removeAll(self._scene);
        U3dBilboard.removeAll(self._sceneComment);
    }

    /**
     * 지도상에 측정을 위한 POI를 추가하는 함수
     * @param {GeoPosition} geo 위경도 좌표를 담은 object
     * @returns {function} measureLayer.addMeasurePoint(geo) 콜백함수
     * @example
     *  let geo = {x: 126.9380132919261, y: 37.51935824743521, z: 0}
     *  app.addMeasurePoint(geo);
     */
    addMeasurePoint(geo) {
        var self = this;
        if (!defined(self._measureLayer)) {
            console.info('it is not initialized! because of measureLayer! ');
            return false;
        }

        return self._measureLayer.addMeasurePoint(geo);
    }

    removeMeasureFeature(feature) {
        var self = this;
        if (!defined(self._measureLayer)) {
            console.info('it is not initialized! because of measureLayer! ');
            return false;
        }

        return self._measureLayer.removeFeature(feature);
    }

    commitMeasurePoint() {
        var self = this;
        if (!defined(self._measureLayer)) {
            console.info('it is not initialized! because of measureLayer! ');
            return false;
        }
        return self._measureLayer.commitFeature();
    }

    getTextPositionToMeasureArea() {
        var self = this;
        if (!defined(self._measureLayer)) {
            console.info('it is not initialized! because of measureLayer! ');
            return undefined;
        }

        return self._measureLayer.getTextPositionToMeasureArea();
    }

    getMeasureArea() {
        var self = this;
        if (!defined(self._measureLayer)) {
            console.info('it is not initialized! because of measureLayer! ');
            return undefined;
        }

        return self._measureLayer.getMeasureArea();
    }

    getMeasureLength() {
        var self = this;
        if (!defined(self._measureLayer)) {
            console.info('it is not initialized! because of measureLayer! ');
            return undefined;
        }

        return self._measureLayer.getMeasureLength();
    }

    getMeasureExtent() {
        var self = this;
        if (!defined(self._measureLayer)) {
            console.info('it is not initialized! because of measureLayer! ');
            return undefined;
        }

        return self._measureLayer.getMeasureExtent();
    }

    /**
     * 3D 그룹 모델 레이어를 생성하는 함수입니다.
     * @param {U3dModelGroupLayerCO} opt 그룹 레이어 생성 옵션
     * @returns {import('@union3d/3dLayer/U3dGroupLayer').U3dGroupLayer | false} 생성된 그룹 레이어
     */
    createModelGroupLayer(opt) {
        var self = this;
        if (!defined(opt)) {
            console.info('opt is null! ');
            return false;
        }

        if (self._layerlist.getLayer(opt.name)) {
            U3dMessage.error('U3dApp', U3dMessage.CNT.CMM.EXIST_LAYER);
            return false;
        }

        opt.app = this;
        opt.drawarg = this._drawArg;

        var layer = new U3dGroupLayer(opt);

        if (defined(layer))
            self.addLayer(layer);

        return layer;
    }

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
    createGridTileLayer(opt) {
        var self = this;
        if (!defined(opt)) {
            console.info('opt is null! ');
            return false;
        }

        if (self._layerlist.getLayer(opt.name)) {
            U3dMessage.error('U3dApp', U3dMessage.CNT.CMM.EXIST_LAYER);
            return false;
        }

        opt.app = this;
        opt.drawarg = this._drawArg;

        var layer = new U3dGridTileLayer(opt);

        if (defined(layer))
            self.addLayer(layer);

        return layer;
    }

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
    create3DFModelLayer(opt) {
        var self = this;
        if (!defined(opt)) {
            U3dMessage.info('U3dApp', U3dMessage.CNT.CMM.NON_PARAM_1, '9258952');
            return false;
        }

        if (self._layerlist.getLayer(opt.name)) {
            U3dMessage.error('U3dApp', U3dMessage.CNT.CMM.EXIST_LAYER, '9259141');
            return false;
        }

        var layer = new U3dModelU3FLayer(opt);

        if (defined(layer))
            self.addLayer(layer);
        return layer;
    }


    /**
     * 여러 컴포넌트로 구성된 모델 레이어를 생성하는 함수입니다.
     * @param {import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayerCO} opt 다중 컴포넌트 레이어 옵션
     * @returns {import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayer | false} 생성된 레이어
     */
    createMultipleComponentLayer(opt) {
        var self = this;
        if (!defined(opt)) {
            __GInfo__(this, '파라메터가 입력되지 않았습니다.', '4201742');
            return false;
        }
        var layer = new U3dMultipleComponentLayer(opt);
        if (defined(layer))
            self.addLayer(layer);
        return layer;
    }

    /**
     * BIM 객체 모델 레이어를 생성하는 함수입니다.
     * @param {U3dModelBIMObjLayerCO} opt BIM 객체 모델 레이어 옵션
     * @returns {import('@union3d/3dLayer/U3dModelBIMObjLayer').U3dModelBIMObjLayer | undefined} 생성된 레이어
     */
    createModelBIMObjLayer(opt) {
        let self = this;
        if (!defined(opt)) {
            console.info('opt is null! ');
            return;
        }
        let layer = new U3dModelBIMObjLayer(opt);
        if (defined(layer)) {
            if (defined(layer._classtype) && layer._classtype === 'U3dModelBIMObjLayer') {
                if (self.addLayer(layer)) {
                    return layer;
                }
            }
        }
    }

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
    createTdsModelLayer(option) {
        var self = this;
        if (!defined(option)) {
            console.info('opt is null! ');
            return false;
        }

        if (self._layerlist.getLayer(option.name)) {
            //    console.log('layer is existed!! failure!');
            return false;
        }

        var layer = new U3dModelTdsLayer(option);
        if (defined(layer)) {
            self.addLayer(layer);
        }

        return layer;
    }

    /**
     * 일반 XYZ 이미지 레이어를 생성하는 함수입니다.
     * @param {U3dImageLayerCO} opt XYZ 이미지 레이어 옵션
     * @returns {import('@union3d/3dLayer/U3dImageXYZLayer').U3dImageXYZLayer | false | undefined} 생성된 레이어
     */
    createXYZImageLayer(opt) {
        return this.createImageLayer(opt);
    }

    /**
     * 단순 이미지 레이어를 생성하는 함수
     * @param {U3dImageLayerCO} opt 이미지 레이어 옵션
     * @returns {import('@union3d/3dLayer/U3dImageXYZLayer').U3dImageXYZLayer | false | undefined} 생성된 레이어
     */
    createImageLayer(opt) {
        if (!defined(opt))
            return undefined;

        if (this._layerlist.getLayer(opt.name)) {
            U3dMessage.error('U3dApp', U3dMessage.CNT.CMM.EXIST_LAYER);
            return undefined;
        }

        const layer = new U3dImageXYZLayer(opt);

        if (defined(layer))
            this.addLayer(layer);

        return layer;
    }

    /**
     * WMS 이미지 레이어를 생성하는 함수입니다.
     * @param {U3dWMSImageLayerCO} opt WMS 이미지 레이어 옵션
     * @returns {import('@union3d/3dLayer/U3dImageWMSLayer').U3dImageWMSLayer | false} 생성된 레이어
     */
    createWMSImageLayer(opt) {
        if (!defined(opt))
            return false;

        if (this._layerlist.getLayer(opt.name)) {
            U3dMessage.error('U3dApp', U3dMessage.CNT.CMM.EXIST_LAYER);
            return false;
        }

        if (defined(opt.layernames))
            opt.layername = opt.layernames;

        if (defined(opt.url))
            opt.baseurl = opt.url;

        opt.transparent = true;

        const layer = new U3dImageWMSLayer(opt);

        if (defined(layer))
            this.addLayer(layer);
        return layer;
    }

    /**
     * WFS 모델 레이어를 생성하는 함수입니다.
     * @param {U3dWFSModelLayerCO} opt WFS 모델 레이어 옵션
     * @returns {import('@union3d/3dLayer/U3dModelWFSLayer').U3dModelWFSLayer | false} 생성된 레이어
     */
    createWFSModelLayer(opt) {
        var self = this;

        if (!defined(opt))
            return false;

        if (self._layerlist.getLayer(opt.name)) {
            U3dMessage.error('U3dApp', U3dMessage.CNT.CMM.EXIST_LAYER);
            return self.getLayer(opt.name);
            // return false;
        }


        if (defined(opt.layernames))
            opt.layername = opt.layernames;

        if (defined(opt.url))
            opt.baseurl = opt.url;

        opt.transparent = true;

        var layer = new U3dModelWFSLayer(opt);

        if (defined(layer))
            self.addLayer(layer);

        return layer;
    }

    /**
     * 지도화면의 컨테이너(div)를 반환하는 함수
     * @returns {HTMLElement} 지도화면의 div Element
     */
    container() {
        return this._container;
    }

    /**
     * 이벤트 핸들러를 생성하는 함수
     * @param {object} container
     * @param {U3dApp} app
     * @return {object} 이벤트 핸들러
     * @ignore
     */
    createEventHandler(container, app) {
        this._eventHandler = new U3dAppEventHandler(container, app);
        return this._eventHandler;
    }

    /**
     * 현재 적용된 톤 매핑 노출값을 반환합니다. <br>
     * 설정한 적이 없을 때의 기본값은 `getDefaultToneMappingExposure`로 확인합니다.
     *
     * @returns {number} 현재 노출값
     *
     * @example
     * const exposure = app.getToneMappingExposure();
     */
    getToneMappingExposure() {
        return this._toneExposure;
    }

    /**
     * 기본 톤 매핑 노출값을 반환합니다.
     *
     * @returns {number} 기본 노출값
     *
     * @example
     * const exposure = app.getDefaultToneMappingExposure();
     */
    getDefaultToneMappingExposure() {
        return UDEF.TONEMAPPING_EXPOSURE;
    }

    /**
     * 화면 밝기를 조절하는 톤 매핑 노출값을 설정합니다.
     *
     * @param {number} exposure 노출값
     *
     * @example
     * app.setToneMappingExposure(1.5);
     */
    setToneMappingExposure(exposure) {
        this._toneExposure = exposure;
        this._renderer.toneMappingExposure = exposure;
    }

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
    getRenderer() {
        return this._renderer;
    }

    createSpreadObject(opt) {
        let self = this;
        let engine = new UParticleEngine(self);

        engine.setValues(opt);
        let particle = engine.initialize();
        self._particles.push(particle);
        return particle;
    }

    createWindFlow(opt) {
        let self = this;
        let engine = new UParticleEngine(self);
        let windData = opt.windData;
        let segments = opt.segments;
        let extents = opt.extents;
        let height
        if (!defined(height)) height = 10;
        engine.setWindValues(opt, windData, extents);
        let particle = engine.initializeWind(segments, height);
        self._particles.push(particle);
        return particle
    }

    /**
     * 3D 라이브러리(THREE)를 반환하는 함수
     * @returns {THREE} THREE Libary
     */
    get3DLibrary() {
        return this._THREE;
    }

    /**
     * 전체 분석(analaysis)모드를 생성하는 함수
     * @ignore
     */
    createAnalysis() {
        var self = this;
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyArea());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyDistance());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyHeight());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyContour());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyLandScape());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalySurfaceVolume());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalySlope());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyObjectInfo());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyGizmoModel());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyAlignModel());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyMultipleComponent());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyRoad());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyCustomModel());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalySlopeAspect({app: self}));
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyCustomLand());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyRoute());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyAverageHeight());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyHeightLimit());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyViewCone());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyClipping());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyAlarm());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyDepth());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalySection());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyParticle());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalySun());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyPhysicalFlow());
        self.addAnalysis(new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalySkyLine());
    }

    /**
     * 분석 타입과 이름을 입력받아 분석모드를 생성하는 함수
     * @param type 분석 모드 타입 ('Area', 'Distance', 'Height' 등...)
     * @param name 분석 모드 이름
     * @returns {void|undefined|*} 분석모드(analy)
     */
    createAnalysisByTypeAndName(type, name) {
        if (!defined(type) || !defined(name)) {
            console.info('type/name is null!');
            return undefined;
        }

        var self = this;
        if (defined(self.getAnalysis(name))) {
            return console.error('Analysis name [' + analy.name + '] is duplicated.');
        }

        var analy = undefined;
        switch (type) {
            case 'Area': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyArea({name: name});
            }
                break;
            case 'Distance': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyDistance({name: name});
            }
                break;
            case 'Height': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyHeight({name: name});
            }
            case 'Contour': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyContour({name: name});
            }
                break;
            case 'LandScape': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyLandScape({name: name});
            }
                break;
            case 'SurfaceVolume': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalySurfaceVolume({name: name});
            }
                break;
            case 'Slope': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalySlope({name: name});
            }
                break;
            case 'ObjectInfo': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyObjectInfo({name: name});
            }
                break;
            case 'GizmoModel': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyGizmoModel({name: name});
            }
                break;
            case 'AlignModel': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyAlignModel({name: name});
            }
                break;
            case 'multipleComponent': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyMultipleComponent({name: name});
            }
                break;
            case 'Road': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyRoad({name: name});
            }
                break;
            case 'CustomModel': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyCustomModel({name: name});
            }
                break;
            case 'SlopeAspect': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalySlopeAspect({name: name});
            }
                break;
            case 'CustomLand': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyCustomLand({name: name});
            }
                break;
            case 'Route': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyRoute({name: name});
            }
                break;
            case 'AverageHeight': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyAverageHeight({name: name});
            }
                break;
            case 'HeightLimit': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyHeightLimit({name: name});
            }
                break;
            case 'ViewCone': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyViewCone({name: name});
            }
                break;
            case 'Clipping': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyClipping({name: name});
            }
                break;
            case 'Alarm': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyAlarm({name: name});
            }
                break;
            case 'Depth': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyDepth({name: name});
            }
                break;
            case 'Section': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalySection({name: name});
            }
                break;
            case 'Particle': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyParticle({name: name});
            }
                break;
            case 'SunAmount': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalySun({name: name});
            }
                break;
            case 'PhysicalFlow': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalyPhysicalFlow({name: name});
            }
                break;
            case 'SkyLine': {
                analy = new (/** @type {any} */ (globalThis)).GeOnDT.analysis.UAnalySkyLine({name: name});
            }
                break;
            default: {
                return console.error('Analysis type [' + type + '] is not defined.');
            }
        }

        UDEF.assert(defined(analy));
        self.addAnalysis(analy);
        return analy;

    }

    /**
     * 분석모드를 추가하는 함수
     * @param {import('@UAnaly').UAnaly} analy 추가할 분석모드
     */
    addAnalysis(analy) {
        var self = this;
        if (defined(self.getAnalysis(analy.name))) {
            return console.error('Analysis name [' + analy.name + '] is duplicated.');
        }
        analy.setApp(this);
        self._analysisList.push(analy);
    }

    /**
     * 선택(select)을 추가하는 함수
     * @param {import('@union3d/select/U3dSelect').U3dSelect} select 선택 객체
     */
    addSelect(select) {
        select.setApp(this);
    }

    /**
     * 선택(select)을 제거하는 함수
     * @param {import('@union3d/select/U3dSelect').U3dSelect} select 선택 객체
     */
    removeSelect(select) {
        select.remove();
    }

    /**
     * 분석모드 이름을 입력받아 분석모드를 제거하는 함수
     * @param {string} name 분석모드 이름
     */
    removeAnalysis(name) {
        var self = this;
        var analy = self.getAnalysis(name);
        if (!defined(analy)) {
            return console.error('Analysis ' + name + ' is not exist.');
        }
        analy.deactive();
        analy.clear();
        self._analysisList.splice(self._analysisList.indexOf(analy), 1);
    }

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
    getAnalysis(name) {
        var self = this;
        var result = undefined;

        if (typeof name === 'string') {
            self._analysisList.find(function (analy) {
                if (analy.name === name) {
                    result = analy;
                    return true;
                } else {
                    return false;
                }
            })
        } else {
            var idx = self._analysisList.indexOf(name);
            if (idx !== -1) {
                result = self._analysisList[idx];
            }
        }
        return result;
    }

    /**
     * 입력받은 이름의 Analysis(분석모듈)을 활성화 하는 함수
     * @template {string} TAnalysisName
     * @param {TAnalysisName} name Analysis의 이름
     * @returns {(TAnalysisName extends keyof U3dAnalysisTypeMap ? U3dAnalysisTypeMap[TAnalysisName] : import('@UAnaly').UAnaly) | undefined} 활성화된 분석모드. 이름에 해당하는 분석모드가 없으면 `undefined`
     */
    activeAnalysis(name) {
        var analy = this.getAnalysis(name);
        if (!defined(analy)) {
            return;
        }
        analy.active();
        return analy;
    }

    /**
     * 입력받은 이름의 Analysis(분석모듈)을 비활성화 하는 함수
     * @param {string} name Analysis의 이름
     * @returns {import('@UAnaly').UAnaly | undefined} 비활성화된 분석모드. 이름에 해당하는 분석모드가 없으면 `undefined`
     */
    deactiveAnalysis(name) {
        var analy = this.getAnalysis(name);
        if (!defined(analy)) {
            return;
        }
        analy.deactive();
        return analy;
    }

    /**
     * 입력받은 이름의 Analysis(분석모듈)의 내용을 초기화 하는 함수
     * @param {string} name Analysis의 이름
     * @returns {import('@UAnaly').UAnaly | undefined} 내용이 초기화된 분석모드. 이름에 해당하는 분석모드가 없으면 `undefined`
     */
    clearAnalysis(name) {
        var analy = this.getAnalysis(name);
        if (!defined(analy)) {
            return;
        }
        analy.clear();
        return analy;
    }

    /**
     * 모든 Analysis(분석모듈)를 비활성화 하는 함수 (ex. UAnalyArea(면적), UAnalyHeight(고도), UAnalyLandScape(조망권) etc.)
     */
    deactiveAllAnalysis() {
        var ary = this._analysisList;
        for (var i = 0; i < ary.length; i++) {
            ary[i].deactive();
        }
    }

    /**
     * 모든 Analysis(분석모듈)의 내용을 초기화하는 함수
     */
    clearAllAnalysis() {
        var ary = this._analysisList;
        for (var i = 0; i < ary.length; i++) {
            ary[i].clear();
        }
    }

    /**
     * app의 Camera를 생성하는 함수
     * @param near 카메라 최소 거리
     * @param far 카메라 최대 거리
     * @param fov 카메라 시야각
     * @return {import('@UCamera').UCamera} app의 Camera
     * @ignore
     */
    createCamera(near, far, fov) {
        let aspect = this._container.clientWidth / this._container.clientHeight;

        if (!defined(aspect) || isNaN(aspect))
            aspect = 1;

        if (this._cameraType === 'orthographic') {
            // perspective의 초기 카메라 높이(z=1000)와 FOV로부터 동일한 시야 크기를 산출
            const initHeight = (this._homePosition && this._homePosition.z > 0) ? this._homePosition.z : 1000;
            const fovRad = (fov || 50) * Math.PI / 180;
            const halfH = Math.tan(fovRad * 0.5) * initHeight;
            const halfW = halfH * aspect;
            const cameraOpt = {
                left: -halfW,
                right: halfW,
                top: halfH,
                bottom: -halfH,
                drawarg: this._drawArg
            };
            this._camera = new UOrthographicCamera(cameraOpt);
        } else {
            const cameraOpt = {
                fov: fov,
                aspect: aspect,
                near: near,
                far: far,
                drawarg: this._drawArg
            };
            this._camera = new UCamera(cameraOpt);
        }

        this._camera.up = new THREE.Vector3(0, 0, 1);
        this._drawArg.setCamera(this._camera);

        if (!this._collapse) {
            this.createCollapse(this._camera, this._drawArg);
        }

        return this._camera;
    }

    /**
     * 요청한 유형으로 카메라를 교체합니다.<br>
     * 전환한 카메라는 위치와 방향을 유지하고, 화면상 시야 크기를 맞춥니다.<br>
     * 카메라 또는 지도 제어기가 준비되지 않았으면 카메라를 교체하지 않고 현재 값을 반환합니다.
     *
     * @param {'perspective' | 'orthographic'} type 교체할 카메라 유형. perspective(원근) 또는 orthographic(직교)
     * @returns {UCamera | UOrthographicCamera | undefined} 호출 후 앱에서 사용하는 카메라 또는 카메라가 없을 때 `undefined`
     */
    setCameraType(type) {
        const self = this;
        const oldCamera = self._camera;
        const control = self._mapControl;

        if (!oldCamera || !control) return oldCamera;

        const isOrtho = type === 'orthographic';
        if (isOrtho === oldCamera.isOrthographicCamera) return oldCamera; // 이미 같은 타입

        const aspect = self._container.clientWidth / self._container.clientHeight || 1;
        const fovDeg = oldCamera._fov ?? 50;
        const fovRad = THREE.MathUtils.degToRad(fovDeg);

        // 현재 카메라 상태 보존
        const oldPos = oldCamera.position.clone();
        const oldQuat = oldCamera.quaternion.clone();
        const target = control.target.clone();
        const dist = oldPos.distanceTo(target);

        let newCamera;

        if (isOrtho) {
            // perspective → orthographic
            // 현재 거리와 FOV로부터 지면 기준 뷰 크기 계산
            const halfH = dist * Math.tan(fovRad * 0.5);
            const halfW = halfH * aspect;
            const cameraOpt = {
                left: -halfW,
                right: halfW,
                top: halfH,
                bottom: -halfH,
                drawarg: self._drawArg
            };
            newCamera = new UOrthographicCamera(cameraOpt);
        } else {
            // orthographic → perspective
            const cameraOpt = {
                fov: fovDeg,
                aspect: aspect,
                near: self._near,
                far: self._far,
                drawarg: self._drawArg
            };
            newCamera = new UCamera(cameraOpt);

            // 오쏘의 뷰 폭에 맞춰 퍼스펙티브 카메라 거리 재배치
            const orthoViewH = (oldCamera.top - oldCamera.bottom) / oldCamera.zoom;
            const newDist = orthoViewH / (2 * Math.tan(fovRad * 0.5));
            const dir = oldPos.clone().sub(target).normalize();
            oldPos.copy(target).addScaledVector(dir, newDist);
        }

        // 위치·방향 복사
        newCamera.up.set(0, 0, 1);
        newCamera.position.copy(oldPos);
        newCamera.quaternion.copy(oldQuat);
        newCamera.updateMatrixWorld(true);

        // 참조 교체
        self._camera = newCamera;
        self._cameraType = type;
        self._drawArg.setCamera(newCamera);
        control.object = newCamera;

        // UCollapse 카메라 교체 (앵커 기반 패닝/줌 레이캐스팅에 사용됨)
        if (self._collapse) {
            self._collapse._camera = newCamera;
        }

        // Frustum 타입 및 내부 캐시 갱신
        if (self._frustum) {
            self._frustum.type = isOrtho ? 'orthofrustum' : 'frustum';
            self._frustum._tc_o = null; // inner frustum 카메라 캐시 초기화
        }

        // 오쏘 초기화
        if (isOrtho) {
            newCamera.updateAutoClip?.();
        }

        // 화면 비율 재적용
        self.resize();

        return newCamera;
    }

    /**
     * 앱에서 사용하는 현재 카메라 유형을 반환합니다.
     *
     * @returns {'perspective' | 'orthographic'} 현재 카메라 유형. perspective(원근) 또는 orthographic(직교)
     */
    getCameraType() {
        return this._cameraType;
    }

    /**
     * 한반도를 비추도록 카메라를 이동시키는 함수
     *
     * @param {import('@UCamera').UCamera} camera 이동시킬 카메라
     */
    setCameraFitKorea(camera) {
        // 한반도 전역 지도화면
        const point = {
            x: 126.995168,
            y: 37.5696041,
            z: 1000
        };

        camera.position.copy(this.getGeographicToWorld(point.x, point.y, point.z));
        camera.updateMatrixWorld();
        this._mapControl.target.x = camera.position.x;
        this._mapControl.target.y = camera.position.y;
    }

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
    getCameraState() {
        const self = this;
        const distance = self.getResolution();

        const position = self.getCameraGeographicPosition();
        const target = self.getCameraGeographicTargetPoint();
        const azimuth = self._mapControl.getAzimuthalAngle();
        const polar = self._mapControl.getPolarAngle();
        const info = {
            camera: position,
            center: target,
            distance: distance,
            azimuth: azimuth,
            polar: polar,
            homePosition: [target.x, target.y, distance, azimuth / (Math.PI / 180), polar / (Math.PI / 180)],
            type: CAMERA_STATE_TYPE.GEOGRAPHIC,
            height: self.getCameraHeight(),
            app: self
        }

        return new UCameraState(info);
    }

    /**
     * 현재 카메라 상태를 저장하는 함수
     * 이후에 loadSavedCameraState API 를 사용 하여 현재의 위치와 각도로 불러오는 방식으로 사용 가능
     *
     * @returns {import('@union3d/core/UCameraState').UCameraState | undefined} 저장된 카메라 상태
     *
     * @example
     * const info = app.saveCameraState();
     */
    saveCameraState() {
        const self = this;
        const info = self.getCameraStateFromWorld();

        self.setSavedCameraState(info);
        __GInfo__(self, '현재의 카메라 상태가 저장 되었습니다. 현재의 위치로 돌아오려면 loadCameraState API 사용하십시오.', '7227692');

        return self.getSavedCameraState();
    }

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
    loadCameraState(info, duration) {
        const self = this;
        let state = info;
        if (!state)
            state = self.getSavedCameraState();

        let position;
        let target;
        if (state) {
            try {
                let cameraState = state;
                if (!(cameraState instanceof UCameraState)) {
                    // 평문 상태 객체는 UCameraState로 승격해야 좌표계 변환에 필요한 app 참조를 갖는다.
                    const option = /** @type {any} */ (cameraState);
                    if (!option.app) option.app = self;

                    cameraState = new UCameraState(option);
                }
                position = cameraState.getPosition();
                target = cameraState.getPositionTarget();
            } catch {
                __GInfo__(self, '입력된 정보가 올바른 형식이 아닙니다.', '7228581');
                return;
            }
        }

        if (!position || !target) {
            __GInfo__(self, '저장된 카메라 상태 정보가 없습니다.', '7228399');
            return;
        }

        if (self.is2DMode()) {
            // 2D 모드는 기울기를 복원할 수 없다.
            // 저장된 카메라-타겟 거리를 그대로 고도로 사용해 화면 축척만이라도 동일하게 맞춘다.
            const distance = Math.hypot(position.x - target.x, position.y - target.y, position.z - target.z);
            position = new THREE.Vector3(target.x, target.y, target.z + distance);
        }

        return self.flyToPosition(position, target, duration);
    }

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
    getCameraStateFromWorld() {
        const self = this;
        const distance = self.getResolution();

        const position = self.getCameraPosition();
        const target = self.getCameraTargetPoint();
        const azimuth = self._mapControl.getAzimuthalAngle();
        const polar = self._mapControl.getPolarAngle();

        const info = {
            camera: position,
            center: target,
            distance: distance,
            azimuth: azimuth,
            polar: polar,
            homePosition: [target.x, target.y, distance, azimuth / (Math.PI / 180), polar / (Math.PI / 180)],
            type: CAMERA_STATE_TYPE.WORLD,
            app: self
        }

        return new UCameraState(info);
    }

    /**
     * 카메라의 위치를 반환하는 함수
     * @returns {WorldPositionVector3} 카메라 위치 좌표
     */
    getCameraPosition() {
        return this._drawArg.getCameraPosition();
    }

    /**
     * 카메라가 비추는 target의 위치를 반환하는 함수
     * @returns {WorldPosition} 카메라 target 위치 좌표
     */
    getCameraTargetPosition() {
        return this._mapControl.target.clone();
    }

    /**
     * 카메라의 위경도 위치를 반환하는 함수
     * @returns {GeoPosition|null} 카메라의 위경도 위치 좌표
     */
    getCameraGeographicPosition() {
        const cameraPosition = this._drawArg.getCameraPosition();
        if (defined(cameraPosition)) {
            const geoPosition = this._drawArg.getWorldToGeographic(cameraPosition.x, cameraPosition.y, cameraPosition.z);
            if (defined(geoPosition)) {
                return geoPosition;
            }
        }
        return null;
    }

    /**
     * 지면 높이를 높이를 반영하여 카메라의 고도값을 반환하는 함수
     * @returns {number} 카메라 고도값 (미터)
     */
    getCameraRelativeHeight() {
        const camPos = this._camera.position;
        const groundZ = this._drawArg.getRenderHeightAtPoint(camPos.x, camPos.y); //확인됨. 계산은 3857 스케일로
        const readScale = UMathEngine.getRealScaleAtGoogle(camPos.y);
        return (camPos.z - groundZ) * readScale; //리턴은 미터 스케일로
    }

    /**
     * 해발 고도 기준 카메라의 고도값을 반환하는 함수
     * @returns {number} 카메라 고도값 (미터)
     */
    getCameraHeight() {
        const readScale = UMathEngine.getRealScaleAtGoogle(this._camera.position.y);
        return this._camera.position.z * readScale; //리턴은 미터 스케일로
    }

    /**
     * 카메라 타겟의 위경도 좌표를 반환하는 함수
     * @returns {GeoPosition} 타겟의 위경도 좌표
     */
    getCameraGeographicTargetPoint() {
        const position = this._mapControl.target.clone();
        return this.vector3ToGeoGraphic(position);
    }

    /**
     * 카메라 타겟의 좌표를 반환하는 함수
     * @returns {WorldPosition} 타켓의 좌표
     */
    getCameraTargetPoint() {
        var self = this;
        var control = self._mapControl;
        var position = control.target.clone();
        return position;
    }

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
    setCameraGeographicPosition(
        geoX,
        geoY,
        Z,
        leftRotate,
        downRotate,
        targetZ,
        durationTime
    ) {

        var self = this;
        var geox = Number(geoX);
        var geoy = Number(geoY);
        var z = Number(Z);
        var left = Number(leftRotate);
        var down = Number(downRotate);

        if (isNaN(geox) || isNaN(geoy) || isNaN(z)) {
            return new Promise.resolve(false);
        }

        left = isNaN(left) ? 0 : left;
        down = isNaN(down) ? 0 : down;


        var gGoogle = UMathEngine.getGeographicToGoogle(geox, geoy);

        return self.setCameraGooglePosition(gGoogle.x, gGoogle.y, Z, left, down, targetZ, durationTime);
    }

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
    setCameraGooglePosition(
        googleX,
        googleY,
        Z,
        leftRotate,
        downRotate,
        targetZ,
        durationTime
    ) {
        return this.setCameraPosition(googleX, googleY, Z, leftRotate, downRotate, targetZ, durationTime);
    }

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
    setCameraWorldPosition(opt) {
        opt = opt || {};
        var self = this;

        let rect = self.getRectangle();
        if (!rect.contain(opt.x, opt.y)) {
            U3dMessage.info('U3dApp', 'The input coordinates are out of map range.', '0305677');
            return;
        }

        return self.setCameraPosition(opt.x, opt.y, opt.z, opt.rotateX, opt.rotateY);
    }

    /**
     * 카메라 타겟의 z값을 0으로 조정하는 함수
     */
    setCameraTargetZeroZ() {
        var self = this;
        if (defined(self._camera)) {
            self._mapControl.target.z = 0;
        }
    }

    /**
     * 카메라 기준 중심점의 높이를 현재 카메라의 높이 값과 동일하게 조정하는 함수
     */
    setCameraTargetZ() {
        var self = this;
        if (defined(self._camera)) {
            var azimuthalAngleRad = self._mapControl.getAzimuthalAngle();
            var azimuthalAngle = THREE.MathUtils.radToDeg(azimuthalAngleRad);

            var polarAngleRad = self._mapControl.getPolarAngle();
            var polarAngle = THREE.MathUtils.radToDeg(polarAngleRad);

            self._mapControl.target.z = self._camera.position.z - 0.1;
            self._mapControl.rotateLeftDegree(azimuthalAngle);
            self._mapControl.rotateDownDegree(polarAngle);

            self._mapControl.update();
        }
    }

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
    setCameraTarget(position, positionType = UDEF.POINT_TYPE.GEOGRAPHIC, distance) {
        var self = this;
        if (!defined(position)) {
            return;
        }
        const promise = deferred();
        let target;

        if (positionType === UDEF.POINT_TYPE.GEOGRAPHIC) {
            target = self.getGeographicToWorld(position.x, position.y, position.z)
        } else {
            target = new THREE.Vector3(position.x, position.y, position.z);
        }

        try {
            const controlDirect = new THREE.Vector3().subVectors(self._mapControl.target, self._camera.position);
            controlDirect.z = 0;
            const newTarget = new THREE.Vector3().subVectors(target, self._camera.position);
            newTarget.z = 0;

            newTarget.setLength(controlDirect.length());
            newTarget.z = -self._camera.position.z;
            newTarget.add(self._camera.position);

            const distanceX = target.x - newTarget.x;
            const distanceY = target.y - newTarget.y;

            newTarget.x = newTarget.x + distanceX;
            newTarget.y = newTarget.y + distanceY;

            self._camera.position.x = self._camera.position.x + distanceX;
            self._camera.position.y = self._camera.position.y + distanceY;
            self._mapControl.target.copy(newTarget);
            if (distance) {
                controlDirect.subVectors(self._camera.position, self._mapControl.target);
                controlDirect.setLength(distance);
                self._camera.position.addVectors(controlDirect, self._mapControl.target);
            }

            self._mapControl.update();
            setTimeout(() => {
                self.changeUpdate();
                promise.resolve(true);
            }, 0.1);
        } catch (e) {
            __GError__(self, "카메라 타겟 설정 중 오류가 발생하였습니다.", '8235540');
            promise.reject(false);
        }
        return promise;
    }

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
    setCameraPosition(x, y, z, leftrotate, downrotate, targetZ, durationTime) {
        const self = this;
        // 초기값 설정
        leftrotate = leftrotate ?? 0
        downrotate = downrotate ?? 60;
        targetZ = targetZ ?? 100;
        durationTime = durationTime ?? 100;
        const promise = deferred();
        self.stopFly();
        // 카메라를 직접 이동시키므로 진행 중인 2D/3D 모드 전환은 취소한다.
        self.#cancelViewAngleChange();
        if (!defined(self._camera) || !defined(self._mapControl)) return promise.reject();

        try {
            downrotate = THREE.MathUtils.clamp(downrotate, 0.1, 179.9);
            if (targetZ === 0) targetZ = 100;

            const target = new THREE.Vector3(x, y, z);
            const dir = new THREE.Vector3();
            const az = THREE.MathUtils.degToRad(leftrotate);
            const el = THREE.MathUtils.degToRad(downrotate);

            const sinEl = Math.sin(el);   // xy 평면 크기
            const cosEl = Math.cos(el);   // Z축 방향

            dir.x = Math.sin(az) * sinEl;
            dir.y = -Math.cos(az) * sinEl;
            dir.z = cosEl;

            const position = target.clone().add(dir.multiplyScalar(targetZ));
            const callbacks = {
                complete: () => {
                    self._isTwenning = false;
                    self.changeUpdate();
                    self.once(self.constructor.EVENT.LOADED, () => {
                        promise.resolve();
                    });
                },
                stop: () => {
                    self._isTwenning = false;
                    promise.resolve();
                }
            }
            self._isTwenning = true;
            self._mapControl.flyTo(position, target, durationTime, undefined, callbacks);
        } catch (e) {
            __GSError__(e);
            promise.reject(e);
        }

        return promise;
    }

    setCameraPositionDirect(x, y, z, leftrotate, downrotate) {
        try {
            this.setCameraGeographicPosition(x, y, z, leftrotate, downrotate, undefined, 0);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * UAnimationController 생성 헬퍼.
     * drawArg는 현재 app의 drawArg로 자동 주입된다.
     * @param {Partial<UAnimationControllerCO>} opt
     * @returns {import('@UAnimationController').UAnimationController|undefined}
     */
    makeAnimationController(opt = {}) {
        try {
            return new UAnimationController(Object.assign({
                drawArg: this._drawArg
            }, opt));
        } catch (e) {
            __GError__(this, `Animation Controller를 생성할 수 없습니다. ${e}`, '8450757');
        }
    }

    createCharacterControls(opt) {
        var _self = this;
        if (defined(_self._mapControl))
            _self._mapControl.dispose();

        let opt_ = {
            camera: defaultValue(opt.camera, _self._camera),
            domElement: defaultValue(opt.domElement, _self._renderer.domElement),
            // domelement: document.querySelector('#view1'),
            drawArg: _self._drawArg,
            pos: defaultValue(opt.pos, _self.getCameraGeographicPosition()),
            minHeight: defaultValue(opt.minHeight, 0)
        };
        if (!defined(opt.minHeight))
            opt.minHeight = 0;

        _self.flyToPosition(opt.pos, opt.dir);
        opt = Object.assign(opt, opt_);
        var characterControl = new UCharacterControls(opt);

        if (defined(_self._mapControl)) {
            _self._mapControl.enabled = false;
            characterControl._orimapControl = _self._mapControl;
            _self._curControl = characterControl;
            //_self._mapControl.dispose();
        }

        characterControl.target = opt.domElement;

        characterControl.lock();
        _self._scene.add(characterControl.getObject());
        return characterControl;
    }

    createPointerLockControls(camera, renderer, pos, dir, minHeight) {
        var _self = this;
        if (defined(_self._mapControl))
            _self._mapControl.dispose();

        if (!defined(minHeight))
            minHeight = 0;

        _self.flyToPosition(pos, dir);
        var opt = {
            camera: camera,
            domElement: renderer,
            // domelement: document.querySelector('#view1'),
            drawArg: _self._drawArg,
            pos: pos,
            minHeight: minHeight
        };
        var pointerLockControl = new UPointerLockControls(opt);

        if (defined(_self._mapControl)) {
            pointerLockControl._orimapControl = _self._mapControl;
            //_self._mapControl.dispose();
        }

        pointerLockControl.target = renderer;
        // var blocker = document.getElementById('blocker');
        // var instructions = document.getElementById('instructions');

        pointerLockControl.lock();
        _self._scene.add(pointerLockControl.getObject());
        return pointerLockControl;
    }

    createPointerLockDriveControls(camera, renderer, pos, dir, speed, minHeight, viewType, mirrorStat) {
        var _self = this;

        if (!defined(minHeight))
            minHeight = 0;

        if (!defined(pos)) {
            return;
        }
        var driveSpeed = speed;
        if (!defined(driveSpeed)) {
            driveSpeed = 100;
        }
        if (!defined(viewType)) {
            viewType = "FrontView"
        }
        if (!defined(mirrorStat)) {
            mirrorStat = {
                left: false,
                right: false,
                back: false
            }
        }


        var start = new THREE.Vector3(0, 0, 0);
        var end = new THREE.Vector3(0, 0, 0);
        if (!defined(dir)) {
            end.set(pos.x, pos.y, pos.z);
        } else {
            end.set(dir.x, dir.y, dir.z);
        }
        start.set(pos.x, pos.y, pos.z);
        try {

            _self.flyToPosition(start, end);
            var opt = {
                camera: camera,
                domElement: renderer,
                // domelement: document.querySelector('#view1'),
                drawArg: _self._drawArg,
                pos: pos,

                minHeight: minHeight,
                speed: driveSpeed,
                viewType: viewType,
                mirrorStat: mirrorStat,
                app: _self
            };

            var pointerLockDriveControl = new UPointerLockDriveControls(opt);
            if (defined(_self._mapControl)) {
                pointerLockDriveControl._orimapControl = _self._mapControl;
                //_self._mapControl.dispose();
            }
            pointerLockDriveControl.target = renderer;
            // var blocker = document.getElementById('blocker');
            // var instructions = document.getElementById('instructions');

            pointerLockDriveControl.lock();

            _self._scene.add(pointerLockDriveControl.getObject());
        } catch (e) {
            console.log('Drive Controller start error: ' + e);
        }
        return pointerLockDriveControl;
    }

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
    createPointerLockFlyControls(option = {}) {
        const self = this;

        option.camera = option.camera || self._camera;
        option.renderer = option.renderer || self._renderer;

        const opt = {
            camera: option.camera,
            app: self,
            domElement: option.renderer.domElement,
            component: option.component,
            maxSpeed: option.maxSpeed,
            minSpeed: option.minSpeed,
            accSpeed: option.accSpeed,
            rollSpeed: option.rollSpeed,
            flyShift: option.flyShift,
            flyRotation: option.flyRotation,
            pointerElement: option.pointerElement,
            horizonElement: option.horizonElement,
            speedElement: option.speedElement,
            heightElement: option.heightElement,
            limitHeight: option.limitHeight
        };

        let controls = new UPointLockFlyControls(opt);
        controls.lock();
        self._freeFlyControl = controls;
        return controls;
    }

    /**
     * 자유 비행 컨트롤러를 반환하는 함수
     * @returns {UPointLockFlyControls} 자유비행 컨트롤러
     */
    getFreeFlyControl() {
        const self = this;
        return self._freeFlyControl;
    }

    async createUOrbitAndPanControls(opt) {
        var _self = this;

        if (!defined(opt.minHeight))
            opt.minHeight = 0;

        if (!defined(opt.pos)) {
            return;
        }

        if (!defined(opt.mirrorStat)) {
            opt.mirrorStat = {
                left: false,
                right: false,
                back: false
            }
        }

        var start = new THREE.Vector3(0, 0, 0);
        var end = new THREE.Vector3(0, 0, 0);
        if (!defined(opt.dir)) {
            end.set(opt.pos.x, opt.pos.y, opt.pos.z);
        } else {
            end.set(opt.dir.x, opt.dir.y, opt.dir.z);
        }
        start.set(opt.pos.x, opt.pos.y, opt.pos.z);
        try {
            await _self.flyToPosition(start, end);
            let opt_ = {
                camera: defaultValue(opt.camera, _self._camera),
                domElement: defaultValue(opt.domElement, _self._renderer.domElement),
                drawArg: _self._drawArg,
                pos: defaultValue(opt.pos, _self.getCameraPosition()),
                minHeight: defaultValue(opt.minHeight, 0),
                speed: defaultValue(opt.speed, 100),
                mirrorStat: defaultValue(opt.mirrorStat, undefined),
                app: _self
            };
            opt = Object.assign(opt, opt_);
            var orbitAndPanControls = new UOrbitAndPanControls(opt);
            if (defined(_self._mapControl)) {
                orbitAndPanControls._orimapControl = _self._mapControl;
            }
            orbitAndPanControls.target = opt.domElement;

            //_self._scene.add(camera);
        } catch (e) {
            console.log('Drive Controller start error: ' + e);
        }
        return orbitAndPanControls;
    }

    /**
     * 입력 받은 날짜(date)에 따른 일몰(sunset) 시간을 반환하는 함수
     * @param {Date|object} date 날짜
     * @return {{start: Date, end: Date}|{start: Date, end: Date}|*|undefined}
     * @ignore
     */
    getTimeSunset(date) {
        const info = USunCalc.getTimes(date, g_lat, g_lon);
        if (defined(info))
            return UDEF.setDateFormat(info.sunset);

        return undefined;
    }

    /**
     * 입력 받은 날짜(date)에 따른 일출(sunrise) 시간을 반환하는 함수
     * @param {Date|object} date 날짜
     * @return {{start: Date, end: Date}|{start: Date, end: Date}|*|undefined}
     * @ignore
     */
    getTimeSunrise(date) {
        var info = USunCalc.getTimes(date, g_lat, g_lon);
        if (defined(info))
            return UDEF.setDateFormat(info.sunrise);

        return undefined;
    }

    /**
     * 기본 날짜로 일조량을 설정하는 함수
     * @example
     * 년도 : 2018, 월 : 10, 날짜 : 30, 시간 : 8
     * @ignore
     */
    setDefaultTimeSun() {
        var self = this;
        self._curtime = new Date();
        self._curtime.setFullYear(2023);
        self._curtime.setMonth(11);
        self._curtime.setDate(1);
        self._curtime.setHours(15, 30);
        self.setTimeSun(self._curtime);
    }

    /**
     * Quad tree set을 업데이트 하는 함수
     * @param {number} force 업데이트 정도 (force가 클수록 업데이트되는 타일 증가)
     * @ignore
     */
    updateQuadtree(force) {
        const self = this;

        if (defined(self._quadtreeSet))
            self._quadtreeSet.update(undefined, null, 'all', force);
    }

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
    analySunAmount(start, end, position, step, drawOpt = {}, dist) {
        const self = this;
        const analy = self.getAnalysis("SunAmount");
        if (dist === undefined) dist = 5000;
        if (defined(analy)) {
            analy.active();
            return analy.analySunAmount(start, end, position, step, drawOpt, dist);
        }
        return [];
    }

    /**
     * @description 안개를 설정하는 함수
     * @param {ColorLike} color 안개 색상
     * @param {number} [value=0.0000138] 안개 밀도
     * @param {boolean} isDynamic 카메라 고도에 따른 안개 밀도 동적 설정 여부
     */
    setFog(color = this._fogColor, value = UDEF.fogValue, isDynamic = true) {
        let self = this;
        if (self._defaultFog)
            self._defaultFog.set(color, value, isDynamic);
        else
            self._defaultFog = new UFog(color, value, isDynamic);
    }

    /**
     * @description 안개를 설정을 초기화 하는 함수
     */
    resetFog() {
        let self = this;
        if (self._defaultFog)
            self._defaultFog.set(self._fogColor, UDEF.fogValue)
        else
            self._defaultFog = new UFog(self._fogColor, UDEF.fogValue);
    }

    /**
     * @description 안개를 출력을 설정하는 함수
     * @param {boolean} isShow 출력여부
     */
    showFog(isShow) {
        this._useFog = isShow;
    }

    createFire(pos, params, url1, url2) {
        let self = this;
        var fire = new VolumetricFire(
            params.fireWidth,
            params.fireHeight,
            params.fireDepth,
            params.sliceSpacing,
            self._camera,
            url1,
            url2,
        );
        fire.mesh.position.copy(pos);
        fire.mesh.rotateX(Math.PI / 2);
        self._fires.push(fire);
        self._scene.add(fire.mesh);
        return fire;
    }

    removeFire(fire) {
        const self = this;
        if (!fire) return;
        const index = self._fires.indexOf(fire);
        if (index > -1) {
            self._fires.splice(index, 1);
            if (fire.mesh) {
                fire.mesh.visible = false;
                self.getScene().remove(fire.mesh);
                UDEF.disposeObject3D(fire.mesh);
            }
        }
    }

    createGrid(size, divisions) {
        var self = this;
        if (!defined(self._scene))
            return;

        if (!defined(size)) size = 1000;

        if (!defined(divisions)) divisions = 100;

        var gridHelper = new UGridHelper(size, divisions);
        self._scene.add(gridHelper);

    }

    /**
     * 입력받은 Frustum으로 UFrustumHelper를 생성합니다.
     *
     * @param {import('three').Frustum} frustum
     * @param {UFrustumHelperCO} [options]
     * @returns {UFrustumHelper | undefined}
     */
    setFrustumHelper(frustum, options = {}) {
        if (!defined(frustum)) return;

        return new UFrustumHelper(frustum, {
            ...options,
            drawArg: this._drawArg
        });
    }

    /**
     * 입력받은 Frustum으로 지면 접촉 전용 UFrustumTerrainProjectionHelper를 생성합니다.
     * 기존 UFrustumHelper의 주요 스타일 인터페이스와 호환하며, terrain:true일 때 OOR 성분을 표시하지 않습니다.
     *
     * @param {import('three').Frustum} frustum
     * @param {import('@union3d/helpers/UFrustumTerrainProjectionHelper').UFrustumTerrainProjectionHelperCO} [options]
     * @returns {import('@union3d/helpers/UFrustumTerrainProjectionHelper').UFrustumTerrainProjectionHelper | undefined}
     */
    setFrustumTerrainProjectionHelper(frustum, options = {}) {
        if (!defined(frustum)) return;

        // 외부에서 전달한 drawArg보다 현재 app의 렌더링 컨텍스트를 우선해야
        // helper world z와 같은 단위의 terrain render height를 조회할 수 있습니다.
        return new UFrustumTerrainProjectionHelper(frustum, {
            ...options,
            drawArg: this._drawArg
        });
    };

    createCollapse(camera, drawarg) {
        this._collapse = new UCollapse({camera: camera, drawarg: drawarg, simplepick: false});
    }

    getCollapse() {
        return this._collapse;
    }

    createDrawArg(
        opt,
        app,
        scene,
        sceneComment,
        camera,
        frustum,
        grRect,
        gr3dRect
    ) {
        this._drawArg = new UDrawArg(
            app,
            scene,
            sceneComment,
            camera,
            frustum,
            grRect,
            gr3dRect
        );

        return this._drawArg;
    }


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
    getTileUpdateSensitivity() {
        if (defined(this._quadtreeSet)) {
            return this._quadtreeSet.getUpdateSensitivity();
        }
        return this.#tileUpdateSensitivity;
    }

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
    setTileUpdateSensitivity(sensitivity) {
        // 쿼드트리 생성 전에도 동일한 입력 계약을 적용하고 오류 시 저장값을 보존합니다.
        if (typeof sensitivity !== 'number') {
            __GError__(this, `setTileUpdateSensitivity(): 타일 업데이트 민감도는 숫자여야 합니다. 입력 타입: ${sensitivity === null ? 'null' : typeof sensitivity}. 기존 설정을 유지합니다.`, '3182051');
            return this;
        }
        if (!Number.isFinite(sensitivity) || sensitivity <= 0) {
            __GError__(this, `setTileUpdateSensitivity(): 타일 업데이트 민감도는 0보다 큰 유한한 숫자여야 합니다. 입력값: ${sensitivity}. 기존 설정을 유지합니다.`, '3182052');
            return this;
        }

        const previous = this.getTileUpdateSensitivity();
        this._quadtreeSet?.setUpdateSensitivity(sensitivity);
        this.#tileUpdateSensitivity = sensitivity;
        if (previous !== sensitivity) {
            // 정지 상태에서도 보류된 카메라 변화를 새 민감도로 한 번 판별할 기회를 줍니다.
            this.setUpdateDate();
        }
        return this;
    }

    /**
     * Quad Tile Tree Set을 생성하는 함수
     * @param {import('@UGeoRect').UGeoRect} [rectangle] 실제 화면에 가시화할 3차원 영역 나타내는 Rectangle
     * @param {number} [minlevel=5] 타일 서버에서 받아 올 타일의 최소 레벨. (데이터 가시화 레벨)
     * @return {null|import('@U3dQuadSet').U3dQuadSet} 생성된 Quad Tile Tree Set
     * @ignore
     */
    createQuadTreeSet(rectangle = this._rectangle, minlevel = this._datalevel) {
        if (defined(this._quadtreeSet))
            return this._quadtreeSet;

        if (!defined(rectangle) || !defined(minlevel)) {
            __GError__(this, '타일을 생성할 영역이나 레벨을 인식 할 수 없습니다.', '7273841');
            return null
        }

        this._quadtreeSet = new U3dQuadSet(
            rectangle.ptLeftTop.x, //minX
            rectangle.ptRightBottom.x, //maxX
            rectangle.ptLeftTop.y, //minY
            rectangle.ptRightBottom.y, //maxY
            minlevel,
            null,
            this._drawArg,
            this._scene
        );
        this._quadtreeSet.setUpdateSensitivity(this.#tileUpdateSensitivity);

        this._appUpdate3d = false;

        return this._quadtreeSet;
    }

    /**
     * 지도 위에 타일 경계 이미지를 출력할지 설정하는 함수
     * @param {boolean} val 이미지 디버그 모드 활성화 여부 [true : 활성, false : 비활성]
     */
    setImageDebug(val) {
        UDEF.imageDebug = val;
    }

    /**
     * 이미지 디버그 모드 활성화 여부를 반환하는 함수
     * @returns {boolean} 이미지 디버그 모드 활성화 여부 [true : 활성, false : 비활성]
     */
    isImageDebug() {
        return UDEF.imageDebug;
    }

    writeImageDebug() {
        UDEF.imageDebug = true;
    }

    /**
     * app의 FPS(초당 프레임 수)를 출력하는 모드를 설정하는 함수
     * @param {boolean} val FPS(초당 프레임 수) 출력 모드 활성 여부 [true : 활성, false : 비활성]
     */
    setDebug(val) {
        UDEF.debug = val;
    }

    /**
     *  FPS(초당 프레임 수) 출력 모드 활성 여부를 반환하는 함수
     * @returns {boolean}  FPS(초당 프레임 수) 출력 모드 활성 여부 [true : 활성, false : 비활성]
     */
    isDebug() {
        return UDEF.debug;
    }

    updateFrustum() {
        const camera = this._camera;
        if (!defined(camera)) return;

        if (defined(this._frustum)) {
            this._frustum.update(camera);
            this._drawArg._frustum = this._frustum;
        }

        this._eventHandler.onchange();
    }

    getCollapsePosition(vec, scenes) {
        var self = this;
        var pos = undefined;
        if (!defined(vec))
            vec = self._drawArg.getFrustumNearCenter();

        if (defined(self._collapse))
            pos = self._collapse.getCollapsePosition(vec, scenes);

        return pos;
    }

    getWalkCollapsePosition(vec, scenes) {
        var self = this;
        /*
                if (!defined(vec))
                    vec = self._drawArg.getFrustumNearCenter();
                */
        var posList = [];

        var p1 = self._drawArg.getFrustumNearCenter();
        var p2 = new THREE.Vector3(p1.x + 10, p1.y, p1.z);
        var p3 = new THREE.Vector3(p1.x - 10, p1.y, p1.z);
        var p4 = new THREE.Vector3(p1.x, p1.y + 10, p1.z);
        var p5 = new THREE.Vector3(p1.x, p1.y - 10, p1.z);

        if (defined(self._collapse)) {
            let position = self._collapse.getCollapsePosition(p1, scenes);
            if (defined(position)) posList.push(position);

            position = self._collapse.getCollapsePosition(p2, scenes);
            if (defined(position)) posList.push(position);

            position = self._collapse.getCollapsePosition(p3, scenes);
            if (defined(position)) posList.push(position);

            position = self._collapse.getCollapsePosition(p4, scenes);
            if (defined(position)) posList.push(position);

            position = self._collapse.getCollapsePosition(p5, scenes);
            if (defined(position)) posList.push(position);
        }

        if (posList.length === 0)
            return undefined;

        var point = posList[0];
        if (point.z === 0) {
            for (var i = 1; i < posList.length; i++) {
                var p = posList[i];
                if (point.z < p.z)
                    point = p;
            }
        }

        return point;
    }

    isUpdateFrame() {
        return this._appUpdate3d;
    }

    createVideoLayer(opt) {
        var self = this;
        if (!defined(opt)) {
            console.info('opt is null! ');
            return false;
        }

        if (self._layerlist.getLayer(opt.name)) {
            //    console.log('layer is existed!! failure!');
            return false;
        }

        var layer = new U3dVideoLayer(opt);
        if (defined(layer)) {
            self.addLayer(layer);
        }

        return layer;
    }

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
    createModelTdsLayer(opt) {
        var self = this;
        if (!defined(opt)) {
            console.info('opt is null! ');
            return false;
        }

        if (self._layerlist.getLayer(opt.name)) {
            //    console.log('layer is existed!! failure!');
            return false;
        }
        var layer = new U3dModelTdsLayer(opt);
        if (defined(layer)) {
            self.addLayer(layer);
        }

        return layer;
    }

    update(list, event, force, change) {
        var self = this;
        //+ 이동/조망권 모드일 때, 마우스클릭으로 제한 업데이트한다.
        if (!self.isUpdateFrame()) {
            self._appUpdate3d = true;
            if (!force && self._saveForce) {
                force = self._saveForce;
                self._saveForce = false;
            }
            if (!change && self._saveChange) {
                change = self._saveChange;
                self._saveChange = false;
            }
            if (defined(self._quadtreeSet) && !self.isStopUpdate()) {
                self.setLastUpdateDate(self.getUpdateDate());
                self._quadtreeSet.update(list, 'all', force, event, change);
            }
        } else if (force) {
            self._saveForce = true;
            self.setUpdateDate();
        } else if (change) {
            self._saveChange = true;
            self.setUpdateDate();
        }
    }

    particleUpdate() {
        let self = this;
        if (defined(self._particles) && self._particles.length > 0) {
            let particleAnalysis = self.getAnalysis('Particle');
            particleAnalysis.update();
        }
    }

    /**
     * 강력 업데이트 실행 함수
     * @returns {Promise} 업데이트 수행 Promise
     */
    forceUpdate() {
        let self = this;
        let promise = deferred();
        self.once(self.constructor.EVENT.LOADED, function () {
            promise.resolve(self);
        });
        self.saveForceUpdate();
        self.setUpdateDate();
        return promise;
    }

    /**
     * 업데이트 실행 함수
     */
    changeUpdate() {
        this.saveChangeUpdate();
        this.setUpdateDate();
    }

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
    forceLoadModel(visible = true, minx = -213890.2, maxx = -212195.6, miny = 102175.8, maxy = 104582.4) {
        if (!minx || !maxx || !miny || !maxy) {
            U3dMessage.error(this._classtype, U3dMessage.CNT.CMM.NON_PARAM, '5378050');
        }
        let self = this;
        if (defined(self._quadtreeSet) && !self.isStopUpdate()) {
            let eventName = 'forceLoadModel';
            let addList = [];
            let tileList = [];
            return new Promise(function (resolve, reject) {
                try {
                    U3dMessage.info(self._classtype, U3dMessage.CNT.TILE.FORCE_MODEL_LOAD_START, '5378485');
                    self.setStopUpdate(true);
                    if (visible) {
                        let geometry = new THREE.BoxGeometry(maxx - minx, maxy - miny, 1);
                        let material = new THREE.MeshBasicMaterial({color: 0xdd0000, opacity: 0.5, transparent: true});
                        let cube = new THREE.Mesh(geometry, material);
                        cube.position.x = (maxx + minx) / 2;
                        cube.position.y = (maxy + miny) / 2;
                        cube.position.z = self.getRenderHeightAtPoint({x: cube.position.x, y: cube.position.y}) + 30; //확인됨
                        self._scene.add(cube);
                        addList.push(cube);
                    }

                    self._quadtreeSet.on(U3dEvent.TILE.FORCE_MODEL_LOADED, function (e) {
                        let tile = e.data.item;
                        if (!tile) return;
                        tileList.push(tile);
                        if (visible) {
                            let min = tile._boundingbox.min;
                            let max = tile._boundingbox.max;
                            let geometry = new THREE.BoxGeometry(max.x - min.x, max.y - min.y, 1);
                            let material = new THREE.MeshBasicMaterial({
                                color: 0x00ff00,
                                opacity: 0.5,
                                transparent: true
                            });
                            let cube = new THREE.Mesh(geometry, material);
                            cube.position.x = tile._center.x;
                            cube.position.y = tile._center.y;
                            cube.position.z = self.getRenderHeightAtPoint({
                                x: cube.position.x,
                                y: cube.position.y
                            }) + 50; //확인됨
                            self._scene.add(cube);
                            addList.push(cube);
                        }
                    }, false, eventName);

                    self.once(self.constructor.EVENT.LOADED, function () {
                        if (visible) {
                            self._quadtreeSet.off(U3dEvent.TILE.FORCE_MODEL_LOADED, eventName);
                            for (let cube of addList) {
                                self._scene.remove(cube);
                                cube.material.dispose();
                                cube.geometry.dispose();
                            }
                        }
                        resolve(tileList);
                        self.setStopUpdate(false);
                    });
                    let box3 = new THREE.Box3(new THREE.Vector3(minx, miny, 0), new THREE.Vector3(maxx, maxy, 1))
                    self._quadtreeSet.updateModel(box3);
                } catch (e) {
                    self._quadtreeSet.off(U3dEvent.TILE.FORCE_MODEL_LOADED, eventName);
                    if (addList.length > 0) {
                        for (let cube of addList) {
                            self._scene.remove(cube);
                            cube.material.dispose();
                            cube.geometry.dispose();
                        }
                    }
                    self.setStopUpdate(false);
                    reject();
                }
            }).then(function () {
                U3dMessage.info(self._classtype, U3dMessage.CNT.TILE.FORCE_MODEL_LOAD_END, '5381998');
            });
        }
    }

    /**
     * 실내, 객체 내부 또는 자세한 카메라 조작을 지원하는 1인칭 컨트롤 변경 함수
     * @param {boolean} set 1인칭 컨트롤 활성 여부 [ true : 활성 / false : 비활성 ]
     */
    setInteriorPanControl(set) {
        const self = this;
        if (!self._curControl?.setControlType) {
            __GInfo__(self, '현재 적용중인 컨트롤이 1인칭 모드를 지원하지 않습니다.', '9300177');
            return;
        }

        if (set)
            self._curControl.setControlType(CONTROL_TYPE.FIRST_PERSON);
        else
            self._curControl.setControlType(CONTROL_TYPE.FIX_ANCHOR);
    }

    /**
     * 카메라 컨트롤 동적타겟 사용 설정 함수
     */
    setDynamicPanControl(checkpick) {
        const self = this;
        if (!self._curControl?.setControlType) {
            __GInfo__(self, '현재 적용중인 컨트롤이 동적타겟 모드를 지원하지 않습니다.', '5291815');
            return;
        }

        if (checkpick)
            self._curControl.setControlType(CONTROL_TYPE.FIX_ANCHOR);
        else
            self._curControl.setControlType(CONTROL_TYPE.NON_ANCHOR);
    }

    /**
     * 다음 프래임에서 업데이트시 change 옵션 (타일 검색시 캐쉬된 타일을 사용하며 후처리 작업까지 진행 => tile.loaded 이벤트가 호출 )을 적용하는 함수
     * @ignore
     */
    saveChangeUpdate() {
        this._saveChange = true;
    }

    /**
     * 다음 프래임에서 업데이트시 force 옵션 (타일 검색시 캐쉬된 타일을 사용하지 않고 다시 로드)을 적용하는 함수
     * @ignore
     */
    saveForceUpdate() {
        this._saveForce = true;
    }

    /**
     * 지도화면 새로고침 함수
     * @ignore
     */
    setUpdateDate(event) {
        var self = this;
        if (!self.isInitialized()) {
            return;
        }

        U3dObject.prototype.setUpdateDate.call(self, undefined, event);
    }


    cancelrenderFrame(time) {
        var self = this;

        if (!defined(time))
            time = 0;

        setTimeout(function () { // cancel requestAnimationFrame after 2 seconds
            self._renderer.setAnimationLoop(null);
        }, time);
    }

    setSearchPosition(worldX, worldY) {
        if (defined(worldX) && defined(worldY)) {
            let vector = new THREE.Vector3(worldX, worldY, 0);
            this._drawArg.setSearchPosition(vector);
        }
    }

    getSearchPosition() {
        return this._drawArg.getSearchPosition();
    }

    clearSearchPosition() {
        this._drawArg.clearSearchPosition();
    }

    /**
     * U3dApp의 사용 자원을 출력하는 함수
     */
    printResource() {
        U3dMessage.info('U3dApp', `TEXTURES: ${UDEF.resourceManager.getTextureCount()}`);
        console.dir(UDEF.resourceManager.getTextures());
        U3dMessage.info('U3dApp', `GEOMETRIES: ${UDEF.resourceManager.getGeometryCount()}`);
        console.dir(UDEF.resourceManager.getGeometries());
    }

    /**
     * U3dApp의 사용 자원 중 필요없는 자원을 청소하는 함수
     */
    clearResource() {
        UDEF.resourceManager.clear();
    }

    /**
     * app에 새로운 뷰 (U3dView) 를 생성하고 추가하는 함수
     * @param {import('@U3dView').U3dViewCO} opt 뷰 생성 옵션
     * @returns {Promise<import('@U3dView').U3dView>} 성공 시 U3dView 실패시 에러 메세지
     */
    createView(opt) {
        const view = new U3dView(opt);
        return this.addView(view)
    }

    compileAsync(target) {
        let self = this;
        if (!defined(self._renderer)) return;
        return self._renderer.compileAsync(target, self._camera, self._scene.parent);
    }

    //function draw_(clear, type, camera, renderer, sceneRoot)
    draw(clear) {
        if (!this._renderer) return;
        if (!this._drawArg) return;

        const self = this;
        ////////////////////////////////////////////////////////////////////U3dViewLight
        //     if (self._viewLightList.length > 0) {
        //         let viewLightRenderer;
        //         for (let viewLight of self._viewLightList) {
        //             viewLight.update(self.getCanvas(), self.getRenderer());
        //             viewLightRenderer = viewLight.getRenderer();
        //             if (defined(viewLightRenderer)) {
        //                 viewLightRenderer.draw(clear, undefined, viewLight.getCamera(), false);
        //             }
        //         }
        //     }
        ////////////////////////////////////////////////////////////////////Wireframe
        let layers = self._drawArg.getInstanceModelLayers();
        for (let layer of layers) {
            if (defined(layer._setWireframe)) {
                layer.setWireframe(layer._setWireframe);
            }
        }
        ////////////////////////////////////////////////////////////////////스와이프
        if (self.getEnableSwipe() && self._renderer.getScissorTest()) {
            let rect = self._rectBaseWindow;
            self._renderer.setScissor(rect.left, rect.top, rect.width, rect.height);
            self._renderer.draw(clear, UDEF.DRAW_TYPE.BASE);

            rect = self._rectSwipeWindow;
            self._renderer.setScissor(rect.left, rect.top, rect.width, rect.height);
            self._renderer.draw(clear, UDEF.DRAW_TYPE.SWIPE);
        } else {
            self._renderer.draw(clear, UDEF.DRAW_TYPE.DEFAULT);
        }
        ////////////////////////////////////////////////////////////////////U3dView

        // 프레임 분할 작업
        const views = this.getRenderViewList?.(2, 4) ?? this._viewList;
        // const views = this._viewList;
        if (views.length > 0) {
            let alreadyRemove = false;
            for (let view of views) {
                const camera = view.getCamera();
                if (!defined(camera) || !view.visible) continue;

                // 이전에 draw한 view scene 제거 (가시선, 분석 메시는 뷰에 출력할 필요 X)
                self._renderer.removeRenderObjByName(UDEF.RENDER_TYPE.CUSTOM, UDEF.VIEW_NAME.SCENE, alreadyRemove);
                alreadyRemove = true;

                const usePostProcess = view.usePostProcess;
                self._renderer.drawRenderTarget(camera, view.snapshotRT, usePostProcess);
                view.drawViewImage();
            }
        }
    }

    /**
     * 현재 프레임에서 그릴 뷰 목록을 반환합니다.
     * 표시 중이고 카메라가 있는 뷰가 대상이며, 강제 스냅샷 뷰는 일반 뷰보다 먼저 포함합니다.
     * 일반 뷰의 순회 위치는 다음 호출에 이어집니다. 원본 목록과 뷰 객체는 변경하지 않습니다.
     *
     * @param {number} [maxPerTick=5] 일반 뷰의 처리 상한. 0이면 강제 스냅샷 뷰만 반환합니다.
     * @param {number} [maxScanPerTick=10] 일반 뷰의 순회 한도. 처리 상한보다 작은 값은 처리 상한까지 적용합니다.
     * @returns {Array<import('@U3dView').U3dView>} 강제 스냅샷 뷰와 이번 호출에서 선택한 일반 뷰의 새 배열
     */
    getRenderViewList(maxPerTick = 5, maxScanPerTick = 10) {
        const views = this._viewList;
        if (!defined(views) || views.length === 0) return [];

        const rr = this._viewRR;

        // 강제 스냅샷을 우선 반영한 이번 프레임의 뷰를 선택하고 다음 순회 위치를 갱신한다.
        return INTERNAL.selectRenderViews(views, rr, maxPerTick, maxScanPerTick);
    }

    drawModel(clear) {
        return this.draw(clear);
    }

    isStopUpdate() {
        return this._stopUpdate;
    }

    setStopUpdate(val) {
        this._stopUpdate = val;
    }

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
    alignNorth(duration) {
        const self = this;
        // 카메라를 직접 회전시키므로 진행 중인 2D/3D 모드 전환은 취소한다.
        self.#cancelViewAngleChange();
        return self._mapControl.lookAtNorth(duration);
    }

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
    fitExtentToBoundingBox(boundingBox, useFly, offsetZ, leftrotate = 0, downrotate = 0) {
        let self = this;
        self.stopFly();

        let promise = deferred();
        if (!boundingBox || !boundingBox.min || !boundingBox.max || isWrong(boundingBox.max) || isWrong(boundingBox.min)) {
            __GError__(self, "바운딩 박스의 정보가 올바르지 않습니다.", '9325283');
            promise.resolve();
            return promise;
        }

        try {
            const min = new THREE.Vector3(boundingBox.min.x, boundingBox.min.y, boundingBox.min.z);
            const max = new THREE.Vector3(boundingBox.max.x, boundingBox.max.y, boundingBox.max.z);
            const bbox = new THREE.Box3(min, max);

            const center = new THREE.Vector3();
            const size = new THREE.Vector3();
            bbox.getCenter(center);
            bbox.getSize(size);
            const sizeLimit = 10000000;
            if (size.x > sizeLimit || size.y > sizeLimit || isNaN(size.x) || isNaN(size.y)) {
                __GInfo__('U3dApp', "fitExtent Cannot be performed. size is too big.", '7850390');
                __GInfo__('U3dApp', "center: " + center.x + " / " + center.y, '7850498');
                __GInfo__('U3dApp', "size: " + size.x + " / " + size.y, '7850600');
                promise.reject(false);
                return promise;
            }
            const rect = self.getRectangle();
            if (!rect.contain(center.x, center.y)) {
                __GInfo__('U3dApp', 'The input coordinates are out of map range.', '7850889');
                promise.reject(false);
                return promise;
            }

            const maxDim = Math.max(size.x, size.y, size.z);
            let cameraZ = Math.abs(maxDim / 2 * Math.tan(45 * 2));

            if (defined(offsetZ)) {
                cameraZ = cameraZ + offsetZ;
            }

            if (self._mapControl) {
                if (self._mapControl.tween !== undefined) {
                    self._mapControl.tween.stop();
                    self._mapControl.tween = undefined;
                }

                const duration = useFly ? 2000 : 0;
                self.setCameraPosition(center.x, center.y, center.z, leftrotate, downrotate, cameraZ, duration).then(() => {
                    promise.resolve(true);
                }).catch(() => {
                    promise.reject(false);
                });
            } else {
                self._camera.lookAt(center)
                self.updateData();
                promise.resolve(true);
            }

        } catch (e) {
            __GError__(self, "fitExtent 작업중 오류가 발생 하였습니다.", '9327869');
            promise.reject(false);
        }

        return promise;
    }

    /**
     * 입력한 오브젝트 범위로 카메라를 조정하는 함수
     * @param {import('three').Object3D} object 이동할 오브젝트
     * @param {boolean} useFly 이동 시 애니메이션 사용 유무
     * @param {number} offsetZ 이동 시 카메라 타겟과의 거리
     * @param {number} leftrotate 이동 시 카메라 좌우 각도
     * @param {number} downrotate 이동 시 카메라 상하 각도
     */
    fitExtentToObject(object, useFly, offsetZ, leftrotate = 0, downrotate = 0) {
        const boundingBox = new THREE.Box3().setFromObject(object);

        this.fitExtentToBoundingBox(boundingBox, useFly, offsetZ, leftrotate, downrotate);
    }

    refresh() {
        this.restartQuadTree();
    }

    /**
     * 지도화면 이동 애니매이션 정지 함수
     */
    stopFly() {
        stopFly_.call(this);
        stopTween_.call(this);
    }

    /**
     * 휠 줌 감도를 설정합니다.<br>
     * 입력값 자체는 검증하지 않으므로 호출 전에 유한한 양수인지 확인해야 합니다.<br>
     * 0·NaN은 감도 계산 시 기본값으로 대체되며, 음수·Infinity는 그대로 계산에 사용될 수 있습니다.
     * 따라서 0을 입력 비활성화 용도로 사용하지 않습니다.
     *
     * @param {number} [factor=1] 감도 배율. 생략하면 기본값 1로 복원합니다.
     * @returns {boolean} 값을 저장하면 true, 지도 컨트롤러 또는 getFactor가 없으면 변경 없이 false. true는 입력값의 유효성을 보장하지 않습니다.
     */
    setZoomSpeed(factor = DEFAULT_CONTROL_FACTOR.ZOOM_SPEED) {
        const self = this;
        const control = self._mapControl;
        if (!control || !control.getFactor)
            return false;

        control.getFactor().zoomSpeed = factor;
        return true;
    }

    /**
     * 팬 이동 감도를 설정합니다.<br>
     * 입력값 자체는 검증하지 않으므로 호출 전에 유한한 양수인지 확인해야 합니다.<br>
     * 0·NaN은 감도 계산 시 기본값으로 대체되며, 음수·Infinity는 그대로 계산에 사용될 수 있습니다.
     * 따라서 0을 입력 비활성화 용도로 사용하지 않습니다.
     *
     * @param {number} [factor=1] 감도 배율. 생략하면 기본값 1로 복원합니다.
     * @returns {boolean} 값을 저장하면 true, 지도 컨트롤러 또는 getFactor가 없으면 변경 없이 false. true는 입력값의 유효성을 보장하지 않습니다.
     */
    setPanSpeed(factor = DEFAULT_CONTROL_FACTOR.MOVE_SPEED) {
        const self = this;
        const control = self._mapControl;
        if (!control || !control.getFactor)
            return false;

        control.getFactor().panSpeed = factor;
        return true;
    }

    /**
     * 공통 회전 감도를 설정합니다.<br>
     * 입력값 자체는 검증하지 않으므로 호출 전에 유한한 양수인지 확인해야 합니다.<br>
     * 0·NaN은 감도 계산 시 기본값으로 대체되며, 음수·Infinity는 그대로 계산에 사용될 수 있습니다.
     * 따라서 0을 입력 비활성화 용도로 사용하지 않습니다.
     *
     * @param {number} [factor=1] 감도 배율. 생략하면 기본값 1로 복원합니다.
     * @returns {boolean} 값을 저장하면 true, 지도 컨트롤러 또는 getFactor가 없으면 변경 없이 false. true는 입력값의 유효성을 보장하지 않습니다.
     */
    setRotateSpeed(factor = DEFAULT_CONTROL_FACTOR.ROTATE_SPEED) {
        const self = this;
        const control = self._mapControl;
        if (!control || !control.getFactor)
            return false;

        control.getFactor().rotateSpeed = factor;
        return true;
    }

    /**
     * 수평 입력 회전 감도를 공통 회전 감도에 곱할 배율로 설정합니다.
     * 마우스·터치·회전 관성에 적용하며 각도 지정 및 자동 회전에는 적용하지 않습니다.<br>
     * 음수·NaN·Infinity·숫자가 아닌 값은 예외를 던지지 않고 false를 반환하며 기존 값을 유지합니다.<br>
     * 인자를 생략하면 해당 축만 1로 복원하며 공통 회전 감도와 다른 축의 감도는 유지합니다.
     *
     * @param {number} [factor=1] 유한한 0 이상 배율. 0이면 수평 입력 회전을 막습니다.
     * @returns {boolean} 적용하면 true, 잘못된 값이거나 지도 컨트롤러가 없으면 변경 없이 false
     */
    setRotateHorizontalSpeed(factor = 1) {
        const control = this._mapControl;
        if (!Number.isFinite(factor) || factor < 0 || !control || !control.getFactor) return false;
        control.getFactor().rotateHorizontalSpeed = factor;
        return true;
    }

    /**
     * 수직 입력 회전 감도를 기존 상하 회전량에 곱할 배율로 설정합니다.
     * 마우스·터치·회전 관성에 적용하며 각도 지정 및 자동 회전에는 적용하지 않습니다.<br>
     * 음수·NaN·Infinity·숫자가 아닌 값은 예외를 던지지 않고 false를 반환하며 기존 값을 유지합니다.<br>
     * 인자를 생략하면 해당 축만 1로 복원하며 공통 회전 감도와 다른 축의 감도는 유지합니다.
     *
     * @param {number} [factor=1] 유한한 0 이상 배율. 0이면 수직 입력 회전을 막습니다.
     * @returns {boolean} 적용하면 true, 잘못된 값이거나 지도 컨트롤러가 없으면 변경 없이 false
     */
    setRotateVerticalSpeed(factor = 1) {
        const control = this._mapControl;
        if (!Number.isFinite(factor) || factor < 0 || !control || !control.getFactor) return false;
        control.getFactor().rotateVerticalSpeed = factor;
        return true;
    }

    getUseCollison() {
        var self = this;
        var control = self._mapControl;
        if (!defined(control) || !(control instanceof UMapControls))
            return false;

        return control.getUseCollision();
    }

    setUseCollision(value) {
        if (!this._mapControl?.setUseCollision) {
            return;
        }
        this._mapControl.setUseCollision(value);
    }

    setFreePolarAngle(value) {
        if (!this._mapControl?.setFreePolarAngle) {
            return;
        }
        this._mapControl.setFreePolarAngle(value);
    }

    /**
     * GeOnDT for JS 버전정보 반환 함수
     * @returns {string} GeOnDT for JS 버전정보
     */
    getVersion() {
        return UDEF.getVersion();
    }

    /**
     * 지도화면의 domElement(canvas) 반환 함수
     * @returns {undefined | HTMLCanvasElement} canvas Element
     */
    getDomElement() {
        var self = this;
        if (defined(self._renderer))
            return self._renderer.domElement;

        return undefined;
    }

    setBackgroundColor(rgbString) {
        try {
            this._backgroundColor = rgbString || 0xffffff;
            if (this._background) {
                this._background = new THREE.Color(this._backgroundColor);
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 카메라 타겟을 유지한 채 고도각(polar)과 방위각(azimuth)을 애니메이션으로 변경하는 내부 함수
     *
     * 타겟을 기준으로 제자리 회전만 수행하므로 화면 중심과 카메라-타겟 거리가 그대로 유지된다.
     * 두 각도를 동시에 돌리면 화면이 한 번에 두 방향으로 움직여 어색하므로
     * 고도각 전환을 먼저 끝낸 뒤에 방위각을 정렬한다.
     *
     * 전환 도중 다른 카메라 조작이 들어오면 이 전환은 취소되고 promise는 reject 된다.
     *
     * @param {Degree} polarDegree 목표 고도각 (0은 TopView)
     * @param {Degree|null} [azimuthDegree=null] 목표 방위각 (0은 정북). null이면 현재 방위각을 유지한다.
     * @param {function():void} [onArrived] 회전이 모두 끝난 직후 실행할 처리
     * @param {function():void} [onCanceled] 전환이 취소되었을 때 실행할 처리
     * @returns {DeferredObject<void>} 전환 완료 promise 객체
     *
     * @ignore
     */
    #changeViewAngle(polarDegree, azimuthDegree = null, onArrived, onCanceled) {
        const self = this;
        const control = self._mapControl;
        const promise = deferred();
        if (!defined(control) || !control.lookAtPolar) {
            promise.reject();
            return promise;
        }

        const changeId = self.#cancelViewAngleChange();
        self.#viewAngleCanceled = onCanceled;
        // 컨트롤러의 회전 tween은 중단될 때에도 완료와 동일하게 resolve 되고,
        // 그 콜백이 다음 전환의 stopFly() 안에서 동기 실행된다.
        // 취소된 전환이 다음 단계를 시작하거나 각도 제한을 덮어쓰지 않도록 식별자로 걸러낸다.
        const isCanceled = () => changeId !== self.#viewAngleChangeId;

        const fail = () => {
            if (!isCanceled()) {
                self._isTwenning = false;
                self.#viewAngleCanceled = undefined;
                onCanceled?.();
            }
            promise.reject();
        };

        const complete = () => {
            if (isCanceled()) {
                promise.reject();
                return;
            }
            self._isTwenning = false;
            self.#viewAngleCanceled = undefined;
            onArrived?.();
            self.changeUpdate();
            self.once(self.constructor.EVENT.LOADED, () => {
                promise.resolve();
            });
        };

        self._isTwenning = true;
        control.lookAtPolar(polarDegree, MODE_CHANGE_DURATION).then(() => {
            if (isCanceled()) {
                promise.reject();
                return;
            }
            if (!defined(azimuthDegree)) {
                complete();
                return;
            }
            control.lookAtAzimuth(azimuthDegree, MODE_CHANGE_DURATION).then(complete, fail);
        }, fail);

        return promise;
    }

    /**
     * 진행 중인 2D/3D 모드 전환을 취소 상태로 만드는 내부 함수
     *
     * 취소 처리를 즉시 실행하므로, 전환이 중단되어도 현재 모드의 각도 고정 상태는 유지된다.
     *
     * @returns {number} 새로 발급한 전환 식별자
     *
     * @ignore
     */
    #cancelViewAngleChange() {
        const onCanceled = this.#viewAngleCanceled;
        this.#viewAngleCanceled = undefined;
        this.#viewAngleChangeId++;
        onCanceled?.();

        return this.#viewAngleChangeId;
    }

    /**
     * 2D 지도 모드의 각도 고정(TopView·정북)을 컨트롤러에 적용하는 내부 함수
     *
     * @ignore
     */
    #lockViewAngleLimit() {
        const control = this._mapControl;
        if (!defined(control)) return;

        control.updatePolarAngle?.(MODE_2D_POLAR_RADIAN, MODE_2D_POLAR_RADIAN);
        this.#updateAzimuthLimit(MODE_2D_AZIMUTH_RADIAN, MODE_2D_AZIMUTH_RADIAN);
    }

    /**
     * 2D 모드 전환 애니메이션을 위해 각도 고정을 해제하는 내부 함수
     *
     * 이미 고정된 상태(min===max)를 그대로 두면 회전이 첫 프레임에서 잘리므로 상한을 기본값으로 되돌린다.
     * 하한은 완전한 TopView(0도)까지 내려갈 수 있도록 연다.
     *
     * @ignore
     */
    #unlockViewAngleLimit() {
        const control = this._mapControl;
        if (!defined(control) || !control.updatePolarAngle) return;

        const maxPolar = control.minPolarAngle === control.maxPolarAngle
            ? DEFAULT_CONTROL_FACTOR.MAX_POLAR_ANGLE
            : control.maxPolarAngle;

        control.updatePolarAngle(MODE_2D_POLAR_RADIAN, maxPolar);
        this.#updateAzimuthLimit(
            DEFAULT_CONTROL_FACTOR.MIN_AZIMUTH_ANGLE,
            DEFAULT_CONTROL_FACTOR.MAX_AZIMUTH_ANGLE
        );
    }

    /**
     * 컨트롤러의 방위각 회전 제한을 설정하는 내부 함수
     * @param {Radian|number} min 최소 방위각 (라디안)
     * @param {Radian|number} max 최대 방위각 (라디안)
     *
     * @ignore
     */
    #updateAzimuthLimit(min, max) {
        const control = this._mapControl;
        if (!defined(control)) return;

        control.minAzimuthAngle = min;
        control.maxAzimuthAngle = max;
    }

    /**
     * 2D 지도 모드 활성 여부를 반환하는 함수
     * @returns {boolean} 2D 지도 모드 활성 여부
     */
    is2DMode() {
        return this.#viewMode === VIEW_MODE.TWO_D;
    }

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
    set2DMode() {
        const self = this;
        if (self.#viewMode === VIEW_MODE.TWO_D) {
            return deferred().resolve();
        }
        if (!defined(self._mapControl)) {
            return deferred().reject();
        }

        self.#viewMode = VIEW_MODE.TWO_D;
        // 고정을 먼저 걸면(min===max) 회전 애니메이션이 첫 프레임에서 잘리므로
        // 전환 중에는 제한을 풀어두고 도착한 뒤에 TopView·정북으로 고정한다.
        self.#unlockViewAngleLimit();

        return self.#changeViewAngle(
            MODE_2D_POLAR_DEGREE,
            MODE_2D_AZIMUTH_DEGREE,
            () => self.#lockViewAngleLimit(),
            // 전환이 중단되어도 2D 모드가 풀리지 않도록 고정을 되돌린다.
            () => {
                if (self.#viewMode === VIEW_MODE.TWO_D) self.#lockViewAngleLimit();
            }
        );
    }

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
    set3DMode(target = null) {
        const self = this;
        const control = self._mapControl;
        const hasTarget = Boolean(target) && isVector3Like(target);

        // 목표 좌표 없이 호출한 경우, 이미 3D 지도 모드이면 화면을 움직이지 않는다.
        if (!hasTarget && self.#viewMode === VIEW_MODE.THREE_D) {
            return deferred().resolve();
        }

        self.#viewMode = VIEW_MODE.THREE_D;
        // 2D 모드에서 고정된 고도각·방위각 제한(min=max=0)을 먼저 풀어야 3D 각도로 회전할 수 있다.
        if (defined(control) && control.resetPolarAngle) {
            control.resetPolarAngle();
        }
        self.#updateAzimuthLimit(
            DEFAULT_CONTROL_FACTOR.MIN_AZIMUTH_ANGLE,
            DEFAULT_CONTROL_FACTOR.MAX_AZIMUTH_ANGLE
        );

        if (hasTarget) {
            // 목표 좌표가 있으면 실제 이동이 필요하므로, 방위각과 카메라-타겟 거리를 유지한 채 이동한다.
            const azimuth = defined(control)
                ? THREE.MathUtils.radToDeg(control.getAzimuthalAngle())
                : 0;
            const distance = self.getCameraPosition().distanceTo(self.getCameraTargetPosition());
            return self.setCameraPosition(
                target.x, target.y, target.z,
                azimuth, MODE_3D_POLAR_DEGREE, distance, MODE_CHANGE_DURATION
            );
        }

        return self.#changeViewAngle(MODE_3D_POLAR_DEGREE);
    }

    /**
     * U3dApp에 레이어를 추가하는 함수
     * @param {import('@union3d/3dLayer/U3dLayer').U3dLayer} layer 추가할 레이어 객체 (예: U3dImageXYZLayer, U3dHeightXYZLayer 등)
     * @returns {import('@union3d/3dLayer/U3dLayer').U3dLayer | undefined} 추가된 레이어 객체
     */
    addLayer(layer) {
        if (!layer || !this._layerlist.addLayer(layer)) {
            layer?.reject?.();
            return layer;
        }
        layer.setApp(this);
        if (layer instanceof U3dImageLayer ||
            layer instanceof U3dImageXYZLayer ||
            layer instanceof U3dOpenLayer) {
            const enable = this.getProperties(UDEF.APP_PROP.IMAGE.USE_OPACITY);
            const value = this.getProperties(UDEF.APP_PROP.IMAGE.OPACITY);
            if (enable === true) {
                if (defined(layer.ready)) {
                    layer.ready(function () {
                        layer.setOpacity(value);
                    });
                } else {
                    layer.setOpacity(value);
                }
            }
        } else if (layer instanceof U3dModelTilesLayer ||
            layer instanceof U3dModelBasicLayer ||
            layer instanceof U3dModelStaticLayer ||
            layer instanceof U3dModelWFSLayer ||
            layer instanceof U3dModelU3FLayer ||
            layer instanceof U3dModelI3FLayer
        ) {
            const enable = this.getProperties(UDEF.APP_PROP.MODEL.USE_OPACITY);
            const value = this.getProperties(UDEF.APP_PROP.MODEL.OPACITY);
            if (enable === true) {
                if (defined(layer.ready)) {
                    layer.ready(function () {
                        layer.setOpacity(value);
                    });
                } else {
                    layer.setOpacity(value);
                }
            }
        }

        return layer;
    }

    shareLayer(layer) {
        return this._layerlist.addLayer(layer);
    }

    /**
     * U3dApp에 뷰를 추가하는 함수
     * @param {import('@U3dView').U3dView} view U3dView 객체
     * @returns {Promise<import('@U3dView').U3dView>} 추가가 끝난 시점의 Promise. 뷰가 아니거나 이미 추가된 뷰면 reject 됩니다
     *
     * @example
     * app.addView(view).then((added) => console.log(added));
     */
    addView(view) {
        let promise = deferred();
        if (!defined(view) || !view.isView) {
            promise.reject('input param is not view');
            return promise;
        }

        if (this._viewList.includes(view)) {
            promise.reject('this view is already add');
            return promise;
        }

        try {
            this._viewList.push(view);

            const wrapper = getViewWrapper.call(this);
            const dom = getDomElementFromMaybeWrapped(view.getElement());
            if (!defined(dom)) {
                promise.reject('view element is undefined');
                return promise;
            }

            // element가 이미 DOM에 붙어있다면(예: GridStack 위젯 내부) wrapper로 이동시키면 레이아웃에서 빠져, 보이지 않을 수 있음
            if (!dom.isConnected) {
                wrapper.appendChild(dom);
            }
            dom.style.display = 'block';

            if (!defined(this._overlayManager))
                this._overlayManager = new U3dOverlayManager(this);

            view.setApp(this);
            promise.resolve(view);
        } catch (e) {
            promise.reject(e);
        }
        return promise
    }

    /**
     * 카메라뷰 ID로 해당 뷰를 반환하는 함수
     * @param {string} id U3dView의 ID
     * @returns {import('@U3dView').U3dView} U3dView 객체
     */
    getViewById(id) {
        return this._viewList.find(function (item) {
            return (item.id === id);
        });
    }

    /**
     * 카메라 뷰(화면)를 삭제하는 함수
     * @param {import('@U3dView').U3dView} view 카메라뷰
     */
    removeView(view) {
        let findIdx = -1
        for (let i = 0; i < this._viewList.length; i++) {
            const item = this._viewList[i];
            if (item.id === view.id) {
                findIdx = i;
                break;
            }
        }
        // _viewList에서 제거
        if (findIdx > -1) this._viewList.splice(findIdx, 1);

        // 실제 뷰 객체 제거
        view.remove?.();
    }

    /**
     * 이름이 같은 카메라 뷰를 찾아 반환합니다.
     *
     * @param {string} viewName 찾을 카메라 뷰 이름
     * @returns {import('@U3dView').U3dView | undefined} 찾은 카메라 뷰
     *
     * @example
     * const view = app.findViewByName('mainView');
     */
    findViewByName(viewName) {
        return this._viewList.find(function (item) {
            return item.name === viewName;
        });
    }

    /**
     * 화면에 추가된 카메라뷰를 모두 제거하는 함수
     */
    removeAllView() {
        for (let i = 0; i < this._viewList.length; i++) {
            const view = this._viewList[i];
            view.remove();
        }
        this._viewList.length = 0;
    }

    /**
     * @deprecated
     * U3dApp에 광원뷰를 추가하는 함수
     * @param {import('@U3dViewLight').U3dViewLight} viewlight U3dViewLight 광원뷰
     * @ignore
     */
    addViewLight(viewlight) {
        this._viewLightList.push(viewlight);
        const wrapper = getViewLightWrapper.call(this);
        const ele = getDomElementFromMaybeWrapped(viewlight.getElement());
        if (!defined(ele)) return;

        wrapper.appendChild(ele);
        ele.style.display = "";
        viewlight.setApp(this);
    }

    /**
     * @deprecated
     * 광원뷰의 ID로 해당 광원뷰를 반환하는 함수
     * @param {string} id U3dViewLight의 ID
     * @returns {import('@U3dViewLight').U3dViewLight} U3dViewLight 객체
     * @ignore
     */
    getViewLightById(id) {
        var find = this._viewLightList.find(function (item) {
            return (item.id === id);
        });
        return find;
    }

    /**
     * @deprecated
     * 광원뷰를 삭제하는 함수
     * @param {import('@U3dViewLight').U3dViewLight} viewLight U3dViewLight 객체
     * @ignore
     */
    removeViewLight(viewLight) {
        var find = this._viewLightList.find(function (item) {
            return item.id === viewLight.id;
        });
        if (!defined(find)) {
            return;
        }

        var findIdx = this._viewLightList.indexOf(find);
        if (findIdx > -1) {
            this._viewLightList.splice(findIdx, 1);
        }
        find.remove();
        find = undefined;
        viewLight = undefined;
    }

    /**
     * @deprecated
     * 화면에 추가된 광원뷰를 모두 제거하는 함수
     * @ignore
     */
    removeAllViewLight() {
        for (var i = 0; i < this._viewLightList.length; i++) {
            var view = this._viewLightList[i];
            view.remove();
        }
        this._viewLightList = [];
    }

    /**
     * 앱에 등록된 오버레이를 반환합니다.
     *
     * @returns {Array<import('@U3dOverlay').U3dOverlay>} 오버레이 목록
     *
     * @example
     * const overlays = app.getOverlayList();
     */
    getOverlayList() {
        return this._overlayList;
    }

    /**
     * 앱에 등록된 카메라 뷰를 반환합니다.
     *
     * @returns {Array<import('@U3dView').U3dView>} 카메라 뷰 목록
     *
     * @example
     * const views = app.getViewList();
     */
    getViewList() {
        return this._viewList;
    }

    /**
     * 앱에 등록된 광원을 반환합니다.
     *
     * @returns {Array<import('@USpotLight').USpotLight>} 광원 목록
     *
     * @example
     * const lights = app.getLightList();
     */
    getLightList() {
        return this._lightList;
    }

    /**
     * 광원을 추가합니다.
     * @param {import('@USpotLight').USpotLight} light USpotLight (광원)
     */
    addLight(light) {
        this._lightList.push(light);
        light.setApp(this);
    }

    /**
     * 광원을 삭제하는 함수
     * @param {import('@USpotLight').USpotLight} light 광원
     */
    removeLight(light) {
        const find = this._lightList.find(function (item) {
            return item.id === light.id;
        });

        if (!defined(find)) {
            return;
        }

        if (defined(find.view)) {
            this.removeView(find.view)
            find.view = undefined;
        }

        const findIdx = this._lightList.indexOf(find);
        if (findIdx > -1) {
            this._lightList.splice(findIdx, 1);
        }
        find.remove();
    }

    /**
     * 이름이 같은 광원을 찾아 반환합니다.
     *
     * @param {string} lightName 찾을 광원 이름
     * @returns {import('@USpotLight').USpotLight | undefined} 찾은 광원
     *
     * @example
     * const light = app.findLightByName('mainLight');
     */
    findLightByName(lightName) {
        const find = this._lightList.find(function (item) {
            return item.name === lightName;
        });

        return find;
    }

    /**
     * 화면에 추가된 광원을 모두 제거하는 함수
     */
    removeAllLight() {
        for (let i = 0; i < this._lightList.length; i++) {
            let light = this._lightList[i];
            light.dispose();
        }
        this._lightList = [];
    }

    //////////////////////////////////////////////////////

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
    createOverlay(html, option) {
        if (!defined(html) || !defined(option.position)) return;

        const overlay = new U3dOverlay({
            name: 'overlay',
            id: option.uuid,
            element: html,
            position: option.position,
            useanchor: option.useanchor,
            anchor: option.anchor,
            balloon: option.balloon
        });

        this.addOverlay(overlay);
        return overlay;
    }

    /**
     * U3dApp에 오버레이를 추가하는 함수
     * @param {import('@U3dOverlay').U3dOverlay} overlay U3dOverlay 객체
     */
    addOverlay(overlay) {
        if (!defined(this._overlayManager))
            this._overlayManager = new U3dOverlayManager(this);

        this._overlayList.push(overlay);
        const wrapper = getOverlayWrapper.call(this);
        const ele = getDomElementFromMaybeWrapped(overlay.getElement());
        if (!defined(ele)) return;

        wrapper.appendChild(ele);
        ele.style.display = "";
        overlay.setApp(this);
    }

    /**
     * 오버레이의 ID로 해당 오버레이를 반환하는 함수
     * @param {string} id U3dOverlay의 ID
     * @returns {import('@U3dOverlay').U3dOverlay} U3dOverlay 객체
     */
    getOverlayById(id) {
        return this._overlayList.find(function (item) {
            return (item.id === id);
        });
    }

    /**
     * 오버레이를 삭제하는 함수
     * @param {import('@U3dOverlay').U3dOverlay} overlay U3dOverlay 객체
     */
    removeOverlay(overlay) {
        const idx = this._overlayList.findIndex(item => item.id === overlay.id);
        if (idx === -1) return;

        const [removed] = this._overlayList.splice(idx, 1);
        removed.remove();
    }

    /**
     * 화면에 추가된 오버레이를 모두 제거하는 함수
     */
    removeAllOverlay() {
        for (const overlay of this._overlayList) {
            overlay.remove?.();
        }
        this._overlayList.length = 0;
    }

    /**
     * 설정된 홈 위치로 이동하는 함수
     * @param {number} [duration] 홈 위치로 이동 시 애니메이션 시간(ms)
     */
    goToHome(duration) {
        var self = this;
        if (!defined(self._homePosition)) {
            return console.error('homePosition is required.');
        }
        if (!defined(duration))
            duration = 1;
        self.setCameraGeographicPosition(
            self._homePosition.x,
            self._homePosition.y,
            self._homePosition.z,
            self._homeRotateLeft,
            self._homeRotateDown,
            undefined,
            duration ? duration : 3000
        )
    }

    /**
     * 등록된 canvas에 click 동작을 실행하는 함수
     * @param {import('@U3dMouseEvent').U3dMouseEvent} u3dMouseEvent 마우스 이벤트 정보 객체
     */
    click(u3dMouseEvent) {
        if (!u3dMouseEvent) return;
        this._eventHandler.click(u3dMouseEvent);
    }

    /**
     * 등록된 canvas에 double click 동작을 실행하는 함수
     * @param {import('@U3dMouseEvent').U3dMouseEvent} u3dMouseEvent 마우스 이벤트 정보 객체
     */
    dbclick(u3dMouseEvent) {
        if (!u3dMouseEvent) return;
        this._eventHandler.dbclick(u3dMouseEvent);
    }

    /**
     * map control 이동 완료 시에 이벤트 등록 함수
     * @param {Function} listener 이동 완료 후 이벤트 등록 함수
     * @param {boolean} once 한번만 실행 여부
     * @param {string} name 이벤트 등록시 설정할 이름
     */
    onFlyEnd(listener, once, name) {
        const self = this;
        const mapControl = self._mapControl;
        if (!mapControl)
            __GError__(self, 'Map Control이 존재 하지 않아 이벤트 등록이 불가능합니다.', "7334238");

        const eventName = 'flyend';

        mapControl.addEventListener(eventName, listener, once, name);
    }

    /**
     * map control 이동 완료 시에 이벤트 제거 함수
     * @param  {Function} listener 이동 완료 후 등록된 이벤트 제거 함수
     */
    offFlyEnd(listener) {
        const self = this;
        const mapControl = self._mapControl;
        if (!mapControl)
            __GError__(self, 'Map Control이 존재 하지 않아 이벤트 제거가 불가능합니다.', "7334661");

        const eventName = 'flyend';
        self._mapControl.removeEventListener(eventName, listener);

    }

    //Raycast 관련 함수 Start/////////////////////////////////////////////////////////////////////////////////
    //입력받은 위치 X,Y에서 지표면에 수직으로만 Intersect 하는 함수들.
    /**
     * 월드 좌표(EPSG:3857)를 입력받아 해당 좌표의 구글 스케일이 적용된 z 값을 반환하는 함수
     * @param {WorldPosition} world 월드 좌표
     * @param {boolean} [useRaycaster=false] Raycaster를 사용하여 높이를 정밀하게 측정할건지의 여부, 사용시 API 성능이 떨어질 수 있습니다.
     * @param {Partial<{ useCache: boolean }>} [options={}] 근접 좌표 height cache 사용 옵션.
     * @returns {number} z 값(구글 스케일이 적용, m가 아님)
     */
    getRenderHeightAtPoint(world, useRaycaster = false, options = {}) {
        if (!useRaycaster)
            return this._drawArg.getRenderHeightAtPoint(world.x, world.y, options);

        const intersects = this.intersectAtVector3_(/** @type {WorldPositionVector3} */(world), true, true);

        for (const intersect of intersects) {
            if (/** @type {import('@UMesh').UMesh} */(intersect.object)?.getUType?.() === UDEF.UMESH_TYPE._tile && intersect.distance !== 0) {
                return intersect.point.z;
            }
        }

        return UDEF.TERRAIN_NO_DATA;
    }

    /**
     * 월드 좌표(EPSG:3857)를 입력받아 해당 좌표의 높이(m)를 반환하는 함수
     * @param {WorldPosition} world 월드 좌표
     * @param {boolean} [useRaycaster=false] Raycaster를 사용하여 높이를 정밀하게 측정할건지의 여부, 사용시 API 성능이 떨어질 수 있습니다.
     * @param {Partial<{ useCache: boolean }>} [options={}] 근접 좌표 height cache 사용 옵션.
     * @returns {number} height 높이(m)
     */
    getHeightAtPoint(world, useRaycaster = false, options = {}) {
        const renderHeight = this.getRenderHeightAtPoint(world, useRaycaster, options);

        if (!defined(renderHeight) || renderHeight === UDEF.TERRAIN_NO_DATA || renderHeight === UDEF.INVALID)
            return UDEF.TERRAIN_NO_DATA;

        const meterScale = UMathEngine.getRealScaleAtGoogle(world.y);

        return renderHeight * meterScale;
    }

    /**
     * 입력받은 위경도 좌표의 높이(고도m)값을 리턴해주는 함수
     * @param {GeoPosition} geo 위경도 좌표
     * @param {boolean} [useRaycaster=false] Raycaster를 사용하여 높이를 정밀하게 측정할건지의 여부, 사용시 API 성능이 떨어질 수 있습니다.
     * @returns {number} 고도값
     */
    getHeightAtGeographicPoint(geo, useRaycaster = false) {
        const world = this.getGeographicToWorld(geo.x, geo.y);
        return this.getHeightAtPoint(world, useRaycaster)
    }

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
    intersectInFrustum(e, onlyTerrain = true, recursive) {
        const camera = /** @type {import('@UCamera').UCamera} */(this._camera);
        const mouse = /** @type {import('@U3dMouseEvent').U3dMouseEvent} */(e);
        camera.updateProjectionMatrix();

        const scenes = onlyTerrain ?
            this.getInstanceScenesFromTerrainLayers() : this.getInstanceScenesFromModelAndTerrainLayers();

        const targetList = [];
        for (const scene of scenes) {
            for (const group of scene.children) {
                for (const child of group.children) {
                    if (this._frustum.intersectsObject(child)) {
                        targetList.push(child);
                    }
                }
            }
        }

        return RAYCASTER
            .setFromCamera(/** @type {import('three').Vector2} */(/** @type {unknown} */({
                x: mouse.normalizedX,
                y: mouse.normalizedY
            })), camera)
            .intersectObjects(targetList, /** @type {boolean} */(recursive));
    }

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
    intersect_(position, direction, onlyTerrain, recursive) {
        const scenes = onlyTerrain ?
            this.getInstanceScenesFromTerrainLayers() : this.getInstanceScenesFromModelAndTerrainLayers();

        return RAYCASTER.set(position, direction).intersectObjects(scenes, /** @type {boolean} */(recursive));
    }

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
    intersectFromScene(e, scenes, recursive, params) {
        RAYCASTER.setParams(params);

        const vec3 = /** @type {import('three').Vector3} */(e);
        const mouse = /** @type {import('@U3dMouseEvent').U3dMouseEvent} */(e);

        if (vec3.isVector3) {
            intersectOriginVec.set(vec3.x, vec3.y, vec3.z + 10000);
            RAYCASTER.set(intersectOriginVec, VECTOR_TO_GROUND);
        } else {
            RAYCASTER.setFromCamera(/** @type {import('three').Vector2} */(/** @type {unknown} */({
                x: mouse.normalizedX,
                y: mouse.normalizedY
            })), /** @type {import('@UCamera').UCamera} */(this._camera))
        }

        return RAYCASTER.intersectObjects(scenes, /** @type {boolean} */(recursive));
    }

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
    intersectAtPixel(e, onlyTerrain, recursive, appendScenes, params) {
        const scenes = onlyTerrain ?
            this.getInstanceScenesFromTerrainLayers() : this.getInstanceScenesFromModelAndTerrainLayers();

        if (defined(appendScenes)) {
            Array.isArray(appendScenes) ? scenes.push(...appendScenes) : scenes.push(/** @type {import('@UScene').UScene} */(appendScenes));
        }

        return this.intersectFromScene(e, scenes, recursive, params);
    }

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
    intersectAtVector3_(vec3, onlyTerrain, recursive, appendScenes, params) {
        const scenes = onlyTerrain ?
            this.getInstanceScenesFromTerrainLayers() : this.getInstanceScenesFromModelAndTerrainLayers();

        if (defined(appendScenes)) {
            Array.isArray(appendScenes) ? scenes.push(...appendScenes) : scenes.push(/** @type {import('@UScene').UScene} */(appendScenes));
        }

        return this.intersectFromScene(vec3, scenes, recursive, params);
    }

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
    intersectModelAtWorldPoint(world, gapPixel = 5, closedobject = false, scenes) {
        const self = this;

        const list = [];
        for (let y = world.y - gapPixel; y <= world.y + gapPixel; y++) {
            for (let x = world.x - gapPixel; x <= world.x + gapPixel; x++) {
                list.push(new THREE.Vector3(x, y, world.z));
            }
        }

        if (!scenes) scenes = this.getInstanceScenesFromModelAndTerrainLayers();
        if (!(scenes instanceof Array)) scenes = [scenes];


        const result = [];
        for (let i = 0; i < list.length; i++) {
            let intersects = self.intersectFromScene(list[i], scenes, true);

            if (!intersects) continue;
            if (!(intersects instanceof Array)) intersects = [intersects];

            for (const intersect of intersects) {
                const compare = result.find(function (obj) {
                    return intersect.object && obj.object === intersect.object;
                });
                if (!defined(compare))
                    result.push(intersect);
            }
        }

        if (closedobject)
            return getFristPoint(result);

        return result;
    }

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
    intersectModelAtGeographicPoint(geo, gapPixel, closedobject = false, scenes) {
        const world = this._drawArg.getGeographicToWorld(geo.x, geo.y, 0);
        return this.intersectModelAtWorldPoint(world, gapPixel, closedobject, scenes);
    }

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
    closestPointAtPixel(e, onlyTerrain, recursive, scenes) {
        return getFristPoint(this.intersectAtPixel(e, onlyTerrain, recursive, scenes));
    }

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
    closestPointAtVector3_(vec3, onlyTerrain, recursive, scenes) {
        return getFristPoint(this.intersectAtVector3_(vec3, onlyTerrain, recursive, scenes));
    }

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
    closestPointAtGeographic(position, onlyTerrain, recursive) {
        return this.closestPointAtVector3_(this.geographicToVector3(position), onlyTerrain, recursive);
    }


    /**
     * 마우스 좌표를 위경도 좌표로 반환하는 함수
     * @param {import('@U3dMouseEvent').U3dMouseEvent} event 마우스 이벤트 결과값 객체
     * @returns {GeoPosition} 위경도 좌표
     */
    getMouseToGeographic(event) {
        return this.pixelToGeographic(event, true, true);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    //2D,3D,지리좌표 변환 API Start//////////////////////////////////////////////////////////////////////////
    /**
     * 픽셀좌표(화면좌표)를 3D좌표로 변환하는 함수. <br>
     * 교차 검색(intersect)를 통해 픽셀좌표(화면좌표)를 3D좌표로 변환한다.
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e GeOnDT 마우스 이벤트 객체
     * @param {boolean} onlyTerrain 교차 검색 지형만 대상으로 할 것인지 여부. false면 씬에 추가된 모델까지 포함한다.
     * @param {boolean} recursive 교차 검색 시 자식 Object까지 포함할지 여부
     * @returns {WorldPosition} 3D좌표
     */
    pixelToVector3(e, onlyTerrain, recursive) {
        return this.closestPointAtPixel(e, onlyTerrain, recursive);
    }

    /**
     * 픽셀좌표(화면좌표)를 위경도좌표로 변환하는 함수.<br>
     * 교차 검색(intersect)를 통해 픽셀좌표(화면좌표)를 위경도좌표로 변환한다.
     * @param {import('@U3dMouseEvent').U3dMouseEvent | MouseEvent} e GeOnDT 마우스 이벤트 객체
     * @param {boolean} onlyTerrain 교차 검색 지형만 대상으로 할 것인지 여부. false면 씬에 추가된 모델까지 포함한다.
     * @param {boolean} recursive 교차 검색 시 자식 Object까지 포함할지 여부
     * @returns {GeoPosition} 위경도좌표
     */
    pixelToGeographic(e, onlyTerrain, recursive) {
        const vec3 = this.pixelToVector3(e, onlyTerrain, recursive);
        if (vec3)
            return this.vector3ToGeoGraphic(vec3);
    }

    /**
     * 3D 월드 좌표를 픽셀 좌표(화면 좌표)로 변환하는 함수입니다.
     * @param {WorldPositionVector3} vec3 3D 월드 좌표 (EPSG:3857)
     * @returns {import('three').Vector2Like} 픽셀 좌표 (화면 좌표) {x: number, y: number}
     */
    vector3ToPixel(vec3) {
        const width = this._renderer.getContext().canvas.width;
        const height = this._renderer.getContext().canvas.height;
        this._camera.updateMatrixWorld();
        projectionVec.copy(vec3).project(this._camera);

        const x = (projectionVec.x + 1) / 2 * width;
        const y = (projectionVec.y - 1) / 2 * height * (projectionVec.z > 1 ? -1 : 1)// 말풍선이 카메라보다 뒤에 있을 경우;

        return {x: x, y: y};
    }

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
    vector3ToGeoGraphic(vec3) {
        if (!vec3) return new THREE.Vector3();

        return this._drawArg.getWorldToGeographic(vec3.x, vec3.y, vec3.z);
    }

    /**
     * WGS84 위경도 좌표계(EPSG:4326)를 웹 메르카토르(Web Mercator) 월드 좌표(EPSG:3857)로 변환합니다.<br>
     * 입력 x는 경도(도), y는 위도(도), z는 지면으로부터의 실제 높이(미터)입니다.<br>
     * z를 생략하거나 0을 넣으면 높이 0으로 처리합니다.<br>
     * 반환 객체의 x·y는 미터 단위 월드 좌표(EPSG:3857)이고, z는 입력 높이를 위도별 축척으로 나눠 환산한 월드 좌표(EPSG:3857)의 z 값이므로 입력한 미터 값과 같지 않습니다.
     *
     * @param {GeoPosition} position 변환할 WGS84 위경도 좌표계(EPSG:4326) 위치이며, 값을 넘기지 않으면 오류가 발생하므로 반드시 전달하십시오.
     * @returns {WorldPositionVector3} 변환한 웹 메르카토르(Web Mercator) 월드 좌표(EPSG:3857) 위치이며, 3D 장면에 객체를 배치하거나 거리를 계산할 때 사용합니다.
     */
    geographicToVector3(position) {
        const z = position.z || 0;
        return this._drawArg.getGeographicToWorld(position.x, position.y, z);
    }

    /**
     * 위경도 좌표를 픽셀 좌표(화면 좌표)로 변환하는 함수
     * @param {GeoPosition} position 위경도 좌표
     * @returns {{x: number, y: number}} 픽셀 좌표 (x, y)
     */
    geographicToPixel(position) {
        var result = this.geographicToVector3(position);
        return this.vector3ToPixel(result);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * 카메라 줌, 패닝, 회전속도(factor)를 지면과의 거리에 따라 자동으로 변경하는 기능 사용여부 설정 함수
     * @param {boolean} [use=true] 기능 사용여부
     */
    setAutoSpeed(use) {
        if (!defined(use))
            use = true;
        this._useAutoSpeed = use;
    }

    /**
     * U3dApp 데이터 변경 시간을 갱신합니다.
     *
     * @example
     * app.updateData();
     */
    updateData() {
        this.setUpdateDate();
    }

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
    syncCamera(app, reactiveOffset) {
        if (!defined(app)) {
            console.info('app parameter is null!!');
            return;
        }

        function setControlCam(app, reactiveOffset) {
            let self = this;
            var selfCam = self._camera;
            var selfControl = self._mapControl;

            var targetCam = app._camera;
            var targetControl = app._mapControl;

            if (!defined(selfControl)) {
                console.warn('U3dApp.syncCamera change event\n' +
                    self._name + ' MapControl is undefined. please remove Event Listener app.unkey("change","' + id + '")');
                return;
            }

            if (!defined(targetControl)) {
                console.warn('U3dApp.syncCamera change event\n' +
                    app._name + ' MapControl is undefined. please remove Event Listener app.unkey("change","' + id + '")');
                return;
            }

            let position = selfCam.position.clone();
            if (defined(reactiveOffset) && reactiveOffset > 0) {
                let distance = position.distanceTo(selfControl.target);
                position.sub(selfControl.target);
                position.setLength(distance * reactiveOffset);
                position.add(selfControl.target);
            }

            targetCam.position.copy(position);
            targetControl.target.copy(selfControl.target);

            var polar = selfControl.getPolarAngle;
            var azimuth = selfControl.getAzimuthalAngle;
            targetControl.setPolarAngle(polar);
            targetControl.setAzimuthalAngle(azimuth);
            targetControl.update(false, false);

            var endEvent = {type: 'end', event: undefined};
            targetControl.dispatchEvent(endEvent);

            app.setUpdateDate();
        }

        var self = this;
        setControlCam.call(self, app, reactiveOffset);

        var id = this.on('change', function (e) {
            setControlCam.call(self, app, reactiveOffset);
        });

        self.once(self.constructor.EVENT.LOADED, function () {
            setControlCam.call(self, app, reactiveOffset);
        });
        return id;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * 건물 지우기 등록 함수
     * 입력받은 데이터에 제거할 건물을 등록한다.
     * @param {Array<KeyValue> | KeyValue} data 건물 지우기 데이터 배열 또는 오브젝트 (Object 구성 {layer : 레이어이름, uid : 유니크아이디})
     */
    registerRemoveModel(data) {
        if (data instanceof Array) {
            for (var i = 0; i < data.length; i++) {
                this.registerRemoveModel(data[i]);
            }
        } else if (data instanceof Object) {
            registerRemoveModelByObject.call(this, data);
        }
    }

    /**
     * 건물 지우기 등록 함수
     * 입력받은 데이터에 제거할 건물을 등록삭제한다.
     * @param {Array<KeyValue> | KeyValue} data 건물 지우기 데이터 배열 또는 오브젝트 (Object 구성 {layer : 레이어이름, uid : 유니크아이디})
     */

    deleteRemoveModel(data) {
        if (data instanceof Array) {
            for (var i = 0; i < data.length; i++) {
                this.deleteRemoveModel(data[i]);
            }
        } else if (data instanceof Object) {
            deleteRemoveModelByObject.call(this, data);
        }
    }

    /**
     * 건물 지우기 함수
     * 입력받은 데이터에 해당하는 건물을 제거한다.
     * @param {Array<KeyValue> | KeyValue} data 건물 지우기 데이터 배열 또는 오브젝트 (Object 구성 {layer : 레이어이름, uid : 유니크아이디})
     */
    removeModel(data) {
        if (data instanceof Array) {
            for (var i = 0; i < data.length; i++) {
                this.removeModel(data[i]);
            }
        } else if (data instanceof UMesh) {
            removeModelByUMesh.call(this, data);
        } else if (data instanceof Object) {
            removeModelByObject.call(this, data);
        }
    }

    /**
     * 건물 지우기 내역을 모두 취소하고, 지워진 건물을 가시화 하는 함수.
     */
    cancelAllRemoveModel() {
        this._removedModel = this._removedModel || [];
        for (let i = 0; i < this._removedModel.length; i++) {
            const info = this._removedModel[i];
            this.cancelRemoveModel(info.layer, info.uid, true);
        }
        this._removedModel = [];
    }

    /**
     * 입력받은 레이어의 UniqueId를 가진 건물을 다시 가시화 하는 함수
     * @param {string} layerName 레이어 이름
     * @param {string|number} uid 건물 UniqueId
     */
    cancelRemoveModel(layerName, uid, autoSave) {
        var idx;
        for (var i = 0; i < this._removedModel.length; i++) {
            var info = this._removedModel[i];
            if (info.layer === layerName && info.uid === uid) {
                idx = i;
                break;
            }
        }

        if (!defined(idx)) {
            return;
        }
        var info = this._removedModel[idx];
        var layer = this.getLayer(info.layer);
        if (defined(layer)) {
            layer.cancelRemoveByUid(info.uid)
        }
        if (!autoSave) {
            this._removedModel.splice(idx, 1);
        }
    }

    /**
     * 지워진 건물 목록을 반환 하는 함수
     * @returns {Array<KeyValue>} 지워진 건물 목록 배열
     */
    getRemovedModelList() {
        return this._removedModel;
    }

    /**
     * 레이어 이름과 id를 입력 받아 지워진 건물에 정보를 반환하는 함수
     * @param {string} layerName 레이어 이름
     * @param {string} uid 대상 uid
     * @returns {object} 지워진 건물 정보
     */
    getRemovedModel(layerName, uid) {
        const self = this;
        for (var i = 0; i < self._removedModel.length; i++) {
            var info = self._removedModel[i];
            if (info.layer === layerName && info.uid === uid) {
                return info;
            }
        }
    }

    /**
     * 지도화면 제어(이동(Pan), 줌(ZoomIn-ZoomOut), 회전(Rotation)) 함수
     * @param {boolean} [bool=true] 지도화면 제어 유무
     */
    disableCameraMove(bool) {
        var self = this;
        var mapControl = self._mapControl;

        if (!defined(bool)) {
            bool = false;
        } else {
            bool = !bool;
        }
        if (defined(mapControl)) {
            mapControl.enableZoom = bool;
            mapControl.enablePan = bool;
            mapControl.enableRotate = bool;
        }
    }

    /**
     * 지도화면 줌(확대/축소) 제어 함수
     * @param {boolean} [bool=true] 지도화면 줌(확대/축소) 제어 유무
     */
    disableCameraZoom(bool) {
        var self = this;
        var mapControl = self._mapControl;

        if (!defined(bool)) {
            bool = false;
        } else {
            bool = !bool;
        }
        if (defined(mapControl)) {
            mapControl.enableZoom = bool;
        }
    }

    /**
     * 지도화면 이동(Pan) 제어 함수
     * @param {boolean} [bool=true] 지도화면 이동(Pan) 제어 유무
     */
    disableCameraPan(bool) {
        var self = this;
        var mapControl = self._mapControl;

        if (!defined(bool)) {
            bool = false;
        } else {
            bool = !bool;
        }
        if (defined(mapControl)) {
            mapControl.enablePan = bool;
        }
    }

    /**
     * 지도화면 회전(Rotation) 제어 함수
     * @param {boolean} [bool=true] 지도화면 회전(Rotation) 제어 유무
     */
    disableCameraRotate(bool) {
        var self = this;
        var mapControl = self._mapControl;

        if (!defined(bool)) {
            bool = false;
        } else {
            bool = !bool;
        }
        if (defined(mapControl)) {
            mapControl.enableRotate = bool;
        }
    }

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
    setCameraDownRotate(value, isDegree = true) {
        const self = this;
        const control = self._mapControl;
        if (!control) {
            __GInfo__('please Setting GeOnDT MapControl', '7364684');
        }

        if (!isDegree)
            value = THREE.MathUtils.radToDeg(value);

        control.rotateDownDegree(value);
        control.update();
    }

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
    setCameraLeftRotate(value, isDegree = true) {
        const self = this;
        const control = self._mapControl;
        if (!control) {
            __GInfo__('please Setting GeOnDT MapControl', '7365223');
        }

        if (!isDegree)
            value = THREE.MathUtils.radToDeg(value);

        control.rotateLeftDegree(value);
        control.update();
    }

    /**
     * @description 카메라의 출력 최소거리와 최대거리를 설정하는 함수
     * @param {Number} min 카메라의 출력 최소거리
     * @param {Number} max 카메라의 출력 최대거리
     */
    setCameraLimitDistance(min, max) {
        var self = this;

        if (self._mapControl && self._mapControl.getFactor) {
            if (min)
                self._mapControl.getFactor().minDistance = min;
            if (max)
                self._mapControl.getFactor().maxDistance = max;
        }
    }

    resetCameraLimitDistance() {
        const self = this;

        if (self._mapControl && self._mapControl.getFactor) {
            self._mapControl.getFactor().minDistance = DEFAULT_CONTROL_FACTOR.MIN_DISTANCE;
            self._mapControl.getFactor().maxDistance = self.getResolutionFromZoom(self._minZoomLevel) * 0.7;
        }
    }


    /**
     * UMapcontrol의 충돌계수(collisionFactor)를 설정하는 함수
     * @param {number} factor 충돌계수 (ex:2)
     */
    setCollisionFactor(factor) {
        var self = this;

        if (!defined(factor)) return

        if (defined(self._mapControl)) {
            self._mapControl.getFactor().collisionFactor = factor;
        }
    }

    /**
     * UMapcontrol의 충돌계수(collisionFactor)를 반환하는 함수
     * @returns {number} 충돌계수 (ex:2)
     */
    getCollisionFactor() {
        var self = this;
        if (defined(self._mapControl)) {
            return self._mapControl.getFactor().collisionFactor;
        }
    }

    editedMesh(mesh, editedEvent) {
        let self = this;
        if (!defined(mesh.getLayerName)) return;
        let LayerName = mesh.getLayerName();
        let layer = self.getLayerByName(LayerName)

        if (defined(layer) && defined(mesh._tile)) {
            mesh.position.copy(editedEvent.position);

            //+ rotate
            let tempData = editedEvent.editData['rotate'];
            if (tempData._x !== 0 || tempData._y !== 0 || tempData._z !== 0) {
                mesh.rotation.x = tempData._x;
                mesh.rotation.y = tempData._y;
                mesh.rotation.z = tempData._z;
            }
            //+ scale
            tempData = editedEvent.editData['scale'];
            if (tempData.x !== 1 || tempData.y !== 1 || tempData.z !== 1) {
                mesh.scale.x = tempData.x;
                mesh.scale.y = tempData.y;
                mesh.scale.z = tempData.z;
            }
            if (layer.editedModel && layer.setTileFromEditedModel) {
                layer.editedModel(mesh, editedEvent);
                layer.setTileFromEditedModel(mesh, layer, layer._drawArg);
            }
        }
    }

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
    getLightdIsSelected(e) {
        let target = [];
        this._lightList.forEach((light) => {
            target.push(light._scene);
        })
        let intersect = this.intersectFromScene(e, target);
        if (intersect.length === 0) return undefined;

        let selected = undefined;
        intersect.forEach((obj) => {
            const control = /** @type {{_type: string, _parents: import('@USpotLight').USpotLight}} */(/** @type {unknown} */(obj.object));
            if (control._type === "controlObj")
                selected = control._parents;
        });

        if (!defined(selected)) return undefined;

        this._selected = selected;
        return this._selected;
    }

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
    getViewIsSelected(e) {
        let scenes = [];
        this._viewList.forEach((view) => {
            scenes.push(view.scene);
        })
        let intersect = this.intersectFromScene(e, scenes);
        if (intersect.length === 0) return undefined;

        let selected = undefined;
        intersect.forEach((obj) => {
            const control = /** @type {{_type: string, _parents: import('@U3dView').U3dView}} */(/** @type {unknown} */(obj.object));
            if (control._type === "controlObj")
                selected = control._parents;
        });

        if (!defined(selected)) return undefined;

        this._selected = selected;
        return this._selected;
    }

    /**
     * 각도 값을 라디안 값으로 변환합니다.
     *
     * @param {Degree} degree 각도 값
     * @returns {Radian | undefined} 변환된 라디안 값
     *
     * @example
     * const radian = app.setDegreeToRadian(180);
     */
    setDegreeToRadian(degree) {
        if (!defined(degree)) return;
        return (Math.PI / 180) * degree;
    }

    /**
     * 라디안 값을 각도 값으로 변환합니다.
     *
     * @param {Radian} radian 라디안 값
     * @returns {Degree | undefined} 변환된 각도 값
     *
     * @example
     * const degree = app.setRadianToDegree(Math.PI);
     */
    setRadianToDegree(radian) {
        if (!defined(radian)) return;
        return radian * (180 / Math.PI);
    }

    /**
     * 지면 그림자 출력 레벨를 리턴하는 함수
     * @returns {number} 지면 그림자 출력 레벨 (기본값 13)
     */
    getTerrainShadowLevel() {
        return this._drawArg.getTerrainShadowLevel();
    }

    /**
     * 지면 그림자 출력 레벨을 설정하는 함수
     * @param {number} [terrainShadowLevel=13] 지면 그림자 출력 레벨 설정 값
     */
    setTerrainShadowLevel(terrainShadowLevel = UDEF.DEFAULT_TERRAIN_SHADOW_LEVEL) {
        this._drawArg.setTerrainShadowLevel(terrainShadowLevel)
    }


    /**
     * 향상된 지면처리 여부를 반환하는 함수
     * @returns {string} 향상된 지면처리 여부
     */
    getImproveLevel() {
        const self = this;
        const keys = Object.keys(UDEF.IMPROVE_TEXTURE_LEVEL);
        for (let key of keys) {
            if (UDEF.IMPROVE_TEXTURE_LEVEL[key] === self._improveTexture) {
                return key;
            }
        }
    }

    /**
     * 현재 지면 처리 품질 단계를 반환합니다.
     *
     * @returns {number} 품질 단계 값 (none `0`, low `1`, medium `2`, high `3`, ultra `4`)
     *
     * @example
     * app.setImproveValue('high');
     * const level = app.getImproveValue(); // 3
     */
    getImproveValue() {
        return this._improveTexture;
    }

    /**
     * 지면 처리 품질 단계를 설정합니다.
     *
     * @param {string} value 품질 단계 이름
     *
     * @example
     * app.setImproveValue('high');
     */
    setImproveValue(value) {
        if (UDEF.IMPROVE_TEXTURE_LEVEL[value]) {
            this._improveTexture = UDEF.IMPROVE_TEXTURE_LEVEL[value];
        }
    }

}//Class End

function setStyleDrawSunAmount(mesh, total) {
    if (total < 0) {
        return "#6FED9C";
    }
    const maxTotal = 900;  // 최대 total 값
    const minTotal = 0;    // 최소 total 값

    // total 값이 범위를 넘지 않도록 제한
    total = Math.max(minTotal, Math.min(total, maxTotal));

    // 구간별 색상 변화 설정
    const ranges = [
        {min: 0, max: 100, color: {r: 255, g: 255, b: 219}},
        {min: 100, max: 200, color: {r: 255, g: 255, b: 115}},
        {min: 200, max: 250, color: {r: 255, g: 255, b: 0}},
        {min: 250, max: 300, color: {r: 255, g: 220, b: 0}},
        {min: 300, max: 350, color: {r: 255, g: 210, b: 0}},
        {min: 350, max: 400, color: {r: 255, g: 190, b: 0}},
        {min: 400, max: 450, color: {r: 255, g: 160, b: 0}},
        {min: 450, max: 500, color: {r: 255, g: 130, b: 0}},
        {min: 500, max: 550, color: {r: 255, g: 110, b: 0}},
        {min: 550, max: 600, color: {r: 255, g: 100, b: 0}},
        {min: 600, max: 700, color: {r: 255, g: 70, b: 0}},
        {min: 700, max: 900, color: {r: 255, g: 0, b: 0}},
    ];

    // 해당하는 구간 찾기
    let selectedRange = ranges.find(range => total >= range.min && total < range.max);

    if (!selectedRange) {
        selectedRange = ranges[ranges.length - 1];  // 최대값 구간
    }

    const {r, g, b} = selectedRange.color;
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

function getIntersectNormal(vector, intersect) {
    let self = this;
    if (intersect === undefined) return undefined;

    const mesh = intersect.object;
    const center = new THREE.Vector3().copy(mesh.geometry.boundingSphere.center).applyMatrix4(mesh.matrixWorld);

    let directionVector = new THREE.Vector3().subVectors(vector, center).normalize();
    const raycaster = new URaycaster();
    raycaster.set(center, directionVector);

    const intersects = raycaster.intersectObjects([mesh]);

    let target = undefined;
    if (intersects.length > 0) {
        let minDist = Infinity;

        for (let item of intersects) {
            const obj = item.object;
            if ((obj instanceof UMesh || obj instanceof THREE.Mesh) && obj.uuid === intersect.object.uuid) {
                const dist = vector.distanceTo(item.point);
                if (dist < minDist) {
                    minDist = dist;
                    target = item;
                }
            }
        }
    } else {
        __GInfo__(self, "clipping plane 생성을 위한 nomarl 값을 찾을 수 없습니다.", "0277402");
    }

    return target ? {normal: target.face.normal, point: target.point} : {
        normal: intersect.face.normal,
        point: intersect.point
    };
}

let sharedGeometry;
let sharedMaterials = {};

function drawSunAmount(total, vector, drawOpt, intersect) {
    const self = this;

    const width = drawOpt.boxWidth;
    const boxNum = drawOpt.boxNum;
    const name = drawOpt.name;
    if (!width || !boxNum) return;

    const length = boxNum;
    const half = boxNum / 2;

    const center = new THREE.Vector3(
        Math.floor(vector.x),
        Math.floor(vector.y),
        Math.floor(vector.z)
    );
    const startX = center.x - half;
    const startY = center.y - half;
    const startZ = center.z - half;
    const endX = center.x + half;
    const endY = center.y + half;
    const endZ = center.z + half;

    // 최초의 사각형 생성 (분할되지 않은 큐브)
    const root = {
        min: {x: startX, y: startY, z: startZ},
        max: {x: endX, y: endY, z: endZ}
    };
    const rootBox = new THREE.Box3(root.min, root.max);

    let group = new UGroup();
    group.name = name;
    group._totalSunAmount = total; //그룹에 총 일조량 저장
    self._scene.add(group);
    const intersectCubes = findIntersectingCubes(rootBox, self.getLight()._sunAmountDrawMesh, total, group.uuid);

    // 분할된 큐브 좌표 계산
    const cubes = createCubes(startX, startY, startZ, length, width);

    // 클리핑 기능 허용
    let plane = undefined;
    if (drawOpt.usePlane) {
        if (intersect.object.geometry.classtype !== "UPlaneBufferGeometry") {
            self.getRenderer().localClippingEnabled = true;

            // 센터 점과 가장 가까운 정점이 가지는 normal 값을 구한다.
            let info = getIntersectNormal.call(self, center, intersect);

            if (defined(info)) {
                plane = new THREE.Plane();
                plane.setFromNormalAndCoplanarPoint(info.normal, info.point);
            }

            // const arrowHelper = new THREE.ArrowHelper(
            //     info.normal,  // 방향 벡터
            //     vector,           // 시작점
            //     100, // 벡터의 길이
            //     0xff0000         // 색상 (빨간색)
            // );
            // self._scene.add(arrowHelper);

            // const helper = new THREE.PlaneHelper( plane, self._sizeWorld, 0xffff00 );
            // self._scene.add( helper );
        }
    }

    // 고도 & 지형인 경우 PlaneBuffer를 사용하기 때문에 클리핑 불필요

    // closestPoint를 기준으로 해당 면에 대해 충돌 검사
    for (const cube of cubes) {
        // 큐브 메시 생성
        if (checkCollision(intersect.object, cube)) {
            const mesh = drawCube.call(self, cube);
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            if (plane && plane.distanceToPoint(mesh.position) + (width / 2) < 0) {
                continue;
            }

            let intersectCube = undefined;
            let intersectTotal = 0;
            for (let i = 0; i < intersectCubes.length; i++) {
                intersectCube = intersectCubes[i];
                if (mesh.position.distanceTo(intersectCube.position) < (width / 2)) {
                    if (intersectTotal && intersectTotal < intersectCubes[i].total)
                        intersectTotal = intersectCubes[i].total;

                    if (intersectCube.parent)
                        intersectCube.parent.remove(intersectCube);

                    intersectCubes.splice(i, 1);
                    i--;
                }
            }
            let amount = total;
            if (intersectTotal > 0) {
                amount = (intersectTotal + total) / 2;
            }
            cube.total = amount;
            let color = drawOpt.styleFun.call(self, mesh, amount);
            if (!color)
                color = setStyleDrawSunAmount.call(self, mesh, amount);

            mesh.material.dispose();
            mesh.material = getCubeMaterial.call(self, color, plane);
            group.add(mesh);
            mesh.setManualUpdate();
        }
    }
    group.scale.multiplyScalar(width);
    self.getLight()._sunAmountDrawMesh.push(group);
}

function getCubeMaterial(color, plane) {
    let materialKey =
        color.toString();
    if (plane) {
        materialKey = materialKey + '_'
            + plane.constant.toFixed(3) + '_'
            + plane.normal.x.toFixed(3) + '_'
            + plane.normal.y.toFixed(3) + '_'
            + plane.normal.z.toFixed(3);
    }
    if (!sharedMaterials[materialKey]) {
        sharedMaterials[materialKey] = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            opacity: 0.8,
            transparent: true,
            color: color,
            fog: false,
            forceSinglePass: true,
            precision: "lowp"
        });

        if (plane)
            sharedMaterials[materialKey].clippingPlanes = [plane];
    }
    return sharedMaterials[materialKey];
}

function drawCube(rect) {
    let calPoints = []

    const min = rect.min;
    const max = rect.max;
    const vertexes = [
        new THREE.Vector3(min.x, max.y, max.z), // topFrontLeft
        new THREE.Vector3(max.x, max.y, max.z), // topFrontRight
        new THREE.Vector3(min.x, min.y, max.z), // bottomFrontLeft
        new THREE.Vector3(max.x, min.y, max.z), // bottomFrontRight
        new THREE.Vector3(min.x, max.y, min.z), // topBackLeft
        new THREE.Vector3(max.x, max.y, min.z), // topBackRight
        new THREE.Vector3(min.x, min.y, min.z), // bottomBackLeft
        new THREE.Vector3(max.x, min.y, min.z)  // bottomBackRight
    ];

    const center = new THREE.Vector3();
    vertexes.forEach(v => {
        center.add(v);
    });
    center.divideScalar(vertexes.length); // 평균값을 구해 중심 좌표로 설정

    if (!sharedGeometry) {
        sharedGeometry = new UBufferGeometry();

        for (let i = 0; i < vertexes.length; i++) {
            calPoints.push(
                vertexes[i].x - center.x,
                vertexes[i].y - center.y,
                vertexes[i].z - center.z
            );
        }

        const indices = [
            0, 1, 3, 0, 3, 2, // 앞면
            4, 5, 7, 4, 7, 6, // 뒷면
            0, 1, 5, 0, 5, 4, // 윗면
            2, 3, 7, 2, 7, 6, // 아랫면
            0, 2, 6, 0, 6, 4, // 왼쪽 면
            1, 3, 7, 1, 7, 5  // 오른쪽 면
        ];

        sharedGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(calPoints), 3));
        sharedGeometry.setIndex(indices);
        sharedGeometry.computeBoundingBox();
    }

    let mesh = new UMesh(sharedGeometry, undefined);
    mesh.userData.exceptAO = true;
    mesh.position.copy(center);
    mesh.setManualUpdate();

    return mesh;
}

// 이전에 그려진 큐브와 교차 여부 검사
function findIntersectingCubes(rootBox, prevCubes, total, uuid) {
    const intersectedCubes = [];
    prevCubes.forEach((group) => {
        if (group.uuid === uuid) return; // 본인 제외

        group.children.forEach((child) => {
            let boundingBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
            if (boundingBox.intersectsBox(rootBox)) {
                intersectedCubes.push(child);
            }
        });
    });
    return intersectedCubes;
}

function createCubes(startX, startY, startZ, length, width) {
    const cubes = [];
    for (let i = 0; i < length; i += width) {
        for (let j = 0; j < length; j += width) {
            for (let k = 0; k < length; k += width) {
                const cube = new THREE.Box3().setFromPoints([
                    new THREE.Vector3(startX + i, startY + j + width, startZ + k + width),
                    new THREE.Vector3(startX + i + width, startY + j + width, startZ + k + width),
                    new THREE.Vector3(startX + i, startY + j, startZ + k + width),
                    new THREE.Vector3(startX + i + width, startY + j, startZ + k + width),
                    new THREE.Vector3(startX + i, startY + j + width, startZ + k),
                    new THREE.Vector3(startX + i + width, startY + j + width, startZ + k),
                    new THREE.Vector3(startX + i, startY + j, startZ + k),
                    new THREE.Vector3(startX + i + width, startY + j, startZ + k)
                ]);
                cubes.push(cube);
            }
        }
    }
    return cubes;
}

function checkCollision(mesh, cubeBox) {
    if (!mesh.geometry) return false;

    if (!mesh.geometry.boundsTree)
        mesh.geometry.computeBoundsTree();

    const transformMatrix = new THREE.Matrix4();
    transformMatrix.copy(mesh.matrixWorld).invert();

    return mesh.geometry.boundsTree.intersectsBox(cubeBox, transformMatrix);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////

function getOptionRegion(option = {}) {
    const regionOption = {};

    if (!option.passlevel)
        option.passlevel = 0;

    if (option.type === 'world') {
        option.targetrectopt = {x: 0, y: 0, level: 0};
        option.minZoomLevel = 3;
    } else if (option.targetrectopt || option.rectangle) {
        option.type = 'custom';
        if (option.targetrectopt) {
            option.targetrectopt.x = option.targetrectopt.x || DEFAULT_WORLD_INDEX.x;
            option.targetrectopt.y = option.targetrectopt.y || DEFAULT_WORLD_INDEX.y;
            option.targetrectopt.level = option.targetrectopt.level || DEFAULT_WORLD_INDEX.level;
        }
    }

    if (!option.targetrectopt)
        option.targetrectopt = DEFAULT_WORLD_INDEX;

    regionOption.startlevel = regionOption.datalevel = option.targetrectopt.level; //사용자 옵션으로 받지 않는다.
    regionOption.size = Math.round(WORLD_SIZE / Math.pow(2, regionOption.startlevel));  //사용자 옵션으로 받지 않는다.

    if (!option.far)
        option.far = regionOption.size * 2;

    if (!defined(option.minZoomLevel))
        option.minZoomLevel = DEFAULT_MIN_ZOOM_LEVEL;

    regionOption.rectangle = UMathEngine.getGoogleRectangleDefine(
        option.targetrectopt.x,
        option.targetrectopt.y,
        option.targetrectopt.level
    );  //사용자 옵션으로 받지 않는다.

    regionOption.rectangle.round();

    return regionOption;
}

function removeModelByObject(obj) {
    var uid = obj.uid;
    var layer = obj.layer;
    removeModel_.call(this, layer, uid);
}

function removeModelByUMesh(mesh) {
    const uid = mesh.getUid();
    const layerName = mesh.getLayerName();
    removeModel_.call(this, layerName, uid);
}

function removeModel_(layerName, uid) {
    const layer = this.getLayer(layerName);
    if (!defined(layer)) {
        return;
    }
    if (this.getRemovedModel(layerName, uid)) return;

    layer.removeModelByUid(uid);
    addRemovedModelInfo.call(this, layerName, uid);
}

function addRemovedModelInfo(layerName, uid) {
    this._removedModel = this._removedModel || [];
    this._removedModel.push({
        layer: layerName,
        uid: uid.toString()
    });
}

function deleteRemoveModelByObject(obj) {
    var uid = obj.uid;
    var layer = obj.layer;
    deleteRemoveModel_.call(this, layer, uid);
}

function deleteRemoveModel_(layerName, uid) {
    var layer = this.getLayer(layerName);
    if (!defined(layer)) {
        return;
    }
    // 취소 함수가 삭제 목록에서 복원 대상을 찾으므로 기록은 복원 뒤에 지운다.
    this.cancelRemoveModel.call(this, layerName, uid);
    layer.deleteRemovedUidList(uid);
}

function registerRemoveModelByObject(obj) {
    var uid = obj.uid;
    var layer = obj.layer;
    resigterRemoveModel_.call(this, layer, uid);
}

function resigterRemoveModel_(layerName, uid) {
    var layer = this.getLayer(layerName);
    if (!defined(layer)) {
        return;
    }
    layer.registerRemovedUidList(uid);
    addRemovedModelInfo.call(this, layerName, uid);
}

function getFristPoint(intersects) {
    var result = undefined;
    try {
        if (intersects[0])
            result = intersects[0].point
    } catch (e) {
    }
    return result;
}

function getOverlayWrapper() {
    const container = this.container();
    let wrapper = container.getElementsByClassName('u3d-overlay-wrapper');
    if (!defined(wrapper) || wrapper.length === 0) {
        wrapper = document.createElement('div');
        wrapper.className = 'u3d-overlay-wrapper';
        wrapper.style = 'position:absolute';
        container.appendChild(wrapper);
    } else {
        wrapper = wrapper[0];
    }
    return wrapper;
}

function getDomElementFromMaybeWrapped(element) {
    if (element?.nodeType === 1) {
        return element;
    }

    if (element?.[0]?.nodeType === 1) {
        return element[0];
    }

    return undefined;
}

// function checkFrame_(check, curTime) {
//     if (!defined(curTime)) return false;
//
//     if (this.isDisposed() || UDEF.isDelayTime(curTime)) {
//         if (defined(check)) check.updateTime();
//         return true;
//     }
//
//     return false;
// }

function getViewLightWrapper() {
    const container = this.container();
    let wrapper = container.getElementsByClassName('u3d-view-light-wrapper');
    if (!defined(wrapper) || wrapper.length === 0) {
        wrapper = document.createElement('div');
        wrapper.className = 'u3d-view-light-wrapper';
        wrapper.style = 'position:absolute';
        container.appendChild(wrapper);
    } else {
        wrapper = wrapper[0];
    }
    return wrapper;
}

function getViewWrapper() {
    const container = this.container();
    let wrapper = container.getElementsByClassName('u3d-view-wrapper');
    if (!defined(wrapper) || wrapper.length === 0) {
        wrapper = document.createElement('div');
        wrapper.className = 'u3d-view-wrapper';
        wrapper.style.position = 'absolute';
        container.appendChild(wrapper);
    } else {
        wrapper = wrapper[0]
    }
    return wrapper; // DOM Element 반환
}

// TODO stopFly와 중복
function stopTween_() {
    var self = this;

    if (defined(self._tweenFrom2Mid))
        self._tweenFrom2Mid.stop();

    if (defined(self._tweenMid2To))
        self._tweenMid2To.stop();

    if (self._isTwenning) {
        if (defined(self._tweenFrom2Mid))
            self._tweenFrom2Mid.stop();

        self._tweenFrom2Mid = undefined;

        if (defined(self._tweenMid2To))
            self._tweenMid2To.stop();

        self._tweenMid2To = undefined;

        self._isTwenning = false;
    }
}

function stopFly_() {
    var self = this;
    if (self._isCameraRest) {
        return;
    }

    if (defined(self._currentTween)) {
        self._currentTween.stop();
        self._currentTween = undefined;
    }
}

function clipAxis(type, value) {
    const self = this;
    self.setProperties(UDEF.APP_PROP.CLIP.CLIP_X, undefined);
    self.setProperties(UDEF.APP_PROP.CLIP.CLIP_Y, undefined);
    self.setProperties(UDEF.APP_PROP.CLIP.CLIP_Z, undefined);

    switch (type) {
        case 'x':
            if (value instanceof THREE.Plane) {
                self.setProperties(UDEF.APP_PROP.CLIP.CLIP_X, value.constant);
                self._clippingPlanes = [value];
            } else {
                self.setProperties(UDEF.APP_PROP.CLIP.CLIP_X, value);
                self._globalPlaneX.constant = value;
                self._clippingPlanes = [self._globalPlaneX];
            }
            break;
        case 'y':
            if (value instanceof THREE.Plane) {
                self.setProperties(UDEF.APP_PROP.CLIP.CLIP_Y, value.constant);
                self._clippingPlanes = [value];
            } else {
                self.setProperties(UDEF.APP_PROP.CLIP.CLIP_Y, value);
                self._globalPlaneY.constant = value;
                self._clippingPlanes = [self._globalPlaneY];
            }
            break;
        case 'z':
            if (value instanceof THREE.Plane) {
                self.setProperties(UDEF.APP_PROP.CLIP.CLIP_Z, value.constant);
                self._clippingPlanes = [value];
            } else {
                self.setProperties(UDEF.APP_PROP.CLIP.CLIP_Z, value);
                self._globalPlaneZ.constant = value;
                self._clippingPlanes = [self._globalPlaneZ];
            }
            break;
        default:
            throw new Error('type is error!');
            break;
    }

    this.setProperties(UDEF.APP_PROP.CLIP.AXIS, type);
    this.updateData();
}

/**
 * 카메라를 기준으로 입력 비율의 절단면을 계산하여 기존 공개 setter로 적용합니다.
 *
 * @this {import('@U3dApp').U3dApp}
 * @param {string} type 절단 방향 구분
 * @param {number | string} [value=0] 클리핑 비율. 문자열은 기존과 동일하게 숫자로 변환합니다.
 */
function clipAxisByRatio(type, value = 0) {
    const self = this;
    if (typeof (value) === 'string') value = Number(value);

    // 초기화된 카메라·지도 타겟으로 절단면만 계산한다. 실제 절단 상태와 갱신 알림은 공개 setter가 담당한다.
    const plane = INTERNAL.createClippingPlaneByRatio(type, value, /** @type {U3dAppClippingPlaneSource} */ (self));
    switch (type) {
        case 'x':
            this.setClippingAxisX(plane);
            break;
        case 'y':
            this.setClippingAxisY(plane);
            break;
        case 'z':
            this.setClippingAxisZ(plane);
            break;
    }
}

function initMapControl(control) {
    const self = this;

    self.setPanSpeed();
    self.setRotateSpeed();
    self.setZoomSpeed();
    self.resetCameraLimitDistance();

    control.setApp(this);

    //Add EventHandler
    control.addEventListener('start', function (e) {
        if (!control.enabled) return;
        self._eventHandler.onStart(e);
    });
    control.addEventListener('end', function (e) {
        if (!control.enabled) return;
        self._eventHandler.onEnd(e);
    });
    return control;
}

function setWalkMode_(position, target, minHeight) {
    var self = this;
    self._walkControl.setMinHeight(minHeight);

    var flyend = function () {
        self._mode = UDEF.APP_MODE._WALK;
        self._walkControl.lat = THREE.MathUtils.radToDeg(self._mapControl.getAzimuthalAngle());
        self._walkControl.object.position.z = self._walkControl.getMinHeight();
        self._mapControl.removeEventListener('flyend', flyend);
        self._controls['map'].deactive();
        self.activeMode('walk');
    };
    position.z = Math.max(self._walkControl.getMinHeight(), position.z);
    // target.z = Math.max(self._walkControl.minZ, target.z);
    self.flyToPosition(position, target);

    self._mapControl.addEventListener('flyend', flyend);
}

function createWalkControls() {
    var self = this;
    var control = new UWalkControls({
        drawarg: self._drawArg,
        camera: self._camera,
        domelement: self._container,
        // aziangle  : opt.aziAngle,
        // minz      : opt.minZ
    });


    control.movementSpeed = 20;
    control.lookVertical = true;
    control.activeLook = false;
    self._walkControl = control;
    self._walkControl.eanbled = false;
    self._controls['walk'] = control;
}

function createFlyControls() {
    var self = this;
    var control = new UFlyControls({
        drawarg: self._drawArg,
        camera: self._camera,
        domelement: self._container,
        automove: self._autoMove
    });

    control.movementSpeed = 100;
    control.rollSpeed = Math.PI / 12;
    control.autoForward = true;
    control.dragToLook = false;

    self._flyControl = control;
    self._flyControl.eanbled = false;
    self._controls['fly'] = control;
}

function listenEndWork(self, callback, param) {
    if (self.getWorkingLevel2() <= 0) {
        if (defined(callback))
            callback.call(self, param);
        return;
    }
    setTimeout(listenEndWork, 500, self, callback, param);

}

function rotateObject(model, scene, degreeX, degreeY, degreeZ) {

    var mesh = scene.getObjectById(model._meshIDs[0]);
    if (defined(mesh) && defined(mesh.geometry)) {

        mesh.visible = true;
        if (defined(degreeX)) {
            degreeX = (degreeX * Math.PI) / 180;
            mesh.rotation.x = degreeX;

        }

        if (defined(degreeY)) {
            degreeY = (degreeY * Math.PI) / 180;
            mesh.rotation.y = degreeY;
        }

        if (defined(degreeZ)) {
            degreeZ = (degreeZ * Math.PI) / 180;
            mesh.rotation.z = degreeZ;
        }
    }
}

function getEmapGeoExtent_() {
    var proj5179 = ol.proj.get('EPSG:5179');
    var proj4326 = ol.proj.get('EPSG:4326');

    var projectionExtent = proj5179.getExtent();

    var ptLT = [projectionExtent[0], projectionExtent[1]];
    var ptRB = [projectionExtent[2], projectionExtent[3]];

    var geoLT = ol.proj.transform(ptLT, proj5179, proj4326);
    var geoRB = ol.proj.transform(ptRB, proj5179, proj4326);

    return [geoLT[0], geoLT[1], geoRB[0], geoRB[1]]
}

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function getWMTSLayerCapabilities(opt) {
    const promise = deferred();
    const req = new XMLHttpRequest();

    if (!defined(opt.xmlUrl)) {
        promise.reject();
    }

    const xmlUrl = "proxy.jsp?url=" + opt.xmlUrl;

    if (defined(xmlUrl)) {
        req.overrideMimeType('text/xml');
        req.onload = function () {
            if (this.status === 200) {
                promise.resolve(this);
            } else if (this.status === 404)
                console.error(xmlUrl + ' 파일이 존재하지 않습니다.');
        };
        req.open("GET", xmlUrl, true);
        req.send();
    }
    return promise;
}

export {U3dApp};
