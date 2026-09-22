// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * @classdesc
 * `ParticleEngine`의 추체 클래스
 * @summary `ParticleEngine`의 추체 클래스
 * @memberOf GeOnDT.effect
 * @property {WorldPosition} position 위치
 * @property {Vector3} velocity 초기 속도 및 방향 정보
 * @property {Vector3} acceleration 초당 속도 변화 수치
 * @property {number} angle 각도
 * @property {number} angleVelocity 각도 변화 임계값
 * @property {angleAcceleration} angleAcceleration 초당 각도 변화 수치
 * @property {number} size 크기
 * @property {Color} color 색상
 * @property {number} opacity 투명도
 * @property {number} age 나이, 생명주기, 재사용 순환시에 참고하는 속성 값
 * @property {number} alive 생존여부 ( death : 0, alive : 1 ) / boolean 대신 사용하는 이유는 shader에 속성 값으로 사용되므로
 * @property {number} time 오염확산으로 생성시 데이터 기반 시간대별 값의 참고 값
 * @property {number} timeIndex 오염확산으로 생성시 데이터 기반 시간대별 값 순번 값
 * @property {boolean} visible 가시화 여부
 * @property {Object.XTween} sizeTween 시간대별 크기의 값의 정보를 담고 있는 객체
 * @property {Object.XTween} colorTween 시간대별 색상의 값의 정보를 담고 있는 객체
 * @property {Object.XTween} opacityTween 시간대별 투명도의 값의 정보를 담고 있는 객체
 * @constructor
 */
declare class UParticle {
    position: three.Vector3;
    velocity: three.Vector3;
    acceleration: three.Vector3;
    angle: number;
    angleVelocity: number;
    angleAcceleration: number;
    size: number;
    color: three.Color;
    opacity: number;
    age: number;
    alive: number;
    _setMask: boolean;
    time: number;
    distance: number;
    timeIndex: number;
    visible: boolean;
    /**
     * 위치, 가속도, 색상을 갱신하는 함수
     * @param {number} dt clock의 delta
     */
    update(dt: number): void;
}

export type { UParticle };
