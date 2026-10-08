//@ts-check
import * as THREE from 'three';
import {defined} from '@util/defined';
import {defaultValue} from '@util/defaultValue';
import {normalizeOptionKeys} from '@util/normalizeOptionKeys';
import {UScene} from '@union3d/core/UScene';
import {URaycaster} from '@union3d/core/URaycaster';
import {UEventDispatcher} from '@union3d/core/UEventDispatcher';
import {UDEF} from '@union3d/core/UDEF';
import {UGroup} from '@union3d/core/UGroup';
import {INTERNAL} from '@union3d/analy/UAnaly.internal';

/**
 * ~extends import('@UEventDispatcher').UEventDispatcher <br>
 *
 * 3차원 분석의 활성 상태·앱 연결·교차 조회와 하이라이트를 제공하는 기반 클래스입니다. <br>
 * 하위 분석 클래스는 이벤트 처리와 측정 기능을 확장합니다.
 *
 * @group analysis
 * @extends {UEventDispatcher}
 *
 * @example
 * const analysis = app.getAnalysis('분석이름');
 * analysis.active();
 */
class UAnaly extends UEventDispatcher {
    /**
     * 생성 옵션에서 사용하는 정본 키 목록입니다.
     *
     * @override
     *
     * @ignore
     */
    static OPT_KEYS = ['type'];

    /**
     * 생성 옵션으로 설정한 분석 타입입니다.
     *
     * @type {string}
     *
     * @ignore
     */
    _type;
    /**
     * 클래스 식별 문자열입니다.
     *
     * @type {string}
     *
     * @ignore
     */
    _classtype;
    /**
     * 분석 결과 객체를 담는 장면(scene)입니다.
     *
     * @type {import('@UScene').UScene}
     *
     * @ignore
     */
    _scene;
    /**
     * 분석 객체에 연결한 지도 앱입니다.
     *
     * @type {import('@U3dApp').U3dApp | undefined}
     *
     * @ignore
     */
    _app;
    /**
     * 연결한 앱의 카메라·장면 조회에 사용하는 렌더링 실행 인자입니다.
     *
     * @type {import('@UDrawArg').UDrawArg | undefined}
     *
     * @ignore
     */
    _drawArg;
    /**
     * 연결한 앱의 주석 장면(scene) 참조입니다.
     *
     * @type {import('@UScene').UScene | undefined}
     *
     * @ignore
     */
    _sceneComment;
    /**
     * 하이라이트를 적용한 메시(mesh)의 목록이며 중복 항목을 허용합니다.
     *
     * @type {Array<Ananlysis_Mesh>}
     *
     * @ignore
     */
    _selectedList;
    /**
     * 분석 기능의 활성 상태이며 생성 직후에는 false입니다.
     *
     * @type {boolean}
     */
    _isActive;

    /**
     * UAnaly 클래스 생성자입니다. <br>
     * 분석 결과용 장면과 표출 그룹을 만들며 앱은 setApp()으로 별도 연결합니다.
     *
     * @param {UAnalyCO} [opt={}] 분석 타입을 지정하는 생성 옵션
     */
    constructor(opt) {
        super();
        opt = normalizeOptionKeys(opt || {}, new.target);
        this._type = defaultValue(opt.type, 'analy');
        this._classtype = 'UAnaly';
        this._scene = new UScene();
        this._sceneComment = undefined;
        this._selectedList = [];
        this._isActive = false;
        this._poiGroup = new UGroup();
        this._targetLayerName = undefined;
    }

    /**
     * 분석 기능을 활성 상태로 설정합니다.
     */
    active() {
        this._isActive = true;
    }

    /**
     * 분석 기능의 현재 활성 상태를 반환합니다.
     *
     * @returns {boolean} 활성 상태이면 true
     */
    isActive() {
        return this._isActive;
    }

    /**
     * 분석 기능을 비활성 상태로 설정하고 이 객체에 등록한 이벤트를 모두 해제합니다.
     */
    deactive() {
        this._isActive = false;
        this.removeEventListenerAll();
    }

