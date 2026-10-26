---
title: 2D 객체 그리기
theme: pastel-glass-map
output: vectorLayer2D.html
editor: true
category: analysis
summary: 도형 목록에서 위치·회전·크기와 스타일·속성을 편집하고, 변경한 상태로 애니메이션을 이어갑니다.
tags: [2D 객체, 벡터 레이어, 교차검색, WKT, GeoJSON, TopoJSON]
apis:
  - U2dVectorShaderLayer
  - U2dPoint
  - U2dLine
  - U2dPolygon
  - U3dOverlay
runtime:
  home: {longitude: 126.9395, latitude: 37.52, height: 450, duration: 2, pitch: 60}
  baseLayers: [satellite]
  terrain: {enabled: true, preset: korea, options: {maxLevel: 17}}
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
verification:
  scenarios:
    # Viewer는 예제 Rail의 첫 패널을 초기 화면에서 자동으로 엽니다.
    - id: initial-draw-panel
      states:
        canvas:
          type: element
          selector: "#map canvas"
          properties: [exists, visible]
        panel:
          type: element
          selector: "#vector2d-draw-panel"
          properties: [exists, visible]
        hint:
          type: element
          selector: "#vector2d-type-hint"
          properties: [exists, text]
      expect:
        canvas: {exists: true, visible: true}
        panel: {exists: true, visible: true}
        hint: {exists: true, text: "지도를 한 번 클릭하면 포인트가 완성됩니다."}
    - id: select-polygon-type
      actions:
        - type: check
          selector: "input[name='vector2d-type'][value='Polygon']"
      states:
        polygonType:
          type: element
          selector: "input[name='vector2d-type'][value='Polygon']"
          properties: [exists, checked]
        hint:
          type: element
          selector: "#vector2d-type-hint"
          properties: [exists, text]
      expect:
        polygonType: {exists: true, checked: true}
        hint: {exists: true, text: "지도를 세 번 이상 클릭한 뒤 더블클릭하면 폴리곤이 완성됩니다."}
    - id: toggle-select-mode
      actions:
        - type: check
          selector: "#vector2d-select-mode"
      states:
        selectMode:
          type: element
          selector: "#vector2d-select-mode"
          properties: [exists, checked]
        drawingButton:
          type: element
          selector: "#vector2d-start-draw"
          properties: [text]
        modeStatus:
          type: element
          selector: "#vector2d-mode-status"
          properties: [text]
      expect:
        selectMode: {exists: true, checked: true}
        drawingButton: {text: "그리기 시작"}
        modeStatus: {text: "클릭 검색 모드"}
    - id: open-import-panel
      actions:
        - type: click
          selector: "[data-panel-target='vector2d-import-panel']"
      states:
        importPanel:
          type: element
          selector: "#vector2d-import-panel"
          properties: [exists, visible]
        drawPanel:
          type: element
          selector: "#vector2d-draw-panel"
          properties: [exists, visible]
        sourceCrs:
          type: element
          selector: "#vector2d-source-crs"
          properties: [exists, value]
      expect:
        importPanel: {exists: true, visible: true}
        drawPanel: {exists: true, visible: false}
        sourceCrs: {exists: true, value: "EPSG:3857"}
    - id: empty-import-notice
      actions:
        - type: click
          selector: "[data-panel-target='vector2d-import-panel']"
        - type: click
          selector: "#vector2d-import-add"
      states:
        status:
          type: element
          selector: "#vector2d-import-status"
          properties: [exists, text]
      expect:
        status: {exists: true, text: "WKT 입력이 비어 있습니다."}
sources:
  - {id: main, path: ./vectorLayer2D.main.js, language: javascript, editable: true}
  - {id: ui, path: ./vectorLayer2D.ui.js, language: javascript, editable: true}
  - {id: api, label: API Help, path: ./vectorLayer2D.api.js, language: javascript, editable: true}
  - {id: html, path: ./vectorLayer2D.html, language: html, editable: true}
  - {id: css, path: ./vectorLayer2D.css, language: css, editable: true}
imports: []
migrationSource: vectorLayer2D.html
migrationFingerprint: 8ab5d960a0e763c28af97ae79a0d0ee00c4dc11dca33e761ed63781aa0afe8eb
dependencies: []
---

# 2D 객체 그리기

기본 지도 클릭은 `vectorLayer`의 피처를 검색합니다. 그리기를 시작하면 포인트·라인·폴리곤을 만들고 도형 목록에서 관리합니다.
WFS 건물과 사용자 도형은 `vectorLayer`에, GeoJSON·TopoJSON 입력과 일반 초기 도형은 `subVectorLayer`에 담습니다. 초기 동적 원은 `dynamicCircleLayer`에 담습니다. 검색은 `vectorLayer`만 대상으로 합니다.

