# UPbfParserTask 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UPbfParserTask`는 `UWorker` 가 로드하는 워커 태스크 모듈로, PBF(Mapbox Vector Tile) 타일을 다운로드하고 MVT 바이너리를 디코드한다. 이미지 PBF 레이어를 위해 OffscreenCanvas 에 면과 선을 그려 `ImageBitmap` 을 돌려주는 경로(`loadPbf`)와, 벡터 PBF 레이어를 위해 디코드된 원본 피처만 돌려주는 경로(`loadPbfFeatures`)를 제공한다. 모듈 내부에 MVT 디코더(`UserPbfReader`)와 디코드 결과 피처(`URawFeature`)를 함께 둔다.

### 1.2 책임 범위

- 워커 안에서 PBF 타일 URL 을 `UFileLoader` 로 내려받고 URL 단위로 다운로드를 중단한다.
- MVT protobuf 를 레이어·피처·지오메트리(타일 로컬 좌표, flat 좌표 배열과 ends)로 디코드한다.
- `loadPbf`: 메인 스레드에서 문자열로 넘어온 ol 규격 스타일 함수를 워커에서 복원해 Polygon 은 캔버스에 채우고 LineString·MultiLineString 은 선으로 그린 뒤 `ImageBitmap` 으로 변환한다.
- `loadPbfFeatures`: 레이어별 extent 와 피처 목록을 transferable 좌표 배열로 반환한다.
- 책임 경계: 어떤 워커가 어떤 요청을 처리할지와 결과 전달은 `UWorker`/`UTaskProcessor` 가 담당하고, 좌표계 변환·스타일 적용·타일 표시는 호출 레이어가 담당한다.

### 1.3 주요 동작 방식

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

    self.ol, self.fill, self.stroke, self.polygon, self.strokedPolygon, self.line, self.text
        워커 전역에 놓는 가짜 ol 네임스페이스와 공유 스타일 객체. `new Function` 으로 복원한 스타일 함수가 이 이름들을 전역으로 참조한다.

