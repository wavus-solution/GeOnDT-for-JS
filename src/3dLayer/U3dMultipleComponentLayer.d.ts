// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dComponentPosition } from "./U3dComponentPosition.js";
import type { ComponentParam } from "./U3dComponentPosition.types.js";
import type { U3dLayerEMI } from "./U3dLayer.types.js";
import type { U3dModelBasicLayer } from "./U3dModelBasicLayer.js";
import type { ModelObject3D, U3dModelBasicLayerCO } from "./U3dModelBasicLayer.types.js";
import type { ComponentObject, InstancedMeshLike, U3dMultipleComponentLayerStyle, U3dMultipleComponentModelInfo } from "./U3dMultipleComponentLayer.types.js";
import type { UBox3 } from "../core/UBox3.js";
import type { UCheckTime } from "../core/UCheckTime.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UGroup } from "../core/UGroup.js";
import type { URaycaster } from "../core/URaycaster.js";
import type { UScene } from "../core/UScene.js";
import type { GeoPosition, WorldPosition, WorldPositionVector3 } from "../types/global.types.js";

/**
 * 3D 에셋 변경 옵션
 */
type ChangeObjectOpt = {
    /**
     * 3D 에셋 이름
     */
    object: string;
    /**
     * 3D 에셋의 애니메이션(Clip) 인덱스 번호
     */
    animationNum: number;
    /**
     * 3D 에셋의 위치
     */
    position: WorldPosition;
    /**
     * 3D 에셋의 스케일 ex) {x:2, y:2, z:2}
     */
    scale: three.Vector3Like;
    /**
     * 3D 에셋의 회전 ex) {x:90, y:0, z:0}
     */
    rotation: three.Vector3Like;
};

/**
 * 카메라 시점 제어 옵션
 */
type CameraViewOption = {
    /**
     * 카메라가 따라갈 대상 컴포넌트 (예: 드론, 자동차 등 움직이는 객체).
     */
    component: ComponentObject;
    /**
     * 카메라 시점 종류. <br>
     * - `FrontView` : 대상의 정면에서 바라보는 시점  <br>
     * - `TopView` : 대상의 위에서 내려다보는 시점  <br>
     * - `ThirdPersonFront` :  3인칭 시점 (컴포넌트 앞면)<br>
     * - `ThirdPersonRight` : 3인칭 시점 (컴포넌트 우측면) <br>
     * - `ThirdPersonLeft` : 3인칭 시점 (컴포넌트 좌측면)<br>
     * - `ThirdPersonBack` : 3인칭 시점 (컴포넌트 뒷면)<br>
     * - `ThirdPersonRound` : 3인칭 시점 (컴포넌트를 기준으로 회전)
     */
    view: string;
    /**
     * 카메라 추적 활성 여부. <br>
     * - `true` : 카메라가 대상 컴포넌트를 지정한 시점으로 실시간 추적  <br>
     * - `false` : 카메라 추적 중지
     */
    active: boolean;
    /**
     * 카메라 위치 보정값 (x, y, z). <br>
     * 입력한 값만큼 카메라 위치를 이동시킵니다. <br>
     * 예: `{ x: 0, y: 0, z: 10 }` → 대상보다 10m에서 카메라가 따라감
     */
    offset: three.Vector3Like;
    /**
     * 카메라가 바라보는 지점의 보정값 (x, y, z). 생략 가능. <br>
     * 입력한 값만큼 카메라의 시선 방향을 이동시킵니다. <br>
     * 예: `{ x: 0, y: 0, z: 2 }` → 대상의 2m 위 지점을 바라봄
     */
    targetOffset?: three.Vector3Like;
};

/**
 * 3D 에셋 이름으로 그 에셋의 인스턴스 배치 정보를 찾아보는 보관소입니다. <br>
 * 인스턴스 컴포넌트를 되살리거나 개별 인스턴스를 수정할 때 여기서 원본 값을 꺼냅니다.
 */
type InstancedInfoStore = Map<string, InstancedInfo>;

/**
 * 인스턴스 정보
 */
type InstancedComponentInfo = {
    /**
     * 원본 위치
     */
    position: three.Vector3;
    /**
     * 원본 회전값
     */
    rotation: three.Euler;
    /**
     * 원본 크기값
     */
    scale: three.Vector3;
    /**
     * 가시화 여부
     */
    visible: boolean;
    /**
     * 라벨 가시화 여부
     */
    labelVisible: boolean;
    /**
     * 원본 3D 에셋 이름
     */
    name: string;
    /**
     * 애니메이션 믹서
     */
    mixers?: Array<three.AnimationMixer>;
};

/**
 * ~extends Map<number, InstancedComponentInfo> <br>
 *
 * 인스턴스 컴포넌트 하나하나의 원본 배치 정보를 인스턴스 번호로 찾아보는 보관소입니다. <br>
 * 같은 3D 에셋으로 만든 인스턴스들이 한 보관소에 모이며, 번호는 생성 순서대로 발급됩니다.
 */
type InstancedInfo_Content = {
    /**
     * 마지막으로 발급한 인스턴스 번호이며 다음 인스턴스의 번호를 정할 때 기준이 됩니다. <br>
     */
    lastIndex?: number;
};

/**
 * ~extends Map<number, InstancedComponentInfo> <br>
 *
 * 인스턴스 컴포넌트 하나하나의 원본 배치 정보를 인스턴스 번호로 찾아보는 보관소입니다. <br>
 * 같은 3D 에셋으로 만든 인스턴스들이 한 보관소에 모이며, 번호는 생성 순서대로 발급됩니다.
 */
type InstancedInfo = Map<number, InstancedComponentInfo> & InstancedInfo_Content;

/**
 * addPosition으로 컴포넌트를 배치할 때 넘기는 옵션입니다. <br>
 * 항목별 의미는 ComponentParam을 따르며 필요한 항목만 골라 넣으면 됩니다. <br>
 * 여기에 없는 주행 경로나 조명 같은 항목도 함께 받습니다.
 */
type ComponentCreateOption = Partial<ComponentParam> & Record<string, any>;

/**
 * ~extends U3dModelBasicLayerCO <br>
 *
 * U3dMultipleComponentLayer 생성자 옵션입니다. <br>
 * 레이어를 만들 때 한 번만 정하는 기본 크기·회전, 인스턴스 생성 방식, 라벨 표시 여부를 담습니다. <br>
 * 여기서 정한 크기와 회전은 이후 배치되는 컴포넌트의 기본값으로 쓰입니다.
 */
