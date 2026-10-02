// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * URenderer가 저장하고 화면에 적용하는 후처리(post process) 설정입니다.<br>
     * U3dApp의 setPostOption()과 getPostOption()도 같은 타입을 사용합니다.<br>
     * 모든 항목은 선택 사항이며, 설정을 갱신할 때 생략한 항목은 기존 값을 유지하고 기존 값도 없으면 기본값을 사용합니다.
     */
    type PostProcessParam = {
        /**
         * 후처리 렌더 타깃의 MSAA 요청 샘플 수입니다.<br>
         * 0 이상의 안전한 정수만 허용하며 0이면 MSAA를 비활성화합니다.<br>
         * 요청값은 보관하고 실제 적용값은 장치의 MSAA 상한으로 제한합니다. 변경은 다음 후처리 렌더 시작 시 반영됩니다.
         */
        composerSamples?: number;
        /**
         * 화면 전체에서 밝은 부분과 어두운 부분의 차이를 조절하는 배율입니다.<br>
         * 1이면 원본 그대로이고 1보다 크면 차이가 커져 또렷해지며 1보다 작으면 차이가 줄어 평탄해집니다.
         */
        contrast?: number;
        /**
         * 화면 전체의 밝기에 곱하는 배율입니다.<br>
         * 1이면 원본 그대로이고 1보다 크면 밝아지며 1보다 작으면 어두워집니다.
         */
        brightness?: number;
        /**
         * 주변광 차폐(ambient occlusion)를 적용할지 여부입니다.<br>
         * 켜면 객체가 맞닿는 부분과 좁은 틈을 어둡게 그려 입체감이 살아나고 연산량이 늘어납니다.<br>
         * 기본값은 기기 성능 판정값에 따라 결정됩니다.
         */
        useAO?: boolean;
        /**
         * 계단 현상 완화(FXAA)가 참고할 해상도에 곱하는 배율입니다.<br>
         * 값이 클수록 경계를 덜 흐리게 다듬으며, 설정 변경은 다음 화면 크기 갱신 시 반영됩니다.
         */
        fxaaSharpness?: number;
        /**
         * 빛 번짐(bloom)을 적용할지 여부입니다.<br>
         * 켜면 밝은 영역 둘레로 빛이 번져 태양이나 발광 객체가 강조되고 연산량이 늘어납니다.<br>
         * 기본값은 기기 성능 판정값에 따라 결정됩니다.
         */
        useBloom?: boolean;
        /**
         * 빛 번짐의 세기이며 값이 클수록 번짐이 강해집니다.<br>
         * useBloom이 false이면 화면에 나타나지 않습니다.
         */
        bloomStrength?: number;
        /**
         * 색 띠 완화(dither)를 적용할지 여부입니다.<br>
         * 켜면 색이 완만하게 변하는 영역에 미세한 잡티를 섞어 색 경계가 띠처럼 뭉쳐 보이는 현상을 줄입니다.
         */
        useDither?: boolean;
    };

export type { PostProcessParam };
