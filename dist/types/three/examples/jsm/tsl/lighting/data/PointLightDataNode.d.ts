import { Node } from "../../../../../build/three.webgpu.js";

declare class PointLightDataNode extends Node {
    maxCount: number;

    constructor(maxCount?: number);
}

export default PointLightDataNode;
