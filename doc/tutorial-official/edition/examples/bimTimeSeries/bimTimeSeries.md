---
title: 교량 시계열 분석
theme: pastel-glass-map
output: bimTimeSeries.html
editor: false
category: simulation
summary: 3D Tiles 교량의 속성 그룹과 일정을 편집하고 타임라인으로 조립·분리를 재생합니다.
tags: [교량, BIM, 3D Tiles, 시계열, 그룹 분리]
apis: [U3dModelTilesLayer, U3dSelect, UMathEngine]
dependencies: []
runtime:
  app: {methodheight:'1_0'}
  home: {longitude: 127.94082125193954, latitude: 37.40477578750969, height: 900, duration: 0, pitch: 55}
  baseLayers: [satellite]
  terrain: {enabled: true, preset: korea}
  commonUi: {boxSelection: false, zoomButtonSensitivity: 0.2}
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
sources:
  - {id: main, path: ./bimTimeSeries.main.js, language: javascript, editable: true}
  - {id: ui, path: ./bimTimeSeries.ui.js, language: javascript, editable: true}
  - {id: html, path: ./bimTimeSeries.html, language: html, editable: true}
  - {id: css, path: ./bimTimeSeries.css, language: css, editable: true}
verification:
  scenarios:
    - id: disconnected-controls
      states:
        controls:
          type: element
          selector: '[data-sequence-action="connect"]'
          properties: [exists, disabled]
        status:
          type: element
          selector: '[data-sequence="status"]'
          properties: [text]
      expect:
        controls: {exists: true, disabled: false}
        status: {text: '자료 주소를 확인하고 연결을 누르십시오. 초기 일정은 설명용입니다.'}
---
# 교량 시계열 분석

3D Tiles 교량의 형상을 재사용하면서 속성별 그룹의 등장과 조립 이동을 시간에 따라 재생합니다.

## 다루는 기능

- `U3dModelTilesLayer`의 GUID별 메쉬를 시퀀스에 연결하고 `U3dSelect`로 고른 객체를 그룹에 배정합니다.
- `USequenceGroupEditor`와 `USequenceScheduleEditor`로 속성 조건·공정·XYZ 이동을 편집합니다.
- `USequenceTimeline`으로 재생·역재생·시간 이동·분리율을 제어하고 확정 설정과 북마크를 파일로 저장합니다.

## 사전 조건

- 형상 tileset.json·model.b3dm과 속성 Schema.json(또는 GUID별 batch.json)을 HTTP(S)로 제공하는 서버가 필요합니다. 로컬 디스크 경로는 웹 서버의 URL로 연결해야 합니다.
- 태장교는 `https://3d-dev.geon.kr/`의 tileset.json과 하위 model 폴더의 batch.json을 직접 읽습니다. 두 예제 자산의 형상·속성 URI와 revision을 함께 유지하십시오.
- 초기 자료 목록은 원본 형상의 804 GUID에서 추출했습니다. 속성 809레코드 전체를 형상 목록으로 간주하지 않습니다.
- revision은 원격 model.b3dm의 SHA-256입니다. 자료가 바뀌면 형상 GUID 범위와 두 연결 자산을 함께 갱신해야 합니다. 런타임은 파일 바이트 해시를 다시 증명하지 않습니다.
- Schema.json은 decomposition의 객체 GUID와 PropertySet 참조를 연결하여 기존 Properties 조회 형식으로 변환합니다. UTF-8 BOM을 허용하며 원본 문자열·숫자 타입을 보존합니다.
- 기본 예제는 외부 tileset 계층의 단일 model.b3dm 콘텐츠를 사용합니다. 초기 전체 보기에서 요청되도록 기존 viewSizeOffset을 10으로 설정했습니다.
- 초기 일정은 설명용 상대 0~90초이며 실제 시공 일정이 아닙니다. 이동 기준은 tileset 경계 중심 후보의 위경도·타원체고를 사용합니다.
- 기존 SDK와 Sequence 확장 헤더를 준비합니다. 재생·탐색 UI는 HTML로 동작하며 별도 UI 엔진을 로드하지 않습니다.
- 이동 경계 API가 포함된 GeOnDT 빌드가 필요합니다. 페이지는 태장교 주변에서 시작하고 자료 연결 전에는 교량을 생성하지 않습니다.

