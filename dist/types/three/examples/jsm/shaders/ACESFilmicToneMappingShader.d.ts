import { IUniform, Texture } from "../../../build/three.module.js";

export const ACESFilmicToneMappingShader: {
    name: string;
    uniforms: {
        tDiffuse: IUniform<Texture>;
        exposure: IUniform<number>;
    };
    vertexShader: string;
    fragmentShader: string;
};
