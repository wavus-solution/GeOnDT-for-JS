// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../../3dLayer/U3dLayer.js";
import type { U3dApp } from "../../app/U3dApp.js";
import type { UFastTerrainStamp, UFastTerrainStampRenderState } from "../../helpers/UFastTerrainStamp.js";
import type { U3dQuadTile } from "../../quadtree/U3dQuadTile.js";
import type { UFastTerrainStampMaterial } from "../../shader/UFastTerrainStampMaterial.js";

/**
 * Helper의 지면 도장 등록·공유 렌더 자료·자원 수명을 앱별로 관리하는 비공개 매니저입니다.
 * 일반 영상 레이어 목록에 들어가지 않으며 기존 렌더 직전 콜백만 사용합니다.
 * 생성·해제는 UFastTerrainStamp가 관리하므로 사용자가 직접 등록할 필요가 없습니다.
 *
 * @private
 */
declare class UFastTerrainStampManager {
    /**
     * 이미 연결된 매니저를 조회합니다. 조회만으로 자원을 만들지 않습니다.
     *
     * @param {import('@union3d/app/U3dApp').U3dApp} app 대상 앱
     * @returns {UFastTerrainStampManager | undefined} 연결된 매니저
     */
    static _get(app: U3dApp): UFastTerrainStampManager | undefined;
    /**
     * 실제 표시하는 최상위 지형 메시에서만 snapshot 합성 재질을 읽습니다.
     * 앱에 등록 상태를 추가하지 않고 공유 매니저가 선택한 receiver를 사용합니다.
     *
     * @param {import('@union3d/3dLayer/U3dLayer').U3dLayer | undefined} ownerLayer 지형 영상 레이어
     * @param {import('three').Object3D} object 실제 지형 메시
     * @returns {import('@union3d/shader/UFastTerrainStampMaterial').UFastTerrainStampMaterial | undefined} 활성 표시 자료
     */
    static _getDisplayMaterial(ownerLayer: U3dLayer | undefined, object: three.Object3D): UFastTerrainStampMaterial | undefined;
    /**
     * 앱별 매니저를 공유합니다.
     *
     * @param {import('@union3d/app/U3dApp').U3dApp} app 대상 앱
     * @returns {UFastTerrainStampManager} 사용 가능한 매니저
     */
    static _getOrCreate(app: U3dApp): UFastTerrainStampManager;
    /**
     * 앱의 표시 수명에 매니저를 연결합니다.
     *
     * @param {import('@union3d/app/U3dApp').U3dApp} app 대상 앱
     */
    constructor(app: U3dApp);
    /** @type {boolean} */
    _disposed: boolean;
    /**
     * 도장을 등록하고 다음 프레임에 변경을 한 번 반영합니다.
     *
     * @param {import('@union3d/helpers/UFastTerrainStamp').UFastTerrainStamp} stamp 등록할 도장
     */
    _addStamp(stamp: UFastTerrainStamp): void;
    /**
     * 등록을 해제합니다. 마지막 도장은 표시를 즉시 끊고 소유 자원을 반납합니다.
     * retire를 전달하면 개별 자원 반납을 Helper의 기존 분산 해제에 맡깁니다.
     *
     * @param {import('@union3d/helpers/UFastTerrainStamp').UFastTerrainStamp} stamp 제거할 도장
     * @param {Function} [retire] 개별 dispose 자원의 지연 해제 함수
     */
    _removeStamp(stamp: UFastTerrainStamp, retire?: Function): void;
    /** 같은 프레임의 여러 변경을 하나의 자료 갱신으로 묶습니다. */
    _markDirty(): void;
    /**
     * 진단용 등록 목록을 복사합니다.
     *
     * @returns {Array<import('@union3d/helpers/UFastTerrainStamp').UFastTerrainStamp>} 등록 도장
     */
    _getStamps(): Array<UFastTerrainStamp>;
    /**
     * 내부 자료를 변경하지 않는 진단 수치를 반환합니다.
     *
     * @returns {object} 촬영 영역·snapshot·표시 지형 및 갱신 횟수
     */
    _getStats(): object;
    /**
     * 표시와 콜백을 즉시 끊고 소유 자원을 한 번 반납합니다.
     *
     * @param {Function} [retire] 기존 Helper 분산 해제 함수
     */
    dispose(retire?: Function): void;
    #private;
}

