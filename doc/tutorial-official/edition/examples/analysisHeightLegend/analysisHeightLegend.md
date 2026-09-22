---
title: 고도 범례 분석
theme: pastel-glass-map
output: analysisHeightLegend.html
editor: true
category: analysis
summary: 지형과 건물, 움직이는 컴포넌트의 고도를 색상 범례와 등고선으로 확인합니다.
tags: [고도 분석, 범례, 등고선, 후처리, 컴포넌트]
apis:
  - U3dAPP
  - getAnalysis
  - getHeightAtGeographicPoint
  - createMultipleComponentLayer
  - createModelGroupLayer
  - create3DFModelLayer
  - showLayer
  - addLayer
  - U3dVectorLayer
  - U3dLine
  - U3dPipe
  - U3dPathGeometry
  - get3DLibrary
  - getExternalScene
  - getGeographicToGoogle
runtime:
  commonUi:
    imageLayerPanel: true
    terrainLayerPanel: true
  app:
    methodheight: raw
    searchtype: sphere
    useFog: true
    useshadowmap: true
    frameOptimize: true
    autoClear: true
  home:
    longitude: 126.949
    latitude: 37.470
    height: 3000
    duration: 138
    pitch: 79
  layers:
    available: [satellite, base, hybrid, osm, google, korea_terrain]
    visible: [satellite, korea_terrain]
    base: satellite
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
verification:
  scenarios:
    - id: show-height-legend
      actions:
        - type: check
          selector: "#show-height-legend"
      states:
        panel:
          type: element
          selector: "#height-analysis-panel"
          properties: [exists, visible]
        legendVisible:
          type: element
          selector: "#show-height-legend"
          properties: [exists, checked]
        legendSection:
          type: element
          selector: "#height-legend-section"
          properties: [exists, visible]
        legendRows:
          type: element
          selector: ".height-legend-row"
          properties: [count]
      expect:
        panel: {exists: true, visible: true}
        legendVisible: {exists: true, checked: true}
        legendSection: {exists: true, visible: true}
        legendRows: {count: 5}
    - id: add-legend-item
      actions:
        - type: check
          selector: "#show-height-legend"
        - type: click
          selector: "#height-legend-add-btn"
      states:
        legendRows:
          type: element
          selector: ".height-legend-row"
          properties: [count]
      expect:
        legendRows: {count: 6}
    - id: show-contour
      actions:
        - type: check
          selector: "#show-contour"
        - type: fill
          selector: "#contour-width"
          value: "5"
      states:
        contourSection:
          type: element
          selector: "#contour-style-section"
          properties: [exists, visible]
        contourWidth:
          type: element
          selector: "#contour-width"
          properties: [exists, value]
        contourRows:
          type: element
          selector: ".contour-style-row"
          properties: [count]
      expect:
        contourSection: {exists: true, visible: true}
        contourWidth: {exists: true, value: "5"}
        contourRows: {count: 5}
sources:
  - {id: main, path: ./analysisHeightLegend.main.js, language: javascript, editable: true}
  - {id: ui, path: ./analysisHeightLegend.ui.js, language: javascript, editable: true}
  - {id: api, label: API Help, path: ./analysisHeightLegend.api.js, language: javascript, editable: true}
  - {id: droneShow, label: droneShow.js, path: ./droneShow.js, language: javascript, editable: true}
  - {id: html, path: ./analysisHeightLegend.html, language: html, editable: true}
  - {id: css, path: ./analysisHeightLegend.css, language: css, editable: true}
imports: [droneShow]
dependencies: []
---

# 고도 범례 분석

**고도 범례 출력 예제**입니다.
지형과 건물, 움직이는 컴포넌트의 고도를 색상 범례와 등고선으로 확인하고, 특정 객체만 후처리에서 제외할 수 있습니다.

## 다루는 기능

