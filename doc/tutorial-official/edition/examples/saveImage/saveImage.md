---
title: "화면 이미지 저장"
theme: pastel-glass-map
output: saveImage.html
editor: true
category: etc
summary: "현재 지도 화면을 PNG 이미지로 내려받습니다. 지도 위의 POI와 Overlay도 함께 담깁니다."
tags: []
apis:
  - "addOverlay"
  - "addPOI"
  - "capture"
  - "captureToBlob"
  - "createloadingBar"
  - "createPromise"
  - "endloadingBar"
  - "geographicToVector3"
  - "getCameraState"
  - "getGoogleRectangleDefine"
  - "loadingBar"
  - "on"
  - "setGeoCenterToOverviewMap"
  - "setHomePosition"
  - "setNameBaseLayer"
  - "setRotationOverviewMap"
  - "showLayer"
  - "U3dAPP"
  - "U3dOverlay"
  - "U3dPOI"
  - "updateHomePosition"
runtime:
  home: {longitude: 126.9395, latitude: 37.52, height: 450, duration: 2, pitch: 60}
  baseLayers: []
  terrain: {enabled: false}
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
        saveButton: {type: element, selector: "#save", properties: [exists, visible]}
      expect:
        canvas: {exists: true, visible: true}
        rail: {exists: true, visible: true}
        panel: {exists: true, visible: true}
        saveButton: {exists: true, visible: true}
    - id: close-panel
      actions:
        - type: click
          selector: "#analy-popup .popup-exit"
      states:
        canvas: {type: element, selector: "#map canvas", properties: [exists, visible]}
        panel: {type: element, selector: "#analy-popup", properties: [exists, visible]}
      expect:
        canvas: {exists: true, visible: true}
        panel: {exists: true, visible: false}
sources:
  - {id: main, path: ./saveImage.main.js, language: javascript, editable: true}
  - {id: ui, path: ./saveImage.ui.js, language: javascript, editable: true}
  - {id: html, path: ./saveImage.html, language: html, editable: true}
  - {id: css, path: ./saveImage.css, language: css, editable: true}
imports: []
featured: false
migrationSource: saveImage.html
migrationFingerprint: d982361cfd6e0d11845f8087176432fa0570771cdd3e9aa8cd766f18fa7006f5
dependencies: []
---

# 화면 이미지 저장

현재 지도 화면을 그대로 PNG 이미지로 내려받는 예제입니다.

## 다루는 기능

- `app.capture()`로 지도 화면을 이미지로 만들어 파일로 내려받고, WebGL 화면 위에 얹힌 POI와 Overlay가 함께 담기는지 확인합니다.

## 사전 조건

- 예제 데이터 서버에 접근할 수 있는 네트워크 환경이 필요합니다.
- 브라우저의 파일 내려받기가 차단되어 있지 않아야 저장 결과를 확인할 수 있습니다.

## 주요 기능

- 여의도 주변에 `U3dPOI` 5개와 `U3dOverlay` 3개를 무작위 위치에 배치해 촬영 대상 화면을 구성합니다.
- `저장` 버튼을 누르면 현재 화면을 `from_canvas.png` 파일로 내려받습니다.
- 배경지도를 바꿔 가며 같은 방식으로 저장할 수 있습니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 오른쪽 `분석` 버튼을 누릅니다. | 저장 패널이 열리고 닫힙니다. 패널은 끌어서 옮길 수 있습니다. |
| 지도를 움직여 담고 싶은 화면을 만듭니다. | 저장 결과는 버튼을 누른 시점의 화면을 그대로 따릅니다. |
| `화면 이미지 저장 (Screenshots)`를 누릅니다. | 현재 화면이 `from_canvas.png`로 내려받아집니다. 지도 위의 POI와 Overlay도 함께 담깁니다. |
| 배경지도를 바꾼 뒤 다시 저장합니다. | 바뀐 배경지도가 반영된 이미지가 저장됩니다. |

## 관련 API

- `U3dAPP.capture()`: 현재 화면을 이미지 dataURL로 만듭니다. 기본값은 WebGL 화면과 지도 위 DOM을 합성하며, WebGL 화면만 필요하면 `capture({dom: false})`를 사용합니다.
- `U3dAPP.captureToBlob()`: 같은 화면을 `Blob`으로 받습니다. 서버 업로드처럼 파일 객체가 필요할 때 사용합니다.
- `U3dPOI`, `U3dOverlay`: 저장 결과에 함께 담기는 지도 위 표시 객체입니다.
- `U3dAPP.setNameBaseLayer()`, `U3dAPP.showLayer()`: 저장할 화면의 배경지도를 바꿉니다.

## 화면 저장

`capture()`가 돌려준 dataURL을 링크의 `download` 속성으로 내려받습니다.

```javascript
$('#save').on('click', function () {
    app.capture().then((image) => {
        var aTag = document.createElement('a');
        aTag.download = 'from_canvas.png';
        aTag.href = image;
        aTag.click();
    });
});
```
