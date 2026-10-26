---
title: 객체 정보조회 예제
theme: pastel-glass-map
output: selectModel.html
editor: true
category: analysis
summary: 지도에서 3차원 모델을 선택하여 레이어와 객체 정보를 조회합니다.
tags: [객체 선택, U3F, WFS, 오버레이]
apis: [U3dSelect, U3dOverlay, U3dModelWFSLayer, create3DFModelLayer]
runtime:
  home: {longitude: 126.9395, latitude: 37.52, height: 450, duration: 2, pitch: 60}
  baseLayers: [satellite]
  terrain: {enabled: true, preset: korea}
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
verification:
  legacyUrl: /tutorial-official/examples/selectModel/selectModel.baseline.html
  scenarios:
    - id: select-area-mode
      actions:
        # Edition Runtime은 예제 Rail의 첫 패널을 자동으로 열어 두므로 Legacy에서만 패널을 연다.
        - type: click
          targets: [legacy]
          selector:
            legacy: "#analy-bnt"
        - type: click
          selector:
            legacy: ".selectCheck[target='area']"
            edition: "label:has(input[name='select-mode'][value='area'])"
      states:
        canvas:
          type: element
          selector:
            legacy: "#map canvas"
            edition: "#map canvas"
          properties: [exists, visible]
        queryPanel:
          type: element
          selector:
            legacy: "#analy-popup .div-popup"
            edition: "#object-query-panel"
          properties: [exists, visible]
        areaMode:
          type: element
          selector:
            legacy: ".selectCheck[target='area']"
            edition: "input[name='select-mode'][value='area']"
          properties: [exists, checked]
      compare: [canvas, queryPanel, areaMode]
      expect:
        canvas: {exists: true, visible: true}
        queryPanel: {exists: true, visible: true}
        areaMode: {exists: true, checked: true}
sources:
  - {id: main, path: ./selectModel.main.js, language: javascript, editable: true}
  - {id: ui, path: ./selectModel.ui.js, language: javascript, editable: true}
  - {id: api, label: API Help, path: ./selectModel.api.js, language: javascript, editable: true}
  - {id: html, path: ./selectModel.html, language: html, editable: true}
  - {id: css, path: ./selectModel.css, language: css, editable: true}
featured: true
---

# 객체 정보조회 예제

지도에서 3차원 모델을 선택하여 레이어 이름, 객체 ID와 좌표를 확인하는 예제입니다.

## 다루는 기능

- 모델 레이어별 조회 대상과 선택 방식을 바꾸고, 선택 결과를 지도 오버레이와 상태 패널에서 확인합니다.

## 사전 조건

- 예제 데이터 서버에 접근할 수 있는 네트워크 환경이 필요합니다.
- 초기 지도에는 위성영상과 한반도 지형, U3F 모델과 WFS 모델이 차례로 준비됩니다.

## 주요 기능

- U3F 모델과 WFS 모델을 조회 대상으로 선택합니다.
- 점, 영역, 선, 원, 사각형 방식으로 객체를 선택합니다.
- 점 선택에서는 마우스 주변 원형 범위의 대상을 노란색으로 미리 강조합니다.
- 점 선택의 `검색 반경` 슬라이더로 반경을 조절하면 클릭 검색·hover 강조와 마우스 주변 범위 원이 즉시 갱신됩니다.
- 선택 강조를 외곽선·색상·링 중에서 고르고, 선택 영역과 선택 객체의 색상·투명도를 변경합니다.
- 링의 도형(원·삼각형·사각형·다각형), 변 개수, 방향, 높이 오프셋, 지름, 회전 속도와 두께를 조절합니다. 선택 중에도 링 옵션을 바로 반영합니다.
- 외곽선 강조에서도 같은 색상 입력으로 외곽선 색을 바꿉니다.
- 마지막 선택 영역을 다시 그리거나 선택 결과를 초기화합니다.
- 선택한 객체의 정보를 지도 오버레이와 설정 패널에서 확인합니다.
- 선택 정보 오버레이를 마우스로 드래그하여 옮길 수 있습니다.
- `옆면 높이`(`bandHeight`)를 늘리면 평면 링 대신 원통·다각기둥의 열린 옆면을 표시합니다. 기본값 0은 평면 링이며, 지면 방향에서는 기준 높이에서 위로, 카메라 정면 방향에서는 카메라 쪽으로 돌출됩니다.
- `벽 두께`(`bandWidth`)도 지정하면 안쪽 벽과 위아래의 고리 면이 연결되어 속이 빈 파이프가 됩니다. 바깥 지름은 `size`를 유지하며 두께만큼 안쪽으로 넓어집니다. 높이가 0이면 두께가 있는 평평한 고리입니다.
- `링 효과`에서 `네온 테두리만`을 선택하면 `animate: false`가 적용되어 전체 테두리가 균일하게 빛납니다. 회전 속도 입력은 비활성화되며, `회전 애니메이션`으로 전환하면 기존 속도로 다시 동작합니다.
- 링 크기는 지면 방향과 카메라 정면 방향 모두 월드 지름으로 고정하여 건물과 함께 확대·축소됩니다.

