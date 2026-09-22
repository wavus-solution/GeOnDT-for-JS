// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { FullScreenQuad, Pass } from "./Pass.js";

/**
 * A pass for rendering outlines around selected objects.
 *
 * ```js
 * const resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );
 * const outlinePass = new OutlinePass( resolution, scene, camera );
 * composer.addPass( outlinePass );
 * ```
 *
 * @augments Pass
 * @three_import import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
 */
declare class OutlinePass extends Pass {
    /**
     * Constructs a new outline pass.
     *
     * @param {Vector2 | undefined} resolution - The effect's resolution. Defaults to (256, 256).
     * @param {import('three').Scene} scene - The scene to render.
     * @param {import('three').Camera} camera - The camera.
     * @param {Array<import('three').Object3D>} [selectedObjects] - The selected 3D objects that should receive an outline.
     *
     */
    constructor(resolution: Vector2 | undefined, scene: three.Scene, camera: three.Camera, selectedObjects?: Array<three.Object3D>);
    /**
     * The scene to render.
     *
     * @type {Object}
     */
    renderScene: any;
    /**
     * The camera.
     *
     * @type {Object}
     */
    renderCamera: any;
    /**
     * The selected 3D objects that should receive an outline.
     *
     * @type {Array<import('three').Object3D>}
     */
    selectedObjects: Array<three.Object3D>;
    /**
     * The visible edge color.
     *
     * @type {Color}
     * @default (1,1,1)
     */
    visibleEdgeColor: Color;
    /**
     * The hidden edge color.
     *
     * @type {Color}
     * @default (0.1,0.04,0.02)
     */
    hiddenEdgeColor: Color;
    /**
     * Can be used for an animated glow/pulse effect.
     *
     * @type {number}
     * @default 0
     */
    edgeGlow: number;
    /**
     * Whether to use a pattern texture for to highlight selected
     * 3D objects or not.
     *
     * @type {boolean}
     * @default false
     */
    usePatternTexture: boolean;
    /**
     * Can be used to highlight selected 3D objects. Requires to set
     * {@link OutlinePass#usePatternTexture} to `true`.
     *
     * @type {?import('three').Texture}
     * @default null
     */
    patternTexture: three.Texture | null;
    /**
     * The edge thickness.
     *
     * @type {number}
     * @default 1
     */
    edgeThickness: number;
    /**
     * The edge strength.
     *
     * @type {number}
     * @default 3
     */
    edgeStrength: number;
    /**
     * The downsample ratio. The effect can be rendered in a much
     * lower resolution than the beauty pass.
     *
     * @type {number}
     * @default 2
     */
    downSampleRatio: number;
    /**
     * The pulse period.
     *
     * @type {number}
     * @default 0
     */
    pulsePeriod: number;
    _visibilityCache: Map<any, any>;
    _selectionCache: Set<any>;
    /**
     * The effect's resolution.
     *
     * @type {Vector2}
     * @default (256,256)
     */
    resolution: Vector2;
    renderTargetMaskBuffer: WebGLRenderTarget<three.Texture<unknown, three.TextureEventMap>>;
    depthMaterial: MeshDepthMaterial;
    prepareMaskMaterial: ShaderMaterial;
    renderTargetDepthBuffer: WebGLRenderTarget<three.Texture<unknown, three.TextureEventMap>>;
    renderTargetMaskDownSampleBuffer: WebGLRenderTarget<three.Texture<unknown, three.TextureEventMap>>;
    renderTargetBlurBuffer1: WebGLRenderTarget<three.Texture<unknown, three.TextureEventMap>>;
    renderTargetBlurBuffer2: WebGLRenderTarget<three.Texture<unknown, three.TextureEventMap>>;
    edgeDetectionMaterial: ShaderMaterial;
    renderTargetEdgeBuffer1: WebGLRenderTarget<three.Texture<unknown, three.TextureEventMap>>;
    renderTargetEdgeBuffer2: WebGLRenderTarget<three.Texture<unknown, three.TextureEventMap>>;
    separableBlurMaterial1: ShaderMaterial;
    separableBlurMaterial2: ShaderMaterial;
    overlayMaterial: ShaderMaterial;
    copyUniforms: {
        tDiffuse: {
            value: any;
        };
        opacity: {
            value: number;
        };
    };
    materialCopy: ShaderMaterial;
    _oldClearColor: Color;
    oldClearAlpha: number;
    _fsQuad: FullScreenQuad;
    tempPulseColor1: Color;
    tempPulseColor2: Color;
    textureMatrix: Matrix4;
    _updateSelectionCache(): void;
    _changeVisibilityOfSelectedObjects(bVisible: any): void;
    _changeVisibilityOfNonSelectedObjects(bVisible: any): void;
    _updateTextureMatrix(): void;
    _getPrepareMaskMaterial(): ShaderMaterial;
    _getEdgeDetectionMaterial(): ShaderMaterial;
    _getSeparableBlurMaterial(maxRadius: any): ShaderMaterial;
    _getOverlayMaterial(): ShaderMaterial;
}

declare namespace OutlinePass {
    let BlurDirectionX: Vector2;
    let BlurDirectionY: Vector2;
}

export type { OutlinePass };
