//@ts-check

/**
 * 공식 예제의 초기 미리보기 속도를 약 1프레임/초로 정합니다. <br>
 * 검증된 프레임의 양수 시간 간격을 모아 중앙값을 구하고 단일 시각이면 1을 사용합니다. <br>
 * 원본 프레임·시각·단위와 범용 세션의 기본 정책은 변경하지 않으며 예제의 새 세션 연결 때만 적용합니다.
 *
 * @param {ReadonlyArray<{ time: number; }>} frames 원본 시각 목록, 유한한 원본 시각이 오름차순으로 정렬된 목록, 같은 시각·빈 목록 허용, 시간 단위 추정 없음
 * @returns {number} 실제 초당 진행할 원본 시간량
 */
export function readA3FPreviewUnitsPerSecond(frames) {
    if (!Array.isArray(frames)) throw new TypeError('미리보기 프레임 목록이 필요합니다.');
    const intervals = [];
    let previous = null;
    for (const frame of frames) {
        if (!frame || !Number.isFinite(frame.time)) throw new TypeError('프레임 시각은 유한한 수여야 합니다.');
        if (previous !== null) {
            const interval = frame.time - previous;
            if (!Number.isFinite(interval) || interval < 0) throw new RangeError('프레임 시각은 유한한 간격의 오름차순이어야 합니다.');
            if (interval > 0) intervals.push(interval);
        }
        previous = frame.time;
    }
    if (!intervals.length) return 1;
    intervals.sort(
        // 원본 시각 대신 독립 간격 배열만 오름차순으로 정렬합니다.
        function ascending(left, right) { return left - right; });
    const middle = Math.floor(intervals.length / 2);
    if (intervals.length % 2) return intervals[middle];
    return intervals[middle - 1] + (intervals[middle] - intervals[middle - 1]) / 2;
}
