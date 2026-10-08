import {NearestFilter, RepeatWrapping} from 'three';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {FXAAShader} from 'three/examples/jsm/shaders/FXAAShader.js';

/**
 * ~extends import('three/examples/jsm/postprocessing/ShaderPass.js').ShaderPass <br>
 *
 * 공식 FXAA 계산 결과에 Dither를 이어 적용하는 화면 전체 패스입니다.
 * OutputPass 뒤에 배치하며 uniforms.useDither로 Dither만 켜고 끌 수 있습니다.
 * 후처리 전체를 끄면 소유 렌더러가 이 패스를 Composer에서 제외합니다.
 * 해상도 uniform은 렌더러가 실제 화면 크기와 fxaaSharpness로 설정합니다.
 */
class UFxaaDitherPass extends ShaderPass {
    #disposed = false;

    /**
     * FXAA 셰이더를 상속한 그리기 흐름에 연결하고 공유 노이즈 텍스처를 빌립니다.
     * 노이즈 텍스처의 반복·최근접 샘플링 설정을 적용하며 소유권은 넘겨받지 않습니다.
     *
     * @param {import('three').Texture} blueNoiseTexture 기존 256×256 블루노이즈 텍스처
     * @param {number} [noiseStrength=1/255] 출력 RGB에 더할 노이즈 진폭
     * @throws {TypeError} 텍스처 또는 유한한 진폭이 아닌 경우
     */
    constructor(blueNoiseTexture, noiseStrength = 1 / 255) {
        if (!blueNoiseTexture?.isTexture || !Number.isFinite(noiseStrength)) {
            throw new TypeError('블루노이즈 Texture와 유한한 noiseStrength가 필요합니다.');
        }
        // 공식 main을 함수로 재사용하므로 FXAA 내부의 조기 반환 경로도 그대로 유지된다.
        // Dither는 그 함수가 끝난 뒤 한 번만 실행하고 알파 채널은 바꾸지 않는다.
        super({
            ...FXAAShader,
            name: 'UFxaaDitherPass',
            fragmentShader: `
                #define main geondtFxaaMain
                ${FXAAShader.fragmentShader}
                #undef main
                uniform bool useDither;
                uniform sampler2D uBlueNoiseTex;
                uniform float uTime;
                uniform float noiseStrength;
                void main() {
                    geondtFxaaMain();
                    if (useDither) {
                        vec2 noiseUV = mod(gl_FragCoord.xy + uTime * vec2(17.0, 31.0), 256.0) / 256.0;
                        float noise = texture2D(uBlueNoiseTex, noiseUV).r;
                        gl_FragColor.rgb += (noise - 0.5) * noiseStrength;
                    }
                }
            `
        });
        // 화면 전체 색상 처리에서 깊이를 남기면 뒤에 덧그리는 객체의 가림 판정에 섞입니다.
        this.material.depthTest = false;
        this.material.depthWrite = false;
        blueNoiseTexture.wrapS = blueNoiseTexture.wrapT = RepeatWrapping;
        blueNoiseTexture.minFilter = blueNoiseTexture.magFilter = NearestFilter;
        // ShaderPass 생성 뒤 연결하여 공유 텍스처를 UniformsUtils.clone으로 복제하지 않는다.
        this.uniforms.useDither = {value: true};
        this.uniforms.uBlueNoiseTex = {value: blueNoiseTexture};
        this.uniforms.uTime = {value: 0};
        this.uniforms.noiseStrength = {value: noiseStrength};
    }

    /**
     * Dither를 사용하는 프레임의 노이즈 이동 시각을 초 단위로 갱신합니다.
     */
    updateState() {
        if (this.uniforms.useDither.value) this.uniforms.uTime.value = performance.now() * 0.001;
    }

    /**
     * 소유한 재질과 화면 사각형을 한 번만 해제합니다. 공유 노이즈 텍스처는 유지합니다.
     *
     * @override
     */
    dispose() {
        if (this.#disposed) return;
        this.#disposed = true;
        super.dispose();
    }
}

export {UFxaaDitherPass};
