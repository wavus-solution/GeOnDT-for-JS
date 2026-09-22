import * as THREE from 'three';
import { defined } from '@union3d/util/defined';
import { defaultValue } from '@union3d/util/defaultValue';
import { UMesh } from '@union3d/core/mesh/UMesh';
import { U3dModelLayer } from '@union3d/3dLayer/U3dModelLayer';
import { UDEF } from '@union3d/core/UDEF';
import { Guid } from '@union3d/util/Guid';
import { UDXFLoader } from '@union3d/core/loader/UDXFLoader';
import { U3dPOI } from '@union3d/geometry/U3dPOI';
import { UGroup } from '@union3d/core/UGroup';
// 기존 이벤트 모듈의 초기화 순서는 유지하되 사용하지 않는 이름은 가져오지 않습니다.
import '@union3d/event/U3dEvent';
import { INTERNAL } from '@union3d/3dLayer/U3dModelDxfLayer.internal';
const ol = __GEONDT__.ol;
const FACE_GROUP_NAME = 'faceGroup';
const POLY_GROUP_NAME = 'polyGroup';
const DXF_TYPE = {
    LW_POLYLINE: 'lwpolyline',
    POLYLINE: 'polyline',
    LINE: 'line',
    INSERT: 'insert',
    THREE_D_FACE: '3dface'
};
// 색상 순서는 모든 인스턴스가 공유하므로 레이어별 상태로 옮기지 않습니다.
let materialIndex = 0;
const colorList = [
    '#7fc97f',
    '#beaed4',
    '#fdc086',
    '#ffff99',
    '#386cb0',
];
/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 * DXF 객체의 좌표 배치, 표시 스타일, 라벨과 폴리라인 돌출을 관리합니다.
 *
 * @memberof GeOnDT.model
 * @inner
 * @extends {U3dModelLayer}
 *
 * @ignore
 */
class U3dModelDxfLayer extends U3dModelLayer {
    /**
     * DXF 레이어를 초기화합니다. dxfinfo는 보관만 하며 준비 완료는 형상 로드 완료를 뜻하지 않습니다.
     *
     * @param {Partial<U3dModelDxfLayerCO>} [opt] 생성 옵션
     */
    constructor(opt = {}) {
        super(opt);

        this._classtype = 'U3dModelDxfLayer';
        this._name = defaultValue(opt.name, Guid());
        this._drawLine = defaultValue(opt.drawLine, false);
        this._crs = defaultValue(opt.crs, 'EPSG:3857');
        this._sourceCRS = defaultValue(opt.sourceCRS, 'EPSG:5179');
        this._minlevel = defaultValue(opt.minlevel, 17);
        this._maxlevel = this._minlevel;
        /** @type {Array<unknown>} */
        this._properties = [];
        this._url = defaultValue(opt.url, undefined);
        this._type = defaultValue(opt.type, UDEF.LAYER_TYPE.MODEL);
        /** @type {import('@union3d/2dLayer/U2dDxfLayer').U2dDxfLayer | undefined} */
        this._2dLayer = undefined;
        this._dxfInfo = defaultValue(opt.dxfinfo, undefined);
        this._labelInfo = defaultValue(opt.labelInfo, []);
        /** @type {import('@U3dPOI').U3dPOI | undefined} */
        this._layerLabel = undefined;
        this._useEdge = defined(opt.useEdge) ? opt.useEdge : true;
        this._useExtrude = defined(opt.useExtrude) ? opt.useExtrude : true;
        this._extrudeHeight = defaultValue(opt.extrudeHeight, 2);
        this._setAutoHeight = defined(opt.setAutoHeight) ? opt.setAutoHeight : true;
        this._heightOffset = defaultValue(opt.heightOffset, 0);
        /** @type {Array<U3dDxfObject>} */
        this._entity = [];
        /** @type {U3dDxfStyle} */
        this._style = defaultValue(opt.style, {
            color: 0x3399CC,
            opacity: 1,
            label: ""
        });
        /** @type {U3dDxfStyleFunction | undefined} */
        this._styleFunction = defaultValue(opt.styleFunction, undefined);
        if (defined(this.resolve))
            this.resolve(this);
    }

