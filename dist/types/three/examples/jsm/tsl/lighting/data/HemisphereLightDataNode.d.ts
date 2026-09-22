import { Node } from "../../../../../build/three.webgpu.js";

declare class HemisphereLightDataNode extends Node {
    maxCount: number;

    constructor(maxCount?: number);
}

export default HemisphereLightDataNode;
