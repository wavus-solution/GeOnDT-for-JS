---
title: 가상건물 추가 예제
theme: pastel-glass-map
output: customModel.html
editor: true
category: analysis
summary: 지도에 가상건물을 그리고 선택하여 모양과 표시 상태를 편집합니다.
tags: [가상건물, CustomModel, Gizmo, 편집]
apis: [UAnalyCustomModel, U3dCustomModel, UAnalyGizmoModel]
runtime:
  home: {longitude: 126.9395, latitude: 37.52, height: 450, duration: 2, pitch: 60}
  baseLayers: [satellite]
  terrain: {enabled: true, preset: korea}
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
verification:
  scenarios:
    - id: initial-panel
      states:
        canvas: {type: element, selector: "#map canvas", properties: [exists, visible]}
        panel: {type: element, selector: "#custom-model-panel", properties: [exists, visible]}
      expect:
        canvas: {exists: true, visible: true}
        panel: {exists: true, visible: true}
    - id: toggle-panel
      actions:
        - type: click
          selector: "[data-panel-target='custom-model-panel']"
      states:
        panel: {type: element, selector: "#custom-model-panel", properties: [exists, visible]}
      expect:
        panel: {exists: true, visible: false}
sources:
  - {id: main, path: ./customModel.main.js, language: javascript, editable: true}
  - {id: ui, path: ./customModel.ui.js, language: javascript, editable: true}
  - {id: api, label: API Help, path: ./customModel.api.js, language: javascript, editable: true}
  - {id: html, path: ./customModel.html, language: html, editable: true}
  - {id: css, path: ./customModel.css, language: css, editable: true}
---

# 가상건물 추가 예제

지도에서 꼭짓점을 지정하여 가상건물을 생성하고 선택한 건물의 높이와 표현을 편집합니다.

## 다루는 기능

- `UAnalyCustomModel`로 지도에 꼭짓점을 찍어 가상건물을 만들고, 선택한 건물의 높이·색상·투명도·라벨을 바꾸며 `UAnalyGizmoModel`로 위치·회전·크기를 편집합니다.

## 사전 조건

- 초기 화면은 위성영상과 한반도 지형 위에서 시작합니다. 지형 타일을 내려받지 못하면 건물이 놓일 지면 높이가 평면으로 계산됩니다.
- 별도 모델 데이터는 필요하지 않습니다. 가상건물은 사용자가 지도에서 직접 그려서 만듭니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 왼쪽 `건물` 버튼을 누릅니다. | 가상건물 추가 패널이 열립니다. |
| `작업 모드`에서 그리기를 고르고 지도에서 꼭짓점을 3개 이상 찍은 뒤 더블클릭합니다. | 생성 설정의 값으로 가상건물이 만들어지고 목록에 추가됩니다. |
| 건물을 선택하고 높이·색상·투명도·라벨을 바꾼 뒤 `설정 적용`을 누릅니다. | 선택한 건물의 표현이 지도에서 즉시 바뀝니다. |
| `위치`·`회전`·`크기` 버튼으로 기즈모를 바꾸고 조작합니다. | 선택한 건물이 조작한 값대로 지도에서 움직입니다. |
| 목록에서 개별 건물의 표시를 끄거나 삭제합니다. | 해당 건물이 지도에서 숨겨지거나 제거됩니다. |
| `저장` 후 `불러오기`를 누릅니다. | 저장한 가상건물 작업이 그대로 복원됩니다. |
| `전체 삭제`를 누릅니다. | 생성한 가상건물이 모두 제거됩니다. |

## 관련 API

- `UAnalyCustomModel`: 지도에서 수집한 꼭짓점으로 가상건물을 생성하고 표현을 변경합니다.
- `U3dCustomModel`: 생성된 개별 가상건물을 나타내며 높이와 스타일 변경 대상이 됩니다.
- `UAnalyGizmoModel`: 선택한 가상건물의 위치·회전·크기를 기즈모로 편집합니다.

## 주요 기능

- 지도에서 꼭짓점을 3개 이상 지정한 뒤 더블클릭하여 건물을 생성합니다.
- 생성한 건물의 높이, 색상, 투명도와 라벨을 변경합니다.
- 기즈모로 건물의 위치, 회전과 크기를 편집합니다.
- 가상건물 작업을 메모리에 저장하고 다시 불러옵니다.
- 개별 건물을 표시하거나 숨기고 삭제합니다.

## 가상건물 생성

그리기 모드에서 수집한 월드 좌표와 입력한 스타일로 가상건물을 생성합니다.

{{example-code:custom.create}}

## 가상건물 편집

선택한 모델의 높이를 먼저 변경한 뒤 색상, 투명도와 라벨을 적용합니다.

{{example-code:custom.style}}
