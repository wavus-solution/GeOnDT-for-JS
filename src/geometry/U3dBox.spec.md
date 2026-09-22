# U3dBox 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dBox`는 너비·높이·깊이와 세그먼트 수로 만든 육면체를 지도 위 한 점에 배치하는 3D 도형 클래스이다. `U3dGeometry`의 좌표·색상·투명도·속성 관리를 상속하고 `UMesh`를 믹스인하여 Three.js `Mesh`로 렌더된다. 단색 재질 또는 윗면에만 이미지를 입힌 6면 재질 배열을 만들 수 있고, 외곽선을 자식 `LineSegments`로 함께 그린다. 크기·세그먼트·이미지 URL 입력을 검증하고 실패를 `__GWarn__`·`__GError__`로 기록한다.

### 1.2 책임 범위

- 생성 옵션, `setSize()`, `setParam()`으로 받은 너비·높이·깊이·세그먼트·외곽선 여부를 검증·보관하고, 이 조합이 바뀐 경우에만 위도 기반 스케일과 곱해 `BoxGeometry`와 외곽선 `EdgesGeometry`를 재생성한다.
- 재질 타입(`basic`, `topimage`)에 따라 단일 `MeshBasicMaterial` 또는 6면 `MeshBasicMaterial` 배열을 생성하고, 생성 시점의 색상·투명도·와이어프레임을 반영한다. `topimage`인데 URL이 없거나 알 수 없는 타입이면 오류·경고를 기록하고 `basic`으로 대체한다.
- 단일 재질에 반복 텍스처를 입히는 `setTexture()`와 단일·배열 재질 모두에 비율 보정 이미지를 입히는 `setImage()`를 제공하며, 두 경로 모두 기존 텍스처를 해제하고 로드 실패·해제 후 도착을 처리한다.
- 첫 꼭짓점 좌표를 메시 위치로 반영하고 첫 위경도 좌표의 위도로 스케일을 갱신한다.

책임 경계: 위경도→월드 좌표 변환, Scene 등록·제거, 선택·라벨 표시는 소유 레이어와 `U3dGeometry`가 담당한다. 자원 해제는 자체 `dispose()`를 두지 않고 `UMesh.dispose()`에 위임한다.

### 1.3 주요 동작 방식

생성자는 기반 초기화를 지연시킨 채 `UMesh` 인스턴스 속성을 복사한 뒤 옵션을 검증하여 필드에 저장하고 `_initBox()`를 호출한다. `_initBox()`는 복사된 기본 재질을 해제하고 재질 타입을 판정·대체한 뒤 재질을 먼저 만들고, 스케일 1로 지오메트리와 외곽선을 만든 다음 기반 `setOpacity()`와 와이어프레임을 반영한다. 레이어가 좌표를 월드 좌표로 바꿔 `setVertex()`를 호출하면 `updateVertex()`가 위치와 위도 스케일을 갱신하고 지오메트리·외곽선을 다시 만든다. `setSize()`·`setParam()`은 값을 검증·저장한 뒤 `_updateBoxGeometry()`를 호출하며, 이 메서드는 크기·세그먼트·스케일·외곽선 조합이 마지막 생성과 같으면 재생성을 건너뛴다.

관찰된 실행 특성: 지오메트리 재생성은 조합이 바뀔 때만 새 `BoxGeometry`·`EdgesGeometry`를 만들고 이전 것을 해제하며, 재질은 생성 시 한 번만 만들어 이후 재사용한다.

### 1.4 주요 사용처와 연계 대상

