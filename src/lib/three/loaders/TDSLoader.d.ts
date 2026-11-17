// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * Autodesk 3DS three.js file loader, based on lib3ds.
 *
 * Loads geometry with uv and materials basic properties with texture support.
 *
 * @class TDSLoader
 * @constructor
 * @extends {Loader<Group>}
 */
declare class TDSLoader extends Loader<Group<three.Object3DEventMap>, string> {
    /** @param {import('three').LoadingManager} [manager] */
    constructor(manager?: three.LoadingManager);
    debug: boolean;
    group: Group<three.Object3DEventMap>;
    materials: any[];
    meshes: any[];
    /**
     * Parse arraybuffer data and load 3ds file.
     *
     * @method parse
     * @param {ArrayBuffer} arraybuffer Arraybuffer data to be loaded.
     * @param {String} path Path for external resources.
     * @return {Group} Group loaded from 3ds file.
     */
    parse(arraybuffer: ArrayBuffer, path: string): Group;
    /**
     * Decode file content to read 3ds data.
     *
     * @method readFile
     * @param {ArrayBuffer} arraybuffer Arraybuffer data to be loaded.
     * @param {String} path Path for external resources.
     */
    readFile(arraybuffer: ArrayBuffer, path: string): void;
    /**
     * Read mesh data chunk.
     *
     * @method readMeshData
     * @param {Chunk} chunk to read mesh from
     * @param {String} path Path for external resources.
     */
    readMeshData(chunk: Chunk, path: string): void;
    /**
     * Read named object chunk.
     *
     * @method readNamedObject
     * @param {Chunk} chunk Chunk in use.
     */
    readNamedObject(chunk: Chunk): void;
    /**
     * Read material data chunk and add it to the material list.
     *
     * @method readMaterialEntry
     * @param {Chunk} chunk Chunk in use.
     * @param {String} path Path for external resources.
     */
    readMaterialEntry(chunk: Chunk, path: string): void;
    /**
     * Read mesh data chunk.
     *
     * @method readMesh
     * @param {Chunk} chunk Chunk in use.
     * @return {Mesh} The parsed mesh.
     */
    readMesh(chunk: Chunk): Mesh;
    /**
     * Read face array data chunk.
     *
     * @method readFaceArray
     * @param {Chunk} chunk Chunk in use.
     * @param {Mesh} mesh Mesh to be filled with the data read.
     */
    readFaceArray(chunk: Chunk, mesh: Mesh): void;
    /**
     * Read texture map data chunk.
     *
     * @method readMap
     * @param {Chunk} chunk Chunk in use.
     * @param {String} path Path for external resources.
     * @return {import('three').Texture} Texture read from this data chunk.
     */
    readMap(chunk: Chunk, path: string): three.Texture;
    /**
     * Read material group data chunk.
     *
     * @method readMaterialGroup
     * @param {Chunk} chunk Chunk in use.
     * @return {{name: string, index: number[]}} Material name and face indices.
     */
    readMaterialGroup(chunk: Chunk): {
        name: string;
        index: number[];
    };
    /**
     * Read a color value.
     *
     * @method readColor
     * @param {Chunk} chunk Chunk.
     * @return {Color} Color value read..
     */
    readColor(chunk: Chunk): Color;
    /**
     * Read percentage value.
     *
     * @method readPercentage
     * @param {Chunk} chunk Chunk to read data from.
     * @return {Number} Data read from the dataview.
     */
    readPercentage(chunk: Chunk): number;
    /**
     * Print debug message to the console.
     *
     * Is controlled by a flag to show or hide debug messages.
     *
     * @method debugMessage
     * @param {Object} message Debug message to print to the console.
     */
    debugMessage(message: any): void;
}

/** Read data/sub-chunks from chunk */
declare class Chunk {
    /**
     * Create a new chunk
     *
     * @class Chunk
     * @param {DataView} data DataView to read from.
     * @param {Number} position in data.
     * @param {Function} debugMessage logging callback.
     */
    constructor(data: DataView, position: number, debugMessage: Function);
    data: DataView<ArrayBufferLike>;
    offset: number;
    position: number;
    debugMessage: () => void;
    id: number;
    size: number;
    end: number;
    /**
     * read a sub cchunk.
     *
     * @method readChunk
     * @return {Chunk | null} next sub chunk
     */
    readChunk(): Chunk | null;
    /**
     * return the ID of this chunk as Hex
     *
     * @method idToString
     * @return {String} hex-string of id
     */
    get hexId(): string;
    get endOfChunk(): boolean;
    /**
     * Read byte value.
     *
     * @method readByte
     * @return {Number} Data read from the dataview.
     */
    readByte(): number;
    /**
     * Read 32 bit float value.
     *
     * @method readFloat
     * @return {Number} Data read from the dataview.
     */
    readFloat(): number;
    /**
     * Read 32 bit signed integer value.
     *
     * @method readInt
     * @return {Number} Data read from the dataview.
     */
    readInt(): number;
    /**
     * Read 16 bit signed integer value.
     *
     * @method readShort
     * @return {Number} Data read from the dataview.
     */
    readShort(): number;
    /**
     * Read 64 bit unsigned integer value.
     *
     * @method readDWord
     * @return {Number} Data read from the dataview.
     */
    readDWord(): number;
    /**
     * Read 32 bit unsigned integer value.
     *
     * @method readWord
     * @return {Number} Data read from the dataview.
     */
    readWord(): number;
    /**
     * Read NULL terminated ASCII string value from chunk-pos.
     *
     * @method readString
     * @return {String} Data read from the dataview.
     */
    readString(): string;
}

export type { Chunk, TDSLoader };