- 고도 범례와 등고선 후처리를 켜고 꺼서 화면 픽셀의 고도를 색으로 표현합니다.
- 고도 기준값별 색상·투명도와 band/mix 색상 선택 방식을 바꾸어 범례를 직접 구성합니다.
- 등고선 구간, 선 두께, 감쇠 거리와 투명도를 조절해 지형 기복 표현을 조정합니다.
- `setExceptObjects()`로 특정 컴포넌트와 궤적을 후처리에서 제외합니다.
- 거의 투명한 아랫면 형상을 제외 목록에 넣을 때와 넣지 않을 때의 범례 표현 차이를 비교합니다.

## 사전 조건

- 예제 데이터 서버(지형, 드론 모델, U3F 모델)에 접근할 수 있는 네트워크 환경이 필요합니다.
- 초기 지도에는 위성영상과 한반도 지형이 표시되고, 이어서 U3F 모델과 비교용 드론이 준비됩니다.
- 고도 범례는 화면에 그려진 픽셀의 고도를 사용하므로, 지형 타일이 로딩되기 전에는 색이 채워지지 않습니다.
- 드론은 지형에서 읽은 지면 높이를 기준으로 배치합니다. 지형 요청이 실패하면 드론과 궤적이 나타나지 않고, 이때 후처리 제외 항목도 선택할 수 없습니다.

## 주요 기능

- 고도 범례와 등고선 후처리를 각각 켜고 끕니다.
- 고도 기준값별 색상과 투명도를 편집하고 기준값을 추가·제거합니다.
- band와 mix 중 색상 선택 방식을 바꿉니다.
- 등고선 구간별 시작 고도와 선 간격, 색상, 선 두께, 감쇠 거리, 투명도를 조정합니다.
- 지정한 드론과 궤적만 고도 후처리에서 제외해 본연의 색상으로 확인합니다.
- 드론 열 남쪽에 서쪽 끝에서 U턴해 돌아오는 비행 회랑 모양의 비교 경로를 배치합니다. 윗면은 `U3dPathGeometry`, 아랫면은 `THREE.ShapeGeometry`입니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 왼쪽 `분석` 버튼을 누릅니다. | 고도 범례 분석 패널이 열립니다. |
| `고도 범례 가시화`를 켭니다. | 지형·건물·드론이 고도별 색으로 채워지고 범례 편집 영역이 나타납니다. |
| 범례 행의 색상 또는 투명도를 바꿉니다. | 해당 고도 구간의 지도 색상이 즉시 바뀝니다. |
| `band`와 `mix`를 전환합니다. | band는 구간 색을 그대로, mix는 인접 기준값 색을 섞어 표현합니다. |
| 범례의 `+`, `−`를 누릅니다. | 가장 높은 기준값보다 100m 높은 항목이 추가되거나 마지막 항목이 제거됩니다. |
| `드론 일부와 경로 후처리 제외`를 켭니다. | 지정한 드론·궤적과 비교 경로의 윗면이 본연의 색으로 표시됩니다. 아랫면 형상은 제외되지 않아, 그 면이 가린 영역은 아랫면의 고도 색으로 남습니다. |
| `추가 객체 후처리 제외`를 켭니다. | 위 체크가 해제되고, 같은 대상에 아랫면 형상까지 더해 제외합니다. 아랫면이 가리던 영역이 지형 본래의 고도 색으로 돌아옵니다. |
| `등고선 가시화`를 켭니다. | 고도 구간마다 등고선이 그려지고 등고선 스타일 편집 영역이 나타납니다. |
| 선 두께, 감쇠 거리, 투명도와 구간 값을 바꿉니다. | 등고선의 굵기, 거리별 표현과 색상이 즉시 바뀝니다. |

## 관련 API

