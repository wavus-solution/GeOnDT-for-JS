// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U2dDxfLayer } from "../2dLayer/U2dDxfLayer.js";
import type { U2dShpLayer } from "../2dLayer/U2dShpLayer.js";
import type { U2dVectorShaderLayer } from "../2dLayer/U2dVectorShaderLayer.js";
import type { U3dGridTileLayer } from "../3dLayer/U3dGridTileLayer.js";
import type { U3dHeightXYZLayer } from "../3dLayer/U3dHeightXYZLayer.js";
import type { U3dImagePBFLayer } from "../3dLayer/U3dImagePBFLayer.js";
import type { U3dImageWMSLayer } from "../3dLayer/U3dImageWMSLayer.js";
import type { U3dImageWMTSLayer } from "../3dLayer/U3dImageWMTSLayer.js";
import type { U3dImageXYZLayer } from "../3dLayer/U3dImageXYZLayer.js";
import type { U3dLodComponentLayer } from "../3dLayer/U3dLodComponentLayer.js";
import type { U3dMaskLayer } from "../3dLayer/U3dMaskLayer.js";
import type { U3dModelBIMObjLayer } from "../3dLayer/U3dModelBIMObjLayer.js";
import type { U3dModelBasicLayer } from "../3dLayer/U3dModelBasicLayer.js";
import type { U3dModelDxfLayer } from "../3dLayer/U3dModelDxfLayer.js";
import type { U3dModelI3FLayer } from "../3dLayer/U3dModelI3FLayer.js";
import type { U3dModelKmlLayer } from "../3dLayer/U3dModelKmlLayer.js";
import type { U3dModelShapeLayer } from "../3dLayer/U3dModelShapeLayer.js";
import type { U3dModelStaticLayer } from "../3dLayer/U3dModelStaticLayer.js";
import type { U3dModelTilesLayer } from "../3dLayer/U3dModelTilesLayer.js";
import type { U3dModelU3FLayer } from "../3dLayer/U3dModelU3FLayer.js";
import type { U3dModelWFSLayer } from "../3dLayer/U3dModelWFSLayer.js";
import type { U3dMultipleComponentLayer } from "../3dLayer/U3dMultipleComponentLayer.js";
import type { U3dPatternXYZLayer } from "../3dLayer/U3dPatternXYZLayer.js";
import type { U3dShaderMeasureLayer } from "../3dLayer/U3dShaderMeasureLayer.js";
import type { U3dTerrainLayer } from "../3dLayer/U3dTerrainLayer.js";
import type { U3dVectorLayer } from "../3dLayer/U3dVectorLayer.js";
import type { U3dVectorPBFLayer } from "../3dLayer/U3dVectorPBFLayer.js";
import type { U3dVectorTileLayer } from "../3dLayer/U3dVectorTileLayer.js";
import type { U3dVideoLayer } from "../3dLayer/U3dVideoLayer.js";
import type { UAnalyAlarm } from "../analy/UAnalyAlarm.js";
import type { UAnalyAlignModel } from "../analy/UAnalyAlignModel.js";
import type { UAnalyArea } from "../analy/UAnalyArea.js";
import type { UAnalyAverageHeight } from "../analy/UAnalyAverageHeight.js";
import type { UAnalyClipping } from "../analy/UAnalyClipping.js";
import type { UAnalyContour } from "../analy/UAnalyContour.js";
import type { UAnalyCustomLand } from "../analy/UAnalyCustomLand.js";
import type { UAnalyCustomModel } from "../analy/UAnalyCustomModel.js";
import type { UAnalyDepth } from "../analy/UAnalyDepth.js";
import type { UAnalyDistance } from "../analy/UAnalyDistance.js";
import type { UAnalyGizmoModel } from "../analy/UAnalyGizmoModel.js";
import type { UAnalyHeight } from "../analy/UAnalyHeight.js";
import type { UAnalyHeightLimit } from "../analy/UAnalyHeightLimit.js";
import type { UAnalyLandScape } from "../analy/UAnalyLandScape.js";
import type { UAnalyMultipleComponent } from "../analy/UAnalyMultipleComponent.js";
import type { UAnalyObjectInfo } from "../analy/UAnalyObjectInfo.js";
import type { UAnalyParticle } from "../analy/UAnalyParticle.js";
import type { UAnalyPhysicalFlow } from "../analy/UAnalyPhysicalFlow.js";
import type { UAnalyRoad } from "../analy/UAnalyRoad.js";
import type { UAnalyRoute } from "../analy/UAnalyRoute.js";
import type { UAnalySection } from "../analy/UAnalySection.js";
import type { UAnalySkyLine } from "../analy/UAnalySkyLine.js";
import type { UAnalySlope } from "../analy/UAnalySlope.js";
import type { UAnalySlopeAspect } from "../analy/UAnalySlopeAspect.js";
import type { UAnalySun } from "../analy/UAnalySun.js";
import type { UAnalySurfaceVolume } from "../analy/UAnalySurfaceVolume.js";
import type { UAnalyViewCone } from "../analy/UAnalyViewCone.js";
import type { UClipModelFilter } from "../analy/UClipModelFilter.js";
import type { U3dApp } from "./U3dApp.js";
import type { UCollider } from "../collision/UCollider.js";
import type { UCollisionAdapter } from "../collision/UCollisionAdapter.js";
import type { UCollisionManager } from "../collision/UCollisionManager.js";
import type { computeBoundingIntersectionRatio, computeIntersectionRatio } from "../collision/UCollisionMath.js";
import type { UPolygonCollider } from "../collision/UPolygonCollider.js";
import type { USphereCollider } from "../collision/USphereCollider.js";
import type { U3dNodeManager } from "../core/U3dNodeManager.js";
import type { UDEF } from "../core/UDEF.js";
import type { UFrustum } from "../core/UFrustum.js";
import type { UGroup } from "../core/UGroup.js";
import type { UDRACOLoader } from "../core/loader/UDRACOLoader.js";
import type { UFileLoader } from "../core/loader/UFileLoader.js";
import type { UGLTFLoader } from "../core/loader/UGLTFLoader.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { UDxfParser } from "../core/parser/UDxfParser.js";
import type { UMeshParser } from "../core/parser/UMeshParser.js";
import type { UOBJParser } from "../core/parser/UOBJParser.js";
import type { UShpParser } from "../core/parser/UShpParser.js";
import type { UImageWriter } from "../core/writer/UImageWriter.js";
import type { UMTLWriter } from "../core/writer/UMTLWriter.js";
import type { UMeshWriter } from "../core/writer/UMeshWriter.js";
import type { UOBJWriter } from "../core/writer/UOBJWriter.js";
import type { UDraw } from "../draw/UDraw.js";
import type { UDirectionArrowGroup } from "../effect/UDirectionArrowGroup.js";
import type { UParticle } from "../effect/UParticle.js";
import type { UParticleEngine } from "../effect/UParticleEngine.js";
import type { UWater } from "../env/UWater.js";
import type { U3dMouseEvent } from "../event/U3dMouseEvent.js";
import type { U2dLine } from "../geometry/U2dLine.js";
import type { U2dPoint } from "../geometry/U2dPoint.js";
import type { U2dPolygon } from "../geometry/U2dPolygon.js";
import type { U3dAdaptedGeometry } from "../geometry/U3dAdaptedGeometry.js";
import type { U3dBilboard } from "../geometry/U3dBilboard.js";
import type { U3dBox } from "../geometry/U3dBox.js";
import type { U3dCircle } from "../geometry/U3dCircle.js";
import type { U3dCumulativePath } from "../geometry/U3dCumulativePath.js";
import type { U3dCylinder } from "../geometry/U3dCylinder.js";
import type { U3dFault } from "../geometry/U3dFault.js";
import type { U3dFaultGeometry } from "../geometry/U3dFaultGeometry.js";
import type { U3dFlowPipe } from "../geometry/U3dFlowPipe.js";
import type { U3dGeometryFactory } from "../geometry/U3dGeometryFactory.js";
import type { U3dGeometryUtil } from "../geometry/U3dGeometryUtil.js";
import type { U3dHeatGeometry } from "../geometry/U3dHeatGeometry.js";
import type { U3dLine } from "../geometry/U3dLine.js";
import type { U3dPOI } from "../geometry/U3dPOI.js";
import type { U3dPathGeometry } from "../geometry/U3dPathGeometry.js";
import type { U3dPipe } from "../geometry/U3dPipe.js";
import type { U3dPoint } from "../geometry/U3dPoint.js";
import type { U3dPolygonLoftGeometry } from "../geometry/U3dPolygonLoftGeometry.js";
import type { U3dSphere } from "../geometry/U3dSphere.js";
import type { U3dUserGeometry } from "../geometry/U3dUserGeometry.js";
import type { USpeedModelFilter } from "../geometry/USpeedModelFilter.js";
import type { UBox3Helper } from "../helpers/UBox3Helper.js";
import type { UFrustumTerrainProjectionHelper } from "../helpers/UFrustumTerrainProjectionHelper.js";
import type { UGroupBoundaryHelper } from "../helpers/UGroupBoundaryHelper.js";
import type { ULandNormalDirectionHelper } from "../helpers/ULandNormalDirectionHelper.js";
import type { ULocalENUHelper } from "../helpers/ULocalENUHelper.js";
import type { UTerrainStamp } from "../helpers/UTerrainStamp.js";
import type { UGPoint } from "../math/UGPoint.js";
import type { UMathEngine } from "../math/UMathEngine.js";
import type { U3dMessage } from "../message/U3dMessage.js";
import type { UControls } from "../mode/UControls.js";
import type { UFlyControls } from "../mode/UFlyControls.js";
import type { UMapControls } from "../mode/UMapControls.js";
import type { UWalkControls } from "../mode/UWalkControls.js";
import type { U3dCustomModel } from "../model/U3dCustomModel.js";
import type { U3dOverlay } from "../overlay/U3dOverlay.js";
import type { U3dObjectBarrier } from "../select/U3dObjectBarrier.js";
import type { U3dSelect } from "../select/U3dSelect.js";
import type { UDefaultSource } from "../source/UDefaultSource.js";
import type { Gradient } from "../util/Gradient.js";
import type { deferred } from "../util/deferred.js";
import type { snapPointToMesh, snapWorldPointToMesh } from "../util/snapPointToMesh.js";
import type { U3dSimpleView } from "../view/U3dSimpleView.js";
import type { U3dView } from "../view/U3dView.js";
import type { U3dViewLight } from "../view/U3dViewLight.js";
import type { UIndoorLight } from "../view/UIndoorLight.js";
import type { USpotLight } from "../view/USpotLight.js";

