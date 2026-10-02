// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dComponentPosition } from "../3dLayer/U3dComponentPosition.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";

/**
 * ~extends import('@UAnaly').UAnalyCO <br>
 *
 * UAnalyHeight 분석 객체를 만들 때 전달하는 생성 옵션입니다. <br>
 */
type UAnalyHeightCO_Content = {
    /**
     * 이 분석 객체를 구분하는 이름이며 생략하면 'Height'가 사용됩니다. <br>
     */
    name?: string;
};

/**
 * ~extends import('@UAnaly').UAnalyCO <br>
 *
 * UAnalyHeight 분석 객체를 만들 때 전달하는 생성 옵션입니다. <br>
 */
type UAnalyHeightCO = Omit<Omit<UAnalyCO, never> & UAnalyHeightCO_Content, never>;

/**
 * ~extends import('@UAnaly').UAnalyCO <br>
 *
 * UAnalyHeight 분석 객체를 만들 때 전달하는 생성 옵션입니다. <br>
 *
 * @typedef {object} UAnalyHeightCO_Content
 * @property {string} [name='Height'] 이 분석 객체를 구분하는 이름이며 생략하면 'Height'가 사용됩니다. <br>
 *
 * @memberof UAnalyHeight
 * @inner
 *
 * @typedef {Omit<UAnalyCO, never> & UAnalyHeightCO_Content} UAnalyHeightCO
 */
/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 클릭한 지점의 높이(고도)를 측정하고 화면 전체에 고도별 색상 범례를 입히는 분석 클래스입니다. <br>
 * 측정한 높이는 화면의 해당 위치에 미터 단위 텍스트 표지(POI)로 표시됩니다. <br>
 *
 * @group analysis
 *
 * @extends {UAnaly}
 *
 * @example
 * let analy = app.activeAnalysis('Height');
 * analy.active();
 */
