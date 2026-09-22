// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dComponentInstancedPosition } from "./U3dComponentInstancedPosition.js";
import type { U3dComponentPosition } from "./U3dComponentPosition.js";
import type { U3dMultipleComponentLayer } from "./U3dMultipleComponentLayer.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UGroup } from "../core/UGroup.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { U3dCumulativePath_StyleOpt } from "../geometry/U3dCumulativePath.types.js";
import type { U3dPOI } from "../geometry/U3dPOI.js";
import type { U3dPathGeometry } from "../geometry/U3dPathGeometry.js";
import type { InstancedMesh2 } from "../lib/instanced_mesh_extention/core/InstancedMesh2.js";
import type { U3dOverlay } from "../overlay/U3dOverlay.js";
import type { DegreeEulerLike, Double_Array, GeoPosition, GeoPositionVector3, GooglePosition, WorldPosition, WorldPositionVector3 } from "../types/global.types.js";
import type { USpotLight } from "../view/USpotLight.js";

/**
     * 같은 모델을 한 번에 여러 개 그리는 instanced 방식 컴포넌트. `getInstancedId`로 인스턴스 index를 얻을 수 있습니다.
     */
    type InstancedComponent = U3dComponentInstancedPosition;

/**
     * RotatableGroup 회전 확장 멤버
     */
    type RotatableGroupExt = {
        rotateX?: (arg0: number) => three.Object3D;
        rotateY?: (arg0: number) => three.Object3D;
        rotateZ?: (arg0: number) => three.Object3D;
    };

/**
     * 컴포넌트 루트 객체에서 사용하는 회전 확장 타입
     */
    type RotatableGroup = three.Object3D & RotatableGroupExt;

/**
     * ComponentChildObject3D 확장 멤버
     */
    type ComponentChildExt = {
        parent: U3dComponentPosition | null;
        setParent?: (arg0: U3dComponentPosition) => void;
    };

/**
     * 컴포넌트 하위 3D 오브젝트 (Object3D + parent/setParent 확장)
     */
    type ComponentChildObject3D = three.Object3D & ComponentChildExt & InstancedComponent;

/**
     * 키-값 형태의 일반 속성 객체
     */
    type UnknownRecord = Record<string, unknown>;

/**
     * GooglePositionWithCallback 확장 멤버
     */
    type GooglePositionCallbackExt = {
        callback?: Function;
    };

/**
     * GooglePosition 타입의 callback 확장 타입
     */
    type GooglePositionWithCallback = GooglePosition & GooglePositionCallbackExt;

/**
     * 조회된 애니메이션 정보
     */
    type U3dComponentAnimationInfo = {
        /**
         * 조회된 애니메이션 ID
         */
        animationId: string;
        /**
         * 시작 애니메이션 ID
         */
        startAnimationId: string | undefined;
        /**
         * 현재 실행 여부
         */
        isRunning: boolean;
        /**
         * 현재 일시정지 여부
         */
        isPaused: boolean;
        /**
         * 현재 진행률(0~1)
         */
        rate: number;
        /**
         * 현재 속도(km/h)
         */
        speed: number;
        /**
         * 현재 속도(m/s)
         */
        speedMs: number;
        /**
         * 현재 애니메이션 총 거리
         */
        distance: number;
        /**
         * 현재 애니메이션 목표 시간(ms)
         */
        duration: number;
        /**
         * `'등속'`(speed 고정) 또는 `'변속'`(duration에 맞춰 속도 보정)
         */
        fixedSpeed: string;
        /**
         * 외부에 노출되는 누적 거리
         */
        accumulatedDistance: number;
        /**
         * 외부에 노출되는 누적 시간(ms)
         */
        accumulatedTime: number;
        /**
         * 대기 중인 waypoint 개수
         */
        waypointQueueSize?: number;
    };

/**
     * SmoothAniContext 확장 멤버
     */
    type SmoothAniContextExt = {
        useRotation: boolean;
        delayCount: number;
        count: number;
        object?: UGroup;
        instanceId?: number;
    };

