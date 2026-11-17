# UWasmBridge 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

내부 WASM Bridge의 배포 주소, 비동기 로딩과 초기화 수명을 공통으로 관리한다. 하위 Bridge는 같은 초기화 결과를 공유하면서 각 모듈의 Rust 컨텍스트와 메모리를 직접 소유한다.

### 1.2 책임 범위

경로 설정, 한 수명 안의 초기화 Promise 공유, URL 다운로드, WASM 인스턴스 생성, 종료 이전 세대의 늦은 결과 차단과 계산 트랩 뒤 재로딩 차단을 담당한다. 계산 배열·Rust 컨텍스트·타일 캐시는 하위 Bridge가 관리한다.

### 1.3 주요 동작 방식

메인에서 확정한 전체 파일 주소로 기본 URL을 결정하고 바이트 또는 URL을 초기화한다. 초기화 완료 시 현재 세대인지 확인한 뒤 하위 Bridge에 내보내기를 전달한다. 종료는 세대를 바꾸고 로딩 상태를 비워 새 초기화를 허용한다.

### 1.4 주요 사용처와 연계 대상

`UTerrainDecalWasmBridge`와 `UPbfGeometryWasmBridge`가 상속한다. 하위 클래스는 `_initializeWasm`을 재정의하며 파일명을 별도로 선언하지 않는다. 각 `dispose`는 부모의 무효화를 먼저 실행한 뒤 모듈 자원을 정리한다. 부모 코드는 import를 통해 Task 번들에 포함된다.

## 3. 정규 자연어 수도코드

```spec
UWasmBridge 클래스 정의
    #path: string | undefined
        역할: 메인 문서를 기준으로 확정한 절대 WASM 파일 주소다.
        초기값: undefined

    #loading: Promise<boolean> | null = null
        역할: 현재 수명의 초기화 결과를 공유하고 자동 재시도를 제한한다.

    #generation: number = 0
        역할: 종료 전 초기화 결과를 현재 자원에 적용하지 않도록 수명을 구분한다.

    setPath(path: string) -> void
        처리 기준:
            주소 검증이나 현재 초기화 취소 없이 다음 기본 URL에 사용할 경로를 바꾼다.

        동작:
            path를 #path에 저장한다.

    initialize(source: BufferSource | URL = this.#path ? new URL(this.#path) : undefined) -> Promise<boolean>
        처리 기준:
            기본 주소는 #path가 있을 때 해당 파일 주소로 URL을 만들며 경로가 없으면 undefined다.
            기본 URL 생성 오류는 본문 진입 전에 호출자에게 전달된다.
            초기화 실패는 false로 반환하고 명시적인 dispose 전까지 같은 실패 Promise를 유지한다.
            source가 없을 때의 false 결과는 #loading에 저장하지 않는다.

        의존:
            URL — 기본 파일 주소 변환; 생성자: {new URL()}
            fetch — WASM 다운로드; 함수: {fetch()}
            WebAssembly — 지원 확인·인스턴스 생성; 정적 함수: {instantiate()}

        동작:
            #loading이 있으면 새 source를 사용하지 않고 같은 Promise를 반환한다.
            source가 없으면 false로 완료되는 Promise를 반환한다.
            현재 #generation을 보존하고 비동기 초기화 Promise를 #loading에 저장한다.
                WebAssembly가 없으면 false를 반환한다.
                source가 URL이면 fetch하고 HTTP 응답이 성공하지 않으면 false를 반환한다.
                성공한 응답의 바이트를 읽으며 BufferSource 입력은 그대로 사용한다.
                빈 import 객체로 WebAssembly.instantiate를 실행한다.
                저장한 세대와 현재 #generation이 다르면 컨텍스트를 만들지 않고 false를 반환한다.
                진입 시 #loading이 없고 source가 있는 경우, 저장한 세대와 현재 세대가 같으면 _initializeWasm에 인스턴스의 내보내기를 전달하고 true를 반환한다.
                다운로드·인스턴스 생성·하위 초기화에서 예외가 발생하면 false를 반환한다.
            저장한 Promise를 반환한다.

    _initializeWasm(wasm: WebAssembly.Exports) -> void
        역할: 하위 Bridge가 내보내기 참조와 Rust 컨텍스트를 설정하는 재정의 지점이다.

        동작:
            부모의 기본 구현은 하위 구현이 필요하다는 Error를 발생시킨다.

    _initializeIfNeeded() -> void
        동작:
            #loading이 없고 location이 정의된 환경이면 initialize를 시작하고 완료를 기다리지 않는다.

    _disableWasm() -> void
        동작:
            하위 Bridge의 dispose를 호출하여 자원을 해제한다.
            #loading에 false로 완료된 Promise를 저장하여 계산 트랩 뒤의 자동 재시도를 막는다.

    dispose() -> void
        동작:
            #generation을 증가시켜 진행 중인 이전 초기화를 무효화한다.
            #loading을 null로 비워 다음 초기화를 허용한다.
```

## 4. 공통 처리 기준과 제약

```spec
배포 경로는 종료 뒤에도 유지한다.
진행 중인 fetch나 WASM 컴파일 자체는 취소하지 않으며 이전 세대의 결과 적용만 막는다.
성공 후의 initialize도 같은 Promise를 반환하고 경로 변경만으로 이미 준비된 모듈을 교체하지 않는다.
하위 Bridge의 dispose는 부모 무효화와 자체 자원 해제를 함께 수행한다.
계산 결과는 각 하위 Bridge의 기존 JS 대체 계산·버퍼 소유권 계약을 따른다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