## 다루는 기능

- 클릭·교차 검색 결과 목록과 피처 속성 오버레이를 확인합니다.
- 도형 종류와 교차검색 아래의 목록에서 객체를 선택하면 객체 편집 패널이 열립니다. 패널을 닫은 뒤에는 목록에서 객체를 다시 선택해 엽니다.
- 방향 버튼 또는 이동량 입력으로 위치를 바꾸고, 도형 중심을 기준으로 회전·크기를 조절합니다. 지도 좌표(EPSG:3857)의 m 단위이며 실제 지표 거리와는 차이가 있습니다. 포인트의 표시 크기는 스타일의 반경으로 바꿉니다.
- 스타일·파라미터 저장과 복원, 숨김·표시, 검색 제외, 레이어 등록 해제·재등록, 사용자 속성 JSON 편집을 확인합니다. 파라미터 저장은 위치·형상을 포함하지 않습니다.
- 원본 좌표 JSON으로 형상을 교체하고 점을 추가하며, 길이·면적·중심을 즉시 조회합니다. 좌표는 EPSG:3857이고 면의 각 링은 닫혀 있어야 합니다. 구멍과 복합면 좌표도 유지합니다.
- 홈 위치 주변에 처음부터 배치된 포인트·라인·폴리곤·공전 원의 이동·회전을 확인합니다. 공전 원은 폴리곤 좌표로 만듭니다.
- 초기 도형 5개와 직접 그린 도형을 하나의 도형 목록에서 관리합니다. 같은 상세 패널로 색상·투명도·선 두께·포인트 반경을 수정하거나 삭제합니다.
- `service/underground/index.html`의 지진원 표시와 같은 `U2dPoint`·`isDynamicRadius` 방식의 동적 원을 표시합니다. 일반 포인트의 지도 반경과 달리 화면 반경(초기 15픽셀)을 유지하며 확대·축소에 따라 지도 반경을 자동 조정합니다. 동적 원의 상세 패널에서는 화면 반경을 바꿉니다.
- 초기 도형의 위치·회전·크기 또는 좌표를 편집하면 이동·회전 애니메이션이 일시정지합니다. 다시 켜면 변경된 위치와 형상을 유지한 채 이어갑니다. 삭제한 도형은 재개만으로 복구되지 않으며, 초기 배치·스타일 복원 버튼으로 다시 만듭니다.
- WKT·GeoJSON·TopoJSON 입력을 확인합니다. GeoJSON·TopoJSON 입력은 보조 레이어를 교체하므로 초기 목록과 애니메이션도 함께 정리됩니다.

## 사전 조건

배경지도·지형·WFS 데이터를 받을 수 있는 네트워크가 필요합니다. 레이어의 최소 표시 레벨은 15이며, 지형 데이터가 준비되어야 지도 클릭 위치를 계산할 수 있습니다.

로컬 예제의 WFS는 `_vite.config.js`의 `/geoserver/digitaltwin/ows` 프록시를 사용합니다. 개발 서버 설정을 변경했다면 서버를 다시 시작해야 합니다. 첫 요청 대기는 부모 표시를 유지하지만 요청 실패 후에는 이전 벡터를 재사용하거나 벡터 없이 자식 지형을 표시합니다. 재시도와 실패 정보는 유지하며 정상 응답을 받으면 실제 데이터로 교체합니다.

## 관련 API

