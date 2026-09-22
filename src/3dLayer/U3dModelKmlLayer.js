// @ts-check
import * as THREE from "three";
import {defined} from '@util/defined';
import {defaultValue} from '@util/defaultValue';
import {ol} from '@union3d/lib/ol/ol-debug.js';
import {U3dVectorLayer} from '@union3d/3dLayer/U3dVectorLayer.js';
import {U3dPoint} from '@union3d/geometry/U3dPoint.js';
import {U3dLine} from '@union3d/geometry/U3dLine.js';
import {U3dPolygonLoftGeometry} from '@union3d/geometry/U3dPolygonLoftGeometry.js';
import {__GError__} from "@U3dMessage";
import {INTERNAL} from '@union3d/3dLayer/U3dModelKmlLayer.internal';


/**
 * U3dModelKmlLayer가 발생시키는 이벤트 이름 모음입니다. <br>
 * `layer.addEventListener(U3dModelKmlLayerEMD.COMPLETED, fn)`처럼 수신할 이벤트 이름을 지정할 때 사용합니다.
 *
 * @type {U3dModelKmlLayerEMI}
 */
export const U3dModelKmlLayerEMD = {
    COMPLETED: 'completed'
}

/**
 * ~extends import('@union3d/3dLayer/U3dVectorLayer').U3dVectorLayer <br>
 *
 * KML 또는 KMZ 파일의 지리 형상을 3D 객체로 변환해 표시하는 레이어 클래스입니다.
 *
 * @group 3dLayer
 * @extends {U3dVectorLayer}
 */
class U3dModelKmlLayer extends U3dVectorLayer {
    /**
     * 이 레이어가 발생시키는 이벤트 이름 모음입니다. <br>
     * 부모 레이어의 이벤트 이름에 `U3dModelKmlLayerEMD`의 이름을 더한 객체입니다.
     *
     * @override
     *
     * @type {U3dVectorLayerEMI & U3dModelKmlLayerEMI}
     */
    static EVENT = {
        ...U3dVectorLayer.EVENT,
        ...U3dModelKmlLayerEMD
    };

    /**
     * KML 피처에 개별 스타일이 없을 때 적용할 점·선·폴리곤의 기본 표시 설정입니다.
     *
     * @type {{pointSize: number, pointColor: import('three').ColorRepresentation, lineWidth: number, lineColor: import('three').ColorRepresentation, polygonColor: import('three').ColorRepresentation, polygonOpacity: number, polygonHeight: number}}
     */
    static DefaultStyle = {
        pointSize : 24,
        pointColor : '#ffffff',
        lineWidth : 2,
        lineColor : '#ffffff',
        polygonColor : '#ffffff',
        polygonOpacity : 1,
        polygonHeight : 10
    }
    /**
     * 이 레이어가 단일 형상으로 변환해 처리하는 KML 형상 종류 목록입니다.
     *
     * @type {Array<string>}
     */
    static GeometryType = ['Point', 'LineString', 'Polygon'];

    /**
     * 현재 KML 또는 KMZ 파일을 불러와 변환하는 작업입니다.
     *
     * @type {Promise<U3dModelKmlLayer> | null}
     */
    _loadingPromise;
    /**
     * 생성한 3D 형상을 고유 ID로 찾기 위한 목록입니다.
     *
     * @type {Map<string, import('@U3dGeometry').U3dGeometry>}
     */
    _geometryIdMap;
    /**
     * 다음에 생성할 3D 형상의 ID에 붙일 순번입니다.
     *
     * @type {number}
     */
    _geometrySequence;
    /**
     * 폴리곤 높이를 읽을 KML 속성 이름입니다.
     *
     * @type {string}
     */
    _heightField;
    /**
     * KML 피처별 표시 설정을 반환하는 사용자 스타일 함수입니다.
     *
     * @type {KmlStyleFunction | undefined}
     */
    _styleFunction;
    /**
     * KMZ 압축을 풀어 얻은 엔트리 경로와 바이트의 대응표입니다.<br>
     * KML 입력에서는 null입니다.
     *
     * @type {Record<string, Uint8Array> | null}
     */
    _kmzAssets;
    /**
     * KMZ 내부 리소스에서 만든 object URL을 엔트리 경로로 관리하는 목록입니다.
     *
     * @type {Map<string, string>}
     */
    _kmzObjectUrls;

