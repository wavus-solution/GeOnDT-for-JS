/**
 * 시간·날짜·프레임 표시축을 독립 값으로 보관합니다.
 */
declare class UTimelineAxisVo {
    /**
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * UTimelineAxisVo 클래스 생성자입니다. <br>
     * 일반 객체 또는 동일 VO의 값을 복사하여 기본 상태를 구성합니다.
     *
     * @param {UTimelineAxisVoCO | import('./UTimelineAxisVo.js').UTimelineAxisVo} [opt={}] 복사할 설정 원본입니다. <br>
     * 읽기 전용 원본입니다. <br>
     * 기본값은 빈 객체이며 null 불가
     */
    constructor(opt?: UTimelineAxisVoCO | UTimelineAxisVo);
    _mode: UTimelineAxisMode;
    _start: number;
    _end: number;
    _unit: string;
    _epoch: string | null;
    /**
     * 표시축 종류를 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {UTimelineAxisMode} value 표시축 종류입니다.
     */
    set mode(value: UTimelineAxisMode);
    /**
     * 표시축 종류를 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {UTimelineAxisMode} 표시축 종류입니다.
     */
    get mode(): UTimelineAxisMode;
    /**
     * 표시축 시작 위치를 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {number} value 표시축 시작 위치입니다. <br>
     * 자료형 number입니다. <br>
     * 시간축은 기준 날짜부터 상대 초이고 프레임축은 0 기반 위치입니다. <br>
     * 유한 숫자이며 프레임축은 0입니다. <br>
     * 호출자 원본을 변경하거나 자원을 소유하지 않습니다.
     */
    set start(value: number);
    /**
     * 표시축 시작 위치를 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {number} 표시축 시작 위치입니다.
     */
    get start(): number;
    /**
     * 표시축 종료 위치를 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {number} value 표시축 종료 위치입니다. <br>
     * 유한 숫자입니다. <br>
     * 시간축은 상대 초이고 프레임축은 마지막 0 기반 안전 정수 위치입니다. <br>
     * 호출자 원본을 변경하거나 자원을 소유하지 않습니다.
     */
    set end(value: number);
    /**
     * 표시축 종료 위치를 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {number} 표시축 종료 위치입니다.
     */
    get end(): number;
    /**
     * 표시축 단위를 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {string} value 표시축 단위입니다. <br>
     * 프레임축은 frame입니다. <br>
     * A3F 원본 수치 시간 단위는 변경하지 않습니다. <br>
     * 호출자 원본을 변경하거나 자원을 소유하지 않습니다.
     */
    set unit(value: string);
    /**
     * 표시축 단위를 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {string} 표시축 단위입니다.
     */
    get unit(): string;
    /**
     * 표시 기준 날짜를 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {string | null} value 표시 기준 날짜입니다. <br>
     * 자료형 string | null입니다. <br>
     * absoluteTime에서만 시간대가 있는 ISO 8601 날짜 문자열이며 나머지 축은 null입니다. <br>
     * 날짜 계산은 연결기와 View가 담당합니다. <br>
     * 호출자 원본을 변경하거나 자원을 소유하지 않습니다.
     */
    set epoch(value: string | null);
    /**
     * 표시 기준 날짜를 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {string | null} 표시 기준 날짜입니다.
     */
    get epoch(): string | null;
}

/**
 * 현재 허용하는 재생·탐색 입력을 원시 boolean 값으로 전달합니다.
 */
