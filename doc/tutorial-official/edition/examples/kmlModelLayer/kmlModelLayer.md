---
title: "KML 레이어"
theme: pastel-glass-map
output: kmlModelLayer.html
editor: true
category: model
summary: "기존 GeOnDT 기능과 API 동작을 확인하는 예제입니다."
tags: []
apis:
  - "addLayer"
  - "createHeightXYZLayer"
  - "createloadingBar"
  - "endloadingBar"
  - "fitLayerExtent"
  - "loadingBar"
  - "setHomePosition"
  - "setNameBaseLayer"
  - "showLayer"
  - "U3dAPP"
  - "U3dImageXYZLayer"
  - "U3dModelKmlLayer"
  - "updateHomePosition"
runtime:
  home: {longitude: 126.9395, latitude: 37.52, height: 450, duration: 2, pitch: 60}
  baseLayers: []
  terrain: {enabled: false}
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
sources:
  - {id: main, path: ./kmlModelLayer.main.js, language: javascript, editable: true}
  - {id: ui, path: ./kmlModelLayer.ui.js, language: javascript, editable: true}
  - {id: html, path: ./kmlModelLayer.html, language: html, editable: true}
  - {id: css, path: ./kmlModelLayer.css, language: css, editable: true}
imports: []
featured: false
migrationSource: kmlModelLayer.html
migrationFingerprint: 11b05141adce5904cac78c81e031b3873350ef67cbc32053476a2791a1ad3359
dependencies: []
---

# KML 레이어

KML/KMZ 레이어를 추가하고 `await layer.ready`로 데이터 로딩·파싱·형상 등록·경계 갱신을 기다린 뒤 표시하고 해당 범위로 이동합니다. 로딩이나 표시가 실패하면 오류를 기록하며 로딩바는 성공·실패 모두에서 닫습니다.

`ready`는 이미지 로딩이나 실제 렌더 프레임 완료를 기다리지 않습니다. `completed` 이벤트도 사용할 수 있지만, 비동기 후속 작업과 실패 처리는 `ready`를 사용하십시오.

다시 불러올 때는 `await layer.reload()`를 사용합니다. 로딩 중 호출은 현재 `ready`와 같은 Promise를 공유하며, 종결 후 호출은 새 `ready`를 만들고 반환합니다. 이전 Promise의 결과는 유지됩니다.
