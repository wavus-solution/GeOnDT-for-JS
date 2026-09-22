// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dFaultCO, U3dFaultParam } from "./U3dFault.types.js";
import type { U3dGeometry } from "./U3dGeometry.js";
import type { U3dPOI } from "./U3dPOI.js";
import type { KeyValue, WorldPositionVector3 } from "../types/global.types.js";

/**
 * geometry 버퍼를 복원할 TypedArray의 종류 이름입니다. <br>
 * `FaultGeometryBufferDescriptor.type`의 값으로 사용합니다. <br>
 */
type FaultGeometryTypedArrayName = "Float64Array" | "Float32Array" | "Int8Array" | "Uint8Array" | "Uint8ClampedArray" | "Int16Array" | "Uint16Array" | "Int32Array" | "Uint32Array";

/**
 * geometry 버퍼를 담는 TypedArray입니다. <br>
 * `FaultGeometryTypedArrayName`이 나타내는 종류 중 하나입니다. <br>
 */
type FaultGeometryTypedArray = Float64Array | Float32Array | Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array;

/**
 * 저장 geometry의 attribute 또는 index 정보입니다. <br>
 */
type FaultGeometryBufferDescriptor = {
    /**
     * TypedArray 타입 이름 <br>
     */
    type?: FaultGeometryTypedArrayName;
    /**
     * 기존 JSON 배열 또는 TypedArray <br>
     */
    array?: ArrayLike<number>;
    /**
     * 외부 바이너리 시작 기준 바이트 위치 <br>
     */
    byteOffset?: number;
    /**
     * TypedArray의 scalar 원소 개수 <br>
     */
    count?: number;
    /**
     * vertex 하나를 구성하는 원소 개수 <br>
     */
    itemSize?: number;
    /**
     * 정수 값을 0~1 범위로 환산해 읽을지 여부 <br>
     */
    normalized?: boolean;
    /**
     * 버퍼 갱신 빈도를 나타내는 three.js 사용 힌트 값 <br>
     */
    usage?: number;
};

/**
 * geometry를 재질별로 나누는 index 구간입니다. <br>
 * 구간마다 다른 재질 번호를 지정합니다. <br>
 */
type FaultGeometryGroup = {
    /**
     * 그룹이 시작하는 index 위치 <br>
     */
    start: number;
    /**
     * 그룹이 포함하는 index 개수 <br>
     */
    count: number;
    /**
     * 이 구간에 적용할 재질의 배열 index <br>
     */
    materialIndex?: number;
};

/**
 * geometry 중 실제로 그릴 index 구간입니다. <br>
 * 정점은 그대로 두고 이 범위로 그리는 양을 조절합니다. <br>
 */
type FaultGeometryDrawRange = {
    /**
     * 그리기를 시작하는 index 위치 <br>
     */
    start: number;
    /**
     * 그릴 index 개수. `null`이면 끝까지 모두 그립니다 <br>
     */
    count: number | null;
};

/**
 * 단층 geometry 하나를 복원하는 데 필요한 정보입니다. <br>
 * `setGeometryData`의 입력이며, three.js `BufferGeometry`로 변환됩니다. <br>
 */
type FaultGeometryData = {
    /**
     * 정점 속성 버퍼 정보. `position`·`normal` 등 속성 이름을 키로 씁니다 <br>
     */
    attributes?: Record<string, FaultGeometryBufferDescriptor>;
    /**
     * 정점을 이어 삼각형을 만드는 index 버퍼 정보 <br>
     */
    index?: FaultGeometryBufferDescriptor;
    /**
     * 재질별로 나눠 그릴 구간 목록 <br>
     */
    groups?: Array<FaultGeometryGroup>;
    /**
     * 실제로 화면에 그릴 구간 <br>
     */
    drawRange?: Partial<FaultGeometryDrawRange>;
    /**
     * geometry를 구분하는 이름 <br>
     */
    name?: string;
    /**
     * geometry에 보관하는 사용자 정의 정보 <br>
     */
    userData?: object;
};

/**
 * `FaultGeometryData`와 함께 넘기는 부가 정보입니다. <br>
 * attribute와 index를 외부 바이너리에 담은 경우 그 버퍼와 변환·메타 정보를 지정합니다. <br>
 */
type FaultGeometryApplyOption = {
    /**
     * attribute/index가 저장된 외부 바이너리 <br>
     */
    binaryBuffer?: ArrayBuffer;
    /**
     * Object3D transform 정보 <br>
     */
    transform?: unknown;
    /**
     * Fault geometry 메타 정보 <br>
     */
    meta?: unknown;
};

/**
 * geometry 버퍼를 복원할 TypedArray의 종류 이름입니다. <br>
 * `FaultGeometryBufferDescriptor.type`의 값으로 사용합니다. <br>
 *
 * @memberof U3dFault
 * @inner
 *
 * @typedef {'Float64Array' | 'Float32Array' | 'Int8Array' | 'Uint8Array' | 'Uint8ClampedArray' | 'Int16Array' | 'Uint16Array' | 'Int32Array' | 'Uint32Array'} FaultGeometryTypedArrayName
 */
