//@ts-check
import * as THREE from 'three';
import {U3dModelBasicLayer} from '@union3d/3dLayer/U3dModelBasicLayer';
import {defined} from '@union3d/util/defined';
import {U3dComponentPosition} from '@union3d/3dLayer/U3dComponentPosition'
import {U3dComponentInstancedPosition} from '@union3d/3dLayer/U3dComponentInstancedPosition'
import {UScene} from '@union3d/core/UScene';
import {UGroup} from '@union3d/core/UGroup';
import {defaultValue} from '@union3d/util/defaultValue';
import {UCheckTime} from '@union3d/core/UCheckTime';
import {UDEF} from '@union3d/core/UDEF';
import {UBox3} from '@union3d/core/UBox3';
import {URaycaster} from '@union3d/core/URaycaster';
import {USpotLight} from '@union3d/view/USpotLight';
import {UMathEngine} from '@union3d/math/UMathEngine';
import {deferred} from "@union3d/util/deferred";
import {UInstancedMesh} from "@union3d/core/mesh/UInstancedMesh";
import {UInstancedBatchedSkinnedMesh} from "@union3d/core/mesh/UInstancedBatchedSkinnedMesh";
import {INTERNAL} from '@union3d/3dLayer/U3dMultipleComponentLayer.internal';
import {__GError__, __GInfo__} from "@U3dMessage";
import {normalizeOptionKeys} from "@util/normalizeOptionKeys.js";

/**
 * @typedef {object} ChangeObjectOpt 3D 에셋 변경 옵션
 * @property {string} object 3D 에셋 이름
 * @property {number} animationNum 3D 에셋의 애니메이션(Clip) 인덱스 번호
 * @property {WorldPosition} position 3D 에셋의 위치
 * @property {import('three').Vector3Like} scale 3D 에셋의 스케일 ex) {x:2, y:2, z:2}
 * @property {import('three').Vector3Like} rotation 3D 에셋의 회전 ex) {x:90, y:0, z:0}
 */

/**
 * @typedef {object} CameraViewOption 카메라 시점 제어 옵션
 * @property {ComponentObject} component
 * 카메라가 따라갈 대상 컴포넌트 (예: 드론, 자동차 등 움직이는 객체).
 * @property {string} view
 * 카메라 시점 종류. <br>
 * - `FrontView` : 대상의 정면에서 바라보는 시점  <br>
 * - `TopView` : 대상의 위에서 내려다보는 시점  <br>
 * - `ThirdPersonFront` :  3인칭 시점 (컴포넌트 앞면)<br>
 * - `ThirdPersonRight` : 3인칭 시점 (컴포넌트 우측면) <br>
 * - `ThirdPersonLeft` : 3인칭 시점 (컴포넌트 좌측면)<br>
 * - `ThirdPersonBack` : 3인칭 시점 (컴포넌트 뒷면)<br>
 * - `ThirdPersonRound` : 3인칭 시점 (컴포넌트를 기준으로 회전)
 * @property {boolean} active
 * 카메라 추적 활성 여부. <br>
 * - `true` : 카메라가 대상 컴포넌트를 지정한 시점으로 실시간 추적  <br>
 * - `false` : 카메라 추적 중지
 * @property {import('three').Vector3Like} offset
 * 카메라 위치 보정값 (x, y, z). <br>
 * 입력한 값만큼 카메라 위치를 이동시킵니다. <br>
 * 예: `{ x: 0, y: 0, z: 10 }` → 대상보다 10m에서 카메라가 따라감
 * @property {import('three').Vector3Like} [targetOffset]
 * 카메라가 바라보는 지점의 보정값 (x, y, z). 생략 가능. <br>
 * 입력한 값만큼 카메라의 시선 방향을 이동시킵니다. <br>
 * 예: `{ x: 0, y: 0, z: 2 }` → 대상의 2m 위 지점을 바라봄
 */


/**
 * three.js의 Object3D에 GeOnDT가 실행 중에 붙이는 임의 속성을 함께 허용하는 타입입니다. <br>
 * 원본 라이브러리 타입에는 없는 내부 표식이나 이름 속성을 읽고 써야 하는 자리에 사용합니다.
 *
 * @typedef {import('three').Object3D & Record<string, any>} AnyObject3D
 */

/**
 * LayerObject3D 추가 멤버
 *
 * @typedef {object} LayerObject3DExt
 * @property {string} [_ulayername]
 * @property {string} [_objectName]
 *
 * @ignore
 */

/**
 * 어떤 레이어에 속해 있는지 표시가 붙은 3D 객체입니다. <br>
 * 화면에서 집어낸 객체가 어느 레이어의 것인지 되짚을 때 사용합니다.
 *
 * @typedef {AnyObject3D & LayerObject3DExt} LayerObject3D
 */

/**
 * InstancedGroupObject 추가 멤버
 *
 * @typedef {object} InstancedGroupObjectExt
 * @property {string} [_objectName]
 *
 * @ignore
 */

/**
 * 같은 3D 에셋으로 만든 인스턴스들을 묶어 한 번에 그리는 그룹입니다. <br>
 * 인스턴스가 그룹 정원을 넘으면 그룹이 하나 더 만들어집니다.
 *
 * @typedef {import('@UGroup').UGroup & InstancedGroupObjectExt} InstancedGroupObject
 */

/**
 * 인스턴스 컴포넌트 하나를 만들 때 원본 배치 정보로 기록해 두는 값입니다. <br>
 * 인스턴스는 개별 객체를 갖지 않으므로 여기에 적힌 값이 나중에 그 인스턴스를 되살리는 기준이 됩니다.
 *
 * @typedef {object} InstancedInputOption
 * @property {WorldPositionVector3} [position] 배치 위치이며 월드 좌표(EPSG:3857, 단위 m)입니다. <br>
 * @property {GeoPosition} [geoPosition] 배치 위치를 위경도로 지정할 때 사용하며 월드 좌표로 변환되어 기록됩니다. <br>
 * @property {import('three').Euler | import('three').Vector3Like} [rotation] 배치 회전이며 Euler는 라디안 그대로, `{x, y, z}` 객체는 도(°)로 해석합니다. <br>
 * @property {import('three').Vector3 | import('three').Vector3Like} [scale] 배치 크기 배율이며 1이 원본 크기입니다. <br>
 * @property {boolean} [visible] 만든 직후 화면에 보일지 여부 <br>
 * @property {boolean} [labelVisible] 만든 직후 이름표를 보일지 여부 <br>
 * @property {string} [name] 인스턴스를 가리킬 이름 <br>
 */

/**
 * ExtObject3D 추가 멤버
 *
 * @typedef {object} ExtObject3DExt
 * @property {string} [_ext]
 *
 * @ignore
 */

/**
 * 원본 파일 확장자 표시가 붙은 3D 객체입니다. <br>
 * 같은 객체라도 확장자에 따라 처리 방식이 달라지는 자리에서 사용합니다.
 *
 * @typedef {import('three').Object3D & ExtObject3DExt} ExtObject3D
 */

/**
 * 3D 에셋에서 뽑아낸 메시를 다시 쓰기 위해 모아 둔 보관소입니다. <br>
 * 같은 에셋을 여러 번 배치할 때 메시를 새로 만들지 않고 여기서 꺼내 씁니다. <br>
 * 키는 메시를 구분하는 내부 이름이고 값은 그 메시입니다.
 *
 * @typedef {Record<string, any>} CacheMeshMap
 */

/**
 * 3D 에셋 이름으로 그 에셋의 인스턴스 배치 정보를 찾아보는 보관소입니다. <br>
 * 인스턴스 컴포넌트를 되살리거나 개별 인스턴스를 수정할 때 여기서 원본 값을 꺼냅니다.
 *
 * @typedef {Map<string, InstancedInfo>} InstancedInfoStore
 */

/**
 * 같은 이름의 컴포넌트가 몇 번째까지 만들어졌는지 세어 두는 보관소입니다. <br>
 * 이름이 겹치지 않도록 새 컴포넌트에 붙일 번호를 정할 때 사용합니다. <br>
 * 키는 기준이 되는 이름이고 값은 지금까지 붙인 번호입니다.
 *
 * @typedef {Record<string, number>} NameInfoMap
 */

/**
 * @typedef InstancedComponentInfo 인스턴스 정보
 * @property {import('three').Vector3} position 원본 위치
 * @property {import('three').Euler} rotation 원본 회전값
 * @property {import('three').Vector3} scale 원본 크기값
 * @property {boolean} visible 가시화 여부
 * @property {boolean} labelVisible 라벨 가시화 여부
 * @property {string} name 원본 3D 에셋 이름
 * @property {Array<import('three').AnimationMixer>} [mixers] 애니메이션 믹서
 */

/**
 * ~extends Map<number, InstancedComponentInfo> <br>
 *
 * 인스턴스 컴포넌트 하나하나의 원본 배치 정보를 인스턴스 번호로 찾아보는 보관소입니다. <br>
 * 같은 3D 에셋으로 만든 인스턴스들이 한 보관소에 모이며, 번호는 생성 순서대로 발급됩니다.
 *
 * @typedef {object} InstancedInfo_Content
 * @property {number} [lastIndex] 마지막으로 발급한 인스턴스 번호이며 다음 인스턴스의 번호를 정할 때 기준이 됩니다. <br>
 *
 * @typedef {Map<number, InstancedComponentInfo> & InstancedInfo_Content} InstancedInfo
 */

/**
 * 영역 검색에 쓰려고 위경도 다각형을 바닥 평면 좌표로 바꿔 둔 값입니다. <br>
 * 꼭짓점과 변을 미리 만들어 두어 컴포넌트마다 다시 계산하지 않게 합니다. <br>
 * polyPoints는 다각형의 꼭짓점, polyBox는 다각형을 감싸는 최소 사각형, polyEdges는 이웃한 꼭짓점을 이은 변 목록입니다. <br>
 *
 * @typedef {{polyPoints: Array<import('three').Vector2>, polyBox: import('three').Box2, polyEdges: Array<Array<import('three').Vector2>>}} SearchArea
 */

/**
 * addPosition으로 컴포넌트를 배치할 때 넘기는 옵션입니다. <br>
 * 항목별 의미는 ComponentParam을 따르며 필요한 항목만 골라 넣으면 됩니다. <br>
 * 여기에 없는 주행 경로나 조명 같은 항목도 함께 받습니다.
 *
 * @typedef {Partial<ComponentParam> & Record<string, any>} ComponentCreateOption
 */

/**
 * ~extends U3dModelBasicLayerCO <br>
 *
 * U3dMultipleComponentLayer 생성자 옵션입니다. <br>
 * 레이어를 만들 때 한 번만 정하는 기본 크기·회전, 인스턴스 생성 방식, 라벨 표시 여부를 담습니다. <br>
 * 여기서 정한 크기와 회전은 이후 배치되는 컴포넌트의 기본값으로 쓰입니다.
 *
 * @typedef {object} U3dMultipleComponentLayerCO_Content
 * @property {import('three').Vector3Like} [scale={x: 1, y: 1, z: 1}] 레이어 크기값 (모든 컴포넌트 일괄 적용)
 * @property {import('three').Vector3Like} [rotation={x: 0, y: 0, z: 0}] 레이어 회전값 (모든 컴포넌트 일괄 적용)
 * @property {number} [collisiondistance=10] 컴포넌트 간 충돌 감지 거리 <hidden>
 * @property {function} [collisionFunction] 컴포넌트 간 충돌 발생 시 실행되는 콜백 함수 <hidden>
 * @property {boolean} [setInstanced=true] 컴포넌트 생성 타입을 InstancedComponent로 생성할 지 여부. true면 기본 InstancedComponent로 생성
 * @property {number} [instancedMaxCount=500] InstancedComponent 생성시 그룹 크기 <hidden>
 * @property {boolean} [labelVisible=false] 컴포넌트 라벨 가시화 여부 (모든 컴포넌트 일괄 적용)
 * @property {boolean} [drawPath=false]
 * @property {string} [typePath='line']
 * @property {string} [image]
 * @property {import('three').Vector3Like} [axis={x: 0, y: 0, z: 0}]
 * @property {number} [rotateAngle=0] 경로를 따라갈 때 컴포넌트를 추가로 돌려 줄 각도이며 도(°) 단위입니다. <br>
 *
 * @typedef {Omit<U3dModelBasicLayerCO, never> & U3dMultipleComponentLayerCO_Content} U3dMultipleComponentLayerCO
 */

/**
 * ~extends U3dLayerEMI <br>
 *
 * U3dMultipleComponentLayer가 발생시키는 이벤트 이름 모음의 형식입니다. <br>
 * 기반 레이어 이벤트에 컴포넌트 생성 관련 이벤트를 더합니다.
 *
 * @memberof U3dMultipleComponentLayer
 * @inner
 *
 * @typedef {object} U3dMultipleComponentLayerEMI_Content
 * @property {string} BEFORE_CREATE 컴포넌트를 만들기 직전에 발생하며 `data`는 생성 옵션입니다. <br>
 * @property {string} CREATE 컴포넌트를 배치한 직후에 발생하며 `data`는 배치된 컴포넌트입니다. <br>
 *
 * @typedef {Omit<U3dLayerEMI, never> & U3dMultipleComponentLayerEMI_Content} U3dMultipleComponentLayerEMI
 */

/**
 * 컴포넌트 저장 데이터
 *
 * @typedef {object} ComponentSaveDate
 * @property {string} layer 컴포넌트 레이어 이름
 * @property {Array<ComponentParam>} components 컴포넌트 별 저장 데이터
 */

