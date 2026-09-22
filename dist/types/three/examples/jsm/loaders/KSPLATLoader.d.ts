import { BufferGeometry, Loader, LoadingManager } from "../../../build/three.module.js";

declare class KSPLATLoader extends Loader<BufferGeometry> {
    constructor(manager?: LoadingManager);

    parse(buffer: ArrayBuffer): BufferGeometry;
}

export { KSPLATLoader };
