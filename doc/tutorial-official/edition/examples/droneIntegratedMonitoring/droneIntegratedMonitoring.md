---
title: 드론 통합 모니터링 예제
theme: pastel-glass-map
output: droneIntegratedMonitoring.html
editor: true
category: simulation
summary: 실제 렌더러의 WebGL 2.0 사용 정보를 확인하고, Instance Rendering 방식의 드론을 무작위 비행시키며 누적 비행경로와 드론별 상세 설정을 한 화면에서 확인합니다.
tags: [드론, 군집 무인기, WebGL 2.0, Instance Rendering, 누적 경로, moveSmoothly, 모니터링]
apis:
  - U3dAPP.getRenderer
  - U3dAPP.createMultipleComponentLayer
  - U3dAPP.createDebugCanvas
  - U3dAPP.removeDebugCanvas
  - U3dAPP.setCameraType
  - U3dAPP.set2DMode
  - U3dAPP.set3DMode
  - U3dMultipleComponentLayer.setInstanced
  - U3dMultipleComponentLayer.isInstanced
  - U3dMultipleComponentLayer.addPosition
  - U3dMultipleComponentLayer.removeComponentByName
  - U3dComponentPosition.setBrightness
  - U3dComponentPosition.setContrast
  - U3dComponentPosition.setCumulativePathStyle
  - UFrustum
  - U3dAPP.setFrustumTerrainProjectionHelper
  - UFrustumTerrainProjectionHelper
  - U3dAPP.getAnalysis
  - UAnalyHeight
  - UAnalyContour
  - U3dSelect.active
  - U3dSelect.deactive
  - U3dSelect.getSelected
  - U3dVectorLayer.addGeometry
  - U3dVectorLayer.removeGeometry
  - U3dGeometryFactory.addJson
  - U3dVectorLayer.clear
  - UGroupBoundaryHelper
  - UTerrainStamp
  - U3dAPP.getHeightLayers
  - U3dAPP.geographicToVector3
  - U3dAPP.vector3ToGeoGraphic
  - U3dHeightLayer.setHeightScale
  - U3dCumulativePath
runtime:
  commonUi:
    imageLayerPanel: true
    terrainLayerPanel: true
  # 홈 좌표는 드론 출발 영역(CONFIG.initialDronePositions) 중심입니다.
  # Common Runtime은 height를 카메라 거리(m), pitch를 수직 기준 시야각(°)으로 setHomePosition에 전달합니다.
  home:
    longitude: 127.9430
    latitude: 37.3470
    height: 5000
    duration: 0
    pitch: 12
  baseLayers: [satellite]
  terrain:
    enabled: true
    preset: korea
  mapTools: [home, north, zoom-in, zoom-out]
  cameraStatus: true
  help: true
  loading: true
verification:
  scenarios:
    # 검수 순서 ①③: 초기 실행 후 드론 8대(그룹 2개에 3대씩 편성, 개별 2대)와 목록, 지도 도구의 성능 확인·실행 환경 버튼을 확인한다.
    - id: initial-state
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
      states:
        panel:
          type: element
          selector: "#drone-monitoring-panel"
          properties: [exists, visible]
        envButton:
          type: element
          selector: ".map-tools #drone-env-open"
          properties: [exists, visible]
        perfButton:
          type: element
          selector: ".map-tools #drone-perf-toggle"
          properties: [exists, visible]
        devToolPanel:
          type: element
          selector: "#UDevToolView"
          properties: [count]
        envPanel:
          type: element
          selector: "#drone-env-panel"
          properties: [exists, visible]
        modelStatus:
          type: element
          selector: "#drone-model-status"
          properties: [exists, text]
        droneItems:
          type: element
          selector: "[data-drone-list-item]"
          properties: [count]
        groupItems:
          type: element
          selector: "[data-group-id]"
          properties: [count]
        flyingCount:
          type: element
          selector: "#drone-flying-count"
          properties: [exists, text]
        firstSelected:
          type: element
          selector: "[data-drone-id='drone-01'][data-selected='true']"
          properties: [exists]
        detailName:
          type: element
          selector: "#drone-detail-name"
          properties: [exists, text]
        detailPanel:
          type: element
          selector: "#drone-detail-panel"
          properties: [exists, visible]
        focusButton:
          type: element
          selector: "#drone-focus"
          properties: [exists, disabled]
        droneLayer:
          type: layer
          name: droneMonitoringLayer
          properties: [exists, visible]
      expect:
        panel: {exists: true, visible: true}
        detailPanel: {exists: true, visible: true}
        focusButton: {exists: true, disabled: false}
        envButton: {exists: true, visible: true}
        perfButton: {exists: true, visible: true}
        devToolPanel: {count: 0}
        envPanel: {exists: true, visible: false}
        modelStatus: {exists: true, text: "드론 모델 준비 완료"}
        droneItems: {count: 8}
        groupItems: {count: 2}
        flyingCount: {exists: true, text: "8"}
        firstSelected: {exists: true}
        detailName: {exists: true, text: "drone-01"}
        droneLayer: {exists: true, visible: true}
    # 검수 순서 ①: 지도 도구의 성능 확인 버튼을 누르면 엔진 디버그 UI(Development Tools, #UDevToolView)가 만들어지고 버튼이 눌림 상태가 된다.
    - id: open-performance-panel
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "#drone-perf-toggle"
      states:
        devToolPanel:
          type: element
          selector: "#UDevToolView"
          properties: [exists, visible]
        perfButton:
          type: element
          selector: "#drone-perf-toggle[aria-pressed='true']"
          properties: [exists]
      expect:
        devToolPanel: {exists: true, visible: true}
        perfButton: {exists: true}
    # 검수 순서 ①: 성능 확인 버튼을 다시 누르면 디버그 UI가 제거되고 버튼이 원래 상태로 돌아온다.
    - id: close-performance-panel
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "#drone-perf-toggle"
        - type: wait
          selector: "#UDevToolView"
          state: attached
        - type: click
          selector: "#drone-perf-toggle"
      states:
        devToolPanel:
          type: element
          selector: "#UDevToolView"
          properties: [count]
        perfButton:
          type: element
          selector: "#drone-perf-toggle[aria-pressed='false']"
          properties: [exists]
      expect:
        devToolPanel: {count: 0}
        perfButton: {exists: true}
    # 검수 순서 ⑫: 레일의 고도 범례 버튼을 누르면 고도 범례 패널이 열리고, 가시화가 꺼져 있어 편집 영역은 숨겨져 있다.
    - id: open-height-legend-panel
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "[data-panel-target='drone-height-legend-panel']"
      states:
        legendPanel:
          type: element
          selector: "#drone-height-legend-panel"
          properties: [exists, visible]
        legendVisible:
          type: element
          selector: "#drone-legend-visible"
          properties: [exists, checked]
        contourVisible:
          type: element
          selector: "#drone-contour-visible"
          properties: [exists, checked]
        legendSection:
          type: element
          selector: "#drone-legend-section"
          properties: [exists, visible]
        contourSection:
          type: element
          selector: "#drone-contour-section"
          properties: [exists, visible]
      expect:
        legendPanel: {exists: true, visible: true}
        legendVisible: {exists: true, checked: false}
        contourVisible: {exists: true, checked: false}
        legendSection: {exists: true, visible: false}
        contourSection: {exists: true, visible: false}
    # 검수 순서 ⑫: 고도 범례 가시화를 켜면 범례 편집 영역이 열리고 기본 범례 5개(0~400m)가 표시된다.
    - id: enable-height-legend
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "[data-panel-target='drone-height-legend-panel']"
        - type: check
          selector: "#drone-legend-visible"
      states:
        legendSection:
          type: element
          selector: "#drone-legend-section"
          properties: [exists, visible]
        legendRows:
          type: element
          selector: ".drone-legend-row"
          properties: [count]
        firstValue:
          type: element
          selector: ".drone-legend-row[data-index='0'] .drone-legend-value"
          properties: [exists, text]
        removeButton:
          type: element
          selector: "#drone-legend-remove"
          properties: [exists, disabled]
      expect:
        legendSection: {exists: true, visible: true}
        legendRows: {count: 5}
        firstValue: {exists: true, text: "0m"}
        removeButton: {exists: true, disabled: false}
    # 검수 순서 ⑫: 등고선 가시화를 켜면 등고선 스타일 영역이 열리고 기본 구간 5개와 투명도 0.85가 표시된다.
    - id: enable-contour
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "[data-panel-target='drone-height-legend-panel']"
        - type: check
          selector: "#drone-contour-visible"
      states:
        contourSection:
          type: element
          selector: "#drone-contour-section"
          properties: [exists, visible]
        contourRows:
          type: element
          selector: ".drone-contour-row"
          properties: [count]
        opacityValue:
          type: element
          selector: "#drone-contour-opacity-value"
          properties: [exists, text]
        widthInput:
          type: element
          selector: "#drone-contour-width"
          properties: [exists, value]
      expect:
        contourSection: {exists: true, visible: true}
        contourRows: {count: 5}
        opacityValue: {exists: true, text: "0.85"}
        widthInput: {exists: true, value: "3"}
    # 검수 순서 ①②③: 지도 도구의 실행 환경 버튼을 누르면 정보 팝업이 열리고 WebGL 2.0·Instance 정보가 표시된다.
    - id: open-environment-popup
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "#drone-env-open"
      states:
        envPanel:
          type: element
          selector: "#drone-env-panel"
          properties: [exists, visible]
        webgl2:
          type: element
          selector: "#drone-env-webgl2"
          properties: [exists, text]
        instanceMode:
          type: element
          selector: "#drone-env-instance-mode"
          properties: [exists, text]
        instanceCount:
          type: element
          selector: "#drone-env-instance-count"
          properties: [exists, text]
      expect:
        envPanel: {exists: true, visible: true}
        webgl2: {exists: true, text: "사용"}
        instanceMode: {exists: true, text: "Instance 모드"}
        instanceCount: {exists: true, text: "8대 / 전체 8대"}
    # 검수 순서 ②: 팝업의 ×를 누르면 실행 환경 팝업이 닫힌다.
    - id: close-environment-popup
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "#drone-env-open"
        - type: click
          selector: "#drone-env-close"
      states:
        envPanel:
          type: element
          selector: "#drone-env-panel"
          properties: [exists, visible]
      expect:
        envPanel: {exists: true, visible: false}
    # 검수 순서 ④: 드론을 한 대 추가하면 9대가 되고 새 드론이 선택되며, 실행 환경 팝업의 Instance 드론 수도 늘어난다.
    - id: add-drone
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "#drone-add"
        - type: click
          selector: "#drone-env-open"
      states:
        droneItems:
          type: element
          selector: "[data-drone-list-item]"
          properties: [count]
        flyingCount:
          type: element
          selector: "#drone-flying-count"
          properties: [exists, text]
        instanceCount:
          type: element
          selector: "#drone-env-instance-count"
          properties: [exists, text]
        detailName:
          type: element
          selector: "#drone-detail-name"
          properties: [exists, text]
        newSelected:
          type: element
          selector: "[data-drone-id='drone-04'][data-selected='true']"
          properties: [exists]
      expect:
        droneItems: {count: 9}
        flyingCount: {exists: true, text: "9"}
        instanceCount: {exists: true, text: "9대 / 전체 9대"}
        detailName: {exists: true, text: "drone-09"}
        newSelected: {exists: true}
    # 검수 순서 ④: 추가한 드론을 삭제하면 8대로 돌아오고 남은 드론이 선택된다.
    - id: remove-selected-drone
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "#drone-add"
        - type: click
          selector: "#drone-remove"
      states:
        droneItems:
          type: element
          selector: "[data-drone-list-item]"
          properties: [count]
        removedItem:
          type: element
          selector: "[data-drone-id='drone-04']"
          properties: [exists]
        flyingCount:
          type: element
          selector: "#drone-flying-count"
          properties: [exists, text]
        detailName:
          type: element
          selector: "#drone-detail-name"
          properties: [exists, text]
        removeButton:
          type: element
          selector: "#drone-remove"
          properties: [exists, disabled]
      expect:
        droneItems: {count: 8}
        removedItem: {exists: false}
        flyingCount: {exists: true, text: "8"}
        detailName: {exists: true, text: "drone-08"}
        removeButton: {exists: true, disabled: false}
    # 검수 순서 ⑤: 다른 드론을 선택하고 비행 경로 탭으로 전환한다.
    - id: select-drone-and-switch-tab
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "[data-drone-id='drone-02'] .drone-list-button"
        - type: click
          selector: "#drone-tab-path"
      states:
        detailName:
          type: element
          selector: "#drone-detail-name"
          properties: [exists, text]
        secondSelected:
          type: element
          selector: "[data-drone-id='drone-02'][data-selected='true']"
          properties: [exists]
        basicPanel:
          type: element
          selector: "#drone-tabpanel-basic"
          properties: [exists, visible]
        pathPanel:
          type: element
          selector: "#drone-tabpanel-path"
          properties: [exists, visible]
        pathVisible:
          type: element
          selector: "#drone-path-visible"
          properties: [exists, checked, disabled]
        pathColor:
          type: element
          selector: "#drone-path-color"
          properties: [exists, disabled]
        pathFade:
          type: element
          selector: "#drone-path-fade"
          properties: [exists, checked, disabled]
        pathMaxDistance:
          type: element
          selector: "#drone-path-max-distance"
          properties: [exists, disabled]
      expect:
        detailName: {exists: true, text: "drone-02"}
        secondSelected: {exists: true}
        basicPanel: {exists: true, visible: false}
        pathPanel: {exists: true, visible: true}
        pathVisible: {exists: true, checked: true, disabled: false}
        pathColor: {exists: true, disabled: false}
        pathFade: {exists: true, checked: true, disabled: false}
        pathMaxDistance: {exists: true, disabled: false}
    # 검수 순서 ⑥: 비행 경로 탭의 오래된 경로 Fade를 끄면 값 표시가 '사용 안 함'이 되고 거리·비율 슬라이더만 잠긴다.
    - id: disable-path-fade
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "#drone-tab-path"
        - type: uncheck
          selector: "#drone-path-fade"
      states:
        fadeValue:
          type: element
          selector: "#drone-path-fade-value"
          properties: [exists, text]
        maxDistance:
          type: element
          selector: "#drone-path-max-distance"
          properties: [exists, disabled]
        widthFade:
          type: element
          selector: "#drone-path-width-fade"
          properties: [exists, disabled]
        widthSlider:
          type: element
          selector: "#drone-path-width"
          properties: [exists, disabled]
      expect:
        fadeValue: {exists: true, text: "사용 안 함"}
        maxDistance: {exists: true, disabled: true}
        widthFade: {exists: true, disabled: true}
        widthSlider: {exists: true, disabled: false}
    # 검수 순서 ⑤: 촬영 영역 탭으로 전환하면 표시 체크박스(기본 꺼짐)와 Frustum·Helper 설정 컨트롤이 기본값으로 활성화된다.
    - id: switch-to-frustum-tab
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "#drone-tab-frustum"
      states:
        frustumPanel:
          type: element
          selector: "#drone-tabpanel-frustum"
          properties: [exists, visible]
        frustumVisible:
          type: element
          selector: "#drone-frustum-visible"
          properties: [exists, checked, disabled]
        fovSlider:
          type: element
          selector: "#drone-frustum-fov"
          properties: [exists, disabled]
        fovValue:
          type: element
          selector: "#drone-frustum-fov-value"
          properties: [exists, text]
        farValue:
          type: element
          selector: "#drone-frustum-far-value"
          properties: [exists, text]
        stabilization:
          type: element
          selector: "#drone-frustum-intersection-stabilization"
          properties: [exists, checked, disabled]
        resetButton:
          type: element
          selector: "#drone-frustum-reset"
          properties: [exists, disabled]
      expect:
        frustumPanel: {exists: true, visible: true}
        frustumVisible: {exists: true, checked: false, disabled: false}
        fovSlider: {exists: true, disabled: false}
        fovValue: {exists: true, text: "50°"}
        farValue: {exists: true, text: "18,000 m"}
        stabilization: {exists: true, checked: true, disabled: false}
        resetButton: {exists: true, disabled: false}
    # 검수 순서 ⑤: 촬영 영역 표시를 켜면 체크 상태가 유지된다(지면 투영 Helper 생성).
    - id: show-frustum
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "#drone-tab-frustum"
        - type: check
          selector: "#drone-frustum-visible"
      states:
        frustumVisible:
          type: element
          selector: "#drone-frustum-visible"
          properties: [exists, checked]
      expect:
        frustumVisible: {exists: true, checked: true}
    # 검수 순서 ⑤: 드론 설정 탭으로 전환하면 선택 드론의 밝기·대비·이동 보간 시간 슬라이더가 활성화된다.
    - id: switch-to-settings-tab
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "#drone-tab-settings"
      states:
        settingsPanel:
          type: element
          selector: "#drone-tabpanel-settings"
          properties: [exists, visible]
        basicPanel:
          type: element
          selector: "#drone-tabpanel-basic"
          properties: [exists, visible]
        brightness:
          type: element
          selector: "#drone-brightness"
          properties: [exists, value, disabled]
        contrast:
          type: element
          selector: "#drone-contrast"
          properties: [exists, value, disabled]
        durationMs:
          type: element
          selector: "#drone-duration-ms"
          properties: [exists, value, disabled]
      expect:
        settingsPanel: {exists: true, visible: true}
        basicPanel: {exists: true, visible: false}
        brightness: {exists: true, value: "1", disabled: false}
        contrast: {exists: true, value: "1", disabled: false}
        durationMs: {exists: true, value: "20", disabled: false}
    # 검수 순서 ⑤: 목록에서 선택된 드론을 다시 누르면 선택이 해제되고, 다른 드론을 누르면 다시 선택된다.
    - id: toggle-selection-in-list
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "[data-drone-id='drone-01'] .drone-list-button"
      states:
        firstSelected:
          type: element
          selector: "[data-drone-id='drone-01'][data-selected='true']"
          properties: [exists]
        anySelected:
          type: element
          selector: "[data-drone-list-item][data-selected='true']"
          properties: [count]
        detailName:
          type: element
          selector: "#drone-detail-name"
          properties: [exists, text]
        detailPanel:
          type: element
          selector: "#drone-detail-panel"
          properties: [exists, visible]
        removeButton:
          type: element
          selector: "#drone-remove"
          properties: [exists, disabled]
        focusButton:
          type: element
          selector: "#drone-focus"
          properties: [exists, disabled]
      expect:
        firstSelected: {exists: false}
        anySelected: {count: 0}
        detailName: {exists: true, text: "-"}
        detailPanel: {exists: true, visible: false}
        removeButton: {exists: true, disabled: true}
        focusButton: {exists: true, disabled: true}
    # 검수 순서 ⑧: 그룹을 추가하면 목록에 그룹이 생기고 왼쪽에 그룹 상세 설정 창이 열리며, 드론 선택이 해제되어 드론 상세 설정 창은 닫힌다.
    - id: add-group-opens-group-panel
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "#drone-group-add"
      states:
        groupItem:
          type: element
          selector: "[data-group-id='group-01'][data-selected='true']"
          properties: [exists]
        groupName:
          type: element
          selector: "[data-group-id='group-01'] .drone-list-name"
          properties: [exists, text]
        groupPanel:
          type: element
          selector: "#drone-group-panel"
          properties: [exists, visible]
        groupTitle:
          type: element
          selector: "#drone-group-title"
          properties: [exists, text]
        groupNameInput:
          type: element
          selector: "#drone-group-name"
          properties: [exists, value]
        detailPanel:
          type: element
          selector: "#drone-detail-panel"
          properties: [exists, visible]
        groupRemoveButton:
          type: element
          selector: "#drone-group-remove"
          properties: [exists, disabled]
        anyDroneSelected:
          type: element
          selector: "[data-drone-list-item][data-selected='true']"
          properties: [count]
      expect:
        groupItem: {exists: true}
        groupName: {exists: true, text: "그룹1"}
        groupPanel: {exists: true, visible: true}
        groupTitle: {exists: true, text: "그룹1"}
        groupNameInput: {exists: true, value: "그룹1"}
        detailPanel: {exists: true, visible: false}
        groupRemoveButton: {exists: true, disabled: false}
        anyDroneSelected: {count: 0}
    # 검수 순서 ⑩: 레일의 도형 버튼으로 3D 객체 그리기 패널을 열면 드론 패널이 닫히고, JSON으로 도형을 만들면 도형 목록에 추가된다.
    - id: open-shape-panel-and-create-json
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "[data-panel-target='shape-draw-panel']"
        - type: click
          selector: "#shape-json-create"
      states:
        drawPanel:
          type: element
          selector: "#shape-draw-panel"
          properties: [exists, visible]
        dronePanel:
          type: element
          selector: "#drone-monitoring-panel"
          properties: [exists, visible]
        result:
          type: element
          selector: "#shape-json-result"
          properties: [exists, visible, text]
        shapeItems:
          type: element
          selector: "[data-shape-id]"
          properties: [count]
        shapeCount:
          type: element
          selector: "#shape-count"
          properties: [exists, text]
        shapeLayer:
          type: layer
          name: droneShapeLayer
          properties: [exists, visible]
      expect:
        drawPanel: {exists: true, visible: true}
        dronePanel: {exists: true, visible: false}
        result: {exists: true, visible: true, text: "생성 완료 (1개)"}
        shapeItems: {count: 1}
        shapeCount: {exists: true, text: "1"}
        shapeLayer: {exists: true, visible: true}
    # 검수 순서 ⑩: 도형 목록에서 도형을 누르면 왼쪽에 3D 도형 상세 설정 창이 열리고 드론 선택은 해제된다.
    - id: select-shape-opens-detail
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "[data-panel-target='shape-draw-panel']"
        - type: click
          selector: "#shape-json-create"
        - type: click
          selector: "[data-shape-id='shape-01'] .shape-list-button"
      states:
        shapeDetail:
          type: element
          selector: "#shape-detail-panel"
          properties: [exists, visible]
        shapeName:
          type: element
          selector: "#shape-detail-name"
          properties: [exists, text]
        shapeSelected:
          type: element
          selector: "[data-shape-id='shape-01'][data-selected='true']"
          properties: [exists]
        droneDetail:
          type: element
          selector: "#drone-detail-panel"
          properties: [exists, visible]
        anyDroneSelected:
          type: element
          selector: "[data-drone-list-item][data-selected='true']"
          properties: [count]
      expect:
        shapeDetail: {exists: true, visible: true}
        shapeName: {exists: true, text: "포인트 1"}
        shapeSelected: {exists: true}
        droneDetail: {exists: true, visible: false}
        anyDroneSelected: {count: 0}
    # 검수 순서 ⑩: 상세 설정 창 JSON 영역의 스타일 값을 고쳐 JSON 적용을 누르면 도형에 반영되고 결과 문구가 표시된다.
    - id: apply-shape-json
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "[data-panel-target='shape-draw-panel']"
        - type: click
          selector: "#shape-json-create"
        - type: click
          selector: "[data-shape-id='shape-01'] .shape-list-button"
        - type: fill
          selector: "#shape-json-view"
          value: "{\"color\": \"#ff0000\", \"opacity\": 0.5}"
        - type: click
          selector: "#shape-json-apply"
      states:
        result:
          type: element
          selector: "#shape-json-apply-result"
          properties: [exists, visible, text]
        applyButton:
          type: element
          selector: "#shape-json-apply"
          properties: [exists, disabled]
      expect:
        result: {exists: true, visible: true, text: "✓ JSON을 적용했습니다: 스타일 2개 항목(color, opacity)"}
        applyButton: {exists: true, disabled: false}
    # 검수 순서 ⑪: 도구 패널을 열면 좌표계 변환·이미지 출력 구획이 접혀 있어 제목만 보인다.
    - id: tools-panel-collapsed
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "[data-panel-target='drone-tools-panel']"
      states:
        toolsPanel:
          type: element
          selector: "#drone-tools-panel"
          properties: [exists, visible]
        openSections:
          type: element
          selector: "#drone-tools-panel details.drone-collapsible[open]"
          properties: [count]
        coordsHeading:
          type: element
          selector: "#drone-coords-heading"
          properties: [exists, visible]
        coordsInput:
          type: element
          selector: "#drone-coords-x"
          properties: [exists, visible]
      expect:
        toolsPanel: {exists: true, visible: true}
        openSections: {count: 0}
        coordsHeading: {exists: true, visible: true}
        coordsInput: {exists: true, visible: false}
    # 검수 순서 ⑪: 좌표계 변환 제목을 누르면 그 구획만 펼쳐져 입력이 나타난다.
    - id: expand-coordinate-tool
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "[data-panel-target='drone-tools-panel']"
        - type: click
          selector: "#drone-coords-heading"
      states:
        openSections:
          type: element
          selector: "#drone-tools-panel details.drone-collapsible[open]"
          properties: [count]
        coordsInput:
          type: element
          selector: "#drone-coords-x"
          properties: [exists, visible]
        stampUpload:
          type: element
          selector: "#drone-stamp-upload"
          properties: [exists, visible]
      expect:
        openSections: {count: 1}
        coordsInput: {exists: true, visible: true}
        stampUpload: {exists: true, visible: false}
    # 검수 순서 ⑪: 설정 패널을 열면 드론 패널이 닫히고, 지형 고도 배율 입력을 바꾸면 값이 반영된다.
    - id: open-settings-panel-and-scale-terrain
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "[data-panel-target='drone-settings-panel']"
        - type: click
          selector: "#drone-terrain-heading"
        - type: fill
          selector: "#drone-terrain-height-scale"
          value: "2"
      states:
        settingsPanel:
          type: element
          selector: "#drone-settings-panel"
          properties: [exists, visible]
        dronePanel:
          type: element
          selector: "#drone-monitoring-panel"
          properties: [exists, visible]
        scaleInput:
          type: element
          selector: "#drone-terrain-height-scale"
          properties: [exists, visible, value]
        status:
          type: element
          selector: "#drone-terrain-height-status"
          properties: [exists, visible]
      expect:
        settingsPanel: {exists: true, visible: true}
        dronePanel: {exists: true, visible: false}
        scaleInput: {exists: true, visible: true, value: "2"}
        status: {exists: true, visible: true}
    # 검수 순서 ⑧: 그룹 이름을 바꾸면 목록과 창 제목이 함께 바뀌고, 그룹을 삭제하면 목록에서 사라진다.
    - id: rename-and-remove-group
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "#drone-group-add"
        - type: fill
          selector: "#drone-group-name"
          value: "정찰조"
        - type: click
          selector: "#drone-group-remove"
      states:
        groupItem:
          type: element
          selector: "[data-group-id='group-01']"
          properties: [exists]
        groupPanel:
          type: element
          selector: "#drone-group-panel"
          properties: [exists, visible]
        groupRemoveButton:
          type: element
          selector: "#drone-group-remove"
          properties: [exists, disabled]
        droneItems:
          type: element
          selector: "[data-drone-list-item]"
          properties: [count]
      expect:
        groupItem: {exists: false}
        groupPanel: {exists: true, visible: false}
        groupRemoveButton: {exists: true, disabled: true}
        droneItems: {count: 3}
    # 검수 순서 ⑤: 상세 설정 창을 닫아도 목록에서 드론을 누르면 그 드론 내용으로 다시 열린다.
    - id: close-and-reopen-detail-panel
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "#drone-detail-close"
        - type: wait
          selector: "#drone-detail-panel"
          state: hidden
        - type: click
          selector: "[data-drone-id='drone-03'] .drone-list-button"
      states:
        detailPanel:
          type: element
          selector: "#drone-detail-panel"
          properties: [exists, visible]
        openButton:
          type: element
          selector: "#drone-detail-open"
          properties: [exists, visible]
        detailName:
          type: element
          selector: "#drone-detail-name"
          properties: [exists, text]
      expect:
        detailPanel: {exists: true, visible: true}
        openButton: {exists: true, visible: false}
        detailName: {exists: true, text: "drone-03"}
    # 검수 순서 ⑥: 선택한 드론의 경로 표시만 끄면 그 드론은 숨김, 다른 드론의 설정은 그대로 유지된다.
    - id: hide-selected-path-only
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "#drone-tab-path"
        - type: uncheck
          selector: "#drone-path-visible"
        - type: click
          selector: "[data-drone-id='drone-02'] .drone-list-button"
      states:
        detailName:
          type: element
          selector: "#drone-detail-name"
          properties: [exists, text]
        otherDronePathVisible:
          type: element
          selector: "#drone-path-visible"
          properties: [exists, checked]
        otherDronePathDisplay:
          type: element
          selector: "#drone-path-display"
          properties: [exists, text]
      expect:
        detailName: {exists: true, text: "drone-02"}
        otherDronePathVisible: {exists: true, checked: true}
        otherDronePathDisplay: {exists: true, text: "표시 중"}
    # 검수 순서 ⑥: 경로 표시를 끄면 숨김으로 표시되고, 드론을 다시 선택해도 저장된 설정이 복원된다.
    - id: hidden-path-setting-restored
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "#drone-tab-path"
        - type: uncheck
          selector: "#drone-path-visible"
        - type: click
          selector: "[data-drone-id='drone-02'] .drone-list-button"
        - type: click
          selector: "[data-drone-id='drone-01'] .drone-list-button"
      states:
        detailName:
          type: element
          selector: "#drone-detail-name"
          properties: [exists, text]
        pathVisible:
          type: element
          selector: "#drone-path-visible"
          properties: [exists, checked]
        pathDisplay:
          type: element
          selector: "#drone-path-display"
          properties: [exists, text]
      expect:
        detailName: {exists: true, text: "drone-01"}
        pathVisible: {exists: true, checked: false}
        pathDisplay: {exists: true, text: "숨김"}
    # 검수 순서 ⑥: 표시를 다시 켜면 경로가 다시 표시 중으로 바뀐다.
    - id: show-path-again
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "#drone-tab-path"
        - type: uncheck
          selector: "#drone-path-visible"
        - type: check
          selector: "#drone-path-visible"
      states:
        pathVisible:
          type: element
          selector: "#drone-path-visible"
          properties: [exists, checked]
        pathCreated:
          type: element
          selector: "#drone-path-created"
          properties: [exists, text]
        pathDisplay:
          type: element
          selector: "#drone-path-display"
          properties: [exists, text]
      expect:
        pathVisible: {exists: true, checked: true}
        pathCreated: {exists: true, text: "경로 객체 생성됨"}
        pathDisplay: {exists: true, text: "표시 중"}
    # 검수 순서 ⑦: 전체 일시정지 시 비행 중인 수가 0이 되고 버튼 상태가 바뀐다.
    - id: pause-all-drones
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "#drone-pause"
      states:
        flyingCount:
          type: element
          selector: "#drone-flying-count"
          properties: [exists, text]
        totalCount:
          type: element
          selector: "#drone-total-count"
          properties: [exists, visible, text]
        pauseButton:
          type: element
          selector: "#drone-pause"
          properties: [exists, disabled]
        resumeButton:
          type: element
          selector: "#drone-resume"
          properties: [exists, disabled]
        firstStatus:
          type: element
          selector: "[data-drone-id='drone-01'] .drone-list-status"
          properties: [exists, text]
        basicFlight:
          type: element
          selector: "#drone-basic-flight"
          properties: [exists, text]
      expect:
        flyingCount: {exists: true, text: "0"}
        totalCount: {exists: true, visible: true, text: "8"}
        pauseButton: {exists: true, disabled: true}
        resumeButton: {exists: true, disabled: false}
        firstStatus: {exists: true, text: "일시정지"}
        basicFlight: {exists: true, text: "일시정지"}
    # 검수 순서 ⑦: 재개하면 비행 중인 수와 버튼 상태가 되돌아온다.
    - id: resume-all-drones
      actions:
        - type: wait
          selector: "[data-drone-id='drone-01']"
          state: attached
        - type: click
          selector: "#drone-pause"
        - type: click
          selector: "#drone-resume"
      states:
        flyingCount:
          type: element
          selector: "#drone-flying-count"
          properties: [exists, text]
        pauseButton:
          type: element
          selector: "#drone-pause"
          properties: [exists, disabled]
        resumeButton:
          type: element
          selector: "#drone-resume"
          properties: [exists, disabled]
        firstStatus:
          type: element
          selector: "[data-drone-id='drone-01'] .drone-list-status"
          properties: [exists, text]
      expect:
        flyingCount: {exists: true, text: "8"}
        pauseButton: {exists: true, disabled: false}
        resumeButton: {exists: true, disabled: true}
        firstStatus: {exists: true, text: "비행 중 · 리더"}