    /**
     * 개별 메시와 경계 라벨을 정리하고 부모 해제를 시작합니다. 부모의 비동기 완료 Promise는 반환하지 않습니다.
     *
     * @override
     *
     * @return {Promise<boolean>} promise 함수. 작업 완료시 true 반환
     */
    dispose() {
        const group = this._group;
        if (defined(group)) {
            group.traverse((mesh) => {
                if (mesh instanceof THREE.Mesh) {
                    if (defined(mesh.userData.label)) {
                        if (defined(this._drawArg) && defined(this._drawArg._app) && defined(this._drawArg._app._sceneComment)) {
                            UDEF.disposeObject3D(mesh.userData.label);
                            this._drawArg._app._sceneComment.remove(mesh.userData.label);
                            mesh.userData.label = undefined;
                        }
                    }
                }
            });
        }
        this.removeLabelToBoundingBox();
        return super.dispose();
    }

    /**
     * DXF 객체는 addDxfInfo로 직접 등록하므로 부모의 타일별 모델 생성 동작을 수행하지 않습니다.
     *
     * @override
     *
     * @returns {undefined} 생성 결과 없음
     */
    createModel() {
        return undefined;
    }

    /**
     * 현재 설정의 일부를 새 객체로 반환합니다. style과 styleFunction은 원본 참조이며 돌출·고도 설정은 포함하지 않습니다.
     *
     * @returns {U3dDxfLayerParam} 현재 설정의 일부
     */
    getParam() {
        const param = {};
        param.name = this._name;
        param.minlevel = this._minlevel;
        param.maxlevel = this._maxlevel;
        param.transparent = this._transparent;
        param.url = this._url;
        param.style = this._style;
        param.styleFunction = this._styleFunction;
        param.sourceCRS = this._sourceCRS;
        return param;
    }

    /**
     * 레이어가 사용하는 스타일 객체를 그대로 반환합니다. 반환 객체의 속성 변경은 내부 스타일에도 반영합니다.
     *
     * @returns {U3dDxfStyle} 공유 스타일 객체
     */
    getStyle() {
        return this._style;
    }

    /**
     * 현재 등록된 객체별 스타일 callback을 반환합니다.
     *
     * @returns {U3dDxfStyleFunction | undefined} 등록된 callback 또는 미등록 상태
     */
    getStyleFunction() {
        return this._styleFunction;
    }

    /**
     * 이후 입력할 DXF의 XY 변환에 사용하는 좌표계를 반환합니다.
     *
     * @returns {string} 입력 좌표계
     */
    getSourceCRS() {
        return this._sourceCRS;
    }

    /**
     * 이후 DXF 입력에 사용할 좌표계를 저장합니다. 기존 형상을 다시 변환하지 않습니다.
     *
     * @param {string} sourceCRS 입력 좌표계
     */
    setSourceCRS(sourceCRS) {
        this._sourceCRS = sourceCRS;
    }

