---
title: "U3F 모델 레이어"
theme: pastel-glass-map
output: u3fModel.html
editor: true
category: model
summary: "3D 모델 레이어 중, U3F 모델 레이어를 화면에 출력하는 예제입니다."
tags: []
apis:
  - "create3DFModelLayer"
  - "createEmapBaseLayer"
  - "createloadingBar"
  - "createLoadingCanvas"
  - "createModelGroupLayer"
  - "createPromise"
  - "endloadingBar"
  - "getCameraState"
  - "getGoogleRectangleDefine"
  - "loadingBar"
  - "on"
  - "removeLayer"
  - "setGeoCenterToOverviewMap"
  - "setHomePosition"
  - "setNameBaseLayer"
  - "setRotationOverviewMap"
  - "showLayer"
  - "U3dAPP"
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
  - {id: main, path: ./u3fModel.main.js, language: javascript, editable: true}
  - {id: ui, path: ./u3fModel.ui.js, language: javascript, editable: true}
  - {id: html, path: ./u3fModel.html, language: html, editable: true}
  - {id: css, path: ./u3fModel.css, language: css, editable: true}
imports: []
featured: false
migrationSource: u3fModel.html
migrationFingerprint: f70dc353c774c432b5ccf2b3118ec35d5c46cbcff494b4b6db272453c0e8e563
dependencies: []
---

# U3F 모델 레이어

3D 모델 레이어 중, **U3F 2.2V·2.3V·2.4V·2.5V 모델 레이어를 버전별로 화면에 출력**하는 예제입니다. 각 체크박스는 독립적으로 동작하므로 여러 버전을 동시에 비교할 수 있습니다.

- 2.2V: `category=korea` 서버의 발행 중인 레이어
- 2.3V: `category=AL_D198` 서버의 공유 재질 레이어
- 2.4V: `model-2.4/seoul` U3G 레이어 묶음
- 2.5V: `model-2.5/seoul` U3G 레이어 묶음
