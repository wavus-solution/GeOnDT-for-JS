import { IUniform, UniformsLib } from "../../../build/three.module.js";

export const VelocityShader: {
    name: string;
    uniforms:
        & (typeof UniformsLib)["common"]
        & (typeof UniformsLib)["displacementmap"]
        & {
            modelMatrixPrev: IUniform;
            currentProjectionViewMatrix: IUniform;
            previousProjectionViewMatrix: IUniform;
        };

    fragmentShader: string;
    vertexShader: string;
};
