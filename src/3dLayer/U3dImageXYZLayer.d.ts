// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dImageLayer } from "./U3dImageLayer.js";
import type { U3dImageXYZLayerCO } from "./U3dImageXYZLayer.types.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";

/**
 * ~extends import('@union3d/3dLayer/U3dImageLayer').U3dImageLayer <br>
 * XYZ/TMS URL의 타일 이미지를 표시하는 레이어입니다.
 * baseUrl의 `{x}`, `{y}`, `{z}`는 타일 인덱스이며 `{-x}`, `{-y}`는 반전 인덱스입니다.
 * `{a-c}` 또는 `{1-3}` 같은 서버 범위를 지정하면 초기화 시 요청 후보를 만들고 순환 사용합니다.
 * 한 URL에서는 첫 소문자 범위를 우선하고, 없으면 첫 숫자 범위만 확장합니다.
 * 범위의 시작이 끝보다 크면 요청 후보가 비며 이후 createUrl 호출에서 예외가 발생합니다.
 * reverseX·reverseY 옵션은 현재 URL 치환에 사용하지 않으므로 반전은 토큰으로 지정하십시오.
 *
 * @group 3dLayer
 *
 * @extends {U3dImageLayer}
 */
declare class U3dImageXYZLayer extends U3dImageLayer {
    /**
     * U3dImageXYZLayer 생성자입니다.
     *
     * @param {U3dImageXYZLayerCO} opt 생성자 옵션
     */
    constructor(opt: U3dImageXYZLayerCO);
    /** @type {boolean} */ _reverseX: boolean;
    /** @type {Array<string>} */ _urls: Array<string>;
    /** @type {number} */ _urlIndex: number;
    /** @type {boolean} */ _needXml: boolean;
    /**
     * @override
     *
     * @type {({minx: number, miny: number, maxx: number, maxy: number} & Partial<{srs: string}>) | undefined}
     */
    override _boundingBox: ({
        minx: number;
        miny: number;
        maxx: number;
        maxy: number;
    } & Partial<{
        srs: string;
    }>) | undefined;
    _xmlUrl: string;
    _computeRectangle: () => void;
    /**
     * 추가적인 xml 데이터를 읽어 레이어 속성에 적용하는 함수입니다. <br>
     * xml 파일에서 좌표계(SRS/PROJ), 타일 포맷, 타일 크기, BoundingBox 등의 정보를 읽어옵니다.
     *
     * @returns {Promise<void>} xml 로드/적용 완료 시 resolve 되는 promise
     */
    readXml(): Promise<void>;
    /**
     * 다음 URL 템플릿을 선택하여 타일 인덱스가 반영된 이미지 요청 URL을 반환합니다.
     * 호출할 때마다 URL 선택 위치가 순환하며 reverseX·reverseY 대신 템플릿의 토큰을 사용합니다.
     * 초기화 전이거나 확장된 URL 목록이 비어 있으면 토큰 치환 중 예외가 발생합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 이미지 URL을 생성할 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg 호출 형식 유지용 실행 인수. 현재 구현에서는 미사용
     * @returns {string} 선택한 템플릿의 좌표 토큰을 치환한 이미지 URL
     */
    createUrl(tile: U3dQuadTile, drawArg: UDrawArg): string;
    /**
     * 레이어의 가시화(show/hide) 여부를 설정하는 함수입니다.
     *
     * @override
     *
     * @param {boolean} show 가시화(show/hide) 여부. `true`면 가시화합니다.
     * @return {void}
     */
    override show(show: boolean): void;
    /**
     * 입력 받은 타일에 XYZ(TMS) 이미지 텍스처를 변경하는 함수입니다. <br>
     * 레이어 BoundingBox 와 타일이 교차하지 않으면 작업을 건너뜁니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 이미지를 변경할 타일
     * @returns {Promise<import('@U3dQuadTile').U3dQuadTile> | undefined} 작업 완료 시 resolve 되는 deferred.
     */
    override createTexture(tile: U3dQuadTile): Promise<U3dQuadTile> | undefined;
    /**
     * 레이어의 경계 영역(BoundingBox)을 반환합니다.
     *
     * @return {import('three').Box3 | undefined} 레이어 경계 영역(BoundingBox)
     */
    getBoundingBox(): three.Box3 | undefined;
    #private;
}

export type { U3dImageXYZLayer };
