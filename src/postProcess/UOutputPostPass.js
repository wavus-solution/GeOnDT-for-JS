import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {OutputShader} from 'three/examples/jsm/shaders/OutputShader.js';

// 기존 밝기·대비 계산을 출력 변환 직전으로 옮긴다. AO가 켜지면 AO 합성 결과를 보정한다.
// 중간 HalfFloat 타깃을 한 번 덜 거치므로 반올림 차이는 있을 수 있다.
const POST_COLOR_TRANSFORM = /* glsl */`
    uniform bool usePost;
    uniform float contrast;
    uniform float brightness;

    vec3 geondtPostColor(vec3 color) {
        float Y = length(color);
        vec3 differContrast = color - 0.35;
        float isAboveContrastMark = step(0.35, Y);
        float isBelowMaxMark = step(Y, 0.8);
        float darkAdjustment = (0.35 - Y) * 0.10 * (1.0 - isAboveContrastMark);
        vec3 adjustedRGB = differContrast * (contrast + darkAdjustment) + 0.35;
        return mix(color, adjustedRGB, isBelowMaxMark) * brightness;
    }
`;

/**
 * ~extends import('three/examples/jsm/postprocessing/OutputPass.js').OutputPass <br>
 *
 * 밝기·대비 보정과 Three.js의 톤 매핑·출력 색 변환을 한 번에 처리합니다.
 * AO 뒤, sRGB 입력을 사용하는 FXAA 앞에 배치합니다.
 * 후처리 전체를 끄면 uniforms.usePost로 밝기·대비만 생략하고 출력 변환은 유지합니다.
 * renderer의 톤 매핑·노출·색 공간 변경과 렌더 타깃 처리는 상속한 OutputPass가 담당합니다.
 */
class UOutputPostPass extends OutputPass {
    #disposed = false;

    /**
     * 기존 보정식과 공식 출력 셰이더를 연결합니다.
     * Three.js 갱신으로 연결 지점이 바뀌면 조용히 효과를 누락하지 않고 실패합니다.
     *
     * @param {number} [contrast=1] 대비 계수이며 기존 설정과 같이 0은 적용하지 않음
     * @param {number} [brightness=1] 밝기 계수이며 기존 설정과 같이 0은 적용하지 않음
     * @throws {Error} 공식 OutputShader의 연결 구문이 변경된 경우
     */
    constructor(contrast = 1, brightness = 1) {
        const sample = 'gl_FragColor = texture2D( tDiffuse, vUv );';
        const main = 'void main()';
        if (!OutputShader.fragmentShader.includes(sample) || !OutputShader.fragmentShader.includes(main)) {
            throw new Error('OutputShader 구문이 변경되어 밝기·대비 통합 연결을 확인해야 합니다.');
        }
        super();
        // 완성된 화면의 색상만 보정하므로 출력 대상의 깊이를 검사하거나 덮어쓰지 않습니다.
        this.material.depthTest = false;
        this.material.depthWrite = false;
        this.uniforms.usePost = {value: true};
        this.uniforms.contrast = {value: 1};
        this.uniforms.brightness = {value: 1};
        this.setContrast(contrast);
        this.setBrightness(brightness);
        this.material.name = 'UOutputPostPass';
        this.material.fragmentShader = OutputShader.fragmentShader
            .replace(main, `${POST_COLOR_TRANSFORM}\n${main}`)
            .replace(sample, `${sample}
                if (usePost) gl_FragColor.rgb = geondtPostColor(gl_FragColor.rgb);
            `);
    }

    /**
     * 대비 계수를 다음 렌더에 적용합니다. 기존 설정의 0 무시 동작을 유지합니다.
     *
     * @param {number} contrast 대비 계수
     */
    setContrast(contrast) {
        if (contrast) this.uniforms.contrast.value = contrast;
    }

    /**
     * 밝기 계수를 다음 렌더에 적용합니다. 기존 설정의 0 무시 동작을 유지합니다.
     *
     * @param {number} brightness 밝기 계수
     */
    setBrightness(brightness) {
        if (brightness) this.uniforms.brightness.value = brightness;
    }

    /**
     * 적용 중인 대비 계수를 반환합니다.
     *
     * @returns {number} 현재 대비 계수
     */
    getContrast() { return this.uniforms.contrast.value; }

    /**
     * 적용 중인 밝기 계수를 반환합니다.
     *
     * @returns {number} 현재 밝기 계수
     */
    getBrightness() { return this.uniforms.brightness.value; }

    /**
     * 소유한 출력 재질과 화면 사각형을 한 번만 해제합니다.
     *
     * @override
     */
    dispose() {
        if (this.#disposed) return;
        this.#disposed = true;
        super.dispose();
    }
}

export {UOutputPostPass};
