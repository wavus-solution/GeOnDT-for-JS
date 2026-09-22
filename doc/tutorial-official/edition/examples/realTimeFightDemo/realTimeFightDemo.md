---
title: 실시간 항공 통합 추적 시뮬레이션
theme: pastel-glass-map
output: realTimeFightDemo.html
editor: true
category: simulation
summary: 실시간 항공 정보를 받아 항공기 컴포넌트를 이동시키고 누적 비행 경로와 카메라 추적을 확인합니다.
tags: [실시간, 다중 시설물, 누적 경로, 카메라 추적, POI]
apis:
  - U3dAPP.createMultipleComponentLayer
  - U3dMultipleComponentLayer
  - U3dSelect
  - U3dPOI
  - UMathEngine.getClosestSegmentInfo
runtime:
  app:
    autoClear: false
    type: world
  commonUi:
    imageLayerPanel: true
    terrainLayerPanel: true
  home: {longitude: 127.9729, latitude: 36.3233, height: 620000, duration: 0, pitch: 0}
  layers:
    available: [satellite, base, hybrid, korea_terrain]
    visible: [satellite, korea_terrain]
    base: satellite
  terrain:
    enabled: true
    preset: korea
    options:
      maxLevel: 17
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
verification:
  legacyUrl: /tutorial-official/examples/realTimeFightDemo/realTimeFightDemo.baseline.html
  network:
    allowedRequestFailures:
      - urlPrefix: https://3d-api.geon.kr/flight/
        reason: 실시간 항공 정보 서버가 배포 도메인만 CORS로 허용해 localhost에서는 데이터 요청이 차단됩니다. 검증 대상인 패널 조작과 목록 필터는 데이터 없이도 동작합니다.
  scenarios:
    - id: flight-panel-visible
      states:
        canvas:
          type: element
          selector:
            legacy: "#map canvas"
            edition: "#map canvas"
          properties: [exists, visible]
        flightPanel:
          type: element
          selector:
            legacy: "#analy-popup .div-popup"
            edition: "#flight-tracking-panel"
          properties: [exists, visible]
        labelOption:
          type: element
          selector:
            legacy: "#setLabel"
            edition: "#setLabel"
          properties: [exists, checked]
        debugOption:
          type: element
          selector:
            legacy: "#boxDebug"
            edition: "#boxDebug"
          properties: [exists, checked]
      compare: [canvas, flightPanel, labelOption, debugOption]
      expect:
        canvas: {exists: true, visible: true}
        flightPanel: {exists: true, visible: true}
        labelOption: {exists: true, checked: true}
        debugOption: {exists: true, checked: false}
    - id: switch-international-route
      actions:
        - type: select
          selector:
            legacy: "#route-type-select"
            edition: "#route-type-select"
          value: INTERNATIONAL
        - type: uncheck
          selector:
            legacy: "#setLabel"
            edition: "#setLabel"
        - type: check
          selector:
            legacy: "#boxDebug"
            edition: "#boxDebug"
      states:
        routeType:
          type: element
          selector:
            legacy: "#route-type-select"
            edition: "#route-type-select"
          properties: [exists, value]
        airportFilter:
          type: element
          selector:
            legacy: "#airport-select"
            edition: "#airport-select"
          properties: [exists, value]
        labelOption:
          type: element
          selector:
            legacy: "#setLabel"
            edition: "#setLabel"
          properties: [exists, checked]
        debugOption:
          type: element
          selector:
            legacy: "#boxDebug"
            edition: "#boxDebug"
          properties: [exists, checked]
      compare: [routeType, airportFilter, labelOption, debugOption]
      expect:
        routeType: {exists: true, value: INTERNATIONAL}
        airportFilter: {exists: true, value: ALL}
        labelOption: {exists: true, checked: false}
        debugOption: {exists: true, checked: true}
sources:
  - {id: main, path: ./realTimeFightDemo.main.js, language: javascript, editable: true}
  - {id: ui, path: ./realTimeFightDemo.ui.js, language: javascript, editable: true}
  - {id: api, label: API Help, path: ./realTimeFightDemo.api.js, language: javascript, editable: true}
  - {id: flightRouteHistory, label: flightRouteHistory.js, path: ./flightRouteHistory.js, language: javascript, editable: true}
  - {id: debugBoxPool, label: debugBoxPool.js, path: ./debugBoxPool.js, language: javascript, editable: true}
  - {id: html, path: ./realTimeFightDemo.html, language: html, editable: true}
  - {id: css, path: ./realTimeFightDemo.css, language: css, editable: true}
imports: [flightRouteHistory, debugBoxPool]
migrationSource: realTimeFightDemo.html
dependencies: []
---

# 실시간 항공 통합 추적 시뮬레이션

예제 서버에서 실시간 항공 정보를 받아 운항 중인 항공기를 다중 시설물 레이어의 컴포넌트로 이동시키고, 누적 비행 경로와 통과 구간 정보를 확인하는 예제입니다.

## 다루는 기능

- 다중 시설물 레이어를 Instance 방식으로 만들어 수백 대 규모의 이동 객체를 한 레이어에서 관리합니다.
- 실시간으로 수신한 위경도 좌표를 컴포넌트에 전달해 끊김 없이 이동시키고 누적 비행 경로를 그립니다.
- 목록에서 선택한 항공기를 카메라로 추적하고 추적 시점을 바꿉니다.
- 지도에서 누적 경로를 직접 클릭해 해당 구간의 번호, 구간 길이와 누적 거리를 조회합니다.

## 사전 조건

