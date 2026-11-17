---
title: 고도제한 분석
theme: pastel-glass-map
output: analysisHeightLimit.html
editor: true
category: analysis
summary: 다각형 영역의 제한 고도를 지정하고 초과 건물 수와 초과 높이를 확인합니다.
tags: [고도제한, 다각형, 건물, WFS, POI]
apis: [UAnalyArea, U2dPolygon, UAnalyHeightLimit.addFilter, UAnalyHeightLimit.removeFilter, UHeightFilter, U3dModelWFSLayer, U3dPOI]
runtime:
  home: {longitude: 126.9395, latitude: 37.52, height: 450, duration: 2, pitch: 60}
  baseLayers: [satellite]
  terrain: {enabled: true, preset: korea}
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
verification:
  network:
    allowedRequestFailures:
      - urlPrefix: https://3d.geon.kr/geoserver/digitaltwin/
        reason: 외부 WFS 건물 서버가 localhost 요청을 허용하지 않는 환경에서는 건물 데이터를 불러오지 못합니다.
  scenarios:
    - id: initial-panel
      states:
        panel: {type: element, selector: "#height-limit-panel", properties: [visible]}
        height: {type: element, selector: "[data-height-limit-height]", properties: [value]}
      expect:
        panel: {visible: true}
        height: {value: "100"}
    - id: cancel-drawing
      actions:
        - {type: click, selector: "[data-height-limit-draw]"}
        - {type: click, selector: "[data-height-limit-cancel]"}
      states:
        status: {type: element, selector: "[data-height-limit-status]", properties: [text]}
      expect:
        status: {text: "영역 그리기를 취소했습니다."}
    - id: reset
      actions:
        - {type: click, selector: "[data-height-limit-reset]"}
      states:
        empty: {type: element, selector: "[data-height-limit-empty]", properties: [visible]}
      expect:
        empty: {visible: true}
sources:
  - {id: main, path: ./analysisHeightLimit.main.js, language: javascript, editable: true}
  - {id: ui, path: ./analysisHeightLimit.ui.js, language: javascript, editable: true}
  - {id: html, path: ./analysisHeightLimit.html, language: html, editable: true}
  - {id: css, path: ./analysisHeightLimit.css, language: css, editable: true}
featured: true
migrationSource: analysisHeightLimit.html
---

# 고도제한 분석

지도에 다각형 영역을 그리고 제한 고도를 지정해 초과하는 건물을 찾습니다. 건물별 POI에 초과 구간과 높이를 표시하고, 패널에서 영역별 초과 객체 수와 최대 초과 높이를 확인합니다.

## 다루는 기능

- `UAnalyArea`로 분석 영역을 그립니다.
- `UAnalyHeightLimit.addFilter()`에 다각형과 제한 고도를 전달합니다.
- 필터의 `result`와 `change` 이벤트로 이미 있는 건물과 나중에 로드되는 건물의 결과를 갱신합니다.
- 생성한 영역의 제한 고도를 수정하고 초과 건물과 POI를 다시 계산합니다.
- 결과 표에서 선택한 영역의 필터와 POI만 개별 삭제합니다.
- 초기화 시 이 예제가 만든 필터·영역·POI만 제거합니다.

## 사전 조건

GeOnDT 라이선스와 WebGL 지원 브라우저가 필요합니다. 배경지도와 한반도 지형은 공통 런타임이 준비하며, 건물은 외부 WFS 서버의 데이터를 사용합니다. 서버 접근이 제한되거나 건물이 로드되지 않았으면 결과가 0건일 수 있으므로 실제 지도에 건물이 표시되는지도 확인하세요.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| ‘영역 그리기’를 누르고 지도에서 세 지점 이상을 클릭합니다. | 다각형을 그립니다. 더블클릭하면 영역이 확정됩니다. |
| 제한 고도를 입력하고 ‘분석 적용’을 누릅니다. | 영역별 결과가 추가되고 초과 건물에 POI가 표시됩니다. |
| 결과 표 맨 오른쪽 ‘관리’ 열의 ‘수정’ 버튼을 누르고 새 고도를 입력한 뒤 ‘수정 적용’을 누릅니다. | 선택한 영역을 유지하며 제한 고도·초과 건물 수·최대 초과 높이·POI를 갱신합니다. |
| 고도 수정 중 ‘수정 취소’를 누릅니다. | 적용 전 입력을 취소하고 기존 분석을 유지합니다. |
| 결과 표 맨 오른쪽 ‘관리’ 열의 ‘삭제’ 버튼을 누릅니다. | 해당 영역의 분석과 POI만 지우고 다른 영역은 유지합니다. 수정 중인 영역을 삭제하면 수정도 종료합니다. |
| 영역을 그린 뒤 다른 고도로 다시 분석합니다. | 기존 분석을 유지하면서 새 영역의 결과를 추가합니다. |
| ‘그리기 취소’를 누릅니다. | 아직 적용하지 않은 영역만 지우며 기존 분석은 유지합니다. |
| ‘초기화’를 누릅니다. | 모든 예제 분석 영역과 POI를 지우고 입력 고도를 100으로 되돌립니다. |

고도 입력은 0 이상의 유한한 숫자입니다. 건물 자체 높이와 구분되는 지도상의 고도 기준이며, 초과 높이는 분석 결과의 지면 고도·건물 높이·제한 고도로 계산합니다. 단위는 미터입니다. 초과 객체 수는 필터가 반환한 모델 객체 수이며, 서로 겹친 영역의 같은 객체는 각 영역에서 따로 집계합니다.

결과는 영역마다 한 행을 유지해 모델 로드 통지가 반복되어도 행을 덧붙이지 않습니다. POI도 영역과 객체 식별자를 함께 사용해 같은 건물의 중복 표시와 다른 기능의 POI 삭제를 피합니다.

분석 필터는 두께가 없는 기준 평면으로 만듭니다. 표시용 두께의 아랫면이 제한 고도보다 낮아져 초과 높이 계산에 섞이는 것을 피하며, 필터 생성 후에는 공통 분석 객체의 기존 표시 설정을 복원합니다.

## 관련 API

`UAnalyArea`의 `measureend` 이벤트에서 위경도 좌표를 읽어 다각형을 만듭니다. 기존 지도 오버레이의 높이 입력은 오른쪽 패널로 옮겨 입력·적용·결과를 같은 곳에서 확인할 수 있습니다.

{{example-code:main:heightLimit.draw}}

`addFilter()`가 처음 찾은 결과를 먼저 표시하고 이후의 `change`도 같은 화면에 반영합니다. 필터 생성 중 예외가 발생해 부분 등록이 남으면 해당 ID만 회수합니다.

{{example-code:main:heightLimit.filter}}

기존 영역은 `UHeightFilter.setHeight()`로 고도를 바꾸고 `find()`로 재검색합니다. 검색 전에 표시 메시의 월드 행렬을 갱신해 새 고도를 교차 계산에 반영하고, 기존 POI를 지워 초과 대상에서 빠진 건물의 표시도 제거합니다. 재검색이 실패하면 이전 고도로 복원을 시도하고 결과를 안내합니다.

{{example-code:main:heightLimit.edit}}

WFS 건물 레이어는 예제에서 소유합니다. 종료 시 분석의 모델 감시를 해제한 뒤 그리기·필터·POI·건물 레이어를 정리하며 공통 앱·배경지도·지형은 유지합니다.

{{example-code:main:heightLimit.model}}
