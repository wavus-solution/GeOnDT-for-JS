# U3dRoadExtension 명세

> 상태: 구현 관찰 초안

## 1. 개요

입력 중심점을 따라 지형 위 도로 면과 중앙선·차선을 구성하고, 도로 양 끝의 연장·축소·곡선 연결·교차로 분할을 수행한다. 도로 연결부는 absorption 모드로 별도 생성한다. `width`는 생성자에서 차로 수를 곱한 값이며 양쪽 경계를 계산할 때 중심에서 각 방향으로 사용하는 거리이다. `height`는 도로 높이 자체가 아니라 중심선 샘플 간격과 UV 반복에도 사용된다.

## 3. 정규 자연어 수도코드

```spec
U3dRoadExtension 클래스 정의
    속성 — 입력과 기하
        name: string — options.name 또는 U3dRoad
        type: string — options.type 또는 road
        center: THREE.Vector3[] — 보간·지형 보정한 중심점
        coordinates: Array — 입력 경위도 좌표 참조
        origin: THREE.Vector3[] — 편집 원본 중심점
        vertices: THREE.Vector3[] — 도로 양측 경계의 교차 배열
        lines: THREE.Line[] — 중앙·차선 논리 선분
        _lineCashe: Array = []
        faces: Array — 삼각형 인덱스와 재질 선택
        uvs: Array — face별 텍스처 좌표
        nodes: Array — 점·이전점·다음점·진행 방향
        nodeGroup: UGroup — 노드 시각화 구
        color: string = '#7a7a7a'
        line: number — 차로 옵션; 기본 1
        width: number — 초기 options.width 또는 10에 line을 곱한 값
        height: number — 샘플 간격·연결 간격; 기본 10
        image: string | undefined
        dispatcher: object — 각도 오류 이벤트 소유자
        _app: U3dApp — 지도·지형·POI 접근
        _drawArg: UDrawArg — 좌표·화면 갱신 접근
        length: number = 0 — 쓰기 가능한 누적 길이; checkDistance의 거리+length>100000 판정과 끝 POI 표시에 사용한다.
        _layer: object | undefined
        poi: U3dPOI | undefined — 도로명 라벨
        _isAbsorption: boolean — 두 도로의 연결부 여부; 기본 false
        material: THREE.Material[] — 일반면과 큰 깊이 오프셋면
        geometry: THREE.BufferGeometry — 도로 기하
        mesh: UMesh — 도로와 선 메시의 부모
        _show: boolean — 일반 도로 생성 시 true
        _editPoints: UGroup — 일반 도로의 시작·끝 편집점
        _shapeVertices: THREE.Vector3[] — OL 폴리곤용 폐합 경계
        _olGeom: ol.geom.Polygon
        _roadImageUrl: string
        _centerLineMaterial: THREE.Material
        _nomalLineMaterial: THREE.Material
        _startPoi: U3dBilboard
        _endPoi: U3dBilboard

    constructor(options)
        인터페이스: options는 app·dispatcher와 도로 이름·종류·차로 수·폭·간격·이미지·라벨·연결부 여부를 제공한다.
        의존:
            defaultValue — 옵션 기본값; 함수: {defaultValue()}
            defined — 옵션·생성 결과 존재 확인; 함수: {defined()}
            UGroup — 노드·편집점 그룹; 생성자: {new UGroup()}
            UMesh — 도로 메시; 생성자: {new UMesh()}
            THREE — 기하·표면 재질; 생성자: {new BufferGeometry(), new MeshLambertMaterial()}
            __GError__ — 초기 이미지 실패 보고; 함수: {__GError__()}
        동작:
            배열·이름·차로 수·폭·간격을 초기화한다. image가 있으면 비동기 적용을 시작하고 실패를 306012 코드로 보고한다.
            app에서 drawArg를 연결하고 길이·레이어·라벨·연결부 상태를 저장한다.
            FrontSide·투명·깊이 쓰기 비활성의 두 재질을 만든다. 일반 오프셋 factor=-10, 큰 오프셋 factor=-20이며 units=1이다.
            material이 없으면 기하·메시·표시·편집점 초기화 없이 반환한다. geometry를 만들고 없으면 메시·표시·편집점 초기화 없이 반환한다.
            _isAbsorption이 truthy이면 첫 재질을 DoubleSide로 바꾸고 absorption 메시만 만든다.
            _isAbsorption이 falsy인 일반 도로이면 메시를 만든다. mesh가 없으면 표시·편집점 초기화 없이 반환한다.
            material·geometry·mesh가 모두 있고 _isAbsorption이 falsy이면 선을 초기화한 뒤 _show=true와 편집점 그룹을 저장한다.

    createAbsorption(road1, road2, type)
        인터페이스: type의 두 항목은 각 도로의 start/end 연결 끝을 고른다. 정상 완료 시 Promise를 반환하며 좌우 점 수 불일치 경로는 undefined를 반환한다.
        의존:
            deferredPromise — 연결부 완료 전달; 함수: {deferredPromise()}
            THREE — 양쪽 연결 곡선·기하 계산; 생성자: {new CatmullRomCurve3(), new BufferGeometry()}; 함수: {getPoints(), setFromPoints(), computeFaceNormals(), computeVertexNormals(), computeBoundingSphere()}
            ULineGeometry — 중앙선 메시 판별·중심점 조회; 함수: {getPoints()}
            U3dApp — 화면 갱신; 함수: {setUpdateDate()}
        동작:
            road1 끝은 마지막 두 경계점 또는 시작의 역순 두 점, road2 끝도 같은 기준으로 선택한다. 두 측면 거리 중 긴 쪽/height를 floor한 분할 수로 CatmullRom 곡선을 각각 샘플링한다.
            양쪽 점 수가 다르면 로그 후 undefined로 끝낸다. 오른쪽·왼쪽 점을 번갈아 넣어 기하를 만든다. 기하가 없으면 reject한 Promise를 반환한다. 점·face·UV·법선·경계를 계산한다. [확인 Q-001]
            각 도로의 선택 끝에 해당하는 2×line-1개 논리 선을 얻고 공통 개수만큼 대응점을 연결한다. end→start와 start→end는 같은 선 번호를 연결한다. end→end는 중앙선 0을 유지하고 나머지 홀·짝 인접 번호를 교환한다.
            start→start에서 선 수가 다르면 홀·짝 대응을 교환하지만 같으면 같은 번호를 연결한다. 선이 더 많은 쪽의 잔여 선은 반대 도로 외곽점으로 모은다. start→end의 잔여 선 분기는 별도 인덱스 사용을 확인해야 한다. [확인 Q-002]
            대응 선의 표시 폭·재질을 복제하여 연결선 메시를 추가한다.
            ULineGeometry 자식은 centerLineMesh로 표시하고 그 점들을 center에 이어 붙인다. 화면 갱신 후 Promise를 resolve한다.

    addPoint(point: WorldPositionVector3, type?: string)
        동작: type이 없으면 end이다. 기존 점이 있으면 마지막 원점과의 거리를 length에 더하고 끝 POI를, 없으면 시작 POI를 만든다. start이면 앞에, 그 외에는 뒤에 원점을 넣고 지형 갱신을 포함한 update 결과를 반환한다.
    reducePoint(point, type)
        동작:
            type이 없으면 end이다. start이면 두 번째 원점에 가장 가까운 center 앞부분과 첫 원점을 제거한다. 새 point와 남은 첫 점 거리가 height/2보다 크면 point를 앞에 넣고 보간점을 앞쪽에 이어 붙인다.
            end이면 끝에서 두 번째 원점에 가까운 center부터 뒷부분과 마지막 원점을 제거한다. 새 point 거리가 height/2보다 크면 끝에 추가하여 보간점을 이어 붙인다.
            start 축소는 update(undefined,true,true), end 축소는 update(undefined,true,false)를 반환한다.
    setRoadImage(imageUrl: String)
        인터페이스: 반환 Promise는 모든 현재 재질의 이미지 적용 후 resolve하고 로드·적용 실패 시 reject한다.
        의존:
            deferredPromise — 이미지 적용 완료·실패 전달; 함수: {deferredPromise()}
            THREE — 비동기 이미지·텍스처 설정; 생성자: {new TextureLoader()}; 함수: {TextureLoader.load(), Color.set()}; 상수: {ClampToEdgeWrapping, NearestFilter}
        동작: URL을 저장하고 로드한다. 성공하면 양축 ClampToEdge·Nearest 축소·mipmap 생성 비활성으로 설정한다. 모든 도로 재질을 흰색·같은 map·needsUpdate=true로 바꾸고 resolve한다. 적용 예외는 오류와 함께 reject하고 로드 실패는 로그 후 인자 없이 reject한다.
    setWidth(width: Number)
        동작: width를 직접 저장하고 지형을 포함해 전체 기하를 갱신한다. 생성자와 달리 line을 다시 곱하지 않는다.
    setHeight(height: Number)
        동작: height를 저장하고 지형을 포함해 기하를 갱신한다.
    setCoordinates(coordinates: Array)
        의존: U3dApp — 경위도 변환; 함수: {geographicToVector3()}
        동작: 입력 배열을 저장하고 각 좌표를 월드점으로 바꾸어 추가한 뒤 한 번 더 갱신한다. 기존 origin을 먼저 비우지는 않는다.
    show()
        동작: mesh가 있으면 visible과 _show를 true로 바꾼다.
    hide()
        동작: mesh가 있으면 visible과 _show를 false로 바꾼다.
    isVisibleLabel() -> Boolean
        동작: poi가 없으면 false, 있으면 poi.visible을 반환한다.
    setLabel(position)
        의존:
            THREE — 라벨 위치 생성; 생성자: {new Vector3()}
            U3dPOI — 라벨 객체; 생성자: {new U3dPOI()}
            U3dApp — POI 장면 추가; 함수: {addPOI()}
            UDrawArg — 화면 갱신; 함수: {setUpdateDate()}
        동작: position이 없으면 도로 경계 중심, 그 결과도 없으면 첫 원점을 선택한다. 위치를 복사해 현재 이름의 POI를 새로 만들고 app에 추가한 뒤 갱신한다.
    removeEditPoints()
        의존:
            UGroup — 편집점 연결 제거; 함수: {clear()}
            UDrawArg — 화면 갱신; 함수: {setUpdateDate()}
        동작: poi가 없으면 반환한다. 있으면 _editPoints의 자식 연결을 비우고 갱신한다. poi와 편집점 존재 조건은 별개이다.
    removeLabel()
        의존:
            U3dApp — POI 제거; 함수: {removePOI()}
            UDrawArg — 화면 갱신; 함수: {setUpdateDate()}
        동작: poi가 없으면 반환한다. app에서 제거하고 참조를 undefined로 바꾼 뒤 갱신한다.
    hideLabel()
        의존: UDrawArg — 화면 갱신; 함수: {setUpdateDate()}
        동작: poi가 있으면 visible=false로 바꾸고 갱신한다.
    showLabel()
        의존: UDrawArg — 화면 갱신; 함수: {setUpdateDate()}
        동작: poi가 없으면 생성한다. visible=true로 바꾸고 갱신한다.
    updateLabel()
        의존: UDrawArg — 화면 갱신; 함수: {setUpdateDate()}
        동작: 기존 라벨을 제거하고 현재 중심·이름으로 새로 만든 뒤 갱신한다.
    showNodeArea()
        의존:
            U3dApp — 노드 장면 연결; 함수: {_sceneComment.add()}
            UDrawArg — 화면 갱신; 함수: {setUpdateDate()}
        동작: nodeGroup이 있으면 주석 장면에 넣고 갱신한다.
    hideNodePoint()
        의존:
            U3dApp — 노드 장면 제거; 함수: {_sceneComment.remove()}
            UDrawArg — 화면 갱신; 함수: {setUpdateDate()}
        동작: nodeGroup이 있으면 주석 장면에서 빼고 갱신한다.
    editName(newName)
        동작: name만 입력값으로 바꾼다. 기존 라벨·자식 이름을 함께 바꾸지 않는다.
    getCoordinates() -> Array
        의존:
            THREE — 메시 이동량 반영; 생성자: {new Vector3()}
            U3dApp — 경위도 변환; 함수: {vector3ToGeoGraphic()}
        동작: 각 origin에 mesh.position을 더한 점을 경위도로 바꿔 새 배열로 반환한다.
    getParam() -> Object | undefined
        동작: 경위도 점이 2개 미만이면 undefined이다. 이름·좌표·width/line·차로 수·height·이미지 URL·표시 여부를 담고, poi가 있으면 라벨 표시와 위치 원본도 담는다.
    updateHeightByTerrain()
        의존:
            UDrawArg — 현재 렌더 지형 높이; 함수: {getRenderHeightAtPoint()}
            UDEF — 지형 결측값; 상수: {INVALID, TERRAIN_NO_DATA}
        동작: drawArg가 없으면 반환한다. mesh.position xy의 높이가 두 결측값 중 하나이면 그대로 두고, 아니면 메시 z를 높이+0.1로 설정한다.
    getRoadCenter() -> THREE.Vector3 | undefined
        의존: THREE — 기하 경계 중심; 생성자: {new Vector3()}; 함수: {BufferGeometry.computeBoundingBox(), Box3.getCenter()}
        동작: 결과 Vector3를 만들고 없으면 undefined를 반환한다. 기하 경계 중심을 구하여 mesh.position을 더한 월드 중심을 반환한다.

    update(point: WorldPositionVector3, updateHeight: boolean, isEnd: boolean)
        의존:
            defined — 결과 존재 확인; 함수: {defined()}
            UDEF — 광선 시작 높이; 상수: {MAX_HEIGHT}
            U3dApp — 중심·경계 지형 높이; 함수: {closestPointAtVector3_(), getRenderHeightAtPoint()}
            THREE — 새 도로 기하·법선·경계; 생성자: {new BufferGeometry()}; 함수: {setFromPoints(), computeFaceNormals(), computeVertexNormals(), computeBoundingSphere()}
        동작:
            origin이 2개 미만이면 true로 끝낸다. 새 point가 있고 원점이 2개이면 두 점을 height 간격으로 나누어 center에 이어 붙인다.
            새 point가 있고 origin이 2개보다 많으면 추가 방향에 따라 곡선 생성 여부를 판단한다.
                isEnd가 truthy이면 마지막 center와 point의 거리가 height×2 이상일 때만 computeCurve를 호출한다. 곡선이 없으면 false로 끝내고, 있으면 접속 중복점을 제거하여 곡선을 끝에 잇는다. 곡선 끝이 point와 다르면 나머지 직선을 보간해 끝에 잇는다.
                isEnd가 falsy이면 첫 center와 point의 거리가 height 이상일 때 computeCurve를 호출한다. 곡선이 없으면 false로 끝내고, 있으면 접속 중복점 제거 후 곡선을 앞에 잇는다. 곡선 시작이 point와 다르면 나머지 직선을 보간해 앞에 잇는다. 거리 기준 미만이면 point만 앞에 잇는다.
            center가 없거나 비면 false로 끝낸다.
            updateHeight이면 각 center의 원 z를 보관하고 MAX_HEIGHT에서 지형을 찾는다. 결과 z가 양수일 때만 교체하고 아니면 원 z를 복원한다.
            중심선에서 양측 경계·face·UV·폐합 윤곽을 계산한다. updateHeight이면 경계점보다 높은 렌더 지형 높이만 반영한다.
            새 기하가 없으면 undefined로 끝낸다. 생성되었으면 점·face·UV를 넣어 법선·경계를 계산하고 mesh에 교체한다. OL 도로 도형, 중앙·차선, 선 높이를 차례로 갱신한다. [확인 Q-001]
            편집점이 있으면 start는 첫 center, 나머지는 마지막 center로 맞춘다. 메시 지형 높이를 갱신하고 true를 반환한다.
    updateHeightFromTerrain(tile)
        의존:
            U3dApp — 지형 높이 조회; 함수: {closestPointAtVector3_(), getRenderHeightAtPoint()}
            UDEF — 광선 시작 높이; 상수: {MAX_HEIGHT}
            THREE — 도로 기하 재구성; 생성자: {new BufferGeometry()}; 함수: {setFromPoints(), computeFaceNormals(), computeVertexNormals(), computeBoundingSphere()}
        동작:
            tile의 엄격한 내부 xy 범위에 든 center만 위에서 지형을 찾아 양수 높이를 반영하고, 실패하면 원 z를 복원한다.
            그 center 인덱스에 대응하는 논리 선점이 있으면 지형 높이와 중심 높이 중 높은 값+0.08로 맞춘다. 순회 중 선 객체가 없으면 메서드 전체를 끝낸다.
            _isAbsorption이 truthy인 연결부이면 기존 경계점에서 더 높은 비영 높이는 올리고, tile 내부에서 더 낮거나 같은 비영 높이는 높이-20으로 내린다. 새 기하를 만들고 없으면 반환한다. 조정된 경계점을 넣고 face·UV를 다시 계산한다.
            _isAbsorption이 falsy인 일반 도로이면 center에서 경계·face·UV·윤곽을 다시 만든다. 높아진 지형은 전체에, 낮아진 비영 높이는 tile 내부에만 반영한다. 두 칸 뒤 정점과 z 차이가 2를 넘는 face쌍은 재질 1, 아니면 0으로 지정한다.
            일반 도로에서도 새 geom을 만들고 없으면 반환한다. 두 경로 모두 점·face·UV와 법선·경계를 반영하여 기하를 교체한다. [확인 Q-001]
            _isAbsorption이 falsy이고 새 geom이 있으면 OL 도형을 갱신한다.
            선 높이와 메시 지형 높이는 두 경로 뒤 공통으로 맞춘다.

    createNodes(pointList)
        의존: THREE — 진행 방향; 생성자: {new Vector3()}; 함수: {subVectors(), normalize()}
        동작: 목록이 없으면 origin을 쓴다. 각 점에 이전·다음점과 다음점 방향을 붙여 nodes에 추가한다. 양끝 이전·다음은 자신이며 기존 nodes를 먼저 지우지 않는다. 전체 nodes의 표시 구를 만든다.
    removeNoeds()
        의존: U3dApp — 노드 표시 제거; 함수: {_sceneComment.remove()}
        동작: nodes를 비우고 주석 장면에서 nodeGroup을 제거한 뒤 참조를 undefined로 만든다.
    computeCurve(point: WorldPositionVector3, isEnd?: boolean)
        의존: THREE — 2차 곡선 샘플; 생성자: {new QuadraticBezierCurve3()}; 함수: {getPoints()}
        동작:
            isEnd가 없으면 true로 정한다. isEnd가 truthy이면 끝 방향의 제어점을 구한다.
            isEnd가 falsy이면 앞 방향의 제어점을 구한다.
            제어점이 없으면 반환한다. 2차 Bezier 곡선을 만들고 없으면 반환한다. p1·p2·p3를 곡선에 넣는다.
            DEBUG가 truthy이면 제어점 POI를 추가한다. [확인 Q-003]
            곡선을 9분할한 점들을 반환한다.
    getCurvePoints(point: WorldPositionVector3) -> object | undefined
        의존:
            THREE — 방향·각도 계산; 생성자: {new Vector3()}; 함수: {Vector3.angleTo()}
            dispatcher — 입력 거절 이벤트; 함수: {dispatchEvent()}
        동작: center가 2개 미만이면 반환한다. 마지막 두 점과 새 점의 방향각이 130도를 넘으면 마지막 원점을 제거하고 누적 길이를 빼며 error/angle 이벤트로 내각을 알린 뒤 undefined이다. 허용되면 마지막 center 두 개를 제거하고 이전 구간 길이만큼 새 방향으로 연장한 p3를 포함한 제어점을 반환한다.
    getCurvePointsToStart(point) -> Object | undefined
        의존:
            THREE — 앞 방향·각도 계산; 생성자: {new Vector3()}; 함수: {Vector3.angleTo()}
            dispatcher — 입력 거절 이벤트; 함수: {dispatchEvent()}
        동작: center가 2개 미만이면 debugger만 실행하고 계속한다. 새 점·첫 두 center의 방향각이 130도를 넘으면 첫 원점과 해당 길이를 제거하고 오류 이벤트 후 반환한다. 허용되면 앞 center 두 개를 제거하고 기존 구간 길이에 맞춘 p1·p2·p3를 반환한다.
    debugVertex()
        동작: DEBUG가 truthy이면 경계점을 빨강, 중심점을 초록 POI로 기록한다. [확인 Q-003]
    startPoi(position)
        의존: U3dBilboard — 시작 표시 생성; 함수: {makeBilboard()}
        동작: position에 Start 텍스트의 빌보드를 만들고 이름을 startPoi로 저장한다.
    endPoi(position)
        의존: U3dBilboard — 누적 거리 표시; 함수: {makeBilboard()}
        동작: 이전 끝 POI 참조를 비운다. 길이가 1000보다 크면 km 소수 한 자리, 아니면 반올림한 m 문자열로 빌보드를 만들고 endPoi로 저장한다.
    checkDistance(point: WorldPositionVector3, target?: WorldPositionVector3) -> number
        동작: 원점이 있으면 target 또는 마지막 원점과의 거리를 구한다. height×2 미만이면 CLOSE=1, 거리+누적 길이가 100000보다 크면 MAXIMUM_SIZE=2, 그 외에는 NONE=0이다.
    sortLineAndMesh()
        동작: 구간당 2×(line-1)+1개 기준으로 마지막 두 구간 이전 선을 보존한다. 나머지 선의 짝수 인덱스들을 앞, 홀수들을 뒤로 나누어 lines를 다시 연결한다. mesh 자식 배열을 직접 재정렬하지는 않는다.
    createEditPoint()
        의존: THREE — 양끝 편집 구; 생성자: {new SphereGeometry(), new MeshBasicMaterial(), new Mesh()}; 함수: {computeBoundingSphere()}
        동작: center가 비면 반환한다. 첫·마지막 점에 반지름 width/2, 32×16분할의 흰색·불투명도0.3·깊이검사 없는 구를 만든다. 도로 이름과 start/end type을 넣어 _editPoints.children에 직접 추가한다.
    drawIntersection(line, points)
        의존:
            deferredPromise — 교차로 편집 결과 전달; 함수: {deferredPromise()}
            U3dApp — 좌표·지형 변환; 함수: {geographicToVector3(), closestPointAtVector3_()}
            UDEF — 광선 시작 높이; 상수: {MAX_HEIGHT}
            THREE — 기존 선 자식 제거; 함수: {Object3D.remove()}
        동작:
            uuid가 같은 논리 선과 _id로 연결된 자식 메시를 제거한다. 교차 경위도 점을 월드로 바꾸고 원래 선의 최근접 정점 누적 거리 순으로 정렬한다.
            각 교차점은 위에서 지형을 찾아 양수 높이일 때만 반영한다. _isTRoad이면 마지막 교차점을 빼고, 간격이 width/2-1 미만인 뒤쪽 점을 제거한다.
            각 교차점의 최근접 원 선 인덱스를 찾는다. 처음은 원 선 앞부분, 마지막은 뒷부분, 중간은 두 교차점 쌍 사이 구간을 새 선으로 만든다. vectorPoints.z에 높이를 쓰는 대입은 개별 점 z를 바꾸지 않는다. [확인 Q-004]
            새 mesh.children을 resolve한 Promise를 반환한다. 동기 예외를 reject로 감싸지는 않는다.
    removeAllLine()
        의존: THREE — 자식·논리 선 제거; 함수: {Object3D.remove(), Line.remove()}
        동작: 각 논리 선 uuid와 자식 uuid가 같은 메시를 찾아 제거하고 논리 선 remove를 호출한 뒤 lines를 비운다. 생성 시 연결한 _id로 찾는 방식은 아니다.

initLine()
    의존:
        THREE — 중앙·차선과 재질 생성; 생성자: {new Line(), new MeshLambertMaterial()}; 함수: {Object3D.add()}
        UMesh — 표시 메시 생성; 생성자: {new UMesh()}
        ULineGeometry — 중앙선 기하; 생성자: {new ULineGeometry()}
        UDashLineGeometry — 차선 점선 기하; 생성자: {new UDashLineGeometry()}
    동작: 중앙선 논리 객체와 황갈색 표시 메시를 만들고 _id=논리선.uuid로 연결한다. 깊이 오프셋 factor=-15·units=1을 적용한다. 흰색 차선 재질 rmaterial은 한 번 생성하여 저장한다. line>1이면 2×line-2개의 점선 객체·메시를 추가하며 모든 점선 메시가 같은 rmaterial을 공유한다.
copyLineAndLineMesh(origin, array, interval)
    의존:
        THREE — 곡선 샘플·논리 선·재질 복제; 생성자: {new CatmullRomCurve3(), new Line(), new BufferGeometry()}; 함수: {getPoints(), setFromPoints(), computeLineDistances(), Material.clone()}
        UMesh — 복제 표시 메시; 생성자: {new UMesh()}
        ULineGeometry — 중앙선 기하; 생성자: {new ULineGeometry()}; 함수: {setPoints()}
        UDashLineGeometry — 점선 기하; 생성자: {new UDashLineGeometry()}; 함수: {setPoints()}
    동작: interval이 없으면 height를 써서 곡선을 샘플링한 뒤 origin·array 존재를 검사한다. 숨겨진 논리 선과 원본 종류·폭·복제 재질의 표시 메시를 만들어 자식과 lines에 추가한다. 새 메시의 _id는 이 함수에서 설정하지 않는다.
findClosedPoint(point, list)
    동작: 비어 있지 않은 list에서 point와 거리가 가장 가까운 인덱스·거리를 찾는다. 반환의 point 필드는 찾은 점이 아니라 입력 point이다.
createLineOLGeome(line)
    의존:
        UDrawArg — 월드 좌표의 경위도 변환; 함수: {getWorldToGeographic()}
        ol — 경위도 선 생성; 생성자: {new geom.MultiLineString()}
    동작: 기존 _olGeom을 비우고 line.geometry.vertices를 경위도로 변환해 한 개 선의 MultiLineString을 저장한다.
createRoadOLGeome()
    의존:
        UDrawArg — 도로 경계의 경위도 변환; 함수: {getWorldToGeographic()}
        ol — 경위도 폴리곤 생성; 생성자: {new geom.Polygon()}
    동작: 기존 도형을 비우고 _shapeVertices를 경위도로 바꾸어 한 개 외곽선 Polygon을 저장한다.
creatNodeArea(nodeList)
    의존:
        THREE — 노드 표시 구 생성; 생성자: {new SphereGeometry(), new MeshBasicMaterial(), new Mesh()}
        UGroup — 노드 표시 그룹 연결; 함수: {add()}
    동작: 각 노드 위치에 반지름 width/2·32×16분할 구를 도로색·불투명도0.5·깊이검사 없이 만들어 nodeGroup에 추가한다.
addLineforOriginLine(verties, line)
    의존:
        THREE — 분할 논리 선; 생성자: {new Line(), new BufferGeometry()}; 함수: {computeLineDistances(), setFromPoints(), Object3D.add()}
        UMesh — 분할 표시 메시; 생성자: {new UMesh()}
        ULineGeometry — 중앙선 기하; 생성자: {new ULineGeometry()}; 함수: {setPoints()}
        UDashLineGeometry — 점선 기하; 생성자: {new UDashLineGeometry()}; 함수: {setPoints()}
    동작:
        _lineCashe가 비지 않았으면 다른 철자인 _lineCash를 빈 배열로 설정한다. 원 선 type·도로명을 새 논리 선에 넣는다.
        line._type이 centerLine이면 중앙선 재질, 아니면 일반 재질을 선택한다.
        새 메시를 만들고 선택한 재질을 roadLineMesh.material에 저장한다.
        line._type이 정의되어 있으면 roadLineMesh._type을 centerLineMesh로 설정한다.
        _id는 조건 없이 새 논리 선 uuid로 저장한다. 논리 기하·OL 선을 만든다.
        중앙선은 폭1, 점선은 폭0.5 표시 기하를 선택하여 roadLineMesh.geometry에 저장한다.
drawRoadLine(center, isEnd)
    의존:
        THREE — 논리 선 기하; 생성자: {new BufferGeometry()}; 함수: {setFromPoints(), computeLineDistances()}
        ULineGeometry — 중앙 표시 선; 생성자: {new ULineGeometry()}; 함수: {setPoints()}
        UDashLineGeometry — 표시 점선; 생성자: {new UDashLineGeometry()}; 함수: {setPoints()}
    동작:
        lines 수가 2×line-1이면 중앙선을 전체 center로 바꾸고 내부 차선 목록을 만든다. 차선점 수와 선 수가 다르면 로그 후 false이다. 일치하면 각 논리 기하·OL 선과 표시 기하를 교체한다.
        여러 구간이면 중앙/일반 선과 메시를 나누고 isEnd에 따라 마지막 또는 첫 구간을 고른다. 선택 구간 끝점에 가장 가까운 새 center 인덱스로 이전 선과 새 점들을 접합한다.
        접합 center에서 차선점을 만들고 중앙선·선택 차선 기하를 교체한다. 중앙선 폭은1, 점선 폭은0.5이다.
updateRoadLine(center)
    의존:
        UMesh — 처리할 자식 메시 종류; 상수: {UMesh}
        U3dApp — 표시 선의 지형 높이; 함수: {getRenderHeightAtPoint()}
        ULineGeometry — 중앙선 점 조회·기하 교체; 생성자: {new ULineGeometry()}; 함수: {getPoints(), setPoints()}
        UDashLineGeometry — 점선 점 조회·기하 교체; 생성자: {new UDashLineGeometry()}; 함수: {getPoints(), setPoints()}
    동작: UMesh 자식의 첫 표시점과 가장 가까운 center를 찾고 점 개수에 맞는 중심 구간을 잡는다. 각 선점 z를 중심 높이+0.08로 바꾸고 더 높은 지형이 있으면 지형+0.08로 올린다. 중앙·점선 종류에 맞게 새 기하로 교체한다.
appendPointsAry(result, target)
    동작: target이 비면 result 원본을 반환한다. result 끝과 target 첫 점이 xyz 모두 같으면 target 첫 요소를 원본에서 제거하고 두 배열을 연결한 새 배열을 반환한다.
appendPointsAryToFront(result, target)
    동작: target이 비면 result 원본을 반환한다. result 처음과 target 끝의 xy가 같으면 target 끝을 원본에서 제거하고 target+result의 새 배열을 반환한다. z는 중복 판정에 사용하지 않는다.
splitPoints(p1, p2, interval)
    의존: THREE.Vector3 — 선분 방향·보간점; 생성자: {new Vector3()}
    동작: 거리/interval을 floor한 step이 0이면 입력점 원본 두 개를 반환한다. 그 외에는 복제 시작점과 interval 간격의 중간점을 만들고 마지막 p2 원본을 덧붙인다.
computeUV(faces, height)
    동작: ratio=height/10을 구하고 face의 a·b·c를 각각4로 나눈 나머지를 UV에 대응시켜 삼각형별 배열로 반환한다.
getUV(v, ratio)
    의존: THREE.Vector2 — UV 생성; 생성자: {new Vector2()}
    동작: 0은(0,0), 1은(0,1), 2는(ratio,0), 3은(ratio,1)을 반환한다. 그 외는 undefined이다.
computeVertex(points, width)
    동작: 인접 중심점 쌍의 시작 양측점을 순서대로 연결하고 마지막 구간의 끝 양측점을 추가한다.
computeShapeVertex(points, width)
    동작: 각 구간의 시작 양측점을 얻어 이전에 채택한 같은 쪽 점과 거리가10보다 클 때만 추가한다. 마지막 끝점도 같은 기준으로 추가한다. 왼쪽+오른쪽 역순+첫 왼쪽 점으로 닫은 윤곽을 반환한다.
computeFace(start, end)
    의존:
        THREE — 초기 법선 벡터; 생성자: {new Vector3()}
        U3dRecoveredFace3 — 삼각형 구성; 생성자: {new U3dRecoveredFace3()}
    동작: start 이상 end 미만의 각 i에 대해 짝수는(i,i+1,i+2), 홀수는(i+1,i,i+2)로 만들어 면 방향을 맞춘다. 초기 법선은(0,0,-1)이다.
extractRoadPoint(point1, point2, width, end)
    의존: THREE.Vector3 — 좌우 경계점; 생성자: {new Vector3()}
    동작: 두 점이 완전히 같으면 빈 배열이다. 진행 방향과 +Z축의 외적으로 수평 수직방향을 구해 길이를 width로 맞추고 양 끝의 ±경계점을 만든다. 계산한 끝 양측점 x가 NaN이면 빈 배열이다. end이면 끝의 음/양 점, 아니면 시작의 음/양 점을 반환한다.
createRoadLine(centers, width, line)
    동작: l=1부터 line 미만까지 width/line×l 거리의 양측 선점을 만든다. 인접 구간 시작점들과 마지막 구간 끝점을 연결해 왼쪽·오른쪽 선 배열을 차례로 반환한다.
debugPOI(ary, color)
    의존:
        U3dPOI — 디버그 점 객체; 생성자: {new U3dPOI()}
        UGroup — 디버그 그룹 연결; 함수: {add()}
    동작: 각 점 위치에 인덱스 라벨과 지정 색상의 POI를 생성하여 모듈 공유 DEBUG_GROUP에 추가한다.
```

## 4. 공통 처리 기준과 제약

```spec
도로 생성·편집은 기존 center·origin·geometry를 직접 변경한다. 실패 분기 앞에서 일어난 모든 변경을 자동 복구하는 트랜잭션은 없다.
지형 갱신은 중심선의 양수 높이 판정, 경계점의 높이 비교, 연결부의 -20 보정이 서로 다르다. 한 가지 결측·높이 정책으로 합치지 않는다.
점 배열 연결 함수는 경계 중복 제거를 위해 target 원본을 변경한다. 반복 호출자는 원본 길이 변화와 반환 배열의 공유 점 참조를 고려해야 한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
