// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelTilesLayer } from "./U3dModelTilesLayer.js";
import type { TileCheckContext } from "./U3dModelTilesLayer.types.js";
import type { U3dVectorTileLayerCO, VctrTile } from "./U3dVectorTileLayer.types.js";
import type { U3DTileset } from "../3dTiles/U3DTileset.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { U3dPOI } from "../geometry/U3dPOI.js";

/**
 * ~extends import('/union3d/3dLayer/U3dModelTilesLayer.js').U3dModelTilesLayer <br>
 * `3D VectorTile` 레이어 클래스
 * @group 3dLayer
 * @extends U3dModelTilesLayer
 *
 * @example
 *   var modellayer = new Union3D.model.U3dVectorTileLayer({
 *     name: name,
 *     useproxy: true,
 *     baseurl: "https://skymaps.co.kr/map/tileset/magok_sim_25_draco/tileset.json",
 *     ext: '.vctr', //레이어 모델 포맷
 *     minlevel: 17, // 가시화 최소 레벨
 *     maxlevel: 19, // 가시화 최대 레벨
 *     apikey: "?api_key=66dd0019-905a-4d66-a0b7-eed7c418dbf0"
 *   });
 *   app.addLayer(modellayer);
 *   app.showLayer(name, true);
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/vectorTile.html}
 */
declare class U3dVectorTileLayer extends U3dModelTilesLayer {
    /** @type {boolean} */
    static g_useOrigin: boolean;
    /**
     * @param {U3dVectorTileLayerCO} opt
     */
    constructor(opt: U3dVectorTileLayerCO);
    _font: any;
    _fontSize: any;
    _imgUrl: any;
    _imgExt: any;
    _clusterRadius: any;
    /**
     * 레이블 관련 속성을 캐시된 타일 전체에 일괄 업데이트
     *
     * @param {'fontFamily' | 'fontSize'} property 업데이트할 속성 이름
     * @param {string | number} value 업데이트할 값
     *
     * @ignore
     */
    _updateLabels(property: "fontFamily" | "fontSize", value: string | number): void;
    /**
     * label의 font family 설정
     *
     * @param {string} font font family문자열
     */
    setFont(font: string): void;
    /**
     * label의 폰트 크기 설정
     *
     * @param {number} size 폰트 크기 (px)
     */
    setFontSize(size: number): void;
    /**
     * @override
     *
     * @param {import('@union3d/core/UDrawArg').UDrawArg} drawArg
     * @param {number} curTime 현재 시간
     * @param {boolean} [force=false] 강제 업데이트 여부
     */
    override update(drawArg: UDrawArg, curTime: number, force?: boolean): void;
    /**
     * 타일(tile)의 자식을 탐색하여 표시 대상 콘텐츠의 로딩과 장면 등록을 시작합니다. <br>
     * 부모 레이어와 같은 인수 순서를 받으며 기존의 두 인수 호출도 지원합니다. <br>
     * 형제 타일의 완료를 기다리지 않으며 전체 탐색의 완료 객체를 반환하지 않습니다.
     *
     * @override
     *
     * @param {import('@U3DTileset').U3DTileset} tile 탐색 시작 타일
     * @param {import('@U3DTileset').U3DTileset | string | number | undefined} parent 부모 타일 또는 기존 두 인수 호출의 갱신 세대 ID
     * @param {string | number} [updateId] 부모형 호출의 갱신 세대 ID
     * @param {boolean} [isFirst=true] 부모와의 호출 호환용 인수이며 벡터 탐색에는 사용하지 않습니다.
     * @param {TileCheckContext} [checkContext] 부모와의 호출 호환용 판정 문맥이며 벡터 탐색에는 사용하지 않습니다.
     * @returns {undefined} 로딩을 예약한 뒤 반환하며 완료 대기는 각 타일의 promise를 사용합니다.
     */
    override searchTiles(tile: U3DTileset, parent: U3DTileset | string | number | undefined, updateId?: string | number, isFirst?: boolean, checkContext?: TileCheckContext): undefined;
    /**
     * 타일의 mesh 그룹을 scene에 추가하고 POI 가시 상태를 갱신
     *
     * @override
     *
     * @param {import('@U3DTileset').U3DTileset} tile 추가할 타일
     * @param {string | number} [updateId] 업데이트 ID
     */
    override addGroup(tile: U3DTileset, updateId?: string | number): void;
    /**
     * POI를 가시 상태 맵에 등록하고 중복 위치의 경우 숨김 처리
     *
     * @param {import('@union3d/geometry/U3dPOI').U3dPOI} mesh 등록할 POI 객체
     * @return {boolean} 등록 성공 여부
     */
    addVisibleState(mesh: U3dPOI): boolean;
    /**
     * POI를 가시 상태 맵에서 제거하고 다음 후보를 가시화
     *
     * @param {import('@union3d/geometry/U3dPOI').U3dPOI} mesh 제거할 POI 객체
     */
    removeVisibleState(mesh: U3dPOI): void;
    /**
     * 이름으로 POI 검색
     *
     * @param {string} name 검색할 이름 (부분 일치)
     * @return {Array<{mesh: import('@union3d/geometry/U3dPOI').U3dPOI, position: import('three').Vector3 | undefined}>} 검색 결과 목록
     */
    search(name: string): Array<{
        mesh: U3dPOI;
        position: three.Vector3 | undefined;
    }>;
    /**
     * VCTR 포인트의 업데이트 가시화 여부를 판단
     *
     * @param {import('@union3d/geometry/U3dPOI').U3dPOI} vctr POI 객체
     * @param {import('@U3DTileset').U3DTileset} tile 소속 타일 정보
     * @param {import('three').Vector3} campos 카메라 위치
     * @return {boolean} 업데이트(가시화) 여부
     */
    isUpdateVCTRPoint(vctr: U3dPOI, tile: U3DTileset, campos: three.Vector3): boolean;
    /**
     * 씬에서 Box3Helper 객체를 모두 제거
     *
     * @ignore
     */
    deleteBoxHelper(): void;
    /**
     * 타일셋 트리의 상태 정합성 검사 (디버그용)
     *
     * @param {boolean} [showLog=false] 로그 출력 여부
     * @param {VctrTile} [tileset] 검사 시작 타일셋
     * @return {boolean} 테스트 통과 여부
     *
     * @ignore
     */
    __$testTilesetCheck(showLog?: boolean, tileset?: VctrTile): boolean;
    /**
     * 가시 상태 맵의 정합성 검사 (디버그용)
     *
     * @param {boolean} [showLog=false] 로그 출력 여부
     * @return {boolean} 테스트 통과 여부
     *
     * @ignore
     */
    __$testVisibleMap(showLog?: boolean): boolean;
    #private;
}

export type { U3dVectorTileLayer };
