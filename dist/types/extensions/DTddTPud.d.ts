import { UTaskProcessor } from "../../GeOnDT.modules.js";
import { BufferGeometry } from "../three/build/three.module.js";

/**
 * 예산 설정값만 보관.
 */
declare class UA3FCacheBudgetOptionsVo {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FCacheBudgetOptionsVo 클래스 생성자입니다. <br>
     * 전달값을 정본 키로 읽어 데이터 보관 필드를 초기화합니다.
     *
     * @param {UA3FCacheBudgetOptionsVoCO} [opt={}] 선택 데이터, null 불가. <br>
     * 원본 변경 없음, 실행 모듈이 수치·조합을 검증
     */
    constructor(opt?: UA3FCacheBudgetOptionsVoCO);
    /** @type {number | null} */
    _maxTotalCacheBytes: number | null;
    /**
     * 보관 필드에 전달값을 기록합니다.
     *
     * @param {number | null} value 양의 안전 정수 바이트 한도. <br>
     * null은 추가 합산 제한 없음. <br>
     * 개별 캐시 maxCacheBytes/cacheFrames는 계속 적용. <br>
     * 실행·검증은 수행하지 않음
     */
    set maxTotalCacheBytes(value: number | null);
    /**
     * 양의 안전 정수 바이트 한도. <br>
     * null은 추가 합산 제한 없음. <br>
     * 개별 캐시 maxCacheBytes/cacheFrames는 계속 적용.
     *
     * @returns {number | null} 양의 안전 정수 바이트 한도. <br>
     * null은 추가 합산 제한 없음. <br>
     * 개별 캐시 maxCacheBytes/cacheFrames는 계속 적용.
     */
    get maxTotalCacheBytes(): number | null;
}
/**
 * 합산 상태 사본만 전달.
 */
declare class UA3FCacheBudgetStatusVo {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FCacheBudgetStatusVo 클래스 생성자입니다. <br>
     * 전달값을 정본 키로 읽어 데이터 보관 필드를 초기화합니다.
     *
     * @param {UA3FCacheBudgetStatusVoCO} [opt={}] 선택 데이터, null 불가. <br>
     * 원본 변경 없음, 실행 모듈이 수치·조합을 검증
     */
    constructor(opt?: UA3FCacheBudgetStatusVoCO);
    /** @type {number | null} */
    _maxTotalCacheBytes: number | null;
    /** @type {number} */
    _reservedBytes: number;
    /** @type {number} */
    _residentBytes: number;
    /** @type {number} */
    _usedBytes: number;
    /** @type {number} */
    _protectedBytes: number;
    /** @type {number} */
    _reclaimableBytes: number;
    /** @type {number | null} */
    _availableBytes: number | null;
    /** @type {number} */
    _ownerCount: number;
    /** @type {number} */
    _bufferCount: number;
    /** @type {boolean} */
    _disposed: boolean;
    /**
     * 보관 필드에 전달값을 기록합니다.
     *
     * @param {number | null} value 적용 중인 전체 원시 프레임 바이트 상한, 실행·검증은 수행하지 않음
     */
    set maxTotalCacheBytes(value: number | null);
    /**
     * 적용 중인 전체 원시 프레임 바이트 상한
     *
     * @returns {number | null} 적용 중인 전체 원시 프레임 바이트 상한
     */
    get maxTotalCacheBytes(): number | null;
    /**
     * 보관 필드에 전달값을 기록합니다.
     *
     * @param {number} value 0 이상 정수 바이트, HTTP/decode 물리 종료 전 고정 버퍼 예약 합계, 실행·검증은 수행하지 않음
     */
    set reservedBytes(value: number);
    /**
     * 0 이상 정수 바이트, HTTP/decode 물리 종료 전 고정 버퍼 예약 합계
     *
     * @returns {number} 0 이상 정수 바이트, HTTP/decode 물리 종료 전 고정 버퍼 예약 합계
     */
    get reservedBytes(): number;
    /**
     * 보관 필드에 전달값을 기록합니다.
     *
     * @param {number} value 0 이상 정수 바이트, 준비 완료 고정 backing buffer 합계, 실행·검증은 수행하지 않음
     */
    set residentBytes(value: number);
    /**
     * 0 이상 정수 바이트, 준비 완료 고정 backing buffer 합계
     *
     * @returns {number} 0 이상 정수 바이트, 준비 완료 고정 backing buffer 합계
     */
    get residentBytes(): number;
    /**
     * 보관 필드에 전달값을 기록합니다.
     *
     * @param {number} value reservedBytes + residentBytes, GPU/정적 형상/브라우저 전체 메모리를 뜻하지 않음, 실행·검증은 수행하지 않음
     */
    set usedBytes(value: number);
    /**
     * reservedBytes + residentBytes, GPU/정적 형상/브라우저 전체 메모리를 뜻하지 않음
     *
     * @returns {number} reservedBytes + residentBytes, GPU/정적 형상/브라우저 전체 메모리를 뜻하지 않음
     */
    get usedBytes(): number;
    /**
     * 보관 필드에 전달값을 기록합니다.
     *
     * @param {number} value 준비 완료 버퍼 중 lease·현재 목표 준비·full 정책으로 회수할 수 없는 바이트, residentBytes의 부분집합, 실행·검증은 수행하지 않음
     */
    set protectedBytes(value: number);
    /**
     * 준비 완료 버퍼 중 lease·현재 목표 준비·full 정책으로 회수할 수 없는 바이트, residentBytes의 부분집합
     *
     * @returns {number} 준비 완료 버퍼 중 lease·현재 목표 준비·full 정책으로 회수할 수 없는 바이트, residentBytes의 부분집합
     */
    get protectedBytes(): number;
    /**
     * 보관 필드에 전달값을 기록합니다.
     *
     * @param {number} value residentBytes - protectedBytes, 기존 cache eviction 콜백으로 회수 가능한 준비 완료 버퍼, 실행·검증은 수행하지 않음
     */
    set reclaimableBytes(value: number);
    /**
     * residentBytes - protectedBytes, 기존 cache eviction 콜백으로 회수 가능한 준비 완료 버퍼
     *
     * @returns {number} residentBytes - protectedBytes, 기존 cache eviction 콜백으로 회수 가능한 준비 완료 버퍼
     */
    get reclaimableBytes(): number;
    /**
     * 보관 필드에 전달값을 기록합니다.
     *
     * @param {number | null} value 한도가 있으면 maxTotalCacheBytes-usedBytes, 무제한이면 null, 실행·검증은 수행하지 않음
     */
    set availableBytes(value: number | null);
    /**
     * 한도가 있으면 maxTotalCacheBytes-usedBytes, 무제한이면 null
     *
     * @returns {number | null} 한도가 있으면 maxTotalCacheBytes-usedBytes, 무제한이면 null
     */
    get availableBytes(): number | null;
    /**
     * 보관 필드에 전달값을 기록합니다.
     *
     * @param {number} value 0 이상 안전 정수, 신규 허용 또는 아직 토큰을 보유한 캐시 인스턴스 수, 실행·검증은 수행하지 않음
     */
    set ownerCount(value: number);
    /**
     * 0 이상 안전 정수, 신규 허용 또는 아직 토큰을 보유한 캐시 인스턴스 수
     *
     * @returns {number} 0 이상 안전 정수, 신규 허용 또는 아직 토큰을 보유한 캐시 인스턴스 수
     */
    get ownerCount(): number;
    /**
     * 보관 필드에 전달값을 기록합니다.
     *
     * @param {number} value 0 이상 안전 정수, reserved/resident 토큰의 고유 개수, 같은 버퍼의 여러 attribute/lease는 중복 합산하지 않음, 실행·검증은 수행하지 않음
     */
    set bufferCount(value: number);
    /**
     * 0 이상 안전 정수, reserved/resident 토큰의 고유 개수, 같은 버퍼의 여러 attribute/lease는 중복 합산하지 않음
     *
     * @returns {number} 0 이상 안전 정수, reserved/resident 토큰의 고유 개수, 같은 버퍼의 여러 attribute/lease는 중복 합산하지 않음
     */
    get bufferCount(): number;
    /**
     * 보관 필드에 전달값을 기록합니다.
     *
     * @param {boolean} value 신규 예약이 차단된 종료 상태. <br>
     * true이어도 종료 대기 토큰이 남으면 바이트를 계속 표시, 실행·검증은 수행하지 않음
     */
    set disposed(value: boolean);
    /**
     * 신규 예약이 차단된 종료 상태. <br>
     * true이어도 종료 대기 토큰이 남으면 바이트를 계속 표시
     *
     * @returns {boolean} 신규 예약이 차단된 종료 상태. <br>
     * true이어도 종료 대기 토큰이 남으면 바이트를 계속 표시
     */
    get disposed(): boolean;
}
/**
 * 프레임 로딩 모드와 저장 한도를 보관합니다.
 *
 * @group A3F
 * @summary 프레임 로딩 모드와 저장 한도를 보관합니다.
 */
declare class UA3FFrameCacheOptionsVo {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FFrameCacheOptionsVo 클래스 생성자입니다. <br>
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FFrameCacheOptionsVoCO} [opt={}] 선택 정책이며 null 불가, 옵션 원본은 변경하지 않음
     */
    constructor(opt?: UA3FFrameCacheOptionsVoCO);
    /** @type {('streaming' | 'full')} */
    _loadMode: ("streaming" | "full");
    /** @type {number} */
    _cacheFrames: number;
    /** @type {number} */
    _maxConcurrentLoads: number;
    /** @type {number | null} */
    _maxCacheBytes: number | null;
    /** @type {boolean} */
    _verifyHash: boolean;
    /**
     * 로딩 모드, 기본 streaming 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {('streaming' | 'full')} value 로딩 모드, 기본 streaming
     */
    set loadMode(value: ("streaming" | "full"));
    /**
     * 로딩 모드, 기본 streaming 값을 반환합니다.
     *
     * @returns {('streaming' | 'full')} 로딩 모드, 기본 streaming
     */
    get loadMode(): ("streaming" | "full");
    /**
     * streaming의 표시·진행 중·준비 완료를 합친 고유 버퍼 슬롯 상한, 기본 3, 2 이상의 안전 정수 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value streaming의 표시·진행 중·준비 완료를 합친 고유 버퍼 슬롯 상한, 기본 3, 2 이상의 안전 정수
     */
    set cacheFrames(value: number);
    /**
     * streaming의 표시·진행 중·준비 완료를 합친 고유 버퍼 슬롯 상한, 기본 3, 2 이상의 안전 정수 값을 반환합니다.
     *
     * @returns {number} streaming의 표시·진행 중·준비 완료를 합친 고유 버퍼 슬롯 상한, 기본 3, 2 이상의 안전 정수
     */
    get cacheFrames(): number;
    /**
     * HTTP부터 decode 완료까지 동시 파이프라인 상한, 기본 2, 양의 안전 정수 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value HTTP부터 decode 완료까지 동시 파이프라인 상한, 기본 2, 양의 안전 정수
     */
    set maxConcurrentLoads(value: number);
    /**
     * HTTP부터 decode 완료까지 동시 파이프라인 상한, 기본 2, 양의 안전 정수 값을 반환합니다.
     *
     * @returns {number} HTTP부터 decode 완료까지 동시 파이프라인 상한, 기본 2, 양의 안전 정수
     */
    get maxConcurrentLoads(): number;
    /**
     * 원시 backing buffer와 진행 중 예약의 바이트 상한, 기본 null, 지정 시 양의 안전 정수 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number | null} value 원시 backing buffer와 진행 중 예약의 바이트 상한, 기본 null, 지정 시 양의 안전 정수
     */
    set maxCacheBytes(value: number | null);
    /**
     * 원시 backing buffer와 진행 중 예약의 바이트 상한, 기본 null, 지정 시 양의 안전 정수 값을 반환합니다.
     *
     * @returns {number | null} 원시 backing buffer와 진행 중 예약의 바이트 상한, 기본 null, 지정 시 양의 안전 정수
     */
    get maxCacheBytes(): number | null;
    /**
     * SHA-256 검사 여부, 기본 true 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {boolean} value SHA-256 검사 여부, 기본 true
     */
    set verifyHash(value: boolean);
    /**
     * SHA-256 검사 여부, 기본 true 값을 반환합니다.
     *
     * @returns {boolean} SHA-256 검사 여부, 기본 true
     */
    get verifyHash(): boolean;
}
/**
 * 프레임 캐시 사용량과 로딩 상태의 순간 사본을 전달합니다.
 *
 * @group A3F
 * @summary 프레임 캐시 사용량과 로딩 상태의 순간 사본을 전달합니다.
 */
declare class UA3FFrameCacheStatusVo {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FFrameCacheStatusVo 클래스 생성자입니다. <br>
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FFrameCacheStatusVoCO} opt 모든 키가 필수이며 null 불가, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FFrameCacheStatusVoCO);
    /** @type {('streaming' | 'full')} */
    _loadMode: ("streaming" | "full");
    /** @type {number} */
    _totalFrameCount: number;
    /** @type {number} */
    _readyFrameCount: number;
    /** @type {number} */
    _residentBufferCount: number;
    /** @type {number} */
    _inFlightBufferCount: number;
    /** @type {number} */
    _leasedBufferCount: number;
    /** @type {number} */
    _residentBytes: number;
    /** @type {number} */
    _reservedBytes: number;
    /** @type {number | null} */
    _requestedFrameIndex: number | null;
    /** @type {number} */
    _requestId: number;
    /** @type {boolean} */
    _preloadComplete: boolean;
    /** @type {Error | null} */
    _lastError: Error | null;
    /**
     * 생성 시 고정한 로딩 모드 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {('streaming' | 'full')} value 생성 시 고정한 로딩 모드
     */
    set loadMode(value: ("streaming" | "full"));
    /**
     * 생성 시 고정한 로딩 모드 값을 반환합니다.
     *
     * @returns {('streaming' | 'full')} 생성 시 고정한 로딩 모드
     */
    get loadMode(): ("streaming" | "full");
    /**
     * 빈 프레임을 포함한 등록 수 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 빈 프레임을 포함한 등록 수
     */
    set totalFrameCount(value: number);
    /**
     * 빈 프레임을 포함한 등록 수 값을 반환합니다.
     *
     * @returns {number} 빈 프레임을 포함한 등록 수
     */
    get totalFrameCount(): number;
    /**
     * 현재 준비 완료 버퍼로 제공 가능한 등록 프레임 수, 누적 수가 아님 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 현재 준비 완료 버퍼로 제공 가능한 등록 프레임 수, 누적 수가 아님
     */
    set readyFrameCount(value: number);
    /**
     * 현재 준비 완료 버퍼로 제공 가능한 등록 프레임 수, 누적 수가 아님 값을 반환합니다.
     *
     * @returns {number} 현재 준비 완료 버퍼로 제공 가능한 등록 프레임 수, 누적 수가 아님
     */
    get readyFrameCount(): number;
    /**
     * 준비 완료한 고유 backing buffer 수 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 준비 완료한 고유 backing buffer 수
     */
    set residentBufferCount(value: number);
    /**
     * 준비 완료한 고유 backing buffer 수 값을 반환합니다.
     *
     * @returns {number} 준비 완료한 고유 backing buffer 수
     */
    get residentBufferCount(): number;
    /**
     * HTTP 또는 decode 중인 고유 버퍼 수 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value HTTP 또는 decode 중인 고유 버퍼 수
     */
    set inFlightBufferCount(value: number);
    /**
     * HTTP 또는 decode 중인 고유 버퍼 수 값을 반환합니다.
     *
     * @returns {number} HTTP 또는 decode 중인 고유 버퍼 수
     */
    get inFlightBufferCount(): number;
    /**
     * 하나 이상 lease로 보호하는 준비 완료 고유 버퍼 수 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 하나 이상 lease로 보호하는 준비 완료 고유 버퍼 수
     */
    set leasedBufferCount(value: number);
    /**
     * 하나 이상 lease로 보호하는 준비 완료 고유 버퍼 수 값을 반환합니다.
     *
     * @returns {number} 하나 이상 lease로 보호하는 준비 완료 고유 버퍼 수
     */
    get leasedBufferCount(): number;
    /**
     * 준비 완료한 고유 backing buffer 길이 합, 바이트 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 준비 완료한 고유 backing buffer 길이 합, 바이트
     */
    set residentBytes(value: number);
    /**
     * 준비 완료한 고유 backing buffer 길이 합, 바이트 값을 반환합니다.
     *
     * @returns {number} 준비 완료한 고유 backing buffer 길이 합, 바이트
     */
    get residentBytes(): number;
    /**
     * 진행 중 파일의 기대 길이 예약 합, 바이트 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 진행 중 파일의 기대 길이 예약 합, 바이트
     */
    set reservedBytes(value: number);
    /**
     * 진행 중 파일의 기대 길이 예약 합, 바이트 값을 반환합니다.
     *
     * @returns {number} 진행 중 파일의 기대 길이 예약 합, 바이트
     */
    get reservedBytes(): number;
    /**
     * 마지막 선택한 0 기반 순번 또는 아직 선택하지 않은 null 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number | null} value 마지막 선택한 0 기반 순번 또는 아직 선택하지 않은 null
     */
    set requestedFrameIndex(value: number | null);
    /**
     * 마지막 선택한 0 기반 순번 또는 아직 선택하지 않은 null 값을 반환합니다.
     *
     * @returns {number | null} 마지막 선택한 0 기반 순번 또는 아직 선택하지 않은 null
     */
    get requestedFrameIndex(): number | null;
    /**
     * 선택 전 0, 이후 양의 요청 순번 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 선택 전 0, 이후 양의 요청 순번
     */
    set requestId(value: number);
    /**
     * 선택 전 0, 이후 양의 요청 순번 값을 반환합니다.
     *
     * @returns {number} 선택 전 0, 이후 양의 요청 순번
     */
    get requestId(): number;
    /**
     * null 아닌 모든 등록 고유 파일이 준비 완료했는지 여부 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {boolean} value null 아닌 모든 등록 고유 파일이 준비 완료했는지 여부
     */
    set preloadComplete(value: boolean);
    /**
     * null 아닌 모든 등록 고유 파일이 준비 완료했는지 여부 값을 반환합니다.
     *
     * @returns {boolean} null 아닌 모든 등록 고유 파일이 준비 완료했는지 여부
     */
    get preloadComplete(): boolean;
    /**
     * 최근 로딩 오류 또는 null, 의도된 탐색 취소는 제외 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {Error | null} value 최근 로딩 오류 또는 null, 의도된 탐색 취소는 제외
     */
    set lastError(value: Error | null);
    /**
     * 최근 로딩 오류 또는 null, 의도된 탐색 취소는 제외 값을 반환합니다.
     *
     * @returns {Error | null} 최근 로딩 오류 또는 null, 의도된 탐색 취소는 제외
     */
    get lastError(): Error | null;
}
/**
 * A3F 수치 시간 재생과 캐시 설정을 보관합니다.
 *
 * @group A3F
 * @summary A3F 수치 시간 재생과 캐시 설정을 보관합니다.
 */
