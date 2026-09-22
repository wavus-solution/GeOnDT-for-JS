import { IUniform } from "../../../build/three.module.js";

export const HueSaturationShader: {
    name: string;
    uniforms: {
        tDiffuse: IUniform;
        hue: IUniform;
        saturation: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
