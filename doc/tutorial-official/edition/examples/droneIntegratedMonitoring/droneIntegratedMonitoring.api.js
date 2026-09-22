/**
 * 드론 통합 모니터링 예제의 API Help Registry입니다.
 * 화면의 data-api-help Key와 main.js의 Source Token을 연결하고, 현재 예제 상태로 예시 코드를 만듭니다.
 * 이 파일은 상태를 읽기만 하며 API를 호출하지 않습니다.
 */
export const apiHelp = {
    'webgl.info': {
        title: 'U3dAPP.getRenderer().getContext()',
        description: '실제 지도 렌더러의 WebGL 컨텍스트에서 WebGL2RenderingContext 여부, VERSION, SHADING_LANGUAGE_VERSION, RENDERER를 읽습니다. 초기화 시 한 번 읽고 컨텍스트 손실·복원 시에만 다시 읽습니다.',
        mode: 'source',
        source: {sourceId: 'main', token: 'webgl.read'}
    },
    'instance.state': {
        title: 'U3dMultipleComponentLayer.isInstanced() / U3dComponentPosition.getInstanced()',
        description: '레이어의 기본 생성 모드와 이미 생성된 개별 드론의 Instance 적용 여부를 구분해 읽습니다. Instance 드론 수는 getInstanced()가 true인 드론 개수입니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'instance.state'},
        getCode(context, example) {
            const summary = example.getSummary();
            return [
                `droneLayer.isInstanced(); // ${formatBoolean(summary.layerInstanced)}`,
                `component.getInstanced(); // Instance 드론 ${summary.instancedCount}대 / 전체 ${summary.total}대`
            ].join('\n');
        }
    },
    'drone.add': {
        title: 'U3dMultipleComponentLayer.addPosition()',
        description: '등록한 모델 원본(object)으로 인스턴스 드론을 하나 만들고, drawCumulativePath: true로 이동 궤적을 누적합니다. 새 드론은 무작위 비행과 누적 경로 출력을 기본 적용합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'drone.create'},
        getCode(context, example) {
            const nextId = `drone-${String(Number(example.state.droneSequence) + 1).padStart(2, '0')}`;
            const model = example.config.model;
            return [
                'const component = droneLayer.addPosition({',
                `    name: '${nextId}',`,
                `    object: '${model.name}',`,
                '    geoPosition: {x: 경도, y: 위도, z: 고도(m)},',
                `    rotation: ${JSON.stringify(model.rotation)},`,
                `    scale: ${JSON.stringify(model.scale)},`,
                `    speed: ${example.config.flight.speedKmh},`,
                `    drawCumulativePath: ${example.config.path.drawByDefault}`,
                '});'
            ].join('\n');
        }
    },
    'drone.remove': {
        title: 'U3dMultipleComponentLayer.removeComponentByName()',
        description: '선택한 드론 컴포넌트를 레이어에서 제거합니다. 컴포넌트가 해제되면서 누적 경로도 함께 제거되고, 다른 드론이 공유하는 모델 원본은 레이어가 관리합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'drone.remove'},
        getCode(context, example) {
            const selectedId = example.state.selectedDroneId;
            if (!selectedId) return '// 선택한 드론이 없습니다.';
            return `droneLayer.removeComponentByName('${selectedId}');`;
        }
    },
    'drone.select': {
        title: "U3dAPP.on('click') + Vector3.project(camera)",
        description: '지도 클릭 위치에서 화면 거리(px)로 가장 가까운 드론을 골라 선택합니다. 목록에서 이미 선택한 드론을 다시 누르면 선택이 해제됩니다. 이름·현재 고도는 선택 라벨로, 이동 명령·편대 합류·재합류·합류 대기는 별도 상태 POI로 표시합니다. 그룹을 선택하면 리더 한 대만 선택합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'select.pick'},
        getCode(context, example) {
            const selectedId = example.state.selectedDroneId;
            return [
                `// 선택 허용 화면 거리: ${example.config.selection.pickRadiusPx}px`,
                selectedId
                    ? `droneIntegratedMonitoring.actions.toggleDroneSelection('${selectedId}'); // 다시 누르면 해제`
                    : '// 선택한 드론이 없습니다. 지도나 목록에서 드론을 선택하세요.'
            ].join('\n');
        }
    },
    'select.box': {
        title: "U3dSelect({mode: 'box', targetLayer}) + active() / deactive()",
        description: 'selectModel 예제와 같은 엔진 박스 선택 모드입니다. Space 키를 누르는 동안 active()로 켜서 지도 이동을 멈추고 드래그 상자를 그리며, 놓으면 상자 절두체 안의 드론 컴포넌트가 end 이벤트로 전달됩니다. 키를 놓으면 deactive()로 지도 이동을 되돌립니다.',
        mode: 'source',
        source: {sourceId: 'main', token: 'select.box'}
    },
    'camera.focus': {
        title: 'U3dAPP.setCameraGeographicPosition()',
        description: '선택한 드론의 현재 경도·위도·고도를 목표로 카메라를 이동합니다. 시야각·거리·이동 시간은 CONFIG.focusCamera 값입니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'camera.focus'},
        getCode(context, example) {
            const selectedId = example.state.selectedDroneId;
            const snapshot = selectedId ? example.getDroneSnapshot(selectedId) : undefined;
            if (!snapshot) return '// 선택한 드론이 없습니다.';
            const camera = example.config.focusCamera;
            return [
                'app.setCameraGeographicPosition(',
                `    ${formatCoordinate(snapshot.longitude)}, ${formatCoordinate(snapshot.latitude)}, ${formatCoordinate(snapshot.altitude, 1)},`,
                `    현재방위각, ${camera.tiltDeg}, ${camera.distanceMeters}, ${camera.durationMs}`,
                ');'
            ].join('\n');
        }
    },
    'flight.command': {
        title: "canvas 'contextmenu' + U3dAPP.intersectAtPixel(NDC, true) + steering.steerToward()",
        description: '우클릭 위치를 지형과 교차해 지리좌표로 바꾸고 선택한 드론에 이동 명령을 내립니다. 드론은 곧장 꺾지 않고 최대 선회율(CONFIG.command.maxTurnRateDegPerSec) 안에서 돌며 접근하고, 드론→목표 화살표(THREE.ArrowHelper)가 함께 갱신됩니다. 상세 설정 창의 좌표 입력(위경도 또는 WebMercator X·Y)은 위경도로 바꿔 같은 명령을 내립니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'command.steer'},
        getCode(context, example) {
            const selectedId = example.state.selectedDroneId;
            const snapshot = selectedId ? example.getDroneSnapshot(selectedId) : undefined;
            const command = snapshot?.command;
            const config = example.config.command;
            return [
                `// 최대 선회율 ${config.maxTurnRateDegPerSec}°/s, 도착 반경 ${config.arriveRadiusMeters}m`,
                `droneIntegratedMonitoring.actions.commandDroneToCoordinate('${selectedId ?? 'drone-01'}', 'webmercator', X, Y); // 좌표 입력 이동(위경도는 'wgs84')`,
                command
                    ? `droneIntegratedMonitoring.actions.commandDroneTo('${selectedId}', {x: ${formatCoordinate(command.target.x)}, y: ${formatCoordinate(command.target.y)}}); // 이동 중`
                    : selectedId
                        ? `droneIntegratedMonitoring.actions.commandDroneTo('${selectedId}', {x: 경도, y: 위도}); // 지도 우클릭과 같은 동작`
                        : '// 선택한 드론이 없습니다. 드론을 선택한 뒤 지도를 우클릭하세요.'
            ].join('\n');
        }
    },
    'flight.pause': {
        title: 'U3dComponentPosition.movePause()',
        description: '목표 위치 생성을 멈추고 진행 중인 moveSmoothly 애니메이션을 일시정지합니다. 이미 그려진 누적 경로는 그대로 유지됩니다.',
        mode: 'source',
        source: {sourceId: 'main', token: 'flight.pause'}
    },
    'flight.resume': {
        title: 'U3dComponentPosition.moveResume()',
        description: '일시정지한 이동 애니메이션을 기존 위치에서 이어서 재생합니다. 정지 시간만큼 방향·고도 목표 변경 시각을 미뤄 재개 직후 목표가 한꺼번에 바뀌지 않게 합니다.',
        mode: 'source',
        source: {sourceId: 'main', token: 'flight.resume'}
    },
    'group.boundary': {
        title: 'UGroupBoundaryHelper + U3dAPP.setRenderBefore()',
        description: '그룹 소속 드론 컴포넌트 배열을 대상으로 경계 helper를 만들어 외부 scene에 추가하고, 렌더 직전 콜백에서 update()해 드론 이동에 따라 경계 입체(상·측·하면)와 점선 외곽선을 다시 계산합니다. 소속이 바뀌면 setTarget()으로 대상을 교체합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'group.boundary'},
        getCode(context, example) {
            const groupId = example.state.selectedGroupId;
            const group = groupId ? example.groups.get(groupId) : undefined;
            const config = example.config.group.boundary;
            if (!group) return '// 그룹을 선택하면 그 그룹의 경계 helper 생성 코드를 보여 줍니다.';
            return [
                `const helper = new GeOnDT.Object.UGroupBoundaryHelper(memberComponents /* ${group.droneIds.length}대 */, {`,
                `    height: ${config.height}, bufferSize: ${config.bufferSize}, connectionDistance: ${config.connectionDistance},`,
                `    positionTolerance: ${config.positionTolerance}, surfaceMode: '${config.surfaceMode}',`,
                `    color: '${group.color}', opacity: ${config.opacity}, outline: {dashed: ${config.outline.dashed}, lineWidth: ${config.outline.lineWidth}}`,
                '});',
                'app.getExternalScene().add(helper);',
                `app.setRenderBefore('${'droneIntegratedMonitoring.groupBoundary'}', () => helper.update()); // 현재 ${group.shapeVisible ? '표시 중' : '숨김'}`
            ].join('\n');
        }
    },
    'flight.join': {
        title: 'steering.steerToward() → 자기 슬롯 접근 → 팔로우 이동',
        description: '최초 합류 동안 리더는 합류점을 중심으로 회전 비행합니다. 팔로우 드론은 300km/h로 접근하다 자기 슬롯 근처에서 속도·간격을 맞춥니다. 일반 비행과 이동 명령은 250km/h이며, 이동 명령을 마친 팔로우는 재합류 비행중으로 전환해 계속 비행하는 본대를 추격합니다. 재합류만으로 리더를 대기시키지 않습니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'flight.join'},
        getCode(context, example) {
            const groupId = example.state.selectedGroupId;
            const snapshot = groupId ? example.getGroupSnapshot(groupId) : undefined;
            const config = example.config.group.rendezvous;
            if (!snapshot) return '// 그룹을 선택하면 리더·합류 상태를 보여 줍니다.';
            const lines = [
                `// 리더: ${snapshot.leaderId ?? '없음'}, 합류 중: ${snapshot.joiningCount}대, 합류 완료 반경 ${config.arriveRadiusMeters}m, 대기 회전 반지름 ${config.orbitRadiusMeters}m`,
                ...snapshot.members.map(member => `// ${member.name}: ${member.flightStatus}`)
            ];
            if (snapshot.rendezvous) {
                lines.push(`// 합류점: {x: ${formatCoordinate(snapshot.rendezvous.x)}, y: ${formatCoordinate(snapshot.rendezvous.y)}, z: ${formatCoordinate(snapshot.rendezvous.z, 1)}}`);
            }
            lines.push(`droneIntegratedMonitoring.actions.addDronesToGroup('${snapshot.id}', ['drone-ID']); // 리더가 있으면 합류를 시작합니다.`);
            return lines.join('\n');
        }
    },
    'flight.follow': {
        title: '슬롯 이동 벡터 + 간격 보정 + 가속도 제한',
        description: '모든 대형에서 리더는 원점이고 팔로우 드론은 소속 순서에 따라 서로 다른 120m 간격 슬롯을 받습니다. 대형이 없어도 기본 분산 자리를 유지합니다. 슬롯 이동 벡터를 이어받고 가까워질수록 보정을 줄이며, 가속도 제한과 주변 드론 분리 보정으로 자연스럽게 정렬합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'flight.follow'},
        getCode(context, example) {
            const groupId = example.state.selectedGroupId;
            const snapshot = groupId ? example.getGroupSnapshot(groupId) : undefined;
            const formation = example.config.group.formation;
            if (!snapshot) return '// 그룹을 선택하면 현재 대형과 팔로우 상태를 보여 줍니다.';
            return [
                `// 대형: ${snapshot.formationLabel}, 슬롯 간격 ${formation.spacingMeters}m, 위치 보정 최대 속도 ${example.config.group.rendezvous.joinSpeedKmh}km/h`,
                `droneIntegratedMonitoring.actions.setGroupFormation('${snapshot.id}', 'v'); // 'none' | 'column' | 'row' | 'v'`
            ].join('\n');
        }
    },
    'shape.create': {
        title: 'U3dVectorLayer.addGeometry() + GeOnDT.geom 도형 생성자',
        description: '오른쪽 레일의 [도형] 버튼으로 3D 객체 그리기 패널을 열면 지도 클릭이 도형 그리기에 쓰입니다. 선택한 종류의 도형을 만들어 벡터 레이어에 추가하고 도형 목록에 등록합니다. 클릭 지점의 위경도가 도형 좌표입니다.',
        mode: 'hybrid',
        source: {sourceId: 'shapes', token: 'shape.create'},
        getCode(context, example) {
            const shapes = example.shapes;
            if (!shapes) return '// 3D 도형 모듈을 불러오지 못했습니다.';
            const entries = Object.entries(shapes.state.param || {}).filter(([, value]) => value !== undefined)
                .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
            return [
                `const geom = new GeOnDT.geom.U3d${shapes.state.geometryType}({${entries.join(', ')}, app});`,
                `shapeLayer.addGeometry(geom); // 레이어 '${shapes.layer.getName?.() || 'droneShapeLayer'}'`
            ].join('\n');
        }
    },
    'shape.style': {
        title: 'U3dGeometry.setParam()',
        description: '이미 그린 도형을 지우지 않고 색상·크기·투명도·외곽선 같은 스타일만 다시 적용합니다. 폼은 도형의 현재 getParam() 값으로 만들어지고, JSON 영역의 [JSON 적용]도 type·coord를 뺀 나머지 값을 같은 setParam()에 전달합니다(vectorLayer 예제의 [JSON으로 설정]과 같은 방식).',
        mode: 'hybrid',
        source: {sourceId: 'shapes', token: 'shape.style'},
        getCode(context, example) {
            const shapes = example.shapes;
            const snapshot = shapes?.state.selectedShapeId ? shapes.getShapeSnapshot(shapes.state.selectedShapeId) : undefined;
            if (!snapshot) return '// 목록에서 도형을 선택하면 그 도형의 스타일 코드를 보여 줍니다.';
            return `shape.geom.setParam(${JSON.stringify(snapshot.param)});\napp.drawFast();`;
        }
    },
    'shape.json': {
        title: 'U3dGeometryFactory.addJson()',
        description: 'type과 coord를 포함한 JSON을 그대로 도형으로 만들어 벡터 레이어에 추가합니다. 지도를 클릭하지 않고도 도형을 재현할 수 있고, 상세 설정 창 JSON 영역의 내용을 붙여 넣어 같은 도형을 다시 만들 수도 있습니다.',
        mode: 'hybrid',
        source: {sourceId: 'shapes', token: 'shape.json'},
        getCode(context, example) {
            const type = example.shapes?.state.geometryType || 'Box';
            return `GeOnDT.geom.U3dGeometryFactory.addJson({type: '${type}', coord: {x: 경도, y: 위도, z: 높이}, ...스타일}, shapeLayer);`;
        }
    },
    'shape.path': {
        title: 'U3dPathGeometry.draw()',
        description: '경로 도형의 그리기 모드를 켭니다. 지도 클릭이 경로 점으로 쌓이고 더블클릭하면 완성되며, 완성한 경로의 점을 클릭하면 높이 편집 오버레이가 열립니다.',
        mode: 'source',
        source: {sourceId: 'shapes', token: 'shape.path'}
    },
    'shape.gizmo': {
        title: "U3dAPP.getAnalysis('GizmoModel')",
        description: '기즈모 편집을 켜고 도형에 이동·회전·크기 기즈모를 붙입니다. 그리기 창의 기즈모 편집은 지도에서 클릭한 도형에, 상세 설정 창의 버튼은 선택한 도형에 바로 붙입니다.',
        mode: 'hybrid',
        source: {sourceId: 'shapes', token: 'shape.gizmo'},
        getCode(context, example) {
            const shapes = example.shapes;
            const gizmo = "const gizmo = app.getAnalysis('GizmoModel');";
            if (!shapes?.state.gizmoActive) return `${gizmo}\ngizmo.deactive();`;
            return `${gizmo}\ngizmo.active();\ngizmo.setMode('${shapes.state.gizmoMode}');\ngizmo.setObject(shape.geom);`;
        }
    },
    'shape.remove': {
        title: 'U3dVectorLayer.removeGeometry()',
        description: '선택한 도형을 벡터 레이어와 목록에서 제거합니다. 경로 도형은 편집 점과 경로 객체도 함께 정리합니다.',
        mode: 'source',
        source: {sourceId: 'shapes', token: 'shape.remove'}
    },
    'shape.export': {
        title: 'U3dGeometry.getPositions() / getParam()',
        description: '모든 도형을 type·coord·스타일을 담은 JSON으로 바꿔 브라우저 콘솔에 출력합니다. 출력한 JSON은 [JSON으로 생성]에 다시 넣을 수 있습니다.',
        mode: 'source',
        source: {sourceId: 'shapes', token: 'shape.export'}
    },
    'shape.clear': {
        title: 'U3dVectorLayer.clear()',
        description: '그린 도형을 모두 지우고 목록을 비웁니다.',
        mode: 'source',
        source: {sourceId: 'shapes', token: 'shape.clear'}
    },
    'terrain.heightScale': {
        title: 'U3dAPP.getHeightLayers() + U3dHeightLayer.setHeightScale()',
        description: '설정 패널의 지형 고도 배율을 바꾸면 켜져 있는(visible) 모든 고도 레이어에 setHeightScale()을 호출해 지형 메시의 z 배율을 바꿉니다. 엔진은 0.1 미만을 0.1로 보정하고, 이미 만들어진 타일과 이후 타일에 모두 적용됩니다. 지형 레이어는 공통 [지형] 패널이 켜고 끕니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'terrain.heightScale'},
        getCode(context, example) {
            const snapshot = example.getTerrainSnapshot();
            const names = snapshot.layerNames.filter(Boolean);
            return [
                `// 켜져 있는 고도 레이어 ${snapshot.visibleLayerCount}개${names.length > 0 ? ` (${names.join(', ')})` : ''}`,
                `droneIntegratedMonitoring.actions.setTerrainHeightScale(${snapshot.heightScale}); // 현재 배율`,
                'app.getHeightLayers().filter(layer => layer.getVisible()).forEach(layer => layer.setHeightScale(scale));'
            ].join('\n');
        }
    },
    'coords.convert': {
        title: 'U3dAPP.geographicToVector3() / vector3ToGeoGraphic()',
        description: '엔진 월드 좌표가 WebMercator(EPSG:3857, m)이므로 위경도→월드 변환 결과의 x·y가 WebMercator 좌표이고, 월드 좌표(Vector3)→위경도 변환이 역변환입니다. 도구 패널은 [변환하기]를 누를 때 이 두 함수로 결과를 계산하고, ⇄ 버튼으로 입력·출력 좌표계를 바꿉니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'coords.convert'},
        getCode(context, example) {
            const selectedId = example.state.selectedDroneId;
            const snapshot = selectedId ? example.getDroneSnapshot(selectedId) : undefined;
            const lon = Number.isFinite(snapshot?.longitude) ? snapshot.longitude : example.config.spawnCenter.x;
            const lat = Number.isFinite(snapshot?.latitude) ? snapshot.latitude : example.config.spawnCenter.y;
            const mercator = example.coords.lonLatToWebMercator(lon, lat);
            return [
                `// ${snapshot ? `선택 드론 ${snapshot.id}의 현재 위치` : '드론 출발 영역 중심'}`,
                `app.geographicToVector3({x: ${formatCoordinate(lon)}, y: ${formatCoordinate(lat)}, z: 0}); // → x: ${mercator ? mercator.x.toFixed(3) : '-'}, y: ${mercator ? mercator.y.toFixed(3) : '-'} (EPSG:3857, m)`,
                `app.vector3ToGeoGraphic(new THREE.Vector3(${mercator ? mercator.x.toFixed(3) : 'x'}, ${mercator ? mercator.y.toFixed(3) : 'y'}, 0)); // → 경도·위도`,
                `droneIntegratedMonitoring.coords.webMercatorToLonLat(x, y); // 도구 패널과 같은 역변환`
            ].join('\n');
        }
    },
    'drone.brightness': {
        title: 'U3dComponentPosition.setBrightness() / getBrightness()',
        description: '선택한 드론 모델의 밝기 배율을 절대값으로 적용합니다. 1이 원래 밝기, 0은 검정이며 1보다 크면 밝아집니다. 반복 호출해도 누적되지 않고, 인스턴스 컴포넌트와 표준 Three.js 재질을 지원하며 선택 강조가 끝나면 다시 적용됩니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'drone.brightness'},
        getCode(context, example) {
            const selectedId = example.state.selectedDroneId;
            const snapshot = selectedId ? example.getDroneSnapshot(selectedId) : undefined;
            if (!snapshot) return '// 선택한 드론이 없습니다.';
            const range = example.config.appearance.brightness;
            return [
                `const component = droneIntegratedMonitoring.drones.get('${selectedId}').component; // U3dComponentPosition`,
                `component.setBrightness(${snapshot.appearance.brightness.toFixed(2)}); // 현재 값. 범위 ${range.min}~${range.max}, 기본 ${range.defaultValue}`,
                `component.getBrightness(); // ${snapshot.appearance.brightness.toFixed(2)}`
            ].join('\n');
        }
    },
    'drone.contrast': {
        title: 'U3dComponentPosition.setContrast() / getContrast()',
        description: '선택한 드론 모델의 대비 배율을 절대값으로 적용합니다. 1이 원래 대비, 0은 중간 회색이며 밝기 적용 뒤 RGB 0.5를 기준으로 조절합니다. 투명도는 바꾸지 않고 밝기와 독립적으로 보존됩니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'drone.contrast'},
        getCode(context, example) {
            const selectedId = example.state.selectedDroneId;
            const snapshot = selectedId ? example.getDroneSnapshot(selectedId) : undefined;
            if (!snapshot) return '// 선택한 드론이 없습니다.';
            const range = example.config.appearance.contrast;
            return [
                `const component = droneIntegratedMonitoring.drones.get('${selectedId}').component; // U3dComponentPosition`,
                `component.setContrast(${snapshot.appearance.contrast.toFixed(2)}); // 현재 값. 범위 ${range.min}~${range.max}, 기본 ${range.defaultValue}`,
                `component.getContrast(); // ${snapshot.appearance.contrast.toFixed(2)}`
            ].join('\n');
        }
    },
    'drone.duration': {
        title: 'U3dComponentPosition.moveSmoothly({position, durationMs})',
        description: '선택한 드론의 이동 보간 시간을 설정합니다. 변경한 값은 다음 moveSmoothly 호출부터 적용되며, 값이 클수록 각 목표 위치까지 더 천천히 보간합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'flight.move'},
        getCode(context, example) {
            const selectedId = example.state.selectedDroneId;
            const snapshot = selectedId ? example.getDroneSnapshot(selectedId) : undefined;
            if (!snapshot) return '// 선택한 드론이 없습니다.';
            const range = example.config.flight.durationMs;
            return [
                `droneIntegratedMonitoring.actions.setDroneDurationMs('${selectedId}', ${snapshot.durationMs});`,
                `// 다음 moveSmoothly({position, durationMs: ${snapshot.durationMs}})부터 적용. 범위 ${range.min}~${range.max}ms, 기본 ${range.defaultValue}ms`
            ].join('\n');
        }
    },
    'terrain.stamp': {
        title: 'GeOnDT.terrain.UTerrainStamp({points, texture, textureFit}) + setApp() / setVisible()',
        description: 'animationComponents 예제와 같은 지형 도장(stamp)입니다. 업로드한 이미지를 data URL로 넘기고, 중심 좌표·정북 기준 회전으로 만든 네 모서리(월드 좌표, 왼쪽 위부터 시계 방향)에 contain 방식으로 매핑해 지형 타일 위에 그립니다. 초기화하면 setVisible(false)·dispose()로 제거합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'terrain.stamp'},
        getCode(context, example) {
            const current = example.state.terrainStamp;
            const config = example.config.stamp;
            return [
                current
                    ? `// 출력 중: ${current.name || '이미지'} · 중심 ${formatCoordinate(current.center.x)}, ${formatCoordinate(current.center.y)} · 회전 ${current.rotationDeg}° · ${current.widthMeters}m × ${Math.round(current.heightMeters)}m`
                    : `// 출력 중인 이미지가 없습니다. 폭 ${config.widthMeters}m, 높이는 이미지 비율로 정합니다.`,
                "droneIntegratedMonitoring.actions.showTerrainStamp({texture: dataUrl, x: 경도, y: 위도, rotationDeg: 0, aspectRatio: 가로/세로});",
                'droneIntegratedMonitoring.actions.clearTerrainStamp();'
            ].join('\n');
        }
    },
    'path.visible': {
        title: 'U3dComponentPosition.drawCumulativePath / showCumulativeRoute() / hideCumulativeRoute()',
        description: 'drawCumulativePath는 이후 이동에서 경로를 생성할지 정하고, 이미 만들어진 경로의 표시는 showCumulativeRoute()·hideCumulativeRoute()로 바꿉니다. 선택한 드론에만 적용됩니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'path.visibility'},
        getCode(context, example) {
            const selectedId = example.state.selectedDroneId;
            const drone = selectedId ? example.drones.get(selectedId) : undefined;
            if (!drone) return '// 선택한 드론이 없습니다.';
            const visible = drone.path.visible === true;
            return [
                `const component = droneLayer.getComponentByName('${selectedId}');`,
                `component.drawCumulativePath = ${visible};`,
                visible ? 'component.showCumulativeRoute();' : 'component.hideCumulativeRoute();'
            ].join('\n');
        }
    },
    'path.style': {
        title: 'U3dComponentPosition.setCumulativePathStyle({color, opacity, width})',
        description: 'animationComponents 예제와 같은 누적 경로 표현입니다. 선택한 드론의 경로 색상·투명도·폭을 즉시 바꾸며, 경로 객체가 아직 없으면 값이 보관되어 생성 시 적용됩니다. 색을 고르지 않으면 드론 색(그룹 소속이면 그룹 색)을 따릅니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'path.style'},
        getCode(context, example) {
            const selectedId = example.state.selectedDroneId;
            const snapshot = selectedId ? example.getDroneSnapshot(selectedId) : undefined;
            if (!snapshot) return '// 선택한 드론이 없습니다.';
            const style = snapshot.pathStyle;
            return [
                `const component = droneIntegratedMonitoring.drones.get('${selectedId}').component; // U3dComponentPosition`,
                'component.setCumulativePathStyle({',
                `    color: '${String(style.color).toUpperCase()}',${style.colorOverridden ? '' : '   // 드론·그룹 색(자동)'}`,
                `    opacity: ${formatStyleNumber(style.opacity)},`,
                `    width: ${formatStyleNumber(style.width)}`,
                '});'
            ].join('\n');
        }
    },
    'path.fade': {
        title: 'U3dComponentPosition.setCumulativePathStyle({tailPolicy}) Fade 정책',
        description: '오래된 누적 경로의 최대 표시 거리(m)와 폭·투명도 Fade 비율을 tailPolicy로 설정합니다. Fade를 끄면 maxDistance를 Infinity, 비율을 0으로 전달해 경로 캐시를 지우지 않고 전체 경로를 같은 형태로 그립니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'path.style'},
        getCode(context, example) {
            const selectedId = example.state.selectedDroneId;
            const snapshot = selectedId ? example.getDroneSnapshot(selectedId) : undefined;
            if (!snapshot) return '// 선택한 드론이 없습니다.';
            const style = snapshot.pathStyle;
            const fade = style.fadeEnabled === true;
            return [
                `const component = droneIntegratedMonitoring.drones.get('${selectedId}').component; // U3dComponentPosition`,
                'component.setCumulativePathStyle({',
                '    tailPolicy: {',
                `        maxDistance: ${fade ? formatStyleNumber(style.maxDistance) : 'Infinity'},${fade ? '   // 최신 위치 기준 표시 거리(m)' : '   // Fade 사용 안 함: 전체 경로를 같은 형태로 표시'}`,
                `        widthFade: ${fade ? formatStyleNumber(style.widthFade) : 0},`,
                `        alphaFade: ${fade ? formatStyleNumber(style.alphaFade) : 0}`,
                '    }',
                '});'
            ].join('\n');
        }
    },
    'frustum.helper-create': {
        title: 'GeOnDT.UFrustum + U3dAPP.setFrustumTerrainProjectionHelper()',
        description: 'animationComponents 예제와 같은 촬영 영역 표시입니다. 선택한 드론에 UFrustum을 장착(setTarget)하고 terrain: true 지면 투영 Helper를 외부 scene에 추가하며, 렌더 직전마다 updateTarget()으로 드론을 따라갑니다. 끄면 helper.dispose()로 제거하고 설정은 드론별로 유지합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'frustum.helper-create'},
        getCode(context, example) {
            const selectedId = example.state.selectedDroneId;
            const snapshot = selectedId ? example.getDroneSnapshot(selectedId) : undefined;
            if (!snapshot) return '// 선택한 드론이 없습니다.';
            const frustum = snapshot.frustum;
            return [
                `droneIntegratedMonitoring.actions.setDroneFrustumVisible('${selectedId}', ${!frustum.visible});   // 현재 ${frustum.visible ? '표시 중' : '숨김'}`,
                '// 켜면: const frustum = new GeOnDT.UFrustum(); frustum.setTarget(component);',
                `//       app.setFrustumTerrainProjectionHelper(frustum, {terrain: true, color: '${String(frustum.lineColor).toUpperCase()}', fill: {enabled: true, color: '${String(frustum.fillColor).toUpperCase()}'}})`
            ].join('\n');
        }
    },
    'frustum.camera-info': {
        title: 'UFrustum.setCameraInfo()',
        description: '카메라의 FOV·Aspect·Near·Far로 Frustum 투영 영역을 만듭니다. fovX/fovY를 0으로 두어 fov·aspect 경로를 쓰고, 값을 바꾼 뒤 updateTarget()으로 드론 위치에 다시 배치합니다. Far가 클수록 먼 지면까지 포함하지만 경계 변화가 커집니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'frustum.camera-info'},
        getCode(context, example) {
            const selectedId = example.state.selectedDroneId;
            const snapshot = selectedId ? example.getDroneSnapshot(selectedId) : undefined;
            if (!snapshot) return '// 선택한 드론이 없습니다.';
            const frustum = snapshot.frustum;
            return [
                'frustum.setCameraInfo({',
                `    fov: ${formatStyleNumber(frustum.fov)},`,
                `    aspect: ${formatStyleNumber(frustum.aspect)},`,
                `    near: ${formatStyleNumber(frustum.near)},`,
                `    far: ${formatStyleNumber(frustum.far)}`,
                '});',
                'frustum.updateTarget();'
            ].join('\n');
        }
    },
    'frustum.rotation': {
        title: 'UFrustum.setPitchYawRoll()',
        description: '드론 기준 카메라 자세를 pitch·yaw·roll(degree) 순서로 한 번에 적용합니다. pitch·yaw는 시선 방향만 정하고 roll은 시선축 주위 회전이며, target이 있으면 즉시 행렬을 갱신합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'frustum.rotation'},
        getCode(context, example) {
            const selectedId = example.state.selectedDroneId;
            const snapshot = selectedId ? example.getDroneSnapshot(selectedId) : undefined;
            if (!snapshot) return '// 선택한 드론이 없습니다.';
            const frustum = snapshot.frustum;
            return `frustum.setPitchYawRoll(${formatStyleNumber(frustum.pitch)}, ${formatStyleNumber(frustum.yaw)}, ${formatStyleNumber(frustum.roll)});   // pitch, yaw, roll (degree)`;
        }
    },
    'frustum.helper-quality': {
        title: 'UFrustumTerrainProjectionHelper 품질·안정화 API',
        description: '지면 접촉 정밀도·확인점 수·외곽선 정제와 시간 안정화 값을 Helper 공개 setter로 바꿉니다. 정밀도 값은 현재 자세의 지면 형상을 즉시 다시 계산하고, 안정화 값은 클수록 부드럽지만 실제 변화의 반영이 늦어질 수 있습니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'frustum.helper-quality'},
        getCode(context, example) {
            const selectedId = example.state.selectedDroneId;
            const snapshot = selectedId ? example.getDroneSnapshot(selectedId) : undefined;
            if (!snapshot) return '// 선택한 드론이 없습니다.';
            const frustum = snapshot.frustum;
            return [
                `helper.setUpdateIntervalMs(${formatStyleNumber(frustum.updateIntervalMs)});`,
                `helper.setIntersectionSteps(${formatStyleNumber(frustum.intersectionSteps)});`,
                `helper.setTerrainStampGridSize(${formatStyleNumber(frustum.terrainStampGridSize)});`,
                `helper.setTerrainBoundaryRefinementSteps(${formatStyleNumber(frustum.terrainBoundaryRefinementSteps)});`,
                `helper.setTerrainIntersectionStabilization(${frustum.terrainIntersectionStabilization === true});`,
                `helper.setTerrainIntersectionMedianWindow(${formatStyleNumber(frustum.terrainIntersectionMedianWindow)});`,
                `helper.setTerrainIntersectionHalfLifeMs(${formatStyleNumber(frustum.terrainIntersectionHalfLifeMs)});`,
                `helper.setTerrainIntersectionMaxLagDistance(${formatStyleNumber(frustum.terrainIntersectionMaxLagDistance)});`,
                `helper.setTerrainIntersectionHitPersistenceMs(${formatStyleNumber(frustum.terrainIntersectionHitPersistenceMs)});`,
                `helper.setTemporalHalfLifeMs(${formatStyleNumber(frustum.temporalHalfLifeMs)});`,
                `helper.setTemporalHysteresisDistance(${formatStyleNumber(frustum.temporalHysteresisDistance)});`,
                `helper.setTemporalFarSmoothingFactor(${formatStyleNumber(frustum.temporalFarSmoothingFactor)});`,
                `helper.setTemporalSnapGapMs(${formatStyleNumber(frustum.temporalSnapGapMs)});`
            ].join('\n');
        }
    },
    'frustum.helper-style': {
        title: 'UFrustumTerrainProjectionHelper.setColor() / setLineWidth() / setOpacity()',
        description: 'Helper 외곽선·옆면 선의 색상, 두께(px), 투명도를 현재 Helper에 즉시 반영합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'frustum.helper-style'},
        getCode(context, example) {
            const selectedId = example.state.selectedDroneId;
            const snapshot = selectedId ? example.getDroneSnapshot(selectedId) : undefined;
            if (!snapshot) return '// 선택한 드론이 없습니다.';
            const frustum = snapshot.frustum;
            return [
                `helper.setColor('${String(frustum.lineColor).toUpperCase()}');`,
                `helper.setLineWidth(${formatStyleNumber(frustum.lineWidth)});`,
                `helper.setOpacity(${formatStyleNumber(frustum.lineOpacity)});`
            ].join('\n');
        }
    },
    'frustum.helper-fill': {
        title: 'UFrustumTerrainProjectionHelper.setFillColor() / setFillOpacity() / setSideColor() / setSideOpacity()',
        description: '실제 촬영 지면 영역의 채움색·투명도와 지면 외곽을 near 경계와 잇는 옆면의 채움색·투명도를 현재 Helper에 즉시 반영합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'frustum.helper-fill'},
        getCode(context, example) {
            const selectedId = example.state.selectedDroneId;
            const snapshot = selectedId ? example.getDroneSnapshot(selectedId) : undefined;
            if (!snapshot) return '// 선택한 드론이 없습니다.';
            const frustum = snapshot.frustum;
            return [
                `helper.setFillColor('${String(frustum.fillColor).toUpperCase()}');`,
                `helper.setFillOpacity(${formatStyleNumber(frustum.fillOpacity)});`,
                `helper.setSideColor('${String(frustum.sideColor).toUpperCase()}');`,
                `helper.setSideOpacity(${formatStyleNumber(frustum.sideOpacity)});`
            ].join('\n');
        }
    },
    'legend.visibility': {
        title: "U3dAPP.getAnalysis('Height').setHeightVisible()",
        description: '고도 범례 후처리 pass의 표시 상태를 바꿉니다(예전 이름 drawHeight()). 켜기 전에 현재 범례 스타일을 setUserStyle()로 먼저 전달합니다. 고도 범례와 등고선은 같은 Height pass를 공유해, 한쪽을 끄면 다른 쪽이 쓰는 중인지 확인한 뒤 pass를 끕니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'analysis.visibility'},
        getCode(context, example) {
            const legend = example.getHeightLegendSnapshot();
            return [
                "const analysis = app.getAnalysis('Height');   // UAnalyHeight",
                `analysis.setHeightVisible(${legend.legendVisible === true});   // 현재 ${legend.legendVisible ? '표시 중' : '숨김'}`
            ].join('\n');
        }
    },
    'contour.visibility': {
        title: "U3dAPP.getAnalysis('Contour').drawHeight()",
        description: '등고선 후처리의 표시 상태를 바꿉니다. 켜기 전에 현재 등고선 스타일을 전달하며, 고도 범례와 같은 Height pass를 공유합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'analysis.visibility'},
        getCode(context, example) {
            const legend = example.getHeightLegendSnapshot();
            return [
                "const analysis = app.getAnalysis('Contour');   // UAnalyContour",
                `analysis.drawHeight(${legend.contourVisible === true});   // 현재 ${legend.contourVisible ? '표시 중' : '숨김'}`
            ].join('\n');
        }
    },
    'legend.mode': {
        title: 'UAnalyHeight.setUserStyle() · mode',
        description: 'band는 기준값 구간의 색을 그대로 사용하고, mix는 인접 기준값 색을 섞어 표현합니다. 설정 배열은 그대로 두고 shader의 색상 선택 방식만 바뀝니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'legend.style'},
        getCode(context, example) {
            const legend = example.getHeightLegendSnapshot();
            return `analysis.setUserStyle({mode: '${legend.legendMode}', ...heightColors});   // 'band' | 'mix'`;
        }
    },
    'legend.style': {
        title: 'UAnalyHeight.setUserStyle()',
        description: '고도 기준값별 RGBA 색상을 전달합니다. 숫자 키는 고도 기준값(m)이며 오름차순으로 해석되고, 첫 기준값보다 낮은 고도는 첫 색, 마지막보다 높은 고도는 마지막 색을 씁니다. 표시 중이면 즉시 반영됩니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'legend.style'},
        getCode(context, example) {
            const legend = example.getHeightLegendSnapshot();
            const entries = legend.legendItems.map(item => `    '${item.value}': '${formatRgba(item.color, item.opacity)}'`);
            return ['analysis.setUserStyle({', `    mode: '${legend.legendMode}',`, entries.join(',\n'), '});'].join('\n');
        }
    },
    'legend.items': {
        title: 'UAnalyHeight.setUserStyle() · 항목 추가와 제거',
        description: '가장 높은 기준값보다 100m 높은 항목을 추가하거나 마지막 항목을 제거한 뒤 스타일을 다시 전달합니다. 엔진은 안전한 shader 실행을 위해 항목 수를 제한합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'legend.items'},
        getCode(context, example) {
            const legend = example.getHeightLegendSnapshot();
            const values = legend.legendItems.map(item => item.value).join(', ');
            return `// 현재 고도 기준값 ${legend.legendItems.length}개(최대 ${example.config.heightLegend.maxLegendItems}개): [${values}]`;
        }
    },
    'contour.style': {
        title: 'UAnalyContour.setTopoStyle()',
        description: '고도 구간별 시작 고도(m), 선 간격(m), 선 색상을 배열로 전달합니다. 엔진이 시작 고도 순으로 정렬하고 간격이 0 이하인 항목은 버립니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'contour.style'},
        getCode(context, example) {
            const legend = example.getHeightLegendSnapshot();
            const entries = legend.contourItems.map(item => `    {height: ${formatStyleNumber(item.height)}, interval: ${formatStyleNumber(item.interval)}, color: '${item.color}'}`);
            return ['analysis.setTopoStyle([', entries.join(',\n'), ']);'].join('\n');
        }
    },
    'contour.width': {
        title: 'UAnalyContour.setTopoWidth()',
        description: '등고선의 선 두께(px)를 바꿉니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'contour.style'},
        getCode(context, example) {
            const legend = example.getHeightLegendSnapshot();
            return `analysis.setTopoWidth(${formatStyleNumber(legend.contourOptions.width)});`;
        }
    },
    'contour.fade': {
        title: 'UAnalyContour.setTopoFadeDistance()',
        description: '카메라와의 거리에 따라 등고선이 흐려지기 시작하는 거리와 완전히 사라지는 거리(m)를 지정합니다. 종료 거리는 시작 거리보다 커야 합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'contour.style'},
        getCode(context, example) {
            const legend = example.getHeightLegendSnapshot();
            return `analysis.setTopoFadeDistance(${formatStyleNumber(legend.contourOptions.fadeStart)}, ${formatStyleNumber(legend.contourOptions.fadeEnd)});`;
        }
    },
    'contour.opacity': {
        title: 'UAnalyContour.setTopoOpacity()',
        description: '등고선 전체의 불투명도를 0~1로 바꿉니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'contour.style'},
        getCode(context, example) {
            const legend = example.getHeightLegendSnapshot();
            return `analysis.setTopoOpacity(${formatStyleNumber(legend.contourOptions.opacity)});`;
        }
    },
    'contour.items': {
        title: 'UAnalyContour.setTopoStyle() · 구간 추가와 제거',
        description: '마지막 구간보다 100m 높은 등고선 구간을 추가하거나 마지막 구간을 제거한 뒤 스타일을 다시 전달합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'contour.items'},
        getCode(context, example) {
            const legend = example.getHeightLegendSnapshot();
            const heights = legend.contourItems.map(item => item.height).join(', ');
            return `// 현재 등고선 구간 ${legend.contourItems.length}개(최대 ${example.config.heightLegend.maxContourItems}개): [${heights}]`;
        }
    }
};