`U2dVectorShaderLayer.getFeatureByXY()`, `getIntersects()`, `setHighLight()`, `removeHigLight()`, `addGeometry()`, `removeGeometry()`와 `U3dOverlay`를 사용합니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 기본 상태에서 지도의 도형을 클릭합니다. | 검색된 도형의 색이 바뀝니다. 한 건이면 정보 오버레이가 바로 열리고, 여러 건이면 검색 목록이 열립니다. 결과가 없으면 빈 목록으로 안내합니다. |
| 검색 목록에서 한 건을 선택합니다. | 해당 피처의 ID·종류·속성이 U3dOverlay로 표시됩니다. 클릭 검색은 클릭한 지형 위치에, 교차 검색은 피처 중심의 지형 높이에 표시합니다. |
| 정보 오버레이를 드래그합니다. | 정보 창이 이동하고 피처에 고정된 기준점과 노란 앵커 라인으로 연결됩니다. |
| 오버레이의 닫기를 누릅니다. | 단일 결과이면 검색 강조도 해제합니다. 여러 결과의 목록에서 선택한 정보 창이면 오버레이만 닫고 목록과 강조는 유지합니다. |
| 검색 목록의 닫기를 누릅니다. | 목록과 오버레이를 닫고 검색된 도형의 원래 색을 복원합니다. |
| 도형 종류를 선택하고 그리기 시작을 누릅니다. | 버튼이 그리기 종료로 바뀌고 토스트로 조작을 안내합니다. 점은 클릭으로 생성하고, 선·면은 클릭으로 점을 추가한 뒤 더블클릭으로 완성합니다. 완성 후에도 다음 도형을 계속 그릴 수 있습니다. |
| 그리기 시작 위의 교차검색 모드를 체크합니다. | 교차검색 여부만 선택하며 현재 클릭 검색은 유지합니다. 그리기 시작을 눌러야 도형을 그릴 수 있습니다. |
| 교차검색 모드를 체크한 뒤 그리기 시작을 누르고 도형을 완성합니다. | 교차하는 피처가 한 건이면 정보 오버레이를 바로 열고, 여러 건이면 검색 목록을 표시합니다. 검색용 도형도 도형 목록에 추가됩니다. |
| 도형 종류 위에 있는 도형 목록에서 한 건을 선택합니다. | 오른쪽 메인 패널 바로 옆에 도형 정보 패널이 열리고 색·투명도·선 두께·포인트 반경을 개별로 수정할 수 있습니다. |
| 이 도형에 적용을 누릅니다. | 원본 도형과 레이어의 개별 피처 스타일을 같은 커밋으로 갱신해 선택한 도형의 스타일만 바꿉니다. |
| 이 도형 삭제를 누릅니다. | 해당 도형을 지도와 목록에서 제거합니다. |
| 도형 모두 삭제를 누릅니다. | 목록의 초기 도형·직접 그린 도형을 함께 제거하고 애니메이션을 중지합니다. WFS 건물과 별도로 입력한 GeoJSON·TopoJSON 데이터는 유지합니다. |
| 그리기 종료를 누릅니다. | 진행 중인 미완성 도형만 삭제하고 기본 클릭 검색으로 돌아갑니다. 완성한 도형과 교차검색 체크 상태는 유지합니다. |
| WKT를 입력합니다. | vectorLayer와 도형 목록에 추가합니다. |
| GeoJSON·TopoJSON을 입력합니다. | subVectorLayer를 비우고 새 도형을 넣습니다. 이 레이어는 검색 대상이 아닙니다. |

## 검색 범위와 반환값

`getFeatureByXY(경도, 위도, 허용거리 = 0)`는 EPSG:4326 위치를 받고 피처 배열을 반환합니다. 허용 거리는 월드 좌표(EPSG:3857)의 거리이며 예제에서는 1을 사용합니다.
`getIntersects(도형)`는 교차하는 도형 배열을 반환하고 `geometry.getFeature()`로 피처를 얻습니다. 두 경로 모두 `feature.getProperties()`로 속성을 읽습니다.

WFS 검색은 로드된 타일 데이터만 사용합니다. 검색 경계 상자 일부가 미로드이면 콘솔에 **아직 데이터가 로드되지 않았습니다.** 경고를 출력하고 빈 배열을 반환합니다.
로드가 끝난 빈 타일은 경고 없이 빈 결과를 반환합니다. 검색용 도형은 `excludeSearch: true`로 검색에서 제외하되 개별 스타일 수정과 삭제는 허용합니다.

## 벡터 레이어 생성

{{example-code:layer.create}}

## 도형 생성

{{example-code:geometry.create}}

## 좌표 검색

{{example-code:layer.feature-query}}

## 교차검색

{{example-code:geometry.intersects}}

## 정보 오버레이

{{example-code:search.overlay}}

## 검색 해제

{{example-code:layer.highlight-clear}}

## 전체 스타일 변경

{{example-code:layer.style}}

## 목록의 도형 삭제

{{example-code:layer.clear}}

## 외부 데이터 입력

세 형식 모두 JSON 문자열로 입력합니다. WKT 한 개는 큰따옴표로 감싼 문자열, 여러 개는 문자열 배열입니다. 좌표계는 실제 데이터와 일치시켜야 합니다.

{{example-code:import.data}}

## 화면 크기를 유지하는 동적 원

일반 포인트에 영향을 주지 않도록 동적 반경 전용 레이어를 사용합니다. 동적 원도 같은 목록에서 편집·삭제·복원하며, 이동·회전 일시 정지 중에도 카메라에 따른 반경 갱신은 유지됩니다.

{{example-code:geometry.dynamic-circle}}

## 동적 도형 갱신

초기 도형은 `vectorLayer` 예제와 같은 홈 위치(경도 126.9395, 위도 37.52)를 중심으로 배치합니다. 보조 레이어에 있어 지도 클릭 검색에서는 제외하지만, 도형 목록에서 선택해 편집하거나 삭제할 수 있습니다.

{{example-code:feature.update}}
