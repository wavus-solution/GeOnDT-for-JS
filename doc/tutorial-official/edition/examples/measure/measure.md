---
title: 거리 / 면적 / 고도 측정
theme: pastel-glass-map
output: measure.html
editor: true
category: analysis
summary: 지도를 클릭해 거리·면적·고도를 재고, 위경도 좌표를 직접 넣어 같은 측정을 수행합니다.
tags: [측정, 거리, 면적, 고도, 분석 모듈]
apis:
  - UAnalyDistance
  - UAnalyArea
  - UAnalyHeight
runtime:
  home: {longitude: 126.9395, latitude: 37.52, height: 450, duration: 2, pitch: 60}
  baseLayers: [satellite]
  terrain: {enabled: true, preset: korea, options: {maxLevel: 17}}
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
verification:
  scenarios:
    # Viewer는 예제 Rail의 첫 패널을 초기 화면에서 자동으로 엽니다.
    - id: initial-measure-panel
      states:
        canvas:
          type: element
          selector: "#map canvas"
          properties: [exists, visible]
        panel:
          type: element
          selector: "#measure-panel"
          properties: [exists, visible]
        hint:
          type: element
          selector: "#measure-mode-hint"
          properties: [exists, text]
      expect:
        canvas: {exists: true, visible: true}
        panel: {exists: true, visible: true}
        hint: {exists: true, text: "지도를 자유롭게 이동합니다. 측정 기능은 꺼져 있습니다."}
    - id: select-area-mode
      actions:
        - type: check
          selector: "input[name='measure-mode'][value='Area']"
      states:
        areaMode:
          type: element
          selector: "input[name='measure-mode'][value='Area']"
          properties: [exists, checked]
        hint:
          type: element
          selector: "#measure-mode-hint"
          properties: [exists, text]
      expect:
        areaMode: {exists: true, checked: true}
        hint: {exists: true, text: "지도를 세 번 이상 클릭한 뒤 더블클릭하면 둘러싼 면적이 표시됩니다."}
    - id: measure-by-coordinate
      actions:
        - type: click
          selector: "#measure-coord-submit"
      states:
        status:
          type: element
          selector: "#measure-result-status"
          properties: [exists, text]
        segments:
          type: element
          selector: "#measure-segment-list li"
          properties: [exists, count]
        total:
          type: element
          selector: "#measure-total"
          properties: [exists, visible]
      expect:
        status: {exists: true, text: "구간 2개"}
        segments: {exists: true, count: 2}
        total: {exists: true, visible: true}
    - id: clear-measurement
      actions:
        - type: click
          selector: "#measure-coord-submit"
        - type: click
          selector: "#measure-clear"
      states:
        status:
          type: element
          selector: "#measure-result-status"
          properties: [exists, text]
        segmentList:
          type: element
          selector: "#measure-segment-list"
          properties: [exists, visible]
        defaultMode:
          type: element
          selector: "input[name='measure-mode'][value='pan']"
          properties: [exists, checked]
      expect:
        status: {exists: true, text: "측정 대기"}
        segmentList: {exists: true, visible: false}
        defaultMode: {exists: true, checked: true}
sources:
  - {id: main, path: ./measure.main.js, language: javascript, editable: true}
  - {id: ui, path: ./measure.ui.js, language: javascript, editable: true}
  - {id: api, label: API Help, path: ./measure.api.js, language: javascript, editable: true}
  - {id: html, path: ./measure.html, language: html, editable: true}
  - {id: css, path: ./measure.css, language: css, editable: true}
imports: []
migrationSource: measure.html
migrationFingerprint: 626c7e3fa317c1819b31935a02dcdfc74edaeb9eaf151bef0c4353a2e69bfcdf
dependencies: []
---

# 거리 / 면적 / 고도 측정

지도를 클릭해 거리와 면적을 재고, 지형·건물 위 지점의 고도를 확인하는 예제입니다.
같은 측정을 위경도 좌표 배열로도 수행해, 화면 조작 없이 값만 얻는 방법을 함께 확인합니다.

## 다루는 기능

- `U3dAPP.activeAnalysis()`와 `deactiveAllAnalysis()`로 거리·면적·고도 측정 모듈을 한 번에 하나만 켭니다.
- `UAnalyDistance.drawDistance()`와 `UAnalyArea.drawArea()`로 위경도 좌표 배열을 그대로 그려 측정합니다.
- `UAnalyDistance.getDistanceFromCoordinate()`로 두 좌표 사이 거리(m)를 화면에 그리지 않고 값으로 얻습니다.
- `U3dAPP.clearAllAnalysis()`로 화면에 남은 측정 결과를 지웁니다.
- `U3dAPP.createModelGroupLayer()`와 `create3DFModelLayer()`로 U3F 건물 모델을 올려 건물 높이를 측정합니다.

## 사전 조건

