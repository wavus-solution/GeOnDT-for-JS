// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dGroupLayerCO, U3dGroupLayerChild } from "./U3dGroupLayer.types.js";
import type { U3dLayer } from "./U3dLayer.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";

/**
 * ~extends import('@U3dLayer').U3dLayer <br>
 * 여러 개의 레이어를 하나의 그룹 레이어로 묶어 일괄 관리하는 레이어 클래스 <br>
 * 가시화(show/hide), 투명도, 이벤트 등을 묶음 단위로 제어할 수 있다.
 *
 * @group 3dLayer
 * @extends {U3dLayer}
 */
declare class U3dGroupLayer extends U3dLayer {
    /**
     * 자식 배열을 공유하는 그룹 레이어를 생성한다. <br>
     * 초기 자식은 현재 표시 상태를 즉시 전달받은 뒤 부모 그룹에 연결된다.
     * 생성 시에는 자식 경계를 합산하지 않으며, 경계는 이후 addLayer 호출에서 누적한다.
     *
     * @param {U3dGroupLayerCO} [opt={}] 생성자 옵션
     */
    constructor(opt?: U3dGroupLayerCO);
    /**
     * 자식 목록의 공유 참조. 마스크 분석 등의 내부 연계에서도 사용한다.
     *
     * @type {Array<U3dGroupLayerChild>}
     */
    _listlayer: Array<U3dGroupLayerChild>;
    /**
     * 추가된 자식의 경계를 누적한 참조. 생성 입력의 경계는 자동 합산하지 않는다.
     *
     * @override
     *
     * @type {import('three').Box3 | undefined}
     */
    override _boundingBox: three.Box3 | undefined;
    /**
     * 자식들의 표시 상태를 변경한 뒤 앱에 한 번 갱신을 요청한다. <br>
     * 앱이 연결되지 않았으면 안내 로그만 남기고 그룹의 표시 상태도 바꾸지 않는다.
     * 자식 호출의 동기 예외는 전달되며, 이 경우 뒤의 자식과 앱 갱신은 실행하지 않는다.
     *
     * @override
     *
     * @param {boolean} show 가시화 여부. true면 그룹 내 모든 레이어 가시화
     */
    override show(show: boolean): void;
    /**
     * 그룹에 포함된 자식 레이어 목록을 반환하는 함수
     *
     * @returns {Array<U3dGroupLayerChild>} 원본 자식 배열. 직접 수정하면 목록은 바뀌지만 부모 연결·표시·경계 누적은 자동 실행되지 않는다
     */
    getChildren(): Array<U3dGroupLayerChild>;
    /**
     * 자식 레이어를 그룹에 연결하고 경계를 누적한 뒤 목록에 추가한다. <br>
     * 같은 객체가 이미 있거나 자식 이름과 그룹 자신의 이름이 느슨한 비교로 같으면 거절한다.
     * 다른 자식끼리 이름이 같은지는 검사하지 않는다. <br>
     * ready가 있으면 우선 사용하고, 없으면 then, 둘 다 없으면 즉시 표시 상태를 전달한다.
     * 준비 성공 콜백은 실행 당시의 그룹 표시 상태를 읽는다. 준비 완료를 기다리지 않고 등록 결과를 반환한다.
     * 준비 실패는 경로별 오류 로그로 알리며, 동기 예외는 앞선 변경을 되돌리지 않고 전달한다. <br>
     * 최초 경계는 자식의 min·max 벡터를 공유하므로 이후 누적이 해당 자식 경계에도 반영될 수 있다.
     *
     * @param {U3dGroupLayerChild} layer 추가할 자식 레이어
     * @returns {boolean} 목록에 추가하면 true. 이미 같은 객체가 있거나 그룹 이름과 충돌하면 false
     */
    addLayer(layer: U3dGroupLayerChild): boolean;
    /**
     * addLayer 호출로 누적된 그룹 경계 상자를 반환한다. <br>
     * 생성 옵션의 자식이나 외부 배열 변경을 기준으로 다시 계산하지 않으며, 해제 후에도 저장된 경계는 남는다.
     *
     * @returns {import('three').Box3 | undefined} 저장된 경계의 원본 참조. 아직 누적된 경계가 없으면 undefined
     */
    getBoundingBox(): three.Box3 | undefined;
    /**
     * 그룹에 포함된 모든 자식 레이어의 emissive(자체 발광) 색상을 일괄 설정하는 함수
     *
     * @param {number} r Red 채널 값 (0~1)
     * @param {number} g Green 채널 값 (0~1)
     * @param {number} b Blue 채널 값 (0~1)
     * @returns {boolean} 동기 예외 없이 순회를 마치면 true(빈 목록 포함). 예외가 발생하면 이전 자식의 변경은 유지하고 false
     */
    setEmissiveColor(r: number, g: number, b: number): boolean;
    /**
     * 그룹 내 자식 레이어 중 처리 중인 상태 타일이 있는 레이어들의 정보를 콘솔에 출력하는 함수 <br>
     * 디버깅용
     *
     * @override
     *
     * @returns {number} 처리 중인 상태 타일이 있는 자식 레이어 수
     */
    override printStateTiles(): number;
    /**
     * 그룹 자체는 모델을 생성하지 않는다. 기반 레이어의 타일 생성 훅을 무동작으로 재정의한다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @param {object} [opt] 옵션
     *
     * @ignore
     */
    override createModel(tile: U3dQuadTile, opt?: object): void;
    /**
     * 그룹 자체는 타일 해제를 수행하지 않는다. 자식 레이어가 각자의 타일 수명을 관리한다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     *
     * @ignore
     */
    override disposeTile(tile: U3dQuadTile): void;
}

export type { U3dGroupLayer };
