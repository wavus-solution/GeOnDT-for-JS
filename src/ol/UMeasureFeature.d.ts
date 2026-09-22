// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

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
    _uid: any;
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
    set uid(uid: any);
    get uid(): any;
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
    set measureVectors(vectors: any);
    get measureVectors(): any;
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
    getGeometry(): any;
    setGeometry(geometry: any): void;
    getExtent(): UMeasureFeatureExtent;
    setExtent(box: any): void;
    getWorldExtent(): any;
    setWorldExtent(box: any): void;
    getGoogleCoordinates(): any[];
    getType(): any;
    setType(type: any): void;
    getMeasureVectors(): any;
    /**
     * 측정 좌표를 교체하고 geometry revision을 증가시킵니다.
     *
     * @param {Array<import('three').Vector3>} vectors 새 측정 좌표 목록입니다.
     */
    setMeasureVectors(vectors: Array<three.Vector3>): void;
    getUid(): any;
    setUid(uid: any): void;
    getId(): any;
    setId(id: any): void;
    setOLFeature(olFeature: any): void;
    getOLFeature(): any;
    getStyle(): any;
    setStyle(style: any): void;
    getProperties(): any;
    setProperties(properties: any): void;
    updateMeasureData(opt?: {}): this;
    applyTypedMeasureData(opt?: {}): this;
    applyRuntimeState(opt?: {}): this;
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
