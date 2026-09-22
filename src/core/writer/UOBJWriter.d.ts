// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UOBJWriterResult } from "./UOBJWriter.types.js";

/**
 * @classdesc
 * @description `obj` 파일을 생성하는 클래스
 * @memberOf GeOnDT.writer
 * @summary `obj` 파일을 생성하는 클래스
 * @property {string} defaultName=UOBJ.obj obj 파일 기본 이름
 *
 * @example
 * const UOBJWriter = new Union3D.writer.UOBJWriter();
 */
declare class UOBJWriter {
    static mtlWriter: any;
    defaultName: string;
    /**
     * obj 파일을 생성하는 함수
     *
     * @param objects
     * @param writeInfo
     * @returns {Promise<UOBJWriterResult>} OBJ Blob과 MTL 정보를 담은 결과로 resolve되는 프로미스
     */
    write(objects: any, writeInfo: any): Promise<UOBJWriterResult>;
    parseMesh(mesh: any, output: any, indexVertex: any, indexVertexUvs: any, indexNormals: any, mtlName: any, nonMatrix?: boolean, isZUp?: boolean): {
        output: any;
        indexVertex: any;
        indexVertexUvs: any;
        indexNormals: any;
    };
    parseLine(line: any, output: any, indexVertex: any, mtlName: any, nonMatrix?: boolean, isZUp?: boolean): {
        output: any;
        indexVertex: any;
    };
    parsePoints(points: any, output: any, indexVertex: any, nonMatrix?: boolean, isZUp?: boolean): {
        output: any;
        indexVertex: any;
    };
}

export type { UOBJWriter };
