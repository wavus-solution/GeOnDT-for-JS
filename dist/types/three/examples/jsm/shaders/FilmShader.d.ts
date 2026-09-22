import { IUniform } from "../../../build/three.module.js";

export const FilmShader: {
    uniforms: {
        tDiffuse: IUniform;
        time: IUniform;
        intensity: IUniform;
        grayscale: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
