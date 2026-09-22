import { BufferGeometry, Loader, LoadingManager } from "../../../build/three.module.js";

export interface PDB {
    geometryAtoms: BufferGeometry;
    geometryBonds: BufferGeometry;
    json: {
        atoms: any[][];
    };
}

export class PDBLoader extends Loader<PDB> {
    constructor(manager?: LoadingManager);

    parse(text: string): PDB;
}
