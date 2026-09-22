import { IUniform } from "../../../build/three.module.js";

export const DOFMipMapShader: {
    name: string;
    uniforms: {
        tColor: IUniform;
        tDepth: IUniform;
        focus: IUniform;
        maxblur: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
