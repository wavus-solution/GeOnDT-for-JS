import { IUniform } from "../../../build/three.module.js";

export const FreiChenShader: {
    name: string;
    uniforms: {
        tDiffuse: IUniform;
        aspect: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
