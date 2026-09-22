---
title: "주행 애니메이션"
theme: pastel-glass-map
output: animationComponents.html
editor: true
category: simulation
summary: "드론을 50Hz 간격으로 이동시키며 촬영 영역과 누적 경로를 확인하고, 고도 범례와 등고선을 지도에 겹쳐 지형 높이를 비교하는 예제입니다."
tags: []
apis:
  - "createloadingBar"
  - "createMultipleComponentLayer"
  - "debugFps"
  - "endloadingBar"
  - "geographicToVector3"
  - "getCamera"
  - "getExternalScene"
  - "getGoogleToGeographic"
  - "getAnalysis"
  - "getLayerByName"
  - "loadingBar"
  - "restartQuadTree"
  - "setFrustumHelper"
  - "setFrustumTerrainProjectionHelper"
  - "setHomePosition"
  - "showLayer"
  - "U3dAPP"
  - "U3dCylinder"
  - "U3dHeightXYZLayer"
  - "U3dImageXYZLayer"
  - "UDirectionArrowGroup"
  - "UFrustum"
  - "ULandNormalDirectionHelper"
  - "updateHomePosition"
  - "UTerrainStamp"
runtime:
  home: {longitude: 127.942, latitude: 37.35, height: 5000, duration: 2, pitch: 60}
  baseLayers: [satellite]
  terrain: {enabled: true, preset: korea}
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
verification:
  scenarios:
    - id: initial-map
      states:
        canvas: {type: element, selector: "#map canvas", properties: [exists, visible]}
        rail: {type: element, selector: "[data-legacy-toggle-state]", properties: [exists, visible]}
        panel: {type: element, selector: "#analy-popup", properties: [exists, visible]}
      expect:
        canvas: {exists: true, visible: true}
        rail: {exists: true, visible: true}
        panel: {exists: true, visible: true}
sources:
  - {id: main, path: ./animationComponents.main.js, language: javascript, editable: true}
  - {id: ui, path: ./animationComponents.ui.js, language: javascript, editable: true}
  - {id: api, label: API Guide, path: ./animationComponents.api.js, language: javascript, editable: true}
  - {id: html, path: ./animationComponents.html, language: html, editable: true}
  - {id: css, path: ./animationComponents.css, language: css, editable: true}
imports: []
migrationSource: animationComponents.html
dependencies: []
---

# 주행 애니메이션

브이월드 정사영상과 고도 레이어를 기본으로 로드하고, 테스트 위치의 드론을 50Hz 간격으로 이동시키며 촬영 영역과 누적 경로를 확인합니다. `고도 범례 표현`과 `등고선 표현`을 켜면 지형 높이를 범례 색상과 등고선으로 지도에 겹쳐 비교할 수 있습니다.

## 다루는 기능

- 드론 컴포넌트를 50Hz 간격으로 이동시키면서 촬영 영역과 누적 경로를 확인하고, 고도 범례와 등고선을 지도에 겹쳐 지형 높이를 비교합니다.
- 드론을 선택하면 기본 `UFrustumTerrainProjectionHelper`와 `terrain: true`로 Far 면을 지형에 맞추는 `UFrustumHelper` 탭을 전환할 수 있습니다. 전환할 때 기존 Helper를 해제하고 선택한 Helper만 생성하며, FOV·자세·공통 표현 설정은 그대로 유지합니다.
- moveSmoothly로 이동하는 드론의 `predictFuturePositions(100)`을 500ms마다 호출해 1~100단계 뒤의 예측점을 `{point, time}` 배열로 얻고, 그중 단계가 `FUTURE_POSITION_HELPER_STEP`(3)의 배수인 지점(3, 6, …, 99단계)에만 청록색 `ULandNormalDirectionHelper`를 표시해 부하를 줄입니다. `time`은 최근 이력의 평균 속도(총 이동 거리 ÷ 총 경과 시간)로 계산한, 호출 시점부터의 예상 도착 시간(ms)이며 각 Helper의 `userData.predictedArrivalMs`에 보관됩니다. 도착 이력 100개가 쌓인 뒤 표시되며, 드론당 표시 단계 수(33개)만큼의 Helper를 같은 인덱스로 재사용합니다. 예측 검증은 표시 여부와 무관하게 100단계 전체로 수행합니다. 호출 주기와 단계 수는 `FUTURE_POSITION_UPDATE_INTERVAL`, `FUTURE_POSITION_COUNT`에서 조절합니다.
- 예측이 맞았는지 확인하기 위해 `moveSmoothly`의 도착 콜백에서 실제 도착 시각·좌표를 앞선 예측의 같은 단계와 비교합니다. 예측 하나의 마지막 단계까지 비교가 끝나면 콘솔에 `[예측 검증]`으로 시간 오차(평균·절대평균·최대)와 거리 오차(평균·최대)를 출력하고, `window.futurePositionVerification`에서 드론별 최근 요약(`lastSummary`)과 진행 중 예측(`pending`)을 볼 수 있습니다.
- 호출 주기는 예측 지점까지의 이동 시간이 아닙니다. 예측은 최근 웨이포인트의 직선 추세를 연장한 결과이며 곡선 경로를 뜻하지 않습니다. 이력이 부족하면 API는 undefined를 반환하며, setPosition 모드에서는 예측 표시를 비웁니다.

