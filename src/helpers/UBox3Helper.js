//@ts-check
import {Box3Helper, BufferGeometry, Color, LineSegments} from 'three';
import {INTERNAL} from '@union3d/helpers/UBox3Helper.internal';

/**
 * ~extends import('three').LineSegments <br>
 * Box3의 외곽선을 표시하며 geometry와 같은 색상의 재질을 인스턴스 사이에서 공유한다.
 * box는 복제하지 않고 참조하므로 변경 후 updateMatrixWorld()로 표시 변환을 갱신한다.
 * 공유 재질의 속성 변경은 같은 재질을 쓰는 다른 helper에도 영향을 준다.
 *
 * @group helpers
 */
class UBox3Helper extends LineSegments {
    /** @type {boolean} */ _disposed = false;
    // 공개 color/material/geometry가 변경되어도 실제로 획득한 공유 자원을 반납한다.
    /** @type {number} */ #materialKey;
    /** @type {import('three').Material | Array<import('three').Material>} */ #sharedMaterial;
    /** @type {import('three').BufferGeometry} */ #sharedGeometry;
    /** @type {WeakMap<import('three').BufferGeometry, number>} */ static #geometryReferences = new WeakMap();
    /**
     * 색상 키별 공유 재질 저장소다.
     * 기존 공개 Map에는 외부에서 임의의 키·값을 넣을 수 있으므로 기존 any 계약을 유지한다.
     * 이 클래스가 직접 등록하는 값은 LineBasicMaterial이다.
     *
     * @name UBox3Helper.sharedMaterials
     * @static
     *
     * @type {Map<any, any>}
     */
    static sharedMaterials = new Map();

    /**
     * 색상 키별 재질의 남은 참조 횟수입니다. 색상 변경과 해제에서 이전 참조를 한 번 반납합니다.
     *
     * @name UBox3Helper.sharedState
     * @static
     *
     * @type {Map<number, number>}
     */
    static sharedState = new Map();

    // 모든 helper가 같은 외곽선 버퍼를 사용하도록 모듈 초기화 때 한 번 준비한다.
    /**
     * @name UBox3Helper.sharedIndex
     * @static
     *
     * @type {import('three').BufferAttribute}
     */
    static sharedIndex = INTERNAL.createIndexAttribute();

    /**
     * @name UBox3Helper.sharedPositionAttr
     * @static
     *
     * @type {import('three').Float32BufferAttribute}
     */
    static sharedPositionAttr = INTERNAL.createPositionAttribute();

    /**
     * 첫 생성자 호출에서 준비하며 살아 있는 helper들이 공유하는 geometry입니다.
     * 마지막 helper가 반납하면 해제하고 정적 참조를 비우며, 이후 생성 시 다시 준비합니다.
     *
     * @name UBox3Helper.sharedGeometry
     * @static
     *
     * @type {undefined | import('three').BufferGeometry}
     */
    static sharedGeometry;

    /**
     * 상위 생성자가 설정한 값을 보존하면서 기존 TS의 쓰기 가능한 type 선언을 유지한다.
     * Box3Helper 종류 값은 아래 생성자에서 box·color 연결 후 설정한다.
     *
     * @override
     *
     * @type {string}
     */
    type = this.type;

    /**
     * 표시할 box와 공유 재질을 연결한다. 색상 변환 등의 오류는 호출자에게 전달한다.
     *
     * @param {import('three').Box3} box 표시할 경계 상자의 원본 참조.
     * @param {import('three').Color | string | number} [color=0xffff00] Three.js가 해석할 선 색상.
     */
    constructor(box, color = 0xffff00) {
        if (!UBox3Helper.sharedGeometry) {
            UBox3Helper.sharedGeometry = new BufferGeometry();
            UBox3Helper.sharedGeometry.setIndex(UBox3Helper.sharedIndex);
            UBox3Helper.sharedGeometry.setAttribute('position', UBox3Helper.sharedPositionAttr);
        }

        // 생성자의 isColor 판정은 setColor/createMaterial의 instanceof 판정과 서로 다르다.
        if (!(/** @type {Partial<import('three').Color>} */ (color)).isColor) {
            color = new Color(color);
        }
        const material = UBox3Helper.createMaterial(color);
        super(UBox3Helper.sharedGeometry, material);
        this.#materialKey = (/** @type {import('three').Color} */ (color)).getHex();
        this.#sharedMaterial = material;
        this.#sharedGeometry = this.geometry;
        const geometryCount = UBox3Helper.#geometryReferences.get(this.#sharedGeometry) || 0;
        UBox3Helper.#geometryReferences.set(this.#sharedGeometry, geometryCount + 1);

        /**
         * 표시 대상 Box3의 원본 참조다. setBox() 또는 외부 대입으로 교체할 수 있다.
         *
         * @type {import('three').Box3}
         */
        this.box = box;

        /**
         * 현재 색상 참조입니다. 공유 참조의 반납에는 획득 시 보관한 색상 키를 사용합니다.
         *
         * @type {import('three').Color}
         */
        this.color = /** @type {import('three').Color} */ (color);

        this.type = 'Box3Helper';
        this.geometry.computeBoundingSphere();
    }

