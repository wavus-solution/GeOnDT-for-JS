import { Group, Loader, LoadingManager } from "../../../build/three.module.js";

export class AMFLoader extends Loader<Group> {
    constructor(manager?: LoadingManager);

    parse(data: ArrayBuffer): Group;
}
