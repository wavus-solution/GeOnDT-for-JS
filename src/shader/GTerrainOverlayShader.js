import {INTERNAL} from '@union3d/shader/GTerrainOverlayShader.internal.js';

const TERRAIN_OVERLAY_SHADER = INTERNAL.TERRAIN_OVERLAY_SHADER;

/**
 * 대상 material의 shader에 terrain overlay shader 코드를 주입한다.
 * @param {import('three').WebGLProgramParametersWithUniforms} shader
 * @param {object} overlayUniforms
 * @ignore
 */
function addTerrainOverlayShader(shader, overlayUniforms) {
    return INTERNAL.addTerrainOverlayShader(shader, overlayUniforms);
}

export {
    addTerrainOverlayShader,
    TERRAIN_OVERLAY_SHADER
};
