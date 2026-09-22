import { Loader, LoadingManager } from "../../../build/three.module.js";
import { FontData } from "./FontLoader.js";

export class TTFLoader extends Loader<FontData> {
    reversed: boolean;

    constructor(manager?: LoadingManager);

    parse(arraybuffer: ArrayBuffer): FontData;
}
