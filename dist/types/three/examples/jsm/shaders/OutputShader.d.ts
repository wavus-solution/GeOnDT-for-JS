import { IUniform } from "../../../build/three.module.js";

export const OutputShader: {
    name: string;
    uniforms: {
        tDiffuse: IUniform;
        toneMappingExposure: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
