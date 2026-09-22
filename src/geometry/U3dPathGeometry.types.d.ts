// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dGeometryCO, U3dGeometryStyleParam, U3dOutlineAliasCO } from "./U3dGeometry.types.js";
import type { U3dPathGeometry } from "./U3dPathGeometry.js";
import type { U3dSphere } from "./U3dSphere.js";
import type { UExtrudeGeometry } from "./UExtrudeGeometry.js";
import type { GeoPositionVector3 } from "../types/global.types.js";

/**
     * ~extends import('@union3d/geometry/UExtrudeGeometry').UExtrudeGeometry <br>
     *
     * 경로 형상에 사용하는 지오메트리 타입입니다. <br>
     * `UExtrudeGeometry`에 곡선·분할·단면 정보를 담는 속성을 더한 형식입니다. <br>
     */
    type RoadBufferGeometry_Content = {
        /**
         * 곡선 장력. 0이면 제어점 사이를 직선으로 연결하며, 값이 클수록 곡선의 휘어짐이 커집니다 <br>
         */
        _tension?: number;
        /**
         * 면별(윗면·왼쪽·아랫면·오른쪽) 단면 거리 목록 (월드 좌표 길이) <br>
         */
        _sidesDistances?: Array<Array<number>>;
        /**
         * 경로 전체 너비 (월드 좌표 길이) <br>
         */
        _widthDistance: number;
        /**
         * 경로 세로 두께 (월드 좌표 길이) <br>
         */
        _heightDistance?: number;
        /**
         * 면별 생성 여부 <br>
         */
        sides?: Array<boolean>;
        /**
         * 면별 단면 정점 수 <br>
         */
        _sideSizes?: Array<number>;
        /**
         * 면별 폭 방향 분할 수 <br>
         */
        _widthSize?: Array<number>;
        /**
         * 길이 방향 분할 수 <br>
         */
        _lengthSegments?: number;
        /**
         * 길이 방향 정점 수 (`_lengthSegments` + 1) <br>
         */
        lss?: number;
        /**
         * 제어점 좌표를 `[x, y, z, ...]` 순서로 나열한 배열 <br>
         */
        _curvePoints: Array<number>;
        /**
         * 제어점을 보간한 곡선 <br>
         */
        curve: three.CatmullRomCurve3;
        /**
         * 곡선을 길이 방향으로 분할한 표본 좌표 목록 <br>
         */
        points: Array<three.Vector3>;
        /**
         * 곡선 전체 길이 (월드 좌표 길이) <br>
         */
        len?: number;
        /**
         * 표본 지점별 누적 길이 목록 <br>
         */
        lenList?: Array<number>;
        /**
         * 표본 지점별 수평 법선 벡터 <br>
         */
        normals?: Array<three.Vector3>;
        /**
         * 경로 형상 지오메트리 여부 <br>
         */
        isPath?: boolean;
        /**
         * 삼각형 면 수 <br>
         */
        faceCount?: number;
        /**
         * 정점 수 <br>
         */
        vertexCount?: number;
        /**
         * 면 인덱스 버퍼 <br>
         */
        faceIndices?: Uint32Array;
        /**
         * 정점 좌표 버퍼 <br>
         */
        vertices: Float32Array;
        /**
         * UV 좌표 버퍼 <br>
         */
        uvs?: Float32Array;
        /**
         * 경로 로컬 좌표의 기준점 <br>
         */
        _pathPivot?: three.Vector3;
    };

/**
     * ~extends import('@union3d/geometry/UExtrudeGeometry').UExtrudeGeometry <br>
     *
     * 경로 형상에 사용하는 지오메트리 타입입니다. <br>
     * `UExtrudeGeometry`에 곡선·분할·단면 정보를 담는 속성을 더한 형식입니다. <br>
     */
    type RoadBufferGeometry = UExtrudeGeometry & RoadBufferGeometry_Content;

/**
     * ~extends import('three').ShaderMaterial <br>
     * ~extends import('three').MeshBasicMaterial <br>
     *
     * 경로 재질 타입입니다. <br>
     * 셰이더 재질과 기본 재질의 속성에 색상·불투명도 복원용 원래 값을 더한 형식입니다. <br>
     */
    type PathMaterial_Content = {
        /**
         * 처음 변경하기 전의 불투명도 <br>
         */
        _oriOpacity?: number;
        /**
         * 처음 변경하기 전의 색상 <br>
         */
        _oriColor?: three.ColorRepresentation;
    };

/**
     * ~extends import('three').ShaderMaterial <br>
     * ~extends import('three').MeshBasicMaterial <br>
     *
     * 경로 재질 타입입니다. <br>
     * 셰이더 재질과 기본 재질의 속성에 색상·불투명도 복원용 원래 값을 더한 형식입니다. <br>
     */
    type PathMaterial = three.ShaderMaterial & three.MeshBasicMaterial & PathMaterial_Content;

