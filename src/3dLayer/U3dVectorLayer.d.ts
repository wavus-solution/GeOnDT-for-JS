// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "./U3dLayer.js";
import type { U3dVectorLayerCO, U3dVectorLayerEMI } from "./U3dVectorLayer.types.js";
import type { UCheckTime } from "../core/UCheckTime.js";
import type { U3dGeometry } from "../geometry/U3dGeometry.js";
import type { UMercator } from "../math/UMercator.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";

/**
 * ~extends import('@U3dLayer').U3dLayer <br>
 *
 * 점·선·면·박스 등 3D 도형(`U3dGeometry` 파생 객체)을 담아 화면에 가시화하는 레이어입니다. <br>
 * 도형을 만든 뒤 `addGeometry`로 등록하면 화면에 표시됩니다. <br>
 * 가시화·축척·제거를 레이어 단위로 일괄 제어합니다. <br>
 *
 * @group 3dLayer
 * @extends {U3dLayer}
 *
 * @see {@link https://3d.geon.kr/doc/tutorial-official/vectorLayer.html}
 */
declare class U3dVectorLayer extends U3dLayer {
    /**
     * 이 레이어가 발생시키는 이벤트 이름 모음입니다. <br>
     * `U3dVectorLayerEMD`와 같은 객체입니다. <br>
     *
     * @override
     *
     * @type {U3dVectorLayerEMI}
     */
    static override EVENT: U3dVectorLayerEMI;
    /**
     * U3dVectorLayer 클래스 생성자입니다. <br>
     * 옵션은 모두 선택 사항이며, 생략하면 각 옵션의 기본값이 적용됩니다. <br>
     *
     * @param { U3dVectorLayerCO } [opt] 조명·자동 높이·축척 등 레이어의 초기 동작을 정하는 생성자 옵션 <br>
     */
    constructor(opt?: U3dVectorLayerCO);
    /**
     * 생성자 옵션 `uselight`으로 지정하는 조명 사용 설정값입니다. <br>
     * 이 레이어는 값을 보관하며, 등록 도형의 재질이나 밝기를 자동으로 바꾸지는 않습니다. <br>
     *
     * @type {boolean}
     */
    _uselight: boolean;
    /**
     * 도형의 높이를 지형 표고에 맞춰 자동으로 올릴지 여부입니다. <br>
     * true이면 도형을 등록할 때와 지형 타일이 로드될 때 도형의 z값을 지형 높이로 바꿉니다. <br>
     * 이 값을 직접 바꾸면 이미 등록된 도형에는 반영되지 않으므로 `setAutoHeight`로 설정하십시오. <br>
     *
     * @type {boolean}
     */
    autoHeight: boolean;
    /**
     * 자동 높이를 적용할 때 지형 표고 위로 도형을 띄울 높이입니다. <br>
     *
     * @type {number}
     */
    _defaultZoffset: number;
    /**
     * 이 레이어에 등록된 전체 도형을 도형의 uuid로 찾을 수 있게 보관하는 목록입니다. <br>
     *
     * @type {Map<string, import('@U3dGeometry').U3dGeometry>}
     */
    _geomList: Map<string, U3dGeometry>;
    /**
     * 갱신할 때마다 `updateFunction`을 호출해 표시 여부를 다시 계산해야 하는 도형만 모아 둔 목록입니다. <br>
     *
     * @type {Map<string, import('@U3dGeometry').U3dGeometry>}
     */
    _updateGeomList: Map<string, U3dGeometry>;
    /**
     * 화면에 보이는 타일에 속한 도형만 표시하는 타일 단위 동적 갱신을 사용할지 여부입니다. <br>
     *
     * @type {boolean}
     */
    _dynamicUpdate: boolean;
    /**
     * 타일 키별로 그 타일 범위에 들어가는 도형의 uuid를 모아 둔 색인입니다. <br>
     *
     * @type {Map<string, Set<string>>}
     */
    _modelAtTile: Map<string, Set<string>>;
    /**
     * 도형의 uuid별로 그 도형이 걸쳐 있는 타일 키와 해당 타일이 현재 화면에 있는지 여부를 보관하는 색인입니다. <br>
     *
     * @type {Map<string, Map<string, boolean>>}
     */
    _indexAtModel: Map<string, Map<string, boolean>>;
    /**
     * 등록되는 단층(`U3dFault`) 도형에 적용할 렌더 순서 보정값입니다. <br>
     * 겹친 면이 번갈아 깜빡이는 z-fighting을 줄일 때 사용합니다. <br>
     *
     * @type {number}
     */
    _renderOffset: number;
    /**
     * 도형의 원래 높이를 나눌 축척 비율이며 1이면 원래 높이를 그대로 사용합니다. <br>
     *
     * @type {number}
     */
    _scaleRatio: number;
    /**
     * 도형의 위치를 타일 번호로 바꿀 때 사용하는 메르카토르(Mercator) 투영 계산기입니다. <br>
     * 타일 단위 동적 갱신을 사용할 때만 생성되며, 사용하지 않으면 undefined입니다. <br>
     *
     * @type {import('@union3d/math/UMercator').UMercator | undefined}
     */
    _mercator: UMercator | undefined;
    /**
     * 갱신이 너무 자주 수행되지 않도록 직전 갱신 이후 지난 시간을 확인하는 검사기입니다. <br>
     *
     * @type {import('@union3d/core/UCheckTime').UCheckTime}
     */
    _checkTime: UCheckTime;
    /**
     * 자동 높이 갱신에 등록해 둔 도형을 uuid로 보관하는 목록이며, 중복 등록과 해제 누락을 막는 데 사용합니다. <br>
     *
     * @type {Map<string, import('@U3dGeometry').U3dGeometry>}
     */
    _autoHeightList: Map<string, U3dGeometry>;
    /**
     * light 사용 여부를 반환하는 함수
     *
     * @returns {boolean} light 사용 여부
     *
     * @ignore
     */
    getUseLight(): boolean;
    /**
     * light 사용 여부를 설정하는 함수
     *
     * @param {boolean} val light 사용 여부
     *
     * @ignore
     */
    setUseLight(val: boolean): void;
    /**
     * 3D Geometry 객체를 레이어에 추가하여 화면에 가시화하는 함수입니다. <br>
     * 추가한 뒤 도형의 `setPosition`/`addPosition`으로 좌표를 지정하면 해당 위치에 그려집니다. <br>
     * 레이어의 `autoHeight`·`scaleRatio`는 추가 시점에 함께 적용됩니다. <br>
     * `renderOffset`은 단층(`U3dFault`) 도형에만 적용됩니다. <br>
     *
     * @param {import('@U3dGeometry').U3dGeometry} geom 이 레이어에 등록해 화면에 표시할 도형 객체 <br>
     */
    addGeometry(geom: U3dGeometry): void;
    /**
     * 이 레이어에 등록된 모든 3D Geometry 객체를 차례로 꺼낼 수 있는 반복자를 반환하는 함수입니다. <br>
     *
     * @returns {IterableIterator<import('@U3dGeometry').U3dGeometry>} 등록된 도형을 하나씩 꺼내는 반복자이며, 순회 도중 도형을 추가·제거하면 결과가 달라짐 <br>
     */
    getGeometries(): IterableIterator<U3dGeometry>;
    /**
     * 이 레이어에 등록된 모든 3D Geometry 객체를 배열로 복사해 반환하는 함수입니다. <br>
     *
     * @returns {Array<import('@U3dGeometry').U3dGeometry>} 호출 시점의 등록 도형을 담은 새 배열이며, 배열을 바꿔도 레이어의 등록 목록은 바뀌지 않음 <br>
     */
    getGeometryArray(): Array<U3dGeometry>;
    /**
     * 등록된 모든 3D Geometry 객체의 높이 축척을 일괄 설정하는 함수입니다. <br>
     * 도형의 원래 높이를 `val`로 나눈 위치에 배치하므로 값이 작을수록 높이가 과장됩니다. <br>
     * 지하 단면이나 단층의 기복을 강조할 때 사용합니다. <br>
     * 설정한 값은 레이어에 남아 이후 `addGeometry`로 추가하는 도형에도 적용됩니다. <br>
     *
     * @param {number} val 도형의 원래 높이를 나눌 축척 비율이며 1이면 원래 높이, 0은 높이가 무한대가 되므로 사용 금지 <br>
     */
    setScaleRatio(val: number): void;
    /**
     * 이 레이어의 도형을 화면에 보이거나 숨기는 함수입니다. <br>
     * 레이어에 등록된 도형과 라벨이 함께 처리됩니다. <br>
     * 라벨은 각 도형의 라벨 표시 설정을 따르므로 `show(true)`가 모든 라벨을 켜지는 않습니다. <br>
     * 숨겨도 도형은 그대로 남아 있으므로 `show(true)`로 다시 표시할 수 있습니다. <br>
     *
     * @override
     *
     * @param {boolean} show 도형을 보일지 여부이며 true면 보이기, false면 숨김 <br>
     */
    override show(show: boolean): void;
    /**
     * 3D Geometry 객체 하나를 레이어에서 제거하는 함수입니다. <br>
     * 타일 색인과 자동 높이 등록도 함께 정리됩니다. <br>
     * 지오메트리·재질 자원은 해제하지 않으므로 같은 도형을 다시 `addGeometry`로 등록해 재사용할 수 있습니다. <br>
     * 등록된 도형을 한 번에 제거하려면 `removeAllGeometries`를, 자원까지 해제하려면 `clear`를 사용하십시오. <br>
     *
     * @param {import('@U3dGeometry').U3dGeometry} geom 이 레이어에서 제거할 도형 객체 <br>
     */
    removeGeometry(geom: U3dGeometry): void;
    /**
     * 레이어를 갱신하는 함수
     *
     * @override
     *
     * @ignore
     */
    override update(): void;
    /**
     * 타일 단위 동적 갱신 사용 여부를 설정하는 함수입니다. <br>
     * 활성화하면 화면에 보이는 타일에 속한 도형만 렌더링하므로 도형 수가 많을 때 부담이 줄어듭니다. <br>
     * 생성자 옵션 `dynamicUpdate`와 같은 설정이며, 이 함수로 켜면 이미 등록된 도형도 타일 색인에 함께 등록됩니다. <br>
     * 이미 등록된 도형은 켜는 시점에 숨기지 않고, 이후 타일이 화면에 들어오고 나갈 때부터 표시 여부가 조정됩니다. <br>
     * 위치가 아직 원점(x와 y가 모두 0)인 도형은 좌표가 정해지지 않은 것으로 보아 색인에서 제외합니다. <br>
     *
     * @param {boolean} val 타일 단위 동적 갱신을 사용할지 여부 <br>
     */
    setDynamicUpdate(val: boolean): void;
    /**
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @returns {undefined}
     *
     * @ignore
     */
    override removeTileFromScene(tile: U3dQuadTile): undefined;
    /**
     * U3dPoint(점) Geometry 객체를 추가하는 함수
     *
     * @param {number} x x좌표
     * @param {number} y y좌표
     * @param {number} z z좌표
     *
     * @ignore
     */
    addPoint(x: number, y: number, z: number): void;
    /**
     * U3dLine(선) Geometry 객체를 추가하는 함수
     *
     * @param {import('three').Vector3} vec3 선을 구성할 꼭짓점 좌표
     *
     * @ignore
     */
    addLine(vec3: three.Vector3): void;
    /**
     * 등록된 전체 3D Geometry 객체를 제거하고 레이어를 비우는 함수입니다. <br>
     * 목록 제거와 함께 지오메트리·재질·라벨 자원까지 해제하므로 제거한 도형은 다시 사용할 수 없습니다. <br>
     * 자원을 유지한 채 목록만 비우려면 `removeAllGeometries`를 사용하십시오. <br>
     * 축척·자동 높이 같은 레이어 설정은 그대로 남으므로, 비운 뒤에도 같은 레이어에 새 도형을 계속 등록할 수 있습니다. <br>
     */
    clear(): void;
    /**
     * 도형의 높이를 지형 표고에 맞춰 자동으로 올릴지 설정하는 함수입니다. <br>
     * 활성화하면 이미 등록된 도형까지 지형 표고에 맞춰 올라가고, 이후 지형 타일이 로드될 때마다 높이가 갱신됩니다. <br>
     * 비활성화하면 자동 높이 갱신 등록을 해제합니다. <br>
     * 지형 위로 띄울 높이는 생성자 옵션 `defaultZoffset`으로 지정합니다. <br>
     *
     * @param {boolean} value 자동 높이를 사용할지 여부 <br>
     */
    setAutoHeight(value: boolean): void;
    /**
     * 자동 높이 사용 여부를 반환하는 함수입니다. <br>
     *
     * @returns {boolean} 자동 높이를 사용 중이면 true <br>
     */
    getAutoHeight(): boolean;
    /**
     * 레이어에 등록된 도형을 나중에 다시 만들 수 있는 형태로 모아 반환하는 함수입니다. <br>
     * 각 도형의 `getParam` 결과를 `{type, param}` 목록으로 모으므로, JSON으로 보관했다가 `loadWork`로 복원할 수 있습니다. <br>
     * `getParam`이 없는 도형은 제외되며, 저장할 도형이 없으면 undefined를 반환합니다. <br>
     * 호출하면 SAVE 이벤트가 발생하며, 이벤트의 `data`에 저장한 도형 목록이 실려 옵니다. <br>
     *
     * @returns {{geometries: Array<Partial<{type: string, param: Record<string, unknown>}>>, name: string} | undefined} 도형 목록과 레이어 이름을 담은 새 객체이며, 저장할 도형이 없으면 undefined <br>
     *
     * @example
     * {
     *     geometries : [{ type: 'U3dBox', param: {...} }],
     *     name : 'vector'
     * }
     */
    saveWork(): {
        geometries: Array<Partial<{
            type: string;
            param: Record<string, unknown>;
        }>>;
        name: string;
    } | undefined;
    /**
     * `saveWork`로 저장해 둔 데이터를 읽어 도형을 다시 만드는 함수입니다. <br>
     * 저장 항목마다 `callback`이 한 번씩 호출되며, 저장된 `type`에 맞는 도형을 만들어 레이어에 등록하는 일은 `callback`이 담당합니다. <br>
     * `callback`이 Promise를 반환하면 모든 처리가 끝날 때까지 기다립니다. <br>
     * 같은 이름(`param.name`)의 도형이 이미 있으면 경고를 남기고 해당 항목을 건너뜁니다. <br>
     * 항목이 처리될 때마다 LOAD 이벤트가 발생합니다. <br>
     * 모든 항목을 동시에 처리하므로 호출 순서대로 끝난다고 가정하지 마십시오. <br>
     * `callback`이 실패하면 반환한 Promise 전체가 실패하며, 그때까지 등록된 도형은 레이어에 남습니다. <br>
     *
     * @param {Partial<{type: string, param: Record<string, unknown>}> | Array<Partial<{type: string, param: Record<string, unknown>}>>} savedData `saveWork` 결과의 `geometries` 항목 하나 또는 그 배열 <br>
     * @param {function(Partial<{type: string, param: Record<string, unknown>}>): *} callback 저장 항목 하나를 받아 도형을 만들고 `addGeometry`로 등록하는 사용자 콜백 함수 <br>
     * @returns {Promise<Array<*>>} 모든 콜백 처리가 끝나면 `callback`의 반환값을 저장 항목 순서대로 담은 배열로 완료되는 Promise <br>
     */
    loadWork(savedData: Partial<{
        type: string;
        param: Record<string, unknown>;
    }> | Array<Partial<{
        type: string;
        param: Record<string, unknown>;
    }>>, callback: (arg0: Partial<{
        type: string;
        param: Record<string, unknown>;
    }>) => any): Promise<Array<any>>;
    /**
     * 등록된 전체 도형을 감싸는 최소 육면체(바운딩박스)를 반환하는 함수입니다. <br>
     * 카메라를 전체 도형이 보이는 위치로 옮길 때 사용합니다. <br>
     * 등록된 도형이 없으면 비어 있는 Box3를 반환합니다. <br>
     *
     * 축척과 자동 높이가 적용된 뒤의 현재 위치를 기준으로 계산합니다. <br>
     *
     * @returns {import('three').Box3} 전체 도형을 감싸는 새 Box3 객체이며 좌표는 도형이 배치된 월드 좌표 기준 <br>
     */
    getBoundingBox(): three.Box3;
    /**
     * 이름으로 3D Geometry 객체를 찾아 반환하는 함수입니다. <br>
     * 도형을 만들 때 지정한 `name` 값과 비교하며, 같은 이름이 여럿이면 먼저 찾은 객체만 반환합니다. <br>
     *
     * @param {string} name 찾으려는 도형에 지정된 이름 <br>
     * @returns {import('@U3dGeometry').U3dGeometry | undefined} 이름이 일치하는 도형이며 없으면 undefined <br>
     */
    getGeometryByName(name: string): U3dGeometry | undefined;
    /**
     * 등록된 모든 3D Geometry 객체를 레이어에서 제거하는 함수입니다. <br>
     * 각 도형의 타일 색인과 자동 높이 등록도 함께 정리됩니다. <br>
     * `clear`와 달리 지오메트리·재질 자원은 해제하지 않으므로, 같은 도형을 다시 `addGeometry`로 등록해 재사용할 수 있습니다. <br>
     * 제거한 도형을 다시 쓰려면 호출 전에 참조를 따로 보관해 두십시오. <br>
     */
    removeAllGeometries(): void;
    #private;
}

export type { U3dVectorLayer };
