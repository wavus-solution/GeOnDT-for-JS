---
title: "객체 알람 설정"
theme: pastel-glass-map
output: analysisAlarm.html
editor: true
category: analysis
summary: "마우스 클릭을 통해 특정 객체에 대한 알람을 설정하는 예제입니다. 단일 및 다중 객체를 선택하거나 클릭 지점에 POI를 생성하여 알람 기능을 줄 수 있습니다. 추가적으로 알람 횟수, 속도, 유형을 편집할 수 있는 기능을 제공합니다."
tags: []
apis:
  - "addLayer"
  - "clearAllAnalysis"
  - "create3DFModelLayer"
  - "createloadingBar"
  - "createModelGroupLayer"
  - "endloadingBar"
  - "getAnalysis"
  - "getCameraState"
  - "getGoogleRectangleDefine"
  - "off"
  - "on"
  - "setGeoCenterToOverviewMap"
  - "setHomePosition"
  - "setNameBaseLayer"
  - "setRotationOverviewMap"
  - "showLayer"
  - "U3dAPP"
  - "U3dHeightXYZLayer"
  - "U3dImageXYZLayer"
  - "updateHomePosition"
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
    - id: initial-map
      states:
        canvas: {type: element, selector: "#map canvas", properties: [exists, visible]}
        rail: {type: element, selector: "[data-legacy-toggle-state]", properties: [exists, visible]}
        panel: {type: element, selector: "#analy-popup", properties: [exists, visible]}
      expect:
        canvas: {exists: true, visible: true}
        rail: {exists: true, visible: true}
        panel: {exists: true, visible: true}
sources:
  - {id: main, path: ./analysisAlarm.main.js, language: javascript, editable: true}
  - {id: ui, path: ./analysisAlarm.ui.js, language: javascript, editable: true}
  - {id: html, path: ./analysisAlarm.html, language: html, editable: true}
  - {id: css, path: ./analysisAlarm.css, language: css, editable: true}
imports: []
migrationSource: analysisAlarm.html
dependencies: []
---

# 객체 알람 설정

마우스 클릭을 통해 특정 **객체에 대한 알람을 설정**하는 예제입니다.  
단일 및 다중 객체를 선택하거나 클릭 지점에 POI를 생성하여 알람 기능을 줄 수 있습니다. 추가적으로 알람 횟수, 속도, 유형을 편집할 수 있는 기능을 제공합니다.

## 다루는 기능

- `getAnalysis('Alarm')`로 얻은 알람 기능에 지도에서 선택한 객체와 클릭 지점 POI를 대상으로 등록하고, 알람 횟수·속도·유형을 바꿔 지도 표현이 달라지는 것을 확인합니다.

## 사전 조건

- 예제 데이터 서버에서 U3F 모델과 그룹 모델 레이어를 내려받을 수 있어야 합니다. 모델이 보이지 않으면 알람을 걸 대상도 선택할 수 없습니다.
- 이 예제는 공통 배경지도와 지형을 사용하지 않습니다. 초기 화면은 모델만 표시된 상태로 시작합니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 왼쪽 `분석` 버튼을 누릅니다. | 알람 편집 패널이 열리고 현재 등록된 알람 목록을 확인할 수 있습니다. |
| 지도에서 객체를 선택하거나 빈 지점을 클릭해 POI를 만듭니다. | 선택한 대상이 알람 목록에 추가됩니다. |
| 알람 횟수·속도·유형을 바꾼 뒤 적용합니다. | 해당 대상의 알람 표현이 변경한 설정대로 다시 재생됩니다. |
| `전체알람정지`를 누릅니다. | 재생 중인 알람이 모두 멈춥니다. |
| `선택알람`이나 `전체삭제`로 알람을 지웁니다. | 선택한 알람 또는 전체 알람이 목록과 지도에서 제거됩니다. |
| `초기화`를 누릅니다. | 등록한 알람과 선택 상태가 모두 정리됩니다. |

## 관련 API

- `getAnalysis`: `'Alarm'` 분석 기능을 얻어 객체와 POI에 알람을 등록하고 해제합니다.
- `create3DFModelLayer`, `createModelGroupLayer`: 알람 대상이 되는 U3F 모델과 그룹 모델 레이어를 만듭니다.
- `clearAllAnalysis`: 등록한 분석 상태를 한 번에 정리합니다.
- `on`, `off`: 지도 클릭과 선택 이벤트를 연결하고 예제 종료 시 해제합니다.