    /**
     * DXF 객체를 생성하여 면·선·돌출 그룹에 추가합니다. 기존 객체는 비우지 않으며 입력 자료와 원본 엔티티를 공유합니다.
     * 스타일 callback은 레이어를 this로 받아 객체별 처리 후 호출되며, 그 다음 재질을 DoubleSide로 설정합니다.
     * setAutoHeight가 참이면 다음 LOADED에 고도 보정을 등록합니다. 형상 생성 중 발생한 오류는 호출자에게 전달합니다.
     *
     * @param {U3dDxfData} data 파싱된 DXF 자료
     * @param {string} [sourceCRS] 이번 입력 좌표계; nullish이면 저장된 값 사용
     */
    addDxfInfo(data, sourceCRS) {
        this._dxfInfo = data;
        const loader = new UDXFLoader();
        const info = loader.loadEntities(data);
        const crs = defaultValue(sourceCRS, this._sourceCRS);
        this._sourceCRS = crs;
        const model = info.entity;
        if (!model) {
            __GError__(this, 'DXF 로드 중 올바르게 정의된 모델이 없습니다.', '8505737');
            return;
        }
        let faceGroup = getFaceGroup.call(this);
        if (!faceGroup) {
            faceGroup = new UGroup();
            faceGroup.name = FACE_GROUP_NAME;
            this._group.add(faceGroup);
        }
        let polyGroup = getPolyGroup.call(this);
        if (!polyGroup) {
            polyGroup = new UGroup();
            polyGroup.name = POLY_GROUP_NAME;
            this._group.add(polyGroup);
        }
        this._scene.add(this._group);
        polyGroup.position.z += this._heightOffset;
        for (let j = 0; j < model.children.length; j++) {
            const vertexPoints = [];
            const child = model.children[j];
            let resultMesh = child;
            const type = getDXFType.call(this, child._type.toLowerCase());
            const positionAttr = child.geometry.getAttribute('position');
            if (type === DXF_TYPE.THREE_D_FACE) {
                for (let i = 0; i < positionAttr.count; i++) {
                    transformPosition.call(this, positionAttr, i);
                }
                child.geometry.computeVertexNormals();
                setLabel.call(this, child);
                faceGroup.add(child);
                j--;
            } else if (type === DXF_TYPE.LINE) {
                for (let i = 0; i < positionAttr.count; i++) {
                    transformPosition.call(this, positionAttr, i);
                }
                child._type = child._type.toLowerCase();
                if (child._type === DXF_TYPE.LW_POLYLINE || child._type === DXF_TYPE.POLYLINE)
                    this._entity.push(child);
                polyGroup.add(child);
                setLineTypePrototype.call(this, child);
                j--;
            } else if (type === DXF_TYPE.INSERT) {
                const pos = child.position;
                const geo = ol.proj.transform([pos.x, pos.y], this._sourceCRS, 'EPSG:4326');
                const world = this._drawArg.getGeographicToWorld(geo[0], geo[1]);
                const vertex = new THREE.Vector3(world.x, world.y, pos.z);
                child.position.copy(vertex);
                polyGroup.add(child);
                j--;
            } else if (type === DXF_TYPE.LW_POLYLINE || type === DXF_TYPE.POLYLINE) {
                for (let i = 0; i < positionAttr.count; i++) {
                    const vertex = transformPosition.call(this, positionAttr, i);
                    vertexPoints.push(vertex);
                }
                const mesh = extrudeDxf.call(this, vertexPoints, this._extrudeHeight);
                const color = colorList[materialIndex % colorList.length];
                materialIndex++;
                mesh.material.color.set(color);
                mesh._type = type;
                mesh.userData.entity = child.userData.entity;
                child._type = type;
                polyGroup.add(mesh);
                this._entity.push(child);
                resultMesh = mesh;
            }
            if (this._styleFunction) {
                const entity = resultMesh.userData.entity;
                this._styleFunction(entity, resultMesh);
            }
            resultMesh.material.side = THREE.DoubleSide;
        }
        if (this._setAutoHeight) {
            this.once(this.constructor.EVENT.LOADED, () => {
                this.updateHeightGroup();
            });
        }
        this._bbox = new THREE.Box3().setFromObject(this._group);
    }

    /**
     * 공유 스타일에 입력값을 병합하고 기존 Mesh 재질에 적용합니다. color=0은 색을 유지하며 opacity=0은 1로 적용합니다.
     * truthy label은 경계 라벨을 갱신하고, 마지막에 화면 갱신 상태를 표시합니다.
     *
     * @param {U3dDxfStyle} [style] 병합할 스타일; falsy이면 빈 객체
     */
    setStyle(style) {
        const group = this._group;
        style = style || {};
        Object.assign(this._style, style);
        group.traverse((mesh) => {
            if (mesh instanceof THREE.Mesh) {
                if (defined(mesh.material)) {
                    const material = mesh.material;
                    material.color = this._style.color ? new THREE.Color(this._style.color) : material.color;
                    material.opacity = this._style.opacity ? this._style.opacity : 1;
                    if (material.opacity >= 1) {
                        material.transparent = false;
                    } else {
                        material.transparent = true;
                    }
                }
            }
        });
        if (this._style.label) {
            this.setLabelToBoundingBox(this._style.label);
        }
        this._drawArg.setUpdateDate();
    }

    /**
     * callback을 저장하고 entity가 정의된 기존 객체에 즉시 적용합니다. 이 순회에서는 callback의 this를 지정하지 않습니다.
     * 이후 addDxfInfo·setUseExtrude에서는 레이어를 this로 전달합니다. 별도 화면 갱신은 요청하지 않습니다.
     *
     * @param {U3dDxfStyleFunction} styleFunction 객체별 스타일 callback
     */
    setStyleFunction(styleFunction) {
        this._styleFunction = styleFunction;
        const group = this._group;
        group.traverse((mesh) => {
            if (defined(mesh.userData.entity)) {
                const entity = mesh.userData.entity;
                styleFunction(entity, mesh);
            }
        });
    }

