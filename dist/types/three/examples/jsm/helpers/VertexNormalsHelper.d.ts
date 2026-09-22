import { LineSegments, Object3D } from "../../../build/three.module.js";

export class VertexNormalsHelper extends LineSegments {
    readonly isVertexNormalsHelper: true;

    constructor(object: Object3D, size?: number, hex?: number);

    object: Object3D;
    size: number;

    update(): void;

    dispose(): void;
}
