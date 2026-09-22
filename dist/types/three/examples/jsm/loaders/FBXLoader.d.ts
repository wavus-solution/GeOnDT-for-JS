import { Group, Loader, LoadingManager } from "../../../build/three.module.js";

export class FBXLoader extends Loader<Group> {
    constructor(manager?: LoadingManager);
    trimAnimationClips: boolean;

    parse(FBXBuffer: ArrayBuffer | string, path: string): Group;
}
