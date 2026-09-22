/**
 * factor 설명과 입력을 구성합니다. GeOnDT 호출은 main이 제공한 함수에 위임합니다.
 * @param {GeOnDTExampleContext} context Common Runtime 컨텍스트
 * @param {object} example initialize 반환값
 * @returns {function(): void} UI 이벤트 정리 함수
 */
export function initializeUI(context, example) {
    const panel = context.elements.root.querySelector('#MapControllSetting-option-panel');
    if (!panel) throw new Error('화면 컨트롤 설정 패널을 찾을 수 없습니다.');
    const inputs = new Map();
    const status = panel.querySelector('[data-setting-status]');
    const code = panel.querySelector('[data-setting-code]');
    const collision = panel.querySelector('[data-collision]');

    // label과 설명 ID를 입력에 연결해 키보드와 보조기기로도 조작할 수 있게 합니다.
    for (const field of example.fields) {
        const row = document.createElement('div');
        row.className = 'MapControllSetting-field';
        const label = document.createElement('label');
        const id = `MapControllSetting-${field.key}`;
        label.htmlFor = id;
        const title = document.createElement('span');
        title.textContent = field.label;
        const key = document.createElement('code');
        key.textContent = field.key;
        label.append(title, key);
        const input = document.createElement(field.options ? 'select' : 'input');
        input.id = id;
        input.dataset.factor = field.key;
        input.setAttribute('aria-describedby', `${id}-help`);
        if (field.options) {
            for (const [value, text] of field.options) {
                const option = document.createElement('option');
                option.value = String(value);
                option.textContent = text;
                input.append(option);
            }
        } else if (field.kind === 'boolean') {
            input.type = 'checkbox';
        } else {
            input.type = 'number';
            // 기존 소수와 자유 입력을 허용하고, 범위·정수 조건은 main에서 검증합니다.
            input.step = 'any';
            input.required = true;
            if (field.min !== undefined) input.min = String(field.min);
            if (field.max !== undefined) input.max = String(field.max);
        }
        const help = document.createElement('small');
        help.id = `${id}-help`;
        help.textContent = field.help;
        row.append(label, input, help);
        panel.querySelector(`[data-factor-group="${field.group}"]`).append(row);
        inputs.set(field.key, input);
    }

    /** 엔진의 현재값을 읽어 표시합니다. 입력에 실패한 값은 적용 결과에 포함하지 않습니다. */
    function render() {
        const factors = example.getFactors();
        for (const field of example.fields) {
            const input = inputs.get(field.key);
            input.removeAttribute('aria-invalid');
            if (field.kind === 'boolean') input.checked = factors[field.key];
            else input.value = String(field.degrees ? Number((factors[field.key] * 180 / Math.PI).toFixed(8)) : factors[field.key]);
        }
        for (const button of panel.querySelectorAll('[data-preset]')) {
            button.setAttribute('aria-pressed', String(button.dataset.preset === example.state.preset));
        }
        const preset = example.presets[example.state.preset];
        panel.querySelector('[data-preset-description]').textContent = preset.description;
        panel.querySelector('[data-result-preset]').textContent = preset.label + (example.state.customized ? ' · 사용자 조정' : '');
        panel.querySelector('[data-result-inertia]').textContent = !factors.panInertiaEnabled || factors.panInertiaFactor === 0
            || factors.panInertiaMaxSpeed <= factors.panInertiaMinSpeed ? '꺼짐' : '켜짐';
        panel.querySelector('[data-result-strength]').textContent = String(factors.panInertiaFactor);
        panel.querySelector('[data-result-damping]').textContent = String(factors.panInertiaDamping);
        panel.querySelector('[data-result-rotate-inertia]').textContent = !factors.rotateInertiaEnabled || factors.rotateInertiaFactor === 0
            || factors.rotateInertiaMaxSpeed <= factors.rotateInertiaMinSpeed ? '꺼짐' : '켜짐';
        panel.querySelector('[data-result-rotate-strength]').textContent = String(factors.rotateInertiaFactor);
        panel.querySelector('[data-result-rotate-damping]').textContent = String(factors.rotateInertiaDamping);
        panel.querySelector('[data-result-count]').textContent = `${example.fields.length}개`;
        collision.checked = example.getCollision();
        code.textContent = example.getCode();
    }

    /** 입력 도중의 빈 문자열이나 미완성 소수는 엔진에 전달하지 않고 변경 확정 시 한 번만 적용합니다. */
    function onChange(event) {
        const input = event.target;
        const field = example.fields.find(item => item.key === input.dataset.factor);
        if (!field && input !== collision) return;
        try {
            if (input === collision) example.setCollision(input.checked);
            else {
                if (input.value.trim() === '') throw new Error('값을 입력하세요. 이전 설정은 유지됩니다.');
                let value = field.kind === 'boolean' ? input.checked : Number(input.value);
                if (field.degrees) value = value * Math.PI / 180;
                example.setFactor(field.key, value);
            }
            render();
            status.textContent = '설정을 적용했습니다. 지도에서 드래그해 비교하세요.';
        } catch (error) {
            input.setAttribute('aria-invalid', 'true');
            status.textContent = error.message;
        }
    }

    /** 숨겨진 고급 설정까지 갱신하므로 프리셋 전환 순서에 따라 설정이 남지 않습니다. */
    function onClick(event) {
        const button = event.target.closest('button');
        if (!button) return;
        const preset = button.dataset.preset;
        if (preset || button.hasAttribute('data-reset-preset')) {
            example.applyPreset(preset || example.state.preset);
            render();
            status.textContent = '프리셋의 모든 설정을 적용했습니다.';
        }
    }

    // 패널 입력 중 카메라가 움직이지 않게 keydown만 차단합니다.
    // 지도에서 누른 키를 패널 위에서 놓을 수도 있으므로 keyup은 엔진까지 전달해 눌림 상태를 해제합니다.
    function onKey(event) {
        // Esc는 공통 API 도움말이 처리하므로 입력에 포커스가 있어도 바깥으로 전달합니다.
        if (event.key !== 'Escape') event.stopPropagation();
    }
    panel.addEventListener('change', onChange);
    panel.addEventListener('click', onClick);
    panel.addEventListener('keydown', onKey);
    render();
    return function cleanupExampleUI() {
        panel.removeEventListener('change', onChange);
        panel.removeEventListener('click', onClick);
        panel.removeEventListener('keydown', onKey);
        for (const group of panel.querySelectorAll('[data-factor-group]')) group.replaceChildren();
    };
}
