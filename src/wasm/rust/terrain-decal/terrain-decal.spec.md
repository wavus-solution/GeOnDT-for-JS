# terrain-decal 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

지형에 겹쳐 그릴 경로·면·원의 좌표와 스타일을 셰이더가 읽는 평탄 배열로 바꾼다. 경로의 선분 생성·클리핑·공간 버킷 계산과 변경 없는 경로의 증분 재사용, 면·원의 버킷별 배치를 담당한다.

### 1.2 책임 범위

`src/lib.rs`는 Context 수명, 경로 전체·증분 계산, 격자 순회와 C ABI를 소유한다. `src/shapes.rs`는 같은 Context를 빌려 면·원 클리핑과 출력 배치를 계산한다. 두 파일을 하나의 Rust 모듈로 관리한다.

### 1.3 주요 동작 방식

JS가 f64 입력 헤더와 좌표를 기록하고 전체 경로·증분 경로·면 또는 원 계산을 선택한다. Rust는 f64로 판정한 뒤 셰이더용 f32 출력과 메타데이터를 만든다. JS는 결과를 독립 배열로 복사한다.

### 1.4 주요 사용처와 연계 대상

`UTerrainDecalWasmBridge`가 내보내기를 호출하고 `UTerrainDecalPrepareTask`가 타일 버퍼 구성에 사용한다. 작은 입력의 JS 처리, 로딩·트랩 복귀, 비동기 초기화 무효화와 타일 컨텍스트 LRU는 Bridge·Task의 책임이다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
계산 경로
    경로를 선분·스타일·버킷으로 변환한다.
    증분 입력의 ID·형상 변경 여부로 경로·버킷을 재사용하고 스타일만 바뀐 출력은 해당 구간만 갱신한다.
    면과 원을 버킷별 도형 행·스타일·좌표 배열로 배치한다.
    입력 범위 오류는 성공 여부 0으로 전달하고 유효하지 않은 컨텍스트 포인터는 입력으로 받지 않는다.
```

### 2.2 성능 및 품질 요구사항

```spec
정밀도와 재사용
    좌표·경계·교차 판정은 f64, 셰이더 출력은 f32로 유지한다.
    컨텍스트의 입력·출력 용량과 ID별 경로·희소 버킷을 재사용한다.
    JS 대체 계산과 같은 순서·경계 포함 기준을 유지하며 실제 FPS나 GPU 화질을 이 모듈만으로 보장하지 않는다.
```

## 3. 정규 자연어 수도코드

```spec
PATH_STRIDE: usize = 16
INCREMENTAL_PATH_STRIDE: usize = 18
MIN_CELL_SIZE: f64 = 1e-6
shapes::STRIDE: usize = 24
shapes::MIN_CELL: f64 = 1e-6

Context 타입 정의
    input: Vec<f64>
        헤더 묶음 뒤에 좌표 성분을 이어 붙인 입력
    output: Vec<f32>
        선택한 계산 경로가 마지막으로 생성한 셰이더 배열
    bounds: [f64; 4]
        minX·minY·maxX·maxY 순서의 전체 경계
    count, styles, bucket_values: usize
        경로 계산의 선분 수·스타일 수·패딩 전 버킷 성분 수
        면·원 계산 뒤 count는 버킷에 배치한 도형 행 수다.
    incremental: IncrementalState
        ID별 경로와 격자 레이아웃 재사용 상태
    statistics: [u32; 4]
        경로 재계산·경로 재사용·버킷 재계산·버킷 재사용 수
    shape_points: usize
        면 출력에 저장한 고유 좌표 텍셀 수
    shape_meta: Vec<u32>
        셀마다 도형 행 시작·행 수·0·0 순서의 4개 성분

Segment 타입 정의
    xy, bounds: [f64; 4]
        선분 양 끝 좌표와 선폭 확장을 포함하는 경계
    style: usize
        현재 출력의 경로 스타일 인덱스

BucketLayout 타입 정의
    bounds: [f64; 4]
    gx, gy, threshold: usize
        경로 버킷 재사용 여부를 비교할 전체 경계·격자 수·적용 임계값

