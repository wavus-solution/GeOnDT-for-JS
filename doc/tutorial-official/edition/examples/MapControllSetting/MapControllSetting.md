---
title: 화면 컨트롤 설정 예제
theme: pastel-glass-map
output: MapControllSetting.html
editor: true
category: map
summary: 세 가지 컨트롤 프리셋과 39개 factor를 조절하며 팬·회전 관성 및 이동·회전·줌 감각을 비교합니다.
tags:
  - 카메라
  - 컨트롤
  - 관성
  - 프리셋
apis:
  - U3dAPP
  - UMapControls
runtime:
  commonUi:
    imageLayerPanel: true
    terrainLayerPanel: true
  home:
    longitude: 126.9395
    latitude: 37.52
    height: 450
    duration: 0
    pitch: 60
  baseLayers: [satellite]
  terrain:
    enabled: true
    preset: korea
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
verification:
  scenarios:
    - id: initial-panel
      states:
        panel: {type: element, selector: '#MapControllSetting-option-panel', properties: [visible]}
        inputs: {type: element, selector: '[data-factor]', properties: [count]}
        preset: {type: element, selector: '[data-result-preset]', properties: [text]}
        inertia: {type: element, selector: '[data-result-inertia]', properties: [text]}
      expect:
        panel: {visible: true}
        inputs: {count: 39}
        preset: {text: 지도 탐색}
        inertia: {text: 켜짐}
    - id: toggle-settings
      actions:
        - {type: click, selector: '[data-panel-target="MapControllSetting-option-panel"]'}
      states:
        panel: {type: element, selector: '#MapControllSetting-option-panel', properties: [visible]}
      expect:
        panel: {visible: false}
    - id: indoor-preset
      actions:
        - {type: click, selector: '[data-preset="indoor"]'}
      states:
        preset: {type: element, selector: '[data-result-preset]', properties: [text]}
        damping: {type: element, selector: '[data-factor="panInertiaDamping"]', properties: [value]}
        pan: {type: element, selector: '[data-factor="panSpeed"]', properties: [value]}
        anchor: {type: element, selector: '[data-factor="panAnchorMaxDistance"]', properties: [value]}
      expect:
        preset: {text: 실내 정밀 이동}
        damping: {value: '10'}
        pan: {value: '0.07'}
        anchor: {value: '12'}
    - id: first-person-after-indoor
      actions:
        - {type: click, selector: '[data-preset="indoor"]'}
        - {type: click, selector: '[data-preset="firstPerson"]'}
      states:
        preset: {type: element, selector: '[data-result-preset]', properties: [text]}
        pan: {type: element, selector: '[data-factor="panSpeed"]', properties: [value]}
        mode: {type: element, selector: '[data-factor="moveType"]', properties: [value]}
        rotation: {type: element, selector: '[data-factor="rotationType"]', properties: [value]}
        zoom: {type: element, selector: '[data-factor="zoomType"]', properties: [value]}
      expect:
        preset: {text: 1인칭 탐색}
        pan: {value: '1'}
        mode: {value: '3'}
        rotation: {value: '3'}
        zoom: {value: '3'}
    - id: map-preset-restores-all
      actions:
        - {type: click, selector: '[data-preset="firstPerson"]'}
        - {type: click, selector: '[data-preset="indoor"]'}
        - {type: click, selector: '[data-preset="map"]'}
      states:
        damping: {type: element, selector: '[data-result-damping]', properties: [text]}
        mode: {type: element, selector: '[data-factor="moveType"]', properties: [value]}
        interMove: {type: element, selector: '[data-factor="interMoveSpeed"]', properties: [value]}
        anchor: {type: element, selector: '[data-factor="panAnchorMaxDistance"]', properties: [value]}
      expect:
        damping: {text: '5.5'}
        mode: {value: '1'}
        interMove: {value: '50'}
        anchor: {value: '2200'}
    - id: customize-and-reset
      actions:
        - {type: fill, selector: '[data-factor="panInertiaDamping"]', value: '4'}
        - {type: press, selector: '[data-factor="panInertiaDamping"]', key: Tab}
        - {type: uncheck, selector: '[data-factor="panInertiaEnabled"]'}
        - {type: click, selector: '[data-reset-preset]'}
      states:
        preset: {type: element, selector: '[data-result-preset]', properties: [text]}
        damping: {type: element, selector: '[data-result-damping]', properties: [text]}
        inertia: {type: element, selector: '[data-factor="panInertiaEnabled"]', properties: [checked]}
      expect:
        preset: {text: 지도 탐색}
        damping: {text: '5.5'}
        inertia: {checked: true}
    - id: custom-inertia
      actions:
        - {type: fill, selector: '[data-factor="panInertiaDamping"]', value: '4'}
        - {type: press, selector: '[data-factor="panInertiaDamping"]', key: Tab}
        - {type: uncheck, selector: '[data-factor="panInertiaEnabled"]'}
      states:
        preset: {type: element, selector: '[data-result-preset]', properties: [text]}
        damping: {type: element, selector: '[data-result-damping]', properties: [text]}
        inertia: {type: element, selector: '[data-result-inertia]', properties: [text]}
      expect:
        preset: {text: 지도 탐색 · 사용자 조정}
        damping: {text: '4'}
        inertia: {text: 꺼짐}
    - id: reject-invalid-damping
      actions:
        - {type: fill, selector: '[data-factor="panInertiaDamping"]', value: '-2'}
        - {type: press, selector: '[data-factor="panInertiaDamping"]', key: Tab}
      states:
        damping: {type: element, selector: '[data-result-damping]', properties: [text]}
        status: {type: element, selector: '[data-setting-status]', properties: [text]}
      expect:
        damping: {text: '5.5'}
        status: {text: '감속 계수 (1/s): 허용 범위의 숫자를 입력하세요.'}
    - id: anchor-inertia-customize
      actions:
        - {type: fill, selector: '[data-factor="panAnchorInertiaFactor"]', value: '0.25'}
        - {type: press, selector: '[data-factor="panAnchorInertiaFactor"]', key: Tab}
      states:
        anchor: {type: element, selector: '[data-factor="panAnchorInertiaFactor"]', properties: [value]}
        pan: {type: element, selector: '[data-factor="panInertiaFactor"]', properties: [value]}
      expect:
        anchor: {value: '0.25'}
        pan: {value: '0.55'}
    - id: anchor-inertia-preset-reset
      actions:
        - {type: fill, selector: '[data-factor="panAnchorInertiaFactor"]', value: '0'}
        - {type: press, selector: '[data-factor="panAnchorInertiaFactor"]', key: Tab}
        - {type: click, selector: '[data-preset="map"]'}
      states:
        anchor: {type: element, selector: '[data-factor="panAnchorInertiaFactor"]', properties: [value]}
      expect:
        anchor: {value: '0.5'}
    - id: reject-invalid-anchor-inertia
      actions:
        - {type: fill, selector: '[data-factor="panAnchorInertiaFactor"]', value: '2'}
        - {type: press, selector: '[data-factor="panAnchorInertiaFactor"]', key: Tab}
      states:
        status: {type: element, selector: '[data-setting-status]', properties: [text]}
      expect:
        status: {text: '앵커 팬 관성 배율: 허용 범위의 숫자를 입력하세요.'}
    - id: rotation-inertia-independent
      actions:
        - {type: fill, selector: '[data-factor="rotateInertiaDamping"]', value: '5'}
        - {type: press, selector: '[data-factor="rotateInertiaDamping"]', key: Tab}
        - {type: uncheck, selector: '[data-factor="rotateInertiaEnabled"]'}
      states:
        rotation: {type: element, selector: '[data-result-rotate-inertia]', properties: [text]}
        damping: {type: element, selector: '[data-result-rotate-damping]', properties: [text]}
        pan: {type: element, selector: '[data-result-inertia]', properties: [text]}
      expect:
        rotation: {text: 꺼짐}
        damping: {text: '5'}
        pan: {text: 켜짐}
    - id: rotation-indoor-preset
      actions:
        - {type: click, selector: '[data-preset="indoor"]'}
      states:
        strength: {type: element, selector: '[data-result-rotate-strength]', properties: [text]}
        damping: {type: element, selector: '[data-result-rotate-damping]', properties: [text]}
      expect:
        strength: {text: '0.25'}
        damping: {text: '13'}
    - id: rotation-preset-reset
      actions:
        - {type: click, selector: '[data-preset="firstPerson"]'}
        - {type: uncheck, selector: '[data-factor="rotateInertiaEnabled"]'}
        - {type: click, selector: '[data-preset="map"]'}
      states:
        rotation: {type: element, selector: '[data-result-rotate-inertia]', properties: [text]}
        strength: {type: element, selector: '[data-result-rotate-strength]', properties: [text]}
        damping: {type: element, selector: '[data-result-rotate-damping]', properties: [text]}
      expect:
        rotation: {text: 켜짐}
        strength: {text: '0.35'}
        damping: {text: '8'}
    - id: close-api-help-from-input
      actions:
        - {type: click, selector: '[data-factor="rotateInertiaDamping"]'}
        - {type: press, selector: '[data-factor="rotateInertiaDamping"]', key: Escape}
      states:
        help: {type: element, selector: '#example-api-help', properties: [visible]}
      expect:
        help: {visible: false}
