//@ts-check
import * as THREE from 'three';
import {defined} from '@union3d/util/defined';
import {defaultValue} from '@union3d/util/defaultValue';
import {Guid} from '@union3d/util/Guid';
import {UDEF} from '@union3d/core/UDEF';
import {U3dPOI} from '@union3d/geometry/U3dPOI';
import {U3dPathGeometry} from '@union3d/geometry/U3dPathGeometry';
import {UCatmullRomCurve3} from '@union3d/alg/UCatmullRomCurve3';
import {UMesh} from '@union3d/core/mesh/UMesh';
import {UBox3} from '@union3d/core/UBox3';
import {U3dRecoveredMixins} from '@union3d/recover/U3dRecoveredMixins';
import {deferred} from "@union3d/util/deferred";
import {UBufferGeometry} from "@union3d/core/geometry/UBufferGeometry";
import {UAnimationController} from "@union3d/analy/UAnimationController";
import {U3dCumulativePath} from "@union3d/geometry/U3dCumulativePath";
import {__GError__, __GInfo__, __GSError__} from "@U3dMessage";
import {UClock} from "@union3d/core/UClock";
import {UComponentMixerController} from "@union3d/analy/UComponentMixerController";
import {
    crowdAnimation,
    downHoverAnimation, moveFromTo,
    movePointAnimation,
    pathAnimation,
    upHoverAnimation
} from "@union3d/analy/UDrivingAnimation";
import {UMathEngine} from "@UMathEngine";
import {isWrong} from "@util/isWrong";
import {INTERNAL} from '@union3d/3dLayer/U3dComponentPosition.internal';

const ROTATE_AXIS = new THREE.Vector3(0, 0, 1); // rotateByAngle 컴포넌트 회전시 사용
const AUTO_UPDATE = true;

const COMPONENT_TYPE = {COMPONENT: "component", CROWD: "crowd"};
const TEMP_POSITION = new THREE.Vector3();
const TEMP_TO_UPDATE = new THREE.Vector3();
const SAMPLE_COUNT = 512;
const WAYPOINT_HISTORY_LIMIT = 100;


const CAM_TRACE_UPDATE = { // camera trace 위치 갱신 시 사용
    TEMP_UNIT_VEC : new THREE.Vector3(),
    TEMP_DIR_VEC:  new THREE.Vector3(),
    TEMP_POS_VEC :  new THREE.Vector3(),
    TEMP_TARGET_VEC:  new THREE.Vector3(),
}

const SPLINE_BUFFER_GEOMETRY = new UBufferGeometry();
const ORIGIN_GEOMETRY = new UBufferGeometry();

const HIGH_LIGHT_COLOR = '#fe5f55';
const HIGH_LIGHT_OPACITY = 0.6;

const TEMP_BOX_MAT = new THREE.Matrix4() ;
const UPDATE_MODE_ALLOWED = new Set(['none', 'auto', 'custom']);
const VISIBLE_DISTANCED = 1000;

const TEMP_MAT =  new THREE.Matrix4() ;
const INVERT_MAT =  new THREE.Matrix4() ;
const LOCAL_MAT =  new THREE.Matrix4() ;

/**
 * 컴포넌트가 이동 목표 지점에 도착했을 때 `arrive` 이벤트로 전달되는 이동 요약
 * @memberof U3dComponentPosition
 * @inner
 *
 * @typedef {object} U3dComponentPositionArriveData
 * @property {number} [dist] 도착까지의 누적 이동 거리 (m)
 * @property {number} [time] 도착까지의 누적 이동 시간 (ms)
 * @property {number} [speed] 도착 시점의 속도 (km/h)
 */

/**
 * 컴포넌트 도착(`arrive`) 이벤트 객체
 * @memberof U3dComponentPosition
 * @inner
 *
 * @typedef {object} U3dComponentPositionArriveEvent
 * @property {U3dComponentPositionArriveData} [data] 이동 요약 정보
 */

/**
 * 3D 지도 위에 배치되는 개별 모델 객체(컴포넌트)를 나타내는 클래스입니다. <br>
 * 가로등·차량·드론처럼 하나의 3D 모델을 특정 위치에 놓고 위치·회전·크기·색상을 제어하며,
 * 경로(`addPathGeometry`, `addMovePoint`)를 따라 이동하는 주행 애니메이션, 이동 궤적(누적 경로) 표시,
 * 라벨 POI·오버레이 부착, 카메라 추적, 카메라 거리에 따라 가시화·스타일을 자동 조정하는 LOD 기능을 제공합니다. <br>
 * 보통 직접 생성하지 않고 `U3dMultipleComponentLayer`가 모델을 로드한 뒤 생성하여 레이어에 등록합니다.
 *
 * 좌표는 별도 언급이 없으면 월드 좌표(EPSG:3857, 단위 m)이고, 위경도(EPSG:4326)를 다루는 API는 설명에 명시되어 있습니다.
 * 회전은 `rotation` 프로퍼티가 라디안 `Euler`이며 `degree`를 받는 API는 도(°) 단위입니다. 이동 속도는 km/h입니다.
 *
 * @group 3dLayer
 * @see GeOnDT.model.U3dMultipleComponentLayer
 *
 * @example
 * let component = new U3dComponentPosition({
 *      name: '가로등1',
 *      type: 'component',
 *      loadedModel: "street_lamp",
 *      position: {x: 14133794.559901267, y: 4506973.292712285, z: 85.26596813065227, isVector3: true},
 *      scale: {x: 3, y: 3, z:3, isVector3: true},
 *      rotation: {_x: 0, _y: -90, _z: 0, _order: 'XYZ', isEuler: true}
 *  });
 */
class U3dComponentPosition {
    /** @type {number} */
    #brightness = 1;
    /** @type {number} */
    #contrast = 1;
    /** @type {number} */
    #saturation = 1;

    /** @type {Array<WaypointRecord>} */
    #waypointHistory = [];

    /**
     * moveSmoothly로 도착한 최근 100개 지점의 복사본입니다. 오래된 지점부터 정렬됩니다. <br>
     * 시작점·대기 목표점·프레임 보간점은 포함하지 않습니다.
     * 이동 중지나 컨트롤러 교체 시 유지하고 dispose 시 비웁니다.
     *
     * @type {Array<WorldPositionVector3>}
     */
    get waypointHistory() {
        return this.#waypointHistory.map(record => record.point.clone());
    }

    /**
     * 최근 도착한 지점들을 바탕으로 앞으로 도착할 예측 지점 (count개)과 예상 도착 시간을 계산합니다.<br>
     * 마지막 도착 지점에서 시작해 최근 도착 지점 간 평균 간격만큼 한 단계씩 나아간 지점을 반환합니다.<br>
     * 예측 방향은 최근 이동 방향과 현재 진행 방향(지금 향하고 있는 목표 지점 방향)을 headingWeight 비율로 섞어 정합니다.
     * 0이면 최근 이동 방향만, 1이면 현재 진행 방향만 사용합니다(기본 0.5). 현재 진행 방향을 알 수 없으면 최근 이동 방향만 사용합니다.<br>
     * time은 호출 시점부터 그 지점 도착까지의 예상 시간(ms)이며 계산할 수 없으면 Infinity입니다.<br>
     * 도착 이력이 count개보다 적으면 undefined를 반환합니다.<br>
     * count는 2~100 사이의 정수, headingWeight는 0~1 사이의 숫자여야 하며 아니면 TypeError 또는 RangeError가 발생합니다.
     *
     * @param {number} count 분석할 최근 도착 지점 수와 반환할 미래 단계 수인 2~100 사이의 정수
     * @param {number} [headingWeight=0.5] 현재 진행 방향 반영 비율 (0~1). 0이면 도착 이력 추세만, 1이면 현재 진행 방향만 사용합니다.
     * @returns {Array<PredictedPosition> | undefined} 가까운 예측점부터 순서대로 담은 위치와 예상 경과 시간 목록 또는 이력이 부족할 때 undefined
     *
     * @example
     * const predicted = component.predictFuturePositions(10, 0.5);
     * if (predicted) {
     *     const farthest = predicted[predicted.length - 1];
     *     const geographic = component.getGeographicPositionByWorld(farthest.point);
     *     console.log(`${farthest.time}ms 후 도착 예상`);
     * }
     *
     * @example
     * // 이력 추세만으로 예측 (현재 주행 진행 방향 미반영)
     * const trendOnly = component.predictFuturePositions(5, 0);
     */
    predictFuturePositions(count, headingWeight = 0.5) {
        if (typeof count !== 'number') {
            throw new TypeError('count는 숫자여야 합니다.');
        }
        if (!Number.isInteger(count) || count < 2 || count > WAYPOINT_HISTORY_LIMIT) {
            throw new RangeError('count는 2~100 사이의 정수여야 합니다.');
        }

        if (typeof headingWeight !== 'number' || Number.isNaN(headingWeight)) {
            throw new TypeError('headingWeight는 숫자여야 합니다.');
        }
        if (headingWeight < 0 || headingWeight > 1) {
            throw new RangeError('headingWeight는 0~1 사이여야 합니다.');
        }

        if (this.#waypointHistory.length < count) return undefined;

        const records = this.#waypointHistory.slice(-count);
        const last = records[count - 1];
        const meanIndex = (count - 1) / 2;
        const step = new THREE.Vector3();
        let pathLength = 0;
        let denominator = 0;
        for (let i = 0; i < count; i++) {
            const weight = i - meanIndex;
            const point = records[i].point;
            // 큰 월드 좌표의 공통 오프셋을 빼 작은 이동량의 정밀도를 보존한다.
            step.x += weight * (point.x - last.point.x);
            step.y += weight * (point.y - last.point.y);
            step.z += weight * (point.z - last.point.z);
            denominator += weight * weight;
            if (i > 0) pathLength += point.distanceTo(records[i - 1].point);
        }
        step.divideScalar(denominator);

        // 평균 속도(m/ms): 이력 구간의 실제 이동 거리를 첫 도착부터 마지막 도착까지의 경과 시간으로 나눈다.
        const elapsedMs = last.time - records[0].time;
        const averageSpeed = elapsedMs > 0 ? pathLength / elapsedMs : 0;
        const stepLength = step.length();

        const now = Date.now();

        // 기준점은 마지막 도착 지점이다. k번째 예측이 k번째 실제 도착과 대응하도록 사양(마지막 도착점 + step × k)을 유지한다.
        const anchor = last.point;
        const anchorTime = last.time;

        // 예측 방향: 이력 추세 방향에서 현재 진행 방향 쪽으로 사이 각도의 headingWeight 비율만큼 회전시킨다.
        // 이동량은 이력에서 얻은 step 길이를 유지한다.
        let direction = step;
        if (headingWeight > 0 && stepLength > 0) {
            const heading = this.#getCurrentHeadingDirection();
            if (defined(heading)) {
                const rotated = INTERNAL.rotateTowards(step.clone().normalize(), heading, headingWeight);
                direction = rotated.multiplyScalar(stepLength);
            }
        }

        /** @type {Array<PredictedPosition>} */
        const result = [];
        for (let k = 1; k <= count; k++) {
            const distance = stepLength * k;
            let time;
            if (averageSpeed > 0) {
                time = Math.max(0, Math.round(anchorTime + distance / averageSpeed - now));
            } else {
                time = distance === 0 ? 0 : Number.POSITIVE_INFINITY;
            }
            result.push({point: anchor.clone().addScaledVector(direction, k), time});
        }
        return result;
    }

    /**
     * 현재 진행 방향 단위 벡터를 반환한다.<br>
     * 재생 중이거나 일시정지된 애니메이션 구간의 출발→도착 방향을 사용하고, 구간 정보가 없으면 undefined를 반환한다.
     *
     * @returns {import('three').Vector3 | undefined} 진행 방향 단위 벡터 또는 알 수 없을 때 undefined
     *
     * @ignore
     */
    #getCurrentHeadingDirection() {
        const animation = this.getAnimationNow();
        if (defined(animation) && (animation.isRunning || animation.isPaused)) {
            const from = animation.from;
            const to = animation.to;
            if (defined(from) && defined(to)) {
                const segment = new THREE.Vector3().subVectors(to, from);
                if (segment.lengthSq() > 1e-8) return segment.normalize();
            }
        }
        return undefined;
    }

    ///////////////////////////////////////////////////////////////////////////
    /**
     * 주행 애니메이션이 현재 실행 중인지 여부. `moveStart`/`moveStop`이 갱신하는 내부 상태입니다.
     *
     * @type {boolean}
     */
    _animation
    /** @type {number}*/
    #lastDistance = Number.POSITIVE_INFINITY
    /**
     * 외부에서 자유롭게 붙이는 사용자 데이터. `verticalObjects`(Object3D 배열)가 있으면 LOD 가시화 변경 시 함께 켜지고 꺼집니다.
     *
     * @type {KeyValue}
     */
    userData
    /**
     * 컴포넌트가 속한 레이어 이름. `getLayerName`이 반환합니다.
     *
     * @type {string}
     */
    _ulayername
    /**
     * instanced 컴포넌트일 때 인스턴스 index. 일반 컴포넌트는 undefined입니다.
     *
     * @type {number | string | undefined}
     */
    instanceId
    /**
     * 진행 중인 트윈 핸들. `stop()`으로 중단할 수 있으며 진행 중인 트윈이 없으면 undefined입니다.
     *
     * @type {{stop: function(): void} | undefined}
     *
     * @ignore
     */
    tween
    /**
     * 화면에 그려지는 3D 모델 리소스(Object3D 계층). 외부에서는 `getObject`로 접근하세요.
     *
     * @type {any}
     */
    _object = undefined
    /**
     * 컴포넌트 위치 (월드 좌표 EPSG:3857, m). 직접 수정하지 말고 `setPosition`을 사용하세요.
     *
     * @type {import('three').Vector3}
     */
    position = new THREE.Vector3(0, 0, 0)
    /**
     * 컴포넌트 회전 (라디안 `Euler`, XYZ 순). `setRotation`·`setRotationX/Y/Z`로 변경합니다.
     *
     * @type {import('three').Euler}
     */
    rotation = new THREE.Euler(0, 0, 0, 'XYZ')
    /**
     * 축별 크기 배율. 1이 원본 크기이며 `setScale`로 변경합니다.
     *
     * @type {import('three').Vector3}
     */
    scale = new THREE.Vector3(1, 1, 1)
    /**
     * `rotation`과 동기화되는 회전 쿼터니언. 변환 행렬 계산에 사용됩니다.
     *
     * @type {import('three').Quaternion}
     */
    quaternion = new THREE.Quaternion()
    /**
     * 주행 중 바라보는 목표 위치 (월드 좌표). 주행 중이 아니면 undefined입니다.
     *
     * @type {import('three').Vector3 | undefined}
     */
    lookAt = undefined
    /**
     * 위치·회전·크기를 합친 변환 행렬. 부모가 있으면 부모 기준 상대 행렬입니다.
     *
     * @type {import('three').Matrix4}
     */
    matrix = new THREE.Matrix4()
    /**
     * 부모 계층까지 반영한 월드 변환 행렬. `getMatrixWorld`가 반환합니다.
     *
     * @type {import('three').Matrix4}
     */
    matrixWorld = new THREE.Matrix4()
    /**
     * `setParent`로 지정한 상위 컴포넌트. 없으면 undefined입니다.
     *
     * @type {U3dComponentPosition | undefined}
     */
    parent = undefined
    /**
     * `setChild`로 등록한 하위 컴포넌트·오브젝트 목록. 부모의 위치·회전·크기·가시화가 함께 반영됩니다.
     *
     * @type {Array<U3dComponentPosition | ExtendedObject3D>}
     */
    children = []
    /**
     * `setOverlay`로 붙인 오버레이 목록. 컴포넌트가 이동하면 함께 이동합니다.
     *
     * @type {Array<OverlayObject>}
     */
    overlay = []
    /**
     * 컴포넌트가 속한 컴포넌트 레이어. 생성 옵션 `componentlayer`로 지정됩니다.
     *
     * @type {import('@U3dMultipleComponentLayer').U3dMultipleComponentLayer}
     */
    componentLayer = /** @type {import('@U3dMultipleComponentLayer').U3dMultipleComponentLayer} */ ({})
    /**
     * 앱·씬·카메라에 접근하기 위한 렌더 컨텍스트. 레이어에서 전달됩니다.
     *
     * @type {import('@UDrawArg').UDrawArg}
     */
    drawArg = /** @type {import('@UDrawArg').UDrawArg} */ ({})
    /**
     * 현재 가시화 상태. `isVisible`이 반환하고 `show`/`hide`가 갱신합니다.
     *
     * @type {boolean}
     */
    _show = false
    /**
     * 주행 애니메이션 이동 속도 (m/s, 기본값 700). `setSpeed`로 변경합니다.
     *
     * @type {number}
     */
    speed = 0
    /**
     * 컴포넌트에 연결된 조명 목록 (deprecated 기능).
     *
     * @type {Array<LightLike | import('@union3d/view/USpotLight').USpotLight>}
     */
    _lightList = []
    /**
     * 컴포넌트에 연결된 뷰 목록 (deprecated 기능).
     *
     * @type {Array<UnknownRecord>}
     */
    _viewList = []

    /**
     * 경로를 일정 간격으로 샘플링한 위치 버퍼 (x, y, z 연속). 주행 계산용 캐시입니다.
     *
     * @type {Float32Array | null | undefined}
     */
    _sampledPathF32;
    /**
     * 샘플링 위치별 진행 방향 버퍼. 주행 계산용 캐시입니다.
     *
     * @type {Float32Array | null | undefined}
     */
    _sampledDirF32;
    /**
     * 경로 샘플링 구간 수.
     *
     * @type {number | null | undefined}
     */
    _sampleSegN;
    /**
     * 샘플링된 경로 좌표 배열 (월드 좌표).
     *
     * @type {Array<import('three').Vector3> | undefined}
     */
    _sampledPath;

    /**
     * 주행 경로 곡선. `addPathGeometry`/`addMovePoint`가 생성합니다.
     *
     * @type {import('three').CatmullRomCurve3 | import('@UCatmullRomCurve3').UCatmullRomCurve3 | null | undefined}
     */
    _spline;
    /**
     * 꼭짓점을 줄인 주행 경로 곡선. 경로 표시와 충돌 검사에 사용됩니다.
     *
     * @type {import('three').CatmullRomCurve3 | import('@UCatmullRomCurve3').UCatmullRomCurve3 | null | undefined}
     */
    _reductionSpline;
    /**
     * `addPathGeometry`로 지정된 주행 경로 지오메트리.
     *
     * @type {PathGeometryLike | undefined}
     */
    _pathGeometry;

     /**
      * 보간 계산용 임시 벡터.
      *
      * @type {import('three').Vector3 | null | undefined}
      */
     _tempLerpVec;
    /**
     * 주행 애니메이션에서 현재까지 이동한 거리 (m). `getDistanceTraveled`가 반환합니다.
     *
     * @type {number}
     */
    _nowDistance = 0;
    /**
     * 현재 주행 경로의 총 길이 (m).
     *
     * @type {number}
     */
    distance = 0;
    /**
     * 주행 목표 시간 (ms). 0이면 `speed` 기준 등속으로 주행합니다.
     *
     * @type {number}
     */
    duration = 0;
    /**
     * `setSpeed`로 예약된 다음 속도 (km/h). 주행 중 변경하면 다음 프레임에 `speed`로 반영됩니다.
     *
     * @type {number}
     */
    newSpeed = 0;
    /**
     * 주행 중 속도 변경이 예약되었는지 여부.
     *
     * @type {boolean}
     */
    needToChange = false;
    /**
     * `addMovePoint`로 등록한 이동 지점 목록 (위경도 좌표, 통과 콜백 포함).
     *
     * @type {Array<GooglePositionWithCallback>}
     */
    movePointList = [];
    /**
     * 이동 지점 통과 처리 중인 index.
     *
     * @type {number}
     */
    _turnPointIndex = 0;
    /**
     * 이동 지점 개수.
     *
     * @type {number}
     */
    _turnPointLength = 0;
    /**
     * 모델 자체 애니메이션(클립)을 재생하는 믹서 목록. `setMixers`로 교체합니다.
     *
     * @type {Array<import('three').AnimationMixer>}
     */
    mixers = [];
    /**
     * 현재 동작 중인 주행 애니메이션 컨트롤러 ID.
     *
     * @type {string | undefined}
     */
    _animationId = undefined;
    /**
     * 주행 시작 시 먼저 실행되는 애니메이션(예: 호버링 상승) 컨트롤러 ID.
     *
     * @type {string | undefined}
     */
    _startAnimationId = undefined;
    /**
     * `saveObjectSetting`으로 저장한 초기 위치.
     *
     * @type {import('three').Vector3 | undefined}
     */
    _initPosition;
    /**
     * `saveObjectSetting`으로 저장한 초기 회전.
     *
     * @type {import('three').Euler | undefined}
     */
    _initRotation;
    /**
     * `saveObjectSetting`으로 저장한 초기 크기.
     *
     * @type {import('three').Vector3 | undefined}
     */
    _initScale;
    /**
     * 컴포넌트 라벨 POI. `setLabel`로 생성되며 없으면 undefined입니다.
     *
     * @type {PoiLike | undefined}
     */
    poi;
    /**
     * 라벨 POI 가시화 상태. `isVisibleLabel`이 반환합니다.
     *
     * @type {boolean}
     */
    _labelVisible = false;

    /**
     * `setColor`로 지정한 현재 색상. 지정 전에는 undefined이며 모델 원본 색상이 쓰입니다.
     *
     * @type {import('three').ColorRepresentation | undefined}
     */
    color;
    /**
     * `setOpacity`로 지정한 현재 투명도 (0~1). 지정 전에는 undefined입니다.
     *
     * @type {number | undefined}
     */
    opacity;

    #useOriginRoute;
    /** @type {*} */ #pathMaterial;
    #pathGeometry;

    /** @type {Map<string,  import('@UAnimationController').UAnimationController>} */ #animationControllers = new Map();

    /** @type {boolean} */ #drawCumulativePath = false;
    /** @type {import('@union3d/geometry/U3dCumulativePath').U3dCumulativePath | undefined} */ #cumulativePath = undefined;

    /** @type {U3dCumulativePath_StyleOpt} */ #pathStyle = {};
    /** @type {Array<{position: import('three').Vector3Like, dist: number, time: number}>} */ #initPathPositions = [];

