---
title: 이벤트 처리
theme: pastel-glass-map
output: eventLayers.html
editor: true
category: start
summary: 앱 이벤트를 등록·해제하고 on과 once의 호출 차이를 로그에서 확인합니다.
tags: [이벤트, on, once, off, 모델 레이어]
apis: [U3dApp.on, U3dApp.once, U3dApp.off, U3dApp.setCameraWorldPosition]
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
        panel: {type: element, selector: "#event-layers-panel", properties: [visible]}
        enabled: {type: element, selector: "[data-event-enabled]", properties: [checked]}
      expect:
        panel: {visible: true}
        enabled: {checked: true}
    - id: pause-events
      actions:
        - {type: click, selector: "[data-event-enabled]"}
      states:
        status: {type: element, selector: "[data-event-status]", properties: [text]}
      expect:
        status: {text: "이벤트 등록 해제됨"}
sources:
  - {id: main, path: ./eventLayers.main.js, language: javascript, editable: true}
  - {id: ui, path: ./eventLayers.ui.js, language: javascript, editable: true}
  - {id: html, path: ./eventLayers.html, language: html, editable: true}
  - {id: css, path: ./eventLayers.css, language: css, editable: true}
featured: true
migrationSource: eventLayers.html
---

# 이벤트 처리

지도 클릭과 화면 데이터 로딩 이벤트를 등록하고 반복 호출과 일회 호출을 비교합니다. 공통 런타임이 위성영상·한반도 지형·서울 U3F 모델을 준비하며, 예제는 그 앱에 이벤트만 등록합니다.

## 다루는 기능

- `app.on()`으로 이벤트가 발생할 때마다 로그를 남깁니다.
- `app.once()`로 등록 이후 첫 이벤트만 기록합니다.
- 반환된 등록 키로 `app.off()`를 호출해 이 예제의 이벤트만 해제합니다.
- 준비된 모델을 선택해 경계 정보를 확인하고 해당 위치로 이동합니다.

## 사전 조건

GeOnDT 라이선스와 WebGL 지원 브라우저가 필요합니다. 외부 모델 데이터 서버에 접근하지 못하면 모델 목록은 비어 있을 수 있습니다. 이 경우에도 지도 클릭 이벤트와 등록·해제를 확인할 수 있습니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 지도를 두 번 클릭합니다. | 첫 클릭에는 on·once, 이후 클릭에는 on 로그만 추가됩니다. |
| 표시할 이벤트를 선택합니다. | 해당 이벤트의 로그만 표시하며 등록 자체는 유지합니다. |
| ‘once 다시 등록’을 누릅니다. | 이후 각 이벤트의 첫 호출을 다시 한 번 관찰할 수 있습니다. |
| 이벤트 등록을 끕니다. | 이후 이벤트는 기록하지 않으며 공통 지도 도구는 계속 동작합니다. |
| ‘로그 지우기’를 누릅니다. | 보관한 로그를 지웁니다. 이미 호출된 once는 다시 등록하지 않습니다. |
| 모델을 선택하거나 ‘이동’을 누릅니다. | 모델 경계 위로 이동합니다. ‘정보’는 이름과 경계를 표시합니다. |

최근 100개만 보관하며 최신 로그가 위에 표시됩니다. 로딩 이벤트는 초기화 이후의 실제 화면 갱신 상황에 따라 발생합니다. 이미 끝난 초기 로딩 이벤트를 소급해 만들지 않으며, 데이터가 준비되지 않으면 일부 완료 이벤트가 오지 않을 수 있습니다.

## 관련 API

`on()`·`once()`의 반환 키를 보관하고 종료 시 해당 키만 해제합니다. 키를 생략한 `off(type)`는 다른 코드의 같은 이벤트까지 해제하므로 사용하지 않습니다.

{{example-code:main:events.subscribe}}

`U3dGroupLayer.getChildren()`으로 공통 모델 그룹의 자식을 읽고, 유효한 `getBoundingBox()`가 있는 모델만 `setCameraWorldPosition()`으로 이동합니다.