type U3dMultipleComponentLayerCO_Content = {
    /**
     * 레이어 크기값 (모든 컴포넌트 일괄 적용)
     */
    scale?: three.Vector3Like;
    /**
     * 레이어 회전값 (모든 컴포넌트 일괄 적용)
     */
    rotation?: three.Vector3Like;
    /**
     * 컴포넌트 간 충돌 감지 거리 <hidden>
     */
    collisiondistance?: number;
    /**
     * 컴포넌트 간 충돌 발생 시 실행되는 콜백 함수 <hidden>
     */
    collisionFunction?: Function;
    /**
     * 컴포넌트 생성 타입을 InstancedComponent로 생성할 지 여부. true면 기본 InstancedComponent로 생성
     */
    setInstanced?: boolean;
    /**
     * InstancedComponent 생성시 그룹 크기 <hidden>
     */
    instancedMaxCount?: number;
    /**
     * 컴포넌트 라벨 가시화 여부 (모든 컴포넌트 일괄 적용)
     */
    labelVisible?: boolean;
    drawPath?: boolean;
    typePath?: string;
    image?: string;
    axis?: three.Vector3Like;
    /**
     * 경로를 따라갈 때 컴포넌트를 추가로 돌려 줄 각도이며 도(°) 단위입니다. <br>
     */
    rotateAngle?: number;
};

/**
 * ~extends U3dModelBasicLayerCO <br>
 *
 * U3dMultipleComponentLayer 생성자 옵션입니다. <br>
 * 레이어를 만들 때 한 번만 정하는 기본 크기·회전, 인스턴스 생성 방식, 라벨 표시 여부를 담습니다. <br>
 * 여기서 정한 크기와 회전은 이후 배치되는 컴포넌트의 기본값으로 쓰입니다.
 */
type U3dMultipleComponentLayerCO = Omit<Omit<U3dModelBasicLayerCO, never> & U3dMultipleComponentLayerCO_Content, never>;

/**
 * ~extends U3dLayerEMI <br>
 *
 * U3dMultipleComponentLayer가 발생시키는 이벤트 이름 모음의 형식입니다. <br>
 * 기반 레이어 이벤트에 컴포넌트 생성 관련 이벤트를 더합니다.
 */
type U3dMultipleComponentLayerEMI_Content = {
    /**
     * 컴포넌트를 만들기 직전에 발생하며 `data`는 생성 옵션입니다. <br>
     */
    BEFORE_CREATE: string;
    /**
     * 컴포넌트를 배치한 직후에 발생하며 `data`는 배치된 컴포넌트입니다. <br>
     */
    CREATE: string;
};

/**
 * ~extends U3dLayerEMI <br>
 *
 * U3dMultipleComponentLayer가 발생시키는 이벤트 이름 모음의 형식입니다. <br>
 * 기반 레이어 이벤트에 컴포넌트 생성 관련 이벤트를 더합니다.
 */
type U3dMultipleComponentLayerEMI = Omit<Omit<U3dLayerEMI, never> & U3dMultipleComponentLayerEMI_Content, never>;

/**
 * 컴포넌트 저장 데이터
 */
type ComponentSaveDate = {
    /**
     * 컴포넌트 레이어 이름
     */
    layer: string;
    /**
     * 컴포넌트 별 저장 데이터
     */
    components: Array<ComponentParam>;
};

/**
 * ~extends import('@union3d/3dLayer/U3dModelBasicLayer').U3dModelBasicLayer <br>
 *
 * 컴포넌트(Component) 레이어 클래스.<br>
 * 여러 종류의 3D 에셋으로 컴포넌트를 생성하고 화면에 추가·편집·제거하는 기능을 제공합니다.<br>
 * 일반 컴포넌트와 인스턴스 컴포넌트(Instanced Component)를 지원합니다.<br><br>
 *
 *  <<----용어 정리---->> <br>
 *  [3D 에셋(Asset)]<br>
 *  3ds, glb, obj, fbx 등 3D 파일 포맷으로 제공되는 원본 파일 데이터입니다.<br>
 * [컴포넌트(Component)] <br>
 * 3D 에셋을 로드하여 화면에 배치 가능한 상태로 만든 시설물 객체이며 가로수, 드론, 건물, 도로 등이 이에 해당합니다.<br>
 * [Instanced Mesh] <br>
 * 동일한 Mesh를 복사 없이 여러 위치에 빠르게 렌더링하는 방식이며 메모리 효율이 높으나 환경에 따라 렌더링 부하가 발생할 수 있습니다.<br>
 * [인스턴스 컴포넌트(Instanced Component)] <br>
 * Instanced Mesh로 생성된 컴포넌트이며 대규모·대용량 시설물 출력에 유리합니다.<br>
 *
 * @group 3dLayer
 * @extends {U3dModelBasicLayer}
 *
 * @example
 * const componentLayer = new GeOnDT.model.U3dMultipleComponentLayer({
 *      name: "ComponentLayer",
 *      setInstanced: true
 * });
 *
 * app.addLayer(componentLayer);
 * app.showLayer("ComponentLayer", true);
 */
