import { Node, TempNode, TextureNode } from "../../../../build/three.webgpu.js";

declare class FSR1Node extends TempNode<"vec4"> {
    textureNode: TextureNode;
    sharpness: Node<"float">;
    denoise: Node<"bool">;

    constructor(textureNode: TextureNode, sharpness?: Node<"float"> | number, denoise?: Node<"bool"> | boolean);
}

export default FSR1Node;

export const fsr1: (
    node: Node<"vec4">,
    sharpness?: Node<"float"> | number,
    denoise?: Node<"bool"> | boolean,
) => FSR1Node;