sources:
  - id: main
    path: ./droneIntegratedMonitoring.main.js
    language: javascript
    editable: true
  - id: ui
    path: ./droneIntegratedMonitoring.ui.js
    language: javascript
    editable: true
  - id: api
    label: API Help
    path: ./droneIntegratedMonitoring.api.js
    language: javascript
    editable: true
  - id: steering
    label: steering.js
    path: ./steering.js
    language: javascript
    editable: true
  - id: shapes
    label: shapes.js
    path: ./shapes.js
    language: javascript
    editable: true
  - id: shapesUi
    label: shapesUi.js
    path: ./shapesUi.js
    language: javascript
    editable: true
  - id: html
    path: ./droneIntegratedMonitoring.html
    language: html
    editable: true
  - id: css
    path: ./droneIntegratedMonitoring.css
    language: css
    editable: true
# 선회 제한 이동 모듈(steering), 3D 도형 관리자(shapes), 3D 도형 화면(shapesUi). main·ui가 context.modules로 사용합니다.
imports: [steering, shapes, shapesUi]
---

# 드론 통합 모니터링 예제

군집 무인기 3D 임무현황 모니터링 S/W의 렌더링 엔진 기능을 한 페이지에서 확인하는 통합 예제입니다. 실제 지도 렌더러가 사용하는 WebGL 2.0 정보를 표시하고, Instance Rendering 방식으로 만든 여러 대의 드론이 무작위로 비행하면서 이동 위치를 누적한 3D 비행경로를 그립니다. 오른쪽 분석창에서 드론을 추가·삭제·선택하고, 선택한 드론의 기본 정보와 비행경로 설정을 탭으로 확인합니다.

이 예제는 요구사항 **SGM-TC-GIS-FUNC-0010** (3D GIS Engine CSC는 WebGL 2.0 표준을 지원하여 Instance Rendering 객체 가시화와 다수점을 활용한 라인 변환 가시화 기능 등을 제공하여야 한다)을 다음 동작으로 확인합니다.

- 실제 지도 렌더러의 WebGL 2.0 컨텍스트 사용 정보 확인
- Instance Rendering이 적용된 복수 드론의 가시화
- 비행 중 연속 갱신되는 드론 위치가 누적되어 3D 비행경로로 표시되는 동작

표시되는 WebGL 정보는 현재 실행 환경에서 WebGL 2.0 컨텍스트를 사용하는지 확인하기 위한 것이며, WebGL 표준 적합성 인증을 뜻하지 않습니다.

## 다루는 기능