/**
 * geometry 버퍼를 담는 TypedArray입니다. <br>
 * `FaultGeometryTypedArrayName`이 나타내는 종류 중 하나입니다. <br>
 *
 * @memberof U3dFault
 * @inner
 *
 * @typedef {Float64Array | Float32Array | Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array} FaultGeometryTypedArray
 */
/**
 * 저장 geometry의 attribute 또는 index 정보입니다. <br>
 *
 * @memberof U3dFault
 * @inner
 *
 * @typedef {object} FaultGeometryBufferDescriptor
 * @property {FaultGeometryTypedArrayName} [type] TypedArray 타입 이름 <br>
 * @property {ArrayLike<number>} [array] 기존 JSON 배열 또는 TypedArray <br>
 * @property {number} [byteOffset] 외부 바이너리 시작 기준 바이트 위치 <br>
 * @property {number} [count] TypedArray의 scalar 원소 개수 <br>
 * @property {number} [itemSize] vertex 하나를 구성하는 원소 개수 <br>
 * @property {boolean} [normalized] 정수 값을 0~1 범위로 환산해 읽을지 여부 <br>
 * @property {number} [usage] 버퍼 갱신 빈도를 나타내는 three.js 사용 힌트 값 <br>
 */
/**
 * geometry를 재질별로 나누는 index 구간입니다. <br>
 * 구간마다 다른 재질 번호를 지정합니다. <br>
 *
 * @memberof U3dFault
 * @inner
 *
 * @typedef {object} FaultGeometryGroup
 * @property {number} start 그룹이 시작하는 index 위치 <br>
 * @property {number} count 그룹이 포함하는 index 개수 <br>
 * @property {number} [materialIndex] 이 구간에 적용할 재질의 배열 index <br>
 */
/**
 * geometry 중 실제로 그릴 index 구간입니다. <br>
 * 정점은 그대로 두고 이 범위로 그리는 양을 조절합니다. <br>
 *
 * @memberof U3dFault
 * @inner
 *
 * @typedef {object} FaultGeometryDrawRange
 * @property {number} start 그리기를 시작하는 index 위치 <br>
 * @property {number | null} count 그릴 index 개수. `null`이면 끝까지 모두 그립니다 <br>
 */
/**
 * 단층 geometry 하나를 복원하는 데 필요한 정보입니다. <br>
 * `setGeometryData`의 입력이며, three.js `BufferGeometry`로 변환됩니다. <br>
 *
 * @memberof U3dFault
 * @inner
 *
 * @typedef {object} FaultGeometryData
 * @property {Record<string, FaultGeometryBufferDescriptor>} [attributes] 정점 속성 버퍼 정보. `position`·`normal` 등 속성 이름을 키로 씁니다 <br>
 * @property {FaultGeometryBufferDescriptor} [index] 정점을 이어 삼각형을 만드는 index 버퍼 정보 <br>
 * @property {Array<FaultGeometryGroup>} [groups] 재질별로 나눠 그릴 구간 목록 <br>
 * @property {Partial<FaultGeometryDrawRange>} [drawRange] 실제로 화면에 그릴 구간 <br>
 * @property {string} [name] geometry를 구분하는 이름 <br>
 * @property {object} [userData] geometry에 보관하는 사용자 정의 정보 <br>
 */
/**
 * `FaultGeometryData`와 함께 넘기는 부가 정보입니다. <br>
 * attribute와 index를 외부 바이너리에 담은 경우 그 버퍼와 변환·메타 정보를 지정합니다. <br>
 *
 * @memberof U3dFault
 * @inner
 *
 * @typedef {object} FaultGeometryApplyOption
 * @property {ArrayBuffer} [binaryBuffer] attribute/index가 저장된 외부 바이너리 <br>
 * @property {unknown} [transform] Object3D transform 정보 <br>
 * @property {unknown} [meta] Fault geometry 메타 정보 <br>
 */
/**
 * ~extends import('@U3dGeometry') <br>
 *
 * `3D 단층(Fault)` 면을 생성·관리하는 클래스입니다. <br>
 * 윗면 좌표 배열(`topCoordinates`)과 경사각(`dip`)·폭(`width`) 등으로 단층면을 만들거나, <br>
 * 상단과 같은 개수의 `bottomCoordinates`를 제공하면 상단과 하단 사이의 높이 차에 수직 축척을 적용합니다. <br>
 * 좌표가 1개뿐이면 주향(`strike`)·길이(`length`)로 기본 단층면을 생성합니다. <br>
 * 높이에 따라 그라디언트 색상이 적용되며, 외곽선·하이라이트·라벨을 설정할 수 있습니다. <br>
 * `topCoordinates` 없이 생성하면 서버 geometry를 기다리는 빈 Fault로 유지되며, <br>
 * 서버 응답 후 `setFaultData`/`setGeometryData`로 실제 데이터를 적용할 수 있습니다. <br>
 *
 * @group geometry
 * @extends {U3dGeometry}
 */