- 배경지도(VWorld 위성영상)와 한반도 지형 데이터를 내려받을 수 있는 네트워크 환경이 필요합니다.
- 초기 지도는 여의도(경도 126.9395, 위도 37.52) 상공입니다.
- 거리·면적·고도 분석 모듈은 `U3dAPP`가 기본으로 등록하므로 따로 만들지 않고 이름(`Distance`, `Area`, `Height`)으로 활성화합니다.
- U3F 건물 모델은 배포 환경이 제공하는 인증값(`trdDimAPIKey`)이 있어야 목록을 조회할 수 있습니다. 인증값이 없으면 건물 모델 배지에 `불러오기 실패`가 표시되고 체크가 해제되며, 지형 고도 측정만 동작합니다.
- 건물 모델은 레벨 17부터 표시됩니다. 그보다 넓게 축소한 상태에서는 건물 높이를 잴 수 없습니다.
- 좌표 입력 측정은 `{"coord": [{"x": 경도, "y": 위도, "z": 높이}, ...]}` 형식만 받습니다. `z`를 적지 않으면 0으로 봅니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 왼쪽 `측정` 버튼을 누릅니다. | 측정 모드, 건물 모델, 좌표 입력 측정, 측정 결과 구획이 있는 패널이 열립니다. |
| 측정 모드를 고릅니다. | 구획 아래 안내가 그 모드의 지도 조작 방법으로 바뀌고, 이전 모드의 클릭 처리는 해제됩니다. |
| `거리`를 고르고 지도를 두 번 이상 클릭합니다. | 클릭할 때마다 구간 거리 라벨이 지도에 표시되고, 더블클릭하면 한 측정이 끝납니다. |
| `면적`을 고르고 지도를 세 번 이상 클릭한 뒤 더블클릭합니다. | 클릭한 점들이 둘러싼 면적(㎡)이 지도에 표시됩니다. |
| `고도`를 고르고 지형을 클릭합니다. | 클릭 지점의 고도가 지도에 표시됩니다. |
| `고도`를 고르고 건물을 클릭합니다. | 건물 높이가 함께 표시됩니다. U3F 모델이 아직 올라오지 않았으면 지형 고도만 표시됩니다. |
| `U3F 모델` 체크를 끕니다. | 건물 모델이 숨겨지고 배지가 `숨김`으로 바뀝니다. 다시 켜면 `표시 중`이 됩니다. |
| 좌표 입력 측정에서 `거리`를 고르고 `입력 좌표로 측정하기`를 누릅니다. | 입력 좌표를 잇는 선이 지도에 그려지고, 측정 결과에 구간별 거리와 합계가 표시됩니다. |
| 좌표 입력 측정에서 `면적`을 고르고 같은 버튼을 누릅니다. | 입력 좌표가 둘러싼 면적이 지도에 그려지고, 측정 결과에는 점 개수 안내가 표시됩니다. 면적 값은 지도 라벨에서 확인합니다. |
| 좌표를 두 개만 남기고 `면적`으로 측정합니다. | 측정 결과에 좌표가 세 개 이상 필요하다는 안내가 표시되고 아무것도 그려지지 않습니다. |
| 좌표 형식을 틀리게 입력하고 측정합니다. | 측정 결과에 실패 원인이 표시됩니다. |
| `측정 초기화`를 누릅니다. | 지도에 그린 측정 결과가 모두 사라지고, 측정 모드가 `기본`으로, 결과 구획이 처음 상태로 돌아갑니다. |

## 관련 API

- `U3dAPP.activeAnalysis(name)`: 이름으로 분석 모듈을 켭니다. `Area`, `Distance`, `Height`는 `U3dAPP` 생성 시 기본 등록되므로 따로 `addAnalysis()`를 부르지 않아도 됩니다.
- `U3dAPP.deactiveAllAnalysis()`: 모든 분석 모듈을 끕니다. 모듈마다 클릭·더블클릭 처리를 따로 등록하므로, 새 모드를 켜기 전에 이 함수로 이전 모드를 반드시 정리합니다.
- `U3dAPP.clearAllAnalysis()`: 화면에 그려 둔 측정 결과를 지웁니다. 비활성화만으로는 이미 그린 선·면·라벨이 남습니다.
- `UAnalyDistance.drawDistance(coordList)`: 위경도 좌표 배열을 이어 그리고 구간 거리를 지도에 표시합니다.
- `UAnalyDistance.getDistanceFromCoordinate(point1, point2)`: 두 좌표 사이 거리(m)를 반환합니다. 화면에는 아무것도 그리지 않으므로 값만 필요할 때 사용하며, 좌표가 유효하지 않으면 `undefined`가 나올 수 있습니다.
- `UAnalyArea.drawArea(coordList)`: 위경도 좌표 배열이 둘러싼 면적을 그리고 측정값을 지도에 표시합니다. 거리와 달리 값을 반환하는 함수가 없어 결과는 지도 라벨로 확인합니다.

`Height` 모드가 재는 것은 클릭 지점의 고도입니다. 건물 높이는 클릭 지점에 U3F 모델이 실제로 올라와 있을 때만 함께 나오므로, 모델 표시 레벨(17) 아래로 축소한 상태에서는 지형 고도만 표시됩니다.

## 측정 모드 전환

한 번에 하나의 분석 모듈만 켜야 클릭 이벤트가 겹치지 않습니다. 고른 모드를 켜기 전에 항상 전체를 끕니다.

{{example-code:measure.mode}}

## 좌표 입력 측정

클릭 대신 좌표 배열을 넘겨 같은 측정을 수행합니다. 종류에 따라 호출하는 함수가 다릅니다.

{{example-code:measure.coordinate}}

## 구간 거리 값 얻기

화면에 그리지 않고 두 좌표 사이 거리만 필요하면 `getDistanceFromCoordinate()`를 사용합니다.

{{example-code:measure.distance-value}}

## 측정 결과 지우기

비활성화와 결과 삭제는 서로 다른 동작이라 둘 다 호출합니다.

{{example-code:measure.clear}}

## API Help

패널의 각 조작에는 실제 구현 위치와 현재 설정으로 만든 코드가 함께 붙어 있습니다. 측정 모드나 좌표 측정 종류를 바꾼 뒤 같은 항목을 다시 열면 지금 값이 반영된 코드가 나옵니다. 도움말을 꺼도 예제 기능은 그대로 동작합니다.
