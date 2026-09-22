// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * UCollider 충돌체(collider)를 만들 때 넘기는 옵션입니다.
     *
     * `active`, `groupName`, `groups`는 UCollisionManager의 후보 필터(canCollideWith)에서만 적용됩니다. <br>
     * 매니저 없이 `intersects()`, `computeIntersectionRatio()`, `computeIntersectionDetails()`를 직접 호출하면 순수 기하 판정만 수행하므로 이 값들은 결과에 영향을 주지 않습니다.
     */
    type UColliderCO_Content = {
        /**
         * 초기 위치이며 월드 좌표(EPSG:3857)의 미터 값. 생략 시 target의 월드 좌표(EPSG:3857)를 사용
         */
        position?: three.Vector3Like;
        /**
         * 충돌체가 붙는 대상 객체. position을 생략한 setPosition()이 현재 월드 위치를 읽는 데 쓰이며, 결과에서 대상 객체로 되돌아가는 참조로 사용
         */
        target?: unknown;
        /**
         * 충돌체 식별자. 생략 시 UUID. 한 target에 여러 충돌체를 붙일 때는 서로 다른 id를 지정
         */
        id?: string;
        /**
         * 매니저 조회 참여 여부. false면 UCollisionManager의 getIntersections 계열에서 제외됨. 직접 호출하는 intersects()에는 영향 없음
         */
        active?: boolean;
        /**
         * 이 충돌체가 속한 그룹. 매니저 조회에서 상대의 groups에 포함되어야 후보가 됨
         */
        groupName?: string;
        /**
         * 이 충돌체가 충돌 대상으로 삼는 그룹 목록. 매니저 조회에서 상대 groupName이 여기 포함되거나 상대 groups에 내 groupName이 포함되면 후보가 됨
         */
        groups?: Array<string>;
        /**
         * 임의 사용자 데이터
         */
        userData?: Record<string, unknown>;
    };

/**
     * UCollider 충돌체(collider)를 만들 때 넘기는 옵션입니다.
     *
     * `active`, `groupName`, `groups`는 UCollisionManager의 후보 필터(canCollideWith)에서만 적용됩니다. <br>
     * 매니저 없이 `intersects()`, `computeIntersectionRatio()`, `computeIntersectionDetails()`를 직접 호출하면 순수 기하 판정만 수행하므로 이 값들은 결과에 영향을 주지 않습니다.
     */
    type UColliderCO = UColliderCO_Content;

export type { UColliderCO, UColliderCO_Content };
