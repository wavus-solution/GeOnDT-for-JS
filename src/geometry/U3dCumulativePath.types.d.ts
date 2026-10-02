// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { USimpleTail_Policy } from "../effect/USimpleTail.types.js";
import type { WorldPositionVector3 } from "../types/global.types.js";

/**
     * `moveSmoothly`로 실제 도착한 지점 한 건의 이력 기록
     */
    type WaypointRecord = {
        /**
         * 도착한 월드 좌표 (EPSG:3857, m)
         */
        point: WorldPositionVector3;
        /**
         * 도착 시각 (`Date.now()` 기준 epoch ms)
         */
        time: number;
    };

/**
     * 출력 범위의 경로 지점별로 호출되는 fade 함수. 일괄 입력은 마지막에, 숨긴 경로는 show 시 평가합니다. this는 U3dCumulativePath입니다.
     * 숫자 0~1은 폭과 불투명도에 함께 적용됩니다(0: 숨김, 1: 유지).
     * {width, alpha}로 각각 지정할 수 있습니다. 생략/비정상 값은 1, 범위 밖 값은 0~1로 제한합니다.
     * 노드 사이 값은 보간됩니다. 0을 반환해도 이력을 삭제하지 않습니다.
     */
    type U3dCumulativePathFadeFunc = (info: U3dCumulativePathFadeInfo) => number | {
        width?: number;
        alpha?: number;
    };

type U3dCumulativePathFadeInfo = {
        /**
         * 보정 후 월드 좌표
         */
        position: {
            x: number;
            y: number;
            z: number;
        };
        /**
         * 경로가 자체 계산한 누적 거리(m)
         */
        dist: number;
        /**
         * 입력 누적 시간(ms). epoch 시각이 아닐 수 있습니다.
         */
        time: number;
        /**
         * 이력에 추가된 epoch 시각(ms)
         */
        recordedAt: number;
        /**
         * 최신 지점까지 실제 경로 거리(m)
         */
        distance: number;
        /**
         * 최신 지점의 time과 해당 지점 time의 차이(ms)
         */
        elapsedTime: number;
        /**
         * 현재 시각에서 recordedAt까지 지난 시간(ms)
         */
        ageMs: number;
        /**
         * 평가 기준 epoch 시각(ms)
         */
        now: number;
        /**
         * 경로가 소유한 최근 도착 waypoint 이력의 복사본. 접근할 때 복사합니다.
         */
        waypointHistory: Array<WaypointRecord>;
    };

/**
     * 경로의 각 지점에서 색을 얼마나 진하게 칠할지 정하는 콜백입니다. <br>
     * `setStyleFunc`이나 스타일 옵션의 `styleFunc`으로 등록하며, 등록하면 기본 그라데이션 대신 이 함수의 결과를 사용합니다. <br>
     * 호출 시 `this`는 경로 인스턴스(`U3dCumulativePath`)입니다. <br>
     */
    type U3dCumulativePathStyleFunc = (pos: three.Vector3, dist: number, time: number) => number;

/**
     * 경로를 그리는 방식을 정하는 스타일 옵션입니다. <br>
     * 생성 옵션 `pathStyle`과 `setPathStyle`의 입력으로 사용합니다. <br>
     */
    type U3dCumulativePath_StyleOpt = {
        /**
         * 경로 표현 방식. `'tail'`은 화면 폭 기준 리본 궤적입니다. <br>
         * `'pipe'`는 구현되지 않은 제거 예정(deprecated) 값으로, 넣으면 경로가 그려지지 않습니다 <br>
         */
        type?: "tail" | "pipe";
        /**
         * 제거 예정(deprecated) 옵션. 현재 구현에서 읽지 않으며 아무 효과가 없습니다 <br>
         */
        lineType?: string;
        /**
         * 경로 색상. 16진수 숫자, CSS 색 문자열 또는 `THREE.Color`를 넣습니다 <br>
         */
        color?: three.ColorRepresentation;
        /**
         * 불투명도 (0~1). 0은 완전히 투명, 1은 완전히 불투명입니다 <br>
         */
        opacity?: number;
        /**
         * 경로 굵기. 화면 픽셀 기준 값이며, 기본 설정(`depthWidthScale`)에서는 카메라와의 거리에 따라 보정됩니다 <br>
         */
        width?: number;
        /**
         * 지점별 색 농도 그라데이션 사용 여부. 켜면 `styleFunc`(없으면 지점 높이 z 기준의 기본 함수)가 정한 농도로 칠하고, 끄면 단색으로 그립니다 <br>
         */
        colorGradation?: boolean;
        /**
         * 지점별 색 농도를 직접 정하는 함수. 넣으면 `colorGradation`의 기본 계산 대신 이 함수를 씁니다 <br>
         */
        styleFunc?: U3dCumulativePathStyleFunc;
        /**
         * 제거 예정(deprecated) 옵션. 현재 구현에서 읽지 않으며 아무 효과가 없습니다 <br>
         */
        debugPointBox?: boolean;
        /**
         * 실시간 추가 지점과 `initPositions`·`createTrailFromPositions`의 일괄 입력 지점 사이를 부드럽게 이을지 여부 <br>
         */
        smooth?: boolean;
        /**
         * 각 입력 지점을 직전 반영 지점 쪽으로 보간하는 비율 (0 초과 1 이하). 작을수록 직전 지점에 가까워져 더 완만해지고, 1이면 보간하지 않습니다 <br>
         */
        smoothFactor?: number;
        /**
         * 부드럽게 잇기를 적용할 지점 간 최대 거리 (미터). 0이면 거리 제한 없이 적용하고, 이보다 멀리 떨어진 구간은 곧게 잇습니다 <br>
         */
        smoothMaxDistance?: number;
        /**
         * 각 지점을 진행 방향으로 밀어내는 거리 (미터). 양수면 진행 방향 앞, 음수면 뒤로 옮겨 그립니다 <br>
         */
        drawOffset?: number;
        /**
         * 각 지점을 컴포넌트의 로컬 x, y, z축으로 옮기는 보정값 (미터). 기본값은 `{x:0, y:0, z:0}`입니다 <br>
         */
        positionOffset?: three.Vector3 | {
            x: number;
            y: number;
            z: number;
        };
        /**
         * maxDistance 경계가 앞으로 이동해 경로 앞부분이 완전히 투명해질 때 호출되는 콜백 <br>
         */
        onFadeOut?: (arg0: object) => void;
        /**
         * 궤적의 단순화·확보 지점 수·페이드 정책 <br>
         */
        tailPolicy?: USimpleTail_Policy;
    };

