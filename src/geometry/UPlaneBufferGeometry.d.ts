// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UBufferGeometry } from "../core/geometry/UBufferGeometry.js";

/**
 * ~extends import('@UBufferGeometry') <br>
 *
 * 지형(terrain) 렌더링에 쓰이는 격자형 평면 Buffer Geometry 클래스입니다. <br>
 * 가장자리 스커트(skirt), 커스텀 높이 박스 등 지형 표현에 필요한 기능을 포함합니다. <br>
 *
 * @extends {UBufferGeometry}
 */
declare class UPlaneBufferGeometry extends UBufferGeometry {
    /** @type {Record<string, UPlaneTemplateInfo>} */
    static templateInfo: Record<string, UPlaneTemplateInfo>;
    /**
     * 주어진 크기·세그먼트에 해당하는 캐시된 템플릿 정보를 반환합니다. <br>
     *
     * @param {number} width 너비 <br>
     * @param {number} height 세로 길이 <br>
     * @param {number} widthSegments 가로 분할 수 <br>
     * @param {number} heightSegments 세로 분할 수 <br>
     * @returns {UPlaneTemplateInfo | undefined} 캐시된 템플릿 정보 (없으면 undefined) <br>
     */
    static getCache(width: number, height: number, widthSegments: number, heightSegments: number): UPlaneTemplateInfo | undefined;
    /**
     * 크기·세그먼트 값으로 캐시 키 문자열을 생성합니다. <br>
     *
     * @param {number} width 너비 <br>
     * @param {number} height 세로 길이 <br>
     * @param {number} widthSegments 가로 분할 수 <br>
     * @param {number} heightSegments 세로 분할 수 <br>
     * @returns {string} 캐시 키 <br>
     */
    static getCacheKey(width: number, height: number, widthSegments: number, heightSegments: number): string;
    /**
     * 격자형 평면 지오메트리를 생성합니다. <br>
     *
     * @param {number} [width=1] 평면 너비 <br>
     * @param {number} [height=1] 평면 세로 길이 <br>
     * @param {number} [widthSegments=1] 가로 분할 수 <br>
     * @param {number} [heightSegments=1] 세로 분할 수 <br>
     * @param {number} [offsetX=0] X 오프셋 <br>
     * @param {number} [offsetY=0] Y 오프셋 <br>
     * @param {boolean} [skirt=true] 가장자리 스커트 생성 여부 <br>
     * @param {number} [defaultHeight=UDEF.TERRAIN_NO_DATA] 높이 데이터가 없을 때 사용할 기본 높이 <br>
     */
    constructor(width?: number, height?: number, widthSegments?: number, heightSegments?: number, offsetX?: number, offsetY?: number, skirt?: boolean, defaultHeight?: number);
    /**
     * @type {string}
     *
     * @ignore
     */
    classtype: string;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */
    _uwidth: number | undefined;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */
    _uheight: number | undefined;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _skirt: boolean;
    /**
     * @type {number}
     *
     * @ignore
     */
    _offsetX: number;
    /**
     * @type {number}
     *
     * @ignore
     */
    _offsetY: number;
    /**
     * @type {import('three').Vector3}
     *
     * @ignore
     */
    _offset: three.Vector3;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */
    _segmentWidth: number | undefined;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */
    _segmentHeight: number | undefined;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */
    _maxHeight: number | undefined;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */
    _minHeight: number | undefined;
    /**
     * @type {Map<string, UPlaneCustomBox>}
     *
     * @ignore
     */
    _customBox: Map<string, UPlaneCustomBox>;
    /**
     * @type {{ width: number, height: number, widthSegments: number, heightSegments: number } | undefined}
     *
     * @ignore
     */
    parameters: {
        width: number;
        height: number;
        widthSegments: number;
        heightSegments: number;
    } | undefined;
    /**
     * 이 geometry를 다른 메시와 공유합니다. <br>
     * 소유자 수를 1 늘리고 자기 자신을 돌려주므로 생성자 인자에 바로 쓸 수 있습니다. <br>
     * 예: `super(tile._mesh.geometry.share(), material, opt)` <br>
     * 타일 메시(UTileMesh)와 이미지 레이어의 지형 메시(UTerrainMesh)가 같은 geometry 객체를 쓰므로, <br>
     * 각 소유자는 share()로 받고 dispose()로 돌려줍니다. <br>
     * 마지막 소유자가 dispose()할 때만 GL 자원이 해제됩니다. <br>
     *
     * @returns {this}
     */
    share(): this;
    /**
     * 소유자 수를 반환합니다. <br>
     * 생성 직후는 1입니다. <br>
     *
     * @returns {number}
     */
    getShareCount(): number;
    /**
     * 대상 geometry의 속성을 이 geometry에 적용합니다(attributes를 재할당하지 않고 내부 속성만 교체합니다). <br>
     *
     * @param {UPlaneBufferGeometry} targetGeometry 속성을 가져올 대상 지오메트리 <br>
     * @returns {this} 이 지오메트리(this) <br>
     */
    change(targetGeometry: UPlaneBufferGeometry): this;
    /**
     * @override
     *
     * @param {UPlaneBufferGeometry} source
     * @returns {this}
     *
     * @ignore
     */
    override copy(source: UPlaneBufferGeometry): this;
    /**
     * @override
     *
     * @returns {this}
     *
     * @ignore
     */
    override clone(): this;
    /**
     * 높이 데이터가 없을 때 사용하는 기본 높이값을 반환합니다. <br>
     *
     * @returns {number} 기본 높이값 <br>
     */
    getDefaultHeight(): number;
    /**
     * 높이 데이터가 없을 때 사용할 기본 높이값을 설정합니다. <br>
     *
     * @param {number} height 기본 높이값 <br>
     * @returns {number} 설정된 기본 높이값 <br>
     */
    setDefaultHeight(height: number): number;
    /**
     * 스커트(가장자리 여백) 인덱스를 반환합니다(스커트를 쓰지 않으면 0). <br>
     *
     * @returns {number} 스커트 인덱스 <br>
     */
    getSkirtIndex(): number;
    /**
     * 격자 해상도 비율(ratio)을 반환합니다. <br>
     *
     * @returns {number} 격자 비율 <br>
     */
    getRatio(): number;
    /**
     * 가장자리 스커트를 사용하는지 여부를 반환합니다. <br>
     *
     * @returns {boolean} 스커트 사용 여부 <br>
     */
    isSkirt(): boolean;
    /**
     * 가로 방향 정점 개수를 반환합니다. <br>
     *
     * @returns {number | undefined} 정점 개수 <br>
     */
    getSegmentCount(): number | undefined;
    /**
     * 격자 인덱스(x, y) 위치의 정점 좌표를 반환합니다. <br>
     *
     * @param {number} x 가로 인덱스 <br>
     * @param {number} y 세로 인덱스 <br>
     * @param {boolean} [includeSkirt=true] skirt 영역을 인덱스 범위에 포함할지 여부 <br>
     * @returns {{x: number, y: number, z: number} | undefined} 정점 좌표 (범위를 벗어나면 undefined) <br>
     */
    getPointAtIndex(x: number, y: number, includeSkirt?: boolean): {
        x: number;
        y: number;
        z: number;
    } | undefined;
    /**
     * 버텍스 노말 계산 <br>
     *
     * @override
     *
     * @param {number} [ratio]
     *
     * @ignore
     */
    override computeVertexNormals(ratio?: number): void;
    /**
     * 메쉬 초기화 <br>
     *
     * @param {number} width
     * @param {number} height
     * @param {number} widthSegments
     * @param {number} heightSegments
     * @param {number} [defaultHeight=UDEF.TERRAIN_NO_DATA]
     * @returns {boolean}
     *
     * @ignore
     */
    initialize(width: number, height: number, widthSegments: number, heightSegments: number, defaultHeight?: number): boolean;
    /**
     * 버텍스 배열 반환 <br>
     *
     * @returns {ArrayLike<number>}
     *
     * @ignore
     */
    getVertex(): ArrayLike<number>;
    /**
     * 커스텀 박스 설정 <br>
     *
     * @param {number} minx
     * @param {number} miny
     * @param {number} maxx
     * @param {number} maxy
     * @param {number} height
     * @param {string} id
     *
     * @ignore
     */
    setCustomBox(minx: number, miny: number, maxx: number, maxy: number, height: number, id: string): void;
    /**
     * 커스텀 박스 전체 삭제 <br>
     *
     * @ignore
     */
    clearCustomBox(): void;
    /**
     * 커스텀 박스 반환 <br>
     *
     * @param {string} [id]
     * @returns {UPlaneCustomBox | Map<string, UPlaneCustomBox> | undefined}
     *
     * @ignore
     */
    getCustomBox(id?: string): UPlaneCustomBox | Map<string, UPlaneCustomBox> | undefined;
    /**
     * 커스텀 박스 삭제 <br>
     *
     * @param {string} boxId
     *
     * @ignore
     */
    removeCustomBox(boxId: string): void;
    /**
     * 커스텀 박스 포함 여부 <br>
     *
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     *
     * @ignore
     */
    isIncludeCustomBox(x: number, y: number): boolean;
    /**
     * 평면의 오프셋(원점 이동값)을 반환합니다. <br>
     *
     * @returns {import('three').Vector3} 오프셋 벡터 <br>
     */
    getOffset(): three.Vector3;
    /**
     * 오프셋이 적용된 바운딩 박스를 반환합니다. <br>
     *
     * @returns {import('three').Box3} 오프셋이 적용된 바운딩 박스 <br>
     */
    getOffsetBox(): three.Box3;
    /**
     * 메쉬 생성 (내부 함수) <br>
     *
     * @param {number} width
     * @param {number} height
     * @param {number} widthSegments
     * @param {number} heightSegments
     * @param {number} [defaultHeight=UDEF.TERRAIN_NO_DATA]
     *
     * @ignore
     */
    _createMesh(width: number, height: number, widthSegments: number, heightSegments: number, defaultHeight?: number): void;
    #private;
}

/**
     * templateInfo 캐시에 저장되는 데이터 구조 <br>
     */
    type UPlaneTemplateInfo = {
        indices: Array<number>;
        vertices: Array<number>;
        normals: Array<number>;
        uvs: Array<number>;
        uwidth: number;
        uheight: number;
        segmentWidth: number;
        segmentHeight: number;
        boundingBox: three.Box3;
    };

/**
     * customBox에 저장되는 데이터 구조 <br>
     */
    type UPlaneCustomBox = {
        minx: number;
        miny: number;
        maxx: number;
        maxy: number;
        height: number;
    };

export type { UPlaneBufferGeometry, UPlaneCustomBox, UPlaneTemplateInfo };
