// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UDirectionArrowGroupCO, UDirectionArrowOpacity } from "./UDirectionArrowGroup.types.js";
import type { ColorLike, GeoPositionVector3, WorldPositionVector3 } from "../types/global.types.js";

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

export type { UDirectionArrowGroup };
