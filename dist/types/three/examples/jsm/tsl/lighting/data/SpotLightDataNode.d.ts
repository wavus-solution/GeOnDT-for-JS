import { Node } from "../../../../../build/three.webgpu.js";

declare class SpotLightDataNode extends Node {
    maxCount: number;

    constructor(maxCount?: number);
}

export default SpotLightDataNode;
