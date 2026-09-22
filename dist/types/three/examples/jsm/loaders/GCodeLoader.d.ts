import { Group, Loader, LoadingManager } from "../../../build/three.module.js";

export class GCodeLoader extends Loader<Group> {
    constructor(manager?: LoadingManager);
    splitLayer: boolean;

    parse(data: string): Group;
}
