import { IUniform } from "../../../build/three.module.js";

export const TriangleBlurShader: {
    name: string;
    uniforms: {
        texture: IUniform;
        delta: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