const COMPONENT_TYPE = {COMPONENT: "component", CROWD: "crowd"};
const ROTATE_AXIS = new THREE.Vector3(0, 0, 1);
const TEMP_QUATERNION = new THREE.Quaternion();
const TEMP_EULER = new THREE.Euler();
const TEMP_POSITION = new THREE.Vector3();
const TEMP_SCALE = new THREE.Vector3();
const DEFAULT_RENDER_ORDER = UDEF.RENDER_ORDER.MODEL;


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
class U3dMultipleComponentLayer extends U3dModelBasicLayer {
    /**
     * 생성자 옵션에서 이 레이어가 읽어 들이는 키 목록입니다. <br>
     * 목록에 없는 키는 옵션으로 넘겨도 무시됩니다.
     *
     * @override
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS = [
        ...U3dModelBasicLayer.OPT_KEYS, 'drawPath', 'typePath', 'rotateAngle', 'collisionDistance',
        'collisionFunction', 'setInstanced', 'instancedMaxCount', 'labelVisible'
    ];

    /**
     * 이 레이어가 발생시키는 이벤트의 이름 모음입니다. <br>
     * addEventListener에 넘길 이벤트 이름을 문자열로 직접 적는 대신 이 값을 사용하십시오. <br>
     * BEFORE_CREATE는 컴포넌트를 만들기 직전에, CREATE는 컴포넌트를 배치한 직후에 발생합니다.
     *
     * @override
     *
     * @type {U3dMultipleComponentLayerEMI}
     */
    static EVENT = {
        ...U3dModelBasicLayer.EVENT,
        BEFORE_CREATE : 'beforeCreate',
        CREATE: 'create'
    }

    /** @type {{cursor: number}} */
    #updateState

    /**
     * 인스턴스 방식으로 배치한 컴포넌트들이 공유하는 대표 메시입니다. <br>
     * 인스턴스 컴포넌트를 아직 만들지 않았으면 없습니다.
     *
     * @type {InstancedMeshLike | undefined}
     */
    _instancedMesh;

    /**
     * 컴포넌트 배치를 돕는 헬퍼 객체를 앱에서 찾을 때 쓰는 식별자입니다. <br>
     * 헬퍼를 등록하지 않았으면 없습니다.
     *
     * @type {string | number | undefined}
     */
    _helperId;

    /**
     * 이 레이어에 배치된 컴포넌트를 배치한 순서대로 담은 목록입니다. <br>
     * 이름 검색, 전체 순회, 주행 제어가 모두 이 순서를 따릅니다. <br>
     * 값을 읽을 때는 getComponents를 사용하고 이 목록을 직접 바꾸지 마십시오.
     *
     * @type {Array<ComponentObject>}
     */
    _componentList;

    /**
     * 주행 애니메이션을 등록해 둔 컴포넌트들의 이름 목록이며 같은 이름은 한 번만 담깁니다.
     *
     * @type {Array<string>}
     */
    _animateList;

    /**
     * 로드한 3D 에셋별 경계영역을 에셋 이름으로 찾아보는 보관소입니다. <br>
     * 같은 에셋을 여러 번 배치할 때 경계영역을 다시 계산하지 않기 위해 사용합니다.
     *
     * @type {Map<string, import('@union3d/core/UBox3').UBox3>}
     */
    _bboxMap;

    /**
     * U3dMultipleComponentLayer 클래스 생성자입니다. <br>
     * 컴포넌트를 담을 빈 레이어를 만들며, 화면에 올리려면 app.addLayer로 앱에 등록해야 합니다. <br>
     * 옵션으로 정한 크기와 회전은 이후 배치되는 컴포넌트의 기본값이 됩니다.
     *
     * @param {Partial<U3dMultipleComponentLayerCO>} opt 레이어 이름과 기본 크기·회전, 인스턴스 생성 방식을 지정하는 생성 옵션 <br>
     */
    constructor(opt) {
        opt = /** @type {U3dMultipleComponentLayerCO} */ (/** @type {unknown} */ (normalizeOptionKeys(opt, new.target)));
        if (!defined(opt)) {
            console.info('U3dMultipleComponentLayer constructor is failed. because opt is null');
            return;
        }
        super(/** @type {Partial<U3dModelBasicLayerCO>} */ (/** @type {unknown} */ (opt)));

        const self = this;
        this._type = 'model';
        this._classtype = 'U3dMultipleComponentLayer';
        this._componentList = [];
        this._renderIndex = 0;
        this._drawPath = defaultValue(opt.drawPath, false); // TODO : 사용 없음(확인 후 제거)
        this._typePath = defaultValue(opt.typePath, 'line'); // TODO : 사용 없음(확인 후 제거)
        this._instancedMesh = undefined;
        this._image = defaultValue(opt.image, undefined); // TODO : 사용 없음(확인 후 제거)
        this._axis = defaultValue(opt.axis, {x: 0, y: 0, z: 0}); // TODO : 사용 없음(확인 후 제거)
        this._scale = defaultValue(opt.scale, {x: 1, y: 1, z: 1});
        this._rotation = defaultValue(opt.rotation, {x: 0, y: 0, z: 0});
        this._rotation = new THREE.Euler(this._rotation.x, this._rotation.y, this._rotation.z, 'XYZ');
        this._helperId = undefined; // TODO : 사용 없음(확인 후 제거)
        this._helperPosition = undefined;  // TODO : 사용 없음(확인 후 제거)
        this._rotateAngle = defaultValue(opt.rotateAngle, 0); // TODO : 사용 없음(확인 후 제거)
        self._scenePoi = new UScene();
        this._checkTime = new UCheckTime();

        this._collisionDistance = defaultValue(opt.collisiondistance, 10);
        this._collisionFunction = defaultValue(opt.collisionFunction, undefined);

        this._setInstanced = defaultValue(opt.setInstanced, true);
        this._instancedInfo = new Map();
        this._nameInfo = {};
        this._bboxMap = new Map();
        if (this._setInstanced)
            this._instancedObject = new UGroup();
        this._animateList = [];
        this._animationPlaybackState = 'stopped';
        this._cacheMeshList = {};
        this._instancedMaxCount = defaultValue(opt.instancedMaxCount, 500);

        this._componentMap = new Map();

        // LOD 관련 프로퍼티
        this.#updateState = {
            cursor : 0,
        }

        this.labelVisible = defaultValue(opt.labelVisible, false);

