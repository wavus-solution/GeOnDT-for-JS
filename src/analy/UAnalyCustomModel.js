//@ts-check
import * as THREE from 'three';
import {defined} from '@util/defined';
import {defaultValue} from '@util/defaultValue';
import {UDEF} from '@union3d/core/UDEF';
import {UAnaly} from '@UAnaly';
import {U3dBilboard} from '@union3d/geometry/U3dBilboard';
import {U3dCustomModel, makeShape} from '@union3d/model/U3dCustomModel';
import {U3dCustomModelGroup} from '@union3d/model/U3dCustomModelGroup';
import {Guid} from '@util/Guid';
import {UGroup} from '@union3d/core/UGroup';
import {U3dGeometryUtil} from '@union3d/geometry/U3dGeometryUtil';
import {U3dLine} from '@union3d/geometry/U3dLine';
import {normalizeOptionKeys} from '@util/normalizeOptionKeys';
import {INTERNAL} from '@union3d/analy/UAnalyCustomModel.internal';

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 선택점을 이용한 사용자 건물의 생성·조회·병합·삭제를 제공합니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * let analy = app.activeAnalysis('CustomModel');
 * analy.active();
 */
class UAnalyCustomModel extends UAnaly {
    /**
     * 생성자 옵션의 정본 키입니다. 이전 소문자 입력도 정규화하여 수용합니다.
     *
     * @override
     *
     * @ignore
     */
    static OPT_KEYS = [...UAnaly.OPT_KEYS, 'name', 'lineColor3d'];

    /** @type {string} */ name;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */
    _clickId;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */
    _dblClickId;
    /**
     * @type {Array<CustomModelEntry>}
     *
     * @ignore
     */
    _modelList;
    /**
     * @type {Array<import('three').Vector3>}
     *
     * @ignore
     */
    _pickList;
    /**
     * @override
     *
     * @type {import('@union3d/core/UGroup').UGroup}
     *
     * @ignore
     */
    _poiGroup;
    /**
     * @type {string}
     *
     * @ignore
     */
    _drawType;
    /**
     * @type {string}
     *
     * @ignore
     */
    _lineColor3d;
    /**
     * @type {import('@union3d/geometry/U3dLine').U3dLine | undefined}
     *
     * @ignore
     */
    _line3D;
    /**
     * @type {Array<import('three').Vector3>}
     *
     * @ignore
     */
    _vertexList3D;
    /**
     * @type {boolean | undefined}
     *
     * @ignore
     */
    _endPoint;

    /**
     * @param {object} [opt={}] 생성자 옵션
     * @param {string} [opt.name='CustomModel'] 분석 클래스 이름
     * @param {string} [opt.lineColor3d='#ff0000'] 저장할 선 색상(현재 선 표출에는 적용되지 않음)
     * @param {string} [opt.linecolor3d] 이전 소문자 옵션
     */
    constructor(opt) {
        super();
        const originalOption = opt || {};
        opt = normalizeOptionKeys(originalOption, new.target);
        // 정규화 복사에서도 기존에 수용하던 상속 옵션의 조회 경로를 보존한다.
        if (opt !== originalOption && typeof originalOption === 'object') {
            Object.setPrototypeOf(opt, Object.getPrototypeOf(originalOption));
        }
        // 정규화기는 own 키만 처리하므로 이전 상속 색상 옵션도 별도로 이어 준다.
        if (typeof originalOption === 'object' && !('lineColor3d' in opt) && 'linecolor3d' in originalOption) {
            opt = /** @type {typeof originalOption} */ (Object.assign(Object.create(opt), {lineColor3d: originalOption.linecolor3d}));
        }
        this.name = defaultValue(opt.name, 'CustomModel');
        this._clickId = undefined;
        this._dblClickId = undefined;
        this._modelList = [];
        this._pickList = [];
        this._poiGroup = new UGroup();
        this._drawType = UDEF.CUSTOM_MODEL.DRAW.GROUND;
        this._lineColor3d = defaultValue(opt.lineColor3d, '#ff0000');
        this._line3D = this.#initLine3D();
        this._vertexList3D = [];
        this._endPoint = undefined;
    }

