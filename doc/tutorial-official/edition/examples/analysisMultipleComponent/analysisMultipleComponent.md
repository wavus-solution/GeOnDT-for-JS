---
title: "다중 시설물 레이어 편집"
theme: pastel-glass-map
output: analysisMultipleComponent.html
editor: true
category: analysis
summary: "사용자가 원하는 시설물을 등록하여 레이어 위에 시설물을 추가하고 편집하는 예제입니다. 단일 컴포넌트 레이어와 달리 한 컴포넌트 레이어에 여러 모델이 동시에 올라갈 수 있습니다. 그밖에도 단일 컴포넌트 레이어에는..."
tags: []
apis:
  - "create3DFModelLayer"
  - "createloadingBar"
  - "createMultipleComponentLayer"
  - "createPromise"
  - "drawFast"
  - "endloadingBar"
  - "flyToPosition"
  - "getAnalysis"
  - "getCameraState"
  - "getGoogleRectangleDefine"
  - "getLayerList"
  - "loadingBar"
  - "on"
  - "setGeoCenterToOverviewMap"
  - "setHomePosition"
  - "setNameBaseLayer"
  - "setRotationOverviewMap"
  - "showLayer"
  - "U3dAPP"
  - "updateData"
  - "updateHomePosition"
runtime:
  home: {longitude: 126.9395, latitude: 37.52, height: 450, duration: 2, pitch: 60}
  baseLayers: [satellite]
  terrain: {enabled: true, preset: korea}
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
sources:
  - {id: main, path: ./analysisMultipleComponent.main.js, language: javascript, editable: true}
  - {id: ui, path: ./analysisMultipleComponent.ui.js, language: javascript, editable: true}
  - {id: html, path: ./analysisMultipleComponent.html, language: html, editable: true}
  - {id: css, path: ./analysisMultipleComponent.css, language: css, editable: true}
  - {id: sampleLoadData, path: ./sampleLoadData.js, language: javascript, editable: true}
imports:
  - "sampleLoadData"
featured: false
migrationSource: analysisMultipleComponent.html
migrationFingerprint: 56b58c3dd3fc6bdfc5cee0bb9db5056bf3711a7474e19b9374891d5717d5212d
dependencies: []
---

# 다중 시설물 레이어 편집

사용자가 원하는 시설물을 등록하여 레이어 위에 **시설물을 추가하고 편집**하는 예제입니다.  
단일 컴포넌트 레이어와 달리 한 컴포넌트 레이어에 여러 모델이 동시에 올라갈 수 있습니다.  
그밖에도 단일 컴포넌트 레이어에는 없는 거리에따른 시설물 동적 로딩 기능이 추가되어 있습니다.
