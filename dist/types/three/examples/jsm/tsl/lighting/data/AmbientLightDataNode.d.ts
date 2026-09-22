import { Color, Node, UniformNode } from "../../../../../build/three.webgpu.js";

declare class AmbientLightDataNode extends Node {
    colorNode: UniformNode<"color", Color>;

    constructor();
}

export default AmbientLightDataNode;
