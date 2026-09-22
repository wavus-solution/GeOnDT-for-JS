import { CubeTexture, Mesh, PerspectiveCamera, Scene } from "../../../build/three.module.js";

import { FullScreenQuad, Pass } from "./Pass.js";

export class CubeTexturePass extends Pass {
    constructor(camera: PerspectiveCamera, envMap?: CubeTexture, opacity?: number);
    camera: PerspectiveCamera;
    cubeShader: object;
    cubeMesh: Mesh;
    envMap: CubeTexture;
    opacity: number;
    cubeScene: Scene;
    cubeCamera: PerspectiveCamera;
}
