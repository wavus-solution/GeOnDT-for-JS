/**
 * 수신 위치 확인용 디버그 상자를 InstancedMesh 하나로 관리하는 기능 모듈입니다.
 *
 * 항공기 수가 수백 개까지 늘어나므로 상자를 개별 Mesh로 만들면 Draw Call이 급격히 증가합니다.
 * 미리 확보한 Instance를 재사용하고 숨길 때는 Scale을 0으로 만들어 표시 상태만 바꿉니다.
 */

/** 기본으로 확보하는 Instance 수입니다. */
const DEFAULT_CAPACITY = 500;
/** 디버그 상자 한 변의 길이(m)입니다. */
const DEFAULT_BOX_SIZE = 300;
/** 디버그 상자 색상입니다. */
const DEFAULT_BOX_COLOR = 0x00ff00;
/** 지형과 모델보다 항상 위에 그리기 위한 렌더 순서입니다. */
const DEBUG_RENDER_ORDER = 9_999;

/**
 * 디버그 상자 Instance Pool을 생성합니다.
 * @param {U3dApp} app GeOnDT 앱
 * @param {Partial<{capacity: number, size: number, color: number}>} [options={}] 생성 옵션
 * @returns {Record<string, unknown>} 디버그 상자 Pool
 */
export function createDebugBoxPool(app, options = {}) {
    const THREE = Union3D.THREE;
    const size = Number(options.size) > 0 ? Number(options.size) : DEFAULT_BOX_SIZE;
    const color = options.color ?? DEFAULT_BOX_COLOR;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const visibleScale = new THREE.Vector3(1, 1, 1);
    const hiddenScale = new THREE.Vector3(0, 0, 0);

    let capacity = Math.max(1, Math.trunc(Number(options.capacity) || DEFAULT_CAPACITY));
    let geometry;
    let material;
    let mesh;
    let disposed = false;

    /**
     * 지정한 Instance 수만큼 InstancedMesh를 새로 만들어 지도에 추가합니다.
     * @param {number} count Instance 수
     */
    function createMesh(count) {
        geometry = new THREE.BoxGeometry(size, size, size);
        material = new THREE.MeshBasicMaterial({color, wireframe: true, depthTest: false, depthWrite: false});
        mesh = new THREE.InstancedMesh(geometry, material, count);
        mesh.renderOrder = DEBUG_RENDER_ORDER;
        mesh.frustumCulled = false;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        hideAll();
        app.addObject(mesh);
    }

    /** 모든 Instance를 숨김 상태로 초기화합니다. */
    function hideAll() {
        for (let index = 0; index < capacity; index += 1) {
            matrix.compose(position.set(0, 0, 0), quaternion, hiddenScale);
            mesh.setMatrixAt(index, matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
    }

    /**
     * 필요한 Instance 수를 확보합니다. 부족하면 기존 배치를 옮겨 담아 재생성합니다.
     * @param {number} requiredCount 필요한 Instance 수
     */
    function ensureCapacity(requiredCount) {
        if (disposed) return;
        const required = Math.max(1, Math.trunc(Number(requiredCount) || 0));
        if (required <= capacity) return;

        const nextCapacity = Math.max(required, capacity * 2);
        const previousMesh = mesh;
        const previousGeometry = geometry;
        const previousMaterial = material;
        const previousMatrices = [];
        for (let index = 0; index < capacity; index += 1) {
            const stored = new THREE.Matrix4();
            previousMesh.getMatrixAt(index, stored);
            previousMatrices.push(stored);
        }

        capacity = nextCapacity;
        createMesh(nextCapacity);
        previousMatrices.forEach((stored, index) => mesh.setMatrixAt(index, stored));
        mesh.instanceMatrix.needsUpdate = true;

        app.removeObject(previousMesh);
        previousGeometry?.dispose?.();
        previousMaterial?.dispose?.();
    }

    createMesh(capacity);

    return {
        ensureCapacity,

        /**
         * 지정한 Instance의 위치와 표시 상태를 변경합니다.
         * @param {number} index Instance 번호
         * @param {{x: number, y: number, z: number}} worldPosition 월드 좌표
         * @param {boolean} [visible=true] 표시 여부
         */
        update(index, worldPosition, visible = true) {
            if (disposed || !worldPosition) return;
            const target = Math.trunc(Number(index));
            if (!Number.isFinite(target) || target < 0) return;

            ensureCapacity(target + 1);
            position.set(worldPosition.x, worldPosition.y, worldPosition.z);
            matrix.compose(position, quaternion, visible ? visibleScale : hiddenScale);
            mesh.setMatrixAt(target, matrix);
            mesh.instanceMatrix.needsUpdate = true;
        },

        /**
         * 지정한 Instance를 숨깁니다.
         * @param {number} index Instance 번호
         */
        hide(index) {
            this.update(index, {x: 0, y: 0, z: 0}, false);
        },

        /** 확보한 모든 Instance를 숨깁니다. */
        hideAll() {
            if (disposed) return;
            hideAll();
        },

        /** InstancedMesh와 GPU 자원을 해제합니다. */
        dispose() {
            if (disposed) return;
            disposed = true;
            app.removeObject(mesh);
            geometry?.dispose?.();
            material?.dispose?.();
            mesh = undefined;
            geometry = undefined;
            material = undefined;
        }
    };
}
