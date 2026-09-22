---
title: "이미지 PBF 레이어 예제"
theme: pastel-glass-map
output: imagePbfLayers.html
editor: true
category: etc
summary: 같은 PBF(MVT) 타일을 이미지 레이어와 벡터 레이어로 각각 가시화하고 두 결과를 비교하는 예제입니다. 건물·도로·하천 데이터를 바꿔 가며 두 레이어의 차이를 확인합니다.
tags:
  - 레이어
  - PBF
apis:
  - U3dAPP
  - U3dImagePBFLayer
  - U3dVectorPBFLayer
  - addLayer
  - showLayer
  - removeLayer
runtime:
  home:
    longitude: 126.9395
    latitude: 37.52
    height: 1500
    duration: 2
    pitch: 60
  baseLayers:
    - satellite
  terrain:
    enabled: true
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
          selector: "#imagePbfLayers-option-panel"
          properties: [exists, visible]
        image:
          type: element
          selector: "[data-result-image]"
          properties: [text]
        vector:
          type: element
          selector: "[data-result-vector]"
          properties: [text]
      expect:
        panel: {exists: true, visible: true}
        image: {text: 없음}
        vector: {text: 건물}
    # 벡터 레이어에서 도로를 더 켭니다. 건물과 함께 두 개가 켜져 있어야 합니다.
    - id: add-vector-roads
      actions:
        - type: click
          selector: "[data-layer-chip][data-kind='vector'][data-source='roads']"
      states:
        vector:
          type: element
          selector: "[data-result-vector]"
          properties: [text]
      expect:
        vector: {text: "건물, 도로"}
    # 이미지 레이어도 선을 그리므로 도로를 켜면 이름만 표기됩니다.
    - id: add-image-roads
      actions:
        - type: click
          selector: "[data-layer-chip][data-kind='image'][data-source='roads']"
      states:
        image:
          type: element
          selector: "[data-result-image]"
          properties: [text]
      expect:
        image: {text: 도로}
    # 같은 버튼을 다시 누르면 꺼집니다.
    - id: remove-image-roads
      actions:
        - type: click
          selector: "[data-layer-chip][data-kind='image'][data-source='roads']"
      states:
        image:
          type: element
          selector: "[data-result-image]"
          properties: [text]
      expect:
        image: {text: 없음}
    - id: toggle-settings
      actions:
        - type: click
          selector: "[data-panel-target='imagePbfLayers-option-panel']"
      states:
        panel:
          type: element
          selector: "#imagePbfLayers-option-panel"
          properties: [exists, visible]
      expect:
        panel: {exists: true, visible: false}
sources:
  - id: main
    path: ./imagePbfLayers.main.js
    language: javascript
    editable: true
  - id: ui
    path: ./imagePbfLayers.ui.js
    language: javascript
    editable: true
  - id: html
    path: ./imagePbfLayers.html
    language: html
    editable: true
  - id: css
    path: ./imagePbfLayers.css
    language: css
    editable: true
  - id: api
    path: ./imagePbfLayers.api.js
    language: javascript
    editable: true
imports: []
featured: false
migrationSource: imagePbfLayers.html
dependencies: []
---

# 이미지 PBF 레이어 예제

같은 PBF(MVT) 타일을 **이미지 레이어**와 **벡터 레이어**로 각각 가시화하고, 두 결과를 나란히 비교합니다. 건물·도로·하천 세 가지 데이터를 바꿔 가며, 데이터의 모양(면인지 선인지)에 따라 어느 레이어가 적합한지 확인할 수 있습니다.

레이어 종류마다 데이터 버튼이 한 줄씩 있고, 버튼은 각각 독립적으로 켜고 끕니다. 여러 데이터를 동시에 켤 수 있으며 켠 조합마다 레이어가 하나씩 만들어집니다. 기본으로는 벡터 레이어의 건물 하나만 켜져 있습니다.

## 다루는 기능

- `U3dImagePBFLayer`로 PBF 타일을 타일마다 캔버스에 그려 텍스처로 올립니다.
- `U3dVectorPBFLayer`로 같은 타일을 지형 위에 벡터(shader)로 그립니다.
- 버튼을 처음 켜면 `addLayer`+`showLayer`로 그 조합의 레이어를 만들고, 끄면 `showLayer(name, false)`로 숨깁니다. 제거하지 않으므로 타일 텍스처·파싱 캐시가 남아 다시 켤 때 네트워크·워커 없이 곧바로 붙습니다. `removeLayer`는 예제를 떠날 때만 씁니다.

