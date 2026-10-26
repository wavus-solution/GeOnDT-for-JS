// @ts-check

/**
 * 외부에서 성공 또는 실패를 전달할 수 있는 표준 Promise를 생성합니다.
 *
 * 반환한 Promise의 `resolve(value)`와 `reject(reason)`는 최초 호출만 반영합니다.
 * `isReady()`는 이 요청이 접수되는 즉시 true가 됩니다. 전달한 Promise의 완료 여부나
 * 후속 콜백의 종료 여부를 나타내지 않으므로 결과는 `await` 또는 `then`으로 받으십시오.
 * `then`, `catch`, `finally`의 콜백 실행·반환값·실패 전파는 표준 Promise를 따릅니다.
 * 일반 객체를 thenable로 바꾸는 인수와 재설정 기능은 제공하지 않습니다.
 *
 * @group util
 *
 * @template [T=void]
 * @returns {DeferredPromise<T>} 완료 제어 메서드가 연결된 새 Promise
 *
 * @example
 * const task = deferredPromise();
 * task.then(() => console.log('준비 완료'));
 * task.resolve();
 * console.log(task.isReady()); // true이며, 등록한 콜백은 현재 동기 코드 이후에 실행됩니다.
 */
export function deferredPromise() {
    let ready = false;
    /** @type {function(T | PromiseLike<T>): void} */
    let resolvePromise;
    /** @type {function(unknown=): void} */
    let rejectPromise;

    /** @type {Promise<T>} */
    const promise = new Promise((resolve, reject) => {
        // executor는 동기 실행되므로 반환할 제어 메서드가 호출되기 전에 두 함수가 설정됩니다.
        resolvePromise = resolve;
        rejectPromise = reject;
    });

    /**
     * 최초 성공 요청을 네이티브 Promise에 전달합니다.
     *
     * @param {T | PromiseLike<T>} value 성공값 또는 그 값을 제공할 Promise
     */
    function resolve(value) {
        if (ready) return;
        // then getter가 재진입해 reject를 호출하더라도 최초 요청이 유지되어야 합니다.
        // 준비 여부는 요청 접수 상태이며, value가 Promise이면 실제 완료는 더 늦을 수 있습니다.
        ready = true;
        resolvePromise(value);
    }

    /**
     * 최초 실패 요청을 네이티브 Promise에 전달합니다.
     *
     * @param {unknown} [reason] 변환하지 않고 전달할 실패 사유
     */
    function reject(reason) {
        if (ready) return;
        ready = true;
        rejectPromise(reason);
    }

    /**
     * 최초 resolve 또는 reject 호출의 접수 여부를 반환합니다.
     *
     * @returns {boolean} 완료 요청이 접수되었으면 true
     */
    function isReady() {
        return ready;
    }

    // 별도의 then/catch 관찰자를 연결하지 않아 미처리 실패 알림을 숨기지 않습니다.
    return Object.assign(promise, {resolve, reject, isReady});
}
