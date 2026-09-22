// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dHeightLayer } from "./U3dHeightLayer.js";
import type { U3dHeightWorkOption } from "./U3dHeightLayer.types.js";
import type { TileUrlParam, U3dHeightTilePayload, U3dHeightXYZLayerCO } from "./U3dHeightXYZLayer.types.js";
import type { UFileLoader } from "../core/loader/UFileLoader.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";

/**
 * ~extends import('@union3d/3dLayer/U3dHeightLayer').U3dHeightLayer <br>
 *
 * XYZ/TMS 타일 주소의 고도 자료를 요청하여 지형과 좌표 조회에 제공합니다. <br>
 * 스커트는 서로 다른 레벨의 타일 경계가 벌어지는 현상을 보완합니다. <br>
 * 지형 높이 배율은 기반 레이어의 {@link U3dHeightLayer#setHeightScale} 계약을 그대로 사용합니다.
 *
 * @group 3dLayer
 * @extends {U3dHeightLayer}
 */
declare class U3dHeightXYZLayer extends U3dHeightLayer {
    /**
     * 타일 요청 재시도의 기본 최대 횟수입니다.
     *
     * @type {number}
     */
    static Retry: number;
    /**
     * 타일 요청·자료 형식·공간 설정과 조회용 캐시를 초기화합니다.<br>
     * 레이어의 사용 준비 완료는 initialize()가 수행하는 XML 또는 범위 초기화 결과로 전달합니다.<br>
     *
     * @param {U3dHeightXYZLayerCO} option
     */
    constructor(option: U3dHeightXYZLayerCO);
    /**
     * 타일 URL의 X 인덱스를 반전할지 여부입니다.
     *
     * @type {boolean}
     */
    _reverseX: boolean;
    /**
     * 타일 URL의 Y 인덱스를 반전할지 여부입니다.
     *
     * @type {boolean}
     */
    _reverseY: boolean;
    /**
     * 요청 URL에 프록시 URL을 앞에 붙일지 여부입니다.
     *
     * @type {boolean}
     */
    _useproxy: boolean;
    /**
     * 프록시 요청에 사용하는 URL 접두사입니다.
     *
     * @type {string}
     */
    _proxyurl: string;
    /**
     * 고도 표본 하나가 차지하는 바이트 수입니다.<br>
     * 2이면 Int16, 4이면 Float32로 표본을 읽으며 그 밖의 값은 형식 오류로 처리합니다.
     *
     * @type {number}
     */
    _unitHeight: number;
    /**
     * 한 고도 표본을 구성하는 벡터 성분 수입니다.
     *
     * @type {number}
     */
    _unitVec3: number;
    /**
     * 고도 표본의 숫자 자료 형식 이름이며 기본값은 float입니다.<br>
     * tilemapresource.xml을 읽으면 그 파일의 pixel-type-name 값으로 바뀝니다.<br>
     * 표본을 실제로 어떤 형식으로 읽을지는 _unitHeight가 정하며, 이 값은 읽기 방식에 관여하지 않고 getMetaData()가 돌려주는 설정으로만 보관합니다.
     *
     * @type {string}
     */
    _unitType: string;
    /**
     * 초기화할 때 tilemapresource.xml을 읽을지 여부입니다.
     *
     * @type {boolean}
     */
    _needXml: boolean;
    /**
     * 인접 표본 사이의 고도를 보간할지 여부입니다.
     *
     * @type {boolean}
     */
    _interpolationHeight: boolean;
    /**
     * 타일 경계의 틈을 가리는 스커트 높이입니다.
     *
     * @type {number}
     */
    _skirtHeight: number;
    /**
     * 부모 타일 조회를 시작하기 전 추가로 탐색할 타일 수입니다.
     *
     * @type {number}
     */
    _pTileSearchBuffer: number;
    /**
     * 부모 타일 고도를 적용할 때 남겨 둘 경계 타일 수입니다.
     *
     * @type {number}
     */
    _pTileSubBuffer: number;
    /**
     * 타일 좌표를 TMS 순서로 해석하는지 여부입니다.
     *
     * @type {boolean}
     */
    tms_: boolean;
    /**
     * 타일 처리 진단 출력을 사용할지 여부입니다.
     *
     * @type {boolean}
     */
    _tileDebug: boolean;
    /**
     * 자료 원본이 제공하는 실제 최대 타일 레벨입니다.
     *
     * @type {number | undefined}
     */
    _realmaxlevel: number | undefined;
    /**
     * 타일 응답이 gzip으로 압축되어 있는지 여부입니다.
     *
     * @type {boolean}
     */
    _compress: boolean;
    /**
     * 타일 응답을 내려받고 취소하는 파일 로더입니다.
     *
     * @type {import('@union3d/core/loader/UFileLoader').UFileLoader}
     */
    _loader: UFileLoader;
    /**
     * 캐시 또는 원격 자료로 타일 고도를 준비하고 적용 결과를 비동기로 전달합니다.<br>
     * 파싱·다운로드 실패 시 가능한 부모 고도로 대체하며, 대체할 부모가 없으면 반환한 promise의 reject를 호출합니다.<br>
     * 취소는 현재 소비자에만 적용하고 같은 URL의 다른 소비자가 있으면 요청을 유지합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @param {U3dHeightWorkOption} opt 작업 옵션
     * @returns {Promise<boolean>} 고도를 적용했으면 true, 취소되었거나 적용하지 않았으면 false. 요청이 실패하고 부모 고도로도 대체하지 못하면 거부됩니다
     */
    override createHeight(tile: U3dQuadTile, opt: U3dHeightWorkOption): Promise<boolean>;
    /**
     * 지정한 월드 좌표(EPSG:3857) 타일의 원시 표본과 타일별 복원 헤더를 반환합니다.
     * 조회 순서는 분석용 LRU 캐시, 현재 지형 타일 캐시, 원격 UMF 요청이며 성공한 원격 결과는 LRU에 저장합니다.
     *
     * @param {number} tileX 월드 좌표(EPSG:3857) 기준 타일 X 인덱스
     * @param {number} tileY 월드 좌표(EPSG:3857) 기준 타일 Y 인덱스
     * @param {number} level 타일 레벨
     * @returns {Promise<U3dHeightTilePayload>}
     *
     * @ignore
     */
    _getHeightTilePayload(tileX: number, tileY: number, level: number): Promise<U3dHeightTilePayload>;
    /**
     * 특정 좌표점의 고도 정보를 조회하는 메서드입니다. <br>
     * 월드 좌표(EPSG:3857) 목록의 타일 표본을 조회하여 보간한 고도를 새 결과 목록에 기록합니다.<br>
     * 비유한 좌표는 결과에 넣지 않고 건너뛰므로 입력 순서와 결과 순서가 어긋날 수 있습니다.<br>
     * 요청·파싱 실패는 해당 결과의 z와 errorMsg에 기록합니다.<br>
     * 유효 표본이 없으면 UDEF.TERRAIN_NO_DATA를 반환하며 실제 0m 높이와 구분합니다.
     *
     * @param {Array<{x: number, y: number} & Partial<{level: number}>>} points {x, y, level} 좌표 목록
     * @param {number} [level=15] 기본 타일 레벨. <br>points.level이 없으면 이 값으로 고도를 추출합니다.
     * @param {boolean} [printProgress] 진행률 출력 여부
     * @returns {Promise<Array<{x: number, y: number, z: number | string, level: number, errorMsg: (string | undefined)}>>}
     */
    getHeightAtPoints(points: Array<{
        x: number;
        y: number;
    } & Partial<{
        level: number;
    }>>, level?: number, printProgress?: boolean): Promise<Array<{
        x: number;
        y: number;
        z: number | string;
        level: number;
        errorMsg: (string | undefined);
    }>>;
    /**
     * 계산된 레이어 범위의 Box3 참조를 반환합니다.
     *
     * @returns {import('three').Box3 | undefined} 레이어가 계산한 지형 범위이며 아직 확정되지 않았으면 undefined
     */
    getBoundingBox(): three.Box3 | undefined;
    /**
     * 활성 타일 캐시의 사용 설정을 반환합니다.
     *
     * @returns {boolean}
     */
    isCache(): boolean;
    /**
     * 추가적인 xml 데이터를 읽어 고도/지형 정보에 적용하는 메서드입니다. <br>
     * XML의 고도 형식·버전·압축·격자·바운딩 박스 설정을 읽고 레이어 범위를 초기화합니다.
     *
     * @param {string | undefined} [baseUrl] xml 요청 URL
     */
    readXml(baseUrl?: string | undefined): void;
    /**
     * xml 데이터를 파싱하여 레이어 속성에 반영하는 메서드입니다.
     *
     * @param {XMLHttpRequest} xml XMLHttpRequest 객체
     * @returns {boolean} 작업 성공 시 true, 실패 시 false
     */
    parseXml(xml: XMLHttpRequest): boolean;
    /**
     * 입력 받은 타일을 제거하는 메서드입니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 제거할 대상 타일
     * @param {{deletefunc: function | undefined}} [opt] 삭제 옵션 <br>
     *  - `deletefunc` : 타일 제거가 완료된 후 호출될 콜백 함수
     */
    override disposeTile(tile: U3dQuadTile, opt?: {
        deletefunc: Function | undefined;
    }): void;
    /**
     * 타일의 중심 좌표와 레벨로 타일의 URL을 생성하는 메서드입니다.
     *
     * @param {TileUrlParam} tile 대상 타일 좌표 파라미터 (중심점 + 레벨)
     * @returns {string} 타일의 URL
     * @throws {Error} baseUrl이 설정되지 않아 URL을 만들 수 없을 때 발생합니다.
     */
    createUrl(tile: TileUrlParam): string;
    #private;
}

export type { U3dHeightXYZLayer };