- `getAnalysis('Height')`: 고도 범례 분석 객체를 가져옵니다. `drawHeight()`로 후처리 표시 상태를, `setUserStyle()`로 고도 기준값별 색상을 지정합니다.
- `getAnalysis('Contour')`: 등고선 분석 객체를 가져옵니다. `setTopoStyle()`, `setTopoWidth()`, `setTopoOpacity()`, `setTopoFadeDistance()`로 등고선 표현을 지정합니다.
- `setExceptObjects()`, `clearExceptObjects()`: 지정한 컴포넌트와 Object3D만 고도 후처리에서 제외하거나 제외를 해제합니다. 현재 배포된 `GeOnDT.modules.d.ts`에는 두 함수의 선언이 포함되어 있지 않아 예제 계약의 `apis` 목록에서는 제외했습니다.
- `createMultipleComponentLayer()`, `getHeightAtGeographicPoint()`: 지면 높이를 기준으로 비교용 드론을 배치합니다.
- `U3dVectorLayer`, `U3dLine`, `U3dPipe`, `U3dPathGeometry`: 드론 궤적을 서로 다른 방식으로 그립니다.
- `get3DLibrary()`, `getExternalScene()`, `getGeographicToGoogle()`: 비교 경로의 아랫면을 `THREE.ShapeGeometry`로 직접 만들어 외부 Scene에 추가합니다. 윗면은 GeOnDT `U3dPathGeometry`로 만들어 두 형태의 제외 반영 범위를 비교합니다.
- `createModelGroupLayer()`, `create3DFModelLayer()`: 건물 고도를 확인할 U3F 모델 레이어를 구성합니다.
- `setCameraTrace()`: 기존 예제와 동일하게 개발자 도구에서 `move()`를 호출하면 중앙 드론(`U3dPipe`)을 뒤쪽 3인칭 시점으로 추적합니다. 이 전역 함수는 예제 정리 시 원래 값으로 되돌립니다.

## 고도 범례 스타일 전달

편집한 기준값·색상·투명도를 RGBA 스타일 객체로 만들어 Height 분석에 전달합니다.

{{example-code:legend.style}}

## 후처리 표시 전환

Height와 Contour는 같은 고도 후처리 pass를 공유하며, 각 분석의 `drawHeight()`가 자신의 표현만 켜고 끕니다.

{{example-code:analysis.visibility}}

## 등고선 스타일 전달

구간 목록과 선 두께, 투명도, 감쇠 거리를 Contour 분석에 함께 전달합니다.

{{example-code:contour.style}}

## 후처리 제외

제외할 컴포넌트와 궤적 Object3D를 함께 전달하면 그 대상만 본연의 색상으로 남습니다.

{{example-code:legend.except}}

## 비교용 드론 배치

같은 형상을 공유하는 인스턴스 타입과 일반 메쉬 타입 컴포넌트를 함께 배치해 범례 적용 범위를 비교합니다.

{{example-code:droneShow:drone.position}}

## 비행 회랑 모양 비교 경로

평면에서는 동쪽에서 서쪽으로 나갔다가 서쪽 끝에서 U턴해 돌아오는 회랑을 `U3dPathGeometry`로 만듭니다.
동쪽 출발점과 도착점의 남북 위치는 따로 지정해 두 끝이 서로 다른 자리에 놓입니다. 고도는 순항 고도를
유지하다가 나가는 갈래 한 곳에서만 크게 솟아, 그 지점에서만 범례의 여러 구간 색이 한꺼번에 쌓여 보입니다.
이 윗면 아래에는 같은 외곽선을 본떠 지면까지 잇는 `THREE.ShapeGeometry` 면을 거의 투명하게 덧댑니다.
경로가 굽어 있으므로 (경로를 따라 잰 거리, 고도) 평면에서 면을 만든 뒤 다시 경로 위로 되돌려 세웁니다.
아랫면은 눈에 거의 보이지 않지만 화면 픽셀의 고도는 그대로 제공하므로, 제외 목록에 넣지 않으면
그 면이 가린 영역이 아랫면의 고도 색으로 칠해집니다.

{{example-code:droneShow:custom.path}}