- `U3dAPP.getRenderer().getContext()`로 실제 지도 렌더러의 WebGL 컨텍스트를 읽어 WebGL 2.0 사용 여부, WebGL·GLSL 버전, Renderer 정보를 화면에 표시합니다.
- 지도 도구의 2D/3D 스위치로 orthographic 예제처럼 `U3dAPP.setCameraType('orthographic'|'perspective')`로 카메라를 바꾸고 `set2DMode()`(TopView 고정)·`set3DMode()`(기울인 시점)를 호출해 2D·3D 보기를 전환합니다.
- 지도 도구의 **성능 확인** 버튼으로 `U3dAPP.createDebugCanvas()`를 호출해 엔진 디버그 UI(`Development Tools` 패널: FPS·메모리 그래프, Settings·Debug 탭)를 만들고, 다시 누르면 `removeDebugCanvas()`로 제거합니다. 패널(`#UDevToolView`)은 엔진 기본 위치 대신 지도 도구 아래·오른쪽 레일 왼쪽에 두고, 오른쪽 예제 패널이나 실행 환경 팝업이 열리면 그 왼쪽으로 비켜 겹치지 않게 합니다.
- `U3dAPP.createMultipleComponentLayer()`와 `U3dMultipleComponentLayer.setInstanced(true)`로 같은 모델 원본을 재사용하는 Instance Rendering 드론 레이어를 만들고, `addPosition()`으로 드론을 생성·`removeComponentByName()`으로 삭제합니다.
- `U3dMultipleComponentLayer.isInstanced()`와 `U3dComponentPosition.getInstanced()`로 레이어의 생성 모드와 개별 드론의 Instance 적용 여부를 구분해 확인합니다.
- `U3dComponentPosition.moveSmoothly()`로 드론을 일정 주기마다 다음 목표 위치로 부드럽게 이동시키고, `movePause()`·`moveResume()`으로 전체 비행을 일시정지·재개합니다.
- `drawCumulativePath`, `showCumulativeRoute()`, `hideCumulativeRoute()`, `setCumulativePathStyle()`, `getCumulativePath()`로 드론별 누적 비행경로의 생성·표시·스타일을 제어합니다. 비행 경로 탭의 **누적 경로 표현**(animationComponents 예제와 같은 경로 색상·투명도·폭, 오래된 경로 Fade, 최대 표시 거리, 폭·투명도 Fade 비율)은 선택한 드론에 `setCumulativePathStyle()`로 즉시 적용됩니다.
- `U3dAPP.on('click')`으로 지도 클릭을 받아 드론 월드 좌표를 카메라로 투영(`Vector3.project`)해 클릭 근처의 드론을 선택하고, 목록에서 같은 드론을 다시 누르면 선택을 해제합니다.
- `U3dSelect({mode: 'box', targetLayer})`를 Space 키를 누르는 동안 `active()`해 selectModel 예제와 같은 박스 선택으로 상자 안의 드론을 한 번에 다중 선택하고, `end` 이벤트로 받은 컴포넌트를 드론 목록 선택에 반영합니다.
- 지도 캔버스의 `contextmenu`(우클릭) 위치를 `U3dAPP.intersectAtPixel(NDC, true)`로 지표면과 교차하고 `vector3ToGeoGraphic()`으로 지리좌표를 얻어, 선택한 드론을 그 지점으로 이동시킵니다. 이동 계산은 별도 모듈 `steering.js`(선회 제한 이동)가 맡고, 드론→목표 화살표는 three.js `ArrowHelper`를 `U3dAPP.getExternalScene()`에 추가해 그립니다.
- 그룹에 넣은 드론은 `U3dComponentPosition.setCumulativePathStyle({color})`로 누적 경로 색이 그룹 색으로 바뀌고, 그룹에서 빼면 드론 고유 색으로 돌아옵니다.
- `U3dVectorLayer`를 하나 더 만들어 vectorLayer 예제의 3D 객체 그리기(포인트·라인·실린더·박스·원·구·파이프·사용자도형·Loft도형·경로 도형)를 [도형] 창에서 제공하고, 그린 도형을 목록으로 관리해 선택한 도형의 이름·표시·스타일(`U3dGeometry.setParam()`)·JSON·기즈모 편집을 왼쪽 3D 도형 상세 설정 창에서 다룹니다.
- 드론을 그룹으로 묶으면 먼저 들어온 드론이 리더가 되고, 뒤에 들어온 드론은 `steering.js`의 선회 제한 이동으로 합류점(리더 위치)에 모인 뒤(편대 합류 중, 그동안 리더는 합류점을 중심으로 반경 회전 비행하는 합류 대기 중) 리더의 목표 위치·방위에 슬롯 offset을 더한 자리를 `moveSmoothly()`로 따라가는 팔로우 이동을 확인합니다. 대형(수직선·수평선·V)은 슬롯 배치만 바꿉니다. **그룹 형상 가시화**는 groupBoundaryHelper 예제와 같은 엔진 `UGroupBoundaryHelper`를 소속 드론 컴포넌트 배열로 만들어 `U3dAPP.getExternalScene()`에 추가하고, `setRenderBefore()` 콜백에서 매 프레임 `update()`해 드론 이동에 따라 경계 입체와 점선 외곽선을 다시 계산합니다.
- `U3dComponentPosition.setLabel()`·`showLabel()`·`removeLabel()`로 선택한 드론 위에 드론 이름과 현재 고도를, 이동 명령·편대 합류·합류 대기 상태의 드론 위에 이름과 상태를 표시하는 POI 라벨을 붙이고(`poi.zOffset`을 키워 드론 위로 살짝 띄움), 드론이 이동해도 엔진이 POI 위치를 함께 옮기는 것을 확인합니다.
- `U3dComponentPosition.setBrightness()`·`setContrast()`로 선택한 드론 모델의 밝기·대비 배율을 바꾸고, `moveSmoothly({durationMs})`의 이동 보간 시간도 선택한 드론별로 바꿉니다. 세 값은 드론별로 유지됩니다.
- `U3dAPP.setCameraGeographicPosition()`으로 선택한 드론의 현재 경도·위도·고도로 카메라를 이동합니다.
- 촬영 영역 탭에서 animationComponents 예제처럼 엔진 `UFrustum`을 선택한 드론 컴포넌트에 장착(`setTarget`)하고 `U3dAPP.setFrustumTerrainProjectionHelper(frustum, {terrain: true, ...})`로 실제 촬영 지면 영역·옆면·외곽선을 그리는 지면 투영 Helper를 외부 scene에 추가합니다. Frustum 설정(FOV·Aspect·Near·Far·Pitch·Yaw·Roll), Helper 품질/안정화, Helper 표현 항목을 공개 setter로 즉시 반영하고, 렌더 직전마다 `updateTarget()`으로 드론을 따라갑니다.
- 오른쪽 레일의 **도구**·**설정** 버튼으로 Runtime 예제 패널을 더 열고, 설정 패널의 지형 고도 배율 입력은 `U3dAPP.getHeightLayers()`에서 켜져 있는 고도 레이어를 골라 `U3dHeightLayer.setHeightScale()`을 호출합니다.
- 오른쪽 레일의 **고도 범례** 버튼(지형 버튼 아래, 드론 버튼 위)은 analysisHeightLegend 예제의 고도 범례·등고선 분석 패널을 엽니다. `U3dAPP.getAnalysis('Height')`의 `setUserStyle()`·`setHeightVisible()`로 고도 기준값별 색상(band/mix)과 후처리 표시를, `getAnalysis('Contour')`의 `setTopoStyle()`·`setTopoWidth()`·`setTopoOpacity()`·`setTopoFadeDistance()`·`drawHeight()`로 등고선 스타일과 표시를 제어합니다. 드론·경로 후처리 제외 기능은 넣지 않았습니다.
- 도구 패널의 좌표계 변환은 엔진 월드 좌표가 WebMercator(EPSG:3857)라는 점을 이용해 `U3dAPP.geographicToVector3()`(위경도→WebMercator)와 `vector3ToGeoGraphic()`(역변환)으로 계산하고, 드론 상세 설정 창의 좌표 입력 이동 명령도 같은 변환으로 위경도를 만들어 우클릭 이동과 같은 명령을 내립니다.
- 도구 패널의 이미지 출력은 animationComponents 예제와 같은 `GeOnDT.terrain.UTerrainStamp`로 업로드한 이미지를 지면에 그립니다. 중심 위경도·정북 기준 회전으로 네 모서리 월드 좌표를 만들고 `texture`에 이미지 data URL을 넘긴 뒤 `setApp()`·`setVisible(true)`하며, 초기화 시 `setVisible(false)`·`dispose()`합니다.

## 사전 조건

- Vworld 항공영상 타일, 공통 한반도 지형 타일과 드론 모델 서버(`https://3d-dev.geon.kr/data/component/DroneShow/UAM/`)에 접근할 수 있는 네트워크가 필요합니다.
- 초기 지도는 경도 127.94°, 위도 37.35° 부근(드론 출발 영역)을 약 5km 상공에서 거의 수직으로 내려다보며 항공영상과 지형 고도가 함께 표시됩니다. 선회 궤적이 지도 위에 곡선으로 읽히도록 `animationComponents` 예제와 같은 구도를 사용합니다. 지도 도구의 `홈` 버튼은 같은 영역을 지면 기준으로 바라보는 Manifest 홈 위치로 이동합니다. 오른쪽 드론 목록 패널과 왼쪽 드론 상세 설정 창은 열린 상태로 시작합니다.
- 드론은 모델 로드가 끝난 뒤 8대가 자동 생성됩니다. `drone-01`~`drone-03`은 `그룹1`, `drone-04`~`drone-06`은 `그룹2`로 편성되어(첫 드론이 리더, 나머지는 바로 팔로우 이동) 리더를 따라 비행하고, `drone-07`·`drone-08`은 개별로 무작위 비행합니다. 모두 곧바로 누적 경로 출력을 시작하며 두 그룹의 형상 가시화는 켜진 상태입니다. 모델을 내려받는 동안 목록 위에 `드론 모델을 불러오는 중입니다.`가 표시되고 **드론 추가** 버튼은 비활성입니다.
- 모델 서버에 접근할 수 없으면 목록 위에 실패 원인이 표시되고 **모델 다시 불러오기** 버튼이 나타납니다. 실패한 객체는 드론으로 집계되지 않으며, 지도와 배경지도·지형 조작은 계속 사용할 수 있습니다.
- 브라우저가 WebGL 2.0을 제공하지 않거나 컨텍스트가 손실되면 실행 환경 팝업에 `확인 불가`와 그 이유가 표시됩니다.
- 드론 8대(그룹 2개), 기본 이동 속도 250km/h, 목표 생성 간격 1000ms, 고도 900~1200m, 선회율 2°/s, 상승·하강률 2m/s는 시뮬레이션 설정값(`CONFIG.flight`)입니다. 일반 비행·이동 명령은 250km/h이고, 합류 대기 회전 비행은 `CONFIG.group.rendezvous.waitSpeedKmh`(150km/h)로 늦추며, 합류·재합류 접근 속도는 `joinSpeedKmh`(350km/h)로 별도 지정합니다. 실제 무인기 성능이나 시험 합격 기준이 아니며, FPS·처리시간·최대 드론 수 같은 성능 합격 기준은 이 예제가 판정하지 않습니다.
- 드론은 기본 비행 시 초당 약 69m씩 이동하므로 1분 정도 지나면 초기 화면 밖으로 벗어날 수 있습니다. 지도 도구의 `홈` 버튼으로 출발 영역으로 돌아가거나 지도를 회전·축소해 따라갑니다.
- 이동 목표는 1초마다 기본 속도 기준 약 69m 간격으로 생성합니다. 드론별 `moveSmoothly()` 대기열에는 아직 소화하지 못한 목표를 한 개만 보관하므로(`CONFIG.flight.maxQueuedWaypoints`), 짧은 `durationMs`의 순간 이동·보간 차이가 오래된 목표나 backlog 가속 보정에 묻히지 않습니다.

## 주요 기능

