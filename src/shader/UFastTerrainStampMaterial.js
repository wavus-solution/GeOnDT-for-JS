import {DoubleSide, MeshLambertMaterial, Vector3} from 'three';
import {INTERNAL} from '@union3d/shader/UFastTerrainStampMaterial.internal';

/**
 * ~extends import('three').MeshLambertMaterial <br>
 *
 * CPU가 확정한 지면 촬영 영역의 거리 snapshot과 선택적인 채움 gradient를 합성합니다.
 *
 * @group shader
 * @extends {MeshLambertMaterial}
 *
 * @private
 */
class UFastTerrainStampMaterial extends MeshLambertMaterial {
    /** @type {UFastTerrainStampMaterialUniforms} */
    #uniforms = INTERNAL.createUniforms();
    /** @type {import('three').Vector3} */
    #origin = new Vector3();
    /** @type {number} */
    #pages = 0;
    /** @type {boolean} 색 보간 코드는 실제 gradient 채움이 있을 때만 컴파일합니다. */
    #gradients = false;
    /** @type {Array<string>} 타일마다 page uniform 이름을 다시 만들지 않습니다. */
    #pageKeys = [];
    /**
     * 타일마다 같은 문자열을 조합하지 않도록 현재 shader 구성의 키를 보관합니다.
     *
     * @type {string}
     */
    #programKey = 'UFastTerrainStampMaterial_footprint3_0';
    /** @type {boolean} */
    _disposed = false;

    /** 기본 지형 합성과 독립 표시 검사를 위한 재질을 준비합니다. */
    constructor() {
        super({color: 0xffffff, transparent: true, depthTest: true, depthWrite: false, side: DoubleSide});
        this.name = 'UFastTerrainStampMaterial';
        this.forceSinglePass = true;
    }

