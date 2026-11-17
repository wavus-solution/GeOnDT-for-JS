# U3dCustomModelMesh 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

이미 만들어진 메시를 사용자 건물 편집 객체로 감싸 라벨·경계·직렬화 정보를 제공한다.

### 1.2 책임 범위

입력 메시를 UGroup에 넣고 사용자 모델의 메타데이터와 변경 이벤트를 연결한다. 돌출형 건물과 달리 높이 재생성·텍스처 설정·바닥 도형 반환은 지원하지 않는다.

### 1.3 주요 동작 방식

입력 메시의 위치·경계를 설정하고 높이를 경계로부터 계산한다. onChange에서는 편집된 메시의 경계와 높이를 다시 읽어 기반 모델의 높이 갱신 경로로 전달한다.

### 1.4 주요 사용처와 연계 대상

U3dCustomModel의 공통 편집·표시 기능을 상속하여 병합 또는 외부 메시를 사용자 모델로 다룬다. UGroup·U3dPOI·UEventDispatcher가 결과 그룹, 라벨과 변경 통지를 제공한다.

## 3. 정규 자연어 수도코드

```spec
U3dCustomModelMesh extends U3dCustomModel 클래스 정의
    의존:
        U3dCustomModel — 사용자 모델 공통 처리; 상속: {U3dCustomModel}
        subExtends — 모듈 평가 시 이벤트 기능 혼합; 함수: {subExtends()}
        UEventDispatcher — 혼합할 이벤트 구현; 상속: {UEventDispatcher}

    _name
        사용자 모델 이름
    _classtype: string = 'U3dCustomModelMesh'
        메시 기반 모델 구분
    _isInitialized: boolean = false
        모델 초기화 상태
    _version: string = '1.3'
        직렬화 버전
    _modeltype
        UDEF.CUSTOM_MODEL.TYPE.GEOMETRY 모델 종류
    _drawArg
        앱과 장면에 접근하는 실행 환경
    _object: UGroup
        입력 메시를 보관하는 그룹
    _position: Vector3
        입력 위치로 시작하며 메시 경계 중심으로 갱신한다.
    _boundingBox, _bbox
        경계 캐시
    _mesh
        입력 mesh 참조
    _extrudeHeight: number
        현재 메시의 월드 경계 높이
    _zOffset: number
        저장된 지형 기준 높이
    _useBox: boolean
        경계 표시 옵션
    _style, _textureUrl, _textureVisible, _textures, _floorHeight
        기반 모델 인터페이스에서 사용하는 스타일·텍스처·층 높이 상태
    _helper: Box3Helper
        모델 경계 표시 객체
    _labelText: string
        라벨 내용
    _buildingArea, _floor, _totalArea: number = 0
        현재 메시 기반 모델에서 계산하지 않는 면적·층수
    _landArea, _floorAreaRatio, _buildingCoverageRatio
        입력한 대지·비율 정보

    constructor(opt)
        의존:
            U3dCustomModel — 옵션 없는 기반 초기화; 생성자: {super()}
            subExtends — 혼합 객체 초기화; 함수: {subSuper()}
            UEventDispatcher — 이벤트 등록; 생성자: {new UEventDispatcher()}; 함수: {addEventListener()}
            UDEF — 메시·geometry 단언과 모델 종류; 정적 함수: {assert()}; 상수: {CUSTOM_MODEL.TYPE.GEOMETRY}
            defined — 입력과 높이 존재 확인; 함수: {defined()}
            defaultValue — 모델 옵션 기본값; 함수: {defaultValue()}
            Guid — 미지정 이름 생성; 함수: {Guid()}
            UGroup — 모델 보관 그룹; 생성자: {new UGroup()}
            THREE — 위치·입력 메시 경계·헬퍼; 생성자: {new Vector3(), new Box3(), new Box3Helper()}; 함수: {Box3.setFromObject()}; 상수: {FrontSide}
        동작:
            옵션 없이 기반 모델을 만들고 이벤트 초기화 속성을 혼합한다.
            opt.mesh와 그 BufferGeometry를 단언하고 이름·종류·그룹·입력 메시를 저장한다.
            opt.position의 XYZ로 위치 벡터를 만들고 입력 mesh.position을 같은 좌표로 바꾼다.
            opt.extrudeheight가 정의되지 않았으면 입력 메시 경계의 z 크기를 opt.extrudeheight에 기록한다.
            높이는 Number로, zoffset은 undefined일 때 0을 적용한 Number로 저장한다.
            usebox 기본 false, 기본 스타일은 색 0x3399CC·앞면·metalness 0·roughness 1·opacity 1·transparent false로 보관한다.
            텍스처 URL·가시성·빈 텍스처 대응표·floorHeight 기본 3과 라벨·면적 관련 옵션을 저장한다.
            onChange를 현재 객체에 bind하여 변경 이벤트에 등록한다.
            경계 helper를 만들고 입력 메시를 사용자 모델로 구성한다.

    override setTexture() -> void
        의존: Web API — 미지원 안내; 함수: {console.debug()}
        동작: 병합 모델의 텍스처 설정 미지원 안내만 출력한다.

    override removeTexture() -> void
        동작: 아무 작업도 수행하지 않는다.

    static createMeshFromObject(option) -> UMesh
        의존:
            UDEF — 입력 단언과 모델 재질 설정; 정적 함수: {assert(), settingModelLayerMaterial()}
            defined — 선택 인덱스·텍스처 URL 존재 확인; 함수: {defined()}
            THREE — 정점·UV·인덱스 geometry; 생성자: {new BufferGeometry(), new Float32BufferAttribute()}; 함수: {BufferGeometry.setAttribute(), BufferGeometry.setIndex(), BufferGeometry.computeVertexNormals(), BufferGeometry.computeBoundingBox()}
            UMesh — 복원 메시 생성; 생성자: {new UMesh()}
            Web API — 텍스처 미구현 안내; 함수: {console.info()}
        동작:
            option.vertex와 option.uv가 정의되어 있는지 단언한다.
            각 객체의 키 개수만큼 숫자 인덱스 0부터 값을 읽어 position 3성분·uv 2성분 속성으로 구성한다.
            option.index가 있으면 같은 방식으로 값 배열을 만들어 인덱스로 설정한다.
            option.textureurl이 정의되어 있으면 준비중 로그만 출력한다. 텍스처 URL 유무와 관계없이 정점 노멀과 경계를 계산한다.
            기본 Lambert 재질을 만들고 모델 레이어 재질 설정을 적용하여 새 UMesh를 반환한다.

    createCustomModelMesh(mesh) -> UGroup
        의존:
            UDEF — 건물 메시 종류; 상수: {UMESH_TYPE._building}
            UMesh — 경계·행렬 반영; 함수: {getBBox(), updateMatrix(), updateMatrixWorld()}
            THREE.Box3 — 월드 경계; 생성자: {new Box3()}; 함수: {setFromObject(), getCenter()}
            UGroup — 메시 추가; 함수: {add()}
            U3dPOI — 모델 라벨 생성·표시; 생성자: {new U3dPOI()}; 함수: {show()}
            U3dApp — 라벨 장면 등록; 함수: {_sceneComment.add()}
        동작:
            mesh의 이름·레이어 이름을 모델 이름으로 설정하고 그림자 생성·수신과 건물 종류를 지정한다.
            getBBox 결과를 _bbox로 보관하고 경계 중심을 _position에 반영한다.
            메시 로컬·월드 행렬을 갱신하고 월드 경계를 mesh._boundingBox에 저장한 뒤 _object에 추가한다.
            월드 경계 z 크기를 _extrudeHeight로 저장한다.
            메시 위치에 라벨 POI를 만들고 mesh.userData.label에 저장·표시한 뒤 앱 주석 장면에 추가한다.
            mesh.userData.class에 현재 모델 참조를 저장하고 helper.box에 메시 경계를 연결하여 _object를 반환한다.

    override getParameter() -> object | undefined
        의존:
            UDEF — 첫 메시와 geometry 단언; 정적 함수: {assert()}
            defined — 메시·geometry 존재 확인; 함수: {defined()}
            U3dCustomModel — 지형 기준 높이; 함수: {getLandHeight()}
            THREE — geometry 인덱스·색상 조회; 함수: {BufferGeometry.getIndex(), Color.getHexString()}
        동작:
            그룹 첫 메시가 BufferGeometry를 가진지 단언한다.
            버전·모델 종류·이름·높이·지형 높이와 메시 position·rotation·scale을 반환 객체에 담는다.
            position·uv의 실제 배열과 getIndex 결과 참조, 메시 position을 center로 담는다.
            재질이 배열이면 첫 재질에서, 단일이면 해당 재질에서 색상·opacity를 읽어 style에 담는다.
            _textures의 키 배열을 textureUrl, 라벨 내용을 labeltext로 기록한다.
            어느 과정에서든 예외가 나면 객체 대신 undefined를 반환한다.

    override setHeight(height: number) -> void
        의존:
            U3dMessage — 병합 모델 미지원 안내; 정적 함수: {info()}; 상수: {CNT.ANALY.NOT_EXECUTE_MERGE_CUSTOM_MODEL}
            UDrawArg — 갱신 요청; 함수: {setUpdateDate()}
        동작: 미지원 안내를 출력하고 현재 높이와 입력이 같으면 종료한다. 다르면 높이를 바꾸지 않고 갱신 시각만 요청한다.

    override getBottomShapeVertex() -> Array
        의존: U3dMessage — 병합 모델 미지원 안내; 정적 함수: {info()}; 상수: {CNT.ANALY.NOT_EXECUTE_MERGE_CUSTOM_MODEL}
        동작: 미지원 안내를 출력하고 새 빈 배열을 반환한다.

getDefaultMaterial() -> MeshLambertMaterial
    의존: THREE — 기본 Lambert 재질 생성; 생성자: {new MeshLambertMaterial()}; 상수: {FrontSide}
    동작: 색상 0x3399CC·앞면·transparent true의 재질을 만들고 needsUpdate를 true로 설정하여 반환한다.

onChange() -> void
    인터페이스: this는 변경 이벤트를 등록한 U3dCustomModelMesh이다.
    의존:
        defined — 편집 대상 메시 존재 확인; 함수: {defined()}
        UMesh — 변경된 모델 경계; 함수: {getBBox()}
        U3dCustomModel — 지형 높이 조회·갱신; 함수: {getLandHeight(), updateHeight()}
    동작:
        _object 첫 자식이 없으면 종료한다.
        경계 z 크기를 높이로 계산하고 helper.box를 현재 경계로 바꾼다.
        건축면적과 층수는 0으로 유지하고 _extrudeHeight와 연면적을 갱신한다.
        getLandHeight 결과를 _zOffset에 저장한 뒤 기반 updateHeight를 호출한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
