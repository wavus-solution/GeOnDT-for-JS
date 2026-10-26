import {OutlinePass} from '@union3d/lib/three/postprocessing/OutlinePass';
import {Pass} from '@union3d/lib/three/postprocessing/Pass';
import {getOutlineMaterial} from "@union3d/shader/GOutLineShader";
import {INTERNAL} from '@union3d/postProcess/UOutlinePass.internal';
import {
    ClampToEdgeWrapping,
    Color,
    DataTexture,
    InstancedBufferAttribute,
    NearestFilter,
    NormalBlending,
    Mesh,
    PlaneGeometry,
    Scene,
    RGBAFormat,
    UnsignedByteType,
    Vector2,
    WebGLRenderTarget,
} from "three";

const OutlineMode = {
    BASIC: 1,
    BOUNCE: 2,
    FLOW: 3,
    BLOOM: 4
};

const STYLE_DASH_DENSITY_MAX = 100;
const STYLE_DASH_SPEED_MAX = 10;
const STYLE_TIME_OFFSET_MAX = 10;
const STYLE_TEX_ROWS = 4;
const STYLE_BOUNCE_SPEED_MAX = 10;
const STYLE_GLOW_INTENSITY_MAX = 5;
const STYLE_LINEWIDTH_SCALE_MAX = 10;

/**
 * A pass for rendering outlines around selected objects.
 *
 * ```js
 * const resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );
 * const outlinePass = new OutlinePass( resolution, scene, camera );
 * composer.addPass( outlinePass );
 * ```
 *
 * @extends {OutlinePass}
 * @three_import import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
 */
class UOutlinePass extends OutlinePass {
    #time = 0;
    /**
     * 간략 외곽 옵션을 검증·복사하며 잘못된 타입·수치는 TypeError·RangeError로 전달합니다.
     *
     * @param {import('@union3d/select/U3dObjectBarrier').UOutlineStyleOption} style 입력 스타일
     * @returns {import('@union3d/select/U3dObjectBarrier').UOutlineStyleOption} 간략 외곽 옵션을 복사한 스타일
     */
    static _normalizeStyle(style) {
        if (style.farPoint === undefined || style.farPoint === null) return style;
        const option = style.farPoint;
        if (typeof option !== 'object' || Array.isArray(option)) throw new TypeError('farPoint는 옵션 객체여야 합니다.');
        if (option.enabled !== undefined && typeof option.enabled !== 'boolean') throw new TypeError('farPoint.enabled는 boolean이어야 합니다.');
        const legacyThresholds = option.thresholdSizePx === undefined && (option.enterSizePx !== undefined || option.exitSizePx !== undefined);
        const thresholds = legacyThresholds
            ? {enterSizePx: option.enterSizePx ?? 16, exitSizePx: option.exitSizePx ?? 24}
            : {thresholdSizePx: option.thresholdSizePx ?? 16};
        const minSizePx = option.minSizePx ?? option.pointSizePx ?? 12;
        const simplifyTolerancePx = option.simplifyTolerancePx ?? 2;
        const legacySize = option.pointSizePx === undefined ? {} : {pointSizePx: option.pointSizePx};
        const cssWidth = option.lineWidthPx === undefined ? {} : {lineWidthPx: option.lineWidthPx};
        for (const [name, value] of Object.entries({...thresholds, ...legacySize, ...cssWidth, minSizePx, simplifyTolerancePx})) {
            if (typeof value !== 'number') throw new TypeError(`farPoint.${name}은 숫자여야 합니다.`);
            if (!Number.isFinite(value) || value <= 0) throw new RangeError(`farPoint.${name}은 양수·유한수여야 합니다.`);
        }
        if (legacyThresholds && thresholds.enterSizePx >= thresholds.exitSizePx) throw new RangeError('farPoint.enterSizePx는 exitSizePx보다 작아야 합니다.');
        if (option.group !== undefined && !option.group?.isObject3D) throw new TypeError('farPoint.group은 Object3D여야 합니다.');
        return {...style, farPoint: Object.freeze({enabled: option.enabled ?? false, ...thresholds, ...cssWidth, minSizePx, simplifyTolerancePx, group: option.group})};
    }

    /** @type {number} 활성 외곽의 기본 CSS 두께이며 명시적 setLineWidth 호출로 갱신합니다. */
    #farPointLineWidth = 1.5;
    /** @type {UOutlineFarPointRenderer | undefined} */
    #farPoints;
    /** @type {UOutlineFarPointFrame | undefined} */
    #farPointFrame;
    #farPointStyleCount = 0;
    /** @type {Array<import('three').Object3D>} */
    #farPointRoots = [];
    /** @type {Promise<boolean> | undefined} */
    #prewarmTask;
    /** @type {UOutlineFarPointRenderer | undefined} */
    #prewarmFarPoints;
    #disposed = false;
    /** 마스크 셰이더에 적용한 투영 종류입니다. @type {boolean} */
    #maskPerspective;
    /**
     * Constructs a new outline pass.
     *
     * @param {import('three').Vector2 | undefined} resolution - The effect's resolution.
     * @param {import('three').Scene} scene - The scene to render.
     * @param {import('three').Camera} camera - The camera.
     * @param {Array<import('three').Object3D> | undefined} selectedObjects - The selected 3D objects that should receive an outline.
     * @param {import('@U3dApp').U3dApp} app U3dApp 객체
     *
     */
    constructor( resolution, scene, camera, selectedObjects, app ) {

        super(resolution, scene, camera, selectedObjects);

        this._styleIdByObject = new WeakMap(); // 일반 object style id
        this._styleIdByInstancedMesh = new WeakMap(); // instanced mesh style id
        this._instanceStyleTexByInstancedMesh = new WeakMap(); //instanced Mesh style
        this._freeStyleIds = [];
        this._nextStyleId = 1;
        this._styleCapacity = 0;
        this._styleTexture = null;
        this._setStyleFlag = false;

        this._tmpStyleVis = new Color();
        this._tmpStyleHid = new Color();
        this._tmpStyleDash = new Color();

        this._styleMap = new Map(); //스타일 저장 확인용

        this.edgeStrength = 2; // 외곽선 최종 밝기 배율 (1이면 원본 색상 그대로, 높을수록 더 밝고 진하게)
        this.edgeGlow = 0.2; // 블러된 버퍼를 얼마나 합성하냐 수치 (0이면 번짐 없음, 높을수록 외곽선 주변이 퍼져보임)
        this.edgeThickness = 3; // 외곽선 자체 두께
        this.visibleEdgeColor.set('#000000');
        this.hiddenEdgeColor.set('#000000');
        this.lineWidth = 5;
        this._app = app;
        this._layerVisibleMap = new Map();
        this._maskRenderObjects = []; //렌더링시에 mask 대상 선별용
        this._maskRenderStyleIds = []; //렌더링시에 mask 대상 선별용

        this.#applyNearestFiltersToOutlineTargets(); // pixel 탐색시 보간 작업이 필요해서 설정

        if (this.depthMaterial) {
            this.depthMaterial.name = 'OutlineDepthMaterial';
            // depth pass는 scene.overrideMaterial로 씬 전체를 한 번에 그리므로 대상별로 material을 나눌 수 없다.
            // MeshDepthMaterial은 ShaderMaterial과 달리 defines/uniforms를 renderer가 program마다 새로 만들어 쓰고
            // 이 pass가 직접 uniform을 갱신하지도 않아, InstancedMesh2 패치가 남아도 일반 오브젝트에 영향을 주지 않는다.
            this.depthMaterial._isInstanceMaterial = true;
        }

        if (this.prepareMaskMaterial) {
            this.prepareMaskMaterial.name = 'OutlineMaskMaterial';
        }

        // InstancedMesh2(UInstancedMesh)는 렌더 직전에 material의 defines/uniforms/onBeforeCompile을 직접 교체한다.
        // 마스크 material은 ShaderMaterial이라 그 교체가 material 인스턴스에 그대로 남고
        // (특히 renderer가 들고 있는 uniforms 참조가 인스턴싱용 캐시 객체로 바뀐 뒤 복원되지 않는다),
        // 뒤이어 그려지는 일반 mesh가 인스턴싱 셰이더 상태를 물려받아 형상이 어긋난다.
        // 인스턴스 전용 마스크 material을 따로 두고 `_isInstanceMaterial`도 여기에만 붙여 오염 자체를 막는다.
        this.prepareMaskMaterialInstanced = this.#createInstancedMaskMaterial();
        this.#maskPerspective = 'isPerspectiveCamera' in camera && camera.isPerspectiveCamera === true;

        this.#ensureStyleCapacity( 256 ); // style 용량 초기 설정
        // mask buffer에 styleId(및 renderOrder 적용 forceVisible)를 기록할 수 있도록 셰이더/유니폼을 패치
        this.#patchPrepareMaskMaterialForStyleId(this.prepareMaskMaterial);
        this.#patchPrepareMaskMaterialForStyleId(this.prepareMaskMaterialInstanced);

        if(this.overlayMaterial){
            this.overlayMaterial.name = 'OutlineOverlayMaterial';
            this.overlayMaterial.blending = NormalBlending; // 진하게 표현
        }

        if(this.edgeDetectionMaterial){
            this.edgeDetectionMaterial.name = 'GOutLineShaderMaterial';
        }else{
            this.edgeDetectionMaterial = getOutlineMaterial();
        }

        this.setMode(OutlineMode.BASIC);// BASIC, BOUNCE, FLOW, BLOOM
        const lineWidth = this.edgeDetectionMaterial?.uniforms?.lineWidth;
        if (lineWidth) {
            this.edgeDetectionMaterial.uniforms.lineWidth.value = this.lineWidth;
        }

        this._renderOrderCache = {
            hasRenderOrder: false,
            dirty: true
        };

        this._instancedOrderCache = new Map(); // object.uuid → {1:[],2:[],3:[]}

    }

