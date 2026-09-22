---
title: "열원 객체 연결"
theme: pastel-glass-map
output: heatGeometry.html
editor: true
category: analysis
summary: "지도에 열원을 추가하고 다양한 Geometry·건물 컴포넌트를 연결해 온도 셰이더를 적용하고 설정하는 예제입니다."
tags:
  - 열원
  - Geometry
  - 셰이더
apis:
  - U3dAPP
  - U3dVectorLayer
  - U3dHeatGeometry
  - U3dHeatGeometry.setTargets
  - U3dHeatGeometry.removeTargets
  - U3dHeatGeometry.setTemperature
  - U3dHeatGeometry.setBuffer
  - U3dHeatGeometry.setOuterFactor
  - U3dBox
  - U3dUserGeometry
  - U3dPolygonLoftGeometry
  - U3dLine
  - UAnalyGizmoModel
  - createMultipleComponentLayer
  - U3dMultipleComponentLayer.setInstanced
runtime:
  home:
    longitude: 126.9395
    latitude: 37.52
    height: 260
    duration: 2
    pitch: 55
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
        panel:
          type: element
          selector: "#heatGeometry-option-panel"
          properties: [exists, visible]
        list:
          type: element
          selector: "[data-heat-list]"
          properties: [exists, visible]
        message:
          type: element
          selector: "[data-heat-message]"
          properties: [exists, visible, text]
      expect:
        panel: {exists: true, visible: true}
        list: {exists: true, visible: true}
        message: {exists: true, visible: true, text: "열원 추가 버튼을 누른 뒤 지도에서 위치를 선택하세요."}
    - id: toggle-panel
      actions:
        - type: click
          selector: "[data-panel-target='heatGeometry-option-panel']"
      states:
        panel:
          type: element
          selector: "#heatGeometry-option-panel"
          properties: [exists, visible]
      expect:
        panel: {exists: true, visible: false}
sources:
  - id: main
    path: ./heatGeometry.main.js
    language: javascript
    editable: true
  - id: ui
    path: ./heatGeometry.ui.js
    language: javascript
    editable: true
  - id: html
    path: ./heatGeometry.html
    language: html
    editable: true
  - id: css
    path: ./heatGeometry.css
    language: css
    editable: true
---

# 열원 객체 연결

지도 위에 열원을 만들고 `U3dBox`, `U3dUserGeometry`, `U3dPolygonLoftGeometry`, 건물 컴포넌트 같은 대상에 연결합니다. 연결된 객체 표면에는 열원 위치·온도·범위에 따른 열 분포 셰이더가 표시됩니다.

## 다루는 기능

- `열원 추가` 버튼을 누른 뒤 한 번 클릭한 지도 위치에 `U3dHeatGeometry`를 생성하고, 생성된 열원을 즉시 선택해 설정 창과 이동 기즈모를 표시한 뒤 추가 모드를 자동으로 종료합니다.
- 설정 창의 `대상 선택` 버튼을 누른 뒤 대상 하나를 클릭해 `setTargets`로 연결하고 `U3dLine`으로 연결 관계를 표시합니다.
- 열원 또는 목록 항목을 선택해 온도, 기본 범위, 감쇠 범위 배율을 변경합니다.
- 열원 구체나 목록 항목을 선택하면 `UAnalyGizmoModel` 이동 기즈모가 자동으로 활성화되며, 이동 중 연결선과 열 분포 위치도 함께 갱신됩니다.
- 설정 창에서 연결된 대상 이름을 확인하고 개별 연결 해제 또는 열원 제거를 수행합니다.

## 사전 조건

- 배경지도와 지형을 내려받을 수 있는 네트워크가 필요합니다.
- `building3`, `building9`, `building7`, `building8`은 `https://3d-dev.geon.kr/data/component/`의 3DS 파일을 사용합니다. 외부 모델 로딩에 실패해도 기본 Geometry 네 종류는 계속 사용할 수 있습니다.
- `building3`, `building9`는 일반 컴포넌트로, `building7`, `building8`은 인스턴스 컴포넌트로 생성됩니다. 각 컴포넌트의 z값은 해당 위치의 지형고도에 높이 오프셋을 더해 계산합니다.
- 열원은 객체와 연결된 뒤 활성화됩니다. 연결 전에는 주황색 열원 구체만 표시됩니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| `열원 추가`를 누르고 지도를 한 번 클릭합니다. | 클릭 위치에 주황색 열원이 하나 생성·선택되고 설정 창과 이동 기즈모가 표시된 뒤 추가 모드가 종료됩니다. 다시 클릭해도 열원이 추가되지 않습니다. |
| 설정 창에서 `대상 선택`을 누르고 박스, 사용자 다각형, 로프트, 원기둥 또는 건물 컴포넌트를 클릭합니다. | 열원과 대상 사이에 노란 선이 생기고 대상 표면에 열 분포가 표시된 뒤 선택 모드가 종료됩니다. |
| 열원 또는 대상을 하나 더 추가합니다. | 해당 버튼을 다시 누르고 지도에서 한 번 선택해야 합니다. |
| 열원 구체 또는 목록 항목을 클릭합니다. | 해당 열원의 설정 창이 열리고 온도·범위와 연결 대상 목록이 표시됩니다. |
| 활성화된 이동 기즈모를 드래그합니다. | 열원과 연결선 시작점이 함께 이동하고 대상 표면의 열 분포 위치가 실시간으로 바뀝니다. |
| 설정 값을 바꾸고 `설정 적용`을 누릅니다. | 셰이더의 온도 색상과 영향 범위가 새 값으로 갱신됩니다. |
| 연결 대상 옆 `해제`를 누릅니다. | 해당 대상의 열원 연결과 연결선이 제거됩니다. |
| `이 열원 제거`를 누릅니다. | 열원, 모든 연결선, 대상에 적용된 해당 열 영향이 함께 제거됩니다. |

## 관련 API

- `U3dHeatGeometry`: 온도, 기본 범위, 감쇠 배율을 가진 열원을 생성합니다.
- `setTargets` / `removeTargets`: Object3D 또는 컴포넌트를 열 영향 대상으로 연결하거나 해제합니다.
- `U3dMultipleComponentLayer.setInstanced`: `addPosition` 호출 전에 일반/인스턴스 컴포넌트 생성 방식을 전환합니다.
- `setTemperature`, `setBuffer`, `setOuterFactor`: 설정 창 값을 열원과 셰이더에 반영합니다.
- `U3dLine`: 열원과 대상의 연결 관계를 지도 위에 표시합니다.
- `UAnalyGizmoModel`: 선택한 열원에 이동 기즈모를 자동으로 연결합니다.
- `U3dVectorLayer`: 초기 Geometry, 열원, 연결선을 역할별 레이어로 관리합니다.
