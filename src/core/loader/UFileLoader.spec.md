# UFileLoader 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

동일 URL의 파일 요청을 공유하고 개별 소비자 또는 URL 전체의 취소를 지원한다.

### 1.2 책임 범위

소비자 등록과 요청 소유권, 다운로드·응답 변환·오류 통지·LoadingManager 집계를 관리한다. 내려받은 독자 포맷의 해석은 소비자 책임이다.

### 1.3 주요 동작 방식

캐시를 우선 조회하고 진행 중인 URL이면 소비자만 추가한다. 새 요청은 콜백 배열과 AbortController를 소유하며 종료 시 현재 URL 등록의 동일성을 확인하여 정리한다.

### 1.4 주요 사용처와 연계 대상

U3F 레이어 정보·모델 목록, 3D Tiles와 이미지·벡터 PBF 등의 파일 요청에 사용한다. THREE.FileLoader의 설정과 Cache·LoadingManager를 사용한다.

## 3. 정규 자연어 수도코드

```spec
UFileLoaderCallback 타입 정의
    onLoad: undefined | function(any): void — 완료 소비자
    onProgress: undefined | function(ProgressEvent): void — 진행률 소비자
    onError: undefined | function(unknown): void — 실패·취소 소비자
    abortController: AbortController | undefined — 공유 컨트롤러
    id: string — 소비자 식별자

HttpError extends Error 클래스 정의
    name: string — HttpError 식별자
    response: Response — 원본 응답
    url: string — 민감 query를 가린 요청 주소
    status: number — HTTP 상태
    statusText: string — HTTP 상태 문자열
    contentType: string — Content-Type 또는 빈 문자열
    responsePreview: string — 본문 미리보기 또는 빈 문자열
    cause: Error | undefined — 선택 원본 오류
    HttpError.constructor(message: string, response: Response, option: {requestUrl?: string, responsePreview?: string, cause?: Error} = {})
        의존: Error — 오류 생성; 생성자: {super()}
        동작:
            부모에 message를 전달하고 name을 HttpError로 설정한다.
            response를 입력 response로, status를 response.status로, statusText를 response.statusText로 저장한다.
            contentType은 response.headers의 Content-Type 또는 빈 문자열로, responsePreview는 option.responsePreview 또는 빈 문자열로 설정한다.
            url은 requestUrl 또는 response.url의 민감 query를 가린 값으로 설정한다.
            option.cause가 truthy이면 cause에 option.cause를 저장한다.

UFileLoader extends THREE.FileLoader 클래스 정의
    constructor(manager)
        의존: THREE.FileLoader — 기반 로더 설정; 생성자: {super()}
        동작: manager를 부모 생성자에 전달한다.

    static loading: Record<string, Array<UFileLoaderCallback> | undefined> = 빈 객체
        URL별 요청 소비자 배열을 공유한다.

    static callbackMap: Record<string, UFileLoaderCallback | undefined> = 빈 객체
        취소되지 않은 소비자 ID별 콜백을 공유한다.

    getLoading(url)
        동작: loading의 URL별 배열을 반환한다.

    deleteCallBack(id) -> void
        동작:
            callbackMap에 ID가 없으면 반환한다.
            onError가 있으면 delete Callback 문자열로 호출한 뒤 해당 ID를 삭제한다.
            URL 소비자 배열이나 네트워크는 직접 정리하지 않는다.

    cancelById(id: string) -> boolean
        의존: AbortController — 마지막 소비자 취소; 함수: {abort()}; 속성 읽기: {signal.aborted}
        동작:
            ID가 없으면 false를 반환한다.
            callbackMap에서 먼저 ID를 삭제하고 name이 AbortError인 Error로 onError를 통지한다.
            해당 URL 배열에서 callbackMap에 남은 활성 소비자가 있는지 검사한다.
            활성 소비자가 없고 공유 컨트롤러가 있으며 아직 중단되지 않았으면 abort한다.
            true를 반환한다. [확인 Q-001]

    isLoading(url)
        동작: URL별 loading 등록의 truthy 여부를 반환한다.

    override abort(url?: string) -> this
        의존: AbortController — URL 전체 취소; 함수: {abort()}; 속성 읽기: {signal.aborted}
        동작:
            해당 URL의 첫 소비자 컨트롤러가 있으며 중단되지 않았으면 abort한다.
            URL을 생략하면 보통 등록이 없어 아무것도 하지 않으며 this를 반환한다.

    override load(url: string, onLoad?: function(any): void, onProgress?: function(ProgressEvent): void | null, onError?: function(unknown): void | null, onAbort?: function(unknown): void | null, id: string = UDEF.createUUID()) -> unknown
        인터페이스: onAbort는 호환용 인수이며 취소도 onError로 전달한다. 소비자 ID는 기본 생성하거나 호출자가 제공한다.
        의존:
            UDEF — 소비자 식별자 생성; 함수: {createUUID()}
            THREE.FileLoader — 상속한 요청 설정; 속성 읽기: {path, manager, requestHeader, withCredentials, mimeType, responseType}
            LoadingManager — 주소 변환과 진행 집계; 함수: {resolveURL(), itemStart(), itemError(), itemEnd()}
            Cache — 파일 데이터 조회와 성공 저장; 함수: {get(), add()}
            Request, Headers, AbortController — 요청 구성; 생성자: {new Request(), new Headers(), new AbortController()}
            fetch — 다운로드; 함수: {fetch()}
            Response — 응답 소비; 함수: {arrayBuffer(), blob(), text()}; 속성 읽기: {status, statusText, headers, body}
            ReadableStream, ProgressEvent — 진행률용 스트림과 통지; 생성자: {new ReadableStream(), new ProgressEvent()}
            DOMParser, TextDecoder — 문서·문자 변환; 생성자: {new DOMParser(), new TextDecoder()}
        동작:
            undefined URL을 빈 문자열로 바꾸고 path가 정의되면 앞에 붙인 뒤 manager로 URL을 변환한다.
            캐시 데이터가 있으면 itemStart를 호출하고 타이머에서 onLoad·itemEnd 순서로 호출한 뒤 캐시 데이터를 즉시 반환한다.
            소비자 콜백 객체를 만든다. 아직 중단되지 않은 같은 URL의 요청이 있으면 컨트롤러를 공유하고 배열과 ID 맵에 추가한 뒤 반환한다.
            주소 변환의 동기 예외는 원래 사유로 onError와 itemError에 통지하여 반환한다. 공유 맵에는 등록하지 않는다.
            새 컨트롤러와 Headers·Request를 먼저 생성한다. 구성의 동기 예외도 원래 사유로 onError와 itemError에 통지하여 반환하며 맵에 등록하지 않는다.
            요청 구성이 성공하면 소비자 배열을 만들어 URL·ID 맵에 등록한다.
            requestHeader와 withCredentials에 맞춰 헤더·자격 증명을 설정하고 responseType·mimeType을 보관한다.
            AbortSignal과 force-cache를 전달하여 fetch를 시작한다.
                시작 자체의 동기 예외는 URL 등록이 자기 배열인 경우에만 제거하고 자기 콜백 객체와 동일한 ID 등록을 통지 전에 삭제한다.
                해당 활성 소비자에게 원래 사유로 onError를 호출한 뒤 itemError로 통지하고 반환한다.
                시작 전 실패는 itemStart·itemEnd를 호출하지 않는다. 같은 URL의 새 등록과 다른 소비자 등록은 지우지 않는다.
            시작에 성공하면 Promise 처리기를 연결한 뒤 itemStart를 호출한다.
            상태가 200 또는 0이면 응답을 소비한다. 0이면 경고를 출력한다.
                body reader를 사용할 수 없거나 활성 진행률 소비자가 없으면 원본 Response를 그대로 사용한다.
                진행률 소비자가 있으면 Content-Length 계열 헤더로 전체 크기를 구하고 reader를 감싼 스트림을 만든다.
                읽기마다 중단·완료를 먼저 처리하고 누적 크기로 활성 소비자에게 ProgressEvent를 전달한다. 제거된 ID는 배열에서 제외하며 인덱스를 보정한다.
                스트림 읽기 실패는 controller.error에 전달하고 상태·헤더를 보존한 새 Response를 사용한다.
            그 외 HTTP 상태이면 제한된 본문 미리보기로 HttpError를 만들어 거부한다.
            responseType이 arraybuffer·blob이면 해당 응답 메서드로 변환한다.
            document이면 text를 읽어 mimeType으로 DOMParser를 호출한다.
            json이면 text를 JSON.parse하며 실패 시 미리보기·cause를 보존한 HttpError로 거부한다.
            그 외에는 mimeType이 없으면 text를, 있으면 charset 정규식과 TextDecoder로 arraybuffer를 문자열로 변환한다.
            성공 데이터를 Cache에 저장하고 성공 콜백 처리 진입을 표시한다.
            URL 등록이 이 요청의 배열과 같을 때만 제거하고, ID가 활성인 소비자의 onLoad를 호출한 뒤 ID를 삭제한다.
            오류가 성공 콜백 진입 후 발생했으면 itemError를 호출하고 원래 오류를 다시 던진다. 다른 소비자의 onError로 다운로드 실패를 재통지하지 않는다. [확인 Q-003]
            다운로드·변환 실패이면 자신이 소유한 URL 등록만 제거하고 활성 소비자의 onError 후 ID를 삭제한 뒤 itemError를 호출한다. [확인 Q-001]
            finally에서 itemEnd를 호출한다.
            성공·실패 소비자 반복은 배열 길이 미만에서만 실행하며 빈 배열에는 통지를 호출하지 않는다.
            비캐시 경로는 undefined를 반환한다.

redactSensitiveQueryParams(url: string) -> string
    동작:
        입력을 문자열로 바꾸고 location.href 또는 localhost를 기준으로 URL을 해석한다.
        민감 query 이름과 일치하는 값은 REDACTED 표기로 바꾼다.
        원래 프로토콜이 있으면 전체 URL을, 없으면 경로·query·hash를 반환한다.
        해석 실패 시 동일 민감 이름의 query 값을 정규식으로 가린 문자열을 반환한다.

createResponsePreview(text: string) -> string
    동작:
        nullish 입력을 빈 문자열로 바꾸고 공백을 한 칸으로 정규화하여 양끝을 제거한다.
        512자 이하면 그대로, 초과하면 처음 512자와 생략 기호를 반환한다.

async readResponsePreview(response: Response) -> Promise<string>
    동작:
        원본 body를 소비하지 않도록 clone의 text로 미리보기를 만든다.
        복제·읽기 실패는 빈 문자열로 대체한다.

createResponseErrorMessage(requestUrl: string, response: Response, option: {responsePreview?: string, cause?: Error, reason?: string} = {}) -> string
    동작:
        민감 값이 가려진 URL, 상태·상태 문자열·Content-Type을 진단 항목으로 만든다.
        미리보기와 cause.message가 truthy이면 추가한다.
        reason이 undefined이면 HTTP 요청 실패로 대체하여 항목을 결합한 문자열을 반환한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
