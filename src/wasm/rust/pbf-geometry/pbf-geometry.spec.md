# pbf-geometry 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

MVT의 형상 명령과 좌표 차분을 해석하여 피처별 평탄 좌표, 파트 경계, 링 방향 판정에 필요한 면적과 타일 절단 변을 제외한 외곽선을 계산한다.

### 1.2 책임 범위

`src/lib.rs`가 Rust 컨텍스트, 입력·출력 버퍼, 형상 디코드와 C ABI 내보내기를 소유한다. 문자열·속성·레이어 및 점 필터·스타일·최종 링과 coverage 구성은 JS 측 책임이다. Rust는 JS가 선택한 피처의 형상 레코드를 입력으로 받는다.

### 1.3 주요 동작 방식

JS가 컨텍스트를 생성하고 PBF 원본과 피처 레코드를 기록한다. Rust가 명령을 순회하며 좌표·파트·외곽선 배열을 채우면 JS가 포인터와 피처 메타데이터로 결과를 읽고 독립된 JS 버퍼로 복사한다.

### 1.4 주요 사용처와 연계 대상

`UPbfGeometryWasmBridge`가 WASM 내보내기를 호출하고 `UPbfParserTask`가 피처별 응답 또는 `packedGeometry` 응답으로 전달한다. `worldBounds`가 없는 호출은 로컬 좌표를 선택한다. Worker별 지연 초기화·JS 대체 계산·요청 취소·이미지 전용 PBF의 모듈 로드 제외는 연계 Task 명세를 따른다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
형상 입력과 결과 계약
    점·선·면 형상의 MoveTo·LineTo·ClosePath 명령을 해석한다.
    피처별 좌표·파트·외곽선의 위치와 길이를 평탄 버퍼의 메타데이터로 제공한다.
    형상 길이·명령·레코드 검증 실패는 decode()의 0으로 알리고 JS 예외를 직접 만들지 않는다.
```

### 2.2 성능 및 품질 요구사항

```spec
버퍼와 정밀도
    좌표·파트·외곽선은 f64, 피처 메타데이터와 파트 끝은 u32로 저장한다.
    입력 원본 한 번 복사와 컨텍스트의 Vec 용량 재사용을 지원한다.
    JS에 반환·전송할 결과는 WASM 메모리와 독립되게 복사한다.
```

## 3. 정규 자연어 수도코드

```spec
RECORD_STRIDE: usize = 7
PART_STRIDE: usize = 6

Context 타입 정의
    input: Vec<u8>
        형상 길이 varint를 포함하는 원본 PBF 바이트
    records: Vec<f64>
        피처마다 offset·kind·extent·min_x·max_y·scale·projected 순서의 7개 성분
        offset은 원본 바이트 위치이며 kind는 점 1·선 2·면 3이다.
        projected가 정확히 1이면 월드 좌표 변환을 적용한다.
    coordinates: Vec<f64>
        전체 피처의 x·y 성분을 이어 붙인 좌표 배열
    ends: Vec<u32>
        각 피처 좌표 시작을 기준으로 한 파트 끝의 좌표 성분 인덱스
    parts: Vec<f64>
        파트마다 minX·minY·maxX·maxY·로컬 부호 면적의 두 배·절단 변 존재 여부 순서
    features: Vec<u32>
        피처마다 좌표 시작·성분 수·파트 시작·파트 수·외곽선 시작·외곽선 수 순서
    outline_coordinates: Vec<f64>
        절단 변을 뺀 외곽선의 x·y 성분
    outlines: Vec<f64>
        외곽선마다 전체 파트 인덱스·외곽선 좌표 시작·성분 수·minX·minY·maxX·maxY 순서
    masks: Vec<u8>
        로컬 좌표가 닿는 타일 경계의 비트 마스크

create() -> *mut Context
    동작:
        비어 있는 기본 Context를 Box에 할당하고 JS가 보유할 소유 포인터로 반환한다.

destroy(context: *mut Context) -> ()
    처리 기준: null은 무동작이며 유효한 포인터는 한 번만 해제한다.
    동작:
        null이 아니면 Box 소유권을 회수하여 컨텍스트와 내부 Vec를 해제한다.

input(context: *mut Context, length: usize) -> *mut u8
    동작:
        input 길이를 length로 맞추고 확장한 부분을 0으로 채운 뒤 쓰기 포인터를 반환한다.

records(context: *mut Context, count: usize) -> *mut f64
    동작:
        records 길이를 count × RECORD_STRIDE로 맞추고 확장한 부분을 0으로 채운 뒤 쓰기 포인터를 반환한다.

decode(context: *mut Context, count: usize) -> u32
    동작:
        좌표·파트 끝·파트 정보·피처 정보·외곽선·마스크의 길이를 비우되 입력은 유지한다.
        records 길이가 count × RECORD_STRIDE와 다르면 0을 반환한다.
        레코드 순서대로 decode_feature()를 실행하며 하나라도 실패하면 0을 반환한다.
        모든 레코드가 성공하면 1을 반환한다. count가 0이고 레코드가 비어 있어도 성공한다.
        중간 실패 때 이미 쓴 부분 결과를 되돌리지 않으므로 호출자는 0인 결과 버퍼를 사용하지 않는다.

