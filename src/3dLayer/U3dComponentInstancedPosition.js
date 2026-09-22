//@ts-nocheck
import * as THREE from 'three';
import {U3dComponentPosition} from '@union3d/3dLayer/U3dComponentPosition';
import {defined} from '@util/defined.js';
import {defaultValue} from '@util/defaultValue.js';
import {deferred} from '@union3d/util/deferred.js';
import {__GInfo__, __GSError__} from '@U3dMessage';
import {INTERNAL} from '@union3d/3dLayer/U3dComponentInstancedPosition.internal';
import {INTERNAL as COLOR_ADJUSTMENT} from '@union3d/3dLayer/U3dComponentPosition.internal';

const TEMP_BOX_MAT = new THREE.Matrix4();
const TEMP_POI_VEC = new THREE.Vector3();


/**
 * 공유 instanced mesh의 개별 인스턴스를 일반 컴포넌트 API로 제어합니다.
 *
 * @group 3dLayer
 * @extends {U3dComponentPosition}
 */
class U3dComponentInstancedPosition extends U3dComponentPosition {
    /** @type {boolean} */
    #colorAdjustmentSelected = false;
    /** 애니메이션 갱신을 허용하는 카메라 거리입니다. @type {number} */
    #animationDistance;
    /** mixer 활성 여부를 조회하는 선택 callback입니다. @type {undefined | function(): boolean} */
    isMixerEnabled;
    /** 한 인스턴스 그룹이 사용하는 최대 ID 범위입니다. @type {number} */
    _instancedMaxCount;
    /** 현재 인스턴스가 속한 그룹 번호입니다. @type {number | undefined} */
    groupIndex;
    /** 현재 인스턴스의 변환과 가시성 정보입니다. @type {InstancedTRSInfo | undefined} */
    instancedInfo;
    /** 현재 인스턴스가 속한 공유 렌더 그룹입니다. @type {import('three').Group | undefined} */
    instancedGroup;
    /** 중복을 제거한 애니메이션 식별자 목록입니다. @type {Array<string | number>} */
    _animateList;
    /** tween 갱신 FPS 설정값입니다. @type {number} */
    tweenFps;
    /** 인스턴스 애니메이션 시작 시점을 분산하는 난수 오프셋입니다. @type {number} */
    offset;
    /** 각 공유 mesh에서 현재 ID에 해당하는 entity 목록입니다. @type {Array<InstancedMeshInstance> | undefined} */
    instances;
    /** 현재 frustum callback에서 mixer 갱신 대상으로 선택되었는지 나타냅니다. @type {boolean} */
    _updateMixer = true;
    /** 우선 반환할 원본 모델 참조입니다. @type {import('three').Object3D | undefined} */
    _rootObject;

    /**
     * 인스턴스 컴포넌트를 생성하고 공유 mesh의 ID·변환·애니메이션 상태를 연결합니다.
     *
     * @param {U3dComponentInstancedPositionCO} [opt={}] 생성 옵션
     */
    constructor(opt = /**@type{U3dComponentInstancedPositionCO}*/({})) {
        super(opt);
        if (this.isDisposed() || !this._object || !this.position || !this.rotation || !this.scale || !this.quaternion) {
            return;
        }

        this._setInstanced = defaultValue(opt.setInstanced, true);
        this.instanceId = defaultValue(opt.instanceId, undefined);
        this.groupIndex = defaultValue(opt.groupIndex, undefined);
        this.instancedInfo = defaultValue(opt.instancedInfo, undefined);
        this.instancedGroup = defaultValue(opt.instancedGroup, undefined);
        this._animateList = [];
        // proxy 증분 회전을 현재 컴포넌트와 인스턴스 matrix 갱신 경로에 연결합니다.
        this._object.rotateX = INTERNAL.rotateX.bind(undefined, this);
        this._object.rotateY = INTERNAL.rotateY.bind(undefined, this);
        this._object.rotateZ = INTERNAL.rotateZ.bind(undefined, this);
        this.tweenFps = defaultValue(opt.tweenFps, 23);
        this.offset = Math.random();
        this._instancedMaxCount = opt.instancedMaxCount || 2000;
        if (this.instancedGroup) {
            // 현재 그룹에서 이 컴포넌트가 제어할 인스턴스 entity를 연결합니다.
            INTERNAL.setInstanceEntity(this);
        }

        this.#animationDistance = defaultValue(opt.animationDistance, 8000);
        // 공유 geometry 크기를 기반으로 컴포넌트의 초기 경계를 계산합니다.
        INTERNAL.setBBox(this);
        const self = this;
        /** @type {any} */ (Object).defineProperties(self, {
            position: {
                get: function () {
                    return self._object?.position;
                },
                set: function (/** @type {number} */x, /** @type {number} */y, /** @type {number} */z) {
                    self.position = self.position ?? new THREE.Vector3();
                    self.position.x = x;
                    self.position.y = y;
                    self.position.z = z;
                    const position = self.instancedInfo?.position;
                    if (position) {
                        position.x = x;
                        position.y = y;
                        position.z = z;
                    }
                    self.setPosition(self.position);
                    self._object?.position.set(x, y, z);
                }
            },
            rotation: {
                get: function () {
                    return self._object?.rotation;
                },
                set: function (/** @type {number} */x, /** @type {number} */y, /** @type {number} */z) {
                    if(!self.rotation) return;
                    self.rotation.x = x;
                    self.rotation.y = y;
                    self.rotation.z = z;
                    const rotation = self.instancedInfo?.rotation;
                    if (rotation) {
                        rotation.x = x;
                        rotation.y = y;
                        rotation.z = z;
                    }
                    self.setRotation(self.rotation);
                    self._object?.rotation.set(x, y, z);
                }
            },
            scale: {
                get: function () {
                    return self._object?.scale;
                },
                set: function (/** @type {number} */x, /** @type {number} */y, /** @type {number} */z) {
                    self.scale = self.scale ?? new THREE.Vector3();
                    self.scale.x = x;
                    self.scale.y = y;
                    self.scale.z = z;
                    const scale = self.instancedInfo?.scale;
                    if (scale) {
                        scale.x = x;
                        scale.y = y;
                        scale.z = z;
                    }
                    self.setScale(self.scale);
                    self._object?.scale.set(x, y, z);
                }
            },
        })

        this._object.position.copy(this.position);
        this._object.rotation.copy(this.rotation);
        this._object.scale.copy(this.scale);
        this._object.updateMatrixWorld();

        this.quaternion.setFromEuler(this.rotation);
        this.updateMatrix();
        // 재사용한 ID에 이전 컴포넌트의 보정값이 남아 있으면 기본값으로 지웁니다.
        this._applyColorAdjustment(this.getBrightness(), this.getContrast(), this.getSaturation());
        if (this.hasMixers()) {
            const index = this.getInstancedId();
            this._mixerController?.setInstanceId(index);
            // 공유 mesh에 거리 기반 애니메이션 갱신 callback을 최초 한 번 등록합니다.
            INTERNAL.setOnFrustumEnter(this);
        }
    }

