// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UDEF } from "./UDEF.js";
import type { UGroup } from "./UGroup.js";
import type { PostProcessParam } from "./URenderer.types.js";
import type { UPassInfo } from "../postProcess/UPassInfo.js";
import type { DeferredObject } from "../util/deferred.types.js";

/**
 * ~extends import('three').WebGLRenderer <br>
 *
 * 지도 화면 한 장을 그려 내는 렌더러이며, three.js WebGLRenderer를 상속해 GeOnDT의 장면 구성과 후처리를 얹은 것입니다.
 *
 * 그리기 컨텍스트(context)는 three.js WebGLRenderer가 자기 canvas에 WebGL2로 만들며 이 클래스가 따로 만들지 않습니다.<br>
 * 생성 직후 그 컨텍스트에 KHR_parallel_shader_compile과 WEBGL_multi_draw 확장을 요청하는데, 있으면 쓰고 없으면 그대로 진행하므로 지원하지 않는 기기에서도 그리기 자체는 동작합니다.<br>
 * 셰이더(shader) 오류 검사와 그림자 맵 자동 갱신, 렌더 통계 자동 초기화를 모두 꺼서 프레임마다 드는 비용을 줄이고, 그 시점은 draw()가 직접 정합니다.<br>
 * 컨텍스트를 잃거나 되찾는 이벤트는 setApp()이 등록하며 dispose()는 컨텍스트를 강제로 버립니다.<br>
 * 화면 크기를 바꾸는 setSize()와 setDrawingBufferSize()는 상속본을 감싸서 후처리 pass 크기와 라벨 렌더러 크기까지 함께 맞춥니다.
 *
 * 후처리는 UEffectComposer를 사용하여 하나에 pass를 끼워 넣는 방식으로 관리합니다.<br>
 * initComposer()가 필요한 pass를 모두 만들어 이름별로 등록해 두고, 그중 켜져 있는 pass만 실제로 composer에 들어갑니다.<br>
 * 등록한 뒤에 켜고 끄는 것은 activePass()만 사용하며, 이 메서드가 켜짐 상태를 바꾸면서 composer에 넣거나 빼 줍니다.<br>
 * pass는 등록한 순서가 아니라 각자 가진 순서 값대로 실행되므로 새 pass를 넣을 때는 순서 값을 먼저 정해야 합니다.<br>
 * setPostProcess(false)로 후처리를 끄면 화면 품질용 pass만 꺼지고 화면 출력과 분석·유틸 pass는 그대로 남습니다.
 *
 * @group core
 */
