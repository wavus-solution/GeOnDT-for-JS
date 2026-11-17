//@ts-check
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {INTERNAL} from '@union3d/geometry/material/ULineMaterial.internal';

/**
 * AA 연결에 필요한 WebGLRenderer의 기본 계약을 확인합니다.
 *
 * @param {import('three').WebGLRenderer} renderer 연결 대상 renderer
 */
function assertRenderer(renderer) {
    if (!renderer || typeof renderer !== 'object' || !('isWebGLRenderer' in renderer) || renderer.isWebGLRenderer !== true
        || typeof renderer.renderBufferDirect !== 'function' || typeof renderer.dispose !== 'function'
        || typeof renderer.getCurrentViewport !== 'function' || typeof renderer.getPixelRatio !== 'function'
        || typeof renderer.getRenderTarget !== 'function') {
        throw new TypeError('ULineMaterial: WebGLRenderer가 필요합니다.');
    }
}

/**
 * ~extends import('three/examples/jsm/lines/LineMaterial.js').LineMaterial <br>
 *
 * 실선·점선과 불투명·반투명 선의 경계를 픽셀 커버리지로 표현합니다.
 * 색상 출력은 경계 블렌딩을 사용하므로 transparent의 유효값은 true이며,
 * opacity가 1이면 선 내부는 불투명하게 유지됩니다.
 * MSAA가 없는 렌더 대상에서도 같은 경계 필터를 사용합니다.
 * 색상 패스의 alphaToCoverage는 중복 감쇠를 막기 위해 false를 사용하고,
 * NoBlending 요청은 경계 합성이 가능한 NormalBlending으로 연결합니다.
 *
 * @group Geometry
 * @extends {LineMaterial}
 */
export class ULineMaterial extends LineMaterial {
    /**
     * 사용자 렌더 콜백과 독립적으로 선 AA 정보를 갱신하도록 연결합니다.
     * GeOnDT 앱은 자동 연결하며, 일반 Three.js renderer에서는 생성 후 한 번 호출하십시오.
     * 같은 연결을 반복하지 않으며 renderer.dispose() 시 자동으로 연결을 해제합니다.
     * 기존 renderer의 그리기와 해제 동작은 유지합니다.
     *
     * @param {import('three').WebGLRenderer} renderer AA를 적용할 renderer
     */
    static attachRenderer(renderer) {
        assertRenderer(renderer);
        // 실제 그리기 직전에 AA 값을 반영하여 사용자 콜백의 선언 방식과 분리합니다.
        INTERNAL.attachRenderer(renderer);
    }

    /**
     * renderer의 선 AA 연결을 해제합니다.
     * 연결이 없으면 변경하지 않으며 외부에서 교체한 그리기·해제 함수는 보존합니다.
     *
     * @param {import('three').WebGLRenderer} renderer 연결을 해제할 renderer
     */
    static detachRenderer(renderer) {
        assertRenderer(renderer);
        // 연결이 소유한 함수만 복원하며 이후에 추가된 외부 연결은 제거하지 않습니다.
        INTERNAL.detachRenderer(renderer);
    }

    /**
     * 색상 출력 상태와 경계 픽셀을 포함하는 vertex shader를 초기화합니다.
     *
     * @override
     *
     * @type {string}
     */
    vertexShader = INTERNAL.initializeMaterial(this, ULineMaterial.prototype.onBeforeRender);

    /**
     * 실선·점선의 외곽과 끝점에 공통 커버리지를 적용합니다.
     *
     * @override
     *
     * @type {string}
     */
    fragmentShader = INTERNAL.createFragmentShader(this.fragmentShader);

    /**
     * renderer 연결이 없는 기존 사용 경로의 AA 뷰포트를 갱신합니다.
     *
     * @override
     *
     * @param {import('three').WebGLRenderer} renderer 현재 renderer
     * @param {import('three').Scene} scene 현재 Scene
     * @param {import('three').Camera} camera 현재 카메라
     * @param {import('three').BufferGeometry} geometry 현재 geometry
     * @param {import('three').Object3D} object 현재 렌더 객체
     * @param {import('three').Group | null} group 현재 렌더 그룹
     */
    onBeforeRender(renderer, scene, camera, geometry, object, group) {
        INTERNAL.updateViewportFallback(this, renderer);
    }

    /**
     * 좌표 출력처럼 색상 혼합을 사용하지 않는 내부 패스를 전환합니다.
     *
     * @param {boolean} enabled 색상 출력용 AA 사용 여부
     */
    _setLineCoverageEnabled(enabled) {
        INTERNAL.setCoverageEnabled(this, enabled);
    }

    /**
     * 선 설정과 독립된 uniform, 색상 출력 모드를 복사합니다.
     * 사용자 정의 onBeforeCompile 콜백의 복사 계약은 기반 재질과 같습니다.
     *
     * @override
     *
     * @param {this} source 복사할 선 재질
     * @returns {this} 현재 재질
     */
    copy(source) {
        super.copy(source);
        INTERNAL.copyMaterialState(this, source);
        this.vertexShader = INTERNAL.createVertexShader(this.vertexShader);
        this.fragmentShader = INTERNAL.createFragmentShader(this.fragmentShader);
        return this;
    }
}
