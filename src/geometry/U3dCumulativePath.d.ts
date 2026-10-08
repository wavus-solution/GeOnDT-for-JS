// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { MeshPhongMaterial, BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { USimpleTail, USimpleTailDrawNode, USimpleTailDrawResult, USimpleTailFadeOutCallback, USimpleTailPointMetadata, USimpleTail_Policy } from "../effect/USimpleTail.js";
import type { WorldPosition, WorldPositionVector3 } from "../types/global.js";

/**
 * 이동체가 지나온 위치를 누적하여 3D `궤적`으로 그리는 경로 생성 클래스입니다.<br>
 * 위치를 추가하면 경로가 이어지며 색상, 너비, 투명도, 그라데이션, 스무딩을 설정할 수 있습니다.<br>
 * 생성 직후에는 보이지 않으며 show를 호출하면 이전에 추가한 위치도 함께 표시합니다.
 *
 * @group geometry
 */
declare class U3dCumulativePath {
    /** @type {Set<U3dCumulativePath>} */
    static "__#34@#drawPaths": Set<U3dCumulativePath>;
    /** @type {number | undefined} */
    static "__#34@#drawFrame": number | undefined;
    static "__#34@#tickDraw"(): void;
    static "__#34@#scheduleDraw"(): void;
    /** @param {U3dCumulativePath} path @param {boolean} enabled */
    static "__#34@#watchDraw"(path: U3dCumulativePath, enabled: boolean): void;
    /**
     * @param {U3dCumulativePathStyleFunc | null | undefined} value
     * @returns {U3dCumulativePathStyleFunc | null | undefined}
     * @ignore
     */
    static validateStyleFunc(value: U3dCumulativePathStyleFunc | null | undefined): U3dCumulativePathStyleFunc | null | undefined;
    /**
     * @param {USimpleTail_Policy | undefined} previous
     * @param {USimpleTail_Policy} patch
     * @returns {USimpleTail_Policy}
     * @ignore
     */
    static mergeTailPolicy(previous: USimpleTail_Policy | undefined, patch: USimpleTail_Policy): USimpleTail_Policy;
    /**
     * U3dCumulativePath 클래스 생성자입니다.<br>
     * app과 scene은 필수이며 둘 중 하나가 없으면 오류를 보고합니다.
     *
     * @param {U3dCumulativePathCO} opt 앱, 장면, 경로 스타일, 대상 이름을 지정하는 생성 옵션
     */
    constructor(opt: U3dCumulativePathCO);
    /**
     * 외부에서 경로의 자동 표시 여부를 보관할 때 사용할 값입니다.<br>
     * 이 값은 표시 상태를 바꾸지 않으므로 show 또는 hide를 호출하십시오.
     *
     * @type {boolean}
     */
    isAutoVisible: boolean;
    /**
     * 최근 도착 waypoint 100개의 좌표·도착 시각 복사본입니다. 오래된 순서입니다.
     * 렌더 노드 단순화·draw 정책과 독립적으로 보관하며 removePath/dispose 시 비웁니다.
     * @returns {Array<WaypointRecord>}
     */
    get waypointHistory(): Array<WaypointRecord>;
    /**
     * moveSmoothly의 실제 도착 지점을 기록합니다. 경로 표시 여부와 무관합니다.
     * @param {{x:number, y:number, z:number}} point 도착 월드 좌표
     * @param {number} [time=Date.now()] 도착 epoch 시각(ms)
     */
    recordWaypoint(point: {
        x: number;
        y: number;
        z: number;
    }, time?: number): void;
    /**
     * 다음 경로 일괄 추가 전에 기존 경로를 지워야 하는지 반환합니다.
     *
     * @returns {boolean | undefined} 기존 경로를 지워야 하면 true, 아직 판단하지 않았으면 undefined
     */
    get needUpdate(): boolean | undefined;
    /**
     * 마지막으로 경로에 추가된 지점을 반환합니다.<br>
     * 반환 객체는 다음 갱신 때 바뀔 수 있으므로 보관하려면 clone하십시오.
     *
     * @returns {import('three').Vector3 | undefined} drawOffset과 positionOffset을 적용한 마지막 지점 또는 아직 지점이 없을 때 undefined
     */
    get lastUpdatePoint(): three.Vector3 | undefined;
    /**
     * 경로가 현재 화면에 표시되는지 반환합니다.
     *
     * @returns {boolean} 화면에 표시되면 true
     */
    get visible(): boolean;
    /**
     * 마지막으로 추가한 지점까지의 누적 거리를 반환합니다.
     *
     * @returns {number} 경로에 기록된 마지막 지점까지 자체 계산한 누적 거리(m)
     */
    get pathDistance(): number;
    /**
     * 생성할 때 지정한 대상 이름을 반환합니다.
     *
     * @returns {string} 대상 이름 또는 생성 시 지정하지 않았을 때 빈 문자열
     */
    get targetName(): string;
    /**
     * 경로를 그리는 궤적 인스턴스를 반환합니다.<br>
     * getTail과 같은 값을 반환합니다.
     *
     * @deprecated `getTail`을 사용합니다.
     *
     * @returns {import('@union3d/effect/USimpleTail').USimpleTail | undefined} 궤적 인스턴스 또는 아직 준비되지 않았을 때 undefined
     */
    getPath(): USimpleTail | undefined;
    /**
     * 경로를 그리는 궤적 인스턴스를 반환합니다.
     *
     * @returns {import('@union3d/effect/USimpleTail').USimpleTail | undefined} 궤적 인스턴스 또는 아직 준비되지 않았을 때 undefined
     */
    getTail(): USimpleTail | undefined;
    /**
     * 보관 중인 노드를 오래된 순서로 drawFunc(info)와 같은 구조로 조회합니다.<br>
     * 숨긴 노드는 포함하고 제거·단순화된 노드는 제외합니다. 콜백 평가나 렌더링 갱신은 하지 않습니다.<br>
     * 좌표와 이전 노드 정보는 복사본이며, now와 전체 시간·거리는 조회 시점 기준입니다.
     * waypointHistory는 조회 시점의 도착 이력을 접근할 때마다 복사합니다.
     * @returns {Array<U3dCumulativePathDrawInfo>} 미초기화·해제 후에는 빈 배열
     */
    getNodes(): Array<U3dCumulativePathDrawInfo>;
    /**
     * 궤적의 지점 단순화, 용량, 페이드 방식을 설정합니다.<br>
     * 지정하지 않은 항목은 현재 정책을 유지합니다.
     *
     * @param {USimpleTail_Policy} opt 단순화, 지점 용량, 페이드 방식을 지정하는 정책
     */
    setTailPolicy(opt: USimpleTail_Policy): void;
    /**
     * 기본값과 입력값 정규화가 반영된 현재 궤적 정책의 복사본을 반환합니다.
     * 반환 객체를 변경해도 내부 정책은 바뀌지 않습니다. 변경은 setTailPolicy를 사용합니다.
     * 콜백은 등록된 함수 참조를 그대로 반환합니다.
     * @returns {USimpleTail_Policy} 현재 궤적 정책
     */
    getTailPolicy(): USimpleTail_Policy;
    /**
     * GPU 기준 시간을 갱신하고, drawFunc가 있으면 노드를 평가합니다.
     * @param {{now?: number, totalTime?: number | null}} [context] 평가 시간. totalTime은 null로 최신 입력 기준 복귀
     */
    updateDraw(context?: {
        now?: number;
        totalTime?: number | null;
    }): void;
    /**
     * 노드별 제어 콜백을 교체합니다. null이면 CPU 평가를 해제합니다.
     * @param {U3dCumulativePathDrawFunc | null} drawFunc
     */
    setDrawFunc(drawFunc: U3dCumulativePathDrawFunc | null): void;
    /**
     * 경로 스타일을 한 번에 변경합니다.<br>
     * 지정한 스타일 항목만 반영하고 나머지는 유지합니다.
     *
     * @param {U3dCumulativePath_StyleOpt} opt 변경할 색상, 너비, 그라데이션, 스무딩, 오프셋, 정책
     */
    setPathStyle(opt: U3dCumulativePath_StyleOpt): void;
    /**
     * 경로 굵기를 설정합니다.
     *
     * @param {number} width 적용할 경로 굵기
     */
    setWidth(width: number): void;
    /**
     * 경로 색상을 설정합니다.
     *
     * @param {import('three').ColorRepresentation} color 적용할 Three.js 색상 표현
     */
    setColor(color: three.ColorRepresentation): void;
    /**
     * 경로 불투명도를 설정합니다.
     *
     * @param {number} opacity 0~1 사이의 불투명도이며 범위 밖 값은 적용하지 않음
     */
    setOpacity(opacity: number): void;
    /**
     * 기록된 지점의 colorFactor를 색 농도에 적용할지 설정합니다.
     * @param {boolean} colorGradation true면 styleFunc 또는 기본 높이 기반 색 농도를 적용
     */
    setGradation(colorGradation: boolean): void;
    /**
     * 지점 기록 시 색 농도를 반환하는 함수를 등록합니다. 등록 시에는 실행하지 않습니다.
     * null 또는 undefined는 기본 높이 기반 계산으로 복원합니다.
     * @param {U3dCumulativePathStyleFunc | null | undefined} styleFunc
     */
    setStyleFunc(styleFunc: U3dCumulativePathStyleFunc | null | undefined): void;
    /**
     * 이후 추가할 경로 지점을 진행 방향 기준으로 앞뒤로 옮기는 오프셋을 설정합니다.<br>
     * 양수면 경로가 진행 방향 앞쪽에 표시됩니다.<br>
     * 음수면 경로가 진행 방향 뒤쪽에 표시됩니다.
     *
     * @param {number} offset 지점을 진행 방향으로 옮길 거리
     */
    setPathOffset(offset: number): void;
    /**
     * 이후 추가할 경로 지점을 컴포넌트의 로컬 x, y, z축으로 옮기는 오프셋을 설정합니다.<br>
     * 컴포넌트가 회전하면 보정 방향도 함께 회전합니다.
     *
     * @param {import('three').Vector3 | {x:number, y:number, z:number} | undefined} offset 컴포넌트 로컬 좌표축 기준 보정값. undefined이면 (0, 0, 0)
     */
    setPositionOffset(offset: three.Vector3 | {
        x: number;
        y: number;
        z: number;
    } | undefined): void;
    /**
     * positionOffset의 로컬축을 월드축으로 변환할 기본 회전을 설정합니다.<br>
     * updatePath 또는 초기 지점에 회전값을 지정하면 해당 값이 우선합니다.
     *
     * @param {import('three').QuaternionLike | undefined} quaternion 컴포넌트의 회전. undefined이면 단위 회전
     */
    setPositionOffsetQuaternion(quaternion: three.QuaternionLike | undefined): void;
    /**
     * 경로 지점 사이의 급격한 꺾임을 완화할 스무딩을 설정합니다.
     *
     * @param {boolean} enable true면 스무딩을 적용할지 여부
     * @param {number} factor 0 초과 1 이하의 스무딩 비율이며 범위 밖 값은 현재 값을 유지함
     * @param {number} maxDistance 스무딩을 적용할 최대 지점 간 거리이며 음수 또는 비수치는 현재 값을 유지함
     */
    setSmooth(enable: boolean, factor: number, maxDistance: number): void;
    /**
     * 경로를 화면에서 지우고 그리기 자원을 해제합니다.<br>
     * 이후 updatePath로 지점을 추가해도 다시 표시되지 않으므로 계속 사용하려면 새 인스턴스를 만드십시오.
     */
    removePath(): void;
    /**
     * 누적 경로 인스턴스와 관련 자원을 해제합니다.<br>
     * 호출 뒤 이 객체는 다시 사용할 수 없습니다.
     */
    dispose(): void;
    /**
     * 현재 위치를 경로 끝에 추가합니다.<br>
     * 숨김 여부와 관계없이 경로를 갱신하고 단순화·GPU 표시 설정을 적용합니다.<br>
     * 별도 원본 입력 대기열은 만들지 않습니다.<br>
     * drawOffset이 0이 아니면 첫 지점은 진행 방향을 알 수 있는 다음 이동점이 올 때 함께 추가합니다.<br>
     * `pos`는 복사해 사용하므로 호출 뒤 같은 객체를 재사용할 수 있습니다.
     *
     * @param {WorldPosition} pos 추가할 지점이며 x, y, z가 모두 있어야 함
     * @param {number} [time=Date.now()] 노드 기록 시각(epoch ms). 실시간 호출은 생략하며 경로에서 생성합니다. 이력 입력은 명시할 수 있습니다.
     * @param {import('three').QuaternionLike} [orientation] positionOffset을 월드축으로 변환할 컴포넌트 회전
     */
    updatePath(pos: WorldPosition, time?: number, orientation?: three.QuaternionLike): void;
    /**
     * 위치 데이터 배열의 지점을 경로 끝에 한 번에 추가합니다.<br>
     * 생성 직후의 초기 경로는 생성 옵션 initPositions로 지정하십시오.<br>
     * 유효한 입력 지점을 모두 전달하며 지점 축소는 tailPolicy의 단순화·GPU 표시 설정에 따릅니다.<br>
     * 자원 생성을 지연한 경우에도 호출 시 초기 경로를 먼저 반영한 뒤 입력을 추가합니다.<br>
     * drawOffset이 0이 아니고 입력 지점이 모두 같은 위치이면 첫 이동점이 올 때 시작점을 추가합니다.<br>
     * 기존 경로 뒤에 지점을 추가합니다.<br>
     * `hide`후 첫 호출에서는 기존 경로를 지우고 새 경로로 표시됩니다.
     *
     * @param {Array<U3dCumulativePathPositionData>} positions 순서대로 경로에 추가할 지점 목록
     */
    createTrailFromPositions(positions: Array<U3dCumulativePathPositionData>): void;
    /**
     * 경로를 화면에 표시합니다.<br>
     * GPU 기준값을 갱신하고 메시를 장면에 추가합니다.
     */
    show(): void;
    /**
     * 경로를 화면에서 숨깁니다.<br>
     * 숨긴 동안에도 `updatePath`의 경로 갱신·단순화·draw 정책은 계속 적용됩니다.<br>
     * 다시 표시할 때 최신 시간·거리 기준으로 GPU 효과를 적용합니다.<br>
     * 다음 `createTrailFromPositions` 호출은 기존 경로를 지우고 새 경로로 표시됩니다.
     */
    hide(): void;
    /**
     * 경로 위 지점을 선택할 때 사용할 보조 메시를 반환합니다.
     *
     * @param {boolean} [update=true] 반환 전에 보조 메시를 현재 경로로 갱신할지 여부
     * @returns {import('three').InstancedMesh | undefined} 이 클래스가 관리하는 선택용 보조 메시 또는 경로가 없을 때 undefined
     */
    getHelperMesh(update?: boolean): three.InstancedMesh | undefined;
    #private;
}