UPbfParserTask 클래스 정의
    역할: 워커 태스크 진입점. 모든 멤버는 static 이며 인스턴스를 만들지 않는다.

    static loader: UFileLoader | undefined
        arraybuffer 응답용 공유 로더. 첫 요청에서 생성한다.

    static taskMap: Record<string, AbortController> = {}
        요청 식별자별 진행 중 요청 표식. abort() 의 대상 판정에 사용한다.

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

    static runRequest(params, processData) -> Promise
        역할: 요청별 다운로드·후속 처리·취소의 종료를 보장한다.
        동작:
            requestId 별 AbortController 를 등록한다. 식별자 미지정 시 기존 호출 호환을 위해 URL 을 쓴다.
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

    static loadPbfFeatures(params: {url: string, requestId?: string}) -> Promise<U3dVectorPBFDecodeResult>
        역할: PBF 타일을 내려받아 디코드한 원본 피처를 캔버스 그리기 없이 반환한다.

        인터페이스:
            params.url: 내려받을 PBF URL
            반환: {layers} 이며 다운로드 실패·중단이면 {layers: [], failed: true, url}

        처리 기준:
            실패·중단은 reject 하지 않고 failed 플래그로 resolve 한다. UTaskProcessor 가 reject 마다 오류 메시지를 남기고 타일 취소가 빈번하기 때문이다.
            gzip 해제·디코드 중 예외도 reject 하지 않고 reason 'decode' 와 예외 메시지를 담은 failed 결과로 resolve 한다. 빈 결과로 확정하면 기존 화면이 지워지므로 재시도 대상으로 구분한다.
            요청 시작 시 taskMap 에 AbortController 를 등록하고 성공·실패 모두에서 제거한다.

        의존:
            UFileLoader — PBF 다운로드; 함수: {load()}
            Worker API — 중단 표식 생성; 생성자: {new AbortController()}

        동작:
            공유 로더를 준비한다.
            runRequest 로 요청을 등록하고 다운로드한다.
            gzip 해제 이후에도 취소 여부를 확인해 취소됐다면 디코드를 생략한다.
            gzip 해제·디코드 예외는 reason 'decode', 취소·다운로드 실패는 describeLoadFailure 결과로 반환한다.

    static decodePbfLayers(buffer: ArrayBuffer) -> {layers: Array<U3dVectorPBFDecodedLayer>, _transferables: Array<ArrayBuffer>}
        역할: MVT 버퍼를 레이어별 extent 와 피처 목록으로 디코드하고 좌표 배열을 transferable 로 만든다.

        처리 기준:
            버퍼가 없거나 길이 0 이면 빈 layers 를 반환한다.
            type 0(UNKNOWN) 피처는 제외한다.
            레이어 extent 가 없으면 4096 을 사용한다.
            좌표는 Float64Array 로 복사하고 그 buffer 를 `_transferables` 에 모아 UWorker 가 postMessage 시 이전한다.

        동작:
            리더를 만들고 레이어 컬렉션을 읽는다.
            레이어마다 피처를 순서대로 읽어 피처 객체로 만든다.
            피처마다 id, 타입, 속성, Float64Array 좌표, ends 를 담고 좌표 buffer 를 transferable 목록에 추가한다.
            레이어 이름·extent·피처 목록을 layers 에 추가해 반환한다.

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
            요청 타일과 데이터 타일의 레벨이 다르면 두 타일 경계의 크기 비와 오프셋으로 데이터 타일 안의 요청 타일 부분 영역을 잘라내는 변환(scale, translate)을 만든다.
            Polygon, LineString 과 MultiLineString 이 아닌 피처와 parsePbf 가 돌려준 null 은 그리지 않는다.
            면은 부분마다 경로를 닫고 선은 닫지 않아 끝점과 시작점을 잇는 구간을 만들지 않는다.
            스타일 함수 결과가 비어 있으면 _STRICT_DRAW 가 true 일 때 건너뛰고, false 일 때 기본 선 'blue' 두께 1 로 그리며 면은 채움 'rgb(164,238,232)' 도 적용한다.
            스타일이 있으면 면은 첫 스타일의 fill 색으로 채우기만 하고 stroke 는 그리지 않으며, 선은 첫 스타일의 stroke 색·두께로 그리기만 한다.
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
            runRequest 에 실제 다운로드 URL과 요청 식별자를 넘겨 작업을 시작한다.
            성공 콜백에서 gzip 이면 압축을 풀고 취소 여부를 확인한다. 취소 시 이후 그리기를 생략한다.
            Y 반전과 레벨 차이에 따른 부분 영역 변환을 계산하고 캔버스를 비운 뒤 filter 'contrast(115%) saturate(80%)' 와 선 끝·이음 'round' 를 설정한다.
            버퍼를 피처 목록으로 디코드한다.
            그리는 피처마다 ends 로 나눈 각 부분을 변환 좌표로 경로에 추가하고 면만 부분마다 닫는다.
            스타일 함수 결과에 따라 건너뛰거나, 기본색 또는 첫 스타일의 색으로 면은 채우고 선은 그린다.
            캔버스를 ImageBitmap 으로 바꿔 resolve 한다.
            실패는 오류를 보존해 reject 하며, 요청 표식은 finally 에서 정리한다.

    static parsePbf(buffer: ArrayBuffer) -> Array<URawFeature | null>
        역할: MVT 버퍼의 모든 레이어 피처를 하나의 목록으로 디코드한다.

        처리 기준:
            마지막으로 읽은 레이어의 extent 를 `this.extent_` (클래스 정적 속성) 에 `[0, 0, extent, extent]` 로 남기며 반환값에는 포함하지 않는다.
            type 0 피처는 createFeature_ 가 null 을 반환하므로 목록에 null 이 들어갈 수 있다.

        동작:
            리더를 만들고 레이어 컬렉션을 읽는다.
            레이어마다 피처를 순서대로 읽어 URawFeature 로 만들어 목록에 추가한다.
            목록을 반환한다.