/**
     * `moveSmoothly` 내부 애니메이션이 프레임 사이에 공유하는 상태 (회전 사용 여부, 지연·경과 프레임 수, 대상 오브젝트 등)
     */
    type SmoothAniContext = UnknownRecord & SmoothAniContextExt;

/**
     * PathGeometryLike geometry
     */
    type PathGeometryGeometry = {
        curve: three.CatmullRomCurve3;
        attributes?: UnknownRecord;
    };

/**
     * PathGeometryLike option
     */
    type PathGeometryOption = {
        minheight?: number;
        maxheight?: number;
        realHeight?: number;
    };

/**
     * PathGeometryLike 확장 멤버
     */
    type PathGeometryExt = {
        geometry: PathGeometryGeometry;
        _pathOption: PathGeometryOption;
    };

/**
     * 경로 지오메트리 확장 타입 (curve/_pathOption 접근용)
     */
    type PathGeometryLike = U3dPathGeometry & PathGeometryExt;

/**
     * OverlayObject 확장 멤버
     */
    type OverlayExt = {
        _shift?: three.Vector3Like;
        camera: three.Camera;
        moveViewPosition: Function;
        _controlObj: three.Object3D;
        poi?: PoiLike;
        updateLabel: Function;
    };

/**
     * 컴포넌트에 붙일 수 있는 오버레이(HTML 등 화면 요소). `setOverlay`/`getOverlay`가 다루는 타입
     */
    type OverlayObject = U3dOverlay & OverlayExt;

/**
     * LightLike 확장 멤버
     */
    type LightLikeExt = {
        id?: string | number;
        getParam?: () => UnknownRecord;
    };

/**
     * 컴포넌트에 연결되는 조명 객체 (deprecated 기능인 `getLights`/`setLights`가 다루는 타입)
     */
    type LightLike = USpotLight & LightLikeExt;

/**
     * MutableMaterial 확장 멤버
     */
    type MutableMaterialExt = {
        color?: three.Color;
        opacity?: number;
        transparent?: boolean;
        depthWrite?: boolean;
        needsUpdate?: boolean;
        map?: unknown;
        _oriMap?: unknown;
        userData?: UnknownRecord;
        dispose?: () => void;
    };

/**
     * 변경 가능한 재질 확장 타입
     */
    type MutableMaterial = three.Material & MutableMaterialExt;

/**
     * PickableObject3D 확장 멤버
     */
    type PickableObject3DExt = {
        children: Array<PickableObject3D>;
        material?: MutableMaterial | Array<MutableMaterial>;
        _oriMaterial?: MutableMaterial | Array<MutableMaterial>;
        pickMaterial?: (arg0: unknown, arg1: three.ColorRepresentation, arg2: number, arg3: MutableMaterial | undefined) => void;
        restoreMaterial?: () => boolean;
    };

/**
     * 픽킹 가능한 3D 오브젝트 확장 타입
     */
    type PickableObject3D = three.Object3D & PickableObject3DExt;

/**
     * ExtendedObject3D 확장 멤버
     */
    type ExtendedObject3DExt = {
        hide?: Function;
        show?: Function;
    };

/**
     * `setChild`로 컴포넌트 아래에 붙일 수 있는 3D 오브젝트. `UMesh` 또는 instanced 컴포넌트에 show/hide 확장이 붙은 형태
     */
    type ExtendedObject3D = UMesh & U3dComponentInstancedPosition & ExtendedObject3DExt;

/**
     * vertices 확장이 붙은 BufferGeometry
     */
    type VerticesExt = {
        vertices?: Array<three.Vector3>;
    };

/**
     * 군중 컴포넌트 polygon
     */
    type CrowdPolygonGeom = {
        intersectsCoordinate: (arg0: Array<number>) => boolean;
        getClosestPoint: (arg0: Array<number>) => Array<number>;
    };

/**
     * 군중 컴포넌트 polygon
     */
    type CrowdPolygon = {
        /**
         * polygon geometry
         */
        geom: CrowdPolygonGeom;
        getPosition?: () => Double_Array<number>;
        getCenter?: () => Array<number>;
        _height?: number;
    };