    /**
     * 애니메이션 갱신을 허용하는 카메라 거리를 반환합니다.
     *
     * @returns {number} 애니메이션 갱신 거리
     */
    getAnimationDistance() {
        return this.#animationDistance;
    }

    /**
     * 공유 모델의 각 메시에서 이 컴포넌트의 인스턴스만 보정합니다.
     *
     * @override
     *
     * @param {number} brightness 검증된 밝기 배율
     * @param {number} contrast 검증된 대비 배율
     * @param {number} [saturation=1] 검증된 채도 배율
     *
     * @protected
     * @ignore
     */
    _applyColorAdjustment(brightness, contrast, saturation = 1) {
        // 원본 공유 재질의 색상을 변경하지 않고 인스턴스 데이터로 전달합니다.
        COLOR_ADJUSTMENT.applyInstanceColorAdjustment(this.instancedGroup, this.instanceId,
            this.#colorAdjustmentSelected ? 1 : brightness, this.#colorAdjustmentSelected ? 1 : contrast,
            this.#colorAdjustmentSelected ? 1 : saturation);
    }

    /**
     * 애니메이션 갱신을 허용하는 카메라 거리를 설정합니다.
     *
     * @param {number} distance 애니메이션 갱신 거리
     */
    setAnimationDistance(distance) {
        this.#animationDistance = distance;
    }

    /**
     * 인스턴스 컴포넌트의 내장 애니메이션 클립을 모두 정지하는 함수
     *
     * @override
     *
     */
    stopAllAnimation() {
        const index = this.getInstancedId();
        if (!defined(index)) return;
        const group = this.instancedGroup;
        if (!defined(group)) return;

        // 공유 mesh와 컴포넌트가 보관한 entity의 재생 속도를 함께 정지 상태로 맞춥니다.
        INTERNAL.stopAllAnimation(this, index, group);
    }

    /**
     * 인스턴스 컴포넌트의 내장 애니메이션 클립을 모두 동작시키는 함수
     *
     * @override
     *
     */
    startAllAnimation() {
        const index = this.getInstancedId();
        if (!defined(index)) return;
        const group = this.instancedGroup;
        if (!defined(group)) return;

        // 공유 mesh와 컴포넌트가 보관한 entity의 재생 속도를 함께 기본값으로 복원합니다.
        INTERNAL.startAllAnimation(this, index, group);
    }

    /** 인스턴스 애니메이션을 모두 정지합니다. */
    stopMixer() {
        this.stopAllAnimation();
    }

    /** 인스턴스 애니메이션을 모두 재생합니다. */
    startMixer() {
        this.startAllAnimation();
    }

    /**
     * mixer 상태를 현재 인스턴스 matrix에 반영합니다.
     *
     * @param {number} [idx] 갱신할 index. 유한한 값이 아니면 현재 그룹 index를 사용합니다.
     * @returns {boolean} matrix 갱신 실행 여부
     * @ignore
     */
    _flushMixerInstance(idx = undefined) {
        const targetIndex = Number.isFinite(idx) ? idx : this.getInstancedId();
        if (!defined(targetIndex)) return false;
        if (this._animation === true) return false;
        if (!this.position || !this.instancedGroup) return false;

        this.instancedMeshUpdate(this.position, targetIndex, this.instancedGroup, 0);
        return true;
    }

    /**
     * 인스턴스 컴포넌트의 Mesh에 위치,회전,크기(Transform)를 반영하는 메서드입니다.
     * @param {WorldPositionVector3} position 반영할 위치
     * @param {import('three').Quaternion} quaternion 반영할 회전
     * @param {import('three').Vector3} scale 반영 할 크기
     */
    updateInstances(position, quaternion, scale) {
        // 컴포넌트 TRS를 공유 mesh의 matrix, barrier, 외곽선과 cache에 일관되게 반영합니다.
        INTERNAL.updateInstances(this, position, quaternion, scale);
    }

    /**
     * 경로 위치와 진행 방향을 shader에서 읽을 수 있는 데이터 텍스처로 변환합니다.
     *
     * @param {Array<import('three').Vector3>} path 경로 위치 목록
     * @param {Array<import('three').Vector3>} dir 경로 진행 방향 목록
     * @param {number} [sampleCount=512] 텍스처 샘플 수
     * @returns {{pathPosTexture: import('three').DataTexture, pathDirTexture: import('three').DataTexture, sampleCount: number}} 생성한 위치·방향 텍스처와 샘플 수
     */
    createPathTextures(path, dir, sampleCount = 512) {
        // 입력 경로를 shader가 소비하는 위치·방향 texture 묶음으로 변환하여 반환합니다.
        return INTERNAL.createPathTextures(path, dir, sampleCount);
    }

    /**
     * 컴포넌트 회전 시 절대 축이 아니라 현재 컴포넌트의 회전 값 기준으로 회전시키는 함수
     *
     * @override
     *
     * @param {DegreeEulerLike} rotation 각 축에 대한 회전각도 (x, y, z)
     */
    setRotationRelative(rotation) {
        const rotX = THREE.MathUtils.degToRad(rotation.x);
        const rotY = THREE.MathUtils.degToRad(rotation.y);
        const rotZ = THREE.MathUtils.degToRad(rotation.z);

        if (!this.drawArg || !defined(rotation) || !this.rotation) return;

        // 누적 회전
        this.rotation.x += rotX;
        this.rotation.y += rotY;
        this.rotation.z += rotZ;

        this.instancedInfo?.rotation?.copy?.(this.rotation);
        const idx = this.getInstancedId();
        if (!defined(idx)) return;
        this.instancedMeshUpdate(this.position, idx, this.instancedGroup, 0);

        if (defined(this._object)) {
            this._object.scale.copy(this.scale);
            this._object.updateMatrixWorld();
        }
        this.updateChildrenMatrix();

    }

    /**
     * 현재 컴포넌트의 instanced Mesh 생성 시에 참조한 object를 반환
     *
     * @override
     *
     * @returns {import('three').Object3D | undefined} 현재 변환을 반영한 원본 모델
     */
    getModel() {
        if (this._rootObject) {
            // 반환할 원본 모델에 현재 컴포넌트의 변환을 동기화합니다.
            INTERNAL.syncModelMatrixWorld(this, this._rootObject);
            return this._rootObject;
        }

        const layer = this.componentLayer;
        if (!layer || !layer?._object || layer?._object.children.length === 0) return undefined;

        for (const object of layer._object.children) {
            if (this.getModelName() === object.name) {
                return object;
            }
        }
        return undefined;
    }

    /**
     * 현재 컴포넌트를 반환합니다.
     *
     * @returns {U3dComponentInstancedPosition} 현재 컴포넌트
     */
    getComponent() {
        return this;
    }

    /**
     * 인스턴스드 컴포넌트의 인스턴스 아이디를 반환하는 함수
     * @returns {number | undefined} instanceId를 반환
     */
    getInstanceId() {
        return this.instanceId;
    }

    /**
     * 애니메이션 목록 추가 함수
     * @param {string | number} val 애니메이션 목록에 추가할 ID
     */
    addAnimateList(val) {
        if (this._animateList.indexOf(val) === -1)
            this._animateList.push(val);
    }

    /**
     * 해당 instanced Component가 대상으로 담고 있는 객체를 반환
     *
     * @override
     *
     * @returns {import('three').Object3D | undefined} instanced / instanced skinned mesh 를 반환
     */
    getObject() {
        return this.instancedGroup;
    }

    /**
     * instanced mesh를 참고하여 만든 원래의 대상을 반환
     * @returns {import('three').Object3D | undefined} URL에서 불러온 원본 객체
     */
    getOriginalModel() {
        return this.getModel();
    }

    /**
     * intanceId에  instancedMaxCount를 나눈 나머지를 반환
     *
     * @override
     *
     * @returns {number | undefined} 현재 인스턴스의 그룹 내 index
     */
    getInstancedId() {
        if (!defined(this.instanceId)) return;
        return this.instanceId % this._instancedMaxCount;
    }

    /**
     * intanced mesh의 (위치, 회전, 크기)를 담고 있는 객체를 반환
     * @returns {InstancedTRSInfo | undefined} 위치·회전·크기 정보
     */
    getInstancedInfo() {
        return this.instancedInfo;
    }

    /**
     * instanced mesh(또는 instanced group) 에 현재 위치/회전/스케일을 반영합니다.
     * @param {WorldPositionVector3} position 설정 위치 (월드 좌표, EPSG:3857)
     * @param {number} idx 설정 대상 idx
     * @param {import('three').Object3D | undefined} object 설정 대상 InstancedGroup
     * @param {number} [elapsedTime=0] 애니메이션 updateTime 상수
     */
    instancedMeshUpdate(position = new THREE.Vector3(), idx, object, elapsedTime = 0) {
        if (!object) return;

        // 현재 회전 또는 진행 방향을 인스턴스 갱신용 quaternion으로 계산합니다.
        const quaternion = INTERNAL.settingInstancedObject(this, this.lookAt, position);
        if (!quaternion) return;
        this.updateInstances(position, quaternion, this.scale ?? new THREE.Vector3(1, 1, 1));
    }

    /**
     * 색상 설정 함수
     *
     * @override
     *
     * @param {import('three').Color | string | number} [color='#ffffff']
     * @returns {boolean} 색상 적용 여부
     */
    setColor(color = '#ffffff') {
        if (!defined(this.instanceId)) return false;
        if (!this.instancedGroup) return false;
        try {
            if (!(color instanceof THREE.Color)) {
                color = new THREE.Color(color);
            }

            for (const mesh of this.instancedGroup.children) {
                const instMesh = /** @type {InstancedRenderableMesh} */(mesh);
                const meshIndex = this.instanceId % instMesh.capacity;
                // 입력 값이 원본 색상이랑 같으면 종료합니다.
                if (instMesh.getColorAt(meshIndex).equals(color)) {
                    continue;
                }

                instMesh.setColorAt(meshIndex, color);
                const color_ = color.clone();
                if (!instMesh._oriColorMap) instMesh._oriColorMap = new Map();
                instMesh._oriColorMap.set(meshIndex, color_);

                this.color = color_.getStyle();
            }
        } catch (e) {
            __GSError__(e);
            return false;
        }
        return true;
    }

    /**
     * 현재 색상 반환 함수
     *
     * @override
     *
     * @returns {import('three').ColorRepresentation} 현재 적용된 색상
     */
    getColor() {
        if (!defined(this.instanceId)) return '';
        if (!this.instancedGroup || !this.instancedGroup.children.length) return '';
        if (this.color) return this.color;
        const mesh = this.instancedGroup.children[0];
        const instMesh = /** @type {InstancedRenderableMesh} */(mesh);
        const mat = /** @type {{ color: (import('three').Color|undefined) }} */(instMesh.material);
        const color = instMesh.getColorAt(this.instanceId % instMesh.capacity) || mat.color;
        if (!color) return '';
        return color.getStyle();
    }

    /**
     * 투명도 설정 함수
     *
     * @override
     *
     * @param {number} [opacity=1] 투명도 수치
     * @returns {boolean} 투명도 적용 여부
     */
    setOpacity(opacity = 1) {
        if (!defined(this.instanceId)) return false;
        if (!this.instancedGroup) return false;
        try {
            for (const mesh of this.instancedGroup.children) {
                const instMesh = /** @type {InstancedRenderableMesh} */(mesh);
                const idx = this.instanceId % instMesh.capacity;
                instMesh.setOpacityAt(idx, opacity);
                if (!instMesh._oriOpacityMap) instMesh._oriOpacityMap = new Map();
                instMesh._oriOpacityMap.set(idx, opacity);
            }
            this.opacity = opacity;
        } catch (e) {
            __GSError__(e);
            return false;
        }
        return true;
    }

    /**
     * 현재 투명도 수치 반환
     *
     * @override
     *
     * @returns {number} 현재 투명도 수치
     */
    getOpacity() {
        if (!defined(this.instanceId)) return NaN;
        if (!this.instancedGroup || !this.instancedGroup.children.length) return NaN;
        if (this.opacity) return this.opacity;
        const mesh = this.instancedGroup.children[0];

        const instMesh = /** @type {InstancedRenderableMesh} */(mesh);
        return instMesh.getOpacityAt(this.instanceId % instMesh.capacity);
    }

    // 색상 조정(밝기·대비·채도) 공개 API는 기반 클래스 U3dComponentPosition의 구현을 그대로 사용합니다.
    // 이 클래스는 _applyColorAdjustment()만 재정의해 값을 인스턴스 uniform으로 전달합니다.


    /**
     * 텍스쳐 제외 출력 여부
     *
     * @override
     *
     * @param {boolean} [isExcept=false] 텍스쳐 제외 적용 여부
     *
     * @deprecated instance 타입의 ComponentPosition은 텍스쳐 제외 출력을 지원하지 않습니다.
     * @returns {boolean}
     */
    exceptTexture(isExcept = false) {
        if (isExcept) {
            __GInfo__(this, 'instance 타입의 ComponentPosition은 텍스쳐 제외 출력을 지원하지 않습니다.', '8118553');
        }
        return !isExcept;
    }

    /**
     * 속성값들 반환 함수
     *
     * @override
     *
     * @returns {ComponentParam} U3dComponentInstancedPosition의 속성값 정보
     */
    getParam() {
        const param = super.getParam();
        if (!defined(param.instanced)) {
            param.instanced = this._setInstanced;
        }
        return param;
    }

    /**
     * BoundingBox를 반환 받는 함수
     *
     * @override
     *
     * @returns {Box3WithCenter} 해당 컴포넌트의 경계 상자
     */
    getBoundBoxObject(){
        const object = this.getObject();
        /** @type {Box3WithCenter} */
        const tempBox = new THREE.Box3();
        if (!object) return tempBox;
        const index = this.getInstancedId?.();
        if (!defined(index)) return tempBox;
        // 원본 모델의 child 변환을 반영한 로컬 경계를 모읍니다. 반환 상자의 중심 정보는 아래에서 설정합니다.
        INTERNAL.collectBounds(object, index, tempBox);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        tempBox.getSize(size);
        tempBox.getCenter(center);
        tempBox._center = center;
        return tempBox;
    }

    /**
     * 해당 U3dComponentInstancedPosition의 Rectangle 위치 정보를 반환
     *
     * @override
     *
     * @returns {{
     *     DownLeftTop: import('three').Vector3;
     *     DownRightTop: import('three').Vector3;
     *     DownLeftBottom: import('three').Vector3;
     *     DownRightBottom: import('three').Vector3;
     *     UpLeftTop: import('three').Vector3;
     *     UpRightTop: import('three').Vector3;
     *     UpLeftBottom: import('three').Vector3;
     *     UpRightBottom: import('three').Vector3;
     * } | undefined} {
     *             DownLeftTop: 하단 좌상측 위치,
     *             DownRightTop: 하단 우상측 위치,
     *             DownLeftBottom: 하단 좌하측 위치,
     *             DownRightBottom: 하단 우하측 위치,
     *             UpLeftTop: 상단 좌상단 위치,
     *             UpRightTop: 상단 우상측 위치,
     *             UpLeftBottom: 상단 좌하측 위치,
     *             UpRightBottom: 상단 우하측 위지
     *         }
     */
    getRectangle() {
        const object = this.getObject();
        if (!object || !this.position || !this.rotation || !this.scale) return undefined;

        const bbox = this.getBoundBoxObject();
        if (!defined(bbox)) {
            return undefined;
        }

        this._bbox = /** @type {Box3WithCenter} */(bbox.clone().applyMatrix4(this._object?.matrixWorld ?? new THREE.Matrix4()));
        this._bbox._center = new THREE.Vector3();
        this._bbox.getCenter(this._bbox._center);


        const minBox = bbox.min.clone();
        const maxBox = bbox.max.clone();

        const checkIniBox = new THREE.Vector3(0, 0, 0);
        let rot;
        if (defined(this.instancedInfo)) {
            // 대상의 높이 0을 기준으로 회전 하였을 경우
            checkIniBox.set(this.instancedInfo.position.x, this.instancedInfo.position.y, this.instancedInfo.position.z);
            rot = this.instancedInfo.rotation.clone();
        } else {
            // 대상의 중심점을 기준으로 회전 하였을 경우
            checkIniBox.set(this.position.x, this.position.y, this.position.z);
            rot = this.rotation.clone();
        }
        const matrix4 = TEMP_BOX_MAT.makeRotationFromEuler(rot);
        matrix4.setPosition(checkIniBox);
        matrix4.scale(this.scale);
        // 생성된 Box3(육면체) 8개 꼭지점 반환
        const DownLeftTop = new THREE.Vector3(minBox.x, minBox.y, minBox.z).applyMatrix4(matrix4);
        const DownRightTop = new THREE.Vector3(maxBox.x, minBox.y, minBox.z).applyMatrix4(matrix4);
        const DownLeftBottom = new THREE.Vector3(minBox.x, maxBox.y, minBox.z).applyMatrix4(matrix4);
        const DownRightBottom = new THREE.Vector3(maxBox.x, maxBox.y, minBox.z).applyMatrix4(matrix4);
        const UpLeftTop = new THREE.Vector3(minBox.x, minBox.y, maxBox.z).applyMatrix4(matrix4);
        const UpRightTop = new THREE.Vector3(maxBox.x, minBox.y, maxBox.z).applyMatrix4(matrix4);
        const UpLeftBottom = new THREE.Vector3(minBox.x, maxBox.y, maxBox.z).applyMatrix4(matrix4);
        const UpRightBottom = new THREE.Vector3(maxBox.x, maxBox.y, maxBox.z).applyMatrix4(matrix4);

        return {
            DownLeftTop,
            DownRightTop,
            DownLeftBottom,
            DownRightBottom,
            UpLeftTop,
            UpRightTop,
            UpLeftBottom,
            UpRightBottom
        };
    }

    /**
     * 컴포넌트와 연결된 인스턴스·자식·경로·라벨을 표시합니다.
     *
     * @override
     * @returns {DeferredObject<unknown>} 성공 시 true로 resolve하고 필수 인스턴스 정보가 없으면 reject하는 deferred 객체
     */
    show() {
        const promise = deferred();
        const scene = this.scene;

        if (!this._show) {
            this._show = true;
            if (defined(this.instanceId)) {
                const index = this.getInstancedId();
                const info = this.instancedInfo;
                if (!defined(info)) {
                    promise.reject();
                    return promise;
                }
                if (!defined(index)) {
                    promise.reject();
                    return promise;
                }

                // entity의 _info도 함께 바꿔 이후 mesh 갱신이 현재 가시성을 유지하게 합니다.
                info.visible = true;
                for (const instancedEntity of (this.instances ?? [])) {
                    if (!instancedEntity?._info) continue;
                    instancedEntity._info.visible = true;
                }
                // 실제 인스턴스와 선택 외곽선의 가시성을 함께 갱신합니다.
                INTERNAL.setInstancedMeshVisible(this, index, true);
            } else if (this._object) {
                this._object.visible = true;
            }
        }

        // 자식이 있을 경우 가시화 같이 제어
        if (this.children && this.children.length > 0) {
            const children = /** @type {Array<U3dComponentPosition | U3dComponentInstancedPosition>} */ (
                /** @type {unknown} */ (this.children)
            );
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                child.show();
            }
        }

        if (defined(this.splineObject)) {
            if (this.drawPath && defined(this.oriSplineObject)) {
                scene.add(this.oriSplineObject);
            }
            if (this.drawRealPath) {
                scene.add(this.splineObject);
            }
        }
        if (this._labelVisible) {
            this.poi?.show();
        }
        promise.resolve(true);
        return promise;
    }

