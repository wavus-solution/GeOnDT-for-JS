import * as THREE from 'three';
import {defaultValue} from '/union3d/util/defaultValue.js';
import {UDEF} from '/union3d/core/UDEF.js';
import {Guid} from '/union3d/util/Guid.js';
import {UDXFLoader} from '/union3d/core/loader/UDXFLoader.js';
import {U3dOpenLayer} from '@union3d/3dLayer/U3dOpenLayer';
import {INTERNAL} from '@union3d/2dLayer/U2dDxfLayer.internal';

const ol = __GEONDT__.ol;

/**
 * DXF 엔티티를 OpenLayers 벡터 레이어로 변환하여 지형 타일에 표시합니다.
 *
 * @extends {U3dOpenLayer}
 */
class U2dDxfLayer extends U3dOpenLayer {
    /**
     * @param {object} [opt={}] 레이어 생성 옵션
     * @param {string} [opt.name] 레이어 이름. 생략하면 Guid를 생성합니다.
     * @param {boolean} [opt.drawline=false] 선 그리기 상태
     * @param {string} [opt.crs='EPSG:3857'] 대상 좌표계
     * @param {string} [opt.sourceCRS='EPSG:5179'] DXF 원본 좌표계
     * @param {number} [opt.minlevel=0] 최소 표시 레벨
     * @param {number} [opt.maxlevel=19] 최대 표시 레벨
     * @param {string} [opt.url] DXF URL
     * @param {string} [opt.type=UDEF.LAYER_TYPE.IMAGE] 레이어 타입
     * @param {object} [opt.style={}] 기본 OpenLayers 스타일 설정
     * @param {function} [opt.styleFunction] feature와 DXF 엔티티 타입에 따른 스타일 지정 함수
     */
    constructor(opt = {}) {
        super(opt);

        this._classtype = 'U2dDxfLayer';
        this._name = defaultValue(opt.name, Guid());
        this._drawLine = defaultValue(opt.drawline, false);
        this._crs = defaultValue(opt.crs, 'EPSG:3857');
        this._sourceCRS = defaultValue(opt.sourceCRS, 'EPSG:5179');
        this._minlevel = defaultValue(opt.minlevel, 0);
        this._maxlevel = defaultValue(opt.maxlevel, 19);
        this._properties = [];
        this._url = defaultValue(opt.url, undefined);
        this._type = defaultValue(opt.type, UDEF.LAYER_TYPE.IMAGE);
        this._dxfInfo = undefined;
        this._vertexPoints = [];

        this._style = defaultValue(opt.style, {});
        this._style.fill = this._style.fill || '#3399CC';
        this._style.lineDash = this._style.lineDash || undefined;
        this._style.lineDashOffset = this._style.lineDashOffset || undefined;
        this._style.width = this._style.width || 5;
        this._style.label = this._style.label || '';
        this._style.font = this._style.font || 'bold 20px sans-serif';
        this._style.labelFill = undefined;
        this._style.labelStroke = this._style.labelStroke || 'white';

        this._styleFunction = defaultValue(opt.styleFunction, undefined);
    }

    /**
     * 레이어를 다시 생성하는 데 필요한 현재 설정을 반환합니다.
     * 스타일 객체는 복사하지 않고 현재 참조를 그대로 포함합니다.
     *
     * @returns {object} 현재 레이어 설정
     */
    getParam() {
        return {
            name: this._name,
            minlevel: this._minlevel,
            maxlevel: this._maxlevel,
            transparent: this._transparent,
            url: this._url,
            style: this._style,
            sourceCRS: this._sourceCRS
        };
    }

    /**
     * 현재 DXF 원본 좌표계를 반환합니다.
     *
     * @returns {string} 원본 좌표계
     */
    getSourceCRS() {
        return this._sourceCRS;
    }

    /**
     * 이후 추가할 DXF 데이터에 사용할 원본 좌표계를 설정합니다.
     * 이미 등록된 feature와 정점은 다시 투영하지 않습니다.
     *
     * @param {string} sourceCRS 원본 좌표계
     */
    setSourceCRS(sourceCRS) {
        this._sourceCRS = sourceCRS;
    }

