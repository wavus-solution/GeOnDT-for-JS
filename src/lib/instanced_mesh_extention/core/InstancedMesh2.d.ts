// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { InstancedEntity } from "./InstancedEntity.js";
import type { InstancedMeshBVH } from "./InstancedMeshBVH.js";
import type { GLInstancedBufferAttribute } from "./utils/GLInstancedBufferAttribute.js";
import type { SquareDataTexture } from "./utils/SquareDataTexture.js";

/**
 * @template {import('@InstancedMeshExtension/core/InstancedEntity').InstancedEntity} InstancedEntity 인스턴스 엔티티 타입
 * @template {import('@InstancedMeshExtension/core/utils/GLInstancedBufferAttribute').GLInstancedBufferAttribute} GLInstancedBufferAttribute GL 인스턴스 버퍼 속성 타입
 * @template {import('@InstancedMeshExtension/core/utils/SquareDataTexture').SquareDataTexture} SquareDataTexture instancedMesh2 데이터 텍스처 타입
 */
/**
 * 시야 컬링(Frustum Culling), 빠른 레이캐스팅, LOD 등을 지원하는 확장 인스턴스 메시 클래스.
 * @template {import('three').BufferGeometry} TGeometry 지오메트리 타입
 * @template {import('three').Material | Array<import('three').Material>} TMaterial 머티리얼 타입
 * @template {object} params 이벤트 맵 타입

 * ~extends import('three').Mesh <br>
 * @extends {Mesh<TGeometry>}
 */
