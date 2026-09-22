/**
 * 주행 애니메이션 예제에서 설명할 API Help Registry입니다.
 */
export const apiHelp = Object.freeze({
    'frustum.camera-info': {
        title: 'UFrustum.setCameraInfo()',
        description: '카메라의 FOV, aspect, near/far를 갱신해 Frustum의 투영 영역을 설정합니다.',
        mode: 'hybrid',
        source: {
            sourceId: 'main',
            token: 'frustum.camera-info'
        },
        getCode(context) {
            return createCameraInfoApiCode(getCurrentFrustumSettings(context));
        }
    },
    'frustum.rotation': {
        title: 'UFrustum.setPitchYawRoll()',
        description: '드론 기준 카메라 자세를 pitch, yaw, roll 순서로 일괄 적용합니다.',
        mode: 'hybrid',
        source: {
            sourceId: 'main',
            token: 'frustum.rotation'
        },
        getCode(context) {
            const settings = getCurrentFrustumSettings(context);
            return `frustum.setPitchYawRoll(${formatApiNumber(settings.pitch)}, ${formatApiNumber(settings.yaw)}, ${formatApiNumber(settings.roll)});`;
        }
    },
    'frustum.helper-style': {
        title: 'Frustum Helper 공통 스타일 API',
        description: '현재 선택한 UFrustumHelper 또는 UFrustumTerrainProjectionHelper의 외곽선 색상, 두께, 투명도를 조절합니다.',
        mode: 'hybrid',
        source: {
            sourceId: 'main',
            token: 'frustum.helper-style'
        },
        getCode(context) {
            const settings = getCurrentFrustumSettings(context);
            return `helper.setColor('${String(settings.lineColor).toUpperCase()}');\nhelper.setLineWidth(${formatApiNumber(settings.lineWidth)});\nhelper.setOpacity(${formatApiNumber(settings.lineOpacity)});`;
        }
    },
    'frustum.helper-fill': {
        title: 'Frustum Helper 공통 채움 API',
        description: '현재 Helper의 끝면 또는 지면 영역과 옆면 채움색·투명도를 설정합니다.',
        mode: 'hybrid',
        source: {
            sourceId: 'main',
            token: 'frustum.helper-fill'
        },
        getCode(context) {
            const settings = getCurrentFrustumSettings(context);
            return `helper.setFillColor('${String(settings.fillColor).toUpperCase()}');\nhelper.setFillOpacity(${formatApiNumber(settings.fillOpacity)});\nhelper.setSideColor('${String(settings.sideColor).toUpperCase()}');\nhelper.setSideOpacity(${formatApiNumber(settings.sideOpacity)});`;
        }
    },
    'frustum.helper-quality': {
        title: 'UFrustumTerrainProjectionHelper 정밀도 API',
        description: '지면 경계 보정값을 변경해 정밀도와 연산 비용을 조절합니다.',
        mode: 'hybrid',
        source: {
            sourceId: 'main',
            token: 'frustum.helper-quality'
        },
        getCode(context) {
            const settings = getCurrentFrustumSettings(context);
            return [
                `helper.setUpdateIntervalMs(${formatApiNumber(settings.updateIntervalMs)});`,
                `helper.setIntersectionSteps(${formatApiNumber(settings.intersectionSteps)});`,
                `helper.setTerrainStampGridSize(${formatApiNumber(settings.terrainStampGridSize)});`,
                `helper.setTerrainBoundaryRefinementSteps(${formatApiNumber(settings.terrainBoundaryRefinementSteps)});`,
                `helper.setTerrainIntersectionMedianWindow(${formatApiNumber(settings.terrainIntersectionMedianWindow)});`,
                `helper.setTerrainIntersectionHalfLifeMs(${formatApiNumber(settings.terrainIntersectionHalfLifeMs)});`
            ].join('\n');
        }
    },
    'frustum.path-style': {
        title: 'U3dAnimationComponent.setCumulativePathStyle()',
        description: '누적 경로의 색상, 투명도와 폭을 현재 선택한 드론에 즉시 적용합니다.',
        mode: 'dynamic',
        getCode(context) {
            return createCumulativePathStyleApiCode(getCurrentCumulativePathSettings(context));
        }
    },
    'frustum.path-fade': {
        title: 'U3dAnimationComponent.setCumulativePathStyle() Fade 정책',
        description: '오래된 누적 경로의 표시 거리와 폭·투명도 Fade 비율을 설정합니다.',
        mode: 'dynamic',
        getCode(context) {
            return createCumulativePathFadeApiCode(getCurrentCumulativePathSettings(context));
        }
    },
    'frustum.helper-create': {
        title: 'U3dAPP.setFrustumTerrainProjectionHelper()',
        description: 'Frustum와 함께 지면 투영 헬퍼를 생성해 실제 지형과 경계를 계산해 표시합니다.',
        mode: 'hybrid',
        source: {
            sourceId: 'main',
            token: 'frustum.helper-create'
        },
        getCode() {
            return `const helper = app.setFrustumTerrainProjectionHelper(frustum, {\n    terrain: true,\n    color: '#00FFFF',\n    lineWidth: 3,\n    opacity: 0.9,\n    fill: {\n        enabled: true,\n        color: '#FF55EA',\n        opacity: 0.28,\n        sideColor: '#006DFF',\n        sideOpacity: 0.12\n    }\n});`;
        }
    },
    'frustum.standard-helper-create': {
        title: 'U3dAPP.setFrustumHelper()',
        description: 'terrain 모드로 Far 면을 지형에 맞추는 UFrustumHelper를 생성합니다.',
        mode: 'hybrid',
        source: {
            sourceId: 'main',
            token: 'frustum.standard-helper-create'
        },
        getCode() {
            return `const helper = app.setFrustumHelper(frustum, {\n    terrain: true,\n    color: '#00FFFF',\n    lineWidth: 3,\n    opacity: 0.9,\n    fill: {\n        enabled: true,\n        color: '#FF55EA',\n        opacity: 0.28,\n        sideColor: '#006DFF',\n        sideOpacity: 0.12\n    }\n});`;
        }
    },
});