declare class URenderer extends three.WebGLRenderer {
    /**
     * 후처리 대비(contrast)의 기본값이며 setPostOption()에서 값을 지정하지 않았을 때 사용합니다.<br>
     * 1보다 크면 밝고 어두운 차이가 커집니다.
     *
     * @type {number}
     */
    static DEFAULT_CONTRAST: number;
    /**
     * 후처리 밝기(brightness)의 기본값이며 setPostOption()에서 값을 지정하지 않았을 때 사용합니다.<br>
     * 1보다 크면 화면 전체가 밝아집니다.
     *
     * @type {number}
     */
    static DEFAULT_BRIGHTNESS: number;
    /**
     * 주변광 차폐(ambient occlusion) pass를 기본으로 켤지 여부입니다.<br>
     * setPostOption()을 호출할 때마다 기기 성능 판정값으로 덮어써집니다.
     *
     * @type {boolean}
     */
    static DEFAULT_USE_AO: boolean;
    /**
     * 계단 현상 완화(FXAA) pass의 선명도 기본값입니다.<br>
     * 화면 크기에 이 값을 곱해 pass가 참고할 해상도를 정하므로 값이 클수록 덜 흐려집니다.
     *
     * @type {number}
     */
    static DEFAULT_FXAA_SHARPNESS: number;
    /**
     * 밝은 곳이 번지는 Bloom pass를 기본으로 켤지 여부입니다.<br>
     * setPostOption()을 호출할 때마다 기기 성능 판정값으로 덮어써집니다.
     *
     * @type {boolean}
     */
    static DEFAULT_USE_BLOOM: boolean;
    /**
     * Bloom pass 세기의 기본값이며 클수록 번짐이 강해집니다.
     *
     * @type {number}
     */
    static DEFAULT_BLOOM_STRENGTH: number;
    /**
     * 색 경계의 띠를 흩뜨리는 Dither pass를 기본으로 켤지 여부입니다.
     *
     * @type {boolean}
     */
    static DEFAULT_USE_DITHER: boolean;
    constructor(opt?: {});
    _classtpye: string;
    __setSize: any;
    __setDrawingBufferSize: any;
    __renderBufferDirect: (camera: three.Camera, scene: three.Scene, geometry: three.BufferGeometry, material: three.Material, object: three.Object3D, group: three.GeometryGroup) => void;
    _drawCall: number;
    _shadowDrawCall: number;
    _isShadowDraw: boolean;
    _beforeRender: any[];
    _afterRender: any[];
    addedRenderItems: any[];
    /**
     * 후처리 사용 여부를 바꿉니다.<br>
     * 켜면 setPostOption()을 다시 적용해 화면 품질용 pass를 현재 설정대로 되살립니다.<br>
     * 끄면 화면 품질용 pass를 모두 내리지만 화면 출력과 분석·유틸 pass는 건드리지 않아 장면은 계속 보입니다.<br>
     * 이미 같은 상태이면 아무 일도 하지 않습니다.
     *
     * @param {boolean} use true이면 후처리를 켜고 false이면 화면 품질용 pass를 끔
     */
    setPostProcess(use: boolean): void;
    /**
     * 현재 후처리 설정 객체를 반환합니다.<br>
     * 보관 중인 객체를 그대로 돌려주므로 속성을 직접 고칠 수 있지만, 고친 값을 pass에 반영하려면 setPostOption()을 호출해야 합니다.
     *
     * @returns {PostProcessParam} 대비·밝기·AO·Bloom·Dither 설정을 담은 객체
     */
    getPostOption(): PostProcessParam;
    /**
     * 후처리 설정을 갱신하고 그 값을 각 pass에 반영합니다.<br>
     * 넘기지 않은 항목은 기존 값을 유지하고, 기존 값도 없으면 정적 기본값을 사용합니다.<br>
     * AO와 Bloom의 기본값은 호출할 때마다 기기 성능 판정값으로 먼저 덮어쓰므로, 저사양 기기에서는 지정하지 않은 항목이 꺼진 채로 시작합니다.<br>
     * 화면 품질용 pass를 모두 켠 뒤 대비·밝기를 적용하고, AO·Bloom·Dither는 설정값에 따라 개별로 켜고 끕니다.<br>
     * composer가 아직 없으면 등록된 pass가 없어 설정 저장까지만 이뤄집니다.
     *
     * @param {Partial<PostProcessParam>} [option={}] 바꿀 항목만 담은 설정이며, 생략한 항목은 기존 값 또는 기본값을 사용
     */
    setPostOption(option?: Partial<PostProcessParam>): void;
    _postOption: {};
    /**
     * 현재 화면 크기를 composer와 크기에 민감한 pass들에 다시 알려 줍니다.<br>
     * 감싼 setSize()와 setDrawingBufferSize()가 자동으로 부르므로 보통 직접 호출할 필요는 없습니다.<br>
     * 등록되어 있는 pass만 갱신하며 FXAA는 선명도 설정을 곱해 참고 해상도를 다시 계산합니다.
     */
    setPassSize(): void;
    /**
     * 직전 프레임에서 그림자를 뺀 그리기 호출 수를 반환합니다.
     *
     * @returns {number} 마지막으로 집계한 화면 그리기 호출 수
     */
    getDrawCall(): number;
    /**
     * 직전에 그림자 맵을 갱신한 프레임의 그리기 호출 수를 반환합니다.<br>
     * 그림자는 매 프레임 갱신하지 않으므로 이 값은 마지막 갱신 때의 수치로 남아 있습니다.
     *
     * @returns {number} 마지막 그림자 갱신에서 집계한 그리기 호출 수
     */
    getShadowDrawCall(): number;
    /**
     * 보관 중인 그림자 그리기 호출 수를 0으로 되돌립니다.
     */
    _clearShadowDrawCall(): void;
    /**
     * 장면에서 실제로 그릴 객체들이 담기는 그룹을 반환합니다.<br>
     * setApp()으로 앱을 연결한 뒤에만 값이 있습니다.
     *
     * @returns {import("@UGroup").UGroup | undefined} 렌더 대상 객체들의 부모 그룹
     */
    getRenderGroup(): UGroup | undefined;
    /**
     * 각 프레임에서 그리기 직전에 모든 mesh마다 실행할 콜백을 등록합니다.<br>
     * 콜백은 mesh 하나를 인수로 받으며, 등록된 콜백이 하나라도 있으면 프레임마다 렌더 그룹 전체를 훑으므로 객체가 많으면 비용이 커집니다.<br>
     * 같은 key가 이미 등록되어 있으면 알림만 남기고 등록하지 않습니다.
     *
     * @param {string} key 나중에 해제할 때 쓸 식별 이름
     * @param {(mesh: import("three").Object3D) => void} callback 보이는 mesh마다 실행할 함수
     * @returns {boolean} 등록했으면 true, 같은 key가 이미 있으면 false
     */
    addPreRender(key: string, callback: (mesh: three.Object3D) => void): boolean;
    /**
     * 등록해 둔 그리기 직전 콜백을 해제합니다.
     *
     * @param {string} key 등록할 때 사용한 식별 이름
     * @returns {boolean} 해제했으면 true, 해당 key가 없으면 false
     */
    removePreRender(key: string): boolean;
    /**
     * 렌더러를 앱에 연결하고 그릴 장면과 렌더 그룹을 넘겨받습니다.<br>
     * 렌더 그룹의 자식 중 이름이 렌더 종류와 같은 것들을 종류별 담을 곳으로 등록하며, 사용자 전용 그룹은 제외합니다.<br>
     * 이어서 컨텍스트(context) 분실·복구 이벤트와 라벨 렌더러를 준비하므로, 이 호출 전에는 draw()가 아무것도 그리지 않습니다.
     *
     * @param {import("@U3dApp").U3dApp} app 장면과 렌더 그룹을 제공할 앱
     */
    setApp(app: U3dApp): void;
    _app: U3dApp;
    /**
     * 후처리 composer를 만들고 이 렌더러가 쓰는 pass를 모두 등록합니다.<br>
     * 등록 시점의 켜짐 상태가 그대로 반영되어, 켜져 있는 pass만 composer에 들어가고 꺼진 pass는 이름만 등록된 채 대기합니다.<br>
     * 기본으로 켜지는 것은 장면 렌더·화면 출력·대비 밝기 보정·계단 현상 완화이고, AO와 Bloom과 Dither는 후처리 설정을 따릅니다.<br>
     * 스카이라인·일조량·높이·오버레이·복사·외곽선 pass는 꺼진 채 등록되므로 필요할 때 activePass()로 켭니다.<br>
     * 실행 순서는 등록 순서가 아니라 각 pass가 가진 순서 값을 따르며, 장면 렌더에서 시작해 화면 출력을 지나 계단 현상 완화와 Dither가 마지막에 옵니다.<br>
     * 후처리를 꺼 둔 상태로 등록하면 화면 품질용 pass는 등록과 동시에 꺼집니다.<br>
     * renderComposer()가 composer가 없을 때 대신 호출하므로 보통 직접 부르지 않습니다.
     *
     * @param {import("three").Camera} camera 장면 렌더와 각 pass가 기준으로 삼을 camera
     */
    initComposer(camera: three.Camera): void;
    /**
     * 등록된 pass를 모두 끄고 해제한 뒤 composer 자체를 버립니다.<br>
     * pass 목록도 비우므로 이후 후처리를 다시 쓰려면 initComposer()로 처음부터 만들어야 합니다.
     */
    disposeComposer(): void;
    /**
     * 켜져 있는 pass들에 지금 사용할 camera를 알려 줍니다.<br>
     * camera를 바꿔 가며 같은 composer로 여러 번 그릴 때 각 pass가 옛 camera를 붙들지 않게 합니다.<br>
     * camera를 받아 갱신하는 수단을 가진 pass만 대상이 됩니다.
     *
     * @param {import("three").Camera} camera 이번 그리기에 사용할 camera
     */
    updateComposer(camera: three.Camera): void;
    /**
     * 화면 위에 겹쳐 그리는 HTML 라벨 렌더러를 만들어 앱 컨테이너에 붙입니다.<br>
     * 라벨 층은 마우스 입력을 가로채지 않도록 설정하며, 앱이 연결되어 있지 않으면 아무것도 하지 않습니다.
     */
    initLabelRenderer(): void;
    /**
     * 그리기 컨텍스트(context)를 잃거나 되찾을 때 알림을 남기도록 canvas에 이벤트를 겁니다.<br>
     * 컨텍스트를 잃으면 앱의 복구 처리를 함께 호출합니다.<br>
     * canvas를 넘기지 않으면 이 렌더러의 canvas를 사용합니다.
     *
     * @param {HTMLCanvasElement} [canvas] 이벤트를 걸 canvas이며 생략하면 렌더러 자신의 canvas
     */
    setContextHandelEvent(canvas?: HTMLCanvasElement): void;
    /**
     * 다음 프레임을 다 그린 뒤 화면을 JPEG 데이터 URL로 넘겨받도록 예약합니다.<br>
     * 예약만 하고 곧바로 돌아오며 실제 값은 다음 draw()가 끝날 때 전달됩니다.<br>
     * 캡처가 되려면 렌더러를 만들 때 그리기 버퍼 보존 옵션이 켜져 있어야 합니다.
     *
     * @param {DeferredObject<string>} capturePromise 결과 데이터 URL을 받을 객체
     */
    capture(capturePromise: DeferredObject<string>): void;
    _capturePromises: any[];
    /**
     * 다음 프레임을 다 그린 뒤 화면을 Blob으로 넘겨받도록 예약합니다.<br>
     * 예약만 하고 곧바로 돌아오며 실제 값은 다음 draw()가 끝날 때 전달됩니다.<br>
     * capture()와 마찬가지로 다 그려진 canvas를 다시 읽어 가므로, 렌더러를 만들 때 그리기 버퍼 보존 옵션이 켜져 있어야 합니다.
     *
     * @param {DeferredObject<Blob>} capturePromise 결과 Blob을 받을 객체
     */
    captureToBlob(capturePromise: DeferredObject<Blob>): void;
    _captureToBlobPromises: any[];
    /**
     * 후처리 composer로 한 프레임을 화면에 그립니다.<br>
     * composer가 아직 없으면 이 시점에 만들고, 이미 있으면 켜져 있는 pass에 camera만 갱신합니다.<br>
     * 자동 지우기를 끄고 그리므로 이전에 그려 둔 내용 위에 겹쳐집니다.
     *
     * @param {import("three").Camera} camera 이번 프레임에 사용할 camera
     */
    renderComposer(camera: three.Camera): void;
    /**
     * 후처리를 거치지 않고 장면을 화면에 그대로 그립니다.<br>
     * 자동 지우기를 끄므로 이미 그려진 화면 위에 겹쳐집니다.<br>
     * 장면이나 camera가 없으면 아무것도 하지 않습니다.
     *
     * @param {import("three").Scene} sceneRoot 그릴 장면의 뿌리
     * @param {import("three").Camera} camera 사용할 camera
     */
    renderScene(sceneRoot: three.Scene, camera: three.Camera): void;
    /**
     * 후처리를 모두 거친 결과를 화면 대신 지정한 렌더 타깃에 담습니다.<br>
     * 결과를 옮겨 담는 복사 pass를 잠시 켜서 그리고 끝나면 다시 끕니다.<br>
     * 화면 출력 여부와 픽셀 비율은 호출 전 값으로 되돌려 놓으므로 이어지는 화면 그리기에 영향을 주지 않습니다.<br>
     * 복사 pass가 등록되어 있지 않으면 아무것도 하지 않습니다.
     *
     * @param {import("three").Camera} camera 이번 그리기에 사용할 camera
     * @param {import("three").WebGLRenderTarget} rt 결과를 담을 렌더 타깃
     */
    renderComposerTarget(camera: three.Camera, rt: three.WebGLRenderTarget): void;
    /**
     * 후처리를 거치지 않고 장면을 지정한 렌더 타깃에 그립니다.<br>
     * 그리기 전에 타깃을 비우며, 끝나면 이전 렌더 타깃과 자동 지우기 설정을 되돌립니다.<br>
     * 장면이나 camera가 없으면 아무것도 하지 않습니다.
     *
     * @param {import("three").Scene} sceneRoot 그릴 장면의 뿌리
     * @param {import("three").Camera} camera 사용할 camera
     * @param {import("three").WebGLRenderTarget} rt 결과를 담을 렌더 타깃
     */
    renderSceneTarget(sceneRoot: three.Scene, camera: three.Camera, rt: three.WebGLRenderTarget): void;
    /**
     * 화면의 한 점에 그려진 지점의 월드 좌표(EPSG:3857)를 읽어 옵니다.<br>
     * 장면을 좌표 기록용 재질로 한 번 더 그린 뒤 그 픽셀 하나를 읽으므로 호출할 때마다 추가 렌더가 일어납니다.<br>
     * 읽은 값은 앱이 가진 영역 상자 범위로 환산해 돌려주며, 매번 같은 벡터를 재사용하므로 값을 보관하려면 복사해야 합니다.<br>
     * 앱이 연결되어 있지 않으면 undefined를 반환합니다.
     *
     * @param {number} [screenX=0] 읽을 지점의 화면 가로 위치이며 픽셀 단위
     * @param {number} [screenY=0] 읽을 지점의 화면 세로 위치이며 픽셀 단위
     * @returns {import("three").Vector3 | undefined} 해당 픽셀이 가리키는 월드 좌표(EPSG:3857)
     */
    getPositionScreen(screenX?: number, screenY?: number): three.Vector3 | undefined;
    /**
     * 해당 pass가 이 렌더러에 등록되어 있는지 확인합니다.<br>
     * 등록 여부만 보며 켜져 있는지는 보지 않으므로, 꺼진 채 대기 중인 pass도 true입니다.
     *
     * @param {import("@UPassInfo").UPassInfo | string} passInfo 확인할 pass 정보 또는 pass 이름
     * @returns {boolean} 등록되어 있으면 true
     */
    hasPass(passInfo: UPassInfo | string): boolean;
    /**
     * 이름으로 등록된 pass 정보를 반환합니다.<br>
     * 반환하는 것은 pass 자체가 아니라 이름·순서·분류와 pass를 함께 담은 정보 객체이므로, pass를 쓰려면 그 안의 instance를 꺼내야 합니다.
     *
     * @param {import('@UPassInfo').UPassInfo | string} passInfo 찾을 pass 정보 또는 pass 이름
     * @returns {import('@UPassInfo').UPassInfo} 등록된 pass 정보
     *
     * @ignore
     */
    getPass(passInfo: UPassInfo | string): UPassInfo;
    /**
     * 같은 분류에 속하는 pass 정보를 모두 모아 반환합니다.<br>
     * 분류 값은 UDEF.POSTPASS_TYPE에 정해져 있으며 화면 품질용(DEFAULT_GRAPHIC), 선택 품질용(OPTIONAL_GRAPHIC), 화면 출력용(MAIN), 분석용(ANALYSIS), 유틸(UTIL)로 나뉩니다.<br>
     * setPostProcess()가 이 분류로 켜고 끌 대상을 고르므로, 후처리를 꺼도 살아남게 하려면 화면 출력용 이상의 분류를 사용합니다.<br>
     * 반환하는 것은 pass 자체가 아니라 이름·순서·분류와 pass를 함께 담은 정보 객체입니다.
     *
     * @param {typeof UDEF.POSTPASS_TYPE[keyof typeof UDEF.POSTPASS_TYPE]} type 찾을 분류이며 UDEF.POSTPASS_TYPE의 값 중 하나
     * @returns {Array<import("@UPassInfo").UPassInfo>} 그 분류에 속한 pass 정보 목록
     */
    getPassesByType(type: (typeof UDEF.POSTPASS_TYPE)[keyof typeof UDEF.POSTPASS_TYPE]): Array<UPassInfo>;
    /**
     * 해당 pass가 지금 켜져 있는지 확인합니다.<br>
     * 등록되어 있지 않거나 pass가 비어 있으면 false를 반환합니다.
     *
     * @param {import("@UPassInfo").UPassInfo | string} passInfo 확인할 pass 정보 또는 pass 이름
     * @returns {boolean} 켜져 있으면 true
     */
    isActivePass(passInfo: UPassInfo | string): boolean;
    /**
     * pass를 켜거나 끄고 그 결과를 composer에도 반영합니다.<br>
     * 등록된 pass의 켜짐 상태를 바꾸는 방법은 이 메서드뿐이며, 켜면 자기 순서 자리에 끼워 넣고 끄면 composer에서 빼냅니다.<br>
     * 후처리가 꺼져 있으면 화면 품질용과 선택 품질용 pass는 true를 넘겨도 꺼진 상태로 남습니다.<br>
     * 등록되어 있지 않은 pass를 넘기면 아무것도 하지 않습니다.
     *
     * @param {import("@UPassInfo").UPassInfo | string} name 바꿀 pass 정보 또는 pass 이름
     * @param {boolean} val true이면 켜서 composer에 넣고 false이면 꺼서 빼냄
     */
    activePass(name: UPassInfo | string, val: boolean): void;
    /**
     * 이번 프레임에 그릴 객체를 종류별 담을 곳에 넣습니다.<br>
     * 담을 곳은 매 프레임 setRender()에서 비워지므로 계속 보이게 하려면 프레임마다 다시 넣어야 합니다.<br>
     * 해당 종류가 준비되어 있지 않거나 객체가 비어 있으면 아무것도 하지 않습니다.
     *
     * @param {import("three").Object3D} target 이번 프레임에 그릴 객체
     * @param {string} [type=UDEF.RENDER_TYPE.TERRAIN] 담을 렌더 종류
     */
    addRender(target: three.Object3D, type?: string): void;
    /**
     * 종류별 담을 곳에서 이름이 같은 객체를 모두 빼냅니다.<br>
     * 빼낸 뒤 그 종류가 비면 담을 곳 자체를 목록에서 지웁니다.<br>
     * 첫 인수는 건너뛸 수 없으므로 기본 종류를 쓰려면 undefined를 명시해야 하며, 이름만 넘기면 그 값이 종류로 들어가 아무것도 지우지 못합니다.<br>
     * 이름이 없거나 이미 제거했다고 표시하면 아무것도 하지 않습니다.
     *
     * @param {string | undefined} type 찾아볼 렌더 종류이며, 기본값을 쓰려면 undefined를 넘겨야 함. 기본값 UDEF.RENDER_TYPE.TERRAIN
     * @param {string} name 제거할 객체 이름
     * @param {boolean} [alreadyRemove] true이면 이미 제거된 것으로 보고 건너뜀
     */
    removeRenderObjByName(type: string | undefined, name: string, alreadyRemove?: boolean): void;
    /**
     * 이번 프레임에 그릴 주석 객체를 주석 전용 담을 곳에 넣습니다.<br>
     * 주석은 후처리를 거치지 않고 장면 위에 따로 그려지며, 담을 곳은 매 프레임 비워집니다.
     *
     * @param {import("three").Object3D} target 이번 프레임에 그릴 주석 객체
     */
    addRenderComment(target: three.Object3D): void;
    /**
     * 한 프레임을 그리기 직전에 통계와 담을 곳을 정리합니다.<br>
     * 직전 프레임의 그리기 호출 수를 그림자 갱신 여부에 따라 나눠 보관한 뒤 통계를 초기화합니다.<br>
     * 종류별 담을 곳과 주석 담을 곳을 비우므로, 이 호출 이후에 addRender()로 다시 넣은 객체만 이번 프레임에 그려집니다.
     */
    setRender(): void;
    /**
     * 보조 시점으로 그릴 때 가려야 할 객체들을 잠시 숨깁니다.<br>
     * camera 이름이 보조 시점일 때만 동작하며, 그 시점에 비쳐서는 안 되는 장면과 주행 모델 그리고 주석 층을 감춥니다.<br>
     * 감추기 전 상태를 기억해 두므로 restoreVisibility()로 원래대로 되돌려야 합니다.
     *
     * @param {import("three").Camera} camera 이번 그리기에 사용할 camera
     */
    setVisibility(camera: three.Camera): void;
    /**
     * setVisibility()가 감춘 객체들을 원래 보이기 상태로 되돌리고 기억해 둔 내용을 비웁니다.
     */
    restoreVisibility(): void;
    /**
     * 앱의 현재 상태로 한 프레임을 처음부터 끝까지 그립니다.<br>
     * 통계와 담을 곳을 정리하고 배경·안개·구름·클리핑을 맞춘 뒤 레이어별 장면을 모아 후처리 composer로 그립니다.<br>
     * 이어서 주석 장면과 HTML 라벨을 겹쳐 그리고, 예약된 화면 캡처가 있으면 이 시점에 넘겨줍니다.<br>
     * 추가 시점이 등록되어 있으면 각 영역만 잘라 다시 그립니다.<br>
     * 앱이 없거나 앱이 그리기를 멈춘 상태이면 아무것도 하지 않습니다.
     *
     * @param {boolean} [clear=true] 현재 구현에서는 읽지 않는 값
     * @param {number} [type=UDEF.DRAW_TYPE.DEFAULT] 영상·모델 레이어를 고를 때 사용할 그리기 종류
     * @param {import("three").Camera} [camera] 사용할 camera이며 생략하면 앱의 기본 camera
     * @param {boolean} [viewRender=true] false이면 추가 시점 영역을 그리지 않음
     */
    draw(clear?: boolean, type?: number, camera?: three.Camera, viewRender?: boolean): void;
    /**
     * 한 프레임을 화면 대신 지정한 렌더 타깃에 그립니다.<br>
     * 보조 시점에서 가려야 할 객체를 숨겼다가 끝나면 되돌립니다.<br>
     * 앱이 없거나 앱이 그리기를 멈춘 상태이거나 camera가 없으면 아무것도 하지 않습니다.
     *
     * @param {import("three").Camera} camera 사용할 camera
     * @param {import("three").WebGLRenderTarget} rt 결과를 담을 렌더 타깃
     * @param {boolean} usePostProcess true이면 후처리를 거치고 false이면 장면만 그대로 그림
     */
    drawRenderTarget(camera: three.Camera, rt: three.WebGLRenderTarget, usePostProcess: boolean): void;
    /**
     * 이번 프레임의 배경색과 안개, 구름, 클리핑 평면을 앱 설정에 맞춥니다.<br>
     * 후처리를 끈 상태이면 안개를 지우고 구름도 장면에서 빼냅니다.<br>
     * 정사영 camera에서는 후처리 여부와 상관없이 구름을 빼냅니다.<br>
     * 보조 시점 camera이거나 앱이 없으면 아무것도 하지 않습니다.
     *
     * @param {import("three").Camera} camera 이번 프레임에 사용할 camera
     */
    setEnvOption(camera: three.Camera): void;
    /**
     * 장면을 훑으며 보이는 mesh마다 등록된 그리기 직전 콜백을 실행합니다.<br>
     * 보이지 않는 객체는 그 아래까지 건너뜁니다.<br>
     * draw()가 등록된 콜백이 있을 때만 호출합니다.
     *
     * @param {import("three").Scene} scene 훑기 시작할 장면 또는 그룹
     */
    traverseForRender(scene: three.Scene): void;
    #private;
}

export type { URenderer };
