---
title: 바람길 예제
theme: pastel-glass-map
output: windSimulation.html
editor: true
category: simulation
summary: 서울 기상 샘플과 포항 수목 마스크로 바람길을 만들고 보행 경로를 재생합니다.
tags: [바람길, 파티클, 수목, 마스크, 보행]
apis: [UAnalyParticle, UParticleEngine, U3dLodComponentLayer, U3dMaskLayer, UAnalyRoute]
runtime:
  app: {searchType: sphere, useFog: false, passlevel: 0}
  home: {longitude: 129.33823986620484, latitude: 36.0081365068203, height: 450, duration: 2, pitch: 60}
  baseLayers: [satellite]
  terrain: {enabled: true, preset: korea}
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
verification:
  scenarios:
    - id: initial-panel
      states:
        panel: {type: element, selector: '#windSimulation-panel', properties: [exists, visible]}
        region: {type: element, selector: '[data-wind-region]', properties: [text]}
        walk: {type: element, selector: '[data-route="start"]', properties: [disabled]}
        trees: {type: layer, name: windSimulation_trees, properties: [exists, visible]}
      expect:
        panel: {exists: true, visible: true}
        region: {text: 선택 전}
        walk: {disabled: true}
        trees: {exists: true, visible: true}
    - id: seoul-wind
      actions:
        - {type: click, selector: '[data-wind="seoul"]'}
        - {type: wait, selector: '[data-wind-region]:text-is("서울")', state: visible}
      states:
        region: {type: element, selector: '[data-wind-region]', properties: [text]}
        status: {type: element, selector: '[data-wind-status]', properties: [text]}
      expect:
        region: {text: 서울}
        status: {text: 바람길 재생 중}
    - id: close-panel
      actions:
        - {type: click, selector: '[data-panel-close="windSimulation-panel"]'}
      states:
        panel: {type: element, selector: '#windSimulation-panel', properties: [visible]}
      expect:
        panel: {visible: false}
sources:
  - {id: main, path: ./windSimulation.main.js, language: javascript, editable: true}
  - {id: ui, path: ./windSimulation.ui.js, language: javascript, editable: true}
  - {id: html, path: ./windSimulation.html, language: html, editable: true}
  - {id: css, path: ./windSimulation.css, language: css, editable: true}
  - {id: sampleData, path: ./windSimulation.data.js, language: javascript, editable: true, label: 샘플 데이터}
imports: [sampleData]
migrationSource: windSimulation.html
---

# 바람길 예제

서울의 저장된 기상 샘플과 포항의 수목 배치를 사용해 바람 파티클을 표시합니다.
기존 `windSimulation.html`의 기상 데이터, 경계, 수목 영역과 보행 경로를 사용합니다.

## 다루는 기능

- 서울: `UAnalyParticle.initialize()`의 `wind` 모드로 기상 샘플을 보간하고 영등포구 경계와 건물 마스크를 적용합니다.
- 포항: `U3dLodComponentLayer`로 수목을 배치하고 마스크 셀에 수목 높이를 기록한 뒤 고정 풍향의 기본 파티클을 생성합니다.
- 처음 화면부터 포항 수목을 배치하며, 모델 메타데이터를 준비한 뒤 거리별 LOD를 설정합니다.
- 건물은 기존 예제의 전체 U3F 발행 목록에서 불러옵니다. 서울 프리셋으로 대체하지 않으며 포항 건물도 포함합니다.
- `UAnalyRoute`로 포항 경로를 시작·정지·재시작합니다.
- 지역 전환 시 이전 파티클을 제거하고, 예제 종료 시 이벤트·분석·전용 레이어를 정리합니다.

## 사전 조건

- 라이선스가 적용된 GeOnDT 실행 환경과 WebGL 지원 브라우저가 필요합니다.
- 배경지도·지형·서울 건물·포항 수목 모델 서버에 접근할 수 있어야 합니다. 모델 서버 접근이 실패하면 건물 또는 수목 마스크를 확인할 수 없습니다.
- 수목은 기존 예제의 `dt-data.mappick.co.kr` 원본 모델을 사용합니다. `localhost`에서는 Vite의 `/wind-tree-assets/` 프록시로 같은 파일을 전달하므로 개발 서버를 재시작해야 합니다.
- 로컬 건물 목록과 모델 요청은 `/wind-model-catalog`, `/wind-model-assets/` 프록시를 사용하며 원본 데이터는 기존 예제와 같습니다.
- 서울 기상 데이터는 예제에 저장된 샘플입니다. 포항은 고정 속도 벡터를 사용하며 실시간 기상 조회와 물리 기반 유체 해석을 수행하지 않습니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 예제를 처음 엽니다. | 포항 수목 모델을 불러와 배치합니다. |
| `서울 지역` 선택 | 서울 관찰 시점으로 이동하고 영등포구 경계와 건물 마스크를 적용한 바람길을 생성합니다. |
| `포항 지역` 선택 | 포항 관찰 시점으로 이동하고 수목 LOD 모델과 수목 마스크를 사용하는 바람길을 생성합니다. |
| 포항 생성 후 보행 `시작` | 저장된 경로를 높이 2m, 속도 30km/h 설정으로 이동합니다. |
| 보행 `정지` / `재시작` | 이동을 멈추거나 이어서 재생합니다. |
| `바람길 정지` | 파티클과 보행 재생을 정지합니다. 다시 지역을 선택하면 생성합니다. |
| 생성 실패 | 결과 영역에 오류를 표시하고 지역 버튼을 다시 활성화합니다. |
| 코드 편집 후 재실행 | 기존 이벤트와 전용 지도 자원을 정리한 뒤 다시 초기화합니다. |

## 관련 API

- `UAnalyParticle.createMask()`는 지정 범위의 모델 타일과 마스크 준비가 끝날 때까지 기다립니다. 계산용 마스크는 `visible: false`로 생성하여 화면 표시 완료 대기와 분리합니다.
- 마스크 격자가 준비된 것을 확인한 뒤 파티클을 시작합니다.
- 카메라 이동 후 `forceUpdate()`로 해당 화면의 타일 준비를 기다립니다. 이미 캐시된 모델 타일은 공개 타일 조회 API로 누락된 마스크 격자를 채웁니다.
- `UAnalyParticle.initialize()`, `active()`, `deactive()`, `removeAllParticle()`로 파티클을 생성·재생·정리합니다.
- `UParticleEngine.setShpExtents()`로 서울 경계를, `setExtentBox()`로 포항 공간 범위를 적용합니다.
- `U3dLodComponentLayer.getSurfacePoints()`, `addPositionList()`, `setLodOption()`으로 수목을 배치하고 기존 거리별 단순화 비율을 유지합니다.
- `U3dMaskLayer.getKeyByPosition()`, `setMaskObject()`로 수목 위치에 높이 마스크를 기록합니다.
- `UAnalyRoute.start()`, `stop()`, `restart()`로 보행을 제어합니다.
