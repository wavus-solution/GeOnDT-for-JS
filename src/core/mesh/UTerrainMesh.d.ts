// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../../3dLayer/U3dLayer.js";
import type { UMesh } from "./UMesh.js";
import type { UPlaneBufferGeometry } from "../../geometry/UPlaneBufferGeometry.js";
import type { U3dQuadTile } from "../../quadtree/U3dQuadTile.js";

/** Terrain mesh가 manager에 등록되기 전에 적용할 초기 색상 보정 값입니다. */
interface InitialColorAdjustmentOption {
    brightness: number | null;
    contrast: number | null;
    saturation: number | null;
    hueRotation: number | null;
    lightColorTone: ColorRepresentation | null;
    darkColorTone: ColorRepresentation | null;
    lightColorToneEnabled: boolean | null;
    darkColorToneEnabled: boolean | null;
    lightColorToneExposure: number | null;
    darkColorToneExposure: number | null;
}

interface option {
    tile?: U3dQuadTile;
    ownerLayer?: U3dLayer;
    initialColorAdjustment?: InitialColorAdjustmentOption;
    /** 타일 geometry를 공유하지 않고 이 메시 전용 geometry를 쓸 때 지정합니다. */
    geometry?: UPlaneBufferGeometry;
}

declare class UTerrainMesh extends UMesh {
    #private;
    static DISPOSE_READY: string;
    geometry: UPlaneBufferGeometry;
    material: Material;
    _brightnessUniforms: {
        value: number;
    };
    _contrastUniforms: {
        value: number;
    };
    _saturationUniforms: {
        value: number;
    };
    _hueRotationUniforms: {
        value: number;
    };
    _colorToneUniforms: {
        light: {
            value: Color;
        };
        dark: {
            value: Color;
        };
        lightEnabled: {
            value: boolean;
        };
        darkEnabled: {
            value: boolean;
        };
        lightExposure: {
            value: number;
        };
        darkExposure: {
            value: number;
        };
    };
    constructor(tile: U3dQuadTile, material: Material, opt?: option);
    /**
     * decal 기능에 대한 내용을 수행하기위해 UShaderTerrainDecalManager에 해당 mesh를 등록합니다.
     * @param {import('@U3dLayer').U3dLayer} layer ownerLayer
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 현재 UTerrainMesh에 해당하는 tile
     * @param {import('@union3d/manager/terrain/UShaderTerrainDecalManager').UShaderTerrainDecalManager} manager decal 기능을 관리하는 manager
     *
     * @ignore
     */
    private initDecalRegister;
    setLayer(layer: U3dLayer, tile: U3dQuadTile): void;
    /**
     * terrain texture 준비 완료를 manager에 전달합니다.
     *
     * @param {string} [reason='terrain-texture-ready'] 상태 변경 사유입니다.
     * @returns {boolean} manager 상태를 갱신했으면 `true`입니다.
     */
    markTerrainTextureReady(reason?: string): boolean;
    /**
     * terrain mesh의 가시 상태와 해당 material binding 상태를 함께 갱신합니다.
     *
     * @param {boolean} visible 갱신할 가시 상태입니다.
     * @returns {boolean} 상태를 갱신했으면 `true`입니다.
     */
    setTerrainVisible(visible: boolean): boolean;
    /**
     * terrain mesh와 material binding의 렌더 순서를 갱신합니다.
     *
     * @param {number} renderOrder 새 렌더 순서입니다.
     * @returns {boolean} manager 상태를 갱신했으면 `true`입니다.
     */
    setTerrainRenderOrder(renderOrder: number): boolean;
    /**
     * texture를 다시 만들지 않고 현재 material binding의 표시 조건만 재평가합니다.
     *
     * @param {string} [reason='terrain-presentation-changed'] 재평가 사유입니다.
     * @returns {boolean} manager 상태를 갱신했으면 `true`입니다.
     */
    refreshTerrainPresentation(reason?: string): boolean;
    /**
     * texture와 terrain uniform 전환이 모두 완료됐는지 반환합니다.
     *
     * 연속 갱신 tile(움직이는 feature)은 적용이 끝나는 즉시 다음 revision 이 올라 "최신 revision 적용" 이
     * 어느 프레임에서도 성립하지 않으므로, 직전 revision 이 적용됐고 현재 revision 이 진행 중인 한 단계
     * 지연은 준비 완료로 인정합니다(`acceptInFlightRevision`). 그렇지 않으면 원이 지나는 자식 tile 이
     * LOD 전환에서 영원히 부착되지 못해 부모 tile 이 흐리게 남습니다.
     *
     * @returns {boolean} 표시 가능한 상태이면 `true`입니다.
     */
    isTerrainRenderableReady(): boolean;
    /**
     * texture와 terrain uniform 전환 완료까지 대기합니다.
     *
     * @returns {Promise<boolean>} 표시 준비가 완료되면 `true`입니다.
     */
    waitTerrainRenderable(): Promise<boolean>;
    /**
     * 현재 cache hit가 terrain 상태 재평가 경로인지 반환합니다.
     *
     * @returns {boolean} terrain uniform 재평가가 필요하면 `true`입니다.
     */
    isTerrainPresentationReevaluation(): boolean;
    /**
     * terrain handoff를 고려해 mesh 해제를 요청합니다.
     *
     * @param {Partial<{force: boolean}>} [opt={}] 강제 종료 여부입니다.
     * @returns {boolean} 최종 자원 해제까지 완료됐으면 `true`, 보류됐으면 `false`입니다.
     */
    dispose(opt?: {
        force?: boolean;
    }): boolean;
    /**
     * manager가 handoff 완료를 확인한 뒤 보류된 mesh 해제를 완료합니다.
     *
     * @returns {boolean} 최종 해제를 완료했으면 `true`입니다.
     *
     * @ignore
     */
    completeTerrainDeferredDispose(): boolean;
    get brightness(): number | null;
    set brightness(value: number | null);
    get contrast(): number | null;
    set contrast(value: number | null);
    get saturation(): number | null;
    set saturation(value: number | null);
    get hueRotation(): number | null;
    set hueRotation(value: number | null);
    get lightColorTone(): ColorRepresentation | null;
    set lightColorTone(value: ColorRepresentation | null);
    get darkColorTone(): ColorRepresentation | null;
    set darkColorTone(value: ColorRepresentation | null);
    get lightColorToneEnabled(): boolean | null;
    set lightColorToneEnabled(value: boolean | null);
    get darkColorToneEnabled(): boolean | null;
    set darkColorToneEnabled(value: boolean | null);
    get lightColorToneExposure(): number | null;
    set lightColorToneExposure(value: number | null);
    get darkColorToneExposure(): number | null;
    set darkColorToneExposure(value: number | null);
    get boundingSphere(): Sphere;
    set boundingSphere(value: Sphere);
    onAfterRender(): void;
}

export type { InitialColorAdjustmentOption, UTerrainMesh, option };
