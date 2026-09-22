import { AnimationClip, BufferAttribute, Loader, LoadingManager } from "../../../build/three.module.js";

export interface MDD {
    morphTargets: BufferAttribute[];
    clip: AnimationClip;
}

export class MDDLoader extends Loader<MDD> {
    constructor(manager?: LoadingManager);

    parse(data: ArrayBuffer): MDD;
}
