# U3dHeightXYZLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dHeightXYZLayer`는 XYZ 또는 TMS 타일 주소로 UMF 고도 파일을 요청하고, 원시 고도 표본과 타일별 복원 메타데이터를 `U3dHeightLayer`의 지형 생성 흐름에 공급한다. 좌표 목록에 대해서는 필요한 타일을 재사용하거나 내려받아 보간 고도를 반환한다.

### 1.2 책임 범위

- XML 또는 생성자 설정으로 타일 크기, 표본 형식, 압축, 버전과 공간 범위를 초기화한다.
- 타일 URL을 만들고 고도 파일의 요청·취소·실패 대체·완료 상태를 관리한다.
- UMF 1.0 원시 배열과 UMF 2.0 헤더·페이로드를 해석한다.
- 활성 타일 캐시와 조회·분석용 LRU 캐시 사이에서 고도 배열과 타일 헤더를 관리한다.
- 좌표별 타일을 찾고 주변 네 표본을 보간하여 복원 고도를 반환한다.
- 책임 경계: 고도 배열을 지형 지오메트리에 반영하고 부모 타일 데이터를 분할하는 처리는 `U3dHeightLayer`와 `UHeightUtil`이 담당한다.

### 1.3 주요 동작 방식

초기화 시 XML을 사용하면 `tilemapresource.xml`의 전역 형식과 범위를 반영하고, 사용하지 않으면 생성자 설정으로 공간 범위를 계산한다. 타일 생성은 조회용 LRU 항목을 먼저 재사용하고 없으면 원격 요청을 수행한다. 좌표·분석 조회는 LRU, 활성 타일 캐시, 원격 요청 순으로 값을 찾는다. UMF 2.0은 파일 헤더에서 타일별 `scale`, `offset`, `noData`를 읽어 원시 배열과 함께 지형 적용 및 좌표 조회에 사용한다. 요청이 실패하고 부모 타일이 있으면 부모 고도 생성 흐름으로 대체한다.

### 1.4 주요 사용처와 연계 대상