    /**
     * 컴포넌트와 연결된 인스턴스·자식·경로·라벨을 숨깁니다.
     *
     * @override
     * @returns {DeferredObject<unknown>} 성공 시 true로 resolve하고 componentLayer나 필수 인스턴스 정보가 없으면 reject하는 deferred 객체
     */
    hide() {
        const promise = deferred();
        const scene = this.scene;

        if (!this.componentLayer) {
            promise.reject();
            return promise;
        }
        if (this._show) {
            this._show = false;
            if (defined(this.instanceId)) {
                const index = this.getInstancedId();
                const info = this.instancedInfo;
                if (!defined(info)) {
                    promise.reject();
                    return promise;
                }
                if (!defined(index)) {
                    promise.reject();
                    return promise;
                }
                // entity의 _info도 함께 바꿔 이후 mesh 갱신이 현재 가시성을 유지하게 합니다.
                info.visible = false;
                for (const instancedEntity of (this.instances ?? [])) {
                    if (!instancedEntity?._info) continue;
                    instancedEntity._info.visible = false;
                }
                // 실제 인스턴스와 선택 외곽선의 가시성을 함께 갱신합니다.
                INTERNAL.setInstancedMeshVisible(this, index, false);
            }
        }

        // 자식이 있을 경우 가시화 같이 제어
        if (this.children && this.children.length > 0) {
            /** @type {Array<U3dComponentPosition | U3dComponentInstancedPosition>} */
            const children = this.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                child.hide();
            }
        }