declare class UA3FTimelineOptionsVo {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FTimelineOptionsVo 클래스 생성자입니다. <br>
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FTimelineOptionsVoCO} [opt={}] 선택 정책이며 null 불가, 옵션 원본은 변경하지 않음
     */
    constructor(opt?: UA3FTimelineOptionsVoCO);
    /** @type {string | null} */
    _sourceTimeUnit: string | null;
    /** @type {number} */
    _sourceUnitsPerSecond: number;
    /** @type {number} */
    _playbackRate: number;
    /** @type {boolean} */
    _loop: boolean;
    /** @type {import('./UA3FPlaybackVos.js').UA3FFrameCacheOptionsVo} */
    _cacheOptionsVo: UA3FFrameCacheOptionsVo;
    /**
     * 원본 시간 단위 또는 미확정 null, 기본 null 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string | null} value 원본 시간 단위 또는 미확정 null, 기본 null
     */
    set sourceTimeUnit(value: string | null);
    /**
     * 원본 시간 단위 또는 미확정 null, 기본 null 값을 반환합니다.
     *
     * @returns {string | null} 원본 시간 단위 또는 미확정 null, 기본 null
     */
    get sourceTimeUnit(): string | null;
    /**
     * 실제 경과 1초마다 진행할 원본 수치 시간량, 양의 유한값, 기본1 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 실제 경과 1초마다 진행할 원본 수치 시간량, 양의 유한값, 기본1
     */
    set sourceUnitsPerSecond(value: number);
    /**
     * 실제 경과 1초마다 진행할 원본 수치 시간량, 양의 유한값, 기본1 값을 반환합니다.
     *
     * @returns {number} 실제 경과 1초마다 진행할 원본 수치 시간량, 양의 유한값, 기본1
     */
    get sourceUnitsPerSecond(): number;
    /**
     * 0 아닌 유한 배속, 양수 정방향·음수 역방향, 기본1 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 0 아닌 유한 배속, 양수 정방향·음수 역방향, 기본1
     */
    set playbackRate(value: number);
    /**
     * 0 아닌 유한 배속, 양수 정방향·음수 역방향, 기본1 값을 반환합니다.
     *
     * @returns {number} 0 아닌 유한 배속, 양수 정방향·음수 역방향, 기본1
     */
    get playbackRate(): number;
    /**
     * 시간 범위 끝에서 반복할지 여부, 기본false 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {boolean} value 시간 범위 끝에서 반복할지 여부, 기본false
     */
    set loop(value: boolean);
    /**
     * 시간 범위 끝에서 반복할지 여부, 기본false 값을 반환합니다.
     *
     * @returns {boolean} 시간 범위 끝에서 반복할지 여부, 기본false
     */
    get loop(): boolean;
    /**
     * 기존109의 로딩 정책, 기본 streaming/3/2/null/true 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {import('./UA3FPlaybackVos.js').UA3FFrameCacheOptionsVo} value 기존109의 로딩 정책, 기본 streaming/3/2/null/true
     */
    set cacheOptionsVo(value: UA3FFrameCacheOptionsVo);
    /**
     * 기존109의 로딩 정책, 기본 streaming/3/2/null/true 값을 반환합니다.
     *
     * @returns {import('./UA3FPlaybackVos.js').UA3FFrameCacheOptionsVo} 기존109의 로딩 정책, 기본 streaming/3/2/null/true
     */
    get cacheOptionsVo(): UA3FFrameCacheOptionsVo;
}
/**
 * 시간축 표시와 외부 구독에 전달할 재생 상태 사본을 보관합니다.
 *
 * @group A3F
 * @summary 시간축 표시와 외부 구독에 전달할 재생 상태 사본을 보관합니다.
 */
declare class UA3FTimelineStateVo {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FTimelineStateVo 클래스 생성자입니다. <br>
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FTimelineStateVoCO} opt 모든 키가 필수이며 null 불가, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FTimelineStateVoCO);
    /** @type {UA3FTimelineStatus} */
    _status: UA3FTimelineStatus;
    /** @type {number | null} */
    _requestedTime: number | null;
    /** @type {number | null} */
    _displayedTime: number | null;
    /** @type {number | null} */
    _requestedFrameIndex: number | null;
    /** @type {number | null} */
    _displayedFrameIndex: number | null;
    /** @type {number} */
    _frameCount: number;
    /** @type {boolean} */
    _playing: boolean;
    /** @type {number} */
    _requestId: number;
    /** @type {import('./UA3FPlaybackVos.js').UA3FTimelineOptionsVo} */
    _optionsVo: UA3FTimelineOptionsVo;
    /** @type {import('./UA3FPlaybackVos.js').UA3FFrameCacheStatusVo | null} */
    _cacheStatusVo: UA3FFrameCacheStatusVo | null;
    /** @type {Error | null} */
    _error: Error | null;
    /**
     * idle/paused/playing/buffering/configuring/error/ended/disposed의 주요 상태 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {UA3FTimelineStatus} value idle/paused/playing/buffering/configuring/error/ended/disposed의 주요 상태
     */
    set status(value: UA3FTimelineStatus);
    /**
     * idle/paused/playing/buffering/configuring/error/ended/disposed의 주요 상태 값을 반환합니다.
     *
     * @returns {UA3FTimelineStatus} idle/paused/playing/buffering/configuring/error/ended/disposed의 주요 상태
     */
    get status(): UA3FTimelineStatus;
    /**
     * 현재 목표 원본 시각, 미선택 null 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number | null} value 현재 목표 원본 시각, 미선택 null
     */
    set requestedTime(value: number | null);
    /**
     * 현재 목표 원본 시각, 미선택 null 값을 반환합니다.
     *
     * @returns {number | null} 현재 목표 원본 시각, 미선택 null
     */
    get requestedTime(): number | null;
    /**
     * 실제 적용한 유효 프레임 원본 시각, 표시 전 null 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number | null} value 실제 적용한 유효 프레임 원본 시각, 표시 전 null
     */
    set displayedTime(value: number | null);
    /**
     * 실제 적용한 유효 프레임 원본 시각, 표시 전 null 값을 반환합니다.
     *
     * @returns {number | null} 실제 적용한 유효 프레임 원본 시각, 표시 전 null
     */
    get displayedTime(): number | null;
    /**
     * 요청한 등록 frameIndex, 미선택 null, 목록 위치와 구분 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number | null} value 요청한 등록 frameIndex, 미선택 null, 목록 위치와 구분
     */
    set requestedFrameIndex(value: number | null);
    /**
     * 요청한 등록 frameIndex, 미선택 null, 목록 위치와 구분 값을 반환합니다.
     *
     * @returns {number | null} 요청한 등록 frameIndex, 미선택 null, 목록 위치와 구분
     */
    get requestedFrameIndex(): number | null;
    /**
     * 실제 적용한 유효 frameIndex, 표시 전 null 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number | null} value 실제 적용한 유효 frameIndex, 표시 전 null
     */
    set displayedFrameIndex(value: number | null);
    /**
     * 실제 적용한 유효 frameIndex, 표시 전 null 값을 반환합니다.
     *
     * @returns {number | null} 실제 적용한 유효 frameIndex, 표시 전 null
     */
    get displayedFrameIndex(): number | null;
    /**
     * 등록 프레임 수, 양의 안전 정수 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 등록 프레임 수, 양의 안전 정수
     */
    set frameCount(value: number);
    /**
     * 등록 프레임 수, 양의 안전 정수 값을 반환합니다.
     *
     * @returns {number} 등록 프레임 수, 양의 안전 정수
     */
    get frameCount(): number;
    /**
     * 사용자의 재생 의도, 로딩 중에는 true여도 시계 정지 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {boolean} value 사용자의 재생 의도, 로딩 중에는 true여도 시계 정지
     */
    set playing(value: boolean);
    /**
     * 사용자의 재생 의도, 로딩 중에는 true여도 시계 정지 값을 반환합니다.
     *
     * @returns {boolean} 사용자의 재생 의도, 로딩 중에는 true여도 시계 정지
     */
    get playing(): boolean;
    /**
     * 최신 요청 순번, 선택 전0 이후 양의 안전 정수 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 최신 요청 순번, 선택 전0 이후 양의 안전 정수
     */
    set requestId(value: number);
    /**
     * 최신 요청 순번, 선택 전0 이후 양의 안전 정수 값을 반환합니다.
     *
     * @returns {number} 최신 요청 순번, 선택 전0 이후 양의 안전 정수
     */
    get requestId(): number;
    /**
     * 적용한 재생 정책의 독립 작은 사본 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {import('./UA3FPlaybackVos.js').UA3FTimelineOptionsVo} value 적용한 재생 정책의 독립 작은 사본
     */
    set optionsVo(value: UA3FTimelineOptionsVo);
    /**
     * 적용한 재생 정책의 독립 작은 사본 값을 반환합니다.
     *
     * @returns {import('./UA3FPlaybackVos.js').UA3FTimelineOptionsVo} 적용한 재생 정책의 독립 작은 사본
     */
    get optionsVo(): UA3FTimelineOptionsVo;
    /**
     * 현재 캐시 준비·예약 순간 사본, 미초기화 null 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {import('./UA3FPlaybackVos.js').UA3FFrameCacheStatusVo | null} value 현재 캐시 준비·예약 순간 사본, 미초기화 null
     */
    set cacheStatusVo(value: UA3FFrameCacheStatusVo | null);
    /**
     * 현재 캐시 준비·예약 순간 사본, 미초기화 null 값을 반환합니다.
     *
     * @returns {import('./UA3FPlaybackVos.js').UA3FFrameCacheStatusVo | null} 현재 캐시 준비·예약 순간 사본, 미초기화 null
     */
    get cacheStatusVo(): UA3FFrameCacheStatusVo | null;
    /**
     * 현재 실패 원래 원인 참조 또는 null 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {Error | null} value 현재 실패 원래 원인 참조 또는 null
     */
    set error(value: Error | null);
    /**
     * 현재 실패 원래 원인 참조 또는 null 값을 반환합니다.
     *
     * @returns {Error | null} 현재 실패 원래 원인 참조 또는 null
     */
    get error(): Error | null;
}
/**
 * 방향 화살표와 공통 표시/파생 자원 예산 설정.
 *
 * @group A3F
 */
declare class UA3FFlowOptionsVo {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FFlowOptionsVo 클래스 생성자입니다. <br>
     * 정본 키를 정규화하고 각 기본값을 적용합니다.
     *
     * @param {UA3FFlowOptionsVoCO} [opt] 선택 보관값, null 불가. <br>
     * 객체는 변경하지 않으며 배열은 참조로 보관
     */
    constructor(opt?: UA3FFlowOptionsVoCO);
    /**
     * @type {'off' | 'arrows' | 'flow'}
     */
    _mode: "off" | "arrows" | "flow";
    /**
     * @type {number}
     */
    _spacingPixels: number;
    /**
     * @type {number}
     */
    _maxArrowCount: number;
    /**
     * @type {number}
     */
    _arrowLengthPixels: number;
    /**
     * @type {number}
     */
    _arrowWidthPixels: number;
    /**
     * @type {number}
     */
    _minSpeedMps: number;
    /**
     * @type {number}
     */
    _maskThreshold: number;
    /**
     * @type {string}
     */
    _color: string;
    /**
     * @type {number}
     */
    _opacity: number;
    /**
     * @type {[number,number] | null}
     */
    _speedColorRange: [number, number] | null;
    /**
     * @type {number}
     */
    _maxDerivedBytes: number;
    /**
     * 전달한 설정값만 보관하며 실행 상태는 변경하지 않습니다.
     *
     * @param {'off' | 'arrows' | 'flow'} value off·arrows·flow 중 표시 모드 기본값 "off". <br>
     * 실행·검증 없이 보관, 자원 이전 없음
     */
    set mode(value: "off" | "arrows" | "flow");
    /**
     * off·arrows·flow 중 표시 모드
     *
     * @returns {'off' | 'arrows' | 'flow'} off·arrows·flow 중 표시 모드 기본값 "off".
     */
    get mode(): "off" | "arrows" | "flow";
    /**
     * 전달한 설정값만 보관하며 실행 상태는 변경하지 않습니다.
     *
     * @param {number} value CSS px 기준 화살표 목표 간격, 허용 범위 16..512 기본값 80. <br>
     * 실행·검증 없이 보관, 자원 이전 없음
     */
    set spacingPixels(value: number);
    /**
     * CSS px 기준 화살표 목표 간격, 허용 범위 16..512
     *
     * @returns {number} CSS px 기준 화살표 목표 간격, 허용 범위 16..512 기본값 80.
     */
    get spacingPixels(): number;
    /**
     * 전달한 설정값만 보관하며 실행 상태는 변경하지 않습니다.
     *
     * @param {number} value 전체 표시 데이터셋 기준 상한. <br>
     * 노드마다 2000개씩 무제한 배정하지 않음 기본값 2000. <br>
     * 실행·검증 없이 보관, 자원 이전 없음
     */
    set maxArrowCount(value: number);
    /**
     * 전체 표시 데이터셋 기준 상한. <br>
     * 노드마다 2000개씩 무제한 배정하지 않음
     *
     * @returns {number} 전체 표시 데이터셋 기준 상한. <br>
     * 노드마다 2000개씩 무제한 배정하지 않음 기본값 2000.
     */
    get maxArrowCount(): number;
    /**
     * 전달한 설정값만 보관하며 실행 상태는 변경하지 않습니다.
     *
     * @param {number} value CSS px, 허용 범위 4..128 기본값 24. <br>
     * 실행·검증 없이 보관, 자원 이전 없음
     */
    set arrowLengthPixels(value: number);
    /**
     * CSS px, 허용 범위 4..128
     *
     * @returns {number} CSS px, 허용 범위 4..128 기본값 24.
     */
    get arrowLengthPixels(): number;
    /**
     * 전달한 설정값만 보관하며 실행 상태는 변경하지 않습니다.
     *
     * @param {number} value CSS px, 허용 범위 1..16 기본값 2. <br>
     * 실행·검증 없이 보관, 자원 이전 없음
     */
    set arrowWidthPixels(value: number);
    /**
     * CSS px, 허용 범위 1..16
     *
     * @returns {number} CSS px, 허용 범위 1..16 기본값 2.
     */
    get arrowWidthPixels(): number;
    /**
     * 전달한 설정값만 보관하며 실행 상태는 변경하지 않습니다.
     *
     * @param {number} value 물리 유속 m/s, 미만이면 방향 불안정/정체 화살표 숨김 기본값 0.01. <br>
     * 실행·검증 없이 보관, 자원 이전 없음
     */
    set minSpeedMps(value: number);
    /**
     * 물리 유속 m/s; 미만이면 방향 불안정/정체 화살표 숨김
     *
     * @returns {number} 물리 유속 m/s; 미만이면 방향 불안정/정체 화살표 숨김 기본값 0.01.
     */
    get minSpeedMps(): number;
    /**
     * 전달한 설정값만 보관하며 실행 상태는 변경하지 않습니다.
     *
     * @param {number} value maskFieldId 필드의 원래 단위, 홍수 h이면 m. <br>
     * 이하 값 숨김. <br>
     * 기존 표시 설정 마스크가 있으면 동일한 확정값을 공유 기본값 0.01. <br>
     * 실행·검증 없이 보관, 자원 이전 없음
     */
    set maskThreshold(value: number);
    /**
     * maskFieldId 필드의 원래 단위; 홍수 h이면 m. <br>
     * 이하 값 숨김. <br>
     * 기존 표시 설정 마스크가 있으면 동일한 확정값을 공유
     *
     * @returns {number} maskFieldId 필드의 원래 단위; 홍수 h이면 m. <br>
     * 이하 값 숨김. <br>
     * 기존 표시 설정 마스크가 있으면 동일한 확정값을 공유 기본값 0.01.
     */
    get maskThreshold(): number;
    /**
     * 전달한 설정값만 보관하며 실행 상태는 변경하지 않습니다.
     *
     * @param {string} value 고정 색상 모드의 CSS 색상 기본값 "#ffffff". <br>
     * 실행·검증 없이 보관, 자원 이전 없음
     */
    set color(value: string);
    /**
     * 고정 색상 모드의 CSS 색상
     *
     * @returns {string} 고정 색상 모드의 CSS 색상 기본값 "#ffffff".
     */
    get color(): string;
    /**
     * 전달한 설정값만 보관하며 실행 상태는 변경하지 않습니다.
     *
     * @param {number} value 0..1 기본값 0.9. <br>
     * 실행·검증 없이 보관, 자원 이전 없음
     */
    set opacity(value: number);
    /**
     * 0..1
     *
     * @returns {number} 0..1 기본값 0.9.
     */
    get opacity(): number;
    /**
     * 전달한 설정값만 보관하며 실행 상태는 변경하지 않습니다.
     *
     * @param {[ number, number ] | null} value m/s 고정 전체 범례. <br>
     * null이면 검증된 전체 통계 사용, 프레임마다 자동 범위 변경하지 않음 기본값 null. <br>
     * 실행·검증 없이 보관, 자원 이전 없음
     */
    set speedColorRange(value: [number, number] | null);
    /**
     * m/s 고정 전체 범례. <br>
     * null이면 검증된 전체 통계 사용, 프레임마다 자동 범위 변경하지 않음
     *
     * @returns {[ number, number ] | null} m/s 고정 전체 범례. <br>
     * null이면 검증된 전체 통계 사용, 프레임마다 자동 범위 변경하지 않음 기본값 null.
     */
    get speedColorRange(): [number, number] | null;
    /**
     * 전달한 설정값만 보관하며 실행 상태는 변경하지 않습니다.
     *
     * @param {number} value 전체 세션의 계산 가능한 파생 CPU/GPU payload 합산 상한 기본 32MiB. <br>
     * 실제 driver overhead/프로세스 RAM 상한을 뜻하지 않음. <br>
     * 노드별 단순 중복 배정 금지 기본값 33554432. <br>
     * 실행·검증 없이 보관, 자원 이전 없음
     */
    set maxDerivedBytes(value: number);
    /**
     * 전체 세션의 계산 가능한 파생 CPU/GPU payload 합산 상한 기본 32MiB. <br>
     * 실제 driver overhead/프로세스 RAM 상한을 뜻하지 않음. <br>
     * 노드별 단순 중복 배정 금지
     *
     * @returns {number} 전체 세션의 계산 가능한 파생 CPU/GPU payload 합산 상한 기본 32MiB. <br>
     * 실제 driver overhead/프로세스 RAM 상한을 뜻하지 않음. <br>
     * 노드별 단순 중복 배정 금지 기본값 33554432.
     */
    get maxDerivedBytes(): number;
}
/**
 * 현재 프레임 유속장의 입자·꼬리 표시 옵션을 보관합니다.
 *
 * @group A3F
 */
