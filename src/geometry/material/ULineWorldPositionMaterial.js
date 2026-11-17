//@ts-check
import * as THREE from 'three';
import {INTERNAL} from '@union3d/geometry/material/ULineWorldPositionMaterial.internal';

/**
 * 선의 화면 형상을 유지하면서 중심선의 카메라 상대 월드 좌표(EPSG:3857)를 출력합니다.
 * 원본 스타일은 렌더 직전에 동기화하며 원본 재질의 해상도는 변경하지 않습니다.
 * 반환한 재질의 해제는 호출자가 담당합니다.
 *
 * @param {import('@union3d/lib/three/lines/LineMaterial').LineMaterial} sourceMaterial 색상 출력용 선 재질
 * @returns {import('@union3d/lib/three/lines/LineMaterial').LineMaterial} 카메라 상대 월드 좌표(EPSG:3857) 출력용 독립 재질
 */
function createLineSegmentsWorldPositionMaterial(sourceMaterial) {
    const material = sourceMaterial.clone();
    material.name = 'ULineWorldPositionMaterial';
    // 색상 경계 합성이 좌표 값을 섞지 않도록 위치 출력용 셰이더를 구성합니다.
    material.vertexShader = INTERNAL.createPositionVertexShader(sourceMaterial.vertexShader);
    material.fragmentShader = INTERNAL.createPositionFragmentShader(sourceMaterial.fragmentShader);
    if ('_setLineCoverageEnabled' in material && typeof material._setLineCoverageEnabled === 'function') {
        material._setLineCoverageEnabled(false);
    }
    material.transparent = false;
    material.blending = THREE.NoBlending;
    material.alphaToCoverage = false;
    material.depthTest = true;
    material.depthWrite = true;
    material.toneMapped = false;
    material.uniforms.cameraPositionLow = {value: new THREE.Vector3()};
    material.uniforms.modelPositionLow = {value: new THREE.Vector3()};
    material.uniforms.modelMatrix3 = {value: new THREE.Matrix3()};

    // 재사용 상태는 복제 재질이 소유하며 원본 재질의 설정과 해상도는 변경하지 않습니다.
    const state = INTERNAL.createSyncState(material.defines);
    material.onBeforeRender = (renderer, scene, camera, geometry, object) => {
        // 원본 스타일 변경과 현재 카메라·객체의 이동을 좌표 패스에 반영합니다.
        INTERNAL.updateMaterial(material, sourceMaterial, state, renderer, camera, object);
    };

    return material;
}

export {createLineSegmentsWorldPositionMaterial};
