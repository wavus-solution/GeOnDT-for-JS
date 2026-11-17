---
title: 조망권 분석
theme: pastel-glass-map
output: analysisView.html
editor: true
category: analysis
summary: 시점과 조망점을 등록해 조망권을 확인하고, 선택한 건물에 층별 관측점을 생성합니다.
tags: [경관 분석, 조망권, 건물 선택, 층별 분석]
apis: [UAnalyLandScape, getAnalysis, capture, on, off, setPanMode]
runtime:
  commonUi:
    imageLayerPanel: true
    terrainLayerPanel: true
  home: {longitude: 126.938, latitude: 37.519, height: 450, duration: 2, pitch: 60}
  layers:
    available: [satellite, korea_terrain]
    visible: [satellite, korea_terrain]
    base: satellite
  modelLayers:
    - {preset: seoul_u3f, visible: true}
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
verification:
  scenarios:
    - id: load-view-points
      actions:
        - {type: click, selector: ".btn-load-view-point"}
      states:
        points: {type: element, selector: ".view-point-list .view-item", properties: [count]}
        current: {type: element, selector: "#analysisView-current-point", properties: [text]}
      expect:
        points: {count: 2}
        current: {text: 시점1}
    - id: load-view-targets
      actions:
        - {type: click, selector: ".btn-load-view-target"}
      states:
        targets: {type: element, selector: ".view-target-list .view-item", properties: [count]}
        current: {type: element, selector: "#analysisView-current-target", properties: [text]}
      expect:
        targets: {count: 3}
        current: {text: 조망점1}
    - id: building-selection-mode
      actions:
        - {type: click, selector: "#analysisView-floor-tab"}
        - {type: click, selector: ".btn-select"}
      states:
        message: {type: element, selector: "#analysisView-status", properties: [text]}
        generate: {type: element, selector: ".btn-compute-floor", properties: [disabled]}
      expect:
        message: {text: 지도에서 층별 분석할 건물을 선택하세요.}
        generate: {disabled: true}
    - id: leave-selection-mode
      actions:
        - {type: click, selector: "#analysisView-floor-tab"}
        - {type: click, selector: ".btn-select"}
        - {type: click, selector: ".btn-panmode"}
      states:
        message: {type: element, selector: "#analysisView-status", properties: [text]}
        selected: {type: element, selector: "#analysisView-building", properties: [text]}
      expect:
        message: {text: 지도 모드로 전환했습니다.}
        selected: {text: 선택된 건물 없음}
    - id: clear-view-points
      actions:
        - {type: click, selector: ".btn-load-view-point"}
        - {type: click, selector: ".btn-remove-view-point"}
      states:
        points: {type: element, selector: ".view-point-list .view-item", properties: [count]}
        current: {type: element, selector: "#analysisView-current-point", properties: [text]}
      expect:
        points: {count: 0}
        current: {text: 미선택}
    - id: switch-workspace-preserves-points
      actions:
        - {type: click, selector: ".btn-load-view-point"}
        - {type: click, selector: ".btn-load-view-target"}
        - {type: click, selector: "#analysisView-floor-tab"}
        - {type: click, selector: "#analysisView-points-tab"}
      states:
        points: {type: element, selector: ".view-point-list .view-item", properties: [count]}
        targets: {type: element, selector: ".view-target-list .view-item", properties: [count]}
        pointCount: {type: element, selector: "#analysisView-point-count", properties: [text]}
        targetCount: {type: element, selector: "#analysisView-target-count", properties: [text]}
      expect:
        points: {count: 2}
        targets: {count: 3}
        pointCount: {text: '2'}
        targetCount: {text: '3'}
sources:
  - {id: main, path: ./analysisView.main.js, language: javascript, editable: true}
  - {id: ui, path: ./analysisView.ui.js, language: javascript, editable: true}
  - {id: html, path: ./analysisView.html, language: html, editable: true}
  - {id: css, path: ./analysisView.css, language: css, editable: true}
imports: []
dependencies: []
migrationSource: analysisView.html
---

# 조망권 분석

시점은 카메라가 위치할 곳이고 조망점은 카메라가 바라볼 곳입니다.
두 관측점을 등록해 가시영역을 표시하거나, 건물을 선택해 층별 시점·조망점을 생성합니다.

## 다루는 기능

시점·조망점 등록과 이동, 관측점 순회, 가시영역 표시, 건물 선택과 층별 관측점 생성, 화면 저장을 제공합니다.

## 사전 조건

지도·지형·건물 데이터 서버에 접속할 수 있어야 합니다. 층별 자동분석에는 선택 가능한 건물 모델이 필요합니다.

