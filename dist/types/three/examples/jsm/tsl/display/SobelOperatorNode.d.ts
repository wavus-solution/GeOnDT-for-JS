import { Node, TempNode, TextureNode } from "../../../../build/three.webgpu.js";

declare class SobelOperatorNode extends TempNode {
    textureNode: TextureNode;

    constructor(textureNode: TextureNode);
}

export default SobelOperatorNode;

export const sobel: (node: Node) => SobelOperatorNode;
