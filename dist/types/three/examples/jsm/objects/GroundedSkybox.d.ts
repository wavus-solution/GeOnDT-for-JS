import { Mesh, MeshBasicMaterial, SphereGeometry, Texture } from "../../../build/three.module.js";

export class GroundedSkybox extends Mesh<SphereGeometry, MeshBasicMaterial> {
    constructor(map: Texture, height: number, radius: number, resolution?: number);
}
