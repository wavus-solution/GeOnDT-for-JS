// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UFrustumHelperLoadOption, UFrustumHelperSaveOption, UFrustumHelperTerrainStampSnapshot } from "./UFrustumHelper.types.js";
import type { UTerrainStamp } from "./UTerrainStamp.js";
import type { ColorLike } from "../types/global.types.js";

type UFrustumTerrainProjectionHelper_Fill_Content = {
    enabled?: boolean;
    /**
     * 사용 중단된 기존 fill mesh 호환 옵션. 새 지형 stamp 코드는 stampMode를 사용한다.
     */
    mode?: "plane" | "frustum";
    color?: ColorLike;
    opacity?: number;
    /**
     * texture가 없을 때 color와 그라데이션할 두 번째 색상.
     */
    gradientColor?: ColorLike;
    /**
     * gradientColor가 있을 때 그라데이션 방향.
     */
    gradientDirection?: "vertical" | "horizontal";
    /**
     * 비지형·지면 접촉·호환 drape 형상의 프러스텀 옆면에 적용할 색상.
     */
    sideColor?: ColorLike;
    /**
     * 비지형·지면 접촉·호환 drape 형상의 프러스텀 옆면에 적용할 불투명도.
     */
    sideOpacity?: number;
    depthWrite?: boolean;
    /**
     * 비지형 fill mesh 전용 renderOrder. 생략하면 helper line renderOrder - 1을 사용한다.
     */
    renderOrder?: number;
    /**
     * 비지형 far 면 fill mesh 이름.
     */
    name?: string;
    /**
     * 옆면 fill mesh 이름.
     */
    sideName?: string;
    /**
     * 옆면 fill mesh 전용 renderOrder. 생략하면 renderOrder, helper line renderOrder - 1 순으로 사용한다.
     */
    sideRenderOrder?: number;
    /**
     * 사용 중단된 호환 옵션. false이면 terrain stamp를 끄지만 대체 fill mesh는 생성하지 않는다.
     */
    terrainStamp?: boolean;
    /**
     * true이면 terrain 교차 far 외곽선을 stamp shader로 출력한다.
     */
    terrainOutlineStamp?: boolean;
    /**
     * stamp 외곽선 두께 단위.
     */
    terrainOutlineWidthUnits?: "pixels" | "meters";
    /**
     * 부분 교차 stamp 영역을 재구성할 far plane UV 격자 한 변의 샘플 수. 3~17의 홀수로 정규화한다.
     */
    terrainStampGridSize?: number;
    /**
     * 검출된 hit/miss 경계를 이분 정제할 횟수. 0~12 범위이며 값이 클수록 경계 정밀도와 높이 조회 비용이 증가한다.
     */
    terrainBoundaryRefinementSteps?: number;
    /**
     * hit/miss 외곽의 볼록 모서리를 나눌 단계 수. 0~2 정수로 제한하며 0이면 비활성화한다.
     */
    terrainBoundaryFilletSegments?: number;
    /**
     * 짧은 인접 edge 길이를 기준으로 한 fillet 반경 비율. 0~0.3 범위로 제한한다.
     */
    terrainBoundaryFilletRatio?: number;
    /**
     * terrain stamp 모드에서 terrain tile 하나가 검사할 stamp 최대 개수.
     */
    maxStampsPerTile?: number;
    /**
     * terrain stamp 적용 방식. mask이면 stamp 영역을 마스크로 사용한다.
     */
    stampMode?: "fill" | "mask";
    /**
     * mask stamp를 특정 terrain/image layer에만 적용할 때 사용할 대상 layer.
     */
    targetLayer?: object;
    /**
     * terrainStamp 영역에 채울 이미지 URL.
     */
    texture?: string;
    /**
     * terrainStamp texture 불투명도.
     */
    textureOpacity?: number;
    /**
     * false이면 PNG alpha를 무시하고 textureOpacity만 사용한다.
     */
    textureUseAlpha?: boolean;
    /**
     * terrainStamp texture 프레임을 중심 기준으로 확대/축소하는 배율.
     */
    textureScale?: number;
    /**
     * terrainStamp texture 매핑 방식. contain은 4점 far plane polygon에 맞춰 이미지를 찌그러뜨린다.
     */
    textureFit?: "stretch" | "contain";
};

type UFrustumTerrainProjectionHelper_ProjectionLine_Content = {
    /**
     * true이고 origin이 있으면 투영 중심선을 생성한다.
     */
    visible?: boolean;
    /**
     * helper 로컬 좌표계의 투영선 시작점.
     */
    origin?: three.Vector3 | {
        x: number;
        y: number;
        z: number;
    };
    /**
     * 투영선 색상. 생략하면 helper 선 색상을 사용한다.
     */
    color?: ColorLike;
    /**
     * 투영선 두께.
     */
    lineWidth?: number;
    /**
     * 투영선 불투명도. 생략하면 helper 선 불투명도를 사용한다.
     */
    opacity?: number;
    /**
     * 점선 한 구간의 길이.
     */
    dashSize?: number;
    /**
     * 점선 사이 간격.
     */
    gapSize?: number;
    /**
     * 선 두께·점선 길이의 world 단위 사용 여부. 생략하면 helper 선 설정을 사용한다.
     */
    worldUnits?: boolean;
    /**
     * depth buffer 기록 여부. 생략하면 helper 선 설정을 사용한다.
     */
    depthWrite?: boolean;
    /**
     * 투영선 객체 이름.
     */
    name?: string;
    /**
     * 투영선 renderOrder. 생략하면 helper line renderOrder + 1을 사용한다.
     */
    renderOrder?: number;
};

