---
title: 대용량 컴포넌트 LOD 가시화
theme: pastel-glass-map
output: hugeVolumeComponent.html
editor: true
category: model
summary: 한라산 일대의 수목 컴포넌트를 LOD로 표출하고 속성 값별 스타일과 임도 주행을 확인합니다.
tags:
  - 대용량 컴포넌트
  - LOD
  - WFS
  - 임상도
apis:
  - U3dLodComponentLayer
  - U2dVectorShaderLayer
  - U2dPolygon
  - UAnalyRoute
  - U3dView
runtime:
  app:
    methodheight: raw
    searchtype: sphere
  home:
    longitude: 126.5295
    latitude: 33.3649
    height: 8000
    duration: 2
    pitch: 62
  layers:
    available: [satellite, base, hybrid, osm, google, korea_terrain]
    visible: [base, korea_terrain]
    base: base
  terrain:
    enabled: true
    preset: korea
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
verification:
  network:
    allowedRequestFailures:
      - urlPrefix: https://devp.ecoclimate.or.kr/geondt/data/component/
        reason: 컴포넌트 모델 서버가 localhost CORS 요청을 허용하지 않습니다.
  scenarios:
    - id: initial-panel
      states:
        panel:
          type: element
          selector: "#huge-volume-panel"
          properties: [exists, visible]
        styleColumn:
          type: element
          selector: "#style-column-select"
          properties: [exists]
      expect:
        panel: {exists: true, visible: true}
        styleColumn: {exists: true}
    - id: toggle-forest-map
      actions:
        - type: check
          selector: "[data-forest-map]"
      states:
        forestMap:
          type: layer
          name: forestTypeMap
          properties: [exists, visible]
      expect:
        forestMap: {exists: true, visible: true}
    - id: toggle-component-layer
      actions:
        - type: uncheck
          selector: "[data-component-layer='KORE_SSP585_2021']"
      states:
        scenario2021:
          type: layer
          name: KORE_SSP585_2021
          properties: [exists, visible]
        scenario2040:
          type: layer
          name: KORE_SSP585_2040
          properties: [exists, visible]
      expect:
        scenario2021: {exists: true, visible: false}
        scenario2040: {exists: true, visible: false}
    - id: close-panel
      actions:
        - type: click
          selector: "[data-panel-target='huge-volume-panel']"
      states:
        panel:
          type: element
          selector: "#huge-volume-panel"
          properties: [exists, visible]
      expect:
        panel: {exists: true, visible: false}
sources:
  - {id: main, path: ./hugeVolumeComponent.main.js, language: javascript, editable: true}
  - {id: ui, path: ./hugeVolumeComponent.ui.js, language: javascript, editable: true}
  - {id: api, path: ./hugeVolumeComponent.api.js, language: javascript, editable: false}
  - {id: html, path: ./hugeVolumeComponent.html, language: html, editable: true}
  - {id: css, path: ./hugeVolumeComponent.css, language: css, editable: true}
featured: false
migrationSource: hugeVolumeComponent.html
migrationFingerprint: f85cad647f76a5b0993637898aaad0555a2e048ae72f97f7a330d1ec34872144
---

# 대용량 컴포넌트 LOD 가시화

한라산 일대의 수목 분포 WFS를 읽어 수만 개의 나무 컴포넌트를 LOD로 표출합니다.
거리에 따라 모델 단계가 바뀌고, 먼 거리의 모델은 압축해 폴리곤 수를 줄입니다.
같은 지역의 연도별 시나리오 레이어를 따로 켜고 끄며 비교할 수 있고, 속성 값을 기준으로 색상·크기·가시화를 바꿀 수 있습니다.

## 다루는 기능

- `U3dLodComponentLayer`로 WFS 지점 데이터를 인스턴스 모델로 표출하고, `typeLodTable`에 거리별 모델과 압축 비율을 선언해 대용량 컴포넌트의 표출 부하를 조절합니다.
- `getMeshByPropertiesMap()`으로 feature 속성 값에 해당하는 인스턴스를 찾아 `setColorByList()`, `setScaleByList()`, `setVisibleByList()`로 값 그룹마다 다른 스타일을 적용합니다.
- `styleFunction` 옵션으로 타일이 다시 읽힐 때 생성되는 인스턴스에 같은 스타일을 다시 입혀, 카메라를 옮겨도 적용한 색상과 크기가 유지되게 합니다.
- `U2dVectorShaderLayer`와 `U2dPolygon`으로 임상도 격자를 지도 위에 덮어 그리고, 컴포넌트 분포와 함께 확인합니다.
- `UAnalyRoute`로 지형 고도를 읽은 임도 경로를 만들어 주행 시점에서 컴포넌트를 확인하고, `U3dApp.createView()`로 클릭 지점 지면 위에 카메라 뷰를 설치합니다.

## 사전 조건

- 컴포넌트 지점 데이터는 `https://devp.ecoclimate.or.kr/geoserver/geondt/ows`의 WFS, 모델(.3ds)은 같은 서버의 정적 경로에서 내려받습니다. **모델 경로는 localhost CORS 요청을 허용하지 않으므로 로컬에서는 나무가 표출되지 않고 지형과 임상도만 보입니다.**
- 임상도는 `https://devp.ecoclimate.or.kr/geoserver/ecoclim/ows`의 `eclgy_envrn_frph_cd_mr100` 레이어를 EPSG:4326으로 받아 그립니다. 이 GeoServer가 EPSG:3857로 변환해 주는 좌표는 위도가 약 0.18도 어긋나므로 3857로 요청하지 않습니다. 컴포넌트를 먼저 보여 주기 위해 임상도는 꺼진 상태로 시작합니다.
- `DMCLS_CD`(경급 코드)의 `0`은 2021 시나리오에는 없고 2040부터 나타납니다. 레이어 설정이 이 값을 구상나무 고사목 모델에 대응시키므로 예제에서는 고사목으로 표시합니다.
- 임도 주행 경로는 지형 고도를 읽어 만들므로 한라산 지형 타일이 올라온 뒤에 `시작`을 눌러야 합니다. 지형이 아직 없으면 경로를 만들지 않고 안내 문구를 표시합니다.
- 처음 화면은 한라산 정상부를 남쪽에서 내려다보는 위치이며, 배경지도는 브이월드 일반 지도, 지형은 공통 한반도 지형 레이어를 사용합니다.

