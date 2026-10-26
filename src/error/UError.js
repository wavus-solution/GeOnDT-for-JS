//@ts-check

/**
 * ~extends Error <br>
 *
 * 메시지와 원인 값을 함께 보관하는 기본 오류입니다.
 * 원인은 두 번째 인수로 직접 전달하며, Error의 cause에 그대로 보관합니다.
 *
 * @group error
 * @extends {Error}
 */
class UError extends Error {
    /**
     * 메시지와 선택적인 원인으로 오류를 생성합니다.
     * cause를 생략하거나 undefined로 전달하면 원인 속성을 추가하지 않습니다.
     *
     * @param {string} [message=''] 오류를 설명할 메시지
     * @param {unknown} [cause] 원래 오류 또는 실패 값. 변환하거나 복제하지 않습니다
     */
    constructor(message = '', cause = undefined) {
        super(message);
        this.name = 'UError';
        // 프로젝트의 ES2020 타입 환경에서도 사용할 수 있도록 원인을 직접 보관합니다.
        // 표준 Error.cause처럼 열거에서는 제외하되 읽기·변경·삭제는 허용합니다.
        if (cause !== undefined) {
            /** @type {unknown} */
            this.cause = cause;
            Object.defineProperty(this, 'cause', {enumerable: false});
        }
    }
}

export {UError};