type UFrustumTerrainProjectionHelperCO_Content = {
    /**
     * terrain=true일 때 현재 렌더 지면 높이를 조회할 렌더링 컨텍스트. 조회 API가 없으면 지면 접촉을 확정할 수 없어 OOR로 숨긴다.
     */
    drawArg?: UDrawArg;
    /**
     * helper 객체 이름.
     */
    name?: string;
    color?: ColorLike;
    /**
     * helper 선과 지면 외곽선 stamp에 함께 적용할 두께. 양수인 유한값만 사용하며 그 밖의 값은 2를 사용한다.
     */
    lineWidth?: number;
    opacity?: number;
    worldUnits?: boolean;
    depthWrite?: boolean;
    zOffset?: number;
    /**
     * 선과 mesh fragment depth에 적용할 bias. 0이면 shader 주입을 생략한다.
     */
    depthOffset?: number;
    /**
     * 호환 drape 경로의 far 외곽선을 샘플링할 월드 간격(m). 기본 지면 접촉 footprint 경로에서는 사용하지 않는다.
     */
    sampleSpacing?: number;
    /**
     * near -> far 선분의 terrain 교차 구간을 찾을 분할 수. 2~64 정수로 제한한다.
     */
    intersectionSteps?: number;
    /**
     * 렌더 중인 helper가 현재 Frustum 상태를 다시 읽을 고정 목표 주기(ms). 1ms 이상이며 실제 render가 3초 동안 없으면 갱신을 멈추고 다음 render에서 다시 시작한다.
     */
    updateIntervalMs?: number;
    /**
     * 부분 terrain stamp 영역을 재구성할 far plane UV 격자 한 변의 샘플 수. 3~17의 홀수로 정규화한다.
     */
    terrainStampGridSize?: number;
    /**
     * 검출된 hit/miss 경계를 이분 정제할 횟수. 0~12 범위.
     */
    terrainBoundaryRefinementSteps?: number;
    /**
     * 메인 카메라 밖의 helper는 terrain update와 렌더링을 건너뛴다.
     */
    cullByMainCamera?: boolean;
    /**
     * 호환 drape 경로의 외곽선 내부 샘플을 완화한다. 기본 지면 접촉 footprint 경로에서는 사용하지 않는다.
     */
    smoothing?: boolean;
    /**
     * 호환 drape 외곽선 smoothing 반복 횟수. 값이 커질수록 매끈해지지만 매 update 계산량이 증가한다.
     */
    smoothingIterations?: number;
    /**
     * 호환 drape 외곽선 샘플이 이웃 평균으로 이동할 비율. 0이면 변화 없음, 1이면 이웃 평균 위치를 바로 사용한다.
     */
    smoothingFactor?: number;
    /**
     * 고정 update 사이의 위치·회전 변화를 시간 기반으로 완화한다. terrain:true일 때 기본값은 true이다.
     */
    temporalStabilization?: boolean;
    /**
     * 시간 안정화 오차가 절반으로 줄어드는 시간(ms). 작을수록 빠르게 추종하고 클수록 떨림을 강하게 줄인다.
     */
    temporalHalfLifeMs?: number;
    /**
     * 원시 자세와 안정화 자세의 far 코너 world 거리가 이 값(m) 이하이면 이전 자세를 유지한다.
     */
    temporalHysteresisDistance?: number;
    /**
     * far 코너 오차에 따라 반감기를 추가로 늘리는 강도. 0~4 범위이며 값이 클수록 먼 면이 부드럽지만 지연이 커진다.
     */
    temporalFarSmoothingFactor?: number;
    /**
     * 이 시간보다 update 간격이 길면 과거 보간 이력을 버리는 단절 기준(ms). 250~60000 범위.
     */
    temporalSnapGapMs?: number;
    /**
     * 고정 UV별 지면 광선 결과와 hit/miss 경계를 프레임 사이에서 안정화한다. 생략하면 terrain이 true일 때만 활성화한다.
     */
    terrainIntersectionStabilization?: boolean;
    /**
     * 순간 교차점 요동을 제거할 최근 결과 개수. 1~31 홀수이며 1은 중앙값 단계를 끈다.
     */
    terrainIntersectionMedianWindow?: number;
    /**
     * 지면 교차 거리와 경계 위치가 새 결과로 수렴하는 반감기(ms). 0~60000 범위이며 0이면 시간 평균을 끈다. 실제 경계 추종이 늦어질 수 있어 20ms 이상은 권장하지 않는다.
     */
    terrainIntersectionHalfLifeMs?: number;
    /**
     * 최근 측정의 중앙값 목표가 크게 바뀔 때 경계 방향과 광선 깊이 방향에서 한 번에 이동시킬 최대 world 거리(m). 이후 시간 EMA가 적용되므로 실제 표시점의 3차원 이동량 상한은 아니다. 30m보다 큰 값은 보정 후보의 camera-ray 재투영 허용거리에도 사용한다. 0이면 접촉 위치의 중앙값·거리·시간 보정을 건너뛴다.
     */
    terrainIntersectionMaxLagDistance?: number;
    /**
     * hit/miss가 반대로 바뀐 뒤 footprint 상태를 확정하기까지 유지되어야 하는 시간(ms). 0~60000 범위이며 0이면 즉시 전환한다.
     */
    terrainIntersectionHitPersistenceMs?: number;
    /**
     * helper line 기준 renderOrder. 생략 시 fill은 -1, projectionLine은 +1이 기본값이다.
     */
    renderOrder?: number;
    projectionLine?: UFrustumTerrainProjectionHelper_ProjectionLine_Content;
    /**
     * true이면 near→far 광선과 현재 렌더 지면의 교차점으로 실제 지면 footprint를 만든다. 조회 좌표에 고도 데이터가 없으면 기본 평면 높이 0을 사용한다.
     */
    terrain?: boolean;
    /**
     * true이면 terrain 교차 far 외곽선을 stamp shader로 그리고 비교차 구간만 LineSegments2로 남긴다.
     */
    terrainOutlineStamp?: boolean;
    /**
     * stamp 외곽선 두께 단위.
     */
    terrainOutlineWidthUnits?: "pixels" | "meters";
    fill?: UFrustumTerrainProjectionHelper_Fill_Content;
};

