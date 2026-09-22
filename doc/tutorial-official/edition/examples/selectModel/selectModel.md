---
title: 객체 정보조회 예제
theme: pastel-glass-map
output: selectModel.html
editor: true
category: analysis
summary: 지도에서 3차원 모델을 선택하여 레이어와 객체 정보를 조회합니다.
tags: [객체 선택, U3F, WFS, 오버레이]
apis: [U3dSelect, U3dOverlay, U3dModelWFSLayer, create3DFModelLayer]
runtime:
  home: {longitude: 126.9395, latitude: 37.52, height: 450, duration: 2, pitch: 60}
  baseLayers: [satellite]
  terrain: {enabled: true, preset: korea}
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
verification:
  legacyUrl: /tutorial-official/examples/selectModel/selectModel.baseline.html
  scenarios:
    - id: select-area-mode
      actions:
        # Edition Runtime은 예제 Rail의 첫 패널을 자동으로 열어 두므로 Legacy에서만 패널을 연다.
        - type: click
          targets: [legacy]
          selector:
            legacy: "#analy-bnt"
        - type: click
          selector:
            legacy: ".selectCheck[target='area']"
            edition: "label:has(input[name='select-mode'][value='area'])"
      states:
        canvas:
          type: element
          selector:
            legacy: "#map canvas"
            edition: "#map canvas"
          properties: [exists, visible]
        queryPanel:
          type: element
          selector:
            legacy: "#analy-popup .div-popup"
            edition: "#object-query-panel"
          properties: [exists, visible]
        areaMode:
          type: element
          selector:
            legacy: ".selectCheck[target='area']"
            edition: "input[name='select-mode'][value='area']"
          properties: [exists, checked]
      compare: [canvas, queryPanel, areaMode]
      expect:
        canvas: {exists: true, visible: true}
        queryPanel: {exists: true, visible: true}
        areaMode: {exists: true, checked: true}
sources:
  - {id: main, path: ./selectModel.main.js, language: javascript, editable: true}
  - {id: ui, path: ./selectModel.ui.js, language: javascript, editable: true}
  - {id: api, label: API Help, path: ./selectModel.api.js, language: javascript, editable: true}
  - {id: html, path: ./selectModel.html, language: html, editable: true}
  - {id: css, path: ./selectModel.css, language: css, editable: true}
featured: true
---

# 객체 정보조회 예제

지도에서 3차원 모델을 선택하여 레이어 이름, 객체 ID와 좌표를 확인하는 예제입니다.

## 다루는 기능

- 모델 레이어별 조회 대상과 선택 방식을 바꾸고, 선택 결과를 지도 오버레이와 상태 패널에서 확인합니다.

## 사전 조건

- 예제 데이터 서버에 접근할 수 있는 네트워크 환경이 필요합니다.
- 초기 지도에는 위성영상과 한반도 지형, U3F 모델과 WFS 모델이 차례로 준비됩니다.

## 주요 기능

- U3F 모델과 WFS 모델을 조회 대상으로 선택합니다.
- 점, 영역, 선, 원, 사각형 방식으로 객체를 선택합니다.
- 선택 강조를 외곽선과 색상 중에서 고르고, 선택 영역과 선택 객체의 색상·투명도를 변경합니다.
- 외곽선 강조에서도 같은 색상 입력으로 외곽선 색을 바꿉니다.
- 마지막 선택 영역을 다시 그리거나 선택 결과를 초기화합니다.
- 선택한 객체의 정보를 지도 오버레이와 설정 패널에서 확인합니다.

## 조작 및 예상 결과

| 조작                                  | 예상 결과 |
|-------------------------------------| --- |
| 오른쪽 `정보조회` 버튼을 누릅니다.             | 조회 설정 패널이 열리고 현재 표시 중인 모델을 확인할 수 있습니다. |
| 조회 모델과 점·영역·선·원·사각형 중 선택 방식을 지정합니다. | 다음 지도 입력에 사용할 조회 조건이 변경됩니다. |
| `선택 표현`에서 강조 방식을 `외곽선`과 `색상` 중에서 바꿉니다. | 이미 선택한 표현이 정리되고, 다음 선택부터 고른 방식으로 강조됩니다. 외곽선을 고르면 색상 입력이 `외곽선 색상`으로 바뀌어 그대로 사용할 수 있고, 외곽선에 적용되지 않는 투명도만 비활성으로 표시됩니다. |
| 지도에서 객체 또는 영역을 선택합니다.               | 선택 표현이 갱신되고 레이어, 객체 ID와 좌표가 오버레이와 결과 영역에 표시됩니다. |
| `초기화`를 누릅니다.                        | 선택 표현과 조회 결과가 제거됩니다. |

## 관련 API

- `U3dSelect`: 지정한 방식으로 지도 객체를 선택합니다. 생성자 `selectType` 기본값은 `outline`이라 별도 설정이 없으면 외곽선으로 강조할 수 있습니다.
- `U3dSelect.setSelectType()`: 실행 중에 외곽선 강조와 색상 강조를 전환합니다.
- `U3dSelect.setSelectedColor()`: 선택 객체의 강조 색을 바꿉니다. 색은 두 강조 방식에 모두 적용되지만, 투명도는 색상 강조에서만 반영됩니다.
- `U3dOverlay`: 선택한 객체의 월드 좌표에 정보 패널을 표시합니다.
- `U3dModelWFSLayer`, `create3DFModelLayer`: 예제에서 조회할 WFS·U3F 모델 레이어를 구성합니다.

## 객체 선택 생성

`U3dSelect` 인스턴스를 생성하고 앱의 선택 기능으로 등록합니다.

{{example-code:select.create}}

## 선택 강조 방식 변경

외곽선 강조와 색상 강조를 전환합니다. 이미 표시 중인 강조를 정리한 뒤 방식을 바꾸므로 다음 선택부터 새 방식이 적용됩니다.

{{example-code:select.type}}

## 선택 방식 변경

선택 결과와 도형을 정리한 뒤 현재 UI에서 선택한 방식으로 다시 활성화합니다.

{{example-code:select.mode}}
