// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { ColorLike, DegreeEulerLike, GeoPositionVector3, WorldPositionVector3 } from "../types/global.js";

/**
 * ~extends import('three').Group <br>
 * InstancedMesh 버킷을 사용해 많은 방향 화살표를 렌더링하는 그룹입니다.
 * 길이, 헤드 크기, 점선 길이, 색상, 투명도는 instance attribute로 처리합니다.
 *
 * @group helpers
 *
 * @extends {THREE.Group}
 *
 */
declare class UDirectionArrowGroup extends three.Group<three.Object3DEventMap> {
    /**
     * @param {UDirectionArrowGroupCO} [opt={}] 생성 옵션
     */
    constructor(opt?: UDirectionArrowGroupCO);
    /** @type {boolean} */ _disposed: boolean;
    name: any;
    capacity: number;
    autoSync: any;
    frustumCulled: any;
    renderOrder: any;
    targetForward: three.Vector3;
    /**
     * 현재 활성화된 화살표 개수를 반환합니다.
     *
     * @override
     * @returns {number}
     */
    override get count(): number;
    /**
     * 화살표 하나를 추가하고 id를 반환합니다.
     *
     * @param {UDirectionArrowGroupCO} [opt={}] 화살표 초기 옵션
     * @returns {number} 생성된 화살표 id
     * @throws {Error} 이미 해제되었거나 추가 중 콜백에서 해제된 그룹
     */
    addArrow(opt?: UDirectionArrowGroupCO): number;
    /**
     * 여러 화살표 속성을 한 번에 갱신합니다.
     * @param {number} id 화살표 id
     * @param {UDirectionArrowGroupCO} [opt={}] 갱신할 속성
     *
     * @example
     * arrow.applyArrowUpdate(0, {
     *     visible: true,
     *     lineThickness: 2
     *     lineLength: 10,
     *     headLength: 3,
     *     color: "#fff000",
     *     opacity: 0.5
     * });
     */
    applyArrowUpdate(id: number, opt?: UDirectionArrowGroupCO): this;
    /**
     * 화살표 표시 여부를 변경합니다.
     * @param {boolean} visible 표시 여부
     * @param {number} [id] 화살표 id
     *
     * @example
     * arrow.setVisible(true, 0); // id: 0만 적용
     * arrow.setVisible(false);   // 전체 적용
     */
    setVisible(visible: boolean, id?: number): this;
    /**
     * 화살표 길이를 변경합니다.
     * @param {number} lineLength 화살표 꼬리 길이
     * @param {number} [id] 화살표 id. 미입력 시 전체 화살표 변경
     *
     * @example
     * arrow.setLineLength(10, 0); // id: 0만 적용
     * arrow.setLineLength(5);     // 전체 적용
     */
    setLineLength(lineLength: number, id?: number): this;
    /**
     * 화살표 꼬리 두께를 변경합니다.
     * @param {number} lineThickness 화살표 꼬리 두께
     * @param {number} [id] 화살표 id. 미입력 시 전체 화살표 변경
     */
    setLineThickness(lineThickness: number, id?: number): this;
    /**
     * 화살촉(머리) 반지름을 변경합니다.
     * @param {number} headRadius 화살촉 반지름
     * @param {number} [id] 화살표 id. 미입력 시 전체 화살표 변경
     */
    setHeadRadius(headRadius: number, id?: number): this;
    /**
     * 화살촉 길이를 절대값으로 변경합니다.
     * 내부적으로 렌더링용 headRatio attribute로 변환하므로 버킷이 늘어나지 않습니다.
     * @param {number} headLength 화살촉 길이
     * @param {number} [id] 화살표 id. 미입력 시 전체 화살표 변경
     */
    setHeadLength(headLength: number, id?: number): this;
    /**
     * 점선 여부를 변경합니다.
     * @param {'solid'|'dashed'} shaftStyle 꼬리 스타일
     * @param {number} [id] 화살표 id. 미입력 시 전체 화살표 변경
     */
    setShaftStyle(shaftStyle: "solid" | "dashed", id?: number): this;
    /**
     * 점선 dash 길이를 변경합니다.
     * @param {number} dashLength dash 길이
     * @param {number} [id] 화살표 id. 미입력 시 전체 화살표 변경
     */
    setDashLength(dashLength: number, id?: number): this;
    /**
     * 점선 gap 길이를 변경합니다.
     * @param {number} gapLength gap 길이
     * @param {number} [id] 화살표 id. 미입력 시 전체 화살표 변경
     */
    setGapLength(gapLength: number, id?: number): this;
    /**
     * 방사형 분할 수를 변경합니다.
     * 이 값은 topology를 바꾸므로 해당 화살표를 다른 bucket으로 이동합니다.
     * @param {number} radialSegments 방사형 분할 수
     * @param {number} [id] 화살표 id. 미입력 시 전체 화살표 변경
     */
    setRadialSegments(radialSegments: number, id?: number): this;
    /**
     * depthTest 여부를 변경합니다. <br>
     * (depthTest : 앞에 있는 3D 객체가 뒤의 객체를 가리도록 깊이 값(depth)을 검사할지 여부)
     * @param {boolean} depthTest depth test 사용 여부
     * @param {number} [id] 화살표 id. 미입력 시 전체 화살표 변경
     */
    setDepthTest(depthTest: boolean, id?: number): this;
    /**
     * 화살표 위치를 직접 설정합니다.
     * @param {import('three').Vector3|import('three').Vector3Like|Array<number>} position 월드 위치
     * @param {number} [id] 화살표 id. 미입력 시 전체 화살표 변경
     */
    setPosition(position: three.Vector3 | three.Vector3Like | Array<number>, id?: number): this;
    /**
     * target 위치에 더할 offset을 설정합니다.
     * @param {import('three').Vector3|import('three').Vector3Like|Array<number>} offset 위치 보정값
     * @param {number} [id] 화살표 id. 미입력 시 전체 화살표 변경
     * @returns {this}
     */
    setOffset(offset: three.Vector3 | three.Vector3Like | Array<number>, id?: number): this;
    /**
     * 화살표 방향 정렬 이후에 추가로 적용할 회전 오프셋을 degree 단위로 설정합니다.
     * @param {import('three').Vector3 | import('three').Vector3Like | Array<number>} rotationOffset 회전 보정값(degree)
     * @param {number} [id] 화살표 id. 미입력 시 전체 화살표 변경
     */
    setRotationOffset(rotationOffset: three.Vector3 | three.Vector3Like | Array<number>, id?: number): this;
    /**
     * 화살표가 향할 기준 방향을 정합니다.
     * @param {import('three').Vector3|import('three').Vector3Like|Array<number>} direction 월드 위치
     * @param {number} [id] 화살표 id. 미입력 시 전체 화살표 변경
     */
    setDirection(direction: three.Vector3 | three.Vector3Like | Array<number>, id?: number): this;
    /**
     * 특정 위치를 바라보도록 방향을 설정합니다.
     * @param {import('three').Vector3|import('three').Vector3Like|Array<number>} lookAt 바라볼 위치
     * @param {number} [id] 화살표 id. 미입력 시 전체 화살표 변경
     */
    setLookAt(lookAt: three.Vector3 | three.Vector3Like | Array<number>, id?: number): this;
    /**
     * 색상을 변경합니다.
     * InstancedMesh의 instanceColor를 사용하므로 material bucket이 늘어나지 않습니다.
     * @param {import('three').Color|ColorLike} color 색상 또는 스타일 함수
     * @param {number} [id] 화살표 id. 미입력 시 전체 화살표 변경
     */
    setColor(color: three.Color | ColorLike, id?: number): this;
    /**
     * 화살표의 투명도를 변경합니다.
     * @param {UDirectionArrowOpacity} opacity 투명도 또는 스타일 함수. 투명도 입력시 0~1 사이의 값을 입력합니다.
     * @param {number} [id] 화살표 id. 미입력 시 전체 화살표 변경
     */
    setOpacity(opacity: UDirectionArrowOpacity, id?: number): this;
    /**
     * id에 해당하는 화살표의 출력(visible) 여부를 반환합니다.
     * @param {number} id 화살표 id
     * @returns {boolean|undefined} 출력(visible) 여부. 유효하지 않은 id면 undefined
     */
    getVisible(id: number): boolean | undefined;
    /**
     * id에 해당하는 화살표 꼬리 길이를 반환합니다.
     * @param {number} id 화살표 id
     * @returns {number|undefined} 화살표 꼬리 길이. 유효하지 않은 id면 undefined
     */
    getLineLength(id: number): number | undefined;
    /**
     * id에 해당하는 화살표 꼬리 두께를 반환합니다.
     * @param {number} id 화살표 id
     * @returns {number|undefined} 화살표 꼬리 두께. 유효하지 않은 id면 undefined
     */
    getLineThickness(id: number): number | undefined;
    /**
     * id에 해당하는 화살표 머리 반지름을 반환합니다.
     * @param {number} id 화살표 id
     * @returns {number|undefined} 화살표 머리 반지름. 유효하지 않은 id면 undefined
     */
    getHeadRadius(id: number): number | undefined;
    /**
     * id에 해당하는 화살표 머리 길이를 반환합니다.
     * @param {number} id 화살표 id
     * @returns {number|undefined} 화살표 머리 길이. 유효하지 않은 id면 undefined
     */
    getHeadLength(id: number): number | undefined;
    /**
     * id에 해당하는 화살표 꼬리 스타일을 반환합니다.
     * @param {number} id 화살표 id
     * @returns {'solid'|'dashed'|undefined} 화살표 꼬리 스타일. 유효하지 않은 id면 undefined
     */
    getShaftStyle(id: number): "solid" | "dashed" | undefined;
    /**
     * id에 해당하는 화살표 dash(점선 1개 구간) 길이를 반환합니다.
     * @param {number} id 화살표 id
     * @returns {number|undefined} 화살표 dash 길이. 유효하지 않은 id면 undefined
     */
    getDashLength(id: number): number | undefined;
    /**
     * id에 해당하는 화살표 gap(점선 간 간격) 길이를 반환합니다.
     * @param {number} id 화살표 id
     * @returns {number|undefined} 화살표 gap 길이. 유효하지 않은 id면 undefined
     */
    getGapLength(id: number): number | undefined;
    /**
     * id에 해당하는 화살표 radialSegments 값을 반환합니다.
     * @param {number} id 화살표 id
     * @returns {number|undefined} radialSegments 값. 유효하지 않은 id면 undefined
     */
    getRadialSegments(id: number): number | undefined;
    /**
     * id에 해당하는 화살표 depthTest 사용 여부를 반환합니다.
     * @param {number} id 화살표 id
     * @returns {boolean|undefined} depthTest 사용 여부. 유효하지 않은 id면 undefined
     */
    getDepthTest(id: number): boolean | undefined;
    /**
     * id에 해당하는 화살표 위치를 위경도 좌표로 반환합니다.
     * @param {number} id 화살표 id
     * @returns {GeoPositionVector3|undefined} 위경도 좌표({x: 경도, y: 위도, z: 고도}). 유효하지 않은 id면 undefined
     */
    getPosition(id: number): GeoPositionVector3 | undefined;
    /**
     * id에 해당하는 화살표 기준 위치를 월드 좌표로 반환합니다.
     * (기반 클래스 시그니처와의 호환을 위해 반환 타입에 undefined를 표기하지 않지만, 유효하지 않은 id면 undefined를 반환합니다.)
     * @override
     * @param {number|import('three').Vector3} id 화살표 id
     * @returns {WorldPositionVector3} 기준 위치 월드 좌표 복사본. 유효하지 않은 id면 undefined
     */
    override getWorldPosition(id: number | three.Vector3): WorldPositionVector3;
    /**
     * id에 해당하는 화살표 위치 offset을 반환합니다.
     * @param {number} id 화살표 id
     * @returns {import('three').Vector3|undefined} offset 복사본. 유효하지 않은 id면 undefined
     */
    getOffset(id: number): three.Vector3 | undefined;
    /**
     * id에 해당하는 화살표 회전 offset을 degree 단위로 반환합니다.
     * @param {number} id 화살표 id
     * @returns {import('three').Vector3|undefined} 회전 offset 복사본. 유효하지 않은 id면 undefined
     */
    getRotationOffset(id: number): three.Vector3 | undefined;
    /**
     * id에 해당하는 화살표 방향 벡터를 반환합니다.
     * @param {number} id 화살표 id
     * @returns {import('three').Vector3|undefined} 방향 벡터 복사본. 유효하지 않은 id면 undefined
     */
    getDirection(id: number): three.Vector3 | undefined;
    /**
     * id에 해당하는 화살표 색상 설정값을 반환합니다.
     * @param {number} id 화살표 id
     * @returns {THREE.Color|undefined} 실제 적용 색상. 유효하지 않은 id면 undefined
     */
    getColor(id: number): three.Color | undefined;
    /**
     * id에 해당하는 화살표 투명도 설정값을 반환합니다.
     * @param {number} id 화살표 id
     * @returns {number|undefined} 실제 적용 투명도. 유효하지 않은 id면 undefined
     */
    getOpacity(id: number): number | undefined;
    /**
     * id에 해당하는 화살표 정보를 반환합니다.
     * Vector3 값은 외부 변경이 내부 상태에 영향을 주지 않도록 복사본으로 반환합니다.
     * @param {number} id 화살표 id
     * @returns {object|undefined} 화살표 정보. 유효하지 않은 id면 undefined
     */
    getArrowInfo(id: number): object | undefined;
    /**
     * target에 붙은 화살표의 위치/방향과 컬링 상태를 갱신합니다.
     * @param {number|import('three').Camera} [idOrCamera] 화살표 id 또는 렌더 카메라
     * @param {import('three').Camera} [camera] 렌더 카메라
     */
    update(idOrCamera?: number | three.Camera, camera?: three.Camera): this;
    /**
     * 특정 target에 붙어 있는 화살표 id 목록을 반환합니다.
     * @param {unknown} target 조회할 target 객체
     * @returns {Array<number>} 화살표 id 목록
     */
    getAttachedIds(target: unknown): Array<number>;
    /**
     * 화살표 하나를 제거합니다.
     * @param {number | unknown} targetOrId 화살표 id 또는 화살표 대상 객체
     */
    removeArrow(targetOrId: number | unknown): this;
    /**
     * 모든 화살표를 제거하고 bucket count를 초기화합니다.
     * @override
     */
    override clear(): this;
    /**
     * 디버깅용 bucket 통계를 반환합니다.
     * @returns {Array<object>} bucket별 count/capacity 정보
     */
    getStatus(): Array<object>;
    #private;
}

