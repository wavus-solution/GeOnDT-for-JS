import {INTERNAL} from '@union3d/shader/GColorToneBlendingShader.internal.js';

export const DEFAULT_LIGHT_COLOR_TONE = 0xffffff;
export const DEFAULT_DARK_COLOR_TONE = 0x000000;
export const DEFAULT_LIGHT_COLOR_TONE_ENABLED = false;
export const DEFAULT_DARK_COLOR_TONE_ENABLED = false;
export const DEFAULT_LIGHT_COLOR_TONE_EXPOSURE = 1.0;
export const DEFAULT_DARK_COLOR_TONE_EXPOSURE = 1.0;

/**
 * Creates and returns a color tone uniform.
 * @return {colorToneUniforms}
 *
 * @ignore
 */
export function getColorToneUniform(){
    return INTERNAL.getColorToneUniform(
        DEFAULT_LIGHT_COLOR_TONE,
        DEFAULT_DARK_COLOR_TONE,
        DEFAULT_LIGHT_COLOR_TONE_ENABLED,
        DEFAULT_DARK_COLOR_TONE_ENABLED,
        DEFAULT_LIGHT_COLOR_TONE_EXPOSURE,
        DEFAULT_DARK_COLOR_TONE_EXPOSURE
    );
}

/**
 * Injects color tone adjustment code into a material shader.
 * @param {import('three').WebGLProgramParametersWithUniforms} shader
 * @param {colorToneUniforms} [uniforms]
 * @param {import('three').Material} [material] Uses the cached shader source when supplied.
 * @returns {colorToneUniforms | null}
 * @ignore
 */
export function addColorToneShader(shader, uniforms, material){
    return INTERNAL.addColorToneShader(
        shader,
        uniforms,
        material,
        DEFAULT_LIGHT_COLOR_TONE,
        DEFAULT_DARK_COLOR_TONE,
        DEFAULT_LIGHT_COLOR_TONE_ENABLED,
        DEFAULT_DARK_COLOR_TONE_ENABLED,
        DEFAULT_LIGHT_COLOR_TONE_EXPOSURE,
        DEFAULT_DARK_COLOR_TONE_EXPOSURE
    );
}