declare class UTimelineCapabilitiesVo {
    /**
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * UTimelineCapabilitiesVo 클래스 생성자입니다. <br>
     * 일반 객체 또는 동일 VO의 값을 복사하여 기본 상태를 구성합니다.
     *
     * @param {UTimelineCapabilitiesVoCO | import('./UTimelineCapabilitiesVo.js').UTimelineCapabilitiesVo} [opt={}] 복사할 설정 원본입니다. <br>
     * 읽기 전용 원본입니다. <br>
     * 기본값은 빈 객체이며 null 불가
     */
    constructor(opt?: UTimelineCapabilitiesVoCO | UTimelineCapabilitiesVo);
    _canPlay: boolean;
    _canPause: boolean;
    _canSeek: boolean;
    _canReverse: boolean;
    _canStep: boolean;
    _canChangeRate: boolean;
    /**
     * 재생 가능 여부를 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {boolean} value 재생 가능 여부입니다. <br>
     * 자료형 boolean입니다. <br>
     * boolean 값이며 기본 false입니다. <br>
     * 현재 상태에서 허용하는 입력만 true로 전달합니다. <br>
     * 호출자 원본을 변경하거나 자원을 소유하지 않습니다.
     */
    set canPlay(value: boolean);
    /**
     * 재생 가능 여부를 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {boolean} 재생 가능 여부입니다.
     */
    get canPlay(): boolean;
    /**
     * 일시정지 가능 여부를 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {boolean} value 일시정지 가능 여부입니다. <br>
     * 자료형 boolean입니다. <br>
     * boolean 값이며 기본 false입니다. <br>
     * 현재 상태에서 허용하는 입력만 true로 전달합니다. <br>
     * 호출자 원본을 변경하거나 자원을 소유하지 않습니다.
     */
    set canPause(value: boolean);
    /**
     * 일시정지 가능 여부를 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {boolean} 일시정지 가능 여부입니다.
     */
    get canPause(): boolean;
    /**
     * 탐색 가능 여부를 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {boolean} value 탐색 가능 여부입니다. <br>
     * 자료형 boolean입니다. <br>
     * boolean 값이며 기본 false입니다. <br>
     * 현재 상태에서 허용하는 입력만 true로 전달합니다. <br>
     * 호출자 원본을 변경하거나 자원을 소유하지 않습니다.
     */
    set canSeek(value: boolean);
    /**
     * 탐색 가능 여부를 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {boolean} 탐색 가능 여부입니다.
     */
    get canSeek(): boolean;
    /**
     * 역방향 가능 여부를 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {boolean} value 역방향 가능 여부입니다. <br>
     * 자료형 boolean입니다. <br>
     * boolean 값이며 기본 false입니다. <br>
     * 현재 상태에서 허용하는 입력만 true로 전달합니다. <br>
     * 호출자 원본을 변경하거나 자원을 소유하지 않습니다.
     */
    set canReverse(value: boolean);
    /**
     * 역방향 가능 여부를 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {boolean} 역방향 가능 여부입니다.
     */
    get canReverse(): boolean;
    /**
     * 이전·다음 이동 가능 여부를 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {boolean} value 이전·다음 이동 가능 여부입니다. <br>
     * 자료형 boolean입니다. <br>
     * boolean 값이며 기본 false입니다. <br>
     * 현재 상태에서 허용하는 입력만 true로 전달합니다. <br>
     * 호출자 원본을 변경하거나 자원을 소유하지 않습니다.
     */
    set canStep(value: boolean);
    /**
     * 이전·다음 이동 가능 여부를 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {boolean} 이전·다음 이동 가능 여부입니다.
     */
    get canStep(): boolean;
    /**
     * 배속 변경 가능 여부를 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {boolean} value 배속 변경 가능 여부입니다. <br>
     * 자료형 boolean입니다. <br>
     * boolean 값이며 기본 false입니다. <br>
     * 현재 상태에서 허용하는 입력만 true로 전달합니다. <br>
     * 호출자 원본을 변경하거나 자원을 소유하지 않습니다.
     */
    set canChangeRate(value: boolean);
    /**
     * 배속 변경 가능 여부를 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {boolean} 배속 변경 가능 여부입니다.
     */
    get canChangeRate(): boolean;
}

/**
 * 자료 식별·시간축·요청 위치와 실제 표시 완료 위치·재생 상태를 독립 사본으로 전달합니다.
 */
