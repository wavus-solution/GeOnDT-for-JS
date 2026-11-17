# UPlaneBufferGeometry 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UPlaneBufferGeometry`는 지형 타일 한 장을 그리는 격자형 평면 geometry이다. 가장자리에 스커트 정점을 두어 인접 타일과의 틈을 가리고, 같은 크기·분할의 격자 자료를 템플릿 캐시에서 재사용하며, 타일 메시와 이미지 레이어의 지형 메시가 같은 geometry 객체를 함께 쓸 수 있도록 소유자 수를 세어 마지막 소유자가 돌려줄 때만 GL 자원을 해제한다.

### 1.2 책임 범위

- 크기·분할 수·오프셋·스커트 여부·기본 높이로 정점, 노멀, UV, 인덱스와 바운딩 볼륨을 생성한다.
- 같은 크기·분할의 격자 자료를 정적 템플릿 캐시에 저장하고 재사용한다.
- `share()`와 `dispose()`로 이 객체를 함께 쓰는 소유자 수를 관리한다.
- 다른 `UPlaneBufferGeometry`의 attribute 객체와 격자 속성을 이 객체에 끼워 넣는 `change()`와 값 복사 `copy()`·`clone()`을 제공한다.
- 스커트를 포함한 격자에서 정점 좌표 조회와 정점 노멀 계산을 제공한다.
- 편집 지형 영역인 커스텀 박스를 등록·조회·삭제하고 오프셋이 적용된 바운딩 박스를 제공한다.

책임 경계: 정점 z에 실제 고도를 기록하는 일과 GPU 재업로드 표시는 `U3dHeightLayer` 같은 사용자가 담당한다. 이 geometry를 그리는 메시의 생성과 장면 등록은 `UTileMesh`, `UTerrainMesh`와 각 레이어가 담당한다.

### 1.3 주요 동작 방식

생성 시 크기·분할로 템플릿 캐시 키를 만들고, 캐시가 있으면 저장된 배열을, 없으면 좌상단 원점 기준으로 스커트를 포함한 격자를 계산해 캐시에 넣은 뒤 Uint16 인덱스와 Float32 정점·노멀, 가능하면 Float16 UV attribute를 만든다. 생성 직후 소유자 수는 1이며, 다른 메시가 `share()`로 받아 쓰면 1씩 늘고 `dispose()`마다 1씩 줄어 0이 될 때만 기반 클래스의 GL 해제가 실행된다. 고도 레이어가 만든 다른 geometry의 attribute를 타일 geometry에 끼울 때는 `change()`가 attribute 객체와 격자 속성을 참조로 옮기고 바운딩 볼륨의 z 범위만 갱신한다.

### 1.4 주요 사용처와 연계 대상

- `UTileMesh`가 타일마다 2×2 분할의 초기 geometry를 생성하며, `U3dQuadTile.changeGeometry()`가 `UTileMesh.changeGeometry()`를 거쳐 `change()`로 고도 레이어의 geometry attribute를 끼운다.
- `U3dHeightLayer`가 타일 키별 지형 geometry를 생성·등록하고 정점 배열과 노멀을 제자리에서 갱신한 뒤 `computeVertexNormals()`와 커스텀 박스 API를 사용한다.
- `UTerrainMesh`가 생성자에서 `tile._mesh.geometry.share()`로 타일 geometry를 공유해 받고, `U3dImageLayer.deleteGeometry()`와 `U3dQuadTile`의 타일 메시 정리가 `dispose()`로 각자의 공유분을 돌려준다.
- `UHeightUtil`, `UHeightSkirt1_0`, `CustomLand`가 정점 조회, 스커트·비율·기본 높이 조회, 오프셋 바운딩 박스와 커스텀 박스를 사용한다.
- `U3dModelBasicLayer`가 독립 평면 geometry를 생성해 정점 배열을 직접 채운다.
- 관찰된 실행 특성: 65 분할 스커트 타일 하나의 정점·노멀·UV·인덱스는 GPU 버퍼로 약 150~200KB이며, GL 해제 뒤 다시 그리면 three.js가 이 버퍼를 다시 올린다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
같은 geometry 객체를 쓰는 모든 소유자는 share()로 받고 dispose()로 돌려주어야 하며, 마지막 소유자가 돌려줄 때만 GL 자원이 해제되어야 한다.
어떤 소유자도 다른 소유자의 공유분을 대신 돌려주어서는 안 되며, 공유분 반납이 남은 소유자가 그리는 GL 버퍼를 지워서는 안 된다.
정점 배열을 제자리에서 고친 뒤 GPU에 다시 올릴 때는 attribute의 needsUpdate를 사용해야 하며 dispose()를 재업로드 수단으로 사용해서는 안 된다.
```

```spec
```

## 3. 정규 자연어 수도코드

```spec
pA, pB, pC, pD, c1, c2, cM: Three.js Vector3 = 새 Vector3
    computeVertexNormals()가 삼각형 꼭짓점과 외적을 계산할 때 재사용하는 모듈 공유 임시 벡터

    의존:
        Three.js — 모듈 공유 임시 벡터 생성; 생성자: {new Vector3()}

