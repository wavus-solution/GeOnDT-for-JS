import {Guid} from '@union3d/util/Guid';
import {UDEF} from '@union3d/core/UDEF';
import {defined} from '@util/defined';
import {ol} from '@union3d/lib/ol/ol-debug.js';

import * as THREE from "three";
import {INTERNAL} from '@union3d/ol/UMeasureFeature.internal';

let MEASURE_FEATURE_REVISION_SEQUENCE = 0;

/**
 * @memberof UMeasureFeature
 * @inner
 *
 * @typedef {object} UMeasureFeatureExtent
 * @property {import('three').Vector3Like} min
 * @property {import('three').Vector3Like} max
 * @property {function} getCenter
 */

class UMeasureFeature {

    /**
     * @type {UMeasureFeatureExtent | undefined}
     */
    _extent = undefined;

    constructor(opt = {}) {
        const self = this;
        self.#create(opt)
        const initialGeometryRevision = self._geometryRevision;
        const initialPropertyRevision = self._propertyRevision;
        self._uid = Guid();

        if(self._style){
            self.setStyle(self._style);
        }
        self.setNonChanged(self._nonChanged);
        self.setExcludeSearch(self._excludeSearch);
        self.setStyleRevision(self._styleRevision);
        self.setRevision(self._revision);
        if (Number.isFinite(self._drawSequence)) {
            self.setDrawSequence(self._drawSequence);
        }
        self.setGeometryRevision(initialGeometryRevision);
        self.setPropertyRevision(initialPropertyRevision);
        const geometry = self.getGeometry();
        if (geometry && !(geometry instanceof ol.geom.Geometry)) self.#setMeasureFunction(geometry);
        else INTERNAL.registerGeometryCoordinates(self, geometry?.intersectsExtent, UMeasureFeature.prototype.getGoogleCoordinates);
    }

    #create(opt){
        const self = this;
        const sourceFeature = opt.sourceFeature ?? opt.feature;
        const olFeature = hasOwn(opt, 'olFeature') ? opt.olFeature : sourceFeature;
        const fid = hasOwn(opt, 'fid')
            ? opt.fid
            : sourceFeature?.getId?.() ?? sourceFeature?.id ?? sourceFeature?.ol_uid;

        const properties = hasOwn(opt, 'properties')
            ? opt.properties
            : sourceFeature?.getProperties?.() ?? sourceFeature?.properties;
        const revisionSeed = ++MEASURE_FEATURE_REVISION_SEQUENCE;


