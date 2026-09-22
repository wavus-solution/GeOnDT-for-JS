---
title: 객체 교차 검사
theme: pastel-glass-map
output: collisionCheck.html
editor: true
category: simulation
summary: Loft-드론, PathGeometry-Box, Sphere-Pipe 조합의 실시간 교차 판정과 교차율을 확인합니다.
tags:
  - 충돌 검사
  - 지도
apis:
  - U3dPolygonLoftGeometry
  - U3dPathGeometry
  - U3dBox
  - U3dSphere
  - U3dPipe
  - UPolygonCollider
  - USphereCollider
runtime:
  commonUi:
    imageLayerPanel: true
    terrainLayerPanel: true
  home:
    longitude: 126.926
    latitude: 37.524
    height: 4200
    duration: 2
    pitch: 60
  baseLayers:
    - satellite
  terrain:
    enabled: false
    preset: korea
  mapTools:
    - home
    - north
    - zoom-in
    - zoom-out
  cameraStatus: true
  help: true
  loading: true
verification:
  scenarios:
    # Viewer는 예제 Rail의 첫 패널을 초기 화면에서 자동으로 엽니다.
    - id: initial-panel
      states:
        panel:
          type: element
          selector: "#collisionCheck-option-panel"
          properties: [exists, visible]
      expect:
        panel: {exists: true, visible: true}
    - id: toggle-settings
      actions:
        - type: click
          selector: "[data-panel-target='collisionCheck-option-panel']"
      states:
        panel:
          type: element
          selector: "#collisionCheck-option-panel"
          properties: [exists, visible]
      expect:
        panel: {exists: true, visible: false}
sources:
  - id: main
    path: ./collisionCheck.main.js
    language: javascript
    editable: true
  - id: ui
    path: ./collisionCheck.ui.js
    language: javascript
    editable: true
  - id: html
    path: ./collisionCheck.html
    language: html
    editable: true
  - id: css
    path: ./collisionCheck.css
    language: css
    editable: true
---

# 객체 교차 검사

## 다루는 기능

- U3dPolygonLoftGeometry의 바닥·윗면 정점(getBottomSlice/getTopSlice)으로 비행금지 구역 UPolygonCollider를 구성합니다.
- 드론 100대에 모델 외곽을 근사한 UPolygonCollider를 연결하고 무작위 경로를 따라 이동합니다.
- U3dPathGeometry를 선분별 사각 프리즘 UPolygonCollider로, U3dBox를 사각 프리즘으로 근사해 폴리곤끼리의 교차를 검사합니다.
- U3dPipe의 전체 중심선을 길이에 따라 배치한 USphereCollider로 덮고 이동하는 U3dSphere와 교차시켜 구 충돌체끼리의 판정을 확인합니다.
- 검사 루프는 두 계층으로 나뉩니다. 매 프레임 전 드론의 충돌 여부를 intersects()로 판정해 색상과 충돌 목록을 즉시 갱신하고, 교차율은 충돌 중인 드론만 대상으로 프레임당 시간 예산 안에서 오래된 것부터 순환 계산합니다. UI는 결과를 0.25초마다 표시합니다.

## 사전 조건

배경지도와 드론 FBX 모델 서버에 접근할 수 있어야 합니다. 모델 로드가 완료되면 100대를 자동 생성합니다. 지형은 비활성화하고 절대 고도를 사용합니다.

`initialize()`는 구역·드론과 초기 상태를 준비하며 정밀 교차율 계산을 수행하지 않습니다. UI는 로딩 표시가 해제되고 화면을 그릴 기회를 준 뒤 `startChecks()`를 호출합니다. `getSnapshot()`은 저장된 결과만 반환합니다. 종료 시 UI 타이머와 예약된 검사 프레임을 취소합니다.