    /**
     * 분석 결과 표출 그룹의 자식을 정리하고 앱의 주석 장면에서 그룹을 분리합니다. <br>
     * 앱이 연결되지 않았으면 아무 작업도 하지 않으며 하이라이트 선택 목록은 비우지 않습니다.
     */
    clear() {
        if (!this._app) return;
        if (defined(this._poiGroup) && this._poiGroup.children.length > 0) {
            // 해제 중 자식 배열이 변경되는 경우의 기존 순회 방식도 그대로 유지한다.
            const children = this._poiGroup.children;
            for (let i = 0; i < children.length; i++) {
                UDEF.disposeObject3D(children[i]);
            }
            this._app._sceneComment.remove(this._poiGroup);
            this._poiGroup.clear();
        }
    }

    /**
     * 분석 객체의 이벤트 함수(listener)를 등록하고 식별 이름을 반환합니다. <br>
     * 이벤트 함수는 이 분석 객체를 this로 받아 호출되며 같은 이벤트의 동일 함수는 중복 등록되지 않습니다.
     *
     * @override
     *
     * @param {string} type 등록할 이벤트 종류
     * @param {EventCallBack} listener 이벤트 발생 시 호출할 함수
     * @param {boolean} [once=false] 첫 이벤트에서 한 번만 호출할지 여부
     * @param {string} [name] 등록 이름이며 생략하면 부모의 이름 생성 규칙 사용
     * @returns {string | null} 등록 이름 또는 등록하지 않은 경우 null
     */
    on(type, listener, once, name) {
        return super.on(type, listener, once, name);
    }

    /**
     * 분석 객체의 이벤트 함수(listener)를 해제합니다. <br>
     * type을 생략하면 모든 이벤트를 해제하고 listener만 생략하면 해당 종류의 이벤트를 모두 해제합니다.
     *
     * @override
     *
     * @param {string} [type] 해제할 이벤트 종류
     * @param {function | string} [listener] 해제할 함수 또는 등록 식별 이름
     */
    off(type, listener) {
        super.off(type, listener);
    }

    /**
     * 연결한 앱에 분석 결과의 화면 갱신을 요청합니다.
     */
    update() {
        if (!defined(this._app)) return;
        this._app.changeUpdate();
    }

    /**
     * 하위 클래스가 분석 설정 조회를 구현하는 확장 지점입니다. <br>
     * 기반 구현은 아무 작업도 하지 않고 undefined로 종료합니다.
     */
    getAnalysisOption() {}

    /**
     * 하위 클래스가 분석 설정 적용을 구현하는 확장 지점입니다. <br>
     * 기반 구현은 아무 작업도 하지 않습니다.
     */
    setAnalysisOption() {}

    /**
     * 분석 객체의 장면(scene)을 반환합니다.
     *
     * @returns {import('@UScene').UScene} 분석 결과를 담는 원본 장면 참조
     */
    getScene() {
        return this._scene;
    }

    /**
     * 분석 객체에 지도 앱을 연결하고 카메라 조회 인자와 주석 장면 참조를 저장합니다.
     *
     * @param {import('@U3dApp').U3dApp} app 분석 객체를 사용할 지도 앱
     */
    setApp(app) {
        this._app = app;
        this._drawArg = app._drawArg;
        this._sceneComment = app._sceneComment;
    }

    /**
     * 클릭 위치 측정에 사용할 대상 레이어(layer) 이름을 설정합니다. <br>
     * undefined이면 지형을, 빈 문자열이면 앱이 제공하는 모델·지형 장면을, 그 밖에는 지정 레이어를 사용합니다.
     *
     * @param {string | undefined} layerName 교차 조회 대상 레이어 이름
     */
    setTargetLayerName(layerName) {
        this._targetLayerName = layerName;
    }

    /**
     * 클릭 위치 측정 대상으로 설정한 레이어(layer) 이름을 반환합니다.
     *
     * @returns {string | undefined} 대상 이름이며 undefined는 지형, 빈 문자열은 모델·지형 장면
     */
    getTargetLayerName() {
        return this._targetLayerName;
    }

