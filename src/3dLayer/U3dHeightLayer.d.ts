// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer, U3dLayerCO } from "./U3dLayer.js";
import type { UCache } from "../core/UCache.js";
import type { UPlaneBufferGeometry } from "../geometry/UPlaneBufferGeometry.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";

/**
 * ~extends import('@U3dLayer').U3dLayer <br>
 *
 * 타일 고도 적용과 부모 타일 대체 처리를 제공하는 기반 레이어입니다.
 *
 * @group 3dLayer
 * @extends {U3dLayer}
 */
declare class U3dHeightLayer extends U3dLayer {
    /**
     *  @type {import('@union3d/geometry/UPlaneBufferGeometry').UPlaneBufferGeometry | undefined}
     *
     *  @ignore
     */
    static g_taskProcessor: UPlaneBufferGeometry | undefined;
    /**
     * @type {Map<string, import('@union3d/geometry/UPlaneBufferGeometry').UPlaneBufferGeometry>}
     *
     *  @ignore
     */
    static terrains: Map<string, UPlaneBufferGeometry>;
    /**
     * @param {string} key 고도를 가져올 타일 키 값
     * @returns {import('@union3d/geometry/UPlaneBufferGeometry').UPlaneBufferGeometry | undefined}
     *
     * @ignore
     */
    static getTerrains(key: string): UPlaneBufferGeometry | undefined;
    /**
     * @param {string} key 고도를 적용할 타일 키 값
     * @param {import('@union3d/geometry/UPlaneBufferGeometry').UPlaneBufferGeometry} value
     *
     * @ignore
     */
    static setTerrains(key: string, value: UPlaneBufferGeometry): void;
    /**
     * @param {string} key 고도를 제거할 타일 키 값
     *
     * @ignore
     */
    static deleteTerrains(key: string): void;
    /**
     * @param {string} key
     * @returns {boolean}
     *
     * @ignore
     */
    static hasTerrains(key: string): boolean;
    /**
     * 고도 레이어의 식별자, 부모 타일 대체 레벨과 헤더 캐시를 초기화합니다.
     *
     * @param {U3dHeightLayerCO} [opt={}] 고도 레이어 생성 옵션, 생략하면 빈 객체
     */
    constructor(opt?: U3dHeightLayerCO);
    /**
     * 부모 타일의 고도를 대신 사용할 타일 레벨 번호 목록이며, 하위 클래스가 이 목록으로 대체 여부를 판단합니다.
     *
     * @type {Array<number>}
     */
    _burnLevels: Array<number>;
    /**
     * 고도 헤더가 없을 때 원본 고도 표본에 곱하는 배율입니다.
     *
     * @type {number}
     */
    _dataScale: number;
    /**
     * 고도 헤더가 없을 때 배율을 적용한 고도 표본에 더하는 값입니다.
     *
     * @type {number}
     */
    _dataOffset: number;
    /**
     * 이 레이어가 처리하는 고도 자료 형식의 주 버전입니다.
     *
     * @type {number}
     */
    _majorVersion: number;
    /**
     * 이 레이어가 처리하는 고도 자료 형식의 부 버전입니다.
     *
     * @type {number}
     */
    _minorVersion: number;
    /**
     * 입력 고도 표본 배열의 가로 표본 수이며, 하위 클래스가 고도를 적용하기 전에 설정합니다.
     *
     * @type {number | undefined}
     */
    _width: number | undefined;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */ _height: number | undefined;
    /**
     * 타일 경계의 틈을 가리는 스커트(skirt) 정점을 지형 평면에 포함할지 여부입니다.
     *
     * @type {boolean | undefined}
     */
    _skirt: boolean | undefined;
    /**
     * 지형 평면을 만들 때 사용하는 한 변의 정점 분할 기준값이며, 스커트를 사용하지 않으면 2를 뺀 값이 분할 수가 됩니다.
     *
     * @type {number | undefined}
     */
    _segVertex: number | undefined;
    /**
     * 스커트 가장자리 정점에 채우는 기본 고도입니다.
     *
     * @type {number | undefined}
     */
    _defaultHeight: number | undefined;
    /**
     * 타일 메시의 Z축에 적용하는 지형 높이 배율입니다.
     *
     * @type {number}
     */
    _heightScale: number;
    /**
     * 타일 키별로 고도 타일 헤더를 보관하는 캐시입니다.
     *
     * @type {import('@union3d/core/UCache').UCache | undefined}
     */
    _headerCache: UCache | undefined;
    /**
     * 현재 설정된 지형 높이 배율을 반환합니다.
     *
     * @returns {number} 타일 메시의 Z축에 적용 중인 지형 높이 배율
     */
    getHeightScale(): number;
    /**
     * 원본 고도 자료를 변경하지 않고 지형 타일 메시의 Z축 배율을 설정하여 화면의 높낮이를 조정합니다. <br>
     * 입력값은 기존 배율과 곱하지 않고 새 배율로 저장하며, 0.1 미만이면 0.1로 보정합니다. <br>
     * scale을 생략하거나 undefined 또는 null을 전달하면 초기값 1.0을 적용합니다. <br>
     * 문자열을 전달하면 현재 배율과 타일 메시를 변경하지 않고 TypeError가 발생합니다. <br>
     * 호출 시 레이어 캐시에 등록된 타일 중 현재 메시가 있는 타일에는 즉시 적용하고, 아직 메시가 없는 타일에는 이후 고도가 연결될 때 저장된 배율을 적용합니다.
     *
     * @param {number | null | undefined} [scale=1.0] 지형 타일 메시의 Z축에 설정할 배율, 생략하거나 undefined·null이면 1.0이며 0.1 미만은 0.1로 보정됨
     * @throws {TypeError} scale이 문자열일 때 발생합니다.
     */
    setHeightScale(scale?: number | null | undefined): void;
    /**
     * 자기 고도 자료를 받지 못한 타일에, 한 단계 위 부모 타일의 고도에서 해당 사분면을 잘라내 대신 적용합니다. <br>
     * 부모가 아직 내려받는 중이면 부모의 로드 완료를 한 번 기다린 뒤 이어서 진행합니다. <br>
     * 성공과 실패는 반환값이 아니라 opt.promise와 타일 작업 상태로 전달합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 부모 고도를 대신 적용할 타일
     * @param {U3dHeightWorkOption} opt 작업 상태와 완료 결과를 받을 옵션
     * @returns {undefined} 항상 undefined이며, 생성 성공 여부는 opt.promise가 받음
     */
    createParentHeight(tile: U3dQuadTile, opt: U3dHeightWorkOption): undefined;
    /**
     * 고도 표본 배열을 해당 타일이 공유하는 지형 지오메트리의 높이에 반영합니다. <br>
     * 표본 수와 격자 크기가 서로 맞지 않거나 레이어에 애플리케이션이 연결되지 않았으면, 지오메트리를 바꾸기 전에 Error를 발생시킵니다. <br>
     * 같은 타일에 다른 고도 레이어가 이미 적용되어 있으면 값이 없는 표본과 레이어의 그리기 순서를 기준으로 두 고도를 합치고, 최종 고도를 적용한 레이어 이름을 타일에 기록합니다. <br>
     * 높이를 반영한 뒤에는 지오메트리의 높이 범위와 바운딩 볼륨을 갱신하고, 이 타일과 겹치는 커스텀 지형 편집 영역을 함께 적용합니다. <br>
     * ioBuf를 생략하면 아무 상태도 바꾸지 않습니다. <br>
     * ioBuf를 전달할 때는 tile과 하위 클래스가 준비한 격자 설정이 있어야 합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} [tile] 고도를 반영할 타일
     * @param {ArrayLike<number>} [ioBuf] 가로 표본 수와 세로 표본 수의 곱만큼 담긴 고도 표본 배열
     * @param {U3dHeightTileHeader} [headerBuf] 이 표본에만 적용할 격자 크기와 배율·오프셋·없음 값 정보
     * @returns {boolean | undefined} 고도를 반영하면 true, ioBuf를 생략하면 undefined
     */
    override updateHeight(tile?: U3dQuadTile, ioBuf?: ArrayLike<number>, headerBuf?: U3dHeightTileHeader): boolean | undefined;
    /**
     * 이전에 받아 보관해 둔 고도 표본과 헤더를 화면에 있는 같은 타일에 다시 적용합니다. <br>
     * 커스텀 지형 편집처럼 원본 고도는 그대로 두고 결과만 다시 계산해야 할 때 사용합니다. <br>
     * 보관된 고도나 화면 타일을 찾지 못하면 아무 상태도 바꾸지 않고 false를 반환합니다.
     *
     * @param {U3dHeightUserTileInfoOption} _tile 고도를 다시 적용할 타일을 지정하는 정보
     * @param {string} [skey] 보관된 고도를 찾을 키, 생략하면 _tile의 x·y·level로 만든 키
     * @returns {boolean} 고도를 다시 적용했으면 true, 필요한 자료를 찾지 못했으면 false
     */
    updateHeightByUser(_tile: U3dHeightUserTileInfoOption, skey?: string): boolean;
    /**
     * 타일 키로 등록된 공유 지형 지오메트리를 타일 메시에 연결하고 고도 적용이 끝난 상태로 표시합니다. <br>
     * 연결하는 메시에는 현재 지형 높이 배율을 함께 적용합니다. <br>
     * 등록된 지오메트리나 타일 메시가 없으면 아무 상태도 바꾸지 않습니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 지형 지오메트리를 연결할 타일
     */
    changeHeight(tile: U3dQuadTile): void;
    /**
     * 사용자가 지형 높이를 직접 편집해 등록한 영역(CustomLand) 가운데 대상 타일과 겹치는 것을 지형 지오메트리에 반영합니다. <br>
     * 반영하기 전에 이 지오메트리에 이미 적용해 둔 편집 영역을 모두 지우므로, 등록된 편집이 하나도 없으면 편집 이전의 지형으로 돌아갑니다.
     *
     * @param {import('@union3d/geometry/UPlaneBufferGeometry').UPlaneBufferGeometry} geometry 편집 영역을 반영할 타일의 지형 지오메트리
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 편집 영역을 찾을 검색 범위를 제공하는 타일
     */
    updateGeometryWidthBoxList(geometry: UPlaneBufferGeometry, tile: U3dQuadTile): void;
    /**
     * 하위 클래스가 타일 고도를 만들기 전에 공통 선행 조건을 검사합니다. <br>
     * 검사만 수행하며 고도를 직접 만들지는 않습니다. <br>
     * 조건을 만족하지 못하면 필요한 경우 타일 작업 상태를 초기화하고 opt.work에 실패 사유를 전달합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @param {U3dHeightWorkOption} [opt={}] 작업 옵션
     * @returns {boolean | Promise<boolean>} 검사 결과. false면 타일 고도 생성 불가능
     */
    override createHeight(tile: U3dQuadTile, opt?: U3dHeightWorkOption): boolean | Promise<boolean>;
    /**
     * 두 고도 버퍼 간 차이가 임계값 초과 시 앞 버퍼 값으로 교체하는 함수
     *
     * @param {number} frontBuf 앞 버퍼 고도 값
     * @param {number} backBuf 뒤 버퍼 고도 값
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @param {number} x x 인덱스
     * @param {number} y y 인덱스
     * @returns {number} 교체된 버퍼 값
     *
     * @ignore
     */
    checkDEMBufValidation(frontBuf: number, backBuf: number, tile: U3dQuadTile, x: number, y: number): number;
}