/**
     * 노드별 표시·부분 구간·fade·폐기 정책. this는 U3dCumulativePath입니다.
     * 숨긴 노드도 평가하며 예외 시 이전 결정을 유지합니다. 입력 객체를 변경해도 내부 노드는 바뀌지 않습니다.
     */
    type U3dCumulativePathDrawFunc = (this: U3dCumulativePath, info: U3dCumulativePathDrawInfo) => USimpleTailDrawResult | void;

/**
     * 노드 식별자와 기록 시각은 USimpleTailDrawNode 선언을 공유합니다.
     * position/dist는 공개 조회 API의 이름이며 내부 x·y·z/pathDistance에서 변환합니다.
     */
    type U3dCumulativePathDrawInfo_Content = {
        /**
         * 보정 후 월드 좌표
         */
        position: Pick<USimpleTailDrawNode, "x" | "y" | "z">;
        /**
         * 경로 시작부터 누적 거리(m)
         */
        dist: USimpleTailDrawNode["pathDistance"];
        /**
         * 평가 경로 시간(ms). 기본 최신 입력 시간
         */
        totalTime: number;
        /**
         * 최신 입력까지 전체 누적 경로 거리(m). totalDist - dist가 이 노드부터 최신 입력까지의 거리입니다.
         */
        totalDist: number;
        /**
         * 평가 epoch 시각(ms)
         */
        now: number;
        /**
         * 직전 연결 노드. 첫 노드·단절 뒤에는 null
         */
        previous: Pick<U3dCumulativePathDrawInfo, "nodeId" | "position" | "time"> | null;
        /**
         * 별도 도착 이력의 복사본. 접근할 때 복사합니다.
         */
        waypointHistory: Array<WaypointRecord>;
    };