- `U3dLayer.setApp()`이 높이 타일 처리 콜백으로 `createHeight()`를 사용한다.
- `U3dHeightLayer`가 고도 지오메트리 적용, 부모 타일 대체와 공통 캐시를 제공한다.
- `UFileLoader`가 타일 파일을 비동기로 요청하고 취소한다.
- `CustomLand`가 지표면 편집의 토공량 분석에 필요한 원시 표본과 타일별 복원 헤더를 내부 연계 메서드로 요청한다.
- `UMercator`와 `UMathEngine`이 좌표별 타일 탐색과 URL 생성을 담당한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
UMF 2.0 고도 표본은 각 파일 헤더의 scale과 offset으로 복원해야 한다.
고도 배열과 그 배열을 해석하는 타일 헤더는 같은 타일 수명주기로 저장하고 제거해야 한다.
손상되거나 지원하지 않는 UMF 파일은 부분 캐시나 로딩 상태를 남기지 않고 실패해야 한다.
원격 타일을 구하지 못하고 부모 타일을 사용할 수 있으면 부모 고도 생성 결과로 비동기 작업을 완료해야 한다.
좌표 조회 보간은 타일 내부의 실제 소수 위치를 사용하고 NoData 표본을 유효한 0 높이로 취급하지 않아야 한다.
지표면 편집 분석은 UMF 1.x의 레이어 전역 복원값과 UMF 2.0의 타일별 복원 헤더를 각각 보존해야 한다.
```

### 2.2 성능 및 품질 요구사항

```spec
우선순위: 타일별 복원 정확성을 보존하면서 이미 해석한 타일 데이터의 재요청과 불필요한 복사를 줄인다.
제한 조건: 조회용 캐시는 설정된 용량을 넘는 오래된 타일을 제거하며 데이터와 헤더 중 하나만 남겨서는 안 된다.
검증 기준: UMF 1.0과 2.0, 지원 표본 형식, NoData 사용 여부, 잘린 파일, 타일 크기 불일치와 보간 경계를 각각 확인한다.
```

## 3. 정규 자연어 수도코드

```spec
U3dHeightXYZLayer extends U3dHeightLayer 클래스 정의
    의존:
        U3dHeightLayer — 공통 고도 레이어 상태와 지형 적용 흐름 제공; 상속: {U3dHeightLayer}

    #dataCacheSize: number = 300
        좌표 조회용 LRU 캐시의 타일 수 기준값

    #dataCache: LRUCache | undefined
        원시 고도 배열과 타일별 복원 헤더를 하나의 항목으로 보관하는 조회용 캐시

    #hasDeclaredUmfVersion: boolean = false
        XML에서 UMF 버전을 명시적으로 읽었는지 구분하는 값

    _needXml: boolean
        초기화할 때 tilemapresource.xml을 요청할지 여부

    _compress: boolean
        고도 파일 URL과 응답에 gzip 처리를 적용할지 여부

    _loader: UFileLoader
        고도 파일 요청과 취소를 담당하는 로더

    tms_: boolean = true
        생성 시 TMS 사용 상태로 기록하며 외부에서 조회할 수 있다.

    static Retry: number = 5
        외부에서 조회할 수 있는 재시도 기준값이며 현재 클래스 내부에서는 사용하지 않는다.

    constructor(option: U3dHeightXYZLayerCO)
        역할: XYZ 고도 레이어 설정, 로더와 조회용 캐시를 초기화한다.
        의존:
            U3dHeightLayer — 공통 레이어 초기화; 함수: {constructor()}
            defaultValue — 선택 설정의 기본값 선택; 함수: {defaultValue()}
            Guid — 이름 기본값 생성; 함수: {Guid()}
            THREE.Box3 — 공간 범위 객체 생성; 생성자: {new THREE.Box3()}
            UFileLoader — ArrayBuffer 로더 생성과 응답 형식 설정; 생성자: {new UFileLoader()}; 함수: {setResponseType()}
            LRUCache — 조회용 타일 캐시 생성; 생성자: {new LRUCache()}
        동작:
            상위 생성자에 option을 전달하고 URL, 타일 형식, 스커트, 프록시와 공간 설정을 기본값과 함께 저장한다.
            ArrayBuffer 응답 로더를 생성한다.
            데이터와 헤더를 함께 저장하는 조회용 타일 캐시를 생성한다.

    override dispose() -> Promise<boolean>
        역할: 상위 자원과 조회용·활성 고도 캐시 참조를 정리한다.
        의존:
            U3dHeightLayer — 현재 레이어 수신자로 상위 처분 직접 호출; 함수: {prototype.dispose.call()}
            LRUCache — 조회용 타일 항목 제거; 함수: {clear()}
            U3dHeightLayer — 상속 헤더 캐시 참조 정리; 속성 쓰기: {_headerCache}
            U3dLayer — 상속 데이터 캐시·수명 상태 정리; 속성 쓰기: {_cache, _disposed}
        동작:
            상위 처분을 수행하고 조회용 타일 캐시를 비운 뒤 관련 캐시 참조와 처분 상태를 정리한다.
            상위 처분 결과를 반환한다.

    override createHeight(tile: U3dQuadTile, opt: U3dHeightWorkOption) -> Promise<boolean>
        역할: 타일 고도 데이터를 캐시 또는 원격 파일에서 준비하고 지형에 적용한다.
        처리 기준:
            레이어 공간 밖이거나 상위 선행조건을 통과하지 못하면 false로 완료한다.
            번 레벨 또는 최대 레벨을 넘는 타일은 가능한 경우 부모 고도를 사용한다.
            조회용 캐시에 타일 항목이 있으면 원격 요청 없이 그 데이터와 선택적 헤더를 적용한다.
            다운로드·파싱·요청 생성 실패는 부모가 있으면 대체하지만, 취소와 지오메트리 적용 실패는 부모 대체 없이 종료한다.
            취소는 현재 타일의 요청 callback만 제거하고 같은 URL의 다른 소비자가 없을 때만 네트워크 요청을 중단한다.
            요청으로 증가시킨 로딩 작업 수는 성공, 파싱 실패, 다운로드 실패, 취소와 타일 처분 경로에서 한 번만 감소시킨다.
            요청 생성의 동기 예외와 비동기 오류가 연달아 발생해도 오류 종결과 부모 대체는 한 번만 실행한다.
            부모 대체를 시작하면 같은 deferred의 완료 권한을 부모 생성 흐름에 넘긴다.
        의존:
            deferred — 완료 객체 생성; 함수: {deferred()}
            defined — 선택 상태 존재 판정; 함수: {defined()}
            U3dHeightLayer — 선행조건, 부모 대체와 지형 적용; 함수: {prototype.createHeight.call(), createParentHeight(), updateHeight(), changeHeight()}; 속성 읽기: {_headerCache, _burnLevels}
            U3dLayer — 타일 상태·로딩 수 관리; 함수: {setStateTile(), resetStateTile(), plusLoadingTile(), minusLoadingTile()}
            UFileLoader — 비동기 타일 요청, 소비자별 취소와 요청 생성 실패 정리; 함수: {load(), getLoading(), deleteCallBack(), abort()}; 속성 읽기·삭제: {callbackMap}; 속성 삭제: {loading}
            UCache — 활성 데이터·헤더 캐시 조회·확정과 실패 항목 제거; 함수: {createKeyByTile(), get(), add(), has(), remove()}
            LRUCache — 조회용 원자적 타일 항목 조회와 적용 실패 항목 제거; 함수: {get(), delete()}
            UDEF — 타일 로딩·완료 상태와 소비자 식별자; 상수: {TILE_STATE.{_loading, _end}}; 정적 함수: {createUUID()}
            __GInfo__ — 활성 캐시 중복 요청 진단; 함수: {__GInfo__()}
            U3dLayer — 요청 정책과 취소 등록 상태; 속성 읽기: {_cache, _maxlevel, _isCache, _cancelTiles}; 속성 쓰기·삭제: {_cancelTiles}
            THREE.Box3 — 레이어 범위와 타일 수평 경계의 교차 판정; 함수: {intersectsBox()}
            __UNION3D__.pako — 압축 응답 해제; 함수: {inflate()}
        동작:
            공간 교차와 상위 선행조건을 검사하고 실패하면 새 deferred를 false로 완료한다.
            opt.promise에 이 deferred를 기록한 뒤 실제 타일 레벨이 pass level을 넘고 번 레벨 목록에 있으면 부모 대체를 선택한다.
                부모가 없으면 false로 완료한다.
            실제 레벨이 _maxlevel을 넘으면 부모가 있을 때 대체하고 없으면 false로 완료한다.
            타일을 로딩 상태로 바꾸고 URL과 캐시 키를 만든 뒤 로딩 수를 증가시킨다.
            조회용 캐시에 타일 항목이 있으면 먼저 지형에 적용하고, 성공한 데이터와 헤더만 활성 캐시에 함께 복원한 뒤 완료 상태와 true 결과를 확정한다.
            조회용 타일의 지형 반영이 실패하면 해당 조회용·활성 캐시 항목을 제거하고 로딩 수를 감소시킨 뒤 오류로 완료한다. 처분된 타일은 상태 초기화 후 false로 완료한다.
            캐시에 없으면 고유 요청 ID의 소비자별 취소 callback을 등록하고 원격 파일을 요청한다.
            성공 응답은 필요한 경우 압축을 해제한다. 결과가 전체 ArrayBuffer이면 그대로 사용하고 TypedArray 등 view이면 유효 byteOffset·byteLength 범위만 새 버퍼로 복사한다.
            버전에 맞는 배열과 헤더로 변환한다.
            변환 결과를 지형에 적용하고 성공한 경우에만 데이터와 헤더를 조회용·활성 캐시에 함께 반영한다.
            지형 적용 뒤 로딩 수, 타일 상태와 true 결과를 확정한다.
            성공 callback이 취소된 요청 또는 처분된 타일을 받으면 자료를 해석하지 않고 로딩 수를 줄이고 타일 상태를 초기화하여 false로 완료한다.
            오류 종결은 취소 등록을 지우고 로딩 수를 한 번 줄인 뒤 메시지를 기록한다. 이미 종결된 오류 요청은 다시 처리하지 않는다.
            처분된 타일은 상태 초기화 후 false로 완료하며, 그 외의 파싱·다운로드·요청 생성 실패는 부모가 있으면 대체하고 없으면 상태 초기화 후 오류로 완료한다.
            요청 객체 생성이 즉시 실패하면 UFileLoader에 먼저 등록된 현재 callback과 단독 URL 로딩 항목을 회수한다.
            지오메트리 반영 실패는 관련 활성 캐시를 제거하고 부모 대체 없이 오류로 완료한다.

    async _getHeightTilePayload(tileX: number, tileY: number, level: number) -> Promise<U3dHeightTilePayload>
        역할: 좌표 조회와 지표면 분석이 공유할 타일 데이터와 복원 헤더를 준비한다.
        처리 기준:
            타일 인덱스와 레벨은 0 이상의 정수여야 한다.
            UMF 2.0 Uint16 활성 캐시는 같은 키의 헤더가 있을 때만 재사용한다.
            UMF 1.x의 2바이트 활성 캐시는 레이어 전역 복원값을 적용할 수 있으므로 헤더 없이 재사용한다.
        의존:
            UMercator — 재사용 좌표 변환기로 타일 경계 계산; 함수: {TileBounds()}
            defined — 캐시 적중 여부 판정; 함수: {defined()}
            U3dQuadTile — URL용 상대 레벨 계산; 정적 함수: {getStartLevel()}
        동작:
            조회·분석용 LRU와 활성 지형 캐시에서 타일 데이터와 헤더 묶음을 찾는다.
            캐시에 없으면 타일 경계의 중심으로 URL을 만들고 레이어 설정에 따라 파일을 요청·파싱한다.
            성공한 원격 결과를 조회·분석용 LRU에 저장하고 반환한다.

    async getHeightAtPoints(points: Array<{x: number, y: number} & Partial<{level: number}>>, level: number = 15, printProgress?: boolean) -> Promise<Array<{x: number, y: number, z: number | string, level: number, errorMsg: string | undefined}>>
        역할: 각 좌표의 타일 고도를 조회하고 네 표본 보간 결과를 반환한다.
        처리 기준:
            빈 목록은 빈 배열을 반환한다.
            x 또는 y가 0이어도 유효한 좌표로 처리하며 유한수가 아닌 좌표만 건너뛴다.
            좌표별 level이 null 또는 undefined이면 함수 level을 사용한다. 함수 인수의 기본값은 15이며 명시적 0은 그대로 사용한다.
            타일 요청이나 변환에 실패한 좌표는 z를 error로 기록하고 다음 좌표를 계속 처리한다.
            주변 표본이 모두 NoData이면 z에 TERRAIN_NO_DATA를 기록한다.
        의존:
            UMercator — 재사용 좌표 변환기로 타일 인덱스와 경계 계산; 함수: {MetersToTile(), TileBounds()}
            defined — 캐시 적중 여부 판정; 함수: {defined()}
            __GInfo__ — 진행률과 최종 처리 통계 출력; 함수: {__GInfo__()}
            UDEF — 유효 고도가 없는 결과값 제공; 상수: {TERRAIN_NO_DATA}
        동작:
            각 유효 좌표를 타일 인덱스와 경계로 변환한다.
            조회용 캐시에서 먼저 타일 값을 찾고 누락되면 공용 타일 페이로드 준비 흐름에 위임한다.
            계산 결과가 undefined이면 TERRAIN_NO_DATA를 사용하고 x·y·level·errorMsg와 함께 새 결과 항목을 기록한다.
            보간 결과를 추가하고 요청·캐시·오류 수와 선택적 진행률을 갱신한다.
            모든 좌표 결과를 반환한다.

    override initialize() -> void
        역할: 공통 초기화 후 XML 사용 여부에 따라 레이어 공간 범위를 준비한다.
        의존:
            U3dHeightLayer — 공통 초기화; 함수: {prototype.initialize.call()}
            초기화 완료 수신자(this) — 런타임에 제공된 선택적 완료·실패 함수 호출; 콜백: {resolve(), reject()}
            Web API — XML 없는 초기화 완료 예약; 함수: {setTimeout()}
        동작:
            상위 초기화를 수행한다.
            XML이 필요하면 XML 읽기에 위임한다.
            XML이 필요하지 않으면 현재 BoundingBox로 공간 범위를 계산하고, 실패하면 초기화 Promise를 거절한다.
            XML 없는 공간 계산에 성공하면 1ms 타이머에 선택적 resolve(this) 호출을 예약한다.

    getBoundingBox() -> THREE.Box3 | undefined
        동작: 계산된 레이어 Box3를 반환한다.

    isCache() -> boolean
        의존: U3dLayer — 상속 캐시 설정 조회; 속성 읽기: {_isCache}
        동작: _isCache를 반환한다.

    readXml(baseUrl?: string) -> void
        역할: 타일맵 XML을 요청하여 레이어 설정과 공간 범위를 초기화한다.
        인터페이스: onload의 this는 응답 XMLHttpRequest이며 레이어 수신자는 별도 closure로 유지한다.
        의존:
            Web API — XML 비동기 요청; 생성자: {new XMLHttpRequest()}; 함수: {overrideMimeType(), open(), send()}
            defined — 기본 URL과 구분자 판정; 함수: {defined()}
            초기화 완료 수신자(layer) — 런타임에 제공된 선택적 완료·실패 함수 호출; 콜백: {resolve(), reject()}
        동작:
            baseUrl 또는 레이어 기본 URL로 tilemapresource.xml 주소를 만든다.
            HTTP 상태가 정확히 200이면 XML 설정을 반영하고 공간 범위를 계산한 뒤 선택적 resolve(this)를 호출한다.
            XML 파싱·공간 계산, HTTP 상태 또는 네트워크 요청이 실패하면 초기화 Promise를 거절한다.

    parseXml(xml: XMLHttpRequest) -> boolean
        역할: 타일맵 XML의 검증된 설정을 레이어에 반영한다.
        의존:
            Web API — 응답 문자열의 XML 대체 파싱과 실패 진단; 생성자: {new DOMParser()}; 함수: {parseFromString(), console.info()}
            defined — XML 문서·대체 문자열 존재 판정; 함수: {defined()}
            U3dHeightLayer — 검증된 자료 버전과 복원 설정 확정; 속성 쓰기: {_majorVersion, _minorVersion, _dataScale, _dataOffset}
        동작:
            responseXML이 없고 responseText가 있으면 DOMParser로 문자열을 파싱한다. 문서를 얻지 못하면 false를 반환한다.
            전체 검증 성공 뒤 주·부 버전과 버전 명시 상태를 먼저 저장하고 격자·표본 크기를 반영한다.
            선택적 표본 형식과 압축 문자열이 null이 아니면 현재 설정을 덮어쓰며 압축은 문자열 true와 정확히 같은 경우에만 켠다.
            데이터 배율·오프셋과 입력 공간 범위를 저장한 뒤 true를 반환한다.
            대체 파싱·검증·상태 반영 중 예외가 발생하면 메시지를 출력하고 false를 반환한다.

    override disposeTile(tile: U3dQuadTile, opt?: object) -> void
        역할: 소비자별 요청 취소와 공통 타일 자원 정리를 상위 처분 흐름에 위임한다.
        의존: U3dHeightLayer — 공통 타일 처분과 등록된 취소 callback 실행; 함수: {prototype.disposeTile.call()}
        동작:
            상위 처분 흐름이 현재 타일의 등록된 취소 callback과 나머지 타일 자원을 정리하도록 위임한다.

    createUrl(tile: TileUrlParam) -> string
        역할: 타일 중심과 레벨을 파일 URL로 변환한다.
        의존:
            UMathEngine — XYZ 타일 URL 생성; 정적 함수: {createUrl()}
            U3dLayer — 상속 파일 확장자 조회; 속성 읽기: {_ext}
            U3dQuadTile — 타일 시작 레벨 조회; 정적 함수: {getStartLevel()}
        동작: 현재 URL, 확장자, 축 반전과 시작 레벨 설정으로 타일 URL을 만들어 반환한다.

    override setApp(app: U3dApp) -> void
        역할: 앱을 연결하고 지형 분할·스커트 설정을 동기화한다.
        의존:
            U3dHeightLayer — 앱 연결과 분할 설정 반영; 함수: {prototype.setApp.call()}; 속성 쓰기: {_segVertex}
            U3dApp — 지형 분할값 조회; 함수: {getSegVertex()}; 속성 읽기: {_drawArg}
            UDrawArg — 스커트 사용 여부 조회; 함수: {getSkirt()}
        동작: 상위 앱 연결을 수행하고 앱의 분할값과 draw argument의 스커트 설정을 저장한다.

    override getMetaData() -> UMeta
        역할: 공통 메타데이터에 XYZ 고도 레이어 설정을 추가한다.
        의존: U3dHeightLayer — 공통 메타데이터 생성; 함수: {prototype.getMetaData.call()}
        동작: 상위 메타데이터에 축 반전, 프록시, 타일 형식과 XML 사용 설정을 추가하여 반환한다.

    #createTilePayload(source: ArrayBuffer | ArrayLike<number>) -> U3dHeightTilePayload
        역할: 원본 응답을 지형·조회에 전달할 타일 값으로 변환한다.
        동작:
    #getCachedTilePayload(tileKey: string) -> U3dHeightTilePayload | undefined
        역할: 조회용 LRU와 활성 캐시에서 재사용할 고도 표본 묶음을 찾는다.
        의존:
            LRUCache — 조회용 항목 조회; 함수: {get()}
            defined — LRU 적중 여부 판정; 함수: {defined()}
            U3dLayer — 상속 활성 데이터 캐시 조회; 속성 읽기: {_cache}
            U3dHeightLayer — 상속 메타데이터 캐시 조회; 속성 읽기: {_headerCache}
            UCache — 활성 데이터와 헤더 조회; 함수: {has(), get()}
        동작:
            LRU 타일 값이 있으면 즉시 반환한다.
            활성 데이터 캐시 또는 해당 키가 없으면 undefined를 반환한다.
            활성 데이터와 같은 키의 선택적 헤더를 조회한다.
    #loadTilePayloadByUrl(sourceUrl: string) -> Promise<U3dHeightTilePayload>
        역할: 레이어의 압축·버전 설정으로 원격 고도 타일을 요청하고 해석한다.
        의존:
            UFileLoader — ArrayBuffer 요청; 함수: {load()}
            __GEONDT__.pako — 압축 응답 해제; 함수: {inflate()}
        동작:
            압축 설정이면 URL 확장자와 응답 압축 해제를 적용한다.
            압축 해제 결과가 ArrayBuffer이면 그대로 사용하고 view이면 byteOffset·byteLength의 유효 범위만 새 버퍼로 복사한다.
            해제된 원본 응답을 버전에 맞는 타일 값으로 변환하여 완료하고, 요청·압축·파싱 오류는 거절한다.

    #putDataCache(tileKey: string, tilePayload: U3dHeightTilePayload) -> void
        역할: 데이터와 헤더가 묶인 타일 값을 조회용 LRU 캐시에 저장한다.
        처리 기준:
            #dataCacheSize는 배열 바이트 크기가 아니라 보관할 타일 개수로 적용한다.
            새 타일로 상한을 넘기기 전에 가장 오래 사용하지 않은 타일 전체를 제거한다.
        의존:
            LRUCache — 타일 개수·최근 사용 순서와 항목 수명주기 관리; 함수: {has(), length(), getLeastRecent(), delete(), put()}
            defined — 캐시·최장 미사용 항목·헤더 존재 판정; 함수: {defined()}
        동작:
            캐시가 없으면 무동작한다.
            새 키이며 항목 수가 #dataCacheSize 이상이면 가장 오래 사용하지 않은 항목 하나를 제거한다.
            데이터는 같은 참조를, 헤더는 존재하면 얕은 복사본을 저장하며 항목 byteLength를 100000으로 기록한다.

    #computeRectangle() -> boolean
        역할: 입력 BoundingBox를 앱 좌표계의 레이어 범위와 Box3로 변환한다.
        처리 기준: 생성자 boundingbox의 선언은 Box3이지만 이 경로는 minx·miny·maxx·maxy 필드를 읽는다. [확인 Q-001]
        의존:
            defined — 필수 상태 존재 판정; 함수: {defined()}
            U3dMessage — 누락 설정 오류 기록; 정적 함수: {error()}
            UDrawArg — 지리 좌표를 Google 좌표로 변환; 함수: {getGeographicToGoogle()}
            U3dLayer — 상속 draw argument와 결과 범위 연계; 속성 읽기: {_drawArg}; 속성 쓰기: {_rectangle, _rectangle3d}
            UMathEngine — UGeoRect 생성; 정적 함수: {createUGeoRect()}
            UDEF — 결과 범위의 좌표계 식별; 상수: {GOOGLE}
            THREE.Vector3 — Box3 경계점 생성; 생성자: {new THREE.Vector3()}
        동작:
            BoundingBox 또는 draw argument가 없으면 오류를 기록하고 false를 반환한다.
            최소·최대 좌표를 앱 좌표로 변환하여 2차원·3차원 레이어 범위와 Box3에 저장한다.
            계산을 완료하면 true를 반환한다.

