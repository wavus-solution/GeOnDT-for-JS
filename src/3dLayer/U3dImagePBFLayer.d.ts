// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { PBFStyleFunction, ParsedPBFResult, U3dImagePBFLayerCO } from "./U3dImagePBFLayer.types.js";
import type { U3dImageXYZLayer } from "./U3dImageXYZLayer.js";
import type { UTaskProcessor } from "../core/UTaskProcessor.js";
import type { UMercator } from "../math/UMercator.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { LRUCache } from "../util/LRUCache.js";

/**
 * ~extends import('@union3d/3dLayer/U3dImageXYZLayer').U3dImageXYZLayer <br>
 *
 * PBF(MVT) 벡터 타일을 내려받아 타일마다 이미지로 그린 뒤 지형 위에 올리는 레이어 클래스입니다. <br>
 * 피처의 색과 선은 생성자에 전달한 `styleFunction` 이 결정하며, 화면에는 벡터가 아니라 이렇게 그려진 타일 이미지가 표시됩니다. <br>
 * 워커에서 그리는 기본 설정(`useTestWorker` 가 `true`)에서는 면과 선만 그리고 점 피처는 그리지 않습니다.
 *
 * @group 3dLayer
 *
 * @extends {U3dImageXYZLayer}
 */
declare class U3dImagePBFLayer extends U3dImageXYZLayer {
    /**
     * 타일 하나를 그릴 때 쓰는 정사각형 이미지의 한 변 길이(픽셀)입니다. <br>
     * 현재 구현은 그릴 때 이 값을 읽지 않고 256 을 그대로 사용하므로, 이 값을 바꿔도 그려지는 이미지 크기는 달라지지 않습니다.
     *
     * @type {number}
     */
    static IMAGE_SIZE: number;
    /**
     * PBF 타일 내려받기와 해석을 맡는 워커 묶음이며, 이 클래스의 모든 인스턴스가 함께 사용합니다. <br>
     * `U3dVectorPBFLayer` 도 같은 워커 묶음으로 타일을 요청하므로 두 레이어의 작업이 같은 대기열을 나눠 씁니다.
     *
     * @type {import('@union3d/core/UTaskProcessor').UTaskProcessor}
     */
    static g_TaskProcessor: UTaskProcessor;
    /**
     * U3dImagePBFLayer 클래스 생성자입니다. <br>
     * `baseUrl` 이 없으면 오류를 던지지 않고 콘솔 안내만 남긴 채 초기화를 중단하므로, 해당 레이어는 타일을 요청하지 않습니다.
     *
     * @param {U3dImagePBFLayerCO} opt 생성자 옵션입니다. <br>
     */
    constructor(opt: U3dImagePBFLayerCO);
    /**
     * 초기화할 때 `metadata.json` 을 읽어 레벨 범위와 경계 상자를 덮어쓸지 여부이며, 생성자의 `needJson` 옵션 값입니다.
     *
     * @type {boolean}
     */
    _needJson: boolean;
    /**
     * `readSLD()` 가 내려받을 SLD 스타일 파일 주소이며, 생성자의 `styleSldUrl` 옵션 값입니다.
     *
     * @type {string}
     */
    _styleSldUrl: string;
    /**
     * 타일 서버가 실제로 타일을 제공하는 마지막 레벨이며, 생성자의 `realMaxLevel` 옵션 값입니다.
     *
     * @type {number}
     */
    _realMaxlevel: number;
    /**
     * PBF 해석과 타일 그리기를 워커에서 수행할지 여부이며, 생성자의 `useTestWorker` 옵션 값입니다.
     *
     * @type {boolean}
     */
    _useTestWorker: boolean;
    /**
     * 피처마다 색과 선을 정하는 스타일 함수이며, 생성자의 `styleFunction` 옵션 값입니다.
     *
     * @type {PBFStyleFunction | undefined}
     */
    _styleFunction: PBFStyleFunction | undefined;
    /**
     * 타일 인덱스와 월드 좌표(EPSG:3857) 사이를 변환하고 타일 경계·해상도를 구하는 계산기입니다.
     *
     * @type {import('@union3d/math/UMercator').UMercator}
     */
    _mercator: UMercator;
    /**
     * 워커에 요청을 보낸 타일의 `타일 키 → 요청 URL` 목록이며, 요청을 중단할 때 이 URL 로 워커에 알립니다.
     *
     * @type {Record<string, string>}
     */
    _modelUrlMap: Record<string, string>;
    /**
     * 부모 레이어의 정리 과정을 수행한 뒤 이 레이어가 보관한 PBF 피처 캐시를 모두 비웁니다. <br>
     * 정리 후에는 이 레이어를 다시 사용할 수 없습니다.
     *
     * @override
     */
    override dispose(): void;
    /**
     * @override
     *
     * @param {string} key 해제할 타일의 키
     * @param {Partial<{deletefunc: (function((import('three').Object3D | import('three').Material)): void)}>} [opt] 타일 해제 옵션입니다. <br>
     * `deletefunc` 는 삭제할 항목 하나만 전달받고 this 로 현재 레이어를 받으며, 지정하지 않으면 레이어의 기본 정리 함수가 쓰입니다.
     * @returns {boolean} 해제했으면 `true` 입니다. <br>
     * 타일의 지형 메시가 부모·자식 타일 전환(terrain handoff)을 아직 끝내지 못해 해제가 보류되면 `false` 이며, 이때는 워커 작업 중단과 피처 캐시 제거도 하지 않습니다.
     */
    override disposeTileByKey(key: string, opt?: Partial<{
        deletefunc: ((arg0: (three.Object3D | three.Material)) => void);
    }>): boolean;
    /**
     * `realMaxLevel` 레벨 타일의 해석 결과만 담아 두는 별도의 LRU 캐시를 반환합니다. <br>
     * 아래 `getFeatureByKey()` 계열이 다루는 해석 결과 캐시와는 다른 저장소입니다. <br>
     * 더 깊은 레벨의 타일이 조상 타일 데이터를 다시 잘라 쓸 때 이 캐시에서 원본을 찾습니다.
     *
     * @returns {import('@util/LRUCache').LRUCache | undefined} 타일 키로 해석 결과를 찾는 LRU 캐시. 레이어를 정리한 뒤에는 `undefined`
     */
    getFeatureLRUCache(): LRUCache | undefined;
    /**
     * 해당 타일의 PBF 해석 결과가 피처 캐시에 남아 있는지 확인합니다.
     *
     * @param {string} key 확인할 타일의 키
     * @returns {boolean} 해석 결과가 있으면 `true`
     */
    hasFeatureByKey(key: string): boolean;
    /**
     * 해당 타일의 PBF 해석 결과를 피처 캐시에서 꺼내 옵니다.
     *
     * @param {string} key 찾을 타일의 키
     * @returns {ParsedPBFResult | undefined} 캐시에 없으면 `undefined`
     */
    getFeatureByKey(key: string): ParsedPBFResult | undefined;
    /**
     * 해당 타일의 PBF 해석 결과를 해석 결과 캐시에 넣습니다. <br>
     * 같은 키가 이미 있으면 기존 항목을 먼저 지우고 새 값으로 바꿉니다. <br>
     * `getFeatureLRUCache()` 가 돌려주는 LRU 캐시에는 넣지 않습니다.
     *
     * @param {string} key 저장할 타일의 키
     * @param {ParsedPBFResult} value 저장할 해석 결과
     */
    addFeatureByKey(key: string, value: ParsedPBFResult): void;
    /**
     * 피처 캐시가 현재 담고 있는 타일 키를 모두 반환합니다.
     *
     * @returns {Array<string> | undefined} 타일 키 목록입니다. <br>
     * `dispose()` 로 정리한 뒤에는 빈 배열이며, `baseUrl` 없이 만들어져 초기화가 중단된 레이어에서는 `undefined` 입니다.
     */
    getFeatureKeys(): Array<string> | undefined;
    /**
     * 타일 인덱스를 직접 받아 타일 요청 URL 을 만듭니다. <br>
     * `createUrl()` 은 타일 객체의 중심 좌표로 자기 레벨의 URL 만 만들 수 있어, `realMaxLevel` 을 넘는 타일이 조상 레벨 타일을 재사용할 때 이 함수를 사용합니다.
     *
     * @param {Array<number>} tx `UMercator.MetersToTile()` 이 채운 x 인덱스 배열. 첫 번째 값만 사용합니다.
     * @param {Array<number>} ty 같은 방식으로 채운 y 인덱스 배열. 첫 번째 값만 사용합니다.
     * @param {number} level 요청할 타일 레벨
     * @returns {string} URL 템플릿의 좌표 토큰을 이 인덱스로 치환한 주소
     */
    createUrlEx(tx: Array<number>, ty: Array<number>, level: number): string;
    /**
     * 기준 타일에서 위로 거슬러 올라가며 지정한 레벨의 조상 타일을 찾습니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 탐색을 시작할 타일
     * @param {number} orderLevel 찾을 조상 타일의 레벨
     * @returns {import('@U3dQuadTile').U3dQuadTile | undefined} 그 레벨의 조상 타일. 뿌리까지 올라가도 없으면 `undefined`
     */
    getParentTileByKey(tile: U3dQuadTile, orderLevel: number): U3dQuadTile | undefined;
    /**
     * 기반 레이어를 초기화하고, `needJson` 이 켜져 있으면 `metadata.json` 을 읽어 레이어 영역을 다시 계산합니다.
     *
     * @override
     *
     * @returns {any} 기반 레이어 초기화 결과를 전달하지 않으므로 항상 `undefined`
     *
     * @ignore
     */
    override initialize(): any;
    /**
     * `styleSldUrl` 주소에서 SLD(Styled Layer Descriptor) 스타일 파일을 내려받아 XML 문서로 해석합니다. <br>
     * 해석한 스타일을 레이어에 반영하는 단계는 아직 없으므로 호출해도 화면은 달라지지 않습니다.
     *
     * @returns {Promise<void>} 내려받기와 해석이 끝나면 이행되는 Promise
     * @throws {Error} `styleSldUrl` 이 없으면 반환한 Promise 가 이 오류로 거부됩니다.
     */
    readSLD(): Promise<void>;
    /**
     * 타일 주소와 같은 위치의 `metadata.json` 을 내려받아 레이어 설정에 반영합니다. <br>
     * `minzoom`·`maxzoom` 은 이 레이어의 최소·최대 타일 레벨로, `bounds` 는 경계 상자로 덮어씁니다. <br>
     * 세 항목 중 파일에 없는 것은 기존 값을 그대로 둡니다.
     *
     * @returns {Promise<void>} 내려받기와 반영이 끝나면 이행되는 Promise
     * @throws {Error} `bounds` 가 쉼표로 구분한 네 개의 숫자가 아니면 반환한 Promise 가 이 오류로 거부되며, 이때 그 앞에서 읽은 `minzoom`·`maxzoom` 은 이미 반영된 상태입니다. <br>
     * 파일을 내려받지 못하거나 JSON 으로 해석할 수 없을 때도 그 오류로 거부되며, 이 경우 레이어 설정은 바뀌지 않습니다.
     */
    readJson(): Promise<void>;
    #private;
}

export type { U3dImagePBFLayer };
