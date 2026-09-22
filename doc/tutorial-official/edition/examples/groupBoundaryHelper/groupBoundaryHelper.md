---
title: 그룹 경계 형상 출력 제어
theme: pastel-glass-map
output: groupBoundaryHelper.html
editor: true
category: etc
summary: 이동 객체의 그룹이 합쳐지거나 분리될 때 경계 형상을 실시간으로 시각화하는 예제입니다.
tags:
  - 경계
  - Drone
  - UGroupBoundaryHelper
apis:
  - U3dAPP
  - UGroupBoundaryHelper
runtime:
  home: {longitude: 127.5525, latitude: 36.701, height: 5200, duration: 2, pitch: 60}
  baseLayers:
    - satellite
  terrain:
    enabled: true
    preset: korea
  mapTools:
    - home
    - north
    - zoom-in
    - zoom-out
  cameraStatus: true
  help: true
  loading: true
verification:
  scenarios:
    - id: initial-panel
      states:
        canvas: {type: element, selector: "#map canvas", properties: [exists, visible]}
        panel: {type: element, selector: "#group-boundary-helper-panel", properties: [exists, visible]}
        toggle: {type: element, selector: "#group-boundary-play-toggle", properties: [exists, visible, text]}
      expect:
        canvas: {exists: true, visible: true}
        panel: {exists: true, visible: true}
        toggle: {exists: true, visible: true, text: "일시정지"}
    - id: toggle-panel
      actions:
        - type: click
          selector: "[data-panel-target='group-boundary-helper-panel']"
      states:
        panel: {type: element, selector: "#group-boundary-helper-panel", properties: [exists, visible]}
      expect:
        panel: {exists: true, visible: false}
sources:
  - {id: main, path: ./groupBoundaryHelper.main.js, language: javascript, editable: true}
  - {id: ui, path: ./groupBoundaryHelper.ui.js, language: javascript, editable: true}
  - {id: api, label: API Guide, path: ./groupBoundaryHelper.api.js, language: javascript, editable: true}
  - {id: html, path: ./groupBoundaryHelper.html, language: html, editable: true}
  - {id: css, path: ./groupBoundaryHelper.css, language: css, editable: true}
---

# 그룹 경계 형상 출력 제어

드론 모델을 다수 그룹으로 배치하고, 이동/회전/이동거리 변화에 따라 각 그룹의 경계 헬퍼가 실시간으로 다시 계산되는지 확인합니다.

## 다루는 기능

- 다수 드론 그룹이 이동·회전할 때 `UGroupBoundaryHelper`가 그룹 경계를 매 프레임 다시 계산하는 과정을 재생·속도·초기화 조작으로 확인합니다.

## 사전 조건

- `https://3d-dev.geon.kr`의 드론 컴포넌트 모델을 내려받을 수 있는 네트워크가 필요합니다. 모델을 불러오지 못하면 그룹과 경계 헬퍼가 만들어지지 않아 상태 표시가 0으로 남습니다.
- 초기 화면은 위성영상과 한반도 지형 위 상공에서 시작하며, 예제가 시작되면 애니메이션이 자동으로 재생됩니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 왼쪽 `경계 제어` 버튼을 누릅니다. | 그룹 경계 제어 패널이 열리고 닫힙니다. 초기 화면에서는 이미 열려 있습니다. |
| 패널에서 `일시정지`를 누릅니다. | 애니메이션이 멈추고 버튼이 `재생`으로 바뀝니다. |
| `애니메이션 속도` 슬라이더를 옮깁니다. | 옆의 배속 값이 바뀌고 그룹 이동 속도가 그만큼 빨라지거나 느려집니다. |
| 애니메이션을 재생한 채로 둡니다. | `현재 스텝` 값이 증가하고 그룹이 합쳐지거나 나뉘면서 `그룹 수`와 `헬퍼 수`가 함께 바뀝니다. |
| `초기화`를 누릅니다. | 스텝이 0으로 돌아가고 그룹 배치와 경계 헬퍼가 처음 상태로 다시 계산됩니다. |

## 관련 API

- `UGroupBoundaryHelper`: 그룹에 속한 컴포넌트의 외곽선과 면 경계를 계산해 표시합니다.
- `U3dAPP`: 렌더 직전 이벤트에 맞춰 헬퍼 갱신을 실행할 지도 앱입니다.

## 주요 기능

- 기존 지도를 기본 지형/위성 타일 위에 표시합니다.
- 다중 컴포넌트 레이어에 드론 모델을 로드해 7개 그룹을 만듭니다.
- 그룹별 `UGroupBoundaryHelper`를 생성해 외곽선과 면을 동시에 갱신합니다.
- 렌더 직전에 헬퍼를 갱신해 애니메이션 프레임마다 경계 변화를 반영합니다.
- 재생/일시정지, 속도 변경, 초기화를 통해 경계 추적 상태를 직접 조작할 수 있습니다.

## API 코드 확인

애니메이션 제어와 헬퍼 갱신 코드는 다음 위치에서 확인할 수 있습니다.

{{example-code:group.animation-control}}
{{example-code:group.speed-control}}
{{example-code:group.play-control}}
{{example-code:group.reset-control}}
{{example-code:group.render-update}}
