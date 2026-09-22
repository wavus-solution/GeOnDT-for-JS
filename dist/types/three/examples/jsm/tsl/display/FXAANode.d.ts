import { Node, TempNode, TextureNode } from "../../../../build/three.webgpu.js";

declare class FXAANode extends TempNode {
    textureNode: TextureNode;

    constructor(textureNode: TextureNode);
}

export default FXAANode;

export const fxaa: (node: Node) => FXAANode;
