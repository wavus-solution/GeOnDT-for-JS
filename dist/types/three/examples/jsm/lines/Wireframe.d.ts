import { Mesh } from "../../../build/three.module.js";

import { LineMaterial } from "./LineMaterial.js";
import { LineSegmentsGeometry } from "./LineSegmentsGeometry.js";

declare class Wireframe extends Mesh {
    readonly isWireframe: true;

    constructor(geometry?: LineSegmentsGeometry, material?: LineMaterial);

    computeLineDistances(): this;
}

export { Wireframe };
