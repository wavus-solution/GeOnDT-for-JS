import { ColorRepresentation, Scene } from "../../../build/three.module.js";

declare class ColorEnvironment extends Scene {
    constructor(color?: ColorRepresentation);

    dispose(): void;
}

export { ColorEnvironment };
