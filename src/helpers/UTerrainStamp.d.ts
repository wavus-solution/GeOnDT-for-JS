// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../3dLayer/U3dLayer.js";
import type { U3dApp } from "../app/U3dApp.js";

/**
 * 도장(stamp) 도형의 점 하나를 나타내는 좌표 값입니다.
 *
 * three.js Vector3 대신 숫자 프로퍼티만 가진 객체로 점을 넘길 때 사용합니다.
 */
type UTerrainStampPointLike = {
    /**
     * 월드 좌표(EPSG:3857)의 동서 방향 위치이며 단위는 미터입니다.
     */
    x: number;
    /**
     * 월드 좌표(EPSG:3857)의 남북 방향 위치이며 단위는 미터입니다.
     */
    y: number;
    /**
     * 해발 높이이며 단위는 미터입니다.<br>
     * 생략하면 0으로 사용합니다.
     */
    z?: number;
};

/**
 * 원형 도장의 중심점과 반지름을 함께 담은 도형 값입니다.
 *
 * getCircle()이 현재 원형 도형을 복사해 돌려줄 때 쓰는 형식입니다.
 */
type UTerrainStampCircleValue = {
    /**
     * 원의 중심이며 월드 좌표(EPSG:3857)입니다.
     */
    center: three.Vector3 | UTerrainStampPointLike;
    /**
     * 원의 반지름이며 단위는 미터입니다.
     */
    radius: number;
};

/**
 * 지형 머티리얼이 셰이더(shader)로 넘기는 도장 표시용 값 묶음입니다.
 *
 * 각 프로퍼티는 three.js 규약에 따라 실제 값을 value 필드에 담습니다.<br>
 * 한 레이어에 대해서는 같은 객체가 계속 재사용되므로 참조를 보관해 두고 값만 읽어도 됩니다.
 */
type UTerrainStampRenderUniforms = {
    /**
     * 지금 그리는 지형 타일과 겹쳐 이번 렌더 호출에서 검사할 도장 개수입니다.
     */
    count: {
        value: number;
    };
    /**
     * 지금 그리는 지형 타일의 원점과, 도장 좌표를 기록할 때 쓴 공통 기준점 사이의 차이이며 단위는 미터입니다.<br>
     * 큰 좌표를 그대로 다룰 때 생기는 어긋남을 줄이기 위해 사용합니다.
     */
    objectRelative: {
        value: three.Vector3;
    };
    /**
     * 화면 배율이며 CSS 픽셀 단위 선 두께를 실제 화면 픽셀로 환산할 때 사용합니다.
     */
    pixelRatio: {
        value: number;
    };
    /**
     * 도장의 도형·색·이미지 매핑 정보를 숫자로 담은 데이터입니다.
     */
    stampDataTexture: {
        value: three.DataTexture;
    };
    /**
     * stampDataTexture의 가로·세로 크기입니다.
     */
    stampDataTextureSize: {
        value: three.Vector2;
    };
    /**
     * 도장 이미지들을 한 장에 모아 둔 이미지입니다.
     */
    textureAtlas: {
        value: three.CanvasTexture | three.DataTexture;
    };
};

/**
 * 한 영상 레이어에 등록된 도장의 표시 상태입니다.
 *
 * getRenderState()가 돌려주며, 같은 레이어에 대해서는 항상 같은 객체가 반환됩니다.
 */
type UTerrainStampRenderState = {
    /**
     * 해당 레이어에 등록되어 있는 도장 개수입니다.
     */
    activeCount: number;
    /**
     * 지형 머티리얼이 셰이더로 넘기는 도장 표시용 값 묶음입니다.
     */
    uniforms: UTerrainStampRenderUniforms;
};

/**
 * getParam()이 점 하나를 JSON으로 저장할 수 있게 담는 형식입니다.
 */
type UTerrainStampPointParam = {
    /**
     * 월드 좌표(EPSG:3857)의 동서 방향 위치이며 단위는 미터입니다.
     */
    x: number;
    /**
     * 월드 좌표(EPSG:3857)의 남북 방향 위치이며 단위는 미터입니다.
     */
    y: number;
    /**
     * 해발 높이이며 단위는 미터입니다. 넣을 때 생략했으면 0으로 저장됩니다.
     */
    z: number;
};

/**
 * 도장 하나의 도형·표현·표시 상태를 JSON으로 저장할 수 있게 담은 값입니다.
 *
 * getParam()이 돌려주고 setParam()이 받는 형식이며, JSON.stringify()로 그대로 문자열이 됩니다.<br>
 * app과의 연결은 담지 않으므로 복원할 때는 setApp()으로 따로 지정합니다.
 */
type UTerrainStampParam = {
    /**
     * 도형 종류이며, 도형이 정해지지 않은 도장에서는 없습니다.
     */
    type?: "polygon" | "circle" | "polyline";
    /**
     * 다각형의 꼭짓점 또는 선의 경유점 목록이며 원 도형에서는 없습니다.
     */
    points?: Array<UTerrainStampPointParam>;
    /**
     * 원의 중심이며 원 도형에서만 있습니다.
     */
    center?: UTerrainStampPointParam;
    /**
     * 원의 반지름이며 단위는 미터이고 원 도형에서만 있습니다.
     */
    radius?: number;
    /**
     * 채울 색이며 항상 '#rrggbb' 형식으로 저장됩니다.
     */
    color?: string;
    /**
     * 색으로 채울 때의 불투명도입니다.
     */
    opacity?: number;
    /**
     * 그러데이션(gradient) 끝 색이며 '#rrggbb' 형식입니다. 그러데이션을 쓰지 않으면 없습니다.
     */
    gradientColor?: string;
    /**
     * 그러데이션이 이어지는 방향입니다.
     */
    gradientDirection?: "vertical" | "horizontal";
    /**
     * 도장 영역에 입힌 이미지 주소이며 이미지를 쓰지 않으면 없습니다.
     */
    texture?: string;
    /**
     * 이미지로 채울 때의 불투명도이며 정한 적이 없으면 없습니다.
     */
    textureOpacity?: number;
    /**
     * 이미지 자체의 투명한 부분을 반영할지 여부이며 정한 적이 없으면 없습니다.
     */
    textureUseAlpha?: boolean;
    /**
     * 이미지를 배치할 사각 영역의 배율이며 정한 적이 없으면 없습니다.
     */
    textureScale?: number;
    /**
     * 이미지를 도장 영역에 맞추는 방식입니다.
     */
    textureFit?: "stretch" | "contain";
    /**
     * 이미지와 그러데이션이 기준으로 삼는 사각 영역이며 지정하지 않았으면 없습니다.
     */
    mappingFrame?: Array<UTerrainStampPointParam>;
    /**
     * 이미지가 준비될 때까지 색으로 채우지 않고 기다릴지 여부입니다.
     */
    expectTexture?: boolean;
    /**
     * 선 도형의 두께입니다.
     */
    lineWidth?: number;
    /**
     * 선 두께를 지상 거리로 볼지 화면 픽셀로 볼지 정하는 단위입니다.
     */
    lineWidthUnits?: "meters" | "pixels";
    /**
     * 채울지 가릴지 명시한 값이며, 명시하지 않아 targetLayer 유무로 자동 결정되는 도장에서는 없습니다.
     */
    mode?: "fill" | "mask";
    /**
     * 가림 대상 영상 레이어의 이름이며, 지정하지 않았거나 이름이 없는 레이어이면 없습니다.
     */
    targetLayer?: string;
    /**
     * 지형에 표시할 대상인지 여부입니다.
     */
    visible?: boolean;
    /**
     * 지형 타일 하나가 한 번에 검사할 도장 개수의 상한입니다.
     */
    maxStampsPerTile?: number;
    /**
     * 다른 도장과 겹칠 때 그리는 순서이며 값이 클수록 위에 그려집니다.
     */
    renderOrder?: number;
};