/**
     * ~extends import('@U3dSphere').U3dSphere <br>
     *
     * 경로 편집점 구체 타입입니다. <br>
     * `U3dSphere`에 소속 경로 정보를 더한 형식입니다. <br>
     */
    type PathSphere_Content = {
        /**
         * 소속 경로 이름 <br>
         */
        _pathName?: string;
        /**
         * 편집 중 새로 추가한 점인지 여부 <br>
         */
        _isAdded?: boolean;
        /**
         * 소속 경로 <br>
         */
        _path?: U3dPathGeometry;
        /**
         * 행렬을 수동으로 갱신하도록 설정하는 메서드 <br>
         */
        setManualUpdate: () => void;
    };

/**
     * ~extends import('@U3dSphere').U3dSphere <br>
     *
     * 경로 편집점 구체 타입입니다. <br>
     * `U3dSphere`에 소속 경로 정보를 더한 형식입니다. <br>
     */
    type PathSphere = U3dSphere & PathSphere_Content;

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dPathGeometry` 생성자 옵션입니다. <br>
     * 지정한 값은 `draw()`에서 경로 속성을 생략한 항목의 기본값으로 사용됩니다. <br>
     * 도형 공통 옵션은 `U3dGeometryCO`, 외곽선 표시 옵션(`outline`과 별칭)은 `U3dOutlineAliasCO`에 정의되어 있습니다. <br>
     */
    type U3dPathGeometryCO_Content = {
        /**
         * 중심선에서 한쪽 가장자리까지의 거리 (미터). 경로 전체 너비는 이 값의 2배입니다 <br>
         */
        width?: number;
        /**
         * 좌표 높이(z)에 더할 높이 (미터). `draw()`에는 적용되지 않으며 `getParam`·`setParam`의 기준값으로 사용됩니다 <br>
         */
        minHeight?: number;
        /**
         * 세로 두께 계산에 사용하는 높이 (미터). `minheight`보다 크면 두 값의 차이, 같거나 작으면 이 값이 세로 두께입니다 <br>
         */
        maxHeight?: number;
        /**
         * `minHeight`의 별칭 <br>
         */
        minheight?: number;
        /**
         * `maxHeight`의 별칭 <br>
         */
        maxheight?: number;
        /**
         * 경로가 속한 레이어 이름 <br>
         */
        layerName?: string;
        /**
         * `layerName`의 별칭 <br>
         */
        layername?: string;
        /**
         * 곡선 장력. 0이면 제어점 사이를 직선으로 연결하며, 값이 클수록 곡선의 휘어짐이 커집니다 <br>
         */
        tension?: number;
        /**
         * 분할 기준 길이 (월드 좌표 길이, EPSG:3857). 곡선 길이를 이 값으로 나눈 수가 `segments`보다 크면 그 수를 길이 방향 분할 수로 사용합니다 <br>
         */
        dynamicSegmentValue?: number;
        /**
         * `dynamicSegmentValue`의 별칭 <br>
         */
        dynamicsegmentvalue?: number;
        /**
         * 길이 방향 최소 분할 수. 실제 분할 수는 이 값과 곡선 길이 기준 분할 수 중 큰 값(최소 10)입니다 <br>
         */
        segments?: number;
    };

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dPathGeometry` 생성자 옵션입니다. <br>
     * 지정한 값은 `draw()`에서 경로 속성을 생략한 항목의 기본값으로 사용됩니다. <br>
     * 도형 공통 옵션은 `U3dGeometryCO`, 외곽선 표시 옵션(`outline`과 별칭)은 `U3dOutlineAliasCO`에 정의되어 있습니다. <br>
     */
    type U3dPathGeometryCO = Omit<Omit<U3dGeometryCO, never> & U3dOutlineAliasCO & U3dPathGeometryCO_Content, never>;