        // this.instancedMoveManager = new InstancedMoveManager(this._instancedMesh)
    }

    /**
     * 레이어에 배치된 컴포넌트를 한꺼번에 화면에 나타내는 메서드입니다. <br>
     * 개별 컴포넌트를 hideComponent로 숨겨 둔 경우 그 컴포넌트는 숨겨진 상태로 남습니다.
     *
     * @override
     */
    show() {
        super.show(true);
        /** @type {Array<ComponentObject>} */
        const components = this._componentList ?? [];
        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            component?.show();
        }

        this.startAnimation();
    };

    /**
     * 레이어에 배치된 컴포넌트를 한꺼번에 화면에서 숨기는 메서드입니다. <br>
     * 컴포넌트는 그대로 남아 있으므로 show로 다시 나타낼 수 있습니다.
     */
    hide() {
        super.show(false);
        /** @type {Array<ComponentObject>} */
        const components = this._componentList ?? [];
        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            component.hide();
        }

        this.stopAnimation();
    };

    /**
     * 현재 레이어에 배치된 모든 컴포넌트의 스타일을 한꺼번에 변경합니다. <br>
     * option에 지정한 속성만 적용하며 생략하거나 null로 지정한 속성은 기존 값을 유지합니다. <br>
     * 이 설정은 호출 시점에 등록된 컴포넌트에만 적용되고 이후 추가하는 컴포넌트의 기본 스타일은 바꾸지 않습니다.
     *
     * @param {U3dMultipleComponentLayerStyle} option 적용할 색상, 불투명도, 가시성, 밝기와 대비 <br>
     */
    setStyle(option) {
        if (!defined(option) || typeof option !== 'object' || Array.isArray(option)) {
            throw new TypeError('스타일은 객체여야 합니다.');
        }

        const {color, opacity, visible, brightness, contrast} = option;

        if (defined(color)
            && typeof color !== 'string'
            && typeof color !== 'number'
            && !(color instanceof THREE.Color)) {
            throw new TypeError('색상은 Three.js에서 지원하는 색상 값이어야 합니다.');
        }
        if (defined(opacity)) {
            if (typeof opacity !== 'number') throw new TypeError('불투명도는 숫자여야 합니다.');
            if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
                throw new RangeError('불투명도는 0 이상 1 이하의 유한한 값이어야 합니다.');
            }
        }
        if (defined(visible) && typeof visible !== 'boolean') {
            throw new TypeError('가시화 여부는 boolean이어야 합니다.');
        }
        for (const value of [brightness, contrast]) {
            if (!defined(value)) continue;
            if (typeof value !== 'number') throw new TypeError('밝기와 대비는 숫자여야 합니다.');
            if (!Number.isFinite(value) || value < 0 || !Number.isFinite(Math.fround(value))) {
                throw new RangeError('밝기와 대비는 Float32로 표현 가능한 0 이상의 유한한 값이어야 합니다.');
            }
        }

        for (const component of this._componentList) {
            if (defined(color)) component.setColor(color);
            if (defined(opacity)) component.setOpacity(opacity);
            if (defined(visible)) {
                if (visible) component.show();
                else component.hide();
            }
            if (defined(brightness)) component.setBrightness(brightness);
            if (defined(contrast)) component.setContrast(contrast);
        }
    }

    /**
     * 레이어와 그 안의 컴포넌트를 모두 해제하는 메서드입니다. <br>
     * 배치된 컴포넌트와 그들이 쓰던 메시, 인스턴스 정보를 정리하고 화면에서 걷어냅니다. <br>
     * 해제한 뒤에는 이 레이어를 다시 사용할 수 없습니다.
     *
     * @inheritDoc
     * @override
     */
    dispose() {
        this.removeAllPosition();
        return super.dispose();
    };

    /**
     * 앞으로 배치할 컴포넌트를 인스턴스 방식으로 만들지 정하는 메서드입니다. <br>
     * 인스턴스 방식은 같은 에셋을 대량으로 놓을 때 메모리와 렌더링에 유리합니다. <br>
     * 이미 배치된 컴포넌트에는 소급되지 않으므로 방식을 바꾸려면 다시 배치해야 합니다.
     *
     * @param {boolean} val true이면 인스턴스 방식으로, false이면 일반 방식으로 만듭니다. <br>
     */
    setInstanced(val) {
        this._setInstanced = val

        // _instancedObject 초기화
        if (!defined(this._instancedObject))
            this._instancedObject = new UGroup();
    }

    /**
     * 현재 레이어가 인스턴스 컴포넌트 생성 모드인지 확인하는 메서드입니다. <br>
     * true이면 addPosition으로 배치하는 컴포넌트가 인스턴스 방식으로 만들어집니다.
     *
     * @returns {boolean} `true` : 인스턴스 모드 / `false` : 일반 모드
     */
    isInstanced(){
        return this._setInstanced;
    }

    /**
     * 레이어에 등록된 주행 애니메이션 목록을 반환하는 함수
     *
     * @returns {Array<string>} 애니메이션 목록
     *
     * @ignore
     */
    getAnimateList() {
        return this._animateList;
    }

    /**
     * 이름을 받아 주행 애니메이션을 추가하는 함수
     *
     * @param {string} name 애니메이션 이름
     *
     * @ignore
     */
    addAnimateList(name) {
        const self = this;
        if (self._animateList.indexOf(name) === -1) {
            self._animateList.push(name);
        }
    }

    /**
     * 이름을 받아 등록된 주행 애니메이션을 제거하는 함수
     *
     * @param {string} name 애니메이션 이름
     *
     * @ignore
     */
    removeAnimateList(name) {
        const self = this;
        let idx = self._animateList.indexOf(name);
        if (idx > -1) {
            self._animateList.splice(idx, 1);
        }
    }

    /**
     * 레이어의 모든 컴포넌트가 지나온 누적 경로(CumulativeRoute)를 화면에 보이거나 숨기는 메서드입니다. <br>
     * 누적 경로는 주행 애니메이션이 진행되면서 실제로 지나온 자취를 선으로 남긴 것입니다. <br>
     * 누적 경로를 남기도록 만들어지지 않은 컴포넌트는 아무 변화도 없습니다. <br>
     * 호출 시점의 컴포넌트에만 적용되므로 이후에 추가한 컴포넌트에는 다시 호출해야 합니다.
     *
     * @param {boolean} isVisible true이면 누적 경로를 표시하고 false이면 숨깁니다. <br>
     */
    visibleCumulativeRoute(isVisible) {
        const components = this.getComponents();
        for (let component of components) {
            if(isVisible)
                component.showCumulativeRoute();
            else
                component.hideCumulativeRoute();
        }
    }

    /**
     * 인스턴스 컴포넌트의 메타데이터를 반환하는 메서드
     *
     * @returns {InstancedInfoStore} 인스턴스 컴포넌트 정보
     */
    getInstancedInfo(){
        const self = this;
        return defined(self._instancedInfo) ? self._instancedInfo : new Map();
    }

    /**
     * 화면에 그려진 누적 경로(trail)를 눌러 그 경로의 주인 컴포넌트를 찾는 메서드입니다. <br>
     * 마우스 위치와 각 컴포넌트의 누적 경로가 겹치는지 검사해 겹친 컴포넌트를 모아 돌려줍니다. <br>
     * 누적 경로를 남기지 않도록 만들어졌거나 아직 지나온 자취가 없는 컴포넌트는 검사 대상에서 빠집니다. <br>
     * 컴포넌트 자체를 클릭해 고르는 것이 아니라 경로 선을 클릭해 고르는 용도입니다.
     *
     * @param {MouseEvent} e 클릭 위치를 담고 있는 마우스 이벤트 <br>
     * @returns {Array<ComponentObject>} 누른 지점에 누적 경로가 걸린 컴포넌트 목록이며 걸린 것이 없으면 빈 배열 <br>
     */
    selectComponentByTrails (e) {
        const result = [];
        for(let component of this.getComponents()) {
            const trail = component.selectedByTrail(e);

            if(defined(trail)) {
                result.push(trail);
            }
        }
        return result;
    }

    /**
     * 컴포넌트를 마우스로 고르기 쉽도록 선택용 보조 영역을 켜는 메서드입니다. <br>
     * 가늘거나 작은 컴포넌트도 넉넉한 영역으로 집을 수 있게 됩니다. <br>
     * 호출 시점의 컴포넌트에만 적용됩니다.
     */
    onSelectHelperMeshes () {
        for(let component of this.getComponents()) {
            // component.cumulativePath?.hide();
            component.onSelectHelperMesh();
        }
    }

    /**
     * 선택용 보조 영역을 끄는 메서드입니다. <br>
     * 끄면 컴포넌트의 실제 형상에 닿아야만 고를 수 있습니다. <br>
     * 호출 시점의 컴포넌트에만 적용됩니다.
     */
    offSelectHelperMeshes () {
        for(let component of this.getComponents()) {
            component.offSelectHelperMesh();
            // component.cumulativePath?.show();
        }
    }

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
    debugBound(isDebug, color = 0xffff00) {
        const debugColor = typeof color === 'number' ? color : new THREE.Color(color).getHex();
        if(!super.debugBound(isDebug, debugColor))
            return false;

        const self = this;
        if(isDebug){
            this._app.setRenderBefore(this._debug.eventId,()=>{
                if (!self._debug.objectBound) return;
                for(const child of self.getComponentList()){
                    self._debug.objectBound.add(child.getBoundingBox(), debugColor);
                }
                self._debug.objectBound.commit();
            });
        }
        return true;
    }

    //=================== 검새 관련 API ===============================================//
    /**
     * 전체 컴포넌트 목록을 반환하는 메서드.
     *
     * @returns {Array<ComponentObject>} 전체 컴포넌트 목록
     */
    getComponents () { return this._componentList; };

    /**
     * @deprecated 이 메서드는 더 이상 사용하지 않으므로 getComponents 메서드를 사용하십시오.
     */
    getComponentList  () { return this._componentList; };

    /**
     * 로드된 3D 에셋 파일의 원본 정보 목록을 반환합니다.
     *
     * @returns {Array<U3dMultipleComponentModelInfo>} 3D 에셋 원본 정보 목록
     */
    getListModel  () { return this._listModel; };


    /**
     * 이름으로 3D 에셋 원본 정보를 찾아 반환합니다.
     *
     * @param {string} name 찾을 3D 에셋 이름
     * @returns {U3dMultipleComponentModelInfo | undefined} 찾은 3D 에셋 원본 정보. 없으면 `undefined`
     */
    getListModelByName(name) {
        return this._listModel.find((/** @type {U3dMultipleComponentModelInfo} */ info) => info.name === name);
    }

    /**
     * 이름이 일치하는 컴포넌트를 찾아 반환하는 메서드입니다. <br>
     * 이름은 배치할 때 지정한 값이며 같은 이름은 하나만 등록되므로 결과도 하나입니다.
     *
     * @param {string} name 찾을 컴포넌트 이름 <br>
     * @returns {ComponentObject | undefined} 이름이 일치하는 컴포넌트이며 없으면 undefined <br>
     */
    getComponentByName (name) {
        if (!defined(name) || !this._componentMap) return undefined;
        return this._componentMap.get(name);
    };

    /**
     * Raycaster 교차(intersect) 결과로 교차되는 컴포넌트를 찾아 반환하는 메서드
     *
     * @param {import('three').Intersection} intersect  Raycaster 교차 결과 객체
     * @returns {ComponentObject | undefined} 찾은 컴포넌트. 없으면 `undefined`
     *
     * @ignore
     */
    getComponentByIntersect (intersect) {
        const mesh = /** @type {any} */(intersect.object);
        if (!mesh) return undefined;

        // U3dComponentInstancedPosition
        if (mesh.isInstancedMesh || mesh.isInstancedMesh2) {
            const groupIndex = mesh._groupIndex ?? 0;
            const offset = groupIndex * this._instancedMaxCount;
            const instanceId = (intersect?.instanceId ?? 0) + offset;
            const modelName = mesh._objectName;
            if (!modelName) return;  // undefined 가드

            const infoMap = /** @type {InstancedInfo | undefined} */ (/** @type {InstancedInfoStore | undefined} */ (this._instancedInfo)?.get(modelName));
            const instanceInfo = infoMap?.get(instanceId);
            const componentName = instanceInfo?.name;

            if (defined(componentName)) {
                return this.getComponentByName(componentName);
            }

            const components = this._componentList ?? [];
            return components.find((c) => {
                return c?._setInstanced
                    && defined(c.instanceId)
                    && c.instanceId === instanceId
                    && c._object?.name === modelName;
            });
        }

        // U3dComponentPosition
        const uuid = mesh.uuid;
        const components = this._componentList ?? [];
        for (let component of components) {
            /** @type {ComponentObject | undefined} */
            let found;
            component?._object?.traverse?.((/** @type {import('three').Object3D & Partial<{isMesh: boolean}>} */ child) => {
                if (found) return;
                if (child?.isMesh && child.uuid === uuid) {
                    found = component;
                }
            });
            if (found) return found;
        }

        return undefined;
    }

    /**
     * 같은 3D 에셋으로 만든 컴포넌트를 모두 찾아 반환하는 메서드입니다. <br>
     * 컴포넌트를 배치할 때 지정한 원본 에셋 이름을 기준으로 고릅니다.
     *
     * @param {string} modelName 원본 3D 에셋 이름이며 loadModel에 넘긴 name과 같은 문자열입니다. <br>
     * @returns {Array<ComponentObject>} 그 에셋으로 만든 컴포넌트 목록이며 없으면 빈 배열 <br>
     */
    getComponentsByModel (/** @type {string} */ modelName) {
        /** @type {Array<ComponentObject>} */
        const list = [];
        const components = this._componentList;
        if (!components || components.length === 0) return list;


        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            if (component._object?.name === modelName) list.push(component);
        }
        return list;
    };

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
    getComponentsByProperty (callback) {
        const searched = [];
        const components = this._componentList ?? [];

        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            const properties = component.getProperties();
            const isSearch = callback.call(this, component, properties);
            if(defined(isSearch)) searched.push(isSearch);
        }
        return searched;
    }

    /**
     * 지도 위에 그린 다각형 안에 들어 있는 컴포넌트를 찾아 반환하는 메서드입니다. <br>
     * 컴포넌트에 경계영역이 있으면 그 영역이 다각형과 겹치는지로, 없으면 컴포넌트의 중심점이 다각형 안에 있는지로 판단합니다. <br>
     * 높이는 보지 않고 바닥 평면에서만 비교합니다. <br>
     * 좌표가 세 개보다 적으면 다각형을 만들 수 없으므로 빈 배열을 반환합니다.
     *
     * @param {Array<GeoPosition>} points 검색할 다각형의 꼭짓점을 이은 위경도 좌표 배열이며 세 개 이상이어야 합니다. <br>
     * @returns {Array<ComponentObject>} 다각형 안에 있는 컴포넌트 목록이며 없으면 빈 배열 <br>
     */
    getComponentsByArea (points) {
        /** @type {Array<ComponentObject>} */
        const searched = [];
        if(!defined(this._app) || !points || points.length < 3) return searched;

        const components = this._componentList ?? [];

        if(!points || points.length < 3) return searched;

        // 위경도 좌표 -> 월드 XZ 폴리곤 좌표
        const area = this.#computeSearchArea(points);    // { polyPoints, polyBox, edges }
        if (!area) return searched;

        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            const box =  component.getBoundingBox();
            if(defined(box) && box.isBox3) {
                // const helper = new THREE.Box3Helper(box, 0xffff00 );
                // this._app._scene.add( helper );
                // 컴포넌트 경계와 검색 영역이 겹치는지 판정하여 결과 목록을 구성한다.
                if (INTERNAL.boundInSearchArea(box, area)) searched.push(component);
            } else if (defined(component.position)) {
                // 경계가 없으면 중심점의 포함 여부로 검색 결과를 구성한다.
                if (INTERNAL.pointInSearchArea(component.position, area)) searched.push(component);
            }
        }
        return searched;
    }

    /**
     * 입력한 점들로 검색 영역 정보(점, 영역박스, 엣지) 을 생성하는 함수
     *
     * @param {Array<GeoPosition>} points
     * @returns {undefined|SearchArea}
     *
     * @ignore
     */
    #computeSearchArea(points){
        if (!points || points.length < 3) return undefined;

        // 검색 영역 폴리곤의 위경도 점을 Vector2 월드 정점으로 전환
        /** @type {Array<import('three').Vector2>} */
        const polyPoints = [];
        for (let i = 0; i < points.length; i++) {
            const world = this._app.geographicToVector3(points[i]);
            polyPoints.push(new THREE.Vector2(world.x, world.y));
        }

        // 빠른 교차 판정을 위한 박스영역 생성 (생략가능)
        const polyBox = new THREE.Box2().setFromPoints(polyPoints);

        // 폴리곤 에지 미리 생성 (나중에 선분 교차 판정에 사용)
        /** @type {Array<Array<import('three').Vector2>>} */
        const polyEdges = [];
        for (let i = 0; i < polyPoints.length; i++) {
            const x = polyPoints[i];
            const y = polyPoints[(i + 1) % polyPoints.length];
            polyEdges.push([ x, y] );
        }
        return { polyPoints, polyBox, polyEdges };
    }


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
    update (drawArg, curTime){
        // app 없으면 조기 탈출
        const app = this._app;
        if(!app) return;

        // 카메라 이동 없으면 조기 탈출
        const isIdle = app.isIdleDraw();

        // 대상 컴포넌트 없으면 조기 탈출
        const components = this.getComponents();
        const componentCount = components.length;
        if (componentCount === 0) return;

        const updateState = this.#updateState;
        const camPos = app.getCameraPosition();
        const camera = app._camera;
        if(!camera) return;


        // 현재 프레임에 처리할 대상을 선택하여 갱신하고 다음 시작 위치를 보관한다.
        INTERNAL.updateComponents(components, updateState, componentCount, camPos, isIdle, curTime);
    }

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
    addPosition (opt) {
        const createOpt = /** @type {ComponentCreateOption} */ (opt ?? {});
        opt = opt ?? {}; // opt 없으면 {}로 초기화
        const self = this;

        // setter와 같은 기준으로 두 값을 모두 검사한 뒤 씬·인스턴스 저장소를 변경합니다.
        // 밝기만 먼저 적용한 뒤 대비에서 실패하여 등록되지 않은 객체나 ID가 남는 것을 방지합니다.
        const brightness = opt.style?.brightness;
        const contrast = opt.style?.contrast;
        for (const value of [brightness, contrast]) {
            if (!defined(value)) continue;
            if (typeof value !== 'number') throw new TypeError('밝기와 대비는 숫자여야 합니다.');
            if (!Number.isFinite(value) || value < 0 || !Number.isFinite(Math.fround(value))) {
                throw new RangeError('밝기와 대비는 Float32로 표현 가능한 0 이상의 유한한 값이어야 합니다.');
            }
        }

        // 필수 모델 레이어 정책상 self._object 를 씬에 추가해주지만,
        // 컴포넌트 레이어에서는 self._object를 씬에 추가하면 원본 모델이 씬에 출력됨. 따라서 제거해줘야함
        self._scene.remove(self._object);

        //컴포넌트 생성
        const component = createComponent.call(this, createOpt);

        if (!defined(component)) {
            __GError__(self, "컴포넌트 생성 중 오류가 발생하였습니다. ", '8599326');
            return undefined;
        }

        // 씬에 추가 , 중복 add 방지
        if (component._setInstanced && defined(component.instanceId)) {
            if (this._instancedObject && !defined(this._instancedObject?.parent))
                this._scene.add(/** @type {any} */(this._instancedObject));
        } else if (defined(component._object) && !defined(component._object.parent)) {
            this._scene.add(component._object);
        }

        // 라벨 설정 및 가시여부 설정
        if (opt.labelVisible) {
            component.setLabel({label: defaultValue(opt.name, component.name)});
            component.showLabel();
        } else {
            component.hideLabel();
        }

        //가시성 성정  (LOD off 일 때만 직접 제어)
        if (defined(opt.visible)) {
            if (opt.visible) component.show();
            else component.hide();
        }

        if (defined(opt.drawPolygon)) {
            if (!defined(opt.movepointlist))
                opt.movepointlist = [];
        }

        if (defined(opt.movepointlist)) {
            self._animation = true;
            if (defined(opt.pitchyawrolllist)) component.addMovePoint(opt.movepointlist, opt.pitchyawrolllist);
            else component.addMovePoint(opt.movepointlist);
        }

        if (defined(opt.pathgeometry)) {
            self._animation = true;
            if (component instanceof U3dComponentPosition) {
                component.addPathGeometry(opt.pathgeometry);
            }
        }

        // 속성 정보 저장
        if (defined(opt.properties)) {
            for (const [key, value] of Object.entries(opt.properties)) {
                component.addProperties(key, value);
            }
        }

        // 스타일 지정
        if (defined(opt.style)) {
            const style = opt.style;
            if (defined(style.color)) component.setColor(style.color);
            if (defined(style.opacity)) component.setOpacity(style.opacity)
            if(defined(style.brightness)) component.setBrightness(style.brightness);
            if(defined(style.contrast)) component.setContrast(style.contrast);
            if(defined(style.saturation)) component.setSaturation(style.saturation);
        }
        // 생성 callback이나 style getter가 바뀌더라도 처음 검증한 값을 적용합니다.
        if (defined(brightness)) component.setBrightness(brightness);
        if (defined(contrast)) component.setContrast(contrast);

        const componentName = component.name;
        if(defined(self._componentMap)) {
            if (!self._componentMap.has(componentName)) {
                self._componentList.push(component);
                self._componentMap.set(componentName, component);

                let lightOpts = opt.lights;
                if (defined(lightOpts)) {
                    for (let i = 0; i < lightOpts.length; i++) {
                        Object.assign(lightOpts[i], {
                            name: componentName + "_light" + (i + 1),
                            drawarg: this._drawArg
                        });
                        const light = new USpotLight(lightOpts[i]);
                        light.resetRotation();
                        component._lightList.push(light);
                        this._app.addLight(light);
                    }
                }
            }
        }


        const playbackState = self._animationPlaybackState;
        if (playbackState === 'playing') {
             component.startMixer?.();

            const animation = component.getAnimationNow?.();
            if (defined(animation)) {
                if (animation.isPaused) {
                    component.moveResume?.();
                } else {
                    component.moveStart?.();
                }
            }
        } else if (playbackState === 'paused') {
            component.stopMixer?.();
            if (defined(component.getAnimationNow?.())) {
                component.movePause?.();
            }
        }

        self.dispatchEvent({type: U3dMultipleComponentLayer.EVENT.CREATE, data: component});

        return component;
    };

    /**
     * 레이어에 배치된 컴포넌트들을 나중에 그대로 되살릴 수 있는 형태로 뽑아내는 메서드입니다. <br>
     * 반환값을 저장해 두었다가 loadWork에 넘기면 같은 배치를 복원할 수 있습니다. <br>
     * 뽑아낼 컴포넌트가 하나도 없으면 save 이벤트도 발생시키지 않고 undefined를 반환합니다.
     *
     * @returns {{component: Array<ComponentSaveDate>} | undefined} 컴포넌트별 저장 데이터를 담은 객체이며 저장할 컴포넌트가 없으면 undefined <br>
     */
    saveWork () {
        const components = this._componentList ?? [];
        if (!components.length) return;

        /** @type {Array<ComponentSaveDate>} */
        const res = [];

        for (const component of components) {
            if (!component?.getModel || !component?.getParam) continue;

            const model = component.getModel();
            if (!defined(model)) continue;

            res.push({
                layer: model.name,
                components: [component.getParam?.()]
            });
        }

        if (res.length === 0) return;

        this.dispatchEvent({ type: 'save', data: { component: res } });

        return { component: res };
    }

    /**
     * saveWork로 저장해 둔 컴포넌트들을 이 레이어에 다시 배치하는 메서드입니다. <br>
     * 같은 이름의 컴포넌트가 이미 있으면 새로 만들지 않고 저장된 계층 정보만 적용합니다. <br>
     * 컴포넌트 하나를 복원할 때마다 load 이벤트가 발생합니다. <br>
     * 저장 데이터의 instanced 값에 따라 레이어의 인스턴스 생성 모드가 함께 바뀝니다.
     *
     * @param {ComponentParam | Array<ComponentParam>} savedData 복원할 컴포넌트 저장 데이터이며 하나만 넘겨도 되고 배열로 여러 개를 넘겨도 됩니다. <br>
     * @returns {Promise<Array<import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition | undefined>>} 복원한 컴포넌트를 입력 순서대로 담은 배열이며 이미 있던 이름 자리는 undefined입니다. <br>
     */
    loadWork (savedData) {
        const self = this;
        const promiseList = /** @type {Array<Promise<import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition | undefined>>} */ ([]);
        const load = (/** @type {ComponentParam} */ savedData_) => {
            // savedData_.geoPosition = savedData_.position;
            // delete savedData_.position;
            // 좌표계 안정화 후 제거
            const savedDataRecord = /** @type {Record<string, any>} */ (savedData_);
            if(defined(savedDataRecord.worldPos)) delete savedDataRecord.worldPos;

            const promise = this.#loadComponent(savedData_);
            promise.then(component=>{
                this.dispatchEvent({type: 'load', data: {object: component, save: savedData_ }});
                if (component) self.#setHierarchyFromSavedData(component, savedData_);
            })

            promiseList.push(promise);
        }

        if(Array.isArray(savedData)) {
            for(const save of savedData) {
                const savedData_ = {...save}
                load(savedData_);
            }
        } else {
            let savedData_ = {...savedData}
            load(savedData_);
        }

        return Promise.all(promiseList);
    }

    async #loadComponent(/** @type {any} */ data) {
        if(data.instanced){
            this.setInstanced(true);
        }else{
            this.setInstanced(false);
        }
        const component = this.getComponentByName(data.name);
        if(!component){
            try {
                return this.addPosition(data);
            } catch (e) {
                const error = /** @type {any} */ (e);
                error._componentName = data.name; // 실패한 컴포넌트 이름을 넣어서 예외처리
                throw error;
            }
        } else {  // 이미 존재함
            const e = /** @type {any} */ (new Error('이미 존재하는 컴포넌트입니다.'));
            e._componentName = data.name; // 실패한 컴포넌트 이름을 넣어서 예외처리
            throw e;
        }
    }

    /**
     * @param {ComponentObject} component
     * @param {any} savedData
     */
    #setHierarchyFromSavedData(component, savedData){
        const self = this;
        if(savedData.parent){
            const parentName = savedData.parent;
            const parent = self.getComponentByName(parentName);
            if(defined(parent)){
                parent.quaternion?.setFromEuler(parent.rotation ?? new THREE.Euler());
                if (parent instanceof U3dComponentPosition) component.setParent(/** @type {U3dComponentPosition} */ (parent));
            }
        }
        if(savedData.children){
            for(const childInfo of savedData.children) {
                const {name, type} = childInfo;
                const child = self.getComponentByName(name);
                if(child){
                    component.setChild(/**@type{any}*/(child));
                }
            }
        }
    }


    /**
     * 전체 컴포넌트에 색상 조정 메서드를 적용합니다.
     * @param {'setBrightness'|'setContrast'|'setSaturation'|'resetColorAdjustment'} methodName 호출할 메서드 이름
     * @param {number} [value] 설정값
     * @returns {boolean} 하나 이상의 컴포넌트에 적용했으면 true
     *
     * @ignore
     */
    #applyColorAdjustmentToComponents(methodName, value){
        const self = this;
        let applied = false;
        for (const component of self._componentList) {
            const target = /** @type {any} */(component);
            if(typeof target[methodName] !== 'function') continue;
            // 기반 구현(U3dComponentPosition)은 반환값이 없고 잘못된 값이면 예외를 던지므로,
            // 호출이 끝나면 적용된 것으로 봅니다. 명시적으로 false 를 돌려주는 구현만 실패로 취급합니다.
            const result = defined(value)
                ? target[methodName](value)
                : target[methodName]();
            if(result !== false) applied = true;
        }
        return applied;
    }

    /**
     * 전체 컴포넌트 중 첫 번째 유효한 색상 조정값을 반환합니다.
     * @param {'getBrightness'|'getContrast'|'getSaturation'} methodName 호출할 메서드 이름
     * @returns {number} 색상 조정값이며 유효한 컴포넌트가 없으면 NaN
     *
     * @ignore
     */
    #getColorAdjustmentFromComponents(methodName){
        const self = this;
        for (const component of self._componentList) {
            const target = /** @type {any} */(component);
            if(typeof target[methodName] !== 'function') continue;
            const value = target[methodName]();
            if(Number.isFinite(value)) return value;
        }
        return NaN;
    }

    /**
     * 전체 컴포넌트의 밝기를 설정합니다.
     * @param {number} [brightness=1] 밝기값
     * @returns {boolean} 하나 이상의 컴포넌트에 적용했으면 true
     */
    setBrightness(brightness = 1){
        if(!Number.isFinite(brightness)) return false;
        return this.#applyColorAdjustmentToComponents('setBrightness', brightness);
    };

    /**
     * 첫 번째 유효한 컴포넌트의 밝기를 반환합니다.
     * @returns {number} 밝기값이며 유효한 컴포넌트가 없으면 NaN
     */
    getBrightness (){
        return this.#getColorAdjustmentFromComponents('getBrightness');
    };

    /**
     * 전체 컴포넌트의 대비를 설정합니다.
     * @param {number} [contrast=1] 대비값
     * @returns {boolean} 하나 이상의 컴포넌트에 적용했으면 true
     */
    setContrast(contrast = 1){
        if(!Number.isFinite(contrast)) return false;
        return this.#applyColorAdjustmentToComponents('setContrast', contrast);
    };

    /**
     * 첫 번째 유효한 컴포넌트의 대비를 반환합니다.
     * @returns {number} 대비값이며 유효한 컴포넌트가 없으면 NaN
     */
    getContrast (){
        return this.#getColorAdjustmentFromComponents('getContrast');
    };

    /**
     * 전체 컴포넌트의 채도를 설정합니다.
     * @param {number} [saturation=1] 채도값
     * @returns {boolean} 하나 이상의 컴포넌트에 적용했으면 true
     */
    setSaturation (saturation = 1){
        if(!Number.isFinite(saturation)) return false;
        return this.#applyColorAdjustmentToComponents('setSaturation', saturation);
    };

    /**
     * 첫 번째 유효한 컴포넌트의 채도를 반환합니다.
     * @returns {number} 채도값이며 유효한 컴포넌트가 없으면 NaN
     */
    getSaturation(){
        return this.#getColorAdjustmentFromComponents('getSaturation');
    };

    /**
     * 전체 컴포넌트의 밝기·대비·채도를 원본 상태로 초기화합니다.
     * @returns {boolean} 하나 이상의 컴포넌트에 적용했으면 true
     */
    resetColorAdjustment(){
        return this.#applyColorAdjustmentToComponents('resetColorAdjustment');
    };

    /**
     * 모델의 크기가 화면에 배치해도 될 범위인지 확인하는 메서드입니다. <br>
     * 배치 전에 비정상적으로 크거나 작은 에셋을 걸러 내는 데 사용합니다.
     *
     * @param {import('three').Object3D} model 크기를 확인할 원본 모델 <br>
     * @returns {boolean} 배치해도 되는 크기이면 true, 아니면 false <br>
     */
    checkObjectSize( model) {
        const size = new THREE.Vector3();
        let valid = true;
        model.traverse(function (/** @type {any} */ child) {
            if (!child.isMesh) return;

            const box = child.getBoundingBox?.();
            if (!box) return;

            box.getSize(size);
            if (size.x <= 1 || size.y <= 1 || size.z <= 1) {
                valid = false;
            }
        });
        return valid;
    }
}

