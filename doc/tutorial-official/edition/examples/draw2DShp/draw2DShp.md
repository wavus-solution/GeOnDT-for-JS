---
title: "2D SHP 레이어"
theme: pastel-glass-map
output: draw2DShp.html
editor: true
category: image
summary: "로컬 SHP 파일 세트를 U2dShpLayer로 그리고 채우기·외곽선·라벨 스타일을 실시간으로 바꿉니다."
tags:
  - SHP
  - 2D 레이어
  - 파일 업로드
apis:
  - "U2dShpLayer"
  - "UShpParser"
  - "addLayer"
  - "removeLayer"
  - "showLayer"
  - "setHomePosition"
  - "updateHomePosition"
runtime:
  home: {longitude: 127.0, latitude: 37.5, height: 1800, duration: 2, pitch: 45}
  baseLayers: [satellite]
  terrain: {enabled: false}
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
verification:
  scenarios:
    # Viewer는 예제 Rail의 첫 패널을 초기 화면에서 자동으로 엽니다.
    - id: initial-panel
      states:
        panel:
          type: element
          selector: "#draw2DShp-option-panel"
          properties: [exists, visible]
        status:
          type: element
          selector: "#shp-status"
          properties: [exists, text]
      expect:
        panel: {exists: true, visible: true}
        status: {exists: true, text: "SHP 파일을 선택해 주세요."}
    - id: toggle-panel
      actions:
        - type: click
          selector: "[data-panel-target='draw2DShp-option-panel']"
      states:
        panel:
          type: element
          selector: "#draw2DShp-option-panel"
          properties: [exists, visible]
      expect:
        panel: {exists: true, visible: false}
    - id: reset-style-restores-defaults
      actions:
        - type: fill
          selector: "#stroke-width"
          value: "6"
        - type: click
          selector: "#use-fill"
        - type: click
          selector: "#reset-style"
      states:
        strokeWidth:
          type: element
          selector: "#stroke-width"
          properties: [exists, value]
        strokeWidthOutput:
          type: element
          selector: "#stroke-width-value"
          properties: [exists, text]
        useFill:
          type: element
          selector: "#use-fill"
          properties: [exists, checked]
        fillColor:
          type: element
          selector: "#fill-color"
          properties: [exists, value]
      expect:
        strokeWidth: {exists: true, value: "2"}
        strokeWidthOutput: {exists: true, text: "2"}
        useFill: {exists: true, checked: true}
        fillColor: {exists: true, value: "#3399cc"}
sources:
  - {id: main, path: ./draw2DShp.main.js, language: javascript, editable: true}
  - {id: ui, path: ./draw2DShp.ui.js, language: javascript, editable: true}
  - {id: html, path: ./draw2DShp.html, language: html, editable: true}
  - {id: css, path: ./draw2DShp.css, language: css, editable: true}
imports: []
featured: false
migrationSource: draw2DShp.html
migrationFingerprint: c6e7dfdbb665b65d163f24e571bb0610b79639be325bf1128ed3b19b53a38627
dependencies: []
---

# 2D SHP 레이어

## 다루는 기능

- 브라우저에서 선택한 로컬 Shapefile(.shp/.prj/.dbf)을 서버 업로드 없이 FileReader로 읽습니다.
- `UShpParser`로 도형(.shp)과 속성(.dbf)을 파싱해 GeoJSON FeatureCollection으로 합칩니다.
- `U2dShpLayer`를 만들어 지도 위에 2D 이미지 레이어로 그리고, 첫 도형 위치로 홈 위치를 옮깁니다.
- 패널의 스타일 컨트롤로 채우기·외곽선·공통 라벨을 생성된 모든 2D SHP 레이어에 `setStyle()`로 즉시 적용합니다.

## 사전 조건

배경지도(브이월드 정사영상) 서버에 접근할 수 있어야 하며 지형은 사용하지 않습니다. 표시할 Shapefile은 사용자가 직접 준비해야 하고, 같은 이름의 `.shp`(필수)·`.prj`·`.dbf`를 한 번에 선택해야 합니다. `.prj`가 없으면 EPSG:5179로 해석하고 `.dbf`가 없으면 속성 없이 도형만 그립니다.

`initialize()`는 레이어를 만들지 않고 파일 읽기·레이어 생성(`loadShapefiles`)과 스타일 적용(`applyStyle`) 동작만 반환합니다. UI가 파일 선택과 컨트롤 변경 시 이 동작을 호출하며, 종료 시 생성한 2D SHP 레이어를 모두 제거합니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 「SHP」 버튼 누르기 | 2D SHP 패널이 열리거나 닫힙니다. |
| 같은 이름의 .shp/.prj/.dbf 선택 | 읽는 동안 상태에 진행 문구가 표시되고, 완료되면 `2d-shp-<파일이름>` 레이어가 그려지며 피처 수가 표시됩니다. 카메라가 첫 도형의 bbox 중심(높이 800m)으로 이동합니다. |
| 같은 이름의 파일을 다시 선택 | 기존 레이어를 제거하고 새 레이어로 교체합니다. |
| 이름이 다른 파일을 함께 선택, .shp 누락, 확장자 중복 | 레이어를 만들지 않고 상태에 빨간 오류 문구가 표시됩니다. |
| 채우기·외곽선 체크박스, 색상, 투명도, 두께 변경 | 생성된 모든 2D SHP 레이어의 스타일이 바뀌고 슬라이더 옆 값이 갱신됩니다. 색상은 드래그 중에도 반영됩니다. |
| 공통 라벨 입력 | 입력이 200ms 멈춘 뒤 모든 피처에 같은 라벨이 표시됩니다. 비우면 표시하지 않습니다. |
| 「기본 스타일」 누르기 | 모든 컨트롤이 초기값(채우기 #3399cc·0.35, 외곽선 #0f4c75·2, 라벨 없음)으로 돌아가고 레이어에 적용됩니다. |

## 관련 API

- UShpParser.parseShp / parseDbf / combine: Shapefile 도형·속성 파싱과 FeatureCollection 결합
- U2dShpLayer: 2D 벡터 피처를 타일 이미지로 그리는 레이어(sourceCRS·crs·style 옵션)
- U2dShpLayer.addFeatureCollection / setStyle / setLabelFunction: 피처 추가, 스타일 변경, 라벨 함수 지정
- U3dAPP.addLayer / removeLayer / showLayer: 레이어 등록·제거·표시
- U3dAPP.setHomePosition / updateHomePosition: 읽은 도형 위치로 홈 이동

기존 Legacy draw2DShp.baseline.html과 동일한 동작을 Common Runtime 구조(main/ui/html/css)로 옮겼습니다.