- 편집·분리 그룹은 하부구조 98개, 상부구조 242개, 부대설비 464개입니다. 재생에서는 그룹 순서 대신 최초 카메라와 가까운 부재부터 개별 등장합니다. 콘크리트 도상 11개를 마지막 그룹에 포함해 최종에는 804개 부재가 모두 표시됩니다.
- 새로 미분류된 부재는 숨기는 정책입니다. 실제 시공 순서와 날짜는 그룹·일정 편집에서 별도로 확정하십시오.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 주소를 확인하고 연결 | 문서·속성 검증 후 전용 교량 레이어와 하단 타임라인이 연결되고 일시정지합니다. |
| 객체 선택 · 클릭 선택 켜기/끄기 | 처음에는 지도 클릭·마우스 올림 강조가 꺼져 있습니다. 버튼을 켜면 클릭 선택과 마우스 올림 강조가 활성화되고, 끄면 입력과 강조를 정리합니다. 부재 목록에서 지정한 객체의 강조는 별도로 사용할 수 있습니다. |
| 속성·그룹 편집에서 조건을 지정하고 그룹 확정 | 형상 GUID 범위에서 그룹을 확정합니다. 삭제 그룹을 참조하는 트랙이 남으면 적용을 거부합니다. |
| 단계·일정·조립 이동 편집 후 확정 | 전체 일정과 참조를 검증하고 현재 시각을 새 시간 범위 안에 두고 일시정지합니다. |
| 타임라인 이동·재생·역재생 | 같은 형상에 해당 시각의 등장과 조립 이동이 적용됩니다. |
| XYZ 분리 거리를 적용하고 하단 분리율 변경 | 시간에 따른 조립 이동에 독립 분리 이동을 더합니다. 0%는 해당 시각의 조립 상태로 복귀합니다. |
| 시퀀스 저장·열기 | 확정 설정과 시각·배속·분리율을 복원합니다. 미확정 편집은 저장하지 않으며 다른 자료의 문서는 거부합니다. |
| 연결 취소 또는 잘못된 문서 열기 | 마지막 확정 장면을 유지하고 상태에 원인을 표시합니다. |

## 관련 API

| API | 역할·확인한 제약 |
| --- | --- |
| `U3dModelTilesLayer` | 3D Tiles 형상 제공. 연결 전 이동 경계 API가 있는지 확인합니다. |
| `U3dSelect` | 공통 선택 버튼이 지도 클릭·마우스 올림을 제어하며, 세션 전용 클릭 선택기도 같은 상태로 그룹 편집에 GUID를 전달합니다. 마우스 올림 강조는 공통 선택기만 담당하고 부재 목록의 명시적 강조는 별도로 유지합니다. |
| `UMathEngine` | 기준 위도의 월드 단위/미터 환산. XYZ는 동·북·상 미터 입력입니다. |
| `USequenceSessionManager` | 문서·속성 준비와 자원 교체. 새 Assembly 연결 전에 이전 메쉬 자세를 복원합니다. |
| `USequencePageHandler` | DOM과 편집기·타임라인 연결. 자신이 만든 위젯·이벤트·다운로드 URL만 정리합니다. |

## 근거리 점층 조립

- 전체 재생은 90초이며 각 부재는 약 1.5초 동안 조립됩니다. 최초 재생 또는 시간 이동에서 804 GUID의 기준 형상이 모두 준비되면 카메라 월드 위치를 한 번 고정합니다.
- 같은 GUID의 여러 메쉬 조각은 기준 경계를 합쳐 같은 시각에 등장합니다. 카메라를 이후 움직여도 순서는 바뀌지 않습니다.
- 전체 보기는 경사 55도로 교량을 보여줍니다. 전체 보기 후 재생하면 앞쪽부터 먼 쪽으로 증축되는 모습을 볼 수 있습니다.
- 시퀀스 저장은 고정된 카메라 기준점과 점층 설정을 함께 저장합니다. 저장 문서를 다시 열면 같은 부재 순서를 재현합니다.
- 점층 재생은 그룹별 단일 조립 트랙을 사용합니다. 전체 대상 형상이 아직 준비되지 않았거나 최초 재생 전이면 점층 대상은 숨깁니다.
