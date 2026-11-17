// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U2dGeometry } from "../geometry/U2dGeometry.js";
import type { Double_Array, KeyValue, Triple_Array } from "../types/global.js";
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
    /**
     * 평탄 좌표의 공유·복원과 타일별 교체를 관리하는 공통 입력을 만듭니다.
     * 완성된 측정 피처는 레이어의 등록 단계에서 생성하며 여기서는 생성하지 않습니다.
     * @template {{id: string | number}} T
     * @param {UMeasureCoordinateSource} source 좌표와 속성을 소유한 원본입니다.
     * @param {T} feature 표시 식별자와 메타데이터를 구성한 입력 객체입니다.
     * @param {string} type GeoJSON 형상 종류입니다.
     * @param {string} [styleType=type] 기존 스타일 함수가 관찰할 원본 종류입니다.
     * @returns {T & UMeasureCoordinateFeature} 같은 입력 객체에 좌표 접근을 연결한 결과입니다.
     *
     * @ignore
     */
    static _createCoordinateFeature<T extends {
        id: string | number;
    }>(source: UMeasureCoordinateSource, feature: T, type: string, styleType?: string): T & UMeasureCoordinateFeature;
    constructor(opt?: {});
    /**
     * 지연 좌표 상태를 교체하거나 기존 참조를 해제합니다.
     * @param {Float64Array | undefined} value 새 내부 좌표입니다.
     *
     * @ignore
     */
    set _flatCoordinates(value: Float64Array | undefined);
    /**
     * 내부 데칼 입력으로 쓸 수 있는 불변 좌표를 읽으며 공개 벡터 조회 뒤에는 비어 있습니다.
     * @returns {Float64Array | undefined} 아직 객체로 복원하지 않은 좌표입니다.
     *
     * @ignore
     */
    get _flatCoordinates(): Float64Array | undefined;
    /**
     * 같은 원본 대표와 표시 조각만 지연 벡터 상태를 공유합니다. 서로 다른 타일은 공유하지 않습니다.
     * @param {UMeasureFeature} feature 승인한 표시 조각입니다.
     *
     * @ignore
     */
    _shareFlatCoordinates(feature: UMeasureFeature): void;
    _measureVectors: any;
    /**
     * @type {UMeasureFeatureExtent | undefined}
     */
    _extent: UMeasureFeatureExtent | undefined;
    _uid: string;
    _worldExtent: any;
    _geometry: any;
    /**
     * 공개 편집용 형상과 분리한 읽기 전용 검색 스냅샷입니다.
     *
     * @type {OLGeometry | undefined}
     *
     */
    _searchGeometry: OLGeometry | undefined;
    _srs: any;
    _type: any;
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
     * 연결된 원본 형상을 반환하며 공유 검색 형상은 최초 공개 조회에서 독립 복제합니다.
     * @returns 원본 또는 이 피처만 수정할 수 있는 형상이며 없으면 undefined입니다.
     */
    getGeometry(): any;
    /**
     * 내부 검색에서는 공개 편집용 형상을 만들지 않고 현재 형상을 읽습니다.
     * @returns 변경하지 않고 읽을 검색 형상이며 없으면 undefined입니다.
     * @ignore
     */
    _getSearchGeometry(): any;
    /**
     * 원본 geometry를 교체하고 표시 데이터의 변경 번호를 갱신합니다.
     * @param {OLGeometry | null | undefined} geometry 새 원본 형상입니다.
     */
    setGeometry(geometry: OLGeometry | null | undefined): void;
    getExtent(): UMeasureFeatureExtent;
    setExtent(box: any): void;
    getWorldExtent(): any;
    setWorldExtent(box: any): void;
    /**
     * 측정 좌표를 지도 좌표로 변환하며 지연 좌표가 있으면 먼저 복원합니다.
     * @returns {Array<import('three').Vector3>} 변환한 좌표 목록입니다.
     */
    getGoogleCoordinates(): Array<three.Vector3>;
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

/**
     * 평탄 XY 파트를 보관하는 좌표 입력 원본입니다. 공개 좌표 복원은 같은 원본을 사용하는 입력끼리 공유합니다.
     */
    type UMeasureCoordinateSource = {
        /**
         * 복원한 GeoJSON 좌표입니다.
         */
        coordinates: Array<number> | Double_Array<number> | Triple_Array<number> | Array<Triple_Array<number>>;
        /**
         * 아직 복원하지 않은 XY 파트입니다.
         */
        _flatCoordinates?: Array<Float64Array>;
        /**
         * 원본 속성입니다.
         */
        properties: KeyValue;
    };

/**
     * 공통 피처 준비에 전달하는 지연 좌표 형상입니다.
     */
    type UMeasureCoordinateGeometry = {
        /**
         * GeoJSON 형상 종류입니다.
         */
        type: string;
        /**
         * 공개 조회·교체 좌표입니다.
         */
        coordinates: UMeasureCoordinateSource["coordinates"];
        /**
         * 점 버퍼의 월드 반경입니다.
         */
        radius?: number;
        /**
         * 원본에서 선택한 표시 링 번호입니다.
         */
        _coordinatePartIndex: number | undefined;
        /**
         * 내부 검색에 사용하는 원본 파트입니다.
         */
        _getCoordinateParts: () => Array<Float64Array> | undefined;
        /**
         * 표시할 단일 파트입니다.
         */
        _getFlatCoordinates: () => Float64Array | undefined;
        /**
         * 원본을 공유하는 표시 링을 만듭니다.
         */
        _createPart: (index: number) => UMeasureCoordinateGeometry;
    };

/**
     * 원본 형식과 무관하게 스타일·표시 준비에 전달하는 입력 피처입니다. 완성된 UMeasureFeature와는 수명이 다릅니다.
     */
    type UMeasureCoordinateFeature = {
        /**
         * 입력 피처 식별자입니다.
         */
        id: string | number;
        /**
         * 원본 속성입니다.
         */
        properties: KeyValue;
        /**
         * 지연 좌표 형상입니다.
         */
        geometry: UMeasureCoordinateGeometry;
        /**
         * 현재 입력 객체의 식별자를 반환합니다.
         */
        getId: () => string | number;
        /**
         * 속성값을 반환합니다.
         */
        get: (key: string) => unknown;
        /**
         * 속성 원본을 반환합니다.
         */
        getProperties: () => KeyValue;
        /**
         * 스타일용 원본 형상 종류를 반환합니다.
         */
        getGeometry: () => {
            getType: () => string;
        };
    };

export type { UMeasureCoordinateFeature, UMeasureCoordinateGeometry, UMeasureCoordinateSource, UMeasureFeature, UMeasureFeatureExtent };