## 사전 조건

- PBF 타일 서버(`https://3d-dev.geon.kr/data/pbf/osm/`)에 접근할 수 있어야 합니다.
- 두 레이어 모두 `minlevel` 11부터 타일을 요청하므로, 그보다 멀리서 보면 아무것도 그려지지 않습니다.
- 예제는 실제 최대 레벨을 15로 두고, 그보다 확대하면 15레벨 타일을 재사용합니다(`REAL_MAX_LEVEL`). 데이터별 실제 배포 범위는 건물·도로가 z17까지, 하천·행정경계가 z15까지입니다. 가장 좁은 범위에 맞춰야 z16 이상에서 404 가 나지 않습니다.

## 데이터

| 선택 | 타일 폴더 | MVT 레이어 이름 | 모양 |
| --- | --- | --- | --- |
| 건물 | `buildings` | `gis_osm_buildings_a` | 면(Polygon) |
| 도로 | `roads2` | `gis_osm_roads` | 선(LineString) |
| 하천 | `waterways` | `gis_osm_waterways` | 선(LineString) |
| 행정경계(면) | `adminareas` | `gis_osm_adminareas_a` | 면(Polygon) |

스타일 함수는 MVT 레이어 이름(`feature.get('layer')`)과 `fclass` 속성으로 분기합니다. 새 폴더를 추가하려면 `TILE_SOURCES`에 항목을 넣고 실제 타일을 받아 MVT 레이어 이름을 확인한 뒤, 두 스타일 함수에 분기를 추가하고 HTML에 버튼을 한 개씩 더하면 됩니다.

현재 서버는 MVT 레이어 이름에 `_free_1` 접미사를 붙여 내려줍니다(`gis_osm_adminareas_a_free_1`). 접미사 없는 이름으로 재배포하는 중이라 두 스타일 함수가 비교 전에 `_free_1` 을 떼어, 재배포 전후 모두 같은 분기를 타게 했습니다.

행정경계는 한 타일 안에 국가·시도·구·동·통·반이 **서로 겹쳐** 들어 있습니다(z11 타일 기준 453개: 동 211, 통 198, 구 20, 반 18). 그래서 면을 칠하면 나중에 그린 하위 단계의 채움이 상위 경계선을 덮어 경계망이 조각나 보입니다. 벡터 레이어는 채움 없이 선만 그리고 단계별로 색·굵기를 달리하며, 통·반은 그리지 않습니다. 이때 스타일은 투명 채움을 가진 면 스타일이 아니라 **선만 있는 스타일**(`lineStyle`)로 돌려줍니다. 투명 채움이라도 fill 이 있으면 타일에서 잘린 면(외곽선은 별도 선 피처가 그림)이 보이지 않는 면으로 남아 워커·합성 비용만 차지하고, 온전한 면도 픽셀마다 ring 전체를 검사하는 면 경로로 그려져 행정경계만 유독 늦게 나타났습니다.

하위 단계는 도로와 같은 방식으로 줌 필터를 겁니다(`ADMIN_STYLE`의 세 번째 값). 구는 z12, `admin_level7`은 z13, 동은 z14부터 그립니다. 줌아웃에서 하위 단계까지 다 그리면 화면에서 구분되지도 않으면서 부하만 커지기 때문입니다.

## 주요 기능

