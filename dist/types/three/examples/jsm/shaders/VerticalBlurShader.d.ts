import { IUniform } from "../../../build/three.module.js";

export const VerticalBlurShader: {
    uniforms: {
        tDiffuse: IUniform;
        v: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