/**
 * 현재 카메라 투영값을 사용하는 API 예시를 생성합니다.
 *
 * @param {Record<string, string | number>} settings 현재 설정값
 * @returns {string} API 예시 코드
 */
function createCameraInfoApiCode(settings) {
    return [
        'frustum.setCameraInfo({',
        '    fov: ' + formatApiNumber(settings.fov) + ',',
        '    aspect: ' + formatApiNumber(settings.aspect) + ',',
        '    near: ' + formatApiNumber(settings.near) + ',',
        '    far: ' + formatApiNumber(settings.far),
        '});',
        'frustum.updateTarget();'
    ].join('\n');
}

/**
 * API Help 오버레이에서 현재 패널의 Frustum 설정값을 읽습니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Record<string, string | number>} 현재 설정값
 */
function getCurrentFrustumSettings(context) {
    const root = getApiHelpRoot(context);
    return {
        fov: getNumberControlValue(root, '#frustum-fov', 50),
        aspect: getNumberControlValue(root, '#frustum-aspect', 1.4),
        near: getNumberControlValue(root, '#frustum-near', 0.1),
        far: getNumberControlValue(root, '#frustum-far', 18000),
        pitch: getNumberControlValue(root, '#frustum-pitch', 0),
        yaw: getNumberControlValue(root, '#frustum-yaw', 0),
        roll: getNumberControlValue(root, '#frustum-roll', 0),
        lineColor: getColorControlValue(root, '#helper-line-color', '#00FFFF'),
        lineWidth: getNumberControlValue(root, '#helper-line-width', 3),
        lineOpacity: getNumberControlValue(root, '#helper-line-opacity', 0.9),
        fillColor: getColorControlValue(root, '#helper-fill-color', '#FF55EA'),
        fillOpacity: getNumberControlValue(root, '#helper-fill-opacity', 0.28),
        sideColor: getColorControlValue(root, '#helper-side-color', '#006DFF'),
        sideOpacity: getNumberControlValue(root, '#helper-side-opacity', 0.12),
        updateIntervalMs: getNumberControlValue(root, '#helper-update-interval', 20),
        intersectionSteps: getNumberControlValue(root, '#helper-intersection-steps', 24),
        terrainStampGridSize: getNumberControlValue(root, '#helper-terrain-grid-size', 9),
        terrainBoundaryRefinementSteps: getNumberControlValue(root, '#helper-boundary-refinement-steps', 9),
        terrainIntersectionMedianWindow: getNumberControlValue(root, '#helper-terrain-intersection-median-window', 15),
        terrainIntersectionHalfLifeMs: getNumberControlValue(root, '#helper-terrain-intersection-half-life', 10)
    };
}

/**
 * 공통 런타임 컨텍스트에서 예제 DOM 루트를 안전하게 가져옵니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {ParentNode | undefined} 예제 DOM 루트
 */
