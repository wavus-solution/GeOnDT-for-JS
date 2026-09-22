import {INTERNAL} from "@union3d/shader/GContrastBlendingShader.internal.js";

export const DEFAULT_CONTRAST = 1.0;

/**
 * 대비 조절 Uniform 정보를 생성해서 반환한다.
 * @return {contrastUniforms}
 *
 * @ignore
 */
export function getContrastUniform(){
    return INTERNAL.getContrastUniform(DEFAULT_CONTRAST);
}


/**
 * 대상 material의 shader에 대비 조절 shader 코드를 주입한다.
 * @param {import('three').WebGLProgramParametersWithUniforms} shader
 * @param {brightnessUniforms} [uniforms]
 * @param {import('three').Material} [material] 머터리얼을 입력하면, 기존에 캐싱된 shader 문자열을 사용한다.
 * @returns {contrastUniforms | null}
 * @ignore
 */
export function addContrastShader(shader,uniforms, material){
    return INTERNAL.addContrastShader(shader,uniforms,material,DEFAULT_CONTRAST)
}
