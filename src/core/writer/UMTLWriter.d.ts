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
 * @description `mtl` 파일을 생성하는 클래스
 * @memberOf GeOnDT.writer
 * @summary `mtl` 파일을 생성하는 클래스
 * @property {string} defaultName=UMTL.mtl mtl 파일 기본 이름
 *
 * @example
 * const UMTLWriter = new Union3D.writer.UMTLWriter();
 */
declare class UMTLWriter {
    static imageExporter: any;
    defaultName: string;
    /**
     * `mtl` 파일을 파싱하는 함수
     *
     * @param objects
     * @param isMergeSameImage
     * @param outputName
     * @param imageFlipY
     * @returns {Promise<UMTLWriterResult>} MTL Blob과 이미지 리소스 목록을 담은 결과로 resolve되는 프로미스
     */
    write(objects: any, isMergeSameImage: any, outputName: any, imageFlipY: any): Promise<UMTLWriterResult>;
}

/**
     * `UMTLWriter.write`가 resolve하는 MTL 파일 쓰기 결과입니다.
     */
    type UMTLWriterResult = {
        /**
         * MTL 파일 이름
         */
        name: string;
        /**
         * MTL 파일 Blob
         */
        blob: Blob;
        /**
         * MTL이 참조하는 이미지 리소스 목록
         */
        resource: Array<UMTLWriterImgResource>;
    };

/**
     * MTL 파일이 참조하는 이미지 리소스입니다.
     */
    type UMTLWriterImgResource = {
        /**
         * 이미지 이름
         */
        name: string;
        /**
         * 이미지 Blob
         */
        blob: Blob;
    };

export type { UMTLWriter, UMTLWriterImgResource, UMTLWriterResult };