    /**
     * 현재 그룹 경계 중심에 레이어 라벨을 만들거나 기존 라벨의 위치와 문구를 변경한 뒤 표시합니다.
     *
     * @param {string} [labelText] 문구; undefined이면 빈 문자열
     */
    setLabelToBoundingBox(labelText) {
        const bbox = new THREE.Box3().setFromObject(this._group);
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        const label = labelText !== undefined ? labelText : "";
        if (this._layerLabel) {
            const poi = this._layerLabel;
            poi.setPosition(center);
            poi.setLabel(label);
        } else {
            this._layerLabel = new U3dPOI({
                label: label,
                position: center
            });
            this._app._sceneComment.add(this._layerLabel);
        }
        this._layerLabel.show();
    }

    /**
     * 경계 라벨이 있으면 숨기고 자원을 해제한 뒤 주석 장면과 레이어에서 제거합니다.
     */
    removeLabelToBoundingBox() {
        if (!defined(this._layerLabel)) {
            return;
        }
        this._layerLabel.hide();
        UDEF.disposeObject3D(this._layerLabel);
        this._app._sceneComment.remove(this._layerLabel);
        this._layerLabel = undefined;
    }

    /**
     * DXF URL 로더를 실행하는 기존 진입점입니다. 현재 구현은 인수 대신 미정의 opt.url을 참조하므로 해당 환경에서 ReferenceError가 발생합니다.
     *
     * @param {string} url 기존 주소 인수; 현재 구현에서 사용하지 않음
     */
    parseDxfFromUrl(url) {
        const loader = new UDXFLoader();
        // 기존 URL 참조 문제는 기능 정리와 분리하여 spec의 Q-004에 남깁니다.
        loader.load(opt.url, (data) => {
            data.updateMatrix();
            data.updateMatrixWorld();
            this._scene.add(data);
        });
    }

    /**
     * 그리기 인자와 앱이 준비되면 연결된 2D 레이어와 부모의 표시 상태를 변경합니다. 숨길 때만 후속 라벨 숨김을 수행합니다.
     *
     * @override
     *
     * @param {boolean} bShow 표시 여부
     */
    show(bShow) {
        if (!defined(this._drawArg))
            return;
        const app = this._drawArg._app;
        if (!defined(app))
            return;
        if (defined(this._2dLayer)) {
            this._2dLayer.show(bShow);
        }
        U3dModelLayer.prototype.show.call(this, bShow);
        if (!bShow) {
            this.showLabel(bShow);
        }
    }

    /**
     * 개별 메시 라벨을 주석 장면에 추가하거나 제거합니다. 경계 라벨에는 show·hide도 적용합니다.
     *
     * @param {boolean} show 표시 여부
     */
    showLabel(show) {
        this._group.traverse((mesh) => {
            if (mesh instanceof THREE.Mesh) {
                if (mesh.userData.label) {
                    if (!show)
                        this._app._sceneComment.remove(mesh.userData.label);
                    else
                        this._app._sceneComment.add(mesh.userData.label);
                }
            }
        });
        if (defined(this._layerLabel)) {
            const sceneComment = this._drawArg.getSceneComment();
            if (!defined(sceneComment)) {
                console.info('sceneComment is null');
                return;
            }
            if (!show) {
                this._layerLabel.hide();
                sceneComment.remove(this._layerLabel);
            } else {
                this._layerLabel.show();
                sceneComment.add(this._layerLabel);
            }
        }
    }

    /**
     * 현재 그룹의 경계를 새로 계산합니다. 저장된 경계 캐시를 읽거나 갱신하지 않습니다.
     *
     * @returns {import('three').Box3} 새 경계 상자
     */
    getBoundingBox() {
        const obj = this._group;
        const bbox = new THREE.Box3().setFromObject(obj);
        return bbox;
    }