충돌 여부(색상, 충돌 수, 목록 진입·이탈)는 위치 갱신과 같은 프레임에 반영됩니다. 구역 AABB를 드론 충돌체 외접 반경만큼 확장한 근접 박스 밖의 드론은 충돌체 갱신과 판정을 생략합니다. 교차율은 충돌 중인 드론 수에 비례한 짧은 지연으로 갱신되며, 새로 진입한 드론은 교차율이 나올 때까지 목록에 "교차율 계산 중"으로 표시됩니다. 정밀도는 유지하므로 한 대의 교차율 계산 자체가 오래 걸리면 시간 예산을 넘긴 그 프레임의 지연은 남을 수 있습니다.

## 주요 기능

임의 지역의 예제 경계 위 고도 10–510m에 노란 Loft 구역을 만듭니다. 이는 실제 항공 규제 경계가 아닌 시연용 도형입니다. 드론은 고도 100–600m를 이동하며, 목적지 도착마다 새 무작위 목적지를 선택합니다. 모델과 별도로 진행 방향을 따라 회전하는 7각 프리즘 충돌체를 사용합니다.

지도 동쪽에는 두 가지 자동 교차 예제가 함께 표시됩니다. PathGeometry와 Pipe는 양쪽 끝이 꺾여 연장된 형태이며, 초록색 Box와 Sphere가 각 도형의 가운데 구간을 가로질러 왕복합니다. 이동 객체는 교차 중 빨간색으로 바뀌며 패널에 현재 판정과 이동 객체 기준 교차율이 표시됩니다. PathGeometry는 선분별 프리즘, Pipe는 전체 중심선을 빈틈없이 덮는 구 충돌체 묶음으로 근사합니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 예제 열기 | 드론 100대가 자동 생성되어 비행합니다. |
| 충돌 패널 확인 | 진입한 드론 이름과 교차율이 오름차순으로 표시됩니다. 교차율은 초록색으로 표시됩니다. |
| 드론의 진입과 이탈 관찰 | 충돌 시 빨간색, 이탈 시 흰색으로 복원되고 목록에서 제거됩니다. |
| 추가 교차 조합 관찰 | Box와 Sphere가 대상 도형을 통과할 때 빨간색으로 바뀌고 패널 상태가 `분리`에서 `교차`로 바뀝니다. |
| Collider Wireframe 켜기 | Loft·드론과 두 추가 조합에 실제 사용되는 충돌체 외곽선이 표시됩니다. |
| 충돌 버튼 누르기 | 현황 패널이 열리거나 닫힙니다. |

교차율은 구역 전체 부피 기준이 아니라 드론 7각 프리즘 충돌체 부피 기준입니다. 경계에서는 부분 교차, 완전 진입은 100%입니다. 드론과 구역이 모두 프리즘이면 단면 교차 면적과 겹침 높이로 해석적으로 계산하며, loft 형상은 높이 방향 수치 적분으로 근사합니다. 접촉 순간은 0.00%로 표시될 수 있습니다. 드론 간 충돌은 검사하지 않습니다.

## 관련 API

- U3dPolygonLoftGeometry: 바닥 정점, height, topScale로 입체 구역 생성
- U3dPolygonLoftGeometry.getBottomSlice / getTopSlice: 충돌체 bottom/top으로 쓸 바닥·윗면 정점(월드 좌표) 조회
- U3dPathGeometry / U3dBox: 경로와 이동 상자 시각화
- U3dSphere / U3dPipe: 이동 구와 파이프 시각화
- UPolygonCollider: 비행금지 구역·드론·PathGeometry·Box의 충돌체. 링이 평면이면 프리즘 경로, 아니면 loft 단면 경로를 형상에서 자동 선택
- USphereCollider: Sphere와 Pipe 중심선 샘플의 충돌체
- UPolygonCollider.computeIntersectionRatio: 드론 부피 기준 교차율 계산
- U3dMultipleComponentLayer.addPosition, ComponentObject.moveSmoothly: 드론 생성과 이동

기존 Legacy collisionCheck.html, 관련 Collider spec, home/markdown/polygonLoftGeometry.md와 실제 구현을 참고했습니다.