CachedPath 타입 정의
    count: usize
        원본 경로의 점 개수
    geometry: [f64; 7]
        단순화 허용값·선폭·클리핑 여부·클립 경계
    metadata: [f64; 7]
        표시 여부·셰이더 순서·색상 RGB·불투명도·합성 배치 번호
    segments: Vec<Segment>
    bounds: [f64; 4]
    buckets: Option<Vec<(usize, Vec<usize>)>>
        비어 있지 않은 셀 번호와 경로 내부의 로컬 선분 인덱스

IncrementalState 타입 정의
    paths: HashMap<u32, CachedPath>
    order: Vec<u32>
    layout: Option<BucketLayout>
        마지막 성공 출력의 ID 순서와 버킷 레이아웃

경로 입력 헤더
    공통 16성분: 좌표 성분 offset·점 수·단순화 허용값·선폭·표시 여부·셰이더 순서·RGB·불투명도·합성 배치 번호·클리핑 여부·클립 경계 4성분
    증분 추가 2성분: ID·형상 좌표 제공 여부
    offset은 바이트 주소가 아닌 input의 f64 성분 인덱스다.

create() -> *mut Context
    동작:
        기본 Context를 Box에 할당하고 소유 포인터를 반환한다.
destroy(context: *mut Context) -> ()
    처리 기준: create()로 얻은 유효한 포인터를 한 번만 해제하며 null을 허용하지 않는다.
    동작:
        Box 소유권을 회수하여 입력·출력·증분 캐시·면 메타데이터를 해제한다.
input(context: *mut Context, len: usize) -> *mut f64
    동작:
        입력 길이를 len으로 맞추고 확장 부분을 0으로 채운 뒤 쓰기 포인터를 반환한다.

prepare(context: *mut Context, paths: usize, gx: usize, gy: usize, threshold: usize) -> u32
    동작:
        Context.prepare()의 성공 여부를 1·0으로 변환해 반환한다.

Context.prepare(paths: usize, gx: usize, gy: usize, threshold: usize) -> bool
    동작:
        이전 증분 캐시와 statistics를 초기화한다.
        gx·gy가 0이거나 곱이 오버플로 또는 65536 초과이면 실패한다.
        16성분 헤더와 각 좌표 구간이 입력 안에 있고 offset이 헤더 뒤인지 확인한다.
        점이 2개 미만인 경로를 건너뛰고 나머지 경로의 스타일을 등록하여 append_path()로 선분을 만든다.
        선분이 없으면 bounds를 [0, 0, 1, 1]로 정하고 유한하지 않은 경계는 실패로 처리한다.
        선분 수가 threshold보다 클 때만 Grid로 버킷을 만들고 pack_buckets()로 배치한다.
        임계값 이하이면 버킷 대신 -1 네 성분을 사용한다.
        write_output()으로 경로 결과를 저장하고 true를 반환한다.

append_path(input: &[f64], h: &[f64], style: usize, segments: &mut Vec<Segment>, bounds: &mut [f64; 4]) -> ()
    동작:
        점이 2개 미만이면 반환한다.
        단순화 허용값을 음수이면 0으로 보정하고 직전 채택점과의 거리 제곱이 허용값 제곱 미만인 중간점을 생략한다.
        마지막 점은 이 거리 조건으로 생략하지 않는다.
        클리핑을 요청하면 clip()으로 선분을 자르고 범위 밖 선분과 양 끝이 같은 선분을 제외한다.
        음수이면 0으로 보정한 선폭으로 선분 경계를 확장하고 전체 bounds와 segments를 갱신한다.

clip(xy: [f64; 4], bounds: &[f64]) -> Option<[f64; 4]>
    동작:
        네 사각 경계에 대한 선분 매개변수 구간을 좁힌다.
        평행하면서 경계 밖이거나 유효 구간이 역전되면 None, 그 외에는 잘린 양 끝 좌표를 반환한다.

Grid 타입 정의
    x, y: i32
    min_x, min_y, width, height: f64
    buckets: Vec<Vec<usize>>
    checked: Vec<usize>
        셀별 선분 목록과 같은 선분의 중복 교차 검사를 막는 표식

Grid.new(layout: BucketLayout) -> Self
    동작:
        경계 폭·높이를 MIN_CELL_SIZE 이상으로 보정해 셀 크기를 계산하고 빈 버킷과 검사 표식을 만든다.

