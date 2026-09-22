import { BufferGeometry, Mesh, ShaderMaterial, Texture } from "../../../build/three.module.js";

export class TextureHelper extends Mesh<BufferGeometry, ShaderMaterial> {
    texture: Texture;
    type: "TextureHelper";

    constructor(texture: Texture, width?: number, height?: number, depth?: number);

    dispose(): void;
}