declare class UA3FParticleFlowOptionsVo {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FParticleFlowOptionsVo 클래스 생성자입니다. <br>
     * 입력 옵션의 정의된 값 또는 기본값을 보관합니다.
     *
     * @param {UA3FParticleFlowOptionsVoCO} [opt] 생성 설정, 생략 시 기본값. <br>
     * 배열은 사본으로 보관하며 자원 소유권 없음
     */
    constructor(opt?: UA3FParticleFlowOptionsVoCO);
    /** @type {number} */
    _particleCount: number;
    /** @type {number} */
    _fieldCellSizeMeters: number;
    /** @type {[number, number]} */
    _maxFieldTextureSize: [number, number];
    /** @type {number} */
    _visualSpeedScale: number;
    /** @type {number} */
    _lifeSeconds: number;
    /** @type {number} */
    _trailSamples: number;
    /** @type {number} */
    _maxSubsteps: number;
    /** @type {boolean} */
    _animateWhenPaused: boolean;
    /** @type {number} */
    _seed: number;
    /**
     * particleCount 옵션을 보관합니다.
     *
     * @param {number} value 전체 가시 노드에 배분하는 입자 합산 상한. <br>
     * 안전 정수 256..16384. <br>
     * 임의 하향 시 실제 적용 개수 표시 실행·자원 처리 없이 보관
     */
    set particleCount(value: number);
    /**
     * particleCount 보관값을 반환합니다.
     *
     * @returns {number} 전체 가시 노드에 배분하는 입자 합산 상한. <br>
     * 안전 정수 256..16384. <br>
     * 임의 하향 시 실제 적용 개수 표시 기본값 4096
     */
    get particleCount(): number;
    /**
     * fieldCellSizeMeters 옵션을 보관합니다.
     *
     * @param {number} value 목표 물리 격자 간격 m. <br>
     * 유한한 양수. <br>
     * 실제 texture 상한·위도·예산으로 해상도가 달라지며 적용 간격 표시 실행·자원 처리 없이 보관
     */
    set fieldCellSizeMeters(value: number);
    /**
     * fieldCellSizeMeters 보관값을 반환합니다.
     *
     * @returns {number} 목표 물리 격자 간격 m. <br>
     * 유한한 양수. <br>
     * 실제 texture 상한·위도·예산으로 해상도가 달라지며 적용 간격 표시 기본값 10
     */
    get fieldCellSizeMeters(): number;
    /**
     * maxFieldTextureSize 옵션을 보관합니다.
     *
     * @param {[ number, number ]} value 노드별 필드 texture 폭/높이 texel 상한. <br>
     * 각각 안전 정수 16..2048 및 실제 GPU 한도. <br>
     * 전체32MiB 파생 예산과 함께 사전 검증 실행·자원 처리 없이 보관
     */
    set maxFieldTextureSize(value: [number, number]);
    /**
     * maxFieldTextureSize 보관값을 반환합니다.
     *
     * @returns {[ number, number ]} 노드별 필드 texture 폭/높이 texel 상한. <br>
     * 각각 안전 정수 16..2048 및 실제 GPU 한도. <br>
     * 전체32MiB 파생 예산과 함께 사전 검증 기본값 [512,512]
     */
    get maxFieldTextureSize(): [number, number];
    /**
     * visualSpeedScale 옵션을 보관합니다.
     *
     * @param {number} value 표시 이동 배율. <br>
     * 유한한 양수 0.1..1000. <br>
     * 원본 m/s와 별도로 UI에 표시. <br>
     * 타임라인 원본 시간 단위로 해석하지 않음 실행·자원 처리 없이 보관
     */
    set visualSpeedScale(value: number);
    /**
     * visualSpeedScale 보관값을 반환합니다.
     *
     * @returns {number} 표시 이동 배율. <br>
     * 유한한 양수 0.1..1000. <br>
     * 원본 m/s와 별도로 UI에 표시. <br>
     * 타임라인 원본 시간 단위로 해석하지 않음 기본값 100
     */
    get visualSpeedScale(): number;
    /**
     * lifeSeconds 옵션을 보관합니다.
     *
     * @param {number} value 표시 애니메이션 초 기준 수명. <br>
     * 유한한 양수 0.1..30. <br>
     * 종료 시 유효한 젖은 위치로 재배치 실행·자원 처리 없이 보관
     */
    set lifeSeconds(value: number);
    /**
     * lifeSeconds 보관값을 반환합니다.
     *
     * @returns {number} 표시 애니메이션 초 기준 수명. <br>
     * 유한한 양수 0.1..30. <br>
     * 종료 시 유효한 젖은 위치로 재배치 기본값 4
     */
    get lifeSeconds(): number;
    /**
     * trailSamples 옵션을 보관합니다.
     *
     * @param {number} value 입자당 이력 수. <br>
     * 안전 정수 2..32. <br>
     * 수명 구간에 일정 간격으로 기록하여 단순 8렌더프레임보다 길이가 안정적이게 함 실행·자원 처리 없이 보관
     */
    set trailSamples(value: number);
    /**
     * trailSamples 보관값을 반환합니다.
     *
     * @returns {number} 입자당 이력 수. <br>
     * 안전 정수 2..32. <br>
     * 수명 구간에 일정 간격으로 기록하여 단순 8렌더프레임보다 길이가 안정적이게 함 기본값 8
     */
    get trailSamples(): number;
    /**
     * maxSubsteps 옵션을 보관합니다.
     *
     * @param {number} value 표시 한 프레임의 적분 분할 상한. <br>
     * 안전 정수 1..32. <br>
     * CFL 이동 상한을 지키고 초과 시간은 누적 폭주 없이 제한 상태로 표시 실행·자원 처리 없이 보관
     */
    set maxSubsteps(value: number);
    /**
     * maxSubsteps 보관값을 반환합니다.
     *
     * @returns {number} 표시 한 프레임의 적분 분할 상한. <br>
     * 안전 정수 1..32. <br>
     * CFL 이동 상한을 지키고 초과 시간은 누적 폭주 없이 제한 상태로 표시 기본값 8
     */
    get maxSubsteps(): number;
    /**
     * animateWhenPaused 옵션을 보관합니다.
     *
     * @param {boolean} value 타임라인을 멈춰도 현재 프레임의 고정 유속장을 미리보기. <br>
     * 기본값은 true. <br>
     * 별도 흐름 일시정지 가능 실행·자원 처리 없이 보관
     */
    set animateWhenPaused(value: boolean);
    /**
     * animateWhenPaused 보관값을 반환합니다.
     *
     * @returns {boolean} 타임라인을 멈춰도 현재 프레임의 고정 유속장을 미리보기. <br>
     * 기본값은 true. <br>
     * 별도 흐름 일시정지 가능 기본값 true
     */
    get animateWhenPaused(): boolean;
    /**
     * seed 옵션을 보관합니다.
     *
     * @param {number} value 0..4294967295 안전 정수 난수 seed. <br>
     * 같은 frameToken·설정으로 초기 배치 재현 실행·자원 처리 없이 보관
     */
    set seed(value: number);
    /**
     * seed 보관값을 반환합니다.
     *
     * @returns {number} 0..4294967295 안전 정수 난수 seed. <br>
     * 같은 frameToken·설정으로 초기 배치 재현 기본값 1
     */
    get seed(): number;
}
/**
 * 동적 필드와 벡터의 물리 의미를 선언하는 데이터 VO.
 *
 * @group A3F
 */
declare class UA3FVectorFieldVo {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FVectorFieldVo 클래스 생성자입니다. <br>
     * 전달값을 사본 옵션에서 읽어 보관 필드를 초기화합니다.
     *
     * @param {UA3FVectorFieldVoCO} [opt={}] 선택 보관값, null 불가. <br>
     * 객체는 변경하지 않으며 배열은 참조로 보관, null 불가. <br>
     * 배열 소유권은 이전하지 않음
     */
    constructor(opt?: UA3FVectorFieldVoCO);
    /**
     * @type {string | null}
     */
    _vectorId: string | null;
    /**
     * @type {string}
     */
    _label: string;
    /**
     * @type {string | null}
     */
    _uFieldId: string | null;
    /**
     * @type {number}
     */
    _uComponent: number;
    /**
     * @type {string | null}
     */
    _vFieldId: string | null;
    /**
     * @type {number}
     */
    _vComponent: number;
    /**
     * @type {string | null}
     */
    _speedFieldId: string | null;
    /**
     * @type {number}
     */
    _speedComponent: number;
    /**
     * @type {string | null}
     */
    _maskFieldId: string | null;
    /**
     * @type {number}
     */
    _maskComponent: number;
    /**
     * @type {'source-grid' | 'east-north' | 'world' | null}
     */
    _basisType: "source-grid" | "east-north" | "world" | null;
    /**
     * @type {string | null}
     */
    _basisCrs: string | null;
    /**
     * @type {'physical' | 'coordinate-rate' | null}
     */
    _componentSemantics: "physical" | "coordinate-rate" | null;
    /**
     * @type {'m/s' | 'world-unit/s' | null}
     */
    _velocityUnit: "m/s" | "world-unit/s" | null;
    /**
     * @type {number | null}
     */
    _noDataValue: number | null;
    /**
     * vectorId 보관값을 변경합니다.
     *
     * @param {string | null} value 데이터셋 안에서 고유한 비어 있지 않은 ID; prepare 전에 필수 기본값 null. <br>
     * 실행·검증 없이 보관, 자원 이전 없음, prepare 전에 필수 기본값 null. <br>
     * 값 검증은 실행 모듈 책임이며 자원 이전 없음
     */
    set vectorId(value: string | null);
    /**
     * vectorId 설정값을 반환합니다.
     *
     * @returns {string | null} 데이터셋 안에서 고유한 비어 있지 않은 ID; prepare 전에 필수 기본값 null.
     */
    get vectorId(): string | null;
    /**
     * label 보관값을 변경합니다.
     *
     * @param {string} value UI 표시 이름 기본값 "". <br>
     * 실행·검증 없이 보관, 자원 이전 없음
     */
    set label(value: string);
    /**
     * label 설정값을 반환합니다.
     *
     * @returns {string} UI 표시 이름 기본값 "".
     */
    get label(): string;
    /**
     * uFieldId 보관값을 변경합니다.
     *
     * @param {string | null} value 첫 번째 성분의 메타 필드 ID; 실행 코드에 u를 고정하지 않음 기본값 null. <br>
     * 실행·검증 없이 보관, 자원 이전 없음, 실행 코드에 u를 고정하지 않음 기본값 null. <br>
     * 값 검증은 실행 모듈 책임이며 자원 이전 없음
     */
    set uFieldId(value: string | null);
    /**
     * uFieldId 설정값을 반환합니다.
     *
     * @returns {string | null} 첫 번째 성분의 메타 필드 ID; 실행 코드에 u를 고정하지 않음 기본값 null.
     */
    get uFieldId(): string | null;
    /**
     * uComponent 보관값을 변경합니다.
     *
     * @param {number} value 0 기반 성분 인덱스; 실제 itemSize 미만 기본값 0. <br>
     * 실행·검증 없이 보관, 자원 이전 없음, 실제 itemSize 미만 기본값 0. <br>
     * 값 검증은 실행 모듈 책임이며 자원 이전 없음
     */
    set uComponent(value: number);
    /**
     * uComponent 설정값을 반환합니다.
     *
     * @returns {number} 0 기반 성분 인덱스; 실제 itemSize 미만 기본값 0.
     */
    get uComponent(): number;
    /**
     * vFieldId 보관값을 변경합니다.
     *
     * @param {string | null} value 두 번째 성분의 메타 필드 ID 기본값 null. <br>
     * 실행·검증 없이 보관, 자원 이전 없음, 두 번째 성분의 메타 필드 ID 기본값 null. <br>
     * 값 검증은 실행 모듈 책임이며 자원 이전 없음
     */
    set vFieldId(value: string | null);
    /**
     * vFieldId 설정값을 반환합니다.
     *
     * @returns {string | null} 두 번째 성분의 메타 필드 ID 기본값 null.
     */
    get vFieldId(): string | null;
    /**
     * vComponent 보관값을 변경합니다.
     *
     * @param {number} value 0 기반 성분 인덱스 기본값 0. <br>
     * 실행·검증 없이 보관, 자원 이전 없음, 0 기반 성분 인덱스 기본값 0. <br>
     * 값 검증은 실행 모듈 책임이며 자원 이전 없음
     */
    set vComponent(value: number);
    /**
     * vComponent 설정값을 반환합니다.
     *
     * @returns {number} 0 기반 성분 인덱스 기본값 0.
     */
    get vComponent(): number;
    /**
     * speedFieldId 보관값을 변경합니다.
     *
     * @param {string | null} value 유속 크기 필드. <br>
     * 없으면 physical 성분에서 hypot으로 산출; world 좌표율에서 물리 속력을 직접 추정하지 않음 기본값 null. <br>
     * 실행·검증 없이 보관, 자원 이전 없음, world 좌표율에서 물리 속력을 직접 추정하지 않음 기본값 null. <br>
     * 값 검증은 실행 모듈 책임이며 자원 이전 없음
     */
    set speedFieldId(value: string | null);
    /**
     * speedFieldId 설정값을 반환합니다.
     *
     * @returns {string | null} 유속 크기 필드. <br>
     * 없으면 physical 성분에서 hypot으로 산출; world 좌표율에서 물리 속력을 직접 추정하지 않음 기본값 null.
     */
    get speedFieldId(): string | null;
    /**
     * speedComponent 보관값을 변경합니다.
     *
     * @param {number} value 0 기반 속력 성분 인덱스 기본값 0. <br>
     * 실행·검증 없이 보관, 자원 이전 없음, 0 기반 속력 성분 인덱스 기본값 0. <br>
     * 값 검증은 실행 모듈 책임이며 자원 이전 없음
     */
    set speedComponent(value: number);
    /**
     * speedComponent 설정값을 반환합니다.
     *
     * @returns {number} 0 기반 속력 성분 인덱스 기본값 0.
     */
    get speedComponent(): number;
    /**
     * maskFieldId 보관값을 변경합니다.
     *
     * @param {string | null} value 보일 영역을 결정하는 정점 scalar. <br>
     * 홍수 샘플은 h, 바람 등에는 null 가능 기본값 null. <br>
     * 실행·검증 없이 보관, 자원 이전 없음, 바람 등에는 null 가능 기본값 null. <br>
     * 값 검증은 실행 모듈 책임이며 자원 이전 없음
     */
    set maskFieldId(value: string | null);
    /**
     * maskFieldId 설정값을 반환합니다.
     *
     * @returns {string | null} 보일 영역을 결정하는 정점 scalar. <br>
     * 홍수 샘플은 h, 바람 등에는 null 가능 기본값 null.
     */
    get maskFieldId(): string | null;
    /**
     * maskComponent 보관값을 변경합니다.
     *
     * @param {number} value 0 기반 마스크 성분 인덱스 기본값 0. <br>
     * 실행·검증 없이 보관, 자원 이전 없음, 0 기반 마스크 성분 인덱스 기본값 0. <br>
     * 값 검증은 실행 모듈 책임이며 자원 이전 없음
     */
    set maskComponent(value: number);
    /**
     * maskComponent 설정값을 반환합니다.
     *
     * @returns {number} 0 기반 마스크 성분 인덱스 기본값 0.
     */
    get maskComponent(): number;
    /**
     * basisType 보관값을 변경합니다.
     *
     * @param {'source-grid' | 'east-north' | 'world' | null} value 성분 방향 기준. <br>
     * null이면 임의 추정하지 않고 방향 표시 준비를 거부 기본값 null. <br>
     * 실행·검증 없이 보관, 자원 이전 없음, 성분 방향 기준. <br>
     * null이면 임의 추정하지 않고 방향 표시 준비를 거부 기본값 null. <br>
     * 값 검증은 실행 모듈 책임이며 자원 이전 없음
     */
    set basisType(value: "source-grid" | "east-north" | "world" | null);
    /**
     * basisType 설정값을 반환합니다.
     *
     * @returns {'source-grid' | 'east-north' | 'world' | null} 성분 방향 기준. <br>
     * null이면 임의 추정하지 않고 방향 표시 준비를 거부 기본값 null.
     */
    get basisType(): "source-grid" | "east-north" | "world" | null;
    /**
     * basisCrs 보관값을 변경합니다.
     *
     * @param {string | null} value source-grid일 때 성분이 정의된 투영 CRS. <br>
     * 지원하는 기준축·단위 조합은 실행 모듈이 검증 기본값 null. <br>
     * 실행·검증 없이 보관, 자원 이전 없음, source-grid일 때 성분이 정의된 투영 CRS. <br>
     * 지원하는 기준축·단위 조합은 실행 모듈이 검증 기본값 null. <br>
     * 값 검증은 실행 모듈 책임이며 자원 이전 없음
     */
    set basisCrs(value: string | null);
    /**
     * basisCrs 설정값을 반환합니다.
     *
     * @returns {string | null} source-grid일 때 성분이 정의된 투영 CRS. <br>
     * 지원하는 기준축·단위 조합은 실행 모듈이 검증 기본값 null.
     */
    get basisCrs(): string | null;
    /**
     * componentSemantics 보관값을 변경합니다.
     *
     * @param {'physical' | 'coordinate-rate' | null} value physical은 실제 거리/초 성분, coordinate-rate는 CRS 좌표값 변화율. <br>
     * 원본 의미 확인 후 필수 기본값 null. <br>
     * 실행·검증 없이 보관, 자원 이전 없음, coordinate-rate는 CRS 좌표값 변화율. <br>
     * 원본 의미 확인 후 필수 기본값 null. <br>
     * 값 검증은 실행 모듈 책임이며 자원 이전 없음
     */
    set componentSemantics(value: "physical" | "coordinate-rate" | null);
    /**
     * componentSemantics 설정값을 반환합니다.
     *
     * @returns {'physical' | 'coordinate-rate' | null} physical은 실제 거리/초 성분, coordinate-rate는 CRS 좌표값 변화율. <br>
     * 원본 의미 확인 후 필수 기본값 null.
     */
    get componentSemantics(): "physical" | "coordinate-rate" | null;
    /**
     * velocityUnit 보관값을 변경합니다.
     *
     * @param {'m/s' | 'world-unit/s' | null} value 실제 물리 단위와 좌표율을 구분. <br>
     * 현재 sample 필드는 m/s 기본값 null. <br>
     * 실행·검증 없이 보관, 자원 이전 없음, 실제 물리 단위와 좌표율을 구분. <br>
     * 현재 sample 필드는 m/s 기본값 null. <br>
     * 값 검증은 실행 모듈 책임이며 자원 이전 없음
     */
    set velocityUnit(value: "m/s" | "world-unit/s" | null);
    /**
     * velocityUnit 설정값을 반환합니다.
     *
     * @returns {'m/s' | 'world-unit/s' | null} 실제 물리 단위와 좌표율을 구분. <br>
     * 현재 sample 필드는 m/s 기본값 null.
     */
    get velocityUnit(): "m/s" | "world-unit/s" | null;
    /**
     * noDataValue 보관값을 변경합니다.
     *
     * @param {number | null} value null은 별도 sentinel 없음. <br>
     * NaN/Infinity와 지정 nodata는 표시·적분에서 제외 기본값 null. <br>
     * 실행·검증 없이 보관, 자원 이전 없음, null은 별도 sentinel 없음. <br>
     * NaN/Infinity와 지정 nodata는 표시·적분에서 제외 기본값 null. <br>
     * 값 검증은 실행 모듈 책임이며 자원 이전 없음
     */
    set noDataValue(value: number | null);
    /**
     * noDataValue 설정값을 반환합니다.
     *
     * @returns {number | null} null은 별도 sentinel 없음. <br>
     * NaN/Infinity와 지정 nodata는 표시·적분에서 제외 기본값 null.
     */
    get noDataValue(): number | null;
}

/**
 * 바이너리 파일의 식별자와 공용 배치 연결을 보관합니다.
 *
 * @group A3F
 * @summary 실제 파일과 공용 배치 연결
 */
declare class UA3FBufferVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FBufferVo 클래스 생성자입니다. <br>
     * 옵션 키를 정규화하고 필수 키의 존재를 확인한 뒤 값을 보관합니다.
     *
     * @param {UA3FBufferVoCO} opt 모든 필수 키를 가진 옵션이며 null·생략 불가, 원본 옵션을 변경하지 않음
     */
    constructor(opt: UA3FBufferVoCO);
    /** @type {string} */
    _bufferId: string;
    /** @type {string} */
    _uri: string;
    /** @type {number} */
    _byteLength: number;
    /** @type {string} */
    _sha256: string;
    /** @type {string} */
    _layoutId: string;
    /**
     * 바이너리 파일 식별자를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 작업 문맥과 연결할 바이너리 식별자이며 호출자가 검증한 값
     */
    set bufferId(value: string);
    /**
     * 바이너리 파일 식별자를 반환합니다.
     *
     * @returns {string} 작업 문맥과 연결할 바이너리 식별자
     */
    get bufferId(): string;
    /**
     * 파일 URI을 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 메타정보 URL을 기준으로 해석할 파일 URI이며 호출자가 검증한 값
     */
    set uri(value: string);
    /**
     * 파일 URI을 반환합니다.
     *
     * @returns {string} 메타정보 URL을 기준으로 해석할 파일 URI
     */
    get uri(): string;
    /**
     * 파일 바이트 길이를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number} value 파일 전체의 바이트 수이며 호출자가 검증한 값
     */
    set byteLength(value: number);
    /**
     * 파일 바이트 길이를 반환합니다.
     *
     * @returns {number} 파일 전체의 바이트 수
     */
    get byteLength(): number;
    /**
     * 파일 해시를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value SHA-256을 나타내는 64자리 소문자 16진수 문자열이며 호출자가 검증한 값
     */
    set sha256(value: string);
    /**
     * 파일 해시를 반환합니다.
     *
     * @returns {string} SHA-256을 나타내는 64자리 소문자 16진수 문자열
     */
    get sha256(): string;
    /**
     * 공용 배치 식별자를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 파일의 배열 배치를 정의한 layoutId이며 호출자가 검증한 값
     */
    set layoutId(value: string);
    /**
     * 공용 배치 식별자를 반환합니다.
     *
     * @returns {string} 파일의 배열 배치를 정의한 layoutId
     */
    get layoutId(): string;
}
/**
 * 한 필드 배열의 바이너리 배치를 보관합니다.
 *
 * @group A3F
 * @summary 한 배열의 바이너리 배치 보관
 */
