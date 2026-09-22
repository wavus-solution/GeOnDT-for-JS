import {INTERNAL} from "@union3d/shader/GSaturationBlendingShader.internal.js";

export const DEFAULT_SATURATION = 1.0;

/**
 * 채도 조절 Uniform 정보를 생성해서 반환한다.
 * @return {saturationUniforms}
 *
 * @ignore
 */
export function getSaturationUniform(){
    return INTERNAL.getSaturationUniform(DEFAULT_SATURATION);
}

/**
 * 대상 material의 shader에 채도 조절 shader 코드를 주입한다.
 * @param {import('three').WebGLProgramParametersWithUniforms} shader
 * @param {saturationUniforms} [uniforms]
 * @param {import('three').Material} [material] 머터리얼을 입력하면, 기존에 캐싱된 shader 문자열을 사용한다.
 * @returns {saturationUniforms | null}
 * @ignore
 */
export function addSaturationShader(shader, uniforms, material){
    return INTERNAL.addSaturationShader(shader, uniforms, material, DEFAULT_SATURATION);
}
