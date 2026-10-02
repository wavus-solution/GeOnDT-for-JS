// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * 골격(skeleton)을 보유한 Three.js 객체입니다.
     */
    type SkeletonUtilsSkeletonObject = three.Object3D & {
        skeleton: three.Skeleton;
    };

/**
     * 골격(skeleton)의 자세 대응과 애니메이션 클립(animation clip) 변환 설정입니다.
     */
    type SkeletonUtilsOptions = {
        /**
         * 첫 표본의 골반 위치를 이후 위치에서 차감할지 여부
         */
        useFirstFramePosition?: boolean;
        /**
         * 초당 표본 수. 생략하면 원본 트랙의 최대 표본 수를 클립 길이로 나눈 값
         */
        fps?: number;
        /**
         * 대상 뼈 이름에서 원본 뼈 이름으로의 대응표
         */
        names?: {
            [x: string]: string;
        };
        /**
         * 대응표 대신 대상 뼈에서 원본 뼈 이름을 구하는 함수
         */
        getBoneName?: (arg0: three.Bone) => string;
        /**
         * 추출할 시작 시간과 종료 시간(초)을 담은 두 원소 배열
         */
        trim?: Array<number>;
        /**
         * 대응 계산 중 대상 월드 변환을 제거한 뒤 복원할지 여부
         */
        preserveBoneMatrix?: boolean;
        /**
         * 골반 외 대상 뼈의 기존 위치를 유지할지 여부
         */
        preserveBonePositions?: boolean;
        /**
         * 원본 뼈의 월드 행렬을 대상 기준 변환 없이 사용할지 여부
         */
        useTargetMatrix?: boolean;
        /**
         * 원본 골반 뼈 이름
         */
        hip?: string;
        /**
         * 골반 이동의 축별 적용 비율. 생략하면 (1, 1, 1)
         */
        hipInfluence?: three.Vector3;
        /**
         * 골반 이동과 추가 위치에 적용할 배율
         */
        scale?: number;
        /**
         * 골반 이동에 추가할 위치
         */
        hipPosition?: three.Vector3;
        /**
         * 대상 뼈 이름별로 회전 행렬에 곱할 보정 행렬
         */
        localOffsets?: {
            [x: string]: three.Matrix4;
        };
    };

export type { SkeletonUtilsOptions, SkeletonUtilsSkeletonObject };