Grid.insert(segment: &Segment, index: usize) -> ()
    동작:
        시작·종료 셀을 격자 안으로 제한하고 다음 세로·가로 경계를 만나는 비율로 선분을 따라 순회한다.
        선분 경계의 확장량에 최대 셀 크기를 더하고 인접 후보 셀 범위는 전체 격자 크기 이내로 제한한다.
        add()에 현재 셀과 확장 범위를 전달한다.
        두 경계 비율 차이가 f64::EPSILON × max(1, 두 비율의 절댓값) × 16 이내이면 모서리 접촉으로 보고 양옆 셀도 방문한다.
        종료 셀에 도달하거나 격자 셀 수를 기준으로 한 반복 상한에 도달하면 종료한다.

Grid.add(cx: i32, cy: i32, px: i32, py: i32, index: usize, segment: &Segment, padding: f64, dx: f64, dy: f64, length: f64) -> ()
    동작:
        중심 셀이 격자 밖이면 반환한다.
        주변 후보 셀 중 같은 index를 검사하지 않은 셀에 검사 표식을 먼저 기록한다.
        intersects()가 true인 셀에만 index를 추가한다. 실패한 교차 판정도 다시 하지 않는다.

intersects(segment: &Segment, padding: f64, dx: f64, dy: f64, length: f64, b: [f64; 4]) -> bool
    동작:
        끝점이 사각형 내부 또는 경계에 있거나 선분 매개변수 구간이 사각형과 겹치면 true를 반환한다.
        직접 교차하지 않고 padding이 0 이하이면 false를 반환한다.
        point_cell_distance()로 구한 끝점·사각형 거리 또는 point_segment_distance()로 구한 모서리·선분 거리가 padding 제곱 이하이면 true를 반환한다.
        거리 계산은 제곱 거리이며 선분 투영 비율을 0부터 1까지 제한한다.

pack_buckets(buckets: &[Vec<usize>]) -> Vec<f32>
    동작:
        셀마다 시작 텍셀·인덱스 텍셀 수·0·0을 기록한다.
        선분 인덱스를 네 성분 단위로 이어 붙이고 남는 성분은 -1로 채운다.
        전체 인덱스가 비어 있어도 -1 네 성분을 붙여 메타데이터 뒤에 반환한다.

capacity(texels: usize) -> usize
    동작:
        텍셀 수를 최소 1로 보정하고 너비를 제곱근 올림, 높이를 텍셀 수 나누기 너비의 올림으로 정한다.
        패딩을 포함한 RGBA 성분 수인 너비 × 높이 × 4를 반환한다.

Context.write_output(segments: &[Segment], styles: &[usize], buckets: &[f32], stride: usize) -> ()
    동작:
        선분·스타일 개수와 패딩 전 bucket_values를 갱신하고 output을 비운다.
        capacity(count) 두 구간에 선분 좌표와 스타일 인덱스·선폭·표시 여부·셰이더 순서를 저장한다.
        capacity(max(styles, 1) × 2) 구간에 경로마다 RGB·불투명도·합성 배치 번호를 8성분 행으로 기록한다.
        마지막 패딩 구간에 버킷 메타데이터와 인덱스를 복사한다.

prepare_incremental(context: *mut Context, paths: usize, gx: usize, gy: usize, threshold: usize) -> u32
    동작:
        Context.prepare_incremental()의 성공 여부를 1·0으로 변환해 반환한다.

Context.prepare_incremental(paths: usize, gx: usize, gy: usize, threshold: usize) -> bool
    동작:
        statistics를 비우고 incremental 소유권을 임시로 꺼내 update_cached()에 전달한다.
        성공·실패와 관계없이 변경된 상태를 Context에 돌려놓고 결과를 반환한다.