/**
     * 노드 식별자와 기록 시각은 USimpleTailDrawNode 선언을 공유합니다.
     * position/dist는 공개 조회 API의 이름이며 내부 x·y·z/pathDistance에서 변환합니다.
     */
    type U3dCumulativePathDrawInfo = Pick<USimpleTailDrawNode, "nodeId" | "time"> & U3dCumulativePathDrawInfo_Content;

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
     * colorGradation이 true일 때 지점 기록 시 색 농도를 계산합니다. this는 현재 경로입니다.
     * 등록하거나 렌더링할 때 기존 노드 전체를 재평가하지 않습니다.
     */
    type U3dCumulativePathStyleFunc = (this: U3dCumulativePath, position: three.Vector3, dist: number, time: number) => number;

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
         * 경로 반폭(px). 직선의 전체 폭은 약 2배이며, 폭 fade가 적용되면 줄어듭니다 <br>
         */
        width?: number;
        /**
         * true면 지점 기록 시 styleFunc 또는 기본 높이 기반 색 농도를 적용합니다 <br>
         */
        colorGradation?: boolean;
        /**
         * 지점별 colorFactor(0~1)를 반환하는 함수. colorGradation이 true일 때 적용하며 null은 기본 높이 계산 사용
         */
        styleFunc?: U3dCumulativePathStyleFunc | null;
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
         * tailPolicy.onFadeOut과 같은 제한 경계 콜백. null로 해제합니다. <br>
         */
        onFadeOut?: USimpleTailFadeOutCallback | null;
        /**
         * 노드별 CPU 제어 콜백. 지정한 경로만 매 프레임 순회하며 null로 해제. styleFunc와 함께 사용 가능
         */
        drawFunc?: U3dCumulativePathDrawFunc | null;
        /**
         * 궤적의 단순화·확보 지점 수·페이드 정책 <br>
         */
        tailPolicy?: USimpleTail_Policy;
    };

