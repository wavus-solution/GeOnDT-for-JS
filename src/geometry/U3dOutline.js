//@ts-check
import * as THREE from 'three';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {ULineMaterial} from '@union3d/geometry/material/ULineMaterial';
import {bindGeometryOutlineMask, bindOutlineOpaqueDepth, bindOutlineNormalMaterial, bindOutlineCorners, bindOutlineViewportCulling, withOutlineRenderState} from '@union3d/geometry/U3dOutline.internal';

/** @type {WeakMap<import('three').Object3D, U3dOutline>} */
const owners = new WeakMap();
/** @type {WeakMap<import('three').Object3D, import('three').Material | Array<import('three').Material>>} */
const colorMaterials = new WeakMap();
/** @type {WeakMap<import('three').Object3D, import('three').Material | Array<import('three').Material>>} */
const styleMaterials = new WeakMap();

/**
 * 도형의 자동 외곽선을 생성·갱신하고 렌더링 설정과 자원 해제를 관리합니다.
 * 도형당 외곽선 렌더 객체 하나를 owner._outline에 보관하며 getOutlineObject()로 조회합니다.
 *
 * @ignore
 */
export class U3dOutline {
    /**
     * 외곽선을 추출할 형상을 가지며 생성된 외곽선을 자식으로 포함하는 실제 렌더 메시입니다.
     *
     * @type {UGeometryOutlineTarget | undefined}
     */
    _targetMesh;
    /** @type {{value: number}} */
    _tension = {value: 1};
    /** @type {U3dOutlineFactory | undefined} */ #create;
    /** @type {number} */ #offset = 0;
    /**
     * 외곽선의 스타일·생성 방법·수명을 관리하는 소유 도형입니다. 실제 렌더 메시와 다를 수 있습니다.
     *
     * @type {any}
     */
    #owner;

