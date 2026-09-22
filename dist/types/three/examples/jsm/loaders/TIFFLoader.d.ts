import { DataTextureLoader, DataTextureLoaderTexData, LoadingManager, TextureFilter } from "../../../build/three.module.js";

export class TIFFLoader extends DataTextureLoader {
    constructor(manager?: LoadingManager);

    parse(buffer: ArrayBuffer): DataTextureLoaderTexData;
}
