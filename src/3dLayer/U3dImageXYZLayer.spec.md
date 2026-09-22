# U3dImageXYZLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dImageXYZLayer`는 `{x}`, `{y}`, `{z}` 좌표 토큰이 포함된 XYZ/TMS URL에서 타일 이미지를 받아 지형 mesh에 표시한다. 하나의 URL에 문자 또는 숫자 범위가 있으면 여러 서버 URL로 펼쳐 순환 사용하고, 선택적으로 XML metadata에서 최대 level과 표시 영역을 읽는다.

### 1.2 책임 범위

- 지형 타일의 중심 위치와 level을 XYZ tile index로 변환하여 요청 URL을 만든다.
- URL의 정방향·반전 좌표 토큰을 실제 tile index로 치환한다.
- URL 범위를 여러 template로 펼치고 요청마다 다음 template를 선택한다.
- 선택적 XML metadata에서 최대 level과 geographic bounding box를 읽어 레이어 영역으로 변환한다.
- 영역 밖 tile을 제외하고 기반 이미지 레이어의 texture 요청·cache·fallback 흐름을 시작한다.

책임 경계: texture 다운로드, 요청 취소, 부모 texture fallback, mesh 생성과 렌더 자원 수명주기는 `U3dImageLayer`가 담당한다. XML은 현재 `Raster.maxlevel`과 `BoundingBox`만 실제 상태에 반영하며 좌표계와 tile format은 읽지 않는다.

### 1.3 주요 동작 방식

초기화할 때 기반 이미지 레이어를 먼저 초기화한다. `needXml`이 true이면 XML 읽기를 비동기로 시작하고 완료 callback에서 표시 영역을 계산하며, 그 대기와 별개로 기본 URL을 하나 이상의 template로 펼친 뒤 초기화 상태를 반환한다. tile texture 요청에서는 XML로 계산한 영역과 tile 영역이 겹치는지 먼저 검사하고, 기반 사전 조건을 통과하면 XYZ URL을 만든 뒤 `U3dImageLayer.processTexture()`에 처리를 맡긴다.

### 1.4 주요 사용처와 연계 대상

- `U3dApp`의 XYZ·TMS·배경 영상 레이어 생성 API
- `GeOnDT.image.U3dImageXYZLayer`로 직접 생성하는 지도 배경·위성 영상 예제
- `U3dImagePBFLayer`가 상속하여 직접 호출하는 영역 계산 alias와 URL 처리 기반
- `U3dImageLayer`의 texture 요청, parent fallback, terrain mesh와 cache 처리

## 3. 정규 자연어 수도코드

