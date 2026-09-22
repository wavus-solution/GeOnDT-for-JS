import { BufferGeometry, Loader, LoadingManager } from "../../../build/three.module.js";

export class MD2Loader extends Loader<BufferGeometry> {
    constructor(manager?: LoadingManager);

    parse(data: ArrayBuffer): BufferGeometry;
}
