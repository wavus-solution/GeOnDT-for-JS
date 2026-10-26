//@ts-check
import {UError} from '@union3d/error/UError';

/**
 * ~extends import('@union3d/error/UError').UError <br>
 *
 * 해제나 취소로 작업을 계속할 수 없음을 알리는 오류입니다.
 * 기존 취소 처리와 연결되도록 name은 AbortError를 사용합니다.
 *
 * @group error
 * @extends {UError}
 */
class UAbortError extends UError {
    /**
     * 취소 메시지와 선택적인 원인을 보관합니다.
     *
     * @param {string} [message='작업이 취소되었습니다.'] 취소 사유를 설명할 메시지
     * @param {unknown} [cause] 취소의 원래 오류 또는 원인 값
     */
    constructor(message = '작업이 취소되었습니다.', cause = undefined) {
        super(message, cause);
        this.name = 'AbortError';
    }
}

export {UAbortError};