Context.update_cached(state: &mut IncrementalState, paths: usize, gx: usize, gy: usize, threshold: usize) -> bool
    동작:
        격자 수·18성분 헤더 범위·헤더 전체의 유한성을 검증한다.
        ID는 1부터 u32::MAX까지의 중복 없는 정수, 점 수는 비음수 정수, 좌표 제공 표식은 0 또는 1이어야 한다.
        geometry_options()로 헤더의 단순화 허용값·선폭·클립 설정을 추출한다.
        좌표 제공 표식이 1이면 헤더 뒤의 정수 offset·좌표 범위·좌표 유한성을 확인한다.
        append_path()로 새 경로를 만들어 해당 ID를 교체하고 버킷을 무효화하며 경로 재계산 수를 늘린다.
        표식이 0이면 같은 ID의 캐시가 있고 점 수와 geometry가 같아야 하며 경로 재사용 수를 늘린다.
        현재 입력에서 사라진 ID를 제거하고 살아 있는 선분 경계를 합치며 빈 결과는 [0, 0, 1, 1]로 정한다.
        경계·gx·gy·threshold가 이전 layout과 다르면 모든 경로의 버킷을 무효화한다.
        형상 교체가 없고 layout과 ID 순서가 같으면 path_metadata()로 표시·순서·색상·불투명도·배치 값만 비교한다.
        이 경우 변경된 선분 메타데이터·스타일 출력 구간만 갱신하고 전체 재배치를 생략한다.
        그 외에는 입력 순서로 선분과 스타일을 재배치하고 선분 수가 threshold를 초과할 때 버킷을 사용한다.
        경로별 버킷이 없으면 Grid로 비어 있지 않은 셀만 계산해 캐시하고, 있으면 재사용 통계를 늘린다.
        경로 내부 선분 번호를 현재 전체 출력의 시작 위치만큼 이동하여 셀 목록에 합친다.
        pack_buckets()·write_output()으로 출력하고 성공한 ID 순서·layout을 저장한다.
        검증 실패는 false로 반환하며 그 전에 반영된 캐시 변경을 일괄 롤백하지 않는다.

cache_statistics(context: *const Context) -> *const u32
    동작: statistics 네 성분의 읽기 포인터를 반환한다.
retained_bytes(context: *const Context) -> f64
    동작: Context.retained_bytes()의 추정 바이트를 f64로 반환한다.
Context.retained_bytes() -> usize
    동작:
        Context 크기·입력/출력 용량·ID 순서·HashMap 용량과 항목당 추정 여유 32바이트를 합한다.
        경로별 선분과 희소 버킷 Vec의 용량을 더한다. shape_meta의 별도 할당 용량은 더하지 않는다.

shapes::Shape 타입 정의
    header: [f64; 24]
    points: Vec<[f64; 2]>
    bounds: [f64; 4]
    cover: bool
        원본 스타일 헤더·잘린 면 좌표·선폭 포함 경계·클립 사각형을 덮는 면 여부

면·원 입력 헤더
    0~5: 좌표 성분 offset·점 수·선폭·원 반지름·원 중심 x·원 중심 y
    6~9: 셰이더 순서·그리기 순서·표시 여부·합성 배치 번호
    10~17: 채움 RGBA·외곽선 RGBA
    18~23: 클립 범위 존재 여부·클립 경계 네 성분·면 좌표 클리핑 적용 여부

prepare_shapes(context: *mut Context, count: usize, gx: usize, gy: usize, kind: u32) -> u32
    동작:
        shapes::prepare()에 Context를 가변 대여하고 성공 여부를 1·0으로 반환한다.

shapes::prepare(context: &mut Context, count: usize, gx: usize, gy: usize, kind: u32) -> bool
    동작:
        count·gx·gy가 0이거나 격자 곱이 오버플로 또는 65536 초과이면 실패한다.
        kind가 면 1·원 2가 아니거나 24성분 헤더 범위가 부족하거나 입력 전체에 비유한 값이 있으면 실패한다.
        각 도형의 offset·점 수가 비음수 정수이고 좌표 구간이 입력 안인지 확인한다.
        면은 좌표를 읽고 헤더의 18·23 성분이 모두 0이 아니면 shapes::clip()을 적용한다.
        점이 3개 미만인 면은 제외하고 나머지는 선폭을 더한 경계와 covers() 결과를 보관한다.
        원은 반지름이 0 이하이면 제외하고 중심·반지름·선폭으로 경계를 계산한다.
        전체 경계를 합치고 면은 셀 크기에 해당하는 여유를 더해 후보 셀에 도형을 배치한다.
        shapes::cell()은 경계 비율을 0부터 0.999999까지 제한한 뒤 셀 인덱스를 내림한다.
        모든 셀의 목록이 같고 비어 있지 않으면 도형 행을 한 번만 저장하고 시작 0을 공유한다.
        그 외에는 셀 순서대로 도형 행을 연결하고 shape_meta에 시작·개수·0·0을 저장한다.
        면 좌표는 도형별 한 번만 저장하고 각 도형 행에서 같은 시작 텍셀을 참조한다.
        면 데이터는 점 수·셰이더 순서·배치 번호·점 시작, 원 데이터는 중심 x·중심 y·반지름·셰이더 순서로 배치한다.
        행마다 채움 RGBA·외곽선 RGBA·선폭·표시 여부·그리기 순서·면 cover 또는 원 배치 번호를 12성분으로 기록한다.
        면은 행별 경계 배열도 추가하고 output·count·shape_points·bounds를 갱신해 true를 반환한다.
        도형이 모두 제외되어도 true이며 count·shape_points는 0, 전체 경계는 초기 무한대 값으로 남는다.

