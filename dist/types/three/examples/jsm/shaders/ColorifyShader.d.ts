import { IUniform } from "../../../build/three.module.js";

export const ColorifyShader: {
    uniforms: {
        tDiffuse: IUniform;
        color: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
