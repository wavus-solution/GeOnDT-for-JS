import { Loader, LoadingManager } from "../../../build/three.module.js";

import { Collada } from "./ColladaLoader.js";

export class KMZLoader extends Loader<Collada> {
    constructor(manager?: LoadingManager);

    parse(data: ArrayBuffer): Collada;
}
