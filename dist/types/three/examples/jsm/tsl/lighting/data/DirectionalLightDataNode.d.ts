import { Node } from "../../../../../build/three.webgpu.js";

declare class DirectionalLightDataNode extends Node {
    maxCount: number;

    constructor(maxCount?: number);
}

export default DirectionalLightDataNode;
