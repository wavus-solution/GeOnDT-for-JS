---
title: "시설물 상세 편집 및 실내환경 구성"
theme: pastel-glass-map
output: componentControlAtIndoor.html
editor: true
category: analysis
summary: "실내 환경 구성을 위한 컴포넌트 상세 설정 예제 입니다. 실내가 구현된 모델을 로드하고, 시설물을 배치/수정하여 실내환경을 구성합니다. 배치한 시설물을 저장 및 불러오기 하며, 거리에 따른 LOD를 적용합니다."
tags: []
apis:
  - "addLayer"
  - "addSelect"
  - "closestPointAtPixel"
  - "createloadingBar"
  - "createModelTdsLayer"
  - "createMultipleComponentLayer"
  - "createPromise"
  - "DegToRad"
  - "DoubleSide"
  - "effect"
  - "endloadingBar"
  - "getAnalysis"
  - "getCameraPosition"
  - "getCameraState"
  - "getGoogleToGeographic"
  - "getLayerByName"
  - "getMapControl"
  - "KEY_MOVE_SPEED"
  - "loadCameraState"
  - "loadingBar"
  - "MOVE_SPEED"
  - "off"
  - "on"
  - "once"
  - "PAN_ANCHOR_MAX_DISTANCE"
  - "PAN_ANCHOR_MIN_DISTANCE"
  - "PAN_MOVE_AMOUNT_LIMIT"
  - "ROTATE_ANCHOR_MIN_DISTANCE"
  - "ROTATE_ANCHOR_RANGE"
  - "ROTATE_SPEED"
  - "setDynamicPanControl"
  - "setGeoCenterToOverviewMap"
  - "setHomePosition"
  - "setIntensityLight"
  - "setIntensitySunLight"
  - "setInteriorPanControl"
  - "setNameBaseLayer"
  - "setRotationOverviewMap"
  - "setVisibleLoading"
  - "showLayer"
  - "U3dAdaptedGeometry"
  - "U3dAPP"
  - "U3dFlowPipe"
  - "U3dHeatGeometry"
  - "U3dObjectBarrier"
  - "U3dSelect"
  - "U3dVectorLayer"
  - "UGPoint"
  - "updateHomePosition"
  - "vector3ToGeoGraphic"
  - "ZOOM_SPEED"
runtime:
  home: {longitude: 126.9395, latitude: 37.52, height: 450, duration: 2, pitch: 60}
  layers:
    available: [satellite, base, hybrid, osm, google, korea_terrain]
    visible: [satellite, korea_terrain]
    base: satellite
  terrain: {enabled: true, preset: korea, options: {maxLevel: 17}}
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
        panel: {type: element, selector: "#analy-popup", properties: [exists]}
      expect:
        canvas: {exists: true, visible: true}
        rail: {exists: true, visible: true}
        panel: {exists: true}
    - id: switch-component-tab
      actions:
        - type: click
          selector: "#indoor-tab-adapter"
      states:
        adapterTab: {type: element, selector: "#indoor-tab-adapter[aria-selected='true']", properties: [exists]}
        adapterPanel: {type: element, selector: "#indoor-tabpanel-adapter", properties: [exists, visible]}
        facilityPanel: {type: element, selector: "#indoor-tabpanel-facility", properties: [exists, visible]}
      expect:
        adapterTab: {exists: true}
        adapterPanel: {exists: true, visible: true}
        facilityPanel: {exists: true, visible: false}
sources:
  - {id: main, path: ./componentControlAtIndoor.main.js, language: javascript, editable: true}
  - {id: ui, path: ./componentControlAtIndoor.ui.js, language: javascript, editable: true}
  - {id: html, path: ./componentControlAtIndoor.html, language: html, editable: true}
  - {id: css, path: ./componentControlAtIndoor.css, language: css, editable: true}
  - {id: sampleLoadData, path: ./sampleLoadData.js, language: javascript, editable: true}
imports:
  - "sampleLoadData"
migrationSource: componentControlAtIndoor.html
dependencies: []
---

# 시설물 상세 편집 및 실내환경 구성