- `GeOnDT.geom.U3dBox`로 공개되어 예제(`home/boxStart.html`, `tutorial-official`)에서 직접 생성되고 `U3dVectorLayer.addGeometry()`로 레이어에 등록된다.
- `U3dGeometryFactory`가 `'Box'` 타입 요청을 이 클래스로 생성한다.
- `type: 'topimage'`는 `integration/js/analy/Route.js`, `service/drone/js/route/RoutePort.js`에서 사용된다.
- 기반 `U3dGeometry.setLineColor()`는 `_outline`을 덕타이핑으로 읽어 외곽선 색상을 바꾼다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
너비·높이·깊이·세그먼트·외곽선 여부 또는 위도 스케일이 실제로 바뀐 경우에만 새 지오메트리와 외곽선을 만들고 이전 지오메트리·외곽선 자원을 해제해야 한다.
유효하지 않은 크기·세그먼트 입력은 경고를 기록하고 기존 값 또는 기본값을 유지해야 하며 지오메트리에 NaN·0 이하 값이 전달되어서는 안 된다.
텍스처 로드 실패는 __GError__로 기록되어야 하고, 인스턴스 해제 뒤 도착한 로드 결과는 재질에 반영되지 않아야 한다.
외곽선을 다시 만들 때는 현재 _lineColor를 사용하여 setLineColor()로 바꾼 색상이 유지되어야 한다.
getParam()이 반환한 객체를 setParam()에 다시 넣으면 크기·세그먼트·외곽선 여부가 보존되어야 한다.
```

## 3. 정규 자연어 수도코드

```spec
U3dBoxCO 타입 정의
    U3dGeometryCO, U3dOutlineAliasCO(U3dGeometry.types.js)와 U3dBoxCO_Content를 교차한 생성 옵션 전체 타입의 별칭이다. 소스의 Omit<U3dGeometryCO, never>는 의미 없는 기계장치로 U3dGeometryCO와 같다.

U3dBoxCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        width, height, depth?: number = 10
            육면체의 너비·높이·깊이(미터). 생략하면 DEFAULT_SIZE(10)를 쓰고, 양의 유한수가 아니면 경고 후 기본값을 쓴다.
        widthSegments, heightSegments, depthSegments?: number
            각 축의 분할 수. 생략하면 BoxGeometry 기본값(1)에 맡기고, 1 이상의 정수가 아니면 경고 후 생략으로 취급한다.
        type?: 'basic' | 'topimage' = 'basic'
            재질 타입. falsy 값과 지원하지 않는 값은 'basic'으로 대체한다(지원하지 않는 값은 경고 기록).
        topimageurl?: string
            type이 'topimage'일 때 윗면 재질에 로드할 이미지 URL. 누락이면 오류를 기록하고 type을 'basic'으로 대체한다.
        name, color, opacity, wireframe, showLabel, vertices, coordinates, properties
            기반 U3dGeometryCO가 소유하는 8개 옵션을 같은 의미로 이 typedef에 다시 선언한 것이며 기반 생성자가 처리한다(형제 U3dCylinder.types.js와 같은 패밀리 관례).
    외곽선 옵션 outline, useline, useLine, edge는 이 typedef에 누락되어 있고 교차된 U3dOutlineAliasCO가 선언한다. 런타임은 opt.outline ?? opt.useline ?? opt.useLine ?? opt.edge ?? false 순으로 읽는다. [확인 Q-007]

U3dBoxParam_Content 타입 정의
    width, height, depth: number
    widthSegments, heightSegments, depthSegments: number | undefined
    outline: boolean
        현재 useline 필드 값

U3dBoxParam 타입 정의
    U3dBoxParam_Content와 기반 U3dGeometryStyleParam(color, opacity, shadow, wireframe, depthOffset, dynamicDepthOffset, depthOffsetFunction, lineColor)을 교차한 getParam() 반환 타입의 별칭이다.

U3dBoxSize 타입 정의
    width, height, depth: number
        getSize()가 반환하는 스케일 적용 전 요청 크기(미터)

