// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * @classdesc
 * `umesh` 파일을 javascript Object 형태로 변환하는 파서(parser) 클래스
 * @memberOf GeOnDT.parser
 * @summary `umesh` 파일을 javascript Object 형태로 변환하는 파서(parser) 클래스
 *
 */
declare class UMeshParser {
    _classtype: string;
    /**
     * umesh 파일 경로(url)를 통해 파일 데이터를 로드하고 파일을 파싱하는 함수.
     * @param path {String} 파일 경로(url)
     * @param onload {function} 파싱 완료 후 호출되는 함수
     * @param onerror {function} 파싱 오류 시 호출되는 함수
     */
    load(path: string, onload: Function, onerror: Function): void;
    loadResources(path: any, resources: any): Promise<any>;
    /**
     * umesh 파일을 입력 받아 파싱하는 함수
     * @param files {FileList | File}  umesh 파일 배열
     * @param onload {function} 파싱 완료 후 호출되는 함수
     * @return {Promise<void>} 프로미스
     */
    parse(files: FileList | File, onload: Function): Promise<void>;
    readMesh(br: any, vo: any, version: any): void;
    readString(br: any): any;
}

export type { UMeshParser };
