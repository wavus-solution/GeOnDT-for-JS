// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { URenderer } from "../core/URenderer.js";
import type { U3dOverlayManager } from "./U3dOverlayManager.js";
import type { ColorLike, GeoPosition, WorldPosition } from "../types/global.types.js";

/**
 * U3dOverlay 클래스 생성자에 전달하는 옵션입니다.
 */
type U3dOverlayCO = {
    /**
     * 오버레이를 사람이 구분하기 위한 이름이며 getName 메서드로 돌려받는 값
     */
    name?: string;
    /**
     * 오버레이를 구분하는 식별자이며 생략하면 생성자가 고유 문자열을 만들어 넣습니다.
     */
    id?: string;
    /**
     * 화면에 그릴 DOM 요소이며 HTML 문자열이나 CSS 선택자 문자열로도 전달할 수 있습니다.
     */
    element: HTMLElement;
    /**
     * 오류 메시지에 함께 출력할 클래스 구분 문자열
     */
    classtype?: string;
    /**
     * 오버레이를 처음 놓을 위경도 좌표계(EPSG:4326) 좌표
     */
    position?: GeoPosition | undefined;
    /**
     * 드래그해도 움직이지 않는 기준점의 위경도 좌표계(EPSG:4326) 좌표이며, 이 값을 주면 생성 시점에 드래그 기능이 활성화됩니다.
     */
    endPosition?: GeoPosition | undefined;
    /**
     * <hidden>
     */
    endposition?: GeoPosition | undefined;
    /**
     * 말풍선 꼭지점을 오버레이 중심에서 얼마나 옮길지 정하는 화면 픽셀 단위 가로·세로 오프셋
     */
    balloon?: {
        x: number;
        y: number;
    };
    /**
     * 요소의 어느 지점을 좌표에 맞출지 정하는 가로·세로 비율이며 각각 0 이상 1 이하의 실수입니다.
     */
    anchor?: Array<number>;
    /**
     * anchor 비율을 적용할지 여부이며 false이면 요소 좌상단이 좌표에 놓입니다.
     */
    useAnchor?: boolean | null | undefined;
    /**
     * <hidden>
     */
    useanchor?: boolean | null | undefined;
    /**
     * 요소 크기에 맞춰 anchor 비율을 자동으로 조정할지 여부
     */
    autoAnchor?: boolean;
    /**
     * 드래그로 옮긴 현재 위치와 기준점을 잇는 선을 3차원 화면에 그릴지 여부
     */
    useLine?: boolean | null | undefined;
    /**
     * <hidden>
     */
    useline?: boolean | null | undefined;
    /**
     * 기준점 연결선과 끝점 표식을 그릴 색상
     */
    linecolor?: ColorLike;
};

/**
 * U3dOverlay 클래스 생성자에 전달하는 옵션입니다.
 *
 * @memberof U3dOverlay
 * @inner
 *
 * @typedef {object} U3dOverlayCO
 * @property {string} [name] 오버레이를 사람이 구분하기 위한 이름이며 getName 메서드로 돌려받는 값
 * @property {string} [id] 오버레이를 구분하는 식별자이며 생략하면 생성자가 고유 문자열을 만들어 넣습니다.
 * @property {HTMLElement} element 화면에 그릴 DOM 요소이며 HTML 문자열이나 CSS 선택자 문자열로도 전달할 수 있습니다.
 * @property {string} [classtype='U3dOverlay'] 오류 메시지에 함께 출력할 클래스 구분 문자열
 * @property {GeoPosition | undefined} [position] 오버레이를 처음 놓을 위경도 좌표계(EPSG:4326) 좌표
 * @property {GeoPosition | undefined} [endPosition] 드래그해도 움직이지 않는 기준점의 위경도 좌표계(EPSG:4326) 좌표이며, 이 값을 주면 생성 시점에 드래그 기능이 활성화됩니다.
 * @property {GeoPosition | undefined} [endposition] <hidden>
 * @property {{x: number, y: number}} [balloon={x: 0, y: 0}] 말풍선 꼭지점을 오버레이 중심에서 얼마나 옮길지 정하는 화면 픽셀 단위 가로·세로 오프셋
 * @property {Array<number>} [anchor=[0.5, 1]] 요소의 어느 지점을 좌표에 맞출지 정하는 가로·세로 비율이며 각각 0 이상 1 이하의 실수입니다.
 * @property {boolean | null | undefined} [useAnchor=true] anchor 비율을 적용할지 여부이며 false이면 요소 좌상단이 좌표에 놓입니다.
 * @property {boolean | null | undefined} [useanchor=true] <hidden>
 * @property {boolean} [autoAnchor=false] 요소 크기에 맞춰 anchor 비율을 자동으로 조정할지 여부
 * @property {boolean | null | undefined} [useLine=false] 드래그로 옮긴 현재 위치와 기준점을 잇는 선을 3차원 화면에 그릴지 여부
 * @property {boolean | null | undefined} [useline=false] <hidden>
 * @property {ColorLike} [linecolor='#ff0000'] 기준점 연결선과 끝점 표식을 그릴 색상
 */
