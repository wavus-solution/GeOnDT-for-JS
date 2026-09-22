import { BufferGeometry, Loader, LoadingManager } from "../../../build/three.module.js";

declare class GaussianSplatPLYLoader extends Loader<BufferGeometry> {
    constructor(manager?: LoadingManager);

    parse(data: ArrayBuffer | string): BufferGeometry;
}

export { GaussianSplatPLYLoader };
