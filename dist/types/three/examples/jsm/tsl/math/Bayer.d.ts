import { Node } from "../../../../build/three.webgpu.js";

export const bayer16: (uv: Node) => Node;

export const bayerDither: (color: Node<"vec3">, steps?: Node<"float">) => Node<"vec3">;