U3dHeightXYZFormatState 타입 정의
    _width, _height: number | undefined
        XML·파일 입력에 적용할 현재 격자 크기
    _unitHeight, _majorVersion, _minorVersion: number
        현재 표본 크기와 자료 버전
    _dataScale, _dataOffset: number
        XML에 생략된 복원 설정의 대체값

U3dHeightXYZParsedSettings 타입 정의
    parsedMajorVersion, parsedMinorVersion: number
        검증된 자료 버전
    hasDeclaredVersion: boolean
        XML에서 주·부 버전을 모두 명시했는지 여부
    parsedWidth, parsedHeight: number | undefined
        검증된 표본 격자
    parsedUnitHeight: number
        검증된 표본 크기
    unitType, compress: string | null
        선택적 표본 형식·압축 문자열이며 null은 현재 설정 유지
    parsedDataScale, parsedDataOffset: number
        검증된 복원 설정
    parsedBoundingBox: {minx: number, miny: number, maxx: number, maxy: number}
        검증된 입력 공간 범위

U3dHeightXYZSampleState 타입 정의
    _width, _height: number | undefined
        타일 헤더에 크기가 없을 때 적용할 표본 격자
    _dataScale, _dataOffset: number
        헤더에 복원값이 없을 때 적용할 배율과 오프셋

