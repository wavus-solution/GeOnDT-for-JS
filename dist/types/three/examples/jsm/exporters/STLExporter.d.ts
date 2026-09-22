import { Object3D } from "../../../build/three.module.js";

export interface STLExporterOptionsBinary {
    binary: true;
}

export interface STLExporterOptionsString {
    binary?: false;
}

export interface STLExporterOptions {
    binary?: boolean;
}

export class STLExporter {
    constructor();

    parse(scene: Object3D, options: STLExporterOptionsBinary): DataView<ArrayBuffer>;
    parse(scene: Object3D, options?: STLExporterOptionsString): string;
    parse(scene: Object3D, options?: STLExporterOptions): string | DataView<ArrayBuffer>;
}