/**
     * material/_oriMaterial 확장 멤버
     */
    type MaterialableExt = {
        material?: MutableMaterial | Array<MutableMaterial>;
        _oriMaterial?: MutableMaterial | Array<MutableMaterial>;
    };

/**
     * LOD 모드가 `'custom'`일 때 매 프레임 호출되는 사용자 콜백. 컴포넌트, 속성 정보(`getProperties`), 카메라 거리(m), 카메라 거리 제곱을 받아
     * 적용할 가시화·색상·투명도·텍스처 제외 값을 `LOD_Info`로 반환합니다.
     */
    type LOD_UpdateFunc = (component: U3dComponentPosition, data: UnknownRecord, level: number, distance: number) => LOD_Info;

/**
     * `moveSmoothly`의 통과 콜백(`PassCallback`)에 전달되는 정보
     */
    type PassCallbackPayload = {
        /**
         * 컴포넌트 이름
         */
        name: string;
        /**
         * 몇 번째 통과인지 (1부터 증가)
         */
        key: number;
        /**
         * 통과 시점까지의 누적 이동 거리 (m)
         */
        distance: number;
        /**
         * 통과 시점까지의 누적 이동 시간 (ms). 애니메이션이 값을 주지 않으면 현재 시각(`Date.now()`)
         */
        time: number;
        /**
         * 통과 시점의 속도 (km/h)
         */
        speed: number;
    };

/**
     * `moveSmoothly`로 실제 도착한 지점 한 건의 이력 기록
     */
    type WaypointRecord = {
        /**
         * 도착한 월드 좌표 (EPSG:3857, m)
         */
        point: WorldPositionVector3;
        /**
         * 도착 시각 (`Date.now()` 기준 epoch ms)
         */
        time: number;
    };

/**
     * `predictFuturePositions`가 반환하는 예측 지점 한 건
     */
    type PredictedPosition = {
        /**
         * 예측된 월드 좌표 (EPSG:3857, m)
         */
        point: WorldPositionVector3;
        /**
         * 호출 시점부터 해당 지점 도착까지의 예상 경과 시간 (ms, 0 이상 정수). 평균 속도가 0이면 `Infinity`
         */
        time: number;
    };

/**
     * `moveSmoothly`로 이동 중 저장된 지점을 통과할 때마다 호출되는 콜백
     */
    type PassCallback = (data: PassCallbackPayload) => void;

/**
     * 누적 경로 표시 및 도착 콜백 상태 속성
     */
    type CumulativeProperty = {
        /**
         * 마지막 통과 인덱스
         */
        lastPass: number;
        /**
         * 통과 콜백
         */
        passCallback: PassCallback | null;
        /**
         * 좌표 정밀도
         */
        precision: number | undefined;
        /**
         * 초기 경로의 마지막 누적 정보
         */
        lastInfo: CumulativeInfo | undefined;
        /**
         * 초기화 시각
         */
        initTime: number;
        /**
         * 이동 기준 누적 거리
         */
        moveBaseDist: number;
        /**
         * 이동 시작 월드 좌표
         */
        startPosition: WorldPosition | undefined;
    };

/**
     * 중심 캐시가 붙은 Box3
     */
    type CPBox3CenterExt = {
        _center?: three.Vector3;
    };

/**
     * 중심 캐시가 붙은 Box3
     */
    type Box3WithCenter = three.Box3 & CPBox3CenterExt;

/**
     * DB & 누적 이력용 포맷
     */
    type CumulativeInfo = {
        /**
         * 월드 좌표
         */
        world: WorldPosition;
        /**
         * 위경도 좌표
         */
        geographic: GeoPosition;
        /**
         * 해당 지점의 속도 (km/h)
         */
        speed: number;
        /**
         * 지점이 속한 경로 구간 index (0부터)
         */
        sectionIndex: number;
        /**
         * 시작점부터의 누적 이동 거리 (m)
         */
        cumulativeDist: number;
        /**
         * 컴포넌트가 이미 통과한 지점이면 true
         */
        isPassed?: boolean;
        /**
         * 이전 지점부터 이 지점까지의 구간 거리 (m)
         */
        section?: number;
        /**
         * 시작부터 이 지점까지의 경과 시간 (ms)
         */
        time?: number;
    };