declare class InstancedMesh2<TGeometry extends three.BufferGeometry, TMaterial extends three.Material | Array<three.Material>, params extends unknown> extends Mesh<TGeometry, three.Material<three.MaterialEventMap> | three.Material<three.MaterialEventMap>[], three.Object3DEventMap> {
    /**
     * 기존 Mesh로부터 InstancedMesh2 인스턴스 생성
     * @param {import('three').Mesh | import('three').SkinnedMesh} mesh 원본 메시
     * @param {any} [params={}] 설정 파라미터
     * @returns {InstancedMesh2} 생성된 인스턴스
     */
    static createFrom(mesh: three.Mesh | three.SkinnedMesh, params?: any): InstancedMesh2<any, any, any>;
    /**
     * @param {TGeometry} geometry 지오메트리
     * @param {TMaterial} material 머티리얼
     * @param {object} [params={}] 설정 파라미터
     * @param {object} [LOD] LOD 정보
     */
    constructor(geometry: TGeometry, material: TMaterial, params?: object, LOD?: object);
    /** @type {boolean} 해제 상태는 이 클래스에서 설정하며 하위 클래스와 함께 사용합니다. */
    _disposed: boolean;
    /** @type {number} 인스턴스 버퍼의 최대 용량 */ _capacity: number;
    /** @type {number} 지난 프레임에서 렌더링된 인스턴스 수 */ _count: number;
    /** @type {number} 활성화된 인스턴스 수 */ _instancesCount: number;
    /** @type {boolean} 개별 객체 단위 시야 컬링 사용 여부 */ _perObjectFrustumCulled: boolean;
    /** @type {boolean} 렌더링 전 정렬 여부 */ _sortObjects: boolean;
    /** @type {boolean} 인덱스 배열 업데이트 필요 여부 */ _indexArrayNeedsUpdate: boolean;
    /** @type {boolean} High/Low 정밀도 위치 사용 여부 */ _useHighLowPosition: boolean;
    /** @type {boolean} 투명도 사용 여부 */ _useOpacity: boolean;
    /** @type {Array<InstancedEntity> | null} 인스턴스 엔티티 배열 */ instances: Array<InstancedEntity> | null;
    /** @type {GLInstancedBufferAttribute | null} 렌더링 인덱스 속성 */ instanceIndex: GLInstancedBufferAttribute | null;
    /** @type {SquareDataTexture | null} 색상 데이터 텍스처 */ colorsTexture: SquareDataTexture | null;
    /** @type {SquareDataTexture | null} Low 정밀도 위치 데이터 텍스처 */ positionsLowTexture: SquareDataTexture | null;
    /** @type {SquareDataTexture | null} 모핑 타겟 데이터 텍스처 */ morphTexture: SquareDataTexture | null;
    /** @type {SquareDataTexture | null} 본(Bone) 데이터 텍스처 */ boneTexture: SquareDataTexture | null;
    /** @type {SquareDataTexture | null} 사용자 정의 Uniform 데이터 텍스처 */ uniformsTexture: SquareDataTexture | null;
    /** @type {SquareDataTexture | null} 인스턴스 행렬 데이터 텍스처 */ matricesTexture: SquareDataTexture | null;
    /** @type {import('three').Box3 | null} 모든 인스턴스를 포함하는 경계 박스 */ boundingBox: three.Box3 | null;
    /** @type {import('three').Sphere | null} 모든 인스턴스를 포함하는 경계 구 */ boundingSphere: three.Sphere | null;
    /** @type {import('@InstancedMeshExtension/core/InstancedMeshBVH').InstancedMeshBVH | null} 가속 구조(BVH) */ bvh: InstancedMeshBVH | null;
    /** @type {Function | null} 커스텀 정렬 함수 */ customSort: Function | null;
    /** @type {boolean | null} 시야 내에 있는 인스턴스만 레이캐스팅할지 여부 */ raycastOnlyFrustum: boolean | null;
    /**
     * Lod 생성 Level 정보 객체
     * @memberof InstancedMesh2
     * @inner
     *
     * @typedef {object} InstancedMeshLodInfoLevels_Content
     * @property {number} distance 해당 레벨 전환 거리 임계값
     * @property {number} hysteresis 거리 대비 오차 범위를 결정하는 비율입니다. (예: 0.1은 10% 지연)
     * @property {import('@InstancedMeshExtension/core/InstancedMesh2').InstancedMesh2<import('three').BufferGeometry, import('three').Material | Array<import('three').Material>, object>} object 레벨 전환 대상
     */
    /**
     * Lod 생성 Render 정보 객체
     * @memberof InstancedMesh2
     * @inner
     *
     * @typedef {object} InstancedMeshLodInfoRender_Content
     * @property {Array<number>} count 각 레벨에 가시화 되고 있는 객체 수 목록
     * @property {Array<number>} levelThresholds 레벨 전환 거리 임계값 목록
     * @property {Array<InstancedMeshLodInfoLevels_Content>} levels
     */
    /**
     * Lod 생성 정보 객체
     * @memberof InstancedMesh2
     * @inner
     *
     * @typedef {object} InstancedMeshLodInfo_Content
     * @property {InstancedMeshLodInfoRender_Content} render 렌더의 LOD 전환 정보
     * @property {object} shadowRender 그림자 렌더의 LOD 전환 정보
     * @property {Array<import('@InstancedMeshExtension/core/InstancedMesh2').InstancedMesh2<import('three').BufferGeometry, import('three').Material | Array<import('three').Material>, object>>} objects LOD 전환 대상 목록
     */
    /** @type {InstancedMeshLodInfo_Content | null} LOD 관리 정보 */ LODinfo: {
        /**
         * 렌더의 LOD 전환 정보
         */
        render: {
            /**
             * 각 레벨에 가시화 되고 있는 객체 수 목록
             */
            count: Array<number>;
            /**
             * 레벨 전환 거리 임계값 목록
             */
            levelThresholds: Array<number>;
            levels: Array<{
                /**
                 * 해당 레벨 전환 거리 임계값
                 */
                distance: number;
                /**
                 * 거리 대비 오차 범위를 결정하는 비율입니다. (예: 0.1은 10% 지연)
                 */
                hysteresis: number;
                /**
                 * 레벨 전환 대상
                 */
                object: InstancedMesh2<three.BufferGeometry, three.Material | Array<three.Material>, object>;
            }>;
        };
        /**
         * 그림자 렌더의 LOD 전환 정보
         */
        shadowRender: object;
        /**
         * LOD 전환 대상 목록
         */
        objects: Array<InstancedMesh2<three.BufferGeometry, three.Material | Array<three.Material>, object>>;
    } | null;
    /** @type {boolean} 렌더링 전 자동 업데이트(컬링 등) 여부 */ autoUpdate: boolean;
    /** @type {import('three').Skeleton | null} 스켈레톤 정보 */ skeleton: three.Skeleton | null;
    /** @type {import('three').Matrix4 | null} 바인드 행렬 */ bindMatrix: three.Matrix4 | null;
    /** @type {import('three').Matrix4 | null} 바인드 역행렬 */ bindMatrixInverse: three.Matrix4 | null;
    /** @type {string} 바인드 모드 (Attached/Detached) */ bindMode: string;
    /** @type {Function | null} 시야 진입 시 콜백 */ onFrustumEnter: Function | null;
    /**
     * 인스턴스 버퍼의 최대 용량
     * @returns {number}
     */
    get capacity(): number;
    /**
     * 렌더링 대상 인스턴스 수 반환
     * @return {number}
     */
    getCount(): number;
    /**
     * 렌더링 대상 인스턴스 수 설정
     * @param {number} count
     */
    setCount(count: number): void;
    /**
     * 활성화된 인스턴스 수
     * @returns {number}
     */
    get instancesCount(): number;
    set perObjectFrustumCulled(value: boolean);
    /**
     * 개별 객체 단위 시야 컬링 활성화 여부
     * @returns {boolean}
     */
    get perObjectFrustumCulled(): boolean;
    /**
     * 인스턴싱 관련 Uniform 업데이트 (내부용)
     * @param {import('three').WebGLRenderer} renderer
     * @param {import('three').Material} material
     * @ignore
     */
    _updateInstancingUniforms(renderer: three.WebGLRenderer, material: three.Material): void;
    set sortObjects(value: boolean);
    /**
     * 렌더링 전 객체 정렬 여부
     * @returns {boolean}
     */
    get sortObjects(): boolean;
    /**
     * 깊이 정렬 활성화 설정
     * @param {boolean} [enabled=true] 활성화 여부
     * @param {boolean} [useRadix=true] Radix 정렬 사용 여부
     */
    setDepthSort(enabled?: boolean, useRadix?: boolean): void;
    _geometry: TGeometry;
    /**
     * @defaultValue `InstancedMesh2`
     */
    type: string;
    /**
     * Indicates if this is an `InstancedMesh2`.
     */
    isInstancedMesh2: boolean;
    /** @internal */ _renderer: any;
    /** @internal */ _instancesArrayCount: number;
    _setShadow: boolean;
    _currentMaterial: three.Material<three.MaterialEventMap>;
    _customProgramCacheKeyBase: () => string;
    _onBeforeCompileBase: (parameters: three.WebGLProgramParametersWithUniforms, renderer: three.WebGLRenderer) => void;
    _properties: WeakMap<object, any>;
    _textureUpdateFrameMap: WeakMap<object, any>;
    _freeIds: any[];
    /** @internal */ isInstancedMesh: boolean;
    /** @internal */ instanceMatrix: InstancedBufferAttribute;
    /** @internal */ instanceColor: any;
    _customProgramCacheKey: () => string;
    _onBeforeCompile: (shader: any, renderer: any) => void;
    _parentLOD: any;
    material: any;
    _allowsEuler: any;
    _tempInstance: InstancedEntity;
    availabilityArray: any;
    _createEntities: any;
    /**
     * 마지막 렌더링 정보 초기화 (LOD 부모가 없을 경우에만 수행)
     */
    initLastRenderInfo(): void;
    _lastRenderInfo: {
        frame: number;
        camera: any;
        shadowCamera: any;
        cullingRevision: number;
    };
    /**
     * 자동 업데이트 여부 설정
     * @param {boolean} val
     */
    setAutoUpdate(val: boolean): void;
    /**
     * 렌더링 전 업데이트 초기화 및 시야 컬링 수행
     * @param {import('three').WebGLRenderer} renderer
     * @param {import('three').Material} material
     * @param {import('three').Camera} camera
     * @param {boolean} [isForce=false] 강제 업데이트 여부
     */
    initUpdate(renderer: three.WebGLRenderer, material: three.Material, camera: three.Camera, isForce?: boolean): void;
    /**
     * 쉐도우 맵 렌더링 전 호출되는 콜백
     *
     * @override
     *
     */
    override onBeforeShadow(renderer: any, scene: any, camera: any, shadowCamera: any, geometry: any, depthMaterial: any, group: any): void;
    /**
     * 일반 렌더링 전 호출되는 콜백
     *
     * @override
     *
     */
    override onBeforeRender(renderer: any, scene: any, camera: any, geometry: any, material: any, group: any): void;
    /**
     * 쉐도우 맵 렌더링 후 호출되는 콜백
     *
     * @override
     *
     */
    override onAfterShadow(renderer: any, scene: any, camera: any, shadowCamera: any, geometry: any, depthMaterial: any, group: any): void;
    /**
     * 일반 렌더링 후 호출되는 콜백
     *
     * @override
     *
     */
    override onAfterRender(renderer: any, scene: any, camera: any, geometry: any, material: any, group: any): void;
    /**
     * 데이터 텍스처를 GPU에 업로드합니다.
     * @param {import('three').WebGLRenderer} renderer - texture 업로드와 상태 캐시에 사용할 렌더러
     * @param {import('three').Material} material - texture uniform slot을 확인할 material
     * @returns {void}
     */
    updateTextures(renderer: three.WebGLRenderer, material: three.Material): void;
    /**
     * GPU 프로그램에 텍스처 바인딩
     * @param {import('three').WebGLRenderer} renderer
     * @param {import('three').Material} material
     */
    bindTextures(renderer: three.WebGLRenderer, material: three.Material): void;
    /**
     * 머티리얼 변종(Variant) 설정
     * @param {number} variant 변종 타입 (InstancedMesh2MaterialVariant)
     */
    setMaterialVariant(variant: number): void;
    /**
     * 이 인스턴스 메시의 재질에 환경맵 비활성화 여부를 설정합니다.
     * 재질의 envMap과 장면의 environment 참조는 유지하고, 다음 컴파일부터 환경맵 계산을 제어합니다.
     * 같은 재질을 사용하는 다른 인스턴스 메시에도 이 설정이 적용됩니다.
     *
     * @param {boolean} disable 비활성화 여부
     */
    setDisableEnvMap(disable: boolean): void;
    /**
     * 특정 머티리얼 인덱스가 첫 번째 가시화 그룹인지 확인
     * @param {number} materialIndex
     * @returns {boolean}
     */
    isFirstGroup(materialIndex: number): boolean;
    /**
     * 특정 머티리얼 인덱스가 마지막 가시화 그룹인지 확인
     * @param {number} materialIndex
     * @returns {boolean}
     */
    isLastGroup(materialIndex: number): boolean;
    /**
     * 인덱스 속성 초기화
     */
    initIndexAttribute(): void;
    /**
     * 행렬 텍스처 초기화
     */
    initMatricesTexture(): void;
    /**
     * Low 정밀도 위치 텍스처 초기화
     */
    initPositionsLowTexture(): void;
    /**
     * 색상 텍스처 초기화
     */
    initColorsTexture(): void;
    /**
     * 모든 머티리얼에 업데이트 필요 플래그 설정
     */
    materialsNeedsUpdate(): void;
    /**
     * 특정 인스턴스의 Low 정밀도 위치 업데이트 (내부용)
     * @param {number} id 인스턴스 인덱스
     * @param {number} x 위치 좌표 X (world)
     * @param {number} y 위치 좌표 Y (world)
     * @param {number} z 위치 좌표 Z (world)
     *
     * @ignore
     */
    _updatePositionLowAt(id: number, x: number, y: number, z: number): void;
    /**
     * 특정 인스턴스의 Low 정밀도 Z 위치 업데이트 (내부용)
     * @param {number} id 인스턴스 인덱스
     * @param {number} z
     *
     * @ignore
     */
    _updatePositionLowZAt(id: number, z: number): void;
    /**
     * 카메라의 Low 정밀도 위치 업데이트 (내부용)
     *
     * @ignore
     */
    _updateCameraPositionLow(renderer: any, camera: any, material: any): void;
    /**
     * 최적화된 High/Low 정밀도 Uniform 업데이트 (내부용)
     *
     * @ignore
     */
    _updateHighLowOptimizedUniforms(renderer: any, camera: any, material: any): void;
    /**
     * 머티리얼의 변종 타입 반환 (내부용)
     *
     * @ignore
     */
    _getMaterialVariant(material: any): number;
    /**
     * 머티리얼에 적용할 기능 플래그 생성 (내부용)
     *
     * @ignore
     */
    _getFeatureFlagsForMaterial(material: any): {
        variant: number;
        instancing: boolean;
        highLow: boolean;
        uniforms: boolean;
        colors: boolean;
        skinning: boolean;
        bindSpaceSkinning: boolean;
        envMapFix: boolean;
        disableEnvMap: boolean;
        cacheKey: string;
    };
    /**
     * 최적화된 쉐이더 컴파일 전처리 (내부용)
     *
     * @ignore
     */
    _onBeforeCompileOptimized(shader: any, renderer: any): void;
    /**
     * 모델의 Low 정밀도 위치 업데이트 (내부용)
     *
     * @ignore
     */
    _updateModelPositionLow(renderer: any, material: any): void;
    /**
     * 지오메트리 패치 (내부용)
     * @param {TGeometry} geometry
     *
     * @ignore
     */
    patchGeometry(geometry: TGeometry): void;
    /**
     * 인스턴스 렌더링에 필요한 재질 콜백과 uniform을 연결합니다.
     *
     * @param {import('three').WebGLRenderer} renderer
     * @param {import('three').Material} material
     *
     * @ignore
     */
    patchMaterial(renderer: three.WebGLRenderer, material: three.Material): void;
    /**
     * 머티리얼 패치 해제 (내부용)
     * @param {import('three').WebGLRenderer} renderer
     * @param {import('three').Material} material
     *
     * @ignore
     */
    unpatchMaterial(renderer: three.WebGLRenderer, material: three.Material): void;
    /**
     * Creates and computes the BVH (Bounding Volume Hierarchy) for the instances.
     * It's recommended to create it when all the instance matrices have been assigned.
     * Once created it will be updated automatically.
     * @param {any} [config={}] Optional configuration parameters object. See `BVHParams` for details.
     */
    computeBVH(config?: any): void;
    /**
     * Disposes of the BVH structure.
     */
    disposeBVH(): void;
    /**
     * Sets the local transformation matrix for a specific instance.
     * @param {number} id The index of the instance.
     * @param {import('three').Matrix4} matrix A `Matrix4` representing the local transformation to apply to the instance.
     */
    setMatrixAt(id: number, matrix: three.Matrix4): void;
    /**
     * 여러 인스턴스의 변환 행렬을 한 번에 설정합니다.
     * @param {number[]} instanceIds - 업데이트할 인스턴스 ID 배열
     * @param {import('three').Matrix4[]} matrices - 설정할 변환 행렬 배열
     */
    setMatricesAt(instanceIds: number[], matrices: three.Matrix4[]): void;
    /**
     * Gets the local transformation matrix of a specific instance.
     * @param {number} id The index of the instance.
     * @param {import('three').Matrix4} [matrix=_tempMat4] Optional `Matrix4` to store the result.
     * @returns {import('three').Matrix4} The transformation matrix of the instance.
     */
    getMatrixAt(id: number, matrix?: three.Matrix4): three.Matrix4;
    /**
     * Retrieves the position of a specific instance.
     * @param {number} index The index of the instance.
     * @param {import('three').Vector3} [target=_position] Optional `Vector3` to store the result.
     * @returns {import('three').Vector3} The position of the instance as a `Vector3`.
     */
    getPositionAt(index: number, target?: three.Vector3): three.Vector3;
    /** @internal */
    getPositionAndMaxScaleOnAxisAt(index: any, position: any): number;
    /** @internal */
    applyMatrixAtToSphere(index: any, sphere: any, center: any, radius: any): void;
    /**
     * 지정한 인스턴스의 가시성을 변경하고 컬링 index 및 캐시를 무효화합니다.
     * @param {number} id 상태를 변경할 인스턴스 ID
     * @param {boolean} visible 적용할 가시성 상태
     */
    setVisibilityAt(id: number, visible: boolean): void;
    /**
     * Gets the visibility of a specific instance.
     * @param {number} id The index of the instance.
     * @returns {boolean} Whether the instance is visible.
     */
    getVisibilityAt(id: number): boolean;
    /**
     * Sets the availability of a specific instance.
     * @param {number} id The index of the instance.
     * @param {boolean} active Whether the instance is active (not deleted).
     */
    setActiveAt(id: number, active: boolean): void;
    /**
     * Gets the availability of a specific instance.
     * @param {number} id The index of the instance.
     * @returns {boolean} Whether the instance is active (not deleted).
     */
    getActiveAt(id: number): boolean;
    /**
     * Indicates if a specific instance is visible and active.
     * @param {number} id The index of the instance.
     * @returns {boolean} Whether the instance is visible and active.
     */
    getActiveAndVisibilityAt(id: number): boolean;
    /**
     * 지정한 인스턴스의 가시성과 활성 상태를 함께 변경합니다.
     * 가시성만 바뀌는 경우에는 활성 인스턴스 수를 변경하지 않습니다.
     * @param {number} id - 상태를 변경할 인스턴스 ID입니다.
     * @param {boolean} value - 가시성과 활성 상태에 적용할 값입니다.
     */
    setActiveAndVisibilityAt(id: number, value: boolean): void;
    /**
     * Sets the color of a specific instance.
     * @param {number} id The index of the instance.
     * @param {import('three').Color} color The color to assign to the instance.
     */
    setColorAt(id: number, color: three.Color): void;
    /**
     * Gets the color of a specific instance.
     * @param {number} id The index of the instance.
     * @param {import('three').Color} [color=_tempCol] Optional `Color` to store the result.
     * @returns {import('three').Color} The color of the instance.
     */
    getColorAt(id: number, color?: three.Color): three.Color;
    /**
     * Sets the opacity of a specific instance.
     * @param {number} id The index of the instance.
     * @param {number} value The opacity value to assign.
     */
    setOpacityAt(id: number, value: number): void;
    /**
     * Gets the opacity of a specific instance.
     * @param {number} id The index of the instance.
     * @returns {number} The opacity of the instance.
     */
    getOpacityAt(id: number): number;
    /**
     * Copies `position`, `quaternion`, and `scale` of a specific instance to the specified target `Object3D`.
     * @param {number} id The index of the instance.
     * @param {import('three').Object3D} target The `Object3D` where to copy transformation data.
     */
    copyTo(id: number, target: three.Object3D): void;
    /**
     * Computes the bounding box that encloses all instances, and updates the `boundingBox` attribute.
     */
    computeBoundingBox(): void;
    /**
     * Computes the bounding sphere that encloses all instances, and updates the `boundingSphere` attribute.
     */
    computeBoundingSphere(): void;
    /**
     * 인스턴스 메시를 같은 용량·렌더러 설정으로 복제합니다. <br>
     * 호출한 객체와 같은 클래스의 새 인스턴스를 만들어 `copy`로 상태를 옮깁니다.
     *
     * @override
     *
     * @param {boolean} [recursive] 자식 객체까지 복제할지 여부
     * @returns {this} 복제된 새 인스턴스 메시
     */
    override clone(recursive?: boolean): this;
    /**
     * @param {InstancedMesh2} source
     * @param {boolean} [recursive]
     * @returns {this}
     */
    copy(source: InstancedMesh2<any, any, any>, recursive?: boolean): this;
    /**
     * @param {any} schema
     * @ignore
     */
    initUniformsPerInstance(schema: any): void;
    /**
     * @param object
     * @param disableMatrixAutoUpdate
     */
    initSkeleton(object: any, disableMatrixAutoUpdate: any): void;
    /**
     * @param object
     */
    bindData(object: any): void;
    /**
     * @param {number} id
     * @param {string} name
     * @param {any} value
     * @ignore
     */
    setUniformAt(id: number, name: string, value: any): void;
    /**
     * @param {number} id
     * @param {string} name
     * @param {any} [target]
     * @returns {any}
     * @ignore
     */
    getUniformAt(id: number, name: string, target?: any): any;
    /**
     * @param {import('three').WebGLRenderer} renderer
     * @param {import('three').Camera} camera
     * @param {import('three').Camera} cameraLOD
     * @param {boolean} isBeforeRender
     * @ignore
     */
    performFrustumCulling(renderer: three.WebGLRenderer, camera: three.Camera, cameraLOD: three.Camera, isBeforeRender: boolean): void;
    /**
     * @param {number} frame
     * @param {import('three').Camera} camera
     * @param {import('three').Camera | null} shadowCamera
     * @returns {boolean}
     * @ignore
     */
    frustumCullingAlreadyPerformed(frame: number, camera: three.Camera, shadowCamera: three.Camera | null): boolean;
    /**
     *
     * @param {Function} func
     */
    updateInstances(func: Function): void;
    /**
     *
     * @param {number} capacity
     */
    resizeBuffers(capacity: number): void;
    #private;
}

export type { InstancedMesh2 };