        self._extent = opt.extent ?? undefined;
        self._worldExtent = opt.worldExtent ?? undefined;
        self._geometry = opt.geometry ?? undefined;
        self._srs = opt.srs ?? undefined;
        self._type = opt.type ?? undefined;
        self._measureVectors = opt.measureVectors ?? [];
        self._fid = fid?? undefined;
        self._olFeature = olFeature ?? undefined;
        self._style = hasOwn(opt, 'style') ? opt.style : sourceFeature?._style;
        self._properties = properties ?? undefined;
     //   self._googleVectors = opt.googleVectors ?? [];
        self._drawArg = opt.drawArg?? undefined;
        self._nonChanged = hasOwn(opt, 'nonChanged') ? opt.nonChanged : sourceFeature?._nonChanged ?? false;
        self._excludeSearch = hasOwn(opt, 'excludeSearch') ? opt.excludeSearch : sourceFeature?._excludeSearch?? false;
        self._styleRevision = hasOwn(opt, 'styleRevision') ? opt.styleRevision : sourceFeature?._styleRevision;
        self._revision = hasOwn(opt, 'revision') ? opt.revision : sourceFeature?._revision ?? 0;
        self._geometryRevision = hasOwn(opt, 'geometryRevision')
            ? opt.geometryRevision
            : sourceFeature?._geometryRevision ?? revisionSeed;
        self._propertyRevision = hasOwn(opt, 'propertyRevision')
            ? opt.propertyRevision
            : sourceFeature?._propertyRevision ?? revisionSeed;
        self._drawSequence = hasOwn(opt, 'drawSequence') ? opt.drawSequence : sourceFeature?._drawSequence;
        self._isInner =  hasOwn(opt, 'isInner') ? opt.isInner : sourceFeature?._isInner?? false;
    }

    get uid() {
        return this.getUid();
    }

    set uid(uid) {
        this.setUid(uid);
    }

    get extent() {
        return this.getExtent();
    }

    set extent(box) {
        this.setExtent(box);
    }

    get worldExtent() {
        return this.getWorldExtent();
    }

    set worldExtent(box) {
        this.setWorldExtent(box);
    }

    get geometry() {
        return this.getGeometry();
    }

    set geometry(geometry) {
        this.setGeometry(geometry);
    }

    get geometryRevision() {
        return this.getGeometryRevision();
    }

    set geometryRevision(revision) {
        this.setGeometryRevision(revision);
    }

    get srs() {
        return this._srs;
    }

    set srs(srs) {
        this._srs = srs;
    }

    get type() {
        return this.getType();
    }

    set type(type) {
        this.setType(type);
    }

    get measureVectors() {
        return this.getMeasureVectors();
    }

    set measureVectors(vectors) {
        this.setMeasureVectors(vectors);
    }

    get fid() {
        return this.getId();
    }

    set fid(id) {
        this.setId(id);
    }

    get olFeature() {
        return this.getOLFeature();
    }

    set olFeature(olFeature) {
        this.setOLFeature(olFeature);
    }

    get style() {
        return this.getStyle();
    }

    set style(style) {
        this.setStyle(style);
    }

    get propertyRevision() {
        return this.getPropertyRevision();
    }

    set propertyRevision(revision) {
        this.setPropertyRevision(revision);
    }

    get oriStyle() {
        return this._oriStyle;
    }

    set oriStyle(style) {
        this._oriStyle = style;
    }

    get properties() {
        return this.getProperties();
    }

    set properties(properties) {
        this.setProperties(properties);
    }

    get drawArg() {
        return this._drawArg;
    }

    set drawArg(drawArg) {
        this._drawArg = drawArg;
    }

    get nonChanged() {
        return this.getNonChanged();
    }

    set nonChanged(val) {
        this.setNonChanged(val);
    }

    get excludeSearch() {
        return this.getExcludeSearch();
    }

    set excludeSearch(val) {
        this.setExcludeSearch(val);
    }

    get styleRevision() {
        return this.getStyleRevision();
    }

    set styleRevision(revision) {
        this.setStyleRevision(revision);
    }

    get revision() {
        return this.getRevision();
    }

    set revision(revision) {
        this.setRevision(revision);
    }

    get drawSequence() {
        return this.getDrawSequence();
    }

    set drawSequence(sequence) {
        this.setDrawSequence(sequence);
    }

    get isInner() {
        return this._isInner;
    }

    set isInner(isInner) {
        this.setInner(isInner);
    }

    /**
     * 기존 THREE 형상 입력에만 호환 함수를 연결하고 타일 좌표 판정을 재사용합니다.
     * 원본 OpenLayers 형상은 이 경로에 전달하지 않아 고유 메서드를 유지합니다.
     *
     * @param {object} geometry 호환 메서드를 연결할 측정 형상입니다.
     */
    #setMeasureFunction(geometry){
        const self = this;
        geometry.intersectsExtent = function (list) {
            //list : [lb.x, lb.y, rt.x, rt.y] , EPSG:3857
            if(self._measureVectors && self._measureVectors.length < 2){
                return false;
            }
            if(self._type === UDEF.MEASURE_TYPE.LINESTRING){
                return isLineIntersectingExtent(INTERNAL.getTileCoordinates(self), list);
            } else if(self._type === UDEF.MEASURE_TYPE.POLYGON || self._type === UDEF.MEASURE_TYPE.MULTIPOLYGON){
                return isPolygonIntersectingExtent(INTERNAL.getTileCoordinates(self), list);
            } else if (self._type === UDEF.MEASURE_TYPE.POINTBUFFER){
                const vectors = INTERNAL.getTileCoordinates(self);
                const center = vectors[0];
                const edgePoint = vectors[vectors.length - 1];
                const radius = center.distanceTo(edgePoint);
                return isCircleIntersectingExtent(center, radius, list);
            }
            return false;
        }

        INTERNAL.registerGeometryCoordinates(self, geometry.intersectsExtent, UMeasureFeature.prototype.getGoogleCoordinates);

        geometry.setCoordinates = (coord) => {
            if (self.getType() === UDEF.MEASURE_TYPE.POLYGON) {
                geometry.setFromPoints(coord);
            }
            self.setMeasureVectors(coord);
        }
        geometry.getFeature = function(){
            return self;
        }
        geometry.getExtent = function (){
            return self.getExtent();
        }

    }

    /**
     * 연결된 원본 OpenLayers geometry를 반환하며 원본 메서드를 변경하지 않습니다.
     * @returns 현재 원본 OpenLayers 형상이며, 연결된 형상이 없으면 undefined입니다.
     */
    getGeometry() {
        const geometry = this._olFeature?.getGeometry?.();
        return geometry instanceof ol.geom.Geometry ? geometry : this._geometry ?? undefined;
    }

    /**
     * 원본 geometry를 교체하고 표시 데이터의 변경 번호를 갱신합니다.
     * @param {OLGeometry | null | undefined} geometry 새 원본 형상입니다.
     */
    setGeometry(geometry) {
        if (this._geometry === geometry) return;
        this._geometry = geometry;
        if (this._olFeature instanceof ol.Feature && this._olFeature.getGeometry() !== geometry) this._olFeature.setGeometry(geometry);
        if (geometry && !(geometry instanceof ol.geom.Geometry)) this.#setMeasureFunction(geometry);
        else INTERNAL.registerGeometryCoordinates(this, geometry?.intersectsExtent, UMeasureFeature.prototype.getGoogleCoordinates);
        this.bumpGeometryRevision();
        this.bumpRevision();
    }

    getExtent() {
        return this._extent;
    }

    setExtent(box) {
        this._extent = box;
    }

    getWorldExtent() {
        return this._worldExtent;
    }

    setWorldExtent(box) {
        this._worldExtent = box;
    }
    // measureVectors 구글 좌표로 변환하여 반환
    getGoogleCoordinates(){
        const self = this;
       // return self._googleVectors;
        const googleVectors = [];
        if(!self._drawArg) return googleVectors;
        self._measureVectors.forEach(vec =>{
            const vec_ = self._drawArg.getWorldToGoogle(vec.x, vec.y);
            vec_.z = vec.z;
            googleVectors.push(vec_);
        })
        return googleVectors;
    }

    getType() {
        return this._type;
    }

    setType(type) {
        if (this._type === type) return;
        this._type = type;
        this.bumpGeometryRevision();
        this.bumpRevision();
    }

    /**
     * 도형의 월드 좌표 목록을 반환합니다.
     *
     * @returns {Array<import('three').Vector3>} 내부 좌표 목록의 원본 참조입니다.
     */
    getMeasureVectors() {
        return this._measureVectors;
    }

    /**
     * 측정 좌표를 교체하고 geometry revision을 증가시킵니다.
     *
     * @param {Array<import('three').Vector3>} vectors 새 측정 좌표 목록입니다.
     */
    setMeasureVectors(vectors) {
        this._measureVectors = vectors;
        this.bumpGeometryRevision();
        this.bumpRevision();
    }

    getUid() {
        return this._uid;
    }

    setUid(uid) {
        this._uid = uid;
    }

    getId() {
        return this._fid;
    }

    setId(id) {
        this._fid = id;
    }

    setOLFeature(olFeature) {
        this._olFeature = olFeature;
    }

    getOLFeature() {
        return this._olFeature;
    }

    /**
     * 현재 레이어의 원본 대표 매개체를 반환합니다.
     *
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 연결된 원본 대표 매개체이며, 연결이 없으면 undefined입니다.
     *
     * @ignore
     */
    _getSourceMeasure() {
        return this._sourceMeasure ?? (this._sourceContext ? this : undefined);
    }

    /**
     * 연결된 원본 피처를 반환합니다. 전체 원본이 준비되면 그 피처를 우선합니다.
     * @returns {object | undefined} 원본 피처입니다.
     */
    getSourceFeature() {
        const representative = this._getSourceMeasure();
        if (representative) representative._sourceExposed = true;
        return representative?._sourceGeometry?.getFeature() ?? this._olFeature;
    }

    /**
     * 이미 연결된 원본 도형을 반환하며 조회만으로 도형이나 요청을 생성하지 않습니다.
     * @returns {import('@U2dGeometry').U2dGeometry | undefined} 원본 도형입니다.
     */
    getSourceGeometry() {
        const representative = this._getSourceMeasure();
        if (representative) representative._sourceExposed = true;
        return representative?._sourceGeometry;
    }

    /**
     * 필요한 경우 앱의 원본 제공자를 호출하고 동일 피처의 도형을 재사용합니다.
     *
     * @returns {Promise<import('@U2dGeometry').U2dGeometry | undefined>} 준비된 원본 도형입니다.
     */
    loadSourceGeometry() {
        const representative = this._getSourceMeasure();
        if (!representative || representative._disposed) return Promise.resolve(undefined);
        representative._sourceExposed = true;
        return representative._sourceContext.loadSourceGeometry(representative);
    }


    getStyle() {
        return this._style;
    }

    /**
     * 스타일을 지정하고 등록된 원본의 편집 창구에 변경을 전달합니다.
     *
     * @param {object} style 적용할 스타일입니다.
     * @param {boolean} [notify=true] 내부 표시 상태 반영에서는 변경 전달을 생략합니다.
     * @throws {Error} 해제되었거나 안정 식별자가 없는 타일 피처를 편집하면 발생합니다.
     */
    setStyle(style, notify = true) {
        const representative = this._getSourceMeasure();
        if (notify && representative) {
            if (representative._disposed) throw new Error('해제된 피처는 수정할 수 없습니다.');
            if (representative._sourceContext.origin === 'wfs' && !defined(representative._fid)) throw new Error('스타일 편집에는 안정 식별자가 필요합니다.');
            if (!representative._sourceUpdating) representative._sourceContext.setStyle(representative, style);
            return;
        }
        const previousStyle = this._style;
        if(!this._oriStyle){
            this._oriStyle = this._style
        }
        if(style instanceof  ol.style.Style){
            // 호출자가 명시한 투명도입니다. 아래에서 style.fillOpacity/strokeOpacity 에 해석 결과를
            // 되써 넣으므로 그 값은 두 번째 호출부터 신뢰할 수 없습니다. fill_/stroke_ 의 opacity 는
            // 되쓰기 대상이 아니라 호출자의 의도가 그대로 남아 있어 이쪽을 우선합니다.
            const explicitFillOpacity = style.fill_ && Number.isFinite(style.fill_.opacity)
                ? style.fill_.opacity : undefined;
            const explicitStrokeOpacity = style.stroke_ && Number.isFinite(style.stroke_.opacity)
                ? style.stroke_.opacity : undefined;

            let fillColor = style.fillColor || 0xffffff;
            let fillOpacity = explicitFillOpacity
                ?? (Number.isFinite(style.fillOpacity) ? style.fillOpacity : 1);
            let strokeColor = style.strokeColor || 0xffff00;
            let strokeOpacity = explicitStrokeOpacity
                ?? (Number.isFinite(style.strokeOpacity) ? style.strokeOpacity : 1);
            if(style.fill_){
                if(defined(style.fill_.color_)){
                    if(typeof style.fill_.color_ === 'string'){
                       const result = validationStyleColor(style.fill_.color_);
                        if(result.color)
                            fillColor = result.color;
                        // 색 문자열에 담긴 알파는 별도로 지정한 투명도가 없을 때만 씁니다.
                        if(explicitFillOpacity === undefined && Number.isFinite(result.opacity))
                            fillOpacity = result.opacity;
                    }else{
                        const result = normalizeNonStringColor(style.fill_.color_);
                        if(defined(result.color))
                            fillColor = result.color;
                        if(explicitFillOpacity === undefined && Number.isFinite(result.opacity))
                            fillOpacity = result.opacity;
                    }
                }
            }
            if(style.stroke_){
                if(defined(style.stroke_.color_)){
                    if(typeof style.stroke_.color_ === 'string'){
                        const result = validationStyleColor(style.stroke_.color_);
                        if(result.color)
                            strokeColor = result.color;
                        if(explicitStrokeOpacity === undefined && Number.isFinite(result.opacity))
                            strokeOpacity = result.opacity;
                    }else{
                        const result = normalizeNonStringColor(style.stroke_.color_);
                        if(defined(result.color))
                            strokeColor = result.color;
                        if(explicitStrokeOpacity === undefined && Number.isFinite(result.opacity))
                            strokeOpacity = result.opacity;
                    }
                }
            }
            const style_ = {
                fillColor: new THREE.Color(fillColor),
                fillOpacity: fillOpacity,
                strokeColor: new THREE.Color(strokeColor),
                strokeOpacity: strokeOpacity,
                strokeWidth: style.stroke_ ? style.stroke_.width_ : 1,
            };
            style.fillColor = style_.fillColor;
            style.strokeColor = style_.strokeColor;
            style.strokeWidth = style_.strokeWidth;
            style.fillOpacity = style_.fillOpacity;
            style.strokeOpacity = style_.strokeOpacity;
        }


        this._style = style;

        if(this._olFeature && !representative){
            this._olFeature._style = style;
        }

        if (!isSameMeasurePropertyStyle(previousStyle, style)) {
            this.bumpPropertyRevision();
        }

    }

    getProperties(){
        return this._properties;
    }
    setProperties(properties){
        this._properties = properties;
    }

    // MeasureFeature를 생성/수정하는 레이어가 2D/3D로 나뉘어 있어도,
    // geometry/meta 갱신은 이 객체가 한 번에 처리하도록 모아둔다.
    // 이후 다른 layer가 붙더라도 동일한 갱신 entry point를 재사용할 수 있다.
    updateMeasureData(opt = {}) {
        if (opt.extent !== undefined) this.setExtent(opt.extent);
        if (opt.worldExtent !== undefined) this.setWorldExtent(opt.worldExtent);
        if (opt.olFeature !== undefined) this.setOLFeature(opt.olFeature);
        if (opt.geometry !== undefined) this.setGeometry(opt.geometry);
        if (opt.srs !== undefined) this._srs = opt.srs;
        if (opt.type !== undefined) this.setType(opt.type);
        if (opt.measureVectors !== undefined) this.setMeasureVectors(opt.measureVectors);
        if (opt.fid !== undefined) this.setId(opt.fid);
        if (opt.properties !== undefined) this.setProperties(opt.properties);
        if (opt.drawArg !== undefined) this._drawArg = opt.drawArg;
        if (opt.isInner !== undefined) this.setInner(opt.isInner);
        return this;
    }
    // 타입별 geometry 생성 자체는 layer가 좌표계/렌더 정책을 알아야 해서 남겨두고,
    // 생성된 결과를 feature에 반영하는 마지막 단계만 여기서 통일합니다.
    // 그래서 layer는 "무엇을 만들지"만 결정하고, "어떻게 덮어쓸지"는 MeasureFeature에 맡기게 됩니다.
    applyTypedMeasureData(opt = {}) {
        const hasType = Object.prototype.hasOwnProperty.call(opt, 'type');
        const hasGeometry = Object.prototype.hasOwnProperty.call(opt, 'geometry');

        const nextType = hasType ? opt.type : this.getType();
        const nextGeometry = hasGeometry ? opt.geometry : this.getGeometry();

        return this.updateMeasureData({
            extent: opt.extent,
            worldExtent: opt.worldExtent,
            geometry: nextGeometry,
            srs: opt.srs,
            type: nextType,
            measureVectors: opt.measureVectors,
            fid: opt.fid,
            olFeature: opt.olFeature,
            properties: opt.properties,
            drawArg: opt.drawArg,
            isInner: opt.isInner,
            revision: opt.revision,
        });
    }

    // style/nonChanged/excludeSearch/styleRevision/drawSequence는 항상 같이 움직이는
    // 경우가 많아서, layer가 직접 내부 필드를 만지지 않도록 공통 갱신 함수를 둔다.
    applyRuntimeState(opt = {}) {
        if (hasOwn(opt, 'style')) {
            this.setStyle(opt.style, false);
        }
        if (hasOwn(opt, 'nonChanged')) {
            this.setNonChanged(opt.nonChanged);
        }
        if (hasOwn(opt, 'excludeSearch')) {
            this.setExcludeSearch(opt.excludeSearch);
        }
        if (hasOwn(opt, 'styleRevision')) {
            this.setStyleRevision(opt.styleRevision);
        }
        if (hasOwn(opt, 'drawSequence')) {
            this.setDrawSequence(opt.drawSequence);
        }
        if (hasOwn(opt, 'isInner')) {
            this.setInner(opt.isInner);
        }
        if (hasOwn(opt, 'revision')) {
            this.setRevision(opt.revision);
        }
        return this;
    }

    /** 원본의 현재 상태를 연결된 레이어에 다시 전달합니다. */
    changed(){
        const representative = this._getSourceMeasure();
        if (representative) {
            if (representative._disposed) return;
            if (representative._sourceGeometry) representative._sourceGeometry.getFeature().changed();
            else if (representative._editStyle) representative.setStyle(representative._editStyle);
            else representative._olFeature?.changed?.();
        } else if(this._olFeature && this._olFeature.changed) {
            this._olFeature.changed();
        }
    }

    getNonChanged(){
        return this._nonChanged;
    }

    setNonChanged(val){
        const olFeature = this.getOLFeature();
        if(olFeature && !this._getSourceMeasure())
            olFeature._nonChanged = val;
        this._nonChanged = val;
    }

    getExcludeSearch() {
        return !!this._excludeSearch;
    }

    setExcludeSearch(val) {
        const next = !!val;
        const olFeature = this.getOLFeature();
        if (olFeature && !this._getSourceMeasure()) {
            olFeature._excludeSearch = next;
        }
        this._excludeSearch = next;
    }

    getStyleRevision() {
        return this._styleRevision;
    }

    setStyleRevision(revision) {
        const next = revision ?? 0;
        const olFeature = this.getOLFeature();
        if (olFeature) {
            olFeature._styleRevision = next;
        }
        this._styleRevision = next;
        if (Number.isFinite(next)) {
            this.setRevision(Math.max(Number(this._revision ?? 0), Number(next)));
        }
    }

    getRevision() {
        return Number(this._revision ?? 0);
    }

    setRevision(revision) {
        const next = Number.isFinite(revision) ? Number(revision) : 0;
        const olFeature = this.getOLFeature();
        if (olFeature) {
            olFeature._revision = next;
        }
        this._revision = next;
        return this._revision;
    }

    bumpRevision() {
        return this.setRevision(this.getRevision() + 1);
    }

    /**
     * geometry 전용 revision을 반환합니다.
     *
     * @returns {number} geometry revision입니다.
     */
    getGeometryRevision() {
        return Number(this._geometryRevision ?? 0);
    }

    /**
     * geometry 전용 revision을 설정합니다.
     *
     * @param {number} revision 설정할 revision입니다.
     * @returns {number} 설정된 revision입니다.
     */
    setGeometryRevision(revision) {
        const next = Number.isFinite(revision) ? Number(revision) : 0;
        if (this._olFeature) this._olFeature._geometryRevision = next;
        this._geometryRevision = next;
        return next;
    }

    /**
     * geometry 전용 revision을 증가시킵니다.
     *
     * @returns {number} 증가된 revision입니다.
     */
    bumpGeometryRevision() {
        return this.setGeometryRevision(this.getGeometryRevision() + 1);
    }

    /**
     * property 전용 revision을 반환합니다.
     *
     * @returns {number} property revision입니다.
     */
    getPropertyRevision() {
        return Number(this._propertyRevision ?? 0);
    }

    /**
     * property 전용 revision을 설정합니다.
     *
     * @param {number} revision 설정할 revision입니다.
     * @returns {number} 설정된 revision입니다.
     */
    setPropertyRevision(revision) {
        const next = Number.isFinite(revision) ? Number(revision) : 0;
        if (this._olFeature) this._olFeature._propertyRevision = next;
        this._propertyRevision = next;
        return next;
    }

    /**
     * property 전용 revision을 증가시킵니다.
     *
     * @returns {number} 증가된 revision입니다.
     */
    bumpPropertyRevision() {
        return this.setPropertyRevision(this.getPropertyRevision() + 1);
    }

    /**
     * hole 상태를 설정하고 실제 변경 시 property revision을 증가시킵니다.
     *
     * @param {boolean} isInner hole 여부입니다.
     * @returns {boolean} 설정된 hole 여부입니다.
     */
    setInner(isInner) {
        const next = !!isInner;
        if (this._isInner === next) return next;
        this._isInner = next;
        this.bumpPropertyRevision();
        return next;
    }

    getDrawSequence() {
        return this._drawSequence;
    }

    setDrawSequence(sequence) {
        if (!Number.isFinite(sequence)) return this._drawSequence;
        if (this._drawSequence === sequence) return this._drawSequence;
        this._drawSequence = sequence;
        const olFeature = this.getOLFeature();
        if (olFeature) {
            olFeature._drawSequence = sequence;
        }
        this.bumpPropertyRevision();
        return this._drawSequence;
    }

    ensureDrawSequence(sequence) {
        if (!Number.isFinite(this._drawSequence) && Number.isFinite(sequence)) {
            this.setDrawSequence(sequence);
        }
        return this._drawSequence;
    }
}


