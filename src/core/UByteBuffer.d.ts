// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class UByteBuffer {
    /**
     * Access the underlying data in big endian order, where the most significant bits of the data are encountered first.
     * @type {Boolean}
     * @constant
     */
    static BIG_ENDIAN: boolean;
    /**
     * Access the underlying data in little endian order, where the least significant bits of the data are encountered first.
     * @type {Boolean}
     * @constant
     */
    static LITTLE_ENDIAN: boolean;
    /**
     * The size of a byte.
     * @type {Number}
     * @constant
     */
    static BYTE_SIZE: number;
    static UNIT8_SIZE: number;
    /**
     * The size of a 16-bit integer.
     * @type {Number}
     * @constant
     */
    static INT16_SIZE: number;
    /**
     * The size of a 32-bit integer.
     * @type {Number}
     * @constant
     */
    static INT32_SIZE: number;
    /**
     * The size of a single precision floating point number.
     * @type {Number}
     * @constant
     */
    static FLOAT_SIZE: number;
    /**
     * The size of a double precision floating point number.
     * @type {Number}
     * @constant
     */
    static DOUBLE_SIZE: number;
    static textEncoder: TextEncoder;
    constructor(array: any);
    array: any;
    /**
     * A data view on the array buffer.
     * This data view is used to extract integer and floating point data from that array buffer.
     * @type {DataView}
     */
    data: DataView;
    /**
     * The current position in the array buffer.
     * This position is implicitly used to access all data.
     * @type {Number}
     */
    position: number;
    /**
     * The byte order in which the data is encoded.
     * Byte order will either be big endian or little endian.
     * @type {Boolean}
     * @default ByteByffer.LITTLE_ENDIAN
     * @private
     */
    private _order;
    /**
     * Get a byte from the current position and advance the position.
     * @returns {Number}
     */
    getByte(): number;
    getStringIntSize(): any;
    /**
     * Get a byte array from the current position and advance the position.
     * To avoid secondary allocation, a TypedArray shadows the underlying ArrayBuffer.
     * @param {Number} numBytes The number of bytes in the desired array.
     * @returns {Uint8Array}
     */
    getByteArray(numBytes: number): Uint8Array;
    /**
     * Get a 16-bit integer from the current position and advance the position.
     * @returns {Number}
     */
    getInt16(): number;
    /**
     * Get a 16-bit integer from the current position and advance the position.
     * @returns {Number}
     */
    getUint16(): number;
    /**
     * Get a 16-bit integer array from the current position and advance the position.
     * To avoid secondary allocation, a TypedArray shadows the underlying ArrayBuffer.
     * @param {Number} numInt16s The number of 16-bit integers in the desired array.
     * @returns {Int16Array}
     */
    getInt16Array(numInt16s: number): Int16Array;
    /**
     * Get a 16-bit integer array from the current position and advance the position.
     * To avoid secondary allocation, a TypedArray shadows the underlying ArrayBuffer.
     * @param {Number} numInt16s The number of 16-bit integers in the desired array.
     * @returns {Int16Array}
     */
    getUint16Array(numInt16s: number): Int16Array;
    getUint32Array(numInt32s: any): Uint32Array<any>;
    /**
     * Get a 32-bit integer from the current position and advance the position.
     * @returns {Number}
     */
    getInt32(): number;
    /**
     * Get a 32-bit integer from the current position and advance the position.
     * @returns {Number}
     */
    getUint32(): number;
    /**
     * Get a single precision floating point array from the current position and advance the position.
     * To avoid secondary allocation, a TypedArray shadows the underlying ArrayBuffer.
     * @param {Number} numInt32s The number of 32-bit integers in the desired array.
     * @returns {Int32Array}
     */
    getInt32Array(numInt32s: number): Int32Array;
    /**
     * Get a single precision floating point number from the current position and advance the position.
     * @returns {Number}
     */
    getFloat(): number;
    /**
     * Get a single precision floating point array from the current position and advance the position.
     * To avoid secondary allocation, a TypedArray shadows the underlying ArrayBuffer.
     * @param {Number} numFloats The number of single precision floating point numbers in the desired array.
     * @returns {Float32Array}
     */
    getFloatArray(numFloats: number): Float32Array;
    /**
     * Get a double precision floating point number from the current position and advance the position.
     * @returns {Number}
     */
    getDouble(): number;
    /**
     * Get a single precision floating point array from the current position and advance the position.
     * To avoid secondary allocation, a TypedArray shadows the underlying ArrayBuffer.
     * @param {Number} numDoubles The number of double precision floating point numbers in the desired array.
     * @returns {Float64Array}
     */
    getDoubleArray(numDoubles: number): Float64Array;
    /**
     * Skip over the specified number of bytes.
     * @param {Number} numBytes The number of bytes to skip.
     */
    skipBytes(numBytes: number): void;
    /**
     * Skip over the specified number of 16-bit integers.
     * @param {Number} numInt16s The number of 16-bit integers to skip.
     */
    skipInt16s(numInt16s: number): void;
    /**
     * Skip over the specified number of 32-bit integers.
     * @param {Number} numInt32s The number of 32-bit integers to skip.
     */
    skipInt32s(numInt32s: number): void;
    /**
     * Skip over the specified number of single precision floating point numbers.
     * @param {Number} numFloats The number of single precision floating point numbers to skip.
     */
    skipFloats(numFloats: number): void;
    /**
     * Skip over the specified number of double precision floating point numbers.
     * @param {Number} numDoubles The number of double precision floating point numbers to skip.
     */
    skipDoubles(numDoubles: number): void;
    /**
     * Advance to a specific position.
     * @param {Number} position The specified position.
     */
    seek(position: number): void;
    /**
     * Set the byte order of the underlying data.
     * @param {Boolean} order The byte order of the underlying data.
     */
    order(order: boolean): void;
    /**
     * Return the total size of the underlying data.
     * @returns {Number} The size of the underlying data.
     */
    limit(): number;
    /**
     * Indicates whether there remains any data to be accessed sequentially.
     * @returns {Boolean} True if more data can be accessed sequentially.
     */
    hasRemaining(): boolean;
    setString(offset: any, string: any): any;
    setByte(offset: any, value: any): any;
    setInt16(offset: any, value: any): any;
    setInt32(offset: any, value: any): any;
    setFloat32(offset: any, value: any): any;
    setDouble(offset: any, value: any): any;
    getPoint(): {
        x: number;
        y: number;
        z: number;
    };
    getVector2(): three.Vector2;
    getVector3(isChangeY?: boolean): three.Vector3;
    getColor(): {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    getUGeoRect(): any;
    getProperties(): {};
}

export type { UByteBuffer };