    /**
     * 클릭한 화면 위치와 교차(intersect)하는 모델 목록을 가까운 순서로 반환합니다. <br>
     * 카메라 또는 정규화 화면 좌표가 없으면 빈 배열을 반환합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 정규화 화면 좌표를 가진 사용자 이벤트
     * @returns {Array<import('three').Intersection>} 모델 교차 결과 목록
     */
    intersectModel(e) {
        const cam = this._drawArg?.getCamera();
        if (!cam) return [];
        const {normalizedX, normalizedY} = e;
        if (!defined(normalizedX) || !defined(normalizedY)) return [];
        const caster = new URaycaster();
        const vec2 = new THREE.Vector2(normalizedX, normalizedY);
        caster.setFromCamera(vec2, cam);
        return this.getIntersectsFromModel(caster);
    }

    /**
     * 클릭 위치의 측정 대상과 교차(intersect)하는 가장 가까운 점을 반환합니다. <br>
     * 대상은 setTargetLayerName() 설정을 따르며 교차점 높이가 NaN이거나 음수이면 원본 점의 z를 0으로 변경합니다. <br>
     * 기존 좌표 호환 입력의 값 타입은 유지하며 별도의 숫자 변환이나 유한값 검사는 하지 않습니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent | {normalizedX: any, normalizedY: any}} e 사용자 이벤트 또는 기존 호환 화면 좌표 입력
     * @returns {import('three').Vector3 | undefined} 교차점 원본 참조이며 카메라·좌표·교차가 없으면 undefined
     */
    intersectTerrain(e) {
        const cam = this._drawArg?.getCamera();
        if (!defined(cam)) return undefined;
        const {normalizedX, normalizedY} = e;
        if (!defined(normalizedX) || !defined(normalizedY)) return undefined;
        const caster = new URaycaster();
        const vec2 = new THREE.Vector2(normalizedX, normalizedY);
        caster.setFromCamera(vec2, cam);
        const intersects = this.getIntersectsForMeasure(caster);
        let point3d = undefined;
        if (intersects.length > 0) {
            const intersect = intersects[0];
            if (isNaN(intersect.point.z) || intersect.point.z < 0) {
                intersect.point.z = 0;
            }
            point3d = intersect.point;
        }
        return point3d;
    }

    /**
     * 측정 대상 설정에 맞는 교차(intersect) 목록을 조회합니다.
     *
     * @param {import('@URaycaster').URaycaster} raycaster 교차 조회에 사용할 광선
     * @returns {Array<import('three').Intersection>} 대상 장면의 교차 결과
     *
     * @ignore
     */
    getIntersectsForMeasure(raycaster) {
        if (!defined(this._targetLayerName)) {
            return this.getIntersectsFromTerrain(raycaster);
        }
        const layerName = String(this._targetLayerName);
        if (!layerName) {
            const scenes = this._app?.getInstanceScenesFromModelAndTerrainLayers?.();
            return this.getIntersectsFromScenes(raycaster, scenes || []);
        }
        return this.getIntersectsFromLayerName(raycaster, layerName);
    }

    /**
     * 광선과 교차(intersect)하는 지형 결과를 가까운 순서로 반환합니다.
     *
     * @param {import('@URaycaster').URaycaster} raycaster 교차 조회에 사용할 광선
     * @param {boolean} [recursive=true] 하위 객체까지 조회할지 여부이며 null도 기본값 처리
     * @returns {Array<import('three').Intersection>} 지형 교차 목록이며 렌더링 실행 인자가 없으면 빈 배열
     *
     * @ignore
     */
    getIntersectsFromTerrain(raycaster, recursive) {
        if (!defined(this._drawArg)) return [];
        if (!defined(recursive)) recursive = true;
        const scene = this._drawArg.getTerrainScene();
        const intersects = raycaster.intersectObject(scene, recursive);
        intersects.sort((a, b) => a.distance - b.distance);
        return intersects;
    }

