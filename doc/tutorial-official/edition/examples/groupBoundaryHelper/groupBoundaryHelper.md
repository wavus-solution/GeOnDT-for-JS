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

드론 모델을 다수 그룹으로 배치하고, 이동/회전/이동거리 변화에 따라 각 그룹의 경계 헬퍼가 실시간으로 다시 계산되는지 확인합니다. 빨간 경계의 10대는 알약 형태의 같은 경로를 일렬로 따라가며, 앞쪽은 직선 비행·뒤쪽은 선회 비행을 하는 구간에서 기체마다 다른 roll을 비교합니다.

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
| 애니메이션을 재생한 채로 둡니다. | `현재 스텝` 값이 증가하고 각 대형의 경계가 변합니다. 논리 그룹 수와 헬퍼 수는 각각 8개로 유지됩니다. |
| `초기화`를 누릅니다. | 스텝이 0으로 돌아가고 그룹 배치와 경계 헬퍼가 처음 상태로 다시 계산됩니다. |
| `일렬 대형 가까이 보기`를 누릅니다. | 빨간 경계의 드론 10대를 가까이 봅니다. 각 기체는 같은 알약 경로를 65m의 경로 거리 간격으로 따라갑니다. |
| `초기화`를 누릅니다. | 선두 쪽은 직선, 후미 쪽은 선회 중인 경계 구간으로 돌아갑니다. `직선 / 선회`와 `roll 범위`로 혼합 상태를 확인합니다. |
| `선회 방향`을 바꿉니다. | 해당 방향의 직선·선회 혼합 시작 배치로 이동합니다. 선회 roll은 시계 방향에서 양수, 반시계 방향에서 음수입니다. |
| 일시정지 후 `기체별 roll 적용`을 켜고 끕니다. | 위치와 고도를 유지한 채 각 기체의 자세만 바뀝니다. 같은 위치에서 경계가 달라지는지 비교합니다. |
| 고도 차이와 roll을 켠 채 `초기화` 후 1배속으로 약 15~25초 재생합니다. | 후미가 선회를 마치고 일렬 직선으로 모여도 빨간 경계는 수십 m 규모의 수직 크기를 유지하고 경계 갱신 오류 횟수는 0으로 유지됩니다. 수정 전에는 이 구간에서 평면 경사가 폭증하여 거대한 막과 높이 오류가 발생했습니다. `최대 수직 크기`와 오류 기록으로 재발 여부를 확인합니다. |
| `기체별 고도 차이 적용`을 끕니다. | 시작 구간으로 돌아가 같은 지리 고도의 일렬 대형과 비교합니다. 이 조작과 `초기화`, 방향 변경은 누적 오류와 최대 크기 기록을 지웁니다. |

## 관련 API

- `UGroupBoundaryHelper`: 그룹에 속한 컴포넌트의 외곽선과 면 경계를 계산해 표시합니다.
- `U3dAPP`: 렌더 직전 이벤트에 맞춰 헬퍼 갱신을 실행할 지도 앱입니다.

## 주요 기능

- 기존 지도를 기본 지형/위성 타일 위에 표시합니다.
- 다중 컴포넌트 레이어에 드론 모델을 로드해 8개 그룹을 만듭니다.
- 알약 경로는 길이 1,400m의 직선 두 개와 반경 600m의 반원 두 개로 구성합니다. 기본 속도는 90km/h(25m/s), 기준 고도는 950m이며, 모든 기체의 위치를 같은 렌더 시각에 갱신합니다.
- 실제 서비스의 GROUP 103에서 확인한 기체별 고도 차이 `[0, -4, 4, -4, 4, -4, 4, -4, 4, -4]m`를 적용합니다. 서비스의 실시간 위치 자료를 저장해 재생하는 방식이 아니라, 이 고도 차이를 예제의 알약 경로에 합성합니다.
- 빨간 경계는 서비스와 같은 `height: 30`, `bufferSize: 120`, `connectionDistance: 450`, `positionTolerance: 12`, `surfaceMode: 'plane'`을 사용합니다. 다른 7개 대형의 설정은 유지합니다.
- 각 기체는 선두보다 65m씩 뒤의 경로 위치를 사용합니다. 직선의 roll은 0°이고, 선회는 진입·이탈 100m에서 부드럽게 변해 최대 ±30°가 됩니다. 최대 기울기는 현상 비교용 설정이며 속도와 반경으로 계산한 항공 역학 모델은 아닙니다.
- 지리 좌표는 기존 대형과 같은 `geographicToVector3()` 경로로 변환합니다. 경계의 위치 완화값도 기존 대형과 같은 12m입니다. 일시정지 직후에는 위치 필터가 정착할 때까지 잠깐 기다린 뒤 roll을 비교합니다.
- 그룹별 `UGroupBoundaryHelper`를 생성해 외곽선과 면을 동시에 갱신합니다.
- 렌더 직전에 헬퍼를 갱신해 애니메이션 프레임마다 경계 변화를 반영합니다.
- 빨간 경계의 측면 bounding box에서 수직 크기를 읽고 최대값과 갱신 오류 횟수를 표시합니다. 오류 시 마지막 오류 메시지를 보존하고 다른 대형과 조작부는 계속 동작합니다. 오류 메시지는 엔진의 원래 콘솔 출력에도 남습니다.
- `plane` 모드는 거의 일렬인 대형에서 불안정한 폭 방향 기울기를 부드럽게 줄이고, 진행 방향의 고도 경사와 모든 대상의 높이 범위를 포함하는 평행 상·하면을 유지합니다. 예제는 고도 차이나 roll을 제거하지 않고 이 안정화의 회귀를 확인합니다.
- 재생/일시정지, 속도 변경, 초기화를 통해 경계 추적 상태를 직접 조작할 수 있습니다.

## API 코드 확인

애니메이션 제어와 헬퍼 갱신 코드는 다음 위치에서 확인할 수 있습니다.

{{example-code:group.animation-control}}
{{example-code:group.speed-control}}
{{example-code:group.play-control}}
{{example-code:group.reset-control}}
{{example-code:group.render-update}}
{{example-code:group.banked-flight}}