/**
 * @deprecated 이 메서드는 더 이상 사용하지 않으므로 getComponents 메서드를 사용하십시오.
 */
U3dMultipleComponentLayer.prototype.getPositionList = function () {
    let self = this;
    console.info(" layer.getPositionList will be removed. please use layer.getComponentList")
    return self.getComponents();
};

/**
 * 레이어의 컴포넌트들이 등록된 경로를 따라 주행하는 메서드입니다. <br>
 * 일시정지해 둔 컴포넌트는 멈춘 지점부터 이어서 달리고, 그 밖에는 경로의 처음부터 주행합니다. <br>
 * 레이어의 재생 상태가 주행 중으로 바뀌므로 이후에 배치하는 컴포넌트도 배치와 동시에 주행을 시작합니다. <br>
 * 경로가 없는 컴포넌트를 만나면 그 자리에서 순회를 멈추므로 목록에서 그 뒤에 있는 컴포넌트는 주행하지 않습니다. <br>
 * 모델 파일에 들어 있는 프로펠러 회전 같은 클립 애니메이션은 이 메서드가 다루지 않습니다.
 */
U3dMultipleComponentLayer.prototype.startAnimation = function () {
    const self = this;
    self._animationPlaybackState = 'playing';

    for (let i = 0; i < self._componentList.length; i++) {
        const component = self._componentList[i];
        // 주행 애니메이션
        const animation = component.getAnimationNow();
        if(!defined(animation)) return;

        if (animation.isPaused) {
            component.moveResume();
        } else {
            component.moveStart();
        }

    }
};


/**
 * 전체 컴포넌트의 내장 애니메이션 클립 재생을 정지하는 메서드입니다.<br>
 * 프로펠러 회전, 걷기 동작처럼 3D 에셋 파일 자체에 포함된 클립 애니메이션을 멈춥니다.
 */
U3dMultipleComponentLayer.prototype.stopMixers = function () {
    const self = this;
    for (let i = 0; i < self._componentList.length; i++) {
        const component = self._componentList[i];
        component.stopMixer();
    }
};

/**
 * 전체 컴포넌트의 내장 애니메이션 클립 재생을 시작하는 메서드입니다.<br>
 * 프로펠러 회전, 걷기 동작처럼 3D 에셋 파일 자체에 포함된 클립 애니메이션을 시작합니다.
 */
U3dMultipleComponentLayer.prototype.startMixers = function () {
    const self = this;
    for (let i = 0; i < self._componentList.length; i++) {
        const component = self._componentList[i];
        component.startMixer();
    }
};

/**

/**
 * 레이어의 모든 컴포넌트를 경로 주행에서 멈춰 세우는 메서드입니다. <br>
 * 진행 상황이 초기화되므로 다시 시작하면 경로의 처음부터 주행합니다. <br>
 * 레이어의 재생 상태가 정지로 바뀌므로 이후에 배치하는 컴포넌트도 멈춘 채 놓입니다. <br>
 * 모델 파일에 들어 있는 클립 애니메이션은 이 메서드가 다루지 않습니다.
 */
U3dMultipleComponentLayer.prototype.stopAnimation = function () {
    const self = this;
    self._animationPlaybackState = 'stopped';

    for (let i = 0; i < self._componentList.length; i++) {
        const component = self._componentList[i];
        component.moveStop();
    }
};

/**
 * 레이어의 모든 컴포넌트를 현재 위치에서 잠시 멈추는 메서드입니다. <br>
 * 진행 상황이 남아 있어 startAnimation을 호출하면 멈춘 지점부터 이어서 달립니다. <br>
 * 레이어의 재생 상태가 일시정지로 바뀌므로 이후에 배치하는 컴포넌트도 멈춘 채 놓입니다. <br>
 * 모델 파일에 들어 있는 클립 애니메이션은 이 메서드가 다루지 않습니다.
 */
