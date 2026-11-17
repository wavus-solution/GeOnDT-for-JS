# U3dCustomModel 명세

> 상태: 구현 관찰 초안

## 1. 개요

다각형 바닥을 높이 방향으로 돌출한 사용자 모델을 만들고 색상·텍스처·변환·라벨·지형 위 높이를 제어한다. 모델은 UGroup의 첫 번째 UMesh를 기준으로 편집·직렬화되며, 면적과 층수 등 건축량을 함께 계산한다. 자동 스트리밍 재로딩 식별자를 만들지 않고 메시의 `getUid()` 결과를 사용한다.

## 3. 정규 자연어 수도코드

```spec
U3dCustomModel extends UEventDispatcher 클래스 정의
    속성 — 모델 구성과 표시
        _name: string — 옵션 이름 또는 Guid 결과
        _type: string = 'U3dCustomModel'
        _isInitialized: boolean = false
        _version: string = '1.2'
        _modeltype: string = UDEF.CUSTOM_MODEL.TYPE.EXTRUDE
        _shape: THREE.Shape — 입력 돌출 윤곽
        _drawArg: UDrawArg — 장면·지형·좌표 변환 접근
        _object: UGroup — 생성 메시를 보관하는 그룹
        _position: THREE.Vector3 — 기하 중심과 위치 보조값
        _boundingBox: THREE.Box3 | undefined
        _bbox: THREE.Box3 | undefined
        _extrudeHeight: number — Number(opt.extrudeheight)
        _zOffset: number — 지면에서 띄우는 높이
        _center: WorldPosition | undefined — 생성 위치를 지정하는 선택값
        _useBox: boolean = false
        _vertex: THREE.Vector3[] — 입력 배열 자체의 요소를 Vector3로 교체한 바닥점
        _points: WorldPosition[] — 최초 면적 계산에 쓰는 입력점
        _style: object — 색상·재질·투명도 설정
        _textureUrl: string[] | undefined — 옵션 값을 그대로 보관하는 URL 목록
        _textureVisible: boolean = false
        _textures: object — URL별 로드 텍스처
        _floorHeight: number = 3.3 — 돌출 단계 수 계산 간격
        _helper: THREE.Box3Helper — 경계 상자 표시
        _labelText: string = ''
        _olGeom: ol.geom.Polygon — 경위도 바닥 도형
    속성 — 건축량
        _buildingArea: number — 바닥 면적
        _floor: number — 돌출 높이를 3으로 나누어 반올림한 층수
        _totalArea: number — 층수 × 바닥 면적
        _landArea: number | undefined
        _floorAreaRatio: number | undefined
        _buildingCoverageRatio: number | undefined

    constructor(opt = {})
        인터페이스: opt는 drawarg, shape, vertex, points, 높이·위치·표시·면적 옵션을 전달한다.
        의존:
            UEventDispatcher — 이벤트 기반 초기화; 함수: {constructor(), addEventListener()}
            defaultValue — 누락 옵션 결정; 함수: {defaultValue()}
            Guid — 기본 이름 생성; 함수: {Guid()}
            THREE — 벡터·경계 헬퍼 생성; 생성자: {new Vector3(), new Box3Helper()}
            UGroup — 표시 그룹 생성; 생성자: {new UGroup()}
            UDrawArg — 최초 바닥 면적 측정; 함수: {_app._measureLayer.getMeasureAreaByPositions()}
            UDEF — 모델 종류; 속성 읽기: {CUSTOM_MODEL.TYPE.EXTRUDE}
        동작:
            부모를 초기화하고 drawarg가 없으면 나머지 초기화 없이 반환한다.
            옵션으로 상태를 구성한다. vertex 배열은 복제하지 않고 각 요소를 새 Vector3로 바꾼다.
            기본 스타일은 DoubleSide·transparent=true이고 opacity는 Number 변환 후 기본값 처리를 한다. [확인 Q-001]
            onChange에 현재 객체를 바인딩해 등록하고 바닥 면적·층수·연면적을 계산한다.
            돌출 모델을 생성한다.

    getAreaValue() -> object
        인터페이스: 층수·대지면적·연면적·용적률·건축면적·건폐율을 담은 새 객체를 반환한다.
        의존: defined — 대지면적 지정 여부; 함수: {defined()}
        동작: 높이/3을 반올림하여 층수와 연면적을 다시 계산한다. 대지면적이 있으면 각 면적을 대지면적으로 나누어 백분율을 만들고, 없으면 두 비율을 0으로 반환한다.

    showBox() -> void
        의존: UDrawArg — 주석 장면 표시와 갱신; 함수: {_app._sceneComment.add(), setUpdateDate()}
        동작: 경계 헬퍼를 주석 장면에 넣고 갱신을 요청한다.
    hideBox() -> void
        의존: UDrawArg — 주석 장면 제거와 갱신; 함수: {_app._sceneComment.remove(), setUpdateDate()}
        동작: 경계 헬퍼를 주석 장면에서 빼고 갱신을 요청한다.

    setTexture(textureUrl: string) -> void
        인터페이스: textureUrl은 각 자식 메시 재질에 적용할 이미지 URL이다.
        의존:
            defined — URL과 모델 존재 확인; 함수: {defined()}
            THREE — 이미지 로드·재질 복제와 해제; 생성자: {new TextureLoader()}; 함수: {TextureLoader.load(), Material.clone(), Material.dispose()}
            UDEF — 텍스처 크기 처리; 함수: {noResizeTexture()}
            UGroup — 직접 자식 열람; 함수: {getChildren()}
        동작:
            URL이 없거나 빈 문자열이거나 모델이 없으면 반환한다. URL 캐시를 재사용하거나 TextureLoader로 로드한다.
            텍스처에 noResizeTexture를 적용하고 needsUpdate=true·flipY=false로 설정해 캐시한다.
            배열 재질이면 모두 map을 교체한다. 단일 재질이면 두 벌 복제하여 map을 적용하고 원재질을 해제한 뒤 배열로 바꾼다.
            예외는 로그로 알리고 바깥으로 전달하지 않는다.
    removeTexture() -> void
        의존:
            defined — 모델 존재 확인; 함수: {defined()}
            UGroup — 자식 열람; 함수: {getChildren()}
            THREE — 재질 복제·해제; 함수: {Material.clone(), Material.dispose()}
        동작: 모델이 없으면 반환한다. 자식의 재질이 배열이 아니면 메서드 전체를 끝낸다. 배열이면 첫 재질을 복제해 map을 제거하고 이전 재질들을 해제한 뒤 단일 재질로 바꾼다.

    setStyle(style: object) -> void
        인터페이스: style은 color, metalness, roughness, opacity를 갱신하는 부분 설정이다. transparent 입력값 대신 opacity로 투명 여부를 정한다.
        의존:
            defined — 입력 확인; 함수: {defined()}
            defaultValue — 기존 설정 보존; 함수: {defaultValue()}
            THREE — 색상 생성; 생성자: {new Color()}
            UGroup — 메시 재질 순회; 함수: {traverse()}
        동작:
            입력이 없으면 반환하고 설정을 병합한다. opacity는 Number 변환을 거치며 1이 아니면 투명 재질로 판단한다. [확인 Q-001]
            모든 메시의 단일·배열 재질에 색상, matalness, roughness, 투명도와 opacity를 적용한다. 투명해질 때만 depthTest=false로 바꾼다. [확인 Q-002]
    setColor(color: THREE.ColorRepresentation) -> void
        의존:
            THREE — 색상 생성; 생성자: {new Color()}
            UGroup — 메시 순회; 함수: {traverse()}
            UDrawArg — 화면 갱신; 함수: {setUpdateDate()}
        동작: 모든 메시의 단일·배열 재질에 같은 Color 객체를 넣고 메시마다 갱신을 요청한 뒤 스타일 색상을 저장한다.
    setOpacity(opacity: number) -> void
        의존:
            defined — 입력 확인; 함수: {defined()}
            UGroup — 메시 순회; 함수: {traverse()}
            UDrawArg — 화면 갱신; 함수: {setUpdateDate()}
        동작: 입력이 없으면 반환한다. 모든 메시의 재질에 opacity, opacity<1인 transparent, 그 반대인 depthTest를 넣고 갱신한다. 스타일에도 opacity와 transparent를 저장한다.

    setPosition(position: WorldPosition) -> void
        의존:
            defined — 입력 확인; 함수: {defined()}
            UGroup — 메시 위치 변경 대상 순회; 함수: {traverse()}
        동작: 입력이 없으면 반환한다. 각 메시 position을 입력 xyz로 바꾸고, 보조 _position에는 x·y와 -(position.z + _height)를 저장한다. [확인 Q-003]
    setRotate(rotate: THREE.Vector3) -> void
        의존:
            defined — 입력 확인; 함수: {defined()}
            UGroup — 메시 회전 변경 대상 순회; 함수: {traverse()}
        동작: 입력이 있으면 모든 메시의 회전을 입력 xyz로 설정한다.
    setScale(scale: THREE.Vector3) -> void
        의존:
            defined — 입력 확인; 함수: {defined()}
            UGroup — 메시 크기 변경 대상 순회; 함수: {traverse()}
        동작: 입력이 있으면 모든 메시의 scale을 입력 xyz로 설정한다.
    getUid() -> string
        의존: UMesh — 첫 메시 식별자; 함수: {getUid()}
        동작: 그룹 첫 자식의 getUid 결과를 반환한다. 비어 있는 그룹을 검사하지 않는다.

    createCustomModel() -> UGroup
        의존:
            UExtrudeGeometry — 돌출 기하 생성; 생성자: {new UExtrudeGeometry()}
            UMesh — 메시 생성·경계 계산; 생성자: {new UMesh()}; 함수: {getBBox()}
            UGroup — 그룹 연결; 함수: {add()}
            THREE — 기하 중심·변환 행렬·경계 계산; 생성자: {new Vector3(), new Box3()}; 함수: {Box3.setFromObject(), BufferGeometry.center(), Object3D.updateMatrix(), Object3D.updateMatrixWorld()}
            U3dPOI — 라벨 생성·표시; 생성자: {new U3dPOI()}; 함수: {show()}
            UDrawArg — 주석 장면 연결; 함수: {_app._sceneComment.add()}
            UDEF — 건물 분류; 속성 읽기: {UMESH_TYPE._building}
            defined — 명시 위치 판정; 함수: {defined()}
        동작:
            기본 돌출 옵션을 복사하여 depth=높이, steps=floor(높이/층높이)로 설정하고 기하·재질·메시를 만든다.
            이름·그림자·레이어 이름·건물 분류를 넣고 기하 경계 중심을 계산하여 기하를 중심 정렬한다. 행렬·경계를 갱신하고 그룹에 넣는다.
            center가 있으면 그 xyz로 배치하고, 없으면 중심 xy와 zOffset+높이/2로 배치한다.
            위치에 POI 라벨을 생성·표시하여 주석 장면에 넣는다. userData.label과 userData.class에 연결하고 경계 헬퍼를 갱신한다.
            바닥 OL 도형을 구성하고 지형 높이를 반영한 뒤 그룹을 반환한다.

    showLabel(show: boolean) -> void
        의존:
            defined — 입력·라벨 존재 확인; 함수: {defined()}
            UGroup — 메시 순회; 함수: {traverse()}
            U3dPOI — 라벨 표시·숨김; 함수: {show(), hide()}
        동작: show가 없으면 true로 취급한다. 메시의 라벨이 있으면 show에 따라 표시하거나 숨긴다.
    dispose() -> void
        의존:
            UGroup — 모델 순회; 함수: {traverse()}
            THREE — 부모 연결·기하·재질 해제; 함수: {Object3D.remove(), BufferGeometry.dispose(), Material.dispose()}
            UDrawArg — 주석 장면에서 제거; 함수: {_app._sceneComment.remove()}
            U3dPOI — 라벨 자원 해제; 함수: {dispose()}
            UDEF — 자체 dispose 없는 라벨의 해제; 함수: {disposeObject3D()}
            UEventDispatcher — 이벤트 정리; 함수: {removeEventListenerAll()}
            defined — 헬퍼 존재 판정; 함수: {defined()}
        동작:
            모델을 순회하며 부모에서 빼고 라벨을 장면에서 제거하여 자체 dispose 또는 UDEF 해제로 정리한다.
            기하·단일 또는 배열 재질을 해제하고 해당 참조를 undefined로 만든다.
            헬퍼를 주석 장면에서 제거하고 이벤트를 모두 지운다. 이름·기하 설정·장면·그룹·경계·높이·텍스처 사전 참조를 해제한다.

    getParameter() -> object | undefined
        인터페이스: 모델 종류·이름·높이·변환·바닥점·스타일·텍스처 URL·라벨 저장값을 반환하며, 읽는 중 실패하면 undefined이다. [확인 Q-004]
        의존: THREE — 버텍스 복제와 색상 문자열; 함수: {Vector3.clone(), Color.getHexString()}
        동작:
            첫 메시에서 위치·회전·크기를 새 xyz 객체로 수집한다. 지면 상대 높이를 구하고 바닥점을 복제하여 그 z로 맞춘다.
            center에는 메시 position 원본을 넣고 첫 재질의 색상·opacity, 캐시 URL 목록·라벨을 담는다. 예외가 나면 결과 전체를 undefined로 바꾼다.
    setLabelText(labelText: string) -> void
        의존:
            UGroup — 메시 순회; 함수: {traverse()}
            defined — 라벨 존재 확인; 함수: {defined()}
            U3dPOI — 라벨 수정; 함수: {setLabel()}
        동작: 라벨이 있는 메시마다 라벨과 _labelText를 갱신한다.
    setName(name: string) -> void
        의존:
            UGroup — 메시 순회; 함수: {traverse()}
            defined — 라벨 보유 여부; 함수: {defined()}
        동작: 자체 이름을 바꾸고 라벨을 보유한 메시의 _name만 같은 값으로 바꾼다.
    getLabelText() -> string
        의존:
            UGroup — 메시 순회; 함수: {traverse()}
            defined — 라벨 존재 확인; 함수: {defined()}
        동작: 라벨 보유 메시를 순회하며 값을 덮어써 마지막 라벨 문자열을 반환한다. 없으면 빈 문자열이다.
    getName() -> string
        동작: _name을 반환한다.
    getHeight() -> number
        동작: _extrudeHeight를 반환한다.
    getLandHeight() -> number
        의존:
            THREE — 수직 지형 교차; 생성자: {new Raycaster(), new Vector3()}; 함수: {Raycaster.set(), Raycaster.intersectObjects()}
            UDrawArg — 지형 인스턴스 장면; 함수: {_app.getInstanceScenesFromTerrainLayers()}
            UDEF — 광선 시작 높이; 속성 읽기: {MAX_HEIGHT}
            defined — 메시·교차점 존재 판정; 함수: {defined()}
        동작:
            첫 메시가 없으면 0을 반환한다. 메시 xy·MAX_HEIGHT에서 -Z 광선으로 지형을 검사한다.
            첫 교차점 z 또는 0을 지면으로 삼아 메시 z - 지면 z - 돌출높이/2를 반환한다. 계산값이 NaN이면 0이다.
    getOpacity() -> number | undefined
        의존: UGroup — 메시 재질 순회; 함수: {traverse()}
        동작: 마지막 메시의 단일 재질 또는 첫 배열 재질 opacity를 반환한다. 메시가 없으면 undefined이다. [확인 Q-004]
    getColor() -> THREE.ColorRepresentation | undefined
        의존:
            UGroup — 메시 순회; 함수: {traverse()}
            THREE — 재질 색상 문자열; 함수: {Color.getHexString()}
        동작: 마지막 메시의 단일 재질 또는 첫 배열 재질 색상 HEX 문자열을 반환한다. 메시가 없으면 undefined이다. [확인 Q-004]
    show() -> void
        의존:
            defined — 그룹 존재 판정; 함수: {defined()}
            UDrawArg — 화면 갱신; 함수: {setUpdateDate()}
        동작: 그룹이 있으면 visible=true로 만든다. 그룹 존재 여부와 관계없이 갱신을 요청하며 라벨·헬퍼를 별도로 다시 표시하지 않는다.
    hide() -> void
        의존:
            defined — 그룹 존재 판정; 함수: {defined()}
            UDrawArg — 화면 갱신; 함수: {setUpdateDate()}
        동작: 그룹이 있으면 visible=false로 바꾼다. 이후 라벨과 헬퍼 숨김을 호출하고 갱신한다. 이 후속 호출은 그룹 존재 조건 안에 있지 않다.
    setLandHeight(landHeight: number) -> void
        동작: _zOffset을 바꾸고 지형 기준 위치를 다시 계산한다.
    setHeight(height: number) -> void
        의존:
            UExtrudeGeometry — 기하 교체; 생성자: {new UExtrudeGeometry()}
            UMesh — 경계 재계산; 함수: {getBBox()}
            THREE — 기하 중심 정렬·행렬 갱신; 함수: {BufferGeometry.computeBoundingBox(), BufferGeometry.center(), updateMatrix(), updateMatrixWorld()}
            U3dPOI — 라벨 높이 갱신; 함수: {setPosition()}
            UDrawArg — 화면 갱신; 함수: {setUpdateDate()}
        동작:
            기존 높이와 같으면 반환한다. 저장 shape가 없으면 vertex에서 shape를 만든다.
            높이와 돌출 단계 수를 바꿔 새 기하로 교체하고 중심·행렬·경계를 계산한다. 이전 기하는 이 경로에서 해제하지 않는다.
            높이 차이의 절반만큼 메시 z를 이동하고 라벨·헬퍼를 맞춘 뒤 갱신을 요청한다.
    getBottomShapeVertex() -> WorldPosition[]
        인터페이스: 변환된 경위도 바닥점들을 z=0인 일반 객체 배열로 반환한다. [확인 Q-004]
        동작: 현재 크기·회전을 반영한 OL 도형의 마지막 좌표를 제거하고 나머지를 xyz 객체로 바꾼다.
    getMesh() -> THREE.Object3D | undefined
        동작: 그룹의 첫 자식을 반환한다. [확인 Q-004]
    addChangeEvent(dstSelf) -> void
        인터페이스: dstSelf는 편집 변경을 함께 반영할 대상 모델이다.
        의존: UEventDispatcher — 변경 이벤트 연결; 함수: {addEventListener()}
        동작: onChangeAssociate를 dstSelf에 바인딩하여 현재 모델의 onChange에 등록한다.
    updateHeight() -> void
        의존:
            THREE — 지형 광선·경계·행렬 계산; 생성자: {new Raycaster(), new Vector3()}; 함수: {Raycaster.set(), Raycaster.intersectObjects(), BufferGeometry.computeBoundingBox(), Object3D.updateMatrix(), Object3D.updateMatrixWorld()}
            UDrawArg — 지형 장면; 함수: {_app.getInstanceScenesFromTerrainLayers()}
            UDEF — 광선 높이; 속성 읽기: {MAX_HEIGHT}
            UMesh — 경계 동기화; 함수: {getBBox()}
            U3dPOI — 라벨 동기화; 함수: {setPosition()}
            defined — 메시·높이·라벨 존재 판정; 함수: {defined()}
        동작:
            첫 메시가 없으면 반환한다. 메시 xy의 지형을 -Z 광선으로 검사하여 첫 교차점 높이 또는 0을 얻는다.
            메시 경계 높이의 절반을 구하고 zOffset이 없거나 NaN이면 0으로 보정한다. 메시 z를 지면+zOffset+반높이로 설정한다.
            라벨이 있으면 z를 맞추고 헬퍼 경계·메시 행렬을 갱신한다.

getDefaultMaterial()
    의존: THREE — 기본 재질 생성; 생성자: {new MeshLambertMaterial()}
    동작: 수신 객체에 스타일이 없으면 파란색·opacity=1·DoubleSide·transparent=true를 넣는다. 이 스타일로 Lambert 재질을 만들고 needsUpdate=true로 반환한다.
updateOLGeometry()
    의존:
        THREE — 회전 추출; 생성자: {new Euler()}; 함수: {Euler.setFromQuaternion()}
        ol — 도형 복제와 변환; 함수: {geom.Polygon.clone(), extent.getCenter(), geom.Polygon.scale(), geom.Polygon.rotate()}
    동작: 첫 메시 quaternion의 Z 회전과 xy 크기를 얻는다. 저장 OL 도형을 복제하여 그 도형의 경계 중심을 기준으로 scale·rotate하고 반환한다. 메시 위치 이동은 적용하지 않는다.
createOLGeometry()
    의존:
        UDrawArg — 월드점의 경위도 변환; 함수: {getWorldToGeographic()}
        ol — 폴리곤 생성; 생성자: {new geom.Polygon()}
    동작: vertex들을 경위도로 바꾸고 마지막 vertex를 한 번 더 넣어 _olGeom을 만든다. 첫 점을 추가하여 닫는 형태가 아니다. [확인 Q-005]
onChangeAssociate(param)
    인터페이스: param.control은 편집 모드·누적 이동량·크기 변화·원본 회전을 제공한다.
    의존:
        THREE — 위치·행렬 변환; 생성자: {new Vector3()}; 함수: {Vector3.subVectors(), Object3D.updateMatrix()}
        UMesh — 경계 조회; 함수: {getBBox()}
        ol — 바닥 면적 계산; 함수: {Sphere.getArea()}
        defined — 메시 존재 판정; 함수: {defined()}
        param.control — 편집 모드와 변환 변화량 제공; 함수: {getMode()}; 속성 읽기: {userOffset, userScale, object.quaternion}
    동작:
        대상 첫 메시가 없으면 반환한다. userOffset을 더하되 scale·rotate 모드이면 그 이동을 다시 취소한다. scale은 userScale을 더하고 rotate는 제어 객체 quaternion을 복사한다.
        행렬·경계와 돌출 높이를 갱신하고 변환된 OL 도형을 EPSG:4326으로 계산해 바닥 면적·층수·연면적을 갱신한다.
        현재 지면 상대 높이를 zOffset에 저장하고 지형 위치를 다시 반영한다.
onChange()
    의존:
        UMesh — 경계 조회; 함수: {getBBox()}
        ol — 바닥 면적 계산; 함수: {Sphere.getArea()}
        defined — 메시 존재 판정; 함수: {defined()}
    동작: 첫 메시가 없으면 반환한다. 경계에서 돌출 높이를 구하고 헬퍼·바닥 면적·층수·연면적을 갱신한다. 지면 상대 높이를 저장한 뒤 지형 위치를 맞춘다.
makeShape(vertexList, maxSegment = 8)
    인터페이스: vertexList는 폐합할 바닥점 목록이며 maxSegment는 보간 간격이다. 유효한 보간점이 없으면 undefined, 있으면 THREE.Shape를 반환한다.
    의존:
        lerpVector — U3dModelWFSLayer 모듈에서 내보낸 인접점과 끝점-첫점 보간 함수; 함수: {lerpVector()}
        THREE — 윤곽 생성; 생성자: {new Shape()}; 함수: {Shape.moveTo(), Shape.lineTo()}
    동작: 인접 점 쌍과 마지막-첫 점을 보간한다. 결과가 1개 이하이면 반환하고, 아니면 첫 점에서 시작해 나머지를 선으로 잇는 Shape를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
모델의 주요 편집·조회는 `_object.children[0]`에 의존한다. 생성된 사용자 모델 자체에는 puid를 부여하지 않는다. 면적용 층수는 높이/3의 반올림이며 돌출 기하 분할에 사용하는 `_floorHeight`와 계산 기준이 다르다. 텍스처 캐시와 메시 geometry의 소유권을 외부에서 변경할 때에는 기존 해제 경로를 함께 확인한다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
