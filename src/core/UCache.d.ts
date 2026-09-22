// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UDrawArg } from "./UDrawArg.js";

/**
 * 데이터 `캐시`를 저장하는 객체
 * @summary 데이터 `캐시`를 저장하는 객체
 *
 * @example
 * const cache = new UCache();
 *
 * @ignore
 */
declare class UCache {
    /** @type {boolean} */
    _enabled: boolean;
    /** @type {Record<string, any>} */
    _items: Record<string, any>;
    /**
     * 캐시에 key로 저장된 아이템이 있는지 확인하는 메서드
     * @param {string} key 캐시 key
     * @returns {boolean} 아이템 존재 여부
     */
    has(key: string): boolean;
    /**
     * tile key와 title을 조합해 캐시 key를 생성하는 메서드
     * @param {{getKey: () => string}} tile key를 생성할 tile 객체
     * @param {string} [title] key에 추가할 title
     * @returns {string} 생성된 캐시 key
     */
    createKeyByTile(tile: {
        getKey: () => string;
    }, title?: string): string;
    /**
     * x, y, level과 title을 조합해 캐시 key를 생성하는 메서드
     * @param {number|string} x x 좌표 또는 인덱스
     * @param {number|string} y y 좌표 또는 인덱스
     * @param {number|string} level 레벨
     * @param {string} [title] key에 추가할 title
     * @returns {string} 생성된 캐시 key
     */
    createKey(x: number | string, y: number | string, level: number | string, title?: string): string;
    /**
     * 캐시 key를 '_' 기준으로 분리하는 메서드
     * @param {string} key 캐시 key
     * @returns {Array<string>} 분리된 key 조각 목록
     */
    decodeKey(key: string): Array<string>;
    /**
     * 캐시 key 목록을 반환하는 메서드
     * @returns {Array<string>} 캐시 key 목록
     */
    getKeys(): Array<string>;
    /**
     * key의 타일 영역이 지정 위치와 제한 거리 안에 포함되는지 확인하는 메서드
     * @param {string} key 캐시 key
     * @param {import('three').Vector3} position 비교할 위치
     * @param {number | undefined} limit 제한 거리
     * @param {import('@UDrawArg').UDrawArg} drawArg drawarg
     * @param {number} [maxHeight=9999] 타일 영역의 최대 높이
     * @returns {boolean} 제한 거리 포함 여부
     */
    containByPosition(key: string, position: three.Vector3, limit: number | undefined, drawArg: UDrawArg, maxHeight?: number): boolean;
    /**
     * 캐시에 아이템을 추가하는 메서드
     * @param {string} key 캐시 key
     * @param {any} item 저장할 아이템
     */
    add(key: string, item: any): void;
    /**
     * 캐시에 저장된 아이템을 반환하는 메서드
     * @param {string} key 캐시 key
     * @returns {any | undefined} 저장된 아이템
     */
    get(key: string): any | undefined;
    /**
     * 캐시에 저장된 아이템 목록을 반환하는 메서드
     * @returns {Array<any>} 저장된 아이템 목록
     */
    items(): Array<any>;
    /**
     * 캐시 key 목록을 반환하는 메서드
     * @returns {Array<string>} 캐시 key 목록
     */
    keys(): Array<string>;
    /**
     * 캐시에서 key에 해당하는 아이템을 삭제하는 메서드
     * @param {string} key 삭제할 캐시 key
     */
    remove(key: string): void;
    /**
     * 캐시를 모두 비우는 메서드
     */
    clear(): void;
    /**
     * 캐시에서 key에 해당하는 아이템을 삭제하고 콜백을 실행하는 메서드
     * @param {any} self 콜백 실행 시 this로 사용할 객체
     * @param {string} key 삭제할 캐시 key
     * @param {Function} [func] 삭제할 항목을 하나만 전달받아 제거 전에 실행할 콜백
     */
    delete(self: any, key: string, func?: Function): void;
    /**
     * 캐시에 저장된 모든 아이템을 삭제하고 콜백을 실행하는 메서드
     * @param {any} self 콜백 실행 시 this로 사용할 객체
     * @param {Function} [func] 각 삭제 항목을 하나씩 전달받아 제거 전에 실행할 콜백
     */
    deleteAll(self: any, func?: Function): void;
}

export type { UCache };
