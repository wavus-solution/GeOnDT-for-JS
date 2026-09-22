// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UDrawArg } from "./UDrawArg.js";
import type { UGroupCO } from "./UGroup.types.js";
import type { UMesh } from "./mesh/UMesh.js";

/**
 * ~extends import('three').Group <br>
 *
 * 여러 3차원 객체를 한 묶음으로 담아 함께 옮기고 함께 다루는 장면 그래프 그룹입니다. <br>
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
     * 입력한 객체가 이 그룹의 add()로 등록된 자식인지 확인합니다. <br>
     * 식별자가 아니라 객체 자체가 같은지로 비교하며, 자식의 자식까지 내려가 찾지는 않습니다.
     *
     * @param {import('three').Object3D} object 등록 여부를 확인할 객체
     * @returns {boolean} add()로 등록된 뒤 아직 제거되지 않았으면 true
     */
    has(object: three.Object3D): boolean;
    /**
     * 객체 하나를 이 그룹의 직속 자식으로 추가합니다. <br>
     * 값이 비어 있거나 이미 등록된 객체이면 아무것도 바꾸지 않습니다. <br>
     * 상위 THREE.Group의 add()와 달리 인수를 여러 개 넘겨도 첫 번째 객체 하나만 추가합니다. <br>
     * 추가된 객체는 이전 부모에서 떨어져 나오며, 객체의 added 이벤트와 이 그룹의 childadded 이벤트가 곧바로 전달됩니다.
     *
     * @override
     *
     * @param {import('three').Object3D} object 직속 자식으로 추가할 객체
     * @returns {this} 메서드를 이어서 호출할 수 있도록 반환하는 이 그룹 자신
     */
    override add(object: three.Object3D): this;
    /**
     * 입력한 객체를 이 그룹의 직속 자식과 등록 목록에서 제거합니다. <br>
     * 인수를 여러 개 넘기면 넘긴 순서대로 각 객체를 같은 방식으로 제거합니다. <br>
     * 제거된 객체에는 removed 이벤트가, 이 그룹에는 제거된 객체를 담은 childremoved 이벤트가 곧바로 전달됩니다. <br>
     * 제거된 객체의 지오메트리(geometry)와 재질(material) 같은 렌더링 자원은 해제하지 않으므로 필요하면 호출자가 직접 해제하십시오.
     *
     * @override
     *
     * @param {import('three').Object3D} object 제거할 객체이며, 두 번째 인수부터 함께 넘긴 객체도 같은 방식으로 제거됩니다
     * @returns {this} 메서드를 이어서 호출할 수 있도록 반환하는 이 그룹 자신
     */
    override remove(object: three.Object3D, ...args: any[]): this;
    /**
     * 직속 자식 목록과 등록 목록을 즉시 비웁니다. <br>
     * remove()와 달리 removed와 childremoved 이벤트를 전달하지 않고, 자식의 부모 연결을 끊지 않으며, 렌더링 자원도 해제하지 않습니다. <br>
     * 화면을 한 번 그릴 때마다 새로 채우는 임시 그룹처럼 자식 기록을 빠르게 버려도 되는 경우에 사용합니다.
     */
    fastClear(): void;
    /**
     * 하위 메시(mesh)들의 지오메트리(geometry) 경계 상자 중심을 모두 더해 평균한 지점(center)을 계산합니다. <br>
     * 각 중심에는 그 메시가 아니라 그 메시를 품고 있는 직속 자식의 현재 월드 변환 행렬을 적용하며, 행렬을 계산 시점에 갱신하지는 않습니다. <br>
     * 계산 과정에서 대상 메시의 지오메트리 경계 상자(BoundingBox)를 다시 계산합니다. <br>
     * 경계 상자를 얻은 메시가 하나도 없으면 x, y, z가 모두 NaN인 결과를 반환합니다.
     *
     * @returns {import('three').Vector3} 계산한 중심 지점을 담은 새 벡터
     */
    getCenter(): three.Vector3;
    /**
     * 이 그룹의 직속 자식 목록을 반환합니다. <br>
     * 반환값은 복사본이 아니라 그룹이 실제로 사용하는 배열입니다.
     *
     * @returns {Array<import('three').Object3D>} 직속 자식이 담긴 내부 배열
     */
    getChildren(): Array<three.Object3D>;
    /**
     * 이 그룹이 현재 붙어 있는 상위 객체(parent)를 반환합니다.
     *
     * @returns {import('three').Object3D | undefined} 상위 객체이며, 어디에도 붙어 있지 않으면 undefined
     */
    getParent(): three.Object3D | undefined;
    /**
     * 자식의 재질(material)에서 알파 맵(alpha map) 텍스처를 떼어 내고 떼어 낸 값을 그 재질 안에 보관합니다. <br>
     * 보관한 값은 resetAlphaMap()으로 되돌릴 수 있으며, 텍스처 자체는 해제하지 않습니다. <br>
     * 자식이 재질을 배열로 가지고 있으면 배열 안의 재질을 하나씩 처리합니다. <br>
     * 직속 자식만 처리하고 그보다 아래 자손은 건드리지 않습니다.
     */
    removeAlphaMap(): void;
    /**
     * removeAlphaMap()이 떼어 내 보관해 둔 알파 맵(alpha map) 텍스처를 직속 자식의 재질(material)에 다시 붙입니다. <br>
     * 보관된 값이 없는 재질은 그대로 둡니다. <br>
     * 자식이 재질을 배열로 가지고 있으면 배열 안의 재질을 하나씩 처리합니다. <br>
     * 직속 자식만 처리하고 그보다 아래 자손은 건드리지 않습니다.
     */
    resetAlphaMap(): void;
    /**
     * 자식의 재질(material)에 알파 테스트(alpha test) 기준값을 지정하여, 기준에 못 미치는 투명한 픽셀을 그리지 않게 합니다. <br>
     * 바꾸기 전 값을 그 재질 안에 보관하지만 이를 되돌리는 메서드는 제공하지 않습니다. <br>
     * 자식이 재질을 배열로 가지고 있으면 배열 안의 재질을 하나씩 처리합니다. <br>
     * 직속 자식만 처리하고 그보다 아래 자손은 건드리지 않습니다.
     *
     * @param {number} alphaFilter 픽셀을 그릴지 판단하는 기준 불투명도이며, null이나 undefined를 넘기면 오류만 출력하고 재질을 바꾸지 않습니다
     */
    setAlphaTest(alphaFilter: number): void;
    /**
     * 레이어 이름이 일치하는 UMesh 자식을 찾아 반환합니다. <br>
     * 레이어 이름을 넘기지 않으면 첫 번째 직속 자식을 종류와 무관하게 반환합니다. <br>
     * 직속 자식만 앞에서부터 확인하고 그보다 아래 자손은 찾지 않습니다.
     *
     * @param {string} [layername] 찾을 UMesh에 지정된 레이어 이름이며, 생략하면 첫 번째 직속 자식을 반환합니다
     * @returns {import('@UMesh').UMesh | import('three').Object3D | undefined} 레이어 이름이 일치하는 UMesh, 레이어 이름을 생략했을 때의 첫 직속 자식, 또는 대상이 없으면 undefined
     */
    getMesh(layername?: string): UMesh | three.Object3D | undefined;
    /**
     * 이 그룹과 모든 하위 자손을 돌면서 조건에 맞는 UMesh의 렌더링 자원을 해제하고 자식에서 제거를 시도합니다. <br>
     * 대상의 지오메트리(geometry), 재질(material)과 그 재질의 map 텍스처를 해제하고 각 참조를 undefined로 바꿉니다. <br>
     * 순회 도중에 자식 목록이 바뀌므로 조건에 맞는 메시(mesh)가 여러 개면 일부가 남을 수 있고, 직속 자식이 아닌 메시는 자원만 해제되고 그룹에서 떨어져 나오지 않습니다. <br>
     * 자원을 해제한 메시가 있어도 반환값은 늘 false이므로 제거 성공 여부 판단에는 사용하지 마십시오.
     *
     * @param {string} [layername] 해제 대상 UMesh에 지정된 레이어 이름이며, 생략하면 만나는 모든 UMesh가 대상입니다
     * @returns {boolean} 처리 결과와 관계없이 언제나 false
     */
    removeMesh(layername?: string): boolean;
    /**
     * 이 그룹과 모든 하위 자손의 메시(mesh) 재질(material)을 투명 처리 상태로 바꾸고 불투명도를 지정한 값으로 맞춥니다. <br>
     * 재질을 배열로 가진 메시는 배열 안의 재질을 하나씩 처리하지 않습니다.
     *
     * @param {number} opacity 재질에 지정할 불투명도 값
     */
    setOpacity(opacity: number): void;
    /**
     * 이 그룹과 모든 하위 자손의 메시(mesh) 재질(material) 색상을 지정한 색으로 바꿉니다. <br>
     * 재질을 배열로 가진 메시는 배열 안의 재질을 하나씩 처리하지 않습니다.
     *
     * @param {import('three').ColorRepresentation} color 재질에 지정할 색이며, 16진수 값이나 색 이름 문자열처럼 THREE.Color가 해석할 수 있는 표현
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
