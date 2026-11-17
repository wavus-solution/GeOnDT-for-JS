---
title: A3F 시계열 가시화
theme: pastel-glass-map
output: a3fTimeSeries.html
editor: false
category: simulation
summary: A3F 메타정보와 시간별 수심·유속 자료를 공개 세션으로 연결하고 타임라인에서 재생합니다.
tags: [A3F, 시계열, 홍수, 수심, 유속]
apis: [U3dApp, U3dModelA3FLayer]
dependencies: []
runtime:
  baseLayers: []
  terrain: {enabled: false}
  commonUi: {boxSelection: false}
  mapTools: []
  cameraStatus: false
  help: false
  loading: true
sources:
  - {id: main, path: ./a3fTimeSeries.main.js, language: javascript, editable: false}
  - {id: controls, path: ./a3fTimeSeries.ui.js, language: javascript, editable: false}
  - {id: flow, path: ./a3fTimeSeries.flow.js, language: javascript, editable: false}
  - {id: preview, path: ./a3fTimeSeries.preview.js, language: javascript, editable: false}
  - {id: html, path: ./a3fTimeSeries.html, language: html, editable: false}
  - {id: css, path: ./a3fTimeSeries.css, language: css, editable: false}
verification:
  scenarios:
    - id: timeline-controls
      states:
        timeline:
          type: element
          selector: '#a3f-timeline-host'
          properties: [exists]
      expect:
        timeline: {exists: true}
---
# A3F 시계열 가시화

공통 예제 Runtime이 생성한 지도를 빌려 `UA3FPlaybackSession`과 선택형 타임라인을 연결합니다.

## 다루는 기능

메타정보 읽기, 수심·유속 표시, 프레임 이동과 재생·일시정지, 색상·수면·캐시 설정을 제공합니다.

## 사전 조건

- 메타정보와 프레임 바이너리는 HTTP(S) 서버에서 읽습니다. 기본 주소는 기존 홍수 샘플입니다.
- 원본 프레임 시각·단위를 보존하며 초기 미리보기는 양수 시간 간격의 중앙값을 사용해 약 1프레임/초로 설정합니다.
- 유속 탭의 100프레임 예제 버튼으로 물 표시 구간을 확인하고 입자·화살표를 선택할 수 있습니다.
- 공통 지도와 기존 레이어는 Runtime이 소유하고, 이 예제는 추가한 세션·레이어·위젯·구독만 정리합니다.
- 배포본은 공통 Import Map으로 `doc/dist/extension/a3fTimeSeries/a3fTimeSeries.min.js`를 사용합니다.
- 배포 확장은 GeOnDT SDK의 준비 완료를 기다린 뒤 같은 Three·기본 리소스를 공유하므로 SDK를 먼저 불러옵니다.
- 실행 페이지는 공통 예제 빌드가 생성하는 `edition/a3fTimeSeries.html`을 사용합니다.
- 외부 고도 공급자의 localhost CORS 제한이 있으면 고도 토글을 비활성화하고 영상 배경과 A3F를 유지합니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 메타정보 읽기·분석 자료 표시 | 높이 정책에 맞는 자료와 타임라인을 연결합니다. |
| 타임라인 재생 | 기본 약 1프레임/초로 실제 프레임 자료를 갱신합니다. |
| 가시화 설정 변경·적용 | 와이어프레임·색상·수면은 즉시 적용하고 나머지 보정·유속은 적용 버튼으로 확정합니다. 실제 적용부터 화면 갱신 완료까지 기존 GeOnDT 로딩을 표시합니다. |
| 와이어프레임 | 켜면 기준값 이하 숨김과 관계없이 전체 메쉬의 선을 표시하고, 끄면 기존 면 표시와 숨김 설정을 복원합니다. |
| 분석·유속 범례 색상 조합 | 분석은 지원 수심 필드를 우선 연결해 실제 필드·범위·색상을 함께 적용합니다. 유속 범례는 실제 적용 상태와 표시할 유속이 없는 경우의 안내를 제공합니다. |
| 유속 탭의 100프레임 예제 | 물 표시 구간으로 이동하고 입자 또는 화살표를 확인합니다. |
| 방향 화살표 | 기본 간격 40px·최대 6,000개로 표시하고 카메라 이동 때 기존 위치를 우선 유지합니다. |
| 페이지 종료 | 예제 자원을 먼저 정리하고 공통 Runtime이 지도를 종료합니다. |

## 관련 API

| API | 역할 |
| --- | --- |
| `U3dApp` | 공통 Runtime이 생성하고 이 예제가 빌려 쓰는 지도입니다. |
| `U3dModelA3FLayer` | 공개 세션 내부에서 A3F 표시 객체를 관리합니다. |
| `UA3FPlaybackSession` | 별도 확장의 공개 자료 연결·재생·표시 API입니다. |
