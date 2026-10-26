//@ts-check
import * as THREE from 'three';
import {defined} from "@util/defined";
import {defaultValue} from "@util/defaultValue";
import {UAnaly} from "@union3d/analy/UAnaly";
import {UDEF} from "@union3d/core/UDEF";
import {UGizmoControls} from "@union3d/mode/UGizmoControls";
import {__GError__, __GSError__, __GInfo__} from "@U3dMessage";
import {U3dOverlay} from '@union3d/overlay/U3dOverlay';
import {U3dAdaptedGeometry} from '@union3d/geometry/U3dAdaptedGeometry';
import {normalizeOptionKeys} from '@util/normalizeOptionKeys';
import {INTERNAL as GIZMO_INTERNAL} from '@union3d/analy/UAnalyGizmoModel.internal';

const TEMP_RELATIVE_POS = new THREE.Vector3();
const TEMP_RELATIVE_R = new THREE.Quaternion();
const TEMP_RELATIVE_S = new THREE.Vector3();

const TEMP_POSITION = new THREE.Vector3();
const TEMP_ROTATION = new THREE.Quaternion();
const TEMP_SCALE = new THREE.Vector3();
const TEMP_EULER = new THREE.Euler();

const TMP_M_PARENT = new THREE.Matrix4();
const TMP_M_PARENT_INV = new THREE.Matrix4();
const TMP_M_LOCAL      = new THREE.Matrix4();
const TMP_M_WORLD      = new THREE.Matrix4();

const _UP  = new THREE.Vector3(0, 1, 0);
const TEMP_VECTOR = new THREE.Vector3();
const TEMP_VECTOR2 = new THREE.Vector3();
const TEMP_QUATERNION = new THREE.Quaternion();
const TEMP_Q_INV = new THREE.Quaternion();

/**
 * 배율 나눗셈의 분모가 0이 되지 않게 하는 하한입니다.
 *
 * @const
 *
 * @type {number}
 *
 * @ignore
 */
const EPS = 1e-6;

/**
 * 보조 레이저의 길이 배율입니다.
 *
 * @const
 *
 * @type {number}
 *
 * @ignore
 */
const MAX_LASER_LEN = 3000;

/**
 * 숫자 모드 입력에 대응하는 편집 모드 목록입니다.
 *
 * @const
 *
 * @type {Array<string>}
 *
 * @ignore
 */
const GIZMO_MODE = ['translate', 'rotate', 'scale'];

/**
 * 허용하는 문자열 편집 모드 집합입니다.
 *
 * @const
 *
 * @type {Set<string>}
 *
 * @ignore
 */
const VALID_MODE = new Set(GIZMO_MODE);

/**
 * ~extends import('@union3d/analy/UAnaly').UAnaly <br>
 *
 * 기즈모(Gizmo)로 선택한 모델의 위치·회전·크기를 편집하는 분석 클래스입니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const gizmo = app.activeAnalysis('GizmoModel');
 */
class UAnalyGizmoModel extends UAnaly {
    /**
     * 생성 옵션의 정본 키 목록입니다.
     *
     * @override
     *
     * @ignore
     */
    static OPT_KEYS = [...UAnaly.OPT_KEYS, 'name'];

    /**
     * 편집 대상에 전달하는 변경 이벤트 이름입니다.
     *
     * @type {{CHANGE: string}}
     */
    static EVENT = {
        CHANGE : 'change'
    };

    /** @type {GizmoControlObject | undefined} */ #controlObj;
    /** @type {import('three').Box3} */ #controlBound;
    /** @type {Array<import('three').Object3D>} */ #target;
    /** @type {import('@union3d/overlay/U3dOverlay').U3dOverlay | undefined} */ #overlay;
    /** @type {UAnalyGizmoModelCallback | undefined} */ #updateFunc;
    /** @type {UAnalyGizmoModelCallback | undefined} */ #endFunc;
    /** @type {() => void} */ #onMouseUp;
    /** @type {boolean} */ #needUpdateWorld;
    /** @type {boolean} */ #useLaser;
    /** @type {Array<UAnalyGizmoModelLaser>} */ #lasers;
    /** @type {boolean} */ #isDrag;
    /**
     *
     * @type {string | null | undefined}
     *
     * @ignore
     */ _clickId;
    /**
     *
     * @type {import('@UGizmoControls').UGizmoControls | undefined}
     *
     * @ignore
     */ _control;
    /**
     *
     * @type {Array<import('three').Object3D>}
     *
     * @ignore
     */ _targetScenes;

