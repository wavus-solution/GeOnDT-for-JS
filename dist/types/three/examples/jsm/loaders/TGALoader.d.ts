import { DataTextureLoader, DataTextureLoaderTexData, LoadingManager } from "../../../build/three.module.js";

export class TGALoader extends DataTextureLoader {
    constructor(manager?: LoadingManager);

    parse(data: ArrayBuffer): DataTextureLoaderTexData;
}
