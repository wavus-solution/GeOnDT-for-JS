import { IUniform } from "../../../build/three.module.js";

export const KaleidoShader: {
    name: string;
    uniforms: {
        tDiffuse: IUniform;
        sides: IUniform;
        angle: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
