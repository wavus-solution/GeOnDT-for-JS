import { CubeTexture, LightProbe, WebGLCubeRenderTarget, WebGLRenderer } from "../../../build/three.module.js";
import { CubeRenderTarget, WebGPURenderer } from "../../../build/three.webgpu.js";

declare class LightProbeGenerator {
    static fromCubeTexture(cubeTexture: CubeTexture): LightProbe;
    static fromCubeRenderTarget(
        renderer: WebGLRenderer,
        cubeRenderTarget: WebGLCubeRenderTarget,
    ): Promise<LightProbe>;
    static fromCubeRenderTarget(
        renderer: WebGPURenderer,
        cubeRenderTarget: CubeRenderTarget,
    ): Promise<LightProbe>;
}

export { LightProbeGenerator };
