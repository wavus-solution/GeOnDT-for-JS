---
title: "WMTS 이미지 레이어 가시화"
theme: pastel-glass-map
output: WMTSImageLayer.html
editor: true
category: image
summary: "브이월드의 Base·Hybrid WMTS 레이어와 GeoServer의 도로 WMTS 레이어를 지정 스타일로 화면에 출력하는 예제입니다."
tags: []
apis:
  - "addLayer"
  - "create3dImageWMTSLayer"
  - "on"
  - "setHomePosition"
  - "setIntensityLight"
  - "setNameBaseLayer"
  - "showImageLayer"
  - "showLayer"
  - "U3dAPP"
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
  - {id: main, path: ./WMTSImageLayer.main.js, language: javascript, editable: true}
  - {id: ui, path: ./WMTSImageLayer.ui.js, language: javascript, editable: true}
  - {id: html, path: ./WMTSImageLayer.html, language: html, editable: true}
  - {id: css, path: ./WMTSImageLayer.css, language: css, editable: true}
imports: []
featured: false
migrationSource: WMTSImageLayer.html
migrationFingerprint: c4dba4d0ae936acc319f3c22baca941be7f6db1c215ffc22c0073157cb6b4c9b
dependencies: []
---

# WMTS 이미지 레이어 가시화

브이월드의 **Base·Hybrid WMTS 레이어**와 GeoServer의 **도로 WMTS 레이어를 지정 스타일로 화면에 출력**하는 예제입니다.
