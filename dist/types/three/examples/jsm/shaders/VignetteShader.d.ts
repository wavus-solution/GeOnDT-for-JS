import { IUniform } from "../../../build/three.module.js";

export const VignetteShader: {
    uniforms: {
        tDiffuse: IUniform;
        offset: IUniform;
        darkness: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