## 조작 및 예상 결과

1. **분석** 패널의 **관측점 관리** 탭에서 시점·조망점 카드의 **예시 불러오기**로 여의도 예시 관측점을 등록합니다. 각 카드에서 등록 개수와 현재 선택된 관측점을 확인할 수 있습니다.
2. 관측점의 **이동** 또는 **이전·다음**으로 시선 방향을 바꾸고 **가시선 그리기**로 가시영역을 확인합니다.
3. **추가**를 누르고 이름을 입력한 뒤 지도에서 위치를 선택하면 관측점을 직접 등록할 수 있습니다.
4. **층별 자동분석** 탭에서 **건물 선택**을 누르고 지도에서 건물을 클릭합니다. 선택 외곽선과 건물 높이를 확인한 뒤 생성 대상과 층 범위를 정하고 **층별 관측점 생성**을 누릅니다. 생성 후에는 **관측점 관리** 탭으로 돌아가 결과를 확인합니다.
5. **시작·중지**로 관측점을 순회하고 **지도모드**로 선택 입력을 종료합니다. **화면 저장**은 현재 화면의 미리보기를 표시합니다.

상단의 현재 시점·조망점과 하단의 가시영역·관측점 순회 도구는 탭과 관계없이 표시됩니다.
탭은 좌우 방향키와 Home·End 키로도 전환할 수 있습니다. 좁은 화면에서는 관측점 카드가 세로로 배치됩니다.

시점 목록의 **조망점 계산**은 방위각·고도각·거리로 새로운 조망점을 생성합니다.
층별 분석에는 건물 모델이 필요합니다. 모델 데이터가 준비된 위치에서 건물을 선택하세요.

## 공통 레이어 설정

위성지도와 한반도 지형은 `runtime.layers`, 서울 건물은 `runtime.modelLayers`의 `seoul_u3f` 프리셋으로 선언합니다.
공통 런타임이 레이어 생성·로딩·표시와 홈·정북·확대·축소, 카메라 상태를 담당합니다.
이 예제의 Main은 `context.app`에서 `UAnalyLandScape`를 얻어 분석을 제어하고, UI는 입력과 목록 표시를 담당합니다.

## 관련 API

- `getAnalysis('LandScape')`: 경관 분석 객체를 얻습니다.
- `setSelector(selector)` · `getSelector()`: 사용자 선택기를 연결하거나 현재 선택기를 조회합니다.
- `select(true)` · `select(false)`: 건물 선택 입력을 시작하거나 해제합니다.
- `addViewPoint()` · `addViewTarget()`: 시점과 조망점을 등록합니다.
- `computeViewPointByFloor()` · `computeViewTargetByFloor()`: 선택한 건물에 층별 관측점을 생성합니다.
- `drawLine()` · `removeLines()`: 가시영역을 표시하거나 제거합니다.
- `animate()` · `stopAnimate()`: 관측점 순회를 시작하거나 중지합니다.

## 선택기 구성

Main에서 `U3dSelect`를 생성해 옵션과 이벤트를 구성한 뒤 분석에 전달합니다.
`select(true)`는 이 선택기의 입력을 활성화하고, 선택 완료 결과의 첫 건물을 분석 대상으로 사용합니다.
클릭 교차점이 없는 영역 선택에서는 건물 경계 중심에 임시 관측점을 만듭니다.

```javascript
const selector = new GeOnDT.select.U3dSelect({mode: 'point', selectType: 'outline'});
selector.setSelectedColor('#f25f5c', 1);
selector.on('end', event => console.log(event.data));
analy.setSelector(selector);
analy.select(true);
```

선택기를 주입하지 않으면 앱 연결 후 첫 `select(true)`에서 기본 선택기를 준비합니다.
`select(false)`·`deactive()`·`clear()`는 선택기의 입력과 분석 구독을 해제합니다. `clear()` 후에도 내부·외부 선택기의 인스턴스·설정·참조와 선택기·분석 객체의 사용자 이벤트는 유지되므로 다음 `select(true)`에서 같은 선택기를 재사용합니다.
내부 기본 선택기는 `deactive()`·선택기 교체·앱 변경에서 분석이 직접 `remove()`로 제거하고 참조를 비웁니다. 이후 `select(true)`에서 기본 선택기를 다시 생성합니다. 외부 주입 선택기는 `deactive()` 후에도 인스턴스·설정·참조와 사용자 이벤트를 유지합니다.
외부 선택기의 사용을 마칠 때는 분석 입력을 중단한 뒤 생성자가 `selector.remove()`로 정리하며, 제거한 선택기는 다시 사용하지 않습니다.
