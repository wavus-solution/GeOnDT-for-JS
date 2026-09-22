import * as THREE from 'three';
import {U3dModelLayer} from '@union3d/3dLayer/U3dModelLayer';
import {U3dModelBasicLayer} from '@union3d/3dLayer/U3dModelBasicLayer';
import {defined} from '@union3d/util/defined';
import {UGroup} from '@union3d/core/UGroup';
import {defaultValue} from '@union3d/util/defaultValue';
import {UDEF} from '@union3d/core/UDEF';
import {normalizeOptionKeys} from '@union3d/util/normalizeOptionKeys';
import {INTERNAL} from '@union3d/3dLayer/U3dModelStaticLayer.internal';
const ol = __GEONDT__.ol;

/**
 * ~extends import('@union3d/3dLayer/U3dModelBasicLayer').U3dModelBasicLayer <br>
 *
 * 모델 목록을 하나의 그룹으로 읽어 배치하고 표시·경계·정점 축 교환을 관리하는 레이어입니다. <br>
 * 모델 형식별 로딩은 기반 레이어를 사용하며 XML 사용 기본값은 false입니다.
 *
 * @group 3dLayer
 */
class U3dModelStaticLayer extends U3dModelBasicLayer {
    /**
     * 기반 레이어의 옵션 정규화 키를 상속합니다. needXml도 이 목록에 포함됩니다.
     *
     * @override
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS = [...U3dModelBasicLayer.OPT_KEYS];

    /**
     * U3dModelStaticLayer 클래스 생성자입니다. <br>
     * 실제 모델 요청은 initialize에서 시작하며 옵션 키는 대소문자 구분 없이 정규화합니다.
     *
     * @param {Partial<U3dModelStaticLayerCO>} [opt={}] 이름·모델 목록·좌표계·표시 설정과 XML 사용 옵션
     */
    constructor(opt = {}) {
        opt = normalizeOptionKeys(opt, new.target);
        super(opt);

        this._classtype = 'U3dModelStaticLayer';
        this._type = UDEF.LAYER_TYPE.MODEL;
        this._renderBuffer = new UGroup({drawarg: this._drawArg});
        this._renderBuffer.name = this._name;
        /** @type {Array<import('three').Object3D> | undefined} */
        this._objectList = [];
        this._objectLoadCount = 0;
        this._needXml = defaultValue(opt.needXml, false);
        // 직접 추가한 모델도 같은 목록에 반영되도록 children 배열을 공유합니다.
        this._renderBuffer.children = this._objectList;
    }

    /**
     * 모델 목록의 로딩을 시작하고 각 결과를 정적 렌더 그룹에 배치합니다. <br>
     * 빈 목록 또는 마지막 성공 시 resolve에 레이어 자신을 전달하며 이 메서드는 완료 Promise를 반환하지 않습니다. <br>
     * 유효 메시의 _oriCenter는 로더나 setOriginCenter 재정의가 준비해야 합니다. <br>
     * 로딩 실패와 배치 예외를 이 메서드에서 복구하지 않습니다.
     *
     * @override
     */
    initialize() {
        // 정적 그룹은 공통 모델 초기화만 거칩니다. 즉시 부모의 initialize로 바꾸면 로딩 흐름이 달라집니다.
        U3dModelLayer.prototype.initialize.call(this);
        if (defined(this._scene)) {
            if (defined(this._object)) {
                this._scene.remove(this._object);
            }
        }

        if (this.load) {
            this._objectLoadCount = this._listModel.length;
            if (this._objectLoadCount === 0) {
                this.resolve(this);
            }
            for (let i = 0; i < this._listModel.length; i++) {
                this.load(this._listModel[i]).then((object) => {
                    this._objectLoadCount--;
                    // 요청 때의 복사본이 아니라 완료 시점에 목록에 있는 메타데이터를 사용합니다.
                    object._crs = this._listModel[i].crs;
                    object._ext = this._listModel[i].ext;
                    afterLoad.call(this, object);
                    this._renderBuffer.add(object);
                    if (this._objectLoadCount === 0) {
                        this._bbox = new THREE.Box3().setFromObject(this._renderBuffer);
                        const layerCenter = new THREE.Vector3();
                        this._bbox.getCenter(layerCenter);
                        this._center = layerCenter;
                        this.resolve(this);
                    }
                });
            }
        }
    }

    /**
     * 앱이 있으면 정적 렌더 그룹을 장면에서 제거하고 기반 레이어를 정리합니다. <br>
     * 기반 dispose의 Promise는 반환하지 않습니다. <br>
     * _drawArg가 없는 인스턴스에서 호출하면 접근 예외가 발생합니다.
     *
     * @override
     */
    dispose() {
        const app = this._drawArg._app;
        if (!defined(app)) {
            return;
        }
        if (defined(this._scene)) {
            this._scene.remove(this._renderBuffer);
        }
        this._objectList = undefined;
        this._renderBuffer.removeMesh(this._name);
        U3dModelBasicLayer.prototype.dispose.call(this);
    }

    /**
     * 정적 렌더 그룹의 현재 월드 좌표(EPSG:3857) 경계를 계산합니다. <br>
     * 경계가 이미 있으면 그 객체를 갱신하므로 이전에 받은 참조도 함께 변경됩니다.
     *
     * @override
     *
     * @returns {import('three').Box3} 내부에서 공유하는 경계 객체
     */
    getBoundingBox() {
        if (!defined(this._bbox)) {
            this._bbox = new THREE.Box3().setFromObject(this._renderBuffer);
        } else {
            this._bbox.setFromObject(this._renderBuffer);
        }
        return this._bbox;
    }