declare class UA3FArrayLayoutVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FArrayLayoutVo 클래스 생성자입니다. <br>
     * 옵션 키를 정규화하고 필수 키의 존재를 확인한 뒤 값을 보관합니다.
     *
     * @param {UA3FArrayLayoutVoCO} opt 모든 필수 키를 가진 옵션이며 null·생략 불가, 원본 옵션을 변경하지 않음
     */
    constructor(opt: UA3FArrayLayoutVoCO);
    /** @type {string} */
    _fieldId: string;
    /** @type {('Float32' | 'Float64' | 'Uint16' | 'Uint32')} */
    _componentType: ("Float32" | "Float64" | "Uint16" | "Uint32");
    /** @type {('node' | 'index' | 'triangle')} */
    _association: ("node" | "index" | "triangle");
    /** @type {number} */
    _count: number;
    /** @type {number} */
    _width: number;
    /** @type {number} */
    _height: number;
    /** @type {(1 | 2 | 3 | 4)} */
    _itemSize: (1 | 2 | 3 | 4);
    /** @type {boolean} */
    _normalized: boolean;
    /** @type {number} */
    _byteOffset: number;
    /** @type {number} */
    _byteLength: number;
    /**
     * 배열의 필드 식별자를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 필드 정의와 연결할 식별자이며 호출자가 검증한 값
     */
    set fieldId(value: string);
    /**
     * 배열의 필드 식별자를 반환합니다.
     *
     * @returns {string} 필드 정의와 연결할 식별자
     */
    get fieldId(): string;
    /**
     * 바이너리 성분 타입을 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {('Float32' | 'Float64' | 'Uint16' | 'Uint32')} value Float32·Float64·Uint16·Uint32 중 성분 타입이며 호출자가 검증한 값
     */
    set componentType(value: ("Float32" | "Float64" | "Uint16" | "Uint32"));
    /**
     * 바이너리 성분 타입을 반환합니다.
     *
     * @returns {('Float32' | 'Float64' | 'Uint16' | 'Uint32')} Float32·Float64·Uint16·Uint32 중 성분 타입
     */
    get componentType(): ("Float32" | "Float64" | "Uint16" | "Uint32");
    /**
     * 값의 연결 대상을 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {('node' | 'index' | 'triangle')} value 정점은 node, 인덱스는 index, 삼각형은 triangle이며 호출자가 검증한 값
     */
    set association(value: ("node" | "index" | "triangle"));
    /**
     * 값의 연결 대상을 반환합니다.
     *
     * @returns {('node' | 'index' | 'triangle')} 정점은 node, 인덱스는 index, 삼각형은 triangle
     */
    get association(): ("node" | "index" | "triangle");
    /**
     * 배열 항목 수를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number} value 양의 안전 정수인 항목 개수이며 호출자가 검증한 값
     */
    set count(value: number);
    /**
     * 배열 항목 수를 반환합니다.
     *
     * @returns {number} 양의 안전 정수인 항목 개수
     */
    get count(): number;
    /**
     * 배열 너비를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number} value 양의 안전 정수인 가로 항목 수이며 호출자가 검증한 값
     */
    set width(value: number);
    /**
     * 배열 너비를 반환합니다.
     *
     * @returns {number} 양의 안전 정수인 가로 항목 수
     */
    get width(): number;
    /**
     * 배열 높이를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number} value 양의 안전 정수인 세로 항목 수이며 호출자가 검증한 값
     */
    set height(value: number);
    /**
     * 배열 높이를 반환합니다.
     *
     * @returns {number} 양의 안전 정수인 세로 항목 수
     */
    get height(): number;
    /**
     * 항목당 성분 수를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {(1 | 2 | 3 | 4)} value 한 항목을 구성하는 1~4개 성분의 개수이며 호출자가 검증한 값
     */
    set itemSize(value: (1 | 2 | 3 | 4));
    /**
     * 항목당 성분 수를 반환합니다.
     *
     * @returns {(1 | 2 | 3 | 4)} 한 항목을 구성하는 1~4개 성분의 개수
     */
    get itemSize(): (1 | 2 | 3 | 4);
    /**
     * 정수 attribute의 정규화 여부를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {boolean} value 정수 attribute의 정규화 여부이며 호출자가 검증한 값
     */
    set normalized(value: boolean);
    /**
     * 정수 attribute의 정규화 여부를 반환합니다.
     *
     * @returns {boolean} 정수 attribute를 정규화해 읽으면 true
     */
    get normalized(): boolean;
    /**
     * 배열 시작 위치를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number} value 파일 시작을 0으로 하는 바이트 위치이며 8의 배수이며 호출자가 검증한 값
     */
    set byteOffset(value: number);
    /**
     * 배열 시작 위치를 반환합니다.
     *
     * @returns {number} 파일 시작을 0으로 하는 바이트 위치이며 8의 배수
     */
    get byteOffset(): number;
    /**
     * 배열 바이트 길이를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number} value 배열이 차지하는 바이트 수이며 호출자가 검증한 값
     */
    set byteLength(value: number);
    /**
     * 배열 바이트 길이를 반환합니다.
     *
     * @returns {number} 배열이 차지하는 바이트 수
     */
    get byteLength(): number;
}
/**
 * 여러 바이너리 파일이 공유하는 배열 배치를 보관합니다.
 *
 * @group A3F
 * @summary 여러 파일이 참조하는 공용 배열 배치 보관
 */
declare class UA3FLayoutVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FLayoutVo 클래스 생성자입니다. <br>
     * 옵션 키를 정규화하고 필수 키의 존재를 확인한 뒤 값을 보관합니다.
     *
     * @param {UA3FLayoutVoCO} opt 모든 필수 키를 가진 옵션이며 null·생략 불가, 원본 옵션을 변경하지 않음, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FLayoutVoCO);
    /** @type {string} */
    _layoutId: string;
    /** @type {number} */
    _byteLength: number;
    /** @type {Array<import('./UA3FDataVos.js').UA3FArrayLayoutVo>} */
    _arrays: Array<UA3FArrayLayoutVo>;
    /**
     * 공용 배치 식별자를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 파일 정의에서 참조할 공용 배열 배치 식별자이며 호출자가 검증한 값
     */
    set layoutId(value: string);
    /**
     * 공용 배치 식별자를 반환합니다.
     *
     * @returns {string} 파일 정의에서 참조할 공용 배열 배치 식별자
     */
    get layoutId(): string;
    /**
     * 공용 배치의 바이트 길이를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number} value 배치 전체가 차지하는 바이트 수이며 호출자가 검증한 값
     */
    set byteLength(value: number);
    /**
     * 공용 배치의 바이트 길이를 반환합니다.
     *
     * @returns {number} 배치 전체가 차지하는 바이트 수
     */
    get byteLength(): number;
    /**
     * 필드별 배열 배치 목록을 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {Array<import('./UA3FDataVos.js').UA3FArrayLayoutVo>} value 파일 내 순서에 맞춘 배열 배치 VO 목록이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set arrays(value: Array<UA3FArrayLayoutVo>);
    /**
     * 필드별 배열 배치 목록을 반환합니다.
     *
     * @returns {Array<import('./UA3FDataVos.js').UA3FArrayLayoutVo>} 파일 내 순서에 맞춘 배열 배치 VO 목록, 복사하지 않은 참조
     */
    get arrays(): Array<UA3FArrayLayoutVo>;
}
/**
 * 사용자 정의 필드의 의미와 저장 구분을 보관합니다.
 *
 * @group A3F
 * @summary 사용자 정의 필드의 의미·범위·저장 구분 보관
 */
declare class UA3FFieldVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FFieldVo 클래스 생성자입니다. <br>
     * 옵션 키를 정규화하고 필수 키의 존재를 확인한 뒤 값을 보관합니다.
     *
     * @param {UA3FFieldVoCO} opt 모든 필수 키를 가진 옵션이며 null·생략 불가, 원본 옵션을 변경하지 않음, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FFieldVoCO);
    /** @type {string} */
    _fieldId: string;
    /** @type {string} */
    _label: string;
    /** @type {string} */
    _description: string;
    /** @type {(string | null)} */
    _unit: (string | null);
    /** @type {('node' | 'index' | 'triangle')} */
    _association: ("node" | "index" | "triangle");
    /** @type {('static' | 'frame')} */
    _storage: ("static" | "frame");
    /** @type {Array<string>} */
    _components: Array<string>;
    /** @type {(import('./UA3FDataVos.js').UA3FArrayStatisticsVo | null)} */
    _statistics: (UA3FArrayStatisticsVo | null);
    /**
     * 필드 식별자를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 배열 배치와 연결할 필드 식별자이며 호출자가 검증한 값
     */
    set fieldId(value: string);
    /**
     * 필드 식별자를 반환합니다.
     *
     * @returns {string} 배열 배치와 연결할 필드 식별자
     */
    get fieldId(): string;
    /**
     * 화면 표시 이름을 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 필드 선택 화면에 표시할 이름이며 호출자가 검증한 값
     */
    set label(value: string);
    /**
     * 화면 표시 이름을 반환합니다.
     *
     * @returns {string} 필드 선택 화면에 표시할 이름
     */
    get label(): string;
    /**
     * 필드 설명을 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 필드 값의 의미를 설명하는 문자열이며 호출자가 검증한 값
     */
    set description(value: string);
    /**
     * 필드 설명을 반환합니다.
     *
     * @returns {string} 필드 값의 의미를 설명하는 문자열
     */
    get description(): string;
    /**
     * 필드 단위를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {(string | null)} value 값의 단위이며 미확정이면 null, 호출자가 검증한 값
     */
    set unit(value: (string | null));
    /**
     * 필드 단위를 반환합니다.
     *
     * @returns {(string | null)} 값의 단위이며 미확정이면 null
     */
    get unit(): (string | null);
    /**
     * 값의 연결 대상을 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {('node' | 'index' | 'triangle')} value 정점은 node, 인덱스는 index, 삼각형은 triangle이며 호출자가 검증한 값
     */
    set association(value: ("node" | "index" | "triangle"));
    /**
     * 값의 연결 대상을 반환합니다.
     *
     * @returns {('node' | 'index' | 'triangle')} 정점은 node, 인덱스는 index, 삼각형은 triangle
     */
    get association(): ("node" | "index" | "triangle");
    /**
     * 필드 저장 구분을 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {('static' | 'frame')} value 공용 값은 static, 시간별 값은 frame이며 호출자가 검증한 값
     */
    set storage(value: ("static" | "frame"));
    /**
     * 필드 저장 구분을 반환합니다.
     *
     * @returns {('static' | 'frame')} 공용 값은 static, 시간별 값은 frame
     */
    get storage(): ("static" | "frame");
    /**
     * 성분 이름 목록을 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {Array<string>} value 배열의 성분 순서에 맞춘 1~4개 이름이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set components(value: Array<string>);
    /**
     * 성분 이름 목록을 반환합니다.
     *
     * @returns {Array<string>} 배열의 성분 순서에 맞춘 1~4개 이름, 복사하지 않은 참조
     */
    get components(): Array<string>;
    /**
     * 성분별 통계를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {(import('./UA3FDataVos.js').UA3FArrayStatisticsVo | null)} value 통계 VO이며 통계가 없으면 null, 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set statistics(value: (UA3FArrayStatisticsVo | null));
    /**
     * 성분별 통계를 반환합니다.
     *
     * @returns {(import('./UA3FDataVos.js').UA3FArrayStatisticsVo | null)} 통계 VO이며 통계가 없으면 null, 복사하지 않은 참조
     */
    get statistics(): (UA3FArrayStatisticsVo | null);
}
/**
 * 사용자 정의 필드의 성분별 통계를 보관합니다.
 *
 * @group A3F
 * @summary 필드별 성분 통계 보관
 */
declare class UA3FArrayStatisticsVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FArrayStatisticsVo 클래스 생성자입니다. <br>
     * 옵션 키를 정규화하고 필수 키의 존재를 확인한 뒤 값을 보관합니다.
     *
     * @param {UA3FArrayStatisticsVoCO} opt 모든 필수 키를 가진 옵션이며 null·생략 불가, 원본 옵션을 변경하지 않음, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FArrayStatisticsVoCO);
    /** @type {string} */
    _fieldId: string;
    /** @type {Array<number>} */
    _minimum: Array<number>;
    /** @type {Array<number>} */
    _maximum: Array<number>;
    /** @type {Array<number>} */
    _maxAbsoluteError: Array<number>;
    /**
     * 통계 대상 필드 식별자를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 필드 정의와 일치하는 식별자이며 호출자가 검증한 값
     */
    set fieldId(value: string);
    /**
     * 통계 대상 필드 식별자를 반환합니다.
     *
     * @returns {string} 필드 정의와 일치하는 식별자
     */
    get fieldId(): string;
    /**
     * 성분별 최솟값 배열을 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {Array<number>} value 필드의 성분 순서에 맞춘 최솟값 배열이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set minimum(value: Array<number>);
    /**
     * 성분별 최솟값 배열을 반환합니다.
     *
     * @returns {Array<number>} 필드의 성분 순서에 맞춘 최솟값 배열, 복사하지 않은 참조
     */
    get minimum(): Array<number>;
    /**
     * 성분별 최댓값 배열을 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {Array<number>} value 필드의 성분 순서에 맞춘 최댓값 배열이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set maximum(value: Array<number>);
    /**
     * 성분별 최댓값 배열을 반환합니다.
     *
     * @returns {Array<number>} 필드의 성분 순서에 맞춘 최댓값 배열, 복사하지 않은 참조
     */
    get maximum(): Array<number>;
    /**
     * 성분별 최대 절대 오차 배열을 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {Array<number>} value 필드의 성분 순서에 맞춘 최대 절대 오차 배열이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set maxAbsoluteError(value: Array<number>);
    /**
     * 성분별 최대 절대 오차 배열을 반환합니다.
     *
     * @returns {Array<number>} 필드의 성분 순서에 맞춘 최대 절대 오차 배열, 복사하지 않은 참조
     */
    get maxAbsoluteError(): Array<number>;
}
/**
 * 배열 배치와 디코딩한 TypedArray를 함께 보관합니다.
 *
 * @group A3F
 * @summary 배열 배치와 디코딩된 TypedArray 참조 전달
 */
declare class UA3FDecodedArrayVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FDecodedArrayVo 클래스 생성자입니다. <br>
     * 옵션 키를 정규화하고 필수 키의 존재를 확인한 뒤 값을 보관합니다.
     *
     * @param {UA3FDecodedArrayVoCO} opt 모든 필수 키를 가진 옵션이며 null·생략 불가, 원본 옵션을 변경하지 않음, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FDecodedArrayVoCO);
    /** @type {import('./UA3FDataVos.js').UA3FArrayLayoutVo} */
    _layout: UA3FArrayLayoutVo;
    /** @type {(Float32Array | Float64Array | Uint16Array | Uint32Array)} */
    _array: (Float32Array | Float64Array | Uint16Array | Uint32Array);
    /**
     * 배열 배치를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {import('./UA3FDataVos.js').UA3FArrayLayoutVo} value 숫자 배열을 해석한 배열 배치 VO이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set layout(value: UA3FArrayLayoutVo);
    /**
     * 배열 배치를 반환합니다.
     *
     * @returns {import('./UA3FDataVos.js').UA3FArrayLayoutVo} 숫자 배열을 해석한 배열 배치 VO, 복사하지 않은 참조
     */
    get layout(): UA3FArrayLayoutVo;
    /**
     * 디코딩한 숫자 배열을 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {(Float32Array | Float64Array | Uint16Array | Uint32Array)} value 원본 ArrayBuffer를 참조하는 TypedArray이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set array(value: (Float32Array | Float64Array | Uint16Array | Uint32Array));
    /**
     * 디코딩한 숫자 배열을 반환합니다.
     *
     * @returns {(Float32Array | Float64Array | Uint16Array | Uint32Array)} 원본 ArrayBuffer를 참조하는 TypedArray, 복사하지 않은 참조
     */
    get array(): (Float32Array | Float64Array | Uint16Array | Uint32Array);
}
/**
 * 바이너리 파일 하나의 디코딩 결과를 보관합니다.
 *
 * @group A3F
 * @summary 바이너리 파일 하나의 디코딩 결과
 */
declare class UA3FDecodedBufferVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FDecodedBufferVo 클래스 생성자입니다. <br>
     * 옵션 키를 정규화하고 필수 키의 존재를 확인한 뒤 값을 보관합니다.
     *
     * @param {UA3FDecodedBufferVoCO} opt 모든 필수 키를 가진 옵션이며 null·생략 불가, 원본 옵션을 변경하지 않음, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FDecodedBufferVoCO);
    /** @type {string} */
    _bufferId: string;
    /** @type {string} */
    _layoutId: string;
    /** @type {ArrayBuffer} */
    _arrayBuffer: ArrayBuffer;
    /** @type {Array<import('./UA3FDataVos.js').UA3FDecodedArrayVo>} */
    _arrays: Array<UA3FDecodedArrayVo>;
    /**
     * 바이너리 파일 식별자를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 해석한 바이너리 파일 식별자이며 호출자가 검증한 값
     */
    set bufferId(value: string);
    /**
     * 바이너리 파일 식별자를 반환합니다.
     *
     * @returns {string} 해석한 바이너리 파일 식별자
     */
    get bufferId(): string;
    /**
     * 공용 배치 식별자를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 해석에 사용한 공용 배치 식별자이며 호출자가 검증한 값
     */
    set layoutId(value: string);
    /**
     * 공용 배치 식별자를 반환합니다.
     *
     * @returns {string} 해석에 사용한 공용 배치 식별자
     */
    get layoutId(): string;
    /**
     * 디코딩 결과의 기반 버퍼를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {ArrayBuffer} value 결과 TypedArray가 참조하는 ArrayBuffer이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set arrayBuffer(value: ArrayBuffer);
    /**
     * 디코딩 결과의 기반 버퍼를 반환합니다.
     *
     * @returns {ArrayBuffer} 결과 TypedArray가 참조하는 ArrayBuffer, 복사하지 않은 참조
     */
    get arrayBuffer(): ArrayBuffer;
    /**
     * 디코딩한 필드 배열 목록을 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {Array<import('./UA3FDataVos.js').UA3FDecodedArrayVo>} value 배열 배치와 숫자 배열을 보관한 VO 목록이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set arrays(value: Array<UA3FDecodedArrayVo>);
    /**
     * 디코딩한 필드 배열 목록을 반환합니다.
     *
     * @returns {Array<import('./UA3FDataVos.js').UA3FDecodedArrayVo>} 배열 배치와 숫자 배열을 보관한 VO 목록, 복사하지 않은 참조
     */
    get arrays(): Array<UA3FDecodedArrayVo>;
}
/**
 * 프레임 메타정보와 이 프레임을 소유한 형상 식별자를 보관을 담당합니다.
 *
 * @group A3F
 * @summary 프레임 메타정보와 이 프레임을 소유한 형상 식별자를 보관
 */