    /**
     * UAnalyGizmoModel 클래스 생성자입니다. <br>
     * 앱 연결 후 활성화하고 setObject로 편집할 모델을 선택합니다.
     *
     * @param {UAnalyGizmoModelCO} [opt={}] 분석 이름 옵션
     */
    constructor(opt) {
        super();
        opt = opt || {};
        const normalized = normalizeOptionKeys(opt, new.target);
        // 정규화가 복사한 옵션도 기존에 상속받아 읽던 속성을 잃지 않도록 합니다.
        if (normalized !== opt) Object.setPrototypeOf(normalized, Object.getPrototypeOf(opt));
        opt = normalized;
        this.name = defaultValue(opt.name, 'GizmoModel');
        this._clickId = undefined;
        this._control = undefined;
        this._targetScenes = [];
        this.#target = [];
        this.#needUpdateWorld = false;

        // 화면 컨트롤과 별개로 선택 대상의 기준 변환을 저장하는 객체입니다.
        this.#controlObj = this.#createControlObject();
        this.#controlBound = new THREE.Box3();

        this._scene?.add(this.#controlObj);
        this.#overlay = undefined;
        this.#updateFunc = undefined;
        this.#endFunc = undefined;

        this.#useLaser = true;
        this.#lasers = [];
        this.#isDrag = false;

        this.#onMouseUp = this.#mouseUpListener.bind(this);
    }

    /**
     * 컨트롤이 마지막으로 알린 드래그 상태를 반환합니다.
     *
     * @returns {boolean} 드래그 중이면 true
     */
    get isDrag() { return this.#isDrag; }

    /**
     * 편집 중 보조 레이저(laser)를 사용할지 설정합니다. <br>
     * 이미 표시된 레이저의 가시성은 즉시 바꾸지 않습니다.
     *
     * @param {boolean} use 레이저 사용 여부
     */
    setUseLaser(use) {
        if (typeof use !== 'boolean') return;
        this.#useLaser = use;
    }

    /**
     * 생성된 보조 레이저(laser)의 색·불투명도·두께를 바꿉니다. <br>
     * 생성 전에는 저장하지 않으며 이후 새로 만드는 레이저에는 적용되지 않습니다.
     *
     * @param {UAnalyGizmoModelLaserStyle} style 변경할 속성만 지정하는 필수 객체
     * @throws {TypeError} style을 생략하거나 null을 전달한 경우
     */
    setLaserStyle({ color, opacity, radius }) {
        if (!this.#lasers || this.#lasers.length === 0) return;

        for (const { mesh } of this.#lasers) {
            const material = /** @type {import('three').MeshBasicMaterial} */ (mesh.material);
            if (!defined(material)) continue;

            if (defined(color)) {
                const _color = (color instanceof THREE.Color) ? color : new THREE.Color(/** @type {string | number} */ (color));
                material.color.copy(_color);
            }

            if (defined(opacity)) {
                opacity = THREE.MathUtils.clamp(opacity, 0, 1);
                material.opacity = opacity;
            }

            if (defined(radius)) {
                const y = mesh.scale.y;
                const rad = Math.max(1e-3, Number(radius) || 1);
                mesh.scale.set(rad, y, rad);
                mesh.userData['radius'] = rad;
            }
        }
    }

    #mouseUpListener() {
        this.#endFunc?.(this, this.#target, this.#controlObj, this.#controlBound);
    }

    /**
     * 컨트롤의 mouseUp 때 호출할 편집 종료 콜백을 등록합니다.
     *
     * @param {UAnalyGizmoModelCallback} func 종료 시 실행할 함수
     */
    setEndFunc(func) {
        if (typeof func !== 'function') {
            __GError__(this, `입력한 파라미터가 함수 형식이 아닙니다. 입력 파라미터 : ${func}`, '7054644');
            return;
        }
        this.#endFunc = func;
    }

    /**
     * 대상 변환과 보조 레이저 갱신 뒤 호출할 콜백을 등록합니다.
     *
     * @param {UAnalyGizmoModelCallback} func 갱신 시 실행할 함수
     */
    setUpdateFunc(func) {
        if (typeof func !== 'function') {
            __GError__(this, `입력한 파라미터가 함수 형식이 아닙니다. 입력 파라미터 : ${func}`, '7054981');
            return;
        }
        this.#updateFunc = func;
    }

    /**
     * 편집 제어(control) 객체의 월드 위치를 반환합니다. <br>
     * 제어 객체를 제거한 뒤에는 getControlObj 또는 setObject로 다시 준비해야 합니다.
     *
     * @returns {WorldPositionVector3} 월드 좌표(EPSG:3857)의 공유 벡터이며 이후 호출·편집에서 값이 덮어써질 수 있습니다.
     */
    getControlPosition() {
        const controlObj = /** @type {GizmoControlObject} */ (this.#controlObj);
        const matrix = controlObj.matrixWorld;
        matrix.decompose(TEMP_POSITION, TEMP_ROTATION, TEMP_SCALE);
        return TEMP_POSITION;
    }

    /**
     * 중복과 선택된 자손을 제외한 편집 대상 목록을 반환합니다.
     *
     * @returns {Array<import('three').Object3D>} 복사하지 않은 선택 루트 배열
     */
    get target() { return this.#target; }

    /**
     * 편집 제어(control) 객체를 반환하고 없으면 생성하여 컨트롤에 연결합니다.
     *
     * @returns {GizmoControlObject} 분석이 소유하는 제어 객체의 원본 참조
     */
    getControlObj() {
        if (!defined(this.#controlObj)) {
            this.#controlObj = this.#createControlObject();
            this._scene?.add(this.#controlObj);
            this._control?.attach(this.#controlObj);
        }
        return /** @type {GizmoControlObject} */ (this.#controlObj);
    }

    /**
     * 선택 대상 자체가 아닌 하위에 adapter가 포함되어 있는지 판정합니다.
     *
     * @param {import('@union3d/geometry/U3dAdaptedGeometry').U3dAdaptedGeometry} adapter 판정할 형상
     * @returns {boolean} 선택 대상의 자손에 포함되는지 여부
     */
    #isChildrenAdapter(adapter) {
        // 선택 대상에 속한 형상은 외부 교차 후보에서 제외합니다.
        return GIZMO_INTERNAL.isChildrenAdapter(this.#target, adapter);
    }

    /**
     * 편집 범위와 어댑터(adapter) 형상의 교차 정보를 조회합니다. <br>
     * 해제된 형상과 선택 대상의 자손은 제외합니다.
     *
     * @param {import('@union3d/geometry/U3dAdaptedGeometry').U3dAdaptedGeometry} adapter 검사할 형상
     * @returns {UAnalyGizmoModelIntersection | undefined} 형상에서 반환한 교차 정보이며 제외되거나 교차하지 않으면 undefined
     */
    intersectAdapter(adapter) {
        if (!defined(adapter) || !(adapter instanceof U3dAdaptedGeometry) || /** @type {import('@union3d/geometry/U3dAdaptedGeometry').U3dAdaptedGeometry} */ (adapter)._disposed) return;
        if (this.#isChildrenAdapter(adapter)) return;
        const gizmoBound = this.#controlBound;
        return adapter.intersectBox(gizmoBound);
    }

    /**
     * 여러 어댑터(adapter)의 교차 정보를 거리 오름차순으로 반환합니다.
     *
     * @param {Array<import('@union3d/geometry/U3dAdaptedGeometry').U3dAdaptedGeometry>} adapters 검사할 형상 목록
     * @returns {Array<UAnalyGizmoModelIntersection>} 교차한 항목의 새 배열이며 비유한 거리는 뒤로 배치됩니다.
     */
    intersectAdapters(adapters) {
        if (!adapters || !Array.isArray(adapters) || adapters.length < 1) return [];

        const results = [];
        for (const adapter of adapters) {
            const result = this.intersectAdapter(adapter);
            if (defined(result)) {
                results.push(result);
            }
        }

        results.sort((a, b) => {
            const distA = Number.isFinite(a.distance) ? a.distance : Infinity;
            const distB = Number.isFinite(b.distance) ? b.distance : Infinity;
            return distA - distB;
        });

        return results;
    }

    /**
     * 편집 제어 객체를 지정한 위치로 이동합니다. <br>
     * 제어 객체를 먼저 준비해야 하며 모델 자체의 변환은 다음 update에서 적용합니다.
     *
     * @param {WorldPositionVector3} position 이동할 월드 좌표(EPSG:3857)
     */
    setManualUpdate(position) {
        if (!position?.isVector3) return;

        const ctrl = /** @type {UGizmoControlsTC | undefined} */ (/** @type {unknown} */ (this._control));
        const obj  = /** @type {GizmoControlObject} */ (this.#controlObj);

        if (ctrl?.object === obj) {
            obj.position.copy(position);
            obj.updateMatrixWorld(true);
            return;
        }

        ctrl?.detach();
        obj.position.copy(position);
        obj.updateMatrixWorld(true);
        ctrl?.attach(obj);
    }

    /** 제어 객체 조립을 위임하며 소유와 장면 등록은 이 클래스에서 담당합니다. */
    #createControlObject() {
        // 선택 전 기준값을 가진 숨겨진 편집 제어 객체를 준비합니다.
        return GIZMO_INTERNAL.createControlObject();
    }

    /**
     *
     * @param {Array<import('three').Object3D>} [target]
     * @returns {import('three').Vector3 | undefined}
     */
    #getCentroidOfTargets(target = []) {
        if (target.length < 1) return;

        const centroid = new THREE.Vector3();
        let num = 0;
        for (const obj of target) {
            const objCenter = this.#asPoint3(obj);
            if (defined(objCenter)) {
                centroid.add(objCenter);
                num++;
            }
        }
        return num ? centroid.multiplyScalar(1 / num) : undefined;
    }

    /**
     *
     * @param {import('three').Object3D} obj
     * @returns {boolean}
     */
    #canUseThreeWorld(obj) {
        for (let parent = obj.parent; parent; parent = parent.parent) {
            if (!parent.isObject3D) return false;
            if (!defined(parent.updateMatrixWorld)) return false;
        }
        return true;
    }

    /**
     *
     * @param {import('three').Object3D} obj
     * @returns {import('three').Vector3 | undefined}
     */
    #asPoint3(obj) {
        if (!defined(obj)) return;
        const vector3 = new THREE.Vector3();

        if (obj.isObject3D) {
            if (this.#canUseThreeWorld(obj)) {
                return obj.getWorldPosition(vector3);
            } else {
                const hasPos = obj.position && typeof obj.position.x === 'number';
                const pos = hasPos
                    ? TEMP_POSITION.set(obj.position.x, obj.position.y, obj.position.z)
                    : TEMP_POSITION.set(0, 0, 0);

                let quat;
                if (obj.quaternion && typeof obj.quaternion.w === 'number') {
                    quat = obj.quaternion;
                } else if (obj.rotation && typeof obj.rotation.x === 'number') {
                    TEMP_EULER.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
                    quat = TEMP_ROTATION.setFromEuler(TEMP_EULER);
                } else {
                    quat = TEMP_ROTATION.identity();
                }

                const hasScl = obj.scale && typeof obj.scale.x === 'number';
                const scl = hasScl
                    ? TEMP_SCALE.set(obj.scale.x, obj.scale.y, obj.scale.z)
                    : TEMP_SCALE.set(1, 1, 1);

                const parentWorld = this.#getWorldMatrixOf(obj.parent);
                TMP_M_LOCAL.compose(pos, quat, scl);
                TMP_M_WORLD.copy(parentWorld).multiply(TMP_M_LOCAL);
                return TEMP_POSITION.setFromMatrixPosition(TMP_M_WORLD);
            }
        }

        if (defined(obj.position) && typeof obj.position.x === 'number') {
            return vector3.set(obj.position.x, obj.position.y, obj.position.z);
        }
        return undefined;
    }

    /**
     *
     * @param {Array<import('three').Object3D>} [target]
     *
     * @ignore
     */
    #applyControlObject(target = []) {
        if (target.length === 0) return;

        const controlObj = /** @type {GizmoControlObject} */ (this.#controlObj);
        const matrix = controlObj.matrixWorld;

        const prevCenter = this.#getCentroidOfTargets(target);
        if (!prevCenter) return;

        const size = new THREE.Vector3();
        this.#controlBound.getSize(size);
        const curCenter = new THREE.Vector3().setFromMatrixPosition(matrix);
        this.#controlBound.setFromCenterAndSize(curCenter, size);

        matrix.decompose(TEMP_POSITION, TEMP_ROTATION, TEMP_SCALE);
        const nowPos   = TEMP_POSITION.clone();
        const nowQuat  = TEMP_ROTATION.clone();
        const nowScale = TEMP_SCALE.clone();

        for (const obj of target) {
            let relativePos, relativeRot, relativeScl;
            if (obj.isObject3D) {
                if (!this.#needUpdateWorld) {
                    obj.updateMatrixWorld(true);
                    this.#needUpdateWorld = true;
                }
                obj.matrixWorld.decompose(TEMP_POSITION, TEMP_RELATIVE_R, TEMP_SCALE);
            } else {
                if (obj.rotation && typeof obj.rotation.x === 'number') {
                    TEMP_EULER.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
                } else { TEMP_EULER.set(0, 0, 0); }
                TEMP_RELATIVE_R.setFromEuler(TEMP_EULER);

                if (obj.position && typeof obj.position.x === 'number') {
                    TEMP_POSITION.set(obj.position.x, obj.position.y, obj.position.z);
                } else { TEMP_POSITION.set(0, 0, 0); }

                if (obj.scale && typeof obj.scale.x === 'number') {
                    TEMP_SCALE.set(obj.scale.x, obj.scale.y, obj.scale.z);
                } else { TEMP_SCALE.set(1, 1, 1); }
            }

            const rotOffset = TEMP_QUATERNION.copy(nowQuat)
                .multiply(TEMP_Q_INV.copy(controlObj._baseQuat).invert())
                .normalize();

            relativeRot = TEMP_RELATIVE_R.multiply(rotOffset);

            const posOffset = TEMP_VECTOR.copy(TEMP_POSITION).sub(prevCenter);
            relativePos = TEMP_RELATIVE_POS.copy(nowPos).add(posOffset);

            const sclOffset = TEMP_VECTOR2.set(
                nowScale.x / Math.max(controlObj._baseScl.x, EPS),
                nowScale.y / Math.max(controlObj._baseScl.y, EPS),
                nowScale.z / Math.max(controlObj._baseScl.z, EPS),
            );
            relativeScl = TEMP_RELATIVE_S.copy(TEMP_SCALE).multiply(sclOffset);

            if (obj.isObject3D) {
                this.#applyWorldMat(obj, { pos: relativePos, rot: relativeRot, scl: relativeScl });
            } else {
                const ctrlMode = /** @type {UGizmoControlsTC | undefined} */ (
                    /** @type {unknown} */ (this._control)
                )?.mode;
                if (ctrlMode === 'rotate') {
                    this.#setTargetRotation(obj, relativeRot);
                } else if (ctrlMode === 'scale') {
                    this.#setTargetScale(obj, relativeScl);
                } else {
                    this.#setTargetPosition(obj, relativePos);
                }
            }
            obj.dispatchEvent?.(/** @type {any} */ ({ type: UAnalyGizmoModel.EVENT.CHANGE, data: obj }));
        }

        controlObj._basePos.copy(nowPos);
        controlObj._baseQuat.copy(nowQuat).normalize();
        controlObj._baseScl.copy(nowScale);

        this.#updateOverlay(TEMP_POSITION);
    }

    /**
     * 편집한 월드 변환을 적용하고 변경 이벤트에서 사용할 자식의 월드 행렬까지 갱신합니다. <br>
     * 컴포넌트 부모와 수동 월드 행렬을 지원하기 위해 여기서 계산한 obj.matrixWorld를 유지합니다.
     *
     * @param {import('three').Object3D} obj 편집할 객체
     * @param {Partial<{pos: import('three').Vector3, rot: import('three').Quaternion, scl: import('three').Vector3}>} [param1] 적용할 월드 위치·회전·배율
     *
     * @ignore
     */
    #applyWorldMat(obj, { pos, rot, scl } = {}) {
        const parent = obj.parent;

        obj.matrixWorld.decompose(TEMP_POSITION, TEMP_ROTATION, TEMP_SCALE);

        const Pn = pos ?? TEMP_POSITION;
        const Qn = rot ?? TEMP_ROTATION;
        const Sn = scl ?? TEMP_SCALE;

        TMP_M_WORLD.compose(Pn, Qn, Sn);

        if (defined(parent)) {
            const parentWorld = this.#getWorldMatrixOf(parent);
            TMP_M_PARENT_INV.copy(parentWorld).invert();
            TMP_M_LOCAL.multiplyMatrices(TMP_M_PARENT_INV, TMP_M_WORLD);
        } else {
            TMP_M_LOCAL.copy(TMP_M_WORLD);
        }

        obj.matrixAutoUpdate = false;
        obj.matrix.copy(TMP_M_LOCAL);
        obj.matrixWorldNeedsUpdate = true;
        TMP_M_LOCAL.decompose(obj.position, obj.quaternion, obj.scale);
        obj.matrixWorld.copy(TMP_M_WORLD);

        // 갱신 표시는 부모에서 자식을 개별 조회하는 경로까지 강제 갱신을 전달하지 않는다.
        // 이미 계산한 부모 월드 행렬을 기준으로 하위를 갱신하여 change 구독자가 이전 좌표를 읽지 않게 한다.
        // matrixWorldAutoUpdate=false인 자식은 Three.js가 직접 저장한 월드 행렬을 보존한다.
        for (const child of obj.children) child.updateMatrixWorld(true);
    }

    /**
     * 로컬 변환의 기준이 되는 부모의 현재 월드 행렬을 조회합니다. <br>
     * Object3D 부모는 이미 조상 변환이 포함된 행렬을 사용하고, 컴포넌트 부모는 기존 좌표 공급 경로를 사용합니다.
     *
     * @param {import('three').Object3D | null} node 기준 부모
     * @returns {import('three').Matrix4} 내부에서 재사용하는 부모 월드 행렬
     *
     * @ignore
     */
    #getWorldMatrixOf(node) {
        // 로컬 행렬은 직계 부모 기준이다. 최상위 조상까지 올라가면 중간 부모의 변환을 빠뜨린다.
        if (node?.isObject3D) return TMP_M_PARENT.copy(node.matrixWorld);
        TMP_M_PARENT.identity();
        const path = [];
        for (let obj = node; obj; obj = obj.parent) {
            path.push(obj);
        }
        for (let i = path.length - 1; i >= 0; i--) {
            const obj = path[i];
            if (obj.isObject3D) {
                TMP_M_PARENT.premultiply(obj.matrixWorld);
                break;
            } else {
                TMP_M_PARENT.copy((/** @type {{getMatrixWorld: () => import('three').Matrix4}} */ (/** @type {unknown} */ (obj))).getMatrixWorld());
            }
        }
        return TMP_M_PARENT;
    }

    /**
     *
     * @param {import('three').Object3D & Partial<{setPosition: (function(import('three').Vector3): void)}>} obj
     * @param {import('three').Vector3} position
     *
     * @ignore
     */
    #setTargetPosition(obj, position) {
        if (!defined(obj)) return;
        if (obj.setPosition) {
            obj.setPosition(position);
        } else {
            obj.position?.copy?.(position);
            obj.updateMatrixWorld(true);
        }
    }

    /**
     *
     * @param {import('three').Object3D & Partial<{setRotation: (function(import('three').Euler): void)}>} obj
     * @param {import('three').Quaternion | import('three').Euler} rotation
     *
     * @ignore
     */
    #setTargetRotation(obj, rotation) {
        if (!obj) return;

        let euler;
        if (rotation instanceof THREE.Euler) {
            euler = rotation;
        } else if (rotation instanceof THREE.Quaternion) {
            euler = TEMP_EULER.setFromQuaternion(rotation);
        } else {
            __GError__(this, `is not vailed parameter : ${rotation}`, `0516652`);
            return;
        }

        if (obj.setRotation) {
            obj.setRotation(euler);
        } else {
            obj.rotation?.copy?.(euler);
            obj.updateMatrixWorld(true);
        }
    }

    /**
     *
     * @param {import('three').Object3D & Partial<{setScale: (function(import('three').Vector3): void)}>} obj
     * @param {import('three').Vector3} scale
     *
     * @ignore
     */
    #setTargetScale(obj, scale) {
        if (!obj) return;
        if (obj.setScale) {
            obj.setScale(scale);
        } else {
            obj.scale?.copy?.(scale);
            obj.updateMatrixWorld(true);
        }
    }

    /**
     *
     * @param {import('three').Vector3} position
     *
     * @ignore
     */
    #updateOverlay(position) {
        const overlay = this.#overlay;
        if (!defined(overlay)) return;
        const latlon = this._app?.vector3ToGeoGraphic(position);
        if (!defined(latlon)) return;
        overlay.setPosition(latlon, position);
        overlay.callOnchange();
    }