    /**
     * 폴리라인의 선·돌출 표시 방식을 변경합니다. 같은 값이면 종료하고 원본이 없으면 설정만 저장합니다.
     * 기존 자원을 해제한 뒤 보관한 원본으로 새 객체를 구성합니다. 새 객체 추가가 기존 객체 제거보다 먼저입니다.
     *
     * @param {boolean} value 돌출 표시 여부
     */
    setUseExtrude(value) {
        if (this._useExtrude === value)
            return;
        this._useExtrude = value;
        if (!this._entity || this._entity.length === 0)
            return;
        const polyGroup = getPolyGroup.call(this);
        if (!polyGroup)
            return;
        const list = polyGroup.children;
        const removeList = [];
        const addList = [];
        for (let i = 0; i < list.length; i++) {
            const mesh = list[i];
            const type = mesh._type;
            if (type === DXF_TYPE.LW_POLYLINE || type === DXF_TYPE.POLYLINE) {
                mesh.visible = false;
                mesh.traverse((child) => {
                    child.visible = false;
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                    if (child.material)
                        child.material.dispose();
                });
                if (mesh.userData.label) {
                    const label = mesh.userData.label;
                    UDEF.disposeObject3D(label);
                }
                removeList.push(mesh);
            }
        }
        this._entity.forEach(line => {
            let resultObject;
            if (!value) {
                resultObject = line.clone();
                addList.push(resultObject);
            } else {
                const vertexPoints = [];
                const positionAttr = line.geometry.getAttribute('position');
                if (!positionAttr)
                    return;
                for (let i = 0; i < positionAttr.count; i++) {
                    const x = positionAttr.getX(i);
                    const y = positionAttr.getY(i);
                    const z = positionAttr.getZ(i);
                    const vertex = new THREE.Vector3(x, y, z);
                    vertexPoints.push(vertex);
                }
                const mesh_ = extrudeDxf.call(this, vertexPoints, this._extrudeHeight);
                const color = colorList[materialIndex % colorList.length];
                materialIndex++;
                mesh_.material.color.set(color);
                resultObject = mesh_;
                addList.push(mesh_);
            }
            setLineTypePrototype.call(this, resultObject);
            resultObject.visible = true;
            resultObject.userData.entity = line.userData.entity;
            resultObject._type = line._type;
            if (this._styleFunction && resultObject) {
                const resultEntity = resultObject.userData.entity;
                this._styleFunction(resultEntity, resultObject);
            }
        });
        addList.forEach(child => {
            polyGroup.add(child);
        });
        removeList.forEach(child => {
            polyGroup.remove(child);
        });
    }

    /**
     * 현재 폴리라인 표시 방식 설정을 반환합니다.
     *
     * @returns {boolean} 돌출 표시 여부
     */
    getUseExtrude() {
        return this._useExtrude;
    }

    /**
     * 돌출 높이를 저장하고 돌출 표시 중인 폴리라인 형상을 다시 생성합니다. 기존 geometry 생성 옵션의 depth도 변경합니다.
     * 이전 객체를 먼저 제거한 뒤 새 객체를 추가하며 스타일 callback은 다시 호출하지 않습니다.
     *
     * @param {number} value 돌출 geometry의 depth
     */
    setExtrudeHeight(value) {
        if (this._extrudeHeight === value)
            return;
        this._extrudeHeight = value;
        if (!this._useExtrude)
            return;
        const polyGroup = getPolyGroup.call(this);
        if (!polyGroup)
            return;
        const removeList = [];
        const addList = [];
        const list = polyGroup.children;
        for (let i = 0; i < list.length; i++) {
            const mesh = list[i];
            const type = mesh._type;
            if (type === DXF_TYPE.LW_POLYLINE || type === DXF_TYPE.POLYLINE) {
                const mesh_ = regenerateExtrudeMesh(mesh, value);
                if (mesh_) {
                    mesh.traverse((child) => {
                        child.visible = false;
                        if (child.geometry) {
                            child.geometry.dispose();
                        }
                        if (child.material)
                            child.material.dispose();
                    });
                    removeList.push(mesh);
                    addList.push(mesh_);
                    setLabel.call(this, mesh_);
                    mesh_.position.z = mesh.position.z;
                    mesh_._type = type;
                }
            }
        }
        removeList.forEach(child => {
            polyGroup.remove(child);
        });
        addList.forEach(child => {
            polyGroup.add(child);
        });
    }

    /**
     * 현재 저장된 돌출 높이를 반환합니다.
     *
     * @returns {number} 돌출 geometry의 depth
     */
    getExtrudeHeight() {
        return this._extrudeHeight;
    }