declare class U3dMultipleComponentLayer extends U3dModelBasicLayer {
    /**
     * 이 레이어가 발생시키는 이벤트의 이름 모음입니다. <br>
     * addEventListener에 넘길 이벤트 이름을 문자열로 직접 적는 대신 이 값을 사용하십시오. <br>
     * BEFORE_CREATE는 컴포넌트를 만들기 직전에, CREATE는 컴포넌트를 배치한 직후에 발생합니다.
     *
     * @override
     *
     * @type {U3dMultipleComponentLayerEMI}
     */
    static override EVENT: U3dMultipleComponentLayerEMI;
    /**
     * U3dMultipleComponentLayer 클래스 생성자입니다. <br>
     * 컴포넌트를 담을 빈 레이어를 만들며, 화면에 올리려면 app.addLayer로 앱에 등록해야 합니다. <br>
     * 옵션으로 정한 크기와 회전은 이후 배치되는 컴포넌트의 기본값이 됩니다.
     *
     * @param {Partial<U3dMultipleComponentLayerCO>} opt 레이어 이름과 기본 크기·회전, 인스턴스 생성 방식을 지정하는 생성 옵션 <br>
     */
    constructor(opt: Partial<U3dMultipleComponentLayerCO>);
    /**
     * 인스턴스 방식으로 배치한 컴포넌트들이 공유하는 대표 메시입니다. <br>
     * 인스턴스 컴포넌트를 아직 만들지 않았으면 없습니다.
     *
     * @type {InstancedMeshLike | undefined}
     */
    _instancedMesh: InstancedMeshLike | undefined;
    /**
     * 컴포넌트 배치를 돕는 헬퍼 객체를 앱에서 찾을 때 쓰는 식별자입니다. <br>
     * 헬퍼를 등록하지 않았으면 없습니다.
     *
     * @type {string | number | undefined}
     */
    _helperId: string | number | undefined;
    /**
     * 이 레이어에 배치된 컴포넌트를 배치한 순서대로 담은 목록입니다. <br>
     * 이름 검색, 전체 순회, 주행 제어가 모두 이 순서를 따릅니다. <br>
     * 값을 읽을 때는 getComponents를 사용하고 이 목록을 직접 바꾸지 마십시오.
     *
     * @type {Array<ComponentObject>}
     */
    _componentList: Array<ComponentObject>;
    /**
     * 주행 애니메이션을 등록해 둔 컴포넌트들의 이름 목록이며 같은 이름은 한 번만 담깁니다.
     *
     * @type {Array<string>}
     */
    _animateList: Array<string>;
    /**
     * 로드한 3D 에셋별 경계영역을 에셋 이름으로 찾아보는 보관소입니다. <br>
     * 같은 에셋을 여러 번 배치할 때 경계영역을 다시 계산하지 않기 위해 사용합니다.
     *
     * @type {Map<string, import('@union3d/core/UBox3').UBox3>}
     */
    _bboxMap: Map<string, UBox3>;
    _renderIndex: number;
    _drawPath: any;
    _typePath: any;
    _image: any;
    _axis: any;
    _scale: any;
    _helperPosition: WorldPositionVector3;
    _rotateAngle: any;
    _scenePoi: UScene;
    _checkTime: UCheckTime;
    _collisionDistance: any;
    _collisionFunction: any;
    _setInstanced: any;
    _instancedInfo: Map<any, any>;
    _nameInfo: {};
    _instancedObject: UGroup;
    _animationPlaybackState: string;
    _cacheMeshList: {};
    _instancedMaxCount: any;
    _componentMap: Map<any, any>;
    labelVisible: any;
    /**
     * 레이어에 배치된 컴포넌트를 한꺼번에 화면에 나타내는 메서드입니다. <br>
     * 개별 컴포넌트를 hideComponent로 숨겨 둔 경우 그 컴포넌트는 숨겨진 상태로 남습니다.
     *
     * @override
     */
    override show(): void;
    /**
     * 레이어에 배치된 컴포넌트를 한꺼번에 화면에서 숨기는 메서드입니다. <br>
     * 컴포넌트는 그대로 남아 있으므로 show로 다시 나타낼 수 있습니다.
     */
    hide(): void;
    /**
     * 현재 레이어에 배치된 모든 컴포넌트의 스타일을 한꺼번에 변경합니다. <br>
     * option에 지정한 속성만 적용하며 생략하거나 null로 지정한 속성은 기존 값을 유지합니다. <br>
     * 이 설정은 호출 시점에 등록된 컴포넌트에만 적용되고 이후 추가하는 컴포넌트의 기본 스타일은 바꾸지 않습니다.
     *
     * @param {U3dMultipleComponentLayerStyle} option 적용할 색상, 불투명도, 가시성, 밝기와 대비 <br>
     */
    setStyle(option: U3dMultipleComponentLayerStyle): void;
    /**
     * 앞으로 배치할 컴포넌트를 인스턴스 방식으로 만들지 정하는 메서드입니다. <br>
     * 인스턴스 방식은 같은 에셋을 대량으로 놓을 때 메모리와 렌더링에 유리합니다. <br>
     * 이미 배치된 컴포넌트에는 소급되지 않으므로 방식을 바꾸려면 다시 배치해야 합니다.
     *
     * @param {boolean} val true이면 인스턴스 방식으로, false이면 일반 방식으로 만듭니다. <br>
     */
    setInstanced(val: boolean): void;
    /**
     * 현재 레이어가 인스턴스 컴포넌트 생성 모드인지 확인하는 메서드입니다. <br>
     * true이면 addPosition으로 배치하는 컴포넌트가 인스턴스 방식으로 만들어집니다.
     *
     * @returns {boolean} `true` : 인스턴스 모드 / `false` : 일반 모드
     */
    isInstanced(): boolean;
    /**
     * 레이어에 등록된 주행 애니메이션 목록을 반환하는 함수
     *
     * @returns {Array<string>} 애니메이션 목록
     *
     * @ignore
     */
    getAnimateList(): Array<string>;
    /**
     * 이름을 받아 주행 애니메이션을 추가하는 함수
     *
     * @param {string} name 애니메이션 이름
     *
     * @ignore
     */
    addAnimateList(name: string): void;
    /**
     * 이름을 받아 등록된 주행 애니메이션을 제거하는 함수
     *
     * @param {string} name 애니메이션 이름
     *
     * @ignore
     */
    removeAnimateList(name: string): void;
    /**
     * 레이어의 모든 컴포넌트가 지나온 누적 경로(CumulativeRoute)를 화면에 보이거나 숨기는 메서드입니다. <br>
     * 누적 경로는 주행 애니메이션이 진행되면서 실제로 지나온 자취를 선으로 남긴 것입니다. <br>
     * 누적 경로를 남기도록 만들어지지 않은 컴포넌트는 아무 변화도 없습니다. <br>
     * 호출 시점의 컴포넌트에만 적용되므로 이후에 추가한 컴포넌트에는 다시 호출해야 합니다.
     *
     * @param {boolean} isVisible true이면 누적 경로를 표시하고 false이면 숨깁니다. <br>
     */
    visibleCumulativeRoute(isVisible: boolean): void;
    /**
     * 인스턴스 컴포넌트의 메타데이터를 반환하는 메서드
     *
     * @returns {InstancedInfoStore} 인스턴스 컴포넌트 정보
     */
    getInstancedInfo(): InstancedInfoStore;
    /**
     * 화면에 그려진 누적 경로(trail)를 눌러 그 경로의 주인 컴포넌트를 찾는 메서드입니다. <br>
     * 마우스 위치와 각 컴포넌트의 누적 경로가 겹치는지 검사해 겹친 컴포넌트를 모아 돌려줍니다. <br>
     * 누적 경로를 남기지 않도록 만들어졌거나 아직 지나온 자취가 없는 컴포넌트는 검사 대상에서 빠집니다. <br>
     * 컴포넌트 자체를 클릭해 고르는 것이 아니라 경로 선을 클릭해 고르는 용도입니다.
     *
     * @param {MouseEvent} e 클릭 위치를 담고 있는 마우스 이벤트 <br>
     * @returns {Array<ComponentObject>} 누른 지점에 누적 경로가 걸린 컴포넌트 목록이며 걸린 것이 없으면 빈 배열 <br>
     */
    selectComponentByTrails(e: MouseEvent): Array<ComponentObject>;
    /**
     * 컴포넌트를 마우스로 고르기 쉽도록 선택용 보조 영역을 켜는 메서드입니다. <br>
     * 가늘거나 작은 컴포넌트도 넉넉한 영역으로 집을 수 있게 됩니다. <br>
     * 호출 시점의 컴포넌트에만 적용됩니다.
     */
    onSelectHelperMeshes(): void;
    /**
     * 선택용 보조 영역을 끄는 메서드입니다. <br>
     * 끄면 컴포넌트의 실제 형상에 닿아야만 고를 수 있습니다. <br>
     * 호출 시점의 컴포넌트에만 적용됩니다.
     */
    offSelectHelperMeshes(): void;
    /**
     * 각 컴포넌트의 경계영역을 화면에 선으로 그려 확인하는 개발용 메서드입니다. <br>
     * 켜 두면 매 프레임 현재 컴포넌트들의 경계영역을 다시 그립니다.
     *
     * @override
     *
     * @param {boolean} isDebug true이면 경계영역 표시를 켜고 false이면 끕니다. <br>
     * @param {import('three').ColorRepresentation} [color=0xffff00] 경계영역 선을 그릴 색 <br>
     * @returns {boolean} 설정을 적용했으면 true, 상위 레이어가 거부하면 false <br>
     */
    override debugBound(isDebug: boolean, color?: three.ColorRepresentation): boolean;
    /**
     * 전체 컴포넌트 목록을 반환하는 메서드.
     *
     * @returns {Array<ComponentObject>} 전체 컴포넌트 목록
     */
    getComponents(): Array<ComponentObject>;
    /**
     * @deprecated 이 메서드는 더 이상 사용하지 않으므로 getComponents 메서드를 사용하십시오.
     */
    getComponentList(): ComponentObject[];
    /**
     * 로드된 3D 에셋 파일의 원본 정보 목록을 반환합니다.
     *
     * @returns {Array<U3dMultipleComponentModelInfo>} 3D 에셋 원본 정보 목록
     */
    getListModel(): Array<U3dMultipleComponentModelInfo>;
    /**
     * 이름으로 3D 에셋 원본 정보를 찾아 반환합니다.
     *
     * @param {string} name 찾을 3D 에셋 이름
     * @returns {U3dMultipleComponentModelInfo | undefined} 찾은 3D 에셋 원본 정보. 없으면 `undefined`
     */
    getListModelByName(name: string): U3dMultipleComponentModelInfo | undefined;
    /**
     * 이름이 일치하는 컴포넌트를 찾아 반환하는 메서드입니다. <br>
     * 이름은 배치할 때 지정한 값이며 같은 이름은 하나만 등록되므로 결과도 하나입니다.
     *
     * @param {string} name 찾을 컴포넌트 이름 <br>
     * @returns {ComponentObject | undefined} 이름이 일치하는 컴포넌트이며 없으면 undefined <br>
     */
    getComponentByName(name: string): ComponentObject | undefined;
    /**
     * Raycaster 교차(intersect) 결과로 교차되는 컴포넌트를 찾아 반환하는 메서드
     *
     * @param {import('three').Intersection} intersect  Raycaster 교차 결과 객체
     * @returns {ComponentObject | undefined} 찾은 컴포넌트. 없으면 `undefined`
     *
     * @ignore
     */
    getComponentByIntersect(intersect: three.Intersection): ComponentObject | undefined;
    /**
     * 같은 3D 에셋으로 만든 컴포넌트를 모두 찾아 반환하는 메서드입니다. <br>
     * 컴포넌트를 배치할 때 지정한 원본 에셋 이름을 기준으로 고릅니다.
     *
     * @param {string} modelName 원본 3D 에셋 이름이며 loadModel에 넘긴 name과 같은 문자열입니다. <br>
     * @returns {Array<ComponentObject>} 그 에셋으로 만든 컴포넌트 목록이며 없으면 빈 배열 <br>
     */
    getComponentsByModel(modelName: string): Array<ComponentObject>;
    /**
     * 컴포넌트에 저장해 둔 사용자 속성을 살펴보며 원하는 컴포넌트만 골라내는 메서드입니다. <br>
     * 배치된 컴포넌트를 순서대로 훑으며 콜백을 호출하고, 콜백이 참으로 판정되는 값을 돌려준 컴포넌트만 모읍니다. <br>
     * 속성은 addPosition의 properties로 넣어 둔 키와 값입니다.
     *
     * @param {(component: ComponentObject, properties: Record<string, any>) => any} callback 컴포넌트와 그 컴포넌트의 속성 모음을 받아 고를지 판단하는 함수이며, 고를 때는 참으로 판정되는 값을 돌려주십시오. <br>
     * @returns {Array<ComponentObject>} 콜백이 고른 컴포넌트 목록이며 고른 것이 없으면 빈 배열 <br>
     *
     * @example
     *  const searched = componentLayer.getComponentsByProperty( function (component, properties) {
     *      for(let [key, value] of Object.entries(properties)) {
     *          if(key.equal("건축용도")) {
     *               return component;
     *          } else if(typeof value === "number") {
     *              return component;
     *          }
     *      }
     *  });
     *
     *  for(const component of searched) {
     *     console.log(`[${component.name}] 검색 완료!`);
     *  }
     */
    getComponentsByProperty(callback: (component: ComponentObject, properties: Record<string, any>) => any): Array<ComponentObject>;
    /**
     * 지도 위에 그린 다각형 안에 들어 있는 컴포넌트를 찾아 반환하는 메서드입니다. <br>
     * 컴포넌트에 경계영역이 있으면 그 영역이 다각형과 겹치는지로, 없으면 컴포넌트의 중심점이 다각형 안에 있는지로 판단합니다. <br>
     * 높이는 보지 않고 바닥 평면에서만 비교합니다. <br>
     * 좌표가 세 개보다 적으면 다각형을 만들 수 없으므로 빈 배열을 반환합니다.
     *
     * @param {Array<GeoPosition>} points 검색할 다각형의 꼭짓점을 이은 위경도 좌표 배열이며 세 개 이상이어야 합니다. <br>
     * @returns {Array<ComponentObject>} 다각형 안에 있는 컴포넌트 목록이며 없으면 빈 배열 <br>
     */
    getComponentsByArea(points: Array<GeoPosition>): Array<ComponentObject>;
    /**
     * 매 프레임 호출되어 컴포넌트들의 표시 상태를 카메라 기준으로 다시 계산하는 메서드입니다. <br>
     * 컴포넌트가 많으면 한 프레임에 일부만 처리하고 다음 프레임에서 이어 처리합니다. <br>
     * 앱이 직접 호출하므로 사용자가 부를 일은 없습니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} [drawArg] 이번 프레임의 렌더 컨텍스트 <br>
     * @param {number} [curTime] 이번 프레임의 시각이며 밀리초 단위입니다. <br>
     */
    override update(drawArg?: UDrawArg, curTime?: number): void;
    /**
     * 지정한 위치에 컴포넌트 하나를 만들어 레이어에 배치하는 메서드입니다. <br>
     * 만들어진 컴포넌트는 곧바로 화면에 올라가고 레이어의 컴포넌트 목록에 등록되며 CREATE 이벤트가 발생합니다. <br>
     * opt에 movepointlist나 pathgeometry를 넣으면 그 경로를 따라 달리는 주행 애니메이션이 함께 준비됩니다. <br>
     * 레이어가 이미 주행 중이면 새로 만든 컴포넌트도 바로 달리기 시작하고, 일시정지 상태이면 멈춘 상태로 배치됩니다. <br>
     * 이름이 이미 등록된 컴포넌트와 같으면 화면에는 올라가지만 목록에는 등록되지 않으므로 이름은 서로 다르게 지으십시오. <br>
     * style의 밝기와 대비는 생성 전에 검사하여 숫자가 아니면 TypeError를, 음수이거나 유한하지 않거나 Float32로 표현할 수 없는 값이면 RangeError를 던지며 이때는 컴포넌트를 만들지 않습니다.
     *
     * @param {ComponentCreateOption} opt 배치할 모델과 좌표, 표시 방식, 사용자 속성을 담은 생성 옵션이며 항목별 의미는 ComponentParam을 따르고, 이 밖에 주행 경로를 지정하는 movepointlist, 경로마다의 자세를 지정하는 pitchyawrolllist, 미리 만든 경로 형상을 넘기는 pathgeometry, 무리가 돌아다닐 영역을 지정하는 drawPolygon, 컴포넌트에 붙일 조명 목록 lights를 함께 받습니다. <br>
     * @returns {ComponentObject | undefined} 배치한 컴포넌트이며 생성에 실패하면 undefined <br>
     *
     * @see ComponentParam
     */
    addPosition(opt: ComponentCreateOption): ComponentObject | undefined;
    /**
     * 레이어에 배치된 컴포넌트들을 나중에 그대로 되살릴 수 있는 형태로 뽑아내는 메서드입니다. <br>
     * 반환값을 저장해 두었다가 loadWork에 넘기면 같은 배치를 복원할 수 있습니다. <br>
     * 뽑아낼 컴포넌트가 하나도 없으면 save 이벤트도 발생시키지 않고 undefined를 반환합니다.
     *
     * @returns {{component: Array<ComponentSaveDate>} | undefined} 컴포넌트별 저장 데이터를 담은 객체이며 저장할 컴포넌트가 없으면 undefined <br>
     */
    saveWork(): {
        component: Array<ComponentSaveDate>;
    } | undefined;
    /**
     * saveWork로 저장해 둔 컴포넌트들을 이 레이어에 다시 배치하는 메서드입니다. <br>
     * 같은 이름의 컴포넌트가 이미 있으면 새로 만들지 않고 저장된 계층 정보만 적용합니다. <br>
     * 컴포넌트 하나를 복원할 때마다 load 이벤트가 발생합니다. <br>
     * 저장 데이터의 instanced 값에 따라 레이어의 인스턴스 생성 모드가 함께 바뀝니다.
     *
     * @param {ComponentParam | Array<ComponentParam>} savedData 복원할 컴포넌트 저장 데이터이며 하나만 넘겨도 되고 배열로 여러 개를 넘겨도 됩니다. <br>
     * @returns {Promise<Array<import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition | undefined>>} 복원한 컴포넌트를 입력 순서대로 담은 배열이며 이미 있던 이름 자리는 undefined입니다. <br>
     */
    loadWork(savedData: ComponentParam | Array<ComponentParam>): Promise<Array<U3dComponentPosition | undefined>>;
    /**
     * 전체 컴포넌트의 밝기를 설정합니다.
     * @param {number} [brightness=1] 밝기값
     * @returns {boolean} 하나 이상의 컴포넌트에 적용했으면 true
     */
    setBrightness(brightness?: number): boolean;
    /**
     * 첫 번째 유효한 컴포넌트의 밝기를 반환합니다.
     * @returns {number} 밝기값이며 유효한 컴포넌트가 없으면 NaN
     */
    getBrightness(): number;
    /**
     * 전체 컴포넌트의 대비를 설정합니다.
     * @param {number} [contrast=1] 대비값
     * @returns {boolean} 하나 이상의 컴포넌트에 적용했으면 true
     */
    setContrast(contrast?: number): boolean;
    /**
     * 첫 번째 유효한 컴포넌트의 대비를 반환합니다.
     * @returns {number} 대비값이며 유효한 컴포넌트가 없으면 NaN
     */
    getContrast(): number;
    /**
     * 전체 컴포넌트의 채도를 설정합니다.
     * @param {number} [saturation=1] 채도값
     * @returns {boolean} 하나 이상의 컴포넌트에 적용했으면 true
     */
    setSaturation(saturation?: number): boolean;
    /**
     * 첫 번째 유효한 컴포넌트의 채도를 반환합니다.
     * @returns {number} 채도값이며 유효한 컴포넌트가 없으면 NaN
     */
    getSaturation(): number;
    /**
     * 전체 컴포넌트의 밝기·대비·채도를 원본 상태로 초기화합니다.
     * @returns {boolean} 하나 이상의 컴포넌트에 적용했으면 true
     */
    resetColorAdjustment(): boolean;
    /**
     * 모델의 크기가 화면에 배치해도 될 범위인지 확인하는 메서드입니다. <br>
     * 배치 전에 비정상적으로 크거나 작은 에셋을 걸러 내는 데 사용합니다.
     *
     * @param {import('three').Object3D} model 크기를 확인할 원본 모델 <br>
     * @returns {boolean} 배치해도 되는 크기이면 true, 아니면 false <br>
     */
    checkObjectSize(model: three.Object3D): boolean;
    /**
     * @deprecated 이 메서드는 더 이상 사용하지 않으므로 getComponents 메서드를 사용하십시오.
     */
    getPositionList(): ComponentObject[];
    /**
     * 레이어의 컴포넌트들이 등록된 경로를 따라 주행하는 메서드입니다. <br>
     * 일시정지해 둔 컴포넌트는 멈춘 지점부터 이어서 달리고, 그 밖에는 경로의 처음부터 주행합니다. <br>
     * 레이어의 재생 상태가 주행 중으로 바뀌므로 이후에 배치하는 컴포넌트도 배치와 동시에 주행을 시작합니다. <br>
     * 경로가 없는 컴포넌트를 만나면 그 자리에서 순회를 멈추므로 목록에서 그 뒤에 있는 컴포넌트는 주행하지 않습니다. <br>
     * 모델 파일에 들어 있는 프로펠러 회전 같은 클립 애니메이션은 이 메서드가 다루지 않습니다.
     */
    startAnimation(): void;
    /**
     * 전체 컴포넌트의 내장 애니메이션 클립 재생을 정지하는 메서드입니다.<br>
     * 프로펠러 회전, 걷기 동작처럼 3D 에셋 파일 자체에 포함된 클립 애니메이션을 멈춥니다.
     */
    stopMixers(): void;
    /**
     * 전체 컴포넌트의 내장 애니메이션 클립 재생을 시작하는 메서드입니다.<br>
     * 프로펠러 회전, 걷기 동작처럼 3D 에셋 파일 자체에 포함된 클립 애니메이션을 시작합니다.
     */
    startMixers(): void;
    /**
    
    /**
     * 레이어의 모든 컴포넌트를 경로 주행에서 멈춰 세우는 메서드입니다. <br>
     * 진행 상황이 초기화되므로 다시 시작하면 경로의 처음부터 주행합니다. <br>
     * 레이어의 재생 상태가 정지로 바뀌므로 이후에 배치하는 컴포넌트도 멈춘 채 놓입니다. <br>
     * 모델 파일에 들어 있는 클립 애니메이션은 이 메서드가 다루지 않습니다.
     */
    stopAnimation(): void;
    /**
     * 레이어의 모든 컴포넌트를 현재 위치에서 잠시 멈추는 메서드입니다. <br>
     * 진행 상황이 남아 있어 startAnimation을 호출하면 멈춘 지점부터 이어서 달립니다. <br>
     * 레이어의 재생 상태가 일시정지로 바뀌므로 이후에 배치하는 컴포넌트도 멈춘 채 놓입니다. <br>
     * 모델 파일에 들어 있는 클립 애니메이션은 이 메서드가 다루지 않습니다.
     */
    pauseAnimation(): void;
    /**
     * 레이어의 모든 컴포넌트를 경로의 처음으로 되돌린 뒤 다시 주행하게 하는 메서드입니다. <br>
     * 멈춰 있든 주행 중이든 상관없이 진행 상황을 지우고 출발점부터 시작합니다. <br>
     * 멈춘 지점부터 이어서 주행하려면 이 메서드 대신 startAnimation을 사용하십시오. <br>
     * 레이어의 재생 상태가 주행 중으로 바뀌므로 이후에 배치하는 컴포넌트도 배치와 동시에 주행하기 시작합니다.
     */
    restartAnimation(): void;
    /**
     * 특정 컴포넌트 하나만 화면에 나타내는 메서드입니다. <br>
     * 레이어 전체의 가시성은 그대로 두고 넘겨받은 컴포넌트만 다시 보이게 합니다.
     *
     * @param {ComponentObject} component 나타낼 컴포넌트이며 인스턴스 컴포넌트도 넘길 수 있습니다. <br>
     * @returns {Promise<void>} 표시를 마치면 값 없이 완료되고 컴포넌트를 넣지 않으면 거부되는 Promise <br>
     */
    showComponent(component: ComponentObject): Promise<void>;
    /**
     * 특정 컴포넌트 하나만 화면에서 감추는 메서드입니다. <br>
     * 레이어에서 제거하지는 않으므로 showComponent로 다시 나타낼 수 있습니다.
     *
     * @param {ComponentObject} component 감출 컴포넌트이며 인스턴스 컴포넌트도 넘길 수 있습니다. <br>
     * @returns {Promise<void>} 숨김을 마치면 값 없이 완료되고, 컴포넌트를 넣지 않으면 거부되는 Promise <br>
     */
    hideComponent(component: ComponentObject): Promise<void>;
    /**
     * 이전에 생성된 컴포넌트를 반환하는 메서드입니다. <br>
     * 이전에 생성된 컴포넌트가 존재하지 않으면 undefined를 반환합니다.
     *
     * @returns {{position: ComponentObject, needClear: boolean} | undefined} {position: component} 대상 반환
     *
     * @ignore
     */
    getRenderPosition(): {
        position: ComponentObject;
        needClear: boolean;
    } | undefined;
    /**
     * 3D 에셋 파일을 내려받아 컴포넌트로 배치할 수 있는 형태로 준비하는 메서드입니다. <br>
     * 여기서 먼저 로드해 둔 에셋만 addPosition의 object 이름으로 지정할 수 있습니다. <br>
     * 에셋 정보를 넣지 않으면 기존 모델 설정을 다시 로드합니다.
     *
     * @param {U3dMultipleComponentModelInfo} modelInfo 내려받을 3D 에셋의 이름과 확장자, 경로를 담은 정보 <br>
     * @returns {Promise<void | ModelObject3D>} 로드한 원본 모델로 완료되며 에셋 정보를 넣지 않았으면 값 없이 완료되는 Promise <br>
     *   지원하지 않는 확장자나 잘못된 경로 등으로 로드에 실패하면 그 이유로 거부됩니다. <br>
     *
     * @example
     *  let model = {
     *      name: '다가구주택',
     *      ext: '3ds',
     *      baseurl: '모델 요청 URL',
     *      fileName: 'VIL_A.3ds'
     * }
     * layer.loadModel(model);
     */
    loadModel(modelInfo: U3dMultipleComponentModelInfo): Promise<void | ModelObject3D>;
    /**
     * @deprecated 이 메서드는 더 이상 사용하지 않으므로 addPosition 메서드를 사용하십시오.
     *
     * @param {any} opt
     *
     * @ignore
     */
    addComponent(opt: any): void;
    /**
     * @deprecated 이 메서드는 더 이상 사용하지 않으므로 removeAllComponent 메서드를 사용하십시오.
     */
    removeAllPosition(): void;
    /**
     * @deprecated 이 메서드는 더 이상 사용하지 않으므로 removeComponentByName 메서드를 사용하십시오.
     *
     * @param {string} name 제거하려는 컴포넌트 이름
     */
    removePositionByName(name: string): void;
    /**
     * @deprecated 이 메서드는 더 이상 사용하지 않으므로 removeComponentByName 메서드를 사용하십시오.
     *
     * @param {ComponentObject} selected
     */
    removePosition(selected: ComponentObject): void;
    /**
     * 레이어에 배치된 컴포넌트를 모두 제거하는 메서드입니다. <br>
     * 각 컴포넌트가 쓰던 메시와 인스턴스 정보, 경계영역 보관값까지 함께 정리합니다. <br>
     * 레이어 자체는 남으므로 이어서 addPosition으로 다시 배치할 수 있습니다.
     */
    removeAllComponent(): void;
    /**
     * 이름이 일치하는 컴포넌트를 레이어에서 제거하는 메서드입니다. <br>
     * 제거한 컴포넌트가 쓰던 메시와 인스턴스 정보도 함께 정리합니다. <br>
     * 이름이 일치하는 컴포넌트가 없으면 아무 작업도 하지 않습니다.
     *
     * @param {string} name 제거할 컴포넌트 이름 <br>
     */
    removeComponentByName(name: string): void;
    /**
     * 넘겨받은 컴포넌트를 레이어에서 제거하는 메서드입니다. <br>
     * 제거한 컴포넌트가 쓰던 메시와 인스턴스 정보도 함께 정리합니다. <br>
     * 이 레이어에 없는 컴포넌트를 넘기면 아무 작업도 하지 않습니다.
     *
     * @param {ComponentObject} selected 제거할 컴포넌트이며 getComponents나 getComponentByName으로 얻은 값을 넘기십시오. <br>
     */
    removeComponent(selected: ComponentObject): void;
    /**
     * 컴포넌트 중복 여부를 검사하는 메서드입니다. <br>
     * 이미 존재하는 컴포넌트인 경우 true를, 존재하지 않으면 false를 반환합니다.
     *
     * @param {ComponentObject} component 검사할 컴포넌트.
     * @returns {boolean} true면 중복, false면 중복이 아닙니다.
     *
     * @ignore
     */
    checkIsExistPosition(component: ComponentObject): boolean;
    /**
     * 이미 배치된 컴포넌트의 겉모습을 다른 3D 에셋으로 갈아 끼우는 메서드입니다. <br>
     * 위치는 그대로 두고 모델과 애니메이션, 회전, 크기만 바꿉니다. <br>
     * 바꿔 넣을 에셋은 loadModel로 미리 로드해 두어야 하며, 로드되지 않은 이름을 넣으면 아무 작업도 하지 않습니다. <br>
     * id나 option을 넣지 않아도 아무 작업도 하지 않습니다.
     *
     * @param {string} id 모습을 바꿀 컴포넌트의 식별자 <br>
     * @param {ChangeObjectOpt} option 갈아 끼울 3D 에셋 이름과 적용할 애니메이션 번호, 회전, 크기를 담은 옵션 <br>
     *
     * @example
     *   layer.changeObject('path_5680' , {
     *             object : 'drone_01',
     *             animationNum : 2,
     *             rotation :{x: 0, y: 0, z: 0},
     *             scale : {x: 1, y: 1, z: 1}
     *    });
     */
    changeObject(id: string, option: ChangeObjectOpt): void;
    /**
     * 레이어에 배치된 모든 컴포넌트의 이름표(라벨)를 화면에 표시하는 메서드입니다. <br>
     * 이미 표시 중이면 아무 작업도 하지 않고 곧바로 끝납니다. <br>
     * 호출 시점의 컴포넌트에만 적용되며, 이후 배치하는 컴포넌트의 이름표 표시는 배치 옵션이 결정합니다.
     *
     * @returns {Promise<boolean>} 처리가 끝나면 항상 true로 완료되는 Promise <br>
     */
    showLabel(): Promise<boolean>;
    /**
     * 레이어에 배치된 모든 컴포넌트의 이름표(라벨)를 화면에서 숨기는 메서드입니다. <br>
     * 이미 숨겨져 있으면 아무 작업도 하지 않고 곧바로 끝납니다. <br>
     * 이름표는 지워지지 않으므로 showLabel로 다시 표시할 수 있습니다.
     *
     * @returns {Promise<boolean>} 처리가 끝나면 항상 true로 완료되는 Promise <br>
     */
    hideLabel(): Promise<boolean>;
    /**
     * 레이어에 배치된 컴포넌트의 이름표(라벨)를 지우는 메서드입니다. <br>
     * 숨기는 것이 아니라 이름표 자체를 없애므로 다시 보이게 하려면 이름표를 새로 만들어야 합니다. <br>
     * 컴포넌트를 순서대로 훑다가 이름표가 없는 컴포넌트를 만나면 거기서 중단하므로 그 뒤 컴포넌트의 이름표는 남습니다.
     *
     * @returns {Promise<boolean>} 이름표를 하나라도 지우면 true로 완료되고, 첫 컴포넌트부터 이름표가 없으면 값 없이 거부되는 Promise <br>
     */
    removeLabel(): Promise<boolean>;
    /**
     * 씬에 등록되에 화면에 출력되고 있는 컴포넌트 mesh를 이름으로 검색하여 리턴하는 메서드입니다.
     *
     * @param {string} name 모델 데이터 이름
     * @returns {import('three').Object3D | undefined} 컴포넌트 mesh
     *
     * @ignore
     */
    getLoadedModel(name: string): three.Object3D | undefined;
    /**
     * 이름으로 등록된 컴포넌트의 알파맵 속성을 제거하는 메서드입니다. <br><br>
     * [용어] <br>
     * 알파맵(alphaMap) - 표면 전체의 불투명도를 제어하는 회색조 텍스처
     *
     * @param {string} name 컴포넌트 이름
     */
    removeModelAlphaMap(name: string): void;
    /**
     * 이름으로 등록된 컴포넌트의 알파맵 속성을 원본으로 되돌리는 메서드입니다.<br><br>
     * [용어] <br>
     * 알파맵(alphaMap) - 표면 전체의 불투명도를 제어하는 회색조 텍스처
     *
     * @param {string} name 컴포넌트 이름
     */
    resetModelAlphaMap(name: string): void;
    /**
     * 이름이 같은 3D 에셋에 알파 테스트(alpha test) 기준값을 설정하는 메서드입니다. <br>
     * 알파 테스트란 픽셀의 불투명도가 기준값보다 낮으면 그 픽셀을 아예 그리지 않는 처리입니다. <br>
     * 나뭇잎이나 울타리처럼 투명한 부분이 많은 텍스처에서 반투명 경계를 깔끔하게 잘라낼 때 사용합니다. <br>
     * 이름이 일치하는 에셋이 없으면 아무 작업도 하지 않습니다.
     *
     * @param {string} name 기준값을 적용할 3D 에셋 이름 <br>
     * @param {number} alphaFilter 픽셀을 그릴지 판단하는 불투명도 기준값이며 0 이상 1 이하로 지정하고, 0이면 모두 그리고 값이 클수록 더 많은 픽셀이 지워집니다. <br>
     */
    setModelAlphaTest(name: string, alphaFilter: number): void;
    /**
     * 이 레이어에 앞으로 배치할 컴포넌트가 사용할 기본 크기 배율을 정하는 메서드입니다. <br>
     * 값은 레이어에 보관되었다가 다음에 만들어지는 컴포넌트의 기본 크기로 전달됩니다. <br>
     * 이미 배치된 컴포넌트의 크기는 바뀌지 않으므로 화면에 있는 컴포넌트를 키우거나 줄이려면 그 컴포넌트에 직접 크기를 지정하십시오. <br>
     * 숫자도 객체도 아닌 값을 넣으면 아무 변화도 없습니다.
     *
     * @param {import('three').Vector3Like|number} scale 적용할 크기 배율이며 1이 원본 크기이고, `{x, y, z}` 형태로 넣으면 축마다 다른 배율을 숫자 하나로 넣으면 세 축에 같은 배율을 지정합니다. <br>
     */
    setScale(scale: three.Vector3Like | number): void;
    /**
     * 이 레이어에 앞으로 배치할 컴포넌트가 사용할 기본 회전을 정하는 메서드입니다. <br>
     * 값은 레이어에 보관되었다가 회전을 따로 지정하지 않은 컴포넌트의 기본 회전으로만 전달됩니다. <br>
     * 이미 배치된 컴포넌트는 돌아가지 않으므로 화면에 있는 컴포넌트를 돌리려면 그 컴포넌트에 직접 회전을 지정하십시오. <br>
     * degree가 허용 범위를 벗어나면 예외가 발생하고 보관값은 그대로 유지됩니다.
     *
     * @param {number} degree 회전할 각도이며 도(°) 단위로 -360 이상 360 이하만 허용합니다. <br>
     * @param {import('three').Vector3Like} [axis] 회전의 중심이 되는 축이며 `{x: 1, y: 0, z: 0}`은 x축을 중심으로 돌린다는 뜻이고, 넣지 않으면 월드 z축 `{x: 0, y: 0, z: 1}`을 사용합니다. <br>
     */
    setRotation(degree: number, axis?: three.Vector3Like): void;
    /**
     * 카메라가 특정 컴포넌트를 따라다니도록 설정하는 메서드입니다. <br>
     * 주행 중인 차량이나 비행체를 화면 중심에 두고 지정한 시점으로 계속 비추는 데 사용합니다. <br>
     * 대상 컴포넌트에는 opt의 active, view, offset, targetOffset을 그대로 적용합니다. <br>
     * 대상이 아닌 나머지 컴포넌트에는 active의 반대값을 전달하므로, active가 false이면 나머지 컴포넌트의 추적이 모두 켜집니다. <br>
     * 추적을 끄려면 active를 false로 넣기보다 추적을 유지할 컴포넌트를 대상으로 지정해 호출하는 편이 결과를 예측하기 쉽습니다.
     *
     * @param {CameraViewOption} opt 따라갈 대상 컴포넌트와 시점 종류, 추적 사용 여부, 카메라 위치·시선 보정값을 담은 옵션 <br>
     */
    setCameraTrace(opt: CameraViewOption): void;
    /**
     * 컴포넌트를 배치할 때 기준으로 삼을 헬퍼 위치를 레이어에 보관하는 메서드입니다. <br>
     * 화면에서 고른 지점을 기억해 두었다가 다음 배치 위치로 쓰는 용도입니다. <br>
     * position을 넣지 않으면 보관된 값을 그대로 유지합니다.
     *
     * @param {WorldPositionVector3} [position] 보관할 위치이며 월드 좌표(EPSG:3857, 단위 m)입니다. <br>
     */
    setHelperPosition(position?: WorldPositionVector3): void;
    /**
     * @todo 동작확인 필요
     * raycaster와 교차된 컴포넌트를 찾아 반환하는 함수
     * @param {Event & {normalizedX: number, normalizedY: number}} event 사용자 이벤트 (마우스 클릭 등)
     * @param {import('@union3d/core/URaycaster').URaycaster } raycaster raycaster
     * @returns {ComponentObject | undefined} component 교차된 컴포넌트
     *
     * @ignore
     */
    getIntersect(event: Event & {
        normalizedX: number;
        normalizedY: number;
    }, raycaster: URaycaster): ComponentObject | undefined;
    /**
     * 로드 된 3d 에셋의 박스영역 정보를 key-value 형식으로 저장하는 메서드입니다.
     *
     * @param {string} key 저장 키
     * @param {import('@union3d/core/UBox3').UBox3} value 박스영역
     */
    setBbox(key: string, value: UBox3): void;
    /**
     * 로드 된 3d 에셋의 박스영역 정보를 이름으로 찾는 메서드입니다.
     *
     * @param {string} key 3d 에셋 이름
     * @returns {import('@union3d/core/UBox3').UBox3 | undefined}  박스영역
     */
    getBbox(key: string): UBox3 | undefined;
    #private;
}

export type { CameraViewOption, ChangeObjectOpt, ComponentCreateOption, ComponentSaveDate, InstancedComponentInfo, InstancedInfo, InstancedInfoStore, InstancedInfo_Content, U3dMultipleComponentLayer, U3dMultipleComponentLayerCO, U3dMultipleComponentLayerCO_Content, U3dMultipleComponentLayerEMI, U3dMultipleComponentLayerEMI_Content };