function hasOwn(obj, key) {
    return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Terrain Worker에 전달되는 style 속성이 같은지 비교합니다.
 *
 * @param {object | undefined} left 이전 style입니다.
 * @param {object | undefined} right 현재 style입니다.
 * @returns {boolean} Worker 표시 속성이 같으면 `true`입니다.
 */
function isSameMeasurePropertyStyle(left, right) {
    if (left === right) return true;
    if (!left || !right) return false;
    return isSameMeasureStyleColor(left.fillColor, right.fillColor)
        && isSameMeasureStyleColor(left.strokeColor, right.strokeColor)
        && Object.is(left.opacity, right.opacity)
        && Object.is(left.fillOpacity, right.fillOpacity)
        && Object.is(left.strokeOpacity, right.strokeOpacity)
        && Object.is(left.strokeWidth, right.strokeWidth)
        && Object.is(left.visible, right.visible)
        && Object.is(left.highlight, right.highlight);
}

/**
 * style 색상의 실제 RGB 값이 같은지 비교합니다.
 *
 * @param {unknown} left 이전 색상입니다.
 * @param {unknown} right 현재 색상입니다.
 * @returns {boolean} 같은 색상이면 `true`입니다.
 */
function isSameMeasureStyleColor(left, right) {
    if (Object.is(left, right)) return true;
    if (left instanceof THREE.Color && right instanceof THREE.Color) {
        return left.r === right.r && left.g === right.g && left.b === right.b;
    }
    if (Array.isArray(left) && Array.isArray(right)) {
        return left.length === right.length
            && left.every((value, index) => Object.is(value, right[index]));
    }
    if (left && right && typeof left === 'object' && typeof right === 'object') {
        return left.r === right.r && left.g === right.g && left.b === right.b;
    }
    return false;
}

// 두 선분이 교차하는지 확인하는 함수
function normalizeNonStringColor(value){
    if(Array.isArray(value)){
        const [r, g, b, a] = value;
        if(!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b))
            return {color: undefined, opacity: undefined};
        return {
            color: new THREE.Color(
                Math.min(255, r) / 255,
                Math.min(255, g) / 255,
                Math.min(255, b) / 255,
            ),
            opacity: Number.isFinite(a) ? a : undefined,
        };
    }
    return {color: value, opacity: undefined};
}