decode_feature(context: &mut Context, record: usize) -> Option<()>
    동작:
        레코드의 offset이 입력 범위 안의 유한한 비음수 정수인지 확인한다.
        kind가 1·2·3 중 하나이고 extent가 유한한 양수이며 변환 계수가 유한한지 확인한다.
        varint()로 형상 바이트 길이를 읽고 덧셈 오버플로와 원본 입력 초과를 거절한다.
        피처별 누적 x·y를 0에서 시작하고 명령의 하위 3비트와 반복 횟수를 해석한다.
        반복 횟수 0, 미지원 명령, 좌표 바이트 부족, 시작점 없는 LineTo를 거절한다.
        ClosePath는 면 형상이고 반복 횟수가 1이며 현재 파트가 있을 때만 허용한다.
        MoveTo·LineTo는 varint()와 zigzag()로 읽은 차분을 누적하고 ClosePath는 첫 좌표를 다시 추가한다.
        새 MoveTo로 파트가 바뀌거나 형상이 끝나면 finish_part()로 파트를 확정한다.
        면적은 로컬 좌표의 닫힌 변을 포함한 교차곱 합으로 계산한다.
        projected가 1이면 x = min_x + px × scale, y = max_y - py × scale로 저장하고 그 외에는 로컬 좌표를 저장한다.
        경계 마스크는 변환 전 로컬 좌표로 만든다.
        성공한 피처의 좌표·파트·외곽선 시작과 길이를 features에 추가하고 Some(())를 반환한다.
        검증이나 하위 디코드가 실패하면 None을 반환한다.

varint(bytes: &[u8], position: &mut usize, end: usize) -> Option<u32>
    동작:
        end를 넘지 않게 최대 5바이트를 읽고 position을 진행한다.
        다섯 번째 바이트가 15를 초과하거나 종결 바이트 없이 입력이 끝나면 None을 반환한다.
        종결 비트를 만나면 누적한 32비트 값을 반환한다.

zigzag(value: u32) -> f64
    동작:
        하위 비트를 부호로 해석하는 ZigZag 변환으로 좌표 차분을 반환한다.

edge_mask(x: f64, y: f64, extent: f64) -> u8
    동작:
        x ≤ 0.5·x ≥ extent - 0.5·y ≤ 0.5·y ≥ extent - 0.5 조건을 각각 1·2·4·8 비트로 합친다.

finish_part(context: &mut Context, start: usize, feature_start: usize, area: f64, polygon: bool) -> ()
    동작:
        현재 파트의 저장 좌표 범위를 구하고 피처 기준 끝 인덱스를 ends에 추가한다.
        polygon이고 점이 3개 이상이면 양 끝점 마스크가 같은 경계 비트를 공유하는 첫 절단 변을 찾는다.
        bounds·전달받은 area·절단 여부를 parts에 추가한다.
        절단 변이 없으면 별도 외곽선을 만들지 않고 반환한다.
        첫 절단 변 다음부터 순환하며 절단되지 않은 연속 변을 outline_coordinates에 연결한다.
        다음 절단 변을 만나면 연속 구간의 파트 인덱스·좌표 범위·bounds를 outlines에 저장한다.

coordinates(context: *mut Context) -> *const f64
    동작: Context.coordinates의 읽기 포인터를 반환한다.
ends(context: *mut Context) -> *const u32
    동작: Context.ends의 읽기 포인터를 반환한다.
parts(context: *mut Context) -> *const f64
    동작: Context.parts의 읽기 포인터를 반환한다.
features(context: *mut Context) -> *const u32
    동작: Context.features의 읽기 포인터를 반환한다.
outline_coordinates(context: *mut Context) -> *const f64
    동작: Context.outline_coordinates의 읽기 포인터를 반환한다.
outlines(context: *mut Context) -> *const f64
    동작: Context.outlines의 읽기 포인터를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
WASM 호출과 소유권
    내보낸 함수는 C ABI이며 create() 외에는 unsafe 함수다.
    destroy()의 null 예외를 제외하면 이 모듈이 생성한 유효한 Context 포인터를 전달한다.
    output! 매크로가 여섯 출력 접근자를 생성하며 출력 길이는 features·ends·outlines의 메타데이터로 해석한다.
    포인터의 단위는 바이트 주소, 좌표 시작·길이와 파트 끝은 점 개수가 아닌 배열 성분 인덱스다.
    입력 재할당·다음 계산·컨텍스트 해제 전에 필요한 결과를 복사하고 메모리 확장 뒤에는 JS 뷰를 다시 만든다.
    Vec는 큰 요청 뒤 용량을 보유할 수 있으며 Rust 컨텍스트 자체의 힙 상한은 두지 않는다.
    동기 계산 중 취소 메시지는 처리하지 못하므로 완료 뒤 오래된 요청을 버리는 책임은 JS에 있다.
    로딩·트랩의 JS 복귀와 형식 오류의 실패 전달은 연계 Bridge·Task에서 구분한다.
    외부 크레이트·공유 메모리·SIMD를 사용하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
