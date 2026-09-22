import { BufferGeometry, Loader, LoadingManager } from "../../../build/three.module.js";

export class PLYLoader extends Loader<BufferGeometry> {
    constructor(manager?: LoadingManager);
    propertyNameMapping: object;
    customPropertyMapping: Record<string, any>;

    setPropertyNameMapping(mapping: object): void;
    setCustomPropertyNameMapping(mapping: Record<string, any>): void;
    parse(data: ArrayBuffer | string): BufferGeometry;
}
