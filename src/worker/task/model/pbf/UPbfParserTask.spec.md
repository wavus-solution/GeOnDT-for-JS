# UPbfParserTask 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UPbfParserTask`는 `UWorker` 가 로드하는 워커 태스크 모듈로, PBF(Mapbox Vector Tile) 타일을 다운로드하고 MVT 바이너리를 디코드한다. 이미지 PBF 레이어를 위해 OffscreenCanvas 에 면과 선을 그려 `ImageBitmap` 을 돌려주는 경로(`loadPbf`)와, 벡터 PBF 레이어를 위해 디코드된 원본 피처만 돌려주는 경로(`loadPbfFeatures`)를 제공한다. 모듈 내부에 MVT 디코더(`UserPbfReader`)와 디코드 결과 피처(`URawFeature`)를 함께 둔다.

### 1.2 책임 범위

- 워커 안에서 PBF 타일 URL 을 `UFileLoader` 로 내려받고 URL 단위로 다운로드를 중단한다.
- MVT protobuf 를 레이어·피처·지오메트리(타일 로컬 좌표, flat 좌표 배열과 ends)로 디코드한다.
- 작업자 클래스는 `UPbfGeometryWasmBridge`를 비공개 정적 필드 `#wasm`으로 소유하고, 경로 설정·디코드·종료를 이 참조로 처리한다.
- 두 Bridge의 공통 경로·초기화·종료 무효화는 `union3d/worker/task/model/UWasmBridge.js`의 부모 클래스를 상속해 사용한다. 각 Bridge의 비공개 `#wasm`·Rust 컨텍스트와 데칼의 타일 캐시는 해당 Bridge가 소유하고 정리한다. 공통 동작 계약은 `union3d/worker/task/model/UWasmBridge.spec.md`를 따른다.
- JS 연결 파일과 타입은 이 Task와 같은 `worker/task/model/pbf/`에 둔다. Rust 원본은 `union3d/wasm/rust/pbf-geometry/`에 두고 생성 바이너리는 `union3d/wasm/source/pbf-geometry/pbf.wasm`에서 관리한다. `npm run 빌드:WASM`은 `gulpfile.js/wasmBuilders.js`에 등록한 모듈을 `gulpfile.js/buildWasm.js`로 일괄 빌드한다. 배포 시 `gulpfile.js/copyResource.js`가 `union3d/wasm/source/`의 내용을 제품의 `wasm/`으로 복사하며 PBF 파일은 `wasm/pbf-geometry/pbf.wasm`에 배치한다. 로더는 전달받은 절대 파일 주소에서 지연 로드한다.
- `loadPbf`: 메인 스레드에서 문자열로 넘어온 ol 규격 스타일 함수를 워커에서 복원해 Polygon 은 캔버스에 채우고 LineString·MultiLineString 은 선으로 그린 뒤 `ImageBitmap` 으로 변환한다.
- `loadPbfFeatures`: 포함·제외 레이어와 점 필터를 형상 해석 전에 적용한다. `worldBounds`가 있으면 좌표 변환·파트 bbox·로컬 부호 면적·타일 절단 변을 뺀 실제 외곽선도 준비한다. 기본 응답은 레이어별 평탄 전송 버퍼이며, 준비된 Rust의 내부 `packedGeometry` 요청은 요청 단위 버퍼와 위치 표로 반환한다. 문자열·properties는 JS에서 유지한다.
- 책임 경계: 작업 배정과 결과 전달은 `UWorker`/`UTaskProcessor`가 담당한다. 사용자 필터·스타일과 타일 표시는 호출 레이어가 담당한다. 좌표계 변환은 `worldBounds`가 있으면 Worker, 없으면 기존 호출 레이어 경로를 사용한다.

### 1.3 주요 동작 방식

벡터 레이어는 내부 `packedGeometry` 요청으로 형상별 뷰 대신 요청 단위의 독립 버퍼와 위치 표를 받을 수 있다. 기본 디코드 호출은 기존 피처별 좌표·파트·외곽선 형식을 유지한다. 준비된 Rust에서는 입력 표를 임시 배열 없이 기록하고 출력 버퍼를 한 번씩 복사하여 Worker에 피처별 형상 뷰를 만들지 않는다. 준비 전·초기화 실패·트랩의 JS 대체 응답은 기존 형식을 유지한다. 메인은 두 응답을 모두 지원한다.

일괄 결과의 `geometry`는 버전 1, 피처별 6성분 Uint32 위치 표, Float64 좌표와 Uint32 파트 끝 배열을 담는다. 월드 변환일 때만 파트 6성분·외곽선 7성분 표와 외곽선 좌표를 추가한다. 위치 표는 전체 레이어·피처의 순서이며 외곽선 파트 번호는 요청 전역 번호다. 로컬 좌표에서는 Rust가 남긴 외곽선 위치를 소비하지 않는다. 각 배열은 WASM과 독립적이며 UWorker가 최대 여섯 버퍼를 유일하게 전송한다. 종료·다음 요청·전송이 이미 받은 값을 변경하지 않는다.

`UWorker` 는 메시지의 `type`/`subType` 으로 `UPbfParserTask.<subType>(data)` 를 호출하고 반환된 promise 결과를 메인 스레드로 보낸다. 두 로드 경로는 모두 공유 `UFileLoader` 로 arraybuffer 를 받은 뒤 `UserPbfReader` 로 레이어 → 피처 → 지오메트리를 읽는다. `loadPbf` 는 요청 타일과 실제 데이터 타일(realMaxLevel 부모)의 경계 차이로 변환 행렬을 만들어 부분 영역만 그리고, `loadPbfFeatures` 는 그리지 않고 디코드 결과만 구조화한다.

### 1.4 주요 사용처와 연계 대상

- `U3dImagePBFLayer.g_TaskProcessor` 가 이 모듈을 5개 워커에 로드하며, `U3dImagePBFLayer.createTexture()` 가 `loadPbf` 를 요청한다. `abort` 는 타일 폐기(`disposeTileByKey()`)뿐 아니라 숨기기·refresh 가 부르는 타일 취소(`cancelTileByKey()`)에서도 요청되며, 어느 워커가 작업을 맡았는지 모르므로 모든 워커에 브로드캐스트한다.
- `U3dVectorPBFLayer` 가 같은 처리기로 `loadPbfFeatures` 와 `abort` 를 요청한다.
- `union3d/package.js` 가 이 파일을 워커 번들 대상으로 등록한다.
- 워커 모듈 초기화 시 전역 `self.ol` 에 가짜 ol.style 네임스페이스와 `fill`, `stroke`, `polygon`, `strokedPolygon`, `line`, `text` 스타일 객체를 만들어, 문자열로 복원된 예제 스타일 함수(`createMapboxStreetsV6Style` 반환 함수)가 참조하는 클로저 변수를 대신한다.

## 3. 정규 자연어 수도코드

