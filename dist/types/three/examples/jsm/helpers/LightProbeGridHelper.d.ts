import { InstancedMesh, NodeMaterial, SphereGeometry } from "../../../build/three.webgpu.js";
import { LightProbeGrid } from "../lighting/LightProbeGrid.js";

declare class LightProbeGridHelper extends InstancedMesh<SphereGeometry, NodeMaterial> {
    probes: LightProbeGrid;

    constructor(probes: LightProbeGrid, sphereSize?: number);

    update(): void;
}

export { LightProbeGridHelper };
