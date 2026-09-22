import { IUniform, RawShaderMaterial } from "../../../build/three.module.js";

import { Pass } from "./Pass.js";

declare class OutputPass extends Pass {
    readonly isOutputPass: true;

    uniforms: Record<string, IUniform>;
    material: RawShaderMaterial;

    constructor();
}

export { OutputPass };