sources:
  - {id: main, path: ./MapControllSetting.main.js, language: javascript, editable: true}
  - {id: ui, path: ./MapControllSetting.ui.js, language: javascript, editable: true}
  - {id: api, path: ./MapControllSetting.api.js, language: javascript, editable: true}
  - {id: html, path: ./MapControllSetting.html, language: html, editable: true}
  - {id: css, path: ./MapControllSetting.css, language: css, editable: true}
---

# 화면 컨트롤 설정 예제

마우스를 놓은 뒤 서서히 멈추는 팬·회전 관성과 기존 이동·회전·줌 설정을 같은 지도에서 비교합니다. 세 프리셋으로 시작한 뒤 세부 factor를 변경하고, 현재 적용된 설정 코드를 확인할 수 있습니다.

## 다루는 기능

- `U3dAPP.getMapControl().getFactor()`로 39개 설정값을 읽고 수정합니다.
- `UMapControlBase.setControlType()`과 factor 전체 적용으로 지도·실내·1인칭 컨트롤 프리셋을 전환합니다.
- `UMapControlBase.setUseCollision()`으로 지면 충돌 사용을 전환하고 높이 관련 factor를 비교합니다.

## 사전 조건

- 마우스 pan·회전 관성을 지원하는 현재 GeOnDT 엔진 소스를 사용합니다. 관성 구현 이전 배포본에서는 새 factor가 동작하지 않습니다.
- Common Runtime이 위성지도와 한반도 지형을 생성합니다. 배경 타일은 네트워크 연결이 필요하며, 로컬 지형 데이터가 없거나 요청에 실패하면 실제 지형을 기준으로 한 충돌 비교가 제한됩니다.
- 초기 시점은 여의도 인근, 높이 450입니다. 프리셋은 카메라 위치를 바꾸지 않으며 실내 모델을 추가로 불러오지 않습니다. 실내 프리셋은 `componentControlAtIndoor`의 감도·앵커 설정을 기준으로 합니다.
- `npm run 예제:로컬:HTML생성하기 -- MapControllSetting` 후 개발 서버의 `/tutorial-official/edition/MapControllSetting.html`에서 확인합니다. 로컬 라이선스 검증에는 `localhost`를 사용합니다.

