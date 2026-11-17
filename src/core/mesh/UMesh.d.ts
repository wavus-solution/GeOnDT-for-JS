// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../../3dLayer/U3dLayer.js";
import type { U3dObjectCO } from "../U3dObject.js";
import type { UMeta } from "../../meta/UMeta.js";
import type { U3dQuadTile } from "../../quadtree/U3dQuadTile.js";

/**
 * ~extends import('@U3dObject').U3dObjectCO <br>
 */
type UMeshCO_Content = {
    utype?: number;
    bbox?: three.Box3;
    tile?: U3dQuadTile | undefined | null;
};

/**
 * ~extends import('@U3dObject').U3dObjectCO <br>
 */
type UMeshCO = Omit<Omit<U3dObjectCO, never> & UMeshCO_Content, never>;

/**
 * ~extends import('@U3dObject').U3dObjectCO <br>
 *
 * @typedef {object} UMeshCO_Content
 * @property {number} [utype]
 * @property {import('three').Box3} [bbox]
 * @property {import('@U3dQuadTile').U3dQuadTile | undefined | null} [tile]
 *
 * @memberOf UMesh
 * @inner
 *
 * @typedef {Omit<import('@U3dObject').U3dObjectCO, never> & UMeshCO_Content} UMeshCO
 */
/**
 * ~extends import('three').Mesh <br>
 * 메쉬 추가기능 래퍼
 */