U3dMultipleComponentLayer.prototype.pauseAnimation = function () {
    const self = this;
    self._animationPlaybackState = 'paused';

    for (let i = 0; i < self._componentList.length; i++) {
        const component = self._componentList[i];
        component.movePause();
    }
};

/**
 * 레이어의 모든 컴포넌트를 경로의 처음으로 되돌린 뒤 다시 주행하게 하는 메서드입니다. <br>
 * 멈춰 있든 주행 중이든 상관없이 진행 상황을 지우고 출발점부터 시작합니다. <br>
 * 멈춘 지점부터 이어서 주행하려면 이 메서드 대신 startAnimation을 사용하십시오. <br>
 * 레이어의 재생 상태가 주행 중으로 바뀌므로 이후에 배치하는 컴포넌트도 배치와 동시에 주행하기 시작합니다.
 */
U3dMultipleComponentLayer.prototype.restartAnimation = function () {
    const self = this;
    self._animationPlaybackState = 'playing';

    for (let i = 0; i < self._componentList.length; i++) {
        const component = self._componentList[i];
        component.restart();
    }
};

/**
 * 특정 컴포넌트 하나만 화면에 나타내는 메서드입니다. <br>
 * 레이어 전체의 가시성은 그대로 두고 넘겨받은 컴포넌트만 다시 보이게 합니다.
 *
 * @param {ComponentObject} component 나타낼 컴포넌트이며 인스턴스 컴포넌트도 넘길 수 있습니다. <br>
 * @returns {Promise<void>} 표시를 마치면 값 없이 완료되고 컴포넌트를 넣지 않으면 거부되는 Promise <br>
 */
U3dMultipleComponentLayer.prototype.showComponent = function (component) {
    /** @type {DeferredObject<void>} */
    let promise = deferred();
    if(!defined(component)) return promise.reject();

    component.show()?.then(function () {
        promise.resolve();
    }).catch(function () {
        promise.reject();
    });
    return promise;
};

/**
 * 특정 컴포넌트 하나만 화면에서 감추는 메서드입니다. <br>
 * 레이어에서 제거하지는 않으므로 showComponent로 다시 나타낼 수 있습니다.
 *
 * @param {ComponentObject} component 감출 컴포넌트이며 인스턴스 컴포넌트도 넘길 수 있습니다. <br>
 * @returns {Promise<void>} 숨김을 마치면 값 없이 완료되고, 컴포넌트를 넣지 않으면 거부되는 Promise <br>
 */
U3dMultipleComponentLayer.prototype.hideComponent = function (component) {
    /** @type {DeferredObject<void>} */
    let promise = deferred();
    if(!defined(component)) return promise.reject();
    component.hide()?.then(function () {
        promise.resolve();
    }).catch(function () {
        promise.reject();
    });
    return promise;
};

/**
 * 이전에 생성된 컴포넌트를 반환하는 메서드입니다. <br>
 * 이전에 생성된 컴포넌트가 존재하지 않으면 undefined를 반환합니다.
 *
 * @returns {{position: ComponentObject, needClear: boolean} | undefined} {position: component} 대상 반환
 *
 * @ignore
 */
U3dMultipleComponentLayer.prototype.getRenderPosition = function () {
    const self = this;
    if(!defined(self._componentList) || self._componentList.length  ===0 ) return undefined;

    if (self._componentList.length > 1 && defined(self._renderIndex)) {
        if (self._renderIndex < self._componentList.length - 1) {
            self._renderIndex += 1;
            return {position: self._componentList[self._renderIndex], needClear: false};
        } else if (self._renderIndex === self._componentList.length - 1) {
            self._renderIndex = 0;
            return {position: self._componentList[self._renderIndex], needClear: true};
        }
    } else
        return {position: self._componentList[0], needClear: true};

    return undefined;
};

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
U3dMultipleComponentLayer.prototype.loadModel = function (modelInfo) {
    let self = this;
    /** @type {DeferredObject<void | ModelObject3D>} */
    let promise = deferred();
    if (modelInfo) {
        self.load(modelInfo).then((object) => {
            promise.resolve(object);
        }, (error) => {
            // 지원하지 않는 확장자, 잘못된 경로, 네트워크 오류 등 로드 실패를 호출자에게 전달합니다.
            promise.reject(error);
        });
    } else {
        U3dModelBasicLayer.prototype.reLoad.call(this).then(function () {
            promise.resolve();
        });
    }

    return promise;
}


/**
 * 컴포넌트 레이어의 bounding box(경계영역)를 출력하는 메서드입니다.
 *
 * @override
 *
 * @returns {import('three').Box3} bounding Box 반환
 *
 * @ignore
 */
U3dMultipleComponentLayer.prototype.getBoundingBox = function () {
    let self = this;

    if (self._componentList.length === 0) {
        return new THREE.Box3();
    }
    const resultBox = new THREE.Box3();
    const componentList = self.getComponents();
    // instancedMesh를 포함하게 되면 정상적으로 나오지 않아 new THREE.Box3().setFromObject(self._scene) 에서 변경
    for (let i = 0; i < componentList.length; i++) {
        const component = componentList[i];
        const bbox = component.getBoundingBox();
        resultBox.union(bbox);
    }

    return resultBox;

}

/**
 * @deprecated 이 메서드는 더 이상 사용하지 않으므로 addPosition 메서드를 사용하십시오.
 *
 * @param {any} opt
 *
 * @ignore
 */
U3dMultipleComponentLayer.prototype.addComponent = function (opt) {
    this.addPosition(opt);
    return;

    let self = this;

    if(!defined(opt.drawPolygon) && !defined(opt.movepointlist)) {
        __GInfo__(this, "군중 컴포넌트 추가시 drawPolygon 또는 movepointlist 옵션 둘 중 하나는 필수 입력 값입니다. 정적인 컴포넌트를 생성하려면 addPosition 함수를 사용하세요.", "1924415");
        return
    }

    self._scene.remove(self._object);

    let obj = new UGroup();
    opt.mixers = [];
    componentSetting.call(self, opt, obj);

    /** @type {ComponentObject | undefined} */
    let component;
    const info = /** @type {any} */ ( self._instancedInfo?.get(obj.name));
    if (!defined(info)) return;
    const idx = info.lastIndex ?? (info.size - 1);
    UDEF.createPromise((/** @type {any} */ resolve) => {
        opt = Object.assign(opt, {
            drawarg: this._drawArg,
            layer: this,
            componentlayer: this,
            type: 'model',
            object: obj,
            layerScale: this._scale,
            layerRotation: this._rotation
        })
        opt.position = parseVector3(opt.position);
        if (opt.instanced) {
            if (info) {
                opt = setInstancedProperty.call(self, opt, obj.name);
                opt.type = COMPONENT_TYPE.CROWD;
                opt.instanceId = idx;
                opt.instancedMaxCount = self._instancedMaxCount;
                component = new U3dComponentInstancedPosition(opt);
            }
        } else {
            component = new U3dComponentPosition(opt);
        }
        resolve(true);
    }).then((/** @type {boolean} */ resolve) => {
        if (resolve && defined(component)) {
            if (component._setInstanced && defined(component.instanceId)) {
                if (defined(self._instancedObject)) self._scene.add(/** @type {import('three').Object3D} */ (/** @type {unknown} */ (self._instancedObject)));
            } else if(component._object) {
                self._scene.add(component._object);
            }

            if (opt.labelVisible) {
                component.setLabel({label: defaultValue(opt.name, component.name)});
                component.showLabel();
            } else
                component.hideLabel();

            if (defined(opt.visible)) {
                if (opt.visible)
                    component.show();
                else
                    component.hide();
            }

            if (defined(opt.drawPolygon)) {
                if(!defined(opt.movepointlist))
                    opt.movepointlist = [];
            }

            if (defined(opt.movepointlist)) {
                self._animation = true;
                component.addMovePoint(opt.movepointlist);
            }

            self._componentList.push(component);
            self.dispatchEvent({type: U3dMultipleComponentLayer.EVENT.CREATE, data: component});

            return component;
        }
        return undefined;
    });
}

/**
 * @deprecated 이 메서드는 더 이상 사용하지 않으므로 removeAllComponent 메서드를 사용하십시오.
 */
U3dMultipleComponentLayer.prototype.removeAllPosition = function () {
    let self = this;
    __GInfo__(self, "removeAllPosition API 는 removeAllComponent API 로 변경되었습니다.", '7113515');
    self.removeAllComponent();
};

/**
 * @deprecated 이 메서드는 더 이상 사용하지 않으므로 removeComponentByName 메서드를 사용하십시오.
 *
 * @param {string} name 제거하려는 컴포넌트 이름
 */
U3dMultipleComponentLayer.prototype.removePositionByName = function (name) {
    let self = this;
    __GInfo__(self, "removePositionByName API 는 removeComponentByName API 로 변경되었습니다.", '1716228');
    self.removeComponentByName(name);
};

/**
 * @deprecated 이 메서드는 더 이상 사용하지 않으므로 removeComponentByName 메서드를 사용하십시오.
 *
 * @param {ComponentObject} selected
 */
U3dMultipleComponentLayer.prototype.removePosition = function (selected) {
    let self = this;
    self.removeComponent(selected);
};

/**
 * 레이어에 배치된 컴포넌트를 모두 제거하는 메서드입니다. <br>
 * 각 컴포넌트가 쓰던 메시와 인스턴스 정보, 경계영역 보관값까지 함께 정리합니다. <br>
 * 레이어 자체는 남으므로 이어서 addPosition으로 다시 배치할 수 있습니다.
 */
U3dMultipleComponentLayer.prototype.removeAllComponent = function () {
    let self = this;
    let info = /** @type {InstancedInfoStore} */ (self._instancedInfo ?? new Map());
    for (let i = 0; i < this._componentList.length; i++) {
        const position = this._componentList[i];
        let name = position._object?.name;
        const instancedInfo = name ? info.get(name) : undefined;
        if (name && instancedInfo) {
            instancedInfo.clear();
            info.delete(name)
        }
        const cacheMeshList = /** @type {CacheMeshMap} */ (self._cacheMeshList);
        Object.keys(cacheMeshList).forEach(function (key) {
            let mesh = cacheMeshList[key];

            if (mesh && mesh.clearInstances) {
                mesh.clearInstances();
                if (mesh.instances) mesh.instances = undefined;
            }

            if (mesh._objectName === name) {
                UDEF.disposeObject3D(mesh);
                if (mesh.parent)
                    mesh.parent.remove(mesh);
                delete cacheMeshList[key];
            }
        })

        position.dispose();
    }
    if (self._instancedObject && self._instancedObject.children.length > 0) {
        self._instancedObject.children.forEach(function (instancedGroup) {
            UDEF.disposeObject3D(instancedGroup);
            if (instancedGroup.parent)
                instancedGroup.parent.remove(instancedGroup);
        })
        self._instancedObject = new UGroup();
    }

    this._componentList = [];
    this._componentMap = new Map();
    if (self._bboxMap) self._bboxMap.clear();

};

/**
 * 이름이 일치하는 컴포넌트를 레이어에서 제거하는 메서드입니다. <br>
 * 제거한 컴포넌트가 쓰던 메시와 인스턴스 정보도 함께 정리합니다. <br>
 * 이름이 일치하는 컴포넌트가 없으면 아무 작업도 하지 않습니다.
 *
 * @param {string} name 제거할 컴포넌트 이름 <br>
 */
U3dMultipleComponentLayer.prototype.removeComponentByName = function (name) {
    let self = this;
    if (self._componentList.length === 0) return;

    if (defined(name)) {
        self._componentMap?.delete(name);
        let idx = findPositionIdx.call(this, name);
        if (idx >= 0) {
            let position = this._componentList[idx];
            removeComponent.call(self, position);
        }
    } else {
        let idx = this._componentList.length - 1;
        let position = this._componentList[idx];
        removeComponent.call(self, position);
    }
};


/**
 * 넘겨받은 컴포넌트를 레이어에서 제거하는 메서드입니다. <br>
 * 제거한 컴포넌트가 쓰던 메시와 인스턴스 정보도 함께 정리합니다. <br>
 * 이 레이어에 없는 컴포넌트를 넘기면 아무 작업도 하지 않습니다.
 *
 * @param {ComponentObject} selected 제거할 컴포넌트이며 getComponents나 getComponentByName으로 얻은 값을 넘기십시오. <br>
 */
U3dMultipleComponentLayer.prototype.removeComponent = function (selected) {
    let self = this;
    if (self._componentList.length === 0) return;
    if (defined(selected)) {
        self.removeComponentByName(selected.name ?? selected.id);
    } else {
        console.error("selected is undefined!!")
    }
};

/**
 * 컴포넌트 중복 여부를 검사하는 메서드입니다. <br>
 * 이미 존재하는 컴포넌트인 경우 true를, 존재하지 않으면 false를 반환합니다.
 *
 * @param {ComponentObject} component 검사할 컴포넌트.
 * @returns {boolean} true면 중복, false면 중복이 아닙니다.
 *
 * @ignore
 */
