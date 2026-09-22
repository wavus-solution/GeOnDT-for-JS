import { IUniform } from "../../../build/three.module.js";

export const FXAAShader: {
    name: string;
    uniforms: {
        tDiffuse: IUniform;
        resolution: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
