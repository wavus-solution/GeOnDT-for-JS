import { FunctionNode, Node } from "../../../../build/three.webgpu.js";

export const RaymarchingBox: (
    steps: number | Node,
    callback:
        | ((params: { positionRay: Node<"vec3">; stepSize: Node<"float"> }) => void)
        | FunctionNode<{ positionRay: Node<"vec3">; stepSize: Node<"float"> }>,
) => void;