/**
     * 라벨/POI 최소 스펙
     */
    type PoiLike = U3dPOI & three.Object3D;

/**
     * 인스턴스 uniform의 저장 배치입니다.
     */
    type U3dComponentUniformLayout = {
        /**
         * texel당 채널 수
         */
        channels: number;
        /**
         * 인스턴스당 texel 수
         */
        pixelsPerInstance: number;
        /**
         * 항목별 위치·크기·GLSL 타입
         */
        uniformMap: Map<string, {
            offset: number;
            size: number;
            type: string;
        }>;
        /**
         * fragment 단계에서 직접 조회하는지 여부
         */
        fetchInFragmentShader: boolean;
    };

/**
     * 런타임 Uniforms 확장 모듈이 제공하는 schema 조회 경계입니다.
     */
    type U3dComponentUniformMesh = InstancedMesh2<three.BufferGeometry, three.Material | Array<three.Material>, three.Object3DEventMap> & {
        getUniformSchemaResult: (arg0: object) => U3dComponentUniformLayout;
    };

/**
     * 재질별 밝기·대비 uniform과 공유 재질의 프로그램 선택 상태입니다.
     */
    type U3dComponentColorAdjustmentMaterialState = {
        /**
         * 현재 보정 방식과 인스턴스 uniform 배치 구분값
         */
        key: string;
        /**
         * object, instance 또는 none
         */
        mode: string;
        /**
         * 밝기의 기본값 대비 차이
         */
        brightness: {
            value: number;
        };
        /**
         * 대비의 기본값 대비 차이
         */
        contrast: {
            value: number;
        };
        /**
         * 채도의 기본값 대비 차이
         */
        saturation: {
            value: number;
        };
    };

type ComponentParam = {
        /**
         * 컴포넌트 이름
         */
        name: string;
        /**
         * 컴포넌트 원본 3D 에셋 이름
         */
        object: string;
        /**
         * 컴포넌트 위경도 좌표
         */
        geoPosition: GeoPositionVector3;
        /**
         * 컴포넌트 월드 좌표 (EPSG:3857, m)
         */
        position: WorldPositionVector3;
        /**
         * 컴포넌트 크기 값
         */
        scale?: three.Vector3Like;
        /**
         * 컴포넌트 회전 값
         */
        rotation?: three.Euler | {
            x: number;
            y: number;
            z: number;
        };
        /**
         * 컴포넌트 가시화 여부
         */
        visible: boolean;
        /**
         * 컴포넌트 라벨 가시화 여부
         */
        labelVisible: boolean;
        /**
         * 컴포넌트 속성 정보
         */
        properties: UnknownRecord;
        /**
         * 컴포넌트 메시 타입 (인스턴스 메시인지 아닌지)
         */
        instanced: boolean;
        /**
         * 컴포넌트에 등록된 오버레이 객체 리스트
         */
        overlay: Array<OverlayObject>;
        /**
         * 컴포넌트에 등록된 조명의 `getParam` 결과 목록 (deprecated 기능)
         */
        lights: Array<object>;
        /**
         * 컴포넌트에 설정된 스타일 정보
         */
        style: {
            color?: three.ColorRepresentation;
            opacity?: number;
            brightness?: number;
            contrast?: number;
            depthTest?: boolean;
            depthWrite?: boolean;
            renderOrder?: number;
            saturation?: number;
        };
        /**
         * 상위 계층 컴포넌트 정보
         */
        parent: UnknownRecord;
        /**
         * 하위 계층 컴포넌트 목록
         */
        children: Array<UnknownRecord>;
        /**
         * 컴포넌트 이동 좌표.
         */
        movepointlist?: Array<GeoPosition>;
    };

