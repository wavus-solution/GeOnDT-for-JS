import { UTimelineStateVo, UTimelineAxisVo } from './BSwjxfuO.js';

/**
 * 공통 재생 포트의 상태를 HTML 시간축과 재생 조작 버튼으로 표시합니다. <br>
 * 재생·탐색 입력은 포트에 전달하며, 자체 재생 루프나 자료 로딩을 실행하지 않습니다.
 */
declare class UTimelineView {
    /**
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * UTimelineView 클래스 생성자입니다. <br>
     * 컨테이너와 재생 포트를 검사하며 화면 부착은 mount에서 수행합니다.
     *
     * @param {UTimelineViewCO} opt 같은 문서의 서로 다른 두 컨테이너와 재생 포트, 선택적인 표시용 시계
     */
    constructor(opt: UTimelineViewCO);
    _animationContainer: HTMLElement;
    _timelineContainer: HTMLElement;
    _playbackPort: UTimelinePlaybackPort;
    _borrowedClock: UTimelineClock | null;
    _cleanupRunning: boolean;
    /** @type {UTimelineRuntime} */
    _runtime: UTimelineRuntime;
    /**
     * 초기 상태를 검증하고 자기 위젯·구독을 한 번 부착합니다. <br>
     * 부착 실패 시 취득한 자원을 역순 정리하고 실패한 인스턴스를 종료합니다.
     */
    mount(): void;
    /**
     * 전체 표시축을 맞춥니다. <br>
     * 0 길이 축은 앞뒤 1초로 확대하며 실제 backend 재생 범위는 변경하지 않습니다.
     */
    fit(): void;
    /**
     * 현재 크기로 소유 위젯만 갱신합니다. <br>
     * 부착 전과 해제 후에는 아무 작업도 하지 않습니다.
     */
    resize(): void;
    /**
     * 새 입력과 늦은 완료를 영구 차단하고 자기 자원을 역순 정리합니다. <br>
     * 정리에 실패하면 AggregateError를 던지며 다음 호출에서 실패한 정리만 재시도합니다. <br>
     * 전달받은 시계·재생 포트·컨테이너와 그 기존 자식은 해제하지 않습니다.
     */
    dispose(): void;
    _runCleanups(): unknown[];
    _clearResources(): void;
    /**
     * 이미 종료된 HTML 객체는 중복 destroy하지 않고 미완료 native만 재시도합니다. <br>
     * 첫 실패 오류는 호출자에게 그대로 전달합니다.
     *
     * @param {{ destroy: function():void; } & Partial<{ isDestroyed: function():boolean; }>} widget 소유 위젯
     */
    _destroyWidget(widget: {
        destroy: () => void;
    } & Partial<{
        isDestroyed: () => boolean;
    }>): void;
    /**
     * 내부 종료 상태의 외부 교체를 거부합니다.
     *
     * @param {boolean} value 직접 대입할 값, 항상 오류를 던지므로 dispose를 사용해야 함
     */
    set cleanupRunning(value: boolean);
    /**
     * 동기 종료 작업의 재진입 차단 상태를 반환합니다.
     *
     * @returns {boolean} 동기 종료 작업의 재진입 차단 상태
     */
    get cleanupRunning(): boolean;
    /**
     * 서로 다른 동일 문서의 DOM 요소인지 검사합니다. <br>
     * 외부 자식과 스타일은 변경하지 않습니다.
     *
     * @param {HTMLElement} animationContainer 재생 다이얼을 부착할 컨테이너(ownerDocument.defaultView 필요)
     * @param {HTMLElement} timelineContainer 시간축 부착 위치입니다.
     */
    _validateContainers(animationContainer: HTMLElement, timelineContainer: HTMLElement): void;
    _createHosts(): void;
    /** @param {import('../vo/UTimelineStateVo.js').UTimelineStateVo} state 초기 표시 상태입니다. */
    _createClock(state: UTimelineStateVo): void;
    /** HTML 요소만 만들며 독립 시계·RAF·재생 루프는 만들지 않습니다. */
    _createWidgets(): void;
    /** 입력·포트 구독·크기 변경만 소유하고 역순 해제 함수를 보관합니다. */
    _connect(): void;
    _connectResize(): void;
    /**
     * 구독 상태를 검증하고 표시합니다. <br>
     * 잘못된 통지는 마지막 유효 상태를 보존하고 timelineerror로 보고합니다.
     *
     * @param {import('../vo/UTimelineStateVo.js').UTimelineStateVo} value 구독으로 전달받은 상태 사본
     */
    _onState(value: UTimelineStateVo): void;
    /**
     * 오래된 같은 자료의 상태를 거부하고 축·Clock·커서를 동기화합니다. <br>
     * 자체 표시용 시계의 시작·종료 값은 새 축에 맞추되 전달받은 시계의 범위는 유지합니다. <br>
     * 자료나 축이 바뀌면 이전 UI 명령 세대를 무효화합니다.
     *
     * @param {import('../vo/UTimelineStateVo.js').UTimelineStateVo} state 검증한 다음 상태입니다.
     */
    _acceptState(state: UTimelineStateVo): void;
    _renderAvailability(): void;
    /**
     * 사용자 위젯 날짜를 표시축 위치로 변환하여 한 번 탐색합니다. <br>
     * Clock 동기화 중 되돌아온 settime은 새 명령으로 처리하지 않으며 프레임축은 범위 내 정수 목록 위치로 반올림합니다.
     *
     * @param {UTimelineSeekEvent} event HTML 탐색 입력입니다.
     */
    _onSeek(event: UTimelineSeekEvent): void;
    /**
     * 탐색 명령의 완료·실패를 현재 UI 세대에만 반영합니다. <br>
     * 동기 예외와 Promise 거절을 모두 처리합니다.
     *
     * @param {number} position 검증한 탐색 위치(상대 초 또는 0 기반 정수 프레임)
     */
    _seek(position: number): Promise<void>;
    _queueAnimation(): void;
    /**
     * 자료 교체 전 예약된 재생 입력을 무시하고 현재 입력만 명령으로 전달합니다.
     *
     * @param {number} sourceGeneration 입력 예약 시점의 자료 세대
     */
    _flushAnimation(sourceGeneration: number): void;
    /**
     * 배속 설정 후 재생·정지를 순서대로 전달하고 최신 명령의 완료만 표시합니다. <br>
     * 0 배속은 pause로 처리합니다.
     *
     * @param {number} rate 재생 배속(음수는 canReverse 필요, 0은 정지 명령으로 처리)
     * @param {boolean} playing 입력 재생 의도입니다.
     */
    _applyAnimation(rate: number, playing: boolean): Promise<void>;
    _restoreAnimation(): void;
    /**
     * 현재 상태와 capability로 입력 허용 여부를 확인합니다. <br>
     * buffering 중 탐색·정지는 backend capability를 따릅니다.
     *
     * @param {string} action 확인할 입력 종류입니다.
     * @returns {boolean} 현재 입력 가능 여부입니다.
     */
    _allowed(action: string): boolean;
    /**
     * 지원하지 않는 다이얼 명령을 native Clock 변경 전에 취소합니다. <br>
     * 역방향은 canReverse도 확인합니다.
     *
     * @param {string} action 다이얼 명령 종류입니다.
     * @param {UTimelineCommandEvent} event 명령 실행 전 이벤트입니다.
     */
    _guardCommand(action: string, event: UTimelineCommandEvent): void;
    /**
     * 현재 날짜로 이동하는 HTML 실시간 명령을 차단하여 자료 시간축을 유지합니다.
     *
     * @param {UTimelineCommandEvent} event 실시간 이동 명령 이벤트입니다.
     */
    _blockRealtime(event: UTimelineCommandEvent): void;
    /**
     * 자료 교체와 더 최신 입력을 구분할 명령 세대를 발급합니다.
     *
     * @returns {UTimelineCommandTicket} 현재 UI 명령의 독립 세대입니다.
     */
    _ticket(): UTimelineCommandTicket;
    /**
     * 해제·자료 교체·후속 입력 뒤에 도착한 완료와 오류를 거부합니다.
     *
     * @param {UTimelineCommandTicket} ticket 확인할 명령 세대입니다.
     * @returns {boolean} 현재 명령이면 true입니다.
     */
    _current(ticket: UTimelineCommandTicket): boolean;
    /**
     * 현재 명령의 성공 뒤 backend 상태를 읽고 표시합니다. <br>
     * 과거 명령은 상태 조회도 하지 않습니다.
     *
     * @param {UTimelineCommandTicket} ticket 완료한 명령 세대입니다.
     */
    _complete(ticket: UTimelineCommandTicket): void;
    /** @param {number} position 표시축 위치입니다. @returns {number} 동일한 숫자 위치입니다. */
    _date(position: number): number;
    /** @param {number} value 입력한 표시축 위치입니다. @returns {number} 검증한 위치입니다. */
    _position(value: number): number;
    /** @param {number} start 시작 위치입니다. @param {number} end 끝 위치입니다. @param {import('../vo/UTimelineAxisVo.js').UTimelineAxisVo} axis 표시축입니다. */
    _checkDates(start: number, end: number, axis: UTimelineAxisVo): void;
    /** @param {number} start 시작 위치입니다. @param {number} end 끝 위치입니다. */
    _checkBorrowedRange(start: number, end: number): void;
    /**
     * 프레임 축에서는 유효한 정수 목록 위치에만 1 기반 순번을 표시하여 같은 프레임 문구의 반복을 막습니다. <br>
     * 시간축과 다이얼의 표시 형식은 유지합니다.
     *
     * @param {number} date 눈금에 표시할 날짜
     * @returns {string} 시간 또는 정수 프레임 눈금입니다.
     */
    _formatLabel(date: number): string;
    /**
     * 시간축은 상대 초 또는 UTC, 프레임축은 사용자에게 1 기반 순번으로 표시합니다.
     *
     * @param {number} date HTML에 표시할 날짜
     * @returns {string} 시간 또는 프레임 라벨입니다.
     */
    _formatTime(date: number): string;
    /** @param {number} position 표시축 위치입니다. @returns {string} 날짜 또는 축 이름입니다. */
    _formatDate(position: number): string;
    /**
     * UI 오류를 lastError와 timelineerror 이벤트로 보고합니다. <br>
     * 이벤트는 backend 상태와 분리하며 해제 후 오류는 폐기합니다.
     *
     * @param {unknown} error 발생한 원래 오류입니다.
     */
    _reportError(error: unknown): void;
    /**
     * 전역 window 대신 빌린 컨테이너의 문서를 기준으로 크기 감시와 오류 이벤트를 생성합니다.
     *
     * @returns {Window & typeof globalThis} 컨테이너 문서의 브라우저입니다.
     */
    _window(): Window & typeof globalThis;
    _alive(): void;
    _mounted(): void;
    /**
     * 빌린 다이얼 컨테이너의 직접 교체를 거부하고 생성·부착·해제 메서드의 수명 경계를 유지합니다.
     *
     * @param {HTMLElement} value 대입할 값(직접 변경 불가)
     */
    set animationContainer(value: HTMLElement);
    /**
     * 빌린 다이얼 컨테이너을 반환합니다. <br>
     * 자원 참조는 읽기 전용으로 빌리며 직접 해제하지 않습니다.
     *
     * @returns {HTMLElement} 빌린 다이얼 컨테이너입니다.
     */
    get animationContainer(): HTMLElement;
    /**
     * 빌린 시간축 컨테이너의 직접 교체를 거부하고 생성·부착·해제 메서드의 수명 경계를 유지합니다.
     *
     * @param {HTMLElement} value 대입할 값(직접 변경 불가)
     */
    set timelineContainer(value: HTMLElement);
    /**
     * 빌린 시간축 컨테이너을 반환합니다. <br>
     * 자원 참조는 읽기 전용으로 빌리며 직접 해제하지 않습니다.
     *
     * @returns {HTMLElement} 빌린 시간축 컨테이너입니다.
     */
    get timelineContainer(): HTMLElement;
    /**
     * 빌린 재생 포트의 직접 교체를 거부하고 생성·부착·해제 메서드의 수명 경계를 유지합니다.
     *
     * @param {UTimelinePlaybackPort} value 대입할 값(직접 변경 불가)
     */
    set playbackPort(value: UTimelinePlaybackPort);
    /**
     * 빌린 재생 포트을 반환합니다. <br>
     * 자원 참조는 읽기 전용으로 빌리며 직접 해제하지 않습니다.
     *
     * @returns {UTimelinePlaybackPort} 빌린 재생 포트입니다.
     */
    get playbackPort(): UTimelinePlaybackPort;
    /**
     * 호환용 원본 Clock의 직접 교체를 거부하고 생성·부착·해제 메서드의 수명 경계를 유지합니다.
     *
     * @param {UTimelineClock | null} value 대입할 값(직접 변경 불가)
     */
    set borrowedClock(value: UTimelineClock | null);
    /**
     * 호환용 원본 Clock을 반환합니다. <br>
     * 자원 참조는 읽기 전용으로 빌리며 직접 해제하지 않습니다.
     *
     * @returns {UTimelineClock | null} 호환용 원본 Clock입니다.
     */
    get borrowedClock(): UTimelineClock | null;
    /**
     * 내부 수명 숫자의 독립 스냅샷의 직접 교체를 거부하고 생성·부착·해제 메서드의 수명 경계를 유지합니다.
     *
     * @param {Readonly<{ mounted: boolean; disposed: boolean; ownsClock: boolean; sourceGeneration: number; commandGeneration: number; }>} value 세대 값(직접 변경 불가)
     */
    set runtime(value: Readonly<{
        mounted: boolean;
        disposed: boolean;
        ownsClock: boolean;
        sourceGeneration: number;
        commandGeneration: number;
    }>);
    /**
     * 내부 수명 숫자의 독립 스냅샷을 반환합니다. <br>
     * 자원 참조는 읽기 전용으로 빌리며 직접 해제하지 않습니다.
     *
     * @returns {Readonly<{ mounted: boolean; disposed: boolean; ownsClock: boolean; sourceGeneration: number; commandGeneration: number; }>} 내부 수명 숫자의 독립 스냅샷입니다.
     */
    get runtime(): Readonly<{
        mounted: boolean;
        disposed: boolean;
        ownsClock: boolean;
        sourceGeneration: number;
        commandGeneration: number;
    }>;
    /**
     * 위젯이 사용하는 Clock의 직접 교체를 거부하고 생성·부착·해제 메서드의 수명 경계를 유지합니다.
     *
     * @param {UTimelineClock | null} value 대입할 값(직접 변경 불가)
     */
    set clock(value: UTimelineClock | null);
    /**
     * 위젯이 사용하는 Clock을 반환합니다. <br>
     * 자원 참조는 읽기 전용으로 빌리며 직접 해제하지 않습니다.
     *
     * @returns {UTimelineClock | null} 위젯이 사용하는 Clock입니다.
     */
    get clock(): UTimelineClock | null;
    /**
     * 빌려 조회하는 시계 표시 모델의 직접 교체를 거부하고 생성·부착·해제 메서드의 수명 경계를 유지합니다.
     *
     * @param {UTimelineClockViewModel | null} value 대입할 값(직접 변경 불가)
     */
    set clockViewModel(value: UTimelineClockViewModel | null);
    /**
     * 빌려 조회하는 시계 표시 모델을 반환합니다. <br>
     * 자원 참조는 읽기 전용으로 빌리며 직접 해제하지 않습니다.
     *
     * @returns {UTimelineClockViewModel | null} 빌려 조회하는 시계 표시 모델입니다.
     */
    get clockViewModel(): UTimelineClockViewModel | null;
    /**
     * 빌려 조회하는 다이얼 표시 모델의 직접 교체를 거부하고 생성·부착·해제 메서드의 수명 경계를 유지합니다.
     *
     * @param {UTimelineAnimationViewModel | null} value 대입할 값(직접 변경 불가)
     */
    set animationViewModel(value: UTimelineAnimationViewModel | null);
    /**
     * 빌려 조회하는 다이얼 표시 모델을 반환합니다. <br>
     * 자원 참조는 읽기 전용으로 빌리며 직접 해제하지 않습니다.
     *
     * @returns {UTimelineAnimationViewModel | null} 빌려 조회하는 다이얼 표시 모델입니다.
     */
    get animationViewModel(): UTimelineAnimationViewModel | null;
    /**
     * 빌려 조회하는 다이얼 위젯의 직접 교체를 거부하고 생성·부착·해제 메서드의 수명 경계를 유지합니다.
     *
     * @param {UTimelineAnimationWidget | null} value 대입할 값(직접 변경 불가)
     */
    set animation(value: UTimelineAnimationWidget | null);
    /**
     * 빌려 조회하는 다이얼 위젯을 반환합니다. <br>
     * 자원 참조는 읽기 전용으로 빌리며 직접 해제하지 않습니다.
     *
     * @returns {UTimelineAnimationWidget | null} 빌려 조회하는 다이얼 위젯입니다.
     */
    get animation(): UTimelineAnimationWidget | null;
    /**
     * 빌려 조회하는 시간축 위젯의 직접 교체를 거부하고 생성·부착·해제 메서드의 수명 경계를 유지합니다.
     *
     * @param {UTimelineWidget | null} value 대입할 값(직접 변경 불가)
     */
    set timeline(value: UTimelineWidget | null);
    /**
     * 빌려 조회하는 시간축 위젯을 반환합니다. <br>
     * 자원 참조는 읽기 전용으로 빌리며 직접 해제하지 않습니다.
     *
     * @returns {UTimelineWidget | null} 빌려 조회하는 시간축 위젯입니다.
     */
    get timeline(): UTimelineWidget | null;
    /**
     * 마지막 유효 상태의 독립 사본의 직접 교체를 거부하고 생성·부착·해제 메서드의 수명 경계를 유지합니다.
     *
     * @param {import('../vo/UTimelineStateVo.js').UTimelineStateVo | null} value 대입할 값(직접 변경 불가)
     */
    set state(value: UTimelineStateVo | null);
    /**
     * 마지막 유효 상태의 독립 사본을 반환합니다. <br>
     * 자원 참조는 읽기 전용으로 빌리며 직접 해제하지 않습니다.
     *
     * @returns {import('../vo/UTimelineStateVo.js').UTimelineStateVo | null} 마지막 유효 상태의 독립 사본입니다.
     */
    get state(): UTimelineStateVo | null;
    /**
     * 현재 UI 오류의 원래 진단 객체의 직접 교체를 거부하고 생성·부착·해제 메서드의 수명 경계를 유지합니다.
     *
     * @param {Error | null} value 대입할 값(직접 변경 불가)
     */
    set lastError(value: Error | null);
    /**
     * 현재 UI 오류의 원래 진단 객체을 반환합니다. <br>
     * 자원 참조는 읽기 전용으로 빌리며 직접 해제하지 않습니다.
     *
     * @returns {Error | null} 현재 UI 오류의 원래 진단 객체입니다.
     */
    get lastError(): Error | null;
    /**
     * 위젯 부착 여부의 직접 교체를 거부하고 생성·부착·해제 메서드의 수명 경계를 유지합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set mounted(value: boolean);
    /**
     * 위젯 부착 여부을 반환합니다. <br>
     * 자원 참조는 읽기 전용으로 빌리며 직접 해제하지 않습니다.
     *
     * @returns {boolean} 위젯 부착 여부입니다.
     */
    get mounted(): boolean;
    /**
     * 영구 해제 여부의 직접 교체를 거부하고 생성·부착·해제 메서드의 수명 경계를 유지합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set disposed(value: boolean);
    /**
     * 영구 해제 여부을 반환합니다. <br>
     * 자원 참조는 읽기 전용으로 빌리며 직접 해제하지 않습니다.
     *
     * @returns {boolean} 영구 해제 여부입니다.
     */
    get disposed(): boolean;
    /**
     * 등록된 탐색 이벤트 수신 함수의 직접 교체를 거부합니다. <br>
     * 새 이벤트를 중복 등록하지 않습니다.
     *
     * @param {null | function(UTimelineSeekEvent):void} value 대입할 값(직접 변경 불가)
     */
    set seekListener(value: null | ((arg0: UTimelineSeekEvent) => void));
    /**
     * 등록된 탐색 이벤트 수신 함수를 호환 wrapper에 빌려줍니다. <br>
     * 등록과 최종 정리는 공통 View가 소유합니다.
     *
     * @returns {null | function(UTimelineSeekEvent):void} 등록된 탐색 이벤트 수신 함수입니다.
     */
    get seekListener(): null | ((arg0: UTimelineSeekEvent) => void);
    /**
     * 등록된 크기 갱신 수신 함수의 직접 교체를 거부합니다. <br>
     * 새 이벤트를 중복 등록하지 않습니다.
     *
     * @param {null | function():void} value 대입할 값(직접 변경 불가)
     */
    set resizeListener(value: null | (() => void));
    /**
     * 등록된 크기 갱신 수신 함수를 호환 wrapper에 빌려줍니다. <br>
     * 등록과 최종 정리는 공통 View가 소유합니다.
     *
     * @returns {null | function():void} 등록된 크기 갱신 수신 함수입니다.
     */
    get resizeListener(): null | (() => void);
    /**
     * 소유 크기 감시의 조회용 참조의 직접 교체를 거부합니다. <br>
     * 새 이벤트를 중복 등록하지 않습니다.
     *
     * @param {ResizeObserver | null} value 대입할 값(직접 변경 불가)
     */
    set resizeObserver(value: ResizeObserver | null);
    /**
     * 소유 크기 감시의 조회용 참조를 호환 wrapper에 빌려줍니다. <br>
     * 등록과 최종 정리는 공통 View가 소유합니다.
     *
     * @returns {ResizeObserver | null} 소유 크기 감시의 조회용 참조입니다.
     */
    get resizeObserver(): ResizeObserver | null;
    /**
     * 실시간 명령 차단의 해제 함수의 직접 교체를 거부합니다. <br>
     * 새 이벤트를 중복 등록하지 않습니다.
     *
     * @param {null | function():void} value 대입할 값(직접 변경 불가)
     */
    set removeRealtimeBlock(value: null | (() => void));
    /**
     * 실시간 명령 차단의 해제 함수를 호환 wrapper에 빌려줍니다. <br>
     * 등록과 최종 정리는 공통 View가 소유합니다.
     *
     * @returns {null | function():void} 실시간 명령 차단의 해제 함수입니다.
     */
    get removeRealtimeBlock(): null | (() => void);
}

export { UTimelineView };