    /**
     * 현재 렌더 카메라와 두 마스크의 깊이 변환 방식을 동기화합니다.
     * 선택·스타일·활성 상태는 유지하며 투영 종류가 바뀔 때만 셰이더를 갱신합니다.
     * @param {import('three').Camera} camera 이번 프레임의 카메라
     * @returns {void}
     */
    updateState(camera) {
        if (this.#disposed) return;
        this.renderCamera = camera;
        const perspective = 'isPerspectiveCamera' in camera && camera.isPerspectiveCamera === true;
        if (perspective === this.#maskPerspective) return;
        const conversion = perspective ? 'perspectiveDepthToViewZ' : 'orthographicDepthToViewZ';
        for (const material of this.#getMaskMaterials()) {
            const shader = material.fragmentShader.replace(/\b(?:perspective|orthographic)DepthToViewZ\b/g, conversion);
            if (shader === material.fragmentShader) continue;
            material.fragmentShader = shader;
            material.needsUpdate = true;
        }
        this.#maskPerspective = perspective;
    }

    /**
     * 공통 외곽 셰이더를 화면 출력 없이 미리 준비하며 실제 선택·장면은 변경하지 않습니다.
     * 독자 인스턴싱·스킨·모프 셰이더 변형은 해당 형상의 실제 렌더에서 준비합니다.
     * @param {import('three').WebGLRenderer} renderer 패스를 소유한 렌더러
     * @returns {Promise<boolean>} 준비 성공 여부. 미지원·해제·실패 시 기존 렌더 경로를 유지합니다.
     * @ignore
     */
    _prewarm(renderer) {
        if (this.#disposed || typeof renderer.compileAsync !== 'function') return Promise.resolve(false);
        if (this.#prewarmTask) return this.#prewarmTask;
        this.#prewarmFarPoints = INTERNAL.createFarPoints();
        const materials = [this.depthMaterial, this.prepareMaskMaterial, this.edgeDetectionMaterial,
            this.separableBlurMaterial1, this.separableBlurMaterial2, this.overlayMaterial, this.materialCopy,
            ...this.#prewarmFarPoints._getPrewarmMaterials()];
        const geometry = new PlaneGeometry(2, 2);
        // 전체 화면 삼각형은 normal 속성이 없어 동일한 셰이더 변형을 준비해야 프로그램이 재사용됩니다.
        const screenGeometry = geometry.clone().deleteAttribute('normal');
        const scene = new Scene();
        for (const material of materials.slice(1)) scene.add(new Mesh(material === this.prepareMaskMaterial ? geometry : screenGeometry, material));
        const depthScene = new Scene();
        depthScene.add(new Mesh(geometry, this.depthMaterial));
        // 화면 출력과 후처리는 프로그램의 출력 색 공간이 달라 실제 패스와 같은 타깃 문맥으로 컴파일합니다.
        const target = new WebGLRenderTarget(1, 1, {depthBuffer: false, stencilBuffer: false});
        const previous = renderer.getRenderTarget();
        const cubeFace = renderer.getActiveCubeFace?.() ?? 0, mipLevel = renderer.getActiveMipmapLevel?.() ?? 0;
        const compilations = [];
        try {
            renderer.setRenderTarget(target);
            compilations.push(renderer.compileAsync(scene, this.renderCamera));
            // 깊이 패스의 키에는 장면 조명 개수도 들어가므로 실제 장면 문맥으로 준비합니다.
            compilations.push(renderer.compileAsync(depthScene, this.renderCamera, this.renderScene));
        } catch (error) {
            compilations.push(Promise.reject(error));
        } finally {
            renderer.setRenderTarget(previous, cubeFace, mipLevel);
        }
        this.#prewarmTask = Promise.all(compilations).then(() => {
            if (this.#disposed) return false;
            // 링크 완료 뒤 지연된 uniform 조회까지 끝내 최초 선택에서 드라이버를 기다리지 않게 합니다.
            for (const material of materials) {
                const state = /** @type {{programs?: Map<string, {getUniforms: () => unknown}>}} */(renderer.properties.get(material));
                for (const program of state.programs?.values() ?? []) program.getUniforms();
            }
            return true;
        }).catch(() => false).finally(() => {
            geometry.dispose();
            screenGeometry.dispose();
            target.dispose();
            scene.clear();
            depthScene.clear();
        });
        return this.#prewarmTask;
    }
    // InstancedMesh barrierInstances 중 "특정 인덱스들만" outline mask에 찍기 위한 렌더링 헬퍼
    // renderOrder 레이어별로 인스턴스를 필터링할 때 사용합니다.
    /**
     * 지정한 인스턴스만 마스크에 출력하고 원래 가시성을 복원합니다.
     * @param {import('three').WebGLRenderer} renderer 마스크 렌더러
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} selectedObject 공유 메시
     * @param {Array<number>} indices 출력 인덱스
     */
    #setInstancedMeshPrepareWithIndices(renderer, selectedObject, indices){
        const self = this;
        const instancedMesh = selectedObject;
        const instances = Array.isArray(indices) ? indices : instancedMesh.getBarrierInstances();
        if(!selectedObject.instances) return;
        const cache = new WeakMap();
        for (let i = 0; i <  selectedObject.instances.length; i++) {

            const instance = selectedObject.instances[i];
            if(!selectedObject.getActiveAndVisibilityAt(i)) continue;
            cache.set(instance, selectedObject.getVisibilityAt(i));
            selectedObject.setVisibilityAt(i, false);
        }

        renderer.render( instancedMesh, self.renderCamera );

        for (let i = 0; i <  instances.length; i++) {
            const idx =  instances[i];
            const instance = selectedObject.instances[idx];
            if(!cache.get(instance)) continue;
            selectedObject.setVisibilityAt(idx, true);
        }
        renderer.render( instancedMesh, self.renderCamera );

        for (let i = 0; i <  selectedObject.instances.length; i++) {
            if(!selectedObject.getActiveAt(i)) continue;
            const instance = selectedObject.instances[i];
            if(!cache.has(instance)) continue;
            selectedObject.setVisibilityAt(i, cache.get(instance));
        }

    }

    // styleId에 저장된 style(renderOrder)를 읽어 1 ~ 3 범위로 정규화합니다.
    // 0은 "renderOrder 미사용(기존 OutlinePass 동작)"을 의미합니다.
    #getRenderOrderFromStyleId(styleId) {
        const styleMap = this._styleMap.get(styleId);
        const renderOrder = styleMap?.renderOrder;
        const order = Number(renderOrder);
        if (!Number.isFinite(order)) return 0;
        const i = order | 0;
        if (i < 1) return 1;
        if (i > 3) return 3;
        return i;
    }

    // InstancedMesh의 특정 instanceIndex에 매핑된 styleId를 통해 renderOrder를 얻습니다.
    #getRenderOrderForInstance(instancedMesh, instanceIndex) {
        if (!instancedMesh) return 0;
        const styleMap = this._styleIdByInstancedMesh.get(instancedMesh);
        const styleId = styleMap?.get(instanceIndex | 0) ?? 0;
        return this.#getRenderOrderFromStyleId(styleId);
    }

    setSize(width, height) {
        super.setSize(width, height);
        this.#applyNearestFiltersToOutlineTargets();
    }

    #applyNearestFiltersToOutlineTargets() {
        const setNearest = (rt) => {
            const tex = rt?.texture;
            if (!tex) return;
            tex.minFilter = NearestFilter;
            tex.magFilter = NearestFilter;
        };

        setNearest(this.renderTargetDepthBuffer);
        setNearest(this.renderTargetMaskBuffer);
        setNearest(this.renderTargetMaskDownSampleBuffer);
    }

    /**
     * 전체 선 두께를 변경하며 활성 farPoint에는 양수 값을 CSS 픽셀로 적용합니다.
     *
     * @param {number} width 선 두께. 유한수가 아니면 기존 값을 유지합니다.
     */
    setLineWidth(width) {
        if(!Number.isFinite(width)) return;
        if (!this.edgeDetectionMaterial) {
            this.edgeDetectionMaterial = getOutlineMaterial();
        }

        this.lineWidth = width;
        if (width > 0) this.#farPointLineWidth = width;
        if (this.edgeDetectionMaterial.uniforms?.lineWidth) {
            this.edgeDetectionMaterial.uniforms.lineWidth.value = this.lineWidth;
        }
    }

    setMode(mode) {
        const validModes = Object.values(OutlineMode);
        if (!validModes.includes(mode)) return;

        this.mode = mode;

        if (!this.edgeDetectionMaterial) {
            this.edgeDetectionMaterial = getOutlineMaterial();
        }
    }

    getMode() {
        return this.mode;
    }

    addSelectedObject(object){
        const self = this;
        if(!(self.selectedObjects.includes(object)))
            self.selectedObjects.push(object);
        if(!self.enabled)
            self.enabled = true;
    }
    removeSelectedObject(object){
        const self = this;

        const index = self.selectedObjects.indexOf(object);
        if(index > -1)
            self.selectedObjects.splice(index, 1);

        if(self.enabled && self.selectedObjects.length === 0)
            self.enabled = false;
        this.#invalidateFarPoints(object);
    }