/**
 * 기존 THREE 색상 해석을 유지하고 RGBA·HSLA 알파를 표시 상태로 분리합니다.
 *
 * @param {string} color 원본 CSS 색상 문자열입니다.
 * @returns {object} 변환한 color와 명시되어 있으면 opacity를 반환합니다.
 */
function validationStyleColor(color){

    const string = /^(\w+)\(([^\)]*)\)/.exec(color)
    if (string) {
        const name = string[1];
        if (name === 'hsla') {
            const components = string[2].split(',');
            const alpha = components.length === 4 ? Number(components.pop()) : undefined;
            return {color: new THREE.Color('hsl(' + components.join(',') + ')'),
                opacity: defined(alpha) && Number.isFinite(alpha) ? Math.max(0,Math.min(1,alpha)) : undefined};
        }
        if (name === 'rgba') {
            let color;
            if (color = /^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(string[2])) {

                // rgb(255,0,0) rgba(255,0,0,0.5)
                const opacity = color[4] === undefined ? undefined : Number(color[4]);
                color = new THREE.Color(
                    Math.min(255, parseInt(color[1], 10)) / 255,
                    Math.min(255, parseInt(color[2], 10)) / 255,
                    Math.min(255, parseInt(color[3], 10)) / 255,
                );
                return {color, opacity};
            }
        }
    }
    return {color}

}


