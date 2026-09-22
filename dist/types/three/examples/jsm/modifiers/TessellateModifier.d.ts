import { BufferGeometry } from "../../../build/three.module.js";

export class TessellateModifier {
    constructor(maxEdgeLength?: number, maxIterations?: number);
    maxEdgeLength: number;
    maxIterations: number;

    modify<TGeometry extends BufferGeometry>(geometry: TGeometry): TGeometry;
}
