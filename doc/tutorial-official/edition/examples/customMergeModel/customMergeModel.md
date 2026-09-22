---
title: 가상건물 추가 예제
theme: pastel-glass-map
output: customMergeModel.html
editor: true
category: model
summary: 지도에 그린 도형으로 가상건물을 만들고 선택한 건물을 하나로 병합합니다.
tags: [가상건물, 병합, Gizmo, 사용자 모델]
apis: [UAnalyCustomModel, UAnalyGizmoModel, U3dSelect]
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
  - {id: main, path: ./customMergeModel.main.js, language: javascript, editable: true}
  - {id: ui, path: ./customMergeModel.ui.js, language: javascript, editable: true}
  - {id: api, label: API Help, path: ./customMergeModel.api.js, language: javascript, editable: true}
  - {id: html, path: ./customMergeModel.html, language: html, editable: true}
  - {id: css, path: ./customMergeModel.css, language: css, editable: true}
---

# 가상건물 추가 예제

사용자가 마우스 클릭으로 도형을 그리면 그 도형의 모양대로 가상건물을 지도에 추가하는 예제입니다.
추가한 가상건물은 위치, 회전, 크기를 편집할 수 있고 서로 다른 두 가상건물을 하나로 병합할 수 있습니다.

## 다루는 기능

- `UAnalyCustomModel`로 지도에 그린 도형을 가상건물로 만들고, `U3dSelect`로 고른 건물을 하나로 병합하며 `UAnalyGizmoModel`로 위치·회전·크기를 편집합니다.

## 사전 조건

- 초기 화면은 위성영상과 한반도 지형 위에서 시작합니다. 지형 타일을 내려받지 못하면 건물이 놓일 지면 높이가 평면으로 계산됩니다.
- 별도 모델 데이터는 필요하지 않습니다. 가상건물은 사용자가 지도에서 직접 그려서 만듭니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 왼쪽 `가상건물` 버튼을 누릅니다. | 가상건물 추가 패널이 열립니다. |
| 건물 추가 모드에서 지도를 3번 이상 클릭한 뒤 더블클릭합니다. | 이름과 높이를 입력하는 창이 열리고, `건물 만들기`를 누르면 가상건물이 생성됩니다. |
| 이름을 비우거나 중복된 이름으로 확인합니다. | 창과 그린 정점이 그대로 남아 값만 고쳐 다시 확인할 수 있습니다. |
| 건물 두 개 이상을 선택하고 `건물병합`을 누릅니다. | 선택한 건물이 하나의 가상건물로 합쳐집니다. |
| `위치편집`·`회전편집`·`크기편집`을 누르고 기즈모를 조작합니다. | 선택한 건물이 조작한 값대로 지도에서 바뀝니다. |
| 건물 표현과 속성을 바꾸고 `적용`을 누릅니다. | 색상·투명도·텍스처·라벨·높이가 지도에 반영됩니다. |
| `저장` 후 `불러오기`를 누릅니다. | 저장한 가상건물 목록이 그대로 복원됩니다. |
| `전체지우기`를 누릅니다. | 생성한 가상건물이 모두 제거됩니다. |

## 주요 기능

- 건물 추가 모드에서 지도를 3번 이상 클릭한 뒤 더블클릭하면 이름과 높이를 입력하는 창이 열리고, 확인하면 가상건물이 만들어집니다.
- 단일 선택과 영역 선택으로 편집할 가상건물을 고릅니다.
- 선택한 가상건물들을 하나의 가상건물로 병합합니다.
- 가상건물의 색상, 투명도, 텍스처, 라벨, 건물 높이, 지상 높이를 편집합니다.
- Gizmo로 가상건물의 위치, 회전, 크기를 편집합니다.
- 생성한 가상건물 목록을 저장하고 다시 불러오거나 전체 삭제합니다.

## 선택 기능 생성

`U3dSelect`를 기본 Outline 강조 방식으로 생성하고 앱의 선택 기능으로 등록합니다.

{{example-code:model.create}}

## 가상건물 생성

더블클릭하면 열리는 생성 창에서 이름과 높이를 입력하고 확인하면, 모아 둔 정점과 입력값으로 가상건물을 생성합니다.
이름이 비었거나 중복이거나 높이가 잘못된 경우에는 창과 정점을 그대로 두어 값만 고쳐 다시 확인할 수 있습니다.

{{example-code:model.add}}

## 가상건물 병합

선택 결과의 첫 번째 건물을 기준으로 나머지 건물을 병합한 뒤 병합 결과를 새 가상건물로 추가합니다.

{{example-code:model.merge}}

## 관련 API

- `UAnalyCustomModel`
- `UAnalyGizmoModel`
- `U3dSelect`
