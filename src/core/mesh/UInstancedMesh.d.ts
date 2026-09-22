// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dObjectCO } from "../U3dObject.js";
import type { InstancedEntity } from "../../lib/instanced_mesh_extention/core/InstancedEntity.js";
import type { InstancedMesh2 } from "../../lib/instanced_mesh_extention/core/InstancedMesh2.js";
import type { UMeta } from "../../meta/UMeta.js";

type OriMatrixInfo_Param = {
    matrix: three.Matrix4;
    position: three.Vector3;
    quaternion: three.Quaternion;
    scale: three.Vector3;
};

/**
 * ~extends import('@U3dObject').U3dObjectCO <br>
 * UInstancedMesh 생성자 옵션입니다.
 */
type UInstancedMeshCO_Content = {
    /**
     * 컴포넌트 타입
     */
    type?: string;
    /**
     * 인스턴스 최대갯수 (용량)
     */
    capacity?: number;
    /**
     * 그림자 생성 여부
     */
    castShadow?: boolean;
    /**
     * 그림자 수신 여부
     */
    receiveShadow?: boolean;
    /**
     * 생성한 레이어의 이름
     */
    layerName?: string;
};

/**
 * ~extends import('@U3dObject').U3dObjectCO <br>
 * UInstancedMesh 생성자 옵션입니다.
 */
type UInstancedMeshCO = Omit<Omit<U3dObjectCO, never> & UInstancedMeshCO_Content, never>;

type InstancedMesh2Type = InstancedMesh2<three.BufferGeometry, three.Material | Array<three.Material>, object>;

/**
 * @memberof UInstancedMesh
 * @inner
 *
 * @typedef {import('three').Material & {
 *  color?: import('three').Color,
 *  _oriColor?: import('three').Color,
 *  _isInstanceMaterial?: boolean
 *  map?:import('three').Texture
 * }} UInstanceMaterial
 */
/**
 * @memberof UInstancedMesh
 * @inner
 *
 *
 * @typedef {object} OriMatrixInfo_Param
 * @property {import('three').Matrix4} matrix
 * @property {import('three').Vector3} position
 * @property {import('three').Quaternion} quaternion
 * @property {import('three').Vector3} scale
 *
 */
/**
 * ~extends import('@U3dObject').U3dObjectCO <br>
 * UInstancedMesh 생성자 옵션입니다.
 *
 * @typedef {object} UInstancedMeshCO_Content
 * @property {string} [type] 컴포넌트 타입
 * @property {number} [capacity] 인스턴스 최대갯수 (용량)
 * @property {boolean} [castShadow] 그림자 생성 여부
 * @property {boolean} [receiveShadow] 그림자 수신 여부
 * @property {string} [layerName] 생성한 레이어의 이름
 *
 *
 * @memberof UInstancedMesh
 * @inner
 *
 * @typedef {Omit<import('@U3dObject').U3dObjectCO, never> & UInstancedMeshCO_Content} UInstancedMeshCO
 */
/**
 * @typedef {import('@InstancedMeshExtension/core/InstancedMesh2').InstancedMesh2<
 *   import('three').BufferGeometry,
 *   import('three').Material | Array<import('three').Material>,
 *   object
 * >} InstancedMesh2Type
 */
/**
 * ~extends import('@InstancedMeshExtension/core/InstancedMesh2.js').InstancedMesh2 <br>
 * 시야 컬링(Frustum Culling), 빠른 레이캐스팅, LOD 등을 지원하는 확장 인스턴스 메시 클래스.
 *
 * @template {import('three').BufferGeometry} TGeometry 지오메트리 타입
 * @template {import('three').Material | Array<import('three').Material>} TMaterial 머티리얼 타입
 * @template {number} instanceLength instancedMesh 용량
 * @template {UInstancedMeshCO} opt instancedMesh2 옵션
 * @extends {InstancedMesh2<TGeometry, TMaterial, UInstancedMeshCO>}
 */