declare class UA3FFrameVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FFrameVo 클래스 생성자입니다. <br>
     * 필수 키를 확인하고 값과 참조를 보관하며 원본 옵션을 변경하지 않습니다.
     *
     * @param {UA3FFrameVoCO} opt 모든 키가 필수이며 null·생략 불가, 객체·배열은 복사 없이 참조로 보관
     */
    constructor(opt: UA3FFrameVoCO);
    /** @type {string} */
    _geometryId: string;
    /** @type {number} */
    _frameIndex: number;
    /** @type {number} */
    _time: number;
    /** @type {string | null} */
    _bufferId: string | null;
    /** @type {Array<import('./UA3FDataVos.js').UA3FArrayStatisticsVo>} */
    _statistics: Array<UA3FArrayStatisticsVo>;
    /**
     * geometryId 값을 저장합니다. <br>
     * 값 검증과 다른 필드 갱신 및 기존 자원 해제는 수행하지 않습니다.
     *
     * @param {string} value 대상 공간 노드의 공용 형상 식별자
     */
    set geometryId(value: string);
    /**
     * geometryId 값을 반환합니다.
     *
     * @returns {string} 대상 공간 노드의 공용 형상 식별자
     */
    get geometryId(): string;
    /**
     * frameIndex 값을 저장합니다. <br>
     * 값 검증과 다른 필드 갱신 및 기존 자원 해제는 수행하지 않습니다.
     *
     * @param {number} value 0 기반 프레임 순번, 0 이상의 안전 정수
     */
    set frameIndex(value: number);
    /**
     * frameIndex 값을 반환합니다.
     *
     * @returns {number} 0 기반 프레임 순번, 0 이상의 안전 정수
     */
    get frameIndex(): number;
    /**
     * time 값을 저장합니다. <br>
     * 값 검증과 다른 필드 갱신 및 기존 자원 해제는 수행하지 않습니다.
     *
     * @param {number} value 원본 숫자 시각, 시간 단위와 기준을 임의 환산하지 않음
     */
    set time(value: number);
    /**
     * time 값을 반환합니다.
     *
     * @returns {number} 원본 숫자 시각, 시간 단위와 기준을 임의 환산하지 않음
     */
    get time(): number;
    /**
     * bufferId 값을 저장합니다. <br>
     * 값 검증과 다른 필드 갱신 및 기존 자원 해제는 수행하지 않습니다.
     *
     * @param {string | null} value 바이너리 파일 식별자 또는 데이터 없는 프레임의 null
     */
    set bufferId(value: string | null);
    /**
     * bufferId 값을 반환합니다.
     *
     * @returns {string | null} 바이너리 파일 식별자 또는 데이터 없는 프레임의 null
     */
    get bufferId(): string | null;
    /**
     * statistics 값을 저장합니다. <br>
     * 값 검증과 다른 필드 갱신 및 기존 자원 해제는 수행하지 않습니다.
     *
     * @param {Array<import('./UA3FDataVos.js').UA3FArrayStatisticsVo>} value 성분별 원본 통계 목록, 배열 참조
     */
    set statistics(value: Array<UA3FArrayStatisticsVo>);
    /**
     * statistics 값을 반환합니다.
     *
     * @returns {Array<import('./UA3FDataVos.js').UA3FArrayStatisticsVo>} 성분별 원본 통계 목록, 배열 참조
     */
    get statistics(): Array<UA3FArrayStatisticsVo>;
}
/**
 * 108 attribute 적용에 필요한 프레임·파일·숫자 배열 참조를 보관합니다.
 *
 * @group A3F
 * @summary 108 attribute 적용에 필요한 프레임·파일·숫자 배열 참조를 보관합니다.
 */
declare class UA3FFrameResourceVo {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FFrameResourceVo 클래스 생성자입니다. <br>
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FFrameResourceVoCO} opt 모든 키가 필수이며 null 불가, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FFrameResourceVoCO);
    /** @type {import('./UA3FDataVos.js').UA3FFrameVo} */
    _frameVo: UA3FFrameVo;
    /** @type {import('./UA3FDataVos.js').UA3FBufferVo} */
    _bufferVo: UA3FBufferVo;
    /** @type {import('./UA3FDataVos.js').UA3FDecodedBufferVo} */
    _decodedBufferVo: UA3FDecodedBufferVo;
    /**
     * previous-frame 정책으로 선택한 실제 유효 프레임, null 불가 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {import('./UA3FDataVos.js').UA3FFrameVo} value previous-frame 정책으로 선택한 실제 유효 프레임, null 불가
     */
    set frameVo(value: UA3FFrameVo);
    /**
     * previous-frame 정책으로 선택한 실제 유효 프레임, null 불가 값을 반환합니다.
     *
     * @returns {import('./UA3FDataVos.js').UA3FFrameVo} previous-frame 정책으로 선택한 실제 유효 프레임, null 불가
     */
    get frameVo(): UA3FFrameVo;
    /**
     * 해당 프레임의 파일 정의, null 불가 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {import('./UA3FDataVos.js').UA3FBufferVo} value 해당 프레임의 파일 정의, null 불가
     */
    set bufferVo(value: UA3FBufferVo);
    /**
     * 해당 프레임의 파일 정의, null 불가 값을 반환합니다.
     *
     * @returns {import('./UA3FDataVos.js').UA3FBufferVo} 해당 프레임의 파일 정의, null 불가
     */
    get bufferVo(): UA3FBufferVo;
    /**
     * 워커 결과 참조, 사용 중 변경·분리·재전송 금지 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {import('./UA3FDataVos.js').UA3FDecodedBufferVo} value 워커 결과 참조, 사용 중 변경·분리·재전송 금지
     */
    set decodedBufferVo(value: UA3FDecodedBufferVo);
    /**
     * 워커 결과 참조, 사용 중 변경·분리·재전송 금지 값을 반환합니다.
     *
     * @returns {import('./UA3FDataVos.js').UA3FDecodedBufferVo} 워커 결과 참조, 사용 중 변경·분리·재전송 금지
     */
    get decodedBufferVo(): UA3FDecodedBufferVo;
}
/**
 * 화면 적용 후보 또는 표시 중인 원시 버퍼의 보존 권한을 전달합니다.
 *
 * @group A3F
 * @summary 화면 적용 후보 또는 표시 중인 원시 버퍼의 보존 권한을 전달합니다.
 */
declare class UA3FFrameLeaseVo {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FFrameLeaseVo 클래스 생성자입니다. <br>
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FFrameLeaseVoCO} opt 모든 키가 필수이며 null 불가, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FFrameLeaseVoCO);
    /** @type {string} */
    _leaseId: string;
    /** @type {number} */
    _requestId: number;
    /** @type {number} */
    _requestedFrameIndex: number;
    /** @type {number} */
    _taskGeneration: number;
    /** @type {import('./UA3FDataVos.js').UA3FFrameResourceVo} */
    _resourceVo: UA3FFrameResourceVo;
    /**
     * 관리자 안에서 재사용하지 않는 보존 권한 식별자 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string} value 관리자 안에서 재사용하지 않는 보존 권한 식별자
     */
    set leaseId(value: string);
    /**
     * 관리자 안에서 재사용하지 않는 보존 권한 식별자 값을 반환합니다.
     *
     * @returns {string} 관리자 안에서 재사용하지 않는 보존 권한 식별자
     */
    get leaseId(): string;
    /**
     * 선택 요청 순번, 양의 안전 정수 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 선택 요청 순번, 양의 안전 정수
     */
    set requestId(value: number);
    /**
     * 선택 요청 순번, 양의 안전 정수 값을 반환합니다.
     *
     * @returns {number} 선택 요청 순번, 양의 안전 정수
     */
    get requestId(): number;
    /**
     * 요청한 등록 프레임의 0 기반 순번, 실제 유효 프레임과 다를 수 있음 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 요청한 등록 프레임의 0 기반 순번, 실제 유효 프레임과 다를 수 있음
     */
    set requestedFrameIndex(value: number);
    /**
     * 요청한 등록 프레임의 0 기반 순번, 실제 유효 프레임과 다를 수 있음 값을 반환합니다.
     *
     * @returns {number} 요청한 등록 프레임의 0 기반 순번, 실제 유효 프레임과 다를 수 있음
     */
    get requestedFrameIndex(): number;
    /**
     * 공유 워커의 0 이상 요청 세대 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 공유 워커의 0 이상 요청 세대
     */
    set taskGeneration(value: number);
    /**
     * 공유 워커의 0 이상 요청 세대 값을 반환합니다.
     *
     * @returns {number} 공유 워커의 0 이상 요청 세대
     */
    get taskGeneration(): number;
    /**
     * 보호하는 빌린 프레임 참조, release 후 보관하면 회수 지연 가능 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {import('./UA3FDataVos.js').UA3FFrameResourceVo} value 보호하는 빌린 프레임 참조, release 후 보관하면 회수 지연 가능
     */
    set resourceVo(value: UA3FFrameResourceVo);
    /**
     * 보호하는 빌린 프레임 참조, release 후 보관하면 회수 지연 가능 값을 반환합니다.
     *
     * @returns {import('./UA3FDataVos.js').UA3FFrameResourceVo} 보호하는 빌린 프레임 참조, release 후 보관하면 회수 지연 가능
     */
    get resourceVo(): UA3FFrameResourceVo;
}
/**
 * A3F 코덱 작업의 식별자와 실행 문맥을 보관합니다.
 *
 * @group A3F
 * @summary A3F 작업 문맥
 */
declare class UA3FTaskContextVo {
    /**
     * 생성자 옵션의 정본 키입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FTaskContextVo 클래스 생성자입니다. <br>
     * 옵션 키를 정규화하고 필수 키의 존재를 확인한 뒤 값을 보관합니다.
     *
     * @param {UA3FTaskContextVoCO} opt 모든 필수 키를 가진 옵션이며 null·생략 불가, 원본 옵션을 변경하지 않음
     */
    constructor(opt: UA3FTaskContextVoCO);
    /** @type {string} */
    _taskId: string;
    /** @type {string} */
    _nodeId: string;
    /** @type {string} */
    _bufferId: string;
    /** @type {number | null} */
    _frameIndex: number | null;
    /** @type {number | null} */
    _generation: number | null;
    /** @type {number} */
    _priority: number;
    /**
     * 작업 식별자를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 호출자가 지정한 작업 식별자이며 호출자가 검증한 값
     */
    set taskId(value: string);
    /**
     * 작업 식별자를 반환합니다.
     *
     * @returns {string} 호출자가 지정한 작업 식별자
     */
    get taskId(): string;
    /**
     * 공간 노드 식별자를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 작업을 요청한 공간 노드 식별자이며 호출자가 검증한 값
     */
    set nodeId(value: string);
    /**
     * 공간 노드 식별자를 반환합니다.
     *
     * @returns {string} 작업을 요청한 공간 노드 식별자
     */
    get nodeId(): string;
    /**
     * 처리 대상 파일 식별자를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 처리할 바이너리 파일 식별자이며 호출자가 검증한 값
     */
    set bufferId(value: string);
    /**
     * 처리 대상 파일 식별자를 반환합니다.
     *
     * @returns {string} 처리할 바이너리 파일 식별자
     */
    get bufferId(): string;
    /**
     * 프레임 순번을 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number | null} value 0 기반 프레임 순번이며 공용 형상은 null, 호출자가 검증한 값
     */
    set frameIndex(value: number | null);
    /**
     * 프레임 순번을 반환합니다.
     *
     * @returns {number | null} 0 기반 프레임 순번이며 공용 형상은 null
     */
    get frameIndex(): number | null;
    /**
     * 요청 세대를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number | null} value 0 이상의 안전 정수인 요청 세대이며 공용 형상은 null, 호출자가 검증한 값
     */
    set generation(value: number | null);
    /**
     * 요청 세대를 반환합니다.
     *
     * @returns {number | null} 0 이상의 안전 정수인 요청 세대이며 공용 형상은 null
     */
    get generation(): number | null;
    /**
     * 작업 우선순위를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number} value 0 이상의 안전 정수이며 작은 값부터 처리하는 우선순위이며 호출자가 검증한 값
     */
    set priority(value: number);
    /**
     * 작업 우선순위를 반환합니다.
     *
     * @returns {number} 0 이상의 안전 정수이며 작은 값부터 처리하는 우선순위
     */
    get priority(): number;
}

/**
 * metadata 2.0 좌표 정의 보관을 담당합니다.
 *
 * @group A3F
 * @summary metadata 2.0 좌표 정의 보관
 */
declare class UA3FCoordinateVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FCoordinateVo 클래스 생성자입니다. <br>
     * 옵션 키를 정규화하고 필수 값을 보관하며 필드 값의 유효성은 검증하지 않습니다.
     *
     * @param {UA3FCoordinateVoCO} opt 모든 키가 필수이며 null·생략 불가, 객체·배열은 참조로 보관하고 원본 옵션은 변경하지 않음
     */
    constructor(opt: UA3FCoordinateVoCO);
    /** @type {string} */
    _sourceCrs: string;
    /**
     * 월드 좌표(EPSG:3857)의 출력 수평 좌표계를 보관합니다.
     *
     * @type {'EPSG:3857'}
     */
    _targetCrs: "EPSG:3857";
    /** @type {'projected' | 'world'} */
    _coordinateType: "projected" | "world";
    /** @type {string | null} */
    _worldProfile: string | null;
    /** @type {'local' | 'absolute'} */
    _positionSpace: "local" | "absolute";
    /** @type {[number, number, number]} */
    _origin: [number, number, number];
    /** @type {'meters' | 'mercator-world'} */
    _heightEncoding: "meters" | "mercator-world";
    /** @type {'none' | 'per-node-latitude' | 'reference-y'} */
    _heightScaleMode: "none" | "per-node-latitude" | "reference-y";
    /** @type {string | null} */
    _heightScaleFieldId: string | null;
    /** @type {number | null} */
    _heightScaleReferenceY: number | null;
    /** @type {number | null} */
    _heightScaleValue: number | null;
    /** @type {[number, number, number, number]} */
    _projectedBounds: [number, number, number, number];
    /** @type {[number, number, number]} */
    _baseRenderBoundsMin: [number, number, number];
    /** @type {[number, number, number]} */
    _baseRenderBoundsMax: [number, number, number];
    /**
     * sourceCrs 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {string} value 원본 좌표계 식별자이며 현재 자료는 EPSG:5187
     */
    set sourceCrs(value: string);
    /**
     * sourceCrs 값을 반환합니다.
     *
     * @returns {string} 원본 좌표계 식별자이며 현재 자료는 EPSG:5187
     */
    get sourceCrs(): string;
    /**
     * targetCrs 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {'EPSG:3857'} value 월드 좌표(EPSG:3857)의 출력 CRS
     */
    set targetCrs(value: "EPSG:3857");
    /**
     * targetCrs 값을 반환합니다.
     *
     * @returns {'EPSG:3857'} 월드 좌표(EPSG:3857)의 출력 CRS
     */
    get targetCrs(): "EPSG:3857";
    /**
     * coordinateType 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {'projected' | 'world'} value projected는 XY 투영 좌표·미터 Z, world는 엔진 월드 Z
     */
    set coordinateType(value: "projected" | "world");
    /**
     * coordinateType 값을 반환합니다.
     *
     * @returns {'projected' | 'world'} projected는 XY 투영 좌표·미터 Z, world는 엔진 월드 Z
     */
    get coordinateType(): "projected" | "world";
    /**
     * worldProfile 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {string | null} value world의 높이 배율 프로파일, projected는 null
     */
    set worldProfile(value: string | null);
    /**
     * worldProfile 값을 반환합니다.
     *
     * @returns {string | null} world의 높이 배율 프로파일, projected는 null
     */
    get worldProfile(): string | null;
    /**
     * positionSpace 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {'local' | 'absolute'} value local은 origin을 뺀 배열, absolute는 origin [0, 0, 0]
     */
    set positionSpace(value: "local" | "absolute");
    /**
     * positionSpace 값을 반환합니다.
     *
     * @returns {'local' | 'absolute'} local은 origin을 뺀 배열, absolute는 origin [0,0,0]
     */
    get positionSpace(): "local" | "absolute";
    /**
     * origin 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {[ number, number, number ]} value 저장한 position과 같은 공간의 고정 XYZ 기준점, 복사 없이 참조로 보관
     */
    set origin(value: [number, number, number]);
    /**
     * origin 값을 반환합니다.
     *
     * @returns {[ number, number, number ]} 저장한 position과 같은 공간의 고정 XYZ 기준점, 보관한 참조
     */
    get origin(): [number, number, number];
    /**
     * heightEncoding 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {'meters' | 'mercator-world'} value position Z의 표현 단위
     */
    set heightEncoding(value: "meters" | "mercator-world");
    /**
     * heightEncoding 값을 반환합니다.
     *
     * @returns {'meters' | 'mercator-world'} position Z의 표현 단위
     */
    get heightEncoding(): "meters" | "mercator-world";
    /**
     * heightScaleMode 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {'none' | 'per-node-latitude' | 'reference-y'} value 실제 metadata 2.0 이름 유지
     */
    set heightScaleMode(value: "none" | "per-node-latitude" | "reference-y");
    /**
     * heightScaleMode 값을 반환합니다.
     *
     * @returns {'none' | 'per-node-latitude' | 'reference-y'} 실제 metadata 2.0 이름 유지
     */
    get heightScaleMode(): "none" | "per-node-latitude" | "reference-y";
    /**
     * heightScaleFieldId 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {string | null} value 정점별 배율 필드 식별자
     */
    set heightScaleFieldId(value: string | null);
    /**
     * heightScaleFieldId 값을 반환합니다.
     *
     * @returns {string | null} 정점별 배율 필드 식별자
     */
    get heightScaleFieldId(): string | null;
    /**
     * heightScaleReferenceY 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {number | null} value reference-y의 기준 월드 Y
     */
    set heightScaleReferenceY(value: number | null);
    /**
     * heightScaleReferenceY 값을 반환합니다.
     *
     * @returns {number | null} reference-y의 기준 월드 Y
     */
    get heightScaleReferenceY(): number | null;
    /**
     * heightScaleValue 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {number | null} value 미터 높이에 곱하는 공통 월드 배율
     */
    set heightScaleValue(value: number | null);
    /**
     * heightScaleValue 값을 반환합니다.
     *
     * @returns {number | null} 미터 높이에 곱하는 공통 월드 배율
     */
    get heightScaleValue(): number | null;
    /**
     * projectedBounds 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {[ number, number, number, number ]} value 월드 좌표(EPSG:3857)의 minX, minY, maxX, maxY, 복사 없이 참조로 보관
     */
    set projectedBounds(value: [number, number, number, number]);
    /**
     * projectedBounds 값을 반환합니다.
     *
     * @returns {[ number, number, number, number ]} 월드 좌표(EPSG:3857)의 minX,minY,maxX,maxY, 보관한 참조
     */
    get projectedBounds(): [number, number, number, number];
    /**
     * baseRenderBoundsMin 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {[ number, number, number ]} value 저장된 바탕 position 공간의 최솟값, 복사 없이 참조로 보관
     */
    set baseRenderBoundsMin(value: [number, number, number]);
    /**
     * baseRenderBoundsMin 값을 반환합니다.
     *
     * @returns {[ number, number, number ]} 저장된 바탕 position 공간의 최솟값, 보관한 참조
     */
    get baseRenderBoundsMin(): [number, number, number];
    /**
     * baseRenderBoundsMax 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {[ number, number, number ]} value 저장된 바탕 position 공간의 최댓값, 복사 없이 참조로 보관
     */
    set baseRenderBoundsMax(value: [number, number, number]);
    /**
     * baseRenderBoundsMax 값을 반환합니다.
     *
     * @returns {[ number, number, number ]} 저장된 바탕 position 공간의 최댓값, 보관한 참조
     */
    get baseRenderBoundsMax(): [number, number, number];
}
/**
 * metadata 2.0 형상 정의 보관을 담당합니다.
 *
 * @group A3F
 * @summary metadata 2.0 형상 정의 보관
 */