U3dHeightInflatedBuffer = ArrayBuffer | ArrayBufferView 타입 정의

U3dHeightTilePayload 타입 정의
    data: ArrayLike<number>
        원시 고도 표본 배열
    header: U3dHeightTileHeader | undefined
        UMF 2.0 타일별 복원 헤더
    byteLength: number
        캐시 용량 계산에 사용하는 항목 크기

U3dHeightXYZLayerCO_Content 타입 정의
    name, baseUrl, ext: string
        선언상 필수인 레이어 이름·자료 URL·확장자
    reverseX?, reverseY?, useproxy?: boolean
        축 반전·프록시 사용 설정이며 undefined이면 false
    proxyurl?: string = './proxy.jsp?url='
        프록시 사용 시 기본 URL 앞에 붙이는 문자열
    width?, height?: number = 64
        XML에서 덮어쓰기 전 표본 격자 기본값
    unitheight?: number = 4
        원시 표본 바이트 크기
    defaultheight?, defaultHeight?: number = 0
        런타임에서는 truthy인 defaultheight, defaultHeight, 0 순서로 선택한다.
    unitvec3?: number = 3
        벡터 단위 설정값
    unittype?: string = 'float'
        표본 형식 이름
    needXml?: boolean = true
        XML 초기화 요청 여부
    skirt?: boolean = true
        가장자리 스커트 사용 여부
    skirtheight?: number = 40
        스커트 높이 설정값
    pTileSearchBuffer?, pTileSubBuffer?: number = 1
        부모 타일 검색·분할 버퍼 설정값
    boundingbox?: Box3
        공개 선언의 입력 타입이며 범위 계산은 minx·miny·maxx·maxy 필드를 읽는다. [확인 Q-001]
    realmaxlevel?: number
        실제 최대 레벨 설정값

U3dHeightXYZLayerCO extends U3dHeightLayerCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        U3dHeightXYZLayerCO_Content의 모든 필드
            기반 고도 레이어 옵션과 XYZ 고유 옵션의 교집합이며 각 필드 의미는 고유 옵션 타입에 기록한다.

TileUrlParam 타입 정의
    _centerX, _centerY: number
        타일 URL을 계산할 중심 좌표
    _level: number
        타일 시작 레벨에 상대적인 레벨
```

## 4. 공통 처리 기준과 제약

```spec
UMF 2.0 헤더는 magic 4바이트, 버전·헤더 크기·격자·표본 형식·플래그, scale·offset, noData와 표본 수 순서로 구성된다.
원격 요청으로 증가시킨 로딩 작업 수는 성공, 실패, 취소와 타일 처분의 모든 종결 경로에서 한 번 감소해야 한다.
활성 고도 캐시의 UMF 2.0 데이터에는 같은 타일 키의 헤더가 함께 있어야 한다.
XML을 사용하지 않는 레이어도 파일의 UMF2 magic을 우선 판별한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
