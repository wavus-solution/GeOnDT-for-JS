import { IUniform } from "../../../build/three.module.js";

export const UnpackDepthRGBAShader: {
    name: string;
    uniforms: {
        tDiffuse: IUniform;
        opacity: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
