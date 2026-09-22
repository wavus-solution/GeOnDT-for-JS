// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UGPoint } from "./UGPoint.js";

/**
 * @memberof Object
 * @constructor
 * @classdesc
 * 3차원 영역을 나타내는 사각형 <br>
 * 좌측 하단/상단, 우측 하단/상단 네개의 3차원 좌표를 가지고 사각형을 나타낸다.<br>
 * @param {import('three').Vector3} [ptLeftTop] 좌측 상단 좌표
 * @summary 3차원 영역을 나타내는 사각형
 * @param {import('three').Vector3} [ptRightTop] 우측 상단 좌표
 * @param {import('three').Vector3} [ptLeftBottom] 좌측 히단 좌표
 * @param {import('three').Vector3} [ptRightBottom] 우측 하단 좌표
 * @param {number} [nWidth=0] 사각형 가로 너비
 * @param {number} [nHeight=0] 사각형 세로 너비
 * @param {string} [nModel='0'] 좌표계 (ex : epsg:3857)
 */
declare class UGeoRect {
    static createUGeoRect(minx: any, miny: any, maxx: any, maxy: any, width: any, height: any, modelname: any): UGeoRect;
    constructor(ptLeftTop: any, ptRightTop: any, ptLeftBottom: any, ptRightBottom: any, nWidth: any, nHeight: any, nModel: any, nUtmZone: any);
    isUGeoRect: boolean;
    nModel: any;
    nUtmZone: any;
    nWidth: any;
    nHeight: any;
    ptLeftTop: any;
    ptRightTop: any;
    ptLeftBottom: any;
    ptRightBottom: any;
    getBox(box3: any): any;
    isValid(): any;
    /**
     * 사각형 인수의 숫자 값을 정수로 변환하는 함수
     */
    truncate(): void;
    /**
     * 사각형 인수의 숫자 값을 반올림하는 함수
     */
    round(): void;
    /**
     * 사각형 인수의 숫자 값을 올림하는 함수
     */
    ceil(): void;
    /**
     * 입력 받은 사각형의 값으로 기존 사각형의 인수 값을 복사 하는 함수
     * @param {import('@UGeoRect').UGeoRect} srcRect 복사 할 사각형
     */
    copy(srcRect: UGeoRect): UGeoRect;
    /**
     * 사각형을 복제하는 함수
     * @return {import('@UGeoRect').UGeoRect} 복제된 사각형
     */
    clone(): UGeoRect;
    toString(): void;
    centerMap(): any;
    intersectsBox(boundingbox: any): boolean;
    boundingbox_: any;
    intersects(rect: any): boolean;
    contain(geoX: any, geoY: any): boolean;
    /**
     * 이미지 좌표 -> 맵 좌표
     * 동작 원리:
     * 1) 이미지 좌표를 0~1 기준의 정규화 좌표(u, v)로 바꾼다.
     * 2) 좌상단 + X축벡터*u + Y축벡터*v 로 맵 좌표를 복원한다.
     *
     * 식:
     *   mapPoint = leftTop + u * (rightTop - leftTop) + v * (leftBottom - leftTop)
     *
     * @param {import('@UGPoint').UGPoint} pImagePoint  이미지 좌표
     * @param {import('@UGPoint').UGPoint} [pMap] 결과를 저장할 맵 좌표 객체
     * @returns {import('@UGPoint').UGPoint} 맵 좌표
     */
    PointToMap(pImagePoint: UGPoint, pMap?: UGPoint): UGPoint;
    /**
     * 이미지 UV -> 맵(3857) 좌표
     *
     * 규칙:
     * - UV 원점은 좌하단이다.
     * - (0, 0) = left-bottom
     * - (1, 1) = right-top
     *
     * @param {import('@UGPoint').UGPoint} pImageUV
     * @param {import('@UGPoint').UGPoint} [pMap]
     * @returns {import('@UGPoint').UGPoint}
     * @ignore
     */
    UVToMap(pImageUV: UGPoint, pMap?: UGPoint): UGPoint;
    /**
     * 맵(3857) 좌표 -> 이미지 좌표
     * 동작 원리:
     * 1) 좌상단을 원점으로 이동한다.
     * 2) (우상-좌상), (좌하-좌상) 두 벡터를 기준축으로 삼는다.
     * 3) 입력 맵 좌표가 이 두 축의 몇 배(u, v)인지 2x2 선형방정식으로 푼다.
     * 4) u, v 를 실제 이미지 픽셀 좌표로 환산한다.
     *
     * @param {import('@UGPoint').UGPoint} ppMap  맵 좌표
     * @param {import('@UGPoint').UGPoint} [pImagePoint] 결과를 저장할 이미지 좌표 객체
     * @returns {import('@UGPoint').UGPoint} 이미지 좌표
     *
     * @ignore
     */
    MapToPoint(ppMap: UGPoint, pImagePoint?: UGPoint): UGPoint;
    /**
     * * 맵(3857) 좌표 -> 이미지 UV
     *
     *  규칙:
     *  - rect는 축고정(axis-aligned)이다.
     *  - rect 값은 항상 left < right, bottom < top 을 만족한다.
     *  - UV 원점은 좌하단이다.
     *  - (0, 0) = left-bottom
     *  - (1, 1) = right-top
     *
     * @ignore
     */
    MapToUV(ppMap: any, pImageUV: any): any;
}

export type { UGeoRect };
