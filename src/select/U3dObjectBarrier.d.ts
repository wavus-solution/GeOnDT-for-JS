// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dComponentPosition } from "../3dLayer/U3dComponentPosition.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UGroup } from "../core/UGroup.js";
import type { URenderer } from "../core/URenderer.js";
import type { UInstancedMesh } from "../core/mesh/UInstancedMesh.js";
import type { U3dGeometry } from "../geometry/U3dGeometry.js";
import type { UOutlinePass } from "../postProcess/UOutlinePass.js";

type UInstancedMeshType = UInstancedMesh<three.BufferGeometry, three.Material | three.Material[], number, object>;

interface UOutlineMode {
    BASIC: number;
    BOUNCE: number;
    FLOW: number;
    BLOOM: number;
}

interface UOutlineStyleOption {
    color?: three.Color | string | number;
    visibleEdgeColor?: three.Color | string | number;
    hiddenEdgeColor?: three.Color | string | number;
    lineWidth?: number;
    width?: number;
    dashColor?: three.Color | string | number;
    dashDensity?: number;
    dashRatio?: number;
    flowSpeed?: number;
    dashSpeed?: number;
    speed?: number;
    timeOffset?: number;
    mode?: number;
    glowIntensity?: number;
    bounceSpeed?: number;
    opacity?: number;
    pulse?: number;
    renderOrder?: number;
}

/**
 * 선택한 3D 객체에 외곽선 하이라이트를 입히고 지우는 가시화 도구입니다.
 *
 * 하이라이트를 그리는 길은 두 가지이고, GeOnDT 엔진이 후처리를 쓰는지에 따라 갈립니다.<br>
 * 후처리를 쓰면 외곽선 pass가 화면 단계에서 테두리를 합성하므로 객체의 재질을 건드리지 않습니다.<br>
 * 후처리를 못 쓰면 객체의 재질을 하이라이트 전용 재질로 바꿔치기해 테두리처럼 보이게 합니다.<br>
 * 두 길 중 무엇을 쓸지는 렌더러에 외곽선 pass가 등록되어 있는지로 갈리며, setBarrier()가 이를 확인해 고릅니다.<br>
 * 앱이 후처리를 켜거나 끄면 swapSelectedObject()가 이미 걸린 효과를 반대 길로 옮깁니다.
 *
 * 같은 객체에 선택 하이라이트와 사용자 효과가 겹칠 수 있어 우선순위를 둡니다.<br>
 * 선택 하이라이트가 항상 위이며, 사용자 효과가 이미 걸린 객체를 선택하면 기존 스타일을 백업해 두었다가 선택이 풀릴 때 되돌립니다.<br>
 * 이 상태는 정적 보관소에 모여 있어서, 여러 선택 도구가 같은 객체를 함께 가리켜도 효과가 어긋나지 않습니다.
 *
 * @group select
 */