- **실행 환경**(정보 팝업): 오른쪽 위 지도 도구의 **ⓘ** 버튼(API 도움말 스위치와 홈 버튼 사이)을 누르면 WebGL 2.0 사용 여부, WebGL 버전, GLSL 버전, Renderer 정보, 레이어의 Instance 생성 모드, 실제 Instance 방식으로 생성된 드론 수를 보여 주는 팝업이 열립니다. 버튼을 다시 누르거나 `×`·Esc 키로 닫습니다. 메인 분석창에는 두지 않습니다.
- **2D/3D 모드 전환**: 오른쪽 위 지도 도구에서 API 도움말 스위치와 **ⓘ** 버튼 사이에 있는 `2D ▢ 3D` 스위치입니다. 누르면 손잡이가 좌우로 움직이며 현재 모드 라벨이 밝아지고, 2D는 직교 카메라(`setCameraType('orthographic')`)로 바꾼 뒤 `set2DMode()`로 지도를 TopView(극각 0)에 고정하고, 3D는 원근 카메라로 되돌린 뒤 `set3DMode()`로 60° 기울인 시점으로 돌아갑니다. 기본은 3D이며 예제를 정리하면 3D로 되돌립니다.
- **성능 확인**: 오른쪽 위 지도 도구에서 `2D ▢ 3D` 스위치와 **ⓘ** 버튼 사이에 있는 속도계 아이콘 버튼입니다. 누르면 `U3dAPP.createDebugCanvas()`로 엔진 `Development Tools` 패널(id `UDevToolView`)이 지도 도구 아래(오른쪽 레일 왼쪽)에 열리고 버튼이 눌린 색으로 바뀝니다. 패널의 Status 탭은 FPS·메모리 그래프를, Settings·Debug 탭은 엔진 설정을 보여 주며 제목을 끌어 옮길 수 있습니다. 오른쪽 예제 패널(드론·도형·도구·설정·레이어)이나 실행 환경 팝업이 열려 있으면 패널이 그 왼쪽으로 비켜 겹치지 않습니다. 다시 누르면 `removeDebugCanvas()`로 패널이 제거됩니다. 예제 정리 시 켜져 있으면 제거합니다.
- **드론 목록**(오른쪽 패널): 현재 비행 중인 드론 수(등록 수와 다르면 함께 표시), 드론 이름·비행 상태·경로 색상 점을 표시하고, 드론을 클릭하면 왼쪽 상세 설정 창이 그 드론의 내용으로 바뀝니다. 목록 상자는 고정 높이 안에서 스크롤하므로 드론이 늘어도 패널 높이는 늘지 않습니다.
- **드론 추가 / 드론 삭제**: 드론을 한 대 추가하고 선택하거나, 선택한 드론을 컴포넌트·누적 경로와 함께 삭제합니다.
- **전체 비행 일시정지 / 재개**: 목표 위치 생성과 진행 중인 이동 애니메이션을 멈추거나 기존 위치에서 이어서 재개합니다. 캡처와 검수 편의를 위한 기능입니다.
- **드론 선택**: 목록에서 드론을 누르거나 지도에서 드론 근처(화면 거리 28px 이내)를 클릭하면 선택됩니다. 선택된 드론은 목록에서 강조되고, 상세 설정 창이 그 드론으로 바뀌며, 드론 위에 `드론 이름 · 고도 N m` POI 라벨이 따라다닙니다. 목록에서 선택된 드론을 다시 누르면 선택이 해제되고 열려 있던 상세 설정 창도 닫힙니다.
- **박스 다중 선택**: Space 키를 누른 채 지도를 드래그하면 엔진 `U3dSelect` 박스 모드(selectModel 예제의 박스 선택과 같은 방식)가 상자 안의 드론을 모두 선택해 목록에 강조하고 각 드론 위에 POI 라벨을 붙입니다. 다중 선택에서는 상세 설정 창을 열지 않습니다. **드론 삭제**는 선택한 드론을 모두 삭제합니다. 버튼이나 목록 항목을 클릭해 포커스가 남아 있어도 Space 키는 그 요소를 누르지 않고 박스 선택 키로만 동작합니다(그룹 이름처럼 글자를 입력하는 칸에서는 예외).
- **그룹**: **그룹 추가**는 `그룹1`, `그룹2`… 이름의 그룹을 목록에 만들고 선택합니다. 목록에서 그룹을 누르면 왼쪽에 그룹 상세 설정 창이 열리고 리더 드론만 선택됩니다(리더 목록 강조·이름 POI, 드론 상세 설정 창은 닫힘). 그룹이 선택된 동안 **드론 삭제**와 우클릭 이동은 리더 한 대에 적용되고, 그룹을 다시 누르거나 삭제하면 소속 드론 선택도 해제됩니다. 그룹 창에는 이름 입력, **그룹 형상 가시화**, **수직선 대형**·**수평선 대형**·**V 대형** 버튼과 소속 드론 목록(× 로 제외)이 있습니다. 목록에서 드론(다중 선택 포함)을 그룹으로 끌어다 놓으면 그룹 아래 트리에 들어가고, 그룹 밖으로 끌어내면 목록으로 돌아옵니다. 그룹 안에 그룹은 넣을 수 없고, **그룹 삭제**를 하면 소속 드론이 목록으로 돌아옵니다. 그룹마다 색이 있어 그룹에 들어간 드론의 누적 경로와 목록 색상 점은 그룹 색으로 바뀌고, 그룹에서 빠지면 드론 고유 색으로 돌아옵니다. 그룹에 가장 먼저 들어온 드론이 **리더**(목록 트리·그룹 창 이름 옆 ★ 표식)이고, 그룹 창의 소속 드론 목록에는 각 드론의 이동 상태가 함께 표시됩니다. 새 그룹은 **그룹 형상 가시화**가 켜진 상태로 만들어지며, 초기 실행 시 `그룹1`(drone-01~03)·`그룹2`(drone-04~06)가 편성되어 있습니다.
- **리더·합류·팔로우 비행**: 최초 합류 드론이 있으면 리더는 현재 위치를 합류점으로 정해 150km/h(`waitSpeedKmh`)로 속도를 늦춰 회전 비행하며, 합류 드론이 모두 따라잡으면 다시 250km/h로 자기 길을 갑니다. 팔로우 드론은 자기 슬롯을 향해 350km/h·최대 선회율 30°/s로 접근하고, 슬롯 300m 이내부터 가속도 제한과 거리 보정으로 속도·고도를 맞춥니다. 근접 정렬·선회·간격 보정에도 350km/h 상한을 적용하고, 빠르게 바뀌는 슬롯에는 허용 속도와 가속도 안에서 점진적으로 따라갑니다. 슬롯 오차가 수평 8m·고도 3m 이내이고 상대 수평 속도가 10m/s 이내이면 `팔로우 이동 중`으로 전환합니다. 마지막 최초 합류가 끝나면 리더는 `비행 중`으로 돌아갑니다. 대기 원의 최소 반지름은 400m이며, 바깥 슬롯 거리와 기본·합류 속도 차이에 맞춰 원을 넓힙니다. 대기 속도 150km/h·합류 속도 350km/h에서는 기본 반지름 400m 안에서 돕니다. 속도 차이가 작고 편대가 클수록 합류에 더 오래 걸립니다. 리더가 빠지면 가입 순서상 다음 드론이 리더가 됩니다. 설정은 `CONFIG.group.rendezvous`와 `CONFIG.group.formation`에서 조절합니다.
- **이동 명령 우선**: 우클릭 이동 명령은 모든 이동 상태보다 우선합니다. 최초 합류·재합류 중 명령을 받으면 완료 후 해당 합류를 이어갑니다. 팔로우 비행 중 명령으로 이탈한 드론은 명령 완료 후 `재합류 비행중` 상태로 원래 슬롯을 추격합니다. 재합류만 있는 경우 본대는 대기하지 않고 계속 비행합니다. 대기 중인 리더가 명령을 마치면 도착 지점이 새 합류점이 됩니다. 편대 합류 중·재합류 비행중인 드론에는 드론에서 현재 합류점(자기 슬롯)까지 드론 색의 연한 화살표가 그려지고 리더 이동에 따라 매 갱신 다시 맞춰집니다. 이동 명령을 받으면 명령 화살표만 보이고, 합류를 마치면 사라집니다.
- **대형**: 수직선·수평선·V 대형 모두 리더를 원점으로 두고 가입 순서에 따라 서로 다른 120m 간격 슬롯을 배정합니다. 수평선은 리더 좌우로 번갈아 펼치며, 대형 없음도 좌우 뒤쪽으로 기본 분산 자리를 유지합니다. 같은 대형 버튼을 다시 누르면 기본 배치로 돌아갑니다. 슬롯 이동 벡터에 거리 보정을 더하고 속도 변화와 근접 드론 간격을 조절하므로 대형 전환·합류 완료 시 갑자기 새 자리로 이동하지 않습니다.
- **이동 상태 표시**: 목록·기본 정보·그룹 창에 비행 상태를 표시합니다. 이름·고도 POI는 선택한 드론에만 붙고, `이동 명령 중`·`편대 합류 중`·`재합류 비행중`·`합류 대기 중`은 선택 여부와 관계없이 별도 상태 POI에 표시합니다. 상태 POI는 드론 위로 띄우고 화면 세로 간격도 주어 이름 라벨과 분리합니다. `비행 중`·`팔로우 이동 중`은 상태 POI를 표시하지 않습니다.
- **그룹 형상 가시화**: 엔진 `UGroupBoundaryHelper`로 소속 드론 주위에 그룹 색상의 반투명 경계 입체(위·아래 40m, 바깥 buffer 120m)와 점선 외곽선을 그립니다. 드론이 이동하면 렌더 직전마다 경계가 다시 계산되고, 서로 400m(`connectionDistance`)보다 멀어진 드론 묶음은 별도 입체로 나뉘다가 다시 가까워지면 하나로 합쳐집니다. 드론을 그룹에 넣거나 빼면 대상이 함께 바뀌고, 옵션은 `CONFIG.group.boundary`에서 바꿉니다. 새 그룹은 기본으로 켜져 있고 버튼으로 끌 수 있습니다(`CONFIG.group.boundary.visibleByDefault`).
- **드론 위치로 카메라 이동**: 상세 설정 창의 버튼으로 선택한 드론의 현재 경도·위도·고도로 카메라를 이동합니다. 현재 지도 방위는 유지합니다.
- **우클릭 이동**: 드론을 선택하고 지도를 우클릭하면 선택한 드론(다중 선택이면 모두)이 그 지점으로 이동합니다. 고도는 현재 비행 고도를 유지하고, 드론에서 목표까지 반투명 화살표가 그려져 드론을 따라 줄어들다가 도착하면 사라집니다. 드론은 제자리에서 꺾이지 않고 최대 선회율(`CONFIG.command.maxTurnRateDegPerSec`, 기본 10°/s) 안에서 선회하며 접근하고, 목표가 선회 반지름 안쪽 뒤편이면 잠시 직진해 거리를 벌린 뒤 돌아옵니다. 이동 계산은 `steering.js` 모듈이 담당하며, 그룹 소속·리더·팔로우와 관계없이 모든 드론이 명령을 받습니다(이동 명령 우선). 상세 설정 창의 **드론 위치로 카메라 이동** 아래 좌표 입력 폼에서 좌표계(기본 위경도, 또는 WebMercator EPSG:3857)를 고르고 X·Y를 입력한 뒤 **이동 명령**을 누르면(Enter 키도 가능) 같은 이동 명령이 내려집니다. WebMercator 좌표는 위경도로 바꿔 전달하고, 범위를 벗어난 좌표는 안내만 표시합니다.
- **드론 상세 설정**(왼쪽 창): 오른쪽 패널과 별개의 창으로, 선택한 드론 이름을 제목에 표시하고 `기본 정보`, `드론 설정`, `비행 경로`, `촬영 영역` 탭을 가로로 제공합니다. 드론을 바꿔 선택해도 활성 탭은 유지되고, 탭이 많아져 폭을 넘으면 다음 줄로 접힙니다. 코드 편집 패널을 열면 편집기 오른쪽으로 함께 이동합니다. `×`로 닫으면 오른쪽 패널에 `드론 상세 설정 창 열기` 버튼이 나타나고, 목록에서 드론을 누르면 다시 열립니다. 향후 기능은 이 창에 탭을 추가해 확장합니다.
- **도형(3D 객체 그리기)**: 오른쪽 레일의 **드론** 버튼 아래 **도형** 버튼을 누르면 드론 통합 모니터링 패널 대신 vectorLayer 예제의 `3D 객체 그리기` 패널이 열립니다(단층 도형 제외). 패널 위쪽에 **도형 목록**이 있고, 도형 종류를 고른 뒤 **그리기 시작**을 눌러야 그리기가 시작됩니다. 시작하면 지도 위에 조작 안내 토스트(클릭으로 그리기, 더블클릭으로 완성)가 뜨고, 지도를 클릭하면 도형이 만들어져 목록에 추가됩니다. 여러 점 도형은 더블클릭으로 현재 도형을 완성한 뒤 계속 새 도형을 그릴 수 있고, **그리기 종료**를 누르거나 패널을 닫으면 그리기가 끝나 지도 클릭은 드론 선택으로 돌아갑니다. 그리기·기즈모 편집 중에는 우클릭 이동 명령을 받지 않습니다. 박스·구는 바닥이 지면에 놓이도록 올립니다. 엔진의 사용자도형·Loft도형은 좌표 높이를 쓰지 않고 해수면(월드 z=0)에서 기둥을 세우므로 해발이 높은 이 지역에서는 땅속에 묻히는데, 예제는 완성 시 메시를 폴리곤 범위의 지형 최고점(또는 클릭한 점의 최고 높이) + 2m 위로 올려 보이게 합니다. 기즈모 편집·JSON으로 생성·JSON 내보내기·모두 지우기를 같은 패널에서 제공합니다.
- **도형 목록 / 3D 도형 상세 설정**: 3D 객체 그리기 패널의 도형 목록에서 도형을 누르면(패널을 닫은 뒤 지도의 도형을 클릭해도) 드론·그룹 상세 설정 창과 같은 왼쪽 자리에 3D 도형 상세 설정 창이 열리고 드론·그룹 선택은 해제됩니다. 창에는 이름 입력, **도형 위치로 이동**, **기즈모 편집**(이동·회전·크기), **도형 삭제**, 도형 표시 체크, 기본 정보(종류·좌표 수·중심 경도·위도·고도·크기·생성 시각), 도형의 현재 `getParam()` 값으로 만든 스타일 편집 폼과 **스타일 적용**, 그리고 `type`·`coord`·스타일이 담긴 편집 가능한 JSON 영역과 **JSON 적용**·**현재 값 다시 채우기**가 있습니다. vectorLayer 예제의 [JSON으로 설정]처럼 JSON의 스타일 값을 고쳐 적용하면 스타일 폼과 같은 `setParam()`으로 반영되고 폼도 새 값으로 바뀌며(`type`·`coord`는 바뀌지 않고 `name`이 있으면 이름을 바꿈), 형식이 틀리거나 값이 범위를 벗어나면 아래에 원인이 표시됩니다. 이 JSON을 그리기 패널의 JSON으로 생성에 붙여 넣으면 같은 도형을 다시 만들 수 있습니다.
- **도구 / 설정**(오른쪽 레일): **도형** 버튼 아래의 **도구** 버튼은 도구 패널을, **설정** 버튼은 설정 패널을 오른쪽에 엽니다. 둘 다 Runtime 예제 패널이므로 열려 있던 다른 패널(드론·도형·도구·설정)은 닫히고 교체됩니다. 두 패널의 구획(좌표계 변환·이미지 출력·지형)은 처음에 제목만 보이도록 접혀 있고, 제목을 누르면 내용이 펼쳐지며 다시 누르면 접힙니다. 도구 패널의 **좌표계 변환**은 입력 좌표계와 출력 좌표계(기본 위경도 → WebMercator EPSG:3857)를 가운데 **⇄** 버튼으로 서로 바꾸는 단일 입력 구조입니다. X·Y를 넣고 **변환하기**(또는 Enter)를 누르면 아래 결과 줄에 변환 좌표가 표시되고(위경도 소수 6자리, m 3자리), **⇄**를 누르면 방금 결과가 새 입력으로 들어가고 이전 입력이 결과로 남아 역변환을 바로 확인할 수 있습니다. **초기화**는 방향과 입력·결과를 처음 상태로 되돌립니다. 범위를 벗어난 값(위도 ±85.0511° 초과, X·Y ±20,037,508.34m 초과)은 변환할 수 없다고 안내합니다. 좌표계 변환 아래 **이미지 출력**은 **이미지 업로드**로 로컬 이미지를 고르면 72px 미리보기와 파일 이름·크기가 표시되고, 출력 경도·위도와 정북 기준 시계 방향 회전(°)을 넣고 **출력**(또는 Enter)을 누르면 `UTerrainStamp`가 그 좌표를 중심으로 폭 300m(`CONFIG.stamp.widthMeters`), 높이는 이미지 비율에 맞춘 사각형에 이미지를 지면에 그립니다. 다시 출력하면 이전 이미지는 교체되고, **초기화**는 지면 이미지를 지우고 업로드·입력을 처음 상태로 되돌립니다. 설정 패널의 **지형 고도 배율** 입력(기본 1, 0.1~10)을 바꾸면 켜져 있는 모든 고도 레이어에 `setHeightScale()`을 호출해 지형 높낮이가 바로 배율만큼 늘거나 줄어들고, 아래 상태 줄에 적용한 레이어 수가 표시됩니다. 지형 레이어가 꺼져 있으면 적용 대상이 없다고 안내하며, 예제를 정리하면 배율을 1로 되돌립니다.
- **고도 범례**(오른쪽 레일): 공통 레일의 **지형** 버튼 아래, **드론** 버튼 위의 **고도 범례** 버튼이 고도 범례 패널을 엽니다(Runtime 예제 패널이라 다른 패널과 교체). **분석 표시** 카드의 `고도 범례 가시화`를 켜면 화면 픽셀의 고도가 범례 색으로 채워지고 아래에 **고도 범례** 카드가 나타납니다. 카드에서 `band`/`mix` 색 선택 방식을 고르고, 고도 기준값(0·100·200·300·400m, 읽기 전용)별 투명도(0~1)·색상을 편집하며 **+**로 가장 높은 기준값보다 100m 높은 항목을 추가하고 **−**로 마지막 항목을 제거합니다(1개 이상, 최대 32개). `등고선 가시화`를 켜면 고도 구간마다 등고선이 그려지고 **등고선 스타일** 카드가 나타나 선 두께(1~12px)·감쇠 시작 거리·표현 종료 거리(m)·투명도 슬라이더와 구간(시작 고도·선 간격·색상) 행을 편집하고 **+**/**−**로 구간을 추가·제거합니다. 모든 변경은 표시 중인 분석에 즉시 반영되고, 가시화를 끄면 편집 영역이 숨겨지며 값은 유지됩니다. 예제를 정리하면 켜 둔 후처리를 끕니다. analysisHeightLegend 예제의 드론·경로 후처리 제외 기능은 넣지 않았습니다.
- **기본 정보 탭**: 드론 ID, 모델 이름, 실제 컴포넌트 위치 기준의 현재 경도·위도(°)·고도(m), 비행 상태, Instance 적용 여부를 표시합니다.
- **드론 설정 탭**: 선택한 드론 모델의 **밝기**·**대비** 슬라이더(0~3, 기본 1, 0.05 단위)와 **이동 보간 시간** 슬라이더(0~1000ms, 기본 20ms, 20ms 단위)입니다. 목표점은 1초마다 기본 속도 기준 약 69m 간격으로 생성됩니다. `0`은 엔진 내부 최소치 1ms로 전달되어 먼 목표로 순간 이동하고, 값이 커질수록 같은 목표까지 이동하는 과정이 길어지며 `1000ms`에서는 다음 목표가 생성될 때까지 계속 보간합니다. 세 값은 선택한 드론에만 적용되고 드론별로 유지됩니다. **기본값으로 되돌리기**도 선택한 드론의 세 값만 기본값으로 되돌립니다.
- **비행 경로 탭**: `비행 경로 표시` 체크박스와 경로 생성 상태·현재 표시 상태를 표시하고, 아래 **누적 경로 표현**에서 경로 색상(색상 입력)·경로 투명도·경로 폭 슬라이더, `오래된 경로 Fade` 체크박스와 최대 표시 거리·폭 Fade 비율·투명도 Fade 비율 슬라이더로 선택한 드론의 누적 경로를 즉시 바꿉니다. 색은 기본으로 드론 색(그룹 소속이면 그룹 색)을 따르며(값 옆 `· 자동`), 색을 고르면 그룹에 넣고 빼도 그 색을 유지합니다. Fade를 끄면 거리·비율 슬라이더가 잠기고 전체 경로가 같은 형태로 표시되며, **경로 표현 기본값으로 되돌리기**로 기본값(자동 색, 투명도 0.8, 폭 5, Fade 사용·14,000m·폭 0.5·투명도 0.4)으로 돌아갑니다. 설정은 드론별로 독립적으로 저장됩니다.
- **촬영 영역 탭**: animationComponents 예제의 촬영 영역 설정을 선택한 드론에 적용합니다. `촬영 영역 표시` 체크박스(기본 꺼짐)를 켜면 드론에 `UFrustum`을 장착하고 지면 투영 Helper가 실제 촬영 지면 영역(채움)·옆면·외곽선을 그리며 드론을 따라 움직입니다. **Frustum 설정**(FOV 1~179°, Aspect 0.2~4, Near 0.1~100m, Far 500~20,000m, Pitch·Yaw·Roll −180~180°, Pitch는 위(+)/아래(−)·Yaw는 오른쪽(+)/왼쪽(−)), **Helper 품질 / 안정화**(고정 갱신 주기, 지면 접촉 위치 정밀도, 지면 영역 확인점 수, 지면 외곽선 정밀도, 지면 결과 안정화와 최근 측정 비교 개수·부드러움 시간·1회 반영 거리·변경 확인 시간, 전체 움직임 부드러움, 작은 흔들림 무시 거리, Far 회전 부드러움, 보정 이력 초기화 시간), **Helper 표현**(옆면/외곽선 색상·선 두께·선 투명도, 지면 영역 면 색상·투명도, 옆면 채움색·투명도)을 바꾸면 표시 중인 Frustum·Helper에 즉시 반영되고, 표시 전이면 저장되어 켤 때 적용됩니다. 기본값은 animationComponents와 같으며(FOV 50°, Aspect 1.4, Far 18,000m, Pitch 10° 등) **촬영 영역 기본값으로 되돌리기**로 돌아갑니다. 값은 드론별로 유지되며 드론을 삭제하거나 예제를 정리하면 Helper도 제거됩니다.

## 조작 및 예상 결과

| 조작 | 예상 결과 |
| --- | --- |
| 예제를 실행합니다. | Vworld 항공영상과 지형이 표시되고, 오른쪽에 드론 목록 패널, 왼쪽에 드론 상세 설정 창이 열립니다. 오른쪽 위 지도 도구의 홈 버튼 왼쪽에 `2D ▢ 3D` 스위치, **성능 확인**(속도계 아이콘) 버튼, **ⓘ**(실행 환경 정보) 버튼이 차례로 보입니다. |
| 지도 도구의 **ⓘ** 버튼을 누릅니다. | 버튼 아래에 `실행 환경` 팝업이 열려 WebGL 2.0 사용 여부·WebGL 버전·GLSL 버전·Renderer, `Instance 생성 모드`, `Instance 드론 수`가 표시됩니다. 버튼을 다시 누르거나 `×`, Esc 키로 닫습니다. |
| 지도 도구의 `2D ▢ 3D` 스위치를 누릅니다. | 손잡이가 왼쪽(2D)으로 움직이고 `2D` 라벨이 밝아지며, 카메라가 직교 카메라로 바뀌고 1초 동안 수직 TopView로 세워져 드래그해도 기울어지지 않습니다. 다시 누르면 손잡이가 오른쪽(3D)으로 돌아가고 원근 카메라·60° 기울인 시점이 됩니다. |
| 지도 도구의 **성능 확인** 버튼을 누릅니다. | 버튼이 눌린 색으로 바뀌고 지도 도구 아래(오른쪽 레일 왼쪽)에 엔진 `Development Tools` 패널이 열려 Status 탭의 FPS·메모리 그래프와 Settings·Debug 탭이 표시됩니다. 오른쪽 드론 목록 등 예제 패널이나 실행 환경 팝업이 열려 있으면 패널이 그 왼쪽으로 비켜 겹치지 않습니다. 다시 누르면 패널이 제거되고 버튼이 원래 색으로 돌아옵니다. |
| 모델 로드가 끝날 때까지 기다립니다. | 목록 위 상태가 `드론 모델 준비 완료`로 바뀌고 목록에 `그룹1`(drone-01 ★, drone-02, drone-03)·`그룹2`(drone-04 ★, drone-05, drone-06) 트리와 개별 드론 `drone-07`, `drone-08`이 나타납니다. `현재 비행 중인 드론 수: 8대`가 표시되고 첫 드론(`drone-01`, 그룹1 리더)이 선택됩니다. 실행 환경 팝업에는 `Instance 생성 모드: Instance 모드`, `Instance 드론 수: 3대 / 전체 3대`가 표시됩니다. |
| 지도를 확대해 드론을 봅니다. | 개별 드론 2대는 각각 다른 방향으로 완만하게 선회·상승·하강하고, 두 그룹은 리더 뒤 슬롯에 팔로우 드론이 붙어 함께 비행하며 그룹 색의 경계 입체(그룹 형상)가 켜져 있습니다. 드론마다(그룹은 그룹 색) 누적 비행경로가 이동한 자리에 이어져 그려집니다. |
| **드론 추가**를 누릅니다. | `drone-04`가 출발 영역 주변에 생성되어 목록과 수량이 4대로 늘고 새 드론이 선택됩니다. 새 드론도 곧바로 비행하며 경로를 그립니다. |
| 선택한 드론에서 **드론 삭제**를 누릅니다. | 선택한 드론과 그 누적 경로가 지도에서 사라지고 목록은 8대가 됩니다. 남은 드론 중 하나가 선택되고, 남은 드론의 비행과 경로는 유지됩니다. |
| 마지막 드론까지 삭제합니다. | 목록에 `등록된 드론이 없습니다.` 안내가, 상세 설정에 빈 상태 안내가 표시되고 **드론 삭제**가 비활성됩니다. |
| 목록에서 다른 드론을 클릭합니다. | 왼쪽 상세 설정 창의 제목이 그 드론 이름으로 바뀌고 `기본 정보`의 경도·위도·고도가 실제 위치를 따라 약 0.5초마다 갱신됩니다. 활성 탭은 그대로 유지됩니다. 지도의 그 드론 위에 `uam_01 · 고도 N m` POI 라벨이 나타나 드론을 따라 움직이고 고도 값이 갱신됩니다. |
| 지도에서 드론 근처를 클릭합니다. | 클릭 위치에서 화면 거리 28px 안에 있는 가장 가까운 드론이 선택되어 목록 강조·상세 설정 창·POI 라벨이 그 드론으로 바뀝니다. 근처에 드론이 없으면 선택은 바뀌지 않습니다. 지도를 드래그한 경우는 클릭으로 처리되지 않습니다. |
| 목록에서 이미 선택된 드론을 다시 클릭합니다. | 선택이 해제되어 목록 강조와 이름·고도 POI가 사라집니다. 표시 대상인 비행 상태 POI는 유지됩니다. 드론 상세 설정 창이 닫히며 **드론 삭제**·**드론 위치로 카메라 이동** 버튼이 비활성됩니다. |
| 지도 위에서 Space 키를 누른 채 드래그합니다. | 목록 아래 안내가 `박스 선택 중`으로 바뀌고 지도 이동 대신 엔진 선택 상자(`.selectBox`)가 그려집니다. 놓으면 상자 안의 드론이 모두 선택되어 목록에 강조되고 각 드론 위에 POI 라벨이 붙습니다. 상세 설정 창은 열리지 않습니다. Space 키를 놓으면 지도 이동이 다시 가능합니다. |
| **그룹 추가**를 누릅니다. | 목록 맨 위에 `그룹3`(초기 그룹 2개 다음 번호)이 생기고 왼쪽에 그룹 상세 설정 창이 열립니다. **그룹 형상 가시화**는 켜진 상태이며 드론이 들어오면 경계가 나타납니다. 선택되어 있던 드론의 선택(목록 강조·POI 라벨)이 해제되고 드론 상세 설정 창은 닫힙니다. |
| 드론이 들어 있는 그룹을 목록에서 클릭합니다. | 그룹 상세 설정 창이 열리고 리더 한 대만 선택됩니다. 드론 삭제·우클릭 이동도 리더만 대상으로 하며, 리더가 삭제·탈퇴·다른 그룹으로 이동하면 다음 리더로 선택이 바뀝니다. 그룹을 다시 클릭하면 선택이 해제됩니다. |
| 드론을 선택한 뒤 `그룹1`로 끌어다 놓습니다. | 선택한 드론(다중 선택이면 모두)이 `그룹1` 아래에 트리로 들어가고, 그룹 창의 `그룹 드론` 목록과 머리 행의 `N대` 표시가 갱신됩니다. 드론의 누적 경로와 목록 색상 점이 그룹 색으로 바뀝니다. 그룹은 끌 수 없어 그룹 안에 그룹을 넣을 수 없습니다. 첫 드론은 리더(★)가 되어 자기 길을 그대로 가고, 리더가 있을 때 넣은 드론은 `편대 합류 중`으로 리더 위치로 이동하며 그동안 리더는 `합류 대기 중`으로 합류점 주위를 돕니다. 도착하면 `팔로우 이동 중`으로 바뀌어 리더를 따라 비행하고 리더는 다시 자기 길을 갑니다. 합류 중인 드론에서 합류점(자기 슬롯)까지 드론 색의 연한 화살표가 그려지다가 합류를 마치면 사라집니다. 상태는 목록·그룹 창의 상태 문구와 드론 위 POI로 확인합니다. |
| 그룹 안의 드론을 목록 상자의 빈 곳으로 끌어다 놓거나 그룹 창에서 `×`를 누릅니다. | 드론이 그룹에서 빠져 목록으로 돌아오고, 합류·팔로우를 멈추고 현재 위치에서 자기 길을 갑니다. 리더를 빼면 다음 드론이 리더(★)가 되고, 합류 중이던 드론을 빼서 합류 대상이 없어지면 리더도 회전 비행을 멈추고 자기 길을 갑니다. |
| 그룹 창의 이름 입력을 바꿉니다. | 목록의 그룹 이름과 창 제목이 입력한 이름으로 바뀝니다. |
| **수직선 대형**·**수평선 대형**·**V 대형** 중 하나를 누릅니다. | 리더를 원점으로 팔로우 드론이 서로 다른 120m 간격 슬롯에 속도·방향을 맞추며 정렬됩니다. 상태는 `팔로우 이동 중 · 수직선 대형`처럼 표시됩니다. 같은 버튼을 다시 누르면 기본 분산 배치로 부드럽게 돌아갑니다. |
| 합류 중이거나 합류 대기 중인 드론을 선택해 지도를 우클릭합니다. | 이동 명령이 우선해 그 지점으로 이동하고(POI `이동 명령 중`), 도착하면 합류·대기를 이어갑니다. 합류 대기 중이던 리더는 도착 지점이 새 합류점이 되어 합류 중인 드론이 그곳으로 따라옵니다. |
| **그룹 형상 가시화**를 누릅니다. | 소속 드론 주위에 그룹 색상의 반투명 경계 입체와 점선 외곽선이 그려지고 드론 이동에 따라 매 프레임 갱신됩니다. 드론이 멀어지면 입체가 나뉘고 가까워지면 합쳐집니다. 다시 누르면 사라집니다. 드론이 없는 그룹은 아무것도 그리지 않습니다. |
| **그룹 삭제**를 누릅니다. | 선택한 그룹이 사라지고 소속 드론이 목록으로 돌아오며 그룹 창이 닫힙니다. |
| 상세 설정 창의 **드론 위치로 카메라 이동**을 누릅니다. | 카메라가 현재 지도 방위를 유지한 채 선택한 드론의 현재 경도·위도·고도를 바라보는 위치(거리 1.2km, 시야각 45°)로 0.8초 동안 이동합니다. |
| **드론 위치로 카메라 이동** 아래에서 좌표계를 `위경도`로 두고 X에 `127.9465`, Y에 `37.3492`를 입력한 뒤 **이동 명령**을 누릅니다. | 우클릭 이동과 같이 드론 색 화살표가 그려지고 선택한 드론이 그 위경도로 선회하며 이동합니다. 좌표계를 `WebMercator (EPSG:3857)`로 바꾸면 자리 표시가 `X (m)`·`Y (m)`로 바뀌고, 예를 들어 X `14242939.229`, Y `4487893.182`는 같은 지점으로 변환되어 이동합니다. 범위를 벗어난 값은 안내만 표시되고 명령은 내려지지 않습니다. |
| 드론을 선택한 뒤 지도의 다른 곳을 우클릭합니다. | 드론에서 우클릭 지점까지 드론 색의 반투명 화살표가 그려지고, 드론이 현재 진행 방향에서 최대 10°/s로 선회하며 그 지점(현재 고도 유지)으로 날아갑니다. 화살표는 드론을 따라 짧아지다가 목표 도착(마지막 한 걸음 이내)하면 사라지고 드론은 자유 비행을 이어갑니다. 목록·기본 정보의 비행 상태는 `이동 명령 중`으로 표시되고 별도 상태 POI에 `이동 명령 중`이 표시됩니다. 다중 선택이면 선택한 드론이 모두 같은 지점으로 이동하고, 우클릭 드래그(지도 회전) 뒤에는 명령하지 않습니다. |
| 이동 중인 드론의 바로 뒤쪽을 다시 우클릭합니다. | 드론이 제자리에서 꺾이지 않고 선회 반지름(250km/h·10°/s에서 약 400m)만큼 돌아서 새 지점으로 향합니다. 목표가 선회 반지름 안쪽 뒤편이면 잠시 직진해 거리를 벌린 뒤 돌아옵니다. |
| 상세 설정 창의 `×`를 누른 뒤 목록에서 드론을 클릭합니다. | 창이 닫히면 오른쪽 패널에 `드론 상세 설정 창 열기` 버튼이 나타나고, 드론을 클릭하면 창이 그 드론 내용으로 다시 열립니다. |
| 오른쪽 레일의 **도형**(드론 버튼 아래)을 누릅니다. | 드론 통합 모니터링 패널이 닫히고 같은 자리에 `3D 객체 그리기` 패널이 열립니다. 레일의 **드론**을 누르거나 패널의 `×`를 누르면 닫히고 지도 클릭은 드론 선택으로 돌아갑니다. |
| 그리기 패널에서 **박스**를 고르고 **그리기 시작**을 누른 뒤 지도를 클릭합니다. | 지도 위에 `박스 그리기: 지도를 클릭할 때마다 도형이 생성됩니다` 토스트가 뜨고, 클릭한 지면 위에 박스가 생겨 패널 위쪽 `도형 목록`에 `박스 1`이 추가됩니다. 라인·파이프·사용자도형·Loft도형은 여러 번 클릭한 뒤 더블클릭으로 완성하며(완성 토스트 표시), 목록 항목에 좌표 수가 표시됩니다. **그리기 종료**를 누르면 그리기가 끝나고 지도 클릭은 드론 선택으로 돌아갑니다. |
| `JSON으로 생성`의 **생성**을 누릅니다. | 예시 JSON(드론 출발 영역 지면 위)으로 도형이 만들어져 목록에 추가되고 `생성 완료 (1개)`가 표시됩니다. **JSON 내보내기**는 모든 도형 JSON을 콘솔에 출력하고, **모두 지우기**는 도형과 목록을 비웁니다. |
| 도형 목록에서 도형을 누릅니다. | 왼쪽에 `3D 도형 상세 설정` 창이 열리고 드론·그룹 선택과 창은 닫힙니다. 이름을 바꾸면 목록이 함께 바뀌고, `도형 표시`를 끄면 지도에서 숨겨지며, **도형 위치로 이동**은 도형 크기에 맞는 거리로 카메라를 옮깁니다. 스타일 폼 값을 바꿔 **스타일 적용**을 누르면 도형이 지워지지 않고 색·크기·투명도가 바뀝니다. JSON 영역의 스타일 값(예: `color`, `opacity`)을 고쳐 **JSON 적용**을 누르면 같은 방식으로 반영되고 스타일 폼과 JSON이 새 값으로 채워지며 `✓ JSON을 적용했습니다: 스타일 2개 항목(color, opacity)`처럼 결과가 표시됩니다. JSON 형식이 틀리거나 값이 범위를 벗어나면 도형은 그대로 두고 원인을 표시하고, **현재 값 다시 채우기**는 편집 전 JSON으로 되돌립니다. **기즈모 편집**을 누르면 도형에 이동·회전·크기 기즈모가 붙고 버튼이 **기즈모 편집 종료**로 바뀌며, 다시 누르면 편집이 끝납니다. **도형 삭제**는 도형을 레이어와 목록에서 제거합니다. |
| 레일의 **설정** 버튼을 누릅니다. | 열려 있던 패널이 닫히고 오른쪽에 설정 패널이 열립니다. **지형** 구획은 제목만 보이게 접혀 있고 제목을 누르면 펼쳐집니다. 펼치면 `지형 고도 배율` 입력은 1이고 상태 줄에 켜져 있는 고도 레이어 수가 표시됩니다. **도구** 버튼은 같은 방식으로 도구 패널을 열며, **좌표계 변환**·**이미지 출력** 구획도 접혀 있어 제목을 눌러 펼칩니다. |
| 레일의 **도구** 버튼을 누르고 좌표계 변환의 경도에 `127.9465`, 위도에 `37.3492`를 입력한 뒤 **변환하기**를 누릅니다. | 설정 패널이 닫히고 도구 패널로 교체되며, 결과 줄에 `WebMercator (EPSG:3857) → X 14242939.229m · Y 4487893.182m`가 표시됩니다. 가운데 **⇄**를 누르면 입력 좌표계가 WebMercator로 바뀌면서 그 X·Y가 입력에 들어가고 결과 줄에 원래 위경도가 남습니다. **초기화**를 누르면 위경도 → WebMercator 방향으로 돌아가고 입력·결과가 지워집니다. 위도에 90을 넣고 변환하면 변환할 수 없다는 안내가 나옵니다. |
| 이미지 출력의 **이미지 업로드**를 눌러 로컬 PNG를 고르고, 출력 경도 `127.9465`·위도 `37.3492`·회전 `30`을 넣은 뒤 **출력**을 누릅니다. | 업로드 직후 버튼 옆에 작은 미리보기와 파일 이름·픽셀 크기가 나타나고 **출력** 버튼이 활성화됩니다. 출력하면 그 좌표를 중심으로 폭 300m(높이는 이미지 비율) 사각형에 이미지가 정북 기준 30° 시계 방향으로 돌아간 채 지면에 그려지고, 상태 줄에 중심·회전·크기가 표시됩니다. 값을 바꿔 다시 출력하면 이전 이미지가 교체되고, **초기화**를 누르면 지면 이미지·미리보기·입력이 모두 지워집니다. |
| `지형 고도 배율`을 2로 바꿉니다. | 켜져 있는 지형의 높낮이가 2배로 커지고 상태 줄이 `배율 2 · 켜져 있는 고도 레이어 1개에 적용`으로 바뀝니다. 지형 레이어를 끈 상태면 적용 대상이 없다고 안내하고, 다시 1로 바꾸면 원래 지형으로 돌아옵니다. 범위(0.1~10)를 벗어난 값은 입력을 마칠 때 범위 안으로 보정됩니다. |
| 레일의 **고도 범례** 버튼(지형 아래, 드론 위)을 누릅니다. | 열려 있던 패널이 닫히고 오른쪽에 고도 범례 패널이 열립니다. `고도 범례 가시화`·`등고선 가시화`는 꺼져 있고 편집 카드는 보이지 않습니다. |
| `고도 범례 가시화`를 켭니다. | 지형·건물·드론이 고도별 색(0m 파랑, 100m 초록, 200m 노랑, 300m 주황, 400m 빨강, 투명도 0.5)으로 채워지고 **고도 범례** 카드가 나타납니다. 범례 행의 색상·투명도를 바꾸면 해당 고도 구간의 색이 즉시 바뀌고, `band`↔`mix`를 바꾸면 구간 색을 그대로 쓰거나 인접 색을 섞어 표현합니다. **+**를 누르면 500m 항목이 추가되고 **−**는 마지막 항목을 제거합니다. |
| `등고선 가시화`를 켭니다. | 고도 구간마다 지정한 간격의 등고선이 그려지고 **등고선 스타일** 카드가 나타납니다. 선 두께·감쇠 시작/표현 종료 거리·투명도와 구간 행(시작 고도·선 간격·색상)을 바꾸면 등고선의 굵기·거리별 표현·색이 즉시 바뀝니다. 두 가시화를 모두 끄면 후처리가 꺼지고 편집 카드가 숨겨집니다. |
| 왼쪽 아래 `코드 편집`을 누릅니다. | 코드 편집 패널이 열리고 상세 설정 창이 편집기 오른쪽으로 옮겨져 코드와 지도, 두 패널을 함께 볼 수 있습니다. |
| `드론 설정` 탭에서 **밝기**를 1.5로 바꾸고 **이동 보간 시간**을 `0`, `100`, `500`, `1000ms`로 차례로 비교합니다. | 선택한 드론 모델만 밝아지고 이동 시간도 그 드론에만 적용됩니다. 목표점은 1초마다 약 69m 떨어져 생성되어 `0`에서는 즉시 이동하고, `500ms`에서는 절반의 시간 동안 보간하며, `1000ms`에서는 다음 목표까지 계속 이동합니다. 다른 드론을 선택하면 그 드론의 개별 설정값이 표시됩니다. |
| `비행 경로` 탭을 누르거나 탭에서 ←·→ 키를 누릅니다. | 상세 설정 영역만 비행 경로 내용으로 바뀝니다. 체크박스는 켜져 있고 `경로 생성 상태: 경로 객체 생성됨`, `현재 표시 상태: 표시 중`이 표시됩니다. |
| `비행 경로 표시`를 해제합니다. | 선택한 드론의 경로만 지도에서 숨겨지고 `현재 표시 상태: 숨김`이 됩니다. 다른 드론의 경로는 각자의 설정대로 계속 표시됩니다. |
| 다른 드론을 선택한 뒤 원래 드론을 다시 선택합니다. | 다른 드론은 체크박스가 켜진 상태로, 원래 드론은 해제된 상태로 저장된 설정이 복원됩니다. |
| `비행 경로 표시`를 다시 켭니다. | 기존 경로가 다시 표시되고 이후 이동 위치가 이어서 누적됩니다. |
| 비행 경로 탭의 **누적 경로 표현**에서 경로 색상을 고르고 경로 폭·경로 투명도 슬라이더를 움직입니다. | 선택한 드론의 경로만 즉시 그 색·폭·투명도로 바뀌고 값 표시가 따라 바뀝니다(색 값의 `· 자동` 표시가 사라짐). 색을 고른 드론은 그룹에 넣고 빼도 그 색을 유지하고, 다른 드론은 각자의 표현을 유지합니다. |
| `오래된 경로 Fade`를 해제한 뒤 다시 켜고 `최대 표시 거리`를 줄입니다. | 해제하면 값 표시가 `사용 안 함`이 되고 거리·비율 슬라이더가 잠기며 전체 경로가 같은 폭·투명도로 표시됩니다. 다시 켜고 거리를 줄이면 최신 위치에서 그 거리까지만 경로가 보이고 끝부분이 점차 가늘고 투명해집니다. **경로 표현 기본값으로 되돌리기**를 누르면 모든 항목이 기본값으로 돌아갑니다. |
| `촬영 영역` 탭을 누르고 `촬영 영역 표시`를 켭니다. | 선택한 드론의 진행 방향 앞쪽으로 청록 외곽선의 촬영 영역이 그려지고, 시야 아래쪽 광선이 지면과 만나는 곳(고도 1,000m·기본 Pitch 10°·FOV 50° 기준 약 3~4km 앞)에 자홍색 지면 영역과 파란 옆면이 표시되며 드론이 이동·선회하는 동안 함께 움직입니다. 시야 광선이 Far 안에서 지면과 만나지 않으면 지면 영역은 그려지지 않습니다. 다른 드론을 선택하면 그 드론의 체크 상태(기본 꺼짐)와 설정이 표시됩니다. |
| Frustum 설정의 `FOV`·`Far`·`Pitch` 슬라이더를 움직입니다. | 촬영 영역의 폭·길이·기울기가 즉시 바뀝니다. `Pitch`를 음수(아래)로 돌리면 지면 영역이 드론 가까이 오고(−60°면 약 600m 앞), `Far`를 줄이면 먼 쪽 경계가 짧아지며 광선이 지면에 닿지 않을 만큼 줄이면 지면 영역이 사라집니다. |
| Helper 표현의 색상·투명도와 Helper 품질 / 안정화 값을 바꿉니다. | 외곽선·지면 면·옆면의 색과 투명도가 즉시 바뀌고, 정밀도 값을 올리면 지면 외곽이 더 세밀해지며 안정화 값을 올리면 흔들림이 줄되 반응이 느려집니다. **촬영 영역 기본값으로 되돌리기**를 누르면 모든 항목이 기본값으로 돌아가고 표시 여부는 유지됩니다. `촬영 영역 표시`를 끄면 Helper가 제거됩니다. |
| **전체 비행 일시정지**를 누릅니다. | 모든 드론의 이동이 멈추고 기존 경로는 유지됩니다. `현재 비행 중인 드론 수: 0대 (등록 3대)`로 바뀌고 목록·기본 정보의 비행 상태가 `일시정지`가 됩니다. |
| 일시정지 상태에서 **드론 추가**를 누릅니다. | 새 드론이 정지 상태로 생성되고 경로 출력 설정은 켜진 상태입니다. |
| **전체 비행 재개**를 누릅니다. | 각 드론이 멈춘 위치에서 이동을 재개하고 누적 경로가 이어집니다. 비행 중인 드론 수와 버튼 상태가 되돌아옵니다. |
| 왼쪽 `드론` 버튼 또는 패널의 `×`를 누릅니다. | 드론 패널이 닫히고 같은 버튼을 다시 누르면 열립니다. 패널이 닫혀도 비행과 경로 출력은 계속됩니다. |

## 관련 API

- `U3dAPP.getRenderer()`, `URenderer.getContext()`: 실제 지도 렌더러의 WebGL 컨텍스트를 반환합니다. 예제는 `WebGL2RenderingContext` 여부와 `gl.getParameter(gl.VERSION | gl.SHADING_LANGUAGE_VERSION | gl.RENDERER)`를 초기화 시 한 번 읽고, 캔버스의 `webglcontextlost`·`webglcontextrestored` 이벤트에서만 다시 읽습니다. 조회하지 못한 값은 `확인 불가`로 표시합니다.
- `U3dAPP.createMultipleComponentLayer()`: 드론 모델 원본을 `listmodel`로 등록한 컴포넌트 레이어를 만듭니다. 반환값은 모델 로드 완료를 `then`으로 알리는 Deferred이므로, 예제는 완료를 기다린 뒤 `addPosition()`을 호출합니다. 모델 서버가 응답하지 않으면 20초 후 실패로 표시합니다.
- `U3dMultipleComponentLayer.setInstanced()` / `isInstanced()`: 이후 `addPosition()`이 인스턴스 방식으로 컴포넌트를 만들지 정하고 현재 모드를 반환합니다. 이미 생성된 컴포넌트의 방식은 바뀌지 않습니다.
- `U3dMultipleComponentLayer.addPosition()`: `object`에 등록한 모델 원본 이름을, `geoPosition`에 지리좌표 `{x: 경도, y: 위도, z: 고도(m)}`를 전달해 드론을 만듭니다. 실패하면 `undefined`를 반환하므로 예제는 성공한 드론만 목록에 집계합니다.
- `U3dMultipleComponentLayer.removeComponentByName()`: 드론 컴포넌트를 제거합니다. 컴포넌트 해제 시 누적 경로(`getCumulativePath()`)도 함께 제거되며, 다른 드론이 공유하는 모델 원본은 레이어가 관리합니다.
- `U3dComponentPosition.getInstanced()`: 컴포넌트가 인스턴스 메시로 생성되었는지 반환합니다. 예제의 `Instance 드론 수`는 이 값이 `true`인 드론 개수입니다.
- `U3dComponentPosition.moveSmoothly({position, durationMs})`: 지리좌표 목표 위치까지 부드럽게 이동합니다. 예제는 1000ms마다 약 69m 떨어진 목표를 만들고 선택한 `durationMs`(0~1000ms) 동안 이동시켜 순간 이동부터 끊김 없는 연속 보간까지 비교합니다. `drawCumulativePath`가 `true`이면 이동 위치가 누적되어 경로가 생성됩니다. 반환 Promise는 도착이 아니라 이동 예약 완료를 뜻하며, 예제는 `getAnimationNow().waypointQueueSize`로 대기열 크기를 확인해 한도를 넘으면 목표 생성을 건너뜁니다.
- `U3dComponentPosition.movePause()` / `moveResume()` / `getAnimationNow()`: 진행 중인 이동 애니메이션을 일시정지·재개합니다. 예제는 목표 위치 생성을 먼저 멈춘 뒤 실제 재생 중인 컨트롤러만 멈추고, 같은 컨트롤러만 다시 재생합니다.
- `U3dComponentPosition.drawCumulativePath`: 이후 이동에서 경로를 생성할지 정하는 속성입니다. `false`로 바꿔도 이미 그려진 경로는 숨겨지지 않으므로 `showCumulativeRoute()`·`hideCumulativeRoute()`를 함께 사용합니다. `hideCumulativeRoute()`는 표시를 끄면서 이 속성도 `false`로 바꿉니다.
- `U3dComponentPosition.getCumulativePath()`: 누적 경로 객체(`U3dCumulativePath`)를 반환합니다. 드론이 아직 이동하지 않았으면 `undefined`이며 정상적인 준비 상태입니다. `U3dCumulativePath.visible`로 실제 표시 여부를 읽습니다.
- `U3dComponentPosition.setCumulativePathStyle()`: 경로 색상·두께·투명도와 `drawOffset`, `tailPolicy`를 지정합니다. 경로 객체가 만들어지기 전에 호출해도 값이 보관되어 생성 시 적용됩니다. `drawOffset`을 생략하면 엔진이 모델 길이만큼 진행 방향 앞쪽에 경로를 그리므로 예제는 `0`(드론 중심)을 명시하고, 기본 단순화(`simplify: true`, 10m)가 선회 궤적을 각지게 만들므로 `simplify: false`로 원본 좌표를 유지합니다. 비행 경로 탭의 누적 경로 표현은 같은 API로 `color`·`opacity`·`width`와 `tailPolicy: {maxDistance, widthFade, alphaFade}`를 선택한 드론에 즉시 적용하며(이미 만들어진 경로는 `U3dCumulativePath.setPathStyle()`로 바로 반영), Fade를 끄면 `maxDistance: Infinity`·비율 0을 전달합니다. `tailPolicy`는 넘긴 항목만 기존 정책에 합쳐지므로 `simplify`·`initLength`는 유지됩니다.
- `U3dAPP.on('click', listener)` / `off('click', id)`: 지도 클릭을 `U3dMouseEvent`로 전달합니다. 드래그 뒤의 마우스 놓기는 엔진이 클릭으로 보내지 않습니다. `normalizedX/normalizedY`는 캔버스 기준 NDC(-1~1) 좌표이며, 예제는 각 드론의 `getWorldPosition()`을 `Vector3.project(app.getCamera())`로 같은 좌표계에 투영해 픽셀 거리를 비교합니다. `on()`이 반환한 ID로 정리 시 해제합니다.
- `U3dSelect({mode: 'box', targetLayer})` / `active()` / `deactive()` / `on('end')` / `clearSelect()`: selectModel 예제와 같은 엔진 박스 선택입니다. `active()`하면 엔진이 지도 이동을 멈추고(`disableCameraMove`) 캔버스의 포인터 이벤트로 선택 상자(`.selectBox`)를 그리며, 마우스를 놓으면 상자 절두체 안의 컴포넌트(`U3dSelectionBox`가 인스턴스별 bounding box로 판정)를 `end` 이벤트의 `data`로 전달합니다. 예제는 Space 키를 누르는 동안만 `active()`하고 놓으면 `deactive()`하며, 받은 컴포넌트를 드론 목록과 대조한 뒤 `clearSelect(true)`로 엔진 하이라이트를 지우고 목록 강조·POI 라벨로 표시합니다.
- 엔진 보완: 인스턴스 모델에는 `InstancedMesh2.addLOD()`가 만든 하위 LOD 메시(`instances`가 `null`)가 자식으로 붙는데, 이전 `U3dSelectionBox.searchChildInFrustum()`은 이 메시에서 예외를 던져 박스 선택 결과(`end`)가 오지 않았습니다. 이번 작업에서 `instances` 배열이 없는 인스턴스 메시를 건너뛰도록 엔진(`union3d/select/U3dSelectionBox.js`)을 보완했습니다. 상위 메시가 같은 인스턴스를 이미 판정하므로 결과는 달라지지 않습니다.
- `U3dAPP.intersectAtPixel({normalizedX, normalizedY}, true)` / `vector3ToGeoGraphic()` / `geographicToVector3()`: 우클릭 화면 위치를 캔버스 기준 NDC로 바꿔 지표면과 교차한 월드 좌표를 지리좌표로, 이동 목표의 지리좌표를 화살표용 월드 좌표로 변환합니다. 엔진 월드 좌표가 EPSG:3857(m)이므로 도구 패널의 좌표계 변환도 `geographicToVector3({x: 경도, y: 위도, z: 0})`의 x·y(WebMercator)와 `vector3ToGeoGraphic(new THREE.Vector3(x, y, 0))`(위경도)로 계산합니다.
- `U3dComponentPosition.setCumulativePathStyle({color})`: 그룹에 들어간 드론의 경로 색을 그룹 색으로 바꿉니다. 이미 만들어진 경로는 즉시 바뀌고, 아직 없는 경로는 생성 시 적용됩니다.
- `GeOnDT.UFrustum` / `setCameraInfo()` / `setPitchYawRoll()` / `setTarget()` / `updateTarget()`: 카메라 시야의 절두체입니다. `setCameraInfo({fov, aspect, near, far, fovX: 0, fovY: 0, ...})`로 원근 형태를 만들고, `setPitchYawRoll(pitch, yaw, roll)`(degree, pitch 위 +/아래 −, yaw 오른쪽 +/왼쪽 −, roll은 시선축 회전)로 드론 기준 자세를 정하며, `setTarget(component)`로 드론 컴포넌트에 장착한 뒤 `updateTarget()`으로 현재 위치·진행 방향에 맞춘 월드 행렬을 계산합니다. 예제는 렌더 직전 콜백에서 표시 중인 모든 Frustum을 `updateTarget()`합니다.
- `U3dAPP.setFrustumTerrainProjectionHelper(frustum, options)`: 앱의 렌더링 컨텍스트로 `UFrustumTerrainProjectionHelper`를 만듭니다. `terrain: true`이면 near→far 광선과 실제 렌더 지면의 교차점으로 촬영 지면 영역(footprint)을 만들어 외곽선·옆면·`fill` 채움을 그리고, 지면과 만나지 않는 구간은 표시하지 않습니다. 반환한 Helper는 `getExternalScene().add()`로 scene에 넣고 `dispose()`로 scene 제거와 stamp 자원 해제를 함께 합니다.
- `UFrustumTerrainProjectionHelper` 공개 setter: 표현은 `setColor()`·`setLineWidth()`·`setOpacity()`(선), `setFillColor()`·`setFillOpacity()`·`setSideColor()`·`setSideOpacity()`(지면 면·옆면), 품질·안정화는 `setUpdateIntervalMs()`(정규화된 값은 `getUpdateIntervalMs()`로 되읽음)·`setIntersectionSteps()`·`setTerrainStampGridSize()`·`setTerrainBoundaryRefinementSteps()`·`setTerrainIntersectionStabilization()`·`setTerrainIntersectionMedianWindow()`·`setTerrainIntersectionHalfLifeMs()`·`setTerrainIntersectionMaxLagDistance()`·`setTerrainIntersectionHitPersistenceMs()`·`setTemporalHalfLifeMs()`·`setTemporalHysteresisDistance()`·`setTemporalFarSmoothingFactor()`·`setTemporalSnapGapMs()`입니다. 정밀도 setter는 현재 자세의 지면 형상을 즉시 다시 계산합니다.
- `U3dAPP.getAnalysis('Height')` → `UAnalyHeight.setUserStyle()` / `setHeightVisible()`(예전 이름 `drawHeight()`) / `isHeightVisible()`: 고도 범례 분석입니다. `setUserStyle({mode, '0': 'rgba(...)', '100': ...})`에 숫자 키(고도 기준값 m)별 RGBA 색을 넘기면 복사해 GPU DataTexture/uniform으로 즉시 갱신하고(mode는 `'band'`·`'mix'`, 항목은 최대 256개), `setHeightVisible(true)`가 Height 후처리 pass를 켜 화면 픽셀의 고도를 범례 색으로 채웁니다. 끄면 등고선이 같은 pass를 쓰는 중인지 확인한 뒤 pass를 끕니다.
- `U3dAPP.getAnalysis('Contour')` → `UAnalyContour.setTopoStyle()` / `setTopoWidth()` / `setTopoOpacity()` / `setTopoFadeDistance()` / `drawHeight()`: 등고선 분석입니다. `setTopoStyle([{height, interval, color}])`은 구간을 시작 고도순으로 정렬하고 간격이 0 이하인 항목은 버립니다(최대 256개). 선 두께(px)·투명도(0~1)·감쇠 시작/종료 거리(m, 종료는 시작보다 1m 이상 커야 함)를 지정하고 `drawHeight(true)`로 같은 Height pass에 등고선을 그립니다.
- three.js `ArrowHelper`: 드론→목표 화살표입니다. 이동 명령 화살표(투명도 0.55)와 편대 합류·재합류 중 드론→합류점 화살표(투명도 0.35)가 같은 생성·갱신 함수를 씁니다. 선·화살촉 재질을 반투명(`opacity 0.55`)·`depthTest: false`로 두어 지형에 가려지지 않게 하고, 이동 갱신마다 `position`·`setDirection()`·`setLength()`로 다시 맞춥니다. 명령이 끝나면 외부 scene에서 제거하고 재질을 해제합니다.
- `U3dVectorLayer` / `addGeometry()` / `removeGeometry()` / `clear()` / `getScene()`: 그린 3D 도형을 담는 벡터 레이어입니다. 드론 레이어와 별개로 만들고, 도형 삭제·모두 지우기·예제 정리 시 함께 제거합니다. `getScene()`은 그리기 창이 닫혀 있을 때 지도 클릭으로 도형을 고르는 `intersectFromScene()`의 검사 대상입니다.
- `GeOnDT.geom.U3dPoint`·`U3dLine`·`U3dCylinder`·`U3dBox`·`U3dCircle`·`U3dSphere`·`U3dPipe`·`U3dUserGeometry`·`U3dPolygonLoftGeometry`·`U3dPathGeometry`: 그리기 창에서 고른 종류의 도형 생성자입니다. 한 번 클릭 도형은 `setPosition()`, 여러 점 도형은 `addPosition()`으로 클릭 위경도를 받습니다. `U3dPathGeometry.draw(true, option)`는 경로 그리기 모드를 켭니다.
- `U3dGeometry.setParam()` / `getParam()` / `getPositions()` / `setShadow()`: 상세 설정 창의 스타일 폼은 `getParam()` 값으로 만들고 `setParam()`으로 되돌려 적용합니다. JSON 영역의 **JSON 적용**도 `type`·`coord`를 뺀 나머지 값을 검사한 뒤 같은 `setParam()`에 전달합니다. `getPositions()`의 위경도 좌표는 중심 계산과 JSON 내보내기에 씁니다.
- `U3dGeometryFactory.addJson(json, layer)`: `type`과 `coord`를 포함한 JSON으로 도형을 만들어 레이어에 추가합니다. 상세 설정 창의 JSON을 다시 넣어 같은 도형을 재현할 수 있습니다.
- `U3dAPP.closestPointAtPixel()` / `getAnalysis('GizmoModel')`: 지도 클릭 지점의 월드 좌표를 도형 좌표로 바꾸고, 기즈모 분석 기능으로 도형에 이동·회전·크기 기즈모를 붙입니다.
- `UGroupBoundaryHelper(target, options)`: 컴포넌트 배열을 대상으로 `getVectorPosition()` 월드 위치를 읽어 경계 입체(상·측·하면)와 외곽선을 만드는 엔진 three.js 객체입니다. `height`·`bufferSize`·`connectionDistance`·`positionTolerance`·`surfaceMode`·`color`·`opacity`·`outline` 옵션을 받고, `update()`로 다시 계산하며 `setTarget()`으로 대상을 바꾸고 `dispose()`로 자원을 해제합니다.
- `U3dAPP.getExternalScene()` / `setRenderBefore(key, callback)` / `removeRenderBefore(key)`: 경계 helper를 외부 scene에 추가하고, 렌더 직전 콜백에서 표시 중인 모든 그룹의 `update()`를 호출합니다. 그룹 삭제·형상 끄기·예제 정리 시 scene에서 제거하고 `dispose()`합니다. 계산 오류가 5회 연속이면 그 그룹의 형상만 끄고 안내합니다.
- `U3dComponentPosition.setLabel({label})` / `showLabel()` / `removeLabel()` / `poi`: 선택 드론의 이름·고도 라벨을 컴포넌트에 붙입니다. `poi.zOffset`을 6m 높이고 문구는 0.5초마다 갱신합니다. 비행 상태는 별도 `U3dPOI`를 `app.addPOI()`로 등록해 표시하며, 렌더 직전에 실제 컴포넌트 위치를 따라갑니다. 상태 종료·드론 삭제·예제 종료 시 `app.removePOI()`로 해제합니다.
- `steering.steerToward()` / `getGeoOffsetMeters()` / `offsetGeoPosition()`(steering.js): 원거리 합류·재합류와 합류 대기의 선회 이동을 계산합니다. 슬롯 근처 접근과 팔로우 이동은 리더의 슬롯 이동 벡터에 거리·분리 보정을 더하고 가속도를 제한합니다. 슬롯은 매 갱신 다시 계산해 이동하는 본대도 추격합니다.
- `U3dAPP.setCameraGeographicPosition(경도, 위도, 목표 높이, 방위각, 시야각, 거리, 이동 시간)`: 드론의 현재 지리좌표를 목표로 카메라를 이동합니다. 방위각은 `getMapControl().getAzimuthalAngle()`(라디안)을 도로 바꿔 현재 값을 유지합니다.
- `U3dComponentPosition.setBrightness(brightness)` / `getBrightness()` / `setContrast(contrast)` / `getContrast()`: 모델 재질의 밝기·대비를 절대 배율로 바꿉니다. 1이 원래 값이고 밝기 0은 검정, 대비 0은 중간 회색이며 밝기를 먼저 적용합니다. 인스턴스 컴포넌트와 표준 Three.js 재질을 지원하고, 선택 강조 중에는 값이 보존되어 해제 후 다시 적용됩니다. 음수·비유한 값은 RangeError이므로 예제는 슬라이더 범위(0~3)로 보정해 넘깁니다.
- `GeOnDT.terrain.UTerrainStamp({points, texture, textureOpacity, textureUseAlpha, textureFit})` / `setApp()` / `setVisible()` / `dispose()`: 지형 타일 위에 polygon 영역으로 이미지를 얹는 도장 객체입니다. `points`는 월드 좌표(EPSG:3857) 네 점이며 첫 점이 texture UV 원점(이미지 왼쪽 위), 첫→둘째 점이 이미지 가로 방향, 첫→넷째 점이 세로 방향입니다. `texture`는 이미지 URL(data URL 포함), `textureFit: 'contain'`은 네 점에 이미지를 맞춥니다. 예제는 중심 위경도·정북 기준 회전으로 네 점을 만들고 `getHeightAtGeographicPoint()`로 읽은 지형 높이를 z에 넣습니다.
- `U3dAPP.getHeightLayers()` / `U3dLayer.getVisible()` / `U3dHeightLayer.setHeightScale(scale)` / `getHeightScale()`: 등록된 고도 레이어 중 켜져 있는 것에 지형 높이 배율을 적용합니다. 엔진은 0.1 미만을 0.1로 보정하고 캐시된 타일 메시의 `scale.z`와 이후 생성 타일에 모두 반영합니다. 지형 레이어 자체는 Common Runtime의 [지형] 패널이 만들고 켜고 끄므로 예제는 값만 바꾸고 정리 시 기본값으로 되돌립니다.
- `U3dAPP.setCameraType('orthographic'|'perspective')` / `getCameraType()` / `set2DMode()` / `set3DMode()`: 카메라를 직교↔원근으로 바꾸고(현재 위치·방향·시야 크기 유지), 지도 조작을 TopView(극각 0)에 고정하거나 60° 기울인 3D 시점으로 되돌립니다. 두 모드 함수는 카메라 이동 Promise를 반환하므로 예제는 실패를 오류 안내로 받습니다. 예제 정리 시 원근·3D로 복구합니다.
- `U3dAPP.createDebugCanvas()` / `removeDebugCanvas()` / `getDevToolView()`: 엔진 디버그 UI(`Development Tools` 패널, id `UDevToolView`)를 지도 컨테이너에 만들고 제거하며, 패널 객체(`UDevToolView`)를 돌려줍니다. 엔진은 패널을 인라인 스타일로 오른쪽 위 25px에 두므로 예제는 만든 직후 인라인 위치를 지우고 CSS 클래스로 지도 도구 아래에 배치하며, `UDevToolView.setMaxHeight()`로 높이를 화면에 맞춥니다. `showDevToolView()`·`hideDevToolView()`는 만든 패널을 숨기고 다시 보이는 용도이고, 예제는 버튼을 누를 때마다 만들고 제거합니다. 정리 시 켜져 있으면 제거합니다.

## 2D/3D 모드 전환

지도 도구의 2D/3D 스위치는 카메라 종류와 지도 조작 모드를 함께 바꿉니다. orthographic 예제의 라디오 버튼과 같은 엔진 호출입니다.

{{example-code:main:view.mode}}

## 성능 확인(엔진 디버그 UI)

지도 도구의 성능 확인 버튼은 엔진 디버그 UI를 만들고 제거합니다. 만든 직후 `#UDevToolView` 요소의 인라인 위치를 지우고 예제 CSS 클래스로 지도 도구 아래에 배치합니다.

{{example-code:main:debug.view}}

## WebGL 실행 환경 읽기

실제 렌더러의 컨텍스트에서 읽은 값만 표시하고, 조회하지 못하면 `확인 불가`와 이유를 남깁니다.

{{example-code:main:webgl.read}}

## Instance Rendering 드론 레이어 생성

모델 원본을 한 번 등록하고, 컴포넌트를 만들기 전에 인스턴스 모드를 켭니다.

{{example-code:main:layer.create}}

## 드론 생성과 누적 경로 스타일

모델 로드가 끝난 뒤 등록한 모델 원본 이름으로 드론을 만들고, 이동 궤적을 누적하도록 `drawCumulativePath: true`를 전달합니다.

누적 경로는 `animationComponents`와 같은 폭·투명도 fade를 적용합니다. `CONFIG.path.tailPolicy`의 `maxDistance: 14000`으로 최신 위치에서 경로를 따라 최대 14,000m까지 표시하고, `widthFade: 0.5`·`alphaFade: 0.4`로 오래된 50% 구간의 폭과 오래된 40% 구간의 불투명도를 점차 줄입니다. 그룹에 넣거나 빼서 경로 색을 바꾸어도 이 정책은 유지되며, 비행 경로 탭의 누적 경로 표현으로 드론별로 바꿀 수 있습니다.

{{example-code:main:drone.create}}

## 무작위 비행 이동

하나의 공통 타이머가 1000ms마다 모든 드론의 다음 목표 위치를 만들어 `moveSmoothly()`에 전달합니다. 기본 속도 250km/h 기준으로 연속 목표 사이 거리는 약 69m입니다.

{{example-code:main:flight.move}}

## 누적 비행 경로 표시 제어

선택한 드론의 표시 설정만 바꾸고, 이미 만들어진 경로는 `showCumulativeRoute()`·`hideCumulativeRoute()`로 표시를 바꿉니다.

{{example-code:main:path.visibility}}

## 누적 경로 표현(비행 경로 탭)

animationComponents 예제와 같은 항목을 선택한 드론에 적용합니다. 색·투명도·폭은 바뀐 항목만, Fade 항목은 `tailPolicy` 하나로 함께 전달하며, 경로가 아직 없으면 값이 보관되어 생성 시 적용됩니다.

{{example-code:main:path.style}}

## 촬영 영역(촬영 영역 탭, UFrustum + 지면 투영 Helper)

촬영 영역 표시를 켜면 선택한 드론에 `UFrustum`을 장착하고 지면 투영 Helper를 만듭니다. animationComponents 예제와 같은 생성 옵션이며, 설정 항목은 표시 중인 Frustum·Helper에 공개 API로 즉시 반영됩니다.

{{example-code:main:frustum.helper-create}}
{{example-code:main:frustum.camera-info}}
{{example-code:main:frustum.rotation}}
{{example-code:main:frustum.helper-style}}
{{example-code:main:frustum.helper-fill}}
{{example-code:main:frustum.helper-quality}}

## 고도 범례·등고선(고도 범례 패널)

analysisHeightLegend 예제와 같은 흐름입니다. 범례 항목 배열을 `setUserStyle()` 스타일 객체로 바꿔 전달하고, 등고선 구간과 옵션을 Contour 분석에 전달한 뒤 `setHeightVisible()`·`drawHeight()`로 후처리 표시를 켭니다.

{{example-code:main:legend.style}}
{{example-code:main:legend.items}}
{{example-code:main:analysis.visibility}}
{{example-code:main:contour.style}}
{{example-code:main:contour.items}}

## 드론 밝기·대비·이동 보간 시간

드론 설정 탭의 밝기·대비는 선택한 드론 컴포넌트에 절대 배율로 적용하고, 이동 보간 시간은 선택한 드론의 다음 `moveSmoothly()` 호출에 `durationMs`로 전달합니다.

{{example-code:main:drone.brightness}}

{{example-code:main:drone.contrast}}

## 지도 클릭으로 드론 선택

`selectModel` 예제처럼 앱의 선택 이벤트를 받아 목록·상세 설정 창·POI를 함께 갱신합니다. 다만 `U3dSelect`의 점 선택은 모델 메시를 광선으로 정확히 맞춰야 하고, 인스턴스 컴포넌트는 공유 메시가 선택 결과로 돌아오므로 수 km 밖에서 몇 픽셀 크기인 드론을 고르기 어렵습니다. 이 예제는 앱 `click` 이벤트의 화면 좌표와 드론 월드 좌표의 투영 결과를 비교해 클릭 근처의 드론을 고릅니다. 허용 거리는 `CONFIG.selection.pickRadiusPx`입니다.

{{example-code:main:select.pick}}

## 박스 다중 선택

selectModel 예제와 같은 엔진 `U3dSelect` 박스 모드를 사용합니다. 선택기는 초기화 때 한 번 만들고, 선택 키를 누르는 동안만 `active()`해 지도 이동을 멈추고 상자를 그린 뒤, 놓을 때 `end` 이벤트로 받은 컴포넌트를 드론 목록 선택으로 바꿉니다.

{{example-code:main:select.box}}

## 드론 POI 라벨

컴포넌트 라벨은 선택 드론의 이름·고도만 표시합니다. 상태는 별도 `U3dPOI`로 표시해 선택 해제에도 유지되고, 지리좌표 높이 보정과 화면 라벨 오프셋으로 두 라벨을 분리합니다. 상태 POI 위치는 렌더 직전에 실제 드론 위치로 갱신합니다.

{{example-code:main:label.show}}

## 드론 위치로 카메라 이동

실제 컴포넌트 위치를 카메라 목표로 사용합니다. 시야각·거리·이동 시간은 `CONFIG.focusCamera`에서 바꿉니다.

{{example-code:main:camera.focus}}

## 우클릭 지점으로 이동 명령

우클릭 화면 위치를 지표면과 교차해 지리좌표로 바꾸고, 선택한 드론에 이동 명령을 내립니다.

{{example-code:main:command.pick}}

이동 계산은 `steering.js`의 `steerToward()`에 맡기고 결과를 드론의 비행 상태(마지막 목표 위치·방위)에 반영합니다. 목표에 도착하면 명령이 끝나고 이전 기본 상태를 이어갑니다. 팔로우 드론은 재합류 비행으로 돌아갑니다.

{{example-code:main:command.steer}}

## 선회 제한 이동 모듈(steering.js)

항공기처럼 방향을 순간적으로 바꿀 수 없는 객체의 이동 계산만 담당하는 독립 모듈입니다. 한 갱신에서 이전 진행 방향과 새 진행 방향 단위벡터의 내적이 `cos(최대 선회율 × dt)` 이상이 되도록 방위 변화를 제한하고, 목표가 선회 반지름 안쪽 뒤편이면 잠시 직진해 거리를 벌린 뒤 돌아옵니다. 지리좌표와 방위각만 다루고 엔진·DOM에 의존하지 않으므로, 그룹 대형 합류(각자 날던 드론이 슬롯으로 모이는 이동)에도 같은 `steerToward()`를 쓸 수 있습니다.

{{example-code:steering:steer.step}}

## 그룹 색상과 경로 색

그룹에 들어간 드론은 누적 경로 색이 그룹 색으로 바뀌고, 그룹에서 나오면 드론 고유 색으로 돌아옵니다. 목록의 색상 점도 같은 색을 따릅니다.

{{example-code:main:path.color}}

## 리더·합류·팔로우 비행

최초 합류 드론은 대기 중인 리더 주변의 자기 슬롯으로 빠르게 접근합니다. 명령 후 재합류도 같은 접근 계산을 사용하지만 리더의 합류 대기를 요구하지 않습니다. 근접 구간에서는 목표 좌표로 바로 붙이지 않고 슬롯 속도에 맞춥니다.

{{example-code:main:flight.join}}

합류 중인 드론이 있는 동안 리더는 합류점을 중심으로 원 위의 앞쪽 점을 계속 겨냥해 반경 회전 비행을 합니다.

{{example-code:main:flight.loiter}}

합류·재합류 중에는 드론에서 현재 합류점(자기 슬롯)까지 화살표를 그리고, 리더가 움직여 합류점이 바뀌면 이동 갱신마다 다시 맞춥니다.

{{example-code:main:flight.join-arrow}}

팔로우 드론은 고유 슬롯의 이동 벡터를 이어받고, 남은 위치 오차가 작아질수록 보정 속도를 줄입니다. 직전 속도에서 가속도를 제한하고 가까운 드론과 벌어지도록 보정합니다. 합류 완료와 대형 변경도 같은 계산을 사용합니다.

{{example-code:main:flight.follow}}

## 좌표계 변환(도구 패널)

엔진 월드 좌표가 WebMercator(EPSG:3857, m)이므로 위경도→월드 변환의 x·y가 WebMercator 좌표이고, 월드→위경도 변환이 역변환입니다. 상세 설정 창의 좌표 입력 이동 명령도 같은 변환으로 위경도를 만들어 `commandDroneTo()`에 넘깁니다.

{{example-code:main:coords.convert}}

## 지면 이미지 출력(도구 패널, UTerrainStamp)

업로드한 이미지(data URL)를 중심 좌표·정북 기준 회전으로 만든 네 모서리에 매핑해 지형 위에 그립니다. animationComponents 예제의 사용 방식과 같습니다.

{{example-code:main:terrain.stamp}}

## 그룹 형상 가시화(UGroupBoundaryHelper)

그룹 소속 드론 컴포넌트 배열을 대상으로 엔진 `UGroupBoundaryHelper`를 만들어 외부 scene에 추가합니다. 대상이 컴포넌트이므로 helper가 직접 `getVectorPosition()`으로 월드 위치를 읽습니다.

{{example-code:main:group.boundary}}

렌더 직전 콜백(`setRenderBefore`)에서 표시 중인 그룹마다 `update()`를 호출해 드론 이동을 따라갑니다. 소속이 바뀌면 `setTarget()`으로 대상을 교체합니다.

{{example-code:main:group.boundary-update}}

## 3D 도형 레이어와 도형 생성(shapes.js)

vectorLayer 예제의 3D 객체 그리기를 옮긴 모듈입니다. 드론 레이어와 별개의 벡터 레이어를 만들고, 그리기 창이 열려 있는 동안 지도 클릭 위경도로 도형을 만들어 목록에 등록합니다.

{{example-code:shapes:shape.layer}}

{{example-code:shapes:shape.create}}

## 도형 JSON 생성과 스타일 변경

`type`·`coord`를 담은 JSON으로 도형을 재현하고, 이미 그린 도형은 지우지 않고 `setParam()`으로 스타일만 바꿉니다. 그리기 패널의 JSON으로 생성이 `addJson()`을, 상세 설정 창의 스타일 폼과 JSON 영역의 **JSON 적용**이 `setParam()`을 사용합니다. JSON 적용은 `type`·`coord`를 뺀 나머지를 스타일로 넘기고 `name`은 이름 변경으로 처리합니다.

{{example-code:shapes:shape.json}}

{{example-code:shapes:shape.style}}

{{example-code:shapes:shape.json-apply}}

## 전역 객체로 조회·조작하기

이 예제는 고객과 사용자가 브라우저 개발자 도구 콘솔에서 주요 객체를 직접 조회하고 조작할 수 있도록 하나의 전역 객체 `window.droneIntegratedMonitoring`을 공개합니다. 이 객체는 엔진 API가 아니라 이 예제가 제공하는 조회·조작 객체이며, main의 `initialize()`가 반환하는 example 객체와 같은 객체입니다. Editor에서 실행하면 실행 창(Runner iframe)의 전역 객체를 사용합니다. 기존 `window.app`은 Common Runtime이 소유합니다.

| 항목 | 내용 |
| --- | --- |
| `droneIntegratedMonitoring.config` | 모델 정보, 초기 드론·그룹 편성(`initialDronePositions`, `initialGroups`), 비행·경로·이동 명령·지형 기본 설정(CONFIG) |
| `droneIntegratedMonitoring.steering` | 선회 제한 이동 모듈(steering.js). `steering.steerToward(state, target, options)`를 콘솔에서 직접 실험할 수 있습니다. |
| `droneIntegratedMonitoring.shapes` | 3D 도형 관리자(shapes.js). `shapes.shapes`(도형 ID → `{id, name, type, geom, visible}` Map), `shapes.state`, `setDrawingActive(true)`, `createFromJson({...})`, `selectShape('shape-01')`, `applyShapeStyle('shape-01', {color: '#ff0000'})`, `getShapeJson('shape-01')`, `exportAllJson()`, `removeShape('shape-01')`, `clearAll()` 등을 제공합니다. |
| `droneIntegratedMonitoring.app` | 실제 `U3dApp` |
| `droneIntegratedMonitoring.droneLayer` | 드론 컴포넌트 레이어(`U3dMultipleComponentLayer`) |
| `droneIntegratedMonitoring.drones` | 드론 ID → `{id, color, component, flight, motion, path, groupId, command}` Map. `motion.base`가 기본 이동 상태(`flying`·`joining`·`rejoining`·`waiting`·`following`)이고 `command`가 있으면 이동 명령이 우선합니다. 누적 경로는 `drones.get('drone-01').component.getCumulativePath()`로 조회합니다. |
| `droneIntegratedMonitoring.groups` | 그룹 ID → `{id, name, color, droneIds, formation, shapeVisible, rendezvous, boundary}` Map. `droneIds[0]`이 리더, `rendezvous`는 합류 중인 드론이 있을 때의 합류점(지리좌표), `boundary`는 형상 표시 중일 때의 `UGroupBoundaryHelper`입니다. |
| `droneIntegratedMonitoring.motionStates` | 이동 상태 종류와 표시 이름·POI 표시 여부(`flying`, `command`, `joining`, `rejoining`, `waiting`, `following`) |
| `droneIntegratedMonitoring.state` | 단일 선택 드론 ID(`selectedDroneId`), 선택 드론 목록(`selectedDroneIds`), 선택 그룹 ID(`selectedGroupId`), 박스 선택 키 상태(`boxSelectActive`), 활성 탭(`activeTab`), 모델 준비 상태(`model`), 일시정지 여부(`paused`), 보기 모드(`viewMode`: `'2d'`·`'3d'`), 디버그 UI 표시 여부(`debugViewVisible`), 고도 범례 패널 상태(`heightLegend`: 표시 여부·mode·범례 항목·등고선 구간·옵션), WebGL 정보(`webgl`) |
| `droneIntegratedMonitoring.actions.addDrone()` | 드론 한 대를 추가하고 선택합니다. 지리좌표 `{x, y, z}`를 전달하면 그 위치에서 출발합니다. |
| `droneIntegratedMonitoring.actions.removeSelectedDrone()` | 선택한 드론을 삭제합니다. `removeDrone('drone-02')`로 특정 드론을 삭제할 수도 있습니다. |
| `droneIntegratedMonitoring.actions.selectDrone('drone-02')` | 드론을 선택합니다. `selectDrone()`(인수 없음) 또는 `deselectDrone()`은 선택을 해제합니다. |
| `droneIntegratedMonitoring.actions.toggleDroneSelection('drone-02')` | 목록 클릭과 같은 동작입니다. 선택 중이면 선택에서 빼고, 아니면 그 드론 하나만 선택합니다. |
| `droneIntegratedMonitoring.actions.selectDrones(['drone-01', 'drone-02'])` | 여러 드론을 다중 선택합니다(박스 선택과 같은 결과). |
| `droneIntegratedMonitoring.actions.addGroup()` / `removeGroup('group-01')` / `removeSelectedGroup()` | 그룹을 만들고 삭제합니다. 삭제하면 소속 드론이 목록으로 돌아옵니다. |
| `droneIntegratedMonitoring.actions.selectGroup('group-01')` / `deselectGroup()` / `toggleGroupSelection('group-01')` | 그룹을 선택해 그룹 상세 설정 창을 열거나 닫습니다. 선택하면 리더 한 대만 선택되고, 해제하면 리더 선택도 풀립니다. |
| `droneIntegratedMonitoring.actions.renameGroup('group-01', '정찰조')` | 그룹 이름을 바꿉니다. |
| `droneIntegratedMonitoring.actions.addDronesToGroup('group-01', ['drone-01'])` / `removeDronesFromGroup(['drone-01'])` | 드론을 그룹에 넣거나 뺍니다(목록 드래그와 같은 동작). |
| `droneIntegratedMonitoring.actions.setGroupFormation('group-01', 'v')` | 팔로우 드론의 슬롯 배치(대형)를 바꿉니다. `'none'`, `'column'`(수직선), `'row'`(수평선), `'v'` 중 하나입니다. |
| `droneIntegratedMonitoring.actions.stepFlight(50)` | 이동 갱신을 타이머를 기다리지 않고 즉시 n번 진행합니다. 합류·대기·팔로우 전환을 빠르게 확인할 때 씁니다. |
| `droneIntegratedMonitoring.getGroupSnapshot('group-01')` | 리더(`leaderId`), 합류점(`rendezvous`), 합류 중인 수(`joiningCount`), 소속 드론별 상태(`members[].flightStatus`)를 반환합니다. |
| `droneIntegratedMonitoring.actions.setGroupShapeVisible('group-01', true)` | 그룹 형상(`UGroupBoundaryHelper` 경계 입체)을 켜고 끕니다. `groups.get('group-01').boundary.setOpacity(0.5)`처럼 helper 메서드를 직접 호출할 수도 있습니다. |
| `droneIntegratedMonitoring.actions.focusSelectedDrone()` | 선택한 드론의 현재 위치로 카메라를 이동합니다. `focusDrone('drone-02')`로 특정 드론을 지정할 수도 있습니다. |
| `droneIntegratedMonitoring.actions.commandDroneTo('drone-01', {x: 경도, y: 위도})` / `commandSelectedDronesTo({x, y})` / `cancelDroneCommand('drone-01')` | 지도 우클릭과 같은 이동 명령을 내리거나 취소합니다. 고도는 현재 비행 고도를 유지하며, 진행 중인 명령은 `getDroneSnapshot().command`로 확인합니다. |
| `droneIntegratedMonitoring.actions.pauseAllDrones()` / `resumeAllDrones()` | 전체 비행을 일시정지·재개합니다. |
| `droneIntegratedMonitoring.actions.setDronePathVisible('drone-01', false)` | 해당 드론의 누적 경로 표시를 바꿉니다. |
| `droneIntegratedMonitoring.actions.setDronePathStyle('drone-01', {width: 8, fadeEnabled: false})` / `resetDronePathStyle('drone-01')` | 해당 드론의 누적 경로 표현(`color`·`opacity`·`width`·`fadeEnabled`·`maxDistance`·`widthFade`·`alphaFade` 중 일부)을 바꾸거나 기본값으로 되돌립니다. `color: null`은 색 재정의를 해제해 드론·그룹 색으로 돌아갑니다. 현재 값은 `getDroneSnapshot().pathStyle`로 확인합니다. |
| `droneIntegratedMonitoring.actions.setDroneFrustumVisible('drone-01', true)` | 해당 드론의 촬영 영역 표시를 켜거나 끕니다. 켜면 `UFrustum`과 지면 투영 Helper를 만들고 끄면 `dispose()`합니다. 설정은 유지됩니다. |
| `droneIntegratedMonitoring.actions.setDroneFrustumSettings('drone-01', {fov: 60, pitch: 20, fillColor: '#ff0000'})` / `resetDroneFrustumSettings('drone-01')` | 해당 드론의 촬영 영역 설정(`CONFIG.frustum.defaults`와 같은 키)을 바꾸거나 기본값으로 되돌립니다. 표시 중이면 즉시 반영됩니다. 현재 값과 표시·생성 여부는 `getDroneSnapshot().frustum`으로 확인합니다. |
| `droneIntegratedMonitoring.actions.setHeightLegendVisible(true)` / `setContourVisible(true)` | 고도 범례·등고선 후처리 표시를 켜거나 끕니다. 켤 때 현재 스타일을 먼저 분석 객체에 전달합니다. |
| `droneIntegratedMonitoring.actions.setLegendMode('mix')` / `updateLegendItem(1, {color: '#00ff00', opacity: 0.7})` / `addLegendItem()` / `removeLastLegendItem()` | 범례 색 선택 방식과 항목(순번은 고도 오름차순)을 바꾸고 항목을 추가·제거합니다. |
| `droneIntegratedMonitoring.actions.updateContourOptions({width: 4, fadeStart: 1000, fadeEnd: 50000, opacity: 0.9})` / `updateContourItem(0, {interval: 10})` / `addContourItem()` / `removeLastContourItem()` | 등고선 선 두께·감쇠 거리·투명도와 구간을 바꾸고 구간을 추가·제거합니다. 현재 설정은 `getHeightLegendSnapshot()`으로 확인합니다. |
| `droneIntegratedMonitoring.actions.setDroneBrightness('drone-01', 1.5)` / `setDroneContrast('drone-01', 0.8)` / `resetDroneAppearance('drone-01')` | 드론 모델의 밝기·대비 배율(0~3)을 바꾸거나 1로 되돌립니다. 현재 값은 `getDroneSnapshot().appearance`로 확인합니다. |
| `droneIntegratedMonitoring.actions.setDroneDurationMs('drone-01', 1000)` / `resetDroneSettings('drone-01')` | 해당 드론의 이동 보간 시간(0~1000ms)을 바꾸거나 밝기·대비와 함께 그 드론의 설정을 기본값으로 되돌립니다. 현재 값은 `getDroneSnapshot().durationMs`로 확인합니다. |
| `droneIntegratedMonitoring.actions.setActiveTab('path')` | 상세 설정의 활성 탭을 바꿉니다. `'basic'`(기본 정보), `'settings'`(드론 설정), `'path'`(비행 경로), `'frustum'`(촬영 영역) 중 하나입니다. |
| `droneIntegratedMonitoring.actions.toggleDebugView()` / `setDebugViewVisible(true)` | 엔진 디버그 UI(Development Tools)를 만들거나(`createDebugCanvas`) 제거합니다(`removeDebugCanvas`). `getDebugViewSnapshot()`으로 표시 여부와 엔진 패널 객체 존재를 확인합니다. |
| `droneIntegratedMonitoring.actions.setViewMode('2d')` | 보기 모드를 바꿉니다(`'2d'`: 직교 카메라 + TopView 고정, `'3d'`: 원근 카메라 + 기울인 시점). `getViewModeSnapshot()`으로 현재 모드와 엔진 카메라 타입을 확인합니다. |
| `droneIntegratedMonitoring.actions.setTerrainHeightScale(2)` | 켜져 있는 고도 레이어에 지형 고도 배율(0.1~10)을 적용합니다. `getTerrainSnapshot()`으로 현재 배율과 적용 대상 레이어 이름·배율을 확인합니다. |
| `droneIntegratedMonitoring.actions.commandDroneToCoordinate('drone-01', 'webmercator', 14242939.229, 4487893.182)` | 좌표계(`'wgs84'` 또는 `'webmercator'`)와 X·Y로 이동 명령을 내립니다. 위경도로 바꿔 `commandDroneTo()`를 호출하며 범위를 벗어나면 false를 반환합니다. |
| `droneIntegratedMonitoring.coords` | 좌표계 변환. `systems`(좌표계 목록), `lonLatToWebMercator(경도, 위도)`, `webMercatorToLonLat(x, y)`, `toLonLat(system, x, y)`를 제공합니다. |
| `droneIntegratedMonitoring.actions.showTerrainStamp({texture, x, y, rotationDeg, aspectRatio})` / `clearTerrainStamp()` | 이미지 URL(data URL)을 중심 위경도·정북 기준 회전으로 지면에 출력하거나 제거합니다. 현재 출력 정보는 `state.terrainStamp`, 엔진 객체는 `getTerrainStamp()`로 확인합니다. |
| `droneIntegratedMonitoring.getSummary()` | 전체·비행 중·Instance 드론 수와 레이어 생성 모드를 반환합니다. |
| `droneIntegratedMonitoring.getDroneSnapshot('drone-01')` | 실제 위치·비행 상태·Instance 적용·경로 상태를 반환합니다. |

경로 객체는 생성 시점에 따라 바뀔 수 있으므로 별도 전역 상태로 보관하지 않고 항상 `component.getCumulativePath()`로 조회합니다.

## 고객 검수 순서

1. **초기 실행**: Vworld 항공영상과 지형 고도, 드론 8대(`그룹1`·`그룹2`에 3대씩 편성, 개별 2대)와 트리 목록, 두 그룹의 형상 가시화(경계 입체)가 켜져 있는지, 자동 비행과 누적 경로 출력을 확인합니다. 오른쪽 위 `2D ▢ 3D` 스위치를 누르면 손잡이가 움직이며 직교 카메라·TopView로, 다시 누르면 원근 카메라·기울인 시점으로 돌아오는지 확인합니다. 오른쪽 위 지도 도구의 **ⓘ** 버튼으로 실행 환경 팝업을 열어 WebGL 정보를 확인합니다. 오른쪽 위 **성능 확인** 버튼을 누르면 지도 도구 아래에 엔진 `Development Tools` 패널(FPS·메모리)이 열리고, 오른쪽 패널을 열어도 겹치지 않으며, 다시 누르면 사라지는지 확인합니다.
2. **WebGL 2.0 확인**: 실행 환경 팝업의 `WebGL 2.0 사용`이 `사용`인지, WebGL 버전·GLSL 버전·Renderer 정보가 실제 실행 환경 값인지 확인합니다.
3. **Instance Rendering 확인**: 실행 환경 팝업의 `Instance 생성 모드`가 `Instance 모드`인지, 기본 정보 탭의 `Instance 적용`이 `적용`인지, `Instance 드론 수`가 지도상의 드론 수와 같은지 확인합니다.
4. **드론 추가·삭제**: 8대에서 한 대 추가해 9대가 되고 새 드론도 비행하며 경로를 그리는지, 선택한 드론 삭제 후 8대가 되고 삭제한 드론의 경로가 함께 제거되며 남은 드론의 비행과 경로가 유지되는지 확인합니다.
5. **드론 선택·탭 전환**: 목록에서 드론을 누르거나 지도에서 드론 근처를 클릭하면 왼쪽 상세 설정 창이 그 드론의 실제 위치와 상태로 바뀌고 드론 위에 드론 이름·고도 POI 라벨이 드론보다 살짝 위에서 따라다니는지, 선택된 드론을 목록에서 다시 누르면 해제되고 창이 닫히는지, Space 키를 누른 채 드래그하면 상자 안의 드론이 다중 선택되고 창은 열리지 않는지, **드론 위치로 카메라 이동**으로 카메라가 그 드론을 바라보는지, 기본 정보·드론 설정·비행 경로 탭 전환이 되는지, 밝기·대비·이동 보간 시간이 선택 드론에만 적용되고 드론별 값이 유지되는지, 촬영 영역 탭에서 **촬영 영역 표시**를 켜면 드론 앞 아래로 촬영 영역과 지면 영역이 그려져 드론을 따라 움직이고 FOV·Far·Pitch와 Helper 표현·품질 값이 즉시 반영되며 끄면 사라지는지, 코드 편집 패널을 열었을 때 창 위치가 함께 옮겨지는지 확인합니다.
8. **그룹·대형**: 그룹을 추가하면 기존 드론 선택이 해제되고 그룹 상세 설정 창이 열리는지, 드론을 끌어 넣어 트리로 표시되는지, 드론이 든 그룹을 누르면 리더 한 대만 선택되고 다시 누르면 해제되는지, 그룹 이름 변경·× 제외·그룹 밖으로 끌어내기가 되는지, 드론을 넣으면 첫 드론이 리더(★)가 되고 다음 드론이 `편대 합류 중`으로 리더 위치로 이동하며 리더가 `합류 대기 중`으로 합류점 주위를 회전 비행하는지, 합류 후 `팔로우 이동 중`으로 리더를 따라가고 리더가 자기 길로 돌아가는지, 합류·재합류 중 드론에서 합류점까지 연한 화살표가 그려지다 합류 완료 시 사라지는지, 새 그룹의 형상 가시화가 기본으로 켜져 있는지, 이 상태가 목록·그룹 창·드론 위 POI에 표시되는지, 리더를 빼면 다음 드론이 리더가 되는지, 수직선·수평선·V 대형에서 팔로우 드론이 슬롯을 따라가는지, **그룹 형상 가시화**로 그룹 색 경계 입체·점선 외곽선이 그려지고 드론을 따라 갱신되며 드론을 넣고 빼면 범위가 바뀌는지, 그룹 삭제 시 드론이 목록으로 돌아오는지 확인합니다.
9. **우클릭 이동**: 드론을 선택하고 지도를 우클릭하면 드론 색의 반투명 화살표가 그려지고 드론이 곧장 꺾이지 않고 선회하며 그 지점으로 이동하는지, 화살표가 드론을 따라 줄어들다 도착 시 사라지는지, 이동 중 다른 곳을 우클릭하면 새 목표로 선회하는지, 상세 설정 창의 좌표 입력(위경도·WebMercator)으로 **이동 명령**을 내리면 같은 이동이 시작되고 범위 밖 좌표는 안내만 나오는지, 합류 중·합류 대기 중인 드론에 명령하면 명령이 우선하고 끝난 뒤 합류·대기를 이어가는지, 버튼에 포커스가 있어도 Space 키가 버튼을 누르지 않고 박스 선택으로만 동작하는지 확인합니다.
10. **3D 도형**: 오른쪽 레일의 **도형** 버튼으로 드론 패널 대신 3D 객체 그리기 패널이 열리는지, 종류를 고르고 **그리기 시작**을 누르면 토스트 안내와 함께 지도 클릭으로 도형이 만들어져 목록에 추가되고 **그리기 종료**로 끝나는지, 목록의 도형을 누르면 왼쪽 3D 도형 상세 설정 창이 열리고 드론·그룹 선택이 해제되는지, 이름·표시·스타일 변경(스타일 폼과 JSON 영역의 **JSON 적용** 모두)과 도형 삭제·JSON 생성이 동작하는지, JSON 형식·값 오류가 결과 문구로 안내되는지, **드론** 버튼으로 돌아가면 지도 클릭이 다시 드론 선택으로 돌아오는지 확인합니다.
11. **도구·설정**: 레일의 **도구**·**설정** 버튼이 **도형** 아래에 있고 누르면 열려 있던 패널과 교체되는지, 두 패널의 구획이 제목만 보이게 접혀 있다가 제목을 누르면 펼쳐지고 다시 누르면 접히는지, 도구 패널의 좌표계 변환에서 X·Y를 넣고 **변환하기**를 누르면 결과가 표시되고 **⇄**로 입력·출력 좌표계가 바뀌며 결과가 새 입력으로 들어가는지, **초기화**로 처음 상태가 되는지, 범위 밖 값은 안내가 나오는지, 이미지 출력에서 업로드한 이미지가 미리보기에 보이고 좌표·회전을 넣어 **출력**하면 지면에 그 방향으로 그려지며 다시 출력하면 교체되고 **초기화**로 지워지는지, 설정 패널의 지형 고도 배율 기본값이 1인지, 값을 바꾸면 켜져 있는 지형의 높낮이가 바로 바뀌고 상태 줄의 적용 레이어 수가 맞는지, 지형 레이어를 끄면 적용 대상이 없다고 안내하는지 확인합니다.
12. **고도 범례**: 레일의 **고도 범례** 버튼이 **지형** 아래·**드론** 위에 있고 누르면 고도 범례 패널이 열리는지, `고도 범례 가시화`를 켜면 지형·드론이 고도별 색으로 채워지고 범례 편집 카드가 나타나는지, 색상·투명도·band/mix·**+**/**−**가 즉시 반영되는지, `등고선 가시화`를 켜면 등고선이 그려지고 선 두께·감쇠 거리·투명도·구간 편집이 즉시 반영되는지, 가시화를 끄면 후처리가 꺼지고 편집 카드가 숨겨지는지 확인합니다.
6. **누적 비행경로**: 시간이 지나면서 경로가 이어지는지, 드론별 경로가 독립적으로 표시되는지, 선택한 드론의 경로 표시만 변경되는지, 다시 켠 뒤 정상 표시되는지 확인합니다. 비행 경로 탭의 누적 경로 표현에서 색상·폭·투명도를 바꾸면 선택한 드론의 경로만 즉시 바뀌는지, `오래된 경로 Fade`를 끄면 거리·비율 슬라이더가 잠기고 전체 경로가 같은 형태로 보이는지, 최대 표시 거리를 줄이면 오래된 끝부분이 사라지는지, **경로 표현 기본값으로 되돌리기**가 되는지 확인합니다.
7. **일시정지·재개**: 일시정지 시 실제 이동이 멈추고 기존 경로가 유지되는지, 재개하면 이동과 경로 출력이 이어지는지 확인합니다.

