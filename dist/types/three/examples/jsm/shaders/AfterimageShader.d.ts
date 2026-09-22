import { IUniform } from "../../../build/three.module.js";

export const AfterimageShader: {
    name: string;
    uniforms: {
        damp: IUniform;
        tOld: IUniform;
        tNew: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