/**
     * LOD 업데이트 결과 정보
     */
    type LOD_Info = {
        /**
         * 가시화 여부
         */
        visible?: boolean;
        /**
         * 색상
         */
        color?: three.ColorRepresentation;
        /**
         * 투명도
         */
        opacity?: number;
        /**
         * 텍스처 제외 여부
         */
        exceptTexture?: boolean;
        /**
         * 깊이 버퍼 쓰기 여부 <hidden>
         */
        depthWrite?: boolean;
    };

/**
     * `U3dComponentPosition` 생성자 옵션. `componentlayer`와 `position`은 필수이며 나머지는 생략 시 아래 기본값을 사용합니다. <br>
     * 좌표는 월드 좌표(EPSG:3857, m), 각도는 별도 표기가 없으면 도(°), 속도는 km/h입니다.
     */
    type U3dComponentPositionCO = {
        /**
         * 컴포넌트 이름. 생략 시 `loadedModel` 이름 또는 GUID
         */
        name?: string;
        /**
         * 컴포넌트 고유 ID. 생략 시 GUID
         */
        id?: string;
        /**
         * 컴포넌트 종류.
         */
        type?: string;
        /**
         * 화면에 그릴 3D 모델 리소스. 없으면 위치만 있는 빈 컴포넌트가 됩니다
         */
        object?: three.Object3D;
        /**
         * 모델 리소스 기본 투명도 (0 투명 ~ 1 불투명)
         */
        objectOpacity?: number;
        /**
         * 컴포넌트 밝기. 1이면 원본 상태입니다.
         */
        brightness?: number;
        /**
         * 컴포넌트 대비. 1이면 원본 상태입니다.
         */
        contrast?: number;
        /**
         * 컴포넌트 채도. 1이면 원본 상태입니다.
         */
        saturation?: number;
        /**
         * 컴포넌트 위치 (월드 좌표 EPSG:3857, m)
         */
        position: three.Vector3;
        /**
         * LOD 모드가 `'custom'`일 때 매 프레임 호출되는 콜백. 반환한 `LOD_Info`가 컴포넌트에 적용됩니다
         */
        updateFunc?: LOD_UpdateFunc;
        /**
         * 컴포넌트가 출력될 컴포넌트 레이어. 해제된 레이어면 생성이 중단됩니다
         */
        componentlayer: U3dMultipleComponentLayer;
        /**
         * 컴포넌트 경계영역(BoundingBox) 초기값. 없으면 모델에서 계산
         */
        bbox?: three.Box3 | Array<number> | null;
        /**
         * 초기 회전. `Euler`는 라디안 그대로, `{x, y, z}` 객체는 도(°)로 해석하여 변환
         */
        rotation?: three.Euler | {
            x: number;
            y: number;
            z: number;
            order: (string | undefined);
        };
        /**
         * 초기 크기 배율 `{x, y, z}`. 1이 원본 크기
         */
        scale?: three.Vector3Like;
        /**
         * 사용자 정의 속성 정보 (getProperties로 조회)
         */
        properties?: UnknownRecord;
        /**
         * 로드한 모델 리소스 이름. `name` 생략 시 이름으로 사용
         */
        loadedModel?: string;
        /**
         * 모델 파일 확장자. `'jpg'`면 항상 카메라를 향하는 이미지 컴포넌트로 취급
         */
        ext?: string;
        /**
         * 앱·씬·카메라 접근용 렌더 컨텍스트. 생략 시 레이어 값 사용
         */
        drawarg?: UDrawArg;
        /**
         * 모델 자체 애니메이션 재생 방식. `THREE.LoopRepeat`(반복) / `THREE.LoopOnce`(한 번) / `THREE.LoopPingPong`(왕복)
         */
        loop?: string | number;
        /**
         * 모델 자체 애니메이션(클립) 믹서 목록
         */
        mixers?: Array<three.AnimationMixer>;
        /**
         * 카메라 거리에 따라 클립 갱신 빈도를 자동으로 낮출지 여부
         */
        mixerAutoFps?: boolean;
        /**
         * 거리 구간별 클립 갱신 FPS 설정
         */
        mixerDistanceFpsLevels?: Array<UnknownRecord>;
        /**
         * 주행 경로 라인을 화면에 표시할지 여부
         */
        drawpath?: boolean;
        /**
         * 실제 이동 경로 메시를 표시할지 여부
         */
        drawRealPath?: boolean;
        /**
         * `'crowd'` 타입이 돌아다닐 폴리곤 영역
         */
        drawPolygon?: three.Object3D | UnknownRecord;
        /**
         * 경로 표시 타입. 현재 `'cube'`만 지원
         */
        typepath?: string;
        /**
         * 경로 라인 색상
         */
        pathColor?: three.ColorRepresentation;
        /**
         * 경로 라인 투명도 (0~1)
         */
        pathOpacity?: number;
        /**
         * `pathOpacity`의 구버전 이름. 둘 다 있으면 `pathOpacity` 우선
         */
        pathopacity?: number;
        /**
         * 주행 중 `updateAnimationFunc` 콜백을 호출하는 이동 간격 (m)
         */
        updateDistance?: number;
        /**
         * 주행 중 방향 갱신을 판단하는 기준 각도 (°)
         */
        updateAngle?: number;
        /**
         * 입력 좌표를 곡선 보정 없이 그대로 경로로 사용할지 여부
         */
        usetruthpath?: boolean;
        /**
         * 주행 애니메이션이 끝나면 처음부터 반복할지 여부
         */
        repeat?: boolean;
        /**
         * 입력 좌표를 경로의 시작/끝점으로 자동 추가할지 여부
         */
        addstartend?: boolean;
        /**
         * 경로 라인에 입힐 텍스처 이미지 URL
         */
        image?: string;
        /**
         * 주행 이동 속도 (km/h)
         */
        speed?: number;
        /**
         * 카메라를 TopView(위에서 따라가기)로 추적할 때 모델과 카메라 사이 거리 (m)
         */
        topviewdistance?: number;
        /**
         * 경로 곡선 장력 (0~1). 작을수록 완만한 곡선
         */
        curvetension?: number;
        /**
         * 경로 메시 폭 (m)
         */
        pathwidth?: number;
        /**
         * 경로 메시 외곽선 표시 여부
         */
        pathedge?: boolean;
        /**
         * 경로 메시 높이 (m)
         */
        pathHeight?: number;
        /**
         * 경로 버퍼 거리 (m)
         */
        buffer?: number;
        /**
         * 레이어가 모델에 적용한 기본 스케일. 계층 구조 계산에 사용
         */
        layerScale?: three.Vector3;
        /**
         * 레이어가 모델에 적용한 기본 회전. `rotation`이 없을 때 초기 회전으로 사용
         */
        layerRotation?: three.Euler;
        /**
         * 컴포넌트를 그릴 씬. 생략 시 레이어의 씬
         */
        scene?: three.Scene;
        /**
         * 컴포넌트에 연결할 조명 목록 (deprecated 기능)
         */
        lightList?: Array<UnknownRecord>;
        /**
         * 컴포넌트에 연결할 뷰 목록 (deprecated 기능)
         */
        viewList?: Array<UnknownRecord>;
        /**
         * 주행 중 충돌로 판정할 거리 (m)
         */
        collisiondistance?: number;
        /**
         * 충돌 감지 시 호출되는 콜백. 충돌한 컴포넌트가 전달됩니다
         */
        collisionFunction?: (self: U3dComponentPosition) => void;
        /**
         * `startAnimationFunc`의 구버전 이름 (사용 시 안내 메시지 출력)
         */
        startFnc?: (self: U3dComponentPosition) => void;
        /**
         * `updateAnimationFunc`의 구버전 이름 (사용 시 안내 메시지 출력)
         */
        updateFnc?: (self: U3dComponentPosition) => void;
        /**
         * `endAnimationFunc`의 구버전 이름 (사용 시 안내 메시지 출력)
         */
        endFnc?: (self: U3dComponentPosition) => void;
        /**
         * 주행 애니메이션 시작 시 호출되는 콜백. 컴포넌트가 전달됩니다
         */
        startAnimationFunc?: (self: U3dComponentPosition) => void;
        /**
         * 주행 중 `updateDistance`마다 호출되는 콜백. `(현재 위치, 방향 위치, 회전, 이동 거리, 총 이동 거리)`가 전달됩니다
         */
        updateAnimationFunc?: (self: U3dComponentPosition) => void;
        /**
         * 주행 애니메이션 종료 시 호출되는 콜백. 컴포넌트가 전달됩니다
         */
        endAnimationFunc?: (self: U3dComponentPosition) => void;
        /**
         * 같은 모델을 한 번에 여러 개 그리는 instanced 메시로 생성할지 여부
         */
        setInstanced?: boolean;
        /**
         * 경로 주행 시작·종료 시 호버링(수직 상승·하강) 애니메이션을 사용할지 여부
         */
        hovering?: boolean;
        /**
         * 입력 경로를 상대 좌표로 보정하지 않고 원본 좌표 그대로 사용할지 여부
         */
        useOriginRoute?: boolean;
        /**
         * 누적 경로 좌표를 기록할 때 반올림할 소수 자릿수. 생략 시 반올림하지 않음
         */
        precision?: number;
        /**
         * 주행 중 이동한 궤적(누적 경로)을 화면에 그릴지 여부
         */
        drawCumulativePath?: boolean;
        /**
         * 누적 경로 스타일 (선 타입, 색상 그라데이션, 좌표 보정 등)
         */
        pathStyle?: U3dCumulativePath_StyleOpt;
        /**
         * 카메라 거리 기반 자동 조정 방식. `'auto'`는 `maxVisibleDistance` 밖이면 숨김, `'custom'`은 `updateFunc` 결과 적용
         */
        LODMode?: "none" | "auto" | "custom";
        /**
         * `'auto'` LOD에서 컴포넌트를 표시할 카메라 최대 거리 (m)
         */
        maxVisibleDistance?: number;
    };

