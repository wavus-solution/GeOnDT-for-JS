---
title: 3D 객체 그리기
theme: pastel-glass-map
output: vectorLayer.html
editor: true
category: analysis
summary: 지도를 클릭해 포인트, 라인, 실린더, 박스, 구, 파이프 같은 2D·3D 객체를 그리고 스타일과 편집을 확인합니다.
tags: [벡터 레이어, 도형 생성, 기즈모, JSON]
apis:
  - U3dVectorLayer
  - U3dPoint
  - U3dLine
  - U3dCylinder
  - U3dBox
  - U3dCircle
  - U3dSphere
  - U3dPipe
  - U3dUserGeometry
  - U3dPolygonLoftGeometry
  - U3dPathGeometry
  - U3dFault
  - U3dOverlay
  - UAnalyGizmoModel
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
    - id: select-box-geometry
      actions:
        - type: check
          selector: "input[name='type'][value='Box']"
      states:
        canvas:
          type: element
          selector: "#map canvas"
          properties: [exists, visible]
        panel:
          type: element
          selector: "#vector-layer-panel"
          properties: [exists, visible]
        boxType:
          type: element
          selector: "input[name='type'][value='Box']"
          properties: [exists, checked]
        typeHint:
          type: element
          selector: "#vector-type-hint"
          properties: [exists, text]
      expect:
        canvas: {exists: true, visible: true}
        panel: {exists: true, visible: true}
        boxType: {exists: true, checked: true}
        typeHint: {exists: true, text: "지도를 한 번 클릭하면 도형이 완성됩니다."}
    - id: open-export-json-dialog
      actions:
        - type: click
          selector: "#export-json"
      states:
        dialog:
          type: element
          selector: "#export-json-dialog"
          properties: [exists, visible]
        summary:
          type: element
          selector: "#export-json-summary"
          properties: [exists, visible]
      expect:
        dialog: {exists: true, visible: true}
        summary: {exists: true, visible: true}
    - id: open-import-json-dialog
      actions:
        - type: click
          selector: "[data-panel-target='vector-layer-panel']"
        - type: click
          selector: "#import-json"
      states:
        dialog:
          type: element
          selector: "#import-json-dialog"
          properties: [exists, visible]
        input:
          type: element
          selector: "#coord-input"
          properties: [exists, visible]
      expect:
        dialog: {exists: true, visible: true}
        input: {exists: true, visible: true}
    - id: select-listed-geometry
      actions:
        - type: click
          selector: "#geometry-layer-list [data-layer-name='subVectorLayer'][data-geometry-index='0']"
        - type: click
          selector: "#geometry-json-toggle"
      states:
        selectedGeometry:
          type: element
          selector: "#geometry-layer-list [data-layer-name='subVectorLayer'][data-geometry-index='0'][aria-pressed='true']"
          properties: [exists, visible]
        detailPanel:
          type: element
          selector: "#geometry-detail-panel"
          properties: [exists, visible]
        detailName:
          type: element
          selector: "#geometry-detail-name"
          properties: [exists, text]
        detailType:
          type: element
          selector: "#geometry-detail-type"
          properties: [exists, text]
        jsonToggle:
          type: element
          selector: "#geometry-json-toggle[aria-pressed='true']"
          properties: [exists]
        jsonPanel:
          type: element
          selector: "#geometry-json-panel"
          properties: [exists, visible]
      expect:
        selectedGeometry: {exists: true, visible: true}
        detailPanel: {exists: true, visible: true}
        detailName: {exists: true, text: "line1"}
        detailType: {exists: true, text: "라인"}
        jsonToggle: {exists: true}
        jsonPanel: {exists: true, visible: true}
sources:
  - {id: main, path: ./vectorLayer.main.js, language: javascript, editable: true}
  - {id: ui, path: ./vectorLayer.ui.js, language: javascript, editable: true}
  - {id: api, label: API Help, path: ./vectorLayer.api.js, language: javascript, editable: true}
  - {id: html, path: ./vectorLayer.html, language: html, editable: true}
  - {id: css, path: ./vectorLayer.css, language: css, editable: true}
imports: []
migrationSource: vectorLayer.html
dependencies: []
---

# 3D 객체 그리기

지도 위에 포인트, 라인, 실린더, 박스, 원, 구, 파이프, 사용자 도형, 경로 도형과 단층 도형을 그리는 예제입니다.
사용자가 그리는 도형과 초기 공전 도형을 서로 다른 `U3dVectorLayer`에 담고, 도형을 그린 뒤 메인 레이어의 도형을 JSON으로 내보내는 방법을 확인합니다.

## 다루는 기능

