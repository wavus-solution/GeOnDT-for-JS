// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * @memberOf GeOnDT.effect
 * @summary `LensFlare` 객체 클래스
 * @param {boolean} [enabled=true] 효과 사용 여부
 * @param {Vector3} [lensPosition] 렌즈 위치
 * @param {number} [opacity=1.0] 투명도
 * @param {Color} [colorGain] colorGain (RGB format)
 * @param {number} [starPoints=0] 별 점의 개수
 * @param {number} [glareSize=0.002] 눈부심 크기
 * @param {number} [flareSize=0.0000002] 플레어 크기
 * @param {number} [flareSpeed=0] 플레어 애니메이션 속도. 0으로 설정시 비활성화
 * @param {number} [flareShape=1] 플레어 모양을 정의하는 설정 값. 숫자가 높을수록 더 날카로워집니다
 * @param {number} [haloScale=0.3] 후광의 스케일
 * @param {boolean} [animated=false] 플레어 회전 애니메이션을 활성화 여부
 * @param {boolean} [anamorphic=false] 아나모픽 플레어 모양을 활성화 여부
 * @param {boolean} [secondaryGhosts=true] 2차 고스트를 활성화 여부
 * @param {boolean} [starBurst=false] 스타 버스트를 활성화하거나 비활성화합니다. 더 나은 성능을 위해 비활성 권장
 * @param {number} [ghostScale=0.25] ghost Scale의 크기
 * @param {boolean} [aditionalStreaks=true] 추가 Streaks 활성화 여부
 * @param {boolean} [followMouse=false] 마우스 추적 여부
 * @constructor
 * @ignore
 */
declare class ULensFlare extends three.Mesh<three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, three.Material<three.MaterialEventMap> | three.Material<three.MaterialEventMap>[], three.Object3DEventMap> {
    constructor(enabled: any, lensPosition: any, opacity: any, colorGain: any, starPoints: any, glareSize: any, flareSize: any, flareSpeed: any, flareShape: any, haloScale: any, animated: any, anamorphic: any, secondaryGhosts: any, starBurst: any, ghostScale: any, aditionalStreaks: any, followMouse: any);
    _isEnvironment: boolean;
    _sunPosition: three.Vector3;
    _lensPosition: three.Vector3;
}

export type { ULensFlare };
