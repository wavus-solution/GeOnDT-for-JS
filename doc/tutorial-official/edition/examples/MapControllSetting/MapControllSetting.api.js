/** 의미 있는 설정 구획을 실제 적용 코드와 현재 엔진 값에 연결합니다. */
export const apiHelp = {
    'control.presets': {
        title: '컨트롤 프리셋 전체 적용',
        description: '같은 초기 factor에서 세 프리셋을 만듭니다. 카메라 위치는 유지하고 모든 설정을 함께 바꿉니다.',
        mode: 'hybrid', source: {sourceId: 'main', token: 'control.presets'},
        getCode(context, example) { return example.getCode(); }
    },
    'control.inertia': {
        title: 'getFactor() · 팬 관성',
        description: '관성 세기·앵커 팬 전용 배율·감속·속도 문턱·속도 추정 시간을 조절합니다. 입력 적용 시 진행 중인 관성을 취소합니다.',
        mode: 'hybrid', source: {sourceId: 'main', token: 'control.apply'},
        getCode(context, example) { return example.getCode('inertia'); }
    },
    'control.rotation-inertia': {
        title: 'getFactor() · 회전 관성',
        description: '마지막 드래그의 회전 방식과 앵커를 이어받아 감속합니다. 팬과 독립적으로 설정하며, 새 입력·각도 제한·충돌 등으로 회전이 막히면 멈춥니다.',
        mode: 'hybrid', source: {sourceId: 'main', token: 'control.apply'},
        getCode(context, example) { return example.getCode('rotationInertia'); }
    },
    'control.motion': {
        title: 'getFactor() · 이동과 회전 감도',
        description: 'panSpeed는 일반 팬과 앵커 팬의 대체 경로, interMoveSpeed는 1인칭 마우스 이동에 적용됩니다. autoRotateSpeed는 자동 회전이 활성화된 경우에 사용합니다.',
        mode: 'dynamic',
        getCode(context, example) { return example.getCode('motion'); }
    },
    'control.zoom': {
        title: 'getFactor() · 줌과 거리 제한',
        description: '줌 감도·최소 이동량·거리 제한을 설정합니다. 최초 최대 거리는 앱의 줌 레벨 설정을 따릅니다.',
        mode: 'dynamic',
        getCode(context, example) { return example.getCode('zoom'); }
    },
    'control.anchor': {
        title: 'getFactor() · 앵커 범위',
        description: '앵커 탐색 범위와 일반 팬으로 전환하는 제한을 조절합니다. 화면의 각도는 도 단위이며 아래 코드는 라디안입니다.',
        mode: 'dynamic',
        getCode(context, example) { return example.getCode('anchor'); }
    },
    'control.mode': {
        title: 'setControlType() · setUseCollision()',
        description: '팬·회전·줌 방식과 임시 1인칭 전환 키, 지면 충돌을 설정합니다. 입력 중에는 방향키가 지도에 전달되지 않습니다.',
        mode: 'dynamic',
        getCode(context, example) { return example.getCode('mode') + `\ncontrol.setUseCollision(${example.getCollision()});`; }
    }
};