/**
     * 경로 지점 하나의 위치·거리·시각 묶음입니다. <br>
     * 생성 옵션 `initPositions`와 `createTrailFromPositions`의 입력으로 사용합니다. <br>
     */
    type U3dCumulativePathPositionData = {
        /**
         * 그 지점의 위경도 좌표 (EPSG:4326). `initPositions`·`createTrailFromPositions`로 넘기면 월드 좌표로 변환되어 그려지므로 직접 변환하지 않습니다 <br>
         */
        position: three.Vector3 | {
            x: number;
            y: number;
            z: number;
        };
        /**
         * 그 지점이 기록된 시각. `styleFunc`에 그대로 전달됩니다 <br>
         */
        time: number;
        /**
         * 이력에 추가된 epoch 시각(ms). 생략하면 경로 입력 시 Date.now()를 저장합니다.
         */
        recordedAt?: number;
        /**
         * 해당 지점에서 컴포넌트 로컬축을 월드축으로 변환할 회전값 <br>
         */
        orientation?: three.QuaternionLike;
    };

/**
     * U3dCumulativePath 생성자 옵션 <br>
     */
    type U3dCumulativePathCO = {
        /**
         * 첫 show 또는 updatePath까지 경로 자원 생성을 지연합니다. recordWaypoint만 호출하면 자원을 생성하지 않습니다.
         */
        initializeTrailOnShow?: boolean;
        /**
         * 경로를 그려 넣을 장면. **필수** <br>
         */
        scene: three.Scene;
        /**
         * 좌표 변환과 렌더링에 사용할 앱. **필수** <br>
         */
        app: U3dApp;
        /**
         * 이 경로가 따라다니는 대상 객체의 이름. 경로를 구분하는 데 사용합니다 <br>
         */
        targetName?: string;
        /**
         * 색상·굵기·그라데이션 등 경로를 그리는 방식 <br>
         */
        pathStyle?: U3dCumulativePath_StyleOpt;
        /**
         * 제거 예정(deprecated) 옵션. 값은 저장되지만 현재 시작 시각 계산에는 사용되지 않습니다 <br>
         */
        initTime?: number;
        /**
         * 만들자마자 그려 둘 지점 목록. 이미 지나온 경로를 한 번에 복원할 때 사용합니다 <br>
         */
        initPositions?: Array<U3dCumulativePathPositionData>;
        /**
         * 각 지점을 진행 방향으로 밀어내는 거리 (미터). 양수면 진행 방향 앞, 음수면 뒤로 옮겨 그립니다. <br>
         * `pathStyle.drawOffset`보다 우선합니다 <br>
         */
        drawOffset?: number;
        /**
         * 각 지점을 컴포넌트의 로컬 x, y, z축으로 옮기는 보정값 (미터). `pathStyle.positionOffset`보다 우선하며 기본값은 `{x:0, y:0, z:0}`입니다 <br>
         */
        positionOffset?: three.Vector3 | {
            x: number;
            y: number;
            z: number;
        };
        /**
         * positionOffset을 월드축으로 변환할 기본 quaternion. 각 지점의 orientation 또는 updatePath의 orientation이 우선합니다 <br>
         */
        positionOffsetQuaternion?: three.QuaternionLike;
        /**
         * 최소 업데이트 거리 (미터). `updatePath`에서 마지막 기록 좌표와의 실제 거리이 이보다 작으면 건너뜁니다 <br>
         */
        precision?: number;
    };

export type { U3dCumulativePathCO, U3dCumulativePathFadeFunc, U3dCumulativePathFadeInfo, U3dCumulativePathPositionData, U3dCumulativePathStyleFunc, U3dCumulativePath_StyleOpt, WaypointRecord };