/**
     * 방향 화살표 하나의 내부 상태입니다.
     */
    type UDirectionArrow_State = {
        /**
         * 화살표가 현재 사용 중인지 여부
         */
        active: boolean;
        /**
         * 위치/방향을 추적하는 대상 객체
         */
        target?: unknown;
        /**
         * 화살표 표시 여부
         */
        visible: boolean;
        /**
         * offset을 target 방향 기준 로컬 좌표로 적용할지 여부
         */
        localOffset: boolean;
        /**
         * target의 위치/회전 프레임을 사용할지 여부
         */
        useTargetFrame: boolean;
        /**
         * 화살표 꼬리 길이
         */
        lineLength: number;
        /**
         * 화살표 꼬리 두께
         */
        lineThickness: number;
        /**
         * 화살촉 반지름
         */
        headRadius: number;
        /**
         * 화살촉 길이
         */
        headLength: number;
        /**
         * 내부 렌더링용 화살촉 비율
         */
        headRatio: number;
        /**
         * 화살표 꼬리 스타일('실선' | '점선')
         */
        shaftStyle: "solid" | "dashed";
        /**
         * 점선 dash 길이
         */
        dashLength: number;
        /**
         * 점선 gap 길이
         */
        gapLength: number;
        /**
         * 원통/원뿔 방사형 분할 수
         */
        radialSegments: number;
        /**
         * depth test 사용 여부
         */
        depthTest: boolean;
        /**
         * 색상 또는 색상 함수
         */
        color: UDirectionArrowColor;
        /**
         * 투명도 또는 투명도 함수
         */
        opacity: UDirectionArrowOpacity;
        /**
         * 화살표 기준 월드 위치
         */
        position: three.Vector3;
        /**
         * 화살표 방향 벡터
         */
        direction: three.Vector3;
        /**
         * 위치 오프셋
         */
        offset: three.Vector3;
        /**
         * 방향 정렬 이후 추가 적용할 회전 오프셋(degree)
         */
        rotationOffset: three.Vector3;
    };