    /**
     * 사용자 건물 선택을 활성화하고 앱 클릭·더블클릭 이벤트를 등록합니다.
     * 이미 활성화된 상태에서 다시 호출하면 기존 앱 이벤트 등록은 그대로 남습니다.
     *
     * @override
     */
    active() {
        UAnaly.prototype.active.call(this);
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        if (this._clickId !== undefined || this._dblClickId !== undefined) {
            this.off();
        }
        app.setMode(UDEF.APP_MODE._CUSTOMMODEL);
        app.setPolygonMeasureType();
        this._clickId = /** @type {string} */ (app.on('click', this.#click.bind(this)));
        this._dblClickId = /** @type {string} */ (app.on('dblclick', this.#dblClick.bind(this)));

        app.getSceneComment()?.add(this._poiGroup);
        if (this.getDrawType() === UDEF.CUSTOM_MODEL.DRAW.OBJECT) {
            if (!defined(this._line3D))
                this._line3D = this.#initLine3D();
            if (this._line3D) app.getSceneComment()?.add(/** @type {import('three').Object3D} */(/** @type {unknown} */(this._line3D)));
        }
    }

    /**
     * 현재 저장된 앱 이벤트를 해제하고 선택점 표출과 보조 선을 정리합니다.
     * 생성 모델 목록과 선택점 목록은 직접 비우지 않습니다.
     *
     * @override
     */
    deactive() {
        if (!this._isActive) return;
        UAnaly.prototype.deactive.call(this);
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        app.unkey('click', this._clickId);
        app.unkey('dblclick', this._dblClickId);
        this._clickId = undefined;
        this._dblClickId = undefined;
        app.getMeasureLayer()?.clearDrawFeature();
        UAnaly.prototype.clear.call(this);

        this.#clearLine3D();
        if (this._line3D) app.getSceneComment()?.remove(/** @type {import('three').Object3D} */(/** @type {unknown} */(this._line3D)));
    }

    /**
     * 현재 선택 모드를 반환합니다.
     *
     * @returns {string} 건물 생성 타입 `object` | `ground`
     */
    getDrawType() {
        return this._drawType;
    }

    /**
     * 선택 모드를 저장합니다. 입력값을 검증하거나 즉시 앱 모드를 전환하지 않습니다.
     *
     * @param {string} type 건물 생성 타입
     */
    setDrawType(type) {
        this._drawType = type;
    }

    /**
     * 하이라이트·선택점·보조 선을 정리하고 생성 모델을 모두 해제합니다.
     * 활성 상태와 앱 이벤트 등록은 유지합니다.
     *
     * @override
     */
    clear() {
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        this.removeAllHighlight();
        this._pickList = [];
        this._endPoint = false;
        this._poiGroup.clear();
        app.getSceneComment()?.remove(this._poiGroup);
        app.getMeasureLayer()?.clearDrawFeature();
        this.#clearLine3D();
        this.removeAll();
    }

    /**
     * 각 모델의 저장 파라미터를 목록 순서대로 새 배열에 담아 반환합니다.
     * 개별 파라미터 객체의 복사 여부는 해당 모델의 구현에 따릅니다.
     *
     * @returns {Array<object>} 사용자 건물 생성 파라미터 객체 배열
     *
     * @example
     * // Parameter: { center, extrudeheight, labeltext, landHeight, modeltype, name, position, rotation, scale, style, textureUrl, version, vertex }
     */
    getParam() {
        /** @type {Array<object>} */ const param = [];
        this._modelList.forEach((customModel) => {
            const parameter = customModel.getParameter();
            param.push(parameter);
        });
        return param;
    }

    /**
     * 메시를 병합하여 addCustomModel()에 다시 전달할 생성 옵션을 반환합니다.
     * 버퍼와 위치는 결과 메시의 원본 참조이며, 결과의 geometry·단일 material은 해제합니다.
     * 병합할 다른 메시가 없어 기준 메시가 반환되는 경우에도 같은 해제를 수행합니다.
     *
     * @param {string} name 건물 이름
     * @param {import('three').Mesh} meshBase 기준 건물 mesh
     * @param {import('three').Mesh | Array<import('three').Mesh>} meshes 병합할 건물 mesh 목록
     * @param {boolean} [useDelete=true] 기존 모델 삭제 여부(null·undefined이면 true)
     * @returns {object | undefined} 재입력 옵션. 이름 중복이면 undefined
     *
     * @throws {Error} 병합 결과가 없는 경우
     */
    merge(name, meshBase, meshes, useDelete) {
        UDEF.assert(defined(meshBase) && defined(meshes));
        if (!defined(useDelete)) useDelete = true;

        if (defined(name) && this.isExistModelName(name)) {
            console.error('name "' + name + '" is already exist');
            return;
        }

        const mergedMesh = this.mergeMesh(meshBase, meshes, useDelete);
        if (defined(mergedMesh)) {
            // 병합 결과의 원본 버퍼·위치를 재입력 가능한 모델 옵션으로 묶는다.
            const option = INTERNAL.createMergedOption(name, mergedMesh);
            mergedMesh.geometry.dispose();
            (/** @type {import('three').Material} */ (mergedMesh.material)).dispose();
            return option;
        } else {
            throw new Error('merge fail!!');
        }
    }

    /**
     * 입력 순서대로 메시를 병합하고 필요하면 기존 모델을 삭제합니다.
     * 병합 결과가 없으면 기준 메시를 반환하며 삭제하지 않습니다.
     * 두 번째 병합부터 이전 중간 결과의 dispose()를 호출하므로 그 메서드가 필요합니다.
     *
     * @param {import('three').Mesh} meshBase 기준 mesh
     * @param {import('three').Mesh | Array<import('three').Mesh>} meshes 병합할 mesh 리스트
     * @param {boolean} [useDelete=true] 기존 모델 삭제 여부(null·undefined이면 true)
     * @returns {import('three').Mesh} 병합된 건물 mesh
     */
    mergeMesh(meshBase, meshes, useDelete) {
        UDEF.assert(defined(meshBase) && defined(meshes));
        if (!defined(useDelete)) useDelete = true;

        /** @type {import('three').Mesh | undefined} */ let mergedMesh = undefined;
        if (meshes instanceof Array) {
            for (let i = 0; i < meshes.length; i++) {
                if (meshBase === meshes[i]) continue;
                if (!defined(mergedMesh)) {
                    mergedMesh = U3dGeometryUtil.prototype.mergeByMesh(meshBase, meshes[i]);
                } else {
                    const nextMesh = U3dGeometryUtil.prototype.mergeByMesh(mergedMesh, meshes[i]);
                    (/** @type {any} */ (mergedMesh)).dispose();
                    mergedMesh = undefined;
                    mergedMesh = nextMesh;
                }
            }
        } else if (meshes instanceof Object) {
            if (meshBase !== meshes) {
                mergedMesh = U3dGeometryUtil.prototype.mergeByMesh(meshBase, /** @type {import('three').Mesh} */ (meshes));
            }
        } else {
            UDEF.assert(false);
        }

        if (!mergedMesh) return meshBase;

        if (useDelete) {
                if (meshes instanceof Array) {
                for (let i = 0; i < meshes.length; i++) {
                    if (meshes[i] === meshBase) continue;
                    this.removeModelByMesh(meshes[i]);
                }
            } else {
                if (meshes !== meshBase) this.removeModelByMesh(/** @type {import('three').Mesh} */ (meshes));
            }
            this.removeModelByMesh(meshBase);
        }

        return mergedMesh;
    }

    /**
     * 단일 옵션 또는 옵션 배열에서 사용자 모델을 생성합니다.
     * name은 필수이며 배열의 이름 누락은 건너뛰고 중복 이름은 이후 처리를 중단합니다.
     * 종류가 불완전하면 원본 modeltype을 EXTRUDE로 보완합니다. GEOMETRY는 원본 mesh·drawarg도 설정합니다.
     * 돌출 입력은 vertex 또는 points와 extrudeheight를 사용하며, falsy labeltext는 빈 문자열로 전달합니다.
     * rotation·scale·style은 모델 생성 뒤 순서대로 적용하고 성공한 모델만 등록합니다.
     * GROUP은 중첩 배열을 펼치고 하위 그룹은 직접 항목만 펼칩니다. 자식 생성 종류는 상위 옵션을 따릅니다.
     * 생성 중 예외는 전달하며 앞서 성공한 모델을 롤백하지 않습니다.
     *
     * @param {object | Array<object>} option 사용자 건물 생성 옵션 (단일 옵션 객체 또는 배열)
     * @returns {Array<CustomModelEntry>} 생성된 사용자 건물 배열
     *
     * @example
     * analy.addCustomModel({ extrudeheight: 55, name: "building1", vertex: [{x,y,z},...] });
     */
    addCustomModel(option) {
        const list = [];
        if (!defined(option)) return [];

        let doNext = true;
        if (option instanceof Array) {
            for (let i = 0; i < option.length; i++) {
                const opt = /** @type {any} */ (option[i]);
                if (defined(opt.name)) {
                    if (this.isExistModelName(opt.name)) {
                        console.error('option[' + i + '].name "' + opt.name + '" is already exist');
                        doNext = false;
                        break;
                    }
                } else {
                    console.error('option[' + i + '].name is undefined');
                    doNext = false;
                }
                if (doNext) {
                    const model = this.#parseCustomModel(opt);
                    UDEF.assert(defined(model));
                    if (model) list.push(model);
                } else {
                    doNext = true;
                }
            }
        } else if (option instanceof Object) {
            const opt = /** @type {any} */ (option);
            if (!defined(opt.name)) {
                console.error('option.name is undefined');
                return [];
            }
            if (this.isExistModelName(opt.name)) {
                console.error('option.name "' + opt.name + '" is already exist');
                return [];
            }
            const model = this.#parseCustomModel(opt);
            UDEF.assert(defined(model));
            if (model) list.push(model);
        }

        return list;
    }

    /**
     * 최상위 모델 목록에 같은 이름이 있는지 엄격 비교로 확인합니다.
     *
     * @param {string} name 건물 이름
     * @returns {boolean} 이름 중복 여부
     */
    isExistModelName(name) {
        for (const model of this._modelList) {
            if ((/** @type {any} */ (model)).getName() === name) return true;
        }
        return false;
    }

    /**
     * 기존 호환용 메서드이며 현재는 아무 작업도 하지 않습니다.
     *
     */
    isPolygon() {}

    /**
     * 기존 point·buldheight·landheight 입력으로 모델을 생성합니다.
     * 기존 호출 순서대로 등록 직후 clear()를 수행하므로 새 모델을 포함한 모든 모델이 해제됩니다.
     *
     * @param {object} option 사용자 건물 생성 옵션 값
     * @param {string} [option.name] 건물 이름. 미입력 시 자동 생성.
     * @param {number} option.buldheight 건물 높이
     * @param {number} option.landheight 지형 높이
     * @param {Array<{x: number, y: number, z: (number|undefined)}>} option.point 건물 Point 좌표
     * @param {string} [option.labeltext] 건물 라벨 Text
     */
    addModel(option) {
        const drawArg = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */ (this._drawArg);
        const app = drawArg._app;

        option.point.forEach((value) => {
            this._pickList.push(app.geographicToVector3(value));
        });

        const shape = makeShape(this._pickList);
        const extrudeSettings = {
            steps: 1,
            depth: Number(option.buldheight),
            bevelEnabled: true,
            bevelThickness: 0,
            bevelSize: 0,
            bevelOffset: 0,
            bevelSegments: 1
        };
        const opt = {
            name: option.name ? option.name : String(Guid()),
            extrudeSettings,
            shape,
            drawarg: drawArg,
            height: option.landheight,
            pointList: this._pickList,
            labeltext: option.labeltext ? option.labeltext : option.name
        };

        const custom = new U3dCustomModel(opt);
        this._modelList.push(custom);
        this._scene.add(custom._object);

        this.clear();
        this.update();
    }

    /**
     * 생성된 모델 목록의 원본 배열을 반환합니다. 배열 변경은 후속 조회·삭제에 반영됩니다.
     *
     * @returns {Array<CustomModelEntry>} 생성된 사용자 건물 목록
     */
    getCustomModels() {
        return this._modelList;
    }

    /**
     * 이름이 일치하는 첫 모델을 반환합니다.
     * 그룹은 자신의 이름이 아니라 직접 자식의 이름을 검색하고 그룹 자체를 반환합니다.
     *
     * @param {string} name 사용자 건물의 이름
     * @returns {CustomModelEntry | undefined} 첫 일치 모델. 없으면 undefined
     */
    getModelByName(name) {
        const list = this._modelList;
        return list.find((model) => {
            if (model instanceof U3dCustomModelGroup) {
                let find = false;
                for (let i = 0; i < model._customModels.length; i++) {
                    if (model._customModels[i]._name === name) {
                        find = true;
                        break;
                    }
                }
                return find ? model : undefined;
            } else {
                return model._name === name;
            }
        });
    }

    /**
     * 입력 UID와 모델 UID를 각각 문자열로 변환하여 첫 일치 모델을 반환합니다.
     *
     * @param {string} uid 사용자 건물 uid
     * @returns {CustomModelEntry | undefined}
     */
    getModelByUid(uid) {
        const uidStr = String(uid);
        return this._modelList.find((value) => {
            return String((/** @type {any} */ (value)).getUid()) === uidStr;
        });
    }

    /**
     * 모든 모델을 순서대로 해제한 뒤 목록을 새 빈 배열로 교체합니다.
     * 해제 중 예외가 발생하면 이후 해제와 목록 교체는 실행하지 않습니다.
     */
    removeAll() {
        for (const model of this._modelList) {
            (/** @type {any} */ (model)).dispose();
        }
        this._modelList = [];
    }

    /**
     * 장면의 Mesh 하위 객체에 저장된 라벨을 주석 장면에 등록하거나 분리합니다.
     * 라벨을 하나라도 찾으면 앱의 데이터 갱신을 한 번 요청합니다.
     *
     * @param {boolean} visible 가시화/비가시화 여부
     */
    showLabel(visible) {
        const drawArg = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */ (this._drawArg);
        UDEF.assert(defined(drawArg) && defined(drawArg._app));

        let find = 0;
        if (defined(this._scene)) {
            const scene = this._scene;
            for (let i = 0; i < scene.children.length; i++) {
                const child = scene.children[i];
                if (defined(child)) {
                    child.traverse((/** @type {import('three').Object3D} */ mesh) => {
                        if (mesh instanceof THREE.Mesh) {
                            if (defined(mesh.userData.label)) {
                                find++;
                                if (visible)
                                    drawArg._app.getSceneComment()?.add(mesh.userData.label);
                                else
                                    drawArg._app.getSceneComment()?.remove(mesh.userData.label);
                            }
                        }
                    });
                }
            }
            if (find > 0) {
                drawArg._app.updateData();
            }
        }
    }

    /**
     * UID가 엄격히 일치하는 첫 모델을 해제한 뒤 목록에서 삭제합니다.
     * getModelByUid()와 달리 UID를 문자열로 변환하지 않습니다.
     *
     * @param {string} uid 제거할 건물의 uid
     * @returns {boolean} 삭제 성공 여부
     */
    removeModelByUid(uid) {
        const list = this._modelList;
        const result = list.find((value) => {
            return (/** @type {any} */ (value)).getUid() === uid;
        });

        if (!defined(result)) return false;

        const index = list.indexOf(result);
        if (index > -1) {
            (/** @type {any} */ (list[index])).dispose();
            list.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * 같은 UID의 등록 모델을 삭제하고, 없으면 입력 모델을 직접 해제합니다.
     *
     * @param {CustomModelEntry} model 제거할 사용자 건물
     */
    removeModel(model) {
        if (this.removeModelByUid((/** @type {any} */ (model)).getUid()) === false) {
            (/** @type {any} */ (model)).dispose();
        }
    }

    /**
     * 직접 자식에 입력 메시가 포함된 첫 모델을 삭제합니다. 중첩 자손은 검색하지 않습니다.
     *
     * @param {import('three').Mesh} mesh 건물의 Mesh
     */
    removeModelByMesh(mesh) {
        for (const model of this._modelList) {
            if (!model._object) continue;
            for (const child of model._object.children) {
                if (mesh === child) {
                    this.removeModel(model);
                    return;
                }
            }
        }
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    /**
     * @returns {import('@union3d/geometry/U3dLine').U3dLine}
     *
     * @ignore
     */
    #initLine3D() {
        this._vertexList3D = [];
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        if (this._line3D) {
            if (app) app.getSceneComment()?.remove(/** @type {import('three').Object3D} */(/** @type {unknown} */(this._line3D)));
            this._line3D.geometry.dispose();
            (/** @type {THREE.Material} */ (this._line3D.material)).dispose();
        }
        this._line3D = new U3dLine();
        return this._line3D;
    }

    /**
     * @param {Array<import('three').Vector3>} array
     *
     * @ignore
     */
    #updateLine3D(array) {
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        if (this._line3D) {
            app.getSceneComment()?.remove(/** @type {import('three').Object3D} */(/** @type {unknown} */(this._line3D)));
            this._line3D.geometry.dispose();
            (/** @type {THREE.Material} */ (this._line3D.material)).dispose();
        }
        const line3d = new U3dLine();
        if (defined(array)) {
            for (let i = 0; i < array.length; i++)
                line3d._vertices.push(array[i]);
        }
        line3d._vertices.push(array[0]);
        line3d.updateVertex();

        this._line3D = line3d;
        app.getSceneComment()?.add(/** @type {import('three').Object3D} */(/** @type {unknown} */(this._line3D)));
    }

    /**
     * @param {import('three').Vector3} pos
     *
     * @ignore
     */
    #addPositionLine3D(pos) {
        if (!defined(this._line3D))
            throw new Error('line3d is error!');
        this._vertexList3D.push(pos);
        this.#updateLine3D(this._vertexList3D);
    }

    /**
     * @ignore
     */
    #clearLine3D() {
        if (!defined(this._line3D))
            throw new Error('line3d is error!');
        this.#initLine3D();
    }

    /**
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    #click(e) {
        const type = this.getDrawType();
        const drawArg = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */ (this._drawArg);
        const app = drawArg._app;
        const selectVectorLayer = this.#getSelectLayer();

        if (this._endPoint) {
            this.clear();
            this._endPoint = false;
        }

        /** @type {import('three').Vector3 | undefined} */ let point3d = undefined;
        /** @type {Array<import('three').Intersection>} */ let intersects = [];
        if (type === UDEF.CUSTOM_MODEL.DRAW.GROUND)
            intersects = app.intersectAtPixel(e, true);
        else if (type === UDEF.CUSTOM_MODEL.DRAW.OBJECT)
            intersects = app.intersectAtPixel(e, false, true);
        else
            throw new Error('type is error');

        if (intersects.length > 0) {
            const intersect = intersects[0];
            if (isNaN(intersect.point.z) || intersect.point.z < 0)
                intersect.point.z = 0;
            point3d = intersect.point;
        }
        if (!defined(point3d)) {
            if (UDEF.debug) console.info('picking is null');
            return;
        }
        const poi = U3dBilboard.makeBilboard({position: point3d, text: 'click'});
        this._poiGroup.add(poi);
        app.getSceneComment()?.add(this._poiGroup);

        const geo = drawArg.getWorldToGeographic(point3d.x, point3d.y);
        this._pickList.push(/** @type {import('three').Vector3} */ (point3d));

        if (type === UDEF.CUSTOM_MODEL.DRAW.GROUND)
            selectVectorLayer?.addMeasurePoint(geo);
        else if (type === UDEF.CUSTOM_MODEL.DRAW.OBJECT)
            this.#addPositionLine3D(/** @type {import('three').Vector3} */ (point3d));
    }

    /**
     * @ignore
     */
    #dblClick() {
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        this._poiGroup.clear();
        app.getMeasureLayer()?.clearDrawFeature();
        this.#clearLine3D();
    }

    /**
     * @param {any} option
     * @returns {object | undefined}
     *
     * @ignore
     */
    #createDefaultOptionType(option) {
        if (Array.isArray(option)) return;
        if (this.#getOptionType(option, true) === false) {
            option.modeltype = UDEF.CUSTOM_MODEL.TYPE.EXTRUDE;
        }
        return option;
    }