shapes::clip(points: Vec<[f64; 2]>, bounds: &[f64]) -> Vec<[f64; 2]>
    동작:
        왼쪽·오른쪽·아래·위 경계 순서로 내부 점과 교점을 남기는 사각형 클리핑을 적용한다.
        push_unique()로 연속 중복 좌표를 제외하고 첫 점과 같은 마지막 점을 제거해 반환한다.

shapes::covers(points: &[[f64; 2]], header: &[f64]) -> bool
    동작:
        클립 범위가 있고 점이 네 개이며 범위 폭·높이가 양수일 때만 덮음 판정을 계속한다.
        좌표 크기에 비례한 f64::EPSILON × 64 허용값 안에 네 모서리가 모두 있는지 확인한다.
        다각형 면적의 두 배와 사각형 면적의 두 배 차이가 허용값 × 최대 변 길이 × 8 이내인지 반환한다.

shape_points(context: *const Context) -> usize
    동작: 마지막 면·원 계산의 고유 점 텍셀 수를 반환하며 원 계산은 0이다.
shape_meta(context: *const Context) -> *const u32
    동작: 마지막 면·원 계산의 셀별 도형 행 메타데이터 포인터를 반환한다.
output(context: *const Context) -> *const f32
    동작: 현재 Context.output의 읽기 포인터를 반환한다.
output_len(context: *const Context) -> usize
    동작: output의 f32 성분 수를 반환한다.
bounds(context: *const Context) -> *const f64
    동작: 전체 경계 네 성분의 f64 포인터를 반환한다.
segment_count(context: *const Context) -> usize
    동작: 경로 계산의 선분 수 또는 면·원 계산의 배치 행 수인 count를 반환한다.
style_count(context: *const Context) -> usize
    동작: 마지막 경로 계산의 styles를 반환한다.
bucket_values(context: *const Context) -> usize
    동작: 마지막 경로 계산의 패딩 전 bucket_values를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
호출 경계와 소유권
    내보낸 함수는 C ABI이며 create() 외에는 unsafe 함수다.
    이 모듈이 생성한 유효한 포인터와 입력 구간을 사용하며 해제 후 다시 호출하지 않는다.
    출력·통계·경계·면 메타데이터 포인터는 컨텍스트 소유이며 JS가 해제하지 않는다.
    다음 입력 재할당·계산·해제 전에 결과를 독립 배열로 복사하고 메모리 확장 뒤에는 JS 뷰를 다시 만든다.
    경로 전용 통계·스타일·버킷과 면 전용 메타데이터는 대응 계산 경로의 성공 뒤에만 해석한다.
    전체 경로 계산은 좌표 유한성을 입력 전체에서 검사하지 않지만 JS Bridge가 입력 전체를 검사한다.
    증분 경로는 헤더와 새 좌표 구간을, 면·원은 입력 전체를 유한성 검사한다.
    실패한 계산의 부분 캐시·이전 출력은 유효한 새 결과로 사용하지 않는다.
    Rust Context 자체의 힙 상한이나 타일 LRU는 두지 않는다.
    타일 컨텍스트 512개·추정 32MiB 제한과 축출 시 destroy() 호출은 JS Bridge가 관리하며 실제 WASM 힙 상한은 아니다.
    외부 크레이트·공유 메모리·SIMD를 사용하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