/**
     * 방향 화살표 스타일 함수에 전달되는 컨텍스트입니다.
     */
    type UDirectionArrowStyleContext = {
        /**
         * 화살표 id
         */
        id: number;
        /**
         * 화살표 내부 상태
         */
        state: UDirectionArrow_State;
        /**
         * offset 적용 후 계산된 실제 렌더 월드 위치(state 값 복사가 아님)
         */
        position: three.Vector3;
        /**
         * 내부 버퍼에서 읽은 현재 렌더 방향 벡터
         */
        direction: three.Vector3;
        /**
         * 최소값 보정(clamp)된 꼬리 길이
         */
        lineLength: number;
        /**
         * 최소값 보정(clamp)된 꼬리 두께
         */
        lineThickness: number;
        /**
         * 화살촉 길이(state.headLength와 동일)
         */
        headLength: number;
    };

/**
     * 화살표 색상 콜백 함수
     */
    type InputColorCallback = (arrowStyle: UDirectionArrowStyleContext) => ColorLike;

/**
     * 화살표 투명도 콜백 함수
     */
    type InputOpacityCallback = (arrowStyle: UDirectionArrowStyleContext) => number;

/**
     * 방향 화살표 색상 입력값입니다.
     */
    type UDirectionArrowColor = ColorLike | InputColorCallback;

