// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dComponentPosition, U3dComponentPositionCO } from "./U3dComponentPosition.js";
import type { UInstancedMesh } from "../core/mesh/UInstancedMesh.js";
import type { WorldPosition, WorldPositionVector3 } from "../types/global.js";

/**
     * InstancedMesh 위치 회전 크기 정보
     */
    type InstancedTRSInfo = {
        position: three.Vector3;
        rotation: three.Euler;
        scale: three.Vector3;
        visible?: boolean;
        textureInfo?: Record<string, unknown>;
    };

/**
     * instanced mesh(확장)에서 사용하는 Mesh 최소 스펙
     */
    type InstancedRenderableMesh = UInstancedMesh<three.BufferGeometry, three.Material | Array<three.Material>, number, object>;

/**
     * instanced mesh extension이 제공하는 인스턴스 단위 객체(사용 중인 최소 스펙)
     */
    type InstancedMeshInstance = {
        owner?: InstancedRenderableMesh;
        position: three.Vector3;
        quaternion: three.Quaternion;
        scale: three.Vector3;
        matrixWorld: three.Matrix4;
        speed?: number;
        offset?: number;
        _info?: InstancedTRSInfo;
    };

/**
     * ~extends import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPositionCO <br>
     * U3dComponentInstancedPosition 생성자 옵션
     */
    type U3dComponentInstancedPositionCO_Content = {
        /**
         * instanced 업데이트 사용 여부
         */
        setInstanced?: boolean;
        /**
         * instanced 인스턴스의 절대 ID
         */
        instanceId?: number;
        /**
         * instancedGroup 내 그룹 인덱스
         */
        groupIndex?: number;
        /**
         * 인스턴스 TRS 참조 객체
         */
        instancedInfo?: InstancedTRSInfo;
        /**
         * 인스턴스가 속한 그룹
         */
        instancedGroup?: three.Object3D;
        /**
         * tween 업데이트 FPS
         */
        tweenFps?: number;
        /**
         * instancedId 모듈러 기준 값
         */
        instancedMaxCount?: number;
        /**
         * mixer/clip 업데이트 거리
         */
        animationDistance?: number;
    };

/**
     * ~extends import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPositionCO <br>
     * U3dComponentInstancedPosition 생성자 옵션
     */
    type U3dComponentInstancedPositionCO = Omit<Omit<U3dComponentPositionCO, never> & U3dComponentInstancedPositionCO_Content, never>;

/**
 * 공유 instanced mesh의 개별 인스턴스를 일반 컴포넌트 API로 제어합니다.
 *
 * @group 3dLayer
 * @extends {U3dComponentPosition}
 */
