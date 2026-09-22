/**
 * 그룹 경계 형상 예제에서 설명할 API Help Registry입니다.
 */
export const apiHelp = Object.freeze({
    'group.toggle-animation': {
        title: 'setInterval',
        description: '경계를 다시 계산하는 애니메이션 타이머를 재생/일시정지합니다.',
        mode: 'hybrid',
        source: {
            sourceId: 'main',
            token: 'group.play-control'
        },
        getCode(context, example) {
            const running = example && typeof example.isAnimationRunning === 'function'
                ? example.isAnimationRunning()
                : false;
            const code = running ? 'setAnimationRunning(false);' : 'setAnimationRunning(true);';
            return `// animation interval 제어\n${code}`;
        }
    },
    'group.speed': {
        title: '타이머 간격 재조정',
        description: '속도 배율에 따라 이동 업데이트 간격을 다시 계산해 갱신 주기를 제어합니다.',
        mode: 'hybrid',
        source: {
            sourceId: 'main',
            token: 'group.speed-control'
        },
        getCode(context, example) {
            const speed = example && Number(example.getState()?.animationSpeedMultiplier) || 1;
            return `setAnimationSpeed(${formatNumber(speed)});`;
        }
    },
    'group.reset': {
        title: '요약 상태 초기화',
        description: '현재 스텝을 초기화하고 시작 위치로 이동시켜 경계 경로를 되돌립니다.',
        mode: 'hybrid',
        source: {
            sourceId: 'main',
            token: 'group.reset-control'
        },
        getCode() {
            return 'resetDroneFormation();';
        }
    },
    'group.render-update': {
        title: 'UGroupBoundaryHelper.update()',
        description: '매 렌더 직전에 헬퍼를 갱신해 경계 메시지를 실시간으로 맞춥니다.',
        mode: 'source',
        source: {
            sourceId: 'main',
            token: 'group.render-update'
        }
    }
});

/**
 * 숫자 포맷을 안정적으로 문자열로 반환합니다.
 * @param {unknown} value 원본 값
 * @returns {string} 소수 둘째 자리 문자열
 */
function formatNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(2) : '1.00';
}
