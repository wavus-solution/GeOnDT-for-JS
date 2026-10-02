// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UCssBilboard } from "../annotation/UCssBilboard.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UGroup } from "../core/UGroup.js";
import type { WorldPosition } from "../types/global.types.js";

/**
 * U3dBilboard 생성자 옵션 <br>
 */
type U3dBilboardCO = {
    /**
     * 씬 객체 <br>
     */
    scene: three.Scene;
    /**
     * 앱 객체 <br>
     */
    app: U3dApp;
    /**
     * 빌보드 타입 <br>
     */
    type?: "bilboard" | "text" | "point";
    /**
     * x 좌표 <br>
     */
    x?: number;
    /**
     * y 좌표 <br>
     */
    y?: number;
    /**
     * 저장 배열 <br>
     */
    store?: Array<three.Object3D>;
    /**
     * 빌보드 이름 <br>
     */
    name?: string;
    /**
     * 위치 <br>
     */
    position?: WorldPosition | three.Vector3Like;
    /**
     * 크기 <br>
     */
    size?: number;
    /**
     * 텍스트 <br>
     */
    text?: string;
    /**
     * 오프셋 ({x, y}) <br>
     */
    offset?: three.Vector2Like;
    /**
     * 사용자 데이터 값 <br>
     */
    value?: any;
    /**
     * 폰트 크기 (text 타입용) <br>
     */
    fontsize?: number | string;
};

/**
 * U3dBilboard 생성자 옵션 <br>
 *
 * @memberof U3dBilboard
 * @inner
 *
 * @typedef {object} U3dBilboardCO
 * @property {import('three').Scene} scene 씬 객체 <br>
 * @property {import('@U3dApp').U3dApp} app 앱 객체 <br>
 * @property {'bilboard' | 'text' | 'point'} [type='bilboard'] 빌보드 타입 <br>
 * @property {number} [x=0] x 좌표 <br>
 * @property {number} [y=0] y 좌표 <br>
 * @property {Array<import('three').Object3D>} [store] 저장 배열 <br>
 * @property {string} [name] 빌보드 이름 <br>
 * @property {WorldPosition|import('three').Vector3Like} [position] 위치 <br>
 * @property {number} [size=14] 크기 <br>
 * @property {string} [text='start'] 텍스트 <br>
 * @property {import('three').Vector2Like} [offset] 오프셋 ({x, y}) <br>
 * @property {*} [value] 사용자 데이터 값 <br>
 * @property {number | string} [fontsize=18] 폰트 크기 (text 타입용) <br>
 */
/**
 * 빌보드(Billboard) 객체를 생성·관리하는 클래스입니다. <br>
 * 항상 화면을 향하는 CSS2D 기반의 텍스트·포인트·빌보드 타입 객체를 만들며, 생성 시 지정한 씬에 자동으로 추가됩니다. <br>
 */
