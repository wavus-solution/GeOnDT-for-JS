// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { WorldPosition } from "../types/global.types.js";

/**
     * `UParticleEngine.setValues`와 `setWindValues`에 넘기는 파티클 옵션입니다. <br>
     * 생략한 속성은 각 setter의 기본값을 쓰고, `position`이 없으면 setter가 아무 것도 하지 않습니다. 두 setter의 기본값이 다른 속성은 설명에 둘을 함께 적었습니다. <br>
     * `(setValues 전용)`·`(setWindValues 전용)` 표시가 있는 속성은 다른 setter에서는 읽지 않습니다.
     */
    type UParticleEngineParam = {
        /**
         * 파티클 생성 기준 위치. 월드 좌표(EPSG:3857). 없으면 setter가 아무 것도 하지 않습니다
         */
        position?: WorldPosition;
        /**
         * 생성 위치 범위. setValues 기본 `{x: 100, y: 100, z: 1}`, setWindValues 기본 `{x: 0, y: 0, z: 0}`
         */
        positionSpread?: three.Vector3Like;
        /**
         * 생성 형태. CUBE 1, SPHERE 2, WIND 3, GRID 4 (setValues 전용)
         */
        positionStyle?: number;
        /**
         * SPHERE 형태일 때 생성 반경 (setValues 전용)
         */
        positionRadius?: number;
        /**
         * 초기 속도와 방향. setValues 기본 `{x: 0, y: 0, z: 120}`, setWindValues 기본 `{x: 0, y: 0, z: 0}`
         */
        velocityBase?: three.Vector3Like;
        /**
         * 초기 속도 범위. setValues 기본 `{x: 100, y: 100, z: 20}`, setWindValues 기본 `{x: 0, y: 0, z: 0}`
         */
        velocitySpread?: three.Vector3Like;
        /**
         * 초기 가속도. setValues 기본 `{x: 50, y: 100, z: 100}`, setWindValues 기본 `{x: 0, y: 0, z: 0}`
         */
        acceleration?: three.Vector3Like;
        /**
         * 파티클 텍스처 이미지 URL. 기본은 setValues가 구름 이미지, setWindValues가 원 이미지
         */
        particleImage?: string;
        /**
         * 초기 회전각
         */
        angleBase?: number;
        /**
         * 초기 회전각 범위. setValues 기본 180, setWindValues 기본 0
         */
        angleSpread?: number;
        /**
         * 초당 회전각
         */
        angleVelocityBase?: number;
        /**
         * 초당 회전각 범위. setValues 기본 180, setWindValues 기본 0
         */
        angleVelocitySpread?: number;
        /**
         * `[시간 배열, 크기 배열]`. 설정하면 `sizeBase`와 `sizeSpread`는 무시됩니다
         */
        sizeTween?: Array<Array<number>>;
        /**
         * `[시간 배열, 투명도 배열]`. 설정하면 `opacityBase`와 `opacitySpread`는 무시됩니다
         */
        opacityTween?: Array<Array<number>>;
        /**
         * `[시간 배열, [시작 색, 끝 색]]`. 설정하면 `colorBase`와 `colorSpread`는 무시됩니다
         */
        colorTween?: [Array<number>, Array<three.ColorRepresentation>];
        /**
         * 초당 생성 수
         */
        particlesPerSecond?: number;
        /**
         * 파티클 생명 주기(초)
         */
        particleDeathAge?: number;
        /**
         * 방출 종료 시간(초)
         */
        emitterDeathAge?: number;
        /**
         * 초기 크기
         */
        sizeBase?: number;
        /**
         * 초기 크기 범위
         */
        sizeSpread?: number;
        /**
         * 초기 투명도
         */
        opacityBase?: number;
        /**
         * 초기 투명도 범위
         */
        opacitySpread?: number;
        /**
         * 초기 색상(HSL). 기본 `(0, 1, 0.5)`
         */
        colorBase?: three.Vector3;
        /**
         * 초기 색상 범위(HSL). 기본 `(0, 0, 0)`
         */
        colorSpread?: three.Vector3;
        /**
         * 속도
         */
        speed?: number;
        /**
         * 초기 높이
         */
        height?: number;
        /**
         * 효과 적용 여부
         */
        setEffect?: boolean;
        /**
         * 세기 값을 받아 범례 값을 돌려주는 함수
         */
        legend?: (arg0: number) => unknown;
        /**
         * 카메라 추적 여부 (setValues 전용)
         */
        useTraceCamera?: boolean;
        /**
         * 격자 모드. `'grid'`(1) 또는 `'spread'`(2). 기본 spread (setValues 전용)
         */
        gridMode?: string | number;
        /**
         * 격자 박스 최대 높이 (setValues 전용)
         */
        gridBoxMaxHeight?: number;
        /**
         * 격자 메시 최대 높이 (setValues 전용)
         */
        gridMeshMaxHeight?: number;
        /**
         * 생성 영역 `[[minX, minY], [maxX, maxY]]`(경위도). 기본은 엔진에 설정된 영역 (setValues 전용)
         */
        extents?: Array<Array<number>>;
        /**
         * 마스크 레이어 값 검색 방식. `'base'`(1) 또는 `'raycast'`(2). 기본 base (setWindValues 전용)
         */
        maskSearchType?: string | number;
        /**
         * 파티클 동적 높이 설정 여부 (setWindValues 전용)
         */
        setHeight?: boolean;
        /**
         * 카메라 위치 기반 동적 생성 여부 (setWindValues 전용)
         */
        setDynamic?: boolean;
        /**
         * 낮은 가속도로 표출에서 제외된 파티클도 표시할지 여부 (setWindValues 전용)
         */
        forceVisible?: boolean;
    };

export type { UParticleEngineParam };
