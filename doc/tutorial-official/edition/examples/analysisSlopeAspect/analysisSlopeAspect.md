---
title: 경사향 분석
theme: pastel-glass-map
output: analysisSlopeAspect.html
editor: true
category: analysis
summary: 지도에서 클릭한 지점을 중심으로 격자를 만들어 경사도와 경사향을 계산하고 방향 화살표로 가시화합니다. 격자 안을 다시 클릭하면 가장 가까운 화살표를 강조하고 값을 POI로 표시합니다.
tags: [경사향, 경사도, 지형 분석, 범례, 화살표 스타일 콜백, POI]
apis: [UAnalySlopeAspect, UAnalySlopeAspect.setArrowStyleFunction, U3dPOI, U3dModelWFSLayer, U3dAPP.getAnalysis, U3dAPP.closestPointAtPixel, U3dAPP.addPOI]
runtime:
  home: {longitude: 126.9395, latitude: 37.52, height: 450, duration: 2, pitch: 60}
  baseLayers: [satellite]
  terrain: {enabled: true, preset: korea}
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
verification:
  legacyUrl: /tutorial-official/examples/analysisSlopeAspect/analysisSlopeAspect.baseline.html
  network:
    allowedRequestFailures:
      - urlPrefix: https://3d.geon.kr/geoserver/digitaltwin/
        reason: 배경 건물 모델을 제공하는 외부 WFS 서버가 localhost 요청을 허용하지 않아 경사향 분석 조작과 무관한 CORS 실패가 발생합니다.
  scenarios:
    - id: open-analysis-panel
      actions:
        # Edition Runtime은 예제 Rail의 첫 패널을 자동으로 열어 두므로 Legacy에서만 패널을 연다.
        - type: click
          targets: [legacy]
          selector:
            legacy: "#analy-bnt"
      states:
        canvas:
          type: element
          selector:
            legacy: "#map canvas"
            edition: "#map canvas"
          properties: [exists, visible]
        panel:
          type: element
          selector:
            legacy: "#analy-popup .div-popup"
            edition: "#slope-aspect-panel"
          properties: [exists, visible]
        aspectMode:
          type: element
          selector:
            legacy: "input[name='mode'][value='aspect']"
            edition: "input[name='analysis-mode'][value='aspect']"
          properties: [exists, checked]
      compare: [canvas, panel, aspectMode]
      expect:
        canvas: {exists: true, visible: true}
        panel: {exists: true, visible: true}
        aspectMode: {exists: true, checked: true}
    - id: switch-slope-mode
      actions:
        - type: click
          targets: [legacy]
          selector:
            legacy: "#analy-bnt"
        - type: click
          selector:
            legacy: "label:has(input[name='mode'][value='slope'])"
            edition: "label:has(input[name='analysis-mode'][value='slope'])"
      states:
        slopeMode:
          type: element
          selector:
            legacy: "input[name='mode'][value='slope']"
            edition: "input[name='analysis-mode'][value='slope']"
          properties: [exists, checked]
        aspectMode:
          type: element
          selector:
            legacy: "input[name='mode'][value='aspect']"
            edition: "input[name='analysis-mode'][value='aspect']"
          properties: [exists, checked]
      compare: [slopeMode, aspectMode]
      expect:
        slopeMode: {exists: true, checked: true}
        aspectMode: {exists: true, checked: false}
    - id: change-grid-option
      actions:
        - type: click
          targets: [legacy]
          selector:
            legacy: "#analy-bnt"
        - type: fill
          selector:
            legacy: ".grid-option-input[name='nx']"
            edition: ".grid-option-input[name='nx']"
          value: "12"
      states:
        gridNx:
          type: element
          selector:
            legacy: ".grid-option-input[name='nx']"
            edition: ".grid-option-input[name='nx']"
          properties: [exists, value]
      compare: [gridNx]
      expect:
        gridNx: {exists: true, value: "12"}
sources:
  - {id: main, path: ./analysisSlopeAspect.main.js, language: javascript, editable: true}
  - {id: ui, path: ./analysisSlopeAspect.ui.js, language: javascript, editable: true}
  - {id: api, label: API Help, path: ./analysisSlopeAspect.api.js, language: javascript, editable: true}
  - {id: html, path: ./analysisSlopeAspect.html, language: html, editable: true}
  - {id: css, path: ./analysisSlopeAspect.css, language: css, editable: true}
imports: []
dependencies: []
---

# 경사향 분석

지도를 클릭한 지점을 중심으로 분석 격자를 만들어 셀마다 경사도와 경사향을 계산하고,
방향과 범례 색상을 가진 화살표로 지형의 기울어진 방향을 확인하는 예제입니다.
결과가 표시된 뒤 격자 안을 다시 클릭하면 가장 가까운 화살표를 강조하고 그 값을 POI로 보여 줍니다.

## 다루는 기능