declare class UA3FGeometryVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FGeometryVo 클래스 생성자입니다. <br>
     * 옵션 키를 정규화하고 필수 값을 보관하며 필드 값의 유효성은 검증하지 않습니다.
     *
     * @param {UA3FGeometryVoCO} opt 모든 키가 필수이며 null·생략 불가, 객체·배열은 참조로 보관하고 원본 옵션은 변경하지 않음
     */
    constructor(opt: UA3FGeometryVoCO);
    /** @type {string} */
    _geometryId: string;
    /** @type {string} */
    _bufferId: string;
    /** @type {'indexed-triangles'} */
    _topology: "indexed-triangles";
    /** @type {number} */
    _vertexCount: number;
    /** @type {number} */
    _triangleCount: number;
    /** @type {number} */
    _indexCount: number;
    /** @type {string} */
    _indexFieldId: string;
    /** @type {Record<string, string>} */
    _attributeBindings: Record<string, string>;
    /** @type {Array<string>} */
    _cpuFieldIds: Array<string>;
    /** @type {import('./UA3FSceneVos.js').UA3FCoordinateVo} */
    _coordinates: UA3FCoordinateVo;
    /** @type {[number, number, number]} */
    _renderBoundsMin: [number, number, number];
    /** @type {[number, number, number]} */
    _renderBoundsMax: [number, number, number];
    /** @type {'base-position' | 'all-frames-and-height-policies'} */
    _renderBoundsScope: "base-position" | "all-frames-and-height-policies";
    /** @type {'base-position' | 'conservative-interval'} */
    _renderBoundsMethod: "base-position" | "conservative-interval";
    /**
     * geometryId 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {string} value 공용 형상 식별자
     */
    set geometryId(value: string);
    /**
     * geometryId 값을 반환합니다.
     *
     * @returns {string} 공용 형상 식별자
     */
    get geometryId(): string;
    /**
     * bufferId 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {string} value 정적 형상 바이너리 식별자
     */
    set bufferId(value: string);
    /**
     * bufferId 값을 반환합니다.
     *
     * @returns {string} 정적 형상 바이너리 식별자
     */
    get bufferId(): string;
    /**
     * topology 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {'indexed-triangles'} value 'indexed-triangles'
     */
    set topology(value: "indexed-triangles");
    /**
     * topology 값을 반환합니다.
     *
     * @returns {'indexed-triangles'} 'indexed-triangles'
     */
    get topology(): "indexed-triangles";
    /**
     * vertexCount 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {number} value 양의 안전 정수인 정점 수
     */
    set vertexCount(value: number);
    /**
     * vertexCount 값을 반환합니다.
     *
     * @returns {number} 양의 안전 정수인 정점 수
     */
    get vertexCount(): number;
    /**
     * triangleCount 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {number} value 양의 안전 정수인 삼각형 수
     */
    set triangleCount(value: number);
    /**
     * triangleCount 값을 반환합니다.
     *
     * @returns {number} 양의 안전 정수인 삼각형 수
     */
    get triangleCount(): number;
    /**
     * indexCount 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {number} value 삼각형 수의 3배인 인덱스 개수
     */
    set indexCount(value: number);
    /**
     * indexCount 값을 반환합니다.
     *
     * @returns {number} 삼각형 수의 3배인 인덱스 개수
     */
    get indexCount(): number;
    /**
     * indexFieldId 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {string} value 정수 인덱스 필드 식별자
     */
    set indexFieldId(value: string);
    /**
     * indexFieldId 값을 반환합니다.
     *
     * @returns {string} 정수 인덱스 필드 식별자
     */
    get indexFieldId(): string;
    /**
     * attributeBindings 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {Record<string, string>} value 실제 attribute 이름 → fieldId, position 키 필수, 복사 없이 참조로 보관
     */
    set attributeBindings(value: Record<string, string>);
    /**
     * attributeBindings 값을 반환합니다.
     *
     * @returns {Record<string, string>} 실제 attribute 이름 → fieldId, position 키 필수, 보관한 참조
     */
    get attributeBindings(): Record<string, string>;
    /**
     * cpuFieldIds 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {Array<string>} value CPU 조회로 유지할 정적 필드 식별자, 복사 없이 참조로 보관
     */
    set cpuFieldIds(value: Array<string>);
    /**
     * cpuFieldIds 값을 반환합니다.
     *
     * @returns {Array<string>} CPU 조회로 유지할 정적 필드 식별자, 보관한 참조
     */
    get cpuFieldIds(): Array<string>;
    /**
     * coordinates 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {import('./UA3FSceneVos.js').UA3FCoordinateVo} value 원본 메타정보의 좌표 정의, 복사 없이 참조로 보관
     */
    set coordinates(value: UA3FCoordinateVo);
    /**
     * coordinates 값을 반환합니다.
     *
     * @returns {import('./UA3FSceneVos.js').UA3FCoordinateVo} 원본 메타정보의 좌표 정의, 보관한 참조
     */
    get coordinates(): UA3FCoordinateVo;
    /**
     * renderBoundsMin 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {[ number, number, number ]} value coordinates.positionSpace와 같은 공간의 표시 경계 최솟값, 복사 없이 참조로 보관
     */
    set renderBoundsMin(value: [number, number, number]);
    /**
     * renderBoundsMin 값을 반환합니다.
     *
     * @returns {[ number, number, number ]} coordinates.positionSpace와 같은 공간의 표시 경계 최솟값, 보관한 참조
     */
    get renderBoundsMin(): [number, number, number];
    /**
     * renderBoundsMax 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {[ number, number, number ]} value coordinates.positionSpace와 같은 공간의 표시 경계 최댓값, 복사 없이 참조로 보관
     */
    set renderBoundsMax(value: [number, number, number]);
    /**
     * renderBoundsMax 값을 반환합니다.
     *
     * @returns {[ number, number, number ]} coordinates.positionSpace와 같은 공간의 표시 경계 최댓값, 보관한 참조
     */
    get renderBoundsMax(): [number, number, number];
    /**
     * renderBoundsScope 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {'base-position' | 'all-frames-and-height-policies'} value 'base-position' | 'all-frames-and-height-policies'
     */
    set renderBoundsScope(value: "base-position" | "all-frames-and-height-policies");
    /**
     * renderBoundsScope 값을 반환합니다.
     *
     * @returns {'base-position' | 'all-frames-and-height-policies'} 'base-position' | 'all-frames-and-height-policies'
     */
    get renderBoundsScope(): "base-position" | "all-frames-and-height-policies";
    /**
     * renderBoundsMethod 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {'base-position' | 'conservative-interval'} value 'base-position' | 'conservative-interval'
     */
    set renderBoundsMethod(value: "base-position" | "conservative-interval");
    /**
     * renderBoundsMethod 값을 반환합니다.
     *
     * @returns {'base-position' | 'conservative-interval'} 'base-position' | 'conservative-interval'
     */
    get renderBoundsMethod(): "base-position" | "conservative-interval";
}
/**
 * 생성한 형상과 출력 좌표 및 원본 필드 참조 전달을 담당합니다.
 *
 * @group A3F
 * @summary 생성한 형상과 출력 좌표 및 원본 필드 참조 전달
 */
declare class UA3FGeometryResultVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FGeometryResultVo 클래스 생성자입니다. <br>
     * 옵션 키를 정규화하고 필수 값을 보관하며 필드 값의 유효성은 검증하지 않습니다.
     *
     * @param {UA3FGeometryResultVoCO} opt 모든 키가 필수이며 null·생략 불가, 객체·배열은 참조로 보관하고 원본 옵션은 변경하지 않음
     */
    constructor(opt: UA3FGeometryResultVoCO);
    /** @type {string} */
    _geometryId: string;
    /** @type {import('three').BufferGeometry} */
    _geometry: BufferGeometry;
    /** @type {import('./UA3FSceneVos.js').UA3FCoordinateVo} */
    _coordinates: UA3FCoordinateVo;
    /** @type {Map<string, import('./UA3FDataVos.js').UA3FDecodedArrayVo>} */
    _sourceArrays: Map<string, UA3FDecodedArrayVo>;
    /** @type {Array<string>} */
    _pendingFieldIds: Array<string>;
    /**
     * geometryId 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {string} value 생성한 공용 형상 식별자
     */
    set geometryId(value: string);
    /**
     * geometryId 값을 반환합니다.
     *
     * @returns {string} 생성한 공용 형상 식별자
     */
    get geometryId(): string;
    /**
     * geometry 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {import('three').BufferGeometry} value 호출자가 수명을 소유하는 생성 결과, 복사 없이 참조로 보관
     */
    set geometry(value: BufferGeometry);
    /**
     * geometry 값을 반환합니다.
     *
     * @returns {import('three').BufferGeometry} 호출자가 수명을 소유하는 생성 결과, 보관한 참조
     */
    get geometry(): BufferGeometry;
    /**
     * coordinates 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {import('./UA3FSceneVos.js').UA3FCoordinateVo} value 실제 geometry 배열에 대응하는 출력 world 좌표 정의, 복사 없이 참조로 보관
     */
    set coordinates(value: UA3FCoordinateVo);
    /**
     * coordinates 값을 반환합니다.
     *
     * @returns {import('./UA3FSceneVos.js').UA3FCoordinateVo} 실제 geometry 배열에 대응하는 출력 world 좌표 정의, 보관한 참조
     */
    get coordinates(): UA3FCoordinateVo;
    /**
     * sourceArrays 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {Map<string, import('./UA3FDataVos.js').UA3FDecodedArrayVo>} value 디코딩한 정적 원본 배열 참조, CPU 필드와 인덱스 포함, 복사 없이 참조로 보관
     */
    set sourceArrays(value: Map<string, UA3FDecodedArrayVo>);
    /**
     * sourceArrays 값을 반환합니다.
     *
     * @returns {Map<string, import('./UA3FDataVos.js').UA3FDecodedArrayVo>} 디코딩한 정적 원본 배열 참조, CPU 필드와 인덱스 포함, 보관한 참조
     */
    get sourceArrays(): Map<string, UA3FDecodedArrayVo>;
    /**
     * pendingFieldIds 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {Array<string>} value attributeBindings에 선언됐지만 시간 프레임이 와야 연결할 필드 식별자, 복사 없이 참조로 보관
     */
    set pendingFieldIds(value: Array<string>);
    /**
     * pendingFieldIds 값을 반환합니다.
     *
     * @returns {Array<string>} attributeBindings에 선언됐지만 시간 프레임이 와야 연결할 필드 식별자, 보관한 참조
     */
    get pendingFieldIds(): Array<string>;
}
/**
 * 메타정보의 높이 연산과 필드별 성분 선택 보관을 담당합니다.
 *
 * @group A3F
 * @summary 메타정보의 높이 연산과 필드별 성분 선택 보관
 */
declare class UA3FHeightPolicyVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FHeightPolicyVo 클래스 생성자입니다. <br>
     * 필수 옵션을 보관하며 연산과 값의 유효성은 사용하는 모듈이 검증합니다.
     *
     * @param {UA3FHeightPolicyVoCO} opt 모든 키가 필수이며 null·생략 불가, 배열은 참조로 보관하고 옵션은 변경하지 않음
     */
    constructor(opt: UA3FHeightPolicyVoCO);
    /** @type {string} */
    _policyId: string;
    /** @type {string} */
    _label: string;
    /** @type {'absolute-field' | 'sum-fields'} */
    _operation: "absolute-field" | "sum-fields";
    /** @type {Array<string>} */
    _fieldIds: Array<string>;
    /** @type {Array<number>} */
    _componentIndices: Array<number>;
    /**
     * policyId 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {string} value 높이 정책 식별자
     */
    set policyId(value: string);
    /**
     * policyId 값을 반환합니다.
     *
     * @returns {string} 높이 정책 식별자
     */
    get policyId(): string;
    /**
     * label 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {string} value 화면 표시 이름
     */
    set label(value: string);
    /**
     * label 값을 반환합니다.
     *
     * @returns {string} 화면 표시 이름
     */
    get label(): string;
    /**
     * operation 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {'absolute-field' | 'sum-fields'} value 필드 하나 선택 또는 둘 이상 순서대로 합산하는 연산
     */
    set operation(value: "absolute-field" | "sum-fields");
    /**
     * operation 값을 반환합니다.
     *
     * @returns {'absolute-field' | 'sum-fields'} 필드 하나 선택 또는 둘 이상 순서대로 합산하는 연산
     */
    get operation(): "absolute-field" | "sum-fields";
    /**
     * fieldIds 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {Array<string>} value 연산 순서의 미터 단위 필드 식별자 배열, 중복 허용
     */
    set fieldIds(value: Array<string>);
    /**
     * fieldIds 값을 반환합니다.
     *
     * @returns {Array<string>} 연산 순서의 미터 단위 필드 식별자 배열, 중복 허용
     */
    get fieldIds(): Array<string>;
    /**
     * componentIndices 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {Array<number>} value fieldIds와 1:1 대응하는 0 기반 성분 인덱스 배열
     */
    set componentIndices(value: Array<number>);
    /**
     * componentIndices 값을 반환합니다.
     *
     * @returns {Array<number>} fieldIds와 1:1 대응하는 0 기반 성분 인덱스 배열
     */
    get componentIndices(): Array<number>;
}
/**
 * 메타정보의 표시 높이와 경계에 반영한 허용 구간 보관을 담당합니다.
 *
 * @group A3F
 * @summary 메타정보의 표시 높이와 경계에 반영한 허용 구간 보관
 */
declare class UA3FHeightDisplayVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FHeightDisplayVo 클래스 생성자입니다. <br>
     * 필수 옵션을 보관하며 연산과 값의 유효성은 사용하는 모듈이 검증합니다.
     *
     * @param {UA3FHeightDisplayVoCO} opt 모든 키가 필수이며 null·생략 불가, 배열은 참조로 보관하고 옵션은 변경하지 않음
     */
    constructor(opt: UA3FHeightDisplayVoCO);
    /** @type {number} */
    _displayZOffset: number;
    /** @type {[number, number]} */
    _displayZOffsetRange: [number, number];
    /**
     * displayZOffset 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {number} value 배율 적용 전에 더하는 표시 높이, 미터 단위
     */
    set displayZOffset(value: number);
    /**
     * displayZOffset 값을 반환합니다.
     *
     * @returns {number} 배율 적용 전에 더하는 표시 높이, 미터 단위
     */
    get displayZOffset(): number;
    /**
     * displayZOffsetRange 값을 저장합니다. <br>
     * 다른 필드를 갱신하거나 값의 유효성을 검증하지 않습니다.
     *
     * @param {[ number, number ]} value 빌더가 전체 렌더 경계에 반영한 오프셋 최솟값·최댓값, 미터 단위
     */
    set displayZOffsetRange(value: [number, number]);
    /**
     * displayZOffsetRange 값을 반환합니다.
     *
     * @returns {[ number, number ]} 빌더가 전체 렌더 경계에 반영한 오프셋 최솟값·최댓값, 미터 단위
     */
    get displayZOffsetRange(): [number, number];
}
/**
 * 한 metadata 문서의 출처·공간 정의·원본 자료를 보관합니다.
 *
 * @group A3F
 * @summary 한 metadata 문서의 출처·공간 정의·원본 자료를 보관합니다.
 */
declare class UA3FMetadataVo {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FMetadataVo 클래스 생성자입니다. <br>
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FMetadataVoCO} opt 모든 키가 필수이며 null 불가, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FMetadataVoCO);
    /** @type {string} */
    _metadataUrl: string;
    /** @type {string} */
    _nodeKey: string;
    /** @type {string} */
    _datasetId: string;
    /** @type {import('./UA3FSceneVos.js').UA3FNodeVo} */
    _nodeVo: UA3FNodeVo;
    /** @type {Array<import('./UA3FDataVos.js').UA3FFrameVo>} */
    _frames: Array<UA3FFrameVo>;
    /** @type {Array<import('./UA3FSceneVos.js').UA3FChildMetadataVo>} */
    _children: Array<UA3FChildMetadataVo>;
    /** @type {UA3FMetadataDocumentData} */
    _source: UA3FMetadataDocumentData;
    /**
     * 정규화한 응답 절대 URL, 각 상대 파일 주소의 기준 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string} value 정규화한 응답 절대 URL, 각 상대 파일 주소의 기준
     */
    set metadataUrl(value: string);
    /**
     * 정규화한 응답 절대 URL, 각 상대 파일 주소의 기준 값을 반환합니다.
     *
     * @returns {string} 정규화한 응답 절대 URL, 각 상대 파일 주소의 기준
     */
    get metadataUrl(): string;
    /**
     * URL과 원본 root.nodeId로 구성한 충돌 없는 클라이언트 키 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string} value URL과 원본 root.nodeId로 구성한 충돌 없는 클라이언트 키
     */
    set nodeKey(value: string);
    /**
     * URL과 원본 root.nodeId로 구성한 충돌 없는 클라이언트 키 값을 반환합니다.
     *
     * @returns {string} URL과 원본 root.nodeId로 구성한 충돌 없는 클라이언트 키
     */
    get nodeKey(): string;
    /**
     * 이 문서 원본의 데이터셋 식별자 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string} value 이 문서 원본의 데이터셋 식별자
     */
    set datasetId(value: string);
    /**
     * 이 문서 원본의 데이터셋 식별자 값을 반환합니다.
     *
     * @returns {string} 이 문서 원본의 데이터셋 식별자
     */
    get datasetId(): string;
    /**
     * 원본 공간 정의 사본, 독립 문서의 parentNodeId는 null 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {import('./UA3FSceneVos.js').UA3FNodeVo} value 원본 공간 정의 사본, 독립 문서의 parentNodeId는 null
     */
    set nodeVo(value: UA3FNodeVo);
    /**
     * 원본 공간 정의 사본, 독립 문서의 parentNodeId는 null 값을 반환합니다.
     *
     * @returns {import('./UA3FSceneVos.js').UA3FNodeVo} 원본 공간 정의 사본, 독립 문서의 parentNodeId는 null
     */
    get nodeVo(): UA3FNodeVo;
    /**
     * 형상 ID를 더해 정규화한 프레임·원본 시각·통계 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {Array<import('./UA3FDataVos.js').UA3FFrameVo>} value 형상 ID를 더해 정규화한 프레임·원본 시각·통계
     */
    set frames(value: Array<UA3FFrameVo>);
    /**
     * 형상 ID를 더해 정규화한 프레임·원본 시각·통계 값을 반환합니다.
     *
     * @returns {Array<import('./UA3FDataVos.js').UA3FFrameVo>} 형상 ID를 더해 정규화한 프레임·원본 시각·통계
     */
    get frames(): Array<UA3FFrameVo>;
    /**
     * 현재 문서 URL 기준 외부 metadata 참조 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {Array<import('./UA3FSceneVos.js').UA3FChildMetadataVo>} value 현재 문서 URL 기준 외부 metadata 참조
     */
    set children(value: Array<UA3FChildMetadataVo>);
    /**
     * 현재 문서 URL 기준 외부 metadata 참조 값을 반환합니다.
     *
     * @returns {Array<import('./UA3FSceneVos.js').UA3FChildMetadataVo>} 현재 문서 URL 기준 외부 metadata 참조
     */
    get children(): Array<UA3FChildMetadataVo>;
    /**
     * 원본 필드·배치·파일·형상·시간·재질을 보존한 독립 JSON 사본 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {UA3FMetadataDocumentData} value 원본 필드·배치·파일·형상·시간·재질을 보존한 독립 JSON 사본
     */
    set source(value: UA3FMetadataDocumentData);
    /**
     * 원본 필드·배치·파일·형상·시간·재질을 보존한 독립 JSON 사본 값을 반환합니다.
     *
     * @returns {UA3FMetadataDocumentData} 원본 필드·배치·파일·형상·시간·재질을 보존한 독립 JSON 사본
     */
    get source(): UA3FMetadataDocumentData;
}
/**
 * 공간 노드의 식별·계층·경계와 상세화 정의를 보관합니다.
 *
 * @group A3F
 * @summary A3F 공간 노드 정의
 */