    /**
     * 기반 패스와 간략 윤곽 출력의 소유 자원을 해제합니다.
     *
     * @override
     */
    dispose(){
        if (this.#disposed) return;
        this.#disposed = true;
        this.#prewarmFarPoints?._dispose();
        this.#prewarmFarPoints = undefined;
        this.#farPoints?._dispose();
        this.#farPoints = undefined;
        this.#farPointFrame = undefined;
        this.#farPointRoots.length = 0;
        super.dispose()

        this.renderTargetMaskBuffer = undefined;
        this.renderTargetDepthBuffer = undefined;
        this.renderTargetMaskDownSampleBuffer = undefined;
        this.renderTargetBlurBuffer1 = undefined;
        this.renderTargetBlurBuffer2 = undefined;
        this.renderTargetEdgeBuffer1 = undefined;
        this.renderTargetEdgeBuffer2 = undefined;

        this.depthMaterial = undefined;
        this.prepareMaskMaterial = undefined;
        // clone으로 만든 전용 material은 부모 dispose() 대상이 아니므로 직접 해제한다.
        this.prepareMaskMaterialInstanced?.dispose?.();
        this.prepareMaskMaterialInstanced = undefined;
        this.edgeDetectionMaterial = undefined;
        this.separableBlurMaterial1 = undefined;
        this.separableBlurMaterial2 = undefined;
        this.overlayMaterial = undefined;
        this.materialCopy = undefined;

        this._fsQuad = undefined;
    }
    getEdgeColor(){
        return this.visibleEdgeColor;
    }

    /** 전체 등록을 비우고 간략 윤곽 전용 참조·자원과 객체 스타일을 정리합니다. */
    clearSelectedObjects(){
        this.#farPoints?._dispose();
        this.#farPoints = undefined;
        this.#farPointFrame = undefined;
        this.#farPointRoots.length = 0;
        const prevSelected = this.selectedObjects;
        this.selectedObjects = [];
        this._selectionCache.clear();
        this._visibilityCache.clear();

        // merged mesh(부분 선택) 계열은 object._pickMaterials가 남아있으면
        // 다음 선택에서 이전 pick이 다시 outline 대상에 포함될 수 있으므로 clear 시점에 정리합니다.
        // (outline 스타일(styleId)도 함께 반환하여 styleId 재사용/누수를 줄입니다.)
        const cleanupOne = (obj) => {
            if (!obj) return;

            // 객체 자체 styleId 반환
            this.clearOutlineStyleForObject?.(obj);

            // 부분 선택 배열 초기화
            if (obj._pickMaterials && Array.isArray(obj._pickMaterials)) {
                obj._pickMaterials.length = 0;
            }
        };

        if (prevSelected && prevSelected.length > 0) {
            for (let i = 0; i < prevSelected.length; i++) {
                const obj = prevSelected[i];
                cleanupOne(obj);

                // Group 선택의 경우 자식 mesh에 pick/style이 붙어 있을 수 있어 함께 정리
                if (obj?.isGroup && obj?.traverse) {
                    obj.traverse((child) => {
                        if (!child || child === obj) return;
                        if (!(child.isMesh || child.isSkinnedMesh || child.isInstancedMesh)) return;
                        cleanupOne(child);
                    });
                }
            }
        }
    }


    getSelectedObjects(){
        return this.selectedObjects;
    }

    getSelectedBlending(){
        if(this.overlayMaterial){
            return this.overlayMaterial.blending;
        }
    }

    setSelectedBlending(blending){
        if(this.overlayMaterial){
            this.overlayMaterial.blending = blending;
        }
    }


    /** 기존 등록의 선택·깊이 캐시와 메시별 등록 루트 정보를 함께 갱신합니다. @returns {void} */
    _updateSelectionCache() {
        const layerVisibleCache = this._layerVisibleMap;
        layerVisibleCache.clear();

        this.#removeParentsOfInvalidMeshes();

        const cache = this._selectionCache;
        cache.clear();
        const renderObjects = this._maskRenderObjects;
        const renderStyleIds = this._maskRenderStyleIds;
        this.#farPointRoots.length = 0;
        renderObjects.length = 0;
        renderStyleIds.length = 0;

        const gatherSelectedMeshesCallBack = (object, root) => {
            //  유효한 객체들만 순회하므로, 여기서 메쉬인지 여부만 확인하면 됩니다.
            if (object.isMesh && object.parent) {
                cache.add(object);
                renderObjects.push(object);
                renderStyleIds.push(this.#getEffectiveStyleId(object));
                this.#farPointRoots.push(root);
            }
        };

        for (const selectedObject of this.selectedObjects) {
            selectedObject.traverse(object => gatherSelectedMeshesCallBack(object, selectedObject));
        }
        this._renderOrderCache.dirty = true;
        this._instancedOrderCache.clear();
    }
    /**
     * selectedObjects 배열을 검사하여,
     * 유효하지 않은 자식 메쉬(geometry 또는 material이 없는)를 가진 부모 객체를 제거합니다.
     * @private
     */
    #removeParentsOfInvalidMeshes() {
        const self = this;
        const shouldKeepObject = (selectedObject) => {
            if (!selectedObject || selectedObject._disposed || selectedObject._sleeping) {
                return false;
            }

            let hasInvalidChild = false;
            selectedObject.traverse((child) => {
                if (hasInvalidChild) {
                    return;
                }
                let layerVisible = true;
                if(child.getLayerName){
                    const layerName = child.getLayerName();
                    if(!(self._layerVisibleMap.has(layerName))){
                        const layer = self._app.getLayerByName(layerName);
                        if(layer && layer.getVisible){
                            self._layerVisibleMap.set(layerName, layer.getVisible());
                        }
                    }
                    layerVisible = self._layerVisibleMap.get(layerName) ?? true;
                }

                if (child.isMesh && (!child.geometry || !child.material || (!layerVisible))) { // dispose 대상 제거
                    hasInvalidChild = true;
                }
            });

            return !hasInvalidChild;
        };
        this.selectedObjects = this.selectedObjects.filter(shouldKeepObject);
        this.enabled = this.selectedObjects.length > 0;
    }

    /**
     * 외곽선 검출 재질을 GOutLineShader 재질로 대체합니다. 부모 OutlinePass 생성자가 호출하며,
     * 재질 생성은 mode와 무관하므로 생성자 시점에 바로 만듭니다.
     *
     * @override
     *
     * @returns {import('three').ShaderMaterial} 외곽선 셰이더 재질
     */
    _getEdgeDetectionMaterial() {
        return getOutlineMaterial();
    }


    /**
     * 대상의 style 지정하는 함수.
     * - visible/hidden/dash 색상을 모두 동일하게 쓰고 싶을 때 `{ color }`만 전달하면 됩니다.
     *
     * @param {import('three').Object3D} object outline 스타일을 적용할 대상
     * @param {object} [style] 기존 외곽선 옵션과 {@link UOutlineFarPointOption} 형태의 farPoint. 생략하면 직접 스타일을 대체합니다.
     * @returns {number} styleId
     */
    setOutlineStyleForObject(object, style = {}) {
        if (!object) return 0;
        // 간략 윤곽 옵션을 검증·복사하여 입력 변경과 선택 스타일 백업이 섞이지 않게 합니다.
        style = UOutlinePass._normalizeStyle(style);

        let styleId = this._styleIdByObject.get(object);
        if (styleId === undefined) {
            styleId = this.#allocateStyleId();
            this._styleIdByObject.set(object, styleId);
        }


        // 오브젝트별 스타일은 styleTexture에 패킹하여 GPU에서 조회
        // style 객체는 CPU 캐시(_styleMap)에도 저장해 getOutlineStyle*에서 빠르게 반환합니다.
        this.#writeStyle(styleId, style);
        this._setStyleFlag = true;
        return styleId;
    }

    getOutlineStyleForObject(object, effective = true) {
        const self = this;
        if (!object) return null;

        const styleId = effective ? this.#getEffectiveStyleId(object) : (this._styleIdByObject.get(object) ?? 0);
        if (!effective && !this._styleIdByObject.has(object)) return null;

        // effective=true면 부모 체인까지 탐색한 "실제 적용될 styleId" 기준으로 반환합니다.
        return self._styleMap.get(styleId);
    }

     /**
      * 오브젝트(outline 대상)마다 개별 색상을 간단히 지정하는 compact helper 입니다.
      * - visible/hidden/dash 색상을 모두 동일하게 쓰고 싶을 때 `{ color }`만 전달하면 됩니다.
      *
      * @param {import('three').Object3D} object outline 스타일을 적용할 대상
      * @param {import('three').ColorRepresentation} color 적용할 색상
      * @param {object} [style] pulse/dash 옵션 등 추가 스타일(기본: color만 적용)
      * @return {number} styleId
      */
     setOutlineColorForObject(object, color, style = {}) {
         return this.setOutlineStyleForObject(object, { ...style, color });
     }

    #getOrCreateInstanceStyleIdMap(instancedMesh) {
        let map = this._styleIdByInstancedMesh.get(instancedMesh);
        if (!map) {
            map = new Map();
            this._styleIdByInstancedMesh.set(instancedMesh, map);
        }
        return map;
    }

    #ensureInstanceStyleIdAttribute(instancedMesh) {
        const geometry = instancedMesh?.geometry;
        if (!geometry) return null;

        const count = (instancedMesh.capacity ?? instancedMesh.count ?? instancedMesh.instanceMatrix?.count ?? 0) | 0;
        if (count <= 0) return null;

        const existing = geometry.getAttribute('instanceStyleId');
        if (existing && existing.count >= count) return existing;

