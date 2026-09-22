import { DataTexture, Loader } from "../../../build/three.module.js";

export class IESLoader extends Loader<DataTexture> {
    parse(text: string): DataTexture;
}
