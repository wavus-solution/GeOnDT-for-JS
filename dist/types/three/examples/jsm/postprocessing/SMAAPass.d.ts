import { ShaderMaterial, Texture, WebGLRenderTarget } from "../../../build/three.module.js";

import { FullScreenQuad, Pass } from "./Pass.js";

export class SMAAPass extends Pass {
    constructor();
    edgesRT: WebGLRenderTarget;
    weightsRT: WebGLRenderTarget;
    areaTexture: Texture;
    searchTexture: Texture;
    uniformsEdges: object;
    materialEdges: ShaderMaterial;
    uniformsWeights: object;
    materialWeights: ShaderMaterial;
    uniformsBlend: object;
    materialBlend: ShaderMaterial;
    fsQuad: FullScreenQuad;

    getAreaTexture(): string;
    getSearchTexture(): string;
}
