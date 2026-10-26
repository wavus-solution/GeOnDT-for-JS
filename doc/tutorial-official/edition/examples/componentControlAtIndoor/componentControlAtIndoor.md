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
  - "createTdsModelLayer"
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
- 초기 일반 ESS 컨테이너 5개는 두 줄로 배치하고, 줄 사이의 빈 간격은 5m로 설정합니다. 첫 컨테이너(`container_0`)는 90도 돌리고, 긴 컨테이너(`ESS컨테이너_1`)는 두 줄의 오른쪽 끝 가운데로 옮겨 90도 돌립니다. 바닥 높이는 모두 같게 맞춥니다.
- 초기 데이터의 기존 어댑터는 불러오지 않고, 각 컨테이너 하단 네 모서리에 보라색 어댑터를 새로 연결합니다. 컨테이너를 이동·회전하면 어댑터도 함께 따라갑니다.
- 전선 하나가 24개 어댑터를 컨테이너 둘레 순서로 지나 시작점으로 돌아옵니다. 컨테이너 사이에서는 통로를 따라 꺾어 연결하며 노란 흐름 띠가 표시됩니다. 이동·회전한 어댑터에 맞춰 경로를 갱신하고, 저장·불러오기에서도 연결 순서를 유지합니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 오른쪽 `분석` 버튼을 누릅니다. | 시설물 편집 패널이 열리고 카메라 설정, 컴포넌트 설정, 전체 계층 구조, LOD 모드 설정을 확인할 수 있습니다. |
| `컴포넌트 설정`에서 `시설물`·`어댑터`·`열원`·`전선` 탭을 누릅니다. | 선택한 탭의 추가 메뉴만 표시됩니다. |
| 탭에서 항목을 고르고 지도를 클릭합니다. | 클릭한 위치에 해당 컴포넌트가 배치됩니다. |
| 배치한 시설물을 클릭합니다. | 지도 왼쪽에 선택 목록과 객체 정보 창이 열리고, `전체 계층 구조`에서 해당 항목이 강조됩니다. |
| `전체 계층 구조`를 확인합니다. | 부모가 없는 시설물·어댑터·열원·전선이 최상위에 나열되고, 부모를 지정한 객체는 부모 항목 안쪽에 연결선과 함께 표시됩니다. 각 줄 오른쪽에 모델 이름이나 객체 종류가, 자식이 있는 항목에는 자식 수가 표시됩니다. |
| `전체 계층 구조`에서 항목 왼쪽 `▾`를 누릅니다. | 해당 항목의 자식 목록이 접히거나 펼쳐집니다. `전체 펼치기`·`전체 접기`는 모든 부모 항목에 적용됩니다. |
| `전체 계층 구조`에서 항목을 누릅니다. | 해당 객체에 기즈모가 붙고 객체 정보 창이 열립니다. |
| 객체 정보 창의 `계층 편집`에서 부모를 지정합니다. | `전체 계층 구조`에서 그 객체가 부모 항목 안쪽으로 옮겨집니다. |
| 배치한 시설물을 선택하고 위치·회전·크기 기즈모를 조작합니다. | 선택한 시설물이 조작한 값대로 지도에서 움직입니다. |
| `부모 설정`과 `자식 설정`으로 계층을 지정한 뒤 `계층 정보 수정`을 누릅니다. | 전체 계층 구조 목록이 갱신되고 관계가 반영됩니다. |
| `LOD 모드 설정`을 `ON`으로 바꿉니다. | 카메라 거리에 따라 시설물 표현 수준이 달라집니다. |
| LOD를 켜고 시설물 가까이 이동합니다. | 일반 컨테이너와 ESS컨테이너는 12m 이내에서 투명도 0.1, 렉은 8m 이내에서 0.3, 모듈은 5m 이내에서 0.5가 됩니다. 이 범위를 벗어나면 불투명하게 표시되며, 1,000m보다 멀면 숨겨집니다. |
| 객체 정보 창의 `LOD 거리`를 바꿉니다. | 카메라가 정지한 상태에서도 즉시 반영됩니다. 컨테이너·렉·모듈은 투명도 전환 거리를, 셀은 표시 거리를 지정합니다. 셀의 기본 표시 거리는 1,000m입니다. |
| `LOD OFF`로 바꿉니다. | LOD를 켜기 전의 색상·투명도·그리기 순서와 객체·자식의 표시 상태를 복원합니다. 원래 수동으로 숨긴 객체는 숨김을 유지합니다. |
| `저장`을 누른 뒤 `불러오기`를 누릅니다. | 현재 배치를 저장한 배치로 교체하며, 시설물별 LOD 거리와 어댑터 숨김 상태도 복원합니다. 이전 형식의 데이터도 불러올 수 있습니다. |
| 잘못된 데이터를 불러옵니다. | 형식과 모델 준비 상태를 먼저 검사합니다. 배치 교체 중 실패하면 기존 배치를 복원하고 오류를 알립니다. |
| 객체를 반복 선택하고 기즈모를 움직입니다. | 선택 횟수와 관계없이 상세 정보 갱신 이벤트는 한 개만 유지됩니다. |
| 전선 추가 중 `ESC`를 누르거나 더블클릭합니다. | 전선 추가를 종료하고 클릭·더블클릭 대기 이벤트를 해제합니다. |
| 열원 온도 입력에서 `취소`를 누릅니다. | 열원을 생성하지 않고 선택 모드로 돌아갑니다. 온도는 0~100의 숫자만 허용합니다. |
| `전체 제거`를 누릅니다. | 배치한 시설물이 모두 삭제됩니다. |

## 관련 API

- `createTdsModelLayer`: 실내가 구현된 기준 모델 레이어를 만듭니다.
- `createMultipleComponentLayer`: 배치할 시설물 컴포넌트를 담는 레이어를 만듭니다.
- `addSelect`, `U3dSelect`: 편집 대상 시설물을 선택합니다.
- `getAnalysis`: `'GizmoModel'`과 `'AlignModel'` 기능으로 위치·회전·크기와 정렬을 편집합니다.
- `closestPointAtPixel`, `getGoogleToGeographic`, `vector3ToGeoGraphic`: 화면 클릭 지점을 배치 좌표로 변환합니다.
- `setInteriorPanControl`, `setDynamicPanControl`: 실내 이동에 맞는 카메라 조작을 설정합니다.
