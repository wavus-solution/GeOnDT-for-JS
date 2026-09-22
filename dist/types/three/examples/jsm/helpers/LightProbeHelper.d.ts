import { LightProbe, Mesh } from "../../../build/three.module.js";

declare class LightProbeHelper extends Mesh {
    lightProbe: LightProbe;
    size: number;

    constructor(lightProbe: LightProbe, size?: number);

    dispose(): void;
}

export { LightProbeHelper };
