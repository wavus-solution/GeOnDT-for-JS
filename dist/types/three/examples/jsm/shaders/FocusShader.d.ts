import { IUniform } from "../../../build/three.module.js";

export const FocusShader: {
    name: string;
    uniforms: {
        tDiffuse: IUniform;
        screenWidth: IUniform;
        screenHeight: IUniform;
        sampleDistance: IUniform;
        waveFactor: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
