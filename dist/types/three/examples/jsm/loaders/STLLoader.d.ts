import { BufferGeometry, Loader, LoadingManager } from "../../../build/three.module.js";

export class STLLoader extends Loader<BufferGeometry> {
    constructor(manager?: LoadingManager);

    parse(data: ArrayBuffer | string): BufferGeometry;
}