    /** @type {CumulativeProperty} */ #cumulativeProperty = {
        lastPass: 0,
        passCallback: null,
        precision: undefined,
        lastInfo: undefined,
        initTime: 0,
        moveBaseDist: 0,
        startPosition: undefined
    };

    #disposed = false;
    #loop;

    /** @type {LOD_UpdateFunc | undefined} */ #updateFunc;
    /** @type {'none' | 'auto' | 'custom'} */ #LODMode = 'none';
    /** @type {number} */ #maxVisibleDistance = VISIBLE_DISTANCED;

    /** @type {import('three').Vector3} */ #overlayPosition = new THREE.Vector3();

    // _updateMixer = true;
    // _mixerFps = 20;
    // /** @type {number | null | undefined} */ #lastUpdatedMixerIndex;

    /**
     * 컴포넌트를 생성합니다. 옵션별 의미는 `U3dComponentPositionCO`를 참고하세요. <br>
     * 제약 사항: `opt.componentlayer`(정상 레이어)와 `opt.position`이 없으면 생성이 중단되고 `isDisposed()`가 true인 빈 객체가 됩니다.
     *
     * @param {U3dComponentPositionCO} opt 생성 옵션. `componentlayer`, `position`은 필수
     */
    constructor(opt) {
        opt = opt || /** @type {U3dComponentPositionCO} */ ({});
        if (!defined(opt?.componentlayer?._drawArg)) {
            console.error('Componentlayer is disposed!');
            this.#disposed = true;
            return;
        }
        if (!defined(opt.position)) {
            console.error('Component Position is undefined!');
            this.#disposed = true;
            return;
        }
        const self = this;
        /**
         * 컴포넌트 이름. 생략 시 `loadedModel` 이름 또는 GUID가 쓰이며 `editName`으로 변경합니다.
         */
        this.name = defaultValue(opt.name, opt.loadedModel ? opt.loadedModel : Guid());
        /**
         * 컴포넌트 고유 ID. 생략 시 GUID가 생성됩니다.
         *
         * @type {string}
         */
        this.id = defaultValue(opt.id, Guid());
        /**
         * 컴포넌트 종류. `'component'`(일반 모델) 또는 `'crowd'`(폴리곤 안을 돌아다니는 군중).
         *
         * @type {string}
         */
        this.type = defaultValue(opt.type, COMPONENT_TYPE.COMPONENT);
        /**
         * 모델 파일 확장자 (예: 'glb', 'jpg'). jpg 모델은 항상 카메라를 향하도록 회전합니다.
         *
         * @type {string | undefined}
         */
        this._ext = opt.ext
        /**
         * 컴포넌트 객체임을 나타내는 표식 (항상 true). 레이어가 객체 종류를 판별할 때 사용합니다.
         *
         * @type {boolean}
         */
        this.isComponent = true;

        this.parent = undefined;
        this.children = [];
        this.matrix = new THREE.Matrix4();
        this.matrixWorld = new THREE.Matrix4();

        let position = opt.position;
        if(!(position instanceof THREE.Vector3)) {
            const point = /** @type {{x: number, y: number, z: number}} */ (position);
            position = new THREE.Vector3(point.x, point.y, point.z);
        }
        this.position = position;
        this.lookAt = undefined;
        this.quaternion = new THREE.Quaternion();
        this._object = defaultValue(opt.object, undefined);
        /**
         * 모델 리소스의 기본 투명도 (0~1).
         *
         * @type {number}
         */
        this._objectOpacity = defaultValue(opt.objectOpacity, 1);

        // 컴포넌트 애니메이션 관련 파라미터
        /**
         * 카메라 추적 여부. true면 카메라가 컴포넌트를 따라가고(`setCameraTrace`), false면 일반 지도 모드입니다.
         *
         * @type {boolean}
         */
        this.isTrace = false;
        /**
         * 애니메이션 경과 시간 측정용 시계.
         *
         * @type {import('@union3d/core/UClock').UClock}
         */
        this._clock = new UClock();
        this.drawArg = defaultValue(opt.drawarg, /** @type {import('@UDrawArg').UDrawArg} */ ({}));
        this.componentLayer = defaultValue(opt.componentlayer, /** @type {import('@U3dMultipleComponentLayer').U3dMultipleComponentLayer} */ ({}));

        this.#loop = defaultValue(opt.loop, THREE.LoopRepeat);
        const mixers = defaultValue(opt.mixers, []);
        /**
         * 모델 클립 믹서를 관리하는 컨트롤러. `getMixerController`가 반환합니다.
         *
         * @type {import('@union3d/analy/UComponentMixerController').UComponentMixerController}
         */
        this._mixerController = new UComponentMixerController(this, {
            mixers: mixers,
            loop: this.#loop,
            drawArg: this.drawArg,
            maxUpdateDistance: 7000,
            autoFps: defaultValue(opt.mixerAutoFps, true),
        });
        /**
         * 컨트롤러가 관리하는 믹서 목록.
         *
         * @type {Array<import('three').AnimationMixer>}
         */
        this._mixers = this._mixerController.getMixers();
        /**
         * 카메라 추적 시 사용하는 깊이·측면·높이 상태.
         *
         * @type {{depth: number, side: number, height: number}}
         */
        this._camState = {
            depth: Number.POSITIVE_INFINITY,
            side: 0,
            height: 0,
        };

        this.movePointList = [];
        /**
         * `addMovePoint`로 지정한 지점별 방향각 목록. 지정하지 않으면 undefined입니다.
         *
         * @type {Array<import('three').Vector3> | undefined}
         */
        this.pitchYawRollList = undefined;
        this.tween = undefined;
        this._animation = false;
        /**
         * 주행 경로 라인을 화면에 표시할지 여부.
         *
         * @type {boolean}
         */
        this.drawPath = defaultValue(opt.drawpath, false);
        /**
         * 실제 이동 경로 메시를 표시할지 여부.
         *
         * @type {boolean}
         */
        this.drawRealPath = defaultValue(opt.drawRealPath, false);
        /**
         * `'crowd'` 타입이 돌아다닐 폴리곤 영역.
         *
         * @type {import('three').Object3D | UnknownRecord | undefined}
         */
        this._drawPolygon = opt.drawPolygon;
        /**
         * 경로 표시 타입. 현재 `'cube'`만 지원합니다.
         *
         * @type {string}
         */
        this.typePath = defaultValue(opt.typepath, 'cube');
        const pathColor =  defaultValue(opt.pathColor, 'rgb(255,255,255)');
        /**
         * 경로 라인 색상. `setPathColor`로 변경합니다.
         *
         * @type {import('three').Color}
         */
        this.pathColor = new THREE.Color(pathColor)
        /**
         * 경로 라인 투명도 (0~1). `setPathOpacity`로 변경합니다.
         *
         * @type {number}
         */
        this.pathOpacity = defaultValue(opt.pathOpacity ?? opt.pathopacity, 1);

        if(this.drawPath || this.drawRealPath) {
            this.#pathMaterial  = new THREE.LineBasicMaterial({
                color: 'rgb(255,255,255)',
                transparent: false
            });
            this.#pathGeometry = new UBufferGeometry();
        }

        /**
         * 주행 중 `updateAnimationFunc` 콜백을 호출하는 이동 간격 (m).
         *
         * @type {number}
         */
        this.updateDistance = defaultValue(opt.updateDistance, 100);
        /**
         * 주행 중 방향 갱신을 판단하는 기준 각도 (°).
         *
         * @type {number}
         */
        this.updateAngle = defaultValue(opt.updateAngle, 90);
        this.splineObject = undefined;
        this.duration = 0;
        /**
         * 입력 좌표를 곡선 보정 없이 그대로 경로로 사용할지 여부.
         *
         * @type {boolean}
         */
        this.usetruthpath = defaultValue(opt.usetruthpath, false);
        this.overlay = [];
        /**
         * 주행 애니메이션을 끝난 뒤 반복할지 여부.
         *
         * @type {boolean}
         */
        this.repeat = defaultValue(opt.repeat, false);
        this._show = true;
        this._spline = undefined;
        this._splinePitch = undefined;
        /**
         * 입력 좌표를 경로의 시작/끝점으로 자동 추가할지 여부.
         *
         * @type {boolean}
         */
        this._addstartend = defaultValue(opt.addstartend, false);
        // this._buffer = defaultValue(opt.buffer, 40);
        /**
         * 경로 텍스처 이미지 URL.
         *
         * @type {string | undefined}
         */
        this.image = defaultValue(opt.image, undefined);
        this.needToChange = false;
        this.distance = 0;
        this.speed = defaultValue(opt.speed, 700);  // 시속 700km/h
        /**
         * 사용자 정의 속성 정보. `getProperties`/`setProperties`/`addProperties`로 다룹니다.
         */
        this.properties = defaultValue(opt.properties, {});
        //this.splineVertexCnt = defaultValue(opt.splineVertexCnt, 100);
        /**
         * TopView 카메라 추적 시 모델과 카메라 사이 거리 (m).
         *
         * @type {number}
         */
        this._topViewDistance = defaultValue(opt.topviewdistance, 1000);

        /**
         * 경로 곡선 장력 (0~1). 작을수록 완만한 곡선이 됩니다.
         *
         * @type {number}
         */
        this._curveTension = defaultValue(opt.curvetension, 0.01);

        /**
         * 경로 메시 폭 (m).
         *
         * @type {number}
         */
        this._pathWidth = defaultValue(opt.pathwidth, 185);
        /**
         * 경로 메시 외곽선 사용 여부.
         *
         * @type {boolean}
         */
        this._pathEdge = defaultValue(opt.pathedge, true);
        /**
         * 경로 메시 높이 (m).
         *
         * @type {number}
         */
        this._pathHeight = defaultValue(opt.pathHeight, 30);
        /**
         * 경계영역 캐시. `getRectangle`이 갱신합니다.
         */
        this._bbox = defaultValue(opt.bbox, undefined);
        this.color = undefined;
        this.opacity = undefined;
        /**
         * 경로 버퍼 거리 (m).
         *
         * @type {number | undefined}
         */
        this._buffer = defaultValue(opt.buffer, undefined);
        this.scale = new THREE.Vector3(1, 1, 1);
        if (defined(opt.scale)) {
            this.scale.set?.(opt.scale.x, opt.scale.y, opt.scale.z);
        }
        /**
         * 레이어 기본 스케일.
         *
         * @type {import('three').Vector3 | undefined}
         */
        this._layerScale = opt.layerScale;

        if (!opt.rotation && opt.layerRotation) {
            const layerRotation = opt.layerRotation;
            // (부모-자식 계층) 구조 적용시 rotation이 같아 계산 공정에서 오류 발생
            opt.rotation = new THREE.Euler(layerRotation.x, layerRotation.y, layerRotation.z, layerRotation.order);
        }
        const initRotation = /** @type {import('three').Euler | {x: number, y: number, z: number}} */ (defaultValue(opt.rotation, {x: 0, y: 0, z: 0}));
        if (initRotation instanceof THREE.Euler) {
            this.rotation = initRotation;
        } else {
            this.rotation = new THREE.Euler(
                initRotation.x * Math.PI / 180,
                initRotation.y * Math.PI / 180,
                initRotation.z * Math.PI / 180,
                'XYZ'
            );
        }

        if (this._object) {
            if (this._object.children) {
                for (const child of this._object.children) {
                    if (opt.layerRotation && child.rotation.equals(opt.layerRotation)) {
                        child.rotation.set(0, 0, 0);
                    }
                }
            }

            this._object.traverse(/** @param {PickableObject3D & KeyValue} object */ (object) => {
                // target 확장 멤버: pickMaterial, restoreMaterial, getModel, getComponent, type
                const target = object;

                target.pickMaterial = pickMaterial;
                target.restoreMaterial = restoreMaterial;
                target.getModel = function () {
                    if (!self.componentLayer
                        || !self.componentLayer._object
                        || self.componentLayer._object.children.length === 0) return undefined;

                    const selfObject = self.getObject();
                    if (!selfObject) return undefined;
                    for (const object of self.componentLayer._object.children) {
                        if (selfObject.name === object.name) {
                            return object;
                        }
                    }
                    return undefined;
                }
                target.getComponent = function () {
                    return self;
                }
                const targetProps = /** @type {KeyValue} */ (target);
                targetProps.type = 'component';
            });
        }

        /**
         * 컴포넌트가 그려지는 씬. 기본값은 레이어의 씬입니다.
         */
        this.scene = defaultValue(opt.scene, this.componentLayer._scene);

        this._nowDistance = 0;

        this._lightList = defaultValue(opt.lightList, []); // 광원 목록
        this._viewList = defaultValue(opt.viewList, []); // 뷰 목록

        /**
         * GeOnDT 내부 객체 종류 식별자.
         */
        this._utype = UDEF.UMESH_TYPE._component;
        /**
         * 충돌 감지 거리 (m). `setCollisionDistance`로 변경합니다.
         *
         * @type {number}
         */
        this._collisionDistance = defaultValue(opt.collisiondistance, 10);
        /**
         * 충돌 감지 시 호출되는 콜백. `setCollisionFunction`으로 변경합니다.
         *
         * @type {Function | undefined}
         */
        this._collisionFunction = defaultValue(opt.collisionFunction, undefined);
        /**
         * 시선 방향 계산용 레이캐스터.
         *
         * @type {import('three').Raycaster | undefined}
         */
        this._lookAtRaycaster = undefined;
        this.getPosition = function () {
            const app = this.drawArg?._app;
            if (!defined(app)) return this.position;
            return app.vector3ToGeoGraphic(this.position);
        }

        this.getVectorPosition = function () {
            return this.position;
        }

        if(defined(opt.startFnc)) __GInfo__(this, 'GeOnDT Version: 2.2.1.10.180.d 부터 startFnc 옵션명이 startAnimationFunc 으로 변경되었습니다.', '6024387');
        if(defined(opt.updateFnc)) __GInfo__(this, 'GeOnDT Version: 2.2.1.10.180.d 부터 updateFnc 옵션명이 updateAnimationFunc 으로 변경되었습니다.', '6024535');
        if(defined(opt.endFnc)) __GInfo__(this, 'GeOnDT Version: 2.2.1.10.180.d 부터 endFnc 옵션명이 endAnimationFunc 으로 변경되었습니다.', '6024674');

        /**
         * 주행 애니메이션 갱신 시 호출되는 사용자 콜백. `setUpdateAnimationFunc`로 변경합니다.
         *
         * @type {Function | undefined}
         */
        this._updateAnimationFunc = defaultValue(opt.updateAnimationFunc ?? opt.updateFnc, undefined);
        /**
         * 주행 애니메이션 종료 시 호출되는 사용자 콜백. `setEndAnimationFunc`로 변경합니다.
         *
         * @type {Function | undefined}
         */
        this._endAnimationFunc = defaultValue(opt.endAnimationFunc ?? opt.endFnc, undefined);
        /**
         * 주행 애니메이션 시작 시 호출되는 사용자 콜백. `setStartAnimationFunc`로 변경합니다.
         *
         * @type {Function | undefined}
         */
        this._startAnimationFunc = defaultValue(opt.startAnimationFunc ?? opt.startFnc, undefined);
        /**
         * instanced 메시로 생성되었는지 여부. `getInstanced`가 반환합니다.
         *
         * @type {boolean}
         */
        this._setInstanced = defaultValue(opt.setInstanced, false);

        /**
         * 경로 주행 시작·종료 시 호버링(수직 상승·하강) 애니메이션을 사용할지 여부.
         *
         * @type {boolean}
         */
        this._doHovering = defaultValue(opt.hovering, true);

        // 주행 애니메이션 관련 프로퍼티
        this.#animationControllers = new Map();
        this._animationId = undefined; // 현재 동작중인 주행 애니메이션 ID
        this._startAnimationId = undefined; // 주행 애니메이션 루프 시 시작하는 애니메이션 ID (ex : upHovering 등)

        // 경로를 relative하게 보정하지 않고 있는 그대로 사용하는 옵션
        this.#useOriginRoute = defaultValue(opt.useOriginRoute, false);

        this.#cumulativeProperty = {
            lastPass : 0,
            passCallback : null,
            precision :  opt.precision,
            lastInfo : undefined,
            initTime : 0,
            moveBaseDist: 0,
            startPosition: undefined
        }

        this.#drawCumulativePath = defaultValue(opt.drawCumulativePath, false);
        this.#cumulativePath = undefined;
        this.#pathStyle = defaultValue(opt.pathStyle, {});
        this.#initPathPositions = [];

        // LOD 관련 프로퍼티
        const lodMode = defaultValue(opt.LODMode, 'none');
        this.#LODMode = UPDATE_MODE_ALLOWED.has(lodMode)
            ? /** @type {'none' | 'auto' | 'custom'} */ (lodMode)
            : 'none';
        this.#updateFunc = defaultValue(opt.updateFunc, undefined);
        this.#maxVisibleDistance =  defaultValue(opt.maxVisibleDistance, VISIBLE_DISTANCED);

        this.color = undefined;
        initialize.call(this);

        /**
         * 전방 시선 목표 지점까지의 거리 (m).
         *
         * @type {number}
         */
        this._forwardOffset = 500;
        this.#overlayPosition = new THREE.Vector3();
    }
    /**
     * 현재 LOD(카메라 거리 기반 자동 조정) 모드. `setLODMode` 참고.
     *
     * @returns {string} `'none'` | `'auto'` | `'custom'`
     */
    get LODMode () { return this.#LODMode;}

    /**
     * 등록된 주행 애니메이션 컨트롤러 목록. 키는 `makeAnimationController`가 만든 애니메이션 ID입니다.
     *
     * @returns {Map<string, import('@union3d/analy/UAnimationController').UAnimationController>} 애니메이션 ID → 컨트롤러
     */
    get animationControllers () {
        return this.#animationControllers;
    }

    /**
     * @deprecated 누적 이력은 더 이상 U3dComponentPosition 내부에 저장하지 않습니다. 클라이언트/서비스 단 이력을 사용하세요.
     * @returns {Array<CumulativeInfo>} 빈 배열
     */
    get cumulativeInfo () {
        return []
    }

    /**
     * 누적 경로(궤적) 기록과 통과 콜백을 관리하는 상태. 마지막 통과 index, 통과 콜백, 이동 기준 거리 등을 담습니다.
     *
     * @returns {CumulativeProperty} 누적 경로 상태 객체 (내부 상태를 직접 반환하므로 수정하면 즉시 반영됩니다)
     */
    get cumulativeProperty () {
        return this.#cumulativeProperty
    }

    /**
     * 화면에 그려진 이동 궤적(누적 경로) 객체. `drawCumulativePath`가 true인 상태로 이동해야 생성됩니다.
     *
     * @returns {import('@union3d/geometry/U3dCumulativePath').U3dCumulativePath | undefined} 궤적 객체. 아직 그려진 궤적이 없으면 undefined
     */
    get cumulativePath () {
        return this.#cumulativePath
    }

    /**
     * 주행 경로 라인에 쓰이는 재질. 생성 옵션 `drawpath`/`drawRealPath`가 true일 때만 만들어지며 그 외에는 undefined입니다.
     *
     * @returns {import('three').Material | undefined} 경로 라인 재질
     */
    get pathMaterial () {
        return this.#pathMaterial;
    }

    /**
     * 주행 경로 라인 재질을 교체합니다. 제약 사항: `THREE.Material` 인스턴스가 아니면 무시되고 기존 값이 유지됩니다.
     *
     * @param {import('three').Material} material 새 경로 라인 재질. 기본은 `LineBasicMaterial`
     */
    set pathMaterial (material) {
        if(!(material instanceof THREE.Material)) return;
        this.#pathMaterial = material;
    }

    /**
     * 주행 경로 라인의 지오메트리. 생성 옵션 `drawpath`/`drawRealPath`가 true일 때만 만들어지며 그 외에는 undefined입니다.
     *
     * @returns {import('@union3d/core/geometry/UBufferGeometry').UBufferGeometry | undefined} 경로 라인 지오메트리
     */
    get pathGeometry () {
        return this.#pathGeometry;
    }

    /**
     * 주행 경로 라인 지오메트리를 교체합니다. 제약 사항: `UBufferGeometry` 인스턴스가 아니면 무시되고 기존 값이 유지됩니다.
     *
     * @param {import('@union3d/core/geometry/UBufferGeometry').UBufferGeometry} geometry 새 경로 라인 지오메트리
     */
    set pathGeometry (geometry) {
        if(!(geometry instanceof UBufferGeometry)) return;
        this.#pathGeometry = geometry;
    }

    /**
     * 입력 경로를 상대 좌표로 보정하지 않고 원본 좌표 그대로 사용하는지 여부. 생성 옵션 `useOriginRoute`로만 정해지며 이후 변경할 수 없습니다.
     *
     * @returns {boolean} true면 원본 경로 사용
     */
    get useOriginRoute () {
        return this.#useOriginRoute;
    }

    /**
     * 주행 중 이동한 궤적(누적 경로)을 화면에 그릴지 여부.
     *
     * @returns {boolean} true면 궤적을 그림
     */
    get drawCumulativePath () {
        return this.#drawCumulativePath;
    }

    /**
     * 누적 경로 표시 여부를 설정합니다. 이미 그려진 궤적은 지우지 않으며 이후 이동부터 반영됩니다. 제약 사항: boolean이 아니면 무시됩니다.
     *
     * @param {boolean} isDraw true면 이후 이동 궤적을 그림
     */
    set drawCumulativePath (isDraw) {
        if(typeof isDraw !== "boolean") return
        this.#drawCumulativePath = isDraw;
    }

    /**
     * 생성시 참고한 model의 이름을 반환
     * @returns {string}
     */
    getModelName() {
        return this._object?.name ?? '';
    }
    /**
     * 모델의 월드 행렬을 반환하는 함수
     * @returns {import('three').Matrix4 | undefined} 모델의 월드 행렬
     */
    getMatrixWorld(){
        return this._object?.matrixWorld;
    }

    /**
     * 컴포넌트가 속한 레이어의 이름을 반환하는 함수
     * @returns {string} 레이어 이름
     */
    getLayerName(){
        return this._ulayername;
    }

    /**
     * 카메라 거리에 따른 자동 조정(LOD) 방식을 설정하는 함수. 매 프레임 `update`가 호출될 때 적용됩니다.
     * @param {'none' | 'auto' | 'custom' | string} mode `'none'` 조정 없음, `'auto'` 최대 가시화 거리 밖이면 숨김, `'custom'` `setUpdateFunc` 콜백 결과(가시화·색상·투명도 등) 적용. 그 외 값은 `'none'`으로 처리
     */
    setLODMode (mode) {
        const lowerCase = String(mode).toLowerCase();
        if (!UPDATE_MODE_ALLOWED.has(lowerCase)) {
            __GError__(this, `[setLODMode] ignored invalid: ${mode}`, '6027945');
            return;
        }
        this.#LODMode = /** @type {'none' | 'auto' | 'custom'} */ (lowerCase);
    }

    /**
     * 현재 LOD(카메라 거리 기반 자동 조정) 모드를 반환하는 함수
     * @returns {string} `'none'` | `'auto'` | `'custom'`
     */
    getLODMode () {
        return this.#LODMode;
    }

    /**
     * LOD 모드가 `'auto'`일 때 컴포넌트를 표시할 카메라 최대 거리를 설정하는 함수. 카메라가 이보다 멀어지면 자동으로 숨겨집니다.
     * @param {number} dist 최대 가시화 거리 (m). NaN이면 기본값 1000으로 되돌립니다
     */
    setMaxVisibleDistance (dist) {
        this.#maxVisibleDistance = Number.isNaN(dist) ? VISIBLE_DISTANCED : dist;
    }

    /**
     * `'auto'` LOD에서 컴포넌트가 표시되는 카메라 최대 거리를 반환하는 함수
     * @returns {number} 최대 가시화 거리 (m)
     */
    getMaxVisibleDistance () {
        return this.#maxVisibleDistance;
    }

    /**
     * 매 프레임 호출되어 카메라 거리를 갱신하고 LOD 모드에 따라 가시화·스타일을 조정하는 함수. 보통 레이어가 호출합니다.
     * @param {import('three').Vector3} camPos 카메라 위치 (월드 좌표)
     * @param {boolean} isIdle 카메라가 멈춰 있는지 여부. true면 LOD 계산을 생략합니다
     * @param {number} [curTime] 현재 시각 (ms). 믹서 FPS 조절에 사용
     */
    update(camPos, isIdle, curTime) {
        //------- LOC 설정 -----------
        if(isIdle && !this._animation) return;
        const camDistSq = this.updateCameraDistance(camPos);

        if(isIdle) return;
        if (this.#LODMode !== 'none') {
            this.#applyLOD(camDistSq);
        }
    }

    /**
     * 카메라와 컴포넌트 사이 거리를 다시 계산해 내부 캐시를 갱신하는 함수
     * @param {import('three').Vector3 | undefined} camPos 카메라 위치 (월드 좌표). 없으면 거리를 무한대로 처리
     * @returns {number} 카메라 거리의 제곱 (m²)
     */
    updateCameraDistance(camPos) {
        if (!defined(camPos)) return this.#lastDistance;

        TEMP_TO_UPDATE.subVectors(this.position, camPos);
        const camDistSq = TEMP_TO_UPDATE.lengthSq();
        this.#lastDistance = camDistSq;
        this._mixerController?.setCameraDistanceSq?.(camDistSq);
        return camDistSq;
    }

    /**
     * 모델 자체 애니메이션(클립)의 갱신 빈도를 설정하는 함수. 낮추면 먼 컴포넌트의 연산 부담이 줄어듭니다.
     * @param {number} fps 초당 갱신 횟수
     */
    setMixerFPS(fps) {
        this._mixerController?.setFPS(fps);
    }

    /**
     * LOD 모드가 `'custom'`일 때 매 프레임 호출할 사용자 콜백을 설정하는 함수. 콜백이 반환한 `LOD_Info`의 가시화·색상·투명도·텍스처 제외 값이 컴포넌트에 적용됩니다.
     * @param {LOD_UpdateFunc} func `(component, properties, cameraDistance(m), cameraDistanceSq) => LOD_Info` 형태의 콜백
     */
    setUpdateFunc (func) {
        if(typeof func !== "function") {
            __GError__(this, `입력한 파라미터가 함수 형식이 아닙니다. 입력 파라미터 : ${func}`, '6028995');
            return;
        }
        this.#updateFunc = func;
    }

    /**
     * `setUpdateFunc`로 설정한 custom LOD 콜백을 반환하는 함수
     * @returns {LOD_UpdateFunc | undefined} 설정된 콜백. 없으면 undefined
     */
    getUpdateFunc () {
        return this.#updateFunc
    }

    /**
     * @param {number} camDistSq 카메라 거리 상수
     * @param {number | undefined} [camDist] 카메라 거리
     */
    #applyLOD(camDistSq, camDist = undefined) {
        /** @type {LOD_Info} */
        let updateInfo = {};
        if (this.#LODMode === 'auto') { // 'auto' 자동 LOD
            updateInfo.visible = this.#setAutoUpdate(camDistSq);
        } else if (this.#LODMode === 'custom') { // 'custom' 사용자 설정 LOD
            if (!Number.isFinite(camDist)) camDist = Math.sqrt(Math.max(0, camDistSq));
            const resolvedCamDist = Number.isFinite(camDist) ? Number(camDist) : 0;
            updateInfo = this.#updateFunc?.(this, /** @type {UnknownRecord} */ (this.getProperties()), resolvedCamDist, camDistSq) ?? updateInfo;
        }

        if(defined(updateInfo.visible)) {
            if(updateInfo.visible !== this._show) {
                if(updateInfo.visible) this.show();
                else this.hide();

                if(this.userData && this.userData.verticalObjects){
                    this.userData.verticalObjects.forEach(/** @param {import('three').Object3D} group */ (group)=>{
                        group.visible = updateInfo.visible === true;
                    })
                }
            }
        }

        if(defined(updateInfo.color)) {
            this.setColor(updateInfo.color);
        }

        if(defined(updateInfo.opacity)) {
            let opacity = Number(updateInfo.opacity);
            if(Number.isFinite(opacity)) {
                this.setOpacity(opacity);
            }
        }

        if(defined(updateInfo.exceptTexture)) {
            if (!defined(this.instanceId) && typeof updateInfo.exceptTexture === "boolean") {
                this.exceptTexture(updateInfo.exceptTexture);
            }
        }

        if(defined(updateInfo.depthWrite)) {
            this.setDepth(updateInfo.depthWrite);
        }
    }

    /**
     * @param {number} camDistSq 카메라 거리 상수
     * @returns {boolean} 자동 업데이트 여부
     */
    #setAutoUpdate (camDistSq) {
        let maxDist = this.#maxVisibleDistance;
        if(!Number.isFinite(maxDist)) maxDist = VISIBLE_DISTANCED;
        return camDistSq <= (maxDist * maxDist);
    }

    /**
     * 컴포넌트 위경도 좌표를 반환하는 함수
     * @returns {GeoPositionVector3} 컴포넌트 위경도 좌표
     */
    getPosition  () {
        const app = this.drawArg?._app;
        if (!defined(app)) return this.position;
        return app.vector3ToGeoGraphic(this.position);
    }

    /**
     * @deprecated getWorldPosition() 메서드를 사용하세요
     * 컴포넌트 3D 월드 좌표를 반환하는 함수
     * @returns {WorldPositionVector3} 컴포넌트 3D 월드 좌표
     */
    getVectorPosition () {
        return this.position ?? new THREE.Vector3(0, 0, 0);
    }

    /**
     * 컴포넌트 3D 월드 좌표를 반환하는 함수
     * @returns {WorldPositionVector3} 컴포넌트 3D 월드 좌표
     */
    getWorldPosition () {
        return this.position ?? new THREE.Vector3(0, 0, 0);
    }

    /**
     * 컴포넌트 가시화 상태를 반환하는 함수 <br>
     * 가시화 상태면  true, 아니면 false
     * @returns {boolean}
     */
    isVisible() {
        return this._show === true;
    }

    /**
     * 컴포넌트가 해제되었거나 생성에 실패했는지 여부를 반환합니다. true인 객체는 다른 메서드를 호출해도 동작하지 않습니다.
     *
     * @returns {boolean} 해제·생성 실패 상태면 true
     */
    isDisposed() {
        return this.#disposed;
    }

    /**
     * 애니메이션 시 컴포넌트의 이동 속도를 지정하는 함수
     * @param {number} speed 이동 속도 (km/h). 1500을 넘으면 무시됩니다. 주행 중이면 다음 프레임부터 반영됩니다
     */
    setSpeed(speed) {
        if (speed > 1500) {
            console.info("maximum speed is 1500(km/s)")
            return;
        }
        this.newSpeed = speed;
        this.needToChange = true;

        // 현재 애니메이션 중이 아니면
        if(this._animation === false) {
            this.speed = speed
            this.needToChange = false;
        }

    }

    /**
     * 애니메이션 시 컴포넌트의 이동속도를 반환하는 함수
     * @returns {number} 이동 속도 (km/h)
     */
    getSpeed() {
        return this.speed;
    }

    /**
     * 컴포넌트의 모델 리소스를 반환하는 함수
     * @returns {import('three').Object3D | undefined} 모델 데이터 리소스
     */
    getObject() {
        return this._object;
    }

    /**
     * 컴포넌트가 instanced 메시(같은 모델을 한 번의 드로우로 여러 개 그리는 방식)로 생성되었는지 반환하는 함수
     * @returns {boolean} instanced 메시면 true
     */
    getInstanced() {
        return this._setInstanced
    }

    /**
     * 컴포넌트가 `position`에서 `lookAt`을 바라볼 때의 회전(pitch·yaw)을 계산하는 함수
     * @param {WorldPositionVector3} lookAt 바라보는 위치 좌표 (월드 좌표, EPSG:3857)
     * @param {WorldPositionVector3} position 위치 좌표 (월드 좌표, EPSG:3857)
     * @returns {import('three').Euler} 회전 값 (라디안). 내부 공용 객체를 반환하므로 보관하려면 복사하세요
     */
    getPitchYaw (lookAt, position) {
        // 현재 회전을 반영한 경로 진행 방향을 계산합니다. 반환 Euler는 기존처럼 공용 객체입니다.
        return INTERNAL.calculatePitchYaw(this, lookAt, position);
    }

    /**
     * 등록된 주행 애니메이션 컨트롤러를 모두 제거하고 현재·시작 애니메이션 ID를 초기화합니다. <br>
     * 주의 사항: 진행 중인 주행이 즉시 멈추며, 다시 주행하려면 경로를 새로 등록해야 합니다.
     */
    disposeAnimationControllers () {
        this._animation = false;

        this.#animationControllers.clear();
        //이벤트 시기가 맞물리는 경우 dispose 시점과 compelete 되는 시점이 맞물리면..
        // undefined하는건 너무 위험.
        // this.#animationControllers = undefined;
        this._animationId = undefined;
        this._startAnimationId = undefined;
    }

    // getCumulativeDistance () {
    //    const info = this.#getLastCumulativeInfo();
    //    if(!defined(info)) return;
    //
    //    return info.cumulativeDist;
    // }

    /**
     * @param {Array<CumulativeInfo>} infos 누적경로에 대한 정보 목록
     * @param {number} target 검색 이동한 거리
     * @returns {number} 경로 인덱스
     *
     * @ignore
     */
    #binarySearchByCumulativeDist(infos, target) {
        let low = 0;
        let high = infos.length - 2; // 마지막은 b용이므로 -2까지

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const d0 = infos[mid].cumulativeDist;
            const d1 = infos[mid + 1].cumulativeDist;

            if (target >= d0 && target <= d1) {
                return mid; // target은 mid ~ mid+1 사이에 있음
            } else if (target < d0) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }
        return -1; // 못 찾았을 경우
    }


    /**
     * @param {WorldPositionVector3} p 대상 위치
     * @param {WorldPosition} start 시작 위치
     * @param {WorldPosition} end 종료 위치
     * @param {number} [epsilon=1e-6] 임계 상수
     * @returns {boolean} 경로 사이 위치 여부
     *
     * @ignore
     */
    #isPointOnSegment(p, start, end, epsilon = 1e-6) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dpx = p.x - start.x;
        const dpy = p.y - start.y;

        const dot = dpx * dx + dpy * dy;
        const lenSq = dx * dx + dy * dy;

        return dot >= -epsilon && dot <= lenSq + epsilon;
    }

    /**
     * @param {Array<CumulativeInfo>} pathInfo 누적 경로 정보 목록
     * @param {WorldPositionVector3} point 위치 정보
     * @returns {number | undefined} 해당 point 위치에 대항 경로 인덱스
     */
    #getLastDrawPathInfo (pathInfo, point) {
        if(!defined(pathInfo)) return;
        if(pathInfo.length < 1 ) return;

        let lastInfoIdx = 0;
        for (let i=0; i< pathInfo.length -1; i++) {
            const start = pathInfo[i].world;
            const end = pathInfo[i+1].world;

            const dist = this.#isPointOnSegment(point, start, end);
            if (dist) {
                lastInfoIdx =  i+1;
            }
        }
        return lastInfoIdx;
    }

    /**
     * 누적 경로(궤적)를 켜는(show) 함수
     */
    showCumulativeRoute () {
        const path =  this.#cumulativePath;
        if(!defined(path) || path.visible) return;
        path.show?.();
        this.#drawCumulativePath = true;

    }

    /**
     * 누적 경로(궤적)를 끄는(hide) 함수
     */
    hideCumulativeRoute () {
        const path =  this.#cumulativePath;
        if(!defined(path) || !path.visible) return;

        path.hide?.();
        this.#drawCumulativePath = false;
    }

    /**
     * 누적 경로(궤적)를 제거하는 함수
     */
    removeCumulativeRoute () {
        this.#cumulativePath?.dispose?.();
        this.#cumulativePath = undefined;
        this.#drawCumulativePath = false;
    }

    /**
     * 누적 경로(궤적)의 스타일을 변경하는 함수
     * @param {U3dCumulativePath_StyleOpt} opt 변경 옵션
     */
    setCumulativePathStyle (opt) {
        opt = opt || {};
        const prevTailPolicy = this.#pathStyle.tailPolicy;
        const nextTailPolicy = opt.tailPolicy;
        this.#pathStyle = {
            ...this.#pathStyle,
            ...opt,
            tailPolicy: defined(nextTailPolicy)
                ? {...(prevTailPolicy || {}), ...nextTailPolicy}
                : prevTailPolicy,
        };

        if(this.#cumulativePath === undefined) return;

        this.#cumulativePath.setPathStyle(opt);
    }

    /**
     * 누적 경로(궤적)의 초기 좌표 값(이전 히스토리)을 설정하는 함수.
     * @param {Array<GeoPositionVector3>} positions 위경도 좌표 배열
     */
    setInitPathPositions(positions) {
        if (!defined(positions)) return;

        const app = this.drawArg?._app;
        if (!defined(app)) return;

        // 유효한 위경도 좌표 검사
        const isValidPoint = (/** @type {GeoPositionVector3 | undefined} */ p) => p &&
            Number.isFinite(p.x) &&
            Number.isFinite(p.y) &&
            Number.isFinite(p.z);

        if (!Array.isArray(positions)) return;

        const valid = positions.filter(isValidPoint);

        let cumulativeDist = 0;
        // 기존 초기 경로 데이터 초기화
        this.#initPathPositions.length = 0;
        for (let i = 0; i < valid.length; i++) {
            const position = valid[i];
            const prev = i > 0 ? valid[i - 1] : position;

            // 위경도 좌표를 월드 좌표로 변환 (EPSG:4326 -> EPSG:3857)
            const worldPosition = app.geographicToVector3(position);
            const prevPosition = i > 0 ? app.geographicToVector3(prev) : worldPosition;

            // 이전 지점과 현재 지점 사이 거리
            const section = i > 0 ? worldPosition.distanceTo(prevPosition) : 0;

            cumulativeDist += section;

            const speedMs = this.speed / 3.6;
            const time = speedMs > 0 ? cumulativeDist / speedMs * 1000 : 0;

            // 누적 경로 초기 생성을 위한 포맷
            const info = {
                world: worldPosition,
                geographic: {
                    x: position.x,
                    y: position.y,
                    z: position.z
                },
                speed: this.speed,
                section,           // 구간 거리
                sectionIndex: i,   // 구간 인덱스
                cumulativeDist,    // 누적 거리
                isPassed: true,
                time
            };

            // U3dCumulativePath 초기 생성용 데이터
            this.#initPathPositions.push({
                position,
                dist: cumulativeDist,
                time
            });
            this.#cumulativeProperty.lastInfo = info;

        }
    }

    /**
     * 컴포넌트 회전 시 절대 축이 아니라 현재 컴포넌트의 회전 값 기준으로 회전시키는 함수
     * @param {DegreeEulerLike} rotation 회전각
     */
    setRotationRelative(rotation) {
        const radianX = THREE.MathUtils.degToRad(rotation.x);
        const radianY = THREE.MathUtils.degToRad(rotation.y);
        const radianZ = THREE.MathUtils.degToRad(rotation.z);

        const object = this._object;
        if (!defined(object)) return;

        object.traverse(/** @param {import('three').Object3D} mesh */ (mesh) => {
            if (mesh instanceof THREE.Mesh || mesh instanceof UMesh) {
                mesh.rotateX(radianX);
                mesh.rotateY(radianY);
                mesh.rotateZ(radianZ);
            }
        });
        const children = this.getChildren();
        if(children && children.length > 0){ // 각 하위 계층들도 각 컴포넌트 기준으로 회전
            for(const child of children) {
                if (child instanceof U3dComponentPosition) {
                    child.setRotationRelative(rotation);
                }
            }
        }
    }

    /**
     * @param {DegreeEulerLike} rotation 절대 / 상대 기준으로 회전 ( 각도 단위 )
     * @param {"absolute" | "relative"} [axis="absolute"] 회전 방식 ( 절대 : "absolute" / 상대 : "relative" )
     *
     * @ignore
     */
    #setRotationByAxisType(rotation, axis="absolute") {
        if(!defined(rotation)) return;

        if(axis === "absolute") {
            let radianX = (Math.PI / 180) * rotation.x;
            let radianY = (Math.PI / 180) * rotation.y;
            let radianZ = (Math.PI / 180) * rotation.z;

            this.setRotation({x: radianX, y: radianY, z:radianZ});
        }else if (axis === "relative") {
            this.setRotationRelative(rotation);
        } else {
            console.warn("setRotationByAxisType 함수 두번째 파라미터 axis는 \"absolute\" 또는 \"relative\" 만 허용합니다.");
        }
    }

    /**
     * 전체 누적 정보 기록을 가져오는 함수
     * @deprecated 누적 이력은 더 이상 U3dComponentPosition 내부에 저장하지 않습니다. 클라이언트/서비스 단 이력을 사용하세요.
     * @returns {Promise<Array<CumulativeInfo>>} 빈 배열
     */
    async getCumulativeInfo() {
        return [];
    }


    /**
     * @deprecated 누적 이력은 더 이상 U3dComponentPosition 내부에 저장하지 않습니다. 클라이언트/서비스 단 이력을 사용하세요.
     * @returns {Promise<Array<CumulativeInfo>>} 빈 배열
     */
    async getPassedCumulativeInfo() {
        return [];
    }

    /**
     * @param {GeoPositionVector3 | undefined} geo 위경도 좌표
     * @param {WorldPositionVector3 | undefined} world 월드 좌표
     * @deprecated 누적 이력은 더 이상 U3dComponentPosition 내부에 저장하지 않습니다. 클라이언트/서비스 단 이력을 사용하세요.
     * @returns {Promise<Map<number, CumulativeInfo>>}
     */
    async getCumulativeInfoByPoint(geo, world) {
        return new Map();
    }

    /**
     * @param {import('three').Object3D | U3dComponentPosition | undefined} object
     * @param {import('three').Vector3 | undefined} position
     * @param {import('three').Quaternion | undefined} quaternion
     * @param {import('three').Euler | undefined} rotation
     * @param {import('three').Vector3 | undefined} scale
     *
     * @ignore
     */
    #objectUpdate(object, position, quaternion, rotation, scale){
        if(!object) return;
        if(!position || !(position instanceof THREE.Vector3)) return;
        if(!quaternion || !(quaternion instanceof THREE.Quaternion)) return;
        if(!rotation || !(rotation instanceof THREE.Euler)) return;
        if(!scale || !(scale instanceof THREE.Vector3)) return;

        object.position.copy?.(position);
        object.quaternion.copy(quaternion);
        object.rotation.copy(rotation);

        object.scale.copy?.(scale);
    }

    /**
     * 현재 위치에서 목표 위경도 좌표까지 보간 이동을 시작하거나 이동 대기열에 추가합니다.<br>
     * 이동 중 다시 호출하면 현재 목표를 중단하지 않고 새 목표를 대기열 끝에 추가합니다.<br>
     * `drawCumulativePath`가 true이면 이동 중인 위치를 누적 경로에 기록합니다.<br>
     * 유효한 목표 좌표 또는 이동 거리를 만들 수 없으면 이동을 예약하지 않고 완료합니다.
     *
     * @param {MoveSmoothlyOpt} [opt={}] 목표 위치, 회전, 이동 시간 등을 지정하는 옵션
     * @param {PassCallback} [complete] 각 목표 위치 도착 후 호출할 콜백. 이후 호출에서 새 콜백을 지정하기 전까지 같은 콜백을 사용합니다.
     * @returns {Promise<void>} 이동 시작 또는 대기열 등록 처리가 끝나면 완료되는 Promise. 목표 위치 도착 완료를 의미하지 않습니다.
     *
     * @example 목표 위치까지 1초 동안 보간 이동을 예약합니다.
     * const completedCallback = function ({name, key, distance, time}) {
     *     const message = `[${name}] ${key}번 목표 도착 · 누적 거리 ${distance.toFixed(2)}m · 경과 시간 ${(time / 1000).toFixed(2)}초`;
     *     console.info(message);
     * };
     *
     * await component.moveSmoothly({
     *     position: {x: lon, y: lat, z: height},
     *     rotation: {x: 0, y: 0, z: 90},
     *     axis: 'relative',
     *     durationMs: 1000
     * }, completedCallback);
     */
    async moveSmoothly(opt = {}, complete = undefined) {
        const self = this;
        const app = this.drawArg?._app;
        if (!defined(app)) return;

        if (!defined(opt.position) || !defined(opt.position.x) || !defined(opt.position.y) || !defined(opt.position.z)) return;
        const position = opt.position;

        const worldPosition = app.geographicToVector3(position);
        if (!defined(worldPosition)) return;


        let useRotation = false;
        if (defined(opt.rotation)) {
            const rot = opt.rotation;
            if (defined(rot.x) && defined(rot.y) && defined(rot.z)) {
                this.#setRotationByAxisType(rot, opt.axis);
                useRotation = true;
            }
        }

        if (typeof complete === "function")
            this.#cumulativeProperty.passCallback = complete;

        //-----  애니메이션 연산  -----//
        const start = self.position.clone();
        const end = worldPosition.clone();
        const dist = start.distanceTo(end);
        if (!Number.isFinite(dist) || dist <= 0) return;

        const animationID = UDEF.COMPONENT_ANIMATION.MOVE_SMOOTHLY;
        let animation = self.#animationControllers.get(animationID);
        const durationMs = opt.durationMs == null ? undefined : Number(opt.durationMs);

        // -------- 애니메이션 최초 생성  --------//
        if (!defined(animation)) {
            self._nowDistance = 0;
            /** @type {SmoothAniContext} */
            const ctx = {
                useRotation,
                delayCount: 0,
                count: 0
            };

            // -------- instanced 분기 처리 --------//
            if (self._setInstanced && defined(self.componentLayer?._instancedMaxCount)) {
                const object = /**@type{InstancedComponent}*/ (/** @type {unknown} */(self)).instancedGroup;
                const rawInstanceId = self.getInstancedId?.();
                const instanceId = typeof rawInstanceId === 'number'
                    ? rawInstanceId % self.componentLayer._instancedMaxCount
                    : -1;
                Object.assign(ctx, {object, instanceId})
            }

            animation = this.#createMoveSmoothAnimation(animationID, ctx);
            if (!defined(animation)) return;
            this._animationId = animationID;
            this._startAnimationId = animationID;
            this._animation = true;
            animation.setSegment(start, end, durationMs);
            animation.start();
            return;
        }
        if (!defined(animation)) return;

        this._animation = true;

        if (!animation.isRunning && !animation.isPaused) {
            animation.setSegment(start, end, durationMs);
            animation.start();
        } else if (animation.isPaused) {
            animation.appendWaypoint(end, durationMs);
            animation.resume();
        } else {
            animation.appendWaypoint(end, durationMs);
        }
    }

    /**
     * @param {string} animationID
     * @param {SmoothAniContext} ctx
     * @returns {import('@union3d/analy/UAnimationController').UAnimationController | undefined}
     *
     * @ignore
     */
    #createMoveSmoothAnimation(animationID, ctx) {
        const self = this;
        const animation = this.makeAnimationController(
            animationID,
            /** @this {import('@union3d/analy/UAnimationController').UAnimationController} */
            function (/** @type {number} */ deltaTime, /** @type {number} */ distanceRate) {
                moveFromTo(
                    self,
                    /** @type {UAnimationController} */(this),
                    /** @type {import('@union3d/analy/UDrivingAnimation').DrivingSmoothAniContext} */(/** @type {unknown} */ (ctx)),
                    deltaTime,
                    distanceRate
                );
            }
        );
        if (!defined(animation)) return undefined;
        animation.on('arrive', function (/** @type {U3dComponentPositionArriveEvent} */ event) {
            // 사용자 콜백의 등록 여부와 무관하게, 콜백이 위치를 바꾸기 전에 도착점을 보관한다.
            const arrived = self.position;
            if (!self.#disposed && Number.isFinite(arrived.x) && Number.isFinite(arrived.y) && Number.isFinite(arrived.z)) {
                self.#waypointHistory.push({point: arrived.clone(), time: Date.now()});
                if (self.#waypointHistory.length > WAYPOINT_HISTORY_LIMIT) self.#waypointHistory.shift();
            }
            const callback = self.#cumulativeProperty.passCallback;
            if (typeof callback !== "function") return;

            const data = event?.data ?? {};
            self.#cumulativeProperty.lastPass += 1;

            try {
                callback.call(self, {
                    name: self.name,
                    key: self.#cumulativeProperty.lastPass,
                    distance: Number(data.dist) || self.distance || 0,
                    time: Number(data.time) || Date.now(),
                    speed: Number(data.speed) || self.speed
                });
            } catch (e) {
                console.warn(`[UInfoCumulativePath] moveSmoothly 도착 콜백 오류:`, e);
            }
        });
        return animation;
    }

    /**
     * @param {WorldPositionVector3} position
     * @param {number} dist
     * @param {number} time
     *
     * @ignore
     */
    #updateCumulativePath (position, dist, time) {
        const path = this.#cumulativePath;
        if (!defined(path)) return;

        const scene = this.scene;
        if (!defined(scene)) return;

        try {
            path.updatePath(position, dist, time);
        }catch (e) {
            console.warn(`[${this.name}] U3dCumulativePath updatePath 실패:`, e);
        }
    }

    /**
     * @param {number} distance
     * @param {number} time
     *
     * @ignore
     */
    #createCumulativePath(distance , time) {
        // return;
        if (defined(this.#cumulativePath)) return;
        const app = this.drawArg?._app;
        if (!defined(app)) return;

        const style = this.#pathStyle;

        let offset = 0;
        if (defined(this._bbox)) {
            const size = new THREE.Vector3(0, 0, 0);
            this._bbox.getSize(size);
            offset = isNaN(size.x) ? 0 : Math.floor(size.x);
        }
        offset = defined(style.drawOffset) ? style.drawOffset : offset;

        if(this.#initPathPositions.length > 0) {
            const last = this.#initPathPositions[this.#initPathPositions.length-1];
            if (!defined(last)) return;
            const geoPosition = this.getGeographicPosition();
            if (!defined(geoPosition)) return;
            this.#initPathPositions.push({
                position : geoPosition,
                dist : last.dist + distance,
                time : last.time + time
            })
        }
        const pathColor = defined(style.color) ? style.color : this.pathColor;
        const pathOpacity = defined(style.opacity) ? style.opacity : this.pathOpacity;
        const pathWidth = defined(style.width) ? style.width : this._pathWidth;

        this.#cumulativePath = new U3dCumulativePath({
            app: app,
            scene: this.scene,
            targetName: this.name,
            precision : this.#cumulativeProperty.precision,
            pathStyle: {
                color: pathColor,
                opacity: pathOpacity,
                width: pathWidth,
                type: /** @type {'tail' | 'pipe'} */ (style.type),
                lineType: style.lineType,
                colorGradation: style.colorGradation,
                styleFunc: /** @type {U3dCumulativePathStyleFunc} */ (style.styleFunc),
                smooth: /** @type {boolean} */ (style.smooth),
                smoothFactor: /** @type {number} */ (style.smoothFactor),
                smoothMaxDistance: /** @type {number} */ (style.smoothMaxDistance),
                tailPolicy: /** @type {USimpleTail_Policy} */ (style.tailPolicy),
                drawOffset: offset
            },
            initPositions: this.#initPathPositions
        });
        if(this.#cumulativePath) {
            this.#initPathPositions = [];
            this.#cumulativePath.show();
        }

    }

    /**
     * 현재 위치를 누적 경로에 기록한다.
     * moveSmoothly, addMovePoint, setPosition 등 위치 변경 진입점에서 공통으로 사용한다.
     * @param {WorldPositionVector3} position 기록할 월드 좌표
     * @param {number} [dist] 애니메이션 컨트롤러 기준 누적 거리
     * @param {number} [time] 애니메이션 컨트롤러 기준 누적 시간(ms)
     * @param {number} [speed] 현재 속도(m/s)
     * @param {number} [moveDistance] 이번 프레임 이동 거리U
     */
    recordCumulativePathFrame(position, dist = undefined, time = undefined, speed = undefined, moveDistance = undefined) {
        if (!defined(position)) return;

        const x = Number(position.x);
        const y = Number(position.y);
        const z = Number(position.z);
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;

        const path = this.#cumulativePath;
        const currentPathDist = path?.cumulativeDist ?? 0;
        const infoBaseDist = this.#cumulativeProperty.lastInfo?.cumulativeDist ?? 0;
        let resolvedDist = Number(dist);
        //
        // if (Number.isFinite(resolvedDist)) {
        //     resolvedDist += infoBaseDist;
        //     const frameDistance = Number(moveDistance);
        //     if (
        //         defined(path) &&
        //         resolvedDist <= currentPathDist &&
        //         Number.isFinite(frameDistance) &&
        //         frameDistance > 0
        //     ) {
        //         resolvedDist = currentPathDist + frameDistance;
        //     }
        // } else {
        //     const lastPoint =
        //         path?.lastUpdatePoint ??
        //         this.#cumulativeProperty.startPosition ??
        //         this.#cumulativeProperty.lastInfo?.world;
        //     let section = 0;
        //     if (defined(lastPoint)) {
        //         const prev = lastPoint instanceof THREE.Vector3
        //             ? lastPoint
        //             : new THREE.Vector3(lastPoint.x, lastPoint.y, lastPoint.z);
        //         section = prev.distanceTo(new THREE.Vector3(x, y, z));
        //     }
        //     resolvedDist = currentPathDist + section;
        // }

        if (!Number.isFinite(resolvedDist)) return;

        let resolvedTime = Number(time);
        // if (!Number.isFinite(resolvedTime)) {
        //     const frameDistance = Number(moveDistance);
        //     const directDistance = defined(path)
        //         ? Math.max(0, resolvedDist - currentPathDist)
        //         : 0;
        //     const distanceForTime = Number.isFinite(frameDistance) && frameDistance > 0
        //         ? frameDistance
        //         : directDistance;
        //     const speedMs = Number(speed);
        //     const elapsed = speedMs > 0 ? distanceForTime / speedMs * 1000 : 0;
        //     resolvedTime = (this.#cumulativeProperty.initTime ?? 0) + elapsed;
        // }
        if (!Number.isFinite(resolvedTime)) resolvedTime = 0;

        if (defined(this.#cumulativePath)) {
            this.#updateCumulativePath(position, resolvedDist, resolvedTime);
        } else if (this.#drawCumulativePath) {
            this.#createCumulativePath(resolvedDist, resolvedTime);
            this.#updateCumulativePath(position, resolvedDist, resolvedTime);
        }

        this.#cumulativeProperty.moveBaseDist = resolvedDist;
        this.#cumulativeProperty.initTime = resolvedTime;
        this.#cumulativeProperty.startPosition = {x, y, z};

    }

    /**
     * 컴포넌트 누적 경로를 반환하는 메서드입니다.
     * @returns {import('@union3d/geometry/U3dCumulativePath').U3dCumulativePath|undefined} 누적 경로가 없으면 undefined
     */
    getCumulativePath () {
        return this.#cumulativePath;
    }
    /**
     * 경로 진행률에 해당하는 시선 방향 목표 지점을 계산하는 함수 (경로 주행 중 카메라·모델이 바라볼 곳)
     * @param {number} distanceRate 경로 진행률 (0 시작점 ~ 1 끝점)
     * @param {import('three').Vector3} pathPosition 경로상 현재 위치 (월드 좌표)
     * @returns {import('three').Vector3 | undefined} 바라볼 위치 (월드 좌표). 경로가 없으면 undefined
     */
    getLookAtFromPitchRollYaw (distanceRate, pathPosition) {
        let lookAt;
        let pitch = undefined;
        let yaw = undefined;
        let roll = undefined;

        if (defined(this._splinePitch))
            pitch = this._splinePitch.getPointAt(distanceRate);

        if (defined(this._splineYaw))
            yaw = this._splineYaw.getPointAt(distanceRate);

        if (defined(this._splineRoll))
            roll = this._splineRoll.getPointAt(distanceRate);

        const offset = this._forwardOffset ?? 500;

        if (pitch && yaw && roll) {
            //+ 물체에 대한 진북
            // 원본 경로 방향으로부터 카메라 북쪽 기준 회전을 계산합니다.
            const objectNorth = INTERNAL.toHalfAngleRadians(-135);
            const a = new THREE.Euler(-UDEF.radians(-pitch.z), -UDEF.radians(-roll.z), objectNorth + UDEF.radians(-yaw.z), 'XYZ');
            const pos = this.position.clone();
            const pos2 = this.position.clone();
            pos2.normalize();
            pos2.applyEuler(a);
            lookAt = new THREE.Vector3(pos.x + pos2.x, pos.y + pos2.y, pos.z + pos2.z);
        } else {
            if (this._addstartend) {
                const spline = this._spline;
                if (!spline || !Array.isArray(spline.points) || spline.points.length < 3) return lookAt;
                const points = spline.points;
                const length = points.length;
                if (this._turnPointIndex <= 2) {
                    const vec = new THREE.Vector3().lerpVectors(pathPosition, points[2], 0.001);
                    lookAt = new THREE.Vector3(vec.x, vec.y, pathPosition.z);
                } else if (this._turnPointIndex >= points.length - 1) {
                    // 경로 끝 구간 — 마지막 진입 방향 유지
                    const start = Math.max(0, length - 3);
                    const end   = Math.max(0, length - 2);

                    const dir = new THREE.Vector3()
                        .subVectors(points[end], points[start])
                        .normalize();

                    lookAt = new THREE.Vector3(
                        pathPosition.x + dir.x * offset,
                        pathPosition.y + dir.y * offset,
                        pathPosition.z
                    );
                }
            }
        }
        return lookAt;
    }

    /**
     * 이전 경로 객체를 제거하고 그 객체가 단독 소유한 렌더 자원을 정리합니다.
     * 여러 경로 선이 공유하는 pathMaterial은 컴포넌트가 해제할 때까지 유지합니다.
     *
     * @param {undefined | ModelMesh} oriSplineObject 정리할 이전 경로 객체입니다.
     *
     * @ignore
     */
    _initSplineObject(oriSplineObject) {
        if (!defined(oriSplineObject)) return;
        this.scene.remove(oriSplineObject);
        // 공통 정리에 들어가기 전에 컴포넌트 소유의 공유 재질을 분리한다.
        if (oriSplineObject.material === this.#pathMaterial) oriSplineObject.material = undefined;
        UDEF.disposeObject3D(oriSplineObject);
    }


    /**
     * movePointList의 좌표 목록으로 경로를 생성합니다.
     * @param {import('three').BufferGeometry} geometry
     * @param {import('three').BufferGeometry} oriGeometry
     *
     * @ignore
     */
    _drawPath(geometry, oriGeometry) {
        this._initSplineObject(this.oriSplineObject);
        this._initSplineObject(/** @type {ModelMesh} */ (/** @type {unknown} */ (this.splineObject)));
        const spline = this._spline;
        if (!spline) return;

        if (this.drawPath) {
            const pts = spline.points;
            if (!defined(this._pathDrawOrigin)) {
                this._pathDrawOrigin = new THREE.Vector3();
            }
            const origin = this._pathDrawOrigin;
            if (pts && pts.length > 0) {
                let ox = 0;
                let oy = 0;
                let oz = 0;
                for (let i = 0; i < pts.length; i++) {
                    ox += pts[i].x;
                    oy += pts[i].y;
                    oz += pts[i].z;
                }
                const inv = 1 / pts.length;
                origin.set(ox * inv, oy * inv, oz * inv);
            } else {
                origin.set(0, 0, 0);
            }
            const array = new Float32Array((pts?.length ?? 0) * 3);
            for (let i = 0; i < (pts?.length ?? 0); i++) {
                const o = i * 3;
                const p = pts[i];
                array[o] = p.x - origin.x;
                array[o + 1] = p.y - origin.y;
                array[o + 2] = p.z - origin.z;
            }
            oriGeometry.attributes.position = new THREE.BufferAttribute(array, 3);
            this.oriSplineObject = new THREE.Line(oriGeometry, this.#pathMaterial);
            this.oriSplineObject.computeLineDistances();
            this.oriSplineObject.position.copy(origin);
            this.scene.add(this.oriSplineObject);

            if (this.typePath === 'cube') {
                this.splineObject = new U3dPathGeometry().createPathMesh(
                    spline.points,
                    {
                        app: this.drawArg._app,
                        minheight: 0,
                        maxheight: this._pathHeight * 2,
                        segments: 200,
                        width: this._pathWidth,
                        transparent: this.pathOpacity < 1,
                        opacity: this.pathOpacity,
                        edge: this._pathEdge,
                        color: this.pathColor
                    }
                );
                this.scene.add(this.splineObject);
            }
        }
    }

    _drawRealPath(/** @type {import('three').BufferGeometry & VerticesExt} */ geometry) {
        this._initSplineObject(this.tempsplineObject);

        /**
         * @param {Array<import('three').Vector3>} vertices
         * @param {import('three').Vector3} origin
         * @returns {import('three').BufferGeometry}
         *
         * @ignore
         */
        const buildLineGeometryByVertices = (vertices, origin) => {
            const count = vertices ? vertices.length : 0;
            const pos = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                const p = vertices[i];
                const o = i * 3;
                pos[o] = p.x - origin.x;
                pos[o + 1] = p.y - origin.y;
                pos[o + 2] = p.z - origin.z;
            }
            const lineGeometry = new THREE.BufferGeometry();
            lineGeometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            return lineGeometry;
        };

        if (this.drawRealPath) {
            if (this.typePath === 'cube') {
                if (!defined(this._realPathDrawOrigin)) {
                    this._realPathDrawOrigin = new THREE.Vector3();
                }
                const origin = this._realPathDrawOrigin;
                const vertices = geometry?.vertices ?? this._reductionSpline?.points ?? this._spline?.points ?? [];
                if (vertices && vertices.length > 0) {
                    let ox = 0;
                    let oy = 0;
                    let oz = 0;
                    for (let i = 0; i < vertices.length; i++) {
                        ox += vertices[i].x;
                        oy += vertices[i].y;
                        oz += vertices[i].z;
                    }
                    const inv = 1 / vertices.length;
                    origin.set(ox * inv, oy * inv, oz * inv);
                } else {
                    origin.set(0, 0, 0);
                }
                const lineGeometry = buildLineGeometryByVertices(vertices, origin);
                this.tempsplineObject = new THREE.Line(lineGeometry, this.#pathMaterial);
                this.tempsplineObject.computeLineDistances();
                let array = this.tempsplineObject.geometry.attributes.lineDistance.array;
                this.distance = array[array.length - 1];
                this.tempsplineObject.position.copy(origin);
                this.scene.add(this.tempsplineObject);

                if (!this.drawPath) {
                    this._initSplineObject(/** @type {ModelMesh} */ (/** @type {unknown} */ (this.splineObject)));

                    this.splineObject = new U3dPathGeometry().createPathMesh(
                        vertices,
                        {
                            app: this.drawArg._app,
                            minheight: 0,
                            maxheight: this._pathHeight * 2,
                            segments: 200,
                            width: this._pathWidth,
                            transparent: this.pathOpacity < 1,
                            opacity: this.pathOpacity,
                            edge: this._pathEdge,
                            color: this.pathColor
                        }
                    );
                    this.scene.add(this.splineObject);
                    delete geometry.vertices;
                    geometry.dispose();
                }
            } else {
                const prevObject = this.splineObject;
                if (this.drawRealPath) {
                    if (defined(prevObject)) {
                        this._initSplineObject(/** @type {ModelMesh} */ (/** @type {unknown} */ (prevObject)));
                    }
                }
                if (!defined(this._realPathDrawOrigin)) {
                    this._realPathDrawOrigin = new THREE.Vector3();
                }
                const origin = this._realPathDrawOrigin;
                const vertices = geometry?.vertices ?? this._reductionSpline?.points ?? this._spline?.points ?? [];
                if (vertices && vertices.length > 0) {
                    let ox = 0;
                    let oy = 0;
                    let oz = 0;
                    for (let i = 0; i < vertices.length; i++) {
                        ox += vertices[i].x;
                        oy += vertices[i].y;
                        oz += vertices[i].z;
                    }
                    const inv = 1 / vertices.length;
                    origin.set(ox * inv, oy * inv, oz * inv);
                } else {
                    origin.set(0, 0, 0);
                }
                const lineGeometry = buildLineGeometryByVertices(vertices, origin);

                this.splineObject = new THREE.Line(lineGeometry, this.#pathMaterial);
                this.splineObject.computeLineDistances();
                let array = this.splineObject.geometry.attributes.lineDistance.array;
                this.distance = array[array.length - 1];
                this.splineObject.position.copy(origin);
                this.scene.add(this.splineObject);
            }
        } else {
            if (!defined(this._realPathDrawOrigin)) {
                this._realPathDrawOrigin = new THREE.Vector3();
            }
            const origin = this._realPathDrawOrigin;
            const vertices = geometry?.vertices ?? this._reductionSpline?.points ?? this._spline?.points ?? [];
            if (vertices && vertices.length > 0) {
                let ox = 0;
                let oy = 0;
                let oz = 0;
                for (let i = 0; i < vertices.length; i++) {
                    ox += vertices[i].x;
                    oy += vertices[i].y;
                    oz += vertices[i].z;
                }
                const inv = 1 / vertices.length;
                origin.set(ox * inv, oy * inv, oz * inv);
            } else {
                origin.set(0, 0, 0);
            }
            const lineGeometry = buildLineGeometryByVertices(vertices, origin);

            let line = new THREE.Line(lineGeometry, this.#pathMaterial);
            line.position.copy(origin);
            line.computeLineDistances();
            let array = line.geometry.attributes.lineDistance.array;
            this.distance = array[array.length - 1];
            // line.geometry.dispose();
        }
    }

    _isPush(/** @type {number} */ index, /** @type {Array<import('three').Vector3>} */ relativeSplinePoint) {
        if (!defined(index) || isNaN(index) || typeof index !== "number") return false;
        if (!defined(relativeSplinePoint)) return false;

        if (index + 1 > relativeSplinePoint.length - 1) {
            return true;
        }
        let point = relativeSplinePoint[index].clone().normalize();
        let nextPoint = relativeSplinePoint[index + 1].clone().normalize();
        let angle = point.angleTo(nextPoint); // 두 점의 곡률 계산
        return angle > 0.01;
    }

    _createSpline(/** @type {import('three').BufferGeometry & VerticesExt} */ geometry) {
        if (this.smoothCorner) {
            this.#createSmoothSpline(geometry);
        } else {
            this.#createLinearSpline(geometry);
        }
    }

    #createSmoothSpline(/** @type {import('three').BufferGeometry & VerticesExt} */ geometry) {
        const spline = this._spline;
        if (!spline) return;
        // 속도와 경로 설정에 맞춘 이동 곡선의 제어점을 구성합니다. 후속 거리·geometry 갱신은 이 클래스가 맡습니다.
        const reductionSplinePoint = INTERNAL.createSmoothSplinePoints(this, spline);
        this._reductionSpline = this.#createReductionSpline(reductionSplinePoint);
        this.distance = this._reductionSpline.getLength();

        this.#setSplineGeometry(geometry);
    }

    #createLinearSpline(/** @type {import('three').BufferGeometry & VerticesExt} */ geometry) {
        const spline = this._spline;
        if (!spline) return;
        const points = spline.points.map((/** @type import('three').Vector3 */ p) => p.clone());
        this._reductionSpline = this.#createReductionSpline(points);
        this.distance = this._reductionSpline.getLength();

        this.#setSplineGeometry(geometry);
    }

    #createReductionSpline (/** @type {Array<import('three').Vector3>} */ points) {
        const reductionSpline = new UCatmullRomCurve3({
            points,
            addstartend : this._addstartend
        });
        reductionSpline.tension = this._curveTension ;
        reductionSpline.curveType = 'centripetal';
        reductionSpline.closed = false;
        reductionSpline.arcLengthDivisions = Math.max(1000, reductionSpline.points.length * 100);
        reductionSpline.updateArcLengths();
        return reductionSpline;
    }

    #setSplineGeometry(/** @type {import('three').BufferGeometry & VerticesExt} */ geometry) {
        if (!this._reductionSpline) return;
        let pointLength = this._reductionSpline.points.length * 2;
        if (pointLength < 1000) pointLength = 1000;

        geometry.vertices = this._reductionSpline.getPoints(pointLength);

        const array = U3dRecoveredMixins.setVector3sArray(geometry.vertices);
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(array), 3));
    }

    _useTruthPath (/** @type {Array<import('three').Vector3>} */ arr) {
        if (!this.usetruthpath) return;

        if (defined(this.pitchYawRollList) && defined(arr)) {
            UDEF.assert(
                defined(this.pitchYawRollList)
                && defined(arr)
                && Array.isArray(this.pitchYawRollList)
                && Array.isArray(arr)
                && this.pitchYawRollList.length === arr.length
            );

            //+ pitch ////////////////////////////////////////////////////////////////
            const pitchArr = [];
            for (let i = 0; i < this.pitchYawRollList.length; i++) {
                const point = this.pitchYawRollList[i];
                const vec3 = new THREE.Vector3(arr[i].x, arr[i].y, point.x); //+ pitch
                pitchArr.push(vec3);
            }

            // self._splinePitch = pitchArr;
            this._splinePitch = new UCatmullRomCurve3({
                points: pitchArr,
                addstartend: this._addstartend
            });
            this._splinePitch.tension = this._curveTension;
            this._splinePitch.curveType = 'catmullrom';
            this._splinePitch.closed = false;

            //+ yaw //////////////////////////////////////////////////////////////
            const yawArr = [];
            for (let i = 0; i < this.pitchYawRollList.length; i++) {
                const point = this.pitchYawRollList[i];
                const vec3 = new THREE.Vector3(arr[i].x, arr[i].y, point.z); //+ yaw
                yawArr.push(vec3);
            }

            // self._splinePitch = pitchArr;
            this._splineYaw = new UCatmullRomCurve3({
                points: yawArr,
                addstartend: this._addstartend
            });
            this._splineYaw.tension = this._curveTension;
            this._splineYaw.curveType = 'catmullrom';
            this._splineYaw.closed = false;

            //+ roll //////////////////////////////////////////////////////////////
            const rollArr = [];
            for (let i = 0; i < this.pitchYawRollList.length; i++) {
                const point = this.pitchYawRollList[i];
                const vec3 = new THREE.Vector3(arr[i].x, arr[i].y, point.y); //+ roll
                rollArr.push(vec3);
            }

            this._splineRoll = new UCatmullRomCurve3({
                points: rollArr,
                addstartend: this._addstartend
            });
            this._splineRoll.tension = this._curveTension;
            this._splineRoll.curveType = 'catmullrom';
            this._splineRoll.closed = false;
        }

    }

    _createDefaultSpline(/** @type {WorldPositionVector3} */ position, /** @type {import('three').BufferGeometry} */ geometry) {
        const range = 10000;
        // 현재 위치 주변에 기본 이동 경로를 구성할 난수 좌표를 만듭니다.
        this._spline = new THREE.CatmullRomCurve3([
            new THREE.Vector3(position.x, position.y, position.z),
            new THREE.Vector3(
                INTERNAL.randomBetween(position.x - range, position.x + range),
                INTERNAL.randomBetween(position.y - range, position.y + range),
                position.z
            ),
            new THREE.Vector3(
                INTERNAL.randomBetween(position.x - range, position.x + range),
                INTERNAL.randomBetween(position.y - range, position.y + range),
                position.z
            ),
            new THREE.Vector3(
                INTERNAL.randomBetween(position.x - range, position.x + range),
                INTERNAL.randomBetween(position.y - range, position.y + range),
                position.z
            ),
            new THREE.Vector3(
                INTERNAL.randomBetween(position.x - range, position.x + range),
                INTERNAL.randomBetween(position.y - range, position.y + range),
                position.z
            ),
            new THREE.Vector3(position.x, position.y, position.z)
        ]);

        this._spline.tension = this._curveTension;
        this._spline.curveType = 'catmullrom';
        this._spline.closed = false;
        this._reductionSpline = this._spline;

        const array = U3dRecoveredMixins.setVector3sArray(this._reductionSpline.getPoints(this._reductionSpline.points.length));
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(array), 3));
    }

    _checkCollisionOperation (/** @type {import('three').Vector3} */ pathPosition, /** @type {import('three').Vector3} */ lookAt) {
        if (!defined(this._collisionFunction)) return;

        if (!defined(this._lookAtRaycaster)) {
            this._lookAtRaycaster = new THREE.Raycaster();
        }
        let pos = pathPosition.clone();
        let dir = lookAt.clone().sub(pos).normalize();
        this._lookAtRaycaster.set(pos, dir);

        let scenes = this.drawArg._app.getInstanceScenesFromModelAndTerrainLayers();
        let intersects = this._lookAtRaycaster.intersectObjects(scenes, true);
        intersects = intersects.filter(function (obj) {
            const targetObject = /** @type {import('three').Object3D & {_utype: (string | number | undefined)}} */ (obj.object);
            return targetObject._utype === UDEF.UMESH_TYPE._building
                || targetObject._utype === UDEF.UMESH_TYPE._tile
                || targetObject._utype === UDEF.UMESH_TYPE._complexBuilding
        })

        if (defined(intersects[0]) && intersects[0].distance <= this._collisionDistance) {
            this._collisionFunction(this);
        }
    }

    /**
     * 누적 경로를 통해 해당하는 컴포넌트를 선택하는 함수
     * @param {event | Record<string, unknown>} e 클릭 이벤트
     * @returns {this | undefined} 컴포넌트
     *
     * @ignore
     */
    selectedByTrail (e) {
        if(!this.#drawCumulativePath || !defined(this.#cumulativePath )) return;

        const trail = this.#cumulativePath;
        const isIntersected = /** @type {{raycast: (Function|undefined)}} */ (/** @type {unknown} */ (trail)).raycast?.(e) === true;

        if(isIntersected) {
            return this;
        }
        return undefined;
    }

    /**
     * 누적 경로(궤적)의 선택 강조용 helper 메시를 표시합니다. 궤적 표시가 꺼져 있거나 궤적이 없으면 아무 동작도 하지 않습니다.
     */
    onSelectHelperMesh () {
        if(!this.#drawCumulativePath || !defined(this.#cumulativePath )) return;

        const trail = this.#cumulativePath;
        const helper = trail.getHelperMesh(true);
        if(!defined(helper)) return;

        helper.visible = true;
        helper.frustumCulled = false;
    }

    /**
     * `onSelectHelperMesh`로 표시한 궤적 강조 helper 메시를 숨깁니다.
     */
    offSelectHelperMesh () {
        if(!this.#drawCumulativePath || !defined(this.#cumulativePath )) return;

        const trail = this.#cumulativePath;
        const helper = trail.getHelperMesh(false);
        if(!defined(helper)) return;

        helper.visible = false;
    }

    /**
     * 컴포넌트를 씬에서 제거하고 모델·경로·라벨·오버레이·애니메이션 리소스를 해제하는 함수. <br>
     * 주의 사항: 호출 후 이 객체는 다시 사용할 수 없으며 `isDisposed()`가 true가 됩니다.
     */
    dispose () {
        if (this.#disposed) return;
        this.#disposed = true;
        this.#waypointHistory.length = 0;
        for (const path of [this.splineObject, this.tempsplineObject, this.oriSplineObject]) {
            this._initSplineObject(/** @type {ModelMesh} */ (/** @type {unknown} */ (path)));
        }
        this.splineObject = undefined;
        this.tempsplineObject = undefined;
        this.oriSplineObject = undefined;
        // 경로 객체는 위에서 각자 정리하고, 공유 재질은 소유자인 컴포넌트가 마지막에 한 번 해제한다.
        this.#pathMaterial?.dispose();
        this.#pathMaterial = undefined;

        if(defined(this.getCumulativePath())) {
            this.removeCumulativeRoute();
        }

        if (defined(this._object)) {
            // 믹서 제거
            this._mixerController?.dispose({
                object: this._object,
                clearActions: true
            });
            this._mixers = [];

            this.scene.remove(this._object);

            // 루트부터 각 객체의 dispose 계약을 따라 부모 알림과 하위 자원 정리를 실행한다.
            UDEF.disposeObject3D(this._object);
        }

        this.removeLabel();
        if (defined(this.poi) && defined(this.componentLayer)) {
            UDEF.disposeObject3D(this.poi);
            this.componentLayer._scenePoi.remove(this.poi);
            this.poi = undefined;
        }

        if (defined(this.getOverlay())) {
            let overlay = this.getOverlay();
            for (let i = 0; i < overlay.length; i++) {
                overlay[i].remove.call(overlay[i]);
            }
        }

        // 컴포넌트 애니메이션 함수 해제
        this._updateAnimationFunc = undefined;
        this._endAnimationFunc = undefined;
        this._startAnimationFunc = undefined;

        const aniList = [...this.getAnimations().values()];
        for (const ani of aniList) {
            if (!ani) continue;
            ani.dispose?.();
        }

        this.name = undefined;
        // this.position = undefined;
        this.drawArg = /** @type {import('@UDrawArg').UDrawArg} */ ({});
        this.componentLayer = /** @type {import('@U3dMultipleComponentLayer').U3dMultipleComponentLayer} */ ({});
        this.mixers = [];
        this.movePointList = [];
        this.distance = 0;
        this.duration = 0;
        if (defined(this.tween)) {
            this.tween.stop?.();
            this.tween = undefined;
        }

        if (defined(this.animationControllers)) {
            this.disposeAnimationControllers();
        }

        this.properties = undefined;
        // 컴포넌트 업데이트 함수 해제
        this.#updateFunc = undefined;
    }

    /**
     * 모델 자체 애니메이션 클립(액션) 목록을 조회합니다. 키를 `startAction`/`stopAction`에 넘겨 재생을 제어합니다.
     * @returns {Record<string, import('three').AnimationAction> | undefined} 클립 이름을 키로 한 액션 객체. 믹서가 없으면 undefined
     */
    getAnimationClips () {
        return this._mixerController?.getActions?.();
    }

    //------------------------------------------------------
    // 모델 내장 mixer 관련 함수
    //------------------------------------------------------

    /**
     * 컴포넌트 모델 자체 애니메이션 클립(modelClip)을 정지하는 함수
     * @param {string} key 애니메이션 클립 식별 ID
     * @param {number} [fadeDuration=0.005] 정지 전환에 걸리는 시간 (초)
     * @example
     * const clips = component.getAnimationClips();
     * const keys = Object.keys(clips);
     * for(let key of keys) {
     *     component.stopAction(key);
     * }
     */
    stopAction (key, fadeDuration = 0.005) {
        this._mixerController?.stopAction(key, fadeDuration);
    }

    // TODO 메서드 명 변경 -> 버전 업데이트 후 제거
    /**
     * @param {string} key
     * @param {number} [fadeDuration=0.005]
     *
     * @ignore
     */
    stopAnimation (key, fadeDuration = 0.005) {
        __GInfo__(this, `메서드 이름이 stopAction으로 변경되었습니다. stopAnimation은 곧 삭제될 예정이니 코드를 업데이트해 주세요.`, '4125105')
        this.stopAction(key, fadeDuration);
    }

    /**
     * 컴포넌트 모델 자체 애니메이션 클립(modelClip)을 동작시키는 함수
     * @param {string} key 애니메이션 클립 식별 ID
     * @param {number} [fadeDuration=0.005] 재생 시작 전환에 걸리는 시간 (초)
     * @param {number} [speed] 재생 배율. 1이 원래 속도이며 생략하면 현재 속도를 유지합니다
     * @example
     * const clips = component.getAnimationClips();
     * const keys = Object.keys(clips);
     * for(let key of keys) {
     *     component.startAction(key);
     * }
     */
    startAction (key, fadeDuration = 0.005, /** @type {number | undefined} */ speed = undefined) {
        const mixerController = this.getMixerController?.();
        if (!mixerController) return;

        const hadRunningActions = mixerController.hasRunningActions?.() === true;

        mixerController.startAction(key, {
            fadeDuration,
            speed,
            reset: !hadRunningActions
        });
    }

    // TODO 메서드 명 변경 -> 버전 업데이트 후 제거
    /**
     * @param {string} key
     * @param {number} [fadeDuration=0.005]
     *
     * @ignore
     */
    startAnimation (key, fadeDuration = 0.005) {
        __GInfo__(this, `메서드 이름이 startAction으로 변경되었습니다. startAnimation은 곧 삭제될 예정이니 코드를 업데이트해 주세요.`, '4126267')
        this.startAction(key, fadeDuration);
    }

    /**
     * 지정한 모델 애니메이션 클립을 재생하면서 재생 속도를 갱신하는 함수
     * @param {string} key 실행하려는 애니메이션 클립 식별 ID (`getAnimationClips`의 키)
     * @param {number} [speed] 애니메이션 재생 배율. 1이 원래 속도이며 생략하면 현재 속도를 유지합니다
     * @param {number} [fadeDuration=0.005] 재생 전환에 걸리는 시간 (초)
     * @example
     *      let component = componentLayer.getComponentByName('uam_01_1');
     *      let key = Object.keys(component.getAnimationList())[0];
     *      let animationInterval = setInterval(function (){
     *              selected.updateAnimation(key, 1);
     *          },10)
     */
    updateAction (key, /** @type {number | undefined} */ speed = undefined, fadeDuration = 0.005) {
        this.startAction(key, fadeDuration, speed);
    }

    /**
     * 모델 자체 애니메이션(클립)을 재생할 믹서 목록을 교체합니다. 이후 `mixers`·`getAnimationClips`는 새 목록을 기준으로 동작합니다.
     *
     * @param {Array<import('three').AnimationMixer>} [mixers=[]] 새 믹서 목록. 빈 배열이면 클립 재생이 없는 상태가 됩니다
     */
    setMixers  (/** @type {Array<import('three').AnimationMixer>} */ mixers = []) {
        if (!defined(this._mixerController)) return;

        this._mixerController.setMixers(mixers);
        this._mixers = this._mixerController.getMixers() ?? [];
    }

    /**
     * 모델 클립 믹서를 관리하는 컨트롤러를 반환합니다. 클립 목록 조회·재생·FPS 조절은 이 객체를 통해 이루어집니다.
     *
     * @returns {import('@union3d/analy/UComponentMixerController').UComponentMixerController} 믹서 컨트롤러
     */
    getMixerController  () {
        return this._mixerController;
    }

    /**
     * 모델에 재생 가능한 애니메이션 클립(믹서)이 하나 이상 있는지 확인합니다.
     *
     * @returns {boolean} 믹서가 있으면 true
     */
    hasMixers  () {
        return this._mixerController?.hasMixers() === true;
    }


    /**
     * 컴포넌트 속성 정보를 조회하는 함수
     * @returns {KeyValue} 속성 성보
     * @example
     * return {
     *     "관할구" : "서울특별시 구로구",
     *     "사용승인일" : "2022년 11월",
     *     "건축물 용도" : "아파트",
     *     "세대수" : "2500"
     * }
     */
    getProperties () { return this.properties}

    /**
     * 컴포넌트 속성 정보를 설정하는 함수
     * @param {string | UnknownRecord} input 속성 객체, 또는 JSON 문자열 (파싱해서 적용)
     */
    setProperties (input) {
        const obj = (typeof input === 'string') ? JSON.parse(input) : input;
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return; // 객체만 허용

        this.properties = JSON.parse(JSON.stringify(obj));
    }

    /**
     * 컴포넌트 속성 정보를 추가하는 함수
     * @param {string} key 속성 정보 식별키
     * @param {unknown} value 속성 정보 값
     */
    addProperties (key, value) {
        if(!defined(key) || !defined(value)) return;
        if(!defined(this.properties)) this.properties = {};
        key = String(key);
        if(key.length === 0 ) {
            console.warn( `[U3dComponentPosition][addProperties] 빈 프로퍼티 키 값입니다.`); return;
        }

        if(defined(this.properties[key])) {
            this.changeProperties(key, value);
            return;
            // console.warn(`[U3dComponentPosition][addProperties] 이미 존재하는 프로퍼티입니다. 값 변경을 하려면 [changeProperties] 함수를 사용하세요.`); return;
        }

        this.properties[key] = value;
    }

    /**
     * 컴포넌트 속성 정보를 제거하는 함수
     * @param {string} key 속성 정보 식별키
     */
    removeProperties (key) {
        if(!defined(key)) return;

        const properties = this.properties;
        if (!defined(properties)) return;
        if (Object.keys(properties).length === 0) return;

        delete properties[key];
    }

    /**
     * 컴포넌트 속성정보를 변경하는 함수
     * @param {string} key 변경할 속성 정보 식별키
     * @param {unknown} value 속성 정보 값
     */
    changeProperties (key, value) {
        if(!defined(key) || !defined(value)) return

        const properties = this.properties;
        if (!defined(properties)) return;
        if(!defined(properties[key]) || Object.keys(properties).length === 0) {
            console.warn(`[U3dComponentPosition][changeProperties] 존재하지 않는 프로퍼티입니다. [addProperties] 함수로 추가하세요.`); return;
        }

        properties[key] = value;
    }

    /**
     * 컴포넌트의 실 객체는 gruop들로 감싸져 있는 경우가 많다. Mesh의 머터리얼의 속성을 조회하거나 변경할때
     * 순회하며 머터리얼을 모두 가져오는 함수이다.
     * 이걸로 컴포넌트 형상객체의 색상, 투명도 등의 정보를 확인하고 수정하는데 사용할 수 있다.
     * @param {import('three').Object3D & MaterialableExt} object
     * @param {Array<import('three').Material>} result 검색된 머터리얼이 적재되는 결과 리스트
     *
     * @ignore
     */
    #searchObjectMaterial(object, result = []){
        if(!object) return;
        if(object.children){
            for(const child of object.children){
                this.#searchObjectMaterial(child, result);
            }
        }
        if(!object.material) return;
        if(object.material instanceof Array){
            for(const material of object.material){
                result.push(material);
            }
        }else{
            result.push(object.material);
        }
    }

    /**
     * 컴포넌트 원본 모델 객체를 찾는 함수
     * @returns {import('three').Object3D | undefined} 원본 모델 그룹
     */
    getModel() {
        if(!defined(this._object)) return;

        const models = this.componentLayer?._object?.children ?? [];
        let target;
        for (const model of models) {
            if (this._object.name === model.name) target = this._object;
        }
        return target;
    }
    /**
     * 컴포넌트가 출력하고있는 모델의 색상을 리턴합니다.
     * @returns {import('three').ColorRepresentation} 색상값, 색상값을 찾을 수 없다면 '' 빈문자열을 리턴합니다.
     */
    getColor(){
        if(!this._object) return '';
        if(this.color) return this.color;
        try{
            /** @type {Array<MutableMaterial>} */
            const materials = [];
            this.#searchObjectMaterial(this._object, materials);
            if (materials.length === 0) return '';

            if(materials[0].color)
                return materials[0].color.getStyle();

            return '';
        }catch (e) {
            __GSError__(e);
            return '';
        }
    }

    /**
     * 컴포넌트가 출력하고있는 모델의 투명도를 리턴합니다.
     * @returns {number} 투명도값, 투명도값을 찾을 수 없다면 NaN 을 리턴합니다.
     */
    getOpacity() {
        if(!this._object) return NaN;
        if(this.opacity) return this.opacity;
        try{
            /** @type {Array<MutableMaterial>} */
            const materials = [];
            this.#searchObjectMaterial(this._object, materials);
            if (materials.length === 0) return NaN;

            if(defined(materials[0].opacity))
                return materials[0].opacity;

            return NaN;
        }catch (e){
            __GSError__(e);
            return NaN;
        }
    }

    /**
     * 모델 재질의 깊이 버퍼 쓰기(depthWrite) 여부를 반환합니다. 첫 번째 재질 값을 대표로 사용합니다.
     *
     * @returns {boolean} depthWrite 값. 모델이나 재질이 없으면 true
     */
    getDepth() {
        if(!this._object) return true;
        try{
            /** @type {Array<MutableMaterial>} */
            const materials = [];
            this.#searchObjectMaterial(this._object, materials);
            if (materials.length === 0) return true;

            if(defined(materials[0].depthWrite))
                return materials[0].depthWrite;

            return true;
        }catch (e){
            __GSError__(e);
            return true;
        }
    }

    /**
     * 컴포넌트가 출력하고있는 모델의 색상을 설정 합니다.
     * @param {import('three').ColorRepresentation} color 설정할 색상값
     * @returns {boolean} 색상이 적용되면 true, 모델이 없거나 적용에 실패하면 false
     */
    setColor(color = '#ffffff') {
        if(!this._object) return false;
        try {
            const parsedColor = color instanceof THREE.Color ? color : new THREE.Color(color);
            this._object.traverse(/** @param {import('three').Object3D & MaterialableExt} child */ (child)=>{
                const model = child;
                if(defined(model.material)) {
                    this.#applyMaterial(model.material, {color: parsedColor});
                    if (defined(model._oriMaterial)) {
                        this.#applyMaterial(model._oriMaterial, {color: parsedColor});
                    } else {
                        model._oriMaterial = Array.isArray(model.material)
                            ? model.material.map((/** @type {MutableMaterial} */ m) => m.clone())
                            : model.material.clone();
                    }
                }
            });
            this.color = parsedColor;
        }catch (e) {
            __GSError__(e);
            return false;
        }
        return true;
    }

    /**
     * 이 컴포넌트가 출력하는 모델의 밝기(brightness)를 절대값으로 설정합니다. <br>
     * 반복 호출해도 기존 색상에 누적되지 않습니다. <br>
     * 1은 원래 밝기, 0은 검정이며 1보다 크면 밝아집니다. <br>
     * 대비(contrast)보다 먼저 적용합니다. <br>
     * 재질의 기본 색이 아니라 텍스처와 조명까지 반영한 최종 색상에 적용하며, 하위 컴포넌트의 모델에는 전파하지 않습니다. <br>
     * 설정한 값은 별도 갱신 호출 없이 다음 렌더링부터 화면에 반영됩니다. <br>
     * 일반·인스턴스 컴포넌트의 표준 Three.js 재질을 지원하며, 사용자 ShaderMaterial을 사용하는 재질만 보정에서 제외하고 같은 모델의 나머지 재질에는 그대로 적용합니다. <br>
     * 선택 하이라이트 중에도 설정값은 보존되며, 선택을 해제하면 다시 적용됩니다. <br>
     * 숫자가 아니면 TypeError, 음수·비유한 값·Float32 표현 범위 초과이면 RangeError를 발생시킵니다. <br>
     * 예외가 발생하면 이전에 설정한 값과 화면 표시를 그대로 유지합니다.
     *
     * @param {number} [brightness=1] 0 이상의 밝기 배율이며, 생략하면 기본값 1로 복원합니다.
     */
    setBrightness(brightness = 1) {
        this.#validateColorAdjustment(brightness);
        this._applyColorAdjustment(brightness, this.#contrast, this.#saturation);
        this.#brightness = brightness;
    }

    /**
     * 이 컴포넌트에 setBrightness로 마지막에 설정한 밝기(brightness) 배율을 반환합니다. <br>
     *
     * @returns {number} 마지막으로 설정한 밝기 배율이며, 한 번도 설정하지 않았으면 1입니다.
     */
    getBrightness() {
        return this.#brightness;
    }

    /**
     * 이 컴포넌트가 출력하는 모델의 대비(contrast)를 절대값으로 설정합니다. <br>
     * 1은 원래 대비이며 0은 중간 회색입니다. <br>
     * 밝기(brightness)를 적용한 뒤 RGB의 0.5를 기준으로 조절하며 투명도는 변경하지 않습니다. <br>
     * 1이 아닌 값을 설정하면 조절한 색상 채널을 0 이상 1 이하로 제한하고, 1이면 제한하지 않습니다. <br>
     * 지원 재질·적용 범위·화면 반영 시점·선택 강조·오류 처리는 setBrightness와 같습니다.
     *
     * @param {number} [contrast=1] 0 이상의 대비 배율이며, 생략하면 기본값 1로 복원합니다.
     */
    setContrast(contrast = 1) {
        this.#validateColorAdjustment(contrast);
        this._applyColorAdjustment(this.#brightness, contrast, this.#saturation);
        this.#contrast = contrast;
    }

    /**
     * 이 컴포넌트에 setContrast로 마지막에 설정한 대비(contrast) 배율을 반환합니다. <br>
     *
     * @returns {number} 마지막으로 설정한 대비 배율이며, 한 번도 설정하지 않았으면 1입니다.
     */
    getContrast() {
        return this.#contrast;
    }

    /**
     * 모델의 채도를 절대값으로 설정합니다. 1은 원래 채도이며 0은 회색조입니다.
     * 밝기·대비를 적용한 뒤 Rec.709 휘도를 기준으로 조절하며 투명도는 변경하지 않습니다.
     * 지원 재질·선택 강조·오류 처리는 setBrightness와 같습니다.
     *
     * @param {number} [saturation=1] 채도 배율. 생략하면 기본값으로 복원합니다.
     */
    setSaturation(saturation = 1) {
        this.#validateColorAdjustment(saturation);
        this._applyColorAdjustment(this.#brightness, this.#contrast, saturation);
        this.#saturation = saturation;
    }

    /**
     * 이 컴포넌트에 설정한 채도 배율을 반환합니다.
     *
     * @returns {number} 채도 배율. 기본값은 1입니다.
     */
    getSaturation() {
        return this.#saturation;
    }

    /**
     * 밝기·대비·채도를 한 번에 기본값(1)으로 되돌립니다.
     * 각각을 따로 설정하면 그때마다 재질을 갱신하므로 한 번에 처리합니다.
     */
    resetColorAdjustment() {
        this._applyColorAdjustment(1, 1, 1);
        this.#brightness = 1;
        this.#contrast = 1;
        this.#saturation = 1;
    }

    /**
     * GPU에 전달할 수 없는 입력을 렌더 상태 변경 전에 거부합니다.
     *
     * @param {number} value 밝기, 대비 또는 채도 배율
     *
     * @ignore
     */
    #validateColorAdjustment(value) {
        if (typeof value !== 'number') throw new TypeError('밝기와 대비, 채도는 숫자여야 합니다.');
        if (!Number.isFinite(value) || value < 0 || !Number.isFinite(Math.fround(value))) {
            throw new RangeError('밝기와 대비, 채도는 Float32로 표현 가능한 0 이상의 유한한 값이어야 합니다.');
        }
    }

    /**
     * 현재 모델에 저장할 밝기·대비·채도를 전달합니다. 인스턴스 구현은 같은 경계를 재정의합니다.
     *
     * @param {number} brightness 검증된 밝기 배율
     * @param {number} contrast 검증된 대비 배율
     * @param {number} [saturation=1] 검증된 채도 배율
     *
     * @protected
     * @ignore
     */
    _applyColorAdjustment(brightness, contrast, saturation = 1) {
        // 재질이 선택·LOD 때문에 교체되어도 현재 모델의 보정값을 사용하게 연결합니다.
        INTERNAL.applyObjectColorAdjustment(this._object, brightness, contrast, saturation);
    }

    /**
     * 컴포넌트가 출력하고있는 모델의 투명도를 설정 합니다.
     * @param {number} [opacity=1] 설정할 투명도 (0 투명 ~ 1 불투명)
     * @returns {boolean} 투명도가 적용되면 true, 모델이 없거나 적용에 실패하면 false
     */
    setOpacity(opacity = 1) {
        if(!this._object) return false;
        try{
            opacity = THREE.MathUtils.clamp(opacity, 0, 1);
            this._object.traverse(/** @param {import('three').Object3D & MaterialableExt} child */ (child)=>{
                const model = child;
                if(defined(model.material)) {
                    this.#applyMaterial(model.material, {opacity});
                    if(defined(model._oriMaterial)) {
                        this.#applyMaterial(model._oriMaterial, {opacity});
                    }else {
                        model._oriMaterial = Array.isArray(model.material)
                            ? model.material.map((/** @type {MutableMaterial} */ m) => m.clone())
                            : model.material.clone();
                    }
                }
            });
            this.opacity = opacity;
        }catch (e) {
            __GSError__(e);
            return false;
        }
        return true;
    }

    /**
     * 모델의 모든 재질에 깊이 버퍼 쓰기(depthWrite)를 설정합니다. false로 두면 이 모델이 다른 객체의 깊이 판정에 영향을 주지 않아
     * 반투명 객체가 겹칠 때 뒤쪽이 사라지는 현상을 줄일 수 있습니다. 첫 호출 시 원본 재질이 복원용으로 보관됩니다.
     *
     * @param {boolean} [depthWrite=true] 깊이 버퍼 쓰기 여부
     * @returns {boolean} 항상 true
     */
    setDepth(depthWrite=true) {
        if(!defined(this._object)) return true;

        try{
            this._object.traverse(/** @param {import('three').Object3D & MaterialableExt} child */ (child)=>{
                const model = child;
                if(defined(model.material)) {
                    this.#applyMaterial(model.material, {depthWrite});
                    if(defined(model._oriMaterial)) {
                        this.#applyMaterial(model._oriMaterial, {depthWrite});
                    }else {
                        model._oriMaterial = Array.isArray(model.material)
                            ? model.material.map((/** @type {MutableMaterial} */ m) => m.clone())
                            : model.material.clone();
                    }
                }
            })
        } catch (e) {
            __GSError__(e);
            return true;
        }
        return true;
    }

    /**
     * 모델의 렌더 순서를 설정합니다. 값이 클수록 나중에 그려져 같은 위치의 다른 객체 위에 보입니다.
     * @param {number} renderOrder 렌더 순서 (기본 0)
     */
    setRenderOrder (renderOrder) {
        const self = this;
        if (!defined(self._object)) return;

        const object = self._object;
        object.traverse(/** @param {import('three').Object3D} child */ (child) => {
            if (child instanceof THREE.Mesh || child instanceof UMesh) {
                child.renderOrder = renderOrder;
            }
        });
    }

    /**
     * 모델의 렌더 순서를 반환합니다.
     * @returns {number | undefined} 렌더 순서. 모델이 없으면 undefined
     */
    getRenderOrder () {
        const self = this;
        if (!defined(self._object)) return;
        let renderOrder;
        const object = self._object;
        object.traverse(/** @param {import('three').Object3D} child */ (child) => {
            if (child instanceof THREE.Mesh || child instanceof UMesh) {
                renderOrder = child.renderOrder;
            }
        });
        return renderOrder;
    }

    /**
     * materlal의 option 값의 내용으로 적용합니다.
     * @param {MutableMaterial | Array<MutableMaterial> | undefined} material 대상 material
     * @param {object} [option] 적용 스타일 및 옵션 정보
     * @param {import('three').Color} [option.color] 색상
     * @param {number} [option.opacity] 투명도
     * @param {boolean} [option.depthWrite] 깊이 버퍼 쓰기 여부
     * @param {boolean} [option.transparent] 투명 여부
     *
     * @ignore
     */
    #applyMaterial (material, option = {}) {
        const {color, opacity, depthWrite, transparent} = option;
        if(!defined(material)) return;
        const apply = (/** @type {MutableMaterial} */ _material)=> {
            if(defined(color) && color instanceof THREE.Color) _material.color?.copy(color);
            if(defined(opacity) && typeof opacity === "number") _material.opacity = opacity;
            if(defined(depthWrite) && typeof depthWrite === "boolean") _material.depthWrite = depthWrite;

            const isKept = _material?.userData?._keepTransparent === true;
            if (isKept) return;

            const targetTransparent = defined(transparent)
                ? transparent
                : (_material.opacity < 1);

            if (_material.transparent !== targetTransparent) {
                _material.transparent = targetTransparent;
            }

            _material.needsUpdate = true;
        }

        if(Array.isArray(material) && material.length > 0) {
            for(const mat of material) { apply(mat); }
        } else if (!Array.isArray(material)) {
            apply(material);
        }
    }

    /**
     * 컴포넌트가 출력하고 있는 모델의 텍스쳐 출력을 끄거나 켭니다.
     * @param {boolean} [isExcept=false] true이면 텍스처를 숨기고 단색으로 그리며, false이면 텍스처를 다시 표시합니다
     * @returns {boolean} 적용되면 true, 모델이 없거나 적용에 실패하면 false
     */
    exceptTexture(isExcept = false){
        if(!this._object) return false;
        try{
            /** @type {Array<MutableMaterial>} */
            const materials = [];
            this.#searchObjectMaterial(this._object, materials);

            if(isExcept){
                for(const material of materials){
                    if(!material.map) continue;
                    if(!material._oriMap)
                        material._oriMap = material.map;

                    material.map = null;

                    material.needsUpdate = true;
                }
            }else{
                for(const material of materials){
                    if(!material._oriMap) continue;
                    material.map = material._oriMap;
                    delete material._oriMap;

                    material.needsUpdate = true;
                }
            }
            return true;
        }catch (e) {
            __GSError__(e);
            return false;
        }
    }
    /**
     * 컴포넌트의 변환 행렬(`matrix`)을 반환합니다. 부모가 있으면 부모 기준 상대 행렬입니다.
     *
     * @returns {import('three').Matrix4} 변환 행렬
     */
    getMatrix(){
        return this.matrix;
    }

    /**
     * 상위 계층을 설정하는 함수
     * 부모 / 자식 관계를 형성하여 부모의 형상관리 내용(위치, 회전, 크기, 가시화 여부)이 자식에게 반영
     * @param {U3dComponentPosition} parent 상위 계층 대상
     */
    setParent(parent){
        const self = this;
        if(self === parent){
            return;
        }
        if(!parent || !(parent instanceof U3dComponentPosition)) return;
        if(self.parent){
            self.parent.removeChild(self);
        }

        if(parent.parent && parent.parent === self){
            parent.removeParent(); //무한 반복 요소 제거
        }
        self.parent = parent;

        const idx = parent.children.indexOf(self);
        if(idx === -1){
            parent.children.push(self);
        }
        parent.quaternion.setFromEuler(parent.rotation); // parent quaternion rotation의 값으로 반영
        parent.updateMatrix();
        const parentMatrix = new THREE.Matrix4().compose(parent.position, parent.quaternion, parent.scale);
        const invertMatrix = parentMatrix.invert();
        self.quaternion.setFromEuler(self.rotation); // child quaternion rotation의 값으로 반영
        self.matrix.compose(self.position, self.quaternion, self.scale);
        self.matrix.multiplyMatrices(invertMatrix, self.matrix);

    }
    /**
     * `setParent`로 지정한 상위 컴포넌트를 반환합니다.
     *
     * @returns {U3dComponentPosition | undefined} 상위 컴포넌트. 없으면 undefined
     */
    getParent(){
        return this.parent;
    }


    /**
     * 지정된 상위 계층을 제거하는 함수
     */
    removeParent(){
        const self = this;

        if(self.parent && self.parent instanceof U3dComponentPosition){
            self.parent.removeChild(self);
        }
        self.matrix.identity();
        self.parent = undefined;
    }

    /**
     * 하위 계층 대상을 설정하는 함수
     * @param {U3dComponentPosition | ExtendedObject3D} child 하위 계층 대상 (컴포넌트 또는 확장 3D 오브젝트)
     */
    setChild(/** @type {U3dComponentPosition | ExtendedObject3D} */ child){
        const self = this;
        if(self === child || !defined(child)) return;

        if (child.setParent) {
            // 하위 객체가 제공하는 부모 연결 확장점을 원래 수신 객체로 호출합니다.
            Reflect.apply(child.setParent, child, [self]);
            return;
        }

        // --- THREE.Object3D ---
        if (child instanceof THREE.Object3D) {
            // 중복이면 추가하지 않고 종료
            if (self.children.includes(child)) {
                return;
            }

            // 기존 월드 스냅샷
            child.updateMatrixWorld(true);
            const childMat = child.matrixWorld.clone();

            // 부모 월드 매트릭스
            self.quaternion.setFromEuler(self.rotation);
            const parentMat = TEMP_MAT.compose(self.position, self.quaternion, self.scale);
            const invertMat = INVERT_MAT.copy(parentMat).invert();
            self.matrixWorld.copy(parentMat); // 부모 갱신

            //  로컬 전환
            const localMat = LOCAL_MAT.copy(invertMat).multiply(childMat);

            // 부모 연결
            /** @type{ComponentChildObject3D} */(child).parent = /**@type{import('three').Object3D & U3dComponentPosition}*/ (/**@type{unknown}*/(self)) ?? null;

            // 적용
            child.matrixAutoUpdate = false;
            child.matrix.copy(localMat);
            child.matrix.decompose(child.position, child.quaternion, child.scale);
            child.matrixWorld.copy(parentMat).multiply(child.matrix);

            // 자식 배열에 추가
            self.children.push(/** @type {ExtendedObject3D} */ (child));
        }
    }

    /**
     * `setChild`로 등록한 하위 계층 목록을 반환하는 함수
     * @returns {Array<U3dComponentPosition | ExtendedObject3D>} 하위 컴포넌트·오브젝트 배열 (내부 배열을 직접 반환)
     */
    getChildren(){
        return this.children;
    }

    /**
     * 지정된 하위 계층 대상 제거하는 함수
     * @param {U3dComponentPosition} child 하위 계층 대상
     */
    removeChild(child){
        const self = this;
        if(!child) return;

        const index = self.children.indexOf(child);
        if(index === -1) return;

        self.children.splice(index, 1);

        if(child.isComponent){
            child.parent = undefined;
            child.matrix?.identity();
        }
    }

    /**
     * 부모가 있으면 부모 기준으로 자신의 변환 행렬을 다시 계산합니다. 부모의 위치·회전·크기를 바꾼 뒤 호출하면 자식이 따라갑니다.
     */
    updateMatrix(){ // 부모 / 자식 여부 확인 후 반영하기
        const self = this;
        if(self.parent){
            self.setParent(self.parent);
        }
    }

    /**
     * 하위 계층 ( setChild ) 으로 등록된 대상들의 matrix를 반영해주는 함수
     */
    updateChildrenMatrix(){
        const self = this;
        const children = (self.getChildren?.() ?? self.children ?? []).slice();
        if(self.parent){
            self.setParent(self.parent);
        }
        if(!children || children.length === 0 ) return;

        self.quaternion.setFromEuler(self.rotation);
        const matrix = new THREE.Matrix4().compose(self.position, self.quaternion, self.scale);
        self.matrixWorld = matrix;
        const invert = INVERT_MAT.copy(matrix).invert();

        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const rotation = new THREE.Euler();
        const scale = new THREE.Vector3();
        const mat = new THREE.Matrix4();

        /** @type {Array<U3dComponentPosition | ExtendedObject3D | import('three').Object3D>} */
        const recurseList = [];
        for (let i = 0; i < children.length; i++) {
            const child =/**@type{ComponentChildObject3D}*/(children[i]);

            mat.copy(matrix).multiply(child.matrix);
            mat.decompose(position, quaternion, scale);
            rotation.setFromQuaternion(quaternion);

            if (child instanceof U3dComponentPosition) {
                self.#objectUpdate(child, position, quaternion, rotation, scale);
                if (child._object) self.#objectUpdate(child._object, position, quaternion, rotation, scale);

                const instancedChild = /**@type{InstancedComponent}*/(child);
                if (child.getInstanced?.()){
                    instancedChild.updateInstances?.(child.position, child.quaternion, child.scale);
                }


                if (instancedChild.instancedInfo) {
                    instancedChild.instancedInfo.position.copy(position);
                    instancedChild.instancedInfo.rotation.copy(rotation);
                    instancedChild.instancedInfo.scale.copy(scale);
                }

                if (child.children?.length) recurseList.push(child); // 즉시 재귀 금지
                continue;
            }

            if (/**@type{ComponentChildObject3D}*/(child) instanceof THREE.Object3D) {
                const localMat = LOCAL_MAT.copy(invert).multiply(mat);

                const childObject = /** @type {import('three').Object3D} */ (
                    /** @type {unknown} */ (child)
                );

                childObject.matrixAutoUpdate = false;
                childObject?.matrix?.copy(localMat);
                childObject?.matrix?.decompose(childObject.position, childObject.quaternion, childObject.scale);

                if (childObject.children?.length) recurseList.push(childObject); // 즉시 재귀 금지
                childObject.updateMatrixWorld(true);
            }
        }

        for (let i = 0; i < recurseList.length; i++) {
            const recurseChild = recurseList[i];
            if (recurseChild instanceof U3dComponentPosition) {
                recurseChild.updateChildrenMatrix();
            } else if (recurseChild instanceof THREE.Object3D) {
                recurseChild.updateMatrixWorld(true);
            }
        }
    }

    /**
     * 컴포넌트의 생성 파라미터값을 반환하는 함수
     * @returns {ComponentParam} 컴포넌트의 생성 파라미터값
     */
    getParam () {
        const self = this;
        /** @type {Array<object>} */
        let lights = [];
        for(const light of self._lightList) {
            const lightLike = /**@type{LightLike}*/(light);
            lights.push(lightLike?.getParam?.());
        }

        /** @type {Array<OverlayObject>} */
        let overlay = [];
        for(const o of self.overlay) {
            overlay.push(o);
        }

        const geoPosition = self.getGeographicPosition();
        const position = self.getVectorPosition();
        const scale = new THREE.Vector3().copy(self.scale);
        const radianR = self.rotation;
        const rotation = {  // Degree 각도로 변환해서 저장
            x: radianR.x * 180 / Math.PI,
            y: radianR.y * 180 / Math.PI,
            z: radianR.z * 180 / Math.PI,
            _order: radianR.order,
            unit: 'degree'
        };
        /** @type {UnknownRecord} */
        const parentInfo = {};
        /** @type {Array<UnknownRecord>} */
        let childrenList = [];
        if(self.parent) {
            const parentWithLayer = /** @type {U3dComponentPosition | ExtendedObject3D} */ (self.parent);
            parentInfo.layer = parentWithLayer._ulayername ?? '';
            parentInfo.name = parentWithLayer.name ?? '';
        }

        if(self.children && self.children.length > 0){
            for (let i = 0; i < self.children.length; i++) {
                const child = self.children[i];
                /** @type {UnknownRecord} */
                const childInfo = {};
                const childWithLayer = /** @type {U3dComponentPosition | ExtendedObject3D} */ (child);
                childInfo.layer = childWithLayer._ulayername ?? '';
                childInfo.name = childWithLayer.name ?? '';
                childrenList[i] = childInfo;
            }
        }

        /** @type {{color: string, opacity: number, brightness: number, contrast: number, saturation: number}} */
        const style = {
            color: '#ffffff', opacity: 1,
            brightness: this.getBrightness(), contrast: this.getContrast(), saturation: this.getSaturation()
        };
        const rgb = this.getColor();
        style.color = UDEF.rgbStringToHex(rgb) || '#ffffff';
        style.opacity = this.getOpacity() ?? 1;

        return {
            name: this.name,
            position, scale, rotation, geoPosition,
            visible: this._show,
            labelVisible: Boolean(this._labelVisible),
            lights, overlay,
            properties: this.properties ?? {},
            object: this._object?.name ?? '',
            parent : parentInfo,
            children : childrenList,
            instanced: this._setInstanced ?? false,
            style
        };
    }

    _setForcedVisible (/** @type {boolean} */ forced) {
        if(forced) {
            if(!defined(this._tempLODMode) && this._tempLODMode !== 'none') {
                this._tempLODMode = this.LODMode;
                this.setLODMode('none');
            }
        } else {
            if(!defined(this._tempLODMode)) return;
            if( this.LODMode !== this._tempLODMode) {
                this.setLODMode(this._tempLODMode);
                this._tempLODMode = undefined;
            }
        }
    }

    /**
     * 컴포넌트 가시화(show) 함수
     * @returns {DeferredObject<unknown> | undefined} 숨김 상태를 표시한 경우 true로 resolve하며 이미 표시 중이면 undefined
     */
    show () {
        const promise = deferred();
        const self = this;

        // forced 여부에따른 LOD 상태 변경
        // this._setForcedVisible(forced);

        if(self._show) return;  // 이미 show 면 탈출

        const scene = self.scene;

        if (defined(self._object)) {
            self._object.visible = true;
        }
        self._show = true;

        //자식이 있을 경우 가시화 같이 제어
        if(self.children && self.children.length > 0){
            const children = self.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child instanceof U3dComponentPosition) {
                    child.show();
                } else  {
                    /**@type{ExtendedObject3D}*/ (child).show?.();
                }
            }
        }

        if (defined(self.splineObject)) {
            if (self.drawPath && defined(self.oriSplineObject)) scene.add(self.oriSplineObject);
            if (self.drawRealPath) scene.add(self.splineObject);
        }

        if(this._labelVisible) self.poi?.show();

        promise.resolve(true);
        return promise;
    }

    /**
     * 컴포넌트 비가시화(hide) 함수
     * @returns {DeferredObject<unknown> | undefined} 표시 상태를 숨긴 경우 true로 resolve하며 이미 숨김 상태면 undefined
     */
    hide () {
        const promise = deferred();
        const self = this;

        // forced 여부에따른 LOD 상태 변경
        // this._setForcedVisible(forced);

        if(!self._show) return;  // 이미 hide 면 탈출

        const scene = self.scene;
        if (defined(self._object)) self._object.visible = false;
        self._show = false;

        if(self.children && self.children.length > 0){
            const children = self.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child instanceof U3dComponentPosition) {
                    child.hide();
                } else {
                    /** @type {ExtendedObject3D} */ (child).hide?.();
                }
            }
        }

        if (defined(self.splineObject)) {
            if (self.drawPath && defined(self.oriSplineObject))
                scene.remove(self.oriSplineObject);
            if (self.drawRealPath)
                scene.remove(self.splineObject);

            self.isTrace = false;
            self.updateAnimationCameraTrace();
        }

        if(this._labelVisible) self.poi?.hide(); // 라벨 있으면 감추기

        promise.resolve(true);
        return promise;
    }

    /**
     * 컴포넌트의 경계영역(BoundingBox)을 반환하는 함수
     * @returns {import('three').Box3} 컴포넌트의 경계영역
     */
    getBoundingBox () {
        let rectangle = this.getRectangle();
        if (!defined(rectangle)) return new THREE.Box3();

        const rectangleValues = Object.values(rectangle);

        let minX = rectangleValues[0].x;
        let minY = rectangleValues[0].y;
        let minZ = rectangleValues[0].z;
        let maxX = rectangleValues[0].x;
        let maxY = rectangleValues[0].y;
        let maxZ = rectangleValues[0].z;

        for (let i = 0; i < rectangleValues.length; i++) {
            let rectangleVal = rectangleValues[i];
            if (rectangleVal.x < minX) {
                minX = rectangleVal.x;
            }
            if (rectangleVal.y < minY) {
                minY = rectangleVal.y;
            }
            if (rectangleVal.z < minZ) {
                minZ = rectangleVal.z;
            }
            if (rectangleVal.x > maxX) {
                maxX = rectangleVal.x;
            }
            if (rectangleVal.y > maxY) {
                maxY = rectangleVal.y;
            }
            if (rectangleVal.z > maxZ) {
                maxZ = rectangleVal.z;
            }
        }

        return new THREE.Box3(
            new THREE.Vector3(minX, minY, minZ),
            new THREE.Vector3(maxX, maxY, maxZ)
        );
    }

    /**
     * 원래 모델의 geometry bounding box를 반환 ( 위치, 회전, 크기가 반영되지 않은 초기 상태)
     * @returns {Box3WithCenter} 모델의 bounding box
     */
    getBoundBoxObject(){
        const self = this;
        const object = self._object;
        if (!object) return new THREE.Box3();
        const bbox = new THREE.Box3();
        object.updateMatrixWorld();
        object.traverse(/** @param {ModelMesh} child */ function (child) {
            const mesh = child;
            if (mesh.geometry) {
                if (!mesh.geometry.boundingBox) {
                    mesh.geometry.computeBoundingBox();
                }
                if (!mesh.geometry.boundingBox) return;
                const bbox_ = mesh.geometry.boundingBox.clone();
                const matrix = child.matrix;
                if(matrix){
                    bbox_.applyMatrix4(matrix) // 원본 데이터의 상대 좌표 반영
                }
                bbox.union(bbox_);
            }
        })
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        /** @type {Box3WithCenter} */(bbox)._center = center;
        return /** @type {Box3WithCenter} */(bbox);
    }

    /**
     * 현재 위치·회전·크기를 반영한 경계 상자(육면체)의 8개 꼭짓점을 월드 좌표로 반환합니다. <br>
     * 이름의 Down/Up은 z(높이) 최소/최대, Left/Right는 x 최소/최대, Top/Bottom은 y 최소/최대를 뜻합니다.
     * 부수적으로 `_bbox` 캐시를 갱신합니다.
     *
     * @returns {{DownLeftTop: import('three').Vector3, DownRightTop: import('three').Vector3, DownLeftBottom: import('three').Vector3, DownRightBottom: import('three').Vector3, UpLeftTop: import('three').Vector3, UpRightTop: import('three').Vector3, UpLeftBottom: import('three').Vector3, UpRightBottom: import('three').Vector3} | undefined} 꼭짓점 8개. 모델이나 회전 정보가 없으면 undefined
     */
    getRectangle() {
        // box 영역 생성
        /** @type {Box3WithCenter | undefined} */
        let bbox = this.getBoundBoxObject(); //object 의 setFromObject 로 인한 박스를 가져올 경우에 현재 상태 (위치, 회전, 크기)가 적용 된 경우의 결과를 반환으로 인한 아래의 작업 진행시 원하는 결과가 나오지 않음
        // 원본 데이터의 geometry bounding box를 가져와서 현재의 위치, 회전, 크기를 적용하는게 정확함
        const object = this._object;
            if (!defined(object)) return;
        this._bbox = bbox.clone().applyMatrix4(object.matrixWorld);
        this._bbox._center = new THREE.Vector3();
        this._bbox.getCenter(this._bbox._center);


        // 월드 좌표 -> 로컬(모델)좌표로 변경
        if (!bbox) return;
        const minBox = bbox.min.clone();
        const maxBox = bbox.max.clone();

        // 상위 부모의 회전 이동 값 추출
        const parent = this.parent;
        let rotation;
        if (defined(parent) && parent.children?.length > 1) {
            // 대상의 높이 0을 기준으로 회전 하였을 경우
            rotation = parent.rotation?.clone?.();
        } else {
            // 대상의 중심점을 기준으로 회전 하였을 경우
            rotation = this.rotation?.clone?.();
        }

        if(!defined(rotation)) return;

        // 회전 & 이동 적용
        const matrix4 = TEMP_BOX_MAT.makeRotationFromEuler(rotation);
        matrix4.setPosition(this.position);
        matrix4.scale(this.scale);
        // 생성된 Box3(육면체) 8개 꼭지점 반환
        const DownLeftTop = new THREE.Vector3(minBox.x, minBox.y, minBox.z).applyMatrix4(matrix4);
        const DownRightTop = new THREE.Vector3(maxBox.x, minBox.y, minBox.z).applyMatrix4(matrix4);
        const DownLeftBottom = new THREE.Vector3(minBox.x, maxBox.y, minBox.z).applyMatrix4(matrix4);
        const DownRightBottom = new THREE.Vector3(maxBox.x, maxBox.y, minBox.z).applyMatrix4(matrix4);
        const UpLeftTop = new THREE.Vector3(minBox.x, minBox.y, maxBox.z).applyMatrix4(matrix4);
        const UpRightTop = new THREE.Vector3(maxBox.x, minBox.y, maxBox.z).applyMatrix4(matrix4);
        const UpLeftBottom = new THREE.Vector3(minBox.x, maxBox.y, maxBox.z).applyMatrix4(matrix4);
        const UpRightBottom = new THREE.Vector3(maxBox.x, maxBox.y, maxBox.z).applyMatrix4(matrix4);

        return {
            DownLeftTop, DownRightTop, DownLeftBottom, DownRightBottom,
            UpLeftTop, UpRightTop, UpLeftBottom, UpRightBottom
        }
    }

    /**
     * instanced 컴포넌트라면 해당 인스턴스의 index를 반환한다.
     * (기본 구현은 instanced가 아니므로 undefined)
     * @returns {number | undefined}
     *
     * @ignore
     */
    getInstancedId() {
        return undefined;
    }

    /**
     * 출력 모델을 구성하는 Mesh의 센터점으로 부터의 상대적 위치를 설정하는 메서드입니다.(센터점은 변경되지 않습니다.)
     * @param {import('three').Vector3} relocationOffset 이동량 백터
     * @param {boolean} [isCopy=false] true면 relocationOffset 값으로 위치를 덮어쓰고, false면 현재 위치에 더합니다
     * @example
     * componentPosition.relocationObjects({x:0,y:0,z:1}, false); //센터점에서 Mesh들이 z축으로 1만큼 추가 이동
     * componentPosition.relocationObjects({x:0,y:0,z:1}, true); //센터점에서 Mesh들이 z축 1 죄표로 정렬
     */
    relocationObjects(relocationOffset = new THREE.Vector3(), isCopy = false){
        const object = this.getObject();
        if (!object) return;
        const offset = /** @type {import('three').Vector3} */ (relocationOffset);
        if(!offset.isVector3)
            relocationOffset = new THREE.Vector3(relocationOffset.x||0, relocationOffset.y||0, relocationOffset.z||0);

        object.traverse(function (child) {
            const mesh = /** @type {ModelMesh} */ (child);
            if(!mesh.isMesh) return;
            if(isCopy){
                mesh.position.copy(/** @type {import('three').Vector3} */(relocationOffset));
            }
            else{
                mesh.position.add(/** @type {import('three').Vector3} */(relocationOffset));
            }
            if(mesh.geometry?.computeBoundingBox)
                mesh.geometry.computeBoundingBox();

            if(mesh.geometry?.computeBoundingSphere)
                mesh.geometry.computeBoundingSphere();
        });
    }

    /**
     * 컴포넌트의 오버레이들의 위치를 설정합니다.
     * @param {WorldPositionVector3} position 설정 위치 좌표 (월드 좌표)
     */
    settingOverlay (position) {
        if (this.overlay.length < 1) return;
        if(!defined(position) || !defined(position.x) || !defined(position.y) || !defined(position.z)) return;

        for (let i = 0; i < this.overlay.length; i++) {
            const view = /**@type{OverlayObject}*/ this.overlay[i];
            if(!view.id || !view.element){
                this.overlay.splice(i--, 1);
                continue; //제거된 상태
            }
            this.#overlayPosition.copy(/**@type{WorldPositionVector3}*/(position));
            if (defined(view._shift)) {
                this.#overlayPosition.add(view._shift)
            }

            if (view.isBind) {
                const latlon = this.getGeographicPositionByWorld(this.#overlayPosition)
                const vectorLike = new THREE.Vector3(latlon.x, latlon.y, latlon.z);
                view.setPosition(vectorLike, this.#overlayPosition);
                if (!this.isTrace)
                    view.callOnchange?.();
            }

            if (defined(view.camera)) {
                view.moveViewPosition?.(this.#overlayPosition, AUTO_UPDATE);
                view.updateAnchor?.();
            }

            if (defined(view._controlObj) && defined(view.camera)) {
                view._controlObj.position.copy(view.camera.position);
            }

            if (defined(view.poi)) {
                view.updateLabel?.();
            }
        }
    }

    /**
     *
     * @param elapsedTime
     * @private
     *
     * @ignore
     */
    _applyObjectFrame (elapsedTime = 0) {
        if (defined(this._object)) {
            settingObject.call(this, this._object);
        }
    }

    /**
     *
     * @param elapsedTime
     * @private
     *
     * @ignore
     */
    _applyMixerFrame (elapsedTime =0) {
        /** @type {{update: function(number, number=): void}} */ (/** @type {unknown} */ (this._mixerController))
            ?.update?.(elapsedTime, this.#lastDistance);
    }



    /**
     * 컴포넌트 주행/비행 애니메이션 업데이트 시 호출 할 사용자 함수 설정 메서드입니다.
     * @param {function} func 사용사 함수 (호출시 입력되는 파라메터: fnc(현재 위치, 현재 방향위치, 현재 회전, 이동거리, 총 이동거리) )
     */
    setUpdateAnimationFunc(func) {
        if(typeof func !== "function") {
            __GError__(this, `입력한 파라미터가 함수 형식이 아닙니다. 입력 파라미터 : ${func}`, '0110074');
            return;
        }
        this._updateAnimationFunc = func;
    }

    /**
     * @deprecated 2.2.1.10.180.d 부터 setUpdateAnimationFunc 으로 변경되었습니다.
     */
    setUpdateFnc() {
        __GError__(this, 'GeOnDT Version: 2.2.1.10.180.d 부터 setUpdateFnc 함수는 setUpdateAnimationFunc 으로 변경되었습니다.', '0110326');
    }

    /**
     * 애니메이션 시작 시 호출할 사용자 함수 설정 메서드입니다.
     * @param {function} func 사용사 함수 (호출시 입력되는 파라메터: fnc( U3dComponentPosition ) )
     */
    setStartAnimationFunc(func) {
        if(typeof func !== "function") {
            __GError__(this, `입력한 파라미터가 함수 형식이 아닙니다. 입력 파라미터 : ${func}`, '0110647');
            return;
        }
        this._startAnimationFunc = func;
    }

    /**
     * @deprecated 2.2.1.10.180.d 부터 setStartAnimationFunc 으로 변경되었습니다.
     */
    setStartFnc() {
        __GError__(this, 'GeOnDT Version: 2.2.1.10.180.d 부터 setStartFnc 함수는 setStartAnimationFunc 으로 변경되었습니다.', '0110897');
    }

    /**
     * 애니메이션 종료 시 호출할 사용자 함수 설정 메서드입니다.
     * @param {function} func 사용사 함수 (호출시 입력되는 파라메터: fnc( U3dComponentPosition ) )
     */
    setEndAnimationFunc(func) {
        if(typeof func !== "function") {
            __GError__(this, `입력한 파라미터가 함수 형식이 아닙니다. 입력 파라미터 : ${func}`, '0111218');
            return;
        }
        this._endAnimationFunc = func;
    }

    /**
     * @deprecated 2.2.1.10.180.d 부터 setEndAnimationFunc 으로 변경되었습니다.
     */
    setEndFnc() {
        __GError__(this, 'GeOnDT Version: 2.2.1.10.180.d 부터 setEndFnc은 setEndAnimationFunc 으로 변경되었습니다.', '0111457');
    }

    /**
     * 컴포넌트 name을 편집하는 메서드입니다.
     * @param {string} newName 컴포넌트의 새 이름
     */
    editName(newName) {
        this.name = newName;
    }

    /**
     * 컴포넌트에 라벨 POI를 지정하는 메서드입니다.
     * @param {object} opt POI 생성 옵션
     * @param {WorldPositionVector3} [opt.position] POI 포지션 (EPSG:3857)
     * @param {string} [opt.image] POI 이미지 URL
     * @param {string} [opt.label] POI 라벨
     * @example
     * component.setLabel({
     *     position: {x: 14130641.7349, y: 4511699.005533, z: 20.8},
     *     image: '이미지경로/이미지.jpg',
     *     label: '컴포넌트1'
     * });
     */
    setLabel(opt) {
        opt = opt || {};

        let obj = this._object;

        this.removeLabel(); //기존 라벨 삭제

        let poiPos = new THREE.Vector3();
        defined(opt.position) ? poiPos.copy(opt.position) : poiPos.copy(this.position)

        let zOffset = 0;
        /** @type {Array<number>} */
        let childMaxBoundingZ = [];
        let originScale = new THREE.Vector3(0, 0, 0);
        if (defined(obj)) {
            obj.traverse(/** @param {import('three').Object3D} mesh */ function (mesh) {
                if (mesh instanceof UMesh || mesh instanceof THREE.Mesh) {
                    if (!mesh.geometry.boundingBox)
                        mesh.geometry.computeBoundingBox()
                    if (!mesh.geometry.boundingBox) return;
                    childMaxBoundingZ.push(mesh.geometry.boundingBox.max.z);
                    originScale = mesh.scale;
                }
            })
            childMaxBoundingZ.sort((a, b) => {
                return b - a;
            });

            zOffset = (childMaxBoundingZ[0] ?? 0) * this.scale.z * originScale.z;
            if (isNaN(zOffset) || !isFinite(zOffset))
                zOffset = 0;

            poiPos.z += zOffset;
        }

        let poi = new U3dPOI({
            position: poiPos,
            image: defaultValue(opt.image, undefined),
            label: defaultValue(opt.label, undefined)
        });

        poi.zOffset = zOffset;
        if (!defined(poi)) {
            console.log("fail to make new poi....");
            return
        }

        poi.visible = defined(this._labelVisible) ? this._labelVisible : false;
        this.poi = /**@type{PoiLike}*/ (poi);
        // this._labelVisible = poi.visible;
        this.drawArg._app.addPOI(poi);

        this.drawArg.setUpdateDate();
    }

    /**
     * 컴포넌트 라벨 POI를 제거하는 메서드입니다.
     */
    removeLabel() {
        if (!defined(this.poi)) return

        this.drawArg._app.removePOI(this.poi);
        this.poi = undefined;
    }

    /**
     * 컴포넌트 라벨 POI을 화면에 보여주는(Show) 메서드입니다.
     */
    showLabel() {
        if (!defined(this.poi)) {
            this.setLabel({label: this.name});
            if (!defined(this.poi)) return;
        }
        //if (!defined(this.poi)) return
        this.poi.show?.()
        this._labelVisible = true
        this.drawArg.setUpdateDate();
    }

    /**
     * 컴포넌트 라벨 POI을 화면에서 감추는(Hide) 메서드입니다.
     */
    hideLabel() {
        if (!defined(this.poi)) return
        this.poi.hide();
        this._labelVisible = false
        this.drawArg.setUpdateDate();
    }

    /**
     * 컴포넌트 라벨 POI의 가시화 여부를 반환하는 메서드입니다. <br>
     * 라벨 POI가 가시화 된 경우 true, 안된 경우 false를 반환한다.
     * @returns {boolean} 가시화 여부
     */
    isVisibleLabel() {
        if (!defined(this.poi)) return false;
        return this.poi.visible;
    }

    /**
     * 컴포넌트 라벨 POI를 컴포넌트의 이름으로 갱신하는 메서드입니다.
     */
    updateLabel() {
        this.removeLabel();
        this.setLabel({label: this.name});
    }

    /**
     * 컴포넌트가 주행할 경로 (U3dPathGeometry)를 설정하는 메서드입니다. <br>
     * 입력한 `U3dPathGeometry` 경로를 따라 컴포넌트가 주행합니다.
     * @param {PathGeometryLike} pathGeometry 주행할 경로 (U3dPathGeometry)
     * @param {boolean} [animateNow=true] `true`이면 경로 설정 즉시 애니메이션을 시작합니다.
     * @param {boolean} [hovering=true] 호버링 사용 여부<br>
     *  호버링 : 드론이 수직으로 상승 또는 하강하는 비행 동작. <br>
     *  - `true`면 지면에서 `U3dPathGeometry` 경로를까지 수직으로 상승/하강하는 경로가 추가됩니다.<br>
     *  - `false`면 처음부터 경로 시작점에 컴포넌트가 배치되고, 경로를 따라 이동합니다.
     */
    addPathGeometry(pathGeometry, animateNow = true, hovering= true) {
        if (!defined(pathGeometry)) return;
        this._pathGeometry = pathGeometry;

        if (hovering) {
            createHoverUpAnimation.call(this, animateNow);
            this._startAnimationId = UDEF.COMPONENT_ANIMATION.HOVER_UP;
        } else {
            createPathAnimation.call(this, animateNow);
            this._startAnimationId = UDEF.COMPONENT_ANIMATION.ROUTE;
        }
    }

    /**
     * 컴포넌트 주행/비행 애니메이션을 시작(Start)하는 메서드입니다.
     */
    moveStart() {
        const self = this;
        self._animation = true;
        self._nowDistance = 0;
        self._turnPointIndex = 0;
        self._turnPointLength = 0;
        const animation = self.getStartAnimation();
        if (!defined(animation)) {
            __GInfo__(self, "등록된 애니메이션이 없습니다.", '8421329');
            return;
        }
        self.startMixer?.();
        animation.start();
    }

    /**
     * 컴포넌트 주행/비행 애니메이션을 종료(Stop)하는 메서드입니다.
     * @param {boolean} [isInit=false] 애니메이션 초기화 여부. true면 애니메이션을 종류 후 초기화합니다.
     */
    moveStop(isInit=false) {
        const self = this;
        self._animation = false;
        self._nowDistance = 0;
        self._turnPointIndex = 0;
        self._turnPointLength = 0;

        const animation = self.animationControllers?.get(self._animationId ?? '');
        if (!defined(animation)) {
            __GInfo__(self, "등록된 애니메이션이 없습니다.", '8421740');
            return
        }
        self.stopMixer?.();
        animation.stop();
        if(isInit) animation.clear();
        self._animationId = self._startAnimationId; // 시작 애니메이션으로 초기화
    }

    /**
     * 컴포넌트 주행/비행 애니메이션을 재시작(Restart)하는 메서드입니다.
     */
    restart() {
        const self = this;
        self._animation = true;
        self._nowDistance = 0;
        self._turnPointIndex = 0;
        self._turnPointLength = 0;
        const start =  self.getStartAnimation();
        if (!defined(start)) {
            __GInfo__(self, "등록된 애니메이션이 없습니다.", '8422241');
            return
        }

        const aniList =[ ...( self.getAnimations()?.values() ?? [] ) ];
        for(const ani of aniList ){
            ani.clear();
        }
        self.startMixer?.();
        start.restart();
    }

    /**
     * 컴포넌트 주행/비행 애니메이션을 재개(Resume)하는 메서드입니다.
     */
    moveResume() {
        const self = this;
        self._animation = true;
        const animation = self.getAnimationNow();
        if (!defined(animation)) {
            __GInfo__(self, "등록된 애니메이션이 없습니다.", '8422543');
            return
        }
        self.startMixer?.();
        animation.resume();
    }

    /**
     * 컴포넌트 주행/비행 애니메이션을 일시정지(Pause)하는 메서드입니다.
     */
    movePause() {
        const self = this;
        self._animation = false;
        const animation = self.animationControllers?.get(self._animationId ?? '');
        if (!defined(animation)) {
            __GInfo__(self, "등록된 애니메이션이 없습니다.", '8422860');
            return
        }
        self.stopMixer?.();
        animation.pause();
    }

    /**
     * @ignore
     */
    _applyChangeFrame() {
        if (!this.needToChange) return
        this.speed = this.newSpeed ?? this.speed;
        if (defined(this.movePointList)) {
            if (this.movePointList.length !== 0) {
                this._createSpline(SPLINE_BUFFER_GEOMETRY);
                this._drawPath(SPLINE_BUFFER_GEOMETRY, ORIGIN_GEOMETRY);
                this._drawRealPath(SPLINE_BUFFER_GEOMETRY);
            }
        }
        const controllers = [...this.getAnimations().values()];
        for (const controller of controllers) {
            controller.setSpeed(this.speed);
            this.duration = controller.duration;
        }

        this.needToChange = false;
    }

    /**
     * @param {WorldPositionVector3} pathPosition 경로 위치 좌표
     *
     * @ignore
     */
    _applyPoiFrame(pathPosition) {
        if (!this.poi) return;

        this.poi.setPosition(new THREE.Vector3(
            pathPosition.x,
            pathPosition.y,
            pathPosition.z + (this.poi.zOffset ?? 0)
        ));
    }

    /**
     * @ignore
     */
    _applyJpgFrame() {
        if (this.componentLayer?._ext !== 'jpg') return;
        this.componentLayer._object.children.forEach((/** @type {import('three').Object3D} */ sprite) => {
            const spriteLike = /** @type {import('three').Sprite} */ (sprite);
            if (typeof spriteLike.material?.rotation === 'number') {
                spriteLike.material.rotation += 0.01;
            }
        });
    }

    /**
     * 컴포넌트가 이동할 Move Point를 추가하는 메서드입니다. <br>
     * 애니메이션 동작 시 Move Point를 따라 이동합니다.
     * @param {Array<GooglePositionWithCallback>} movePointList 이동할 Move Point 배열
     * @param {Array<import('three').Vector3>} [pitchYawRollList] 컴포넌트 방향각 옵션
     * @param {boolean} [animateNow=true] `true`면 경로 설정 즉시 애니메이션을 시작합니다.
     * @param [smoothCorner=true] `true`면 경로 생성 시 코너를 부드럽게 보정합니다.
     */
    addMovePoint(movePointList, pitchYawRollList, animateNow = true, smoothCorner= true) {
        if (!defined(movePointList)) return;
        this.movePointList = movePointList;
        this._animation = true;

        this.smoothCorner = smoothCorner;

        if (defined(pitchYawRollList)) {
            this.pitchYawRollList = pitchYawRollList;
        }

        if (this.type === COMPONENT_TYPE.CROWD) {
            createCrowdTween.call(this, animateNow);
            this._startAnimationId = UDEF.COMPONENT_ANIMATION.CROWD;
        } else {
            createMovePoint.call(this, animateNow);
            this._startAnimationId = UDEF.COMPONENT_ANIMATION.MOVE_POINT;
        }
    }

    /**
     * 컴포넌트에 오버레이(HTML 등 화면 요소)를 붙이는 메서드입니다. 붙인 오버레이는 컴포넌트가 이동할 때 함께 이동합니다.
     * @param {OverlayObject} overlay 붙일 오버레이 객체
     */
    setOverlay(overlay) {
        const self = this;
        self.overlay.push(overlay);
        const geoPosition = self.getGeographicPosition();
        const vectorLike = new THREE.Vector3(geoPosition.x, geoPosition.y, geoPosition.z);
        overlay.setPosition(vectorLike);
    }

    /**
     * 컴포넌트에 붙어 있는 오버레이 목록을 반환하는 메서드입니다.
     * @returns {Array<OverlayObject>} 오버레이 배열 (내부 배열을 직접 반환)
     */
    getOverlay() {
        return this.overlay;
    }

    /**
     * POI의 Z(높이) 오프셋 값을 반환하는 메서드입니다.
     * @returns {number | undefined} 라벨이 모델 위로 떠 있는 높이 (m). 라벨이 없으면 undefined
     */
    getPoiZOffset() {
        const self = this;
        if (!defined(self.poi) || !defined(self.poi.zOffset))
            return undefined;
        return self.poi.zOffset;
    }

    /**
     * @deprecated 제거될 메서드입니다.
     *
     * @returns {Array<LightLike | import('@union3d/view/USpotLight').USpotLight>} light 목록
     *
     * @ignore
     */
    getLights() {
        const self = this;
        return self._lightList;
    }

    /**
     * @deprecated 제거될 메서드입니다.
     *
     * @param {Array<LightLike>} list 조명 목록
     *
     * @ignore
     */
    setLights(list) {
        const self = this;
        self._lightList = list;
    }

    /**
     * @deprecated 제거될 메서드입니다.
     *
     * @ignore
     */
    getViews() {
        const self = this;
        return self._viewList;
    }

    /**
     * @deprecated 제거될 메서드입니다.
     *
     * @ignore
     */
    addView(/** @type {UnknownRecord} */ view) {
        const self = this;
        self._viewList.push(view);
    }

    /**
     * @deprecated 제거될 메서드입니다.
     *
     * @ignore
     */
    setViews(/** @type {Array<UnknownRecord>} */ list) {
        const self = this;
        self._viewList = list;
    }

    /**
     * 컴포넌트에 등록된 오버레이를 목록에서 제거하는 메서드입니다.
     * @param {OverlayObject} overlay 제거할 오버레이 객체 (`setOverlay`로 붙인 것)
     */
    removeOverlay(overlay) {
        const self = this;
        if (!overlay) return;
        if (self.overlay.length > 0) {
            for (let i = 0; i < self.overlay.length; i++) {
                if (defined(self.overlay[i].id)
                    && defined(overlay.id)
                    && self.overlay[i].id === overlay.id) {
                    self.overlay.splice(i--, 1);
                }
            }
        }
    }

    /**
     * 컴포넌트가 오버레이를 가지고 있는지 확인하는 메서드입니다. <br>
     * 파라미터로 overlay를 넣으면 해당 overlay가 있는지 검사합니다.
     * @param {OverlayObject} [overlay] 검색할 대상 overlay. 없으면 아무 오버레이나 가지고 있는지 검사합니다.
     * @returns {boolean} 가지고 있으면 true, 없으면 false
     */
    hasOverlay(overlay) {
        const self = this;
        if (self.overlay.length > 0) {
            if (defined(overlay)) {
                for (let i = 0; i < self.overlay.length; i++) {
                    if (self.overlay[i].id === overlay.id) {
                        return true;
                    }
                }
                return false;
            }
            return true;
        } else {
            return false;
        }
    }

    /**
     * @deprecated 제거될 메서드입니다.
     *
     * @returns {Boolean} light를 가지고 있는지 여부
     *
     * @ignore
     */
    hasLight() {
        const self = this;
        return self._lightList.length > 0;
    }

    /**
     * 컴포넌트의 위경도 좌표를 반환하는 메서드입니다.
     * @returns {GeoPositionVector3} 위경도 좌표
     */
    getGeographicPosition() {
        const self = this;
        const drawArg = self.drawArg;
        return drawArg.getWorldToGeographic(self.position.x, self.position.y, self.position.z);
    }

    /**
     * 컴포넌트의 3D 월드 좌표(EPSG:3857)를 위경도 좌표(EPSG:4326)로 변환하는 메서드입니다.
     * @param {WorldPositionVector3} world 3D 월드 좌표
     * @returns {GeoPositionVector3} 위경도 좌표
     */
    getGeographicPositionByWorld(world) {
        const self = this;
        const drawArg = self.drawArg;
        return drawArg.getWorldToGeographic(world.x, world.y, world.z);
    }

    /**
     * 컴포넌트로 카메라 추적 시점을 설정하는 메서드입니다.
     *
     * @param {boolean} bool 카메라 추적 활성 여부. <br>
     * `true`면 카메라가 컴포넌트를 지정한 시점으로 실시간 추적하고, `false`면 추적을 중지합니다.
     * @param {string} [view]
     * 카메라 시점 종류. <br>
     * - `FrontView` : 대상의 정면에서 바라보는 시점  <br>
     * - `TopView` : 대상의 위에서 내려다보는 시점  <br>
     * - `ThirdPersonFront` :  3인칭 시점 (컴포넌트 앞면)<br>
     * - `ThirdPersonRight` : 3인칭 시점 (컴포넌트 우측면) <br>
     * - `ThirdPersonLeft` : 3인칭 시점 (컴포넌트 좌측면)<br>
     * - `ThirdPersonBack` : 3인칭 시점 (컴포넌트 뒷면)<br>
     * - `ThirdPersonRound` : 3인칭 시점 (컴포넌트를 기준으로 회전)
     *
     * @param {import('three').Vector3Like} [offset]
     * 카메라 위치 보정값 (x, y, z). <br>
     * 입력한 값만큼 카메라 위치를 이동시킵니다. <br>
     * 예: `{ x: 0, y: 0, z: 10 }` → 대상보다 10m에서 카메라가 따라감
     * @param {import('three').Vector3Like} [targetOffset]
     * 카메라가 바라보는 지점의 보정값 (x, y, z). 생략 가능. <br>
     * 입력한 값만큼 카메라의 시선 방향을 이동시킵니다. <br>
     * 예: `{ x: 0, y: 0, z: 2 }` → 대상의 2m 위 지점을 바라봄
     */
    setCameraTrace(bool, view, offset, targetOffset) {
        const self = this;
        self.isTrace = bool;
        self.updateAnimationCameraTrace();
        self.view = view;
        if(offset)
            self._offset = offset;
        if(targetOffset)
            self._targetOffset = targetOffset;
        if (defined(self.poi))
            self.poi.visible = bool;

        if (view === 'FrontView') {
            self.componentLayer._group.visible = bool;
        } else if (view === 'TopView') {
            self.componentLayer._group.visible = bool;
        } else if (self.view === 'ThirdPerson'
            || self.view === 'ThirdPersonRound'
            || self.view === 'ThirdPersonBack'
            || self.view === 'ThirdPersonLeft'
            || self.view === 'ThirdPersonRight'
            || self.view === 'ThirdPersonFront') {
            self.componentLayer._group.visible = bool;
            if (defined(self.poi))
                self.poi.visible = false;
        } else {
            self.componentLayer._group.visible = !bool;
        }
    }

    /**
     * 현재 `isTrace` 값을 모든 주행 애니메이션 컨트롤러에 전달해 카메라 추적 상태를 동기화합니다. `setCameraTrace`가 내부적으로 호출합니다.
     */
    updateAnimationCameraTrace() {
        for (const controller of this.animationControllers.values()) {
            controller.setCameraTrace(Boolean(this.isTrace));
        }
    }

    /**
     * 컴포넌트의 이동 경로 색상을 지정하는 함수
     * @param {import('three').ColorRepresentation} color 색상
     */
    setPathColor(color) {
        if (this.splineObject && this.splineObject.material) {
            const material = /** @type {MutableMaterial} */ (this.splineObject.material);
            material.color = new THREE.Color(color);
        }
        if (this.oriSplineObject && this.oriSplineObject.material) {
            const material = /** @type {MutableMaterial} */ (this.oriSplineObject.material);
            material.color = new THREE.Color(color);
        }
    }

    /**
     * 컴포넌트의 이동 경로 라인 투명도를 지정하는 함수
     * @param {number | string} opacity 투명도 (0 투명 ~ 1 불투명). 문자열은 숫자로 변환
     */
    setPathOpacity(opacity) {
        opacity = Number(opacity);
        if (!Number.isFinite(opacity)) return;
        if (this.splineObject && this.splineObject.material) {
            const pathObj = /** @type {{setOpacity: function(number): void, material: MutableMaterial | Array<MutableMaterial>}} */ (/** @type {unknown} */ (this.splineObject));
            if (typeof pathObj.setOpacity === 'function') pathObj.setOpacity(opacity);
            else (/** @type {MutableMaterial} */ (pathObj.material)).opacity = opacity;
        }
        if (this.oriSplineObject && this.oriSplineObject.material) {
            (/** @type {MutableMaterial} */ (this.oriSplineObject.material)).opacity = opacity;
        }
        this.pathOpacity = opacity;
    }

    /**
     * 컴포넌트의 이동 경로 라인 투명도를 반환하는 함수
     * @returns {number} 투명도 (0~1)
     */
    getPathOpacity() {
        if (this.oriSplineObject && this.oriSplineObject.material) {
            return /** @type {MutableMaterial} */ (this.oriSplineObject.material).opacity ?? this.pathOpacity;
        }
        return this.pathOpacity;
    }

    /**
     * 컴포넌트의 위치를 지정하는 함수
     * @param {WorldPositionVector3} position 3D 월드 좌표
     * @param {import('three').Vector3 | undefined} [lookAt] 이동 후 바라볼 위치 (월드 좌표). 주면 그 방향으로 회전합니다
     * @param {boolean} [fixedOverlay=false] true면 오버레이를 현재 위치에 고정하고, false면 컴포넌트와 함께 이동시킵니다
     */
    setPosition(position, lookAt, fixedOverlay=false) {
        this.position.set(position.x, position.y, position.z);
        if (defined(this._object)) {
            settingObject.call(this, this._object);
        }

        if (defined(lookAt)) this.lookAt = lookAt;

        if (this.poi) {
            this.poi.setPosition(new THREE.Vector3(
                position.x,
                position.y,
                position.z + (this.poi.zOffset ?? 0)
            ));
        }

        // overlay가 하나 이상 존재하는 경우
        if(!fixedOverlay) this.settingOverlay(position);

        this.recordCumulativePathFrame?.(this.position, undefined, undefined, this.speed / 3.6);
    }

    /**
     * 주행 중 다른 객체가 충돌 감지 거리 안에 들어왔을 때 호출할 콜백을 지정하는 함수.
     * @param {function} func `(component) => void` 형태의 콜백. 충돌한 컴포넌트가 전달됩니다
     */
    setCollisionFunction(func) {
        if (!defined(func)) {
            this._collisionFunction = undefined;
        } else {
            this._collisionFunction = func;
        }
    }

    /**
     * 주행 중 충돌로 판정할 거리를 설정하는 함수
     * @param {number} distance 충돌 감지 거리 (m, 기본 10)
     */
    setCollisionDistance(distance) {
        distance = Number(distance);
        this._collisionDistance = distance;
    }

    /**
     * 경로 주행 시 유지할 고도를 설정합니다. 설정하면 경로 좌표의 높이 대신 이 값이 z에 적용됩니다.
     * @param {number | string | undefined} height 유지할 높이 (월드 z, m). undefined면 경로 높이를 그대로 사용
     */
    setHeight(height) {

        if (defined(height)) {
            height = Number(height);
            this._setHeight = height;
        }
    }

    /**
     * 컴포넌트의 회전값을 지정하는 함수
     * @param {RadianEulerLike} rotation 회전값(radian)
     */
    setRotation(rotation) {
        const self = this;
        if (!defined(rotation)) return

        let rotX = defined(rotation.x) ? rotation.x : 0;
        let rotY = defined(rotation.y) ? rotation.y : 0;
        let rotZ = defined(rotation.z) ? rotation.z : 0;

        self.rotation.set(rotX, rotY, rotZ);
        if (defined(self._object)) {
            settingObject.call(this, self._object);
        }
        // self.drawArg.setUpdateDate();
    }

    /**
     * 컴포넌트의 x축 회전값을 지정하는 함수
     * @param {Degree} degree x축 회전값 (degree)
     */
    setRotationX(degree) {
        let radian = (Math.PI / 180) * degree;
        this.rotation.set(radian, this.rotation.y, this.rotation.z);
        if (defined(this._object)) {
            settingObject.call(this, this._object);
        }
        this.drawArg.setUpdateDate();
    }

    /**
     * 컴포넌트의 y축 회전값을 지정하는 함수
     * @param {Degree} degree y축 회전값 (degree)
     */
    setRotationY(degree) {
        let radian = (Math.PI / 180) * degree;
        this.rotation.set(this.rotation.x, radian, this.rotation.z);
        if (defined(this._object)) {
            settingObject.call(this, this._object);
        }
        this.drawArg.setUpdateDate();
    }

    /**
     * 컴포넌트의 z축 회전값을 지정하는 함수
     * @param {Degree} degree z축 회전값 (degree)
     */
    setRotationZ(degree) {
        let radian = (Math.PI / 180) * degree;
        this.rotation.set(this.rotation.x, this.rotation.y, radian);
        if (defined(this._object)) {
            settingObject.call(this, this._object);
        }
        this.drawArg.setUpdateDate();
    }

    /**
     * 컴포넌트의 회전값을 반환하는 함수
     * @returns {import('three').Euler} rotation 회전값 (radian)
     */
    getRotation() {
        return this.rotation;
    }

    /**
     * 해당 목록에서 컴포넌트가 광원을 가지고 있는지 확인하는 함수
     * @param {Array<LightLike>} lightList 전체 광원 목록
     * @returns {boolean} 광원 존재 여부
     */
    checkIshaveLight(lightList) {
        for (let i = 0; i < lightList.length; i++) {
            if (lightList[i].id === this.name)
                return true;
        }
        return false;
    }

    /**
     * 컴포넌트를 수직축(z축) 기준으로 지정 각도로 회전시키는 함수. 누적이 아니라 절대 각도로 설정됩니다.
     * @param {Degree} degree 회전 각도 (°, -360 ~ 360). 범위를 벗어나면 예외가 발생합니다
     */
    rotateByAngle(degree) {
        degree = Number(degree); // 문자 -> 숫자변환
        if (!Number.isFinite(degree)) return;
        if (degree < -360 || degree > 360) {
            throw new Error('\'degree\' :' + degree + ' out of range -360 ≤ degree ≤ 360');
        }
        const q = new THREE.Quaternion();

        const radian = (Math.PI / 180) * degree;
        q.setFromAxisAngle(ROTATE_AXIS, radian);
        const euler = new THREE.Euler();
        euler.setFromQuaternion(q);
        this.rotation.copy(euler);
        this._object?.rotation.copy(euler);
        this.updateChildrenMatrix();
    }

    /**
     * 컴포넌트의 크기를 지정하는 함수
     * @param {number | string | import('three').Vector3Like} scalar 스칼라 값 혹은 {x,y,z} 값
     */
    setScale(scalar) {
        if (typeof scalar === 'number' || typeof scalar === 'string') {
            scalar = Number(scalar)
            if (!Number.isFinite(scalar)) return;
            this.scale.set(scalar, scalar, scalar);
        } else {
            this.scale.set(scalar.x, scalar.y, scalar.z);
        }

        if (defined(this._object)) {
            this._object.scale.set(this.scale.x, this.scale.y, this.scale.z);
        }
        this.updateChildrenMatrix();
        this.drawArg.setUpdateDate();

    }

    /**
     * 컴포넌트의 크기를 반환하는 함수
     * @returns {import('three').Vector3} 크기 {x,y,z} 값
     */
    getScale() {
        return this.scale;

    }

    /**
     * 컴포넌트의 현재 크기에 배율을 곱하는 함수 (2면 두 배)
     * @param {number | string} num 곱할 배율. 문자열은 숫자로 변환
     */
    multiplyScale(num) {
        const scalar = Number(num);
        if (!Number.isFinite(scalar)) return;
        this.scale.multiplyScalar(scalar);
        this.updateChildrenMatrix();
    }

    /**
     * 컴포넌트의 이름을 반환하는 함수
     * @returns {string} 컴포넌트 이름
     */
    getName() {
        return this.name;
    }

    /**
     * 컴포넌트의 ID를 반환하는 함수
     * @returns {string | number} 컴포넌트 ID
     */
    getId() {
        return this.id;
    }

    /**
     * 애니메이션 동작시 컴포넌트가 현재까지 이동한 거리를 반환하는 함수
     * @returns {number} 현재까지 이동한 거리 (m). 주행 중이 아니면 0
     */
    getDistanceTraveled() {
        let result = 0;
        const animationController = this.animationControllers.get(this._animationId ?? '');
        if(!defined(animationController))  return result;

        if (animationController.accumulatedDistance) {
            result = animationController.accumulatedDistance;
        }
        return result;
    }

    /**
     * 모델 자체 애니메이션 클립(액션) 목록을 반환합니다. `getAnimationClips`와 같은 값을 돌려줍니다.
     *
     * @returns {Record<string, import('three').AnimationAction> | undefined} 클립 이름을 키로 한 액션 객체. 믹서가 없으면 undefined
     */
    getAnimationList() {
        return this.getMixerController?.()?.getActions?.();
    }

    /**
     * 컴포넌트 주행 애니메이션 목록을 반환하는 함수.
     * @returns {Map<string, import('@union3d/analy/UAnimationController').UAnimationController>} animationControllers 애니메이션 목록
     **/
    getAnimations() {
        return this.animationControllers;
    }

    /**
     * 애니메이션 ID로 애니메이션 컨트롤러를 반환하는 함수.
     * @param {string} animationId 애니메이션 ID
     * @returns {import('@union3d/analy/UAnimationController').UAnimationController | undefined} UAnimationController 애니메이션 컨트롤러
     **/
    getAnimationById(animationId) {
        return this.animationControllers.get(animationId);
    }

    /**
     * 현재 동작 중인 주행 애니메이션 컨트롤러를 반환하는 함수.
     * @returns {import('@union3d/analy/UAnimationController').UAnimationController | undefined} 현재 애니메이션 컨트롤러. 주행 중이 아니면 undefined
     */
    getAnimationNow() {
        return this.animationControllers.get(this._animationId ?? '');
    }

    /**
     * 현재 애니메이션 또는 지정한 애니메이션의 상태 정보를 반환하는 함수.
     * @param {string} [animationId] 조회할 애니메이션 ID. 생략 시 현재 동작 중인 애니메이션 조회
     * @returns {U3dComponentAnimationInfo | undefined}
     */
    getAnimationInfo(animationId = undefined) {
        const id = defined(animationId) ? animationId : this._animationId;
        if (!defined(id)) return;

        const controller = this.animationControllers.get(id);
        if (!defined(controller)) return;

        const accumulatedDistance = controller.accumulatedDistance === controller.logDistance
            ? controller.accumulatedDistance
            : controller.logDistance;
        const accumulatedTime = controller.accumulatedTime === controller.logTime
            ? controller.accumulatedTime
            : controller.logTime;

        /** @type {U3dComponentAnimationInfo} */
        const info = {
            animationId: id,
            startAnimationId: this._startAnimationId,
            isRunning: controller.isRunning,
            isPaused: controller.isPaused,
            rate: controller.updateRate,
            speed: controller.speed,
            speedMs: controller.speedMs,
            distance: controller.distance,
            duration: controller.duration,
            fixedSpeed: controller.fixedSpeed ? '등속': '변속',
            accumulatedDistance,
            accumulatedTime,
        };

        const waypointQueueSize = /** @type {{waypointQueueSize: number}} */ (/** @type {unknown} */ (controller)).waypointQueueSize;
        if ((waypointQueueSize ?? 0) > 0) {
            info.waypointQueueSize = waypointQueueSize;
        }

        return info;
    }

    /**
     * startAnimationId에 해당하는 StartAnimation 대상을 반환합니다.
     * @returns {import('@union3d/analy/UAnimationController').UAnimationController | undefined} 대상 UAnimationController
     */
    getStartAnimation() {
        return this.animationControllers.get(this._startAnimationId ?? '');
    }

    /**
     * 지정한 모델 애니메이션 클립을 재생하면서 재생 속도를 갱신하는 함수. `updateAction`과 같습니다.
     * @param {string} key 실행하려는 애니메이션 클립 식별 ID (`getAnimationClips`의 키)
     * @param {number} [speed] 애니메이션 재생 배율. 1이 원래 속도이며 생략하면 현재 속도를 유지합니다
     * @param {number} [fadeDuration=0.005] 재생 전환에 걸리는 시간 (초)
     * @example
     *      let component = componentLayer.getComponentByName('uam_01_1');
     *      let key = Object.keys(component.getAnimationList())[0];
     *      let animationInterval = setInterval(function (){
     *              selected.updateAnimation(key, 1);
     *          },10)
     */
    updateAnimation(key, speed = undefined, fadeDuration = 0.005) {
        this.startAction(key, fadeDuration, speed);
    }



    // TODO 메서드 명 변경 -> 버전 업데이트 후 제거
    /**
     * @deprecated stopMixer로 메서드를 사용하세요
     * @param {number} [fadeDuration=0.005]
     */
    stopAllAnimation(fadeDuration = 0.005) {
        __GInfo__(this, `메서드 이름이 stopMixer로 변경되었습니다. stopAllAnimation은 곧 삭제될 예정이니 코드를 업데이트해 주세요.`, '4200137')
        this.stopMixer();
    }



    // TODO 메서드 명 변경 -> 버전 업데이트 후 제거
    /**
     * @deprecated startMixer 메서드를 사용하세요
     * @param {number}[fadeDuration=0.005]
     */
    startAllAnimation(fadeDuration = 0.005) {
        __GInfo__(this, `메서드 이름이 startMixer로 변경되었습니다. startAllAnimation은 곧 삭제될 예정이니 코드를 업데이트해 주세요.`, '4200482')
        this.startMixer();
    }

    /**
     * 컴포넌트의 내장 애니메이션 클립을 모두 정지하는 함수
     */
    stopMixer() {
        const mixerController = this.getMixerController?.();
        mixerController?.stopAll();
    }

    /**
     * 컴포넌트의 내장 애니메이션 클립을 모두 동작시키는 함수
     */
    startMixer() {
        const mixerController = this.getMixerController?.();
        if (!mixerController) return;
        // 동작할 Action이 없으면 취소
        if (mixerController.hasRunningActions()) return;

        mixerController.startAll({fadeDuration: 0.005, reset: true});
    }

    /**
     * 컨포넌트에 주행 애니메이션에 대한 컨트롤러를 추가하는 함수
     * @param {string} animationID - 생성할 애니메이션 컨트롤러의 고유 ID
     * @param {function(number, number): void} animation - 실행할 애니메이션 함수 (deltaTime, updateRate를 인자로 받음)
     * @param {number} [durtaion] - 주행 시간 (입력하면 해당 시간내로 주행을 완료하기 위해 가변 속도로 주행한다)
     * @returns {import('@union3d/analy/UAnimationController').UAnimationController|undefined} 생성된 UAnimationController 객체, 생성 실패 시 undefined 반환
     * @example
     * const controller = position.makeAnimationController("run1", (deltaTime, updateRate) => {
     *     mesh.position.lerpVectors(start, end, rate);
     * });
     * @ignore
     */
    makeAnimationController(animationID, animation, durtaion) {
        const self = this;
        if (!defined(animationID) || !Number.isFinite(self.distance)) return undefined;

        if(self.animationControllers.has(animationID)) return self.animationControllers.get(animationID);

        const opt = {
            name : animationID,
            drawArg: self.drawArg,
            animation: animation,
            distance: self.distance,
            duration: durtaion,
            speed: self.speed,
            isTrace: defaultValue(self.isTrace, false),
            updateDistance: defaultValue(self.updateDistance, 100),
            updateAngle: defaultValue(self.updateAngle, 45),
        }
        /** @type {import('@union3d/analy/UAnimationController').UAnimationController | undefined} */
        let controller;
        try {
            controller = new UAnimationController(opt);
            self.animationControllers.set(animationID, controller);
        } catch (e) {
            __GError__(self, "Animation Controller를 생성할 수 없습니다. ", '8450756');
        }
        return controller;
    }

    /**
     * 컴포넌트의 경로 이동 애니메이션 실행 중 강제로 위치를 이동 시키는 함수
     * @param {number} rate 이동 목표 비율. 0(시작점) ~ 1(종료점)
     */
    setForceMoveTween(rate) {
        const animation = this.getAnimationNow();
        if (!animation?.isRunning) return;

        rate = Math.max(0, Math.min(1, Number(rate) || 0));

        const targetDistance = animation.distance * rate;
        const currentDistance = animation.accumulatedDistance;
        const deltaDistance = targetDistance - currentDistance;

        if (deltaDistance > 0) {
            animation.jumpByDistance(deltaDistance);
        } else if (deltaDistance < 0) {
            animation.rewindByDistance(Math.abs(deltaDistance));
        }
    }

    /**
     * 현재의 상태를 초기 상태로 저장합니다.
     */
    saveObjectSetting() {
        const self = this;
        if (!self._object) return;
        self._initObject = self._object.clone();
    }

    /**
     * 컴포넌트를 선택했을 때 모델 전체를 지정 색상·투명도로 강조(highlight)하는 함수. `restoreMaterial`로 원래 재질을 복원합니다.
     *
     * @param {unknown} intersect 픽킹 결과(교차 정보). 현재 구현에서는 사용하지 않으며 모델 전체가 강조됩니다
     * @param {import('three').ColorRepresentation} [color] 강조 색상 (기본 '#fe5f55')
     * @param {number} [opacity] 강조 투명도 (0~1, 기본 0.6)
     *
     * @returns {boolean} 강조가 적용되면 true
     */
    pickMaterial(intersect, color = HIGH_LIGHT_COLOR, opacity = HIGH_LIGHT_OPACITY
    ) {
        const object = /** @type {PickableObject3D | undefined} */ (this._object);
        object?.pickMaterial?.(intersect, color, opacity);
        return true;
    }

    /**
     * pickMaterial을 호출하여 강조한 색상을 복원합니다.
     */
    restoreMaterial() {
        const object = /** @type {PickableObject3D | undefined} */ (this._object);
        object?.restoreMaterial?.();
    }

    /**
     * 카메라 추적 중 매 프레임 카메라 위치·시선을 컴포넌트에 맞춰 갱신합니다. 주행 애니메이션이 내부적으로 호출합니다.
     * @param {import('three').Vector3} pathPosition 컴포넌트의 현재 위치 (월드 좌표)
     * @param {number} delayCount 3인칭 회전 시점에서 회전을 지연시키는 프레임 수
     * @param {number} count 현재까지 경과한 프레임 수
     * @returns {{delayCount:number, count: number}} 다음 프레임에 넘길 갱신된 delayCount·count
     */
    updateCameraTrace(pathPosition, delayCount, count) {
        const self = this;
        if (self.isTrace) {
            const view = /** @type {string} */ (self.view ?? 'TopView');
            const camera = self.drawArg.getCamera();
            const control = self.drawArg.getCameraControl();

            if(!camera || !control){
                __GError__(this, '카메라 및 컨트롤러 정보를 인식할 수 없습니다.', '8207329');
                return {delayCount, count};
            }

            const pos =  CAM_TRACE_UPDATE.TEMP_UNIT_VEC.copy(pathPosition);

            if (view === 'FrontView') {
                const camPos = CAM_TRACE_UPDATE.TEMP_POS_VEC.copy(pos);
                const target = CAM_TRACE_UPDATE.TEMP_TARGET_VEC.copy(self.lookAt ?? self.position);
                const dir = CAM_TRACE_UPDATE.TEMP_DIR_VEC;

                //- 카메라 위치 offset ------------------------------------------------//
                if (defined(self._offset)) {
                    CAM_TRACE_UPDATE.TEMP_UNIT_VEC
                        .set(self._offset.x, self._offset.y, self._offset.z)
                        .multiply(self.scale)
                        .applyQuaternion(self.quaternion);

                    camPos.add(CAM_TRACE_UPDATE.TEMP_UNIT_VEC);
                    target.add(CAM_TRACE_UPDATE.TEMP_UNIT_VEC);
                }

                //- target offset ----------------------------------------------------//
                if (defined(self._targetOffset)) {
                    target.add(self._targetOffset);
                }

                //- 카메라 전방 방향 계산 ---------------------------------------------//
                dir.subVectors(target, camPos);

                // 코너 같은 경로에서 크게 뒤틀리는거 방지
                if (dir.lengthSq() < 0.0001) {
                    dir.set(0, 0, -1).applyQuaternion(self.quaternion);
                }

                dir.normalize();

                //- FrontView target 보정 ---------------------------------------------//
                target.copy(camPos).addScaledVector(dir, 10);

                camera.position.copy(camPos);
                control.target.copy(target);
            } else if (INTERNAL.isThirdPersonView(view)) {
                // 선택한 3인칭 시점에 맞춰 카메라의 회전과 모델 경계 기반 위치를 계산합니다.
                const rotData = INTERNAL.getCameraRotation(view, delayCount, count);
                const data = INTERNAL.getCameraData(self, view, pos, rotData.rot);
                const addHeight = data.length / 6;
                camera.position.set(data.pos.x, data.pos.y, data.pos.z + addHeight);
                control.target.copy(self.position).setZ(self.position.z + addHeight);
                count = rotData.count;
            } else { // top view
                camera.position.copy(pos).setZ(pos.z + self._topViewDistance);
                if (self.lookAt && self._animationId === UDEF.COMPONENT_ANIMATION.ROUTE) {
                    control.target.copy(self.lookAt);
                } else {
                    control.target.copy(pos);
                }
            }
            control.update(false, false);
        }
        return {delayCount, count}
    }
}

/**
 * hover up과 관련된 animation 동작을 생성합니다.
 * @this {U3dComponentPosition}
 * @param {boolean} [animateNow=true]
 * @returns {void}
 *
 * @ignore
 */
function createHoverUpAnimation(animateNow = true) {
    const self = this;
    if (!defined(self._pathGeometry?.geometry?.curve)) return;

    const pathOption = self._pathGeometry._pathOption;
    if(!defined(pathOption)) return;

    const curve = self._pathGeometry.geometry.curve;
    const startPoint = curve.points[0].clone();

    if(!defined(pathOption.realHeight)) {
        const meterHeight = pathOption.minheight ?? 0;
        const realScale = (1 / UMathEngine.getRealScaleAtGoogle(startPoint.y));
        pathOption.realHeight = meterHeight * realScale;
    }
    self._nowDistance = 0;
    self.distance = pathOption.realHeight + startPoint.z;
    if(isWrong(self.distance)) self.distance =0;

    self.duration = self.distance / (self.speed / 3.6) * 1000;   // 총 주행 시간
    if(self.distance <= 0 || !isFinite(self.distance)) {
        console.warn('주행거리가 0보다 작은 음수입니다. 주행경로 설정이 올바른지를 검토해주세요.');
        return;
    }

    let terrainHeight = self.drawArg?.getRenderHeightAtPoint(startPoint.x, startPoint.y); //확인됨
    if(!defined(terrainHeight) || terrainHeight === UDEF.INVALID || terrainHeight === UDEF.TERRAIN_NO_DATA)
        terrainHeight = 0;
    const endPoint = new THREE.Vector3().copy(startPoint).setZ(self.distance);
    startPoint.z = terrainHeight + self._pathGeometry._pathOption.maxheight;

    const lookAt = curve.points[1].clone();
    const animationID = UDEF.COMPONENT_ANIMATION.HOVER_UP;
    const ctx = {
        animationID,
        startPoint,
        endPoint,
        lookAt,
        delayCount: 0,
        count: 0,
        instanceId: -1,
        object: self._object
    };

    // -------- instanced 분기 처리 --------//
    if(self._setInstanced) {
        const object = /**@type{InstancedComponent}*/(self).instancedGroup;
        const rawInstanceId = self.getInstancedId();
        const instanceId = typeof rawInstanceId === 'number'
            ? rawInstanceId % self.componentLayer._instancedMaxCount
            : -1;
        Object.assign(ctx , {object, instanceId})
    }

    const animation = self.makeAnimationController(
        animationID,
        /** @this {import('@union3d/analy/UAnimationController').UAnimationController} */
        function (/** @type {number} */ deltaTime, /** @type {number} */ distanceRate) {
            upHoverAnimation(
                self,
                /** @type {UAnimationController} */(this),
                /** @type {import('@union3d/analy/UDrivingAnimation').HoverUpContext} */(ctx),
                deltaTime,
                distanceRate
            );
        }
    );
    if (!animation) return;
    animation.onComplete(()=>{
        self._nowDistance = 0;
        self._endAnimationFunc?.(self);
        const hoverUp= self.animationControllers.get(UDEF.COMPONENT_ANIMATION.HOVER_UP);
        if(!defined(hoverUp)) {
            self._animation = false;
            return;
        }
        hoverUp.stop();

        const route = self.animationControllers.get(UDEF.COMPONENT_ANIMATION.ROUTE);
        route ? route.start(true) : createPathAnimation.call(self, true);
        self._animationId = UDEF.COMPONENT_ANIMATION.ROUTE;
    });
    if (!animateNow) return;
    try {
        animation.start();
        self._startAnimationFunc?.(self);
        self._animation = true;
        self._animationId = animationID;
    }catch (e) {
        __GError__(self, `${animationID} 애니메이션을 시작하지 못했습니다 : ${e}`, "1783718")
    }
}

/**
 * hover down animation에 대한 동작을 생성합니다.
 * @this {U3dComponentPosition}
 * @param {boolean} [animateNow=false]
 * @returns {void}
 *
 * @ignore
 */
function createHoverDownAnimation(animateNow = false) {
    const self = this;
    if (!defined(self._pathGeometry?.geometry?.curve)) return;

    const pathOption = self._pathGeometry._pathOption;
    if(!defined(pathOption)) return;

    const curve = self._pathGeometry.geometry.curve;
    const startPoint = curve.points[curve.points.length - 1].clone();

    if(!defined(pathOption.realHeight)) {
        const meterHeight = pathOption.minheight ?? 0;
        const realScale = (1 / UMathEngine.getRealScaleAtGoogle(startPoint.y));
        pathOption.realHeight = meterHeight * realScale;
    }

    self._nowDistance = 0;
    self.distance = pathOption.realHeight + startPoint.z;
    self.duration = self.distance / (self.speed / 3.6) * 1000;   // 총 주행 시간

    let terrainHeight = self.drawArg.getRenderHeightAtPoint(startPoint.x, startPoint.y); //확인됨
    if(!defined(terrainHeight) || terrainHeight === UDEF.INVALID || terrainHeight === UDEF.TERRAIN_NO_DATA)
        terrainHeight = 0;
    const endPoint = new THREE.Vector3().copy(startPoint);
    startPoint.z = self.distance;
    endPoint.z = terrainHeight + self._pathGeometry._pathOption.maxheight;

    const animationID = UDEF.COMPONENT_ANIMATION.HOVER_DOWN;
    const ctx = {
        animationID,
        startPoint,
        endPoint,
        delayCount: 0,
        count: 0,
        instanceId: -1,
        object: self._object
    };

    // -------- instanced 분기 처리 --------//
    if(self._setInstanced) {
        const object = /**@type{InstancedComponent}*/(self).instancedGroup;
        const rawInstanceId = self.getInstancedId();
        const instanceId = typeof rawInstanceId === 'number'
            ? rawInstanceId % self.componentLayer._instancedMaxCount
            : -1;
        Object.assign(ctx , {object, instanceId})
    }

    const animation = self.makeAnimationController(
        animationID,
        /** @this {import('@union3d/analy/UAnimationController').UAnimationController} */
        function (/** @type {number} */ deltaTime, /** @type {number} */ distanceRate) {
            downHoverAnimation(
                self,
                /** @type {UAnimationController} */(this),
                /** @type {import('@union3d/analy/UDrivingAnimation').HoverDownContext} */(ctx),
                deltaTime,
                distanceRate
            );
        }
    );
    if (!animation) return;

    animation.onComplete(()=>{
        const controller = self.animationControllers;

        controller.get(UDEF.COMPONENT_ANIMATION.HOVER_DOWN)?.stop();
        self._animation = false;
        self._nowDistance = 0;
        self._endAnimationFunc?.(self);

        if (self.repeat) {
            setTimeout(() => {
                const startAnimation = controller.get(self._startAnimationId ?? '');
                if(!defined(startAnimation)) return;

                startAnimation.start(true);
                self._animation = true;
                self._animationId = self._startAnimationId;
            }, 100);
        }
    });
    try {
        animation.start();
        self._startAnimationFunc?.(self);
        self._animation = true;
        self._animationId = animationID;
    }catch (e) {
        __GError__(self, `${animationID} 애니메이션을 시작하지 못했습니다 : ${e}`, "1787270")
    }
}

/**
 * @this {U3dComponentPosition}
 * @returns {void}
 *
 * @ignore
 */
function initialize() {
    const self = this;
    if (!defined(self._object)) return;

    self._initPosition = self.position.clone();
    self._initRotation = self.rotation.clone();
    self._initScale = self.scale.clone();

    if (defined(self._object) && defined(self.position)) {
        self._object.position.copy(self.position);
        self._object.scale.copy(self.scale);
        self._object.rotation.copy(self.rotation);
    }

    //root node init
    if (!self._setInstanced) {
        for (const child of self._object.children) {
            if (defined(child.position)) {
                child.position.set(0, 0, 0);
            }
        }
    }

    self._object.updateMatrixWorld();
    const objectName = self._object.name || self.name || Guid();
    if (defined(self.componentLayer.getBbox(objectName))) {
        self._bbox = self.componentLayer.getBbox(objectName);
    } else {
        let object = self._object
        self._bbox = new UBox3().setFromObject(object); // boundingbox 속성도 추가 해준다
        self.componentLayer.setBbox(objectName, self._bbox);
    }

    const layerName = String(self.componentLayer.getName() ?? '');
    self._object.traverse(/** @param {ModelMesh} child */ function (child) {
        if (child instanceof THREE.Mesh) {
            const mesh = /** @type {ModelMesh} */ (child);
            mesh._bbox = self._bbox;
            mesh.getBBox = self.getBoundingBox.bind(self);
            // const euler =  self._object.rotation.clone();
            // child.setRotationFromEuler(euler);
            //child.rotation = self._object.rotation.clone();
            mesh._utype = UDEF.UMESH_TYPE._component;
            mesh._rootObject = self._object;

            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const material of materials) {
                if (!material) continue;
                if (self._objectOpacity < 1) {
                    material.transparent = true;
                    material.opacity = self._objectOpacity;
                } else {
                    material.transparent = false;
                }
            }
        }
        child._ulayername = layerName;
    });
    self._ulayername = layerName;
    self._initObject = self._object.clone();

}

/**
 * @this {U3dComponentPosition}
 * @param {boolean} [animateNow=true]
 * @returns {void}
 *
 * @ignore
 */
function createPathAnimation(animateNow = true) {
    const self = this;
    if (!defined(self._pathGeometry?.geometry?.curve)) return;

    const pathOption = self._pathGeometry._pathOption;
    if(!defined(pathOption)) return;

    if(!defined(pathOption.realHeight)) {
        const meterHeight = pathOption.minheight ?? 0;
        const startPoint = self.getVectorPosition();
        const realScale = (1 / UMathEngine.getRealScaleAtGoogle(startPoint.y));
        pathOption.realHeight = meterHeight * realScale;
    }

    const pathHeight = pathOption.realHeight ?? self.getVectorPosition().z ?? 0;
    const curve = self._pathGeometry.geometry.curve;
    const cacheLengths = curve.getLengths(Math.max(curve.points.length * 4, 64));

    self._nowDistance = 0;
    self.distance = cacheLengths[cacheLengths.length - 1] ?? 0; // 주행 총 거리
    self.duration = self.distance / (self.speed / 3.6) * 1000;   // 총 주행 시간
    if(self.distance <= 0 || !isFinite(self.distance)) {
        console.warn('주행거리가 0보다 작은 음수입니다. 주행경로 설정이 올바른지를 검토해주세요.');
        return;
    }

    const animationID = UDEF.COMPONENT_ANIMATION.ROUTE;
    const ctx = {
        animationID,
        curve,
        pathHeight,
        delayCount: 0,
        count: 0,
        instanceId: -1,
        object: self._object
    };

    // -------- instanced 분기 처리 --------//
    if(self._setInstanced) {
        const object = /**@type{InstancedComponent}*/(self).instancedGroup;
        const rawInstanceId = self.getInstancedId();
        const instanceId = typeof rawInstanceId === 'number'
            ? rawInstanceId % self.componentLayer._instancedMaxCount
            : -1;
        Object.assign(ctx , {object, instanceId})
    }

    const animation = self.makeAnimationController(
        animationID,
        /** @this {import('@union3d/analy/UAnimationController').UAnimationController} */
        function (/** @type {number} */ deltaTime, /** @type {number} */ distanceRate) {
            pathAnimation(
                self,
                /** @type {UAnimationController} */(this),
                /** @type {import('@union3d/analy/UDrivingAnimation').PathAniContext} */(ctx),
                deltaTime,
                distanceRate
            );
        }
    );
    if (!animation) return;

    animation.setDebug(true);
    animation.onComplete(function () {
        self._nowDistance = 0;
        self._endAnimationFunc?.(self);

        const controllers = self.animationControllers;
        const routeAnimation =  controllers.get(UDEF.COMPONENT_ANIMATION.ROUTE);
        if(!defined(routeAnimation)) {
            self._animation = false;
            return;
        }
        routeAnimation.stop();

        if (self._doHovering) {
            const hoverDown = controllers.get(UDEF.COMPONENT_ANIMATION.HOVER_DOWN);
            hoverDown ? hoverDown.start(true) : createHoverDownAnimation.call(self, true);
            self._animationId = UDEF.COMPONENT_ANIMATION.HOVER_DOWN;
        } else if (self.repeat) {
            setTimeout(() => {
                routeAnimation.start(true);
                self._animationId = UDEF.COMPONENT_ANIMATION.ROUTE;
            }, 300);
        } else {
            self._animation = false;
        }
    });

    if (!animateNow) return;
    try {
        animation.start();
        self._startAnimationFunc?.(self);
        self._animation = true;
        self._animationId = animationID;
    }catch (e) {
        __GError__(self, `${animationID} 애니메이션을 시작하지 못했습니다 : ${e}`, "7121138")
    }
}

/**
 * @this {U3dComponentPosition}
 * @param {boolean} [animateNow]
 * @returns {void}
 *
 * @ignore
 */
function createMovePoint (animateNow) {
    const self = this;
    let transWorld = undefined;

    //----------- 주행 경로 세팅 -------------------------------------//
    const arr = [];
    if (self.movePointList.length === 0) {
        SPLINE_BUFFER_GEOMETRY.attributes = {};

        const instancedSelf = /**@type{InstancedComponent}*/(self);
        if (instancedSelf.instancedInfo) {
            const position = instancedSelf.instancedInfo.position;
            TEMP_POSITION.copy(position);
        }else {
            TEMP_POSITION.copy(self.position)
        }

        self._createDefaultSpline(TEMP_POSITION, SPLINE_BUFFER_GEOMETRY);
        self._reductionSpline = self._spline;
    } else {
        for (let i = 0; i < self.movePointList.length; i++) {
            const curvePoint = self.movePointList[i];
            if (self._addstartend) {
                if (i === 1) transWorld = self.drawArg.getGeographicToWorld(curvePoint.x, curvePoint.y, curvePoint.z);
            } else {
                if (i === 0) transWorld = self.drawArg.getGeographicToWorld(curvePoint.x, curvePoint.y, curvePoint.z);
            }

            const transWorld2 = self.drawArg.getGeographicToWorld(curvePoint.x, curvePoint.y, curvePoint.z);
            arr.push(new THREE.Vector3(transWorld2.x, transWorld2.y, transWorld2.z));
        }
        self._spline = new UCatmullRomCurve3({
            points: arr,
            addstartend: self._addstartend
        });
        self._spline.tension = self._curveTension;
        self._spline.curveType = 'catmullrom';
        self._spline.closed = false;
        SPLINE_BUFFER_GEOMETRY.attributes = {};
        self._createSpline(SPLINE_BUFFER_GEOMETRY);
    }

    self._drawPath(SPLINE_BUFFER_GEOMETRY, ORIGIN_GEOMETRY);
    self._drawRealPath(SPLINE_BUFFER_GEOMETRY);
    self._useTruthPath(arr);

    //----------- 경로 샘플링 -----------//
    const sampling  = !self.smoothCorner;
    if(sampling) {
        const sampledCurve = self.useOriginRoute ? self._spline : self._reductionSpline;
        if (!sampledCurve) return;
        self._sampledPath = sampledCurve.getSpacedPoints(SAMPLE_COUNT);

        const num = self._sampledPath.length;
        const pathF32 = new Float32Array(num * 3);
        const dirF32  = new Float32Array((num - 1) * 3);
        for (let i = 0; i < num; i++) {
            const point = self._sampledPath[i];
            const offset = i * 3;

            pathF32[offset]     = point.x;
            pathF32[offset + 1] = point.y;
            pathF32[offset + 2] = point.z;

            if (i < num - 1) {
                const next = self._sampledPath[i + 1];
                let dx = next.x - point.x;
                let dy = next.y - point.y;
                let dz = next.z - point.z;

                const inv = 1 / Math.max(1e-9, Math.hypot(dx, dy, dz));
                dx *= inv; dy *= inv; dz *= inv;

                dirF32[offset]     = dx;
                dirF32[offset + 1] = dy;
                dirF32[offset + 2] = dz;
            }
        }
        self._sampledPathF32 = pathF32;
        self._sampledDirF32  = dirF32;
        self._sampleSegN     = (num - 1);
    }
    //----------- 애니메이션 세팅 -------------------------------------//
    self._nowDistance = 0;
    self.duration = self.distance / (self.speed / 3.6) * 1000;
    self.componentLayer._group.up.y = 0;
    self.componentLayer._group.up.z = 1;

    self._turnPointIndex = 0;
    self._turnPointLength = 0;

    const animationID = UDEF.COMPONENT_ANIMATION.MOVE_POINT;
    const ctx = {
        animationID,
        delayCount: 0,
        count: 0,
        instanceId: -1,
        object: self._object,
        turnPointUpdateFunc : (
            /** @type {U3dComponentPosition} */ component,
            /** @type {number} */ accumulatedDistance
        )=>{
            const spline = component._spline;
            if (!spline) return;
            if (Math.floor(component._turnPointLength) <= Math.floor(accumulatedDistance)) {
                if (component._turnPointIndex < spline.points.length - 1) {
                    if (
                        component.movePointList[component._turnPointIndex] &&
                        component.movePointList[component._turnPointIndex].callback
                    ) {
                        const param = {
                            name: component.name ?? '',
                            index: component._turnPointIndex,
                            movePoint: component.movePointList[component._turnPointIndex],
                            distance: component._nowDistance
                        };
                        component.movePointList[component._turnPointIndex].callback?.(param);
                    }

                    component._turnPointIndex++;
                    component._turnPointLength =
                        component._turnPointLength +
                        spline.points[component._turnPointIndex - 1].distanceTo(
                            spline.points[component._turnPointIndex]
                        );
                }
            }
        }
    };

    // -------- instanced 분기 처리 --------//
    if(self._setInstanced) {
        const object = /**@type{InstancedComponent}*/(self).instancedGroup;
        const rawInstanceId = self.getInstancedId();
        const instanceId = typeof rawInstanceId === 'number'
            ? rawInstanceId % self.componentLayer._instancedMaxCount
            : -1;
        Object.assign(ctx , {object, instanceId})
    }

    const animation = self.makeAnimationController(
        animationID,
        /** @this {import('@union3d/analy/UAnimationController').UAnimationController} */
        function (/** @type {number} */ deltaTime, /** @type {number} */ distanceRate) {
            movePointAnimation(
                self,
                /** @type {UAnimationController} */(this),
                /** @type {import('@union3d/analy/UDrivingAnimation').movePointContext} */(ctx),
                deltaTime,
                distanceRate
            );
        }
    );
    if (!animation) return;
    animation.onComplete(function () {
        // 마지막 지점 출력
        if (self.movePointList && self.movePointList[self.movePointList.length - 1] && self.movePointList[self.movePointList.length - 1].callback) {
            let param = {
                name: self.name ?? '',
                index: self._turnPointIndex,
                movePoint: self.movePointList[self.movePointList.length - 1],
                distance: self.distance
            }
            self.movePointList[self.movePointList.length - 1].callback?.(param);
        }
        self.animationControllers.get(UDEF.COMPONENT_ANIMATION.MOVE_POINT)?.stop();

        self._turnPointIndex = 0;
        self._turnPointLength = 0;
        self._animation = false;
        self._nowDistance = 0;
        self._endAnimationFunc?.(self);

        if (self.repeat) {
            const startAnimation = self.animationControllers.get(self._startAnimationId ?? '');
            if (!defined(startAnimation)) return;

            self._animation = true;
            startAnimation.start();
            self._startAnimationFunc?.(self);
            self._animationId = self._startAnimationId;
        }
    });

    if (animateNow) {
        try {
            self._animation = true;
            self._nowDistance = 0;
            animation.start();
            self._startAnimationFunc?.(self);
            self._animationId = animationID;
        } catch (e) {
            __GError__(self, `${animationID} 애니메이션을 시작하지 못했습니다 : ${e}`, "1766359")
        }
    }
}

/**
 * @this {U3dComponentPosition}
 * @param {import('three').Object3D} object
 * @returns {void}
 *
 * @ignore
 */
function settingObject(object) {
    const self = this;
    object.position.copy(self.position);
    object.scale.copy(self.scale);

    if (defined(self.lookAt)) {
        //{pitch,roll,yaw}
        const rotation = self.getPitchYaw (self.lookAt, self.position);
        object.rotation.copy(rotation);
    } else {
        object.rotation.copy(self.rotation);
    }

    self.quaternion = object.quaternion.clone();
    object.updateMatrixWorld();
    self.updateChildrenMatrix();
}

/**
 * @this {PickableObject3D}
 * @param {unknown} [intersect]
 * @param {import('three').ColorRepresentation} [color=HIGH_LIGHT_COLOR]
 * @param {number} [opacity=HIGH_LIGHT_OPACITY]
 * @param {MutableMaterial} [material]
 * @returns {void}
 *
 * @ignore
 */
function pickMaterial(intersect, color = HIGH_LIGHT_COLOR, opacity = HIGH_LIGHT_OPACITY, material) {
    const mesh = this; // mesh에 붙을꺼라 self 는 UMesh라고 인지한다.
    try{
        for (const child of mesh.children) {
            child.pickMaterial?.(undefined, color, opacity, material);
        }

        if (!mesh.material) return;

        // 원본 재질 백업과 별개로 선택 상태를 기록해 밝기·대비보다 강조색을 우선합니다.
        INTERNAL.setObjectColorAdjustmentSelected(mesh, true);

        const pickedColor = (typeof color === 'object' && color instanceof THREE.Color)
            ? color
            : new THREE.Color(color);

        opacity = THREE.MathUtils.clamp(opacity, 0, 1);

        //여러개일때
        if(mesh.material instanceof Array) {
            if(!mesh._oriMaterial){
                mesh._oriMaterial = mesh.material;
                mesh.material = [];
                for(const oriMaterial of mesh._oriMaterial) {
                    mesh.material.push(oriMaterial.clone()||material);
                }
            }else if(material){
                for(let i =0; i< mesh.material.length; i++) {
                    mesh.material[i].dispose();
                    mesh.material[i] = material;
                }
            }

            for(let i =0; i< mesh.material.length; i++) {
                const targetMaterial = mesh.material[i];
                targetMaterial.color = pickedColor;
                if(!(targetMaterial?.userData?._keepTransparent)) //원본 데이터 transparent 유지
                    targetMaterial.transparent = (opacity < 1);
                targetMaterial.opacity = opacity;
            }
            return;
        }

        //단일
        if(!mesh._oriMaterial){
            mesh._oriMaterial = mesh.material;
            mesh.material = material || mesh.material.clone();
        }else if(material){
            mesh.material.dispose();
            mesh.material = material;
        }
        mesh.material.color = pickedColor;
        if(!(mesh?.material?.userData?._keepTransparent)) //원본 데이터 transparent 유지
            mesh.material.transparent = (opacity < 1);
        mesh.material.opacity = opacity;
        mesh.material.needsUpdate = true;
    }catch (e) {
        __GSError__(e);
    }
}

/**
 * @this {PickableObject3D}
 * @returns {boolean}
 *
 * @ignore
 */
function restoreMaterial() {
    const self = this; // mesh에 붙을꺼라 self 는 UMesh라고 인지한다.

    // 선택 중 변경한 밝기·대비도 다음 렌더부터 원래 재질에 적용합니다.
    INTERNAL.setObjectColorAdjustmentSelected(self, false);

    if (self.material && self._oriMaterial) {
        if(Array.isArray(self.material)){
            for (let i = 0; i < self.material.length; i++) {
                const material = self.material[i];
                material.dispose();
            }
        }else{
            self.material.dispose();
        }
        self.material = self._oriMaterial;
        delete self._oriMaterial;
    }

    for (const child of self.children) {
        child.restoreMaterial?.();
    }
    return true;
}

// ----------- 군중 컴포넌트 관련 함수 ----------- //
/**
 * @this {U3dComponentPosition}
 *
 * @ignore
 */
function makeCrowdSpline() {
    const self = this;
    if (self.movePointList.length === 0) {
        const polygon = /** @type {CrowdPolygon | undefined} */ (self._drawPolygon);
        if (polygon && polygon.geom && typeof polygon.getPosition === 'function') {
            createDefaultSplineAtPolygon.call(self, polygon);
        } else {
            TEMP_POSITION.copy(self.position);
            self._createDefaultSpline(TEMP_POSITION, SPLINE_BUFFER_GEOMETRY);
        }
    } else {
        self._createSpline(SPLINE_BUFFER_GEOMETRY);
    }
}
/**
 * @this {U3dComponentPosition}
 * @param {boolean} [animateNow]
 * @returns {void}
 *
 * @ignore
 */
function createCrowdTween(animateNow) {
    const self = this;

    makeCrowdSpline.call(self);

    if(!defined(self._spline)) {
        __GError__(self, `군중 애니메이션 경로 생성 실패`, '7189574');
        return;
    }

    const spline = /** @type {import('three').CatmullRomCurve3} */ (self._spline);
    self._nowDistance = 0;
    // 생성한 군중 경로의 이동 거리와 재생 시간을 계산합니다.
    self.distance = INTERNAL.calculateSplineDistance(spline, 200);
    self.duration = self.distance / (self.speed / 3.6) * 1000;

    if (self.drawPath) {
        drawPathCrowd.call(self);
    }

    const animationID = UDEF.COMPONENT_ANIMATION.CROWD;
    const ctx = {
        animationID,
        delayCount: 0,
        count: 0,
        path: spline,
        instanceId: -1,
        object: self._object
    };

    // -------- instanced 분기 처리 --------//
    if(self._setInstanced) {
        const object = /**@type{InstancedComponent}*/(self).instancedGroup;
        const rawInstanceId = self.getInstancedId();
        const instanceId = typeof rawInstanceId === 'number'
            ? rawInstanceId % self.componentLayer._instancedMaxCount
            : -1;
        Object.assign(ctx , {object, instanceId})
    }

    const animation = self.makeAnimationController(
        animationID,
        /** @this {import('@union3d/analy/UAnimationController').UAnimationController} */
        function (/** @type {number} */ deltaTime, /** @type {number} */ distanceRate) {
            crowdAnimation(
                self,
                /** @type {UAnimationController} */(this),
                /** @type {import('@union3d/analy/UDrivingAnimation').CrowdContext} */(ctx),
                deltaTime,
                distanceRate
            );
        }
    );
    if (!animation) return;
    animation.onComplete(function () {
        self._endAnimationFunc?.(self);
        self._animation = false;
        self._animationId = '';

        const crowd = self.animationControllers.get(UDEF.COMPONENT_ANIMATION.CROWD);
        if (!defined(crowd)) return;
        crowd.stop();

        if (self.repeat) {
            self._animation = true;

            makeCrowdSpline.call(self);

            if (self.drawPath) {
                drawPathCrowd.call(self);
            }

            self._nowDistance = 0;
            if (!self._spline) return;
            self.distance = INTERNAL.calculateSplineDistance(self._spline, 200);
            self.duration = self.distance / (self.speed / 3.6) * 1000;

            crowd.setDistance(self.distance);
            crowd.start(true);
            self._animationId = UDEF.COMPONENT_ANIMATION.CROWD;
        }
    });

    if (animateNow) {
        try{
            self._animation = true;
            animation.start(true);
            self._startAnimationFunc?.(self);
            self._animationId = animationID;
        }catch (e) {
            __GError__(self, `${animationID} 애니메이션을 시작하지 못했습니다 : ${e}`, "1771417")
        }
    }
}

/**
 * @this {U3dComponentPosition}
 * @param {CrowdPolygon} polygon
 * @returns {void}
 *
 * @ignore
 */
function createDefaultSplineAtPolygon(polygon) {
    const self = this;

    const points = [];
    const prevEnd = /** @type {{_end: import('three').Vector3}} */ (/** @type {unknown} */ (self._spline))?._end;
    if (defined(prevEnd)) {
        points.push(prevEnd.clone());
    }

    const position = polygon.getPosition?.();
    if (!Array.isArray(position) || position.length === 0) return;

    const coord = position.slice();
    // 매 반복에서 군중 이동점의 방문 순서와 영역 내부 좌표를 새로 구성합니다.
    INTERNAL.shuffle(coord);

    const center = polygon.getCenter?.();
    if (!defined(center) || center.length < 2) return;

    const height = polygon._height  ?? self.getVectorPosition()?.z ?? 0;

    for (let i = 0; i < coord.length; i++) {
        const pointArray = coord[i];
        if (!defined(pointArray) || pointArray.length < 2) continue;

        const x = INTERNAL.randomBetween(pointArray[0], center[0]);
        const y = INTERNAL.randomBetween(pointArray[1], center[1]);
        const geoPosition = UMathEngine.getGoogleToGeographic(x, y)
        const scale = 1/ UMathEngine.getRealScaleAtGeographic(geoPosition.y);
        const z = height * scale;
        let addPoint = new THREE.Vector3(x, y, z);

        // 랜덤 좌표가 폴리곤 영역을 벗어나면 가장 가까운 경계로 보정합니다.
        addPoint = INTERNAL.clampPointToPolygon(polygon, addPoint, height);
        points.push(addPoint);
    }

    if (points.length < 2) return;

    self._spline = new THREE.CatmullRomCurve3(points);
    /** @type {{_end: import('three').Vector3}} */ (/** @type {unknown} */ (self._spline))._end = points[points.length - 1].clone();
    self._spline.tension = self._curveTension;
    self._spline.curveType = 'catmullrom';
    self._spline.closed = false;
}

/**
 * @this {U3dComponentPosition}
 * @returns {void}
 *
 * @ignore
 */
function drawPathCrowd() {
    const self = this;

    if(!defined(self._spline)) return;

    // 기존 splineObject 정리
    if (defined(self.splineObject)) {
        self.splineObject.geometry?.dispose?.();
        self.componentLayer?._scene?.remove(/** @type {import('three').Object3D} */ (self.splineObject));
        self.splineObject = undefined;
    }

    const divisions = Math.max(self._spline.points.length * 20, 1000);
    const points = [];

    for (let i = 0; i <= divisions; i++) {
        points.push(self._spline.getPointAt(i / divisions));
    }

    // ---------- 경로 로컬 vertex 생성  ---------- //
    const origin = points[0].clone();
    const relativePoints = points.map((/** @type {import('three').Vector3} */ p) => new THREE.Vector3().subVectors(p, origin));

    // ---------- 경로 생성 ---------- //
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(relativePoints);
    self.splineObject = new THREE.Line(lineGeometry, self.pathMaterial);
    self.splineObject.position.copy(origin);

    // ---------- 경로 가시화 ---------- //
    self.splineObject.visible = true;
    self.componentLayer?._scene?.add(self.splineObject);
    // self.splineObject.computeLineDistances();
}

export {U3dComponentPosition};
