// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/** @classdesc
 * A 3D Tiles
 *  [Tileset](https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/schema/tileset.schema.json).
 * @property {C3DTilesTypes} type - Used by 3D Tiles extensions
 * (e.g. {@link C3DTBatchTableHierarchyExtension}) to know in which context
 * (i.e. for which 3D Tiles class) the parsing of the extension should be done.
 *  @property {object} asset - Generic information about the tileset, see
 *  [asset specification]https://github.com/CesiumGS/3d-tiles/blob/master/specification/schema/asset.schema.json
 *  @property {object} properties - Properties associated with the tileset, see
 *  [tileset specification](https://github.com/CesiumGS/3d-tiles/blob/master/specification/schema/tileset.schema.json#L11)
 *  @property {number} geometricError - see [tileset
 *  specification](https://github.com/CesiumGS/3d-tiles/blob/master/specification/schema/tileset.schema.json#L18)
 *  @property {string[]} extensionsUsed - see [tileset
 *  specification](https://github.com/CesiumGS/3d-tiles/blob/master/specification/schema/tileset.schema.json#L27)
 *  @property {array} extensionsRequired - see [tileset specification](https://github.com/CesiumGS/3d-tiles/blob/master/specification/schema/tileset.schema.json#L36)
 *  @property {object[]} tiles - an array holding all the
 *  [tiles](https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/schema/tile.schema.json)
 *  (not their content which is stored in the attribute object3d of the
 *  layer). This list represents a flattened tileset.
 *  @property {object} extensions - Extensions of the tileset in the form:
 * {extensioName1: extensionObject1, extensioName2: extensionObject2, ...}
 */
declare class U3DTileset {
    static DEFAULT_UP: string;
    constructor(json: any, baseURL: any, registeredExtensions: any);
    id: any;
    refine: string;
    type: string;
    asset: any;
    properties: any;
    geometricError: any;
    extensionsUsed: any;
    extensionsRequired: any;
    children: any[];
    gltfUpAxis: any;
    extensions: any;
    /**
     * Recursion on the 3DTiles tileset (which is a tree) to parse the tiles
     * (nodes of the tree).
     * @param {object} tile - current tile
     * @param {string} baseURL - url of the source tileset and tiles
     * @param {object} parent - parent tile (used for computing the transform
     * matrix from local to global coordinates)
     * @param {object} registeredExtensions - tile is root or not
     * @param {boolean} root - 3D Tiles extensions registered
     * in the C3DTilesLayer (see {@link C3DTExtensions}
     */
    parseTiles(tile: object, baseURL: string, parent: object, registeredExtensions: object, root: boolean, gltfUpAxis?: string, basePath?: any): void;
    extendTileset(tileset: any, relativeTile: any, baseURL: any, registeredExtensions: any): any;
}

export type { U3DTileset };