/**
     * ~extends import('@U3dLayer').U3dLayerCO <br>
     *
     * U3dHeightLayer 생성자 옵션입니다.
     */
    type U3dHeightLayerCO_Content = {
        /**
         * 부모 타일의 고도를 대신 사용할 타일 레벨 번호 목록
         */
        burnlevels?: Array<number>;
    };

/**
     * ~extends import('@U3dLayer').U3dLayerCO <br>
     *
     * U3dHeightLayer 생성자 옵션입니다.
     */
    type U3dHeightLayerCO = Omit<Omit<U3dLayerCO, never> & U3dHeightLayerCO_Content, never>;

/**
     * 부모 타일 고도 생성 작업의 진행 상황과 결과를 전달받기 위한 옵션입니다.
     */
    type U3dHeightWorkOption = {
        /**
         * 실패 사유 등 작업 상태 메시지를 받는 객체
         */
        work: {
            setMsg: (msg: string) => void;
        };
        /**
         * 생성 성공 여부를 true 또는 false로 받는 객체
         */
        promise?: {
            resolve: (value: boolean) => void;
        };
    };

/**
     * 보관된 고도를 다시 적용할 타일을 지정하는 값 묶음입니다.
     */
    type U3dHeightUserTileInfoOption = {
        /**
         * 타일의 X축 인덱스
         */
        x: number;
        /**
         * 타일의 Y축 인덱스
         */
        y: number;
        /**
         * 타일의 레벨
         */
        level: number;
        /**
         * 타일 영역의 최소 X 월드 좌표(EPSG:3857), 현재 재적용 처리에서는 사용하지 않음
         */
        minx: number;
        /**
         * 타일 영역의 최소 Y 월드 좌표(EPSG:3857), 현재 재적용 처리에서는 사용하지 않음
         */
        miny: number;
        /**
         * 타일 영역의 최대 X 월드 좌표(EPSG:3857), 현재 재적용 처리에서는 사용하지 않음
         */
        maxx: number;
        /**
         * 타일 영역의 최대 Y 월드 좌표(EPSG:3857), 현재 재적용 처리에서는 사용하지 않음
         */
        maxy: number;
    };

