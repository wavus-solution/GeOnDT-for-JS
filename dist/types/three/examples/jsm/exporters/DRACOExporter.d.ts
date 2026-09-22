import { Mesh, Points } from "../../../build/three.module.js";

export interface DRACOExporterOptions {
    decodeSpeed?: number;
    encodeSpeed?: number;
    encoderMethod?: number;
    quantization?: number[];
    exportUvs?: boolean;
    exportNormals?: boolean;
    exportColor?: boolean;
}

export class DRACOExporter {
    constructor();

    parseAsync(object: Mesh | Points, options?: DRACOExporterOptions): Promise<Int8Array<ArrayBuffer>>;
}