- 메인 `vector` 레이어와 초기 공전 도형용 `subVectorLayer`를 만들어 지도에 추가합니다.
- 각 레이어의 도형을 종류와 번호로 붙인 이름(box1, circle1 …)으로 목록에 표시하고, 선택한 도형의 설정을 왼쪽 선택 도형 설정 창에서 개별 변경합니다.
- 켜고 끌 수 있는 JSON으로 설정 창에서 선택한 도형의 설정을 텍스트로도 변경하며, 선택 도형 설정 창의 입력값과 서로 맞춰집니다.
- 도형 종류를 고르고 지도를 클릭해 종류별 기본 설정으로 도형을 생성합니다.
- 메인 레이어에 담긴 도형을 JSON으로 저장하고 팝업에서 확인·복사합니다.
- 기즈모로 생성한 도형의 위치·회전·크기를 편집합니다.

## 사전 조건

- 배경지도(VWorld 위성영상)와 한반도 지형 데이터를 내려받을 수 있는 네트워크 환경이 필요합니다.
- 지형 데이터를 받지 못하면 지형 고도를 0으로 보고 도형을 배치하므로 도형이 지면에 묻혀 보일 수 있습니다.
- 초기 지도는 여의도(경도 126.9395, 위도 37.52) 상공이며, 홈 위치 주변의 `subVectorLayer`에 라인·박스·파이프·구·원 다섯 개가 생성되어 공전합니다.
- 포인트의 기본 이미지 경로는 `image/marker.png`이며, 다른 URL을 넣으면 해당 이미지를 내려받습니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 왼쪽 `객체 그리기` 버튼을 누릅니다. | 도형 종류, 레이어별 도형 목록, 저장·불러오기 버튼이 있는 패널이 열립니다. |
| 도형 종류를 고릅니다. | 안내 문구에 지도 조작 방법이 표시됩니다. 경로 도형은 `그리기` 버튼이, GIZMO는 편집 버튼이 함께 표시됩니다. |
| 레이어별 도형 목록을 확인합니다. | 각 항목에 종류 배지와 도형 이름이 표시됩니다. 이름은 도형 종류와 번호(box1, circle1)로 레이어마다 따로 붙으며, 도형을 지워도 남은 도형의 이름은 바뀌지 않습니다. |
| 레이어별 도형 목록에서 항목을 누릅니다. | 지도에서 해당 도형의 윤곽을 따라 노란 외곽선이 표시되고, 왼쪽에 선택 도형 설정 창이 열려 도형 이름과 현재 설정이 표시됩니다. 바꾼 항목은 선택한 도형에만 적용됩니다. |
| 선택 도형 설정 창에서 `JSON으로 설정`을 누릅니다. | 버튼의 표시등이 켜지고 옆에 JSON으로 설정 창이 열립니다. 켠 상태는 다른 도형을 골라도 유지되며, 다시 누르거나 JSON으로 설정 창의 `×`를 누르면 꺼집니다. |
| JSON으로 설정 창에서 값을 고치고 `선택 도형에 적용`을 누릅니다. | 선택한 도형에 설정이 반영되고 선택 도형 설정 창의 입력값도 같은 값으로 바뀝니다. 반대로 선택 도형 설정 창에서 값을 바꾸면 JSON도 갱신됩니다. 형식이나 값이 틀리면 창 안에 원인이 표시되고, `현재 설정 다시 채우기`를 누르면 도형의 현재 설정으로 되돌아갑니다. |
| 선택 도형 설정 창의 `×`를 누릅니다. | 선택이 해제되고 열린 창이 모두 닫히며, 현재 도형 종류의 새 도형 생성 모드로 돌아갑니다. |
| 선택 도형 설정 창에서 `선택 도형 삭제`를 누릅니다. | 선택한 도형 하나만 지워지고 목록에서 사라지며 왼쪽 창이 닫힙니다. 현재 도형 종류의 새 도형 생성 모드로 돌아가고 다른 도형은 그대로 남습니다. 마지막 단층 도형을 지우면 지하 모드와 배경지도 투명도도 원래대로 돌아옵니다. |
| 도형이 선택된 상태에서 도형 종류를 바꿉니다. | 선택이 해제되고 왼쪽 창이 닫히며 바꾼 종류의 새 도형 생성 모드로 돌아갑니다. |
| 도형 종류를 바꿉니다. | 이미 그린 도형은 그대로 두고 새로 만들 도형에만 해당 종류의 기본 설정이 적용됩니다. |
| 포인트·박스·원·구·실린더를 고르고 지도를 클릭합니다. | 클릭한 지점에 도형 하나가 바로 완성됩니다. |
| 라인·파이프·사용자도형을 고르고 지도를 두 번 이상 클릭합니다. | 클릭할 때마다 점이 이어지고, 더블클릭하면 도형이 완성되어 다음 클릭부터 새 도형이 시작됩니다. |
| Loft도형을 고르고 지도를 세 번 이상 클릭합니다. | 점이 세 개 모여야 면이 만들어지며, 두 개 이하일 때는 아무것도 그려지지 않습니다. |
| 단층 도형을 고르고 지도를 한 번 클릭합니다. | 클릭한 지점에서 주향과 길이 설정대로 단층면이 바로 완성됩니다. 지하 모드가 켜지고 배경지도가 반투명해져 지표면 아래에서 확인할 수 있습니다. |
| 이어서 지도를 더 클릭합니다. | 처음에 만들어진 단층면을 버리고 클릭한 점들을 잇는 단층면으로 다시 만듭니다. 이때는 주향 설정 대신 클릭한 방향을 따릅니다. |
| 경로 도형에서 `그리기`를 누르고 지도를 클릭합니다. | 그리기 모드가 시작되어 버튼이 비활성화되고, 더블클릭하면 경로가 완성되어 편집 모드로 바뀝니다. |
| 완성한 경로의 점을 클릭합니다. | 해당 점 위에 높이 입력 오버레이가 나타나고, 값을 입력한 뒤 `확인`을 누르면 경로 높이가 반영됩니다. |
| `불러오기`를 누릅니다. | JSON을 붙여 넣을 수 있는 팝업이 열립니다. |
| 팝업에 도형 JSON을 넣고 `확인`을 누릅니다. | 입력한 JSON 좌표에 도형이 만들어지고 개수가 표시된 뒤 팝업이 닫힙니다. `저장하기`로 얻은 내용을 통째로 넣으면 도형을 이름(`name`)까지 한 번에 되살리고, 같은 이름의 도형이 이미 있으면 새 번호를 붙입니다. 형식이 틀리면 팝업에 원인이 표시됩니다. |
| `저장하기`를 누릅니다. | 사용자가 만든 도형이 JSON으로 변환되어 팝업에 표시되고 브라우저 콘솔에도 출력됩니다. 예제 기본 공전 도형은 다른 레이어에 있어 저장되지 않습니다. |
| `GIZMO`를 고르고 `편집`을 누른 뒤 도형을 클릭합니다. | 선택한 도형에 기즈모가 붙고 이동·회전·크기 버튼으로 조작 방식을 바꿀 수 있습니다. |
| `지우기`를 누릅니다. | 사용자가 만든 도형과 공전 도형이 모두 사라지고 지하 모드와 배경지도 투명도가 원래대로 돌아옵니다. 저장·불러오기와 달리 `subVectorLayer`까지 비웁니다. |


