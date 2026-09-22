import { IUniform } from "../../../build/three.module.js";

export const TechnicolorShader: {
    name: string;
    uniforms: {
        tDiffuse: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