    /**
     * 편집 컨트롤(control)의 원본 참조를 생성 없이 반환합니다.
     *
     * @returns {import('@UGizmoControls').UGizmoControls | undefined} 연결한 컨트롤이며 미생성 또는 제거 후에는 undefined
     */
    getControl() {
        return this._control;
    }

    /**
     * 부모 화면 갱신 요청 후 대상 변환·보조 레이저·사용자 콜백을 차례로 갱신합니다.
     *
     * @override
     */
    update() {
        super.update();
        this.#applyControlObject(this.#target);
        this.#updateLaser();
        this.#updateFunc?.(this, this.#target, this.#controlObj, this.#controlBound);
    }

    /**
     * 기존 편집 상태를 제거하고 앱의 카메라·입력 요소에 기즈모(Gizmo) 컨트롤을 만듭니다. <br>
     * 앱 연결이 필요하며 새 컨트롤에는 setObject 또는 getControlObj로 제어 객체를 다시 연결합니다.
     */
    createGizmo() {
        if (!this._app || !this._sceneComment) {
            __GInfo__(this, 'U3dApp 가 등록되지 않았습니다. setApp 함수가 먼저 실행 되어야 합니다.', '5561263');
            return;
        }

        this.removeGizmo();

        const app = this._app;
        this._control = new UGizmoControls({
            camera: app.getCamera(),
            domelement: app.getRenderer()?.domElement,
            app
        });
        const ctrl = /** @type {UGizmoControlsTC} */ (/** @type {unknown} */ (this._control));
        ctrl.addEventListener('mouseUp', this.#onMouseUp);
        ctrl.addEventListener('dragging-changed', (/** @type {{ type: string, value: boolean }} */ e) => {
            const isDragging = !!e.value;
            this.#isDrag = isDragging;
            if (!this.#useLaser) { this.hideLaser(); return; }
            if (isDragging) this.showLaser();
            else this.hideLaser();
        });
        this._sceneComment?.add(/** @type {import('three').Object3D} */ (/** @type {unknown} */ (ctrl)));
    }

    /**
     * 기즈모(Gizmo) 컨트롤·제어 객체·레이저를 해제하고 선택과 원본 변환 저장값을 비웁니다. <br>
     * 등록한 사용자 콜백은 유지하며 오버레이는 참조만 분리합니다.
     */
    removeGizmo() {
        if (defined(this._control)) {
            const ctrl = /** @type {UGizmoControlsTC} */ (/** @type {unknown} */ (this._control));
            this._sceneComment?.remove(/** @type {import('three').Object3D} */ (/** @type {unknown} */ (this._control)));
            ctrl.removeEventListener('mouseUp', this.#onMouseUp);
            ctrl.detach();
            ctrl.dispose();
            this._control = undefined;
        }

        if (defined(this.#controlObj)) {
            this._scene?.remove(/** @type {import('three').Object3D} */ (this.#controlObj));
            UDEF.disposeObject3D(/** @type {import('three').Object3D} */ (this.#controlObj));
            this.#controlObj = undefined;
        }

        this.removeLasers();

        if (this.#target.length > 0) {
            for (const obj of this.#target) {
                if (defined(obj.userData?.origin)) obj.userData.origin = undefined;
            }
            this.#target = [];
        }

        if (defined(this.#overlay)) {
            this.#overlay = undefined;
        }
    }

    /**
     *
     * @param {Array<import('three').Object3D>} objects 선택 후보
     * @returns {Array<import('three').Object3D>} 부모·자식의 중복을 제거한 새 배열
     */
    #getRootObject(objects) {
        // 같은 대상이나 부모·자식을 중복 편집하지 않도록 선택 루트를 확정합니다.
        return GIZMO_INTERNAL.getRootObject(objects);
    }

    /** 선택 대상의 경계를 현재 편집 범위에 반영합니다. */
    #setTargetBound() {
        // 현재 선택 범위를 갱신하며 예외 기록과 후속 처리 지속은 setObject가 담당합니다.
        GIZMO_INTERNAL.setTargetBound(this.#target, this.#controlBound);
    }

    /**
     * 활성 상태에서 편집할 모델을 선택하고 되돌리기에 사용할 원본 변환을 저장합니다. <br>
     * 중복과 선택된 자손은 편집 대상에서 제외하되 제어 중심은 전달한 원래 목록으로 구합니다.
     *
     * @param {Array<import('three').Object3D> | import('three').Object3D} object 편집할 모델 또는 모델 목록
     */
    setObject(object) {
        if (!this._isActive) return;

        const controlObj = this.getControlObj();

        if (!Array.isArray(object)) object = [object];

        const roots = this.#getRootObject(object);
        this.#target = roots;

        try {
            this.#setTargetBound();
        } catch (e) {
            __GSError__(e);
        }

        this.#resetGizmo(object, controlObj);
        this.#needUpdateWorld = false;

        for (const obj of roots) {
            (/** @type {{hasGizmo: (import('@UGizmoControls').UGizmoControls|undefined)}} */ (/** @type {unknown} */ (obj))).hasGizmo = this._control;
            if (defined(obj.parent)) (/** @type {{hasGizmo: (import('@UGizmoControls').UGizmoControls|undefined)}} */ (/** @type {unknown} */ (obj.parent))).hasGizmo = this._control;

            if (!defined(obj.userData)) obj.userData = {};
            if (!defined(obj.userData['origin'])) {
                obj.userData['origin'] = {
                    position: obj.position.clone(),
                    rotation: obj.rotation.clone(),
                    scale:    obj.scale.clone()
                };
            }
        }
    }

    /**
     * 선택 대상의 연결 객체와 분석 구독자에게 onChange 이벤트를 전달합니다.
     */
    objectChange() {
        if (!defined(this._control)) this.createGizmo();

        const gizmoControl = this._control;
        for (const obj of this.#target) {
            if (defined(obj.userData?.class)) {
                obj.userData.class.dispatchEvent({ type: 'onChange', data: obj.userData.class, control: gizmoControl });
            }
            this.dispatchEvent({ type: 'onChange', data: obj.userData.class });
        }
    }

    /**
     * 대상 장면 목록을 비우고 컨트롤이 있으면 편집 상태와 자원을 제거합니다.
     *
     * @override
     */
    clear() {
        this._targetScenes = [];
        if (!this._control) return;
        this.removeGizmo();
    }

    /**
     * 저장된 원본 위치·회전·크기로 모델을 되돌리고(reset) 제어 기준을 초기화합니다.
     *
     * @param {Array<import('three').Object3D> | import('three').Object3D} [object] 복구할 모델이며 생략하면 현재 선택 대상
     */
    reset(object) {
        if (!defined(object)) object = this.#target;
        if (!Array.isArray(object)) object = [object];

        for (const obj of object) {
            const origin = obj.userData?.origin;
            if (defined(origin)) {
                this.#setTargetPosition(obj, origin.position);
                this.#setTargetRotation(obj, origin.rotation);
                this.#setTargetScale(obj, origin.scale);
            }
        }

        this.#resetGizmo(object, this.#controlObj);
    }

    /**
     *
     * @param {Array<import('three').Object3D>} object
     * @param {GizmoControlObject | undefined} controlObj
     *
     * @ignore
     */
    #resetGizmo(object, controlObj) {
        if (!defined(controlObj) || !defined(object)) return;
        if (Array.isArray(object) && object.length === 0) return;

        const ctrl = /** @type {GizmoControlObject} */ (controlObj);
        const center = this.#getCentroidOfTargets(object);

        if (center) ctrl.position.copy(center);
        ctrl.rotation.set(0, 0, 0);
        ctrl.scale.set(1, 1, 1);
        ctrl.updateMatrixWorld(true);

        ctrl._basePos.copy(center ?? new THREE.Vector3());
        ctrl._baseQuat.identity();
        ctrl._baseScl.set(1, 1, 1);
    }

    /**
     * 편집 위치를 표시할 오버레이(overlay)를 등록합니다.
     *
     * @param {import('@union3d/overlay/U3dOverlay').U3dOverlay} overlay 위치 갱신과 변경 알림을 받을 오버레이
     */
    setOverlay(overlay) {
        if (overlay instanceof U3dOverlay) {
            this.#overlay = overlay;
        }
    }

    /**
     * 등록한 위치 표시 오버레이(overlay)를 반환합니다.
     *
     * @returns {import('@union3d/overlay/U3dOverlay').U3dOverlay | undefined} 등록 객체의 원본 참조이며 미등록이면 undefined
     */
    getOverlay() {
        return this.#overlay;
    }

    /**
     * 기즈모(Gizmo)의 위치·회전·크기 편집 모드를 설정합니다.
     *
     * @param {string | number} mode translate 또는 0은 위치, rotate 또는 1은 회전, scale 또는 2는 크기이며 문자열 대소문자는 구분하지 않습니다.
     */
    setMode(mode) {
        if (!defined(this._control)) this.createGizmo();

        if (typeof mode === 'number') mode = GIZMO_MODE[mode];
        else if (typeof mode === 'string') mode = String(mode).toLowerCase();

        if (!VALID_MODE.has(mode)) {
            return console.warn(`'${mode}' is not supported. support modes: ['rotate' 'scale' 'translate']`);
        }

        const ctrl = /** @type {UGizmoControlsTC | undefined} */ (/** @type {unknown} */ (this._control));
        if (ctrl?.getMode() === mode) return;
        ctrl?.setMode(/** @type {'translate' | 'rotate' | 'scale'} */ (mode));
    }

    /**
     * 기즈모(Gizmo)의 편집 모드를 반환하고 컨트롤이 없으면 생성을 시도합니다.
     *
     * @returns {string} translate는 위치, rotate는 회전, scale은 크기 편집이며 조회값이 nullish이면 translate
     */
    getMode() {
        if (!defined(this._control)) this.createGizmo();
        return (/** @type {UGizmoControlsTC | undefined} */ (/** @type {unknown} */ (this._control)))?.getMode() ?? 'translate';
    }

    /**
     *
     * @ignore
     */
    #initLasers() {
        if (this.#lasers?.length !== 0) return;

        const geom    = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
        const baseMat = new THREE.MeshBasicMaterial({ color: '#00ff00', transparent: true, opacity: 0.7 });

        const axes = [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, 1),
        ];

        for (const axis of axes) {
            // 축별 표시 객체를 준비하고 장면 등록과 소유 관계는 여기서 유지합니다.
            const mesh = GIZMO_INTERNAL.createLaserMesh(geom, baseMat);
            /** @type {import('three').Scene} */ (this._scene).add(mesh);
            this.#lasers.push({ mesh, axis });
        }
    }

    /**
     * 보조 레이저(laser)를 장면에서 분리하고 자원을 해제합니다.
     */
    removeLasers() {
        if (this.#lasers?.length === 0) return;
        for (const { mesh } of this.#lasers) {
            /** @type {import('three').Scene} */ (this._scene).remove(mesh);
            UDEF.disposeObject3D(mesh);
        }
        this.#lasers.length = 0;
    }

    /**
     * 편집 위치와 축을 확인할 보조 레이저(laser)를 생성하여 표시합니다.
     */
    showLaser() {
        this.#initLasers();
        for (const { mesh } of this.#lasers) mesh.visible = true;
    }

    /**
     * 보조 레이저(laser)를 숨기며 객체와 스타일은 유지합니다.
     */
    hideLaser() {
        if (this.#lasers?.length === 0) return;
        for (const { mesh } of this.#lasers) mesh.visible = false;
    }

    /**
     *
     * @ignore
     */
    #updateLaser() {
        if (!this.#useLaser || !this.#isDrag || this.#lasers?.length === 0) return;

        const mode = (/** @type {UGizmoControlsTC | undefined} */ (/** @type {unknown} */ (this._control)))?.getMode();
        if (mode !== 'translate') { this.hideLaser(); return; }

        const controlObj = /** @type {GizmoControlObject} */ (this.#controlObj);
        controlObj.getWorldPosition(TEMP_POSITION);

        for (const { mesh, axis } of this.#lasers) {
            mesh.quaternion.setFromUnitVectors(_UP, axis);
            const radius = mesh.userData['radius'] ?? 1;
            mesh.position.copy(TEMP_POSITION);
            mesh.scale.set(radius, MAX_LASER_LEN, radius);
        }
    }

    /**
     * 편집 분석을 활성화하고 컨트롤의 변경·종료 이벤트를 연결합니다.
     *
     * @override
     */
    active() {
        if (this._isActive) return;
        super.active();

        if (this._clickId != null) {
            this._app?.unkey('click', this._clickId);
        }

        if (!this._control) {
            this.createGizmo();
        }

        const ctrl = /** @type {UGizmoControlsTC | undefined} */ (/** @type {unknown} */ (this._control));
        ctrl?.addEventListener('change', this.update.bind(this));
        ctrl?.addEventListener('objectChange', this.objectChange.bind(this));
        ctrl?.addEventListener('mouseUp', this.onEnd.bind(this));
    }

    /**
     * 편집 분석을 비활성화하고 컨트롤 이벤트와 편집 자원을 해제합니다.
     *
     * @override
     */
    deactive() {
        if (!this._isActive) return;
        super.deactive();
        this._clickId = undefined;

        if (!this._control) return;

        const listeners = (/** @type {UGizmoControlsTC} */ (/** @type {unknown} */ (this._control)))._listeners;
        listeners['change']       = [];
        listeners['objectChange'] = [];
        listeners['mouseUp']      = [];
        this.clear();
    }

    /**
     * 선택한 각 모델의 편집 정보를 앱에 알리고 분석 end 이벤트를 전달합니다.
     */
    onEnd() {
        if (!defined(this._control)) this.createGizmo();

        const ctrl = /** @type {UGizmoControlsTC} */ (/** @type {unknown} */ (this._control));
        const controlMode = ctrl?.getMode() ?? 'translate';

        for (const obj of this.target) {
            const data     = obj.userData?.class;
            /** @type {{translate: (import('three').Vector3|undefined), rotate: import('three').Euler, scale: import('three').Vector3} & Partial<{_oriPosition: import('three').Vector3}>} */
            const editData = {
                translate: ctrl?._offset,
                rotate:    obj.rotation,
                scale:     obj.scale,
            };

            if (defined(obj.userData) && defined(obj.userData['origin']))
                editData._oriPosition = obj.userData['origin'].position;

            let id;
            if (defined(obj.userData?.id)) {
                id = obj.userData.id;
            } else {
                const objExt = /** @type {{_opt: ({id: (unknown|undefined)}|undefined)}} */ (/** @type {unknown} */ (obj));
                id = defined(objExt._opt) && defined(objExt._opt.id) ? objExt._opt.id : obj.id;
            }

            const editedEvent = {
                id,
                position: obj.position,
                editData,
                mode: controlMode,
                axis: ctrl?.axis ?? null
            };
            this._app?.editedMesh(obj, editedEvent);
            this.dispatchEvent({ type: 'end', data });
        }
    }

    /**
     * 편집 대상 장면(scene) 목록에 장면을 추가하거나 목록을 비웁니다.
     *
     * @param {import('three').Object3D} [scene] 추가할 장면이며 생략하면 목록 초기화
     */
    setTargetScene(scene) {
        if (defined(scene))
            this._targetScenes.push(scene);
        else
            this._targetScenes = [];
    }

    /**
     * 편집 대상의 메타데이터를 XML 문서로 반환합니다. <br>
     * 현재 선택 목록을 단일 객체로 읽는 제한이 있어 일반적인 setObject 선택 상태에서는 사용할 수 없습니다.
     *
     * @returns {Document | undefined} XML 문서이며 앱·컨트롤·좌표 변환 문맥이 없으면 undefined
     * @throws {TypeError} 선택 목록에 단일 객체의 변환 속성이 없는 경우
     */
    getMetaXML() {
        const control = this._control;
        const drawArg = this._drawArg;
        const object  = /** @type {import('three').Object3D & Partial<{_xml: Partial<{_title: string}>, _name: string}>} */ (/** @type {unknown} */ (this.target));
        if (!defined(this._app) || !defined(control) || !defined(object) || !defined(drawArg)) return;

        const geo = drawArg.getWorldToGeographic(object.position.x, object.position.y);

        const location = { x: geo.x, y: geo.y, z: object.position.z };
        const rotation = {
            x: UDEF.degrees(object.rotation.x),
            y: UDEF.degrees(object.rotation.y),
            z: UDEF.degrees(object.rotation.z)
        };
        const scale = { x: object.scale.x, y: object.scale.y, z: object.scale.z };

        let title;
        if (defined(object._xml)) {
            if (defined(object._xml._title)) title = object._xml._title;
        } else {
            title = object._name;
        }

        const box = new THREE.Box3().setFromObject(object);
        const min = drawArg.getWorldToGoogle(box.min.x, box.min.y);
        min.z = box.min.z;
        const max = drawArg.getWorldToGoogle(box.max.x, box.max.y);
        max.z = box.max.z;

        const xmlOption = { name: object.name, title, location, rotation, scale, box: { min, max } };
        // 공개 API에서 수집한 메타데이터를 저장용 문자열로 변환합니다.
        const xmlStr = GIZMO_INTERNAL.createGizmoXml(xmlOption);
        const parser  = new DOMParser();
        return parser.parseFromString(xmlStr, 'application/xml');
    }
}

export { UAnalyGizmoModel };