- 실시간 항공 정보 서버(`https://3d-api.geon.kr/flight/`)와 UAM 모델·지형 데이터 서버에 접근할 수 있는 네트워크 환경이 필요합니다. 이 서버들은 배포 도메인만 CORS로 허용하므로 `localhost` 개발 환경에서는 항공기 데이터와 모델을 받을 수 없습니다.
- 초기 지도는 대한민국 전체가 보이는 높이에서 시작하며 위성영상과 한반도 지형이 함께 표시됩니다. 항공기 정보 패널은 열린 상태로 시작합니다.
- 초기 비행 이력은 운항 중인 항공기 수백 대 분량이므로 지도 표시 이후에도 잠시 더 적재됩니다. 적재가 끝나기 전에는 목록 위에 진행 안내가 표시됩니다.
- 데이터 서버에 연결할 수 없으면 항공기 목록이 비어 있고 목록 위에 실패 안내가 표시됩니다. 실시간 위치 요청이 연속으로 실패하면 갱신을 중단합니다. 지도와 배경지도·지형 조작은 그대로 사용할 수 있습니다.
- UAM 모델을 불러오지 못하면 항공기 모델이 보이지 않지만 목록, 누적 경로와 카메라 추적은 계속 동작합니다.

## 주요 기능

- 실시간 위치를 0.5초 주기로 받아 새 항공기 생성, 위치 이동과 운항 종료 제거를 반영합니다.
- 출발 공항을 POI로 표시하고 출발 공항 색상으로 누적 경로를 구분합니다.
- 누적 경로 표시와 편명 라벨 표시를 전환합니다.
- 서버가 보낸 수신 좌표를 디버그 상자로 확인합니다.
- 국내선·국제선과 출발 공항으로 목록을 걸러내고 편명으로 검색합니다.
- 선택한 항공기를 카메라로 추적하고 앞·뒤·위·좌·우 시점을 전환합니다.
- 누적 경로를 클릭해 해당 구간 정보를 조회합니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 예제를 실행합니다. | 항공기 정보 패널이 열린 상태로 시작하며 운항 중인 항공기 수와 목록을 확인할 수 있습니다. |
| 왼쪽 `항공기` 버튼 또는 패널의 `×`를 누릅니다. | 항공기 정보 패널이 닫히고, 같은 버튼을 다시 누르면 열립니다. |
| `경로 보기` / `경로 끄기`를 누릅니다. | 모든 항공기의 누적 비행 경로가 함께 표시되거나 숨겨집니다. |
| `편명 라벨 표시`를 해제합니다. | 항공기 위의 편명 라벨이 사라집니다. |
| `수신 위치 디버그 상자`를 선택합니다. | 서버가 보낸 좌표에 초록색 와이어프레임 상자가 표시됩니다. 선택을 해제하면 모두 사라집니다. |
| `노선`을 국제선으로 바꿉니다. | 출발 공항 목록이 국제선 공항으로 다시 채워지고 목록이 국제선 항공기로 바뀝니다. |
| 편명을 입력하고 `검색`을 누릅니다. | 검색어가 포함된 항공기만 목록에 남습니다. |
| 목록에서 항공기를 선택합니다. | 따라가기 모드로 전환되어 카메라가 해당 항공기를 추적하고, 오른쪽에 운항 상세 정보와 통과 구간 로그가 표시됩니다. |
| 화면 아래 시점 버튼을 누릅니다. | 추적 카메라가 앞면, 뒷면, 윗면, 좌측, 우측 시점으로 전환됩니다. |
| 추적 중 지도를 클릭합니다. | 추적이 해제되고 지도 조작 모드로 돌아갑니다. |
| 지도에서 누적 경로를 클릭합니다. | 클릭 지점이 속한 구간 번호, 구간 길이와 누적 길이가 표시됩니다. |

## 관련 API

- `U3dAPP.createMultipleComponentLayer()`: 항공기 모델을 담을 다중 시설물 레이어를 생성합니다. `setInstanced(true)`로 Instance 방식으로 전환해 다수의 컴포넌트를 처리합니다.
- `U3dMultipleComponentLayer`: `addPosition()`으로 컴포넌트를 만들고 `visibleCumulativeRoute()`, `showLabel()`, `hideLabel()`, `getComponentByName()`, `removeComponentByName()`으로 항공기와 누적 경로를 제어합니다.
- `ComponentObject.moveSmoothly()`, `ComponentObject.setCameraTrace()`: 컴포넌트를 목표 좌표로 이동시키고 카메라 추적을 전환합니다.
- `U3dSelect`: 누적 경로 보조 Mesh를 대상으로 클릭 선택을 처리합니다. 추적 모드에서는 `deactive()`로 선택을 잠시 해제합니다.
- `U3dPOI`: 공항 위치와 이름을 지도에 표시합니다.
- `UMathEngine.getClosestSegmentInfo()`: 월드 좌표 배열에서 클릭 지점과 가장 가까운 선분과 보간 비율을 반환합니다. 예제는 이 값으로 누적 거리와 통과시각을 보간합니다.

## 컴포넌트 레이어 생성

Instance 방식의 다중 시설물 레이어를 만들고 UAM 모델을 등록합니다.

{{example-code:layer.create}}

## 항공기 컴포넌트 생성

출발 공항 색상과 누적 경로 스타일을 지정해 항공기 하나를 컴포넌트로 등록합니다.

{{example-code:component.create}}

## 실시간 위치 이동

서버에서 받은 위경도·고도 좌표를 그대로 전달하면 컴포넌트가 목표 지점까지 이동합니다.

{{example-code:component.move}}

## 누적 경로 구간 조회

클릭한 월드 좌표와 가장 가까운 비행 이력 선분을 찾아 구간 정보를 계산합니다.

{{example-code:route.pick}}