## 관련 API

- `U3dVectorLayer`: 사용자가 생성한 도형은 메인 `vector` 레이어에, 초기 공전 도형은 `subVectorLayer`에 나누어 담습니다. `addGeometry()`로 도형을 추가하고 `clear()`로 레이어의 전체 도형을 지웁니다.
- `U3dPoint`, `U3dLine`, `U3dCylinder`, `U3dBox`, `U3dCircle`, `U3dSphere`, `U3dPipe`: 클릭 좌표로 만드는 기본 2D·3D 도형입니다. 도형마다 사용하는 생성 옵션이 다릅니다.
- `U3dUserGeometry`, `U3dPolygonLoftGeometry`: 여러 점을 이어 만드는 사용자 정의 입체 도형입니다.
- `U3dPathGeometry`: 그리기 모드(`draw()`)에서 점을 받아 경로를 만들고, 완성한 뒤 점 단위로 높이를 편집할 수 있습니다.
- `U3dFault`: 지하에 단층면을 만듭니다. 범례 색상 배열로 면의 색을 지정하며 지하 모드에서 확인합니다.
- `U3dOverlay`: 경로 점을 편집할 때 높이 입력 화면을 지도 위에 표시합니다.
- `UAnalyGizmoModel`: `app.getAnalysis('GizmoModel')`로 가져와 선택한 도형에 이동·회전·크기 기즈모를 연결합니다.
- `U3dObjectBarrier`: 목록에서 선택한 도형의 윤곽에 외곽선을 표시합니다. `setBarrier()`로 외곽선을 걸고 `removeBarrier()`로 해제하며, 도형의 색상·투명도·와이어프레임 설정은 바꾸지 않습니다.

깊이 보정(`depthOffset`)은 실린더, 박스, 구, 원, 파이프에만 재질로 반영되므로 다른 도형에서는 입력란을 표시하지 않습니다.

## 벡터 레이어 생성

사용자 생성 도형용 메인 레이어와 초기 공전 도형용 보조 레이어를 만들어 지도에 추가하고 표시합니다.

{{example-code:vector.layer}}

## 도형 생성

선택한 종류와 현재 생성 옵션으로 도형 인스턴스를 만들고 벡터 레이어에 추가합니다.

{{example-code:geometry.create}}

## 선택 도형 삭제

목록에서 고른 도형 하나만 `removeGeometry()`로 레이어에서 제거합니다. 전체 삭제는 `clear()`를 사용합니다.

{{example-code:geometry.remove}}
