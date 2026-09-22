// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UGroup } from "../core/UGroup.js";
import type { UBox3HelperGroupCO } from "./UBox3HelperGroup.types.js";

/**
 * ~extends import('@UGroup').UGroup <br>
 * Box3 입력을 순서대로 표시하고 다음 입력 묶음에서 기존 helper를 재사용하는 그룹이다.
 * add()로 이번 묶음을 채운 뒤 commit()으로 남는 helper를 제거하고 다음 입력 위치를 지정한다.
 * UBox3Helper 자체를 add()에 넘기면 재사용 위치를 진행하지 않고 자식으로만 등록한다.
 *
 * @group helpers
 */
declare class UBox3HelperGroup extends UGroup {
    /**
     * 상위 그룹 옵션을 그대로 전달한다.
     *
     * @param {UBox3HelperGroupCO} [option={}] 그룹 이름·drawarg 등을 포함한 상위 그룹 옵션.
     */
    constructor(option?: UBox3HelperGroupCO);
    /**
     * 경계 상자를 추가하거나 현재 재사용 위치의 helper를 갱신한다.
     * box3 또는 color가 falsy이면 아무것도 하지 않는다. 따라서 숫자 색상 0도 거부한다.
     * helper 입력은 전달한 color로 다시 칠하지 않으며, 지원하지 않는 입력은 무시한다.
     * Box3 경로에서는 재사용 위치를 먼저 증가시키므로 이후 작업이 실패해도 되돌리지 않는다.
     *
     * @override
     *
     * @param {unknown} box3 표시할 Box3 또는 직접 등록할 UBox3Helper.
     * @param {import('three').Color | string | number} [color=0xffff00] Box3 입력의 선 색상.
     * @returns {this} 체이닝할 현재 그룹. 하위 클래스의 반환 타입도 보존한다.
     */
    override add(box3: unknown, color?: three.Color | string | number): this;
    /**
     * 이번 묶음에서 사용하지 않은 뒤쪽 helper를 해제·제거하고 다음 입력 위치를 저장한다.
     * 제거 범위는 인수 cursor가 아니라 호출 직전의 내부 위치로 결정한다.
     * cursor의 정수·범위 검증은 하지 않으며, 중간 해제·제거에서 오류가 나면
     * 나머지 처리를 중단하고 새 cursor도 저장하지 않는다.
     *
     * @param {number} [cursor=0] 다음 Box3 입력에서 사용할 자식 위치.
     */
    commit(cursor?: number): void;
    #private;
}

export type { UBox3HelperGroup };
