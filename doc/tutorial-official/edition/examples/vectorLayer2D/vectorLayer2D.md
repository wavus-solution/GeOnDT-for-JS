---
title: 2D 객체 그리기
theme: pastel-glass-map
output: vectorLayer2D.html
editor: true
category: analysis
summary: 지도를 클릭해 포인트, 라인, 폴리곤을 그리고 스타일 변경, 교차검색, WKT·GeoJSON·TopoJSON 입력을 확인합니다.
tags: [2D 객체, 벡터 레이어, 교차검색, WKT, GeoJSON, TopoJSON]
apis:
  - U2dVectorShaderLayer
  - U2dPoint
  - U2dLine
  - U2dPolygon
runtime:
  home: {longitude: 127.54986578024146, latitude: 36.70378269796982, height: 450, duration: 2, pitch: 60}
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
      expect:
        selectMode: {exists: true, checked: true}
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

지도를 클릭해 포인트, 라인, 폴리곤을 `U2dVectorShaderLayer`에 그리는 예제입니다.
사용자가 그린 도형과 외부에서 읽어 온 도형을 서로 다른 레이어에 담고, 스타일 변경·교차검색·좌표 갱신이 어떤 API로 이어지는지 확인합니다.

## 다루는 기능

- `U2dVectorShaderLayer`를 만들어 지도에 추가하고, `styleFunction`으로 도형이 추가될 때의 표시 스타일을 결정합니다.
- 지도 클릭 좌표로 `U2dPoint`, `U2dLine`, `U2dPolygon`을 만들어 `addGeometry()`로 레이어에 넣습니다.
- `setStyle()`로 레이어에 담긴 전체 도형의 색·투명도·선 두께를 한 번에 바꿉니다.
- `getIntersects()`로 그린 도형과 겹치는 객체를 찾고 `setHighLight()`로 강조하며, `removeHigLightAll()`로 되돌립니다.
- `getFeatureByXY()`로 클릭 지점의 feature 정보를 조회합니다.
- `addGeometryAsWKT()`, `addGeometryAsGeojson()`, `addGeometryAsTopojson()`으로 외부 좌표 데이터를 도형으로 만듭니다.
- `beginFeatureUpdate()`와 `commitFeatureUpdate()`로 이미 추가한 도형의 좌표를 반복 갱신합니다.

## 사전 조건

- 배경지도(VWorld 위성영상)와 한반도 지형 데이터를 내려받을 수 있는 네트워크 환경이 필요합니다.
- 초기 지도는 세종 인근(경도 127.5499, 위도 36.7038) 상공이며, 홈 위치 주변에서 노란 원 하나가 `subVectorLayer`에 담겨 시계 방향으로 공전합니다.
- 두 레이어 모두 최소 표시 레벨이 15입니다. 이보다 넓게 축소하면 그린 도형이 지형 tile에 합성되지 않아 화면에서 사라집니다.
- 도형은 지형 위에 합성되므로 지형 데이터를 받지 못하면 클릭 좌표를 계산하지 못하고 아무 도형도 만들어지지 않습니다.
- WKT·GeoJSON·TopoJSON 입력은 별도 서버 없이 입력창의 문자열만 사용합니다. 좌표계가 실제 데이터와 다르면 도형이 엉뚱한 위치에 놓입니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 왼쪽 `객체 그리기` 버튼을 누릅니다. | 도형 종류, 스타일, 교차검색, 동적 도형, 조회 결과 구획이 있는 패널이 열립니다. |
| 도형 종류를 고릅니다. | 구획 아래 안내 문구가 그 종류의 지도 조작 방법으로 바뀝니다. |
| `포인트`를 고르고 지도를 클릭합니다. | 클릭 지점에 원이 하나 완성되고, 조회 결과에 클릭 위경도와 그 위치의 feature 정보가 표시됩니다. |
| `라인` 또는 `폴리곤`을 고르고 지도를 여러 번 클릭합니다. | 클릭할 때마다 점이 이어지고, 더블클릭하면 도형이 완성되어 다음 클릭부터 새 도형이 시작됩니다. |
| 스타일 구획의 색·투명도·선 두께를 바꿉니다. | 값은 **다음에 만들 도형**에만 적용됩니다. 이미 그린 도형은 그대로입니다. |
| `레이어 전체에 적용하기`를 누릅니다. | 레이어에 담긴 도형이 모두 현재 설정으로 바뀝니다. `nonChanged: true`로 만든 검색용 도형은 바뀌지 않습니다. |
| `교차검색 모드`를 켜고 지도를 클릭합니다. | 이번에 그리는 도형은 초록·노랑 고정 색으로 만들어지고, 겹치는 도형이 강조되며 조회 결과에 교차 객체 수가 표시됩니다. |
| `검색객체 초기화`를 누릅니다. | 강조 표시만 해제되고 도형은 그대로 남습니다. |
| `공전하는 원` 체크를 끕니다. | 원이 그 자리에 멈춥니다. 다시 켜면 멈춘 각도에서 이어 돕니다. |
| `지우기`를 누릅니다. | 두 레이어의 도형이 모두 사라지고 조회 결과가 초기 상태로 돌아갑니다. 공전하는 원은 다시 등록되어 계속 돕니다. |
| 왼쪽 `데이터 입력` 버튼을 누릅니다. | 좌표계, 데이터 형식, 데이터 입력, 불러오기 결과 구획이 있는 패널로 바뀝니다. 객체 그리기 패널은 닫힙니다. |
| 데이터 형식에서 `WKT`, `GeoJSON`, `TopoJSON` 중 하나를 고릅니다. | 입력창은 하나만 유지되고, 구획 아래 안내가 그 형식의 작성 방법과 도형이 담길 레이어로 바뀝니다. |
| 입력창을 비운 채 `적용하기`를 누릅니다. | 불러오기 결과에 고른 형식의 이름과 함께 입력이 비어 있다는 안내가 표시되고 도형은 만들어지지 않습니다. |
| `WKT`를 고르고 내용을 넣은 뒤 `적용하기`를 누릅니다. | `vectorLayer`에 도형이 더해지고 만든 수가 표시되며 카메라가 그 범위로 이동합니다. 형식이 틀리면 실패 원인이 같은 자리에 표시됩니다. |
| `GeoJSON` 또는 `TopoJSON`을 고르고 `적용하기`를 누릅니다. | `subVectorLayer`를 비운 뒤 새 도형을 채우고 그 범위로 이동합니다. 공전하던 원도 함께 지워지므로 `공전하는 원` 체크가 꺼지며, 다시 켜면 원이 새로 등록되어 돕니다. |