declare class UA3FNodeVo {
    /**
     * 필수 생성 옵션의 정본 키입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FNodeVo 클래스 생성자입니다. <br>
     * 옵션 키를 정규화하고 필수 키의 존재를 확인한 뒤 값을 보관합니다.
     *
     * @param {UA3FNodeVoCO} opt 모든 필수 키를 가진 옵션이며 null·생략 불가, 원본 옵션을 변경하지 않음, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FNodeVoCO);
    /** @type {string} */
    _nodeId: string;
    /** @type {string | null} */
    _parentNodeId: string | null;
    /** @type {string | null} */
    _geometryId: string | null;
    /** @type {UA3FNodeBoundingBoxData} */
    _boundingBox: UA3FNodeBoundingBoxData;
    /** @type {number} */
    _geometricError: number;
    /** @type {'ADD' | 'REPLACE'} */
    _refine: "ADD" | "REPLACE";
    /**
     * 노드 식별자를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 레이어 안에서 유일한 노드 식별자이며 호출자가 검증한 값
     */
    set nodeId(value: string);
    /**
     * 노드 식별자를 반환합니다.
     *
     * @returns {string} 레이어 안에서 유일한 노드 식별자
     */
    get nodeId(): string;
    /**
     * 부모 노드 식별자를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string | null} value 부모 노드 식별자이며 루트 노드는 null, 호출자가 검증한 값
     */
    set parentNodeId(value: string | null);
    /**
     * 부모 노드 식별자를 반환합니다.
     *
     * @returns {string | null} 부모 노드 식별자이며 루트 노드는 null
     */
    get parentNodeId(): string | null;
    /**
     * 공용 형상 식별자를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string | null} value 공용 형상 식별자이며 공간 컨테이너는 null, 호출자가 검증한 값
     */
    set geometryId(value: string | null);
    /**
     * 공용 형상 식별자를 반환합니다.
     *
     * @returns {string | null} 공용 형상 식별자이며 공간 컨테이너는 null
     */
    get geometryId(): string | null;
    /**
     * 공간 경계를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {UA3FNodeBoundingBoxData} value 월드 좌표(EPSG:3857)의 XY 경계와 원본 미터 높이 범위이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set boundingBox(value: UA3FNodeBoundingBoxData);
    /**
     * 공간 경계를 반환합니다.
     *
     * @returns {UA3FNodeBoundingBoxData} 월드 좌표(EPSG:3857)의 XY 경계와 원본 미터 높이 범위, 복사하지 않은 참조
     */
    get boundingBox(): UA3FNodeBoundingBoxData;
    /**
     * 공간 오차를 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number} value 유한한 0 이상의 공간 상세화 오차이며 호출자가 검증한 값
     */
    set geometricError(value: number);
    /**
     * 공간 오차를 반환합니다.
     *
     * @returns {number} 유한한 0 이상의 공간 상세화 오차
     */
    get geometricError(): number;
    /**
     * 공간 상세화 방식을 저장합니다. <br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {'ADD' | 'REPLACE'} value ADD는 부모와 자식의 병합, REPLACE는 자식으로 교체하는 방식이며 호출자가 검증한 값
     */
    set refine(value: "ADD" | "REPLACE");
    /**
     * 공간 상세화 방식을 반환합니다.
     *
     * @returns {'ADD' | 'REPLACE'} ADD는 부모와 자식의 병합, REPLACE는 자식으로 교체하는 방식
     */
    get refine(): "ADD" | "REPLACE";
}
/**
 * 하위 metadata를 요청하기 전의 공간·무결성 정보를 보관합니다.
 *
 * @group A3F
 * @summary 하위 metadata를 요청하기 전의 공간·무결성 정보를 보관합니다.
 */
declare class UA3FChildMetadataVo {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FChildMetadataVo 클래스 생성자입니다. <br>
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FChildMetadataVoCO} opt 모든 키가 필수이며 null 불가, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FChildMetadataVoCO);
    /** @type {string} */
    _nodeId: string;
    /** @type {string} */
    _metadataUri: string;
    /** @type {UA3FNodeBoundingBoxData} */
    _boundingBox: UA3FNodeBoundingBoxData;
    /** @type {number} */
    _geometricError: number;
    /** @type {number | null} */
    _byteLength: number | null;
    /** @type {string | null} */
    _sha256: string | null;
    /**
     * 하위 root.nodeId와 대조할 비어 있지 않은 식별자 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string} value 하위 root.nodeId와 대조할 비어 있지 않은 식별자
     */
    set nodeId(value: string);
    /**
     * 하위 root.nodeId와 대조할 비어 있지 않은 식별자 값을 반환합니다.
     *
     * @returns {string} 하위 root.nodeId와 대조할 비어 있지 않은 식별자
     */
    get nodeId(): string;
    /**
     * 현재 부모 JSON 기준 상대 metadata URI 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string} value 현재 부모 JSON 기준 상대 metadata URI
     */
    set metadataUri(value: string);
    /**
     * 현재 부모 JSON 기준 상대 metadata URI 값을 반환합니다.
     *
     * @returns {string} 현재 부모 JSON 기준 상대 metadata URI
     */
    get metadataUri(): string;
    /**
     * 월드 좌표(EPSG:3857) XY와 원본 미터 Z 범위 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {UA3FNodeBoundingBoxData} value 월드 좌표(EPSG:3857) XY와 원본 미터 Z 범위
     */
    set boundingBox(value: UA3FNodeBoundingBoxData);
    /**
     * 월드 좌표(EPSG:3857) XY와 원본 미터 Z 범위 값을 반환합니다.
     *
     * @returns {UA3FNodeBoundingBoxData} 월드 좌표(EPSG:3857) XY와 원본 미터 Z 범위
     */
    get boundingBox(): UA3FNodeBoundingBoxData;
    /**
     * 유한한 0 이상 월드 좌표(EPSG:3857) 투영 평면 단위 오차 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 유한한 0 이상 월드 좌표(EPSG:3857) 투영 평면 단위 오차
     */
    set geometricError(value: number);
    /**
     * 유한한 0 이상 월드 좌표(EPSG:3857) 투영 평면 단위 오차 값을 반환합니다.
     *
     * @returns {number} 유한한 0 이상 월드 좌표(EPSG:3857) 투영 평면 단위 오차
     */
    get geometricError(): number;
    /**
     * UTF-8 JSON 기대 바이트 길이 또는 null, sha256과 함께 지정 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number | null} value UTF-8 JSON 기대 바이트 길이 또는 null, sha256과 함께 지정
     */
    set byteLength(value: number | null);
    /**
     * UTF-8 JSON 기대 바이트 길이 또는 null, sha256과 함께 지정 값을 반환합니다.
     *
     * @returns {number | null} UTF-8 JSON 기대 바이트 길이 또는 null, sha256과 함께 지정
     */
    get byteLength(): number | null;
    /**
     * raw bytes의 64자리 SHA-256 또는 null 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string | null} value raw bytes의 64자리 SHA-256 또는 null
     */
    set sha256(value: string | null);
    /**
     * raw bytes의 64자리 SHA-256 또는 null 값을 반환합니다.
     *
     * @returns {string | null} raw bytes의 64자리 SHA-256 또는 null
     */
    get sha256(): string | null;
}
/**
 * 공간 상세화와 metadata 요청·저장 상한을 보관합니다.
 *
 * @group A3F
 * @summary 공간 상세화와 metadata 요청·저장 상한을 보관합니다.
 */
declare class UA3FSpatialOptionsVo {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FSpatialOptionsVo 클래스 생성자입니다. <br>
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FSpatialOptionsVoCO} [opt={}] 선택 정책이며 null 불가, 옵션 원본은 변경하지 않음
     */
    constructor(opt?: UA3FSpatialOptionsVoCO);
    /** @type {number} */
    _maximumScreenSpaceError: number;
    /** @type {number} */
    _hysteresisRatio: number;
    /** @type {number} */
    _maxDepth: number;
    /** @type {number} */
    _maxConcurrentMetadataLoads: number;
    /** @type {number} */
    _maxMetadataBytes: number;
    /** @type {number} */
    _maxCachedMetadataCount: number;
    /** @type {number} */
    _maxCachedMetadataBytes: number;
    /**
     * 상세화 진입 오차, 기본 16 CSS pixel, 양의 유한값 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 상세화 진입 오차, 기본 16 CSS pixel, 양의 유한값
     */
    set maximumScreenSpaceError(value: number);
    /**
     * 상세화 진입 오차, 기본 16 CSS pixel, 양의 유한값 값을 반환합니다.
     *
     * @returns {number} 상세화 진입 오차, 기본 16 CSS pixel, 양의 유한값
     */
    get maximumScreenSpaceError(): number;
    /**
     * 직전 상세화의 축소 비율, 기본 0.75, 0 초과 1 이하 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 직전 상세화의 축소 비율, 기본 0.75, 0 초과 1 이하
     */
    set hysteresisRatio(value: number);
    /**
     * 직전 상세화의 축소 비율, 기본 0.75, 0 초과 1 이하 값을 반환합니다.
     *
     * @returns {number} 직전 상세화의 축소 비율, 기본 0.75, 0 초과 1 이하
     */
    get hysteresisRatio(): number;
    /**
     * 루트 0 기준 최대 깊이, 기본 32, 0 이상 안전 정수 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 루트 0 기준 최대 깊이, 기본 32, 0 이상 안전 정수
     */
    set maxDepth(value: number);
    /**
     * 루트 0 기준 최대 깊이, 기본 32, 0 이상 안전 정수 값을 반환합니다.
     *
     * @returns {number} 루트 0 기준 최대 깊이, 기본 32, 0 이상 안전 정수
     */
    get maxDepth(): number;
    /**
     * metadata HTTP부터 해석까지 동시 수, 기본 2, 양의 안전 정수 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value metadata HTTP부터 해석까지 동시 수, 기본 2, 양의 안전 정수
     */
    set maxConcurrentMetadataLoads(value: number);
    /**
     * metadata HTTP부터 해석까지 동시 수, 기본 2, 양의 안전 정수 값을 반환합니다.
     *
     * @returns {number} metadata HTTP부터 해석까지 동시 수, 기본 2, 양의 안전 정수
     */
    get maxConcurrentMetadataLoads(): number;
    /**
     * JSON 한 파일의 raw 바이트 상한, 기본 4194304, 양의 안전 정수 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value JSON 한 파일의 raw 바이트 상한, 기본 4194304, 양의 안전 정수
     */
    set maxMetadataBytes(value: number);
    /**
     * JSON 한 파일의 raw 바이트 상한, 기본 4194304, 양의 안전 정수 값을 반환합니다.
     *
     * @returns {number} JSON 한 파일의 raw 바이트 상한, 기본 4194304, 양의 안전 정수
     */
    get maxMetadataBytes(): number;
    /**
     * 준비·진행 metadata 수 상한, 기본 64, 양의 안전 정수 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 준비·진행 metadata 수 상한, 기본 64, 양의 안전 정수
     */
    set maxCachedMetadataCount(value: number);
    /**
     * 준비·진행 metadata 수 상한, 기본 64, 양의 안전 정수 값을 반환합니다.
     *
     * @returns {number} 준비·진행 metadata 수 상한, 기본 64, 양의 안전 정수
     */
    get maxCachedMetadataCount(): number;
    /**
     * 준비 raw 길이와 진행 예약 바이트 합 상한, 기본 16777216, 양의 안전 정수 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 준비 raw 길이와 진행 예약 바이트 합 상한, 기본 16777216, 양의 안전 정수
     */
    set maxCachedMetadataBytes(value: number);
    /**
     * 준비 raw 길이와 진행 예약 바이트 합 상한, 기본 16777216, 양의 안전 정수 값을 반환합니다.
     *
     * @returns {number} 준비 raw 길이와 진행 예약 바이트 합 상한, 기본 16777216, 양의 안전 정수
     */
    get maxCachedMetadataBytes(): number;
}
/**
 * 한 번의 공간 선택에 사용할 카메라·화면·콘텐츠 기준을 전달합니다.
 *
 * @group A3F
 * @summary 한 번의 공간 선택에 사용할 카메라·화면·콘텐츠 기준을 전달합니다.
 */
declare class UA3FSpatialViewVo {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FSpatialViewVo 클래스 생성자입니다. <br>
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FSpatialViewVoCO} opt 모든 키가 필수이며 null 불가, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FSpatialViewVoCO);
    /** @type {UA3FSpatialCamera} */
    _camera: UA3FSpatialCamera;
    /** @type {number} */
    _viewportHeight: number;
    /** @type {[number, number, number, number] | null} */
    _viewBoundsXY: [number, number, number, number] | null;
    /** @type {string} */
    _contentKey: string;
    /**
     * 절대 월드 좌표(EPSG:3857)의 갱신 완료 카메라, 빌린 참조이며 변경·해제 금지 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {UA3FSpatialCamera} value 절대 월드 좌표(EPSG:3857)의 갱신 완료 카메라, 빌린 참조이며 변경·해제 금지
     */
    set camera(value: UA3FSpatialCamera);
    /**
     * 절대 월드 좌표(EPSG:3857)의 갱신 완료 카메라, 빌린 참조이며 변경·해제 금지 값을 반환합니다.
     *
     * @returns {UA3FSpatialCamera} 절대 월드 좌표(EPSG:3857)의 갱신 완료 카메라, 빌린 참조이며 변경·해제 금지
     */
    get camera(): UA3FSpatialCamera;
    /**
     * 양의 유한 CSS pixel 높이, DPR을 중복 적용하지 않음 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 양의 유한 CSS pixel 높이, DPR을 중복 적용하지 않음
     */
    set viewportHeight(value: number);
    /**
     * 양의 유한 CSS pixel 높이, DPR을 중복 적용하지 않음 값을 반환합니다.
     *
     * @returns {number} 양의 유한 CSS pixel 높이, DPR을 중복 적용하지 않음
     */
    get viewportHeight(): number;
    /**
     * 보수적인 월드 좌표(EPSG:3857) minX,minY,maxX,maxY 또는 선행 XY 필터를 생략하는 null 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {[ number, number, number, number ] | null} value 보수적인 월드 좌표(EPSG:3857) minX, minY, maxX, maxY 또는 선행 XY 필터를 생략하는 null
     */
    set viewBoundsXY(value: [number, number, number, number] | null);
    /**
     * 보수적인 월드 좌표(EPSG:3857) minX,minY,maxX,maxY 또는 선행 XY 필터를 생략하는 null 값을 반환합니다.
     *
     * @returns {[ number, number, number, number ] | null} 보수적인 월드 좌표(EPSG:3857) minX,minY,maxX,maxY 또는 선행 XY 필터를 생략하는 null
     */
    get viewBoundsXY(): [number, number, number, number] | null;
    /**
     * 프레임·높이 정책 등 준비 결과를 구분하는 비어 있지 않은 상태 키 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string} value 프레임·높이 정책 등 준비 결과를 구분하는 비어 있지 않은 상태 키
     */
    set contentKey(value: string);
    /**
     * 프레임·높이 정책 등 준비 결과를 구분하는 비어 있지 않은 상태 키 값을 반환합니다.
     *
     * @returns {string} 프레임·높이 정책 등 준비 결과를 구분하는 비어 있지 않은 상태 키
     */
    get contentKey(): string;
}
/**
 * 현재 표시·준비·보류·회수 대상의 선택 계획 사본을 전달합니다.
 *
 * @group A3F
 * @summary 현재 표시·준비·보류·회수 대상의 선택 계획 사본을 전달합니다.
 */
declare class UA3FSpatialSelectionVo {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FSpatialSelectionVo 클래스 생성자입니다. <br>
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FSpatialSelectionVoCO} opt 모든 키가 필수이며 null 불가, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FSpatialSelectionVoCO);
    /** @type {number} */
    _selectionId: number;
    /** @type {string} */
    _contentKey: string;
    /** @type {Array<import('./UA3FSceneVos.js').UA3FMetadataVo>} */
    _requiredNodes: Array<UA3FMetadataVo>;
    /** @type {Array<string>} */
    _visibleNodeKeys: Array<string>;
    /** @type {Array<string>} */
    _pendingMetadataUrls: Array<string>;
    /** @type {Array<string>} */
    _releaseNodeKeys: Array<string>;
    /** @type {Array<Error>} */
    _errors: Array<Error>;
    /**
     * 관리자 안에서 증가하는 양의 선택 순번 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 관리자 안에서 증가하는 양의 선택 순번
     */
    set selectionId(value: number);
    /**
     * 관리자 안에서 증가하는 양의 선택 순번 값을 반환합니다.
     *
     * @returns {number} 관리자 안에서 증가하는 양의 선택 순번
     */
    get selectionId(): number;
    /**
     * 계획에 해당하는 프레임·높이 상태 키 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string} value 계획에 해당하는 프레임·높이 상태 키
     */
    set contentKey(value: string);
    /**
     * 계획에 해당하는 프레임·높이 상태 키 값을 반환합니다.
     *
     * @returns {string} 계획에 해당하는 프레임·높이 상태 키
     */
    get contentKey(): string;
    /**
     * 준비할 목표·대체 표시 형상 노드, 컨테이너 제외 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {Array<import('./UA3FSceneVos.js').UA3FMetadataVo>} value 준비할 목표·대체 표시 형상 노드, 컨테이너 제외
     */
    set requiredNodes(value: Array<UA3FMetadataVo>);
    /**
     * 준비할 목표·대체 표시 형상 노드, 컨테이너 제외 값을 반환합니다.
     *
     * @returns {Array<import('./UA3FSceneVos.js').UA3FMetadataVo>} 준비할 목표·대체 표시 형상 노드, 컨테이너 제외
     */
    get requiredNodes(): Array<UA3FMetadataVo>;
    /**
     * 현재 표시할 준비 완료 또는 보존 중인 노드 키 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {Array<string>} value 현재 표시할 준비 완료 또는 보존 중인 노드 키
     */
    set visibleNodeKeys(value: Array<string>);
    /**
     * 현재 표시할 준비 완료 또는 보존 중인 노드 키 값을 반환합니다.
     *
     * @returns {Array<string>} 현재 표시할 준비 완료 또는 보존 중인 노드 키
     */
    get visibleNodeKeys(): Array<string>;
    /**
     * 아직 필요한 metadata URL, a3f 파일 요청 목록이 아님 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {Array<string>} value 아직 필요한 metadata URL, a3f 파일 요청 목록이 아님
     */
    set pendingMetadataUrls(value: Array<string>);
    /**
     * 아직 필요한 metadata URL, a3f 파일 요청 목록이 아님 값을 반환합니다.
     *
     * @returns {Array<string>} 아직 필요한 metadata URL, a3f 파일 요청 목록이 아님
     */
    get pendingMetadataUrls(): Array<string>;
    /**
     * 더 이상 준비·표시·대체에 필요 없어 소유자가 회수할 이전 노드 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {Array<string>} value 더 이상 준비·표시·대체에 필요 없어 소유자가 회수할 이전 노드
     */
    set releaseNodeKeys(value: Array<string>);
    /**
     * 더 이상 준비·표시·대체에 필요 없어 소유자가 회수할 이전 노드 값을 반환합니다.
     *
     * @returns {Array<string>} 더 이상 준비·표시·대체에 필요 없어 소유자가 회수할 이전 노드
     */
    get releaseNodeKeys(): Array<string>;
    /**
     * 하위 metadata·용량 오류의 참조 목록 값을 보관합니다. <br>
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {Array<Error>} value 하위 metadata·용량 오류의 참조 목록
     */
    set errors(value: Array<Error>);
    /**
     * 하위 metadata·용량 오류의 참조 목록 값을 반환합니다.
     *
     * @returns {Array<Error>} 하위 metadata·용량 오류의 참조 목록
     */
    get errors(): Array<Error>;
}

