import { IUniform } from "../../../build/three.module.js";

export const BleachBypassShader: {
    uniforms: {
        tDiffuse: IUniform;
        opacity: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