## 조작 및 예상 결과

| 조작                                  | 예상 결과 |
|-------------------------------------| --- |
| 오른쪽 `정보조회` 버튼을 누릅니다.             | 조회 설정 패널이 열리고 현재 표시 중인 모델을 확인할 수 있습니다. |
| 조회 모델과 점·영역·선·원·사각형 중 선택 방식을 지정합니다. | 다음 지도 입력에 사용할 조회 조건이 변경됩니다. |
| 점 선택에서 모델 주변으로 마우스를 이동합니다. | 원형 검색 범위에서 선택된 대상이 노란색으로 강조됩니다. 대상을 벗어나거나 드래그하면 hover 강조가 해제됩니다. 클릭한 객체는 지정한 선택 표현을 유지합니다. |
| 점 선택에서 `검색 반경` 슬라이더를 움직입니다. | CSS 픽셀 단위의 반경이 즉시 적용되고 마우스 주변 원의 크기가 같은 값으로 바뀝니다. 0px에서는 원을 숨기고 기존 레이 검색을 사용합니다. 다른 선택 모드에서는 슬라이더와 원을 숨깁니다. |
| `버퍼 검색 사용` 체크를 해제합니다. | 기본 레이 클릭 검색으로 전환하고 검색 반경·범위 표시·hover 설정 UI를 잠급니다. 범위 원과 hover 강조는 해제하며 클릭 선택은 유지합니다. 다시 켜면 이전 설정과 UI를 복원합니다. |
| 슬라이더 옆의 `범위 표시` 체크를 해제합니다. | 노란색 범위 원만 숨깁니다. 버퍼 검색과 hover 강조는 유지하며, 다시 체크하면 범위 원을 표시합니다. |
| `hover 강조 사용` 체크를 해제합니다. | hover 색상을 원래대로 복원합니다. 클릭 선택과 범위 표시 설정은 유지하며, 다시 체크하면 다음 검색부터 hover 강조를 적용합니다. |
| `선택 표현`에서 강조 방식을 `외곽선`과 `색상` 중에서 바꿉니다. | 이미 선택한 표현이 정리되고, 다음 선택부터 고른 방식으로 강조됩니다. 외곽선을 고르면 색상 입력이 `외곽선 색상`으로 바뀌어 그대로 사용할 수 있고, 외곽선에 적용되지 않는 투명도만 비활성으로 표시됩니다. |
| 지도에서 객체 또는 영역을 선택합니다.               | 선택 표현이 갱신되고 레이어, 객체 ID와 좌표가 오버레이와 결과 영역에 표시됩니다. |
| `링`을 선택하고 링 옵션을 조절합니다. | 도형·방향·크기·회전 효과가 즉시 바뀝니다. 변 개수는 다각형에서, 높이 오프셋은 지면 방향에서만 조절할 수 있습니다. |
| `초기화`를 누릅니다.                        | 선택 표현과 조회 결과가 제거됩니다. |

## 관련 API

링 옵션의 `sides`는 `shape: 'polygon'`에서만 적용됩니다. `circle`·`triangle`·`square`에서는 값을 지정해도 무시합니다. 삼각형은 항상 3변, 사각형은 항상 4변이며, 다각형은 기본 6변이고 3~64 범위에서 지정합니다.

링의 크기는 `width`·`height`·`headScale`·`tailScale` 네 속성으로 설정합니다. 링 두께와 높이는 월드 단위이고 머리·꼬리 크기는 링 단면 대비 배율입니다. 높이 0은 평면, 양수는 입체이며 모양과 크기는 개별 스타일 체크 여부와 관계없이 적용됩니다. 새 공통 설정에서는 스타일을 꺼도 한 바퀴 전체에 머리·꼬리 크기를 적용하며 꼬리는 머리와 다시 맞닿는 끝입니다. 스타일 미사용 시에는 꼬리를 자동으로 투명하게 지우지 않습니다. 기존 속성만 사용하는 호출은 이전의 회전 강조 구간을 유지합니다.