/**
     * 방향 화살표 투명도 입력값입니다.
     */
    type UDirectionArrowOpacity = number | InputOpacityCallback;

/**
     * 방향 화살표 그룹 생성 및 개별 화살표 생성 옵션입니다.
     */
    type UDirectionArrowGroupCO = {
        /**
         * 그룹 이름
         */
        name?: string;
        /**
         * 전체 화살표 최대 개수
         */
        capacity?: number;
        /**
         * bucket별 초기 InstancedMesh capacity
         */
        bucketInitialCapacity?: number;
        /**
         * matrixWorld 갱신 시 target 위치/방향을 자동 동기화할지 여부
         */
        autoSync?: boolean;
        /**
         * bucket mesh의 Three.js frustum culling 사용 여부
         */
        frustumCulled?: boolean;
        /**
         * bucket mesh renderOrder
         */
        renderOrder?: number;
        /**
         * update 시 카메라 기준 거리/화면 영역 컬링을 사용할지 여부
         */
        cullByCamera?: boolean;
        /**
         * 카메라와 이 거리보다 멀면 숨깁니다.
         */
        maxDistance?: number;
        /**
         * 화면 밖 컬링 여유값
         */
        screenCullMargin?: number;
        /**
         * depth test 사용 여부
         */
        depthTest?: boolean;
        /**
         * target의 기준 forward 방향
         */
        targetForward?: three.Vector3 | three.Vector3Like | Array<number>;
        /**
         * 위치/방향을 따라갈 대상
         */
        target?: unknown;
        /**
         * 화살표 표시 여부
         */
        visible?: boolean;
        /**
         * offset을 target 방향 기준 로컬 좌표로 적용할지 여부
         */
        localOffset?: boolean;
        /**
         * target이 없을 때 사용할 월드 위치
         */
        position?: three.Vector3 | three.Vector3Like | Array<number>;
        /**
         * 화살표 방향 벡터
         */
        direction?: three.Vector3 | three.Vector3Like | Array<number>;
        /**
         * 바라볼 월드 위치
         */
        lookAt?: three.Vector3 | three.Vector3Like | Array<number>;
        /**
         * 위치 오프셋
         */
        offset?: three.Vector3 | three.Vector3Like | Array<number>;
        /**
         * 방향 정렬 이후 추가 적용할 회전 오프셋(degree)
         */
        rotationOffset?: three.Vector3 | three.Euler | DegreeEulerLike | Array<number>;
        /**
         * 화살표 꼬리 길이
         */
        lineLength?: number;
        /**
         * 화살표 꼬리 두께
         */
        lineThickness?: number;
        /**
         * 화살촉 반지름
         */
        headRadius?: number;
        /**
         * 화살촉 길이
         */
        headLength?: number;
        /**
         * 꼬리 스타일
         */
        shaftStyle?: "solid" | "dashed";
        /**
         * 점선 dash 길이
         */
        dashLength?: number;
        /**
         * 점선 gap 길이
         */
        gapLength?: number;
        /**
         * 원통/원뿔 방사형 분할 수
         */
        radialSegments?: number;
        /**
         * 색상 또는 색상 함수
         */
        color?: UDirectionArrowColor;
        /**
         * 투명도 또는 투명도 함수
         */
        opacity?: UDirectionArrowOpacity;
    };