declare class UTimelineStateVo {
    /**
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * UTimelineStateVo 클래스 생성자입니다. <br>
     * 일반 객체 또는 동일 VO의 값을 복사하여 기본 상태를 구성합니다.
     *
     * @param {UTimelineStateVoCO | import('./UTimelineStateVo.js').UTimelineStateVo} [opt={}] 복사할 설정 원본입니다. <br>
     * 읽기 전용 원본입니다. <br>
     * 기본값은 빈 객체이며 null 불가
     */
    constructor(opt?: UTimelineStateVoCO | UTimelineStateVo);
    _axis: UTimelineAxisVo;
    _sourceKey: string | null;
    _revision: number;
    _requestedPosition: number | null;
    _displayedPosition: number | null;
    _playing: boolean;
    _playbackRate: number;
    _status: UTimelineStatus;
    _capabilities: UTimelineCapabilitiesVo;
    _errorMessage: string | null;
    /**
     * 표시축 사본을 독립 사본으로 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {UTimelineAxisVoCO | import('./UTimelineAxisVo.js').UTimelineAxisVo} value 표시축 사본입니다. <br>
     * 자료형 UTimelineAxisVoCO | UTimelineAxisVo입니다. <br>
     * UTimelineAxisVo 또는 생성 옵션이며 null을 허용하지 않습니다. <br>
     * 입력과 getter 반환값을 중첩 복사합니다. <br>
     * 호출자 원본을 변경하거나 자원을 소유하지 않습니다.
     */
    set axis(value: UTimelineAxisVoCO | UTimelineAxisVo);
    /**
     * 표시축 사본을 중첩 복사하여 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {import('./UTimelineAxisVo.js').UTimelineAxisVo} 표시축 사본입니다.
     */
    get axis(): UTimelineAxisVo;
    /**
     * 현재 자료 식별 키를 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {string | null} value 현재 자료 식별 키입니다. <br>
     * 자료형 string | null입니다. <br>
     * 비어 있지 않은 string 또는 자료 미연결 null입니다. <br>
     * 자료 교체를 구분하고 엔진 자원을 보관하지 않습니다. <br>
     * 호출자 원본을 변경하거나 자원을 소유하지 않습니다.
     */
    set sourceKey(value: string | null);
    /**
     * 현재 자료 식별 키를 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {string | null} 현재 자료 식별 키입니다.
     */
    get sourceKey(): string | null;
    /**
     * 상태 세대를 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {number} value 상태 세대입니다. <br>
     * 자료형 number입니다. <br>
     * 0 이상 안전 정수이며 같은 자료의 상태 순서를 구분합니다. <br>
     * 증가 정책은 연결기가 담당합니다. <br>
     * 호출자 원본을 변경하거나 자원을 소유하지 않습니다.
     */
    set revision(value: number);
    /**
     * 상태 세대를 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {number} 상태 세대입니다.
     */
    get revision(): number;
    /**
     * 요청한 표시축 위치를 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {number | null} value 요청한 표시축 위치입니다. <br>
     * 자료형 number | null입니다. <br>
     * axis 범위의 유한 숫자 또는 준비 전 null입니다. <br>
     * 프레임축 재생 커서는 소수 위치도 허용합니다. <br>
     * 호출자 원본을 변경하거나 자원을 소유하지 않습니다.
     */
    set requestedPosition(value: number | null);
    /**
     * 요청한 표시축 위치를 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {number | null} 요청한 표시축 위치입니다.
     */
    get requestedPosition(): number | null;
    /**
     * 실제 적용한 표시축 위치를 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {number | null} value 실제 적용한 표시축 위치입니다. <br>
     * 자료형 number | null입니다. <br>
     * axis 범위의 유한 숫자 또는 아직 표시되지 않은 null입니다. <br>
     * 프레임축은 0 기반 안전 정수 목록 위치입니다. <br>
     * 호출자 원본을 변경하거나 자원을 소유하지 않습니다.
     */
    set displayedPosition(value: number | null);
    /**
     * 실제 적용한 표시축 위치를 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {number | null} 실제 적용한 표시축 위치입니다.
     */
    get displayedPosition(): number | null;
    /**
     * 재생 의도를 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {boolean} value 재생 의도입니다.
     */
    set playing(value: boolean);
    /**
     * 재생 의도를 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {boolean} 재생 의도입니다.
     */
    get playing(): boolean;
    /**
     * 재생 배속을 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {number} value 재생 배속입니다. <br>
     * 자료형 number입니다. <br>
     * 유한 number이며 음수는 역방향
     */
    set playbackRate(value: number);
    /**
     * 재생 배속을 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {number} 재생 배속입니다.
     */
    get playbackRate(): number;
    /**
     * 재생 처리 상태를 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {UTimelineStatus} value 재생 처리 상태입니다.
     */
    set status(value: UTimelineStatus);
    /**
     * 재생 처리 상태를 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {UTimelineStatus} 재생 처리 상태입니다.
     */
    get status(): UTimelineStatus;
    /**
     * 지원 입력 사본을 독립 사본으로 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {UTimelineCapabilitiesVoCO | import('./UTimelineCapabilitiesVo.js').UTimelineCapabilitiesVo} value 지원 입력 사본입니다. <br>
     * 자료형 UTimelineCapabilitiesVoCO | UTimelineCapabilitiesVo입니다. <br>
     * UTimelineCapabilitiesVo 또는 생성 옵션이며 null 불가입니다. <br>
     * 입력과 getter 반환값을 중첩 복사합니다. <br>
     * 호출자 원본을 변경하거나 자원을 소유하지 않습니다.
     */
    set capabilities(value: UTimelineCapabilitiesVoCO | UTimelineCapabilitiesVo);
    /**
     * 지원 입력 사본을 중첩 복사하여 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {import('./UTimelineCapabilitiesVo.js').UTimelineCapabilitiesVo} 지원 입력 사본입니다.
     */
    get capabilities(): UTimelineCapabilitiesVo;
    /**
     * 화면용 오류 설명을 보관합니다. <br>
     * 의미 검증과 backend 적용은 포트 경계가 담당합니다.
     *
     * @param {string | null} value 화면용 오류 설명입니다. <br>
     * 자료형 string | null입니다. <br>
     * string 또는 오류 없음 null이며 Error·Clock·DOM 등 실행 자원을 포함하지 않습니다. <br>
     * 호출자 원본을 변경하거나 자원을 소유하지 않습니다.
     */
    set errorMessage(value: string | null);
    /**
     * 화면용 오류 설명을 반환합니다. <br>
     * 실행 상태는 변경하지 않습니다.
     *
     * @returns {string | null} 화면용 오류 설명입니다.
     */
    get errorMessage(): string | null;
}

export { UTimelineAxisVo, UTimelineCapabilitiesVo, UTimelineStateVo };