- 앱에 등록된 경사향 분석 객체를 가져와 격자 크기(m)와 표면 샘플 수를 설정합니다.
- 지도 클릭 위치를 월드 좌표로 변환해 그 지점의 경사도와 경사향을 계산합니다.
- 화살표 머리·꼬리 형상 옵션을 바꿔 표출 중인 화살표 전체를 재분석 없이 다시 그립니다.
- 화살표 스타일 콜백을 그리기뿐 아니라 검색과 선택 강조에도 활용합니다.
- 경사향과 경사도 범례를 바꿔 같은 분석 결과를 다른 기준으로 표현합니다.
- 카메라 거리에 따라 화살표 크기를 보정해 화면상 크기를 일정하게 유지합니다.

## 사전 조건

- 경사도 계산은 지형 높이를 표본으로 사용하므로 한반도 지형 레이어를 내려받을 수 있는 네트워크 환경이 필요합니다.
- 초기 지도에는 위성영상 배경지도와 한반도 지형이 준비됩니다.
- 배경 건물 모델은 기본으로 꺼져 있고 체크박스를 켤 때 생성합니다. 경사도 계산에 사용하지 않으므로 불러오지 못해도 분석 기능은 그대로 사용할 수 있습니다.

## 주요 기능

- 분석 영역의 가로·세로 길이(m)와 표면 샘플 수를 변경합니다. 길이는 미터로 입력하고 분석 객체가 분석 중심 위도의 3857 길이로 환산합니다.
- 화살표 머리(원뿔) 크기·길이와 꼬리(원기둥) 길이·굵기를 변경합니다. 표출 중인 화살표에 즉시 반영됩니다.
- 표출 중인 격자 안을 다시 클릭하면 가장 가까운 화살표를 키워 띄우고 경사도·경사향 값을 POI로 표시합니다. 격자 밖을 클릭하면 그 지점을 중심으로 새로 분석합니다.
- 경사향과 경사도 중 화살표에 적용할 범례를 선택합니다.
- 경사향 8방위와 평탄 지형의 색상, 경사도 단계별 색상과 각도 구간을 편집합니다.
- 분석 중심 좌표, 평균 경사도, 계산에 성공한 셀 수와 강조 화살표 값을 확인합니다.
- 분석 결과와 함께 볼 배경 건물 모델의 표시 여부를 전환합니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 왼쪽 `분석` 버튼을 누릅니다. | 경사향 분석 패널이 열리고 현재 격자 옵션, 화살표 형상 옵션과 범례 색상이 표시됩니다. |
| `건물 모델`을 켭니다. | 건물 레이어를 생성해 표시하고 상태 배지가 `표시 중`으로 바뀝니다. 실패하면 배지가 `불러오기 실패`가 되고 체크가 해제됩니다. |
| 지도에서 지형이 보이는 지점을 클릭합니다. | 클릭 지점을 중심으로 화살표 격자가 나타나고 결과 영역에 중심 좌표, 평균 경사도와 셀 수가 표시됩니다. |
| 표시된 격자 안을 다시 클릭합니다. | 클릭 지점과 가장 가까운 화살표가 2배로 커지며 위로 떠오르고, 그 위에 `경사도 / 경사향 (방위)` 라벨 POI가 생깁니다. 결과 영역의 `강조 화살표`에도 같은 값이 표시됩니다. |
| 격자 안의 다른 위치를 클릭합니다. | 이전 강조와 POI가 사라지고 새 위치에서 가장 가까운 화살표가 강조됩니다. |
| 격자 밖을 클릭합니다. | 강조가 해제되고 그 지점을 중심으로 새 분석이 실행됩니다. |
| 가로·세로 길이(m)나 갯수를 바꿉니다. | 격자 간격과 화살표 수가 바뀌고 마지막 분석 지점이 새 옵션으로 다시 계산됩니다. 강조는 해제됩니다. |
| 머리 크기·길이, 꼬리 길이·굵기를 바꿉니다. | 다시 분석하지 않아도 표출 중인 모든 화살표의 형상이 즉시 바뀝니다. 0 이하 값은 적용되지 않고 원래 값으로 되돌아갑니다. |
| 가시화 모드를 `경사도`로 바꿉니다. | 화살표 색상이 경사도 범례를 따르고, 적용 중인 범례 영역이 강조됩니다. |
| 범례 색상이나 최소·최대값을 바꿉니다. | 다시 분석하지 않아도 화살표 색상이 즉시 갱신됩니다. |
| `분석 지우기`를 누릅니다. | 강조 화살표와 POI, 화살표 격자, 평균 경사도 라벨, 결과 표시가 모두 제거됩니다. |

지형을 내려받지 못했거나 클릭 지점에서 유효한 표면점을 찾지 못하면 결과 상태가 `실패`로 바뀌고
결과 영역에 원인 메시지가 표시됩니다. 이 경우 지형 레이어가 표시되는 위치로 이동한 뒤 다시 클릭합니다.
평탄한 지형에서는 경사가 0인 셀의 화살표를 그리지 않으므로 격자 안을 클릭해도 강조할 화살표가 없을 수 있습니다.