    /**
     * @param {any} option
     * @param {boolean} [check=false]
     * @returns {string | false}
     *
     * @ignore
     */
    #getOptionType(option, check) {
        if (isGroupingParam(option)) return UDEF.CUSTOM_MODEL.TYPE.GROUP;
        else if (isGeometryParam(option)) return UDEF.CUSTOM_MODEL.TYPE.GEOMETRY;
        else if (isExtrudeParam(option)) return UDEF.CUSTOM_MODEL.TYPE.EXTRUDE;

        if (!defined(check)) check = false;
        if (!check) throw new Error('not supported!!');
        return false;
    }

    /**
     * @param {any} option
     * @returns {CustomModelEntry | undefined}
     *
     * @ignore
     */
    #parseCustomModel(option) {
        if (Array.isArray(option)) return;

        option = this.#createDefaultOptionType(option);
        const modeltype = this.#getOptionType(option);
        let model;

        if (modeltype === UDEF.CUSTOM_MODEL.TYPE.GROUP)
            model = this.#addCustomModelGrouping_(option);
        else {
            let type = UDEF.CUSTOM_MODEL.TYPE.EXTRUDE;
            if (defined(option.modeltype)) type = option.modeltype;

            if (type === UDEF.CUSTOM_MODEL.TYPE.GEOMETRY)
                model = this.#addCustomModelMeshByObject_(option);
            else
                model = this.#addCustomModel_(option);
        }
        return model;
    }

    /**
     * @param {any} options
     * @returns {import('@union3d/model/U3dCustomModelGroup').U3dCustomModelGroup}
     *
     * @ignore
     */
    #addCustomModelGrouping_(options) {
        const drawArg = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */ (this._drawArg);
        const group = new U3dCustomModelGroup({
            name: options.name,
            drawarg: drawArg,
            modeltype: UDEF.CUSTOM_MODEL.TYPE.GROUP
        });

        // 그룹 생성에 사용할 옵션을 원본 참조·순서를 유지한 새 목록으로 펼친다.
        const revisionModels = INTERNAL.expandModels(options.models, isGroupingParam);
        /** @type {Array<import('@union3d/model/U3dCustomModel').U3dCustomModel | import('@union3d/model/U3dCustomModelMesh').U3dCustomModelMesh>} */
        const list = [];
        for (let i = 0; i < revisionModels.length; i++) {
            let type = UDEF.CUSTOM_MODEL.TYPE.EXTRUDE;
            if (defined(options.modeltype)) type = options.modeltype;

            let custom;
            if (type === UDEF.CUSTOM_MODEL.TYPE.GEOMETRY)
                custom = this.#addCustomModelMeshByObject_(revisionModels[i], false);
            else
                custom = this.#addCustomModel_(revisionModels[i], false);

            list.push(custom);
            group._object.add(custom._object);
        }

        for (let y = 0; y < list.length; y++) {
            const dst = list[y];
            for (let x = 0; x < list.length; x++) {
                const src = list[x];
                if (dst !== src) (/** @type {any} */ (dst)).addChangeEvent(src);
            }
        }

        group.addCustomModel(list);
        this._modelList.push(group);
        this._scene.add(group._object);
        return group;
    }

    /**
     * @param {any} option
     * @param {boolean} [add=true]
     * @returns {import('@union3d/model/U3dCustomModelMesh').U3dCustomModelMesh}
     *
     * @ignore
     */
    #addCustomModelMeshByObject_(option, add) {
        if (!defined(add)) add = true;
        const drawArg = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */ (this._drawArg);

        // 원본 입력에 mesh·drawarg를 저장하고 회전·축척·스타일을 적용한 모델을 만든다.
        // 생성 중 오류는 그대로 전달하며 등록·갱신은 성공 뒤 아래 공개 제어부에서 수행한다.
        const custom = INTERNAL.createMeshModel(option, drawArg);

        if (add) {
            this._modelList.push(custom);
            this._scene.add(custom._object);
            this.update();
        }
        return custom;
    }

    /**
     * @param {any} option
     * @param {boolean} [add=true]
     * @returns {import('@union3d/model/U3dCustomModel').U3dCustomModel}
     *
     * @ignore
     */
    #addCustomModel_(option, add) {
        if (!defined(add)) add = true;
        const drawArg = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */ (this._drawArg);

        let vertex, points;
        if (defined(option.vertex)) {
            vertex = option.vertex;
            points = this.#vector3ToGeoGraphic(option.vertex);
        } else {
            vertex = this.#geographicToVector3(option.points);
            points = option.points;
        }
        const shape = makeShape(vertex);
        const buildingArea = this.#getSelectLayer()?.getMeasureArea();
        // 변환 결과와 면적을 모델 생성 입력으로 조립하고 회전·축척·스타일을 적용한다.
        // drawArg는 변환 전 참조, 면적은 shape 생성 뒤 현재 레이어의 값으로 유지한다.
        const custom = INTERNAL.createExtrudeModel(option, shape, drawArg, points, buildingArea);

        if (add) {
            this._modelList.push(custom);
            this._scene.add(custom._object);
            this.update();
        }
        return custom;
    }

    /**
     * @param {Array<import('three').Vector3>} ary
     * @returns {Array<GeoPosition| undefined>}
     *
     * @ignore
     */
    #vector3ToGeoGraphic(ary) {
        const points = [];
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        for (let i = 0; i < ary.length; i++) {
            points.push(app.vector3ToGeoGraphic(ary[i]));
        }
        return points;
    }

    /**
     * @param {Array<{x: number, y: number, z: (number|undefined)}>} ary
     * @returns {Array<import('three').Vector3>}
     *
     * @ignore
     */
    #geographicToVector3(ary) {
        const points = [];
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        for (let i = 0; i < ary.length; i++) {
            points.push(app.geographicToVector3(ary[i]));
        }
        return points;
    }

    /**
     * @ignore
     */
    #getSelectLayer() {
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        return app.getMeasureLayer();
    }
}

// ─── Module-level pure helpers ────────────────────────────────────────────────

/**
 * @param {any} option
 * @returns {boolean}
 *
 * @ignore
 */
function isExtrudeParam(option) {
    return defined(option.modeltype)
        && option.modeltype === UDEF.CUSTOM_MODEL.TYPE.EXTRUDE;
}

/**
 * @param {any} option
 * @returns {boolean}
 *
 * @ignore
 */
function isGroupingParam(option) {
    return defined(option.modeltype)
        && option.modeltype === UDEF.CUSTOM_MODEL.TYPE.GROUP
        && defined(option.models)
        && Array.isArray(option.models);
}

/**
 * @param {any} option
 * @returns {boolean}
 *
 * @ignore
 */
function isGeometryParam(option) {
    return defined(option.modeltype)
        && option.modeltype === UDEF.CUSTOM_MODEL.TYPE.GEOMETRY
        && defined(option.vertex)
        && defined(option.uv)
        && defined(option.position)
        && defined(option.extrudeheight);
}

export {UAnalyCustomModel};
