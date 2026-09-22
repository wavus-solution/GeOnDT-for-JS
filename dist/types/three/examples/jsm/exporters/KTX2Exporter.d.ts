import { Data3DTexture, DataTexture, WebGLRenderer, WebGLRenderTarget } from "../../../build/three.module.js";
import { WebGPURenderer } from "../../../build/three.webgpu.js";

export class KTX2Exporter {
    parse(renderer: WebGLRenderer | WebGPURenderer, rtt?: WebGLRenderTarget): Promise<Uint8Array<ArrayBuffer>>;
    parse(texture: Data3DTexture | DataTexture): Promise<Uint8Array<ArrayBuffer>>;
}
