import { IUniform } from "../../../build/three.module.js";

export const BlendShader: {
    name: string;
    uniforms: {
        tDiffuse1: IUniform;
        tDiffuse2: IUniform;
        mixRatio: IUniform;
        opacity: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