**실내 환경 구성을 위한 컴포넌트 상세 설정**예제 입니다.  
실내가 구현된 모델을 로드하고, 시설물을 배치/수정하여 실내환경을 구성합니다. 배치한 시설물을 저장 및 불러오기 하며, 거리에 따른 LOD를 적용합니다.

## 다루는 기능

- 실내가 구현된 모델 위에 시설물·어댑터·열원·전선 컴포넌트를 배치하고, `getAnalysis('GizmoModel')`로 위치와 방향을 편집하며 계층 구조와 LOD를 설정한 결과를 저장하고 다시 불러옵니다.

## 사전 조건

- 실내 모델과 시설물 컴포넌트를 내려받을 수 있는 네트워크가 필요합니다. 모델이 로드되지 않으면 시설물을 배치할 기준면이 없어 이후 조작을 할 수 없습니다.
- 초기 화면은 위성영상과 한반도 지형 위에서 시작하며, 실내로 진입한 뒤에 시설물 편집을 사용합니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 오른쪽 `분석` 버튼을 누릅니다. | 시설물 편집 패널이 열리고 카메라 설정, 컴포넌트 설정, 전체 계층 구조, LOD 모드 설정을 확인할 수 있습니다. |
| `컴포넌트 설정`에서 `시설물`·`어댑터`·`열원`·`전선` 탭을 누릅니다. | 선택한 탭의 추가 메뉴만 표시됩니다. |
| 탭에서 항목을 고르고 지도를 클릭합니다. | 클릭한 위치에 해당 컴포넌트가 배치됩니다. |
| 배치한 시설물을 클릭합니다. | 지도 왼쪽에 선택 목록과 객체 정보 창이 열리고, `전체 계층 구조`에서 해당 항목이 강조됩니다. |
| `전체 계층 구조`를 확인합니다. | 부모가 없는 객체가 최상위에 나열되고, 부모를 지정한 객체는 부모 항목 안쪽에 연결선과 함께 표시됩니다. 각 줄 오른쪽에 모델 이름이, 자식이 있는 항목에는 자식 수가 표시됩니다. |
| `전체 계층 구조`에서 항목 왼쪽 `▾`를 누릅니다. | 해당 항목의 자식 목록이 접히거나 펼쳐집니다. `전체 펼치기`·`전체 접기`는 모든 부모 항목에 적용됩니다. |
| `전체 계층 구조`에서 항목을 누릅니다. | 해당 객체에 기즈모가 붙고 객체 정보 창이 열립니다. |
| 객체 정보 창의 `계층 편집`에서 부모를 지정합니다. | `전체 계층 구조`에서 그 객체가 부모 항목 안쪽으로 옮겨집니다. |
| 배치한 시설물을 선택하고 위치·회전·크기 기즈모를 조작합니다. | 선택한 시설물이 조작한 값대로 지도에서 움직입니다. |
| `부모 설정`과 `자식 설정`으로 계층을 지정한 뒤 `계층 정보 수정`을 누릅니다. | 전체 계층 구조 목록이 갱신되고 관계가 반영됩니다. |
| `LOD 모드 설정`을 `ON`으로 바꿉니다. | 카메라 거리에 따라 시설물 표현 수준이 달라집니다. |
| `저장`을 누른 뒤 `불러오기`를 누릅니다. | 저장한 배치 데이터가 그대로 복원됩니다. |
| `전체 제거`를 누릅니다. | 배치한 시설물이 모두 삭제됩니다. |

## 관련 API

- `createModelTdsLayer`: 실내가 구현된 기준 모델 레이어를 만듭니다.
- `createMultipleComponentLayer`: 배치할 시설물 컴포넌트를 담는 레이어를 만듭니다.
- `addSelect`, `U3dSelect`: 편집 대상 시설물을 선택합니다.
- `getAnalysis`: `'GizmoModel'`과 `'AlignModel'` 기능으로 위치·회전·크기와 정렬을 편집합니다.
- `closestPointAtPixel`, `getGoogleToGeographic`, `vector3ToGeoGraphic`: 화면 클릭 지점을 배치 좌표로 변환합니다.
- `setInteriorPanControl`, `setDynamicPanControl`: 실내 이동에 맞는 카메라 조작을 설정합니다.
