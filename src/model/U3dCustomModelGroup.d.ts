// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UEventDispatcher } from "../core/UEventDispatcher.js";

declare class U3dCustomModelGroup extends UEventDispatcher {
    _id: number;
    _name: any;
    _type: string;
    _modeltype: any;
    _isInitialized: boolean;
    _shape: any;
    _drawArg: any;
    _object: any;
    _position: three.Vector3;
    _boundingBox: any;
    _bbox: any;
    _extrudeHeight: number;
    _zOffset: number;
    _center: any;
    _useBox: any;
    _vertex: any;
    _points: any;
    _style: any;
    _customModels: any[];
    addCustomModel(customModel: any): void;
    getAreaValue(): number;
    /**
     * 해당 모델의 바운딩박스를 가시화하는 함수
     */
    showBox(): void;
    /**
     * 해당 모델의 바운딩박스를 제거하는 함수
     */
    hideBox(): void;
    /**
     * 모델의 스타일을 설정하는 함수
     * @param {object} style 스타일 옵션
     * @param {string} style.color 색상 문자열(RGB 또는 HEX)
     * @param {number} style.metalness 금속성 (높을수록 금속재질 강도 상승)
     * @param {number} style.roughness 표면 거칠기(높을수록 반사광 강도 저하)
     * @param {number} style.opacity 투명도
     * @param {boolean} style.transparent 투명도 설정 여부
     */
    setStyle(style: {
        color: string;
        metalness: number;
        roughness: number;
        opacity: number;
        transparent: boolean;
    }): void;
    setColor(): void;
    setOpacity(): void;
    setPosition(): void;
    /**
     * 모델을 회전시키는 함수
     */
    setRotate(): void;
    /**
     * 모델을 회전시키는 함수
     */
    setScale(): void;
    /**
     * 모델의 Uid 반환 함수
     * @returns {string} uid
     */
    getUid(): string;
    /**
     * 모델의 라벨을 On/Off 하는 함수
     */
    showLabel(): void;
    dispose(): void;
    getParameter(): {
        name: any;
        modeltype: any;
        models: any[];
    };
    /**
     * 모델의 라벨을 설정하는 함수
     */
    setLabelText(): void;
    /**
     * 모델의 이름을 설정하는 함수
     * @param {string} name 모델이름
     */
    setName(name: string): void;
    /**
     * 모델의 라벨 텍스트를 반환하는 함수
     * @returns {string} 라벨 텍스트
     */
    getLabelText(): string;
    /**
     * 모델의 이름을 반환하는 함수
     * @returns {string} 모델의 이름
     */
    getName(): string;
    /**
     * 모델의 높이를 반환하는 함수
     * @returns {number} 모델의 높이
     */
    getHeight(): number;
    /**
     * 모델의 지상높이를 반환하는 함수 <br/>
     * (지상높이는 지면에 붙어있을 경우 0)
     * @returns {number} 모델의 지상높이
     */
    getLandHeight(): number;
    getOpacity(): number;
    getColor(): any;
    show(): void;
    /**
     * 모델의 지상높이를 설정하는 함수 <br/>
     * (지상높이는 지면에 붙어있을 경우 0)
     */
    setLandHeight(): void;
    getBottomShapeVertex(): void;
    getMesh(): void;
}

export type { U3dCustomModelGroup };
