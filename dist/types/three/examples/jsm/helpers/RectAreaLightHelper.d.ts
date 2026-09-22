import { ColorRepresentation, Line, RectAreaLight } from "../../../build/three.module.js";

export class RectAreaLightHelper extends Line {
    constructor(light: RectAreaLight, color?: ColorRepresentation);

    light: RectAreaLight;
    color: ColorRepresentation | undefined;

    dispose(): void;
}
