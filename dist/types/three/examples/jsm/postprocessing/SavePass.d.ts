import { ShaderMaterial, WebGLRenderTarget } from "../../../build/three.module.js";

import { FullScreenQuad, Pass } from "./Pass.js";

export class SavePass extends Pass {
    constructor(renderTarget?: WebGLRenderTarget);
    textureID: string;
    renderTarget: WebGLRenderTarget;
    uniforms: object;
    material: ShaderMaterial;
    fsQuad: FullScreenQuad;
}