/**
     * ~extends U3dOutlineAliasCO <br>
     *
     * `U3dPathGeometry.setParam`에 전달하는 경로 속성입니다. <br>
     * 높이 항목은 별칭을 함께 받으며, 여러 이름을 지정하면 `minheight` → `minHeight` → `height`, `maxheight` → `maxHeight` → `pathheight` 순서로 사용합니다. <br>
     */
    type U3dPathGeometrySetParam_Content = {
        /**
         * 경로 색상 <br>
         */
        color?: three.ColorRepresentation;
        /**
         * 불투명도 (0~1). 1 미만이면 투명 처리가 적용됩니다 <br>
         */
        opacity?: number;
        /**
         * 중심선에서 한쪽 가장자리까지의 거리 (미터). 경로 전체 너비는 이 값의 2배입니다 <br>
         */
        width?: number;
        /**
         * 곡선 장력. 0이면 제어점 사이를 직선으로 연결하며, 값이 클수록 곡선의 휘어짐이 커집니다 <br>
         */
        tension?: number;
        /**
         * 길이 방향 최소 분할 수 <br>
         */
        segments?: number;
        /**
         * 좌표 높이(z)에 더할 높이 (미터) <br>
         */
        minheight?: number;
        /**
         * `minheight`의 별칭 <br>
         */
        minHeight?: number;
        /**
         * `minheight`의 별칭 <br>
         */
        height?: number;
        /**
         * 세로 두께 계산에 사용하는 높이 (미터). `minheight`보다 크면 두 값의 차이, 같거나 작으면 이 값이 세로 두께입니다 <br>
         */
        maxheight?: number;
        /**
         * `maxheight`의 별칭 <br>
         */
        maxHeight?: number;
        /**
         * `maxheight`의 별칭 <br>
         */
        pathheight?: number;
    };

/**
     * ~extends U3dOutlineAliasCO <br>
     *
     * `U3dPathGeometry.setParam`에 전달하는 경로 속성입니다. <br>
     * 높이 항목은 별칭을 함께 받으며, 여러 이름을 지정하면 `minheight` → `minHeight` → `height`, `maxheight` → `maxHeight` → `pathheight` 순서로 사용합니다. <br>
     */
    type U3dPathGeometrySetParam = U3dPathGeometrySetParam_Content & Omit<U3dOutlineAliasCO, never>;

/**
     * ~extends U3dOutlineAliasCO <br>
     *
     * 경로 형상 생성 메서드(`draw`·`createPathMesh`·`createMesh`·`createMeshFromVec3`·`import`)에 전달하는 경로 속성입니다. <br>
     * 메서드마다 사용하는 항목과 기본값이 다르며, `createPathMesh`로 생성한 경로의 속성은 `export`로 저장할 수 있습니다. <br>
     */
    type PathGeometryInfo_Content = {
        /**
         * 좌표 변환과 지형 조회에 사용하는 앱(`U3dApp`). `createPathMesh`와 `createMesh`에는 필수입니다 <br>
         */
        app?: any;
        /**
         * 경로 색상 <br>
         */
        color?: three.ColorRepresentation;
        /**
         * 불투명도 (0~1). 1 미만이면 투명 처리가 적용됩니다 <br>
         */
        opacity?: number;
        /**
         * 중심선에서 한쪽 가장자리까지의 거리 (미터). 경로 전체 너비는 이 값의 2배입니다. <br>
         * `createMeshFromVec3`에서는 `buffer`의 기본값입니다 <br>
         */
        width?: number;
        /**
         * 좌표 높이(z)에 더할 높이 (미터). `createMeshFromVec3`에서는 형상 아랫면 높이(월드 좌표)입니다 <br>
         */
        minheight?: number;
        /**
         * 세로 두께 계산에 사용하는 높이 (미터). `minheight`보다 크면 두 값의 차이, 같거나 작으면 이 값이 세로 두께입니다. <br>
         * `createMeshFromVec3`에서는 형상 윗면 높이(월드 좌표)입니다 <br>
         */
        maxheight?: number;
        /**
         * 곡선 장력. 0이면 제어점 사이를 직선으로 연결하며, 값이 클수록 곡선의 휘어짐이 커집니다. <br>
         * `createPathMesh` 기본값은 0.01입니다 <br>
         */
        tension?: number;
        /**
         * 형상 생성에 사용되지 않는 항목입니다. <br>
         * 분할 기준 길이는 `setDynamicSegmentValue`로 지정합니다 <br>
         */
        dynamicSegmentValue?: number;
        /**
         * 길이 방향 최소 분할 수. `createPathMesh` 기본값은 200입니다 <br>
         */
        segments?: number;
        /**
         * 재질 투명 처리 여부. 생략하면 `opacity`가 1 미만일 때 적용됩니다 <br>
         */
        transparent?: boolean;
        /**
         * 형상 생성에 사용한 좌표 목록 (월드 좌표, EPSG:3857). `createPathMesh`가 설정합니다 <br>
         */
        points?: Array<three.Vector3>;
        /**
         * 경로 표면에 반복 적용할 이미지 URL. 지정하면 색상·외곽선 재질 대신 이미지 재질을 사용합니다 <br>
         */
        textureUrl?: string;
        /**
         * `createMesh`에서 첫 좌표 높이 기준으로 아래·위로 확장할 높이(기본값 40). `createPathMesh`에서는 `maxheight`를 생략했을 때 `minheight`에 더해 `maxheight`로 사용합니다 <br>
         */
        pathheight?: number;
        /**
         * `centerheight`를 지정했을 때 사용할 세로 두께. 생략하면 `minheight`를 사용합니다 <br>
         */
        height?: number;
        /**
         * 세로 중심 높이. 지정하면 이 값에서 세로 두께의 절반씩 아래·위로 `minheight`·`maxheight`를 설정합니다 <br>
         */
        centerheight?: number;
        /**
         * `true`이면 좌표 목록의 첫 점과 마지막 점을 제외하고 형상을 생성합니다 <br>
         */
        addstartend?: boolean;
        /**
         * `createMeshFromVec3`에서 중심선 양쪽으로 넓힐 거리 (월드 좌표 길이). 생략하면 `width`를 사용하며, `createMesh` 기본값은 400입니다 <br>
         */
        buffer?: number;
        /**
         * `createMesh`가 곡선 생성 시 전달하지만 `geopoints` 변환 결과로 대체되어 형상에는 사용되지 않는 항목입니다 <br>
         */
        pts?: Array<three.Vector3>;
        /**
         * 경로 좌표 목록 (위경도, EPSG:4326). `createMesh`가 월드 좌표로 변환해 사용합니다 <br>
         */
        geopoints?: Array<GeoPositionVector3>;
        /**
         * 다른 클래스와 주고받을 때 사용하는 불투명도 (0~1). 형상 생성에는 사용되지 않습니다 <br>
         */
        pathopacity?: number;
        /**
         * `createMesh`에서 사용하는 경로 색상 <br>
         */
        pathcolor?: string;
    };