/**
 * setParam()과 UTerrainStamp.fromParam()이 받는 값입니다.
 *
 * getParam() 형식과 같지만 targetLayer를 레이어 이름 문자열 대신 레이어 객체로 넘기거나 null로 해제할 수도 있습니다.
 */
type UTerrainStampParamInput = Omit<UTerrainStampParam, "targetLayer"> & {
    targetLayer?: string | U3dLayer | null;
};

/**
 * setParam()이 targetLayer 이름을 레이어 객체로 되돌릴 때 쓰는 옵션입니다.
 */
type UTerrainStampSetParamOption = {
    /**
     * 레이어 이름을 찾을 app이며, 생략하면 setApp()으로 지정한 app을 사용합니다.
     */
    app?: U3dApp;
    /**
     * 레이어 이름으로 레이어를 찾는 함수이며, 지정하면 app 조회보다 먼저 사용합니다.
     */
    layerResolver?: (name: string) => U3dLayer | undefined;
};

/**
 * 지형 표면에 색이나 이미지를 입히는 도장(stamp)입니다.
 *
 * 다각형(polygon), 원(circle), 선(polyline) 중 한 가지 도형을 정해 색이나 이미지로 채웁니다.<br>
 * 가림(mask) 도장으로 지정하면 채우는 대신 대상 영상 레이어를 그 영역에서 보이지 않게 합니다.<br>
 * 인스턴스 메서드는 도형·표현·표시 여부를 바꾸고, 정적 메서드는 지형을 그리는 쪽에서 표시 상태를 조회합니다.
 */