declare class U3dBilboard {
    /**
     * UUID 접두사 <br>
     *
     * @type {string}
     *
     * @ignore
     */
    static "__#9@#uuid": string;
    /**
     * UUID 카운터 <br>
     *
     * @type {number}
     *
     * @ignore
     */
    static "__#9@#count": number;
    /**
     * 생성된 빌보드 목록 <br>
     *
     * @type {Array<import('three').Object3D>}
     */
    static list: Array<three.Object3D>;
    /**
     * 이름으로 빌보드를 찾아 씬에서 제거하고 리소스를 해제합니다. <br>
     *
     * @param {string} name 제거할 빌보드 이름 <br>
     * @param {import('three').Scene} scene 대상 씬 객체 <br>
     */
    static remove(name: string, scene: three.Scene): void;
    /**
     * 등록된 모든 빌보드를 씬에서 제거하고 리소스를 해제합니다. <br>
     *
     * @param {import('three').Scene} scene 대상 씬 객체 <br>
     * @returns {boolean} 성공 시 true, scene이 없으면 false <br>
     */
    static removeAll(scene: three.Scene): boolean;
    /**
     * UGroup을 재귀적으로 삭제하는 함수 <br>
     *
     * @param {import('@union3d/core/UGroup.js').UGroup} group 삭제할 그룹 <br>
     *
     * @ignore
     */
    static "__#9@#deleteGroup"(group: UGroup): void;
    /**
     * 기본 빌보드(`bilboard` 타입)를 만들어 반환합니다. <br>
     * 씬에 추가하지 않고 객체만 만들어 반환하므로, 반환값을 직접 씬/그룹에 추가해야 합니다. <br>
     *
     * @param {Partial<U3dBilboardCO>} opt 생성 옵션 <br>
     * @returns {import('@union3d/annotation/UCssBilboard.js').UCssBilboard} 생성된 빌보드 <br>
     */
    static makeBilboard(opt: Partial<U3dBilboardCO>): UCssBilboard;
    /**
     * 텍스트 라벨 빌보드를 만들어 반환합니다(`fontsize`로 글자 크기를 지정). <br>
     *
     * @param {Partial<U3dBilboardCO>} [opt={}] 생성 옵션 <br>
     * @returns {import('@union3d/annotation/UCssBilboard.js').UCssBilboard} 생성된 텍스트 빌보드 <br>
     */
    static makeText(opt?: Partial<U3dBilboardCO>): UCssBilboard;
    /**
     * 포인트 마커 빌보드(`point` 타입)를 만들어 반환합니다. <br>
     *
     * @param {Partial<U3dBilboardCO>} [opt={}] 생성 옵션 <br>
     * @returns {import('@union3d/annotation/UCssBilboard.js').UCssBilboard} 생성된 포인트 빌보드 <br>
     */
    static makePoint(opt?: Partial<U3dBilboardCO>): UCssBilboard;
    /**
     * 빌보드를 생성해 지정한 씬에 추가합니다. <br>
     * `scene`과 `app`은 필수이며, 없으면 생성이 중단됩니다. <br>
     * `type`(bilboard/text/point)에 따라 알맞은 객체를 만듭니다. <br>
     *
     * @param {U3dBilboardCO} [opt] 생성 옵션 (scene·app 필수, 위치·텍스트·크기 등) <br>
     */
    constructor(opt?: U3dBilboardCO);
    /**
     * 초기화 여부 <br>
     *
     * @type {boolean}
     *
     * @ignore
     */
    _initialized: boolean;
    /**
     * 빌보드 타입 <br>
     *
     * @type {'bilboard' | 'text' | 'point'}
     *
     * @ignore
     */
    _type: "bilboard" | "text" | "point";
    /**
     * 씬 객체 <br>
     *
     * @type {import('three').Scene}
     *
     * @ignore
     */
    _scene: three.Scene;
    /**
     * 앱 객체 <br>
     *
     * @type {import('@U3dApp').U3dApp}
     *
     * @ignore
     */
    _app: U3dApp;
    /**
     * x 좌표 <br>
     *
     * @type {number}
     *
     * @ignore
     */
    _x: number;
    /**
     * y 좌표 <br>
     *
     * @type {number}
     *
     * @ignore
     */
    _y: number;
    /**
     * 저장 배열 <br>
     *
     * @type {Array<import('three').Object3D> | undefined}
     *
     * @ignore
     */
    _store: Array<three.Object3D> | undefined;
    /**
     * 빌보드 이름 <br>
     *
     * @type {string}
     *
     * @ignore
     */
    _name: string;
    /**
     * 위치 <br>
     *
     * @type {import('three').Vector3 | import('three').Vector3Like}
     *
     * @ignore
     */
    _position: three.Vector3 | three.Vector3Like;
    /**
     * 크기 <br>
     *
     * @type {number}
     *
     * @ignore
     */
    _size: number;
    /**
     * 텍스트 <br>
     *
     * @type {string}
     *
     * @ignore
     */
    _text: string;
    /**
     * 오프셋 <br>
     *
     * @type {import('three').Vector2Like}
     *
     * @ignore
     */
    _offset: three.Vector2Like;
    /**
     * 이 빌보드가 정상적으로 초기화(생성)되었는지 반환합니다. <br>
     * 생성자에서 `scene`/`app`이 없어 중단된 경우 false가 됩니다. <br>
     *
     * @returns {boolean} 초기화 성공 여부 <br>
     */
    isInitialized(): boolean;
    #private;
}

export type { U3dBilboard, U3dBilboardCO };
