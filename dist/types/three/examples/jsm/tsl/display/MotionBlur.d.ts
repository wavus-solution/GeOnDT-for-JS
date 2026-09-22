import { Node } from "../../../../build/three.webgpu.js";

export const motionBlur: (
    inputNode: Node,
    velocity: Node,
    numSamples?: Node,
) => Node<"vec4">;