declare class UInstancedMesh<TGeometry extends three.BufferGeometry, TMaterial extends three.Material | Array<three.Material>, instanceLength extends number, opt extends UInstancedMeshCO> extends InstancedMesh2<TGeometry, TMaterial, UInstancedMeshCO> {
    /**
     * 전달받은 mesh의 실제 rendered 상태를 카운트합니다.
     * @param {UInstancedMesh<any, any, number, UInstancedMeshCO>} mesh availabilityArray와 _instancesArrayCount를 가진 InstancedMesh
     * @returns {number} visible && active 슬롯 수
     */
    static countRenderedInstances(mesh: UInstancedMesh<any, any, number, UInstancedMeshCO>): number;
    /**
     * live UInstancedMesh registry를 실제 availabilityArray 기준으로 다시 합산합니다.
     * 증분 setter를 우회한 LOD child 변경이나 외부 직접 수정이 있었을 때 debug 전역 카운터를 보정합니다.
     * @returns {{capacity:number, active:number, visible:number, meshCount:number}} 보정 후 전역 카운터 스냅샷
     */
    static syncGlobalInstanceCounts(): {
        capacity: number;
        active: number;
        visible: number;
        meshCount: number;
    };
    /** @type {number} 전체 인스턴스 개수 합계 */ static ALL_INSTANCES_COUNT: number;
    /** @type {number} 가시화된 인스턴스 개수 합계 */ static VISIBLE_INSTANCES_COUNT: number;
    /** @type {Set<UInstancedMesh<any, any, number, UInstancedMeshCO>>} 가시화된 인스턴스 개수 합계 */ static LIVE_INSTANCED_MESHES: Set<UInstancedMesh<any, any, number, UInstancedMeshCO>>;
    /**
     * @param {TGeometry} geometry 지오메트리
     * @param {TMaterial} material 머티리얼
     * @param {number} instanceLength 인스턴스 개수
     * @param {UInstancedMeshCO} [opt={}] 옵션
     */
    constructor(geometry: TGeometry, material: TMaterial, instanceLength: number, opt?: UInstancedMeshCO);
    /** @type {boolean} */ isUInstancedMesh: boolean;
    /** @type {string|undefined} */ _ulayername: string | undefined;
    /** @type {string} */ _utype: string;
    /** @type {boolean} 레이어가 실제 표시 중이어서 전역 visible 통계에 포함되는지 여부 */ _visibilityEnabled: boolean;
    /** @type {Map<number, number>} */ _opacityMap: Map<number, number>;
    /** @type {Map<number, import('three').Color>} */ _colorMap: Map<number, three.Color>;
    /** @type {Map<number, import('three').Color>} */ _oriColorMap: Map<number, three.Color>;
    /** @type {Map<number, number>} */ _oriOpacityMap: Map<number, number>;
    /** @type {Map<number, import('three').Matrix4>} */ _matrixMap: Map<number, three.Matrix4>;
    /** @type {Map<number, OriMatrixInfo_Param>} */ _oriMatrixMap: Map<number, OriMatrixInfo_Param>;
    /** @type {Set<number>} */ _barrierSet: Set<number>;
    /** @type {Set<number>} */ _overrideColorInstanceIds: Set<number>;
    /** @type {boolean} */ _overrideColorSupportPrepared: boolean;
    /** @type {boolean} */ _overrideColorSupportEnabled: boolean;
    /** @type {boolean} */ _colorAdjustmentSupportEnabled: boolean;
    /** @type {boolean} */ _restoringOpacity: boolean;
    /** @type {string} */ _objectName: string;
    /** @type {string} */ _name: string;
    /** @type {DOMHighResTimeStamp | number} */ _curUpdateDate: DOMHighResTimeStamp | number;
    /** @type {DOMHighResTimeStamp | number} */ _lastUpdateDate: DOMHighResTimeStamp | number;
    /** @type {import('@UMeta').UMeta | null} */ _meta: UMeta | null;
    _useDynamicCapcity: boolean;
    _maxCapacity: number;
    _capacityResizeStats: {
        count: number;
        lastOldCapacity: number;
        lastNewCapacity: number;
        lastStorageBytes: number;
        maxStorageBytes: number;
    };
    /**
     * 현재 mesh의 availabilityArray에서 active와 visible이 모두 true인 인스턴스 수를 계산합니다.
     * @returns {number} 실제 렌더 후보 상태의 인스턴스 수
     */
    getRenderedInstancesCount(): number;
    /**
     * 현재 mesh의 availabilityArray에서 active가 true인 인스턴스 수를 계산합니다.
     * @returns {number} 실제 active 상태의 인스턴스 수
     */
    getActiveInstancesCount(): number;
    /**
     * 현재 mesh의 rendered instance를 전역 visible 통계에 포함할지 설정합니다.
     * availabilityArray는 변경하지 않아 레이어를 다시 표시할 때 기존 LOD visibility를 그대로 복구합니다.
     * @param {boolean} enabled true이면 전역 visible 통계에 포함하고 false이면 제외
     * @returns {this} 메서드 체이닝을 위한 현재 mesh
     */
    setVisibilityEnabled(enabled: boolean): this;
    /**
     * 해당 객체를 생성한 레이어 이름을 설정합니다.
     *
     * @param {string} layerName 레이어 이름
     */
    setLayerName(layerName: string): void;
    /**
     * 해당 객체의 레이어 이름을 반환합니다.
     * @return {string|undefined}
     */
    getLayerName(): string | undefined;
    /**
     * 인스턴스 저장소 capacity를 변경하고 개발용 resize 통계를 갱신합니다.
     *
     * @override
     *
     * @param {number} capacity 변경할 인스턴스 capacity
     * @returns {this} 메서드 체이닝을 위한 현재 mesh
     */
    override resizeBuffers(capacity: number): this;
    /**
     * 인스턴스 버퍼의 동적 capacity 증가 사용 여부를 설정합니다.
     * @param {boolean} value - true이면 필요 시 capacity를 늘리고, false이면 현재 capacity 안에서만 슬롯을 사용합니다.
     * @returns {this} 메서드 체이닝을 위한 현재 메시를 반환합니다.
     */
    setDynamicCapacity(value: boolean): this;
    /**
     * 인스턴스 버퍼의 동적 capacity 증가 사용 여부를 반환합니다.
     * @returns {boolean} 동적 capacity 증가를 사용할 때 true를 반환합니다.
     */
    getDynamicCapacity(): boolean;
    /**
     * 사용자가 모델 baseName별로 지정한 고정 capacity 상한을 설정합니다.
     * @param {number|string|undefined|null} value - 양의 정수이면 고정 상한, 그 외 값이면 상한 해제
     * @returns {this} 메서드 체이닝을 위한 현재 메시를 반환합니다.
     */
    setMaxCapacity(value: number | string | undefined | null): this;
    /**
     * 사용자가 지정한 고정 capacity 상한을 반환합니다.
     * @returns {number|undefined} 고정 상한이 있으면 양의 정수, 동적 모드이면 undefined를 반환합니다.
     */
    getMaxCapacity(): number | undefined;
    /**
     * @ignore
     */
    _prepareOverrideColorSupport(): void;
    /**
     * @ignore
     */
    _enableOverrideColorSupport(): void;
    /**
     * @ignore
     */
    _ensureOverrideColorSupport(): void;
    /**
     * 개별 인스턴스 색상 조정에 필요한 texture와 머티리얼 패치를 활성화합니다.
     *
     * @ignore
     */
    _enableColorAdjustmentSupport(): void;
    /**
     * 본체와 LOD 머티리얼을 다시 컴파일하도록 표시합니다.
     *
     * @ignore
     */
    _setInstanceMaterialsNeedsUpdate(): void;
    /**
     * 루트와 LOD mesh의 프로그램 캐시 키에 인스턴스 표시 효과 활성 상태를 추가합니다.
     * @param {InstancedMesh2Type} mesh 캐시 키를 확장할 mesh
     *
     * @ignore
     */
    _patchInstanceAppearanceCacheKey(mesh: InstancedMesh2Type): void;
    /**
     * 인스턴스 표시 효과가 공유하는 uniform texture를 최초 사용 시 생성합니다.
     * 색상 조정값은 0으로 초기화되는 texture에서 원본 상태가 되도록 1과의 차이를 저장합니다.
     *
     * @ignore
     */
    _ensureInstanceAppearanceUniforms(): void;
    /**
     * 인스턴스 ID가 현재 mesh capacity 범위에 포함되는지 확인합니다.
     * @param {number} instanceId 확인할 인스턴스 ID
     * @returns {boolean} 유효한 인스턴스 ID이면 true
     *
     * @ignore
     */
    _isValidInstanceId(instanceId: number): boolean;
    /**
     * 개별 인스턴스의 색상 조정값을 설정합니다.
     * @param {number} instanceId 인스턴스 ID
     * @param {string} uniformName uniform 이름
     * @param {number} value 설정값
     * @returns {InstancedMesh2Type} 메서드 체이닝을 위한 현재 mesh
     *
     * @ignore
     */
    _setColorAdjustmentAt(instanceId: number, uniformName: string, value: number): InstancedMesh2Type;
    /**
     * 개별 인스턴스의 색상 조정값을 반환합니다.
     * @param {number} instanceId 인스턴스 ID
     * @param {string} uniformName uniform 이름
     * @returns {number} 색상 조정값이며 유효하지 않은 ID이면 NaN
     *
     * @ignore
     */
    _getColorAdjustmentAt(instanceId: number, uniformName: string): number;
    /**
     * 개별 인스턴스의 밝기를 설정합니다.
     * @param {number} instanceId 인스턴스 ID
     * @param {number} value 밝기값
     * @returns {InstancedMesh2Type} 메서드 체이닝을 위한 현재 mesh
     */
    setBrightnessAt(instanceId: number, value: number): InstancedMesh2Type;
    /**
     * 개별 인스턴스의 밝기를 반환합니다.
     * @param {number} instanceId 인스턴스 ID
     * @returns {number} 밝기값이며 유효하지 않은 ID이면 NaN
     */
    getBrightnessAt(instanceId: number): number;
    /**
     * 개별 인스턴스의 대비를 설정합니다.
     * @param {number} instanceId 인스턴스 ID
     * @param {number} value 대비값
     * @returns {InstancedMesh2Type} 메서드 체이닝을 위한 현재 mesh
     */
    setContrastAt(instanceId: number, value: number): InstancedMesh2Type;
    /**
     * 개별 인스턴스의 대비를 반환합니다.
     * @param {number} instanceId 인스턴스 ID
     * @returns {number} 대비값이며 유효하지 않은 ID이면 NaN
     */
    getContrastAt(instanceId: number): number;
    /**
     * 개별 인스턴스의 채도를 설정합니다.
     * @param {number} instanceId 인스턴스 ID
     * @param {number} value 채도값
     * @returns {InstancedMesh2Type} 메서드 체이닝을 위한 현재 mesh
     */
    setSaturationAt(instanceId: number, value: number): InstancedMesh2Type;
    /**
     * 개별 인스턴스의 채도를 반환합니다.
     * @param {number} instanceId 인스턴스 ID
     * @returns {number} 채도값이며 유효하지 않은 ID이면 NaN
     */
    getSaturationAt(instanceId: number): number;
    /**
     * 개별 인스턴스의 밝기·대비·채도를 원본 상태로 초기화합니다.
     * @param {number} instanceId 인스턴스 ID
     * @returns {InstancedMesh2Type} 메서드 체이닝을 위한 현재 mesh
     */
    resetColorAdjustmentAt(instanceId: number): InstancedMesh2Type;
    /**
     * 인스턴스 슬롯을 할당하기 전에 이전 feature의 색상 조정값을 초기화합니다.
     *
     * @param {number} id 인스턴스 ID
     * @param {function(import('@InstancedMeshExtension/core/InstancedEntity').InstancedEntity, number): void} [onCreation] 인스턴스 생성 콜백
     * @returns {InstancedMesh2Type} 메서드 체이닝을 위한 현재 mesh
     */
    addInstance(id: number, onCreation?: (arg0: InstancedEntity, arg1: number) => void): InstancedMesh2Type;
    /**
     * 인스턴스 슬롯을 반환할 때 feature별 색상 조정값을 초기화합니다.
     *
     * @param {...number} ids 제거할 인스턴스 ID 목록
     * @returns {InstancedMesh2Type} 메서드 체이닝을 위한 현재 mesh
     */
    removeInstances(...ids: number[]): InstancedMesh2Type;
    /**
     * LOD를 추가하고 활성화된 인스턴스 표시 효과를 새 머티리얼에도 연결합니다.
     *
     * @param {import('three').BufferGeometry} geometry LOD geometry
     * @param {import('three').Material | Array<import('three').Material>} material LOD 머티리얼
     * @param {number} [distance=0] LOD 전환 거리
     * @param {number} [hysteresis=0] LOD 전환 hysteresis
     * @returns {InstancedMesh2Type} 메서드 체이닝을 위한 현재 mesh
     */
    addLOD(geometry: three.BufferGeometry, material: three.Material | Array<three.Material>, distance?: number, hysteresis?: number): InstancedMesh2Type;
    /**
     * @ignore
     */
    _patchMaterialsForOverrideColor(): boolean;
    /**
     * 인스턴스 행렬을 빠르게 설정 (BVH 이동 및 저밀도 위치 업데이트 포함)
     * @param {number} id 인스턴스 인덱스
     * @param {import('three').Matrix4} matrix 변환 행렬
     */
    setMatrixAtFast(id: number, matrix: three.Matrix4): void;
    /**
     * 스켈레톤 초기화 및 데이터 바인딩
     *
     * @override
     *
     * @param {import('three').SkinnedMesh} object 대상 스킨드 메시 객체
     * @param {boolean} [disableMatrixAutoUpdate] 행렬 자동 업데이트 비활성화 여부
     */
    override initSkeleton(object: three.SkinnedMesh, disableMatrixAutoUpdate?: boolean): void;
    /**
     * U3dSelect의 선택 타입이 outline 일 경우에 필요한 attribute를 생성
     * 선택 된 index를 저장하는 attribute 생성
     */
    createBarrierAttribute(): void;
    /**
     * instanceBarrier attribute 반환
     * @return {import('three').InstancedBufferAttribute | undefined} instanceBarrier attribute 반환
     */
    getBarrierAttribute(): three.InstancedBufferAttribute | undefined;
    /**
     * U3dSelect의 선택 타입이 outline 일 경우에 필요한 matrix attribute를 생성 및 준비
     */
    createInstancedMatrixAttribute(): void;
    /**
     * instanceBarrierMatrix attribute 반환
     * @return {import('three').InstancedBufferAttribute | undefined} attribute 반환
     */
    getInstancedMatrixAttribute(): three.InstancedBufferAttribute | undefined;
    /**
     * U3dSelect의 선택 타입이 outline 일 경우에 barrierInstance를 추가하는 함수
     * @param {number} idx 선택 객체 idx 번호
     * @param {boolean} [setAttribute = true] attribute 생성 여부 / 후처리로 생성시에는 불필요
     */
    addBarrierInstance(idx: number, setAttribute?: boolean): void;
    /**
     * barrier material 생성시 해당 idx에 matrix를 업데이트 해주는 함수
     * shader에서 matrix를 받아서 idx 마다 그리기 때문에 업데이트 필요
     * @param {number} idx 인스턴스 인덱스
     */
    setBarrierMatrix(idx: number): void;
    /**
     * U3dSelect의 선택 타입이 outline 일 경우에 barrierInstance를 제거하는 함수
     * @param {number} idx 제거 할 대상 idx
     * @param {boolean} [setAttribute=true] attribute 제거 여부 / 후처리 효과로 생성 시에 비생성
     */
    removeBarrierInstance(idx: number, setAttribute?: boolean): void;
    /**
     * U3dSelect의 선택 타입이 outline 일 경우에 생성된 material을 instanced Mesh 객체에 반영하는 함수
     * @param {import('three').Material} material outline Effect shader Material
     */
    setBarrierMaterial(material: three.Material): void;
    /**
     * U3dSelect의 선택 타입이 outline 일 경우에 생성된 material을 제거하는 함수
     */
    removeBarrierMaterial(): void;
    /**
     * U3dSelect의 선택 타입이 outline 일 경우에 생성된 material 반환 함수
     * @return {import('three').Material} outline effect material
     */
    getBarrierMaterial(): three.Material;
    /**
     * U3dSelect의 선택 타입이 outline 일 경우에 barrierInstance를 반환하는 함수
     * @return {Array<number>} 선택된 대상의 idx 목록 반환
     */
    getBarrierInstances(): Array<number>;
    /**
     * 해당 index의 외곽선 반환
     * @param {number} idx 인스턴스 인덱스
     * @return {import('three').Object3D | undefined} 외곽선 객체를 반환
     */
    getEdgeLine(idx: number): three.Object3D | undefined;
    /**
     * 여러 인스턴스의 Z축 위치를 일괄 업데이트합니다.
     * @param {Set<number>} [updateList = new Set()] - 업데이트할 인스턴스 ID 배열
     * @param {Map<number, number>} updates - 인스턴스 ID를 키로, 새로운 Z값을 값으로 하는 Map
     */
    batchUpdateHeight(updateList?: Set<number>, updates?: Map<number, number>): void;
    /**
     * 전체 색상 변경 (복구시 restoreColorAll)
     * @param {import('three').Color | string | number} color 설정할 색상
     */
    setColorAll(color: three.Color | string | number): void;
    /**
     * setColorAll을 호출하여 적용된 전체 색상 복구
     */
    restoreColorAll(): void;
    /**
     * 전체 스케일 설정
     * @param {import('three').Vector3} [scaleVector = new THREE.Vector3(1,1,1)] 스케일 벡터
     */
    setScaleAll(scaleVector?: three.Vector3): void;
    /**
     * 특정 인덱스 목록의 스케일 설정
     * @param {Array<number>} indexList 인스턴스 인덱스 목록
     * @param {import('three').Vector3 | number | {x:number, y:number, z:number}} [scaleVector = new THREE.Vector3(1, 1, 1)] 스케일 값
     */
    setScaleList(indexList: Array<number>, scaleVector?: three.Vector3 | number | {
        x: number;
        y: number;
        z: number;
    }): void;
    /**
     * 지정된 인덱스 목록에 포함된 인스턴스들의 가시성을 일괄적으로 설정합니다.
     * @param {Array<number>} indexList - 가시성을 변경할 인스턴스의 인덱스 배열.
     * @param {boolean} visible - 설정할 가시성 상태 (true: 보임, false: 숨김).
     */
    setVisibleList(indexList: Array<number>, visible: boolean): void;
    /**
     * 컴포넌트 타입 반환
     * @returns {string} 컴포넌트 타입
     */
    getUType(): string;
    /**
     * 컴포넌트 타입 설정
     * @param {string} type 컴포넌트 타입
     */
    setUType(type: string): void;
    /**
     * 컴포넌트 고유 ID 반환
     * @returns {string|number} ID
     */
    getUid(): string | number;
    /**
     * 특정 인스턴스의 가시성 설정 (배리어 동기화 포함)
     * @param {number} instanceIdx 인스턴스 인덱스
     * @param {boolean} visible 가시성 여부
     */
    setVisible(instanceIdx: number, visible: boolean): void;
    /**
     * 특정 인스턴스 선택 (색상/투명도 변경 및 텍스처 제외 옵션)
     * @param {number} instanceId 인스턴스 인덱스
     * @param {import('three').Color | string | number} color 선택 색상
     * @param {number} [opacity=1] 투명도
     * @param {boolean | object} [opt] 텍스처 제외 옵션 등
     */
    pickMaterial(instanceId: number, color: three.Color | string | number, opacity?: number, opt?: boolean | object): void;
    /**
     * 인스턴스 목록 일괄 선택
     * @param {Array<number>} indexList 인스턴스 인덱스 목록
     * @param {import('three').Color | string | number} color 선택 색상
     * @param {number} [opacity=1] 투명도
     * @param {boolean | object} [opt] 옵션
     */
    pickMaterialList(indexList: Array<number>, color: three.Color | string | number, opacity?: number, opt?: boolean | object): void;
    /**
     * 인스턴스 머티리얼 상태(색상/투명도) 복구 (pickMaterial로 색상 지정시 복구용)
     * @param {number} [instanceId] 특정 인스턴스 인덱스 (미지정 시 전체 복구)
     */
    restoreMaterial(instanceId?: number): void;
    /**
     * 특정 인덱스의 컴포넌트 이름 반환
     * @param {number} idx 인스턴스 인덱스
     * @returns {string} 컴포넌트 이름
     */
    getComponentNameAt(idx: number): string;
}

export type { InstancedMesh2Type, OriMatrixInfo_Param, UInstancedMesh, UInstancedMeshCO, UInstancedMeshCO_Content };
