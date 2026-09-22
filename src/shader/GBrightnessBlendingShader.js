import {INTERNAL} from "@union3d/shader/GBrightnessBlendingShader.internal.js";

export const DEFAULT_BRIGHTNESS = 1.0;

/**
 * 밝기 조절 Uniform 정보를 생성해서 반환한다.
 * @return {brightnessUniforms}
 *
 * @ignore
 */
export function getBrightnessUniform(){
    return INTERNAL.getBrightnessUniform(DEFAULT_BRIGHTNESS);
}

/**
 * 대상 material의 shader에 밝기 조절 shader 코드를 주입한다.
 * @param {import('three').WebGLProgramParametersWithUniforms} shader
 * @param {brightnessUniforms} [uniforms]
 * @param {import('three').Material} [material] 머터리얼을 입력하면, 기존에 캐싱된 shader 문자열을 사용한다.
 * @returns {brightnessUniforms | null}
 * @ignore
 */
export function addBrightnessShader(shader,uniforms, material){
    return INTERNAL.addBrightnessShader(shader,uniforms,material,DEFAULT_BRIGHTNESS)
}
