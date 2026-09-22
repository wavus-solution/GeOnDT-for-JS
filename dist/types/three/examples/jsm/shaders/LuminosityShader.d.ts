import { IUniform } from "../../../build/three.module.js";

export const LuminosityShader: {
    name: string;
    uniforms: {
        tDiffuse: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
