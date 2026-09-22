//@ts-check
import {UGroup} from '@union3d/core/UGroup';
import {UBox3Helper} from '@union3d/helpers/UBox3Helper';
import {Box3} from 'three';
import {INTERNAL} from '@union3d/helpers/UBox3HelperGroup.internal';

/**
 * ~extends import('@UGroup').UGroup <br>
 * Box3 입력을 순서대로 표시하고 다음 입력 묶음에서 기존 helper를 재사용하는 그룹이다.
 * add()로 이번 묶음을 채운 뒤 commit()으로 남는 helper를 제거하고 다음 입력 위치를 지정한다.
 * UBox3Helper 자체를 add()에 넘기면 재사용 위치를 진행하지 않고 자식으로만 등록한다.
 *
 * @group helpers
 */
class UBox3HelperGroup extends UGroup {
    /**
     * 다음 Box3 입력이 재사용할 자식 위치다. 직접 helper를 추가할 때는 증가하지 않는다.
     *
     * @type {number}
     *
     * @ignore
     */
    #cursor = 0;

    /**
     * 상위 그룹 옵션을 그대로 전달한다.
     *
     * @param {UBox3HelperGroupCO} [option={}] 그룹 이름·drawarg 등을 포함한 상위 그룹 옵션.
     */
    constructor(option = {}) {
        super(option);
    }

    /**
     * 경계 상자를 추가하거나 현재 재사용 위치의 helper를 갱신한다.
     * box3 또는 color가 falsy이면 아무것도 하지 않는다. 따라서 숫자 색상 0도 거부한다.
     * helper 입력은 전달한 color로 다시 칠하지 않으며, 지원하지 않는 입력은 무시한다.
     * Box3 경로에서는 재사용 위치를 먼저 증가시키므로 이후 작업이 실패해도 되돌리지 않는다.
     *
     * @override
     *
     * @param {unknown} box3 표시할 Box3 또는 직접 등록할 UBox3Helper.
     * @param {import('three').Color | string | number} [color=0xffff00] Box3 입력의 선 색상.
     * @returns {this} 체이닝할 현재 그룹. 하위 클래스의 반환 타입도 보존한다.
     */
    add(box3, color = 0xffff00) {
        if (!box3 || !color) return this;

        if (box3 instanceof UBox3Helper) {
            super.add(box3);
            return this;
        } else if (box3 instanceof Box3) {
            const helper = /**
             * @type {UBox3Helper | undefined}
             *
             * @ignore
             */ (this.children[this.#cursor++]);
            // 기존 자식은 경계·색상을 갱신하고, 빈 위치에는 아직 등록하지 않은 helper를 준비한다.
            const preparedHelper = INTERNAL.prepareHelper(helper, box3, color);
            if (!helper) {
                super.add(preparedHelper);
            }
            return this;
        }
        return this;
    }

    /**
     * 이번 묶음에서 사용하지 않은 뒤쪽 helper를 해제·제거하고 다음 입력 위치를 저장한다.
     * 제거 범위는 인수 cursor가 아니라 호출 직전의 내부 위치로 결정한다.
     * cursor의 정수·범위 검증은 하지 않으며, 중간 해제·제거에서 오류가 나면
     * 나머지 처리를 중단하고 새 cursor도 저장하지 않는다.
     *
     * @param {number} [cursor=0] 다음 Box3 입력에서 사용할 자식 위치.
     */
    commit(cursor = 0) {
        if (this.children.length > this.#cursor) {
            for (let i = this.children.length - 1; i >= this.#cursor; i--) {
                const helper = /**
                 * @type {UBox3Helper | undefined}
                 *
                 * @ignore
                 */ (this.children[i]);
                helper?.dispose();
                this.remove(this.children[i]);
            }
        }
        this.#cursor = cursor;
    }
}

export {UBox3HelperGroup};