/**
     * ~extends U3dOutlineAliasCO <br>
     *
     * 경로 형상 생성 메서드(`draw`·`createPathMesh`·`createMesh`·`createMeshFromVec3`·`import`)에 전달하는 경로 속성입니다. <br>
     * 메서드마다 사용하는 항목과 기본값이 다르며, `createPathMesh`로 생성한 경로의 속성은 `export`로 저장할 수 있습니다. <br>
     */
    type PathGeometryInfo = PathGeometryInfo_Content & Omit<U3dOutlineAliasCO, never>;

/**
     * `U3dPathGeometry.export`가 반환하는 경로 저장 정보입니다. <br>
     * `import`에 전달하면 같은 경로를 복원합니다. <br>
     */
    type U3dPathGeometryExport = {
        /**
         * 경로 형상을 다시 생성하는 데 필요한 속성 <br>
         */
        pathOption: {
            edge: boolean;
            maxheight: number;
            minheight: number;
            tension: number;
            color: three.ColorRepresentation;
            width: number;
            opacity: number;
            transparent: boolean;
            segments: number;
        };
        /**
         * 경로 좌표 목록 (월드 좌표, EPSG:3857). 경로가 보관 중인 배열이며 복사본이 아닙니다 <br>
         */
        coordinates: Array<three.Vector3>;
    };

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `U3dPathGeometry.getParam`이 반환하는 현재 속성입니다. <br>
     * 도형 공통 속성(`U3dGeometryStyleParam`)에 경로 고유 속성을 더한 형식이며, 형상이 생성된 경로의 `setParam`에 전달할 수 있습니다. <br>
     */
    type U3dPathGeometryParam_Content = {
        /**
         * 중심선에서 한쪽 가장자리까지의 거리 (미터) <br>
         */
        width: number;
        /**
         * 곡선 장력 <br>
         */
        tension: number;
        /**
         * 길이 방향 최소 분할 수 <br>
         */
        segments: number;
        /**
         * 좌표 높이(z)에 더할 높이 (미터) <br>
         */
        minheight: number;
        /**
         * 세로 두께 계산에 사용하는 높이 (미터) <br>
         */
        maxheight: number;
        /**
         * 외곽선 표시 여부 <br>
         */
        outline: boolean;
    };

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `U3dPathGeometry.getParam`이 반환하는 현재 속성입니다. <br>
     * 도형 공통 속성(`U3dGeometryStyleParam`)에 경로 고유 속성을 더한 형식이며, 형상이 생성된 경로의 `setParam`에 전달할 수 있습니다. <br>
     */
    type U3dPathGeometryParam = U3dPathGeometryParam_Content & U3dGeometryStyleParam;

export type { PathGeometryInfo, PathGeometryInfo_Content, PathMaterial, PathMaterial_Content, PathSphere, PathSphere_Content, RoadBufferGeometry, RoadBufferGeometry_Content, U3dPathGeometryCO, U3dPathGeometryCO_Content, U3dPathGeometryExport, U3dPathGeometryParam, U3dPathGeometryParam_Content, U3dPathGeometrySetParam, U3dPathGeometrySetParam_Content };