export {UMeasureFeature}




function isLineIntersectingExtent(lineCoordinates, extent) {
    const [minX, minY, maxX, maxY] = extent;
    const extentEdges = [
        [new THREE.Vector2(minX, minY), new THREE.Vector2(maxX, minY)], // 아래
        [new THREE.Vector2(maxX, minY), new THREE.Vector2(maxX, maxY)], // 오른쪽
        [new THREE.Vector2(maxX, maxY), new THREE.Vector2(minX, maxY)], // 위
        [new THREE.Vector2(minX, maxY), new THREE.Vector2(minX, minY)]  // 왼쪽
    ];

    // 선이 경계 박스 내부에 완전히 포함되는지 확인
    if (lineCoordinates.some(point => (
        point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
    ))) {
        return true;
    }

    // 선이 경계 박스의 변과 교차하는지 확인
    for (let i = 0; i < lineCoordinates.length - 1; i++) {
        const p1 = lineCoordinates[i];
        const p2 = lineCoordinates[i + 1];

        for (const [q1, q2] of extentEdges) {
            if (isSegmentIntersecting(p1, p2, q1, q2)) {
                return true;
            }
        }
    }

    return false;
}



function isSegmentIntersecting(p1, p2, q1, q2) {
    function ccw(a, b, c) {
        return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
    }
    return ccw(p1, q1, q2) !== ccw(p2, q1, q2) && ccw(p1, p2, q1) !== ccw(p1, p2, q2);
}