    /**
     * 모델 장면(scene)의 교차 결과를 조회합니다.
     *
     * @param {import('@URaycaster').URaycaster} raycaster 교차 조회에 사용할 광선
     * @param {boolean} [recursive=true] 하위 객체까지 조회할지 여부
     * @returns {Array<import('three').Intersection>} 모델 교차 목록이며 렌더링 실행 인자가 없으면 빈 배열
     *
     * @ignore
     */
    getIntersectsFromModel(raycaster, recursive) {
        if (!defined(this._drawArg)) return [];
        if (!defined(recursive)) recursive = true;
        const scenes = this._drawArg.getInstanceScenesFromModelLayers();
        return this.getIntersectsFromScenes(raycaster, scenes, recursive);
    }

    /**
     * 앱의 전체 장면(scene)에서 교차 결과를 조회합니다.
     *
     * @param {import('@URaycaster').URaycaster} raycaster 교차 조회에 사용할 광선
     * @param {boolean} [recursive=true] 하위 객체까지 조회할지 여부
     * @returns {Array<import('three').Intersection>} 전체 교차 목록이며 렌더링 실행 인자가 없으면 빈 배열
     *
     * @ignore
     */
    getIntersectsFromAll(raycaster, recursive) {
        if (!defined(this._drawArg)) return [];
        if (!defined(recursive)) recursive = true;
        const scenes = this._drawArg.getInstanceScenesFromAll();
        return this.getIntersectsFromScenes(raycaster, scenes, recursive);
    }

    /**
     * 지정한 레이어(layer) 장면의 교차 결과를 조회합니다.
     *
     * @param {import('@URaycaster').URaycaster} raycaster 교차 조회에 사용할 광선
     * @param {string} layerName 조회할 레이어 이름
     * @param {boolean} [recursive=true] 하위 객체까지 조회할지 여부
     * @returns {Array<import('three').Intersection>} 교차 목록이며 앱·레이어·장면이 없으면 빈 배열
     *
     * @ignore
     */
    getIntersectsFromLayerName(raycaster, layerName, recursive) {
        if (!defined(this._app)) return [];
        const layer = this._app.getLayerByName?.(layerName);
        const scene = layer?.getScene?.();
        if (!scene) return [];
        return this.getIntersectsFromScenes(raycaster, [scene], recursive);
    }

    /**
     * 여러 장면(scene)의 교차 결과를 모아 가까운 순서로 반환합니다. <br>
     * 병합 모델의 분할 가능한 교차 후보는 분할 객체로 다시 조회합니다.
     *
     * @param {import('@URaycaster').URaycaster} raycaster 교차 조회에 사용할 광선
     * @param {Array<import('@UScene').UScene>} scenes 순서대로 조회할 장면 목록
     * @param {boolean} [recursive=true] 하위 객체까지 조회할지 여부
     * @returns {Array<import('three').Intersection>} 병합 모델 재조회가 반영된 거리순 교차 목록
     *
     * @ignore
     */
    getIntersectsFromScenes(raycaster, scenes, recursive) {
        if (!defined(recursive)) recursive = true;
        /** @type {Array<import('three').Intersection>} */
        let result = [];
        for (let i = 0; i < scenes.length; i++) {
            result = result.concat(raycaster.intersectObjects(scenes[i].children, recursive));
        }
        if (result.length > 0 && defined(this._drawArg)) {
            const app = this._drawArg._app;
            if (defined(app)) {
                // 병합 모델을 분할한 교차 결과를 반영하되 외부 호출과 오류 전달 순서를 유지한다.
                result = INTERNAL.refineMergedIntersections(app, raycaster, result, recursive);
            }
        }
        result.sort((a, b) => a.distance - b.distance);
        return result;
    }

    /**
     * 기반 분석의 저장 식별 문자열을 반환합니다.
     *
     * @returns {string} 기반 구현의 고정 문자열 'Object'
     *
     * @ignore
     */
    save() {
        return 'Object';
    }

    /**
     * 하위 클래스가 저장 데이터를 복원하는 확장 지점입니다. <br>
     * 기반 구현은 전달한 데이터를 사용하지 않습니다.
     *
     * @param {any} [data] 하위 클래스가 정의하는 저장 데이터이며 기반 클래스는 구조를 제한하지 않음
     *
     * @ignore
     */
    load(data) {}