type UFrustumTerrainProjectionHelperCO = UFrustumTerrainProjectionHelperCO_Content;

/**
 * @typedef {object} UFrustumTerrainProjectionHelper_Fill_Content
 * @property {boolean} [enabled=false]
 * @property {'plane'|'frustum'} [mode='plane'] 사용 중단된 기존 fill mesh 호환 옵션. 새 지형 stamp 코드는 stampMode를 사용한다.
 * @property {ColorLike} [color]
 * @property {number} [opacity=0.12]
 * @property {ColorLike} [gradientColor] texture가 없을 때 color와 그라데이션할 두 번째 색상.
 * @property {'vertical'|'horizontal'} [gradientDirection='vertical'] gradientColor가 있을 때 그라데이션 방향.
 * @property {ColorLike} [sideColor] 비지형·지면 접촉·호환 drape 형상의 프러스텀 옆면에 적용할 색상.
 * @property {number} [sideOpacity] 비지형·지면 접촉·호환 drape 형상의 프러스텀 옆면에 적용할 불투명도.
 * @property {boolean} [depthWrite=false]
 * @property {number} [renderOrder] 비지형 fill mesh 전용 renderOrder. 생략하면 helper line renderOrder - 1을 사용한다.
 * @property {string} [name='UFrustumHelperNonTerrainFill'] 비지형 far 면 fill mesh 이름.
 * @property {string} [sideName='UFrustumHelperSideFill'] 옆면 fill mesh 이름.
 * @property {number} [sideRenderOrder] 옆면 fill mesh 전용 renderOrder. 생략하면 renderOrder, helper line renderOrder - 1 순으로 사용한다.
 * @property {boolean} [terrainStamp] 사용 중단된 호환 옵션. false이면 terrain stamp를 끄지만 대체 fill mesh는 생성하지 않는다.
 * @property {boolean} [terrainOutlineStamp=true] true이면 terrain 교차 far 외곽선을 stamp shader로 출력한다.
 * @property {'pixels'|'meters'} [terrainOutlineWidthUnits='pixels'] stamp 외곽선 두께 단위.
 * @property {number} [terrainStampGridSize=9] 부분 교차 stamp 영역을 재구성할 far plane UV 격자 한 변의 샘플 수. 3~17의 홀수로 정규화한다.
 * @property {number} [terrainBoundaryRefinementSteps=6] 검출된 hit/miss 경계를 이분 정제할 횟수. 0~12 범위이며 값이 클수록 경계 정밀도와 높이 조회 비용이 증가한다.
 * @property {number} [terrainBoundaryFilletSegments=2] hit/miss 외곽의 볼록 모서리를 나눌 단계 수. 0~2 정수로 제한하며 0이면 비활성화한다.
 * @property {number} [terrainBoundaryFilletRatio=0.15] 짧은 인접 edge 길이를 기준으로 한 fillet 반경 비율. 0~0.3 범위로 제한한다.
 * @property {number} [maxStampsPerTile=128] terrain stamp 모드에서 terrain tile 하나가 검사할 stamp 최대 개수.
 * @property {'fill'|'mask'} [stampMode='fill'] terrain stamp 적용 방식. mask이면 stamp 영역을 마스크로 사용한다.
 * @property {object} [targetLayer] mask stamp를 특정 terrain/image layer에만 적용할 때 사용할 대상 layer.
 * @property {string} [texture] terrainStamp 영역에 채울 이미지 URL.
 * @property {number} [textureOpacity=1] terrainStamp texture 불투명도.
 * @property {boolean} [textureUseAlpha=true] false이면 PNG alpha를 무시하고 textureOpacity만 사용한다.
 * @property {number} [textureScale=1] terrainStamp texture 프레임을 중심 기준으로 확대/축소하는 배율.
 * @property {'stretch'|'contain'} [textureFit='stretch'] terrainStamp texture 매핑 방식. contain은 4점 far plane polygon에 맞춰 이미지를 찌그러뜨린다.
 */
/**
 * @typedef {object} UFrustumTerrainProjectionHelper_ProjectionLine_Content
 * @property {boolean} [visible=false] true이고 origin이 있으면 투영 중심선을 생성한다.
 * @property {import('three').Vector3|{x:number,y:number,z:number}} [origin] helper 로컬 좌표계의 투영선 시작점.
 * @property {ColorLike} [color] 투영선 색상. 생략하면 helper 선 색상을 사용한다.
 * @property {number} [lineWidth=1] 투영선 두께.
 * @property {number} [opacity] 투영선 불투명도. 생략하면 helper 선 불투명도를 사용한다.
 * @property {number} [dashSize=10] 점선 한 구간의 길이.
 * @property {number} [gapSize=6] 점선 사이 간격.
 * @property {boolean} [worldUnits] 선 두께·점선 길이의 world 단위 사용 여부. 생략하면 helper 선 설정을 사용한다.
 * @property {boolean} [depthWrite] depth buffer 기록 여부. 생략하면 helper 선 설정을 사용한다.
 * @property {string} [name='UFrustumProjectionLine'] 투영선 객체 이름.
 * @property {number} [renderOrder] 투영선 renderOrder. 생략하면 helper line renderOrder + 1을 사용한다.
 */
