---
title: 단면 분석
theme: pastel-glass-map
output: analysisSection.html
editor: true
category: analysis
summary: 횡단면·종단면·원통·원반경 영역으로 건물과 지하시설물을 선택하고 결과를 확인합니다.
tags: [단면, 횡단면, 종단면, 원통, 지하시설물, WFS]
apis: [UAnalySection, UAnalySection.setType, UAnalySection.getFilteredList, UAnalySection.getFilteredObject, U3dModelWFSLayer]
runtime:
  home: {longitude: 129.155, latitude: 35.1596, height: 435, duration: 2, pitch: 45}
  baseLayers: [satellite]
  terrain: {enabled: true, preset: korea}
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
verification:
  network:
    allowedRequestFailures:
      - urlPrefix: https://dt-data.mappick.co.kr/ServiceData/model-2.2/busan/
        reason: 외부 부산 U3F 서버의 데이터 제공 상태와 접근 허용 환경에 따라 요청이 실패할 수 있습니다.
      - urlPrefix: https://3d.geon.kr/geoserver/digitaltwin/
        reason: 외부 WFS 서버가 localhost 요청을 허용하지 않는 환경에서는 모델 데이터를 불러올 수 없습니다.
  scenarios:
    - id: initial-panel
      states:
        panel: {type: element, selector: "#section-panel", properties: [visible]}
      expect:
        panel: {visible: true}
    - id: cancel-drawing
      actions:
        - {type: click, selector: "[data-section-start]"}
        - {type: click, selector: "[data-section-cancel]"}
      states:
        status: {type: element, selector: "[data-section-status]", properties: [text]}
      expect:
        status: {text: "그리기를 취소했습니다. 완료한 영역은 유지합니다."}
    - id: reset
      actions:
        - {type: click, selector: "[data-section-reset]"}
      states:
        empty: {type: element, selector: "[data-section-empty]", properties: [visible]}
      expect:
        empty: {visible: true}
sources:
  - {id: main, path: ./analysisSection.main.js, language: javascript, editable: true}
  - {id: ui, path: ./analysisSection.ui.js, language: javascript, editable: true}
  - {id: html, path: ./analysisSection.html, language: html, editable: true}
  - {id: css, path: ./analysisSection.css, language: css, editable: true}
featured: true
migrationSource: analysisSection.html
---

# 단면 분석

지도에 횡단면·종단면·원통·원반경 영역을 만들고 포함된 건물과 지하시설물을 확인합니다. 완료한 영역은 목록에서 펼쳐 모델 식별자를 확인하거나 개별 삭제할 수 있습니다.

우측의 ‘단면 분석’, ‘데이터’, ‘투명도’ 버튼으로 각 패널을 엽니다. 단면 분석 패널에서는 영역 그리기와 결과를, 데이터 패널에서는 대상 레이어와 지하 보기를, 투명도 패널에서는 영상·모델의 불투명도를 조절합니다.

## 다루는 기능

- `UAnalySection.setType()`과 `active()`로 네 가지 단면 입력을 시작합니다.
- `getFilteredList()`와 `getFilteredObject()`로 영역별 분석 유형·높이·포함 모델을 확인합니다.
- `removeFilter()`로 특정 영역을 지우고, 예제 소유의 분석만 초기화합니다.
- `U3dModelWFSLayer`와 U3F 건물의 표시를 바꾸고 영상·모델의 전역 투명도를 조절합니다.

## 사전 조건

GeOnDT 라이선스, WebGL 지원 브라우저와 외부 데이터 서버 연결이 필요합니다. 시작 위치는 부산이며 U3F 건물을 먼저 준비합니다. 건물이 보이지 않으면 2.5D 건물을 선택하고 확대 수준과 서버 연결 상태를 확인하세요. 지하시설물은 부산 WFS 데이터가 제공되는 범위에서 확인할 수 있습니다.