## 사전 조건

- 브이월드 정사영상과 고도 타일을 내려받을 수 있는 네트워크가 필요합니다. 이 예제는 공통 배경지도 대신 `U3dImageXYZLayer`와 `U3dHeightXYZLayer`를 직접 만들어 사용합니다.
- 고도 범례와 등고선 표현은 고도 레이어가 준비된 뒤에만 지도에 나타납니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 왼쪽 `분석` 버튼을 누릅니다. | `드론 애니메이션 테스트 설정` 패널이 열립니다. |
| `추가하기`로 드론을 추가하고 목록에서 선택합니다. | `드론별 테스트 설정`이 선택한 드론 기준으로 바뀝니다. |
| `드론 정지`와 `드론 이동`을 누릅니다. | 선택한 드론의 이동이 멈추거나 다시 시작됩니다. |
| `Frustum`과 `경로 설정` 값을 바꿉니다. | 촬영 영역과 누적 경로 표현이 바뀐 값으로 다시 그려집니다. |
| `UFrustumHelper` 탭과 `UFrustumTerrainProjectionHelper` 탭을 번갈아 선택합니다. | 기존 Helper가 제거되고 선택한 Helper만 표시됩니다. 지면 투영 전용 품질 설정은 지면 투영 탭에서만 나타납니다. |
| `고도 범례 표현`과 `등고선 표현`을 켭니다. | 지형 높이가 범례 색상과 등고선으로 지도에 겹쳐 표시됩니다. |
| `선택 드론 설정 기본값으로 초기화`를 누릅니다. | 선택한 드론의 설정이 기본값으로 되돌아갑니다. |

## 관련 API

- `createMultipleComponentLayer`: 이동시킬 드론 컴포넌트를 담는 레이어를 만듭니다.
- `UFrustum`, `setFrustumHelper`: `terrain: true`로 Far 면을 지형에 맞춘 Frustum을 표시합니다.
- `setFrustumTerrainProjectionHelper`: 실제 지형과 교차하는 촬영 영역을 표시합니다.
- `U3dComponentPosition.predictFuturePositions`, `getGeographicPositionByWorld`: 최근 이력으로 미래 월드 좌표를 예측하고 Helper 입력용 위경도로 변환합니다.
- `ULandNormalDirectionHelper`: 예측 지점에서 지면을 향하는 선과 교차점을 표시합니다.
- `U3dCumulativePath`, `UDirectionArrowGroup`: 누적 경로와 진행 방향 표시를 담당합니다.
- `getAnalysis`: 고도 범례와 등고선 표현에 사용하는 분석 기능을 얻습니다.
- `U3dImageXYZLayer`, `U3dHeightXYZLayer`: 예제가 직접 만드는 정사영상과 고도 레이어입니다.

## Frustum 실제 구현

API Guide의 실제 설정 코드는 아래 위치에서 확인할 수 있습니다.

{{example-code:main:frustum.camera-info}}
{{example-code:main:frustum.rotation}}
{{example-code:main:frustum.helper-style}}
{{example-code:main:frustum.helper-fill}}
{{example-code:main:frustum.helper-quality}}
{{example-code:main:frustum.helper-create}}
{{example-code:main:frustum.standard-helper-create}}
