import { IUniform } from "../../../build/three.module.js";

export const MirrorShader: {
    name: string;
    uniforms: {
        tDiffuse: IUniform;
        side: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
};
