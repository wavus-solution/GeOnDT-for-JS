import { AnimationClip, Loader, LoadingManager, Skeleton } from "../../../build/three.module.js";

export interface BVH {
    clip: AnimationClip;
    skeleton: Skeleton;
}

export class BVHLoader extends Loader<BVH> {
    constructor(manager?: LoadingManager);
    animateBonePositions: boolean;
    animateBoneRotations: boolean;

    parse(text: string): BVH;
}
