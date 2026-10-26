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
  - U3dHeatGeometry.setAvailable
  - U3dGeometry.setPosition
  - U3dBox
  - U3dUserGeometry
  - U3dPolygonLoftGeometry
  - U3dLine
  - UAnalyGizmoModel
  - createMultipleComponentLayer
  - U3dMultipleComponentLayer.setInstanced
  - U3dComponentPosition.setModelOffset
runtime:
  home:
    longitude: 126.9395
    latitude: 37.52
    height: 420
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
- 열원 또는 목록 항목을 선택해 온도, 기본 반경, 감쇠 배율을 슬라이더로 즉시 변경합니다. 최대 영향 반경(기본 반경 × 감쇠 배율)과 0~120°C 온도 범례를 함께 표시합니다. 위치와 높이는 이동 기즈모로 조절합니다.
- `열원 적용`을 끄거나 켜서 해당 열원의 영향과 원래 표면을 비교합니다. 적용을 꺼도 설정값과 대상 연결은 유지됩니다.
- 열 분포는 거리 영향도와 팔레트 투명도에 따라 원래 표면색과 반투명하게 합성합니다. 반경 밖에서는 원래 표면을 유지합니다.
- 같은 대상에 여러 열원을 연결하면 각 열원의 거리 감쇠를 계산한 뒤 가장 높은 온도를 표시합니다. 연결 순서에 영향을 받지 않으며 온도를 더하지 않습니다.
- 열원 구체나 목록 항목을 선택하면 `UAnalyGizmoModel` 이동 기즈모가 자동으로 활성화되며, 이동 중 연결선과 열 분포 위치도 함께 갱신됩니다.
- `지도에서 열원 이동`을 누르고 새 위치를 클릭하면 지면 기준 높이를 유지하며 이동합니다. `조작 종료 · Esc` 또는 Esc 키로 위치·대상 선택과 기즈모 편집을 종료합니다.
- 설정 창에서 연결된 대상 이름을 확인하고 개별 연결 해제 또는 열원 제거를 수행합니다.

## 사전 조건

- 배경지도와 지형을 내려받을 수 있는 네트워크가 필요합니다.
- `building3`, `building7`은 `https://3d-dev.geon.kr/data/component/`의 3DS 파일을 사용합니다. 외부 모델 로딩에 실패해도 기본 Geometry 네 종류는 계속 사용할 수 있습니다.
- 왼쪽의 `building3`은 일반 컴포넌트로 한 개, 오른쪽의 `building7`은 인스턴스 컴포넌트로 한 개 생성됩니다. 각 컴포넌트의 z값은 해당 위치의 지형고도에 높이 오프셋을 더해 계산합니다.
- 모델의 내부 좌표가 배치 원점에서 떨어져 있어도 지정한 위치에 표시되도록 `setModelOffset`으로 모델의 수평 중심과 바닥을 보정합니다. 초기 카메라는 두 건물이 설정 패널 밖에 보이도록 배치합니다.
- 열원은 온도 90°C, 기본 반경 30m, 감쇠 배율 3배로 생성됩니다. `열원 적용`은 기본으로 켜져 있으며 연결된 대상이 영향 반경 안에 있을 때 표면에 열 분포가 표시됩니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| `열원 추가`를 누르고 지도를 한 번 클릭합니다. | 클릭 위치에 주황색 열원이 하나 생성·선택되고 설정 창과 이동 기즈모가 표시된 뒤 추가 모드가 종료됩니다. 다시 클릭해도 열원이 추가되지 않습니다. |
| 설정 창에서 `대상 선택`을 누르고 박스, 사용자 다각형, 로프트, 원기둥 또는 건물 컴포넌트를 클릭합니다. | 열원과 대상 사이에 노란 선이 생기고 대상 표면에 열 분포가 표시된 뒤 선택 모드가 종료됩니다. |
| 열원 또는 대상을 하나 더 추가합니다. | 해당 버튼을 다시 누르고 지도에서 한 번 선택해야 합니다. |
| 열원 구체 또는 목록 항목을 클릭합니다. | 해당 열원의 설정 창이 열리고 온도·범위와 연결 대상 목록이 표시됩니다. |
| 활성화된 이동 기즈모를 드래그합니다. | 열원과 연결선 시작점이 함께 이동하고 대상 표면의 열 분포 위치가 실시간으로 바뀝니다. |
| 온도·기본 반경·감쇠 배율 슬라이더를 움직입니다. | 별도 적용 버튼 없이 열 분포가 즉시 바뀌고 최대 영향 반경이 갱신됩니다. |
| `열원 적용`을 끄고 설정을 바꾸거나 대상을 추가합니다. | 해당 열원의 영향은 꺼진 상태를 유지하며, 다시 켜면 보관된 값과 대상에 적용됩니다. |
| 온도가 다른 열원 두 개를 같은 대상에 연결해 겹칩니다. | 각 표면 위치에서 거리 감쇠 후 온도가 더 높은 열원의 색상이 표시됩니다. |
| 겹친 열원 중 하나를 끄거나 제거합니다. | 나머지 열원의 분포는 유지되고, 모든 영향이 사라진 표면은 원래 색으로 돌아옵니다. |
| `지도에서 열원 이동`을 누른 뒤 새 위치를 클릭합니다. | 지면 기준 높이를 유지하며 새 지형 위치로 이동합니다. |
| `조작 종료 · Esc`를 누르거나 Esc 키를 누릅니다. | 위치·대상 선택 또는 기즈모 편집이 종료되고 상세 설정 창은 유지됩니다. |
| 연결 대상 옆 `해제`를 누릅니다. | 해당 대상의 열원 연결과 연결선이 제거됩니다. |
| `이 열원 제거`를 누릅니다. | 열원, 모든 연결선, 대상에 적용된 해당 열 영향이 함께 제거됩니다. |

## 관련 API

- `U3dHeatGeometry`: 온도, 기본 범위, 감쇠 배율을 가진 열원을 생성합니다.
- `setTargets` / `removeTargets`: Object3D 또는 컴포넌트를 열 영향 대상으로 연결하거나 해제합니다.
- `U3dMultipleComponentLayer.setInstanced`: `addPosition` 호출 전에 일반/인스턴스 컴포넌트 생성 방식을 전환합니다.
- `U3dComponentPosition.setModelOffset`: 모델 내부 원점을 보정하여 일반·인스턴스 건물의 형상과 선택 경계를 배치 위치에 맞춥니다.
- `setTemperature`, `setBuffer`, `setOuterFactor`: 설정 창 값을 열원과 셰이더에 반영합니다.
- `setAvailable`: 대상 연결과 설정을 유지하면서 해당 열원의 적용 여부를 전환합니다.
- `setPosition`: 열원을 지정한 위경도에 배치합니다.
- `U3dLine`: 열원과 대상의 연결 관계를 지도 위에 표시합니다.
- `UAnalyGizmoModel`: 선택한 열원에 이동 기즈모를 자동으로 연결합니다.
- `U3dVectorLayer`: 초기 Geometry, 열원, 연결선을 역할별 레이어로 관리합니다.