declare class UMesh extends three.Mesh<three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, three.Material<three.MaterialEventMap> | three.Material<three.MaterialEventMap>[], three.Object3DEventMap> {
    /**
     * 엔진이 자동 재로딩하는 원본 계층에 데이터 사용자·배치·자식 경로로 puid를 부여합니다.
     * 일반 파일 로딩·사용자 배치·공유 렌더 묶음의 등록에는 호출하지 않습니다.
     * 호출자는 보조 객체 추가·재부모화 전에 원본 계층을 전달해야 합니다. 같은 원본을
     * 다른 곳에 배치하면 usageId를 달리하며, 기존 객체의 변환·스타일 변경에는 호출하지 않습니다.
     * Mesh뿐 아니라 선택 단위로 사용되는 원본 그룹도 별도의 식별값을 받습니다.
     *
     * @param {string} ownerId 데이터를 관리하는 주체의 식별값
     * @param {string | number} dataId 원본 데이터 식별값
     * @param {import('three').Object3D} root 등록할 원본 계층
     * @param {string | number} usageId 같은 데이터를 사용하는 배치의 식별값
     * @throws {TypeError} 식별값이 puid 생성 조건에 맞지 않는 경우
     *
     * @ignore
     */
    static _assignPuids(ownerId: string, dataId: string | number, root: three.Object3D, usageId: string | number): void;
    /**
     * 현재 객체를 조회·편집하기 위한 키를 반환합니다.
     * 자동 재로딩 데이터는 puid, 그 밖의 객체는 현재 인스턴스의 uuid를 사용합니다.
     * uuid는 객체 교체 뒤 상태를 이어 주지 않으며 puid 속성에 저장하지 않습니다.
     * 재로딩 구독 여부는 이 반환값이 아니라 대상의 puid 유무로 판단해야 합니다.
     *
     * @param {import('three').Object3D & Partial<{puid: string}>} object 식별할 현재 객체
     * @returns {string} 영속 데이터 키 또는 현재 객체의 런타임 키
     *
     * @ignore
     */
    static _getObjectId(object: three.Object3D & Partial<{
        puid: string;
    }>): string;
    /**
     * 데이터 사용자·데이터·사용 메시 식별자로 충돌 없는 영속 키를 구성합니다.
     * 데이터 사용자는 데이터를 로드하여 메시를 관리하는 레이어·분석 객체 등을 뜻합니다.
     * 사용자 계정이 아니며, 이름이 같은 서로 다른 종류의 주체도 ownerId로 구분해야 합니다.
     * 식별값은 로딩 순서나 런타임 uuid가 아닌 원본과 배치의 안정된 값을 사용합니다.
     * 같은 데이터를 반복 배치하면 meshId에 배치와 부품을 함께 구분하는 키가 필요합니다.
     * 숫자 0과 빈 문자열도 명시적으로 제공한 식별값이며 문자열과 숫자는 구분합니다.
     *
     * @param {string} ownerId 같은 앱에서 데이터 사용자 간 유일하고 재로딩 동안 유지되는 주체 식별값
     * @param {string | number} dataId 데이터 사용자가 정한 원본 데이터 식별값
     * @param {string | number} meshId 같은 데이터의 독립적인 배치·부품을 구분하는 안정된 사용 메시 식별값
     * @returns {string} 데이터 사용자까지 구분하는 불투명 식별 키
     * @throws {TypeError} 데이터 사용자 식별값이 비어 있거나 식별값이 문자열·안전 정수가 아니거나 음의 0인 경우
     *
     * @ignore
     */
    static _createPuid(ownerId: string, dataId: string | number, meshId: string | number): string;
    /**
     * @param {import('three').BufferGeometry} geometry
     * @param {import('three').Material} material
     * @param {UMeshCO} [opt={}]
     */
    constructor(geometry: three.BufferGeometry, material: three.Material, opt?: UMeshCO);
    /**
     * 엔진이 자동 해제·재로딩하는 데이터 대상의 영속 식별자입니다.
     * 같은 주체가 동일 데이터·부품을 다시 표시할 때 선택·편집 상태를 연결하는 데 사용합니다.
     * 일반 사용자 모델·배치와 공유 렌더 자원에는 부여하지 않습니다.
     * 기반 copy/clone은 이 값을 복사하지 않으며 자동 재로딩 대상의 관리 주체만 등록합니다.
     * 적용 대상이 아닌 메시는 undefined이며, Three.js id·uuid를 이 속성에 넣지 않습니다.
     * userData.oid 같은 원본 데이터 속성과 별개이며, 서로 다른 LOD의 연결은 레이어가 담당합니다.
     * 장면에 등록된 메시의 식별자는 외부에서 변경하지 마십시오.
     *
     * @type {string | undefined}
     */
    puid: string | undefined;
    /** @type {string} */ _classtype: string;
    /** @type {boolean} */ _disposed: boolean;
    /** @type {number|undefined} */ _utype: number | undefined;
    /** @type {string|undefined} */ _ulayername: string | undefined;
    /** @type {import('three').Sphere | undefined} */ _sphere: three.Sphere | undefined;
    /** @type {import('three').Box3 | undefined} */ _bbox: three.Box3 | undefined;
    /** @type {import('@U3dQuadTile').U3dQuadTile | undefined} */ _tile: U3dQuadTile | undefined;
    /** @type {any} */ _opt: any;
    /** @type {any} */ _uproperties: any;
    /** @type {any} */ _metaDataGroupName: any;
    /** @type {any} */ _uMemoryMaterialName: any;
    /** @type {import('@UMeta').UMeta | null| undefined} */ _meta: UMeta | null | undefined;
    name: any;
    _intersect: any;
    onBeforeRender: (...args: any[]) => void;
    /**
     * 렌더 직전 콜백을 이름으로 등록합니다. 같은 이름은 새 콜백으로 교체됩니다.
     * @param {string} key 콜백 식별키
     * @param {function} callback 렌더 직전 콜백
     */
    addBeforeRenderCallback(key: string, callback: Function): void;
    _beforeRenderCallbacks: Map<any, any>;
    /**
     * 등록된 렌더 직전 콜백을 제거합니다.
     * @param {string} key 콜백 식별키
     */
    removeBeforeRenderCallback(key: string): void;
    getTile(): U3dQuadTile;
    getParent(): three.Object3D<three.Object3DEventMap>;
    getVertexes(isAbsolute: any): number[] | NonNullable<three.BufferAttribute<three.BufferAttributeEventMap> | three.InterleavedBufferAttribute>;
    getAbsoluteVertex(vertexX: any, vertexY: any, vertexZ: any): three.Vector3;
    traverseFace(callback: any): void;
    getMaterialIndexAsFace(face: any): number;
    getNormalAsFace(face: any): any[];
    getVertexAsFace(face: any, isAbsolute: any): any[];
    getMetaDataGroupName(): any;
    getUType(): number;
    setUType(type: any): void;
    setType(type: any): void;
    getType(): number;
    distanceToCameraPosition(vec3: any, useSphere: any): number;
    /**
     * 객체가 렌더링 될때, 투명도를 조절하여 서서히 생성되는 애니메이션을 설정한다.
     * @param {import('@U3dLayer').U3dLayer} layer
     * @param {number} [min=0.3]
     * @param {number} [max=1]
     */
    animationOpacity(layer: U3dLayer, min?: number, max?: number): void;
    /**
     * 객체의 바운딩박스를 다시 계산한다.
     */
    computeBoundingBox(): void;
    /**
     * 객체의 바운딩박스를 반환한다.
     * @return {import('three').Box3}
     */
    getBoundingBox(): three.Box3;
    /**
     * 객체의 바운딩박스를 반환한다.
     * @return {import('three').Box3}
     */
    getBBox(): three.Box3;
    raycast(a: any, b: any): void;
    /**
     * 현재 메시의 조회·편집용 식별값을 반환합니다.
     * 자동 재로딩 대상은 puid, 일반 메시는 현재 인스턴스의 uuid를 반환합니다.
     * 반환된 uuid는 새 객체로 승계되지 않으며 영속 식별자가 아닙니다.
     *
     * @returns {string} puid 또는 현재 메시의 uuid
     */
    getUid(): string;
    /**
     * 원본 데이터를 추적하기 위한 피처 속성을 반환합니다. 엔진의 메시 식별에는 사용하지 않습니다.
     *
     * @returns {string | number | Array<number> | undefined} 원본 oid 속성 또는 속성이 없는 상태의 undefined
     */
    getOid(): string | number | Array<number> | undefined;
    getLayerName(): string;
    setLayerName(layername: any): void;
    getColor(): any;
    setColor(color: any): void;
    getOpacity(): any;
    setOpacity(opacity: any): void;
    setLabelText(labelText: any): void;
    getLabel(): any;
    setBrightness(input: any): void;
    hasReachedShadowTime(updateTime: any): boolean;
    applyShadow(apply: any, updateTime: any): void;
    #private;
}

export type { UMesh, UMeshCO, UMeshCO_Content };