- 두 레이어는 `baseurl`이 같고 렌더링 경로만 다릅니다.
- **이미지 PBF 레이어는 Polygon의 fill만 그립니다.** 도로·하천 같은 선을 보려면 벡터 PBF 레이어를 사용해야 합니다.
- 이미지 PBF 레이어의 `styleFunction`은 Web Worker에서 문자열로 복원되므로 **바깥 변수를 참조하지 않는 함수**여야 합니다. `ol` 네임스페이스도 쓸 수 없으며, `style.fill.getColor()`만 호출되므로 그 모양을 갖춘 객체를 돌려주면 됩니다.
- 벡터 레이어의 `styleFunction`은 메인 스레드에서 실행되므로 `ol` 스타일 객체를 재사용할 수 있습니다.
- 벡터 레이어는 타일당 feature 상한(`terrainLodProfile`: 레벨 13 이하 300, 14 는 900, 15 이상 1500)과 `featurePriority`(fclass 기준으로 큰 길·큰 물길 우선)를 둡니다. 상한 없이 그리면 코스 레벨의 자식 타일이 벡터 합성을 기다리느라 수 초 동안 부모 텍스처가 남는 것을 실측했습니다. 이미지 PBF 레이어에는 상한 개념이 없어 코스 레벨에서는 두 레이어의 피처 개수가 정확히 같지 않습니다.
- 확대할 때 새 자식 타일은 벡터 decal 합성까지 기다린 뒤 나타나므로 그동안 부모 텍스처가 흐릿하게 보입니다. 위 feature 상한을 낮출수록 이 구간이 짧아집니다.
- 이미지 레이어는 벡터 레이어와 **같은 굵기·같은 줌 필터**를 쓰되 **색만 다르게** 지정했습니다. 두 레이어를 겹쳐 켜도 어느 쪽이 그린 결과인지 색으로 구분됩니다.
- 하천 굵기는 레벨에 관계없이 고정 반폭(m)을 씁니다. 선 굵기가 소스 타일 버퍼(extent 4096 중 32 units, z16 기준 약 3.8m)를 넘으면 타일 경계 밖 지오메트리가 데이터에 없어, 두 레이어 모두 경계에서 쐐기 모양으로 비어 보일 수 있습니다.
- 이 서버는 XYZ(상단 원점) 좌표로 타일을 제공하는데 엔진이 URL 치환에 넘기는 타일 y는 TMS(하단 원점)입니다. 그래서 뒤집어 주는 `{-y}` 토큰이 필요합니다. 서울 z=11 타일의 서버 좌표는 y=793인데 엔진이 넘기는 값은 y=1254이고, `{-y}`가 2^11 - 1 - 1254 = 793으로 바꿔 줍니다. `reverseY` 옵션은 URL 치환에 쓰이지 않으므로 반드시 토큰으로 지정해야 합니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 왼쪽 `레이어` 버튼을 누릅니다. | 레이어 패널이 열립니다. |
| 초기 상태 | 벡터 레이어의 건물만 켜져 있어 건물 면과 외곽선이 그려집니다. |
| `이미지 벡터 PBF 레이어`의 `도로`를 누릅니다. | 도로가 추가로 그려지고 결과가 `건물, 도로`가 됩니다. |
| `이미지 PBF 레이어`의 `건물`을 누릅니다. | 같은 건물이 이미지로도 그려져 벡터 결과와 겹쳐 보입니다. |
| `이미지 PBF 레이어`의 `도로`를 누릅니다. | 같은 도로가 이미지로도 그려져 벡터 결과와 겹쳐 보이고, 결과가 `건물, 도로`가 됩니다. |
| 켜 둔 버튼을 다시 누릅니다. | 그 조합의 레이어가 제거되고 결과 목록에서 빠집니다. |
| `행정경계` 버튼 | 시도·구·동 경계가 단계별 굵기로 그려집니다. 벡터 레이어는 선만 그리고, 이미지 레이어는 fill 만 가능해 구 단위 면만 칠합니다. |
| 행정경계를 켠 채 줌아웃합니다. | 하위 단계가 순서대로 빠지고 국가·시도 경계만 남습니다. 멀리서 볼수록 그리는 선이 줄어 갱신이 빨라집니다. |
| 같은 Rail 버튼을 다시 누릅니다. | 레이어 패널이 닫히고 지도 조작을 계속할 수 있습니다. |

## 관련 API

- `GeOnDT.image.U3dImagePBFLayer` — PBF 타일을 이미지 텍스처로 가시화하는 레이어입니다.
- `GeOnDT.image.U3dVectorPBFLayer` — 같은 타일을 지형 위 벡터로 가시화하는 레이어입니다.
- `U3dAPP.addLayer` / `U3dAPP.showLayer` / `U3dAPP.removeLayer` — 레이어 추가, 표시 제어, 제거에 사용합니다.
