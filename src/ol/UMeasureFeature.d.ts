// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U2dGeometry } from "../geometry/U2dGeometry.js";
import type { OLGeometry } from "../types/ol.js";

type UMeasureFeatureExtent = {
    min: three.Vector3Like;
    max: three.Vector3Like;
    getCenter: Function;
};

/**
 * @memberof UMeasureFeature
 * @inner
 *
 * @typedef {object} UMeasureFeatureExtent
 * @property {import('three').Vector3Like} min
 * @property {import('three').Vector3Like} max
 * @property {function} getCenter
 */
declare class UMeasureFeature {
    constructor(opt?: {});
    /**
     * @type {UMeasureFeatureExtent | undefined}
     */
    _extent: UMeasureFeatureExtent | undefined;
    _uid: string;
    _worldExtent: any;
    _geometry: any;
    _srs: any;
    _type: any;
    _measureVectors: any;
    _fid: any;
    _olFeature: any;
    _style: any;
    _properties: any;
    _drawArg: any;
    _nonChanged: any;
    _excludeSearch: any;
    _styleRevision: any;
    _revision: any;
    _geometryRevision: any;
    _propertyRevision: any;
    _drawSequence: any;
    _isInner: any;
    set uid(uid: string);
    get uid(): string;
    set extent(box: UMeasureFeatureExtent);
    get extent(): UMeasureFeatureExtent;
    set worldExtent(box: any);
    get worldExtent(): any;
    set geometry(geometry: any);
    get geometry(): any;
    set geometryRevision(revision: number);
    get geometryRevision(): number;
    set srs(srs: any);
    get srs(): any;
    set type(type: any);
    get type(): any;
    set measureVectors(vectors: three.Vector3[]);
    get measureVectors(): three.Vector3[];
    set fid(id: any);
    get fid(): any;
    set olFeature(olFeature: any);
    get olFeature(): any;
    set style(style: any);
    get style(): any;
    set propertyRevision(revision: number);
    get propertyRevision(): number;
    set oriStyle(style: any);
    get oriStyle(): any;
    _oriStyle: any;
    set properties(properties: any);
    get properties(): any;
    set drawArg(drawArg: any);
    get drawArg(): any;
    set nonChanged(val: any);
    get nonChanged(): any;
    set excludeSearch(val: boolean);
    get excludeSearch(): boolean;
    set styleRevision(revision: any);
    get styleRevision(): any;
    set revision(revision: number);
    get revision(): number;
    set drawSequence(sequence: any);
    get drawSequence(): any;
    set isInner(isInner: any);
    get isInner(): any;
    /**
     * 연결된 원본 OpenLayers geometry를 반환하며 원본 메서드를 변경하지 않습니다.
     * @returns 현재 원본 OpenLayers 형상이며, 연결된 형상이 없으면 undefined입니다.
     */
    getGeometry(): any;
    /**
     * 원본 geometry를 교체하고 표시 데이터의 변경 번호를 갱신합니다.
     * @param {OLGeometry | null | undefined} geometry 새 원본 형상입니다.
     */
    setGeometry(geometry: OLGeometry | null | undefined): void;
    getExtent(): UMeasureFeatureExtent;
    setExtent(box: any): void;
    getWorldExtent(): any;
    setWorldExtent(box: any): void;
    getGoogleCoordinates(): any[];
    getType(): any;
    setType(type: any): void;
    /**
     * 도형의 월드 좌표 목록을 반환합니다.
     *
     * @returns {Array<import('three').Vector3>} 내부 좌표 목록의 원본 참조입니다.
     */
    getMeasureVectors(): Array<three.Vector3>;
    /**
     * 측정 좌표를 교체하고 geometry revision을 증가시킵니다.
     *
     * @param {Array<import('three').Vector3>} vectors 새 측정 좌표 목록입니다.
     */
    setMeasureVectors(vectors: Array<three.Vector3>): void;
    getUid(): string;
    setUid(uid: any): void;
    getId(): any;
    setId(id: any): void;
    setOLFeature(olFeature: any): void;
    getOLFeature(): any;
    /**
     * 현재 레이어의 원본 대표 매개체를 반환합니다.
     *
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 연결된 원본 대표 매개체이며, 연결이 없으면 undefined입니다.
     *
     * @ignore
     */
    _getSourceMeasure(): UMeasureFeature | undefined;
    /**
     * 연결된 원본 피처를 반환합니다. 전체 원본이 준비되면 그 피처를 우선합니다.
     * @returns {object | undefined} 원본 피처입니다.
     */
    getSourceFeature(): object | undefined;
    /**
     * 이미 연결된 원본 도형을 반환하며 조회만으로 도형이나 요청을 생성하지 않습니다.
     * @returns {import('@U2dGeometry').U2dGeometry | undefined} 원본 도형입니다.
     */
    getSourceGeometry(): U2dGeometry | undefined;
    /**
     * 필요한 경우 앱의 원본 제공자를 호출하고 동일 피처의 도형을 재사용합니다.
     *
     * @returns {Promise<import('@U2dGeometry').U2dGeometry | undefined>} 준비된 원본 도형입니다.
     */
    loadSourceGeometry(): Promise<U2dGeometry | undefined>;
    getStyle(): any;
    /**
     * 스타일을 지정하고 등록된 원본의 편집 창구에 변경을 전달합니다.
     *
     * @param {object} style 적용할 스타일입니다.
     * @param {boolean} [notify=true] 내부 표시 상태 반영에서는 변경 전달을 생략합니다.
     * @throws {Error} 해제되었거나 안정 식별자가 없는 타일 피처를 편집하면 발생합니다.
     */
    setStyle(style: object, notify?: boolean): void;
    getProperties(): any;
    setProperties(properties: any): void;
    updateMeasureData(opt?: {}): this;
    applyTypedMeasureData(opt?: {}): this;
    applyRuntimeState(opt?: {}): this;
    /** 원본의 현재 상태를 연결된 레이어에 다시 전달합니다. */
    changed(): void;
    getNonChanged(): any;
    setNonChanged(val: any): void;
    getExcludeSearch(): boolean;
    setExcludeSearch(val: any): void;
    getStyleRevision(): any;
    setStyleRevision(revision: any): void;
    getRevision(): number;
    setRevision(revision: any): any;
    bumpRevision(): any;
    /**
     * geometry 전용 revision을 반환합니다.
     *
     * @returns {number} geometry revision입니다.
     */
    getGeometryRevision(): number;
    /**
     * geometry 전용 revision을 설정합니다.
     *
     * @param {number} revision 설정할 revision입니다.
     * @returns {number} 설정된 revision입니다.
     */
    setGeometryRevision(revision: number): number;
    /**
     * geometry 전용 revision을 증가시킵니다.
     *
     * @returns {number} 증가된 revision입니다.
     */
    bumpGeometryRevision(): number;
    /**
     * property 전용 revision을 반환합니다.
     *
     * @returns {number} property revision입니다.
     */
    getPropertyRevision(): number;
    /**
     * property 전용 revision을 설정합니다.
     *
     * @param {number} revision 설정할 revision입니다.
     * @returns {number} 설정된 revision입니다.
     */
    setPropertyRevision(revision: number): number;
    /**
     * property 전용 revision을 증가시킵니다.
     *
     * @returns {number} 증가된 revision입니다.
     */
    bumpPropertyRevision(): number;
    /**
     * hole 상태를 설정하고 실제 변경 시 property revision을 증가시킵니다.
     *
     * @param {boolean} isInner hole 여부입니다.
     * @returns {boolean} 설정된 hole 여부입니다.
     */
    setInner(isInner: boolean): boolean;
    getDrawSequence(): any;
    setDrawSequence(sequence: any): any;
    ensureDrawSequence(sequence: any): any;
    #private;
}

export type { UMeasureFeature, UMeasureFeatureExtent };
