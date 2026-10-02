// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UDrawArg } from "./UDrawArg.js";
import type { UGroupCO, UGroupComponent, UGroupMember } from "./UGroup.types.js";

/**
 * ~extends import('three').Group <br>
 *
 * 여러 3차원 객체를 담는 장면 그래프 그룹이며 일반·인스턴스 컴포넌트도 논리 구성원으로 등록할 수 있습니다. <br>
 * 컴포넌트는 렌더 부모를 유지하며 그룹 변환에는 포함되지 않습니다. 색상·투명도는 컴포넌트 API에 위임합니다. <br>
 * 같은 객체가 두 번 등록되지 않도록 자식 목록을 관리하고, 자식이 빠질 때 이를 알리는 이벤트를 전달합니다. <br>
 * 자식을 하나씩 돌아가며 선택하거나, 레이어 이름으로 메시(mesh)를 찾거나, 하위 메시의 재질(material) 상태를 한 번에 바꾸는 기능도 제공합니다.
 *
 * @group util
 */
declare class UGroup extends three.Group<three.Object3DEventMap> {
    /**
     * UGroup 클래스 생성자입니다. <br>
     * 자식이 없는 빈 그룹을 만들고 생성 옵션의 이름과 렌더링 실행 인자를 저장합니다.
     *
     * @param {UGroupCO} [opt = {}] 그룹 이름과 렌더링 실행 인자를 담은 생성 옵션이며, 생략하면 이름이 빈 문자열인 그룹을 만듭니다
     */
    constructor(opt?: UGroupCO);
    /**
     * 생성 옵션으로 받아 둔 렌더링 실행 인자이며, 그룹을 그릴 때 사용할 설정을 담습니다. <br>
     * 이 그룹은 값을 보관만 하고 스스로 사용하지 않으며, 생성 옵션에 값을 주지 않으면 undefined입니다.
     *
     * @type {import('@UDrawArg').UDrawArg | undefined}
     */
    _drawArg: UDrawArg | undefined;
    /**
     * 자식들의 경계 상자를 합쳐 보관하도록 만들어 둔 내부 상태입니다.
     *
     * @type {import('three').Box3 | undefined}
     *
     * @ignore
     */
    _boundingBox: three.Box3 | undefined;
    /**
     * 내부 순환 선택기가 가리키는 다음 위치의 자식을 반환합니다. <br>
     * 호출할 때마다 선택 위치가 한 칸씩 뒤로 이동합니다. <br>
     * 위치가 자식 목록의 끝을 지난 호출은 자식 대신 undefined를 한 번 돌려준 뒤, 그다음 호출부터 다시 첫 자식으로 돌아갑니다. <br>
     * 모든 자식을 한 번에 처리하지 않고 호출마다 나누어 처리할 때 사용합니다.
     *
     * @returns {import('three').Object3D | undefined} 이번 호출에서 선택된 자식이며, 선택 위치가 자식 목록의 끝을 지난 호출에서는 undefined
     */
    next(): three.Object3D | undefined;
    /**
     * 입력한 객체가 이 그룹의 add()로 등록된 자식 또는 컴포넌트인지 확인합니다. <br>
     * 식별자가 아니라 객체 자체가 같은지로 비교하며, 자식의 자식까지 내려가 찾지는 않습니다.
     *
     * @param {UGroupMember} object 등록 여부를 확인할 객체 또는 컴포넌트
     * @returns {boolean} add()로 등록된 뒤 아직 제거되지 않았으면 true
     */
    has(object: UGroupMember): boolean;
    /**
     * Object3D를 직속 자식으로 추가하거나 컴포넌트를 논리 구성원으로 등록합니다. <br>
     * 값이 비어 있거나 이미 등록된 객체이면 아무것도 바꾸지 않습니다. <br>
     * 상위 THREE.Group의 add()처럼 여러 인수를 순서대로 추가하며 인수가 없으면 아무것도 바꾸지 않습니다. <br>
     * 추가된 객체는 이전 부모에서 떨어져 나오며, 객체의 added 이벤트와 이 그룹의 childadded 이벤트가 곧바로 전달됩니다.
     *
     * @override
     *
     * 컴포넌트는 별도 구성원으로 등록하며 렌더 객체나 컴포넌트의 부모를 변경하지 않습니다. <br>
     * 컴포넌트 등록은 그룹에 componentadded 이벤트를 전달하며 그룹 변환의 대상이 되지 않습니다.
     *
     * 공개 타입은 THREE.Group과 동일하게 유지합니다. 컴포넌트 입력은 내부에서 판별하며 타입 검사 호출부에서는 명시적인 타입 단언이 필요합니다.
     *
     * @param {import('three').Object3D} object 직속 자식 또는 내부적으로 판별할 컴포넌트
     * @returns {this} 메서드를 이어서 호출할 수 있도록 반환하는 이 그룹 자신
     */
    override add(object: three.Object3D, ...args: any[]): this;
    /**
     * 입력한 객체를 이 그룹의 직속 자식과 등록 목록에서 제거합니다. <br>
     * 인수를 여러 개 넘기면 넘긴 순서대로 각 객체를 같은 방식으로 제거합니다. <br>
     * 제거된 객체에는 removed 이벤트가, 이 그룹에는 제거된 객체를 담은 childremoved 이벤트가 곧바로 전달됩니다. <br>
     * 제거된 객체의 지오메트리(geometry)와 재질(material) 같은 렌더링 자원은 해제하지 않으므로 필요하면 호출자가 직접 해제하십시오.
     *
     * @override
     *
     * 컴포넌트는 등록만 해제하고 componentremoved 이벤트를 전달합니다. 레이어에서 삭제하거나 자원을 해제하지 않습니다.
     *
     * @param {import('three').Object3D} object 제거할 객체 또는 내부적으로 판별할 컴포넌트. 인수가 없으면 아무것도 바꾸지 않습니다.
     * @returns {this} 메서드를 이어서 호출할 수 있도록 반환하는 이 그룹 자신
     */
    override remove(object: three.Object3D, ...args: any[]): this;
    /**
     * 컴포넌트 구성원의 복사본을 등록 순서로 반환합니다.
     * @returns {Array<UGroupComponent>} 일반·인스턴스 컴포넌트 목록
     */
    getComponents(): Array<UGroupComponent>;
    /**
     * 직접 자식 Object3D와 등록 컴포넌트의 복사본을 반환합니다. 하위 그룹은 펼치지 않습니다.
     * @returns {Array<UGroupMember>} Object3D 자식 다음에 등록 순서의 컴포넌트가 오는 전체 구성원 목록
     */
    getMembers(): Array<UGroupMember>;
    /**
     * 모든 자식과 컴포넌트를 remove()로 해제합니다. 렌더 자원과 컴포넌트는 삭제하지 않습니다.
     * @override
     * @returns {this} 현재 그룹
     */
    override clear(): this;
    /**
     * 직속 자식 목록과 컴포넌트 등록 목록을 즉시 비웁니다. <br>
     * remove()와 달리 removed와 childremoved 이벤트를 전달하지 않고, 자식의 부모 연결을 끊지 않으며, 렌더링 자원도 해제하지 않습니다. <br>
     * 화면을 한 번 그릴 때마다 새로 채우는 임시 그룹처럼 자식 기록을 빠르게 버려도 되는 경우에 사용합니다.
     */
    fastClear(): void;
    /**
     * 하위 메시의 월드 경계 중심과 등록 컴포넌트의 월드 위치를 평균합니다.
     * 컴포넌트는 공유 렌더 객체와 무관하게 한 번씩 포함하며, 빈 그룹은 (0, 0, 0)을 반환합니다.
     * @returns {import('three').Vector3} 월드 중심
     */
    getCenter(): three.Vector3;
    /**
     * 직접 자식 Object3D와 등록 컴포넌트의 목록 복사본을 반환합니다.
     * 하위 그룹은 펼치지 않습니다. 렌더 자식만 필요하면 children을 사용합니다.
     * @returns {Array<UGroupMember>} 직접 구성원 목록
     */
    getChildren(): Array<UGroupMember>;
    /**
     * 인자가 없으면 이 그룹의 장면 그래프 부모를 반환합니다.
     * 컴포넌트를 전달하면 이 그룹에 직접 등록된 경우 현재 그룹을, 아니면 undefined를 반환합니다.
     * 컴포넌트의 기존 부모나 다른 그룹의 등록 상태는 변경하지 않습니다.
     * @param {UGroupComponent} [component] 소속 여부를 확인할 컴포넌트
     * @returns {import('three').Object3D | undefined} 부모 또는 컴포넌트가 등록된 현재 그룹
     */
    getParent(component?: UGroupComponent): three.Object3D | undefined;
    /**
     * 일반 메시와 일반 컴포넌트의 알파 맵을 보관하고 제거합니다.
     * 인스턴스 컴포넌트·메시는 공유 재질을 수정하지 않고 콘솔 경고를 출력합니다.
     */
    removeAlphaMap(): void;
    /**
     * 일반 메시와 일반 컴포넌트의 보관된 알파 맵을 복원합니다.
     * 인스턴스 컴포넌트·메시는 공유 재질을 수정하지 않고 콘솔 경고를 출력합니다.
     */
    resetAlphaMap(): void;
    /**
     * 일반 메시와 일반 컴포넌트의 알파 테스트 기준값을 변경합니다.
     * 인스턴스 컴포넌트·메시는 공유 재질을 수정하지 않고 콘솔 경고를 출력합니다.
     * @param {number} alphaFilter 알파 테스트 기준값
     */
    setAlphaTest(alphaFilter: number): void;
    /**
     * 하위 메시 및 일반·인스턴스 컴포넌트의 투명도를 변경합니다.
     * 컴포넌트는 setOpacity()에 위임하여 인스턴스별 투명도를 유지합니다.
     * @param {number} opacity 불투명도 (0~1)
     */
    setOpacity(opacity: number): void;
    /**
     * 하위 메시 및 일반·인스턴스 컴포넌트의 색상을 변경합니다.
     * 컴포넌트는 setColor()에 위임하여 인스턴스별 색상을 유지합니다.
     * @param {import('three').ColorRepresentation} color 색상
     */
    setColor(color: three.ColorRepresentation): void;
    /**
     * 객체를 구분하는 식별자 하나를 꺼냅니다. <br>
     * getUid()를 제공하는 객체는 그 반환값을 쓰고, 없으면 uuid, _uuid, _id 순으로 처음 발견한 값을 사용합니다. <br>
     * 직속 자식 목록과 등록 목록이 어긋났을 때 같은 객체를 다시 찾는 데 사용합니다.
     *
     * @param {import('three').Object3D & Partial<{getUid: (function(): (undefined | string | number)), _uuid: string | number, _id: string | number}>} object 식별자를 꺼낼 대상 객체
     * @returns {string | number | undefined} 찾아낸 식별자이며, 어느 값도 얻지 못하면 undefined
     */
    getId(object: three.Object3D & Partial<{
        getUid: (() => (undefined | string | number));
        _uuid: string | number;
        _id: string | number;
    }>): string | number | undefined;
    #private;
}

export type { UGroup };