/**
     * 화살표 길이/두께/헤드 비율 계산에 필요한 최소 형상 값입니다.
     * headRatio는 setter 경유 시 syncShapeRatio가 계산해 채웁니다.
     */
    type UDirectionArrowShape = Pick<UDirectionArrow_State, "lineLength" | "lineThickness" | "headLength"> & Partial<Pick<UDirectionArrow_State, "headRatio">>;

/**
     * 그룹 생성 시 결정되는 기본 형상 옵션입니다.
     * 속성 정의와 설명은 UDirectionArrow_State에서 파생합니다(중복 선언 방지).
     * headRatio는 setter 경유 시 syncShapeRatio가 계산해 채웁니다.
     */
    type UDirectionArrowGeometryDefaults = Pick<UDirectionArrow_State, "radialSegments" | "depthTest" | "lineLength" | "lineThickness" | "headRadius" | "headLength" | "shaftStyle" | "dashLength" | "gapLength"> & Partial<Pick<UDirectionArrow_State, "headRatio">>;

/**
     * 그룹 생성 시 결정되는 기본 스타일 옵션입니다.
     */
    type UDirectionArrowStyleDefaults = {
        /**
         * 기본 색상 또는 색상 함수
         */
        color: UDirectionArrowColor;
        /**
         * 기본 투명도 또는 투명도 함수
         */
        opacity: UDirectionArrowOpacity;
    };