URawFeature 클래스 정의
    역할: 디코드된 피처의 타입, flat 좌표, ends, 속성, id 를 보관하고 ol.render.Feature 와 유사한 조회 메서드를 제공한다.

    type_: string
        GeometryType 문자열

    flatCoordinates_: Array<number>
        타일 로컬 좌표가 x, y 순으로 번갈아 담긴 배열

    ends_: Array<number>
        ring 또는 라인 파트가 끝나는 flat 인덱스 목록

    properties_: Record<string, any>
        MVT 속성. `layer` 키에 레이어 이름이 들어 있다.

    id_: number | undefined
        MVT 피처 id

    geom_: {getType: () => string}
        스타일 함수가 `feature.getGeometry().getType()` 으로 타입을 읽을 수 있게 하는 최소 객체

    constructor(type: string, flatCoordinates: Array<number>, ends: Array<number>, properties: Record<string, any>, id?: number)
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

    pos, type, length: number
        현재 읽기 위치, 마지막 필드의 wire type, 버퍼 길이

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
            pbf.pos 를 layer.features[i] 로 옮기고 메시지 길이만큼 feature 콜백으로 필드를 읽는다.

    createFeature_(pbf: UserPbfReader, rawFeature: object, opt_options?: object) -> URawFeature | null
        역할: 원시 피처의 지오메트리를 디코드해 URawFeature 를 만든다.

        처리 기준:
            type 이 0 이면 null 을 반환한다.
            속성에 layerName_ 키로 레이어 이름을 추가한다.

        동작:
            지오메트리를 flat 좌표와 ends 로 디코드한다.
            타입 번호와 ends 수로 GeometryType 을 정한다.
            URawFeature 를 만들어 반환한다.

    getGeometryType_(type: number, numEnds: number) -> string | undefined
        처리 기준:
            1 은 ends 가 1개면 Point, 아니면 MultiPoint. 2 는 ends 가 1개면 LineString, 아니면 MultiLineString. 3 은 항상 Polygon(MultiPolygon 은 winding 으로 구분하므로 만들지 않음). 그 외는 undefined.

        동작: 위 기준으로 타입 문자열을 반환한다.

    readRawGeometry_(pbf: UserPbfReader, feature: object, flatCoordinates: Array<number>, ends: Array<number>) -> void
        역할: MVT 지오메트리 명령(MoveTo 1, LineTo 2, ClosePath 7)을 flat 좌표와 ends 로 전개한다.

        처리 기준:
            좌표는 zigzag varint 의 누적(delta) 값이다.
            MoveTo 는 이미 좌표가 있으면 새 파트를 시작하므로 이전 파트 끝을 ends 에 추가한다.
            ClosePath 는 현재 파트의 첫 점을 끝에 다시 추가한다.
            그 외 명령은 무시한다.
            마지막 파트 끝을 ends 에 추가한다.

        동작:
            pbf.pos 를 feature.geometry 로 옮기고 메시지 끝까지 명령·개수를 읽어 위 기준으로 좌표와 ends 를 채운다.

    readFields(readField: function, result: object, end?: number) -> object
        역할: end 까지 필드를 순회하며 tag 별 콜백을 호출하고 처리되지 않은 필드는 건너뛴다.

        동작:
            end 가 없으면 버퍼 길이를 사용한다.
            위치가 end 미만인 동안 tag·wire type 을 읽어 콜백을 호출하고, 콜백이 위치를 옮기지 않았으면 필드를 건너뛴다.
            result 를 반환한다.

    readMessage(readField: function, result: object) -> object
        동작: 길이 접두 메시지의 끝을 계산해 readFields 를 호출한다.

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
            동작: 끝 위치까지 readFixed32 를 반복한다.

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
        역할: protobuf 인코딩용 writer 메서드 집합이며 현재 이 모듈의 어떤 실행 경로에서도 호출되지 않는다.

        writeTag(tag, type), realloc(min), finish(), writeFixed32(val), writeSFixed32(val), writeFixed64(val), writeSFixed64(val), writeVarint(val), writeSVarint(val), writeBoolean(val), writeString(str), writeFloat(val), writeDouble(val), writeBytes(buffer), writeRawMessage(fn, obj), writeMessage(tag, fn, obj), writePacked*(tag, arr) 9종, write*Field(tag, val) 10종
            값을 protobuf 형식으로 buf 에 기록하고 위치를 전진하는 writer 메서드들이다. 내부에서 #writeBigVarint, #makeRoomForExtraLength, #writeUtf8, #writeInt32, #dataView 와 packed writer 보조를 사용한다. 활성 호출자가 없어 개별 실행 심벌로 전개하지 않는다.

    바이트 보조 책임 그룹
        역할: 32비트 정수·큰 varint·UTF-8 의 저수준 변환. 쓰기 보조(#writeBigVarint 계열, #makeRoomForExtraLength, packed writer 9종, #writeInt32, #writeUtf8)는 쓰기 책임 그룹에서만 사용되어 활성 호출자가 없다.

        #readVarintRemainder(l, s, p) -> number
            처리 기준: 10바이트를 넘는 varint 는 'Expected varint not more than 10 bytes' 오류를 던진다.
            동작: 상위 비트를 계속 읽어 low·high 를 숫자로 합친다.

        #readPackedEnd(pbf) -> number
            동작: wire type 이 Bytes 면 길이 접두 끝, 아니면 pos + 1 을 반환한다.

        #toNum(low, high, isSigned) -> number
            동작: 32비트 두 조각을 부호 여부에 맞게 하나의 number 로 합친다.

        #writeBigVarint(val, pbf), #writeBigVarintLow(low, high, pbf), #writeBigVarintHigh(high, pbf), #makeRoomForExtraLength(startPos, len, pbf), #writePackedVarint 등 packed writer 9종 -> void
            동작: 쓰기 책임 그룹이 사용하는 큰 정수·길이 보정·packed 기록 보조

        #readUInt32(buf: Uint8Array, pos: number) -> number
            동작: little-endian 4바이트를 부호 없는 32비트 정수로 읽는다.

        #readInt32(buf: Uint8Array, pos: number) -> number
            동작: little-endian 4바이트를 부호 있는 32비트 정수로 읽는다.

        #dataView(byteLength: number) -> DataView
            처리 기준: buf 가 다른 버퍼의 subarray 일 수 있으므로 buf.byteOffset 에 현재 pos 를 더한 위치를 시작으로 잡는다.
            동작: 현재 읽기 위치에서 byteLength 만큼을 보는 DataView 를 만들어 반환한다.

        #writeInt32(buf, val, pos) -> void
            동작: 32비트 정수를 little-endian 4바이트로 기록한다.

        #readUtf8(buf, pos, end) -> string
            동작: 바이트 구간을 UTF-8 로 디코드하며 잘못된 시퀀스는 U+FFFD 로 대체한다.

        #writeUtf8(buf, str, pos) -> number
            동작: 문자열을 UTF-8 로 기록하고 다음 위치를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
이 모듈은 Web Worker 전역(self)에서만 실행되며 DOM 이 아닌 OffscreenCanvas 와 transfer 된 객체만 다룬다.
loadPbf 와 loadPbfFeatures 는 같은 URL의 다운로드를 공유하지만 요청 식별자는 서로 다르다. abort(requestId) 는 해당 소비자만 취소한다. 실제 부모 URL을 요청하는 경우도 같은 규칙을 적용한다. 취소 직후 재요청은 새 fetch로 시작하며 이전 fetch의 완료 콜백이 새 요청을 제거하지 않는다.
디코드 결과 좌표는 타일 로컬(0 ~ extent, y 축 아래 방향)이며 좌표계 변환은 호출 레이어가 담당한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
