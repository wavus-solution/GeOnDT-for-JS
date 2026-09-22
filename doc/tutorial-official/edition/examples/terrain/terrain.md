---
title: "지형 레이어"
theme: pastel-glass-map
output: terrain.html
editor: true
category: model
summary: "이미지 지도 위에 전국 지형을 나타내는 레이어를 출력하는 예제입니다."
tags: []
apis:
  - "addLayer"
  - "createloadingBar"
  - "createLoadingCanvas"
  - "createPromise"
  - "endloadingBar"
  - "getCameraState"
  - "getGoogleRectangleDefine"
  - "loadingBar"
  - "on"
  - "setCameraGeographicPosition"
  - "setGeoCenterToOverviewMap"
  - "setHomePosition"
  - "setNameBaseLayer"
  - "setRotationOverviewMap"
  - "showLayer"
  - "U3dAPP"
  - "U3dHeightXYZLayer"
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
  - {id: main, path: ./terrain.main.js, language: javascript, editable: true}
  - {id: ui, path: ./terrain.ui.js, language: javascript, editable: true}
  - {id: html, path: ./terrain.html, language: html, editable: true}
  - {id: css, path: ./terrain.css, language: css, editable: true}
imports: []
featured: false
migrationSource: terrain.html
migrationFingerprint: c1120a253ce09f78444b762d9c5fc16da11061fe8be173d6add370152832809e
dependencies: []
---

# 지형 레이어

이미지 지도 위에 **전국 지형을 나타내는 레이어를 출력**하는 예제입니다.
