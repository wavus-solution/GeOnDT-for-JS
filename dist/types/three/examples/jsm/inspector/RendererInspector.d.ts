import { InspectorBase, InspectorBaseEventMap } from "../../../build/three.webgpu.js";

export interface RendererInspectorEventMap extends InspectorBaseEventMap {
}

export class RendererInspector<TEventMap extends RendererInspectorEventMap = RendererInspectorEventMap>
    extends InspectorBase<TEventMap>
{
}