## 주요 기능

- **지도 탐색**: 엔진과 앱의 초기 factor, 팬 관성 세기 0.55·감속 5.5·속도 상한 1000, 회전 관성 세기 0.35·감속 8·속도 상한 1200을 사용합니다. 팬·회전 최소 속도의 기본값은 각각 5 CSS px/s입니다.
- **실내 정밀 이동**: 낮은 이동·줌 감도, 12로 제한한 팬 앵커 거리, 팬 관성 세기 0.25·감속 10·속도 상한 400, 회전 관성 세기 0.25·감속 13·속도 상한 400을 사용합니다.
- **1인칭 탐색**: 팬·회전·줌을 1인칭으로 바꾸고 이동 6·회전 1·줌 2, 팬 관성 세기 0.18·감속 12·속도 상한 300, 회전 관성 세기 0.16·감속 14·속도 상한 300을 사용합니다.
- 고급 구획을 펼치면 모든 factor를 조절할 수 있습니다. 숫자는 입력 후 Enter 또는 포커스를 옮기면 적용됩니다. 오류 시 기존 설정을 유지합니다.
- 프리셋 버튼은 전체 설정과 초기 충돌 사용 상태를 복원합니다. 직접 수정하면 결과에 `사용자 조정`으로 표시됩니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 예제를 엽니다. | 컨트롤 설정 패널과 지도 탐색 프리셋이 표시됩니다. |
| API 도움말이 지도 위에 열린 상태에서 Esc를 누릅니다. | 도움말을 닫고 해당 위치에서 지도를 드래그할 수 있습니다. |
| 지도에서 왼쪽 버튼으로 드래그하다 바로 놓습니다. | 마지막 이동 속도에 따라 관성이 이어지고 서서히 멈춥니다. |
| 드래그 후 평활·유효 시간 이상 멈췄다가 놓습니다. | 관성이 시작되지 않습니다. |
| 팬 관성을 끄거나 관성 세기를 0으로 바꿉니다. | 마우스를 놓는 즉시 팬 이동을 멈춥니다. |
| 같은 속도로 드래그하며 감속을 4와 12로 비교합니다. | 4에서 길게, 12에서 짧게 감속합니다. |
| 실내 정밀 이동 → 1인칭 탐색 → 지도 탐색 순서로 누릅니다. | 앞서 사용한 프리셋의 설정이 남지 않고 각 프리셋의 전체 값으로 바뀝니다. |
| 오른쪽 버튼으로 드래그하거나 휠을 움직입니다. | 선택한 회전·줌 방식과 감도가 적용됩니다. 회전 관성은 회전 드래그에만 적용되며, 휠에는 관성을 적용하지 않습니다. |
| 지도에 포커스를 두고 Shift를 누른 채 조작합니다. | 기본 전환 키 설정에서는 누르는 동안 임시 1인칭 방식으로 동작합니다. |
| 감속에 음수나 빈 값을 입력합니다. | 하단에 오류가 표시되고 적용 결과는 이전 값을 유지합니다. |
| 선택한 프리셋 값으로 복원을 누릅니다. | 사용자 변경을 지우고 선택한 프리셋의 모든 factor를 다시 적용합니다. |
| 현재 설정 코드 보기를 펼칩니다. | 실제 엔진 값을 담은 코드를 선택·복사할 수 있습니다. |
| 왼쪽 컨트롤 버튼을 누릅니다. | 처음에는 패널이 닫히고, 다시 누르면 열립니다. |

