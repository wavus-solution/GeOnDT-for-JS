// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { MeshPhongMaterial, BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { USimpleTailShader } from "./material/USimpleTailMaterial.js";

/**
 * ~extends import('three').Object3D <br>
 *
 * 이동 지점을 연결해 화면을 향하는 리본 궤적을 그립니다.
 */
declare class USimpleTail extends three.Object3D<three.Object3DEventMap> {
    static "__#32@#normalizeDrawResult"(result: any): {
        red: number;
        green: number;
        blue: number;
        opacity: any;
        action: any;
        width: any;
        alpha: any;
        from: any;
        to: any;
    };
    static "__#32@#interpolateDrawNode"(a: any, b: any, t: any): Pick<USimpleTailNode, "x" | "y" | "time" | "z" | "colorFactor" | "pathDistance">;
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
     * @type {typeof import('@union3d/effect/material/USimpleTailMaterial').USimpleTailShader}
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
     * @param {USimpleTailCommonPolicy} previous
     * @param {USimpleTailCommonPolicy} patch
     * @returns {{limitMode: 'none' | 'time' | 'age' | 'distance', limitValue: number, limitAction: 'hide' | 'dispose'}}
     * @ignore
     */
    static normalizeRetention(previous: USimpleTailCommonPolicy, patch: USimpleTailCommonPolicy): {
        limitMode: "none" | "time" | "age" | "distance";
        limitValue: number;
        limitAction: "hide" | "dispose";
    };
    /**
     * USimpleTail 클래스 생성자입니다. <br>
     * 실제 궤적을 그리려면 initialize를 호출한 뒤 getMesh로 얻은 메시를 장면에 추가하십시오.
     *
     * @param {USimpleTailCO} [opt={}] 궤적 식별 정보와 단순화 설정
     */
    constructor(opt?: USimpleTailCO);
    /**
     * 궤적의 dispose가 이미 호출되었는지 나타냅니다. 자원 해제가 시작되었으면 true
     * @type {boolean}
     */
    _disposed: boolean;
    /** @type {USimpleTailDrawEvaluator | undefined} */
    drawFunc: USimpleTailDrawEvaluator | undefined;
    set nodeCenters(nodes: USimpleTailNode[]);
    /** Retained nodes only. Materialize the CPU list on public access, without rewriting GPU data. */
    get nodeCenters(): USimpleTailNode[];
    scene: any;
    name: any;
    geometry: any;
    mesh: any;
    lastNodeCenter: any;
    currentNodeCenter: any;
    nodeIDs: any;
    currentNodeID: any;
    /** @type {number} */ maxLength: number;
    /** @type {number} */ expandStepLength: number;
    limitMode: "time" | "distance" | "none" | "age";
    limitValue: number;
    limitAction: "dispose" | "hide";
    /** @type {number} */ pathDistance: number;
    /** @type {number} */ visibleStartNode: number;
    _drawStartNode: number;
    /** @type {USimpleTailFadeOutCallback | undefined} */ onFadeOut: USimpleTailFadeOutCallback | undefined;
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
    length: any;
    perMaxNode: number;
    targetObject: three.Object3D<three.Object3DEventMap>;
    drawSegments: any[] | {
        a: any;
        b: any;
    }[];
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
    _sidePool: Int8Array<ArrayBuffer>;
    _startCapPool: Uint8Array<ArrayBuffer>;
    _endCapPool: Uint8Array<ArrayBuffer>;
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
     * 변환 행렬의 위치를 궤적 끝에 추가하고 GPU 기준값을 갱신합니다. <br>
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
    /** 일괄 입력 중 draw 평가를 보류합니다. endDrawBatch와 쌍으로 사용하십시오. */
    beginDrawBatch(): void;
    /** 가장 바깥 일괄 입력이 끝나면 최종 경로의 draw 정책을 한 번 평가합니다. */
    endDrawBatch(): void;
    /**
     * 모든 보관 노드의 표시·구간·fade·폐기를 평가합니다. 숨긴 노드도 평가합니다.
     * @param {{now?: number, totalTime?: number | null}} [context] 경로 시간은 null로 최신 입력 기준에 복귀합니다.
     */
    updateDraw(context?: {
        now?: number;
        totalTime?: number | null;
    }): void;
    /** 피킹을 요청할 때만 limit에 맞춘 구간을 계산합니다. 렌더 프레임에서는 호출하지 않습니다. */
    getDrawSegments(): {
        a: any;
        b: any;
    }[];
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
     * 노드별 opacity와 fade를 반영할 수 있도록 투명 렌더링을 유지합니다.
     *
     * @param {number} opacity 사용할 불투명도이며 0~1 범위로 전달
     */
    setOpacity(opacity: number): void;
    /**
     * 지점별 색 농도를 궤적 색상에 적용합니다.
     * @param {boolean} enabled true면 colorFactor를 반영
     */
    setGradation(enabled: boolean): void;
    /**
     * 궤적(trail)의 기본 너비를 변경합니다. <br>
     * fade가 적용되면 실제 표시 너비는 달라질 수 있습니다.
     *
     * @param {number} width 기본 화면 너비 값이며 유한한 숫자만 반영
     */
    setWidth(width: number): void;
    /**
     * 노드별 콜백을 정책과 독립적으로 등록하거나 해제합니다.
     * @param {USimpleTailDrawEvaluator | null | undefined} drawFunc
     */
    setDrawFunc(drawFunc: USimpleTailDrawEvaluator | null | undefined): void;
    /**
     * 궤적(tail)의 단순화·제한·fade 정책을 설정합니다. <br>
     * 생략한 항목은 유지합니다. 스타일과 독립적으로 제한 범위·숨김 또는 제거·fade를 적용합니다. <br>
     * 노드별 콜백은 setDrawFunc로 별도 설정합니다.
     *
     * @param {Omit<USimpleTail_Policy, 'initLength' | 'recordIntervalMs'>} [policy={}] 변경할 궤적 정책
     */
    setTailPolicy(policy?: Omit<USimpleTail_Policy, "initLength" | "recordIntervalMs">): void;
    /**
     * 월드 좌표(EPSG:3857) 지점을 궤적 끝에 추가합니다. <br>
     * 새 지점을 추가하면 GPU 표시 효과의 기준 시간·거리를 함께 갱신합니다.
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
     * GPU에서 숨긴 구간의 노드도 포함합니다.<br>
     * time은 drawFunc(info).time과 같은 기록 epoch 시각(ms),
     * pathDistance는 drawFunc(info).dist와 같은 경로 시작부터 누적 거리(m)입니다.
     *
     * @returns {Array<USimpleTailNode> | null} 오래된 순서의 내부 지점 배열이며 초기화 전이나 해제 후에는 null
     */
    getNodeCenters(): Array<USimpleTailNode> | null;
    /**
     * 최신 입력 또는 updateDraw에서 지정한 평가 경로 시간(epoch ms)을 반환합니다.
     * @returns {number | undefined} 아직 기록하지 않았으면 undefined
     */
    getTotalTime(): number | undefined;
    /**
     * 선분에서 멀리 떨어진 지점을 남기는 RDP 방식으로 중심점 목록을 줄입니다. <br>
     * 양 끝점과 정책에서 지정한 꺾임 주변 지점을 보호합니다.
     *
     * @template {import('three').Vector3Like & {breakBefore?: boolean}} T
     * @param {Array<T>} points 순서대로 연결된 중심점 목록
     * @param {number} epsilon 선분에서 지점까지 허용할 거리이며 0 이상 값으로 전달
     * @returns {Array<T>} 원본 지점 객체의 참조를 담은 새 배열
     */
    simplifyRDP<T extends three.Vector3Like & {
        breakBefore?: boolean;
    }>(points: Array<T>, epsilon: number): Array<T>;
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
     * 보관된 연속 경로의 정점 데이터를 이동합니다. <br>
     * 시야 절단은 GPU에 맡겨 양 끝점이 시야 밖인 교차 선분도 보존합니다.
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

/**
     * U3dCumulativePath가 사용자 콜백을 감싸 tail에 전달하는 내부 함수입니다.
     */
    type USimpleTailDrawEvaluator = (node: USimpleTailDrawNode, newest: USimpleTailDrawNode, now: number, previous: USimpleTailDrawNode | null, totalTime: number) => USimpleTailDrawResult | void;

/**
     * 누적 경로와 내부 렌더러가 공유하는 노드별 표시 결정입니다.
     */
    type USimpleTailDrawResult = {
        /**
         * 노드 색상. 생략하면 기본 색상을 사용하며 지정하면 해당 색상을 대체합니다. 노드 사이에서 보간합니다.
         */
        color?: three.ColorRepresentation;
        /**
         * 노드 불투명도(0~1). 생략/비정상 값은 기본 opacity. 노드 사이에서 보간한 뒤 fade.alpha와 곱합니다.
         */
        opacity?: number;
        /**
         * hide는 보관, dispose는 복구 불가능한 노드 제거. 버퍼는 사용량이 용량의 절반 이하일 때 축소하며 전체 제거 시 즉시 해제합니다.
         */
        action?: "draw" | "hide" | "dispose";
        /**
         * 폭·불투명도 배율(0~1). 생략/비정상 값은 1. 0도 삭제를 뜻하지 않습니다.
         */
        fade?: {
            width?: number;
            alpha?: number;
        };
        /**
         * 직전 연결 노드→현재 노드 구간의 표시 비율. 기본 0~1. from>=to면 표시하지 않습니다.
         */
        range?: {
            from?: number;
            to?: number;
        };
    };

/**
     * 렌더 노드에 보관하는 경로 기록 정보입니다.
     */
    type USimpleTailPointMetadata = {
        /**
         * 노드 기록 epoch 시각(ms). 생략하면 Date.now()
         */
        time?: number;
    };

/**
     * fade 계산에 전달하는 지점의 월드 좌표(EPSG:3857)와 거리·시간 정보입니다.
     */
    type USimpleTailDrawNode = {
        /**
         * 버퍼 이동·삭제에도 유지되는 식별자
         */
        nodeId: number;
        /**
         * 월드 x
         */
        x: number;
        /**
         * 월드 y
         */
        y: number;
        /**
         * 월드 z
         */
        z: number;
        /**
         * 경로 시작부터 누적 거리(m). U3dCumulativePathDrawInfo.dist와 같은 값
         */
        pathDistance: number;
        /**
         * 노드 기록 epoch 시각(ms). 실시간 기록은 경로가 자체 생성하며 애니메이션 누적 시간과 무관합니다. 명시적 이력 입력은 그 time을 사용합니다.
         */
        time: number;
        /**
         * 직전 노드와 연결이 끊어졌는지 여부
         */
        breakBefore?: boolean;
    };

/**
     * ~extends SimplifyPolicy_Option <br>
     *
     * 생성 옵션과 정책 변경에서 공유하는 단순화·제한·fade 설정입니다.
     */
    type USimpleTailCommonPolicy_Content = {
        /**
         * 용량 확장 배율이며 현재 지점 용량에 곱해 확장 단위를 정합니다.
         */
        precision?: number;
        /**
         * none은 제한·정책 fade 해제. distance는 m, time은 최신 기록 기준 ms, age는 현재 시각 기준 ms
         */
        limitMode?: "none" | "distance" | "time" | "age";
        /**
         * 제한 범위. 범위 이상이면 limitAction을 적용합니다. null/Infinity는 제한 해제, 0은 전체 숨김 또는 제거
         */
        limitValue?: number | null;
        /**
         * hide는 노드를 보관하고 GPU에서 숨김·fade 처리, dispose는 만료 노드를 제거. hide에서도 단순화나 drawFunc의 제거는 별도 적용
         */
        limitAction?: "hide" | "dispose";
        /**
         * 제거 예정(deprecated) 옵션. 대신 `limitMode: 'distance'`와 `limitValue`를 사용하세요.
         */
        maxDistance?: number;
        /**
         * 보관 범위의 오래된 끝부분에서 폭을 줄일 비율(0~1). 0은 fade 해제. distance·time·age 모드의 유한한 제한 범위에 적용합니다.
         */
        widthFade?: number;
        /**
         * 보관 범위의 오래된 끝부분에서 불투명도를 줄일 비율(0~1). 0은 fade 해제. 스타일 불투명도와 곱합니다.
         */
        alphaFade?: number;
    };

/**
     * ~extends SimplifyPolicy_Option <br>
     *
     * 생성 옵션과 정책 변경에서 공유하는 단순화·제한·fade 설정입니다.
     */
    type USimpleTailCommonPolicy = SimplifyPolicy_Option & USimpleTailCommonPolicy_Content;

/**
     * ~extends USimpleTailCommonPolicy <br>
     *
     * U3dCumulativePath에서 사용할 단순화·표시 정책입니다.
     */
    type USimpleTail_Policy_Content = {
        /**
         * 처음 확보할 지점 수이며 U3dCumulativePath가 적용합니다.
         */
        initLength?: number;
        /**
         * U3dCumulativePath의 실시간 지점 기록 최소 간격(ms)이며 0이면 제한하지 않습니다.
         */
        recordIntervalMs?: number;
        /**
         * 자체 누적 거리 1km당 자동 단순화 목표 지점 수
         */
        perMaxNode?: number;
        /**
         * 제한 경계가 전진할 때 호출합니다. hide·dispose 모두 적용하며 null로 해제합니다.
         */
        onFadeOut?: USimpleTailFadeOutCallback | null;
    };

/**
     * ~extends USimpleTailCommonPolicy <br>
     *
     * U3dCumulativePath에서 사용할 단순화·표시 정책입니다.
     */
    type USimpleTail_Policy = USimpleTailCommonPolicy & USimpleTail_Policy_Content;

/**
     * 제한 범위를 벗어나는 경계 알림입니다. 개별 노드 삭제나 fade 시작 알림은 아닙니다.
     * 경계가 전진할 때 평가당 한 번 호출하며 none·무한 제한에서는 호출하지 않습니다.
     */
    type USimpleTailFadeOutCallback = (this: USimpleTail, event: USimpleTailFadeOutEvent) => void;

type USimpleTailFadeOutEvent = {
        /**
         * 대상 궤적. name으로 경로를 구분합니다.
         */
        target: USimpleTail;
        /**
         * 제한 기준
         */
        limitMode: "distance" | "time" | "age";
        /**
         * 제한 범위(m 또는 ms)
         */
        limitValue: number;
        /**
         * 제한 범위 밖의 처리 방식
         */
        limitAction: "hide" | "dispose";
        /**
         * 경로 시작부터 경계까지 누적 거리(m). 시간 순서가 뒤섞인 time·age 모드에서는 제공하지 않습니다.
         */
        boundaryDistance?: number;
        /**
         * time·age 모드의 제한 경계 epoch 시각(ms)
         */
        boundaryTime?: number;
        /**
         * 거리 모드에서만 제공하는 기존 호환 값. limitValue와 같습니다.
         */
        maxDistance?: number;
        /**
         * 경계 직전 또는 경계에 위치한 노드
         */
        previousNode?: USimpleTailNode;
        /**
         * 경계 다음 노드. 모두 범위를 벗어나면 생략합니다.
         */
        nextNode?: USimpleTailNode;
        /**
         * 보관 중인 마지막 노드
         */
        newestNode: USimpleTailNode;
        /**
         * 연결된 구간의 경계 보간점. 단절 구간에서는 생략합니다.
         */
        virtualPoint?: Pick<USimpleTailDrawNode, "x" | "y" | "z" | "pathDistance" | "time">;
        /**
         * previousNode에서 nextNode까지 경계 보간 비율(0~1)
         */
        t?: number;
    };

/**
     * 오래된 궤적 지점을 줄이고 최근 지점과 꺾임을 보호하는 정책입니다.
     */
    type SimplifyPolicy_Option = {
        /**
         * 자동 단순화 사용 여부. drawFunc 사용 중에는 단순화하지 않습니다. 폐기로 단절된 경로는 단절 경계를 보존하며 구간별로 단순화합니다.
         */
        simplify?: boolean;
        /**
         * 자동 단순화에 허용할 거리의 기준값이며 클수록 더 많은 지점을 생략합니다.
         */
        simplifyEpsilon?: number;
        /**
         * 단순화에서 보호할 최신 지점 수
         */
        protectedTailNodes?: number;
        /**
         * 급격하게 꺾이는 지점 주변을 단순화에서 보호할지 여부
         */
        protectCorners?: boolean;
        /**
         * 보호할 방향 변화 각도의 기준(도)이며 0 초과 180 미만
         */
        cornerAngle?: number;
        /**
         * 보호할 꺾임의 앞뒤에 함께 남길 지점 수
         */
        cornerProtectNodes?: number;
    };

/**
     * ~extends USimpleTailDrawNode <br>
     *
     * 색 농도를 포함해 보관하는 궤적 중심점입니다.
     */
    type USimpleTailNode = USimpleTailDrawNode & Partial<{
        colorFactor: number;
    }>;

/**
     * ~extends USimpleTailCommonPolicy <br>
     *
     * USimpleTail 생성 옵션이며 실제 그리기 자원은 initialize에서 준비합니다.
     */
    type USimpleTailCO_Content = {
        /**
         * 궤적 메시를 제거할 때 사용할 장면
         */
        scene?: three.Scene | null;
        /**
         * 궤적의 대상 이름
         */
        name?: string;
        /**
         * initialize에서 해제하고 새로 생성할 기존 geometry
         */
        geometry?: three.BufferGeometry | null;
        /**
         * initialize에서 장면에서 분리할 기존 메시
         */
        mesh?: three.Mesh | null;
        /**
         * 초기 중심점 목록이며 initialize 시 비웁니다.
         */
        nodeCenters?: Array<USimpleTailNode> | null;
        /**
         * 이전 중심점 참조
         */
        lastNodeCenter?: three.Vector3Like | null;
        /**
         * 최신 중심점 참조
         */
        currentNodeCenter?: three.Vector3Like | null;
        /**
         * 초기 지점 ID 배열이며 initialize에서 새로 준비합니다.
         */
        nodeIDs?: Array<number> | null;
        /**
         * 초기 지점 ID
         */
        currentNodeID?: number;
        /**
         * 초기 사용 지점 수이며 initialize 시 0으로 초기화합니다.
         */
        currentLength?: number;
        /**
         * 초기 마지막 지점 인덱스이며 initialize 시 -1로 초기화합니다.
         */
        currentEnd?: number;
        /**
         * 지점 추가에 재사용할 변환 행렬
         */
        tempMatrix4?: three.Matrix4;
    };

/**
     * ~extends USimpleTailCommonPolicy <br>
     *
     * USimpleTail 생성 옵션이며 실제 그리기 자원은 initialize에서 준비합니다.
     */
    type USimpleTailCO = Omit<Omit<USimpleTailCommonPolicy, never> & USimpleTailCO_Content, never>;

export type { SimplifyPolicy_Option, USimpleTail, USimpleTailCO, USimpleTailCO_Content, USimpleTailCommonPolicy, USimpleTailCommonPolicy_Content, USimpleTailDrawEvaluator, USimpleTailDrawNode, USimpleTailDrawResult, USimpleTailFadeOutCallback, USimpleTailFadeOutEvent, USimpleTailNode, USimpleTailPointMetadata, USimpleTail_Policy, USimpleTail_Policy_Content };