U3dMultipleComponentLayer.prototype.checkIsExistPosition = function (component) {
    let position = component.position;
    if(!defined(position)) return false;

    let vector = new THREE.Vector3(position.x, position.y, position.z);

    for (let i = 0; i < this._componentList.length; i++) {
        const component = this._componentList[i];
        if (component && component.position?.equals(vector))
            return true;
    }
    return false;
}


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
U3dMultipleComponentLayer.prototype.changeObject = function (id, option) {
    if (!id || !option) return;
    let self = this;
    const changeOption = /** @type {any} */ (option);
    for (let component of self._componentList) {
        if (id === component.id) {
            let model = self._object.children.find(function (child) {
                return child.name === changeOption.object
            });
            if(!defined(model)) continue;

            if(!component._object) return;
            let preObject = component._object;
            if(!defined(preObject)) continue;

            if (component instanceof U3dComponentInstancedPosition) {
                let preObjectName = preObject.name;
                if (preObjectName === model.name) return;

                // animation 모델의 렌더 구조를 얻는다. 원본 또는 cache 참조가 반환될 수 있다.
                let copy = INTERNAL.changeMeshToSkinnedMesh(self, model)
                let modelName = model.name;
                if (!changeOption.position) {
                    changeOption.position = preObject.position.clone();
                }
                changeOption.name = component.name;
                let info = /** @type {InstancedComponentInfo} */ (addInstancedInfo.call(self, modelName, /** @type {any} */ (changeOption)));
                const instancedComponent = /** @type {any} */ (component);
                instancedComponent._initPosition = info.position.clone();
                instancedComponent._initRotation = info.rotation.clone();
                instancedComponent._initScale = info.scale.clone();

                component._bbox = new UBox3().setFromObject(model);
                const center = changeOption.position;
                component._bbox.setFromCenterAndSize(center, info.scale);
                component._object.position.copy(preObject.position.clone());

                info.mixers = [];
                let instancedGroup = createInstancedMesh.call(self, copy, info, component._object);
                removeInstancedInfoAtComponent.call(self, component);

                const info_ = /** @type {InstancedInfo | undefined} */ (/** @type {InstancedInfoStore | undefined} */ (self._instancedInfo)?.get(modelName));
                component.instanceId = info_ ? info_.lastIndex ?? info_.size - 1 : 0;
                if(component._object)
                    component._object.name = modelName;

                if (info.rotation) {
                    const rotation = info.rotation;
                    component.rotation?.set(
                        rotation.x * Math.PI / 180,
                        rotation.y * Math.PI / 180,
                        rotation.z * Math.PI / 180);
                }
                component._object.rotation.copy(component.rotation);

                if (option.scale) {
                    component.scale?.set(option.scale.x, option.scale.y, option.scale.z);
                }
                component._object.scale.copy(component.scale);
                setInstancedProperty.call(self, component, modelName);
                component.setBrightness(component.getBrightness());

                const instancedObject = self._instancedObject;
                if (defined(instancedObject) && self._scene.children.indexOf(/** @type {import('three').Object3D} */ (/** @type {unknown} */ (instancedObject))) === -1)
                    self._scene.add(/** @type {import('three').Object3D} */ (/** @type {unknown} */ (instancedObject)));
                break;
            } else {
                let copy = self.skClone(model);
                copy.type = "component";
                let obj = new UGroup();
                obj.add(copy);
                obj.name = copy.name;
                copy.mixer = new THREE.AnimationMixer(copy);
                component.setMixers([copy.mixer]);


                for (let child of obj.children) {
                    if (defined(child.position)) {
                        child.position.set(0, 0, 0);
                    }
                }
                if (option.scale) {
                    component.scale?.set(option.scale.x, option.scale.y, option.scale.z);
                }
                if (defined(component.scale)) obj.scale.copy(component.scale);

                if (option.rotation) {
                    component.rotation?.set(
                        option.rotation.x * Math.PI / 180,
                        option.rotation.y * Math.PI / 180,
                        option.rotation.z * Math.PI / 180);
                }
                obj.rotation.copy(component.rotation ? component.rotation : new THREE.Euler());
                obj.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        const mesh = /** @type {any} */ (child);
                        mesh._bbox = component._bbox;
                        mesh.getBBox = component.getBoundingBox;
                        mesh._utype = UDEF.UMESH_TYPE._component;
                        mesh._rootObject = component._object;
                    }
                    /** @type {LayerObject3D} */ (child)._ulayername = self._name;
                });

                if (obj.children.length < component._object.children.length) {
                    for (let child of component._object.children) {
                        if (child.name !== obj.name && child.type !== "component") {
                            obj.add(child);
                        }
                    }
                }

                component._object = /** @type {RotatableGroup} */ (/** @type {unknown} */ (obj));
                component._object.position.copy(preObject.position);
                component.setBrightness(component.getBrightness());
                component._bbox = new UBox3().setFromObject(component._object);

                self._scene.remove(preObject)
                UDEF.disposeObject3D(preObject);
                self._scene.add(component._object);
                break;
            }

        }
    }

}

/**
 *
 * @override
 *
 * @ignore
 */
U3dMultipleComponentLayer.prototype.getMetaData = function () {
    const self = this;
    const meta = U3dModelBasicLayer.prototype.getMetaData.call(this);
    if (!defined(meta)) return undefined;

    self._componentList.forEach(function (v) {
        const m = self.createMeta('position');
        m.attribute = v.position;
        meta.addChild(m);
    });

    return meta;
};

/**
 * 레이어에 배치된 모든 컴포넌트의 이름표(라벨)를 화면에 표시하는 메서드입니다. <br>
 * 이미 표시 중이면 아무 작업도 하지 않고 곧바로 끝납니다. <br>
 * 호출 시점의 컴포넌트에만 적용되며, 이후 배치하는 컴포넌트의 이름표 표시는 배치 옵션이 결정합니다.
 *
 * @returns {Promise<boolean>} 처리가 끝나면 항상 true로 완료되는 Promise <br>
 */
U3dMultipleComponentLayer.prototype.showLabel = function () {
    /** @type {DeferredObject<boolean>} */
    const promise = deferred();
    if( this.labelVisible ) { // 이미 show면 조기 탈출
        promise.resolve(true);
        return promise;
    }

    const components = this._componentList ?? [];
    for(let component of components) {
        component.showLabel();
    }
    this.labelVisible = true;
    promise.resolve(true);
    return promise;
}

/**
 * 레이어에 배치된 모든 컴포넌트의 이름표(라벨)를 화면에서 숨기는 메서드입니다. <br>
 * 이미 숨겨져 있으면 아무 작업도 하지 않고 곧바로 끝납니다. <br>
 * 이름표는 지워지지 않으므로 showLabel로 다시 표시할 수 있습니다.
 *
 * @returns {Promise<boolean>} 처리가 끝나면 항상 true로 완료되는 Promise <br>
 */
U3dMultipleComponentLayer.prototype.hideLabel = function () {
    /** @type {DeferredObject<boolean>} */
    let promise = deferred();
    const self = this;
    if(!this.labelVisible) { // 이미 hide면 조기 탈출
        promise.resolve(true);
        return promise;
    }

    this.labelVisible = false;
    for (let i = 0; i < self._componentList.length; i++) {
        if (!defined(self._componentList[i].poi))
            promise.resolve(false);
        else {
            self._componentList[i].hideLabel();
            promise.resolve(true);
        }
    }
    return promise;
};

/**
 * 레이어에 배치된 컴포넌트의 이름표(라벨)를 지우는 메서드입니다. <br>
 * 숨기는 것이 아니라 이름표 자체를 없애므로 다시 보이게 하려면 이름표를 새로 만들어야 합니다. <br>
 * 컴포넌트를 순서대로 훑다가 이름표가 없는 컴포넌트를 만나면 거기서 중단하므로 그 뒤 컴포넌트의 이름표는 남습니다.
 *
 * @returns {Promise<boolean>} 이름표를 하나라도 지우면 true로 완료되고, 첫 컴포넌트부터 이름표가 없으면 값 없이 거부되는 Promise <br>
 */
U3dMultipleComponentLayer.prototype.removeLabel = function () {
    /** @type {DeferredObject<boolean>} */
    let promise = deferred();
    const self = this;
    for (let i = 0; i < self._componentList.length; i++) {
        if (!defined(self._componentList[i].poi)) {
            promise.reject();
            return promise
        } else {
            self._componentList[i].removeLabel();
            promise.resolve(true);
        }
    }
    return promise;
};

/**
 * 씬에 등록되에 화면에 출력되고 있는 컴포넌트 mesh를 이름으로 검색하여 리턴하는 메서드입니다.
 *
 * @param {string} name 모델 데이터 이름
 * @returns {import('three').Object3D | undefined} 컴포넌트 mesh
 *
 * @ignore
 */
U3dMultipleComponentLayer.prototype.getLoadedModel = function (name) {
    return this._object.children.find(function (object) {
        return (object.name === name);
    });
}

/**
 * 이름으로 등록된 컴포넌트의 알파맵 속성을 제거하는 메서드입니다. <br><br>
 * [용어] <br>
 * 알파맵(alphaMap) - 표면 전체의 불투명도를 제어하는 회색조 텍스처
 *
 * @param {string} name 컴포넌트 이름
 */
U3dMultipleComponentLayer.prototype.removeModelAlphaMap = function (name) {
    const self = this;
    /** @type {Array<any>} */
    let objectList;
    if (self._objectList.length === 0)
        objectList = self._object.children;
    else
        objectList = self._objectList;

    for (let i = 0; i < objectList.length; i++) {
        if (objectList[i].name === name)
            objectList[i].removeAlphaMap();
    }
}

/**
 * 이름으로 등록된 컴포넌트의 알파맵 속성을 원본으로 되돌리는 메서드입니다.<br><br>
 * [용어] <br>
 * 알파맵(alphaMap) - 표면 전체의 불투명도를 제어하는 회색조 텍스처
 *
 * @param {string} name 컴포넌트 이름
 */
U3dMultipleComponentLayer.prototype.resetModelAlphaMap = function (name) {
    const self = this;
    /** @type {Array<any>} */
    let objectList;
    if (self._objectList.length === 0)
        objectList = self._object.children;
    else
        objectList = self._objectList;

    for (let i = 0; i < objectList.length; i++) {
        if (objectList[i].name === name)
            objectList[i].resetAlphaMap();
    }
}

/**
 * 이름이 같은 3D 에셋에 알파 테스트(alpha test) 기준값을 설정하는 메서드입니다. <br>
 * 알파 테스트란 픽셀의 불투명도가 기준값보다 낮으면 그 픽셀을 아예 그리지 않는 처리입니다. <br>
 * 나뭇잎이나 울타리처럼 투명한 부분이 많은 텍스처에서 반투명 경계를 깔끔하게 잘라낼 때 사용합니다. <br>
 * 이름이 일치하는 에셋이 없으면 아무 작업도 하지 않습니다.
 *
 * @param {string} name 기준값을 적용할 3D 에셋 이름 <br>
 * @param {number} alphaFilter 픽셀을 그릴지 판단하는 불투명도 기준값이며 0 이상 1 이하로 지정하고, 0이면 모두 그리고 값이 클수록 더 많은 픽셀이 지워집니다. <br>
 */
U3dMultipleComponentLayer.prototype.setModelAlphaTest = function (name, alphaFilter) {
    const self = this;
    /** @type {Array<any>} */
    let objectList;
    if (self._objectList.length === 0)
        objectList = self._object.children;
    else
        objectList = self._objectList;

    for (let i = 0; i < objectList.length; i++) {
        if (objectList[i].name === name)
            objectList[i].setAlphaTest(alphaFilter);
    }
}

/**
 * 이 레이어에 앞으로 배치할 컴포넌트가 사용할 기본 크기 배율을 정하는 메서드입니다. <br>
 * 값은 레이어에 보관되었다가 다음에 만들어지는 컴포넌트의 기본 크기로 전달됩니다. <br>
 * 이미 배치된 컴포넌트의 크기는 바뀌지 않으므로 화면에 있는 컴포넌트를 키우거나 줄이려면 그 컴포넌트에 직접 크기를 지정하십시오. <br>
 * 숫자도 객체도 아닌 값을 넣으면 아무 변화도 없습니다.
 *
 * @param {import('three').Vector3Like|number} scale 적용할 크기 배율이며 1이 원본 크기이고, `{x, y, z}` 형태로 넣으면 축마다 다른 배율을 숫자 하나로 넣으면 세 축에 같은 배율을 지정합니다. <br>
 */
U3dMultipleComponentLayer.prototype.setScale = function (scale) {
    if (scale instanceof Object) {
        this._scale.x = scale.x;
        this._scale.y = scale.y;
        this._scale.z = scale.z;
    } else if (typeof scale === 'number') {
        this._scale.x = this._scale.y = this._scale.z = scale;
    }
};

/**
 * 이 레이어에 앞으로 배치할 컴포넌트가 사용할 기본 회전을 정하는 메서드입니다. <br>
 * 값은 레이어에 보관되었다가 회전을 따로 지정하지 않은 컴포넌트의 기본 회전으로만 전달됩니다. <br>
 * 이미 배치된 컴포넌트는 돌아가지 않으므로 화면에 있는 컴포넌트를 돌리려면 그 컴포넌트에 직접 회전을 지정하십시오. <br>
 * degree가 허용 범위를 벗어나면 예외가 발생하고 보관값은 그대로 유지됩니다.
 *
 * @param {number} degree 회전할 각도이며 도(°) 단위로 -360 이상 360 이하만 허용합니다. <br>
 * @param {import('three').Vector3Like} [axis] 회전의 중심이 되는 축이며 `{x: 1, y: 0, z: 0}`은 x축을 중심으로 돌린다는 뜻이고, 넣지 않으면 월드 z축 `{x: 0, y: 0, z: 1}`을 사용합니다. <br>
 */
U3dMultipleComponentLayer.prototype.setRotation = function (degree, axis) {
    if (degree < -360 || degree > 360) {
        throw new Error('\'degree\' :' + degree + ' out of range -360 ≤ degree ≤ 360');
    }

    if (!defined(axis)) axis = ROTATE_AXIS;

    const q = new THREE.Quaternion();
    let radian = (Math.PI / 180) * degree;
    q.setFromAxisAngle(axis, radian);
    const euler = new THREE.Euler();
    euler.setFromQuaternion(q);
    this._rotation = euler;
};