## 관성 조절 기준

기본값은 낮은 시작 속도와 완만한 감속을 조합해 무게감을 조절합니다. 팬의 시작 속도 배율과 상한을 특히 낮춰 빠르게 놓았을 때의 과도한 이동을 줄입니다. 감속 계수만 낮추면 오히려 더 멀리 미끄러지므로 세기·상한과 함께 조절합니다.

**앵커 팬 관성 배율**(`panAnchorInertiaFactor`)의 기본값은 `0.5`입니다. 실제 앵커 팬으로 끝난 드래그는 기존 세기·속도 상한 적용 후 관성 시작 속도를 추가로 절반 줄입니다. `0`이면 앵커 팬 관성을 끄고, `1`이면 기존 세기를 유지합니다. UI에서는 0~1을 입력하며, API에 직접 넣은 1 초과 값은 1로 제한합니다. 누락·비유한 값·음수는 기본값으로 대체합니다. 앵커를 잡지 못하거나 이동량 제한을 넘어 일반 팬으로 대체된 경우, 1인칭 이동과 회전에는 적용하지 않습니다. 앵커 여부가 바뀌면 이전 속도 표본을 버려 큰 앵커 이동량이 일반 팬 관성에 섞이지 않게 합니다.

관성은 드래그 속도를 추정한 후 지수 감쇠로 줄입니다. `panInertiaFactor`는 시작 속도 배율, `panInertiaDamping`은 초당 감속 계수입니다. `panInertiaMinSpeed`와 `panInertiaMaxSpeed`는 CSS px/s, `panInertiaSampleTime`은 ms 단위입니다. 최대 속도를 최소 속도 이하로 두면 관성을 시작하지 않습니다. 설정을 적용하면 진행 중인 관성을 취소하고 다음 드래그부터 비교합니다.

