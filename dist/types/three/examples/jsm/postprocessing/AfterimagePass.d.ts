import { IUniform, ShaderMaterial } from "../../../build/three.module.js";

import { Pass } from "./Pass.js";

declare class AfterimagePass extends Pass {
    uniforms: Record<string, IUniform>;

    compFsMaterial: ShaderMaterial;
    copyFsMaterial: ShaderMaterial;

    constructor(damp?: number);

    get damp(): number;
    set damp(value: number);
}

export { AfterimagePass };
