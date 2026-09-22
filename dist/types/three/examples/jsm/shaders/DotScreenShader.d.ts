import { IUniform } from "../../../build/three.module.js";

export const DotScreenShader: {
    uniforms: {
        tDiffuse: IUniform;
        tSize: IUniform;
        center: IUniform;
        angle: IUniform;
        scale: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
