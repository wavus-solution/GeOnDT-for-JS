/**
 * 같은 컨트롤러에서 프리셋과 개별 factor를 비교합니다.
 * 배경지도·지형·카메라 초기화는 Common Runtime이 맡고, 이 모듈은 설정만 소유합니다.
 * @param {GeOnDTExampleContext} context Common Runtime 컨텍스트
 */
export async function initialize(context) {
    const app = context.app;
    const control = app.getMapControl();
    if (!control) throw new Error('지도 컨트롤러가 초기화되지 않았습니다.');
    const factor = /** @type {FactorOption} */ (control.getFactor());
    // 앱이 줌 레벨에 맞춰 정한 maxDistance도 보존해야 하므로 런타임 초기값을 기준으로 삼습니다.
    const initialFactor = {...factor};
    const initialCollision = control.getUseCollision();
    const {FIX_ANCHOR, NON_ANCHOR, FIRST_PERSON} = GeOnDT.constant.CONTROL_TYPE;
    const types = [[FIX_ANCHOR, '앵커 기준'], [NON_ANCHOR, '앵커 없이'], [FIRST_PERSON, '1인칭']];

    // 표시·입력 범위와 실제 factor 키를 한곳에서 관리해 UI와 적용 코드가 어긋나지 않게 합니다.
    // 기존 양수 factor는 엔진의 `값 || 기본값` 처리 때문에 0을 넣으면 기본값으로 돌아갑니다.
    const fields = [
        {key: 'panInertiaEnabled', group: 'inertia', label: '팬 관성 사용', kind: 'boolean', help: '끄면 팬 이동을 놓는 즉시 멈춥니다. 회전 관성과 별도로 설정합니다.'},
        {key: 'panInertiaFactor', group: 'inertia', label: '관성 세기', min: 0, help: '놓을 때 속도의 배율입니다. 0이면 관성을 끕니다.'},
        {key: 'panAnchorInertiaFactor', group: 'inertia', label: '앵커 팬 관성 배율', min: 0, max: 1, help: '앵커 팬의 관성 시작 속도를 추가로 줄입니다. 기본 0.5, 0은 끄기, 1은 기존 세기입니다. 일반 팬 대체·1인칭에는 적용하지 않습니다.'},
        {key: 'panInertiaDamping', group: 'inertia', label: '감속 계수 (1/s)', min: 0.1, help: '클수록 빠르게 멈춥니다. 4는 길게, 12는 짧게 감속합니다.'},
        {key: 'panInertiaMinSpeed', group: 'inertia', label: '최소 속도 (CSS px/s)', min: 0.1, help: '이 속도 이하는 관성을 시작하지 않거나 멈춥니다.'},
        {key: 'panInertiaMaxSpeed', group: 'inertia', label: '시작 속도 상한 (CSS px/s)', min: 0.1, help: '빠른 드래그로 너무 멀리 움직이지 않게 제한합니다.'},
        {key: 'panInertiaSampleTime', group: 'inertia', label: '속도 평활·유효 시간 (ms)', min: 1, help: '이 시간 이상 멈췄다가 놓으면 관성이 생기지 않습니다.'},
        {key: 'rotateInertiaEnabled', group: 'rotationInertia', label: '회전 관성 사용', kind: 'boolean', help: '오른쪽 드래그 또는 Ctrl+왼쪽 드래그를 놓은 뒤 회전을 서서히 멈춥니다.'},
        {key: 'rotateInertiaFactor', group: 'rotationInertia', label: '회전 관성 세기', min: 0, help: '놓을 때의 회전 입력 속도 배율입니다. 0이면 회전 관성을 끕니다.'},
        {key: 'rotateInertiaDamping', group: 'rotationInertia', label: '회전 감속 계수 (1/s)', min: 0.1, help: '클수록 빠르게 멈춥니다. 지도 기본 8, 실내 13, 1인칭 14입니다.'},
        {key: 'rotateInertiaMinSpeed', group: 'rotationInertia', label: '회전 최소 속도 (CSS px/s)', min: 0.1, help: '각속도가 아닌 마우스 입력 속도입니다. 이 속도 이하는 멈춥니다.'},
        {key: 'rotateInertiaMaxSpeed', group: 'rotationInertia', label: '회전 시작 속도 상한 (CSS px/s)', min: 0.1, help: '빠르게 돌렸을 때의 잔여 회전을 제한합니다.'},
        {key: 'rotateInertiaSampleTime', group: 'rotationInertia', label: '회전 평활·유효 시간 (ms)', min: 1, help: '이 시간 이상 멈췄다가 놓으면 회전 관성이 생기지 않습니다.'},
        {key: 'panSpeed', group: 'motion', label: '팬 이동 감도', min: 0.001, help: '앵커 없는 이동과 앵커 이동의 대체 경로에 적용됩니다.'},
        {key: 'keyPanSpeed', group: 'motion', label: '방향키 이동 감도', min: 0.001, help: '방향키 입력에 따른 이동량을 조절합니다.'},
        {key: 'rotateSpeed', group: 'motion', label: '회전 감도', min: 0.001, help: '일반·앵커 회전의 감도를 조절합니다.'},
        {key: 'interMoveSpeed', group: 'motion', label: '1인칭 이동 속도', min: 0.001, help: '1인칭 방식의 마우스 팬 이동에 적용됩니다.'},
        {key: 'interRotationSpeed', group: 'motion', label: '1인칭 회전 속도', min: 0.001, help: '1인칭 방식의 회전에 적용됩니다.'},
        {key: 'autoRotateSpeed', group: 'motion', label: '자동 회전 속도', min: 0.001, help: '자동 회전 사용 시의 속도입니다. 이 예제는 수동 비교를 위해 자동 회전을 시작하지 않습니다.'},
        {key: 'zoomSpeed', group: 'zoom', label: '줌 감도', min: 0.001, help: '일반·앵커 줌 이동의 감도를 조절합니다.'},
        {key: 'interZoomSpeed', group: 'zoom', label: '1인칭 줌 이동 속도', min: 0.001, help: '1인칭 방식에서 휠로 전후 이동하는 속도입니다.'},
        {key: 'zoomInMinScale', group: 'zoom', label: '줌 인 최소 이동량', min: 0.001, help: '지면 가까이에서 줌 인 이동량의 하한입니다.'},
        {key: 'zoomOutMinScale', group: 'zoom', label: '줌 아웃 최소 이동량', min: 0.001, help: '지면 가까이에서 줌 아웃 이동량의 하한입니다.'},
        {key: 'minDistance', group: 'zoom', label: '최소 줌 거리', min: -1, help: '-1은 기본 제한값입니다. 0은 엔진에서 기본값으로 대체되므로 사용하지 않습니다.'},
        {key: 'maxDistance', group: 'zoom', label: '최대 줌 거리', min: 0.001, help: '앱의 초기 줌 레벨에 맞춰 설정된 값에서 시작합니다.'},
        {key: 'panMoveAmountLimit', group: 'anchor', label: '앵커 팬 이동량 제한', min: 0.001, help: '제한을 넘는 앵커 이동은 일반 팬으로 전환됩니다.'},
        {key: 'panAnchorRange', group: 'anchor', label: '팬 앵커 범위 배율', min: 0.001, help: '지면 기준 카메라 높이에 곱하는 앵커 탐색 범위입니다.'},
        {key: 'panAnchorMinDistance', group: 'anchor', label: '팬 앵커 최소 거리', min: 0.001, help: '카메라 높이에 따라 달라지는 탐색 범위의 하한입니다.'},
        {key: 'panAnchorMaxDistance', group: 'anchor', label: '팬 앵커 최대 거리', min: 0.001, help: '카메라 높이에 따라 달라지는 탐색 범위의 상한입니다.'},
        {key: 'rotateAnchorRange', group: 'anchor', label: '회전 앵커 범위 배율', min: 0.001, help: '이 범위를 벗어난 회전 앵커는 화면 중심점으로 바뀝니다.'},
        {key: 'rotateAnchorMinDistance', group: 'anchor', label: '회전 앵커 최소 거리', min: 0.001, help: '카메라 높이에 따라 달라지는 회전 앵커 범위의 하한입니다.'},
        {key: 'rotateAnchorMinPolarAngle', group: 'anchor', label: '앵커 회전 최소 각도 (°)', min: 0.001, max: 89, degrees: true, help: '0°는 수직 아래, 90°는 수평입니다. 적용할 때 라디안으로 변환합니다.'},
        {key: 'nearExceptionRange', group: 'anchor', label: '줌 앵커 검색 제외 반경', min: 0.001, help: '카메라에 너무 가까운 객체를 줌 앵커 검색에서 제외합니다.'},
        {key: 'moveType', group: 'mode', label: '팬 이동 방식', options: types, help: '앵커 이동이 성립하지 않으면 일반 팬 경로를 사용합니다.'},
        {key: 'rotationType', group: 'mode', label: '회전 방식', options: types, help: '팬·회전·줌 방식을 각각 선택할 수 있습니다.'},
        {key: 'zoomType', group: 'mode', label: '줌 방식', options: types, help: '1인칭 방식은 카메라의 전후 이동을 사용합니다.'},
        {key: 'firstPersonModeKey', group: 'mode', label: '임시 1인칭 전환 키 코드', min: 1, max: 255, integer: true, help: '16은 Shift입니다. 누르는 동안 1인칭으로 전환합니다. 방향키 코드는 사용할 수 없습니다.'},
        {key: 'collisionFactor', group: 'mode', label: '지면 충돌 여유 높이', min: 0.001, help: '충돌 판정 시 지면 고도에 더하는 카메라 여유 높이입니다.'},
        {key: 'collisionOffset', group: 'mode', label: '지면 고도 오프셋', help: '충돌에 사용하는 지면 고도를 보정합니다. 음수도 허용합니다.'}
    ];

    // @example-code:start control.presets
    // 모든 프리셋을 같은 초기 스냅샷에서 만들어 직전에 선택한 프리셋의 감도가 섞이지 않게 합니다.
    const mapFactors = {...initialFactor, moveType: FIX_ANCHOR, rotationType: FIX_ANCHOR, zoomType: FIX_ANCHOR};
    const presets = {
        map: {label: '지도 탐색', description: '낮은 관성 시작 속도와 완만한 감속으로 무게감 있게 지도를 탐색합니다.', factors: {...mapFactors}},
        indoor: {
            label: '실내 정밀 이동', description: '작은 앵커 범위와 낮은 감도, 짧은 관성으로 세밀하게 이동합니다.',
            factors: {...mapFactors, rotateSpeed: 0.5, rotateAnchorRange: 0.2, rotateAnchorMinDistance: 0.1,
                zoomSpeed: 0.1, keyPanSpeed: 2, panSpeed: 0.07, panAnchorMinDistance: 12,
                panAnchorMaxDistance: 12, panMoveAmountLimit: 0.5, interZoomSpeed: 2,
                panInertiaFactor: 0.25, panInertiaDamping: 10, panInertiaMaxSpeed: 400,
                rotateInertiaFactor: 0.25, rotateInertiaDamping: 13, rotateInertiaMaxSpeed: 400}
        },
        firstPerson: {
            label: '1인칭 탐색', description: '이동·회전·줌을 1인칭 방식으로 바꾸고 잔여 이동을 짧게 줄입니다.',
            factors: {...mapFactors, moveType: FIRST_PERSON, rotationType: FIRST_PERSON, zoomType: FIRST_PERSON,
                interMoveSpeed: 6, interRotationSpeed: 1, interZoomSpeed: 2, keyPanSpeed: 2,
                panInertiaFactor: 0.18, panInertiaDamping: 12, panInertiaMaxSpeed: 300,
                rotateInertiaFactor: 0.16, rotateInertiaDamping: 14, rotateInertiaMaxSpeed: 300}
        }
    };
    // @example-code:end control.presets
    const state = {preset: 'map', customized: false};

    /** 진행 중인 관성을 끊고 전체 설정을 적용합니다. getFactor()의 공유 객체는 교체하지 않습니다. */
    function applyFactors(next) {
        // @example-code:start control.apply
        control.setControlType(next.moveType);
        Object.assign(factor, next);
        // @example-code:end control.apply
    }

    /** 프리셋은 카메라 위치나 레이어를 바꾸지 않아 같은 장면에서 감도를 비교할 수 있습니다. */
    function applyPreset(name) {
        if (!Object.hasOwn(presets, name)) throw new Error('알 수 없는 프리셋입니다.');
        applyFactors(presets[name].factors);
        control.setUseCollision(initialCollision);
        state.preset = name;
        state.customized = false;
    }

    /** 유효 범위와 연관된 최소·최대값을 적용 전에 검사해 실패 시 기존 설정을 보존합니다. */
    function setFactor(key, value) {
        const field = fields.find(item => item.key === key);
        if (!field) throw new Error('알 수 없는 factor입니다.');
        if (field.kind === 'boolean') {
            if (typeof value !== 'boolean') throw new Error('켜기 또는 끄기를 선택하세요.');
        } else {
            const displayValue = field.degrees ? value * 180 / Math.PI : value;
            if (typeof value !== 'number' || !Number.isFinite(value)
                || (field.min !== undefined && displayValue < field.min)
                || (field.max !== undefined && displayValue > field.max)
                || (field.integer && !Number.isInteger(value))
                || (field.options && !field.options.some(option => option[0] === value))) {
                throw new Error(`${field.label}: 허용 범위의 숫자를 입력하세요.`);
            }
            if (key === 'minDistance' && value === 0) throw new Error('최소 줌 거리는 -1 또는 0이 아닌 값을 사용하세요.');
            if (key === 'firstPersonModeKey' && value >= 37 && value <= 40) throw new Error('방향키 코드(37~40)는 이동에 사용됩니다.');
        }
        const next = {...factor, [key]: value};
        if (next.minDistance > next.maxDistance) throw new Error('최소 줌 거리가 최대 줌 거리보다 큽니다.');
        if (next.panAnchorMinDistance > next.panAnchorMaxDistance) throw new Error('팬 앵커 최소 거리가 최대 거리보다 큽니다. 먼저 반대쪽 경계를 넓혀 주세요.');
        // 관성 최대 속도가 최소 속도 이하인 경우는 엔진에서 관성을 끄는 유효한 설정입니다.
        applyFactors(next);
        state.customized = true;
    }

    /** 현재 엔진 값을 복사 가능한 코드로 제공합니다. 각도는 실제 라디안 값입니다. */
    function getCode(group) {
        const current = /** @type {FactorOption} */ (control.getFactor());
        const values = Object.fromEntries(fields.filter(field => !group || field.group === group)
            .map(field => [field.key, current[field.key]]));
        // PAN만 같은 값으로 지정해 관성을 취소합니다. 일부 그룹의 코드로 다른 입력 방식까지 바꾸지 않습니다.
        return `const control = app.getMapControl();\ncontrol.setControlType(${current.moveType}, GeOnDT.constant.CONTROL_CASE.PAN);\nObject.assign(control.getFactor(), ${JSON.stringify(values, null, 4)});`
            + (group ? '' : `\ncontrol.setUseCollision(${control.getUseCollision()});`);
    }

    applyPreset('map');
    return {
        fields, presets, state, applyPreset, setFactor, getCode,
        getFactors: () => ({.../** @type {FactorOption} */ (control.getFactor())}),
        getCollision: () => control.getUseCollision(),
        setCollision(value) { control.setUseCollision(value); state.customized = true; },
        restore() { applyFactors(initialFactor); control.setUseCollision(initialCollision); }
    };
}

/**
 * Common Runtime이 소유한 컨트롤러는 폐기하지 않고, 이 예제가 바꾼 설정만 되돌립니다.
 * @param {GeOnDTExampleContext} context Common Runtime 컨텍스트
 * @param {object} example initialize 반환값
 */
export async function dispose(context, example) {
    example?.restore();
}
