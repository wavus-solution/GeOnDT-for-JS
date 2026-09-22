import { Group, Loader, LoadingManager } from "../../../build/three.module.js";

declare class USDLoader extends Loader<Group> {
    constructor(manager?: LoadingManager);

    parse(
        buffer: ArrayBuffer | string,
        path?: string,
        onLoad?: (group: Group) => void,
        onError?: (err: unknown) => void,
    ): Group;
}

export { USDLoader };