    /**
     * 정적 렌더 그룹의 장면 등록 여부와 공통 레이어 표시 상태를 변경합니다. <br>
     * _drawArg 또는 앱이 없으면 아무 작업도 하지 않습니다.
     *
     * @override
     *
     * @param {boolean} show true면 표시하고 false면 숨김
     */
    show(show) {
        if (!defined(this._drawArg)) {
            return;
        }
        const app = this._drawArg._app;
        if (!defined(app)) {
            return;
        }
        if (!defined(this._scene.getObjectById(this._renderBuffer.id)) && show) {
            this._scene.add(this._renderBuffer);
        } else if (defined(this._scene.getObjectById(this._renderBuffer.id)) && !show) {
            this._scene.remove(this._renderBuffer);
        }
        U3dModelLayer.prototype.show.call(this, show);
    }

    /**
     * 장면에서 이름으로 찾은 객체의 표시 여부를 변경합니다. <br>
     * 검색 범위는 이 레이어의 그룹으로 제한하지 않으며 _drawArg 또는 대상이 없으면 변경하지 않습니다.
     *
     * @param {string} name 장면에서 검색할 객체 이름
     * @param {boolean} show 객체의 visible에 지정할 표시 여부
     */
    showObject(name, show) {
        if (!defined(this._drawArg)) {
            return;
        }
        const object = this._scene.getObjectByName(name);
        if (defined(object)) {
            object.visible = show;
        }
    }

    /**
     * 레이어가 연결된 장면 전체에서 이름으로 객체를 검색합니다. <br>
     * 장면이 준비되지 않았다면 접근 예외가 발생합니다.
     *
     * @param {string} name 검색할 객체 이름
     * @returns {import('three').Object3D | undefined} 처음 찾은 객체의 원본 참조 또는 검색 실패 시 undefined
     */
    getObject(name) {
        return this._scene.getObjectByName(name);
    }

    /**
     * 렌더 그룹의 메시 정점에서 Y와 Z를 교환합니다. <br>
     * 축의 부호를 반전하는 기능은 아닙니다. <br>
     * position 속성과 형상·레이어 경계를 갱신하지만 normal·UV·index·boundingSphere는 갱신하지 않습니다. <br>
     * 공유 geometry에도 영향을 주며 중복 선택은 반복 적용됩니다. <br>
     * 기존 레이어 경계가 있어야 하고, position이 없으면 예외가 발생합니다.
     *
     * @param {Iterable<import('three').Object3D>} [mesh] uuid로 선택할 객체 목록. 생략하면 전체 메시를 처리하며 빈 목록은 정점을 바꾸지 않음
     */
    setFlipY(mesh) {
        // 선택된 방문 객체의 메시 정점과 형상 경계를 갱신하며, 선택 중복도 호출 횟수에 반영합니다.
        for (const child of this._renderBuffer.children) {
            child.traverse((item) => {
                if (defined(mesh)) {
                    const list = [...mesh];
                    for (const target of list) {
                        if (target.uuid === item.uuid) {
                            INTERNAL.swapMeshYZ(item);
                        }
                    }
                } else {
                    INTERNAL.swapMeshYZ(item);
                }
            });
        }
        this._bbox.setFromObject(this._renderBuffer);
    }

    /**
     * 전달한 객체를 복제하지 않고 정적 렌더 그룹에 추가합니다. <br>
     * 로딩 후 배치 처리를 수행하지 않으며 경계·중심·로딩 수를 별도로 갱신하지 않습니다.
     *
     * @param {import('three').Object3D} mesh 추가할 모델 객체
     */
    addModel(mesh) {
        this._renderBuffer.add(mesh);
    }
}

/**
 * 로딩한 객체의 메시 중심을 정리하고 입력 좌표계를 월드 위치에 반영합니다. <br>
 * 유효 메시의 _oriCenter가 없으면 예외가 발생하고 빈 목록은 NaN 위치가 됩니다.
 *
 * @this {U3dModelStaticLayer}
 * @param {U3dModelStaticObject} object 좌표계 메타데이터가 연결된 로딩 객체
 *
 * @ignore
 */
function afterLoad(object) {
    /** @type {Array<import('three').Vector3Like>} */
    const originCenters = [];
    object.traverse((mesh) => {
        if (mesh instanceof THREE.Mesh) {
            if (Object.keys(mesh.geometry.attributes).length === 0) {
                // 기존 순회·제거 순서를 유지합니다. 중첩 메시의 실제 부모에서 제거하지 않습니다.
                object.remove(mesh);
            } else {
                this.setOriginCenter(mesh);
                originCenters.push(mesh._oriCenter);
            }
        }
    });
    // 수집한 원본 중심에서 객체의 배치 기준점을 얻고, 좌표계 변환은 공개 흐름에서 수행합니다.
    let center = INTERNAL.averageOriginCenters(originCenters);
    let centerVec;
    if (defined(object._crs) && object._crs !== '') {
        center = ol.proj.transform(center, ol.proj.get(object._crs), ol.proj.get('EPSG:4326'));
        centerVec = this._drawArg.getGeographicToWorld(center[0], center[1], center[2]);
        centerVec = new THREE.Vector3(centerVec.x, centerVec.y, centerVec.z);
    } else {
        centerVec = new THREE.Vector3(center[0], center[1], center[2]);
    }
    object.position.copy(centerVec);
    object.matrixWorldNeedsUpdate = true;
    object.updateMatrix();
    object.updateMatrixWorld();
}

export {U3dModelStaticLayer};