declare class UTerrainStamp {
    /**
     * 모든 도장이 함께 쓰는 이미지 보관소에 등록할 수 있는 이미지 주소의 최대 개수를 바꿉니다.
     *
     * 이미지 주소를 지정한 도장이 하나라도 만들어지기 전에만 바꿀 수 있고, 그 뒤의 호출은 경고만 남기고 무시됩니다.<br>
     * 기본값인 16개보다 많은 서로 다른 이미지를 쓰려면 첫 도장을 만들기 전에 호출하십시오.
     *
     * @param {number} value 서로 다른 이미지 주소를 몇 개까지 등록할지 정하는 1 이상의 값입니다.
     * @returns {boolean} 최대 개수가 실제로 바뀌었으면 true, 바꿀 수 있는 시점이 지났거나 값이 올바르지 않아 무시되었으면 false입니다.
     */
    static setTextureAtlasMaxImages(value: number): boolean;
    /**
     * 모든 도장이 함께 쓰는 이미지 보관소에 등록할 수 있는 이미지 주소의 현재 최대 개수를 반환합니다.
     *
     * @returns {number} 현재 설정된 최대 개수이며 기본값은 16입니다.
     */
    static getTextureAtlasMaxImages(): number;
    /**
     * 지형을 그리는 쪽이 참조할 영상 레이어별 도장 표시 상태를 반환합니다.
     *
     * 같은 레이어에 대해서는 항상 같은 객체를 돌려주므로 호출한 쪽에서 참조를 보관해 두고 사용할 수 있습니다.<br>
     * 등록된 도장이 모두 사라진 뒤에도 개수 0인 상태 객체가 계속 반환됩니다.
     *
     * @param {import('@U3dLayer').U3dLayer} layer 표시 상태를 조회할 영상 레이어입니다.
     * @returns {UTerrainStampRenderState|undefined} 해당 레이어의 표시 상태이며, 이 레이어에 도장이 한 번도 등록된 적이 없으면 undefined입니다.
     */
    static getRenderState(layer: U3dLayer): UTerrainStampRenderState | undefined;
    /**
     * 지형 타일 하나를 그리기 직전에 해당 영상 레이어의 표시 상태 값을 현재 타일 기준으로 갱신합니다.
     *
     * 도장이 한 번도 등록된 적 없는 레이어이면 아무 것도 하지 않습니다.
     *
     * @param {import('@U3dLayer').U3dLayer} layer 갱신할 영상 레이어입니다.
     * @param {Partial<{object: import('three').Object3D, renderer: import('three').WebGLRenderer}> & Record<string, any>} [renderContext] 지금 그리는 대상에 대한 정보이며 아래 두 값만 사용합니다.<br>
     * object는 지금 그리는 지형 타일이며, 이 타일과 겹치는 도장만 남깁니다.<br>
     * renderer는 화면 배율을 제공하며, 없으면 배율 1을 사용합니다.<br>
     * object를 넘기지 않으면 타일별로 걸러 내지 않고 이 레이어에 등록된 도장 전체를 그대로 사용합니다.
     */
    static updateRenderUniforms(layer: U3dLayer, renderContext?: Partial<{
        object: three.Object3D;
        renderer: three.WebGLRenderer;
    }> & Record<string, any>): void;
    /**
     * app의 영상 레이어 구성이 바뀐 뒤, 그 app에 연결된 모든 도장의 적용 대상 레이어를 다시 계산합니다.
     *
     * @param {import('@U3dApp').U3dApp} app 도장이 연결되어 있는 app입니다.
     * @returns {boolean} 적용 대상 레이어가 바뀐 도장이 하나라도 있으면 true, 바뀐 도장이 없거나 연결된 도장이 없으면 false입니다.
     */
    static refreshAppLayerStates(app: U3dApp): boolean;
    /**
     * getParam()이 돌려준 값으로 새 도장을 만듭니다.
     *
     * app을 넘기면 먼저 setApp()으로 연결한 뒤 값을 반영하므로 param의 targetLayer 이름을 그 app에서 찾습니다.<br>
     * param에 visible이 없으면 생성자 기본값대로 표시하지 않는 상태로 만들어집니다.<br>
     * 도형 값이 올바르지 않아 반영에 실패하면 만든 도장을 정리하고 undefined를 반환합니다.
     *
     * @param {UTerrainStampParamInput} param getParam()이 돌려준 형식의 값이며 targetLayer는 레이어 객체로 넘겨도 됩니다.
     * @param {import('@U3dApp').U3dApp} [app] 새 도장을 연결할 app입니다.
     * @returns {UTerrainStamp|undefined} 만들어진 도장이며, 값이 올바르지 않으면 undefined입니다.
     */
    static fromParam(param: UTerrainStampParamInput, app?: U3dApp): UTerrainStamp | undefined;
    /**
     * UTerrainStamp 클래스 생성자입니다.
     *
     * 도형 정보를 하나도 넘기지 않으면 빈 도장을 만들고, 이후 setPoints()나 setCircle()로 도형을 정합니다.<br>
     * 도형 정보를 넘겼는데 올바르지 않으면 오류 메시지만 남기고 도형이 없는 상태로 남습니다.<br>
     * 지형에 실제로 그려지려면 visible이 true이고 setApp()으로 지정한 app에서 적용 대상 영상 레이어가 하나 이상 찾아져야 하므로, 생성만으로는 화면에 나타나지 않습니다.
     *
     * @param {object} [opt] 도형과 표현을 한 번에 지정하는 생성 옵션입니다.
     * @param {boolean} [opt.visible=false] 표시 대상으로 삼을지 여부입니다.
     * @param {'polygon'|'circle'|'polyline'} [opt.type='polygon'] 도형 종류이며 다각형, 원, 선 중 하나입니다.
     * @param {Array<import('three').Vector3|UTerrainStampPointLike>} [opt.points] 다각형의 꼭짓점 또는 선의 경유점 목록이며 월드 좌표(EPSG:3857)입니다.<br>
     * 다각형은 3개 이상, 선은 2개 이상이 필요하고 앞에서부터 16개까지만 사용합니다.
     * @param {import('three').Vector3|UTerrainStampPointLike} [opt.center] 원의 중심이며 월드 좌표(EPSG:3857)입니다.
     * @param {number} [opt.radius] 원의 반지름이며 단위는 미터이고 0보다 커야 합니다.
     * @param {number} [opt.lineWidth=1] 선 도형의 두께이며 0보다 커야 합니다.
     * @param {'meters'|'pixels'} [opt.lineWidthUnits='meters'] 선 두께를 지상 거리(미터)로 볼지 화면 픽셀로 볼지 정합니다.<br>
     * meters이면 확대·축소해도 지상에서 같은 폭을 덮고, pixels이면 화면에서 같은 굵기로 보입니다.
     * @param {string|number|import('three').Color} [opt.color='#00ffff'] 도장을 채울 색이며, 이미지를 쓰는 경우 이미지가 준비되기 전까지 이 색으로 보입니다.
     * @param {number} [opt.opacity=1] 색으로 채울 때의 불투명도이며 0이면 완전히 투명하고 1이면 불투명합니다.
     * @param {string|number|import('three').Color} [opt.gradientColor] 지정하면 color에서 이 색으로 이어지는 그러데이션(gradient)으로 채웁니다.
     * @param {'vertical'|'horizontal'} [opt.gradientDirection='vertical'] 그러데이션이 이어지는 방향이며, 허용하지 않는 값은 vertical로 바뀝니다.
     * @param {string} [opt.texture] 도장 영역에 입힐 이미지 주소이며, 지정하지 않으면 색으로 채웁니다.
     * @param {number} [opt.textureOpacity=1] 이미지로 채울 때의 불투명도이며 0 이상 1 이하로 제한됩니다.
     * @param {boolean} [opt.textureUseAlpha=true] 이미지 자체의 투명한 부분을 그대로 비칠지 여부이며, false이면 이미지 전체를 textureOpacity로 균일하게 덮습니다.
     * @param {number} [opt.textureScale=1] 이미지를 배치할 사각 영역을 중심 기준으로 넓히거나 좁히는 배율입니다.<br>
     * 1보다 크면 같은 이미지가 더 넓은 영역에 걸쳐 크게 보이고, 0 이하이거나 숫자가 아니면 1을 사용합니다.
     * @param {'stretch'|'contain'} [opt.textureFit='stretch'] 이미지를 도장 영역에 맞추는 방식이며, 허용하지 않는 값은 stretch로 바뀝니다.<br>
     * stretch는 도형을 감싸는 사각 영역에 이미지를 늘려 채우고 도형 밖으로 나간 부분은 보이지 않습니다.<br>
     * contain은 이미지를 꼭짓점 네 개에 맞춰 기울여 넣으며, 이미지를 쓰는 꼭짓점 4개짜리 다각형에서만 적용되고 그 밖에는 stretch처럼 동작합니다.
     * @param {Array<import('three').Vector3|UTerrainStampPointLike>|null} [opt.mappingFrame] 이미지와 그러데이션이 기준으로 삼을 별도의 사각 영역이며 월드 좌표(EPSG:3857) 3~4개를 넣습니다.<br>
     * 지정하면 도형과 무관하게 이 영역을 기준으로 이미지가 배치되므로, 움직이는 도장에서도 무늬가 흔들리지 않습니다.
     * @param {boolean} [opt.expectTexture=false] 이미지가 준비되지 않은 동안 색으로 미리 채우지 않고 기다릴지 여부입니다.
     * @param {import('@U3dLayer').U3dLayer} [opt.targetLayer] 가림 대상으로 삼을 영상 레이어이며, 지정하면 이 레이어보다 위에 그려지는 레이어에만 도장이 적용됩니다.
     * @param {string|number} [opt.mode] 채울지 가릴지 정하며 fill 또는 mask를 넣습니다.<br>
     * 생략하거나 그 밖의 값을 넣으면 targetLayer가 있을 때 가림, 없을 때 채움으로 동작합니다.
     * @param {number} [opt.maxStampsPerTile=128] 지형 타일 하나가 한 번에 검사할 도장 개수의 상한이며 1 이상 128 이하로 제한됩니다.<br>
     * 같은 영상 레이어에 등록된 도장들이 이 값을 공유하므로 마지막으로 반영된 값이 그 레이어에 적용됩니다.
     * @param {number} [opt.renderOrder=0] 다른 도장과 겹칠 때 그리는 순서이며 값이 클수록 위에 그려집니다.<br>
     * 값이 같으면 먼저 만든 도장이 아래에 그려지고, 숫자가 아니면 0을 사용합니다.
     */
    constructor(opt?: {
        visible?: boolean;
        type?: "polygon" | "circle" | "polyline";
        points?: Array<three.Vector3 | UTerrainStampPointLike>;
        center?: three.Vector3 | UTerrainStampPointLike;
        radius?: number;
        lineWidth?: number;
        lineWidthUnits?: "meters" | "pixels";
        color?: string | number | three.Color;
        opacity?: number;
        gradientColor?: string | number | three.Color;
        gradientDirection?: "vertical" | "horizontal";
        texture?: string;
        textureOpacity?: number;
        textureUseAlpha?: boolean;
        textureScale?: number;
        textureFit?: "stretch" | "contain";
        mappingFrame?: Array<three.Vector3 | UTerrainStampPointLike> | null;
        expectTexture?: boolean;
        targetLayer?: U3dLayer;
        mode?: string | number;
        maxStampsPerTile?: number;
        renderOrder?: number;
    });
    visible: any;
    color: any;
    opacity: any;
    gradientColor: any;
    gradientDirection: string;
    texture: any;
    textureOpacity: any;
    textureUseAlpha: any;
    textureScale: any;
    textureFit: string;
    mappingFrame: any[];
    expectTexture: boolean;
    targetLayer: any;
    mode: number;
    lineWidth: any;
    lineWidthUnits: string;
    maxStampsPerTile: any;
    renderOrder: number;
    /**
     * 이 도장을 적용할 app을 지정합니다.
     *
     * app을 지정해야 그 app의 영상 레이어 중 적용 대상이 정해지고 지형에 그려질 수 있습니다.<br>
     * undefined를 넘기면 기존 app과의 연결이 끊어져 지형에서 사라지며, 도형과 표현 값은 그대로 남습니다.
     *
     * @param {import('@U3dApp').U3dApp|undefined} app 이 도장을 적용할 app이며, undefined이면 연결을 끊습니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setApp(app: U3dApp | undefined): UTerrainStamp;
    /**
     * 이 도장에 지정되어 있는 app을 반환합니다.
     *
     * @returns {import('@U3dApp').U3dApp|undefined} setApp()으로 지정한 app이며, 지정한 적이 없으면 undefined입니다.
     */
    getApp(): U3dApp | undefined;
    /**
     * 가림 대상으로 삼을 영상 레이어를 바꿉니다.
     *
     * 지정하면 그 레이어보다 렌더 순서가 뒤여서 위에 그려지는 영상 레이어에만 구멍이 나고, 지정한 레이어 자신에는 구멍이 나지 않습니다.<br>
     * 다만 가림 도장은 지정한 레이어와 그 아래 레이어에서도 자기보다 그리는 순서(renderOrder)가 낮은 도장을 그 영역 안에서 숨기므로, 구멍으로 드러나는 아래 레이어에 낮은 순서의 채움이 비치지 않습니다.<br>
     * 채울지 가릴지를 따로 정하지 않은 도장은 대상 레이어가 지정되는 순간 가림 도장으로 동작합니다.<br>
     * 채움으로 지정해 둔 도장이면 대상 레이어를 지정해도 채움으로 남고, 적용 범위만 그 위 레이어로 좁혀집니다.<br>
     * 현재 값과 같은 레이어를 넘기면 아무 것도 바뀌지 않습니다.
     *
     * @param {import('@U3dLayer').U3dLayer|undefined} layer 가림 대상 영상 레이어이며, undefined이면 대상 지정을 해제합니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setTargetLayer(layer: U3dLayer | undefined): UTerrainStamp;
    /**
     * 가림 대상으로 지정되어 있는 영상 레이어를 반환합니다.
     *
     * @returns {import('@U3dLayer').U3dLayer|undefined} setTargetLayer()로 지정한 레이어이며, 지정한 적이 없으면 undefined입니다.
     */
    getTargetLayer(): U3dLayer | undefined;
    /**
     * 다각형의 꼭짓점 또는 선의 경유점 목록을 바꿉니다.
     *
     * 현재 도형이 선이면 경유점으로, 그 밖에는 다각형 꼭짓점으로 사용합니다.<br>
     * 원이던 도장에 점 목록을 넣으면 다각형으로 바뀌면서 중심과 반지름 값이 지워집니다.<br>
     * 색·불투명도·이미지 같은 표현 값은 그대로 두며, 이 값들은 setColor()나 setStyle() 계열로 바꿉니다.<br>
     * 점이 모자라는 등 올바르지 않은 입력이면 오류 메시지를 남기고 기존 도형을 그대로 유지합니다.
     *
     * @param {Array<import('three').Vector3|UTerrainStampPointLike>} points 월드 좌표(EPSG:3857) 점 목록이며, 다각형은 3개 이상, 선은 2개 이상이 필요합니다.<br>
     * 앞에서부터 16개까지만 사용하고 나머지는 버립니다.
     * @returns {UTerrainStamp|undefined} 바뀌었으면 이 도장 자신을, 입력이 올바르지 않아 아무 것도 바뀌지 않았으면 undefined를 반환합니다.
     */
    setPoints(points: Array<three.Vector3 | UTerrainStampPointLike>): UTerrainStamp | undefined;
    /**
     * 현재 다각형 꼭짓점 또는 선 경유점 목록을 복사해 반환합니다.
     *
     * 반환된 배열과 각 점을 바꿔도 이 도장에는 반영되지 않으므로, 바꾼 목록은 setPoints()로 다시 넘겨야 합니다.<br>
     * 각 점은 넣을 때 쓴 형태 그대로 복사되므로, three.js Vector3로 넣었으면 Vector3로 돌아옵니다.
     *
     * @returns {Array<import('three').Vector3|UTerrainStampPointLike>|undefined} 월드 좌표(EPSG:3857) 점 목록의 복사본이며, 점 목록을 가진 도형이 아니면 undefined입니다.
     */
    getPoints(): Array<three.Vector3 | UTerrainStampPointLike> | undefined;
    /**
     * 원의 중심과 반지름을 바꿉니다.
     *
     * 다각형이나 선이던 도장에 호출하면 원으로 바뀌면서 점 목록이 지워집니다.<br>
     * 색·불투명도·이미지 같은 표현 값은 그대로 둡니다.<br>
     * 올바르지 않은 입력이면 오류 메시지를 남기고 기존 도형을 그대로 유지합니다.
     *
     * @param {import('three').Vector3|UTerrainStampPointLike} center 원의 중심이며 월드 좌표(EPSG:3857)입니다.
     * @param {number} radius 원의 반지름이며 단위는 미터이고 0보다 커야 합니다.
     * @returns {UTerrainStamp|undefined} 바뀌었으면 이 도장 자신을, 입력이 올바르지 않아 아무 것도 바뀌지 않았으면 undefined를 반환합니다.
     */
    setCircle(center: three.Vector3 | UTerrainStampPointLike, radius: number): UTerrainStamp | undefined;
    /**
     * 현재 원 도형의 중심과 반지름을 복사해 반환합니다.
     *
     * 반환된 값을 바꿔도 이 도장에는 반영되지 않습니다.
     *
     * @returns {UTerrainStampCircleValue|undefined} 원 도형 값의 복사본이며, 원이 아니거나 중심·반지름이 정해지지 않았으면 undefined입니다.
     */
    getCircle(): UTerrainStampCircleValue | undefined;
    /**
     * 도형과 표현을 한 번에 바꿉니다.
     *
     * setPoints()와 setStyle()을 잇달아 호출하면 화면 갱신 준비가 그만큼 여러 번 일어나므로, 매 프레임 움직이는 도장에서는 이 메서드로 한 번에 바꾸십시오.<br>
     * 전달한 키만 바뀌고 나머지 값은 그대로 유지됩니다.<br>
     * 도형 변경이 실패하면 오류 메시지를 남기고 표현 값도 반영하지 않은 채 끝납니다.
     *
     * @param {object} [opt] 바꿀 값만 담은 옵션입니다.
     * @param {'polygon'|'circle'|'polyline'} [opt.type] points를 다각형 꼭짓점으로 볼지 선 경유점으로 볼지 정하며, 생략하면 현재 도형 종류를 따릅니다.<br>
     * points와 함께 넘겨야 반영되고, 혼자 넘기면 아무 것도 바뀌지 않습니다.
     * @param {Array<import('three').Vector3|UTerrainStampPointLike>} [opt.points] 다각형의 꼭짓점 또는 선의 경유점 목록이며 월드 좌표(EPSG:3857)입니다.
     * @param {import('three').Vector3|UTerrainStampPointLike} [opt.center] 원의 중심이며 월드 좌표(EPSG:3857)입니다.
     * @param {number} [opt.radius] 원의 반지름이며 단위는 미터입니다.
     * @param {string|number|import('three').Color} [opt.color] 도장을 채울 색입니다.
     * @param {number} [opt.opacity] 색으로 채울 때의 불투명도입니다.
     * @param {string|number|import('three').Color} [opt.gradientColor] 그러데이션(gradient)의 끝 색입니다.
     * @param {'vertical'|'horizontal'} [opt.gradientDirection] 그러데이션이 이어지는 방향입니다.
     * @param {string} [opt.texture] 도장 영역에 입힐 이미지 주소입니다.
     * @param {number} [opt.textureOpacity] 이미지로 채울 때의 불투명도입니다.
     * @param {boolean} [opt.textureUseAlpha] 이미지 자체의 투명한 부분을 그대로 비칠지 여부입니다.
     * @param {number} [opt.textureScale] 이미지를 배치할 사각 영역의 배율입니다.
     * @param {'stretch'|'contain'} [opt.textureFit] 이미지를 도장 영역에 맞추는 방식입니다.
     * @param {Array<import('three').Vector3|UTerrainStampPointLike>|null} [opt.mappingFrame] 이미지와 그러데이션이 기준으로 삼을 별도의 사각 영역이며, null이나 점이 3개 미만이면 기준 영역을 해제합니다.
     * @param {boolean} [opt.expectTexture] 이미지가 준비될 때까지 색으로 미리 채우지 않고 기다릴지 여부입니다.
     * @param {number} [opt.lineWidth] 선 도형의 두께입니다.
     * @param {'meters'|'pixels'} [opt.lineWidthUnits] 선 두께를 지상 거리로 볼지 화면 픽셀로 볼지 정합니다.
     * @param {import('@U3dLayer').U3dLayer} [opt.targetLayer] 가림 대상으로 삼을 영상 레이어입니다.
     * @param {string|number} [opt.mode] 채울지 가릴지 정하며 fill 또는 mask를 넣고, 그 밖의 값은 생략한 것과 같이 처리됩니다.
     * @param {number} [opt.renderOrder] 다른 도장과 겹칠 때 그리는 순서이며 값이 클수록 위에 그려집니다.
     * @returns {UTerrainStamp|undefined} 바뀌었으면 이 도장 자신을, 도형 입력이 올바르지 않아 아무 것도 바뀌지 않았으면 undefined를 반환합니다.
     */
    update(opt?: {
        type?: "polygon" | "circle" | "polyline";
        points?: Array<three.Vector3 | UTerrainStampPointLike>;
        center?: three.Vector3 | UTerrainStampPointLike;
        radius?: number;
        color?: string | number | three.Color;
        opacity?: number;
        gradientColor?: string | number | three.Color;
        gradientDirection?: "vertical" | "horizontal";
        texture?: string;
        textureOpacity?: number;
        textureUseAlpha?: boolean;
        textureScale?: number;
        textureFit?: "stretch" | "contain";
        mappingFrame?: Array<three.Vector3 | UTerrainStampPointLike> | null;
        expectTexture?: boolean;
        lineWidth?: number;
        lineWidthUnits?: "meters" | "pixels";
        targetLayer?: U3dLayer;
        mode?: string | number;
        renderOrder?: number;
    }): UTerrainStamp | undefined;
    /**
     * 도형은 그대로 두고 표현 값만 한 번에 바꿉니다.
     *
     * 전달한 키만 바뀌며, 점 목록이나 중심·반지름 같은 도형 값은 여기서 받지 않습니다.<br>
     * 표현 값을 여러 개 바꿔야 하면 setColor()나 setTexture()를 잇달아 부르는 대신 이 메서드를 사용하십시오.
     *
     * @param {object} [style] 바꿀 표현 값만 담은 객체이며, 받는 키는 update()의 표현 관련 키와 같습니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setStyle(style?: object): UTerrainStamp;
    /**
     * 현재 표현 값을 한데 모은 새 객체로 반환합니다.
     *
     * 색과 기준 사각 영역은 복사되므로 반환값을 바꿔도 이 도장에는 반영되지 않습니다.<br>
     * 그대로 setStyle()에 넘겨 다른 도장에 같은 표현을 적용할 수 있습니다.
     *
     * @returns {{color: string|number|import('three').Color, opacity: number, gradientColor: string|number|import('three').Color|undefined, gradientDirection: 'vertical'|'horizontal', texture: string|undefined, textureOpacity: number|undefined, textureUseAlpha: boolean|undefined, textureScale: number|undefined, textureFit: 'stretch'|'contain', mappingFrame: Array<import('three').Vector3>|undefined, expectTexture: boolean, lineWidth: number, lineWidthUnits: 'meters'|'pixels', renderOrder: number}} 현재 표현 값을 담은 새 객체입니다.
     */
    getStyle(): {
        color: string | number | three.Color;
        opacity: number;
        gradientColor: string | number | three.Color | undefined;
        gradientDirection: "vertical" | "horizontal";
        texture: string | undefined;
        textureOpacity: number | undefined;
        textureUseAlpha: boolean | undefined;
        textureScale: number | undefined;
        textureFit: "stretch" | "contain";
        mappingFrame: Array<three.Vector3> | undefined;
        expectTexture: boolean;
        lineWidth: number;
        lineWidthUnits: "meters" | "pixels";
        renderOrder: number;
    };
    /**
     * 현재 도형·표현·표시 상태를 JSON으로 저장할 수 있는 새 객체로 반환합니다.
     *
     * 점은 {x, y, z} 일반 객체로, 색은 '#rrggbb' 문자열로, 가림 대상 레이어는 레이어 이름으로 바꿔 담으므로 JSON.stringify()로 그대로 문자열이 됩니다.<br>
     * 값이 정해지지 않은 항목(도형이 없는 도장의 type, 쓰지 않는 그러데이션·이미지·mappingFrame, 자동 결정 상태의 mode, 지정하지 않은 targetLayer)은 키를 넣지 않습니다.<br>
     * app과의 연결은 담지 않으며, 반환값을 바꿔도 이 도장에는 반영되지 않습니다.<br>
     * 반환값은 setParam()이나 UTerrainStamp.fromParam()에 그대로 넘겨 같은 도장을 되살릴 수 있습니다.
     *
     * @returns {UTerrainStampParam} 현재 상태를 담은 새 객체입니다.
     */
    getParam(): UTerrainStampParam;
    /**
     * getParam()이 돌려준 형식의 값을 한 번에 반영합니다.
     *
     * 전달한 키만 바뀌고 나머지 값은 그대로 유지되며, 도형·표현·표시 여부를 모두 바꿔도 화면 갱신 준비는 한 번만 일어납니다.<br>
     * targetLayer는 레이어 이름 문자열 또는 레이어 객체로 받으며, 이름이면 options.layerResolver, options.app, setApp()으로 지정한 app 순서로 찾습니다.<br>
     * 이름에 해당하는 레이어를 찾지 못하면 경고를 남기고 그 항목만 건너뛰며, null을 넘기면 대상 지정을 해제합니다.<br>
     * 도형 값이 올바르지 않으면 오류 메시지를 남기고 아무 것도 바꾸지 않은 채 undefined를 반환합니다.<br>
     * 객체가 아닌 값(JSON 문자열 포함)은 받지 않으므로 문자열은 JSON.parse()로 먼저 객체로 바꿔 넘기십시오.
     *
     * @param {UTerrainStampParamInput} param 반영할 값이며 getParam()의 반환 형식과 같습니다.
     * @param {UTerrainStampSetParamOption} [options] 레이어 이름을 찾을 때 쓰는 옵션입니다.
     * @returns {UTerrainStamp|undefined} 반영되었으면 이 도장 자신을, 입력이 올바르지 않아 아무 것도 바뀌지 않았으면 undefined를 반환합니다.
     */
    setParam(param: UTerrainStampParamInput, options?: UTerrainStampSetParamOption): UTerrainStamp | undefined;
    /**
     * JSON.stringify()가 이 도장을 문자열로 바꿀 때 쓰는 값을 반환합니다.
     *
     * getParam()과 같은 값을 돌려주므로 JSON.stringify(stamp) 또는 도장 배열을 그대로 문자열로 저장할 수 있습니다.
     *
     * @returns {UTerrainStampParam} getParam()이 돌려주는 현재 상태 객체입니다.
     */
    toJSON(): UTerrainStampParam;
    /**
     * 도장을 채울 색을 바꿉니다.
     *
     * 이미지를 쓰는 도장에서는 이미지가 준비되기 전까지 보이는 색으로 사용됩니다.
     *
     * @param {string|number|import('three').Color} color 채울 색이며 CSS 색 문자열, 24비트 정수 또는 three.js Color로 지정합니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setColor(color: string | number | three.Color): UTerrainStamp;
    /**
     * 현재 채울 색을 복사해 반환합니다.
     *
     * @returns {string|number|import('three').Color} 설정된 색이며, three.js Color로 설정했으면 복사본을 반환합니다.
     */
    getColor(): string | number | three.Color;
    /**
     * 색으로 채울 때의 불투명도를 바꿉니다.
     *
     * 이미지를 쓰는 도장에서는 setTextureOpacity()로 정한 값이 대신 적용되므로 이 값은 보이지 않습니다.
     *
     * @param {number} opacity 불투명도이며 0이면 완전히 투명하고 1이면 불투명합니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setOpacity(opacity: number): UTerrainStamp;
    /**
     * 색으로 채울 때의 현재 불투명도를 반환합니다.
     *
     * @returns {number} 설정된 불투명도이며 기본값은 1입니다.
     */
    getOpacity(): number;
    /**
     * 끝 색을 지정해 도장을 그러데이션(gradient)으로 채웁니다.
     *
     * setColor()로 정한 색에서 여기 지정한 색으로 이어지게 채웁니다.<br>
     * 그러데이션을 없애려면 clearGradient()를 사용하십시오.
     *
     * @param {string|number|import('three').Color} color 그러데이션의 끝 색입니다.
     * @param {'vertical'|'horizontal'} [direction] 그러데이션이 이어지는 방향이며, 생략하면 현재 방향을 그대로 쓰고 허용하지 않는 값은 vertical로 바뀝니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setGradient(color: string | number | three.Color, direction?: "vertical" | "horizontal"): UTerrainStamp;
    /**
     * 그러데이션(gradient)의 끝 색을 복사해 반환합니다.
     *
     * @returns {string|number|import('three').Color|undefined} 설정된 끝 색이며, 그러데이션을 쓰지 않으면 undefined입니다.
     */
    getGradientColor(): string | number | three.Color | undefined;
    /**
     * 그러데이션(gradient)이 이어지는 방향을 바꿉니다.
     *
     * @param {'vertical'|'horizontal'} direction 이어지는 방향이며, 허용하지 않는 값은 vertical로 바뀝니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setGradientDirection(direction: "vertical" | "horizontal"): UTerrainStamp;
    /**
     * 그러데이션(gradient)이 이어지는 현재 방향을 반환합니다.
     *
     * @returns {'vertical'|'horizontal'} 설정된 방향이며 기본값은 vertical입니다.
     */
    getGradientDirection(): "vertical" | "horizontal";
    /**
     * 그러데이션(gradient)을 없애고 단일 색으로 채우도록 되돌립니다.
     *
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    clearGradient(): UTerrainStamp;
    /**
     * 도장 영역에 입힐 이미지 주소를 바꿉니다.
     *
     * 이미지는 내려받는 즉시가 아니라 준비가 끝난 뒤에 화면에 나타나며, 그때까지는 설정된 색으로 보입니다.<br>
     * 이미지를 가져오지 못했거나 서로 다른 이미지 주소가 보관소의 최대 개수를 넘으면 경고만 남고 설정된 색으로 채워집니다.<br>
     * undefined를 넘기면 이미지만 떼어 내고 불투명도·투명 반영·배율·맞춤 방식은 이전 값이 남으므로, 이 값들까지 초기값으로 되돌리려면 clearTexture()를 사용하십시오.
     *
     * @param {string|undefined} texture 입힐 이미지 주소이며, undefined이면 이미지를 쓰지 않고 색으로 채웁니다.
     * @param {object} [options] 이미지 표현을 함께 바꿀 때 쓰는 값이며, 전달한 키만 반영됩니다.
     * @param {number} [options.textureOpacity] 이미지로 채울 때의 불투명도입니다.
     * @param {boolean} [options.textureUseAlpha] 이미지 자체의 투명한 부분을 그대로 비칠지 여부입니다.
     * @param {number} [options.textureScale] 이미지를 배치할 사각 영역을 중심 기준으로 넓히거나 좁히는 배율입니다.
     * @param {'stretch'|'contain'} [options.textureFit] 이미지를 도장 영역에 맞추는 방식이며, 허용하지 않는 값은 stretch로 바뀝니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setTexture(texture: string | undefined, options?: {
        textureOpacity?: number;
        textureUseAlpha?: boolean;
        textureScale?: number;
        textureFit?: "stretch" | "contain";
    }): UTerrainStamp;
    /**
     * 현재 입혀 둔 이미지 주소를 반환합니다.
     *
     * @returns {string|undefined} 설정된 이미지 주소이며, 이미지를 쓰지 않으면 undefined입니다.
     */
    getTexture(): string | undefined;
    /**
     * 이미지 설정을 모두 지우고 색으로 채우도록 되돌립니다.
     *
     * 이미지 주소와 함께 불투명도·투명 반영·배율 설정도 지워지고, 맞춤 방식은 stretch로 돌아갑니다.<br>
     * 같은 이미지를 다시 지정하면 이미 내려받아 둔 이미지를 그대로 쓰므로 기다리지 않고 나타납니다.
     *
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    clearTexture(): UTerrainStamp;
    /**
     * 이미지로 채울 때의 불투명도를 바꿉니다.
     *
     * 이미지 자체의 투명한 부분을 비추도록 설정되어 있으면 여기서 정한 값과 이미지의 투명도가 함께 반영됩니다.
     *
     * @param {number} opacity 불투명도이며, 화면에 반영될 때 0 이상 1 이하로 제한되고 숫자가 아니면 색 불투명도를 대신 사용합니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setTextureOpacity(opacity: number): UTerrainStamp;
    /**
     * 이미지로 채울 때의 현재 불투명도를 반환합니다.
     *
     * @returns {number|undefined} 설정된 불투명도이며, 정한 적이 없거나 clearTexture()로 지웠으면 undefined입니다.
     */
    getTextureOpacity(): number | undefined;
    /**
     * 이미지 자체의 투명한 부분을 그대로 비칠지 여부를 바꿉니다.
     *
     * true이면 PNG처럼 이미지에 들어 있는 투명한 영역이 지형을 그대로 드러냅니다.<br>
     * false이면 이미지의 투명도를 무시하고 도장 영역 전체를 균일한 불투명도로 덮습니다.
     *
     * @param {boolean} useAlpha 이미지의 투명한 부분을 반영할지 여부이며, false가 아닌 값은 모두 반영하는 것으로 처리됩니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setTextureUseAlpha(useAlpha: boolean): UTerrainStamp;
    /**
     * 이미지 자체의 투명한 부분을 그대로 비치도록 설정되어 있는지 반환합니다.
     *
     * @returns {boolean|undefined} 설정된 값이며, 정한 적이 없거나 clearTexture()로 지웠으면 undefined입니다.
     */
    getTextureUseAlpha(): boolean | undefined;
    /**
     * 이미지를 배치할 사각 영역을 중심 기준으로 넓히거나 좁힙니다.
     *
     * 1이면 도형을 감싸는 사각 영역을 그대로 쓰고, 1보다 크면 같은 이미지가 더 넓은 영역에 걸쳐 크게 보입니다.<br>
     * 이미지가 도장 영역 밖으로 나간 부분은 보이지 않으므로, 값을 키우면 이미지의 가운데 부분만 남습니다.
     *
     * @param {number} scale 사각 영역의 배율이며, 0 이하이거나 숫자가 아니면 1을 사용합니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setTextureScale(scale: number): UTerrainStamp;
    /**
     * 이미지를 배치할 사각 영역의 현재 배율을 반환합니다.
     *
     * @returns {number|undefined} 설정된 배율이며, 정한 적이 없거나 clearTexture()로 지웠으면 undefined입니다.
     */
    getTextureScale(): number | undefined;
    /**
     * 이미지를 도장 영역에 맞추는 방식을 바꿉니다.
     *
     * stretch는 도형을 감싸는 사각 영역에 이미지를 늘려 채우므로, 도형이 사각형이 아니면 이미지의 바깥쪽이 도형 밖으로 나가 보이지 않습니다.<br>
     * contain은 이미지 네 귀퉁이를 도형의 꼭짓점에 맞춰 기울여 넣으므로 이미지 전체가 도형 안에 들어갑니다.<br>
     * contain은 이미지를 쓰는 꼭짓점 4개짜리 다각형에서만 적용되고, 그 밖의 도형에서는 stretch처럼 동작합니다.
     *
     * @param {'stretch'|'contain'} fit 맞추는 방식이며, 허용하지 않는 값은 stretch로 바뀝니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setTextureFit(fit: "stretch" | "contain"): UTerrainStamp;
    /**
     * 이미지를 도장 영역에 맞추는 현재 방식을 반환합니다.
     *
     * @returns {'stretch'|'contain'} 설정된 방식이며 기본값은 stretch입니다.
     */
    getTextureFit(): "stretch" | "contain";
    /**
     * 지형 타일 하나가 한 번에 검사할 도장 개수의 상한을 바꿉니다.
     *
     * 이 값은 도장 하나가 아니라 이 도장이 적용된 영상 레이어 전체에 적용되므로, 같은 레이어의 도장이 서로 다른 값을 넣으면 마지막으로 반영된 값이 남습니다.<br>
     * 한 타일에 겹치는 도장이 상한을 넘으면 타일 중심에서 가까운 도장부터 남기고 나머지는 그 타일에서 그려지지 않습니다.
     *
     * @param {number} value 타일 하나가 검사할 도장 개수의 상한이며 소수점 아래는 버립니다.<br>
     * 128을 넘으면 128로 줄이고, 0 이하이거나 숫자가 아니면 기본값인 128을 사용합니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setMaxStampsPerTile(value: number): UTerrainStamp;
    /**
     * 지형 타일 하나가 한 번에 검사할 도장 개수의 상한으로 이 도장이 지정한 값을 반환합니다.
     *
     * @returns {number} 이 도장에 설정된 값이며 기본값은 128입니다.
     */
    getMaxStampsPerTile(): number;
    /**
     * 다른 도장과 겹칠 때 그리는 순서를 바꿉니다.
     *
     * 값이 클수록 나중에 그려져 위에 보이고, 값이 같으면 먼저 만든 도장이 아래에 그려집니다.<br>
     * 위에 있는 도장이 불투명하면 그 아래 도장은 가려지며, 가림(mask) 도장도 그 위의 불투명한 도장 뒤에 놓이면 적용되지 않으므로 필요하면 가림 도장에 큰 값을 주십시오.<br>
     * 가림 도장은 targetLayer가 있어도 그 레이어와 아래 레이어에서 자기보다 낮은 순서의 도장을 영역 안에서 숨기므로, 순서가 높은 가림 도장은 다른 레이어의 채움 위에도 "위"로 보입니다.<br>
     * 같은 영상 레이어에 등록된 도장끼리만 순서를 비교하며, 도장의 값을 갱신해도 순서는 바뀌지 않습니다.
     *
     * @param {number} value 그리는 순서이며 숫자가 아니면 0을 사용합니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setRenderOrder(value: number): UTerrainStamp;
    /**
     * 다른 도장과 겹칠 때 그리는 현재 순서를 반환합니다.
     *
     * @returns {number} 설정된 순서이며 기본값은 0입니다.
     */
    getRenderOrder(): number;
    /**
     * 이 도장을 지형에 표시할지 여부를 바꿉니다.
     *
     * false이면 지형에서 사라지고, true로 되돌리면 지금까지의 도형과 표현 값 그대로 다시 나타납니다.<br>
     * true로 바꾸더라도 유효한 도형이 없거나 setApp()으로 지정한 app에서 적용 대상 영상 레이어를 찾지 못하면 화면에 나타나지 않습니다.
     *
     * @param {boolean} visible 표시할지 여부이며, true가 아닌 값은 모두 표시하지 않는 것으로 처리됩니다.
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    setVisible(visible: boolean): UTerrainStamp;
    /**
     * 이 도장을 지형에 표시하도록 설정되어 있는지 반환합니다.
     *
     * @returns {boolean} 표시 대상이면 true이며 기본값은 false입니다.
     */
    getVisible(): boolean;
    /**
     * 이 도장을 지형에서 숨깁니다.
     *
     * 도형과 표현 값은 그대로 남으므로 setVisible(true)로 다시 표시할 수 있습니다.<br>
     * setVisible(false)와 결과가 같으며, 다시 쓰지 않을 도장은 dispose()로 정리하십시오.
     *
     * @returns {UTerrainStamp} 이어서 호출할 수 있도록 이 도장 자신을 반환합니다.
     */
    clear(): UTerrainStamp;
    /**
     * 이 도장을 지형에서 제거하고 다시 쓸 수 없는 상태로 만듭니다.
     *
     * app과의 연결도 함께 끊어집니다.<br>
     * 이후 값을 바꾸는 메서드를 호출해도 오류 없이 무시되며 지형에 다시 나타나지 않으므로, 같은 도형을 다시 쓰려면 새 인스턴스를 만드십시오.<br>
     * 여러 도장이 함께 쓰는 이미지는 해제되지 않고 남습니다.
     */
    dispose(): void;
    type: string;
    points: any[];
    center: any;
    radius: number;
    #private;
}

export type { UTerrainStamp, UTerrainStampCircleValue, UTerrainStampParam, UTerrainStampParamInput, UTerrainStampPointLike, UTerrainStampPointParam, UTerrainStampRenderState, UTerrainStampRenderUniforms, UTerrainStampSetParamOption };