    /**
     * U3dModelKmlLayer 클래스 생성자입니다.<br>
     * KML 텍스트·바이너리 데이터 또는 파일 경로 중 제공된 입력으로 3D 형상 변환을 시작합니다.<br>
     * kmlText, kmlData, baseUrl 순서로 먼저 제공된 입력을 사용합니다.
     *
     * @param {U3dModelKmlLayerCO} opt 레이어 생성 설정
     */
    constructor(opt ) {
        super(opt);

        this._classtype = 'U3dModelKmlLayer';
        this._baseUrl = defaultValue(opt.baseUrl, undefined);
        this._loadingPromise = null;
        this._geometryIdMap = new Map();
        this._geometrySequence = 0;
        this._kmzAssets = null;
        this._kmzObjectUrls = new Map();

        this._heightField = defaultValue(opt.heightField, 'height');
        this._styleFunction = typeof opt.styleFunction === 'function' ? opt.styleFunction : undefined;

        if (defined(opt.kmlText) && opt.kmlText !== '') {
            this._loadingPromise = this.#loadFromText(opt.kmlText);
        } else if (defined(opt.kmlData)) {
            this._loadingPromise = this.#loadFromData(opt.kmlData);
        } else {
            const baseUrl = this._baseUrl;
            if (defined(baseUrl) && baseUrl !== '') {
                this._loadingPromise = this.#load(baseUrl);
            }
        }
        this._loadingPromise?.catch((err) => {
            __GError__(this, `kml load failed. ${err}`, '*code=>');
        });
    }

    /**
     * 입력된 경로의 KML 또는 KMZ 파일을 파싱하여 피처를 추가하는 메서드입니다.
     *
     * @param {string} [path] KML/KMZ 파일 경로. 미입력 시 레이어 생성 옵션으로 전달한 baseUrl 값을 참조합니다.
     * @returns {Promise<U3dModelKmlLayer>}
     */
    async #load(path = this._baseUrl) {
        if (!defined(path) || path === '') {
            throw new Error('[U3dModelKmlLayer] KML path is undefined.');
        }

