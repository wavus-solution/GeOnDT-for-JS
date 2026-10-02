---
title: "U3dApp 환경설정"
theme: pastel-glass-map
output: settingApp.html
editor: true
category: setting
summary: "최초에 생성하는 3D 지도 영역인 app의 환경설정을 세팅하는 예제입니다. 사용자는 app을 생성하데 이용되는 다양한 파라미터 값을 직접 세팅하여 원하는대로 환경설정된 app을 생성해볼 수 있습니다. 또한, 입..."
tags: [환경설정, app, U3dApp]
apis:
  - "addLayer"
  - "create3DFModelLayer"
  - "createloadingBar"
  - "createLoadingCanvas"
  - "createModelGroupLayer"
  - "dispose"
  - "endloadingBar"
  - "getCameraState"
  - "getFrameOptimize"
  - "getInstanceHeightLayers"
  - "getInstanceImageLayers"
  - "getInstanceModelLayers"
  - "getIntensityLight"
  - "getMaxProcess"
  - "getRatioModelTileSize"
  - "getRatioTileSize"
  - "getToneMappingExposure"
  - "on"
  - "saveJson"
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
  terrain: { enabled: true, preset: korea}
  modelLayers:
    - preset: seoul_u3f
      visible: true
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
sources:
  - {id: main, path: ./settingApp.main.js, language: javascript, editable: true}
  - {id: ui, path: ./settingApp.ui.js, language: javascript, editable: true}
  - {id: html, path: ./settingApp.html, language: html, editable: true}
  - {id: css, path: ./settingApp.css, language: css, editable: true}
imports: []
featured: false
migrationSource: settingApp.html
migrationFingerprint: 93595b8b231f07dee506253b4da6a632bdae488106eb95e080abbd4ece38ceaa
dependencies: []
---

# U3dApp 환경설정

최초에 생성하는 3D 지도 영역인 **app의 환경설정을 세팅**하는 예제입니다.  
사용자는 app을 생성하데 이용되는 다양한 파라미터 값을 직접 세팅하여 원하는대로 환경설정된 app을 생성해볼 수 있습니다. 또한, 입력된 app의 설정값을 Json 데이터를 출력받아 사용할 수 있는 기능도 구현되어 있습니다.