/**
 * @typedef {object} UFrustumTerrainProjectionHelperCO_Content
 * @property {import('@UDrawArg').UDrawArg} [drawArg] terrain=true일 때 현재 렌더 지면 높이를 조회할 렌더링 컨텍스트. 조회 API가 없으면 지면 접촉을 확정할 수 없어 OOR로 숨긴다.
 * @property {string} [name='UFrustumTerrainProjectionHelper'] helper 객체 이름.
 * @property {ColorLike} [color=0xffff00]
 * @property {number} [lineWidth=2] helper 선과 지면 외곽선 stamp에 함께 적용할 두께. 양수인 유한값만 사용하며 그 밖의 값은 2를 사용한다.
 * @property {number} [opacity=1]
 * @property {boolean} [worldUnits=false]
 * @property {boolean} [depthWrite=false]
 * @property {number} [zOffset=0]
 * @property {number} [depthOffset=0.005] 선과 mesh fragment depth에 적용할 bias. 0이면 shader 주입을 생략한다.
 * @property {number} [sampleSpacing=10] 호환 drape 경로의 far 외곽선을 샘플링할 월드 간격(m). 기본 지면 접촉 footprint 경로에서는 사용하지 않는다.
 * @property {number} [intersectionSteps=16] near -> far 선분의 terrain 교차 구간을 찾을 분할 수. 2~64 정수로 제한한다.
 * @property {number} [updateIntervalMs=20] 렌더 중인 helper가 현재 Frustum 상태를 다시 읽을 고정 목표 주기(ms). 1ms 이상이며 실제 render가 3초 동안 없으면 갱신을 멈추고 다음 render에서 다시 시작한다.
 * @property {number} [terrainStampGridSize=9] 부분 terrain stamp 영역을 재구성할 far plane UV 격자 한 변의 샘플 수. 3~17의 홀수로 정규화한다.
 * @property {number} [terrainBoundaryRefinementSteps=6] 검출된 hit/miss 경계를 이분 정제할 횟수. 0~12 범위.
 * @property {boolean} [cullByMainCamera=true] 메인 카메라 밖의 helper는 terrain update와 렌더링을 건너뛴다.
 * @property {boolean} [smoothing=false] 호환 drape 경로의 외곽선 내부 샘플을 완화한다. 기본 지면 접촉 footprint 경로에서는 사용하지 않는다.
 * @property {number} [smoothingIterations=2] 호환 drape 외곽선 smoothing 반복 횟수. 값이 커질수록 매끈해지지만 매 update 계산량이 증가한다.
 * @property {number} [smoothingFactor=0.35] 호환 drape 외곽선 샘플이 이웃 평균으로 이동할 비율. 0이면 변화 없음, 1이면 이웃 평균 위치를 바로 사용한다.
 * @property {boolean} [temporalStabilization] 고정 update 사이의 위치·회전 변화를 시간 기반으로 완화한다. terrain:true일 때 기본값은 true이다.
 * @property {number} [temporalHalfLifeMs=40] 시간 안정화 오차가 절반으로 줄어드는 시간(ms). 작을수록 빠르게 추종하고 클수록 떨림을 강하게 줄인다.
 * @property {number} [temporalHysteresisDistance=0.5] 원시 자세와 안정화 자세의 far 코너 world 거리가 이 값(m) 이하이면 이전 자세를 유지한다.
 * @property {number} [temporalFarSmoothingFactor=0.75] far 코너 오차에 따라 반감기를 추가로 늘리는 강도. 0~4 범위이며 값이 클수록 먼 면이 부드럽지만 지연이 커진다.
 * @property {number} [temporalSnapGapMs=2000] 이 시간보다 update 간격이 길면 과거 보간 이력을 버리는 단절 기준(ms). 250~60000 범위.
 * @property {boolean} [terrainIntersectionStabilization] 고정 UV별 지면 광선 결과와 hit/miss 경계를 프레임 사이에서 안정화한다. 생략하면 terrain이 true일 때만 활성화한다.
 * @property {number} [terrainIntersectionMedianWindow=3] 순간 교차점 요동을 제거할 최근 결과 개수. 1~31 홀수이며 1은 중앙값 단계를 끈다.
 * @property {number} [terrainIntersectionHalfLifeMs=10] 지면 교차 거리와 경계 위치가 새 결과로 수렴하는 반감기(ms). 0~60000 범위이며 0이면 시간 평균을 끈다. 실제 경계 추종이 늦어질 수 있어 20ms 이상은 권장하지 않는다.
 * @property {number} [terrainIntersectionMaxLagDistance=30] 최근 측정의 중앙값 목표가 크게 바뀔 때 경계 방향과 광선 깊이 방향에서 한 번에 이동시킬 최대 world 거리(m). 이후 시간 EMA가 적용되므로 실제 표시점의 3차원 이동량 상한은 아니다. 30m보다 큰 값은 보정 후보의 camera-ray 재투영 허용거리에도 사용한다. 0이면 접촉 위치의 중앙값·거리·시간 보정을 건너뛴다.
 * @property {number} [terrainIntersectionHitPersistenceMs=50] hit/miss가 반대로 바뀐 뒤 footprint 상태를 확정하기까지 유지되어야 하는 시간(ms). 0~60000 범위이며 0이면 즉시 전환한다.
 * @property {number} [renderOrder=0] helper line 기준 renderOrder. 생략 시 fill은 -1, projectionLine은 +1이 기본값이다.
 * @property {UFrustumTerrainProjectionHelper_ProjectionLine_Content} [projectionLine]
 * @property {boolean} [terrain=false] true이면 near→far 광선과 현재 렌더 지면의 교차점으로 실제 지면 footprint를 만든다. 조회 좌표에 고도 데이터가 없으면 기본 평면 높이 0을 사용한다.
 * @property {boolean} [terrainOutlineStamp=true] true이면 terrain 교차 far 외곽선을 stamp shader로 그리고 비교차 구간만 LineSegments2로 남긴다.
 * @property {'pixels'|'meters'} [terrainOutlineWidthUnits='pixels'] stamp 외곽선 두께 단위.
 * @property {UFrustumTerrainProjectionHelper_Fill_Content} [fill]
 *
 * @typedef {UFrustumTerrainProjectionHelperCO_Content} UFrustumTerrainProjectionHelperCO
 */