    /**
     * Z 보정값을 저장하고 폴리라인 그룹과 연결된 라벨에 이전 값과의 차이를 더합니다. 같은 값이면 변경하지 않습니다.
     *
     * @param {number} value 그룹과 라벨의 Z 보정값
     */
    setHeightOffset(value) {
        if (this._heightOffset === value)
            return;
        const preHeight = this._heightOffset;
        this._heightOffset = value;
        const polyGroup = getPolyGroup.call(this);
        if (!polyGroup)
            return;
        polyGroup.position.z += (value - preHeight);
        polyGroup.traverse((child) => {
            if (child.userData.label) {
                child.userData.label.position.z += (value - preHeight);
            }
        });
    }

    /**
     * 현재 저장된 폴리라인 그룹의 Z 보정값을 반환합니다.
     *
     * @returns {number} Z 보정값
     */
    getHeightOffset() {
        return this._heightOffset;
    }

    /**
     * 폴리라인 그룹 중심의 렌더 고도에 보정값을 더해 그룹과 라벨의 Z를 변경합니다.
     * nullish·INVALID·TERRAIN_NO_DATA 고도는 0으로 처리하며 NaN은 별도 검사하지 않습니다.
     */
    updateHeightGroup() {
        const polyGroup = getPolyGroup.call(this);
        if (!polyGroup)
            return;
        const bbox = new THREE.Box3().setFromObject(polyGroup);
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        let height = this._drawArg.getRenderHeightAtPoint(center.x, center.y);
        if (!defined(height) || height === UDEF.INVALID || height === UDEF.TERRAIN_NO_DATA)
            height = 0;
        const resultHeight = height + this._heightOffset;
        polyGroup.position.z = resultHeight;
        polyGroup.traverse((child) => {
            if (child.userData.label) {
                child.userData.label.position.z = resultHeight;
            }
        });
    }
}

/**
 * 변환된 정점으로 돌출 메시를 만들고 라벨을 배치합니다. 빈 정점 배열은 처리하지 않습니다.
 *
 * @this {U3dModelDxfLayer}
 *
 * @param {Array<import('three').Vector3>} vertex 순서가 유지된 평면 윤곽 정점
 * @param {number} height 돌출 depth
 * @returns {import('@UMesh').UMesh} 라벨이 연결된 새 메시
 */
function extrudeDxf(vertex, height) {
    const self = this;
    // 입력 윤곽으로 새 형상을 만든 뒤 공개 흐름에서 라벨을 등록합니다.
    const geometry = INTERNAL.createExtrudeGeometry(vertex, height);
    // 현재 스타일을 읽어 독립된 재질을 만들며 공유 스타일 자체는 변경하지 않습니다.
    const material = INTERNAL.getDefaultMaterial(this);
    const mesh = new UMesh(geometry, material);
    setLabel.call(self, mesh);
    return mesh;
}

/**
 * 정점 XY를 입력 좌표계에서 지리 좌표를 거쳐 월드 좌표로 변환합니다. 원본 Z는 유지하지만 반환 벡터의 Z는 0입니다.
 *
 * @this {U3dModelDxfLayer}
 *
 * @param {import('three').BufferAttribute | import('three').InterleavedBufferAttribute} posAttribute 제자리 변경할 정점 속성
 * @param {number} index 정점 인덱스
 * @returns {import('three').Vector3} XY 변환 결과와 Z=0인 벡터
 */
function transformPosition(posAttribute, index) {
    const self = this;
    const geo = ol.proj.transform([posAttribute.getX(index), posAttribute.getY(index)], self._sourceCRS, 'EPSG:4326');
    const world = self._drawArg.getGeographicToWorld(geo[0], geo[1]);
    const vec = new THREE.Vector3(world.x, world.y, 0);
    posAttribute.setX(index, vec.x);
    posAttribute.setY(index, vec.y);
    return vec;
}

/**
 * 메시 식별 정보와 라벨을 설정하고 중심 배치·그림자·선택적 외곽선 및 행렬을 갱신합니다.
 *
 * @this {U3dModelDxfLayer}
 *
 * @param {import('@UMesh').UMesh} mesh 라벨과 형상 배치를 갱신할 메시
 */
