// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { SimplifyPolicy_Option, USimpleTailCO, USimpleTailFadeEvaluator, USimpleTailNode, USimpleTailPointMetadata, USimpleTailRuntimePolicy } from "./USimpleTail.types.js";
import type { USimpleTailShader } from "./material/USimpleTailMaterial.js";

/**
 * ~extends import('three').Object3D <br>
 *
 * 이동 지점을 연결해 화면을 향하는 리본 궤적을 그립니다.
 */
declare class USimpleTail extends three.Object3D<three.Object3DEventMap> {
    /**
     * 삼각형 한 면을 구성하는 인덱스 개수를 반환합니다.
     *
     * @returns {number} 삼각형 한 면의 인덱스 수인 3
     */
    static get IndicesPerFace(): number;
    /**
     * 인접한 두 경로 지점을 잇는 사각형의 삼각형 개수를 반환합니다.
     *
     * @returns {number} 사각형을 구성하는 삼각형 수인 2
     */
    static get FacesPerQuad(): number;
    /**
     * 궤적 재질을 구성하는 기본 셰이더(shader) 정의입니다.
     *
     * @type {typeof import('@union3d/effect/material/USimpleTailMaterial').USimpleTailShader} 기본 셰이더 정의 객체
     */
    static Shader: typeof USimpleTailShader;
    /**
     * 리본 궤적을 그리는 셰이더(shader) 재질을 생성합니다. <br>
     * initialize에 전달한 뒤에는 궤적의 dispose가 재질을 해제합니다.
     *
     * @param {string} [vertexShader] 대체 정점 셰이더 소스이며 생략하면 기본 구현 사용
     * @param {string} [fragmentShader] 대체 프래그먼트 셰이더 소스이며 생략하면 기본 구현 사용
     * @param {Record<string, import('three').IUniform>} [customUniforms] 재질에 추가하거나 기본값을 덮어쓸 uniform 목록
     * @returns {import('three').ShaderMaterial} 새로 생성한 궤적 재질
     */
    static createMaterial(vertexShader?: string, fragmentShader?: string, customUniforms?: Record<string, three.IUniform>): three.ShaderMaterial;
    /**
     * USimpleTail 클래스 생성자입니다. <br>
     * 실제 궤적을 그리려면 initialize를 호출한 뒤 getMesh로 얻은 메시를 장면에 추가하십시오.
     *
     * @param {USimpleTailCO} [opt={}] 궤적 식별 정보와 거리 제한·단순화 설정
     */
    constructor(opt?: USimpleTailCO);
    /**
     * 궤적의 dispose가 이미 호출되었는지 나타냅니다.
     *
     * @type {boolean} 자원 해제가 시작되었으면 true
     */
    _disposed: boolean;
    scene: any;
    name: any;
    geometry: any;
    mesh: any;
    nodeCenters: any;
    lastNodeCenter: any;
    currentNodeCenter: any;
    nodeIDs: any;
    currentNodeID: any;
    /** @type {number} */ maxLength: number;
    /** @type {number} */ expandStepLength: number;
    /** @type {number} */ maxDistance: number;
    /** @type {number} */ pathDistance: number;
    /** @type {number} */ visibleStartNode: number;
    _virtualStartSlot: number;
    _virtualStartNode: {
        x: any;
        y: any;
        z: any;
        colorFactor: any;
        pathDistance: number;
        time: any;
        recordedAt: any;
    };
    _drawStartNode: number;
    /** @type {number} */ lastDistanceFadeOutBoundary: number;
    /** @type {function(object): void} */ onFadeOut: (arg0: object) => void;
    /** @type {USimpleTailFadeEvaluator | undefined} */
    fadeFunc: USimpleTailFadeEvaluator | undefined;
    currentLength: any;
    currentEnd: any;
    tempMatrix4: any;
    tempPosition: three.Vector3;
    tempOffset: three.Vector3;
    tempQuaternion: three.Quaternion;
    lastSimplifyIndex: number;
    lastCapacityWarning: number;
    colorFactor: number;
    precision: any;
    fixedCapacity: boolean;
    fadeStart: any;
    fadeEnd: any;
    depthWidthScale: boolean;
    widthFade: any;
    alphaFade: any;
    simplifyPolicy: SimplifyPolicy_Option;
    _origin: three.Vector3;
    /**
     * 궤적을 그릴 저장 공간과 메시를 준비하고 기존 지점 이력을 비웁니다. <br>
     * 전달한 재질은 이 궤적이 소유하며 dispose 시 함께 해제합니다. <br>
     * 재초기화하면 기존 geometry와 교체되는 재질을 해제합니다. 같은 재질을 다시 전달하면 유지합니다. <br>
     * dispose 이후에는 다시 초기화할 수 없습니다. <br>
     * 장면 추가는 호출자가 getMesh로 얻은 메시를 사용해 수행하십시오.
     *
     * @param {import('three').ShaderMaterial} material createMaterial로 만든 궤적 전용 재질
     * @param {number} length 처음 확보할 지점 수인 양의 정수
     * @param {import('three').Object3D} targetObject 궤적 대상 객체로 보관할 참조
     * @param {number} perMaxNode 누적 거리 1km당 단순화 목표 지점 수
     * @returns {Promise<void>} 초기화가 끝나면 완료되는 객체
     */
    initialize(material: three.ShaderMaterial, length: number, targetObject: three.Object3D, perMaxNode: number): Promise<void>;
    length: number;
    perMaxNode: number;
    targetObject: three.Object3D<three.Object3DEventMap>;
    material: any;
    /**
     * 화면을 향하는 리본 궤적의 지점당 정점 수와 면 수를 설정합니다. <br>
     * initializeGeometry 전에 호출하십시오.
     */
    initializeBillboardGeometryLayout(): void;
    VerticesPerNode: number;
    FacesPerNode: number;
    FaceIndicesPerNode: number;
    /**
     * 현재 length에 맞는 궤적 정점·인덱스 저장 공간을 생성합니다. <br>
     * initializeBillboardGeometryLayout으로 지점 구성을 정한 뒤 호출하십시오.
     */
    initializeGeometry(): void;
    vertexCount: number;
    faceCount: number;
    /**
     * 모든 삼각형의 인덱스를 0으로 설정해 면이 그려지지 않도록 합니다. <br>
     * 지점 이력과 저장 공간은 유지합니다.
     */
    zeroIndices(): void;
    /**
     * 준비된 geometry와 material로 궤적 메시를 생성합니다. <br>
     * 장면에는 자동으로 추가하지 않습니다.
     */
    initializeMesh(): void;
    /**
     * 궤적 메시를 장면에서 제거하고 선택용 위치 출력 재질을 해제합니다. <br>
     * geometry와 기본 material은 유지하므로 모든 자원을 해제하려면 dispose를 사용하십시오.
     */
    destroyMesh(): void;
    /**
     * 저장된 궤적 지점과 출력 범위를 비웁니다. <br>
     * 재질·스타일·확보된 용량을 유지하므로 다시 지점을 추가할 수 있습니다.
     */
    reset(): void;
    lastSimplifyKm: number;
    lastMemoryCheck: number;
    _positionPool: Float32Array<ArrayBuffer>;
    _indexPool: Uint32Array<ArrayBuffer>;
    _colorPool: Float32Array<ArrayBuffer>;
    _widthFadePool: Float32Array<ArrayBuffer>;
    _alphaFadePool: Float32Array<ArrayBuffer>;
    _pathDistancePool: Float32Array<ArrayBuffer>;
    _sidePool: Float32Array<ArrayBuffer>;
    _startCapPool: Float32Array<ArrayBuffer>;
    _endCapPool: Float32Array<ArrayBuffer>;
    _previousPool: Float32Array<ArrayBuffer>;
    _nextPool: Float32Array<ArrayBuffer>;
    /**
     * 저장된 궤적을 유지하면서 지점 저장 공간을 다시 확보합니다. <br>
     * 초기화된 궤적에 현재 용량보다 큰 정수를 전달하십시오. <br>
     * 기존 geometry는 해제하고 새 geometry를 메시와 연결합니다.
     *
     * @param {number} newLength 새로 확보할 전체 지점 수
     */
    expandGeometryBuffer(newLength: number): void;
    /**
     * 보관된 중심점 목록을 기준으로 궤적의 정점 위치와 출력 범위를 다시 계산합니다. <br>
     * 단순화하거나 중심점을 수정한 뒤 화면에 반영할 때 사용합니다.
     */
    rebuildFromNodeCenters(): void;
    /**
     * 변환 행렬의 위치를 궤적 끝에 추가하고 거리 제한과 fade를 갱신합니다. <br>
     * 용량이 부족하면 정책에 따라 단순화·오래된 지점 제거·용량 확장을 수행합니다.
     *
     * @param {import('three').Matrix4} transformMatrix 월드 좌표(EPSG:3857) 위치를 담은 행렬
     * @param {number} fps 현재 초당 프레임 수이며 단순화 강도 계산에 사용
     * @param {number} [maxFps=60] 기준 초당 프레임 수
     * @param {USimpleTailPointMetadata} [metadata] 새 지점에 보관할 시간 정보
     */
    advanceGeometry(transformMatrix: three.Matrix4, fps: number, maxFps?: number, metadata?: USimpleTailPointMetadata): void;
    /**
     * 지정한 중심점의 위치·색 농도·누적 거리를 기록합니다. <br>
     * 기존 지점의 시간 정보와 내부 누적 경로 거리는 유지합니다. <br>
     * 정점 위치를 함께 갱신하려면 updateNodePositionsFromTransformMatrix를 사용하십시오.
     *
     * @param {number} nodeIndex 수정할 지점의 0부터 시작하는 인덱스
     * @param {import('three').Vector3Like} nodeCenter 지점의 월드 좌표(EPSG:3857)
     * @param {number} [colorFactor=this.colorFactor] 색 농도 배율
     */
    updateNodeCenter(nodeIndex: number, nodeCenter: three.Vector3Like, colorFactor?: number): void;
    /** 일괄 입력 중 fade 평가를 보류합니다. endFadeBatch와 쌍으로 사용하십시오. */
    beginFadeBatch(): void;
    /** 가장 바깥 일괄 입력이 끝나면 최종 경로의 fade를 한 번 평가합니다. */
    endFadeBatch(): void;
    /**
     * 출력 범위의 지점마다 fade 콜백을 다시 평가해 너비와 불투명도를 갱신합니다. <br>
     * maxDistance가 Infinity이면 콜백을 실행하지 않고 모든 지점의 fade 배율을 1로 복원합니다. <br>
     * 이동이 멈춘 동안 시간 fade를 진행하려면 갱신 루프에서 호출하십시오. <br>
     * 숫자 결과는 두 배율에 함께 적용하고 객체 결과는 width와 alpha에 각각 적용합니다. <br>
     * 유효하지 않거나 생략된 값은 1로 처리하며 숫자는 0~1로 제한합니다.
     *
     * @param {number} [now=Date.now()] 평가 기준 epoch 시각(ms)
     */
    updateFade(now?: number): void;
    /**
     * 다음 좌표를 추가했을 때의 자체 누적 거리(m)를 계산합니다. 노드 제거 후에도 누적 기준을 유지합니다.
     * @param {import('three').Vector3Like} position 경로에 기록할 월드 좌표
     * @returns {number} 다음 지점의 누적 거리(m)
     */
    getNextPathDistance(position: three.Vector3Like): number;
    /**
     * 변환 행렬의 위치로 중심점과 인접 궤적 정점을 갱신합니다. <br>
     * 기존 지점의 색 농도와 시간 정보는 유지합니다.
     *
     * @param {number} nodeIndex 수정할 지점의 0부터 시작하는 인덱스
     * @param {import('three').Matrix4} transformMatrix 월드 좌표(EPSG:3857) 위치를 담은 행렬
     */
    updateNodePositionsFromTransformMatrix(nodeIndex: number, transformMatrix: three.Matrix4): void;
    /**
     * 지정한 두 지점 사이에 삼각형 연결을 기록합니다.
     *
     * @param {number} srcNodeIndex 연결을 시작할 지점 인덱스
     * @param {number} destNodeIndex 연결을 끝낼 지점 인덱스
     */
    connectNodes(srcNodeIndex: number, destNodeIndex: number): void;
    /**
     * 궤적의 기본 색상을 변경합니다.
     *
     * @param {import('three').ColorRepresentation} color 적용할 색상
     */
    setColor(color: three.ColorRepresentation): void;
    /**
     * 궤적 전체의 불투명도를 변경합니다. <br>
     * 값이 1보다 작으면 재질의 투명 렌더링을 켭니다.
     *
     * @param {number} opacity 사용할 불투명도이며 0~1 범위로 전달
     */
    setOpacity(opacity: number): void;
    /**
     * 지점별 색 농도로 궤적 색상을 달리 표현할지 설정합니다.
     *
     * @param {boolean} enabled true면 지점의 colorFactor를 색상에 반영
     */
    setGradation(enabled: boolean): void;
    /**
     * 궤적(trail)의 기본 너비를 변경합니다. <br>
     * 카메라 깊이 보정과 fade가 적용되면 실제 표시 너비는 달라질 수 있습니다.
     *
     * @param {number} width 기본 화면 너비 값이며 유한한 숫자만 반영
     */
    setWidth(width: number): void;
    /**
     * 궤적(tail)의 거리 제한·단순화·fade 콜백을 설정합니다. <br>
     * 생략한 항목은 유지합니다. 유한한 maxDistance는 fade 결과와 별도로 출력 범위를 제한하며 Infinity는 fade도 해제합니다. <br>
     * 이 클래스의 fadeFunc는 지점·최신 지점·현재 시각을 받는 내부 평가 함수입니다.
     *
     * @param {USimpleTailRuntimePolicy} [policy={}] 변경할 궤적 정책
     */
    setTailPolicy(policy?: USimpleTailRuntimePolicy): void;
    /**
     * 카메라 근접 구간에서 궤적 너비를 줄이는 fade 거리를 설정합니다. <br>
     * 경로의 경과 시간이나 누적 거리 fade와는 별개입니다. <br>
     * 종료 거리가 시작 거리보다 크면 시작 거리 이내에서 너비가 0이며 종료 거리부터 원래 너비입니다.
     *
     * @param {number} [start] 카메라 깊이 기준 너비가 0인 거리이며 유한한 0 이상 값만 반영
     * @param {number} [end] 원래 너비로 돌아오는 거리이며 start보다 작으면 start로 보정
     */
    setFade(start?: number, end?: number): void;
    /**
     * 월드 좌표(EPSG:3857) 지점을 궤적 끝에 추가합니다. <br>
     * 새 지점을 추가하면 거리 제한과 fade 콜백 결과를 함께 반영합니다.
     *
     * @param {import('three').Vector3Like} worldPosition 추가할 지점의 월드 좌표(EPSG:3857)
     * @param {number} colorFactor 지점별 색 농도이며 0~1 범위로 전달
     * @param {number} fps 현재 초당 프레임 수
     * @param {number} [maxFps=60] 기준 초당 프레임 수
     * @param {USimpleTailPointMetadata} [metadata] 지점의 누적 시간과 기록 시각
     */
    appendPoint(worldPosition: three.Vector3Like, colorFactor: number, fps: number, maxFps?: number, metadata?: USimpleTailPointMetadata): void;
    /**
     * 장면에 추가할 궤적 메시를 반환합니다.
     *
     * @returns {import('three').Mesh | null} 내부 메시 참조이며 초기화 전이나 해제 후에는 null
     */
    getMesh(): three.Mesh | null;
    /**
     * 보관 중인 궤적 중심점 목록을 반환합니다. <br>
     * 복사본이 아니므로 외부 변경은 내부 이력에 직접 영향을 줍니다. <br>
     * 거리 제한 밖이라 그려지지 않는 지점도 버퍼 재사용 전에는 포함됩니다.
     *
     * @returns {Array<USimpleTailNode> | null} 오래된 순서의 내부 지점 배열이며 초기화 전이나 해제 후에는 null
     */
    getNodeCenters(): Array<USimpleTailNode> | null;
    /**
     * 선분에서 멀리 떨어진 지점을 남기는 RDP 방식으로 중심점 목록을 줄입니다. <br>
     * 양 끝점과 정책에서 지정한 꺾임 주변 지점을 보호합니다.
     *
     * @template {import('three').Vector3Like} T
     * @param {Array<T>} points 순서대로 연결된 중심점 목록
     * @param {number} epsilon 선분에서 지점까지 허용할 거리이며 0 이상 값으로 전달
     * @returns {Array<T>} 원본 지점 객체의 참조를 담은 새 배열
     */
    simplifyRDP<T extends three.Vector3Like>(points: Array<T>, epsilon: number): Array<T>;
    /**
     * 입력 지점까지 포함하도록 궤적의 경계 구 크기를 늘립니다.
     *
     * @param {import('three').Vector3} point 경계에 포함할 지점
     */
    computingBounding(point: three.Vector3): void;
    /**
     * 궤적(trail)의 오래된 지점을 단순화하고 표시 형상을 다시 계산합니다. <br>
     * 최근 protectedTailNodes개와 꺾임 주변 지점을 보호합니다. <br>
     * 이 메서드를 직접 호출하면 simplify 설정과 관계없이 단순화를 수행합니다.
     *
     * @param {number} [epsilon=10] 지점 생략에 허용할 거리이며 값이 클수록 더 많이 생략
     */
    simplifyTrail(epsilon?: number): void;
    /**
     * 목표 지점 수에 가까워지도록 궤적(trail)을 반복 단순화합니다. <br>
     * 보호 지점과 처리 제한 때문에 목표 수보다 많은 지점이 남을 수 있습니다.
     *
     * @param {number} targetCount 남기려는 전체 지점 수
     * @param {number} [epsilonStart=10] 처음 적용할 단순화 허용 거리
     * @param {number} [epsilonStep=10] 반복할 때 허용 거리를 늘릴 양
     */
    simplifyTrailToTarget(targetCount: number, epsilonStart?: number, epsilonStep?: number): void;
    /**
     * 시야 영역(프러스텀, frustum) 안에 있는 중심점 범위만 그리도록 제한합니다. <br>
     * maxDistance 경계 이후 지점만 검사합니다. <br>
     * 중심점 포함 여부로 판단하므로 양 끝점이 시야 밖인 교차 선분은 놓칠 수 있습니다.
     *
     * @param {import('three').Frustum} frustum 월드 좌표(EPSG:3857)에서 검사할 시야 영역
     */
    updateTrailDrawRangeInFrustum(frustum: three.Frustum): void;
    /**
     * 가장 오래된 지점을 제거하고 남은 궤적을 앞으로 당겨 저장 공간을 재사용합니다. <br>
     * 제거 개수가 현재 지점 수 이상이면 reset과 같이 이력을 비웁니다.
     *
     * @param {number} dropNodes 제거할 지점 수이며 양의 유한한 값을 정수로 내림
     */
    dropOldestNodes(dropNodes: number): void;
    /**
     * 궤적 본체의 광선 교차 검사(raycast)는 수행하지 않습니다. <br>
     * 선택 기능은 별도의 경로 선택용 메시를 사용하십시오.
     *
     * @override
     */
    override raycast(): void;
    #private;
}

export type { USimpleTail };