/**
     * 동일 topology(radialSegments/depthTest) 화살표들을 담는 InstancedMesh bucket입니다.
     */
    type UDirectionArrowBucket = {
        /**
         * bucket key(topology를 담은 JSON 문자열)
         */
        key: string;
        /**
         * instancing용 mesh
         */
        mesh: three.InstancedMesh<three.BufferGeometry, three.ShaderMaterial>;
        /**
         * instance attribute가 포함된 geometry
         */
        geometry: three.BufferGeometry;
        /**
         * 화살표 material
         */
        material: three.ShaderMaterial;
        /**
         * 현재 InstancedMesh capacity
         */
        capacity: number;
        /**
         * 사용 중인 instance 개수
         */
        count: number;
        /**
         * bucket 내부 index 순서의 화살표 id 목록
         */
        ids: Array<number>;
    };

/**
     * 화살표 id가 어느 bucket의 몇 번째 instance인지 기록하는 레코드입니다.
     */
    type UDirectionArrowRecord = {
        /**
         * 소속 bucket
         */
        bucket: UDirectionArrowBucket;
        /**
         * bucket 내부 instance index
         */
        index: number;
    };

/**
     * 화살표가 추적하는 target 객체가 가질 수 있는 멤버(duck-typing) 형태입니다.
     */
    type UDirectionArrowTarget = {
        /**
         * 위치를 반환하는 함수
         */
        getVectorPosition?: () => three.Vector3;
        /**
         * 위치
         */
        position?: three.Vector3 | three.Vector3Like;
        /**
         * 내부 위치
         */
        _position?: three.Vector3;
        /**
         * 해제 여부
         */
        _disposed?: boolean;
        /**
         * 자원을 보존한 모델의 휴면 여부
         */
        _sleeping?: boolean;
        /**
         * 해제 여부 또는 이를 반환하는 함수
         */
        isDisposed?: boolean | (() => boolean);
        /**
         * 바라볼 지점 또는 바라보게 하는 함수
         */
        lookAt?: three.Vector3 | ((...args: any[]) => any);
        /**
         * 회전
         */
        quaternion?: three.Quaternion;
        /**
         * 내부 회전
         */
        _quaternion?: three.Quaternion;
        /**
         * 월드 회전을 반환하는 함수
         */
        getWorldQuaternion?: (arg0: three.Quaternion) => three.Quaternion;
    };

export type { InputColorCallback, InputOpacityCallback, UDirectionArrowBucket, UDirectionArrowColor, UDirectionArrowGeometryDefaults, UDirectionArrowGroup, UDirectionArrowGroupCO, UDirectionArrowOpacity, UDirectionArrowRecord, UDirectionArrowShape, UDirectionArrowStyleContext, UDirectionArrowStyleDefaults, UDirectionArrowTarget, UDirectionArrow_State };