declare class U3dComponentInstancedPosition extends U3dComponentPosition {
    /**
     * 인스턴스 컴포넌트를 생성하고 공유 mesh의 ID·변환·애니메이션 상태를 연결합니다.
     *
     * @param {U3dComponentInstancedPositionCO} [opt={}] 생성 옵션
     */
    constructor(opt?: U3dComponentInstancedPositionCO);
    /** mixer 활성 여부를 조회하는 선택 callback입니다. @type {undefined | function(): boolean} */
    isMixerEnabled: undefined | (() => boolean);
    /** 한 인스턴스 그룹이 사용하는 최대 ID 범위입니다. @type {number} */
    _instancedMaxCount: number;
    /** 현재 인스턴스가 속한 그룹 번호입니다. @type {number | undefined} */
    groupIndex: number | undefined;
    /** 현재 인스턴스의 변환과 가시성 정보입니다. @type {InstancedTRSInfo | undefined} */
    instancedInfo: InstancedTRSInfo | undefined;
    /** 현재 인스턴스가 속한 공유 렌더 그룹입니다. @type {import('three').Group | undefined} */
    instancedGroup: three.Group | undefined;
    /** 중복을 제거한 애니메이션 식별자 목록입니다. @type {Array<string | number>} */
    _animateList: Array<string | number>;
    /** tween 갱신 FPS 설정값입니다. @type {number} */
    tweenFps: number;
    /** 인스턴스 애니메이션 시작 시점을 분산하는 난수 오프셋입니다. @type {number} */
    offset: number;
    /** 각 공유 mesh에서 현재 ID에 해당하는 entity 목록입니다. @type {Array<InstancedMeshInstance> | undefined} */
    instances: Array<InstancedMeshInstance> | undefined;
    /** 현재 frustum callback에서 mixer 갱신 대상으로 선택되었는지 나타냅니다. @type {boolean} */
    _updateMixer: boolean;
    /** 우선 반환할 원본 모델 참조입니다. @type {import('three').Object3D | undefined} */
    _rootObject: three.Object3D | undefined;
    _setInstanced: any;
    instanceId: any;
    /**
     * 애니메이션 갱신을 허용하는 카메라 거리를 반환합니다.
     *
     * @returns {number} 애니메이션 갱신 거리
     */
    getAnimationDistance(): number;
    /**
     * 애니메이션 갱신을 허용하는 카메라 거리를 설정합니다.
     *
     * @param {number} distance 애니메이션 갱신 거리
     */
    setAnimationDistance(distance: number): void;
    /**
     * 인스턴스 컴포넌트의 내장 애니메이션 클립을 모두 정지하는 함수
     *
     * @override
     *
     */
    override stopAllAnimation(): void;
    /**
     * 인스턴스 컴포넌트의 내장 애니메이션 클립을 모두 동작시키는 함수
     *
     * @override
     *
     */
    override startAllAnimation(): void;
    /**
     * mixer 상태를 현재 인스턴스 matrix에 반영합니다.
     *
     * @param {number} [idx] 갱신할 index. 유한한 값이 아니면 현재 그룹 index를 사용합니다.
     * @returns {boolean} matrix 갱신 실행 여부
     * @ignore
     */
    _flushMixerInstance(idx?: number): boolean;
    /**
     * 인스턴스 컴포넌트의 Mesh에 위치,회전,크기(Transform)를 반영하는 메서드입니다.
     * @param {WorldPositionVector3} position 반영할 위치
     * @param {import('three').Quaternion} quaternion 반영할 회전
     * @param {import('three').Vector3} scale 반영 할 크기
     */
    updateInstances(position: WorldPositionVector3, quaternion: three.Quaternion, scale: three.Vector3): void;
    /**
     * 경로 위치와 진행 방향을 shader에서 읽을 수 있는 데이터 텍스처로 변환합니다.
     *
     * @param {Array<import('three').Vector3>} path 경로 위치 목록
     * @param {Array<import('three').Vector3>} dir 경로 진행 방향 목록
     * @param {number} [sampleCount=512] 텍스처 샘플 수
     * @returns {{pathPosTexture: import('three').DataTexture, pathDirTexture: import('three').DataTexture, sampleCount: number}} 생성한 위치·방향 텍스처와 샘플 수
     */
    createPathTextures(path: Array<three.Vector3>, dir: Array<three.Vector3>, sampleCount?: number): {
        pathPosTexture: three.DataTexture;
        pathDirTexture: three.DataTexture;
        sampleCount: number;
    };
    /**
     * 현재 컴포넌트를 반환합니다.
     *
     * @returns {U3dComponentInstancedPosition} 현재 컴포넌트
     */
    getComponent(): U3dComponentInstancedPosition;
    /**
     * 인스턴스드 컴포넌트의 인스턴스 아이디를 반환하는 함수
     * @returns {number | undefined} instanceId를 반환
     */
    getInstanceId(): number | undefined;
    /**
     * 애니메이션 목록 추가 함수
     * @param {string | number} val 애니메이션 목록에 추가할 ID
     */
    addAnimateList(val: string | number): void;
    /**
     * instanced mesh를 참고하여 만든 원래의 대상을 반환
     * @returns {import('three').Object3D | undefined} URL에서 불러온 원본 객체
     */
    getOriginalModel(): three.Object3D | undefined;
    /**
     * intanced mesh의 (위치, 회전, 크기)를 담고 있는 객체를 반환
     * @returns {InstancedTRSInfo | undefined} 위치·회전·크기 정보
     */
    getInstancedInfo(): InstancedTRSInfo | undefined;
    /**
     * instanced mesh(또는 instanced group) 에 현재 위치/회전/스케일을 반영합니다.
     * @param {WorldPositionVector3} position 설정 위치 (월드 좌표, EPSG:3857)
     * @param {number} idx 설정 대상 idx
     * @param {import('three').Object3D | undefined} object 설정 대상 InstancedGroup
     * @param {number} [elapsedTime=0] 애니메이션 updateTime 상수
     */
    instancedMeshUpdate(position: WorldPositionVector3, idx: number, object: three.Object3D | undefined, elapsedTime?: number): void;
    /**
     * 컴포넌트 위치를 설정하고 인스턴스·POI·overlay·자식 계층에 반영합니다.
     *
     * @override
     *
     * @param {WorldPosition} position 위치 값 (worldPosition)
     * @param {WorldPosition} [lookAt] 바라볼 위치 값 (worldPosition)
     * @param {boolean} [fixedOverlay=false] 오버레이 고정 여부
     */
    override setPosition(position: WorldPosition, lookAt?: WorldPosition, fixedOverlay?: boolean): void;
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
    pickMaterial(intersect?: unknown, color?: three.ColorRepresentation, opacity?: number): boolean;
    /**
     * [restoreMaterial] 색상을 이전에 설정하여 변경 하였다면 다시 원래의 색상으로 복구하는 함수
     *
     * @returns {boolean} 색상 복구 적용 여부
     *
    * @ignore
     */
    restoreMaterial(): boolean;
    /**
     * [updateAnimationAt] 해당 componentPosition이 지정한 mesh의 animation을 업데이트 해주는 함수
     * 업데이트 하려는 대상이 animation에 대한 정보가 설정된 상태( animations 속성이 있을 경우 ) 업데이트 하여 갱신
     *
     * @param {number} instanceId 갱신할 인스턴스 식별자. 현재 구현에서는 사용하지 않습니다.
     * @returns {false} 현재 인스턴스 애니메이션 직접 갱신은 지원하지 않습니다.
     *
     * @ignore
     */
    updateAnimationAt(instanceId: number): false;
    /**
     * instanced 객체의 원본 모델의 대해서 전체 순환
     *
     * @param {(object: import('three').Object3D) => void} callback 전체 순환에 실행될 함수
     */
    traverse(callback: (object: three.Object3D) => void): void;
    /**
     * mesh 타입의 객체를 반환 받을 수 있는 함수
     *
     * @returns {Array<import('three').Object3D>} mesh 타입의 객체들 복사하여 담은 리스트
     */
    exportUMesh(): Array<three.Object3D>;
    /**
     * 실제 화면에 투영되는 객체의 형상 정보를 리턴하는 함수
     *
     * @returns {{position: import('three').Vector3, rotation: import('three').Euler, scale: import('three').Vector3, properties: { instancedInfo: Array<InstancedTRSInfo> }} | undefined} 투영 위치, 회전, 크기
     */
    getProjectionInfo(): {
        position: three.Vector3;
        rotation: three.Euler;
        scale: three.Vector3;
        properties: {
            instancedInfo: Array<InstancedTRSInfo>;
        };
    } | undefined;
    #private;
}

export type { InstancedMeshInstance, InstancedRenderableMesh, InstancedTRSInfo, U3dComponentInstancedPosition, U3dComponentInstancedPositionCO, U3dComponentInstancedPositionCO_Content };