이 예제는 검수 결과를 자동으로 판정하거나 `검수 통과`를 표시하지 않습니다. 각 항목은 검수자가 화면에서 직접 확인합니다.

## 캡처 안내

고객 보고서용 화면 캡처는 사용자가 직접 수행합니다. 다음 화면을 권장합니다.

- 실행 환경 팝업의 실제 WebGL 정보와 드론이 함께 보이는 초기 화면
- 실행 환경 팝업의 `Instance 생성 모드`·`Instance 드론 수`와 드론 목록이 함께 보이는 화면
- 드론 추가 전후, 드론 삭제 전후 화면 (목록 수량과 지도의 드론·경로 수 비교)
- 서로 다른 시점의 드론 위치와 누적 비행경로 화면 (경로가 이어지는 모습)

## API Help

- 실행 환경 팝업(지도 도구의 **ⓘ** 버튼)의 WebGL 항목은 실제 컨텍스트를 읽는 main 코드를, Instance 항목은 현재 레이어 모드와 Instance 드론 수를 함께 보여 줍니다.
- 지도 도구의 2D/3D 스위치와 성능 확인 버튼은 도움말 대상이 아니며, 호출하는 엔진 API는 위 `2D/3D 모드 전환`·`성능 확인(엔진 디버그 UI)` 코드 절에 있습니다.
- 드론 목록 아래의 박스 선택 안내 문구는 엔진 `U3dSelect` 박스 모드를 만들고 `end` 이벤트를 받는 main 코드를 보여 줍니다.
- 상세 설정 창의 우클릭 안내 문구는 선회 제한 이동(`steering.steerToward()`)을 비행 상태에 반영하는 main 코드와, 선택한 드론에 같은 명령을 내리는 전역 조작 호출을 보여 줍니다.
- **드론 추가**는 다음 드론 ID로 만들 `addPosition()` 호출을, **드론 삭제**는 현재 선택한 드론의 `removeComponentByName()` 호출을 보여 줍니다.
- 드론 목록 상자는 지도 클릭 선택 코드와 현재 선택 상태를, **드론 위치로 카메라 이동**은 선택한 드론의 현재 좌표를 넣은 `setCameraGeographicPosition()` 호출을 보여 줍니다.
- **전체 비행 일시정지**·**재개**는 `movePause()`·`moveResume()`을 사용하는 실제 main 코드를 보여 줍니다.
- `비행 경로 표시` 체크박스는 선택한 드론의 현재 설정으로 `drawCumulativePath`와 `showCumulativeRoute()`·`hideCumulativeRoute()` 호출을 보여 줍니다.
- 비행 경로 탭의 누적 경로 표현 항목은 색상·투명도·폭(`path.style`)과 Fade 정책(`path.fade`)으로 나뉘어 선택한 드론의 현재 값으로 `setCumulativePathStyle()` 호출을 보여 줍니다.
- 촬영 영역 탭은 표시 체크박스(`frustum.helper-create`), Frustum 투영값(`frustum.camera-info`)·자세(`frustum.rotation`), Helper 품질/안정화(`frustum.helper-quality`), 선 표현(`frustum.helper-style`)·채움 표현(`frustum.helper-fill`)으로 나뉘어 선택한 드론의 현재 값으로 `UFrustum`·Helper API 호출을 보여 줍니다.
- 설정 패널의 `지형 고도 배율` 입력은 켜져 있는 고도 레이어에 `setHeightScale()`을 호출하는 main 코드와 현재 배율·적용 대상 레이어를 보여 줍니다.
- 고도 범례 패널은 가시화 체크박스(`legend.visibility`·`contour.visibility`), band/mix(`legend.mode`), 범례 행(`legend.style`)과 **+**/**−**(`legend.items`), 등고선 두께·감쇠 거리·투명도(`contour.width`·`contour.fade`·`contour.opacity`), 구간 행(`contour.style`)과 **+**/**−**(`contour.items`)로 나뉘어 현재 설정값으로 `UAnalyHeight`·`UAnalyContour` API 호출을 보여 줍니다.
- 도구 패널의 좌표계 변환 구획은 `geographicToVector3()`·`vector3ToGeoGraphic()`으로 변환하는 main 코드와 선택 드론 위치의 변환 예를, 상세 설정 창의 좌표 입력 이동 폼은 우클릭 이동과 같은 명령 코드를 보여 줍니다.
- 도구 패널의 이미지 출력 구획은 `UTerrainStamp`를 만들어 `setApp()`·`setVisible()`하는 main 코드와 현재 출력 중인 이미지 정보를 보여 줍니다.
- 드론 설정 탭의 밝기·대비·이동 보간 시간 슬라이더는 `setBrightness()`·`setContrast()`·`moveSmoothly({durationMs})`를 사용하는 main 코드와 선택한 드론의 현재 값을 보여 줍니다.

### 편대 개선 확인 항목

- 이름·고도 POI와 상태 POI가 별도로 보이며, 선택 해제 후에도 합류·명령 상태가 남는지 확인합니다.
- 그룹 선택은 리더 한 대만 대상으로 하고 리더 교체 시 선택이 승계되는지 확인합니다.
- 최초 합류와 대형 변경 시 드론이 급히 새 자리로 튀지 않고 속도·방향을 맞추는지 확인합니다.
- 팔로우 드론에 이동 명령을 내리고 완료 후 `재합류 비행중`으로 돌아오는 동안 본대가 계속 비행하는지 확인합니다.
- 재합류 도중 명령을 다시 내리거나 그룹에서 빼도 명령 우선·합류 취소가 올바른지 확인합니다.
- 드론을 여러 대 추가해 기본 분산·수직선·수평선·V 대형 모두 서로 다른 자리를 유지하는지 확인합니다.
