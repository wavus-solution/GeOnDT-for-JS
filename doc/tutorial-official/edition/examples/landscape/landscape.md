---
title: "경관 분석"
theme: pastel-glass-map
output: landscape.html
editor: true
category: analysis
summary: "마우스 클릭을 통해 경관분석 지점을 선택하면 해당 지점을 기준으로 주위 경관을 분석하는 예제입니다. 인간의 시야로 본 경관을 분석하는 것이 목적이며, 분석 종료시 이전 위치로 이동합니다."
tags: []
apis:
  - "activeAnalysis"
  - "addLayer"
  - "create3DFModelLayer"
  - "createGroupLayer"
  - "createloadingBar"
  - "deactiveAllAnalysis"
  - "endloadingBar"
  - "getCameraState"
  - "getGoogleRectangleDefine"
  - "on"
  - "setGeoCenterToOverviewMap"
  - "setHomePosition"
  - "setNameBaseLayer"
  - "setPanMode"
  - "setRotationOverviewMap"
  - "showLayer"
  - "U3dAPP"
  - "U3dHeightXYZLayer"
  - "U3dImageXYZLayer"
  - "updateHomePosition"
runtime:
  home: {longitude: 126.9395, latitude: 37.52, height: 450, duration: 2, pitch: 60}
  baseLayers: [satellite]
  terrain: { enabled: true, preset: korea}
  modelLayers:
    - preset: seoul_u3f
      visible: true
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
sources:
  - {id: main, path: ./landscape.main.js, language: javascript, editable: true}
  - {id: ui, path: ./landscape.ui.js, language: javascript, editable: true}
  - {id: html, path: ./landscape.html, language: html, editable: true}
  - {id: css, path: ./landscape.css, language: css, editable: true}
imports: []
featured: false
migrationSource: landscape.html
migrationFingerprint: 9c69ec9f3d7645637a1fba46e08505c788e860eecb4a60c8524e80d4b3695ccb
dependencies: []
---

# 경관 분석

마우스 클릭을 통해 경관분석 지점을 선택하면 해당 지점을 기준으로 **주위 경관을 분석**하는 예제입니다.  
인간의 시야로 본 경관을 분석하는 것이 목적이며, 분석 종료시 이전 위치로 이동합니다.

## 조작 안내

**임시 일인칭 전환:** `Shift`를 누른 채 마우스를 드래그하면 일인칭으로 이동·회전할 수 있습니다.

| 조작 | 동작 |
| --- | --- |
| Shift + 마우스 왼쪽 버튼 드래그 | 바라보는 방향을 기준으로 이동합니다. |
| Shift + 마우스 오른쪽 버튼 드래그 | 현재 위치에서 시선을 회전합니다. |
| Shift 놓기 | 임시 일인칭 전환을 해제하고 기존 조작으로 돌아갑니다. |
