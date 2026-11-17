import { UTimelineView } from '../../types/extensions/Cz-zFqUa.js';
import { Mesh, BufferGeometry, NormalBufferAttributes, BufferGeometryEventMap, Material, MaterialEventMap, Object3DEventMap, Object3D, Camera, BufferAttribute, InterleavedBufferAttribute, Vector3Tuple, Matrix4, Vector3, Box3 } from "../../types/three/build/three.module.js";
import { UTimelineAxisVo, UTimelineStateVo } from '../../types/extensions/BSwjxfuO.js';

/**
 * 범용 2.0 정의를 독립 복사한 뒤 형식·자료·시간·좌표·그룹·키프레임·중복 쓰기·등록 기능 순서로 검증하여 사본을 반환합니다.
 */
declare class USequenceDefinitionValidationExecutor {
    /**
     * 2.0 입력을 사본으로 확정하고 원본·기능 콜백과 공유하지 않는 정의를 반환합니다. <br>
     * 기존 1.0 검증과 변환은 별도 경로로 유지합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceDefinitionVoCO | import('../vo/sequenceDefinitionVos.js').USequenceDefinitionVo} definition 입력 정의
     * @param {import('./sequenceEvaluationRuntime.js').USequenceDefinitionValidationOptions} [opt={}] 실행 설정, featureValidators는 동기 함수의 Map 기반 읽기 전용 등록, 호출 시 항목 복사
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceDefinitionVo} 검증한 독립 사본
     */
    validate(definition: USequenceDefinitionVoCO | USequenceDefinitionVo, opt?: USequenceDefinitionValidationOptions): USequenceDefinitionVo;
    #private;
}
/**
 * 평가기·Runtime 준비에서 사용하며 키프레임을 대상마다 복제하거나 파일·형상·기능을 실행하지 않습니다.
 */
declare class USequenceChannelCompileExecutor {
    /**
     * 유효한 일반 채널을 복합 대상별로 연결합니다. <br>
     * 정의 순서를 유지하고 중복 쓰기·잘못된 참조를 자동 수정하지 않습니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceDefinitionVoCO | import('../vo/sequenceDefinitionVos.js').USequenceDefinitionVo} definition 읽기 전용2.0 정의
     * @param {import('./sequenceEvaluationRuntime.js').USequenceChannelCompileOptions} [opt={}] 실행 옵션, revision 기본0 안전 정수
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceCompiledChannelsVo} 독립 컴파일 데이터
     */
    compile(definition: USequenceDefinitionVoCO | USequenceDefinitionVo, opt?: USequenceChannelCompileOptions): USequenceCompiledChannelsVo;
    #private;
}
/**
 * Runtime·Player의 일반 채널 기본 프레임 계산에서 사용하며 이전 결과·시계·엔진·기능 실행에 의존하지 않습니다.
 */
declare class USequenceFrameEvaluationExecutor {
    /**
     * USequenceFrameEvaluationExecutor 클래스 생성자입니다. <br>
     * 전달 연결을 재컴파일 결과와 대조하고 결정적인 순서의 사본·색인을 보관합니다.
     *
     * @param {import('./sequenceEvaluationRuntime.js').USequenceFrameEvaluationExecutorCO} opt 생성 설정, compiled 필수
     */
    constructor(opt: USequenceFrameEvaluationExecutorCO);
    /**
     * @type {import('../vo/sequenceDefinitionVos.js').USequenceCompiledChannelsVo}
     */ _compiled: USequenceCompiledChannelsVo;
    /** @type {string} */ _sequenceId: string;
    /**
     * @type {Map<string, import('../vo/sequenceDefinitionVos.js').USequenceChannelVo>}
     */ _channels: Map<string, USequenceChannelVo>;
    /** @type {Map<string, Array<number>>} */ _keyframeTimes: Map<string, Array<number>>;
    /**
     * @type {Map<string, Array<import('./sequenceData.js').USequenceEvaluationValue>>}
     */ _keyframeValues: Map<string, Array<USequenceEvaluationValue>>;
    /**
     * @type {Map<string, Array<import('./sequenceData.js').USequenceEvaluationInterpolation>>}
     */ _interpolations: Map<string, Array<USequenceEvaluationInterpolation>>;
    /**
     * @type {Array<import('../vo/sequenceDefinitionVos.js').USequenceTargetChannelBindingVo>}
     */ _bindings: Array<USequenceTargetChannelBindingVo>;
    /**
     * 요청 시각의 일반 채널만 계산해 새 프레임을 반환합니다. <br>
     * 내부 상태·입력·이전 출력은 변경하지 않고 범위 밖 시각도 원래 time으로 보존합니다.
     *
     * @param {number} time 요청 상대 초, 유한 상대 초, 음수·소수·timeline 범위 밖 허용, 문자열·null·비유한 값 거부
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceFrameVo} 독립 기본 프레임
     */
    evaluate(time: number): USequenceFrameVo;
    /**
     * 컴파일 교체는 새 평가기 생성으로 수행하도록 직접 대입을 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceCompiledChannelsVo} value 대입 거부
     */
    set compiled(value: USequenceCompiledChannelsVo);
    /**
     * 평가기와 공유하지 않는 컴파일 데이터 사본을 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceCompiledChannelsVo} 독립 컴파일 데이터
     */
    get compiled(): USequenceCompiledChannelsVo;
    /**
     * 입력 정의와 캐시가 어긋나지 않도록 ID 직접 대입을 거부합니다.
     *
     * @param {string} value 대입 거부
     */
    set sequenceId(value: string);
    /**
     * 전체 정의 재복사 없이 사용하는 시퀀스 ID 원시 캐시를 반환합니다.
     *
     * @returns {string} 전체 정의 재복사 없이 사용하는 시퀀스 ID 원시 캐시
     */
    get sequenceId(): string;
    /**
     * 채널 색인의 직접 교체를 거부합니다.
     *
     * @param {Map<string, import('../vo/sequenceDefinitionVos.js').USequenceChannelVo>} value 대입 거부
     */
    set channels(value: Map<string, USequenceChannelVo>);
    /**
     * Map과 채널 VO까지 복사한 조회용 색인을 반환합니다.
     *
     * @returns {Map<string, import('../vo/sequenceDefinitionVos.js').USequenceChannelVo>} 독립 채널 색인
     */
    get channels(): Map<string, USequenceChannelVo>;
    /**
     * 시각 색인의 직접 교체를 거부합니다.
     *
     * @param {Map<string, Array<number>>} value 대입 거부, 단위 상대 초
     */
    set keyframeTimes(value: Map<string, Array<number>>);
    /**
     * Map과 숫자 배열을 독립 복사하여 반환합니다.
     *
     * @returns {Map<string, Array<number>>} 독립 상대 초 색인
     */
    get keyframeTimes(): Map<string, Array<number>>;
    /**
     * 값 색인의 직접 교체를 거부합니다.
     *
     * @param {Map<string, Array<import('./sequenceData.js').USequenceEvaluationValue>>} value 대입 거부
     */
    set keyframeValues(value: Map<string, Array<USequenceEvaluationValue>>);
    /**
     * Map·값 목록·벡터까지 복사한 조회용 색인을 반환합니다.
     *
     * @returns {Map<string, Array<import('./sequenceData.js').USequenceEvaluationValue>>} 독립 값 색인
     */
    get keyframeValues(): Map<string, Array<USequenceEvaluationValue>>;
    /**
     * 보간 색인의 직접 교체를 거부합니다.
     *
     * @param {Map<string, Array<import('./sequenceData.js').USequenceEvaluationInterpolation>>} value 대입 거부
     */
    set interpolations(value: Map<string, Array<USequenceEvaluationInterpolation>>);
    /**
     * Map·보간 이름 배열을 독립 복사하여 반환합니다.
     *
     * @returns {Map<string, Array<import('./sequenceData.js').USequenceEvaluationInterpolation>>} 독립 보간 색인
     */
    get interpolations(): Map<string, Array<USequenceEvaluationInterpolation>>;
    /**
     * 대상/채널 연결의 직접 교체를 거부합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceTargetChannelBindingVo>} value 대입 거부
     */
    set bindings(value: Array<USequenceTargetChannelBindingVo>);
    /**
     * 평가 순서의 연결 목록과 VO를 독립 복사하여 반환합니다.
     *
     * @returns {Array<import('../vo/sequenceDefinitionVos.js').USequenceTargetChannelBindingVo>} 독립 연결 목록
     */
    get bindings(): Array<USequenceTargetChannelBindingVo>;
    #private;
}
type USequenceFeatureDefinitionValidator = (feature: USequenceFeatureVo, definition: USequenceDefinitionVo, location: string) => any;
type USequenceDefinitionValidationOptions = {
    /**
     * 호출 시 복사하는 Map 기반 기능 검증기 등록, 기본 빈 Map
     */
    featureValidators?: ReadonlyMap<string, USequenceFeatureDefinitionValidator> | undefined;
};
type USequenceChannelCompileOptions = {
    /**
     * 기본0, 0 이상 안전 정수 컴파일 정의 태그
     */
    revision?: number | undefined;
    /**
     * 기본 빈 Map인 동기 설정 검증 등록, 실행 옵션으로만 사용
     */
    featureValidators?: ReadonlyMap<string, USequenceFeatureDefinitionValidator> | undefined;
};
type USequenceFrameEvaluationExecutorCO = {
    /**
     * 필수 컴파일 데이터, 생성 시 독립 복사/재검증
     */
    compiled: USequenceCompiledChannelsVoCO | USequenceCompiledChannelsVo;
    /**
     * 기능이 있을 때 재검증할 동기 등록, 생성 후 보관·프레임 호출하지 않음
     */
    featureValidators?: ReadonlyMap<string, USequenceFeatureDefinitionValidator> | undefined;
};

/**
 * 시간 공급 구조만 확인하고 nowSeconds를 실행하지 않습니다.
 *
 * @param {unknown} value 빌린 nowSeconds 함수 포트
 * @returns {import('./sequenceData.js').USequenceTimeSourcePort} 같은 참조
 */
declare function validateSequenceTimeSourcePort(value: unknown): USequenceTimeSourcePort$1;
/**
 * 동기 시간 샘플의 유한성과 역행을 검사합니다. <br>
 * 동일 값/임의 원점을 허용합니다.
 *
 * @param {import('./sequenceData.js').USequenceTimeSourcePort} port 빌린 포트, 한 번 읽고 자원 수명 변경 없음
 * @param {number | null} [lastSeconds=null] 이전 성공 공급 초 또는 초기null, 기본null
 * @returns {number}
 */
declare function readSequenceNowSeconds(port: USequenceTimeSourcePort$1, lastSeconds?: number | null): number;
/**
 * 스케줄 포트의 subscribe 구조만 확인하고 예약/구독을 만들지 않습니다.
 *
 * @param {unknown} value 빌린 구조적 포트
 * @returns {import('./sequenceData.js').USequenceSchedulerPort} 같은 참조
 */
declare function validateSequenceSchedulerPort(value: unknown): USequenceSchedulerPort$1;
/**
 * 자료 어댑터의 필수 함수 구조만 검사합니다. <br>
 * 생성·준비·조회·구독·적용·해제 메서드를 실행하지 않으며 특정 클래스 상속을 요구하지 않습니다.
 *
 * @param {unknown} value 후보
 * @returns {import('./sequenceData.js').USequenceAssetAdapterPort} 같은 포트 참조
 */
declare function validateSequenceAssetAdapterPort(value: unknown): USequenceAssetAdapterPort$1;
/**
 * 좌표 검사·이동 변환 함수가 존재하는지만 확인합니다. <br>
 * 좌표 변환과 native 문맥 접근은 하지 않습니다.
 *
 * @param {unknown} value 후보
 * @returns {import('./sequenceData.js').USequenceCoordinatePort} 같은 포트 참조
 */
declare function validateSequenceCoordinatePort(value: unknown): USequenceCoordinatePort$1;
/**
 * 자료 준비 함수 구조만 확인합니다. <br>
 * 요청·Signal 구독·handle 취득과 해제는 하지 않습니다.
 *
 * @param {unknown} value 후보
 * @returns {import('./sequenceData.js').USequenceResourceResolverPort} 같은 포트 참조
 */
declare function validateSequenceResourceResolverPort(value: unknown): USequenceResourceResolverPort$1;
/**
 * 기능의 검증·준비·평가·해제 함수 구조만 확인합니다. <br>
 * 실제 반환 타입과 점유·실행 의미는 후속 실행 지점에서 검사합니다.
 *
 * @param {unknown} value 후보
 * @returns {import('./sequenceData.js').USequenceFeaturePort} 같은 포트 참조
 */
declare function validateSequenceFeaturePort(value: unknown): USequenceFeaturePort;
/**
 * 복사 함수에서 재귀 검증하는 JSON 데이터 타입입니다.
 */
type USequenceJsonObject$1 = {
    [key: string]: unknown;
};
type USequenceEvaluationValue$1 = Array<number> | boolean;
type USequenceEvaluationInterpolation$1 = "linear" | "smoothstep" | "step";
type USequencePlaybackAnchor$1 = {
    sourceSeconds: number;
    sequenceSeconds: number;
};
type USequencePlaybackSubscription$1 = {
    unsubscribe: USequenceSchedulerUnsubscribe$1 | null;
    active: boolean;
    subscribing: boolean;
    early: boolean;
};
type USequenceRafRequest$1 = {
    handle: unknown;
    assigned: boolean;
    active: boolean;
    subscribing: boolean;
    early: boolean;
    generation: number;
};
type USequencePlaybackErrorReporter$1 = (error: unknown) => void;
/**
 * 속성 레코드에서 보존하는 JSON 값입니다. <br>
 * 중첩 컨테이너의 값은 입력 경계에서 JSON 형식을 검사하고 조회 시 복사합니다.
 */
type USequencePropertyJsonValue$1 = null | string | number | boolean | Array<unknown> | Record<string, unknown>;
/**
 * 키가 문자열인 속성 레코드입니다.
 */
type USequencePropertyJsonRecord$1 = Record<string, unknown>;
/**
 * 단조 비감소 유한 초 공급, 빌린 포트이며 시퀀스 상대 초와 구별
 */
type USequenceTimeSourcePort$2 = {
    nowSeconds: () => number;
};
/**
 * 동기 무인자 tick, 구독 반환 전에 호출 금지
 */
type USequenceSchedulerCallback$1 = () => void;
/**
 * 자기 구독만 멱등 해제, 실패 시 재시도 가능
 */
type USequenceSchedulerUnsubscribe$1 = () => void;
type USequenceSchedulerPort$2 = {
    subscribe: (callback: USequenceSchedulerCallback$1) => USequenceSchedulerUnsubscribe$1;
};
type USequenceLegacyValidator$1 = (sequence: USequenceJsonObject$1, location: string) => void;
type USequenceDocumentResponse = {
    ok: boolean;
    status: number;
    text: () => Promise<string>;
} & Partial<{
    url: string;
}>;
type USequenceDocumentRequest$1 = {
    method: "GET";
    headers: Record<string, string>;
    credentials: "omit" | "same-origin" | "include";
    redirect: "follow" | "error";
} & Partial<{
    signal: USequenceAbortSignalPort$2;
}>;
/**
 * 플랫폼별 signal 타입과 연결할 요청
 */
type USequenceDocumentFetchRequest = Omit<USequenceDocumentRequest$1, "signal"> & Partial<{
    signal: any;
}>;
type USequenceDocumentFetcher$1 = (uri: string, request: USequenceDocumentFetchRequest) => Promise<USequenceDocumentResponse>;
type USequenceDocumentFile$1 = {
    text: () => Promise<string>;
};
type USequenceDocumentValidationOptions$1 = Partial<{
    featureValidators: Map<string, USequenceFeatureDefinitionValidator>;
    legacyValidator: USequenceLegacyValidator$1 | null;
}>;
type USequenceDocumentReadOptions$1 = Partial<{
    baseUrl: string;
    resolveUris: boolean;
    legacyAdapterId: string;
    signal: USequenceAbortSignalPort$2;
    request: Partial<{
        headers: Record<string, string>;
        credentials: "omit" | "same-origin" | "include";
        redirect: "follow" | "error";
    }>;
}>;
/**
 * 자료의 준비·조회·적용·복원·자원 정리 메서드를 제공하는 구조적 포트입니다.
 */
type USequenceAssetAdapterPort$2 = {
    /**
     * 읽기 전용 자료·문맥·Signal로 한 번 준비. 실패/취소 후보는 dispose. 실제 미지원은 대기로 위장하지 않음
     */
    prepare: (asset: USequencePortAsset$1, context: USequenceAdapterPrepareContext$2, signal: USequenceAbortSignalPort$2) => Promise<void>;
    /**
     * 준비 전에도 조회 가능한 고정 지원 능력 사본
     */
    getCapabilities: () => (USequencePortCapabilities$1 | USequenceAdapterCapabilitiesVoCO);
    /**
     * 준비 후 논리 목록/asset revision/완전성 사본
     */
    getTargetManifest: () => (USequencePortManifest$1 | USequenceTargetManifestVoCO);
    /**
     * 요청의 현재 조각 존재와 전체 조각 완전성 사본, 읽기 전용·동기
     */
    getReadiness: (arg0: ReadonlyArray<USequencePortTarget$1>) => (USequencePortReadiness$1 | USequenceReadinessVoCO);
    /**
     * 변경 후 동기 무인자 알림, 초기 자동 통지 없음, 해제 후 늦은 통지 차단
     */
    subscribeTargets: (listener: USequenceTargetChangeListener$1) => USequencePortUnsubscribe$1;
    /**
     * 요청 대상/좌표와 대응하는 기준 경계 사본, 현재 이동 결과를 재기준화하지 않음
     */
    getReferenceGeometry: (arg0: ReadonlyArray<USequencePortTarget$1>, arg1: string) => ReadonlyArray<USequencePortGeometry$1 | USequenceTargetGeometryVoCO>;
    /**
     * 읽기 전용 Frame의 바인딩·기준 확인만 수행, 장면 쓰기·새 lease/GPU 자원 취득 금지
     */
    plan: (frame: USequenceFramePortInput$1) => USequenceApplyPlan$1;
    /**
     * 자기 세대/바인딩의 plan만 동기 반영. 도중 실패 시 자기 부분 적용도 rollback 대상
     */
    commit: (plan: USequenceApplyPlan$1) => void;
    /**
     * 해당 plan 직전 상태로 동기 복귀
     */
    rollback: (plan: USequenceApplyPlan$1) => void;
    /**
     * 제어 속성을 최초 기준 자세로 동기 복원, 반복 허용·준비 전 무동작
     */
    restore: () => void;
    /**
     * 늦은 명령·알림 차단 후 복원·자기 구독/handle 정리를 모두 시도. 실패 AggregateError·남은 정리 재시도. 빌린 앱/레이어 종료 금지
     */
    dispose: () => (void | Promise<void>);
    /**
     * 지원 시 자기 컬링 envelope의 보수적 확대, 없는 포트는 필요한 범위를 스스로 보장
     */
    setMovementBounds?: ((bounds: ReadonlyArray<USequenceMovementBoundsVo>) => void) | undefined;
};
type USequenceCoordinatePort$2 = {
    /**
     * 읽기 전용 좌표·단위 지원을 동기 검사, 미지원은 즉시 실패
     */
    validate: (coordinate: USequencePortCoordinate$1) => void;
    /**
     * 선언 좌표 단위의 3성분 오프셋을 대상 부모 로컬 적용 단위의 새 배열로 반환. 입력·빌린 native 문맥 변경 금지
     */
    convertTranslation: (vector: ReadonlyArray<number>, coordinate: USequencePortCoordinate$1, targetContext: unknown) => Array<number>;
};
type USequenceFeaturePort$1 = {
    /**
     * SQ-001 기능 검증 콜백과 같은 인자. 독립 설정·정의와 0 기반 경로를 읽는 동기 void 검사
     */
    validate: (feature: USequencePortFeature$1, definition: USequencePortDefinition$1, location: string) => void;
    /**
     * 후보 문맥에 registerClaims로 대상/속성 선언, 실패/취소 등록은 확정 Runtime에 남기지 않음
     */
    prepare: (context: USequenceFeaturePrepareContext$1, signal: USequenceAbortSignalPort$2) => Promise<void>;
    /**
     * 준비 데이터·상대 초·선택 상태로 부수효과 없이 동기 계산. 선언 밖 쓰기·비동기·파일/형상/네트워크 준비 금지
     */
    evaluate: (input: USequenceFramePortInput$1, state?: USequenceJsonObject) => ReadonlyArray<USequenceTargetStatePortInput$1>;
    /**
     * 준비 전 순수 metadata 선언, Runtime 실행에는 필수
     */
    getClaims?: ((arg0: USequencePortFeature$1, arg1: USequencePortDefinition$1) => ReadonlyArray<USequenceFeatureClaimVo | USequenceFeatureClaimVoCO$1>) | undefined;
    /**
     * 동기 상태 검증, 비어 있지 않은 상태에는 필수
     */
    validateState?: ((state: USequenceJsonObject) => void) | undefined;
    /**
     * 복원 성공 뒤 채택할 독립 기본 상태, 없으면 현재 상태 유지
     */
    getRestoredState?: ((state: USequenceJsonObject) => USequenceJsonObject) | undefined;
    /**
     * 계산 상태와 설정 확정이 필요한 기능의 동기 transaction, 장면/IO 취득 금지
     */
    plan?: ((input: USequenceFramePortInput$1, state?: USequenceJsonObject) => USequenceFeatureFramePlan$2) | undefined;
    /**
     * 자기 구독/handle만 해제, 반복 허용·빌린 포트/앱/형상 종료 금지
     */
    dispose: () => (void | Promise<void>);
};
type USequenceResourceResolverPort$2 = {
    /**
     * 읽기 전용 자료·Signal로 URI/메모리 자료 준비. handle 수신자가 release 책임을 지며 취소 후 늦은 handle도 해제. Resolver/Signal/외부 앱 소유권 이전 없음
     */
    resolve: (asset: USequencePortAsset$1, signal: USequenceAbortSignalPort$2) => Promise<USequenceResolvedAssetHandle$1>;
};
type USequencePortAsset$1 = USequenceAssetVo;
type USequencePortCoordinate$1 = USequenceCoordinateVo;
type USequencePortTarget$1 = USequenceTargetVo;
type USequencePortFeature$1 = USequenceFeatureVo;
type USequencePortDefinition$1 = USequenceDefinitionVo;
type USequencePortCapabilities$1 = USequenceAdapterCapabilitiesVo;
type USequencePortManifest$1 = USequenceTargetManifestVo;
type USequencePortReadiness$1 = USequenceReadinessVo;
type USequencePortGeometry$1 = USequenceTargetGeometryVo;
type USequenceAdapterCapabilityName$1 = "translation" | "visibility" | "geometryBounds" | "streamingTargets" | "completeTargetManifest";
type USequenceControlledProperty$1 = "translation" | "visibility";
/**
 * 동기 무인자 재조회 알림, 변경 명령 재진입·Promise 반환 금지
 */
type USequenceTargetChangeListener$1 = () => void;
/**
 * 자기 구독만 제거하는 멱등 함수
 */
type USequencePortUnsubscribe$1 = () => void;
/**
 * 공개 필드 없는 Adapter 소유 identity, 저장 VO가 아님
 */
type USequenceApplyPlan$1 = object;
type USequenceAbortSignalPort$2 = {
    /**
     * 이미 취소됐는지 나타내는 빌린 값, 변경 금지
     */
    aborted: boolean;
    /**
     * 원래 취소 이유, 소유권 이전 없음
     */
    reason?: unknown;
    /**
     * 같은 abort 통지 함수를 등록하는 빌린 API
     */
    addEventListener: (type: string, listener: () => void, options?: Partial<{
        once: boolean;
    }>) => void;
    /**
     * 같은 통지 함수만 해제하는 빌린 API
     */
    removeEventListener: (type: string, listener: () => void) => void;
};
type USequenceResolvedAssetHandle$1 = {
    /**
     * 준비한 자료 또는 메모리 자원, 저장 VO에 넣지 않음
     */
    resource: unknown;
    /**
     * 자기 lease·소유 자원만 정리하는 멱등 함수, 외부 앱 종료 금지
     */
    release: () => (void | Promise<void>);
};
type USequenceAdapterPrepareContext$2 = {
    /**
     * 0 이상 안전 정수 후보 세대, 빌린 값·변경 금지
     */
    generation: number;
    /**
     * 필요한 대상의 Runtime 소유 독립 VO, 읽기 전용
     */
    requiredTargets: ReadonlyArray<USequencePortTarget$1>;
    /**
     * 필요한 이동·표시 속성, 변경 금지
     */
    requiredProperties: ReadonlyArray<USequenceControlledProperty$1>;
    /**
     * 검증한 좌표 선언의 독립 VO, 변경 금지
     */
    coordinates: ReadonlyArray<USequencePortCoordinate$1>;
    /**
     * 빌린 변환 포트, 변환 불필요 시 null
     */
    coordinatePort: USequenceCoordinatePort$2 | null;
    /**
     * 빌린 자료 해석 포트, 메모리 등록 시 null 허용
     */
    resourceResolver: USequenceResourceResolverPort$2 | null;
    /**
     * Runtime 소유 동기·비예외 진단 수집 함수
     */
    reportError: (error: unknown) => void;
};
type USequenceFeaturePrepareContext$1 = {
    /**
     * 0 이상 안전 정수 후보 세대, 변경 금지
     */
    generation: number;
    /**
     * 독립 기능 설정 VO, 읽기 전용
     */
    feature: USequencePortFeature$1;
    /**
     * 검증한 독립 정의 VO, 읽기 전용
     */
    definition: USequencePortDefinition$1;
    /**
     * 필요한 대상, 읽기 전용
     */
    requiredTargets: ReadonlyArray<USequencePortTarget$1>;
    /**
     * 빌린 변환 포트, 불필요 시 null
     */
    coordinatePort: USequenceCoordinatePort$2 | null;
    /**
     * 빌린 자료 해석 포트, 불필요 시 null
     */
    resourceResolver: USequenceResourceResolverPort$2 | null;
    /**
     * 준비한 기준 경계를 독립 VO로 조회
     */
    getReferenceGeometry: (targets: ReadonlyArray<USequencePortTarget$1>, coordinateId: string) => ReadonlyArray<USequencePortGeometry$1>;
    /**
     * 같은 준비 deadline/Signal로 모든 조각의 완전 경계를 기다림, 미지원은 즉시 실패
     */
    waitForReferenceGeometry: (targets: ReadonlyArray<USequencePortTarget$1>, coordinateId: string) => Promise<ReadonlyArray<USequencePortGeometry$1>>;
    /**
     * 준비 중 자기 이동 점유 자료의 보수적 범위를 확대, 장면 자세는 쓰지 않음
     */
    ensureMovementBounds: (bounds: ReadonlyArray<USequenceMovementBoundsVo>) => void;
    /**
     * 현재 후보에만 대상·속성 점유 등록, 원본 입력 변경 없음
     */
    registerClaims: (targets: ReadonlyArray<USequencePortTarget$1>, property: USequenceControlledProperty$1) => void;
    /**
     * Runtime 소유 동기·비예외 진단 수집 함수
     */
    reportError: (error: unknown) => void;
};
/**
 * SQ-003 TargetState VO와 동일한 구조적 입력 서명
 */
type USequenceTargetStatePortInput$1 = {
    /**
     * 복합 대상, 빌린 값·변경 금지
     */
    target: USequencePortTarget$1;
    /**
     * 선언 좌표의 3성분 오프셋, null은 비제어
     */
    translation: Array<number> | null;
    /**
     * 이동 좌표 ID, translation=null이면 null
     */
    coordinateId: string | null;
    /**
     * 표시·비표시, null은 비제어
     */
    visible: boolean | null;
};
/**
 * SQ-003 Frame VO와 동일한 구조적 서명, 포트 모듈에서는 VO 구현을 강제 import하지 않음
 */
type USequenceFramePortInput$1 = {
    /**
     * 시퀀스 ID, 읽기 전용
     */
    sequenceId: string;
    /**
     * 0 이상 안전 정수 컴파일 정의 태그, 평가 호출 횟수·load/명령 세대와 구별
     */
    revision: number;
    /**
     * 유한한 timeline 기준 상대 초
     */
    time: number;
    /**
     * 대상 상태, 읽기 전용
     */
    states: ReadonlyArray<USequenceTargetStatePortInput$1>;
};
type USequenceFeatureFramePlan$2 = {
    /**
     * 독립 대상 상태, 모든 claim을 정확히 포함
     */
    states: ReadonlyArray<USequenceTargetStatePortInput$1>;
    /**
     * 성공 뒤 저장할 같은 identity/claim의 새 설정, 기본null
     */
    feature?: USequenceFeatureVo | null | undefined;
    /**
     * 자기 계산 기록만 동기 확정, 실패한 자기 호출도 rollback 대상
     */
    commit: () => void;
    /**
     * 자기 직전 기록으로 동기 복귀/미적용 폐기, 멱등·장면/IO 취득 없음
     */
    rollback: () => void;
};

/**
 * 지원 능력의 정본 boolean 사본을 반환합니다. <br>
 * 준비 상태나 native 구현의 실제 지원 여부를 대신 추정하지 않습니다.
 *
 * @param {unknown} value Capabilities 일반 설정 또는 같은 VO, 생략 필드는 false
 * @returns {import('../vo/sequenceDefinitionVos.js').USequenceAdapterCapabilitiesVo} 독립 사본
 */
declare function validateSequenceAdapterCapabilities(value: unknown): USequenceAdapterCapabilitiesVo;
/**
 * 자료·버전·논리 대상·완전성을 검사합니다. <br>
 * 완전 목록에 없는 요청 대상은 즉시 거부하고 불완전 목록의 미발견 대상은 허용합니다.
 *
 * @param {unknown} value 목록 사본
 * @param {unknown} asset 사전 검증한 Asset VO 또는 설정, 자료 ID·원본 revision을 대조하며 변경 없음
 * @param {unknown} capabilities 지원 능력
 * @param {unknown} [requiredTargets=[] ] 요청 대상의 밀집 배열, 생략 시 [], 중복·다른 자료 대상 거부, 항목 0 기반
 * @returns {import('../vo/sequenceDefinitionVos.js').USequenceTargetManifestVo} 독립 사본
 */
declare function validateSequenceTargetManifest(value: unknown, asset: unknown, capabilities: unknown, requiredTargets?: unknown): USequenceTargetManifestVo;
/**
 * 요청 대상 일치·ready/missing의 중복 없는 분할·완전성 필수 조건을 검사합니다. <br>
 * 일부 조각 ready를 전체 complete로 추정하지 않습니다.
 *
 * @param {unknown} value 준비 사본
 * @param {unknown} requiredTargets 원래 요청한 밀집 Target 목록, 빈 배열 허용, 복합 중복 거부, 항목 0 기반, 변경 없음
 * @returns {import('../vo/sequenceDefinitionVos.js').USequenceReadinessVo} 독립 사본
 */
declare function validateSequenceReadiness(value: unknown, requiredTargets: unknown): USequenceReadinessVo;
/**
 * 요청 대상·좌표 ID와 기준 경계의 null·유한 3성분·성분 순서를 검사합니다. <br>
 * 실제 모든 native 조각의 존재는 Adapter의 완전성 보증 책임입니다.
 *
 * @param {unknown} value Geometry 일반 설정 또는 같은 VO
 * @param {unknown} target 요청한 Target VO 또는 설정, 복합 ID를 대조하며 변경 없음
 * @param {unknown} coordinate 사전 검증한 Coordinate VO 또는 설정, 요청 좌표 ID를 대조하며 실제 변환은 하지 않음
 * @returns {import('../vo/sequenceDefinitionVos.js').USequenceTargetGeometryVo} 독립 사본
 */
declare function validateSequenceTargetGeometry(value: unknown, target: unknown, coordinate: unknown): USequenceTargetGeometryVo;
/**
 * 요구 기능의 미지정·미지원 값을 즉시 거부해 로딩 대기로 오인하지 않게 합니다. <br>
 * 준비 상태·포트 메서드를 조회하거나 실행하지 않습니다.
 *
 * @param {unknown} capabilities 지원 능력, 독립 사본으로 검사
 * @param {unknown} required 요구 목록, 빈 배열 허용, 항목 0 기반
 */
declare function validateSequenceAdapterRequirements(capabilities: unknown, required: unknown): void;
type USequenceJsonObject = USequenceJsonObject$1;
type USequenceEvaluationValue = USequenceEvaluationValue$1;
type USequenceEvaluationInterpolation = USequenceEvaluationInterpolation$1;
type USequencePlaybackAnchor = USequencePlaybackAnchor$1;
type USequencePlaybackSubscription = USequencePlaybackSubscription$1;
type USequenceRafRequest = USequenceRafRequest$1;
type USequencePlaybackErrorReporter = USequencePlaybackErrorReporter$1;
type USequencePropertyJsonValue = USequencePropertyJsonValue$1;
type USequencePropertyJsonRecord = USequencePropertyJsonRecord$1;
type USequenceTimeSourcePort$1 = USequenceTimeSourcePort$2;
type USequenceSchedulerCallback = USequenceSchedulerCallback$1;
type USequenceSchedulerUnsubscribe = USequenceSchedulerUnsubscribe$1;
type USequenceSchedulerPort$1 = USequenceSchedulerPort$2;
type USequenceLegacyValidator = USequenceLegacyValidator$1;
type USequenceDocumentRequest = USequenceDocumentRequest$1;
type USequenceDocumentFetcher = USequenceDocumentFetcher$1;
type USequenceDocumentFile = USequenceDocumentFile$1;
type USequenceDocumentValidationOptions = USequenceDocumentValidationOptions$1;
type USequenceDocumentReadOptions = USequenceDocumentReadOptions$1;
type USequenceAssetAdapterPort$1 = USequenceAssetAdapterPort$2;
type USequenceCoordinatePort$1 = USequenceCoordinatePort$2;
type USequenceFeaturePort = USequenceFeaturePort$1;
type USequenceResourceResolverPort$1 = USequenceResourceResolverPort$2;
type USequencePortAsset = USequencePortAsset$1;
type USequencePortCoordinate = USequencePortCoordinate$1;
type USequencePortTarget = USequencePortTarget$1;
type USequencePortFeature = USequencePortFeature$1;
type USequencePortDefinition = USequencePortDefinition$1;
type USequencePortCapabilities = USequencePortCapabilities$1;
type USequencePortManifest = USequencePortManifest$1;
type USequencePortReadiness = USequencePortReadiness$1;
type USequencePortGeometry = USequencePortGeometry$1;
type USequenceAdapterCapabilityName = USequenceAdapterCapabilityName$1;
type USequenceControlledProperty = USequenceControlledProperty$1;
type USequenceTargetChangeListener = USequenceTargetChangeListener$1;
type USequencePortUnsubscribe = USequencePortUnsubscribe$1;
type USequenceApplyPlan = USequenceApplyPlan$1;
type USequenceAbortSignalPort$1 = USequenceAbortSignalPort$2;
type USequenceResolvedAssetHandle = USequenceResolvedAssetHandle$1;
type USequenceAdapterPrepareContext$1 = USequenceAdapterPrepareContext$2;
type USequenceFeaturePrepareContext = USequenceFeaturePrepareContext$1;
type USequenceTargetStatePortInput = USequenceTargetStatePortInput$1;
type USequenceFramePortInput = USequenceFramePortInput$1;
type USequenceFeatureFramePlan$1 = USequenceFeatureFramePlan$2;

/**
 * 자료 연결 식별자와 리소스 참조를 보관합니다.
 */
declare class USequenceAssetVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceAssetVo 클래스 생성자입니다. <br>
     * 일반 설정 또는 같은 VO를 받아 원본과 독립된 값을 구성합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceAssetVoCO | import('./sequenceDefinitionVos.js').USequenceAssetVo} [opt={}] 읽기 전용 설정, 생략 시 {}, null·다른 실행 객체 거부
     */
    constructor(opt?: USequenceAssetVoCO | USequenceAssetVo);
    /** @type {string|undefined} */ _id: string | undefined;
    /** @type {string|undefined} */ _adapterId: string | undefined;
    /** @type {string|undefined} */ _format: string | undefined;
    /** @type {string|null|undefined} */ _uri: string | null | undefined;
    /** @type {string|null|undefined} */ _propertiesUri: string | null | undefined;
    /** @type {string|undefined} */ _revision: string | undefined;
    /** @type {string|undefined} */ _objectIdType: string | undefined;
    /**
     * 자료 ID 값을 설정합니다.
     *
     * @param {undefined | string} value 자료 ID, 공백만인 값은 전체 검증에서 거부, undefined는 미설정으로 보존
     */
    set id(value: undefined | string);
    /**
     * 자료 ID 값을 반환합니다.
     *
     * @returns {undefined | string} 자료 ID
     */
    get id(): undefined | string;
    /**
     * 후속 어댑터 등록 ID 값을 설정합니다.
     *
     * @param {undefined | string} value 후속 어댑터 등록 ID, 실제 지원 여부는 연결 단계 확인, undefined는 미설정으로 보존
     */
    set adapterId(value: undefined | string);
    /**
     * 후속 어댑터 등록 ID 값을 반환합니다.
     *
     * @returns {undefined | string} 후속 어댑터 등록 ID
     */
    get adapterId(): undefined | string;
    /**
     * 자료 형식 식별자 값을 설정합니다.
     *
     * @param {undefined | string} value 자료 형식 식별자, 특정 로더 지원을 뜻하지 않음, undefined는 미설정으로 보존
     */
    set format(value: undefined | string);
    /**
     * 자료 형식 식별자 값을 반환합니다.
     *
     * @returns {undefined | string} 자료 형식 식별자
     */
    get format(): undefined | string;
    /**
     * 원본 URI 또는 메모리 등록 null을 보관합니다. <br>
     * 값 범위와 참조 의미는 전체 정의 검증에서 확인합니다.
     *
     * @param {undefined | string | null} value 원본 URI 또는 메모리 등록 null, undefined는 미설정으로 보존
     */
    set uri(value: undefined | string | null);
    /**
     * 원본 URI 또는 메모리 등록 null을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {undefined | string | null} 원본 URI 또는 메모리 등록 null
     */
    get uri(): undefined | string | null;
    /**
     * 속성 자료 URI 또는 미사용 null을 보관합니다. <br>
     * 값 범위와 참조 의미는 전체 정의 검증에서 확인합니다.
     *
     * @param {undefined | string | null} value 속성 자료 URI 또는 미사용 null, undefined는 미설정으로 보존
     */
    set propertiesUri(value: undefined | string | null);
    /**
     * 속성 자료 URI 또는 미사용 null을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {undefined | string | null} 속성 자료 URI 또는 미사용 null
     */
    get propertiesUri(): undefined | string | null;
    /**
     * 원본 자료 버전 식별자을 보관합니다. <br>
     * 값 범위와 참조 의미는 전체 정의 검증에서 확인합니다.
     *
     * @param {undefined | string} value 원본 자료 버전 식별자, undefined는 미설정으로 보존
     */
    set revision(value: undefined | string);
    /**
     * 원본 자료 버전 식별자을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {undefined | string} 원본 자료 버전 식별자
     */
    get revision(): undefined | string;
    /**
     * 원본 객체 ID 해석 방식 식별자을 보관합니다. <br>
     * 값 범위와 참조 의미는 전체 정의 검증에서 확인합니다.
     *
     * @param {undefined | string} value 원본 객체 ID 해석 방식 식별자, undefined는 미설정으로 보존
     */
    set objectIdType(value: undefined | string);
    /**
     * 원본 객체 ID 해석 방식 식별자을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {undefined | string} 원본 객체 ID 해석 방식 식별자
     */
    get objectIdType(): undefined | string;
}
/**
 * contentId와 objectId의 복합 대상 식별를 보관합니다.
 */
declare class USequenceTargetVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceTargetVo 클래스 생성자입니다. <br>
     * 일반 설정 또는 같은 VO를 받아 원본과 독립된 값을 구성합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceTargetVoCO | import('./sequenceDefinitionVos.js').USequenceTargetVo} [opt={}] 읽기 전용 설정, 생략 시 {}, null·다른 실행 객체 거부
     */
    constructor(opt?: USequenceTargetVoCO | USequenceTargetVo);
    /** @type {string|undefined} */ _contentId: string | undefined;
    /** @type {string|undefined} */ _objectId: string | undefined;
    /**
     * 등록 자료 ID 값을 설정합니다.
     *
     * @param {undefined | string} value 등록 자료 ID, objectId와 함께 복합 키를 구성, undefined는 미설정으로 보존
     */
    set contentId(value: undefined | string);
    /**
     * 등록 자료 ID 값을 반환합니다.
     *
     * @returns {undefined | string} 등록 자료 ID
     */
    get contentId(): undefined | string;
    /**
     * 원본 객체 ID 문자열 값을 설정합니다.
     *
     * @param {undefined | string} value 원본 객체 ID 문자열, 숫자 자동 변환 없음, undefined는 미설정으로 보존
     */
    set objectId(value: undefined | string);
    /**
     * 원본 객체 ID 문자열 값을 반환합니다.
     *
     * @returns {undefined | string} 원본 객체 ID 문자열
     */
    get objectId(): undefined | string;
}
/**
 * 명시적 대상 목록과 표시 이름를 보관합니다.
 */
declare class USequenceTargetGroupVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceTargetGroupVo 클래스 생성자입니다. <br>
     * 일반 설정 또는 같은 VO를 받아 원본과 독립된 값을 구성합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceTargetGroupVoCO | import('./sequenceDefinitionVos.js').USequenceTargetGroupVo} [opt={}] 읽기 전용 설정, 생략 시 {}, null·다른 실행 객체 거부
     */
    constructor(opt?: USequenceTargetGroupVoCO | USequenceTargetGroupVo);
    /** @type {string|undefined} */ _id: string | undefined;
    /** @type {string|undefined} */ _name: string | undefined;
    /** @type {Array<USequenceTargetVo>} */ _targets: Array<USequenceTargetVo>;
    /**
     * 그룹 ID을 보관합니다. <br>
     * 값 범위와 참조 의미는 전체 정의 검증에서 확인합니다.
     *
     * @param {undefined | string} value 그룹 ID, undefined는 미설정으로 보존
     */
    set id(value: undefined | string);
    /**
     * 그룹 ID을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {undefined | string} 그룹 ID
     */
    get id(): undefined | string;
    /**
     * 표시 이름 값을 설정합니다.
     *
     * @param {undefined | string} value 표시 이름, 빈 문자열 허용, undefined는 미설정으로 보존
     */
    set name(value: undefined | string);
    /**
     * 표시 이름 값을 반환합니다.
     *
     * @returns {undefined | string} 표시 이름
     */
    get name(): undefined | string;
    /**
     * 대상 목록 값을 설정합니다.
     *
     * @param {Array<import('./sequenceDefinitionVos.js').USequenceTargetVo>} value 대상 목록, 그룹 내 중복은 전체 검증에서 거부
     */
    set targets(value: Array<USequenceTargetVo>);
    /**
     * 대상 목록 값을 반환합니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceTargetVo>} 대상 목록
     */
    get targets(): Array<USequenceTargetVo>;
}
/**
 * 좌표 종류·단위·ENU 기준점 선언를 보관합니다.
 */
declare class USequenceCoordinateVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceCoordinateVo 클래스 생성자입니다. <br>
     * 일반 설정 또는 같은 VO를 받아 원본과 독립된 값을 구성합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceCoordinateVoCO | import('./sequenceDefinitionVos.js').USequenceCoordinateVo} [opt={}] 읽기 전용 설정, 생략 시 {}, null·다른 실행 객체 거부
     */
    constructor(opt?: USequenceCoordinateVoCO | USequenceCoordinateVo);
    /** @type {string|undefined} */ _id: string | undefined;
    /** @type {'local'|'enu'|undefined} */ _space: "local" | "enu" | undefined;
    /** @type {number[]|null|undefined} */ _origin: number[] | null | undefined;
    /** @type {number|undefined} */ _metersPerUnit: number | undefined;
    /**
     * 좌표 ID을 보관합니다. <br>
     * 값 범위와 참조 의미는 전체 정의 검증에서 확인합니다.
     *
     * @param {undefined | string} value 좌표 ID, undefined는 미설정으로 보존
     */
    set id(value: undefined | string);
    /**
     * 좌표 ID을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {undefined | string} 좌표 ID
     */
    get id(): undefined | string;
    /**
     * local 오른손 XYZ·Y up 또는 enu East/North/Up을 보관합니다. <br>
     * 값 범위와 참조 의미는 전체 정의 검증에서 확인합니다.
     *
     * @param {undefined | 'local' | 'enu'} value local 오른손 XYZ·Y up 또는 enu East/North/Up, undefined는 미설정으로 보존
     */
    set space(value: undefined | "local" | "enu");
    /**
     * local 오른손 XYZ·Y up 또는 enu East/North/Up을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {undefined | "enu" | "local"} local 오른손 XYZ·Y up 또는 enu East/North/Up
     */
    get space(): undefined | "enu" | "local";
    /**
     * local은 null 값을 설정합니다.
     *
     * @param {undefined | Array<number> | null} value local은 null, ENU는 [경도 도, 위도 도, 타원체고 m] 3성분, undefined는 미설정으로 보존
     */
    set origin(value: undefined | Array<number> | null);
    /**
     * local은 null 값을 반환합니다.
     *
     * @returns {undefined | Array<number> | null} local은 null
     */
    get origin(): undefined | Array<number> | null;
    /**
     * m/단위 값을 설정합니다.
     *
     * @param {undefined | number} value m/단위, local은 양의 유한 수, ENU는 1, undefined는 미설정으로 보존
     */
    set metersPerUnit(value: undefined | number);
    /**
     * m/단위 값을 반환합니다.
     *
     * @returns {undefined | number} m/단위
     */
    get metersPerUnit(): undefined | number;
}
/**
 * 단일 상대 시각의 값과 보간 방식를 보관합니다.
 */
declare class USequenceKeyframeVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceKeyframeVo 클래스 생성자입니다. <br>
     * 일반 설정 또는 같은 VO를 받아 원본과 독립된 값을 구성합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceKeyframeVoCO | import('./sequenceDefinitionVos.js').USequenceKeyframeVo} [opt={}] 읽기 전용 설정, 생략 시 {}, null·다른 실행 객체 거부
     */
    constructor(opt?: USequenceKeyframeVoCO | USequenceKeyframeVo);
    /** @type {number|undefined} */ _time: number | undefined;
    /** @type {number[]|boolean|undefined} */ _value: number[] | boolean | undefined;
    /** @type {'linear'|'smoothstep'|'step'|undefined} */ _interpolation: "linear" | "smoothstep" | "step" | undefined;
    /**
     * timeline 기준 상대 초 값을 설정합니다.
     *
     * @param {undefined | number} value timeline 기준 상대 초, 닫힌 범위와 엄격한 증가를 전체 검증에서 확인, undefined는 미설정으로 보존
     */
    set time(value: undefined | number);
    /**
     * timeline 기준 상대 초 값을 반환합니다.
     *
     * @returns {undefined | number} timeline 기준 상대 초
     */
    get time(): undefined | number;
    /**
     * translation은 숫자 3성분 오프셋, visibility는 boolean을 보관합니다. <br>
     * 원본과 공유하지 않도록 복사하며 값 범위와 참조는 전체 정의 검증에서 확인합니다.
     *
     * @param {undefined | Array<number> | boolean} value translation은 숫자 3성분 오프셋, visibility는 boolean, undefined는 미설정으로 보존
     */
    set value(value: undefined | Array<number> | boolean);
    /**
     * translation은 숫자 3성분 오프셋, visibility는 boolean을 반환합니다. <br>
     * 중첩 데이터는 독립 사본이며 호출자의 변경이 내부에 반영되지 않습니다.
     *
     * @returns {undefined | boolean | Array<number>} translation은 숫자 3성분 오프셋
     */
    get value(): undefined | boolean | Array<number>;
    /**
     * 다음 키프레임 구간 보간 값을 설정합니다.
     *
     * @param {undefined | 'linear' | 'smoothstep' | 'step'} value 다음 키프레임 구간 보간, visibility는 step 명시, undefined는 미설정으로 보존
     */
    set interpolation(value: undefined | "linear" | "smoothstep" | "step");
    /**
     * 다음 키프레임 구간 보간 값을 반환합니다.
     *
     * @returns {undefined | "linear" | "smoothstep" | "step"} 다음 키프레임 구간 보간
     */
    get interpolation(): undefined | "linear" | "smoothstep" | "step";
}
/**
 * 대상 그룹·속성·좌표·키프레임의 연결를 보관합니다.
 */
declare class USequenceChannelVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceChannelVo 클래스 생성자입니다. <br>
     * 일반 설정 또는 같은 VO를 받아 원본과 독립된 값을 구성합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceChannelVoCO | import('./sequenceDefinitionVos.js').USequenceChannelVo} [opt={}] 읽기 전용 설정, 생략 시 {}, null·다른 실행 객체 거부
     */
    constructor(opt?: USequenceChannelVoCO | USequenceChannelVo);
    /** @type {string|undefined} */ _id: string | undefined;
    /** @type {string|undefined} */ _targetGroupId: string | undefined;
    /** @type {'translation'|'visibility'|undefined} */ _property: "translation" | "visibility" | undefined;
    /** @type {string|null|undefined} */ _coordinateId: string | null | undefined;
    /** @type {Array<USequenceKeyframeVo>} */ _keyframes: Array<USequenceKeyframeVo>;
    /**
     * 채널 ID을 보관합니다. <br>
     * 값 범위와 참조 의미는 전체 정의 검증에서 확인합니다.
     *
     * @param {undefined | string} value 채널 ID, undefined는 미설정으로 보존
     */
    set id(value: undefined | string);
    /**
     * 채널 ID을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {undefined | string} 채널 ID
     */
    get id(): undefined | string;
    /**
     * 등록 대상 그룹 ID을 보관합니다. <br>
     * 값 범위와 참조 의미는 전체 정의 검증에서 확인합니다.
     *
     * @param {undefined | string} value 등록 대상 그룹 ID, undefined는 미설정으로 보존
     */
    set targetGroupId(value: undefined | string);
    /**
     * 등록 대상 그룹 ID을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {undefined | string} 등록 대상 그룹 ID
     */
    get targetGroupId(): undefined | string;
    /**
     * 이동 또는 표시 속성 값을 설정합니다.
     *
     * @param {undefined | 'translation' | 'visibility'} value 이동 또는 표시 속성, 다른 속성은 전체 검증에서 거부, undefined는 미설정으로 보존
     */
    set property(value: undefined | "translation" | "visibility");
    /**
     * 이동 또는 표시 속성 값을 반환합니다.
     *
     * @returns {undefined | "translation" | "visibility"} 이동 또는 표시 속성
     */
    get property(): undefined | "translation" | "visibility";
    /**
     * translation은 좌표 ID, visibility는 null을 보관합니다. <br>
     * 값 범위와 참조 의미는 전체 정의 검증에서 확인합니다.
     *
     * @param {undefined | string | null} value translation은 좌표 ID, visibility는 null, undefined는 미설정으로 보존
     */
    set coordinateId(value: undefined | string | null);
    /**
     * translation은 좌표 ID, visibility는 null을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {undefined | string | null} translation은 좌표 ID
     */
    get coordinateId(): undefined | string | null;
    /**
     * 0 기반 순서의 키프레임 목록 값을 설정합니다.
     *
     * @param {Array<import('./sequenceDefinitionVos.js').USequenceKeyframeVo>} value 0 기반 순서의 키프레임 목록, 자동 정렬 없음
     */
    set keyframes(value: Array<USequenceKeyframeVo>);
    /**
     * 0 기반 순서의 키프레임 목록 값을 반환합니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceKeyframeVo>} 0 기반 순서의 키프레임 목록
     */
    get keyframes(): Array<USequenceKeyframeVo>;
}
/**
 * 등록 기능의 식별·버전·JSON 설정를 보관합니다.
 */
declare class USequenceFeatureVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceFeatureVo 클래스 생성자입니다. <br>
     * 일반 설정 또는 같은 VO를 받아 원본과 독립된 값을 구성합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceFeatureVoCO | import('./sequenceDefinitionVos.js').USequenceFeatureVo} [opt={}] 읽기 전용 설정, 생략 시 {}, null·다른 실행 객체 거부
     */
    constructor(opt?: USequenceFeatureVoCO | USequenceFeatureVo);
    /** @type {string|undefined} */ _id: string | undefined;
    /** @type {string|undefined} */ _kind: string | undefined;
    /** @type {string|undefined} */ _schemaVersion: string | undefined;
    /**
     * @type {import('../core/sequenceData.js').USequenceJsonObject}
     */ _config: USequenceJsonObject;
    /**
     * 기능 인스턴스 ID을 보관합니다. <br>
     * 값 범위와 참조 의미는 전체 정의 검증에서 확인합니다.
     *
     * @param {undefined | string} value 기능 인스턴스 ID, undefined는 미설정으로 보존
     */
    set id(value: undefined | string);
    /**
     * 기능 인스턴스 ID을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {undefined | string} 기능 인스턴스 ID
     */
    get id(): undefined | string;
    /**
     * 등록 기능 검증기의 종류 ID을 보관합니다. <br>
     * 값 범위와 참조 의미는 전체 정의 검증에서 확인합니다.
     *
     * @param {undefined | string} value 등록 기능 검증기의 종류 ID, undefined는 미설정으로 보존
     */
    set kind(value: undefined | string);
    /**
     * 등록 기능 검증기의 종류 ID을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {undefined | string} 등록 기능 검증기의 종류 ID
     */
    get kind(): undefined | string;
    /**
     * 기능 설정 버전 값을 설정합니다.
     *
     * @param {undefined | string} value 기능 설정 버전, 허용 버전은 등록 검증기가 확인, undefined는 미설정으로 보존
     */
    set schemaVersion(value: undefined | string);
    /**
     * 기능 설정 버전 값을 반환합니다.
     *
     * @returns {undefined | string} 기능 설정 버전
     */
    get schemaVersion(): undefined | string;
    /**
     * 실행 함수·자원 없는 JSON 객체 값을 설정합니다.
     *
     * @param {import('../core/sequenceData.js').USequenceJsonObject} value 실행 함수·자원 없는 JSON 객체, 중첩 배열과 사전을 독립 복사
     */
    set config(value: USequenceJsonObject);
    /**
     * 실행 함수·자원 없는 JSON 객체 값을 반환합니다.
     *
     * @returns {import('../core/sequenceData.js').USequenceJsonObject} 실행 함수·자원 없는 JSON 객체
     */
    get config(): USequenceJsonObject;
}
/**
 * 범용 2.0 시퀀스의 자료·시간·그룹·좌표·채널·기능 정의를 보관합니다.
 */
declare class USequenceDefinitionVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceDefinitionVo 클래스 생성자입니다. <br>
     * 일반 설정 또는 같은 VO를 받아 원본과 독립된 값을 구성합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceDefinitionVoCO | import('./sequenceDefinitionVos.js').USequenceDefinitionVo} [opt={}] 읽기 전용 설정, 생략 시 {}, null·다른 실행 객체 거부
     */
    constructor(opt?: USequenceDefinitionVoCO | USequenceDefinitionVo);
    /** @type {string|undefined} */ _format: string | undefined;
    /** @type {string|undefined} */ _schemaVersion: string | undefined;
    /** @type {string|undefined} */ _id: string | undefined;
    /** @type {string|undefined} */ _description: string | undefined;
    /** @type {string[]} */ _keywords: string[];
    /** @type {Array<USequenceAssetVo>} */ _contents: Array<USequenceAssetVo>;
    /** @type {USequenceTimelineVo|undefined} */ _timeline: USequenceTimelineVo | undefined;
    /** @type {Array<USequenceCoordinateVo>} */ _coordinates: Array<USequenceCoordinateVo>;
    /** @type {Array<USequenceTargetGroupVo>} */ _groups: Array<USequenceTargetGroupVo>;
    /** @type {Array<USequenceChannelVo>} */ _channels: Array<USequenceChannelVo>;
    /** @type {Array<USequenceFeatureVo>} */ _features: Array<USequenceFeatureVo>;
    /**
     * 파일 형식 값을 설정합니다.
     *
     * @param {undefined | string} value 파일 형식, 확정 값 GeOnDTSequence, undefined는 미설정으로 보존
     */
    set format(value: undefined | string);
    /**
     * 파일 형식 값을 반환합니다.
     *
     * @returns {undefined | string} 파일 형식
     */
    get format(): undefined | string;
    /**
     * 정의 버전 값을 설정합니다.
     *
     * @param {undefined | string} value 정의 버전, 이 모듈의 확정 값 2.0.0, undefined는 미설정으로 보존
     */
    set schemaVersion(value: undefined | string);
    /**
     * 정의 버전 값을 반환합니다.
     *
     * @returns {undefined | string} 정의 버전
     */
    get schemaVersion(): undefined | string;
    /**
     * 시퀀스 ID을 보관합니다. <br>
     * 값 범위와 참조 의미는 전체 정의 검증에서 확인합니다.
     *
     * @param {undefined | string} value 시퀀스 ID, undefined는 미설정으로 보존
     */
    set id(value: undefined | string);
    /**
     * 시퀀스 ID을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {undefined | string} 시퀀스 ID
     */
    get id(): undefined | string;
    /**
     * 설명 값을 설정합니다.
     *
     * @param {undefined | string} value 설명, 빈 문자열 허용, undefined는 미설정으로 보존
     */
    set description(value: undefined | string);
    /**
     * 설명 값을 반환합니다.
     *
     * @returns {undefined | string} 설명
     */
    get description(): undefined | string;
    /**
     * 키워드 목록 값을 설정합니다.
     *
     * @param {Array<string>} value 키워드 목록, 항목 순서 보존
     */
    set keywords(value: Array<string>);
    /**
     * 키워드 목록 값을 반환합니다.
     *
     * @returns {Array<string>} 키워드 목록
     */
    get keywords(): Array<string>;
    /**
     * 자료 목록 값을 설정합니다.
     *
     * @param {Array<import('./sequenceDefinitionVos.js').USequenceAssetVo>} value 자료 목록, 확정 정의에서 1개 이상
     */
    set contents(value: Array<USequenceAssetVo>);
    /**
     * 자료 목록 값을 반환합니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceAssetVo>} 자료 목록
     */
    get contents(): Array<USequenceAssetVo>;
    /**
     * 재사용하는 상대 초·범위·실제 기준일 VO을 보관합니다. <br>
     * 원본과 공유하지 않도록 복사하며 값 범위와 참조는 전체 정의 검증에서 확인합니다.
     *
     * @param {undefined | import('./sequenceDefinitionVos.js').USequenceTimelineVo} value 재사용하는 상대 초·범위·실제 기준일 VO, undefined는 미설정으로 보존
     */
    set timeline(value: undefined | USequenceTimelineVo);
    /**
     * 재사용하는 상대 초·범위·실제 기준일 VO을 반환합니다. <br>
     * 중첩 데이터는 독립 사본이며 호출자의 변경이 내부에 반영되지 않습니다.
     *
     * @returns {undefined | import('./sequenceDefinitionVos.js').USequenceTimelineVo} 재사용하는 상대 초·범위·실제 기준일 VO
     */
    get timeline(): undefined | USequenceTimelineVo;
    /**
     * 좌표 선언 목록을 보관합니다. <br>
     * 원본과 공유하지 않도록 복사하며 값 범위와 참조는 전체 정의 검증에서 확인합니다.
     *
     * @param {Array<import('./sequenceDefinitionVos.js').USequenceCoordinateVo>} value 좌표 선언 목록
     */
    set coordinates(value: Array<USequenceCoordinateVo>);
    /**
     * 좌표 선언 목록을 반환합니다. <br>
     * 중첩 데이터는 독립 사본이며 호출자의 변경이 내부에 반영되지 않습니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceCoordinateVo>} 좌표 선언 목록
     */
    get coordinates(): Array<USequenceCoordinateVo>;
    /**
     * 대상 그룹 목록을 보관합니다. <br>
     * 원본과 공유하지 않도록 복사하며 값 범위와 참조는 전체 정의 검증에서 확인합니다.
     *
     * @param {Array<import('./sequenceDefinitionVos.js').USequenceTargetGroupVo>} value 대상 그룹 목록
     */
    set groups(value: Array<USequenceTargetGroupVo>);
    /**
     * 대상 그룹 목록을 반환합니다. <br>
     * 중첩 데이터는 독립 사본이며 호출자의 변경이 내부에 반영되지 않습니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceTargetGroupVo>} 대상 그룹 목록
     */
    get groups(): Array<USequenceTargetGroupVo>;
    /**
     * 이동·표시 채널 목록을 보관합니다. <br>
     * 원본과 공유하지 않도록 복사하며 값 범위와 참조는 전체 정의 검증에서 확인합니다.
     *
     * @param {Array<import('./sequenceDefinitionVos.js').USequenceChannelVo>} value 이동·표시 채널 목록
     */
    set channels(value: Array<USequenceChannelVo>);
    /**
     * 이동·표시 채널 목록을 반환합니다. <br>
     * 중첩 데이터는 독립 사본이며 호출자의 변경이 내부에 반영되지 않습니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceChannelVo>} 이동·표시 채널 목록
     */
    get channels(): Array<USequenceChannelVo>;
    /**
     * 등록 선택 기능 목록을 보관합니다. <br>
     * 원본과 공유하지 않도록 복사하며 값 범위와 참조는 전체 정의 검증에서 확인합니다.
     *
     * @param {Array<import('./sequenceDefinitionVos.js').USequenceFeatureVo>} value 등록 선택 기능 목록
     */
    set features(value: Array<USequenceFeatureVo>);
    /**
     * 등록 선택 기능 목록을 반환합니다. <br>
     * 중첩 데이터는 독립 사본이며 호출자의 변경이 내부에 반영되지 않습니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceFeatureVo>} 등록 선택 기능 목록
     */
    get features(): Array<USequenceFeatureVo>;
}
/**
 * @typedef {object} USequenceAssetVoCO
 * @property {string} [id] 자료 ID; 공백만인 값은 전체 검증에서 거부; 확정 정의의 필수 값
 * @property {string} [adapterId] 후속 어댑터 등록 ID; 실제 지원 여부는 연결 단계 확인; 확정 정의의 필수 값
 * @property {string} [format] 자료 형식 식별자; 특정 로더 지원을 뜻하지 않음; 확정 정의의 필수 값
 * @property {string|null} [uri] 원본 URI 또는 메모리 등록 null; 생성 기본값 null
 * @property {string|null} [propertiesUri] 속성 자료 URI 또는 미사용 null; 생성 기본값 null
 * @property {string} [revision] 원본 자료 버전 식별자; 확정 정의의 필수 값
 * @property {string} [objectIdType] 원본 객체 ID 해석 방식 식별자; 확정 정의의 필수 값
 */
/**
 * @typedef {object} USequenceTargetVoCO
 * @property {string} [contentId] 등록 자료 ID; objectId와 함께 복합 키를 구성; 확정 정의의 필수 값
 * @property {string} [objectId] 원본 객체 ID 문자열; 숫자 자동 변환 없음; 확정 정의의 필수 값
 */
/**
 * @typedef {object} USequenceTargetGroupVoCO
 * @property {string} [id] 그룹 ID; 확정 정의의 필수 값
 * @property {string} [name] 표시 이름; 빈 문자열 허용; 생성 기본값 ''
 * @property {Array<USequenceTargetVoCO|USequenceTargetVo>} [targets] 대상 목록; 그룹 내 중복은 전체 검증에서 거부; 확정 정의의 필수 값
 */
/**
 * @typedef {object} USequenceCoordinateVoCO
 * @property {string} [id] 좌표 ID; 확정 정의의 필수 값
 * @property {'local'|'enu'} [space] local 오른손 XYZ·Y up 또는 enu East/North/Up; 확정 정의의 필수 값
 * @property {number[]|null} [origin] local은 null; ENU는 [경도 도, 위도 도, 타원체고 m] 3성분; 생성 기본값 null
 * @property {number} [metersPerUnit] m/단위; local은 양의 유한 수, ENU는 1; 생성 기본값 1
 */
/**
 * @typedef {object} USequenceKeyframeVoCO
 * @property {number} [time] timeline 기준 상대 초; 닫힌 범위와 엄격한 증가를 전체 검증에서 확인; 확정 정의의 필수 값
 * @property {number[]|boolean} [value] translation은 숫자 3성분 오프셋, visibility는 boolean; 확정 정의의 필수 값
 * @property {'linear'|'smoothstep'|'step'} [interpolation] 다음 키프레임 구간 보간; visibility는 step 명시; 생성 기본값 'linear'
 */
/**
 * @typedef {object} USequenceChannelVoCO
 * @property {string} [id] 채널 ID; 확정 정의의 필수 값
 * @property {string} [targetGroupId] 등록 대상 그룹 ID; 확정 정의의 필수 값
 * @property {'translation'|'visibility'} [property] 이동 또는 표시 속성; 다른 속성은 전체 검증에서 거부; 확정 정의의 필수 값
 * @property {string|null} [coordinateId] translation은 좌표 ID, visibility는 null; 생성 기본값 null
 * @property {Array<USequenceKeyframeVoCO|USequenceKeyframeVo>} [keyframes] 0 기반 순서의 키프레임 목록; 자동 정렬 없음; 확정 정의의 필수 값
 */
/**
 * @typedef {object} USequenceFeatureVoCO
 * @property {string} [id] 기능 인스턴스 ID; 확정 정의의 필수 값
 * @property {string} [kind] 등록 기능 검증기의 종류 ID; 확정 정의의 필수 값
 * @property {string} [schemaVersion] 기능 설정 버전; 허용 버전은 등록 검증기가 확인; 확정 정의의 필수 값
 * @property {import('../core/sequenceData.js').USequenceJsonObject} [config] 실행 함수·자원 없는 JSON 객체; 중첩 배열과 사전을 독립 복사; 생성 기본값 {}
 */
/**
 * @typedef {object} USequenceDefinitionVoCO
 * @property {string} [format] 파일 형식; 확정 값 GeOnDTSequence; 생성 기본값 'GeOnDTSequence'
 * @property {string} [schemaVersion] 정의 버전; 이 모듈의 확정 값 2.0.0; 생성 기본값 '2.0.0'
 * @property {string} [id] 시퀀스 ID; 확정 정의의 필수 값
 * @property {string} [description] 설명; 빈 문자열 허용; 생성 기본값 ''
 * @property {string[]} [keywords] 키워드 목록; 항목 순서 보존; 생성 기본값 []
 * @property {Array<USequenceAssetVoCO|USequenceAssetVo>} [contents] 자료 목록; 확정 정의에서 1개 이상; 확정 정의의 필수 값
 * @property {USequenceTimelineVoCO|USequenceTimelineVo} [timeline] 재사용하는 상대 초·범위·실제 기준일 VO; 확정 정의의 필수 값
 * @property {Array<USequenceCoordinateVoCO|USequenceCoordinateVo>} [coordinates] 좌표 선언 목록; 생성 기본값 []
 * @property {Array<USequenceTargetGroupVoCO|USequenceTargetGroupVo>} [groups] 대상 그룹 목록; 생성 기본값 []
 * @property {Array<USequenceChannelVoCO|USequenceChannelVo>} [channels] 이동·표시 채널 목록; 생성 기본값 []
 * @property {Array<USequenceFeatureVoCO|USequenceFeatureVo>} [features] 등록 선택 기능 목록; 생성 기본값 []
 */
/**
 * 시퀀스의 재생 시간 범위와 실제 날짜의 기준 시각을 보관합니다.
 */
declare class USequenceTimelineVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceTimelineVo 클래스 생성자입니다. <br>
     * 생성 옵션의 이름을 정규화하고 입력값을 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceTimelineVoCO} [opt={}] 보관할 생성 옵션 또는 복사할 VO
     */
    constructor(opt?: USequenceTimelineVoCO);
    _unit: "second";
    _startTime: number;
    _endTime: number | undefined;
    _epoch: string | null;
    /**
     * 시간 단위를 저장합니다.
     *
     * @param {'second'} value 저장할 시간 단위, 상대 초 단위
     */
    set unit(value: "second");
    /**
     * 시간 단위를 반환합니다.
     *
     * @returns {'second'}
     */
    get unit(): "second";
    /**
     * 재생 시작 시각을 저장합니다. <br>
     * 시간 단위는 초입니다.
     *
     * @param {number} value 저장할 재생 시작 시각
     */
    set startTime(value: number);
    /**
     * 재생 시작 시각을 반환합니다. <br>
     * 시간 단위는 초입니다.
     *
     * @returns {number} 재생 시작 시각
     */
    get startTime(): number;
    /**
     * 재생 완료 시각을 저장합니다. <br>
     * 시간 단위는 초입니다.
     *
     * @param {undefined | number} value 저장할 재생 완료 시각
     */
    set endTime(value: undefined | number);
    /**
     * 재생 완료 시각을 반환합니다. <br>
     * 시간 단위는 초입니다.
     *
     * @returns {number | undefined} 재생 완료 시각
     */
    get endTime(): number | undefined;
    /**
     * 실제 날짜의 기준 시각을 저장합니다. <br>
     * 시간대가 포함된 ISO 8601 시각이며 null이면 상대 시간만 사용합니다.
     *
     * @param {string | null} value 저장할 실제 날짜의 기준 시각, 시간대 포함 ISO 시각 또는 상대 시간 null
     */
    set epoch(value: string | null);
    /**
     * 실제 날짜의 기준 시각을 반환합니다. <br>
     * 시간대가 포함된 ISO 8601 시각이며 null이면 상대 시간만 사용합니다.
     *
     * @returns {string | null} 실제 날짜의 기준 시각
     */
    get epoch(): string | null;
}
/**
 * 시퀀스의 재생 시간 범위와 실제 날짜의 기준 시각을 지정하는 생성 옵션입니다.
 *
 * @typedef {object} USequenceTimelineVoCO
 * @property {'second'} [unit] 시간 단위
 * @property {number} [startTime] 재생 시작 시각. 시간 단위는 초입니다.
 * @property {number} [endTime] 재생 완료 시각. 시간 단위는 초입니다.
 * @property {string|null} [epoch] 실제 날짜의 기준 시각. 시간대가 포함된 ISO 8601 시각이며 null이면 상대 시간만 사용합니다.
 */
/** @import {USequenceJsonObject} from "../core/sequenceData.js" */
/**
 * 어댑터의 지원 능력 boolean 사본을 보관합니다.
 */
declare class USequenceAdapterCapabilitiesVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceAdapterCapabilitiesVo 클래스 생성자입니다. <br>
     * 설정 또는 같은 VO를 독립 복사하여 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceAdapterCapabilitiesVoCO | import('./sequenceDefinitionVos.js').USequenceAdapterCapabilitiesVo} [opt={}] 읽기 전용 생성 설정
     */
    constructor(opt?: USequenceAdapterCapabilitiesVoCO | USequenceAdapterCapabilitiesVo);
    /** @type {boolean} */ _translation: boolean;
    /** @type {boolean} */ _visibility: boolean;
    /** @type {boolean} */ _geometryBounds: boolean;
    /** @type {boolean} */ _streamingTargets: boolean;
    /** @type {boolean} */ _completeTargetManifest: boolean;
    /**
     * 기준 자세 대비 이동 지원 값을 보관합니다. <br>
     * 타입을 확인하며 자동 보정하지 않습니다.
     *
     * @param {boolean} value 기준 자세 대비 이동 지원
     */
    set translation(value: boolean);
    /**
     * 기준 자세 대비 이동 지원 값을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {boolean} 기준 자세 대비 이동 지원 값
     */
    get translation(): boolean;
    /**
     * 표시/숨김 지원 값을 보관합니다. <br>
     * 타입을 확인하며 자동 보정하지 않습니다.
     *
     * @param {boolean} value 표시/숨김 지원
     */
    set visibility(value: boolean);
    /**
     * 표시/숨김 지원 값을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {boolean} 표시/숨김 지원 값
     */
    get visibility(): boolean;
    /**
     * 대상 기준 경계 조회 지원 값을 보관합니다. <br>
     * 타입을 확인하며 자동 보정하지 않습니다.
     *
     * @param {boolean} value 대상 기준 경계 조회 지원
     */
    set geometryBounds(value: boolean);
    /**
     * 대상 기준 경계 조회 지원 값을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {boolean} 대상 기준 경계 조회 지원 값
     */
    get geometryBounds(): boolean;
    /**
     * 준비 이후 대상 조각 변경 통지 지원 값을 보관합니다. <br>
     * 타입을 확인하며 자동 보정하지 않습니다.
     *
     * @param {boolean} value 준비 이후 대상 조각 변경 통지 지원
     */
    set streamingTargets(value: boolean);
    /**
     * 준비 이후 대상 조각 변경 통지 지원 값을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {boolean} 준비 이후 대상 조각 변경 통지 지원 값
     */
    get streamingTargets(): boolean;
    /**
     * 완전한 논리 대상 목록 제공 능력 값을 보관합니다. <br>
     * 타입을 확인하며 자동 보정하지 않습니다.
     *
     * @param {boolean} value 완전한 논리 대상 목록 제공 능력
     */
    set completeTargetManifest(value: boolean);
    /**
     * 완전한 논리 대상 목록 제공 능력 값을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {boolean} 완전한 논리 대상 목록 제공 능력 값
     */
    get completeTargetManifest(): boolean;
}
/**
 * 한 자료의 논리 대상 목록과 원본 버전·목록 완전성를 보관합니다.
 */
declare class USequenceTargetManifestVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceTargetManifestVo 클래스 생성자입니다. <br>
     * 설정 또는 같은 VO를 독립 복사하여 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceTargetManifestVoCO | import('./sequenceDefinitionVos.js').USequenceTargetManifestVo} opt 읽기 전용 생성 설정, 필수 설정
     */
    constructor(opt: USequenceTargetManifestVoCO | USequenceTargetManifestVo);
    /** @type {string} */ _contentId: string;
    /** @type {string} */ _revision: string;
    /** @type {USequenceTargetVo[]} */ _targets: USequenceTargetVo[];
    /** @type {boolean} */ _complete: boolean;
    /**
     * 목록이 속한 자료 ID 값을 보관합니다. <br>
     * 타입을 확인하며 자동 보정하지 않습니다.
     *
     * @param {string} value 목록이 속한 자료 ID
     */
    set contentId(value: string);
    /**
     * 목록이 속한 자료 ID 값을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {string} 목록이 속한 자료 ID 값
     */
    get contentId(): string;
    /**
     * 준비한 asset.revision과 같은 원본 버전 문자열 값을 보관합니다. <br>
     * 타입을 확인하며 자동 보정하지 않습니다.
     *
     * @param {string} value 준비한 asset.revision과 같은 원본 버전 문자열
     */
    set revision(value: string);
    /**
     * 준비한 asset.revision과 같은 원본 버전 문자열 값을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {string} 준비한 asset.revision과 같은 원본 버전 문자열 값
     */
    get revision(): string;
    /**
     * 논리 대상 목록 값을 설정합니다.
     *
     * @param {ReadonlyArray<import('./sequenceDefinitionVos.js').USequenceTargetVoCO | import('./sequenceDefinitionVos.js').USequenceTargetVo>} value 논리 대상 목록, 현재 Mesh 조각 목록과 구별
     */
    set targets(value: ReadonlyArray<USequenceTargetVoCO | USequenceTargetVo>);
    /**
     * 논리 대상 목록 값을 반환합니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceTargetVo>}
     */
    get targets(): Array<USequenceTargetVo>;
    /**
     * 현재 논리 대상 목록이 실제 완전함 값을 보관합니다. <br>
     * 타입을 확인하며 자동 보정하지 않습니다.
     *
     * @param {boolean} value 현재 논리 대상 목록이 실제 완전함
     */
    set complete(value: boolean);
    /**
     * 현재 논리 대상 목록이 실제 완전함 값을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {boolean} 현재 논리 대상 목록이 실제 완전함 값
     */
    get complete(): boolean;
}
/**
 * 요청 대상의 일부 사용 가능 상태와 전체 조각 준비 상태를 보관합니다.
 */
declare class USequenceReadinessVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceReadinessVo 클래스 생성자입니다. <br>
     * 설정 또는 같은 VO를 독립 복사하여 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceReadinessVoCO | import('./sequenceDefinitionVos.js').USequenceReadinessVo} opt 읽기 전용 생성 설정, 필수 설정
     */
    constructor(opt: USequenceReadinessVoCO | USequenceReadinessVo);
    /** @type {USequenceTargetVo[]} */ _required: USequenceTargetVo[];
    /** @type {USequenceTargetVo[]} */ _ready: USequenceTargetVo[];
    /** @type {USequenceTargetVo[]} */ _missing: USequenceTargetVo[];
    /** @type {boolean} */ _complete: boolean;
    /**
     * 원래 요청한 복합 대상 목록 값을 보관합니다. <br>
     * 입력과 공유하지 않도록 복사합니다.
     *
     * @param {ReadonlyArray<import('./sequenceDefinitionVos.js').USequenceTargetVoCO | import('./sequenceDefinitionVos.js').USequenceTargetVo>} value 원래 요청한 복합 대상 목록
     */
    set required(value: ReadonlyArray<USequenceTargetVoCO | USequenceTargetVo>);
    /**
     * 원래 요청한 복합 대상 목록 값을 반환합니다. <br>
     * 중첩 값은 독립 사본입니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceTargetVo>}
     */
    get required(): Array<USequenceTargetVo>;
    /**
     * 현재 사용할 조각이 하나 이상 있는 대상 값을 보관합니다. <br>
     * 입력과 공유하지 않도록 복사합니다.
     *
     * @param {ReadonlyArray<import('./sequenceDefinitionVos.js').USequenceTargetVoCO | import('./sequenceDefinitionVos.js').USequenceTargetVo>} value 현재 사용할 조각이 하나 이상 있는 대상
     */
    set ready(value: ReadonlyArray<USequenceTargetVoCO | USequenceTargetVo>);
    /**
     * 현재 사용할 조각이 하나 이상 있는 대상 값을 반환합니다. <br>
     * 중첩 값은 독립 사본입니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceTargetVo>}
     */
    get ready(): Array<USequenceTargetVo>;
    /**
     * 현재 사용할 조각이 하나도 없는 대상 값을 보관합니다. <br>
     * 입력과 공유하지 않도록 복사합니다.
     *
     * @param {ReadonlyArray<import('./sequenceDefinitionVos.js').USequenceTargetVoCO | import('./sequenceDefinitionVos.js').USequenceTargetVo>} value 현재 사용할 조각이 하나도 없는 대상
     */
    set missing(value: ReadonlyArray<USequenceTargetVoCO | USequenceTargetVo>);
    /**
     * 현재 사용할 조각이 하나도 없는 대상 값을 반환합니다. <br>
     * 중첩 값은 독립 사본입니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceTargetVo>}
     */
    get missing(): Array<USequenceTargetVo>;
    /**
     * 모든 요청 대상의 모든 조각이 준비됨 값을 설정합니다.
     *
     * @param {boolean} value 모든 요청 대상의 모든 조각이 준비됨, missing=[]만으로 추정하지 않음
     */
    set complete(value: boolean);
    /**
     * 모든 요청 대상의 모든 조각이 준비됨 값을 반환합니다.
     *
     * @returns {boolean} 모든 요청 대상의 모든 조각이 준비됨
     */
    get complete(): boolean;
}
/**
 * 논리 대상의 기준 경계와 전체 조각 경계 완전성를 보관합니다.
 */
declare class USequenceTargetGeometryVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceTargetGeometryVo 클래스 생성자입니다. <br>
     * 설정 또는 같은 VO를 독립 복사하여 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceTargetGeometryVoCO | import('./sequenceDefinitionVos.js').USequenceTargetGeometryVo} opt 읽기 전용 생성 설정, 필수 설정
     */
    constructor(opt: USequenceTargetGeometryVoCO | USequenceTargetGeometryVo);
    /** @type {USequenceTargetVo} */ _target: USequenceTargetVo;
    /** @type {string} */ _coordinateId: string;
    /** @type {number[]|null} */ _min: number[] | null;
    /** @type {number[]|null} */ _max: number[] | null;
    /** @type {boolean} */ _complete: boolean;
    /**
     * 경계가 속한 복합 대상 값을 보관합니다. <br>
     * 입력과 공유하지 않도록 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceTargetVoCO | import('./sequenceDefinitionVos.js').USequenceTargetVo} value 경계가 속한 복합 대상
     */
    set target(value: USequenceTargetVoCO | USequenceTargetVo);
    /**
     * 경계가 속한 복합 대상 값을 반환합니다. <br>
     * 중첩 값은 독립 사본입니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequenceTargetVo}
     */
    get target(): USequenceTargetVo;
    /**
     * 경계의 단위·축을 정하는 요청 좌표 ID 값을 보관합니다. <br>
     * 타입을 확인하며 자동 보정하지 않습니다.
     *
     * @param {string} value 경계의 단위·축을 정하는 요청 좌표 ID
     */
    set coordinateId(value: string);
    /**
     * 경계의 단위·축을 정하는 요청 좌표 ID 값을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {string} 경계의 단위·축을 정하는 요청 좌표 ID 값
     */
    get coordinateId(): string;
    /**
     * 요청 좌표 단위의 기준 AABB 최솟값 값을 설정합니다.
     *
     * @param {Array<number> | null} value 요청 좌표 단위의 기준 AABB 최솟값, 0 기반 3성분 또는 경계 미확인 null
     */
    set min(value: Array<number> | null);
    /**
     * 요청 좌표 단위의 기준 AABB 최솟값 값을 반환합니다.
     *
     * @returns {Array<number> | null} 요청 좌표 단위의 기준 AABB 최솟값
     */
    get min(): Array<number> | null;
    /**
     * 요청 좌표 단위의 기준 AABB 최댓값 값을 설정합니다.
     *
     * @param {Array<number> | null} value 요청 좌표 단위의 기준 AABB 최댓값, 0 기반 3성분 또는 경계 미확인 null
     */
    set max(value: Array<number> | null);
    /**
     * 요청 좌표 단위의 기준 AABB 최댓값 값을 반환합니다.
     *
     * @returns {Array<number> | null} 요청 좌표 단위의 기준 AABB 최댓값
     */
    get max(): Array<number> | null;
    /**
     * 모든 조각을 합친 기준 경계임 값을 보관합니다. <br>
     * 타입을 확인하며 자동 보정하지 않습니다.
     *
     * @param {boolean} value 모든 조각을 합친 기준 경계임
     */
    set complete(value: boolean);
    /**
     * 모든 조각을 합친 기준 경계임 값을 반환합니다. <br>
     * 원시값만 전달합니다.
     *
     * @returns {boolean} 모든 조각을 합친 기준 경계임 값
     */
    get complete(): boolean;
}
/**
 * 검증한 정의·컴파일 버전·대상별 채널 연결를 보관합니다.
 */
declare class USequenceCompiledChannelsVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceCompiledChannelsVo 클래스 생성자입니다. <br>
     * 일반 설정 또는 같은 VO를 독립 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceCompiledChannelsVoCO | import('./sequenceDefinitionVos.js').USequenceCompiledChannelsVo} opt 필수 읽기 전용 설정
     */
    constructor(opt: USequenceCompiledChannelsVoCO | USequenceCompiledChannelsVo);
    /** @type {USequenceDefinitionVo} */ _definition: USequenceDefinitionVo;
    /** @type {number} */ _revision: number;
    /** @type {USequenceTargetChannelBindingVo[]} */ _bindings: USequenceTargetChannelBindingVo[];
    /**
     * 독립 보관할 원본 2.0 정의 값을 보관합니다. <br>
     * 원본과 공유하지 않게 복사합니다. <br>
     * 다중 필드 의미는 완전 사본/컴파일 경계에서 다시 검사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceDefinitionVoCO | import('./sequenceDefinitionVos.js').USequenceDefinitionVo} value 독립 보관할 원본 2.0 정의
     */
    set definition(value: USequenceDefinitionVoCO | USequenceDefinitionVo);
    /**
     * 독립 보관할 원본 2.0 정의 값을 반환합니다. <br>
     * 중첩 값은 독립 사본입니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequenceDefinitionVo}
     */
    get definition(): USequenceDefinitionVo;
    /**
     * 0 이상 안전 정수 컴파일 정의 태그 값을 설정합니다.
     *
     * @param {number} value 0 이상 안전 정수 컴파일 정의 태그, 호출 횟수와 구별
     */
    set revision(value: number);
    /**
     * 0 이상 안전 정수 컴파일 정의 태그 값을 반환합니다.
     *
     * @returns {number} 원시 값
     */
    get revision(): number;
    /**
     * 논리 대상별 채널 연결 목록 값을 설정합니다.
     *
     * @param {ReadonlyArray<import('./sequenceDefinitionVos.js').USequenceTargetChannelBindingVoCO | import('./sequenceDefinitionVos.js').USequenceTargetChannelBindingVo>} value 논리 대상별 채널 연결 목록, 빈 목록 허용
     */
    set bindings(value: ReadonlyArray<USequenceTargetChannelBindingVoCO | USequenceTargetChannelBindingVo>);
    /**
     * 논리 대상별 채널 연결 목록 값을 반환합니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceTargetChannelBindingVo>}
     */
    get bindings(): Array<USequenceTargetChannelBindingVo>;
}
/**
 * 논리 대상의 이동·표시 채널 ID 연결를 보관합니다.
 */
declare class USequenceTargetChannelBindingVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceTargetChannelBindingVo 클래스 생성자입니다. <br>
     * 일반 설정 또는 같은 VO를 독립 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceTargetChannelBindingVoCO | import('./sequenceDefinitionVos.js').USequenceTargetChannelBindingVo} opt 필수 읽기 전용 설정
     */
    constructor(opt: USequenceTargetChannelBindingVoCO | USequenceTargetChannelBindingVo);
    /** @type {USequenceTargetVo} */ _target: USequenceTargetVo;
    /** @type {string|null} */ _translationChannelId: string | null;
    /** @type {string|null} */ _visibilityChannelId: string | null;
    /**
     * 자료 ID와 객체 ID의 복합 대상 값을 보관합니다. <br>
     * 원본과 공유하지 않게 복사합니다. <br>
     * 다중 필드 의미는 완전 사본/컴파일 경계에서 다시 검사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceTargetVoCO | import('./sequenceDefinitionVos.js').USequenceTargetVo} value 자료 ID와 객체 ID의 복합 대상
     */
    set target(value: USequenceTargetVoCO | USequenceTargetVo);
    /**
     * 자료 ID와 객체 ID의 복합 대상 값을 반환합니다. <br>
     * 중첩 값은 독립 사본입니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequenceTargetVo}
     */
    get target(): USequenceTargetVo;
    /**
     * 이동 채널 ID 또는 비제어 null 값을 보관합니다. <br>
     * 타입과 허용 값을 확인합니다. <br>
     * 다중 필드 의미는 완전 사본/컴파일 경계에서 다시 검사합니다.
     *
     * @param {string | null} value 이동 채널 ID 또는 비제어 null
     */
    set translationChannelId(value: string | null);
    /**
     * 이동 채널 ID 또는 비제어 null 값을 반환합니다. <br>
     * 값의 자동 보정은 하지 않습니다.
     *
     * @returns {string | null} 원시 값
     */
    get translationChannelId(): string | null;
    /**
     * 표시 채널 ID 또는 비제어 null 값을 보관합니다. <br>
     * 타입과 허용 값을 확인합니다. <br>
     * 다중 필드 의미는 완전 사본/컴파일 경계에서 다시 검사합니다.
     *
     * @param {string | null} value 표시 채널 ID 또는 비제어 null
     */
    set visibilityChannelId(value: string | null);
    /**
     * 표시 채널 ID 또는 비제어 null 값을 반환합니다. <br>
     * 값의 자동 보정은 하지 않습니다.
     *
     * @returns {string | null} 원시 값
     */
    get visibilityChannelId(): string | null;
}
/**
 * 요청 상대 시각의 시퀀스·컴파일 버전·대상 상태를 보관합니다.
 */
declare class USequenceFrameVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceFrameVo 클래스 생성자입니다. <br>
     * 일반 설정 또는 같은 VO를 독립 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceFrameVoCO | import('./sequenceDefinitionVos.js').USequenceFrameVo} opt 필수 읽기 전용 설정
     */
    constructor(opt: USequenceFrameVoCO | USequenceFrameVo);
    /** @type {string} */ _sequenceId: string;
    /** @type {number} */ _revision: number;
    /** @type {number} */ _time: number;
    /** @type {USequenceTargetStateVo[]} */ _states: USequenceTargetStateVo[];
    /**
     * 평가한 시퀀스 ID 값을 보관합니다. <br>
     * 타입과 허용 값을 확인합니다. <br>
     * 다중 필드 의미는 완전 사본/컴파일 경계에서 다시 검사합니다.
     *
     * @param {string} value 평가한 시퀀스 ID
     */
    set sequenceId(value: string);
    /**
     * 평가한 시퀀스 ID 값을 반환합니다. <br>
     * 값의 자동 보정은 하지 않습니다.
     *
     * @returns {string} 원시 값
     */
    get sequenceId(): string;
    /**
     * 0 이상 안전 정수 컴파일 정의 태그 값을 설정합니다.
     *
     * @param {number} value 0 이상 안전 정수 컴파일 정의 태그, 평가마다 증가하지 않음
     */
    set revision(value: number);
    /**
     * 0 이상 안전 정수 컴파일 정의 태그 값을 반환합니다.
     *
     * @returns {number} 원시 값
     */
    get revision(): number;
    /**
     * 요청한 유한 상대 초 값을 설정합니다.
     *
     * @param {number} value 요청한 유한 상대 초, 범위 밖도 원래 시각 보존
     */
    set time(value: number);
    /**
     * 요청한 유한 상대 초 값을 반환합니다.
     *
     * @returns {number} 원시 값
     */
    get time(): number;
    /**
     * 제어하는 대상별 독립 상태 목록 값을 설정합니다.
     *
     * @param {ReadonlyArray<import('./sequenceDefinitionVos.js').USequenceTargetStateVoCO | import('./sequenceDefinitionVos.js').USequenceTargetStateVo>} value 제어하는 대상별 독립 상태 목록, 빈 목록 허용
     */
    set states(value: ReadonlyArray<USequenceTargetStateVoCO | USequenceTargetStateVo>);
    /**
     * 제어하는 대상별 독립 상태 목록 값을 반환합니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceTargetStateVo>}
     */
    get states(): Array<USequenceTargetStateVo>;
}
/**
 * 한 대상의 이동·좌표·표시 평가 값를 보관합니다.
 */
declare class USequenceTargetStateVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceTargetStateVo 클래스 생성자입니다. <br>
     * 일반 설정 또는 같은 VO를 독립 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceTargetStateVoCO | import('./sequenceDefinitionVos.js').USequenceTargetStateVo} opt 필수 읽기 전용 설정
     */
    constructor(opt: USequenceTargetStateVoCO | USequenceTargetStateVo);
    /** @type {USequenceTargetVo} */ _target: USequenceTargetVo;
    /** @type {number[]|null} */ _translation: number[] | null;
    /** @type {string|null} */ _coordinateId: string | null;
    /** @type {boolean|null} */ _visible: boolean | null;
    /**
     * 자료 ID와 객체 ID의 복합 대상 값을 보관합니다. <br>
     * 원본과 공유하지 않게 복사합니다. <br>
     * 다중 필드 의미는 완전 사본/컴파일 경계에서 다시 검사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceTargetVoCO | import('./sequenceDefinitionVos.js').USequenceTargetVo} value 자료 ID와 객체 ID의 복합 대상
     */
    set target(value: USequenceTargetVoCO | USequenceTargetVo);
    /**
     * 자료 ID와 객체 ID의 복합 대상 값을 반환합니다. <br>
     * 중첩 값은 독립 사본입니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequenceTargetVo}
     */
    get target(): USequenceTargetVo;
    /**
     * 선언 좌표 단위의 유한 3성분 이동 값을 설정합니다.
     *
     * @param {Array<number> | null} value 선언 좌표 단위의 유한 3성분 이동, null은 비제어
     */
    set translation(value: Array<number> | null);
    /**
     * 선언 좌표 단위의 유한 3성분 이동 값을 반환합니다.
     *
     * @returns {Array<number> | null}
     */
    get translation(): Array<number> | null;
    /**
     * 이동 좌표 ID 값을 설정합니다.
     *
     * @param {string | null} value 이동 좌표 ID, 이동이 null이면 null
     */
    set coordinateId(value: string | null);
    /**
     * 이동 좌표 ID 값을 반환합니다.
     *
     * @returns {string | null} 원시 값
     */
    get coordinateId(): string | null;
    /**
     * 표시 true·숨김 false 또는 비제어 null 값을 보관합니다. <br>
     * 타입과 허용 값을 확인합니다. <br>
     * 다중 필드 의미는 완전 사본/컴파일 경계에서 다시 검사합니다.
     *
     * @param {boolean | null} value 표시 true·숨김 false 또는 비제어 null
     */
    set visible(value: boolean | null);
    /**
     * 표시 true·숨김 false 또는 비제어 null 값을 반환합니다. <br>
     * 값의 자동 보정은 하지 않습니다.
     *
     * @returns {boolean | null} 원시 값
     */
    get visible(): boolean | null;
}
/**
 * 한 자료/좌표의 전체 허용 이동 envelope를 보관합니다.
 */
declare class USequenceMovementBoundsVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceMovementBoundsVo 클래스 생성자입니다. <br>
     * 필수 공개 설정 또는 같은 VO를 복사하고 min≤0≤max 관계를 검사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceMovementBoundsVoCO | import('./sequenceDefinitionVos.js').USequenceMovementBoundsVo} opt
     */
    constructor(opt: USequenceMovementBoundsVoCO | USequenceMovementBoundsVo);
    /** @type {string} */ _contentId: string;
    /** @type {string} */ _coordinateId: string;
    /** @type {number[]} */ _min: number[];
    /** @type {number[]} */ _max: number[];
    /**
     * 비어 있지 않은 자료 ID를 보관합니다.
     *
     * @param {string} value 필수 자료 ID
     */
    set contentId(value: string);
    /**
     * 자료 ID 원시값을 반환합니다.
     *
     * @returns {string} 자료 ID 원시값
     */
    get contentId(): string;
    /**
     * 비어 있지 않은 좌표 ID를 보관합니다.
     *
     * @param {string} value 필수 좌표 ID
     */
    set coordinateId(value: string);
    /**
     * 좌표 ID 원시값을 반환합니다.
     *
     * @returns {string} 좌표 ID 원시값
     */
    get coordinateId(): string;
    /**
     * 유한 최소 이동을 복사합니다. <br>
     * 완성 사본/준비 경계에서 범위 관계를 재검사합니다.
     *
     * @param {Array<number>} value 선언 좌표 단위의 유한3성분, 0 기반 XYZ
     */
    set min(value: Array<number>);
    /**
     * 최소 이동3성분을 독립 복사합니다.
     *
     * @returns {Array<number>} 최소 이동3성분을 독립 복사합니다.
     */
    get min(): Array<number>;
    /**
     * 유한 최대 이동을 복사합니다. <br>
     * 완성 사본/준비 경계에서 범위 관계를 재검사합니다.
     *
     * @param {Array<number>} value 선언 좌표 단위의 유한3성분, 0 기반 XYZ
     */
    set max(value: Array<number>);
    /**
     * 최대 이동3성분을 독립 복사합니다.
     *
     * @returns {Array<number>} 최대 이동3성분을 독립 복사합니다.
     */
    get max(): Array<number>;
}
/**
 * 초기 위치·현재 배속/반복·후속 Runtime 준비 정책을 보관합니다.
 */
declare class USequencePlaybackOptionsVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequencePlaybackOptionsVo 클래스 생성자입니다. <br>
     * 설정 또는 같은 VO를 복사하고 완성된 데이터의 관계를 확인합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequencePlaybackOptionsVoCO | import('./sequenceDefinitionVos.js').USequencePlaybackOptionsVo} [opt={}] 기본{}
     */
    constructor(opt?: USequencePlaybackOptionsVoCO | USequencePlaybackOptionsVo);
    /** @type {number|null} */ _startTime: number | null;
    /** @type {number} */ _multiplier: number;
    /** @type {boolean} */ _loop: boolean;
    /** @type {USequenceReadinessPolicy} */ _readinessPolicy: USequenceReadinessPolicy;
    /** @type {number} */ _readinessTimeoutSeconds: number;
    /**
     * 필드 값을 검사·보관합니다. <br>
     * 전체 관계는 생성/복사 경계에서 재검사합니다.
     *
     * @param {number | null} value 유한 상대 초 또는 자동 초기 위치null, 기본null, 음수 배속이면 끝에서 시작
     */
    set startTime(value: number | null);
    /**
     * 유한 상대 초 또는 자동 초기 위치null, 기본null, 음수 배속이면 끝에서 시작 값을 반환합니다. <br>
     * 입력/자원 소유권을 이전하지 않습니다.
     *
     * @returns {number | null} 원시 값
     */
    get startTime(): number | null;
    /**
     * 필드 값을 검사·보관합니다. <br>
     * 전체 관계는 생성/복사 경계에서 재검사합니다.
     *
     * @param {number} value 유한 무차원 배속, 음수/0 허용, 기본1
     */
    set multiplier(value: number);
    /**
     * 유한 무차원 배속, 음수/0 허용, 기본1 값을 반환합니다. <br>
     * 입력/자원 소유권을 이전하지 않습니다.
     *
     * @returns {number} 원시 값
     */
    get multiplier(): number;
    /**
     * 필드 값을 검사·보관합니다. <br>
     * 전체 관계는 생성/복사 경계에서 재검사합니다.
     *
     * @param {boolean} value 자동 경과 반복 여부, 기본false
     */
    set loop(value: boolean);
    /**
     * 자동 경과 반복 여부, 기본false 값을 반환합니다. <br>
     * 입력/자원 소유권을 이전하지 않습니다.
     *
     * @returns {boolean} 원시 값
     */
    get loop(): boolean;
    /**
     * 필드 값을 검사·보관합니다. <br>
     * 전체 관계는 생성/복사 경계에서 재검사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceReadinessPolicy} value 후속 Runtime 준비 정책 strict/progressive, 기본strict
     */
    set readinessPolicy(value: USequenceReadinessPolicy);
    /**
     * 후속 Runtime 준비 정책 strict/progressive, 기본strict 값을 반환합니다. <br>
     * 입력/자원 소유권을 이전하지 않습니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequenceReadinessPolicy} 원시 값
     */
    get readinessPolicy(): USequenceReadinessPolicy;
    /**
     * 필드 값을 검사·보관합니다. <br>
     * 전체 관계는 생성/복사 경계에서 재검사합니다.
     *
     * @param {number} value 후속 Runtime 준비 timeout, 유한0이상 초, 기본30
     */
    set readinessTimeoutSeconds(value: number);
    /**
     * 후속 Runtime 준비 timeout, 유한0이상 초, 기본30 값을 반환합니다. <br>
     * 입력/자원 소유권을 이전하지 않습니다.
     *
     * @returns {number} 원시 값
     */
    get readinessTimeoutSeconds(): number;
}
/**
 * 범용 재생 범위·성공 시각·의도·상태를 독립 원시 값으로 보관합니다.
 */
declare class USequencePlaybackSnapshotVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequencePlaybackSnapshotVo 클래스 생성자입니다. <br>
     * 설정 또는 같은 VO를 복사하고 완성된 데이터의 관계를 확인합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequencePlaybackSnapshotVoCO | import('./sequenceDefinitionVos.js').USequencePlaybackSnapshotVo} opt 필수
     */
    constructor(opt: USequencePlaybackSnapshotVoCO | USequencePlaybackSnapshotVo);
    /** @type {number} */ _startTime: number;
    /** @type {number} */ _endTime: number;
    /** @type {number} */ _currentTime: number;
    /** @type {number} */ _multiplier: number;
    /** @type {boolean} */ _loop: boolean;
    /** @type {boolean} */ _playing: boolean;
    /** @type {USequencePlaybackMode} */ _mode: USequencePlaybackMode;
    /** @type {USequencePlaybackStatus} */ _status: USequencePlaybackStatus;
    /** @type {number} */ _revision: number;
    /**
     * 필드 값을 검사·보관합니다. <br>
     * 전체 관계는 생성/복사 경계에서 재검사합니다.
     *
     * @param {number} value 유한 상대 시작 초, 필수
     */
    set startTime(value: number);
    /**
     * 유한 상대 시작 초, 필수 값을 반환합니다. <br>
     * 입력/자원 소유권을 이전하지 않습니다.
     *
     * @returns {number} 원시 값
     */
    get startTime(): number;
    /**
     * 필드 값을 검사·보관합니다. <br>
     * 전체 관계는 생성/복사 경계에서 재검사합니다.
     *
     * @param {number} value 유한 상대 종료 초, 시작 이상, 필수
     */
    set endTime(value: number);
    /**
     * 유한 상대 종료 초, 시작 이상, 필수 값을 반환합니다. <br>
     * 입력/자원 소유권을 이전하지 않습니다.
     *
     * @returns {number} 원시 값
     */
    get endTime(): number;
    /**
     * 필드 값을 검사·보관합니다. <br>
     * 전체 관계는 생성/복사 경계에서 재검사합니다.
     *
     * @param {number} value 범위 안 유한 현재 상대 초, 필수
     */
    set currentTime(value: number);
    /**
     * 범위 안 유한 현재 상대 초, 필수 값을 반환합니다. <br>
     * 입력/자원 소유권을 이전하지 않습니다.
     *
     * @returns {number} 원시 값
     */
    get currentTime(): number;
    /**
     * 필드 값을 검사·보관합니다. <br>
     * 전체 관계는 생성/복사 경계에서 재검사합니다.
     *
     * @param {number} value 유한 무차원 배속, 음수/0 허용, 기본1
     */
    set multiplier(value: number);
    /**
     * 유한 무차원 배속, 음수/0 허용, 기본1 값을 반환합니다. <br>
     * 입력/자원 소유권을 이전하지 않습니다.
     *
     * @returns {number} 원시 값
     */
    get multiplier(): number;
    /**
     * 필드 값을 검사·보관합니다. <br>
     * 전체 관계는 생성/복사 경계에서 재검사합니다.
     *
     * @param {boolean} value 반복 정책, 기본false
     */
    set loop(value: boolean);
    /**
     * 반복 정책, 기본false 값을 반환합니다. <br>
     * 입력/자원 소유권을 이전하지 않습니다.
     *
     * @returns {boolean} 원시 값
     */
    get loop(): boolean;
    /**
     * 필드 값을 검사·보관합니다. <br>
     * 전체 관계는 생성/복사 경계에서 재검사합니다.
     *
     * @param {boolean} value 재생 의도, 배속0에서도 true 가능, 기본false
     */
    set playing(value: boolean);
    /**
     * 재생 의도, 배속0에서도 true 가능, 기본false 값을 반환합니다. <br>
     * 입력/자원 소유권을 이전하지 않습니다.
     *
     * @returns {boolean} 원시 값
     */
    get playing(): boolean;
    /**
     * 필드 값을 검사·보관합니다. <br>
     * 전체 관계는 생성/복사 경계에서 재검사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequencePlaybackMode} value 수동/manual 또는 자동/automatic, 기본manual
     */
    set mode(value: USequencePlaybackMode);
    /**
     * 수동/manual 또는 자동/automatic, 기본manual 값을 반환합니다. <br>
     * 입력/자원 소유권을 이전하지 않습니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequencePlaybackMode} 원시 값
     */
    get mode(): USequencePlaybackMode;
    /**
     * 필드 값을 검사·보관합니다. <br>
     * 전체 관계는 생성/복사 경계에서 재검사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequencePlaybackStatus} value 성공 확정 상태 paused/playing/ended/error/disposed, 기본paused
     */
    set status(value: USequencePlaybackStatus);
    /**
     * 성공 확정 상태 paused/playing/ended/error/disposed, 기본paused 값을 반환합니다. <br>
     * 입력/자원 소유권을 이전하지 않습니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequencePlaybackStatus} 원시 값
     */
    get status(): USequencePlaybackStatus;
    /**
     * 필드 값을 검사·보관합니다. <br>
     * 전체 관계는 생성/복사 경계에서 재검사합니다.
     *
     * @param {number} value 0이상 안전 정수 관측 버전, 기본0
     */
    set revision(value: number);
    /**
     * 0이상 안전 정수 관측 버전, 기본0 값을 반환합니다. <br>
     * 입력/자원 소유권을 이전하지 않습니다.
     *
     * @returns {number} 원시 값
     */
    get revision(): number;
}
/**
 * @typedef {object} USequenceAdapterCapabilitiesVoCO
 * @property {boolean} [translation] 기준 자세 대비 이동 지원; 생성 기본값 false
 * @property {boolean} [visibility] 표시/숨김 지원; 생성 기본값 false
 * @property {boolean} [geometryBounds] 대상 기준 경계 조회 지원; 생성 기본값 false
 * @property {boolean} [streamingTargets] 준비 이후 대상 조각 변경 통지 지원; 생성 기본값 false
 * @property {boolean} [completeTargetManifest] 완전한 논리 대상 목록 제공 능력; 생성 기본값 false
 */
/**
 * @typedef {object} USequenceTargetManifestVoCO
 * @property {string} contentId 목록이 속한 자료 ID; 필수
 * @property {string} revision 준비한 asset.revision과 같은 원본 버전 문자열; 필수
 * @property {ReadonlyArray<USequenceTargetVoCO|USequenceTargetVo>} [targets] 논리 대상 목록; 현재 Mesh 조각 목록과 구별; 생성 기본값 []
 * @property {boolean} [complete] 현재 논리 대상 목록이 실제 완전함; 생성 기본값 false
 */
/**
 * @typedef {object} USequenceReadinessVoCO
 * @property {ReadonlyArray<USequenceTargetVoCO|USequenceTargetVo>} required 원래 요청한 복합 대상 목록; 필수
 * @property {ReadonlyArray<USequenceTargetVoCO|USequenceTargetVo>} ready 현재 사용할 조각이 하나 이상 있는 대상; 필수
 * @property {ReadonlyArray<USequenceTargetVoCO|USequenceTargetVo>} missing 현재 사용할 조각이 하나도 없는 대상; 필수
 * @property {boolean} complete 모든 요청 대상의 모든 조각이 준비됨; missing=[]만으로 추정하지 않음; 필수
 */
/**
 * @typedef {object} USequenceTargetGeometryVoCO
 * @property {USequenceTargetVoCO|USequenceTargetVo} target 경계가 속한 복합 대상; 필수
 * @property {string} coordinateId 경계의 단위·축을 정하는 요청 좌표 ID; 필수
 * @property {number[]|null} [min] 요청 좌표 단위의 기준 AABB 최솟값; 0 기반 3성분 또는 경계 미확인 null; 생성 기본값 null
 * @property {number[]|null} [max] 요청 좌표 단위의 기준 AABB 최댓값; 0 기반 3성분 또는 경계 미확인 null; 생성 기본값 null
 * @property {boolean} [complete] 모든 조각을 합친 기준 경계임; 생성 기본값 false
 */
/**
 * @typedef {object} USequenceCompiledChannelsVoCO
 * @property {USequenceDefinitionVoCO|USequenceDefinitionVo} definition 독립 보관할 원본 2.0 정의; 필수
 * @property {number} [revision] 0 이상 안전 정수 컴파일 정의 태그; 호출 횟수와 구별; 생성 기본값 0
 * @property {ReadonlyArray<USequenceTargetChannelBindingVoCO|USequenceTargetChannelBindingVo>} bindings 논리 대상별 채널 연결 목록; 빈 목록 허용; 필수
 */
/**
 * @typedef {object} USequenceTargetChannelBindingVoCO
 * @property {USequenceTargetVoCO|USequenceTargetVo} target 자료 ID와 객체 ID의 복합 대상; 필수
 * @property {string|null} [translationChannelId] 이동 채널 ID 또는 비제어 null; 생성 기본값 null
 * @property {string|null} [visibilityChannelId] 표시 채널 ID 또는 비제어 null; 생성 기본값 null
 */
/**
 * @typedef {object} USequenceFrameVoCO
 * @property {string} sequenceId 평가한 시퀀스 ID; 필수
 * @property {number} [revision] 0 이상 안전 정수 컴파일 정의 태그; 평가마다 증가하지 않음; 생성 기본값 0
 * @property {number} time 요청한 유한 상대 초; 범위 밖도 원래 시각 보존; 필수
 * @property {ReadonlyArray<USequenceTargetStateVoCO|USequenceTargetStateVo>} [states] 제어하는 대상별 독립 상태 목록; 빈 목록 허용; 생성 기본값 []
 */
/**
 * @typedef {object} USequenceTargetStateVoCO
 * @property {USequenceTargetVoCO|USequenceTargetVo} target 자료 ID와 객체 ID의 복합 대상; 필수
 * @property {number[]|null} [translation] 선언 좌표 단위의 유한 3성분 이동; null은 비제어; 생성 기본값 null
 * @property {string|null} [coordinateId] 이동 좌표 ID; 이동이 null이면 null; 생성 기본값 null
 * @property {boolean|null} [visible] 표시 true·숨김 false 또는 비제어 null; 생성 기본값 null
 */
/**
 * @typedef {object} USequenceMovementBoundsVoCO
 * @property {string} contentId 자료 ID, 필수·null 불가
 * @property {string} coordinateId 좌표 ID, 필수·null 불가
 * @property {number[]} min 선언 좌표 단위의 유한 최소 이동3성분, 0 포함 필수
 * @property {number[]} max 같은 단위의 유한 최대 이동3성분, 0 포함 필수
 */
/**
 * @typedef {'strict'|'progressive'} USequenceReadinessPolicy
 * @typedef {object} USequencePlaybackOptionsVoCO
 * @property {number|null} [startTime] 유한 상대 초 또는 자동 초기 위치null, 기본null, 음수 배속이면 끝에서 시작
 * @property {number} [multiplier] 유한 무차원 배속, 음수/0 허용, 기본1
 * @property {boolean} [loop] 자동 경과 반복 여부, 기본false
 * @property {USequenceReadinessPolicy} [readinessPolicy] 후속 Runtime 준비 정책 strict/progressive, 기본strict
 * @property {number} [readinessTimeoutSeconds] 후속 Runtime 준비 timeout, 유한0이상 초, 기본30
 */
/**
 * @typedef {'manual'|'automatic'} USequencePlaybackMode
 * @typedef {'paused'|'playing'|'ended'|'error'|'disposed'} USequencePlaybackStatus
 * @typedef {object} USequencePlaybackSnapshotVoCO
 * @property {number} startTime 유한 상대 시작 초, 필수
 * @property {number} endTime 유한 상대 종료 초, 시작 이상, 필수
 * @property {number} currentTime 범위 안 유한 현재 상대 초, 필수
 * @property {number} [multiplier] 유한 무차원 배속, 음수/0 허용, 기본1
 * @property {boolean} [loop] 반복 정책, 기본false
 * @property {boolean} [playing] 재생 의도, 배속0에서도 true 가능, 기본false
 * @property {USequencePlaybackMode} [mode] 수동/manual 또는 자동/automatic, 기본manual
 * @property {USequencePlaybackStatus} [status] 성공 확정 상태 paused/playing/ended/error/disposed, 기본paused
 * @property {number} [revision] - 0이상 안전 정수 관측 버전, 기본0
 */
/**
 * 실행 오류의 코드·설명·위치·대상을 복사해 Player 상태와 진단 callback에 전달합니다.
 */
declare class USequenceIssueVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceIssueVo 클래스 생성자입니다. <br>
     * 옵션 이름을 검사하고 모든 데이터 필드를 독립 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceIssueVoCO | import('./sequenceDefinitionVos.js').USequenceIssueVo} opt 독립 복사할 데이터, 필수값 검사·중첩 VO 복사
     */
    constructor(opt: USequenceIssueVoCO$1 | USequenceIssueVo);
    /** @type {string} */ _code: string;
    /** @type {string} */ _message: string;
    /** @type {string|null} */ _path: string | null;
    /** @type {USequenceTargetVo|null} */ _target: USequenceTargetVo | null;
    /**
     * 실패 분류 코드의 타입/범위를 확인하고 보관합니다.
     *
     * @param {string} value 실패 분류 코드, 비어 있지 않은 문자열, 기본 RUNTIME_FAILED
     */
    set code(value: string);
    /**
     * 실패 분류 코드 사본 또는 원시 값을 반환합니다.
     *
     * @returns {string}
     */
    get code(): string;
    /**
     * 원본 오류를 설명하는 진단의 타입/범위를 확인하고 보관합니다.
     *
     * @param {string} value 원본 오류를 설명하는 진단, 필수·비어 있지 않은 문자열·null 불가
     */
    set message(value: string);
    /**
     * 원본 오류를 설명하는 진단 사본 또는 원시 값을 반환합니다.
     *
     * @returns {string}
     */
    get message(): string;
    /**
     * 실패한 문서/자원 경로의 타입/범위를 확인하고 보관합니다.
     *
     * @param {string | null} value 실패한 문서/자원 경로, null 또는 비어 있지 않은 문자열, 배열은0기반
     */
    set path(value: string | null);
    /**
     * 실패한 문서/자원 경로 사본 또는 원시 값을 반환합니다.
     *
     * @returns {string | null}
     */
    get path(): string | null;
    /**
     * 알려진 복합 대상의 타입/범위를 확인하고 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceTargetVoCO | import('./sequenceDefinitionVos.js').USequenceTargetVo | null} value 알려진 복합 대상, contentId/objectId 사본 또는 null
     */
    set target(value: USequenceTargetVoCO | USequenceTargetVo | null);
    /**
     * 알려진 복합 대상 사본 또는 원시 값을 반환합니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequenceTargetVo | null}
     */
    get target(): USequenceTargetVo | null;
}
/**
 * @typedef {object} USequenceIssueVoCO
 * @property {string} [code] 실패 분류 코드; 비어 있지 않은 문자열, 기본 RUNTIME_FAILED
 * @property {string} message 원본 오류를 설명하는 진단; 필수·비어 있지 않은 문자열·null 불가
 * @property {string|null} [path] 실패한 문서/자원 경로; null 또는 비어 있지 않은 문자열, 배열은0기반
 * @property {USequenceTargetVoCO|USequenceTargetVo|null} [target] 알려진 복합 대상; contentId/objectId 사본 또는 null
 */
/** @typedef {'empty'|'loading'|'ready'|'playing'|'paused'|'ended'|'restoring'|'restored'|'unloading'|'error'|'disposed'} USequencePlayerPhase */
/**
 * 확정/후보 세대·관측 단계와 기존 Playback/Readiness/Issue 사본을 보관합니다.
 */
declare class USequencePlayerStateVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequencePlayerStateVo 클래스 생성자입니다. <br>
     * 옵션 이름을 검사하고 모든 데이터 필드를 독립 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequencePlayerStateVoCO | import('./sequenceDefinitionVos.js').USequencePlayerStateVo} opt 독립 복사할 데이터, 필수값 검사·중첩 VO 복사
     */
    constructor(opt: USequencePlayerStateVoCO$1 | USequencePlayerStateVo);
    /** @type {import("../core/sequenceData.js").USequenceJsonObject} */ _featureStates: USequenceJsonObject;
    /** @type {string|null} */ _sequenceId: string | null;
    /** @type {USequencePlayerPhase} */ _phase: USequencePlayerPhase$2;
    /** @type {number} */ _generation: number;
    /** @type {number} */ _revision: number;
    /** @type {string|null} */ _pendingSequenceId: string | null;
    /** @type {number|null} */ _pendingGeneration: number | null;
    /** @type {USequencePlaybackSnapshotVo|null} */ _playback: USequencePlaybackSnapshotVo | null;
    /** @type {USequenceReadinessVo|null} */ _readiness: USequenceReadinessVo | null;
    /** @type {USequenceIssueVo|null} */ _lastIssue: USequenceIssueVo | null;
    /**
     * 현재 또는 마지막 확정 시퀀스 ID의 타입/범위를 확인하고 보관합니다.
     *
     * @param {string | null} value 현재 또는 마지막 확정 시퀀스 ID, null 또는 비어 있지 않은 문자열
     */
    set sequenceId(value: string | null);
    /**
     * 현재 또는 마지막 확정 시퀀스 ID 사본 또는 원시 값을 반환합니다.
     *
     * @returns {string | null}
     */
    get sequenceId(): string | null;
    /**
     * Player의 관측 단계의 타입/범위를 확인하고 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequencePlayerPhase} value Player의 관측 단계, 승인한11개 단계 중 하나, 기본empty
     */
    set phase(value: USequencePlayerPhase$2);
    /**
     * Player의 관측 단계 사본 또는 원시 값을 반환합니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequencePlayerPhase}
     */
    get phase(): USequencePlayerPhase$2;
    /**
     * 확정 세션 세대의 타입/범위를 확인하고 보관합니다.
     *
     * @param {number} value 확정 세션 세대, 0이상 안전 정수, 빈 상태0
     */
    set generation(value: number);
    /**
     * 확정 세션 세대 사본 또는 원시 값을 반환합니다.
     *
     * @returns {number}
     */
    get generation(): number;
    /**
     * 전체 상태/이벤트 batch 버전의 타입/범위를 확인하고 보관합니다.
     *
     * @param {number} value 전체 상태/이벤트 batch 버전, 0이상 안전 정수, 세션 교체로 되돌아가지 않음
     */
    set revision(value: number);
    /**
     * 전체 상태/이벤트 batch 버전 사본 또는 원시 값을 반환합니다.
     *
     * @returns {number}
     */
    get revision(): number;
    /**
     * 준비 중인 시퀀스 ID의 타입/범위를 확인하고 보관합니다.
     *
     * @param {string | null} value 준비 중인 시퀀스 ID, null 또는 비어 있지 않은 문자열
     */
    set pendingSequenceId(value: string | null);
    /**
     * 준비 중인 시퀀스 ID 사본 또는 원시 값을 반환합니다.
     *
     * @returns {string | null}
     */
    get pendingSequenceId(): string | null;
    /**
     * 준비 중인 요청 세대의 타입/범위를 확인하고 보관합니다.
     *
     * @param {number | null} value 준비 중인 요청 세대, null 또는0이상 안전 정수
     */
    set pendingGeneration(value: number | null);
    /**
     * 준비 중인 요청 세대 사본 또는 원시 값을 반환합니다.
     *
     * @returns {number | null}
     */
    get pendingGeneration(): number | null;
    /**
     * 마지막 성공 재생 상태의 타입/범위를 확인하고 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequencePlaybackSnapshotVoCO | import('./sequenceDefinitionVos.js').USequencePlaybackSnapshotVo | null} value 마지막 성공 재생 상태, 기존9필드 Snapshot의 독립 사본 또는 null
     */
    set playback(value: USequencePlaybackSnapshotVoCO | USequencePlaybackSnapshotVo | null);
    /**
     * 마지막 성공 재생 상태 사본 또는 원시 값을 반환합니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequencePlaybackSnapshotVo | null}
     */
    get playback(): USequencePlaybackSnapshotVo | null;
    /**
     * 전체 필수 대상 준비 사본의 타입/범위를 확인하고 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceReadinessVoCO | import('./sequenceDefinitionVos.js').USequenceReadinessVo | null} value 전체 필수 대상 준비 사본, 복합 대상 목록의 독립 사본 또는 null
     */
    set readiness(value: USequenceReadinessVoCO | USequenceReadinessVo | null);
    /**
     * 전체 필수 대상 준비 사본 사본 또는 원시 값을 반환합니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequenceReadinessVo | null}
     */
    get readiness(): USequenceReadinessVo | null;
    /**
     * 마지막 필수 실패 진단의 타입/범위를 확인하고 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceIssueVoCO | import('./sequenceDefinitionVos.js').USequenceIssueVo | null} value 마지막 필수 실패 진단, Issue 데이터 사본 또는 null, 원래 Error 제외
     */
    set lastIssue(value: USequenceIssueVoCO$1 | USequenceIssueVo | null);
    /**
     * 마지막 필수 실패 진단 사본 또는 원시 값을 반환합니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequenceIssueVo | null}
     */
    get lastIssue(): USequenceIssueVo | null;
    /**
     * 기능별 상태를 실행 참조 없는 JSON으로 검사하고 복사합니다.
     *
     * @param {import('../core/sequenceData.js').USequenceJsonObject} value 기능별 JSON 상태
     */
    set featureStates(value: USequenceJsonObject);
    /**
     * 마지막 성공 프레임의 기능별 상태를 독립 JSON 사본으로 반환합니다.
     *
     * @returns {import('../core/sequenceData.js').USequenceJsonObject} 마지막 성공 프레임의 기능별 상태를 독립 JSON 사본으로 반환합니다.
     */
    get featureStates(): USequenceJsonObject;
}
/**
 * @typedef {object} USequencePlayerStateVoCO
 * @property {string|null} [sequenceId] 현재 또는 마지막 확정 시퀀스 ID; null 또는 비어 있지 않은 문자열
 * @property {USequencePlayerPhase} [phase] Player의 관측 단계; 승인한11개 단계 중 하나, 기본empty
 * @property {number} [generation] 확정 세션 세대; 0이상 안전 정수, 빈 상태0
 * @property {number} [revision] 전체 상태/이벤트 batch 버전; 0이상 안전 정수, 세션 교체로 되돌아가지 않음
 * @property {string|null} [pendingSequenceId] 준비 중인 시퀀스 ID; null 또는 비어 있지 않은 문자열
 * @property {number|null} [pendingGeneration] 준비 중인 요청 세대; null 또는0이상 안전 정수
 * @property {USequencePlaybackSnapshotVoCO|USequencePlaybackSnapshotVo|null} [playback] 마지막 성공 재생 상태; 기존9필드 Snapshot의 독립 사본 또는 null
 * @property {USequenceReadinessVoCO|USequenceReadinessVo|null} [readiness] 전체 필수 대상 준비 사본; 복합 대상 목록의 독립 사본 또는 null
 * @property {USequenceIssueVoCO|USequenceIssueVo|null} [lastIssue] 마지막 필수 실패 진단; Issue 데이터 사본 또는 null, 원래 Error 제외
 * @property {import("../core/sequenceData.js").USequenceJsonObject} [featureStates] 기능 ID별 마지막 성공 JSON 상태 사전, 기본{}
 */
/**
 * 자료 전체 또는 명시 대상의 한 속성 쓰기 범위를 보관합니다.
 */
declare class USequenceFeatureClaimVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceFeatureClaimVo 클래스 생성자입니다. <br>
     * 점유 범위의 자료·대상·속성을 검사하고 독립 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceFeatureClaimVoCO | import('./sequenceDefinitionVos.js').USequenceFeatureClaimVo} opt 점유 데이터, 필수·null 불가, targets 기본null은 자료 전체
     */
    constructor(opt: USequenceFeatureClaimVoCO$1 | USequenceFeatureClaimVo);
    /** @type {string} */ _contentId: string;
    /** @type {USequenceTargetVo[]|null} */ _targets: USequenceTargetVo[] | null;
    /** @type {'translation'|'visibility'} */ _property: "translation" | "visibility";
    /**
     * 기존 명시 대상과 같은 자료 ID만 설정합니다.
     *
     * @param {string} value 비어 있지 않은 자료 ID, 현재 대상과 불일치하면 거부
     */
    set contentId(value: string);
    /**
     * 점유 자료 ID를 반환합니다.
     *
     * @returns {string} 점유 자료 ID
     */
    get contentId(): string;
    /**
     * 같은 자료의 중복 없는 비어 있지 않은 명시 목록 또는 전체 범위를 보관합니다.
     *
     * @param {ReadonlyArray<import('./sequenceDefinitionVos.js').USequenceTargetVo | import('./sequenceDefinitionVos.js').USequenceTargetVoCO> | null} value 대상 목록, null은 자료 전체, 배열은0기반, 독립 복사
     */
    set targets(value: ReadonlyArray<USequenceTargetVo | USequenceTargetVoCO> | null);
    /**
     * 명시 대상 사본 또는 자료 전체를 뜻하는 null을 반환합니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceTargetVo> | null} 독립 대상 VO 목록 또는 전체 범위
     */
    get targets(): Array<USequenceTargetVo> | null;
    /**
     * 지원하는 이동 또는 표시 속성을 보관합니다.
     *
     * @param {'translation' | 'visibility'} value 필수·null 불가
     */
    set property(value: "translation" | "visibility");
    /**
     * 쓰기 점유 속성을 반환합니다.
     *
     * @returns {"translation" | "visibility"} 쓰기 점유 속성
     */
    get property(): "translation" | "visibility";
}
/**
 * 2.0 정의와 북마크를 독립 보관합니다.
 */
declare class USequencePlaybackDocumentVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequencePlaybackDocumentVo 클래스 생성자입니다. <br>
     * 일반 설정 또는 동일 VO를 독립 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequencePlaybackDocumentVoCO | import('./sequenceDefinitionVos.js').USequencePlaybackDocumentVo} opt 필수 설정
     */
    constructor(opt: USequencePlaybackDocumentVoCO | USequencePlaybackDocumentVo);
    /** @type {string} */ _format: string;
    /** @type {string} */ _schemaVersion: string;
    /** @type {USequenceDefinitionVo} */ _sequence: USequenceDefinitionVo;
    /** @type {USequenceBookmarkVo} */ _bookmark: USequenceBookmarkVo;
    /**
     * 저장 형식 GeOnDTSequenceDocument 값을 확인하고 보관합니다. <br>
     * 완성 데이터의 필드 관계는 읽기/쓰기 경계에서 검사합니다.
     *
     * @param {string} value 설정 값
     */
    set format(value: string);
    /**
     * 저장 형식 GeOnDTSequenceDocument 값을 반환합니다. <br>
     * 중첩 데이터는 독립 사본입니다.
     *
     * @returns {string}
     */
    get format(): string;
    /**
     * 저장 버전 2.0.0 값을 확인하고 보관합니다. <br>
     * 완성 데이터의 필드 관계는 읽기/쓰기 경계에서 검사합니다.
     *
     * @param {string} value 설정 값
     */
    set schemaVersion(value: string);
    /**
     * 저장 버전 2.0.0 값을 반환합니다. <br>
     * 중첩 데이터는 독립 사본입니다.
     *
     * @returns {string}
     */
    get schemaVersion(): string;
    /**
     * 필수 2.0 정의, null 불가 값을 확인하고 보관합니다. <br>
     * 완성 데이터의 필드 관계는 읽기/쓰기 경계에서 검사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceDefinitionVoCO | import('./sequenceDefinitionVos.js').USequenceDefinitionVo} value 설정 값, 필수 2.0 정의
     */
    set sequence(value: USequenceDefinitionVoCO | USequenceDefinitionVo);
    /**
     * 필수 2.0 정의, null 불가 값을 반환합니다. <br>
     * 중첩 데이터는 독립 사본입니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequenceDefinitionVo}
     */
    get sequence(): USequenceDefinitionVo;
    /**
     * 필수 북마크, null 불가 값을 확인하고 보관합니다. <br>
     * 완성 데이터의 필드 관계는 읽기/쓰기 경계에서 검사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceBookmarkVoCO | import('./sequenceDefinitionVos.js').USequenceBookmarkVo} value 설정 값, 필수 북마크
     */
    set bookmark(value: USequenceBookmarkVoCO | USequenceBookmarkVo);
    /**
     * 필수 북마크, null 불가 값을 반환합니다. <br>
     * 중첩 데이터는 독립 사본입니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequenceBookmarkVo}
     */
    get bookmark(): USequenceBookmarkVo;
}
/**
 * 현재 상대 초·배속·기능별 JSON 북마크를 독립 복사하여 저장/복원 경계에 전달합니다.
 */
declare class USequenceBookmarkVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceBookmarkVo 클래스 생성자입니다. <br>
     * 일반 설정 또는 동일 VO를 독립 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceBookmarkVoCO | import('./sequenceDefinitionVos.js').USequenceBookmarkVo} opt 필수 설정
     */
    constructor(opt: USequenceBookmarkVoCO | USequenceBookmarkVo);
    /** @type {number} */ _currentTime: number;
    /** @type {number} */ _multiplier: number;
    /**
     * @type {import('../core/sequenceData.js').USequenceJsonObject}
     */ _featureStates: USequenceJsonObject;
    /**
     * 유한 상대 초, 필수 값을 확인하고 보관합니다. <br>
     * 완성 데이터의 필드 관계는 읽기/쓰기 경계에서 검사합니다.
     *
     * @param {number} value 설정 값, 유한 상대 초, 필수
     */
    set currentTime(value: number);
    /**
     * 유한 상대 초, 필수 값을 반환합니다. <br>
     * 중첩 데이터는 독립 사본입니다.
     *
     * @returns {number}
     */
    get currentTime(): number;
    /**
     * 유한 무차원 배속, 음수·0 허용 값을 확인하고 보관합니다. <br>
     * 완성 데이터의 필드 관계는 읽기/쓰기 경계에서 검사합니다.
     *
     * @param {number} value 설정 값, 유한 무차원 배속, 음수·0 허용
     */
    set multiplier(value: number);
    /**
     * 유한 무차원 배속, 음수·0 허용 값을 반환합니다. <br>
     * 중첩 데이터는 독립 사본입니다.
     *
     * @returns {number}
     */
    get multiplier(): number;
    /**
     * 기능 ID별 JSON 객체 사전 값을 확인하고 보관합니다. <br>
     * 완성 데이터의 필드 관계는 읽기/쓰기 경계에서 검사합니다.
     *
     * @param {import('../core/sequenceData.js').USequenceJsonObject} value 설정 값
     */
    set featureStates(value: USequenceJsonObject);
    /**
     * 기능 ID별 JSON 객체 사전 값을 반환합니다. <br>
     * 중첩 데이터는 독립 사본입니다.
     *
     * @returns {import('../core/sequenceData.js').USequenceJsonObject}
     */
    get featureStates(): USequenceJsonObject;
}
/**
 * 문서·최종 출처·주소 기준·선택 해석 자료를 독립 보관합니다.
 */
declare class USequenceDocumentReadResultVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceDocumentReadResultVo 클래스 생성자입니다. <br>
     * 일반 설정 또는 동일 VO를 독립 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceDocumentReadResultVoCO | import('./sequenceDefinitionVos.js').USequenceDocumentReadResultVo} opt 필수 설정
     */
    constructor(opt: USequenceDocumentReadResultVoCO | USequenceDocumentReadResultVo);
    /** @type {USequencePlaybackDocumentVo} */ _document: USequencePlaybackDocumentVo;
    /** @type {string|null} */ _sourceUrl: string | null;
    /** @type {string|null} */ _baseUrl: string | null;
    /** @type {USequenceAssetVo[]|null} */ _resolvedContents: USequenceAssetVo[] | null;
    /**
     * 필수 문서, null 불가 값을 확인하고 보관합니다. <br>
     * 완성 데이터의 필드 관계는 읽기/쓰기 경계에서 검사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequencePlaybackDocumentVoCO | import('./sequenceDefinitionVos.js').USequencePlaybackDocumentVo} value 설정 값, 필수 문서
     */
    set document(value: USequencePlaybackDocumentVoCO | USequencePlaybackDocumentVo);
    /**
     * 필수 문서, null 불가 값을 반환합니다. <br>
     * 중첩 데이터는 독립 사본입니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequencePlaybackDocumentVo}
     */
    get document(): USequencePlaybackDocumentVo;
    /**
     * 최종 절대 HTTP(S) 출처 또는 null 값을 확인하고 보관합니다. <br>
     * 완성 데이터의 필드 관계는 읽기/쓰기 경계에서 검사합니다.
     *
     * @param {string | null} value 설정 값, 최종 절대 HTTP(S) 출처 또는 null
     */
    set sourceUrl(value: string | null);
    /**
     * 최종 절대 HTTP(S) 출처 또는 null 값을 반환합니다. <br>
     * 중첩 데이터는 독립 사본입니다.
     *
     * @returns {string | null}
     */
    get sourceUrl(): string | null;
    /**
     * 명시적 절대 HTTP(S) 기준 또는 null 값을 확인하고 보관합니다. <br>
     * 완성 데이터의 필드 관계는 읽기/쓰기 경계에서 검사합니다.
     *
     * @param {string | null} value 설정 값, 명시적 절대 HTTP(S) 기준 또는 null
     */
    set baseUrl(value: string | null);
    /**
     * 명시적 절대 HTTP(S) 기준 또는 null 값을 반환합니다. <br>
     * 중첩 데이터는 독립 사본입니다.
     *
     * @returns {string | null}
     */
    get baseUrl(): string | null;
    /**
     * 해석 자료 사본 또는 미실행 null 값을 확인하고 보관합니다. <br>
     * 완성 데이터의 필드 관계는 읽기/쓰기 경계에서 검사합니다.
     *
     * @param {ReadonlyArray<import('./sequenceDefinitionVos.js').USequenceAssetVoCO | import('./sequenceDefinitionVos.js').USequenceAssetVo> | null} value 설정 값, 해석 자료 사본 또는 미실행 null
     */
    set resolvedContents(value: ReadonlyArray<USequenceAssetVoCO | USequenceAssetVo> | null);
    /**
     * 해석 자료 사본 또는 미실행 null 값을 반환합니다. <br>
     * 중첩 데이터는 독립 사본입니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceAssetVo> | null}
     */
    get resolvedContents(): Array<USequenceAssetVo> | null;
}
/**
 * @typedef {object} USequencePlaybackDocumentVoCO
 * @property {string} [format] 저장 형식 GeOnDTSequenceDocument; 기본값 'GeOnDTSequenceDocument'
 * @property {string} [schemaVersion] 저장 버전 2.0.0; 기본값 '2.0.0'
 * @property {USequenceDefinitionVoCO|USequenceDefinitionVo} sequence 필수 2.0 정의, null 불가
 * @property {USequenceBookmarkVoCO|USequenceBookmarkVo} bookmark 필수 북마크, null 불가
 */
/**
 * @typedef {object} USequenceBookmarkVoCO
 * @property {number} currentTime 유한 상대 초, 필수
 * @property {number} [multiplier] 유한 무차원 배속, 음수·0 허용; 기본값 1
 * @property {import('../core/sequenceData.js').USequenceJsonObject} [featureStates] 기능 ID별 JSON 객체 사전; 기본값 {}
 */
/**
 * @typedef {object} USequenceDocumentReadResultVoCO
 * @property {USequencePlaybackDocumentVoCO|USequencePlaybackDocumentVo} document 필수 문서, null 불가
 * @property {string|null} [sourceUrl] 최종 절대 HTTP(S) 출처 또는 null; 기본값 null
 * @property {string|null} [baseUrl] 명시적 절대 HTTP(S) 기준 또는 null; 기본값 null
 * @property {ReadonlyArray<USequenceAssetVoCO|USequenceAssetVo>|null} [resolvedContents] 해석 자료 사본 또는 미실행 null; 기본값 null
 */
/** @import {USequenceDefinitionOptionClass} from "../core/sequenceData.js" */
/**
 * 문서·선택 재생 옵션·해석 URI 목록을 독립 보관해 Reader 호출자에서 Runtime 후보 준비로 전달합니다.
 */
declare class USequenceRuntimeRequestVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceRuntimeRequestVo 클래스 생성자입니다. <br>
     * 옵션 이름을 검사하고 모든 데이터 필드를 독립 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceRuntimeRequestVoCO | import('./sequenceDefinitionVos.js').USequenceRuntimeRequestVo} opt 독립 복사할 데이터, 필수값 검사·중첩 VO 복사
     */
    constructor(opt: USequenceRuntimeRequestVoCO$2 | USequenceRuntimeRequestVo);
    /** @type {USequencePlaybackDocumentVo} */ _document: USequencePlaybackDocumentVo;
    /** @type {USequencePlaybackOptionsVo|null} */ _options: USequencePlaybackOptionsVo | null;
    /** @type {USequenceAssetVo[]|null} */ _resolvedContents: USequenceAssetVo[] | null;
    /**
     * 필수 정의/북마크 문서의 타입/범위를 확인하고 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequencePlaybackDocumentVoCO | import('./sequenceDefinitionVos.js').USequencePlaybackDocumentVo} value 필수 정의/북마크 문서, 필수·null 불가·전체 독립 복사
     */
    set document(value: USequencePlaybackDocumentVoCO | USequencePlaybackDocumentVo);
    /**
     * 필수 정의/북마크 문서 사본 또는 원시 값을 반환합니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequencePlaybackDocumentVo}
     */
    get document(): USequencePlaybackDocumentVo;
    /**
     * 재생/준비 정책의 선택적 덮어쓰기의 타입/범위를 확인하고 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequencePlaybackOptionsVoCO | import('./sequenceDefinitionVos.js').USequencePlaybackOptionsVo | null} value 재생/준비 정책의 선택적 덮어쓰기, null이면 북마크 배속·시각, 제공하면Options 사본
     */
    set options(value: USequencePlaybackOptionsVoCO | USequencePlaybackOptionsVo | null);
    /**
     * 재생/준비 정책의 선택적 덮어쓰기 사본 또는 원시 값을 반환합니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequencePlaybackOptionsVo | null}
     */
    get options(): USequencePlaybackOptionsVo | null;
    /**
     * 리더가 해석한 자료 URI 목록의 타입/범위를 확인하고 보관합니다.
     *
     * @param {ReadonlyArray<import('./sequenceDefinitionVos.js').USequenceAssetVoCO | import('./sequenceDefinitionVos.js').USequenceAssetVo> | null} value 리더가 해석한 자료 URI 목록, 독립 Asset 목록 또는 null, 완전 일치 검사는 Runtime에서 수행
     */
    set resolvedContents(value: ReadonlyArray<USequenceAssetVoCO | USequenceAssetVo> | null);
    /**
     * 리더가 해석한 자료 URI 목록 사본 또는 원시 값을 반환합니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceAssetVo> | null}
     */
    get resolvedContents(): Array<USequenceAssetVo> | null;
}
/**
 * @typedef {object} USequenceRuntimeRequestVoCO
 * @property {USequencePlaybackDocumentVoCO|USequencePlaybackDocumentVo} document 필수 정의/북마크 문서; 필수·null 불가·전체 독립 복사
 * @property {USequencePlaybackOptionsVoCO|USequencePlaybackOptionsVo|null} [options] 재생/준비 정책의 선택적 덮어쓰기; null이면 북마크 배속·시각, 제공하면Options 사본
 * @property {ReadonlyArray<USequenceAssetVoCO|USequenceAssetVo>|null} [resolvedContents] 리더가 해석한 자료 URI 목록; 독립 Asset 목록 또는 null, 완전 일치 검사는 Runtime에서 수행
 */
/**
 * 객체 하나의 원본 속성을 보관합니다.
 */
declare class USequenceObjectPropertyVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceObjectPropertyVo 클래스 생성자입니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceObjectPropertyVoCO} [opt={}] 생성 옵션 또는 복사할 VO <br>
     * 생략 시 기본값: {}.
     */
    constructor(opt?: USequenceObjectPropertyVoCO);
    _contentId: string;
    _objectId: string;
    _record: USequencePropertyJsonRecord$1;
    /**
     * 자료 식별자를 저장합니다.
     *
     * @param {string} value 저장할 자료 식별자
     */
    set contentId(value: string);
    /**
     * 자료 식별자를 반환합니다.
     *
     * @returns {string}
     */
    get contentId(): string;
    /**
     * GUID 키를 저장합니다.
     *
     * @param {string} value 저장할 GUID 키
     */
    set objectId(value: string);
    /**
     * GUID 키를 반환합니다.
     *
     * @returns {string}
     */
    get objectId(): string;
    /**
     * 원본 속성 레코드를 저장합니다.
     *
     * @param {import('../core/sequenceData.js').USequencePropertyJsonRecord} value 저장할 원본 속성 레코드 <br>
     * 입력 컨테이너는 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set record(value: USequencePropertyJsonRecord);
    /**
     * 원본 속성 레코드를 반환합니다.
     *
     * @returns {import('../core/sequenceData.js').USequencePropertyJsonRecord} 원본 속성 레코드의 복사본
     */
    get record(): USequencePropertyJsonRecord;
}
/**
 * 객체 하나의 원본 속성을 보관하는 생성 옵션입니다.
 *
 * @typedef {object} USequenceObjectPropertyVoCO
 * @property {string} [contentId] 자료 식별자
 * @property {string} [objectId] GUID 키
 * @property {import('../core/sequenceData.js').USequencePropertyJsonRecord} [record] 원본 속성 레코드
 */
/**
 * 원본에서 발견한 필드 경로와 타입을 보관합니다.
 */
declare class USequencePropertyFieldVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequencePropertyFieldVo 클래스 생성자입니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequencePropertyFieldVoCO} [opt={}] 생성 옵션 또는 복사할 VO <br>
     * 생략 시 기본값: {}.
     */
    constructor(opt?: USequencePropertyFieldVoCO);
    _path: string[];
    _propertySet: string | null;
    _name: string;
    _valueTypes: string[];
    /**
     * 원본 키 순서의 속성 경로를 저장합니다.
     *
     * @param {Array<string>} value 저장할 원본 키 순서의 속성 경로 <br>
     * 입력 컨테이너는 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set path(value: Array<string>);
    /**
     * 원본 키 순서의 속성 경로를 반환합니다.
     *
     * @returns {Array<string>} 원본 키 순서의 속성 경로의 복사본
     */
    get path(): Array<string>;
    /**
     * 속성셋 이름 또는 최상위 필드의 null을 저장합니다.
     *
     * @param {string | null} value 저장할 속성셋 이름 또는 최상위 필드의 null
     */
    set propertySet(value: string | null);
    /**
     * 속성셋 이름 또는 최상위 필드의 null을 반환합니다.
     *
     * @returns {string | null}
     */
    get propertySet(): string | null;
    /**
     * 마지막 키의 필드 이름를 저장합니다.
     *
     * @param {string} value 저장할 마지막 키의 필드 이름
     */
    set name(value: string);
    /**
     * 마지막 키의 필드 이름를 반환합니다.
     *
     * @returns {string}
     */
    get name(): string;
    /**
     * 발견한 JSON 타입 목록를 저장합니다.
     *
     * @param {Array<string>} value 저장할 발견한 JSON 타입 목록 <br>
     * 입력 컨테이너는 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set valueTypes(value: Array<string>);
    /**
     * 발견한 JSON 타입 목록를 반환합니다.
     *
     * @returns {Array<string>} 발견한 JSON 타입 목록의 복사본
     */
    get valueTypes(): Array<string>;
}
/**
 * 원본에서 발견한 필드 경로와 타입을 보관하는 생성 옵션입니다.
 *
 * @typedef {object} USequencePropertyFieldVoCO
 * @property {Array<string>} [path] 원본 키 순서의 속성 경로
 * @property {string | null} [propertySet] 속성셋 이름 또는 최상위 필드의 null
 * @property {string} [name] 마지막 키의 필드 이름
 * @property {Array<string>} [valueTypes] 발견한 JSON 타입 목록
 */
/**
 * 객체 속성의 경로, 비교 방식과 비교 값을 보관합니다.
 */
declare class USequencePropertyRuleVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequencePropertyRuleVo 클래스 생성자입니다. <br>
     * 생성 옵션의 이름을 정규화하고 입력값을 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequencePropertyRuleVoCO} [opt={}] 보관할 생성 옵션 또는 복사할 VO 입력 변경/소유권 이전 없음
     */
    constructor(opt?: USequencePropertyRuleVoCO);
    _path: string[];
    _operator: "equals" | "in" | "exists";
    _values: (string | number | boolean)[];
    _caseSensitive: boolean;
    /**
     * 속성 경로를 저장합니다. <br>
     * 속성 자료에서 값을 찾을 때 사용할 키를 순서대로 보관합니다. <br>
     * 전달한 값은 복사하여 보관합니다.
     *
     * @param {undefined | Array<string>} value 저장할 속성 경로 입력 변경/소유권 이전 없음
     */
    set path(value: undefined | Array<string>);
    /**
     * 속성 경로를 반환합니다. <br>
     * 속성 자료에서 값을 찾을 때 사용할 키를 순서대로 보관합니다. <br>
     * 반환값을 수정해도 이 VO에 보관된 값은 변경되지 않습니다.
     *
     * @returns {Array<string> | undefined} 속성 경로의 복사본
     */
    get path(): Array<string> | undefined;
    /**
     * 속성 비교 연산자를 저장합니다. <br>
     * equals는 같은 값, in은 목록 포함, exists는 값의 존재 여부를 비교합니다.
     *
     * @param {'equals' | 'in' | 'exists'} value 저장할 속성 비교 연산자 입력 변경/소유권 이전 없음
     */
    set operator(value: "equals" | "in" | "exists");
    /**
     * 속성 비교 연산자를 반환합니다. <br>
     * equals는 같은 값, in은 목록 포함, exists는 값의 존재 여부를 비교합니다.
     *
     * @returns {'equals' | 'in' | 'exists'}
     */
    get operator(): "equals" | "in" | "exists";
    /**
     * 속성 비교 값 목록을 저장합니다. <br>
     * 전달한 값은 복사하여 보관합니다.
     *
     * @param {Array<string | number | boolean>} value 저장할 속성 비교 값 목록 입력 변경/소유권 이전 없음
     */
    set values(value: Array<string | number | boolean>);
    /**
     * 속성 비교 값 목록을 반환합니다. <br>
     * 반환값을 수정해도 이 VO에 보관된 값은 변경되지 않습니다.
     *
     * @returns {Array<string | number | boolean>} 속성 비교 값 목록의 복사본
     */
    get values(): Array<string | number | boolean>;
    /**
     * 문자열 대소문자 구분 여부를 저장합니다.
     *
     * @param {boolean} value 저장할 문자열 대소문자 구분 여부 입력 변경/소유권 이전 없음
     */
    set caseSensitive(value: boolean);
    /**
     * 문자열 대소문자 구분 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get caseSensitive(): boolean;
}
/**
 * 객체 속성의 경로, 비교 방식과 비교 값을 지정하는 생성 옵션입니다.
 *
 * @typedef {object} USequencePropertyRuleVoCO
 * @property {Array<string>} [path] 속성 경로. 속성 자료에서 값을 찾을 때 사용할 키를 순서대로 보관합니다.
 * @property {'equals'|'in'|'exists'} [operator] 속성 비교 연산자. equals는 같은 값, in은 목록 포함, exists는 값의 존재 여부를 비교합니다.
 * @property {Array<string | number | boolean>} [values] 속성 비교 값 목록
 * @property {boolean} [caseSensitive] 문자열 대소문자 구분 여부
 */
/**
 * 조회 범위와 고유 값 및 누락 결과를 보관합니다.
 */
declare class USequencePropertyStatsVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequencePropertyStatsVo 클래스 생성자입니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequencePropertyStatsVoCO} [opt={}] 생성 옵션 또는 복사할 VO <br>
     * 생략 시 기본값: {}.
     */
    constructor(opt?: USequencePropertyStatsVoCO);
    _contentId: string;
    _path: string[];
    _scopeObjectIds: string[];
    _objectCount: number;
    _recordMissingObjectIds: string[];
    _propertyMissingObjectIds: string[];
    _nullObjectIds: string[];
    _emptyStringObjectIds: string[];
    _unsupportedObjectIds: string[];
    _values: USequencePropertyValueVo[];
    /**
     * 자료 식별자를 저장합니다.
     *
     * @param {string} value 저장할 자료 식별자
     */
    set contentId(value: string);
    /**
     * 자료 식별자를 반환합니다.
     *
     * @returns {string}
     */
    get contentId(): string;
    /**
     * 조회한 원본 속성 경로를 저장합니다.
     *
     * @param {Array<string>} value 저장할 조회한 원본 속성 경로 <br>
     * 입력 컨테이너는 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set path(value: Array<string>);
    /**
     * 조회한 원본 속성 경로를 반환합니다.
     *
     * @returns {Array<string>} 조회한 원본 속성 경로의 복사본
     */
    get path(): Array<string>;
    /**
     * 중복을 제거한 조회 대상 GUID를 저장합니다.
     *
     * @param {Array<string>} value 저장할 중복을 제거한 조회 대상 GUID <br>
     * 입력 컨테이너는 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set scopeObjectIds(value: Array<string>);
    /**
     * 중복을 제거한 조회 대상 GUID를 반환합니다.
     *
     * @returns {Array<string>} 중복을 제거한 조회 대상 GUID의 복사본
     */
    get scopeObjectIds(): Array<string>;
    /**
     * 레코드 누락을 포함한 조회 대상 수를 저장합니다.
     *
     * @param {number} value 저장할 레코드 누락을 포함한 조회 대상 수
     */
    set objectCount(value: number);
    /**
     * 레코드 누락을 포함한 조회 대상 수를 반환합니다.
     *
     * @returns {number}
     */
    get objectCount(): number;
    /**
     * 속성 레코드가 없는 GUID를 저장합니다.
     *
     * @param {Array<string>} value 저장할 속성 레코드가 없는 GUID <br>
     * 입력 컨테이너는 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set recordMissingObjectIds(value: Array<string>);
    /**
     * 속성 레코드가 없는 GUID를 반환합니다.
     *
     * @returns {Array<string>} 속성 레코드가 없는 GUID의 복사본
     */
    get recordMissingObjectIds(): Array<string>;
    /**
     * 속성 경로가 없는 GUID를 저장합니다.
     *
     * @param {Array<string>} value 저장할 속성 경로가 없는 GUID <br>
     * 입력 컨테이너는 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set propertyMissingObjectIds(value: Array<string>);
    /**
     * 속성 경로가 없는 GUID를 반환합니다.
     *
     * @returns {Array<string>} 속성 경로가 없는 GUID의 복사본
     */
    get propertyMissingObjectIds(): Array<string>;
    /**
     * 값이 null인 GUID를 저장합니다.
     *
     * @param {Array<string>} value 저장할 값이 null인 GUID <br>
     * 입력 컨테이너는 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set nullObjectIds(value: Array<string>);
    /**
     * 값이 null인 GUID를 반환합니다.
     *
     * @returns {Array<string>} 값이 null인 GUID의 복사본
     */
    get nullObjectIds(): Array<string>;
    /**
     * 값이 정확히 빈 문자열인 GUID를 저장합니다.
     *
     * @param {Array<string>} value 저장할 값이 정확히 빈 문자열인 GUID <br>
     * 입력 컨테이너는 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set emptyStringObjectIds(value: Array<string>);
    /**
     * 값이 정확히 빈 문자열인 GUID를 반환합니다.
     *
     * @returns {Array<string>} 값이 정확히 빈 문자열인 GUID의 복사본
     */
    get emptyStringObjectIds(): Array<string>;
    /**
     * 값이 배열 또는 객체인 GUID를 저장합니다.
     *
     * @param {Array<string>} value 저장할 값이 배열 또는 객체인 GUID <br>
     * 입력 컨테이너는 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set unsupportedObjectIds(value: Array<string>);
    /**
     * 값이 배열 또는 객체인 GUID를 반환합니다.
     *
     * @returns {Array<string>} 값이 배열 또는 객체인 GUID의 복사본
     */
    get unsupportedObjectIds(): Array<string>;
    /**
     * scalar 고유 값별 조회 결과를 저장합니다.
     *
     * @param {Array<import('./sequenceDefinitionVos.js').USequencePropertyValueVo>} value 저장할 scalar 고유 값별 조회 결과 <br>
     * 입력 컨테이너는 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set values(value: Array<USequencePropertyValueVo>);
    /**
     * scalar 고유 값별 조회 결과를 반환합니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequencePropertyValueVo>} scalar 고유 값별 조회 결과의 복사본
     */
    get values(): Array<USequencePropertyValueVo>;
}
/**
 * 조회 범위와 고유 값 및 누락 결과를 보관하는 생성 옵션입니다.
 *
 * @typedef {object} USequencePropertyStatsVoCO
 * @property {string} [contentId] 자료 식별자
 * @property {Array<string>} [path] 조회한 원본 속성 경로
 * @property {Array<string>} [scopeObjectIds] 중복을 제거한 조회 대상 GUID
 * @property {number} [objectCount] 레코드 누락을 포함한 조회 대상 수
 * @property {Array<string>} [recordMissingObjectIds] 속성 레코드가 없는 GUID
 * @property {Array<string>} [propertyMissingObjectIds] 속성 경로가 없는 GUID
 * @property {Array<string>} [nullObjectIds] 값이 null인 GUID
 * @property {Array<string>} [emptyStringObjectIds] 값이 정확히 빈 문자열인 GUID
 * @property {Array<string>} [unsupportedObjectIds] 값이 배열 또는 객체인 GUID
 * @property {Array<USequencePropertyValueVo>} [values] scalar 고유 값별 조회 결과
 */
/**
 * 고유 값과 그 값을 가진 객체 식별자를 보관합니다.
 */
declare class USequencePropertyValueVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequencePropertyValueVo 클래스 생성자입니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequencePropertyValueVoCO} [opt={}] 생성 옵션 또는 복사할 VO <br>
     * 생략 시 기본값: {}.
     */
    constructor(opt?: USequencePropertyValueVoCO);
    _valueType: "string" | "number" | "boolean";
    _value: string | number | boolean;
    _objectIds: string[];
    /**
     * 원래 값의 scalar 타입를 저장합니다.
     *
     * @param {'string' | 'number' | 'boolean'} value 저장할 원래 값의 scalar 타입
     */
    set valueType(value: "string" | "number" | "boolean");
    /**
     * 원래 값의 scalar 타입를 반환합니다.
     *
     * @returns {'string' | 'number' | 'boolean'}
     */
    get valueType(): "string" | "number" | "boolean";
    /**
     * 타입을 변환하지 않은 고유 값를 저장합니다.
     *
     * @param {string | number | boolean} value 저장할 타입을 변환하지 않은 고유 값
     */
    set value(value: string | number | boolean);
    /**
     * 타입을 변환하지 않은 고유 값를 반환합니다.
     *
     * @returns {string | number | boolean}
     */
    get value(): string | number | boolean;
    /**
     * 같은 값을 가진 중복 없는 GUID 목록를 저장합니다.
     *
     * @param {Array<string>} value 저장할 같은 값을 가진 중복 없는 GUID 목록 <br>
     * 입력 컨테이너는 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set objectIds(value: Array<string>);
    /**
     * 같은 값을 가진 중복 없는 GUID 목록를 반환합니다.
     *
     * @returns {Array<string>} 같은 값을 가진 중복 없는 GUID 목록의 복사본
     */
    get objectIds(): Array<string>;
}
/**
 * 고유 값과 그 값을 가진 객체 식별자를 보관하는 생성 옵션입니다.
 *
 * @typedef {object} USequencePropertyValueVoCO
 * @property {'string' | 'number' | 'boolean'} [valueType] 원래 값의 scalar 타입
 * @property {string | number | boolean} [value] 타입을 변환하지 않은 고유 값
 * @property {Array<string>} [objectIds] 같은 값을 가진 중복 없는 GUID 목록
 */
/**
 * 부재 목록의 종류·그룹·표시 ID 속성 경로를 보관합니다.
 */
declare class USequenceObjectListConfigVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceObjectListConfigVo 클래스 생성자입니다. <br>
     * 세 필드의 기본 경로 또는 독립 사본을 준비합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceObjectListConfigVoCO | import('./sequenceDefinitionVos.js').USequenceObjectListConfigVo} [opt={}] 복사할 목록 표시 설정
     */
    constructor(opt?: USequenceObjectListConfigVoCO | USequenceObjectListConfigVo);
    /**
     * 종류를 읽을 원본 속성 경로 값을 보관합니다.
     *
     * @param {any} value 종류를 읽을 원본 속성 경로 요청 값입니다. <br>
     * 입력 원본의 소유권은 호출자에게 있습니다.
     */
    set kindPath(value: any);
    /**
     * 종류를 읽을 원본 속성 경로 값을 조회합니다.
     *
     * @returns {any}
     */
    get kindPath(): any;
    /**
     * 그룹값을 읽을 원본 속성 경로 값을 보관합니다.
     *
     * @param {any} value 그룹값을 읽을 원본 속성 경로 요청 값입니다. <br>
     * 입력 원본의 소유권은 호출자에게 있습니다.
     */
    set groupPath(value: any);
    /**
     * 그룹값을 읽을 원본 속성 경로 값을 조회합니다.
     *
     * @returns {any}
     */
    get groupPath(): any;
    /**
     * 표시 ID를 읽을 원본 속성 경로 값을 보관합니다.
     *
     * @param {any} value 표시 ID를 읽을 원본 속성 경로 요청 값입니다. <br>
     * 입력 원본의 소유권은 호출자에게 있습니다.
     */
    set idPath(value: any);
    /**
     * 표시 ID를 읽을 원본 속성 경로 값을 조회합니다.
     *
     * @returns {any}
     */
    get idPath(): any;
    _kindPath: any[] | undefined;
    _groupPath: any[] | undefined;
    _idPath: any[] | undefined;
}
/**
 * 부재 목록의 원본 속성 경로 설정입니다.
 * @typedef {object} USequenceObjectListConfigVoCO
 * @property {string[]} [kindPath] 기본 ["Properties","ID 데이터","Level 5"]. 배열을 복사합니다.
 * @property {string[]} [groupPath] 기본 ["Properties","ID 데이터","Level 6"]. 배열을 복사합니다.
 * @property {string[]} [idPath] 기본 ["Tag"]. 누락·null·빈 문자열이면 GUID를 표시합니다.
 */
/**
 * 형상 GUID 한 개의 목록 표시값을 보관합니다.
 */
declare class USequenceObjectListItemVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceObjectListItemVo 클래스 생성자입니다. <br>
     * 영구 GUID와 원래 자료형의 분류값을 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceObjectListItemVoCO | import('./sequenceDefinitionVos.js').USequenceObjectListItemVo} [opt={}] 복사할 객체 목록 항목
     */
    constructor(opt?: USequenceObjectListItemVoCO | USequenceObjectListItemVo);
    /** @type {string} */
    _contentId: string;
    /** @type {string} */
    _objectId: string;
    /**
     * 원래 자료형을 보존한 종류 값을 보관합니다.
     *
     * @param {any} value 원래 자료형을 보존한 종류 요청 값입니다. <br>
     * 입력 원본의 소유권은 호출자에게 있습니다.
     */
    set kindValue(value: any);
    /**
     * 원래 자료형을 보존한 종류 값을 조회합니다.
     *
     * @returns {any}
     */
    get kindValue(): any;
    /**
     * 원래 자료형을 보존한 그룹 값을 보관합니다.
     *
     * @param {any} value 원래 자료형을 보존한 그룹 요청 값입니다. <br>
     * 입력 원본의 소유권은 호출자에게 있습니다.
     */
    set groupValue(value: any);
    /**
     * 원래 자료형을 보존한 그룹 값을 조회합니다.
     *
     * @returns {any}
     */
    get groupValue(): any;
    /** @type {string} */
    _displayId: string;
    /** @type {string} */
    _name: string;
    /**
     * 자료 식별자 값을 보관합니다.
     *
     * @param {any} value 자료 식별자 요청 값입니다. <br>
     * 입력 원본의 소유권은 호출자에게 있습니다.
     */
    set contentId(value: any);
    /**
     * 자료 식별자 값을 조회합니다.
     *
     * @returns {any}
     */
    get contentId(): any;
    /**
     * 실제 메쉬와 속성을 연결하는 영구 GUID 값을 보관합니다.
     *
     * @param {any} value 실제 메쉬와 속성을 연결하는 영구 GUID 요청 값입니다. <br>
     * 입력 원본의 소유권은 호출자에게 있습니다.
     */
    set objectId(value: any);
    /**
     * 실제 메쉬와 속성을 연결하는 영구 GUID 값을 조회합니다.
     *
     * @returns {any}
     */
    get objectId(): any;
    _kindValue: USequencePropertyJsonValue$1 | undefined;
    _groupValue: USequencePropertyJsonValue$1 | undefined;
    /**
     * 화면에 표시하는 ID 값을 보관합니다.
     *
     * @param {any} value 화면에 표시하는 ID 요청 값입니다. <br>
     * 입력 원본의 소유권은 호출자에게 있습니다.
     */
    set displayId(value: any);
    /**
     * 화면에 표시하는 ID 값을 조회합니다.
     *
     * @returns {any}
     */
    get displayId(): any;
    /**
     * 검색과 보조 표시에 쓰는 원본 이름 값을 보관합니다.
     *
     * @param {any} value 검색과 보조 표시에 쓰는 원본 이름 요청 값입니다. <br>
     * 입력 원본의 소유권은 호출자에게 있습니다.
     */
    set name(value: any);
    /**
     * 검색과 보조 표시에 쓰는 원본 이름 값을 조회합니다.
     *
     * @returns {any}
     */
    get name(): any;
}
/**
 * 형상 GUID 하나의 목록 표시 데이터입니다.
 *
 * @typedef {object} USequenceObjectListItemVoCO
 * @property {string} [contentId=""] 자료 식별자입니다.
 * @property {string} [objectId=""] 실제 메쉬·속성 연결 GUID입니다.
 * @property {import('../core/sequenceData.js').USequencePropertyJsonValue} [kindValue] 원래 자료형의 종류 값입니다. <br>
 * 누락은 undefined입니다.
 * @property {import('../core/sequenceData.js').USequencePropertyJsonValue} [groupValue] 원래 자료형의 그룹값입니다. <br>
 * 누락은 undefined입니다.
 * @property {string} [displayId] 표시 ID입니다. <br>
 * 기본 objectId입니다.
 * @property {string} [name=""] 원본 이름입니다.
 */
/** @import {USequencePropertyJsonRecord,USequencePropertyJsonValue} from "../core/sequenceData.js" */
/**
 * 시퀀스의 형상 참조, 객체 그룹, 공정 단계와 조립 이동 구간을 보관합니다.
 */
declare class USequenceVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceVo 클래스 생성자입니다. <br>
     * 생성 옵션의 이름을 정규화하고 입력값을 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceVoCO} [opt={}] 보관할 생성 옵션 또는 복사할 VO
     */
    constructor(opt?: USequenceVoCO);
    _format: string;
    _schemaVersion: string;
    _id: string | undefined;
    _type: string;
    _description: string;
    _keywords: string[];
    _content: USequenceContentVo | undefined;
    _timeline: USequenceTimelineVo | undefined;
    _offsetOrigin: [number, number, number];
    _offsetSpace: "enu";
    _offsetUnit: "m";
    _unassignedPolicy: "visible" | "hidden";
    _groups: USequenceGroupVo[];
    _phases: USequencePhaseVo[];
    _tracks: USequenceTrackVo[];
    _progression: USequenceProgressionVo | undefined;
    _explodeLayout: USequenceExplodeLayoutVo | undefined;
    /**
     * 선택적인 부재별 분리 설정을 독립 복사합니다.
     *
     * @param {undefined | import('./sequenceDefinitionVos.js').USequenceExplodeLayoutVo} value 자료형 USequenceExplodeLayoutVo 또는 생성 옵션입니다. <br>
     * undefined이면 기존 고정 이동량 방식을 유지하며 null은 허용하지 않습니다.
     */
    set explodeLayout(value: undefined | USequenceExplodeLayoutVo);
    /**
     * 선택적인 부재별 분리 설정의 독립 사본 또는 undefined를 반환합니다.
     *
     * @returns {undefined | import('./sequenceDefinitionVos.js').USequenceExplodeLayoutVo} 선택적인 부재별 분리 설정의 독립 사본 또는 undefined
     */
    get explodeLayout(): undefined | USequenceExplodeLayoutVo;
    /**
     * 선택적인 점층 설정을 중첩 복사합니다.
     *
     * @param {undefined | import('./sequenceDefinitionVos.js').USequenceProgressionVo} value 자료형 USequenceProgressionVo 또는 생성 옵션입니다. <br>
     * undefined이면 이전 그룹 단위 재생 계약을 유지합니다.
     */
    set progression(value: undefined | USequenceProgressionVo);
    /**
     * 선택적인 점층 설정의 독립 사본 또는 기존 계약의 undefined를 반환합니다.
     *
     * @returns {undefined | import('./sequenceDefinitionVos.js').USequenceProgressionVo} 선택적인 점층 설정의 독립 사본 또는 기존 계약의 undefined
     */
    get progression(): undefined | USequenceProgressionVo;
    /**
     * 시퀀스 파일 형식을 저장합니다.
     *
     * @param {string} value 저장할 시퀀스 파일 형식
     */
    set format(value: string);
    /**
     * 시퀀스 파일 형식을 반환합니다.
     *
     * @returns {string}
     */
    get format(): string;
    /**
     * 시퀀스 계약 버전을 저장합니다.
     *
     * @param {string} value 저장할 시퀀스 계약 버전
     */
    set schemaVersion(value: string);
    /**
     * 시퀀스 계약 버전을 반환합니다.
     *
     * @returns {string}
     */
    get schemaVersion(): string;
    /**
     * 시퀀스 식별자를 저장합니다.
     *
     * @param {undefined | string} value 저장할 시퀀스 식별자
     */
    set id(value: undefined | string);
    /**
     * 시퀀스 식별자를 반환합니다.
     *
     * @returns {undefined | string}
     */
    get id(): undefined | string;
    /**
     * 자료 유형을 저장합니다.
     *
     * @param {string} value 저장할 자료 유형
     */
    set type(value: string);
    /**
     * 자료 유형을 반환합니다.
     *
     * @returns {string}
     */
    get type(): string;
    /**
     * 자료 설명을 저장합니다.
     *
     * @param {string} value 저장할 자료 설명
     */
    set description(value: string);
    /**
     * 자료 설명을 반환합니다.
     *
     * @returns {string}
     */
    get description(): string;
    /**
     * 검색 키워드를 저장합니다. <br>
     * 전달한 값은 복사하여 보관합니다.
     *
     * @param {Array<string>} value 저장할 검색 키워드
     */
    set keywords(value: Array<string>);
    /**
     * 검색 키워드를 반환합니다. <br>
     * 반환값을 수정해도 이 VO에 보관된 값은 변경되지 않습니다.
     *
     * @returns {Array<string>} 검색 키워드의 복사본
     */
    get keywords(): Array<string>;
    /**
     * 형상 자료 참조를 저장합니다. <br>
     * 전달한 값은 복사하여 보관합니다.
     *
     * @param {undefined | import('./sequenceDefinitionVos.js').USequenceContentVo} value 저장할 형상 자료 참조
     */
    set content(value: undefined | USequenceContentVo);
    /**
     * 형상 자료 참조를 반환합니다. <br>
     * 반환값을 수정해도 이 VO에 보관된 값은 변경되지 않습니다.
     *
     * @returns {undefined | import('./sequenceDefinitionVos.js').USequenceContentVo} 형상 자료 참조의 복사본
     */
    get content(): undefined | USequenceContentVo;
    /**
     * 재생 시간 축을 저장합니다. <br>
     * 전달한 값은 복사하여 보관합니다.
     *
     * @param {undefined | import('./sequenceDefinitionVos.js').USequenceTimelineVo} value 저장할 재생 시간 축
     */
    set timeline(value: undefined | USequenceTimelineVo);
    /**
     * 재생 시간 축을 반환합니다. <br>
     * 반환값을 수정해도 이 VO에 보관된 값은 변경되지 않습니다.
     *
     * @returns {undefined | import('./sequenceDefinitionVos.js').USequenceTimelineVo} 재생 시간 축의 복사본
     */
    get timeline(): undefined | USequenceTimelineVo;
    /**
     * 이동 기준점을 저장합니다. <br>
     * 위경도 좌표계(EPSG:4326)의 경도·위도(도)와 타원체고(m)를 순서대로 사용합니다. <br>
     * 전달한 값은 복사하여 보관합니다.
     *
     * @param {undefined | [ number, number, number ]} value 저장할 이동 기준점
     */
    set offsetOrigin(value: undefined | [number, number, number]);
    /**
     * 이동 기준점을 반환합니다. <br>
     * 위경도 좌표계(EPSG:4326)의 경도·위도(도)와 타원체고(m)를 순서대로 사용합니다. <br>
     * 반환값을 수정해도 이 VO에 보관된 값은 변경되지 않습니다.
     *
     * @returns {undefined | [ number, number, number ]} 이동 기준점의 복사본
     */
    get offsetOrigin(): undefined | [number, number, number];
    /**
     * 이동 좌표 기준을 저장합니다. <br>
     * 이동 기준점에서 동·북·상 방향을 사용하는 enu 값입니다.
     *
     * @param {'enu'} value 저장할 이동 좌표 기준
     */
    set offsetSpace(value: "enu");
    /**
     * 이동 좌표 기준을 반환합니다. <br>
     * 이동 기준점에서 동·북·상 방향을 사용하는 enu 값입니다.
     *
     * @returns {'enu'}
     */
    get offsetSpace(): "enu";
    /**
     * 이동 거리 단위를 저장합니다. <br>
     * 이동 거리는 미터 단위인 m을 사용합니다.
     *
     * @param {'m'} value 저장할 이동 거리 단위
     */
    set offsetUnit(value: "m");
    /**
     * 이동 거리 단위를 반환합니다. <br>
     * 이동 거리는 미터 단위인 m을 사용합니다.
     *
     * @returns {'m'}
     */
    get offsetUnit(): "m";
    /**
     * 미분류 객체 표시 정책을 저장합니다. <br>
     * visible은 미분류 객체를 표시하고 hidden은 숨기는 정책입니다.
     *
     * @param {'visible' | 'hidden'} value 저장할 미분류 객체 표시 정책
     */
    set unassignedPolicy(value: "visible" | "hidden");
    /**
     * 미분류 객체 표시 정책을 반환합니다. <br>
     * visible은 미분류 객체를 표시하고 hidden은 숨기는 정책입니다.
     *
     * @returns {'visible' | 'hidden'}
     */
    get unassignedPolicy(): "visible" | "hidden";
    /**
     * 객체 그룹 목록을 저장합니다. <br>
     * 전달한 값은 복사하여 보관합니다.
     *
     * @param {Array<import('./sequenceDefinitionVos.js').USequenceGroupVo>} value 저장할 객체 그룹 목록
     */
    set groups(value: Array<USequenceGroupVo>);
    /**
     * 객체 그룹 목록을 반환합니다. <br>
     * 반환값을 수정해도 이 VO에 보관된 값은 변경되지 않습니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceGroupVo>} 객체 그룹 목록의 복사본
     */
    get groups(): Array<USequenceGroupVo>;
    /**
     * 공정 단계 목록을 저장합니다. <br>
     * 전달한 값은 복사하여 보관합니다.
     *
     * @param {Array<import('./sequenceDefinitionVos.js').USequencePhaseVo>} value 저장할 공정 단계 목록
     */
    set phases(value: Array<USequencePhaseVo>);
    /**
     * 공정 단계 목록을 반환합니다. <br>
     * 반환값을 수정해도 이 VO에 보관된 값은 변경되지 않습니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequencePhaseVo>} 공정 단계 목록의 복사본
     */
    get phases(): Array<USequencePhaseVo>;
    /**
     * 조립 이동 트랙 목록을 저장합니다. <br>
     * 전달한 값은 복사하여 보관합니다.
     *
     * @param {Array<import('./sequenceDefinitionVos.js').USequenceTrackVo>} value 저장할 조립 이동 트랙 목록
     */
    set tracks(value: Array<USequenceTrackVo>);
    /**
     * 조립 이동 트랙 목록을 반환합니다. <br>
     * 반환값을 수정해도 이 VO에 보관된 값은 변경되지 않습니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceTrackVo>} 조립 이동 트랙 목록의 복사본
     */
    get tracks(): Array<USequenceTrackVo>;
}
/**
 * 시퀀스의 형상 참조, 객체 그룹, 공정 단계와 조립 이동 구간을 지정하는 생성 옵션입니다.
 *
 * @typedef {object} USequenceVoCO
 * @property {string} [format] 시퀀스 파일 형식
 * @property {string} [schemaVersion] 시퀀스 계약 버전
 * @property {string} [id] 시퀀스 식별자
 * @property {string} [type] 자료 유형
 * @property {string} [description] 자료 설명
 * @property {Array<string>} [keywords] 검색 키워드
 * @property {USequenceContentVo | USequenceContentVoCO} [content] 형상 자료 참조
 * @property {USequenceTimelineVo | USequenceTimelineVoCO} [timeline] 재생 시간 축
 * @property {[number,number,number]} [offsetOrigin] 이동 기준점. 위경도 좌표계(EPSG:4326)의 경도·위도(도)와 타원체고(m)를 순서대로 사용합니다.
 * @property {'enu'} [offsetSpace] 이동 좌표 기준. 이동 기준점에서 동·북·상 방향을 사용하는 enu 값입니다.
 * @property {'m'} [offsetUnit] 이동 거리 단위. 이동 거리는 미터 단위인 m을 사용합니다.
 * @property {'visible'|'hidden'} [unassignedPolicy] 미분류 객체 표시 정책. visible은 미분류 객체를 표시하고 hidden은 숨기는 정책입니다.
 * @property {Array<USequenceGroupVo | USequenceGroupVoCO>} [groups] 객체 그룹 목록
 * @property {Array<USequencePhaseVo | USequencePhaseVoCO>} [phases] 공정 단계 목록
 * @property {Array<USequenceTrackVo | USequenceTrackVoCO>} [tracks] 조립 이동 트랙 목록
 * @property {USequenceExplodeLayoutVo | USequenceExplodeLayoutVoCO} [explodeLayout] 선택적인 부재별 분리 배치 설정. 생략 시 기존 고정 이동량 유지
 * @property {USequenceProgressionVo | USequenceProgressionVoCO} [progression] 선택적인 근거리 점층 조립 설정. 생략 시 기존 재생 유지
 */
/**
 * 시퀀스가 제어할 형상 자료와 속성 자료의 참조를 보관합니다.
 */
declare class USequenceContentVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceContentVo 클래스 생성자입니다. <br>
     * 생성 옵션의 이름을 정규화하고 입력값을 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceContentVoCO} [opt={}] 보관할 생성 옵션 또는 복사할 VO 입력 변경/소유권 이전 없음
     */
    constructor(opt?: USequenceContentVoCO);
    _id: string | undefined;
    _format: "3dtiles" | "a3f";
    _uri: string | undefined;
    _propertiesUri: string | null;
    _revision: string | undefined;
    _objectIdType: string;
    /**
     * 형상 자료 식별자를 저장합니다.
     *
     * @param {undefined | string} value 저장할 형상 자료 식별자 입력 변경/소유권 이전 없음
     */
    set id(value: undefined | string);
    /**
     * 형상 자료 식별자를 반환합니다.
     *
     * @returns {undefined | string}
     */
    get id(): undefined | string;
    /**
     * 형상 파일 형식을 저장합니다.
     *
     * @param {'3dtiles' | 'a3f'} value 저장할 형상 파일 형식 입력 변경/소유권 이전 없음
     */
    set format(value: "3dtiles" | "a3f");
    /**
     * 형상 파일 형식을 반환합니다.
     *
     * @returns {'3dtiles' | 'a3f'}
     */
    get format(): "3dtiles" | "a3f";
    /**
     * 형상 자료 URI를 저장합니다.
     *
     * @param {undefined | string} value 저장할 형상 자료 URI 입력 변경/소유권 이전 없음
     */
    set uri(value: undefined | string);
    /**
     * 형상 자료 URI를 반환합니다.
     *
     * @returns {undefined | string}
     */
    get uri(): undefined | string;
    /**
     * 속성 자료 URI를 저장합니다.
     *
     * @param {string | null} value 저장할 속성 자료 URI 입력 변경/소유권 이전 없음
     */
    set propertiesUri(value: string | null);
    /**
     * 속성 자료 URI를 반환합니다.
     *
     * @returns {string | null}
     */
    get propertiesUri(): string | null;
    /**
     * 원본 자료 버전을 저장합니다.
     *
     * @param {undefined | string} value 저장할 원본 자료 버전 입력 변경/소유권 이전 없음
     */
    set revision(value: undefined | string);
    /**
     * 원본 자료 버전을 반환합니다.
     *
     * @returns {undefined | string}
     */
    get revision(): undefined | string;
    /**
     * 객체 식별자 체계를 저장합니다.
     *
     * @param {string} value 저장할 객체 식별자 체계 입력 변경/소유권 이전 없음
     */
    set objectIdType(value: string);
    /**
     * 객체 식별자 체계를 반환합니다.
     *
     * @returns {string}
     */
    get objectIdType(): string;
}
/**
 * 시퀀스가 제어할 형상 자료와 속성 자료의 참조를 지정하는 생성 옵션입니다.
 *
 * @typedef {object} USequenceContentVoCO
 * @property {string} [id] 형상 자료 식별자
 * @property {'3dtiles'|'a3f'} [format] 형상 파일 형식
 * @property {string} [uri] 형상 자료 URI
 * @property {string|null} [propertiesUri] 속성 자료 URI
 * @property {string} [revision] 원본 자료 버전
 * @property {string} [objectIdType] 객체 식별자 체계
 */
/**
 * 같이 이동할 객체의 식별자, 분류 조건과 분리 거리를 보관합니다.
 */
declare class USequenceGroupVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceGroupVo 클래스 생성자입니다. <br>
     * 생성 옵션의 이름을 정규화하고 입력값을 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceGroupVoCO} [opt={}] 보관할 생성 옵션 또는 복사할 VO 입력 변경/소유권 이전 없음
     */
    constructor(opt?: USequenceGroupVoCO);
    _id: string | undefined;
    _name: string | undefined;
    _description: string;
    _rules: USequencePropertyRuleVo[];
    _ruleMatch: "all" | "any";
    _includeObjectIds: string[];
    _excludeObjectIds: string[];
    _objectIds: string[];
    _explodeOffset: [number, number, number];
    /**
     * 그룹 식별자를 저장합니다.
     *
     * @param {undefined | string} value 저장할 그룹 식별자 입력 변경/소유권 이전 없음
     */
    set id(value: undefined | string);
    /**
     * 그룹 식별자를 반환합니다.
     *
     * @returns {undefined | string}
     */
    get id(): undefined | string;
    /**
     * 그룹 이름을 저장합니다.
     *
     * @param {undefined | string} value 저장할 그룹 이름 입력 변경/소유권 이전 없음
     */
    set name(value: undefined | string);
    /**
     * 그룹 이름을 반환합니다.
     *
     * @returns {undefined | string}
     */
    get name(): undefined | string;
    /**
     * 그룹 설명을 저장합니다.
     *
     * @param {string} value 저장할 그룹 설명 입력 변경/소유권 이전 없음
     */
    set description(value: string);
    /**
     * 그룹 설명을 반환합니다.
     *
     * @returns {string}
     */
    get description(): string;
    /**
     * 속성 분류 조건 목록을 저장합니다. <br>
     * 전달한 값은 복사하여 보관합니다.
     *
     * @param {Array<import('./sequenceDefinitionVos.js').USequencePropertyRuleVo>} value 저장할 속성 분류 조건 목록 입력 변경/소유권 이전 없음
     */
    set rules(value: Array<USequencePropertyRuleVo>);
    /**
     * 속성 분류 조건 목록을 반환합니다. <br>
     * 반환값을 수정해도 이 VO에 보관된 값은 변경되지 않습니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequencePropertyRuleVo>} 속성 분류 조건 목록의 복사본
     */
    get rules(): Array<USequencePropertyRuleVo>;
    /**
     * 분류 조건 결합 방식을 저장합니다. <br>
     * all은 모든 조건을 만족하고 any는 하나 이상의 조건을 만족하는 방식입니다.
     *
     * @param {'all' | 'any'} value 저장할 분류 조건 결합 방식 입력 변경/소유권 이전 없음
     */
    set ruleMatch(value: "all" | "any");
    /**
     * 분류 조건 결합 방식을 반환합니다. <br>
     * all은 모든 조건을 만족하고 any는 하나 이상의 조건을 만족하는 방식입니다.
     *
     * @returns {'all' | 'any'}
     */
    get ruleMatch(): "all" | "any";
    /**
     * 수동 포함 객체 식별자 목록을 저장합니다. <br>
     * 전달한 값은 복사하여 보관합니다.
     *
     * @param {Array<string>} value 저장할 수동 포함 객체 식별자 목록 입력 변경/소유권 이전 없음
     */
    set includeObjectIds(value: Array<string>);
    /**
     * 수동 포함 객체 식별자 목록을 반환합니다. <br>
     * 반환값을 수정해도 이 VO에 보관된 값은 변경되지 않습니다.
     *
     * @returns {Array<string>} 수동 포함 객체 식별자 목록의 복사본
     */
    get includeObjectIds(): Array<string>;
    /**
     * 수동 제외 객체 식별자 목록을 저장합니다. <br>
     * 전달한 값은 복사하여 보관합니다.
     *
     * @param {Array<string>} value 저장할 수동 제외 객체 식별자 목록 입력 변경/소유권 이전 없음
     */
    set excludeObjectIds(value: Array<string>);
    /**
     * 수동 제외 객체 식별자 목록을 반환합니다. <br>
     * 반환값을 수정해도 이 VO에 보관된 값은 변경되지 않습니다.
     *
     * @returns {Array<string>} 수동 제외 객체 식별자 목록의 복사본
     */
    get excludeObjectIds(): Array<string>;
    /**
     * 확정 객체 식별자 목록을 저장합니다. <br>
     * 사용자가 확정한 재생용 객체 식별자 목록입니다. <br>
     * 전달한 값은 복사하여 보관합니다.
     *
     * @param {Array<string>} value 저장할 확정 객체 식별자 목록 입력 변경/소유권 이전 없음
     */
    set objectIds(value: Array<string>);
    /**
     * 확정 객체 식별자 목록을 반환합니다. <br>
     * 사용자가 확정한 재생용 객체 식별자 목록입니다. <br>
     * 반환값을 수정해도 이 VO에 보관된 값은 변경되지 않습니다.
     *
     * @returns {Array<string>} 확정 객체 식별자 목록의 복사본
     */
    get objectIds(): Array<string>;
    /**
     * 그룹 분리 이동 거리를 저장합니다. <br>
     * 분리율이 1일 때 더할 동·북·상 방향의 거리이며 단위는 미터입니다. <br>
     * 전달한 값은 복사하여 보관합니다.
     *
     * @param {[ number, number, number ]} value 저장할 그룹 분리 이동 거리 입력 변경/소유권 이전 없음
     */
    set explodeOffset(value: [number, number, number]);
    /**
     * 그룹 분리 이동 거리를 반환합니다. <br>
     * 분리율이 1일 때 더할 동·북·상 방향의 거리이며 단위는 미터입니다. <br>
     * 반환값을 수정해도 이 VO에 보관된 값은 변경되지 않습니다.
     *
     * @returns {[ number, number, number ]} 그룹 분리 이동 거리의 복사본
     */
    get explodeOffset(): [number, number, number];
}
/**
 * 같이 이동할 객체의 식별자, 분류 조건과 분리 거리를 지정하는 생성 옵션입니다.
 *
 * @typedef {object} USequenceGroupVoCO
 * @property {string} [id] 그룹 식별자
 * @property {string} [name] 그룹 이름
 * @property {string} [description] 그룹 설명
 * @property {Array<USequencePropertyRuleVo | USequencePropertyRuleVoCO>} [rules] 속성 분류 조건 목록
 * @property {'all'|'any'} [ruleMatch] 분류 조건 결합 방식. all은 모든 조건을 만족하고 any는 하나 이상의 조건을 만족하는 방식입니다.
 * @property {Array<string>} [includeObjectIds] 수동 포함 객체 식별자 목록
 * @property {Array<string>} [excludeObjectIds] 수동 제외 객체 식별자 목록
 * @property {Array<string>} [objectIds] 확정 객체 식별자 목록. 사용자가 확정한 재생용 객체 식별자 목록입니다.
 * @property {[number,number,number]} [explodeOffset] 그룹 분리 이동 거리. 분리율이 1일 때 더할 동·북·상 방향의 거리이며 단위는 미터입니다.
 */
/**
 * 공정 단계의 이름과 시작·완료 시각을 보관합니다.
 */
declare class USequencePhaseVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequencePhaseVo 클래스 생성자입니다. <br>
     * 생성 옵션의 이름을 정규화하고 입력값을 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequencePhaseVoCO} [opt={}] 보관할 생성 옵션 또는 복사할 VO 입력 변경/소유권 이전 없음
     */
    constructor(opt?: USequencePhaseVoCO);
    _id: string | undefined;
    _name: string | undefined;
    _startTime: number | undefined;
    _endTime: number | undefined;
    /**
     * 단계 식별자를 저장합니다.
     *
     * @param {undefined | string} value 저장할 단계 식별자 입력 변경/소유권 이전 없음
     */
    set id(value: undefined | string);
    /**
     * 단계 식별자를 반환합니다.
     *
     * @returns {undefined | string}
     */
    get id(): undefined | string;
    /**
     * 단계 이름을 저장합니다.
     *
     * @param {undefined | string} value 저장할 단계 이름 입력 변경/소유권 이전 없음
     */
    set name(value: undefined | string);
    /**
     * 단계 이름을 반환합니다.
     *
     * @returns {undefined | string}
     */
    get name(): undefined | string;
    /**
     * 단계 시작 시각을 저장합니다. <br>
     * 시간 단위는 초입니다.
     *
     * @param {undefined | number} value 저장할 단계 시작 시각 입력 변경/소유권 이전 없음
     */
    set startTime(value: undefined | number);
    /**
     * 단계 시작 시각을 반환합니다. <br>
     * 시간 단위는 초입니다.
     *
     * @returns {undefined | number}
     */
    get startTime(): undefined | number;
    /**
     * 단계 완료 시각을 저장합니다. <br>
     * 시간 단위는 초입니다.
     *
     * @param {undefined | number} value 저장할 단계 완료 시각 입력 변경/소유권 이전 없음
     */
    set endTime(value: undefined | number);
    /**
     * 단계 완료 시각을 반환합니다. <br>
     * 시간 단위는 초입니다.
     *
     * @returns {undefined | number}
     */
    get endTime(): undefined | number;
}
/**
 * 공정 단계의 이름과 시작·완료 시각을 지정하는 생성 옵션입니다.
 *
 * @typedef {object} USequencePhaseVoCO
 * @property {string} [id] 단계 식별자
 * @property {string} [name] 단계 이름
 * @property {number} [startTime] 단계 시작 시각. 시간 단위는 초입니다.
 * @property {number} [endTime] 단계 완료 시각. 시간 단위는 초입니다.
 */
/**
 * 객체 그룹이 조립되는 시간 구간과 시작·완료 이동 거리를 보관합니다.
 */
declare class USequenceTrackVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceTrackVo 클래스 생성자입니다. <br>
     * 생성 옵션의 이름을 정규화하고 입력값을 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceTrackVoCO} [opt={}] 보관할 생성 옵션 또는 복사할 VO 입력 변경/소유권 이전 없음
     */
    constructor(opt?: USequenceTrackVoCO);
    _id: string | undefined;
    _groupId: string | undefined;
    _phaseId: string | undefined;
    _startTime: number | undefined;
    _endTime: number | undefined;
    _fromOffset: [number, number, number];
    _toOffset: [number, number, number];
    _easing: "linear" | "smoothstep";
    /**
     * 트랙 식별자를 저장합니다.
     *
     * @param {undefined | string} value 저장할 트랙 식별자 입력 변경/소유권 이전 없음
     */
    set id(value: undefined | string);
    /**
     * 트랙 식별자를 반환합니다.
     *
     * @returns {undefined | string}
     */
    get id(): undefined | string;
    /**
     * 이동 대상 그룹 식별자를 저장합니다.
     *
     * @param {undefined | string} value 저장할 이동 대상 그룹 식별자 입력 변경/소유권 이전 없음
     */
    set groupId(value: undefined | string);
    /**
     * 이동 대상 그룹 식별자를 반환합니다.
     *
     * @returns {undefined | string}
     */
    get groupId(): undefined | string;
    /**
     * 공정 단계 식별자를 저장합니다.
     *
     * @param {undefined | string} value 저장할 공정 단계 식별자 입력 변경/소유권 이전 없음
     */
    set phaseId(value: undefined | string);
    /**
     * 공정 단계 식별자를 반환합니다.
     *
     * @returns {undefined | string}
     */
    get phaseId(): undefined | string;
    /**
     * 이동 시작 시각을 저장합니다. <br>
     * 시간 단위는 초입니다.
     *
     * @param {undefined | number} value 저장할 이동 시작 시각 입력 변경/소유권 이전 없음
     */
    set startTime(value: undefined | number);
    /**
     * 이동 시작 시각을 반환합니다. <br>
     * 시간 단위는 초입니다.
     *
     * @returns {undefined | number}
     */
    get startTime(): undefined | number;
    /**
     * 이동 완료 시각을 저장합니다. <br>
     * 시작 시각과 같으면 순간 전환이며 시간 단위는 초입니다.
     *
     * @param {undefined | number} value 저장할 이동 완료 시각 입력 변경/소유권 이전 없음
     */
    set endTime(value: undefined | number);
    /**
     * 이동 완료 시각을 반환합니다. <br>
     * 시작 시각과 같으면 순간 전환이며 시간 단위는 초입니다.
     *
     * @returns {undefined | number}
     */
    get endTime(): undefined | number;
    /**
     * 시작 이동 거리를 저장합니다. <br>
     * 원래 배치로부터 동·북·상 방향으로 이동할 거리이며 단위는 미터입니다. <br>
     * 전달한 값은 복사하여 보관합니다.
     *
     * @param {[ number, number, number ]} value 저장할 시작 이동 거리 입력 변경/소유권 이전 없음
     */
    set fromOffset(value: [number, number, number]);
    /**
     * 시작 이동 거리를 반환합니다. <br>
     * 원래 배치로부터 동·북·상 방향으로 이동할 거리이며 단위는 미터입니다. <br>
     * 반환값을 수정해도 이 VO에 보관된 값은 변경되지 않습니다.
     *
     * @returns {[ number, number, number ]} 시작 이동 거리의 복사본
     */
    get fromOffset(): [number, number, number];
    /**
     * 완료 이동 거리를 저장합니다. <br>
     * 원래 배치로부터 동·북·상 방향으로 이동할 거리이며 단위는 미터입니다. <br>
     * 전달한 값은 복사하여 보관합니다.
     *
     * @param {[ number, number, number ]} value 저장할 완료 이동 거리 입력 변경/소유권 이전 없음
     */
    set toOffset(value: [number, number, number]);
    /**
     * 완료 이동 거리를 반환합니다. <br>
     * 원래 배치로부터 동·북·상 방향으로 이동할 거리이며 단위는 미터입니다. <br>
     * 반환값을 수정해도 이 VO에 보관된 값은 변경되지 않습니다.
     *
     * @returns {[ number, number, number ]} 완료 이동 거리의 복사본
     */
    get toOffset(): [number, number, number];
    /**
     * 이동 보간 방식을 저장합니다. <br>
     * linear는 일정한 변화율, smoothstep은 시작과 끝을 완만하게 만드는 보간 방식입니다.
     *
     * @param {'linear' | 'smoothstep'} value 저장할 이동 보간 방식 입력 변경/소유권 이전 없음
     */
    set easing(value: "linear" | "smoothstep");
    /**
     * 이동 보간 방식을 반환합니다. <br>
     * linear는 일정한 변화율, smoothstep은 시작과 끝을 완만하게 만드는 보간 방식입니다.
     *
     * @returns {'linear' | 'smoothstep'}
     */
    get easing(): "linear" | "smoothstep";
}
/**
 * 객체 그룹이 조립되는 시간 구간과 시작·완료 이동 거리를 지정하는 생성 옵션입니다.
 *
 * @typedef {object} USequenceTrackVoCO
 * @property {string} [id] 트랙 식별자
 * @property {string} [groupId] 이동 대상 그룹 식별자
 * @property {string} [phaseId] 공정 단계 식별자
 * @property {number} [startTime] 이동 시작 시각. 시간 단위는 초입니다.
 * @property {number} [endTime] 이동 완료 시각. 시작 시각과 같으면 순간 전환이며 시간 단위는 초입니다.
 * @property {[number,number,number]} [fromOffset] 시작 이동 거리. 원래 배치로부터 동·북·상 방향으로 이동할 거리이며 단위는 미터입니다.
 * @property {[number,number,number]} [toOffset] 완료 이동 거리. 원래 배치로부터 동·북·상 방향으로 이동할 거리이며 단위는 미터입니다.
 * @property {'linear'|'smoothstep'} [easing] 이동 보간 방식. linear는 일정한 변화율, smoothstep은 시작과 끝을 완만하게 만드는 보간 방식입니다.
 */
/**
 * 로더와 편집 문서가 생성하고 재생 일정 생성기가 읽습니다.
 */
declare class USequenceProgressionVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceProgressionVo 클래스 생성자입니다. <br>
     * 점층 조립 설정의 공개 필드를 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceProgressionVoCO | import('./sequenceDefinitionVos.js').USequenceProgressionVo} [opt={}] 복사할 점층 조립 설정
     */
    constructor(opt?: USequenceProgressionVoCO | USequenceProgressionVo);
    /** @type {boolean} */
    _enabled: boolean;
    /**
     * @type {'nearToFar' | 'bottomToTop'}
     */
    _orderMode: "nearToFar" | "bottomToTop";
    /**
     * @type {Array<number> | null}
     */
    _referencePosition: Array<number> | null;
    /** @type {number} */
    _spreadRatio: number;
    /** @type {number} */
    _itemDuration: number;
    /**
     * 점층 조립 사용 여부를 보관합니다.
     *
     * @param {any} value 사용 여부입니다. <br>
     * null은 허용하지 않습니다.
     */
    set enabled(value: any);
    /**
     * 점층 조립 사용 여부를 반환합니다.
     *
     * @returns {any}
     */
    get enabled(): any;
    /**
     * 부재 정렬 방식을 보관합니다.
     *
     * @param {any} value nearToFar 또는 bottomToTop입니다. <br>
     * 기본 nearToFar는 카메라 거리순이며 bottomToTop은 같은 단계 안에서 낮은 경계 중심부터 정렬하고 같은 높이는 카메라 거리순으로 정렬합니다.
     */
    set orderMode(value: any);
    /**
     * 부재 정렬 방식을 반환합니다.
     *
     * @returns {any}
     */
    get orderMode(): any;
    /**
     * 조립 순서의 기준으로 고정할 카메라 위치를 복사합니다.
     *
     * @param {any} value GeOnDT 렌더 월드 x·y·z 좌표 또는 최초 재생 때 확정할 null입니다. <br>
     * 원본 EPSG:5187 좌표가 아닙니다.
     */
    set referencePosition(value: any);
    /**
     * 조립 순서의 기준으로 고정한 카메라 위치의 사본 또는 아직 확정되지 않은 null을 반환합니다.
     *
     * @returns {any}
     */
    get referencePosition(): any;
    /**
     * 등장 시점의 분산 비율을 보관합니다.
     *
     * @param {any} value 0~1의 유한 무차원 비율입니다. <br>
     * 기본값은 0.95입니다.
     */
    set spreadRatio(value: any);
    /**
     * 등장 시점의 분산 비율을 반환합니다.
     *
     * @returns {any}
     */
    get spreadRatio(): any;
    /**
     * 부재 하나의 조립 시간을 보관합니다.
     *
     * @param {any} value 0보다 큰 유한 초입니다. <br>
     * 기본값은 1.5초이며 트랙 길이를 넘으면 해당 길이로 제한합니다.
     */
    set itemDuration(value: any);
    /**
     * 부재 하나의 조립 시간을 초로 반환합니다.
     *
     * @returns {any}
     */
    get itemDuration(): any;
}
/**
 * 부재별 근거리 점층 조립의 공개 생성 옵션입니다.
 * @typedef {object} USequenceProgressionVoCO
 * @property {boolean} [enabled=false] 부재별 점층 조립 사용 여부
 * @property {'nearToFar'|'bottomToTop'} [orderMode='nearToFar'] nearToFar는 최초 카메라 거리순, bottomToTop은 단계 안의 낮은 부재 우선
 * @property {[number,number,number]|null} [referencePosition=null] GeOnDT 렌더 월드 좌표의 고정 기준점. null이면 최초 재생·시간 이동 시 확정
 * @property {number} [spreadRatio=0.95] 등장 시점 분산 비율 0~1
 * @property {number} [itemDuration=1.5] 부재 조립 시간(초), 양의 유한 값
 */
/**
 * 부재별 자동 분리 배치의 사용 여부와 기준 배치의 여유 간격을 보관합니다.
 */
declare class USequenceExplodeLayoutVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceExplodeLayoutVo 클래스 생성자입니다. <br>
     * 원본을 변경하지 않고 자동 분리 설정을 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceExplodeLayoutVoCO | import('./sequenceDefinitionVos.js').USequenceExplodeLayoutVo} [opt={}] 복사할 부재별 분리 배치 설정
     */
    constructor(opt?: USequenceExplodeLayoutVoCO | USequenceExplodeLayoutVo);
    /** @type {boolean} */
    _enabled: boolean;
    /** @type {number} */
    _gap: number;
    /**
     * 자동 분리 사용 여부를 보관합니다.
     *
     * @param {any} value 사용 여부입니다. <br>
     * 기본 false이며 null은 허용하지 않습니다.
     */
    set enabled(value: any);
    /**
     * 부재별 자동 분리 사용 여부를 반환합니다.
     *
     * @returns {any}
     */
    get enabled(): any;
    /**
     * 기준 배치 계산의 부재 간 여유 간격을 보관합니다.
     *
     * @param {any} value 0보다 큰 유한 거리(m)입니다. <br>
     * 기본값은 1m이며 null은 허용하지 않습니다.
     */
    set gap(value: any);
    /**
     * 기준 배치를 계산할 때 사용할 부재 간 여유 간격을 미터로 반환합니다. <br>
     * 실제 20% 이동에서 이 간격을 보장하지 않습니다.
     *
     * @returns {any}
     */
    get gap(): any;
}
/**
 * 부재별 자동 분리 배치의 공개 생성 옵션입니다.
 * @typedef {object} USequenceExplodeLayoutVoCO
 * @property {boolean} [enabled=false] 자동 분리 배치 사용 여부
 * @property {number} [gap=1] 기준 배치를 계산할 양의 유한 여유 간격(m). 실제 이동은 기준 거리의 20%이므로 완전 이격을 보장하지 않습니다.
 */
/**
 * Clock의 현재 시각·배속·분리율을 독립 값으로 보관합니다.
 */
declare class USequencePlaybackStateVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequencePlaybackStateVo 클래스 생성자입니다. <br>
     * 원본과 공유하지 않는 원시 재생 값을 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequencePlaybackStateVoCO} [opt={}] 복사할 상태 옵션 또는 VO <br>
     * 생략 시 기본값: {}.
     */
    constructor(opt?: USequencePlaybackStateVoCO);
    _sequenceId: string;
    _contentId: string;
    _startTime: number;
    _endTime: number;
    _currentTime: number;
    _multiplier: number;
    _playing: boolean;
    _explodeRatio: number;
    /**
     * 축별 분리율 배열을 복사해 보관합니다. <br>
     * 의미와 범위 검증은 실행기 또는 Serializer가 수행합니다.
     *
     * @param {any} value 자료형 number[3] 또는 null입니다. <br>
     * X·Y·Z 순서이며 각 값은 무차원 0~1입니다. <br>
     * 배열 소유권을 가져오지 않습니다.
     */
    set explodeAxisRatios(value: any);
    /**
     * 축별 분리율을 독립 배열로 반환합니다. <br>
     * null이면 기존 전역 분리율을 사용합니다.
     *
     * @returns {any}
     */
    get explodeAxisRatios(): any;
    /**
     * 시퀀스 식별자 값을 보관합니다.
     *
     * @param {string} value 보관할 시퀀스 식별자. <br>
     * 범위 검증은 재생 처리기가 담당합니다.
     */
    set sequenceId(value: string);
    /**
     * 시퀀스 식별자 값을 반환합니다.
     *
     * @returns {string}
     */
    get sequenceId(): string;
    /**
     * 연결 자료 식별자 값을 보관합니다.
     *
     * @param {string} value 보관할 연결 자료 식별자. <br>
     * 범위 검증은 재생 처리기가 담당합니다.
     */
    set contentId(value: string);
    /**
     * 연결 자료 식별자 값을 반환합니다.
     *
     * @returns {string}
     */
    get contentId(): string;
    /**
     * 재생 시작 상대 초 값을 보관합니다.
     *
     * @param {number} value 보관할 재생 시작 상대 초. <br>
     * 범위 검증은 재생 처리기가 담당합니다.
     */
    set startTime(value: number);
    /**
     * 재생 시작 상대 초 값을 반환합니다.
     *
     * @returns {number}
     */
    get startTime(): number;
    /**
     * 재생 종료 상대 초 값을 보관합니다.
     *
     * @param {number} value 보관할 재생 종료 상대 초. <br>
     * 범위 검증은 재생 처리기가 담당합니다.
     */
    set endTime(value: number);
    /**
     * 재생 종료 상대 초 값을 반환합니다.
     *
     * @returns {number}
     */
    get endTime(): number;
    /**
     * 현재 상대 초 값을 보관합니다.
     *
     * @param {number} value 보관할 현재 상대 초. <br>
     * 범위 검증은 재생 처리기가 담당합니다.
     */
    set currentTime(value: number);
    /**
     * 현재 상대 초 값을 반환합니다.
     *
     * @returns {number}
     */
    get currentTime(): number;
    /**
     * 유한 배속. <br>
     * 음수는 역방향이며 0은 정지 값을 보관합니다.
     *
     * @param {number} value 보관할 유한 배속. <br>
     * 음수는 역방향이며 0은 정지. <br>
     * 범위 검증은 재생 처리기가 담당합니다.
     */
    set multiplier(value: number);
    /**
     * 유한 배속. <br>
     * 음수는 역방향이며 0은 정지 값을 반환합니다.
     *
     * @returns {number}
     */
    get multiplier(): number;
    /**
     * Clock의 실제 시간 진행 가능 여부 값을 보관합니다.
     *
     * @param {boolean} value 보관할 Clock의 실제 시간 진행 가능 여부. <br>
     * 범위 검증은 재생 처리기가 담당합니다.
     */
    set playing(value: boolean);
    /**
     * Clock의 실제 시간 진행 가능 여부 값을 반환합니다.
     *
     * @returns {boolean}
     */
    get playing(): boolean;
    /**
     * 0~1 무차원 분리율 값을 보관합니다.
     *
     * @param {number} value 보관할 0~1 무차원 분리율. <br>
     * 범위 검증은 재생 처리기가 담당합니다.
     */
    set explodeRatio(value: number);
    /**
     * 0~1 무차원 분리율 값을 반환합니다.
     *
     * @returns {number}
     */
    get explodeRatio(): number;
    _explodeAxisRatios: any;
}
/**
 * 현재 재생 상태를 전달하는 독립 값의 생성 옵션입니다.
 *
 * @typedef {object} USequencePlaybackStateVoCO
 * @property {string} [sequenceId=''] 시퀀스 식별자
 * @property {string} [contentId=''] 연결 자료 식별자
 * @property {number} [startTime=0] 재생 시작 상대 초
 * @property {number} [endTime=0] 재생 종료 상대 초
 * @property {number} [currentTime=0] 현재 상대 초
 * @property {number} [multiplier=1] 유한 배속. 음수는 역방향이며 0은 정지
 * @property {boolean} [playing=false] Clock의 실제 시간 진행 가능 여부
 * @property {Array<number> | null} [explodeAxisRatios=null] X·Y·Z 축별 분리율 0~1. null이면 기존 전역 분리율을 사용하며 배열은 복사합니다.
 * @property {number} [explodeRatio=0] 현재 분리율 0~1
 */
/**
 * 한 상대 시각의 전체 그룹 평가 결과·미분류 표시 정책·전역 분리율을 보관합니다.
 */
declare class USequenceFrameStateVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceFrameStateVo 클래스 생성자입니다. <br>
     * 결과 필드를 보관하고 컨테이너와 중첩 VO를 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceFrameStateVoCO} [opt={}] 생성 옵션 또는 복사 원본. <br>
     * 입력 컨테이너를 변경하지 않습니다. <br>
     * 생략 시 기본값: {}.
     */
    constructor(opt?: USequenceFrameStateVoCO);
    /**
     * 평가에 사용한 시퀀스 식별자를 저장합니다.
     *
     * @param {string} value 평가에 사용한 시퀀스 식별자. <br>
     * 관계 검증과 실제 상태 계산은 실행기가 담당합니다.
     */
    set sequenceId(value: string);
    /**
     * 평가에 사용한 시퀀스 식별자를 반환합니다.
     *
     * @returns {string}
     */
    get sequenceId(): string;
    /**
     * 평가에 사용한 형상 자료 식별자를 저장합니다.
     *
     * @param {string} value 평가에 사용한 형상 자료 식별자. <br>
     * 관계 검증과 실제 상태 계산은 실행기가 담당합니다.
     */
    set contentId(value: string);
    /**
     * 평가에 사용한 형상 자료 식별자를 반환합니다.
     *
     * @returns {string}
     */
    get contentId(): string;
    /**
     * 자동 보정하지 않은 입력 상대 시각(초)를 저장합니다.
     *
     * @param {number} value 자동 보정하지 않은 입력 상대 시각(초). <br>
     * 관계 검증과 실제 상태 계산은 실행기가 담당합니다.
     */
    set time(value: number);
    /**
     * 자동 보정하지 않은 입력 상대 시각(초)를 반환합니다.
     *
     * @returns {number}
     */
    get time(): number;
    /**
     * 원본 그룹 순서의 그룹별 평가 결과를 저장합니다.
     *
     * @param {Array<import('./sequenceDefinitionVos.js').USequenceGroupStateVo>} value 원본 그룹 순서의 그룹별 평가 결과. <br>
     * 입력 배열과 중첩 VO를 복사하며 원본을 변경하지 않습니다.
     */
    set groupStates(value: Array<USequenceGroupStateVo>);
    /**
     * 원본 그룹 순서의 그룹별 평가 결과를 반환합니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceGroupStateVo>} 원본 그룹 순서의 그룹별 평가 결과의 독립 복사본
     */
    get groupStates(): Array<USequenceGroupStateVo>;
    /**
     * 미분류 정책에 따른 논리 가시성을 저장합니다.
     *
     * @param {boolean} value 미분류 정책에 따른 논리 가시성. <br>
     * 관계 검증과 실제 상태 계산은 실행기가 담당합니다.
     */
    set unassignedVisible(value: boolean);
    /**
     * 미분류 정책에 따른 논리 가시성을 반환합니다.
     *
     * @returns {boolean}
     */
    get unassignedVisible(): boolean;
    /**
     * 전역 분리율을 계산 없이 보관합니다.
     *
     * @param {number} value 0~1 무차원 분리율. <br>
     * 저장용 VO는 범위를 자동 보정하지 않으며 실행기가 검증합니다.
     */
    set explodeRatio(value: number);
    /**
     * 현재 합산 프레임 계산에 사용한 전역 분리율을 반환합니다.
     *
     * @returns {number} 실행기에서 검증한 0~1 무차원 분리율
     */
    get explodeRatio(): number;
    /**
     * 축별 분리율 배열을 복사해 보관합니다. <br>
     * 의미와 범위 검증은 실행기 또는 Serializer가 수행합니다.
     *
     * @param {any} value 자료형 number[3] 또는 null입니다. <br>
     * X·Y·Z 순서이며 각 값은 무차원 0~1입니다. <br>
     * 배열 소유권을 가져오지 않습니다.
     */
    set explodeAxisRatios(value: any);
    /**
     * 축별 분리율을 독립 배열로 반환합니다. <br>
     * null이면 기존 전역 분리율을 사용합니다.
     *
     * @returns {any}
     */
    get explodeAxisRatios(): any;
    _sequenceId: string | undefined;
    _contentId: string | undefined;
    _time: number | undefined;
    _groupStates: USequenceGroupStateVo[] | undefined;
    _unassignedVisible: boolean | undefined;
    _explodeRatio: number | undefined;
    _explodeAxisRatios: any;
}
/**
 * USequenceFrameStateVo의 결과 보관 생성 옵션입니다.
 *
 * @typedef {object} USequenceFrameStateVoCO
 * @property {string} [sequenceId] 평가에 사용한 시퀀스 식별자
 * @property {string} [contentId] 평가에 사용한 형상 자료 식별자
 * @property {number} [time] 자동 보정하지 않은 입력 상대 시각(초)
 * @property {Array<USequenceGroupStateVo>} [groupStates] 원본 그룹 순서의 그룹별 평가 결과
 * @property {boolean} [unassignedVisible] 미분류 정책에 따른 논리 가시성
 * @property {Array<number> | null} [explodeAxisRatios=null] X·Y·Z 축별 분리율 0~1. null이면 기존 전역 분리율을 사용하며 배열은 복사합니다.
 * @property {number} [explodeRatio=0] 합산 계산에 사용한 전역 분리율 0~1. 무차원이며 검증은 실행기가 담당합니다.
 */
/**
 * 한 그룹의 기준 트랙·논리 가시성·진행률·ENU 조립·분리·최종 이동량을 보관합니다.
 */
declare class USequenceGroupStateVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceGroupStateVo 클래스 생성자입니다. <br>
     * 결과 필드를 보관하고 이동량 배열을 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceGroupStateVoCO} [opt={}] 생성 옵션 또는 복사 원본. <br>
     * 입력 컨테이너를 변경하지 않습니다. <br>
     * 생략 시 기본값: {}.
     */
    constructor(opt?: USequenceGroupStateVoCO);
    /**
     * 확정 그룹 식별자를 저장합니다.
     *
     * @param {string} value 확정 그룹 식별자. <br>
     * 관계 검증과 실제 상태 계산은 실행기가 담당합니다.
     */
    set groupId(value: string);
    /**
     * 확정 그룹 식별자를 반환합니다.
     *
     * @returns {string}
     */
    get groupId(): string;
    /**
     * 계산 기준 트랙 ID 또는 트랙 없음 null을 저장합니다.
     *
     * @param {string | null} value 계산 기준 트랙 ID 또는 트랙 없음 null. <br>
     * 관계 검증과 실제 상태 계산은 실행기가 담당합니다.
     */
    set trackId(value: string | null);
    /**
     * 계산 기준 트랙 ID 또는 트랙 없음 null을 반환합니다.
     *
     * @returns {string | null}
     */
    get trackId(): string | null;
    /**
     * 기준 트랙의 단계 ID 또는 트랙 없음 null을 저장합니다.
     *
     * @param {string | null} value 기준 트랙의 단계 ID 또는 트랙 없음 null. <br>
     * 관계 검증과 실제 상태 계산은 실행기가 담당합니다.
     */
    set phaseId(value: string | null);
    /**
     * 기준 트랙의 단계 ID 또는 트랙 없음 null을 반환합니다.
     *
     * @returns {string | null}
     */
    get phaseId(): string | null;
    /**
     * 트랙 없음·대기·이동·유지·완료 상태를 저장합니다.
     *
     * @param {'untracked' | 'pending' | 'active' | 'holding' | 'completed'} value 트랙 없음·대기·이동·유지·완료 상태. <br>
     * 관계 검증과 실제 상태 계산은 실행기가 담당합니다.
     */
    set state(value: "untracked" | "pending" | "active" | "holding" | "completed");
    /**
     * 트랙 없음·대기·이동·유지·완료 상태를 반환합니다.
     *
     * @returns {'untracked' | 'pending' | 'active' | 'holding' | 'completed'}
     */
    get state(): "untracked" | "pending" | "active" | "holding" | "completed";
    /**
     * 엔진 표시 조건과 별도로 합성할 논리 가시성을 저장합니다.
     *
     * @param {boolean} value 엔진 표시 조건과 별도로 합성할 논리 가시성. <br>
     * 관계 검증과 실제 상태 계산은 실행기가 담당합니다.
     */
    set visible(value: boolean);
    /**
     * 엔진 표시 조건과 별도로 합성할 논리 가시성을 반환합니다.
     *
     * @returns {boolean}
     */
    get visible(): boolean;
    /**
     * 기준 트랙의 0~1 시간 진행률 또는 트랙 없음 null을 저장합니다.
     *
     * @param {number | null} value 기준 트랙의 0~1 시간 진행률 또는 트랙 없음 null. <br>
     * 관계 검증과 실제 상태 계산은 실행기가 담당합니다.
     */
    set progress(value: number | null);
    /**
     * 기준 트랙의 0~1 시간 진행률 또는 트랙 없음 null을 반환합니다.
     *
     * @returns {number | null}
     */
    get progress(): number | null;
    /**
     * 보간을 반영한 0~1 진행률 또는 트랙 없음 null을 저장합니다.
     *
     * @param {number | null} value 보간을 반영한 0~1 진행률 또는 트랙 없음 null. <br>
     * 관계 검증과 실제 상태 계산은 실행기가 담당합니다.
     */
    set easedProgress(value: number | null);
    /**
     * 보간을 반영한 0~1 진행률 또는 트랙 없음 null을 반환합니다.
     *
     * @returns {number | null}
     */
    get easedProgress(): number | null;
    /**
     * 원래 배치로부터 동·북·상 순서의 조립 이동량(m)를 저장합니다.
     *
     * @param {[ number, number, number ]} value 원래 배치로부터 동·북·상 순서의 조립 이동량(m). <br>
     * 입력 배열을 복사하며 원본을 변경하지 않습니다.
     */
    set assemblyOffset(value: [number, number, number]);
    /**
     * 원래 배치로부터 동·북·상 순서의 조립 이동량(m)를 반환합니다.
     *
     * @returns {[ number, number, number ]} 원래 배치로부터 동·북·상 순서의 조립 이동량(m)의 독립 복사본
     */
    get assemblyOffset(): [number, number, number];
    /**
     * 분리율이 적용된 동·북·상 이동량(m)을 복사하여 보관합니다.
     *
     * @param {[ number, number, number ]} value 원본을 변경하지 않을 분리 이동량 3개. <br>
     * 유한성과 관계 검증은 실행기가 담당합니다.
     */
    set separationOffset(value: [number, number, number]);
    /**
     * 분리율이 적용된 동·북·상 이동량(m)의 사본을 반환합니다.
     *
     * @returns {[ number, number, number ]} 조립 이동과 구분하는 독립 분리 이동량
     */
    get separationOffset(): [number, number, number];
    /**
     * 최종 ENU 이동량(m)을 복사하거나 기존 조립 전용 경로를 지정합니다.
     *
     * @param {[ number, number, number ] | null} value 복사할 조립+분리 이동량 3개. <br>
     * null이면 assemblyOffset만 사용하며 계산·검증은 실행기가 담당합니다.
     */
    set totalOffset(value: [number, number, number] | null);
    /**
     * 합산한 최종 ENU 이동량(m)의 사본 또는 기존 경로를 뜻하는 null을 반환합니다.
     *
     * @returns {[ number, number, number ] | null} 독립 최종 이동량 또는 assemblyOffset만 사용하는 null
     */
    get totalOffset(): [number, number, number] | null;
    _groupId: string | undefined;
    _trackId: string | null | undefined;
    _phaseId: string | null | undefined;
    _state: "untracked" | "pending" | "active" | "holding" | "completed" | undefined;
    _visible: boolean | undefined;
    _progress: number | null | undefined;
    _easedProgress: number | null | undefined;
    _assemblyOffset: [number, number, number] | undefined;
    _separationOffset: [number, number, number] | undefined;
    _totalOffset: [number, number, number] | null | undefined;
}
/**
 * USequenceGroupStateVo의 결과 보관 생성 옵션입니다.
 *
 * @typedef {object} USequenceGroupStateVoCO
 * @property {string} [groupId] 확정 그룹 식별자
 * @property {string | null} [trackId] 계산 기준 트랙 ID 또는 트랙 없음 null
 * @property {string | null} [phaseId] 기준 트랙의 단계 ID 또는 트랙 없음 null
 * @property {'untracked' | 'pending' | 'active' | 'holding' | 'completed'} [state] 트랙 없음·대기·이동·유지·완료 상태
 * @property {boolean} [visible] 엔진 표시 조건과 별도로 합성할 논리 가시성
 * @property {number | null} [progress] 기준 트랙의 0~1 시간 진행률 또는 트랙 없음 null
 * @property {number | null} [easedProgress] 보간을 반영한 0~1 진행률 또는 트랙 없음 null
 * @property {[number,number,number]} [assemblyOffset] 원래 배치로부터 동·북·상 순서의 조립 이동량(m)
 * @property {[number,number,number]} [separationOffset] 분리율을 적용한 동·북·상 이동량(m). 기본값 [0,0,0]이며 배열을 복사합니다.
 * @property {[number,number,number] | null} [totalOffset=null] 조립+분리 최종 ENU 이동량(m). null이면 기존 assemblyOffset을 사용하고 배열은 복사합니다.
 */
/**
 * 전체 시공 시간과 분리율 0~1에서 도달할 수 있는 이동 범위를 보관합니다.
 */
declare class USequenceOffsetBoundsVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceOffsetBoundsVo 클래스 생성자입니다. <br>
     * 식별자와 이동 범위를 독립 값으로 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceOffsetBoundsVoCO} [opt={}] 복사할 이동 범위 또는 VO <br>
     * 생략 시 기본값: {}.
     */
    constructor(opt?: USequenceOffsetBoundsVoCO);
    /**
     * 확정 시퀀스 식별자를 보관합니다.
     *
     * @param {string} value 보관할 확정 시퀀스 식별자. <br>
     * 값으로 저장합니다.
     */
    set sequenceId(value: string);
    /**
     * 확정 시퀀스 식별자를 반환합니다.
     *
     * @returns {string}
     */
    get sequenceId(): string;
    /**
     * 연결 자료 식별자를 보관합니다.
     *
     * @param {string} value 보관할 연결 자료 식별자. <br>
     * 값으로 저장합니다.
     */
    set contentId(value: string);
    /**
     * 연결 자료 식별자를 반환합니다.
     *
     * @returns {string}
     */
    get contentId(): string;
    /**
     * 동·북·상 최소 이동량(m)를 보관합니다.
     *
     * @param {[ number, number, number ]} value 보관할 동·북·상 최소 이동량(m). <br>
     * 배열을 복사하며 의미 검증은 실행기가 담당합니다.
     */
    set enuMin(value: [number, number, number]);
    /**
     * 동·북·상 최소 이동량(m)를 반환합니다.
     *
     * @returns {[ number, number, number ]} 동·북·상 최소 이동량(m)의 독립 배열 사본
     */
    get enuMin(): [number, number, number];
    /**
     * 동·북·상 최대 이동량(m)를 보관합니다.
     *
     * @param {[ number, number, number ]} value 보관할 동·북·상 최대 이동량(m). <br>
     * 배열을 복사하며 의미 검증은 실행기가 담당합니다.
     */
    set enuMax(value: [number, number, number]);
    /**
     * 동·북·상 최대 이동량(m)를 반환합니다.
     *
     * @returns {[ number, number, number ]} 동·북·상 최대 이동량(m)의 독립 배열 사본
     */
    get enuMax(): [number, number, number];
    /**
     * 월드 X/Y/Z 최소 이동량를 보관합니다.
     *
     * @param {[ number, number, number ]} value 보관할 월드 X/Y/Z 최소 이동량. <br>
     * 배열을 복사하며 의미 검증은 실행기가 담당합니다.
     */
    set worldMin(value: [number, number, number]);
    /**
     * 월드 X/Y/Z 최소 이동량를 반환합니다.
     *
     * @returns {[ number, number, number ]} 월드 X/Y/Z 최소 이동량의 독립 배열 사본
     */
    get worldMin(): [number, number, number];
    /**
     * 월드 X/Y/Z 최대 이동량를 보관합니다.
     *
     * @param {[ number, number, number ]} value 보관할 월드 X/Y/Z 최대 이동량. <br>
     * 배열을 복사하며 의미 검증은 실행기가 담당합니다.
     */
    set worldMax(value: [number, number, number]);
    /**
     * 월드 X/Y/Z 최대 이동량를 반환합니다.
     *
     * @returns {[ number, number, number ]} 월드 X/Y/Z 최대 이동량의 독립 배열 사본
     */
    get worldMax(): [number, number, number];
    _sequenceId: string | undefined;
    _contentId: string | undefined;
    _enuMin: [number, number, number] | undefined;
    _enuMax: [number, number, number] | undefined;
    _worldMin: [number, number, number] | undefined;
    _worldMax: [number, number, number] | undefined;
}
/**
 * 전체 시공·분리 구간의 이동 범위 생성 옵션입니다.
 *
 * @typedef {object} USequenceOffsetBoundsVoCO
 * @property {string} [sequenceId=''] 확정 시퀀스 식별자
 * @property {string} [contentId=''] 연결 자료 식별자
 * @property {[number,number,number]} [enuMin] 동·북·상 최소 이동량(m). 기본 [0,0,0], 배열 복사
 * @property {[number,number,number]} [enuMax] 동·북·상 최대 이동량(m). 기본 [0,0,0], 배열 복사
 * @property {[number,number,number]} [worldMin] 현재 메쉬 적용기 월드 X/Y/Z 최소 이동량. 기본 [0,0,0], 배열 복사
 * @property {[number,number,number]} [worldMax] 현재 메쉬 적용기 월드 X/Y/Z 최대 이동량. 기본 [0,0,0], 배열 복사
 */
/**
 * 교량 투명도 패널의 레이어 불투명도 값을 보관합니다.
 */
declare class USequenceOpacityStateVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceOpacityStateVo 클래스 생성자입니다. <br>
     * 불투명도 값을 보관하거나 같은 VO의 독립 사본을 만듭니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceOpacityStateVoCO | import('./sequenceDefinitionVos.js').USequenceOpacityStateVo} [opt={}] 복사할 모델 투명도 상태
     */
    constructor(opt?: USequenceOpacityStateVoCO | USequenceOpacityStateVo);
    /** @type {number} */
    _opacity: number;
    /**
     * 레이어에 전달할 불투명도를 보관합니다. <br>
     * 형식과 범위는 패널에서 검증합니다.
     *
     * @param {any} value 무차원 0~1 값입니다. <br>
     * 원본 재질 알파에 곱할 값이며 null은 허용하지 않습니다.
     */
    set opacity(value: any);
    /**
     * 레이어에 적용할 불투명도 값을 반환합니다.
     *
     * @returns {any}
     */
    get opacity(): any;
}
/**
 * 투명도 패널의 독립 상태 생성 옵션입니다.
 * @typedef {object} USequenceOpacityStateVoCO
 * @property {number} [opacity=1] 레이어 불투명도 0~1. 무차원이며 1은 원래 재질, 0은 완전 투명입니다.
 */
/**
 * 저장·복원할 확정 시퀀스와 현재 재생 위치를 보관합니다.
 */
declare class USequenceDocumentVo {
    /**
     * 생성 옵션의 정본 키 목록입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceDocumentVo 클래스 생성자입니다. <br>
     * 원본과 참조를 공유하지 않는 문서 값을 생성합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceDocumentVoCO} [opt={}] 복사할 문서 옵션 또는 같은 VO. <br>
     * 소유권 이전은 없습니다. <br>
     * 생략 시 기본값: {}.
     */
    constructor(opt?: USequenceDocumentVoCO);
    /**
     * 저장 문서 형식을 보관합니다.
     *
     * @param {string} value 저장 문서 형식 범위 검증은 Serializer가 담당합니다.
     */
    set format(value: string);
    /**
     * 저장 문서 형식을 반환합니다.
     *
     * @returns {string}
     */
    get format(): string;
    /**
     * 저장 문서 버전을 보관합니다.
     *
     * @param {string} value 저장 문서 버전 범위 검증은 Serializer가 담당합니다.
     */
    set schemaVersion(value: string);
    /**
     * 저장 문서 버전을 반환합니다.
     *
     * @returns {string}
     */
    get schemaVersion(): string;
    /**
     * 중첩 VO까지 독립 복사한 확정 시퀀스을 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceVo | import('./sequenceDefinitionVos.js').USequenceVoCO | null} value 복사할 확정 시퀀스 또는 미설정 null. <br>
     * 입력을 변경하지 않습니다.
     */
    set sequence(value: USequenceVo | USequenceVoCO | null);
    /**
     * 중첩 VO까지 독립 복사한 확정 시퀀스을 반환합니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequenceVo | null} 내부와 참조를 공유하지 않는 사본 또는 null
     */
    get sequence(): USequenceVo | null;
    /**
     * 현재 상대 시각을 초 단위로 보관합니다.
     *
     * @param {number | null} value 현재 상대 시각(초). <br>
     * 완성 문서에는 유한 숫자가 필요합니다. <br>
     * 범위 검증은 Serializer가 담당합니다.
     */
    set currentTime(value: number | null);
    /**
     * 현재 상대 시각을 초 단위로 반환합니다.
     *
     * @returns {number | null} 현재 상대 시각(초). <br>
     * 완성 문서에는 유한 숫자가 필요합니다.
     */
    get currentTime(): number | null;
    /**
     * 재생 배속을 보관합니다.
     *
     * @param {number} value 유한 재생 배속. <br>
     * 음수·0을 허용합니다. <br>
     * 범위 검증은 Serializer가 담당합니다.
     */
    set multiplier(value: number);
    /**
     * 재생 배속을 반환합니다.
     *
     * @returns {number} 유한 재생 배속. <br>
     * 음수·0을 허용합니다.
     */
    get multiplier(): number;
    /**
     * 분리율 0~1을 보관합니다.
     *
     * @param {number} value 분리율 0~1 범위 검증은 Serializer가 담당합니다.
     */
    set explodeRatio(value: number);
    /**
     * 분리율 0~1을 반환합니다.
     *
     * @returns {number}
     */
    get explodeRatio(): number;
    /**
     * 축별 분리율 배열을 복사해 보관합니다. <br>
     * 의미와 범위 검증은 실행기 또는 Serializer가 수행합니다.
     *
     * @param {any} value 자료형 number[3] 또는 null입니다. <br>
     * X·Y·Z 순서이며 각 값은 무차원 0~1입니다. <br>
     * 배열 소유권을 가져오지 않습니다.
     */
    set explodeAxisRatios(value: any);
    /**
     * 축별 분리율을 독립 배열로 반환합니다. <br>
     * null이면 기존 전역 분리율을 사용합니다.
     *
     * @returns {any}
     */
    get explodeAxisRatios(): any;
    _format: string | undefined;
    _schemaVersion: string | undefined;
    _sequence: USequenceVo | null | undefined;
    _currentTime: number | null | undefined;
    _multiplier: number | undefined;
    _explodeRatio: number | undefined;
    _explodeAxisRatios: any;
}
/**
 * 시퀀스 설정 파일과 재생 위치를 보관하는 생성 옵션입니다.
 *
 * @typedef {object} USequenceDocumentVoCO
 * @property {string} [format='GeOnDTSequenceDocument'] 저장 문서 형식
 * @property {string} [schemaVersion='1.0.0'] 저장 문서 버전
 * @property {USequenceVo | USequenceVoCO | null} [sequence=null] 중첩 복사할 확정 시퀀스. 완성 문서에는 필수입니다.
 * @property {number | null} [currentTime=null] 현재 상대 초. create에서 null을 시퀀스 시작 시각으로 지정합니다.
 * @property {number} [multiplier=1] 유한 배속. 음수는 역방향이며 0을 허용합니다.
 * @property {Array<number> | null} [explodeAxisRatios=null] X·Y·Z 축별 분리율 0~1. null이면 기존 전역 분리율을 사용하며 배열은 복사합니다.
 * @property {number} [explodeRatio=0] 분리율 0~1
 */
/**
 * 형상 자료의 식별·전체 GUID 범위·시퀀스 주소를 독립 사본으로 보관합니다.
 */
declare class USequenceSourceVo {
    /**
 * @type {ReadonlyArray<string>}
 *
 * @ignore
 */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceSourceVo 클래스 생성자입니다. <br>
     * 연결 설정을 복사하며 실행 자원을 생성하지 않습니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceSourceVoCO} [opt={}] 호출자 소유 설정 또는 복사할 VO <br>
     * 생략 시 기본값: {}.
     */
    constructor(opt?: USequenceSourceVoCO);
    /**
     * 자료 참조를 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceContentVo | object | null} value 호출자 소유 설정이며 null 허용
     */
    set content(value: USequenceContentVo | object | null);
    /**
     * 자료 참조의 독립 사본을 반환합니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequenceContentVo | null} 자료 사본 또는 미설정 null
     */
    get content(): USequenceContentVo | null;
    /**
     * 전체 형상 GUID 범위를 검사·복사합니다.
     *
     * @param {Array<string>} value 같은 revision에서 추출한 전체 GUID. <br>
     * 빈 목록 허용, 빈 문자열·중복 거부
     */
    set objectIds(value: Array<string>);
    /**
     * 전체 형상 GUID를 복사하여 반환합니다.
     *
     * @returns {Array<string>} 중복 없는 독립 GUID 목록
     */
    get objectIds(): Array<string>;
    /**
     * 초기 문서 주소를 보관합니다.
     *
     * @param {string | null} value HTTP(S)에서 해석할 URI이며 null은 별도 문서 전달이 필요함
     */
    set sequenceUri(value: string | null);
    /**
     * 초기 문서 주소를 반환합니다.
     *
     * @returns {string | null} 상대/절대 URI 또는 미설정 null
     */
    get sequenceUri(): string | null;
    /**
     * 기준 URL을 검사·보관합니다.
     *
     * @param {string | null} value 절대 HTTP(S) URL 또는 null. <br>
     * 파일의 로컬 폴더 경로는 허용하지 않음
     */
    set baseUrl(value: string | null);
    /**
     * 명시적 기준 주소를 반환합니다.
     *
     * @returns {string | null} HTTP(S) 기준 URL 또는 null
     */
    get baseUrl(): string | null;
    _content: USequenceContentVo | null | undefined;
    _objectIds: any[] | undefined;
    _sequenceUri: string | null | undefined;
    _baseUrl: string | null | undefined;
}
/**
 * 형상 연결과 전체 GUID 범위의 순수 설정입니다.
 *
 * @typedef {object} USequenceSourceVoCO
 * @property {USequenceContentVo|object|null} [content=null] 복사할 자료 식별·주소·버전
 * @property {Array<string>} [objectIds=[]] 같은 revision의 전체 형상 GUID. 속성 전체 키 또는 현재 메쉬 목록으로 대체하지 않음
 * @property {string|null} [sequenceUri=null] 초기 문서의 HTTP(S) 절대 또는 baseUrl 기준 상대 URI
 * @property {string|null} [baseUrl=null] 상대 URI를 해석할 명시적 HTTP(S) 절대 기준 URL
 */
/**
 * construction 기능의1.0 설정을 독립 VO로 보관합니다.
 */
declare class USequenceConstructionConfigVo {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceConstructionConfigVo 클래스 생성자입니다. <br>
     * 필수1.0 설정을 복사하며 의미 검증은 실행기 경계에 맡깁니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceConstructionConfigVoCO | import('./sequenceDefinitionVos.js').USequenceConstructionConfigVo} opt 원래 설정, legacySequence 필수·null 불가
     */
    constructor(opt: USequenceConstructionConfigVoCO$1 | USequenceConstructionConfigVo);
    /** @type {USequenceVo} */ _legacySequence: USequenceVo;
    /**
     * 실행 책임 없이 새1.0 설정을 복사해 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceVo | import('./sequenceDefinitionVos.js').USequenceVoCO} value 새 데이터, 필수·null 불가, 중첩 복사·입력 변경 없음
     */
    set legacySequence(value: USequenceVo | USequenceVoCO);
    /**
     * 원래1.0 설정의 중첩 사본을 반환합니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequenceVo} 독립1.0 설정
     */
    get legacySequence(): USequenceVo;
}
/** @typedef {{legacySequence:USequenceVo|USequenceVoCO}} USequenceConstructionConfigVoCO */
/**
 * 메쉬 한 조각의 자료 식별자·GUID·배치 번호와 기준 자세를 보관합니다.
 */
declare class USequenceMeshBindingVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceMeshBindingVo 클래스 생성자입니다. <br>
     * 옵션을 정규화하고 기준 정보의 소유권에 맞게 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceMeshBindingVoCO} [opt={}] 보관할 생성 옵션 또는 복사 원본 입력 변경/소유권 이전 없음
     */
    constructor(opt?: USequenceMeshBindingVoCO);
    _contentId: string | undefined;
    _objectId: string | undefined;
    _batchId: number | undefined;
    _sourceUri: string | null;
    _mesh: Mesh<BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>, Material<MaterialEventMap> | Material<MaterialEventMap>[], Object3DEventMap> | null;
    _basePose: USequenceMeshPoseVo | undefined;
    _state: "active" | "inactive";
    /**
     * 연결한 자료 식별자를 저장합니다.
     *
     * @param {undefined | string} value 저장할 연결한 자료 식별자 입력 변경/소유권 이전 없음
     */
    set contentId(value: undefined | string);
    /**
     * 연결한 자료 식별자를 반환합니다.
     *
     * @returns {undefined | string}
     */
    get contentId(): undefined | string;
    /**
     * IFC GlobalId인 객체 식별자를 저장합니다.
     *
     * @param {undefined | string} value 저장할 IFC GlobalId인 객체 식별자 입력 변경/소유권 이전 없음
     */
    set objectId(value: undefined | string);
    /**
     * IFC GlobalId인 객체 식별자를 반환합니다.
     *
     * @returns {undefined | string}
     */
    get objectId(): undefined | string;
    /**
     * 메쉬가 사용하는 단일 배치 번호를 저장합니다.
     *
     * @param {undefined | number} value 저장할 메쉬가 사용하는 단일 배치 번호 입력 변경/소유권 이전 없음
     */
    set batchId(value: undefined | number);
    /**
     * 메쉬가 사용하는 단일 배치 번호를 반환합니다.
     *
     * @returns {undefined | number}
     */
    get batchId(): undefined | number;
    /**
     * 진단에 사용할 원본 콘텐츠 주소를 저장합니다.
     *
     * @param {string | null} value 저장할 진단에 사용할 원본 콘텐츠 주소 입력 변경/소유권 이전 없음
     */
    set sourceUri(value: string | null);
    /**
     * 진단에 사용할 원본 콘텐츠 주소를 반환합니다.
     *
     * @returns {string | null}
     */
    get sourceUri(): string | null;
    /**
     * 기존 레이어가 소유한 메쉬 참조를 저장합니다.
     *
     * @param {import('three').Mesh | null} value 저장할 기존 레이어가 소유한 메쉬 참조 입력 변경/소유권 이전 없음
     */
    set mesh(value: Mesh | null);
    /**
     * 기존 레이어가 소유한 메쉬 참조 참조를 반환합니다.
     *
     * @returns {import('three').Mesh | null}
     */
    get mesh(): Mesh | null;
    /**
     * 최종 배치 후 저장한 기준 자세를 저장합니다.
     *
     * @param {undefined | import('./sequenceDefinitionVos.js').USequenceMeshPoseVo} value 저장할 최종 배치 후 저장한 기준 자세 입력 변경/소유권 이전 없음
     */
    set basePose(value: undefined | USequenceMeshPoseVo);
    /**
     * 최종 배치 후 저장한 기준 자세를 반환합니다.
     *
     * @returns {undefined | import('./sequenceDefinitionVos.js').USequenceMeshPoseVo}
     */
    get basePose(): undefined | USequenceMeshPoseVo;
    /**
     * 연결 목록의 등록 상태를 저장합니다.
     *
     * @param {'active' | 'inactive'} value 저장할 연결 목록의 등록 상태 입력 변경/소유권 이전 없음
     */
    set state(value: "active" | "inactive");
    /**
     * 연결 목록의 등록 상태를 반환합니다.
     *
     * @returns {'active' | 'inactive'}
     */
    get state(): "active" | "inactive";
}
/**
 * 메쉬 한 조각의 자료 식별자·GUID·배치 번호와 기준 자세를 보관하는 생성 옵션입니다.
 *
 * @typedef {object} USequenceMeshBindingVoCO
 * @property {string} [contentId] 연결한 자료 식별자
 * @property {string} [objectId] IFC GlobalId인 객체 식별자
 * @property {number} [batchId] 메쉬가 사용하는 단일 배치 번호
 * @property {string | null} [sourceUri] 진단에 사용할 원본 콘텐츠 주소
 * @property {import('three').Mesh | null} [mesh] 기존 레이어가 소유한 메쉬 참조
 * @property {USequenceMeshPoseVo} [basePose] 최종 배치 후 저장한 기준 자세
 * @property {'active' | 'inactive'} [state] 연결 목록의 등록 상태
 */
/**
 * 메쉬의 기준 위치·회전·배율·행렬과 표시 설정을 보관합니다.
 */
declare class USequenceMeshPoseVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceMeshPoseVo 클래스 생성자입니다. <br>
     * 옵션을 정규화하고 기준 정보의 소유권에 맞게 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceMeshPoseVoCO} [opt={}] 보관할 생성 옵션 또는 복사 원본 입력 변경/소유권 이전 없음
     */
    constructor(opt?: USequenceMeshPoseVoCO);
    _parent: Object3D<Object3DEventMap> | null;
    _position: number[];
    _quaternion: number[];
    _scale: number[];
    _localMatrix: number[];
    _worldMatrix: number[];
    _visible: boolean;
    _matrixAutoUpdate: boolean;
    _matrixWorldAutoUpdate: boolean;
    /**
     * 기준 자세를 저장할 때의 직접 부모를 저장합니다.
     *
     * @param {import('three').Object3D | null} value 저장할 기준 자세를 저장할 때의 직접 부모 입력 변경/소유권 이전 없음
     */
    set parent(value: Object3D | null);
    /**
     * 기준 자세를 저장할 때의 직접 부모 참조를 반환합니다.
     *
     * @returns {import('three').Object3D | null}
     */
    get parent(): Object3D | null;
    /**
     * 부모 기준의 원래 위치 x,y,z를 저장합니다.
     *
     * @param {Array<number>} value 저장할 부모 기준의 원래 위치 x, y, z 입력 변경/소유권 이전 없음
     */
    set position(value: Array<number>);
    /**
     * 부모 기준의 원래 위치 x,y,z를 반환합니다.
     *
     * @returns {Array<number>} 부모 기준의 원래 위치 x,y,z의 복사본
     */
    get position(): Array<number>;
    /**
     * 원래 회전 x,y,z,w를 저장합니다.
     *
     * @param {Array<number>} value 저장할 원래 회전 x, y, z, w 입력 변경/소유권 이전 없음
     */
    set quaternion(value: Array<number>);
    /**
     * 원래 회전 x,y,z,w를 반환합니다.
     *
     * @returns {Array<number>} 원래 회전 x,y,z,w의 복사본
     */
    get quaternion(): Array<number>;
    /**
     * 원래 배율 x,y,z를 저장합니다.
     *
     * @param {Array<number>} value 저장할 원래 배율 x, y, z 입력 변경/소유권 이전 없음
     */
    set scale(value: Array<number>);
    /**
     * 원래 배율 x,y,z를 반환합니다.
     *
     * @returns {Array<number>} 원래 배율 x,y,z의 복사본
     */
    get scale(): Array<number>;
    /**
     * Three.js elements 순서의 원래 로컬 행렬를 저장합니다.
     *
     * @param {Array<number>} value 저장할 Three.js elements 순서의 원래 로컬 행렬 입력 변경/소유권 이전 없음
     */
    set localMatrix(value: Array<number>);
    /**
     * Three.js elements 순서의 원래 로컬 행렬를 반환합니다.
     *
     * @returns {Array<number>} Three.js elements 순서의 원래 로컬 행렬의 복사본
     */
    get localMatrix(): Array<number>;
    /**
     * 부모 변환을 포함한 원래 월드 행렬를 저장합니다.
     *
     * @param {Array<number>} value 저장할 부모 변환을 포함한 원래 월드 행렬 입력 변경/소유권 이전 없음
     */
    set worldMatrix(value: Array<number>);
    /**
     * 부모 변환을 포함한 원래 월드 행렬를 반환합니다.
     *
     * @returns {Array<number>} 부모 변환을 포함한 원래 월드 행렬의 복사본
     */
    get worldMatrix(): Array<number>;
    /**
     * 원래 메쉬 표시 값를 저장합니다.
     *
     * @param {boolean} value 저장할 원래 메쉬 표시 값 입력 변경/소유권 이전 없음
     */
    set visible(value: boolean);
    /**
     * 원래 메쉬 표시 값를 반환합니다.
     *
     * @returns {boolean}
     */
    get visible(): boolean;
    /**
     * 원래 로컬 행렬 자동 갱신 설정를 저장합니다.
     *
     * @param {boolean} value 저장할 원래 로컬 행렬 자동 갱신 설정 입력 변경/소유권 이전 없음
     */
    set matrixAutoUpdate(value: boolean);
    /**
     * 원래 로컬 행렬 자동 갱신 설정를 반환합니다.
     *
     * @returns {boolean}
     */
    get matrixAutoUpdate(): boolean;
    /**
     * 원래 월드 행렬 자동 갱신 설정를 저장합니다.
     *
     * @param {boolean} value 저장할 원래 월드 행렬 자동 갱신 설정 입력 변경/소유권 이전 없음
     */
    set matrixWorldAutoUpdate(value: boolean);
    /**
     * 원래 월드 행렬 자동 갱신 설정를 반환합니다.
     *
     * @returns {boolean}
     */
    get matrixWorldAutoUpdate(): boolean;
}
/**
 * 메쉬의 기준 위치·회전·배율·행렬과 표시 설정을 보관하는 생성 옵션입니다.
 *
 * @typedef {object} USequenceMeshPoseVoCO
 * @property {import('three').Object3D | null} [parent] 기준 자세를 저장할 때의 직접 부모
 * @property {Array<number>} [position] 부모 기준의 원래 위치 x,y,z
 * @property {Array<number>} [quaternion] 원래 회전 x,y,z,w
 * @property {Array<number>} [scale] 원래 배율 x,y,z
 * @property {Array<number>} [localMatrix] Three.js elements 순서의 원래 로컬 행렬
 * @property {Array<number>} [worldMatrix] 부모 변환을 포함한 원래 월드 행렬
 * @property {boolean} [visible] 원래 메쉬 표시 값
 * @property {boolean} [matrixAutoUpdate] 원래 로컬 행렬 자동 갱신 설정
 * @property {boolean} [matrixWorldAutoUpdate] 원래 월드 행렬 자동 갱신 설정
 */
/**
 * 검증 단계에서 메쉬 반영 단계로 전달하는 연결·이동량·로컬 행렬을 보관합니다.
 */
declare class USequenceMeshTransformVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceMeshTransformVo 클래스 생성자입니다. <br>
     * 검증한 메쉬 적용 계획을 독립 컨테이너로 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceMeshTransformVoCO} [opt={}] 읽기 전용 생성 옵션 또는 같은 VO의 복사 원본 <br>
     * 생략 시 기본값: {}.
     */
    constructor(opt?: USequenceMeshTransformVoCO);
    /**
     * 적용할 메쉬·기준 자세의 연결 정보를 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceMeshBindingVo} value 적용할 메쉬·기준 자세의 연결 정보. <br>
     * 메쉬·부모는 빌린 참조를 유지하고 기준 숫자 배열과 VO는 복사합니다.
     */
    set binding(value: USequenceMeshBindingVo);
    /**
     * 적용할 메쉬·기준 자세의 연결 정보를 반환합니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequenceMeshBindingVo} 적용할 메쉬·기준 자세의 연결 정보. <br>
     * 메쉬·부모는 빌린 참조를 유지하고 기준 숫자 배열과 VO는 복사합니다.
     */
    get binding(): USequenceMeshBindingVo;
    /**
     * 확정 그룹 ID이며 미분류이면 null을 보관합니다.
     *
     * @param {string | null} value 확정 그룹 ID이며 미분류이면 null. <br>
     * null을 허용하며 그룹 관계 검증은 실행기가 수행합니다.
     */
    set groupId(value: string | null);
    /**
     * 확정 그룹 ID이며 미분류이면 null을 반환합니다.
     *
     * @returns {string | null} 확정 그룹 ID이며 미분류이면 null. <br>
     * null을 허용하며 그룹 관계 검증은 실행기가 수행합니다.
     */
    get groupId(): string | null;
    /**
     * 엔진 월드 단위의 동·북·상 이동량를 보관합니다.
     *
     * @param {[ number, number, number ]} value 엔진 월드 단위의 동·북·상 이동량. <br>
     * 입력 배열을 복사하며 원본을 변경하지 않습니다.
     */
    set worldOffset(value: [number, number, number]);
    /**
     * 엔진 월드 단위의 동·북·상 이동량를 반환합니다.
     *
     * @returns {[ number, number, number ]} 엔진 월드 단위의 동·북·상 이동량. <br>
     * 입력 배열을 복사하며 원본을 변경하지 않습니다.
     */
    get worldOffset(): [number, number, number];
    /**
     * 부모 좌표 단위의 로컬 이동량를 보관합니다.
     *
     * @param {[ number, number, number ]} value 부모 좌표 단위의 로컬 이동량. <br>
     * 입력 배열을 복사하며 원본을 변경하지 않습니다.
     */
    set localOffset(value: [number, number, number]);
    /**
     * 부모 좌표 단위의 로컬 이동량를 반환합니다.
     *
     * @returns {[ number, number, number ]} 부모 좌표 단위의 로컬 이동량. <br>
     * 입력 배열을 복사하며 원본을 변경하지 않습니다.
     */
    get localOffset(): [number, number, number];
    /**
     * Three.js elements 순서의 최종 로컬 행렬 16개를 보관합니다.
     *
     * @param {Array<number>} value Three.js elements 순서의 최종 로컬 행렬 16개. <br>
     * 입력 배열을 복사하며 원본을 변경하지 않습니다.
     */
    set localMatrix(value: Array<number>);
    /**
     * Three.js elements 순서의 최종 로컬 행렬 16개를 반환합니다.
     *
     * @returns {Array<number>} Three.js elements 순서의 최종 로컬 행렬 16개. <br>
     * 입력 배열을 복사하며 원본을 변경하지 않습니다.
     */
    get localMatrix(): Array<number>;
    _binding: USequenceMeshBindingVo | undefined;
    _groupId: string | null | undefined;
    _worldOffset: [number, number, number] | undefined;
    _localOffset: [number, number, number] | undefined;
    _localMatrix: number[] | undefined;
}
/**
 * 검증한 메쉬 변환 계획의 생성 옵션입니다.
 *
 * @typedef {object} USequenceMeshTransformVoCO
 * @property {USequenceMeshBindingVo} [binding] 연결 VO와 기준 숫자 배열은 복사하고 mesh·parent는 엔진 소유 참조를 빌립니다.
 * @property {string | null} [groupId=null] 확정 그룹 ID. 미분류는 null이며 관계 검증은 실행기가 수행합니다.
 * @property {[number,number,number]} [worldOffset] 엔진 월드 단위의 동·북·상 이동량. 기본값은 [0,0,0]이며 입력 배열을 복사합니다.
 * @property {[number,number,number]} [localOffset] 부모 좌표 단위의 로컬 이동량. 기본값은 [0,0,0]이며 입력 배열을 복사합니다.
 * @property {Array<number>} [localMatrix] Three.js elements 순서의 최종 로컬 행렬 16개. 기본값은 단위 행렬이며 입력 배열을 복사합니다.
 */
/**
 * 한 메쉬 조각의 기준 표시·시공 표시·합성 표시 조건을 보관합니다.
 */
declare class USequenceMeshVisibilityVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceMeshVisibilityVo 클래스 생성자입니다. <br>
     * 표시 계획을 입력 컨테이너와 독립적으로 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceMeshVisibilityVoCO} [opt={}] 읽기 전용 생성 옵션 또는 같은 VO의 복사 원본 <br>
     * 생략 시 기본값: {}.
     */
    constructor(opt?: USequenceMeshVisibilityVoCO);
    /**
     * 활성 메쉬 연결 정보를 보관합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceMeshBindingVo} value 활성 메쉬 연결 정보. <br>
     * 메쉬·부모는 빌린 참조를 유지하고 중첩 VO와 기준 숫자 배열은 복사합니다.
     */
    set binding(value: USequenceMeshBindingVo);
    /**
     * 활성 메쉬 연결 정보를 반환합니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequenceMeshBindingVo} 활성 메쉬 연결 정보. <br>
     * 메쉬·부모는 빌린 참조를 유지하고 중첩 VO와 기준 숫자 배열은 복사합니다.
     */
    get binding(): USequenceMeshBindingVo;
    /**
     * 확정 그룹 ID를 보관합니다.
     *
     * @param {string | null} value 확정 그룹 ID. <br>
     * 미분류는 null이며 그룹 관계 검증은 실행기가 담당합니다.
     */
    set groupId(value: string | null);
    /**
     * 확정 그룹 ID를 반환합니다.
     *
     * @returns {string | null} 확정 그룹 ID. <br>
     * 미분류는 null이며 그룹 관계 검증은 실행기가 담당합니다.
     */
    get groupId(): string | null;
    /**
     * 시퀀스를 제외한 기준 표시 조건를 보관합니다.
     *
     * @param {boolean} value 시퀀스를 제외한 기준 표시 조건. <br>
     * 현재 mesh.visible과 독립적으로 조회한 boolean을 보관합니다.
     */
    set baseVisible(value: boolean);
    /**
     * 시퀀스를 제외한 기준 표시 조건를 반환합니다.
     *
     * @returns {boolean} 시퀀스를 제외한 기준 표시 조건. <br>
     * 현재 mesh.visible과 독립적으로 조회한 boolean을 보관합니다.
     */
    get baseVisible(): boolean;
    /**
     * 현재 시각의 시공 표시 조건를 보관합니다.
     *
     * @param {boolean} value 현재 시각의 시공 표시 조건. <br>
     * 그룹 논리 visible 또는 미분류 표시 정책을 보관합니다.
     */
    set sequenceVisible(value: boolean);
    /**
     * 현재 시각의 시공 표시 조건를 반환합니다.
     *
     * @returns {boolean} 현재 시각의 시공 표시 조건. <br>
     * 그룹 논리 visible 또는 미분류 표시 정책을 보관합니다.
     */
    get sequenceVisible(): boolean;
    /**
     * 메쉬에 적용할 로컬 표시 값를 보관합니다.
     *
     * @param {boolean} value 메쉬에 적용할 로컬 표시 값. <br>
     * 실행기가 기준 조건과 시공 조건을 AND한 결과이며 부모·카메라의 전체 가시성 판정은 포함하지 않습니다.
     */
    set visible(value: boolean);
    /**
     * 메쉬에 적용할 로컬 표시 값를 반환합니다.
     *
     * @returns {boolean} 메쉬에 적용할 로컬 표시 값. <br>
     * 실행기가 기준 조건과 시공 조건을 AND한 결과이며 부모·카메라의 전체 가시성 판정은 포함하지 않습니다.
     */
    get visible(): boolean;
    _binding: USequenceMeshBindingVo | undefined;
    _groupId: string | null | undefined;
    _baseVisible: boolean | undefined;
    _sequenceVisible: boolean | undefined;
    _visible: boolean | undefined;
}
/**
 * 한 활성 메쉬의 표시 계획 생성 옵션입니다.
 *
 * @typedef {object} USequenceMeshVisibilityVoCO
 * @property {USequenceMeshBindingVo} [binding] 연결 VO와 기준 숫자 배열은 복사하고 mesh·parent는 엔진 참조를 빌립니다.
 * @property {string | null} [groupId=null] 확정 그룹 ID이며 미분류는 null입니다.
 * @property {boolean} [baseVisible=true] 시퀀스와 독립적으로 조회한 기준 표시 조건입니다.
 * @property {boolean} [sequenceVisible=true] 해당 그룹의 현재 논리 표시 또는 미분류 정책입니다.
 * @property {boolean} [visible=true] 두 조건을 AND한 mesh.visible 값입니다. 부모 표시·카메라 등 최종 렌더 판정은 포함하지 않습니다.
 */
/**
 * 그룹 후보와 객체별 근거·충돌·미분류·확정 가능 여부를 보관합니다.
 */
declare class USequenceGroupClassificationVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceGroupClassificationVo 클래스 생성자입니다. <br>
     * 입력 컨테이너를 독립적으로 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceGroupClassificationVoCO} [opt={}] 생성 옵션 또는 복사할 VO, USequenceGroupClassificationVoCO 형식의 입력 옵션 또는 복사 원본 VO입니다. <br>
     * 생략 시 {}이며 원본을 변경하지 않습니다.
     */
    constructor(opt?: USequenceGroupClassificationVoCO);
    _contentId: string;
    _scopeObjectIds: string[];
    _candidateGroups: USequenceGroupVo[];
    _assignments: USequenceObjectAssignmentVo[];
    _unassignedObjectIds: string[];
    _conflictObjectIds: string[];
    _metadataMissingObjectIds: string[];
    _referenceIssues: USequenceGroupReferenceIssueVo[];
    _ready: boolean;
    /**
     * 분류에 사용한 속성 자료 ID를 저장합니다.
     *
     * @param {string} value 저장할 분류에 사용한 속성 자료 ID
     */
    set contentId(value: string);
    /**
     * 분류에 사용한 속성 자료 ID를 반환합니다.
     *
     * @returns {string}
     */
    get contentId(): string;
    /**
     * 중복을 제거한 전체 형상 GUID 범위를 저장합니다.
     *
     * @param {Array<string>} value 저장할 중복을 제거한 전체 형상 GUID 범위, 중복을 제거한 전체 형상 GUID 범위입니다. <br>
     * 입력을 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set scopeObjectIds(value: Array<string>);
    /**
     * 중복을 제거한 전체 형상 GUID 범위를 반환합니다. <br>
     * 내부 컨테이너를 공유하지 않습니다.
     *
     * @returns {Array<string>} 중복을 제거한 전체 형상 GUID 범위의 복사본
     */
    get scopeObjectIds(): Array<string>;
    /**
     * 후보 objectIds가 담긴 그룹 복사본을 저장합니다.
     *
     * @param {Array<import('./sequenceDefinitionVos.js').USequenceGroupVo>} value 저장할 후보 objectIds가 담긴 그룹 복사본, 후보 objectIds가 담긴 그룹 복사본입니다. <br>
     * 입력을 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set candidateGroups(value: Array<USequenceGroupVo>);
    /**
     * 후보 objectIds가 담긴 그룹 복사본을 반환합니다. <br>
     * 내부 컨테이너를 공유하지 않습니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceGroupVo>} 후보 objectIds가 담긴 그룹 복사본의 복사본
     */
    get candidateGroups(): Array<USequenceGroupVo>;
    /**
     * 조회 범위의 GUID별 배정 근거와 상태를 저장합니다.
     *
     * @param {Array<import('./sequenceDefinitionVos.js').USequenceObjectAssignmentVo>} value 저장할 조회 범위의 GUID별 배정 근거와 상태, 조회 범위의 GUID별 배정 근거와 상태입니다. <br>
     * 입력을 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set assignments(value: Array<USequenceObjectAssignmentVo>);
    /**
     * 조회 범위의 GUID별 배정 근거와 상태를 반환합니다. <br>
     * 내부 컨테이너를 공유하지 않습니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceObjectAssignmentVo>} 조회 범위의 GUID별 배정 근거와 상태의 복사본
     */
    get assignments(): Array<USequenceObjectAssignmentVo>;
    /**
     * 그룹 후보가 없는 GUID를 저장합니다.
     *
     * @param {Array<string>} value 저장할 그룹 후보가 없는 GUID, 그룹 후보가 없는 GUID입니다. <br>
     * 입력을 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set unassignedObjectIds(value: Array<string>);
    /**
     * 그룹 후보가 없는 GUID를 반환합니다. <br>
     * 내부 컨테이너를 공유하지 않습니다.
     *
     * @returns {Array<string>} 그룹 후보가 없는 GUID의 복사본
     */
    get unassignedObjectIds(): Array<string>;
    /**
     * 둘 이상의 그룹 후보에 포함된 GUID를 저장합니다.
     *
     * @param {Array<string>} value 저장할 둘 이상의 그룹 후보에 포함된 GUID, 둘 이상의 그룹 후보에 포함된 GUID입니다. <br>
     * 입력을 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set conflictObjectIds(value: Array<string>);
    /**
     * 둘 이상의 그룹 후보에 포함된 GUID를 반환합니다. <br>
     * 내부 컨테이너를 공유하지 않습니다.
     *
     * @returns {Array<string>} 둘 이상의 그룹 후보에 포함된 GUID의 복사본
     */
    get conflictObjectIds(): Array<string>;
    /**
     * 속성 레코드가 없는 형상 GUID를 저장합니다.
     *
     * @param {Array<string>} value 저장할 속성 레코드가 없는 형상 GUID, 속성 레코드가 없는 형상 GUID입니다. <br>
     * 입력을 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set metadataMissingObjectIds(value: Array<string>);
    /**
     * 속성 레코드가 없는 형상 GUID를 반환합니다. <br>
     * 내부 컨테이너를 공유하지 않습니다.
     *
     * @returns {Array<string>} 속성 레코드가 없는 형상 GUID의 복사본
     */
    get metadataMissingObjectIds(): Array<string>;
    /**
     * 범위 밖 수동 포함·제외 참조를 저장합니다.
     *
     * @param {Array<import('./sequenceDefinitionVos.js').USequenceGroupReferenceIssueVo>} value 저장할 범위 밖 수동 포함·제외 참조, 범위 밖 수동 포함·제외 참조입니다. <br>
     * 입력을 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set referenceIssues(value: Array<USequenceGroupReferenceIssueVo>);
    /**
     * 범위 밖 수동 포함·제외 참조를 반환합니다. <br>
     * 내부 컨테이너를 공유하지 않습니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceGroupReferenceIssueVo>} 범위 밖 수동 포함·제외 참조의 복사본
     */
    get referenceIssues(): Array<USequenceGroupReferenceIssueVo>;
    /**
     * 충돌·범위 밖 참조가 없어 확정할 수 있는 여부를 저장합니다.
     *
     * @param {boolean} value 저장할 충돌·범위 밖 참조가 없어 확정할 수 있는 여부, 충돌·범위 밖 참조가 없어 확정할 수 있는 여부입니다.
     */
    set ready(value: boolean);
    /**
     * 충돌·범위 밖 참조가 없어 확정할 수 있는 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get ready(): boolean;
}
/**
 * 그룹 후보와 객체별 근거·충돌·미분류·확정 가능 여부를 보관하는 생성 옵션입니다.
 *
 * @typedef {object} USequenceGroupClassificationVoCO
 * @property {string} [contentId] 분류에 사용한 속성 자료 ID
 * @property {Array<string>} [scopeObjectIds] 중복을 제거한 전체 형상 GUID 범위
 * @property {Array<USequenceGroupVo>} [candidateGroups] 후보 objectIds가 담긴 그룹 복사본
 * @property {Array<USequenceObjectAssignmentVo>} [assignments] 조회 범위의 GUID별 배정 근거와 상태
 * @property {Array<string>} [unassignedObjectIds] 그룹 후보가 없는 GUID
 * @property {Array<string>} [conflictObjectIds] 둘 이상의 그룹 후보에 포함된 GUID
 * @property {Array<string>} [metadataMissingObjectIds] 속성 레코드가 없는 형상 GUID
 * @property {Array<USequenceGroupReferenceIssueVo>} [referenceIssues] 범위 밖 수동 포함·제외 참조
 * @property {boolean} [ready] 충돌·범위 밖 참조가 없어 확정할 수 있는 여부
 */
/**
 * 그룹 편집의 자료 범위·그룹 사본·선택·최신 분류 결과를 보관합니다.
 */
declare class USequenceGroupEditVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceGroupEditVo 클래스 생성자입니다. <br>
     * 편집 상태를 생성하고 배열과 중첩 VO를 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceGroupEditVoCO} [opt={}] 입력을 변경하지 않을 생성 옵션 또는 복사 원본 <br>
     * 생략 시 기본값: {}.
     */
    constructor(opt?: USequenceGroupEditVoCO);
    /**
     * 편집 대상 자료 식별자를 저장합니다.
     *
     * @param {string} value 편집 대상 자료 식별자. <br>
     * 입력 배열과 중첩 VO는 복사하며 원본을 변경하지 않습니다.
     */
    set contentId(value: string);
    /**
     * 편집 대상 자료 식별자를 반환합니다.
     *
     * @returns {string}
     */
    get contentId(): string;
    /**
     * 전체 형상 GUID 범위를 저장합니다.
     *
     * @param {Array<string>} value 전체 형상 GUID 범위. <br>
     * 입력 배열과 중첩 VO는 복사하며 원본을 변경하지 않습니다.
     */
    set scopeObjectIds(value: Array<string>);
    /**
     * 전체 형상 GUID 범위를 반환합니다.
     *
     * @returns {Array<string>} 전체 형상 GUID 범위의 독립 복사본
     */
    get scopeObjectIds(): Array<string>;
    /**
     * 원본과 독립적인 편집 그룹 목록를 저장합니다.
     *
     * @param {Array<import('./sequenceDefinitionVos.js').USequenceGroupVo>} value 원본과 독립적인 편집 그룹 목록. <br>
     * 입력 배열과 중첩 VO는 복사하며 원본을 변경하지 않습니다.
     */
    set groups(value: Array<USequenceGroupVo>);
    /**
     * 원본과 독립적인 편집 그룹 목록를 반환합니다.
     *
     * @returns {Array<import('./sequenceDefinitionVos.js').USequenceGroupVo>} 원본과 독립적인 편집 그룹 목록의 독립 복사본
     */
    get groups(): Array<USequenceGroupVo>;
    /**
     * 현재 편집하는 그룹 ID 또는 미선택 null을 저장합니다.
     *
     * @param {string | null} value 현재 편집하는 그룹 ID 또는 미선택 null. <br>
     * 입력 배열과 중첩 VO는 복사하며 원본을 변경하지 않습니다.
     */
    set activeGroupId(value: string | null);
    /**
     * 현재 편집하는 그룹 ID 또는 미선택 null을 반환합니다.
     *
     * @returns {string | null}
     */
    get activeGroupId(): string | null;
    /**
     * 미로드 객체를 포함한 현재 선택 GUID 목록를 저장합니다.
     *
     * @param {Array<string>} value 미로드 객체를 포함한 현재 선택 GUID 목록. <br>
     * 입력 배열과 중첩 VO는 복사하며 원본을 변경하지 않습니다.
     */
    set selectedObjectIds(value: Array<string>);
    /**
     * 미로드 객체를 포함한 현재 선택 GUID 목록를 반환합니다.
     *
     * @returns {Array<string>} 미로드 객체를 포함한 현재 선택 GUID 목록의 독립 복사본
     */
    get selectedObjectIds(): Array<string>;
    /**
     * 최신 분류 결과 또는 무효화된 null을 저장합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceGroupClassificationVo | null} value 최신 분류 결과 또는 무효화된 null. <br>
     * 입력 배열과 중첩 VO는 복사하며 원본을 변경하지 않습니다.
     */
    set classification(value: USequenceGroupClassificationVo | null);
    /**
     * 최신 분류 결과 또는 무효화된 null을 반환합니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequenceGroupClassificationVo | null} 최신 분류 결과 또는 무효화된 null의 독립 복사본
     */
    get classification(): USequenceGroupClassificationVo | null;
    /**
     * 시작 상태 이후 그룹 편집 변경 여부를 저장합니다.
     *
     * @param {boolean} value 시작 상태 이후 그룹 편집 변경 여부. <br>
     * 입력 배열과 중첩 VO는 복사하며 원본을 변경하지 않습니다.
     */
    set dirty(value: boolean);
    /**
     * 시작 상태 이후 그룹 편집 변경 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get dirty(): boolean;
    _contentId: string | undefined;
    _scopeObjectIds: string[] | undefined;
    _groups: USequenceGroupVo[] | undefined;
    _activeGroupId: string | null | undefined;
    _selectedObjectIds: string[] | undefined;
    _classification: USequenceGroupClassificationVo | null | undefined;
    _dirty: boolean | undefined;
}
/**
 * 그룹 편집 상태의 생성 옵션입니다.
 *
 * @typedef {object} USequenceGroupEditVoCO
 * @property {string} [contentId] 편집 대상 자료 식별자
 * @property {Array<string>} [scopeObjectIds] 전체 형상 GUID 범위
 * @property {Array<USequenceGroupVo>} [groups] 원본과 독립적인 편집 그룹 목록
 * @property {string | null} [activeGroupId] 현재 편집하는 그룹 ID 또는 미선택 null
 * @property {Array<string>} [selectedObjectIds] 미로드 객체를 포함한 현재 선택 GUID 목록
 * @property {USequenceGroupClassificationVo | null} [classification] 최신 분류 결과 또는 무효화된 null
 * @property {boolean} [dirty] 시작 상태 이후 그룹 편집 변경 여부
 */
/**
 * 그룹의 수동 포함·제외에서 범위 밖 GUID 참조를 보관합니다.
 */
declare class USequenceGroupReferenceIssueVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceGroupReferenceIssueVo 클래스 생성자입니다. <br>
     * 입력 컨테이너를 독립적으로 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceGroupReferenceIssueVoCO} [opt={}] 생성 옵션 또는 복사할 VO, USequenceGroupReferenceIssueVoCO 형식의 입력 옵션 또는 복사 원본 VO입니다. <br>
     * 생략 시 {}이며 원본을 변경하지 않습니다.
     */
    constructor(opt?: USequenceGroupReferenceIssueVoCO);
    _groupId: string;
    _sourceField: "includeObjectIds" | "excludeObjectIds";
    _objectId: string;
    /**
     * 문제가 있는 그룹 ID를 저장합니다.
     *
     * @param {string} value 저장할 문제가 있는 그룹 ID
     */
    set groupId(value: string);
    /**
     * 문제가 있는 그룹 ID를 반환합니다.
     *
     * @returns {string}
     */
    get groupId(): string;
    /**
     * 범위 밖 참조가 있는 원본 필드를 저장합니다.
     *
     * @param {'includeObjectIds' | 'excludeObjectIds'} value 저장할 범위 밖 참조가 있는 원본 필드, 범위 밖 참조가 있는 원본 필드입니다.
     */
    set sourceField(value: "includeObjectIds" | "excludeObjectIds");
    /**
     * 범위 밖 참조가 있는 원본 필드를 반환합니다.
     *
     * @returns {'includeObjectIds' | 'excludeObjectIds'}
     */
    get sourceField(): "includeObjectIds" | "excludeObjectIds";
    /**
     * 전체 형상 범위 밖을 가리킨 GUID를 저장합니다.
     *
     * @param {string} value 저장할 전체 형상 범위 밖을 가리킨 GUID, 전체 형상 범위 밖을 가리킨 GUID입니다.
     */
    set objectId(value: string);
    /**
     * 전체 형상 범위 밖을 가리킨 GUID를 반환합니다.
     *
     * @returns {string}
     */
    get objectId(): string;
}
/**
 * 그룹의 수동 포함·제외에서 범위 밖 GUID 참조를 보관하는 생성 옵션입니다.
 *
 * @typedef {object} USequenceGroupReferenceIssueVoCO
 * @property {string} [groupId] 문제가 있는 그룹 ID
 * @property {'includeObjectIds' | 'excludeObjectIds'} [sourceField] 범위 밖 참조가 있는 원본 필드
 * @property {string} [objectId] 전체 형상 범위 밖을 가리킨 GUID
 */
/**
 * GUID 하나의 후보 그룹과 배정 근거·상태를 보관합니다.
 */
declare class USequenceObjectAssignmentVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceObjectAssignmentVo 클래스 생성자입니다. <br>
     * 입력 컨테이너를 독립적으로 복사합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceObjectAssignmentVoCO} [opt={}] 생성 옵션 또는 복사할 VO, USequenceObjectAssignmentVoCO 형식의 입력 옵션 또는 복사 원본 VO입니다. <br>
     * 생략 시 {}이며 원본을 변경하지 않습니다.
     */
    constructor(opt?: USequenceObjectAssignmentVoCO);
    _objectId: string;
    _candidateGroupIds: string[];
    _ruleGroupIds: string[];
    _manualGroupIds: string[];
    _excludedGroupIds: string[];
    _state: "assigned" | "unassigned" | "conflict";
    _groupId: string | null;
    /**
     * 형상 GUID를 저장합니다.
     *
     * @param {string} value 저장할 형상 GUID
     */
    set objectId(value: string);
    /**
     * 형상 GUID를 반환합니다.
     *
     * @returns {string}
     */
    get objectId(): string;
    /**
     * 그룹별 제외를 적용한 최종 후보 그룹 ID를 저장합니다.
     *
     * @param {Array<string>} value 저장할 그룹별 제외를 적용한 최종 후보 그룹 ID, 그룹별 제외를 적용한 최종 후보 그룹 ID입니다. <br>
     * 입력을 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set candidateGroupIds(value: Array<string>);
    /**
     * 그룹별 제외를 적용한 최종 후보 그룹 ID를 반환합니다. <br>
     * 내부 컨테이너를 공유하지 않습니다.
     *
     * @returns {Array<string>} 그룹별 제외를 적용한 최종 후보 그룹 ID의 복사본
     */
    get candidateGroupIds(): Array<string>;
    /**
     * 수동 제외 전 조건을 만족한 그룹 ID를 저장합니다.
     *
     * @param {Array<string>} value 저장할 수동 제외 전 조건을 만족한 그룹 ID, 수동 제외 전 조건을 만족한 그룹 ID입니다. <br>
     * 입력을 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set ruleGroupIds(value: Array<string>);
    /**
     * 수동 제외 전 조건을 만족한 그룹 ID를 반환합니다. <br>
     * 내부 컨테이너를 공유하지 않습니다.
     *
     * @returns {Array<string>} 수동 제외 전 조건을 만족한 그룹 ID의 복사본
     */
    get ruleGroupIds(): Array<string>;
    /**
     * 수동 포함을 명시한 그룹 ID를 저장합니다.
     *
     * @param {Array<string>} value 저장할 수동 포함을 명시한 그룹 ID, 수동 포함을 명시한 그룹 ID입니다. <br>
     * 입력을 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set manualGroupIds(value: Array<string>);
    /**
     * 수동 포함을 명시한 그룹 ID를 반환합니다. <br>
     * 내부 컨테이너를 공유하지 않습니다.
     *
     * @returns {Array<string>} 수동 포함을 명시한 그룹 ID의 복사본
     */
    get manualGroupIds(): Array<string>;
    /**
     * 수동 제외를 명시한 그룹 ID를 저장합니다.
     *
     * @param {Array<string>} value 저장할 수동 제외를 명시한 그룹 ID, 수동 제외를 명시한 그룹 ID입니다. <br>
     * 입력을 복사하여 보관하며 원본을 변경하지 않습니다.
     */
    set excludedGroupIds(value: Array<string>);
    /**
     * 수동 제외를 명시한 그룹 ID를 반환합니다. <br>
     * 내부 컨테이너를 공유하지 않습니다.
     *
     * @returns {Array<string>} 수동 제외를 명시한 그룹 ID의 복사본
     */
    get excludedGroupIds(): Array<string>;
    /**
     * 후보 수에 따른 배정 상태를 저장합니다.
     *
     * @param {'assigned' | 'unassigned' | 'conflict'} value 저장할 후보 수에 따른 배정 상태
     */
    set state(value: "assigned" | "unassigned" | "conflict");
    /**
     * 후보 수에 따른 배정 상태를 반환합니다.
     *
     * @returns {'assigned' | 'unassigned' | 'conflict'}
     */
    get state(): "assigned" | "unassigned" | "conflict";
    /**
     * 단일 배정 그룹 ID 또는 미분류·충돌의 null을 저장합니다.
     *
     * @param {string | null} value 저장할 단일 배정 그룹 ID 또는 미분류·충돌의 null, 단일 배정 그룹 ID 또는 미분류·충돌의 null입니다.
     */
    set groupId(value: string | null);
    /**
     * 단일 배정 그룹 ID 또는 미분류·충돌의 null을 반환합니다.
     *
     * @returns {string | null}
     */
    get groupId(): string | null;
}
/**
 * GUID 하나의 후보 그룹과 배정 근거·상태를 보관하는 생성 옵션입니다.
 *
 * @typedef {object} USequenceObjectAssignmentVoCO
 * @property {string} [objectId] 형상 GUID
 * @property {Array<string>} [candidateGroupIds] 그룹별 제외를 적용한 최종 후보 그룹 ID
 * @property {Array<string>} [ruleGroupIds] 수동 제외 전 조건을 만족한 그룹 ID
 * @property {Array<string>} [manualGroupIds] 수동 포함을 명시한 그룹 ID
 * @property {Array<string>} [excludedGroupIds] 수동 제외를 명시한 그룹 ID
 * @property {'assigned' | 'unassigned' | 'conflict'} [state] 후보 수에 따른 배정 상태
 * @property {string | null} [groupId] 단일 배정 그룹 ID 또는 미분류·충돌의 null
 */
/**
 * 시간표 편집의 독립 시퀀스·선택 단계·선택 트랙·변경 여부를 보관합니다.
 */
declare class USequenceScheduleEditVo {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceScheduleEditVo 클래스 생성자입니다. <br>
     * 입력 시퀀스를 독립 복사하여 편집 상태를 생성합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceScheduleEditVoCO} opt 원본을 변경하지 않을 시퀀스와 선택 상태
     */
    constructor(opt: USequenceScheduleEditVoCO);
    /**
     * 전체 시간표와 확정 그룹을 포함하는 독립 시퀀스를 저장합니다.
     *
     * @param {import('./sequenceDefinitionVos.js').USequenceVo} value 전체 시간표와 확정 그룹을 포함하는 독립 시퀀스. <br>
     * 자료형 USequenceVo이며 null을 허용하지 않고 원본과 중첩 컨테이너를 공유하지 않습니다.
     */
    set sequence(value: USequenceVo);
    /**
     * 전체 시간표와 확정 그룹을 포함하는 독립 시퀀스를 반환합니다.
     *
     * @returns {import('./sequenceDefinitionVos.js').USequenceVo} 전체 시간표와 확정 그룹을 포함하는 독립 시퀀스의 중첩 복사본
     */
    get sequence(): USequenceVo;
    /**
     * 편집 중인 단계 ID 또는 미선택 null을 저장합니다.
     *
     * @param {string | null} value 편집 중인 단계 ID 또는 미선택 null. <br>
     * 입력 값의 관계 검증은 편집 실행기가 수행합니다.
     */
    set activePhaseId(value: string | null);
    /**
     * 편집 중인 단계 ID 또는 미선택 null을 반환합니다.
     *
     * @returns {string | null}
     */
    get activePhaseId(): string | null;
    /**
     * 편집 중인 트랙 ID 또는 미선택 null을 저장합니다.
     *
     * @param {string | null} value 편집 중인 트랙 ID 또는 미선택 null. <br>
     * 입력 값의 관계 검증은 편집 실행기가 수행합니다.
     */
    set activeTrackId(value: string | null);
    /**
     * 편집 중인 트랙 ID 또는 미선택 null을 반환합니다.
     *
     * @returns {string | null}
     */
    get activeTrackId(): string | null;
    /**
     * 시작 일정에 비해 편집 내용이 변경되었는지 여부를 저장합니다.
     *
     * @param {boolean} value 시작 일정에 비해 편집 내용이 변경되었는지 여부. <br>
     * 입력 값의 관계 검증은 편집 실행기가 수행합니다.
     */
    set dirty(value: boolean);
    /**
     * 시작 일정에 비해 편집 내용이 변경되었는지 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get dirty(): boolean;
    _sequence: USequenceVo | undefined;
    _activePhaseId: string | null | undefined;
    _activeTrackId: string | null | undefined;
    _dirty: boolean | undefined;
}
type USequenceFeatureClaimVoCO$1 = {
    /**
     * 비어 있지 않은 자료 ID
     */
    contentId: string;
    /**
     * 기본null은 자료 전체, 명시 배열은 중복 없이 같은 자료의 대상
     */
    targets?: readonly (USequenceTargetVo | USequenceTargetVoCO)[] | null | undefined;
    /**
     * 쓰기 점유 속성
     */
    property: "translation" | "visibility";
};
/**
 * 시간표 편집 상태의 생성 옵션입니다.
 */
type USequenceScheduleEditVoCO = {
    /**
     * 전체 일정과 확정 그룹을 포함하는 복사 원본
     */
    sequence: USequenceVo;
    /**
     * 편집 중인 단계 ID 또는 미선택 null
     */
    activePhaseId?: string | null | undefined;
    /**
     * 편집 중인 트랙 ID 또는 미선택 null
     */
    activeTrackId?: string | null | undefined;
    /**
     * 시작 일정에 비해 변경되었는지 여부
     */
    dirty?: boolean | undefined;
};
type USequenceAssetVoCO = {
    /**
     * 자료 ID; 공백만인 값은 전체 검증에서 거부; 확정 정의의 필수 값
     */
    id?: string | undefined;
    /**
     * 후속 어댑터 등록 ID; 실제 지원 여부는 연결 단계 확인; 확정 정의의 필수 값
     */
    adapterId?: string | undefined;
    /**
     * 자료 형식 식별자; 특정 로더 지원을 뜻하지 않음; 확정 정의의 필수 값
     */
    format?: string | undefined;
    /**
     * 원본 URI 또는 메모리 등록 null; 생성 기본값 null
     */
    uri?: string | null | undefined;
    /**
     * 속성 자료 URI 또는 미사용 null; 생성 기본값 null
     */
    propertiesUri?: string | null | undefined;
    /**
     * 원본 자료 버전 식별자; 확정 정의의 필수 값
     */
    revision?: string | undefined;
    /**
     * 원본 객체 ID 해석 방식 식별자; 확정 정의의 필수 값
     */
    objectIdType?: string | undefined;
};
type USequenceTargetVoCO = {
    /**
     * 등록 자료 ID; objectId와 함께 복합 키를 구성; 확정 정의의 필수 값
     */
    contentId?: string | undefined;
    /**
     * 원본 객체 ID 문자열; 숫자 자동 변환 없음; 확정 정의의 필수 값
     */
    objectId?: string | undefined;
};
type USequenceTargetGroupVoCO = {
    /**
     * 그룹 ID; 확정 정의의 필수 값
     */
    id?: string | undefined;
    /**
     * 표시 이름; 빈 문자열 허용; 생성 기본값 ''
     */
    name?: string | undefined;
    /**
     * 대상 목록; 그룹 내 중복은 전체 검증에서 거부; 확정 정의의 필수 값
     */
    targets?: (USequenceTargetVo | USequenceTargetVoCO)[] | undefined;
};
type USequenceCoordinateVoCO = {
    /**
     * 좌표 ID; 확정 정의의 필수 값
     */
    id?: string | undefined;
    /**
     * local 오른손 XYZ·Y up 또는 enu East/North/Up; 확정 정의의 필수 값
     */
    space?: "enu" | "local" | undefined;
    /**
     * local은 null; ENU는 [경도 도, 위도 도, 타원체고 m] 3성분; 생성 기본값 null
     */
    origin?: number[] | null | undefined;
    /**
     * m/단위; local은 양의 유한 수, ENU는 1; 생성 기본값 1
     */
    metersPerUnit?: number | undefined;
};
type USequenceKeyframeVoCO = {
    /**
     * timeline 기준 상대 초; 닫힌 범위와 엄격한 증가를 전체 검증에서 확인; 확정 정의의 필수 값
     */
    time?: number | undefined;
    /**
     * translation은 숫자 3성분 오프셋, visibility는 boolean; 확정 정의의 필수 값
     */
    value?: boolean | number[] | undefined;
    /**
     * 다음 키프레임 구간 보간; visibility는 step 명시; 생성 기본값 'linear'
     */
    interpolation?: "linear" | "smoothstep" | "step" | undefined;
};
type USequenceChannelVoCO = {
    /**
     * 채널 ID; 확정 정의의 필수 값
     */
    id?: string | undefined;
    /**
     * 등록 대상 그룹 ID; 확정 정의의 필수 값
     */
    targetGroupId?: string | undefined;
    /**
     * 이동 또는 표시 속성; 다른 속성은 전체 검증에서 거부; 확정 정의의 필수 값
     */
    property?: "translation" | "visibility" | undefined;
    /**
     * translation은 좌표 ID, visibility는 null; 생성 기본값 null
     */
    coordinateId?: string | null | undefined;
    /**
     * 0 기반 순서의 키프레임 목록; 자동 정렬 없음; 확정 정의의 필수 값
     */
    keyframes?: (USequenceKeyframeVo | USequenceKeyframeVoCO)[] | undefined;
};
type USequenceFeatureVoCO = {
    /**
     * 기능 인스턴스 ID; 확정 정의의 필수 값
     */
    id?: string | undefined;
    /**
     * 등록 기능 검증기의 종류 ID; 확정 정의의 필수 값
     */
    kind?: string | undefined;
    /**
     * 기능 설정 버전; 허용 버전은 등록 검증기가 확인; 확정 정의의 필수 값
     */
    schemaVersion?: string | undefined;
    /**
     * 실행 함수·자원 없는 JSON 객체; 중첩 배열과 사전을 독립 복사; 생성 기본값 {}
     */
    config?: USequenceJsonObject$1 | undefined;
};
type USequenceDefinitionVoCO = {
    /**
     * 파일 형식; 확정 값 GeOnDTSequence; 생성 기본값 'GeOnDTSequence'
     */
    format?: string | undefined;
    /**
     * 정의 버전; 이 모듈의 확정 값 2.0.0; 생성 기본값 '2.0.0'
     */
    schemaVersion?: string | undefined;
    /**
     * 시퀀스 ID; 확정 정의의 필수 값
     */
    id?: string | undefined;
    /**
     * 설명; 빈 문자열 허용; 생성 기본값 ''
     */
    description?: string | undefined;
    /**
     * 키워드 목록; 항목 순서 보존; 생성 기본값 []
     */
    keywords?: string[] | undefined;
    /**
     * 자료 목록; 확정 정의에서 1개 이상; 확정 정의의 필수 값
     */
    contents?: (USequenceAssetVo | USequenceAssetVoCO)[] | undefined;
    /**
     * 재사용하는 상대 초·범위·실제 기준일 VO; 확정 정의의 필수 값
     */
    timeline?: USequenceTimelineVo | USequenceTimelineVoCO | undefined;
    /**
     * 좌표 선언 목록; 생성 기본값 []
     */
    coordinates?: (USequenceCoordinateVo | USequenceCoordinateVoCO)[] | undefined;
    /**
     * 대상 그룹 목록; 생성 기본값 []
     */
    groups?: (USequenceTargetGroupVo | USequenceTargetGroupVoCO)[] | undefined;
    /**
     * 이동·표시 채널 목록; 생성 기본값 []
     */
    channels?: (USequenceChannelVo | USequenceChannelVoCO)[] | undefined;
    /**
     * 등록 선택 기능 목록; 생성 기본값 []
     */
    features?: (USequenceFeatureVo | USequenceFeatureVoCO)[] | undefined;
};
/**
 * 시퀀스의 재생 시간 범위와 실제 날짜의 기준 시각을 지정하는 생성 옵션입니다.
 */
type USequenceTimelineVoCO = {
    /**
     * 시간 단위
     */
    unit?: "second" | undefined;
    /**
     * 재생 시작 시각. 시간 단위는 초입니다.
     */
    startTime?: number | undefined;
    /**
     * 재생 완료 시각. 시간 단위는 초입니다.
     */
    endTime?: number | undefined;
    /**
     * 실제 날짜의 기준 시각. 시간대가 포함된 ISO 8601 시각이며 null이면 상대 시간만 사용합니다.
     */
    epoch?: string | null | undefined;
};
type USequenceAdapterCapabilitiesVoCO = {
    /**
     * 기준 자세 대비 이동 지원; 생성 기본값 false
     */
    translation?: boolean | undefined;
    /**
     * 표시/숨김 지원; 생성 기본값 false
     */
    visibility?: boolean | undefined;
    /**
     * 대상 기준 경계 조회 지원; 생성 기본값 false
     */
    geometryBounds?: boolean | undefined;
    /**
     * 준비 이후 대상 조각 변경 통지 지원; 생성 기본값 false
     */
    streamingTargets?: boolean | undefined;
    /**
     * 완전한 논리 대상 목록 제공 능력; 생성 기본값 false
     */
    completeTargetManifest?: boolean | undefined;
};
type USequenceTargetManifestVoCO = {
    /**
     * 목록이 속한 자료 ID; 필수
     */
    contentId: string;
    /**
     * 준비한 asset.revision과 같은 원본 버전 문자열; 필수
     */
    revision: string;
    /**
     * 논리 대상 목록; 현재 Mesh 조각 목록과 구별; 생성 기본값 []
     */
    targets?: readonly (USequenceTargetVo | USequenceTargetVoCO)[] | undefined;
    /**
     * 현재 논리 대상 목록이 실제 완전함; 생성 기본값 false
     */
    complete?: boolean | undefined;
};
type USequenceReadinessVoCO = {
    /**
     * 원래 요청한 복합 대상 목록; 필수
     */
    required: ReadonlyArray<USequenceTargetVoCO | USequenceTargetVo>;
    /**
     * 현재 사용할 조각이 하나 이상 있는 대상; 필수
     */
    ready: ReadonlyArray<USequenceTargetVoCO | USequenceTargetVo>;
    /**
     * 현재 사용할 조각이 하나도 없는 대상; 필수
     */
    missing: ReadonlyArray<USequenceTargetVoCO | USequenceTargetVo>;
    /**
     * 모든 요청 대상의 모든 조각이 준비됨; missing=[]만으로 추정하지 않음; 필수
     */
    complete: boolean;
};
type USequenceTargetGeometryVoCO = {
    /**
     * 경계가 속한 복합 대상; 필수
     */
    target: USequenceTargetVoCO | USequenceTargetVo;
    /**
     * 경계의 단위·축을 정하는 요청 좌표 ID; 필수
     */
    coordinateId: string;
    /**
     * 요청 좌표 단위의 기준 AABB 최솟값; 0 기반 3성분 또는 경계 미확인 null; 생성 기본값 null
     */
    min?: number[] | null | undefined;
    /**
     * 요청 좌표 단위의 기준 AABB 최댓값; 0 기반 3성분 또는 경계 미확인 null; 생성 기본값 null
     */
    max?: number[] | null | undefined;
    /**
     * 모든 조각을 합친 기준 경계임; 생성 기본값 false
     */
    complete?: boolean | undefined;
};
type USequenceCompiledChannelsVoCO = {
    /**
     * 독립 보관할 원본 2.0 정의; 필수
     */
    definition: USequenceDefinitionVoCO | USequenceDefinitionVo;
    /**
     * 0 이상 안전 정수 컴파일 정의 태그; 호출 횟수와 구별; 생성 기본값 0
     */
    revision?: number | undefined;
    /**
     * 논리 대상별 채널 연결 목록; 빈 목록 허용; 필수
     */
    bindings: ReadonlyArray<USequenceTargetChannelBindingVoCO | USequenceTargetChannelBindingVo>;
};
type USequenceTargetChannelBindingVoCO = {
    /**
     * 자료 ID와 객체 ID의 복합 대상; 필수
     */
    target: USequenceTargetVoCO | USequenceTargetVo;
    /**
     * 이동 채널 ID 또는 비제어 null; 생성 기본값 null
     */
    translationChannelId?: string | null | undefined;
    /**
     * 표시 채널 ID 또는 비제어 null; 생성 기본값 null
     */
    visibilityChannelId?: string | null | undefined;
};
type USequenceFrameVoCO = {
    /**
     * 평가한 시퀀스 ID; 필수
     */
    sequenceId: string;
    /**
     * 0 이상 안전 정수 컴파일 정의 태그; 평가마다 증가하지 않음; 생성 기본값 0
     */
    revision?: number | undefined;
    /**
     * 요청한 유한 상대 초; 범위 밖도 원래 시각 보존; 필수
     */
    time: number;
    /**
     * 제어하는 대상별 독립 상태 목록; 빈 목록 허용; 생성 기본값 []
     */
    states?: readonly (USequenceTargetStateVo | USequenceTargetStateVoCO)[] | undefined;
};
type USequenceTargetStateVoCO = {
    /**
     * 자료 ID와 객체 ID의 복합 대상; 필수
     */
    target: USequenceTargetVoCO | USequenceTargetVo;
    /**
     * 선언 좌표 단위의 유한 3성분 이동; null은 비제어; 생성 기본값 null
     */
    translation?: number[] | null | undefined;
    /**
     * 이동 좌표 ID; 이동이 null이면 null; 생성 기본값 null
     */
    coordinateId?: string | null | undefined;
    /**
     * 표시 true·숨김 false 또는 비제어 null; 생성 기본값 null
     */
    visible?: boolean | null | undefined;
};
type USequenceMovementBoundsVoCO = {
    /**
     * 자료 ID, 필수·null 불가
     */
    contentId: string;
    /**
     * 좌표 ID, 필수·null 불가
     */
    coordinateId: string;
    /**
     * 선언 좌표 단위의 유한 최소 이동3성분, 0 포함 필수
     */
    min: number[];
    /**
     * 같은 단위의 유한 최대 이동3성분, 0 포함 필수
     */
    max: number[];
};
type USequenceReadinessPolicy = "strict" | "progressive";
type USequencePlaybackOptionsVoCO = {
    /**
     * 유한 상대 초 또는 자동 초기 위치null, 기본null, 음수 배속이면 끝에서 시작
     */
    startTime?: number | null | undefined;
    /**
     * 유한 무차원 배속, 음수/0 허용, 기본1
     */
    multiplier?: number | undefined;
    /**
     * 자동 경과 반복 여부, 기본false
     */
    loop?: boolean | undefined;
    /**
     * 후속 Runtime 준비 정책 strict/progressive, 기본strict
     */
    readinessPolicy?: USequenceReadinessPolicy | undefined;
    /**
     * 후속 Runtime 준비 timeout, 유한0이상 초, 기본30
     */
    readinessTimeoutSeconds?: number | undefined;
};
type USequencePlaybackMode = "manual" | "automatic";
type USequencePlaybackStatus = "paused" | "playing" | "ended" | "error" | "disposed";
type USequencePlaybackSnapshotVoCO = {
    /**
     * 유한 상대 시작 초, 필수
     */
    startTime: number;
    /**
     * 유한 상대 종료 초, 시작 이상, 필수
     */
    endTime: number;
    /**
     * 범위 안 유한 현재 상대 초, 필수
     */
    currentTime: number;
    /**
     * 유한 무차원 배속, 음수/0 허용, 기본1
     */
    multiplier?: number | undefined;
    /**
     * 반복 정책, 기본false
     */
    loop?: boolean | undefined;
    /**
     * 재생 의도, 배속0에서도 true 가능, 기본false
     */
    playing?: boolean | undefined;
    /**
     * 수동/manual 또는 자동/automatic, 기본manual
     */
    mode?: USequencePlaybackMode | undefined;
    /**
     * 성공 확정 상태 paused/playing/ended/error/disposed, 기본paused
     */
    status?: USequencePlaybackStatus | undefined;
    /**
     * - 0이상 안전 정수 관측 버전, 기본0
     */
    revision?: number | undefined;
};
type USequenceIssueVoCO$1 = {
    /**
     * 실패 분류 코드; 비어 있지 않은 문자열, 기본 RUNTIME_FAILED
     */
    code?: string | undefined;
    /**
     * 원본 오류를 설명하는 진단; 필수·비어 있지 않은 문자열·null 불가
     */
    message: string;
    /**
     * 실패한 문서/자원 경로; null 또는 비어 있지 않은 문자열, 배열은0기반
     */
    path?: string | null | undefined;
    /**
     * 알려진 복합 대상; contentId/objectId 사본 또는 null
     */
    target?: USequenceTargetVo | USequenceTargetVoCO | null | undefined;
};
type USequencePlayerPhase$2 = "empty" | "loading" | "ready" | "playing" | "paused" | "ended" | "restoring" | "restored" | "unloading" | "error" | "disposed";
type USequencePlayerStateVoCO$1 = {
    /**
     * 현재 또는 마지막 확정 시퀀스 ID; null 또는 비어 있지 않은 문자열
     */
    sequenceId?: string | null | undefined;
    /**
     * Player의 관측 단계; 승인한11개 단계 중 하나, 기본empty
     */
    phase?: USequencePlayerPhase$2 | undefined;
    /**
     * 확정 세션 세대; 0이상 안전 정수, 빈 상태0
     */
    generation?: number | undefined;
    /**
     * 전체 상태/이벤트 batch 버전; 0이상 안전 정수, 세션 교체로 되돌아가지 않음
     */
    revision?: number | undefined;
    /**
     * 준비 중인 시퀀스 ID; null 또는 비어 있지 않은 문자열
     */
    pendingSequenceId?: string | null | undefined;
    /**
     * 준비 중인 요청 세대; null 또는0이상 안전 정수
     */
    pendingGeneration?: number | null | undefined;
    /**
     * 마지막 성공 재생 상태; 기존9필드 Snapshot의 독립 사본 또는 null
     */
    playback?: USequencePlaybackSnapshotVo | USequencePlaybackSnapshotVoCO | null | undefined;
    /**
     * 전체 필수 대상 준비 사본; 복합 대상 목록의 독립 사본 또는 null
     */
    readiness?: USequenceReadinessVo | USequenceReadinessVoCO | null | undefined;
    /**
     * 마지막 필수 실패 진단; Issue 데이터 사본 또는 null, 원래 Error 제외
     */
    lastIssue?: USequenceIssueVo | USequenceIssueVoCO$1 | null | undefined;
    /**
     * 기능 ID별 마지막 성공 JSON 상태 사전, 기본{}
     */
    featureStates?: USequenceJsonObject$1 | undefined;
};
type USequencePlaybackDocumentVoCO = {
    /**
     * 저장 형식 GeOnDTSequenceDocument; 기본값 'GeOnDTSequenceDocument'
     */
    format?: string | undefined;
    /**
     * 저장 버전 2.0.0; 기본값 '2.0.0'
     */
    schemaVersion?: string | undefined;
    /**
     * 필수 2.0 정의, null 불가
     */
    sequence: USequenceDefinitionVoCO | USequenceDefinitionVo;
    /**
     * 필수 북마크, null 불가
     */
    bookmark: USequenceBookmarkVoCO | USequenceBookmarkVo;
};
type USequenceBookmarkVoCO = {
    /**
     * 유한 상대 초, 필수
     */
    currentTime: number;
    /**
     * 유한 무차원 배속, 음수·0 허용; 기본값 1
     */
    multiplier?: number | undefined;
    /**
     * 기능 ID별 JSON 객체 사전; 기본값 {}
     */
    featureStates?: USequenceJsonObject$1 | undefined;
};
type USequenceDocumentReadResultVoCO = {
    /**
     * 필수 문서, null 불가
     */
    document: USequencePlaybackDocumentVoCO | USequencePlaybackDocumentVo;
    /**
     * 최종 절대 HTTP(S) 출처 또는 null; 기본값 null
     */
    sourceUrl?: string | null | undefined;
    /**
     * 명시적 절대 HTTP(S) 기준 또는 null; 기본값 null
     */
    baseUrl?: string | null | undefined;
    /**
     * 해석 자료 사본 또는 미실행 null; 기본값 null
     */
    resolvedContents?: readonly (USequenceAssetVo | USequenceAssetVoCO)[] | null | undefined;
};
type USequenceRuntimeRequestVoCO$2 = {
    /**
     * 필수 정의/북마크 문서; 필수·null 불가·전체 독립 복사
     */
    document: USequencePlaybackDocumentVoCO | USequencePlaybackDocumentVo;
    /**
     * 재생/준비 정책의 선택적 덮어쓰기; null이면 북마크 배속·시각, 제공하면Options 사본
     */
    options?: USequencePlaybackOptionsVo | USequencePlaybackOptionsVoCO | null | undefined;
    /**
     * 리더가 해석한 자료 URI 목록; 독립 Asset 목록 또는 null, 완전 일치 검사는 Runtime에서 수행
     */
    resolvedContents?: readonly (USequenceAssetVo | USequenceAssetVoCO)[] | null | undefined;
};
/**
 * 객체 하나의 원본 속성을 보관하는 생성 옵션입니다.
 */
type USequenceObjectPropertyVoCO = {
    /**
     * 자료 식별자
     */
    contentId?: string | undefined;
    /**
     * GUID 키
     */
    objectId?: string | undefined;
    /**
     * 원본 속성 레코드
     */
    record?: USequencePropertyJsonRecord$1 | undefined;
};
/**
 * 원본에서 발견한 필드 경로와 타입을 보관하는 생성 옵션입니다.
 */
type USequencePropertyFieldVoCO = {
    /**
     * 원본 키 순서의 속성 경로
     */
    path?: string[] | undefined;
    /**
     * 속성셋 이름 또는 최상위 필드의 null
     */
    propertySet?: string | null | undefined;
    /**
     * 마지막 키의 필드 이름
     */
    name?: string | undefined;
    /**
     * 발견한 JSON 타입 목록
     */
    valueTypes?: string[] | undefined;
};
/**
 * 객체 속성의 경로, 비교 방식과 비교 값을 지정하는 생성 옵션입니다.
 */
type USequencePropertyRuleVoCO = {
    /**
     * 속성 경로. 속성 자료에서 값을 찾을 때 사용할 키를 순서대로 보관합니다.
     */
    path?: string[] | undefined;
    /**
     * 속성 비교 연산자. equals는 같은 값, in은 목록 포함, exists는 값의 존재 여부를 비교합니다.
     */
    operator?: "equals" | "in" | "exists" | undefined;
    /**
     * 속성 비교 값 목록
     */
    values?: (string | number | boolean)[] | undefined;
    /**
     * 문자열 대소문자 구분 여부
     */
    caseSensitive?: boolean | undefined;
};
/**
 * 조회 범위와 고유 값 및 누락 결과를 보관하는 생성 옵션입니다.
 */
type USequencePropertyStatsVoCO = {
    /**
     * 자료 식별자
     */
    contentId?: string | undefined;
    /**
     * 조회한 원본 속성 경로
     */
    path?: string[] | undefined;
    /**
     * 중복을 제거한 조회 대상 GUID
     */
    scopeObjectIds?: string[] | undefined;
    /**
     * 레코드 누락을 포함한 조회 대상 수
     */
    objectCount?: number | undefined;
    /**
     * 속성 레코드가 없는 GUID
     */
    recordMissingObjectIds?: string[] | undefined;
    /**
     * 속성 경로가 없는 GUID
     */
    propertyMissingObjectIds?: string[] | undefined;
    /**
     * 값이 null인 GUID
     */
    nullObjectIds?: string[] | undefined;
    /**
     * 값이 정확히 빈 문자열인 GUID
     */
    emptyStringObjectIds?: string[] | undefined;
    /**
     * 값이 배열 또는 객체인 GUID
     */
    unsupportedObjectIds?: string[] | undefined;
    /**
     * scalar 고유 값별 조회 결과
     */
    values?: USequencePropertyValueVo[] | undefined;
};
/**
 * 고유 값과 그 값을 가진 객체 식별자를 보관하는 생성 옵션입니다.
 */
type USequencePropertyValueVoCO = {
    /**
     * 원래 값의 scalar 타입
     */
    valueType?: "string" | "number" | "boolean" | undefined;
    /**
     * 타입을 변환하지 않은 고유 값
     */
    value?: string | number | boolean | undefined;
    /**
     * 같은 값을 가진 중복 없는 GUID 목록
     */
    objectIds?: string[] | undefined;
};
/**
 * 부재 목록의 원본 속성 경로 설정입니다.
 */
type USequenceObjectListConfigVoCO = {
    /**
     * 기본 ["Properties","ID 데이터","Level 5"]. 배열을 복사합니다.
     */
    kindPath?: string[] | undefined;
    /**
     * 기본 ["Properties","ID 데이터","Level 6"]. 배열을 복사합니다.
     */
    groupPath?: string[] | undefined;
    /**
     * 기본 ["Tag"]. 누락·null·빈 문자열이면 GUID를 표시합니다.
     */
    idPath?: string[] | undefined;
};
/**
 * 형상 GUID 하나의 목록 표시 데이터입니다.
 */
type USequenceObjectListItemVoCO = {
    /**
     * 자료 식별자입니다.
     */
    contentId?: string | undefined;
    /**
     * 실제 메쉬·속성 연결 GUID입니다.
     */
    objectId?: string | undefined;
    /**
     * 원래 자료형의 종류 값입니다. <br>
     * 누락은 undefined입니다.
     */
    kindValue?: USequencePropertyJsonValue$1 | undefined;
    /**
     * 원래 자료형의 그룹값입니다. <br>
     * 누락은 undefined입니다.
     */
    groupValue?: USequencePropertyJsonValue$1 | undefined;
    /**
     * 표시 ID입니다. <br>
     * 기본 objectId입니다.
     */
    displayId?: string | undefined;
    /**
     * 원본 이름입니다.
     */
    name?: string | undefined;
};
/**
 * 시퀀스의 형상 참조, 객체 그룹, 공정 단계와 조립 이동 구간을 지정하는 생성 옵션입니다.
 */
type USequenceVoCO = {
    /**
     * 시퀀스 파일 형식
     */
    format?: string | undefined;
    /**
     * 시퀀스 계약 버전
     */
    schemaVersion?: string | undefined;
    /**
     * 시퀀스 식별자
     */
    id?: string | undefined;
    /**
     * 자료 유형
     */
    type?: string | undefined;
    /**
     * 자료 설명
     */
    description?: string | undefined;
    /**
     * 검색 키워드
     */
    keywords?: string[] | undefined;
    /**
     * 형상 자료 참조
     */
    content?: USequenceContentVo | USequenceContentVoCO | undefined;
    /**
     * 재생 시간 축
     */
    timeline?: USequenceTimelineVo | USequenceTimelineVoCO | undefined;
    /**
     * 이동 기준점. 위경도 좌표계(EPSG:4326)의 경도·위도(도)와 타원체고(m)를 순서대로 사용합니다.
     */
    offsetOrigin?: [number, number, number] | undefined;
    /**
     * 이동 좌표 기준. 이동 기준점에서 동·북·상 방향을 사용하는 enu 값입니다.
     */
    offsetSpace?: "enu" | undefined;
    /**
     * 이동 거리 단위. 이동 거리는 미터 단위인 m을 사용합니다.
     */
    offsetUnit?: "m" | undefined;
    /**
     * 미분류 객체 표시 정책. visible은 미분류 객체를 표시하고 hidden은 숨기는 정책입니다.
     */
    unassignedPolicy?: "visible" | "hidden" | undefined;
    /**
     * 객체 그룹 목록
     */
    groups?: (USequenceGroupVo | USequenceGroupVoCO)[] | undefined;
    /**
     * 공정 단계 목록
     */
    phases?: (USequencePhaseVo | USequencePhaseVoCO)[] | undefined;
    /**
     * 조립 이동 트랙 목록
     */
    tracks?: (USequenceTrackVo | USequenceTrackVoCO)[] | undefined;
    /**
     * 선택적인 부재별 분리 배치 설정. 생략 시 기존 고정 이동량 유지
     */
    explodeLayout?: USequenceExplodeLayoutVo | USequenceExplodeLayoutVoCO | undefined;
    /**
     * 선택적인 근거리 점층 조립 설정. 생략 시 기존 재생 유지
     */
    progression?: USequenceProgressionVo | USequenceProgressionVoCO | undefined;
};
/**
 * 시퀀스가 제어할 형상 자료와 속성 자료의 참조를 지정하는 생성 옵션입니다.
 */
type USequenceContentVoCO = {
    /**
     * 형상 자료 식별자
     */
    id?: string | undefined;
    /**
     * 형상 파일 형식
     */
    format?: "3dtiles" | "a3f" | undefined;
    /**
     * 형상 자료 URI
     */
    uri?: string | undefined;
    /**
     * 속성 자료 URI
     */
    propertiesUri?: string | null | undefined;
    /**
     * 원본 자료 버전
     */
    revision?: string | undefined;
    /**
     * 객체 식별자 체계
     */
    objectIdType?: string | undefined;
};
/**
 * 같이 이동할 객체의 식별자, 분류 조건과 분리 거리를 지정하는 생성 옵션입니다.
 */
type USequenceGroupVoCO = {
    /**
     * 그룹 식별자
     */
    id?: string | undefined;
    /**
     * 그룹 이름
     */
    name?: string | undefined;
    /**
     * 그룹 설명
     */
    description?: string | undefined;
    /**
     * 속성 분류 조건 목록
     */
    rules?: (USequencePropertyRuleVo | USequencePropertyRuleVoCO)[] | undefined;
    /**
     * 분류 조건 결합 방식. all은 모든 조건을 만족하고 any는 하나 이상의 조건을 만족하는 방식입니다.
     */
    ruleMatch?: "all" | "any" | undefined;
    /**
     * 수동 포함 객체 식별자 목록
     */
    includeObjectIds?: string[] | undefined;
    /**
     * 수동 제외 객체 식별자 목록
     */
    excludeObjectIds?: string[] | undefined;
    /**
     * 확정 객체 식별자 목록. 사용자가 확정한 재생용 객체 식별자 목록입니다.
     */
    objectIds?: string[] | undefined;
    /**
     * 그룹 분리 이동 거리. 분리율이 1일 때 더할 동·북·상 방향의 거리이며 단위는 미터입니다.
     */
    explodeOffset?: [number, number, number] | undefined;
};
/**
 * 공정 단계의 이름과 시작·완료 시각을 지정하는 생성 옵션입니다.
 */
type USequencePhaseVoCO = {
    /**
     * 단계 식별자
     */
    id?: string | undefined;
    /**
     * 단계 이름
     */
    name?: string | undefined;
    /**
     * 단계 시작 시각. 시간 단위는 초입니다.
     */
    startTime?: number | undefined;
    /**
     * 단계 완료 시각. 시간 단위는 초입니다.
     */
    endTime?: number | undefined;
};
/**
 * 객체 그룹이 조립되는 시간 구간과 시작·완료 이동 거리를 지정하는 생성 옵션입니다.
 */
type USequenceTrackVoCO = {
    /**
     * 트랙 식별자
     */
    id?: string | undefined;
    /**
     * 이동 대상 그룹 식별자
     */
    groupId?: string | undefined;
    /**
     * 공정 단계 식별자
     */
    phaseId?: string | undefined;
    /**
     * 이동 시작 시각. 시간 단위는 초입니다.
     */
    startTime?: number | undefined;
    /**
     * 이동 완료 시각. 시작 시각과 같으면 순간 전환이며 시간 단위는 초입니다.
     */
    endTime?: number | undefined;
    /**
     * 시작 이동 거리. 원래 배치로부터 동·북·상 방향으로 이동할 거리이며 단위는 미터입니다.
     */
    fromOffset?: [number, number, number] | undefined;
    /**
     * 완료 이동 거리. 원래 배치로부터 동·북·상 방향으로 이동할 거리이며 단위는 미터입니다.
     */
    toOffset?: [number, number, number] | undefined;
    /**
     * 이동 보간 방식. linear는 일정한 변화율, smoothstep은 시작과 끝을 완만하게 만드는 보간 방식입니다.
     */
    easing?: "linear" | "smoothstep" | undefined;
};
/**
 * 부재별 근거리 점층 조립의 공개 생성 옵션입니다.
 */
type USequenceProgressionVoCO = {
    /**
     * 부재별 점층 조립 사용 여부
     */
    enabled?: boolean | undefined;
    /**
     * nearToFar는 최초 카메라 거리순, bottomToTop은 단계 안의 낮은 부재 우선
     */
    orderMode?: "nearToFar" | "bottomToTop" | undefined;
    /**
     * GeOnDT 렌더 월드 좌표의 고정 기준점. null이면 최초 재생·시간 이동 시 확정
     */
    referencePosition?: [number, number, number] | null | undefined;
    /**
     * 등장 시점 분산 비율 0~1
     */
    spreadRatio?: number | undefined;
    /**
     * 부재 조립 시간(초), 양의 유한 값
     */
    itemDuration?: number | undefined;
};
/**
 * 부재별 자동 분리 배치의 공개 생성 옵션입니다.
 */
type USequenceExplodeLayoutVoCO = {
    /**
     * 자동 분리 배치 사용 여부
     */
    enabled?: boolean | undefined;
    /**
     * 기준 배치를 계산할 양의 유한 여유 간격(m). 실제 이동은 기준 거리의 20%이므로 완전 이격을 보장하지 않습니다.
     */
    gap?: number | undefined;
};
/**
 * 현재 재생 상태를 전달하는 독립 값의 생성 옵션입니다.
 */
type USequencePlaybackStateVoCO = {
    /**
     * 시퀀스 식별자
     */
    sequenceId?: string | undefined;
    /**
     * 연결 자료 식별자
     */
    contentId?: string | undefined;
    /**
     * 재생 시작 상대 초
     */
    startTime?: number | undefined;
    /**
     * 재생 종료 상대 초
     */
    endTime?: number | undefined;
    /**
     * 현재 상대 초
     */
    currentTime?: number | undefined;
    /**
     * 유한 배속. 음수는 역방향이며 0은 정지
     */
    multiplier?: number | undefined;
    /**
     * Clock의 실제 시간 진행 가능 여부
     */
    playing?: boolean | undefined;
    /**
     * X·Y·Z 축별 분리율 0~1. null이면 기존 전역 분리율을 사용하며 배열은 복사합니다.
     */
    explodeAxisRatios?: number[] | null | undefined;
    /**
     * 현재 분리율 0~1
     */
    explodeRatio?: number | undefined;
};
/**
 * USequenceFrameStateVo의 결과 보관 생성 옵션입니다.
 */
type USequenceFrameStateVoCO = {
    /**
     * 평가에 사용한 시퀀스 식별자
     */
    sequenceId?: string | undefined;
    /**
     * 평가에 사용한 형상 자료 식별자
     */
    contentId?: string | undefined;
    /**
     * 자동 보정하지 않은 입력 상대 시각(초)
     */
    time?: number | undefined;
    /**
     * 원본 그룹 순서의 그룹별 평가 결과
     */
    groupStates?: USequenceGroupStateVo[] | undefined;
    /**
     * 미분류 정책에 따른 논리 가시성
     */
    unassignedVisible?: boolean | undefined;
    /**
     * X·Y·Z 축별 분리율 0~1. null이면 기존 전역 분리율을 사용하며 배열은 복사합니다.
     */
    explodeAxisRatios?: number[] | null | undefined;
    /**
     * 합산 계산에 사용한 전역 분리율 0~1. 무차원이며 검증은 실행기가 담당합니다.
     */
    explodeRatio?: number | undefined;
};
/**
 * USequenceGroupStateVo의 결과 보관 생성 옵션입니다.
 */
type USequenceGroupStateVoCO = {
    /**
     * 확정 그룹 식별자
     */
    groupId?: string | undefined;
    /**
     * 계산 기준 트랙 ID 또는 트랙 없음 null
     */
    trackId?: string | null | undefined;
    /**
     * 기준 트랙의 단계 ID 또는 트랙 없음 null
     */
    phaseId?: string | null | undefined;
    /**
     * 트랙 없음·대기·이동·유지·완료 상태
     */
    state?: "untracked" | "pending" | "active" | "holding" | "completed" | undefined;
    /**
     * 엔진 표시 조건과 별도로 합성할 논리 가시성
     */
    visible?: boolean | undefined;
    /**
     * 기준 트랙의 0~1 시간 진행률 또는 트랙 없음 null
     */
    progress?: number | null | undefined;
    /**
     * 보간을 반영한 0~1 진행률 또는 트랙 없음 null
     */
    easedProgress?: number | null | undefined;
    /**
     * 원래 배치로부터 동·북·상 순서의 조립 이동량(m)
     */
    assemblyOffset?: [number, number, number] | undefined;
    /**
     * 분리율을 적용한 동·북·상 이동량(m). 기본값 [0,0,0]이며 배열을 복사합니다.
     */
    separationOffset?: [number, number, number] | undefined;
    /**
     * 조립+분리 최종 ENU 이동량(m). null이면 기존 assemblyOffset을 사용하고 배열은 복사합니다.
     */
    totalOffset?: [number, number, number] | null | undefined;
};
/**
 * 전체 시공·분리 구간의 이동 범위 생성 옵션입니다.
 */
type USequenceOffsetBoundsVoCO = {
    /**
     * 확정 시퀀스 식별자
     */
    sequenceId?: string | undefined;
    /**
     * 연결 자료 식별자
     */
    contentId?: string | undefined;
    /**
     * 동·북·상 최소 이동량(m). 기본 [0,0,0], 배열 복사
     */
    enuMin?: [number, number, number] | undefined;
    /**
     * 동·북·상 최대 이동량(m). 기본 [0,0,0], 배열 복사
     */
    enuMax?: [number, number, number] | undefined;
    /**
     * 현재 메쉬 적용기 월드 X/Y/Z 최소 이동량. 기본 [0,0,0], 배열 복사
     */
    worldMin?: [number, number, number] | undefined;
    /**
     * 현재 메쉬 적용기 월드 X/Y/Z 최대 이동량. 기본 [0,0,0], 배열 복사
     */
    worldMax?: [number, number, number] | undefined;
};
/**
 * 투명도 패널의 독립 상태 생성 옵션입니다.
 */
type USequenceOpacityStateVoCO = {
    /**
     * 레이어 불투명도 0~1. 무차원이며 1은 원래 재질, 0은 완전 투명입니다.
     */
    opacity?: number | undefined;
};
/**
 * 시퀀스 설정 파일과 재생 위치를 보관하는 생성 옵션입니다.
 */
type USequenceDocumentVoCO = {
    /**
     * 저장 문서 형식
     */
    format?: string | undefined;
    /**
     * 저장 문서 버전
     */
    schemaVersion?: string | undefined;
    /**
     * 중첩 복사할 확정 시퀀스. 완성 문서에는 필수입니다.
     */
    sequence?: USequenceVo | USequenceVoCO | null | undefined;
    /**
     * 현재 상대 초. create에서 null을 시퀀스 시작 시각으로 지정합니다.
     */
    currentTime?: number | null | undefined;
    /**
     * 유한 배속. 음수는 역방향이며 0을 허용합니다.
     */
    multiplier?: number | undefined;
    /**
     * X·Y·Z 축별 분리율 0~1. null이면 기존 전역 분리율을 사용하며 배열은 복사합니다.
     */
    explodeAxisRatios?: number[] | null | undefined;
    /**
     * 분리율 0~1
     */
    explodeRatio?: number | undefined;
};
/**
 * 형상 연결과 전체 GUID 범위의 순수 설정입니다.
 */
type USequenceSourceVoCO = {
    /**
     * 복사할 자료 식별·주소·버전
     */
    content?: object | USequenceContentVo | null | undefined;
    /**
     * 같은 revision의 전체 형상 GUID. 속성 전체 키 또는 현재 메쉬 목록으로 대체하지 않음
     */
    objectIds?: string[] | undefined;
    /**
     * 초기 문서의 HTTP(S) 절대 또는 baseUrl 기준 상대 URI
     */
    sequenceUri?: string | null | undefined;
    /**
     * 상대 URI를 해석할 명시적 HTTP(S) 절대 기준 URL
     */
    baseUrl?: string | null | undefined;
};
type USequenceConstructionConfigVoCO$1 = {
    legacySequence: USequenceVo | USequenceVoCO;
};
/**
 * 메쉬 한 조각의 자료 식별자·GUID·배치 번호와 기준 자세를 보관하는 생성 옵션입니다.
 */
type USequenceMeshBindingVoCO = {
    /**
     * 연결한 자료 식별자
     */
    contentId?: string | undefined;
    /**
     * IFC GlobalId인 객체 식별자
     */
    objectId?: string | undefined;
    /**
     * 메쉬가 사용하는 단일 배치 번호
     */
    batchId?: number | undefined;
    /**
     * 진단에 사용할 원본 콘텐츠 주소
     */
    sourceUri?: string | null | undefined;
    /**
     * 기존 레이어가 소유한 메쉬 참조
     */
    mesh?: Mesh<BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>, Material<MaterialEventMap> | Material<MaterialEventMap>[], Object3DEventMap> | null | undefined;
    /**
     * 최종 배치 후 저장한 기준 자세
     */
    basePose?: USequenceMeshPoseVo | undefined;
    /**
     * 연결 목록의 등록 상태
     */
    state?: "active" | "inactive" | undefined;
};
/**
 * 메쉬의 기준 위치·회전·배율·행렬과 표시 설정을 보관하는 생성 옵션입니다.
 */
type USequenceMeshPoseVoCO = {
    /**
     * 기준 자세를 저장할 때의 직접 부모
     */
    parent?: Object3D<Object3DEventMap> | null | undefined;
    /**
     * 부모 기준의 원래 위치 x,y,z
     */
    position?: number[] | undefined;
    /**
     * 원래 회전 x,y,z,w
     */
    quaternion?: number[] | undefined;
    /**
     * 원래 배율 x,y,z
     */
    scale?: number[] | undefined;
    /**
     * Three.js elements 순서의 원래 로컬 행렬
     */
    localMatrix?: number[] | undefined;
    /**
     * 부모 변환을 포함한 원래 월드 행렬
     */
    worldMatrix?: number[] | undefined;
    /**
     * 원래 메쉬 표시 값
     */
    visible?: boolean | undefined;
    /**
     * 원래 로컬 행렬 자동 갱신 설정
     */
    matrixAutoUpdate?: boolean | undefined;
    /**
     * 원래 월드 행렬 자동 갱신 설정
     */
    matrixWorldAutoUpdate?: boolean | undefined;
};
/**
 * 검증한 메쉬 변환 계획의 생성 옵션입니다.
 */
type USequenceMeshTransformVoCO = {
    /**
     * 연결 VO와 기준 숫자 배열은 복사하고 mesh·parent는 엔진 소유 참조를 빌립니다.
     */
    binding?: USequenceMeshBindingVo | undefined;
    /**
     * 확정 그룹 ID. 미분류는 null이며 관계 검증은 실행기가 수행합니다.
     */
    groupId?: string | null | undefined;
    /**
     * 엔진 월드 단위의 동·북·상 이동량. 기본값은 [0,0,0]이며 입력 배열을 복사합니다.
     */
    worldOffset?: [number, number, number] | undefined;
    /**
     * 부모 좌표 단위의 로컬 이동량. 기본값은 [0,0,0]이며 입력 배열을 복사합니다.
     */
    localOffset?: [number, number, number] | undefined;
    /**
     * Three.js elements 순서의 최종 로컬 행렬 16개. 기본값은 단위 행렬이며 입력 배열을 복사합니다.
     */
    localMatrix?: number[] | undefined;
};
/**
 * 한 활성 메쉬의 표시 계획 생성 옵션입니다.
 */
type USequenceMeshVisibilityVoCO = {
    /**
     * 연결 VO와 기준 숫자 배열은 복사하고 mesh·parent는 엔진 참조를 빌립니다.
     */
    binding?: USequenceMeshBindingVo | undefined;
    /**
     * 확정 그룹 ID이며 미분류는 null입니다.
     */
    groupId?: string | null | undefined;
    /**
     * 시퀀스와 독립적으로 조회한 기준 표시 조건입니다.
     */
    baseVisible?: boolean | undefined;
    /**
     * 해당 그룹의 현재 논리 표시 또는 미분류 정책입니다.
     */
    sequenceVisible?: boolean | undefined;
    /**
     * 두 조건을 AND한 mesh.visible 값입니다. 부모 표시·카메라 등 최종 렌더 판정은 포함하지 않습니다.
     */
    visible?: boolean | undefined;
};
/**
 * 그룹 후보와 객체별 근거·충돌·미분류·확정 가능 여부를 보관하는 생성 옵션입니다.
 */
type USequenceGroupClassificationVoCO = {
    /**
     * 분류에 사용한 속성 자료 ID
     */
    contentId?: string | undefined;
    /**
     * 중복을 제거한 전체 형상 GUID 범위
     */
    scopeObjectIds?: string[] | undefined;
    /**
     * 후보 objectIds가 담긴 그룹 복사본
     */
    candidateGroups?: USequenceGroupVo[] | undefined;
    /**
     * 조회 범위의 GUID별 배정 근거와 상태
     */
    assignments?: USequenceObjectAssignmentVo[] | undefined;
    /**
     * 그룹 후보가 없는 GUID
     */
    unassignedObjectIds?: string[] | undefined;
    /**
     * 둘 이상의 그룹 후보에 포함된 GUID
     */
    conflictObjectIds?: string[] | undefined;
    /**
     * 속성 레코드가 없는 형상 GUID
     */
    metadataMissingObjectIds?: string[] | undefined;
    /**
     * 범위 밖 수동 포함·제외 참조
     */
    referenceIssues?: USequenceGroupReferenceIssueVo[] | undefined;
    /**
     * 충돌·범위 밖 참조가 없어 확정할 수 있는 여부
     */
    ready?: boolean | undefined;
};
/**
 * 그룹 편집 상태의 생성 옵션입니다.
 */
type USequenceGroupEditVoCO = {
    /**
     * 편집 대상 자료 식별자
     */
    contentId?: string | undefined;
    /**
     * 전체 형상 GUID 범위
     */
    scopeObjectIds?: string[] | undefined;
    /**
     * 원본과 독립적인 편집 그룹 목록
     */
    groups?: USequenceGroupVo[] | undefined;
    /**
     * 현재 편집하는 그룹 ID 또는 미선택 null
     */
    activeGroupId?: string | null | undefined;
    /**
     * 미로드 객체를 포함한 현재 선택 GUID 목록
     */
    selectedObjectIds?: string[] | undefined;
    /**
     * 최신 분류 결과 또는 무효화된 null
     */
    classification?: USequenceGroupClassificationVo | null | undefined;
    /**
     * 시작 상태 이후 그룹 편집 변경 여부
     */
    dirty?: boolean | undefined;
};
/**
 * 그룹의 수동 포함·제외에서 범위 밖 GUID 참조를 보관하는 생성 옵션입니다.
 */
type USequenceGroupReferenceIssueVoCO = {
    /**
     * 문제가 있는 그룹 ID
     */
    groupId?: string | undefined;
    /**
     * 범위 밖 참조가 있는 원본 필드
     */
    sourceField?: "includeObjectIds" | "excludeObjectIds" | undefined;
    /**
     * 전체 형상 범위 밖을 가리킨 GUID
     */
    objectId?: string | undefined;
};
/**
 * GUID 하나의 후보 그룹과 배정 근거·상태를 보관하는 생성 옵션입니다.
 */
type USequenceObjectAssignmentVoCO = {
    /**
     * 형상 GUID
     */
    objectId?: string | undefined;
    /**
     * 그룹별 제외를 적용한 최종 후보 그룹 ID
     */
    candidateGroupIds?: string[] | undefined;
    /**
     * 수동 제외 전 조건을 만족한 그룹 ID
     */
    ruleGroupIds?: string[] | undefined;
    /**
     * 수동 포함을 명시한 그룹 ID
     */
    manualGroupIds?: string[] | undefined;
    /**
     * 수동 제외를 명시한 그룹 ID
     */
    excludedGroupIds?: string[] | undefined;
    /**
     * 후보 수에 따른 배정 상태
     */
    state?: "assigned" | "unassigned" | "conflict" | undefined;
    /**
     * 단일 배정 그룹 ID 또는 미분류·충돌의 null
     */
    groupId?: string | null | undefined;
};

/**
 * Player의 모든 명령이 이 경로를 공유하며 시간 계산은 기존 PlaybackExecutor, 채널 계산은 기존 평가기에 위임합니다.
 */
declare class USequenceRuntimeManager {
    /**
     * USequenceRuntimeManager 클래스 생성자입니다. <br>
     * 등록/포트 설정을 독립 보관하며 실행 자원 취득은 시작하지 않습니다.
     *
     * @param {import('./sequencePlayerRuntime.js').USequenceRuntimeManagerCO} [opt={}] 복사할 registry와 빌린 포트, 준비/타이머 예약 없음
     */
    constructor(opt?: USequenceRuntimeManagerCO$1);
    /** @type {Required<USequenceRuntimeManagerCO>} */ _config: Required<USequenceRuntimeManagerCO$1>;
    /** @type {any} */ _active: any;
    /** @type {any} */ _candidate: any;
    /**
     * @type {Set<any>}
     */ _entries: Set<any>;
    /**
     * @type {WeakSet<object>}
     */ _issuedPorts: WeakSet<object>;
    /**
     * @type {WeakSet<object>}
     */ _issuedFeatures: WeakSet<object>;
    /**
     * @type {Set<any>}
     */ _cleanup: Set<any>;
    /** @type {Set<USequencePlayerListener>} */ _listeners: Set<USequencePlayerListener>;
    /** @type {Set<()=>void>} */ _waiters: Set<() => void>;
    /**
     * @type {Set<any>}
     */ _timers: Set<any>;
    _generation: number;
    _revision: number;
    _working: boolean;
    _notifying: boolean;
    _disposed: boolean;
    /** @type {Promise<void>|null} */ _transition: Promise<void> | null;
    /** @type {Promise<void>|null} */ _disposeWork: Promise<void> | null;
    /** @type {Promise<void>|null} */ _barrier: Promise<void> | null;
    /** @type {USequencePlayerPhase} */ _phase: USequencePlayerPhase$1;
    /**
     * @type {import('../vo/sequenceDefinitionVos.js').USequenceIssueVo | null}
     */ _lastIssue: USequenceIssueVo | null;
    /**
     * @type {import('../vo/sequenceDefinitionVos.js').USequencePlayerStateVo}
     */ _lastState: USequencePlayerStateVo;
    /** @type {USequenceRuntimeTimerPort|null} */ _timer: USequenceRuntimeTimerPort | null;
    /** @type {number|null} */ _clockLast: number | null;
    _wakeQueued: boolean;
    /**
     * 마지막 관측 상태를 중첩 VO까지 독립 복사하여 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequencePlayerStateVo} 현재 확정/후보 데이터의 독립 사본
     */
    getState(): USequencePlayerStateVo;
    /**
     * 동기 상태 수신자를 등록하고 해당 구독만 해제하는 멱등 함수를 반환합니다.
     *
     * @param {import('./sequencePlayerRuntime.js').USequencePlayerListener} listener 빌린 동기 수신자, 자기 상태/대상 사본을 받음
     * @returns {function():void} 멱등 해제
     */
    subscribe(listener: USequencePlayerListener): () => void;
    /**
     * 요청/URI/컴파일을 검증한 뒤 준비·재사용·readiness·전체 transaction·교체/정리를 완료합니다.
     *
     * @param {import('./sequencePlayerRuntime.js').USequenceRuntimeRequestVoCO | import('../vo/sequenceDefinitionVos.js').USequenceRuntimeRequestVo} request 문서/옵션/해석 URI, 원문 변경 없음
     * @param {import('./sequencePlayerRuntime.js').USequenceRuntimeLoadOptions} [opt={}] 외부 Signal, 확정 전까지만 효력
     * @returns {Promise<void>} 최신 후보의 준비/정리 완료
     */
    load(request: USequenceRuntimeRequestVoCO$1 | USequenceRuntimeRequestVo, opt?: USequenceRuntimeLoadOptions): Promise<void>;
    /**
     * 기존 Playback의 재생 의도를 켜고 수동 모드에서는 외부 update를 기다립니다.
     */
    play(): void;
    /**
     * 기존 Playback의 경과를 정산하고 자기 구동을 일시정지합니다.
     */
    pause(): void;
    /**
     * 요청 시각을 범위 안으로 제한해 전체 프레임을 적용하고 일시정지합니다.
     *
     * @param {number} time 유한 절대 상대 초, 범위로 clamp, 성공 시 paused
     */
    seek(time: number): void;
    /**
     * 수동 모드의 절대 상대 시각을 적용하며 자동 구동 중 이중 시간 갱신은 거부합니다.
     *
     * @param {number} time 유한 절대 상대 초, manual만 허용, 배속/loop 중복 계산 없음
     */
    update(time: number): void;
    /**
     * 기존 배속의 경과를 정산한 뒤 음수와 0을 포함한 새 배속을 설정합니다.
     *
     * @param {number} value 유한 무차원 배속, 음수/0 허용
     */
    setMultiplier(value: number): void;
    /**
     * 현재 경과를 정산한 뒤 기존 Playback의 반복 정책을 바꿉니다.
     *
     * @param {boolean} value 반복 여부
     */
    setLoop(value: boolean): void;
    /**
     * 원래 정의와 마지막 성공 시각·배속을 새 문서로 복사하며 파일 IO는 실행하지 않습니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequencePlaybackDocumentVo} 현재 정의/마지막 성공 북마크의 독립 사본, IO 없음
     */
    exportDocument(): USequencePlaybackDocumentVo;
    /**
     * 기준 자세를 복원하고 일시정지하며 같은 준비 연결을 다음 명령에 재사용합니다.
     *
     * @returns {Promise<void>} 같은 연결의 기준 자세 복원·남은 정리 재시도
     */
    restore(): Promise<void>;
    /**
     * 세션과 소유 연결을 해제하고 설정·수신자를 유지하여 다음 load를 허용합니다.
     *
     * @returns {Promise<void>} 세션 자원 해제; 설정/구독자는 유지해 다음 load 허용
     */
    unload(): Promise<void>;
    /**
     * 새 적용을 차단하고 소유 자원만 정리하며 실패 후에는 남은 정리를 재시도합니다.
     *
     * @returns {Promise<void>} 즉시 명령 차단 후 자기 자원 정리; 실패 후 반복 재시도
     */
    dispose(): Promise<void>;
    /**
     * 기능 상태를 먼저 검사하고 기존 경과 정산 뒤 전체 프레임 성공일 때만 교체합니다.
     *
     * @param {string} featureId 비어 있지 않은 현재 기능 ID
     * @param {import('../core/sequenceData.js').USequenceJsonObject} state 교체 상태, 전체 교체 사본
     */
    setFeatureState(featureId: string, state: USequenceJsonObject): void;
    /**
     * Feature 포트 identity 기록의 직접 교체를 거부합니다.
     *
     * @param {void} value 대입 요청, 항상 거부
     */
    set issuedFeatures(value: void);
    /**
     * Feature 포트 identity 기록은 외부에 노출하지 않습니다.
     */
    get issuedFeatures(): void;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {{ adapterFactories: Map<string, import('./sequencePlayerRuntime.js').USequenceAssetAdapterFactory>; featureFactories: Map<string, import('./sequencePlayerRuntime.js').USequenceFeatureFactory>; coordinatePort: import('./sequencePlayerRuntime.js').USequenceCoordinatePort | null; resourceResolver: import('./sequencePlayerRuntime.js').USequenceResourceResolverPort | null; timeSource: import('./sequencePlayerRuntime.js').USequenceTimeSourcePort | null; scheduler: import('./sequencePlayerRuntime.js').USequenceSchedulerPort | null; timerPort: import('./sequencePlayerRuntime.js').USequenceRuntimeTimerPort | null; cleanupTimeoutSeconds: number; onError: null | function(unknown, import('../vo/sequenceDefinitionVos.js').USequenceIssueVo):void; }} value 등록Map 사본과 빌린 설정 포트의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set config(value: {
        adapterFactories: Map<string, USequenceAssetAdapterFactory>;
        featureFactories: Map<string, USequenceFeatureFactory$1>;
        coordinatePort: USequenceCoordinatePort | null;
        resourceResolver: USequenceResourceResolverPort | null;
        timeSource: USequenceTimeSourcePort | null;
        scheduler: USequenceSchedulerPort | null;
        timerPort: USequenceRuntimeTimerPort | null;
        cleanupTimeoutSeconds: number;
        onError: null | ((arg0: unknown, arg1: USequenceIssueVo) => void);
    });
    /**
     * 등록Map 사본과 빌린 설정 포트를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {{ adapterFactories: Map<string, import('./sequencePlayerRuntime.js').USequenceAssetAdapterFactory>; featureFactories: Map<string, import('./sequencePlayerRuntime.js').USequenceFeatureFactory>; coordinatePort: import('./sequencePlayerRuntime.js').USequenceCoordinatePort | null; resourceResolver: import('./sequencePlayerRuntime.js').USequenceResourceResolverPort | null; timeSource: import('./sequencePlayerRuntime.js').USequenceTimeSourcePort | null; scheduler: import('./sequencePlayerRuntime.js').USequenceSchedulerPort | null; timerPort: import('./sequencePlayerRuntime.js').USequenceRuntimeTimerPort | null; cleanupTimeoutSeconds: number; onError: null | function(unknown, import('../vo/sequenceDefinitionVos.js').USequenceIssueVo):void; }} 등록Map 사본과 빌린 설정 포트를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get config(): {
        adapterFactories: Map<string, USequenceAssetAdapterFactory>;
        featureFactories: Map<string, USequenceFeatureFactory$1>;
        coordinatePort: USequenceCoordinatePort | null;
        resourceResolver: USequenceResourceResolverPort | null;
        timeSource: USequenceTimeSourcePort | null;
        scheduler: USequenceSchedulerPort | null;
        timerPort: USequenceRuntimeTimerPort | null;
        cleanupTimeoutSeconds: number;
        onError: null | ((arg0: unknown, arg1: USequenceIssueVo) => void);
    };
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePlayerStateVo | null} value 확정 연결을 노출하지 않는 상태 사본의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set active(value: USequencePlayerStateVo | null);
    /**
     * 확정 연결을 노출하지 않는 상태 사본을 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequencePlayerStateVo | null} 확정 연결을 노출하지 않는 상태 사본을 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get active(): USequencePlayerStateVo | null;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePlayerStateVo | null} value 후보 연결을 노출하지 않는 상태 사본의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set candidate(value: USequencePlayerStateVo | null);
    /**
     * 후보 연결을 노출하지 않는 상태 사본을 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequencePlayerStateVo | null} 후보 연결을 노출하지 않는 상태 사본을 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get candidate(): USequencePlayerStateVo | null;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {number} value 소유 연결 수의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set entries(value: number);
    /**
     * 소유 연결 수를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {number} 소유 연결 수를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get entries(): number;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {void} value 포트 identity 기록은 외부에 노출하지 않음의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set issuedPorts(value: void);
    /**
     * 포트 identity 기록은 외부에 노출하지 않음를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get issuedPorts(): void;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {number} value 남아 있는 정리 작업 수의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set cleanup(value: number);
    /**
     * 남아 있는 정리 작업 수를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {number} 남아 있는 정리 작업 수를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get cleanup(): number;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {number} value 등록한 수신자 수의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set listeners(value: number);
    /**
     * 등록한 수신자 수를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {number} 등록한 수신자 수를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get listeners(): number;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {number} value 자기 준비/정리 대기 수의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set waiters(value: number);
    /**
     * 자기 준비/정리 대기 수를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {number} 자기 준비/정리 대기 수를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get waiters(): number;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {number} value 자기 timer 예약 수의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set timers(value: number);
    /**
     * 자기 timer 예약 수를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {number} 자기 timer 예약 수를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get timers(): number;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {number} value 발급한 안전 정수 요청 세대의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set generation(value: number);
    /**
     * 발급한 안전 정수 요청 세대를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {number} 발급한 안전 정수 요청 세대를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get generation(): number;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {number} value 전역 관측 버전의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set revision(value: number);
    /**
     * 전역 관측 버전를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {number} 전역 관측 버전를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get revision(): number;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {boolean} value 동기 작업 진입 여부의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set working(value: boolean);
    /**
     * 동기 작업 진입 여부를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {boolean} 동기 작업 진입 여부를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get working(): boolean;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {boolean} value 동기 통지 여부의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set notifying(value: boolean);
    /**
     * 동기 통지 여부를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {boolean} 동기 통지 여부를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get notifying(): boolean;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {boolean} value 종료 의도 여부의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set disposed(value: boolean);
    /**
     * 종료 의도 여부를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {boolean} 종료 의도 여부를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get disposed(): boolean;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {boolean} value 복원/비종료 해제 작업 여부의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set transition(value: boolean);
    /**
     * 복원/비종료 해제 작업 여부를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {boolean} 복원/비종료 해제 작업 여부를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get transition(): boolean;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {boolean} value 진행 중인 종료 정리 여부의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set disposeWork(value: boolean);
    /**
     * 진행 중인 종료 정리 여부를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {boolean} 진행 중인 종료 정리 여부를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get disposeWork(): boolean;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {boolean} value 확정 후 정리 장벽 여부의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set barrier(value: boolean);
    /**
     * 확정 후 정리 장벽 여부를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {boolean} 확정 후 정리 장벽 여부를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get barrier(): boolean;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos').USequencePlayerPhase} value 내부 관측 단계의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set phase(value: USequencePlayerPhase$2);
    /**
     * 내부 관측 단계를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos').USequencePlayerPhase} 내부 관측 단계를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get phase(): USequencePlayerPhase$2;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceIssueVo | null} value 필수 오류의 독립 진단 사본의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set lastIssue(value: USequenceIssueVo | null);
    /**
     * 필수 오류의 독립 진단 사본을 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceIssueVo | null} 필수 오류의 독립 진단 사본을 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get lastIssue(): USequenceIssueVo | null;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePlayerStateVo} value 마지막 관측 상태 사본의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set lastState(value: USequencePlayerStateVo);
    /**
     * 마지막 관측 상태 사본을 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequencePlayerStateVo} 마지막 관측 상태 사본을 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get lastState(): USequencePlayerStateVo;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {import('./sequencePlayerRuntime.js').USequenceRuntimeTimerPort | null} value 빌린 timer 포트 또는 기본 선택 null의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set timer(value: USequenceRuntimeTimerPort | null);
    /**
     * 빌린 timer 포트 또는 기본 선택 null을 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {import('./sequencePlayerRuntime.js').USequenceRuntimeTimerPort | null} 빌린 timer 포트 또는 기본 선택 null을 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get timer(): USequenceRuntimeTimerPort | null;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {number | null} value 마지막 확인한 단조 초 또는 null의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set clockLast(value: number | null);
    /**
     * 마지막 확인한 단조 초 또는 null을 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {number | null} 마지막 확인한 단조 초 또는 null을 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get clockLast(): number | null;
    /**
     * 연결/수명 상태의 직접 교체를 거부하고 공개 명령만 사용하게 합니다.
     *
     * @param {boolean} value 안전 경계의 대기 통지 예약 여부의 직접 대입 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set wakeQueued(value: boolean);
    /**
     * 안전 경계의 대기 통지 예약 여부를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     *
     * @returns {boolean} 안전 경계의 대기 통지 예약 여부를 조회합니다. <br>
     * native 자원·정리 토큰은 반환하지 않습니다.
     */
    get wakeQueued(): boolean;
    #private;
}
/**
 * @typedef {import('../core/sequenceData.js').USequenceAssetAdapterPort} USequenceAssetAdapterPort
 * @typedef {import('../core/sequenceData.js').USequenceAdapterPrepareContext} USequenceAdapterPrepareContext
 * @typedef {import('../core/sequenceData.js').USequenceAbortSignalPort} USequenceAbortSignalPort
 * @typedef {import('../core/sequenceData.js').USequenceCoordinatePort} USequenceCoordinatePort
 * @typedef {import('../core/sequenceData.js').USequenceResourceResolverPort} USequenceResourceResolverPort
 * @typedef {import("../core/sequenceData.js").USequenceTimeSourcePort} USequenceTimeSourcePort
 * @typedef {import("../core/sequenceData.js").USequenceSchedulerPort} USequenceSchedulerPort
 * @typedef {import('../vo/sequenceDefinitionVos.js').USequenceRuntimeRequestVoCO} USequenceRuntimeRequestVoCO
 * @typedef {import('../vo/sequenceDefinitionVos.js').USequencePlayerPhase} USequencePlayerPhase
 * @typedef {function(import('../vo/sequenceDefinitionVos.js').USequenceAssetVo, USequenceAdapterPrepareContext):USequenceAssetAdapterPort} USequenceAssetAdapterFactory
 * @typedef {'statuschange' | 'timechange' | 'readinesschange' | 'featurechange' | 'targetadded' | 'targetremoved' | 'error'} USequencePlayerEventType
 * @typedef {function(USequencePlayerEventType, import('../vo/sequenceDefinitionVos.js').USequencePlayerStateVo, Array<import('../vo/sequenceDefinitionVos.js').USequenceTargetVo>):void} USequencePlayerListener
 * @typedef {{ nowSeconds: function():number; setTimeout: function(function():void, number):unknown; clearTimeout: function(unknown):void; }} USequenceRuntimeTimerPort
 * @typedef {Partial<{ signal: USequenceAbortSignalPort | null; }>} USequenceRuntimeLoadOptions
 * @typedef {object} USequenceRuntimeManagerCO
 * @property {ReadonlyMap<string, USequenceAssetAdapterFactory>} [adapterFactories] 복사할 동기 factory 등록, 기본 빈 Map
 * @property {ReadonlyMap<string, USequenceFeatureFactory>} [featureFactories] kind별 동기 Feature 생성 등록 사본, 기본 빈 Map
 * @property {USequenceCoordinatePort | null} [coordinatePort] 빌린 좌표 포트, 기본null
 * @property {USequenceResourceResolverPort | null} [resourceResolver] 빌린 URI/자원 해석 포트, 기본null
 * @property {USequenceTimeSourcePort | null} [timeSource] 자동 모드 시간 포트, 기본null
 * @property {USequenceSchedulerPort | null} [scheduler] 자동 구동 구독 포트, 기본null/manual
 * @property {USequenceRuntimeTimerPort | null} [timerPort] 대기/정리 타이머, 기본null이면 플랫폼 지연 생성
 * @property {number} [cleanupTimeoutSeconds] 유한0이상 정리 대기 초, 기본30
 * @property {null | function(unknown, import('../vo/sequenceDefinitionVos.js').USequenceIssueVo):void} [onError] 비예외 동기 진단, 기본null
 */
/**
 * @typedef {function(import('../vo/sequenceDefinitionVos.js').USequenceFeatureVo, import('../vo/sequenceDefinitionVos.js').USequenceDefinitionVo):import('../core/sequenceData.js').USequenceFeaturePort} USequenceFeatureFactory
 */
/**
 * 생성 옵션으로 한 RuntimeManager를 만들고 문서 load·재생·이동·복원·해제를 같은 세션에 위임하는 공개 창구입니다.
 */
declare class USequencePlayer {
    /**
     * USequencePlayer 클래스 생성자입니다. <br>
     * 한 Manager만 소유하며 준비·루프·IO·장면 쓰기를 시작하지 않습니다.
     *
     * @param {import('./sequencePlayerRuntime.js').USequencePlayerCO} [opt={}] 복사할 등록과 빌린 포트, registry 사본·포트는 빌림
     */
    constructor(opt?: USequencePlayerCO$1);
    /** @type {USequenceRuntimeManager} */ _runtime: USequenceRuntimeManager;
    /**
     * 최신 후보 준비와 active 교체를 단일 Manager에 위임합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceRuntimeRequestVoCO | import('../vo/sequenceDefinitionVos.js').USequenceRuntimeRequestVo} request 문서·옵션·해석URI 사본, 필수·null불가
     * @param {import('./sequencePlayerRuntime.js').USequenceRuntimeLoadOptions} [opt={}] 확정 전 외부Signal
     * @returns {Promise<void>} 준비/확정/정리 완료
     */
    load(request: USequenceRuntimeRequestVoCO$2 | USequenceRuntimeRequestVo, opt?: USequenceRuntimeLoadOptions): Promise<void>;
    /**
     * 마지막 확정 재생/후보/진단의 독립 사본을 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequencePlayerStateVo} 마지막 확정 재생/후보/진단의 독립 사본
     */
    getState(): USequencePlayerStateVo;
    /**
     * 구독 등록·수신자별 사본·재진입 격리를 Manager에 위임합니다.
     *
     * @param {import('./sequencePlayerRuntime.js').USequencePlayerListener} listener 동기 수신자, 상태/대상 사본 소유권은 수신자에게 전달
     * @returns {function():void} 자기 구독 해제
     */
    subscribe(listener: USequencePlayerListener): () => void;
    /**
     * 단일 기존 시계의 재생 의도를 켭니다. <br>
     * manual은 외부 update를 기다립니다.
     */
    play(): void;
    /**
     * 현재 경과를 정산하고 자기 구동만 정지합니다.
     */
    pause(): void;
    /**
     * 범위로 clamp한 시각을 일시정지 상태로 적용합니다.
     *
     * @param {number} time 유한 상대 초, 유한 절대 시퀀스 상대 초, 범위 밖 clamp
     */
    seek(time: number): void;
    /**
     * manual의 외부 시각을 배속/반복 중복 계산 없이 적용합니다.
     *
     * @param {number} time 유한 상대 초, 유한 절대 상대 초
     */
    update(time: number): void;
    /**
     * 기존 경과를 정산한 뒤 유한 배속을 적용합니다.
     *
     * @param {number} value 새 배속, 무차원 유한 배속, 음수/0 허용
     */
    setMultiplier(value: number): void;
    /**
     * 기존 경과를 정산한 뒤 반복 정책을 바꿉니다.
     *
     * @param {boolean} value 새 반복 여부
     */
    setLoop(value: boolean): void;
    /**
     * 기능 상태 변경과 같은 시각 전체 적용을 단일 Runtime에 위임합니다.
     *
     * @param {string} featureId 현재 정의의 비어 있지 않은 기능 ID
     * @param {import('../core/sequenceData.js').USequenceJsonObject} state 전체 교체 상태, 전체 교체할 상태 사본
     */
    setFeatureState(featureId: string, state: USequenceJsonObject): void;
    /**
     * 연결은 유지하고 기준 자세 복원과 남은 정리를 완료합니다.
     *
     * @returns {Promise<void>} 연결은 유지하고 기준 자세 복원과 남은 정리를 완료합니다.
     */
    restore(): Promise<void>;
    /**
     * 현재 세션을 해제하되 설정/구독자를 유지해 다음 load를 허용합니다.
     *
     * @returns {Promise<void>} 현재 세션을 해제하되 설정/구독자를 유지해 다음 load를 허용합니다.
     */
    unload(): Promise<void>;
    /**
     * 원래 정의와 마지막 성공 북마크의 문서 사본을 반환하며 IO는 하지 않습니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequencePlaybackDocumentVo} 원래 정의와 마지막 성공 북마크의 문서 사본을 반환하며 IO는 하지 않습니다.
     */
    exportDocument(): USequencePlaybackDocumentVo;
    /**
     * 새 명령과 늦은 적용을 차단하고 자기 자원을 정리합니다. <br>
     * 실패 후 반복 호출로 재시도합니다.
     *
     * @returns {Promise<void>} 새 명령과 늦은 적용을 차단하고 자기 자원을 정리합니다.
     */
    dispose(): Promise<void>;
    /**
     * 소유 Manager 교체를 거부합니다.
     *
     * @param {import('./sequencePlayerRuntime.js').USequenceRuntimeManager} value 직접 교체 요청, 항상 거부·입력 변경/소유권 이전 없음
     */
    set runtime(value: USequenceRuntimeManager);
    /**
     * 단일 소유 Manager 참조를 반환합니다. <br>
     * 두 번째 시계/레지스트리를 만들지 않습니다.
     *
     * @returns {import('./sequencePlayerRuntime.js').USequenceRuntimeManager} 단일 소유 Manager 참조
     */
    get runtime(): USequenceRuntimeManager;
}
type USequenceAssetAdapterPort = USequenceAssetAdapterPort$1;
type USequenceAdapterPrepareContext = USequenceAdapterPrepareContext$1;
type USequenceAbortSignalPort = USequenceAbortSignalPort$1;
type USequenceCoordinatePort = USequenceCoordinatePort$1;
type USequenceResourceResolverPort = USequenceResourceResolverPort$1;
type USequenceTimeSourcePort = USequenceTimeSourcePort$1;
type USequenceSchedulerPort = USequenceSchedulerPort$1;
type USequenceRuntimeRequestVoCO$1 = USequenceRuntimeRequestVoCO$2;
type USequencePlayerPhase$1 = USequencePlayerPhase$2;
type USequenceAssetAdapterFactory = (arg0: USequenceAssetVo, arg1: USequenceAdapterPrepareContext) => USequenceAssetAdapterPort;
type USequencePlayerEventType = "statuschange" | "timechange" | "readinesschange" | "featurechange" | "targetadded" | "targetremoved" | "error";
type USequencePlayerListener = (arg0: USequencePlayerEventType, arg1: USequencePlayerStateVo, arg2: Array<USequenceTargetVo>) => void;
type USequenceRuntimeTimerPort = {
    nowSeconds: () => number;
    setTimeout: (arg0: () => void, arg1: number) => unknown;
    clearTimeout: (arg0: unknown) => void;
};
type USequenceRuntimeLoadOptions = Partial<{
    signal: USequenceAbortSignalPort | null;
}>;
type USequenceRuntimeManagerCO$1 = {
    /**
     * 복사할 동기 factory 등록, 기본 빈 Map
     */
    adapterFactories?: ReadonlyMap<string, USequenceAssetAdapterFactory> | undefined;
    /**
     * kind별 동기 Feature 생성 등록 사본, 기본 빈 Map
     */
    featureFactories?: ReadonlyMap<string, USequenceFeatureFactory$1> | undefined;
    /**
     * 빌린 좌표 포트, 기본null
     */
    coordinatePort?: USequenceCoordinatePort$2 | null | undefined;
    /**
     * 빌린 URI/자원 해석 포트, 기본null
     */
    resourceResolver?: USequenceResourceResolverPort$2 | null | undefined;
    /**
     * 자동 모드 시간 포트, 기본null
     */
    timeSource?: USequenceTimeSourcePort$2 | null | undefined;
    /**
     * 자동 구동 구독 포트, 기본null/manual
     */
    scheduler?: USequenceSchedulerPort$2 | null | undefined;
    /**
     * 대기/정리 타이머, 기본null이면 플랫폼 지연 생성
     */
    timerPort?: USequenceRuntimeTimerPort | null | undefined;
    /**
     * 유한0이상 정리 대기 초, 기본30
     */
    cleanupTimeoutSeconds?: number | undefined;
    /**
     * 비예외 동기 진단, 기본null
     */
    onError?: ((arg0: unknown, arg1: USequenceIssueVo) => void) | null | undefined;
};
type USequenceFeatureFactory$1 = (arg0: USequenceFeatureVo, arg1: USequenceDefinitionVo) => USequenceFeaturePort;
type USequencePlayerCO$1 = USequenceRuntimeManagerCO$1;

/**
 * 빌린 Player를 선택 재생·문서 요소와 공통 HTML 표시 위젯에 연결합니다.
 */
declare class USequencePlayerUiHandler {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequencePlayerUiHandler 클래스 생성자입니다. <br>
     * 효과 없이 포트와 요소 종류·소유 문서를 검사하고 미부착 수명을 준비합니다.
     *
     * @param {import('./sequencePlayerUi.js').USequencePlayerUiHandlerCO} opt 빌린 포트와 선택 UI, player 필수, 나머지 기본null/{}/[]
     */
    constructor(opt: USequencePlayerUiHandlerCO$1);
    _config: USequenceUiConfig;
    _mounted: boolean;
    _disposed: boolean;
    _mountGeneration: number;
    /** @type {Array<USequenceUiCleanup>} */ _cleanups: Array<USequenceUiCleanup>;
    /** @type {Set<USequenceUiOperation>} */ _operations: Set<USequenceUiOperation>;
    _documentTicket: number;
    /** @type {number|null} */ _draftGeneration: number | null;
    /** @type {string|null} */ _stateSignature: string | null;
    _notifying: boolean;
    /**
     * @type {import('../../timeline/ui/UTimelineView.js').UTimelineView | null}
     */ _view: UTimelineView | null;
    /** @type {USequenceTimelineAdapter|null} */ _adapter: USequenceTimelineAdapter | null;
    /** @type {Map<HTMLElement,Map<string,USequenceUiProperty>>} */ _properties: Map<HTMLElement, Map<string, USequenceUiProperty>>;
    /** @type {Map<string,typeof URL>} */ _urls: Map<string, typeof URL>;
    /**
     * 자기 이벤트·위젯·구독과 미부착 component만 취득합니다. <br>
     * 부분 실패는 전부 정리하고 재시도 가능한 실패 기록을 유지합니다.
     */
    mount(): void;
    /**
     * 늦은 요청을 차단하고 취득한 자원만 역순 정리합니다. <br>
     * 공통 View의 native 정리에서 재진입하면 현재 종료에 맡기고, 실패한 작업은 다음 외부 호출에 재시도합니다.
     */
    unmount(): void;
    /**
     * 새 부착을 영구 차단하고 자기 자원만 정리합니다. <br>
     * 실패 후 반복 호출도 정리를 재시도합니다.
     */
    dispose(): void;
    /**
     * Player의 공개 상태를 검증한 독립 VO 사본으로 반환합니다. <br>
     * 내부 Runtime에는 접근하지 않습니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequencePlayerStateVo} Player의 공개 상태를 검증한 독립 VO 사본으로 반환합니다.
     */
    getState(): USequencePlayerStateVo;
    /**
     * 기준 세대가 여전히 같은 새 문서만 적용합니다. <br>
     * 이전 자기 요청을 취소하고 자동 재생·자동 unload는 하지 않습니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceRuntimeRequestVoCO | import('../vo/sequenceDefinitionVos.js').USequenceRuntimeRequestVo} request 새 문서 요청, 필수 독립 복사
     * @param {import('./sequencePlayerUi.js').USequenceUiApplyOptions} [opt={}] 기본{}, expectedGeneration 기본 명령 시작의 확정 세대, 0이상 안전 정수
     * @returns {Promise<void>} 기준 세대가 여전히 같은 새 문서만 적용합니다.
     */
    applyDocument(request: USequenceRuntimeRequestVoCO$2 | USequenceRuntimeRequestVo, opt?: USequenceUiApplyOptions$1): Promise<void>;
    /**
     * 주입 Reader로 원문을 검증·해석한 뒤 최신 요청만 load합니다. <br>
     * 읽기 중 세대 변경과 취소 결과는 적용하지 않습니다.
     *
     * @param {string} text JSON 문서 원문, 빈 문자열은 Reader 검증 대상
     * @param {import('./sequencePlayerUi.js').USequenceUiTextOptions} [opt={}] 이름·기준 세대, name 기본null은 표시 이름 없음
     * @returns {Promise<void>} 주입 Reader로 원문을 검증·해석한 뒤 최신 요청만 load합니다.
     */
    applyText(text: string, opt?: USequenceUiTextOptions$1): Promise<void>;
    /**
     * 마지막 확정 문서만 Writer로 직렬화하고 자기 Blob URL·임시 anchor로 저장합니다. <br>
     * 미확정 draft와 외부 URL은 변경하지 않습니다.
     *
     * @param {string} [fileName='sequence.sequence.json'] 저장 이름
     * @returns {Promise<void>} 마지막 확정 문서만 Writer로 직렬화하고 자기 Blob URL·임시 anchor로 저장합니다.
     */
    download(fileName?: string): Promise<void>;
    /**
     * 자기 읽기/적용/저장만 무효화합니다. <br>
     * Runtime 통지 중 취소는 microtask로 보내며 이미 확정한 load를 되돌리지 않습니다.
     */
    cancelPending(): void;
    _mountTimeline(): void;
    _mountComponents(): void;
    _mountControls(): void;
    _subscribe(): void;
    /**
     * 늦은 통지를 차단하고 상태만 표시합니다. <br>
     * 다른 호출자가 바꾼 세대의 자기 IO 취소는 안전 경계로 예약합니다.
     *
     * @param {{ waiting: boolean; early: boolean; }} registration 등록 경계
     * @param {unknown} type Player 이벤트 이름, 명령으로 사용하지 않음
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePlayerStateVoCO | import('../vo/sequenceDefinitionVos.js').USequencePlayerStateVo} state 독립 상태, 독립 복사 후 사용
     */
    _receive(registration: {
        waiting: boolean;
        early: boolean;
    }, type: unknown, state: USequencePlayerStateVoCO$1 | USequencePlayerStateVo): void;
    /**
     * 변경된 상태만 안전한 textContent와 선택 입력에 반영합니다. <br>
     * 사용자가 입력 중인 문서·숫자는 보존합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePlayerStateVo} state 독립 상태, 읽기 전용 확정/후보 상태 사본
     */
    _render(state: USequencePlayerStateVo): void;
    /**
     * 포커스 밖의 숫자와 반복 표시만 갱신하며 입력 중 값은 유지합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePlaybackSnapshotVo} playback 최근 성공 시각, 상대 초/무차원 배속/반복 사본
     */
    _renderPlayback(playback: USequencePlaybackSnapshotVo): void;
    /**
     * 선택 요소 이벤트를 현재 Player의 공개 명령 또는 문서 작업으로 전달하고 늦은 오류는 숨깁니다.
     *
     * @param {string} key 선택 요소 역할
     * @param {Event} event 사용자 입력
     */
    _event(key: string, event: Event): void;
    /**
     * 현재 입력을 엄격히 검사하고 자기 요청만 전달합니다. <br>
     * 0배속은 Player의 정지 배속으로 허용합니다.
     *
     * @param {string} key 선택 요소 역할
     * @returns {void | Promise<void>} 명령 완료
     */
    _dispatch(key: string): void | Promise<void>;
    _markDraft(): void;
    _applyFile(): Promise<void>;
    /**
     * 비동기 읽기 전후 세대를 확인하고 입력 요청 VO를 독립 복사해 적용합니다.
     *
     * @param {string} text 문서 원문, 변경 없음
     * @param {string | null} name 출처 이름
     * @param {import('./sequencePlayerUi.js').USequenceUiOperation} operation 자기 요청, 자기 취소/세대 기록
     */
    _read(text: string, name: string | null, operation: USequenceUiOperation): Promise<void>;
    /**
     * 정확한 기준 세대만 load하며 자기 pending 세대와 promotion을 구별합니다. <br>
     * 외부 load는 취소하지 않습니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceRuntimeRequestVo} request 문서 사본, 검증한 독립 요청 사본, Player가 다시 복사
     * @param {import('./sequencePlayerUi.js').USequenceUiOperation} operation 자기 요청, 자기 signal과 후보 세대 기록
     */
    _load(request: USequenceRuntimeRequestVo, operation: USequenceUiOperation): Promise<void>;
    /**
     * 세대와 옵션을 먼저 검사하고 이전 자기 요청을 무효화한 뒤 새 취소 토큰을 만듭니다.
     *
     * @param {'read' | 'load' | 'write'} kind 새 문서 요청 종류
     * @param {import('./sequencePlayerUi.js').USequenceUiApplyOptions} opt 기준 세대
     * @returns {import('./sequencePlayerUi.js').USequenceUiOperation}
     */
    _begin(kind: "read" | "load" | "write", opt: USequenceUiApplyOptions$1): USequenceUiOperation;
    /**
     * 현재 부착·요청·active/pending 세대가 요청과 일치하는지 확인합니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceUiOperation} operation 자기 요청 기록
     * @param {boolean} [completed=false] load 완료 여부, true이면 promotion한 자기 load 결과 허용
     */
    _check(operation: USequenceUiOperation, completed?: boolean): void;
    /**
     * 자기 load의 첫 후보와 확정만 인정하고 다른 active/후보 변화는 자기 요청 취소로 예약합니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceUiOperation} operation 자기 기록, 후보/확정 표시만 변경
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePlayerStateVo} state 관측 상태, 읽기 전용 관측 사본
     */
    _observeOperation(operation: USequenceUiOperation, state: USequencePlayerStateVo): void;
    /**
     * 요청을 즉시 무효화하고 signal 중단은 Player 통지 스택 밖에서 수행합니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceUiOperation} operation 자기 요청
     */
    _cancel(operation: USequenceUiOperation): void;
    /**
     * 관찰 완료한 자기 요청 기록만 제거합니다. <br>
     * 늦은 Promise 결과는 호출자가 계속 관찰합니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceUiOperation} operation 종료 요청
     */
    _finish(operation: USequenceUiOperation): void;
    /**
     * 한 개의 자기 URL만 유지하고 임시 anchor를 성공/실패 모두 제거합니다. <br>
     * 해제 실패 URL은 재시도 기록에 남깁니다.
     *
     * @param {string} text 직렬화 원문
     * @param {string} name 안전한 저장 이름
     */
    _downloadText(text: string, name: string): void;
    _revokeUrls(): void;
    /**
     * 처음 원래 값을 기록하고 마지막 자기 값일 때만 복원하는 속성 수명을 취득합니다.
     *
     * @param {HTMLElement} element 빌린 요소, DOM identity 유지
     * @param {string} key 속성 이름
     * @param {unknown} value 자기 표시 값
     */
    _setProperty(element: HTMLElement, key: string, value: unknown): void;
    /**
     * 외부 변경을 덮지 않고 자기 값이 남아 있는 속성만 원래대로 복원합니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceUiProperty} entry 자기 속성 기록
     */
    _restoreProperty(entry: USequenceUiProperty): void;
    /**
     * 자기 DOM 수신자만 등록하고 같은 함수 identity로 제거합니다.
     *
     * @param {HTMLElement} element 이벤트 요소
     * @param {string} type 이벤트 이름
     * @param {function(Event):void} listener 자기 수신자
     */
    _listen(element: HTMLElement, type: string, listener: (arg0: Event) => void): void;
    /**
     * 자원 취득 직후 정리 기록을 추가합니다. <br>
     * 실패한 정리는 제거하지 않습니다.
     *
     * @param {function():void} run 자기 자원 정리, 반복 실패 시 재시도
     * @returns {import('./sequencePlayerUi.js').USequenceUiCleanup} 취득 기록
     */
    _own(run: () => void): USequenceUiCleanup;
    /**
     * 잘못된 비동기 mount는 거부하되 완료 전 unmount하지 않고 늦은 완료/실패 뒤 정리할 기록을 유지합니다.
     *
     * @param {unknown} result mount 반환
     * @param {import('./sequencePlayerUi.js').USequenceUiCleanup} entry 정리 기록
     * @param {string} location 오류 진단 포트 이름
     */
    _syncAcquisition(result: unknown, entry: USequenceUiCleanup, location: string): void;
    /**
     * 잘못된 비동기 구독의 늦은 핸들을 취득한 뒤 자기 해제를 재시도합니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceUiCleanup} entry 자기 정리 기록
     * @param {unknown} handle 늦은 구독 핸들
     */
    _lateSubscription(entry: USequenceUiCleanup, handle: unknown): void;
    /**
     * 늦은 mount 완료를 관찰한 뒤 미부착 상태면 자기 정리를 재시도합니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceUiCleanup} entry 자기 정리 기록
     */
    _lateAcquisition(entry: USequenceUiCleanup): void;
    /**
     * 잘못된 비동기 취득의 거절을 관찰하고 남은 자기 수명만 정리합니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceUiCleanup} entry 자기 기록
     * @param {unknown} error 늦은 거절
     */
    _lateAcquisitionFailure(entry: USequenceUiCleanup, error: unknown): void;
    /**
     * 현재 부착 View의 입력 실패만 UI 진단에 연결합니다.
     *
     * @param {Event} event 공통 View 오류
     */
    _timelineError(event: Event): void;
    /**
     * 현재 부착의 명령 실패만 표시하고 취소/오래된 통지는 관찰만 합니다.
     *
     * @param {number} generation 명령 시작 부착 세대, 명령 시작 시0이상 안전 정수 부착 세대
     * @param {number} ticket 명령 시작 문서 요청 세대, 명령 시작 시0이상 안전 정수 문서 요청 세대
     * @param {unknown} error 원래 오류
     */
    _eventFailure(generation: number, ticket: number, error: unknown): void;
    /**
     * 안전한 오류 텍스트와 독립 Issue를 전달하고 진단 callback 실패는 원래 오류와 격리합니다.
     *
     * @param {unknown} error 원래 throw/거절 값, callback에 identity 그대로 전달
     */
    _report(error: unknown): void;
    _document(): Document;
    _documentPort(): USequenceUiDocumentPort$1;
    _alive(): void;
    _commandAllowed(): void;
    /**
     * 명시적인 수명/요청 메서드 외부의 직접 대입을 거부합니다.
     *
     * @param {Readonly<import('./sequencePlayerUi.js').USequenceUiConfig>} value 대입할 값(직접 변경 불가)
     */
    set config(value: Readonly<USequenceUiConfig>);
    /**
     * config 진단을 반환하며 빌린 자원의 소유권은 유지합니다.
     *
     * @returns {Readonly<import('./sequencePlayerUi.js').USequenceUiConfig>} 읽기 전용 수명 진단
     */
    get config(): Readonly<USequenceUiConfig>;
    /**
     * 명시적인 수명/요청 메서드 외부의 직접 대입을 거부합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set mounted(value: boolean);
    /**
     * mounted 진단을 반환하며 빌린 자원의 소유권은 유지합니다.
     *
     * @returns {boolean} 읽기 전용 수명 진단
     */
    get mounted(): boolean;
    /**
     * 명시적인 수명/요청 메서드 외부의 직접 대입을 거부합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set disposed(value: boolean);
    /**
     * disposed 진단을 반환하며 빌린 자원의 소유권은 유지합니다.
     *
     * @returns {boolean} 읽기 전용 수명 진단
     */
    get disposed(): boolean;
    /**
     * 명시적인 수명/요청 메서드 외부의 직접 대입을 거부합니다.
     *
     * @param {number} value 대입할 값(직접 변경 불가)
     */
    set mountGeneration(value: number);
    /**
     * mountGeneration 진단을 반환하며 빌린 자원의 소유권은 유지합니다.
     *
     * @returns {number} 읽기 전용 수명 진단
     */
    get mountGeneration(): number;
    /**
     * 명시적인 수명/요청 메서드 외부의 직접 대입을 거부합니다.
     *
     * @param {number} value 대입할 값(직접 변경 불가)
     */
    set cleanups(value: number);
    /**
     * cleanups 진단을 반환하며 빌린 자원의 소유권은 유지합니다.
     *
     * @returns {number} 읽기 전용 수명 진단
     */
    get cleanups(): number;
    /**
     * 명시적인 수명/요청 메서드 외부의 직접 대입을 거부합니다.
     *
     * @param {number} value 대입할 값(직접 변경 불가)
     */
    set operations(value: number);
    /**
     * operations 진단을 반환하며 빌린 자원의 소유권은 유지합니다.
     *
     * @returns {number} 읽기 전용 수명 진단
     */
    get operations(): number;
    /**
     * 명시적인 수명/요청 메서드 외부의 직접 대입을 거부합니다.
     *
     * @param {number} value 대입할 값(직접 변경 불가)
     */
    set documentTicket(value: number);
    /**
     * documentTicket 진단을 반환하며 빌린 자원의 소유권은 유지합니다.
     *
     * @returns {number} 읽기 전용 수명 진단
     */
    get documentTicket(): number;
    /**
     * 명시적인 수명/요청 메서드 외부의 직접 대입을 거부합니다.
     *
     * @param {number | null} value 대입할 값(직접 변경 불가)
     */
    set draftGeneration(value: number | null);
    /**
     * draftGeneration 진단을 반환하며 빌린 자원의 소유권은 유지합니다.
     *
     * @returns {number | null} 읽기 전용 수명 진단
     */
    get draftGeneration(): number | null;
    /**
     * 명시적인 수명/요청 메서드 외부의 직접 대입을 거부합니다.
     *
     * @param {string | null} value 대입할 값(직접 변경 불가)
     */
    set stateSignature(value: string | null);
    /**
     * stateSignature 진단을 반환하며 빌린 자원의 소유권은 유지합니다.
     *
     * @returns {string | null} 읽기 전용 수명 진단
     */
    get stateSignature(): string | null;
    /**
     * 명시적인 수명/요청 메서드 외부의 직접 대입을 거부합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set notifying(value: boolean);
    /**
     * notifying 진단을 반환하며 빌린 자원의 소유권은 유지합니다.
     *
     * @returns {boolean} 읽기 전용 수명 진단
     */
    get notifying(): boolean;
    /**
     * 명시적인 수명/요청 메서드 외부의 직접 대입을 거부합니다.
     *
     * @param {import('../../timeline/ui/UTimelineView.js').UTimelineView | null} value 대입할 값(직접 변경 불가)
     */
    set view(value: UTimelineView | null);
    /**
     * view 진단을 반환하며 빌린 자원의 소유권은 유지합니다.
     *
     * @returns {import('../../timeline/ui/UTimelineView.js').UTimelineView | null} 읽기 전용 수명 진단
     */
    get view(): UTimelineView | null;
    /**
     * 명시적인 수명/요청 메서드 외부의 직접 대입을 거부합니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceTimelineAdapter | null} value 대입할 값(직접 변경 불가)
     */
    set adapter(value: USequenceTimelineAdapter | null);
    /**
     * adapter 진단을 반환하며 빌린 자원의 소유권은 유지합니다.
     *
     * @returns {import('./sequencePlayerUi.js').USequenceTimelineAdapter | null} 읽기 전용 수명 진단
     */
    get adapter(): USequenceTimelineAdapter | null;
    /**
     * 명시적인 수명/요청 메서드 외부의 직접 대입을 거부합니다.
     *
     * @param {number} value 대입할 값(직접 변경 불가)
     */
    set properties(value: number);
    /**
     * properties 진단을 반환하며 빌린 자원의 소유권은 유지합니다.
     *
     * @returns {number} 읽기 전용 수명 진단
     */
    get properties(): number;
    /**
     * 명시적인 수명/요청 메서드 외부의 직접 대입을 거부합니다.
     *
     * @param {number} value 대입할 값(직접 변경 불가)
     */
    set urls(value: number);
    /**
     * urls 진단을 반환하며 빌린 자원의 소유권은 유지합니다.
     *
     * @returns {number} 읽기 전용 수명 진단
     */
    get urls(): number;
}
/** @typedef {Pick<import('../api/sequencePlayerRuntime.js').USequencePlayer,'getState'|'subscribe'|'exportDocument'|'play'|'pause'|'seek'|'setMultiplier'|'load'|'setLoop'|'restore'|'unload'>} USequenceUiPlayerPort */
/** @typedef {{animationContainer:HTMLElement,timelineContainer:HTMLElement}} USequenceUiTimeline */
/** @typedef {object} USequenceUiControls
 * @property {HTMLButtonElement|null} [playButton]
 * @property {HTMLButtonElement|null} [pauseButton]
 * @property {HTMLInputElement|null} [seekInput]
 * @property {HTMLInputElement|null} [rateInput]
 * @property {HTMLInputElement|null} [loopInput]
 * @property {HTMLButtonElement|null} [restoreButton]
 * @property {HTMLButtonElement|null} [unloadButton]
 * @property {HTMLInputElement|null} [fileInput]
 * @property {HTMLTextAreaElement|null} [documentInput]
 * @property {HTMLButtonElement|null} [applyButton]
 * @property {HTMLButtonElement|null} [saveButton]
 * @property {HTMLElement|null} [statusElement]
 */
/** @typedef {{mounted:boolean,mount:()=>void,unmount:()=>void}} USequenceUiComponent */
/**
 * @typedef {{ read: function(string, { name: string | null; signal: AbortSignal; }):import('../vo/sequenceDefinitionVos.js').USequenceRuntimeRequestVo | import('../vo/sequenceDefinitionVos.js').USequenceRuntimeRequestVoCO | Promise<import('../vo/sequenceDefinitionVos.js').USequenceRuntimeRequestVo | import('../vo/sequenceDefinitionVos.js').USequenceRuntimeRequestVoCO>; write: function(import('../vo/sequenceDefinitionVos.js').USequencePlaybackDocumentVo):string | Promise<string>; }} USequenceUiDocumentPort
 */
/**
 * @typedef {object} USequencePlayerUiHandlerCO
 * @property {USequenceUiPlayerPort} player 빌린 Player 공개 포트, null 불가
 * @property {USequenceUiTimeline | null} [timeline] 기본null, 선택 표시 위젯
 * @property {USequenceUiControls} [controls] 기본{},12개 직접 요소
 * @property {Array<USequenceUiComponent>} [components] 기본[], 미부착 독립 패널
 * @property {USequenceUiDocumentPort | null} [documentPort] 기본null, 호출자가 검증 등록
 * @property {null | function(import('../vo/sequenceDefinitionVos.js').USequencePlayerStateVo):void} [onState] 기본null, 동기 상태 사본 수신
 * @property {null | function(unknown, import('../vo/sequenceDefinitionVos.js').USequenceIssueVo):void} [onError] 기본null, 동기 원인/진단 수신
 */
/** @typedef {Partial<{ expectedGeneration: number; }>} USequenceUiApplyOptions */
/** @typedef {Partial<{ name: string | null; expectedGeneration: number; }>} USequenceUiTextOptions */
/**
 * @typedef {{ player: USequenceUiPlayerPort; timeline: USequenceUiTimeline | null; controls: USequenceUiControls; components: ReadonlyArray<USequenceUiComponent>; documentPort: USequenceUiDocumentPort | null; onState: null | function(import('../vo/sequenceDefinitionVos.js').USequencePlayerStateVo):void; onError: null | function(unknown, import('../vo/sequenceDefinitionVos.js').USequenceIssueVo):void; }} USequenceUiConfig
 */
/** @typedef {{run:()=>void,waiting:boolean}} USequenceUiCleanup */
/** @typedef {{kind:'read'|'load'|'write',ticket:number,mountGeneration:number,expectedGeneration:number,initialPending:number|null,pendingGeneration:number|null,controller:AbortController,cancelled:boolean,loading:boolean,promoted:boolean}} USequenceUiOperation */
/** @typedef {{element:HTMLElement,key:string,before:unknown,last:unknown}} USequenceUiProperty */
/**
 * 기존 Sequence 처리기 또는 Player를 공통 타임라인 포트에 연결합니다.
 */
declare class USequenceTimelineAdapter {
    /**
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceTimelineAdapter 클래스 생성자입니다. <br>
     * 기존 재생기의 공개 API를 확인하고 독립 초기 상태를 준비합니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceTimelineAdapterCO} opt 기존 재생 처리기 또는 Player 설정(playbackHandler·player 중 정확히 하나 필수)
     */
    constructor(opt: USequenceTimelineAdapterCO);
    _playbackHandler: USequenceTimelineHandlerPort | null;
    _player: USequenceTimelinePlayerPort | null;
    /**
     * @type {import('../../timeline/timeline.js').UTimelineAxisVo | null}
     */ _playerAxis: UTimelineAxisVo | null;
    /** @type {number|null} */ _axisGeneration: number | null;
    /** @type {Set<USequenceTimelineSubscription>} */ _pendingCleanups: Set<USequenceTimelineSubscription>;
    _reading: boolean;
    _issuing: boolean;
    _notifying: boolean;
    _state: UTimelineStateVo;
    _signature: string | null;
    _revision: number;
    /** @type {Set<USequenceTimelineSubscription>} */
    _subscriptions: Set<USequenceTimelineSubscription>;
    _disposed: boolean;
    /**
     * 기존 Clock의 실제 상태를 공통 VO로 변환합니다. <br>
     * 같은 값의 조회는 revision을 올리지 않고 해제된 연결은 마지막 축을 가진 disposed 사본으로 반환합니다.
     *
     * @returns {import('../../timeline/timeline.js').UTimelineStateVo} 독립 공통 상태입니다.
     */
    getState(): UTimelineStateVo;
    /**
     * 호출자마다 기존 처리기에 상태 구독을 연결하고 독립 사본을 전달합니다. <br>
     * 해제 함수는 해당 구독만 제거하며 반복 호출을 허용합니다.
     *
     * @param {UTimelineStateListener} listener 독립 상태 사본을 받을 동기 함수(Promise 반환·명령 재진입 불가)
     * @returns {UTimelineUnsubscribe} 자기 구독의 해제 함수입니다.
     */
    subscribe(listener: UTimelineStateListener): UTimelineUnsubscribe;
    /**
     * 호출자의 재생 처리기로 재생을 요청하고 동기 예외를 Promise 거절로 전달합니다. <br>
     * 새 시계나 RAF는 만들지 않습니다.
     *
     * @returns {Promise<void>} 동기 재생 요청의 처리 완료입니다.
     */
    play(): Promise<void>;
    /**
     * 기존 처리기의 재생 의도를 멈추고 결과를 Promise로 전달합니다. <br>
     * 처리기 수명은 유지합니다.
     *
     * @returns {Promise<void>} 동기 정지 요청의 처리 완료입니다.
     */
    pause(): Promise<void>;
    /**
     * 공통 축 범위를 확인한 뒤 기존 seek로 실제 메쉬 상태를 즉시 적용하고 Promise를 반환합니다.
     *
     * @param {number} position 탐색할 축 범위 안의 유한한 상대 시간(초)
     * @returns {Promise<void>} 실제 위치 적용 완료입니다.
     */
    seek(position: number): Promise<void>;
    /**
     * 공통 비영 배속을 기존 setMultiplier에 전달합니다. <br>
     * 정지 상태 값 0은 조회에서 보존하되 명령의 0 입력은 pause를 사용합니다.
     *
     * @param {number} value 재생 배속(0이 아닌 유한수, 음수는 역방향)
     * @returns {Promise<void>} 배속 적용 완료입니다.
     */
    setPlaybackRate(value: number): Promise<void>;
    /**
     * 자기 구독을 모두 해제하고 disposed 사본을 통지합니다. <br>
     * 처리기·Clock·메쉬는 유지하며 정리 실패를 집계합니다.
     */
    dispose(): void;
    /**
     * 의미 검증 후 실제 값 변화에만 revision을 증가시키고 마지막 사본을 저장합니다. <br>
     * 잘못된 상태는 기존 캐시를 바꾸지 않습니다.
     *
     * @param {import('../../timeline/timeline.js').UTimelineStateVo} state 다음 공통 상태입니다.
     * @returns {import('../../timeline/timeline.js').UTimelineStateVo} 확정 상태 사본입니다.
     */
    _commit(state: UTimelineStateVo): UTimelineStateVo;
    /**
     * 외부 처리기 조회 없이 종료 상태 사본을 만듭니다. <br>
     * 기존 표시 위치와 원본 식별은 보존합니다.
     *
     * @returns {import('../../timeline/timeline.js').UTimelineStateVo} 마지막 축과 위치를 유지한 해제 상태입니다.
     */
    _disposedState(): UTimelineStateVo;
    /**
     * 해제된 구독을 차단하고 현재 공통 상태를 독립 사본으로 전달합니다. <br>
     * 분리율 등 전용 값은 wrapper의 기존 구독에 남깁니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceTimelineSubscription} entry 현재 구독입니다.
     * @param {unknown} raw 기존 처리기 또는 Player 통지입니다.
     */
    _receive(entry: USequenceTimelineSubscription, raw: unknown): void;
    /**
     * 수신자별 사본을 전달하고 동기 수신 계약을 검사합니다. <br>
     * 수신자 예외는 기존 처리기의 오류 경로를 따릅니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceTimelineSubscription} entry 상태 수신 기록입니다.
     * @param {import('../../timeline/timeline.js').UTimelineStateVo} state 수신자에게 독립 복사해 전달할 상태
     */
    _notify(entry: USequenceTimelineSubscription, state: UTimelineStateVo): void;
    /**
     * 등록을 먼저 제거한 뒤 자기 native 구독을 해제합니다. <br>
     * 반복 호출과 해제 후 늦은 통지는 무동작입니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceTimelineSubscription} entry 해제할 내부 구독입니다.
     */
    _release(entry: USequenceTimelineSubscription): void;
    _usable(): void;
    _readPlayer(): UTimelineStateVo;
    /**
     * 활성 playback·단계·진단을 공통 표시 상태로 변환합니다. <br>
     * 해제된 Player의 문서는 읽지 않습니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePlayerStateVo} raw 검증한 독립 상태, 독립 입력 사본
     */
    _mapPlayer(raw: USequencePlayerStateVo): UTimelineStateVo;
    /**
     * 공개 포트의 동기 명령을 재진입 없이 실행합니다. <br>
     * 새 Scheduler를 만들지 않습니다.
     *
     * @param {'play' | 'pause' | 'seek' | 'setMultiplier'} name 실행 메서드
     * @param {number} [value] 상대 초 또는 배속
     */
    _command(name: "play" | "pause" | "seek" | "setMultiplier", value?: number): void;
    /**
     * 잘못된 비동기 구독의 늦은 핸들을 관찰하여 자기 구독만 정리합니다. <br>
     * 실패는 dispose 재시도 대상으로 남깁니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceTimelineSubscription} entry 해제 대기 기록
     * @param {unknown} handle 동기 해제 함수만 인정하며 자원 소유권은 자기 구독에 한함
     */
    _lateHandle(entry: USequenceTimelineSubscription, handle: unknown): void;
    /**
     * 비동기 구독의 거절을 관찰하고 취득하지 않은 핸들의 대기를 종료합니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceTimelineSubscription} entry 해제 대기 기록
     * @param {unknown} error 늦은 거절
     */
    _lateFailure(entry: USequenceTimelineSubscription, error: unknown): void;
    /**
     * 진단용 목록에 구독의 수신 함수만 포함하고 native 해제 핸들은 노출하지 않습니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceTimelineSubscription} entry 수신 함수를 조회할 구독 정보
     * @returns {UTimelineStateListener} 빌린 수신 함수입니다.
     */
    _listener(entry: USequenceTimelineSubscription): UTimelineStateListener;
    /**
     * 빌린 기존 재생 처리기의 직접 대입을 거부하고 명시적인 명령·구독·해제 경계를 유지합니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceTimelineHandlerPort} value 대입할 값(직접 변경 불가)
     */
    set playbackHandler(value: USequenceTimelineHandlerPort);
    /**
     * 빌린 기존 재생 처리기를 반환합니다. <br>
     * 처리기와 함수 참조는 읽기 전용으로 빌립니다.
     *
     * @returns {import('./sequencePlayerUi.js').USequenceTimelineHandlerPort} 빌린 기존 재생 처리기입니다.
     */
    get playbackHandler(): USequenceTimelineHandlerPort;
    /**
     * 독립 공통 상태의 직접 대입을 거부하고 명시적인 명령·구독·해제 경계를 유지합니다.
     *
     * @param {import('../../timeline/timeline.js').UTimelineStateVo} value 대입할 값(직접 변경 불가)
     */
    set state(value: UTimelineStateVo);
    /**
     * 독립 공통 상태를 반환합니다. <br>
     * 처리기와 함수 참조는 읽기 전용으로 빌립니다.
     *
     * @returns {import('../../timeline/timeline.js').UTimelineStateVo} 독립 공통 상태입니다.
     */
    get state(): UTimelineStateVo;
    /**
     * 마지막 공통 상태 비교 값의 직접 대입을 거부하고 명시적인 명령·구독·해제 경계를 유지합니다.
     *
     * @param {string | null} value 대입할 값(직접 변경 불가)
     */
    set signature(value: string | null);
    /**
     * 마지막 공통 상태 비교 값을 반환합니다. <br>
     * 처리기와 함수 참조는 읽기 전용으로 빌립니다.
     *
     * @returns {string | null} 마지막 공통 상태 비교 값입니다.
     */
    get signature(): string | null;
    /**
     * 현재 공통 상태 세대의 직접 대입을 거부하고 명시적인 명령·구독·해제 경계를 유지합니다.
     *
     * @param {number} value 대입할 값(직접 변경 불가)
     */
    set revision(value: number);
    /**
     * 현재 공통 상태 세대를 반환합니다. <br>
     * 처리기와 함수 참조는 읽기 전용으로 빌립니다.
     *
     * @returns {number} 현재 공통 상태 세대입니다.
     */
    get revision(): number;
    /**
     * 등록된 수신 함수 목록 사본의 직접 대입을 거부하고 명시적인 명령·구독·해제 경계를 유지합니다.
     *
     * @param {ReadonlyArray<UTimelineStateListener>} value 대입할 값(직접 변경 불가)
     */
    set subscriptions(value: ReadonlyArray<UTimelineStateListener>);
    /**
     * 등록된 수신 함수 목록 사본을 반환합니다. <br>
     * 처리기와 함수 참조는 읽기 전용으로 빌립니다.
     *
     * @returns {ReadonlyArray<UTimelineStateListener>} 등록된 수신 함수 목록 사본입니다.
     */
    get subscriptions(): ReadonlyArray<UTimelineStateListener>;
    /**
     * 연결기 해제 여부의 직접 대입을 거부하고 명시적인 명령·구독·해제 경계를 유지합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set disposed(value: boolean);
    /**
     * 연결기 해제 여부를 반환합니다. <br>
     * 처리기와 함수 참조는 읽기 전용으로 빌립니다.
     *
     * @returns {boolean} 연결기 해제 여부입니다.
     */
    get disposed(): boolean;
    _requirePlayer(): USequenceTimelinePlayerPort;
    /**
     * 공개 수명 메서드 밖의 상태 대입을 거부합니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceTimelinePlayerPort} value 대입할 값(직접 변경 불가)
     */
    set player(value: USequenceTimelinePlayerPort);
    /**
     * player 상태를 조회하며 자원 소유권을 이전하지 않습니다.
     *
     * @returns {import('./sequencePlayerUi.js').USequenceTimelinePlayerPort} 읽기 전용 진단 값
     */
    get player(): USequenceTimelinePlayerPort;
    /**
     * 공개 수명 메서드 밖의 상태 대입을 거부합니다.
     *
     * @param {import('../../timeline/timeline.js').UTimelineAxisVo | null} value 대입할 값(직접 변경 불가)
     */
    set playerAxis(value: UTimelineAxisVo | null);
    /**
     * playerAxis 상태를 조회하며 자원 소유권을 이전하지 않습니다.
     *
     * @returns {import('../../timeline/timeline.js').UTimelineAxisVo | null} 읽기 전용 진단 값
     */
    get playerAxis(): UTimelineAxisVo | null;
    /**
     * 공개 수명 메서드 밖의 상태 대입을 거부합니다.
     *
     * @param {number | null} value 대입할 값(직접 변경 불가)
     */
    set axisGeneration(value: number | null);
    /**
     * axisGeneration 상태를 조회하며 자원 소유권을 이전하지 않습니다.
     *
     * @returns {number | null} 읽기 전용 진단 값
     */
    get axisGeneration(): number | null;
    /**
     * 공개 수명 메서드 밖의 상태 대입을 거부합니다.
     *
     * @param {number} value 대입할 값(직접 변경 불가)
     */
    set pendingCleanups(value: number);
    /**
     * pendingCleanups 상태를 조회하며 자원 소유권을 이전하지 않습니다.
     *
     * @returns {number} 읽기 전용 진단 값
     */
    get pendingCleanups(): number;
    /**
     * 공개 수명 메서드 밖의 상태 대입을 거부합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set reading(value: boolean);
    /**
     * reading 상태를 조회하며 자원 소유권을 이전하지 않습니다.
     *
     * @returns {boolean} 읽기 전용 진단 값
     */
    get reading(): boolean;
    /**
     * 공개 수명 메서드 밖의 상태 대입을 거부합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set issuing(value: boolean);
    /**
     * issuing 상태를 조회하며 자원 소유권을 이전하지 않습니다.
     *
     * @returns {boolean} 읽기 전용 진단 값
     */
    get issuing(): boolean;
    /**
     * 공개 수명 메서드 밖의 상태 대입을 거부합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set notifying(value: boolean);
    /**
     * notifying 상태를 조회하며 자원 소유권을 이전하지 않습니다.
     *
     * @returns {boolean} 읽기 전용 진단 값
     */
    get notifying(): boolean;
}
type USequenceUiPlayerPort$1 = Pick<USequencePlayer, "getState" | "subscribe" | "exportDocument" | "play" | "pause" | "seek" | "setMultiplier" | "load" | "setLoop" | "restore" | "unload">;
type USequenceUiTimeline$1 = {
    animationContainer: HTMLElement;
    timelineContainer: HTMLElement;
};
type USequenceUiControls$1 = {
    playButton?: HTMLButtonElement | null | undefined;
    pauseButton?: HTMLButtonElement | null | undefined;
    seekInput?: HTMLInputElement | null | undefined;
    rateInput?: HTMLInputElement | null | undefined;
    loopInput?: HTMLInputElement | null | undefined;
    restoreButton?: HTMLButtonElement | null | undefined;
    unloadButton?: HTMLButtonElement | null | undefined;
    fileInput?: HTMLInputElement | null | undefined;
    documentInput?: HTMLTextAreaElement | null | undefined;
    applyButton?: HTMLButtonElement | null | undefined;
    saveButton?: HTMLButtonElement | null | undefined;
    statusElement?: HTMLElement | null | undefined;
};
type USequenceUiComponent$1 = {
    mounted: boolean;
    mount: () => void;
    unmount: () => void;
};
type USequenceUiDocumentPort$1 = {
    read: (arg0: string, arg1: {
        name: string | null;
        signal: AbortSignal;
    }) => USequenceRuntimeRequestVo | USequenceRuntimeRequestVoCO$2 | Promise<USequenceRuntimeRequestVo | USequenceRuntimeRequestVoCO$2>;
    write: (arg0: USequencePlaybackDocumentVo) => string | Promise<string>;
};
type USequencePlayerUiHandlerCO$1 = {
    /**
     * 빌린 Player 공개 포트, null 불가
     */
    player: USequenceUiPlayerPort$1;
    /**
     * 기본null, 선택 표시 위젯
     */
    timeline?: USequenceUiTimeline$1 | null | undefined;
    /**
     * 기본{},12개 직접 요소
     */
    controls?: USequenceUiControls$1 | undefined;
    /**
     * 기본[], 미부착 독립 패널
     */
    components?: USequenceUiComponent$1[] | undefined;
    /**
     * 기본null, 호출자가 검증 등록
     */
    documentPort?: USequenceUiDocumentPort$1 | null | undefined;
    /**
     * 기본null, 동기 상태 사본 수신
     */
    onState?: ((arg0: USequencePlayerStateVo) => void) | null | undefined;
    /**
     * 기본null, 동기 원인/진단 수신
     */
    onError?: ((arg0: unknown, arg1: USequenceIssueVo) => void) | null | undefined;
};
type USequenceUiApplyOptions$1 = Partial<{
    expectedGeneration: number;
}>;
type USequenceUiTextOptions$1 = Partial<{
    name: string | null;
    expectedGeneration: number;
}>;
type USequenceUiConfig = {
    player: USequenceUiPlayerPort$1;
    timeline: USequenceUiTimeline$1 | null;
    controls: USequenceUiControls$1;
    components: ReadonlyArray<USequenceUiComponent$1>;
    documentPort: USequenceUiDocumentPort$1 | null;
    onState: null | ((arg0: USequencePlayerStateVo) => void);
    onError: null | ((arg0: unknown, arg1: USequenceIssueVo) => void);
};
type USequenceUiCleanup = {
    run: () => void;
    waiting: boolean;
};
type USequenceUiOperation = {
    kind: "read" | "load" | "write";
    ticket: number;
    mountGeneration: number;
    expectedGeneration: number;
    initialPending: number | null;
    pendingGeneration: number | null;
    controller: AbortController;
    cancelled: boolean;
    loading: boolean;
    promoted: boolean;
};
type USequenceUiProperty = {
    element: HTMLElement;
    key: string;
    before: unknown;
    last: unknown;
};
/**
 * 기존 재생 상태 중 공통 UI에서 읽을 필드를 정의합니다.
 */
type USequenceTimelineNativeState = {
    /**
     * 현재 시퀀스 식별자입니다.
     */
    sequenceId: string;
    /**
     * 자료 식별자입니다.
     */
    contentId: string;
    /**
     * 기준 날짜부터 유한 상대 초입니다.
     */
    currentTime: number;
    /**
     * 유한 배속이며 0 상태도 보존합니다.
     */
    multiplier: number;
    /**
     * 실제 재생 의도입니다.
     */
    playing: boolean;
};
/**
 * 기존 재생기의 공개 API에서 공통 UI가 사용할 메서드를 정의합니다.
 */
type USequenceTimelineHandlerPort = {
    /**
     * 독립 기존 상태입니다.
     */
    state: USequenceTimelineNativeState;
    /**
     * 상대 초 범위와 선택적 ISO 기준 날짜입니다.
     */
    timeline: {
        startTime: number;
        endTime: number;
        epoch: string | null;
    };
    /**
     * 기존 처리기의 오류입니다.
     */
    lastError: Error | null;
    /**
     * 기존 처리기 해제 여부입니다.
     */
    disposed: boolean;
    /**
     * 기존 시계로 재생합니다.
     */
    play: () => void;
    /**
     * 기존 시계의 재생 의도를 멈춥니다.
     */
    pause: () => void;
    /**
     * 상대 초로 탐색합니다.
     */
    seek: (arg0: number) => void;
    /**
     * 유한 배속을 설정합니다.
     */
    setMultiplier: (arg0: number) => void;
    /**
     * 동기 상태 사본을 구독하고 자기 해제 함수를 반환합니다.
     */
    subscribe: (arg0: (arg0: USequenceTimelineNativeState) => void) => UTimelineUnsubscribe;
};
/**
 * 기존 Sequence 처리기 또는 Player를 공통 UI에 연결하는 설정입니다.
 */
type USequenceTimelineAdapterCO = (({
    playbackHandler: USequenceTimelineHandlerPort;
} & Partial<{
    player: never;
}>) | ({
    player: USequenceTimelinePlayerPort;
} & Partial<{
    playbackHandler: never;
}>));
/**
 * 연결기가 소유하는 구독 기록이며 저장 VO가 아닙니다.
 */
type USequenceTimelineSubscription = {
    /**
     * 상태 사본을 받을 동기 함수(Promise 반환·명령 재진입 불가)
     */
    listener: UTimelineStateListener;
    /**
     * 마지막 전달한 공통 세대
     */
    revision: number;
    /**
     * 등록 반환 전 통지 여부
     */
    early: boolean;
    /**
     * 등록 호출 진행 여부
     */
    waiting: boolean;
    /**
     * 이 구독만 제거하는 native 해제 함수입니다.
     */
    unsubscribe: UTimelineUnsubscribe | null;
};
type USequenceTimelinePlayerPort = Pick<USequencePlayer, "getState" | "subscribe" | "exportDocument" | "play" | "pause" | "seek" | "setMultiplier">;

/**
 * 한 자료의 GUID별 메쉬 조각을 등록하고 원래 자세를 복원합니다.
 */
declare class USequenceMeshBindingManager {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceMeshBindingManager 클래스 생성자입니다.
     *
     * @param {import('./sequenceMeshBindings.js').USequenceMeshBindingManagerCO} [opt={}] 연결 목록의 생성 옵션 입력 변경/소유권 이전 없음
     */
    constructor(opt?: USequenceMeshBindingManagerCO);
    _contentId: string | undefined;
    /** @type {Map<string, Set<import("../vo/sequenceDefinitionVos.js").USequenceMeshBindingVo>>} */
    _bindingsByObject: Map<string, Set<USequenceMeshBindingVo>>;
    /** @type {WeakMap<import('three').Mesh, import("../vo/sequenceDefinitionVos.js").USequenceMeshBindingVo>} */
    _knownBindings: WeakMap<Mesh, USequenceMeshBindingVo>;
    _disposed: boolean;
    /**
     * 활성 연결이 없을 때 자료 식별자와 캐시 기록을 초기화합니다.
     *
     * @param {undefined | string} value 자료 식별자 입력 변경/소유권 이전 없음
     */
    set contentId(value: undefined | string);
    /**
     * 자료 식별자를 반환합니다.
     *
     * @returns {undefined | string}
     */
    get contentId(): undefined | string;
    /**
     * 빈 색인으로 초기화합니다.
     *
     * @param {Map<string, Set<import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo>>} value 비어 있는 새 색인 입력 변경/소유권 이전 없음
     */
    set bindingsByObject(value: Map<string, Set<USequenceMeshBindingVo>>);
    /**
     * 활성 연결의 색인을 VO까지 복사하여 반환합니다.
     *
     * @returns {Map<string, Set<import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo>>} 변경이 내부 색인에 영향을 주지 않는 복사본
     */
    get bindingsByObject(): Map<string, Set<USequenceMeshBindingVo>>;
    /**
     * 활성 연결이 없을 때 캐시 기록을 초기화합니다.
     *
     * @param {null} value 초기화를 요청하는 null 값 입력 변경/소유권 이전 없음
     */
    set knownBindings(value: null);
    /**
     * 활성 메쉬에 대한 기록을 복사하여 반환합니다. <br>
     * 비활성 WeakMap 기록은 열거하지 않으며 getBinding으로 조회합니다.
     *
     * @returns {WeakMap<import('three').Mesh, import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo>} 활성 기록의 복사본
     */
    get knownBindings(): WeakMap<Mesh, USequenceMeshBindingVo>;
    /**
     * 자체 상태를 해제합니다. <br>
     * 해제한 인스턴스는 재사용하지 않습니다.
     *
     * @param {boolean} value 해제를 요청하는 값 입력 변경/소유권 이전 없음
     */
    set disposed(value: boolean);
    /**
     * 자체 상태의 해제 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get disposed(): boolean;
    /**
     * 메쉬를 등록하거나 같은 메쉬의 최초 기준 자세를 재사용합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} binding 등록할 연결 정보 입력 변경/소유권 이전 없음
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} 활성 연결 정보의 복사본
     * @throws {Error} 자료·GUID·기준 자세 또는 기존 부모가 일치하지 않을 때 발생합니다.
     */
    register(binding: USequenceMeshBindingVo): USequenceMeshBindingVo;
    /**
     * 캐시에 보관한 활성 또는 비활성 연결을 조회합니다.
     *
     * @param {import('three').Mesh} mesh 조회할 메쉬 입력 변경/소유권 이전 없음
     * @returns {undefined | import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} 연결 정보의 복사본
     */
    getBinding(mesh: Mesh): undefined | USequenceMeshBindingVo;
    /**
     * GUID에 속한 활성 메쉬 조각을 조회합니다.
     *
     * @param {string} objectId IFC GlobalId 입력 변경/소유권 이전 없음
     * @returns {Array<import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo>} 연결 정보의 복사본
     */
    getBindings(objectId: string): Array<USequenceMeshBindingVo>;
    /**
     * 모든 활성 연결을 조회합니다.
     *
     * @returns {Array<import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo>} 연결 정보의 복사본
     */
    getAllBindings(): Array<USequenceMeshBindingVo>;
    /**
     * 등록을 먼저 해제한 뒤 원래 자세를 복원합니다.
     *
     * @param {import('three').Mesh} mesh 해제할 메쉬 입력 변경/소유권 이전 없음
     * @returns {undefined | import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} 해제한 연결 정보의 복사본
     * @throws {Error} 부모 변경 등으로 안전하게 복원할 수 없을 때 발생합니다.
     */
    unregister(mesh: Mesh): undefined | USequenceMeshBindingVo;
    /**
     * 활성 메쉬의 원래 자세를 모두 복원합니다.
     *
     * @throws {AggregateError} 복원 실패를 메쉬 참조와 함께 모아 전달합니다.
     */
    restoreBindings(): void;
    /**
     * 복원 결과와 관계없이 색인과 캐시 기록을 정리합니다.
     */
    clear(): void;
    /**
     * 원래 자세와 자체 상태만 정리합니다.
     */
    dispose(): void;
    /**
     * 해제한 인스턴스의 등록을 차단합니다.
     */
    _assertUsable(): void;
    /**
     * 활성 연결이 남은 상태의 설정 교체를 차단합니다.
     */
    _assertResettable(): void;
    /**
     * 자료 키와 메쉬 및 기준 자세를 검사합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} binding 검사할 연결 입력 변경/소유권 이전 없음
     */
    _validateBinding(binding: USequenceMeshBindingVo): void;
    /**
     * 캐시 메쉬의 자료·객체·부모가 바뀌지 않았는지 검사합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} known 최초 기록 입력 변경/소유권 이전 없음
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} candidate 새 등록 요청 입력 변경/소유권 이전 없음
     */
    _validateIdentity(known: USequenceMeshBindingVo, candidate: USequenceMeshBindingVo): void;
    /**
     * 부모를 바꾸지 않고 저장한 로컬 자세와 행렬 설정을 복원합니다. <br>
     * inactive 연결은 removed 이후 parent=null이어도 수치 자세를 복구하며 다른 부모로 옮긴 경우는 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} binding 복원할 연결
     */
    _restore(binding: USequenceMeshBindingVo): void;
}
/**
 * 객체 연결 목록의 생성 옵션입니다.
 */
type USequenceMeshBindingManagerCO = {
    /**
     * 연결할 자료 식별자
     */
    contentId?: string | undefined;
};

/** @import {USequencePropertyJsonValue,USequencePropertyJsonRecord} from "../core/sequenceData.js" */
/**
 * 시퀀스의 형상 참조, 시간 구간과 객체 배정 관계를 검증합니다.
 */
declare class USequenceValidationExecutor {
    /**
     * 시퀀스의 필수 값, 시간 범위와 객체 배정 관계를 검증합니다. <br>
     * 계약을 위반하면 해당 데이터 경로를 포함한 오류를 전달합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} sequence 검사할 시퀀스
     * @throws {TypeError} 필수 값 또는 타입이 올바르지 않은 경우
     * @throws {RangeError} 시간·참조·배정 관계가 올바르지 않은 경우
     */
    validate(sequence: USequenceVo): void;
    #private;
}
/**
 * 확정 시퀀스와 재생 북마크를 공개 JSON 계약으로 저장·복원합니다.
 */
declare class USequenceSerializer {
    /**
     * 생성 옵션의 정본 키 목록입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceSerializer 클래스 생성자입니다. <br>
     * 기존 동기 검증기를 연결합니다.
     *
     * @param {import('./sequenceDataRuntime.js').USequenceSerializerCO} [opt={}] 검증기 설정(생략하면 기본 검증기)
     */
    constructor(opt?: USequenceSerializerCO);
    /**
     * 이후 작업에 사용할 동기 검증기를 교체합니다.
     *
     * @param {import('./sequenceDataRuntime.js').USequenceValidationExecutor} value 사용할 검증기
     */
    set validationExecutor(value: USequenceValidationExecutor);
    /**
     * 시퀀스 검증기 참조를 반환합니다.
     *
     * @returns {import('./sequenceDataRuntime.js').USequenceValidationExecutor} 자원 수명을 변경하지 않는 검증기 참조
     */
    get validationExecutor(): USequenceValidationExecutor;
    _validationExecutor: USequenceValidationExecutor | undefined;
    /**
     * 확정 시퀀스와 선택적 재생 상태를 복사하여 저장 문서를 만듭니다. <br>
     * 상태 생략 시 시퀀스 시작 시각·배속 1·분리율 0을 사용하며 playing은 저장하지 않습니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} sequence 중첩 VO까지 독립 복사할 확정 시퀀스
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePlaybackStateVo | null} [playbackState=null] 같은 시퀀스·자료·시간 범위의 재생 상태(null이면 상태 제외)
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceDocumentVo} 호출자가 독립적으로 소유하는 문서
     */
    create(sequence: USequenceVo, playbackState?: USequencePlaybackStateVo | null): USequenceDocumentVo;
    /**
     * 문서의 공개 필드를 검증하여 JSON 문자열로 반환합니다. <br>
     * _ 내부 필드·메쉬·Clock을 출력하지 않으며 상대 URI 표기는 보존합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceDocumentVo} document 검증할 완성 문서(시각은 null 불가)
     * @param {import('./sequenceDataRuntime.js').USequenceSerializeOptions} [opt={}] JSON 출력 설정(들여쓰기 사용 시 공백 2칸)
     * @returns {string} UTF-8 파일로 저장할 수 있는 JSON 텍스트
     */
    serialize(document: USequenceDocumentVo, opt?: USequenceSerializeOptions): string;
    /**
     * 문서의 정본 필드·중복 키·자료 식별자와 재생 범위를 검사하여 복원합니다. <br>
     * 상대 형상·속성 URI는 명시한 baseUrl로 해석하고 HTTP(S) 절대 주소로 반환합니다. <br>
     * 일시정지로 재구성할 값만 반환하며 현재 화면·Clock은 변경하지 않습니다.
     *
     * @param {string} text JSON 원문(선행 UTF-8 BOM 1개 허용, 키·타입 자동 보정 없음)
     * @param {import('./sequenceDataRuntime.js').USequenceParseOptions} opt 현재 연결 자료와 상대 URI 기준(expectedContent 필수)
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceDocumentVo} 입력 및 다음 호출과 참조를 공유하지 않는 완성 문서
     * @throws {Error} JSON 문법·중복 키·필드·자료 식별·시각·주소 계약이 틀리면 오류를 전달합니다.
     */
    parse(text: string, opt: USequenceParseOptions): USequenceDocumentVo;
    /**
     * 문서 VO 인스턴스가 필요한 공개 경계를 확인합니다.
     *
     * @param {unknown} value 검사할 입력
     */
    _requireDocument(value: unknown): void;
    /**
     * 기존 검증을 실행하고 비동기 검증기로 계약을 바꾸는 것을 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} sequence 이 작업이 소유하는 시퀀스 사본
     */
    _validateSequence(sequence: USequenceVo): void;
    /**
     * 문서 형식·시퀀스·재생 북마크를 검사합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceDocumentVo} document 읽기 전용 완성 문서
     */
    _validateDocument(document: USequenceDocumentVo): void;
    /**
     * 현재 시퀀스와 일치하는 재생 값 세 개를 선택합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} sequence 검증된 독립 시퀀스
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePlaybackStateVo | null} state 호출자 소유 상태 또는 생략 null
     * @returns {{ currentTime: number; multiplier: number; explodeRatio: number; }} 독립 원시 재생 값
     */
    _bookmark(sequence: USequenceVo, state: USequencePlaybackStateVo | null): {
        currentTime: number;
        multiplier: number;
        explodeRatio: number;
    };
    /**
     * 파일 객체의 필수 정본 필드와 중첩 객체 구조를 검사합니다.
     *
     * @param {unknown} raw JSON에서 읽은 입력
     * @param {import('./sequenceDataRuntime.js').USequenceDocumentSchema} schema 현재 객체의 정본 계약
     * @param {string} location 오류에 표시할 0 기반 배열 인덱스 포함 필드 경로
     */
    _checkSchema(raw: unknown, schema: USequenceDocumentSchema, location: string): void;
    /**
     * 자식 객체 또는 자식 배열을 같은 파일 계약으로 검사합니다.
     *
     * @param {unknown} raw 해당 자식의 JSON 값
     * @param {import('./sequenceDataRuntime.js').USequenceDocumentChildSchema} child 단일 또는 배열 자식 계약
     * @param {string} location 오류에 표시할 부모 필드 경로
     */
    _checkChild(raw: unknown, child: USequenceDocumentChildSchema, location: string): void;
    /**
     * 알려진 VO의 공개 getter와 JSON 값만 재귀 복사합니다.
     *
     * @param {unknown} value 이 작업이 소유한 검증된 값 또는 중첩 VO
     * @returns {import('../core/sequenceData.js').USequencePropertyJsonValue} 공개 필드명을 사용하는 독립 JSON 값
     */
    _encode(value: unknown): USequencePropertyJsonValue;
    /**
     * 현재 연결 자료와 파일의 영구 식별 정보를 비교합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceContentVo} actual 문서에서 읽고 검증한 자료
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceContentVo} expected 현재 연결 자료
     */
    _matchContent(actual: USequenceContentVo, expected: USequenceContentVo): void;
    /**
     * 명시한 기준으로 형상·속성 주소를 HTTP(S) 절대 URL로 해석합니다.
     *
     * @param {string} uri 검증한 형상 또는 속성 URI
     * @param {string | URL | undefined} baseUrl 상대 URI의 기준 주소(절대 URI이면 생략 가능)
     * @returns {string} 해석한 HTTP(S) 절대 URI
     */
    _resolveUri(uri: string, baseUrl: string | URL | undefined): string;
    /**
     * 재생 북마크가 유한 숫자인지 확인합니다.
     *
     * @param {unknown} value 검사할 원시 값
     * @param {string} location 오류에 표시할 필드 경로
     */
    _finite(value: unknown, location: string): void;
    _validateAxisRatios(value: any): void;
}
/**
 * 직렬화에 사용할 기존 시퀀스 검증기 설정입니다.
 *
 * @typedef {object} USequenceSerializerCO
 * @property {import("./sequenceDataRuntime.js").USequenceValidationExecutor} [validationExecutor] 빌릴 동기 검증기. 생략하면 기본 검증기를 생성합니다.
 */
/**
 * JSON 출력의 공백 설정입니다.
 *
 * @typedef {object} USequenceSerializeOptions
 * @property {boolean} [pretty=true] true이면 공백 2칸, false이면 압축 문자열
 */
/**
 * 읽을 문서의 자료 식별자와 상대 주소 기준입니다.
 *
 * @typedef {object} USequenceParseOptions
 * @property {import("../vo/sequenceDefinitionVos.js").USequenceContentVo} expectedContent 현재 연결 자료. id/format/revision/objectIdType을 비교하며 소유권 이전은 없습니다.
 * @property {string | URL} [baseUrl] 문서의 HTTP(S) 위치. 상대 형상·속성 URI가 있으면 필수입니다.
 */
/**
 * 문서 JSON의 정본 필드와 중첩 객체 관계입니다.
 *
 * @typedef {object} USequenceDocumentSchema
 * @property {ReadonlyArray<string>} keys 필수 camelCase 필드 목록
 * @property {Array<USequenceDocumentChildSchema>} children 중첩 VO 필드 목록
 */
/**
 * 중첩 VO의 단일·배열 구조입니다.
 *
 * @typedef {object} USequenceDocumentChildSchema
 * @property {string} name 부모 객체의 정본 필드 이름
 * @property {boolean} many 배열이면 true
 * @property {boolean} [optional=false] 이전 문서에 없는 선택적 중첩 필드를 허용할지 여부
 * @property {USequenceDocumentSchema} schema 자식 객체 계약
 */
/**
 * GUID별 batch.json 또는 Builder Schema.json을 읽어 객체별 VO로 변환합니다.
 */
declare class USequencePropertyLoader {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequencePropertyLoader 클래스 생성자입니다.
     *
     * @param {import('./sequenceDataRuntime.js').USequencePropertyLoaderCO} [opt={}] 속성 요청 함수 설정
     */
    constructor(opt?: USequencePropertyLoaderCO);
    /**
     * 이후 요청에 사용할 함수를 교체합니다. <br>
     * 진행 중인 요청에는 영향을 주지 않습니다.
     *
     * @param {typeof fetch} value 요청 함수
     */
    set fetcher(value: typeof fetch);
    /**
     * 속성 요청 함수를 반환합니다.
     *
     * @returns {typeof fetch}
     */
    get fetcher(): typeof fetch;
    _fetcher: typeof fetch | undefined;
    /**
     * propertiesUri의 JSON을 읽고 타입을 보존한 속성 VO를 반환합니다. <br>
     * 상대 주소는 baseUrl 또는 브라우저 document.baseURI를 기준으로 해석합니다. <br>
     * 이미 취소했거나 응답 처리 중 취소한 요청은 결과를 반환하지 않습니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceContentVo} content 독립 복사할 자료 참조
     * @param {import('./sequenceDataRuntime.js').USequencePropertyLoadOptions} [opt={}] 기준 주소와 취소 신호
     * @returns {Promise<Array<import('../vo/sequenceDefinitionVos.js').USequenceObjectPropertyVo>>} 독립적으로 소유하는 객체 속성 목록
     * @throws {Error} HTTP·JSON·GUID·주소 오류 또는 요청 취소 시 Promise가 거절됩니다.
     */
    load(content: USequenceContentVo, opt?: USequencePropertyLoadOptions): Promise<Array<USequenceObjectPropertyVo>>;
    /**
     * JSON 문자열 또는 이미 읽은 레코드를 검사하여 객체별로 복사합니다. <br>
     * 루트 GUID 키와 GlobalId가 다르면 거부하며 숫자처럼 보이는 문자열도 변환하지 않습니다. <br>
     * 기존 엔진 JSON을 전달하기 전에 앱에서 자료 ID와 revision 일치를 확인하십시오.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceContentVo} content 독립 복사할 자료 참조
     * @param {string | import('../core/sequenceData.js').USequencePropertyJsonRecord} source JSON 문자열 또는 GUID별 레코드
     * @returns {Array<import('../vo/sequenceDefinitionVos.js').USequenceObjectPropertyVo>} 원본과 참조를 공유하지 않는 VO 목록
     * @throws {Error} 잘못된 JSON 구조·식별자·지원하지 않는 값이 있을 때 발생합니다.
     */
    parse(content: USequenceContentVo, source: string | USequencePropertyJsonRecord): Array<USequenceObjectPropertyVo>;
    /**
     * Builder Schema.json의 분해 구조에서 객체별 속성을 구성합니다.
     *
     * @param {Record<string, any>} schema 복사·검증한 호출자 소유 스키마이며 변경하지 않습니다.
     * @returns {Record<string, any>} GUID별 독립 속성 레코드입니다.
     */
    _schemaRecords(schema: Record<string, any>): Record<string, any>;
    /**
     * 객체 하나의 기본 속성과 PropertySet을 연결합니다.
     *
     * @param {Record<string, any>} records 변경할 GUID별 출력 레코드입니다.
     * @param {string} type IfcBuildingElementProxy 등의 IFC 엔터티 종류
     * @param {Record<string, any>} object id와 PropertySet을 가진 읽기 전용 분해 구조
     * @param {Map<string, any>} sets 읽기 전용 PropertySet 색인입니다.
     */
    _schemaObject(records: Record<string, any>, type: string, object: Record<string, any>, sets: Map<string, any>): void;
    /**
     * 참조 PropertySet의 원본 타입을 보존하여 Properties에 추가합니다.
     *
     * @param {Record<string, any>} properties 변경할 속성 집합 사전입니다.
     * @param {Record<string, any>} link PropertySet의 xlink:href 참조입니다.
     * @param {Map<string, any>} sets 읽기 전용 PropertySet 색인입니다.
     */
    _schemaSet(properties: Record<string, any>, link: Record<string, any>, sets: Map<string, any>): void;
    /**
     * 이름 있는 IFC 속성 값을 독립 사본으로 저장합니다.
     *
     * @param {Record<string, any>} values 변경할 속성 이름별 사전입니다.
     * @param {Record<string, any>} property 읽기 전용 IFC 속성 객체입니다.
     */
    _schemaValue(values: Record<string, any>, property: Record<string, any>): void;
    /**
     * 파일 위치를 추측하지 않고 명시한 URI를 HTTP URL로 해석합니다.
     *
     * @param {string} uri 속성 파일 URI
     * @param {string | URL | undefined} baseUrl 상대 URI의 기준 URL
     * @returns {URL} 해석한 HTTP 또는 HTTPS URL
     */
    _resolveUrl(uri: string, baseUrl: string | URL | undefined): URL;
    /**
     * 취소 신호 형식을 검사하고 취소 이유를 그대로 전달합니다.
     *
     * @param {AbortSignal | undefined} signal 요청의 취소 신호
     */
    _checkSignal(signal: AbortSignal | undefined): void;
}
/**
 * 속성 JSON 로더의 생성 옵션입니다.
 *
 * @typedef {object} USequencePropertyLoaderCO
 * @property {typeof fetch} [fetcher] 기본 fetch를 교체할 요청 함수
 */
/**
 * 속성 파일 한 건의 요청 옵션입니다.
 *
 * @typedef {object} USequencePropertyLoadOptions
 * @property {string | URL} [baseUrl] 상대 propertiesUri의 기준 URL. 보통 시퀀스 설정 파일 URL을 지정합니다.
 * @property {AbortSignal} [signal] 요청과 응답 처리의 취소 신호
 */
/**
 * GUID별 속성 스냅샷에서 필드·고유 값·누락을 조회합니다.
 */
declare class USequencePropertyQueryExecutor {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequencePropertyQueryExecutor 클래스 생성자입니다.
     *
     * @param {import('./sequenceDataRuntime.js').USequencePropertyQueryExecutorCO} [opt={}] 자료 ID와 객체 속성 목록
     */
    constructor(opt?: USequencePropertyQueryExecutorCO);
    _contentId: string;
    _objectsById: Map<string, USequencePropertyIndexEntry>;
    /**
     * 빈 색인의 자료 식별자를 설정합니다.
     *
     * @param {string} value 자료 식별자
     */
    set contentId(value: string);
    /**
     * 조회할 자료 식별자를 반환합니다.
     *
     * @returns {string}
     */
    get contentId(): string;
    /**
     * GUID별 속성을 검증하고 필드 색인과 함께 교체합니다. <br>
     * 검증이 실패하면 기존 스냅샷을 유지합니다.
     *
     * @param {Map<string, import('../vo/sequenceDefinitionVos.js').USequenceObjectPropertyVo>} value 같은 자료의 속성 스냅샷
     */
    set objectsById(value: Map<string, USequenceObjectPropertyVo>);
    /**
     * GUID별 속성을 VO까지 복사하여 반환합니다. <br>
     * 내부의 필드 경로 색인은 노출하지 않습니다.
     *
     * @returns {Map<string, import('../vo/sequenceDefinitionVos.js').USequenceObjectPropertyVo>} 속성 스냅샷의 복사본
     */
    get objectsById(): Map<string, USequenceObjectPropertyVo>;
    /**
     * 속성 자료에 존재하는 전체 GUID를 조회합니다.
     *
     * @returns {Array<string>} 원본 순서를 유지한 GUID 복사 목록
     */
    getObjectIds(): Array<string>;
    /**
     * 객체 하나의 원본 속성을 복사하여 반환합니다.
     *
     * @param {string} objectId 조회할 GUID
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceObjectPropertyVo | undefined} 속성 VO 또는 레코드 누락
     */
    getObject(objectId: string): USequenceObjectPropertyVo | undefined;
    /**
     * 원본 키 배열을 따라 실제 값을 조회합니다. <br>
     * 누락은 undefined, 명시한 null은 null을 반환하며 컨테이너는 복사합니다.
     *
     * @param {string} objectId 조회할 GUID
     * @param {Array<string>} path 원본 레코드 루트부터 시작하는 속성 경로
     * @returns {import('../core/sequenceData.js').USequencePropertyJsonValue | undefined} 타입을 보존한 값 또는 누락
     */
    getValue(objectId: string, path: Array<string>): USequencePropertyJsonValue | undefined;
    /**
     * 지정 범위의 Properties 아래 속성셋 이름을 조회합니다.
     *
     * @param {import('./sequenceDataRuntime.js').USequencePropertyScopeOptions} [opt={}] 조회할 GUID 범위
     * @returns {Array<string>} 처음 발견한 순서의 중복 없는 속성셋 목록
     */
    getPropertySets(opt?: USequencePropertyScopeOptions): Array<string>;
    /**
     * 지정 범위에서 발견한 동적 필드 경로와 실제 타입을 조회합니다. <br>
     * 객체는 하위 경로를 탐색하고 배열과 빈 객체는 하나의 필드로 표시합니다. <br>
     * 같은 경로가 다른 객체에서 컨테이너로 쓰이면 해당 타입도 함께 표시합니다.
     *
     * @param {import('./sequenceDataRuntime.js').USequencePropertyFieldOptions} [opt={}] GUID 범위와 속성셋 필터
     * @returns {Array<import('../vo/sequenceDefinitionVos.js').USequencePropertyFieldVo>} 필드 정의의 복사 목록
     */
    getFields(opt?: USequencePropertyFieldOptions): Array<USequencePropertyFieldVo>;
    /**
     * 원본 타입별 고유 값과 상호 배타적인 누락·빈 값 범주를 집계합니다. <br>
     * 중복 GUID는 한 번만 세며 레코드가 없는 GUID도 조회 대상 수에 포함합니다. <br>
     * 정확히 빈 문자열·null·컨테이너는 values에서 제외하고 각각의 GUID 목록으로 반환합니다.
     *
     * @param {Array<string>} path 조회할 원본 속성 경로
     * @param {import('./sequenceDataRuntime.js').USequencePropertyScopeOptions} [opt={}] 조회 대상 전체 GUID
     * @returns {import('../vo/sequenceDefinitionVos.js').USequencePropertyStatsVo} 고유 값과 누락 통계
     */
    getStatistics(path: Array<string>, opt?: USequencePropertyScopeOptions): USequencePropertyStatsVo;
    /**
     * 조회 범위를 검증하고 중복을 제거합니다.
     *
     * @param {Array<string> | undefined} objectIds 지정 범위 또는 전체 범위의 undefined
     * @returns {Array<string>} 원래 순서의 고유 GUID 목록
     */
    _scope(objectIds: Array<string> | undefined): Array<string>;
    /**
     * 동일 자료의 속성을 검증하고 객체별 경로를 한 번 발견합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceObjectPropertyVo>} objects 원본 속성 목록
     * @returns {Map<string, import('./sequenceDataRuntime.js').USequencePropertyIndexEntry>} 원본과 독립적인 속성 색인
     */
    _buildIndex(objects: Array<USequenceObjectPropertyVo>): Map<string, USequencePropertyIndexEntry>;
    /**
     * 배열 인덱스를 펼치지 않고 레코드의 필드 경로를 발견합니다. <br>
     * 같은 경로 배열은 내부 색인에서만 공유하며 외부에는 복사하여 전달합니다.
     *
     * @param {import('../core/sequenceData.js').USequencePropertyJsonRecord} record 검사한 속성 레코드
     * @param {Map<string, Array<string>>} sharedPaths 같은 속성 경로의 키 배열을 재사용할 색인
     * @returns {Array<Array<string>>} 해당 객체의 필드 경로
     */
    _discoverPaths(record: USequencePropertyJsonRecord, sharedPaths: Map<string, Array<string>>): Array<Array<string>>;
    /**
     * 같은 경로에서 실제로 발견한 JSON 타입을 조회합니다.
     *
     * @param {Array<string>} path 검사할 경로
     * @param {Array<string>} ids 조회 범위
     * @returns {Array<string>} 처음 발견한 순서의 중복 없는 타입 이름
     */
    _fieldTypes(path: Array<string>, ids: Array<string>): Array<string>;
    /**
     * 객체 하나를 누락·빈 값 범주 또는 고유 scalar 값에 배정합니다.
     *
     * @param {string} id 조회할 GUID
     * @param {Array<string>} path 조회할 경로
     * @param {Record<string, Array<string>>} categories 누락·빈 값 유형별 GUID를 추가할 결과 목록
     * @param {Map<string | number | boolean, Array<string>>} values 고유 속성 값별 GUID를 추가할 결과 색인
     */
    _collectStatistic(id: string, path: Array<string>, categories: Record<string, Array<string>>, values: Map<string | number | boolean, Array<string>>): void;
}
/**
 * 이동 트랙과 검증 오류에 사용할 데이터 경로입니다.
 */
type USequenceValidationTrackEntry = {
    /**
     * 검사할 이동 트랙
     */
    track: USequenceTrackVo;
    /**
     * 오류에 표시할 데이터 경로
     */
    location: string;
};
/**
 * 직렬화에 사용할 기존 시퀀스 검증기 설정입니다.
 */
type USequenceSerializerCO = {
    /**
     * 빌릴 동기 검증기. 생략하면 기본 검증기를 생성합니다.
     */
    validationExecutor?: USequenceValidationExecutor | undefined;
};
/**
 * JSON 출력의 공백 설정입니다.
 */
type USequenceSerializeOptions = {
    /**
     * true이면 공백 2칸, false이면 압축 문자열
     */
    pretty?: boolean | undefined;
};
/**
 * 읽을 문서의 자료 식별자와 상대 주소 기준입니다.
 */
type USequenceParseOptions = {
    /**
     * 현재 연결 자료. id/format/revision/objectIdType을 비교하며 소유권 이전은 없습니다.
     */
    expectedContent: USequenceContentVo;
    /**
     * 문서의 HTTP(S) 위치. 상대 형상·속성 URI가 있으면 필수입니다.
     */
    baseUrl?: string | URL | undefined;
};
/**
 * 문서 JSON의 정본 필드와 중첩 객체 관계입니다.
 */
type USequenceDocumentSchema = {
    /**
     * 필수 camelCase 필드 목록
     */
    keys: ReadonlyArray<string>;
    /**
     * 중첩 VO 필드 목록
     */
    children: Array<USequenceDocumentChildSchema>;
};
/**
 * 중첩 VO의 단일·배열 구조입니다.
 */
type USequenceDocumentChildSchema = {
    /**
     * 부모 객체의 정본 필드 이름
     */
    name: string;
    /**
     * 배열이면 true
     */
    many: boolean;
    /**
     * 이전 문서에 없는 선택적 중첩 필드를 허용할지 여부
     */
    optional?: boolean | undefined;
    /**
     * 자식 객체 계약
     */
    schema: USequenceDocumentSchema;
};
/**
 * 속성 JSON 로더의 생성 옵션입니다.
 */
type USequencePropertyLoaderCO = {
    /**
     * 기본 fetch를 교체할 요청 함수
     */
    fetcher?: typeof fetch | undefined;
};
/**
 * 속성 파일 한 건의 요청 옵션입니다.
 */
type USequencePropertyLoadOptions = {
    /**
     * 상대 propertiesUri의 기준 URL. 보통 시퀀스 설정 파일 URL을 지정합니다.
     */
    baseUrl?: string | URL | undefined;
    /**
     * 요청과 응답 처리의 취소 신호
     */
    signal?: AbortSignal | undefined;
};
/**
 * 객체 속성 조회 실행기의 생성 옵션입니다.
 */
type USequencePropertyQueryExecutorCO = {
    /**
     * 조회할 자료 식별자
     */
    contentId?: string | undefined;
    /**
     * 같은 자료의 객체 속성 목록
     */
    objects?: USequenceObjectPropertyVo[] | undefined;
};
/**
 * 속성 조회의 GUID 범위입니다.
 */
type USequencePropertyScopeOptions = {
    /**
     * 전체 조회 범위. 생략하면 속성 레코드 전체를 사용합니다.
     */
    objectIds?: string[] | undefined;
};
/**
 * 필드 목록의 조회 범위입니다.
 */
type USequencePropertyFieldOptions = {
    /**
     * 조회할 GUID 범위
     */
    objectIds?: string[] | undefined;
    /**
     * 속성셋 이름. null이면 속성셋 외 필드만 조회합니다.
     */
    propertySet?: string | null | undefined;
};
/**
 * 객체별 원본 스냅샷과 한 번 발견한 필드 경로입니다.
 */
type USequencePropertyIndexEntry = {
    /**
     * 소유한 원본 레코드
     */
    record: USequencePropertyJsonRecord;
    /**
     * 동일 경로를 공유하는 내부 읽기 전용 배열
     */
    paths: Array<Array<string>>;
    /**
     * 해당 객체의 속성셋 이름
     */
    propertySets: Array<string>;
};

/**
 * 등록형 Player의 FeaturePort이며 형상/시계/IO를 소유하지 않고 기존 순수 계산기를 재사용합니다.
 */
declare class USequenceConstructionPlanExecutor {
    /**
     * USequenceConstructionPlanExecutor 클래스 생성자입니다. <br>
     * 선택 기준점 함수를 보관하며 준비·형상 조회·시계 구동을 시작하지 않습니다.
     *
     * @param {import('./sequenceConstructionRuntime.js').USequenceConstructionPlanExecutorCO} [opt={}] 빌린 기준점 함수, resolver/converter는 동기 함수 또는null
     */
    constructor(opt?: USequenceConstructionPlanExecutorCO$1);
    /** @type {Required<USequenceConstructionPlanExecutorCO>} */ _options: Required<USequenceConstructionPlanExecutorCO$1>;
    /** @type {any} */ _context: any;
    /**
     * @type {import('../vo/sequenceDefinitionVos.js').USequenceFeatureVo | null}
     */ _source: USequenceFeatureVo | null;
    /** @type {USequenceConstructionSequence|null} */ _sequence: USequenceConstructionSequence | null;
    /** @type {any} */ _runtime: any;
    /** @type {any} */ _base: any;
    /** @type {Map<string, { min: Array<number>; max: Array<number>; }>} */ _geometry: Map<string, {
        min: Array<number>;
        max: Array<number>;
    }>;
    _disposed: boolean;
    /**
     * 기존1.0 검증·2.0 원문 매핑과 자료 전체의 쓰기 충돌을 확인합니다.
     *
     * @param {any} feature 독립 설정 사본, 변경 없음
     * @param {any} definition 전체 정의 사본, 변경 없음
     * @param {string} location 0기반 기능 오류 경로
     */
    validate(feature: any, definition: any, location: string): void;
    /**
     * construction이 소유하는 자료의 이동·표시 전체 점유를 독립 VO로 선언합니다.
     *
     * @param {any} feature 검증할 기능 사본
     * @param {any} definition 읽기 전용 전체 정의
     * @returns {Array<import('../vo/sequenceDefinitionVos.js').USequenceFeatureClaimVo>} 전체 자료 점유
     */
    getClaims(feature: any, definition: any): Array<USequenceFeatureClaimVo>;
    /**
     * 생략 기본값{} 또는 기존 분리율/축별 비율 스키마만 허용합니다.
     *
     * @param {any} state 기능 상태
     */
    validateState(state: any): void;
    /**
     * 복원 성공 뒤 공개할0분리 상태를 반환합니다.
     *
     * @param {any} state 읽기 전용 이전 상태
     * @returns {any} 복원 상태
     */
    getRestoredState(state: any): any;
    /**
     * 완전 기준 경계를 기다리고 자동 배치·전체 이동 범위를 준비합니다. <br>
     * 실제 장면 자세와 최초 카메라 선택은 변경하지 않습니다.
     *
     * @param {any} context 준비 문맥
     * @param {any} signal 자기 취소, Runtime 소유 빌린 취소 신호
     * @returns {Promise<void>} 완전 경계/범위 준비
     */
    prepare(context: any, signal: any): Promise<void>;
    /**
     * 확정 기준으로만 대상 상태를 순수 계산합니다. <br>
     * 새 카메라 확정에는 transaction plan을 사용합니다.
     *
     * @param {any} input 프레임, 유한 상대 초·같은 시퀀스
     * @param {any} [state={}] 기능 상태, 독립 복사
     * @returns {Array<import('../vo/sequenceDefinitionVos.js').USequenceTargetStateVo>} 사본
     */
    evaluate(input: any, state?: any): Array<USequenceTargetStateVo>;
    /**
     * 새 기준점·순서·문서 변경을 stage하고 성공 시에만 확정하는 자기 commit/rollback 계획을 만듭니다.
     *
     * @param {any} input 같은 시퀀스·유한 상대 초, 변경 없음
     * @param {any} [state={}] 기본{}, 그 프레임의 분리 상태 사본
     * @returns {any} 자기 계획 token
     */
    plan(input: any, state?: any): any;
    /**
     * 자기 소유 참조·숫자 경계를 해제하며 빌린 함수·앱·메쉬는 종료하지 않습니다.
     */
    dispose(): void;
    /**
     * 생성 설정 직접 교체를 거부합니다.
     *
     * @param {{ referencePositionResolver: null | function():Array<number>; referencePositionConverter: null | function(Array<number>, import('../vo/sequenceDefinitionVos.js').USequenceCoordinateVo):Array<number>; }} value 대입 요청, 항상 거부·소유권 이전 없음
     */
    set options(value: {
        referencePositionResolver: null | (() => Array<number>);
        referencePositionConverter: null | ((arg0: Array<number>, arg1: USequenceCoordinateVo) => Array<number>);
    });
    /**
     * 빌린 기준점 함수 설정의 사본을 반환합니다.
     *
     * @returns {{ referencePositionResolver: null | function():Array<number>; referencePositionConverter: null | function(Array<number>, import('../vo/sequenceDefinitionVos.js').USequenceCoordinateVo):Array<number>; }} 빌린 기준점 함수 설정의 사본
     */
    get options(): {
        referencePositionResolver: null | (() => Array<number>);
        referencePositionConverter: null | ((arg0: Array<number>, arg1: USequenceCoordinateVo) => Array<number>);
    };
    /**
     * 준비 문맥 직접 교체를 거부합니다.
     *
     * @param {boolean} value 대입 요청, 항상 거부
     */
    set context(value: boolean);
    /**
     * native 참조 없는 준비 여부를 반환합니다.
     *
     * @returns {boolean} native 참조 없는 준비 여부
     */
    get context(): boolean;
    /**
     * 설정 직접 교체를 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceFeatureVo | null} value 대입 요청, 항상 거부
     */
    set source(value: USequenceFeatureVo | null);
    /**
     * 마지막 확정 기능 설정 사본을 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceFeatureVo | null} 마지막 확정 기능 설정 사본
     */
    get source(): USequenceFeatureVo | null;
    /**
     * 확정 설정 직접 교체를 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo | null} value 대입 요청, 항상 거부
     */
    set sequence(value: USequenceVo | null);
    /**
     * 마지막 확정1.0 설정 사본을 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceVo | null} 마지막 확정1.0 설정 사본
     */
    get sequence(): USequenceVo | null;
    /**
     * 계산 기록 직접 교체를 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo | null} value 대입 요청, 항상 거부
     */
    set runtime(value: USequenceVo | null);
    /**
     * 확정 점층/분리 일정 사본 또는null을 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceVo | null} 확정 점층/분리 일정 사본 또는null
     */
    get runtime(): USequenceVo | null;
    /**
     * 초기 계산 기록 직접 교체를 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo | null} value 대입 요청, 항상 거부
     */
    set base(value: USequenceVo | null);
    /**
     * 초기 준비 일정 사본 또는null을 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceVo | null} 초기 준비 일정 사본 또는null
     */
    get base(): USequenceVo | null;
    /**
     * 기준 경계 직접 교체를 거부합니다.
     *
     * @param {Map<any, any>} value 대입 요청, 항상 거부
     */
    set geometry(value: Map<any, any>);
    /**
     * 확정 숫자 경계를 깊은 사본으로 반환합니다.
     *
     * @returns {Map<any, any>} 확정 숫자 경계를 깊은 사본으로 반환합니다.
     */
    get geometry(): Map<any, any>;
    /**
     * 수명 상태 직접 교체를 거부합니다.
     *
     * @param {boolean} value 대입 요청, 항상 거부
     */
    set disposed(value: boolean);
    /**
     * 자기 참조의 해제 여부를 반환합니다.
     *
     * @returns {boolean} 자기 참조의 해제 여부
     */
    get disposed(): boolean;
    #private;
}
/**
 * 확정 시퀀스와 현재 상대 초에서 그룹별 표시·진행률·조립 이동량을 계산합니다.
 */
declare class USequenceStateExecutor {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceStateExecutor 클래스 생성자입니다. <br>
     * 시퀀스 사본과 그룹별 시간순 트랙 색인을 생성합니다.
     *
     * @param {import('./sequenceConstructionRuntime.js').USequenceStateExecutorCO} opt 확정 시퀀스와 빌릴 선택적 검증기
     */
    constructor(opt: USequenceStateExecutorCO);
    _validationExecutor: USequenceValidationExecutor;
    _sequence: USequenceVo;
    _tracksByGroup: Map<string, USequenceTrackVo[]>;
    /**
     * 새 시퀀스의 검증·색인이 모두 성공하면 평가 기준을 교체합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} value 원본과 중첩 컨테이너를 공유하지 않을 새 확정 시퀀스
     */
    set sequence(value: USequenceVo);
    /**
     * 평가 기준 시퀀스를 중첩 VO까지 복사하여 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceVo} 내부 스냅샷과 독립적인 시퀀스
     */
    get sequence(): USequenceVo;
    /**
     * 새 검증기로 현재 시퀀스를 확인하고 검증기·스냅샷·색인을 함께 교체합니다.
     *
     * @param {import('../legacy/sequenceDataRuntime.js').USequenceValidationExecutor} value 호출자가 계속 소유하는 새 검증기 참조
     */
    set validationExecutor(value: USequenceValidationExecutor);
    /**
     * 생성 또는 시퀀스 교체에 사용하는 검증기 참조를 반환합니다.
     *
     * @returns {import('../legacy/sequenceDataRuntime.js').USequenceValidationExecutor} 빌린 검증기 또는 자원 없는 기본 검증기
     */
    get validationExecutor(): USequenceValidationExecutor;
    /**
     * 시퀀스와 불일치하는 색인의 직접 교체를 차단합니다.
     *
     * @param {Map<string, Array<import('../vo/sequenceDefinitionVos.js').USequenceTrackVo>>} value 재구축할 색인(직접 변경 불가, sequence 설정 사용)
     */
    set tracksByGroup(value: Map<string, Array<USequenceTrackVo>>);
    /**
     * 트랙 없는 그룹까지 포함한 시간순 트랙 색인을 복사하여 반환합니다.
     *
     * @returns {Map<string, Array<import('../vo/sequenceDefinitionVos.js').USequenceTrackVo>>} 내부 캐시와 독립적인 Map·목록·트랙
     */
    get tracksByGroup(): Map<string, Array<USequenceTrackVo>>;
    /**
     * 전체 그룹을 원래 그룹 순서로 평가합니다.
     *
     * @param {number} time 평가할 유한한 상대 시간(초, 재생 범위 밖 허용)
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceFrameStateVo} 내부 스냅샷·다른 프레임과 독립적인 결과
     * @throws {TypeError | RangeError} 시각 형식 또는 계산 결과가 허용 범위를 벗어나면 발생합니다.
     */
    evaluate(time: number): USequenceFrameStateVo;
    /**
     * 한 그룹만 평가하여 타일 재로드 등 후속 적용에 사용합니다.
     *
     * @param {string} groupId 현재 시퀀스에 존재하는 그룹 ID
     * @param {number} time 자동 보정하지 않을 유한한 상대 초
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceGroupStateVo} 독립적인 그룹 상태
     * @throws {TypeError | RangeError} 시각·그룹 형식이 잘못되거나 그룹이 없으면 발생합니다.
     */
    evaluateGroup(groupId: string, time: number): USequenceGroupStateVo;
    /**
     * 트랙 관계와 현재 시각으로 대기·이동·유지·완료를 판정합니다.
     *
     * @param {string} groupId 색인에 존재하는 그룹 ID
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceTrackVo>} tracks 읽기 전용 시간순 트랙
     * @param {number} time 검증된 유한 상대 초
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceGroupStateVo} 계산한 그룹 상태
     */
    _evaluateTracks(groupId: string, tracks: Array<USequenceTrackVo>, time: number): USequenceGroupStateVo;
    /**
     * 0~1 진행률에 보간과 기준 트랙 정보를 적용합니다.
     *
     * @param {string} groupId 평가할 그룹 ID
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceTrackVo} track 읽기 전용 기준 트랙
     * @param {'pending' | 'active' | 'holding' | 'completed'} state 시각 관계로 결정한 상태
     * @param {boolean} visible 원본·타일 조건과 별도로 합성할 논리 표시 여부
     * @param {number} progress 검증된 0~1 시간 진행률
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceGroupStateVo} 조립 이동량을 포함하는 독립 상태
     */
    _stateForTrack(groupId: string, track: USequenceTrackVo, state: "pending" | "active" | "holding" | "completed", visible: boolean, progress: number): USequenceGroupStateVo;
    /**
     * 시간순 트랙에서 현재 시각 이전에 마지막으로 시작한 트랙을 찾습니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceTrackVo>} tracks 시작 시각이 증가하는 읽기 전용 목록
     * @param {number} time 검증된 유한 상대 초
     * @returns {number} 0 기반 트랙 인덱스. <br>
     * 첫 트랙 전이면 -1입니다.
     */
    _trackIndex(tracks: Array<USequenceTrackVo>, time: number): number;
    /**
     * 기준 위치에서 시작·완료 ENU 이동량을 보간하며 경계 값은 그대로 반환합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceTrackVo} track 읽기 전용 기준 트랙
     * @param {number} progress 검증된 0~1 보간 진행률
     * @returns {[ number, number, number ]} 동·북·상 순서의 독립 조립 이동량(m)
     */
    _offset(track: USequenceTrackVo, progress: number): [number, number, number];
    /**
     * 같은 부호와 다른 부호를 나누어 유한 끝점 사이를 안정적으로 보간합니다.
     *
     * @param {number} from 유한한 시작 이동량(m)
     * @param {number} to 유한한 완료 이동량(m)
     * @param {number} progress 0보다 크고 1보다 작은 보간 진행률
     * @returns {number} 유한한 보간 이동량(m)
     */
    _interpolateAxis(from: number, to: number, progress: number): number;
    /**
     * 그룹 순서를 유지하며 시간순 트랙 사본을 색인합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} sequence 검증이 끝난 독립 시퀀스
     * @returns {Map<string, Array<import('../vo/sequenceDefinitionVos.js').USequenceTrackVo>>} 독립 시간순 색인
     */
    _buildIndex(sequence: USequenceVo): Map<string, Array<USequenceTrackVo>>;
    /**
     * 트랙의 시작 시각을 비교합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceTrackVo} left 읽기 전용 첫 트랙
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceTrackVo} right 읽기 전용 다음 트랙
     * @returns {number} 시작 시각의 정렬 순서
     */
    _compareStart(left: USequenceTrackVo, right: USequenceTrackVo): number;
    /**
     * 입력 시퀀스를 복사한 뒤 기존 계약으로 검증합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} value 원본을 변경하지 않을 확정 시퀀스
     * @param {import('../legacy/sequenceDataRuntime.js').USequenceValidationExecutor} validator 복사본을 읽기 전용으로 검사할 검증기
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceVo} 검증된 독립 스냅샷
     */
    _validatedCopy(value: USequenceVo, validator: USequenceValidationExecutor): USequenceVo;
    /**
     * 상대 시각의 타입과 유한성을 확인합니다.
     *
     * @param {number} time 음수·소수·timeline 밖도 허용하는 상대 초
     */
    _checkTime(time: number): void;
    /**
     * 기존 검증기의 인스턴스인지 확인합니다.
     *
     * @param {import('../legacy/sequenceDataRuntime.js').USequenceValidationExecutor} value 빌릴 검증기 참조
     */
    _requireValidator(value: USequenceValidationExecutor): void;
}
/**
 * 현재 시각별 상태 계산기의 생성 옵션입니다.
 *
 * @typedef {object} USequenceStateExecutorCO
 * @property {import("../vo/sequenceDefinitionVos.js").USequenceVo} sequence 원본을 변경하지 않을 확정 시퀀스
 * @property {import("../legacy/sequenceDataRuntime.js").USequenceValidationExecutor} [validationExecutor] 빌릴 검증기. 생략하면 자원 없는 기본 검증기를 생성합니다.
 */
/**
 * 현재 조립 프레임과 독립 분리율에서 그룹별 분리·최종 ENU 이동량을 계산합니다.
 */
declare class USequenceExplodeExecutor {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceExplodeExecutor 클래스 생성자입니다. <br>
     * 검증한 독립 시퀀스와 그룹별 전량 분리 거리 색인을 구성합니다.
     *
     * @param {import('./sequenceConstructionRuntime.js').USequenceExplodeExecutorCO} opt 원본과 배열을 공유하지 않을 필수 확정 시퀀스
     */
    constructor(opt: USequenceExplodeExecutorCO);
    /**
     * 새 시퀀스의 검증·색인이 성공하면 기존 문맥을 함께 교체합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} value 검증 후 중첩 복사할 확정 시퀀스
     */
    set sequence(value: USequenceVo);
    /**
     * 확정 시퀀스의 중첩 사본을 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceVo} 내부와 독립적인 사본
     */
    get sequence(): USequenceVo;
    _sequence: USequenceVo | undefined;
    _explodeOffsetsByGroup: Map<any, any> | undefined;
    /**
     * 시퀀스와 어긋나는 직접 분리 거리 교체를 차단합니다.
     *
     * @param {Map<string, Array<number>>} value 재구축할 색인(직접 변경 불가, sequence 설정 사용)
     */
    set explodeOffsetsByGroup(value: Map<string, Array<number>>);
    /**
     * 그룹별 전량 분리 거리(m)를 Map·벡터까지 복사하여 반환합니다.
     *
     * @returns {Map<string, Array<number>>} 독립 그룹 ID→ENU 벡터 색인
     */
    get explodeOffsetsByGroup(): Map<string, Array<number>>;
    /**
     * 입력의 순수 조립 이동량에서 새 분리·합산 프레임을 계산합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceFrameStateVo} frame 같은 자료·시퀀스의 읽기 전용 프레임
     * @param {number} [explodeRatio=0] 분리율(유한수 0~1, 기본값 0, 자동 보정 없음)
     * @param {Array<number> | null} [explodeAxisRatios=null] X·Y·Z 축별 분리율(각 0~1, null이면 전역 비율 사용)
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceFrameStateVo} 시각·표시·조립 이동을 보존한 독립 합산 프레임
     * @throws {TypeError | RangeError | Error} 프레임·그룹·비율·벡터 또는 합산 범위가 잘못되면 발생합니다.
     */
    evaluate(frame: USequenceFrameStateVo, explodeRatio?: number, explodeAxisRatios?: Array<number> | null): USequenceFrameStateVo;
    /**
     * 한 그룹의 원래 조립 이동량과 전량 분리 거리를 합성합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceGroupStateVo} state 이 평가에서만 소유하는 출력 그룹 사본
     * @param {Array<number>} ratios 검증한 X·Y·Z 순서의 무차원 분리율 3개
     */
    _compose(state: USequenceGroupStateVo, ratios: Array<number>): void;
    /**
     * 0·1 끝점과 부호 있는 0을 보존하며 분리 이동량을 계산합니다.
     *
     * @param {Array<number>} distance 읽기 전용 전량 ENU 분리 거리(m) 3개
     * @param {Array<number>} ratios 검증한 X·Y·Z 순서의 무차원 분리율 3개
     * @returns {Array<number>} 독립 분리 이동량(m)
     */
    _separation(distance: Array<number>, ratios: Array<number>): Array<number>;
    /**
     * 입력 프레임의 자료·시퀀스·유한 상대 시각을 확인합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceFrameStateVo} frame 읽기 전용 현재 프레임
     */
    _checkFrame(frame: USequenceFrameStateVo): void;
    /**
     * 강제 변환 없이 분리율 형식과 범위를 확인합니다.
     *
     * @param {number} ratio 유한한 0~1 무차원 분리율
     */
    _checkRatio(ratio: number): void;
    /**
     * ENU 벡터의 길이·원소 형식·유한성을 확인합니다.
     *
     * @param {Array<number>} vector 읽기 전용 숫자 벡터
     * @param {string} label 오류에 표시할 의미 있는 벡터 이름
     */
    _checkVector(vector: Array<number>, label: string): void;
    _checkAxisRatios(ratios: any): void;
}
/**
 * 현재 프레임의 조립·분리 이동량을 합성하는 생성 옵션입니다.
 *
 * @typedef {object} USequenceExplodeExecutorCO
 * @property {import("../vo/sequenceDefinitionVos.js").USequenceVo} sequence 검증·중첩 복사할 확정 시퀀스. 그룹별 explodeOffset은 ENU 미터입니다.
 */
/**
 * 전체 조립 구간과 분리율 0~1을 포함하는 보수적 ENU·월드 이동 범위를 계산합니다.
 */
declare class USequenceBoundsExecutor {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceBoundsExecutor 클래스 생성자입니다. <br>
     * 확정 시퀀스와 기존 메쉬 적용기와 같은 월드 배율을 보관합니다.
     *
     * @param {import('./sequenceConstructionRuntime.js').USequenceBoundsExecutorCO} opt 검증·복사할 시퀀스와 유한 양수 배율
     */
    constructor(opt: USequenceBoundsExecutorCO);
    /**
     * 검증이 성공한 새 시퀀스만 교체합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} value 독립 복사할 확정 시퀀스
     */
    set sequence(value: USequenceVo);
    /**
     * 확정 시퀀스의 독립 중첩 사본을 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceVo} 내부와 배열을 공유하지 않는 사본
     */
    get sequence(): USequenceVo;
    /**
     * 같은 메쉬 적용기의 월드 배율을 보관합니다.
     *
     * @param {number} value 월드 단위/m 배율(유한한 양수)
     */
    set worldUnitsPerMeter(value: number);
    /**
     * 월드 이동량 환산 배율을 반환합니다.
     *
     * @returns {number} 유한 양수인 월드 단위/m 배율
     */
    get worldUnitsPerMeter(): number;
    _sequence: USequenceVo | undefined;
    _worldUnitsPerMeter: number | undefined;
    /**
     * 전체 시공·분리 범위를 원본과 독립된 VO로 계산합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceOffsetBoundsVo} 0 이동을 포함하는 ENU·월드 최소·최대 이동량
     */
    evaluate(): USequenceOffsetBoundsVo;
    /**
     * 같은 그룹의 조립 끝점들을 누적 범위에 포함합니다.
     *
     * @param {object} range 이 평가가 소유하며 min/max 배열을 갱신할 범위
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceTrackVo} track 읽기 전용 조립 트랙
     */
    _includeTrack(range: object, track: USequenceTrackVo): void;
    /**
     * 한 그룹의 조립 범위에 독립 분리 범위를 합쳐 전체 범위에 포함합니다.
     *
     * @param {Array<number>} min 이 평가가 갱신하는 전체 ENU 최소값 3개
     * @param {Array<number>} max 이 평가가 갱신하는 전체 ENU 최대값 3개
     * @param {object} range 읽기 전용 그룹 조립 범위
     * @param {Array<number>} distance 읽기 전용 그룹 전량 ENU 분리 거리(m) 3개
     */
    _includeGroup(min: Array<number>, max: Array<number>, range: object, distance: Array<number>): void;
    /**
     * 같은 메쉬 적용 배율로 ENU 범위를 월드 축에 환산합니다.
     *
     * @param {Array<number>} vector 읽기 전용 ENU 최소 또는 최대값(m) 3개
     * @returns {Array<number>} 독립 월드 이동량 배열
     */
    _scale(vector: Array<number>): Array<number>;
    /**
     * 합산·배율 결과의 표현 범위를 확인합니다.
     *
     * @param {number} value 계산한 유한 숫자 후보
     */
    _finite(value: number): void;
}
type USequenceConstructionPlanExecutorCO$1 = {
    /**
     * 최초 기존 world 기준점 동기 조회, 기본null·빌림
     */
    referencePositionResolver?: (() => Array<number>) | null | undefined;
    /**
     * 기존world→선언ENU미터 변환, 기본null·빌림
     */
    referencePositionConverter?: ((point: Array<number>, coordinate: USequenceCoordinateVo) => Array<number>) | null | undefined;
};
/**
 * 의미 검증이 완료된 내부 설정
 */
type USequenceConstructionSequence = USequenceVo & {
    content: NonNullable<USequenceVo["content"]> & {
        id: string;
    };
    timeline: NonNullable<USequenceVo["timeline"]> & {
        startTime: number;
    };
};
/**
 * 현재 시각별 상태 계산기의 생성 옵션입니다.
 */
type USequenceStateExecutorCO = {
    /**
     * 원본을 변경하지 않을 확정 시퀀스
     */
    sequence: USequenceVo;
    /**
     * 빌릴 검증기. 생략하면 자원 없는 기본 검증기를 생성합니다.
     */
    validationExecutor?: USequenceValidationExecutor | undefined;
};
/**
 * 현재 프레임의 조립·분리 이동량을 합성하는 생성 옵션입니다.
 */
type USequenceExplodeExecutorCO = {
    /**
     * 검증·중첩 복사할 확정 시퀀스. 그룹별 explodeOffset은 ENU 미터입니다.
     */
    sequence: USequenceVo;
};
/**
 * 전체 시공·분리 이동 범위를 계산하는 실행기 생성 옵션입니다.
 */
type USequenceBoundsExecutorCO = {
    /**
     * 검증·중첩 복사할 확정 시퀀스
     */
    sequence: USequenceVo;
    /**
     * 같은 조립 실행기의 transformExecutor.worldUnitsPerMeter에서 얻은 유한 양수. 단위는 월드 단위/m
     */
    worldUnitsPerMeter: number;
};

/** @import {USequencePropertyJsonRecord} from "../core/sequenceData.js" */
/** @import {USequenceGroupVoCO,USequencePhaseVoCO,USequenceTrackVoCO,USequenceTimelineVoCO} from "../vo/sequenceDefinitionVos.js" */
/**
 * 속성 조건과 수동 포함·제외로 GUID별 그룹 후보를 계산합니다.
 */
declare class USequenceGroupClassificationExecutor {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceGroupClassificationExecutor 클래스 생성자입니다.
     *
     * @param {import('./sequenceEditingRuntime.js').USequenceGroupClassificationExecutorCO} [opt={}] 사용할 속성 조회 실행기 설정
     */
    constructor(opt?: USequenceGroupClassificationExecutorCO);
    /**
     * 이후 분류에 사용할 조회 실행기를 교체합니다. <br>
     * 이전·새 실행기의 상태와 소유권은 변경하지 않습니다.
     *
     * @param {import('./sequenceDataRuntime.js').USequencePropertyQueryExecutor} value 앱이 소유한 기존 조회 실행기
     */
    set queryExecutor(value: USequencePropertyQueryExecutor);
    /**
     * 앱이 소유하는 기존 속성 조회 실행기 참조를 반환합니다.
     *
     * @returns {import('./sequenceDataRuntime.js').USequencePropertyQueryExecutor} 빌린 조회 실행기 참조
     */
    get queryExecutor(): USequencePropertyQueryExecutor;
    _queryExecutor: USequencePropertyQueryExecutor | undefined;
    /**
     * 조건·수동 참조를 실행하여 복사한 후보와 배정 근거를 반환합니다. <br>
     * 같은 GUID를 두 그룹 이상이 선택하면 우선순위를 정하지 않고 충돌로 표시합니다. <br>
     * 전체 형상 범위는 필수이며 범위의 실제 완전성은 호출자가 확인해야 합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceGroupVo>} groups 독립 복사할 그룹 목록
     * @param {import('./sequenceEditingRuntime.js').USequenceGroupClassificationOptions} opt 전체 형상 GUID 범위
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceGroupClassificationVo} 후보·근거·미분류·충돌·참조 문제
     * @throws {TypeError | RangeError} 입력 형식·조건·그룹 ID가 계약을 위반하면 발생합니다.
     */
    classify(groups: Array<USequenceGroupVo>, opt: USequenceGroupClassificationOptions): USequenceGroupClassificationVo;
    /**
     * 같은 기준으로 다시 분류하고 문제가 없을 때만 새 그룹 목록을 반환합니다. <br>
     * 미분류와 속성 누락은 진단에 남기며 그것만으로 확정을 차단하지 않습니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceGroupVo>} groups 확정할 그룹 목록
     * @param {import('./sequenceEditingRuntime.js').USequenceGroupClassificationOptions} opt 전체 형상 GUID 범위
     * @returns {Array<import('../vo/sequenceDefinitionVos.js').USequenceGroupVo>} objectIds를 새로 계산한 독립 그룹 목록
     * @throws {RangeError} 그룹 간 충돌 또는 범위 밖 수동 참조가 있으면 발생합니다.
     */
    finalize(groups: Array<USequenceGroupVo>, opt: USequenceGroupClassificationOptions): Array<USequenceGroupVo>;
    /**
     * 원본 그룹을 복사하여 고유 ID와 조건·수동 참조를 검사합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceGroupVo>} groups 분류할 그룹
     * @returns {Array<import('./sequenceEditingRuntime.js').USequenceGroupClassificationPlan>} 입력 순서의 실행 계획
     */
    _prepareGroups(groups: Array<USequenceGroupVo>): Array<USequenceGroupClassificationPlan>;
    /**
     * 비교 값 개수와 타입을 검사하고 조건을 실행할 형태로 복사합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequencePropertyRuleVo>} rules 검사할 분류 조건
     * @param {string} location 오류에 표시할 데이터 경로
     * @returns {Array<import('./sequenceEditingRuntime.js').USequenceGroupRulePlan>} 원본과 독립적인 조건 계획
     */
    _prepareRules(rules: Array<USequencePropertyRuleVo>, location: string): Array<USequenceGroupRulePlan>;
    /**
     * 비교 연산자별 값 개수를 확인합니다.
     *
     * @param {string} operator equals·in·exists 중 검증한 연산자
     * @param {number} count 0 이상의 비교 값 개수
     * @param {string} location 오류에 표시할 데이터 경로
     */
    _valueCount(operator: string, count: number, location: string): void;
    /**
     * 같은 호출에서 사용할 속성 스냅샷만 보관합니다.
     *
     * @param {import('./sequenceDataRuntime.js').USequencePropertyQueryExecutor} query 앱이 소유한 조회 실행기
     * @param {Array<string>} ids 중복 없는 전체 형상 GUID 목록
     * @param {string} contentId 분류 시작 시 확인한 자료 ID
     * @returns {Map<string, import('../core/sequenceData.js').USequencePropertyJsonRecord>} 해당 범위의 독립 속성 스냅샷
     */
    _snapshotRecords(query: USequencePropertyQueryExecutor, ids: Array<string>, contentId: string): Map<string, USequencePropertyJsonRecord>;
    /**
     * 범위의 각 GUID에 대해 배정 근거를 모을 목록을 준비합니다.
     *
     * @param {Array<string>} ids 중복 없는 전체 형상 GUID 목록
     * @returns {Map<string, import('./sequenceEditingRuntime.js').USequenceGroupAssignmentEntry>} 내부 작업 목록
     */
    _createEntries(ids: Array<string>): Map<string, USequenceGroupAssignmentEntry>;
    /**
     * 한 그룹의 조건과 포함·제외를 실행하여 근거와 최종 후보를 기록합니다.
     *
     * @param {import('./sequenceEditingRuntime.js').USequenceGroupClassificationPlan} plan 실행할 그룹 계획
     * @param {Array<string>} ids 전체 형상 GUID 목록
     * @param {Map<string, import('../core/sequenceData.js').USequencePropertyJsonRecord>} records 읽기 전용 속성 스냅샷
     * @param {Map<string, import('./sequenceEditingRuntime.js').USequenceGroupAssignmentEntry>} entries GUID별로 갱신할 배정 근거
     */
    _runGroup(plan: USequenceGroupClassificationPlan, ids: Array<string>, records: Map<string, USequencePropertyJsonRecord>, entries: Map<string, USequenceGroupAssignmentEntry>): void;
    /**
     * 빈 조건은 자동 선택하지 않고 all·any의 조건 결합을 실행합니다.
     *
     * @param {undefined | import('../core/sequenceData.js').USequencePropertyJsonRecord} record 원본 속성 또는 레코드 누락
     * @param {import('./sequenceEditingRuntime.js').USequenceGroupClassificationPlan} plan 검사할 그룹
     * @returns {boolean} 그룹 조건 일치 여부
     */
    _matchesGroup(record: undefined | USequencePropertyJsonRecord, plan: USequenceGroupClassificationPlan): boolean;
    /**
     * own property 존재 또는 원본 scalar 타입의 값 일치를 검사합니다.
     *
     * @param {import('../core/sequenceData.js').USequencePropertyJsonRecord} record 읽기 전용 원본 속성
     * @param {import('./sequenceEditingRuntime.js').USequenceGroupRulePlan} rule 검증한 비교 계획
     * @returns {boolean} 해당 조건의 일치 여부
     */
    _matchesRule(record: USequencePropertyJsonRecord, rule: USequenceGroupRulePlan): boolean;
    /**
     * 문자열에만 요청한 소문자 비교를 적용합니다.
     *
     * @param {string | number | boolean} value 원본 scalar 비교 값
     * @param {boolean} caseSensitive 문자열 대소문자 구분 여부
     * @returns {string | number | boolean} 타입과 공백을 보존한 비교 값
     */
    _normalizeValue(value: string | number | boolean, caseSensitive: boolean): string | number | boolean;
    /**
     * 수동 포함·제외의 범위 밖 참조를 원본 필드별로 기록합니다.
     *
     * @param {import('./sequenceEditingRuntime.js').USequenceGroupClassificationPlan} plan 검사할 그룹
     * @param {Set<string>} scope 전체 형상 GUID 집합
     * @returns {Array<import('../vo/sequenceDefinitionVos.js').USequenceGroupReferenceIssueVo>} 범위 밖 참조 목록
     */
    _referenceIssues(plan: USequenceGroupClassificationPlan, scope: Set<string>): Array<USequenceGroupReferenceIssueVo>;
    /**
     * 객체별 근거에서 상태를 계산하여 독립 결과 VO를 만듭니다.
     *
     * @param {string} contentId 속성 자료 ID
     * @param {Array<string>} ids 전체 형상 GUID 목록
     * @param {Array<import('./sequenceEditingRuntime.js').USequenceGroupClassificationPlan>} plans 입력 순서의 그룹 계획
     * @param {Map<string, import('../core/sequenceData.js').USequencePropertyJsonRecord>} records 읽기 전용 속성 스냅샷
     * @param {Map<string, import('./sequenceEditingRuntime.js').USequenceGroupAssignmentEntry>} entries 갱신할 내부 배정 근거
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceGroupReferenceIssueVo>} references 범위 밖 참조 목록
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceGroupClassificationVo} 미리보기와 확정 가능 여부
     */
    _createResult(contentId: string, ids: Array<string>, plans: Array<USequenceGroupClassificationPlan>, records: Map<string, USequencePropertyJsonRecord>, entries: Map<string, USequenceGroupAssignmentEntry>, references: Array<USequenceGroupReferenceIssueVo>): USequenceGroupClassificationVo;
    /**
     * 필수 문자열과 빈 설명 문자열의 허용 범위를 검사합니다.
     *
     * @param {unknown} value 검사할 문자열
     * @param {string} location 오류에 표시할 데이터 경로
     * @param {boolean} [allowEmpty=false] 빈 문자열과 공백 문자열을 허용할지 여부(기본값 false)
     * @returns {string} 원래 표기를 유지한 문자열
     */
    _text(value: unknown, location: string, allowEmpty?: boolean): string;
    /**
     * GUID·경로 배열의 형식과 선택적인 중복 금지를 검사합니다.
     *
     * @param {Array<string>} values 검사할 원본 목록
     * @param {string} location 오류에 표시할 데이터 경로
     * @param {boolean} [unique=true] 중복 항목을 거부할지 여부(기본값 true)
     * @returns {Set<string>} 입력을 변경하지 않은 고유 값 집합
     */
    _idSet(values: Array<string>, location: string, unique?: boolean): Set<string>;
    /**
     * 비교 값이 유한한 숫자·문자열·boolean인지 검사합니다.
     *
     * @param {unknown} value 검사할 비교 값
     * @param {string} location 오류에 표시할 데이터 경로
     */
    _scalar(value: unknown, location: string): void;
    /**
     * 그룹 분리 이동 벡터의 길이와 유한한 숫자를 검사합니다.
     *
     * @param {Array<number>} value 동·북·상 순서의 미터 단위 이동 벡터
     * @param {string} location 오류에 표시할 데이터 경로
     */
    _vector(value: Array<number>, location: string): void;
}
/**
 * 속성 기반 그룹 분류 실행기의 생성 옵션입니다.
 *
 * @typedef {object} USequenceGroupClassificationExecutorCO
 * @property {import("./sequenceDataRuntime.js").USequencePropertyQueryExecutor} [queryExecutor] 앱이 소유하는 속성 조회 실행기
 */
/**
 * 그룹 분류에 사용할 전체 형상 GUID 범위입니다.
 *
 * @typedef {object} USequenceGroupClassificationOptions
 * @property {Array<string>} objectIds 전체 형상 GUID. 중복은 한 번만 세며 빈 범위는 그대로 사용합니다.
 */
/**
 * 한 번 검증한 속성 조건의 실행 계획입니다.
 *
 * @typedef {object} USequenceGroupRulePlan
 * @property {Array<string>} path 원본 속성 경로
 * @property {'equals'|'in'|'exists'} operator 비교 연산자
 * @property {Set<string | number | boolean>} values 타입을 보존하고 필요한 문자열만 소문자로 변환한 비교 값
 * @property {boolean} caseSensitive 문자열 대소문자 구분 여부
 *
 * @ignore
 */
/**
 * 그룹별 조건·수동 참조와 결과 보관 대상입니다.
 *
 * @typedef {object} USequenceGroupClassificationPlan
 * @property {string} id 검증한 그룹 ID
 * @property {import("../vo/sequenceDefinitionVos.js").USequenceGroupVo} group 입력에서 복사한 그룹
 * @property {Array<USequenceGroupRulePlan>} rules 검증한 조건
 * @property {'all'|'any'} ruleMatch 조건 결합 방식
 * @property {Set<string>} included 수동 포함 GUID
 * @property {Set<string>} excluded 수동 제외 GUID
 *
 * @ignore
 */
/**
 * 객체 하나의 분류 근거를 모으는 내부 작업 자료입니다.
 *
 * @typedef {object} USequenceGroupAssignmentEntry
 * @property {Array<string>} candidateGroupIds 최종 후보 그룹
 * @property {Array<string>} ruleGroupIds 조건 일치 그룹
 * @property {Array<string>} manualGroupIds 수동 포함 그룹
 * @property {Array<string>} excludedGroupIds 수동 제외 그룹
 *
 * @ignore
 */
/**
 * 원본과 독립된 그룹 편집 상태에서 변경·분류 미리보기·확정을 실행합니다.
 */
declare class USequenceGroupEditExecutor {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceGroupEditExecutor 클래스 생성자입니다. <br>
     * 전체 형상 범위와 시작 그룹으로 독립 편집 상태를 생성합니다.
     *
     * @param {import('./sequenceEditingRuntime.js').USequenceGroupEditExecutorCO} opt 호출자가 계속 소유할 분류 실행기와 복사할 그룹·전체 GUID
     */
    constructor(opt: USequenceGroupEditExecutorCO);
    _classificationExecutor: USequenceGroupClassificationExecutor;
    _initialGroups: USequenceGroupVo[];
    _state: USequenceGroupEditVo;
    /**
     * 같은 자료의 분류 실행기를 교체하고 이전 분류 결과를 무효화합니다.
     *
     * @param {import('./sequenceEditingRuntime.js').USequenceGroupClassificationExecutor} value 호출자가 계속 소유하는 실행기
     */
    set classificationExecutor(value: USequenceGroupClassificationExecutor);
    /**
     * 빌린 분류 실행기 참조를 반환합니다.
     *
     * @returns {import('./sequenceEditingRuntime.js').USequenceGroupClassificationExecutor} 호출자 소유의 실행기
     */
    get classificationExecutor(): USequenceGroupClassificationExecutor;
    /**
     * 취소 기준 그룹을 검증하고 편집 상태도 함께 초기화합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceGroupVo>} value 원본을 변경하지 않을 새 시작 그룹
     */
    set initialGroups(value: Array<USequenceGroupVo>);
    /**
     * 편집 취소의 기준 그룹을 복사하여 반환합니다.
     *
     * @returns {Array<import('../vo/sequenceDefinitionVos.js').USequenceGroupVo>} 독립 그룹 목록
     */
    get initialGroups(): Array<USequenceGroupVo>;
    /**
     * 같은 자료·전체 범위의 편집 상태를 검증하여 교체합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceGroupEditVo} value 입력을 복사하며 전달된 분류 결과는 무효화할 상태
     */
    set state(value: USequenceGroupEditVo);
    /**
     * 편집 상태를 중첩 VO까지 복사하여 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceGroupEditVo} 내부 상태와 독립적인 스냅샷
     */
    get state(): USequenceGroupEditVo;
    /**
     * 새 그룹을 추가하며 미지정 ID는 한 번 생성하여 유지합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceGroupVoCO} [opt={}] 새 그룹 설정(기본 이름은 새 그룹)
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceGroupVo} 추가한 그룹의 복사본
     */
    addGroup(opt?: USequenceGroupVoCO): USequenceGroupVo;
    /**
     * 기존 그룹의 지정 필드만 교체하고 안정적인 ID는 유지합니다.
     *
     * @param {string} groupId 변경 대상 그룹 ID
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceGroupVoCO} patch 변경할 그룹 필드(ID 변경 불가)
     */
    updateGroup(groupId: string, patch: USequenceGroupVoCO): void;
    /**
     * 그룹을 삭제하고 해당 그룹이 활성 상태였으면 선택을 해제합니다.
     *
     * @param {string} groupId 삭제할 그룹 ID
     */
    removeGroup(groupId: string): void;
    /**
     * 편집 대상 그룹을 선택하며 그룹 변경 여부는 바꾸지 않습니다.
     *
     * @param {string | null} groupId 그룹 ID 또는 선택을 해제하는 null
     */
    selectGroup(groupId: string | null): void;
    /**
     * 미로드 객체를 포함하여 전체 형상 범위 안의 GUID를 선택합니다.
     *
     * @param {Array<string>} objectIds 선택할 GUID 목록(중복 제거 후 복사)
     */
    selectObjects(objectIds: Array<string>): void;
    /**
     * 수동 포함·제외 목록에 GUID를 추가하거나 지정을 해제합니다.
     *
     * @param {string} groupId 편집 대상 그룹 ID
     * @param {'includeObjectIds' | 'excludeObjectIds'} sourceField 편집할 수동 지정 목록
     * @param {Array<string>} objectIds 추가는 전체 형상 범위 안의 GUID이며 해제는 기존 범위 밖 수동 참조도 허용합니다.
     * @param {'add' | 'remove'} operation 추가 또는 지정 해제 동작
     */
    editObjectIds(groupId: string, sourceField: "includeObjectIds" | "excludeObjectIds", objectIds: Array<string>, operation: "add" | "remove"): void;
    /**
     * 현재 조건과 전체 형상 범위로 최신 분류 미리보기를 계산합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceGroupClassificationVo} 후보·미분류·충돌 결과의 복사본
     */
    preview(): USequenceGroupClassificationVo;
    /**
     * 이전 미리보기를 신뢰하지 않고 현재 입력을 다시 분류하여 확정합니다.
     *
     * @returns {Array<import('../vo/sequenceDefinitionVos.js').USequenceGroupVo>} 원본 시퀀스에 자동 반영하지 않는 확정 그룹 복사본
     * @throws {RangeError} 충돌이나 범위 밖 참조가 남아 있으면 발생합니다.
     */
    finalize(): Array<USequenceGroupVo>;
    /**
     * 시작 그룹으로 편집을 취소하고 선택과 이전 분류 결과를 초기화합니다.
     */
    reset(): void;
    /**
     * 그룹 변경을 검증한 후 오래된 확정 GUID와 분류 결과를 무효화합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceGroupVo>} groups 적용할 변경 후보 사본
     * @param {string | null} activeGroupId 변경 후 편집할 그룹 ID 또는 null
     */
    _commitGroups(groups: Array<USequenceGroupVo>, activeGroupId: string | null): void;
    /**
     * 상태의 자료·전체 범위·조건·선택 관계를 검증합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceGroupEditVo} state 호출자가 소유권을 넘긴 독립 상태 사본
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceGroupEditVo} 분류 결과가 무효화된 검증 상태
     */
    _validateState(state: USequenceGroupEditVo): USequenceGroupEditVo;
    /**
     * 그룹 ID로 목록의 위치를 확인합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceGroupVo>} groups 읽기 전용 검색 목록
     * @param {string} id 공백이 아닌 그룹 ID
     * @returns {number} 0 기반 목록 인덱스
     */
    _groupIndex(groups: Array<USequenceGroupVo>, id: string): number;
    /**
     * VO의 공개 필드를 옵션 객체로 복사합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceGroupVo} group 읽기 전용 그룹 원본
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceGroupVoCO} 독립 생성 옵션
     */
    _groupOptions(group: USequenceGroupVo): USequenceGroupVoCO;
    /**
     * GUID 목록의 형식을 확인하고 중복을 제거합니다.
     *
     * @param {Array<string>} values 전체 또는 선택 GUID 목록(원래 표기와 최초 순서 유지)
     * @returns {Array<string>} 중복 없는 새 배열
     */
    _ids(values: Array<string>): Array<string>;
    /**
     * 선택 GUID를 현재 전체 형상 범위와 대조합니다.
     *
     * @param {Array<string>} values 선택 또는 수동 지정할 GUID 목록
     * @returns {Array<string>} 중복을 제거한 범위 안의 GUID
     */
    _scopeIds(values: Array<string>): Array<string>;
    /**
     * 올바른 분류 실행기 참조인지 확인합니다.
     *
     * @param {import('./sequenceEditingRuntime.js').USequenceGroupClassificationExecutor} value 빌린 분류 실행기
     */
    _requireExecutor(value: USequenceGroupClassificationExecutor): void;
    /**
     * 외부 조회 실행기의 자료 교체를 감지하여 서로 다른 자료의 혼합을 차단합니다.
     */
    _assertContent(): void;
}
/**
 * 전체 형상 범위를 기준으로 그룹 편집 사본을 만드는 옵션입니다.
 *
 * @typedef {object} USequenceGroupEditExecutorCO
 * @property {import("./sequenceEditingRuntime.js").USequenceGroupClassificationExecutor} classificationExecutor 호출자가 소유하는 기존 분류 실행기
 * @property {Array<import("../vo/sequenceDefinitionVos.js").USequenceGroupVo>} [groups=[]] 입력을 변경하지 않을 시작 그룹
 * @property {Array<string>} objectIds 호출자가 보장한 전체 형상 GUID 목록
 */
/**
 * 확정 그룹이 포함된 시퀀스 사본의 단계·시간·이동 트랙을 편집합니다.
 */
declare class USequenceScheduleEditExecutor {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceScheduleEditExecutor 클래스 생성자입니다. <br>
     * 유효한 시퀀스의 일정만 편집하는 독립 상태를 생성합니다.
     *
     * @param {import('./sequenceEditingRuntime.js').USequenceScheduleEditExecutorCO} opt 시작 시퀀스와 빌릴 선택적 검증기
     */
    constructor(opt: USequenceScheduleEditExecutorCO);
    _validationExecutor: USequenceValidationExecutor;
    _initialSequence: USequenceVo;
    _state: USequenceScheduleEditVo;
    /**
     * 시작·현재 시퀀스가 모두 유효한 경우에 검증기를 교체합니다.
     *
     * @param {import('./sequenceDataRuntime.js').USequenceValidationExecutor} value 호출자가 계속 소유하는 검증기
     */
    set validationExecutor(value: USequenceValidationExecutor);
    /**
     * 일정 검증에 사용하는 검증기 참조를 반환합니다.
     *
     * @returns {import('./sequenceDataRuntime.js').USequenceValidationExecutor} 자원 수명 변경이 없는 검증기 참조
     */
    get validationExecutor(): USequenceValidationExecutor;
    /**
     * 자료와 그룹이 같은 시퀀스로 취소 기준과 현재 일정을 함께 초기화합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} value 같은 자료·그룹에 적용할 새 시작 일정
     */
    set initialSequence(value: USequenceVo);
    /**
     * 편집 취소의 기준 시퀀스를 독립 복사하여 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceVo} 중첩 VO까지 복사한 시작 상태
     */
    get initialSequence(): USequenceVo;
    /**
     * 같은 자료·그룹의 유효한 일정과 선택을 교체하고 변경 여부를 다시 계산합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceScheduleEditVo} value 독립 복사할 편집 상태(dirty는 재계산)
     */
    set state(value: USequenceScheduleEditVo);
    /**
     * 일정과 선택 상태를 독립 복사하여 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceScheduleEditVo} 외부 변경이 내부 상태에 영향을 주지 않는 스냅샷
     */
    get state(): USequenceScheduleEditVo;
    /**
     * 전체 시간 범위·기준일을 변경하며 기존 단계·트랙이 범위를 벗어나면 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceTimelineVoCO} patch 변경할 시간축 필드(단위 second, epoch가 null이면 상대 시간)
     */
    updateTimeline(patch: USequenceTimelineVoCO): void;
    /**
     * 새 단계를 추가하며 생략한 시간은 전체 시간 범위를 사용합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePhaseVoCO} [opt={}] 새 단계 설정(ID 생략 시 자동 생성, 기본 이름은 새 단계)
     * @returns {import('../vo/sequenceDefinitionVos.js').USequencePhaseVo} 추가한 단계의 독립 사본
     */
    addPhase(opt?: USequencePhaseVoCO): USequencePhaseVo;
    /**
     * 단계의 이름·시간을 변경하고 기존 ID는 유지합니다.
     *
     * @param {string} phaseId 수정할 단계 ID
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePhaseVoCO} patch 변경할 단계 필드(ID 변경 불가)
     */
    updatePhase(phaseId: string, patch: USequencePhaseVoCO): void;
    /**
     * 단계를 삭제하며 소속 트랙이 있으면 명시적 동반 삭제 요청이 필요합니다.
     *
     * @param {string} phaseId 삭제할 단계 ID
     * @param {import('./sequenceEditingRuntime.js').USequenceScheduleRemovePhaseOptions} [opt={}] 단계 삭제 설정(removeTracks 기본값 false)
     */
    removePhase(phaseId: string, opt?: USequenceScheduleRemovePhaseOptions): void;
    /**
     * 그룹과 단계에 연결된 새 이동 트랙을 추가합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceTrackVoCO} opt 트랙 설정(그룹·단계 ID 필수, 시간 생략 시 단계 범위, 이동량은 ENU 미터)
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceTrackVo} 추가한 트랙의 독립 사본
     */
    addTrack(opt: USequenceTrackVoCO): USequenceTrackVo;
    /**
     * 트랙의 참조·시간·이동량·보간 방식을 변경하고 ID는 유지합니다.
     *
     * @param {string} trackId 수정할 트랙 ID
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceTrackVoCO} patch 변경할 트랙 필드(이동량은 ENU 미터)
     */
    updateTrack(trackId: string, patch: USequenceTrackVoCO): void;
    /**
     * 이동 트랙을 삭제하고 해당 트랙의 편집 선택을 해제합니다.
     *
     * @param {string} trackId 삭제할 트랙 ID
     */
    removeTrack(trackId: string): void;
    /**
     * 단계와 소속 트랙의 모든 시간을 한 후보에서 함께 이동합니다.
     *
     * @param {string} phaseId 이동할 단계 ID
     * @param {number} deltaSeconds 더할 상대 시간(유한한 초, 음수·0·소수 허용)
     */
    shiftPhase(phaseId: string, deltaSeconds: number): void;
    /**
     * 시간 축·단계·트랙을 함께 검증하여 중간의 잘못된 상태 없이 교체합니다.
     *
     * @param {import('./sequenceEditingRuntime.js').USequenceScheduleReplacement} schedule 세 항목을 모두 포함한 편집 입력(중첩 VO까지 복사)
     */
    replaceSchedule(schedule: USequenceScheduleReplacement): void;
    /**
     * 편집할 단계를 선택하고 다른 단계의 트랙 선택은 해제합니다.
     *
     * @param {string | null} phaseId 단계 ID 또는 미선택 null
     */
    selectPhase(phaseId: string | null): void;
    /**
     * 편집할 트랙을 선택하고 해당 단계도 함께 선택합니다.
     *
     * @param {string | null} trackId 선택할 트랙 ID(null이면 선택 해제)
     */
    selectTrack(trackId: string | null): void;
    /**
     * 현재 시퀀스를 다시 검증하여 호출자가 반영할 독립 사본을 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceVo} 원본 파일에 자동 저장하지 않는 확정 시퀀스
     */
    finalize(): USequenceVo;
    /**
     * 시작 일정과 선택·변경 상태로 편집을 취소합니다.
     */
    reset(): void;
    /**
     * 변경 후보가 유효한 경우에만 현재 편집 상태를 교체합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} sequence 검증할 독립 변경 후보
     * @param {string | null} [phaseId=this._state.activePhaseId] 적용 후 선택할 단계(기본값은 현재 activePhaseId)
     * @param {string | null} [trackId=this._state.activeTrackId] 적용 후 선택할 트랙(기본값은 현재 activeTrackId)
     */
    _commit(sequence: USequenceVo, phaseId?: string | null, trackId?: string | null): void;
    /**
     * 전체 계약과 고정 문맥·선택 참조를 검사하고 독립 상태를 만듭니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} sequence 복사할 전체 시퀀스
     * @param {string | null} phaseId 편집 단계 ID 또는 null
     * @param {string | null} trackId 편집 트랙 ID 또는 null
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceScheduleEditVo} 검증이 끝난 독립 상태
     */
    _makeState(sequence: USequenceVo, phaseId: string | null, trackId: string | null): USequenceScheduleEditVo;
    /**
     * 고정 문맥 또는 편집 일정의 값을 정해진 필드 순서로 비교합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} sequence 읽기 전용 비교 대상
     * @param {boolean} schedule true이면 일정 3항목, false이면 나머지 고정 문맥을 비교합니다.
     * @returns {string} 실제 값이 같은지 비교할 JSON 문자열
     */
    _signature(sequence: USequenceVo, schedule: boolean): string;
    /**
     * 안정적인 ID로 기존 항목의 위치를 찾습니다.
     *
     * @param {Array<{ id: string; }>} items 읽기 전용 단계·트랙·그룹 목록
     * @param {string} id 공백이 아닌 식별자
     * @returns {number} 0 기반 목록 인덱스
     */
    _index(items: Array<{
        id: string;
    }>, id: string): number;
    /**
     * 항목이 남아 있을 때만 기존 선택 ID를 유지합니다.
     *
     * @param {Array<{ id: string; }>} items 변경 후 단계 또는 트랙 목록
     * @param {string | null} id 기존 편집 선택 ID 또는 null
     * @returns {string | null} 남아 있는 선택 ID 또는 null
     */
    _remainingId(items: Array<{
        id: string;
    }>, id: string | null): string | null;
    /**
     * VO의 공개 필드를 정본 옵션으로 읽습니다.
     *
     * @param {object} value 읽기 전용 VO
     * @param {ReadonlyArray<string>} keys 해당 VO의 정본 옵션 키
     * @returns {object} 공개 필드 값의 옵션 객체
     */
    _options(value: object, keys: ReadonlyArray<string>): object;
    /**
     * 수정 옵션의 키를 정규화하고 안정적인 ID 변경을 거부합니다.
     *
     * @param {object} patch 원본을 변경하지 않을 수정 옵션
     * @param {{ OPT_KEYS: ReadonlyArray<string>; prototype: object; }} VoClass 해당 VO 생성자
     * @param {string} id 유지할 기존 식별자
     * @returns {object} ID를 유지하는 정본 수정 옵션
     */
    _patch(patch: object, VoClass: {
        OPT_KEYS: ReadonlyArray<string>;
        prototype: object;
    }, id: string): object;
    /**
     * 기존 시퀀스 검증기의 인스턴스인지 확인합니다.
     *
     * @param {import('./sequenceDataRuntime.js').USequenceValidationExecutor} value 검사할 검증기 참조
     */
    _requireValidator(value: USequenceValidationExecutor): void;
}
/**
 * 속성 기반 그룹 분류 실행기의 생성 옵션입니다.
 */
type USequenceGroupClassificationExecutorCO = {
    /**
     * 앱이 소유하는 속성 조회 실행기
     */
    queryExecutor?: USequencePropertyQueryExecutor | undefined;
};
/**
 * 그룹 분류에 사용할 전체 형상 GUID 범위입니다.
 */
type USequenceGroupClassificationOptions = {
    /**
     * 전체 형상 GUID. 중복은 한 번만 세며 빈 범위는 그대로 사용합니다.
     */
    objectIds: Array<string>;
};
/**
 * 한 번 검증한 속성 조건의 실행 계획입니다.
 */
type USequenceGroupRulePlan = {
    /**
     * 원본 속성 경로
     */
    path: Array<string>;
    /**
     * 비교 연산자
     */
    operator: "equals" | "in" | "exists";
    /**
     * 타입을 보존하고 필요한 문자열만 소문자로 변환한 비교 값
     */
    values: Set<string | number | boolean>;
    /**
     * 문자열 대소문자 구분 여부
     */
    caseSensitive: boolean;
};
/**
 * 그룹별 조건·수동 참조와 결과 보관 대상입니다.
 */
type USequenceGroupClassificationPlan = {
    /**
     * 검증한 그룹 ID
     */
    id: string;
    /**
     * 입력에서 복사한 그룹
     */
    group: USequenceGroupVo;
    /**
     * 검증한 조건
     */
    rules: Array<USequenceGroupRulePlan>;
    /**
     * 조건 결합 방식
     */
    ruleMatch: "all" | "any";
    /**
     * 수동 포함 GUID
     */
    included: Set<string>;
    /**
     * 수동 제외 GUID
     */
    excluded: Set<string>;
};
/**
 * 객체 하나의 분류 근거를 모으는 내부 작업 자료입니다.
 */
type USequenceGroupAssignmentEntry = {
    /**
     * 최종 후보 그룹
     */
    candidateGroupIds: Array<string>;
    /**
     * 조건 일치 그룹
     */
    ruleGroupIds: Array<string>;
    /**
     * 수동 포함 그룹
     */
    manualGroupIds: Array<string>;
    /**
     * 수동 제외 그룹
     */
    excludedGroupIds: Array<string>;
};
/**
 * 전체 형상 범위를 기준으로 그룹 편집 사본을 만드는 옵션입니다.
 */
type USequenceGroupEditExecutorCO = {
    /**
     * 호출자가 소유하는 기존 분류 실행기
     */
    classificationExecutor: USequenceGroupClassificationExecutor;
    /**
     * 입력을 변경하지 않을 시작 그룹
     */
    groups?: USequenceGroupVo[] | undefined;
    /**
     * 호출자가 보장한 전체 형상 GUID 목록
     */
    objectIds: Array<string>;
};
/**
 * 일정 편집 실행기의 생성 옵션입니다.
 */
type USequenceScheduleEditExecutorCO = {
    /**
     * 확정 그룹이 포함된 유효한 시작 시퀀스
     */
    sequence: USequenceVo;
    /**
     * 빌릴 검증기. 생략하면 자원 없는 검증기를 생성합니다.
     */
    validationExecutor?: USequenceValidationExecutor | undefined;
};
/**
 * 단계 삭제 시 참조 트랙 처리 옵션입니다.
 */
type USequenceScheduleRemovePhaseOptions = {
    /**
     * true이면 편집 사본에서 소속 트랙도 삭제합니다.
     */
    removeTracks?: boolean | undefined;
};
/**
 * 일정 전체를 한 번에 교체할 입력입니다.
 */
type USequenceScheduleReplacement = {
    /**
     * 전체 상대 시간 축
     */
    timeline: USequenceTimelineVo | USequenceTimelineVoCO;
    /**
     * 단계 목록
     */
    phases: Array<USequencePhaseVo | USequencePhaseVoCO>;
    /**
     * 이동 트랙 목록
     */
    tracks: Array<USequenceTrackVo | USequenceTrackVoCO>;
};

/** @import {USequenceSelectorPort} from "./sequenceRequestHandlers.js" */
/** @import {USequenceSourceVoCO} from "../vo/sequenceDefinitionVos.js" */
/** @import {USequenceWorldMathPort} from "./sequenceTransformRuntime.js" */
/**
 * 페이지 전용 형상·선택기·편집 실행기·재생 세션의 수명을 관리합니다.
 */
declare class USequenceSessionManager {
    /**
 * @type {ReadonlyArray<string>}
 *
 * @ignore
 */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceSessionManager 클래스 생성자입니다. <br>
     * 호출자 제공 API를 검사하고 비어 있는 세션을 준비합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceSessionManagerCO} opt 호출자 소유 앱·수학 API와 동기 생성/오류 함수
     */
    constructor(opt: USequenceSessionManagerCO);
    _ports: Readonly<{
        /**
         * 호출자 소유 앱
         */
        app: USequenceSessionAppPort;
        /**
         * 엔진의 공개 수학 API
         */
        mathEngine: USequenceWorldMathPort;
        /**
         * 앱에 아직 부착하지 않은 전용 레이어의 동기 생성 함수
         */
        createLayer: (arg0: USequenceContentVo) => USequenceTilesPort;
        /**
         * 앱에 아직 부착하지 않은 전용 선택기의 동기 생성 함수
         */
        createSelector: () => USequenceSelectorPort;
        /**
         * 동기 오류 수신 함수
         */
        onError: (arg0: Error) => void;
    }>;
    _source: any;
    _session: USequenceSessionResources | null;
    _generation: number;
    _abortController: AbortController | null;
    _listeners: Set<any>;
    _disposed: boolean;
    _working: boolean;
    _serializer: USequenceSerializer;
    _lastError: Error | null;
    /**
     * 자료와 초기 문서를 읽고 최신 요청만 연결합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceSourceVo | import('../vo/sequenceDefinitionVos.js').USequenceSourceVoCO} source 같은 revision의 전체 형상 GUID를 포함한 설정
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceDocumentVo | null} [document=null] sequenceUri가 없을 때 사용할 초기 문서
     * @returns {Promise<void>} 연결 완료. <br>
     * 취소·과거 요청은 AbortError로 거절
     */
    connect(source: USequenceSourceVo | USequenceSourceVoCO, document?: USequenceDocumentVo | null): Promise<void>;
    /**
     * 진행 요청을 취소하고 확정 장면은 유지합니다.
     */
    cancel(): void;
    /**
     * 같은 자료의 독립 문서로 메쉬 상태와 실행기를 교체합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceDocumentVo} document 검증할 확정 문서(저장 시각이 범위 밖이면 거부)
     */
    applyDocument(document: USequenceDocumentVo): void;
    /**
     * 그룹 확정 결과를 기존 트랙 참조까지 검증하여 적용합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceGroupVo>} groups 전체 형상 범위에서 확정한 독립 그룹 목록
     */
    applyGroups(groups: Array<USequenceGroupVo>): void;
    /**
     * 같은 그룹·자료 문맥의 일정을 적용하고 현재 시각만 새 범위로 제한합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} sequence 편집기에서 검증·확정한 독립 시퀀스
     */
    applySchedule(sequence: USequenceVo): void;
    /**
     * 확정 설정과 현재 북마크의 독립 사본을 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceDocumentVo} 미확정 편집을 포함하지 않는 저장 문서
     */
    createDocument(): USequenceDocumentVo;
    /**
     * 선택 파일을 검사하고 같은 세션의 최신 요청에만 적용합니다.
     *
     * @param {Blob} file 호출자 소유 File/Blob이며 읽기만 함
     * @param {string | null} [baseUrl=null] 상대 URI의 HTTP(S) 기준(null이면 현재 source.baseUrl)
     * @returns {Promise<void>} 파일 검사와 동기 적용 완료
     */
    loadFile(file: Blob, baseUrl?: string | null): Promise<void>;
    /**
     * 교체 전/후·요청 상태의 동기 이벤트를 구독합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceSessionListener} listener 세션 이벤트를 처리할 동기 함수(before에서 UI 해제, changed에서 새 UI 연결)
     * @returns {function():void} 동일 수신 함수의 해제 함수
     */
    subscribe(listener: USequenceSessionListener): () => void;
    /**
     * 모든 요청과 자체 세션을 해제하며 앱·공통 레이어는 유지합니다.
     */
    dispose(): void;
    /**
     * HTML 응답·HTTP 실패를 형상 연결 전에 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceSourceVo} source 검증한 절대 형상 주소
     * @param {AbortSignal} signal 현재 요청 소유 취소 신호
     * @returns {Promise<void>} 루트 tileset JSON의 기본 구조 검사 완료. <br>
     * 하위 콘텐츠 해시·로딩 성공을 보증하지 않음
     */
    _readTileset(source: USequenceSourceVo, signal: AbortSignal): Promise<void>;
    /**
     * URI를 절대 주소로 해석하고 초기 자료 식별을 검사합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceSourceVoCO | import('../vo/sequenceDefinitionVos.js').USequenceSourceVo} value 입력을 변경하지 않을 연결 설정
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceSourceVo} 독립 절대 URI 설정
     */
    _resolveSource(value: USequenceSourceVoCO | USequenceSourceVo): USequenceSourceVo;
    /**
     * 문서를 직렬화 계약으로 다시 검사하고 같은 URI까지 확인합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceDocumentVo} document 입력을 변경하지 않을 확정 문서
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceSourceVo} source 현재 고정된 자료 설정
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceDocumentVo} 독립 검증 문서
     */
    _validateDocument(document: USequenceDocumentVo, source: USequenceSourceVo): USequenceDocumentVo;
    /**
     * 형상 범위와 현재 연결 URI를 문서와 대조합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceDocumentVo} document 검증된 문서 사본
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceSourceVo} source 같은 revision의 전체 GUID
     */
    _validateScope(document: USequenceDocumentVo, source: USequenceSourceVo): void;
    /**
     * 수동 참조·확정 GUID가 전체 형상 안에 있는지 확인합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceGroupVo} group 입력을 변경하지 않을 그룹
     * @param {Set<string>} ids 같은 자료의 전체 GUID 색인
     */
    _checkGroupIds(group: USequenceGroupVo, ids: Set<string>): void;
    /**
     * 후보를 동기 교체하고 실패하면 이전 확정 문서를 재구성합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceDocumentVo} document 검증 완료 후보
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceSourceVo} source 후보의 독립 설정
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceObjectPropertyVo>} objects 검증 완료 속성 사본
     * @param {boolean} reuse 같은 레이어·어댑터를 재사용할지 여부
     */
    _commit(document: USequenceDocumentVo, source: USequenceSourceVo, objects: Array<USequenceObjectPropertyVo>, reuse: boolean): void;
    /**
     * 이전 문서를 새 기준 자세에서 재구성합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceDocumentVo | null} saved 이전 문서 또는 최초 연결 null
     * @param {import('./sequenceSessionRuntime.js').USequenceSessionResources | null} old 이전 자원 기록이며 실행기는 이미 해제됨
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceSourceVo | null} source 이전 자료 설정
     * @param {boolean} reuse 이전 어댑터·레이어를 보존했는지 여부
     * @param {Array<Error>} failures 복구 오류를 추가할 호출자 소유 출력 배열
     */
    _rollback(saved: USequenceDocumentVo | null, old: USequenceSessionResources | null, source: USequenceSourceVo | null, reuse: boolean, failures: Array<Error>): void;
    /**
     * 소유 자원을 순서대로 만들고 부분 실패도 정리합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceDocumentVo} document 일시정지로 적용할 후보
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceSourceVo} source 형상 범위와 연결 설정
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceObjectPropertyVo>} objects 검증한 속성
     * @param {import('./sequenceSessionRuntime.js').USequenceSessionResources | null} kept 재사용할 레이어·어댑터 또는 null
     * @returns {import('./sequenceSessionRuntime.js').USequenceSessionResources} PageHandler가 읽기 용도로 빌릴 자원 기록
     */
    _build(document: USequenceDocumentVo, source: USequenceSourceVo, objects: Array<USequenceObjectPropertyVo>, kept: USequenceSessionResources | null): USequenceSessionResources;
    /**
     * 형상 어댑터를 레이어 초기화 이전에 연결합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceSessionResources} s 이 함수가 자원을 추가할 새 기록
     * @param {import('./sequenceSessionRuntime.js').USequenceSessionResources | null} kept 재사용 가능한 동일 자료 기록
     */
    _buildGeometry(s: USequenceSessionResources, kept: USequenceSessionResources | null): void;
    /**
     * 속성·편집·선택·단일 Clock과 렌더 수명을 구성합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceSessionResources} s 검증 문서와 형상 어댑터가 있는 소유 기록
     */
    _buildExecutors(s: USequenceSessionResources): void;
    _referencePosition(): Vector3Tuple;
    /**
     * 준비한 자원을 앱에 동기 부착하고 현재 프레임을 적용합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceSessionResources} s 부착할 소유 자원 기록
     * @param {import('./sequenceSessionRuntime.js').USequenceSessionResources | null} kept 기존 형상 연결이 있으면 중복 addLayer 금지
     */
    _activate(s: USequenceSessionResources, kept: USequenceSessionResources | null): void;
    /**
     * 모든 정리 단계를 시도하며 원래 실패를 보존합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceSessionResources | null} s 정리할 자체 기록 또는 null
     * @param {boolean} keepGeometry 동일 자료 교체에 레이어·어댑터를 남길지 여부
     * @param {Array<Error>} failures 정리 오류를 추가할 출력 배열
     */
    _cleanup(s: USequenceSessionResources | null, keepGeometry: boolean, failures: Array<Error>): void;
    /**
     * 직접 만든 형상 연결의 종료 작업을 추가합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceSessionResources} s 종료할 자원 기록
     * @param {Array<function():void>} jobs 호출자가 순서대로 실행할 작업 출력 목록
     */
    _geometryCleanup(s: USequenceSessionResources, jobs: Array<() => void>): void;
    /**
     * HTTP(S) 주소만 해석합니다.
     *
     * @param {string} uri 절대 또는 명시 기준의 상대 URI
     * @param {string | null} base 명시 HTTP(S) 기준 또는 null
     * @returns {string} 절대 HTTP(S) URL
     */
    _url(uri: string, base: string | null): string;
    /**
     * 호출자 소유 API의 직접 교체를 제한합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceSessionManagerCO} value 대입할 값(직접 변경 불가)
     */
    set ports(value: USequenceSessionManagerCO);
    /**
     * 호출자 소유 API을 반환합니다.
     *
     * @returns {import('./sequenceSessionRuntime.js').USequenceSessionManagerCO}
     */
    get ports(): USequenceSessionManagerCO;
    /**
     * 독립 연결 설정의 직접 교체를 제한합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceSourceVo | null} value 대입할 값(직접 변경 불가)
     */
    set source(value: USequenceSourceVo | null);
    /**
     * 독립 연결 설정을 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceSourceVo | null}
     */
    get source(): USequenceSourceVo | null;
    /**
     * 현재 세션의 빌린 읽기 참조의 직접 교체를 제한합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceSessionResources | null} value 대입할 값(직접 변경 불가)
     */
    set session(value: USequenceSessionResources | null);
    /**
     * 현재 세션의 빌린 읽기 참조을 반환합니다.
     *
     * @returns {import('./sequenceSessionRuntime.js').USequenceSessionResources | null}
     */
    get session(): USequenceSessionResources | null;
    /**
     * 요청 세대의 직접 교체를 제한합니다.
     *
     * @param {number} value 대입할 값(직접 변경 불가)
     */
    set generation(value: number);
    /**
     * 요청 세대을 반환합니다.
     *
     * @returns {number}
     */
    get generation(): number;
    /**
     * 진행 요청 제어기의 직접 교체를 제한합니다.
     *
     * @param {AbortController | null} value 대입할 값(직접 변경 불가)
     */
    set abortController(value: AbortController | null);
    /**
     * 진행 요청 제어기을 반환합니다.
     *
     * @returns {AbortController | null}
     */
    get abortController(): AbortController | null;
    /**
     * 수신 함수 사본의 직접 교체를 제한합니다.
     *
     * @param {Set<import('./sequenceSessionRuntime.js').USequenceSessionListener>} value 대입할 값(직접 변경 불가)
     */
    set listeners(value: Set<USequenceSessionListener>);
    /**
     * 수신 함수 사본을 반환합니다.
     *
     * @returns {Set<import('./sequenceSessionRuntime.js').USequenceSessionListener>}
     */
    get listeners(): Set<USequenceSessionListener>;
    /**
     * 해제 여부의 직접 교체를 제한합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set disposed(value: boolean);
    /**
     * 해제 여부을 반환합니다.
     *
     * @returns {boolean}
     */
    get disposed(): boolean;
    /**
     * 동기 교체 여부의 직접 교체를 제한합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set working(value: boolean);
    /**
     * 동기 교체 여부을 반환합니다.
     *
     * @returns {boolean}
     */
    get working(): boolean;
    /**
     * 내부 직렬화기의 직접 교체를 제한합니다.
     *
     * @param {import('./sequenceDataRuntime.js').USequenceSerializer} value 대입할 값(직접 변경 불가)
     */
    set serializer(value: USequenceSerializer);
    /**
     * 내부 직렬화기을 반환합니다.
     *
     * @returns {import('./sequenceDataRuntime.js').USequenceSerializer}
     */
    get serializer(): USequenceSerializer;
    /**
     * 실행 오류의 직접 교체를 거부합니다.
     *
     * @param {Error | null} value 오류 수신 상태(직접 변경 불가)
     */
    set lastError(value: Error | null);
    /**
     * 마지막 실행 오류를 반환합니다.
     *
     * @returns {Error | null} 원래 오류 또는 null
     */
    get lastError(): Error | null;
    /**
     * 동기 타일 구독에서 비동기 선택 갱신을 명시적으로 관찰합니다.
     *
     * @param {import('./sequenceRequestHandlers.js').USequenceSelectionHandler} selection 세션이 소유한 살아 있는 선택 연결
     * @param {boolean} added 추가이면 true, 제거이면 false
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} binding 어댑터가 전달한 독립 연결 사본
     */
    _selectionBinding(selection: USequenceSelectionHandler, added: boolean, binding: USequenceMeshBindingVo): void;
    /**
     * 비동기 선택 오류와 수신 함수 오류를 모두 보고합니다.
     *
     * @param {Error} error 원래 선택 갱신 예외
     */
    _reportAsyncError(error: Error): void;
    /**
     * 실제 실행 오류를 보존하고 화면 및 호출자에게 동기 통지합니다.
     *
     * @param {Error} error 타일·재생·선택 실행의 원래 예외
     */
    _reportError(error: Error): void;
    /**
     * 새 요청 세대를 준비합니다.
     *
     * @returns {{ generation: number; signal: AbortSignal; }} 요청별 고정 티켓
     */
    _startRequest(): {
        generation: number;
        signal: AbortSignal;
    };
    /**
     * 취소·교체된 요청 결과를 거부합니다.
     *
     * @param {{ generation: number; signal: AbortSignal; }} ticket 결과를 채택할 요청의 고정 티켓
     */
    _current(ticket: {
        generation: number;
        signal: AbortSignal;
    }): void;
    /**
     * 현재 요청의 진행 상태만 정리합니다.
     *
     * @param {{ generation: number; signal: AbortSignal; }} ticket 완료된 요청의 고정 티켓
     */
    _finishRequest(ticket: {
        generation: number;
        signal: AbortSignal;
    }): void;
    /**
     * 교체 전 알림 실패를 보존합니다.
     *
     * @param {Array<Error>} failures 수신 오류를 추가할 출력 배열
     */
    _notifyBefore(failures: Array<Error>): void;
    /**
     * 등록 수신 함수의 동기 완료를 확인합니다.
     *
     * @param {'before' | 'changed' | 'status'} type 수신자가 구분할 수명 이벤트
     */
    _emit(type: "before" | "changed" | "status"): void;
    /**
     * 해제·동기 교체 중 재진입을 거부합니다.
     */
    _idle(): void;
    /**
     * 연결된 확정 세션이 필요한 작업을 검사합니다.
     */
    _requireSession(): void;
}
/**
 * 기존 3D Tiles 레이어의 로드 결과와 GUID별 메쉬 목록을 연결합니다.
 */
declare class USequenceTilesAdapter {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceTilesAdapter 클래스 생성자입니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceTilesAdapterCO} [opt={}] 연결할 엔진 객체와 콜백 설정
     */
    constructor(opt?: USequenceTilesAdapterCO);
    _app: USequenceRenderPort | undefined;
    _layer: USequenceTilesPort | undefined;
    _content: USequenceContentVo | undefined;
    _onError: ((arg0: Error, arg1: Mesh) => void) | undefined;
    _onBindingAdded: ((arg0: USequenceMeshBindingVo) => void) | undefined;
    _onBindingRemoved: ((arg0: USequenceMeshBindingVo) => void) | undefined;
    _bindingManager: USequenceMeshBindingManager;
    /** @type {Set<import('three').Mesh>} */
    _pendingMeshes: Set<Mesh>;
    /** @type {Map<import('three').Mesh, function(): void>} */
    _removedHandlers: Map<Mesh, () => void>;
    /** @type {Function | null} */
    _loadedHandler: Function | null;
    /** @type {Function | null} */
    _renderHandler: Function | null;
    _renderKey: string;
    _connected: boolean;
    _disposed: boolean;
    _generation: number;
    _bindingSubscriptions: Set<any>;
    _hierarchyHandlers: Map<any, any>;
    /**
     * 기존 앱의 공개 API를 설정합니다. <br>
     * 수명과 색인을 보호하기 위해 연결 중 관리 설정 교체를 제한합니다.
     *
     * @param {undefined | import('./sequenceSessionRuntime.js').USequenceRenderPort} value 설정할 기존 앱의 공개 API 입력 변경/소유권 이전 없음
     */
    set app(value: undefined | USequenceRenderPort);
    /**
     * 기존 앱의 공개 API를 반환합니다.
     *
     * @returns {undefined | import('./sequenceSessionRuntime.js').USequenceRenderPort}
     */
    get app(): undefined | USequenceRenderPort;
    /**
     * 기존 3D Tiles 레이어의 공개 API를 설정합니다. <br>
     * 수명과 색인을 보호하기 위해 연결 중 관리 설정 교체를 제한합니다.
     *
     * @param {undefined | import('./sequenceSessionRuntime.js').USequenceTilesPort} value 설정할 기존 3D Tiles 레이어의 공개 API 입력 변경/소유권 이전 없음
     */
    set layer(value: undefined | USequenceTilesPort);
    /**
     * 기존 3D Tiles 레이어의 공개 API를 반환합니다.
     *
     * @returns {undefined | import('./sequenceSessionRuntime.js').USequenceTilesPort}
     */
    get layer(): undefined | USequenceTilesPort;
    /**
     * 자료 참조를 설정합니다. <br>
     * 수명과 색인을 보호하기 위해 연결 중 관리 설정 교체를 제한합니다.
     *
     * @param {undefined | import('../vo/sequenceDefinitionVos.js').USequenceContentVo} value 설정할 자료 참조 입력 변경/소유권 이전 없음
     */
    set content(value: undefined | USequenceContentVo);
    /**
     * 자료 참조를 반환합니다.
     *
     * @returns {undefined | import('../vo/sequenceDefinitionVos.js').USequenceContentVo}
     */
    get content(): undefined | USequenceContentVo;
    /**
     * 필수 오류 콜백를 설정합니다. <br>
     * 수명과 색인을 보호하기 위해 연결 중 관리 설정 교체를 제한합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceTilesAdapterCO["onError"]} value 설정할 필수 오류 콜백 입력 변경/소유권 이전 없음
     */
    set onError(value: USequenceTilesAdapterCO["onError"]);
    /**
     * 필수 오류 콜백를 반환합니다.
     *
     * @returns {import('./sequenceSessionRuntime.js').USequenceTilesAdapterCO["onError"]}
     */
    get onError(): USequenceTilesAdapterCO["onError"];
    /**
     * 연결 완료 콜백를 설정합니다. <br>
     * 수명과 색인을 보호하기 위해 연결 중 관리 설정 교체를 제한합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceTilesAdapterCO["onBindingAdded"]} value 설정할 연결 완료 콜백 입력 변경/소유권 이전 없음
     */
    set onBindingAdded(value: USequenceTilesAdapterCO["onBindingAdded"]);
    /**
     * 연결 완료 콜백를 반환합니다.
     *
     * @returns {import('./sequenceSessionRuntime.js').USequenceTilesAdapterCO["onBindingAdded"]}
     */
    get onBindingAdded(): USequenceTilesAdapterCO["onBindingAdded"];
    /**
     * 연결 해제 콜백를 설정합니다. <br>
     * 수명과 색인을 보호하기 위해 연결 중 관리 설정 교체를 제한합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceTilesAdapterCO["onBindingRemoved"]} value 설정할 연결 해제 콜백 입력 변경/소유권 이전 없음
     */
    set onBindingRemoved(value: USequenceTilesAdapterCO["onBindingRemoved"]);
    /**
     * 연결 해제 콜백를 반환합니다.
     *
     * @returns {import('./sequenceSessionRuntime.js').USequenceTilesAdapterCO["onBindingRemoved"]}
     */
    get onBindingRemoved(): USequenceTilesAdapterCO["onBindingRemoved"];
    /**
     * 이 어댑터가 소유하는 연결 목록를 설정합니다. <br>
     * 수명과 색인을 보호하기 위해 연결 중 관리 설정 교체를 제한합니다.
     *
     * @param {import('./sequenceMeshBindings.js').USequenceMeshBindingManager} value 설정할 이 어댑터가 소유하는 연결 목록 입력 변경/소유권 이전 없음
     */
    set bindingManager(value: USequenceMeshBindingManager);
    /**
     * 이 어댑터가 소유하는 연결 목록를 반환합니다.
     *
     * @returns {import('./sequenceMeshBindings.js').USequenceMeshBindingManager}
     */
    get bindingManager(): USequenceMeshBindingManager;
    /**
     * 배치 대기 메쉬의 복사 목록를 설정합니다. <br>
     * 수명과 색인을 보호하기 위해 연결 중 관리 설정 교체를 제한합니다.
     *
     * @param {Set<import('three').Mesh>} value 설정할 배치 대기 메쉬의 복사 목록 입력 변경/소유권 이전 없음
     */
    set pendingMeshes(value: Set<Mesh>);
    /**
     * 배치 대기 메쉬의 복사 목록를 반환합니다.
     *
     * @returns {Set<import('three').Mesh>}
     */
    get pendingMeshes(): Set<Mesh>;
    /**
     * 소유한 해제 이벤트의 복사 목록를 설정합니다. <br>
     * 수명과 색인을 보호하기 위해 연결 중 관리 설정 교체를 제한합니다.
     *
     * @param {Map<import('three').Mesh, function():void>} value 설정할 소유한 해제 이벤트의 복사 목록 입력 변경/소유권 이전 없음
     */
    set removedHandlers(value: Map<Mesh, () => void>);
    /**
     * 소유한 해제 이벤트의 복사 목록를 반환합니다.
     *
     * @returns {Map<import('three').Mesh, function():void>}
     */
    get removedHandlers(): Map<Mesh, () => void>;
    /**
     * 이 어댑터의 로드 이벤트 함수를 설정합니다. <br>
     * 수명과 색인을 보호하기 위해 연결 중 관리 설정 교체를 제한합니다.
     *
     * @param {Function | null} value 설정할 이 어댑터의 로드 이벤트 함수 입력 변경/소유권 이전 없음
     */
    set loadedHandler(value: Function | null);
    /**
     * 이 어댑터의 로드 이벤트 함수를 반환합니다.
     *
     * @returns {Function | null}
     */
    get loadedHandler(): Function | null;
    /**
     * 이 어댑터의 렌더 전 함수를 설정합니다. <br>
     * 수명과 색인을 보호하기 위해 연결 중 관리 설정 교체를 제한합니다.
     *
     * @param {Function | null} value 설정할 이 어댑터의 렌더 전 함수 입력 변경/소유권 이전 없음
     */
    set renderHandler(value: Function | null);
    /**
     * 이 어댑터의 렌더 전 함수를 반환합니다.
     *
     * @returns {Function | null}
     */
    get renderHandler(): Function | null;
    /**
     * 소유한 렌더 전 작업 키를 설정합니다. <br>
     * 수명과 색인을 보호하기 위해 연결 중 관리 설정 교체를 제한합니다.
     *
     * @param {string} value 설정할 소유한 렌더 전 작업 키 입력 변경/소유권 이전 없음
     */
    set renderKey(value: string);
    /**
     * 소유한 렌더 전 작업 키를 반환합니다.
     *
     * @returns {string}
     */
    get renderKey(): string;
    /**
     * 이벤트 연결 여부를 설정합니다. <br>
     * 수명과 색인을 보호하기 위해 연결 중 관리 설정 교체를 제한합니다.
     *
     * @param {boolean} value 설정할 이벤트 연결 여부 입력 변경/소유권 이전 없음
     */
    set connected(value: boolean);
    /**
     * 이벤트 연결 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get connected(): boolean;
    /**
     * 자체 상태 해제 여부를 설정합니다. <br>
     * 수명과 색인을 보호하기 위해 연결 중 관리 설정 교체를 제한합니다.
     *
     * @param {boolean} value 설정할 자체 상태 해제 여부 입력 변경/소유권 이전 없음
     */
    set disposed(value: boolean);
    /**
     * 자체 상태 해제 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get disposed(): boolean;
    /**
     * 현재 연결 세대를 설정합니다. <br>
     * 수명과 색인을 보호하기 위해 연결 중 관리 설정 교체를 제한합니다.
     *
     * @param {number} value 설정할 현재 연결 세대 입력 변경/소유권 이전 없음
     */
    set generation(value: number);
    /**
     * 현재 연결 세대를 반환합니다.
     *
     * @returns {number}
     */
    get generation(): number;
    /**
     * 이벤트를 먼저 연결하고 기존 표시 메쉬를 한 번 조사합니다.
     *
     * @throws {Error} 필수 API나 자료 정보가 없거나 작업 키가 충돌할 때 발생합니다.
     */
    connect(): void;
    /**
     * 대기 중인 메쉬 중 표시 그룹에 배치한 대상만 연결합니다.
     */
    flushPendingBindings(): void;
    /**
     * GUID에 속한 활성 메쉬 조각을 조회합니다.
     *
     * @param {string} objectId IFC GlobalId 입력 변경/소유권 이전 없음
     * @returns {Array<import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo>} 연결 정보의 복사본
     */
    getBindings(objectId: string): Array<USequenceMeshBindingVo>;
    /**
     * 모든 활성 연결을 조회합니다.
     *
     * @returns {Array<import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo>} 연결 정보의 복사본
     */
    getAllBindings(): Array<USequenceMeshBindingVo>;
    /**
     * 소유한 이벤트를 제거하고 모든 기준 자세를 복원합니다. <br>
     * 정리 완료 후 콜백을 호출하며 콜백이 다시 연결하면 이전 세대 통지를 중단합니다.
     */
    disconnect(): void;
    /**
     * 빌린 엔진 자원은 유지하고 자체 연결 상태를 해제합니다.
     */
    dispose(): void;
    /**
     * 해제한 인스턴스의 재사용을 차단합니다.
     */
    _assertUsable(): void;
    /**
     * 연결 중 설정이나 관리 자료의 교체를 차단합니다.
     */
    _assertConfigurable(): void;
    /**
     * 필수 엔진 API와 자료 식별자를 검사합니다.
     */
    _validatePorts(): void;
    /**
     * 비동기 통지의 연결 세대가 현재와 일치하는지 확인합니다.
     *
     * @param {number} generation 통지를 만든 연결 세대 입력 변경/소유권 이전 없음
     * @returns {boolean} 현재 연결에서 처리할 수 있는 여부
     */
    _isCurrent(generation: number): boolean;
    /**
     * 배치 메타정보가 있는 실제 메쉬만 대기 목록에 추가합니다.
     *
     * @param {import('three').Object3D} object 로드했거나 기존 그룹에서 조사한 객체 입력 변경/소유권 이전 없음
     */
    _queueMesh(object: Object3D): void;
    /**
     * 메쉬가 현재 레이어의 표시 그룹 아래에 있는지 확인합니다.
     *
     * @param {import('three').Mesh} mesh 검사할 메쉬 입력 변경/소유권 이전 없음
     * @returns {boolean} 표시 그룹 연결 여부
     */
    _isAttached(mesh: Mesh): boolean;
    /**
     * 실제 그리기 범위를 확인하고 최종 배치의 기준 자세를 저장합니다.
     *
     * @param {import('three').Mesh} mesh 연결할 메쉬
     * @param {number} generation 요청 세대
     */
    _bindMesh(mesh: Mesh, generation: number): void;
    /**
     * 기존 엔진 객체의 참조를 유지하면서 숫자 배열을 복사합니다.
     *
     * @param {import('three').Mesh} mesh 최종 배치한 메쉬 입력 변경/소유권 이전 없음
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceMeshPoseVo} 부모 기준 자세와 월드 행렬의 복사본
     */
    _capturePose(mesh: Mesh): USequenceMeshPoseVo;
    /**
     * 대기 목록과 메쉬 해제 이벤트를 제거합니다.
     *
     * @param {import('three').Mesh} mesh 정리할 메쉬 입력 변경/소유권 이전 없음
     */
    _forgetMesh(mesh: Mesh): void;
    /**
     * 메쉬 등록을 해제하고 기준 자세를 복원한 결과를 통지합니다.
     *
     * @param {import('three').Mesh} mesh 해제 이벤트가 발생한 메쉬
     */
    _removeMesh(mesh: Mesh): void;
    /**
     * 관리 상태를 변경한 뒤 사용자 콜백을 호출합니다.
     *
     * @param {undefined | function(import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo):void} callback 연결 통지 함수 입력 변경/소유권 이전 없음
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} binding 통지할 연결 정보 입력 변경/소유권 이전 없음
     */
    _notify(callback: undefined | ((arg0: USequenceMeshBindingVo) => void), binding: USequenceMeshBindingVo): void;
    /**
     * 복원 오류를 원인 메쉬별로 전달합니다.
     *
     * @param {Error} error 개별 오류 또는 여러 정리 오류를 포함한 오류 객체입니다.
     * @param {undefined | import('three').Mesh} fallback 메쉬가 명시되지 않은 엔진 API 오류의 관련 메쉬 입력 변경/소유권 이전 없음
     */
    _reportCleanupError(error: Error, fallback: undefined | Mesh): void;
    /**
     * 실제 그리는 버텍스의 단일 배치 번호와 GUID를 확인합니다.
     *
     * @param {import('three').Mesh} mesh 검사할 메쉬 입력 변경/소유권 이전 없음
     * @returns {{ batchId: number; objectId: string; }} 단일 객체 식별 정보
     */
    _resolveIdentity(mesh: Mesh): {
        batchId: number;
        objectId: string;
    };
    /**
     * 인덱스·drawRange·재질 그룹의 교집합을 계산합니다.
     *
     * @param {import('three').Mesh} mesh 그리기 범위를 가진 메쉬 입력 변경/소유권 이전 없음
     * @returns {Array<Array<number>>} 시작 포함·끝 제외 범위
     */
    _drawRanges(mesh: Mesh): Array<Array<number>>;
    /**
     * 그리기 범위의 정수성과 무한 길이 허용 여부를 확인합니다.
     *
     * @param {number} start 시작 인덱스 입력 변경/소유권 이전 없음
     * @param {number} count 그릴 개수 또는 Infinity 입력 변경/소유권 이전 없음
     */
    _validateRange(start: number, count: number): void;
    /**
     * 한 범위의 실제 버텍스가 같은 배치 번호를 쓰는지 검사합니다.
     *
     * @param {import('three').BufferGeometry} geometry 검사할 형상 입력 변경/소유권 이전 없음
     * @param {import('three').BufferAttribute | import('three').InterleavedBufferAttribute} batches 배치 번호 attribute 입력 변경/소유권 이전 없음
     * @param {number} positionCount 버텍스 개수 입력 변경/소유권 이전 없음
     * @param {number} start 시작 인덱스 입력 변경/소유권 이전 없음
     * @param {number} end 끝 인덱스 입력 변경/소유권 이전 없음
     * @param {undefined | number} first 앞 범위에서 확인한 배치 번호 입력 변경/소유권 이전 없음
     * @returns {undefined | number} 범위 전체의 단일 배치 번호
     */
    _batchForRange(geometry: BufferGeometry, batches: BufferAttribute | InterleavedBufferAttribute, positionCount: number, start: number, end: number, first: undefined | number): undefined | number;
    /**
     * 기존 사용자 콜백을 유지하면서 연결 추가·제거를 동기로 구독합니다.
     *
     * @param {undefined | function(import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo):void} onAdded 추가 연결의 독립 사본을 받는 동기 함수 또는 undefined
     * @param {undefined | function(import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo):void} onRemoved 비활성 연결의 독립 사본을 받는 동기 함수 또는 undefined
     * @returns {function():void} 해당 구독 한 건만 제거하는 멱등 해제 함수
     */
    subscribeBindings(onAdded: undefined | ((arg0: USequenceMeshBindingVo) => void), onRemoved: undefined | ((arg0: USequenceMeshBindingVo) => void)): () => void;
    /**
     * 현재 세대의 구독마다 독립 연결 사본을 전달합니다.
     *
     * @param {'added' | 'removed'} type 연결 수명 알림 종류
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} binding 원본을 변경하지 않을 연결 상태
     * @param {number} generation 알림이 속하는 어댑터 세대
     */
    _notifyBindingSubscribers(type: "added" | "removed", binding: USequenceMeshBindingVo, generation: number): void;
    /**
     * 표시 계층의 자식 추가·제거를 감시하고 실제 메쉬만 배치 대기에 넣습니다.
     *
     * @param {import('three').Object3D} root 자체 루트 또는 새로 부착된 하위 그룹
     */
    _watchTree(root: Object3D): void;
    /**
     * 분리된 부모 계층의 모든 실제 메쉬 연결과 자체 계층 감시를 해제합니다.
     *
     * @param {import('three').Object3D} root 엔진이 이미 부모에서 분리한 하위 계층
     */
    _detachTree(root: Object3D): void;
    /**
     * 엔진 계층에 남긴 자체 이벤트만 모두 제거합니다.
     */
    _clearHierarchyHandlers(): void;
    /**
     * 구독 목록의 직접 교체를 거부합니다.
     *
     * @param {Set<object>} value 구독 목록(직접 변경 불가, 구독별 해제 함수 사용)
     */
    set bindingSubscriptions(value: Set<object>);
    /**
     * 연결 수신 등록의 독립 목록을 반환합니다.
     *
     * @returns {Set<object>} 함수 참조만 공유하는 레코드 사본 집합
     */
    get bindingSubscriptions(): Set<object>;
    /**
     * 자체 계층 감시 목록의 직접 교체를 거부합니다.
     *
     * @param {Map<import('three').Object3D, object>} value 연결 목록(직접 변경 불가, 연결·해제 메서드 사용)
     */
    set hierarchyHandlers(value: Map<Object3D, object>);
    /**
     * 계층 감시 레코드의 독립 Map을 반환합니다.
     *
     * @returns {Map<import('three').Object3D, object>} 빌린 객체·함수 참조를 담은 레코드 사본 Map. <br>
     * 이벤트를 직접 변경하지 마십시오.
     */
    get hierarchyHandlers(): Map<Object3D, object>;
}
/**
 * 타일 연결 수명과 렌더 직전 이벤트를 현재 Clock의 시공·분리 상태에 연결합니다.
 */
declare class USequenceTileLifecycleHandler {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceTileLifecycleHandler 클래스 생성자입니다. <br>
     * 연결 대상과 동기 오류 수신 함수를 보관합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceTileLifecycleHandlerCO} opt 호출자 소유의 연결 대상과 동기 오류 수신 함수
     */
    constructor(opt: USequenceTileLifecycleHandlerCO);
    _app: USequenceRenderPort;
    _adapter: USequenceTilesAdapter;
    _playbackHandler: USequencePlaybackHandler;
    _boundsExecutor: USequenceBoundsExecutor;
    _onError: USequenceTileLifecycleErrorCallback;
    _connected: boolean;
    _disposed: boolean;
    _working: boolean;
    _dirty: boolean;
    _generation: number;
    _renderKey: string;
    _renderHandler: (() => void) | null;
    _unsubscribe: (() => void) | null;
    _previousBounds: any;
    _appliedBounds: {
        min: [number, number, number];
        max: [number, number, number];
    } | {
        min: [number, number, number];
        max: [number, number, number];
    } | null;
    _lastError: unknown;
    _boundsRuntimeRevision: number;
    /**
     * 같은 자료·관리자·확정 시퀀스를 확인하고 경계·이벤트·렌더 작업을 연결합니다.
     */
    connect(): void;
    /**
     * 최종 부착 연결과 Clock을 갱신하고 한 프레임의 변경을 한 번의 전체 적용으로 합칩니다.
     */
    flush(): void;
    _updateRuntimeBounds(): void;
    /**
     * 표시 경계 세대의 직접 변경을 거부합니다.
     *
     * @param {number} value 현재 경계 세대(직접 변경 불가)
     */
    set boundsRuntimeRevision(value: number);
    /**
     * 表示 경계에 반영한 부재별 재생 일정 세대를 반환합니다.
     *
     * @returns {number} 表示 경계에 반영한 부재별 재생 일정 세대
     */
    get boundsRuntimeRevision(): number;
    /**
     * 재생을 정지하고 자체 연결·경계 설정을 복구합니다. <br>
     * 메쉬 복원은 호출자가 이어서 수행합니다.
     */
    disconnect(): void;
    /**
     * 자체 수명을 종료합니다. <br>
     * 빌린 객체·메쉬의 수명은 변경하지 않습니다.
     */
    dispose(): void;
    /**
     * 세대가 일치하는 구독과 렌더 직전 작업을 등록합니다.
     *
     * @param {number} generation 이번 연결의 세대(1 이상의 정수)
     */
    _subscribe(generation: number): void;
    /**
     * 자체 이벤트·작업을 제거하고 배타적으로 설정한 경계만 복구합니다.
     *
     * @param {Array<Error>} errors 이번 정리에서 발생한 오류를 추가할 배열
     */
    _cleanup(errors: Array<Error>): void;
    /**
     * 외부 API와 확정 문맥을 연결 전에 확인합니다.
     */
    _validate(): void;
    /**
     * 현재 연결의 자료·관리자·구동 수명을 확인합니다.
     *
     * @param {boolean} [requireConnected=true] 자체 연결 상태까지 확인할지 여부(기본값 true)
     */
    _validateActive(requireConnected?: boolean): void;
    /**
     * 두 성공 적용 키를 비교하여 같은 프레임의 중복 적용을 피합니다.
     *
     * @param {object | null} before tick 전 독립 시각·분리율 사본 또는 null
     * @param {object | null} after tick 후 독립 시각·분리율 사본 또는 null
     * @returns {boolean} 같은 키이거나 모두 null이면 true
     */
    _sameFrame(before: object | null, after: object | null): boolean;
    /**
     * 배타적으로 등록한 이동 범위가 아직 같은지 비교합니다.
     *
     * @param {object | null} left 읽기 전용 min/max 숫자 배열 또는 null
     * @param {object | null} right 읽기 전용 min/max 숫자 배열 또는 null
     * @returns {boolean} null 또는 여섯 값이 모두 같으면 true
     */
    _sameBounds(left: object | null, right: object | null): boolean;
    /**
     * 현재 연결의 오래된 이벤트·작업을 구별합니다.
     *
     * @param {number} generation 콜백을 등록할 때의 연결 세대
     * @returns {boolean} 현재 연결·세대이면 true
     */
    _isCurrent(generation: number): boolean;
    /**
     * 원래 오류를 동기로 보고하고 잘못된 콜백 반환도 숨기지 않습니다.
     *
     * @param {Error} error 현재 연결·적용 작업의 원래 오류
     */
    _notifyError(error: Error): void;
    /**
     * 해제 이후 또는 동기 작업 재진입을 차단합니다.
     */
    _begin(): void;
    /**
     * 연결한 지도 앱의 직접 교체를 거부합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceRenderPort} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set app(value: USequenceRenderPort);
    /**
     * 연결한 지도 앱을 반환합니다.
     *
     * @returns {import('./sequenceSessionRuntime.js').USequenceRenderPort}
     */
    get app(): USequenceRenderPort;
    /**
     * 타일 연결 어댑터의 직접 교체를 거부합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceTilesAdapter} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set adapter(value: USequenceTilesAdapter);
    /**
     * 타일 연결 어댑터를 반환합니다.
     *
     * @returns {import('./sequenceSessionRuntime.js').USequenceTilesAdapter}
     */
    get adapter(): USequenceTilesAdapter;
    /**
     * 재생 처리기의 직접 교체를 거부합니다.
     *
     * @param {import('./sequenceRequestHandlers.js').USequencePlaybackHandler} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set playbackHandler(value: USequencePlaybackHandler);
    /**
     * 재생 처리기를 반환합니다.
     *
     * @returns {import('./sequenceRequestHandlers.js').USequencePlaybackHandler}
     */
    get playbackHandler(): USequencePlaybackHandler;
    /**
     * 이동 범위 계산 실행기의 직접 교체를 거부합니다.
     *
     * @param {import('../core/sequenceConstructionRuntime.js').USequenceBoundsExecutor} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set boundsExecutor(value: USequenceBoundsExecutor);
    /**
     * 이동 범위 계산 실행기를 반환합니다.
     *
     * @returns {import('../core/sequenceConstructionRuntime.js').USequenceBoundsExecutor}
     */
    get boundsExecutor(): USequenceBoundsExecutor;
    /**
     * 종료하지 않은 처리기가 유휴 상태일 때 오류 수신 함수를 교체합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceTileLifecycleErrorCallback} value 이후 타일 연결 오류를 받을 함수
     */
    set onError(value: USequenceTileLifecycleErrorCallback);
    /**
     * 오류 수신 함수를 반환합니다.
     *
     * @returns {import('./sequenceSessionRuntime.js').USequenceTileLifecycleErrorCallback}
     */
    get onError(): USequenceTileLifecycleErrorCallback;
    /**
     * 선택한 연결 상태에 따라 connect 또는 disconnect를 호출합니다.
     *
     * @param {boolean} value true이면 이벤트 연결, false이면 연결 해제
     */
    set connected(value: boolean);
    /**
     * 이벤트 연결 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get connected(): boolean;
    /**
     * true를 지정하면 dispose를 호출하여 종료합니다. <br>
     * 종료된 인스턴스를 false로 되살릴 수 없습니다.
     *
     * @param {boolean} value true이면 종료, false이면 종료 전 상태만 유지 가능
     */
    set disposed(value: boolean);
    /**
     * 종료 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get disposed(): boolean;
    /**
     * 작업 처리 중 여부의 직접 교체를 거부합니다.
     *
     * @param {boolean} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set working(value: boolean);
    /**
     * 작업 처리 중 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get working(): boolean;
    /**
     * 타일 연결 재계산 대기 여부의 직접 교체를 거부합니다.
     *
     * @param {boolean} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set dirty(value: boolean);
    /**
     * 타일 연결 재계산 대기 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get dirty(): boolean;
    /**
     * 요청 세대 번호의 직접 교체를 거부합니다.
     *
     * @param {number} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set generation(value: number);
    /**
     * 요청 세대 번호를 반환합니다.
     *
     * @returns {number}
     */
    get generation(): number;
    /**
     * 지도 그리기 이벤트 등록 키의 직접 교체를 거부합니다.
     *
     * @param {string} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set renderKey(value: string);
    /**
     * 지도 그리기 이벤트 등록 키를 반환합니다.
     *
     * @returns {string}
     */
    get renderKey(): string;
    /**
     * 지도 그리기 이벤트 수신 함수의 직접 교체를 거부합니다.
     *
     * @param {Function | null} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set renderHandler(value: Function | null);
    /**
     * 지도 그리기 이벤트 수신 함수를 반환합니다.
     *
     * @returns {Function | null}
     */
    get renderHandler(): Function | null;
    /**
     * 타일 변경 구독 해제 함수의 직접 교체를 거부합니다.
     *
     * @param {Function | null} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set unsubscribe(value: Function | null);
    /**
     * 타일 변경 구독 해제 함수를 반환합니다.
     *
     * @returns {Function | null}
     */
    get unsubscribe(): Function | null;
    /**
     * 이동 범위 적용 전에 보관한 경계의 직접 교체를 거부합니다.
     *
     * @param {object | null} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set previousBounds(value: object | null);
    /**
     * 이동 범위 적용 전에 보관한 경계의 좌표 배열까지 복사하여 반환합니다.
     *
     * @returns {object | null} 독립 경계 사본 또는 보관한 경계가 없는 null
     */
    get previousBounds(): object | null;
    /**
     * 현재 지도에 적용한 이동 경계의 직접 교체를 거부합니다.
     *
     * @param {object | null} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set appliedBounds(value: object | null);
    /**
     * 현재 지도에 적용한 이동 경계의 좌표 배열까지 복사하여 반환합니다.
     *
     * @returns {object | null} 독립 경계 사본 또는 보관한 경계가 없는 null
     */
    get appliedBounds(): object | null;
    /**
     * 마지막 처리 오류의 직접 교체를 거부합니다.
     *
     * @param {Error | null} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set lastError(value: Error | null);
    /**
     * 마지막 처리 오류를 반환합니다.
     *
     * @returns {Error | null}
     */
    get lastError(): Error | null;
}
/**
 * 타일 수명 처리기의 동기 오류 수신 함수입니다.
 *
 * @callback USequenceTileLifecycleErrorCallback
 * @param {Error} error 적용·연결·복구 원인을 보존한 오류. Promise 반환·재진입은 허용하지 않습니다.
 */
/**
 * 타일 수명과 기존 재생 처리기를 연결하는 옵션입니다.
 *
 * @typedef {object} USequenceTileLifecycleHandlerCO
 * @property {USequenceRenderPort} app 호출자 소유 렌더 전 작업 API
 * @property {import("./sequenceSessionRuntime.js").USequenceTilesAdapter} adapter 같은 자료의 이미 연결된 어댑터. 소유권 이전 없음
 * @property {import("./sequenceRequestHandlers.js").USequencePlaybackHandler} playbackHandler 같은 연결 관리자의 재생 처리기. autoTick=false 필수
 * @property {import("../core/sequenceConstructionRuntime.js").USequenceBoundsExecutor} boundsExecutor 같은 확정 시퀀스·월드 배율의 경계 실행기. 소유권 이전 없음
 * @property {USequenceTileLifecycleErrorCallback} onError 필수 동기 오류 수신 함수
 */
/**
 * HTTP(S) 또는 사용자가 제공한 File/Blob에서 저장 문서를 읽습니다.
 */
declare class USequenceLoader {
    /**
     * 생성 옵션의 정본 키 목록입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceLoader 클래스 생성자입니다. <br>
     * 이후 읽기에 사용할 요청 함수와 Serializer를 연결합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceLoaderCO} [opt={}] 요청 함수와 Serializer 설정(생략한 항목은 기본 구현 생성)
     */
    constructor(opt?: USequenceLoaderCO);
    /**
     * 이후 요청에 사용할 함수를 교체합니다. <br>
     * 진행 중인 요청은 기존 함수를 사용합니다.
     *
     * @param {typeof fetch} value HTTP(S) 응답을 반환할 요청 함수
     */
    set fetcher(value: typeof fetch);
    /**
     * 호출자 또는 환경이 제공한 요청 함수를 반환합니다.
     *
     * @returns {typeof fetch} 현재 요청 함수 참조
     */
    get fetcher(): typeof fetch;
    /**
     * 이후 읽기에 사용할 Serializer를 교체합니다. <br>
     * 진행 중인 읽기는 기존 참조를 사용합니다.
     *
     * @param {import('./sequenceDataRuntime.js').USequenceSerializer} value 사용할 Serializer
     */
    set serializer(value: USequenceSerializer);
    /**
     * 현재 문서 Serializer를 반환합니다.
     *
     * @returns {import('./sequenceDataRuntime.js').USequenceSerializer} 빌린 Serializer 참조
     */
    get serializer(): USequenceSerializer;
    _fetcher: typeof fetch | undefined;
    _serializer: USequenceSerializer | undefined;
    /**
     * 저장 문서를 HTTP(S)로 읽어 완성 VO를 반환합니다. <br>
     * 형상·속성 상대 URI는 최종 response.url을 기준으로 해석하며 응답 URL이 없으면 요청 URL을 사용합니다. <br>
     * 취소 시 원래 signal.reason을 전달하고 실패·취소 결과를 화면에 적용하지 않습니다.
     *
     * @param {string} uri 저장 문서 URI(상대 URI는 opt.baseUrl 필수)
     * @param {import('./sequenceSessionRuntime.js').USequenceDocumentLoadOptions} opt 현재 연결 자료와 선택적 기준 URL·취소 신호
     * @returns {Promise<import('../vo/sequenceDefinitionVos.js').USequenceDocumentVo>} 호출자가 독립적으로 소유하는 문서. <br>
     * HTTP·읽기·검증 실패 또는 취소 사유로 거절됩니다.
     */
    load(uri: string, opt: USequenceDocumentLoadOptions): Promise<USequenceDocumentVo>;
    /**
     * 호출자가 선택한 File/Blob의 텍스트를 읽어 완성 VO로 반환합니다. <br>
     * 상대 형상·속성 URI에는 명시적 opt.baseUrl이 필요하며 로컬 파일 경로를 추측하지 않습니다. <br>
     * File.text 자체는 중단할 수 없어 읽기 전후 신호로 결과 채택을 취소합니다.
     *
     * @param {Blob} file 읽을 File 또는 Blob
     * @param {import('./sequenceSessionRuntime.js').USequenceDocumentLoadOptions} opt 현재 연결 자료와 선택적 HTTP(S) 기준 URL·취소 신호
     * @returns {Promise<import('../vo/sequenceDefinitionVos.js').USequenceDocumentVo>} 호출자가 독립적으로 소유하는 완성 문서 또는 원래 실패·취소 사유
     */
    loadFile(file: Blob, opt: USequenceDocumentLoadOptions): Promise<USequenceDocumentVo>;
    /**
     * 동기 파싱 이후에도 취소를 확인하고 완성 문서만 반환합니다.
     *
     * @param {string} text 읽기를 마친 JSON 원문
     * @param {import('./sequenceSessionRuntime.js').USequenceDocumentLoadOptions} options 시작 시 복사한 자료 문맥과 빌린 취소 신호
     * @param {import('./sequenceDataRuntime.js').USequenceSerializer} serializer 시작 시 캡처한 동기 Serializer 참조
     * @param {undefined | string} baseUrl 응답 URL 또는 호출자가 명시한 파일 기준
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceDocumentVo} 검증과 취소 확인을 마친 독립 문서
     */
    _finish(text: string, options: USequenceDocumentLoadOptions, serializer: USequenceSerializer, baseUrl: undefined | string): USequenceDocumentVo;
    /**
     * 비동기 작업이 사용할 자료 문맥과 기준 주소를 시작 시점에 복사합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceDocumentLoadOptions} opt 문서 읽기 설정
     * @returns {import('./sequenceSessionRuntime.js').USequenceDocumentLoadOptions} 독립 자료 VO와 원시 기준 URL 및 빌린 취소 신호
     */
    _snapshotOptions(opt: USequenceDocumentLoadOptions): USequenceDocumentLoadOptions;
    /**
     * 요청 전 필수 자료 식별 문자열을 확인합니다.
     *
     * @param {unknown} value 검사할 자료 값
     * @param {string} key 오류에 표시할 자료 필드 이름
     */
    _identityString(value: unknown, key: string): void;
    /**
     * 외부 신호의 형식과 취소 사유를 작업 경계에서 확인합니다.
     *
     * @param {undefined | AbortSignal} signal 호출자 소유 신호 또는 미지정 undefined
     */
    _checkSignal(signal: undefined | AbortSignal): void;
    /**
     * 명시한 요청 URI를 HTTP(S) 절대 URL로 해석합니다.
     *
     * @param {string} uri 비어 있지 않은 문서 URI
     * @param {undefined | string} baseUrl 상대 URI의 필수 기준 URL
     * @returns {string} 요청할 HTTP(S) 절대 주소
     */
    _resolveUrl(uri: string, baseUrl: undefined | string): string;
}
/**
 * 한 페이지가 생성한 세션 자원을 등록·해제하는 의존성입니다.
 */
type USequenceSessionManagerCO = {
    /**
     * 호출자 소유 앱
     */
    app: USequenceSessionAppPort;
    /**
     * 엔진의 공개 수학 API
     */
    mathEngine: USequenceWorldMathPort;
    /**
     * 앱에 아직 부착하지 않은 전용 레이어의 동기 생성 함수
     */
    createLayer: (arg0: USequenceContentVo) => USequenceTilesPort;
    /**
     * 앱에 아직 부착하지 않은 전용 선택기의 동기 생성 함수
     */
    createSelector: () => USequenceSelectorPort;
    /**
     * 동기 오류 수신 함수
     */
    onError: (arg0: Error) => void;
};
/**
 * 렌더 전 작업과 전용 자원 부착에 필요한 앱 포트입니다.
 */
type USequenceSessionAppPort = {
    /**
     * 점층 재생 최초 기준점을 읽을 앱 소유 카메라. 점층 비활성 시 생략 가능
     */
    getCamera?: (() => Camera) | undefined;
    /**
     * 등록 키 확인
     */
    hasRenderBefore: (arg0: string) => boolean;
    /**
     * 소유 렌더 전 작업 등록
     */
    setRenderBefore: (arg0: string, arg1: Function) => void;
    /**
     * 소유 렌더 전 작업 제거
     */
    removeRenderBefore: (arg0: string) => void;
    /**
     * 전용 레이어 동기 부착
     */
    addLayer: (arg0: object) => object;
    /**
     * 전용 레이어 제거·해제
     */
    removeLayer: (arg0: object) => void;
    /**
     * 전용 선택기 부착
     */
    addSelect: (arg0: object) => void;
    /**
     * 전용 선택기 제거·해제
     */
    removeSelect: (arg0: object) => void;
};
/**
 * 페이지가 빌려 읽을 실행 자원 기록입니다. <br>
 * 내부 객체를 직접 교체하거나 해제하지 마십시오.
 */
type USequenceSessionResources = {
    /**
     * 확정 문서 사본
     */
    document: USequenceDocumentVo;
    /**
     * 독립 자료 설정
     */
    source: USequenceSourceVo;
    /**
     * 검증한 속성
     */
    objects: Array<USequenceObjectPropertyVo>;
    /**
     * 소유 전용 레이어
     */
    layer?: USequenceTilesPort | undefined;
    /**
     * 형상 어댑터
     */
    adapter?: USequenceTilesAdapter | undefined;
    /**
     * 소유 전용 선택기
     */
    selector?: USequenceSelectorPort | undefined;
    /**
     * 선택 연결
     */
    selection?: USequenceSelectionHandler | undefined;
    /**
     * 속성 조회
     */
    query?: USequencePropertyQueryExecutor | undefined;
    /**
     * 그룹 편집
     */
    groupEdit?: USequenceGroupEditExecutor | undefined;
    /**
     * 일정 편집
     */
    scheduleEdit?: USequenceScheduleEditExecutor | undefined;
    /**
     * 조립 실행
     */
    assembly?: USequenceAssemblyExecutor | undefined;
    /**
     * 단일 Clock 처리기
     */
    playback?: USequencePlaybackHandler | undefined;
    /**
     * 이동 경계
     */
    bounds?: USequenceBoundsExecutor | undefined;
    /**
     * 타일 수명
     */
    lifecycle?: USequenceTileLifecycleHandler | undefined;
    /**
     * 선택 연결 구독 해제
     */
    bindingUnsubscribe?: (() => void) | undefined;
    /**
     * 앱 레이어 등록 시도 여부
     */
    layerAttached?: boolean | undefined;
    /**
     * 앱 선택기 등록 시도 여부
     */
    selectorAttached?: boolean | undefined;
};
/**
 * 세션 교체 전후의 동기 통지입니다.
 */
type USequenceSessionListener = (type: "before" | "changed" | "status") => any;
/**
 * 렌더 전 작업을 연결하는 기존 앱의 공개 API입니다.
 */
type USequenceRenderPort = {
    /**
     * 작업 키 존재 확인 함수
     */
    hasRenderBefore: (arg0: string) => boolean;
    /**
     * 작업 등록 함수
     */
    setRenderBefore: (arg0: string, arg1: Function) => void;
    /**
     * 작업 해제 함수
     */
    removeRenderBefore: (arg0: string) => void;
};
/**
 * 기존 3D Tiles 레이어의 공개 API입니다.
 */
type USequenceTilesPort = {
    /**
     * 타일 표시 그룹 조회 함수
     */
    getGroup: () => Object3D;
    /**
     * 이벤트 등록 함수
     */
    addEventListener: (arg0: string, arg1: Function) => void;
    /**
     * 이벤트 해제 함수
     */
    removeEventListener: (arg0: string, arg1: Function) => void;
};
/**
 * 메쉬 연결 어댑터의 생성 옵션입니다.
 */
type USequenceTilesAdapterCO = {
    /**
     * 기존 U3dApp의 렌더 전 API
     */
    app?: USequenceRenderPort | undefined;
    /**
     * 기존 U3dModelTilesLayer의 공개 API
     */
    layer?: USequenceTilesPort | undefined;
    /**
     * 연결할 자료 정보
     */
    content?: USequenceContentVo | undefined;
    /**
     * 오류와 원인 메쉬를 받는 필수 콜백
     */
    onError?: ((arg0: Error, arg1: Mesh) => void) | undefined;
    /**
     * 연결 완료 콜백
     */
    onBindingAdded?: ((arg0: USequenceMeshBindingVo) => void) | undefined;
    /**
     * 연결 해제 콜백
     */
    onBindingRemoved?: ((arg0: USequenceMeshBindingVo) => void) | undefined;
};
/**
 * 타일 수명 처리기의 동기 오류 수신 함수입니다.
 */
type USequenceTileLifecycleErrorCallback = (error: Error) => any;
/**
 * 타일 수명과 기존 재생 처리기를 연결하는 옵션입니다.
 */
type USequenceTileLifecycleHandlerCO = {
    /**
     * 호출자 소유 렌더 전 작업 API
     */
    app: USequenceRenderPort;
    /**
     * 같은 자료의 이미 연결된 어댑터. 소유권 이전 없음
     */
    adapter: USequenceTilesAdapter;
    /**
     * 같은 연결 관리자의 재생 처리기. autoTick=false 필수
     */
    playbackHandler: USequencePlaybackHandler;
    /**
     * 같은 확정 시퀀스·월드 배율의 경계 실행기. 소유권 이전 없음
     */
    boundsExecutor: USequenceBoundsExecutor;
    /**
     * 필수 동기 오류 수신 함수
     */
    onError: USequenceTileLifecycleErrorCallback;
};
/**
 * 저장 문서 요청에 사용할 함수와 Serializer 설정입니다.
 */
type USequenceLoaderCO = {
    /**
     * 호출자 소유 요청 함수. 생략하면 globalThis.fetch를 사용하며 자동 설치하지 않습니다.
     */
    fetcher?: typeof fetch | undefined;
    /**
     * 호출자 소유 Serializer. 생략하면 기본 Serializer를 생성합니다.
     */
    serializer?: USequenceSerializer | undefined;
};
/**
 * 저장 문서 읽기의 자료 문맥과 취소 조건입니다.
 */
type USequenceDocumentLoadOptions = {
    /**
     * 현재 연결 자료. 요청 전에 사본을 만들며 id/format/revision/objectIdType을 확인합니다.
     */
    expectedContent: USequenceContentVo;
    /**
     * 상대 요청 URI 또는 File 내부 상대 URI를 해석할 HTTP(S) 기준. 브라우저 위치를 추측하지 않습니다.
     */
    baseUrl?: string | URL | undefined;
    /**
     * 호출자 소유 취소 신호. File.text 읽기 자체는 중단하지 못하며 결과 채택을 취소합니다.
     */
    signal?: AbortSignal | undefined;
};

/**
 * 현재 상대 시각에서 그룹의 순차 등장·조립/분리 이동·완료 유지를 함께 적용합니다.
 */
declare class USequenceAssemblyExecutor {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceAssemblyExecutor 클래스 생성자입니다. <br>
     * 동일 사본의 상태·분리·이동 실행기와 GUID 색인·독립 분리율을 준비합니다.
     *
     * @param {import('./sequenceTransformRuntime.js').USequenceAssemblyExecutorCO} opt 확정 시퀀스·빌릴 관리자·수학 API와 선택적 동기 기준 표시 함수·분리율
     */
    constructor(opt: USequenceAssemblyExecutorCO);
    _working: boolean;
    _disposed: boolean;
    _applied: boolean;
    _referencePositionResolver: (() => Array<number>) | null;
    _explodeRatio: number;
    _explodeAxisRatios: any[] | null;
    /**
     * 복원한 인스턴스의 확정 시퀀스 설정을 준비 성공 후 교체합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} value 입력을 검증·복사하며 적용 상태를 먼저 restore해야 합니다.
     */
    set sequence(value: USequenceVo);
    /**
     * 확정 시퀀스를 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceVo | null} null 또는 중첩 VO까지 복사한 독립 사본
     */
    get sequence(): USequenceVo | null;
    /**
     * 복원한 인스턴스의 빌린 연결 관리자 설정을 준비 성공 후 교체합니다.
     *
     * @param {import('./sequenceMeshBindings.js').USequenceMeshBindingManager} value 같은 자료의 살아 있는 관리자를 빌리며 clear/dispose하지 않습니다.
     */
    set bindingManager(value: USequenceMeshBindingManager);
    /**
     * 빌린 연결 관리자를 반환합니다.
     *
     * @returns {import('./sequenceMeshBindings.js').USequenceMeshBindingManager | null} 호출자 소유 참조이며 해제 후 null
     */
    get bindingManager(): USequenceMeshBindingManager | null;
    /**
     * 복원한 인스턴스의 빌린 공개 수학 API 설정을 준비 성공 후 교체합니다.
     *
     * @param {import('./sequenceTransformRuntime.js').USequenceWorldMathPort} value 모듈008에 전달할 API를 빌리며 적용 상태를 먼저 restore해야 합니다.
     */
    set mathEngine(value: USequenceWorldMathPort);
    /**
     * 빌린 공개 수학 API를 반환합니다.
     *
     * @returns {import('./sequenceTransformRuntime.js').USequenceWorldMathPort | null} GeOnDT 수학 API 참조이며 해제 후 null
     */
    get mathEngine(): USequenceWorldMathPort | null;
    /**
     * 복원한 인스턴스의 독립 기준 표시 조회 함수 설정을 준비 성공 후 교체합니다.
     *
     * @param {import('./sequenceTransformRuntime.js').USequenceBaseVisibleResolver | null} value null 또는 동기 순수 함수를 설정하며 적용 상태를 먼저 restore해야 합니다.
     */
    set baseVisibleResolver(value: USequenceBaseVisibleResolver | null);
    /**
     * 독립 기준 표시 조회 함수를 반환합니다.
     *
     * @returns {import('./sequenceTransformRuntime.js').USequenceBaseVisibleResolver | null} 동기 순수 함수 또는 최초 기준을 사용하는 null
     */
    get baseVisibleResolver(): USequenceBaseVisibleResolver | null;
    /**
     * 내부 실행기의 직접 교체를 차단합니다.
     *
     * @param {import('../core/sequenceConstructionRuntime.js').USequenceStateExecutor} value 재구성할 실행기(직접 변경 불가, sequence 설정 사용)
     */
    set stateExecutor(value: USequenceStateExecutor);
    /**
     * 내부 소유 상태 계산기. <br>
     * 외부에서 설정을 변경하지 마십시오.
     *
     * @returns {import('../core/sequenceConstructionRuntime.js').USequenceStateExecutor | null} 읽기 용도로만 빌리는 참조이며 해제 후 null
     */
    get stateExecutor(): USequenceStateExecutor | null;
    /**
     * 내부 실행기의 직접 교체를 차단합니다.
     *
     * @param {import('./sequenceTransformRuntime.js').USequenceMeshTransformExecutor} value 재구성할 실행기(직접 변경 불가, sequence 설정 사용)
     */
    set transformExecutor(value: USequenceMeshTransformExecutor);
    /**
     * 내부 소유 이동 실행기. <br>
     * 외부에서 적용·복원·설정·해제하지 마십시오.
     *
     * @returns {import('./sequenceTransformRuntime.js').USequenceMeshTransformExecutor | null} 읽기 용도로만 빌리는 참조이며 해제 후 null
     */
    get transformExecutor(): USequenceMeshTransformExecutor | null;
    /**
     * 시퀀스와 불일치하는 직접 색인 교체를 차단합니다.
     *
     * @param {Map<string, string>} value 재구축할 색인(직접 변경 불가, sequence 설정 사용)
     */
    set groupIdByObject(value: Map<string, string>);
    /**
     * 확정 GUID별 그룹 색인의 독립 사본을 반환합니다.
     *
     * @returns {Map<string, string>} 내부 색인과 독립적인 Map
     */
    get groupIdByObject(): Map<string, string>;
    /**
     * 재진입 차단 상태의 직접 변경을 거부합니다.
     *
     * @param {boolean} value 실행 상태(직접 변경 불가)
     */
    set working(value: boolean);
    /**
     * 적용·복원·설정 작업의 실행 중 여부를 반환합니다.
     *
     * @returns {boolean} 동기 작업이 실행 중이면 true
     */
    get working(): boolean;
    /**
     * 명시적 복원 요청만 허용합니다.
     *
     * @param {boolean} value 복원 요청 값(false만 허용)
     */
    set applied(value: boolean);
    /**
     * 메쉬에 반영한 상태의 명시적 복원 필요 여부를 반환합니다.
     *
     * @returns {boolean} 복원하지 않은 이동 또는 표시 적용이 있으면 true
     */
    get applied(): boolean;
    /**
     * 자체 해제를 요청하며 해제 상태의 되돌리기를 차단합니다.
     *
     * @param {boolean} value 해제 여부(true이면 dispose, false는 상태 유지)
     */
    set disposed(value: boolean);
    /**
     * 자체 참조·내부 실행기의 해제 여부를 반환합니다.
     *
     * @returns {boolean} 자체 해제가 끝났으면 true
     */
    get disposed(): boolean;
    /**
     * 같은 상대 시각의 조립·분리 이동과 합성 표시를 전체 활성 조각에 적용합니다.
     *
     * @param {number} time 평가할 유한한 상대 시간(초, 재생 범위 밖 허용)
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceFrameStateVo} 조립·분리 이동량을 포함한 독립 논리 상태. <br>
     * 외부 표시 조건·부모·카메라를 합친 전체 렌더 결과는 아닙니다.
     * @throws {Error} 시각·표시 함수·연결·부모·이동 검증 실패 또는 재진입이면 발생합니다.
     */
    apply(time: number): USequenceFrameStateVo;
    /**
     * 현재 관리자에서 활성인 한 조각에 같은 시각의 조립·분리 이동·표시를 적용합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} binding 활성 연결 사본(적용 시 내부 정본 재조회)
     * @param {number} time 적용할 유한한 상대 시간(초)
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceFrameStateVo} 이 시각의 독립 논리 프레임
     */
    applyBinding(binding: USequenceMeshBindingVo, time: number): USequenceFrameStateVo;
    /**
     * 활성 조각의 기준 변환·최신 비시퀀스 표시 조건을 복구하고 분리율을 0으로 초기화합니다.
     *
     * @throws {Error} 기준 조회·연결·부모가 잘못되면 복구 전 거부하며 원인을 해소한 뒤 재시도할 수 있습니다.
     */
    restore(): void;
    /**
     * 복원 성공 후 내부 실행기와 자체 참조만 해제합니다.
     */
    dispose(): void;
    _progressionExecutor: USequenceProgressionExecutor | null | undefined;
    _sequence: USequenceVo | null | undefined;
    _stateExecutor: USequenceStateExecutor | null | undefined;
    _explodeExecutor: USequenceExplodeExecutor | null | undefined;
    _transformExecutor: USequenceMeshTransformExecutor | null | undefined;
    _bindingManager: USequenceMeshBindingManager | null | undefined;
    _mathEngine: USequenceWorldMathPort | null | undefined;
    _baseVisibleResolver: USequenceBaseVisibleResolver | null | undefined;
    /**
     * 적용 상태와 재진입을 확인하고 새 설정 후보를 준비합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} sequence 검증·복사할 새 시퀀스
     * @param {import('./sequenceMeshBindings.js').USequenceMeshBindingManager} manager 빌릴 같은 자료의 관리자
     * @param {import('./sequenceTransformRuntime.js').USequenceWorldMathPort} math 빌릴 공개 수학 API
     * @param {import('./sequenceTransformRuntime.js').USequenceBaseVisibleResolver | null} resolver 독립 기준 표시를 읽는 동기 함수 또는 null
     */
    _replace(sequence: USequenceVo, manager: USequenceMeshBindingManager, math: USequenceWorldMathPort, resolver: USequenceBaseVisibleResolver | null): void;
    /**
     * 모든 후보를 확인한 뒤 같은 문맥의 내부 실행기와 설정을 함께 교체합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} value 원본을 변경하지 않을 확정 시퀀스
     * @param {import('./sequenceMeshBindings.js').USequenceMeshBindingManager} manager 호출자 소유의 살아 있는 연결 관리자
     * @param {import('./sequenceTransformRuntime.js').USequenceWorldMathPort} math 모듈008이 빌릴 월드 수학 API
     * @param {import('./sequenceTransformRuntime.js').USequenceBaseVisibleResolver | null} resolver 동기 순수 함수 또는 최초 표시 조건을 사용하는 null
     */
    _configure(value: USequenceVo, manager: USequenceMeshBindingManager, math: USequenceWorldMathPort, resolver: USequenceBaseVisibleResolver | null): void;
    _runtimeRevision: number | undefined;
    _groupIdByObject: Map<string, string> | undefined;
    _evaluateFrame(time: any): USequenceFrameStateVo;
    _prepareRuntime(time: any): boolean;
    /**
     * 내부 재생 일정의 직접 교체를 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo | null} value 형상 준비와 sequence 설정으로 재구성할 상태(직접 변경 불가)
     */
    set runtimeSequence(value: USequenceVo | null);
    /**
     * 현재 내부 계산기가 사용하는 부재별 일정의 독립 사본을 반환합니다. <br>
     * 표시 경계 갱신에 사용하며 편집 문서를 대체하지 않습니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceVo | null} 현재 내부 계산기가 사용하는 부재별 일정의 독립 사본
     */
    get runtimeSequence(): USequenceVo | null;
    /**
     * 내부 재생 일정 세대의 직접 교체를 거부합니다.
     *
     * @param {undefined | number} value 구성·준비 세대(직접 변경 불가)
     */
    set runtimeRevision(value: undefined | number);
    /**
     * 형상 기반 일정 확정 세대를 반환합니다. <br>
     * 0은 원본 일정, 1은 확정된 재생 일정입니다.
     *
     * @returns {undefined | number} 형상 기반 일정 확정 세대를 반환합니다. <br>
     * 0은 원본 일정
     */
    get runtimeRevision(): undefined | number;
    _activateProgression(runtime: any): void;
    /**
     * 점층 실행기의 직접 교체를 거부합니다.
     *
     * @param {undefined | import('./sequenceTransformRuntime.js').USequenceProgressionExecutor | null} value sequence 설정으로 재구성할 상태(직접 변경 불가)
     */
    set progressionExecutor(value: undefined | USequenceProgressionExecutor | null);
    /**
     * 소유한 점층 일정 생성기를 반환합니다. <br>
     * 외부에서 설정하거나 재실행하지 마십시오.
     *
     * @returns {undefined | import('./sequenceTransformRuntime.js').USequenceProgressionExecutor | null} 소유한 점층 일정 생성기
     */
    get progressionExecutor(): undefined | USequenceProgressionExecutor | null;
    /**
     * 확정 순서의 카메라 조회 문맥 교체를 거부합니다.
     *
     * @param {null | function():Array<number>} value 새 실행기로 교체할 상태(직접 변경 불가)
     */
    set referencePositionResolver(value: null | (() => Array<number>));
    /**
     * 호출자 소유의 최초 카메라 위치 조회 함수를 반환합니다.
     *
     * @returns {null | function():Array<number>} 호출자 소유의 최초 카메라 위치 조회 함수
     */
    get referencePositionResolver(): null | (() => Array<number>);
    /**
     * 활성 조각의 표시 계획을 메쉬 쓰기 전에 모두 준비합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo>} bindings 관리자에서 복사한 활성 연결 목록
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceFrameStateVo | null} frame 현재 논리 프레임(null이면 시공 조건 해제 후 기준 표시 복구)
     * @returns {Array<import('../vo/sequenceDefinitionVos.js').USequenceMeshVisibilityVo>} 독립 표시 계획
     */
    _plans(bindings: Array<USequenceMeshBindingVo>, frame: USequenceFrameStateVo | null): Array<USequenceMeshVisibilityVo>;
    /**
     * 기준 표시와 그룹·미분류 표시 조건을 엄격한 boolean으로 합성합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} binding 조회 함수에 전달할 활성 정본 사본
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceFrameStateVo | null} frame 현재 프레임 또는 기준 복구 null
     * @param {Map<string, boolean>} visibleByGroup 현재 프레임에서 만든 읽기 전용 그룹 표시 Map
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceMeshVisibilityVo} 검증한 표시 계획
     */
    _plan(binding: USequenceMeshBindingVo, frame: USequenceFrameStateVo | null, visibleByGroup: Map<string, boolean>): USequenceMeshVisibilityVo;
    /**
     * 현재 mesh.visible을 읽지 않고 독립 기준 표시 조건을 조회합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} binding 기준 자세와 빌린 메쉬 참조를 가진 활성 정본 사본
     * @returns {boolean} 동기 기준 표시 조건
     */
    _baseVisible(binding: USequenceMeshBindingVo): boolean;
    /**
     * 요청한 연결의 활성 정본·자료·부모를 다시 확인합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} candidate 활성 연결 사본(기준 자세는 내부 정본 사용)
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} 현재 관리자가 복사한 활성 정본
     */
    _canonical(candidate: USequenceMeshBindingVo): USequenceMeshBindingVo;
    /**
     * 콜백·이동 반영 전후에 활성 연결 집합과 부모의 일관성을 확인합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo>} snapshot 콜백 전 관리자에서 복사한 전체 활성 연결 목록
     */
    _checkSnapshot(snapshot: Array<USequenceMeshBindingVo>): void;
    /**
     * 현재 한 조각이 콜백 전 연결과 같은지 확인합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} binding 현재 관리자가 복사한 활성 정본
     * @param {Map<import('three').Mesh, import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo>} expected 콜백 전의 읽기 전용 메쉬별 연결 Map
     */
    _checkSnapshotBinding(binding: USequenceMeshBindingVo, expected: Map<Mesh, USequenceMeshBindingVo>): void;
    /**
     * 자료·GUID·배치 번호·메쉬의 동일성을 비교합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} left 읽기 전용 첫 연결
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} right 읽기 전용 비교 연결
     * @returns {boolean} 같은 메쉬 조각의 식별자이면 true
     */
    _sameIdentity(left: USequenceMeshBindingVo, right: USequenceMeshBindingVo): boolean;
    /**
     * 이동 실행 결과에 따라 부분 쓰기 이후에도 복원 필요 상태를 유지합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceFrameStateVo} frame 내부 상태 계산기가 생성한 현재 논리 프레임
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo | null} binding 적용할 한 조각(null이면 전체)
     */
    _applyTransform(frame: USequenceFrameStateVo, binding: USequenceMeshBindingVo | null): void;
    /**
     * 활성 정본을 확인하며 준비한 로컬 표시 조건만 반영합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceMeshVisibilityVo>} plans 이 실행기에서 만든 검증된 표시 계획
     */
    _writeVisibility(plans: Array<USequenceMeshVisibilityVo>): void;
    /**
     * 재진입 차단 구간 안에서 최신 기준 표시와 원래 변환을 복구합니다.
     */
    _restoreCore(): void;
    /**
     * 기준 표시 조회 함수의 동기 계약을 확인합니다.
     *
     * @param {import('./sequenceTransformRuntime.js').USequenceBaseVisibleResolver | null} resolver 동기 순수 함수 또는 최초 기준을 사용하는 null
     */
    _checkResolver(resolver: USequenceBaseVisibleResolver | null): void;
    /**
     * 빌린 연결 관리자의 자료·수명을 확인합니다.
     *
     * @param {import('./sequenceMeshBindings.js').USequenceMeshBindingManager} manager 호출자 소유 연결 관리자
     * @param {string} contentId 현재 시퀀스의 형상 자료 ID
     */
    _checkManager(manager: USequenceMeshBindingManager, contentId: string): void;
    /**
     * 자체 수명과 관리자의 사용 가능 상태를 확인합니다.
     */
    _assertUsable(): void;
    /**
     * 자체 수명과 동기 작업의 재진입을 확인합니다.
     */
    _assertIdle(): void;
    /**
     * 공개 동기 작업의 사용 가능 상태를 확인하고 진입을 기록합니다.
     */
    _begin(): void;
    /**
     * 시공 시간과 독립적으로 분리율 설정만 변경합니다.
     *
     * @param {number} value 분리율(유한수 0~1, 다음 apply에서 반영, 재진입 변경 불가)
     */
    set explodeRatio(value: number);
    /**
     * 현재 독립 분리율을 반환합니다.
     *
     * @returns {number} 0~1 무차원 분리율. <br>
     * 0이면 현재 시공 시각의 조립 상태입니다.
     */
    get explodeRatio(): number;
    /**
     * 내부 분리 계산기의 직접 교체를 차단합니다.
     *
     * @param {import('../core/sequenceConstructionRuntime.js').USequenceExplodeExecutor} value 재구성할 계산기(직접 변경 불가, sequence 설정 사용)
     */
    set explodeExecutor(value: USequenceExplodeExecutor);
    /**
     * 내부 소유 분리 계산기를 읽기 용도로 반환합니다.
     *
     * @returns {import('../core/sequenceConstructionRuntime.js').USequenceExplodeExecutor | null} 직접 설정하지 않을 빌린 참조이며 해제 후 null
     */
    get explodeExecutor(): USequenceExplodeExecutor | null;
    /**
     * 분리율을 강제 변환 없이 검증합니다.
     *
     * @param {number} ratio 유한한 0~1 무차원 분리율
     */
    _checkExplodeRatio(ratio: number): void;
    /**
     * 현재 시공 시각과 독립적인 축별 분리율을 검증·복사하며 다음 apply에서 반영합니다.
     *
     * @param {Array<any> | null} value X·Y·Z 축별 분리율(각 0~1, null이면 전역 분리율 사용)
     */
    set explodeAxisRatios(value: Array<any> | null);
    /**
     * 현재 축별 분리율을 복사합니다. <br>
     * null이면 기존 전역 분리율을 사용합니다.
     */
    get explodeAxisRatios(): Array<any> | null;
}
/**
 * 시퀀스를 제외한 기준 표시 조건을 읽는 동기 함수입니다.
 *
 * @callback USequenceBaseVisibleResolver
 * @param {import("../vo/sequenceDefinitionVos.js").USequenceMeshBindingVo} binding 연결 정본의 독립 사본. mesh·parent 참조는 빌리며 변경하지 마십시오.
 * @returns {boolean} mesh.visible과 독립적인 기준 표시 여부
                                                              
 */
/**
 * 시각별 순차 등장·조립 적용 실행기의 필수·선택 생성 옵션입니다.
 *
 * @typedef {object} USequenceAssemblyExecutorCO
 * @property {import("../vo/sequenceDefinitionVos.js").USequenceVo} sequence 검증 후 중첩 복사할 확정 시퀀스
 * @property {import("./sequenceMeshBindings.js").USequenceMeshBindingManager} bindingManager 같은 자료의 살아 있는 연결 관리자. 소유권은 호출자에게 있습니다.
 * @property {USequenceWorldMathPort} mathEngine 모듈008에 전달할 GeOnDT 공개 월드 수학 API 참조
 * @property {(function():Array<number>) | null} [referencePositionResolver=null] 최초 재생·탐색 직전의 카메라 렌더 위치 조회 함수(점층 설정이 없으면 호출하지 않음)
 * @property {number} [explodeRatio=0] 시간과 독립된 0~1 분리율. 설정은 다음 apply에서 반영하며 restore 성공 시 0으로 초기화합니다.
 * @property {USequenceBaseVisibleResolver | null} [baseVisibleResolver=null] 동기 기준 표시 조건 조회 함수. null이면 binding.basePose.visible을 사용합니다.
 */
/**
 * 자동 배치의 실제 이동 거리에 적용하는 무차원 계수입니다.
 */
declare class USequenceExplodeLayoutExecutor {
    /**
     * USequenceExplodeLayoutExecutor 클래스 생성자입니다. <br>
     * 같은 메쉬 적용기의 월드 배율을 보관합니다.
     *
     * @param {number} worldUnitsPerMeter 메쉬 적용기와 같은 미터당 월드 단위 배율, 유한한 양수
     */
    constructor(worldUnitsPerMeter: number);
    /**
     * 유효한 월드 단위/m 배율을 보관합니다.
     *
     * @param {number} value 유한한 양수인 미터당 월드 단위 배율
     */
    set worldUnitsPerMeter(value: number);
    /**
     * 월드 단위/m 배율을 반환합니다.
     *
     * @returns {number} 분리 거리 변환에 사용하는 미터당 월드 단위 배율
     */
    get worldUnitsPerMeter(): number;
    _worldUnitsPerMeter: number | undefined;
    /**
     * 모든 대상 형상이 준비되었으면 독립 부재별 배치 시퀀스를 반환하고, 일부 GUID가 아직 없으면 null을 반환합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} sequence 부재별 분리 배치를 적용할 원본 시퀀스
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo>} bindings 현재 준비된 메쉬와 기준 자세의 연결 목록
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceVo | null} 분리 배치를 반영한 새 시퀀스 또는 필요한 형상이 아직 준비되지 않은 null
     */
    evaluate(sequence: USequenceVo, bindings: Array<USequenceMeshBindingVo>): USequenceVo | null;
    _bounds(sequence: any, bindings: any): Map<any, any> | null;
    _includeBinding(boxes: any, binding: any): void;
}
/**
 * 전체 대상의 기준 메쉬가 준비되면 최초 재생 시 카메라 위치를 고정하고 실제 drawRange의 기준 월드 경계를 계산합니다.
 */
declare class USequenceProgressionExecutor {
    /**
     * USequenceProgressionExecutor 클래스 생성자입니다. <br>
     * 검증한 시퀀스의 독립 사본과 빌릴 카메라 조회 함수를 준비합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} sequence 점층 조립 일정을 계산할 시퀀스, 내부에 사본 보관
     * @param {null | function():Array<number>} [referencePositionResolver=null] 저장된 기준점이 없을 때 호출하는 동기 카메라 위치 조회 함수, 반환값은 기준 장면의 유한한 x·y·z 성분 세 개
     */
    constructor(sequence: USequenceVo, referencePositionResolver?: null | (() => Array<number>));
    _sequence: USequenceVo;
    _runtimeSequence: USequenceVo | null;
    _referencePositionResolver: (() => Array<number>) | null;
    /**
     * 기준 시퀀스의 직접 교체를 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} value 재구성할 실행기 설정(직접 변경 불가)
     */
    set sequence(value: USequenceVo);
    /**
     * 카메라 기준점을 포함한 원본 편집 시퀀스의 독립 사본을 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceVo} 카메라 기준점을 포함한 원본 편집 시퀀스의 독립 사본
     */
    get sequence(): USequenceVo;
    /**
     * 계산된 재생 시퀀스의 직접 교체를 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo | null} value 요청이며 prepare로만 확정합니다.
     */
    set runtimeSequence(value: USequenceVo | null);
    /**
     * 준비된 부재별 재생 시퀀스의 독립 사본 또는 null을 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceVo | null} 준비된 부재별 재생 시퀀스의 독립 사본 또는 null
     */
    get runtimeSequence(): USequenceVo | null;
    /**
     * 계산 완료 여부의 직접 교체를 거부합니다.
     *
     * @param {boolean} value 요청이며 prepare 결과로만 변경됩니다.
     */
    set ready(value: boolean);
    /**
     * 부재별 일정이 확정되었는지 반환합니다.
     *
     * @returns {boolean} 부재별 일정이 확정되었는지 반환합니다.
     */
    get ready(): boolean;
    /**
     * 생성 후 카메라 조회 함수의 교체를 거부합니다.
     *
     * @param {never} value 최초 확정한 순서(직접 변경 불가)
     */
    set referencePositionResolver(value: never);
    /**
     * 호출자가 소유하는 카메라 위치 조회 함수를 반환합니다.
     */
    get referencePositionResolver(): never;
    /**
     * 모든 대상 GUID의 형상이 준비된 최초 재생·탐색 시점에만 부재별 일정을 생성합니다. <br>
     * 카메라 이동·역재생·타일 재부착에서는 계산 결과를 재사용합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo>} bindings 일정에 필요한 현재 메쉬 연결 목록
     * @param {number} time 일정을 확정할 유한한 상대 시각, 초 단위
     * @returns {boolean} 이번 호출에서 일정을 처음 확정했으면 true, 준비 대기 또는 이미 확정되었으면 false
     */
    prepare(bindings: Array<USequenceMeshBindingVo>, time: number): boolean;
    _templates(): Map<any, any>;
    _objects(templates: any): Map<any, any>;
    _includeBinding(bounds: any, binding: any): void;
    _sort(objects: any, bounds: any, reference: any): string[];
    _build(ordered: any, templates: any, config: any): USequenceVo;
}
/**
 * 확정 그룹의 ENU 조립 또는 최종 합산 이동량을 기존 3D Tiles 메쉬의 부모 좌표로 변환하여 적용합니다.
 */
declare class USequenceMeshTransformExecutor {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceMeshTransformExecutor 클래스 생성자입니다. <br>
     * 독립 시퀀스와 GUID 색인·고정 월드 배율을 준비합니다.
     *
     * @param {import('./sequenceTransformRuntime.js').USequenceMeshTransformExecutorCO} opt 필수 시퀀스와 빌릴 연결 관리자·공개 수학 API
     */
    constructor(opt: USequenceMeshTransformExecutorCO);
    _disposed: boolean;
    _applied: boolean;
    /**
     * 복원한 인스턴스의 시퀀스를 준비 성공 후 교체합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} value 독립 복사할 시퀀스(기존 적용 상태는 먼저 restore 필요)
     */
    set sequence(value: USequenceVo);
    /**
     * 평가 기준 시퀀스의 독립 사본을 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceVo | null} 해제 후 null, 그 외 중첩 복사본
     */
    get sequence(): USequenceVo | null;
    /**
     * 복원한 인스턴스의 연결 관리자를 교체합니다.
     *
     * @param {import('./sequenceMeshBindings.js').USequenceMeshBindingManager} value 같은 자료의 연결 관리자
     */
    set bindingManager(value: USequenceMeshBindingManager);
    /**
     * 호출자가 소유하는 연결 관리자 참조를 반환합니다.
     *
     * @returns {import('./sequenceMeshBindings.js').USequenceMeshBindingManager | null} 빌린 참조, 해제 후 null
     */
    get bindingManager(): USequenceMeshBindingManager | null;
    /**
     * 복원한 인스턴스의 수학 API를 교체하고 기준 배율을 재계산합니다.
     *
     * @param {import('./sequenceTransformRuntime.js').USequenceWorldMathPort} value getRealScaleAtGeographic 함수를 가진 빌릴 API
     */
    set mathEngine(value: USequenceWorldMathPort);
    /**
     * 빌린 공개 수학 API를 반환합니다.
     *
     * @returns {import('./sequenceTransformRuntime.js').USequenceWorldMathPort | null} 호출자 소유 API 참조, 해제 후 null
     */
    get mathEngine(): USequenceWorldMathPort | null;
    /**
     * 시퀀스와 어긋나는 직접 색인 교체를 차단합니다.
     *
     * @param {Map<string, string>} value GUID 색인(직접 변경 불가, sequence 설정 사용)
     */
    set groupIdByObject(value: Map<string, string>);
    /**
     * GUID별 확정 그룹 색인의 독립 사본을 반환합니다.
     *
     * @returns {Map<string, string>} 내부 색인과 독립적인 Map
     */
    get groupIdByObject(): Map<string, string>;
    /**
     * 검증 없이 그룹 범위를 교체하는 것을 차단합니다.
     *
     * @param {Set<string>} value 그룹 ID 집합(직접 변경 불가, sequence 설정 사용)
     */
    set groupIds(value: Set<string>);
    /**
     * 빈 그룹까지 포함한 그룹 ID 집합의 사본을 반환합니다.
     *
     * @returns {Set<string>} 내부 집합과 독립적인 Set
     */
    get groupIds(): Set<string>;
    /**
     * 수학 API와 불일치하는 직접 배율 교체를 차단합니다.
     *
     * @param {number} value 월드 배율(직접 변경 불가, mathEngine 또는 sequence 설정 사용)
     */
    set worldUnitsPerMeter(value: number);
    /**
     * 기준 위도에서 실제 1m에 대응하는 월드 단위 수를 반환합니다.
     *
     * @returns {number} 활성 상태의 양수 배율. <br>
     * 해제 후 0
     */
    get worldUnitsPerMeter(): number;
    /**
     * 명시적 복원 요청만 허용합니다.
     *
     * @param {boolean} value 복원 요청 값(false만 허용)
     */
    set applied(value: boolean);
    /**
     * 적용 후 명시적 복원이 필요한지 반환합니다.
     *
     * @returns {boolean} 활성 메쉬를 적용한 뒤 restore하지 않았으면 true
     */
    get applied(): boolean;
    /**
     * 자체 해제를 요청하고 해제 상태의 되돌리기를 차단합니다.
     *
     * @param {boolean} value 해제 여부(true이면 dispose, false는 상태 유지)
     */
    set disposed(value: boolean);
    /**
     * 자체 상태의 해제 여부를 반환합니다.
     *
     * @returns {boolean} 자체 참조를 해제했으면 true
     */
    get disposed(): boolean;
    /**
     * 현재 프레임의 이동량을 모든 활성 연결에 적용합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceFrameStateVo} frame 현재 시퀀스에서 평가한 프레임(설정 교체 전 프레임 재사용 불가)
     * @throws {Error} 자료·프레임·부모·행렬이 잘못되면 메쉬 반영 전에 거부합니다.
     */
    apply(frame: USequenceFrameStateVo): void;
    /**
     * 현재 관리 목록에서 활성인 한 조각에 현재 프레임을 적용합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} binding 활성 연결 사본(기준 자세는 관리자 정본 사용)
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceFrameStateVo} frame 같은 시퀀스에서 새로 평가한 전체 프레임
     */
    applyBinding(binding: USequenceMeshBindingVo, frame: USequenceFrameStateVo): void;
    /**
     * 활성 연결의 기준 변환과 원래 자동 갱신 설정을 복구합니다.
     *
     * @throws {Error} 부모·기준 행렬이 변경되면 복원 전 거부하며 재시도할 수 있습니다.
     */
    restore(): void;
    /**
     * 기준 변환 복원 성공 후 자체 참조·색인을 해제합니다.
     */
    dispose(): void;
    _sequence: USequenceVo | null | undefined;
    _bindingManager: USequenceMeshBindingManager | null | undefined;
    _mathEngine: USequenceWorldMathPort | null | undefined;
    _worldUnitsPerMeter: number | undefined;
    /**
     * 설정을 모두 확인한 후 시퀀스·색인·배율을 함께 교체합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} value 검증하고 복사할 시퀀스
     * @param {import('./sequenceMeshBindings.js').USequenceMeshBindingManager} manager 같은 자료의 살아 있는 빌릴 관리자
     * @param {import('./sequenceTransformRuntime.js').USequenceWorldMathPort} math 기준 위도의 배율을 조회할 빌릴 공개 API
     */
    _configure(value: USequenceVo, manager: USequenceMeshBindingManager, math: USequenceWorldMathPort): void;
    _groupIdByObject: Map<any, any> | undefined;
    _groupIds: Set<any> | undefined;
    /**
     * 확정 그룹과 GUID를 생성·교체 시에만 색인합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceGroupVo} group 검증된 읽기 전용 그룹
     * @param {Map<string, string>} index GUID→그룹을 추가할 내부 출력 Map
     * @param {Set<string>} ids 빈 그룹도 추가할 내부 출력 집합
     */
    _indexGroup(group: USequenceGroupVo, index: Map<string, string>, ids: Set<string>): void;
    /**
     * 프레임의 정확한 그룹 범위와 유한 ENU 이동량을 확인합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceFrameStateVo} frame 읽기 전용 현재 프레임
     * @returns {Map<string, Array<number>>} 그룹 ID별 독립 ENU 이동량(m)
     */
    _frameOffsets(frame: USequenceFrameStateVo): Map<string, Array<number>>;
    /**
     * 관리자의 활성 정본을 조회하고 요청의 식별자가 일치하는지 확인합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} candidate 호출자가 빌린 연결 사본
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} 관리 목록에서 복사한 활성 정본
     */
    _activeBinding(candidate: USequenceMeshBindingVo): USequenceMeshBindingVo;
    /**
     * 조상과 자손을 동시에 이동하여 중복 변환하는 연결을 거부합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo>} bindings 현재 관리자에서 복사한 활성 연결
     */
    _assertHierarchy(bindings: Array<USequenceMeshBindingVo>): void;
    /**
     * 한 메쉬의 부모 경로에서 순환 또는 제어 대상 조상을 확인합니다.
     *
     * @param {import('three').Mesh} mesh 확인할 빌린 메쉬
     * @param {Set<import('three').Mesh>} meshes 같은 실행기가 제어할 활성 메쉬 집합
     */
    _checkAncestors(mesh: Mesh, meshes: Set<Mesh>): void;
    /**
     * 부모 행렬을 프레임 안에서 재사용하며 모든 계획을 먼저 검증합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo>} bindings 읽기 전용 활성 연결 목록
     * @param {Map<string, Array<number>>} offsets 그룹별 ENU 이동량(미터, 없으면 기준 자세)
     * @returns {Array<import('../vo/sequenceDefinitionVos.js').USequenceMeshTransformVo>} 반영 전 검증을 마친 독립 계획 목록
     */
    _plans(bindings: Array<USequenceMeshBindingVo>, offsets: Map<string, Array<number>>): Array<USequenceMeshTransformVo>;
    /**
     * 현재 부모의 월드 행렬과 역선형 변환으로 기준 로컬 이동을 구합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} binding 검증한 활성 정본
     * @param {string | null} groupId 확정 그룹 ID 또는 미분류 null
     * @param {Array<number>} enu 동·북·상 순서의 유한 이동량(m)
     * @param {Map<import('three').Object3D | null, import('three').Matrix4>} parents 이번 작업에서만 소유하는 부모 행렬 캐시
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceMeshTransformVo} 독립 적용 계획
     */
    _plan(binding: USequenceMeshBindingVo, groupId: string | null, enu: Array<number>, parents: Map<Object3D | null, Matrix4>): USequenceMeshTransformVo;
    /**
     * 같은 부모의 최신 월드 행렬을 한 번만 읽고 유한·가역 affine 변환인지 확인합니다.
     *
     * @param {import('three').Object3D | null} parent 직접 부모(null이면 단위 월드 행렬)
     * @param {Map<import('three').Object3D | null, import('three').Matrix4>} cache 읽기 결과를 추가할 프레임 내부 캐시
     * @returns {import('three').Matrix4} 이 프레임에서 변경하지 않는 부모 행렬
     */
    _parentMatrix(parent: Object3D | null, cache: Map<Object3D | null, Matrix4>): Matrix4;
    /**
     * translation을 제외한 부모 역변환을 이동 벡터에 적용합니다.
     *
     * @param {import('three').Vector3} worldOffset 읽기 전용 월드 이동량
     * @param {import('three').Matrix4} parent 검증된 읽기 전용 부모 월드 행렬
     * @returns {import('three').Vector3} 정규화하지 않은 독립 부모 로컬 이동량
     */
    _localOffset(worldOffset: Vector3, parent: Matrix4): Vector3;
    /**
     * 기준 변환의 배열과 자동 갱신 계약을 확인합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} binding 관리자가 보관한 활성 연결 사본
     */
    _checkBinding(binding: USequenceMeshBindingVo): void;
    /**
     * 자동 갱신 메쉬의 위치·회전·배율과 기준 행렬이 일치하는지 확인합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshPoseVo} pose 읽기 전용 기준 자세
     * @param {import('three').Matrix4} matrix 유한한 기준 로컬 행렬
     */
    _checkComposed(pose: USequenceMeshPoseVo, matrix: Matrix4): void;
    /**
     * Three.js affine 행렬의 숫자와 마지막 행을 검사합니다.
     *
     * @param {import('three').Matrix4} matrix 읽기 전용 행렬
     * @param {string} label 오류에 포함할 의미 있는 행렬 이름
     */
    _affine(matrix: Matrix4, label: string): void;
    /**
     * 전체 계획을 검증한 뒤 기준 변환을 각 메쉬에 반영합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceMeshTransformVo>} plans 이 실행기에서만 만든 검증된 계획
     */
    _commit(plans: Array<USequenceMeshTransformVo>): void;
    /**
     * 한 메쉬의 기준 속성과 최종 행렬을 기록하며 가시성은 유지합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshTransformVo} plan 검증된 내부 적용 계획
     */
    _write(plan: USequenceMeshTransformVo): void;
    /**
     * 이동하지 않는 축의 부호 있는 0을 보존하여 기준 위치 사본을 만듭니다.
     *
     * @param {Array<number>} origin 읽기 전용 기준 로컬 위치 3개
     * @param {Array<number>} offset 읽기 전용 부모 로컬 이동량 3개
     * @returns {Array<number>} 원본과 독립적인 이동 후 위치
     */
    _shiftedPosition(origin: Array<number>, offset: Array<number>): Array<number>;
    /**
     * 배열 길이와 각 원소의 숫자 유한성을 확인합니다.
     *
     * @param {Array<number>} values 읽기 전용 숫자 배열
     * @param {number} length 필요한 0보다 큰 정수 원소 수
     * @param {string} label 오류에 포함할 필드 이름
     */
    _finiteArray(values: Array<number>, length: number, label: string): void;
    /**
     * 자료 식별자가 같은 살아 있는 관리자인지 확인합니다.
     *
     * @param {import('./sequenceMeshBindings.js').USequenceMeshBindingManager} manager 빌릴 연결 관리자
     * @param {string} contentId 시퀀스의 형상 자료 식별자
     */
    _checkManager(manager: USequenceMeshBindingManager, contentId: string): void;
    /**
     * 자체 해제와 빌린 관리자의 사용 가능 상태를 확인합니다.
     */
    _assertUsable(): void;
    /**
     * 적용 상태를 먼저 복원하지 않은 설정 교체를 차단합니다.
     */
    _assertConfigurable(): void;
    /**
     * 조립·분리·최종 벡터를 확인하고 합산 여부에 맞는 이동량을 선택합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceGroupStateVo} state 그룹 상태(totalOffset이 null이면 조립 전용 경로)
     * @returns {Array<number>} 검증한 독립 ENU 이동량(m)
     */
    _stateOffset(state: USequenceGroupStateVo): Array<number>;
    /**
     * 프레임에 기록한 분리율 형식과 허용 범위를 확인합니다.
     *
     * @param {number} ratio 유한한 0~1 무차원 분리율
     */
    _checkExplodeRatio(ratio: number): void;
}
/**
 * GeOnDT 월드 좌표(EPSG:3857)의 미터 환산에 사용하는 공개 수학 API입니다.
 *
 * @typedef {object} USequenceWorldMathPort
 * @property {function(number): number} getRealScaleAtGeographic 위도(도)를 받아 월드 한 단위의 실제 미터 환산 배율 0.001~1을 반환합니다.
 */
/**
 * 현재 그룹 이동량을 기존 활성 메쉬에 적용하는 생성 옵션입니다.
 *
 * @typedef {object} USequenceMeshTransformExecutorCO
 * @property {import("../vo/sequenceDefinitionVos.js").USequenceVo} sequence 검증하고 중첩 복사할 확정 시퀀스
 * @property {import("./sequenceMeshBindings.js").USequenceMeshBindingManager} bindingManager 같은 contentId의 활성 연결 관리자. 소유권을 넘기지 않습니다.
 * @property {USequenceWorldMathPort} mathEngine GeOnDT.UMathEngine 또는 호환 API. 엔진 참조를 빌립니다.
 */
/**
 * 목록 GUID를 기존 선택에 연결하고 실제 표시 메쉬의 현재 월드 경계로 카메라를 이동합니다.
 */
declare class USequenceObjectFocusExecutor {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceObjectFocusExecutor 클래스 생성자입니다. <br>
     * 기존 세션·카메라 포트를 빌리고 교체 전 취소 구독을 준비합니다.
     *
     * @param {import('./sequenceTransformRuntime.js').USequenceObjectFocusExecutorCO} opt 사용 가능한 세션 관리기, 관리기의 소유권은 호출자에게 유지
     */
    constructor(opt: USequenceObjectFocusExecutorCO);
    _sessionManager: USequenceSessionManager;
    _generation: number;
    _cancelWait: any;
    _flying: boolean;
    _disposed: boolean;
    _sessionListener: (type: any) => void;
    _unsubscribe: () => void;
    /**
     * 최신 GUID의 모든 조각을 선택하고 현재 월드 위치로 이동합니다. <br>
     * 경계가 미로드이면 최대 5초간 재확인하며 결과 상태 문자열을 반환합니다.
     *
     * @param {string} objectId 현재 자료에 등록된 부재의 영구 GUID
     * @returns {Promise<'moved' | 'hidden' | 'unloaded' | 'cancelled'>} 이동 결과, hidden은 원래 숨김 상태를 유지한 이동 완료를 의미
     */
    focus(objectId: string): Promise<"moved" | "hidden" | "unloaded" | "cancelled">;
    /**
     * 자체 대기와 이전 이동만 취소합니다. <br>
     * 반복 호출해도 빌린 세션·선택·메쉬는 해제하지 않습니다.
     */
    cancel(): void;
    /**
     * 자체 비동기 작업과 세션 구독을 모두 해제합니다.
     */
    dispose(): void;
    _handleSession(type: any): void;
    _current(session: any, generation: any): boolean;
    _angles(app: any): any[];
    _readBounds(session: any, objectId: any): Box3 | null;
    _includeMesh(bounds: any, mesh: any): void;
    _isVisible(session: any, objectId: any): boolean;
    _meshVisible(mesh: any): boolean;
    _waitForBounds(session: any, objectId: any, generation: any): Promise<any>;
    /**
     * 호출자 소유 세션 관리기 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {never} value 세션 관리자(직접 변경 불가)
     */
    set sessionManager(value: never);
    /**
     * 호출자 소유 세션 관리기 값을 조회합니다.
     */
    get sessionManager(): never;
    /**
     * 0 기반 단조 증가 이동 요청 세대 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {number} value 이동 요청 세대(직접 변경 불가)
     */
    set generation(value: number);
    /**
     * 0 기반 단조 증가 이동 요청 세대 값을 조회합니다.
     *
     * @returns {number} 0 기반 단조 증가 이동 요청 세대 값
     */
    get generation(): number;
    /**
     * 이 실행기가 소유한 로딩 대기 취소 함수 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {never} value 로딩 대기 취소 함수(직접 변경 불가)
     */
    set cancelWait(value: never);
    /**
     * 이 실행기가 소유한 로딩 대기 취소 함수 값을 조회합니다.
     */
    get cancelWait(): never;
    /**
     * 자체 카메라 이동 진행 여부 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {boolean} value 카메라 이동 진행 상태(직접 변경 불가)
     */
    set flying(value: boolean);
    /**
     * 자체 카메라 이동 진행 여부 값을 조회합니다.
     *
     * @returns {boolean} 자체 카메라 이동 진행 여부 값
     */
    get flying(): boolean;
    /**
     * 실행기 해제 여부 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {boolean} value 해제 상태(직접 변경 불가)
     */
    set disposed(value: boolean);
    /**
     * 실행기 해제 여부 값을 조회합니다.
     *
     * @returns {boolean} 실행기 해제 여부 값
     */
    get disposed(): boolean;
    /**
     * 세션 교체 수신 함수 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {function(any):void} value 세션 이벤트 수신 함수(직접 변경 불가)
     */
    set sessionListener(value: (arg0: any) => void);
    /**
     * 세션 교체 수신 함수 값을 조회합니다.
     *
     * @returns {function(any):void} 세션 교체 수신 함수 값
     */
    get sessionListener(): (arg0: any) => void;
    /**
     * 자체 세션 구독 해제 함수 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {never} value 세션 구독 해제 함수(직접 변경 불가)
     */
    set unsubscribe(value: never);
    /**
     * 자체 세션 구독 해제 함수 값을 조회합니다.
     */
    get unsubscribe(): never;
}
/**
 * 시퀀스를 제외한 기준 표시 조건을 읽는 동기 함수입니다.
 */
type USequenceBaseVisibleResolver = (binding: USequenceMeshBindingVo) => boolean;
/**
 * 시각별 순차 등장·조립 적용 실행기의 필수·선택 생성 옵션입니다.
 */
type USequenceAssemblyExecutorCO = {
    /**
     * 검증 후 중첩 복사할 확정 시퀀스
     */
    sequence: USequenceVo;
    /**
     * 같은 자료의 살아 있는 연결 관리자. 소유권은 호출자에게 있습니다.
     */
    bindingManager: USequenceMeshBindingManager;
    /**
     * 모듈008에 전달할 GeOnDT 공개 월드 수학 API 참조
     */
    mathEngine: USequenceWorldMathPort;
    /**
     * 최초 재생·탐색 직전의 카메라 렌더 위치 조회 함수(점층 설정이 없으면 호출하지 않음)
     */
    referencePositionResolver?: (() => Array<number>) | null | undefined;
    /**
     * 시간과 독립된 0~1 분리율. 설정은 다음 apply에서 반영하며 restore 성공 시 0으로 초기화합니다.
     */
    explodeRatio?: number | undefined;
    /**
     * 동기 기준 표시 조건 조회 함수. null이면 binding.basePose.visible을 사용합니다.
     */
    baseVisibleResolver?: USequenceBaseVisibleResolver | null | undefined;
};
/**
 * GeOnDT 월드 좌표(EPSG:3857)의 미터 환산에 사용하는 공개 수학 API입니다.
 */
type USequenceWorldMathPort = {
    /**
     * 위도(도)를 받아 월드 한 단위의 실제 미터 환산 배율 0.001~1을 반환합니다.
     */
    getRealScaleAtGeographic: (arg0: number) => number;
};
/**
 * 현재 그룹 이동량을 기존 활성 메쉬에 적용하는 생성 옵션입니다.
 */
type USequenceMeshTransformExecutorCO = {
    /**
     * 검증하고 중첩 복사할 확정 시퀀스
     */
    sequence: USequenceVo;
    /**
     * 같은 contentId의 활성 연결 관리자. 소유권을 넘기지 않습니다.
     */
    bindingManager: USequenceMeshBindingManager;
    /**
     * GeOnDT.UMathEngine 또는 호환 API. 엔진 참조를 빌립니다.
     */
    mathEngine: USequenceWorldMathPort;
};
/**
 * GUID 선택·현재 위치 이동 생성 옵션입니다.
 */
type USequenceObjectFocusExecutorCO = {
    /**
     * 앱·선택·어댑터를 제공하는 호출자 소유 세션 관리자
     */
    sessionManager: USequenceSessionManager;
};

/**
 * 구형 Sequence 처리기가 소유하는 숫자 시간축 시계입니다.
 * 시간은 문서 기준 상대 초이며 Date는 표시용 기준일에만 사용합니다.
 * 자체 타이머나 RAF를 만들지 않고 처리기 또는 호출자의 tick에서만 진행합니다.
 */
declare class USequenceClock {
    /**
     * @param {number} startTime 시작 상대 초입니다.
     * @param {number} stopTime 종료 상대 초입니다.
     * @param {number} multiplier 진행 배속입니다.
     */
    constructor(startTime: number, stopTime: number, multiplier: number);
    startTime: number;
    stopTime: number;
    currentTime: number;
    multiplier: number;
    canAnimate: boolean;
    _shouldAnimate: boolean;
    _lastTick: number;
    onTick: {
        /** @returns {number} 현재 활성화한 동기 구독 수입니다. */
        readonly numberOfListeners: number;
        /** @param {function(): void} listener 현재 tick의 동기 수신 함수입니다. */
        addEventListener(listener: () => void): void;
        /** @param {function(): void} listener 제거할 수신 함수입니다. */
        removeEventListener(listener: () => void): void;
        /** 현재 등록을 사본으로 순회하며 제거된 구독은 호출하지 않습니다. */
        raiseEvent(): void;
    };
    /** @param {boolean} value 정지 중 경과 시간을 다음 재생에 합산하지 않습니다. */
    set shouldAnimate(value: boolean);
    /** @returns {boolean} 재생 요청 상태입니다. */
    get shouldAnimate(): boolean;
    /** @returns {number} 이번 tick을 반영한 상대 초입니다. */
    tick(): number;
}

/**
 * 단일 숫자 시간축 시계의 이벤트와 재생 요청을 받아 현재 시공 상태를 적용합니다.
 */
declare class USequencePlaybackHandler {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequencePlaybackHandler 클래스 생성자입니다. <br>
     * 시간 문맥을 복사하고 정지 상태의 Clock과 이벤트 연결을 구성합니다.
     *
     * @param {import('./sequenceRequestHandlers.js').USequencePlaybackHandlerCO} opt 빌린 조립 실행기와 구동 옵션
     */
    constructor(opt: USequencePlaybackHandlerCO);
    _assemblyExecutor: USequenceAssemblyExecutor;
    _timeline: USequenceTimelineVo | undefined;
    _sequenceId: string | undefined;
    _contentId: string | undefined;
    _epoch: number;
    _startDate: number;
    _stopDate: number;
    _clock: USequenceClock;
    _autoTick: boolean;
    _onError: USequencePlaybackErrorCallback | null;
    _listeners: Set<any>;
    _lastApplied: any;
    _published: any;
    _lastError: unknown;
    _disposed: boolean;
    _working: boolean;
    _ticking: boolean;
    _rafId: number | null;
    _tickListener: () => void;
    _rafListener: () => void;
    /**
     * 계산 상태의 직접 덮어쓰기를 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePlaybackStateVo} value 요청한 재생 상태(변경은 공개 재생 메서드 사용)
     */
    set state(value: USequencePlaybackStateVo);
    /**
     * 현재 상대 초·배속·분리율을 새 VO로 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequencePlaybackStateVo} 호출자 소유의 재생 상태 사본
     */
    get state(): USequencePlaybackStateVo;
    /**
     * 현재 배속 부호로 재생하며 경계에서는 자동 반복하지 않습니다.
     */
    play(): void;
    /**
     * 현재 시각을 유지하며 재생을 멈춥니다.
     */
    pause(): void;
    /**
     * 상대 시각을 재생 범위로 제한하고 정지 상태로 즉시 적용합니다.
     *
     * @param {number} time 탐색할 상대 시간(초, 범위 밖이면 시작·종료로 제한)
     */
    seek(time: number): void;
    /**
     * 시간 진행 배속을 변경하며 0이면 정지합니다.
     *
     * @param {number} value 재생 배속(음수는 역방향, 0은 정지)
     */
    setMultiplier(value: number): void;
    /**
     * 같은 시각의 독립 분리율을 바꾸고 즉시 다시 적용합니다.
     *
     * @param {number} value 분리율(유한수 0~1, 자동 보정 없음)
     */
    setExplodeRatio(value: number): void;
    /**
     * 시각과 분리율이 같아도 전체 활성 연결에 현재 상태를 다시 적용합니다.
     */
    refresh(): void;
    /**
     * 외부 구동 모드에서 Clock을 한 번 갱신합니다.
     */
    tick(): void;
    /**
     * 상태 변경의 동기 구독을 등록합니다. <br>
     * 초기 상태는 state로 조회하십시오.
     *
     * @param {import('./sequenceRequestHandlers.js').USequencePlaybackListener} listener 독립 상태 사본을 받을 동기 함수(Promise 반환·명령 재진입 불가)
     * @returns {function():void} 해당 구독 한 건만 제거하는 멱등 해제 함수
     */
    subscribe(listener: USequencePlaybackListener$1): () => void;
    /**
     * 상대 초의 정밀도를 유지하며 화면에 표시할 수 있는 시간 범위를 검사합니다.
     *
     * @param {number} time 문서 기준 상대 초입니다.
     * @returns {number} 변환 손실이 없는 숫자 시각입니다.
     */
    toClockTime(time: number): number;
    /**
     * @param {number} time 읽기 전용 숫자 시각입니다.
     * @returns {number} 문서 기준 상대 초입니다.
     */
    fromClockTime(time: number): number;
    /**
     * 자체 RAF·Clock 연결·구독을 정리하고 빌린 조립 실행기는 유지합니다.
     */
    dispose(): void;
    /**
     * Clock의 현재 배속으로 재생 가능 여부를 설정합니다.
     */
    _play(): void;
    /**
     * 시간 진행 플래그를 끕니다.
     */
    _pause(): void;
    /**
     * 동기 요청·Clock 평가를 잠그고 성공 상태만 통지합니다.
     *
     * @param {function():void | null} action 잠금 안에서 실행할 동기 설정 함수 또는 null
     * @param {boolean} force 같은 시각·분리율이어도 메쉬를 다시 적용할지 여부
     */
    _run(action: () => void | null, force: boolean): void;
    /**
     * Clock 범위와 배속을 확인하고 필요할 때만 기존 실행기에 적용합니다.
     *
     * @param {boolean} force 캐시와 무관하게 전체 현재 상태를 적용할지 여부
     */
    _apply(force: boolean): void;
    /**
     * 값이 바뀐 상태만 독립 사본으로 동기 통지합니다.
     */
    _publish(): void;
    /**
     * 원래 오류를 동기로 보고하고 잘못된 오류 콜백도 숨기지 않습니다.
     *
     * @param {Error} error 현재 시각 적용·구독 통지에서 발생한 원래 오류
     */
    _notifyError(error: Error): void;
    /**
     * 동기 수신 계약에 맞지 않는 Promise 반환을 거부합니다.
     *
     * @param {unknown} value 콜백 반환값(thenable이면 계약 오류)
     */
    _requireSync(value: unknown): void;
    /**
     * 외부·자체 구동에서 Clock의 중첩 tick을 막습니다.
     */
    _tickClock(): void;
    /**
     * 같은 Clock의 tick 알림에서 시공 상태를 갱신합니다.
     */
    _onTick(): void;
    /**
     * 자체 RAF 한 건을 소비하고 다음 화면 갱신을 예약합니다.
     */
    _onAnimationFrame(): void;
    /**
     * 자동 구동일 때 중복 없이 RAF 한 건을 예약합니다.
     */
    _schedule(): void;
    /**
     * 자체 예약한 RAF만 취소합니다.
     */
    _cancel(): void;
    /**
     * 수명 종료 이후 사용을 차단합니다.
     */
    _alive(): void;
    /**
     * 외부 요청의 중첩·tick 중 재진입을 차단합니다.
     */
    _idle(): void;
    /**
     * 유한 숫자의 타입과 범위를 확인합니다.
     *
     * @param {number} value 유한한 수인지 확인할 값(강제 형 변환 없음)
     * @param {string} label 오류에 표시할 입력 의미
     */
    _finite(value: number, label: string): void;
    /**
     * 조립 실행기의 직접 교체를 거부합니다.
     *
     * @param {import('./sequenceTransformRuntime.js').USequenceAssemblyExecutor} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set assemblyExecutor(value: USequenceAssemblyExecutor);
    /**
     * 조립 실행기를 반환합니다.
     *
     * @returns {import('./sequenceTransformRuntime.js').USequenceAssemblyExecutor}
     */
    get assemblyExecutor(): USequenceAssemblyExecutor;
    /**
     * 시간축 정의의 직접 교체를 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceTimelineVo} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set timeline(value: USequenceTimelineVo);
    /**
     * 시간축 정의를 독립된 VO로 복사하여 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceTimelineVo} 처리기의 시간축을 변경하지 않는 독립 사본
     */
    get timeline(): USequenceTimelineVo;
    /**
     * 확정 시퀀스 식별자의 직접 교체를 거부합니다.
     *
     * @param {string} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set sequenceId(value: string);
    /**
     * 확정 시퀀스 식별자를 반환합니다.
     *
     * @returns {string}
     */
    get sequenceId(): string;
    /**
     * 연결 자료 식별자의 직접 교체를 거부합니다.
     *
     * @param {string} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set contentId(value: string);
    /**
     * 연결 자료 식별자를 반환합니다.
     *
     * @returns {string}
     */
    get contentId(): string;
    /**
     * 시간축 기준일의 UTC 밀리초의 직접 교체를 거부합니다.
     *
     * @param {number} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set epoch(value: number);
    /**
     * 시간축 기준일의 UTC 밀리초를 반환합니다.
     *
     * @returns {number}
     */
    get epoch(): number;
    /**
     * 문서 기준 상대 초로 표현한 재생 시작 시각의 직접 교체를 거부합니다.
     *
     * @param {number} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set startDate(value: number);
    /**
     * 문서 기준 상대 초로 표현한 재생 시작 시각을 반환합니다.
     *
     * @returns {number}
     */
    get startDate(): number;
    /**
     * 문서 기준 상대 초로 표현한 재생 종료 시각의 직접 교체를 거부합니다.
     *
     * @param {number} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set stopDate(value: number);
    /**
     * 문서 기준 상대 초로 표현한 재생 종료 시각을 반환합니다.
     *
     * @returns {number}
     */
    get stopDate(): number;
    /**
     * 재생 처리기의 숫자 시계의 직접 교체를 거부합니다.
     *
     * @param {import('./USequenceClock.js').USequenceClock} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set clock(value: USequenceClock);
    /**
     * 재생 처리기의 숫자 시계를 반환합니다.
     *
     * @returns {import('./USequenceClock.js').USequenceClock}
     */
    get clock(): USequenceClock;
    /**
     * 재생 처리기가 유휴 상태일 때 오류 수신 함수를 교체합니다.
     *
     * @param {import('./sequenceRequestHandlers.js').USequencePlaybackErrorCallback | null} value 앞으로 보고할 오류를 받을 함수 또는 수신을 사용하지 않는 null
     */
    set onError(value: USequencePlaybackErrorCallback | null);
    /**
     * 오류 수신 함수를 반환합니다.
     *
     * @returns {import('./sequenceRequestHandlers.js').USequencePlaybackErrorCallback | null}
     */
    get onError(): USequencePlaybackErrorCallback | null;
    /**
     * 등록한 수신 함수 목록의 직접 교체를 거부합니다.
     *
     * @param {Set<object>} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set listeners(value: Set<object>);
    /**
     * 등록한 수신 함수 목록을 독립된 Set으로 복사하여 반환합니다.
     *
     * @returns {Set<object>} 등록 레코드도 복사하며 수신 함수 참조만 공유하는 Set
     */
    get listeners(): Set<object>;
    /**
     * 마지막으로 적용한 재생 시각과 분리율의 직접 교체를 거부합니다.
     *
     * @param {object | null} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set lastApplied(value: object | null);
    /**
     * 마지막으로 적용한 재생 시각과 분리율을 복사하여 반환합니다.
     *
     * @returns {object | null} 독립 값 사본 또는 적용 이력이 없는 null
     */
    get lastApplied(): object | null;
    /**
     * 마지막 상태 통지의 비교 키의 직접 교체를 거부합니다.
     *
     * @param {string | null} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set published(value: string | null);
    /**
     * 마지막 상태 통지의 비교 키를 반환합니다.
     *
     * @returns {string | null}
     */
    get published(): string | null;
    /**
     * 마지막 처리 오류의 직접 교체를 거부합니다.
     *
     * @param {Error | null} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set lastError(value: Error | null);
    /**
     * 마지막 처리 오류를 반환합니다.
     *
     * @returns {Error | null}
     */
    get lastError(): Error | null;
    /**
     * true를 지정하면 dispose를 호출하여 종료합니다. <br>
     * 종료된 인스턴스를 false로 되살릴 수 없습니다.
     *
     * @param {boolean} value true이면 종료, false이면 종료 전 상태만 유지 가능
     */
    set disposed(value: boolean);
    /**
     * 종료 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get disposed(): boolean;
    /**
     * 작업 처리 중 여부의 직접 교체를 거부합니다.
     *
     * @param {boolean} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set working(value: boolean);
    /**
     * 작업 처리 중 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get working(): boolean;
    /**
     * 시계 갱신 중 여부의 직접 교체를 거부합니다.
     *
     * @param {boolean} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set ticking(value: boolean);
    /**
     * 시계 갱신 중 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get ticking(): boolean;
    /**
     * 예약한 화면 갱신 식별자의 직접 교체를 거부합니다.
     *
     * @param {number | null} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set rafId(value: number | null);
    /**
     * 예약한 화면 갱신 식별자를 반환합니다.
     *
     * @returns {number | null}
     */
    get rafId(): number | null;
    /**
     * 시계 갱신 수신 함수의 직접 교체를 거부합니다.
     *
     * @param {Function} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set tickListener(value: Function);
    /**
     * 시계 갱신 수신 함수를 반환합니다.
     *
     * @returns {Function}
     */
    get tickListener(): Function;
    /**
     * 화면 갱신 수신 함수의 직접 교체를 거부합니다.
     *
     * @param {Function} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set rafListener(value: Function);
    /**
     * 화면 갱신 수신 함수를 반환합니다.
     *
     * @returns {Function}
     */
    get rafListener(): Function;
    /**
     * 자체 구동과 앱의 외부 tick 구동을 전환합니다.
     *
     * @param {boolean} value 자체 RAF 예약 여부(false이면 취소, 시각 유지)
     */
    set autoTick(value: boolean);
    /**
     * 자체 RAF 구동 여부를 반환합니다.
     *
     * @returns {boolean} true이면 자체 RAF 한 건으로 구동
     */
    get autoTick(): boolean;
    /**
     * 축별 분리율을 같은 시각에 즉시 적용하고 독립 재생 상태를 통지합니다.
     *
     * @param {Array<number> | null} value X·Y·Z 순서의 0 이상 1 이하 비율 세 개, null이면 공통 분리율 사용
     */
    setExplodeAxisRatios(value: Array<number> | null): void;
}
/**
 * 독립 상태 사본의 동기 수신 함수입니다.
 *
 * @callback USequencePlaybackListener
 * @param {import("../vo/sequenceDefinitionVos.js").USequencePlaybackStateVo} state 수신자 소유의 독립 재생 상태 사본
 */
/**
 * 현재 작업 오류를 동기 통지하는 수신 함수입니다.
 *
 * @callback USequencePlaybackErrorCallback
 * @param {Error} error 원인을 보존한 처리 오류. Promise 반환과 콜백 내 재진입은 허용하지 않습니다.
 */
/**
 * Clock과 재생 이벤트 처리기의 생성 옵션입니다.
 *
 * @typedef {object} USequencePlaybackHandlerCO
 * @property {import("./sequenceTransformRuntime.js").USequenceAssemblyExecutor} assemblyExecutor 호출자 소유 조립 실행기. 재생 처리기 수명 중 외부 재설정·복원·해제는 금지합니다.
 * @property {boolean} [autoTick=true] 자체 RAF 구동 여부. false이면 앱이 tick을 매 화면 갱신 호출합니다.
 * @property {number} [multiplier=1] 유한 재생 배속. 음수는 역방향이며 0은 정지
 * @property {USequencePlaybackErrorCallback | null} [onError=null] 동기 오류 수신 함수. 없으면 이벤트 오류도 호출 경로에 전파합니다.
 */
/**
 * 편집기 전용 선택기의 이벤트를 전체 형상 GUID 선택으로 연결합니다.
 */
declare class USequenceSelectionHandler {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceSelectionHandler 클래스 생성자입니다. <br>
     * 전용 선택기와 GUID 연결 목록을 빌려 선택 처리를 준비합니다.
     *
     * @param {import('./sequenceRequestHandlers.js').USequenceSelectionHandlerCO} opt 선택기·연결 목록·전체 GUID와 이벤트 오류 수신 함수
     */
    constructor(opt: USequenceSelectionHandlerCO);
    _selector: USequenceSelectorPort;
    _bindingManager: USequenceMeshBindingManager;
    _contentId: string;
    _scopeObjectIds: string[];
    _onSelectionChanged: Function | undefined;
    _onError: Function | undefined;
    _objectIds: any[];
    _connected: boolean;
    _disposed: boolean;
    _generation: number;
    _pending: Promise<void>;
    _updating: boolean;
    _listeners: Set<any>;
    _endHandler: () => void;
    /**
     * 선택 이벤트 연결과 강조 작업이 없는 동안 지도 선택기를 교체합니다.
     *
     * @param {import('./sequenceRequestHandlers.js').USequenceSelectorPort} value 이후 선택 이벤트에 사용할 지도 선택기
     */
    set selector(value: USequenceSelectorPort);
    /**
     * 지도 선택기를 반환합니다.
     *
     * @returns {import('./sequenceRequestHandlers.js').USequenceSelectorPort}
     */
    get selector(): USequenceSelectorPort;
    /**
     * 선택 이벤트 연결과 강조 작업이 없는 동안 같은 자료의 형상 연결 관리자를 교체합니다.
     *
     * @param {import('./sequenceMeshBindings.js').USequenceMeshBindingManager} value 현재 자료 식별자와 같은 형상 연결 관리자
     */
    set bindingManager(value: USequenceMeshBindingManager);
    /**
     * 형상 연결 관리자를 반환합니다.
     *
     * @returns {import('./sequenceMeshBindings.js').USequenceMeshBindingManager}
     */
    get bindingManager(): USequenceMeshBindingManager;
    /**
     * 생성 후 자료 식별자 교체를 차단합니다.
     *
     * @param {string} value 연결된 자료 ID(다른 자료로 교체하려면 새 선택 연결 생성)
     */
    set contentId(value: string);
    /**
     * 생성 시 고정한 대상 자료 식별자를 반환합니다.
     *
     * @returns {string} 메쉬 연결과 일치해야 하는 자료 ID
     */
    get contentId(): string;
    /**
     * 선택 가능한 GUID 목록을 복사하고 보관한 선택 GUID 목록을 비웁니다. <br>
     * 선택 이벤트 연결과 강조 작업을 끝낸 뒤에만 변경할 수 있습니다.
     *
     * @param {Array<string>} value 새 선택 범위의 GUID 배열
     */
    set scopeObjectIds(value: Array<string>);
    /**
     * 선택 가능한 형상 GUID 목록의 배열 사본을 반환합니다.
     *
     * @returns {Array<string>} 호출자가 배열을 바꾸어도 내부 목록에 반영되지 않는 사본
     */
    get scopeObjectIds(): Array<string>;
    /**
     * 종료하지 않은 처리기의 선택 변경 수신 함수를 교체합니다.
     *
     * @param {undefined | import('./sequenceRequestHandlers.js').USequenceSelectionCallback} value 선택 변경을 받을 함수 또는 수신을 사용하지 않는 undefined
     */
    set onSelectionChanged(value: undefined | USequenceSelectionCallback);
    /**
     * 선택 GUID 변경 수신 함수를 반환합니다.
     *
     * @returns {undefined | import('./sequenceRequestHandlers.js').USequenceSelectionCallback}
     */
    get onSelectionChanged(): undefined | USequenceSelectionCallback;
    /**
     * 종료하지 않은 처리기의 오류 수신 함수를 교체합니다.
     *
     * @param {function(Error):void} value 선택 처리 오류를 받을 함수
     */
    set onError(value: (arg0: Error) => void);
    /**
     * 오류 수신 함수를 반환합니다.
     *
     * @returns {function(Error):void}
     */
    get onError(): (arg0: Error) => void;
    /**
     * 현재 선택한 형상 GUID 목록의 직접 교체를 거부합니다.
     *
     * @param {Array<string>} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set objectIds(value: Array<string>);
    /**
     * 현재 선택한 형상 GUID 목록의 배열 사본을 반환합니다.
     *
     * @returns {Array<string>} 호출자가 배열을 바꾸어도 내부 목록에 반영되지 않는 사본
     */
    get objectIds(): Array<string>;
    /**
     * 선택한 연결 상태에 따라 connect 또는 disconnect를 호출합니다.
     *
     * @param {boolean} value true이면 이벤트 연결, false이면 연결 해제
     */
    set connected(value: boolean);
    /**
     * 이벤트 연결 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get connected(): boolean;
    /**
     * true를 지정하면 dispose를 호출하여 종료합니다. <br>
     * 종료된 인스턴스를 false로 되살릴 수 없습니다.
     *
     * @param {boolean} value true이면 종료, false이면 종료 전 상태만 유지 가능
     */
    set disposed(value: boolean);
    /**
     * 종료 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get disposed(): boolean;
    /**
     * 선택 이벤트 연결과 강조 작업이 없을 때 요청 세대 번호를 지정합니다.
     *
     * @param {number} value 현재 세대 이상인 안전한 정수
     */
    set generation(value: number);
    /**
     * 요청 세대 번호를 반환합니다.
     *
     * @returns {number}
     */
    get generation(): number;
    /**
     * 진행 중인 선택 요청의 Promise의 직접 교체를 거부합니다.
     *
     * @param {Promise<void>} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set pending(value: Promise<void>);
    /**
     * 진행 중인 선택 요청의 Promise를 반환합니다.
     *
     * @returns {Promise<void>}
     */
    get pending(): Promise<void>;
    /**
     * 선택 강조 반영 중 여부의 직접 교체를 거부합니다.
     *
     * @param {boolean} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set updating(value: boolean);
    /**
     * 선택 강조 반영 중 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get updating(): boolean;
    /**
     * 선택 이벤트 연결과 강조 작업이 없을 때 수신 함수 목록을 비웁니다.
     *
     * @param {Set<import('./sequenceRequestHandlers.js').USequenceSelectionCallback>} value 초기화를 요청하는 빈 Set, 원본 Set은 보관하지 않음
     */
    set listeners(value: Set<USequenceSelectionCallback>);
    /**
     * 등록한 수신 함수 목록을 독립된 Set으로 복사하여 반환합니다.
     *
     * @returns {Set<import('./sequenceRequestHandlers.js').USequenceSelectionCallback>} 항목 참조를 공유하는 독립 Set
     */
    get listeners(): Set<USequenceSelectionCallback>;
    /**
     * 선택 종료 이벤트 수신 함수의 직접 교체를 거부합니다.
     *
     * @param {function():void} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set endHandler(value: () => void);
    /**
     * 선택 종료 이벤트 수신 함수를 반환합니다.
     *
     * @returns {function():void}
     */
    get endHandler(): () => void;
    /**
     * 전용 선택기의 종료 이벤트에 자신의 수신 함수만 등록합니다.
     */
    connect(): void;
    /**
     * 자체 이벤트를 해제하고 전용 선택기의 강조를 지웁니다.
     */
    disconnect(): void;
    /**
     * GUID 선택을 저장하고 이전 요청과 순서가 섞이지 않게 강조합니다.
     *
     * @param {Array<string>} objectIds 전체 형상 범위 안의 GUID(중복 제거 후 복사, 미로드 대상 허용)
     * @returns {Promise<void>} 이 요청의 강조 또는 더 최신 요청에 의한 취소가 끝나면 완료하는 Promise
     */
    setObjectIds(objectIds: Array<string>): Promise<void>;
    /**
     * 현재 선택과 전용 선택기의 강조를 함께 초기화합니다.
     *
     * @returns {Promise<void>} 강조 정리를 기다리는 Promise
     */
    clear(): Promise<void>;
    /**
     * 현재 선택한 객체의 활성 조각이 추가되면 강조를 갱신합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} binding 어댑터가 전달하는 빌린 연결 정보
     * @returns {Promise<void>} 현재 선택의 강조 갱신 완료
     */
    handleBindingAdded(binding: USequenceMeshBindingVo): Promise<void>;
    /**
     * 해제된 메쉬의 강조를 제거하고 GUID 선택은 유지합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} binding 어댑터가 전달하는 해제 연결
     * @returns {Promise<void>} 남은 조각의 강조 갱신 완료
     */
    handleBindingRemoved(binding: USequenceMeshBindingVo): Promise<void>;
    /**
     * 선택 변경을 관찰할 수신 함수를 추가합니다.
     *
     * @param {import('./sequenceRequestHandlers.js').USequenceSelectionCallback} listener 새 GUID 사본을 받고 Promise를 반환하지 않는 동기 함수
     */
    addSelectionListener(listener: USequenceSelectionCallback): void;
    /**
     * 지정한 수신 함수 하나만 제거합니다.
     *
     * @param {import('./sequenceRequestHandlers.js').USequenceSelectionCallback} listener 등록할 때 사용한 동일한 함수 참조
     */
    removeSelectionListener(listener: USequenceSelectionCallback): void;
    /**
     * 선택한 GUID 중 현재 활성 메쉬 조각이 있는 객체 수를 조회합니다.
     *
     * @returns {number} 중복 조각을 한 객체로 센 개수
     */
    getLoadedObjectCount(): number;
    /**
     * 자신의 리스너와 강조만 해제하며 빌린 선택기와 메쉬는 해제하지 않습니다.
     */
    dispose(): void;
    /**
     * 요청을 직렬화하고 실패한 요청 이후에도 다음 요청을 실행 가능하게 유지합니다.
     *
     * @returns {Promise<void>} 호출자가 오류를 관찰할 원래 작업 Promise
     */
    _schedule(): Promise<void>;
    /**
     * 유효한 최신 요청만 전용 선택기에 반영합니다.
     *
     * @param {number} generation 요청 생성 당시의 0 이상 정수 세대
     * @returns {Promise<void>} 강조 완료 또는 무효화 후 정리 완료
     */
    _applySelection(generation: number): Promise<void>;
    /**
     * 선택 GUID의 모든 활성 조각을 선택기에 순서대로 전달합니다.
     *
     * @param {number} generation 현재 강조 요청 세대
     * @returns {Promise<void>} 조각 선택 요청 완료
     */
    _addSelectedBindings(generation: number): Promise<void>;
    /**
     * 선택 종료 이벤트에서 현재 선택한 메쉬를 GUID로 정규화합니다.
     */
    _handleEnd(): void;
    /**
     * 현재 선택의 독립 사본을 기존 콜백과 추가 관찰자에게 전달합니다.
     */
    _notify(): void;
    /**
     * 같은 자료와 전체 형상 범위에 속한 연결인지 판정합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo} binding 빌린 연결 정보
     * @returns {boolean} 허용된 자료·GUID인지 여부
     */
    _matchesBinding(binding: USequenceMeshBindingVo): boolean;
    /**
     * 한 GUID의 현재 활성 연결을 조회합니다.
     *
     * @param {string} id 전체 형상 범위 안의 GUID
     * @returns {Array<import('../vo/sequenceDefinitionVos.js').USequenceMeshBindingVo>} 활성 연결 사본 목록
     */
    _activeBindings(id: string): Array<USequenceMeshBindingVo>;
    /**
     * 최신 요청과 수명 상태를 함께 검사합니다.
     *
     * @param {number} generation 검사할 요청 세대
     * @returns {boolean} 현재 요청의 적용 가능 여부
     */
    _isCurrent(generation: number): boolean;
    /**
     * 선택기 공개 포트의 필수 메서드를 확인합니다.
     *
     * @param {import('./sequenceRequestHandlers.js').USequenceSelectorPort} selector 호출자가 소유하는 전용 선택기
     */
    _checkSelector(selector: USequenceSelectorPort): void;
    /**
     * GUID를 검증하고 입력 순서를 유지하여 중복을 제거합니다.
     *
     * @param {Array<string>} values 입력을 변경하지 않을 GUID 목록
     * @returns {Array<string>} 독립 GUID 목록
     */
    _ids(values: Array<string>): Array<string>;
    /**
     * 동기 수신 함수와 선택적 생략을 검사합니다.
     *
     * @param {undefined | Function} value 검사할 함수 참조
     * @param {boolean} optional undefined 생략을 허용할지 여부
     * @returns {undefined | Function} 검증된 참조
     */
    _callback(value: undefined | Function, optional: boolean): undefined | Function;
    /**
     * 실제 해제된 핸들러의 재사용을 차단합니다.
     */
    _assertUsable(): void;
    /**
     * 연결과 대기 중 작업이 없는 상태에서만 구성을 바꾸게 합니다.
     */
    _assertConfigurable(): void;
}
/**
 * 선택 GUID를 전달하는 동기 수신 함수입니다.
 *
 * @callback USequenceSelectionCallback
 * @param {Array<string>} objectIds 입력 소유권을 받는 독립 GUID 배열
 */
/**
 * 앱에 연결한 편집기 전용 선택기의 공개 API입니다.
 *
 * @typedef {object} USequenceSelectorPort
 * @property {function(string, Function): unknown} on 이벤트와 수신 함수 등록
 * @property {function(string, Function): unknown} off 동일한 수신 함수 하나 제거
 * @property {function(): Array<import('three').Mesh>} getSelected 현재 선택한 메쉬 목록
 * @property {function(): void} clearSelect 전용 선택과 강조 초기화
 * @property {function(import('three').Mesh): (PromiseLike<void> | void)} addSelected 메쉬 선택과 강조 완료
 * @property {function(import('three').Mesh): void} removeSelected 해당 메쉬의 선택과 강조만 제거
 */
/**
 * 전용 선택기와 메쉬 연결 정보를 빌리는 생성 옵션입니다.
 *
 * @typedef {object} USequenceSelectionHandlerCO
 * @property {USequenceSelectorPort} selector 호출자가 소유하고 앱에 연결한 편집기 전용 선택기
 * @property {import("./sequenceMeshBindings.js").USequenceMeshBindingManager} bindingManager 어댑터가 소유하는 메쉬 연결 목록
 * @property {Array<string>} objectIds 호출자가 보장한 전체 형상 GUID 범위
 * @property {USequenceSelectionCallback} [onSelectionChanged] 독립 GUID 사본을 받는 동기 함수
 * @property {function(Error): void} onError 선택 이벤트의 비동기 오류를 받는 동기 함수
 */
/**
 * 공통 지도 선택 결과에서 현재 등록된 레이어와 배치 객체를 확인하고 속성 VO를 전달합니다.
 */
declare class UTilesPropertySelectionHandler {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * UTilesPropertySelectionHandler 클래스 생성자입니다. <br>
     * 호출자 소유 지도와 DOM, 속성 수신 함수를 확인하고 요청 수명을 준비합니다.
     *
     * @param {import('./sequenceRequestHandlers.js').UTilesPropertySelectionHandlerCO} opt 지도·선택 영역·속성 수신 함수와 선택적인 조회기·로더
     */
    constructor(opt: UTilesPropertySelectionHandlerCO);
    _root: HTMLElement;
    _app: object;
    _onResult: (arg0: USequenceObjectPropertyVo | null, arg1: string, arg2: string) => void;
    _resolveObject: ((arg0: object, arg1: string) => USequenceObjectPropertyVo | null) | null;
    _loader: USequencePropertyLoader;
    _cache: Map<any, any>;
    _generation: number;
    _abortController: AbortController;
    _mounted: boolean;
    _disposed: boolean;
    _listener: (event: any) => void;
    /**
     * 공통 선택 완료 알림만 구독하며 기존 선택기의 활성 상태와 동작을 변경하지 않습니다.
     */
    mount(): void;
    /**
     * 자체 이벤트와 진행 중 요청을 취소하고 결과·캐시를 해제합니다. <br>
     * 반복 호출해도 안전합니다.
     */
    dispose(): void;
    _handleSelection(event: any): void;
    _reportError(error: any): void;
    /**
     * 마지막 선택 객체의 속성을 조회하여 등록한 수신 함수에 전달합니다. <br>
     * 새 선택이나 레이어 제거 뒤에 완료된 이전 조회 결과는 표시하지 않습니다.
     *
     * @param {Array<import('three').Object3D>} objects 선택 순서의 객체 목록, 빈 배열이면 기존 속성 표시 해제
     * @returns {Promise<void>} 마지막으로 선택된 객체의 식별 정보를 즉시 복사하고 해당 속성만 전달합니다.
     */
    select(objects: Array<Object3D>): Promise<void>;
    _findLayer(mesh: any): any;
    _batchId(mesh: any): any;
    _identity(mesh: any, layer: any): {
        object: USequenceObjectPropertyVo;
        label: any;
        propertiesUri: string | null;
    };
    _copyBatch(table: any, batch: any, record: any): void;
    _loadObject(identity: any): Promise<USequenceObjectPropertyVo | null>;
    _loadQuery(identity: any): Promise<USequencePropertyQueryExecutor>;
    _isCurrent(generation: any, mesh: any, layer: any): boolean;
    /**
     * 빌린 선택 이벤트 영역의 직접 교체를 제한합니다. <br>
     * 생성 옵션 또는 수명 메서드를 사용합니다.
     *
     * @param {never} value 대입할 값(직접 변경 불가)
     */
    set root(value: never);
    /**
     * 빌린 선택 이벤트 영역를 반환합니다. <br>
     * 자원 소유권은 이전하지 않습니다.
     */
    get root(): never;
    /**
     * 빌린 지도 앱의 직접 교체를 제한합니다. <br>
     * 생성 옵션 또는 수명 메서드를 사용합니다.
     *
     * @param {never} value 대입할 값(직접 변경 불가)
     */
    set app(value: never);
    /**
     * 빌린 지도 앱를 반환합니다. <br>
     * 자원 소유권은 이전하지 않습니다.
     */
    get app(): never;
    /**
     * 속성 결과 수신 함수의 직접 교체를 제한합니다. <br>
     * 생성 옵션 또는 수명 메서드를 사용합니다.
     *
     * @param {never} value 대입할 값(직접 변경 불가)
     */
    set onResult(value: never);
    /**
     * 속성 결과 수신 함수를 반환합니다. <br>
     * 자원 소유권은 이전하지 않습니다.
     */
    get onResult(): never;
    /**
     * 기존 속성 조회 함수의 직접 교체를 제한합니다. <br>
     * 생성 옵션 또는 수명 메서드를 사용합니다.
     *
     * @param {never} value 대입할 값(직접 변경 불가)
     */
    set resolveObject(value: never);
    /**
     * 기존 속성 조회 함수를 반환합니다. <br>
     * 자원 소유권은 이전하지 않습니다.
     */
    get resolveObject(): never;
    /**
     * 속성 로더의 직접 교체를 제한합니다. <br>
     * 생성 옵션 또는 수명 메서드를 사용합니다.
     *
     * @param {never} value 대입할 값(직접 변경 불가)
     */
    set loader(value: never);
    /**
     * 속성 로더를 반환합니다. <br>
     * 자원 소유권은 이전하지 않습니다.
     */
    get loader(): never;
    /**
     * 메타데이터 요청 캐시의 직접 교체를 제한합니다. <br>
     * 생성 옵션 또는 수명 메서드를 사용합니다.
     *
     * @param {Map<any, any>} value 대입할 값(직접 변경 불가)
     */
    set cache(value: Map<any, any>);
    /**
     * 메타데이터 요청 캐시를 반환합니다. <br>
     * 자원 소유권은 이전하지 않습니다.
     *
     * @returns {Map<any, any>} 메타데이터 요청 캐시
     */
    get cache(): Map<any, any>;
    /**
     * 최신 요청 세대의 직접 교체를 제한합니다. <br>
     * 생성 옵션 또는 수명 메서드를 사용합니다.
     *
     * @param {number} value 대입할 값(직접 변경 불가)
     */
    set generation(value: number);
    /**
     * 최신 요청 세대를 반환합니다. <br>
     * 자원 소유권은 이전하지 않습니다.
     *
     * @returns {number} 최신 요청 세대
     */
    get generation(): number;
    /**
     * 이 수명의 요청 취소기의 직접 교체를 제한합니다. <br>
     * 생성 옵션 또는 수명 메서드를 사용합니다.
     *
     * @param {AbortController} value 대입할 값(직접 변경 불가)
     */
    set abortController(value: AbortController);
    /**
     * 이 수명의 요청 취소기를 반환합니다. <br>
     * 자원 소유권은 이전하지 않습니다.
     *
     * @returns {AbortController} 이 수명의 요청 취소기
     */
    get abortController(): AbortController;
    /**
     * 이벤트 부착 여부의 직접 교체를 제한합니다. <br>
     * 생성 옵션 또는 수명 메서드를 사용합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set mounted(value: boolean);
    /**
     * 이벤트 부착 여부를 반환합니다. <br>
     * 자원 소유권은 이전하지 않습니다.
     *
     * @returns {boolean} 이벤트 부착 여부
     */
    get mounted(): boolean;
    /**
     * 최종 해제 여부의 직접 교체를 제한합니다. <br>
     * 생성 옵션 또는 수명 메서드를 사용합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set disposed(value: boolean);
    /**
     * 최종 해제 여부를 반환합니다. <br>
     * 자원 소유권은 이전하지 않습니다.
     *
     * @returns {boolean} 최종 해제 여부
     */
    get disposed(): boolean;
    /**
     * 자체 선택 수신 함수의 직접 교체를 제한합니다. <br>
     * 생성 옵션 또는 수명 메서드를 사용합니다.
     *
     * @param {function(any):void} value 대입할 값(직접 변경 불가)
     */
    set listener(value: (arg0: any) => void);
    /**
     * 자체 선택 수신 함수를 반환합니다. <br>
     * 자원 소유권은 이전하지 않습니다.
     *
     * @returns {function(any):void} 자체 선택 수신 함수
     */
    get listener(): (arg0: any) => void;
}
/**
 * 독립 상태 사본의 동기 수신 함수입니다.
 */
type USequencePlaybackListener$1 = (state: USequencePlaybackStateVo) => any;
/**
 * 현재 작업 오류를 동기 통지하는 수신 함수입니다.
 */
type USequencePlaybackErrorCallback = (error: Error) => any;
/**
 * Clock과 재생 이벤트 처리기의 생성 옵션입니다.
 */
type USequencePlaybackHandlerCO = {
    /**
     * 호출자 소유 조립 실행기. 재생 처리기 수명 중 외부 재설정·복원·해제는 금지합니다.
     */
    assemblyExecutor: USequenceAssemblyExecutor;
    /**
     * 자체 RAF 구동 여부. false이면 앱이 tick을 매 화면 갱신 호출합니다.
     */
    autoTick?: boolean | undefined;
    /**
     * 유한 재생 배속. 음수는 역방향이며 0은 정지
     */
    multiplier?: number | undefined;
    /**
     * 동기 오류 수신 함수. 없으면 이벤트 오류도 호출 경로에 전파합니다.
     */
    onError?: USequencePlaybackErrorCallback | null | undefined;
};
/**
 * 선택 GUID를 전달하는 동기 수신 함수입니다.
 */
type USequenceSelectionCallback = (objectIds: Array<string>) => any;
/**
 * 앱에 연결한 편집기 전용 선택기의 공개 API입니다.
 */
type USequenceSelectorPort = {
    /**
     * 이벤트와 수신 함수 등록
     */
    on: (arg0: string, arg1: Function) => unknown;
    /**
     * 동일한 수신 함수 하나 제거
     */
    off: (arg0: string, arg1: Function) => unknown;
    /**
     * 현재 선택한 메쉬 목록
     */
    getSelected: () => Array<Mesh>;
    /**
     * 전용 선택과 강조 초기화
     */
    clearSelect: () => void;
    /**
     * 메쉬 선택과 강조 완료
     */
    addSelected: (arg0: Mesh) => (PromiseLike<void> | void);
    /**
     * 해당 메쉬의 선택과 강조만 제거
     */
    removeSelected: (arg0: Mesh) => void;
};
/**
 * 전용 선택기와 메쉬 연결 정보를 빌리는 생성 옵션입니다.
 */
type USequenceSelectionHandlerCO = {
    /**
     * 호출자가 소유하고 앱에 연결한 편집기 전용 선택기
     */
    selector: USequenceSelectorPort;
    /**
     * 어댑터가 소유하는 메쉬 연결 목록
     */
    bindingManager: USequenceMeshBindingManager;
    /**
     * 호출자가 보장한 전체 형상 GUID 범위
     */
    objectIds: Array<string>;
    /**
     * 독립 GUID 사본을 받는 동기 함수
     */
    onSelectionChanged?: USequenceSelectionCallback | undefined;
    /**
     * 선택 이벤트의 비동기 오류를 받는 동기 함수
     */
    onError: (arg0: Error) => void;
};
/**
 * 공통 선택을 자료별 속성 조회와 연결하는 옵션입니다.
 */
type UTilesPropertySelectionHandlerCO = {
    /**
     * 예제 viewer인 호출자 소유 이벤트 영역입니다.
     */
    root: HTMLElement;
    /**
     * getLayers()를 제공하는 호출자 소유 지도 앱입니다.
     */
    app: object;
    /**
     * 객체 VO 또는 null, 자료 이름, 안내 문구를 받습니다.
     */
    onResult: (arg0: USequenceObjectPropertyVo | null, arg1: string, arg2: string) => void;
    /**
     * 현재 레이어와 GUID로 기존 조회 결과를 반환합니다.
     */
    resolveObject?: ((arg0: object, arg1: string) => USequenceObjectPropertyVo | null) | undefined;
    /**
     * 주입 가능한 속성 로더입니다.
     */
    loader?: USequencePropertyLoader | undefined;
};

/**
 * 같은 숫자 시간축을 공유하는 재생·탐색과 시간·분리율 제어 UI를 구성합니다.
 */
declare class USequenceTimeline {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceTimeline 클래스 생성자입니다. <br>
     * 공통 HTML 시간축과 시퀀스 전용 설정을 만들고 컨테이너에 부착합니다.
     *
     * @param {import('./USequenceTimeline.js').USequenceTimelineCO} opt 호출자가 소유하는 컨테이너와 사용 가능한 재생 처리기
     */
    constructor(opt: USequenceTimelineCO);
    _container: HTMLElement;
    _playbackHandler: USequencePlaybackHandler;
    _root: HTMLElement | null;
    _controls: {};
    _clockViewModel: UTimelineClockViewModel | null;
    _animationViewModel: UTimelineAnimationViewModel | null;
    _animation: UTimelineAnimationWidget | null;
    _timeline: UTimelineWidget | null;
    _unsubscribe: (() => void) | null;
    _removeRealtimeBlock: (() => void) | null;
    _resizeObserver: ResizeObserver | null;
    _disposed: boolean;
    _cleanupRunning: boolean;
    _resizeListener: () => void;
    _seekListener: (event: object) => void;
    _clickListener: (event: Event) => void;
    _inputListener: (event: Event) => void;
    /**
     * @type {import('./sequencePlayerUi.js').USequenceTimelineAdapter | null}
     */
    _timelineAdapter: USequenceTimelineAdapter | null;
    /** @type {import('../../timeline/ui/UTimelineView.js').UTimelineView|null} */
    _timelineView: UTimelineView | null;
    _errorListener: (event: Event) => void;
    /**
     * 전체 재생 범위를 표시하며 단일 시각은 시각 앞뒤 1초로 확대합니다.
     */
    fit(): void;
    /**
     * 현재 컨테이너 크기에 맞춰 두 위젯을 갱신합니다.
     */
    resize(): void;
    /**
     * 자체 위젯·DOM·구독을 정리하고 빌린 재생 처리기는 유지합니다.
     */
    dispose(): void;
    _disposeResource(name: any, failures: any): void;
    _disposeDom(failures: any): void;
    _clearWidgetReferences(): void;
    /**
     * 종료 작업 상태의 외부 교체를 거부합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set cleanupRunning(value: boolean);
    /**
     * 동기 종료 작업의 재진입 차단 상태를 반환합니다.
     *
     * @returns {boolean} 동기 종료 작업의 재진입 차단 상태
     */
    get cleanupRunning(): boolean;
    /**
     * 안전한 텍스트 DOM과 같은 숫자 시간축의 HTML 조작을 생성합니다.
     */
    _build(): void;
    /**
     * 자체 DOM·타임라인·상태 구독과 크기 갱신을 연결합니다.
     */
    _connect(): void;
    /**
     * 타임라인이 선택한 시각을 상대 초로 전달합니다.
     *
     * @param {object} event 숫자 position을 가진 settime 이벤트
     */
    _handleSeek(event: object): void;
    /**
     * 자체 도구 버튼에서 처음·마지막·시간 범위를 처리합니다.
     *
     * @param {Event} event 자체 루트에서 수신한 클릭 이벤트
     */
    _handleClick(event: Event): void;
    /**
     * 분리율 슬라이더의 값을 같은 시각에 즉시 적용합니다.
     *
     * @param {Event} event 자체 분리율 슬라이더의 input 이벤트
     */
    _handleInput(event: Event): void;
    /**
     * 독립 재생 상태를 텍스트·슬라이더에 표시합니다.
     *
     * @param {import('../../../../../extension/sequence/vo/sequenceDefinitionVos.js').USequencePlaybackStateVo} state 수신자에게 전달한 상태 사본
     */
    _render(state: any): void;
    /**
     * 가상 기준일은 상대 초로, 실제 기준일은 UTC 시각으로 표시합니다.
     *
     * @param {number} date 읽기 전용 문서 기준 상대 초입니다.
     * @returns {string} 실제 UTC 시각 또는 T±상대 초 라벨
     */
    _formatTime(date: number): string;
    /**
     * 이벤트 처리 오류를 실행되지 않는 일반 텍스트로 표시합니다.
     *
     * @param {Error} error 현재 작업에서 발생한 원래 오류
     */
    _showError(error: Error): void;
    /**
     * 공통 요소 생성기로 호출자 문서에 요소를 만들고 일반 텍스트와 클래스를 지정합니다. <br>
     * 반환 요소는 이 UI가 관리합니다.
     *
     * @param {string} tag HTML 요소 이름
     * @param {string} [text=''] textContent로 표시할 문자열(기본값은 빈 문자열)
     * @param {string} [className=''] 스타일 클래스 이름(기본값은 빈 문자열)
     * @returns {HTMLElement} 아직 부착하지 않은 자체 요소
     */
    _node(tag: string, text?: string, className?: string): HTMLElement;
    /**
     * 해제 후 위젯 사용을 거부합니다.
     */
    _alive(): void;
    /**
     * 호출자 소유 부착 요소의 직접 교체를 제한합니다.
     *
     * @param {HTMLElement} value 대입할 값(직접 변경 불가)
     */
    set container(value: HTMLElement);
    /**
     * 호출자 소유 부착 요소를 반환합니다.
     *
     * @returns {HTMLElement}
     */
    get container(): HTMLElement;
    /**
     * 호출자 소유 재생 처리기. <br>
     * UI 해제 전 외부 해제 금지의 직접 교체를 제한합니다.
     *
     * @param {import('../legacy/sequenceRequestHandlers.js').USequencePlaybackHandler} value 대입할 값(직접 변경 불가)
     */
    set playbackHandler(value: USequencePlaybackHandler);
    /**
     * 호출자 소유 재생 처리기. <br>
     * UI 해제 전 외부 해제 금지를 반환합니다.
     *
     * @returns {import('../legacy/sequenceRequestHandlers.js').USequencePlaybackHandler}
     */
    get playbackHandler(): USequencePlaybackHandler;
    /**
     * 자체 루트의 빌린 참조. <br>
     * 직접 제거 금지의 직접 교체를 제한합니다.
     *
     * @param {HTMLElement | null} value 대입할 값(직접 변경 불가)
     */
    set root(value: HTMLElement | null);
    /**
     * 자체 루트의 빌린 참조. <br>
     * 직접 제거 금지를 반환합니다.
     *
     * @returns {HTMLElement | null}
     */
    get root(): HTMLElement | null;
    /**
     * 자체 DOM 참조를 보관하는 독립 조회 사본. <br>
     * 요소의 외부 변경 금지의 직접 교체를 제한합니다.
     *
     * @param {object} value 대입할 값(직접 변경 불가)
     */
    set controls(value: object);
    /**
     * 자체 DOM 참조를 보관하는 독립 조회 사본. <br>
     * 요소의 외부 변경 금지를 반환합니다.
     *
     * @returns {object}
     */
    get controls(): object;
    /**
     * 자체 ClockViewModel의 빌린 조회 참조의 직접 교체를 제한합니다.
     *
     * @param {object | null} value 대입할 값(직접 변경 불가)
     */
    set clockViewModel(value: object | null);
    /**
     * 자체 ClockViewModel의 빌린 조회 참조를 반환합니다.
     *
     * @returns {object | null}
     */
    get clockViewModel(): object | null;
    /**
     * 자체 AnimationViewModel의 빌린 조회 참조의 직접 교체를 제한합니다.
     *
     * @param {object | null} value 대입할 값(직접 변경 불가)
     */
    set animationViewModel(value: object | null);
    /**
     * 자체 AnimationViewModel의 빌린 조회 참조를 반환합니다.
     *
     * @returns {object | null}
     */
    get animationViewModel(): object | null;
    /**
     * 자체 HTML 재생 조작의 빌린 조회 참조의 직접 교체를 제한합니다.
     *
     * @param {object | null} value 대입할 값(직접 변경 불가)
     */
    set animation(value: object | null);
    /**
     * 자체 HTML 재생 조작의 빌린 조회 참조를 반환합니다.
     *
     * @returns {object | null}
     */
    get animation(): object | null;
    /**
     * 자체 HTML 시간축의 빌린 조회 참조의 직접 교체를 제한합니다.
     *
     * @param {object | null} value 대입할 값(직접 변경 불가)
     */
    set timeline(value: object | null);
    /**
     * 자체 HTML 시간축의 빌린 조회 참조를 반환합니다.
     *
     * @returns {object | null}
     */
    get timeline(): object | null;
    /**
     * 상태 구독의 자체 해제 함수. <br>
     * 직접 호출 금지의 직접 교체를 제한합니다.
     *
     * @param {Function | null} value 대입할 값(직접 변경 불가)
     */
    set unsubscribe(value: Function | null);
    /**
     * 상태 구독의 자체 해제 함수. <br>
     * 직접 호출 금지를 반환합니다.
     *
     * @returns {Function | null}
     */
    get unsubscribe(): Function | null;
    /**
     * 자체 크기 감시기의 빌린 조회 참조의 직접 교체를 제한합니다.
     *
     * @param {object | null} value 대입할 값(직접 변경 불가)
     */
    set resizeObserver(value: object | null);
    /**
     * 자체 크기 감시기의 빌린 조회 참조를 반환합니다.
     *
     * @returns {object | null}
     */
    get resizeObserver(): object | null;
    /**
     * 자체 크기 이벤트 함수. <br>
     * 직접 호출 금지의 직접 교체를 제한합니다.
     *
     * @param {Function} value 대입할 값(직접 변경 불가)
     */
    set resizeListener(value: Function);
    /**
     * 자체 크기 이벤트 함수. <br>
     * 직접 호출 금지를 반환합니다.
     *
     * @returns {Function}
     */
    get resizeListener(): Function;
    /**
     * 자체 타임라인 이벤트 함수. <br>
     * 직접 호출 금지의 직접 교체를 제한합니다.
     *
     * @param {Function} value 대입할 값(직접 변경 불가)
     */
    set seekListener(value: Function);
    /**
     * 자체 타임라인 이벤트 함수. <br>
     * 직접 호출 금지를 반환합니다.
     *
     * @returns {Function}
     */
    get seekListener(): Function;
    /**
     * 자체 버튼 이벤트 함수. <br>
     * 직접 호출 금지의 직접 교체를 제한합니다.
     *
     * @param {Function} value 대입할 값(직접 변경 불가)
     */
    set clickListener(value: Function);
    /**
     * 자체 버튼 이벤트 함수. <br>
     * 직접 호출 금지를 반환합니다.
     *
     * @returns {Function}
     */
    get clickListener(): Function;
    /**
     * 자체 분리율 이벤트 함수. <br>
     * 직접 호출 금지의 직접 교체를 제한합니다.
     *
     * @param {Function} value 대입할 값(직접 변경 불가)
     */
    set inputListener(value: Function);
    /**
     * 자체 분리율 이벤트 함수. <br>
     * 직접 호출 금지를 반환합니다.
     *
     * @returns {Function}
     */
    get inputListener(): Function;
    /**
     * 자체 수명 종료 여부의 직접 교체를 제한합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set disposed(value: boolean);
    /**
     * 자체 수명 종료 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get disposed(): boolean;
    /**
     * 자체 명령 차단 수명의 직접 교체를 거부합니다.
     *
     * @param {Function | null} value 위젯 구독 해제 함수(직접 변경 불가)
     */
    set removeRealtimeBlock(value: Function | null);
    /**
     * 자체 실시간 명령 차단의 해제 함수를 반환합니다.
     *
     * @returns {Function | null} 자체 소유 해제 함수. <br>
     * 직접 호출하지 마십시오.
     */
    get removeRealtimeBlock(): Function | null;
    /**
     * 자체 축별 컨트롤을 Z·Y·X 순서로 외부 설정 영역에 옮깁니다. <br>
     * 값과 직접 입력 구독은 유지하며 dispose에서 자체 DOM만 제거합니다.
     *
     * @param {HTMLElement} container 축별 분리율 컨트롤을 추가할 같은 문서의 컨테이너
     */
    attachAxisControls(container: HTMLElement): void;
    _buildAxisControls(toolbar: any): void;
    _removeDom(): void;
    /**
     * 공통 View가 처리한 현재 명령·상태 오류를 기존 메시지 영역에 표시합니다. <br>
     * 종료 후 통지는 무시합니다.
     *
     * @param {Event} event 공통 View의 오류 통지입니다.
     */
    _handleTimelineError(event: Event): void;
    /**
     * 소유 연결기 교체를 거부하고 wrapper 수명과 구독을 함께 유지합니다.
     *
     * @param {import('./sequencePlayerUi.js').USequenceTimelineAdapter | null} value 타임라인 연결기(직접 변경 불가)
     */
    set timelineAdapter(value: USequenceTimelineAdapter | null);
    /**
     * 공통 재생 포트로 사용하는 Sequence 연결기를 빌려줍니다. <br>
     * 종료·교체는 wrapper가 담당합니다.
     *
     * @returns {import('./sequencePlayerUi.js').USequenceTimelineAdapter | null} 소유 연결기의 조회용 참조입니다.
     */
    get timelineAdapter(): USequenceTimelineAdapter | null;
    /**
     * 소유 공통 View의 교체를 거부하여 같은 Clock과 DOM 수명을 보호합니다.
     *
     * @param {import('../../timeline/timeline.js').UTimelineView | null} value 공통 타임라인 View(직접 변경 불가)
     */
    set timelineView(value: UTimelineView | null);
    /**
     * 실제 위젯을 구성한 공통 View를 빌려줍니다. <br>
     * 직접 해제하지 않고 wrapper.dispose를 사용합니다.
     *
     * @returns {import('../../timeline/timeline.js').UTimelineView | null} 소유 공통 View의 조회용 참조입니다.
     */
    get timelineView(): UTimelineView | null;
    /**
     * 등록된 오류 수신자의 교체를 거부하여 해제 시 원래 참조를 유지합니다.
     *
     * @param {function(Event):void} value 오류 이벤트 수신자(직접 변경 불가)
     */
    set errorListener(value: (arg0: Event) => void);
    /**
     * 기존 메시지 영역에 공통 오류를 연결한 수신자 참조를 반환합니다.
     *
     * @returns {function(Event):void} 소유 오류 수신자입니다.
     */
    get errorListener(): (arg0: Event) => void;
}
/**
 * 기존 호출을 유지하면서 공통 HTML View와 Sequence 연결기를 구성하는 UI 생성 옵션입니다.
 */
type USequenceTimelineCO = {
    /**
     * 호출자 소유 부착 위치. 기존 자식은 유지합니다.
     */
    container: HTMLElement;
    /**
     * 호출자 소유 재생 처리기. 공통 View가 기존 Clock을 빌리며 UI는 처리기·Clock·RAF를 생성하거나 해제하지 않습니다.
     */
    playbackHandler: USequencePlaybackHandler;
};

/** @import {USequenceSourceVoCO} from "../vo/sequenceDefinitionVos.js" */
/**
 * 교량 페이지의 입력 요청을 세션 관리기에 전달하고 편집기·타임라인을 연결합니다.
 */
declare class USequencePageHandler {
    /**
 * @type {ReadonlyArray<string>}
 *
 * @ignore
 */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequencePageHandler 클래스 생성자입니다. <br>
     * DOM과 실행 의존성을 검사하며 아직 이벤트를 등록하지 않습니다.
     *
     * @param {import('./sequencePageRuntime.js').USequencePageHandlerCO} opt 호출자 소유 root·Manager와 독립 복사할 설정
     */
    constructor(opt: USequencePageHandlerCO);
    _root: HTMLElement;
    _sessionManager: USequenceSessionManager;
    _initialSource: USequenceSourceVo;
    _controls: {};
    _widgets: any[];
    _unsubscribe: (() => void) | null;
    _downloadUrl: string | null;
    _mounted: boolean;
    _disposed: boolean;
    _requestGeneration: number;
    _clickHandler: (event: MouseEvent) => void;
    _changeHandler: (event: Event) => void;
    _beforeUnloadHandler: (event: BeforeUnloadEvent) => void;
    /**
     * 자신의 화면과 이벤트를 연결합니다.
     */
    mount(): void;
    /**
     * 이벤트·위젯·다운로드 자원만 해제합니다.
     */
    unmount(): void;
    /**
     * 해제 상태로 전환하며 빌린 Manager는 유지합니다.
     */
    dispose(): void;
    /**
     * 세션의 교체 순서에 맞춰 UI만 해제·재구성합니다.
     *
     * @param {'before' | 'changed' | 'status'} type 동기 세션 이벤트
     */
    _receiveSession(type: "before" | "changed" | "status"): void;
    /**
     * 현재 세션에 기존 편집기와 단일 Clock 위젯을 연결합니다.
     */
    _mountWidgets(): void;
    /**
     * 일부 위젯의 해제 실패에도 나머지를 해제합니다.
     *
     * @param {Array<Error>} failures 해제 오류를 추가할 출력 배열
     */
    _disposeWidgets(failures: Array<Error>): void;
    /**
     * 확정 그룹을 현재 일정과 함께 적용합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceGroupVo>} groups 편집기가 반환한 확정 사본
     */
    _applyGroups(groups: Array<USequenceGroupVo>): void;
    /**
     * 확정 일정을 현재 시각에 적용합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceVo} sequence 편집기가 반환한 확정 사본
     */
    _applySchedule(sequence: USequenceVo): void;
    /**
     * 미확정 그룹·일정 초안이 존재하는지 확인합니다.
     *
     * @returns {boolean} 편집 실행기의 dirty 여부
     */
    _hasDraft(): boolean;
    /**
     * 초안 폐기를 명시 확인합니다.
     *
     * @returns {boolean} 초안이 없거나 사용자가 폐기에 동의한 경우 true
     */
    _confirmReplace(): boolean;
    /**
     * 자신의 버튼 요청을 비동기 실행하고 거절을 표시합니다.
     *
     * @param {MouseEvent} event root에서 수신한 실제 DOM 클릭이며 외부 버튼은 처리하지 않음
     */
    _handleClick(event: MouseEvent): void;
    /**
     * 페이지 요청을 담당 모듈에 전달합니다.
     *
     * @param {string} action 자신의 data-sequence-action 명령
     * @returns {Promise<void>} 처리 완료 또는 원래 오류
     */
    _runAction(action: string): Promise<void>;
    /**
     * 파일 선택·분리 그룹 변경을 처리합니다.
     *
     * @param {Event} event 자신의 DOM 변경 이벤트
     */
    _handleChange(event: Event): void;
    /**
     * 입력 주소를 고정 형상 범위 설정에 복사합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceSourceVo} 독립 연결 설정
     */
    _readSource(): USequenceSourceVo;
    /**
     * 선택 그룹의 동·북·상 분리 거리를 표시합니다.
     */
    _renderExplode(): void;
    /**
     * 선택 그룹의 분리 거리를 확정 문서 사본에 적용합니다.
     */
    _applyExplode(): void;
    /**
     * 확정 문서를 UTF-8 JSON 파일로 내려받습니다.
     */
    _download(): void;
    /**
     * 빌린 페이지 루트의 직접 교체를 제한합니다.
     *
     * @param {HTMLElement} value 대입할 값(직접 변경 불가)
     */
    set root(value: HTMLElement);
    /**
     * 빌린 페이지 루트을 반환합니다.
     *
     * @returns {HTMLElement}
     */
    get root(): HTMLElement;
    /**
     * 빌린 세션 관리기의 직접 교체를 제한합니다.
     *
     * @param {import('./sequenceSessionRuntime.js').USequenceSessionManager} value 대입할 값(직접 변경 불가)
     */
    set sessionManager(value: USequenceSessionManager);
    /**
     * 빌린 세션 관리기을 반환합니다.
     *
     * @returns {import('./sequenceSessionRuntime.js').USequenceSessionManager}
     */
    get sessionManager(): USequenceSessionManager;
    /**
     * 초기 연결 설정 사본의 직접 교체를 제한합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceSourceVo} value 대입할 값(직접 변경 불가)
     */
    set initialSource(value: USequenceSourceVo);
    /**
     * 초기 연결 설정 사본을 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceSourceVo}
     */
    get initialSource(): USequenceSourceVo;
    /**
     * UI 요소 사본의 직접 교체를 제한합니다.
     *
     * @param {Record<string, HTMLElement>} value 대입할 값(직접 변경 불가)
     */
    set controls(value: Record<string, HTMLElement>);
    /**
     * UI 요소 사본을 반환합니다.
     *
     * @returns {Record<string, HTMLElement>}
     */
    get controls(): Record<string, HTMLElement>;
    /**
     * 위젯 목록 사본의 직접 교체를 제한합니다.
     *
     * @param {Array<object>} value 대입할 값(직접 변경 불가)
     */
    set widgets(value: Array<object>);
    /**
     * 위젯 목록 사본을 반환합니다.
     *
     * @returns {Array<object>}
     */
    get widgets(): Array<object>;
    /**
     * 세션 구독 해제 함수의 직접 교체를 제한합니다.
     *
     * @param {Function | null} value 대입할 값(직접 변경 불가)
     */
    set unsubscribe(value: Function | null);
    /**
     * 세션 구독 해제 함수을 반환합니다.
     *
     * @returns {Function | null}
     */
    get unsubscribe(): Function | null;
    /**
     * 소유 다운로드 URL의 직접 교체를 제한합니다.
     *
     * @param {string | null} value 대입할 값(직접 변경 불가)
     */
    set downloadUrl(value: string | null);
    /**
     * 소유 다운로드 URL을 반환합니다.
     *
     * @returns {string | null}
     */
    get downloadUrl(): string | null;
    /**
     * 화면 연결 여부의 직접 교체를 제한합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set mounted(value: boolean);
    /**
     * 화면 연결 여부을 반환합니다.
     *
     * @returns {boolean}
     */
    get mounted(): boolean;
    /**
     * 해제 여부의 직접 교체를 제한합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set disposed(value: boolean);
    /**
     * 해제 여부을 반환합니다.
     *
     * @returns {boolean}
     */
    get disposed(): boolean;
    /**
     * 화면 요청 세대의 직접 교체를 제한합니다.
     *
     * @param {number} value 대입할 값(직접 변경 불가)
     */
    set requestGeneration(value: number);
    /**
     * 화면 요청 세대을 반환합니다.
     *
     * @returns {number}
     */
    get requestGeneration(): number;
    /**
     * 클릭 수신 함수의 직접 교체를 제한합니다.
     *
     * @param {Function} value 대입할 값(직접 변경 불가)
     */
    set clickHandler(value: Function);
    /**
     * 클릭 수신 함수을 반환합니다.
     *
     * @returns {Function}
     */
    get clickHandler(): Function;
    /**
     * 변경 수신 함수의 직접 교체를 제한합니다.
     *
     * @param {Function} value 대입할 값(직접 변경 불가)
     */
    set changeHandler(value: Function);
    /**
     * 변경 수신 함수을 반환합니다.
     *
     * @returns {Function}
     */
    get changeHandler(): Function;
    /**
     * 이탈 확인 함수의 직접 교체를 제한합니다.
     *
     * @param {Function} value 대입할 값(직접 변경 불가)
     */
    set beforeUnloadHandler(value: Function);
    /**
     * 이탈 확인 함수을 반환합니다.
     *
     * @returns {Function}
     */
    get beforeUnloadHandler(): Function;
    /**
     * 이전 다운로드 URL을 반환합니다.
     */
    _revokeDownload(): void;
    /**
     * 편집 초안이 있을 때 브라우저 이탈 확인을 요청합니다.
     *
     * @param {BeforeUnloadEvent} event 브라우저 소유 이탈 이벤트
     */
    _handleBeforeUnload(event: BeforeUnloadEvent): void;
    /**
     * 일반 텍스트 상태를 표시합니다.
     *
     * @param {string} text 실행하지 않고 textContent로 표시할 메시지
     */
    _showStatus(text: string): void;
    /**
     * 원래 오류를 사용자 상태로 표시합니다.
     *
     * @param {Error} error 오류 원인·스택을 보존하는 실제 예외
     */
    _showError(error: Error): void;
    /**
     * 초기 자료를 자동 연결하고 레이어 ready로 경계 준비를 기다린 뒤 카메라를 맞춥니다. <br>
     * 예제 UI 초기화에서 호출하며 최신 요청과 부착 상태가 유지될 때만 후속 작업·오류 표시를 수행합니다.
     *
     * @returns {Promise<void>} 초기 자료를 자동 연결하고 레이어 ready로 경계 준비를 기다린 뒤 카메라를 맞춥니다.
     */
    connectInitialSource(): Promise<void>;
    _mountProperties(session: any): void;
    /**
     * 현재 부착된 속성 위젯에 공통 지도 선택 결과를 전달합니다. <br>
     * 세션 재연결로 폐기한 위젯에는 접근하지 않습니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceObjectPropertyVo | null} object 표시할 객체 속성 또는 표시를 해제하는 null
     * @param {string} [sourceName] 속성을 읽은 자료의 표시 이름
     * @param {string} [notice] 속성 패널에 표시할 안내 문구
     */
    showObjectProperties(object: USequenceObjectPropertyVo | null, sourceName?: string, notice?: string): void;
    _openProperties(): void;
    _toggleTimeline(button: any): void;
}
/**
 * 예제 DOM과 세션 연결 의존성입니다.
 */
type USequencePageHandlerCO = {
    /**
     * 호출자 소유 페이지 기능 루트
     */
    root: HTMLElement;
    /**
     * 호출자 소유 세션 수명 관리기
     */
    sessionManager: USequenceSessionManager;
    /**
     * 같은 형상 revision의 전체 GUID가 포함된 초기 설정. <br>
     * 복사함
     */
    initialSource: USequenceSourceVo | USequenceSourceVoCO;
};

/**
 * 편집기·파일 저장 호출자가 사용하며 IO·Player·자동 재생을 실행하지 않는 stateless Writer입니다.
 */
declare class USequenceDocumentWriter {
    /**
     * API 정의와 선택 북마크로 완성 문서를 만듭니다. <br>
     * 생략 북마크는 시작 시각·배속1·빈 기능 상태입니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceDefinitionVoCO | import('../vo/sequenceDefinitionVos.js').USequenceDefinitionVo} sequence 필수 정의, 변경 없음
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceBookmarkVoCO | import('../vo/sequenceDefinitionVos.js').USequenceBookmarkVo | null} [bookmark=null] 기본null이면 시작값 생성
     * @param {import('./sequenceData.js').USequenceDocumentValidationOptions} [opt={}] 문서 검증 설정
     * @returns {import('../vo/sequenceDefinitionVos.js').USequencePlaybackDocumentVo}
     */
    create(sequence: USequenceDefinitionVoCO | USequenceDefinitionVo, bookmark?: USequenceBookmarkVoCO | USequenceBookmarkVo | null, opt?: USequenceDocumentValidationOptions): USequencePlaybackDocumentVo;
    /**
     * 완성 문서를 검증한 뒤 내부 필드 없는 공개 JSON 사본을 반환합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePlaybackDocumentVoCO | import('../vo/sequenceDefinitionVos.js').USequencePlaybackDocumentVo} document JSON으로 변환할 재생 문서
     * @param {import('./sequenceData.js').USequenceDocumentValidationOptions} [opt={}] 문서 검증 설정
     * @returns {import('./sequenceData.js').USequenceJsonObject} 내부 필드가 없는 JSON 객체 사본
     */
    toObject(document: USequencePlaybackDocumentVoCO | USequencePlaybackDocumentVo, opt?: USequenceDocumentValidationOptions): USequenceJsonObject;
    /**
     * 공개 문서를 기본2칸 또는 압축 JSON으로 반환합니다. <br>
     * 파일/네트워크에 쓰지 않습니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePlaybackDocumentVoCO | import('../vo/sequenceDefinitionVos.js').USequencePlaybackDocumentVo} document 읽기 전용 완성 입력
     * @param {import('./sequenceDocumentRuntime.js').USequenceDocumentWriteOptions} [opt={}] 기본{}, pretty 기본true
     * @returns {string}
     */
    stringify(document: USequencePlaybackDocumentVoCO | USequencePlaybackDocumentVo, opt?: USequenceDocumentWriteOptions): string;
}
/**
 * Reader·마이그레이션·내보내기에서 사용하며 실행 기능·형상·IO를 소유하지 않는 stateless Executor입니다.
 */
declare class USequenceLegacyConversionExecutor {
    /**
     * 명시적 1.0 정의/문서를 construction 설정으로 보존합니다. <br>
     * 일반 이동 채널과 실행 상태를 만들지 않습니다.
     *
     * @param {unknown} value 원문, 실행 인스턴스/null 거부
     * @param {import('./sequenceDocumentRuntime.js').USequenceLegacyConversionOptions} opt 등록 ID와 빌린 기존 검증기 필수, 변경 없음
     * @returns {import('../vo/sequenceDefinitionVos.js').USequencePlaybackDocumentVo} 새 문서
     */
    toDocument(value: unknown, opt: USequenceLegacyConversionOptions): USequencePlaybackDocumentVo;
    /**
     * 원문 매핑으로 표현 가능한 문서만 역변환합니다. <br>
     * 추가 데이터·변경된 관계는 첫 손실 경로로 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePlaybackDocumentVoCO | import('../vo/sequenceDefinitionVos.js').USequencePlaybackDocumentVo} document 2.0 완성 문서
     * @param {import('./sequenceDocumentRuntime.js').USequenceLegacyConversionOptions} opt 원래 등록 ID와 기존 검증기 필수, 변경 없음
     * @returns {import('./sequenceData.js').USequenceJsonObject} 1.0 공개 문서
     */
    toLegacy(document: USequencePlaybackDocumentVoCO | USequencePlaybackDocumentVo, opt: USequenceLegacyConversionOptions): USequenceJsonObject;
    /**
     * 기존 검증기와 매핑/충돌 검사를 결합한 construction 정의 검증 함수를 반환합니다. <br>
     * 기능을 실행하지 않습니다.
     *
     * @param {import('./sequenceData.js').USequenceLegacyValidator} legacyValidator 빌린 동기 void 검증 함수
     * @returns {import('./sequenceEvaluationRuntime.js').USequenceFeatureDefinitionValidator} 등록 함수
     */
    createFeatureValidator(legacyValidator: USequenceLegacyValidator): USequenceFeatureDefinitionValidator;
}
/**
 * @typedef {{ legacyAdapterId: string; legacyValidator: import('./sequenceData.js').USequenceLegacyValidator; }} USequenceLegacyConversionOptions
 */
/**
 * 파일 불러오기·외부 API 소비자가 사용하며 현재 문서·Player·엔진 수명은 보관하지 않습니다.
 */
declare class USequenceDocumentReader {
    /**
     * USequenceDocumentReader 클래스 생성자입니다. <br>
     * 명시한 요청/검증 함수만 빌립니다. <br>
     * fetcher가 없으면 메모리/파일 입력만 사용할 수 있습니다.
     *
     * @param {import('./sequenceDocumentRuntime.js').USequenceDocumentReaderCO} [opt={}] 기본{}, 함수 소유권 이전/원본 변경 없음
     */
    constructor(opt?: USequenceDocumentReaderCO);
    /**
     * @type {import('./sequenceData.js').USequenceDocumentFetcher | null}
     */ _fetcher: USequenceDocumentFetcher | null;
    /**
     * @type {Map<string, import('./sequenceEvaluationRuntime.js').USequenceFeatureDefinitionValidator>}
     */ _featureValidators: Map<string, USequenceFeatureDefinitionValidator>;
    /**
     * @type {import('./sequenceData.js').USequenceLegacyValidator | null}
     */ _legacyValidator: USequenceLegacyValidator | null;
    /**
     * 이후 요청의 함수를 교체합니다. <br>
     * 진행 중 호출의 캡처는 바꾸지 않습니다.
     *
     * @param {import('./sequenceData.js').USequenceDocumentFetcher | null} value 빌린 함수 또는 네트워크 미사용 null
     */
    set fetcher(value: USequenceDocumentFetcher | null);
    /**
     * 빌린 요청 함수 참조 또는 null을 반환합니다.
     *
     * @returns {import('./sequenceData.js').USequenceDocumentFetcher | null} 빌린 요청 함수 참조 또는 null
     */
    get fetcher(): USequenceDocumentFetcher | null;
    /**
     * 새 기능 등록의 사본을 보관하고 construction 중복 연결을 거부합니다.
     *
     * @param {Map<string, import('./sequenceEvaluationRuntime.js').USequenceFeatureDefinitionValidator>} value 등록 목록, 함수 소유권 이전 없음
     */
    set featureValidators(value: Map<string, USequenceFeatureDefinitionValidator>);
    /**
     * 함수 참조는 빌리고 등록 Map 목록은 복사하여 반환합니다.
     *
     * @returns {Map<string, import('./sequenceEvaluationRuntime.js').USequenceFeatureDefinitionValidator>} 함수 참조는 빌리고 등록 Map 목록은 복사하여 반환합니다.
     */
    get featureValidators(): Map<string, USequenceFeatureDefinitionValidator>;
    /**
     * 이후 호출의 기존 검증 함수를 교체하며 중복 construction 등록을 거부합니다.
     *
     * @param {import('./sequenceData.js').USequenceLegacyValidator | null} value 빌린 동기 void 검증기 또는 미연결 null
     */
    set legacyValidator(value: USequenceLegacyValidator | null);
    /**
     * 선택 연결된 기존 1.0 검증 함수 또는 null을 반환합니다.
     *
     * @returns {import('./sequenceData.js').USequenceLegacyValidator | null} 선택 연결된 기존 1.0 검증 함수 또는 null
     */
    get legacyValidator(): USequenceLegacyValidator | null;
    /**
     * 메모리 공개 JSON 또는 2.0 VO를 읽고 독립 문서/출처를 반환합니다.
     *
     * @param {unknown} value 명시 버전이 있는 정의/문서 또는 2.0 VO, null/실행 자원 거부
     * @param {import('./sequenceData.js').USequenceDocumentReadOptions} [opt={}] 기본{}, 명시 기준/선택 해석/취소/legacy 등록 ID
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceDocumentReadResultVo} 결과
     */
    read(value: unknown, opt?: USequenceDocumentReadOptions): USequenceDocumentReadResultVo;
    /**
     * BOM1개와 중복 키 검사를 거쳐 JSON 텍스트를 동기 검증합니다.
     *
     * @param {string} text JSON 원문, 비문자열 거부
     * @param {import('./sequenceData.js').USequenceDocumentReadOptions} [opt={}] 기본{}, 실행/기준 옵션
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceDocumentReadResultVo} 결과
     */
    parse(text: string, opt?: USequenceDocumentReadOptions): USequenceDocumentReadResultVo;
    /**
     * 주입 함수에 GET/인증/취소 옵션을 전달하고 최종 응답 URL을 문서 기준으로 사용합니다.
     *
     * @param {string} uri 요청 주소
     * @param {import('./sequenceData.js').USequenceDocumentReadOptions} [opt={}] 기본{}, request는 GET header/credentials/redirect만 허용, signal 빌림
     * @returns {Promise<import('../vo/sequenceDefinitionVos.js').USequenceDocumentReadResultVo>} 결과
     */
    load(uri: string, opt?: USequenceDocumentReadOptions): Promise<USequenceDocumentReadResultVo>;
    /**
     * 빌린 File/Blob 호환 text() 입력을 읽습니다. <br>
     * 읽기 자체를 중단하지 못해도 취소 뒤 결과를 채택하지 않습니다.
     *
     * @param {import('./sequenceData.js').USequenceDocumentFile} file Promise<string> text()가 있는 빌린 입력, 수정/해제/소유권 이전 없음
     * @param {import('./sequenceData.js').USequenceDocumentReadOptions} [opt={}] 기본{}, 로컬 파일 기준은 명시 baseUrl만 사용
     * @returns {Promise<import('../vo/sequenceDefinitionVos.js').USequenceDocumentReadResultVo>}
     */
    loadFile(file: USequenceDocumentFile, opt?: USequenceDocumentReadOptions): Promise<USequenceDocumentReadResultVo>;
    #private;
}
type USequenceDocumentWriteOptions = USequenceDocumentValidationOptions & Partial<{
    pretty: boolean;
}>;
type USequenceLegacyConversionOptions = {
    legacyAdapterId: string;
    legacyValidator: USequenceLegacyValidator;
};
type USequenceDocumentReaderCO = USequenceDocumentValidationOptions & Partial<{
    fetcher: USequenceDocumentFetcher | null;
}>;
type USequenceDocumentReadSnapshot = {
    baseUrl: string | null;
    resolveUris: boolean;
    request: USequenceDocumentRequest;
    validation: USequenceDocumentValidationOptions;
    fetcher: USequenceDocumentFetcher | null;
} & Partial<{
    legacyAdapterId: string;
    signal: USequenceAbortSignalPort$1;
}>;

type USequencePlayerUiHandlerCO = USequencePlayerUiHandlerCO$1;
type USequenceUiPlayerPort = USequenceUiPlayerPort$1;
type USequenceUiTimeline = USequenceUiTimeline$1;
type USequenceUiControls = USequenceUiControls$1;
type USequenceUiComponent = USequenceUiComponent$1;
type USequenceUiDocumentPort = USequenceUiDocumentPort$1;
type USequenceUiApplyOptions = USequenceUiApplyOptions$1;
type USequenceUiTextOptions = USequenceUiTextOptions$1;

/**
 * 선택형 브라우저 진입점에서 기존 1.0 VO/의미 검증기로 공개 JSON을 확인합니다. <br>
 * native 문서 진입점은 이 연결을 강제로 import하지 않으며 파일·레이어·Player를 실행하지 않습니다.
 *
 * @param {unknown} value 공개 원문
 * @param {string} [location='legacy.sequence'] 오류 위치
 */
declare function validateLegacySequenceData(value: unknown, location?: string): void;

/** @import {USequenceAbortSignalPort,USequenceAdapterPrepareContext,USequenceApplyPlan,USequenceControlledProperty,USequenceFramePortInput,USequencePortAsset,USequencePortUnsubscribe,USequenceTargetChangeListener,USequenceTargetStatePortInput,USequenceCoordinatePort} from "../../core/sequenceData.js" */
/** @import {USequenceTargetVoCO,USequenceTargetStateVoCO} from "../../vo/sequenceDefinitionVos.js" */
/**
 * 일반 Three 앱이 SQ-003 프레임을 적용할 때 사용하며 빌린 scene/mesh/geometry/material을 파괴하거나 GeOnDT·Cesium·DOM을 요구하지 않습니다.
 */
declare class USequenceThreeAdapter {
    /**
     * USequenceThreeAdapter 클래스 생성자입니다. <br>
     * 전체 논리 대상과 동기 resolver를 빌리고 단위 배율을 고정합니다. <br>
     * native 객체 취득/장면 쓰기는 prepare까지 수행하지 않습니다.
     *
     * @param {import('./sequenceThreeRuntime.js').USequenceThreeAdapterCO} opt targets/resolver 필수, worldUnitsPerMeter 기본1 scene unit/m
     */
    constructor(opt: USequenceThreeAdapterCO);
    /** @type {Array<USequenceThreeTarget>} */ _targets: Array<USequenceThreeTarget>;
    /** @type {USequenceThreeResolver} */ _resolver: USequenceThreeResolver;
    /** @type {number} */ _worldUnitsPerMeter: number;
    /** @type {USequenceThreeTransformExecutor} */ _executor: USequenceThreeTransformExecutor;
    /** @type {USequenceThreeSession|null} */ _session: USequenceThreeSession | null;
    /** @type {USequenceThreePlan|null} */ _activePlan: USequenceThreePlan | null;
    /**
     * @type {Map<object, import('../../core/sequenceData.js').USequenceTargetChangeListener>}
     */ _listeners: Map<object, USequenceTargetChangeListener>;
    /** @type {'new'|'preparing'|'ready'|'closing'|'cleanupFailed'|'disposed'|'failed'} */ _status: "new" | "preparing" | "ready" | "closing" | "cleanupFailed" | "disposed" | "failed";
    /** @type {boolean} */ _busy: boolean;
    /**
     * 정적 조각과 기준 사본을 전부 검사한 뒤 취소/종료를 재확인하고 lease와 세션을 확정합니다. <br>
     * 실패 후보를 publish하지 않습니다.
     *
     * @param {import('../../core/sequenceData.js').USequencePortAsset} asset 빌린 자료 설명, 내부 사본 생성, URI 직접 요청 없음
     * @param {import('../../core/sequenceData.js').USequenceAdapterPrepareContext} context 문맥, 세대/대상/속성/좌표는 복사
     * @param {import('../../core/sequenceData.js').USequenceAbortSignalPort} signal 호출자 소유 신호, 구독/중단/소유권 이전 없음
     * @returns {Promise<void>} 준비
     */
    prepare(asset: USequencePortAsset, context: USequenceAdapterPrepareContext$1, signal: USequenceAbortSignalPort$1): Promise<void>;
    /**
     * 정적 이동/표시/local 기준 경계/완전 manifest 능력을 사본으로 반환합니다. <br>
     * 스트리밍은 지원하지 않습니다.
     *
     * @returns {import('../../vo/sequenceDefinitionVos.js').USequenceAdapterCapabilitiesVo}
     */
    getCapabilities(): USequenceAdapterCapabilitiesVo;
    /**
     * 준비된 자료/원본 revision과 전체 정적 논리 목록을 반환합니다.
     *
     * @returns {import('../../vo/sequenceDefinitionVos.js').USequenceTargetManifestVo} 사본
     */
    getTargetManifest(): USequenceTargetManifestVo;
    /**
     * 등록된 정적 대상의 준비 상태를 반환하며 알 수 없는 대상을 무기한 대기로 위장하지 않습니다.
     *
     * @param {ReadonlyArray<import('./sequenceThreeRuntime.js').USequenceThreeTarget>} targets 중복 없는 등록 대상 목록, 빈 목록 허용, 변경 없음
     * @returns {import('../../vo/sequenceDefinitionVos.js').USequenceReadinessVo} 사본
     */
    getReadiness(targets: ReadonlyArray<USequenceThreeTarget>): USequenceReadinessVo;
    /**
     * 자기 구독만 등록하고 초기/가짜 변경 통지를 만들지 않습니다. <br>
     * 정적 대상은 준비 후 바뀌지 않습니다.
     *
     * @param {import('../../core/sequenceData.js').USequenceTargetChangeListener} listener 빌린 동기 무인자 함수
     * @returns {import('../../core/sequenceData.js').USequencePortUnsubscribe} 해제
     */
    subscribeTargets(listener: USequenceTargetChangeListener): USequencePortUnsubscribe;
    /**
     * 모든 조각의 최초 기준 경계를 local 선언 단위로 반환합니다. <br>
     * 현재 이동을 재기준화하지 않습니다.
     *
     * @param {ReadonlyArray<import('./sequenceThreeRuntime.js').USequenceThreeTarget>} targets 등록 대상 목록, 중복/null 거부, 변경 없음
     * @param {string} coordinateId 준비된 local 좌표 ID, ENU 역변환은 명시 미지원
     * @returns {Array<import('../../vo/sequenceDefinitionVos.js').USequenceTargetGeometryVo>} 사본
     */
    getReferenceGeometry(targets: ReadonlyArray<USequenceThreeTarget>, coordinateId: string): Array<USequenceTargetGeometryVo>;
    /**
     * 모든 native 쓰기 전에 순수 계산·현재 상태 검증을 완료하고 최근 하나의 opaque handle만 보관합니다.
     *
     * @param {import('../../core/sequenceData.js').USequenceFramePortInput} frame 독립 복사할 전체 프레임, 다른 자료 상태는 무시
     * @returns {import('../../core/sequenceData.js').USequenceApplyPlan}
     */
    plan(frame: USequenceFramePortInput): USequenceApplyPlan;
    /**
     * 최근 자기 handle·세대·바인딩을 모두 재검사한 뒤 적용합니다. <br>
     * 부분 실패 사본은 rollback을 위해 유지합니다.
     *
     * @param {import('../../core/sequenceData.js').USequenceApplyPlan} plan 최근 plan이 반환한 identity, 변조/과거/다른 Adapter handle 거부
     */
    commit(plan: USequenceApplyPlan): void;
    /**
     * 현재 계획의 실제 시작한 쓰기를 직전 사본으로 복구합니다. <br>
     * 실패한 항목만 다음 호출에 재시도합니다.
     *
     * @param {import('../../core/sequenceData.js').USequenceApplyPlan} plan handle
     */
    rollback(plan: USequenceApplyPlan): void;
    /**
     * 제어한 속성만 최초 기준으로 복원하고 이전 계획을 무효화합니다. <br>
     * 준비 전과 반복 호출은 안전합니다.
     */
    restore(): void;
    /**
     * 명령/구독을 먼저 차단하고 자기 기준 복원과 lease 정리를 모두 시도합니다. <br>
     * 실패 객체 사본/lease는 반복 해제를 위해 유지합니다.
     */
    dispose(): void;
    /**
     * 생성 후 내부 준비/수명 상태의 직접 교체를 거부합니다.
     *
     * @param {Array<import('../../vo/sequenceDefinitionVos.js').USequenceTargetVo>} value 대입할 값(설정 교체는 새 Adapter 생성)
     */
    set targets(value: Array<USequenceTargetVo>);
    /**
     * 복합 대상의 독립 VO 목록를 반환합니다. <br>
     * 함수/native 자원 소유권 이전은 없습니다.
     *
     * @returns {Array<import('./sequenceThreeRuntime.js').USequenceThreeTarget>}
     */
    get targets(): Array<USequenceThreeTarget>;
    /**
     * 생성 후 내부 준비/수명 상태의 직접 교체를 거부합니다.
     *
     * @param {import('./sequenceThreeRuntime.js').USequenceThreeResolver} value 대입할 값(설정 교체는 새 Adapter 생성)
     */
    set resolver(value: USequenceThreeResolver);
    /**
     * 빌린 정적 resolver 참조를 반환합니다. <br>
     * 함수/native 자원 소유권 이전은 없습니다.
     *
     * @returns {import('./sequenceThreeRuntime.js').USequenceThreeResolver}
     */
    get resolver(): USequenceThreeResolver;
    /**
     * 생성 후 내부 준비/수명 상태의 직접 교체를 거부합니다.
     *
     * @param {number} value 대입할 값(설정 교체는 새 Adapter 생성)
     */
    set worldUnitsPerMeter(value: number);
    /**
     * scene unit/m의 고정 배율를 반환합니다. <br>
     * 함수/native 자원 소유권 이전은 없습니다.
     *
     * @returns {number}
     */
    get worldUnitsPerMeter(): number;
    /**
     * 생성 후 내부 준비/수명 상태의 직접 교체를 거부합니다.
     *
     * @param {import('./sequenceThreeRuntime.js').USequenceThreeTransformExecutor} value 대입할 값(설정 교체는 새 Adapter 생성)
     */
    set executor(value: USequenceThreeTransformExecutor);
    /**
     * 수명 자원이 없는 고정 실행기 참조를 반환합니다. <br>
     * 함수/native 자원 소유권 이전은 없습니다.
     *
     * @returns {import('./sequenceThreeRuntime.js').USequenceThreeTransformExecutor}
     */
    get executor(): USequenceThreeTransformExecutor;
    /**
     * 생성 후 내부 준비/수명 상태의 직접 교체를 거부합니다.
     *
     * @param {import('./sequenceThreeRuntime.js').USequenceThreeSessionInfo | null} value 대입할 값(설정 교체는 새 Adapter 생성)
     */
    set session(value: USequenceThreeSessionInfo | null);
    /**
     * native 기준을 노출하지 않는 준비 진단 사본을 반환합니다. <br>
     * 함수/native 자원 소유권 이전은 없습니다.
     *
     * @returns {import('./sequenceThreeRuntime.js').USequenceThreeSessionInfo | null}
     */
    get session(): USequenceThreeSessionInfo | null;
    /**
     * 생성 후 내부 준비/수명 상태의 직접 교체를 거부합니다.
     *
     * @param {{ handle: import('../../core/sequenceData.js').USequenceApplyPlan; status: string; } | null} value 대입할 값(설정 교체는 새 Adapter 생성)
     */
    set activePlan(value: {
        handle: USequenceApplyPlan;
        status: string;
    } | null);
    /**
     * 최근 계획 identity와 상태의 진단 사본을 반환합니다. <br>
     * 함수/native 자원 소유권 이전은 없습니다.
     *
     * @returns {{ handle: import('../../core/sequenceData.js').USequenceApplyPlan; status: string; } | null}
     */
    get activePlan(): {
        handle: USequenceApplyPlan;
        status: string;
    } | null;
    /**
     * 생성 후 내부 준비/수명 상태의 직접 교체를 거부합니다.
     *
     * @param {Map<any, import('../../core/sequenceData.js').USequenceTargetChangeListener>} value 대입할 값(설정 교체는 새 Adapter 생성)
     */
    set listeners(value: Map<any, USequenceTargetChangeListener>);
    /**
     * 자기 구독 목록 사본을 반환합니다. <br>
     * 함수/native 자원 소유권 이전은 없습니다.
     *
     * @returns {Map<object, import('../../core/sequenceData.js').USequenceTargetChangeListener>}
     */
    get listeners(): Map<object, USequenceTargetChangeListener>;
    /**
     * 생성 후 내부 준비/수명 상태의 직접 교체를 거부합니다.
     *
     * @param {string} value 대입할 값(설정 교체는 새 Adapter 생성)
     */
    set status(value: string);
    /**
     * 읽기 전용 수명 상태를 반환합니다. <br>
     * 함수/native 자원 소유권 이전은 없습니다.
     *
     * @returns {string}
     */
    get status(): string;
    /**
     * 생성 후 내부 준비/수명 상태의 직접 교체를 거부합니다.
     *
     * @param {boolean} value 대입할 값(설정 교체는 새 Adapter 생성)
     */
    set busy(value: boolean);
    /**
     * 공개 명령 재진입 방지 상태를 반환합니다. <br>
     * 함수/native 자원 소유권 이전은 없습니다.
     *
     * @returns {boolean}
     */
    get busy(): boolean;
    #private;
}
/**
 * 일반 Three Adapter가 사용하는 stateless Executor이며 대상 등록·lease·IO·구독·엔진 수명을 소유하지 않습니다.
 */
declare class USequenceThreeTransformExecutor {
    /**
     * TRS·수동 행렬·하위/부모 signature·기준 형상을 native 변경 없이 캡처합니다.
     *
     * @param {import('./sequenceThreeRuntime.js').USequenceThreeObject} object 객체
     * @returns {import('./sequenceThreeRuntime.js').USequenceThreeCapture} 기준 사본
     */
    capture(object: USequenceThreeObject): USequenceThreeCapture;
    /**
     * 현재 값에 누적하지 않고 최초 기준에 요청 오프셋을 합칩니다. <br>
     * 반환까지 native 쓰기/lease 취득은 없습니다.
     *
     * @param {import('./sequenceThreeRuntime.js').USequenceThreeBinding} binding Adapter 소유 기준 연결, 변경 없음
     * @param {import('../../vo/sequenceDefinitionVos.js').USequenceTargetStateVoCO | import('../../vo/sequenceDefinitionVos.js').USequenceTargetStateVo} state 같은 복합 대상의 읽기 전용 상태, null 속성은 비제어
     * @param {import('./sequenceThreeRuntime.js').USequenceThreeCoordinate | null} coordinate 좌표, 이동 시 필수, 표시만이면 null 허용
     * @param {import('../../core/sequenceData.js').USequenceCoordinatePort | null} coordinatePort 포트, null이면 local 기본 계산
     * @param {number} worldUnitsPerMeter 배율, 양의 유한 scene unit/m
     * @returns {import('./sequenceThreeRuntime.js').USequenceThreeWrite} 쓰기 계획
     */
    plan(binding: USequenceThreeBinding, state: USequenceTargetStateVoCO | USequenceTargetStateVo, coordinate: USequenceThreeCoordinate | null, coordinatePort: USequenceCoordinatePort$1 | null, worldUnitsPerMeter: number): USequenceThreeWrite;
    /**
     * 모든 조각의 고정 world 경계를 local 선언 단위로 합칩니다. <br>
     * 역변환 계약이 없는 ENU는 거부합니다.
     *
     * @param {ReadonlyArray<import('./sequenceThreeRuntime.js').USequenceThreeBinding>} bindings 연결
     * @param {import('./sequenceThreeRuntime.js').USequenceThreeCoordinate} coordinate local 좌표만 지원, 변경 없음
     * @param {number} worldUnitsPerMeter 배율, 양의 유한 scene unit/m
     * @returns {import('./sequenceThreeRuntime.js').USequenceThreeBounds} 독립 경계
     */
    getReferenceBounds(bindings: ReadonlyArray<USequenceThreeBinding>, coordinate: USequenceThreeCoordinate, worldUnitsPerMeter: number): USequenceThreeBounds;
    /**
     * 검증된 계획을 해당 root의 제어 속성에만 반영합니다. <br>
     * 부분 실패도 rollback할 수 있도록 시작 표시를 먼저 남깁니다.
     *
     * @param {import('./sequenceThreeRuntime.js').USequenceThreeWrite} write Adapter 소유 계획, started와 해당 native 제어 값만 변경됨
     */
    apply(write: USequenceThreeWrite): void;
    /**
     * 기준 또는 직전 사본의 제어 값만 씁니다. <br>
     * 부모·재질·geometry·비제어 visible/TRS는 변경하지 않습니다.
     *
     * @param {import('./sequenceThreeRuntime.js').USequenceThreePose} snapshot 복원 상태, 숫자와 native 참조를 가진 검사 소유 사본
     * @param {ReadonlyArray<import('../../core/sequenceData.js').USequenceControlledProperty>} properties 소유 속성, translation/visibility만 허용
     */
    restore(snapshot: USequenceThreePose, properties: ReadonlyArray<USequenceControlledProperty>): void;
    #private;
}
type USequenceThreeAdapterCO = {
    targets: ReadonlyArray<USequenceTargetVoCO | USequenceThreeTarget>;
    resolver: USequenceThreeResolver;
} & Partial<{
    worldUnitsPerMeter: number;
}>;
type USequenceThreeSessionInfo = {
    asset: USequencePortAsset;
    generation: number;
    coordinates: Array<USequenceThreeCoordinate>;
    properties: Array<USequenceControlledProperty>;
    bindingCount: number;
};
type USequenceThreeObject = Object3D;
type USequenceThreeTarget = USequenceTargetVo;
type USequenceThreeCoordinate = USequenceCoordinateVo;
type USequenceThreeBounds = {
    min: Array<number> | null;
    max: Array<number> | null;
    complete: boolean;
};
type USequenceThreePose = {
    object: USequenceThreeObject;
    parent: USequenceThreeObject | null;
    position: Array<number>;
    quaternion: Array<number>;
    scale: Array<number>;
    matrix: Array<number>;
    matrixWorld: Array<number>;
    local: Array<number>;
    world: Array<number>;
    visible: boolean;
    matrixAutoUpdate: boolean;
    matrixWorldAutoUpdate: boolean;
    matrixWorldNeedsUpdate: boolean;
};
type USequenceThreeStamp = {
    object: USequenceThreeObject;
    refs: Array<unknown>;
    values: Array<unknown>;
};
type USequenceThreeCapture = {
    pose: USequenceThreePose;
    structure: Array<USequenceThreeStamp>;
    bounds: USequenceThreeBounds;
};
type USequenceThreeBinding = {
    target: USequenceThreeTarget;
    base: USequenceThreeCapture;
    last: USequenceThreePose;
};
type USequenceThreeWrite = {
    binding: USequenceThreeBinding;
    before: USequenceThreePose;
    after: USequenceThreePose;
    properties: Array<USequenceControlledProperty>;
    started: boolean;
};
type USequenceThreePlan = {
    handle: USequenceApplyPlan;
    status: "planned" | "committing" | "committed" | "failed" | "rolledBack";
    writes: Array<USequenceThreeWrite>;
    generation: number;
};
type USequenceThreeSession = {
    asset: USequencePortAsset;
    generation: number;
    coordinates: Map<string, USequenceThreeCoordinate>;
    properties: Array<USequenceControlledProperty>;
    coordinatePort: USequenceCoordinatePort$1 | null;
    reportError: (arg0: unknown) => void;
    bindings: Map<string, Array<USequenceThreeBinding>>;
};
type USequenceThreeResolver = (arg0: USequenceThreeTarget, arg1: USequencePortAsset) => ReadonlyArray<USequenceThreeObject>;

/**
 * 기본 정책에서만 실제 그리기 범위의 단일 _BATCHID와 배치 이름을 해석합니다. <br>
 * metadata 없는 보조 객체는 명시 무시합니다.
 *
 * @param {import('../three/sequenceThreeRuntime.js').USequenceThreeObject} mesh 메쉬
 * @param {import('../../core/sequenceData.js').USequencePortAsset} asset 자료 식별 사본
 * @returns {import('../three/sequenceThreeRuntime.js').USequenceThreeTarget | null} 복합 대상
 */
declare function resolveGeOnDTMeshTarget(mesh: USequenceThreeObject, asset: USequencePortAsset): USequenceThreeTarget | null;
/**
 * 범용 Sequence 프레임을 기존 GeOnDT 3D Tiles 표시 계층에 연결하며 자체 Clock·RAF·IO나 빌린 자원 해제를 수행하지 않습니다.
 */
declare class USequenceGeOnDTTilesAdapter {
    /**
     * USequenceGeOnDTTilesAdapter 클래스 생성자입니다. <br>
     * 공개 포트는 빌리고 manifest/envelope/능력은 독립 복사합니다. <br>
     * prepare 전에는 native 쓰기나 구독을 만들지 않습니다.
     *
     * @param {import('./sequenceGeOnDTRuntime.js').USequenceGeOnDTTilesAdapterCO} opt app/layer/converter 필수, resolver 기본 단일배치, manifest/fragmentPort 기본null, 범위 기본[], 능력 기본true
     */
    constructor(opt: USequenceGeOnDTTilesAdapterCO);
    /** @type {USequenceGeOnDTAppPort} */ _app: USequenceGeOnDTAppPort;
    /** @type {USequenceGeOnDTLayerPort} */ _layer: USequenceGeOnDTLayerPort;
    /** @type {USequenceGeOnDTResolver} */ _resolver: USequenceGeOnDTResolver;
    /** @type {USequenceGeOnDTFragmentPort|null} */ _fragmentPort: USequenceGeOnDTFragmentPort | null;
    /**
     * @type {import('../../vo/sequenceDefinitionVos.js').USequenceTargetManifestVo | null}
     */ _manifest: USequenceTargetManifestVo | null;
    /** @type {Array<import('../../vo/sequenceDefinitionVos.js').USequenceMovementBoundsVo>} */ _movementBounds: Array<USequenceMovementBoundsVo>;
    /**
     * @type {import('../../vo/sequenceDefinitionVos.js').USequenceAdapterCapabilitiesVo}
     */ _capabilities: USequenceAdapterCapabilitiesVo;
    /** @type {USequenceGeOnDTCoordinatePort} */ _coordinateConverter: USequenceGeOnDTCoordinatePort;
    /**
     * @type {import('../three/sequenceThreeRuntime.js').USequenceThreeTransformExecutor}
     */ _transformExecutor: USequenceThreeTransformExecutor;
    /** @type {USequenceGeOnDTSession|null} */ _session: USequenceGeOnDTSession | null;
    /** @type {USequenceGeOnDTPlan|null} */ _activePlan: USequenceGeOnDTPlan | null;
    /**
     * @type {Map<object, import('../../core/sequenceData.js').USequenceTargetChangeListener>}
     */ _listeners: Map<object, USequenceTargetChangeListener>;
    /** @type {'new'|'preparing'|'ready'|'closing'|'cleanupFailed'|'disposed'|'failed'} */ _status: "new" | "preparing" | "ready" | "closing" | "cleanupFailed" | "disposed" | "failed";
    /** @type {boolean} */ _working: boolean;
    /**
     * 후보 사본/점유/범위를 확보하고 이벤트를 먼저 설치한 뒤 현재 계층과 취소를 재확인합니다. <br>
     * 실패 후보의 모든 자기 자원을 정리합니다.
     *
     * @param {import('../../core/sequenceData.js').USequencePortAsset} asset 3dtiles 자료 설명, 독립 복사, URI 요청/원본 변경 없음
     * @param {import('../../core/sequenceData.js').USequenceAdapterPrepareContext} context 문맥, 세대/대상/좌표/속성 복사
     * @param {import('../../core/sequenceData.js').USequenceAbortSignalPort} signal 빌린 중단 신호, 취소 이유 보존, 신호 변경/소유권 이전 없음
     * @returns {Promise<void>} 준비
     */
    prepare(asset: USequencePortAsset, context: USequenceAdapterPrepareContext$1, signal: USequenceAbortSignalPort$1): Promise<void>;
    /**
     * 논리 manifest 완전성과 조각 준비를 구별한 고정 능력 사본을 반환합니다.
     *
     * @returns {import('../../vo/sequenceDefinitionVos.js').USequenceAdapterCapabilitiesVo}
     */
    getCapabilities(): USequenceAdapterCapabilitiesVo;
    /**
     * 요구/관측 논리 목록을 반환하고 명시 complete 목록만 완전하다고 표시합니다.
     *
     * @returns {import('../../vo/sequenceDefinitionVos.js').USequenceTargetManifestVo} 사본
     */
    getTargetManifest(): USequenceTargetManifestVo;
    /**
     * 한 조각 이상 준비와 모든 fragment 증명을 별도로 계산합니다. <br>
     * source 손상은 대기 대신 오류로 전달합니다.
     *
     * @param {ReadonlyArray<import('../three/sequenceThreeRuntime.js').USequenceThreeTarget>} targets 같은 자료의 중복 없는 요청, 빈 목록 허용, 변경 없음
     * @returns {import('../../vo/sequenceDefinitionVos.js').USequenceReadinessVo} 사본
     */
    getReadiness(targets: ReadonlyArray<USequenceThreeTarget>): USequenceReadinessVo;
    /**
     * 최종 배치/replay 뒤 재조회할 자기 구독을 등록합니다.
     *
     * @param {import('../../core/sequenceData.js').USequenceTargetChangeListener} listener 빌린 동기 무인자 함수, Promise/변경 재진입 거부
     * @returns {import('../../core/sequenceData.js').USequencePortUnsubscribe} 해제
     */
    subscribeTargets(listener: USequenceTargetChangeListener): USequencePortUnsubscribe;
    /**
     * 최초 world 경계를 선언 좌표로 변환합니다. <br>
     * 알려진 일부 경계는 반환하되 미증명 조각을 완전하다고 표시하지 않습니다.
     *
     * @param {ReadonlyArray<import('../three/sequenceThreeRuntime.js').USequenceThreeTarget>} targets 같은 자료의 중복 없는 요청, 변경 없음
     * @param {string} coordinateId 준비된 ENU/local 좌표 ID
     * @returns {Array<import('../../vo/sequenceDefinitionVos.js').USequenceTargetGeometryVo>} 사본
     */
    getReferenceGeometry(targets: ReadonlyArray<USequenceThreeTarget>, coordinateId: string): Array<USequenceTargetGeometryVo>;
    /**
     * 부착이 끝난 조각만 캡처하고 최근 완전 성공 프레임을 적용한 뒤 변경 알림을 한 번 보냅니다. <br>
     * 새 시간/RAF를 만들지 않습니다.
     */
    flushPendingBindings(): void;
    /**
     * 프레임/범위/좌표/중복/현재 연결을 순수 검사하고 세대·topology·범위 revision을 가진 opaque handle을 만듭니다.
     *
     * @param {import('../../core/sequenceData.js').USequenceFramePortInput} frame 적용할 대상 상태 목록(null 속성은 비제어)
     * @returns {import('../../core/sequenceData.js').USequenceApplyPlan}
     */
    plan(frame: USequenceFramePortInput): USequenceApplyPlan;
    /**
     * 모든 연결을 재검증한 뒤 실행하고 완전 성공 때만 replay 프레임을 교체합니다. <br>
     * 부분 실패 journal은 보존합니다.
     *
     * @param {import('../../core/sequenceData.js').USequenceApplyPlan} plan 최근 자기 handle identity, stale/다른 Adapter handle 거부
     */
    commit(plan: USequenceApplyPlan): void;
    /**
     * 실제 시작한 쓰기만 직전 상태로 복구합니다. <br>
     * 새로 replay한 조각도 포함하고 이미 제거/복원한 조각은 건너뜁니다.
     *
     * @param {import('../../core/sequenceData.js').USequenceApplyPlan} plan 최근 자기 handle, 완료 후 반복 호출은 무동작
     */
    rollback(plan: USequenceApplyPlan): void;
    /**
     * 제어 속성만 최초 기준으로 복원합니다. <br>
     * 실패 journal/기준을 유지하여 반복 복원을 허용합니다.
     */
    restore(): void;
    /**
     * 자기 통지를 차단한 뒤 모든 구독/기준/범위/점유 정리를 독립 시도합니다. <br>
     * 실패 자원만 보관해 재시도하며 빌린 엔진 자원은 해제하지 않습니다.
     */
    dispose(): void;
    /**
     * 준비 전 설정을 교체하거나 준비 후 선언 좌표별 범위를 단조 확장합니다. <br>
     * 레이어 설치 성공 후에만 설정/revision을 교체합니다.
     *
     * @param {ReadonlyArray<import('../../vo/sequenceDefinitionVos.js').USequenceMovementBoundsVoCO | import('../../vo/sequenceDefinitionVos.js').USequenceMovementBoundsVo>} bounds 독립 복사할 전체 선언, 유한3성분 min≤0≤max, 기존 범위 제거/축소 거부
     */
    setMovementBounds(bounds: ReadonlyArray<USequenceMovementBoundsVoCO | USequenceMovementBoundsVo>): void;
    /**
     * 수명/불변 설정을 우회하는 직접 대입을 거부합니다.
     *
     * @param {import('./sequenceGeOnDTRuntime.js').USequenceGeOnDTAppPort} value 거부할 대입 값
     */
    set app(value: USequenceGeOnDTAppPort);
    /**
     * 빌린 app 공개 포트을 반환합니다. <br>
     * 자원 소유권을 이전하지 않습니다.
     *
     * @returns {import('./sequenceGeOnDTRuntime.js').USequenceGeOnDTAppPort} 읽기 전용 값/사본
     */
    get app(): USequenceGeOnDTAppPort;
    /**
     * 수명/불변 설정을 우회하는 직접 대입을 거부합니다.
     *
     * @param {import('./sequenceGeOnDTRuntime.js').USequenceGeOnDTLayerPort} value 거부할 대입 값
     */
    set layer(value: USequenceGeOnDTLayerPort);
    /**
     * 빌린 layer 공개 포트을 반환합니다. <br>
     * 자원 소유권을 이전하지 않습니다.
     *
     * @returns {import('./sequenceGeOnDTRuntime.js').USequenceGeOnDTLayerPort} 읽기 전용 값/사본
     */
    get layer(): USequenceGeOnDTLayerPort;
    /**
     * 수명/불변 설정을 우회하는 직접 대입을 거부합니다.
     *
     * @param {import('./sequenceGeOnDTRuntime.js').USequenceGeOnDTResolver} value 거부할 대입 값
     */
    set resolver(value: USequenceGeOnDTResolver);
    /**
     * 빌린 동기 resolver을 반환합니다. <br>
     * 자원 소유권을 이전하지 않습니다.
     *
     * @returns {import('./sequenceGeOnDTRuntime.js').USequenceGeOnDTResolver} 읽기 전용 값/사본
     */
    get resolver(): USequenceGeOnDTResolver;
    /**
     * 수명/불변 설정을 우회하는 직접 대입을 거부합니다.
     *
     * @param {import('./sequenceGeOnDTRuntime.js').USequenceGeOnDTFragmentPort | null} value 거부할 대입 값
     */
    set fragmentPort(value: USequenceGeOnDTFragmentPort | null);
    /**
     * 빌린 fragment proof 포트을 반환합니다. <br>
     * 자원 소유권을 이전하지 않습니다.
     *
     * @returns {import('./sequenceGeOnDTRuntime.js').USequenceGeOnDTFragmentPort | null} 읽기 전용 값/사본
     */
    get fragmentPort(): USequenceGeOnDTFragmentPort | null;
    /**
     * 수명/불변 설정을 우회하는 직접 대입을 거부합니다.
     *
     * @param {import('../../vo/sequenceDefinitionVos.js').USequenceTargetManifestVo | null} value 거부할 대입 값
     */
    set manifest(value: USequenceTargetManifestVo | null);
    /**
     * 독립 논리 manifest을 반환합니다. <br>
     * 자원 소유권을 이전하지 않습니다.
     *
     * @returns {import('../../vo/sequenceDefinitionVos.js').USequenceTargetManifestVo | null} 읽기 전용 값/사본
     */
    get manifest(): USequenceTargetManifestVo | null;
    /**
     * 수명/불변 설정을 우회하는 직접 대입을 거부합니다.
     *
     * @param {Array<import('../../vo/sequenceDefinitionVos.js').USequenceMovementBoundsVo>} value 거부할 대입 값
     */
    set movementBounds(value: Array<USequenceMovementBoundsVo>);
    /**
     * 독립 이동 범위 목록을 반환합니다. <br>
     * 자원 소유권을 이전하지 않습니다.
     *
     * @returns {Array<import('../../vo/sequenceDefinitionVos.js').USequenceMovementBoundsVo>} 읽기 전용 값/사본
     */
    get movementBounds(): Array<USequenceMovementBoundsVo>;
    /**
     * 수명/불변 설정을 우회하는 직접 대입을 거부합니다.
     *
     * @param {import('../../vo/sequenceDefinitionVos.js').USequenceAdapterCapabilitiesVo} value 거부할 대입 값
     */
    set capabilities(value: USequenceAdapterCapabilitiesVo);
    /**
     * 독립 고정 능력을 반환합니다. <br>
     * 자원 소유권을 이전하지 않습니다.
     *
     * @returns {import('../../vo/sequenceDefinitionVos.js').USequenceAdapterCapabilitiesVo} 읽기 전용 값/사본
     */
    get capabilities(): USequenceAdapterCapabilitiesVo;
    /**
     * 수명/불변 설정을 우회하는 직접 대입을 거부합니다.
     *
     * @param {import('./sequenceGeOnDTRuntime.js').USequenceGeOnDTCoordinatePort} value 거부할 대입 값
     */
    set coordinateConverter(value: USequenceGeOnDTCoordinatePort);
    /**
     * 빌린 고정 좌표 포트을 반환합니다. <br>
     * 자원 소유권을 이전하지 않습니다.
     *
     * @returns {import('./sequenceGeOnDTRuntime.js').USequenceGeOnDTCoordinatePort} 읽기 전용 값/사본
     */
    get coordinateConverter(): USequenceGeOnDTCoordinatePort;
    /**
     * 수명/불변 설정을 우회하는 직접 대입을 거부합니다.
     *
     * @param {import('../three/sequenceThreeRuntime.js').USequenceThreeTransformExecutor} value 거부할 대입 값
     */
    set transformExecutor(value: USequenceThreeTransformExecutor);
    /**
     * stateless 수학 실행기을 반환합니다. <br>
     * 자원 소유권을 이전하지 않습니다.
     *
     * @returns {import('../three/sequenceThreeRuntime.js').USequenceThreeTransformExecutor} 읽기 전용 값/사본
     */
    get transformExecutor(): USequenceThreeTransformExecutor;
    /**
     * 수명/불변 설정을 우회하는 직접 대입을 거부합니다.
     *
     * @param {import('./sequenceGeOnDTRuntime.js').USequenceGeOnDTSessionInfo | null} value 거부할 대입 값
     */
    set session(value: USequenceGeOnDTSessionInfo | null);
    /**
     * native/rollback 참조 없는 진단 사본을 반환합니다. <br>
     * 자원 소유권을 이전하지 않습니다.
     *
     * @returns {import('./sequenceGeOnDTRuntime.js').USequenceGeOnDTSessionInfo | null} 읽기 전용 값/사본
     */
    get session(): USequenceGeOnDTSessionInfo | null;
    /**
     * 수명/불변 설정을 우회하는 직접 대입을 거부합니다.
     *
     * @param {{ status: string; generation: number; topology: number; boundsRevision: number; } | null} value 거부할 대입 값
     */
    set activePlan(value: {
        status: string;
        generation: number;
        topology: number;
        boundsRevision: number;
    } | null);
    /**
     * opaque identity/journal 없는 계획 진단을 반환합니다. <br>
     * 자원 소유권을 이전하지 않습니다.
     *
     * @returns {{ status: string; generation: number; topology: number; boundsRevision: number; } | null} 읽기 전용 값/사본
     */
    get activePlan(): {
        status: string;
        generation: number;
        topology: number;
        boundsRevision: number;
    } | null;
    /**
     * 수명/불변 설정을 우회하는 직접 대입을 거부합니다.
     *
     * @param {Map<any, import('../../core/sequenceData.js').USequenceTargetChangeListener>} value 거부할 대입 값
     */
    set listeners(value: Map<any, USequenceTargetChangeListener>);
    /**
     * 자기 구독 목록 사본을 반환합니다. <br>
     * 자원 소유권을 이전하지 않습니다.
     *
     * @returns {Map<object, import('../../core/sequenceData.js').USequenceTargetChangeListener>} 읽기 전용 값/사본
     */
    get listeners(): Map<object, USequenceTargetChangeListener>;
    /**
     * 수명/불변 설정을 우회하는 직접 대입을 거부합니다.
     *
     * @param {string} value 거부할 대입 값
     */
    set status(value: string);
    /**
     * 준비/해제 상태을 반환합니다. <br>
     * 자원 소유권을 이전하지 않습니다.
     *
     * @returns {string} 읽기 전용 값/사본
     */
    get status(): string;
    /**
     * 수명/불변 설정을 우회하는 직접 대입을 거부합니다.
     *
     * @param {boolean} value 거부할 대입 값
     */
    set working(value: boolean);
    /**
     * 변경 명령 실행 상태을 반환합니다. <br>
     * 자원 소유권을 이전하지 않습니다.
     *
     * @returns {boolean} 읽기 전용 값/사본
     */
    get working(): boolean;
    #private;
}
/**
 * @typedef {{ app: USequenceGeOnDTAppPort; layer: USequenceGeOnDTLayerPort; coordinateConverter: USequenceGeOnDTCoordinatePort; } & Partial<{ resolver: USequenceGeOnDTResolver; manifest: import('../../vo/sequenceDefinitionVos.js').USequenceTargetManifestVoCO | import('../../core/sequenceData.js').USequencePortManifest | null; fragmentPort: USequenceGeOnDTFragmentPort | null; movementBounds: ReadonlyArray<import('../../vo/sequenceDefinitionVos.js').USequenceMovementBoundsVoCO | import('../../vo/sequenceDefinitionVos.js').USequenceMovementBoundsVo>; capabilities: Partial<{ translation: boolean; visibility: boolean; geometryBounds: boolean; }>; }>} USequenceGeOnDTTilesAdapterCO
 * @typedef {{ asset: import('../../core/sequenceData.js').USequencePortAsset; generation: number; revision: number; coordinates: Array<import('../three/sequenceThreeRuntime.js').USequenceThreeCoordinate>; properties: Array<import('../../core/sequenceData.js').USequenceControlledProperty>; bindingCount: number; pendingCount: number; retiredCount: number; frame: import('../../vo/sequenceDefinitionVos.js').USequenceFrameVo | null; }} USequenceGeOnDTSessionInfo
 */
/**
 * GeOnDT 자료 포트에서 사용하며 전역 엔진·IO·Clock·native 객체 변경에 의존하지 않습니다.
 */
declare class USequenceGeOnDTCoordinateConverter {
    /**
     * USequenceGeOnDTCoordinateConverter 클래스 생성자입니다. <br>
     * 기준점과 엔진 공개 수학 함수를 빌리고 숫자 배율/원점을 한 번 계산합니다.
     *
     * @param {import('./sequenceGeOnDTRuntime.js').USequenceGeOnDTCoordinateConverterCO} opt 필수 origin/수학 API
     */
    constructor(opt: USequenceGeOnDTCoordinateConverterCO);
    /** @type {Array<number>} */ _origin: Array<number>;
    /** @type {USequenceGeOnDTMathPort} */ _mathEngine: USequenceGeOnDTMathPort;
    /** @type {number} */ _worldUnitsPerMeter: number;
    /** @type {Array<number>} */ _worldOrigin: Array<number>;
    /**
     * 같은 ENU 원점/미터 단위 또는 local 오른손 Y up 좌표를 승인합니다.
     *
     * @param {import('../three/sequenceThreeRuntime.js').USequenceThreeCoordinate} coordinate 독립 읽기 전용 좌표
     */
    validate(coordinate: USequenceThreeCoordinate): void;
    /**
     * 정규화하지 않은 world 이동에 부모 역선형 변환을 적용합니다.
     *
     * @param {ReadonlyArray<number>} vector 유한3성분 선언 좌표 오프셋
     * @param {import('../three/sequenceThreeRuntime.js').USequenceThreeCoordinate} coordinate 검증할 독립 좌표
     * @param {unknown} targetContext parentWorldMatrix 유한 affine16성분을 가진 숫자 문맥, native 참조/원본 변경 없음
     * @returns {Array<number>} 부모 로컬 이동
     */
    convertTranslation(vector: ReadonlyArray<number>, coordinate: USequenceThreeCoordinate, targetContext: unknown): Array<number>;
    /**
     * world 점을 고정 원점 ENU 미터 또는 world0 기준 local Y up 선언 단위로 변환합니다.
     *
     * @param {ReadonlyArray<number>} point 유한 world XYZ3성분
     * @param {import('../three/sequenceThreeRuntime.js').USequenceThreeCoordinate} coordinate 독립 요청 좌표
     * @returns {Array<number>} 선언 좌표 점
     */
    convertWorldPoint(point: ReadonlyArray<number>, coordinate: USequenceThreeCoordinate): Array<number>;
    /**
     * signed 축 대응을 포함한 모든 envelope 모서리를 변환하여 보수적 world 범위를 만듭니다.
     *
     * @param {import('../../vo/sequenceDefinitionVos.js').USequenceMovementBoundsVo} bounds 독립 복사할 선언 범위
     * @param {import('../three/sequenceThreeRuntime.js').USequenceThreeCoordinate} coordinate bounds와 같은 좌표 ID
     * @returns {{ min: Array<number>; max: Array<number>; }}
     */
    convertMovementBounds(bounds: USequenceMovementBoundsVo, coordinate: USequenceThreeCoordinate): {
        min: Array<number>;
        max: Array<number>;
    };
    /**
     * 고정 원점의 직접 교체를 거부합니다.
     *
     * @param {Array<number>} value 대입 거부
     */
    set origin(value: Array<number>);
    /**
     * 기준 경도/위도/고도를 독립 복사합니다.
     *
     * @returns {Array<number>} 기준 경도/위도/고도를 독립 복사합니다.
     */
    get origin(): Array<number>;
    /**
     * 계산된 배율과 어긋나는 API 교체를 거부합니다.
     *
     * @param {import('./sequenceGeOnDTRuntime.js').USequenceGeOnDTMathPort} value 대입 거부
     */
    set mathEngine(value: USequenceGeOnDTMathPort);
    /**
     * 빌린 공개 수학 API 참조를 반환합니다.
     *
     * @returns {import('./sequenceGeOnDTRuntime.js').USequenceGeOnDTMathPort} 빌린 공개 수학 API 참조
     */
    get mathEngine(): USequenceGeOnDTMathPort;
    /**
     * 고정 배율의 직접 교체를 거부합니다.
     *
     * @param {number} value 대입 거부
     */
    set worldUnitsPerMeter(value: number);
    /**
     * 고정 scene unit/m 배율을 반환합니다.
     *
     * @returns {number} 고정 scene unit/m 배율
     */
    get worldUnitsPerMeter(): number;
    /**
     * 고정 world 원점의 직접 교체를 거부합니다.
     *
     * @param {Array<number>} value 대입 거부
     */
    set worldOrigin(value: Array<number>);
    /**
     * 투영 world 원점을 독립 복사합니다.
     *
     * @returns {Array<number>} 투영 world 원점을 독립 복사합니다.
     */
    get worldOrigin(): Array<number>;
    #private;
}
type USequenceGeOnDTMathPort = {
    getRealScaleAtGeographic: (arg0: number) => number;
    getGeographicToGoogle: (arg0: number, arg1: number, arg2: number) => {
        x: number;
        y: number;
        z: number;
    };
};
type USequenceGeOnDTCoordinateConverterCO = {
    origin: Array<number>;
    mathEngine: USequenceGeOnDTMathPort;
};
type USequenceGeOnDTCoordinatePort = USequenceCoordinatePort$1 & {
    readonly worldUnitsPerMeter: number;
    convertWorldPoint: (arg0: ReadonlyArray<number>, arg1: USequenceThreeCoordinate) => Array<number>;
    convertMovementBounds: (arg0: USequenceMovementBoundsVo, arg1: USequenceThreeCoordinate) => {
        min: Array<number>;
        max: Array<number>;
    };
};
type USequenceGeOnDTTilesAdapterCO = {
    app: USequenceGeOnDTAppPort;
    layer: USequenceGeOnDTLayerPort;
    coordinateConverter: USequenceGeOnDTCoordinatePort;
} & Partial<{
    resolver: USequenceGeOnDTResolver;
    manifest: USequenceTargetManifestVoCO | USequencePortManifest | null;
    fragmentPort: USequenceGeOnDTFragmentPort | null;
    movementBounds: ReadonlyArray<USequenceMovementBoundsVoCO | USequenceMovementBoundsVo>;
    capabilities: Partial<{
        translation: boolean;
        visibility: boolean;
        geometryBounds: boolean;
    }>;
}>;
type USequenceGeOnDTSessionInfo = {
    asset: USequencePortAsset;
    generation: number;
    revision: number;
    coordinates: Array<USequenceThreeCoordinate>;
    properties: Array<USequenceControlledProperty>;
    bindingCount: number;
    pendingCount: number;
    retiredCount: number;
    frame: USequenceFrameVo | null;
};
type USequenceGeOnDTEvent = Partial<{
    child: USequenceThreeObject;
    data: USequenceThreeObject;
}>;
type USequenceGeOnDTListener = (arg0: USequenceGeOnDTEvent) => void;
type USequenceGeOnDTAppPort = {
    hasRenderBefore: (arg0: string) => boolean;
    setRenderBefore: (arg0: string, arg1: () => void) => void;
    removeRenderBefore: (arg0: string) => void;
};
type USequenceGeOnDTLayerPort = {
    getGroup: () => USequenceThreeObject;
    addEventListener: (arg0: string, arg1: USequenceGeOnDTListener) => void;
    removeEventListener: (arg0: string, arg1: USequenceGeOnDTListener) => void;
} & Partial<{
    getContentOffsetBounds: () => USequenceGeOnDTBounds | null;
    setContentOffsetBounds: (arg0: USequenceGeOnDTBounds | null) => void;
}>;
type USequenceGeOnDTBounds = {
    min: Array<number>;
    max: Array<number>;
};
type USequenceGeOnDTFragmentPort = {
    identifyFragment: (arg0: USequenceThreeObject, arg1: USequencePortAsset) => string;
    getExpectedFragments: (arg0: USequenceThreeTarget, arg1: USequencePortAsset) => ReadonlyArray<string> | null;
};
type USequenceGeOnDTResolver = (arg0: USequenceThreeObject, arg1: USequencePortAsset) => USequenceTargetVoCO | USequenceThreeTarget | null;
type USequenceGeOnDTBinding = USequenceThreeBinding & {
    partId: string | null;
    nodeCount: number;
    parentWorld: Array<number>;
};
type USequenceGeOnDTHook = {
    type: "childadded" | "childremoved";
    listener: USequenceGeOnDTListener;
};
type USequenceGeOnDTPlan = {
    handle: USequenceApplyPlan;
    status: "planned" | "committing" | "committed" | "failed" | "rolledBack";
    generation: number;
    topology: number;
    boundsRevision: number;
    frame: USequenceFrameVo;
    beforeFrame: USequenceFrameVo | null;
    writes: Array<USequenceThreeWrite>;
};
type USequenceGeOnDTSession = {
    asset: USequencePortAsset;
    generation: number;
    revision: number;
    boundsRevision: number;
    root: USequenceThreeObject;
    coordinates: Map<string, USequenceThreeCoordinate>;
    properties: Array<USequenceControlledProperty>;
    required: Array<USequenceThreeTarget>;
    targets: Map<string, USequenceThreeTarget>;
    bindings: Map<USequenceThreeObject, USequenceGeOnDTBinding>;
    retired: Map<USequenceThreeObject, USequenceGeOnDTBinding>;
    pending: Set<USequenceThreeObject>;
    removals: Set<USequenceThreeObject>;
    faults: Map<USequenceThreeObject, unknown>;
    expected: Map<string, Array<string>>;
    hooks: Map<USequenceThreeObject, Array<USequenceGeOnDTHook>>;
    meshHooks: Map<USequenceThreeObject, () => void>;
    loaded: USequenceGeOnDTListener;
    render: () => void;
    renderKey: string;
    appInstalled: boolean;
    layerInstalled: boolean;
    layerOwned: boolean;
    boundsBefore: USequenceGeOnDTBounds | null;
    boundsInstalled: USequenceGeOnDTBounds | null;
    boundsOwned: boolean;
    boundsFault: unknown;
    frame: USequenceFrameVo | null;
    reportError: (arg0: unknown) => void;
    dirty: boolean;
    notifying: boolean;
};

/**
 * 속성 조건·수동 GUID 지정·분류 결과를 한 패널에서 편집합니다.
 */
declare class USequenceGroupEditor {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceGroupEditor 클래스 생성자입니다. <br>
     * DOM과 편집·선택 모듈을 검증하며 실제 부착은 mount에서 수행합니다.
     *
     * @param {import('./sequenceLegacyPanels.js').USequenceGroupEditorCO} opt 호출자가 소유하는 DOM·실행기·선택 연결과 확정·오류 콜백
     */
    constructor(opt: USequenceGroupEditorCO);
    _container: HTMLElement;
    _editExecutor: USequenceGroupEditExecutor;
    _selectionHandler: USequenceSelectionHandler;
    _onApply: USequenceGroupApplyCallback;
    _onError: (arg0: Error) => void;
    _root: HTMLElement | null;
    _controls: {};
    _fields: any[];
    _statistics: USequencePropertyStatsVo | null;
    _mounted: boolean;
    _disposed: boolean;
    _busy: boolean;
    _generation: number;
    _clickHandler: (event: Event) => void;
    _changeHandler: (event: Event) => void;
    _selectionListener: (objectIds: Array<string>) => void;
    /**
     * 패널을 부착할 컨테이너의 직접 교체를 거부합니다.
     *
     * @param {HTMLElement} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set container(value: HTMLElement);
    /**
     * 패널을 부착할 컨테이너를 반환합니다.
     *
     * @returns {HTMLElement}
     */
    get container(): HTMLElement;
    /**
     * 시퀀스 편집 실행기의 직접 교체를 거부합니다.
     *
     * @param {import('../legacy/sequenceEditingRuntime.js').USequenceGroupEditExecutor} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set editExecutor(value: USequenceGroupEditExecutor);
    /**
     * 시퀀스 편집 실행기를 반환합니다.
     *
     * @returns {import('../legacy/sequenceEditingRuntime.js').USequenceGroupEditExecutor}
     */
    get editExecutor(): USequenceGroupEditExecutor;
    /**
     * 선택 연결 처리기의 직접 교체를 거부합니다.
     *
     * @param {import('../legacy/sequenceRequestHandlers.js').USequenceSelectionHandler} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set selectionHandler(value: USequenceSelectionHandler);
    /**
     * 선택 연결 처리기를 반환합니다.
     *
     * @returns {import('../legacy/sequenceRequestHandlers.js').USequenceSelectionHandler}
     */
    get selectionHandler(): USequenceSelectionHandler;
    /**
     * 편집 적용 수신 함수를 교체합니다.
     *
     * @param {import('./sequenceLegacyPanels.js').USequenceGroupApplyCallback} value 이후 발생하는 편집 적용 결과를 받을 함수
     */
    set onApply(value: USequenceGroupApplyCallback);
    /**
     * 편집 적용 수신 함수를 반환합니다.
     *
     * @returns {import('./sequenceLegacyPanels.js').USequenceGroupApplyCallback}
     */
    get onApply(): USequenceGroupApplyCallback;
    /**
     * 오류 수신 함수를 교체합니다.
     *
     * @param {function(Error):void} value 이후 발생하는 오류를 받을 함수
     */
    set onError(value: (arg0: Error) => void);
    /**
     * 오류 수신 함수를 반환합니다.
     *
     * @returns {function(Error):void}
     */
    get onError(): (arg0: Error) => void;
    /**
     * 패널의 루트 요소의 직접 교체를 거부합니다.
     *
     * @param {HTMLElement | null} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set root(value: HTMLElement | null);
    /**
     * 패널의 루트 요소를 반환합니다.
     *
     * @returns {HTMLElement | null}
     */
    get root(): HTMLElement | null;
    /**
     * 패널 입력 요소 목록의 직접 교체를 거부합니다.
     *
     * @param {Record<string, HTMLElement>} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set controls(value: Record<string, HTMLElement>);
    /**
     * 입력 요소의 참조를 담은 객체를 복사하여 반환합니다.
     *
     * @returns {Record<string, HTMLElement>} 컨테이너만 복사하며 DOM 요소는 패널과 공유
     */
    get controls(): Record<string, HTMLElement>;
    /**
     * 조회한 속성 필드 목록의 직접 교체를 거부합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequencePropertyFieldVo>} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set fields(value: Array<USequencePropertyFieldVo>);
    /**
     * 조회한 속성 필드 목록의 배열 사본을 반환합니다.
     *
     * @returns {Array<import('../vo/sequenceDefinitionVos.js').USequencePropertyFieldVo>} 호출자가 배열을 바꾸어도 내부 목록에 반영되지 않는 사본
     */
    get fields(): Array<USequencePropertyFieldVo>;
    /**
     * 선택한 필드의 통계의 직접 교체를 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePropertyStatsVo | null} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set statistics(value: USequencePropertyStatsVo | null);
    /**
     * 선택한 필드의 통계를 반환합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequencePropertyStatsVo | null}
     */
    get statistics(): USequencePropertyStatsVo | null;
    /**
     * 선택한 부착 상태에 따라 mount 또는 unmount를 호출합니다.
     *
     * @param {boolean} value true이면 패널 부착, false이면 패널 제거
     */
    set mounted(value: boolean);
    /**
     * 패널 부착 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get mounted(): boolean;
    /**
     * true를 지정하면 dispose를 호출하여 종료합니다. <br>
     * 종료된 인스턴스를 false로 되살릴 수 없습니다.
     *
     * @param {boolean} value true이면 종료, false이면 종료 전 상태만 유지 가능
     */
    set disposed(value: boolean);
    /**
     * 종료 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get disposed(): boolean;
    /**
     * 패널 작업 처리 중 여부의 직접 교체를 거부합니다.
     *
     * @param {boolean} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set busy(value: boolean);
    /**
     * 패널 작업 처리 중 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get busy(): boolean;
    /**
     * 요청 세대 번호의 직접 교체를 거부합니다.
     *
     * @param {number} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set generation(value: number);
    /**
     * 요청 세대 번호를 반환합니다.
     *
     * @returns {number}
     */
    get generation(): number;
    /**
     * 패널 클릭 수신 함수의 직접 교체를 거부합니다.
     *
     * @param {function(Event):void} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set clickHandler(value: (arg0: Event) => void);
    /**
     * 패널 클릭 수신 함수를 반환합니다.
     *
     * @returns {function(Event):void}
     */
    get clickHandler(): (arg0: Event) => void;
    /**
     * 패널 값 변경 수신 함수의 직접 교체를 거부합니다.
     *
     * @param {function(Event):void} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set changeHandler(value: (arg0: Event) => void);
    /**
     * 패널 값 변경 수신 함수를 반환합니다.
     *
     * @returns {function(Event):void}
     */
    get changeHandler(): (arg0: Event) => void;
    /**
     * 선택 변경 수신 함수의 직접 교체를 거부합니다.
     *
     * @param {import('../legacy/sequenceRequestHandlers.js').USequenceSelectionCallback} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set selectionListener(value: USequenceSelectionCallback);
    /**
     * 선택 변경 수신 함수를 반환합니다.
     *
     * @returns {import('../legacy/sequenceRequestHandlers.js').USequenceSelectionCallback}
     */
    get selectionListener(): USequenceSelectionCallback;
    /**
     * 자체 패널과 이벤트를 부착하고 전용 선택 연결을 시작합니다.
     */
    mount(): void;
    /**
     * 최신 상태를 화면에 반영합니다. <br>
     * 아직 저장하지 않은 입력 폼은 상태 값으로 다시 표시합니다.
     */
    render(): void;
    /**
     * 자신의 DOM·리스너와 자신이 시작한 선택 연결을 정리합니다.
     */
    unmount(): void;
    /**
     * 자신의 패널 수명만 종료합니다. <br>
     * 빌린 실행기와 선택 연결은 해제하지 않습니다.
     */
    dispose(): void;
    /**
     * 자료 ID와 전체 형상 범위가 선택 연결과 일치하는지 확인합니다.
     */
    _validateContext(): void;
    /**
     * 자체 DOM 트리와 접근 가능한 레이블을 만듭니다.
     */
    _build(): void;
    /**
     * 문서 자료를 HTML로 해석하지 않고 DOM 요소를 생성합니다.
     *
     * @param {string} tag 표준 HTML 태그 이름
     * @param {string} [text=''] textContent에 기록할 일반 문자열(기본값은 빈 문자열)
     * @param {Record<string, string>} [attributes={}] 표준 속성 이름과 문자열 값
     * @returns {HTMLElement} 편집기가 소유할 새 DOM 요소
     */
    _node(tag: string, text?: string, attributes?: Record<string, string>): HTMLElement;
    /**
     * 레이블과 입력 요소를 함께 부착합니다.
     *
     * @param {string} key 패널 내부 입력 식별자
     * @param {string} title 사용자에게 표시할 레이블
     * @param {string} tag input/select/textarea 중 만들 태그
     * @param {Record<string, string>} [attributes={}] 입력 요소의 표준 속성
     */
    _input(key: string, title: string, tag: string, attributes?: Record<string, string>): void;
    /**
     * 이벤트 위임으로 처리할 버튼을 만듭니다.
     *
     * @param {string} action 클릭 처리에 사용할 동작 이름
     * @param {string} text 사용자에게 표시할 버튼 이름
     */
    _button(action: string, text: string): void;
    /**
     * 값 입력 요소를 반환합니다.
     *
     * @param {string} key 패널 입력 식별자
     * @returns {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} 값 속성이 있는 입력 요소
     */
    _control(key: string): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    /**
     * 선택 상자의 옵션을 일반 문자열로 교체합니다.
     *
     * @param {HTMLElement} select 편집기가 소유하는 선택 요소
     * @param {Array<Array<string>>} options 값·표시 문자열 순서의 2개 항목 목록
     */
    _options(select: HTMLElement, options: Array<Array<string>>): void;
    /**
     * 현재 활성 그룹 사본을 조회합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceGroupVo | null} 활성 그룹 또는 미선택 null
     */
    _activeGroup(): USequenceGroupVo | null;
    /**
     * 편집할 그룹이 선택되어 있는지 확인합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceGroupVo} 활성 그룹의 독립 사본
     */
    _requireGroup(): USequenceGroupVo;
    /**
     * 그룹 목록과 이름·설명·결합 방식 입력을 갱신합니다.
     */
    _renderGroups(): void;
    /**
     * 전체 형상 범위의 속성셋을 조회하고 필드 목록을 갱신합니다.
     */
    _renderProperties(): void;
    /**
     * 선택한 속성셋 안의 동적 필드와 타입 정보를 표시합니다.
     */
    _renderFields(): void;
    /**
     * 원래 자료형을 유지한 고유 값과 별도의 누락·빈 값 수를 표시합니다.
     */
    _renderValues(): void;
    /**
     * 저장된 조건을 삭제 가능한 목록으로 표시합니다.
     */
    _renderRules(): void;
    /**
     * 목록 분류에 해당하는 GUID를 조회합니다.
     *
     * @returns {Array<string>} 미로드 객체를 포함하는 GUID 목록
     */
    _listedIds(): Array<string>;
    /**
     * GUID 검색 결과를 목록에 표시합니다.
     */
    _renderObjects(): void;
    /**
     * 전체 선택과 현재 강조 가능한 객체 수를 구분하여 표시합니다.
     */
    _renderSelection(): void;
    /**
     * 분류 결과와 오래된 결과의 무효화 상태를 표시합니다.
     */
    _renderResult(): void;
    /**
     * 선택 연결의 변경을 편집 상태와 표시 개수에 반영합니다.
     *
     * @param {Array<string>} objectIds 선택 연결이 전달한 독립 GUID 목록
     */
    _receiveSelection(objectIds: Array<string>): void;
    /**
     * 입력 변경을 해당 목록 또는 활성 그룹에만 반영합니다.
     *
     * @param {Event} event 현재 패널의 change 이벤트
     */
    _handleChange(event: Event): void;
    /**
     * 클릭 요청의 완료·오류와 패널 수명을 함께 관리합니다.
     *
     * @param {Event} event 현재 패널의 click 이벤트
     */
    _handleClick(event: Event): void;
    /**
     * 유효한 작업의 진행 상태만 해제합니다.
     *
     * @param {number} generation 작업을 시작한 패널 세대
     */
    _finishAction(generation: number): void;
    /**
     * 비동기 작업 중 입력을 잠그고 완료 시 조건에 맞게 복원합니다.
     *
     * @param {boolean} busy 작업 중이면 true이며 false이면 일반 입력을 다시 허용합니다.
     */
    _toggleInputs(busy: boolean): void;
    /**
     * 클릭 동작을 편집 또는 비동기 선택 작업으로 전달합니다.
     *
     * @param {HTMLElement} button 현재 패널이 소유하는 클릭 버튼
     * @returns {Promise<void>} 입력 요청과 콜백 처리 완료
     */
    _runAction(button: HTMLElement): Promise<void>;
    /**
     * 그룹·조건·수동 참조의 동기 편집 요청을 역할별 함수에 전달합니다.
     *
     * @param {string} action 자체 패널에 정의된 편집 동작 이름
     * @param {HTMLElement} button 조건의 0 기반 인덱스 등을 가진 패널 소유 버튼
     */
    _editAction(action: string, button: HTMLElement): void;
    /**
     * 그룹 이름·설명과 조건 결합 방식을 저장합니다.
     */
    _saveGroup(): void;
    /**
     * 선택한 값의 원래 자료형을 보존하여 조건을 추가합니다.
     */
    _addRule(): void;
    /**
     * 현재 그룹의 지정 조건을 제거합니다.
     *
     * @param {number} index 삭제할 조건의 0 기반 정수 인덱스
     */
    _removeRule(index: number): void;
    /**
     * 선택 GUID의 수동 포함·제외 또는 지정 해제를 실행합니다.
     *
     * @param {string} action include/exclude와 add/remove를 결합한 동작 이름
     */
    _manualAction(action: string): void;
    /**
     * 수동 목록에서 고른 참조를 강조 없이 해제하여 범위 밖 참조도 보완합니다.
     */
    _removeListedReferences(): void;
    /**
     * 목록 또는 직접 입력 GUID를 선택 연결에 전달합니다.
     *
     * @param {string} action select-group/select-list/select-guids/select-clear 중 동작 이름
     * @returns {Promise<void>} 해당 선택 강조 완료
     */
    _selectAction(action: string): Promise<void>;
    /**
     * 현재 조건을 다시 분류하고 확정 그룹을 호출자에게 전달합니다.
     *
     * @returns {Promise<void>} 호출자 확정 콜백의 동기 또는 비동기 처리 완료
     */
    _apply(): Promise<void>;
    /**
     * 편집 오류를 패널과 호출자에게 함께 전달합니다.
     *
     * @param {Error} error 원인과 스택을 보존할 원래 오류
     */
    _reportError(error: Error): void;
    /**
     * 실제 해제된 패널의 재사용을 차단합니다.
     */
    _assertUsable(): void;
}
/**
 * 확정 그룹의 독립 사본을 받는 함수입니다.
 *
 * @callback USequenceGroupApplyCallback
 * @param {Array<import("../vo/sequenceDefinitionVos.js").USequenceGroupVo>} groups 호출자가 반영할 독립 그룹 목록. 기존 시간 트랙 참조도 함께 검증하십시오.
 * @returns {PromiseLike<void> | void} 선택적인 비동기 반영 완료
 */
/**
 * 편집 패널의 생성 옵션입니다.
 *
 * @typedef {object} USequenceGroupEditorCO
 * @property {HTMLElement} container 호출자가 소유하는 부착 위치
 * @property {import("../legacy/sequenceEditingRuntime.js").USequenceGroupEditExecutor} editExecutor 호출자가 소유하는 편집 실행기
 * @property {import("../legacy/sequenceRequestHandlers.js").USequenceSelectionHandler} selectionHandler 아직 연결하지 않은 편집기 전용 선택 연결
 * @property {USequenceGroupApplyCallback} onApply 확정 그룹을 전달받는 동기 또는 비동기 함수
 * @property {function(Error): void} onError 편집 오류를 받는 동기 함수
 */
/**
 * 전체 상대 시간 축·공정 단계·그룹별 조립 이동 트랙을 편집하는 패널입니다.
 */
declare class USequenceScheduleEditor {
    /**
     * 생성자가 지원하는 옵션 이름입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceScheduleEditor 클래스 생성자입니다. <br>
     * 패널 생성에 필요한 DOM과 실행기·콜백을 검증합니다.
     *
     * @param {import('./sequenceLegacyPanels.js').USequenceScheduleEditorCO} opt 호출자가 소유하는 DOM·실행기와 확정·오류 수신 함수
     */
    constructor(opt: USequenceScheduleEditorCO);
    _container: HTMLElement;
    _editExecutor: USequenceScheduleEditExecutor;
    _onApply: USequenceScheduleApplyCallback;
    _onError: (arg0: Error) => void;
    _root: HTMLElement | null;
    _controls: {};
    _mounted: boolean;
    _disposed: boolean;
    _busy: boolean;
    _generation: number;
    _clickHandler: (event: Event) => void;
    _changeHandler: (event: Event) => void;
    /**
     * 패널을 부착할 컨테이너의 직접 교체를 거부합니다.
     *
     * @param {HTMLElement} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set container(value: HTMLElement);
    /**
     * 패널을 부착할 컨테이너를 반환합니다.
     *
     * @returns {HTMLElement}
     */
    get container(): HTMLElement;
    /**
     * 시퀀스 편집 실행기의 직접 교체를 거부합니다.
     *
     * @param {import('../legacy/sequenceEditingRuntime.js').USequenceScheduleEditExecutor} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set editExecutor(value: USequenceScheduleEditExecutor);
    /**
     * 시퀀스 편집 실행기를 반환합니다.
     *
     * @returns {import('../legacy/sequenceEditingRuntime.js').USequenceScheduleEditExecutor}
     */
    get editExecutor(): USequenceScheduleEditExecutor;
    /**
     * 편집 적용 수신 함수를 교체합니다.
     *
     * @param {import('./sequenceLegacyPanels.js').USequenceScheduleApplyCallback} value 이후 발생하는 편집 적용 결과를 받을 함수
     */
    set onApply(value: USequenceScheduleApplyCallback);
    /**
     * 편집 적용 수신 함수를 반환합니다.
     *
     * @returns {import('./sequenceLegacyPanels.js').USequenceScheduleApplyCallback}
     */
    get onApply(): USequenceScheduleApplyCallback;
    /**
     * 오류 수신 함수를 교체합니다.
     *
     * @param {function(Error):void} value 이후 발생하는 오류를 받을 함수
     */
    set onError(value: (arg0: Error) => void);
    /**
     * 오류 수신 함수를 반환합니다.
     *
     * @returns {function(Error):void}
     */
    get onError(): (arg0: Error) => void;
    /**
     * 패널의 루트 요소의 직접 교체를 거부합니다.
     *
     * @param {HTMLElement | null} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set root(value: HTMLElement | null);
    /**
     * 패널의 루트 요소를 반환합니다.
     *
     * @returns {HTMLElement | null}
     */
    get root(): HTMLElement | null;
    /**
     * 패널 입력 요소 목록의 직접 교체를 거부합니다.
     *
     * @param {Record<string, HTMLElement>} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set controls(value: Record<string, HTMLElement>);
    /**
     * 입력 요소의 참조를 담은 객체를 복사하여 반환합니다.
     *
     * @returns {Record<string, HTMLElement>} 컨테이너만 복사하며 DOM 요소는 패널과 공유
     */
    get controls(): Record<string, HTMLElement>;
    /**
     * 선택한 부착 상태에 따라 mount 또는 unmount를 호출합니다.
     *
     * @param {boolean} value true이면 패널 부착, false이면 패널 제거
     */
    set mounted(value: boolean);
    /**
     * 패널 부착 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get mounted(): boolean;
    /**
     * true를 지정하면 dispose를 호출하여 종료합니다. <br>
     * 종료된 인스턴스를 false로 되살릴 수 없습니다.
     *
     * @param {boolean} value true이면 종료, false이면 종료 전 상태만 유지 가능
     */
    set disposed(value: boolean);
    /**
     * 종료 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get disposed(): boolean;
    /**
     * 패널 작업 처리 중 여부의 직접 교체를 거부합니다.
     *
     * @param {boolean} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set busy(value: boolean);
    /**
     * 패널 작업 처리 중 여부를 반환합니다.
     *
     * @returns {boolean}
     */
    get busy(): boolean;
    /**
     * 요청 세대 번호의 직접 교체를 거부합니다.
     *
     * @param {number} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set generation(value: number);
    /**
     * 요청 세대 번호를 반환합니다.
     *
     * @returns {number}
     */
    get generation(): number;
    /**
     * 패널 클릭 수신 함수의 직접 교체를 거부합니다.
     *
     * @param {function(Event):void} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set clickHandler(value: (arg0: Event) => void);
    /**
     * 패널 클릭 수신 함수를 반환합니다.
     *
     * @returns {function(Event):void}
     */
    get clickHandler(): (arg0: Event) => void;
    /**
     * 패널 값 변경 수신 함수의 직접 교체를 거부합니다.
     *
     * @param {function(Event):void} value 대입할 값, 항상 오류를 던지므로 해당 공개 변경 메서드를 사용해야 함
     * @throws {Error} 직접 대입은 허용하지 않음
     */
    set changeHandler(value: (arg0: Event) => void);
    /**
     * 패널 값 변경 수신 함수를 반환합니다.
     *
     * @returns {function(Event):void}
     */
    get changeHandler(): (arg0: Event) => void;
    /**
     * 자체 패널과 리스너를 부착하고 현재 일정 사본을 표시합니다.
     */
    mount(): void;
    /**
     * 검증된 상태를 폼에 다시 표시합니다. <br>
     * 미적용 입력 문자열은 상태 값으로 덮어씁니다.
     */
    render(): void;
    /**
     * 자체 DOM과 리스너를 정리하고 이전 확정 완료 통지를 무효화합니다.
     */
    unmount(): void;
    /**
     * 자신의 패널 수명을 종료하며 빌린 실행기와 자료는 해제하지 않습니다.
     */
    dispose(): void;
    /**
     * 시간·단계·트랙 폼을 가진 자체 패널을 구성합니다.
     */
    _build(): void;
    /**
     * 단계별 폼을 묶는 필드셋을 만듭니다.
     *
     * @param {string} title 사용자에게 표시할 편집 영역 이름
     * @returns {HTMLElement} 편집기가 소유하는 필드셋
     */
    _section(title: string): HTMLElement;
    /**
     * 문서 값을 HTML로 해석하지 않고 DOM을 만듭니다.
     *
     * @param {string} tag 만들 표준 HTML 태그
     * @param {string} [text=''] textContent에 기록할 일반 문자열(기본값은 빈 문자열)
     * @param {Record<string, string>} [attributes={}] 표준 속성 이름과 값
     * @returns {HTMLElement} 편집기가 소유하는 DOM 요소
     */
    _node(tag: string, text?: string, attributes?: Record<string, string>): HTMLElement;
    /**
     * 레이블과 입력 요소를 지정 영역에 추가합니다.
     *
     * @param {HTMLElement} parent 편집기가 소유하는 부착 영역
     * @param {string} key 패널 내부 입력 식별자
     * @param {string} title 입력 의미와 단위가 포함된 레이블
     * @param {string} tag input 또는 select 태그
     * @param {Record<string, string>} [attributes={}] 입력 요소의 표준 속성
     */
    _input(parent: HTMLElement, key: string, title: string, tag: string, attributes?: Record<string, string>): void;
    /**
     * 조립 시작 또는 완료 이동량의 세 축 입력을 만듭니다.
     *
     * @param {HTMLElement} parent 입력을 부착할 패널 영역
     * @param {string} prefix from 또는 to 입력 접두어
     * @param {string} title 축 방향과 단위를 표시할 제목
     */
    _vectorInputs(parent: HTMLElement, prefix: string, title: string): void;
    /**
     * 위임 처리할 버튼을 만듭니다.
     *
     * @param {HTMLElement} parent 버튼을 부착할 편집 영역
     * @param {string} action 패널 내부 동작 식별자
     * @param {string} text 사용자에게 표시할 버튼 이름
     */
    _button(parent: HTMLElement, action: string, text: string): void;
    /**
     * 값 입력 요소의 참조를 조회합니다.
     *
     * @param {string} key 패널 입력 식별자
     * @returns {HTMLInputElement | HTMLSelectElement} 패널이 소유하는 입력 요소
     */
    _control(key: string): HTMLInputElement | HTMLSelectElement;
    /**
     * 선택 목록을 일반 문자열로 교체합니다.
     *
     * @param {HTMLElement} select 패널이 소유하는 선택 상자
     * @param {Array<Array<string>>} options 값·표시 문자열 쌍 목록
     */
    _options(select: HTMLElement, options: Array<Array<string>>): void;
    /**
     * 단계 목록과 활성 단계의 이름·시간을 표시합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceScheduleEditVo} state 읽기 전용 편집 상태 사본
     */
    _renderPhases(state: USequenceScheduleEditVo): void;
    /**
     * 그룹·단계 참조와 현재 트랙 목록·입력 폼을 표시합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceScheduleEditVo} state 읽기 전용 편집 상태 사본
     */
    _renderTracks(state: USequenceScheduleEditVo): void;
    /**
     * 현재 선택한 단계의 범위를 새 트랙의 초기 시간으로 표시합니다.
     */
    _newTrackTimes(): void;
    /**
     * 선택 트랙의 모든 편집 필드를 채웁니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceTrackVo} track 읽기 전용 트랙 사본
     */
    _fillTrack(track: USequenceTrackVo): void;
    /**
     * 동·북·상 이동량을 X/Y/Z 숫자 폼에 표시합니다.
     *
     * @param {string} prefix from 또는 to 입력 접두어
     * @param {Array<number>} values 동·북·상 순서의 유한한 미터 값 3개
     */
    _writeVector(prefix: string, values: Array<number>): void;
    /**
     * 빈 입력을 0으로 바꾸지 않고 유한한 숫자만 읽습니다.
     *
     * @param {string} key 초 또는 미터 단위 숫자 폼의 내부 식별자
     * @returns {number} 소수·음수·0을 허용하는 유한한 입력 값
     */
    _number(key: string): number;
    /**
     * 그룹·단계·시간·이동량·보간을 현재 폼에서 읽습니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceTrackVoCO} 입력 소유권이 패널에 있는 트랙 옵션
     */
    _trackOptions(): USequenceTrackVoCO;
    /**
     * 편집할 단계 선택을 요구합니다.
     *
     * @returns {string} 선택한 단계 ID
     */
    _phaseId(): string;
    /**
     * 편집할 트랙 선택을 요구합니다.
     *
     * @returns {string} 선택한 트랙 ID
     */
    _trackId(): string;
    /**
     * 단계·트랙 선택과 새 트랙의 단계 변경을 반영합니다.
     *
     * @param {Event} event 현재 패널의 change 이벤트
     */
    _handleChange(event: Event): void;
    /**
     * 자체 버튼 클릭을 비동기 작업과 수명 세대에 연결합니다.
     *
     * @param {Event} event 현재 패널의 click 이벤트
     */
    _handleClick(event: Event): void;
    /**
     * 전체 시간 축 또는 일정 확정·취소와 동기 편집 동작을 실행합니다.
     *
     * @param {HTMLElement} button 현재 패널이 소유하는 동작 버튼
     * @returns {Promise<void>} 해당 편집 또는 확정 콜백 처리 완료
     */
    _runAction(button: HTMLElement): Promise<void>;
    /**
     * 일정 편집 동작을 기존 실행기의 공개 메서드로 전달합니다.
     *
     * @param {string} action 패널에서 정의한 동작 식별자
     */
    _editAction(action: string): void;
    /**
     * 상대 시간 범위와 선택적인 기준일을 적용합니다.
     */
    _saveTimeline(): void;
    /**
     * 현재 패널 세대의 작업 상태만 해제합니다.
     *
     * @param {number} generation 해당 입력 작업을 시작한 정수 세대
     */
    _finish(generation: number): void;
    /**
     * 비동기 반영 중 모든 입력을 잠그거나 복원합니다.
     *
     * @param {boolean} busy 작업 중이면 true이며 false이면 일반 입력을 다시 허용합니다.
     */
    _toggleInputs(busy: boolean): void;
    /**
     * 원래 오류를 패널과 호출자에게 함께 전달합니다.
     *
     * @param {Error} error 원인과 스택을 보존할 원래 오류
     */
    _reportError(error: Error): void;
    /**
     * 해제한 패널의 재사용을 차단합니다.
     */
    _assertUsable(): void;
}
/**
 * 독립 시퀀스를 전달받고 반영 완료를 알리는 확정 수신 함수입니다.
 *
 * @callback USequenceScheduleApplyCallback
 * @param {import("../vo/sequenceDefinitionVos.js").USequenceVo} sequence 입력 소유권을 받는 독립 시퀀스 사본
 * @returns {PromiseLike<void> | void} 선택적인 비동기 반영 완료
 */
/**
 * 공정 단계·시간 트랙 편집 패널의 생성 옵션입니다.
 *
 * @typedef {object} USequenceScheduleEditorCO
 * @property {HTMLElement} container 호출자가 소유하는 부착 위치
 * @property {import("../legacy/sequenceEditingRuntime.js").USequenceScheduleEditExecutor} editExecutor 호출자가 소유하는 일정 편집 실행기
 * @property {USequenceScheduleApplyCallback} onApply 확정 시퀀스를 받는 동기 또는 비동기 함수
 * @property {function(Error): void} onError 원래 오류를 받는 동기 함수. Promise를 반환하거나 예외를 발생시키지 마십시오.
 */
/**
 * 실제 형상 GUID의 속성을 종류·그룹값·표시 ID로 묶어 왼쪽 목록에 표시합니다. <br>
 * mount에서 세션과 자체 이벤트를 구독하고 재연결·필드 변경 때만 목록 색인을 갱신합니다.
 */
declare class USequenceObjectListPanel {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequenceObjectListPanel 클래스 생성자입니다. <br>
     * 호출자 소유 DOM·세션·이동 실행기를 확인하고 독립 목록 설정을 준비합니다.
     *
     * @param {import('./sequenceLegacyPanels.js').USequenceObjectListPanelCO} opt 화면 컨테이너·세션 관리기·부재 이동기와 목록 표시 설정
     */
    constructor(opt: USequenceObjectListPanelCO);
    _container: HTMLElement;
    _sessionManager: USequenceSessionManager;
    _focusExecutor: USequenceObjectFocusExecutor;
    _config: USequenceObjectListConfigVo;
    _items: any[];
    _branches: Map<any, any>;
    _root: HTMLElement | null;
    _controls: {};
    _unsubscribe: (() => void) | null;
    _mounted: boolean;
    _disposed: boolean;
    _activationGeneration: number;
    _activeObjectId: any;
    _sessionListener: (type: any) => void;
    _selectionHandler: USequenceSelectionHandler | null;
    _selectionListener: (objectIds: any) => void;
    _clickListener: (event: any) => void;
    _changeListener: (event: any) => void;
    _inputListener: (event: any) => void;
    _toggleListener: (event: any) => void;
    /**
     * 자체 DOM·이벤트를 연결하고 기존 세션이 있으면 현재 속성 목록을 표시합니다.
     */
    mount(): void;
    /**
     * 이 패널의 요청·이벤트·구독·DOM만 해제합니다. <br>
     * 재부착할 수 있으며 다른 위젯과 세션은 유지합니다.
     */
    unmount(): void;
    /**
     * 자체 자원을 정리하고 다시 부착할 수 없는 상태로 전환합니다.
     */
    dispose(): void;
    _build(): void;
    _appendField(parent: any, key: any, title: any): void;
    _handleSession(type: any): void;
    _connectSelection(): void;
    _disconnectSelection(): void;
    _receiveSelection(objectIds: any): void;
    /**
     * 목록의 선택 표시·대기 이동과 현재 세션의 GUID·메쉬 강조를 함께 비웁니다. <br>
     * 공통 지도 선택 도구로 전환할 때 사용하며 시공 상태·분리율은 유지합니다.
     *
     * @returns {Promise<void>} 목록의 선택 표시·대기 이동과 현재 세션의 GUID·메쉬 강조를 함께 비웁니다.
     */
    clearSelection(): Promise<void>;
    _fillFields(): void;
    _fillSelect(key: any, paths: any): void;
    _readItems(): void;
    _createItem(session: any, objectId: any): USequenceObjectListItemVo;
    /**
     * 현재 검색 결과를 종류·그룹별로 구성합니다. <br>
     * 닫힌 그룹은 요약만 표시하고 항목은 펼칠 때 만듭니다.
     */
    render(): void;
    _indexItem(kinds: any, item: any): void;
    _appendKind(kind: any, expanded: any): void;
    _appendGroup(parent: any, group: any, expanded: any): void;
    _populateBranch(details: any): void;
    _handleToggle(event: any): void;
    _valueKey(value: any): string;
    _label(value: any): string;
    _matches(item: any, term: any): boolean;
    _handleClick(event: any): void;
    _activate(objectId: any): Promise<void>;
    _renderActive(): void;
    _handleChange(event: any): void;
    _handleInput(event: any): void;
    _node(tag: any, text?: string, className?: string): HTMLElement;
    /**
     * 호출자 소유 목록 부착 영역 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {never} value 목록 부착 영역(직접 변경 불가)
     */
    set container(value: never);
    /**
     * 호출자 소유 목록 부착 영역 값을 조회합니다.
     */
    get container(): never;
    /**
     * 호출자 소유 세션 관리기 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {never} value 세션 관리자(직접 변경 불가)
     */
    set sessionManager(value: never);
    /**
     * 호출자 소유 세션 관리기 값을 조회합니다.
     */
    get sessionManager(): never;
    /**
     * 호출자 소유 이동 실행기 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {never} value 카메라 이동 실행기(직접 변경 불가)
     */
    set focusExecutor(value: never);
    /**
     * 호출자 소유 이동 실행기 값을 조회합니다.
     */
    get focusExecutor(): never;
    /**
     * 독립 목록 필드 설정 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceObjectListConfigVo} value 목록 필드 설정(직접 변경 불가)
     */
    set config(value: USequenceObjectListConfigVo);
    /**
     * 독립 목록 필드 설정 값을 조회합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceObjectListConfigVo} 독립 목록 필드 설정 값
     */
    get config(): USequenceObjectListConfigVo;
    /**
     * 자체 목록 항목 사본 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {Array<import('../vo/sequenceDefinitionVos.js').USequenceObjectListItemVo>} value 목록 항목 사본(직접 변경 불가)
     */
    set items(value: Array<USequenceObjectListItemVo>);
    /**
     * 자체 목록 항목 사본 값을 조회합니다.
     *
     * @returns {Array<import('../vo/sequenceDefinitionVos.js').USequenceObjectListItemVo>} 자체 목록 항목 사본 값
     */
    get items(): Array<USequenceObjectListItemVo>;
    /**
     * 그룹별 항목 사본 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {Map<any, any>} value 그룹별 항목 사본(직접 변경 불가)
     */
    set branches(value: Map<any, any>);
    /**
     * 그룹별 항목 사본 값을 조회합니다.
     *
     * @returns {Map<any, any>} 그룹별 항목 사본 값
     */
    get branches(): Map<any, any>;
    /**
     * 자체 목록 루트 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {HTMLElement | null} value 목록 루트(직접 변경 불가)
     */
    set root(value: HTMLElement | null);
    /**
     * 자체 목록 루트 값을 조회합니다.
     *
     * @returns {HTMLElement | null} 자체 목록 루트 값
     */
    get root(): HTMLElement | null;
    /**
     * 자체 DOM 컨트롤 참조의 복사 컨테이너 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {never} value DOM 컨트롤 참조(직접 변경 불가)
     */
    set controls(value: never);
    /**
     * 자체 DOM 컨트롤 참조의 복사 컨테이너 값을 조회합니다.
     */
    get controls(): never;
    /**
     * 자체 세션 구독 해제 함수 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {never} value 세션 구독 해제 함수(직접 변경 불가)
     */
    set unsubscribe(value: never);
    /**
     * 자체 세션 구독 해제 함수 값을 조회합니다.
     */
    get unsubscribe(): never;
    /**
     * 목록 부착 여부 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {boolean} value 목록 부착 상태(직접 변경 불가)
     */
    set mounted(value: boolean);
    /**
     * 목록 부착 여부 값을 조회합니다.
     *
     * @returns {boolean} 목록 부착 여부 값
     */
    get mounted(): boolean;
    /**
     * 목록 해제 여부 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {boolean} value 목록 해제 상태(직접 변경 불가)
     */
    set disposed(value: boolean);
    /**
     * 목록 해제 여부 값을 조회합니다.
     *
     * @returns {boolean} 목록 해제 여부 값
     */
    get disposed(): boolean;
    /**
     * 0 기반 단조 증가 항목 클릭 세대 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {number} value 항목 클릭 세대(직접 변경 불가)
     */
    set activationGeneration(value: number);
    /**
     * 0 기반 단조 증가 항목 클릭 세대 값을 조회합니다.
     *
     * @returns {number} 0 기반 단조 증가 항목 클릭 세대 값
     */
    get activationGeneration(): number;
    /**
     * 현재 목록에서 선택한 영구 GUID 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {never} value 선택한 영구 GUID(직접 변경 불가)
     */
    set activeObjectId(value: never);
    /**
     * 현재 목록에서 선택한 영구 GUID 값을 조회합니다.
     */
    get activeObjectId(): never;
    /**
     * 세션 수신 함수 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {function(any):void} value 세션 수신 함수(직접 변경 불가)
     */
    set sessionListener(value: (arg0: any) => void);
    /**
     * 세션 수신 함수 값을 조회합니다.
     *
     * @returns {function(any):void} 세션 수신 함수 값
     */
    get sessionListener(): (arg0: any) => void;
    /**
     * 선택 처리기는 세션별 구독 수명에서 관리하며 직접 교체를 거부합니다.
     *
     * @param {never} value 대입할 값(직접 변경 불가)
     */
    set selectionHandler(value: never);
    /**
     * 현재 세션에서 빌려 구독하는 선택 처리기를 반환합니다.
     */
    get selectionHandler(): never;
    /**
     * 등록된 선택 알림 수신 함수의 직접 교체를 거부합니다.
     *
     * @param {function(any):void} value 대입할 값(직접 변경 불가)
     */
    set selectionListener(value: (arg0: any) => void);
    /**
     * 이 목록이 소유한 선택 알림 수신 함수를 반환합니다.
     *
     * @returns {function(any):void} 이 목록이 소유한 선택 알림 수신 함수
     */
    get selectionListener(): (arg0: any) => void;
    /**
     * 자체 클릭 수신 함수 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {function(any):void} value 클릭 수신 함수(직접 변경 불가)
     */
    set clickListener(value: (arg0: any) => void);
    /**
     * 자체 클릭 수신 함수 값을 조회합니다.
     *
     * @returns {function(any):void} 자체 클릭 수신 함수 값
     */
    get clickListener(): (arg0: any) => void;
    /**
     * 자체 경로 변경 수신 함수 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {function(any):void} value 경로 변경 수신 함수(직접 변경 불가)
     */
    set changeListener(value: (arg0: any) => void);
    /**
     * 자체 경로 변경 수신 함수 값을 조회합니다.
     *
     * @returns {function(any):void} 자체 경로 변경 수신 함수 값
     */
    get changeListener(): (arg0: any) => void;
    /**
     * 자체 검색 수신 함수 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {function(any):void} value 검색 수신 함수(직접 변경 불가)
     */
    set inputListener(value: (arg0: any) => void);
    /**
     * 자체 검색 수신 함수 값을 조회합니다.
     *
     * @returns {function(any):void} 자체 검색 수신 함수 값
     */
    get inputListener(): (arg0: any) => void;
    /**
     * 자체 그룹 펼침 수신 함수 값의 직접 교체를 거부합니다. <br>
     * 공개 수명 메서드로 관리합니다.
     *
     * @param {function(any):void} value 그룹 펼침 수신 함수(직접 변경 불가)
     */
    set toggleListener(value: (arg0: any) => void);
    /**
     * 자체 그룹 펼침 수신 함수 값을 조회합니다.
     *
     * @returns {function(any):void} 자체 그룹 펼침 수신 함수 값
     */
    get toggleListener(): (arg0: any) => void;
}
/**
 * 속성 계층 목록 패널 생성 옵션입니다.
 *
 * @typedef {object} USequenceObjectListPanelCO
 * @property {HTMLElement} container 호출자 소유 부착 영역입니다.
 * @property {import("../legacy/sequenceSessionRuntime.js").USequenceSessionManager} sessionManager 호출자 소유 관리기입니다.
 * @property {import("../legacy/sequenceTransformRuntime.js").USequenceObjectFocusExecutor} focusExecutor 호출자 소유 이동 실행기입니다. <br>
 * 패널은 dispose하지 않습니다.
 * @property {import('../vo/sequenceDefinitionVos.js').USequenceObjectListConfigVoCO | import("../vo/sequenceDefinitionVos.js").USequenceObjectListConfigVo} [config] 복사할 원본 필드 경로입니다.
 */
/**
 * 왼쪽 설정 패널에서 교량 투명도를 제어하고 타임라인 소유 축별 분리 DOM의 부착 영역을 제공합니다. <br>
 * mount에서 자체 DOM·이벤트·세션 구독을 연결하고 표시 투명도 0~100%를 불투명도 1~0으로 변환합니다.
 */
declare class USequenceOpacityPanel {
    /**
     * 생성자 옵션 이름 정규화에 사용하는 내부 목록입니다.
     *
     * @type {ReadonlyArray<string>}
     *
     * @ignore
     */
    static OPT_KEYS: ReadonlyArray<string>;
    /**
     * USequenceOpacityPanel 클래스 생성자입니다. <br>
     * 호출자 DOM과 세션 관리기를 빌려 연결하며 실제 부착은 mount에서 시작합니다.
     *
     * @param {import('./sequenceLegacyPanels.js').USequenceOpacityPanelCO} opt 화면 컨테이너와 투명도를 조작할 세션 관리기
     */
    constructor(opt: USequenceOpacityPanelCO);
    _container: HTMLElement;
    _sessionManager: USequenceSessionManager;
    _state: USequenceOpacityStateVo;
    _root: any;
    _controls: {};
    _unsubscribe: (() => void) | null;
    _inputListener: (event: any) => void;
    _sessionListener: (type: any) => void;
    _layer: any;
    _originalOpacity: any;
    _mounted: boolean;
    _disposed: boolean;
    /**
     * 자체 패널과 입력 이벤트를 부착하고 현재 세션을 연결합니다. <br>
     * 중복 호출은 기존 부착을 유지합니다.
     */
    mount(): void;
    /**
     * 현재 레이어의 이전 불투명도를 복원하고 자체 DOM·이벤트·구독을 해제합니다. <br>
     * 반복 호출은 추가 작업을 하지 않습니다.
     */
    dispose(): void;
    _unmount(): void;
    _build(): void;
    _handleSession(type: any): void;
    _bindLayer(): void;
    _releaseLayer(): void;
    _handleInput(event: any): void;
    /**
     * 대기 중 슬라이더 입력을 취소하고 검증한 상태를 현재 레이어에 즉시 적용합니다. <br>
     * 성공한 경우에만 독립 사본으로 교체합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceOpacityStateVo} value 불투명도 설정(opacity 0~1, 현재 시공 시각과 분리율 유지)
     */
    set state(value: USequenceOpacityStateVo);
    /**
     * 보관한 상태의 독립 사본을 반환합니다. <br>
     * 연결 중 슬라이더 대기값은 적용 성공 후 확정하고, 세션 교체 중에는 마지막 입력을 다음 연결용으로 보관합니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceOpacityStateVo} 보관한 상태의 독립 사본
     */
    get state(): USequenceOpacityStateVo;
    _render(): void;
    _checkOpacity(value: any): void;
    _node(tag: any, text?: string, className?: string): any;
    _alive(): void;
    /**
     * 패널의 연결·수명 상태를 직접 교체하지 못하도록 합니다.
     *
     * @param {never} value 패널 부착 영역(직접 변경 불가)
     */
    set container(value: never);
    /**
     * 호출자 소유 부착 위치 HTMLElement 값을 반환합니다.
     */
    get container(): never;
    /**
     * 패널의 연결·수명 상태를 직접 교체하지 못하도록 합니다.
     *
     * @param {never} value 세션 관리자(직접 변경 불가)
     */
    set sessionManager(value: never);
    /**
     * 호출자 소유 세션 관리기 참조 object 값을 반환합니다.
     */
    get sessionManager(): never;
    /**
     * 패널의 연결·수명 상태를 직접 교체하지 못하도록 합니다.
     *
     * @param {never} value 패널 루트(직접 변경 불가)
     */
    set root(value: never);
    /**
     * 패널이 소유한 HTMLElement 또는 부착 전·해제 후 null 값을 반환합니다.
     */
    get root(): never;
    /**
     * 패널의 연결·수명 상태를 직접 교체하지 못하도록 합니다.
     *
     * @param {never} value 슬라이더·출력·상태 요소 참조(직접 변경 불가)
     */
    set controls(value: never);
    /**
     * 패널이 소유한 슬라이더·출력·상태 요소를 가리키는 object 값을 반환합니다.
     */
    get controls(): never;
    /**
     * 패널의 연결·수명 상태를 직접 교체하지 못하도록 합니다.
     *
     * @param {never} value 구독 해제 함수(직접 변경 불가)
     */
    set unsubscribe(value: never);
    /**
     * 패널이 소유한 구독 해제 Function 또는 null 값을 반환합니다.
     */
    get unsubscribe(): never;
    /**
     * 패널의 연결·수명 상태를 직접 교체하지 못하도록 합니다.
     *
     * @param {function(any):void} value 입력 이벤트 수신 함수(직접 변경 불가)
     */
    set inputListener(value: (arg0: any) => void);
    /**
     * 패널이 소유한 바인딩된 입력 수신 Function 값을 반환합니다.
     *
     * @returns {function(any):void} 패널이 소유한 바인딩된 입력 수신 Function 값
     */
    get inputListener(): (arg0: any) => void;
    /**
     * 패널의 연결·수명 상태를 직접 교체하지 못하도록 합니다.
     *
     * @param {function(any):void} value 세션 이벤트 수신 함수(직접 변경 불가)
     */
    set sessionListener(value: (arg0: any) => void);
    /**
     * 패널이 소유한 바인딩된 세션 수신 Function 값을 반환합니다.
     *
     * @returns {function(any):void} 패널이 소유한 바인딩된 세션 수신 Function 값
     */
    get sessionListener(): (arg0: any) => void;
    /**
     * 패널의 연결·수명 상태를 직접 교체하지 못하도록 합니다.
     *
     * @param {never} value 연결된 레이어(직접 변경 불가)
     */
    set layer(value: never);
    /**
     * 빌린 현재 교량 레이어 object 또는 미연결 null 값을 반환합니다.
     */
    get layer(): never;
    /**
     * 패널의 연결·수명 상태를 직접 교체하지 못하도록 합니다.
     *
     * @param {never} value 레이어 연결 전 불투명도(직접 변경 불가)
     */
    set originalOpacity(value: never);
    /**
     * 레이어 연결 전의 무차원 0~1 number 또는 미연결 null 값을 반환합니다.
     */
    get originalOpacity(): never;
    /**
     * 패널의 연결·수명 상태를 직접 교체하지 못하도록 합니다.
     *
     * @param {boolean} value DOM·이벤트 부착 상태(직접 변경 불가)
     */
    set mounted(value: boolean);
    /**
     * 패널의 DOM·이벤트 부착 여부 boolean 값을 반환합니다.
     *
     * @returns {boolean} 패널의 DOM·이벤트 부착 여부 boolean 값
     */
    get mounted(): boolean;
    /**
     * 패널의 연결·수명 상태를 직접 교체하지 못하도록 합니다.
     *
     * @param {boolean} value 최종 해제 상태(직접 변경 불가)
     */
    set disposed(value: boolean);
    /**
     * 최종 해제 여부 boolean 값을 반환합니다.
     *
     * @returns {boolean} 최종 해제 여부 boolean 값
     */
    get disposed(): boolean;
    #private;
}
/**
 * 교량 투명도 패널 생성 옵션입니다.
 *
 * @typedef {object} USequenceOpacityPanelCO
 * @property {HTMLElement} container 호출자 소유 부착 위치. 기존 자식은 유지합니다.
 * @property {import("../legacy/sequenceSessionRuntime.js").USequenceSessionManager} sessionManager 호출자 소유 관리기. 패널은 세션 이벤트 구독과 레이어 불투명도 API만 사용합니다.
 */
/**
 * 선택 GUID의 속성을 읽어 객체 선택 목록과 속성셋 표로 표시합니다.
 */
declare class USequencePropertyPanel {
    /**
     * @ignore
     */
    static OPT_KEYS: readonly string[];
    /**
     * USequencePropertyPanel 클래스 생성자입니다. <br>
     * 호출자가 소유한 DOM·선택·조회 경계를 확인하고 자체 상태와 수신 함수를 준비합니다.
     *
     * @param {import('./sequenceLegacyPanels.js').USequencePropertyPanelCO} opt 화면 컨테이너·선택기·속성 조회기와 선택적인 열기 알림
     */
    constructor(opt: USequencePropertyPanelCO);
    _container: HTMLElement;
    _selectionHandler: USequenceSelectionHandler;
    _queryExecutor: USequencePropertyQueryExecutor;
    _onOpen: (() => void) | null;
    _externalObject: USequenceObjectPropertyVo | null;
    _externalSourceName: string;
    _externalNotice: string;
    _objectIds: any[];
    _activeObjectId: any;
    _root: HTMLElement | null;
    _controls: {};
    _selectionListener: (objectIds: any) => void;
    _changeListener: (event: any) => void;
    _mounted: boolean;
    _disposed: boolean;
    /**
     * 자체 DOM과 선택 구독을 연결하고 현재 선택을 표시합니다. <br>
     * 선택기의 connect는 기존 GroupEditor가 담당합니다.
     */
    mount(): void;
    /**
     * 자체 수신 함수와 DOM만 해제하고 빌린 선택 연결·조회기·메쉬는 유지합니다.
     */
    unmount(): void;
    /**
     * 자체 자원을 해제하고 패널을 다시 부착할 수 없는 상태로 전환합니다.
     */
    dispose(): void;
    /**
     * 현재 선택 목록과 활성 객체의 속성을 독립 DOM으로 갱신합니다.
     */
    render(): void;
    /**
     * 공통 선택에서 받은 자료별 속성 사본을 표시합니다. <br>
     * null과 빈 안내를 전달하면 외부 표시와 이전 속성을 함께 비웁니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceObjectPropertyVo | null} object 표시할 속성 사본의 원본 또는 표시를 해제하는 null
     * @param {string} [sourceName] 자료의 표시 이름
     * @param {string} [notice] 속성 패널의 안내 문구
     */
    showObject(object: USequenceObjectPropertyVo | null, sourceName?: string, notice?: string): void;
    _renderExternalObject(): void;
    _receiveSelection(objectIds: any): void;
    _handleChange(event: any): void;
    _appendValue(name: any, value: any, parent: any): void;
    _node(tag: any, text?: string, className?: string): HTMLElement;
    /**
     * 호출자 소유 부착 위치의 직접 교체를 거부합니다. <br>
     * 생성 옵션 또는 공개 수명 메서드를 사용합니다.
     *
     * @param {never} value 대입할 값(직접 변경 불가)
     */
    set container(value: never);
    /**
     * 호출자 소유 부착 위치를 반환합니다.
     */
    get container(): never;
    /**
     * 빌려 사용하는 선택 처리기의 직접 교체를 거부합니다. <br>
     * 생성 옵션 또는 공개 수명 메서드를 사용합니다.
     *
     * @param {never} value 대입할 값(직접 변경 불가)
     */
    set selectionHandler(value: never);
    /**
     * 빌려 사용하는 선택 처리기를 반환합니다.
     */
    get selectionHandler(): never;
    /**
     * 빌려 사용하는 속성 조회기의 직접 교체를 거부합니다. <br>
     * 생성 옵션 또는 공개 수명 메서드를 사용합니다.
     *
     * @param {never} value 대입할 값(직접 변경 불가)
     */
    set queryExecutor(value: never);
    /**
     * 빌려 사용하는 속성 조회기를 반환합니다.
     */
    get queryExecutor(): never;
    /**
     * 새 선택에 대한 패널 열기 수신 함수의 직접 교체를 거부합니다. <br>
     * 생성 옵션 또는 공개 수명 메서드를 사용합니다.
     *
     * @param {never} value 대입할 값(직접 변경 불가)
     */
    set onOpen(value: never);
    /**
     * 새 선택에 대한 패널 열기 수신 함수를 반환합니다.
     */
    get onOpen(): never;
    /**
     * 선택된 GUID 사본의 직접 교체를 거부합니다. <br>
     * 생성 옵션 또는 공개 수명 메서드를 사용합니다.
     *
     * @param {Array<any>} value 대입할 값(직접 변경 불가)
     */
    set objectIds(value: Array<any>);
    /**
     * 선택된 GUID 사본을 반환합니다.
     *
     * @returns {Array<any>} 선택된 GUID 사본
     */
    get objectIds(): Array<any>;
    /**
     * 현재 속성을 표시하는 GUID의 직접 교체를 거부합니다. <br>
     * 생성 옵션 또는 공개 수명 메서드를 사용합니다.
     *
     * @param {never} value 대입할 값(직접 변경 불가)
     */
    set activeObjectId(value: never);
    /**
     * 현재 속성을 표시하는 GUID를 반환합니다.
     */
    get activeObjectId(): never;
    /**
     * 자체 DOM 루트의 직접 교체를 거부합니다. <br>
     * 생성 옵션 또는 공개 수명 메서드를 사용합니다.
     *
     * @param {HTMLElement | null} value 대입할 값(직접 변경 불가)
     */
    set root(value: HTMLElement | null);
    /**
     * 자체 DOM 루트를 반환합니다.
     *
     * @returns {HTMLElement | null} 자체 DOM 루트
     */
    get root(): HTMLElement | null;
    /**
     * 자체 입력 요소의 참조 사본의 직접 교체를 거부합니다. <br>
     * 생성 옵션 또는 공개 수명 메서드를 사용합니다.
     *
     * @param {never} value 대입할 값(직접 변경 불가)
     */
    set controls(value: never);
    /**
     * 자체 입력 요소의 참조 사본을 반환합니다.
     */
    get controls(): never;
    /**
     * 등록·해제에 사용하는 동일 선택 수신 함수의 직접 교체를 거부합니다. <br>
     * 생성 옵션 또는 공개 수명 메서드를 사용합니다.
     *
     * @param {function(any):void} value 대입할 값(직접 변경 불가)
     */
    set selectionListener(value: (arg0: any) => void);
    /**
     * 등록·해제에 사용하는 동일 선택 수신 함수를 반환합니다.
     *
     * @returns {function(any):void} 등록·해제에 사용하는 동일 선택 수신 함수
     */
    get selectionListener(): (arg0: any) => void;
    /**
     * 자체 객체 목록 변경 수신 함수의 직접 교체를 거부합니다. <br>
     * 생성 옵션 또는 공개 수명 메서드를 사용합니다.
     *
     * @param {function(any):void} value 대입할 값(직접 변경 불가)
     */
    set changeListener(value: (arg0: any) => void);
    /**
     * 자체 객체 목록 변경 수신 함수를 반환합니다.
     *
     * @returns {function(any):void} 자체 객체 목록 변경 수신 함수
     */
    get changeListener(): (arg0: any) => void;
    /**
     * 현재 부착 상태의 직접 교체를 거부합니다. <br>
     * 생성 옵션 또는 공개 수명 메서드를 사용합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set mounted(value: boolean);
    /**
     * 현재 부착 상태를 반환합니다.
     *
     * @returns {boolean} 현재 부착 상태
     */
    get mounted(): boolean;
    /**
     * 최종 해제 상태의 직접 교체를 거부합니다. <br>
     * 생성 옵션 또는 공개 수명 메서드를 사용합니다.
     *
     * @param {boolean} value 대입할 값(직접 변경 불가)
     */
    set disposed(value: boolean);
    /**
     * 최종 해제 상태를 반환합니다.
     *
     * @returns {boolean} 최종 해제 상태
     */
    get disposed(): boolean;
    /**
     * 외부 레이어 속성 VO의 직접 변경을 제한하고 showObject로 표시를 함께 갱신하도록 합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceObjectPropertyVo | null} value 대입할 값(직접 변경 불가)
     */
    set externalObject(value: USequenceObjectPropertyVo | null);
    /**
     * 외부 레이어 속성 VO를 반환합니다. <br>
     * 속성 VO는 독립 사본입니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceObjectPropertyVo | null} 외부 레이어 속성 VO
     */
    get externalObject(): USequenceObjectPropertyVo | null;
    /**
     * 외부 자료 표시 이름의 직접 변경을 제한하고 showObject로 표시를 함께 갱신하도록 합니다.
     *
     * @param {string} value 대입할 값(직접 변경 불가)
     */
    set externalSourceName(value: string);
    /**
     * 외부 자료 표시 이름를 반환합니다. <br>
     * 속성 VO는 독립 사본입니다.
     *
     * @returns {string} 외부 자료 표시 이름
     */
    get externalSourceName(): string;
    /**
     * 외부 속성 상태 안내의 직접 변경을 제한하고 showObject로 표시를 함께 갱신하도록 합니다.
     *
     * @param {string} value 대입할 값(직접 변경 불가)
     */
    set externalNotice(value: string);
    /**
     * 외부 속성 상태 안내를 반환합니다. <br>
     * 속성 VO는 독립 사본입니다.
     *
     * @returns {string} 외부 속성 상태 안내
     */
    get externalNotice(): string;
}
/**
 * 확정 그룹의 독립 사본을 받는 함수입니다.
 */
type USequenceGroupApplyCallback = (groups: Array<USequenceGroupVo>) => PromiseLike<void> | void;
/**
 * 편집 패널의 생성 옵션입니다.
 */
type USequenceGroupEditorCO = {
    /**
     * 호출자가 소유하는 부착 위치
     */
    container: HTMLElement;
    /**
     * 호출자가 소유하는 편집 실행기
     */
    editExecutor: USequenceGroupEditExecutor;
    /**
     * 아직 연결하지 않은 편집기 전용 선택 연결
     */
    selectionHandler: USequenceSelectionHandler;
    /**
     * 확정 그룹을 전달받는 동기 또는 비동기 함수
     */
    onApply: USequenceGroupApplyCallback;
    /**
     * 편집 오류를 받는 동기 함수
     */
    onError: (arg0: Error) => void;
};
/**
 * 독립 시퀀스를 전달받고 반영 완료를 알리는 확정 수신 함수입니다.
 */
type USequenceScheduleApplyCallback = (sequence: USequenceVo) => PromiseLike<void> | void;
/**
 * 공정 단계·시간 트랙 편집 패널의 생성 옵션입니다.
 */
type USequenceScheduleEditorCO = {
    /**
     * 호출자가 소유하는 부착 위치
     */
    container: HTMLElement;
    /**
     * 호출자가 소유하는 일정 편집 실행기
     */
    editExecutor: USequenceScheduleEditExecutor;
    /**
     * 확정 시퀀스를 받는 동기 또는 비동기 함수
     */
    onApply: USequenceScheduleApplyCallback;
    /**
     * 원래 오류를 받는 동기 함수. Promise를 반환하거나 예외를 발생시키지 마십시오.
     */
    onError: (arg0: Error) => void;
};
/**
 * 속성 계층 목록 패널 생성 옵션입니다.
 */
type USequenceObjectListPanelCO = {
    /**
     * 호출자 소유 부착 영역입니다.
     */
    container: HTMLElement;
    /**
     * 호출자 소유 관리기입니다.
     */
    sessionManager: USequenceSessionManager;
    /**
     * 호출자 소유 이동 실행기입니다. <br>
     * 패널은 dispose하지 않습니다.
     */
    focusExecutor: USequenceObjectFocusExecutor;
    /**
     * 복사할 원본 필드 경로입니다.
     */
    config?: USequenceObjectListConfigVo | USequenceObjectListConfigVoCO | undefined;
};
/**
 * 교량 투명도 패널 생성 옵션입니다.
 */
type USequenceOpacityPanelCO = {
    /**
     * 호출자 소유 부착 위치. 기존 자식은 유지합니다.
     */
    container: HTMLElement;
    /**
     * 호출자 소유 관리기. 패널은 세션 이벤트 구독과 레이어 불투명도 API만 사용합니다.
     */
    sessionManager: USequenceSessionManager;
};
/**
 * 선택 객체의 속성을 표시하는 패널 생성 옵션입니다.
 */
type USequencePropertyPanelCO = {
    /**
     * 패널을 부착할 호출자 소유 영역
     */
    container: HTMLElement;
    /**
     * GroupEditor가 연결·해제하는 선택 처리기
     */
    selectionHandler: USequenceSelectionHandler;
    /**
     * 같은 contentId의 속성 조회기
     */
    queryExecutor: USequencePropertyQueryExecutor;
    /**
     * 새로운 비어 있지 않은 선택에서만 호출하는 동기 패널 열기 함수입니다.
     */
    onOpen?: (() => void) | null | undefined;
};

type USequenceConstructionPlanExecutorCO = USequenceConstructionPlanExecutorCO$1;
type USequenceConstructionConfigVoCO = USequenceConstructionConfigVoCO$1;

type USequencePlayerCO = USequencePlayerCO$1;
type USequenceRuntimeManagerCO = USequenceRuntimeManagerCO$1;
type USequenceRuntimeRequestVoCO = USequenceRuntimeRequestVoCO$2;
type USequencePlayerStateVoCO = USequencePlayerStateVoCO$1;
type USequenceIssueVoCO = USequenceIssueVoCO$1;
type USequencePlayerPhase = USequencePlayerPhase$2;
type USequenceFeatureFactory = USequenceFeatureFactory$1;
type USequenceFeatureClaimVoCO = USequenceFeatureClaimVoCO$1;
type USequenceFeatureFramePlan = USequenceFeatureFramePlan$1;

/**
 * SQ-008 Runtime의 프레임 실행을 구동하며 evaluator/형상/Clock/준비 timeout·빌린 포트 수명을 직접 소유하지 않습니다.
 */
declare class USequencePlaybackExecutor {
    /**
     * USequencePlaybackExecutor 클래스 생성자입니다. <br>
     * 범위/옵션을 복사하고 구동 권한을 고정합니다.
     *
     * @param {import('./sequencePlaybackRuntime.js').USequencePlaybackExecutorCO} opt timeline/onTime 필수, options 기본{}, 시간/스케줄/진단 포트 기본null
     */
    constructor(opt: USequencePlaybackExecutorCO);
    /**
     * @type {import('../vo/sequenceDefinitionVos.js').USequenceTimelineVo}
     */ _timeline: USequenceTimelineVo;
    /**
     * @type {import('../vo/sequenceDefinitionVos.js').USequencePlaybackOptionsVo}
     */ _options: USequencePlaybackOptionsVo;
    /**
     * @type {import('../core/sequenceData.js').USequenceTimeSourcePort | null}
     */ _timeSource: USequenceTimeSourcePort$1 | null;
    /**
     * @type {import('../core/sequenceData.js').USequenceSchedulerPort | null}
     */ _scheduler: USequenceSchedulerPort$1 | null;
    /** @type {(time:number)=>void} */ _onTime: (time: number) => void;
    /**
     * @type {import('../core/sequenceData.js').USequencePlaybackErrorReporter | null}
     */ _reportError: USequencePlaybackErrorReporter | null;
    /** @type {number} */ _currentTime: number;
    /** @type {boolean} */ _playing: boolean;
    /**
     * @type {import('../core/sequenceData.js').USequencePlaybackAnchor | null}
     */ _anchor: USequencePlaybackAnchor | null;
    /** @type {number|null} */ _lastNow: number | null;
    /** @type {number|null} */ _lastApplied: number | null;
    /**
     * @type {import('../core/sequenceData.js').USequencePlaybackSubscription | null}
     */ _subscription: USequencePlaybackSubscription | null;
    /** @type {Map<object,USequencePlaybackListener>} */ _listeners: Map<object, USequencePlaybackListener>;
    /**
     * @type {import('../vo/sequenceDefinitionVos.js').USequencePlaybackStatus}
     */ _status: USequencePlaybackStatus;
    /** @type {number} */ _revision: number;
    /** @type {boolean} */ _working: boolean;
    /**
     * 마지막 확정 상태만 반환합니다. <br>
     * callback 중 읽기와 disposed 조회도 허용하며 시간/장면/예약을 갱신하지 않습니다.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequencePlaybackSnapshotVo} 독립 사본
     */
    getState(): USequencePlaybackSnapshotVo;
    /**
     * 초기 통지 없이 자기 구독만 등록하고 수신자마다 독립 상태를 전달합니다.
     *
     * @param {import('./sequencePlaybackRuntime.js').USequencePlaybackListener} listener 빌린 동기 수신자, Promise/변경 재진입 금지
     * @returns {import('../core/sequenceData.js').USequenceSchedulerUnsubscribe} 해제
     */
    subscribe(listener: USequencePlaybackListener): USequenceSchedulerUnsubscribe;
    /**
     * 현재 시각에서 재생 의도를 켜고 필요한 자기 구독만 연결합니다. <br>
     * 끝에서 자동 rewind하지 않습니다.
     */
    play(): void;
    /**
     * 자동 경과를 호출 시점까지 정산하고 재생 의도/자기 구독을 멈춥니다. <br>
     * 해제 실패도 반복 호출로 재시도합니다.
     */
    pause(): void;
    /**
     * 범위로 clamp한 명시 프레임을 재적용하고 성공하면 anchor를 다시 잡습니다. <br>
     * error 복구는 paused로 확정합니다.
     *
     * @param {number} time 시각, 유한 절대 시퀀스 상대 초, 범위 밖 clamp
     */
    seek(time: number): void;
    /**
     * 수동 구동의 절대 상대 초를 적용하며 배속/loop를 중복 계산하지 않습니다. <br>
     * 자동 구동에서는 실행 전 거부합니다.
     *
     * @param {number} time 시각, 유한 절대 시퀀스 상대 초, 범위 밖 clamp
     */
    update(time: number): void;
    /**
     * 기존 배속의 경과를 먼저 정산하고 새 배속의 anchor를 잡습니다. <br>
     * 0은 재생 의도를 유지하며 예약만 멈춥니다.
     *
     * @param {number} value 유한 무차원 배속, 음수/0 허용
     */
    setMultiplier(value: number): void;
    /**
     * 기존 반복 정책의 경과를 정산한 뒤 새 정책을 고정하며 현재 시각을 점프시키지 않습니다.
     *
     * @param {boolean} value 새 반복 여부
     */
    setLoop(value: boolean): void;
    /**
     * 명령/늦은 tick을 먼저 차단하고 자기 구독·통지만 정리합니다. <br>
     * 실패한 해제는 반복 dispose로 재시도하며 빌린 포트를 종료하지 않습니다.
     */
    dispose(): void;
    /**
     * 수명/성공 기준을 우회하는 직접 대입을 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequenceTimelineVo} value 거부할 대입 값
     */
    set timeline(value: USequenceTimelineVo);
    /**
     * 독립 범위 VO 사본을 반환합니다. <br>
     * 소유권 이전 없음.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequenceTimelineVo} 값/사본
     */
    get timeline(): USequenceTimelineVo;
    /**
     * 수명/성공 기준을 우회하는 직접 대입을 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePlaybackOptionsVo} value 거부할 대입 값
     */
    set options(value: USequencePlaybackOptionsVo);
    /**
     * 현재 옵션 사본을 반환합니다. <br>
     * 소유권 이전 없음.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequencePlaybackOptionsVo} 값/사본
     */
    get options(): USequencePlaybackOptionsVo;
    /**
     * 수명/성공 기준을 우회하는 직접 대입을 거부합니다.
     *
     * @param {import('../core/sequenceData.js').USequenceTimeSourcePort | null} value 거부할 대입 값
     */
    set timeSource(value: USequenceTimeSourcePort$1 | null);
    /**
     * 빌린 단조 시간 포트을 반환합니다. <br>
     * 소유권 이전 없음.
     *
     * @returns {import('../core/sequenceData.js').USequenceTimeSourcePort | null} 값/사본
     */
    get timeSource(): USequenceTimeSourcePort$1 | null;
    /**
     * 수명/성공 기준을 우회하는 직접 대입을 거부합니다.
     *
     * @param {import('../core/sequenceData.js').USequenceSchedulerPort | null} value 거부할 대입 값
     */
    set scheduler(value: USequenceSchedulerPort$1 | null);
    /**
     * 빌린 자동 구동 포트을 반환합니다. <br>
     * 소유권 이전 없음.
     *
     * @returns {import('../core/sequenceData.js').USequenceSchedulerPort | null} 값/사본
     */
    get scheduler(): USequenceSchedulerPort$1 | null;
    /**
     * 수명/성공 기준을 우회하는 직접 대입을 거부합니다.
     *
     * @param {function(number):void} value 거부할 대입 값
     */
    set onTime(value: (arg0: number) => void);
    /**
     * 빌린 프레임 실행 함수을 반환합니다. <br>
     * 소유권 이전 없음.
     *
     * @returns {function(number):void} 값/사본
     */
    get onTime(): (arg0: number) => void;
    /**
     * 수명/성공 기준을 우회하는 직접 대입을 거부합니다.
     *
     * @param {import('../core/sequenceData.js').USequencePlaybackErrorReporter | null} value 거부할 대입 값
     */
    set reportError(value: USequencePlaybackErrorReporter | null);
    /**
     * 빌린 오류 수신 함수을 반환합니다. <br>
     * 소유권 이전 없음.
     *
     * @returns {import('../core/sequenceData.js').USequencePlaybackErrorReporter | null} 값/사본
     */
    get reportError(): USequencePlaybackErrorReporter | null;
    /**
     * 수명/성공 기준을 우회하는 직접 대입을 거부합니다.
     *
     * @param {number} value 거부할 대입 값
     */
    set currentTime(value: number);
    /**
     * 마지막 성공 상대 초을 반환합니다. <br>
     * 소유권 이전 없음.
     *
     * @returns {number} 값/사본
     */
    get currentTime(): number;
    /**
     * 수명/성공 기준을 우회하는 직접 대입을 거부합니다.
     *
     * @param {boolean} value 거부할 대입 값
     */
    set playing(value: boolean);
    /**
     * 현재 재생 의도을 반환합니다. <br>
     * 소유권 이전 없음.
     *
     * @returns {boolean} 값/사본
     */
    get playing(): boolean;
    /**
     * 수명/성공 기준을 우회하는 직접 대입을 거부합니다.
     *
     * @param {import('../core/sequenceData.js').USequencePlaybackAnchor | null} value 거부할 대입 값
     */
    set anchor(value: USequencePlaybackAnchor | null);
    /**
     * 단조/시퀀스 기준 숫자 사본을 반환합니다. <br>
     * 소유권 이전 없음.
     *
     * @returns {import('../core/sequenceData.js').USequencePlaybackAnchor | null} 값/사본
     */
    get anchor(): USequencePlaybackAnchor | null;
    /**
     * 수명/성공 기준을 우회하는 직접 대입을 거부합니다.
     *
     * @param {number | null} value 거부할 대입 값
     */
    set lastNow(value: number | null);
    /**
     * 마지막 성공 공급 초을 반환합니다. <br>
     * 소유권 이전 없음.
     *
     * @returns {number | null} 값/사본
     */
    get lastNow(): number | null;
    /**
     * 수명/성공 기준을 우회하는 직접 대입을 거부합니다.
     *
     * @param {number | null} value 거부할 대입 값
     */
    set lastApplied(value: number | null);
    /**
     * 마지막 onTime 성공 상대 초을 반환합니다. <br>
     * 소유권 이전 없음.
     *
     * @returns {number | null} 값/사본
     */
    get lastApplied(): number | null;
    /**
     * 수명/성공 기준을 우회하는 직접 대입을 거부합니다.
     *
     * @param {{ active: boolean; subscribing: boolean; hasUnsubscribe: boolean; } | null} value 거부할 대입 값
     */
    set subscription(value: {
        active: boolean;
        subscribing: boolean;
        hasUnsubscribe: boolean;
    } | null);
    /**
     * 해제 함수 없는 자기 구독 진단 사본을 반환합니다. <br>
     * 소유권 이전 없음.
     *
     * @returns {{ active: boolean; subscribing: boolean; hasUnsubscribe: boolean; } | null} 값/사본
     */
    get subscription(): {
        active: boolean;
        subscribing: boolean;
        hasUnsubscribe: boolean;
    } | null;
    /**
     * 수명/성공 기준을 우회하는 직접 대입을 거부합니다.
     *
     * @param {Map<any, import('./sequencePlaybackRuntime.js').USequencePlaybackListener>} value 거부할 대입 값
     */
    set listeners(value: Map<any, USequencePlaybackListener>);
    /**
     * 상태 구독 목록 사본을 반환합니다. <br>
     * 소유권 이전 없음.
     *
     * @returns {Map<object, import('./sequencePlaybackRuntime.js').USequencePlaybackListener>} 값/사본
     */
    get listeners(): Map<object, USequencePlaybackListener>;
    /**
     * 수명/성공 기준을 우회하는 직접 대입을 거부합니다.
     *
     * @param {import('../vo/sequenceDefinitionVos.js').USequencePlaybackStatus} value 거부할 대입 값
     */
    set status(value: USequencePlaybackStatus);
    /**
     * 확정된 실행 상태을 반환합니다. <br>
     * 소유권 이전 없음.
     *
     * @returns {import('../vo/sequenceDefinitionVos.js').USequencePlaybackStatus} 값/사본
     */
    get status(): USequencePlaybackStatus;
    /**
     * 수명/성공 기준을 우회하는 직접 대입을 거부합니다.
     *
     * @param {number} value 거부할 대입 값
     */
    set revision(value: number);
    /**
     * 관측 상태 버전을 반환합니다. <br>
     * 소유권 이전 없음.
     *
     * @returns {number} 값/사본
     */
    get revision(): number;
    /**
     * 수명/성공 기준을 우회하는 직접 대입을 거부합니다.
     *
     * @param {boolean} value 거부할 대입 값
     */
    set working(value: boolean);
    /**
     * 현재 명령/통지 실행 여부을 반환합니다. <br>
     * 소유권 이전 없음.
     *
     * @returns {boolean} 값/사본
     */
    get working(): boolean;
    #private;
}
/**
 * @typedef {function(import('../vo/sequenceDefinitionVos.js').USequencePlaybackSnapshotVo):void} USequencePlaybackListener
 * @typedef {{ timeline: import('../vo/sequenceDefinitionVos.js').USequenceTimelineVoCO | import('../vo/sequenceDefinitionVos.js').USequenceTimelineVo; onTime: function(number):void; } & Partial<{ options: import('../vo/sequenceDefinitionVos.js').USequencePlaybackOptionsVoCO | import('../vo/sequenceDefinitionVos.js').USequencePlaybackOptionsVo; timeSource: import('../core/sequenceData.js').USequenceTimeSourcePort | null; scheduler: import('../core/sequenceData.js').USequenceSchedulerPort | null; reportError: import('../core/sequenceData.js').USequencePlaybackErrorReporter | null; }>} USequencePlaybackExecutorCO
 */
/**
 * 범용 자동 재생에서 사용하며 시퀀스 시각/배속을 계산하거나 빌린 RAF 소유자를 종료하지 않습니다.
 */
declare class USequenceRafScheduler {
    /**
     * USequenceRafScheduler 클래스 생성자입니다. <br>
     * 명시 request/cancel 한 쌍 또는 global RAF를 bind합니다.
     *
     * @param {import('./sequencePlaybackRuntime.js').USequenceRafSchedulerCO} [opt={}] 기본{}, RAF 두 함수 기본null, reportError 기본null
     */
    constructor(opt?: USequenceRafSchedulerCO);
    /** @type {(callback:()=>void)=>unknown} */ _requestAnimationFrame: (callback: () => void) => unknown;
    /** @type {(handle:unknown)=>void} */ _cancelAnimationFrame: (handle: unknown) => void;
    /**
     * @type {import('../core/sequenceData.js').USequencePlaybackErrorReporter | null}
     */ _reportError: USequencePlaybackErrorReporter | null;
    /**
     * @type {Map<object, import('../core/sequenceData.js').USequenceSchedulerCallback>}
     */ _subscriptions: Map<object, USequenceSchedulerCallback>;
    /**
     * @type {import('../core/sequenceData.js').USequenceRafRequest | null}
     */ _request: USequenceRafRequest | null;
    /** @type {number} */ _generation: number;
    /** @type {boolean} */ _disposed: boolean;
    /** @type {boolean} */ _working: boolean;
    /**
     * 자기 구독을 등록하고 첫 수신자일 때만 예약합니다. <br>
     * 취소 실패가 남은 예약 위에 새 구독을 겹치지 않습니다.
     *
     * @param {import('../core/sequenceData.js').USequenceSchedulerCallback} callback 빌린 동기 무인자 수신자
     * @returns {import('../core/sequenceData.js').USequenceSchedulerUnsubscribe} 해제
     */
    subscribe(callback: USequenceSchedulerCallback): USequenceSchedulerUnsubscribe;
    /**
     * 새 구독/늦은 callback을 차단하고 자기 예약 취소를 시도합니다. <br>
     * 실패한 handle은 반복 dispose로 재시도합니다.
     */
    dispose(): void;
    /**
     * 자기 예약/수명 레코드의 직접 대입을 거부합니다.
     *
     * @param {function(function():void):unknown} value 거부할 대입 값
     */
    set requestAnimationFrame(value: (arg0: () => void) => unknown);
    /**
     * 빌린 RAF 예약 함수을 반환하고 소유권은 이전하지 않습니다.
     *
     * @returns {function(function():void):unknown} 값/사본
     */
    get requestAnimationFrame(): (arg0: () => void) => unknown;
    /**
     * 자기 예약/수명 레코드의 직접 대입을 거부합니다.
     *
     * @param {function(unknown):void} value 거부할 대입 값
     */
    set cancelAnimationFrame(value: (arg0: unknown) => void);
    /**
     * 빌린 RAF 취소 함수을 반환하고 소유권은 이전하지 않습니다.
     *
     * @returns {function(unknown):void} 값/사본
     */
    get cancelAnimationFrame(): (arg0: unknown) => void;
    /**
     * 자기 예약/수명 레코드의 직접 대입을 거부합니다.
     *
     * @param {import('../core/sequenceData.js').USequencePlaybackErrorReporter | null} value 거부할 대입 값
     */
    set reportError(value: USequencePlaybackErrorReporter | null);
    /**
     * 빌린 오류 수신 함수을 반환하고 소유권은 이전하지 않습니다.
     *
     * @returns {import('../core/sequenceData.js').USequencePlaybackErrorReporter | null} 값/사본
     */
    get reportError(): USequencePlaybackErrorReporter | null;
    /**
     * 자기 예약/수명 레코드의 직접 대입을 거부합니다.
     *
     * @param {Map<any, import('../core/sequenceData.js').USequenceSchedulerCallback>} value 거부할 대입 값
     */
    set subscriptions(value: Map<any, USequenceSchedulerCallback>);
    /**
     * 자기 구독 목록 사본을 반환하고 소유권은 이전하지 않습니다.
     *
     * @returns {Map<object, import('../core/sequenceData.js').USequenceSchedulerCallback>} 값/사본
     */
    get subscriptions(): Map<object, USequenceSchedulerCallback>;
    /**
     * 자기 예약/수명 레코드의 직접 대입을 거부합니다.
     *
     * @param {{ assigned: boolean; active: boolean; generation: number; } | null} value 거부할 대입 값
     */
    set request(value: {
        assigned: boolean;
        active: boolean;
        generation: number;
    } | null);
    /**
     * native handle 없는 예약 진단 사본을 반환하고 소유권은 이전하지 않습니다.
     *
     * @returns {{ assigned: boolean; active: boolean; generation: number; } | null} 값/사본
     */
    get request(): {
        assigned: boolean;
        active: boolean;
        generation: number;
    } | null;
    /**
     * 자기 예약/수명 레코드의 직접 대입을 거부합니다.
     *
     * @param {number} value 거부할 대입 값
     */
    set generation(value: number);
    /**
     * 자기 예약 세대을 반환하고 소유권은 이전하지 않습니다.
     *
     * @returns {number} 값/사본
     */
    get generation(): number;
    /**
     * 자기 예약/수명 레코드의 직접 대입을 거부합니다.
     *
     * @param {boolean} value 거부할 대입 값
     */
    set disposed(value: boolean);
    /**
     * 종료 상태을 반환하고 소유권은 이전하지 않습니다.
     *
     * @returns {boolean} 값/사본
     */
    get disposed(): boolean;
    /**
     * 자기 예약/수명 레코드의 직접 대입을 거부합니다.
     *
     * @param {boolean} value 거부할 대입 값
     */
    set working(value: boolean);
    /**
     * 통지 실행 상태을 반환하고 소유권은 이전하지 않습니다.
     *
     * @returns {boolean} 값/사본
     */
    get working(): boolean;
    #private;
}
/**
 * @typedef {Partial<{ requestAnimationFrame: null | function(function():void):unknown; cancelAnimationFrame: null | function(unknown):void; reportError: import('../core/sequenceData.js').USequencePlaybackErrorReporter | null; }>} USequenceRafSchedulerCO
 */
/**
 * 자동 재생의 시간 공급 포트에서 사용하며 import/생성 때 reader·Clock·RAF를 실행하지 않습니다.
 */
declare class USequenceMonotonicTimeSource {
    /**
     * USequenceMonotonicTimeSource 클래스 생성자입니다. <br>
     * 빌린 밀리초 함수를 고정하고 미지정일 때만 performance.now를 bind합니다.
     *
     * @param {import('./sequencePlaybackRuntime.js').USequenceMonotonicTimeSourceCO} [opt={}] 기본{}, reader 기본null, null 설정 불가, 소유권 이전/시간 읽기 없음
     */
    constructor(opt?: USequenceMonotonicTimeSourceCO);
    /** @type {()=>number} */ _readMilliseconds: () => number;
    /** @type {number|null} */ _lastSeconds: number | null;
    /** @type {boolean} */ _working: boolean;
    /**
     * reader를 한 번 읽어 초로 변환하고 성공한 단조 샘플만 기록합니다. <br>
     * 동일 값과 임의 원점을 허용합니다.
     *
     * @returns {number} 공급 초
     */
    nowSeconds(): number;
    /**
     * 단조 기준을 우회하는 reader 직접 교체를 거부합니다.
     *
     * @param {function():number} value 거부할 대입 값
     */
    set readMilliseconds(value: () => number);
    /**
     * 고정한 reader 참조를 반환하며 소유권을 이전하지 않습니다.
     *
     * @returns {function():number} 빌린 함수
     */
    get readMilliseconds(): () => number;
    /**
     * 시간 기준의 직접 대입을 거부합니다.
     *
     * @param {number | null} value 거부할 대입 값
     */
    set lastSeconds(value: number | null);
    /**
     * 마지막 성공 공급 초 또는 초기null을 반환합니다.
     *
     * @returns {number | null} 마지막 초
     */
    get lastSeconds(): number | null;
    /**
     * 재진입 상태의 직접 대입을 거부합니다.
     *
     * @param {boolean} value 거부할 대입 값
     */
    set working(value: boolean);
    /**
     * 현재 reader 실행 여부를 반환합니다.
     *
     * @returns {boolean} 실행 상태
     */
    get working(): boolean;
}
type USequencePlaybackListener = (arg0: USequencePlaybackSnapshotVo) => void;
type USequencePlaybackExecutorCO = {
    timeline: USequenceTimelineVoCO | USequenceTimelineVo;
    onTime: (arg0: number) => void;
} & Partial<{
    options: USequencePlaybackOptionsVoCO | USequencePlaybackOptionsVo;
    timeSource: USequenceTimeSourcePort$1 | null;
    scheduler: USequenceSchedulerPort$1 | null;
    reportError: USequencePlaybackErrorReporter | null;
}>;
type USequenceRafSchedulerCO = Partial<{
    requestAnimationFrame: null | ((arg0: () => void) => unknown);
    cancelAnimationFrame: null | ((arg0: unknown) => void);
    reportError: USequencePlaybackErrorReporter | null;
}>;
type USequenceMonotonicTimeSourceCO = {
    readMilliseconds?: (() => number) | null;
};

export { USequenceAdapterCapabilitiesVo, USequenceAssemblyExecutor, USequenceAssetVo, USequenceBookmarkVo, USequenceBoundsExecutor, USequenceChannelCompileExecutor, USequenceChannelVo, USequenceCompiledChannelsVo, USequenceConstructionConfigVo, USequenceConstructionPlanExecutor, USequenceContentVo, USequenceCoordinateVo, USequenceDefinitionValidationExecutor, USequenceDefinitionVo, USequenceDocumentReadResultVo, USequenceDocumentReader, USequenceDocumentVo, USequenceDocumentWriter, USequenceExplodeExecutor, USequenceExplodeLayoutExecutor, USequenceExplodeLayoutVo, USequenceFeatureClaimVo, USequenceFeatureVo, USequenceFrameEvaluationExecutor, USequenceFrameStateVo, USequenceFrameVo, USequenceGeOnDTCoordinateConverter, USequenceGeOnDTTilesAdapter, USequenceGroupClassificationExecutor, USequenceGroupClassificationVo, USequenceGroupEditExecutor, USequenceGroupEditVo, USequenceGroupEditor, USequenceGroupReferenceIssueVo, USequenceGroupStateVo, USequenceGroupVo, USequenceIssueVo, USequenceKeyframeVo, USequenceLegacyConversionExecutor, USequenceLoader, USequenceMeshBindingManager, USequenceMeshBindingVo, USequenceMeshPoseVo, USequenceMeshTransformExecutor, USequenceMeshTransformVo, USequenceMeshVisibilityVo, USequenceMonotonicTimeSource, USequenceMovementBoundsVo, USequenceObjectAssignmentVo, USequenceObjectFocusExecutor, USequenceObjectListConfigVo, USequenceObjectListItemVo, USequenceObjectListPanel, USequenceObjectPropertyVo, USequenceOffsetBoundsVo, USequenceOpacityPanel, USequenceOpacityStateVo, USequencePageHandler, USequencePhaseVo, USequencePlaybackDocumentVo, USequencePlaybackExecutor, USequencePlaybackHandler, USequencePlaybackOptionsVo, USequencePlaybackSnapshotVo, USequencePlaybackStateVo, USequencePlayer, USequencePlayerStateVo, USequencePlayerUiHandler, USequenceProgressionExecutor, USequenceProgressionVo, USequencePropertyFieldVo, USequencePropertyLoader, USequencePropertyPanel, USequencePropertyQueryExecutor, USequencePropertyRuleVo, USequencePropertyStatsVo, USequencePropertyValueVo, USequenceRafScheduler, USequenceReadinessVo, USequenceRuntimeManager, USequenceRuntimeRequestVo, USequenceScheduleEditExecutor, USequenceScheduleEditVo, USequenceScheduleEditor, USequenceSelectionHandler, USequenceSerializer, USequenceSessionManager, USequenceSourceVo, USequenceStateExecutor, USequenceTargetChannelBindingVo, USequenceTargetGeometryVo, USequenceTargetGroupVo, USequenceTargetManifestVo, USequenceTargetStateVo, USequenceTargetVo, USequenceThreeAdapter, USequenceThreeTransformExecutor, USequenceTileLifecycleHandler, USequenceTilesAdapter, USequenceTimeline, USequenceTimelineAdapter, USequenceTimelineVo, USequenceTrackVo, USequenceValidationExecutor, USequenceVo, UTilesPropertySelectionHandler, UTimelineView, readSequenceNowSeconds, resolveGeOnDTMeshTarget, validateLegacySequenceData, validateSequenceAdapterCapabilities, validateSequenceAdapterRequirements, validateSequenceAssetAdapterPort, validateSequenceCoordinatePort, validateSequenceFeaturePort, validateSequenceReadiness, validateSequenceResourceResolverPort, validateSequenceSchedulerPort, validateSequenceTargetGeometry, validateSequenceTargetManifest, validateSequenceTimeSourcePort };
export type { USequenceAbortSignalPort$1 as USequenceAbortSignalPort, USequenceAdapterCapabilitiesVoCO, USequenceAdapterCapabilityName, USequenceAdapterPrepareContext$1 as USequenceAdapterPrepareContext, USequenceApplyPlan, USequenceAssemblyExecutorCO, USequenceAssetAdapterPort$1 as USequenceAssetAdapterPort, USequenceAssetVoCO, USequenceBaseVisibleResolver, USequenceBookmarkVoCO, USequenceBoundsExecutorCO, USequenceChannelCompileOptions, USequenceChannelVoCO, USequenceCompiledChannelsVoCO, USequenceConstructionConfigVoCO, USequenceConstructionPlanExecutorCO, USequenceContentVoCO, USequenceControlledProperty, USequenceCoordinatePort$1 as USequenceCoordinatePort, USequenceCoordinateVoCO, USequenceDefinitionValidationOptions, USequenceDefinitionVoCO, USequenceDocumentChildSchema, USequenceDocumentLoadOptions, USequenceDocumentReadResultVoCO, USequenceDocumentReadSnapshot, USequenceDocumentReaderCO, USequenceDocumentSchema, USequenceDocumentVoCO, USequenceDocumentWriteOptions, USequenceExplodeExecutorCO, USequenceExplodeLayoutVoCO, USequenceFeatureClaimVoCO, USequenceFeatureDefinitionValidator, USequenceFeatureFactory, USequenceFeatureFramePlan, USequenceFeaturePort, USequenceFeaturePrepareContext, USequenceFeatureVoCO, USequenceFrameEvaluationExecutorCO, USequenceFramePortInput, USequenceFrameStateVoCO, USequenceFrameVoCO, USequenceGeOnDTAppPort, USequenceGeOnDTBinding, USequenceGeOnDTBounds, USequenceGeOnDTCoordinateConverterCO, USequenceGeOnDTCoordinatePort, USequenceGeOnDTEvent, USequenceGeOnDTFragmentPort, USequenceGeOnDTHook, USequenceGeOnDTLayerPort, USequenceGeOnDTListener, USequenceGeOnDTMathPort, USequenceGeOnDTPlan, USequenceGeOnDTResolver, USequenceGeOnDTSession, USequenceGeOnDTSessionInfo, USequenceGeOnDTTilesAdapterCO, USequenceGroupApplyCallback, USequenceGroupAssignmentEntry, USequenceGroupClassificationExecutorCO, USequenceGroupClassificationOptions, USequenceGroupClassificationPlan, USequenceGroupClassificationVoCO, USequenceGroupEditExecutorCO, USequenceGroupEditVoCO, USequenceGroupEditorCO, USequenceGroupReferenceIssueVoCO, USequenceGroupRulePlan, USequenceGroupStateVoCO, USequenceGroupVoCO, USequenceIssueVoCO, USequenceKeyframeVoCO, USequenceLegacyConversionOptions, USequenceLoaderCO, USequenceMeshBindingManagerCO, USequenceMeshBindingVoCO, USequenceMeshPoseVoCO, USequenceMeshTransformExecutorCO, USequenceMeshTransformVoCO, USequenceMeshVisibilityVoCO, USequenceMovementBoundsVoCO, USequenceObjectAssignmentVoCO, USequenceObjectFocusExecutorCO, USequenceObjectListConfigVoCO, USequenceObjectListItemVoCO, USequenceObjectListPanelCO, USequenceObjectPropertyVoCO, USequenceOffsetBoundsVoCO, USequenceOpacityPanelCO, USequenceOpacityStateVoCO, USequencePageHandlerCO, USequenceParseOptions, USequencePhaseVoCO, USequencePlaybackDocumentVoCO, USequencePlaybackErrorCallback, USequencePlaybackHandlerCO, USequencePlaybackListener$1 as USequencePlaybackListener, USequencePlaybackMode, USequencePlaybackOptionsVoCO, USequencePlaybackSnapshotVoCO, USequencePlaybackStateVoCO, USequencePlaybackStatus, USequencePlayerCO, USequencePlayerPhase, USequencePlayerStateVoCO, USequencePlayerUiHandlerCO, USequencePortAsset, USequencePortCapabilities, USequencePortCoordinate, USequencePortDefinition, USequencePortFeature, USequencePortGeometry, USequencePortManifest, USequencePortReadiness, USequencePortTarget, USequencePortUnsubscribe, USequenceProgressionVoCO, USequencePropertyFieldOptions, USequencePropertyFieldVoCO, USequencePropertyIndexEntry, USequencePropertyLoadOptions, USequencePropertyLoaderCO, USequencePropertyPanelCO, USequencePropertyQueryExecutorCO, USequencePropertyRuleVoCO, USequencePropertyScopeOptions, USequencePropertyStatsVoCO, USequencePropertyValueVoCO, USequenceReadinessPolicy, USequenceReadinessVoCO, USequenceRenderPort, USequenceResolvedAssetHandle, USequenceResourceResolverPort$1 as USequenceResourceResolverPort, USequenceRuntimeManagerCO, USequenceRuntimeRequestVoCO, USequenceScheduleApplyCallback, USequenceScheduleEditExecutorCO, USequenceScheduleEditVoCO, USequenceScheduleEditorCO, USequenceScheduleRemovePhaseOptions, USequenceScheduleReplacement, USequenceSelectionCallback, USequenceSelectionHandlerCO, USequenceSelectorPort, USequenceSerializeOptions, USequenceSerializerCO, USequenceSessionAppPort, USequenceSessionListener, USequenceSessionManagerCO, USequenceSessionResources, USequenceSourceVoCO, USequenceStateExecutorCO, USequenceTargetChangeListener, USequenceTargetChannelBindingVoCO, USequenceTargetGeometryVoCO, USequenceTargetGroupVoCO, USequenceTargetManifestVoCO, USequenceTargetStatePortInput, USequenceTargetStateVoCO, USequenceTargetVoCO, USequenceThreeAdapterCO, USequenceThreeSessionInfo, USequenceTileLifecycleErrorCallback, USequenceTileLifecycleHandlerCO, USequenceTilesAdapterCO, USequenceTilesPort, USequenceTimelineAdapterCO, USequenceTimelineCO, USequenceTimelineHandlerPort, USequenceTimelineNativeState, USequenceTimelineSubscription, USequenceTimelineVoCO, USequenceTrackVoCO, USequenceUiApplyOptions, USequenceUiComponent, USequenceUiControls, USequenceUiDocumentPort, USequenceUiPlayerPort, USequenceUiTextOptions, USequenceUiTimeline, USequenceValidationTrackEntry, USequenceVoCO, USequenceWorldMathPort, UTilesPropertySelectionHandlerCO };

export type { USequenceAssetAdapterFactory };
export type { USequenceClock };
export type { USequenceConstructionSequence };
export type { USequenceDocumentFetcher };
export type { USequenceDocumentFetchRequest };
export type { USequenceDocumentFile };
export type { USequenceDocumentReadOptions };
export type { USequenceDocumentRequest };
export type { USequenceDocumentResponse };
export type { USequenceDocumentValidationOptions };
export type { USequenceEvaluationInterpolation };
export type { USequenceEvaluationValue };
export type { USequenceJsonObject };
export type { USequenceLegacyValidator };
export type { USequenceMonotonicTimeSourceCO };
export type { USequencePlaybackAnchor };
export type { USequencePlaybackErrorReporter };
export type { USequencePlaybackExecutorCO };
export type { USequencePlaybackSubscription };
export type { USequencePlayerEventType };
export type { USequencePlayerListener };
export type { USequencePropertyJsonRecord };
export type { USequencePropertyJsonValue };
export type { USequenceRafRequest };
export type { USequenceRafSchedulerCO };
export type { USequenceRuntimeLoadOptions };
export type { USequenceRuntimeTimerPort };
export type { USequenceSchedulerCallback };
export type { USequenceSchedulerPort };
export type { USequenceSchedulerUnsubscribe };
export type { USequenceThreeBinding };
export type { USequenceThreeBounds };
export type { USequenceThreeCapture };
export type { USequenceThreeCoordinate };
export type { USequenceThreeObject };
export type { USequenceThreePlan };
export type { USequenceThreePose };
export type { USequenceThreeResolver };
export type { USequenceThreeSession };
export type { USequenceThreeStamp };
export type { USequenceThreeTarget };
export type { USequenceThreeWrite };
export type { USequenceTimelinePlayerPort };
export type { USequenceTimeSourcePort };
export type { USequenceUiCleanup };
export type { USequenceUiConfig };
export type { USequenceUiOperation };
export type { USequenceUiProperty };
export type {UTimelineAxisVo, UTimelineCapabilitiesVo, UTimelineStateVo} from "../../types/extensions/BSwjxfuO.js";
export type * from "../../types/extensions/BSwjxfuO.js";
export type * from "../../types/extensions/Cz-zFqUa.js";
