import { Color, Mesh, Texture } from "../../../build/three.module.js";

declare class LensflareMesh extends Mesh {
    readonly isLensflare: true;

    constructor();

    addElement: (element: LensflareElement) => void;
    dispose: () => void;
}

declare class LensflareElement {
    texture: Texture;
    size: number;
    distance: number;
    color: Color;

    constructor(texture: Texture, size?: number, distance?: number, color?: Color);
}

export { LensflareElement, LensflareMesh };