/**
     * 지형 적용과 조회에 전달하는 해석된 표본 메타데이터입니다. <br>
     * 파일의 바이너리 배치가 아닌, 호출자가 표본과 함께 보관·전달하는 값의 계약입니다.
     */
    type U3dHeightTileHeader = {
        /**
         * 자료의 주 버전
         */
        major: number;
        /**
         * 자료의 부 버전
         */
        minor: number;
        /**
         * 고도 타일 X축 사이즈
         */
        width: number;
        /**
         * 고도 타일 Y축 사이즈
         */
        height: number;
        /**
         * 고도 표본의 자료형 식별값
         */
        sampleType: number;
        /**
         * 원본 고도 표본에 곱하는 배율, 레이어 기본 배율보다 먼저 적용됨
         */
        scale: number;
        /**
         * 배율을 적용한 고도 표본에 더하는 값, 레이어 기본 오프셋보다 먼저 적용됨
         */
        offset: number;
        /**
         * 값이 없는 표본을 나타내는 원본 표본값, 지정하지 않으면 undefined
         */
        noData: number | undefined;
        /**
         * 헤더에 기록된 실제 고도 표본 개수
         */
        count: number;
    };

/**
     * 고도 정점 갱신에 필요한 상태 조회 계약입니다. <br>
     * 실제 레이어의 현재 값을 참조합니다.
     */
    type U3dHeightSampleState = {
        /**
         * 현재 레이어 이름
         */
        _name: string | undefined;
        /**
         * 헤더가 없을 때의 표본 배율
         */
        _dataScale: number;
        /**
         * 헤더가 없을 때의 표본 오프셋
         */
        _dataOffset: number;
        /**
         * 가장자리 기본 고도
         */
        _defaultHeight: number | undefined;
    };

/**
     * 공유 정점 배열 갱신 후 일반 제어부가 반영할 결과입니다.
     */
    type U3dHeightSampleResult = {
        /**
         * 스커트 가장자리를 제외한 정점의 최대 고도, 집계할 정점이 없으면 undefined
         */
        maxHeight: number | undefined;
        /**
         * 스커트 가장자리를 제외한 정점의 최소 고도, 집계할 정점이 없으면 undefined
         */
        minHeight: number | undefined;
        /**
         * 다른 레이어의 기존 고도와 병합했는지 여부
         */
        merged: boolean;
    };

export type { U3dHeightLayer, U3dHeightLayerCO, U3dHeightLayerCO_Content, U3dHeightSampleResult, U3dHeightSampleState, U3dHeightTileHeader, U3dHeightUserTileInfoOption, U3dHeightWorkOption };