        if (defined(this.splineObject)) {
            if (this.drawPath && defined(this.oriSplineObject)) {
                scene.remove(this.oriSplineObject);
            }
            if (this.drawRealPath) {
                scene.remove(this.splineObject);
            }

            this.isTrace = false;
            this.updateAnimationCameraTrace();
        }

        if (this._labelVisible) {
            this.poi?.hide();
        }

        promise.resolve(true);
        return promise;
    }


    /**
     * 컴포넌트 위치를 설정하고 인스턴스·POI·overlay·자식 계층에 반영합니다.
     *
     * @override
     *
     * @param {WorldPosition} position 위치 값 (worldPosition)
     * @param {WorldPosition} [lookAt] 바라볼 위치 값 (worldPosition)
     * @param {boolean} [fixedOverlay=false] 오버레이 고정 여부
     */
    setPosition(position, lookAt = undefined, fixedOverlay = false) {
        if (!this.drawArg) return;

        const index = this.getInstancedId();
        if (!defined(index)) return;

        const posVec = (/** @type {import('three').Vector3} */(position))?.isVector3
            ? /** @type {import('three').Vector3} */(position)
            : new THREE.Vector3(position.x, position.y, position.z);

        if (defined(lookAt)) {
            this.lookAt = new THREE.Vector3(lookAt.x, lookAt.y, lookAt.z);
        }
        this.instancedMeshUpdate(posVec, index, this.instancedGroup, 0);
        this.position?.set(posVec.x, posVec.y, posVec.z);
        this.instancedInfo?.position?.copy?.(posVec);
        if (defined(this._object)) {
            this._object.position.set(posVec.x, posVec.y, posVec.z);
            this._object.updateMatrixWorld();
        }

        if (this.poi) {
            const poi = /** @type {PoiLike} */ (this.poi);
            const zOffset = poi?.zOffset ?? 0;
            TEMP_POI_VEC.set(posVec.x, posVec.y, posVec.z + zOffset);
            poi.setPosition(TEMP_POI_VEC);
        }
        if (!fixedOverlay) this.settingOverlay?.(posVec);

        this.recordCumulativePathFrame?.(this.position, undefined, undefined, this.speed / 3.6);
        this.updateChildrenMatrix();
    }

    /**
     * 컴포넌트의 회전값을 지정하는 함수
     *
     * @override
     *
     * @param {RadianEulerLike} rotation 각 축에 대한 회전값(radian)
     *
     */
    setRotation(rotation) {
        if (!this.drawArg) return;
        if (!defined(rotation)) return

        const rotX = defined(rotation.x) ? rotation.x : 0;
        const rotY = defined(rotation.y) ? rotation.y : 0;
        const rotZ = defined(rotation.z) ? rotation.z : 0;

        this.rotation?.set(rotX, rotY, rotZ)
        this.instancedInfo?.rotation?.copy?.(this.rotation ?? new THREE.Euler());

        const index = this.getInstancedId();
        if (!defined(index)) return;
        this.instancedMeshUpdate(this.position, index, this.instancedGroup, 0);

        if (defined(this._object)) {
            this._object.rotation.copy(this.rotation);
            this._object.updateMatrixWorld();
        }

        this.drawArg.setUpdateDate();
        this.updateChildrenMatrix();
    }

    /**
     * 컴포넌트의  X 회전값을 지정하는 함수
     *
     * @override
     *
     * @param {Degree} degree 회전값
     */
    setRotationX(degree) {
        if (!this.drawArg || !this.rotation) return;
        const radian = (Math.PI / 180) * degree;
        this.rotation.set(radian, this.rotation.y, this.rotation.z);
        this.instancedInfo?.rotation?.copy?.(this.rotation);

        const index = this.getInstancedId();
        if (!defined(index)) return;
        this.instancedMeshUpdate(this.position, index, this.instancedGroup, 0);

        if (defined(this._object)) {
            this._object.rotation.copy(this.rotation);
            this._object.updateMatrixWorld();
        }
        this.drawArg.setUpdateDate();
        this.updateChildrenMatrix();
    }

    /**
     * 컴포넌트의  Y 회전값을 지정하는 함수
     *
     * @override
     *
     * @param {Degree} degree 회전값
     */
    setRotationY(degree) {
        if (!this.drawArg || !this.rotation) return;
        const radian = (Math.PI / 180) * degree;
        this.rotation.set(this.rotation.x, radian, this.rotation.z);
        this.instancedInfo?.rotation?.copy?.(this.rotation);

        const index = this.getInstancedId();
        if (!defined(index)) return;
        this.instancedMeshUpdate(this.position, index, this.instancedGroup, 0);

        if (defined(this._object)) {
            this._object.rotation.copy(this.rotation);
            this._object.updateMatrixWorld();
        }

        this.drawArg.setUpdateDate();
        this.updateChildrenMatrix();
    }

    /**
     * 컴포넌트의  Z 회전값을 지정하는 함수
     *
     * @override
     *
     * @param {Degree} degree 회전값
     */
    setRotationZ(degree) {
        if (!this.drawArg || !this.rotation) return;
        const radian = (Math.PI / 180) * degree;
        this.rotation.set(this.rotation.x, this.rotation.y, radian);
        this.instancedInfo?.rotation?.copy?.(this.rotation);

        const index = this.getInstancedId();
        if (!defined(index)) return;
        this.instancedMeshUpdate(this.position, index, this.instancedGroup, 0);

        if (defined(this._object)) {
            this._object.rotation.copy(this.rotation);
            this._object.updateMatrixWorld();
        }

        this.drawArg.setUpdateDate();
        this.updateChildrenMatrix();
    }

    /**
     * 컴포넌트를 지정 각도만큼 회전시키는 함수
     *
     * @override
     *
     * @param {Degree} degree 각도 (degree)
     */
    rotateByAngle(degree) {
        if (!this.rotation) return;
        U3dComponentPosition.prototype.rotateByAngle.call(this, degree);
        this.instancedInfo?.rotation?.copy?.(this.rotation);

        const index = this.getInstancedId();
        if (!defined(index)) return;
        this.instancedMeshUpdate(this.position, index, this.instancedGroup, 0);

        this.updateChildrenMatrix();
    }

    /**
     * 컴포넌트의 크기를 지정하는 함수
     *
     * @override
     *
     * @param {number | string | import('three').Vector3Like} scalar 스칼라 값 혹은 {x,y,x} 값
     */
    setScale(scalar) {
        let newScale;

        if (!this.scale) return;

        /** @param {number} val 검사할 축 값 */
        const checkValid = (val) => {
            if (!isFinite(val) || isNaN(val) || val < 1e-4 || val > 10000) {
                console.warn(`${val} : 유효하지 않는 scale 값입니다.`);
                return false;
            }
            return true;
        }

        if (typeof scalar === 'number' || typeof scalar === 'string') {
            const val = Number(scalar);
            if (checkValid(val)) {
                newScale = new THREE.Vector3();
                newScale.set(val, val, val);
            }
        } else {
            if (checkValid(scalar.x) && checkValid(scalar.y) && checkValid(scalar.z)) {
                newScale = new THREE.Vector3();
                newScale.set(scalar.x, scalar.y, scalar.z);
            }
        }
        if (newScale === undefined) return;

        this.scale.copy(newScale);
        this.instancedInfo?.scale?.copy?.(this.scale);

        const index = this.getInstancedId();
        if (!defined(index)) return;
        this.instancedMeshUpdate(this.position, index, this.instancedGroup, 0);

        if (defined(this._object)) {
            this._object.scale.copy(this.scale);
            this._object.updateMatrixWorld();
        }

        this.drawArg.setUpdateDate();
        this.updateChildrenMatrix();
    }


    /**
     * 컴포넌트 크기에 지정 값 만큼 곱하는 함수
     *
     * @override
     *
     * @param {string | number} num 사용자 지정 값
     */
    multiplyScale(num) {
        U3dComponentPosition.prototype.multiplyScale.call(this, Number(num));
        if(!this.scale) return;

        this.instancedInfo?.scale?.copy?.(this.scale);

        const index = this.getInstancedId();
        if (!defined(index)) return;
        this.instancedMeshUpdate(this.position, index, this.instancedGroup, 0);

        if (defined(this._object)) {
            this._object.scale.copy(this.scale);
            this._object.updateMatrixWorld();
        }

        this.updateChildrenMatrix();
    }

    /**
     * render order를 설정하는 함수
     * 렌더링 순서를 설정, 사용자가 임의로 설정시에 해당 객체에 대한 렌더링 순서가 바뀌게 되어 화면에 표출된 순서가 바뀔 수 있음
     *
     * @param {number} renderOrder 적용할 렌더 순서
     *
     * @ignore
     */
    setRenderOrder(renderOrder) {
        if (!defined(this.instancedGroup)) return;
        const object = this.instancedGroup;
        object.traverse(/** @param {import('three').Object3D} child */ (child) => {
            if (child instanceof THREE.Mesh) {
                child.renderOrder = renderOrder;
            }
        });
    }

    /**
     * [pickMaterial] 대상을 선택하거나 지정 했을 경우에 해당 객체의 색상을 변경해주거나 highlight 해주는 함수
     *
     * @param {unknown} [intersect] 선택 교차 정보. 현재 구현에서는 사용하지 않습니다.
     * @param {import('three').ColorRepresentation} [color='#ffffff'] 설정 색상
     * @param {number} [opacity=1] 설정 투명도 수치
     *
     * @returns {boolean} 색상 적용 여부
     *
    * @ignore
     */
    pickMaterial(intersect, color = '#ffffff', opacity = 1) {
        if (!defined(this.instanceId)) return false;
        if (!this.instancedGroup) return false;
        try {
            const colorObj = new THREE.Color(color);
            for (const mesh of this.instancedGroup.children) {
                const instMesh = /** @type {InstancedRenderableMesh} */(mesh);
                instMesh.pickMaterial?.((this.instanceId % instMesh.capacity), colorObj, opacity);
            }
            this.#colorAdjustmentSelected = true;
            this._applyColorAdjustment(this.getBrightness(), this.getContrast(), this.getSaturation());
            return true;
        } catch (e) {
            __GSError__(e);
            return false;
        }
    }
    /**
     * [restoreMaterial] 색상을 이전에 설정하여 변경 하였다면 다시 원래의 색상으로 복구하는 함수
     *
     * @returns {boolean} 색상 복구 적용 여부
     *
    * @ignore
     */
    restoreMaterial() {
        if (this.isDisposed()) return false;
        if (!defined(this.instanceId)) return false;
        if (!this.instancedGroup) return false;

        try {
            for (const mesh of this.instancedGroup.children) {
                const instMesh = /** @type {InstancedRenderableMesh} */(mesh);
                instMesh.restoreMaterial?.((this.instanceId % instMesh.capacity));
            }
            this.#colorAdjustmentSelected = false;
            this._applyColorAdjustment(this.getBrightness(), this.getContrast(), this.getSaturation());
        } catch (e) {
            __GSError__(e);
            return false;
        }
        return true;
    }

    /**
     * [updateAnimationAt] 해당 componentPosition이 지정한 mesh의 animation을 업데이트 해주는 함수
     * 업데이트 하려는 대상이 animation에 대한 정보가 설정된 상태( animations 속성이 있을 경우 ) 업데이트 하여 갱신
     *
     * @param {number} instanceId 갱신할 인스턴스 식별자. 현재 구현에서는 사용하지 않습니다.
     * @returns {false} 현재 인스턴스 애니메이션 직접 갱신은 지원하지 않습니다.
     *
     * @ignore
     */
    updateAnimationAt(instanceId) {
        return false;
    }

    /**
     * instanced 객체의 원본 모델의 대해서 전체 순환
     *
     * @param {(object: import('three').Object3D) => void} callback 전체 순환에 실행될 함수
     */
    traverse(callback) {
        const rootObject = this.getOriginalModel();
        if (!defined(rootObject)) return;
        rootObject.traverse(callback);
    }

    /**
     * mesh 타입의 객체를 반환 받을 수 있는 함수
     *
     * @returns {Array<import('three').Object3D>} mesh 타입의 객체들 복사하여 담은 리스트
     */
    exportUMesh() {
        const rootObject = this.getOriginalModel();
        /** @type {Array<import('three').Object3D>} */
        const meshList = [];
        if (!defined(rootObject)) return meshList;
        rootObject.traverse(/** @param {import('three').Object3D} child */function (child) {
            if (child.isMesh) {
                const clone = child.clone();
                child.getWorldPosition(clone.position);
                child.getWorldQuaternion(clone.quaternion);
                child.getWorldScale(clone.scale);
                clone.updateMatrix();
                meshList.push(clone);
            }
        });
        return meshList;
    }

    /**
     * 부모 객체의 matrix 갱신 후 instanceEntity의 matrix를 반영햡니다.
     *
     * @override
     *
     */
    updateMatrix() {
        if (!this.position || !this.quaternion || !this.scale) return;
        if (this.parent) {
            this.setParent(this.parent);
        }
        this.updateInstances(this.position, this.quaternion, this.scale);
    }


    /**
     * 실제 화면에 투영되는 객체의 형상 정보를 리턴하는 함수
     *
     * @returns {{position: import('three').Vector3, rotation: import('three').Euler, scale: import('three').Vector3, properties: { instancedInfo: Array<InstancedTRSInfo> }} | undefined} 투영 위치, 회전, 크기
     */
    getProjectionInfo() {
        if (!this._object || this._object.children.length === 0) return;
        /** @type {Array<InstancedTRSInfo>} */
        const instancedInfo = [];
        let index = 0;
        const group = this.instancedGroup;
        if (!group) return;
        const objectGroup = this._object;
        objectGroup.updateMatrixWorld();

        group.traverse(/** @param {import('three').Object3D} child */ (child) => {
            if (child.isMesh) {
                // 렌더 mesh에 대응하는 proxy child의 world matrix를 찾습니다.
                const matrix = INTERNAL.getMatrixObject(this, child);
                if (matrix) {
                    const position = new THREE.Vector3();
                    const quaternion = new THREE.Quaternion();
                    const rotation = new THREE.Euler();
                    const scale = new THREE.Vector3();
                    matrix.decompose(position, quaternion, scale);
                    rotation.setFromQuaternion(quaternion);
                    /** @type {KeyValue} */
                    const textureInfo = {};
                    const childMesh = /** @type {InstancedRenderableMesh} */(child);
                    if (childMesh.material) {
                        if (Array.isArray(childMesh.material)) {
                            const barrierMaterial = childMesh.getBarrierMaterial?.();
                            for (const material of childMesh.material) {
                                if (barrierMaterial === material) continue;
                                const mat = /** @type {{ map: ({ wrapS: number, wrapT: number, minFilter: number, magFilter: number }|undefined) }} */(material);
                                if (mat.map) {
                                    textureInfo.wrapS = mat.map.wrapS;
                                    textureInfo.wrapT = mat.map.wrapT;
                                    textureInfo.minFilter = mat.map.minFilter;
                                    textureInfo.magFilter = mat.map.magFilter;
                                }
                            }
                        } else {
                            const mat = /** @type {{ map: ({ wrapS: number, wrapT: number, minFilter: number, magFilter: number }|undefined) }} */(childMesh.material);
                            if (mat.map) {
                                textureInfo.wrapS = mat.map.wrapS;
                                textureInfo.wrapT = mat.map.wrapT;
                                textureInfo.minFilter = mat.map.minFilter;
                                textureInfo.magFilter = mat.map.magFilter;
                            }
                        }
                    }

                    instancedInfo[index] = {
                        position,
                        rotation,
                        scale,
                        textureInfo,
                    };
                    index++;
                }
            }
        });

        return {
            position: this.position?.clone() ?? new THREE.Vector3(),
            rotation: this.rotation?.clone() ?? new THREE.Euler(),
            scale: this.scale?.clone() ?? new THREE.Vector3(),
            properties: {
                instancedInfo
            }
        };
    }

}

export {U3dComponentInstancedPosition};
