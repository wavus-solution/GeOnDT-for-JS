---
title: "KML 레이어"
theme: pastel-glass-map
output: kmlModelLayer.html
editor: true
category: model
summary: "기존 GeOnDT 기능과 API 동작을 확인하는 예제입니다."
tags: []
apis:
  - "addLayer"
  - "createHeightXYZLayer"
  - "createloadingBar"
  - "endloadingBar"
  - "fitLayerExtent"
  - "loadingBar"
  - "setHomePosition"
  - "setNameBaseLayer"
  - "showLayer"
  - "U3dAPP"
  - "U3dImageXYZLayer"
  - "U3dModelKmlLayer"
  - "updateHomePosition"
runtime:
  home: {longitude: 126.9395, latitude: 37.52, height: 450, duration: 2, pitch: 60}
  baseLayers: []
  terrain: {enabled: false}
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
sources:
  - {id: main, path: ./kmlModelLayer.main.js, language: javascript, editable: true}
  - {id: ui, path: ./kmlModelLayer.ui.js, language: javascript, editable: true}
  - {id: html, path: ./kmlModelLayer.html, language: html, editable: true}
  - {id: css, path: ./kmlModelLayer.css, language: css, editable: true}
imports: []
featured: false
migrationSource: kmlModelLayer.html
migrationFingerprint: 11b05141adce5904cac78c81e031b3873350ef67cbc32053476a2791a1ad3359
dependencies: []
---

# KML 레이어

기존 예제의 목적과 사용 방법을 작성합니다.
