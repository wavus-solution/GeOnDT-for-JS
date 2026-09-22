import { IUniform } from "../../../build/three.module.js";

export const WaterRefractionShader: {
    name: string;
    uniforms: {
        color: IUniform;
        time: IUniform;
        tDiffuse: IUniform;
        tDudv: IUniform;
        textureMatrix: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