declare class U3dObjectBarrier {
    #private;
    /**
     * 움직이는 하이라이트가 하나라도 있어 매 프레임 빠른 갱신이 필요한지 나타냅니다.<br>
     * 테두리가 튀거나 흐르는 표현을 쓰는 객체가 등록되면 켜집니다.<br>
     * 하이라이트를 걸고 지울 때 이 클래스가 스스로 갱신하므로 읽기용으로 사용됩니다.
     */
    static setDrawFast: boolean;
    /**
     * 재질을 바꿔치기한 객체별로 하이라이트 재질을 보관합니다.<br>
     * 원래 재질로 되돌리거나 후처리 길로 갈아탈 때 여기서 색과 투명도를 다시 읽습니다.<br>
     * 선택 도구를 여러 개 써도 같은 보관소를 보도록 정적으로 둡니다.
     */
    static materialMap: Map<any, any>;
    /**
     * 객체마다 그 객체에 하이라이트를 건 U3dObjectBarrier 목록을 보관합니다.<br>
     * 한 객체를 여러 도구가 동시에 가리킬 수 있어, 지울 때 모두에게 알리려고 목록으로 들고 있습니다.
     */
    static effectMap: WeakMap<object, any>;
    /**
     * 사용자가 직접 건 효과가 살아 있는 객체를 모아 둡니다.<br>
     * 선택 하이라이트와 구분해, 선택이 풀릴 때 사용자 효과를 되살릴지 판단하는 기준이 됩니다.
     */
    static useEffectMap: WeakSet<object>;
    /**
     * 움직이는 표현을 쓰는 객체를 모아 둡니다.<br>
     * 이 집합이 비면 매 프레임 갱신을 다시 끌 수 있는지 판단합니다.
     */
    static styleRefSet: Set<unknown>;
    /**
     * 선택 때문에 임시로 하이라이트가 걸린 객체를 모아 둡니다.<br>
     * 사용자가 직접 건 효과와 달리 선택이 풀리면 함께 사라집니다.
     */
    static selectMap: WeakSet<object>;
    /**
     * 선택 하이라이트가 쓸 스타일을 객체별로 보관합니다.<br>
     * 사용자 효과가 나중에 걸려도 이 스타일을 다시 덮어씌워 선택이 계속 보이게 합니다.
     */
    static selectStyleMap: WeakMap<object, any>;
    /**
     * 선택이 사용자 효과를 덮기 직전의 스타일을 객체별로 보관합니다.<br>
     * 선택이 풀릴 때 이 값으로 되돌려 사용자 효과를 원래 모습으로 복구합니다.
     */
    static selectBackupStyleMap: WeakMap<object, any>;
    /**
     * 하이라이트를 그리려고 따로 만든 보조 객체들을 담는 그룹이며 생성자가 장면에 붙입니다.
     */
    static barrierGroup: UGroup;
    static barrierMeshMap: Map<UInstancedMeshType, three.InstancedMesh>;
    static isActive: boolean;
    static barrierList: Array<U3dObjectBarrier>;
    static MODE: UOutlineMode;
    /**
     * 외곽선이 겹칠 때 어느 것을 위에 보일지 정하는 우선순위입니다.<br>
     * PASS1이 가장 위에 보이고 PASS3이 가장 아래이며, 스타일의 renderOrder에 넣어 사용합니다.
     */
    static RENDER_ORDER: {
        PASS1: number;
        PASS2: number;
        PASS3: number;
    };
    /**
     * 이미 걸려 있는 하이라이트를 반대쪽 가시화 길로 통째로 옮깁니다.<br>
     * 앱이 후처리를 켜면 재질을 바꿔치기해 두었던 객체를 원래 재질로 돌리고 같은 색과 투명도로 외곽선 pass에 다시 등록합니다.<br>
     * 후처리를 끄면 반대로 pass 등록을 지우고 하이라이트 재질로 바꿔치기합니다.<br>
     * 효과가 걸린 모든 객체와 그 객체를 가리키는 모든 도구를 훑으므로, 대상이 많으면 이 호출 한 번의 비용이 큽니다.<br>
     * 후처리를 켜는 쪽인데 외곽선 pass가 등록되어 있지 않으면 아무것도 하지 않습니다.
     *
     * @param renderer 외곽선 pass를 들고 있는 렌더러
     * @param isPostProcess true이면 후처리 길로, false이면 재질 바꿔치기 길로 옮김
     * @param pass 후처리를 끌 때 등록을 지울 외곽선 pass
     */
    static swapSelectedObject(renderer: URenderer, isPostProcess: boolean, pass: UOutlinePass): void;
    /**
     * U3dObjectBarrier 클래스 생성자입니다.<br>
     * 앱에서 렌더러를 받아 두고 하이라이트 객체를 담을 그룹을 장면에 붙인 뒤 곧바로 외곽선 pass를 켭니다.<br>
     * 만든 인스턴스는 정적 목록에 등록되어 마지막 하나가 dispose()될 때까지 외곽선 pass가 유지됩니다.
     *
     * @param app 렌더러와 장면을 제공할 앱
     */
    constructor(app: U3dApp);
    /**
     * 하이라이트용 보조 그룹을 앱 장면에 붙이고 이 도구를 정적 목록에 등록합니다.<br>
     * 이미 등록되어 있으면 중복해서 넣지 않으며, 생성자가 호출하므로 보통 직접 부를 일은 없습니다.
     */
    addGroup(): void;
    /**
     * 외곽선 pass를 켜서 후처리 하이라이트가 화면에 나오게 합니다.<br>
     * 렌더러가 아직 없으면 아무것도 하지 않습니다.
     */
    active(): void;
    /**
     * 외곽선 pass를 꺼서 후처리 하이라이트를 화면에서 내립니다.<br>
     * 등록해 둔 스타일과 보관소는 지우지 않으므로 active()로 다시 켜면 그대로 보입니다.
     */
    deactive(): void;
    /**
     * 이미 외곽선 pass에 등록된 객체의 스타일만 바꿉니다.<br>
     * 색과 선 굵기, 점선, 움직임 같은 값을 객체마다 따로 줄 수 있습니다.<br>
     * 후처리 외곽선 pass가 준비되어 있지 않거나 대상을 찾지 못하면 false를 반환합니다.<br>
     * 재질을 바꿔치기한 길에는 적용되지 않으므로, 후처리를 쓰지 않는 상태에서는 setMaterialBarrier()로 색과 투명도를 바꿉니다.
     *
     * @param object 스타일을 바꿀 대상
     * @param style 적용할 외곽선 스타일이며 UOutlineStyleOption 형태
     * @returns 스타일을 적용했으면 true, 외곽선 pass가 없거나 대상을 찾지 못했으면 false
     */
    setStyle(object: three.Mesh | U3dComponentPosition | U3dGeometry, style: UOutlineStyleOption): boolean;
    /**
     * 외곽선 pass에 등록된 객체의 현재 스타일을 읽어 옵니다.<br>
     * 여러 인스턴스를 쓰는 대상이면 인스턴스별 결과를 배열로 돌려줍니다.<br>
     * effective가 true이면 기본값까지 반영해 실제 그려지는 값을, false이면 직접 지정한 값만 돌려줍니다.<br>
     * 후처리 외곽선 pass가 없거나 대상을 찾지 못하면 null을 반환합니다.
     *
     * @param object 스타일을 읽을 대상
     * @param [effective=true] true이면 기본값을 반영한 실제 값, false이면 지정한 값만 반환
     * @returns 읽은 스타일이며 대상을 찾지 못하면 null
     */
    getStyle(object: three.Mesh | U3dComponentPosition | U3dGeometry, effective?: boolean): any;
    /**
     * 이 도구가 만든 하이라이트 재질과 매 프레임 갱신 등록을 정리하고 정적 목록에서 빠집니다.<br>
     * 마지막 하나가 정리되면 외곽선 pass까지 함께 끕니다.<br>
     * 다른 도구가 같은 객체에 건 효과는 그대로 남습니다.
     */
    dispose(): void;
    /**
     * 객체에 외곽선 하이라이트를 겁니다.<br>
     * 후처리를 쓸 수 있으면 외곽선 pass에 등록하고, 쓸 수 없으면 하이라이트 재질로 바꿔치기해 같은 모양을 냅니다.<br>
     * 타일 지형 mesh는 대상에서 제외합니다.<br>
     * useEffect가 false이면 선택 하이라이트로 취급해 선택이 풀릴 때 함께 사라지고, true이면 사용자 효과로 남습니다.<br>
     * 사용자 효과를 거는 시점에 이미 선택 하이라이트가 켜져 있으면 방금 건 스타일을 백업하고 선택 스타일을 위에 덮어, 선택이 계속 보이게 합니다.<br>
     * 반대로 선택이 사용자 효과를 덮을 때도 기존 스타일을 백업하므로 선택이 풀리면 사용자 효과가 되살아납니다.<br>
     * 움직이는 표현을 쓰는 스타일이면 매 프레임 갱신을 함께 켭니다.
     *
     * @param object 하이라이트를 적용할 대상
     * @param style 적용할 외곽선 스타일이며 UOutlineStyleOption 형태
     * @param [useEffect=true] true이면 사용자 효과로 남기고, false이면 선택이 풀릴 때 사라지는 선택 하이라이트로 처리
     */
    setBarrier(object: three.Mesh | U3dComponentPosition | U3dGeometry, style: UOutlineStyleOption, useEffect?: boolean): void;
    /**
     * 후처리 외곽선 pass에 객체를 등록해 화면 합성 단계에서 테두리를 그립니다.<br>
     * 객체의 재질을 건드리지 않으므로 원래 색과 질감이 그대로 유지됩니다.<br>
     * 보통 setBarrier()가 대신 호출하며, 후처리 길을 직접 지정하고 싶을 때만 씁니다.<br>
     * 외곽선 pass가 준비되어 있지 않으면 false를 반환합니다.
     *
     * @param object 하이라이트를 적용할 대상
     * @param style 적용할 외곽선 스타일이며 UOutlineStyleOption 형태
     * @returns 등록했으면 true, 외곽선 pass가 준비되지 않았거나 대상을 찾지 못했으면 false
     */
    setPassBarrier(object: three.Mesh | U3dComponentPosition | U3dGeometry, style: UOutlineStyleOption): boolean;
    /**
     * 객체의 재질을 하이라이트 전용 재질로 바꿔치기해 테두리처럼 보이게 합니다.<br>
     * 후처리를 쓸 수 없는 환경에서 쓰는 길이며, 원래 재질은 정적 보관소에 저장해 두었다가 되돌립니다.<br>
     * 같은 객체에 이미 걸려 있으면 새로 만들지 않고 색과 투명도, 크기만 바꿉니다.<br>
     * 보통 setBarrier()가 대신 호출하며, 재질 길을 직접 지정하고 싶을 때만 씁니다.
     *
     * @param object 하이라이트를 적용할 대상
     * @param [color=0xffaa00] 테두리 색
     * @param [opacity=1] 테두리 투명도
     * @param [pulse=1] 원래 형상보다 얼마나 크게 부풀릴지 정하는 배율
     * @returns 재질을 걸었거나 기존 값을 갱신했으면 true, 대상을 처리하지 못했으면 false
     */
    setMaterialBarrier(object: three.Mesh | U3dComponentPosition | U3dGeometry, color?: three.Color | string | number, opacity?: number, pulse?: number): boolean;
    /**
     * barrier 제거 함수
     * @param {THREE.Mesh | import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition | import('@U3dGeometry').U3dGeometry} object 제거 대상 object
     * @param {boolean} [useEffect = true] effect로 사용 여부 (U3dSelect와 구분하기 위해)
     */
    removeBarrier(object: three.Mesh | U3dComponentPosition | U3dGeometry, useEffect?: boolean): boolean;
    /**
     * 후처리 외곽선 pass에서 객체 등록을 지워 테두리를 없앱니다.<br>
     * 이 도구가 들고 있는 pass를 먼저 쓰고, 없으면 넘겨받은 pass를 사용합니다.<br>
     * 둘 다 없으면 false를 반환합니다.
     *
     * @param object 하이라이트를 지울 대상
     * @param [pass] 이 도구에 pass가 없을 때 대신 사용할 UOutlinePass
     * @returns 등록을 지웠으면 true, 쓸 수 있는 pass가 없으면 false. 여러 인스턴스를 쓰는 대상은 정리만 하고 undefined를 반환
     */
    removePassBarrier(object: three.Mesh | U3dComponentPosition | U3dGeometry, pass?: UOutlinePass): boolean;
    /**
     * 바꿔치기했던 재질을 원래 재질로 되돌려 테두리를 없앱니다.<br>
     * isSwap이 참이면 후처리 길로 갈아타는 중이라는 뜻이라 선택·효과 보관소는 그대로 두고 재질만 되돌립니다.<br>
     * 거짓이면 그 객체에 관한 선택·효과 기록까지 함께 지웁니다.<br>
     * 보관된 재질이 없으면 false를 반환합니다.
     *
     * @param object 하이라이트를 지울 대상
     * @param [isSwap] true이면 가시화 길을 바꾸는 중이라 보관소를 지우지 않음
     * @returns 원래 재질로 되돌렸으면 true, 보관된 재질이 없으면 false
     */
    removeMaterialBarrier(object: three.Mesh | U3dComponentPosition | U3dGeometry, isSwap?: boolean): boolean;
    /**
     * barrier Material 생성 함수
     * @param {Color} color 색상
     * @param {number} opacity 투명도
     * @param {number} pulseScale 크기 offset
     * @param {boolean} isInstanced  instancedMesh 여부
     * @param {string} name materialName
     */
    createMaterial(color: three.Color | string | number, opacity: number, pulseScale?: number, isInstanced?: boolean, name?: string): three.ShaderMaterial;
}

export type { U3dObjectBarrier, UInstancedMeshType, UOutlineMode, UOutlineStyleOption };