`panSpeed`는 일반 팬과 앵커 팬의 대체 이동 경로에 적용되므로, 정상적인 앵커 추적 구간에서는 변화가 느껴지지 않을 수 있습니다. 명확하게 비교하려면 **입력 방식과 지면 충돌 → 팬 이동 방식 → 앵커 없이**를 선택합니다. 1인칭 마우스 팬은 `interMoveSpeed`를 사용합니다. `autoRotateSpeed`는 자동 회전용 설정값만 노출하며 이 예제에서 자동 회전을 시작하지는 않습니다.

## 프리셋 적용 코드

회전 관성은 `rotateInertiaEnabled`, `rotateInertiaFactor`, `rotateInertiaDamping`, `rotateInertiaMinSpeed`, `rotateInertiaMaxSpeed`, `rotateInertiaSampleTime`으로 조절합니다. 속도는 각속도가 아닌 CSS px/s 단위의 마우스 입력 속도입니다. **오른쪽 드래그 또는 Ctrl+왼쪽 드래그를 바로 놓아** 확인하고, 팬 관성을 켠 상태에서 회전 관성만 꺼 두고 차이를 비교할 수 있습니다.

마지막 드래그의 일반·앵커·1인칭 회전 방식과 앵커를 유지하며 추가 picking을 하지 않습니다. 기존 경로의 각도 제한과 충돌 처리를 따르고, 회전이 막히거나 새 입력을 받으면 잔여 속도를 버립니다. Shift로 시작한 1인칭 회전은 키를 놓아도 해당 드래그의 방식으로 감속합니다.

동일한 초기값에서 프리셋을 만들고 각 모드의 감도만 덮어씁니다. 최대 줌 거리는 앱이 초기 줌 레벨로 정한 값을 유지합니다.

{{example-code:control.presets}}

`getFactor()`의 공유 객체를 교체하지 않고 속성만 수정합니다. `setControlType()`은 진행 중인 관성을 취소하고 입력 방식을 바꿉니다.

{{example-code:control.apply}}

## 관련 API

- `U3dAPP.getMapControl()`: 현재 지도의 컨트롤러를 가져옵니다.
- `UMapControlBase.getFactor()`: 입력 감도·앵커·충돌·관성 factor 객체를 가져옵니다. 공개 계약은 `FactorOption`이며 관성 항목은 현재 소스의 `UMapControlBase.types.js`를 함께 참고합니다.
- `UMapControlBase.setControlType(type, controlCase)`: `GeOnDT.constant.CONTROL_TYPE`의 앵커·일반·1인칭 방식을 지정합니다. 일부 입력만 변경할 때 `CONTROL_CASE`를 함께 전달합니다.
- `UMapControlBase.getUseCollision()` / `setUseCollision(value)`: 지면 충돌 사용 상태를 읽고 수정합니다.
- `rotateAnchorMinPolarAngle`은 API에서 라디안을 사용하므로 UI의 도 단위를 변환합니다. 기존 양수 factor는 0을 기본값으로 처리하므로 이 예제에서 0 입력을 제한합니다. 관성 세기 0과 지면 고도 오프셋 0은 허용합니다.

## API Help

각 설정 구획의 API Help에서 실제 프리셋·적용 코드와 현재 설정에 해당하는 코드를 함께 확인합니다. 결과의 전체 설정 코드는 숨겨진 고급 factor까지 포함하며 실제 엔진 값을 읽습니다. 엔진 코드가 변경된 뒤 편집기의 타입 설명을 갱신하려면 공개 타입 배포본도 함께 갱신해야 합니다.