/**
 * 좌표 숫자를 코드에 표시할 문자열로 바꿉니다.
 * @param {unknown} value 원본 값
 * @param {number} [digits=6] 소수 자릿수
 * @returns {string} 숫자 문자열
 */
function formatCoordinate(value, digits = 6) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(digits) : '0';
}

/**
 * boolean 값을 코드 주석에 표시할 문장으로 바꿉니다.
 * @param {unknown} value 원본 값
 * @returns {string} 표시 문장
 */
function formatBoolean(value) {
    if (value === true) return 'true (Instance 모드)';
    if (value === false) return 'false (일반 모드)';
    return '레이어 없음';
}

/**
 * 누적 경로 표현 숫자를 코드에 표시할 문자열로 바꿉니다. 유한하지 않으면 0입니다.
 * @param {unknown} value 원본 값
 * @returns {string} 숫자 문자열(소수 3자리까지)
 */
function formatStyleNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? String(Math.round(number * 1000) / 1000) : '0';
}

/**
 * "#rrggbb" 색상과 투명도를 UAnalyHeight.setUserStyle()이 받는 RGBA 문자열로 바꿉니다.
 * @param {string} hex 색상 값
 * @param {number} opacity 0~1 범위의 투명도
 * @returns {string} "rgba(r,g,b, a)" 문자열
 */
function formatRgba(hex, opacity) {
    const value = parseInt(String(hex).replace('#', ''), 16);
    return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255}, ${formatStyleNumber(opacity)})`;
}