function isPolygonIntersectingExtent(coords, list){
    const [minX, minY, maxX, maxY] = list;
    const extentPoints = [
        new THREE.Vector2(minX, minY),
        new THREE.Vector2(maxX, minY),
        new THREE.Vector2(maxX, maxY),
        new THREE.Vector2(minX, maxY)
    ];

    //  경계 박스의 네 꼭짓점이 다각형 내부에 있는지 확인 (완전 포함 여부)
    if (extentPoints.some(point => isPointInsidePolygon(point, coords))) {
        return true;
    }

    // 다각형의 일부가 extent 내부에 있는지 확인 (교차 여부)
    for (const point of coords) {
        if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
            return true;
        }
    }
    const extentLines = [
        [extentPoints[0], extentPoints[1]],
        [extentPoints[1], extentPoints[2]],
        [extentPoints[2], extentPoints[3]],
        [extentPoints[3], extentPoints[0]]
    ];

    // 다각형의 각 변에 대해 경계 박스의 교차 여부
    for (let i = 0; i < coords.length; i++) {
        const p1 = coords[i];
        const p2 = coords[(i + 1) % coords.length];

        // 경계 박스의 각 변과 교차 확인
        for (const [p3, p4] of extentLines) {
            if (doLinesIntersect(p1, p2, p3, p4)) {
                return true;
            }
        }
    }

    return false;

}



