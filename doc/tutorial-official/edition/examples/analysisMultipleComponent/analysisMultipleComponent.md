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

## 다루는 기능

- 여러 원본 모델을 한 컴포넌트 레이어에 등록하고 시설물을 배치합니다.
- 레이어 생성 옵션에 `needXml: false`와 `geoLocation: {x: 0, y: 0, z: 0}`을 지정하여 원본 3DS 청크의 위치를 제외합니다. 시설물의 실제 배치 위치는 지도에서 클릭한 좌표로 정합니다.
- 배치한 시설물을 선택하여 위치·회전·크기를 편집하고 저장한 배치 정보를 불러옵니다.
- 레이어 초기화는 `layer.ready`, 개별 모델 로딩은 `loadModel()`의 반환 Promise로 기다립니다. 이미 등록되어 로딩 중인 모델은 `getModelInfo()` 결과의 `ready`로 같은 요청을 기다립니다.

## 사전 조건

GeOnDT SDK와 라이선스, 예제에서 지정한 지도·시설물 모델 서버에 접근할 수 있어야 합니다. 원본 모델 로딩이 완료된 뒤 시설물을 추가하십시오.

## 조작 및 예상 결과

1. 지도와 시설물 편집 패널이 준비될 때까지 기다립니다.
2. 사용할 모델을 선택하고 시설물을 추가합니다. 모델 준비가 끝나면 해당 모델로 배치할 수 있습니다.
3. 배치한 시설물을 선택하여 편집하면 화면에 변경 사항이 반영됩니다.

모델 요청에 실패하면 해당 Promise의 실패 경로로 전달됩니다. 모델 정보 객체 자체에 `then()`을 호출하거나 완료 제어 메서드를 추가하지 않습니다.

## 관련 API

- `U3dApp.createMultipleComponentLayer()` — 컴포넌트 레이어 생성
- `U3dMultipleComponentLayer.loadModel()` — 원본 모델 등록과 로딩
- `U3dMultipleComponentLayer.getModelInfo()` — 등록 정보와 로딩 Promise 조회
- `U3dMultipleComponentLayer.addPosition()` — 준비된 모델을 사용한 시설물 배치