```javascript
selector.setSelectType('ring', {
    width: 5,
    height: 1,
    headScale: 1.5,
    tailScale: 0.5,
    headShape: 'round',
    tailShape: 'taper'
});
```

이 설정의 몸통 단면은 두께 5·높이 1이고, 머리는 최대 두께 7.5·높이 1.5, 꼬리는 두께 2.5·높이 0.5입니다. 끝 모양과 페이드에 따라 실제 마감 부분은 더 가늘어집니다. 머리·꼬리 크기는 네온 전용 모드에서 무시됩니다.

예제의 끝 모양은 평평한 끝·둥근 끝·뾰족한 끝 중에서 선택하며, 기본값은 머리가 둥근 끝, 꼬리가 뾰족한 끝입니다. 기존 호출의 `default` 값은 호환성을 위해 계속 지원합니다.

`머리·꼬리 개별 스타일`을 켜면 색상·투명도·페이드만 추가로 설정합니다. 크기와 모양 입력은 같은 값을 계속 사용합니다.

```javascript
selector.setSelectType('ring', {
    width: 5, height: 1, headScale: 1.5, tailScale: 0.5,
    headShape: 'round', tailShape: 'taper',
    head: {color: '#ffffff', opacity: 1},
    tail: {color: '#00ffcc', opacity: 0.6, fadeIn: 0.1, fadeOut: 0.3}
});
```

개별 스타일의 불투명도는 선택 투명도와 머리·꼬리 투명도를 곱한 값입니다. 모두 1이면 가장자리 보정과 페이드 구간을 제외한 본체는 완전 불투명합니다.

개별 스타일을 켜면 꼬리는 한 바퀴 돌아 머리와 맞닿는 끝이며, 링 전체에 색상·크기·투명도가 이어집니다. 페이드 두 값은 접합점에서 꼬리 방향으로 잰 거리 경계(한 바퀴 대비 0~1)입니다. 0.1 / 0.3이면 남은 거리 30%부터 모양과 투명도가 변하고 10% 지점에서 끝납니다. 경계가 같으면 투명도만 즉시 전환하고 둥근 끝·뾰족한 끝은 단면 반폭에 맞는 길이를 확보합니다. 둘 다 0이면 페이드 없이 기존 끝 모양을 사용합니다.

`depthTest` 기본값 false는 항상 표시하며 true는 장면 깊이에 따라 링을 가립니다. 기존 `thickness`·`bandWidth`·`bandHeight`·`headThickness`·`head.thickness`·`tail.thickness`는 계속 동작하는 호환 속성입니다. 새 크기 속성을 지정하면 새 값이 우선합니다.

링의 `선 패턴`을 점선으로 변경하면 짧은 선과 빈칸이 반복됩니다. `dashCount`는 한 바퀴의 개수(1~128), `dashRatio`는 각 구간에서 선의 비율(0.05~1)이며 1은 실선과 같습니다. 다각형에서도 변 길이를 기준으로 간격을 유지합니다. 높이와 너비가 있는 입체 링은 각 점선의 절단면을 막아 속이 비어 보이지 않도록 합니다. 회전 중에는 패턴이 머리와 함께 이동하고, 네온 전용 모드에서도 점선은 유지됩니다. 기존 머리·꼬리 색상·투명도·페이드와 함께 사용할 수 있습니다.

```javascript
selector.setSelectType('ring', {
    pattern: 'dashed', dashCount: 24, dashRatio: 0.6,
    width: 5, height: 1, animate: false
});
```

- `U3dSelect`: 지정한 방식으로 지도 객체를 선택합니다. 생성자 `selectType` 기본값은 `outline`이라 별도 설정이 없으면 외곽선으로 강조할 수 있습니다.
- `U3dSelect.setSelectType()`: 실행 중에 외곽선·색상·링 강조를 전환하고 링 옵션을 적용합니다.
- `U3dSelect.setSelectedColor()`: 선택 객체의 강조 색을 바꿉니다. 투명도는 색상과 링 강조에서 반영됩니다.
- `U3dOverlay`: 선택한 객체의 월드 좌표에 정보 패널을 표시합니다.
- `U3dModelWFSLayer`, `create3DFModelLayer`: 예제에서 조회할 WFS·U3F 모델 레이어를 구성합니다.

