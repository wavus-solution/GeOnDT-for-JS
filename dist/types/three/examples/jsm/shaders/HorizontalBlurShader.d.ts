import { IUniform } from "../../../build/three.module.js";

export const HorizontalBlurShader: {
    uniforms: {
        tDiffuse: IUniform;
        h: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