/**
 * GeOnDT for JS API 네임스페이스 명세
 * @namespace GeOnDT
 */
declare class GeOnDT {
    static resolve: any;
    static reject: any;
    static then: any;
    static ready: any;
    static catch: any;
    static fail: any;
    /**
     * GeOnDT for JS  버전이 명시됩니다.
     * @type {string}
     */
    static version: string;
    /**
     * GeOnDT for JS  세부 버전이 명시됩니다.
     * @type {string}
     */
    static hashVersion: string;
    static copyright: string;
    /**
     * GeOnDT for JS 에 인식된 그래픽 장치 정보를 나타냅니다.
     * @type {*}
     */
    static device: any;
    /**
     * GeOnDT for JS 에 인식된 그래픽 장치 정보를 나타냅니다.
     * @type {*}
     */
    static vendor: any;
    /**
     * GeOnDT for JS 의 로그를 출력하고 제어하는 U3dMessage가 연결됩니다.
     * @type {import('@U3dMessage').U3dMessage}
     */
    static U3dMessage: U3dMessage;
    static worker: any;
    /**
     * GeOnDT for JS 의 U3dAPP객체가 연결됩니다.
     */
    static U3dAPP: typeof U3dApp;
    static UDEF: typeof UDEF;
    /**
     * GeOnDT for JS 에서 사용되는 Three객체가 연결됩니다.
     * @type {typeof import('three')}
     */
    static THREE: typeof three;
    static UDraw: typeof UDraw;
    static UMathEngine: typeof UMathEngine;
    static UDefaultSource: typeof UDefaultSource;
    static U3dEvent: {
        MOUSEWHEEL: string;
        MOUSEMOVE: string;
        MOUSEDOWN: string;
        MOUSEUP: string;
        MOUSEOUT: string;
        CLICK: string;
        DBLCLICK: string;
        KEYDOWN: string;
        START: string;
        CHANGE: string;
        END: string;
        RESIZE: string;
        CONTEXTRESTORE: string;
        APP: {
            SEARCHED: string;
            LOAD: string;
            LOADED: string;
            DISTANCE_2KM_LOADED: string;
            DISTANCE_4KM_LOADED: string;
            MODEL_LOADED: string;
            HEIGHT_LOADED: string;
            IMAGE_LOADED: string;
            MEMORY_CLEAR: string;
        };
        TILE: {
            LOAD: string;
            LOADED: string;
            MODEL_LOADED: string;
            FORCE_MODEL_LOADED: string;
            DISPOSE: string;
            COMPLETE: string;
        };
        MESH: {
            LOADED: string;
            REMOVED: string;
            UPDATE_HEIGHT_MESH: string;
            DRAWN: string;
        };
        IMAGE: {
            LOADED: string;
            REMOVED: string;
        };
    };
    static U3dMouseEvent: typeof U3dMouseEvent;
    static Gradient: typeof Gradient;
    static deferred: typeof deferred;
    static UFrustum: typeof UFrustum;
    /**
     * 파일 생성 관련 네임스페이스.
     * @memberOf GeOnDT
     * @namespace writer
     * @summary 파일 생성 관련 네임스페이스.
     */
    static writer: {
        UMeshWriter: typeof UMeshWriter;
        UOBJWriter: typeof UOBJWriter;
        UMTLWriter: typeof UMTLWriter;
        UImageWriter: typeof UImageWriter;
    };
    /**
     * 파일 파싱관련 네임스페이스. `.shp` `.dxf` `.umesh` `.sld` 포멧 제공
     * @memberOf GeOnDT
     * @namespace parser
     * @summary 파일 파싱관련 네임스페이스.
     */
    static parser: {
        UShpParser: typeof UShpParser;
        UDxfParser: typeof UDxfParser;
        UMeshParser: typeof UMeshParser;
        UOBJParser: typeof UOBJParser;
        SLDParser: {
            parse: (data: any) => {
                name: any;
                rules: any[];
            };
        };
    };
    /**
     * 파일 로더 네임스페이스. `.glb` `.gltf` 포멧 제공
     * @memberOf GeOnDT
     * @namespace loader
     * @summary 파일 로더 네임스페이스.
     */
    static loader: {
        UGLTFLoader: typeof UGLTFLoader;
        UDRACOLoader: typeof UDRACOLoader;
        UFileLoader: typeof UFileLoader;
    };
    /**
     * 3D지도 지면에 렌더링되는 `2D이미지` 레이어 관련 네임스페이스.
     * @memberOf GeOnDT
     * @namespace image
     * @summary 3D지도 지면에 렌더링되는 `2D이미지` 레이어 관련 네임스페이스.
     */
    static image: {
        U3dImageWMSLayer: typeof U3dImageWMSLayer;
        U3dImageWMTSLayer: typeof U3dImageWMTSLayer;
        U3dImageXYZLayer: typeof U3dImageXYZLayer;
        U3dImagePBFLayer: typeof U3dImagePBFLayer;
        U3dVectorPBFLayer: typeof U3dVectorPBFLayer;
        U3dPatternXYZLayer: typeof U3dPatternXYZLayer;
        U3dMeasureLayer: typeof U3dShaderMeasureLayer;
        U3dShaderMeasureLayer: typeof U3dShaderMeasureLayer;
        U2dShpLayer: typeof U2dShpLayer;
        U2dDxfLayer: typeof U2dDxfLayer;
    };
    /**
     * 3D Mesh 형태의 모델 데이터들을 지도에 투영하는 `3D모델` 레이어 관련 네임스페이스.
     * @memberOf GeOnDT
     * @namespace model
     * @summary 3D Mesh 형태의 모델 데이터들을 지도에 투영하는 `3D모델` 레이어 관련 네임스페이스.
     */
    static model: {
        U3dMultipleComponentLayer: typeof U3dMultipleComponentLayer;
        U3dModelBasicLayer: typeof U3dModelBasicLayer;
        U3dModelWFSLayer: typeof U3dModelWFSLayer;
        U3dModelU3FLayer: typeof U3dModelU3FLayer;
        U3dVideoLayer: typeof U3dVideoLayer;
        U3dModelShapeLayer: typeof U3dModelShapeLayer;
        U3dModelDxfLayer: typeof U3dModelDxfLayer;
        U3dModelTilesLayer: typeof U3dModelTilesLayer;
        U3dVectorTileLayer: typeof U3dVectorTileLayer;
        U3dModelStaticLayer: typeof U3dModelStaticLayer;
        U3dModelI3FLayer: typeof U3dModelI3FLayer;
        U3dGridTileLayer: typeof U3dGridTileLayer;
        U3dLodComponentLayer: typeof U3dLodComponentLayer;
        U3dMaskLayer: typeof U3dMaskLayer;
        U3dModelBIMObjLayer: typeof U3dModelBIMObjLayer;
    };
    /**
     * 지표면의 고도를 표출하는 `고도레이어` 관련 네임스페이스.
     * @memberOf GeOnDT
     * @namespace terrain
     * @summary 지표면의 고도를 표출하는 `고도레이어` 관련 네임스페이스.
     */
    static terrain: {
        U3dTerrainLayer: typeof U3dTerrainLayer;
        U3dHeightXYZLayer: typeof U3dHeightXYZLayer;
        UTerrainStamp: typeof UTerrainStamp;
    };
    /**
     * 벡터데이터를 2D이미지 또는 3D Mesh 형태로 가시화하는 `벡터레이어` 관련 네임스페이스.
     * @memberOf GeOnDT
     * @namespace vector
     * @summary 벡터데이터를 2D이미지 또는 3D Mesh 형태로 가시화하는 `벡터레이어` 관련 네임스페이스.
     */
    static vector: {
        U3dVectorLayer: typeof U3dVectorLayer;
        U3dModelKmlLayer: typeof U3dModelKmlLayer;
        U2dVectorLayer: typeof U2dVectorShaderLayer;
        U2dVectorShaderLayer: typeof U2dVectorShaderLayer;
    };
    /**
     * `오버레이` 관련 네임스페이스.
     * @memberOf GeOnDT
     * @namespace overlay
     * @summary 오버레이` 관련 네임스페이스.
     */
    static overlay: {
        U3dOverlay: typeof U3dOverlay;
    };
    /**
     * `카메라뷰` 및 `광원뷰` 관련 네임스페이스.
     * @memberOf GeOnDT
     * @namespace view
     * @summary `카메라뷰` 및 `광원뷰` 관련 네임스페이스.
     */
    static view: {
        U3dView: typeof U3dView;
        U3dSimpleView: typeof U3dSimpleView;
        U3dViewLight: typeof U3dViewLight;
        USpotLight: typeof USpotLight;
        UIndoorLight: typeof UIndoorLight;
    };
    /**
     * 지오메트리 관련 네임스페이스.
     * @memberOf GeOnDT
     * @namespace geom
     * @summary 지오메트리 관련 네임스페이스.
     */
    static geom: {
        U3dPoint: typeof U3dPoint;
        U3dLine: typeof U3dLine;
        U3dPOI: typeof U3dPOI;
        U2dPoint: typeof U2dPoint;
        U2dLine: typeof U2dLine;
        U2dPolygon: typeof U2dPolygon;
        U3dCylinder: typeof U3dCylinder;
        U3dBox: typeof U3dBox;
        U3dCircle: typeof U3dCircle;
        U3dSphere: typeof U3dSphere;
        U3dPipe: typeof U3dPipe;
        U3dFlowPipe: typeof U3dFlowPipe;
        U3dFault: typeof U3dFault;
        U3dUserGeometry: typeof U3dUserGeometry;
        U3dPolygonLoftGeometry: typeof U3dPolygonLoftGeometry;
        U3dPathGeometry: typeof U3dPathGeometry;
        U3dGeometryUtil: typeof U3dGeometryUtil;
        U3dFaultGeometry: typeof U3dFaultGeometry;
        U3dBilboard: typeof U3dBilboard;
        USpeedModelFilter: typeof USpeedModelFilter;
        U3dAdaptedGeometry: typeof U3dAdaptedGeometry;
        U3dHeatGeometry: typeof U3dHeatGeometry;
        U3dGeometryFactory: typeof U3dGeometryFactory;
    };
    /**
     * `측정` 및 `분석` 관련 네임스페이스.
     * @memberOf GeOnDT
     * @namespace analysis
     * @summary `측정` 및 `분석` 관련 네임스페이스.
     */
    static analysis: {
        UAnalyArea: typeof UAnalyArea;
        UAnalyDistance: typeof UAnalyDistance;
        UAnalyHeight: typeof UAnalyHeight;
        UAnalyContour: typeof UAnalyContour;
        UAnalyLandScape: typeof UAnalyLandScape;
        UAnalySurfaceVolume: typeof UAnalySurfaceVolume;
        UAnalySlope: typeof UAnalySlope;
        UAnalyObjectInfo: typeof UAnalyObjectInfo;
        UAnalyGizmoModel: typeof UAnalyGizmoModel;
        UAnalyAlignModel: typeof UAnalyAlignModel;
        UAnalyMultipleComponent: typeof UAnalyMultipleComponent;
        UAnalyRoad: typeof UAnalyRoad;
        UAnalyCustomModel: typeof UAnalyCustomModel;
        UAnalySlopeAspect: typeof UAnalySlopeAspect;
        UAnalyCustomLand: typeof UAnalyCustomLand;
        UAnalyRoute: typeof UAnalyRoute;
        UAnalyAverageHeight: typeof UAnalyAverageHeight;
        UAnalyHeightLimit: typeof UAnalyHeightLimit;
        UAnalyViewCone: typeof UAnalyViewCone;
        UAnalyClipping: typeof UAnalyClipping;
        UAnalyAlarm: typeof UAnalyAlarm;
        UAnalyDepth: typeof UAnalyDepth;
        UAnalySection: typeof UAnalySection;
        UAnalyParticle: typeof UAnalyParticle;
        UAnalySun: typeof UAnalySun;
        UAnalyPhysicalFlow: typeof UAnalyPhysicalFlow;
        UAnalySkyLine: typeof UAnalySkyLine;
    };
    /**
     * 충돌 계층 인터페이스.
     * @memberOf GeOnDT
     * @namespace collision
     * @summary Collider, CollisionWorld, Shape 어댑터 인터페이스.
     */
    static collision: {
        UCollisionManager: typeof UCollisionManager;
        UCollider: typeof UCollider;
        USphereCollider: typeof USphereCollider;
        UPolygonCollider: typeof UPolygonCollider;
        UCollisionAdapter: typeof UCollisionAdapter;
        computeBoundingIntersectionRatio: typeof computeBoundingIntersectionRatio;
        computeIntersectionRatio: typeof computeIntersectionRatio;
    };
    /**
     * 3D지도에서 마우스 조작을 통해 3D 객체를 선택하는 Select Interaction 관련 네임스페이스.
     * @memberOf GeOnDT
     * @namespace select
     * @summary 3D지도에서 마우스 조작을 통해 3D 객체를 선택하는 Select Interaction 관련 네임스페이스.
     */
    static select: {
        U3dSelect: typeof U3dSelect;
    };
    /**
     * 환경 객체 관련 네임스페이스.
     * @memberOf GeOnDT
     * @namespace env
     * @summary 환경 객체 관련 네임스페이스.
     */
    static env: {
        UWater: typeof UWater;
    };
    /**
     * 효과 객체 관련 네임스페이스.
     * @memberOf GeOnDT
     * @namespace effect
     * @summary 효과 객체 관련 네임스페이스.
     */
    static effect: {
        UParticleEngine: typeof UParticleEngine;
        UParticle: typeof UParticle;
        UDirectionArrowGroup: typeof UDirectionArrowGroup;
        U3dObjectBarrier: typeof U3dObjectBarrier;
    };
    /**
     * event 객체 관련 네임스페이스.
     * @memberOf GeOnDT
     * @namespace event
     * @summary event 객체 관련 네임스페이스.
     */
    static event: {
        U3dMouseEvent: typeof U3dMouseEvent;
    };
    /**
     * control 객체 관련 네임스페이스.
     * @memberOf GeOnDT
     * @namespace control
     * @summary control 객체 관련 네임스페이스.
     */
    static control: {
        UControls: typeof UControls;
        UFlyControls: typeof UFlyControls;
        UMapControls: typeof UMapControls;
        UWalkControls: typeof UWalkControls;
    };
    static object: {
        UMesh: typeof UMesh;
        UGroup: typeof UGroup;
        U3dCustomModel: typeof U3dCustomModel;
        UGPoint: typeof UGPoint;
        ULocalENUHelper: typeof ULocalENUHelper;
        UBox3Helper: typeof UBox3Helper;
        UClipModelFilter: typeof UClipModelFilter;
        ULandNormalDirectionHelper: typeof ULandNormalDirectionHelper;
        UGroupBoundaryHelper: typeof UGroupBoundaryHelper;
        UFrustumTerrainProjectionHelper: typeof UFrustumTerrainProjectionHelper;
        U3dCumulativePath: typeof U3dCumulativePath;
    };
    static Object: {
        UMesh: typeof UMesh;
        UGroup: typeof UGroup;
        U3dCustomModel: typeof U3dCustomModel;
        UGPoint: typeof UGPoint;
        ULocalENUHelper: typeof ULocalENUHelper;
        UBox3Helper: typeof UBox3Helper;
        UClipModelFilter: typeof UClipModelFilter;
        ULandNormalDirectionHelper: typeof ULandNormalDirectionHelper;
        UGroupBoundaryHelper: typeof UGroupBoundaryHelper;
        UFrustumTerrainProjectionHelper: typeof UFrustumTerrainProjectionHelper;
        U3dCumulativePath: typeof U3dCumulativePath;
    };
    static node: {
        U3dNodeManager: typeof U3dNodeManager;
    };
    static constant: {
        CONTROL_TYPE: {
            FIX_ANCHOR: number;
            NON_ANCHOR: number;
            FIRST_PERSON: number;
        };
        CONTROL_CASE: {
            PAN: number;
            ROTATE: number;
            ZOOM: number;
        };
        DEFAULT_CONTROL_FACTOR: {
            INTER_ZOOM_SPEED: number;
            INTER_ROTATION_SPEED: number;
            INTER_MOVE_SPEED: number;
            COLLISION_FACTOR: number;
            COLLISION_OFFSET: number;
            MIN_DISTANCE: number;
            MAX_DISTANCE: number;
            KEY_MOVE_SPEED: number;
            MOVE_SPEED: number;
            PAN_INERTIA_ENABLED: boolean;
            PAN_INERTIA_FACTOR: number;
            PAN_ANCHOR_INERTIA_FACTOR: number;
            PAN_INERTIA_DAMPING: number;
            PAN_INERTIA_MIN_SPEED: number;
            PAN_INERTIA_MAX_SPEED: number;
            PAN_INERTIA_SAMPLE_TIME: number;
            ROTATE_INERTIA_ENABLED: boolean;
            ROTATE_INERTIA_FACTOR: number;
            ROTATE_INERTIA_DAMPING: number;
            ROTATE_INERTIA_MIN_SPEED: number;
            ROTATE_INERTIA_MAX_SPEED: number;
            ROTATE_INERTIA_SAMPLE_TIME: number;
            ROTATE_SPEED: number;
            ZOOM_SPEED: number;
            ZOOM_IN_MIN_SCALE: number;
            ZOOM_OUT_MIN_SCALE: number;
            AUTO_ROTATE_SPEED: number;
            MIN_AZIMUTH_ANGLE: number;
            MAX_AZIMUTH_ANGLE: number;
            MIN_FIX_ANCHOR_POLAR_ANGLE: number;
            MIN_POLAR_ANGLE: number;
            MAX_POLAR_ANGLE: number;
            PAN_MOVE_AMOUNT_LIMIT: number;
            PAN_ANCHOR_MIN_DISTANCE: number;
            PAN_ANCHOR_MAX_DISTANCE: number;
            PAN_ANCHOR_RANGE: number;
            ROTATE_ANCHOR_RANGE: number;
            ROTATE_ANCHOR_MIN_DISTANCE: number;
            NEAR_EXCEPTION_RANGE: number;
        };
    };
    static util: {
        SnapPointToMesh: typeof snapPointToMesh;
        SnapWorldPointToMesh: typeof snapWorldPointToMesh;
    };
    static setDracoDecoderPath(path: any): void;
    static getDracoDecoderPath(): string;
    static setTransCoderPath(path: any): void;
    static getTransCoderPath(): string;
    static loadResource(): Promise<any>;
    static checkWorker(val?: number): Promise<any>;
    static setPath(rootPath: any): boolean;
    static addon(extension: any): void;
    static getNeedModule(names: any): {};
    static initWASMModule(): Promise<any>;
    static getDeviceScore(): any;
}

export type { GeOnDT };