## 객체 선택 생성

`U3dSelect` 인스턴스를 생성하고 앱의 선택 기능으로 등록합니다.

`hover.enabled`를 활성화하고 `autoHighlight: false`로 자동 색상 적용을 끕니다. 예제의 `hoverchange` 리스너가 현재 대상이 있을 때 `event.applyColor()`를 호출해 지정한 노란색을 적용합니다. 이전 표시의 복원은 선택기가 대상 전환·이탈·드래그·비활성화·삭제 시 관리합니다. 병합 U3F는 교차한 면의 건물별 범위를 조회하여 원본 정점 버퍼를 공유하는 임시 표시로 강조합니다. hover 중에는 병합을 해제하지 않으며, 건물 범위 정보가 없거나 유효하지 않으면 병합 그룹 전체를 강조하지 않고 hover 표시를 생략합니다. 같은 건물 안에서 이동할 때는 기존 표시를 유지하고, 범위 정보가 준비되면 다음 렌더에서 다시 판별합니다. 원형 검색 반경은 엔진의 `pickBufferPx` 기본값을 사용하며, hover 강조는 점 선택 모드에서만 동작합니다. 객체 정보와 오버레이는 기존처럼 클릭 선택 결과를 표시합니다.

{{example-code:select.create}}

## 점 선택 버퍼 반경 변경

슬라이더의 `input` 이벤트에서 `setPickBufferPx()`를 호출하므로 조절 중에도 반경이 적용됩니다. 초기 수치는 `getPickBufferPx()`로 읽어 엔진 기본값을 따릅니다. 선택기를 다시 생성하거나 클릭 선택 결과를 지우지 않습니다.

범위 원은 엔진이 지도 입력의 NDC 위치와 실제 검색 반경으로 표시합니다. 화면 배율을 반영하고 지도 이탈·드래그·모드 전환·선택기 종료 시 DOM과 구독을 정리합니다. 예제 UI는 엔진 설정만 변경합니다.

{{example-code:select.buffer}}

버퍼 검색을 끌 때는 엔진 반경을 0으로 설정하고 범위 표시와 hover를 해제합니다. 예제는 이전 반경과 표시·hover 설정을 별도로 보관해 다시 켤 때 복원합니다. 꺼진 상태에서는 관련 설정을 변경하지 않습니다.

{{example-code:select.buffer-enabled}}

## 범위 표시와 hover 실행 중 변경

생성자의 `pickBufferVisible`로 범위 표시의 초기값을 지정하고 `setPickBufferVisible()`로 실행 중 변경합니다. 엔진 기본값은 false이며 이 예제에서는 true로 활성화합니다. `getPickBufferVisible()`은 현재 표시 설정을 반환합니다.

{{example-code:select.buffer-visibility}}

`setHover({enabled: false})`는 hover를 끄고 원래 색상을 복원합니다. `setHover({enabled: true, color: 0xffff00})`로 다시 켜거나 색상을 바꿀 수 있고 생략한 설정은 유지합니다. `getHover()`는 현재 설정의 복사본을 반환합니다. `autoHighlight`를 생략하면 기존 자동 강조를 유지합니다. 이 예제는 이벤트로 강조하며, `applyColor('#00ff00')`처럼 대상별 색상을 지정할 수도 있습니다. 같은 대상 안에서 마우스를 움직일 때는 이벤트가 반복되지 않고 지난 대상의 이벤트로는 색상을 적용하지 않습니다. 이벤트 방식에서 현재 색상을 다시 바꾸려면 해당 이벤트의 `applyColor(색상)`을 호출합니다. 두 기능은 점 선택에서만 동작하며 클릭 선택을 초기화하지 않습니다.

{{example-code:select.hover}}

## 선택 강조 방식 변경

외곽선 강조와 색상 강조를 전환합니다. 이미 표시 중인 강조를 정리한 뒤 방식을 바꾸므로 다음 선택부터 새 방식이 적용됩니다.

{{example-code:select.type}}

## 선택 방식 변경

선택 결과와 도형을 정리한 뒤 현재 UI에서 선택한 방식으로 다시 활성화합니다.

{{example-code:select.mode}}