/**
 * 카메라가 특정 컴포넌트를 따라다니도록 설정하는 메서드입니다. <br>
 * 주행 중인 차량이나 비행체를 화면 중심에 두고 지정한 시점으로 계속 비추는 데 사용합니다. <br>
 * 대상 컴포넌트에는 opt의 active, view, offset, targetOffset을 그대로 적용합니다. <br>
 * 대상이 아닌 나머지 컴포넌트에는 active의 반대값을 전달하므로, active가 false이면 나머지 컴포넌트의 추적이 모두 켜집니다. <br>
 * 추적을 끄려면 active를 false로 넣기보다 추적을 유지할 컴포넌트를 대상으로 지정해 호출하는 편이 결과를 예측하기 쉽습니다.
 *
 * @param {CameraViewOption} opt 따라갈 대상 컴포넌트와 시점 종류, 추적 사용 여부, 카메라 위치·시선 보정값을 담은 옵션 <br>
 */
U3dMultipleComponentLayer.prototype.setCameraTrace = function (opt) {
    const self = this;
    const componentList = self._componentList;
    for (let i = 0; i < componentList.length; i++) {
        let component = componentList[i];
        if (component.name !== opt.component.name) {
            component.setCameraTrace(!opt.active);
        }
    }
    opt.component.setCameraTrace(opt.active, opt.view, opt.offset, opt.targetOffset);
};

/**
 * 컴포넌트를 배치할 때 기준으로 삼을 헬퍼 위치를 레이어에 보관하는 메서드입니다. <br>
 * 화면에서 고른 지점을 기억해 두었다가 다음 배치 위치로 쓰는 용도입니다. <br>
 * position을 넣지 않으면 보관된 값을 그대로 유지합니다.
 *
 * @param {WorldPositionVector3} [position] 보관할 위치이며 월드 좌표(EPSG:3857, 단위 m)입니다. <br>
 */
U3dMultipleComponentLayer.prototype.setHelperPosition = function (position) {
    if(!defined(position)) return;

    this._helperPosition = position;
};

/**
 * @todo 동작확인 필요
 * raycaster와 교차된 컴포넌트를 찾아 반환하는 함수
 * @param {Event & {normalizedX: number, normalizedY: number}} event 사용자 이벤트 (마우스 클릭 등)
 * @param {import('@union3d/core/URaycaster').URaycaster } raycaster raycaster
 * @returns {ComponentObject | undefined} component 교차된 컴포넌트
 *
 * @ignore
 */
U3dMultipleComponentLayer.prototype.getIntersect = function (event, raycaster) {
    const self = this;
    if (!defined(event)) return undefined;

    if (!defined(raycaster)) {
        const camera = self._drawArg.getCamera();
        if (!defined(camera)) return undefined;

        raycaster = new URaycaster();
        raycaster.setFromCamera(new THREE.Vector2(event.normalizedX, event.normalizedY), camera);
    }

    const components = self._componentList;
    let intersectList = [];
    for (let i = 0; i < components.length; i++) {
        let component = components[i];
        if (component._show) {
            let object = component._object;
            if (component._setInstanced && defined(component.instanceId)) {
                const instancedComponent = /** @type {U3dComponentInstancedPosition} */ (component);
                let object_ = instancedComponent.instancedGroup;
                if (defined(object_)) {
                    object = object_;
                } else {
                    continue;
                }
            }
            const intersects = raycaster.intersectObject(/**@type{import('three').Object3D}*/(object));
            if (intersects.length !== 0) {
                component.distance = intersects[0].distance;
                // 일반 컴포넌트일 때
                if (!component._setInstanced || !defined(component.instanceId)) {
                    intersectList.push(component)
                } else {  // 인스턴스 컴포넌트일 때
                    if (defined(intersects[0].instanceId)) {
                        let object = /** @type {any} */ (intersects[0].object);
                        if (!defined(object._groupIndex)) continue;
                        let instanceId = object._groupIndex * self._instancedMaxCount + intersects[0].instanceId
                        let find = components.find(function (child) {
                            const instancedChild = /** @type {U3dComponentInstancedPosition} */ (child);
                            return child.instanceId === instanceId
                                && object._objectName === child._object?.name
                                && object._groupIndex === instancedChild.groupIndex
                        })
                        if (find) {
                            return find;
                        }
                    }
                }
            }
        }
    }
    if (intersectList.length > 0) {
        intersectList.sort(function (a, b) {
            return a.distance - b.distance;
        })
        return intersectList[0]
    }
    return undefined;
};

/**
 * [addInstancedInfo] instance info를 레이어에 추가 하는 함수<br>
 * 해당 정보를 참고하여 instance mesh를 생성하고 수정합니다.
 *
 * @this {U3dMultipleComponentLayer}
 *
 * @param {string}name instance 모델 이름
 * @param {InstancedInputOption} opt instance info (position, rotation, scale 등의 속성을 담고 있는 옵션)
 */
function addInstancedInfo(name, opt) {
    let self = this;
    const instancedOpt = /** @type {InstancedInputOption} */ (opt);
    let info = /** @type {InstancedInfoStore} */ (self._instancedInfo ?? new Map());
    const position = new THREE.Vector3();
    const euler = new THREE.Euler();
    const scale = new THREE.Vector3(1,1,1);
    if (!defined(info)) info = new Map();
    if (!defined(info.get(name))) {
        info.set(name, new Map());
    }

    if (defined(instancedOpt.position)) {
        position.set(instancedOpt.position.x, instancedOpt.position.y, instancedOpt.position.z);
    }
    if (defined(instancedOpt.rotation)) {
        euler.set(instancedOpt.rotation.x, instancedOpt.rotation.y, instancedOpt.rotation.z);
    }
    if (instancedOpt.rotation && Math.abs(instancedOpt.rotation.x) > Math.PI) {
        euler.x = UDEF.DegreesToRadians(instancedOpt.rotation.x);
    }
    if (instancedOpt.rotation && Math.abs(instancedOpt.rotation.y) > Math.PI) {
        euler.y = UDEF.DegreesToRadians(instancedOpt.rotation.y);
    }
    if (instancedOpt.rotation && Math.abs(instancedOpt.rotation.z) > Math.PI) {
        euler.z = UDEF.DegreesToRadians(instancedOpt.rotation.z);
    }

    if (defined(instancedOpt.scale)) {
        scale.set(instancedOpt.scale.x, instancedOpt.scale.y, instancedOpt.scale.z);
    }
    let instanceInfo = {
        position: position,
        rotation: euler,
        scale: scale,
        visible: defined(instancedOpt.visible) ? instancedOpt.visible : true,
        labelVisible: defined(instancedOpt.labelVisible) ? instancedOpt.labelVisible : false,
        name: defaultValue(instancedOpt.name, '')
    }
    const nameInfo = /** @type {InstancedInfo} */ (info.get(name));
    let idx = nameInfo.lastIndex ?? nameInfo.size - 1;
    idx++;
    nameInfo.set(idx, instanceInfo);
    nameInfo.lastIndex = idx;
    return instanceInfo;
}


/**
 * instance 모델을 제거하는 함수
 *
 * @param name {string} instance 모델 이름
 * @param idx {number} instance 모델 번호
 *
 * @this {U3dMultipleComponentLayer}
 *
 * @ignore
 */
function removeInstancedInfo(name, idx) {
    let self = this;
    let info = /** @type {InstancedInfoStore | undefined} */ (self._instancedInfo);
    if(!defined(info)) return;

    const map = info?.get(name);
    if (!defined(map)) {
        return;
    }
    if (name && map) {
        map.delete(idx);
        if (map.size === 0) {
            info.delete(name)
            return;
        }
        if (map.lastIndex === idx) {
            let newLastIndex = -1;
            for (const key of map.keys()) {
                if (key > newLastIndex)
                    newLastIndex = key;
            }
            map.lastIndex = newLastIndex;
        }
    }
}

/**
 * 로드 된 3d 에셋의 박스영역 정보를 key-value 형식으로 저장하는 메서드입니다.
 *
 * @param {string} key 저장 키
 * @param {import('@union3d/core/UBox3').UBox3} value 박스영역
 */
U3dMultipleComponentLayer.prototype.setBbox = function (key, value) {
    let self = this;
    self._bboxMap.set(key, value);
}

/**
 * 로드 된 3d 에셋의 박스영역 정보를 이름으로 찾는 메서드입니다.
 *
 * @param {string} key 3d 에셋 이름
 * @returns {import('@union3d/core/UBox3').UBox3 | undefined}  박스영역
 */
U3dMultipleComponentLayer.prototype.getBbox = function (key) {
    let self = this;
    return self._bboxMap.get(key);
}

/**
 * @param {ComponentObject} component
 *
 * @this {U3dMultipleComponentLayer}
 */
function removeComponent(component){
    const self = this;
    if(component.children && component.children.length > 0){
        for (let i = component.children.length - 1; i >= 0; i--) {
            const child = /**@type{ComponentObject} */(component.children[i]);
            const childName = child.name;
            self.removeComponentByName(childName);
        }
        component.children = [];
    }

    if (
        component.parent instanceof U3dComponentPosition &&
        component instanceof U3dComponentPosition
    ) {
        component.parent.removeChild(/** @type {U3dComponentPosition} */ (component));
    }

    if (component._setInstanced && defined(component.instanceId)) {
        removeInstancedComponent.call(self, /** @type {U3dComponentInstancedPosition} */ (component))
    } else {
        component.removeLabel();
        component.dispose();
        const idx = self._componentList.indexOf(component);
        if (idx >= 0) self._componentList.splice(idx, 1);
        self._componentMap?.delete(component.name);
    }

}

/**
 * 입력한 이름에 해당하는 instanced mesh 컴포넌트 객체를 담고 있는 group을 반환하는 함수
 *
 * @param name {string} instanced mesh 이름
 * @param [index=0] {number} instanced mesh를 담고 있는 _instancedObject 배열의 index 번호
 * @returns {AnyObject3D | undefined} 대상 모델의 instanced mesh를 담고 있는 group이며 없으면 undefined <br>
 *
 * @this {U3dMultipleComponentLayer}
 *
 * @ignore
 */
function getInstancedGroup(name, index = 0) {
    const self = /** @type {U3dMultipleComponentLayer} */ (this);
    if (!defined(self._instancedObject) || self._instancedObject.children.length === 0) return undefined;

    name = name + '^' + index;
    for (let i = 0; i < self._instancedObject.children.length; i++) {
        const group = self._instancedObject.children[i];
        if (group.name === name) return group;
    }
    return undefined;
}

/**
 * instanced mesh 생성시 형상 출력을 담고 있는 group을 생성
 *
 * @param {string} name
 * @param {number} [offset=0]
 *
 * @this {U3dMultipleComponentLayer}
 *
 * @ignore
 */
function setInstancedGroup(name, offset = 0) {
    const self = this;
    if (!self._instancedObject) return;
    /** @type {InstancedGroupObject | undefined} */
    let group = /** @type {InstancedGroupObject | undefined} */ (getInstancedGroup.call(self, name, offset));
    if (group) return;
    group = /** @type {InstancedGroupObject} */ (new UGroup());
    group.name = name + '^' + offset;
    group._objectName = name;
    self._instancedObject.add(/** @type {import('three').Object3D} */(/** @type {unknown} */(group)));
    return /** @type {UGroup} */ (group);
}

/**
 * google 좌표로 tilekey 반환
 *
 * @ignore
 */
function getTileKey(/** @type {number} */ googleX, /** @type {number} */ googleY, /** @type {number} */ level) {
    let tileIndex = UMathEngine.getIndexXY(googleX, googleY, level, false, false);
    return tileIndex[0] + "_" + tileIndex[1] + "_" + level;
}

/**
 * component를 id 또는 이름으로 찾아서 반환
 *
 * @this {U3dMultipleComponentLayer}
 *
 * @ignore
 */
function findPositionIdx(/** @type {string} */ id) {
    for (let i = 0; i < this._componentList.length; i++) {
        const component = this._componentList[i];
        if (component.id === id || component.name === id) {
            return i;
        }
    }
    return -1;
}


/**
 * component 생성시 속성값으로 설정
 *
 * @this {U3dMultipleComponentLayer}
 *
 * @param {any} opt
 * @param {any} obj
 * @returns {Partial<ComponentParam> | undefined}
 *
 * @ignore
 */
function componentSetting(opt, obj) {
    const self = this;
    if (defined(opt.geoPosition)) {
        opt.position = self._drawArg.getGeographicToWorld(
            opt.geoPosition.x,
            opt.geoPosition.y,
            opt.geoPosition.z
        );
    }
    else if (defined(opt.worldPos) || defined(opt.google)) {
        opt.position = new THREE.Vector3(
            opt.worldPos?.x ?? opt.google?.x,
            opt.worldPos?.y ?? opt.google?.y,
            opt.worldPos?.z ?? opt.google?.z
        );
    }

    if (
        !defined(opt.position) &&
        !defined(opt.google) &&
        !defined(opt.geoPosition) &&
        !defined(opt.worldPos)
    ) {
        return;
    }
    // loadedModel 옵션을 사용하는경우
    if (defined(opt.loadedModel)) {
        if (!defined(opt.object))
            opt.object = opt.loadedModel
    }

    /**@type{any}*/ let copy;
    let instanced = opt.instanced ?? self._setInstanced;

    if (defined(opt.object)) {
        let model = self._object.children.find(function (/**@type{any}*/child) {
            return child.name === opt.object
        });

        if (!defined(model)) {
            __GError__(this, 'not found model', '5927235' );
            return;
        }

        copy = /** @type {ExtObject3D} */ (instanced ? model : self.skClone(model));
        copy._ext = /** @type {ExtObject3D} */ (model)._ext;
    } else {
        copy = /** @type {ExtObject3D} */ (instanced ? self._drawObject : self.skClone(self._drawObject));
        if(!copy) return;
        copy._ext = /** @type {ExtObject3D} */ (/** @type {unknown} */ (self._drawObject))._ext;
    }

    if(!defined(opt.isUpdate)){
        opt.isUpdate = true;
    }

    if (!copy) return;
    obj.name = copy.name;

    let modelName = copy.name;

    self.dispatchEvent({type: U3dMultipleComponentLayer.EVENT.BEFORE_CREATE, data: copy});
    const makeComponent = ()=> {
        copy.visible = true;
        obj.add(copy);

        opt.instanced = false;
        if (copy.animations.length !== 0) {
            copy.mixer = new THREE.AnimationMixer(copy);
            copy.animations.forEach((/**@type{any}*/animation) => {
                copy.mixer.clipAction(animation);
            });
            opt.mixers.push(copy.mixer);
        }
    }

    if (instanced) {

        // animation 모델의 렌더 구조를 얻는다. 원본 또는 cache 참조가 반환될 수 있다.
        copy = INTERNAL.changeMeshToSkinnedMesh(self, copy)

        addInstancedInfo.call(self, modelName, opt);
        let instancedGroup = createInstancedMesh.call(self, copy, opt, obj);
        copy.visible = false;
        opt.instanced = true;
    } else {
        makeComponent();
    }

    let nameInfo = /** @type {NameInfoMap} */ (self._nameInfo ?? {});
    if (!defined(nameInfo)) nameInfo = {};
    if (!defined(nameInfo[modelName])) {
        nameInfo[modelName] = 0;
    }
    nameInfo[modelName] += 1;
    return opt;
}