/**
     * moveSmoothly 주행 옵션
     */
    type MoveSmoothlyOpt = {
        /**
         * 목표 위경도 좌표. x는 경도(°), y는 위도(°), z는 고도(m)
         */
        position?: GeoPosition;
        /**
         * 이동을 예약할 때 적용할 회전각(°)
         */
        rotation?: DegreeEulerLike;
        /**
         * 회전 기준. `'absolute'`는 절대 회전, `'relative'`는 현재 회전에 대한 상대 회전
         */
        axis?: "absolute" | "relative";
        /**
         * 목표 위치까지 보간 이동할 시간(ms). 0이면 다음 프레임에 목표 위치에 도착합니다.
         * 양수이면 해당 시간 안에 도착을 보장하기 위해 이동 속도를 가변적으로 보간합니다.
         * 생략하거나 null이면 이동 거리와 설정 속도로 소요 시간을 자동 계산하여 등속 이동합니다.
         * 음수나 유한하지 않은 값이면 해당 목표를 등록하지 않습니다.
         */
        durationMs?: number | null;
    };

export type { Box3WithCenter, CPBox3CenterExt, ComponentChildExt, ComponentChildObject3D, ComponentParam, CrowdPolygon, CrowdPolygonGeom, CumulativeInfo, CumulativeProperty, ExtendedObject3D, ExtendedObject3DExt, GooglePositionCallbackExt, GooglePositionWithCallback, InstancedComponent, LOD_Info, LOD_UpdateFunc, LightLike, LightLikeExt, MaterialableExt, MoveSmoothlyOpt, MutableMaterial, MutableMaterialExt, OverlayExt, OverlayObject, PassCallback, PassCallbackPayload, PathGeometryExt, PathGeometryGeometry, PathGeometryLike, PathGeometryOption, PickableObject3D, PickableObject3DExt, PoiLike, PredictedPosition, RotatableGroup, RotatableGroupExt, SmoothAniContext, SmoothAniContextExt, U3dComponentAnimationInfo, U3dComponentColorAdjustmentMaterialState, U3dComponentPositionCO, U3dComponentUniformLayout, U3dComponentUniformMesh, UnknownRecord, VerticesExt, WaypointRecord };