    /**
     * DXF 엔티티를 월드 정점으로 변환하고 엔티티별 OpenLayers layer callback을 등록합니다.
     * 여러 번 호출하면 기존 callback과 바운딩 박스 계산용 정점에 결과를 누적합니다.
     *
     * @param {object} data UDXFLoader가 해석할 DXF 데이터
     * @param {string} [sourceCRS] DXF 원본 좌표계. 생략하면 현재 좌표계를 사용합니다.
     */
    addDxfInfo(data, sourceCRS) {
        const loader = new UDXFLoader();
        const info = loader.loadEntities(data);
        let maxZ = -Infinity;
        let minZ = Infinity;
        const crs = defaultValue(sourceCRS, this._sourceCRS);
        this._sourceCRS = crs;

        const model = info.entity;
        this._dxfInfo = data;
        for (let j = 0; j < model.children.length; j++) {
            const vertexPoints = [];
            const child = model.children[j];
            const type = child._type;

            for (let i = 0; i < child.geometry.attributes.position.count; i++) {
                const orgVertex = child.geometry.attributes.position;
                const geo = ol.proj.transform(
                    [orgVertex.getX(i), orgVertex.getY(i)],
                    this._sourceCRS,
                    'EPSG:4326'
                );
                const world = this._drawArg.getGeographicToWorld(geo[0], geo[1]);
                const vertex = new THREE.Vector3(world.x, world.y, 0);

                vertexPoints.push(vertex);
                maxZ = Math.max(maxZ, vertex.z);
                minZ = Math.min(minZ, vertex.z);
            }

            // 변환을 마친 엔티티가 타일 렌더링 때 동일한 feature와 스타일 결과를 만들도록 callback을 등록합니다.
            INTERNAL.drawDxf(this, this._drawArg, vertexPoints, type);
            vertexPoints.forEach(value => {
                this._vertexPoints.push(value);
            });
        }
    }

    /**
     * 현재 스타일 객체에 입력 속성을 병합하고 타일 source를 다시 생성합니다.
     *
     * @param {object} style 변경할 스타일 속성
     */
    setStyle(style) {
        Object.assign(this._style, style);
        this.refresh();
    }

    /**
     * feature별 스타일 지정 함수를 설정하고 타일 source를 다시 생성합니다.
     *
     * @param {undefined | function(object, unknown): unknown} styleFunction feature와 DXF 엔티티 타입에 따른 스타일 지정 함수
     */
    setStyleFunction(styleFunction) {
        this._styleFunction = styleFunction;
        this.refresh();
    }

    /**
     * 현재 기본 스타일 객체를 반환합니다.
     *
     * @returns {object} 현재 스타일 객체
     */
    getStyle() {
        return this._style;
    }

    /**
     * 현재 feature별 스타일 지정 함수를 반환합니다.
     *
     * @returns {undefined | function(object, unknown): unknown} 스타일 지정 함수
     */
    getStyleFunction() {
        return this._styleFunction;
    }

    /**
     * URL의 DXF 객체를 로드하여 장면에 추가합니다.
     * 현재 구현은 매개변수 대신 메서드 범위에 선언되지 않은 `opt.url` 참조를 사용합니다.
     *
     * @param {string} url DXF URL
     */
    parseDxfFromUrl(url) {
        const loader = new UDXFLoader();
        loader.load(opt.url, data => {
            data.updateMatrix();
            data.updateMatrixWorld();
            this._scene.add(data);
        });
    }

    /**
     * 레이어 가시성을 변경합니다.
     *
     * @override
     *
     * @param {boolean} bShow 가시화 여부
     */
    show(bShow) {
        super.show(bShow);
    }

    /**
     * 지금까지 추가한 DXF 월드 정점의 바운딩 박스를 반환합니다.
     *
     * @override
     *
     * @returns {import('three').Box3} 누적 정점의 바운딩 박스
     */
    getBoundingBox() {
        const boundingBox = new THREE.Box3();
        this._vertexPoints.forEach(vertex => {
            boundingBox.expandByPoint(vertex);
        });
        return boundingBox;
    }
}

export {U2dDxfLayer};