    /**
     * 하위 클래스가 분석 타입 조회를 구현하는 확장 지점입니다. <br>
     * 기반 구현은 _type을 조회하지 않고 undefined로 종료합니다.
     */
    getType() {}

    /**
     * 하위 클래스가 분석 타입 설정을 구현하는 확장 지점입니다. <br>
     * 기반 구현은 전달한 값을 저장하지 않습니다.
     *
     * @param {string} type 하위 클래스가 처리할 분석 타입
     *
     * @ignore
     */
    setType(type) {}

    /**
     * 하위 클래스가 기본 이벤트 등록을 구현하는 확장 지점입니다. <br>
     * 기반 구현은 이벤트를 등록하지 않습니다.
     */
    addDefaultEvent() {}

    /**
     * 객체와 하위 메시(mesh)에 하이라이트(highlight) 색상을 적용합니다. <br>
     * 적용한 메시를 선택 목록에 추가하고 앱에 화면 갱신을 요청합니다. <br>
     * 같은 객체를 다시 적용해도 선택 목록의 중복 항목을 제거하지 않습니다.
     *
     * @param {import('three').Object3D} object 하이라이트를 적용할 객체와 그 하위 객체
     * @param {import('three').ColorRepresentation} [color=0x7f0000] 강조 색상이며 null도 기본값 처리
     *
     * @ignore
     */
    setHighlight(object, color) {
        object.traverse(child => {
            const mesh = /** @type {Ananlysis_Mesh} */ (child);
            if (mesh.isMesh && defined(mesh.material)) {
                // 원본 색상을 보관하고 강조 색상을 적용하며 선택 목록 관리는 이 메서드가 맡는다.
                INTERNAL.setHighlightMaterial(mesh.material, color);
                mesh._isPicked = true;
                this._selectedList.push(mesh);
            }
        });
        this.update();
    }

    /**
     * 선택 목록에 등록된 객체의 하이라이트(highlight) 색상을 복원합니다. <br>
     * 같은 객체의 선택 등록은 첫 항목만 제거하고 앱에 화면 갱신을 요청합니다. <br>
     * 하이라이트 적용으로 바뀐 투명도와 재질 업로드 표시는 복원하지 않습니다.
     *
     * @param {Ananlysis_Mesh} object 색상을 복원하고 첫 선택 등록을 제거할 메시
     *
     * @ignore
     */
    removeHighlight(object) {
        this._selectedList.forEach(mesh => {
            if (mesh.isMesh && mesh === object && defined(mesh.material)) {
                mesh._isPicked = undefined;
                // 저장된 색상만 복원하며 선택 상태와 목록 정리는 공개 제어부에서 수행한다.
                INTERNAL.restoreHighlightMaterial(mesh.material);
            }
        });
        for (let i = 0; i < this._selectedList.length; i++) {
            if (this._selectedList[i] === object) {
                this._selectedList.splice(i, 1);
                break;
            }
        }
        this.update();
    }

    /**
     * 선택한 객체와 그 하위 메시(mesh)의 하이라이트(highlight) 색상을 복원합니다. <br>
     * 선택 목록을 새 빈 배열로 교체하고 앱에 화면 갱신을 요청합니다. <br>
     * 하이라이트 적용으로 바뀐 투명도와 재질 업로드 표시는 복원하지 않습니다.
     *
     * @ignore
     */
    removeAllHighlight() {
        this._selectedList.forEach(selected => {
            selected.traverse(child => {
                const mesh = /** @type {Ananlysis_Mesh} */ (child);
                if (mesh.isMesh && defined(mesh.material)) {
                    mesh._isPicked = undefined;
                    // 저장된 색상만 복원하며 선택 상태와 목록 정리는 공개 제어부에서 수행한다.
                    INTERNAL.restoreHighlightMaterial(mesh.material);
                }
            });
        });
        this._selectedList = [];
        this.update();
    }
}

export {UAnaly};