/**
 * ~extends import('three').LineSegments2 <br>
 * 프러스텀 광선이 실제 렌더 지면과 만나는 footprint의 외곽선·옆면·채움을 그리는 helper 클래스입니다.
 * 지면과 교차하지 않는 OOR 상태에서는 지형 관련 형상을 출력하지 않습니다.
 * LineSegments2를 기반으로 선 두께를 조절할수 있는 기능을 제공합니다.
 *
 * @extends {LineSegments2}
 *
 * @example
 * const helper = new UFrustumTerrainProjectionHelper(frustum, {
 *     color: 0x00ffff,
 *     lineWidth: 3,
 *     opacity: 0.6
 * });
 * scene.add(helper);
 */
declare class UFrustumTerrainProjectionHelper extends LineSegments2 {
    /**
     * @param {import('three').Frustum} frustum
     * @param {UFrustumTerrainProjectionHelperCO} [options={}]
     */
    constructor(frustum?: three.Frustum, options?: UFrustumTerrainProjectionHelperCO);
    _disposed: boolean;
    frustum: Frustum;
    color: Color;
    drawArg: UDrawArg;
    useTerrain: boolean;
    zOffset: number;
    depthOffset: number;
    sampleSpacing: number;
    intersectionSteps: number;
    updateIntervalMs: number;
    terrainContactOnly: boolean;
    terrainStampGridSize: number;
    effectiveTerrainStampGridSize: number;
    terrainBoundaryRefinementSteps: number;
    terrainBoundaryFilletSegments: number;
    terrainBoundaryFilletRatio: number;
    cullByMainCamera: boolean;
    smoothing: boolean;
    smoothingIterations: number;
    smoothingFactor: number;
    temporalStabilization: boolean;
    temporalHalfLifeMs: number;
    temporalHysteresisDistance: number;
    temporalFarSmoothingFactor: number;
    temporalSnapGapMs: number;
    terrainIntersectionStabilization: boolean;
    terrainIntersectionMedianWindow: number;
    terrainIntersectionHalfLifeMs: number;
    terrainIntersectionMaxLagDistance: number;
    terrainIntersectionHitPersistenceMs: number;
    terrainHeightSampleLayout: any;
    fillOptions: UFrustumTerrainProjectionHelper_Fill_Content;
    useTerrainFillStamp: boolean;
    useTerrainOutlineStamp: boolean;
    terrainOutlineWidth: number;
    terrainOutlineWidthUnits: string;
    nonTerrainFillMesh: Mesh<BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, ShaderMaterial, three.Object3DEventMap>;
    sideFillMesh: Mesh<BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, ShaderMaterial, three.Object3DEventMap>;
    projectionLineOptions: UFrustumTerrainProjectionHelper_ProjectionLine_Content;
    projectionLine: LineSegments2;
    type: string;
    /**
     * 프러스텀 객체를 교체하고 현재 평면 정보로 helper geometry를 다시 만든다.
     * @param {import('three').Frustum} frustum
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setFrustum(frustum: three.Frustum): UFrustumTerrainProjectionHelper;
    /**
     * 렌더 중 현재 Frustum 상태를 다시 읽을 고정 목표 주기(ms)를 변경한다.
     * Helper는 이 값과 관계없이 Frustum의 상태 변경 API를 호출하지 않는다.
     * 1ms 이상의 유한한 양수만 사용하며, 잘못된 값은 현재 정상 주기를 유지한다.
     * 브라우저 timer 지연이나 지형 계산 시간이 길면 실제 주기는 설정값보다 늦어질 수 있으며,
     * 놓친 tick은 연속 실행하지 않고 다음 주기부터 다시 계산한다.
     * @param {number} updateIntervalMs
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setUpdateIntervalMs(updateIntervalMs: number): UFrustumTerrainProjectionHelper;
    /**
     * 현재 Helper 자체 갱신 목표 주기(ms)를 반환한다.
     * @returns {number}
     */
    getUpdateIntervalMs(): number;
    /**
     * near -> far 광선의 지면 교차 탐색 분할 수를 변경한다.
     * 2~64 정수로 제한하며, 값이 커질수록 깊이 방향의 최초 접점은 정밀해지지만 한 번의 지형 높이 조회량도 선형으로 증가한다.
     * @param {number} intersectionSteps
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setIntersectionSteps(intersectionSteps: number): UFrustumTerrainProjectionHelper;
    /**
     * 현재 near -> far 지면 교차 분할 수를 반환한다.
     * @returns {number}
     */
    getIntersectionSteps(): number;
    /**
     * far plane footprint를 분류할 정규 UV 격자의 한 변 샘플 수를 변경한다.
     * 3~17의 홀수로 정규화하며, 값이 클수록 far 면의 작은 지형 변화와 경계를 더 촘촘히 검출한다.
     * topology가 UTerrainStamp 128개 예산을 넘는 극단적 패턴은 이미 조회한 ray의 부분 집합으로 안전하게 낮춰 출력한다.
     * @param {number} terrainStampGridSize
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setTerrainStampGridSize(terrainStampGridSize: number): UFrustumTerrainProjectionHelper;
    /**
     * 현재 footprint UV 격자의 한 변 샘플 수를 반환한다.
     * @returns {number}
     */
    getTerrainStampGridSize(): number;
    /**
     * 마지막 terrain footprint 생성에서 실제 출력 topology에 사용한 격자 크기를 반환한다.
     * 보통 요청값과 같고, 128 polygon 예산을 넘는 복잡한 패턴에서만 더 작은 값이 된다.
     * @returns {number}
     */
    getEffectiveTerrainStampGridSize(): number;
    /**
     * hit/miss로 검출된 footprint 경계를 이분 정제할 횟수를 변경한다.
     * 0~12 정수로 제한한다. 격자나 stamp 수를 늘리지 않고 경계 구간만 좁히므로,
     * 큰 far에서도 128 stamp 제한을 유지하며 정밀도를 높일 수 있다.
     * @param {number} terrainBoundaryRefinementSteps
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setTerrainBoundaryRefinementSteps(terrainBoundaryRefinementSteps: number): UFrustumTerrainProjectionHelper;
    /**
     * 현재 footprint 경계 이분 정제 횟수를 반환한다.
     * @returns {number}
     */
    getTerrainBoundaryRefinementSteps(): number;
    /**
     * Helper 고정 tick 사이의 자세 시간 안정화 사용 여부를 변경한다.
     * 전환 시 과거 자세를 버려, 다시 켰을 때 오래된 형상에서 현재 위치까지 따라오는 잔상을 막는다.
     * @param {boolean} temporalStabilization
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setTemporalStabilization(temporalStabilization: boolean): UFrustumTerrainProjectionHelper;
    /**
     * 현재 자세 시간 안정화 사용 여부를 반환한다.
     * @returns {boolean}
     */
    getTemporalStabilization(): boolean;
    /**
     * 시간 필터의 기본 반감기(ms)를 변경한다.
     * 큰 값은 더 부드럽지만 원시 프러스텀을 늦게 추종하고, 작은 값은 정확하게 따라가지만 떨림이 더 드러난다.
     * 유한한 양수만 사용하며, 잘못된 값은 현재 정상 반감기를 유지한다.
     * @param {number} temporalHalfLifeMs
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setTemporalHalfLifeMs(temporalHalfLifeMs: number): UFrustumTerrainProjectionHelper;
    /**
     * 현재 시간 필터 기본 반감기(ms)를 반환한다.
     * @returns {number}
     */
    getTemporalHalfLifeMs(): number;
    /**
     * far 코너의 작은 왕복 변화를 무시할 world 거리(m)를 변경한다.
     * 현재 자세 이력은 보존하되 hold 상태만 해제해 다음 update에서 새 임계값으로 다시 판정한다.
     * 유한한 0 이상의 값을 사용하며, 잘못된 값은 현재 정상 거리를 유지한다.
     * @param {number} temporalHysteresisDistance
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setTemporalHysteresisDistance(temporalHysteresisDistance: number): UFrustumTerrainProjectionHelper;
    /**
     * 현재 far 코너 히스테리시스 거리(m)를 반환한다.
     * @returns {number}
     */
    getTemporalHysteresisDistance(): number;
    /**
     * far 코너 오차에 따라 기본 반감기를 추가로 늘리는 보정 강도를 변경한다.
     * 0~4 범위이며, 0은 추가 보정 없음이고 값이 클수록 긴 far 면이 자연스럽게 변하지만 현재 자세와의 시각적 지연도 커진다.
     * @param {number} temporalFarSmoothingFactor
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setTemporalFarSmoothingFactor(temporalFarSmoothingFactor: number): UFrustumTerrainProjectionHelper;
    /**
     * 현재 far 회전 적응형 시간 보정 강도를 반환한다.
     * @returns {number}
     */
    getTemporalFarSmoothingFactor(): number;
    /**
     * 시간 안정화 이력을 즉시 현재 자세로 전환할 update 단절 기준(ms)을 변경한다.
     * 저주기 서비스에서는 호출 간격보다 크게 설정해야 반감기와 far 보정이 계속 적용된다.
     * @param {number} temporalSnapGapMs
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setTemporalSnapGapMs(temporalSnapGapMs: number): UFrustumTerrainProjectionHelper;
    /**
     * 현재 시간 안정화 update 단절 기준(ms)을 반환한다.
     * @returns {number}
     */
    getTemporalSnapGapMs(): number;
    /**
     * 지면 광선 결과의 프레임 간 안정화 사용 여부를 변경한다.
     * 자세 시간 보정과 독립된 기능이며, 끄면 다음 update부터 현재 광선 결과를 그대로 사용한다.
     * @param {boolean} terrainIntersectionStabilization
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setTerrainIntersectionStabilization(terrainIntersectionStabilization: boolean): UFrustumTerrainProjectionHelper;
    /**
     * 현재 지면 광선 결과 안정화 사용 여부를 반환한다.
     * @returns {boolean}
     */
    getTerrainIntersectionStabilization(): boolean;
    /**
     * 고정 UV ray별 최근 교차 거리에서 순간 튐을 제거할 중앙값 표본 개수를 변경한다.
     * 1~31의 홀수로 정규화하며, 1은 이력 없이 현재 결과만 사용한다.
     * @param {number} terrainIntersectionMedianWindow
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setTerrainIntersectionMedianWindow(terrainIntersectionMedianWindow: number): UFrustumTerrainProjectionHelper;
    /**
     * 현재 지면 광선 교차 중앙값 표본 개수를 반환한다.
     * @returns {number}
     */
    getTerrainIntersectionMedianWindow(): number;
    /**
     * 지면 광선 교차 거리와 정제 경계 위치의 시간 평균 반감기(ms)를 변경한다.
     * 0~60000 범위이며 0이면 중앙값 결과를 즉시 사용하고, 값이 클수록 진폭은 줄지만 지면 경계 추종이 늦어진다.
     * 20ms 이상은 실제 경계를 따라가는 동안 형상이 늘어져 보일 수 있어 권장하지 않는다.
     * @param {number} terrainIntersectionHalfLifeMs
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setTerrainIntersectionHalfLifeMs(terrainIntersectionHalfLifeMs: number): UFrustumTerrainProjectionHelper;
    /**
     * 현재 지면 광선 결과 시간 평균 반감기(ms)를 반환한다.
     * @returns {number}
     */
    getTerrainIntersectionHalfLifeMs(): number;
    /**
     * 최근 측정의 중앙값 목표가 크게 바뀔 때 경계 방향과 광선 깊이 방향에서
     * 한 번의 필터 계산에 허용할 최대 world 거리(m)를 변경한다.
     * 제한된 목표에는 지면 결과 반감기 EMA가 다시 적용되므로 실제 3차원 표시점의 이동량 상한은 아니다.
     * 작은 값은 큰 진폭을 더 강하게 나눠 반영하지만 실제 변화 추종이 느리고, 큰 값은 더 빠르게 추종한다.
     * 30m보다 큰 값은 보정한 지면점이 현재 camera ray에서 유효한지 검사하는 재투영 허용거리에도 사용된다.
     * 0이면 접촉 위치의 거리·시간·중앙값 보정만 건너뛰며 hit/miss 변경 확인 시간은 계속 적용된다.
     * @param {number} terrainIntersectionMaxLagDistance
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setTerrainIntersectionMaxLagDistance(terrainIntersectionMaxLagDistance: number): UFrustumTerrainProjectionHelper;
    /**
     * 현재 지면 교차 결과의 경계/광선 방향별 한 번 보정 목표 제한 거리(m)를 반환한다.
     * @returns {number}
     */
    getTerrainIntersectionMaxLagDistance(): number;
    /**
     * 지면 ray의 hit/miss가 반대로 바뀐 뒤 새 상태로 확정하기까지 유지할 시간(ms)을 변경한다.
     * 0~60000 범위이며 0이면 즉시 전환하고, 값이 클수록 한두 번의 판정 요동은 줄지만 새 영역 출현·소멸이 늦어진다.
     * @param {number} terrainIntersectionHitPersistenceMs
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setTerrainIntersectionHitPersistenceMs(terrainIntersectionHitPersistenceMs: number): UFrustumTerrainProjectionHelper;
    /**
     * 현재 지면 hit/miss 상태 확인 시간(ms)을 반환한다.
     * @returns {number}
     */
    getTerrainIntersectionHitPersistenceMs(): number;
    /**
     * 누적된 지면 광선·경계 이력을 버리고 다음 update를 현재 결과에서 다시 시작한다.
     * 카메라 정보나 지형 데이터 세트를 서비스 코드에서 교체한 직후 수동으로 호출할 수 있다.
     * @returns {UFrustumTerrainProjectionHelper}
     */
    resetTerrainIntersectionStabilization(): UFrustumTerrainProjectionHelper;
    /**
     * 현재 프러스텀 평면으로 외곽선을 갱신하는 메서드입니다.
     * @returns {UFrustumTerrainProjectionHelper}
     */
    update(): UFrustumTerrainProjectionHelper;
    /**
     * helper 선 색상을 변경하는 메서드입니다.
     * @param {import('three').Color|string|number} color
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setColor(color: three.Color | string | number): UFrustumTerrainProjectionHelper;
    /**
     * helper 선 두께를 변경하는 메서드입니다.
     * 유한한 양수가 아닌 값은 무시하고 마지막 정상 두께를 유지합니다.
     * @param {number} lineWidth
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setLineWidth(lineWidth: number): UFrustumTerrainProjectionHelper;
    /**
     * helper 선 투명도를 변경하는 메서드입니다.
     * @param {number} opacity
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setOpacity(opacity: number): UFrustumTerrainProjectionHelper;
    /**
     * terrain stamp fill의 그라데이션 두 번째 색상을 변경한다.
     * texture 옵션이 있으면 shader에서는 texture가 우선되어 gradient가 적용되지 않는다.
     * @param {import('three').Color|string|number|undefined} color
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setGradientColor(color: three.Color | string | number | undefined): UFrustumTerrainProjectionHelper;
    /**
     * terrain stamp fill의 그라데이션 두 번째 색상을 반환한다.
     * @returns {import('three').Color|string|number|undefined}
     */
    getGradientColor(): three.Color | string | number | undefined;
    /**
     * terrain stamp fill의 그라데이션 방향을 변경한다.
     * @param {'vertical'|'horizontal'} direction
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setGradientDirection(direction: "vertical" | "horizontal"): UFrustumTerrainProjectionHelper;
    /**
     * terrain stamp fill의 그라데이션 방향을 반환한다.
     * @returns {'vertical'|'horizontal'|undefined}
     */
    getGradientDirection(): "vertical" | "horizontal" | undefined;
    /**
     * plane fill(비-terrain far plane mesh, terrain stamp) 색상을 변경한다.
     * terrain stamp는 update() 시 fillOptions를 다시 읽어 반영된다.
     * @param {import('three').Color|string|number|undefined} color
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setFillColor(color: three.Color | string | number | undefined): UFrustumTerrainProjectionHelper;
    /**
     * @returns {import('three').Color|string|number|undefined}
     */
    getFillColor(): three.Color | string | number | undefined;
    /**
     * plane fill(비-terrain far plane mesh, terrain stamp) 투명도를 변경한다.
     * @param {number|undefined} opacity
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setFillOpacity(opacity: number | undefined): UFrustumTerrainProjectionHelper;
    /**
     * @returns {number|undefined}
     */
    getFillOpacity(): number | undefined;
    /**
     * 프러스텀 옆면 fill 색상을 변경한다.
     * side mesh가 아직 없고 fill이 enabled면 이 시점에 생성해서 붙인다.
     * color와 opacity가 모두 undefined가 되면 side mesh를 제거한다.
     * @param {import('three').Color|string|number|undefined} color
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setSideColor(color: three.Color | string | number | undefined): UFrustumTerrainProjectionHelper;
    /**
     * @returns {import('three').Color|string|number|undefined}
     */
    getSideColor(): three.Color | string | number | undefined;
    /**
     * 프러스텀 옆면 fill 투명도를 변경한다.
     * side mesh가 아직 없고 fill이 enabled면 이 시점에 생성해서 붙인다.
     * color와 opacity가 모두 undefined가 되면 side mesh를 제거한다.
     * @param {number|undefined} opacity
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setSideOpacity(opacity: number | undefined): UFrustumTerrainProjectionHelper;
    /**
     * @returns {number|undefined}
     */
    getSideOpacity(): number | undefined;
    /**
     * helper 전체 표시 상태를 변경한다.
     * false이면 외곽선, side/fill mesh, projection line, terrain stamp fill/mask를 모두 끈다.
     * @param {boolean} visible
     * @returns {UFrustumTerrainProjectionHelper}
     */
    setVisible(visible: boolean): UFrustumTerrainProjectionHelper;
    /**
     * setVisible()로 설정한 helper 전체 표시 상태를 반환한다.
     * @returns {boolean}
     */
    getVisible(): boolean;
    /**
     * 지형 투영 모드에서 현재 지형에 그려진 far 평면(지형 채움 stamp와 지형 외곽선 stamp)을 JSON으로 저장할 수 있는 스냅샷으로 반환합니다.
     * 좌표는 월드 좌표(EPSG:3857)이므로 helper의 위치나 프러스텀 없이도 load()로 같은 자리에 되살릴 수 있습니다.
     * 반환값은 JSON.stringify()로 그대로 문자열이 되며, load()는 그 객체와 문자열을 모두 받습니다.
     * UFrustumHelper의 save()와 같은 형식이므로 두 helper가 저장한 스냅샷을 서로 불러올 수 있습니다.
     * 지형 투영 모드(생성 옵션 terrain이 true)가 아니거나 지금 지형에 그려진 stamp가 없으면 안내 메시지를 남기고 undefined를 반환합니다.
     * load()로 불러온 스냅샷 stamp는 저장 대상이 아니며 현재 프러스텀이 만든 stamp만 담습니다.
     *
     * @param {UFrustumHelperSaveOption} [options={}] 저장 범위를 정하는 옵션
     * @returns {UFrustumHelperTerrainStampSnapshot|undefined} 현재 지형 투영면 스냅샷이며, 저장할 수 없으면 undefined입니다.
     */
    save(options?: UFrustumHelperSaveOption): UFrustumHelperTerrainStampSnapshot | undefined;
    /**
     * save()가 돌려준 스냅샷(객체 또는 JSON 문자열)을 읽어 저장 당시의 지형 투영면을 지형 위에 다시 그립니다.
     * 불러온 stamp는 현재 프러스텀이 만드는 stamp와 별도의 스냅샷 묶음으로 보관되므로 프러스텀이 움직여 update()가 실행되어도 바뀌거나 사라지지 않고, OOR·컬링 판정에도 영향을 받지 않습니다.
     * 저장된 색·불투명도 등 표현 값이 그대로 재현되며 setColor()·setFillColor() 같은 helper의 표현 설정 메서드는 불러온 stamp에 적용되지 않습니다. 다른 표현으로 보이게 하려면 options.styleOverride를 사용하십시오.
     * setVisible(false)이면 함께 숨겨지고 dispose()로 함께 해제되며, clearLoadedTerrainStamps()로 따로 지울 수 있습니다.
     * helper가 장면에서 빠지거나 렌더가 멈춰 stamp를 app에서 분리하는 동안에는 불러온 stamp도 함께 분리되고, 렌더가 재개되면 다시 연결됩니다.
     * 기본은 이전에 불러온 스냅샷을 지우고 교체하며, options.append가 true이면 누적합니다.
     * 지형 투영 모드(생성 옵션 terrain이 true)가 아니거나, drawArg가 없어 stamp를 등록할 app을 알 수 없거나, 스냅샷 형식이 맞지 않으면 오류 메시지를 남기고 false를 반환합니다.
     * 일부 stamp만 값이 올바르지 않으면 그 stamp만 건너뛰고 나머지를 복원합니다.
     *
     * @param {UFrustumHelperTerrainStampSnapshot|string} snapshot save()가 돌려준 스냅샷 객체 또는 그것을 JSON.stringify()한 문자열
     * @param {UFrustumHelperLoadOption} [options={}] 복원 방식을 정하는 옵션
     * @returns {boolean} stamp가 하나 이상 복원되었으면 true, 아무 것도 복원하지 못했으면 false
     */
    load(snapshot: UFrustumHelperTerrainStampSnapshot | string, options?: UFrustumHelperLoadOption): boolean;
    /**
     * load()로 불러온 지형 투영면 stamp를 모두 지형에서 제거하고 해제합니다.
     * 현재 프러스텀이 만드는 stamp에는 영향을 주지 않습니다.
     *
     * @returns {UFrustumTerrainProjectionHelper} 스냅샷 stamp가 비워진 현재 helper
     */
    clearLoadedTerrainStamps(): UFrustumTerrainProjectionHelper;
    /**
     * load()로 불러와 현재 보관 중인 지형 투영면 stamp 목록을 복사해 반환합니다.
     * 배열은 복사본이지만 요소는 실제 stamp이므로 개별 stamp의 표현을 직접 바꿀 수 있습니다. 배열에서 빼거나 dispose()해도 helper의 보관 목록은 바뀌지 않으므로 지우려면 clearLoadedTerrainStamps()를 사용하십시오.
     *
     * @returns {Array<import('@union3d/helpers/UTerrainStamp').UTerrainStamp>} 불러온 stamp 목록의 복사본이며, 불러온 것이 없으면 빈 배열입니다.
     */
    getLoadedTerrainStamps(): Array<UTerrainStamp>;
    #private;
}

export type { UFrustumTerrainProjectionHelper, UFrustumTerrainProjectionHelperCO, UFrustumTerrainProjectionHelperCO_Content, UFrustumTerrainProjectionHelper_Fill_Content, UFrustumTerrainProjectionHelper_ProjectionLine_Content };