        const arr = new Float32Array(count);
        if (existing?.array) {
            const prev = existing.array;
            arr.set(prev.subarray(0, Math.min(prev.length, arr.length)));
        }
        const attr = new InstancedBufferAttribute(arr, 1);
        geometry.setAttribute('instanceStyleId', attr);
        return attr;
    }

    #ensureInstanceStyleIdTexture(instancedMesh) {
        const capacity = (instancedMesh?.capacity ?? instancedMesh?.getCount?.() ??  instancedMesh?.count) | 0;
        if (capacity <= 0) return null;

        const existing = this._instanceStyleTexByInstancedMesh.get(instancedMesh);
        const prevTex = existing?.texture;
        const prevCap = existing?.capacity ?? 0;
        if (prevTex && prevCap >= capacity) return prevTex;

        const nextCap = Math.max(capacity, prevCap || 0);
        const prevArr = prevTex?.image?.data;
        const arr = new Uint8Array(nextCap * 4);
        if (prevArr) arr.set(prevArr.subarray(0, Math.min(prevArr.length, arr.length)));

        const texture = new DataTexture(arr, nextCap, 1, RGBAFormat, UnsignedByteType);
        texture.minFilter = NearestFilter;
        texture.magFilter = NearestFilter;
        texture.wrapS = ClampToEdgeWrapping;
        texture.wrapT = ClampToEdgeWrapping;
        texture.needsUpdate = true;

        this._instanceStyleTexByInstancedMesh.set(instancedMesh, { texture, capacity: nextCap });
        return texture;
    }

    /**
     * 인스턴스별 외곽선 스타일을 지정합니다. 간략 윤곽 옵션의 잘못된 타입·수치는 TypeError·RangeError입니다.
     *
     * @param {import('three').InstancedMesh} instancedMesh 공유 메시
     * @param {number} instanceIndex 실제 인덱스
     * @param {object} [style] 기존 외곽선 옵션과 {@link UOutlineFarPointOption} 형태의 farPoint
     * @returns {number} 스타일 ID. 대상·인덱스가 유효하지 않으면 0
     */
    setOutlineStyleForInstance(instancedMesh, instanceIndex, style = {}) {
        if (!instancedMesh || instanceIndex === undefined || instanceIndex === null) return 0;

        const idx = instanceIndex | 0;
        if (idx < 0) return 0;
        // 직접 설정과 배리어 설정에 같은 간략 윤곽 옵션 검증·복사 계약을 적용합니다.
        style = UOutlinePass._normalizeStyle(style);

        const map = this.#getOrCreateInstanceStyleIdMap(instancedMesh);
        let styleId = map.get(idx);
        if (styleId === undefined) {
            styleId = this.#allocateStyleId();
            map.set(idx, styleId);
        }

        this.#writeStyle(styleId, style);
        this._setStyleFlag = true;

        if (instancedMesh.instanceIndex) {
            const tex = this.#ensureInstanceStyleIdTexture(instancedMesh);
            const arr = tex?.image?.data;
            if (!tex || !arr) return styleId;
            if (idx >= tex.image.width) return styleId;

            const lo = styleId & 255;
            const hi = (styleId >> 8) & 255;
            const o = idx * 4;
            arr[o + 0] = lo;
            arr[o + 1] = hi;
            arr[o + 2] = 0;
            arr[o + 3] = 255;
            tex.needsUpdate = true;
        } else {
            const attr = this.#ensureInstanceStyleIdAttribute(instancedMesh);
            if (!attr) return styleId;
            if (idx >= attr.count) return styleId;
            attr.array[idx] = styleId;
            attr.needsUpdate = true;
        }
        return styleId;
    }

    getOutlineStyleForInstance(instancedMesh, instanceIndex, effective = true) {
        if (!instancedMesh || instanceIndex === undefined || instanceIndex === null) return null;

        const idx = instanceIndex | 0;
        if (idx < 0) return null;

        const map = this._styleIdByInstancedMesh.get(instancedMesh);
        const has = !!map && map.has(idx);
        if (!effective && !has) return null;

        const styleId = (has ? map.get(idx) : 0) ?? 0;
        return this._styleMap.get(styleId);
    }

     /**
      * InstancedMesh의 특정 instanceIndex에 대해 개별 색상을 간단히 지정하는 compact helper 입니다.
      *
      * @param {import('three').InstancedMesh} instancedMesh instanced mesh
      * @param {number} instanceIndex instance index
      * @param {import('three').ColorRepresentation} color 적용할 색상
      * @param {object} [style] pulse/dash 옵션 등 추가 스타일(기본: color만 적용)
      * @return {number} styleId
      */
     setOutlineColorForInstance(instancedMesh, instanceIndex, color, style = {}) {
         return this.setOutlineStyleForInstance(instancedMesh, instanceIndex, { ...style, color });
     }

    clearOutlineStyleForInstance(instancedMesh, instanceIndex) {
        if (!instancedMesh || instanceIndex === undefined || instanceIndex === null) return;

        const idx = instanceIndex | 0;

        if (instancedMesh.instanceIndex) {
            const tex = this._instanceStyleTexByInstancedMesh.get(instancedMesh)?.texture;
            const arr = tex?.image?.data;
            if (tex && arr && idx >= 0 && idx < tex.image.width) {
                const o = idx * 4;
                arr[o + 0] = 0;
                arr[o + 1] = 0;
                arr[o + 2] = 0;
                arr[o + 3] = 0;
                tex.needsUpdate = true;
            }
        } else {
            const geometry = instancedMesh.geometry;
            const attr = geometry?.getAttribute?.('instanceStyleId');
            if (attr && idx >= 0 && idx < attr.count) {
                attr.array[idx] = 0;
                attr.needsUpdate = true;
            }
        }

        const map = this._styleIdByInstancedMesh.get(instancedMesh);
        if (!map) return;
        const styleId = map.get(idx);
        if (styleId === undefined) return;

        if (this._styleMap.get(styleId)?.farPoint?.enabled) this.#farPointStyleCount--;

        map.delete(idx);
        this._styleMap.delete(styleId);
        if (styleId > 0) this._freeStyleIds.push(styleId);
        this.#invalidateFarPoints(instancedMesh, idx);
    }

    #getEffectiveStyleId(object) {
        let cur = object;
        while (cur) {
            const sid = this._styleIdByObject.get(cur);
            if (sid !== undefined) return sid;
            cur = cur.parent;
        }
        return 0;
    }

    clearOutlineStyleForObject(object) {
        if (!object) return;
        const styleId = this._styleIdByObject.get(object);
        if (styleId === undefined) return;
        if (this._styleMap.get(styleId)?.farPoint?.enabled) this.#farPointStyleCount--;
        // styleId 해제: 오브젝트 매핑/캐시 제거 후 free list에 넣어 재사용
        this._styleMap.delete(styleId);
        this._styleIdByObject.delete(object);
        if (styleId > 0) this._freeStyleIds.push(styleId);
        this.#invalidateFarPoints(object);
    }

    #allocateStyleId() {
        const reused = this._freeStyleIds.pop();
        if (reused !== undefined) return reused;

        const styleId = this._nextStyleId++;
        this.#ensureStyleCapacity(styleId + 1);
        return styleId;
    }



    //_styleCapacity 수보다 style의 대상이 많아 질 경우에 data Texture 크기 변경
    #ensureStyleCapacity(required) {
        if (this._styleCapacity >= required) return;

        let next = this._styleCapacity || 256;
        while (next < required) next *= 2;

        const prevCap = this._styleCapacity;
        const prev = this._styleTexture?.image?.data;

        // styleTexture layout (2D texture: width = styleTexSize, height = STYLE_TEX_ROWS)
        // - styleId(=x) 별로 한 "컬럼"을 사용하고, row(y)로 파라미터를 분리합니다.
        // - row 0: visible color RGB, (A: lineWidth)
        // 가림 색상 행의 여유 채널은 활성 옵션의 안정화 출력을 구분합니다.
        // - row 2: dashDensity (R), dashRatio (G), modeParam (B), flags (A)
        //          modeParam: FLOW=flowSpeed(signed), BOUNCE=bounceSpeed, BLOOM=glowIntensity
        // - row 3: dashColor RGB, timeOffset (A)
        const data = new Uint8Array(next * 4 * STYLE_TEX_ROWS);

        if (prevCap > 0 && prev) {
            const prevRowStride = prevCap * 4;
            const nextRowStride = next * 4;
            for (let row = 0; row < STYLE_TEX_ROWS; row++) {
                const p0 = row * prevRowStride;
                const n0 = row * nextRowStride;
                data.set(prev.subarray(p0, p0 + prevRowStride), n0);
            }
        }

        this._styleCapacity = next;

        this._styleTexture = new DataTexture(data, next, STYLE_TEX_ROWS, RGBAFormat, UnsignedByteType);
        this._styleTexture.wrapS = ClampToEdgeWrapping;
        this._styleTexture.wrapT = ClampToEdgeWrapping;
        this._styleTexture.minFilter = NearestFilter;
        this._styleTexture.magFilter = NearestFilter;
        this._styleTexture.generateMipmaps = false;

        this._setStyleFlag = true;
        this.#bindStyleUniformsToEdgeMaterial();
    }

    /**
     * 스타일 바이트와 활성 대상의 안정화 출력 표식을 기록합니다.
     *
     * @param {number} styleId 기록할 스타일 ID
     * @param {import('@union3d/select/U3dObjectBarrier').UOutlineStyleOption} style 정규화한 스타일
     */
    #writeStyle(styleId, style) {
        if (this._styleMap.get(styleId)?.farPoint?.enabled) this.#farPointStyleCount--;
        if (style.farPoint?.enabled) this.#farPointStyleCount++;
        this.#ensureStyleCapacity(styleId + 1);

        const vis = this._tmpStyleVis;
        const hid = this._tmpStyleHid;
        const dash = this._tmpStyleDash;

        // `{ color: ... }` 하나만 넘기면 visible/hidden 기본색으로 자동 적용됩니다.
        // `{ dashColor: ... }`를 별도로 주면 FLOW 모드 점선 색상만 분리 가능합니다.
        const visValue = this.#normalizeStyleColorInput(style.visibleEdgeColor ?? style.visibleColor ?? style.visibleColorHex ?? style.visibleColorHexString ?? style.color ?? this.visibleEdgeColor);
        const hidValue = this.#normalizeStyleColorInput(style.hiddenEdgeColor ?? style.hiddenColor ?? style.hiddenColorHex ?? style.hiddenColorHexString ?? style.color ?? this.hiddenEdgeColor);

        // FLOW 모드 점선(dash) 색상. 미지정이면 visibleEdgeColor와 동일하게 처리합니다.
        const dashValue = this.#normalizeStyleColorInput(style.dashColor ?? style.dashEdgeColor ?? style.dashColorHex ?? style.dashColorHexString ?? style.dash ?? visValue);

        vis.set(visValue);
        hid.set(hidValue);
        dash.set(dashValue);

        const dashDensity = Number(style.dashDensity ?? 20.0);
        const dashRatio = Number(style.dashRatio ?? 0.5);

        let lineWidthScale = Number(style.lineWidth ?? style.width ?? style.widthScale ?? style.thicknessScale ?? NaN);
        if (!Number.isFinite(lineWidthScale)) {
            const absLineWidth = Number(style.lineWidth ?? style.thickness ?? NaN);
            if (Number.isFinite(absLineWidth) && absLineWidth > 0) {
                lineWidthScale = absLineWidth / Math.max(1e-6, Number(this.lineWidth ?? 1));
            }
        }
        if (!Number.isFinite(lineWidthScale)) lineWidthScale = 1.0;
        lineWidthScale = Math.max(0.05, Math.min(STYLE_LINEWIDTH_SCALE_MAX, lineWidthScale));

        // - FLOW 모드에서 속도는 style.flowSpeed로 개별 지정할 수 있습니다.
        // - 기존 호환을 위해 style.dashSpeed도 같은 의미로 인정합니다.
        const flowSpeed = Number(style.flowSpeed ?? style.dashSpeed ?? style.speed ?? 1.0);
        const timeOffset = Number(style.timeOffset ?? 0.0);


        // bounce/bloom 파라미터도 styleId별로 개별 지정할 수 있습니다.
        const bounceSpeed = Number(style.bounceSpeed ?? style.speed ?? 1.0);
        const glowIntensity = Number(style.glowIntensity ?? 1.0);


        // flags는 mode 하나로만 결정합니다.
        // - B-1 정책: per-style로 mode만 선택하고, 모드별 파라미터는 style에 들어온 값만 사용
        // - 현재 flags에는 modeIndex(0..3) + modeOverride(항상 1)만 저장합니다.
        const modeValue = style.mode ?? this.mode ?? OutlineMode.BASIC;
        const modeIndex =
            (modeValue === OutlineMode.BOUNCE) ? 1 :
            (modeValue === OutlineMode.FLOW) ? 2 :
            (modeValue === OutlineMode.BLOOM) ? 3 :
            0; //OutlineMode.BASIC

        // (modeIndex << 4) : shader에서 typeS(0..3)로 디코딩
        // + 64            : modeOverride(항상 true)
        const flags =
            ((modeIndex & 3) << 4) +
            64;

        const clamp01 = (x) => Math.min(1, Math.max(0, x));
        const toByte = (x) => Math.round(clamp01(x) * 255);

        const w = this._styleCapacity;
        const rowStride = w * 4;
        const i0 = (0 * rowStride) + styleId * 4;
        const i1 = (1 * rowStride) + styleId * 4;
        const i2 = (2 * rowStride) + styleId * 4;
        const i3 = (3 * rowStride) + styleId * 4;
        const d = this._styleTexture.image.data;


        // styleTexture layout (2D texture: width = styleTexSize, height = STYLE_TEX_ROWS)
        // - row 0: visible color RGB, (A: lineWidth)
        d[i0 + 0] = toByte(vis.r);
        d[i0 + 1] = toByte(vis.g);
        d[i0 + 2] = toByte(vis.b);
        d[i0 + 3] = toByte(lineWidthScale / STYLE_LINEWIDTH_SCALE_MAX);

        // 1행은 가림 색상 RGB와 활성 옵션의 안정화 출력 표식을 보관합니다.
        d[i1 + 0] = toByte(hid.r);
        d[i1 + 1] = toByte(hid.g);
        d[i1 + 2] = toByte(hid.b);
        d[i1 + 3] = style.farPoint?.enabled ? 255 : 0;

        // - row 2: dashDensity (R), dashRatio (G), modeParam (B), flags (A)
        //          modeParam: FLOW=flowSpeed(signed), BOUNCE=bounceSpeed, BLOOM=glowIntensity
        d[i2 + 0] = toByte(dashDensity / STYLE_DASH_DENSITY_MAX);
        d[i2 + 1] = toByte(dashRatio);
        const modeParam =
            (modeValue === OutlineMode.BOUNCE)
                ? (bounceSpeed / STYLE_BOUNCE_SPEED_MAX)
                : (modeValue === OutlineMode.BLOOM)
                    ? (glowIntensity / STYLE_GLOW_INTENSITY_MAX)
                    : (flowSpeed / (STYLE_DASH_SPEED_MAX * 2) + 0.5);
        d[i2 + 2] = toByte(modeParam);
        d[i2 + 3] = Math.max(0, Math.min(255, Math.round(flags)));

        // - row 3: dashColor RGB, timeOffset (A)
        d[i3 + 0] = toByte(dash.r);
        d[i3 + 1] = toByte(dash.g);
        d[i3 + 2] = toByte(dash.b);
        // timeOffset: per-style dash 애니메이션 위상/오프셋(초 단위). FLOW 모드에서만 사용.
        d[i3 + 3] = toByte(timeOffset / (STYLE_TIME_OFFSET_MAX * 2) + 0.5);

        // CPU 캐시: barrier/선택 로직에서 현재 스타일 snapshot/복원에 사용됨
        this._styleMap.set(styleId, style);
    }

    #normalizeStyleColorInput(v) {
        if (typeof v === 'string') {
            const s = v.trim();
            if (/^[0-9a-fA-F]{6}$/.test(s) || /^[0-9a-fA-F]{3}$/.test(s)) {
                return `#${s}`;
            }
            if (/^0x[0-9a-fA-F]{6}$/.test(s)) {
                return parseInt(s.slice(2), 16);
            }
            return s;
        }
        return v;
    }

    #flushStyleTexturesIfNeeded() {
        if (!this._setStyleFlag) return;
        if (this._styleTexture) this._styleTexture.needsUpdate = true;
        this._setStyleFlag = false;
    }


    #bindStyleUniformsToEdgeMaterial() {
        const mat = this.edgeDetectionMaterial;
        if (!mat || !mat.uniforms) return;

        if (mat.uniforms.styleTexture) mat.uniforms.styleTexture.value = this._styleTexture;
        if (mat.uniforms.styleTexSize) mat.uniforms.styleTexSize.value = this._styleCapacity;
    }

    /**
     * InstancedMesh 전용 마스크 material을 생성합니다.
     * 일반 마스크 material과 셰이더는 같지만 uniforms와 defines가 분리되어 있어,
     * InstancedMesh2가 렌더 직전에 가하는 패치가 일반 오브젝트 렌더링으로 번지지 않습니다.
     *
     * @returns {import('three').ShaderMaterial | undefined} 인스턴스 전용 마스크 material
     */
    #createInstancedMaskMaterial() {
        const base = this.prepareMaskMaterial;
        if (!base || typeof base.clone !== 'function') return undefined;

        const material = base.clone(); // ShaderMaterial.clone()은 uniforms/defines를 복제하므로 참조가 분리된다
        material.name = 'OutlineMaskMaterialInstanced';
        material._isInstanceMaterial = true; // instanced mesh2 onBeforeRender 패치 대상 표시
        return material;
    }

    /**
     * 마스크 렌더링에 사용하는 material 목록을 반환합니다.
     * uniform/상태 변경은 어느 쪽이 쓰이든 같아야 하므로 항상 두 material에 함께 적용합니다.
     *
     * @returns {Array<import('three').ShaderMaterial>} 일반/인스턴스 마스크 material
     */
    #getMaskMaterials() {
        const materials = [];
        if (this.prepareMaskMaterial) materials.push(this.prepareMaskMaterial);
        if (this.prepareMaskMaterialInstanced) materials.push(this.prepareMaskMaterialInstanced);
        return materials;
    }

    /**
     * 대상에 맞는 마스크 material을 반환합니다.
     *
     * @param {import('three').Object3D} object 마스크 버퍼에 그릴 대상
     * @returns {import('three').ShaderMaterial} InstancedMesh 계열이면 전용 material
     */
    #getMaskMaterialFor(object) {
        if (object?.isInstancedMesh || object?.isInstancedMesh2) {
            return this.prepareMaskMaterialInstanced ?? this.prepareMaskMaterial;
        }
        return this.prepareMaskMaterial;
    }

    /**
     * 마스크 material의 styleId 기록용 uniform과 셰이더를 패치합니다.
     *
     * @param {import('three').ShaderMaterial} [material] 패치 대상 material
     */
    #patchPrepareMaskMaterialForStyleId(material) {
        if (!material || !material.uniforms) return;

        material.uniforms.styleIdLo = { value: 0 }; // style id 저장용
        material.uniforms.styleIdHi = { value: 0 }; // style id 저장용
        // forceVisible = 1이면(renderOrder 적용 모드) mask의 depthCompare 결과를 강제로 "visible"로 취급하도록 합니다.
        // (Outline shader에서 hidden/visible 컬러 분기 자체를 타지 않게 만들어 색상이 가려짐에 영향받지 않도록)
        material.uniforms.forceVisible = { value: 0 };
        if (!material.uniforms.instanceStyleIdTexture) { // instanced mesh style Id 저장용
            material.uniforms.instanceStyleIdTexture = { value: null };
        }
        if (!material.uniforms.instanceStyleTexSize) { // instance mesh style id 크기
            material.uniforms.instanceStyleTexSize = { value: 1 };
        }

        if (typeof material.vertexShader === 'string') {
            const vertexShader = material.vertexShader;
            let vpatched = vertexShader;

            if (!vpatched.includes('USE_INSTANCING_INDIRECT')) { //instanced mesh or instanced Mesh2
                vpatched = vpatched.replace(
                    /#ifdef\s+USE_INSTANCING\s*\n([\s\S]*?worldPosition\s*=\s*instanceMatrix\s*\*\s*worldPosition\s*;[\s\S]*?)#endif/m,
                    (m, body) => `#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT\n${body}#endif`
                );
            }
            {
                const texMatRe = /uniform\s+mat4\s+textureMatrix\s*;\s*/m;
                const needInstAttr = !vpatched.includes('attribute float instanceStyleId');
                const needInstVar = !vpatched.includes('varying float vInstanceStyleId');
                const needIndirectVar = !vpatched.includes('varying float vInstanceIndex');
                if (texMatRe.test(vpatched) && (needInstAttr || needInstVar || needIndirectVar)) {
                    let extra = '';
                    if (needInstAttr || needInstVar) {
                        extra += '#ifdef USE_INSTANCING\nattribute float instanceStyleId;\nvarying float vInstanceStyleId;\n#endif\n';
                    }
                    if (needIndirectVar) {
                        extra += '#ifdef USE_INSTANCING_INDIRECT\nvarying float vInstanceIndex;\n#endif\n';
                    }
                    vpatched = vpatched.replace(texMatRe, (m) => `${m}${extra}`);
                }
            }

            if (!vpatched.includes('vInstanceIndex = float( instanceIndex )')) {
                const mainOpenRe = /void\s+main\s*\(\s*\)\s*\{\s*/m;
                if (mainOpenRe.test(vpatched)) {
                    vpatched = vpatched.replace(
                        mainOpenRe,
                        (m) => `${m}#ifdef USE_INSTANCING\nvInstanceStyleId = instanceStyleId;\n#endif\n#ifdef USE_INSTANCING_INDIRECT\nvInstanceIndex = float( instanceIndex );\n#endif\n`
                    );
                }
            }

            if (vpatched !== vertexShader) {
                material.vertexShader = vpatched;
                material.needsUpdate = true;
            }
        }

        if (typeof material.fragmentShader === 'string') {
            const src = material.fragmentShader;

            let patched = src;

            if (!patched.includes('uniform float styleIdLo')) {
                const cameraNearFarRe = /uniform\s+vec2\s+cameraNearFar\s*;\s*/m;
                if (cameraNearFarRe.test(patched)) {
                    patched = patched.replace(
                        cameraNearFarRe,
                        (m) => `${m}uniform float styleIdLo;\nuniform float styleIdHi;\nuniform float forceVisible;\n#ifdef USE_INSTANCING\nvarying float vInstanceStyleId;\n#endif\n#ifdef USE_INSTANCING_INDIRECT\nvarying float vInstanceIndex;\nuniform sampler2D instanceStyleIdTexture;\nuniform float instanceStyleTexSize;\n#endif\n`
                    );
                }
            }

            if (patched.includes('uniform float styleIdLo') && !patched.includes('uniform sampler2D instanceStyleIdTexture')) {
                const styleIdHiRe = /uniform\s+float\s+styleIdHi\s*;\s*/m;
                if (styleIdHiRe.test(patched)) {
                    patched = patched.replace(
                        styleIdHiRe,
                        (m) => `${m}uniform float forceVisible;\n#ifdef USE_INSTANCING\nvarying float vInstanceStyleId;\n#endif\n#ifdef USE_INSTANCING_INDIRECT\nvarying float vInstanceIndex;\nuniform sampler2D instanceStyleIdTexture;\nuniform float instanceStyleTexSize;\n#endif\n`
                    );
                }
            }

            // 이미 styleId 패치가 되어 있는 상태에서 forceVisible만 빠진 경우를 대비한 보강 처리
            if (!patched.includes('uniform float forceVisible')) {
                const styleIdHiOnlyRe = /uniform\s+float\s+styleIdHi\s*;\s*/m;
                if (styleIdHiOnlyRe.test(patched)) {
                    patched = patched.replace(styleIdHiOnlyRe, (m) => `${m}uniform float forceVisible;\n`);
                } else {
                    const cameraNearFarRe2 = /uniform\s+vec2\s+cameraNearFar\s*;\s*/m;
                    if (cameraNearFarRe2.test(patched)) {
                        patched = patched.replace(cameraNearFarRe2, (m) => `${m}uniform float forceVisible;\n`);
                    }
                }
            }

            const fragColorRe = /gl_FragColor\s*=\s*vec4\s*\(\s*0\.0\s*,\s*depthTest\s*,\s*1\.0\s*,\s*1\.0\s*\)\s*;\s*/m;
            if (fragColorRe.test(patched)) {
                patched = patched.replace(
                    fragColorRe,
                    '#ifdef USE_INSTANCING_INDIRECT\nfloat _w = max( instanceStyleTexSize, 1.0 );\nfloat _u = ( vInstanceIndex + 0.5 ) / _w;\nvec4 _t = texture2D( instanceStyleIdTexture, vec2( _u, 0.5 ) );\nfloat _loB = floor( _t.r * 255.0 + 0.5 );\nfloat _hiB = floor( _t.g * 255.0 + 0.5 );\nfloat sid = _loB + _hiB * 256.0;\nfloat lo = mod(sid, 256.0) / 255.0;\nfloat hi = floor(sid / 256.0) / 255.0;\nfloat forceValue = mix( depthTest, 0.0, step( 0.5, forceVisible ) );\ngl_FragColor = vec4(0.0, forceValue, lo, hi);\n#elif defined( USE_INSTANCING )\nfloat sid = floor(vInstanceStyleId + 0.5);\nfloat lo = mod(sid, 256.0) / 255.0;\nfloat hi = floor(sid / 256.0) / 255.0;\nfloat forceValue = mix( depthTest, 0.0, step( 0.5, forceVisible ) );\ngl_FragColor = vec4(0.0, forceValue, lo, hi);\n#else\nfloat forceValue = mix( depthTest, 0.0, step( 0.5, forceVisible ) );\ngl_FragColor = vec4(0.0, forceValue, styleIdLo, styleIdHi);\n#endif\n'
                );
            }

            if (patched !== src) {
                material.fragmentShader = patched;
                material.needsUpdate = true;
            }
        }
    }

    #setCurrentStyleId(styleId) {
        const clamped = Math.max(0, Math.min(65535, styleId | 0));
        const lo = (clamped & 255) / 255;
        const hi = ((clamped >> 8) & 255) / 255;

        for (const material of this.#getMaskMaterials()) {
            const u = material.uniforms;
            if (!u) continue;
            if (u.styleIdLo) u.styleIdLo.value = lo;
            if (u.styleIdHi) u.styleIdHi.value = hi;
        }
    }

    /**
     * InstancedMesh outline 렌더링 준비 단계
     * @param {import('three').WebGLRenderer} renderer 마스크 렌더러
     * @param selectedObject
     */
    #setInstancedMeshPrepare(renderer, selectedObject){
        const self = this;
        const instancedMesh = selectedObject;
        const instances = instancedMesh.getBarrierInstances();
        if(!selectedObject.instances) return;
        const cache = new WeakMap();
        for (let i = 0; i <  selectedObject.instances.length; i++) {

            const instance = selectedObject.instances[i];
            if(!selectedObject.getActiveAndVisibilityAt(i)) continue;
            cache.set(instance, selectedObject.getVisibilityAt(i));
            selectedObject.setVisibilityAt(i, false);
        }

        renderer.render( instancedMesh, self.renderCamera );

        for (let i = 0; i <  instances.length; i++) {
            const idx =  instances[i];
            const instance = selectedObject.instances[idx];
            if(!cache.get(instance)) continue;
            selectedObject.setVisibilityAt(idx, true);
        }
        renderer.render( instancedMesh, self.renderCamera );

        for (let i = 0; i <  selectedObject.instances.length; i++) {
            if(!selectedObject.getActiveAt(i)) continue;
            const instance = selectedObject.instances[i];
            if(!cache.has(instance)) continue;
            selectedObject.setVisibilityAt(i, cache.get(instance));
        }

    }

    /**
     * u3f. 2.5 버전 outLine 렌더링 준비 단계
     * @param {import('three').WebGLRenderer} renderer 마스크 렌더러
     * @param selectedObject
     */
    #setArrayMergedMeshPrepare(renderer, selectedObject){
        const object = selectedObject;
        const geometry = object.geometry;
        const groups = geometry.groups;
        const pickIndices = new Set( object._pickMaterials ); // 빠른 조회를 위해 Set 사용

        // 원래 drawRange를 저장해 둡니다.
        const originalDrawRange = {
            start: geometry.drawRange.start,
            count: geometry.drawRange.count
        };

        // 지오메트리 그룹들을 순회합니다.
        for ( let j = 0, jl = groups.length; j < jl; j ++ ) {

            const group = groups[ j ];

            // 현재 그룹의 originIndex가 _pickMaterials 목록에 포함되어 있는지 확인
            if ( pickIndices.has( group.originIndex ) ) {

                // 렌더러가 이 그룹만 그리도록 drawRange를 설정
                geometry.setDrawRange( group.start, group.count );

                // 이 그룹에 해당하는 부분만 마스크 버퍼에 렌더링
                renderer.render( object, this.renderCamera );
            }

        }
        // 모든 그룹 처리가 끝나면, 반드시 원래 drawRange로 복원
        geometry.setDrawRange( originalDrawRange.start, originalDrawRange.count );
    }

    // 선택 객체를 mask buffer에 렌더링합니다.
    // - styleId는 mask 텍스처의 B/A 채널로 기록(후속 edge shader에서 스타일 조회)
    // - instancedIndicesOverride가 주어지면 InstancedMesh에서 해당 인덱스만 렌더링(레이어별 필터)
    /**
     * 객체별 마스크를 출력하고 표현 전환과 무관하게 공식 LOD 재질을 복원합니다.
     *
     * @param {import('three').WebGLRenderer} renderer 마스크 렌더러
     * @param {import('three').Mesh} object 출력 메시
     * @param {number} styleId 스타일 ID
     * @param {import('three').Material | Array<import('three').Material> | undefined} originalMaterialOverride 복원할 재질
     * @param {Array<number> | undefined} instancedIndicesOverride 출력 인덱스
     */
    #renderObjectToMask(renderer, object, styleId, originalMaterialOverride, instancedIndicesOverride) {
        if (!object) return;

        this.#setCurrentStyleId(styleId ?? 0);

        const originalMaterial = originalMaterialOverride ?? object.material;
        // InstancedMesh 계열은 전용 material로 그린다. InstancedMesh2가 렌더 직전에 material을 패치해도
        // 일반 mesh가 쓰는 material은 건드려지지 않아 다음 선택에서 셰이더 상태가 섞이지 않는다.
        const maskMaterial = this.#getMaskMaterialFor(object);
        object.material = maskMaterial;
        const lodMaterials = new Map();

         if (object?.isInstancedMesh && object?.instanceIndex && maskMaterial?.uniforms?.instanceStyleIdTexture) {
            const tex = this.#ensureInstanceStyleIdTexture(object);
            maskMaterial.uniforms.instanceStyleIdTexture.value = tex;
            if (maskMaterial.uniforms.instanceStyleTexSize) {
                maskMaterial.uniforms.instanceStyleTexSize.value = tex?.image?.width ?? 1;
            }
        }

        // 전용 material 분리 이후에도 일반 material만큼은 defines가 바뀌면 안 되므로 스냅샷으로 감시한다.
        // (인스턴스 전용 material의 인스턴싱 defines는 정상 상태이므로 되돌리지 않는다.)
        const watchDefines = maskMaterial === this.prepareMaskMaterial;
        const prevDefines = watchDefines ? { ...maskMaterial.defines } : undefined;

        try {
            for (const lod of object.LODinfo?.objects ?? []) {
                if (lod._parentLOD !== object) continue;
                lodMaterials.set(lod, lod.material);
                // 미선택 형상이 원래 재질로 마스크에 남지 않도록 모든 표현에서 재질을 맞춥니다.
                lod.material = maskMaterial;
            }
            if (object.isInstancedMesh && object.getBarrierInstances && object.getBarrierInstances() && object.getBarrierInstances().length > 0) {
                if (instancedIndicesOverride) {
                    this.#setInstancedMeshPrepareWithIndices(renderer, object, instancedIndicesOverride);
                } else {
                    this.#setInstancedMeshPrepare(renderer, object);
                }
            } else if (Array.isArray(originalMaterial) && object._pickMaterials && object._pickMaterials.length > 0) {
                this.#setArrayMergedMeshPrepare(renderer, object);
            } else {
                renderer.render(object, this.renderCamera);
            }
        } finally {
            object.material = originalMaterial;
            for (const [lod, material] of lodMaterials) lod.material = material;

            // ↓ 렌더링 후 defines 복원 (키 존재 여부뿐 아니라 값까지 비교)
            if (watchDefines) {
                const curDefines = maskMaterial.defines ?? {};
                const keys = new Set([...Object.keys(prevDefines), ...Object.keys(curDefines)]);
                let changed = false;
                for (const key of keys) {
                    if (prevDefines[key] !== curDefines[key]) {
                        changed = true;
                        break;
                    }
                }
                if (changed) {
                    maskMaterial.defines = prevDefines;
                    maskMaterial.needsUpdate = true;
                }
            }
        }
    }

    #updateTime(deltaTime) {
        this.#time = (this.#time ?? 0) + deltaTime;
    }


    #updateEdgeUniforms() {
        this.#flushStyleTexturesIfNeeded();
        this.#bindStyleUniformsToEdgeMaterial();

        if (this.edgeDetectionMaterial?.uniforms?.time) {
            this.edgeDetectionMaterial.uniforms.time.value = this.#time;
        }
    }

    #beginRender(renderer, maskActive) {

        if (this._renderOrderCache.dirty) {
            this._renderOrderCache.hasRenderOrder = this.#computeRenderOrderFlag();
            this._renderOrderCache.dirty = false;
        }

        const autoClear = renderer.autoClear;

        renderer.getClearColor(this._oldClearColor);
        this.oldClearAlpha = renderer.getClearAlpha();
        renderer.autoClear = false;

        if (maskActive) renderer.state.buffers.stencil.setTest(false);

        renderer.setClearColor(0xffffff, 1);

        return autoClear;
    }

    #buildRenderContext() {
        const objects = this._maskRenderObjects;
        const styleIds = this._maskRenderStyleIds;

        //let hasRenderOrder = this.#checkRenderOrder(objects, styleIds);
        const hasRenderOrder = this._renderOrderCache.hasRenderOrder;

        const background = this.renderScene.background;
        const override = this.renderScene.overrideMaterial;
        return {
            objects,
            styleIds,
            hasRenderOrder,
            background,
            override,
            farPoints: this.#farPointFrame,
            renderOrders: hasRenderOrder ? [3, 2, 1] : [0]
        };
    }

    /**
     * 현재 선택 캐시를 제외한 장면의 깊이를 기록합니다.
     * @param {import('three').WebGLRenderer} renderer 깊이 렌더러
     */
    #renderDepthPass(renderer) {

        try {
            this._changeVisibilityOfSelectedObjects(false); // 선택 오브젝트 숨김

            this.renderScene.background = null;
            this.renderScene.overrideMaterial = this.depthMaterial; // 모든 오브젝트를 깊이 머티리얼로 교체

            renderer.setRenderTarget(this.renderTargetDepthBuffer);
            renderer.clear();
            renderer.render(this.renderScene, this.renderCamera);  // 결과: 비선택 오브젝트들의 깊이값만 담긴 버퍼
        } catch (e) {
            __GInfo__(this,'UOutlinePass의 DepthBuffer가 정상적으로 출력 되지 않았습니다.', '6244911');
        }
    }
    #prepareMaskPass() {
        // Make selected objects visible
        // 마스크 버퍼 생성
        this._changeVisibilityOfSelectedObjects(true); // 선택 오브젝트 다시 보임
        this._visibilityCache.clear();

        // Update Texture Matrix for Depth compare
        this._updateTextureMatrix();
    }


    /**
     * 우선순위별 기존 외곽·일정 두께 상세 외곽·간략 윤곽을 합성합니다.
     *
     * @param {import('three').WebGLRenderer} renderer 현재 렌더러
     * @param {import('three').WebGLRenderTarget} readBuffer 합성 대상
     * @param {boolean} maskActive stencil 사용 여부
     * @param {object} context 현재 등록·장면·우선순위 문맥
     */
    #renderOutlineLayers(renderer, readBuffer, maskActive, context) {
        const { renderOrders } = context;
        const prevState = this.#storeMaskMaterialState();
        try {
            for (let i = 0; i < renderOrders.length; i++) {
                const renderOrder = renderOrders[i];

                const info = this.#buildInfo(context, renderOrder);
                const hasPoints = context.farPoints?.points.some(point => renderOrder === 0 || point.order === renderOrder);
                if (info.objects.length === 0 && !hasPoints) continue;
                this.#setupMaskMaterial(context.hasRenderOrder, prevState);
                if (info.objects.length > 0) {
                    this.#renderMask(renderer, info, context);
                    this.#downSample(renderer);
                    this.#applyPulseColors();
                    this.#edgeDetect(renderer);
                    this.#blur(renderer);
                    this.#overlay(renderer, readBuffer, maskActive);
                    if (this.#farPointStyleCount > 0 && !this.usePatternTexture) {
                        this.#farPoints?._renderDetailed(renderer, readBuffer, this.renderCamera, this.renderTargetMaskBuffer, this._styleTexture,
                            this.edgeStrength, maskActive, this.overlayMaterial.blending, this.#time);
                    }
                }
                // 같은 우선순위 위치에서 간략 윤곽을 합성하여 등록과 깊이 제외 정책을 보존합니다.
                this.#farPoints?._render(renderer, readBuffer, this.renderCamera, this.renderTargetDepthBuffer.texture,
                    renderOrder, this.prepareMaskMaterial.uniforms.forceVisible.value > 0.5,
                    this.edgeStrength, maskActive, this.overlayMaterial.blending, this.#time);
            }
        } finally {
            this.renderScene.background = context.background;
            this.renderScene.overrideMaterial = context.override;
            this.#restoreMaskMaterialState(prevState);
        }
    }

    #storeMaskMaterialState() {
        const maskMaterial = this.prepareMaskMaterial;
        const uniforms = maskMaterial.uniforms;

        return {
            depthTest: maskMaterial.depthTest,
            depthWrite: maskMaterial.depthWrite,
            forceVisible: uniforms?.forceVisible ? uniforms.forceVisible.value : undefined
        };
    }

    #restoreMaskMaterialState(state) {
        for (const maskMaterial of this.#getMaskMaterials()) {
            maskMaterial.depthTest = state.depthTest;
            maskMaterial.depthWrite = state.depthWrite;
        }

        // if (uniforms?.forceVisible && state.forceVisible !== undefined) {
        //     uniforms.forceVisible.value = state.forceVisible;
        // }
        this._selectionCache.clear();
    }

    /**
     * 등록은 보존하고 표현 제외·공식 LOD 중복 제외를 적용한 마스크 목록을 만듭니다.
     *
     * @param {object} context 현재 등록과 간략 출력 문맥
     * @param {number} renderOrder 현재 우선순위(0이면 전체)
     * @returns {object} 해당 우선순위의 메시·스타일·인스턴스 인덱스
     */
    #buildInfo(context, renderOrder) {
        const { objects, styleIds, farPoints } = context;

        const layerObjects = [];
        const layerStyleIds = [];
        const layerInstanced = new Map();
        const registered = new Set(objects);

        for (let i = 0, il = objects.length; i < il; i++) {
            const object = objects[i];
            if (farPoints?.objects.has(object)) continue;
            // 남은 외곽선 인덱스는 원본의 렌더 순회에서 LOD도 함께 출력하므로 중복 마스크를 생략합니다.
            const lodParent = object._parentLOD;
            if (lodParent?.LODinfo?.objects.includes(object) && registered.has(lodParent)) continue;
            const styleId = styleIds[i];

            if (object?.isInstancedMesh && object.getBarrierInstances) {

                let cache = this._instancedOrderCache.get(object.uuid);

                if (!cache) {
                    cache = {1: [], 2: [], 3: []};

                    const indices = object.getBarrierInstances();
                    for (let j = 0; j < indices.length; j++) {
                        const idx = indices[j] | 0;
                        let order = this.#getRenderOrderForInstance(object, idx);
                        order = (order > 0) ? order : 3;
                        cache[order].push(idx);
                    }

                    this._instancedOrderCache.set(object.uuid, cache);
                }

                if (renderOrder === 0) {
                    const merged = cache[1].concat(cache[2], cache[3]).filter(idx => !farPoints?.instances.get(object)?.has(idx));
                    if (merged.length > 0) {
                        layerObjects.push(object);
                        layerStyleIds.push(0);
                        layerInstanced.set(object, merged);
                    }
                } else {
                    const arr = cache[renderOrder].filter(idx => !farPoints?.instances.get(object)?.has(idx));
                    if (arr.length > 0) {
                        layerObjects.push(object);
                        layerStyleIds.push(0);
                        layerInstanced.set(object, arr);
                    }
                }

                continue;
            }

            let order = this.#getRenderOrderFromStyleId(styleId);
            order = (order > 0) ? order : 3;

            if (renderOrder === 0 || order === renderOrder) {
                layerObjects.push(object);
                layerStyleIds.push(styleId);
            }
        }

        return {
            objects: layerObjects,
            styleIds: layerStyleIds,
            instanced: layerInstanced
        };
    }
    #setupMaskMaterial(hasRenderOrder, prevState) {
        // renderOrder 모드: 선택된 오브젝트끼리의 occlusion을 무시하고(=항상 보이게)
        // mask의 depthTest 결과를 강제로 visible 처리합니다.
        for (const maskMaterial of this.#getMaskMaterials()) {
            const uniforms = maskMaterial.uniforms;

            if (hasRenderOrder) {
                maskMaterial.depthTest = false;
                maskMaterial.depthWrite = false;
                if (uniforms?.forceVisible) uniforms.forceVisible.value = 1;
            } else {
                maskMaterial.depthTest = prevState.depthTest;
                maskMaterial.depthWrite = prevState.depthWrite;
                //if (uniforms?.forceVisible) uniforms.forceVisible.value = prevState.forceVisible ?? 0;
            }
        }
    }

    #renderMask(renderer, info, context) {
        this._changeVisibilityOfNonSelectedObjects(false); // 비선택 오브젝트 숨김
        this.renderScene.overrideMaterial = this.prepareMaskMaterial; // prepareMaskMaterial이 깊이 버퍼와 비교

        // 일반/인스턴스 마스크 material 중 어느 쪽이 쓰이든 같은 깊이 비교 기준을 써야 한다.
        for (const maskMaterial of this.#getMaskMaterials()) {
            const uniforms = maskMaterial.uniforms;
            if (!uniforms) continue;
            uniforms['cameraNearFar'].value.set(this.renderCamera.near, this.renderCamera.far);
            uniforms['depthTexture'].value = this.renderTargetDepthBuffer.texture;
            uniforms['textureMatrix'].value = this.textureMatrix;
        }

        renderer.setRenderTarget(this.renderTargetMaskBuffer);
        renderer.clear();

        for (let i = 0; i < info.objects.length; i++) {
            this.#renderObjectToMask(
                renderer,
                info.objects[i],
                info.styleIds[i],
                undefined,
                info.instanced.get(info.objects[i])
            );
        }

        this._changeVisibilityOfNonSelectedObjects(true);
        this._visibilityCache.clear();

        const background = context.background;
        const override = context.override;
        this.renderScene.background = background; // background 복원
        this.renderScene.overrideMaterial = override; // overrideMaterial 복원
    }

    /**
     * 원본을 보존하며 기존 외곽 검출용 축소 마스크를 준비합니다.
     *
     * @param {import('three').WebGLRenderer} renderer 현재 렌더러
     */
    #downSample(renderer) {
        if (this.#farPointStyleCount > 0 && !this.usePatternTexture) {
            this.#farPoints?._filterLegacyMask(renderer, this.renderCamera, this.renderTargetMaskDownSampleBuffer,
                this.renderTargetMaskBuffer.texture, this._styleTexture);
            return;
        }
        this._fsQuad.material = this.materialCopy;
        this.copyUniforms['tDiffuse'].value = this.renderTargetMaskBuffer.texture;

        renderer.setRenderTarget(this.renderTargetMaskDownSampleBuffer); // 마스크 버퍼를 절반 해상도로 축소 (성능 최적화)
        renderer.clear();
        this._fsQuad.render(renderer);
    }

    #applyPulseColors() {  // 색상 펄스 처리
        this.tempPulseColor1.copy(this.visibleEdgeColor);
        this.tempPulseColor2.copy(this.hiddenEdgeColor);

        if (this.pulsePeriod > 0) {
            const scalar =
                (1 + 0.25) / 2 +
                Math.cos(performance.now() * 0.01 / this.pulsePeriod) *
                (1.0 - 0.25) / 2;

            this.tempPulseColor1.multiplyScalar(scalar);
            this.tempPulseColor2.multiplyScalar(scalar);
        }
    }

    #clearRenderTarget(renderer, target, color = 0x000000, alpha = 0) {
        const prevColor = new Color();
        renderer.getClearColor(prevColor);
        const prevAlpha = renderer.getClearAlpha();

        renderer.setRenderTarget(target);
        renderer.setClearColor(color, alpha);
        renderer.clear();
        renderer.setClearColor(prevColor, prevAlpha);
    }

    #edgeDetect(renderer) { //Apply Edge Detection Pass
        this._fsQuad.material = this.edgeDetectionMaterial;

        const uniforms = this.edgeDetectionMaterial.uniforms;
        uniforms['maskTexture'].value = this.renderTargetMaskDownSampleBuffer.texture;
        uniforms['texSize'].value.set(
            this.renderTargetMaskDownSampleBuffer.width,
            this.renderTargetMaskDownSampleBuffer.height
        );


        uniforms['visibleEdgeColor'].value = this.tempPulseColor1;
        uniforms['hiddenEdgeColor'].value = this.tempPulseColor2;

        this.#clearRenderTarget(renderer, this.renderTargetEdgeBuffer1, 0x000000, 0);
        this._fsQuad.render(renderer);
    }
    #blur(renderer) { //Apply Blur on quarter res
        const blurMaterial = this.separableBlurMaterial2;

        this._fsQuad.material = blurMaterial;

        blurMaterial.uniforms['colorTexture'].value = this.renderTargetEdgeBuffer1.texture;
        blurMaterial.uniforms['direction'].value = OutlinePass.BlurDirectionX;

        this.#clearRenderTarget(renderer, this.renderTargetBlurBuffer2, 0x000000, 0);
        this._fsQuad.render(renderer);

        blurMaterial.uniforms['colorTexture'].value = this.renderTargetBlurBuffer2.texture;
        blurMaterial.uniforms['direction'].value = OutlinePass.BlurDirectionY;

        this.#clearRenderTarget(renderer, this.renderTargetEdgeBuffer2, 0x000000, 0);
        this._fsQuad.render(renderer);
    }

    #overlay(renderer, readBuffer, maskActive) { // Blend it additively over the input texture
        this._fsQuad.material = this.overlayMaterial;

        const uniforms = this.overlayMaterial.uniforms;
        uniforms['maskTexture'].value = this.renderTargetMaskBuffer.texture;
        uniforms['edgeTexture1'].value = this.renderTargetEdgeBuffer1.texture;
        uniforms['edgeTexture2'].value = this.renderTargetEdgeBuffer2.texture;

        uniforms['patternTexture'].value = this.patternTexture;
        uniforms['edgeStrength'].value = this.edgeStrength;
        uniforms['edgeGlow'].value = this.edgeGlow;
        uniforms['usePatternTexture'].value = this.usePatternTexture;

        if (maskActive) renderer.state.buffers.stencil.setTest(true);

        renderer.setRenderTarget(readBuffer);
        this._fsQuad.render(renderer);

        if (maskActive) renderer.state.buffers.stencil.setTest(false);
    }

    #finalComposite(renderer, readBuffer) {
        if (!this.renderToScreen) return;

        this._fsQuad.material = this.materialCopy;
        this.copyUniforms.tDiffuse.value = readBuffer.texture;

        renderer.setRenderTarget(null);
        this._fsQuad.render(renderer);
    }
    #computeRenderOrderFlag() {

        const allRenderObjects = this._maskRenderObjects;
        const allRenderStyleIds = this._maskRenderStyleIds;

        // -----------------------------
        // styleId 기반 검사
        // -----------------------------
        for (let i = 0, il = allRenderStyleIds.length; i < il; i++) {
            if (this.#getRenderOrderFromStyleId(allRenderStyleIds[i]) > 0) {
                return true;
            }
        }

        // -----------------------------
        //  instancedMesh 검사
        // -----------------------------
        for (let i = 0, il = allRenderObjects.length; i < il; i++) {
            const object = allRenderObjects[i];
            if (object?.isInstancedMesh && object.getBarrierInstances) {
                const indices = object.getBarrierInstances();
                if (!indices || indices.length === 0) continue;
                for (let j = 0, jl = indices.length; j < jl; j++) {
                    if (this.#getRenderOrderForInstance(object, indices[j] | 0) > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * 기존 외곽선과 객체별 간략한 닫힌 윤곽을 우선순위에 맞춰 합성합니다.
     *
     * @override
     *
     * @param {import('three').WebGLRenderer} renderer 현재 렌더러
     * @param {import('three').WebGLRenderTarget} writeBuffer 기반 패스의 쓰기 버퍼
     * @param {import('three').WebGLRenderTarget} readBuffer 이전 출력과 합성할 버퍼
     * @param {number} deltaTime 프레임 경과 초
     * @param {boolean} maskActive stencil 마스크 사용 여부
     */
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        this.#updateTime(deltaTime);
        this.#updateEdgeUniforms();

        const oldAutoClear = this.#beginRender(renderer, maskActive);
        try {
            this._updateSelectionCache();
            this.#prepareFarPoints(renderer);
            if (this.selectedObjects.length > 0) {
                const context = this.#buildRenderContext();
                this.#renderDepthPass(renderer);
                this.#prepareMaskPass();
                this.#renderOutlineLayers(renderer, readBuffer, maskActive, context);
            }
        } finally {
            renderer.setClearColor(this._oldClearColor, this.oldClearAlpha);
            renderer.autoClear = oldAutoClear;
        }

        this.#finalComposite(renderer, readBuffer);
    }

    /**
     * 해제 대상의 이력과 간략 윤곽 전용 프레임 참조를 비웁니다.
     *
     * @param {import('three').Object3D} object 해제 대상
     * @param {number} [instanceIndex] 해제 인덱스
     */
    #invalidateFarPoints(object, instanceIndex) {
        this.#farPoints?._invalidate(object, instanceIndex);
        this.#farPointFrame = undefined;
        this.#farPointRoots.length = 0;
        if (this.#farPointStyleCount <= 0) {
            this.#farPoints?._dispose();
            this.#farPoints = undefined;
        }
    }

    /** 후처리 비활성화 시 간략 윤곽 전용 자원만 해제합니다. 등록·스타일은 보존합니다. */
    _clearFarPoints() {
        this.#farPoints?._dispose();
        this.#farPoints = undefined;
        this.#farPointFrame = undefined;
    }

    /**
     * 등록·깊이 캐시를 그대로 두고 간략 윤곽의 출력 목록을 계산합니다.
     *
     * @param {import('three').WebGLRenderer} renderer 현재 렌더러
     */
    #prepareFarPoints(renderer) {
        this.#farPointFrame = undefined;
        if (this.#farPointStyleCount === 0 || this.usePatternTexture) {
            this.#farPoints?._dispose();
            this.#farPoints = undefined;
            return;
        }
        // 투영 결과와 간략 윤곽 출력 자원만 소유하며 실제 장면과 선택 등록에는 추가하지 않습니다.
        this.#farPoints ??= INTERNAL.createFarPoints();
        /** @type {Array<UOutlineFarPointMember>} */
        const members = [];
        for (let i = 0; i < this._maskRenderObjects.length; i++) {
            const object = this._maskRenderObjects[i];
            if (object._parentLOD?.LODinfo?.objects.includes(object)) continue;
            const root = this.#farPointRoots[i];
            if (object.isInstancedMesh && typeof object.getBarrierInstances === 'function') {
                for (const instanceIndex of object.getBarrierInstances()) {
                    const styleId = this._styleIdByInstancedMesh.get(object)?.get(instanceIndex) ?? 0;
                    members.push({object, root, instanceIndex, styleId, order: this.#getRenderOrderFromStyleId(styleId) || 3});
                }
            } else {
                const styleId = this._maskRenderStyleIds[i];
                members.push({object, root, styleId, order: this.#getRenderOrderFromStyleId(styleId) || 3});
            }
        }
        this.#farPointFrame = this.#farPoints._prepare(members, this._styleMap, this._styleTexture, this.mode, this.renderCamera, renderer, this.#farPointLineWidth);
    }
}


export { UOutlinePass };
