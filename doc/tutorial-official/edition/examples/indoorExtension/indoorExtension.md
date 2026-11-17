---
title: 광명역 실내건물 및 보행모드
theme: pastel-glass-map
output: indoorExtension.html
editor: true
category: indoor
summary: 광명역 실내 모델과 군중을 불러오고 Room별 캐릭터 보행 및 CCTV를 확인합니다.
tags: [실내, 보행, 캐릭터, CCTV]
apis: [createTdsModelLayer, createMultipleComponentLayer, createCharacterControls, createView, flyToPosition, setPanMode]
runtime:
  home: {longitude: 126.8853, latitude: 37.41566, height: 450, duration: 0, pitch: 60}
  baseLayers: []
  terrain: {enabled: false}
  mapTools: []
  cameraStatus: true
  help: true
  loading: true
verification:
  scenarios:
    - id: initial-ready
      actions:
        - {type: wait, selector: "[data-indoor-room='Room1']:not(:disabled)", state: attached}
      states:
        mode: {type: element, selector: "[data-indoor-mode]", properties: [text]}
        progress: {type: element, selector: "[data-indoor-progress]", properties: [value]}
      expect:
        mode: {text: 전체 보기}
        progress: {value: '100'}
    - id: enter-room-without-keyboard
      actions:
        - {type: click, selector: "[data-indoor-room='Room1']"}
        - {type: wait, selector: "[data-indoor-room='Room1'][aria-pressed='true']", state: attached}
      states:
        mode: {type: element, selector: "[data-indoor-mode]", properties: [text]}
        room: {type: element, selector: "[data-indoor-current-room]", properties: [text]}
      expect:
        mode: {text: 보행 모드}
        room: {text: Room1}
    - id: exit-walk
      actions:
        - {type: click, selector: "[data-indoor-room='Room1']"}
        - {type: wait, selector: "[data-indoor-room='Room1'][aria-pressed='true']", state: attached}
        - {type: click, selector: "[data-indoor-overview]"}
        - {type: wait, selector: "[data-indoor-overview]:not(:disabled)", state: attached}
      states:
        mode: {type: element, selector: "[data-indoor-mode]", properties: [text]}
      expect:
        mode: {text: 전체 보기}
sources:
  - {id: main, path: ./indoorExtension.main.js, language: javascript, editable: true}
  - {id: ui, path: ./indoorExtension.ui.js, language: javascript, editable: true}
  - {id: html, path: ./indoorExtension.html, language: html, editable: true}
  - {id: css, path: ./indoorExtension.css, language: css, editable: true}
  - {id: sceneData, path: ./indoorExtension.data.js, language: javascript, editable: true, label: 배치 자료}
imports: [sceneData]
---

# 광명역 실내건물 및 보행모드

실내 모델·텍스처·군중·보행 캐릭터·CCTV가 준비되는 동안 진행 상태를 표시합니다. 준비 완료 후 Room을 선택하면 해당 위치에서 캐릭터를 조작할 수 있습니다.

## 다루는 기능

- `createTdsModelLayer`와 `layer.ready`로 실내 모델의 자료 준비를 기다립니다.
- `createMultipleComponentLayer`로 같은 보행 모델을 여러 군중 객체로 배치합니다.
- 군중과 조작 캐릭터의 체격을 맞추고, 작은 CCTV 패널로 실내 화면을 함께 확인합니다.
- `flyToPosition`의 이동을 마친 뒤 `createCharacterControls`로 보행 제어권을 넘깁니다.
- `createView`로 실내 CCTV의 화면과 방향을 조작합니다.

## 사전 조건

- 광명역 모델 서버와 공개 캐릭터 자료 서버에 접근할 수 있어야 합니다.
- 로컬 개발은 `_vite.config.js`의 `/indoor-assets/` 전달 경로를 사용합니다. 설정 변경 후 개발 서버를 다시 실행합니다.
- 배포 환경에서는 원본 실내 자료 서버가 허용하는 `https://3d.geon.kr` 출처를 사용합니다. 다른 출처는 서버의 CORS 허용 설정이 필요합니다.
- 실내 모델의 XML이 위치·크기·회전을 제공합니다. 예제 실행에 등록 조회용 API 키를 넣을 필요가 없습니다.

## 주요 기능

진행률은 다운로드 바이트 비율이 아니라 준비 단계의 완료 비율입니다. 실내 모델·텍스처와 군중·보행 자료를 각각 기다리고, CCTV 생성과 첫 화면 반영까지 마쳐야 100%가 됩니다. 실패 시 완료로 표시하지 않고 오류를 안내합니다.

{{example-code:indoor.load}}

보행 모드는 카메라 이동과 캐릭터 제어가 같은 카메라를 동시에 갱신하지 않도록 순서대로 시작합니다. 모델 로딩은 `active()`에서 한 번 실행하고 첫 갱신에서 대기 애니메이션을 시작합니다.

{{example-code:walk.enter}}

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 예제를 엽니다. | 모든 준비가 끝날 때까지 진행 표시가 유지되고 Room 버튼이 비활성화됩니다. |
| Room1·Room2·Room3을 누릅니다. | 선택 위치로 이동한 뒤 보행 모드가 시작되며 키를 누르기 전에도 캐릭터가 보입니다. |
| WASD 또는 방향키를 누릅니다. | 캐릭터가 이동합니다. |
| 마우스를 드래그합니다. | 캐릭터 주위의 시선을 회전합니다. |
| F / Shift를 누릅니다. | 점프 / 걷기·달리기 전환을 실행합니다. |
| Esc 또는 전체 보기를 누릅니다. | 보행 제어를 해제하고 실내 모델 전체 보기로 돌아갑니다. |
| CCTV의 화살표·초기화·가시선을 조작합니다. | 해당 CCTV의 방향·표시가 변경됩니다. |

## 관련 API

`U3dApp.createTdsModelLayer`, `U3dLayer.ready`, `U3dApp.createMultipleComponentLayer`, `U3dApp.createCharacterControls`, `U3dApp.flyToPosition`, `U3dApp.createView`, `U3dApp.setPanMode`
