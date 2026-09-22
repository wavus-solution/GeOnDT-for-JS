import { ShaderMaterial, ShaderMaterialParameters } from "../../../build/three.module.js";

declare class LDrawConditionalLineMaterial extends ShaderMaterial {
    readonly isLDrawConditionalLineMaterial: true;

    constructor(parameters?: ShaderMaterialParameters);
}

export { LDrawConditionalLineMaterial };
