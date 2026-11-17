---
title: 평균 높이 분석
theme: pastel-glass-map
output: averageHeight.html
editor: true
category: analysis
summary: 클릭·다각형으로 건물을 선택하고 모델의 월드 Z축 평균 높이를 계산합니다.
tags: [평균 높이, 건물, 선택, 다각형, AverageHeight]
apis: [U3dApp.getAnalysis, UAnalyAverageHeight.active, UAnalyAverageHeight.setSelectType, UAnalyAverageHeight.getSelector, UAnalyAverageHeight.getSelectedModelHeight, UAnalyAverageHeight.getAverageHeight, UAnalyAverageHeight.clear, UAnalyAverageHeight.deactive]
runtime:
  home: {longitude: 126.9395, latitude: 37.52, height: 450, duration: 2, pitch: 60}
  baseLayers: [satellite]
  terrain: {enabled: true, preset: korea}
  modelLayers:
    - preset: seoul_u3f
      visible: true
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
verification:
  scenarios:
    - id: initial-panel
      states:
        panel: {type: element, selector: "#average-height-panel", properties: [visible]}
        average: {type: element, selector: "[data-average-value]", properties: [text]}
      expect:
        panel: {visible: true}
        average: {text: "—"}
    - id: stop-analysis
      actions:
        - {type: click, selector: "[data-average-active]"}
      states:
        status: {type: element, selector: "[data-average-status]", properties: [text]}
      expect:
        status: {text: "평균 높이 분석을 종료했습니다. 일반 지도 조작을 사용할 수 있습니다."}
    - id: clear-selection
      actions:
        - {type: click, selector: "[data-average-clear]"}
      states:
        count: {type: element, selector: "[data-average-count]", properties: [text]}
      expect:
        count: {text: "0"}
sources:
  - {id: main, path: ./averageHeight.main.js, language: javascript, editable: true}
  - {id: ui, path: ./averageHeight.ui.js, language: javascript, editable: true}
  - {id: html, path: ./averageHeight.html, language: html, editable: true}
  - {id: css, path: ./averageHeight.css, language: css, editable: true}
featured: true
migrationSource: averageHeight.html
---

# 평균 높이 분석

지도에서 선택한 건물 모델의 평균 높이를 계산합니다. 선택 객체의 식별값과 높이를 함께 확인하며 클릭 선택과 다각형 선택을 전환할 수 있습니다.

## 다루는 기능

- 공통 런타임으로 배경지도·지형·서울 U3F 모델을 준비합니다.
- `UAnalyAverageHeight`의 `single`·`polygon` 모드로 모델을 선택합니다. U3F 병합 모델은 건물에 해당하는 재질 구간을 부분 선택합니다.
- 선택 완료 이벤트에서 객체 목록을 읽고 중복 식별값을 제외합니다.
- `getAverageHeight()`로 평균을 계산하고 선택 변경 시 이전 값을 지웁니다.
- 분석 종료 시 선택기를 정리하고 일반 지도 조작으로 돌아갑니다.

## 사전 조건

GeOnDT 라이선스와 WebGL 지원 브라우저가 필요합니다. 건물 모델은 외부 데이터 서버를 사용하므로 접근이 제한되면 선택할 건물이 나타나지 않을 수 있습니다. 지도에 건물이 로드된 뒤 선택하세요.

이 예제의 높이는 **월드 좌표(EPSG:3857)의 축 정렬 경계 상자에서 구한 Z축 길이(m)**입니다. 실제 지상 건물 높이로 환산하지 않으므로 위도·모델 변환에 따라 지상 높이와 차이가 날 수 있습니다. 병합 모델은 API가 제공하는 내부 객체별 높이를 사용합니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 지도에서 건물을 클릭합니다. | 선택 객체와 높이가 패널에 표시됩니다. Shift를 누르고 클릭하면 선택을 추가합니다. |
| ‘다각형 선택’을 고르고 세 지점 이상을 클릭한 뒤 더블클릭합니다. | 영역에 포함된 모델의 선택이 완료되면 목록이 갱신됩니다. |
| ‘평균 높이 계산’을 누릅니다. | 현재 선택의 평균 높이가 소수점 세 자리로 표시됩니다. |
| 선택을 변경하거나 선택 방식을 바꿉니다. | 이전 평균값을 지우며 새 선택에서 다시 계산할 수 있습니다. |
| ‘선택 초기화’를 누릅니다. | 선택 강조·목록·평균값을 지우고 현재 선택 방식을 유지합니다. |
| ‘평균 높이 분석 실행’을 끕니다. | 선택기와 결과를 정리하고 일반 지도 조작을 사용할 수 있습니다. 다시 켜면 새 선택을 시작합니다. |

고도 타일은 클릭·다각형 선택 목록과 평균 계산에서 제외합니다. 건물 등의 3D Tiles 모델은 계산 대상입니다.

선택하지 않았을 때는 평균을 0으로 표시하지 않고 ‘—’로 표시하며 계산 버튼을 비활성화합니다. 같은 객체는 한 번만 집계합니다. 목록에는 현재 선택 순서의 객체 번호를 표시합니다. 객체 번호를 펼치면 모델이 제공하는 전체 식별값을 확인할 수 있습니다. 전체 식별값은 내부 조회용 값이며 영구 식별자를 보장하지 않습니다.

## 관련 API

앱의 클릭 이벤트보다 분석의 `select` 이벤트를 사용해 비동기 선택과 다각형 선택이 확정된 뒤 목록을 읽습니다. 분석 재활성화가 이전 이벤트를 정리할 수 있어 활성화 후 리스너를 등록합니다.

{{example-code:main:averageHeight.selection}}

`getSelectedModelHeight()`로 객체별 높이를 표시하고 `getAverageHeight()`로 전체 평균을 계산합니다. 유효한 선택과 유한한 계산값을 확인한 뒤 결과를 반영합니다. 선택과 계산 사이에 대상이 바뀌어도 현재 선택을 다시 읽습니다.

{{example-code:main:averageHeight.calculate}}

예제 종료 시 자신이 등록한 리스너를 해제하고 분석 선택기를 종료합니다. 공통 앱·배경지도·지형·모델 레이어의 정리는 공통 런타임이 담당합니다.