## 주요 기능

- 스타일 기준이 되는 속성 컬럼을 선택하고, 그 컬럼의 값마다 색상·투명도·크기·가시화를 지정합니다.
- 연도별 시나리오 컴포넌트 레이어를 각각 켜고 끕니다.
- 임상도 격자 표시를 켜고 끕니다.
- 임도 주행을 시작·정지·재시작합니다.
- 지도를 클릭해 카메라 뷰를 설치합니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 왼쪽 `컴포넌트` 버튼을 누릅니다. | 대용량 컴포넌트 패널이 닫히고 지도 조작을 계속할 수 있습니다. |
| `속성 컬럼`에서 다른 속성을 고릅니다. | 그 속성의 값마다 설정 행이 새로 만들어지고, 적용 기록이 비워져 다시 적용해야 반영됩니다. |
| 값의 색상을 바꾸고 `색상 · 투명도`를 누릅니다. | 해당 값에 속한 나무만 색이 바뀌고, 카메라를 옮겨 타일이 다시 읽혀도 색이 유지됩니다. |
| 값의 `크기 배율`을 바꾸고 `크기`를 누릅니다. | 해당 값에 속한 나무만 원래 크기의 그 배율로 바뀝니다. 배율 1이 원래 크기입니다. |
| 값의 가시화를 끄고 `가시화`를 누릅니다. | 해당 값에 속한 나무가 화면에서 사라집니다. |
| `KORE_SSP585_2040` 체크박스를 켭니다. | 2040 시나리오 컴포넌트가 함께 표출됩니다. |
| `임상도` 체크박스를 켭니다. | 지도 위에 임상도 격자 폴리곤이 나타나고 배지가 `표출`로 바뀝니다. |
| `스타일 초기화`를 누릅니다. | 적용한 색상·크기·가시화가 모두 처음 상태로 돌아가고 설정 행도 기본값으로 다시 만들어집니다. |
| 임도 주행 `시작`을 누릅니다. | 카메라가 임도 경로를 따라 이동하며 경로 기울기에 맞춰 시선이 바뀝니다. |
| `설치 지점 선택`을 누르고 지도를 클릭합니다. | 클릭한 지점 지면 위 15m에 카메라 뷰가 설치되고 설치 수가 늘어납니다. |

## 컴포넌트 레이어 생성

거리 구간마다 사용할 모델과 압축 비율을 `typeLodTable`에 선언하고, `typeColName`으로 feature의 어떤 속성이 type을 결정하는지 지정합니다.

{{example-code:component.create}}

## 속성 값별 스타일 적용

`getMeshByPropertiesMap()`은 속성 Key와 Value로 검색해 해당하는 InstancedMesh와 instance index 목록을 돌려줍니다.
이 목록으로 색상·크기·가시화를 바꾸면 인스턴스 버퍼를 직접 고치므로 `refresh()`를 호출하지 않아도 됩니다.

{{example-code:style.apply}}

## 임도 주행 경로

경로 점의 높이를 지형에서 읽어 넣어야 주행 중 시선 방향이 맞습니다.

{{example-code:route.prepare}}

## 관련 API

- `U3dLodComponentLayer`: WFS 지점 데이터를 인스턴스 모델로 표출합니다. `typeColName`과 `typeLodTable`의 type이 일치해야 모델이 선택되고, `getMeshByPropertiesMap()`의 검색 Key도 feature에 실제로 있는 속성이어야 합니다.
- `U3dLodComponentLayer.refresh()`: 캐시된 타일을 모두 정리하고 모델을 다시 만듭니다. 스타일 적용 뒤에 호출하면 인스턴스가 새로 생성되어 적용한 색상이 사라지므로 사용하지 않습니다.
- `U2dVectorShaderLayer`, `U2dPolygon`: 임상도 격자를 그립니다. `U2dPolygon.setPosition()`의 기본 좌표계는 EPSG:4326이며, 바깥쪽 테두리 하나만 사용합니다.
- `U3dLodComponentLayer.setScaleByList()`: 인스턴스 크기를 **곱하지 않고 지정한 값으로 덮어씁니다.** 인스턴스 크기는 모델 원본 행렬을 분해한 값이라 1이 아니므로, 배율로 다루려면 예제처럼 기준 크기를 기억해 두고 곱해서 넘겨야 합니다. `THREE.Vector3`를 넘기면 크기가 0이 되므로 숫자나 일반 객체로 넘깁니다.
- `UAnalyRoute`: 주행 경로를 만들고 카메라를 이동시킵니다. 시점 높이가 10을 넘으면 시선이 경로 기울기를 따라가지 않고 수평으로 고정됩니다. 점 사이의 중간 지점 높이는 지형에서 다시 읽습니다.
- `U3dApp.closestPointAtPixel()`: 두 번째 인자를 `true`로 주어야 지형만 대상으로 검색합니다. 주지 않으면 나무 인스턴스에 광선이 먼저 맞아 수관 위 좌표가 잡힙니다.