## 관련 API

- `U2dVectorShaderLayer`: 2D 도형을 지형 tile에 합성해 그리는 레이어입니다. 사용자가 그린 도형과 WKT 입력은 `vectorLayer`에, GeoJSON·TopoJSON 입력과 공전하는 원은 `subVectorLayer`에 나누어 담습니다. 최소 표시 레벨 생성자 Key는 `minlevel`이 아니라 `minLevel`이며, 선언하지 않으면 15가 적용됩니다.
- `U2dPoint`: 한 번의 클릭으로 완성되는 원형 도형입니다. `radius` 옵션을 사용하며 다른 도형은 이 값을 쓰지 않습니다.
- `U2dLine`, `U2dPolygon`: `addPosition()`으로 점을 이어 붙여 만드는 도형입니다. 이 예제는 더블클릭을 완성 시점으로 사용합니다.
- `U2dVectorShaderLayer.setStyle()`: 레이어 전체 도형의 스타일을 갱신합니다. 외곽선 굵기가 바뀌면 인접 지형 tile 바인딩도 함께 다시 계산합니다.
- `U2dVectorShaderLayer.getIntersects()`: 넘긴 도형과 겹치는 도형 배열을 돌려줍니다. 겹치는 도형이 없으면 `undefined`가 나올 수 있어 배열로 쓰기 전에 확인합니다.
- `U2dVectorShaderLayer.beginFeatureUpdate()` / `commitFeatureUpdate()`: 이미 추가한 도형의 좌표를 바꿀 때 쌍으로 사용합니다. `commitFeatureUpdate()`가 반환하는 Promise가 끝나야 화면에 반영됩니다.

도형 생성 옵션의 `excludeSearch`는 그 도형을 교차검색 결과에서 빼고, `nonChanged`는 생성 이후의 외부 스타일 변경을 막습니다. 교차검색 모드에서 만드는 도형에 두 값을 모두 켜서 검색용 도형이 스스로 검색되거나 `setStyle()`로 색이 바뀌지 않게 합니다.

## 벡터 레이어 생성

사용자가 그린 도형을 담을 레이어를 만들어 지도에 추가하고 표시합니다. `styleFunction`은 도형이 추가될 때마다 호출되어 그 도형의 표시 스타일을 결정합니다.

{{example-code:layer.create}}

## 도형 생성

선택한 종류와 현재 스타일 설정으로 도형을 만들어 레이어에 추가합니다. 교차검색 모드에서는 검색용 도형임을 표시하는 옵션을 함께 지정합니다.

{{example-code:geometry.create}}

## 레이어 전체 스타일 변경

레이어에 담긴 모든 도형의 스타일을 한 번에 바꿉니다. 반환하는 Promise가 끝나야 화면에 반영됩니다.

{{example-code:layer.style}}

## 교차검색

방금 그린 도형과 겹치는 도형을 찾아 강조합니다. `setHighLight()`에 스타일을 넘기지 않으면 기본 검색 스타일이 적용되고, 레이어 스타일이 바뀌어도 강조 스타일이 우선합니다.

{{example-code:geometry.intersects}}

## 데이터 형식별 입력

형식마다 호출하는 함수와 도형을 담을 레이어가 다릅니다. 세 형식 모두 JSON 문자열이라 형식 오류는 `JSON.parse()`에서 먼저 드러납니다.

{{example-code:import.data}}

## 도형 좌표 갱신

이미 추가한 도형의 좌표를 바꿀 때는 `beginFeatureUpdate()`로 갱신 구간을 열고 `commitFeatureUpdate()`로 닫습니다. 합성이 끝나기 전에 들어온 좌표는 마지막 값만 남겨 중간 단계가 쌓이지 않게 합니다.

{{example-code:feature.update}}

## API Help

패널의 각 조작에는 실제 구현 위치와 현재 설정으로 만든 코드가 함께 붙어 있습니다. 도형 종류·스타일·좌표계를 바꾼 뒤 같은 항목을 다시 열면 지금 값이 반영된 코드가 나옵니다. 도움말을 꺼도 예제 기능은 그대로 동작합니다.
