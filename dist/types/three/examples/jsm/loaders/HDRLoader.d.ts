import { DataTextureLoader, DataTextureLoaderTexData, LoadingManager, TextureDataType } from "../../../build/three.module.js";

declare class HDRLoader extends DataTextureLoader {
    type: TextureDataType;

    constructor(manager?: LoadingManager);

    parse(buffer: ArrayBuffer): DataTextureLoaderTexData;
    setDataType(type: TextureDataType): this;
}

export { HDRLoader };