```spec
U3dImageXYZLayerCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        reverseX?: boolean
            X축 반전 여부로 선언되어 있고 생략하면 false를 저장하지만 현재 URL 생성에서는 이 값을 읽지 않는다. [확인 Q-001]
        reverseY?: boolean
            Y축 반전 여부로 선언되어 있지만 현재 생성자와 URL 생성에서는 이 값을 저장하거나 읽지 않는다. [확인 Q-001]
        needXml?: boolean
            추가 XML metadata를 읽을지 지정하며 생략하면 false이다.
        xmlUrl?: string
            needXml이 true일 때 읽을 XML URL이다.

U3dImageXYZLayerCO 타입 정의
    U3dImageLayerCO와 U3dImageXYZLayerCO_Content의 교집합이다. baseUrl은 U3dLayerCO, name은 U3dObjectCO의 선택 문자열 속성을 상속받는다.

U3dImageXYZLayer extends U3dImageLayer 클래스 정의
    의존: U3dImageLayer — 이미지 tile의 공통 초기화·사전 판정·texture 처리와 렌더 자원 관리; 상속: {U3dImageLayer}

    static OPT_KEYS: Array<string>
        의존: U3dImageLayer — 기반 생성 옵션 key 재사용; 속성 읽기: {OPT_KEYS}
        동작: 기반 옵션에 reverseX, reverseY, needXml과 xmlUrl을 추가한다.

    _reverseX: boolean = false
        X축 반전 옵션 저장값이며 현재 URL 치환 경로에서는 사용하지 않는다. [확인 Q-001]

    _urls: Array<string> = 빈 배열
        범위 표현을 펼친 URL template 목록이다.

    _urlIndex: number = 0
        다음 요청에서 선택할 URL template 위치이다.

    _needXml: boolean = false
        XML metadata 읽기 여부이다.

    _xmlUrl?: string
        XML metadata를 읽을 URL이다.

    _computeRectangle: () -> void
        하위 레이어가 영역 계산을 재사용할 수 있도록 `#computeRectangle`을 연결한 runtime system alias이며 `U3dImagePBFLayer.initialize()`가 직접 호출한다.

    _boundingBox?: {minx: number, miny: number, maxx: number, maxy: number}
        XML에서 읽은 geographic 표시 영역이다.

    constructor(opt: U3dImageXYZLayerCO)
        인터페이스: opt는 기반 이미지 옵션과 baseUrl, URL 반전·XML metadata 옵션을 전달한다.
        처리 기준: baseUrl이 정의되지 않으면 오류를 던지거나 실패 상태를 설정하지 않고 안내 로그를 남긴 뒤 파생 초기화를 중단한 객체를 반환한다. [확인 Q-003]
        의존:
            U3dImageLayer — 기반 이미지 레이어 상태 초기화; 생성자: {new U3dImageLayer()}
            normalizeOptionKeys — 현재 클래스의 지원 key로 옵션 alias 정규화; 함수: {normalizeOptionKeys()}
            defined — baseUrl 존재 여부 판정; 함수: {defined()}
            defaultValue — 이름과 XYZ 옵션의 기본값 적용; 함수: {defaultValue()}
            Guid — 이름 생략 시 식별 이름 생성; 함수: {Guid()}
            Console API — baseUrl 누락 안내; 함수: {console.info()}
        동작:
            옵션 key를 정규화하고 기반 이미지 레이어를 초기화한다.
            baseUrl이 없으면 안내 로그를 출력하고 나머지 XYZ 상태 설정을 수행하지 않는다. [확인 Q-003]
            class type, base URL, 이름, reverseX, needXml과 xmlUrl을 저장하고 URL 목록과 순환 index를 초기화한다. reverseY는 저장하지 않는다. [확인 Q-001]
            하위 레이어가 protected 성격으로 재사용할 수 있도록 영역 계산 함수를 `_computeRectangle`에 연결한다.

    override createMeshFromTile(tile: U3dQuadTile) -> UTerrainMesh
        인터페이스: tile은 기반 terrain mesh를 생성할 지형 tile이며 생성된 mesh를 반환한다.
        의존: U3dImageLayer — terrain mesh 생성과 cache 등록; 함수: {createMeshFromTile()}
        동작:
            기반 레이어에서 terrain mesh를 생성한다.
            mesh가 있으면 기존 userData를 같은 값의 새 객체로 교체한 뒤 mesh를 반환한다.

    override initialize() -> boolean
        처리 기준: needXml이 true여도 XML 읽기 완료를 기다리지 않고 기반 초기화 상태를 반환한다. [확인 Q-002]
        의존:
            U3dImageLayer — scene·group 연결과 공통 초기화 상태 확정; 함수: {initialize()}
            U3dLayer — 현재 초기화 상태 조회; 속성 읽기: {_initialized}
        동작:
            기반 이미지 레이어를 초기화한다.
            needXml이 true이면 XML 읽기를 시작하고 성공하면 geographic 영역을 Google 좌표 영역과 Box3로 변환하도록 callback을 연결한다. 초기화 반환과 기반 생성 promise는 이 작업을 기다리지 않으며 readXml rejection을 처리하는 callback도 연결하지 않는다. [확인 Q-002]

            baseUrl의 문자 또는 숫자 범위를 URL template 목록으로 펼치고 초기화 상태를 반환한다.

    async readXml() -> Promise<void>
        역할: 선택적 XML metadata의 최대 level과 표시 영역을 레이어 상태에 반영한다.
        처리 기준:
            xmlUrl이 없거나 `.xml`을 포함하지 않으면 오류 메시지를 기록하고 정상 완료한다.
            fetch·XML parsing 또는 필수 Raster·BoundingBox 접근에서 발생한 오류는 이 메서드에서 복구하지 않고 반환 Promise를 reject한다.
        의존:
            Web API — XML 다운로드, DOM 생성과 element·attribute 조회; 생성자: {new DOMParser()}; 함수: {fetch(), Response.text(), DOMParser.parseFromString(), Document.getElementsByTagName(), Element.getAttribute()}
            __GError__ — 인식할 수 없는 XML URL 보고; 함수: {__GError__()}
            U3dLayer — XML 최대 레벨 반영; 속성 쓰기: {_maxlevel}
        동작:
            xmlUrl이 유효하지 않으면 오류를 기록하고 종료한다.
            XML을 문자열로 다운로드하여 document로 parsing한다.
            첫 Raster의 maxlevel 문자열이 truthy이면 숫자로 변환하고 1을 뺀 값을 레이어 최대 level로 먼저 저장한다. 빈 문자열·누락이면 기존 값을 유지하며 숫자가 아닌 문자열은 NaN이 된다.
            첫 BoundingBox의 minx, miny, maxx, maxy를 숫자로 변환하여 geographic 영역으로 저장한다. 누락 속성의 null은 0이 되며 BoundingBox 요소가 없으면 이 단계에서 reject되어 앞서 갱신한 최대 level은 유지된다.
            XML의 SRS·PROJ, tile format과 tile 크기는 읽거나 레이어 상태에 반영하지 않는다. [확인 Q-005]

    createUrl(tile: U3dQuadTile, drawArg: UDrawArg) -> string
        인터페이스:
            tile은 URL 좌표를 계산할 대상이다.
            drawArg는 공개 호출 형식을 유지하지만 현재 구현에서는 사용하지 않는다.
            반환: 선택한 URL template의 좌표 토큰을 치환한 요청 URL
        의존:
            UMathEngine — tile 중심의 Google tile index 계산; 정적 함수: {getGoogleToIndexXY()}
            U3dQuadTile — engine 시작 level 조회; 정적 함수: {getStartLevel()}
        동작:
            tile 중심 X·Y와 시작 level을 더한 tile level로 Google tile index를 계산한다.
            다음 요청의 URL template를 순환 선택한다.
            reverseX·reverseY 옵션은 읽지 않고 선택한 template와 계산한 index를 비공개 문자열 변환에 전달하여 정방향·반전 X·Y와 Z 토큰이 치환된 URL을 반환한다. [확인 Q-001]

    override show(show: boolean) -> void
        처리 기준: 기반 API의 refresh 인수를 받지 않으므로 호출자가 화면 갱신을 생략하도록 선택할 수 없다. [확인 Q-004]
        의존: U3dImageLayer — 가시성 전환, 숨김 시 tile 상태·요청 정리와 화면 갱신; 함수: {show()}
        동작: 입력 가시성을 기반 이미지 레이어에 전달하며 refresh 기본 동작을 사용한다.

    override createTexture(tile: U3dQuadTile) -> Promise<U3dQuadTile> | undefined
        역할: 영역과 기반 조건을 통과한 XYZ tile의 이미지 요청을 시작한다.
        처리 기준:
            계산된 Box3가 있고 tile 영역과 교차하지 않으면 tile을 완료 상태로 만들고 요청하지 않는다.
            기반 이미지 레이어가 거부하면 요청하지 않는다.
            기반 API의 선택 인수 opt와 그 noParentTexture 속성을 받지 않으므로 호출자가 부모 texture fallback을 생략하도록 선택할 수 없다. [확인 Q-004]
        의존:
            defined — 변환 영역과 생성 URL 존재 여부 판정; 함수: {defined()}
            intersectsBoxXY — XML 표시 영역과 tile XY 영역 교차 판정; 함수: {intersectsBoxXY()}
            U3dImageLayer — tile 사전 판정과 이미지 요청 처리; 함수: {createTexture(), processTexture()}
            U3dLayer — 요청하지 않는 tile 상태 확정과 현재 영역 조회; 함수: {setStateTile()}; 속성 읽기: {_box3}
            UDEF.TILE_STATE — 요청하지 않는 tile의 완료 상태; 상수: {_end}
            deferred — tile 처리 완료 객체 생성; 함수: {deferred()}
        동작:
            XML에서 계산한 Box3와 tile bounding box가 겹치지 않으면 tile 상태를 완료로 바꾸고 undefined를 반환한다.
            기반 texture 생성 사전 판정이 falsy이면 기반 경로의 null을 포함하여 undefined로 반환한다.
            tile의 drawArg와 XYZ URL을 준비한다. URL 목록이 비어 있으면 createUrl의 template 치환 과정에서 예외가 발생하므로 뒤의 undefined 검사는 이 상태를 처리하지 못한다. [확인 Q-003]
            URL이 예외 없이 null·undefined로 반환된 경우에는 tile 상태를 완료로 바꾸고 undefined를 반환한다.
            deferred를 생성하여 별도 옵션 없이 기반 이미지 요청 처리에 전달하므로 요청별 네트워크 취소 경로를 사용한다. processTexture가 truthy이면 같은 deferred를 공개 Promise 계약으로 반환하고 그 외에는 undefined를 반환한다.

    override getMetaData() -> UMeta
        의존:
            U3dImageLayer — 공통 레이어 metadata 생성; 함수: {getMetaData()}
            UMeta — baseUrl metadata 항목 추가; 함수: {addChild()}
        동작: 기반 metadata에 현재 baseUrl 항목을 추가하여 반환한다.

    getBoundingBox() -> Box3 | undefined
        인터페이스: 반환: 현재 레이어의 Google 좌표계 Box3 또는 undefined. 기반 초기화나 XML 영역 계산에서 설정할 수 있다.
        의존: U3dLayer — 현재 경계 객체 조회; 속성 읽기: {_box3}
        동작: 현재 `_box3`를 반환한다.

    #computeRectangle() -> void
        역할: XML geographic bounding box를 tile 교차 판정에 사용할 Google 좌표 영역으로 확정한다.
        처리 기준: bounding box가 없으면 오류를 기록하고 영역 상태를 변경하지 않는다.
        의존:
            defined — 입력 영역과 변환 결과 존재 여부 판정; 함수: {defined()}
            __GError__ — 영역 인식 실패 보고; 함수: {__GError__()}
            U3dLayer — geographic 좌표 변환과 레이어 영역 반영; 함수: {convertGeographicToGoogleRectangle()}; 속성 읽기·쓰기: {_rectangle}; 속성 쓰기: {_rectangle3d, _box3}
            Box3 — tile 교차 판정용 3D box 생성·설정; 생성자: {new Box3()}; 함수: {set()}
        동작:
            XML bounding box가 없으면 오류를 기록하고 종료한다.
            minx, miny, maxx, maxy를 Google 좌표 사각형으로 변환하여 `_rectangle`에 먼저 저장한다.
            변환 결과가 없으면 오류를 기록하고 종료하므로 기존 `_rectangle3d`와 `_box3`가 남아 있을 수 있다. [확인 Q-006]
            변환 사각형을 2D·3D 레이어 영역으로 저장하고 좌상단과 우하단 점으로 Box3를 만든다.

    #getUrlTemplate() -> string | undefined
        처리 기준: URL 목록이 비어 있으면 undefined를 반환한다.
        동작:
            URL이 하나이면 그 template를 반환한다.
            여러 URL이면 현재 index의 template를 반환하고 index를 증가시키며 끝에 도달하면 0으로 되돌린다.

expandUrl(url?: string) -> Array<string>
    역할: 서버 범위 표현이 있는 URL을 요청에 사용할 개별 template 목록으로 펼치는 module 함수이며 instance method로 연결되지는 않는다. [확인 Q-007]
    의존: defined — 입력 URL 존재 여부 판정; 함수: {defined()}
    동작:
        URL이 정의되지 않으면 빈 목록을 반환한다.
        그 외에는 서버 범위를 비공개 문자열 변환에 전달하고 반환된 URL 목록을 그대로 반환한다.

```

## 4. 공통 처리 기준과 제약

```spec
URL template의 `{x}`, `{y}`, `{z}`는 정방향 index이고 `{-x}`, `{-y}`는 같은 level의 반전 index이다. reverseX와 reverseY 옵션은 현재 이 선택을 변경하지 않는다. [확인 Q-001]
createTexture의 선행 영역 검사는 현재 `_box3`가 있을 때만 적용한다. XML 완료 전에도 기반 초기화가 생성 옵션의 rectangle·extent·geoExtent와 drawArg로 `_box3`를 준비했으면 그 영역을 검사한다. [확인 Q-002]
URL 범위 확장은 한 URL에서 처음 발견한 문자 범위 하나 또는 숫자 범위 하나만 처리한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