배경지도와 지형은 공통 런타임이 관리합니다. 지하 보기와 영상 투명도를 함께 조절하면 지하 데이터를 관찰하기 쉽습니다. 지형·배경지도 표시 변경은 우측 공통 패널을 사용하세요.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 횡단면을 선택하고 ‘영역 그리기’를 누릅니다. | 세 지점 이상을 클릭한 뒤 더블클릭하면 엔진의 높이 입력창이 열립니다. 입력한 높이의 영역과 모델 목록을 만듭니다. |
| 종단면을 선택하고 ‘영역 그리기’를 누릅니다. | 시작·끝 지점을 찍고 격자 위에 단면 윤곽을 그린 뒤 더블클릭하면 영역을 완성합니다. |
| 원통을 선택하고 ‘영역 그리기’를 누릅니다. | 시작점을 클릭한 뒤 반경·높이를 마우스로 정하고 다시 클릭하면 원통 영역을 만듭니다. |
| 원반경을 선택하고 ‘영역 그리기’를 누릅니다. | 중심과 반경을 두 번의 클릭으로 정하면 원형 영역을 만듭니다. |
| 분석 유형을 바꾸거나 ‘그리기 취소’를 누릅니다. | 진행 중인 입력만 취소하고 완료한 영역은 유지합니다. |
| 우측 ‘데이터’ 버튼을 누르고 레이어를 선택합니다. | 별도 데이터 패널에서 준비 상태를 표시하고 해당 건물·지하시설물을 불러옵니다. |
| 우측 ‘투명도’ 버튼을 누르고 영상·모델 투명도를 켠 뒤 슬라이더를 움직입니다. | 별도 투명도 패널에서 0은 투명, 1은 불투명으로 표시합니다. |
| 결과 항목을 펼칩니다. | 영역 ID, 분석 유형, 모델 수와 원본 모델 ID를 확인합니다. 횡단면은 입력 높이도 표시합니다. |
| 개별 ‘삭제’ 또는 ‘전체 지우기’를 누릅니다. | 해당 영역 또는 예제에서 만든 모든 영역·선택 표시를 제거합니다. |

개별 삭제는 그리기를 마치거나 취소한 뒤 사용할 수 있습니다. 진행 중인 입력의 측정 도형과 기존 영역 정리가 서로 간섭하지 않도록 그리는 동안에는 삭제 버튼을 잠급니다.

삭제 버튼은 결과 카드 오른쪽에 표시되며 항목을 접어도 사용할 수 있습니다. 모델 ID는 `getOid()`의 원본 식별자를 우선 표시하고, 원본 식별자가 없는 경우 현재 메시의 식별자를 표시합니다.

결과는 **영역 생성 당시 로드된 모델**을 대상으로 합니다. 레이어를 나중에 켜거나 모델이 추가 로드되었으면 새 영역으로 다시 분석하세요. 결과가 0개여도 영역은 생성될 수 있으므로 지도에 대상 모델이 실제로 표시되는지 먼저 확인하세요.

## 관련 API

유형 변경은 `setType()` 후 `active()`로 반영합니다. 완료와 시작점 입력이 같은 `click` 이벤트를 사용하므로 `getFilteredList()`에 결과가 생긴 경우에만 완료 처리합니다. 영역마다 분석 객체를 별도로 등록해 취소·삭제가 다른 완료 영역을 초기화하지 않도록 합니다.

{{example-code:main:section.draw}}

기존 부산 U3F 주소와 전국 건물·부산 지하시설물 WFS 설정을 사용합니다. 레이어를 처음 켤 때 생성하고 준비가 끝난 뒤 마지막으로 요청한 표시 상태를 적용합니다. 종료 후 완료된 비동기 요청은 화면에 반영하지 않습니다.

{{example-code:main:section.layers}}

`removeFilter()`로 영역을 제거하고 `removeAnalysis()`로 예제 전용 분석 등록과 나머지 표시를 정리합니다. 공통 앱·배경지도·지형과 다른 기능의 분석은 유지하며, 종료 시 변경한 전역 투명도 설정을 복원합니다.

{{example-code:main:section.remove}}

횡단면 높이는 현재 엔진의 기본 입력창을 사용합니다. 입력창의 취소·숫자 검증과 높이 좌표 변환은 엔진의 현행 동작을 따릅니다.
