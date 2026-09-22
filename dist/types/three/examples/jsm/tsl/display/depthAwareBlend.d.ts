import { Camera, Color, Node } from "../../../../build/three.webgpu.js";

export interface DepthAwareBlendOptions {
    blendColor?: Node | Color;
    edgeRadius?: Node<"int"> | number;
    edgeStrength?: Node<"float"> | number;
}

export const depthAwareBlend: (
    baseNode: Node,
    blendNode: Node,
    depthNode: Node,
    camera: Camera,
    options?: DepthAwareBlendOptions,
) => Node<"vec4">;
