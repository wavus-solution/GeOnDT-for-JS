import { IUniform } from "../../../build/three.module.js";

export const HorizontalTiltShiftShader: {
    name: string;
    uniforms: {
        tDiffuse: IUniform;
        h: IUniform;
        r: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
