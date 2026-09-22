// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { Box3WithCenter, ComponentParam, CumulativeInfo, CumulativeProperty, ExtendedObject3D, GooglePositionWithCallback, LOD_UpdateFunc, LightLike, MoveSmoothlyOpt, OverlayObject, PassCallback, PathGeometryLike, PoiLike, PredictedPosition, U3dComponentAnimationInfo, U3dComponentPositionCO, UnknownRecord, VerticesExt } from "./U3dComponentPosition.types.js";
import type { U3dMultipleComponentLayer } from "./U3dMultipleComponentLayer.js";
import type { UCatmullRomCurve3 } from "../alg/UCatmullRomCurve3.js";
import type { UAnimationController } from "../analy/UAnimationController.js";
import type { UComponentMixerController } from "../analy/UComponentMixerController.js";
import type { UClock } from "../core/UClock.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UBufferGeometry } from "../core/geometry/UBufferGeometry.js";
import type { U3dCumulativePath } from "../geometry/U3dCumulativePath.js";
import type { U3dCumulativePath_StyleOpt } from "../geometry/U3dCumulativePath.types.js";
import type { U3dPathGeometry } from "../geometry/U3dPathGeometry.js";
import type { Degree, DegreeEulerLike, GeoPositionVector3, KeyValue, ModelMesh, RadianEulerLike, WorldPositionVector3 } from "../types/global.types.js";
import type { DeferredObject } from "../util/deferred.types.js";
import type { USpotLight } from "../view/USpotLight.js";

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
declare class U3dComponentPosition {
    /**
     * 컴포넌트를 생성합니다. 옵션별 의미는 `U3dComponentPositionCO`를 참고하세요. <br>
     * 제약 사항: `opt.componentlayer`(정상 레이어)와 `opt.position`이 없으면 생성이 중단되고 `isDisposed()`가 true인 빈 객체가 됩니다.
     *
     * @param {U3dComponentPositionCO} opt 생성 옵션. `componentlayer`, `position`은 필수
     */
    constructor(opt: U3dComponentPositionCO);
    /**
     * moveSmoothly로 도착한 최근 100개 지점의 복사본입니다. 오래된 지점부터 정렬됩니다. <br>
     * 시작점·대기 목표점·프레임 보간점은 포함하지 않습니다.
     * 이동 중지나 컨트롤러 교체 시 유지하고 dispose 시 비웁니다.
     *
     * @type {Array<WorldPositionVector3>}
     */
    get waypointHistory(): Array<WorldPositionVector3>;
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
    predictFuturePositions(count: number, headingWeight?: number): Array<PredictedPosition> | undefined;
    /**
     * 주행 애니메이션이 현재 실행 중인지 여부. `moveStart`/`moveStop`이 갱신하는 내부 상태입니다.
     *
     * @type {boolean}
     */
    _animation: boolean;
    /**
     * 외부에서 자유롭게 붙이는 사용자 데이터. `verticalObjects`(Object3D 배열)가 있으면 LOD 가시화 변경 시 함께 켜지고 꺼집니다.
     *
     * @type {KeyValue}
     */
    userData: KeyValue;
    /**
     * 컴포넌트가 속한 레이어 이름. `getLayerName`이 반환합니다.
     *
     * @type {string}
     */
    _ulayername: string;
    /**
     * instanced 컴포넌트일 때 인스턴스 index. 일반 컴포넌트는 undefined입니다.
     *
     * @type {number | string | undefined}
     */
    instanceId: number | string | undefined;
    /**
     * 진행 중인 트윈 핸들. `stop()`으로 중단할 수 있으며 진행 중인 트윈이 없으면 undefined입니다.
     *
     * @type {{stop: function(): void} | undefined}
     *
     * @ignore
     */
    tween: {
        stop: () => void;
    } | undefined;
    /**
     * 화면에 그려지는 3D 모델 리소스(Object3D 계층). 외부에서는 `getObject`로 접근하세요.
     *
     * @type {any}
     */
    _object: any;
    /**
     * 컴포넌트 위치 (월드 좌표 EPSG:3857, m). 직접 수정하지 말고 `setPosition`을 사용하세요.
     *
     * @type {import('three').Vector3}
     */
    position: three.Vector3;
    /**
     * 컴포넌트 회전 (라디안 `Euler`, XYZ 순). `setRotation`·`setRotationX/Y/Z`로 변경합니다.
     *
     * @type {import('three').Euler}
     */
    rotation: three.Euler;
    /**
     * 축별 크기 배율. 1이 원본 크기이며 `setScale`로 변경합니다.
     *
     * @type {import('three').Vector3}
     */
    scale: three.Vector3;
    /**
     * `rotation`과 동기화되는 회전 쿼터니언. 변환 행렬 계산에 사용됩니다.
     *
     * @type {import('three').Quaternion}
     */
    quaternion: three.Quaternion;
    /**
     * 주행 중 바라보는 목표 위치 (월드 좌표). 주행 중이 아니면 undefined입니다.
     *
     * @type {import('three').Vector3 | undefined}
     */
    lookAt: three.Vector3 | undefined;
    /**
     * 위치·회전·크기를 합친 변환 행렬. 부모가 있으면 부모 기준 상대 행렬입니다.
     *
     * @type {import('three').Matrix4}
     */
    matrix: three.Matrix4;
    /**
     * 부모 계층까지 반영한 월드 변환 행렬. `getMatrixWorld`가 반환합니다.
     *
     * @type {import('three').Matrix4}
     */
    matrixWorld: three.Matrix4;
    /**
     * `setParent`로 지정한 상위 컴포넌트. 없으면 undefined입니다.
     *
     * @type {U3dComponentPosition | undefined}
     */
    parent: U3dComponentPosition | undefined;
    /**
     * `setChild`로 등록한 하위 컴포넌트·오브젝트 목록. 부모의 위치·회전·크기·가시화가 함께 반영됩니다.
     *
     * @type {Array<U3dComponentPosition | ExtendedObject3D>}
     */
    children: Array<U3dComponentPosition | ExtendedObject3D>;
    /**
     * `setOverlay`로 붙인 오버레이 목록. 컴포넌트가 이동하면 함께 이동합니다.
     *
     * @type {Array<OverlayObject>}
     */
    overlay: Array<OverlayObject>;
    /**
     * 컴포넌트가 속한 컴포넌트 레이어. 생성 옵션 `componentlayer`로 지정됩니다.
     *
     * @type {import('@U3dMultipleComponentLayer').U3dMultipleComponentLayer}
     */
    componentLayer: U3dMultipleComponentLayer;
    /**
     * 앱·씬·카메라에 접근하기 위한 렌더 컨텍스트. 레이어에서 전달됩니다.
     *
     * @type {import('@UDrawArg').UDrawArg}
     */
    drawArg: UDrawArg;
    /**
     * 현재 가시화 상태. `isVisible`이 반환하고 `show`/`hide`가 갱신합니다.
     *
     * @type {boolean}
     */
    _show: boolean;
    /**
     * 주행 애니메이션 이동 속도 (m/s, 기본값 700). `setSpeed`로 변경합니다.
     *
     * @type {number}
     */
    speed: number;
    /**
     * 컴포넌트에 연결된 조명 목록 (deprecated 기능).
     *
     * @type {Array<LightLike | import('@union3d/view/USpotLight').USpotLight>}
     */
    _lightList: Array<LightLike | USpotLight>;
    /**
     * 컴포넌트에 연결된 뷰 목록 (deprecated 기능).
     *
     * @type {Array<UnknownRecord>}
     */
    _viewList: Array<UnknownRecord>;
    /**
     * 경로를 일정 간격으로 샘플링한 위치 버퍼 (x, y, z 연속). 주행 계산용 캐시입니다.
     *
     * @type {Float32Array | null | undefined}
     */
    _sampledPathF32: Float32Array | null | undefined;
    /**
     * 샘플링 위치별 진행 방향 버퍼. 주행 계산용 캐시입니다.
     *
     * @type {Float32Array | null | undefined}
     */
    _sampledDirF32: Float32Array | null | undefined;
    /**
     * 경로 샘플링 구간 수.
     *
     * @type {number | null | undefined}
     */
    _sampleSegN: number | null | undefined;
    /**
     * 샘플링된 경로 좌표 배열 (월드 좌표).
     *
     * @type {Array<import('three').Vector3> | undefined}
     */
    _sampledPath: Array<three.Vector3> | undefined;
    /**
     * 주행 경로 곡선. `addPathGeometry`/`addMovePoint`가 생성합니다.
     *
     * @type {import('three').CatmullRomCurve3 | import('@UCatmullRomCurve3').UCatmullRomCurve3 | null | undefined}
     */
    _spline: three.CatmullRomCurve3 | UCatmullRomCurve3 | null | undefined;
    /**
     * 꼭짓점을 줄인 주행 경로 곡선. 경로 표시와 충돌 검사에 사용됩니다.
     *
     * @type {import('three').CatmullRomCurve3 | import('@UCatmullRomCurve3').UCatmullRomCurve3 | null | undefined}
     */
    _reductionSpline: three.CatmullRomCurve3 | UCatmullRomCurve3 | null | undefined;
    /**
     * `addPathGeometry`로 지정된 주행 경로 지오메트리.
     *
     * @type {PathGeometryLike | undefined}
     */
    _pathGeometry: PathGeometryLike | undefined;
    /**
     * 보간 계산용 임시 벡터.
     *
     * @type {import('three').Vector3 | null | undefined}
     */
    _tempLerpVec: three.Vector3 | null | undefined;
    /**
     * 주행 애니메이션에서 현재까지 이동한 거리 (m). `getDistanceTraveled`가 반환합니다.
     *
     * @type {number}
     */
    _nowDistance: number;
    /**
     * 현재 주행 경로의 총 길이 (m).
     *
     * @type {number}
     */
    distance: number;
    /**
     * 주행 목표 시간 (ms). 0이면 `speed` 기준 등속으로 주행합니다.
     *
     * @type {number}
     */
    duration: number;
    /**
     * `setSpeed`로 예약된 다음 속도 (km/h). 주행 중 변경하면 다음 프레임에 `speed`로 반영됩니다.
     *
     * @type {number}
     */
    newSpeed: number;
    /**
     * 주행 중 속도 변경이 예약되었는지 여부.
     *
     * @type {boolean}
     */
    needToChange: boolean;
    /**
     * `addMovePoint`로 등록한 이동 지점 목록 (위경도 좌표, 통과 콜백 포함).
     *
     * @type {Array<GooglePositionWithCallback>}
     */
    movePointList: Array<GooglePositionWithCallback>;
    /**
     * 이동 지점 통과 처리 중인 index.
     *
     * @type {number}
     */
    _turnPointIndex: number;
    /**
     * 이동 지점 개수.
     *
     * @type {number}
     */
    _turnPointLength: number;
    /**
     * 모델 자체 애니메이션(클립)을 재생하는 믹서 목록. `setMixers`로 교체합니다.
     *
     * @type {Array<import('three').AnimationMixer>}
     */
    mixers: Array<three.AnimationMixer>;
    /**
     * 현재 동작 중인 주행 애니메이션 컨트롤러 ID.
     *
     * @type {string | undefined}
     */
    _animationId: string | undefined;
    /**
     * 주행 시작 시 먼저 실행되는 애니메이션(예: 호버링 상승) 컨트롤러 ID.
     *
     * @type {string | undefined}
     */
    _startAnimationId: string | undefined;
    /**
     * `saveObjectSetting`으로 저장한 초기 위치.
     *
     * @type {import('three').Vector3 | undefined}
     */
    _initPosition: three.Vector3 | undefined;
    /**
     * `saveObjectSetting`으로 저장한 초기 회전.
     *
     * @type {import('three').Euler | undefined}
     */
    _initRotation: three.Euler | undefined;
    /**
     * `saveObjectSetting`으로 저장한 초기 크기.
     *
     * @type {import('three').Vector3 | undefined}
     */
    _initScale: three.Vector3 | undefined;
    /**
     * 컴포넌트 라벨 POI. `setLabel`로 생성되며 없으면 undefined입니다.
     *
     * @type {PoiLike | undefined}
     */
    poi: PoiLike | undefined;
    /**
     * 라벨 POI 가시화 상태. `isVisibleLabel`이 반환합니다.
     *
     * @type {boolean}
     */
    _labelVisible: boolean;
    /**
     * `setColor`로 지정한 현재 색상. 지정 전에는 undefined이며 모델 원본 색상이 쓰입니다.
     *
     * @type {import('three').ColorRepresentation | undefined}
     */
    color: three.ColorRepresentation | undefined;
    /**
     * `setOpacity`로 지정한 현재 투명도 (0~1). 지정 전에는 undefined입니다.
     *
     * @type {number | undefined}
     */
    opacity: number | undefined;
    /**
     * 컴포넌트 이름. 생략 시 `loadedModel` 이름 또는 GUID가 쓰이며 `editName`으로 변경합니다.
     */
    name: any;
    /**
     * 컴포넌트 고유 ID. 생략 시 GUID가 생성됩니다.
     *
     * @type {string}
     */
    id: string;
    /**
     * 컴포넌트 종류. `'component'`(일반 모델) 또는 `'crowd'`(폴리곤 안을 돌아다니는 군중).
     *
     * @type {string}
     */
    type: string;
    /**
     * 모델 파일 확장자 (예: 'glb', 'jpg'). jpg 모델은 항상 카메라를 향하도록 회전합니다.
     *
     * @type {string | undefined}
     */
    _ext: string | undefined;
    /**
     * 컴포넌트 객체임을 나타내는 표식 (항상 true). 레이어가 객체 종류를 판별할 때 사용합니다.
     *
     * @type {boolean}
     */
    isComponent: boolean;
    /**
     * 모델 리소스의 기본 투명도 (0~1).
     *
     * @type {number}
     */
    _objectOpacity: number;
    /**
     * 카메라 추적 여부. true면 카메라가 컴포넌트를 따라가고(`setCameraTrace`), false면 일반 지도 모드입니다.
     *
     * @type {boolean}
     */
    isTrace: boolean;
    /**
     * 애니메이션 경과 시간 측정용 시계.
     *
     * @type {import('@union3d/core/UClock').UClock}
     */
    _clock: UClock;
    /**
     * 모델 클립 믹서를 관리하는 컨트롤러. `getMixerController`가 반환합니다.
     *
     * @type {import('@union3d/analy/UComponentMixerController').UComponentMixerController}
     */
    _mixerController: UComponentMixerController;
    /**
     * 컨트롤러가 관리하는 믹서 목록.
     *
     * @type {Array<import('three').AnimationMixer>}
     */
    _mixers: Array<three.AnimationMixer>;
    /**
     * 카메라 추적 시 사용하는 깊이·측면·높이 상태.
     *
     * @type {{depth: number, side: number, height: number}}
     */
    _camState: {
        depth: number;
        side: number;
        height: number;
    };
    /**
     * `addMovePoint`로 지정한 지점별 방향각 목록. 지정하지 않으면 undefined입니다.
     *
     * @type {Array<import('three').Vector3> | undefined}
     */
    pitchYawRollList: Array<three.Vector3> | undefined;
    /**
     * 주행 경로 라인을 화면에 표시할지 여부.
     *
     * @type {boolean}
     */
    drawPath: boolean;
    /**
     * 실제 이동 경로 메시를 표시할지 여부.
     *
     * @type {boolean}
     */
    drawRealPath: boolean;
    /**
     * `'crowd'` 타입이 돌아다닐 폴리곤 영역.
     *
     * @type {import('three').Object3D | UnknownRecord | undefined}
     */
    _drawPolygon: three.Object3D | UnknownRecord | undefined;
    /**
     * 경로 표시 타입. 현재 `'cube'`만 지원합니다.
     *
     * @type {string}
     */
    typePath: string;
    /**
     * 경로 라인 색상. `setPathColor`로 변경합니다.
     *
     * @type {import('three').Color}
     */
    pathColor: three.Color;
    /**
     * 경로 라인 투명도 (0~1). `setPathOpacity`로 변경합니다.
     *
     * @type {number}
     */
    pathOpacity: number;
    /**
     * 주행 중 `updateAnimationFunc` 콜백을 호출하는 이동 간격 (m).
     *
     * @type {number}
     */
    updateDistance: number;
    /**
     * 주행 중 방향 갱신을 판단하는 기준 각도 (°).
     *
     * @type {number}
     */
    updateAngle: number;
    splineObject: U3dPathGeometry | three.Line<three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, any, three.Object3DEventMap>;
    /**
     * 입력 좌표를 곡선 보정 없이 그대로 경로로 사용할지 여부.
     *
     * @type {boolean}
     */
    usetruthpath: boolean;
    /**
     * 주행 애니메이션을 끝난 뒤 반복할지 여부.
     *
     * @type {boolean}
     */
    repeat: boolean;
    _splinePitch: UCatmullRomCurve3;
    /**
     * 입력 좌표를 경로의 시작/끝점으로 자동 추가할지 여부.
     *
     * @type {boolean}
     */
    _addstartend: boolean;
    /**
     * 경로 텍스처 이미지 URL.
     *
     * @type {string | undefined}
     */
    image: string | undefined;
    /**
     * 사용자 정의 속성 정보. `getProperties`/`setProperties`/`addProperties`로 다룹니다.
     */
    properties: any;
    /**
     * TopView 카메라 추적 시 모델과 카메라 사이 거리 (m).
     *
     * @type {number}
     */
    _topViewDistance: number;
    /**
     * 경로 곡선 장력 (0~1). 작을수록 완만한 곡선이 됩니다.
     *
     * @type {number}
     */
    _curveTension: number;
    /**
     * 경로 메시 폭 (m).
     *
     * @type {number}
     */
    _pathWidth: number;
    /**
     * 경로 메시 외곽선 사용 여부.
     *
     * @type {boolean}
     */
    _pathEdge: boolean;
    /**
     * 경로 메시 높이 (m).
     *
     * @type {number}
     */
    _pathHeight: number;
    /**
     * 경계영역 캐시. `getRectangle`이 갱신합니다.
     */
    _bbox: any;
    /**
     * 경로 버퍼 거리 (m).
     *
     * @type {number | undefined}
     */
    _buffer: number | undefined;
    /**
     * 레이어 기본 스케일.
     *
     * @type {import('three').Vector3 | undefined}
     */
    _layerScale: three.Vector3 | undefined;
    /**
     * 컴포넌트가 그려지는 씬. 기본값은 레이어의 씬입니다.
     */
    scene: any;
    /**
     * GeOnDT 내부 객체 종류 식별자.
     */
    _utype: number;
    /**
     * 충돌 감지 거리 (m). `setCollisionDistance`로 변경합니다.
     *
     * @type {number}
     */
    _collisionDistance: number;
    /**
     * 충돌 감지 시 호출되는 콜백. `setCollisionFunction`으로 변경합니다.
     *
     * @type {Function | undefined}
     */
    _collisionFunction: Function | undefined;
    /**
     * 시선 방향 계산용 레이캐스터.
     *
     * @type {import('three').Raycaster | undefined}
     */
    _lookAtRaycaster: three.Raycaster | undefined;
    /**
     * 컴포넌트 위경도 좌표를 반환하는 함수
     * @returns {GeoPositionVector3} 컴포넌트 위경도 좌표
     */
    getPosition(): GeoPositionVector3;
    /**
     * @deprecated getWorldPosition() 메서드를 사용하세요
     * 컴포넌트 3D 월드 좌표를 반환하는 함수
     * @returns {WorldPositionVector3} 컴포넌트 3D 월드 좌표
     */
    getVectorPosition(): WorldPositionVector3;
    /**
     * 주행 애니메이션 갱신 시 호출되는 사용자 콜백. `setUpdateAnimationFunc`로 변경합니다.
     *
     * @type {Function | undefined}
     */
    _updateAnimationFunc: Function | undefined;
    /**
     * 주행 애니메이션 종료 시 호출되는 사용자 콜백. `setEndAnimationFunc`로 변경합니다.
     *
     * @type {Function | undefined}
     */
    _endAnimationFunc: Function | undefined;
    /**
     * 주행 애니메이션 시작 시 호출되는 사용자 콜백. `setStartAnimationFunc`로 변경합니다.
     *
     * @type {Function | undefined}
     */
    _startAnimationFunc: Function | undefined;
    /**
     * instanced 메시로 생성되었는지 여부. `getInstanced`가 반환합니다.
     *
     * @type {boolean}
     */
    _setInstanced: boolean;
    /**
     * 경로 주행 시작·종료 시 호버링(수직 상승·하강) 애니메이션을 사용할지 여부.
     *
     * @type {boolean}
     */
    _doHovering: boolean;
    /**
     * 전방 시선 목표 지점까지의 거리 (m).
     *
     * @type {number}
     */
    _forwardOffset: number;
    /**
     * 현재 LOD(카메라 거리 기반 자동 조정) 모드. `setLODMode` 참고.
     *
     * @returns {string} `'none'` | `'auto'` | `'custom'`
     */
    get LODMode(): string;
    /**
     * 등록된 주행 애니메이션 컨트롤러 목록. 키는 `makeAnimationController`가 만든 애니메이션 ID입니다.
     *
     * @returns {Map<string, import('@union3d/analy/UAnimationController').UAnimationController>} 애니메이션 ID → 컨트롤러
     */
    get animationControllers(): Map<string, UAnimationController>;
    /**
     * @deprecated 누적 이력은 더 이상 U3dComponentPosition 내부에 저장하지 않습니다. 클라이언트/서비스 단 이력을 사용하세요.
     * @returns {Array<CumulativeInfo>} 빈 배열
     */
    get cumulativeInfo(): Array<CumulativeInfo>;
    /**
     * 누적 경로(궤적) 기록과 통과 콜백을 관리하는 상태. 마지막 통과 index, 통과 콜백, 이동 기준 거리 등을 담습니다.
     *
     * @returns {CumulativeProperty} 누적 경로 상태 객체 (내부 상태를 직접 반환하므로 수정하면 즉시 반영됩니다)
     */
    get cumulativeProperty(): CumulativeProperty;
    /**
     * 화면에 그려진 이동 궤적(누적 경로) 객체. `drawCumulativePath`가 true인 상태로 이동해야 생성됩니다.
     *
     * @returns {import('@union3d/geometry/U3dCumulativePath').U3dCumulativePath | undefined} 궤적 객체. 아직 그려진 궤적이 없으면 undefined
     */
    get cumulativePath(): U3dCumulativePath | undefined;
    /**
     * 주행 경로 라인 재질을 교체합니다. 제약 사항: `THREE.Material` 인스턴스가 아니면 무시되고 기존 값이 유지됩니다.
     *
     * @param {import('three').Material} material 새 경로 라인 재질. 기본은 `LineBasicMaterial`
     */
    set pathMaterial(material: three.Material);
    /**
     * 주행 경로 라인에 쓰이는 재질. 생성 옵션 `drawpath`/`drawRealPath`가 true일 때만 만들어지며 그 외에는 undefined입니다.
     *
     * @returns {import('three').Material | undefined} 경로 라인 재질
     */
    get pathMaterial(): three.Material | undefined;
    /**
     * 주행 경로 라인 지오메트리를 교체합니다. 제약 사항: `UBufferGeometry` 인스턴스가 아니면 무시되고 기존 값이 유지됩니다.
     *
     * @param {import('@union3d/core/geometry/UBufferGeometry').UBufferGeometry} geometry 새 경로 라인 지오메트리
     */
    set pathGeometry(geometry: UBufferGeometry);
    /**
     * 주행 경로 라인의 지오메트리. 생성 옵션 `drawpath`/`drawRealPath`가 true일 때만 만들어지며 그 외에는 undefined입니다.
     *
     * @returns {import('@union3d/core/geometry/UBufferGeometry').UBufferGeometry | undefined} 경로 라인 지오메트리
     */
    get pathGeometry(): UBufferGeometry | undefined;
    /**
     * 입력 경로를 상대 좌표로 보정하지 않고 원본 좌표 그대로 사용하는지 여부. 생성 옵션 `useOriginRoute`로만 정해지며 이후 변경할 수 없습니다.
     *
     * @returns {boolean} true면 원본 경로 사용
     */
    get useOriginRoute(): boolean;
    /**
     * 누적 경로 표시 여부를 설정합니다. 이미 그려진 궤적은 지우지 않으며 이후 이동부터 반영됩니다. 제약 사항: boolean이 아니면 무시됩니다.
     *
     * @param {boolean} isDraw true면 이후 이동 궤적을 그림
     */
    set drawCumulativePath(isDraw: boolean);
    /**
     * 주행 중 이동한 궤적(누적 경로)을 화면에 그릴지 여부.
     *
     * @returns {boolean} true면 궤적을 그림
     */
    get drawCumulativePath(): boolean;
    /**
     * 생성시 참고한 model의 이름을 반환
     * @returns {string}
     */
    getModelName(): string;
    /**
     * 모델의 월드 행렬을 반환하는 함수
     * @returns {import('three').Matrix4 | undefined} 모델의 월드 행렬
     */
    getMatrixWorld(): three.Matrix4 | undefined;
    /**
     * 컴포넌트가 속한 레이어의 이름을 반환하는 함수
     * @returns {string} 레이어 이름
     */
    getLayerName(): string;
    /**
     * 카메라 거리에 따른 자동 조정(LOD) 방식을 설정하는 함수. 매 프레임 `update`가 호출될 때 적용됩니다.
     * @param {'none' | 'auto' | 'custom' | string} mode `'none'` 조정 없음, `'auto'` 최대 가시화 거리 밖이면 숨김, `'custom'` `setUpdateFunc` 콜백 결과(가시화·색상·투명도 등) 적용. 그 외 값은 `'none'`으로 처리
     */
    setLODMode(mode: "none" | "auto" | "custom" | string): void;
    /**
     * 현재 LOD(카메라 거리 기반 자동 조정) 모드를 반환하는 함수
     * @returns {string} `'none'` | `'auto'` | `'custom'`
     */
    getLODMode(): string;
    /**
     * LOD 모드가 `'auto'`일 때 컴포넌트를 표시할 카메라 최대 거리를 설정하는 함수. 카메라가 이보다 멀어지면 자동으로 숨겨집니다.
     * @param {number} dist 최대 가시화 거리 (m). NaN이면 기본값 1000으로 되돌립니다
     */
    setMaxVisibleDistance(dist: number): void;
    /**
     * `'auto'` LOD에서 컴포넌트가 표시되는 카메라 최대 거리를 반환하는 함수
     * @returns {number} 최대 가시화 거리 (m)
     */
    getMaxVisibleDistance(): number;
    /**
     * 매 프레임 호출되어 카메라 거리를 갱신하고 LOD 모드에 따라 가시화·스타일을 조정하는 함수. 보통 레이어가 호출합니다.
     * @param {import('three').Vector3} camPos 카메라 위치 (월드 좌표)
     * @param {boolean} isIdle 카메라가 멈춰 있는지 여부. true면 LOD 계산을 생략합니다
     * @param {number} [curTime] 현재 시각 (ms). 믹서 FPS 조절에 사용
     */
    update(camPos: three.Vector3, isIdle: boolean, curTime?: number): void;
    /**
     * 카메라와 컴포넌트 사이 거리를 다시 계산해 내부 캐시를 갱신하는 함수
     * @param {import('three').Vector3 | undefined} camPos 카메라 위치 (월드 좌표). 없으면 거리를 무한대로 처리
     * @returns {number} 카메라 거리의 제곱 (m²)
     */
    updateCameraDistance(camPos: three.Vector3 | undefined): number;
    /**
     * 모델 자체 애니메이션(클립)의 갱신 빈도를 설정하는 함수. 낮추면 먼 컴포넌트의 연산 부담이 줄어듭니다.
     * @param {number} fps 초당 갱신 횟수
     */
    setMixerFPS(fps: number): void;
    /**
     * LOD 모드가 `'custom'`일 때 매 프레임 호출할 사용자 콜백을 설정하는 함수. 콜백이 반환한 `LOD_Info`의 가시화·색상·투명도·텍스처 제외 값이 컴포넌트에 적용됩니다.
     * @param {LOD_UpdateFunc} func `(component, properties, cameraDistance(m), cameraDistanceSq) => LOD_Info` 형태의 콜백
     */
    setUpdateFunc(func: LOD_UpdateFunc): void;
    /**
     * `setUpdateFunc`로 설정한 custom LOD 콜백을 반환하는 함수
     * @returns {LOD_UpdateFunc | undefined} 설정된 콜백. 없으면 undefined
     */
    getUpdateFunc(): LOD_UpdateFunc | undefined;
    /**
     * 컴포넌트 3D 월드 좌표를 반환하는 함수
     * @returns {WorldPositionVector3} 컴포넌트 3D 월드 좌표
     */
    getWorldPosition(): WorldPositionVector3;
    /**
     * 컴포넌트 가시화 상태를 반환하는 함수 <br>
     * 가시화 상태면  true, 아니면 false
     * @returns {boolean}
     */
    isVisible(): boolean;
    /**
     * 컴포넌트가 해제되었거나 생성에 실패했는지 여부를 반환합니다. true인 객체는 다른 메서드를 호출해도 동작하지 않습니다.
     *
     * @returns {boolean} 해제·생성 실패 상태면 true
     */
    isDisposed(): boolean;
    /**
     * 애니메이션 시 컴포넌트의 이동 속도를 지정하는 함수
     * @param {number} speed 이동 속도 (km/h). 1500을 넘으면 무시됩니다. 주행 중이면 다음 프레임부터 반영됩니다
     */
    setSpeed(speed: number): void;
    /**
     * 애니메이션 시 컴포넌트의 이동속도를 반환하는 함수
     * @returns {number} 이동 속도 (km/h)
     */
    getSpeed(): number;
    /**
     * 컴포넌트의 모델 리소스를 반환하는 함수
     * @returns {import('three').Object3D | undefined} 모델 데이터 리소스
     */
    getObject(): three.Object3D | undefined;
    /**
     * 컴포넌트가 instanced 메시(같은 모델을 한 번의 드로우로 여러 개 그리는 방식)로 생성되었는지 반환하는 함수
     * @returns {boolean} instanced 메시면 true
     */
    getInstanced(): boolean;
    /**
     * 컴포넌트가 `position`에서 `lookAt`을 바라볼 때의 회전(pitch·yaw)을 계산하는 함수
     * @param {WorldPositionVector3} lookAt 바라보는 위치 좌표 (월드 좌표, EPSG:3857)
     * @param {WorldPositionVector3} position 위치 좌표 (월드 좌표, EPSG:3857)
     * @returns {import('three').Euler} 회전 값 (라디안). 내부 공용 객체를 반환하므로 보관하려면 복사하세요
     */
    getPitchYaw(lookAt: WorldPositionVector3, position: WorldPositionVector3): three.Euler;
    /**
     * 등록된 주행 애니메이션 컨트롤러를 모두 제거하고 현재·시작 애니메이션 ID를 초기화합니다. <br>
     * 주의 사항: 진행 중인 주행이 즉시 멈추며, 다시 주행하려면 경로를 새로 등록해야 합니다.
     */
    disposeAnimationControllers(): void;
    /**
     * 누적 경로(궤적)를 켜는(show) 함수
     */
    showCumulativeRoute(): void;
    /**
     * 누적 경로(궤적)를 끄는(hide) 함수
     */
    hideCumulativeRoute(): void;
    /**
     * 누적 경로(궤적)를 제거하는 함수
     */
    removeCumulativeRoute(): void;
    /**
     * 누적 경로(궤적)의 스타일을 변경하는 함수
     * @param {U3dCumulativePath_StyleOpt} opt 변경 옵션
     */
    setCumulativePathStyle(opt: U3dCumulativePath_StyleOpt): void;
    /**
     * 누적 경로(궤적)의 초기 좌표 값(이전 히스토리)을 설정하는 함수.
     * @param {Array<GeoPositionVector3>} positions 위경도 좌표 배열
     */
    setInitPathPositions(positions: Array<GeoPositionVector3>): void;
    /**
     * 컴포넌트 회전 시 절대 축이 아니라 현재 컴포넌트의 회전 값 기준으로 회전시키는 함수
     * @param {DegreeEulerLike} rotation 회전각
     */
    setRotationRelative(rotation: DegreeEulerLike): void;
    /**
     * 전체 누적 정보 기록을 가져오는 함수
     * @deprecated 누적 이력은 더 이상 U3dComponentPosition 내부에 저장하지 않습니다. 클라이언트/서비스 단 이력을 사용하세요.
     * @returns {Promise<Array<CumulativeInfo>>} 빈 배열
     */
    getCumulativeInfo(): Promise<Array<CumulativeInfo>>;
    /**
     * @deprecated 누적 이력은 더 이상 U3dComponentPosition 내부에 저장하지 않습니다. 클라이언트/서비스 단 이력을 사용하세요.
     * @returns {Promise<Array<CumulativeInfo>>} 빈 배열
     */
    getPassedCumulativeInfo(): Promise<Array<CumulativeInfo>>;
    /**
     * @param {GeoPositionVector3 | undefined} geo 위경도 좌표
     * @param {WorldPositionVector3 | undefined} world 월드 좌표
     * @deprecated 누적 이력은 더 이상 U3dComponentPosition 내부에 저장하지 않습니다. 클라이언트/서비스 단 이력을 사용하세요.
     * @returns {Promise<Map<number, CumulativeInfo>>}
     */
    getCumulativeInfoByPoint(geo: GeoPositionVector3 | undefined, world: WorldPositionVector3 | undefined): Promise<Map<number, CumulativeInfo>>;
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
    moveSmoothly(opt?: MoveSmoothlyOpt, complete?: PassCallback): Promise<void>;
    /**
     * 현재 위치를 누적 경로에 기록한다.
     * moveSmoothly, addMovePoint, setPosition 등 위치 변경 진입점에서 공통으로 사용한다.
     * @param {WorldPositionVector3} position 기록할 월드 좌표
     * @param {number} [dist] 애니메이션 컨트롤러 기준 누적 거리
     * @param {number} [time] 애니메이션 컨트롤러 기준 누적 시간(ms)
     * @param {number} [speed] 현재 속도(m/s)
     * @param {number} [moveDistance] 이번 프레임 이동 거리U
     */
    recordCumulativePathFrame(position: WorldPositionVector3, dist?: number, time?: number, speed?: number, moveDistance?: number): void;
    /**
     * 컴포넌트 누적 경로를 반환하는 메서드입니다.
     * @returns {import('@union3d/geometry/U3dCumulativePath').U3dCumulativePath|undefined} 누적 경로가 없으면 undefined
     */
    getCumulativePath(): U3dCumulativePath | undefined;
    /**
     * 경로 진행률에 해당하는 시선 방향 목표 지점을 계산하는 함수 (경로 주행 중 카메라·모델이 바라볼 곳)
     * @param {number} distanceRate 경로 진행률 (0 시작점 ~ 1 끝점)
     * @param {import('three').Vector3} pathPosition 경로상 현재 위치 (월드 좌표)
     * @returns {import('three').Vector3 | undefined} 바라볼 위치 (월드 좌표). 경로가 없으면 undefined
     */
    getLookAtFromPitchRollYaw(distanceRate: number, pathPosition: three.Vector3): three.Vector3 | undefined;
    /**
     * 이전 경로 객체를 제거하고 그 객체가 단독 소유한 렌더 자원을 정리합니다.
     * 여러 경로 선이 공유하는 pathMaterial은 컴포넌트가 해제할 때까지 유지합니다.
     *
     * @param {undefined | ModelMesh} oriSplineObject 정리할 이전 경로 객체입니다.
     *
     * @ignore
     */
    _initSplineObject(oriSplineObject: undefined | ModelMesh): void;
    /**
     * movePointList의 좌표 목록으로 경로를 생성합니다.
     * @param {import('three').BufferGeometry} geometry
     * @param {import('three').BufferGeometry} oriGeometry
     *
     * @ignore
     */
    _drawPath(geometry: three.BufferGeometry, oriGeometry: three.BufferGeometry): void;
    _pathDrawOrigin: three.Vector3;
    oriSplineObject: three.Line<three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, any, three.Object3DEventMap>;
    _drawRealPath(geometry: three.BufferGeometry & VerticesExt): void;
    _realPathDrawOrigin: three.Vector3;
    tempsplineObject: three.Line<three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, any, three.Object3DEventMap>;
    _isPush(index: number, relativeSplinePoint: Array<three.Vector3>): boolean;
    _createSpline(geometry: three.BufferGeometry & VerticesExt): void;
    _useTruthPath(arr: Array<three.Vector3>): void;
    _splineYaw: UCatmullRomCurve3;
    _splineRoll: UCatmullRomCurve3;
    _createDefaultSpline(position: WorldPositionVector3, geometry: three.BufferGeometry): void;
    _checkCollisionOperation(pathPosition: three.Vector3, lookAt: three.Vector3): void;
    /**
     * 누적 경로를 통해 해당하는 컴포넌트를 선택하는 함수
     * @param {event | Record<string, unknown>} e 클릭 이벤트
     * @returns {this | undefined} 컴포넌트
     *
     * @ignore
     */
    selectedByTrail(e: Event | Record<string, unknown>): this | undefined;
    /**
     * 누적 경로(궤적)의 선택 강조용 helper 메시를 표시합니다. 궤적 표시가 꺼져 있거나 궤적이 없으면 아무 동작도 하지 않습니다.
     */
    onSelectHelperMesh(): void;
    /**
     * `onSelectHelperMesh`로 표시한 궤적 강조 helper 메시를 숨깁니다.
     */
    offSelectHelperMesh(): void;
    /**
     * 컴포넌트를 씬에서 제거하고 모델·경로·라벨·오버레이·애니메이션 리소스를 해제하는 함수. <br>
     * 주의 사항: 호출 후 이 객체는 다시 사용할 수 없으며 `isDisposed()`가 true가 됩니다.
     */
    dispose(): void;
    /**
     * 모델 자체 애니메이션 클립(액션) 목록을 조회합니다. 키를 `startAction`/`stopAction`에 넘겨 재생을 제어합니다.
     * @returns {Record<string, import('three').AnimationAction> | undefined} 클립 이름을 키로 한 액션 객체. 믹서가 없으면 undefined
     */
    getAnimationClips(): Record<string, three.AnimationAction> | undefined;
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
    stopAction(key: string, fadeDuration?: number): void;
    /**
     * @param {string} key
     * @param {number} [fadeDuration=0.005]
     *
     * @ignore
     */
    stopAnimation(key: string, fadeDuration?: number): void;
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
    startAction(key: string, fadeDuration?: number, speed?: number | undefined): void;
    /**
     * @param {string} key
     * @param {number} [fadeDuration=0.005]
     *
     * @ignore
     */
    startAnimation(key: string, fadeDuration?: number): void;
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
    updateAction(key: string, speed?: number | undefined, fadeDuration?: number): void;
    /**
     * 모델 자체 애니메이션(클립)을 재생할 믹서 목록을 교체합니다. 이후 `mixers`·`getAnimationClips`는 새 목록을 기준으로 동작합니다.
     *
     * @param {Array<import('three').AnimationMixer>} [mixers=[]] 새 믹서 목록. 빈 배열이면 클립 재생이 없는 상태가 됩니다
     */
    setMixers(mixers?: Array<three.AnimationMixer>): void;
    /**
     * 모델 클립 믹서를 관리하는 컨트롤러를 반환합니다. 클립 목록 조회·재생·FPS 조절은 이 객체를 통해 이루어집니다.
     *
     * @returns {import('@union3d/analy/UComponentMixerController').UComponentMixerController} 믹서 컨트롤러
     */
    getMixerController(): UComponentMixerController;
    /**
     * 모델에 재생 가능한 애니메이션 클립(믹서)이 하나 이상 있는지 확인합니다.
     *
     * @returns {boolean} 믹서가 있으면 true
     */
    hasMixers(): boolean;
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
    getProperties(): KeyValue;
    /**
     * 컴포넌트 속성 정보를 설정하는 함수
     * @param {string | UnknownRecord} input 속성 객체, 또는 JSON 문자열 (파싱해서 적용)
     */
    setProperties(input: string | UnknownRecord): void;
    /**
     * 컴포넌트 속성 정보를 추가하는 함수
     * @param {string} key 속성 정보 식별키
     * @param {unknown} value 속성 정보 값
     */
    addProperties(key: string, value: unknown): void;
    /**
     * 컴포넌트 속성 정보를 제거하는 함수
     * @param {string} key 속성 정보 식별키
     */
    removeProperties(key: string): void;
    /**
     * 컴포넌트 속성정보를 변경하는 함수
     * @param {string} key 변경할 속성 정보 식별키
     * @param {unknown} value 속성 정보 값
     */
    changeProperties(key: string, value: unknown): void;
    /**
     * 컴포넌트 원본 모델 객체를 찾는 함수
     * @returns {import('three').Object3D | undefined} 원본 모델 그룹
     */
    getModel(): three.Object3D | undefined;
    /**
     * 컴포넌트가 출력하고있는 모델의 색상을 리턴합니다.
     * @returns {import('three').ColorRepresentation} 색상값, 색상값을 찾을 수 없다면 '' 빈문자열을 리턴합니다.
     */
    getColor(): three.ColorRepresentation;
    /**
     * 컴포넌트가 출력하고있는 모델의 투명도를 리턴합니다.
     * @returns {number} 투명도값, 투명도값을 찾을 수 없다면 NaN 을 리턴합니다.
     */
    getOpacity(): number;
    /**
     * 모델 재질의 깊이 버퍼 쓰기(depthWrite) 여부를 반환합니다. 첫 번째 재질 값을 대표로 사용합니다.
     *
     * @returns {boolean} depthWrite 값. 모델이나 재질이 없으면 true
     */
    getDepth(): boolean;
    /**
     * 컴포넌트가 출력하고있는 모델의 색상을 설정 합니다.
     * @param {import('three').ColorRepresentation} color 설정할 색상값
     * @returns {boolean} 색상이 적용되면 true, 모델이 없거나 적용에 실패하면 false
     */
    setColor(color?: three.ColorRepresentation): boolean;
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
    setBrightness(brightness?: number): void;
    /**
     * 이 컴포넌트에 setBrightness로 마지막에 설정한 밝기(brightness) 배율을 반환합니다. <br>
     *
     * @returns {number} 마지막으로 설정한 밝기 배율이며, 한 번도 설정하지 않았으면 1입니다.
     */
    getBrightness(): number;
    /**
     * 이 컴포넌트가 출력하는 모델의 대비(contrast)를 절대값으로 설정합니다. <br>
     * 1은 원래 대비이며 0은 중간 회색입니다. <br>
     * 밝기(brightness)를 적용한 뒤 RGB의 0.5를 기준으로 조절하며 투명도는 변경하지 않습니다. <br>
     * 1이 아닌 값을 설정하면 조절한 색상 채널을 0 이상 1 이하로 제한하고, 1이면 제한하지 않습니다. <br>
     * 지원 재질·적용 범위·화면 반영 시점·선택 강조·오류 처리는 setBrightness와 같습니다.
     *
     * @param {number} [contrast=1] 0 이상의 대비 배율이며, 생략하면 기본값 1로 복원합니다.
     */
    setContrast(contrast?: number): void;
    /**
     * 이 컴포넌트에 setContrast로 마지막에 설정한 대비(contrast) 배율을 반환합니다. <br>
     *
     * @returns {number} 마지막으로 설정한 대비 배율이며, 한 번도 설정하지 않았으면 1입니다.
     */
    getContrast(): number;
    /**
     * 모델의 채도를 절대값으로 설정합니다. 1은 원래 채도이며 0은 회색조입니다.
     * 밝기·대비를 적용한 뒤 Rec.709 휘도를 기준으로 조절하며 투명도는 변경하지 않습니다.
     * 지원 재질·선택 강조·오류 처리는 setBrightness와 같습니다.
     *
     * @param {number} [saturation=1] 채도 배율. 생략하면 기본값으로 복원합니다.
     */
    setSaturation(saturation?: number): void;
    /**
     * 이 컴포넌트에 설정한 채도 배율을 반환합니다.
     *
     * @returns {number} 채도 배율. 기본값은 1입니다.
     */
    getSaturation(): number;
    /**
     * 밝기·대비·채도를 한 번에 기본값(1)으로 되돌립니다.
     * 각각을 따로 설정하면 그때마다 재질을 갱신하므로 한 번에 처리합니다.
     */
    resetColorAdjustment(): void;
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
    protected _applyColorAdjustment(brightness: number, contrast: number, saturation?: number): void;
    /**
     * 컴포넌트가 출력하고있는 모델의 투명도를 설정 합니다.
     * @param {number} [opacity=1] 설정할 투명도 (0 투명 ~ 1 불투명)
     * @returns {boolean} 투명도가 적용되면 true, 모델이 없거나 적용에 실패하면 false
     */
    setOpacity(opacity?: number): boolean;
    /**
     * 모델의 모든 재질에 깊이 버퍼 쓰기(depthWrite)를 설정합니다. false로 두면 이 모델이 다른 객체의 깊이 판정에 영향을 주지 않아
     * 반투명 객체가 겹칠 때 뒤쪽이 사라지는 현상을 줄일 수 있습니다. 첫 호출 시 원본 재질이 복원용으로 보관됩니다.
     *
     * @param {boolean} [depthWrite=true] 깊이 버퍼 쓰기 여부
     * @returns {boolean} 항상 true
     */
    setDepth(depthWrite?: boolean): boolean;
    /**
     * 모델의 렌더 순서를 설정합니다. 값이 클수록 나중에 그려져 같은 위치의 다른 객체 위에 보입니다.
     * @param {number} renderOrder 렌더 순서 (기본 0)
     */
    setRenderOrder(renderOrder: number): void;
    /**
     * 모델의 렌더 순서를 반환합니다.
     * @returns {number | undefined} 렌더 순서. 모델이 없으면 undefined
     */
    getRenderOrder(): number | undefined;
    /**
     * 컴포넌트가 출력하고 있는 모델의 텍스쳐 출력을 끄거나 켭니다.
     * @param {boolean} [isExcept=false] true이면 텍스처를 숨기고 단색으로 그리며, false이면 텍스처를 다시 표시합니다
     * @returns {boolean} 적용되면 true, 모델이 없거나 적용에 실패하면 false
     */
    exceptTexture(isExcept?: boolean): boolean;
    /**
     * 컴포넌트의 변환 행렬(`matrix`)을 반환합니다. 부모가 있으면 부모 기준 상대 행렬입니다.
     *
     * @returns {import('three').Matrix4} 변환 행렬
     */
    getMatrix(): three.Matrix4;
    /**
     * 상위 계층을 설정하는 함수
     * 부모 / 자식 관계를 형성하여 부모의 형상관리 내용(위치, 회전, 크기, 가시화 여부)이 자식에게 반영
     * @param {U3dComponentPosition} parent 상위 계층 대상
     */
    setParent(parent: U3dComponentPosition): void;
    /**
     * `setParent`로 지정한 상위 컴포넌트를 반환합니다.
     *
     * @returns {U3dComponentPosition | undefined} 상위 컴포넌트. 없으면 undefined
     */
    getParent(): U3dComponentPosition | undefined;
    /**
     * 지정된 상위 계층을 제거하는 함수
     */
    removeParent(): void;
    /**
     * 하위 계층 대상을 설정하는 함수
     * @param {U3dComponentPosition | ExtendedObject3D} child 하위 계층 대상 (컴포넌트 또는 확장 3D 오브젝트)
     */
    setChild(child: U3dComponentPosition | ExtendedObject3D): void;
    /**
     * `setChild`로 등록한 하위 계층 목록을 반환하는 함수
     * @returns {Array<U3dComponentPosition | ExtendedObject3D>} 하위 컴포넌트·오브젝트 배열 (내부 배열을 직접 반환)
     */
    getChildren(): Array<U3dComponentPosition | ExtendedObject3D>;
    /**
     * 지정된 하위 계층 대상 제거하는 함수
     * @param {U3dComponentPosition} child 하위 계층 대상
     */
    removeChild(child: U3dComponentPosition): void;
    /**
     * 부모가 있으면 부모 기준으로 자신의 변환 행렬을 다시 계산합니다. 부모의 위치·회전·크기를 바꾼 뒤 호출하면 자식이 따라갑니다.
     */
    updateMatrix(): void;
    /**
     * 하위 계층 ( setChild ) 으로 등록된 대상들의 matrix를 반영해주는 함수
     */
    updateChildrenMatrix(): void;
    /**
     * 컴포넌트의 생성 파라미터값을 반환하는 함수
     * @returns {ComponentParam} 컴포넌트의 생성 파라미터값
     */
    getParam(): ComponentParam;
    _setForcedVisible(forced: boolean): void;
    _tempLODMode: string;
    /**
     * 컴포넌트 가시화(show) 함수
     * @returns {DeferredObject<unknown> | undefined} 숨김 상태를 표시한 경우 true로 resolve하며 이미 표시 중이면 undefined
     */
    show(): DeferredObject<unknown> | undefined;
    /**
     * 컴포넌트 비가시화(hide) 함수
     * @returns {DeferredObject<unknown> | undefined} 표시 상태를 숨긴 경우 true로 resolve하며 이미 숨김 상태면 undefined
     */
    hide(): DeferredObject<unknown> | undefined;
    /**
     * 컴포넌트의 경계영역(BoundingBox)을 반환하는 함수
     * @returns {import('three').Box3} 컴포넌트의 경계영역
     */
    getBoundingBox(): three.Box3;
    /**
     * 원래 모델의 geometry bounding box를 반환 ( 위치, 회전, 크기가 반영되지 않은 초기 상태)
     * @returns {Box3WithCenter} 모델의 bounding box
     */
    getBoundBoxObject(): Box3WithCenter;
    /**
     * 현재 위치·회전·크기를 반영한 경계 상자(육면체)의 8개 꼭짓점을 월드 좌표로 반환합니다. <br>
     * 이름의 Down/Up은 z(높이) 최소/최대, Left/Right는 x 최소/최대, Top/Bottom은 y 최소/최대를 뜻합니다.
     * 부수적으로 `_bbox` 캐시를 갱신합니다.
     *
     * @returns {{DownLeftTop: import('three').Vector3, DownRightTop: import('three').Vector3, DownLeftBottom: import('three').Vector3, DownRightBottom: import('three').Vector3, UpLeftTop: import('three').Vector3, UpRightTop: import('three').Vector3, UpLeftBottom: import('three').Vector3, UpRightBottom: import('three').Vector3} | undefined} 꼭짓점 8개. 모델이나 회전 정보가 없으면 undefined
     */
    getRectangle(): {
        DownLeftTop: three.Vector3;
        DownRightTop: three.Vector3;
        DownLeftBottom: three.Vector3;
        DownRightBottom: three.Vector3;
        UpLeftTop: three.Vector3;
        UpRightTop: three.Vector3;
        UpLeftBottom: three.Vector3;
        UpRightBottom: three.Vector3;
    } | undefined;
    /**
     * instanced 컴포넌트라면 해당 인스턴스의 index를 반환한다.
     * (기본 구현은 instanced가 아니므로 undefined)
     * @returns {number | undefined}
     *
     * @ignore
     */
    getInstancedId(): number | undefined;
    /**
     * 출력 모델을 구성하는 Mesh의 센터점으로 부터의 상대적 위치를 설정하는 메서드입니다.(센터점은 변경되지 않습니다.)
     * @param {import('three').Vector3} relocationOffset 이동량 백터
     * @param {boolean} [isCopy=false] true면 relocationOffset 값으로 위치를 덮어쓰고, false면 현재 위치에 더합니다
     * @example
     * componentPosition.relocationObjects({x:0,y:0,z:1}, false); //센터점에서 Mesh들이 z축으로 1만큼 추가 이동
     * componentPosition.relocationObjects({x:0,y:0,z:1}, true); //센터점에서 Mesh들이 z축 1 죄표로 정렬
     */
    relocationObjects(relocationOffset?: three.Vector3, isCopy?: boolean): void;
    /**
     * 컴포넌트의 오버레이들의 위치를 설정합니다.
     * @param {WorldPositionVector3} position 설정 위치 좌표 (월드 좌표)
     */
    settingOverlay(position: WorldPositionVector3): void;
    /**
     *
     * @param elapsedTime
     * @private
     *
     * @ignore
     */
    private _applyObjectFrame;
    /**
     *
     * @param elapsedTime
     * @private
     *
     * @ignore
     */
    private _applyMixerFrame;
    /**
     * 컴포넌트 주행/비행 애니메이션 업데이트 시 호출 할 사용자 함수 설정 메서드입니다.
     * @param {function} func 사용사 함수 (호출시 입력되는 파라메터: fnc(현재 위치, 현재 방향위치, 현재 회전, 이동거리, 총 이동거리) )
     */
    setUpdateAnimationFunc(func: Function): void;
    /**
     * @deprecated 2.2.1.10.180.d 부터 setUpdateAnimationFunc 으로 변경되었습니다.
     */
    setUpdateFnc(): void;
    /**
     * 애니메이션 시작 시 호출할 사용자 함수 설정 메서드입니다.
     * @param {function} func 사용사 함수 (호출시 입력되는 파라메터: fnc( U3dComponentPosition ) )
     */
    setStartAnimationFunc(func: Function): void;
    /**
     * @deprecated 2.2.1.10.180.d 부터 setStartAnimationFunc 으로 변경되었습니다.
     */
    setStartFnc(): void;
    /**
     * 애니메이션 종료 시 호출할 사용자 함수 설정 메서드입니다.
     * @param {function} func 사용사 함수 (호출시 입력되는 파라메터: fnc( U3dComponentPosition ) )
     */
    setEndAnimationFunc(func: Function): void;
    /**
     * @deprecated 2.2.1.10.180.d 부터 setEndAnimationFunc 으로 변경되었습니다.
     */
    setEndFnc(): void;
    /**
     * 컴포넌트 name을 편집하는 메서드입니다.
     * @param {string} newName 컴포넌트의 새 이름
     */
    editName(newName: string): void;
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
    setLabel(opt: {
        position?: WorldPositionVector3;
        image?: string;
        label?: string;
    }): void;
    /**
     * 컴포넌트 라벨 POI를 제거하는 메서드입니다.
     */
    removeLabel(): void;
    /**
     * 컴포넌트 라벨 POI을 화면에 보여주는(Show) 메서드입니다.
     */
    showLabel(): void;
    /**
     * 컴포넌트 라벨 POI을 화면에서 감추는(Hide) 메서드입니다.
     */
    hideLabel(): void;
    /**
     * 컴포넌트 라벨 POI의 가시화 여부를 반환하는 메서드입니다. <br>
     * 라벨 POI가 가시화 된 경우 true, 안된 경우 false를 반환한다.
     * @returns {boolean} 가시화 여부
     */
    isVisibleLabel(): boolean;
    /**
     * 컴포넌트 라벨 POI를 컴포넌트의 이름으로 갱신하는 메서드입니다.
     */
    updateLabel(): void;
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
    addPathGeometry(pathGeometry: PathGeometryLike, animateNow?: boolean, hovering?: boolean): void;
    /**
     * 컴포넌트 주행/비행 애니메이션을 시작(Start)하는 메서드입니다.
     */
    moveStart(): void;
    /**
     * 컴포넌트 주행/비행 애니메이션을 종료(Stop)하는 메서드입니다.
     * @param {boolean} [isInit=false] 애니메이션 초기화 여부. true면 애니메이션을 종류 후 초기화합니다.
     */
    moveStop(isInit?: boolean): void;
    /**
     * 컴포넌트 주행/비행 애니메이션을 재시작(Restart)하는 메서드입니다.
     */
    restart(): void;
    /**
     * 컴포넌트 주행/비행 애니메이션을 재개(Resume)하는 메서드입니다.
     */
    moveResume(): void;
    /**
     * 컴포넌트 주행/비행 애니메이션을 일시정지(Pause)하는 메서드입니다.
     */
    movePause(): void;
    /**
     * @ignore
     */
    _applyChangeFrame(): void;
    /**
     * @param {WorldPositionVector3} pathPosition 경로 위치 좌표
     *
     * @ignore
     */
    _applyPoiFrame(pathPosition: WorldPositionVector3): void;
    /**
     * @ignore
     */
    _applyJpgFrame(): void;
    /**
     * 컴포넌트가 이동할 Move Point를 추가하는 메서드입니다. <br>
     * 애니메이션 동작 시 Move Point를 따라 이동합니다.
     * @param {Array<GooglePositionWithCallback>} movePointList 이동할 Move Point 배열
     * @param {Array<import('three').Vector3>} [pitchYawRollList] 컴포넌트 방향각 옵션
     * @param {boolean} [animateNow=true] `true`면 경로 설정 즉시 애니메이션을 시작합니다.
     * @param [smoothCorner=true] `true`면 경로 생성 시 코너를 부드럽게 보정합니다.
     */
    addMovePoint(movePointList: Array<GooglePositionWithCallback>, pitchYawRollList?: Array<three.Vector3>, animateNow?: boolean, smoothCorner?: boolean): void;
    smoothCorner: boolean;
    /**
     * 컴포넌트에 오버레이(HTML 등 화면 요소)를 붙이는 메서드입니다. 붙인 오버레이는 컴포넌트가 이동할 때 함께 이동합니다.
     * @param {OverlayObject} overlay 붙일 오버레이 객체
     */
    setOverlay(overlay: OverlayObject): void;
    /**
     * 컴포넌트에 붙어 있는 오버레이 목록을 반환하는 메서드입니다.
     * @returns {Array<OverlayObject>} 오버레이 배열 (내부 배열을 직접 반환)
     */
    getOverlay(): Array<OverlayObject>;
    /**
     * POI의 Z(높이) 오프셋 값을 반환하는 메서드입니다.
     * @returns {number | undefined} 라벨이 모델 위로 떠 있는 높이 (m). 라벨이 없으면 undefined
     */
    getPoiZOffset(): number | undefined;
    /**
     * @deprecated 제거될 메서드입니다.
     *
     * @returns {Array<LightLike | import('@union3d/view/USpotLight').USpotLight>} light 목록
     *
     * @ignore
     */
    getLights(): Array<LightLike | USpotLight>;
    /**
     * @deprecated 제거될 메서드입니다.
     *
     * @param {Array<LightLike>} list 조명 목록
     *
     * @ignore
     */
    setLights(list: Array<LightLike>): void;
    /**
     * @deprecated 제거될 메서드입니다.
     *
     * @ignore
     */
    getViews(): UnknownRecord[];
    /**
     * @deprecated 제거될 메서드입니다.
     *
     * @ignore
     */
    addView(view: UnknownRecord): void;
    /**
     * @deprecated 제거될 메서드입니다.
     *
     * @ignore
     */
    setViews(list: Array<UnknownRecord>): void;
    /**
     * 컴포넌트에 등록된 오버레이를 목록에서 제거하는 메서드입니다.
     * @param {OverlayObject} overlay 제거할 오버레이 객체 (`setOverlay`로 붙인 것)
     */
    removeOverlay(overlay: OverlayObject): void;
    /**
     * 컴포넌트가 오버레이를 가지고 있는지 확인하는 메서드입니다. <br>
     * 파라미터로 overlay를 넣으면 해당 overlay가 있는지 검사합니다.
     * @param {OverlayObject} [overlay] 검색할 대상 overlay. 없으면 아무 오버레이나 가지고 있는지 검사합니다.
     * @returns {boolean} 가지고 있으면 true, 없으면 false
     */
    hasOverlay(overlay?: OverlayObject): boolean;
    /**
     * @deprecated 제거될 메서드입니다.
     *
     * @returns {Boolean} light를 가지고 있는지 여부
     *
     * @ignore
     */
    hasLight(): boolean;
    /**
     * 컴포넌트의 위경도 좌표를 반환하는 메서드입니다.
     * @returns {GeoPositionVector3} 위경도 좌표
     */
    getGeographicPosition(): GeoPositionVector3;
    /**
     * 컴포넌트의 3D 월드 좌표(EPSG:3857)를 위경도 좌표(EPSG:4326)로 변환하는 메서드입니다.
     * @param {WorldPositionVector3} world 3D 월드 좌표
     * @returns {GeoPositionVector3} 위경도 좌표
     */
    getGeographicPositionByWorld(world: WorldPositionVector3): GeoPositionVector3;
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
    setCameraTrace(bool: boolean, view?: string, offset?: three.Vector3Like, targetOffset?: three.Vector3Like): void;
    view: string;
    _offset: three.Vector3Like;
    _targetOffset: three.Vector3Like;
    /**
     * 현재 `isTrace` 값을 모든 주행 애니메이션 컨트롤러에 전달해 카메라 추적 상태를 동기화합니다. `setCameraTrace`가 내부적으로 호출합니다.
     */
    updateAnimationCameraTrace(): void;
    /**
     * 컴포넌트의 이동 경로 색상을 지정하는 함수
     * @param {import('three').ColorRepresentation} color 색상
     */
    setPathColor(color: three.ColorRepresentation): void;
    /**
     * 컴포넌트의 이동 경로 라인 투명도를 지정하는 함수
     * @param {number | string} opacity 투명도 (0 투명 ~ 1 불투명). 문자열은 숫자로 변환
     */
    setPathOpacity(opacity: number | string): void;
    /**
     * 컴포넌트의 이동 경로 라인 투명도를 반환하는 함수
     * @returns {number} 투명도 (0~1)
     */
    getPathOpacity(): number;
    /**
     * 컴포넌트의 위치를 지정하는 함수
     * @param {WorldPositionVector3} position 3D 월드 좌표
     * @param {import('three').Vector3 | undefined} [lookAt] 이동 후 바라볼 위치 (월드 좌표). 주면 그 방향으로 회전합니다
     * @param {boolean} [fixedOverlay=false] true면 오버레이를 현재 위치에 고정하고, false면 컴포넌트와 함께 이동시킵니다
     */
    setPosition(position: WorldPositionVector3, lookAt?: three.Vector3 | undefined, fixedOverlay?: boolean): void;
    /**
     * 주행 중 다른 객체가 충돌 감지 거리 안에 들어왔을 때 호출할 콜백을 지정하는 함수.
     * @param {function} func `(component) => void` 형태의 콜백. 충돌한 컴포넌트가 전달됩니다
     */
    setCollisionFunction(func: Function): void;
    /**
     * 주행 중 충돌로 판정할 거리를 설정하는 함수
     * @param {number} distance 충돌 감지 거리 (m, 기본 10)
     */
    setCollisionDistance(distance: number): void;
    /**
     * 경로 주행 시 유지할 고도를 설정합니다. 설정하면 경로 좌표의 높이 대신 이 값이 z에 적용됩니다.
     * @param {number | string | undefined} height 유지할 높이 (월드 z, m). undefined면 경로 높이를 그대로 사용
     */
    setHeight(height: number | string | undefined): void;
    _setHeight: number;
    /**
     * 컴포넌트의 회전값을 지정하는 함수
     * @param {RadianEulerLike} rotation 회전값(radian)
     */
    setRotation(rotation: RadianEulerLike): void;
    /**
     * 컴포넌트의 x축 회전값을 지정하는 함수
     * @param {Degree} degree x축 회전값 (degree)
     */
    setRotationX(degree: Degree): void;
    /**
     * 컴포넌트의 y축 회전값을 지정하는 함수
     * @param {Degree} degree y축 회전값 (degree)
     */
    setRotationY(degree: Degree): void;
    /**
     * 컴포넌트의 z축 회전값을 지정하는 함수
     * @param {Degree} degree z축 회전값 (degree)
     */
    setRotationZ(degree: Degree): void;
    /**
     * 컴포넌트의 회전값을 반환하는 함수
     * @returns {import('three').Euler} rotation 회전값 (radian)
     */
    getRotation(): three.Euler;
    /**
     * 해당 목록에서 컴포넌트가 광원을 가지고 있는지 확인하는 함수
     * @param {Array<LightLike>} lightList 전체 광원 목록
     * @returns {boolean} 광원 존재 여부
     */
    checkIshaveLight(lightList: Array<LightLike>): boolean;
    /**
     * 컴포넌트를 수직축(z축) 기준으로 지정 각도로 회전시키는 함수. 누적이 아니라 절대 각도로 설정됩니다.
     * @param {Degree} degree 회전 각도 (°, -360 ~ 360). 범위를 벗어나면 예외가 발생합니다
     */
    rotateByAngle(degree: Degree): void;
    /**
     * 컴포넌트의 크기를 지정하는 함수
     * @param {number | string | import('three').Vector3Like} scalar 스칼라 값 혹은 {x,y,z} 값
     */
    setScale(scalar: number | string | three.Vector3Like): void;
    /**
     * 컴포넌트의 크기를 반환하는 함수
     * @returns {import('three').Vector3} 크기 {x,y,z} 값
     */
    getScale(): three.Vector3;
    /**
     * 컴포넌트의 현재 크기에 배율을 곱하는 함수 (2면 두 배)
     * @param {number | string} num 곱할 배율. 문자열은 숫자로 변환
     */
    multiplyScale(num: number | string): void;
    /**
     * 컴포넌트의 이름을 반환하는 함수
     * @returns {string} 컴포넌트 이름
     */
    getName(): string;
    /**
     * 컴포넌트의 ID를 반환하는 함수
     * @returns {string | number} 컴포넌트 ID
     */
    getId(): string | number;
    /**
     * 애니메이션 동작시 컴포넌트가 현재까지 이동한 거리를 반환하는 함수
     * @returns {number} 현재까지 이동한 거리 (m). 주행 중이 아니면 0
     */
    getDistanceTraveled(): number;
    /**
     * 모델 자체 애니메이션 클립(액션) 목록을 반환합니다. `getAnimationClips`와 같은 값을 돌려줍니다.
     *
     * @returns {Record<string, import('three').AnimationAction> | undefined} 클립 이름을 키로 한 액션 객체. 믹서가 없으면 undefined
     */
    getAnimationList(): Record<string, three.AnimationAction> | undefined;
    /**
     * 컴포넌트 주행 애니메이션 목록을 반환하는 함수.
     * @returns {Map<string, import('@union3d/analy/UAnimationController').UAnimationController>} animationControllers 애니메이션 목록
     **/
    getAnimations(): Map<string, UAnimationController>;
    /**
     * 애니메이션 ID로 애니메이션 컨트롤러를 반환하는 함수.
     * @param {string} animationId 애니메이션 ID
     * @returns {import('@union3d/analy/UAnimationController').UAnimationController | undefined} UAnimationController 애니메이션 컨트롤러
     **/
    getAnimationById(animationId: string): UAnimationController | undefined;
    /**
     * 현재 동작 중인 주행 애니메이션 컨트롤러를 반환하는 함수.
     * @returns {import('@union3d/analy/UAnimationController').UAnimationController | undefined} 현재 애니메이션 컨트롤러. 주행 중이 아니면 undefined
     */
    getAnimationNow(): UAnimationController | undefined;
    /**
     * 현재 애니메이션 또는 지정한 애니메이션의 상태 정보를 반환하는 함수.
     * @param {string} [animationId] 조회할 애니메이션 ID. 생략 시 현재 동작 중인 애니메이션 조회
     * @returns {U3dComponentAnimationInfo | undefined}
     */
    getAnimationInfo(animationId?: string): U3dComponentAnimationInfo | undefined;
    /**
     * startAnimationId에 해당하는 StartAnimation 대상을 반환합니다.
     * @returns {import('@union3d/analy/UAnimationController').UAnimationController | undefined} 대상 UAnimationController
     */
    getStartAnimation(): UAnimationController | undefined;
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
    updateAnimation(key: string, speed?: number, fadeDuration?: number): void;
    /**
     * @deprecated stopMixer로 메서드를 사용하세요
     * @param {number} [fadeDuration=0.005]
     */
    stopAllAnimation(fadeDuration?: number): void;
    /**
     * @deprecated startMixer 메서드를 사용하세요
     * @param {number}[fadeDuration=0.005]
     */
    startAllAnimation(fadeDuration?: number): void;
    /**
     * 컴포넌트의 내장 애니메이션 클립을 모두 정지하는 함수
     */
    stopMixer(): void;
    /**
     * 컴포넌트의 내장 애니메이션 클립을 모두 동작시키는 함수
     */
    startMixer(): void;
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
    makeAnimationController(animationID: string, animation: (arg0: number, arg1: number) => void, durtaion?: number): UAnimationController | undefined;
    /**
     * 컴포넌트의 경로 이동 애니메이션 실행 중 강제로 위치를 이동 시키는 함수
     * @param {number} rate 이동 목표 비율. 0(시작점) ~ 1(종료점)
     */
    setForceMoveTween(rate: number): void;
    /**
     * 현재의 상태를 초기 상태로 저장합니다.
     */
    saveObjectSetting(): void;
    _initObject: any;
    /**
     * 컴포넌트를 선택했을 때 모델 전체를 지정 색상·투명도로 강조(highlight)하는 함수. `restoreMaterial`로 원래 재질을 복원합니다.
     *
     * @param {unknown} intersect 픽킹 결과(교차 정보). 현재 구현에서는 사용하지 않으며 모델 전체가 강조됩니다
     * @param {import('three').ColorRepresentation} [color] 강조 색상 (기본 '#fe5f55')
     * @param {number} [opacity] 강조 투명도 (0~1, 기본 0.6)
     *
     * @returns {boolean} 강조가 적용되면 true
     */
    pickMaterial(intersect: unknown, color?: three.ColorRepresentation, opacity?: number): boolean;
    /**
     * pickMaterial을 호출하여 강조한 색상을 복원합니다.
     */
    restoreMaterial(): void;
    /**
     * 카메라 추적 중 매 프레임 카메라 위치·시선을 컴포넌트에 맞춰 갱신합니다. 주행 애니메이션이 내부적으로 호출합니다.
     * @param {import('three').Vector3} pathPosition 컴포넌트의 현재 위치 (월드 좌표)
     * @param {number} delayCount 3인칭 회전 시점에서 회전을 지연시키는 프레임 수
     * @param {number} count 현재까지 경과한 프레임 수
     * @returns {{delayCount:number, count: number}} 다음 프레임에 넘길 갱신된 delayCount·count
     */
    updateCameraTrace(pathPosition: three.Vector3, delayCount: number, count: number): {
        delayCount: number;
        count: number;
    };
    #private;
}

export type { U3dComponentPosition };
