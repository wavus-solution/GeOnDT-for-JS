---
title: "경사도 분석"
theme: pastel-glass-map
output: analysisHeight.html
editor: true
category: analysis
summary: "라인의 시작점과 끝점을 기준으로 경사도를 분석하여 그래프로 출력하는 예제입니다. 마우스 클릭으로 분석 시작점을 설정하고 더블클릭으로 그리기를 종료하며 분석을 종료할 끝점을 설정합니다."
tags: []
apis:
  - "activeAnalysis"
  - "addLayer"
  - "closestPointAtPixel"
  - "createloadingBar"
  - "deactiveAnalysis"
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
  baseLayers: []
  terrain: {enabled: false}
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
sources:
  - {id: main, path: ./analysisHeight.main.js, language: javascript, editable: true}
  - {id: ui, path: ./analysisHeight.ui.js, language: javascript, editable: true}
  - {id: html, path: ./analysisHeight.html, language: html, editable: true}
  - {id: css, path: ./analysisHeight.css, language: css, editable: true}
imports: []
featured: false
migrationSource: analysisHeight.html
migrationFingerprint: 5b8d90a533b453674c67bf39d860e943b3442087030394db43c70c2abf25d85b
dependencies: []
---

# 경사도 분석

라인의 시작점과 끝점을 기준으로 **경사도를 분석하여 그래프로 출력**하는 예제입니다.  
마우스 클릭으로 분석 시작점을 설정하고 더블클릭으로 그리기를 종료하며 분석을 종료할 끝점을 설정합니다.