UPlaneBufferGeometry extends UBufferGeometry 클래스 정의
    의존:
        UBufferGeometry — BufferGeometry 래퍼와 dispose 플래그 제공; 상속: {UBufferGeometry}

    #skirtIndex: number = 1
        스커트가 격자 가장자리에서 차지하는 정점 줄 수이며 스커트를 쓰지 않으면 0이다.

    #ratio: number = 1
        정점 조회 인덱스를 나누는 격자 해상도 비율이며 change()와 copy()로만 바뀐다.

    #defaultHeight: number
        고도 자료가 없는 정점에 기록하는 기본 높이

    #shareCount: number = 1
        이 geometry 객체를 쓰는 소유자 수이며 생성이 첫 소유이다.

    classtype: string = 'UPlaneBufferGeometry'
        클래스 식별 문자열

    _uwidth, _uheight: number | undefined
        스커트를 포함한 가로·세로 정점 수

    _skirt: boolean = true
        가장자리 스커트 사용 여부

    _offsetX, _offsetY: number = 0
        평면 원점을 이동한 값

    _offset: Three.js Vector3 = 새 Vector3
        _offsetX, _offsetY, 0을 담은 오프셋 벡터

    _segmentWidth, _segmentHeight: number | undefined
        스커트를 제외한 격자 한 칸의 가로·세로 길이

    _maxHeight, _minHeight: number | undefined
        사용자가 기록하는 정점 고도 범위이며 change()가 바운딩 박스 z 범위의 근거로 읽는다.

    _customBox: Map<string, UPlaneCustomBox> = 빈 Map
        식별자별 편집 지형 영역 저장소

    parameters: {width: number, height: number, widthSegments: number, heightSegments: number} | undefined
        initialize()가 기록하는 생성 크기와 분할 수

    _editedVertexMask: Uint8Array = new Uint8Array()
        스커트를 포함한 정점 순서의 편집 선택 표시이며 0은 미선택, 1은 평탄화·사면 선택이다.
    get editedVertexMask() -> Uint8Array
        동작: _editedVertexMask 참조를 반환한다.
    set editedVertexMask(value: Uint8Array) -> void
        동작: _editedVertexMask에 입력 참조를 저장한다.
    markEditedVertex(vertexIndex: number) -> boolean
        입력: 스커트를 포함한 0 기반 정수 정점 인덱스
        의존: UBufferGeometry — 현재 정점 수; 속성 읽기: {attributes.position}
        동작:
            position 정점 수를 읽고 속성이 없으면 0을 사용한다.
            정수가 아니거나 0 미만이거나 정점 수 이상이면 false를 반환한다.
            표시 배열 길이가 현재 정점 수와 다르면 그 크기의 빈 Uint8Array로 교체한다.
            해당 정점 표시를 1로 두고 true를 반환한다. 높이와 노멀은 변경하지 않는다.

    index: Three.js BufferAttribute | null
        기반 클래스가 소유하는 인덱스 attribute이며 change()가 대상 geometry의 인덱스 객체로 교체한다.

    static templateInfo: Record<string, UPlaneTemplateInfo> = 빈 일반 객체
        크기·분할 캐시 키별 격자 자료 저장소이며 클래스의 static 필드로 선언된다.

    constructor(width: number = 1, height: number = 1, widthSegments: number = 1, heightSegments: number = 1, offsetX: number = 0, offsetY: number = 0, skirt: boolean = true, defaultHeight: number = UDEF.TERRAIN_NO_DATA)
        역할: 스커트·오프셋·기본 높이를 기록하고 격자 자료를 생성한다.

        인터페이스:
            width, height는 평면의 가로·세로 길이이고 widthSegments, heightSegments는 스커트 줄을 포함한 분할 수이다.
            skirt가 false이면 스커트 없는 격자를 만든다.
            defaultHeight는 모든 정점 z의 초기값이다.

        처리 기준:
            width 또는 height가 null이면 격자를 생성하지 않아 attributes와 parameters가 비어 있는 객체가 된다. 기본값이 적용되는 생략은 생성 대상이다.
            생성 직후 소유자 수는 1이다.

        의존:
            UBufferGeometry — 기반 geometry 초기화; 함수: {constructor()}
            THREE — Three.js 오프셋 벡터 생성; 생성자: {new Vector3()}
            defined — width·height 존재 여부 판정; 함수: {defined()}
            UDEF — 기본 높이 기본값 제공; 상수: {TERRAIN_NO_DATA}

        동작:
            _skirt에 skirt를 저장하고 스커트를 쓰지 않으면 #skirtIndex를 0으로 둔다.
            _offsetX, _offsetY와 (offsetX, offsetY, 0)의 _offset을 기록한다.
            #defaultHeight에 defaultHeight를 저장한다.
            width와 height가 정의되어 있으면 격자 자료를 생성한다.

    공유 소유자 관리 책임 그룹
        역할: 같은 geometry 객체를 쓰는 소유자 수를 관리하고 마지막 소유자의 반납에서만 GL 자원을 해제한다.

        share() -> this
            인터페이스: 반환: 소유자 수가 1 늘어난 이 geometry이며 메시 생성자 인자에 바로 전달할 수 있다.
            처리 기준: 이미 GL 자원이 해제된 geometry에도 소유자 수를 늘리며 GL 버퍼를 다시 만들지는 않는다. 다음 렌더에서 three.js가 attribute를 다시 올린다.
            동작: #shareCount를 1 늘리고 this를 반환한다.

        getShareCount() -> number
            인터페이스: 반환: 현재 소유자 수이며 생성 직후는 1이다.
            동작: #shareCount를 반환한다.

        override dispose() -> void
            역할: 호출한 소유자의 공유분을 하나 돌려주고 마지막 소유자였으면 GL 자원을 해제한다.

            처리 기준:
                소유자 수가 1보다 크면 1만 줄이고 GL 자원과 _disposed 플래그를 바꾸지 않는다.
                소유자 수가 1 이하이면 0으로 만들고 기반 클래스의 해제를 실행하며, 이후 반복 호출도 매번 기반 해제를 실행한다.
                정점 자료를 다시 올리기 위한 호출은 이 메서드의 대상이 아니다.

            의존:
                UBufferGeometry — three.js dispose 이벤트 전파와 _disposed 기록; 함수: {dispose()}

            동작:
                #shareCount가 1보다 크면 1 줄이고 종료한다.
                그 외에는 #shareCount를 0으로 두고 UBufferGeometry.dispose()를 호출한다.

    change(targetGeometry: UPlaneBufferGeometry) -> UPlaneBufferGeometry
        역할: 다른 geometry의 attribute 객체와 격자 속성을 이 객체에 끼워 넣어 같은 정점 자료를 그리게 한다.

        인터페이스:
            targetGeometry는 attribute와 격자 속성을 가져올 원본이다.
            반환: 이 geometry

        처리 기준:
            attribute는 새로 만들거나 복사하지 않고 targetGeometry의 position·normal·uv·index 객체를 그대로 참조하며, 이 객체가 이전에 갖던 attribute 객체의 GL 버퍼는 이 메서드가 해제하지 않는다. [확인 Q-003]
            _customBox는 targetGeometry의 Map 객체를 그대로 참조한다. [확인 Q-004]
            편집 선택 표시는 targetGeometry.editedVertexMask와 같은 배열을 참조한다.
            _maxHeight와 _minHeight 값 자체는 복사하지 않고 이 객체의 boundingBox z 범위에만 반영한다.
            이 객체의 boundingBox 또는 boundingSphere가 없으면 바운딩 갱신과 #ratio·#skirtIndex·#defaultHeight 복사를 건너뛰고 반환한다. [확인 Q-003]
            _offsetX, _offsetY, _offset은 바꾸지 않는다.

        의존:
            UBufferGeometry — attribute·인덱스 참조 교체와 바운딩 볼륨 갱신; 속성 읽기·쓰기: {attributes.position, attributes.normal, attributes.uv, index, boundingBox, boundingSphere}; 함수: {Box3.getBoundingSphere()}

        동작:
            attributes.position, attributes.normal, attributes.uv와 index를 targetGeometry의 같은 객체로 바꾼다.
            parameters, _uwidth, _uheight, _segmentWidth, _segmentHeight, _customBox와 _skirt를 targetGeometry 값으로 덮어쓴다.
            _editedVertexMask에 targetGeometry.editedVertexMask 참조를 저장한다.
            boundingBox와 boundingSphere가 모두 있으면 boundingBox의 max.z·min.z를 targetGeometry의 _maxHeight·_minHeight로 바꾸고 boundingSphere를 다시 계산한다.
            #ratio, #skirtIndex와 기본 높이를 targetGeometry에서 가져와 기록하고 this를 반환한다.

    override copy(source: UPlaneBufferGeometry) -> this
        역할: 다른 geometry의 attribute 복제본과 격자 속성을 이 객체에 기록한다.

        처리 기준:
            attribute와 인덱스는 기반 클래스가 복제하여 이 객체가 독립 소유한다.
            _offset, parameters와 _customBox는 source의 같은 객체를 참조한다. [확인 Q-004]
            편집 선택 표시는 source.editedVertexMask를 새 Uint8Array로 복제하여 독립 소유한다.
            소유자 수는 복사하지 않아 이 객체의 값이 유지된다.

        의존:
            UBufferGeometry — attribute·인덱스·바운딩 볼륨·이름 복제; 함수: {copy()}

        동작:
            기반 클래스의 복제로 attribute, 인덱스, 바운딩 볼륨과 이름을 가져온다.
            _uwidth, _uheight, _skirt, _offsetX, _offsetY, _offset, parameters, _segmentWidth, _segmentHeight, _customBox, _maxHeight와 _minHeight를 source 값으로 덮어쓴다.
            #ratio, #skirtIndex와 기본 높이를 source에서 가져와 기록하고 this를 반환한다.

    override clone() -> this
        역할: 이 geometry와 같은 격자 자료를 가진 새 객체를 만든다.

        처리 기준:
            기반 클래스의 clone()을 사용하지 않으므로 UBufferGeometry가 이름에 붙이는 복제 표식은 적용되지 않는다.
            새 객체는 기본 인자로 1×1 격자를 먼저 생성한 뒤 copy()로 덮어쓰며 소유자 수는 1이다.

        동작:
            기본 인자로 새 UPlaneBufferGeometry를 만든다.
            새 객체의 copy()에 이 객체를 전달하여 attribute 복제본과 격자 속성을 채운 뒤 반환한다.

    격자 속성 조회 책임 그룹
        역할: 생성·교체로 확정된 격자 속성을 조회하거나 기본 높이를 바꾼다.

        getDefaultHeight() -> number
            동작: #defaultHeight를 반환한다.

        setDefaultHeight(height: number) -> number
            인터페이스: 반환: 저장한 기본 높이
            동작: #defaultHeight에 height를 저장하고 반환한다.

        getSkirtIndex() -> number
            동작: #skirtIndex를 반환한다.

        getRatio() -> number
            동작: #ratio를 반환한다.

        isSkirt() -> boolean
            동작: _skirt를 반환한다.

        getSegmentCount() -> number | undefined
            인터페이스: 반환: 스커트를 포함한 가로 정점 수이며 격자가 없으면 undefined
            동작: _uwidth를 반환한다.

        getVertex() -> ArrayLike<number>
            인터페이스: 반환: position attribute의 배열
            의존: UBufferGeometry — position attribute 접근; 속성 읽기: {attributes.position.array}
            동작: attributes.position.array를 반환한다.

        getOffset() -> Three.js Vector3
            동작: _offset을 반환한다.

    getPointAtIndex(x: number, y: number, includeSkirt: boolean = true) -> {x: number, y: number, z: number} | undefined
        역할: 격자 인덱스에 해당하는 정점 좌표를 반환한다.

        인터페이스:
            x, y는 가로·세로 격자 인덱스이다.
            includeSkirt가 true이면 스커트를 포함한 전체 격자, false이면 스커트를 제외한 내부 격자를 기준으로 인덱스를 해석한다.
            반환: 정점의 x, y, z이며 격자가 없거나 인덱스가 범위를 벗어나면 undefined

        처리 기준:
            _uwidth 또는 _uheight가 undefined이면 undefined를 반환한다.
            includeSkirt이면 0 이상 _uwidth-1·_uheight-1 이하, 아니면 0 이상 _uwidth-2×#skirtIndex-1·_uheight-2×#skirtIndex-1 이하를 벗어나는 x, y에 undefined를 반환한다.
            배열 위치는 스커트 보정을 더한 뒤 x와 y를 #ratio로 나눈 값으로 계산하므로 #ratio가 1이 아니면 정수가 아닌 위치가 될 수 있다. [확인 Q-005]

        의존:
            UBufferGeometry — position attribute 접근; 속성 읽기: {attributes.position.array}

        동작:
            격자 크기와 includeSkirt 기준으로 x, y의 범위를 검사한다.
            스커트 보정(includeSkirt이면 0, 아니면 #skirtIndex)과 #ratio로 정점 배열 위치를 계산한다.
            해당 위치의 x, y, z를 객체로 반환한다.

    override computeVertexNormals() -> void
        역할: 현재 전체 표면의 법선을 재계산하고 인접 표면 값을 스커트에 복사한다.
        처리 기준:
            스커트가 없으면 기반 클래스에 위임한다. 스커트가 있으면 이전 전체 XYZ를 초기화하여 법선이 누적되지 않게 한다.
            position·normal 속성 및 배열, 높이와 bounds를 교체하거나 GPU 재업로드 표시를 하지 않는다.
        의존: UBufferGeometry — 스커트 없는 전체 계산과 정규화; 함수: {computeVertexNormals(), normalizeNormals()}; 속성 읽기: {attributes.position.array, attributes.normal.array}
        동작:
            _skirt가 false이면 UBufferGeometry.computeVertexNormals()를 호출하고 종료한다.
            position·normal 배열을 읽고 _uwidth 또는 _uheight가 undefined이면 종료한다.
            법선 배열을 모두 0으로 채우고 실제 스커트 인덱스에서 전체 셀을 누적한다.
            위·아래·왼쪽·오른쪽 순서로 스커트에 인접 표면의 정규화 전 법선을 복사한 뒤 전체 법선을 정규화한다.

    computeBoundaryVertexNormals() -> void
        역할: 실제 표면 경계 높이 한 줄만 바뀐 뒤 영향받는 표면 두 줄과 스커트의 법선을 갱신한다.
        처리 기준:
            나머지 내부 법선은 현재 정점에 대해 유효해야 한다. 원본·품질 변경과 미확정 내부 법선은 호출자가 전체 계산으로 처리한다.
            position·normal 속성 및 배열, 높이와 bounds를 교체하거나 GPU 재업로드 표시를 하지 않는다.
        의존: UBufferGeometry — 공유 속성; 속성 읽기: {attributes.position, attributes.normal}
        동작:
            공통 지원 판정이 false이면 기존 전체 계산을 호출하고 종료한다. 비표준 격자는 전체 계산을 사용한다.
            스커트를 포함한 바깥 세 줄의 XYZ만 0으로 초기화한다.
            대상 정점에 기여하는 인접 셀 전체를 기존 행·열 순서로 계산하여 대상 법선만 누적한다.
            기존 순서로 스커트에 인접 표면의 정규화 전 법선을 복사하고 바깥 세 줄만 정규화한다. 대상 밖 내부 성분은 다시 정규화하지 않는다.

    _supportsBoundaryVertexNormals() -> boolean
        역할: 부분 법선 계산과 경계 실행기의 부모 법선 부분 상속에서 같은 격자 지원 조건을 제공한다.
        처리 기준: 배열·상태를 변경하지 않는다.
        의존: UBufferGeometry — 공유 속성 조회; 속성 읽기: {attributes.position, attributes.normal}
        동작:
            _skirt가 참이며 스커트 인덱스와 ratio가 1이어야 한다.
            가로·세로는 4보다 큰 정수이고 position·normal의 itemSize는 3이며 normalized는 false이어야 한다.
            두 배열이 Float32Array이고 각 정점 수가 가로×세로와 같으면 true이며 나머지는 false이다.

    템플릿 캐시 책임 그룹
        역할: 같은 크기·분할의 격자 자료를 한 번만 계산해 재사용한다.

        static getCacheKey(width: number, height: number, widthSegments: number, heightSegments: number) -> string
            처리 기준:
                width와 height는 소수 첫째 자리까지 반올림한 문자열로 쓰고 분할 수가 0 또는 falsy이면 1로 대체한다.
                스커트 여부는 키에 포함되지 않는다. [확인 Q-006]
            동작: 네 값을 밑줄로 연결한 문자열을 반환한다.

        static getCache(width: number, height: number, widthSegments: number, heightSegments: number) -> UPlaneTemplateInfo | undefined
            동작: 캐시 키에 해당하는 templateInfo 항목을 반환한다.

    initialize(width: number, height: number, widthSegments: number, heightSegments: number, defaultHeight: number) -> boolean
        역할: 생성 매개변수를 기록하고 격자 자료 생성을 시작한다.
        인터페이스: 반환: 항상 true
        의존: UBufferGeometry — 새 격자의 정점 수; 속성 읽기: {attributes.position}
        동작:
            parameters에 width, height, widthSegments, heightSegments를 기록한다.
            격자 자료를 생성한다.
            현재 position 정점 수와 같은 길이의 빈 Uint8Array를 _editedVertexMask에 기록한다.
            true를 반환한다.

    _createMesh(width: number, height: number, widthSegments: number, heightSegments: number, defaultHeight: number = UDEF.TERRAIN_NO_DATA) -> void
        역할: 템플릿 캐시 또는 새 계산으로 격자 배열을 얻어 attribute와 바운딩 볼륨을 만든다.

        인터페이스:
            width, height가 falsy이면 1로 대체한다.
            defaultHeight는 새로 계산하는 정점의 z 초기값이다.

        처리 기준:
            캐시 항목이 있으면 그 배열과 격자 크기를 그대로 사용하고 defaultHeight는 적용하지 않는다. [확인 Q-006]
            새로 계산할 때 분할 수가 falsy이면 1로 대체하고, 스커트가 있으면 한 칸 길이는 분할 수에서 2를 뺀 값으로 나눈다.
            정점은 좌상단 원점에서 행 우선으로 생성하며 x는 0에서 width로 커지고 y는 0에서 -height로 작아진다.
            스커트가 있으면 첫 두 줄·열과 마지막 두 줄·열의 정점 위치가 가장자리 위치를 반복하고 UV도 0 또는 1로 고정된다.
            인덱스는 각 칸을 (a, b, d), (b, c, d) 두 삼각형으로 만들며 Uint16 attribute를 사용한다.
            UV attribute는 Float16을 지원하면 UFloat16BufferAttribute, 아니면 Float32를 사용한다.
            바운딩 박스는 z 범위 0인 평면 범위로 만들고 boundingSphere를 새로 계산한다.

        의존:
            defined — 캐시 항목 존재 여부 판정; 함수: {defined()}
            UDEF — 기본 높이 기본값 제공; 상수: {TERRAIN_NO_DATA}
            THREE — Three.js 인덱스·정점·노멀·UV attribute와 바운딩 볼륨 생성; 생성자: {new Uint16BufferAttribute(), new Float32BufferAttribute(), new Box3(), new Vector3(), new Sphere()}; 함수: {Box3.clone(), Box3.getBoundingSphere()}
            UFloat16BufferAttribute — Float16 지원 판정과 UV attribute 생성; 정적 함수: {isAvailable()}; 생성자: {new UFloat16BufferAttribute()}
            UBufferGeometry — attribute 등록과 바운딩 볼륨 기록; 함수: {setIndex(), setAttribute()}; 속성 쓰기: {boundingBox, boundingSphere}

        동작:
            캐시 키를 만들고 templateInfo에서 항목을 찾는다.
            항목이 있으면 인덱스·정점·노멀·UV 배열, 바운딩 박스와 _uwidth, _uheight, _segmentWidth, _segmentHeight를 그대로 가져온다.
            항목이 없으면 분할 수로 정점 수와 한 칸 길이를 정하고 _uwidth, _uheight, _segmentWidth, _segmentHeight를 기록한다.
                각 정점의 위치, (0, 0, 1) 노멀과 스커트를 반영한 UV를 생성하고 각 칸의 두 삼각형 인덱스를 생성한다.
                평면 범위의 바운딩 박스를 만들고 계산한 자료를 templateInfo에 저장한다.
            배열로 Uint16 인덱스, Float32 position·normal, Float16 또는 Float32 uv attribute를 만들어 등록한다.
            바운딩 박스 복제본과 그것을 감싸는 boundingSphere를 기록한다.

    커스텀 박스 관리 책임 그룹
        역할: 편집 지형 영역을 식별자별로 보관하고 좌표 포함 여부를 판정한다.

        setCustomBox(minx: number, miny: number, maxx: number, maxy: number, height: number, id: string) -> void
            동작: _customBox에 id로 범위와 높이를 저장하거나 교체한다.

        clearCustomBox() -> void
            동작: _customBox를 비우고 _editedVertexMask의 모든 값을 0으로 채운다. 정점 높이와 노멀은 변경하지 않는다. 편집 삭제 후에는 원본 고도와 남은 편집을 다시 적용해야 한다.

        getCustomBox(id?: string) -> UPlaneCustomBox | Map<string, UPlaneCustomBox> | undefined
            인터페이스: id가 falsy이면 전체 Map을, 있으면 해당 항목 또는 undefined를 반환한다.
            동작: id 유무에 따라 전체 저장소 또는 id의 항목을 반환한다.

        removeCustomBox(boxId: string) -> void
            동작: _customBox에서 boxId 항목을 제거한다.

        isIncludeCustomBox(x: number, y: number) -> boolean
            처리 기준: 범위 비교는 경계값을 포함한다.
            동작: 저장된 박스 중 x, y를 범위 안에 포함하는 것이 하나라도 있으면 true, 없으면 false를 반환한다.

    getOffsetBox() -> Three.js Box3
        역할: 오프셋을 더한 바운딩 박스 복제본을 반환한다.

        처리 기준: boundingBox가 없으면 비어 있는 새 Box3를 반환한다.

        의존:
            UBufferGeometry — 바운딩 박스 접근; 속성 읽기: {boundingBox}
            THREE — Three.js 박스 복제와 이동, 빈 박스 생성; 함수: {Box3.clone(), Vector3.add()}; 생성자: {new Box3()}

        동작:
            boundingBox를 복제하고 _offset이 있으면 min과 max에 더하여 반환한다.

UPlaneTemplateInfo 타입 정의
    indices, vertices, normals, uvs: Array<number>
        캐시 키별로 한 번 계산한 인덱스·정점·노멀·UV 배열
    uwidth, uheight: number
        스커트를 포함한 가로·세로 정점 수
    segmentWidth, segmentHeight: number
        격자 한 칸의 가로·세로 길이
    boundingBox: Three.js Box3
        z 범위 0인 평면 범위

UPlaneCustomBox 타입 정의
    minx, miny, maxx, maxy: number
        편집 지형 영역의 평면 범위
    height: number
        영역에 적용할 높이

accumulatePlaneNormals(vertices: Float32Array, normals: Float32Array, width: number, height: number, skirtIndex: number, boundaryOnly: boolean) -> void
    동작:
        기존과 같은 행·열 오름차순으로 실제 표면 셀을 순회한다.
        부분 계산이면 가운데 행에서 열 3에 도달할 때 width-4까지 건너뛴다. 경계 두 줄에 기여하는 셀과 그 안쪽 한 셀의 기여를 포함하며 작은 격자는 중복 순회하지 않는다.
        각 셀을 누적한다.

accumulatePlaneNormalCell(vertices: Float32Array, normals: Float32Array, width: number, height: number, x: number, y: number, boundaryOnly: boolean) -> void
    의존: Three.js — 기존 공유 Vector3 연산; 함수: {Vector3.set(), Vector3.subVectors(), Vector3.cross(), Vector3.addVectors()}
    동작:
        현재 셀의 A·B·D·C 위치를 기존 공유 벡터에 읽는다.
        A-B-D와 B-C-D 삼각형 외적 및 두 외적의 합을 공유 임시 벡터에 계산한다.
        boundaryOnly가 거짓이면 링 판정 없이 A·C에 각각의 외적을, B·D에 합을 누적한 뒤 반환한다. 정점별 Float32 반올림과 기존 누적 순서를 보존한다.
        전체 경로의 조기 반환을 지난 나머지 실행에서 각 정점의 대상 링 여부를 검사한다.
        검사 결과가 참인 정점의 XYZ에만 A·C·B·D 순서로 누적하고 대상 밖 정점은 유지한다.

isPlaneNormalRing(width: number, height: number, x: number, y: number) -> boolean
    동작: x 또는 y가 3 미만이거나 x가 width-3 이상 또는 y가 height-3 이상이면 true를 반환한다.

processPlaneNormalRing(normals: Float32Array, width: number, height: number, normalize: boolean) -> void
    의존: Three.js — 기존 공유 Vector3의 초기화와 정규화; 함수: {Vector3.set(), Vector3.normalize()}
    동작:
        바깥 세 줄을 행·열 순서로 순회하고 가운데 영역은 건너뛴다. 작은 격자의 띠가 겹쳐도 정점을 중복 처리하지 않는다.
        normalize가 false이면 대상 XYZ를 0으로 쓰고 true이면 기존 Three.js와 같은 Vector3 정규화 결과를 Float32 성분으로 쓴다.

copyPlaneSkirtNormals(normals: Float32Array, width: number, height: number) -> void
    동작: 위·아래·왼쪽·오른쪽 순서로 바로 안쪽 표면의 XYZ를 스커트에 복사한다. 모서리도 같은 복사 순서로 확정하며 정규화는 호출자가 수행한다.

```

## 4. 공통 처리 기준과 제약

```spec
소유자 수는 이 geometry 객체 단위로만 관리한다. 다른 geometry 객체가 이 객체의 attribute 객체를 참조로 공유하면 그 객체의 dispose()는 공유 attribute의 GL 버퍼를 해제하며 소유자 수가 이를 막지 않는다.
정점 배열은 스커트를 포함한 _uwidth × _uheight 격자를 행 우선으로 (x, y, z) 3개씩 저장하며 원점은 좌상단이다.
인덱스는 Uint16이므로 스커트를 포함한 정점 수가 65536을 넘는 분할 수는 지원하지 않는다.
templateInfo는 최대 개수나 제거 정책 없이 크기·분할 키별 배열을 모듈 수명 동안 보관한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