        this._baseUrl = path;
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`[U3dModelKmlLayer] KML load failed: ${response.status} ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const text = this.#normalizeToKmlText(buffer, {
            contentType: response.headers.get('content-type'),
            path
        });
        return this.#loadFromText(text);
    }

    /**
     * 바이너리(KMZ 또는 KML) 데이터를 KML 텍스트로 정규화한 뒤 피처를 추가하는 메서드입니다.
     *
     * @param {ArrayBuffer | Uint8Array | Blob} data KML/KMZ 데이터
     * @returns {Promise<U3dModelKmlLayer>}
     */
    async #loadFromData(data) {
        const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
        const text = this.#normalizeToKmlText(buffer, {});
        return this.#loadFromText(text);
    }

    /**
     * KML/KMZ 입력을 KML 텍스트로 정규화하는 메서드입니다.<br>
     * ZIP 시그니처(PK\x03\x04) 또는 Content-Type/확장자 힌트로 KMZ를 판별하며, KMZ면 내부 kml을 추출합니다.
     *
     * @param {ArrayBuffer | Uint8Array | string} input 원본 데이터
     * @param {Partial<{contentType: string | null, path: string}>} hint 형식 판별 힌트
     * @returns {string} KML text
     */
    #normalizeToKmlText(input, hint) {
        // 입력 형식에 맞는 텍스트를 얻고 포함 이미지 검색에 필요한 압축 자료를 보관합니다.
        return INTERNAL.normalizeToKmlText(this, input, hint);
    }


    /**
     * 아이콘 src가 KMZ 내부 리소스를 가리키면 해당 바이트로 만든 object URL을 반환하고, 아니면 원본 src를 그대로 반환하는 메서드입니다.<br>
     * OL KML 포맷은 상대 href를 페이지 URL 기준 절대 경로로 바꾸므로, 페이지 base 를 제거한 상대 경로 → 정확 일치 → 파일명 일치 순으로 KMZ 엔트리를 찾습니다.
     *
     * @param {string | undefined} src 아이콘 소스
     * @returns {string | undefined} 해석된 소스
     */
    #resolveKmzImageSrc(src) {
        const assets = this._kmzAssets;
        if (!defined(src) || src === '' || !defined(assets) || src.startsWith('data:') || src.startsWith('blob:')) {
            return src;
        }

        // 포함 이미지의 엔트리를 찾으며 대응 자료가 없으면 원래 소스를 계속 사용합니다.
        const entry = INTERNAL.findKmzEntry(assets, src);
        if (!defined(entry)) {
            return src;
        }

        const cached = this._kmzObjectUrls.get(entry);
        if (defined(cached)) {
            return cached;
        }

        const url = URL.createObjectURL(new Blob([assets[entry]], { type: guessMimeType(entry) }));
        this._kmzObjectUrls.set(entry, url);
        return url;
    }

    /**
     * KMZ 리소스로 생성한 object URL을 모두 해제하는 메서드입니다.
     */
    #revokeKmzObjectUrls() {
        for (const url of this._kmzObjectUrls.values()) {
            URL.revokeObjectURL(url);
        }
        this._kmzObjectUrls.clear();
    }

    /**
     * 텍스트 형식의 KML 데이터를 파싱하여 피처를 추가하는 메서드입니다.
     *
     * @param {string} text KML text
     * @returns {Promise<this>}
     *
     * @ignore
     */
    async #loadFromText(text) {
        this.clear();

        if (!defined(text) || text.trim() === '') {
            return this;
        }
        const olAny = /** @type {any} */ (ol);
        const format = new olAny.format.KML({
            extractStyles: true,
            showPointNames: false
        });
        const features = format.readFeatures(text);

        for (const feature of features) {
            this.#appendFeature(feature);
        }

        this.#updateLayerBounds();
        this.update();
        this.dispatchEvent({ type: U3dModelKmlLayerEMD.COMPLETED, data: this });
        return this;
    }

    /**
     * 현재 파일 경로의 KML 또는 KMZ를 다시 불러와 레이어 형상을 교체합니다.<br>
     * 파일 경로 없이 텍스트 또는 바이너리 데이터로 생성한 레이어에서는 사용할 수 없습니다.
     *
     * @returns {Promise<U3dModelKmlLayer>} 변환이 끝난 현재 레이어
     */
    reload() {
        return this.#load(this._baseUrl);
    }

    /**
     * 레이어에 추가한 형상과 KML에서 만든 리소스를 제거하고 경계 정보를 초기화합니다.
     *
     * @override
     *
     * @ignore
     */
    initialize() {
        const initialized = super.initialize();
        this.#updateLayerBounds();
        return initialized;
    }

    /**
     * 레이어에 등록한 3D 형상을 모두 제거하고 KML 변환 상태를 처음으로 되돌립니다. <br>
     * 레이어 경계 정보, ID로 형상을 찾는 목록과 형상 ID 순번을 초기화하고 KMZ 내부 이미지로 만든 object URL을 모두 해제합니다. <br>
     * 압축을 풀어 둔 KMZ 엔트리 자료는 그대로 남습니다.
     *
     * @override
     */
    clear() {
        super.clear();
        this.#resetLayerBounds();
        this._geometryIdMap.clear();
        this._geometrySequence = 0;
        this.#revokeKmzObjectUrls();
    }

    /**
     * 레이어를 처분(dispose)합니다. <br>
     * KMZ 내부 이미지로 만든 object URL을 모두 해제하고 압축을 풀어 둔 KMZ 엔트리 자료를 버린 뒤 부모 레이어의 처분을 수행합니다. <br>
     * 처분한 레이어는 다시 사용할 수 없습니다.
     *
     * @override
     *
     * @returns {Promise<boolean>} 해제가 끝나면 true로 완료되는 Promise
     */
    dispose() {
        this.#revokeKmzObjectUrls();
        this._kmzAssets = null;
        return super.dispose();
    }

    /**
     * ID 값으로 해당하는 Geometry를 반환하는 메서드입니다.
     *
     * @param {string} geometryId Geometry ID
     *
     * @returns {import('@U3dGeometry').U3dGeometry | undefined} 일치하는 3D 형상이며 없으면 undefined
     */
    getGeometryById(geometryId) {
        return this._geometryIdMap.get(geometryId);
    }

    /**
     * 레이어의 BoundingBox를 반환하는 메서드입니다.
     *
     * @override
     *
     * @returns {import('three').Box3} 레이어 형상을 감싸는 3차원 경계 상자
     */
    getBoundingBox() {
        if (this._box3) {
            return this._box3;
        }
        return super.getBoundingBox();
    }

    /**
     * U3dGeometry 계열로 변환 할수 있도록  OL feature 에서 properties, style, geometry 를 추출하는 메서드입니다.
     *
     * @param {OLFeature} feature
     */
    #appendFeature(feature) {
        const geometry = feature?.getGeometry?.();
        if (!defined(geometry)) return;

        const properties = cloneProperties(feature?.getProperties?.() || {}, ['geometry']);
        const style = this.#getFeatureStyle(feature);
        const name = /**@type{any}*/(feature)?.get?.('name') || properties.name;
        const featureId = feature?.getId?.() ?? properties.id ?? name;

        this.#appendGeometry(geometry, properties, style, name, geometry?.getType?.(), featureId);
    }

    /**
     * kml에서 파싱한 OL geometry 타입별로 U3dPoint, U3dLine, U3dPolygonLoftGeometry를 생성하는 메서드입니다.
     *
     * @param {OLGeometry} geometry
     * @param {KeyValue} properties
     * @param {OLStyle} style
     * @param {string | undefined} name
     * @param {string | undefined} sourceGeometryType
     * @param {string | number | undefined} sourceFeatureId
     */
    #appendGeometry(geometry, properties, style, name, sourceGeometryType, sourceFeatureId) {
        const type = geometry?.getType?.();
        switch (type) {
            case 'Point': {
                const geometryInfo = this.#createGeometryInfo(properties, name, type, sourceGeometryType, sourceFeatureId);
                const geom = this.#createPointGeometry(geometryInfo.properties, style, name);
                this.addGeometry(geom);
                this._geometryIdMap.set(geometryInfo.id, geom);
                const coordinate = /** @type {Array<number>} */ (geometry.getCoordinates());
                geom.setPosition(toGeoVector(coordinate));
                break;
            }
            case 'LineString': {
                const geometryInfo = this.#createGeometryInfo(properties, name, type, sourceGeometryType, sourceFeatureId);
                const geom = this.#createLineGeometry(geometryInfo.properties, style, name);
                this.addGeometry(geom);
                this._geometryIdMap.set(geometryInfo.id, geom);
                const coordinates = /** @type {Double_Array<number>} */ (geometry.getCoordinates());
                geom.setPositions(coordinates.map((coordinate) => toGeoVector(coordinate)));
                break;
            }
            case 'Polygon': {
                const geometryInfo = this.#createGeometryInfo(properties, name, type, sourceGeometryType, sourceFeatureId);
                const geom = this.#createPolygonGeometry(geometryInfo.properties, style, name);
                this.addGeometry(geom);
                this._geometryIdMap.set(geometryInfo.id, geom);
                const coordinates = /** @type {Triple_Array<number>} */ (geometry.getCoordinates());
                geom.setPositions(normalizeRing(coordinates[0] || []).map((coordinate) => toGeoVector(coordinate)));
                applyDepthStyle(geom, getDepthOption(geom), true);
                break;
            }
            case 'MultiPoint':
                for (const coordinate of /** @type {Double_Array<number>} */ (geometry.getCoordinates())) {
                    const geometryInfo = this.#createGeometryInfo(properties, name, 'Point', sourceGeometryType, sourceFeatureId);
                    const geom = this.#createPointGeometry(geometryInfo.properties, style, name);
                    this.addGeometry(geom);
                    this._geometryIdMap.set(geometryInfo.id, geom);
                    geom.setPosition(toGeoVector(coordinate));
                }
                break;
            case 'MultiLineString':
                for (const coordinates of /** @type {Triple_Array<number>} */ (geometry.getCoordinates())) {
                    const geometryInfo = this.#createGeometryInfo(properties, name, 'LineString', sourceGeometryType, sourceFeatureId);
                    const geom = this.#createLineGeometry(geometryInfo.properties, style, name);
                    this.addGeometry(geom);
                    this._geometryIdMap.set(geometryInfo.id, geom);
                    geom.setPositions(coordinates.map((coordinate) => toGeoVector(coordinate)));
                }
                break;
            case 'MultiPolygon':
                const multiPolygonCoordinates = /** @type {Array<Triple_Array<number>>} */ (/** @type {unknown} */ (geometry.getCoordinates()));
                for (const coordinates of multiPolygonCoordinates) {
                    const geometryInfo = this.#createGeometryInfo(properties, name, 'Polygon', sourceGeometryType, sourceFeatureId);
                    const geom = this.#createPolygonGeometry(geometryInfo.properties, style, name);
                    this.addGeometry(geom);
                    this._geometryIdMap.set(geometryInfo.id, geom);
                    geom.setPositions(normalizeRing(coordinates[0] || []).map((coordinate) => toGeoVector(coordinate)));
                    applyDepthStyle(geom, getDepthOption(geom), true);
                }
                break;
        }
    }

    /**
     * 조회 식별자와 형상별 속성을 만들고 생성 순번을 증가시킵니다.
     *
     * @param {KeyValue} properties 원본 속성
     * @param {string | undefined} name 피처 이름
     * @param {string} geometryType 생성할 형상 종류
     * @param {string | undefined} sourceGeometryType 원본 형상 종류
     * @param {string | number | undefined} sourceFeatureId 원본 식별자
     * @returns {{id: string, properties: KeyValue}} 조회 식별자와 복사 속성
     */
    #createGeometryInfo(properties, name, geometryType, sourceGeometryType, sourceFeatureId) {
        // 원본 피처 정보와 형상별 식별자를 연결하여 이후 ID 조회와 스타일 콜백에 사용합니다.
        return INTERNAL.createGeometryInfo(this, properties, name, geometryType, sourceGeometryType, sourceFeatureId);
    }

    /**
     * U3dPoint를 생성하는 메서드입니다.
     *
     * @param {KeyValue} properties
     * @param {OLStyle} style
     * @param {string | undefined} name
     * @returns {import('@union3d/geometry/U3dPoint').U3dPoint}
     */
    #createPointGeometry(properties, style, name) {
        const imageStyle = style?.getImage?.();
        const customStyle = this.#getUserStyle(properties, 'Point', name);
        const scale = Number(imageStyle?.getScale?.() ?? 1);
        const size = Number(customStyle.size ?? (Number(imageStyle?.getSize?.()?.[0] ?? U3dModelKmlLayer.DefaultStyle.pointSize) * scale));
        const color = customStyle.color ?? (imageStyle?.getColor?.() || style?.getFill?.()?.getColor?.() || U3dModelKmlLayer.DefaultStyle.pointColor);
        const img = this.#resolveKmzImageSrc(customStyle.img ?? imageStyle?.getSrc?.());
        const opacity = Number(customStyle.opacity ?? toOpacity(color, 1));

        const point = new U3dPoint({
            name: name,
            color: toColorValue(color, U3dModelKmlLayer.DefaultStyle.pointColor),
            size: Number.isFinite(size) && size > 0 ? size : U3dModelKmlLayer.DefaultStyle.pointSize,
            img: defined(img) ? img : undefined,
            properties: cloneProperties(properties),
            opacity: Number.isFinite(opacity) ? opacity : 1,
            depthTest: typeof customStyle.depth === 'boolean' ? customStyle.depth : true
        });
        applyDepthStyle(point, customStyle.depth);
        return point;
    }

    /**
     * U3dLine를 생성하는 메서드입니다.
     *
     * @param {KeyValue} properties
     * @param {OLStyle} style
     * @param {string | undefined} name
     * @returns {import('@union3d/geometry/U3dLine').U3dLine}
     */
    #createLineGeometry(properties, style, name) {
        const stroke = style?.getStroke?.();
        const customStyle = this.#getUserStyle(properties, 'LineString', name);
        const color = customStyle.color ?? (stroke?.getColor?.() || U3dModelKmlLayer.DefaultStyle.lineColor);
        const width = Number(customStyle.lineWidth ?? stroke?.getWidth?.() ?? U3dModelKmlLayer.DefaultStyle.lineWidth);
        const opacity = Number(customStyle.opacity ?? toOpacity(color, 1));

        const line = new U3dLine({
            name: name,
            color: toColorValue(color, U3dModelKmlLayer.DefaultStyle.lineColor),
            opacity: Number.isFinite(opacity) ? opacity : 1,
            lineWidth: Number.isFinite(width) && width > 0 ? width : U3dModelKmlLayer.DefaultStyle.lineWidth,
            properties: cloneProperties(properties)
        });
        applyDepthStyle(line, customStyle.depth);
        return line;
    }

    /**
     * U3dPolygonLoftGeometry를 생성하는 메서드입니다.
     *
     * @param {KeyValue} properties
     * @param {OLStyle} style
     * @param {string | undefined} name
     * @returns {import('@union3d/geometry/U3dPolygonLoftGeometry').U3dPolygonLoftGeometry}
     */
    #createPolygonGeometry(properties, style, name) {
        const fill = style?.getFill?.();
        const stroke = style?.getStroke?.();
        const customStyle = this.#getUserStyle(properties, 'Polygon', name);
        const fillColor = customStyle.color ?? (fill?.getColor?.() || stroke?.getColor?.() || U3dModelKmlLayer.DefaultStyle.polygonColor);
        const opacity = Number(customStyle.opacity ?? toOpacity(fillColor, U3dModelKmlLayer.DefaultStyle.polygonOpacity));
        const height = this.#getUserPolygonHeight(properties, customStyle.height);
        const useLine = customStyle.useLine ?? defined(stroke);
        const lineColor  = customStyle.lineColor;
        const polygon = new U3dPolygonLoftGeometry({
            name: name,
            color: toColorValue(fillColor, U3dModelKmlLayer.DefaultStyle.polygonColor),
            opacity: Number.isFinite(opacity) ? opacity : U3dModelKmlLayer.DefaultStyle.polygonOpacity,
            height: height,
            useLine: useLine,
            lineColor: lineColor,
            properties: cloneProperties(properties)
        });
        const polyMesh =/**@type{import('@UMesh').UMesh} */ (/**@type{unknown} */(polygon));
        if (typeof customStyle.visible ==='boolean') {
            polyMesh.visible = customStyle.visible;
        }
        if (typeof customStyle.setShadow ==='boolean')
            polygon.setShadow(customStyle.setShadow);
        if (typeof customStyle.exceptAO ==='boolean') {
            polyMesh.userData.exceptAO = customStyle.exceptAO;
        }
        polyMesh.userData.useDepth = customStyle.depth;
        applyDepthStyle(polygon, customStyle.depth);
        return polygon;
    }

    /**
     * U3dPolygonLoftGeometry 생성 시 폴리곤의 높이를 설정하는 메서드입니다. <br>
     * 두번째 파라미터로 height 값을 입력하면 해당 값이 우선 적용됩니다.
     *
     * @param {KeyValue} properties 객체 프로퍼티
     * @param {number | string} [height] 설정할 높이
     * @returns {number} height 폴리곤 높이
     */
    #getUserPolygonHeight(properties, height) {
        const fieldHeight = properties[this._heightField];
        const fallbackHeight = properties.altitude;
        const defaultHeight = U3dModelKmlLayer.DefaultStyle.polygonHeight;
        const parsedHeight = Number(height ?? fieldHeight ?? fallbackHeight);
        return Number.isFinite(parsedHeight) ? parsedHeight : defaultHeight;
    }

    /**
     * 콜백으로 등록한 style function을 호출하고, 반환값을 전달하는 메서드입니다.
     *
     * @param {KeyValue} properties
     * @param {string} type
     * @param {string | undefined} name
     * @returns {KmlRenderStyle}
     */
    #getUserStyle(properties, type, name) {
        return this._styleFunction?.(properties, {type, name}) || {};
    }

    /**
     * KML 피처에 설정된 스타일을 읽어 하나의 스타일 객체로 반환하는 메서드입니다.
     *
     * @param {any} feature OpenLayers KML 피처
     * @returns {any}
     */
    #getFeatureStyle(feature) {
        const styleFunction = feature?.getStyleFunction?.();
        const raw = styleFunction ? styleFunction(feature, 1) : feature?.getStyle?.();
        const styles = Array.isArray(raw) ? raw : (raw ? [raw] : []);

        if (styles.length === 0) return null;
        if (styles.length === 1) return styles[0];

        return mergeStyles(styles);
    }

    /** 표시 형상의 범위를 반영하며 유효한 위치가 없으면 기존 경계를 비웁니다. */
    #updateLayerBounds() {
        // 형상 위치와 돌출 높이를 반영한 범위를 저장하고 계산할 범위가 없을 때만 초기화합니다.
        if (!INTERNAL.updateLayerBounds(this)) {
            this.#resetLayerBounds();
        }
    }

    #resetLayerBounds() {
        this._rectangle = undefined;
        this._rectangle3d = undefined;
        this._box3 = undefined;
    }
}

/**
 * @param {Array<number>} coordinate
 * @returns {GeoPositionVector3}
 */
function toGeoVector(coordinate) {
    if(!Array.isArray(coordinate) || coordinate.length < 2) {
        return new THREE.Vector3(0,0,0);
    }

    const lon = Number(coordinate[0]);
    const lat = Number(coordinate[1]);
    const height = Number(coordinate[2]);

    return new THREE.Vector3(
        Number.isFinite(lon) ? lon : 0,
        Number.isFinite(lat) ? lat : 0,
        Number.isFinite(height) ? height : 0
    );
}

/**
 * 좌표 배열의 마지막 값이 첫번째와 겹치면 제거해서 링구조를 보정하는 함수
 *
 * @param {Array<Array<number>>} ring
 * @returns {Array<Array<number>>}
 */
function normalizeRing(ring) {
    if (ring.length < 2) {
        return ring;
    }

    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] === last[0] && first[1] === last[1] && (first[2] ?? 0) === (last[2] ?? 0)) {
        return ring.slice(0, -1);
    }

    return ring;
}

/**
 * 피처 속성에서 제외 키와 렌더링에 불필요한 중첩 값을 정리한 복사본을 만듭니다.
 * 함수·OpenLayers 객체를 제외하고 조상 순환은 경고와 [Circular] 문자열로 표시합니다.
 *
 * @param {KeyValue} properties 원본 속성
 * @param {Array<string>} [excludeKeys=[]] 복사에서 제외할 키
 * @returns {KeyValue} 형상 또는 스타일 콜백에 전달할 복사 속성
 */
function cloneProperties(properties, excludeKeys = []) {
    // 원본 피처와 생성 형상이 중첩 속성을 공유하지 않도록 값을 복사합니다.
    return INTERNAL.cloneProperties(properties, excludeKeys);
}


/**
 * @param {any} color
 * @param {import('three').ColorRepresentation} fallback
 * @returns {import('three').ColorRepresentation}
 */
function toColorValue(color, fallback) {
    if (Array.isArray(color)) {
        const r = Number(color[0] ?? 255);
        const g = Number(color[1] ?? 255);
        const b = Number(color[2] ?? 255);
        return `rgb(${r}, ${g}, ${b})`;
    }

    return color || fallback;
}

/**
 * @param {any} color
 * @param {number} fallback
 * @returns {number}
 */
function toOpacity(color, fallback) {
    if (!Array.isArray(color)) {
        return fallback;
    }

    const alpha = Number(color[3]);
    if (!Number.isFinite(alpha)) {
        return fallback;
    }

    return alpha;
}

/**
 * Kml 파일에서 파싱한 스타일 값을 하나로 병합하는 함수입니다.
 *
 * @param {Array<OLStyle>} styles
 * @returns {any}
 */
function mergeStyles(styles) {
    /** @type {OLImageStyle | null | undefined} */
    let image = null;
    /** @type {OLFill | null | undefined} */
    let fill = null;
    /** @type {OLStroke | null | undefined} */
    let stroke = null;
    /** @type {OLTextStyle | null | undefined} */
    let text = null;

    for (const style of styles) {
        image = image ?? style?.getImage?.();
        fill = fill ?? style?.getFill?.();
        stroke = stroke ?? style?.getStroke?.();
        text = text ?? style?.getText?.();
    }

    return {
        getImage: () => image,
        getFill: () => fill,
        getStroke: () => stroke,
        getText: () => text,
    };
}

/**
 * Geometry 머터리얼 depth(깊이) 값을 설정하는 함수입니다.
 *
 * @param {import('@U3dGeometry').U3dGeometry} geometry Geometry
 * @param {boolean | undefined} depth depth(깊이) 값. true면 depth를 켜고, false면 끈다
 * @param {boolean} [includeChildren=false] 자식 객체까지 전부 depth 설정할지 여부
 */
function applyDepthStyle(geometry, depth, includeChildren = false) {
    if (typeof depth !== 'boolean') return;

    const mesh = /**@type{import('@UMesh').UMesh} */ (/**@type{unknown} */(geometry));
    applyDepthToMaterial(mesh.material, depth);

    if (!includeChildren || !Array.isArray(mesh.children)) return;
    for (const child of mesh.children) {
        const childObject = /** @type {Partial<{material: import('three').Material | Array<import('three').Material>}>} */ (/** @type {unknown} */ (child));
        applyDepthToMaterial(childObject.material, depth);
    }
}

/**
 * @param {import('@U3dGeometry').U3dGeometry} geometry
 * @returns {boolean | undefined}
 */
function getDepthOption(geometry) {
    const mesh = /**@type{import('@UMesh').UMesh} */ (/**@type{unknown} */(geometry));
    return mesh.userData?.useDepth;
}

/**
 * @param {import('three').Material | Array<import('three').Material> | undefined} material
 * @param {boolean} depth
 */
function applyDepthToMaterial(material, depth) {
    if (!material) return;

    const materials = Array.isArray(material) ? material : [material];
    for (const item of materials) {
        item.depthWrite = depth;
        item.depthTest = depth;
        if (depth === false) {
            item.transparent = true;
        }
        item.needsUpdate = true;
    }
}


/**
 * 파일 확장자로 MIME 타입을 추정하는 함수입니다.
 *
 * @param {string} name 파일명
 * @returns {string}
 */
function guessMimeType(name) {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    switch (ext) {
        case 'png': return 'image/png';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'gif': return 'image/gif';
        case 'svg': return 'image/svg+xml';
        case 'webp': return 'image/webp';
        case 'bmp': return 'image/bmp';
        default: return 'application/octet-stream';
    }
}


export {U3dModelKmlLayer};
