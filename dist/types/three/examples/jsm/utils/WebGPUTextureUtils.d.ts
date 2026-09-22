import { Texture, WebGPURenderer } from "../../../build/three.webgpu.js";

export function decompress(blitTexture: Texture, maxTextureSize?: number, renderer?: WebGPURenderer): Promise<Texture>;