/**
 * 한 A3F 레이어의 코덱 요청과 워커 풀을 관리합니다.
 *
 * @group A3F
 * @summary A3F 작업 예약과 수명 관리
 */
declare class UA3FTaskManager {
    /**
     * 생성자 옵션의 정본 키입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FTaskManager 클래스 생성자입니다. <br>
     * 옵션을 검증하고 워커를 생성하지 않은 상태로 작업 관리를 준비합니다.
     *
     * @param {UA3FTaskManagerCO} opt 작업 관리자 생성 설정
     */
    constructor(opt: UA3FTaskManagerCO);
    /** @type {string | null} */ _workerBaseUrl: string | null;
    /** @type {string} */
    _datasetId: string;
    /** @type {number} */
    _workerCount: number;
    /** @type {number} */
    _maxQueuedTasks: number;
    /** @type {number} */
    _maxQueuedBytes: number;
    /** @type {number} */
    _generation: number;
    /** @type {import('@union3d/core/UTaskProcessor').UTaskProcessor | null} */
    _taskProcessor: UTaskProcessor | null;
    /** @type {Map<string, UA3FTaskManagerEntry>} */
    _taskMap: Map<string, UA3FTaskManagerEntry>;
    /** @type {number} */
    _sequence: number;
    /** @type {boolean} */
    _disposed: boolean;
    /** @type {Promise<void> | null} */
    _disposePromise: Promise<void> | null;
    /** @type {boolean} */
    _pumpRunning: boolean;
    /**
     * 데이터셋 식별자를 첫 작업 등록 전에 설정합니다.
     *
     * @param {string} value 비어 있지 않은 데이터셋 식별자이며 null 불가, 첫 등록 또는 해제 후 변경 불가
     */
    set datasetId(value: string);
    /**
     * 데이터셋 식별자를 반환합니다.
     *
     * @returns {string} 작업을 구분하는 비어 있지 않은 데이터셋 식별자
     */
    get datasetId(): string;
    /**
     * 작업을 시작하기 전에만 Worker 폴더를 고정합니다.
     *
     * @param {string | null} value 끝 슬래시를 가진 절대 Worker 폴더, 기본 null, 첫 작업 이후 동일 값만 허용, 전역 변경 없음
     */
    set workerBaseUrl(value: string | null);
    /**
     * 이 관리자의 명시 Worker 폴더 또는 기존 SDK 기본값을 뜻하는 null을 반환합니다.
     *
     * @returns {string | null} 이 관리자의 명시 Worker 폴더 또는 기존 SDK 기본값을 뜻하는 null
     */
    get workerBaseUrl(): string | null;
    /**
     * 물리 워커 수와 동시 실행 상한을 첫 작업 등록 전에 설정합니다.
     *
     * @param {number} value 물리 워커 수와 동시 실행 상한이며 null 불가, 숫자는 안전 정수이고 1 이상, 등록·해제 후 변경 불가
     */
    set workerCount(value: number);
    /**
     * 물리 워커 수와 동시 실행 상한을 반환합니다.
     *
     * @returns {number} 양의 안전 정수인 물리 워커 수와 동시 실행 상한이며 기본값 1
     */
    get workerCount(): number;
    /**
     * 실행 중 작업을 제외한 대기 작업 수 상한을 첫 작업 등록 전에 설정합니다.
     *
     * @param {number} value 실행 중 작업을 제외한 대기 작업 수 상한이며 null 불가, 숫자는 안전 정수이고 0 이상, 등록·해제 후 변경 불가
     */
    set maxQueuedTasks(value: number);
    /**
     * 실행 중 작업을 제외한 대기 작업 수 상한을 반환합니다.
     *
     * @returns {number} 실행 중 작업을 제외한 대기 작업 수 상한이며 기본값 8
     */
    get maxQueuedTasks(): number;
    /**
     * 대기 backing buffer 총 바이트 상한을 첫 작업 등록 전에 설정합니다.
     *
     * @param {number} value 대기 backing buffer 총 바이트 상한이며 null 불가, 숫자는 안전 정수이고 0 이상, 등록·해제 후 변경 불가
     */
    set maxQueuedBytes(value: number);
    /**
     * 대기 backing buffer 총 바이트 상한을 반환합니다.
     *
     * @returns {number} 대기 입력의 기반 버퍼 바이트 상한이며 기본값 67108864
     */
    get maxQueuedBytes(): number;
    /**
     * 정의를 등록 시 고정하고 워커에서 해석한 공유 버퍼 결과를 반환합니다. <br>
     * 기본 설정에서는 전송 시 입력 ArrayBuffer가 분리되며 실패·취소 시 입력을 돌려주지 않습니다. <br>
     * 취소만으로 실행 중인 처리가 중단되거나 입력 버퍼를 다시 사용할 수 있다고 가정하면 안 됩니다.
     *
     * @param {import('./vo/UA3FDataVos.js').UA3FTaskContextVo} contextVo 작업 문맥(frameIndex는 0 기반)
     * @param {import('./vo/UA3FDataVos.js').UA3FBufferVo} bufferVo 필수 파일 정의이며 context의 bufferId와 일치해야 하고 원본을 변경하지 않음
     * @param {import('./vo/UA3FDataVos.js').UA3FLayoutVo} layoutVo 필수 공용 배치이며 작은 정의는 사본으로 고정하고 원본을 변경하지 않음
     * @param {ArrayBuffer} arrayBuffer 양수 바이트 길이의 고정·미분리 입력이며 워커가 읽는 동안 호출자의 변경·분리 금지, 기본적으로 실제 전송 시 소유권 이전
     * @param {UA3FTaskManagerDecodeOptions} [opt={}] 해시 검사와 입력 전송 설정(두 항목의 기본값은 true)
     * @returns {Promise<import('./vo/UA3FDataVos.js').UA3FDecodedBufferVo>} 숫자 복사 없이 같은 반환 버퍼를 공유하는 결과, 실패·취소는 거부
     */
    decode(contextVo: UA3FTaskContextVo, bufferVo: UA3FBufferVo, layoutVo: UA3FLayoutVo, arrayBuffer: ArrayBuffer, opt?: UA3FTaskManagerDecodeOptions): Promise<UA3FDecodedBufferVo>;
    /**
     * 워커에서 새 바이너리를 만들며 기본적으로 메인의 입력 배열을 보존합니다. <br>
     * 전송 옵션이 true이면 부분 view를 포함한 기반 버퍼 전체가 이전되며 이를 공유하는 모든 view가 분리됩니다. <br>
     * 취소는 실행 중인 처리를 중단하지 않으므로 취소만으로 입력 버퍼를 다시 사용할 수 있다고 가정하면 안 됩니다.
     *
     * @param {import('./vo/UA3FDataVos.js').UA3FTaskContextVo} contextVo 작업 문맥(frameIndex는 0 기반)
     * @param {import('./vo/UA3FDataVos.js').UA3FLayoutVo} layoutVo 필수 출력 배치이며 원본을 변경하지 않고 정의 사본을 만듦
     * @param {Array<import('./vo/UA3FDataVos.js').UA3FDecodedArrayVo>} arrays 필수 필드별 숫자 view이며 부분 view 허용, 워커가 읽는 동안 호출자의 입력 변경·분리 금지
     * @param {UA3FTaskManagerEncodeOptions} [opt={}] 입력 버퍼 전송 설정(transferInput 기본값 false)
     * @returns {Promise<ArrayBuffer>} 호출자가 소유하는 새 바이너리 버퍼
     */
    encode(contextVo: UA3FTaskContextVo, layoutVo: UA3FLayoutVo, arrays: Array<UA3FDecodedArrayVo>, opt?: UA3FTaskManagerEncodeOptions): Promise<ArrayBuffer>;
    /**
     * 미완료 요청을 한 번 취소하며 이미 실행 중인 물리 슬롯은 유지합니다.
     *
     * @param {string} taskId 비어 있지 않은 작업 식별자이며 null 불가
     * @returns {boolean} 처음 취소했으면 true, 없거나 이미 종결했으면 false
     */
    cancel(taskId: string): boolean;
    /**
     * 논리 취소와 구분하여 입력 참조와 물리 슬롯의 실제 종료를 기다립니다.
     *
     * @param {string} taskId 종결을 기다릴 작업 ID
     * @returns {Promise<void>} 큐 제거·실제 응답·풀 종료로 물리 보유가 끝났을 때 완료
     */
    whenTaskSettled(taskId: string): Promise<void>;
    /**
     * 요청 세대를 증가시키고 이전 프레임 작업을 취소합니다.
     *
     * @returns {number} 증가한 0 이상의 안전 정수 세대
     */
    advanceGeneration(): number;
    /**
     * 세대를 같거나 큰 값으로 갱신하고 이전 숫자 세대의 요청을 취소합니다.
     *
     * @param {number} value 현재 값 이상인 안전 정수이며 기본 세대는 0, null 불가, null 세대의 공용 작업은 보존
     */
    set generation(value: number);
    /**
     * 현재 요청 세대를 반환합니다.
     *
     * @returns {number} 현재 프레임 요청에 적용하는 0 이상의 안전 정수 세대
     */
    get generation(): number;
    /**
     * 모든 논리 요청을 종결하고 소유 워커 풀을 한 번 해제합니다. <br>
     * 물리 작업 기록은 실제 응답 또는 풀 종료 성공까지 유지합니다.
     *
     * @returns {Promise<void>} 반복 호출이 공유하는 해제 결과이며 해제한 Manager는 재사용 불가
     */
    dispose(): Promise<void>;
    /**
     * 등록 전 비어 있는 문맥 Map만 수용하여 실행 자료의 임의 교체를 막습니다.
     *
     * @param {Map<string, import('./vo/UA3FDataVos.js').UA3FTaskContextVo>} value 빈 Map만 허용, null 불가, 입력 Map을 보관하거나 변경하지 않음
     */
    set taskMap(value: Map<string, UA3FTaskContextVo>);
    /**
     * 작업 문맥의 사본 Map을 반환하며 내부 실행 자료는 노출하지 않습니다.
     *
     * @returns {Map<string, import('./vo/UA3FDataVos.js').UA3FTaskContextVo>} 각 문맥도 사본인 조회 목록
     */
    get taskMap(): Map<string, UA3FTaskContextVo>;
    /**
     * 워커 처리기의 임의 교체를 거부합니다. <br>
     * 현재 값과 동일한 값만 허용하며 실제 상태 변경은 작업 관리 API로 수행합니다.
     *
     * @param {import('@union3d/core/UTaskProcessor').UTaskProcessor | null} value 관리자가 소유한 처리기 참조이며 첫 전송 전에는 null, 외부 해제 금지이며 현재 값과 동일한 값만 허용
     */
    set taskProcessor(value: UTaskProcessor | null);
    /**
     * 관리자가 소유한 워커 처리기를 반환합니다.
     *
     * @returns {import('@union3d/core/UTaskProcessor').UTaskProcessor | null} 관리자가 소유한 처리기 참조이며 첫 전송 전에는 null, 외부 해제 금지
     */
    get taskProcessor(): UTaskProcessor | null;
    /**
     * 작업 등록 순번의 임의 교체를 거부합니다. <br>
     * 현재 값과 동일한 값만 허용하며 실제 상태 변경은 작업 관리 API로 수행합니다.
     *
     * @param {number} value 지금까지 등록한 작업의 마지막 순번이며 등록 전에는 0이며 현재 값과 동일한 값만 허용
     */
    set sequence(value: number);
    /**
     * 마지막 작업 등록 순번을 반환합니다.
     *
     * @returns {number} 지금까지 등록한 작업의 마지막 순번이며 등록 전에는 0
     */
    get sequence(): number;
    /**
     * 해제 시작 여부의 임의 교체를 거부합니다. <br>
     * 현재 값과 동일한 값만 허용하며 실제 상태 변경은 작업 관리 API로 수행합니다.
     *
     * @param {boolean} value 해제가 시작되었으면 true이며 현재 값과 동일한 값만 허용
     */
    set disposed(value: boolean);
    /**
     * 해제 시작 여부를 반환합니다.
     *
     * @returns {boolean} 해제가 시작되었으면 true
     */
    get disposed(): boolean;
    /**
     * 해제 결과의 임의 교체를 거부합니다. <br>
     * 현재 값과 동일한 값만 허용하며 실제 상태 변경은 작업 관리 API로 수행합니다.
     *
     * @param {Promise<void> | null} value dispose 호출이 공유하는 Promise 참조이며 호출 전에는 null이며 현재 값과 동일한 값만 허용
     */
    set disposePromise(value: Promise<void> | null);
    /**
     * 워커 풀의 해제 결과를 반환합니다.
     *
     * @returns {Promise<void> | null} dispose 호출이 공유하는 Promise 참조이며 호출 전에는 null
     */
    get disposePromise(): Promise<void> | null;
    /**
     * 대기열 처리 상태의 임의 교체를 거부합니다. <br>
     * 현재 값과 동일한 값만 허용하며 실제 상태 변경은 작업 관리 API로 수행합니다.
     *
     * @param {boolean} value 대기열을 동기적으로 처리하는 중이면 true이며 현재 값과 동일한 값만 허용
     */
    set pumpRunning(value: boolean);
    /**
     * 대기열 처리 중 여부를 반환합니다.
     *
     * @returns {boolean} 대기열을 동기적으로 처리하는 중이면 true
     */
    get pumpRunning(): boolean;
    /**
     * 취소 후 실제 응답을 기다리는 작업도 포함한 실행 슬롯 수를 계산합니다.
     *
     * @returns {number} 취소 후 응답 대기를 포함한 현재 실행 슬롯 수
     */
    get activeTaskCount(): number;
    /**
     * 실행 전 대기 작업 수를 계산합니다.
     *
     * @returns {number} 실행 전 대기 작업 개수
     */
    get queuedTaskCount(): number;
    /**
     * 실행 중 입력을 제외한 대기 backing buffer 바이트 수를 계산합니다.
     *
     * @returns {number} 요청별로 중복을 제거한 대기 입력 기반 버퍼의 바이트 합계
     */
    get queuedByteLength(): number;
    #private;
}

/**
 * 외부 metadata JSON 한 문서를 읽고 A3F 공간 정의를 정규화합니다.
 *
 * @group A3F
 * @summary 외부 metadata JSON 한 문서를 읽고 A3F 공간 정의를 정규화합니다.
 */
declare class UA3FMetadataLoader {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FMetadataLoader 클래스 생성자입니다. <br>
     * 통신 함수를 보관하며 I/O와 숫자 버퍼 읽기를 시작하지 않습니다.
     *
     * @param {UA3FMetadataLoaderCO} [opt={}] 선택 통신 설정, null 불가, 원본 변경 없음
     */
    constructor(opt?: UA3FMetadataLoaderCO);
    /** @type {typeof fetch} */
    _fetchFunction: typeof fetch;
    /** @type {WeakMap<import('./vo/UA3FSceneVos.js').UA3FMetadataVo, number>} */
    _byteLengths: WeakMap<UA3FMetadataVo, number>;
    /**
     * 한 JSON을 제한된 길이로 읽고 공간·프레임 참조를 반환합니다. <br>
     * 파일 해시 검사는 UTF-8 해석 전 raw bytes에 적용하고 상대 주소는 redirect 후 응답 URL을 기준으로 합니다.
     *
     * @param {string} metadataUrl 절대 metadata URL, null 불가
     * @param {import('./vo/UA3FSceneVos.js').UA3FChildMetadataVo | null} expectedChildVo 부모의 기대 참조 또는 루트 요청의 null, 변경하지 않음
     * @param {AbortSignal} signal 이 HTTP의 취소 신호, null 불가
     * @param {number} maxBytes 읽을 raw JSON의 양의 안전 정수 바이트 상한
     * @returns {Promise<import('./vo/UA3FSceneVos.js').UA3FMetadataVo>} 독립 JSON과 정규화된 공간 메타정보, 실패는 원래 오류 전달
     */
    load(metadataUrl: string, expectedChildVo: UA3FChildMetadataVo | null, signal: AbortSignal, maxBytes: number): Promise<UA3FMetadataVo>;
    /**
     * 이 로더가 읽은 문서의 실제 raw 바이트 길이를 반환합니다. <br>
     * VO에 포맷 외 필드를 추가하지 않고 약한 참조로 길이를 보관합니다.
     *
     * @param {import('./vo/UA3FSceneVos.js').UA3FMetadataVo} metadataVo 이 로더에서 반환받은 문서, 변경하지 않음
     * @returns {number} 압축 해제된 UTF-8 JSON의 실제 바이트 길이
     */
    getByteLength(metadataVo: UA3FMetadataVo): number;
    /**
     * 관리 상태의 외부 교체를 거부합니다.
     *
     * @param {typeof fetch} value 빌린 통신 함수, 기존 값 또는 참조와 동일한 경우만 허용
     */
    set fetchFunction(value: typeof fetch);
    /**
     * 빌린 통신 함수 값을 반환합니다.
     *
     * @returns {typeof fetch} 빌린 통신 함수
     */
    get fetchFunction(): typeof fetch;
    /**
     * 관리 상태의 외부 교체를 거부합니다.
     *
     * @param {WeakMap<import('./vo/UA3FSceneVos.js').UA3FMetadataVo, number>} value 반환 문서별 raw 길이의 약한 조회표, 외부 변경 금지, 기존 값 또는 참조와 동일한 경우만 허용
     */
    set byteLengths(value: WeakMap<UA3FMetadataVo, number>);
    /**
     * 반환 문서별 raw 길이의 약한 조회표, 외부 변경 금지 값을 반환합니다.
     *
     * @returns {WeakMap<import('./vo/UA3FSceneVos.js').UA3FMetadataVo, number>} 반환 문서별 raw 길이의 약한 조회표, 외부 변경 금지
     */
    get byteLengths(): WeakMap<UA3FMetadataVo, number>;
    #private;
}

export { UA3FArrayLayoutVo, UA3FArrayStatisticsVo, UA3FBufferVo, UA3FCacheBudgetOptionsVo, UA3FCacheBudgetStatusVo, UA3FChildMetadataVo, UA3FCoordinateVo, UA3FDecodedArrayVo, UA3FDecodedBufferVo, UA3FFieldVo, UA3FFlowOptionsVo, UA3FFrameCacheOptionsVo, UA3FFrameCacheStatusVo, UA3FFrameLeaseVo, UA3FFrameResourceVo, UA3FFrameVo, UA3FGeometryResultVo, UA3FGeometryVo, UA3FHeightDisplayVo, UA3FHeightPolicyVo, UA3FLayoutVo, UA3FMetadataLoader, UA3FMetadataVo, UA3FNodeVo, UA3FParticleFlowOptionsVo, UA3FSpatialOptionsVo, UA3FSpatialSelectionVo, UA3FSpatialViewVo, UA3FTaskContextVo, UA3FTaskManager, UA3FTimelineOptionsVo, UA3FTimelineStateVo, UA3FVectorFieldVo };
