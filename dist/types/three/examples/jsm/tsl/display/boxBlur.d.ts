import { Node } from "../../../../build/three.webgpu.js";

export interface BoxBlurOptions {
    size?: Node | undefined;
    separation?: Node | undefined;
    mask?: Node | null | undefined;
    premultipliedAlpha?: boolean | undefined;
}

export const boxBlur: (textureNode: Node, options?: BoxBlurOptions) => Node<"vec4">;