U3dBox extends U3dGeometry 클래스 정의
    의존:
        U3dGeometry — 좌표·색상·투명도·속성 기반 클래스; 상속: {extends U3dGeometry}
        UMesh — Mesh 동작 믹스인; 정적 함수: {subExtends(U3dBox, UMesh)}

    static DEFAULT_SIZE: number = 10
        너비·높이·깊이 기본값(미터)

    static OUTLINE_THRESHOLD_ANGLE: number = 1
        외곽선 EdgesGeometry 임계각(도)

    static TOP_FACE_MATERIAL_INDEX: number = 2
        topimage 타입에서 이미지를 적용하는 재질 인덱스(BoxGeometry +Y 윗면)

    width, height, depth: number
        현재 육면체 크기(스케일 적용 전 요청값, 미터). 외부 쓰기가 차단되지 않으며 직접 대입한 값은 다음 지오메트리 재생성 판정과 생성에 사용된다.

    widthSegments, heightSegments, depthSegments: number | undefined
        각 축 분할 수

    topimageurl: string | undefined
        윗면 이미지 URL. 생성 후 변경 경로가 없다.

    loader: TextureLoader | undefined
        type이 'topimage'일 때만 _initBox()가 만드는 윗면 이미지 로더. deprecated 공개 필드로 유지되며 그 외 경로에서는 읽지 않는다.

    type: 'basic' | 'topimage'
        재질 타입. 기반 U3dGeometry의 type 필드를 두 값으로 좁혀 재선언한다. _initBox()의 대체 판정 뒤에는 두 값 중 하나만 남고 생성 후 변경 경로가 없다.

    useline: boolean
        외곽선 표시 여부. 옵션·getParam()에서는 outline 이름을 쓴다. [확인 Q-007]

    _googleScale: number = 1
        첫 위경도 좌표의 위도로 계산한 크기 보정 배율. updateVertex()가 갱신하기 전까지 1이다.

    _outline: LineSegments | undefined
        현재 외곽선 객체. 자식으로 추가되며 기반 setLineColor()가 이 필드를 읽어 색상을 바꾼다.

    _disposed: boolean = false
        해제 여부. UMesh.dispose()가 true로 바꾸며 비동기 텍스처 콜백이 결과를 버릴지 판정한다.

    #geometryKey: string | undefined
        마지막 지오메트리 생성에 쓴 width·height·depth·세그먼트 셋·_googleScale·useline을 '|'로 이은 문자열. 같으면 재생성을 건너뛴다.

    material: MeshBasicMaterial | Array<MeshBasicMaterial> | undefined
        기반 U3dGeometry가 선언한 재질 참조. _initBox()가 type에 따라 단일 재질 또는 6면 배열을 대입한다.

    geometry: BoxGeometry
        기반 U3dGeometry가 선언한 지오메트리 참조. _updateBoxGeometry()가 새 BoxGeometry로 교체한다.

    wireframe: boolean
        기반 U3dGeometry가 선언한 와이어프레임 상태. #applyWireframe()이 재질 반영 뒤 같은 값으로 갱신한다.

    constructor(opt: U3dBoxCO = {})
        의존:
            U3dGeometry — 기반 상태 초기화; 상속: {super(opt, false)}
            UMesh — 새 UMesh 인스턴스의 자체 속성(geometry, material, _disposed 등)을 this에 복사; 함수: {subSuper(UMesh)}
            defaultValue — topimageurl 기본값 적용; 함수: {defaultValue()}
        동작:
            기반 생성자를 초기화 지연(isInit=false)으로 호출하여 색상·투명도·좌표 등 공통 상태만 저장한다.
            새 UMesh 인스턴스의 속성을 this에 복사하여 기본 UBufferGeometry와 Three.js Mesh 기본값인 새 MeshBasicMaterial을 갖는 Mesh 상태를 만든다.
            width·height·depth를 검증하여 저장하고 유효하지 않으면 DEFAULT_SIZE를 쓴다.
            세그먼트 셋을 검증하여 저장하고 유효하지 않으면 undefined를 쓴다.
            topimageurl은 undefined 허용으로 저장하고 type은 falsy이면 'basic'으로 저장한다.
            외곽선 여부는 opt.outline ?? opt.useline ?? opt.useLine ?? opt.edge ?? false 순으로 먼저 정의된 값을 우선 선택하고 모두 없으면 false로 대체하여 boolean으로 useline에 저장한다. [확인 Q-007]
            재질·지오메트리 초기화를 수행한다.

    setSize(width?: number, height?: number, depth?: number) -> void
        인터페이스: 각 인자는 미터 단위 요청 크기이며 생략하면 해당 축의 현재 값을 유지한다.
        처리 기준: 유효하지 않은 값은 경고를 기록하고 해당 축의 현재 값을 유지한다.
        의존: defined — 인자 생략 판정; 함수: {defined()}
        동작:
            정의된 인자만 검증하여 해당 필드에 저장한다.
            지오메트리·외곽선 재생성을 요청한다.

    getSize() -> U3dBoxSize
        인터페이스: 반환: 스케일 적용 전 요청 크기 객체
        동작: width·height·depth를 새 객체에 담아 반환한다.

    setTexture(textureUrl: string) -> void
        인터페이스: textureUrl은 단일 재질의 map에 반복 감싸기(RepeatWrapping)로 적용할 이미지 URL이다.
        처리 기준:
            material이 없으면 무동작으로 반환한다.
            textureUrl이 빈 문자열이거나 문자열이 아니면 경고를 기록하고 반환한다.
            material이 배열(topimage)이면 지원하지 않음을 경고하고 반환한다.
            로드 성공 시 기존 map을 해제한 뒤 교체하고, 인스턴스가 해제되었거나 재질이 없어졌거나 배열로 바뀐 뒤 도착한 텍스처는 즉시 해제하고 버린다.
            로드 실패는 오류로 기록하고 재질을 바꾸지 않는다.
        의존:
            Three.js — 텍스처 로드·감싸기·해제; 생성자: {new TextureLoader()}; 함수: {TextureLoader.load(), Texture.dispose()}; 상수: {RepeatWrapping}
            defined — 재질·기존 map 존재 판정; 함수: {defined()}
            __GWarn__ — URL·재질 형태 경고; 함수: {__GWarn__()}
            __GError__ — 로드 실패 보고; 함수: {__GError__()}
            U3dGeometry — 현재 재질 참조; 속성 읽기: {material}
        동작:
            재질 존재, URL 형식, 단일 재질 여부를 순서대로 판정하고 실패하면 해당 처리 기준대로 종료한다.
            새 TextureLoader로 textureUrl을 비동기 로드하고 실패 콜백에 오류 기록을 등록한다.
            로드 완료 시 _disposed·material 부재·배열 여부를 다시 판정하여 해당하면 텍스처를 해제하고 종료한다.
            wrapS·wrapT를 RepeatWrapping으로 두고 기존 map을 해제한 뒤 map에 넣고 needsUpdate를 켠다.

    override setImage(url: string) -> void
        인터페이스: url은 모든 면(단일 또는 6면 배열)에 같은 텍스처로 적용할 이미지 URL이다.
        처리 기준:
            _url은 material 존재 여부·URL 유효성과 관계없이 먼저 갱신된다.
            material이 없으면 텍스처를 만들지 않고 반환하고, url이 빈 문자열이거나 문자열이 아니면 경고 후 반환한다.
            각 재질의 기존 map은 새 map 대입 전에 해제하되, 배열이 공유하는 같은 텍스처 객체는 한 번만 해제한다. 배열이면 6개 재질이 새 텍스처 객체 하나를 공유한다.
            로드 완료 콜백은 인스턴스가 해제되었으면 방향 보정을 건너뛰고, 로드 실패는 오류로 기록한다(이미 대입된 map은 이미지 없는 텍스처로 남는다).
        의존:
            Three.js — 텍스처 로드와 비율 보정; 생성자: {new TextureLoader()}; 함수: {TextureLoader.load(), Texture.dispose(), Vector2.set()}
            defined — 재질·기존 map 존재 판정; 함수: {defined()}
            __GWarn__ — URL 경고; 함수: {__GWarn__()}
            __GError__ — 로드 실패 보고; 함수: {__GError__()}
            U3dGeometry — 이미지 URL 보관과 재질 참조; 속성 쓰기: {_url}; 속성 읽기: {material}
        동작:
            _url에 url을 저장하고 material 부재·URL 무효를 판정하여 해당하면 종료한다.
            TextureLoader.load()로 텍스처 객체를 동기 반환받아 map으로 삼고, 성공 콜백에서 _disposed가 아니면 이미지가 가로로 길 때 repeat (-1, 1)·offset (1, 0), 아니면 repeat (1, -1)·offset (0, 1)로 방향을 보정하며, 실패 콜백은 오류를 기록한다.
            material이 배열이면 첫 재질의 기존 map을 한 번 해제하고, 그와 다른 map을 가진 재질만 추가로 해제한 뒤 모든 재질에 같은 map을 대입하고 needsUpdate를 켠다.
            단일 재질이면 기존 map을 해제하고 map을 대입한 뒤 needsUpdate를 켠다.

    override updateVertex() -> void
        역할: 월드 꼭짓점을 메시 위치로 반영하고 위도 스케일로 지오메트리를 다시 만든다.
        처리 기준:
            _vertices가 없거나 비어 있으면 무동작으로 반환한다.
            위치는 첫 꼭짓점만 사용하고 나머지 꼭짓점은 무시한다.
            위도는 _coordinates의 첫 좌표 y를 쓰며 없으면 0(적도)으로 계산하여 스케일이 1이 된다. [확인 Q-006]
        의존:
            defined — 꼭짓점 존재 판정; 함수: {defined()}
            UMesh — 메시 위치 반영; 속성 쓰기: {position}
            UMathEngine — 위도별 EPSG:3857 실거리 배율; 정적 함수: {getRealScaleAtGeographic()}
            U3dGeometry — 좌표 읽기; 속성 읽기: {_vertices, _coordinates}
        동작:
            첫 꼭짓점을 메시 position에 복사한다.
            첫 위경도 좌표의 위도로 실거리 배율(cos(위도), 0.001~1로 제한)을 구해 그 역수를 _googleScale에 저장한다.
            지오메트리·외곽선 재생성을 요청한다(스케일이 바뀌지 않았으면 건너뛴다).

    override setParam(param?: U3dBoxCO) -> void
        인터페이스: param의 정의된 필드만 반영하고 생략한 필드는 현재 값을 유지한다. type·topimageurl은 여기서 바뀌지 않는다.
        처리 기준:
            크기·세그먼트는 검증을 거쳐 유효하지 않으면 경고 후 현재 값을 유지한다.
            wireframe은 기반 setParam()이 배열 재질을 건너뛰므로 이 클래스가 단일·배열 모두에 다시 반영한다.
            지오메트리·외곽선은 크기·세그먼트·외곽선 조합이 실제로 바뀐 경우에만 다시 만든다.
        의존:
            U3dGeometry — 색상·투명도·그림자·외곽선 색·와이어프레임(단일 재질)·깊이 보정 반영; 함수: {super.setParam()}
            defined — 필드 정의 판정; 함수: {defined()}
        동작:
            param이 없으면 빈 객체로 대체하고 기반 setParam()으로 공통 속성을 먼저 반영한다.
            width·height·depth는 정의된 것만 검증하여 교체한다.
            세그먼트 셋은 정의된 것만 검증하여 교체한다.
            param.outline ?? param.useline ?? param.useLine ?? param.edge 순으로 먼저 정의된 값을 우선 선택하여 있으면 boolean으로 useline에 저장한다. [확인 Q-007]
            wireframe이 정의되어 있으면 모든 재질에 반영한다.
            지오메트리·외곽선 재생성을 요청한다.

    override getParam() -> U3dBoxParam
        인터페이스: 반환: 기반 공통 속성에 현재 크기·세그먼트와 outline(useline 값)을 더한 객체
        의존: U3dGeometry — 공통 속성 조회; 함수: {super.getParam()}
        동작: 기반 getParam() 결과를 펼치고 width·height·depth·세그먼트 셋·outline을 덧붙여 반환한다.

    _initBox() -> void
        역할: 생성 시점의 재질을 타입에 따라 만들고 지오메트리·외곽선을 생성한 뒤 투명도·와이어프레임을 반영한다.
        처리 기준:
            생성자가 복사한 Mesh 기본 재질(단일)은 새 재질로 교체하기 전에 해제한다.
            type이 'topimage'인데 topimageurl이 없으면 오류를 기록하고 type을 'basic'으로 바꾼다.
            type이 'basic'·'topimage' 어느 것도 아니면 경고를 기록하고 type을 'basic'으로 바꾼다.
            재질은 지오메트리보다 먼저 만들어 단일·배열 판정이 지오메트리 그룹 처리에 반영되게 한다.
            투명도는 기반 setOpacity()로 반영하므로 opacity 0도 적용되며 CHANGE 이벤트가 발생한다.
        의존:
            Three.js — 재질·로더 생성과 윗면 텍스처 로드; 생성자: {new MeshBasicMaterial(), new TextureLoader()}; 함수: {TextureLoader.load(), Material.dispose()}; 상수: {DoubleSide}
            defined — 기본 재질·URL 존재 판정; 함수: {defined()}
            __GError__ — topimageurl 누락·윗면 이미지 로드 실패 보고; 함수: {__GError__()}
            __GWarn__ — 지원하지 않는 type 경고; 함수: {__GWarn__()}
            U3dGeometry — 기반 상태 읽기, 투명도 반영, 재질·지오메트리 참조 갱신; 속성 읽기: {color, opacity, wireframe, geometry}; 속성 쓰기: {material}; 함수: {setOpacity()}
        동작:
            material이 단일 재질이면 해제한다.
            type과 topimageurl로 대체 판정을 수행하여 필요하면 type을 'basic'으로 바꾼다.
            type이 'topimage'이면 TextureLoader를 loader에 보관하고 topimageurl을 로드(실패 시 오류 기록)한 텍스처를 인덱스 TOP_FACE_MATERIAL_INDEX 재질의 map으로, 나머지 5면은 color를 쓴 DoubleSide 재질 6개 배열을 material에 대입한다.
            그 외에는 color로 MeshBasicMaterial 하나를 만들어 material에 대입한다.
            현재 필드와 스케일 1로 지오메트리·외곽선을 만든다.
            기반 setOpacity()로 현재 opacity를 재질에 반영한다.
            wireframe이 true이면 모든 재질에 반영한다.

    _updateBoxGeometry() -> void
        역할: 크기·세그먼트·스케일·외곽선 조합이 바뀌었을 때만 지오메트리를 다시 만들고 외곽선을 재생성한다.
        처리 기준:
            geometry가 있고 조합 문자열이 #geometryKey와 같으면 무동작으로 반환한다.
            기존 지오메트리는 새 지오메트리로 교체하기 전에 해제한다.
            material이 배열이 아니면 새 지오메트리의 면별 재질 그룹을 제거한다.
        의존:
            Three.js — 지오메트리 구성·해제; 생성자: {new BoxGeometry()}; 함수: {BufferGeometry.dispose(), BufferGeometry.clearGroups()}
            defined — 기존 지오메트리 존재 판정; 함수: {defined()}
            U3dGeometry — 지오메트리 참조 교체와 재질 형태 판정; 속성 읽기·쓰기: {geometry}; 속성 읽기: {material}
        동작:
            width·height·depth·세그먼트 셋·_googleScale·useline을 이어 조합 문자열을 만들고 마지막 생성 조합과 같으면 반환하며, 다르면 #geometryKey에 저장한다.
            width·height·depth에 _googleScale을 곱하고 세그먼트 셋을 전달하여 새 BoxGeometry를 만든다.
            material이 배열이 아니면 새 지오메트리의 그룹을 제거한다.
            기존 geometry가 있으면 해제하고 새 지오메트리로 교체한다.
            외곽선을 다시 만든다.

    _updateOutline() -> void
        역할: 기존 외곽선을 해제하고 useline이면 현재 지오메트리로 외곽선을 다시 만들어 자식으로 추가한다.
        처리 기준: 외곽선 색상은 _lineColor가 정의되면 그 값을, 아니면 검정을 사용한다.
        의존:
            Three.js — 외곽선 구성·해제; 생성자: {new EdgesGeometry(), new LineBasicMaterial(), new LineSegments()}; 함수: {BufferGeometry.dispose(), Material.dispose()}
            defined — 기존 외곽선·_lineColor 존재 판정; 함수: {defined()}
            U3dGeometry — 외곽선 색상 읽기와 지오메트리 참조; 속성 읽기: {_lineColor, geometry}
            UMesh — 외곽선 자식 추가·제거; 함수: {add(), remove()}
        동작:
            기존 _outline이 있으면 자식에서 제거하고 그 geometry와 material을 해제한 뒤 참조를 비운다.
            useline이 false이면 반환한다.
            현재 geometry로 임계각 OUTLINE_THRESHOLD_ANGLE의 EdgesGeometry와 _lineColor 기반 LineBasicMaterial로 LineSegments를 만들어 자식으로 추가하고 _outline에 보관한다.

    #applyWireframe(enabled: boolean) -> void
        역할: 단일·배열 재질 모두에 wireframe을 반영하고 기반 wireframe 필드를 맞춘다.
        의존:
            defined — 재질 존재 판정; 함수: {defined()}
            U3dGeometry — 재질 참조와 와이어프레임 상태; 속성 읽기: {material}; 속성 쓰기: {wireframe}
        동작:
            material이 없으면 반환한다.
            단일 재질은 배열로 감싸 모든 재질의 wireframe을 enabled로 두고 needsUpdate를 켠다.
            기반 wireframe 필드에 enabled를 저장한다.

    #validSize(value: any, name: string, fallback: number) -> number
        인터페이스: name은 경고 메시지에 쓰는 옵션 이름, fallback은 생략·무효 시 반환값이다.
        처리 기준: 양의 유한한 number만 유효하며 0 이하·NaN·무한대·비숫자는 무효다.
        의존:
            defined — 생략 판정; 함수: {defined()}
            __GWarn__ — 무효 값 경고; 함수: {__GWarn__()}
        동작:
            value가 정의되지 않았으면 fallback을 반환한다.
            무효이면 입력값과 사용값을 담아 경고를 기록하고 fallback을 반환한다.
            유효하면 value를 반환한다.

    #validSegments(value: any, name: string, fallback: number | undefined = undefined) -> number | undefined
        인터페이스: name은 경고 메시지에 쓰는 옵션 이름, fallback은 생략·무효 시 반환값이다.
        처리 기준: 1 이상의 정수만 유효하다.
        의존:
            defined — 생략 판정; 함수: {defined()}
            __GWarn__ — 무효 값 경고; 함수: {__GWarn__()}
        동작:
            value가 정의되지 않았으면 fallback을 반환한다.
            무효이면 입력값을 담아 경고를 기록하고 fallback을 반환한다.
            유효하면 value를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
width·height·depth는 EPSG:3857 월드 단위가 아닌 실거리(미터)로 해석하며 _googleScale을 곱해 지오메트리에 적용한다.
재질은 생성 시 type으로 한 번 결정되며 이후 type·topimageurl 변경 경로는 없다.
자원 해제는 자체 dispose()를 두지 않고 UMesh.dispose()에 위임한다. 이 경로는 material(배열 포함)과 그 map, geometry, 자식 _outline을 해제하고 _disposed를 true로 둔다.
텍스처 로드 실패는 __GError__로, 유효하지 않은 입력은 __GWarn__으로 기록하며 예외를 던지지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