function getApiHelpRoot(context) {
    if (!context || typeof context !== 'object') return undefined;

    const elements = /** @type {{elements?: {root?: ParentNode}}} */ (context).elements;
    return elements?.root;
}

/**
 * 숫자 입력 요소의 현재 값을 읽고, 유효하지 않으면 기본값을 사용합니다.
 *
 * @param {ParentNode | undefined} root 예제 DOM 루트
 * @param {string} selector 입력 요소 선택자
 * @param {number} defaultValue 기본값
 * @returns {number} 현재 숫자 값
 */
function getNumberControlValue(root, selector, defaultValue) {
    const control = /** @type {HTMLInputElement | null | undefined} */ (root?.querySelector(selector));
    const value = Number(control?.value);
    return Number.isFinite(value) ? value : defaultValue;
}

/**
 * 색상 입력 요소의 현재 값을 읽고, 유효하지 않으면 기본값을 사용합니다.
 *
 * @param {ParentNode | undefined} root 예제 DOM 루트
 * @param {string} selector 입력 요소 선택자
 * @param {string} defaultValue 기본값
 * @returns {string} 현재 색상 값
 */
function getColorControlValue(root, selector, defaultValue) {
    const control = /** @type {HTMLInputElement | null | undefined} */ (root?.querySelector(selector));
    return /^#[0-9a-f]{6}$/i.test(String(control?.value || '')) ? control.value : defaultValue;
}

/**
 * API Help 오버레이에서 현재 패널의 누적 경로 설정값을 읽습니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Record<string, string | number | boolean>} 현재 누적 경로 설정값
 */
function getCurrentCumulativePathSettings(context) {
    const root = getApiHelpRoot(context);
    return {
        color: getColorControlValue(root, '#path-color', '#00FFFF'),
        opacity: getNumberControlValue(root, '#path-opacity', 0.8),
        width: getNumberControlValue(root, '#path-width', 5),
        fadeEnabled: getBooleanControlValue(root, '#path-fade-enabled', true),
        maxDistance: getNumberControlValue(root, '#path-max-distance', 3000),
        widthFade: getNumberControlValue(root, '#path-width-fade', 0.5),
        alphaFade: getNumberControlValue(root, '#path-alpha-fade', 0.4)
    };
}

/**
 * 체크박스 입력 요소의 현재 값을 읽고, 값을 읽을 수 없으면 기본값을 사용합니다.
 *
 * @param {ParentNode | undefined} root 예제 DOM 루트
 * @param {string} selector 입력 요소 선택자
 * @param {boolean} defaultValue 기본값
 * @returns {boolean} 현재 체크 상태
 */
function getBooleanControlValue(root, selector, defaultValue) {
    const control = /** @type {HTMLInputElement | null | undefined} */ (root?.querySelector(selector));
    return typeof control?.checked === 'boolean' ? control.checked : defaultValue;
}

/**
 * 현재 누적 경로 표현값을 사용하는 API 예시를 생성합니다.
 *
 * @param {Record<string, string | number | boolean>} settings 현재 누적 경로 설정값
 * @returns {string} API 예시 코드
 */
function createCumulativePathStyleApiCode(settings) {
    return [
        'component.setCumulativePathStyle({',
        '    color: ' + JSON.stringify(String(settings.color).toUpperCase()) + ',',
        '    opacity: ' + formatApiNumber(settings.opacity) + ',',
        '    width: ' + formatApiNumber(settings.width),
        '});'
    ].join('\n');
}

/**
 * 현재 누적 경로 Fade 정책을 사용하는 API 예시를 생성합니다.
 *
 * @param {Record<string, string | number | boolean>} settings 현재 누적 경로 설정값
 * @returns {string} API 예시 코드
 */
function createCumulativePathFadeApiCode(settings) {
    return [
        'component.setCumulativePathStyle({',
        '    tailPolicy: {',
        '        enabled: ' + String(settings.fadeEnabled) + ',',
        '        maxDistance: ' + formatApiNumber(settings.maxDistance) + ',',
        '        widthFade: ' + formatApiNumber(settings.widthFade) + ',',
        '        alphaFade: ' + formatApiNumber(settings.alphaFade),
        '    }',
        '});'
    ].join('\n');
}

/**
 * API 코드에 표시할 숫자를 안정적으로 문자열로 변환합니다.
 * @param {unknown} value 원본 값
 * @returns {string} 숫자 문자열
 */
function formatApiNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? String(number) : '0';
}
