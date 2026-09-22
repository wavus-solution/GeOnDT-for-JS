import { Loader, LoadingManager, Scene } from "../../../build/three.module.js";

export class VRMLLoader extends Loader<Scene> {
    constructor(manager?: LoadingManager);

    parse(data: string, path: string): Scene;
}
