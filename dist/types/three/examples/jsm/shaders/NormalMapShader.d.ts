import { IUniform } from "../../../build/three.module.js";

export const NormalMapShader: {
    name: string;
    uniforms: {
        heightMap: IUniform;
        resolution: IUniform;
        scale: IUniform;
        height: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