/**
 * 지도의 지정한 좌표 위에 HTML 요소를 띄워 3차원 화면과 함께 보여 주는 오버레이입니다.
 *
 * 생성만으로는 화면에 나타나지 않습니다. <br>
 * U3dApp의 addOverlay 메서드로 등록해야 화면에 나타나며, 등록 전에 호출한 좌표 지정 메서드는 아무 변화 없이 반환됩니다. <br>
 * 생성 옵션으로 넘긴 좌표는 등록 시점에 함께 적용되므로 등록 뒤에 다시 지정하지 않아도 됩니다.
 *
 * @group view
 */
declare class U3dOverlay {
    /**
     * @returns {HTMLElement}
     *
     * @private
     */
    private static __printOverlayHtml;
    /**
     * U3dOverlay 클래스 생성자입니다.
     *
     * element 옵션에서 사용할 수 있는 DOM 요소를 얻지 못하면 오류 메시지를 남기고 나머지 프로퍼티를 초기화하지 않은 채 반환합니다.
     *
     * @param {U3dOverlayCO} opt 표시할 요소와 초기 좌표·앵커·연결선 설정을 담은 옵션
     */
    constructor(opt: U3dOverlayCO);
    /**
     * 화면에 그리는 DOM 요소입니다. <br>
     * remove 메서드를 호출한 뒤에는 undefined가 됩니다.
     *
     * @type {HTMLElement | undefined}
     */
    element: HTMLElement | undefined;
    _classtype: any;
    /**
     * 오버레이를 구분하는 식별자입니다. <br>
     * id 옵션을 주지 않으면 생성자가 만든 고유 문자열이 들어가고, remove 메서드를 호출한 뒤에는 undefined가 됩니다.
     *
     * @type {string | undefined}
     */
    id: string | undefined;
    /**
     * 오버레이를 사람이 구분하기 위한 이름입니다. <br>
     * name 옵션을 주지 않으면 null이고, remove 메서드를 호출한 뒤에는 undefined가 됩니다.
     *
     * @type {string | null | undefined}
     */
    name: string | null | undefined;
    /**
     * 오버레이가 현재 놓여 있는 위경도 좌표계(EPSG:4326) 좌표입니다. <br>
     * setPosition 메서드와 드래그가 이 값을 갱신하며, 좌표를 한 번도 지정하지 않았으면 null입니다. <br>
     * 이 값에 직접 대입하면 화면 위치는 바뀌지 않으므로 setPosition 메서드를 사용하십시오.
     *
     * @type {GeoPosition | null}
     */
    position: GeoPosition | null;
    /**
     * 드래그해도 움직이지 않는 기준점의 위경도 좌표계(EPSG:4326) 좌표입니다. <br>
     * 연결선이 이 좌표를 한쪽 끝으로 삼으며, 기준점을 지정하지 않았으면 null입니다.
     *
     * @type {GeoPosition | null}
     */
    endposition: GeoPosition | null;
    /**
     * 말풍선 꼭지점을 오버레이 중심에서 얼마나 옮길지 정하는 화면 픽셀 단위 오프셋입니다. <br>
     * remove 메서드를 호출한 뒤에는 undefined가 됩니다.
     *
     * @type {{x: number, y: number} | undefined}
     */
    balloon: {
        x: number;
        y: number;
    } | undefined;
    /**
     * anchor 비율을 적용할지 여부입니다. <br>
     * false이면 요소 좌상단이 좌표에 놓입니다.
     *
     * @type {boolean}
     */
    useAnchor: boolean;
    /**
     * 요소의 어느 지점을 좌표에 맞출지 정하는 가로·세로 비율입니다. <br>
     * 각각 0 이상 1 이하의 실수이며 기본값은 요소 아래쪽 가운데를 뜻합니다.
     *
     * @type {Array<number>}
     */
    anchor: Array<number>;
    /**
     * 요소 크기에 맞춰 anchor 비율을 자동으로 조정할지 여부입니다.
     *
     * @type {boolean}
     */
    autoAnchor: boolean;
    /**
     * 기준점 연결선과 끝점 표식을 그릴 색상입니다.
     *
     * @type {ColorLike}
     */
    linecolor: ColorLike;
    /**
     * 현재 위치와 기준점을 잇는 연결선을 사용할지 여부입니다. <br>
     * updateAnchor 메서드가 isBind 값에 따라 이 값을 다시 설정합니다.
     *
     * @type {boolean}
     */
    useline: boolean;
    _app: U3dApp;
    /**
     * @type {import("@UDrawArg").UDrawArg | undefined}
     *
     * @ignore
     */
    drawArg: UDrawArg | undefined;
    /**
     * 현재 위치와 기준점을 잇는 3차원 선 객체입니다. <br>
     * 연결선을 사용하고 오버레이가 U3dApp에 등록된 뒤에만 만들어지며, 그 전에는 undefined입니다.
     *
     * @type {import("three").Line | undefined}
     */
    meshline: three.Line | undefined;
    /**
     * 연결선의 기준점 쪽 끝을 표시하는 3차원 점 객체입니다. <br>
     * meshline과 같은 조건에서 함께 만들어지며, 그 전에는 undefined입니다.
     *
     * @type {import("three").Points | undefined}
     */
    meshendpoint: three.Points | undefined;
    /**
     * 오버레이가 현재 놓여 있는 지점의 월드 좌표(EPSG:3857) 값입니다. <br>
     * position 값을 좌표 변환한 결과이며 라이브러리가 갱신하므로 직접 대입해도 화면 위치는 바뀌지 않습니다.
     *
     * @type {import('three').Vector3}
     */
    point3D: three.Vector3;
    /**
     * 드래그해도 움직이지 않는 기준점의 월드 좌표(EPSG:3857) 값입니다. <br>
     * endposition 값을 좌표 변환한 결과이며 라이브러리가 갱신하므로 직접 대입해도 화면 위치는 바뀌지 않습니다.
     *
     * @type {import('three').Vector3}
     */
    endPoint3D: three.Vector3;
    /**
     * 오버레이를 화면에 보여 주고 있는지 나타내는 값입니다. <br>
     * show 메서드가 true로, hide 메서드가 false로 바꾸며, 이 값이 false인 동안에는 화면 위치를 다시 계산하지 않습니다. <br>
     * 이 값에 직접 대입하면 화면 표시는 바뀌지 않으므로 show 또는 hide 메서드를 사용하십시오.
     *
     * @type {boolean}
     */
    isShow: boolean;
    /**
     * 화면 좌표를 3차원 좌표로 되돌릴 때 교차 대상으로 사용하는 보조 객체입니다. <br>
     * 드래그 중 마우스 위치를 좌표로 바꾸는 데 쓰이며, remove 메서드를 호출한 뒤에는 undefined가 됩니다.
     *
     * @type {import('three').Sprite | undefined}
     */
    sprite: three.Sprite | undefined;
    /**
     * 오버레이를 기준점에 붙여 둘지 나타내는 값입니다. <br>
     * true이면 연결선과 끝점 표식을 감추고, false이면 둘을 화면에 표시합니다. <br>
     * 이 값을 바꾼 뒤에는 updateAnchor 메서드를 호출해야 화면에 반영됩니다.
     *
     * @type {boolean}
     */
    isBind: boolean;
    /**
     * 호출자가 이 오버레이에 자유롭게 붙여 두는 값입니다. <br>
     * 라이브러리는 이 값을 읽거나 바꾸지 않습니다.
     *
     * @type {object}
     */
    userData: object;
    /**
     * 현재 드래그 상태
     *
     * @type {boolean}
     *
     * @ignore
     */
    _isDragging: boolean;
    /**
     * 드래그 가능 여부 플래그
     *
     * @type {boolean}
     *
     * @ignore
     */
    _draggable: boolean;
    /** @type {number}
     *
     * @ignore
     */
    _lastMouseX: number;
    /** @type {number}
     *
     * @ignore
     */
    _lastMouseY: number;
    /** @type {(e: MouseEvent) => void} */
    _onMouseDown: (e: MouseEvent) => void;
    /** @type {(e: MouseEvent) => void} */
    _onMouseMove: (e: MouseEvent) => void;
    /** @type {(e: MouseEvent) => void} */
    _onMouseUp: (e: MouseEvent) => void;
    /**
     * 요소의 CSS를 직접 바꾼 뒤 크기와 화면 위치를 다시 재도록 요청합니다.
     *
     * 좌표는 바꾸지 않으며 요소의 크기 변화만 화면에 반영합니다.
     *
     */
    needUpdate(): void;
    /**
     * 오버레이를 구분하는 식별자를 반환합니다.
     *
     * @returns {string | undefined} 생성 시 지정했거나 자동으로 만들어진 식별자. <br>
     * remove 메서드를 호출한 뒤에는 undefined를 반환합니다.
     */
    getId(): string | undefined;
    /**
     * 오버레이에 붙여 둔 이름을 반환합니다.
     *
     * @returns {string | null | undefined} 생성 시 지정한 이름. <br>
     * 이름을 지정하지 않았으면 null, remove 메서드를 호출한 뒤에는 undefined를 반환합니다.
     */
    getName(): string | null | undefined;
    /**
     * @deprecated getEndPosition 메서드를 사용하십시오.
     *
     * @returns {GeoPosition | null}
     *
     * @ignore
     */
    getEndposition(): GeoPosition | null;
    /**
     * 드래그해도 움직이지 않는 기준점의 좌표를 반환합니다.
     *
     * @returns {GeoPosition | null} 기준점의 위경도 좌표계(EPSG:4326) 좌표. <br>
     * 기준점을 지정하지 않았으면 null을 반환합니다.
     */
    getEndPosition(): GeoPosition | null;
    /**
     * 오버레이 Element ID 반환 메서드
     *
     * @returns {string | undefined} 오버레이 Element ID. <br>
     * ID가 없으면 undefined를 반환합니다.
     *
     * @ignore
     * */
    getElementId(): string | undefined;
    /**
     * 오버레이가 화면에 그리고 있는 DOM 요소를 반환합니다.
     *
     * 반환한 요소는 오버레이가 계속 사용하는 원본이므로 이 요소를 지우면 오버레이도 화면에서 제거됩니다.
     *
     * @returns {HTMLElement | undefined} 화면에 그리는 DOM 요소. <br>
     * 생성 시 요소를 얻지 못했거나 remove 메서드를 호출한 뒤에는 undefined를 반환합니다.
     */
    getElement(): HTMLElement | undefined;
    /**
     * 오버레이가 현재 놓여 있는 좌표를 반환합니다.
     *
     * @returns {GeoPosition | null} 현재 위치의 위경도 좌표계(EPSG:4326) 좌표. <br>
     * 좌표를 한 번도 지정하지 않았으면 null을 반환합니다.
     */
    getPosition(): GeoPosition | null;
    /**
     * @param {boolean} isBind
     *
     * @ignore
     */
    setIsBind(isBind: boolean): void;
    /**
     * 마우스로 오버레이를 끌어 옮길 수 있는지 설정합니다.
     *
     * false를 넘기면 드래그를 끄면서, 기준점 좌표가 있을 경우 오버레이를 그 기준점 위치로 되돌리고 연결선도 함께 다시 그립니다. <br>
     * 생성 시 endPosition 옵션을 주면 이 메서드가 자동으로 한 번 호출되어 드래그가 켜진 상태로 시작합니다.
     *
     * @param {boolean} draggable 드래그를 허용할지 여부
     */
    setDraggable(draggable: boolean): void;
    /**
     * @param {MouseEvent} e 마우스 이벤트
     *
     * @ignore
     */
    _handleMouseDown(e: MouseEvent): void;
    /**
     * @param {MouseEvent} e 마우스 이벤트
     *
     * @ignore
     */
    _handleMouseMove(e: MouseEvent): void;
    /**
     * 마우스 버튼을 놓았을 때 드래그 상태를 해제하는 메서드
     *
     * @ignore
     */
    _handleMouseUp(): void;
    /**
     * Overlay를 app에 세팅하는 메서드
     *
     * @param {import('@U3dApp').U3dApp} app
     *
     * @ignore
     */
    setApp(app: U3dApp): void;
    _renderer: URenderer;
    _manager: U3dOverlayManager;
    _rect: DOMRect;
    /**
     * 오버레이의 DOM 요소와 이벤트, 연결선 등 등록된 모든 자원을 정리하고 화면에서 제거합니다.
     *
     * 정리한 뒤에는 식별자·이름·요소가 모두 비워지므로 이 오버레이를 다시 사용할 수 없습니다. <br>
     * 같은 내용을 다시 보여 주려면 새 오버레이를 만들어 U3dApp에 등록하십시오.
     *
     */
    remove(): void;
    /**
     * 오버레이를 화면에 다시 표시합니다.
     *
     * 연결선과 끝점 표식을 사용 중이면 그 둘도 함께 3차원 화면에 다시 추가합니다.
     *
     */
    show(): void;
    /**
     * 오버레이를 화면에서 숨김 처리합니다.
     *
     * 연결선과 끝점 표식을 사용 중이면 그 둘도 함께 3차원 화면에서 내리며, 감춘 동안에는 화면 위치를 다시 계산하지 않습니다. <br>
     * 요소 자체는 남아 있으므로 show 메서드로 다시 보여 줄 수 있습니다.
     *
     */
    hide(): void;
    /**
     * Overlay 부하 테스트 함수
     *
     * @param {boolean} [showLog = false] 진행사항 로그 출력 여부
     * @param {import('@U3dApp').U3dApp | undefined} [u3dApp = undefined] test 진행 U3dApp
     * @param {number} [count = 1000] test 생성 갯수
     *
     * @returns {number}
     *
     * @ignore
     */
    __testIntervalOverlay(showLog?: boolean, u3dApp?: U3dApp | undefined, count?: number): number;
    /**
     * Overlay EndPosition(원점 위경도 좌표) 위치를 갱신하는 메서드
     *
     * @param {GeoPosition} latlon 위경도 좌표계(EPSG:4326) 좌표
     * @param {WorldPosition} vec3 월드 좌표(EPSG:3857) 값
     *
     * @ignore
     */
    updateEndPosition(latlon: GeoPosition, vec3: WorldPosition): void;
    /**
     * 오버레이를 지정한 좌표로 옮기고 화면 위치를 다시 계산합니다.
     *
     * 좌표만 이동하며 앵커 설정과 연결선의 양 끝 위치는 바꾸지 않습니다. <br>
     * 오버레이를 U3dApp에 등록하기 전에 호출하면 아무 변화 없이 반환됩니다.
     *
     * @param {GeoPosition} latlon 오버레이를 놓을 위경도 좌표계(EPSG:4326) 좌표
     * @param {WorldPosition| undefined} [vec3] 같은 지점의 월드 좌표(EPSG:3857) 값이며, 넘기면 좌표 변환을 건너뜁니다.
     */
    setPosition(latlon: GeoPosition, vec3?: WorldPosition | undefined): void;
    /**
     * 드래그해도 움직이지 않는 기준점의 좌표를 지정합니다.
     *
     * 기준점만 이동하며 현재 위치와 연결선의 양 끝 위치는 따라 움직이지 않습니다. <br>
     * 오버레이를 U3dApp에 등록하기 전에 호출하면 아무 변화 없이 반환됩니다.
     *
     * @param {GeoPosition} latlon 기준점으로 삼을 위경도 좌표계(EPSG:4326) 좌표
     * @param {WorldPosition} [worldPosition] 같은 지점의 월드 좌표(EPSG:3857) 값이며, 넘기면 좌표 변환을 건너뜁니다.
     *
     * @returns {boolean | undefined} 기준점을 지정했으면 true. <br>
     * 오버레이가 U3dApp에 등록되지 않아 아무 일도 하지 않았으면 undefined를 반환합니다.
     */
    setEndPosition(latlon: GeoPosition, worldPosition?: WorldPosition): boolean | undefined;
    /**
     * isBind 값에 맞춰 연결선과 끝점 표식의 표시 여부를 다시 반영합니다.
     *
     * isBind가 true이면 둘을 감추고 false이면 둘을 보여 주며, useline 값도 같은 기준으로 다시 설정합니다.
     *
     */
    updateAnchor(): void;
    /**
     * 요소의 스타일을 바꾼 뒤 현재 좌표로 화면 위치를 즉시 다시 계산하도록 요청합니다.
     *
     * 다음 화면 갱신을 기다리는 needUpdate 메서드와 달리 갱신을 바로 실행합니다.
     *
     */
    callOnchange(): void;
    /**
     * 오버레이를 지정한 좌표로 옮기면서 연결선 표시 여부와 화면 위치까지 한 번에 갱신합니다.
     *
     * 좌표 이동, isBind 값에 따른 연결선 표시 갱신, 화면 위치 즉시 재계산을 차례로 수행합니다. <br>
     * 연결선의 양 끝 위치는 다시 계산하지 않으므로 드래그 중인 선까지 맞추려면 updatePosition 메서드를 사용하십시오.
     *
     * @param {GeoPosition} latlon 오버레이를 놓을 위경도 좌표계(EPSG:4326) 좌표
     * @param {WorldPosition} [vec3] 같은 지점의 월드 좌표(EPSG:3857) 값이며, 넘기면 좌표 변환을 건너뜁니다.
     */
    manualUpdate(latlon: GeoPosition, vec3?: WorldPosition): void;
    /**
     * 화면 좌표를 3차원 좌표로 되돌릴 때 쓰는 보조 객체의 위치를 이동합니다.
     *
     * 드래그로 얻는 좌표의 기준면을 옮기는 것이며 오버레이 요소의 화면 위치는 바뀌지 않습니다. <br>
     * 오버레이를 U3dApp에 등록하기 전에 호출하면 아무 변화 없이 반환됩니다.
     *
     * @param {WorldPosition} [vec3] 보조 객체를 놓을 월드 좌표(EPSG:3857) 값이며, 생략하면 현재 위치를 변환해 사용합니다.
     */
    updateSpritePosition(vec3?: WorldPosition): void;
    /**
     * 현재 위치와 기준점을 잇는 연결선을 3차원 화면에 추가하거나 제거합니다.
     *
     * 이 메서드는 이미 만들어진 연결선을 화면에 넣고 뺄 뿐이며 연결선을 새로 만들지 않습니다. <br>
     * 연결선을 쓰려면 useLine 옵션을 켜고 오버레이를 U3dApp에 등록한 뒤에 호출하십시오.
     *
     * @param {boolean} visible 연결선을 보여 줄지 여부
     */
    showLine(visible: boolean): void;
    /**
     * 연결선의 양 끝을 모두 기준점 위치로 되돌려 선을 접힌 상태로 초기화합니다.
     *
     * isBind가 true이면 기준점 쪽 끝만, false이면 양 끝을 모두 기준점으로 이동합니다. <br>
     * 연결선이 아직 만들어지지 않았으면 아무 변화 없이 반환됩니다.
     *
     */
    initViewLine(): void;
    /**
     * 오버레이를 지정한 좌표로 이동하고 연결선의 양 끝을 현재 위치와 기준점에 다시 맞게 갱신합니다.
     *
     * 연결선을 쓰지 않는 오버레이에서는 좌표 이동만 수행합니다. <br>
     * 연결선 표시 여부까지 맞추려면 manualUpdate 메서드를 사용하십시오.
     *
     * @param {GeoPosition} latlon 오버레이를 놓을 위경도 좌표계(EPSG:4326) 좌표
     * @param {WorldPosition} [vec3] 같은 지점의 월드 좌표(EPSG:3857) 값이며, 넘기면 좌표 변환을 건너뜁니다.
     */
    updatePosition(latlon: GeoPosition, vec3?: WorldPosition): void;
    #private;
}

export type { U3dOverlay, U3dOverlayCO };
