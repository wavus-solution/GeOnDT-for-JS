import { Node, TempNode, TextureNode } from "../../../../build/three.webgpu.js";

export default class AfterImageNode extends TempNode {
    textureNode: TextureNode;
    textureNodeOld: Node;
    damp: Node;

    constructor(textureNode: Node, damp?: Node);

    getTextureNode(): TextureNode;

    setSize(width: number, height: number): void;
}

export const afterImage: (node: Node, damp?: Node | number) => AfterImageNode;