    /**
     * 외곽선을 관리할 도형을 저장합니다.
     *
     * @param {import('@union3d/geometry/U3dGeometry').U3dGeometry} owner 외곽선 스타일과 도형별 생성 전략을 제공하는 도형
     */
    constructor(owner) { this.#owner = owner; }

    /**
     * 자동 외곽선에 연결된 AO 계산용 법선 재질을 반환합니다.
     *
     * @param {import('three').Object3D} object AO에 기록할 외곽선
     */
    static _getNormalMaterial(object) {
        return owners.has(object) ? object.userData._u3dGeometryOutlineNormalMaterial : undefined;
    }

    /**
     * 색상·투명도 등 외곽선 스타일을 갱신할 원본 재질을 반환합니다.
     *
     * @param {import('three').Object3D & Partial<{material: import('three').Material | Array<import('three').Material>}>} object 스타일을 갱신할 객체
     */
    static _getStyleMaterial(object) {
        return styleMaterials.get(object)
            ?? (object.material === U3dOutline._getNormalMaterial(object) || object.userData._u3dGeometryOutlineDepthOnly
                ? colorMaterials.get(object) : object.material);
    }

    /**
     * 임시 렌더링 중 스타일 갱신에 사용할 원본 재질을 지정하고 이전 연결을 반환합니다.
     *
     * @param {import('three').Object3D} object 임시 재질을 사용하는 객체
     * @param {import('three').Material | Array<import('three').Material> | undefined} material 원본 재질. undefined면 연결 해제
     */
    static _setStyleMaterial(object, material) {
        const previous = styleMaterials.get(object);
        if (material) styleMaterials.set(object, material);
        else styleMaterials.delete(object);
        return previous;
    }

    /**
     * 객체의 재질을 보조 렌더링용으로 교체하고 복원에 필요한 기존 재질과 스타일 연결을 저장합니다.
     * 중첩 패스도 색상 원본을 유지합니다.
     *
     * @param {Array<U3dOutlineMaterialState>} records 복원할 상태를 쌓을 배열
     * @param {import('three').Mesh} object 임시 재질을 적용할 객체
     * @param {import('three').Material | Array<import('three').Material>} material 보조 패스 재질
     * @param {import('three').Material | Array<import('three').Material>} [originalMaterial=object.material] 복원할 재질
     *
     * @ignore
     */
    static _pushMaterialOverride(records, object, material, originalMaterial = object.material) {
        const previousStyle = U3dOutline._setStyleMaterial(object, styleMaterials.get(object) ?? originalMaterial);
        records.push({object, material: originalMaterial, styleMaterial: previousStyle});
        object.material = material;
    }

    /**
     * 보조 렌더링에서 교체한 객체 재질과 스타일 연결을 원래 상태로 복원합니다.
     * 저장한 상태를 역순으로 복원하고 배열을 비웁니다.
     *
     * @param {Array<U3dOutlineMaterialState>} records 복원할 상태
     *
     * @ignore
     */
    static _restoreMaterialOverrides(records) {
        while (records.length) {
            const state = /** @type {U3dOutlineMaterialState} */(records.pop());
            state.object.material = state.material;
            U3dOutline._setStyleMaterial(state.object, state.styleMaterial);
        }
    }

    /**
     * 보조 렌더링 함수를 실행한 뒤 렌더러와 장면을 실행 전 상태로 복원합니다.
     * 렌더 타깃·뷰포트·배경 지우기 설정·장면의 임시 재질을 성공·실패 후 모두 복원합니다.
     *
     * @param {import('@union3d/core/URenderer').URenderer} renderer 현재 엔진 렌더러
     * @param {import('@union3d/core/UScene').UScene} scene 보조 그리기의 엔진 장면
     * @param {() => void} render 동기 보조 그리기
     *
     * @ignore
     */
    static _withRenderState(renderer, scene, render) {
        withOutlineRenderState(renderer, scene, render);
    }

    /**
     * 외곽선 생성 방법을 저장하고 현재 도형에 맞는 외곽선으로 교체합니다.
     * 기존 외곽선과 보조 렌더링 자원을 함께 교체합니다.
     *
     * @param {U3dOutlineFactory} create 생성 전략
     * @param {number} [offset=0] 부모 기준 렌더 순서
     */
    _replace(create, offset = 0) {
        this._targetMesh = this.#owner;
        this.#create = create;
        this.#offset = offset;
        this._refresh();
    }

    /**
     * 현재 도형의 형상과 표시 설정에 맞춰 외곽선을 다시 생성하거나 제거합니다.
     * 저장한 생성 함수를 사용하는 형상 교체·표시 전환의 공통 진입점입니다.
     *
     * @ignore
     */
    _refresh() {
        if (!this.#owner._supportsOutline()) return;
        if (!this.#create) { this._update(); return; }
        this._dispose();
        if (!this.#owner.outline || this.#owner._disposed) return;
        const targetMesh = /** @type {UGeometryOutlineTarget} */(this._targetMesh);
        const geometry = targetMesh.geometry;
        if (!geometry?.getAttribute('position')?.count || typeof targetMesh.add !== 'function') return;
        const outline = this.#create(geometry);
        if (!outline) return;
        this._register(outline, this.#offset, targetMesh);
        targetMesh.add(outline);
    }

    /**
     * 튜브·원판·일반 메시의 형상에 맞는 외곽선 생성 방법을 선택하고 외곽선을 갱신합니다.
     *
     * @param {UGeometryOutlineTarget} [targetMesh] 실제 엔진 렌더 메시. 별도 메시를 사용하는 도형만 지정합니다.
     *
     * @ignore
     */
    _update(targetMesh) {
        if (!this.#owner._supportsOutline()) return;
        this._targetMesh = targetMesh ?? this._targetMesh ?? /** @type {import('@union3d/core/mesh/UMesh').UMesh} */(this.#owner);
        this.#offset = 0;
        this.#create = geometry => {
            const object = /** @type {UGeometryOutlineTarget} */(this._targetMesh);
            const source = Array.isArray(object.material) ? object.material[0] : object.material;
            if (!source) return undefined;
            const outline = geometry.type === 'TubeGeometry'
                ? this.#owner._createSilhouetteOutline(geometry, source.depthTest)
                : geometry.type === 'CircleGeometry'
                    ? this.#owner._createCircleOutline(geometry, source.depthTest)
                    : this.#owner._createEdgeOutline(geometry, source.depthTest);
            outline.raycast = () => {};
            return outline;
        };
        this._refresh();
    }

    /**
     * 메시의 모서리를 추출해 U3dLine 기반 외곽선을 생성합니다.
     *
     * @overload
     * @param {import('three').BufferGeometry} geometry 본체 형상
     * @param {boolean} depthTest 깊이 검사 여부
     * @param {number} thresholdAngle 모서리 추출 기준각
     * @param {typeof import('@union3d/geometry/U3dLine').U3dLine} LineType 선 생성자
     * @returns {UGeometryOutlineLine} 인덱스 기반 모서리 외곽선
     */
    /**
     * 메시의 모서리를 추출해 기본 선분 외곽선을 생성합니다.
     *
     * @overload
     * @param {import('three').BufferGeometry} geometry 본체 형상
     * @param {boolean} depthTest 깊이 검사 여부
     * @param {number} [thresholdAngle] 모서리 추출 기준각
     * @returns {import('three/examples/jsm/lines/LineSegments2.js').LineSegments2} 기본 선분 외곽선
     */
    /**
     * 메시의 모서리를 추출해 선 두께를 조절할 수 있는 외곽선 객체를 생성합니다.
     *
     * @param {import('three').BufferGeometry} geometry 본체 형상
     * @param {boolean} depthTest 깊이 검사 여부
     * @param {number} [thresholdAngle=1] 모서리 추출 기준각 (도)
     * @param {typeof import('@union3d/geometry/U3dLine').U3dLine} [LineType] U3dLine과 기반 클래스의 순환 참조를 피하도록 호출부에서 전달합니다
     * @returns {UGeometryOutlineLine | import('three/examples/jsm/lines/LineSegments2.js').LineSegments2} 굵기를 조절할 수 있는 경계선
     *
     * @ignore
     */
    _createEdge(geometry, depthTest, thresholdAngle = 1, LineType) {
        const edges = new THREE.EdgesGeometry(geometry, thresholdAngle);
        try {
            if (LineType) {
                const outline = this.#owner._createOutlineSegments(edges, depthTest, LineType);
                this.#retainBranchCaps(outline);
                bindOutlineCorners(outline, this._tension);
                return outline;
            }
            return this.#owner._createOutlineSegments(edges, depthTest);
        } finally {
            edges.dispose();
        }
    }

    /**
     * 여러 모서리가 만나는 분기점에서 각 선의 둥근 끝이 유지되도록 연결 정보를 보정합니다.
     *
     * @param {UGeometryOutlineLine} outline 인덱스 선분으로 구성한 외곽선
     *
     * @ignore
     */
    #retainBranchCaps(outline) {
        const previous = outline.geometry.getAttribute('instancePrevious');
        const next = outline.geometry.getAttribute('instanceNext');
        if (!previous || !next) return;
        const starts = outline.geometry.getAttribute('instanceStart');
        const ends = outline.geometry.getAttribute('instanceEnd');
        const degrees = new Map();
        const keys = [starts, ends].map(attribute => Array.from({length: attribute.count}, (_, i) => {
            const key = `${attribute.getX(i)},${attribute.getY(i)},${attribute.getZ(i)}`;
            degrees.set(key, (degrees.get(key) ?? 0) + 1);
            return key;
        }));
        let joined = false;
        for (let i = 0; i < starts.count; i++) {
            // 메시의 분기점은 한 경로가 아닙니다. 임의의 두 모서리를 이어
            // 화면 이등분선으로 자르면 회전 중 다른 끝마개가 드러나거나 잘립니다.
            // 분기점은 박스처럼 독립 끝마개를 유지하고 두 선의 경로만 연결합니다.
            if (degrees.get(keys[0][i]) > 2) previous.setXYZ(i, starts.getX(i), starts.getY(i), starts.getZ(i));
            if (degrees.get(keys[1][i]) > 2) next.setXYZ(i, ends.getX(i), ends.getY(i), ends.getZ(i));
            joined ||= previous.getX(i) !== starts.getX(i) || previous.getY(i) !== starts.getY(i)
                || previous.getZ(i) !== starts.getZ(i) || next.getX(i) !== ends.getX(i)
                || next.getY(i) !== ends.getY(i) || next.getZ(i) !== ends.getZ(i);
        }
        if (!joined) {
            outline.geometry.deleteAttribute('instancePrevious');
            outline.geometry.deleteAttribute('instanceNext');
            delete outline.material.defines.U_LINE_JOIN;
        }
    }

    /**
     * 준비된 경계 선분으로 U3dLine 기반 외곽선을 생성합니다.
     *
     * @overload
     * @param {import('three').BufferGeometry} edges 선분 형상
     * @param {boolean} depthTest 깊이 검사 여부
     * @param {typeof import('@union3d/geometry/U3dLine').U3dLine} LineType 선 생성자
     * @returns {UGeometryOutlineLine} 인덱스 기반 모서리 외곽선
     */
    /**
     * 준비된 경계 선분으로 기본 선분 외곽선을 생성합니다.
     *
     * @overload
     * @param {import('three').BufferGeometry} edges 선분 형상
     * @param {boolean} [depthTest] 깊이 검사 여부
     * @returns {import('three/examples/jsm/lines/LineSegments2.js').LineSegments2} 기본 선분 외곽선
     */
    /**
     * 준비된 경계 선분으로 색상·투명도·두께가 적용된 외곽선 객체를 생성합니다.
     * 입력 형상의 자원은 호출자가 소유합니다.
     *
     * @param {import('three').BufferGeometry} edges 선분 쌍의 position 속성을 가진 형상
     * @param {boolean} [depthTest=true] 깊이 검사 여부
     * @param {typeof import('@union3d/geometry/U3dLine').U3dLine} [LineType] 인덱스 선분을 렌더링할 선 생성자
     * @returns {UGeometryOutlineLine | import('three/examples/jsm/lines/LineSegments2.js').LineSegments2} 굵기를 조절할 수 있는 경계선
     *
     * @ignore
     */
    _createSegments(edges, depthTest = true, LineType) {
        /** @type {UGeometryOutlineLine | import('three/examples/jsm/lines/LineSegments2.js').LineSegments2} */
        let outline;
        if (LineType) {
            const position = edges.getAttribute('position');
            /** @type {Array<import('three').Vector3>} */ const vertices = [];
            /** @type {Array<U3dLineSegment>} */ const segments = [];
            const indices = new Map();
            /**
             * 같은 좌표의 정점을 하나로 합쳐 사용할 정점 인덱스를 반환합니다.
             *
             * @param {number} i 선분 형상의 정점 인덱스
             */
            const indexAt = i => {
                const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
                const key = `${x},${y},${z}`;
                if (!indices.has(key)) { indices.set(key, vertices.length); vertices.push(new THREE.Vector3(x, y, z)); }
                return /** @type {number} */(indices.get(key));
            };
            for (let i = 0; i + 1 < position.count; i += 2) {
                const a = indexAt(i), b = indexAt(i + 1);
                if (a !== b) segments.push([a, b]);
            }
            // 로컬 정점과 부모에서 위도 보정한 월드 두께를 전달해 중복 보정을 피합니다.
            outline = /** @type {UGeometryOutlineLine} */(/** @type {unknown} */(new LineType({
                vertices, segments, tension: 0, color: this.#owner._lineColor, lineWidth: this.#owner._getOutlineRenderWidth(),
                worldUnits: this.#owner.getOutlineType() === 'meter', opacity: this.#owner.getLineOpacity()
            })));
        } else {
            const lines = new LineSegmentsGeometry().setPositions(/** @type {Float32Array} */(edges.getAttribute('position').array));
            outline = new LineSegments2(lines, new ULineMaterial({color: this.#owner._lineColor,
                linewidth: this.#owner._getOutlineRenderWidth(), worldUnits: this.#owner.getOutlineType() === 'meter', opacity: this.#owner.getLineOpacity()}));
        }
        const material = outline.material;
        material.uniforms.uLineCornerTension = this._tension;
        if (LineType) {
            const positionMaterial = /** @type {import('three').ShaderMaterial | undefined} */(/** @type {UGeometryOutlineLine} */(outline).customWorldPositionMaterial);
            if (positionMaterial) positionMaterial.uniforms.uLineCornerTension = this._tension;
        }
        material.depthTest = depthTest;
        material.depthWrite = false;
        material.polygonOffset = true;
        material.polygonOffsetFactor = -1;
        material.polygonOffsetUnits = -1;
        material.onBeforeCompile = shader => {
            // 로그 깊이를 직접 기록하는 셰이더에는 하드웨어 polygonOffset이 적용되지 않습니다.
            shader.fragmentShader = shader.fragmentShader.replace('#include <logdepthbuf_fragment>', `
                #include <logdepthbuf_fragment>
                #if defined(USE_LOGARITHMIC_DEPTH_BUFFER) || defined(USE_LOGDEPTHBUF)
                    gl_FragDepth -= 0.0000001;
                #else
                    gl_FragDepth = gl_FragCoord.z - 0.0000001;
                #endif
            `);
        };
        const viewport = new THREE.Vector4();
        const previous = outline.onBeforeRender;
        outline.onBeforeRender = (renderer, scene, camera, geometry, mat, group) => {
            const worldUnits = this.#owner.getOutlineType() === 'meter';
            if (material.worldUnits !== worldUnits) {
                material.worldUnits = worldUnits;
                material.needsUpdate = true;
                if (LineType) {
                    const line = /** @type {UGeometryOutlineLine} */(outline);
                    line.worldUnits = worldUnits;
                    if (line.customWorldPositionMaterial) {
                        const positionMaterial = /** @type {import('three/examples/jsm/lines/LineMaterial.js').LineMaterial} */(line.customWorldPositionMaterial);
                        positionMaterial.worldUnits = worldUnits;
                        positionMaterial.needsUpdate = true;
                    }
                }
            }
            if (LineType) previous.call(outline, renderer, scene, camera, geometry, mat, group);
            renderer.getCurrentViewport(viewport);
            material.resolution.set(viewport.z, viewport.w);
            // ULineMaterial이 CSS 픽셀과 렌더 타깃의 배율을 처리합니다.
            const width = this.#owner._getOutlineRenderWidth();
            if (LineType) {
                const line = /** @type {UGeometryOutlineLine} */(outline);
                line.setLineWidth(width);
                // 좌표·AO 재질을 먼저 그려도 동기화 원본에는 최신 두께가 있어야 합니다.
                material.linewidth = line.getLineWidth();
            } else material.linewidth = width;
        };
        return outline;
    }

    /**
     * 원판의 원둘레를 중심으로 양쪽에 절반씩 두께를 가진 테두리 메시를 생성합니다.
     * 공유 정점을 연결한 띠를 사용합니다.
     *
     * @param {import('three').BufferGeometry} geometry 원판 형상
     * @param {boolean} depthTest 깊이 검사 여부
     * @returns {import('three').Mesh} 원판 평면에서 월드 두께만큼 확장되는 테두리
     *
     * @ignore
     */
    _createCircle(geometry, depthTest) {
        const source = geometry.getAttribute('position');
        // CircleGeometry는 중심 다음에 둘레 정점과 첫 정점의 복제본을 저장합니다.
        const count = source.count - 2;
        const positions = [], previous = [], next = [], sides = [], indices = [];
        for (let i = 0; i < count; i++) {
            const currentIndex = i + 1;
            const previousIndex = (i + count - 1) % count + 1;
            const nextIndex = (i + 1) % count + 1;
            for (const side of [-0.5, 0.5]) {
                positions.push(source.getX(currentIndex), source.getY(currentIndex), source.getZ(currentIndex));
                previous.push(source.getX(previousIndex), source.getY(previousIndex), source.getZ(previousIndex));
                next.push(source.getX(nextIndex), source.getY(nextIndex), source.getZ(nextIndex));
                sides.push(side);
            }
            const a = i * 2, b = ((i + 1) % count) * 2;
            indices.push(a, a + 1, b, b, a + 1, b + 1);
        }
        const ring = new THREE.BufferGeometry();
        ring.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        ring.setAttribute('outlinePrevious', new THREE.Float32BufferAttribute(previous, 3));
        ring.setAttribute('outlineNext', new THREE.Float32BufferAttribute(next, 3));
        ring.setAttribute('outlineSide', new THREE.Float32BufferAttribute(sides, 1));
        ring.setIndex(indices);
        const width = {value: this.#owner._getOutlineWorldWidth()};
        const material = new THREE.MeshBasicMaterial({color: this.#owner._lineColor, opacity: this.#owner.getLineOpacity(),
            transparent: this.#owner.getLineOpacity() < 1, side: THREE.DoubleSide, depthTest, depthWrite: true});
        material.onBeforeCompile = shader => {
            shader.uniforms.uGeometryOutlineWidth = width;
            shader.vertexShader = `
                attribute vec3 outlinePrevious;
                attribute vec3 outlineNext;
                attribute float outlineSide;
                uniform float uGeometryOutlineWidth;
            ` + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
                #include <project_vertex>
                // EPSG:3857의 큰 절대 좌표에서 작은 두께가 소실되지 않도록
                // 카메라 기준 좌표에서 같은 월드 길이를 계산합니다.
                vec3 previousView = (modelViewMatrix * vec4(outlinePrevious, 1.0)).xyz;
                vec3 currentView = (modelViewMatrix * vec4(transformed, 1.0)).xyz;
                vec3 nextView = (modelViewMatrix * vec4(outlineNext, 1.0)).xyz;
                vec3 previousDirection = currentView - previousView;
                vec3 nextDirection = nextView - currentView;
                if (length(previousDirection) > 0.00001 && length(nextDirection) > 0.00001) {
                    previousDirection = normalize(previousDirection);
                    nextDirection = normalize(nextDirection);
                    vec3 planeNormal = normalize(cross(previousDirection, nextDirection));
                    vec3 previousNormal = normalize(cross(previousDirection, planeNormal));
                    vec3 nextNormal = normalize(cross(nextDirection, planeNormal));
                    vec3 miter = normalize(previousNormal + nextNormal);
                    vec3 offset = miter * geometryOutlineWidth(uGeometryOutlineWidth, currentView) / max(dot(miter, nextNormal), 0.25);
                    mvPosition = vec4(currentView + offset * outlineSide, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `);
        };
        const outline = new THREE.Mesh(ring, material);
        outline.onBeforeRender = () => {
            width.value = this.#owner._getOutlineWorldWidth();
        };
        this.#owner._bindOutlinePixelWidth(outline);
        return outline;
    }

    /**
     * 곡면의 윤곽을 중심으로 양쪽에 절반씩 두께를 가진 테두리를 생성합니다.
     * 반 두께만 확장한 곡면과 반 두께만 축소한 실루엣 마스크를 사용합니다.
     *
     * @param {import('three').BufferGeometry} geometry 본체의 로컬 형상
     * @param {boolean} [depthTest=true] 다른 객체에 대한 깊이 검사 여부
     * @returns {import('three').Mesh} 독립된 형상과 재질을 소유하는 외곽선
     *
     * @ignore
     */
    _createSilhouette(geometry, depthTest = true) {
        const width = {value: this.#owner._getOutlineWorldWidth()};
        if (!geometry.boundingSphere) geometry.computeBoundingSphere();
        // 위도 이동 시 본체 경계가 갱신되어도 외곽선 배율은 생성 시 로컬 경계에 한 번만 적용합니다.
        const bounds = /** @type {import('three').Sphere} */(geometry.boundingSphere).clone();
        const inset = new THREE.Object3D(), scale = new THREE.Matrix4();
        const center = new THREE.Vector3(), viewport = new THREE.Vector4();
        const material = new THREE.MeshBasicMaterial({
            color: this.#owner._lineColor, opacity: this.#owner.getLineOpacity(), transparent: this.#owner.getLineOpacity() < 1,
            // 뒤에 그려지는 불투명 지도·지형이 바깥 테두리를 덮지 않게 깊이를 기록합니다.
            side: THREE.FrontSide, depthTest, depthWrite: true
        });
        material.onBeforeCompile = shader => {
            shader.uniforms.uGeometryOutlineWidth = width;
            shader.vertexShader = 'uniform float uGeometryOutlineWidth;\n' + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
                #include <project_vertex>
                mvPosition.xyz += normalize(normalMatrix * normal) * geometryOutlineWidth(uGeometryOutlineWidth * .5, mvPosition.xyz);
                gl_Position = projectionMatrix * mvPosition;
            `);
        };
        const outline = new THREE.Mesh(geometry.clone(), material);
        // 확장 폭은 카메라와 단위에 따라 셰이더에서 결정되어 원본 구의 경계로 판정할 수 없습니다.
        outline.frustumCulled = false;
        outline.onBeforeRender = (renderer, scene, camera) => {
            width.value = this.#owner._getOutlineWorldWidth();
            let halfWidth = width.value * .5;
            if (this.#owner.getOutlineType() === 'pixel') {
                renderer.getCurrentViewport(viewport);
                center.copy(bounds.center).applyMatrix4(outline.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
                const depth = camera.projectionMatrix.elements[11] === -1 ? Math.abs(center.z) : 1;
                const ratio = renderer.getPixelRatio();
                halfWidth = this.#owner.getLineWidth() * ratio * depth / (Math.abs(camera.projectionMatrix.elements[5]) * viewport.w);
            }
            const factor = Math.max(0, 1 - halfWidth / Math.max(bounds.radius * outline.matrixWorld.getMaxScaleOnAxis(), 1e-8));
            scale.makeScale(factor, factor, factor).setPosition(center.copy(bounds.center).multiplyScalar(1 - factor));
            inset.matrixWorld.multiplyMatrices(outline.matrixWorld, scale);
        };
        outline.raycast = () => {};
        this.#owner._bindOutlinePixelWidth(outline, .5);
        bindGeometryOutlineMask(outline, outline.geometry, {source: inset,
            occlusionSource: geometry.type === 'SphereGeometry'
                ? /** @type {import('@union3d/core/mesh/UMesh').UMesh} */(this.#owner) : undefined});
        return outline;
    }

    /**
     * 현재 외곽선을 도형에서 제거하고 외곽선이 소유한 형상과 재질을 해제합니다.
     * 본체·공유 텍스처·사용자 자식은 보존합니다.
     *
     * @ignore
     */
    _dispose() {
        const owner = /** @type {any} */(this.#owner);
        const outline = owner._outline;
        owner._outline = undefined;
        if (!outline) return;
        outline.removeFromParent();
        if (typeof outline.getSegments === 'function') {
            // U3dLine이 소유한 좌표 출력용 재질도 함께 해제합니다.
            outline.dispose();
        } else {
            outline.geometry.dispose();
            outline.material.dispose();
        }
    }

    /**
     * 도형의 유일한 외곽선을 등록하고 기존 외곽선이 다르면 제거·해제합니다.
     * 도형의 변환·렌더 순서와 보조 렌더링을 연결합니다.
     * 외곽선의 렌더 순서를 도형의 현재 값에 연결합니다.
     * 렌더 목록을 만들 때부터 적용되므로 부모 값을 직접 바꿔도 다음 정렬에 반영됩니다.
     *
     * @param {import('three').Object3D} outline 외곽선 객체
     * @param {number} [offset=0] 부모 렌더 순서에 더할 값
     * @param {UGeometryOutlineTarget} [owner] 외곽선을 포함하는 엔진 렌더 객체
     *
     * @ignore
     */
    _register(outline, offset = 0, owner = /** @type {import('@union3d/core/mesh/UMesh').UMesh} */(this.#owner)) {
        if (this.#owner._outline !== outline) this._dispose();
        // 선택 하이라이트는 이 보조 메시를 제외하고 도형 본체의 경계를 사용합니다.
        /** @type {import('three').Object3D & {isOutline: boolean}} */(outline).isOutline = true;
        outline.userData._u3dGeometryOutline = true;
        if (owners.get(outline) !== this) {
            owners.set(outline, this);
            const mesh = /** @type {import('three').Mesh} */(outline);
            colorMaterials.set(outline, mesh.material);
            const geometry = mesh.geometry;
            const release = () => {
                owners.delete(outline);
                colorMaterials.delete(outline);
                for (const child of outline.children) colorMaterials.delete(child);
                geometry.removeEventListener('dispose', release);
            };
            geometry.addEventListener('dispose', release);
        }
        this._applyOpacity(outline);
        // 지도 엔진은 본체 행렬만 수동 갱신할 수 있습니다. 렌더 직전 콜백보다 앞선
        // 프러스텀 판정에서도 새 외곽선이 부모의 최신 월드 변환을 사용하게 연결합니다.
        const worldMatrix = new THREE.Matrix4();
        Object.defineProperty(outline, 'matrixWorld', {
            configurable: true,
            enumerable: true,
            get: () => {
                if (outline.matrixAutoUpdate) outline.updateMatrix();
                return worldMatrix.multiplyMatrices(owner.matrixWorld, outline.matrix);
            },
            set: value => { worldMatrix.copy(value); }
        });
        Object.defineProperty(outline, 'renderOrder', {
            configurable: true,
            enumerable: true,
            get: () => owner.renderOrder + offset,
            set: (value) => { offset = value - owner.renderOrder; }
        });
        bindOutlineNormalMaterial(/** @type {import('three').Mesh} */(outline));
        bindOutlineOpaqueDepth(/** @type {import('three').Mesh} */(outline));
        bindOutlineViewportCulling(/** @type {import('three').Mesh} */(outline), owner);
        for (const child of outline.children) {
            if (child.userData._u3dGeometryOutlineDepthOnly) colorMaterials.set(child, /** @type {import('three').Mesh} */(outline).material);
        }
        this.#owner._outline = outline;
    }

    /**
     * 외곽선이 화면에서 지정한 픽셀 두께를 유지하도록 카메라 거리에 따른 두께 환산을 연결합니다.
     * 색상·좌표 출력 재질이 같은 두께를 사용하며 meter 모드의 기존 형상은 유지합니다.
     *
     * @param {import('three').Mesh & Partial<{customWorldPositionMaterial: import('three').Material}>} outline 외곽선 메시
     * @param {number} [widthRatio=1] 전체 두께에 대한 비율
     *
     * @ignore
     */
    _bindPixelWidth(outline, widthRatio = 1) {
        const pixelWidth = {value: -1}, pixelScale = {value: 0};
        for (const material of [outline.material, outline.customWorldPositionMaterial]) {
            if (!material || Array.isArray(material)) continue;
            const compile = material.onBeforeCompile, key = material.customProgramCacheKey();
            material.onBeforeCompile = (shader, renderer) => {
                compile.call(material, shader, renderer);
                shader.uniforms.uGeometryOutlinePixelWidth = pixelWidth;
                shader.uniforms.uGeometryOutlinePixelScale = pixelScale;
                shader.vertexShader = `
                    uniform float uGeometryOutlinePixelWidth, uGeometryOutlinePixelScale;
                    float geometryOutlineWidth(float meterWidth, vec3 viewPosition) {
                        if (uGeometryOutlinePixelWidth < 0.0) return meterWidth;
                        float depth = projectionMatrix[2][3] == -1.0 ? max(abs(viewPosition.z), 0.000001) : 1.0;
                        return uGeometryOutlinePixelWidth * uGeometryOutlinePixelScale * depth / abs(projectionMatrix[1][1]);
                    }
                ` + shader.vertexShader;
            };
            material.customProgramCacheKey = () => `${key}|outline-units:v1`;
        }
        const viewport = new THREE.Vector4(), previous = outline.onBeforeRender;
        outline.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
            previous.call(outline, renderer, scene, camera, geometry, material, group);
            if (this.#owner.getOutlineType() === 'meter') { pixelWidth.value = -1; return; }
            renderer.getCurrentViewport(viewport);
            const ratio = renderer.getPixelRatio();
            pixelWidth.value = this.#owner.getLineWidth() * widthRatio;
            pixelScale.value = 2 * ratio / Math.max(1, viewport.w);
        };
    }

    /**
     * 도형의 외곽선 불투명도를 재질에 반영하고 투명 처리와 표시 여부를 갱신합니다.
     *
     * @param {import('three').Object3D} outline 소유한 외곽선 객체
     */
    _applyOpacity(outline) {
        const object = /** @type {import('three').Mesh} */(outline);
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
            material.opacity = this.#owner.getLineOpacity();
            material.transparent = this.#owner.getLineOpacity() < 1;
            material.visible = this.#owner.getLineOpacity() > 0;
            const uniforms = /** @type {import('three').ShaderMaterial} */(material).uniforms;
            if (uniforms?.opacity) uniforms.opacity.value = this.#owner.getLineOpacity();
            if (uniforms?.uOpacity) uniforms.uOpacity.value = this.#owner.getLineOpacity();
            material.needsUpdate = true;
        }
    }
}
