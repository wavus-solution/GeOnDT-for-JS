import {INTERNAL} from "@union3d/shader/GHueRotationBlendingShader.internal.js";

export const DEFAULT_HUE_ROTATION = 0.0;

/**
 * Creates and returns a hue rotation uniform.
 * @return {hueRotationUniforms}
 *
 * @ignore
 */
export function getHueRotationUniform(){
    return INTERNAL.getHueRotationUniform(DEFAULT_HUE_ROTATION);
}

/**
 * Injects hue rotation code into a material shader.
 * @param {import('three').WebGLProgramParametersWithUniforms} shader
 * @param {hueRotationUniforms} [uniforms]
 * @param {import('three').Material} [material] Uses the cached shader source when supplied.
 * @returns {hueRotationUniforms | null}
 * @ignore
 */
export function addHueRotationShader(shader, uniforms, material){
    return INTERNAL.addHueRotationShader(shader, uniforms, material, DEFAULT_HUE_ROTATION);
}