/**
 * 특정 점이 다각형 내부에 있는지 확인 (Ray-casting algorithm)
 */
function isPointInsidePolygon(point, coords) {
    let count = 0;
    const n = coords.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = coords[i].x, yi = coords[i].y;
        const xj = coords[j].x, yj = coords[j].y;

        const intersect = ((yi > point.y) !== (yj > point.y)) &&
            (point.x < ((xj - xi) * (point.y - yi) / (yj - yi) + xi));
        if (intersect) count++;
    }
    return count % 2 === 1; // 홀수면 내부, 짝수면 외부
}



// 두 선분이 교차하는지 확인하는 함수
function doLinesIntersect(p1, p2, p3, p4) {
    const ccw = (a, b, c) => (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}



/**
 * 원(Circle)이 특정 경계 박스(extent)를 포함하거나 일부 지나가는지 확인
 * @param {THREE.Vector2} center - 원의 중심 좌표
 * @param {number} radius - 원의 반지름
 * @param {number[]} extent - [minX, minY, maxX, maxY]
 * @returns {boolean} 포함 여부
 */
function isCircleIntersectingExtent(center, radius, extent) {
    const [minX, minY, maxX, maxY] = extent;

    // 원의 경계 박스(extent)와 기본적인 겹침 여부 검사
    const circleBounds = {
        minX: center.x - radius,
        maxX: center.x + radius,
        minY: center.y - radius,
        maxY: center.y + radius
    };

    if (circleBounds.maxX < minX || circleBounds.minX > maxX ||
        circleBounds.maxY < minY || circleBounds.minY > maxY) {
        return false; // 완전히 분리됨
    }

    // 원의 중심이 경계 박스 내부에 있는 경우
    if (center.x >= minX && center.x <= maxX && center.y >= minY && center.y <= maxY) {
        return true;
    }

    // 경계 박스의 네 꼭짓점이 원 내부에 있는지 확인
    const extentCorners = [
        new THREE.Vector2(minX, minY),
        new THREE.Vector2(maxX, minY),
        new THREE.Vector2(maxX, maxY),
        new THREE.Vector2(minX, maxY)
    ];
    if (extentCorners.some(corner => isPointInsideCircle(corner, center, radius))) {
        return true;
    }

    // 원의 둘레가 extent의 변과 교차하는지 확인
    const extentEdges = [
        [new THREE.Vector2(minX, minY), new THREE.Vector2(maxX, minY)], // 아래 변
        [new THREE.Vector2(maxX, minY), new THREE.Vector2(maxX, maxY)], // 오른쪽 변
        [new THREE.Vector2(maxX, maxY), new THREE.Vector2(minX, maxY)], // 위쪽 변
        [new THREE.Vector2(minX, maxY), new THREE.Vector2(minX, minY)]  // 왼쪽 변
    ];

    for (const [p1, p2] of extentEdges) {
        if (isCircleEdgeIntersecting(center, radius, p1, p2)) {
            return true;
        }
    }

    return false; // 겹치지 않음
}



function isPointInsideCircle(point, center, radius) {
    return point.distanceTo(center) <= radius;
}



/**
 * 원과 선분(edge)이 교차하는지 확인
 * @param {THREE.Vector2} center - 원의 중심
 * @param {number} radius - 원의 반지름
 * @param {THREE.Vector2} p1 - 선분의 시작점
 * @param {THREE.Vector2} p2 - 선분의 끝점
 * @returns {boolean} 교차 여부
 */
function isCircleEdgeIntersecting(center, radius, p1, p2) {
    const d = p2.clone().sub(p1); // 선분 벡터
    const f = p1.clone().sub(center); // 원 중심에서 선분 시작점까지의 벡터

    const a = d.dot(d);
    const b = 2 * f.dot(d);
    const c = f.dot(f) - radius * radius;

    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) return false; // 교차 없음

    const sqrtDiscriminant = Math.sqrt(discriminant);
    const t1 = (-b - sqrtDiscriminant) / (2 * a);
    const t2 = (-b + sqrtDiscriminant) / (2 * a);

    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}
