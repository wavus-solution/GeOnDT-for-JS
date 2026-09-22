// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * 텍스처 데이터 배열을 만드는 typed array 생성자입니다. <br>
 * `Float32Array`처럼 길이를 받아 배열을 만드는 표준 생성자를 넘기며, 생성자 이름으로 부동소수·부호 없는 정수 형식을 판별합니다.
 *
 * @typedef {Int8ArrayConstructor | Uint8ArrayConstructor | Uint8ClampedArrayConstructor | Int16ArrayConstructor | Uint16ArrayConstructor | Int32ArrayConstructor | Uint32ArrayConstructor | Float32ArrayConstructor | Float64ArrayConstructor} SquareDataTextureArrayConstructor
 */
/**
 * A class that extends `DataTexture` to manage a square texture optimized for instances rendering.
 * It supports dynamic resizing, partial update based on rows, and allows setting/getting uniforms per instance.
 */
declare class SquareDataTexture extends DataTexture {
    /**
     * 인스턴스 속성을 저장할 정사각형 데이터 텍스처를 생성합니다.
     *
     * @param {SquareDataTextureArrayConstructor} arrayType - 텍스처 데이터에 사용할 typed array 생성자
     * @param {number} channels - texel 하나의 채널 수
     * @param {number} pixelsPerInstance - 인스턴스 하나가 사용하는 texel 수
     * @param {number} capacity - 저장 가능한 최대 인스턴스 수
     * @param {Map} uniformMap - uniform 이름과 데이터 위치 정보
     * @param {boolean} fetchInFragmentShader - fragment shader에서 uniform 데이터를 조회할지 여부
     * @returns {SquareDataTexture} 생성된 데이터 텍스처
     */
    constructor(arrayType: SquareDataTextureArrayConstructor, channels: number, pixelsPerInstance: number, capacity: number, uniformMap: Map<any, any>, fetchInFragmentShader: boolean);
    /**
     * Whether to enable partial texture updates by row. If `false`, the entire texture will be updated.
     * @default true.
     */
    partialUpdate: boolean;
    /**
     * 한 번의 texture update에서 허용할 최대 texSubImage2D 호출 수입니다.
     * 초과한 dirty range는 사이의 작은 빈 행부터 병합해 호출 수를 제한합니다.
     * @default 8
     */
    maxUpdateCalls: number;
    /**
     * 별도 호출보다 함께 업로드하는 편이 저렴한 인접 dirty range 사이의 최대 빈 행 수입니다.
     * @default 2
     */
    maxMergeGapRows: number;
    /**
     * 병합 결과가 texture 전체 행의 이 비율 이상이면 전체 행을 한 번에 업로드합니다.
     * @default 0.8
     */
    fullUpdateRowRatio: number;
    _utils: WebGLUtils;
    _needsUpdate: boolean;
    _lastWidth: number;
    _data: any;
    _channels: number;
    _pixelsPerInstance: number;
    _stride: number;
    _rowToUpdate: Uint8Array<ArrayBuffer>;
    _rowMinXToUpdate: Uint32Array<ArrayBuffer>;
    _rowMaxXToUpdate: Uint32Array<ArrayBuffer>;
    _updateRangePool: any[];
    _activeUpdateRanges: any[];
    _fullUpdateRanges: {
        row: number;
        count: number;
        x: number;
        width: number;
    }[];
    _lastUploadStats: {
        calls: number;
        rows: number;
        pixels: number;
        ranges: number;
        width: number;
        height: number;
        full: boolean;
        usedUnpackWindow: boolean;
    };
    _uniformMap: Map<any, any>;
    _fetchUniformsInFragmentShader: boolean;
    /**
     * 인스턴스 수에 맞게 정사각형 데이터 텍스처와 CPU 배열을 확장합니다.
     * @param {number} count - 새로 수용할 인스턴스 개수
     * @returns {void}
     */
    resize(count: number): void;
    /**
     * 지정한 인스턴스가 포함된 texture 행을 다음 렌더의 갱신 대상으로 표시합니다.
     * @param {number} index - 변경된 인스턴스 ID
     * @returns {void}
     */
    enqueueUpdate(index: number): void;
    bindToProgram(renderer: any, gl: any, programUniforms: any, materialUniforms: any, uniformName: any): void;
    /**
     * dirty row를 병합해 GPU texture를 갱신합니다.
     * @param {import('three').WebGLRenderer} renderer - texture를 소유한 WebGLRenderer
     * @param {object} materialProperties - 현재 material의 renderer 내부 속성
     * @param {string} uniformName - texture가 연결된 shader uniform 이름
     */
    update(renderer: three.WebGLRenderer, materialProperties: object, uniformName: string): void;
    /**
     * 현재 material program에서 uniform이 사용하는 texture slot을 반환합니다.
     * @param {object} programUniforms - renderer program uniform map
     * @param {string} uniformName - 조회할 uniform 이름
     * @returns {number|undefined} texture slot 번호
     */
    getSlot(programUniforms: object, uniformName: string): number | undefined;
    /**
     * texture 전체 행을 한 번의 호출로 업로드합니다.
     * @param {object} textureProperties - renderer texture 속성
     * @param {object} renderer - WebGLRenderer
     * @param {number} slot - texture unit slot
     * @returns {void}
     */
    updateFull(textureProperties: object, renderer: object, slot: number): void;
    /**
     * dirty row를 제한된 range로 병합한 뒤 부분 업로드합니다.
     * @param {object} textureProperties - renderer texture 속성
     * @param {object} renderer - WebGLRenderer
     * @param {number} slot - texture unit slot
     * @returns {void}
     */
    updatePartial(textureProperties: object, renderer: object, slot: number): void;
    /**
     * 인접 dirty row를 range로 만들고 호출 제한까지 가장 작은 gap 순으로 병합합니다.
     * @returns {{row:number,count:number,x:number,width:number}[]} 이번 update에서 업로드할 행/열 범위 배열
     */
    getUpdateRowsInfo(): {
        row: number;
        count: number;
        x: number;
        width: number;
    }[];
    /**
     * 변경된 텍스처 행만 GPU에 업로드합니다.
     * @param {object} textureProperties - renderer texture 속성
     * @param {object} renderer - WebGLRenderer
     * @param {{row:number,count:number,x:number,width:number}[]} info - 업로드할 연속 행/열 범위
     * @param {number} slot - texture unit slot
     */
    updateRows(textureProperties: object, renderer: object, info: {
        row: number;
        count: number;
        x: number;
        width: number;
    }[], slot: number): void;
    /**
     * Sets a uniform value at the specified instance ID in the texture.
     * @param id The instance ID to set the uniform for.
     * @param name The name of the uniform.
     * @param value The value to set for the uniform.
     */
    setUniformAt(id: any, name: any, value: any): void;
    /**
     * Retrieves a uniform value at the specified instance ID from the texture.
     * @param id The instance ID to retrieve the uniform from.
     * @param name The name of the uniform.
     * @param target Optional target object to store the uniform value.
     * @returns The uniform value for the specified instance.
     */
    getUniformAt(id: any, name: any, target: any): any;
    /**
     * Generates the GLSL code for accessing the uniform data stored in the texture.
     * @param textureName The name of the texture in the GLSL shader.
     * @param indexName The name of the index in the GLSL shader.
     * @param indexType The type of the index in the GLSL shader.
     * @returns An object containing the GLSL code for the vertex and fragment shaders.
     */
    getUniformsGLSL(textureName: any, indexName: any, indexType: any): {
        vertex: string;
        fragment: string;
    };
    getUniformsVertexGLSL(textureName: any, indexName: any, indexType: any): string;
    getUniformsFragmentGLSL(textureName: any, indexName: any, indexType: any): string;
    texelsFetchGLSL(textureName: any, indexName: any): string;
    getFromTexelsGLSL(): string;
    getVarying(): {
        declareVarying: string;
        assignVarying: string;
        getVarying: string;
    };
    getUniformComponents(offset: any, size: any): string;
    /**
     * 다른 SquareDataTexture의 설정과 CPU 데이터를 복사합니다.
     *
     * @override
     *
     * @param {import('@InstancedMeshExtension/core/utils/SquareDataTexture').SquareDataTexture} source 복사할 원본 텍스처
     * @returns {this} 복사가 적용된 현재 텍스처
     */
    override copy(source: SquareDataTexture): this;
    #private;
}

/**
 * 텍스처 데이터 배열을 만드는 typed array 생성자입니다. <br>
 * `Float32Array`처럼 길이를 받아 배열을 만드는 표준 생성자를 넘기며, 생성자 이름으로 부동소수·부호 없는 정수 형식을 판별합니다.
 */
type SquareDataTextureArrayConstructor = Int8ArrayConstructor | Uint8ArrayConstructor | Uint8ClampedArrayConstructor | Int16ArrayConstructor | Uint16ArrayConstructor | Int32ArrayConstructor | Uint32ArrayConstructor | Float32ArrayConstructor | Float64ArrayConstructor;

export type { SquareDataTexture, SquareDataTextureArrayConstructor };