/**
     * 한 촬영 영역의 앞·뒤 snapshot 위치입니다. 텍스처는 매니저가 소유합니다.
     */
    type UFastTerrainStampSnapshot = {
        /**
         * 도장이 소유하는 읽기 전용 도형·표현
         */
        row: UFastTerrainStampRenderState;
        /**
         * 배열 texture 번호
         */
        page: number;
        /**
         * page 안의 촬영 영역 번호
         */
        slot: number;
        /**
         * 마지막으로 완성한 앞·뒤 buffer 번호
         */
        front: number;
        /**
         * 표시할 배열 slice 번호
         */
        layer: number;
        /**
         * padding을 포함하는 world XY 범위
         */
        bounds: three.Box2;
        /**
         * 정규화된 거리 한 단위의 world 길이
         */
        unit: number;
        /**
         * 마지막으로 구운 형상 세대
         */
        geometryRevision: number;
        /**
         * 마지막 world 선폭
         */
        meterWidth: number;
    };

/**
     * 앱별 촬영 영역 snapshot 매니저의 소유 상태입니다.
     * 기존 지형의 receiver만 빌리며 타일 geometry·material의 수명은 소유하지 않습니다.
     */
    type UFastTerrainStampManagerState = {
        /**
         * 소유 앱
         */
        app: U3dApp;
        /**
         * 렌더 callback 키
         */
        key: string;
        /**
         * 앱 종료 감시 장면
         */
        externalScene: three.Scene | undefined;
        /**
         * 장면 종료 callback
         */
        onDispose: Function | undefined;
        /**
         * 등록 도장
         */
        stamps: Set<UFastTerrainStamp>;
        /**
         * 표시 순서의 도형
         */
        rows: Array<UFastTerrainStampRenderState>;
        /**
         * 같은 순서의 표시 snapshot
         */
        records: Array<UFastTerrainStampSnapshot>;
        /**
         * 도형별 저장 위치
         */
        entries: Map<UFastTerrainStampRenderState, UFastTerrainStampSnapshot>;
        /**
         * 앞·뒤 거리 texture 배열
         */
        pages: Array<three.WebGLArrayRenderTarget>;
        /**
         * page별 사용 위치
         */
        slots: Array<Array<boolean>>;
        /**
         * 등록·도형·표현 변경 여부
         */
        dirty: boolean;
        /**
         * 표시 자료 세대
         */
        revision: number;
        /**
         * GPU 상대좌표의 world 원점
         */
        origin: three.Vector3;
        /**
         * 원점 확정 여부
         */
        originReady: boolean;
        /**
         * 공용 표시 uniform 소유자
         */
        material: UFastTerrainStampMaterial;
        /**
         * 공용 coverage·거리 scratch 및 raster geometry·material
         */
        baker: object | undefined;
        /**
         * 내부 채움과 보수적인 경계 거리 하한을 저장한 공용 합성 자료
         */
        composite: object | undefined;
        /**
         * 실제 합성을 연결할 최상위 지형 메시
         */
        receivers: Set<three.Object3D>;
        /**
         * 논리 타일별 최상위 지형
         */
        visibleTiles: Map<U3dQuadTile, three.Object3D>;
        /**
         * 자료 갱신·형상 snapshot·내부 합성 횟수 및 별도 지형 표시 draw 수
         */
        stats: {
            updates: number;
            bakes: number;
            compositions: number;
            displayDraws: number;
        };
    };

export type { UFastTerrainStampManager, UFastTerrainStampManagerState, UFastTerrainStampSnapshot };
