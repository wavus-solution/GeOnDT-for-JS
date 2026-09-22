// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UMesh } from "../mesh/UMesh.js";
import type { UMeshWriterResult } from "./UMeshWriter.types.js";
import type { GeoPosition } from "../../types/global.types.js";

/**
 * @classdesc
 * @description `umesh` 파일을 생성하는 클래스
 * @memberOf GeOnDT.writer
 * @summary `umesh` 파일을 생성하는 클래스
 * @param {object} opt 생성자 옵션
 * @param {U3dApp} opt.app 클래스에 설정할 app
 *
 * @example
 * const UMeshWriter = new Union3D.writer.UMeshWriter({app : U3dApp});
 */
declare class UMeshWriter {
    static textEncoder: TextEncoder;
    static objExporter: any;
    static imageExporter: any;
    constructor(opt: any);
    _app: any;
    /**
     * umesh 포멧 파일을 생성하는 함수
     * @param {object[]} meshInfo 파일로 생성할 umesh 정보 배열.
     * @param {string} meshInfo.type umesh 타입 `mesh` `instanceMesh`
     * @param {string} meshInfo.name umesh 이름
     * @param {import('@UMesh').UMesh} meshInfo.items umesh 데이터
     *
     * @param {object} writeInfo  umesh 파일 쓰기 정보.
     * @param {number} [writeInfo.majorVersion=1] umesh 메인 버전
     * @param {number} [writeInfo.minorVersion=0 ]umesh 서브 버전
     * @param {string} [writeInfo.srs=world] umesh 좌표계 (umesh version 1.1 내용 : 모델 좌표면 `model`, 월드 좌표면 `world`)
     * @param {boolean} [writeInfo.imageFlipY=true] umesh 텍스쳐 이미지 Y축 반전 여부
     * @param {boolean} [writeInfo.isMergeSameImage=true] 중복 이미지 통합 여부 (ture 시 중복 이미지는 하나만 저장)
     *
     * @param {object[]} instanceInfo 파일로 생성할 instanceMesh 정보 배열.
     * @param {string} instanceInfo.name instanceMesh 이름
     * @param {string} instanceInfo.resourceName instanceMesh 생성 시 사용할 3D Object 리소스 이름
     * @param {GeoPosition} instanceInfo.position instanceMesh 좌표 (위경도)
     * @param {import('three').Vector3} instanceInfo.rotation instanceMesh 회전값
     * @param {import('three').Vector3} instanceInfo.scale instanceMesh 크기값
     * 파일로 생성할 instanceMesh 옵션 값 배열
     * @returns {Promise<UMeshWriterResult>} 작업 성공 시 UMesh Blob과 리소스 목록을 담은 결과로 resolve되는 프로미스
     *
     * @example
     * const meshes = [{
     *      type : "mesh",
     *      name : "UMesh_0",
     *      items : [UMesh1, UMesh2 ...]
     *  },
     *  {
     *      type : "instanceMesh",
     *      name : "UMesh_1",
     *      items : [UMesh1, UMesh2 ...]
     *  }];
     * const writeInfo = {imageFlipY : true};
     * const instanceInfo = [{
     *      name : "instance_1",
     *      resourceName : "UMesh_1",
     *      position : {x:  127.132, y: 37.380, z: 84},
     *      rotation : {x: 0, y: 0, z: 0},
     *      scale : {x: 1, y: 1, z: 1}
     *  }];
     *
     *  UMeshWriter.write(meshes, writeInfo, instanceInfo).then((result) =>{
     *       // umesh 파일 다운
     *       const umeshBlobUrl = URL.createObjectURL(data.umesh);
     *       downLoadBlob(fileName, umeshBlobUrl);
     *
     *        // umesh 리소스 다운
     *        const resource = data.resource
     *        resource.forEach((item)=>{
     *             downLoadBlob(fileName, resourceBlobUrl);
     *        });
     *  });
     */
    write(meshInfo: {
        type: string;
        name: string;
        items: UMesh;
    }, writeInfo: {
        majorVersion?: number;
        minorVersion?: number;
        srs?: string;
        imageFlipY?: boolean;
        isMergeSameImage?: boolean;
    }, instanceInfo: {
        name: string;
        resourceName: string;
        position: GeoPosition;
        rotation: three.Vector3;
        scale: three.Vector3;
    }): Promise<UMeshWriterResult>;
    dataToString(data: any): string;
}

export type { UMeshWriter };