```spec
모듈 초기화 책임 그룹
    역할: 워커 전역에 디코드 상수와 스타일 함수 복원용 가짜 ol 네임스페이스를 준비한다.

    GeometryType: {POINT, LINE_STRING, LINEAR_RING, POLYGON, MULTI_POINT, MULTI_LINE_STRING, MULTI_POLYGON, GEOMETRY_COLLECTION, CIRCLE}
        디코드 결과 피처의 지오메트리 타입 문자열('Point', 'LineString', 'Polygon' 등)

    Pbf: {Varint: 0, Fixed64: 1, Bytes: 2, Fixed32: 5}
        protobuf wire type 상수

    ol: {style: {Fill, Stroke, Style, Text, Icon}}
        color·width·font 만 보관하는 최소 ol.style 대체 클래스 집합

    self.ol: object
        로컬 ol 대체 네임스페이스를 같은 참조로 보관한다.
    self.fill: object
        빈 색의 Fill 인스턴스다.
    self.stroke: object
        빈 색·폭 1의 Stroke 인스턴스다.
    self.polygon: object
        self.fill을 공유하는 Style이다.
    self.strokedPolygon: object
        self.fill·self.stroke를 함께 공유하는 Style이다.
    self.line: object
        self.stroke만 공유하는 Style이다.
    self.text: object
        가짜 Text를 text 속성으로 보관하는 Style이다.
        위 전역 객체는 new Function으로 복원한 스타일 함수가 참조하며 별도 복사하지 않는다.

UPbfParserTask 클래스 정의
    역할: 워커 태스크 진입점. 모든 멤버는 static 이며 인스턴스를 만들지 않는다.

    static loader: UFileLoader | undefined
        arraybuffer 응답용 공유 로더. 첫 요청에서 생성한다.

    static taskMap: Record<string, AbortController> = {}
        요청 식별자별 진행 중 요청 표식. abort() 의 대상 판정에 사용한다.

    static #wasm: UPbfGeometryWasmBridge | null
        형상 연결 클래스를 사용할 수 있으면 한 인스턴스를 생성하고, 정의되지 않은 실행 경계에서는 null이다.

    extent_: Array<number> | null
        parsePbf가 정적 호출 수신 객체인 클래스에 기록하는 마지막 레이어의 extent 경계다.

    static IMAGE_FLIP_Y: boolean = true
        loadPbf 캔버스 그리기에서 Y 축을 반전할지 여부

    static _STRICT_DRAW: boolean = true
        loadPbf 에서 스타일이 없는 피처를 건너뛸지(true) 기본색으로 그릴지(false) 여부

    static mercator: UMercator
        타일 경계 계산기
        의존:
            UMercator — 타일 경계 계산기 생성; 생성자: {new UMercator()}

    static abort(requestId: string) -> void
        역할: 해당 요청의 AbortController 를 중단한다. 동일 URL의 다른 소비자는 유지한다.
        처리 기준: 등록되지 않은 요청 식별자는 무시한다.

        의존: AbortController — 소비자 취소; 함수: {abort()}

        동작:
            taskMap에서 requestId의 컨트롤러를 찾아 존재하면 abort를 호출한다.

    static runRequest<T>(params: {url: string} & Partial<{requestId: string}>, processData: function(ArrayBuffer, AbortSignal): Promise<T>) -> Promise<T>
        역할: 요청별 다운로드·후속 처리·취소의 종료를 보장한다.
        동작:
            공유 로더를 준비한다.
            requestId 별 AbortController 를 등록한다. requestId가 비어 있거나 생략되면 기존 호출 호환을 위해 URL을 쓴다.
            UFileLoader.load 의 callback ID 로 requestId 를 전달한다.
            취소 시 Promise 를 즉시 거부하고 cancelById 로 해당 소비자만 제거한다.
            마지막 소비자가 사라지면 실제 fetch 도 중단한다.
            다운로드와 비동기 후속 처리의 오류를 모두 호출자에게 전달한다.
            finally 에서 자기 요청의 taskMap 항목만 정리한다.

    static ensureLoader() -> void
        역할: 공유 UFileLoader 를 한 번만 생성한다.

        의존:
            UFileLoader — arraybuffer 로더 생성과 설정; 생성자: {new UFileLoader()}; 함수: {setResponseType()}; 속성 쓰기: {crossOrigin}

        동작:
            loader 가 없으면 생성하고 crossOrigin 'anonymous', 응답 타입 'arraybuffer' 로 설정한다.

    static async gunzipIfNeeded(buffer: ArrayBuffer) -> Promise<ArrayBuffer>
        역할: 응답 버퍼가 gzip 이면 압축을 풀어 MVT 디코더가 읽을 수 있는 버퍼로 만든다.

        인터페이스:
            buffer: 다운로드 응답 버퍼
            반환: gzip 이면 푼 버퍼, 아니면 입력 버퍼 그대로

        처리 기준:
            Content-Encoding: gzip 없이 gzip 원본을 내려주는 타일 서버가 있고, 그 응답은 브라우저가 풀어주지 않아 디코드가 실패하므로 매직 넘버로 직접 판별한다.
            버퍼가 없거나 2바이트 미만이면 그대로 반환한다.
            앞 두 바이트가 0x1f 0x8b 가 아니면 그대로 반환한다.
            DecompressionStream 이 없는 환경이면 오류를 던져 호출부가 실패로 처리하게 한다.

        의존:
            Compression Streams API — gzip 해제; 생성자: {new DecompressionStream()}
            Fetch API — 버퍼와 스트림 변환; 생성자: {new Response()}; 함수: {arrayBuffer()}; 속성 읽기: {body}

        동작:
            버퍼 앞 두 바이트를 읽어 gzip 매직 넘버가 아니면 입력 버퍼를 그대로 반환한다.
            gzip 이면 응답 본문 스트림을 gzip 해제 스트림으로 통과시켜 푼 ArrayBuffer 를 반환한다.

    static loadPbfFeatures(params: {url: string, requestId?: string, wasmPath?: string, includeLayers?: Array<string>, excludeLayers?: Array<string>, drawPoints?: boolean, worldBounds?: Array<number>, packedGeometry?: boolean}) -> Promise<U3dVectorPBFDecodeResult | undefined>
        역할: PBF 타일을 내려받아 디코드한 원본 피처를 캔버스 그리기 없이 반환한다.

        인터페이스:
            params.url: 내려받을 PBF URL
            params.includeLayers, excludeLayers: 해석할 레이어 이름이며 빈 목록은 필터 없음이다.
            params.drawPoints: false이면 Point의 형상 해석을 생략한다.
            params.worldBounds: 있으면 유한한 월드 타일 경계이며 결과 레이어의 worldCoordinates를 true로 둔다.
            params.packedGeometry: true이고 Rust가 준비됐으면 형상별 뷰 대신 요청 단위 geometry 버퍼를 반환한다.
            반환: {layers} 이며 다운로드 실패·중단이면 {layers: [], failed: true, url}

        처리 기준:
            실패·중단은 reject 하지 않고 failed 플래그로 resolve 한다. UTaskProcessor 가 reject 마다 오류 메시지를 남기고 타일 취소가 빈번하기 때문이다.
            gzip 해제·디코드 중 예외도 reject 하지 않고 reason 'decode' 와 예외 메시지를 담은 failed 결과로 resolve 한다. 빈 결과로 확정하면 기존 화면이 지워지므로 재시도 대상으로 구분한다.
            요청 시작 시 taskMap 에 AbortController 를 등록하고 성공·실패 모두에서 제거한다.

        의존:
            UFileLoader — PBF 다운로드; 함수: {load()}
            Worker API — 중단 표식 생성; 생성자: {new AbortController()}

        동작:
            `UDEF.PBF_WASM_PATH`를 메인 문서 기준 절대 파일 주소인 wasmPath로 받아 로더의 setPath에 전달한 뒤 Worker에서 형상 WASM을 지연 초기화한다. 다운로드와 병행하며 초기화 때문에 요청을 기다리지 않는다.
            runRequest로 요청을 등록하고 다운로드한다.
            후속 비동기 처리에서 gzip을 해제한다.
            signal.aborted가 false이면 해제한 버퍼를 디코드한다.
            gzip 해제 이후에도 취소 여부를 확인해 취소됐다면 디코드를 생략한다.
            gzip 해제·디코드 예외는 reason 'decode'로 반환한다.
            취소·다운로드 실패는 describeLoadFailure 결과로 반환한다.

    static describeLoadFailure(url: string, error: unknown) -> {layers: Array<object>, failed: boolean, url: string, status: number | undefined, aborted: boolean, reason: string, message: string}
        역할: 다운로드 오류를 타일 레이어가 구분할 수 있는 실패 결과로 바꾼다.

        동작:
            객체 오류의 status를 숫자로 바꾸고 유한할 때만 HTTP 상태로 사용한다.
            오류 이름이 AbortError이거나 오류 자체가 'delete Callback'이면 aborted를 true로 둔다.
            빈 layers·failed true·url·status·aborted를 반환한다.
            reason은 취소이면 aborted, 상태가 있으면 http, 그 밖에는 network다.
            message는 문자열 message 속성이 있으면 그 값, 아니면 오류를 문자열로 바꾼 값이다.

    static decodePbfLayers(buffer: ArrayBuffer, options: Partial<{includeLayers: Array<string>, excludeLayers: Array<string>, drawPoints: boolean, worldBounds: Array<number>, packedGeometry: boolean}> = {}) -> {layers: Array<U3dVectorPBFDecodedLayer>, geometry?: PbfGeometryBatch, _transferables: Array<ArrayBuffer>}
        역할: MVT 버퍼를 레이어별 extent 와 피처 목록으로 디코드하고 좌표 배열을 transferable 로 만든다.

        처리 기준:
            버퍼가 없거나 길이 0 이면 빈 layers 를 반환한다.
            worldBounds가 참인 값이면 유한한 네 성분과 양수 가로·세로 범위를 검증하며 위반은 Error다.
            type 0(UNKNOWN) 피처는 제외한다.
            레이어 필터는 원본 피처를 읽기 전에, 점 필터는 형상을 전개하기 전에 적용한다. 익명 ID가 달라지지 않도록 점 제외 전 순번을 _sourceIndex에 보존한다.
            레이어 extent 가 없으면 4096 을 사용한다.
            기본 응답과 JS 대체 경로는 레이어마다 좌표 버퍼를 하나 만들고 피처별 비중첩 Float64Array 뷰로 나눈다. ends는 각 피처 뷰 기준으로 유지한다.
            packedGeometry와 준비된 Rust를 함께 사용하면 layers의 피처에는 식별자·타입·속성만 두고, 요청 전체의 형상 버퍼와 위치 표를 geometry로 반환한다. 로컬은 세 개, 월드 전처리는 여섯 개의 독립 버퍼를 `_transferables`에 한 번씩 넣는다.
            기본 응답은 피처가 있는 레이어의 공용 buffer를 `_transferables`에 한 번씩 넣어 UWorker가 소유권을 이전한다. 월드 전처리는 공용 partInfo와 필요한 외곽선 좌표 버퍼도 포함한다. 알려진 타입의 빈 형상은 길이 0인 뷰로 보존한다.

        동작:
            buffer가 없거나 길이가 0이면 빈 layers와 전송 목록을 즉시 반환한다.
            나머지 입력은 worldBounds가 있으면 유한한 네 값과 양수 가로·세로 범위를 검사하고 위반 시 Error를 던진다.
            리더를 만들고 레이어 컬렉션을 읽는다.
            선택한 레이어의 원시 피처를 읽고 속성·형상 위치·타입·extent·소속 레이어를 JS에서 모은다.
            원시 피처가 있으면 형상 Bridge의 decode를 시도하고, 없으면 빈 형상 목록을 사용한다.
            Rust가 batch를 반환하면 위치 표의 파트 수로 피처 타입을 정하고 geometry·전송 버퍼를 결과에 넣어 즉시 반환한다.
            Bridge가 준비되지 않았거나 트랩으로 결과가 없으면 JS로 각 원시 피처를 복원한다.
                worldBounds가 있으면 복원 좌표를 월드 좌표·파트 bbox·로컬 부호 면적·절단 외곽선으로 변환한다.
                대체 계산한 형상을 레이어별 공용 버퍼로 만든다.
            Rust의 기본 형식 또는 JS 결과를 레이어·피처 순서로 배치한다.
                기본 결과에서도 getGeometryType_로 타입을 정한 뒤 형상 데이터를 피처에 붙인다.
                좌표·선택적 partInfo·외곽선의 버퍼를 Set에 모아 같은 버퍼를 한 번만 전송하도록 한다.
            레이어별 독립 버퍼와 피처 내부 기준 ends를 유지한 결과를 반환한다.

    static dispose() -> void
        역할: 진행 중 요청을 중단하고 형상 WASM의 컨텍스트·참조를 해제한다. 늦은 초기화는 적용하지 않는다.

        의존:
            AbortController — 진행 요청 중단; 함수: {abort()}

        동작:
            taskMap에 현재 등록된 컨트롤러를 순회하여 abort를 호출한다.
            #wasm이 있으면 dispose를 호출해 공통 부모의 초기화 세대와 모듈 컨텍스트를 정리한다.
            요청 표식의 제거는 각 runRequest의 finally가 자기 컨트롤러인지 확인한 뒤 수행한다.

    static loadPbf(params: {url: string, realUrl: string, requestId?: string, canvas: OffscreenCanvas, styleFunctionString: string, imageSize: number, curTile: {x, y, level}, orderTile: {x, y, level}, resolutionByLevel: number}) -> Promise<ImageBitmap | undefined>
        역할: 실제 데이터 타일(realUrl)을 내려받아 요청 타일(curTile) 영역의 면과 선을 OffscreenCanvas 에 그리고 ImageBitmap 으로 반환한다.

        인터페이스:
            params.url: 표시 타일 URL. requestId 가 없을 때만 취소 식별자로 사용한다.
            params.requestId: 다운로드 URL과 별개인 요청별 취소 식별자.
            params.realUrl: 실제 다운로드 URL. realMaxLevel 을 넘는 타일은 부모 타일 URL 이다.
            params.canvas: transfer 로 넘어온 OffscreenCanvas
            params.styleFunctionString: 메인 스레드 스타일 함수의 toString() 결과
            params.curTile, params.orderTile: 요청 타일과 실제 데이터 타일의 인덱스·레벨
            params.resolutionByLevel: 스타일 함수에 넘길 해상도
            반환: 그리기가 끝난 캔버스의 ImageBitmap. 취소 또는 HTTP 404(데이터 없는 타일)이면 undefined, 그 밖의 다운로드·처리 오류 시 reject. 404는 이미지 레이어의 정상 무결과 완료 경로로 전달해 로딩 카운터와 대기 작업을 정리한다.

        처리 기준:
            스타일 함수는 `new Function('return ' + 문자열)()` 로 복원하며, 함수가 참조하는 클로저 변수는 모듈 초기화의 self 전역 스타일 객체로 대체된다.
            extent 는 레이어 값과 무관하게 4096 으로 고정한다. [확인 Q-002]
            IMAGE_FLIP_Y 가 true 이면 캔버스 좌표를 Y 반전한다.
            요청 타일과 데이터 타일의 레벨이 다르면 두 타일 경계의 크기 비와 오프셋을 Math.round로 반올림해 데이터 타일 안의 요청 타일 부분 영역을 잘라내는 변환(scale, translate)을 만든다.
            Polygon, LineString 과 MultiLineString 이 아닌 피처와 parsePbf 가 돌려준 null 은 그리지 않는다.
            면은 부분마다 경로를 닫고 선은 닫지 않아 끝점과 시작점을 잇는 구간을 만들지 않는다.
            스타일 함수 결과가 비어 있으면 _STRICT_DRAW 가 true 일 때 건너뛰고, false 일 때 기본 선 'blue' 두께 1 로 그리며 면은 채움 'rgb(164,238,232)' 도 적용한다.
            스타일이 있으면 면은 첫 스타일에 fill이 있으면 채운 뒤 stroke가 있으면 외곽선을 그린다. 선은 fill을 사용하지 않고 stroke가 있을 때만 그린다.
            선 두께는 타일 캔버스의 픽셀 단위이며 타일 레벨로 보정하지 않는다. 스타일 함수가 resolutionByLevel 로 레벨별 두께를 결정한다.
            stroke 두께가 양수가 아니면 1 을 사용해 직전 피처의 두께가 남지 않게 한다.
            성공·취소·실패 모두 runRequest 의 finally 에서 taskMap 항목을 정리한다.
            압축 해제·디코드·그리기 예외는 반환 Promise 를 거부하며, 취소만 undefined 로 정상 완료한다.

        의존:
            UFileLoader — PBF 다운로드; 함수: {load()}
            UMercator — 두 타일의 3857 경계 계산; 함수: {TileBounds()}
            defined — 피처 null 과 스타일 fill·stroke 존재 여부 판정; 함수: {defined()}
            Worker API — 중단 표식 생성과 캔버스 그리기; 생성자: {new AbortController()}; 함수: {OffscreenCanvas.getContext(), OffscreenCanvas.transferToImageBitmap(), CanvasRenderingContext2D.{translate(), scale(), clearRect(), beginPath(), moveTo(), lineTo(), closePath(), fill(), stroke()}}; 속성 쓰기: {CanvasRenderingContext2D.{filter, fillStyle, strokeStyle, lineWidth, lineCap, lineJoin}}

        동작:
            스타일 함수를 복원하고 로더가 없으면 생성한다.
            runRequest에 실제 다운로드 URL과 요청 식별자를 넘겨 작업을 시작한다.
            성공 콜백에서 gzip 이면 압축을 풀고 취소 여부를 확인한다. 취소 시 이후 그리기를 생략한다.
            Y 반전과 레벨 차이에 따른 부분 영역 변환을 계산하고 캔버스를 비운 뒤 filter 'contrast(115%) saturate(80%)' 와 선 끝·이음 'round' 를 설정한다.
            signal.aborted가 false이면 비동기 처리에서 버퍼를 피처 목록으로 디코드한다.
            그리는 피처마다 ends 로 나눈 각 부분을 변환 좌표로 경로에 추가하고 면만 부분마다 닫는다.
            스타일 함수 결과가 없으면 strict 여부로 건너뛰거나 기본 stroke와 면 fill을 사용한다.
            스타일이 있으면 면의 fill을 먼저 그리고, 면·선 모두 stroke가 있을 때 외곽선을 그린다.
            캔버스를 ImageBitmap 으로 바꿔 resolve 한다.
            실패는 오류를 보존해 reject 하며, 요청 표식은 finally 에서 정리한다.

    static parsePbf(buffer: ArrayBuffer) -> Array<URawFeature | null>
        역할: MVT 버퍼의 모든 레이어 피처를 하나의 목록으로 디코드한다.

        처리 기준:
            마지막으로 읽은 레이어의 extent 를 `this.extent_` (클래스 정적 속성) 에 `[0, 0, extent, extent]` 로 남기며 반환값에는 포함하지 않는다.
            type 0 피처는 createFeature_ 가 null 을 반환하므로 목록에 null 이 들어갈 수 있다.

        동작:
            UserPbfReader를 만들고 그 인스턴스의 readFields로 레이어 컬렉션을 읽는다.
            같은 Reader의 readRawFeature와 createFeature_로 각 레이어의 피처를 순서대로 복원해 목록에 추가한다.
            목록을 반환한다.

URawFeature 클래스 정의
    역할: 디코드된 피처의 타입, flat 좌표, ends, 속성, id 를 보관하고 ol.render.Feature 와 유사한 조회 메서드를 제공한다.

    type_: string
        GeometryType 문자열

    flatInteriorPoints_: Array<number> | null = null
        이 구현에서 계산하지 않는 보존 필드다.

    flatMidpoints_: Array<number> | null = null
        이 구현에서 계산하지 않는 보존 필드다.

    tmpTransform_: Array<number>
        생성 시 [1, 0, 0, 1, 0, 0]으로 두는 보존 변환 행렬이다.

    flatCoordinates_: Array<number>
        타일 로컬 좌표가 x, y 순으로 번갈아 담긴 배열

    ends_: Array<number>
        ring 또는 라인 파트가 끝나는 flat 인덱스 목록

    properties_: Record<string, any>
        MVT 속성. `layer` 키에 레이어 이름이 들어 있다.

    id_: number | string | undefined
        MVT 피처 id

    geom_: {getType: () => string}
        스타일 함수가 `feature.getGeometry().getType()` 으로 타입을 읽을 수 있게 하는 최소 객체

    constructor(type: string, flatCoordinates: Array<number>, ends: Array<number>, properties: Record<string, any>, id?: number | string)
        동작: 인자를 각 필드에 저장하고 type 을 돌려주는 geom_ 을 만든다.

    피처 조회 책임 그룹
        역할: 보관한 필드를 그대로 돌려준다.

        getType() -> string
            동작: type_ 을 반환한다.

        getEnds() -> Array<number>
            동작: ends_ 를 반환한다.

        getFlatCoordinates() -> Array<number>
            동작: flatCoordinates_ 를 반환한다.

        getProperties() -> Record<string, any>
            동작: properties_ 를 반환한다.

        get(field: string) -> any
            동작: properties_[field] 를 반환한다.

        getGeometry() -> {getType: () => string}
            동작: geom_ 을 반환한다.

UserPbfReader 클래스 정의
    역할: protobuf 바이트 리더에 MVT 레이어·피처·지오메트리 해석 규칙을 더한 디코더

    buf: Uint8Array
        입력 버퍼. ArrayBuffer 는 Uint8Array 로 감싼다.

    Varint: number = 0
    Fixed64: number = 1
    Bytes: number = 2
    Fixed32: number = 5
    SHIFT_LEFT_32: number = 4294967296
    SHIFT_RIGHT_32: number = 1 / 4294967296
    values: Array<unknown>
        생성할 때 빈 배열로 둔다.

    pos, type, length: number
        현재 읽기 위치, 마지막 필드의 wire type, 버퍼 길이다. pos와 type은 생성 시 0이며 이후 읽기·쓰기에서 변경되는 값이다.

    layerName_: string = 'layer'
        피처 속성에 레이어 이름을 넣을 때 사용하는 키

    pbfReaders_: {layers, layer, feature}
        readFields 에 넘기는 필드 해석 콜백 집합

    constructor(buf: ArrayBuffer | ArrayBufferView)
        처리 기준:
            layers 콜백: tag 3 이면 하위 layer 메시지를 읽어 피처가 하나 이상인 레이어만 `layers[name]` 에 넣고 length 에 피처 수를 기록한다.
            layer 콜백: tag 15 version, 1 name, 5 extent, 2 피처 시작 위치(features 에 pos 저장), 3 keys 문자열, 4 values(하위 메시지의 tag 1 string, 2 float, 3 double, 4 varint64, 5 varint, 6 svarint, 7 bool 중 마지막 값) 를 읽는다.
            feature 콜백: tag 1 id, 2 keys/values 인덱스 쌍을 properties 로 전개, 3 type, 4 지오메트리 시작 위치(geometry 에 pos 저장) 를 읽는다.

        동작:
            버퍼·위치·wire type 상수를 초기화하고 세 필드 해석 콜백을 만든다.

    destroy() -> void
        동작: buf 참조를 null 로 놓는다.

    readRawFeature(pbf: UserPbfReader, layer: object, i: number) -> {layer, type, properties, id?, geometry?}
        역할: 레이어의 i 번째 피처 메시지를 읽어 원시 피처 객체로 만든다.

        동작:
            pbf.pos를 layer.features[i]로 옮기고 길이 varint를 읽은 뒤 feature 콜백으로 메시지 필드를 읽는다.

    createFeature_(pbf: UserPbfReader, rawFeature: object, opt_options?: object) -> URawFeature | null
        역할: 원시 피처의 지오메트리를 디코드해 URawFeature 를 만든다.

        처리 기준:
            type 이 0 이면 null 을 반환한다.
            속성에 layerName_ 키로 레이어 이름을 추가한다.

        동작:
            지오메트리를 flat 좌표와 ends 로 디코드한다.
            타입 번호와 ends 수로 GeometryType 을 정한다.
            URawFeature를 만들어 반환한다.

    getGeometryType_(type: number, numEnds: number) -> string | undefined
        처리 기준:
            1 은 ends 가 1개면 Point, 아니면 MultiPoint. 2 는 ends 가 1개면 LineString, 아니면 MultiLineString. 3 은 항상 Polygon(MultiPolygon 은 winding 으로 구분하므로 만들지 않음). 그 외는 undefined.

        동작: 위 기준으로 타입 문자열을 반환한다.

    readRawGeometry_(pbf: UserPbfReader, feature: object, flatCoordinates: Array<number>, ends: Array<number>) -> void
        역할: MVT 지오메트리 명령(MoveTo 1, LineTo 2, ClosePath 7)을 flat 좌표와 ends 로 전개한다.

        처리 기준:
            좌표는 zigzag varint 의 누적(delta) 값이다.
            JS 대체 계산에서도 형상 위치·길이·명령·개수·32비트 delta 범위를 검증하며 유효하지 않으면 Error를 던진다. 잘못된 명령으로 반복이 끝나지 않거나 입력 밖을 읽지 않게 한다.
            MoveTo 는 이미 좌표가 있으면 새 파트를 시작하므로 이전 파트 끝을 ends 에 추가한다.
            ClosePath 는 현재 파트의 첫 점을 끝에 다시 추가한다.
            MoveTo·LineTo·ClosePath 이외 명령은 오류로 거부하며, LineTo는 파트의 시작점이 있어야 한다.
            ClosePath는 비어 있지 않은 폴리곤 파트에서 개수 1일 때만 허용한다.
            마지막 파트에 실제 좌표가 남았을 때만 파트 끝을 ends에 추가한다.

        동작:
            pbf.pos 를 feature.geometry 로 옮기고 메시지 끝까지 명령·개수를 읽어 위 기준으로 좌표와 ends 를 채운다.

    readFields(readField: function, result: object, end?: number) -> object
        역할: end 까지 필드를 순회하며 tag 별 콜백을 호출하고 처리되지 않은 필드는 건너뛴다.

        동작:
            end 가 없으면 버퍼 길이를 사용한다.
            위치가 end 미만인 동안 tag·wire type 을 읽어 콜백을 호출하고, 콜백이 위치를 옮기지 않았으면 필드를 건너뛴다.
            result 를 반환한다.

    readMessage(readField: function, result: object) -> object
        동작: 길이 접두 메시지의 끝을 계산해 readFields를 호출한다.

    스칼라 읽기 책임 그룹
        역할: 현재 위치에서 protobuf 스칼라를 읽고 위치를 전진한다.

        readVarint(isSigned?: boolean) -> number
            동작: 최대 4바이트를 직접 조합하고 더 길면 상위 비트 처리로 넘긴다.

        readVarint64() -> number
            동작: readVarint(true) 를 반환한다.

        readSVarint() -> number
            동작: varint 를 zigzag 복호화해 반환한다.

        readBoolean() -> boolean
            동작: varint 가 0 이 아닌지 반환한다.

        readString() -> string
            동작: 길이 varint 만큼 UTF-8 로 디코드한다.

        readBytes() -> Uint8Array
            동작: 길이 varint 만큼 subarray 를 반환한다.

        readFixed32() -> number
            동작: 4바이트를 부호 없는 32비트 정수로 읽는다.

        readSFixed32() -> number
            동작: 4바이트를 부호 있는 32비트 정수로 읽는다.

        readFixed64() -> number
            동작: 8바이트를 부호 없는 하위·상위 32비트로 읽어 조합한다.

        readSFixed64() -> number
            동작: 8바이트를 부호 없는 하위 32비트와 부호 있는 상위 32비트로 읽어 조합한다.

        readFloat() -> number
            처리 기준: float·double 은 외부 ieee754 라이브러리 없이 DataView 의 little-endian 읽기로 처리한다. MVT value 의 float(tag 2)·double(tag 3) 속성이 있는 타일(versatiles 의 water_polygons 등)도 디코드되어야 한다.
            동작: 현재 위치의 4바이트를 little-endian float32 로 읽는다.

        readDouble() -> number
            동작: 현재 위치의 8바이트를 little-endian float64 로 읽는다.

    packed 읽기 책임 그룹
        역할: packed 반복 필드를 arr 에 누적한다. 아홉 메서드는 wire type 이 Bytes 면 길이 접두 끝까지, 아니면 한 값만 해당 스칼라 읽기로 반복해 arr 에 추가하고 arr 를 반환한다.

        readPackedVarint(arr: Array<number>, isSigned?: boolean) -> Array<number>
            동작: 끝 위치까지 readVarint 를 반복한다.

        readPackedSVarint(arr: Array<number>) -> Array<number>
            동작: 끝 위치까지 readSVarint 를 반복한다.

        readPackedBoolean(arr: Array<boolean>) -> Array<boolean>
            동작: 끝 위치까지 readBoolean 을 반복한다.

        readPackedFloat(arr: Array<number>) -> Array<number>
            동작: 끝 위치까지 readFloat 를 반복한다.

        readPackedDouble(arr: Array<number>) -> Array<number>
            동작: 끝 위치까지 readDouble 을 반복한다.

        readPackedFixed32(arr: Array<number>) -> Array<number>
            동작: 선언되지 않은 readPackedEnd 전역을 참조하므로 현재 구현을 직접 실행하면 ReferenceError가 발생한다. [확인 Q-003]
            그 호출을 통과하면 끝 위치까지 readFixed32를 반복해 배열에 추가한다. 현재는 앞 오류 때문에 도달하지 않는다.

        readPackedSFixed32(arr: Array<number>) -> Array<number>
            동작: 끝 위치까지 readSFixed32 를 반복한다.

        readPackedFixed64(arr: Array<number>) -> Array<number>
            동작: 끝 위치까지 readFixed64 를 반복한다.

        readPackedSFixed64(arr: Array<number>) -> Array<number>
            동작: 끝 위치까지 readSFixed64 를 반복한다.

    skip(val: number) -> void
        처리 기준: wire type 이 Varint, Bytes, Fixed32, Fixed64 가 아니면 'Unimplemented type' 오류를 던진다.
        동작: wire type 별 길이만큼 위치를 전진한다.

    쓰기 책임 그룹
        역할: protobuf 인코딩용 메서드 집합이다. 현재 타일 디코드 진입점은 이 쓰기 메서드를 호출하지 않으며 보존된 기능의 실제 동작을 아래에 기록한다.

        writeTag(tag: number, type: number) -> void
            동작: tag를 3비트 왼쪽으로 옮겨 type과 합친 값을 기록한다.

        realloc(min: number) -> void
            동작:
                현재 용량 또는 최소 16에서 시작해 pos + min 이상일 때까지 용량을 두 배로 늘린다.
                용량이 달라지면 새 Uint8Array에 기존 버퍼를 복사하고 buf·length를 교체한다.

        finish() -> Uint8Array
            동작: length를 현재 pos로 저장하고 pos를 0으로 되돌린 뒤 그 길이의 버퍼 뷰를 반환한다.

        writeFixed32(val: number) -> void
            동작: 4바이트 용량을 확보하고 32비트 값을 little-endian으로 기록한 뒤 pos를 4 늘린다.

        writeSFixed32(val: number) -> void
            동작: 4바이트 용량을 확보하고 32비트 값을 little-endian으로 기록한 뒤 pos를 4 늘린다.

        writeFixed64(val: number) -> void
            동작: 8바이트 용량을 확보하고 하위·상위 32비트를 나누어 little-endian으로 기록한 뒤 pos를 8 늘린다.

        writeSFixed64(val: number) -> void
            동작: 8바이트 용량을 확보하고 하위·상위 32비트를 나누어 little-endian으로 기록한 뒤 pos를 8 늘린다.

        writeVarint(val: number) -> void
            동작:
                값을 숫자로 바꾸며 숫자로 해석되지 않거나 0이면 0을 사용한다.
                값이 0x0fffffff보다 크거나 음수이면 큰 varint 기록에 위임하고 종료한다.
                나머지는 4바이트 용량을 확보해 7비트씩 기록하며 값이 끝나면 조기 종료한다.

        writeSVarint(val: number) -> void
            동작: 음수는 -val × 2 - 1, 나머지는 val × 2로 zigzag 부호화해 기록한다.

        writeBoolean(val: unknown) -> void
            동작: Boolean으로 변환한 값을 varint로 기록한다.

        writeString(str: string) -> void
            동작:
                입력을 문자열로 바꾸고 UTF-8 최대 길이의 공간을 확보한 뒤 길이 접두어 한 바이트를 비워 둔다.
                UTF-8 본문을 기록하고 실제 바이트 길이를 계산한다.
                길이가 128 이상이면 추가 길이 접두어 공간을 확보하도록 본문을 옮긴다.
                비워 둔 위치에 varint 길이를 기록하고 pos를 본문 끝으로 옮긴다.

        writeFloat(val: number) -> void
            동작: 4바이트를 확보해 현재 DataView의 Float32 값으로 little-endian 기록하고 pos를 4 늘린다.

        writeDouble(val: number) -> void
            동작: 8바이트를 확보해 현재 DataView의 Float64 값으로 little-endian 기록하고 pos를 8 늘린다.

        writeBytes(buffer: Uint8Array) -> void
            동작: 길이를 varint로 기록한 뒤 본문 공간을 확보하고 각 바이트를 복사하며 pos를 전진한다.

        writeRawMessage(fn: function, obj: object) -> void
            동작:
                길이 접두어 한 바이트를 비우고 fn(obj, this)로 본문을 기록한다.
                본문 길이가 128 이상이면 추가 길이 공간을 확보하도록 본문을 옮긴다.
                접두어 위치에서 길이를 기록한 뒤 pos를 본문 끝으로 옮긴다.

        writeMessage(tag: number, fn: function, obj: object) -> void
            동작: Bytes wire type의 태그를 기록하고 콜백에 메시지 본문 기록을 맡긴다.

        writePackedVarint(tag: number, arr: Array<number>) -> void
            동작: Bytes 메시지 안에서 배열의 각 값을 기록하도록 보조 콜백을 전달한다.

        writePackedSVarint(tag: number, arr: Array<number>) -> void
            동작: Bytes 메시지 안에서 배열의 각 값을 기록하도록 보조 콜백을 전달한다.

        writePackedBoolean(tag: number, arr: Array<boolean>) -> void
            동작: Bytes 메시지 안에서 배열의 각 값을 기록하도록 보조 콜백을 전달한다.

        writePackedFloat(tag: number, arr: Array<number>) -> void
            동작: Bytes 메시지 안에서 배열의 각 값을 기록하도록 보조 콜백을 전달한다.

        writePackedDouble(tag: number, arr: Array<number>) -> void
            동작: Bytes 메시지 안에서 배열의 각 값을 기록하도록 보조 콜백을 전달한다.

        writePackedFixed32(tag: number, arr: Array<number>) -> void
            동작: Bytes 메시지 안에서 배열의 각 값을 기록하도록 보조 콜백을 전달한다.

        writePackedSFixed32(tag: number, arr: Array<number>) -> void
            동작: Bytes 메시지 안에서 배열의 각 값을 기록하도록 보조 콜백을 전달한다.

        writePackedFixed64(tag: number, arr: Array<number>) -> void
            동작: Bytes 메시지 안에서 배열의 각 값을 기록하도록 보조 콜백을 전달한다.

        writePackedSFixed64(tag: number, arr: Array<number>) -> void
            동작: Bytes 메시지 안에서 배열의 각 값을 기록하도록 보조 콜백을 전달한다.

        writeBytesField(tag: number, buffer: Uint8Array) -> void
            동작: Bytes wire type의 태그를 기록한 다음 buffer 본문을 기록한다.

        writeFixed32Field(tag: number, val: number) -> void
            동작: Fixed32 wire type의 태그를 기록한 다음 val 본문을 기록한다.

        writeSFixed32Field(tag: number, val: number) -> void
            동작: Fixed32 wire type의 태그를 기록한 다음 val 본문을 기록한다.

        writeFixed64Field(tag: number, val: number) -> void
            동작: Fixed64 wire type의 태그를 기록한 다음 val 본문을 기록한다.

        writeSFixed64Field(tag: number, val: number) -> void
            동작: Fixed64 wire type의 태그를 기록한 다음 val 본문을 기록한다.

        writeVarintField(tag: number, val: number) -> void
            동작: Varint wire type의 태그를 기록한 다음 val 본문을 기록한다.

        writeSVarintField(tag: number, val: number) -> void
            동작: Varint wire type의 태그를 기록한 다음 val 본문을 기록한다.

        writeStringField(tag: number, str: string) -> void
            동작: Bytes wire type의 태그를 기록한 다음 str 본문을 기록한다.

        writeFloatField(tag: number, val: number) -> void
            동작: Fixed32 wire type의 태그를 기록한 다음 val 본문을 기록한다.

        writeDoubleField(tag: number, val: number) -> void
            동작: Fixed64 wire type의 태그를 기록한 다음 val 본문을 기록한다.

        writeBooleanField(tag: number, val: unknown) -> void
            동작: Boolean으로 변환한 값을 Varint 필드로 기록한다.

    바이트 보조 책임 그룹
        역할: 스칼라 읽기·쓰기에서 사용하는 정수·큰 varint·UTF-8 변환이다. 쓰기 보조는 보존된 writer에서만 호출되며 타일 디코드 경로는 사용하지 않는다.

        #readVarintRemainder(l: number, s: boolean, p: UserPbfReader) -> number
            처리 기준: 10바이트를 넘는 varint 는 'Expected varint not more than 10 bytes' 오류를 던진다.
            동작: 상위 비트를 계속 읽어 low·high 를 숫자로 합친다.

        #readPackedEnd(pbf: UserPbfReader) -> number
            동작: wire type이 Bytes이면 pbf의 길이 varint와 pos를 더한 끝, 아니면 pos + 1을 반환한다.

        #toNum(low: number, high: number, isSigned: boolean) -> number
            동작: 32비트 두 조각을 부호 여부에 맞게 하나의 number 로 합친다.

        #writeBigVarint(val: number, pbf: UserPbfReader) -> void
            처리 기준: 값이 -2^64 미만이거나 2^64 이상이면 10바이트 범위 오류를 던진다.
            동작:
                양수는 하위·상위 32비트로 나누고 음수는 두 조각의 보수를 계산한다.
                10바이트 공간을 확보하고 하위와 상위 비트를 순서대로 기록한다.

        #writeBigVarintLow(low: number, high: number, pbf: UserPbfReader) -> void
            동작: low에서 7비트씩 네 바이트와 다음 바이트의 하위 4비트를 기록한다. high 인자는 이 단계에서 사용하지 않는다.

        #writeBigVarintHigh(high: number, pbf: UserPbfReader) -> void
            동작: high의 하위 3비트를 앞 단계 마지막 바이트에 합치고 나머지를 최대 다섯 바이트에 7비트씩 기록하며 남은 값이 없으면 종료한다.

        #makeRoomForExtraLength(startPos: number, len: number, pbf: UserPbfReader) -> void
            동작:
                본문 길이에 필요한 추가 varint 바이트 수를 계산한다.
                추가 공간을 확보하고 기존 본문을 뒤에서부터 그만큼 오른쪽으로 옮긴다.

        #writePackedVarint(arr: Array<number>, pbf: UserPbfReader) -> void
            동작: 배열 순서대로 각 값을 전달된 Reader의 쓰기 메서드에 기록한다.

        #writePackedSVarint(arr: Array<number>, pbf: UserPbfReader) -> void
            동작: 배열 순서대로 각 값을 전달된 Reader의 쓰기 메서드에 기록한다.

        #writePackedFloat(arr: Array<number>, pbf: UserPbfReader) -> void
            동작: 배열 순서대로 각 값을 전달된 Reader의 쓰기 메서드에 기록한다.

        #writePackedDouble(arr: Array<number>, pbf: UserPbfReader) -> void
            동작: 배열 순서대로 각 값을 전달된 Reader의 쓰기 메서드에 기록한다.

        #writePackedBoolean(arr: Array<boolean>, pbf: UserPbfReader) -> void
            동작: 배열 순서대로 각 값을 전달된 Reader의 쓰기 메서드에 기록한다.

        #writePackedFixed32(arr: Array<number>, pbf: UserPbfReader) -> void
            동작: 배열 순서대로 각 값을 전달된 Reader의 쓰기 메서드에 기록한다.

        #writePackedSFixed32(arr: Array<number>, pbf: UserPbfReader) -> void
            동작: 배열 순서대로 각 값을 전달된 Reader의 쓰기 메서드에 기록한다.

        #writePackedFixed64(arr: Array<number>, pbf: UserPbfReader) -> void
            동작: 배열 순서대로 각 값을 전달된 Reader의 쓰기 메서드에 기록한다.

        #writePackedSFixed64(arr: Array<number>, pbf: UserPbfReader) -> void
            동작: 배열 순서대로 각 값을 전달된 Reader의 쓰기 메서드에 기록한다.

        #readUInt32(buf: Uint8Array, pos: number) -> number
            동작: little-endian 4바이트를 부호 없는 32비트 정수로 읽는다.

        #readInt32(buf: Uint8Array, pos: number) -> number
            동작: little-endian 4바이트를 부호 있는 32비트 정수로 읽는다.

        #dataView(byteLength: number) -> DataView
            처리 기준: buf 가 다른 버퍼의 subarray 일 수 있으므로 buf.byteOffset 에 현재 pos 를 더한 위치를 시작으로 잡는다.
            동작: 현재 읽기 위치에서 byteLength 만큼을 보는 DataView 를 만들어 반환한다.

        #writeInt32(buf: Uint8Array, val: number, pos: number) -> void
            동작: 32비트 정수를 little-endian 4바이트로 기록한다.

        #readUtf8(buf: Uint8Array, pos: number, end: number) -> string
            동작: UTF-8 시퀀스를 읽어 잘못된 시퀀스는 U+FFFD로 대체하고, 범위를 넘는 미완성 마지막 시퀀스는 읽지 않고 종료한다. 4바이트 문자는 UTF-16 surrogate 쌍으로 바꾼다.

        #writeUtf8(buf: Uint8Array, str: string, pos: number) -> number
            동작: 문자열을 UTF-8 로 기록하고 다음 위치를 반환한다.
RECORD_STRIDE: number = 7
    Rust 입력 표에서 형상 하나의 위치·타입·extent·월드 변환 정보를 담는 Float64 성분 수다.

PART_STRIDE: number = 6
    파트별 bbox 네 값·로컬 부호 면적·절단 여부의 성분 수다.

PbfGeometryRecord 타입 정의
    offset: number
    type: number
    extent: number
    group: number
        형상 길이 접두어 위치·MVT 타입·로컬 extent·연속된 레이어 순번이다.

PbfGeometryInput 타입 정의
    flatCoordinates: Array<number> | Float64Array
    ends: Array<number>
    partInfo?: Float64Array
    outlines?: Array<{partIndex: number, flatCoordinates: Array<number> | Float64Array, bbox: Array<number>}>
        JS 또는 Rust 계산 뒤 packing할 형상이다.

PbfPackedGeometry 타입 정의
    flatCoordinates: Float64Array
    ends: Array<number>
    partInfo?: Float64Array
    outlines?: Array<{partIndex: number, flatCoordinates: Float64Array, bbox: Array<number>}>
        레이어별 공용 전송 버퍼를 가리키는 피처별 뷰다.

PbfGeometryBatch 타입 정의
    formatVersion: 1
    metadata: Uint32Array
    coordinates: Float64Array
    ends: Uint32Array
    parts?: Float64Array
    outlineMetadata?: Float64Array
    outlineCoordinates?: Float64Array
        metadata는 피처당 좌표 시작·길이, 파트 시작·개수, 외곽선 시작·개수를 담는다.
        parts와 외곽선 배열은 월드 전처리일 때 함께 존재한다.
        outlineMetadata는 외곽선당 요청 전역 파트 번호·좌표 시작·길이·bbox 네 값이다.

PbfGeometryWasmExports 타입 정의
    memory: WebAssembly.Memory
    create: () => number
    destroy: (context: number) => void
    input: (context: number, length: number) => number
    records: (context: number, count: number) => number
    decode: (context: number, count: number) => number
    coordinates: (context: number) => number
    ends: (context: number) => number
    parts: (context: number) => number
    features: (context: number) => number
    outline_coordinates: (context: number) => number
    outlines: (context: number) => number
        내부 Rust ABI다. 포인터는 memory 안의 바이트 주소이며 context는 해당 인스턴스에만 속한다.

UPbfGeometryWasmBridge extends UWasmBridge 클래스 정의
    역할: UWasmBridge를 상속해 형상 입력·출력의 Rust 호출과 독립 JS 버퍼를 연결한다.
    의존: UWasmBridge — 공통 초기화 수명; 상속: {UWasmBridge}

    #wasm: PbfGeometryWasmExports | null = null
        준비된 Rust 내보내기다.
    #context: number = 0
        현재 형상 계산 컨텍스트다.

    override _initializeWasm(wasm: WebAssembly.Exports) -> void
        동작: 형상 내보내기의 create를 호출해 #context에 저장하고 #wasm을 해당 내보내기로 설정한다.

    decode(buffer: ArrayBuffer, records: Array<PbfGeometryRecord>, worldBounds?: Array<number>, packedGeometry: boolean = false) -> Array<PbfPackedGeometry> | PbfGeometryBatch | null
        처리 기준:
            #wasm이 없으면 입력 변환 없이 null을 반환한다.
            준비된 모듈에서 worldBounds가 있으면 유한한 네 성분과 양수 가로·세로 범위를 요구한다.
            Rust의 유효성 판정이 실패하면 Error를 던진다. 실행 트랩과 메모리 복사 오류는 모듈을 비활성화하고 null을 반환한다.

        의존: UWasmBridge — 트랩 뒤 종료·재시도 제한; 함수: {_disableWasm()}

        동작:
            원본 바이트와 형상 표를 위한 Rust 공간을 각각 할당한 뒤 메모리 뷰를 만든다.
            원본을 한 번 복사하고 형상마다 offset·type·extent·월드 원점 X·상단 Y·스케일·변환 여부를 일곱 값으로 기록한다.
            Rust decode 결과가 1이면 피처별 여섯 성분 위치 표를 읽는다.
                packedGeometry이면 metadata·coordinates·ends를 JS에 복사해 batch로 반환한다.
                    worldBounds가 있으면 parts·outlineMetadata·outlineCoordinates도 JS에 복사한다.
                기본 형식이면 피처별 좌표·ends를 읽고 월드 전처리일 때 partInfo·외곽선·피처 내부 파트 번호를 복원한다.
                    #wasm이 있으면 유효한 기본 결과를 레이어별 공용 JS 버퍼로 복사하여 반환한다.
            Rust decode 결과가 1이 아니면 형상 입력 오류를 던진다.
            try 안의 예외이면 부모의 _disableWasm을 호출하고 null을 반환한다.

    override dispose() -> void
        의존: UWasmBridge — 늦은 초기화 차단; 함수: {dispose()}
        동작:
            super.dispose로 이전 세대 초기화를 무효화한다.
            #wasm·#context를 지역 변수에 보존한 뒤 각각 null·0으로 비운다.
            보존한 컨텍스트가 있으면 destroy를 호출하고 해제 예외는 삼켜 참조 해제를 유지한다.

projectPbfGeometry(coordinates: Array<number>, ends: Array<number>, extent: number, bounds: Array<number>, polygon: boolean) -> PbfGeometryInput
    역할: JS 대체 경로의 좌표 배열을 제자리에서 월드 좌표로 바꾸고 파트·외곽선 정보를 만든다.
    동작:
        bounds 가로 폭을 extent로 나눈 스케일을 사용한다.
        각 파트에서 변환 전 로컬 좌표의 부호 면적과 타일 경계 0.5 이내 여부를 기록한다.
        좌표를 bounds의 왼쪽 X·상단 Y를 기준으로 제자리 변환하고 월드 bbox를 구한다.
        partInfo에 bbox 네 값·부호 면적·초기 절단 여부 0을 기록한다.
        polygon이고 점 수가 세 개 이상이면 같은 타일 경계에 속한 연속 두 점을 찾아 절단 변으로 삼는다.
            절단 변이 있으면 절단 여부를 1로 두고 그 변 다음부터 순회해 절단 경계가 아닌 연속 외곽선 좌표·bbox를 구한다.
        변경한 coordinates와 기존 ends·새 partInfo·outlines를 반환한다.

packPbfGeometries(geometries: Array<PbfGeometryInput>, groups: Array<number>) -> Array<PbfPackedGeometry>
    처리 기준: 같은 group의 형상은 연속되어야 한다. 입력 버퍼와 WASM 메모리를 결과가 보유하지 않는다.
    동작:
        같은 group의 연속 범위를 찾아 좌표·파트·외곽선의 전체 길이를 계산한다.
        각 범위마다 독립 Float64Array 버퍼를 만들고 피처별 값을 순서대로 복사한다.
        좌표·파트·외곽선은 새 버퍼의 피처별 뷰로 만들며 ends 배열은 원래 피처의 것을 사용한다.
        원래 피처 순서로 결과를 반환한다.

readPbfGeometry(batch: PbfGeometryBatch, index: number) -> PbfPackedGeometry
    역할: Worker의 batch 버퍼에서 필요한 피처의 뷰만 복원한다.
    처리 기준:
        버전 1, metadata Uint32Array와 여섯 성분 배수, Float64 좌표의 짝수 길이, Uint32 ends와 유효한 피처 순번을 요구한다.
        좌표·파트 범위와 짝수 좌표 수, ends의 단조 증가·짝수·최종 좌표 길이 일치를 검증한다.
        월드 배열 중 하나라도 있으면 세 배열의 타입·배수·범위를 모두 검증한다.
        각 외곽선의 좌표 시작·길이·전역 파트 번호가 정수이며 해당 피처 범위에 속하는지 검증한다.
        검증 실패는 Error를 던지고 원본 버퍼는 수정하거나 복사하지 않는다.
    동작:
        위치 표의 좌표·파트 구간을 읽고 ends만 일반 배열로 복원한다.
        coordinates의 부분 뷰를 결과로 만들고 월드 배열이 있으면 partInfo 뷰와 외곽선 목록을 만든다.
        외곽선 파트 번호를 피처 내부 번호로 바꾸고 bbox 네 값은 일반 배열로 복사해 반환한다.

```

## 4. 공통 처리 기준과 제약

```spec
이 모듈은 Web Worker 전역(self)에서만 실행되며 DOM 이 아닌 OffscreenCanvas 와 transfer 된 객체만 다룬다.
loadPbf 와 loadPbfFeatures 는 같은 URL의 다운로드를 공유하지만 요청 식별자는 서로 다르다. abort(requestId) 는 해당 소비자만 취소한다. 실제 부모 URL을 요청하는 경우도 같은 규칙을 적용한다. 취소 직후 재요청은 새 fetch로 시작하며 이전 fetch의 완료 콜백이 새 요청을 제거하지 않는다.
worldBounds가 없으면 디코드 결과는 기존 타일 로컬 좌표다. 있으면 Worker에서 월드 좌표와 경계 정보를 계산하며 worldCoordinates 표식으로 호출 레이어의 이중 변환을 막는다. 기본 Rust ABI는 경로마다 입력 7개 값과 결과 범위 6개 정수를 사용한다. 출력은 항상 독립 JS 버퍼이며 Worker 종료·트랩에서 컨텍스트를 정리한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