declare class U3dFault extends U3dGeometry {
    /**
     * 첫 점, 각도, 거리(distance)를 기반으로 두 번째 점 계산 (오차 보정 포함) <br>
     *
     * @param {import('three').Vector3} startPoint 시작점 <br>
     * @param {number} strike 주향각 (deg) <br>
     * @param {number} distance 거리 (m) <br>
     * @returns {import('three').Vector3} 두 번째 점 <br>
     *
     * @ignore
     */
    static _calculateSecondPoint(startPoint: three.Vector3, strike: number, distance: number): three.Vector3;
    /**
     * 하버사인 공식을 이용한 두 점 사이 거리 계산 <br>
     *
     * @param {import('three').Vector3} point1 첫 번째 점 <br>
     * @param {import('three').Vector3} point2 두 번째 점 <br>
     * @param {number} radius 지구 반경 (m) <br>
     * @returns {number} 거리 (m) <br>
     *
     * @ignore
     */
    static _calculateHaversineDistance(point1: three.Vector3, point2: three.Vector3, radius: number): number;
    /**
     * 생성 옵션으로 단층(Fault) 면을 생성합니다. <br>
     * `app` 옵션이 없으면 생성되지 않으므로 반드시 전달해야 합니다. <br>
     * `topCoordinates`가 있으면 기존과 동일하게 즉시 단층면을 만들고, <br>
     * 없으면 id/name/properties를 몰라도 서버 geometry를 기다리는 빈 U3dFault로 생성됩니다. <br>
     * Node에서 `geometryOnly=true`를 전달하면 geometry/transform만 계산하고 material/edge는 만들지 않습니다. <br>
     *
     * @param {U3dFaultCO} [opt={}] 단층(Fault) 생성 옵션 (app 필수, 경사각·폭·주향 등) <br>
     */
    constructor(opt?: U3dFaultCO);
    /**
     * @type {*}
     *
     * @ignore
     */
    _app: any;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _needMaterial: boolean;
    /**
     * @type {Array<import('three').Color>}
     *
     * @ignore
     */
    _colors: Array<three.Color>;
    /**
     * 셰이더가 현재 색상을 보간하는 최소·최대 높이입니다. <br>
     *
     * @type {{min: number, max: number} | undefined}
     *
     * @ignore
     */
    _gradientHeightRange: {
        min: number;
        max: number;
    } | undefined;
    /**
     * 단층의 가장 높은 점에서 투명도 감소가 시작되는 실제 깊이(m)입니다. <br>
     *
     * @type {number}
     *
     * @ignore
     */
    _fadeStartDepth: number;
    /**
     * @type {Array<import('three').Vector3>}
     *
     * @ignore
     */
    _topCoordinates: Array<three.Vector3>;
    /**
     * @type {number}
     *
     * @ignore
     */
    _width: number;
    /**
     * @type {Array<import('three').Vector3>}
     *
     * @ignore
     */
    _bottomCoordinates: Array<three.Vector3>;
    /**
     * @type {number}
     *
     * @ignore
     */
    _dip: number;
    /**
     * @type {number}
     *
     * @ignore
     */
    _dtop: number;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */
    _id: string | undefined;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */
    _name: string | undefined;
    /**
     * @type {number}
     *
     * @ignore
     */
    _strike: number;
    /**
     * @type {number}
     *
     * @ignore
     */
    _planeArea: number;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */
    _sense: string | undefined;
    /**
     * @type {number}
     *
     * @ignore
     */
    _length: number;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _useline: boolean;
    /**
     * 화면 픽셀 기준 외곽 테두리 두께입니다. <br>
     *
     * @type {number}
     *
     * @ignore
     */
    _lineWidth: number;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */
    _direction: string | undefined;
    /**
     * @type {number}
     *
     * @ignore
     */
    _scaleRatio: number;
    /**
     * @type {number}
     *
     * @ignore
     */
    _renderOffset: number;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _applyHeight: boolean;
    /**
     * Node 서버 등에서 Fault 형상(BufferGeometry)만 생성할 때 사용하는 모드입니다. <br>
     * true이면 좌표/geometry/transform 계산은 수행하지만 material/edge는 생성하지 않습니다. <br>
     *
     * @type {boolean}
     *
     * @ignore
     */
    _geometryOnly: boolean;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _isFault: boolean;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _isBasic: boolean;
    /**
     * @type {import('three/examples/jsm/lines/LineSegments2.js').LineSegments2 | undefined}
     *
     * @ignore
     */
    _edgeLine: three_examples_jsm_lines_LineSegments2_js.LineSegments2 | undefined;
    /**
     * @type {import('three').Vector3 | undefined}
     *
     * @ignore
     */
    _topCenterPosition: three.Vector3 | undefined;
    /**
     * 자체적으로 Fault geometry를 생성할 수 있는 원본 좌표가 있는지 확인합니다. <br>
     * 좌표가 없으면 서버에서 geometry를 전달받기 전까지 빈 U3dFault 상태를 유지합니다. <br>
     *
     * @returns {boolean}
     *
     * @ignore
     */
    _hasFaultGeometrySource(): boolean;
    /**
     * 초기화 함수 <br>
     *
     * @ignore
     */
    _initFault(): void;
    /**
     * 꼭짓점 배열 생성 함수 <br>
     *
     * @returns {Array<import('three').Vector3> | undefined}
     *
     * @ignore
     */
    _getVertices(): Array<three.Vector3> | undefined;
    /**
     * 외곽 테두리 두께를 화면에 표시 가능한 양수 픽셀 값으로 정규화합니다. <br>
     *
     * @param {number | string | undefined} lineWidth 외곽 테두리 두께 <br>
     * @returns {number} 정규화된 화면 픽셀 두께 <br>
     *
     * @ignore
     */
    _normalizeLineWidth(lineWidth: number | string | undefined): number;
    /**
     * 단층 삼각형에서 한 번만 사용되는 경계 변으로 외곽선 지오메트리를 생성합니다. <br>
     * 같은 위치의 중복 정점을 하나로 취급하여 삼각형 분할선은 제외합니다. <br>
     *
     * @returns {import('three').BufferGeometry | undefined} 외곽선 지오메트리 <br>
     *
     * @ignore
     */
    _createBoundaryGeometry(): three.BufferGeometry | undefined;
    /**
     * 단층 내부 분할선을 제외한 외곽 테두리 선 객체를 생성합니다. <br>
     *
     * @param {number} [lineWidth] 화면 픽셀 기준 선 두께 <br>
     * @returns {import('three/examples/jsm/lines/LineSegments2.js').LineSegments2 | undefined} 외곽 테두리 객체 <br>
     *
     * @ignore
     */
    _createBoundaryLine(lineWidth?: number): three_examples_jsm_lines_LineSegments2_js.LineSegments2 | undefined;
    /**
     * 복수 좌표 기반 단층 꼭짓점 생성 함수 <br>
     *
     * @returns {Array<import('three').Vector3>}
     *
     * @ignore
     */
    _createFaultVertices(): Array<three.Vector3>;
    /**
     * 단일 좌표 기반 기본 단층 꼭짓점 생성 함수 <br>
     *
     * @returns {Array<import('three').Vector3>}
     *
     * @ignore
     */
    _createBasicFaultVertices(): Array<three.Vector3>;
    /**
     * 첫 점, 단층 경사각, 이동 거리를 기반으로 두 번째 점 계산 <br>
     *
     * @param {number} longitude 첫 점의 경도 (deg) <br>
     * @param {number} latitude 첫 점의 위도 (deg) <br>
     * @param {number} height 첫 점의 높이 (m) <br>
     * @param {number} dipAngle 단층 경사각 (deg) <br>
     * @param {number} deltaZ 첫 점과 두 번째 점 사이의 거리 (m) <br>
     * @returns {import('three').Vector3} 두 번째 점 <br>
     *
     * @ignore
     */
    _calculateFaultPoint(longitude: number, latitude: number, height: number, dipAngle: number, deltaZ: number): three.Vector3;
    /**
     * 셰이더 머터리얼 생성 함수 <br>
     *
     * @param {Array<import('three').Vector3>} vertices 꼭짓점 배열 <br>
     * @returns {import('three').ShaderMaterial | undefined}
     *
     * @ignore
     */
    _createMaterial(vertices: Array<three.Vector3>): three.ShaderMaterial | undefined;
    /**
     * 단층 높이 범위를 셰이더의 고정 크기 uniform 배열로 변환합니다. <br>
     *
     * @param {number} min 최소 로컬 높이 <br>
     * @param {number} max 최대 로컬 높이 <br>
     * @returns {Array<number>} 현재 색상 스톱과 여분 슬롯을 채운 높이 배열 <br>
     *
     * @ignore
     */
    _createGradientHeightValues(min: number, max: number): Array<number>;
    /**
     * 최종 geometry의 로컬 높이 범위와 셰이더 색상 경계를 일치시킵니다. <br>
     * 상대 좌표 변환과 렌더링 오프셋이 끝난 뒤 호출해야 합니다. <br>
     *
     * @ignore
     */
    _syncGradientHeightUniforms(): void;
    /**
     * 투명도 감소 시작 깊이를 0 이상의 미터 값으로 정규화합니다. <br>
     *
     * @param {number | string | undefined} depth 투명도 감소 시작 깊이(m) <br>
     * @returns {number} 정규화된 깊이(m) <br>
     *
     * @ignore
     */
    _normalizeFadeStartDepth(depth: number | string | undefined): number;
    /**
     * 현재 단층 위치에서 로컬 높이를 실제 미터로 변환하는 축척을 반환합니다. <br>
     *
     * @returns {number} 로컬 높이 1당 실제 미터 <br>
     *
     * @ignore
     */
    _getGradientDepthScale(): number;
    /**
     * 현재 단층의 가장 높은 점부터 최대 깊이까지를 실제 미터로 변환할 uniform 값을 생성합니다. <br>
     * 사용자 지정 최대 깊이가 시작 깊이보다 얕으면 투명도 감소를 비활성화합니다. <br>
     *
     * @returns {{enabled: boolean, startDepth: number, endDepth: number, topHeight: number, depthScale: number}} 투명도 uniform 값 <br>
     *
     * @ignore
     */
    _createDepthFadeValues(): {
        enabled: boolean;
        startDepth: number;
        endDepth: number;
        topHeight: number;
        depthScale: number;
    };
    /**
     * 현재 geometry 깊이 범위에 맞춰 투명도 감소 uniform과 재질 상태를 갱신합니다. <br>
     *
     * @ignore
     */
    _syncDepthFadeUniforms(): void;
    /**
     * 입력 색상을 단층 셰이더가 사용하는 깊이 색상 배열로 정규화합니다. <br>
     * 색상이 하나이면 같은 색상을 반복하고, 최대 개수를 초과한 색상은 사용하지 않습니다. <br>
     *
     * @param {import('three').ColorRepresentation | Array<import('three').ColorRepresentation> | undefined} colors 단일 색상, 또는 최대 깊이부터 지표 순서의 그라디언트 색상 배열 <br>
     * @returns {Array<import('three').Color>} 깊은 곳부터 지표 순서의 2~10개 색상 배열 <br>
     *
     * @ignore
     */
    _normalizeGradientColors(colors: three.ColorRepresentation | Array<three.ColorRepresentation> | undefined): Array<three.Color>;
    /**
     * 외부 데이터의 좌표 배열을 THREE.Vector3 배열로 변환합니다. <br>
     * `[x, y, z]` 및 `{x, y, z}` 형식을 모두 지원합니다. <br>
     *
     * @param {Array<*> | undefined} coordinates 좌표 배열 <br>
     * @returns {Array<import('three').Vector3>}
     *
     * @ignore
     */
    _normalizeExternalCoordinates(coordinates: Array<any> | undefined): Array<three.Vector3>;
    /**
     * JSON 배열을 BufferAttribute 타입에 맞는 TypedArray로 변환합니다. <br>
     * 이미 같은 타입의 TypedArray면 복사하지 않고 그대로 사용합니다. <br>
     * type이 없으면 vertex attribute는 Float32Array를 기본으로 사용합니다. <br>
     *
     * @param {ArrayLike<number> | null | undefined} array 데이터 배열 <br>
     * @param {FaultGeometryTypedArrayName | undefined} type TypedArray constructor 이름 <br>
     * @returns {FaultGeometryTypedArray}
     *
     * @ignore
     */
    _createExternalTypedArray(array: ArrayLike<number> | null | undefined, type: FaultGeometryTypedArrayName | undefined): FaultGeometryTypedArray;
    /**
     * 외부 바이너리 버퍼의 일부를 TypedArray view로 생성합니다. <br>
     * byteOffset은 파일 시작 기준 바이트 위치이고 count는 원소 개수입니다. <br>
     *
     * @param {ArrayBuffer} binaryBuffer geometry 바이너리 전체 버퍼 <br>
     * @param {FaultGeometryBufferDescriptor} info 바이너리 view 정보 <br>
     * @returns {FaultGeometryTypedArray}
     * @throws {Error} 타입, 범위 또는 정렬 정보가 올바르지 않은 경우
     *
     * @ignore
     */
    _createExternalBinaryTypedArray(binaryBuffer: ArrayBuffer, info: FaultGeometryBufferDescriptor): FaultGeometryTypedArray;
    /**
     * JSON 배열 또는 외부 바이너리 descriptor를 TypedArray로 해석합니다. <br>
     *
     * @param {FaultGeometryBufferDescriptor | null | undefined} info attribute 또는 index 정보 <br>
     * @param {ArrayBuffer | undefined} binaryBuffer geometry 바이너리 전체 버퍼 <br>
     * @returns {FaultGeometryTypedArray | undefined}
     * @throws {Error} 바이너리 descriptor에 필요한 버퍼가 없는 경우
     *
     * @ignore
     */
    _resolveExternalTypedArray(info: FaultGeometryBufferDescriptor | null | undefined, binaryBuffer: ArrayBuffer | undefined): FaultGeometryTypedArray | undefined;
    /**
     * 서버에서 전달된 Fault 파라미터를 현재 객체에 반영합니다. <br>
     * geometry를 다시 만들지는 않으며, 이후 setGeometryData()가 서버 geometry를 적용합니다. <br>
     *
     * @param {*} param Fault 형상/표현 파라미터 <br>
     *
     * @ignore
     */
    _applyExternalFaultParam(param: any): void;
    /**
     * 서버에서 전달된 Object3D transform을 적용합니다. <br>
     * Node geometryOnly 모드에서 계산된 local geometry를 브라우저에서 동일한 위치에 재현하기 위해 사용합니다. <br>
     *
     * @param {*} transform transform 데이터 <br>
     *
     * @ignore
     */
    _applyExternalFaultTransform(transform: any): void;
    /**
     * 서버에서 전달된 Fault geometry 메타 정보를 적용합니다. <br>
     *
     * @param {*} meta geometry 메타 정보 <br>
     *
     * @ignore
     */
    _applyExternalFaultMeta(meta: any): void;
    /**
     * 현재 geometry의 local position과 Object3D transform을 이용해 <br>
     * 기존 getVertex() 계열에서 사용할 월드 좌표 vertex 목록을 다시 구성합니다. <br>
     *
     * @ignore
     */
    _refreshWorldVerticesFromGeometry(): void;
    /**
     * 외부 geometry 적용 후 현재 U3dFault가 보관하고 있던 색상/투명도로 material을 다시 만듭니다. <br>
     * geometryOnly 모드에서는 material을 만들지 않습니다. <br>
     *
     * @ignore
     */
    _updateExternalFaultMaterial(): void;
    /**
     * 현재 geometry와 외곽선 옵션을 기준으로 외곽 테두리를 다시 생성합니다. <br>
     * geometryOnly 모드에서는 생성하지 않습니다. <br>
     *
     * @ignore
     */
    _updateExternalFaultEdge(): void;
    /**
     * 외부 geometry 데이터를 주입하기 전에 현재 U3dFaultGeometry의 Buffer 데이터를 초기화합니다. <br>
     * geometry 인스턴스 자체는 유지하므로 레이어/mesh가 가지고 있는 geometry 참조는 변경되지 않습니다. <br>
     *
     * @param {import('three').BufferGeometry} geometry 기존 U3dFaultGeometry <br>
     *
     * @ignore
     */
    _clearExternalGeometryData(geometry: three.BufferGeometry): void;
    /**
     * 직렬화된 BufferGeometry 데이터를 이 단층의 geometry에 채웁니다. <br>
     * 생성자가 만든 geometry 인스턴스를 그대로 사용하며 새로 만들지 않습니다. <br>
     * 채울 geometry가 없으면 경고를 출력하고 아무것도 하지 않습니다. <br>
     *
     * 데이터는 `attributes`·`index`·`groups`만 있으면 되고, 나머지 항목은 기본값으로 채웁니다. <br>
     * `normal` attribute가 없으면 `position`과 `index`를 적용한 뒤 정점 normal을 계산합니다. <br>
     * 적용이 끝나면 재질·외곽선·월드 정점을 갱신하므로 생성자로 만든 단층과 동일하게 사용할 수 있습니다. <br>
     *
     * attribute와 index는 두 가지 방식으로 지정합니다. <br>
     * `array`에 값을 직접 담으면 `type`이 가리키는 TypedArray로 변환하고, <br>
     * `byteOffset`과 `count`를 지정하면 `opt.binaryBuffer`를 복사 없이 참조합니다. <br>
     * 후자에서 `opt.binaryBuffer`가 없으면 예외가 발생합니다. <br>
     *
     * `opt.binaryBuffer`를 사용할 때는 `position`이 반드시 있어야 하며 `Float32Array` 또는 `Float64Array`의 `itemSize` 3이어야 하고, <br>
     * `index`는 `Uint16Array` 또는 `Uint32Array`여야 합니다. <br>
     * 조건을 벗어나면 예외가 발생하며 기존 형상은 그대로 유지됩니다. <br>
     *
     * @param {FaultGeometryData} data 직렬화된 BufferGeometry 데이터 <br>
     * @param {FaultGeometryApplyOption} [opt={}] 외부 바이너리 버퍼와 transform·meta 정보 <br>
     *
     * @example <caption>값을 배열로 직접 전달</caption>
     * fault.setGeometryData({
     *     attributes: {
     *         position: { type: 'Float32Array', itemSize: 3, array: positionValues }
     *     },
     *     index: { type: 'Uint32Array', array: indexValues },
     *     drawRange: { start: 0, count: 1200 }
     * });
     *
     * @example <caption>외부 바이너리를 복사 없이 참조</caption>
     * fault.setGeometryData({
     *     attributes: {
     *         position: { type: 'Float32Array', itemSize: 3, byteOffset: 0, count: 3600 }
     *     },
     *     index: { type: 'Uint32Array', byteOffset: 14400, count: 1200 }
     * }, { binaryBuffer });
     */
    setGeometryData(data: FaultGeometryData, opt?: FaultGeometryApplyOption): void;
    /**
     * 외부에서 읽은 Fault 한 건의 데이터를 빈 U3dFault에 한 번에 적용합니다. <br>
     *
     * Browser에서는 `new U3dFault({app, colors})`처럼 식별 정보와 형상을 모르는 상태로 먼저 생성하고, <br>
     * 저장 JSON 또는 서버 응답을 이 함수에 전달해 속성·좌표·geometry를 채울 수 있습니다. <br>
     *
     * @param {object} data 외부 Fault 데이터 <br>
     * @param {Partial<{binaryBuffer: ArrayBuffer}>} [opt={}] 외부 geometry 바이너리 옵션 <br>
     */
    setFaultData(data: object, opt?: Partial<{
        binaryBuffer: ArrayBuffer;
    }>): void;
    /**
     * 단층의 식별자를 설정합니다. <br>
     * `name`과 별개로 관리하는 값입니다. <br>
     *
     * @param {string | undefined} id 설정할 식별자. `undefined`이면 식별자를 비웁니다 <br>
     */
    setId(id: string | undefined): void;
    /**
     * 단층의 식별자를 반환합니다. <br>
     * 생성 옵션 `id` 또는 `setId`로 지정한 값입니다. <br>
     *
     * @returns {string | undefined} 단층의 식별자. 지정하지 않았으면 `undefined` <br>
     */
    getId(): string | undefined;
    /**
     * 단층의 이름을 설정합니다. <br>
     * 레이어에서 단층을 조회하는 키입니다. <br>
     *
     * @param {string | undefined} name 설정할 이름. `undefined`이면 이름을 비웁니다 <br>
     */
    setName(name: string | undefined): void;
    /**
     * 단층의 이름을 반환합니다. <br>
     * 생성 옵션 `name` 또는 `setName`으로 지정한 값입니다. <br>
     *
     * @returns {string | undefined} 단층의 이름. 지정하지 않았으면 `undefined` <br>
     */
    getName(): string | undefined;
    /**
     * 단층면을 이루는 위경도 좌표를 추가합니다. <br>
     * 기존 끝점에서 새 좌표까지 단층면이 이어지며, 좌표가 처음이면 시작점으로 설정됩니다. <br>
     *
     * @override
     *
     * @param {number} x 경도 (EPSG:4326) <br>
     * @param {number} y 위도 (EPSG:4326) <br>
     * @param {number} z 높이 (미터). 지표면이 0이며 지하는 음수입니다 <br>
     */
    override addPosition(x: number, y: number, z: number): void;
    /**
     * 단층의 가장 높은 점에서 투명도 감소가 시작되는 깊이를 설정합니다. <br>
     * 설정 깊이부터 사용자 지정 최대 깊이까지 알파가 부드럽게 감소합니다. <br>
     *
     * @param {number} depth 투명도 감소 시작 깊이(m) <br>
     */
    setFadeStartDepth(depth: number): void;
    /**
     * 단층의 가장 높은 점에서 투명도 감소가 시작되는 깊이를 반환합니다. <br>
     *
     * @returns {number} 투명도 감소 시작 깊이(m) <br>
     */
    getFadeStartDepth(): number;
    /**
     * 단층면의 속성(색상·투명도·형상 파라미터·외곽선)을 한 번에 변경합니다. <br>
     * 전달하신 값만 반영되고 나머지는 기존 값이 유지되며, 형태 관련 값을 바꾸면 단층면이 즉시 다시 생성됩니다. <br>
     * 표시 여부(visible)는 이전 상태가 그대로 유지됩니다. <br>
     *
     * @override
     *
     * @param {U3dFaultCO} [param] 변경할 속성 객체 (색상·투명도·폭·길이·경사각·주향·축척·외곽선) <br>
     */
    override setParam(param?: U3dFaultCO): void;
    /**
     * 단층면의 깊이 방향 축척을 반환합니다. <br>
     * `width`와 `dtop`에 이 값으로 나눗셈이 적용됩니다. <br>
     *
     * @returns {number} 깊이 방향 축척. `width`와 `dtop`에 나눗셈으로 적용됩니다 <br>
     */
    getScaleRatio(): number;
    /**
     * 단층면의 깊이 보정값을 반환합니다. <br>
     * 0이면 보정하지 않습니다. <br>
     *
     * @returns {number} 깊이 보정값. 0이면 보정하지 않습니다 <br>
     */
    getRenderOffset(): number;
    /**
     * 단층면의 현재 속성을 반환합니다(`setParam`과 짝을 이룹니다). <br>
     * 반환된 객체를 그대로 `setParam`에 넘기면 같은 형태를 재현할 수 있습니다. <br>
     *
     * @override
     *
     * @returns {U3dFaultParam} 폭·길이·경사각·주향·외곽선 등 현재 속성 객체 <br>
     */
    override getParam(): U3dFaultParam;
    /**
     * 리소스 해제 함수 <br>
     *
     * @ignore
     */
    dispose(): void;
    _disposed: boolean;
    /**
     * 단층면의 축척(스케일) 비율을 설정하고 지오메트리를 다시 생성합니다. <br>
     * 표시 여부(visible)는 이전 상태가 그대로 유지됩니다. <br>
     *
     * @param {number} ratio 깊이 방향 축척. `width`와 `dtop`에 나눗셈으로 적용됩니다 <br>
     */
    setScaleRatio(ratio: number): void;
    /**
     * 렌더 오프셋을 설정합니다. <br>
     * 단층면을 카메라 쪽으로 조금 당겨(또는 밀어) 다른 면과 겹칠 때 어른거림(z-fighting)을 줄이는 데 사용합니다. <br>
     *
     * @param {number} val 깊이 보정값. 미터가 아니라 셰이더 깊이 보정에 쓰는 배율입니다 <br>
     */
    setRenderOffset(val: number): void;
    /**
     * 단층 내부 분할선을 제외한 외곽 테두리 표시 여부를 설정합니다. <br>
     *
     * @param {boolean} useLine 외곽 테두리 표시 여부 <br>
     */
    setUseLine(useLine: boolean): void;
    /**
     * 단층 외곽 테두리 두께를 화면 픽셀 단위로 설정합니다. <br>
     *
     * @param {number} lineWidth 외곽 테두리 두께 (화면 픽셀). 0 이하이거나 숫자가 아니면 2를 적용합니다 <br>
     */
    setLineWidth(lineWidth: number): void;
    /**
     * 단층에 사용자 정의 속성 정보(key-value)를 설정합니다. <br>
     *
     * @override
     *
     * @param {KeyValue} properties 단층에 보관할 사용자 정의 속성. 화면 표현에는 사용하지 않습니다 <br>
     */
    override setProperties(properties: KeyValue): void;
    /**
     * 단층에 연결된 라벨(주석) 객체를 반환합니다. <br>
     *
     * @returns {import('@U3dPOI').U3dPOI | undefined} 라벨 POI 객체. 없으면 undefined <br>
     */
    getLabel(): U3dPOI | undefined;
    /**
     * 단층에 라벨(주석) 객체를 연결합니다. <br>
     * 라벨의 표시 여부는 단층의 표시 여부를 그대로 따릅니다. <br>
     *
     * @param {import('@U3dPOI').U3dPOI} label 연결할 라벨 객체. 표시 여부는 단층의 표시 여부를 따릅니다 <br>
     */
    setLabel(label: U3dPOI): void;
    /**
     * 단층면을 하이라이트(강조 표시)합니다. <br>
     * 외곽선을 켜고 지정한 색상·투명도로 바꿔, 선택되었음을 눈에 띄게 표시합니다(해제는 `resetHighLight`). <br>
     *
     * @param {import('three').ColorRepresentation} [color=0x22aa22] 하이라이트 색상. 16진수 숫자, CSS 색 문자열 또는 `THREE.Color` <br>
     * @param {number} [opacity=0.8] 하이라이트 불투명도 (0~1) <br>
     */
    setHighLight(color?: three.ColorRepresentation, opacity?: number): void;
    /**
     * 하이라이트(강조 표시)를 해제하고 원래 색상·투명도로 되돌립니다. <br>
     * 외곽선 옵션(`useline`)이 꺼져 있으면 강조용 외곽선도 함께 제거합니다. <br>
     */
    resetHighLight(): void;
    /**
     * 단층면의 색상을 설정합니다. <br>
     * 단일 색상을 주면 전체에 같은 색을, 색상 배열을 주면 높이별 그라디언트 구간에 순서대로 적용합니다. <br>
     *
     * @override
     *
     * @param {import('three').ColorRepresentation | Array<import('three').ColorRepresentation>} color 단일 색상, 또는 최대 깊이부터 지표 순서의 그라디언트 색상 배열 (2~10개) <br>
     */
    override setColor(color: three.ColorRepresentation | Array<three.ColorRepresentation>): void;
    /**
     * 단층면에 적용된 색상 배열(높이별 그라디언트 색상)을 반환합니다. <br>
     *
     * @override
     *
     * @returns {Array<import('three').Color>} 최대 깊이부터 지표 순서의 그라디언트 색상 배열. 단일 색상이면 원소 하나 <br>
     */
    override getColor(): Array<three.Color>;
    /**
     * 현재 단층면에 적용된 깊이별 색상 스톱을 반환합니다. <br>
     * 배열은 최대 깊이에서 지표 방향 순서이며, 깊이는 현재 렌더링 높이 범위를 기준으로 계산합니다. <br>
     *
     * @returns {Array<{ratio: number, depth: number, color: import('three').Color}>} 깊이 비율·깊이(m)·색상으로 구성된 범례 스톱 <br>
     */
    getDepthColorStops(): Array<{
        ratio: number;
        depth: number;
        color: three.Color;
    }>;
    /**
     * 단층면 상단의 중심점 좌표를 설정합니다. <br>
     * (라벨 위치 등 기준점으로 사용됩니다.) <br>
     *
     * @param {WorldPositionVector3} vec 중심점 좌표 (월드 좌표, EPSG:3857) <br>
     */
    setTopCenter(vec: WorldPositionVector3): void;
    /**
     * 단층면 상단의 현재 중심점 좌표를 반환합니다. <br>
     *
     * @returns {WorldPositionVector3 | undefined} 중심점 좌표 (월드 좌표, EPSG:3857) <br>
     */
    getTopCenter(): WorldPositionVector3 | undefined;
}

export type { FaultGeometryApplyOption, FaultGeometryBufferDescriptor, FaultGeometryData, FaultGeometryDrawRange, FaultGeometryGroup, FaultGeometryTypedArray, FaultGeometryTypedArrayName, U3dFault };