declare class UAnalyHeight extends UAnaly {
    /**
     * setUserStyle()로 한 번에 등록할 수 있는 고도 범례의 최대 개수이며, 'mode' 키는 이 개수에 포함되지 않습니다. <br>
     * 이 개수를 넘는 스타일을 전달하면 setUserStyle()이 경고를 남기고 false를 반환합니다. <br>
     *
     * @type {number}
     */
    static MAX_STYLE_ENTRIES: number;
    /**
     * UAnalyHeight 클래스 생성자입니다. <br>
     * 생성만으로는 화면에 아무것도 나타나지 않으며, 클릭 높이 측정은 active()를, 고도 색상 범례 표시는 setHeightVisible(true)를 호출해야 시작됩니다. <br>
     *
     * @param {UAnalyHeightCO} [opt={}] 분석 이름을 지정하는 생성 옵션이며 생략하면 모든 항목에 기본값이 적용됩니다. <br>
     */
    constructor(opt?: UAnalyHeightCO);
    /**
     * @type {string | null |  undefined}
     *
     * @ignore
     */
    _clickId: string | null | undefined;
    /** @type {string | undefined}
     *
     * @ignore
     */
    _dblClickId: string | undefined;
    /** @type {Record<string, string> | undefined}
     *
     * @ignore
     */
    _style: Record<string, string> | undefined;
    /** @type {boolean}
     *
     * @ignore
     */
    _styleDirty: boolean;
    name: any;
    /**
     * 화면 전체에 고도별 색상 범례를 입힐지 설정합니다. <br>
     * 설정 성공 여부를 반환값으로 확인할 수 있는 setHeightVisible()을 사용하십시오. <br>
     *
     * @deprecated setHeightVisible() 사용을 권장합니다.
     *
     * @param {boolean} val 색상 범례를 표시하려면 true, 숨기려면 false <br>
     */
    drawHeight(val: boolean): void;
    /**
     * 화면 전체에 고도별 색상 범례를 입힐지 설정합니다. <br>
     * 범례를 켜면 지형과 모델이 setUserStyle()로 정한 고도 구간 색상으로 덮여 표시되며, 범례를 설정한 적이 없으면 기본 범례 색상이 적용됩니다. <br>
     * 클릭 높이 측정을 켜고 끄는 active()·deactive() 상태와는 별개입니다. <br>
     *
     * @param {boolean} visible 색상 범례를 표시하려면 true, 숨기려면 false <br>
     * @returns {boolean} 설정에 성공하면 true, visible이 boolean이 아니거나 지도 화면이 아직 준비되지 않아 범례를 적용할 수 없으면 false이며 이때 오류 메시지가 함께 출력됩니다. <br>
     */
    setHeightVisible(visible: boolean): boolean;
    /**
     * 화면 전체 고도 색상 범례가 현재 표시 중인지 확인합니다. <br>
     * 클릭 높이 측정 활성 여부를 나타내는 isActive()와는 별개의 상태입니다. <br>
     *
     * @returns {boolean} 색상 범례가 표시 중이면 true이며, 한 번도 켠 적이 없거나 지도 화면이 준비되지 않았으면 false <br>
     */
    isHeightVisible(): boolean;
    /**
     * 고도 구간별 색상 범례를 설정합니다. <br>
     * 전달한 객체는 복사해 보관하므로 호출한 뒤 원본 객체를 고쳐도 적용된 범례는 바뀌지 않습니다. <br>
     * 설정한 범례는 setHeightVisible(true)로 범례를 켠 화면에 반영됩니다. <br>
     *
     * @param {Record<string, string>} style 키는 기준 고도를 나타내는 숫자 문자열, 값은 'rgba(0,0,255,0.5)' 같은 색상 문자열이며, 'mode' 키에는 "band" 또는 "mix"만 넣을 수 있고 생략하면 "mix"로 처리됩니다. <br>
     * 고도 키는 넣는 순서와 상관없이 낮은 고도부터 차례대로 적용되고, 숫자로 읽을 수 없는 키는 무시됩니다. <br>
     * @returns {boolean} 설정에 성공하면 true, 객체가 아니거나 mode 값이 허용 범위 밖이거나 'mode'를 뺀 고도 항목이 UAnalyHeight.MAX_STYLE_ENTRIES개를 넘으면 false <br>
     */
    setUserStyle(style: Record<string, string>): boolean;
    /**
     * 현재 설정된 고도 색상 범례의 복사본을 가져옵니다. <br>
     * 반환된 객체를 고쳐도 적용된 범례는 바뀌지 않으므로 바꾸려면 setUserStyle()을 호출하십시오. <br>
     *
     * @returns {Record<string, string> | undefined} 현재 적용 중인 범례의 복사본이며, 생성 직후에는 기본 범례가 그대로 반환됩니다. <br>
     */
    getUserStyle(): Record<string, string> | undefined;
    /**
     * 고도 색상 범례와 등고선을 입히지 않을 대상 목록을 지정합니다. <br>
     * 목록에 넣은 대상에는 범례 색상과 등고선이 적용되지 않아 본래 색상으로 표시됩니다. <br>
     * 3차원 객체(Object3D)를 전달하면 화면에 그려지는 시점의 하위 객체까지 함께 제외됩니다. <br>
     * 컴포넌트 레이어의 컴포넌트 위치(U3dComponentPosition)를 전달하면 그 컴포넌트 하나만 제외되며, 같은 형상을 함께 쓰는 다른 컴포넌트는 영향을 받지 않습니다. <br>
     * 기존 목록은 전달한 목록으로 교체되고 빈 배열을 전달하면 모두 해제됩니다. <br>
     *
     * @param {import('three').Object3D | import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition | Array<import('three').Object3D | import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition>} objects 제외할 대상 하나 또는 대상들의 배열 <br>
     * @returns {boolean} 목록을 설정하면 true, 허용하지 않는 값이 하나라도 있으면 기존 목록을 유지한 채 false <br>
     *
     * @example
     * let analy = app.activeAnalysis('Height');
     * analy.setExceptObjects([mesh]);
     * analy.setHeightVisible(true);
     *
     * @example
     * // 컴포넌트 포지션 단위 제외: 목록에 넣은 컴포넌트만 본연의 색으로 남는다.
     * const comps = ['drone-1', 'drone-2'].map((name) => layer.getComponentByName(name));
     * analy.setExceptObjects(comps);
     */
    setExceptObjects(objects: three.Object3D | U3dComponentPosition | Array<three.Object3D | U3dComponentPosition>): boolean;
    /**
     * 고도 색상 범례와 등고선에서 제외할 대상을 목록에 하나 추가합니다. <br>
     * 이미 목록에 있는 대상을 다시 추가해도 목록은 그대로 유지됩니다. <br>
     *
     * @param {import('three').Object3D | import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition} object 제외할 3차원 객체(Object3D) 또는 컴포넌트 위치(U3dComponentPosition) <br>
     * @returns {boolean} 목록에 추가하면 true, 허용하지 않는 값이면 false <br>
     */
    addExceptObject(object: three.Object3D | U3dComponentPosition): boolean;
    /**
     * 고도 색상 범례와 등고선 제외 목록에서 대상 하나를 뺍니다. <br>
     * 제외가 풀린 대상은 다시 범례 색상과 등고선이 적용된 모습으로 표시됩니다. <br>
     *
     * @param {import('three').Object3D | import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition} object 제외를 해제할 3차원 객체(Object3D) 또는 컴포넌트 위치(U3dComponentPosition) <br>
     * @returns {boolean} 목록에 있어 실제로 뺐으면 true, 목록에 없었으면 false <br>
     */
    removeExceptObject(object: three.Object3D | U3dComponentPosition): boolean;
    /**
     * 고도 색상 범례와 등고선 제외 목록을 모두 비웁니다. <br>
     * 제외가 풀린 대상들은 다시 범례 색상과 등고선이 적용된 모습으로 표시됩니다. <br>
     */
    clearExceptObjects(): void;
    /**
     * 현재 제외 목록에 등록된 대상들의 복사본 배열을 가져옵니다. <br>
     * 반환된 배열에 항목을 넣거나 빼도 실제 제외 목록은 바뀌지 않습니다. <br>
     *
     * @returns {Array<import('three').Object3D | import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition>} 제외 목록에 등록된 대상들의 배열 <br>
     */
    getExceptObjects(): Array<three.Object3D | U3dComponentPosition>;
    #private;
}

export type { UAnalyHeight, UAnalyHeightCO, UAnalyHeightCO_Content };