function setLabel(mesh) {
    const self = this;
    const center = new THREE.Vector3();
    mesh.getBBox().getCenter(center);
    const google = self._drawArg.getWorldToGoogle(center.x, center.y);
    mesh.userData.id = UDEF.createGoogleKey(google.x, google.y) + '_' + mesh.id;
    mesh._utype = UDEF.UMESH_TYPE._building;
    mesh._ulayername = this._name;
    if (!mesh.userData.label) {
        const poi = new U3dPOI({
            label: self._style.label !== undefined ? self._style.label : "",
            position: center
        });
        mesh.userData.label = poi;
        self._app._sceneComment.add(poi);
    } else {
        const poi = mesh.userData.label;
        const label = self._style.label !== "" ? self._style.label : undefined;
        const text = label !== undefined ? label : poi.label;
        poi.setLabel(text);
        poi.setPosition(center);
    }
    mesh.userData.label.show();
    // 라벨 등록 후 중심 배치와 선택적 외곽선을 반영하고 두 행렬을 갱신합니다.
    INTERNAL.prepareLabelMesh(this, mesh, center);
}

/**
 * 돌출 생성 정보가 있는 메시를 지정 깊이로 다시 만듭니다. 원본 옵션을 변경하고 entity·label 참조를 공유합니다.
 *
 * @param {import('@UMesh').UMesh} mesh 원본 돌출 메시
 * @param {number} depth 변경할 돌출 depth
 * @returns {import('@UMesh').UMesh | undefined} 새 메시 또는 재생성 정보가 없는 상태
 */
function regenerateExtrudeMesh(mesh, depth) {
    if (!mesh || !mesh.geometry || !mesh.material)
        return;
    if (!mesh.geometry.parameters)
        return;
    // 기존 생성 옵션의 depth를 갱신하고 entity·label을 공유하는 새 메시를 받습니다.
    return INTERNAL.regenerateExtrudeMesh(mesh, depth);
}

/**
 * 직계 자식 중 첫 면 그룹을 찾습니다. 그룹이나 자식이 없으면 결과가 없습니다.
 *
 * @this {U3dModelDxfLayer}
 *
 * @returns {import('three').Object3D | undefined} 면 그룹
 */
function getFaceGroup() {
    const self = this;
    if (!self._group || self._group.children.length === 0)
        return;
    return self._group.children.find((child) => {
        return child.name === FACE_GROUP_NAME;
    });
}

/**
 * 직계 자식 중 첫 폴리라인 그룹을 찾습니다. 그룹이나 자식이 없으면 결과가 없습니다.
 *
 * @this {U3dModelDxfLayer}
 *
 * @returns {import('three').Object3D | undefined} 폴리라인 그룹
 */
function getPolyGroup() {
    const self = this;
    if (!self._group || self._group.children.length === 0)
        return;
    return self._group.children.find((child) => {
        return child.name === POLY_GROUP_NAME;
    });
}

/**
 * 원본 종류와 돌출 설정으로 처리 분기를 선택합니다. 돌출을 끄면 폴리라인을 선으로 처리합니다.
 *
 * @this {U3dModelDxfLayer}
 *
 * @param {string} [type] 소문자 DXF 종류
 * @returns {string | undefined} 처리 종류 또는 지원하지 않는 비돌출 종류
 */
function getDXFType(type) {
    const self = this;
    if (!defined(type))
        return;
    const isExtrude = self._useExtrude;
    if (type === DXF_TYPE.THREE_D_FACE || type === DXF_TYPE.INSERT || type === DXF_TYPE.LINE)
        return type;
    if (!isExtrude) {
        if (type === DXF_TYPE.LW_POLYLINE || type === DXF_TYPE.POLYLINE) {
            return DXF_TYPE.LINE;
        }
    } else {
        return type;
    }
}

/**
 * 기존 값이 falsy인 경우에만 선 객체의 조회·스타일 API를 보충합니다. 부착 함수는 호출 this와 무관하게 원래 레이어와 선을 사용합니다.
 *
 * @this {U3dModelDxfLayer}
 *
 * @param {U3dDxfObject} line API를 보충할 선 또는 돌출 객체
 */
function setLineTypePrototype(line) {
    const self = this;
    if (!line.getLayerName) {
        line.getLayerName = function () {
            return self.getName();
        };
    }
    if (!line.getLabel) {
        line.getLabel = function () {
            return line.userData.label;
        };
    }
    if (!line.setOpacity) {
        line.setOpacity = function (opacity) {
            if (!line.material)
                return;
            line.material.opacity = opacity;
            line.material.transparent = opacity < 1;
        };
    }
    if (!line.setColor) {
        line.setColor = function (color) {
            if (!line.material)
                return;
            line.material.color.set(color);
        };
    }
}
export { U3dModelDxfLayer };