/**
     * 경로 지점 하나의 위치·거리·시각 묶음입니다. <br>
     * 생성 옵션 `initPositions`와 `createTrailFromPositions`의 입력으로 사용합니다. <br>
     */
    type U3dCumulativePathPositionData_Content = {
        /**
         * 그 지점의 위경도 좌표 (EPSG:4326). `initPositions`·`createTrailFromPositions`로 넘기면 월드 좌표로 변환되어 그려지므로 직접 변환하지 않습니다 <br>
         */
        position: three.Vector3 | {
            x: number;
            y: number;
            z: number;
        };
        /**
         * 해당 지점에서 컴포넌트 로컬축을 월드축으로 변환할 회전값 <br>
         */
        orientation?: three.QuaternionLike;
    };

/**
     * 경로 지점 하나의 위치·거리·시각 묶음입니다. <br>
     * 생성 옵션 `initPositions`와 `createTrailFromPositions`의 입력으로 사용합니다. <br>
     */
    type U3dCumulativePathPositionData = USimpleTailPointMetadata & U3dCumulativePathPositionData_Content;

/**
     * U3dCumulativePath 생성자 옵션 <br>
     */
    type U3dCumulativePathCO = {
        /**
         * 노드별 CPU 제어 콜백. pathStyle.drawFunc보다 우선합니다.
         */
        drawFunc?: U3dCumulativePathDrawFunc | null;
        /**
         * 첫 show, updatePath 또는 비어 있지 않은 createTrailFromPositions 호출까지 경로 자원 생성을 지연합니다. recordWaypoint만 호출하면 자원을 생성하지 않습니다.
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
         * 초기 경로 지점 목록. 지연 초기화 시 자원 생성 때 반영하며, 처리 후 원본 배열 참조를 해제합니다. 입력 배열 자체는 변경하지 않습니다. <br>
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

export type { U3dCumulativePath, U3dCumulativePathCO, U3dCumulativePathDrawFunc, U3dCumulativePathDrawInfo, U3dCumulativePathDrawInfo_Content, U3dCumulativePathPositionData, U3dCumulativePathPositionData_Content, U3dCumulativePathStyleFunc, U3dCumulativePath_StyleOpt, WaypointRecord };