## 관련 API

- `UAnalySlopeAspect`: 분석 격자 생성, 셀별 경사도·경사향 계산과 화살표 가시화를 담당합니다. `getSlope()`는 이전 분석 예약을 취소하고 새 분석으로 대체합니다. `resultGrid`는 계산에 성공한 셀 목록, `grid`는 샘플링한 격자점 좌표입니다.
- `UAnalySlopeAspect.setAnalysisOption()`: 격자의 가로·세로 크기(m), 표면 샘플 수, 화살표 형상 옵션(`arrowHeadSize`, `arrowHeadLength`, `arrowTailLength`, `arrowTailWidth`)과 화살표 스타일 콜백을 변경합니다. 형상 옵션은 0보다 큰 유한한 숫자만 허용하며 표출 중인 화살표에 즉시 반영됩니다. 범례 적용 모드(`mode`)는 이 함수가 아니라 속성으로 설정합니다.
- `UAnalySlopeAspect.setArrowStyleFunction()`: 화살표 스타일 콜백을 교체합니다. 콜백은 렌더마다 모든 셀에 대해 `(셀 정보, 인덱스)` 순으로 호출되고 반환한 `{visible, scale, height, color, opacity}` 중 있는 값만 적용되므로, 셀별 스타일뿐 아니라 검색과 선택 강조에도 활용할 수 있습니다.
- `U3dPOI`, `U3dAPP.addPOI()`, `U3dAPP.removePOI()`: 강조한 화살표 위치에 경사도·경사향 값을 라벨로 표시하고, 다른 지점을 클릭하거나 지울 때 제거합니다.
- `U3dAPP.getAnalysis()`: 앱이 기본으로 등록한 `SlopeAspect` 분석 객체를 반환합니다.
- `U3dAPP.closestPointAtPixel()`: 화면 클릭 위치에서 광선을 쏘아 가장 가까운 교차 지점의 월드 좌표를 반환합니다.
- `U3dModelWFSLayer`: 분석 결과와 함께 확인할 배경 건물 모델 레이어를 구성합니다. 이 레이어는 표면 샘플링 대상이 아니라 결과를 함께 보기 위한 배경입니다.

## 1. 분석 객체 준비

앱에 등록된 경사향 분석 객체를 가져와 초기 격자 옵션과 기본 화살표 스타일 콜백을 설정합니다.
가로·세로 길이는 미터 단위이며, 분석 객체가 분석 중심 위도의 3857 길이로 환산해 격자를 배치합니다.

{{example-code:analysis.create}}

## 2. 화살표 형상 옵션

머리(원뿔)의 반지름·길이와 꼬리(원기둥)의 길이·반지름은 `setAnalysisOption()`의 옵션으로 바꿉니다.
네 값은 모든 화살표에 일괄 적용되고, 표출 중인 결과가 있으면 재분석 없이 즉시 다시 그려집니다.

{{example-code:analysis.arrow-shape}}

## 3. 지도 클릭 흐름

클릭할 때마다 먼저 기본 스타일 콜백으로 되돌려 이전 강조를 지웁니다. 그다음 표출 중인 결과가 없거나
클릭 지점이 격자 영역(양 끝 모서리 격자점으로 만든 XY 경계 상자) 밖이면 그 지점을 중심으로 새로 분석하고,
격자 안이면 가장 가까운 화살표 검색으로 넘어갑니다.

{{example-code:analysis.pick}}

## 4. 가장 가까운 화살표 검색

스타일 콜백은 렌더마다 모든 셀에 대해 인덱스 순으로 호출되므로, 콜백 안에서 클릭 지점과 셀 위치의 XY 거리를
비교하면 별도 순회 없이 다음 렌더 한 번으로 가장 가까운 화살표를 찾을 수 있습니다. 검색 중에도 화살표는
기본 스타일 그대로 그리고, 마지막 셀까지 검사하면 렌더 루프가 끝난 뒤 강조 단계로 넘어갑니다.

{{example-code:analysis.search}}

## 5. 화살표 강조와 값 POI

찾은 인덱스의 화살표만 `scale`을 2배로 키우고 `height`로 표면에서 띄우는 강조 콜백으로 교체합니다.
같은 위치에 `U3dPOI`를 만들어 경사도·경사향 값을 라벨로 표시하고, 다음 클릭에서 기본 콜백으로 되돌릴 때 POI도 제거합니다.

{{example-code:analysis.highlight}}

## 6. 범례 적용 모드 변경

`mode`는 생성 옵션 또는 속성으로만 설정하므로, 값을 바꾼 뒤 다시 그려야 화살표 색상에 반영됩니다.

{{example-code:analysis.mode}}