    /**
     * 같은 색상의 재질을 재사용하고 획득 횟수를 증가시킨다.
     * 공유 Map에 외부에서 넣은 값도 그대로 반환하므로 반환형은 기존 any 계약을 보존한다.
     *
     * @param {import('three').Color | string | number} color 재질 조회 또는 생성에 사용할 색상.
     * @returns {any} 기존 공개 캐시 값 또는 새로 만든 LineBasicMaterial.
     */
    static createMaterial(color) {
        if (!(color instanceof Color)) {
            color = new Color(color);
        }

        const colorHex = color.getHex();
        let material = UBox3Helper.sharedMaterials.get(colorHex);
        if (!material) {
            // 캐시 등록 전에 선 표시용 재질을 준비하며, 생성 실패 시 캐시는 변경하지 않는다.
            material = INTERNAL.createLineMaterial(color);
            UBox3Helper.sharedMaterials.set(colorHex, material);
            UBox3Helper.sharedState.set(colorHex, 1);
        } else {
            const count = UBox3Helper.sharedState.get(colorHex) || 0;
            UBox3Helper.sharedState.set(colorHex, count + 1);
        }
        return material;
    }

    /**
     * 표시 대상 참조만 교체한다. 위치·크기는 다음 updateMatrixWorld()에서 반영된다.
     *
     * @param {import('three').Box3} box3 새 표시 대상의 원본 참조.
     */
    setBox(box3) {
        this.box = box3;
    }

    /**
     * 색상에 대응하는 공유 재질로 교체하고 이전 재질의 참조를 반납합니다.
     * 같은 색상은 추가 획득하지 않으며, 해제를 시작한 helper에는 변경을 적용하지 않습니다.
     *
     * @param {import('three').Color | string | number} color 새 선 색상.
     */
    setColor(color) {
        if (this._disposed) return;
        if (!(color instanceof Color)) {
            color = new Color(color);
        }
        const colorKey = color.getHex();
        if (colorKey === this.#materialKey) {
            this.material = this.#sharedMaterial;
            this.color = color;
            return;
        }

        // 새 재질 획득이 성공한 뒤 연결을 바꾼다. 이전 재질의 해제 이벤트도 새 상태를 보게 한다.
        const material = UBox3Helper.createMaterial(color);
        const previousKey = this.#materialKey;
        const previousMaterial = this.#sharedMaterial;
        this.#materialKey = colorKey;
        this.#sharedMaterial = material;
        this.material = material;
        this.color = color;
        UBox3Helper.#releaseMaterial(previousKey, previousMaterial);
    }

    /**
     * 획득한 재질의 참조를 반납하고 마지막 참조이면 캐시와 자원을 정리합니다.
     *
     * @param {number} colorKey 획득 시 기록한 색상 키입니다.
     * @param {import('three').Material | Array<import('three').Material>} material 반납할 공유 재질입니다.
     *
     * @ignore
     */
    static #releaseMaterial(colorKey, material) {
        const count = (UBox3Helper.sharedState.get(colorKey) || 0) - 1;
        if (count > 0) {
            UBox3Helper.sharedState.set(colorKey, count);
            return;
        }

        // dispose 리스너에서 같은 색상을 다시 생성해도 새 캐시 항목을 지우지 않도록 먼저 비운다.
        UBox3Helper.sharedState.delete(colorKey);
        UBox3Helper.sharedMaterials.delete(colorKey);
        for (const entry of new Set(Array.isArray(material) ? material : [material])) entry.dispose();
    }

    /**
     * Three.js Box3Helper의 갱신 방식으로 현재 box의 중심과 크기를 표시 변환에 반영한다.
     *
     * @override
     *
     * @param {boolean} force 자식까지 월드 행렬 갱신을 강제할지 여부.
     */
    updateMatrixWorld(force) {
        Box3Helper.prototype.updateMatrixWorld.call(this, force);
    }

    /**
     * 부모에 해제를 알리고 이 helper가 획득한 geometry와 재질의 공유 참조를 반납합니다.
     * 각 자원은 마지막 참조가 반납될 때만 해제합니다.
     * 장면에서 자신을 제거하지 않으며 두 번째 호출부터는 정리를 반복하지 않습니다.
     *
     * @override
     */
    dispose() {
        if (this._disposed) return;
        this._disposed = true;
        super.dispose();

        const geometry = this.#sharedGeometry;
        const count = (UBox3Helper.#geometryReferences.get(geometry) || 0) - 1;
        if (count > 0) {
            UBox3Helper.#geometryReferences.set(geometry, count);
        } else {
            UBox3Helper.#geometryReferences.delete(geometry);
            // 정적 geometry가 외부에서 교체된 경우에는 새 참조를 지우지 않는다.
            if (UBox3Helper.sharedGeometry === geometry) UBox3Helper.sharedGeometry = undefined;
            geometry.dispose();
        }
        UBox3Helper.#releaseMaterial(this.#materialKey, this.#sharedMaterial);
    }
}

export {UBox3Helper};