// instance mesh 생성
/**
 * @param {any} object
 * @param {any} opt
 * @param {any} objGroup
 * @returns {import('@union3d/core/UGroup').UGroup | undefined}
 *
 * @this {U3dMultipleComponentLayer}
 */
function createInstancedMesh(object, opt, objGroup) {
    let self = this;
    if (!defined(object)) return;
    let modelName = object.name;

    const instancedInfo = self._instancedInfo;
    if (!instancedInfo) return;

    let info = /** @type {InstancedInfoStore} */ (instancedInfo).get(modelName);
    if (!info) return;

    let count =  info.lastIndex ?? info.size - 1;
    let groupIndex = Math.floor((count) / self._instancedMaxCount);
    /** @type {import('@union3d/core/UGroup').UGroup | AnyObject3D | undefined} */
    let group = getInstancedGroup.call(self, modelName, groupIndex);
    if (!defined(group)) {
        group = setInstancedGroup.call(self, modelName, groupIndex);
        if (!group) return;
    }
    const cacheMeshList = /** @type {CacheMeshMap} */ (self._cacheMeshList);

    if (object.parent)
        object.parent.position.set(0, 0, 0);
    object.position.set(0, 0, 0);
    object.updateMatrixWorld();
    // 준비한 그룹에 생성·재사용한 렌더 mesh와 선택용 형상을 연결한다.
    INTERNAL.populateInstancedMesh(self, object, opt, objGroup, info, count, groupIndex, group, cacheMeshList, modelName);

    // 원본 object action을 믹서에 저장하고 믹서를 컨트롤러에 푸시
    if (object.animations.length > 0) {
        object.mixer = new THREE.AnimationMixer(object);
        object.animations.forEach((/**@type {import('three').AnimationClip } */animation) => {
            object.mixer.clipAction(animation);
        });
        group.animations = object.animations;
        opt.mixers.push(object.mixer);
    }
    return /** @type {UGroup} */ (group);
}


/**
 * instanced Component 제거 함수
 *
 * @this {U3dMultipleComponentLayer}
 *
 * @param {import('@union3d/3dLayer/U3dComponentInstancedPosition').U3dComponentInstancedPosition} component
 *
 * @ignore
 */
function removeInstancedComponent(component) {
    let self = this;

    removeInstancedInfoAtComponent.call(self, component);
    if(component._object)
        self._bboxMap.delete(component._object?.name);
    component.removeLabel();
    component.dispose();
    let idx_ = self._componentList.indexOf(component);
    if (idx_ >= 0) self._componentList.splice(idx_, 1);

}

/**
 * 입력된 값으로 matrix 설정
 *
 * @param {{position: import('three').Vector3, rotation:import('three').Euler, scale:import('three').Vector3}} info
 * @param {import('three').Matrix4} matrix
 *
 * @ignore
 */
function setMatrix(info, matrix) {
    if (!info || !matrix) return;
    let position = info.position;
    if (!(position instanceof THREE.Vector3)) {
        const positionLike = /** @type {{x: number, y: number, z: number}} */ (position);
        position = TEMP_POSITION.set(positionLike.x, positionLike.y, positionLike.z);
    }
    let rotation = info.rotation;
    if (!(rotation instanceof THREE.Euler)) {
        const rotationLike = /** @type {{x: number, y: number, z: number}} */ (rotation);
        rotation = TEMP_EULER.set(rotationLike.x, rotationLike.y, rotationLike.z);
    }
    let scale = info.scale;
    if (!(scale instanceof THREE.Vector3)) {
        const scaleLike = /** @type {{x: number, y: number, z: number}} */ (scale);
        scale = TEMP_SCALE.set(scaleLike.x, scaleLike.y, scaleLike.z);
    }
    TEMP_QUATERNION.setFromEuler(rotation);
    matrix.compose(position, TEMP_QUATERNION, scale);
}

/**
 * component 생성
 *
 * @param {any} opt
 * @returns {ComponentObject | undefined}
 *
 * @this {U3dMultipleComponentLayer}
 *
 * @ignore
 */
function createComponent(opt) {
    const self = this;
    const obj = new UGroup();

    opt.mixers = [];
    opt = componentSetting.call(self, opt, obj);
    if(!defined(opt.labelVisible)) {
        opt.labelVisible = this.labelVisible;
    }

    if (opt) {
        let option = {
            ...opt,
            type: opt.type || COMPONENT_TYPE.COMPONENT,
            object: obj,
            layerScale: self._scale,
            layerRotation: self._rotation,
            componentlayer: self,
            drawarg: self._drawArg,
            image: self._image,
            collisionDistance: self._collisionDistance,
            collisionFunction: self._collisionFunction,
            pathOpacity: opt.pathopacity || opt.pathOpacity,
            pathColor: opt.pathcolor || opt.pathColor,
            setInstanced: opt.instanced,
            hovering: opt.hovering,
            color: opt.color,
        }
        let component;
        if (opt.instanced) {
            option = setInstancedProperty.call(self, option, obj.name);
            if(option.type)
                component = new U3dComponentInstancedPosition(option);
            component?.instancedGroup?.traverse((/** @type {any} */child) => {
                if (child.isMesh) {
                    child.renderOrder = DEFAULT_RENDER_ORDER;
                    if(defined(opt.style))
                        setComponentDepth(child, opt.style);
                }
            });
        } else {
            component = new U3dComponentPosition(/** @type {any} */ (option));
            component?._object?.traverse((/** @type {any} */child) => {
                if (child.isMesh) {
                    child.renderOrder = DEFAULT_RENDER_ORDER;
                    if(defined(opt.style))
                        setComponentDepth(child, opt.style);
                }
            });
        }
        return component;
    }
    return undefined;
}

/**
 * material.depthTest / depthWrite 설정
 *
 * @param {import('three').Mesh} mesh
 * @param {any} style
 *
 * @ignore
 */
function setComponentDepth(mesh, style) {
    if (!defined(mesh.material)) return;

    if (Array.isArray(mesh.material)) {
        for (let material of mesh.material) {
            material.depthTest = defined(style.depthTest) ? style.depthTest : material.depthTest;
            material.depthWrite = defined(style.depthWrite) ? style.depthWrite : material.depthWrite;
        }
    } else {
        mesh.material.depthTest = defined(style.depthTest) ? style.depthTest : mesh.material.depthTest;
        mesh.material.depthWrite = defined(style.depthWrite) ? style.depthWrite : mesh.material.depthWrite;
    }
    mesh.renderOrder = defined(style.renderOrder) ? style.renderOrder : mesh.renderOrder;
}

/**
 * instanced mesh 속성값 설정
 *
 * @param {any} option
 * @param {string} name
 *
 * @this {U3dMultipleComponentLayer}
 *
 * @ignore
 */
function setInstancedProperty(option, name) {
    const self = this;

    if (!defined(self._instancedInfo)) return;

    const info = /** @type {InstancedInfo | undefined} */ (/** @type {InstancedInfoStore} */ (self._instancedInfo).get(name));
    if (!defined(info)) return;

    const index = info.lastIndex ?? info.size - 1; //instanced id
    if (!defined(index)) return;
    option.instanceId = index;
    option.groupIndex = Math.floor((index) / self._instancedMaxCount);

    if (!defined(index)) return;
    const findGroup = getInstancedGroup.call(self, name, option.groupIndex);
    if (findGroup) {
        option.instancedGroup = findGroup
    }
    option.instancedMaxCount = self._instancedMaxCount; //
    option.instancedInfo = info.get(index);
    option.setInstanced = true;
    return option;
}

/**
 * instnaced 생성시 정보와 해당 component를 제거
 *
 * @this {U3dMultipleComponentLayer}
 *
 * @param {import('@union3d/3dLayer/U3dComponentInstancedPosition').U3dComponentInstancedPosition} component
 *
 * @ignore
 */
function removeInstancedInfoAtComponent(component) {
    const self = this;
    const name = component._object?.name;
    if(!name) return;
    const idx = component.getInstanceId();
    if(!defined(idx)) {
        __GError__(self, '제거할 컴포넌트의 인스턴스ID를 찾을 수 없습니다.', '5108946');
        return;
    }

    const idx_ = idx % component._instancedMaxCount;

    removeInstancedInfo.call(self, name, idx);
    const info = self._instancedInfo ? /** @type {InstancedInfo | undefined} */ (/** @type {InstancedInfoStore} */ (self._instancedInfo).get(name)) : undefined;

    const instancedObject = getInstancedGroup.call(self, name, component.groupIndex);
    if (instancedObject) {
        instancedObject.traverse((instance) => {
            const instancedMesh = /** @type {any} */(instance);
            if (instance instanceof UInstancedBatchedSkinnedMesh) {
                instance.setVisible(idx_, false);
                instance.deleteInstance(idx_);
            } else if (instance instanceof UInstancedMesh) {
                instance.setVisible(idx_, false);
                /** @type {TypedUInstancedMesh} */ (instance).removeInstances(idx_);
                instance.computeBoundingSphere();
            }

            if (instancedMesh._matrixMap && instancedMesh._oriMatrixMap) {
                instancedMesh._matrixMap.delete(idx_);
                instancedMesh._oriMatrixMap.delete(idx_);
            }

            if (instancedMesh.getEdgeLine) {
                const line = instancedMesh.getEdgeLine(idx_);
                if (line) disposeAndRemove(line);
            }
        });
    }

    if (!info || info.size === 0) {
        removeByName.call(self, name);
        return;
    }

    clearInstancedObject.call(self, name, info, component);
}

/**
 *
 * @param {string} name
 * @param {any} info
 * @param {import('@union3d/3dLayer/U3dComponentInstancedPosition').U3dComponentInstancedPosition} component
 *
 * @this {U3dMultipleComponentLayer}
 */
function clearInstancedObject(name, info, component) {
    const self = this;

    let maxIndex = info.lastIndex ?? -1;
    if (maxIndex < 0) {
        for (const key of info.keys()) {
            if (key > maxIndex) maxIndex = key;
        }
    }

    const maxGroupIndex = Math.floor(maxIndex / component._instancedMaxCount);

    if (self._instancedObject) {
        for (let i = self._instancedObject.children.length - 1; i >= 0; i--) {
            const group = /** @type {any} */ (self._instancedObject.children[i]);
            if (!group || group._objectName !== name) continue;

            const parts = String(group.name).split('^');
            const groupIndex = Number(parts[parts.length - 1]);

            if (Number.isFinite(groupIndex) && groupIndex > maxGroupIndex) {
                disposeAndRemove(group);
            }
        }
    }

    if (self._cacheMeshList) {
        const cacheMeshList = /** @type {CacheMeshMap} */ (self._cacheMeshList);
        const keys = Object.keys(cacheMeshList);
        for (let j = keys.length - 1; j >= 0; j--) {
            const key = keys[j];
            const mesh = cacheMeshList[key];
            if (!mesh || mesh._objectName !== name) continue;

            const groupIndex = mesh._groupIndex ?? 0;
            if (groupIndex > maxGroupIndex) {
                disposeAndRemove(mesh);
                delete cacheMeshList[key];
            }
        }
    }
}

/**
 * @param {string} name
 *
 * @this {U3dMultipleComponentLayer}
 */
function removeByName(name) {
    const self = this;

    if (self._instancedObject) {
        for (let i = self._instancedObject.children.length - 1; i >= 0; i--) {
            const group = /** @type {any} */ (self._instancedObject.children[i]);
            if (group && group._objectName === name) {
                disposeAndRemove(group);
            }
        }
    }

    if (self._cacheMeshList) {
        const cacheMeshList = /** @type {CacheMeshMap} */ (self._cacheMeshList);
        const keys = Object.keys(cacheMeshList);
        for (let j = keys.length - 1; j >= 0; j--) {
            const key = keys[j];
            const mesh = cacheMeshList[key];
            if (mesh && mesh._objectName === name) {
                disposeAndRemove(mesh);
                delete cacheMeshList[key];
            }
        }
    }
}

/**
 * @param {any} object
 */
function disposeAndRemove(object) {
    UDEF.disposeObject3D(object);
    if (object.parent) object.parent.remove(object);
}

/**
 * vector3 여부 판단하여 아닐경우 vector3 으로 변환
 *
 * @param {import('three').Vector3Like | import('three').Vector3} val
 *
 * @ignore
 */
function parseVector3(val) {
    if (val instanceof THREE.Vector3) return val;
    else return new THREE.Vector3(val.x, val.y, val.z);
}


export {U3dMultipleComponentLayer};

