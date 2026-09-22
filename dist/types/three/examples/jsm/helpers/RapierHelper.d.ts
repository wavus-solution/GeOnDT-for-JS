import * as RAPIER from "../../../vendor-types/@dimforge/rapier3d-compat/rapier.js";
import { LineSegments } from "../../../build/three.module.js";

declare class RapierHelper extends LineSegments {
    world: RAPIER.World;

    constructor(world: RAPIER.World);

    update(): void;
    dispose(): void;
}

export { RapierHelper };
