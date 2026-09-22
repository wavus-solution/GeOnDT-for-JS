import { BufferGeometry } from "../../../build/three.module.js";

export class SimplifyModifier {
    constructor();
    modify(geometry: BufferGeometry, count: number): Promise<BufferGeometry>;
}