    /**
     * 순서가 확정된 snapshot과 표현을 연결합니다. 도형 texture의 수명은 매니저가 소유합니다.
     *
     * @param {Array<UFastTerrainStampSnapshot>} records 표시 snapshot과 배열 위치
     * @param {import('three').Vector3} origin world 기준점
     * @param {Array<import('three').Texture>} textures 거리 snapshot 배열들
     * @param {UFastTerrainStampManagerState['composite']} [composite] 매니저가 소유하는 내부 채움 합성 자료이며 생략하면 도형별 평가만 사용
     */
    _setFootprints(records, origin, textures, composite) {
        if (this._disposed) return;
        const gradients = records.some(({row}) => row.type !== 'polyline' && row.gradientColor
            && (row.fillOpacity ?? row.opacity) > 0);
        if (this.#pages !== textures.length || this.#gradients !== gradients) {
            this.#pages = textures.length;
            this.#gradients = gradients;
            this.#pageKeys = textures.map((_, i) => 'u_fastFootprintPage' + i);
            this.#programKey = 'UFastTerrainStampMaterial_footprint3_' + this.#pages + (gradients ? '_gradient' : '');
            this.needsUpdate = true;
        }
        this.#origin.copy(origin);
        INTERNAL.writeFootprints(this.#uniforms, records, origin, textures, gradients);
        if(composite){
            const b=composite.bounds;
            this.#uniforms.u_fastCompositeFill.value=composite.fill.texture;
            this.#uniforms.u_fastCompositeMargin.value=composite.margin.texture;
            this.#uniforms.u_fastCompositeBounds.value.set(b.min.x-origin.x,b.min.y-origin.y,b.max.x-b.min.x,b.max.y-b.min.y);
            this.#uniforms.u_fastCompositeWidth.value.set(composite.maxPixelWidth,composite.maxMeterWidth,1);
        }else this.#uniforms.u_fastCompositeWidth.value.z=0;
    }

    /**
     * 큰 world 원점 차이를 CPU에서 계산해 좌표 정밀도를 보존합니다.
     *
     * @param {import('three').Object3D} object 실제 표시 지형
     * @param {import('three').WebGLRenderer} renderer 실제 렌더러
     * @param {UFastTerrainStampMaterialUniforms} [binding] 지형 메시가 보존하는 uniform이며 생략하면 독립 재질의 uniform
     */
    _setObject(object, renderer, binding = this.#uniforms) {
        const e = object.matrixWorld.elements;
        if (binding !== this.#uniforms) {
            // 타일 shader의 uniform 객체는 매니저가 삭제·재생성되어도 유지합니다.
            // 같은 GLSL program을 재사용할 때 onBeforeCompile이 생략되기 때문에
            // 종료된 매니저의 count=0과 texture를 계속 참조하지 않도록 값만 연결합니다.
            binding.u_fastFootprintCount.value = this.#uniforms.u_fastFootprintCount.value;
            binding.u_fastFootprintMetadata.value = this.#uniforms.u_fastFootprintMetadata.value;
            // 이 경로는 도형 갱신 때가 아니라 매 타일 draw마다 실행됩니다.
            // 고정 네 항목은 직접 연결하고 page 이름은 구성 변경 때만 만들어 GC를 줄입니다.
            binding.u_fastCompositeFill.value = this.#uniforms.u_fastCompositeFill.value;
            binding.u_fastCompositeMargin.value = this.#uniforms.u_fastCompositeMargin.value;
            binding.u_fastCompositeBounds.value = this.#uniforms.u_fastCompositeBounds.value;
            binding.u_fastCompositeWidth.value = this.#uniforms.u_fastCompositeWidth.value;
            for (const key of this.#pageKeys) {
                (binding[key] ??= {value:null}).value = this.#uniforms[key].value;
            }
        }
        binding.u_fastFootprintObjectRelative.value.set(e[12] - this.#origin.x,
            e[13] - this.#origin.y, e[14] - this.#origin.z);
        binding.u_fastFootprintPixelRatio.value = renderer.getPixelRatio();
    }

    /** @returns {UFastTerrainStampMaterialUniforms} 지형 메시 수명 동안 유지할 표시 binding */
    _createBinding() { return INTERNAL.createUniforms(); }

    /**
     * 매니저 수명과 독립적으로 지형 shader의 고정 구성과 uniform 연결을 유지합니다.
     *
     * @param {import('three').WebGLProgramParametersWithUniforms} shader 지형 shader
     * @param {UFastTerrainStampMaterialUniforms | undefined} binding 지형 메시 소유 uniform
     * @param {string} programKey 컴파일 시작 때 선택된 전체 program key
     * @returns {UFastTerrainStampMaterialUniforms | undefined} 지형 메시가 계속 보관할 binding
     */
    static _applyToTerrainShader(shader, binding, programKey) {
        // 종료·재생성과 비동기 준비를 거쳐도 선택된 shader와 표시 자료의 연결을 보존합니다.
        return INTERNAL.applyToTerrainShader(shader, binding, programKey);
    }

    /**
     * 실제 지형 재질에 채움·선 합성만 추가합니다.
     *
     * @param {import('three').WebGLProgramParametersWithUniforms} shader 지형 shader
     * @param {UFastTerrainStampMaterialUniforms} [binding] 같은 지형 메시의 모든 cached program이 공유할 uniform
     */
    _applyToShader(shader, binding = this.#uniforms) {
        // 직접 호출은 현재 구성을 쓰되 renderer가 고정한 key가 있으면 그 선택을 유지합니다.
        INTERNAL.applyToTerrainShader(shader, binding, shader.customProgramCacheKey ?? this.#programKey);
    }

    /** @returns {number} 현재 표시 snapshot 수 */
    _getCount() { return this.#uniforms.u_fastFootprintCount.value; }

    /**
     * 독립 FastMesh 검사용 shader를 연결합니다.
     *
     * @override
     *
     * @param {import('three').WebGLProgramParametersWithUniforms} shader 기본 shader
     * @param {import('three').WebGLRenderer} renderer 렌더러
     */
    onBeforeCompile(shader, renderer) {
        super.onBeforeCompile(shader, renderer);
        INTERNAL.injectShader(shader, this.#uniforms, this.#pages, true, this.#gradients);
    }

    /**
     * texture 배열 수와 Gradient 활성 여부가 바뀔 때 갱신한 키를 반환합니다.
     *
     * @override
     *
     * @returns {string} 현재 shader 구성의 program 구분 키
     */
    customProgramCacheKey() { return this.#programKey; }

    /** metadata만 소유하며 매니저 texture와 지형 geometry는 해제하지 않습니다. @override */
    dispose() {
        if (this._disposed) return;
        this._disposed = true;
        this.#uniforms.u_fastFootprintCount.value = 0;
        this.#uniforms.u_fastFootprintMetadata.value?.dispose();
        super.dispose();
    }
}

export {UFastTerrainStampMaterial};
