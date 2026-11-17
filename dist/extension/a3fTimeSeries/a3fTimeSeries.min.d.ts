import { UA3FHeightPolicyVo, UA3FFieldVo, UA3FVectorFieldVo, UA3FFlowOptionsVo, UA3FParticleFlowOptionsVo, UA3FTimelineOptionsVo, UA3FSpatialOptionsVo, UA3FCacheBudgetOptionsVo, UA3FTimelineStateVo, UA3FTaskManager, UA3FNodeVo, UA3FSpatialViewVo, UA3FMetadataVo, UA3FMetadataLoader, UA3FSpatialSelectionVo, UA3FFrameVo, UA3FFrameCacheOptionsVo, UA3FHeightDisplayVo, UA3FCacheBudgetStatusVo } from '../../types/extensions/DTddTPud.js';
import { Object3D, Box3, WebGLRenderer, Vector3Like } from "../../types/three/build/three.module.js";
import { U3dModelLayer, U3dApp, U3dLayer, UCamera } from "../../GeOnDT.modules.js";
import { UTimelineStateVo } from '../../types/extensions/BSwjxfuO.js';
import { UTimelineView } from '../../types/extensions/Cz-zFqUa.js';

/**
 * @typedef {object} UA3FSessionOptions
 * @property {string | null} [heightPolicyId=null] 높이 정책 ID, null이면 문서 기본 정책
 * @property {UA3FTimelineOptionsVoCO} [timelineOptionsVo] 일반 객체 또는 기존 재생 설정 VO
 * @property {UA3FSpatialOptionsVoCO} [spatialOptionsVo] 일반 객체 또는 기존 공간 설정 VO
 * @property {UA3FCacheBudgetOptionsVoCO} [cacheBudgetOptionsVo] 일반 객체 또는 기존 예산 설정 VO
 * @property {boolean} [autoTick=true] 세션의 RAF 시간 자동 구동 여부
 * @property {boolean} [pauseWhenHidden=true] 페이지가 숨겨지면 일시정지할지 여부
 */
/**
 * A3F 확장 세션의 높이·재생·공간·예산·시간 구동 정책을 보관합니다.
 */
declare class UA3FSessionOptionsVo {
    /**
     * UA3FSessionOptionsVo 클래스 생성자입니다. <br>
     * 일반 객체 또는 동일 VO의 설정을 중첩 VO와 함께 복사합니다.
     *
     * @param {import('./UA3FSessionVos.js').UA3FSessionOptions | import('./UA3FSessionVos.js').UA3FSessionOptionsVo} [opt={}] 설정 원본
     */
    constructor(opt?: UA3FSessionOptions | UA3FSessionOptionsVo);
    /** @type {string | null} */ _heightPolicyId: string | null;
    /**
     * @type {import('../backend/vo/UA3FPlaybackVos.js').UA3FTimelineOptionsVo}
     */ _timelineOptionsVo: UA3FTimelineOptionsVo;
    /**
     * @type {import('../backend/vo/UA3FSceneVos.js').UA3FSpatialOptionsVo}
     */ _spatialOptionsVo: UA3FSpatialOptionsVo;
    /**
     * @type {import('../backend/vo/UA3FPlaybackVos.js').UA3FCacheBudgetOptionsVo}
     */ _cacheBudgetOptionsVo: UA3FCacheBudgetOptionsVo;
    /** @type {boolean} */ _autoTick: boolean;
    /** @type {boolean} */ _pauseWhenHidden: boolean;
    /**
     * 높이 정책 ID를 보관합니다. <br>
     * 정책의 존재 여부는 자료 연결 시 검사합니다.
     *
     * @param {string | null} value 비어 있지 않은 정책 ID 또는 문서 기본값을 뜻하는 null
     */
    set heightPolicyId(value: string | null);
    /**
     * 높이 정책 ID 또는 문서 기본 정책을 뜻하는 null을 반환합니다.
     *
     * @returns {string | null} 높이 정책 ID 또는 문서 기본 정책을 뜻하는 null
     */
    get heightPolicyId(): string | null;
    /**
     * 재생 설정 VO를 보관합니다. <br>
     * 실행 중 세션을 변경하지 않습니다.
     *
     * @param {import('../backend/vo/UA3FPlaybackVos.js').UA3FTimelineOptionsVo} value 재생 설정, VO 참조 보관
     */
    set timelineOptionsVo(value: UA3FTimelineOptionsVo);
    /**
     * 이 VO가 보관한 재생·캐시 설정을 반환합니다.
     *
     * @returns {import('../backend/vo/UA3FPlaybackVos.js').UA3FTimelineOptionsVo} 이 VO가 보관한 재생·캐시 설정
     */
    get timelineOptionsVo(): UA3FTimelineOptionsVo;
    /**
     * 공간 선택 설정 VO를 보관합니다. <br>
     * 공간 선택을 실행하지 않습니다.
     *
     * @param {import('../backend/vo/UA3FSceneVos.js').UA3FSpatialOptionsVo} value 공간 설정, VO 참조 보관
     */
    set spatialOptionsVo(value: UA3FSpatialOptionsVo);
    /**
     * 이 VO가 보관한 공간 선택 설정을 반환합니다.
     *
     * @returns {import('../backend/vo/UA3FSceneVos.js').UA3FSpatialOptionsVo} 이 VO가 보관한 공간 선택 설정
     */
    get spatialOptionsVo(): UA3FSpatialOptionsVo;
    /**
     * 원시 프레임 합산 예산 설정 VO를 보관합니다.
     *
     * @param {import('../backend/vo/UA3FPlaybackVos.js').UA3FCacheBudgetOptionsVo} value 예산 설정, 한도는 양의 정수 바이트 또는 null, VO 참조 보관
     */
    set cacheBudgetOptionsVo(value: UA3FCacheBudgetOptionsVo);
    /**
     * 이 VO가 보관한 원시 프레임 합산 예산 설정을 반환합니다.
     *
     * @returns {import('../backend/vo/UA3FPlaybackVos.js').UA3FCacheBudgetOptionsVo} 이 VO가 보관한 원시 프레임 합산 예산 설정
     */
    get cacheBudgetOptionsVo(): UA3FCacheBudgetOptionsVo;
    /**
     * 시간 자동 구동 정책을 보관합니다. <br>
     * 실제 시계는 세션이 관리합니다.
     *
     * @param {boolean} value 시간 자동 구동 여부
     */
    set autoTick(value: boolean);
    /**
     * 세션이 재생 중 RAF 경과 시간을 자동 전달하는지 반환합니다.
     *
     * @returns {boolean} 세션이 재생 중 RAF 경과 시간을 자동 전달하는지 반환합니다.
     */
    get autoTick(): boolean;
    /**
     * 페이지 숨김 시 일시정지 정책을 보관합니다. <br>
     * DOM 이벤트는 세션이 처리합니다.
     *
     * @param {boolean} value 페이지 숨김 일시정지 여부
     */
    set pauseWhenHidden(value: boolean);
    /**
     * 페이지 숨김 시 일시정지하는 정책인지 반환합니다.
     *
     * @returns {boolean} 페이지 숨김 시 일시정지하는 정책인지 반환합니다.
     */
    get pauseWhenHidden(): boolean;
}
/**
 * @typedef {'idle' | 'loading' | 'ready' | 'paused' | 'playing' | 'buffering' | 'configuring' | 'error' | 'ended' | 'disposed'} UA3FSessionStatus
 * @typedef {object} UA3FSessionState
 * @property {UA3FSessionStatus} [status='idle'] 세션 주요 상태
 * @property {string | null} [metadataUrl=null] 연결한 절대 문서 URL
 * @property {string | null} [datasetId=null] 데이터셋 ID
 * @property {import('../backend/vo/UA3FPlaybackVos.js').UA3FTimelineStateVo | null} [timelineStateVo=null] 준비 후 재생 상태
 * @property {Array<string>} [warnings] 독립 경고 문자열 목록
 * @property {Error | null} [error=null] 원래 오류 참조
 * @property {number | null} [requestedFramePosition=null] 요청한 프레임의 0 기반 목록 위치
 * @property {number | null} [displayedFramePosition=null] 표시한 프레임의 0 기반 목록 위치
 * @property {UA3FFlowConfigurationVo | null} [flowConfigurationVo=null] 실제 적용 흐름 정책, 미준비·종료 시 null
 * @property {UA3FFlowStatusVo} [flowStatusVo] 실제 흐름 상태 사본
 * @property {UA3FDisplayOptionsVo | null} [displayOptionsVo=null] 실제 적용 표시 정책, 미준비·종료 시 null
 * @property {UA3FColorOptionsVo | null} [colorOptionsVo=null] 범용 API로 적용한 색상 설정, 미적용·종료 시 null
 */
/**
 * A3F 세션의 연결 정보와 재생 상태를 외부 UI에 전달합니다.
 */
declare class UA3FSessionStateVo {
    /**
     * UA3FSessionStateVo 클래스 생성자입니다. <br>
     * 외부 UI가 수정해도 세션과 다른 구독자에 영향을 주지 않는 상태 사본을 만듭니다.
     *
     * @param {import('./UA3FSessionVos.js').UA3FSessionState | import('./UA3FSessionVos.js').UA3FSessionStateVo} [opt={}] 상태 원본, 오류 참조 외 입력 복사
     */
    constructor(opt?: UA3FSessionState | UA3FSessionStateVo);
    /** @type {UA3FSessionStatus} */ _status: UA3FSessionStatus;
    /** @type {string | null} */ _metadataUrl: string | null;
    /** @type {string | null} */ _datasetId: string | null;
    /**
     * @type {import('../backend/vo/UA3FPlaybackVos.js').UA3FTimelineStateVo | null}
     */ _timelineStateVo: UA3FTimelineStateVo | null;
    /** @type {Array<string>} */ _warnings: Array<string>;
    /** @type {Error | null} */ _error: Error | null;
    /** @type {number | null} */ _requestedFramePosition: number | null;
    /** @type {number | null} */ _displayedFramePosition: number | null;
    /** @type {UA3FColorOptionsVo | null} */ _colorOptionsVo: UA3FColorOptionsVo | null;
    /** @type {UA3FDisplayOptionsVo | null} */ _displayOptionsVo: UA3FDisplayOptionsVo | null;
    /** @type {UA3FFlowConfigurationVo | null} */ _flowConfigurationVo: UA3FFlowConfigurationVo | null;
    /** @type {UA3FFlowStatusVo} */ _flowStatusVo: UA3FFlowStatusVo;
    /**
     * 전달 상태의 주요 상태값을 보관합니다.
     *
     * @param {import('./UA3FSessionVos.js').UA3FSessionStatus} value 상태값
     */
    set status(value: UA3FSessionStatus);
    /**
     * 세션의 연결·재생·종료 상태를 반환합니다.
     *
     * @returns {import('./UA3FSessionVos.js').UA3FSessionStatus} 세션의 연결·재생·종료 상태
     */
    get status(): UA3FSessionStatus;
    /**
     * 전달 상태의 메타정보 URL을 보관합니다.
     *
     * @param {string | null} value 자료 주소, 절대 HTTP(S) URL 또는 미연결을 뜻하는 null
     */
    set metadataUrl(value: string | null);
    /**
     * 현재 자료의 절대 메타정보 URL 또는 null을 반환합니다.
     *
     * @returns {string | null} 현재 자료의 절대 메타정보 URL 또는 null
     */
    get metadataUrl(): string | null;
    /**
     * 전달 상태의 데이터셋 식별자를 보관합니다.
     *
     * @param {string | null} value 자료 식별자, 문서가 제공한 식별자 또는 미확정을 뜻하는 null
     */
    set datasetId(value: string | null);
    /**
     * 읽은 데이터셋 식별자 또는 null을 반환합니다.
     *
     * @returns {string | null} 읽은 데이터셋 식별자 또는 null
     */
    get datasetId(): string | null;
    /**
     * 전달 상태에 재생 상태 VO를 보관합니다.
     *
     * @param {import('../backend/vo/UA3FPlaybackVos.js').UA3FTimelineStateVo | null} value 준비한 재생 상태 또는 미준비 null, GPU·워커 소유권 없음
     */
    set timelineStateVo(value: UA3FTimelineStateVo | null);
    /**
     * 프레임·원본 시간·캐시를 담은 재생 상태 사본 또는 null을 반환합니다.
     *
     * @returns {import('../backend/vo/UA3FPlaybackVos.js').UA3FTimelineStateVo | null} 프레임·원본 시간·캐시를 담은 재생 상태 사본 또는 null
     */
    get timelineStateVo(): UA3FTimelineStateVo | null;
    /**
     * 전달 상태의 경고 목록을 보관합니다.
     *
     * @param {Array<string>} value 경고 목록, 경고 문자열 배열 참조를 보관하며 실행 중 세션에는 영향 없음
     */
    set warnings(value: Array<string>);
    /**
     * 이 상태 사본의 경고 목록을 반환합니다.
     *
     * @returns {Array<string>} 이 상태 사본의 경고 목록
     */
    get warnings(): Array<string>;
    /**
     * 전달 상태의 오류 참조를 보관합니다.
     *
     * @param {Error | null} value 원인 오류 또는 오류 없음의 null, 오류 객체 변경 없음
     */
    set error(value: Error | null);
    /**
     * 현재 오류의 원래 참조 또는 오류 없음의 null을 반환합니다.
     *
     * @returns {Error | null} 현재 오류의 원래 참조 또는 오류 없음의 null
     */
    get error(): Error | null;
    /**
     * 전달 상태의 요청 목록 위치를 보관합니다. <br>
     * 프레임 ID나 원본 시간을 뜻하지 않습니다.
     *
     * @param {number | null} value 요청 목록 위치, 0..frameCount-1의 정수 또는 미준비 null
     */
    set requestedFramePosition(value: number | null);
    /**
     * 요청한 프레임의 0 기반 목록 위치 또는 미준비 null을 반환합니다.
     *
     * @returns {number | null} 요청한 프레임의 0 기반 목록 위치 또는 미준비 null
     */
    get requestedFramePosition(): number | null;
    /**
     * 전달 상태의 실제 표시 목록 위치를 보관합니다.
     *
     * @param {number | null} value 표시 목록 위치, 0..frameCount-1의 정수 또는 미표시 null
     */
    set displayedFramePosition(value: number | null);
    /**
     * 실제 표시 프레임의 0 기반 목록 위치 또는 미표시 null을 반환합니다.
     *
     * @returns {number | null} 실제 표시 프레임의 0 기반 목록 위치 또는 미표시 null
     */
    get displayedFramePosition(): number | null;
    /**
     * 전달 상태에 색상 설정 VO를 보관합니다. <br>
     * 실제 재질은 변경하지 않습니다.
     *
     * @param {import('./UA3FSessionVos.js').UA3FColorOptionsVo | null} value 색상 상태, 범위 확정된 색상 설정 또는 범용 설정 없음의 null
     */
    set colorOptionsVo(value: UA3FColorOptionsVo | null);
    /**
     * 범용 API로 적용한 색상 설정 사본 또는 미적용·종료 상태의 null을 반환합니다.
     *
     * @returns {import('./UA3FSessionVos.js').UA3FColorOptionsVo | null} 범용 API로 적용한 색상 설정 사본 또는 미적용·종료 상태의 null
     */
    get colorOptionsVo(): UA3FColorOptionsVo | null;
    /**
     * 표시 정책 사본을 보관합니다. <br>
     * 렌더링·파일 접근은 수행하지 않습니다.
     *
     * @param {import('./UA3FSessionVos.js').UA3FDisplayOptionsVo | null} value 표시 상태, 참조 보관
     */
    set displayOptionsVo(value: UA3FDisplayOptionsVo | null);
    /**
     * 실제 적용 표시 정책의 상태 사본 또는 미준비·종료의 null을 반환합니다.
     *
     * @returns {import('./UA3FSessionVos.js').UA3FDisplayOptionsVo | null} 실제 적용 표시 정책의 상태 사본 또는 미준비·종료의 null
     */
    get displayOptionsVo(): UA3FDisplayOptionsVo | null;
    /**
     * 외부 전달용 흐름 정책을 보관합니다.
     *
     * @param {import('./UA3FSessionVos.js').UA3FFlowConfigurationVo | null} value 흐름 정책, 전달 상태 사본, 참조 보관
     */
    set flowConfigurationVo(value: UA3FFlowConfigurationVo | null);
    /**
     * 독립 흐름 적용 정책 또는 미준비·종료의 null을 반환합니다.
     *
     * @returns {import('./UA3FSessionVos.js').UA3FFlowConfigurationVo | null} 독립 흐름 적용 정책 또는 미준비·종료의 null
     */
    get flowConfigurationVo(): UA3FFlowConfigurationVo | null;
    /**
     * 준비·입자·예산·오류의 작은 상태를 보관합니다.
     *
     * @param {import('./UA3FSessionVos.js').UA3FFlowStatusVo} value 흐름 상태, 참조 보관
     */
    set flowStatusVo(value: UA3FFlowStatusVo);
    /**
     * 실제 흐름 관측 상태 사본을 반환합니다.
     *
     * @returns {import('./UA3FSessionVos.js').UA3FFlowStatusVo} 실제 흐름 관측 상태 사본
     */
    get flowStatusVo(): UA3FFlowStatusVo;
}
/**
 * @typedef {object} UA3FDatasetInfo
 * @property {string | null} [metadataUrl=null] 실제 응답 문서 URL
 * @property {string | null} [datasetId=null] 데이터셋 ID
 * @property {Array<number> | null} [boundsXY=null] 월드 좌표(EPSG:3857)의 minX·minY·maxX·maxY
 * @property {number} [frameCount=0] 루트 문서의 등록 프레임 수
 * @property {string | null} [timeUnit=null] 문서가 명시한 원본 시간 단위
 * @property {string | null} [timeKind=null] 문서가 명시한 시간 표현
 * @property {string | null} [defaultHeightPolicyId=null] 기본 높이 정책 ID
 * @property {Array<import('../backend/vo/UA3FSceneVos.js').UA3FHeightPolicyVo>} [heightPolicies] 높이 정책 값 사본 목록
 */
/**
 * 메타정보의 주소·식별자·공간 경계·시간·높이 정책을 외부 화면용 값으로 보관합니다.
 */
declare class UA3FDatasetInfoVo {
    /**
     * UA3FDatasetInfoVo 클래스 생성자입니다. <br>
     * 일반 객체 또는 같은 VO에서 배열·중첩 높이 정책까지 독립 복사합니다.
     *
     * @param {import('./UA3FSessionVos.js').UA3FDatasetInfo | import('./UA3FSessionVos.js').UA3FDatasetInfoVo} [opt={}] 자료 요약
     */
    constructor(opt?: UA3FDatasetInfo | UA3FDatasetInfoVo);
    /** @type {string | null} */ _metadataUrl: string | null;
    /** @type {string | null} */ _datasetId: string | null;
    /** @type {Array<number> | null} */ _boundsXY: Array<number> | null;
    /** @type {number} */ _frameCount: number;
    /** @type {string | null} */ _timeUnit: string | null;
    /** @type {string | null} */ _timeKind: string | null;
    /** @type {string | null} */ _defaultHeightPolicyId: string | null;
    /**
     * @type {Array<import('../backend/vo/UA3FSceneVos.js').UA3FHeightPolicyVo>}
     */ _heightPolicies: Array<UA3FHeightPolicyVo>;
    /**
     * 요약의 문서 주소 값을 보관합니다. <br>
     * URL 요청은 수행하지 않습니다.
     *
     * @param {string | null} value 비어 있지 않은 문서 주소 또는 미준비 null
     */
    set metadataUrl(value: string | null);
    /**
     * 리다이렉트가 반영된 문서 주소 또는 미준비 null을 반환합니다.
     *
     * @returns {string | null} 리다이렉트가 반영된 문서 주소 또는 미준비 null
     */
    get metadataUrl(): string | null;
    /**
     * 자료 식별자 값을 보관합니다.
     *
     * @param {string | null} value 비어 있지 않은 데이터셋 ID 또는 미준비 null
     */
    set datasetId(value: string | null);
    /**
     * 데이터셋 식별자 또는 미준비 null을 반환합니다.
     *
     * @returns {string | null} 데이터셋 식별자 또는 미준비 null
     */
    get datasetId(): string | null;
    /**
     * 유한하고 역전되지 않은 공간 경계를 독립 복사합니다.
     *
     * @param {Array<number> | null} value 월드 좌표(EPSG:3857) 단위, 0..3 순서 minX·minY·maxX·maxY, 같은 경계 허용, null은 미준비
     */
    set boundsXY(value: Array<number> | null);
    /**
     * 월드 좌표(EPSG:3857)로 표현한 공간 경계의 사본을 반환합니다.
     *
     * @returns {Array<number> | null} 독립 경계 사본 또는 아직 준비되지 않은 null
     */
    get boundsXY(): Array<number> | null;
    /**
     * 루트 문서의 등록 프레임 수를 보관합니다.
     *
     * @param {number} value 0 이상 안전 정수인 프레임 개수, 기본 0, 인덱스가 아닌 개수
     */
    set frameCount(value: number);
    /**
     * 루트 문서의 등록 프레임 수를 반환합니다. <br>
     * 하위 문서 합계를 추정하지 않습니다.
     *
     * @returns {number} 루트 문서의 등록 프레임 수
     */
    get frameCount(): number;
    /**
     * 원본 시간 단위를 변환 없이 보관합니다.
     *
     * @param {string | null} value 비어 있지 않은 단위 문자열 또는 미확정 null, 초 단위로 추정·환산하지 않음
     */
    set timeUnit(value: string | null);
    /**
     * 문서의 원본 시간 단위 또는 미확정 null을 반환합니다.
     *
     * @returns {string | null} 문서의 원본 시간 단위 또는 미확정 null
     */
    get timeUnit(): string | null;
    /**
     * 시간 표현 방식을 추정하지 않고 보관합니다.
     *
     * @param {string | null} value 문서의 비어 있지 않은 표현 문자열 또는 미확정 null
     */
    set timeKind(value: string | null);
    /**
     * 문서가 명시한 시간 표현 또는 미확정 null을 반환합니다.
     *
     * @returns {string | null} 문서가 명시한 시간 표현 또는 미확정 null
     */
    get timeKind(): string | null;
    /**
     * 기본 높이 정책 식별자 값을 보관합니다. <br>
     * 정책을 실행하지 않습니다.
     *
     * @param {string | null} value 비어 있지 않은 정책 ID 또는 미지정 null, 이름에 따른 정책 추정 없음
     */
    set defaultHeightPolicyId(value: string | null);
    /**
     * 문서의 기본 높이 정책 ID 또는 미지정 null을 반환합니다.
     *
     * @returns {string | null} 문서의 기본 높이 정책 ID 또는 미지정 null
     */
    get defaultHeightPolicyId(): string | null;
    /**
     * 높이 정책과 내부 배열을 복사하고 중복 ID를 거부합니다.
     *
     * @param {Array<import('../backend/vo/UA3FSceneVos.js').UA3FHeightPolicyVo>} value 빈 목록 허용, 정책·필드·0 기반 성분 목록까지 복사하며 원본 변경 없음
     */
    set heightPolicies(value: Array<UA3FHeightPolicyVo>);
    /**
     * 정책별 필드·성분 배열까지 복사한 독립 높이 정책 목록을 반환합니다.
     *
     * @returns {Array<import('../backend/vo/UA3FSceneVos.js').UA3FHeightPolicyVo>} 정책별 필드·성분 배열까지 복사한 독립 높이 정책 목록
     */
    get heightPolicies(): Array<UA3FHeightPolicyVo>;
}
/**
 * @typedef {object} UA3FColorOptions
 * @property {string | null} [fieldId=null] 색상 필드 ID, null이면 필드 색상 해제
 * @property {number} [component=0] 0 기반 성분 번호
 * @property {[number, number] | null} [range=null] 고정 범위, null이면 루트 문서 필드의 전체 통계 사용
 * @property {Array<string> | null} [palette=null] 낮음→높음 순서 #RRGGBB 5개 또는 기본 그라데이션
 */
/**
 * 범용 면 색상의 필드·성분·범위·팔레트 설정을 보관합니다.
 */
declare class UA3FColorOptionsVo {
    /**
     * UA3FColorOptionsVo 클래스 생성자입니다. <br>
     * 설정의 작은 값과 배열을 복사합니다.
     *
     * @param {import('./UA3FSessionVos.js').UA3FColorOptions | import('./UA3FSessionVos.js').UA3FColorOptionsVo} [opt={}] 색상 설정 원본, 배열 복사
     */
    constructor(opt?: UA3FColorOptions | UA3FColorOptionsVo);
    /** @type {string | null} */ _fieldId: string | null;
    /** @type {number} */ _component: number;
    /** @type {[number, number] | null} */ _range: [number, number] | null;
    /** @type {Array<string> | null} */ _palette: Array<string> | null;
    /**
     * 선택 필드 ID를 보관합니다. <br>
     * 자료 조회나 표시 변경은 수행하지 않습니다.
     *
     * @param {string | null} value 선택 필드, 비어 있지 않은 메타정보 필드 ID 또는 색상 해제 null
     */
    set fieldId(value: string | null);
    /**
     * 선택 필드 ID 또는 색상 해제의 null을 반환합니다.
     *
     * @returns {string | null} 선택 필드 ID 또는 색상 해제의 null
     */
    get fieldId(): string | null;
    /**
     * 선택 성분 번호를 보관합니다. <br>
     * 범위는 실행 시 필드 정의로 검사합니다.
     *
     * @param {number} value 성분 번호, 0 기반 안전 정수, 실제 성분 수 미만
     */
    set component(value: number);
    /**
     * 선택 성분의 0 기반 번호를 반환합니다.
     *
     * @returns {number} 선택 성분의 0 기반 번호
     */
    get component(): number;
    /**
     * 선택 필드와 같은 단위의 범위 배열을 보관합니다.
     *
     * @param {[ number, number ] | null} value 색상 범위, 유한한 [최소, 최소 ≤ 최대(동일값 허용), null이면 전체 통계 사용, 배열 참조 보관
     */
    set range(value: [number, number] | null);
    /**
     * 고정 색상 범위 또는 통계 사용을 뜻하는 null을 반환합니다.
     *
     * @returns {[ number, number ] | null} 고정 색상 범위 또는 통계 사용을 뜻하는 null
     */
    get range(): [number, number] | null;
    /**
     * 등간격 팔레트 배열을 보관합니다. <br>
     * GPU uniform은 생성하지 않습니다.
     *
     * @param {Array<string> | null} value 색상 목록, #RRGGBB 5개 또는 기본 그라데이션 null, 배열 참조 보관
     */
    set palette(value: Array<string> | null);
    /**
     * 낮음→높음 순서의 팔레트 또는 기본 그라데이션의 null을 반환합니다.
     *
     * @returns {Array<string> | null} 낮음→높음 순서의 팔레트 또는 기본 그라데이션의 null
     */
    get palette(): Array<string> | null;
}
/**
 * @typedef {object} UA3FDisplayOptions
 * @property {number | null} [displayZOffset] m 단위 표시 높이 보정; null이면 노드별 문서 기본값
 * @property {string | null} [maskFieldId] 마스크 정점 스칼라 필드 ID 또는 미선택 null
 * @property {boolean} [maskEnabled] 선택 필드의 임계값 이하 부분 숨김 여부
 * @property {number} [maskThreshold] 선택 필드 단위의 Float32 유한 임계값; 음수 허용
 * @property {number} [maskFeather] 선택 필드 단위의 0 이상 Float32 경계 전이 폭; 화면상 최소 전이도 적용
 * @property {number} [depthBias] 정규화 깊이 보정; 0..64/2^24, 양수는 카메라 방향
 * @property {boolean} [wireframe=false] 분석 메쉬를 삼각형 와이어프레임으로 표시할지 여부
 * @property {import('./UA3FSessionVos.js').UA3FWaterOptions | UA3FWaterOptionsVo} [waterOptionsVo] 수면 설정; null 불가, 생성 시 독립 사본
 */
/**
 * 높이·마스크·깊이 보정·와이어프레임·수면 설정을 작은 값과 중첩 VO 사본으로 보관합니다.
 */
declare class UA3FDisplayOptionsVo {
    /**
     * UA3FDisplayOptionsVo 클래스 생성자입니다. <br>
     * 일반 객체 또는 동일 VO를 복사합니다.
     *
     * @param {import('./UA3FSessionVos.js').UA3FDisplayOptions | import('./UA3FSessionVos.js').UA3FDisplayOptionsVo} [opt={}] 설정 원본
     */
    constructor(opt?: UA3FDisplayOptions$1 | UA3FDisplayOptionsVo);
    /** @type {number | null} */ _displayZOffset: number | null;
    /** @type {string | null} */ _maskFieldId: string | null;
    /** @type {boolean} */ _maskEnabled: boolean;
    /** @type {number} */ _maskThreshold: number;
    /** @type {number} */ _maskFeather: number;
    /** @type {number} */ _depthBias: number;
    /** @type {boolean} */ _wireframe: boolean;
    /** @type {UA3FWaterOptionsVo} */ _waterOptionsVo: UA3FWaterOptionsVo;
    /**
     * m 단위 표시 높이 보정 값을 설정합니다.
     *
     * @param {number | null} value m 단위 표시 높이 보정, null이면 노드별 문서 기본값, 입력 값·참조 보관
     */
    set displayZOffset(value: number | null);
    /**
     * m 단위 표시 높이 보정 값을 반환합니다.
     *
     * @returns {number | null} m 단위 표시 높이 보정
     */
    get displayZOffset(): number | null;
    /**
     * 마스크 정점 스칼라 필드 ID 또는 미선택 null을 보관합니다. <br>
     * 표시 실행은 수행하지 않습니다.
     *
     * @param {string | null} value 마스크 정점 스칼라 필드 ID 또는 미선택 null, 입력 값·참조 보관
     */
    set maskFieldId(value: string | null);
    /**
     * 마스크 정점 스칼라 필드 ID 또는 미선택 null을 반환합니다.
     *
     * @returns {string | null} 마스크 정점 스칼라 필드 ID 또는 미선택 null
     */
    get maskFieldId(): string | null;
    /**
     * 선택 필드의 임계값 이하 부분 숨김 여부을 보관합니다. <br>
     * 표시 실행은 수행하지 않습니다.
     *
     * @param {boolean} value 선택 필드의 임계값 이하 부분 숨김 여부, 입력 값·참조 보관
     */
    set maskEnabled(value: boolean);
    /**
     * 선택 필드의 임계값 이하 부분 숨김 여부을 반환합니다.
     *
     * @returns {boolean} 선택 필드의 임계값 이하 부분 숨김 여부
     */
    get maskEnabled(): boolean;
    /**
     * 선택 필드 단위의 Float32 유한 임계값 값을 설정합니다.
     *
     * @param {number} value 선택 필드 단위의 Float32 유한 임계값, 음수 허용, 입력 값·참조 보관
     */
    set maskThreshold(value: number);
    /**
     * 선택 필드 단위의 Float32 유한 임계값 값을 반환합니다.
     *
     * @returns {number} 선택 필드 단위의 Float32 유한 임계값
     */
    get maskThreshold(): number;
    /**
     * 선택 필드 단위의 0 이상 Float32 경계 전이 폭 값을 설정합니다.
     *
     * @param {number} value 선택 필드 단위의 0 이상 Float32 경계 전이 폭, 화면상 최소 전이도 적용, 입력 값·참조 보관
     */
    set maskFeather(value: number);
    /**
     * 선택 필드 단위의 0 이상 Float32 경계 전이 폭 값을 반환합니다.
     *
     * @returns {number} 선택 필드 단위의 0 이상 Float32 경계 전이 폭
     */
    get maskFeather(): number;
    /**
     * 정규화 깊이 보정 값을 설정합니다.
     *
     * @param {number} value 정규화 깊이 보정, 0..64/2^24, 양수는 카메라 방향, 입력 값·참조 보관
     */
    set depthBias(value: number);
    /**
     * 정규화 깊이 보정 값을 반환합니다.
     *
     * @returns {number} 정규화 깊이 보정
     */
    get depthBias(): number;
    /**
     * 와이어프레임 표시 여부만 보관하며 실제 메쉬 재질 적용은 세션에 위임합니다.
     *
     * @param {boolean} value 표시 여부, 단위 없음
     */
    set wireframe(value: boolean);
    /**
     * 분석 메쉬의 삼각형 와이어프레임 표시 여부를 반환합니다. <br>
     * 기본값은 false입니다.
     *
     * @returns {boolean} 분석 메쉬의 삼각형 와이어프레임 표시 여부
     */
    get wireframe(): boolean;
    /**
     * 수면 설정 값을 설정합니다.
     *
     * @param {import('./UA3FSessionVos.js').UA3FWaterOptionsVo} value 수면 설정, 생성 시 독립 사본, 입력 값·참조 보관
     */
    set waterOptionsVo(value: UA3FWaterOptionsVo);
    /**
     * 수면 설정 값을 반환합니다.
     *
     * @returns {import('./UA3FSessionVos.js').UA3FWaterOptionsVo} 수면 설정
     */
    get waterOptionsVo(): UA3FWaterOptionsVo;
}
/**
 * @typedef {object} UA3FDisplayCapabilities
 * @property {[ number, number ] | null} [displayZOffsetRange] 공통 높이 보정 허용 [최소, 최대], m 단위; 공통 범위 없음은 null
 * @property {Array<import('../backend/vo/UA3FDataVos.js').UA3FFieldVo>} [maskFields] 모든 노드에서 의미와 배열 배치가 일치하는 마스크 필드 사본
 * @property {Array<import('../backend/vo/UA3FDataVos.js').UA3FFieldVo>} [waterFields] 좌표와 배열 배치가 지원되는 m 단위 수심 후보 필드 사본
 * @property {boolean} [waterAvailable] 현재 준비된 노드들에서 수면을 사용할 수 있는지 여부
 * @property {string | null} [waterUnavailableReason] 수면 미지원 이유 또는 지원할 때 null
 */
/**
 * 준비된 모든 노드의 공통 표시 기능을 범위·필드 사본으로 전달합니다.
 */
declare class UA3FDisplayCapabilitiesVo {
    /**
     * UA3FDisplayCapabilitiesVo 클래스 생성자입니다. <br>
     * 일반 객체 또는 동일 VO를 복사합니다.
     *
     * @param {import('./UA3FSessionVos.js').UA3FDisplayCapabilities | import('./UA3FSessionVos.js').UA3FDisplayCapabilitiesVo} [opt={}] 설정 원본
     */
    constructor(opt?: UA3FDisplayCapabilities | UA3FDisplayCapabilitiesVo);
    /** @type {[number, number] | null} */ _displayZOffsetRange: [number, number] | null;
    /**
     * @type {Array<import('../backend/vo/UA3FDataVos.js').UA3FFieldVo>}
     */ _maskFields: Array<UA3FFieldVo>;
    /**
     * @type {Array<import('../backend/vo/UA3FDataVos.js').UA3FFieldVo>}
     */ _waterFields: Array<UA3FFieldVo>;
    /** @type {boolean} */ _waterAvailable: boolean;
    /** @type {string | null} */ _waterUnavailableReason: string | null;
    /**
     * 공통 높이 보정 허용 [최소 값을 설정합니다.
     *
     * @param {[ number, number ] | null} value 공통 높이 보정 허용 [최소, 최대], m 단위, 공통 범위 없음은 null, 입력 값·참조 보관
     */
    set displayZOffsetRange(value: [number, number] | null);
    /**
     * 공통 높이 보정 허용 [최소 값을 반환합니다.
     *
     * @returns {[ number, number ] | null} 공통 높이 보정 허용 [최소
     */
    get displayZOffsetRange(): [number, number] | null;
    /**
     * 모든 노드에서 의미와 배열 배치가 일치하는 마스크 필드 사본을 보관합니다. <br>
     * 표시 실행은 수행하지 않습니다.
     *
     * @param {Array<import('../backend/vo/UA3FDataVos.js').UA3FFieldVo>} value 모든 노드에서 의미와 배열 배치가 일치하는 마스크 필드 사본, 입력 값·참조 보관
     */
    set maskFields(value: Array<UA3FFieldVo>);
    /**
     * 모든 노드에서 의미와 배열 배치가 일치하는 마스크 필드 사본을 반환합니다.
     *
     * @returns {Array<import('../backend/vo/UA3FDataVos.js').UA3FFieldVo>} 모든 노드에서 의미와 배열 배치가 일치하는 마스크 필드 사본
     */
    get maskFields(): Array<UA3FFieldVo>;
    /**
     * 좌표와 배열 배치가 지원되는 m 단위 수심 후보 필드 사본을 보관합니다. <br>
     * 표시 실행은 수행하지 않습니다.
     *
     * @param {Array<import('../backend/vo/UA3FDataVos.js').UA3FFieldVo>} value 좌표와 배열 배치가 지원되는 m 단위 수심 후보 필드 사본, 입력 값·참조 보관
     */
    set waterFields(value: Array<UA3FFieldVo>);
    /**
     * 좌표와 배열 배치가 지원되는 m 단위 수심 후보 필드 사본을 반환합니다.
     *
     * @returns {Array<import('../backend/vo/UA3FDataVos.js').UA3FFieldVo>} 좌표와 배열 배치가 지원되는 m 단위 수심 후보 필드 사본
     */
    get waterFields(): Array<UA3FFieldVo>;
    /**
     * 현재 준비된 노드들에서 수면을 사용할 수 있는지 여부을 보관합니다. <br>
     * 표시 실행은 수행하지 않습니다.
     *
     * @param {boolean} value 현재 준비된 노드들에서 수면을 사용할 수 있는지 여부, 입력 값·참조 보관
     */
    set waterAvailable(value: boolean);
    /**
     * 현재 준비된 노드들에서 수면을 사용할 수 있는지 여부을 반환합니다.
     *
     * @returns {boolean} 현재 준비된 노드들에서 수면을 사용할 수 있는지 여부
     */
    get waterAvailable(): boolean;
    /**
     * 수면 미지원 이유 또는 지원할 때 null을 보관합니다. <br>
     * 표시 실행은 수행하지 않습니다.
     *
     * @param {string | null} value 수면 미지원 이유 또는 지원할 때 null, 입력 값·참조 보관
     */
    set waterUnavailableReason(value: string | null);
    /**
     * 수면 미지원 이유 또는 지원할 때 null을 반환합니다.
     *
     * @returns {string | null} 수면 미지원 이유 또는 지원할 때 null
     */
    get waterUnavailableReason(): string | null;
}
/**
 * @typedef {object} UA3FWaterOptions
 * @property {string | null} [depthFieldId] 선택 수심 필드 ID 또는 미선택 null; 켤 때 m 단위 정점 스칼라 필수
 * @property {boolean} [enabled] 수면 효과 적용 여부; false는 투명 선택과 관계없이 효과 해제
 * @property {boolean} [transparent] 수면 효과를 켰을 때 투명 재질 사용 여부
 * @property {number} [opacity] 유한한 0..1 불투명도; 0은 완전 투명, 1은 불투명
 */
/**
 * 수면 표시 설정을 복사·보관합니다.
 */
declare class UA3FWaterOptionsVo {
    /**
     * UA3FWaterOptionsVo 클래스 생성자입니다. <br>
     * 일반 객체 또는 동일 VO를 복사합니다.
     *
     * @param {import('./UA3FSessionVos.js').UA3FWaterOptions | import('./UA3FSessionVos.js').UA3FWaterOptionsVo} [opt={}] 설정 원본
     */
    constructor(opt?: UA3FWaterOptions | UA3FWaterOptionsVo);
    /** @type {string | null} */ _depthFieldId: string | null;
    /** @type {boolean} */ _enabled: boolean;
    /** @type {boolean} */ _transparent: boolean;
    /** @type {number} */ _opacity: number;
    /**
     * 선택 수심 필드 ID 또는 미선택 null 값을 설정합니다.
     *
     * @param {string | null} value 선택 수심 필드 ID 또는 미선택 null, 켤 때 m 단위 정점 스칼라 필수, 입력 값·참조 보관
     */
    set depthFieldId(value: string | null);
    /**
     * 선택 수심 필드 ID 또는 미선택 null 값을 반환합니다.
     *
     * @returns {string | null} 선택 수심 필드 ID 또는 미선택 null
     */
    get depthFieldId(): string | null;
    /**
     * 수면 효과 적용 여부 값을 설정합니다.
     *
     * @param {boolean} value 수면 효과 적용 여부, false는 투명 선택과 관계없이 효과 해제, 입력 값·참조 보관
     */
    set enabled(value: boolean);
    /**
     * 수면 효과 적용 여부 값을 반환합니다.
     *
     * @returns {boolean} 수면 효과 적용 여부
     */
    get enabled(): boolean;
    /**
     * 수면 효과를 켰을 때 투명 재질 사용 여부을 보관합니다. <br>
     * 표시 실행은 수행하지 않습니다.
     *
     * @param {boolean} value 수면 효과를 켰을 때 투명 재질 사용 여부, 입력 값·참조 보관
     */
    set transparent(value: boolean);
    /**
     * 수면 효과를 켰을 때 투명 재질 사용 여부을 반환합니다.
     *
     * @returns {boolean} 수면 효과를 켰을 때 투명 재질 사용 여부
     */
    get transparent(): boolean;
    /**
     * 유한한 0..1 불투명도 값을 설정합니다.
     *
     * @param {number} value 유한한 0..1 불투명도, 0은 완전 투명, 1은 불투명, 입력 값·참조 보관
     */
    set opacity(value: number);
    /**
     * 유한한 0..1 불투명도 값을 반환합니다.
     *
     * @returns {number} 유한한 0..1 불투명도
     */
    get opacity(): number;
}
/**
 * @typedef {'color' | 'display' | 'flow'} UA3FSettingsSection
 * @typedef {object} UA3FSettingsOptions
 * @property {string} [title='A3F 설정'] 패널 제목
 * @property {Array<UA3FSettingsSection>} [sections] 표시 영역과 순서, 중복 불가
 * @property {'tabs' | 'stacked'} [layout='tabs'] 탭 또는 세로 배치
 * @property {boolean} [showHelp=true] 단위·제한·미지원 이유 표시
 */
/**
 * 선택형 설정 패널의 제목·영역·배치·도움말을 검증하고 복사합니다.
 */
declare class UA3FSettingsOptionsVo {
    /**
     * UA3FSettingsOptionsVo 클래스 생성자입니다. <br>
     * 일반 객체 또는 같은 VO의 영역 배열까지 복사하고 지원하는 구성을 확인합니다.
     *
     * @param {import('./UA3FSessionVos.js').UA3FSettingsOptions | import('./UA3FSessionVos.js').UA3FSettingsOptionsVo} [opt={}] 원본 옵션
     */
    constructor(opt?: UA3FSettingsOptions | UA3FSettingsOptionsVo);
    /** @type {string} */ _title: string;
    /** @type {Array<UA3FSettingsSection>} */ _sections: Array<UA3FSettingsSection>;
    /** @type {'tabs' | 'stacked'} */ _layout: "tabs" | "stacked";
    /** @type {boolean} */ _showHelp: boolean;
    /**
     * 패널 제목을 보관합니다. <br>
     * DOM은 변경하지 않습니다.
     *
     * @param {string} value 일반 텍스트 제목, 기본 A3F 설정
     */
    set title(value: string);
    /**
     * 패널 제목을 반환합니다.
     *
     * @returns {string} 패널 제목
     */
    get title(): string;
    /**
     * 표시 영역 목록을 보관합니다. <br>
     * View 생성 시 사본을 검증합니다.
     *
     * @param {Array<import('./UA3FSessionVos.js').UA3FSettingsSection>} value color·display·flow 중 중복 없는 목록, 빈 목록 허용, 참조 보관
     */
    set sections(value: Array<UA3FSettingsSection>);
    /**
     * 표시 영역과 순서 배열을 반환합니다.
     *
     * @returns {Array<import('./UA3FSessionVos.js').UA3FSettingsSection>} 표시 영역과 순서 배열
     */
    get sections(): Array<UA3FSettingsSection>;
    /**
     * 배치 선택을 보관합니다.
     *
     * @param {"tabs" | "stacked"} value 기본 tabs
     */
    set layout(value: "tabs" | "stacked");
    /**
     * 탭 또는 세로 배치를 반환합니다.
     *
     * @returns {"tabs" | "stacked"} 탭 또는 세로 배치
     */
    get layout(): "tabs" | "stacked";
    /**
     * 도움말 표시 여부를 보관합니다.
     *
     * @param {boolean} value 기본 true
     */
    set showHelp(value: boolean);
    /**
     * 단위·제한·미지원 이유 표시 여부를 반환합니다.
     *
     * @returns {boolean} 단위·제한·미지원 이유 표시 여부
     */
    get showHelp(): boolean;
}
/**
 * @typedef {object} UA3FFlowConfiguration
 * @property {UA3FVectorFieldVoCO | import('../backend/vo/UA3FPlaybackVos.js').UA3FVectorFieldVo | null} [vectorFieldVo] 명시한 벡터 정의 또는 미선택 null
 * @property {UA3FFlowOptionsVoCO | import('../backend/vo/UA3FPlaybackVos.js').UA3FFlowOptionsVo} [flowOptionsVo] 흐름 표시 설정
 * @property {UA3FParticleFlowOptionsVoCO | import('../backend/vo/UA3FPlaybackVos.js').UA3FParticleFlowOptionsVo} [particleOptionsVo] 입자 설정
 * @property {Array<string> | null} [palette] 낮음→높음 #RRGGBB 5색 또는 기본값 null
 * @property {boolean} [running] 독립 흐름 애니메이션 선택, 기본 true
 */
/**
 * 세션 흐름 요청과 적용 상태의 벡터·표시·입자·팔레트·실행 선택을 독립 사본으로 보관합니다.
 */
declare class UA3FFlowConfigurationVo {
    /**
     * UA3FFlowConfigurationVo 클래스 생성자입니다. <br>
     * 일반 객체 또는 동일 VO를 정본 키 기준으로 복사하며 작은 배열도 격리합니다.
     *
     * @param {import('./UA3FSessionVos.js').UA3FFlowConfiguration | import('./UA3FSessionVos.js').UA3FFlowConfigurationVo} [opt={}] 설정 원본
     */
    constructor(opt?: UA3FFlowConfiguration$1 | UA3FFlowConfigurationVo);
    /**
     * @type {import('../backend/vo/UA3FPlaybackVos.js').UA3FVectorFieldVo | null}
     */ _vectorFieldVo: UA3FVectorFieldVo | null;
    /**
     * @type {import('../backend/vo/UA3FPlaybackVos.js').UA3FFlowOptionsVo}
     */ _flowOptionsVo: UA3FFlowOptionsVo;
    /**
     * @type {import('../backend/vo/UA3FPlaybackVos.js').UA3FParticleFlowOptionsVo}
     */ _particleOptionsVo: UA3FParticleFlowOptionsVo;
    /** @type {Array<string> | null} */ _palette: Array<string> | null;
    /** @type {boolean} */ _running: boolean;
    /**
     * 방향·단위·0 기반 성분을 명시한 벡터 정의 또는 null을 보관하며 실행은 수행하지 않습니다.
     *
     * @param {import('../backend/vo/UA3FPlaybackVos.js').UA3FVectorFieldVo | null} value 방향·단위·0 기반 성분을 명시한 벡터 정의 또는 null, 입력 참조 보관, 자원 소유권 이전 없음
     */
    set vectorFieldVo(value: UA3FVectorFieldVo | null);
    /**
     * 방향·단위·0 기반 성분을 명시한 벡터 정의 또는 null을 반환합니다.
     *
     * @returns {import('../backend/vo/UA3FPlaybackVos.js').UA3FVectorFieldVo | null} 방향·단위·0 기반 성분을 명시한 벡터 정의 또는 null
     */
    get vectorFieldVo(): UA3FVectorFieldVo | null;
    /**
     * 화살표·흐름 모드와 m/s·CSS px·바이트 예산 설정을 보관하며 실행은 수행하지 않습니다.
     *
     * @param {import('../backend/vo/UA3FPlaybackVos.js').UA3FFlowOptionsVo} value 화살표·흐름 모드와 m/s·CSS px·바이트 예산 설정, 입력 참조 보관, 자원 소유권 이전 없음
     */
    set flowOptionsVo(value: UA3FFlowOptionsVo);
    /**
     * 화살표·흐름 모드와 m/s·CSS px·바이트 예산 설정을 반환합니다.
     *
     * @returns {import('../backend/vo/UA3FPlaybackVos.js').UA3FFlowOptionsVo} 화살표·흐름 모드와 m/s·CSS px·바이트 예산 설정
     */
    get flowOptionsVo(): UA3FFlowOptionsVo;
    /**
     * 입자 수·m 단위 격자·초 단위 수명·적분 설정을 보관하며 실행은 수행하지 않습니다.
     *
     * @param {import('../backend/vo/UA3FPlaybackVos.js').UA3FParticleFlowOptionsVo} value 입자 수·m 단위 격자·초 단위 수명·적분 설정, 입력 참조 보관, 자원 소유권 이전 없음
     */
    set particleOptionsVo(value: UA3FParticleFlowOptionsVo);
    /**
     * 입자 수·m 단위 격자·초 단위 수명·적분 설정을 반환합니다.
     *
     * @returns {import('../backend/vo/UA3FPlaybackVos.js').UA3FParticleFlowOptionsVo} 입자 수·m 단위 격자·초 단위 수명·적분 설정
     */
    get particleOptionsVo(): UA3FParticleFlowOptionsVo;
    /**
     * 낮음→높음 #RRGGBB 5색 또는 기본값 null을 보관하며 실행은 수행하지 않습니다.
     *
     * @param {Array<string> | null} value 낮음→높음 #RRGGBB 5색 또는 기본값 null, 입력 참조 보관, 자원 소유권 이전 없음
     */
    set palette(value: Array<string> | null);
    /**
     * 낮음→높음 #RRGGBB 5색 또는 기본값 null을 반환합니다.
     *
     * @returns {Array<string> | null} 낮음→높음 #RRGGBB 5색 또는 기본값 null
     */
    get palette(): Array<string> | null;
    /**
     * 독립 흐름 애니메이션 진행 여부, 기본 true을 보관하며 실행은 수행하지 않습니다.
     *
     * @param {boolean} value 독립 흐름 애니메이션 진행 여부, 기본 true, 입력 참조 보관, 자원 소유권 이전 없음
     */
    set running(value: boolean);
    /**
     * 독립 흐름 애니메이션 진행 여부, 기본 true을 반환합니다.
     *
     * @returns {boolean} 독립 흐름 애니메이션 진행 여부
     */
    get running(): boolean;
}
/**
 * @typedef {object} UA3FFlowStatus
 * @property {boolean} [available] 현재 선택한 벡터 실행 지원 여부
 * @property {string | null} [unavailableReason] 미지원 이유 또는 null
 * @property {boolean} [preparing] 후보 준비 중 여부
 * @property {number} [selectedCount] 실제 선택한 화살표 또는 seed 수, 0 이상 정수
 * @property {number} [allocatedParticles] 실제 배정한 입자 슬롯 수, 0 이상 정수
 * @property {number} [derivedBytes] 계산 가능한 파생 자료 사용량, 바이트
 * @property {number} [maxDerivedBytes] 적용 중인 파생 자료 예산, 양의 정수 바이트
 * @property {number | null} [actualCellMeters] 실제 격자 간격 m 또는 미준비 null
 * @property {boolean} [timeLimited] 적분 상한으로 진행 시간이 제한됐는지 여부
 * @property {string | null} [error] 최근 흐름 오류 문자열 또는 null
 */
/**
 * 준비·지원 여부와 실제 화살표·입자·예산·격자·오류를 작은 값 사본으로 전달합니다.
 */
declare class UA3FFlowStatusVo {
    /**
     * UA3FFlowStatusVo 클래스 생성자입니다. <br>
     * 관측한 작은 상태 값만 복사합니다.
     *
     * @param {import('./UA3FSessionVos.js').UA3FFlowStatus | import('./UA3FSessionVos.js').UA3FFlowStatusVo} [opt={}] 상태 원본
     */
    constructor(opt?: UA3FFlowStatus | UA3FFlowStatusVo);
    /** @type {boolean} */ _available: boolean;
    /** @type {string | null} */ _unavailableReason: string | null;
    /** @type {boolean} */ _preparing: boolean;
    /** @type {number} */ _selectedCount: number;
    /** @type {number} */ _allocatedParticles: number;
    /** @type {number} */ _derivedBytes: number;
    /** @type {number} */ _maxDerivedBytes: number;
    /** @type {number | null} */ _actualCellMeters: number | null;
    /** @type {boolean} */ _timeLimited: boolean;
    /** @type {string | null} */ _error: string | null;
    /**
     * 현재 선택한 벡터 실행 지원 여부을 보관합니다.
     *
     * @param {boolean} value 관측 값
     */
    set available(value: boolean);
    /**
     * 현재 선택한 벡터 실행 지원 여부을 반환합니다.
     *
     * @returns {boolean} 현재 선택한 벡터 실행 지원 여부
     */
    get available(): boolean;
    /**
     * 미지원 이유 또는 null을 보관합니다.
     *
     * @param {string | null} value 관측 값, 미지원 이유 또는 null
     */
    set unavailableReason(value: string | null);
    /**
     * 미지원 이유 또는 null을 반환합니다.
     *
     * @returns {string | null} 미지원 이유 또는 null
     */
    get unavailableReason(): string | null;
    /**
     * 후보 준비 중 여부을 보관합니다.
     *
     * @param {boolean} value 관측 값
     */
    set preparing(value: boolean);
    /**
     * 후보 준비 중 여부을 반환합니다.
     *
     * @returns {boolean} 후보 준비 중 여부
     */
    get preparing(): boolean;
    /**
     * 실제 선택한 화살표 또는 seed 수, 0 이상 정수을 보관합니다.
     *
     * @param {number} value 관측 값, 0 이상 정수
     */
    set selectedCount(value: number);
    /**
     * 실제 선택한 화살표 또는 seed 수, 0 이상 정수을 반환합니다.
     *
     * @returns {number} 실제 선택한 화살표 또는 seed 수
     */
    get selectedCount(): number;
    /**
     * 실제 배정한 입자 슬롯 수, 0 이상 정수을 보관합니다.
     *
     * @param {number} value 관측 값, 0 이상 정수
     */
    set allocatedParticles(value: number);
    /**
     * 실제 배정한 입자 슬롯 수, 0 이상 정수을 반환합니다.
     *
     * @returns {number} 실제 배정한 입자 슬롯 수
     */
    get allocatedParticles(): number;
    /**
     * 계산 가능한 파생 자료 사용량, 바이트을 보관합니다.
     *
     * @param {number} value 관측 값
     */
    set derivedBytes(value: number);
    /**
     * 계산 가능한 파생 자료 사용량, 바이트을 반환합니다.
     *
     * @returns {number} 계산 가능한 파생 자료 사용량
     */
    get derivedBytes(): number;
    /**
     * 적용 중인 파생 자료 예산, 양의 정수 바이트을 보관합니다.
     *
     * @param {number} value 관측 값, 양의 정수 바이트
     */
    set maxDerivedBytes(value: number);
    /**
     * 적용 중인 파생 자료 예산, 양의 정수 바이트을 반환합니다.
     *
     * @returns {number} 적용 중인 파생 자료 예산
     */
    get maxDerivedBytes(): number;
    /**
     * 실제 격자 간격 m 또는 미준비 null을 보관합니다.
     *
     * @param {number | null} value 관측 값, 실제 격자 간격 m 또는 미준비 null
     */
    set actualCellMeters(value: number | null);
    /**
     * 실제 격자 간격 m 또는 미준비 null을 반환합니다.
     *
     * @returns {number | null} 실제 격자 간격 m 또는 미준비 null
     */
    get actualCellMeters(): number | null;
    /**
     * 적분 상한으로 진행 시간이 제한됐는지 여부을 보관합니다.
     *
     * @param {boolean} value 관측 값
     */
    set timeLimited(value: boolean);
    /**
     * 적분 상한으로 진행 시간이 제한됐는지 여부을 반환합니다.
     *
     * @returns {boolean} 적분 상한으로 진행 시간이 제한됐는지 여부
     */
    get timeLimited(): boolean;
    /**
     * 최근 흐름 오류 문자열 또는 null을 보관합니다.
     *
     * @param {string | null} value 관측 값, 최근 흐름 오류 문자열 또는 null
     */
    set error(value: string | null);
    /**
     * 최근 흐름 오류 문자열 또는 null을 반환합니다.
     *
     * @returns {string | null} 최근 흐름 오류 문자열 또는 null
     */
    get error(): string | null;
}
type UA3FSessionOptions = {
    /**
     * 높이 정책 ID, null이면 문서 기본 정책
     */
    heightPolicyId?: string | null | undefined;
    /**
     * 일반 객체 또는 기존 재생 설정 VO
     */
    timelineOptionsVo?: UA3FTimelineOptionsVoCO_Content | undefined;
    /**
     * 일반 객체 또는 기존 공간 설정 VO
     */
    spatialOptionsVo?: UA3FSpatialOptionsVoCO_Content | undefined;
    /**
     * 일반 객체 또는 기존 예산 설정 VO
     */
    cacheBudgetOptionsVo?: UA3FCacheBudgetOptionsVoCO_Content | undefined;
    /**
     * 세션의 RAF 시간 자동 구동 여부
     */
    autoTick?: boolean | undefined;
    /**
     * 페이지가 숨겨지면 일시정지할지 여부
     */
    pauseWhenHidden?: boolean | undefined;
};
type UA3FSessionStatus = "idle" | "loading" | "ready" | "paused" | "playing" | "buffering" | "configuring" | "error" | "ended" | "disposed";
type UA3FSessionState = {
    /**
     * 세션 주요 상태
     */
    status?: UA3FSessionStatus | undefined;
    /**
     * 연결한 절대 문서 URL
     */
    metadataUrl?: string | null | undefined;
    /**
     * 데이터셋 ID
     */
    datasetId?: string | null | undefined;
    /**
     * 준비 후 재생 상태
     */
    timelineStateVo?: UA3FTimelineStateVo | null | undefined;
    /**
     * 독립 경고 문자열 목록
     */
    warnings?: string[] | undefined;
    /**
     * 원래 오류 참조
     */
    error?: Error | null | undefined;
    /**
     * 요청한 프레임의 0 기반 목록 위치
     */
    requestedFramePosition?: number | null | undefined;
    /**
     * 표시한 프레임의 0 기반 목록 위치
     */
    displayedFramePosition?: number | null | undefined;
    /**
     * 실제 적용 흐름 정책, 미준비·종료 시 null
     */
    flowConfigurationVo?: UA3FFlowConfigurationVo | null | undefined;
    /**
     * 실제 흐름 상태 사본
     */
    flowStatusVo?: UA3FFlowStatusVo | undefined;
    /**
     * 실제 적용 표시 정책, 미준비·종료 시 null
     */
    displayOptionsVo?: UA3FDisplayOptionsVo | null | undefined;
    /**
     * 범용 API로 적용한 색상 설정, 미적용·종료 시 null
     */
    colorOptionsVo?: UA3FColorOptionsVo | null | undefined;
};
type UA3FDatasetInfo = {
    /**
     * 실제 응답 문서 URL
     */
    metadataUrl?: string | null | undefined;
    /**
     * 데이터셋 ID
     */
    datasetId?: string | null | undefined;
    /**
     * 월드 좌표(EPSG:3857)의 minX·minY·maxX·maxY
     */
    boundsXY?: number[] | null | undefined;
    /**
     * 루트 문서의 등록 프레임 수
     */
    frameCount?: number | undefined;
    /**
     * 문서가 명시한 원본 시간 단위
     */
    timeUnit?: string | null | undefined;
    /**
     * 문서가 명시한 시간 표현
     */
    timeKind?: string | null | undefined;
    /**
     * 기본 높이 정책 ID
     */
    defaultHeightPolicyId?: string | null | undefined;
    /**
     * 높이 정책 값 사본 목록
     */
    heightPolicies?: UA3FHeightPolicyVo[] | undefined;
};
type UA3FColorOptions = {
    /**
     * 색상 필드 ID, null이면 필드 색상 해제
     */
    fieldId?: string | null | undefined;
    /**
     * 0 기반 성분 번호
     */
    component?: number | undefined;
    /**
     * 고정 범위, null이면 루트 문서 필드의 전체 통계 사용
     */
    range?: [number, number] | null | undefined;
    /**
     * 낮음→높음 순서 #RRGGBB 5개 또는 기본 그라데이션
     */
    palette?: string[] | null | undefined;
};
type UA3FDisplayOptions$1 = {
    /**
     * m 단위 표시 높이 보정; null이면 노드별 문서 기본값
     */
    displayZOffset?: number | null | undefined;
    /**
     * 마스크 정점 스칼라 필드 ID 또는 미선택 null
     */
    maskFieldId?: string | null | undefined;
    /**
     * 선택 필드의 임계값 이하 부분 숨김 여부
     */
    maskEnabled?: boolean | undefined;
    /**
     * 선택 필드 단위의 Float32 유한 임계값; 음수 허용
     */
    maskThreshold?: number | undefined;
    /**
     * 선택 필드 단위의 0 이상 Float32 경계 전이 폭; 화면상 최소 전이도 적용
     */
    maskFeather?: number | undefined;
    /**
     * 정규화 깊이 보정; 0..64/2^24, 양수는 카메라 방향
     */
    depthBias?: number | undefined;
    /**
     * 분석 메쉬를 삼각형 와이어프레임으로 표시할지 여부
     */
    wireframe?: boolean | undefined;
    /**
     * 수면 설정; null 불가, 생성 시 독립 사본
     */
    waterOptionsVo?: UA3FWaterOptionsVo | UA3FWaterOptions | undefined;
};
type UA3FDisplayCapabilities = {
    /**
     * 공통 높이 보정 허용 [최소, 최대], m 단위; 공통 범위 없음은 null
     */
    displayZOffsetRange?: [number, number] | null | undefined;
    /**
     * 모든 노드에서 의미와 배열 배치가 일치하는 마스크 필드 사본
     */
    maskFields?: UA3FFieldVo[] | undefined;
    /**
     * 좌표와 배열 배치가 지원되는 m 단위 수심 후보 필드 사본
     */
    waterFields?: UA3FFieldVo[] | undefined;
    /**
     * 현재 준비된 노드들에서 수면을 사용할 수 있는지 여부
     */
    waterAvailable?: boolean | undefined;
    /**
     * 수면 미지원 이유 또는 지원할 때 null
     */
    waterUnavailableReason?: string | null | undefined;
};
type UA3FWaterOptions = {
    /**
     * 선택 수심 필드 ID 또는 미선택 null; 켤 때 m 단위 정점 스칼라 필수
     */
    depthFieldId?: string | null | undefined;
    /**
     * 수면 효과 적용 여부; false는 투명 선택과 관계없이 효과 해제
     */
    enabled?: boolean | undefined;
    /**
     * 수면 효과를 켰을 때 투명 재질 사용 여부
     */
    transparent?: boolean | undefined;
    /**
     * 유한한 0..1 불투명도; 0은 완전 투명, 1은 불투명
     */
    opacity?: number | undefined;
};
type UA3FSettingsSection = "color" | "display" | "flow";
type UA3FSettingsOptions = {
    /**
     * 패널 제목
     */
    title?: string | undefined;
    /**
     * 표시 영역과 순서, 중복 불가
     */
    sections?: UA3FSettingsSection[] | undefined;
    /**
     * 탭 또는 세로 배치
     */
    layout?: "tabs" | "stacked" | undefined;
    /**
     * 단위·제한·미지원 이유 표시
     */
    showHelp?: boolean | undefined;
};
type UA3FFlowConfiguration$1 = {
    /**
     * 명시한 벡터 정의 또는 미선택 null
     */
    vectorFieldVo?: UA3FVectorFieldVo | UA3FVectorFieldVoCO_Content | null | undefined;
    /**
     * 흐름 표시 설정
     */
    flowOptionsVo?: UA3FFlowOptionsVo | UA3FFlowOptionsVoCO_Content | undefined;
    /**
     * 입자 설정
     */
    particleOptionsVo?: UA3FParticleFlowOptionsVo | UA3FParticleFlowOptionsVoCO_Content | undefined;
    /**
     * 낮음→높음 #RRGGBB 5색 또는 기본값 null
     */
    palette?: string[] | null | undefined;
    /**
     * 독립 흐름 애니메이션 선택, 기본 true
     */
    running?: boolean | undefined;
};
type UA3FFlowStatus = {
    /**
     * 현재 선택한 벡터 실행 지원 여부
     */
    available?: boolean | undefined;
    /**
     * 미지원 이유 또는 null
     */
    unavailableReason?: string | null | undefined;
    /**
     * 후보 준비 중 여부
     */
    preparing?: boolean | undefined;
    /**
     * 실제 선택한 화살표 또는 seed 수, 0 이상 정수
     */
    selectedCount?: number | undefined;
    /**
     * 실제 배정한 입자 슬롯 수, 0 이상 정수
     */
    allocatedParticles?: number | undefined;
    /**
     * 계산 가능한 파생 자료 사용량, 바이트
     */
    derivedBytes?: number | undefined;
    /**
     * 적용 중인 파생 자료 예산, 양의 정수 바이트
     */
    maxDerivedBytes?: number | undefined;
    /**
     * 실제 격자 간격 m 또는 미준비 null
     */
    actualCellMeters?: number | null | undefined;
    /**
     * 적분 상한으로 진행 시간이 제한됐는지 여부
     */
    timeLimited?: boolean | undefined;
    /**
     * 최근 흐름 오류 문자열 또는 null
     */
    error?: string | null | undefined;
};

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer
 *
 * @group 3dLayer
 * @summary A3F 공간 노드와 표시 객체의 레이어
 * @extends {U3dModelLayer}
 */
declare class U3dModelA3FLayer extends U3dModelLayer {
    /**
     * 월드 좌표(EPSG:3857)의 XY와 원본 미터 높이 경계를 검증하여 복사합니다.
     *
     * @param {UA3FNodeBoundingBoxData} bounds 독립 복사할 공간 경계
     * @returns {UA3FNodeBoundingBoxData} 원본 높이 의미를 보존한 새 경계
     */
    static "__#136559@#snapshotBounds"(bounds: UA3FNodeBoundingBoxData): UA3FNodeBoundingBoxData;
    /**
     * 부모 생성 전에 옵션을 정규화하고 A3F 레이어의 고정 계약을 확인합니다.
     *
     * @param {U3dModelA3FLayerCO} opt 정규화할 레이어 생성 설정
     * @param {typeof import('./U3dModelA3FLayer.js').U3dModelA3FLayer} targetClass OPT_KEYS를 제공하는 실제 생성 클래스
     * @returns {U3dModelA3FLayerCO} 기본값과 고정 형식을 적용한 새 옵션
     */
    static "__#136559@#prepareOptions"(opt: U3dModelA3FLayerCO, targetClass: typeof U3dModelA3FLayer): U3dModelA3FLayerCO;
    /**
     * 작업 설정의 기본값과 안전 정수 범위를 확인합니다.
     *
     * @param {Partial<U3dModelA3FLayerTaskOptions>} options 작업 관리자 상한 설정
     * @returns {U3dModelA3FLayerTaskOptions} 세 수치가 모두 있는 사본
     */
    static "__#136559@#taskOptions"(options: Partial<U3dModelA3FLayerTaskOptions>): U3dModelA3FLayerTaskOptions;
    /**
     * 필수 문자열을 확인하며 원문을 정규화하거나 변경하지 않습니다.
     *
     * @param {string | null} value 비어 있지 않은 문자열인지 확인할 값
     * @param {string} label 오류 메시지에 표시할 필드 이름
     */
    static "__#136559@#assertString"(value: string | null, label: string): void;
    /**
     * 최소값 이상의 안전 정수인지 확인합니다.
     *
     * @param {number} value 안전한 정수인지 확인할 값
     * @param {number} minimum 허용할 최소 정수
     * @param {string} label 오류 메시지에 표시할 필드 이름
     */
    static "__#136559@#assertInteger"(value: number, minimum: number, label: string): void;
    /**
     * 고정 길이 배열의 모든 성분이 유한한 숫자인지 확인합니다.
     *
     * @param {Array<number>} value 유한한 성분으로 구성된 입력 배열
     * @param {number} length 필요한 성분 수
     * @param {string} label 오류 메시지에 표시할 경계 이름
     */
    static "__#136559@#finiteTuple"(value: Array<number>, length: number, label: string): void;
    /**
     * 필수 정의 객체를 읽기 전에 null·배열·원시값을 거부합니다.
     *
     * @param {unknown} value 일반 객체인지 확인할 값
     * @param {string} label 오류 메시지에 표시할 입력 이름
     */
    static "__#136559@#requireRecord"(value: unknown, label: string): void;
    /**
     * U3dModelA3FLayer 클래스 생성자입니다. <br>
     * A3F 옵션을 부모 자원 생성 전에 확인하고 데이터셋 연결을 준비합니다.
     *
     * @param {U3dModelA3FLayerCO} [opt={}] 레이어 생성 설정(visible 기본값 true)
     */
    constructor(opt?: U3dModelA3FLayerCO);
    /** @type {string | null} */
    _datasetId: string | null;
    /** @type {import('../backend/UA3FTaskManager.js').UA3FTaskManager | null} */
    _taskManager: UA3FTaskManager | null;
    /** @type {U3dModelA3FLayerTaskOptions} */
    _a3fTaskOptions: U3dModelA3FLayerTaskOptions;
    /** @type {Map<string, U3dModelA3FLayerNodeEntry>} */
    _a3fNodeMap: Map<string, U3dModelA3FLayerNodeEntry>;
    /** @type {number} */
    _a3fNodeRevision: number;
    /** @type {Promise<boolean> | null} */
    _a3fDisposePromise: Promise<boolean> | null;
    /**
     * 엔진의 지형 MODEL 타일 콜백을 등록하지 않습니다.
     *
     * @override
     *
     * @returns {undefined} A3F 공간 탐색은 별도 모듈이 담당하므로 콜백 없음
     */
    override getTileCallback(): undefined;
    /**
     * 한 데이터셋의 작업 관리자를 소유하며 같은 식별자의 재연결은 재사용합니다.
     *
     * @param {string} datasetId 연결할 데이터셋 식별자(최초 연결 후 변경 불가)
     * @returns {import('../backend/UA3FTaskManager.js').UA3FTaskManager} 레이어 소유이므로 호출자가 해제하지 않을 관리자
     */
    bindDataset(datasetId: string): UA3FTaskManager;
    /**
     * 정의 사본과 빈 형제 그룹을 등록하고 재등록을 구분하는 토큰을 반환합니다.
     *
     * @param {import('../backend/vo/UA3FSceneVos.js').UA3FNodeVo} nodeVo 등록할 노드 정의(parentNodeId는 등록된 부모 ID 또는 null)
     * @returns {number} 양의 안전 정수 등록 토큰이며 삭제 후 같은 키를 등록해도 달라짐
     */
    registerNode(nodeVo: UA3FNodeVo): number;
    /**
     * 등록 노드와 경계 배열의 사본을 반환합니다.
     *
     * @param {string} nodeId 표시 객체를 조회할 노드 키
     * @returns {undefined | import('../backend/vo/UA3FSceneVos.js').UA3FNodeVo} 등록되어 있으면 정의 사본, 없으면 undefined
     */
    getNode(nodeId: string): undefined | UA3FNodeVo;
    /**
     * 현재 노드 등록의 토큰을 반환합니다.
     *
     * @param {string} nodeId 표시 객체를 조회할 노드 키
     * @returns {undefined | number} 현재 등록 토큰 또는 없는 노드이면 undefined
     */
    getNodeRevision(nodeId: string): undefined | number;
    /**
     * 현재 표시 객체를 빌린 참조로 반환합니다.
     *
     * @param {string} nodeId 표시 객체를 조회할 노드 키
     * @returns {undefined | import('three').Object3D} 현재 객체 또는 없음, 외부에서 부모를 바꾸거나 해제하지 않음
     */
    getNodeObject(nodeId: string): undefined | Object3D;
    /**
     * 현재 등록 토큰에 표시 객체를 연결하고 성공한 연결의 반납 책임을 맡습니다.
     *
     * @param {string} nodeId 표시 객체를 연결할 노드 키
     * @param {number} revision registerNode가 반환한 현재 등록 토큰
     * @param {import('three').Object3D} object 부모가 없는 표시 객체(연결 성공 시 레이어가 관리)
     * @param {U3dModelA3FLayerRelease} release 연결 교체·제거·해제 시 한 번 호출할 동기 반납 함수
     */
    attachNodeObject(nodeId: string, revision: number, object: Object3D, release: U3dModelA3FLayerRelease): void;
    /**
     * 노드와 공간 후손의 작업 및 표시 연결을 제거합니다.
     *
     * @param {string} nodeId 제거할 노드 키(미등록이면 무동작)
     * @returns {boolean} 기존 등록을 제거했으면 true, 없으면 false
     */
    removeNode(nodeId: string): boolean;
    /**
     * 데이터셋 식별자를 첫 연결하거나 동일 값으로 확인합니다.
     *
     * @param {string | null} value 데이터셋 식별자(최초 연결 전 null은 무동작)
     */
    set datasetId(value: string | null);
    /**
     * 현재 연결한 데이터셋 식별자를 반환합니다.
     *
     * @returns {string | null} 아직 연결하지 않았으면 null
     */
    get datasetId(): string | null;
    /**
     * 운영 값은 동일 값만 수용하며 실제 변경은 레이어 API에 위임합니다.
     *
     * @param {import('../backend/UA3FTaskManager.js').UA3FTaskManager | null} value 현재 작업 관리자와 같은 참조
     */
    set taskManager(value: UA3FTaskManager | null);
    /**
     * 레이어 소유 작업 관리자의 빌린 참조를 반환합니다.
     *
     * @returns {import('../backend/UA3FTaskManager.js').UA3FTaskManager | null} 현재 운영 참조 또는 값
     */
    get taskManager(): UA3FTaskManager | null;
    /**
     * 운영 값은 동일 값만 수용하며 실제 변경은 레이어 API에 위임합니다.
     *
     * @param {number} value 현재 발행한 등록 토큰과 같은 값
     */
    set a3fNodeRevision(value: number);
    /**
     * 현재까지 발행한 등록 토큰를 반환합니다.
     *
     * @returns {number} 현재 운영 참조 또는 값
     */
    get a3fNodeRevision(): number;
    /**
     * 운영 값은 동일 값만 수용하며 실제 변경은 레이어 API에 위임합니다.
     *
     * @param {Promise<boolean> | null} value 현재 해제 Promise와 같은 참조(해제 전에는 null)
     */
    set a3fDisposePromise(value: Promise<boolean> | null);
    /**
     * 해제 전에는 null인 반복 해제 결과를 반환합니다.
     *
     * @returns {Promise<boolean> | null} 현재 운영 참조 또는 값
     */
    get a3fDisposePromise(): Promise<boolean> | null;
    /**
     * 데이터셋 연결과 노드 등록 전에 작업 설정을 교체합니다.
     *
     * @param {U3dModelA3FLayerTaskOptions} value 작업 수·대기 수·대기 바이트 상한(workerCount는 1 이상, 나머지는 0 이상 안전한 정수)
     */
    set a3fTaskOptions(value: U3dModelA3FLayerTaskOptions);
    /**
     * 작업 관리자의 생성 설정 사본을 반환합니다.
     *
     * @returns {U3dModelA3FLayerTaskOptions} 원본을 수정할 수 없는 설정 사본
     */
    get a3fTaskOptions(): U3dModelA3FLayerTaskOptions;
    /**
     * 첫 노드 등록 전 빈 정의 Map만 수용합니다.
     *
     * @param {Map<string, import('../backend/vo/UA3FSceneVos.js').UA3FNodeVo>} value 등록을 초기화할 빈 Map
     */
    set a3fNodeMap(value: Map<string, UA3FNodeVo>);
    /**
     * 노드와 경계 배열을 사본으로 구성한 조회 Map을 반환합니다.
     *
     * @returns {Map<string, import('../backend/vo/UA3FSceneVos.js').UA3FNodeVo>} 실행 객체와 반납 함수가 없는 정의 사본 목록
     */
    get a3fNodeMap(): Map<string, UA3FNodeVo>;
    #private;
}

/**
 * 투영 수평 경계와 월드 렌더 경계로 공간 가시성과 화면 오차를 계산합니다.
 *
 * @group A3F
 * @summary 투영 수평 경계와 월드 렌더 경계로 공간 가시성과 화면 오차를 계산합니다.
 */
declare class UA3FSpatialSelectionExecutor {
    /**
     * 수평 경계선 접촉을 포함해 보수적인 화면 XY 범위를 판정합니다.
     *
     * @param {UA3FNodeBoundingBoxData} boundingBox 월드 좌표(EPSG:3857) 수평 경계, 원본 Z는 이 판정에 사용하지 않음
     * @param {import('./vo/UA3FSceneVos.js').UA3FSpatialViewVo} viewVo 갱신 완료 카메라와 CSS pixel 화면 정의
     * @returns {boolean} 수평 범위가 교차하거나 필터가 null이면 true
     */
    intersectsBounds(boundingBox: UA3FNodeBoundingBoxData, viewVo: UA3FSpatialViewVo): boolean;
    /**
     * 안전한 전체 렌더 경계가 있으면 월드 frustum을 검사합니다. <br>
     * 컨테이너 등 world Z가 확정되지 않은 경우에는 수평 경계만 확인합니다.
     *
     * @param {import('./vo/UA3FSceneVos.js').UA3FMetadataVo} metadataVo 검증된 공간 문서, 변경하지 않음
     * @param {import('./vo/UA3FSceneVos.js').UA3FSpatialViewVo} viewVo 절대 월드 카메라를 가진 선택 문맥, 변경하지 않음
     * @param {import('three').Box3 | null} [renderBounds] 표시 전용 절대 월드 경계, null은 XY만 검사, 생략하면 metadata 사용, null은 XY만 검사하고 생략하면 원본 경계를 사용합니다.
     * @returns {boolean} 보수적인 공간 검사에서 가시 후보이면 true
     */
    isVisible(metadataVo: UA3FMetadataVo, viewVo: UA3FSpatialViewVo, renderBounds?: Box3 | null): boolean;
    /**
     * 원본 투영 오차를 CSS pixel 화면 오차로 환산합니다. <br>
     * 원근 거리 하한은 1 world unit이며 안전한 world Z가 없으면 보수적으로 Infinity를 반환합니다.
     *
     * @param {import('./vo/UA3FSceneVos.js').UA3FMetadataVo} metadataVo 공간 오차와 형상 경계를 가진 문서
     * @param {import('./vo/UA3FSceneVos.js').UA3FSpatialViewVo} viewVo 원근 또는 직교 카메라와 CSS pixel 높이
     * @param {import('three').Box3 | null} [renderBounds] 표시 전용 절대 월드 경계, null은 높이 미확정, 생략하면 metadata 사용, null은 원근 오차 Infinity이고 생략하면 원본 경계를 사용합니다.
     * @returns {number} 0 이상 CSS pixel 화면 오차, 미확정 원근 경계이면 Infinity
     */
    getScreenSpaceError(metadataVo: UA3FMetadataVo, viewVo: UA3FSpatialViewVo, renderBounds?: Box3 | null): number;
    #private;
}

/**
 * 외부 metadata 트리의 요청·캐시와 공간 표시 전환 계획을 관리합니다.
 *
 * @group A3F
 * @summary 외부 metadata 트리의 요청·캐시와 공간 표시 전환 계획을 관리합니다.
 */
declare class UA3FSpatialManager {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FSpatialManager 클래스 생성자입니다. <br>
     * 정책 값을 고정하고 metadata·선택 상태를 준비하며 I/O를 시작하지 않습니다.
     *
     * @param {UA3FSpatialManagerCO} opt 필수 로더·정책 설정, null 불가, 입력 설정 변경 없음
     */
    constructor(opt: UA3FSpatialManagerCO);
    /** @type {import('./UA3FMetadataLoader.js').UA3FMetadataLoader} */
    _metadataLoader: UA3FMetadataLoader;
    /** @type {import('./UA3FSpatialSelectionExecutor.js').UA3FSpatialSelectionExecutor} */
    _executor: UA3FSpatialSelectionExecutor;
    /** @type {UA3FSpatialState} */
    _state: UA3FSpatialState;
    /**
     * 처음 한 루트를 비동기로 읽으며 같은 진행 호출은 합류합니다. <br>
     * 다른 루트로 바꾸려면 dispose 후 새 관리자를 사용하십시오.
     *
     * @param {string} metadataUrl 절대 루트 metadata URL
     * @returns {Promise<import('./vo/UA3FSceneVos.js').UA3FMetadataVo>} 캐시가 보관하는 루트 문서 참조, 사용 중 변경 금지
     */
    loadRoot(metadataUrl: string): Promise<UA3FMetadataVo>;
    /**
     * 현재 준비 상태에서 표시·준비·회수 계획을 동기로 작성합니다. <br>
     * 필요한 하위 metadata는 제한된 수로 요청하며 완료 후 다음 select에서 새 계획을 만듭니다. <br>
     * readyNodeKeys는 viewVo.contentKey의 완료만 포함해야 하고 반환 문서는 캐시의 빌린 참조입니다.
     *
     * @param {import('./vo/UA3FSceneVos.js').UA3FSpatialViewVo} viewVo 이번 카메라·화면·콘텐츠 기준, 작은 카메라 snapshot을 만들어 사용
     * @param {Set<string>} readyNodeKeys 현재 contentKey의 준비 완료 노드 키, 입력 Set은 변경하지 않음
     * @param {Map<string, import('three').Box3>} [renderBounds] 표시 전용 절대 월드 경계(생략하면 메타데이터 경계 사용)
     * @returns {import('./vo/UA3FSceneVos.js').UA3FSpatialSelectionVo} 선택·회수 계획 사본, 실제 3D 표시는 호출자 책임
     */
    select(viewVo: UA3FSpatialViewVo, readyNodeKeys: Set<string>, renderBounds?: Map<string, Box3>): UA3FSpatialSelectionVo;
    /**
     * 현재 요청한 metadata 파이프라인이 정리될 때까지 기다립니다. <br>
     * 실패 목록의 첫 오류 또는 용량 오류를 전달하며 실제 a3f·GPU 준비를 기다리는 API가 아닙니다.
     *
     * @returns {Promise<void>} metadata 요청 정리 완료 또는 원래 오류
     */
    whenIdle(): Promise<void>;
    /**
     * 계획의 선택 순번과 콘텐츠 기준이 아직 최신인지 확인합니다.
     *
     * @param {import('./vo/UA3FSceneVos.js').UA3FSpatialSelectionVo} selectionVo 적용 전에 확인할 계획 사본
     * @returns {boolean} 최신 열린 관리자 계획이면 true
     */
    isCurrent(selectionVo: UA3FSpatialSelectionVo): boolean;
    /**
     * 소유 metadata 요청·캐시를 정리하고 호출자가 회수할 노드 키를 반환합니다. <br>
     * 같은 호출을 반복해도 중복 회수 목록을 내지 않으며 공유 워커·Geometry·Material은 해제하지 않습니다.
     *
     * @returns {Array<string>} 처음 종료 시 준비·표시 중이던 키, 실제 자원 반납은 호출자 책임
     */
    dispose(): Array<string>;
    /**
     * 관리 상태의 외부 교체를 거부합니다.
     *
     * @param {import('./UA3FMetadataLoader.js').UA3FMetadataLoader} value 빌린 metadata 로더, 기존 값 또는 참조와 동일한 경우만 허용
     */
    set metadataLoader(value: UA3FMetadataLoader);
    /**
     * 빌린 metadata 로더 값을 반환합니다.
     *
     * @returns {import('./UA3FMetadataLoader.js').UA3FMetadataLoader} 빌린 metadata 로더
     */
    get metadataLoader(): UA3FMetadataLoader;
    /**
     * 관리 상태의 외부 교체를 거부합니다.
     *
     * @param {import('./UA3FSpatialSelectionExecutor.js').UA3FSpatialSelectionExecutor} value 동기 공간 계산기, 기존 값 또는 참조와 동일한 경우만 허용
     */
    set executor(value: UA3FSpatialSelectionExecutor);
    /**
     * 동기 공간 계산기 값을 반환합니다.
     *
     * @returns {import('./UA3FSpatialSelectionExecutor.js').UA3FSpatialSelectionExecutor} 동기 공간 계산기
     */
    get executor(): UA3FSpatialSelectionExecutor;
    /**
     * 관리 상태의 외부 교체를 거부합니다.
     *
     * @param {UA3FSpatialState} value 엔진 내부 운영 참조, 외부 변경 금지, 기존 값 또는 참조와 동일한 경우만 허용
     */
    set state(value: UA3FSpatialState);
    /**
     * 엔진 내부 운영 참조, 외부 변경 금지 값을 반환합니다.
     *
     * @returns {UA3FSpatialState} 엔진 내부 운영 참조, 외부 변경 금지
     */
    get state(): UA3FSpatialState;
    #private;
}

/**
 * @typedef {object} UA3FAssetOptions
 * @property {string | null} [workerBaseUrl=null] UWorker.js와 task/를 포함하는 Worker 폴더
 * @property {string | null} [waterNormalUrl=null] 수면 법선 이미지 주소
 */
/**
 * A3F 세션에서 사용할 Worker 폴더와 수면 법선 이미지의 주소를 보관합니다. <br>
 * 상대 주소의 해석과 프로토콜 검사는 자원 연결 시 수행하며, null은 SDK 기본 자원을 선택하는 값입니다.
 */
declare class UA3FAssetOptionsVo {
    /**
     * UA3FAssetOptionsVo 클래스 생성자입니다. <br>
     * 전달한 설정의 주소 값을 복사하며 자원 요청은 시작하지 않습니다.
     *
     * @param {import('./UA3FSourceVos.js').UA3FAssetOptions | import('./UA3FSourceVos.js').UA3FAssetOptionsVo} [opt={}] 복사할 자원 주소 설정
     */
    constructor(opt?: UA3FAssetOptions | UA3FAssetOptionsVo);
    /** @type {string | null} */ _workerBaseUrl: string | null;
    /** @type {string | null} */ _waterNormalUrl: string | null;
    /**
     * Worker 폴더 주소를 설정합니다.
     *
     * @param {string | null} value 상대 주소도 허용하는 비어 있지 않은 문자열 또는 SDK 기본 경로를 사용하는 null
     */
    set workerBaseUrl(value: string | null);
    /**
     * Worker 자원을 찾을 폴더 주소를 반환합니다.
     *
     * @returns {string | null} 지정한 폴더 주소 또는 SDK 기본 경로를 사용하는 null
     */
    get workerBaseUrl(): string | null;
    /**
     * 수면 법선 이미지 주소를 설정합니다.
     *
     * @param {string | null} value 상대 주소도 허용하는 비어 있지 않은 문자열 또는 SDK 기본 이미지를 사용하는 null
     */
    set waterNormalUrl(value: string | null);
    /**
     * 수면 법선 이미지 주소를 반환합니다.
     *
     * @returns {string | null} 지정한 이미지 주소 또는 SDK 기본 이미지를 사용하는 null
     */
    get waterNormalUrl(): string | null;
}
/**
 * @typedef {object} UA3FRequestOptions
 * @property {Record<string, string>} [headers] 공통 헤더, 기본 빈 객체
 * @property {RequestCredentials} [credentials='same-origin'] 인증 정보 전달 정책
 * @property {RequestCache} [cache='default'] 브라우저 요청 캐시 정책
 */
/**
 * A3F 데이터 요청에 적용할 HTTP 헤더와 인증·캐시 정책을 보관합니다. <br>
 * 정책 값의 종류만 검사하며, 요청 모드와 캐시 정책의 조합 제약은 실제 fetch 호출에서 확인합니다.
 */
declare class UA3FRequestOptionsVo {
    /**
     * UA3FRequestOptionsVo 클래스 생성자입니다. <br>
     * 전달한 헤더를 복사하고 HTTP 헤더 문법과 인증·캐시 정책의 허용값을 확인합니다.
     *
     * @param {import('./UA3FSourceVos.js').UA3FRequestOptions | import('./UA3FSourceVos.js').UA3FRequestOptionsVo} [opt={}] 복사할 요청 정책
     */
    constructor(opt?: UA3FRequestOptions | UA3FRequestOptionsVo);
    /** @type {Record<string, string>} */ _headers: Record<string, string>;
    /** @type {RequestCredentials} */ _credentials: RequestCredentials;
    /** @type {RequestCache} */ _cache: RequestCache;
    /**
     * HTTP 헤더를 검증·정규화한 사본으로 교체합니다.
     *
     * @param {Record<string, string>} value 문자열 값으로 구성한 일반 객체, 빈 객체 허용
     */
    set headers(value: Record<string, string>);
    /**
     * 보관 중인 HTTP 헤더 객체를 반환합니다. <br>
     * 반환 객체를 수정하면 이 VO의 헤더도 변경됩니다.
     *
     * @returns {Record<string, string>} 헤더 이름과 문자열 값을 보관한 객체
     */
    get headers(): Record<string, string>;
    /**
     * 요청의 인증 정보 전달 정책을 설정합니다.
     *
     * @param {RequestCredentials} value omit·same-origin·include 중 하나
     */
    set credentials(value: RequestCredentials);
    /**
     * 요청의 인증 정보 전달 정책을 반환합니다.
     *
     * @returns {RequestCredentials} 보관 중인 fetch credentials 값
     */
    get credentials(): RequestCredentials;
    /**
     * 브라우저의 요청 캐시 정책을 설정합니다.
     *
     * @param {RequestCache} value default·no-store·reload·no-cache·force-cache·only-if-cached 중 하나
     */
    set cache(value: RequestCache);
    /**
     * 브라우저의 요청 캐시 정책을 반환합니다.
     *
     * @returns {RequestCache} 보관 중인 fetch cache 값
     */
    get cache(): RequestCache;
}
/**
 * @typedef {object} UA3FSdkOptions
 * @property {string | null} [terrainLayerName=null] 지정 지형 레이어 이름, null은 SDK 기본 지형
 */
/**
 * A3F 지도 어댑터가 지형 높이를 조회할 레이어 이름을 보관합니다.
 */
declare class UA3FSdkOptionsVo {
    /**
     * UA3FSdkOptionsVo 클래스 생성자입니다.
     *
     * @param {import('./UA3FSourceVos.js').UA3FSdkOptions | import('./UA3FSourceVos.js').UA3FSdkOptionsVo} [opt={}] 복사할 지형 레이어 설정
     */
    constructor(opt?: UA3FSdkOptions | UA3FSdkOptionsVo);
    /** @type {string | null} */ _terrainLayerName: string | null;
    /**
     * 지형 조회에 사용할 레이어 이름을 설정합니다.
     *
     * @param {string | null} value 비어 있지 않은 레이어 이름 또는 SDK 기본 지형을 사용하는 null
     */
    set terrainLayerName(value: string | null);
    /**
     * 지형 조회에 사용할 레이어 이름을 반환합니다.
     *
     * @returns {string | null} 지정한 레이어 이름 또는 SDK 기본 지형을 사용하는 null
     */
    get terrainLayerName(): string | null;
}
/**
 * @typedef {object} UA3FTerrainChange
 * @property {Array<number> | null} [boundsXY=null] EPSG:3857 월드 XY 경계, null은 전체 영역
 */
/**
 * 지형이 변경된 영역을 월드 좌표(EPSG:3857)의 XY 경계로 전달합니다. <br>
 * 입력 경계와 조회 결과를 각각 복사하며, null은 전체 지형이 변경되었음을 나타냅니다.
 */
declare class UA3FTerrainChangeVo {
    /**
     * UA3FTerrainChangeVo 클래스 생성자입니다.
     *
     * @param {import('./UA3FSourceVos.js').UA3FTerrainChange | import('./UA3FSourceVos.js').UA3FTerrainChangeVo} [opt={}] 복사할 지형 변경 영역
     */
    constructor(opt?: UA3FTerrainChange | UA3FTerrainChangeVo);
    /** @type {Array<number> | null} */ _boundsXY: Array<number> | null;
    /**
     * 변경된 지형 영역의 경계를 검증하고 복사합니다.
     *
     * @param {Array<number> | null} value 월드 좌표(EPSG:3857)의 유한한 [minX, minY, maxX, maxY] 또는 전체 영역을 뜻하는 null
     * @throws {TypeError} 경계가 네 값으로 구성되지 않거나 최솟값이 최댓값보다 큰 경우
     */
    set boundsXY(value: Array<number> | null);
    /**
     * 변경된 지형 영역의 경계를 반환합니다.
     *
     * @returns {Array<number> | null} 월드 좌표(EPSG:3857)의 [minX, minY, maxX, maxY] 사본 또는 전체 영역을 뜻하는 null
     */
    get boundsXY(): Array<number> | null;
}
type UA3FAssetOptions = {
    /**
     * UWorker.js와 task/를 포함하는 Worker 폴더
     */
    workerBaseUrl?: string | null | undefined;
    /**
     * 수면 법선 이미지 주소
     */
    waterNormalUrl?: string | null | undefined;
};
type UA3FRequestOptions = {
    /**
     * 공통 헤더, 기본 빈 객체
     */
    headers?: Record<string, string> | undefined;
    /**
     * 인증 정보 전달 정책
     */
    credentials?: RequestCredentials | undefined;
    /**
     * 브라우저 요청 캐시 정책
     */
    cache?: RequestCache | undefined;
};
type UA3FSdkOptions = {
    /**
     * 지정 지형 레이어 이름, null은 SDK 기본 지형
     */
    terrainLayerName?: string | null | undefined;
};
type UA3FTerrainChange = {
    /**
     * EPSG:3857 월드 XY 경계, null은 전체 영역
     */
    boundsXY?: number[] | null | undefined;
};

/**
 * @typedef {object} UA3FDataSourceCO
 * @property {typeof fetch} [fetchFunction] 외부 요청 함수, 생략 시 전역 fetch
 * @property {import('../vo/UA3FSourceVos.js').UA3FRequestOptions | import('../vo/UA3FSourceVos.js').UA3FRequestOptionsVo} [requestOptionsVo] 공통 요청 정책
 */
/**
 * 외부 fetch와 공통 요청 정책을 A3F 세션의 모든 데이터 로더에 연결합니다.
 */
declare class UA3FDataSource {
    /**
     * UA3FDataSource 클래스 생성자입니다. <br>
     * 요청 함수는 전달받은 참조를 사용하고, 공통 정책과 헤더는 복사하여 보관합니다.
     *
     * @param {import('./UA3FDataSource.js').UA3FDataSourceCO} [opt={}] 외부 요청 함수와 공통 요청 정책
     */
    constructor(opt?: UA3FDataSourceCO);
    /** @type {typeof fetch} */ _fetchFunction: typeof fetch;
    /**
     * @type {import('../vo/UA3FSourceVos.js').UA3FRequestOptionsVo}
     */ _requestOptionsVo: UA3FRequestOptionsVo;
    /**
     * 공통 정책에 요청별 설정을 합쳐 외부 fetch로 요청합니다. <br>
     * 같은 헤더 이름에는 공통 정책, Request 입력, init.headers 순서로 뒤의 값을 적용합니다. <br>
     * 인증·캐시 설정은 init, Request 입력, 공통 정책 순서로 먼저 있는 값을 사용합니다. <br>
     * 요청 본문과 응답 본문을 읽거나 복제하지 않으며 요청 실패를 그대로 전달합니다.
     *
     * @param {RequestInfo | URL} input 외부 fetch에 그대로 전달할 요청 주소 또는 Request
     * @param {RequestInit} [init={}] 이번 요청에 적용할 설정, body와 signal은 전달받은 참조 유지
     * @returns {Promise<Response>} 외부 fetch가 반환한 Response
     */
    request(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    /**
     * 앞으로 시작할 요청의 외부 함수를 교체합니다. <br>
     * 이미 시작한 요청은 변경하지 않습니다.
     *
     * @param {typeof fetch} value 표준 fetch와 같은 요청·응답 계약을 지키는 함수
     */
    set fetchFunction(value: typeof fetch);
    /**
     * 빌린 외부 fetch 함수 참조를 반환합니다.
     *
     * @returns {typeof fetch} 현재 요청에 사용하는 함수 참조
     */
    get fetchFunction(): typeof fetch;
    /**
     * 앞으로 시작할 요청의 공통 정책을 검증·복사합니다. <br>
     * 이미 시작한 요청은 변경하지 않습니다.
     *
     * @param {undefined | import('../vo/UA3FSourceVos.js').UA3FRequestOptions | import('../vo/UA3FSourceVos.js').UA3FRequestOptionsVo} value 새 공통 정책, undefined이면 기본 정책으로 초기화
     */
    set requestOptionsVo(value: undefined | UA3FRequestOptions | UA3FRequestOptionsVo);
    /**
     * 공통 요청 정책의 독립 사본을 반환합니다.
     *
     * @returns {import('../vo/UA3FSourceVos.js').UA3FRequestOptionsVo} 공통 요청 정책의 독립 사본
     */
    get requestOptionsVo(): UA3FRequestOptionsVo;
}
/**
 * 세션 자원 경로를 생성 시점의 문서 기준 절대 URL로 고정합니다.
 */
declare class UA3FAssetResolver {
    /**
     * UA3FAssetResolver 클래스 생성자입니다. <br>
     * 상대 경로를 현재 문서 기준으로 해석하고 두 경로를 독립 보관합니다.
     *
     * @param {import('../vo/UA3FSourceVos.js').UA3FAssetOptions | import('../vo/UA3FSourceVos.js').UA3FAssetOptionsVo} [opt={}] 자원 설정
     */
    constructor(opt?: UA3FAssetOptions | UA3FAssetOptionsVo);
    /**
     * @type {import('../vo/UA3FSourceVos.js').UA3FAssetOptionsVo}
     */ _optionsVo: UA3FAssetOptionsVo;
    /**
     * 생성할 때 보관한 절대 주소와 값이 같은 설정만 허용합니다. <br>
     * 이 setter는 상대 주소를 다시 해석하지 않으며 경로 변경에는 새 resolver가 필요합니다.
     *
     * @param {undefined | import('../vo/UA3FSourceVos.js').UA3FAssetOptions | import('../vo/UA3FSourceVos.js').UA3FAssetOptionsVo} value 비교할 자원 설정, undefined이면 기본 설정과 비교
     * @throws {TypeError} Worker 폴더 또는 물결 이미지 주소가 현재 보관한 값과 다른 경우
     */
    set optionsVo(value: undefined | UA3FAssetOptions | UA3FAssetOptionsVo);
    /**
     * 해석 완료 자원 설정의 독립 사본을 반환합니다.
     *
     * @returns {import('../vo/UA3FSourceVos.js').UA3FAssetOptionsVo} 해석 완료 자원 설정의 독립 사본
     */
    get optionsVo(): UA3FAssetOptionsVo;
    /**
     * 명시 Worker 폴더를 우선하고 생략 시 호출 시점 SDK 루트의 worker/를 절대 주소로 반환합니다. <br>
     * 전역값은 변경하지 않습니다.
     *
     * @param {undefined | string | null} sdkSourceUrl SDK 소스 루트, 생략하면 준비된 SDK의 UDEF.path를 사용하며 둘 다 없으면 null 반환
     * @returns {string | null} Worker 폴더
     */
    resolveWorkerBaseUrl(sdkSourceUrl: undefined | string | null): string | null;
}
/**
 * @typedef {import('@union3d/app/U3dApp').U3dApp} UA3FSdkApp
 * @typedef {function(import('../vo/UA3FSourceVos.js').UA3FTerrainChangeVo):void} UA3FTerrainListener
 * @typedef {object} UA3FMapAdapter
 * @property {function():ReturnType<UA3FSdkApp['getCamera']>} getCamera 빌린 카메라 조회
 * @property {function():HTMLElement | null} getContainer 빌린 지도 요소 조회, 미준비 시 null
 * @property {function():import('three').WebGLRenderer | null} getRenderer 빌린 렌더러 조회, 미준비 시 null
 * @property {function(import('@union3d/3dLayer/U3dLayer').U3dLayer):void} addLayer 레이어 등록, 소유권 이전 없음
 * @property {function(import('@union3d/3dLayer/U3dLayer').U3dLayer):void} removeLayer 지정 레이어 연결 제거
 * @property {function():void} requestRender 지도 화면 갱신 요청
 * @property {function():boolean} isTerrainEnabled 지형 보정 사용 여부
 * @property {function(import('three').Vector3Like):number | null} getTerrainRenderHeight 월드 좌표(EPSG:3857) 점의 렌더 Z, 미수신은 null
 * @property {function(UA3FTerrainListener):(function():void)} subscribeTerrainChanged 독립 변경 구독, 반복 호출 가능한 해제 함수 반환
 * @typedef {object} UA3FSdkAdapterCO
 * @property {UA3FSdkApp} app 빌린 준비 지도 앱
 * @property {import('../vo/UA3FSourceVos.js').UA3FSdkOptions | import('../vo/UA3FSourceVos.js').UA3FSdkOptionsVo} [optionsVo] 지도 연결 설정
 */
/**
 * SDK 공개 API를 A3F 지도 연결 계약으로 변환합니다.
 */
declare class UA3FSdkAdapter {
    /**
     * UA3FSdkAdapter 클래스 생성자입니다. <br>
     * 지도 공개 메서드를 확인하고 설정만 복사합니다.
     *
     * @param {import('./UA3FDataSource.js').UA3FSdkAdapterCO} opt 지도 연결, app 필수, 지도는 빌리고 optionsVo는 기본 설정으로 독립 복사
     */
    constructor(opt: UA3FSdkAdapterCO);
    /** @type {UA3FSdkApp} */ _app: UA3FSdkApp;
    /**
     * @type {import('../vo/UA3FSourceVos.js').UA3FSdkOptionsVo}
     */ _optionsVo: UA3FSdkOptionsVo;
    /**
     * 기존 연결을 보호하기 위해 동일 지도 참조만 허용합니다.
     *
     * @param {import('@union3d/app/U3dApp').U3dApp} value 생성 시 동일 참조
     */
    set app(value: U3dApp);
    /**
     * 빌린 지도 앱을 반환합니다.
     *
     * @returns {import('@union3d/app/U3dApp').U3dApp} 빌린 지도 앱
     */
    get app(): U3dApp;
    /**
     * 후속 지형 조회에 사용할 설정을 독립 복사합니다.
     *
     * @param {undefined | import('../vo/UA3FSourceVos.js').UA3FSdkOptions | import('../vo/UA3FSourceVos.js').UA3FSdkOptionsVo} value 새 지형 선택 설정, undefined이면 SDK 기본 지형을 사용
     */
    set optionsVo(value: undefined | UA3FSdkOptions | UA3FSdkOptionsVo);
    /**
     * 지도 연결 설정의 독립 사본을 반환합니다.
     *
     * @returns {import('../vo/UA3FSourceVos.js').UA3FSdkOptionsVo} 지도 연결 설정의 독립 사본
     */
    get optionsVo(): UA3FSdkOptionsVo;
    /**
     * 지도 소유 카메라를 조회합니다. <br>
     * 해제하거나 교체하지 않습니다.
     *
     * @returns {undefined | import('@union3d/core/UCamera').UCamera} 지도 소유 카메라
     */
    getCamera(): undefined | UCamera;
    /**
     * 지도 소유 컨테이너를 조회합니다. <br>
     * DOM을 만들지 않습니다.
     *
     * @returns {HTMLElement | null} 지도 소유 컨테이너
     */
    getContainer(): HTMLElement | null;
    /**
     * 표시 효과가 요청할 때만 렌더러를 조회합니다. <br>
     * 미지원·미준비는 null이며 소유권은 지도에 유지됩니다.
     *
     * @returns {import('three').WebGLRenderer | null} 준비된 렌더러 또는 null
     */
    getRenderer(): WebGLRenderer | null;
    /**
     * 호출자 소유 레이어를 지도에 연결합니다.
     *
     * @param {import('@union3d/3dLayer/U3dLayer').U3dLayer} layer 등록 레이어
     */
    addLayer(layer: U3dLayer): void;
    /**
     * 지정 레이어만 지도에서 분리합니다. <br>
     * 지도나 다른 세션의 레이어를 종료하지 않습니다.
     *
     * @param {import('@union3d/3dLayer/U3dLayer').U3dLayer} layer 연결 제거 레이어, 등록 때와 동일 참조
     */
    removeLayer(layer: U3dLayer): void;
    /**
     * SDK 공개 API에 화면 갱신을 요청합니다.
     */
    requestRender(): void;
    /**
     * 설정한 지형 또는 SDK 기본 지형 레이어가 보이는지 조회합니다. <br>
     * 지형 조회 미지원은 사용하지 않는 상태입니다.
     *
     * @returns {boolean} 조회한 지형 레이어가 보이면 true, 없거나 숨겨져 있으면 false
     */
    isTerrainEnabled(): boolean;
    /**
     * 캐시를 사용하지 않고 SDK의 월드 렌더 Z를 조회합니다. <br>
     * 미터 고도로 변환하지 않으며 미수신·무효값은 null로 정규화합니다.
     *
     * @param {import('three').Vector3Like} world 조회 점, 유한한 월드 좌표(EPSG:3857) x·y·z
     * @returns {number | null} 월드 렌더 Z 또는 null
     */
    getTerrainRenderHeight(world: Vector3Like): number | null;
    /**
     * SDK 공개 고도·지도 로딩 완료를 전체 지형 변경으로 전달합니다. <br>
     * 구독마다 고유 키를 사용하고 해제 함수는 해당 구독만 제거하며 반복·실패 후 재시도를 허용합니다.
     *
     * @param {import('./UA3FDataSource.js').UA3FTerrainListener} listener 변경 수신 함수
     * @returns {function():void} 이 구독만 해제
     */
    subscribeTerrainChanged(listener: UA3FTerrainListener): () => void;
}
type UA3FDataSourceCO = {
    /**
     * 외부 요청 함수, 생략 시 전역 fetch
     */
    fetchFunction?: typeof fetch | undefined;
    /**
     * 공통 요청 정책
     */
    requestOptionsVo?: UA3FRequestOptionsVo | UA3FRequestOptions | undefined;
};
type UA3FSdkApp = U3dApp;
type UA3FTerrainListener = (arg0: UA3FTerrainChangeVo) => void;
type UA3FMapAdapter = {
    /**
     * 빌린 카메라 조회
     */
    getCamera: () => ReturnType<UA3FSdkApp["getCamera"]>;
    /**
     * 빌린 지도 요소 조회, 미준비 시 null
     */
    getContainer: () => HTMLElement | null;
    /**
     * 빌린 렌더러 조회, 미준비 시 null
     */
    getRenderer: () => WebGLRenderer | null;
    /**
     * 레이어 등록, 소유권 이전 없음
     */
    addLayer: (arg0: U3dLayer) => void;
    /**
     * 지정 레이어 연결 제거
     */
    removeLayer: (arg0: U3dLayer) => void;
    /**
     * 지도 화면 갱신 요청
     */
    requestRender: () => void;
    /**
     * 지형 보정 사용 여부
     */
    isTerrainEnabled: () => boolean;
    /**
     * 월드 좌표(EPSG:3857) 점의 렌더 Z, 미수신은 null
     */
    getTerrainRenderHeight: (arg0: Vector3Like) => number | null;
    /**
     * 독립 변경 구독, 반복 호출 가능한 해제 함수 반환
     */
    subscribeTerrainChanged: (arg0: UA3FTerrainListener) => (() => void);
};
type UA3FSdkAdapterCO = {
    /**
     * 빌린 준비 지도 앱
     */
    app: UA3FSdkApp;
    /**
     * 지도 연결 설정
     */
    optionsVo?: UA3FSdkOptionsVo | UA3FSdkOptions | undefined;
};

/**
 * 수치 시간의 재생·탐색과 최신 프레임 적용을 제어합니다.
 *
 * @group A3F
 * @summary 수치 시간의 재생·탐색과 최신 프레임 적용을 제어합니다.
 */
declare class UA3FTimelineController {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FTimelineController 클래스 생성자입니다. <br>
     * 작은 프레임 정의·정책 사본을 보관하며 통신·재생을 시작하지 않습니다.
     *
     * @param {UA3FTimelineControllerCO} opt 프레임, 재생 정책 및 프레임 공급자 설정
     */
    constructor(opt: UA3FTimelineControllerCO);
    /** @type {Array<import('./vo/UA3FDataVos.js').UA3FFrameVo>} */
    _frames: Array<UA3FFrameVo>;
    /** @type {UA3FTimelinePlaybackApi} */
    _playbackApi: UA3FTimelinePlaybackApi;
    /** @type {UA3FTimelineRuntime} */
    _state: UA3FTimelineRuntime;
    /**
     * 초기 캐시 정책과 첫 목표 프레임을 준비합니다. <br>
     * 동시 초기화는 같은 진행 Promise에 합류하며 오류 상태에서는 명시 재시도합니다.
     *
     * @returns {Promise<void>} 초기 프레임 적용 완료 또는 원래 실패
     */
    initialize(): Promise<void>;
    /**
     * 현재 목표에서 재생하며 경계에서는 진행 방향의 시작점으로 이동합니다. <br>
     * 단일 시각 자료는 재생하지 않고 준비 중이면 현재 요청 완료를 기다립니다.
     *
     * @returns {Promise<void>} 재생 시작 또는 재시작 프레임 준비 완료
     */
    play(): Promise<void>;
    /**
     * 재생 의도를 멈추고 이미 요청한 현재 목표는 완료할 수 있게 유지합니다.
     */
    pause(): void;
    /**
     * 원본 수치 시각으로 이동하고 재생을 멈춥니다. <br>
     * 범위 밖은 양 끝으로 제한하며 같은 시각 이하의 마지막 프레임을 선택합니다.
     *
     * @param {number} time 유한 원본 수치 시각, 원본 단위를 바꾸지 않음
     * @returns {Promise<void>} 최신 목표 적용 완료 또는 취소·실패
     */
    seek(time: number): Promise<void>;
    /**
     * 목록 위치가 아닌 등록 frameIndex에 해당하는 프레임으로 이동합니다.
     *
     * @param {number} frameIndex 등록된 0 이상 안전 정수 frameIndex, 비연속 등록 가능
     * @returns {Promise<void>} 목표 프레임 적용 완료 또는 취소·실패
     */
    seekFrame(frameIndex: number): Promise<void>;
    /**
     * 등록 목록의 이전·다음 위치로 한 프레임 이동하며 양 끝에서 멈춥니다.
     *
     * @param {1 | -1} direction 다음1 또는 이전-1, 등록 ID의 증가량이 아님
     * @returns {Promise<void>} 목표 프레임 적용 완료 또는 실패
     */
    step(direction: 1 | -1): Promise<void>;
    /**
     * 실제 경과 초만큼 원본 수치 시간을 진행합니다. <br>
     * 로딩·구성 중에는 누적 시간을 따라잡지 않고 현재 시각을 유지합니다.
     *
     * @param {number} deltaSeconds 실제 경과 시간(0 이상의 유한한 초)
     * @returns {Promise<void>} 필요 프레임 적용 또는 이번 진행 처리 완료
     */
    advance(deltaSeconds: number): Promise<void>;
    /**
     * 재생 배속과 방향을 바꾸며 새로운 파일을 즉시 요청하지 않습니다.
     *
     * @param {number} value 0 아닌 유한 배속, 양수 정방향·음수 역방향
     */
    setPlaybackRate(value: number): void;
    /**
     * 실제 1초에 진행할 원본 수치 시간량을 바꿉니다.
     *
     * @param {number} value 양의 유한 원본 시간값/초, 원본 단위가 초라는 뜻이 아님
     */
    setSourceUnitsPerSecond(value: number): void;
    /**
     * 시간 범위 끝의 반복 여부를 바꿉니다.
     *
     * @param {boolean} value 반복 재생이면 true
     */
    setLoop(value: boolean): void;
    /**
     * 로딩 정책을 원자적으로 적용하고 같은 목표를 다시 준비합니다. <br>
     * 초기화 성공 후 호출하며 설정 중 중복 변경은 거부합니다.
     *
     * @param {import('./vo/UA3FPlaybackVos.js').UA3FFrameCacheOptionsVo} optionsVo 검증·복사할 full/streaming 정책, null 불가
     * @returns {Promise<void>} 설정·목표 프레임 준비 완료 또는 원래 실패
     */
    configureCache(optionsVo: UA3FFrameCacheOptionsVo): Promise<void>;
    /**
     * 원본 목표와 실제 적용 프레임을 구분한 순간 사본을 반환합니다. <br>
     * 캐시 진행은 조회 시 갱신하며 오류 객체만 원래 참조로 보존합니다.
     *
     * @returns {import('./vo/UA3FPlaybackVos.js').UA3FTimelineStateVo} 작은 값·정책·캐시 상태 사본
     */
    getState(): UA3FTimelineStateVo;
    /**
     * 변경 상태 구독을 등록하고 해제 함수를 반환합니다. <br>
     * 구독 함수가 예외를 던지면 그 구독을 제거하고 error 상태로 기록합니다.
     *
     * @param {UA3FTimelineStateListener} listener 상태 사본 수신 함수, 숫자 버퍼·공유 자원 소유권 없음
     * @returns {UA3FTimelineSubscription} 해당 구독만 제거하는 멱등 함수
     */
    subscribe(listener: UA3FTimelineStateListener): UA3FTimelineSubscription;
    /**
     * 자신의 표시·보존 권한과 구독을 정리합니다. <br>
     * 실제 완료 전인 요청은 순번으로 차단하고 늦은 lease를 반납하며 빌린 공급자·공유 워커 자체는 해제하지 않습니다. <br>
     * 표시 정리가 실패하면 원인과 권한을 보존하며 dispose를 다시 호출해 정리할 수 있습니다.
     */
    dispose(): void;
    /**
     * 관리 상태의 외부 교체를 거부합니다.
     *
     * @param {Array<import('./vo/UA3FDataVos.js').UA3FFrameVo>} value 엔진 점검용 프레임 사본, 외부 변경 금지, 기존 값 또는 참조와 동일한 경우만 허용
     */
    set frames(value: Array<UA3FFrameVo>);
    /**
     * 엔진 점검용 프레임 사본, 외부 변경 금지 값을 반환합니다.
     *
     * @returns {Array<import('./vo/UA3FDataVos.js').UA3FFrameVo>} 엔진 점검용 프레임 사본, 외부 변경 금지
     */
    get frames(): Array<UA3FFrameVo>;
    /**
     * 관리 상태의 외부 교체를 거부합니다.
     *
     * @param {UA3FTimelinePlaybackApi} value 빌린 재생 공급자, 기존 값 또는 참조와 동일한 경우만 허용
     */
    set playbackApi(value: UA3FTimelinePlaybackApi);
    /**
     * 빌린 재생 공급자 값을 반환합니다.
     *
     * @returns {UA3FTimelinePlaybackApi} 빌린 재생 공급자
     */
    get playbackApi(): UA3FTimelinePlaybackApi;
    /**
     * 관리 상태의 외부 교체를 거부합니다.
     *
     * @param {UA3FTimelineRuntime} value 엔진 내부 상태 참조, 외부 변경 금지, 기존 값 또는 참조와 동일한 경우만 허용
     */
    set state(value: UA3FTimelineRuntime);
    /**
     * 엔진 내부 상태 참조, 외부 변경 금지 값을 반환합니다.
     *
     * @returns {UA3FTimelineRuntime} 엔진 내부 상태 참조, 외부 변경 금지
     */
    get state(): UA3FTimelineRuntime;
    #private;
}

/**
 * 실제 재생 호출에서 SDK 준비 API를 취득하고 동일한 인수를 기존 재생 구현에 전달합니다. <br>
 * Session 준비와 직접 공급자 호출이 같은 SDK·수명 계약을 사용하며 Worker·레이어·캐시 정리는 반환한 원래 공급자가 담당합니다.
 *
 * @param {import('../layer/U3dModelA3FLayer.js').U3dModelA3FLayer} layer 준비된 빌린 레이어, 데이터셋 일치 필요
 * @param {import('../backend/vo/UA3FSceneVos.js').UA3FMetadataVo} metadataVo 타임라인 프레임을 가진 루트 문서, 변경 없음
 * @param {import('../backend/UA3FSpatialManager.js').UA3FSpatialManager} spatialManager 루트를 읽은 빌린 공간 관리자, 해제하지 않음
 * @param {UA3FSpatialCamera} camera 절대 월드 카메라, 선택 시 행렬 갱신
 * @param {HTMLElement} viewport CSS pixel 높이를 읽을 빌린 지도 요소
 * @param {string} heightPolicyId 높이 정책 ID
 * @param {import('../backend/vo/UA3FPlaybackVos.js').UA3FCacheBudgetOptionsVo} [cacheBudgetOptionsVo] 프레임 버퍼 예산 사본
 * @param {AbortSignal | null} [signal=null] 빌린 준비 취소 신호, 세션 소유 초기 준비 취소 신호
 * @param {typeof fetch} [fetchFunction] 공통 데이터 요청 함수
 * @param {import('./UA3FDataSource.js').UA3FMapAdapter | null} [adapter=null] 빌린 지도 연결 계약
 * @param {import('../vo/UA3FSourceVos.js').UA3FAssetOptionsVo} [assetOptionsVo] 독립 복사할 자원 경로, 해석한 절대 Worker 폴더·이미지 URL을 독립 복사
 * @returns {Promise<UA3FTimelinePlaybackApi & { reportFlowError: function(unknown):void; getFlowFields: function():Array<import('../backend/vo/UA3FDataVos.js').UA3FFieldVo>; getVectorFields: function():Array<import('../backend/vo/UA3FPlaybackVos.js').UA3FVectorFieldVo>; getFlowConfiguration: function():import('../vo/UA3FSessionVos.js').UA3FFlowConfigurationVo; getFlowStatus: function():import('../vo/UA3FSessionVos.js').UA3FFlowStatusVo; configureFlowSettings: function(import('./a3fTimeSeries.runtime.js').UA3FFlowConfiguration | import('../vo/UA3FSessionVos.js').UA3FFlowConfigurationVo):Promise<void>; getDisplayCapabilities: function():import('../vo/UA3FSessionVos.js').UA3FDisplayCapabilitiesVo; getDisplayOptions: function():import('../vo/UA3FSessionVos.js').UA3FDisplayOptionsVo; configureSurfaceDisplay: function(import('./a3fTimeSeries.runtime.js').UA3FDisplayOptions | import('../vo/UA3FSessionVos.js').UA3FDisplayOptionsVo):Promise<import('../vo/UA3FSessionVos.js').UA3FDisplayOptionsVo>; getColorFields: function():Array<import('../backend/vo/UA3FDataVos.js').UA3FFieldVo>; getColorOptions: function():import('../vo/UA3FSessionVos.js').UA3FColorOptionsVo | null; configureScalarColor: function(import('../vo/UA3FSessionVos.js').UA3FColorOptionsVo):import('../vo/UA3FSessionVos.js').UA3FColorOptionsVo; configureAnalysisPalette: function(Array<string> | null):void; configureFlowPalette: function(Array<string> | null):void; configureFlow: function(import('../backend/vo/UA3FPlaybackVos.js').UA3FVectorFieldVo, import('../backend/vo/UA3FPlaybackVos.js').UA3FFlowOptionsVo, import('../backend/vo/UA3FPlaybackVos.js').UA3FParticleFlowOptionsVo=):Promise<void>; updateFlow: function(import('three').WebGLRenderer, number, boolean):boolean; setFlowRunning: function(boolean):void; dispose: function():Promise<void>; refreshSpatial: function():Promise<void>; configureColor: function(string):void; configureWater: function(boolean):void; configureTransparentWater: function(boolean):void; configureWaterOpacity: function(number):void; updateWater: function(number):boolean; getWaterStatus: function():{ enabled: boolean; transparent: boolean; opacity: number; available: boolean; }; inspect: function():object; configureDisplay: function(import('../backend/vo/UA3FSceneVos.js').UA3FHeightDisplayVo, import('../backend/vo/UA3FDataVos.js').UA3FFieldVo | null, number, boolean, number):void; getBudgetStatus: function():import('../backend/vo/UA3FPlaybackVos.js').UA3FCacheBudgetStatusVo; }>}
 */
declare function createA3FPlayback(layer: U3dModelA3FLayer, metadataVo: UA3FMetadataVo, spatialManager: UA3FSpatialManager, camera: UA3FSpatialCamera, viewport: HTMLElement, heightPolicyId: string, cacheBudgetOptionsVo?: UA3FCacheBudgetOptionsVo, signal?: AbortSignal | null, fetchFunction?: typeof fetch, adapter?: UA3FMapAdapter | null, assetOptionsVo?: UA3FAssetOptionsVo): Promise<UA3FTimelinePlaybackApi & {
    reportFlowError: (arg0: unknown) => void;
    getFlowFields: () => Array<UA3FFieldVo>;
    getVectorFields: () => Array<UA3FVectorFieldVo>;
    getFlowConfiguration: () => UA3FFlowConfigurationVo;
    getFlowStatus: () => UA3FFlowStatusVo;
    configureFlowSettings: (arg0: UA3FFlowConfiguration | UA3FFlowConfigurationVo) => Promise<void>;
    getDisplayCapabilities: () => UA3FDisplayCapabilitiesVo;
    getDisplayOptions: () => UA3FDisplayOptionsVo;
    configureSurfaceDisplay: (arg0: UA3FDisplayOptions | UA3FDisplayOptionsVo) => Promise<UA3FDisplayOptionsVo>;
    getColorFields: () => Array<UA3FFieldVo>;
    getColorOptions: () => UA3FColorOptionsVo | null;
    configureScalarColor: (arg0: UA3FColorOptionsVo) => UA3FColorOptionsVo;
    configureAnalysisPalette: (arg0: Array<string> | null) => void;
    configureFlowPalette: (arg0: Array<string> | null) => void;
    configureFlow: (arg0: UA3FVectorFieldVo, arg1: UA3FFlowOptionsVo, arg2: UA3FParticleFlowOptionsVo | undefined) => Promise<void>;
    updateFlow: (arg0: WebGLRenderer, arg1: number, arg2: boolean) => boolean;
    setFlowRunning: (arg0: boolean) => void;
    dispose: () => Promise<void>;
    refreshSpatial: () => Promise<void>;
    configureColor: (arg0: string) => void;
    configureWater: (arg0: boolean) => void;
    configureTransparentWater: (arg0: boolean) => void;
    configureWaterOpacity: (arg0: number) => void;
    updateWater: (arg0: number) => boolean;
    getWaterStatus: () => {
        enabled: boolean;
        transparent: boolean;
        opacity: number;
        available: boolean;
    };
    inspect: () => object;
    configureDisplay: (arg0: UA3FHeightDisplayVo, arg1: UA3FFieldVo | null, arg2: number, arg3: boolean, arg4: number) => void;
    getBudgetStatus: () => UA3FCacheBudgetStatusVo;
}>;
/**
 * @typedef {object} UA3FDatasetReaderCO
 * @property {import('./UA3FDataSource.js').UA3FDataSource | import('./UA3FDataSource.js').UA3FDataSourceCO} [dataSource] 공통 요청 설정 또는 빌린 인스턴스
 * @property {number} [maxMetadataBytes=4194304] 압축 해제된 메타정보의 바이트 상한
 */
/**
 * 지도 표시 전에 메타정보 한 문서만 읽어 외부 화면용 요약을 반환합니다.
 */
declare class UA3FDatasetReader {
    /**
     * UA3FDatasetReader 클래스 생성자입니다. <br>
     * 공통 요청 소스와 읽기 상한만 보관합니다.
     *
     * @param {import('./a3fTimeSeries.runtime.js').UA3FDatasetReaderCO} [opt={}] 조회 설정, 외부 소스 인스턴스는 빌리고 일반 요청 설정은 복사
     */
    constructor(opt?: UA3FDatasetReaderCO);
    /**
     * @type {import('./UA3FDataSource.js').UA3FDataSource}
     */ _dataSource: UA3FDataSource;
    /** @type {number} */ _maxMetadataBytes: number;
    /**
     * 후속 조회에서 사용할 메타정보 바이트 상한을 보관합니다.
     *
     * @param {number} value 양의 안전 정수인 바이트 수, 기본 4194304, 이미 시작한 요청에는 영향 없음
     */
    set maxMetadataBytes(value: number);
    /**
     * 한 문서의 압축 해제된 raw 바이트 상한을 반환합니다.
     *
     * @returns {number} 한 문서의 압축 해제된 raw 바이트 상한
     */
    get maxMetadataBytes(): number;
    /**
     * 조회 중 연결을 바꾸지 않도록 동일한 소스 참조만 허용합니다.
     *
     * @param {import('./UA3FDataSource.js').UA3FDataSource} value 생성 시 동일 참조
     */
    set dataSource(value: UA3FDataSource);
    /**
     * 이 조회기가 빌린 공통 데이터 소스를 반환합니다.
     *
     * @returns {import('./UA3FDataSource.js').UA3FDataSource} 이 조회기가 빌린 공통 데이터 소스
     */
    get dataSource(): UA3FDataSource;
    /**
     * HTTP(S) 메타정보 한 문서만 읽습니다. <br>
     * 동시 호출은 독립이며 하위 문서·바이너리를 읽지 않고 응답 URL·원본 시간·높이 정책을 요약으로 전달합니다.
     *
     * @param {string} metadataUrl 문서 주소, 브라우저에서는 document.baseURI 기준 상대 URL 허용
     * @param {AbortSignal | null} [signal=null] 취소 신호, 전달 신호는 동일 참조 유지
     * @returns {Promise<import('../vo/UA3FSessionVos.js').UA3FDatasetInfoVo>} 독립 자료 요약
     */
    read(metadataUrl: string, signal?: AbortSignal | null): Promise<UA3FDatasetInfoVo>;
}
/**
 * @typedef {import('@union3d/app/U3dApp').U3dApp} UA3FSessionApp
 * @typedef {import('./a3fTimeSeries.runtime.js').createA3FPlayback} UA3FPlaybackFactory
 * @typedef {Awaited<ReturnType<UA3FPlaybackFactory>>} UA3FSessionPlayback
 * @typedef {function(import('../vo/UA3FSessionVos.js').UA3FSessionStateVo):void} UA3FSessionListener
 * @typedef {object} UA3FSessionCO
 * @property {UA3FSessionApp} [app] 기본 어댑터용 지도 앱, adapter 생략 시 필수, 빌린 참조
 * @property {import('./UA3FDataSource.js').UA3FMapAdapter} [adapter] 외부 지도 연결 계약, 빌린 참조이며 세션이 종료하지 않음
 * @property {import('../vo/UA3FSourceVos.js').UA3FAssetOptions | import('../vo/UA3FSourceVos.js').UA3FAssetOptionsVo} [assetOptions] Worker 폴더·수면 이미지 주소, 복사·해석 후 고정
 * @property {import('./UA3FDataSource.js').UA3FDataSourceCO | import('./UA3FDataSource.js').UA3FDataSource} [dataSource] 일반 데이터 소스 설정 또는 빌린 인스턴스, 생략 시 기본 fetch
 * @property {import('../vo/UA3FSessionVos.js').UA3FSessionOptions | import('../vo/UA3FSessionVos.js').UA3FSessionOptionsVo} [options] 일반 세션 설정, 기본값 적용 후 복사
 * @typedef {object} UA3FSessionEntry
 * @property {number} generation 양의 요청 세대
 * @property {AbortController} abort 초기 형상 준비 취소 소유자
 * @property {import('../backend/UA3FSpatialManager.js').UA3FSpatialManager | null} spatial 소유 공간 관리자
 * @property {import('../layer/U3dModelA3FLayer.js').U3dModelA3FLayer | null} layer 소유 레이어
 * @property {boolean} attached 앱 등록 시도 여부
 * @property {UA3FSessionPlayback | null} playback 소유 프레임 공급자
 * @property {import('../backend/UA3FTimelineController.js').UA3FTimelineController | null} controller 소유 재생 제어기
 * @property {null | function():void} unsubscribe 소유 상태 구독 해제 함수
 * @property {Array<import('../backend/vo/UA3FDataVos.js').UA3FFrameVo>} frames 독립 프레임 정의
 * @property {Map<number, number>} positions 등록 ID에서 0 기반 위치로의 조회표
 * @property {UA3FSessionClock | null} clock 세션이 소유한 시계와 숨김 이벤트 연결
 * @property {Promise<void> | null} configuration 진행 중 캐시 정책 변경
 * @property {Set<Promise<unknown>>} displayConfigurations 진행 중 표시 설정 작업
 * @property {Set<Promise<void>>} flowConfigurations 진행 중 흐름 설정 작업
 * @property {import('../vo/UA3FSessionVos.js').UA3FDatasetInfoVo | null} datasetInfoVo 원본 JSON을 제외한 독립 자료 요약
 * @property {Promise<void> | null} spatialRefresh 진행 중 정지 화면 공간 선택 갱신
 * @typedef {object} UA3FSessionClock
 * @property {typeof requestAnimationFrame | null} request 빌린 RAF 예약 함수, 수동 모드에서는 null
 * @property {typeof cancelAnimationFrame | null} cancel 빌린 RAF 취소 함수, 수동 모드에서는 null
 * @property {Document | null} document 빌린 가시성 이벤트 문서
 * @property {null | function():void} visibilityListener 원래 가시성 구독 참조
 * @property {number | null} raf 현재 예약 ID, 0도 유효하며 미예약은 null
 * @property {number | null} previous 직전 RAF의 단조 증가 밀리초, 기준 미확정은 null
 * @property {number} revision 취소한 콜백을 구분하는 시계 세대
 * @property {Promise<void> | null} pending 실제 프레임 적용을 포함한 진행 중 시간 갱신
 * @typedef {object} UA3FSessionRuntime
 * @property {number} generation 최신 자료 열기 순번
 * @property {boolean} disposed 종료 요청 여부
 * @property {UA3FSessionEntry | null} entry 현재 또는 준비 중인 소유 자원
 * @property {Promise<import('../vo/UA3FSessionVos.js').UA3FSessionStateVo> | null} pending 마지막 자료 열기 작업
 * @property {Promise<void> | null} disposal 반복 종료 호출이 공유하는 작업
 * @property {Set<UA3FSessionListener>} listeners 외부 상태 구독자
 * @property {import('../vo/UA3FSessionVos.js').UA3FSessionStateVo} info 내부 상태 원본
 * @property {object} notificationToken 중첩 상태 알림을 구분하는 내부 세대 표식, 생성·알림마다 새 객체이며 외부에 전달하지 않음
 */
/**
 * 외부 개발자가 UI 없이 하나의 A3F 데이터셋을 열고 재생·탐색하고 종료하도록 엔진 부품을 조합합니다.
 */
declare class UA3FPlaybackSession {
    /**
     * UA3FPlaybackSession 클래스 생성자입니다. <br>
     * 빌린 지도와 독립 설정만 보관하며 DOM·레이어·워커·통신을 생성하지 않습니다.
     *
     * @param {import('./a3fTimeSeries.runtime.js').UA3FSessionCO} opt 준비된 지도와 선택 설정, app 또는 adapter 필수
     */
    constructor(opt: UA3FSessionCO);
    /** @type {UA3FSessionApp | null} */ _app: UA3FSessionApp | null;
    /**
     * @type {import('./UA3FDataSource.js').UA3FAssetResolver}
     */ _assetResolver: UA3FAssetResolver;
    /** @type {import('./UA3FDataSource.js').UA3FMapAdapter} */ _adapter: UA3FMapAdapter;
    /**
     * @type {import('./UA3FDataSource.js').UA3FDataSource}
     */ _dataSource: UA3FDataSource;
    /**
     * @type {import('../vo/UA3FSessionVos.js').UA3FSessionOptionsVo}
     */ _optionsVo: UA3FSessionOptionsVo;
    /** @type {UA3FSessionRuntime} */ _state: UA3FSessionRuntime;
    /**
     * 기존 연결을 취소·정리한 뒤 새 자료의 첫 프레임을 표시합니다. <br>
     * 동시 호출에서는 마지막 호출만 공개합니다.
     *
     * @param {string} metadataUrl 문서 주소, 브라우저에서는 현재 페이지 기준 상대 주소 허용
     * @returns {Promise<import('../vo/UA3FSessionVos.js').UA3FSessionStateVo>} 첫 프레임 준비 상태
     */
    open(metadataUrl: string): Promise<UA3FSessionStateVo>;
    /**
     * 등록된 프레임 ID로 탐색하고 실제 적용 뒤 지도를 갱신합니다. <br>
     * 목록 순번과 프레임 ID를 혼용하지 않습니다.
     *
     * @param {number} frameIndex 등록 프레임 ID, 0 이상 안전 정수인 등록 ID, 비연속 ID 허용
     * @returns {Promise<void>} 표시 완료
     */
    seekFrame(frameIndex: number): Promise<void>;
    /**
     * 원본 수치 시간으로 탐색합니다. <br>
     * 원본 단위와 실제 적용 프레임은 재생 상태 VO로 조회합니다.
     *
     * @param {number} time 문서 원본 시각, 유한한 원본 수치 시각, 단위는 metadata.timeline.unit, 범위 밖은 엔진 규칙으로 양 끝 제한
     * @returns {Promise<void>} 표시 완료
     */
    seek(time: number): Promise<void>;
    /**
     * 현재 자료를 재생합니다. <br>
     * 자동 모드에서는 세션당 하나의 RAF를 구동하며 단일 시각 자료는 재생하지 않습니다.
     *
     * @returns {Promise<void>} 현재 자료를 재생합니다.
     */
    play(): Promise<void>;
    /**
     * 재생 의도를 멈추고 자동 RAF 예약을 해제합니다. <br>
     * 이미 요청한 프레임 적용은 완료될 수 있습니다.
     */
    pause(): void;
    /**
     * 재생 배속과 방향을 바꾸고 다음 자동 시간 기준을 초기화합니다.
     *
     * @param {number} value 재생 배속, 0이 아닌 유한 배속
     */
    setPlaybackRate(value: number): void;
    /**
     * 실제 1초마다 진행할 원본 시간량을 설정합니다. <br>
     * 원본 단위를 초로 바꾸지 않습니다.
     *
     * @param {number} value 원본 시간량, 양의 유한 원본 시간값/실제 초
     */
    setSourceUnitsPerSecond(value: number): void;
    /**
     * 원본 시간 범위 끝에서 반복할지 설정합니다.
     *
     * @param {boolean} value 반복 여부, true이면 양방향 범위 순환
     */
    setLoop(value: boolean): void;
    /**
     * 재생을 멈추고 등록 목록의 이전 또는 다음 프레임으로 이동합니다.
     *
     * @param {1 | -1} direction 목록 진행 방향
     * @returns {Promise<void>} 표시 완료
     */
    step(direction: 1 | -1): Promise<void>;
    /**
     * UI가 원본 시간과 등록 ID를 연결할 독립 프레임 VO 목록을 반환합니다. <br>
     * 미준비·종료 상태에서는 빈 목록입니다.
     *
     * @returns {Array<import('../backend/vo/UA3FDataVos.js').UA3FFrameVo>} UI가 원본 시간과 등록 ID를 연결할 독립 프레임 VO 목록
     */
    getFrames(): Array<UA3FFrameVo>;
    /**
     * 현재 연결의 주소·공간·시간·높이 정책을 독립 사본으로 조회합니다. <br>
     * 미준비·교체·종료 시 null이며 원본 JSON·공간 관리자·GPU 자원은 반환하지 않습니다.
     *
     * @returns {import('../vo/UA3FSessionVos.js').UA3FDatasetInfoVo | null} 현재 자료 요약 또는 미준비 null
     */
    getDatasetInfo(): UA3FDatasetInfoVo | null;
    /**
     * 현재 백엔드의 실제 예약·상주·보호 바이트와 한도를 기존 예산 VO의 독립 사본으로 반환합니다. <br>
     * 미준비·교체·종료는 null이며 조회로 정책·캐시를 변경하지 않습니다.
     *
     * @returns {import('../backend/vo/UA3FPlaybackVos.js').UA3FCacheBudgetStatusVo | null} 실제 합산 예산 사본 또는 미준비 null
     */
    getBudgetStatus(): UA3FCacheBudgetStatusVo | null;
    /**
     * 현재 연결한 분석 레이어의 실제 가시성을 조회합니다. <br>
     * 미준비·교체·종료 시 false이며 레이어 참조는 공개하지 않습니다.
     *
     * @returns {boolean} 현재 연결한 분석 레이어의 실제 가시성
     */
    getVisible(): boolean;
    /**
     * 현재 세션의 분석 레이어만 표시하거나 숨기고 상태·화면을 갱신합니다. <br>
     * 지도와 다른 세션의 레이어는 변경하지 않습니다.
     *
     * @param {boolean} value 분석 자료 표시 여부
     */
    setVisible(value: boolean): void;
    /**
     * 정지 중 카메라 이동을 현재 표시 시각으로 다시 선택합니다. <br>
     * 중복 호출은 같은 작업을 공유하고 재생·프레임 준비·정책 변경 중에는 동기 거부합니다. <br>
     * 갱신 중 명령은 거부하고 자료 교체·종료는 취소 후 작업 종결을 기다려 늦은 화면 갱신을 막습니다.
     *
     * @returns {Promise<void>} 현재 정지 시각의 공간 선택·표시 갱신 완료
     */
    refreshSpatial(): Promise<void>;
    /**
     * UI의 0 기반 목록 위치를 실제 등록 프레임 ID로 변환하여 탐색합니다.
     *
     * @param {number} position 화면 목록 위치, 0..frameCount-1의 안전 정수, 소수·범위 밖·null 불가
     * @returns {Promise<void>} 표시 완료
     */
    seekPosition(position: number): Promise<void>;
    /**
     * 수동 모드에서 외부 렌더 루프의 실제 경과 초로 원본 시간과 흐름·수면을 갱신합니다. <br>
     * 로딩 중 중복 시간은 누적하지 않습니다.
     *
     * @param {number} deltaSeconds 유한한 0 이상 실제 경과 초, autoTick=false에서만 허용
     * @returns {Promise<void>} 시간 갱신 완료
     */
    advance(deltaSeconds: number): Promise<void>;
    /**
     * 외부 UI의 캐시 설정을 VO로 복사하여 적용합니다. <br>
     * 생략한 필드는 현재 정책을 유지하며 성공 후 세션 설정을 갱신합니다.
     *
     * @param {UA3FFrameCacheOptionsVoCO | import('../backend/vo/UA3FPlaybackVos.js').UA3FFrameCacheOptionsVo} options 캐시 설정, 일반 객체 허용, 슬롯은 2 이상·동시성은 1 이상·바이트 한도는 양수 또는 null
     * @returns {Promise<void>} 적용 완료
     */
    configureCache(options: UA3FFrameCacheOptionsVoCO | UA3FFrameCacheOptionsVo): Promise<void>;
    /**
     * 현재 백엔드가 준비한 명시적 벡터 정의를 읽기 전용 사본으로 조회합니다. <br>
     * open 완료 통지 중에도 조회할 수 있으며 백엔드 미준비·종료 시 빈 목록입니다.
     *
     * @returns {Array<import('../backend/vo/UA3FPlaybackVos.js').UA3FVectorFieldVo>} 현재 백엔드가 준비한 명시적 벡터 정의를 읽기 전용 사본으로 조회합니다. <br>
     * open 완료 통지 중에도 조회할 수 있으며 백엔드 미준비·종료 시 빈 목록입니다.
     */
    getVectorFields(): Array<UA3FVectorFieldVo>;
    /**
     * 모든 준비 노드의 지원 성분·단위를 가진 Float32 정점 필드를 독립 사본으로 조회합니다.
     *
     * @returns {Array<import('../backend/vo/UA3FDataVos.js').UA3FFieldVo>} 모든 준비 노드의 지원 성분·단위를 가진 Float32 정점 필드를 독립 사본으로 조회합니다.
     */
    getFlowFields(): Array<UA3FFieldVo>;
    /**
     * 외부 UI의 흐름 설정을 독립 후보로 준비하고 전체 성공 후 공개합니다. <br>
     * 실패 시 기존 흐름·재생을 유지하고 흐름 오류만 전달합니다.
     *
     * @param {import('./a3fTimeSeries.runtime.js').UA3FFlowConfiguration | import('../vo/UA3FSessionVos.js').UA3FFlowConfigurationVo} options 일반 객체·중첩 부분 설정 허용, 즉시 사본 생성
     * @returns {Promise<void>} 전체 적용
     */
    configureFlow(options: UA3FFlowConfiguration | UA3FFlowConfigurationVo): Promise<void>;
    /**
     * 현재 모든 준비 노드의 높이 범위와 마스크·수면 필드를 독립 VO로 반환합니다. <br>
     * 미준비·종료 시 기능 없음으로 반환합니다.
     *
     * @returns {import('../vo/UA3FSessionVos.js').UA3FDisplayCapabilitiesVo} 현재 모든 준비 노드의 높이 범위와 마스크·수면 필드를 독립 VO로 반환합니다.
     */
    getDisplayCapabilities(): UA3FDisplayCapabilitiesVo;
    /**
     * 외부 UI의 일반 객체로 높이·마스크·수면을 변경합니다. <br>
     * 후보 준비 실패 시 기존 정책을 유지하고 성공 후 상태와 화면을 갱신합니다.
     *
     * @param {import('./a3fTimeSeries.runtime.js').UA3FDisplayOptions | import('../vo/UA3FSessionVos.js').UA3FDisplayOptionsVo} options 생략 값은 현재 값 유지, 중첩 수면 부분 설정 허용, 입력 즉시 복사, 자원 소유권 이전 없음
     * @returns {Promise<void>} 적용 완료
     */
    configureDisplay(options: UA3FDisplayOptions | UA3FDisplayOptionsVo): Promise<void>;
    /**
     * 현재 준비된 노드 모두에서 표시 가능한 색상 필드를 이름·단위·성분·통계의 독립 사본으로 반환합니다.
     *
     * @returns {Array<import('../backend/vo/UA3FDataVos.js').UA3FFieldVo>} 현재 준비된 노드 모두에서 표시 가능한 색상 필드를 이름·단위·성분·통계의 독립 사본으로 반환합니다.
     */
    getColorFields(): Array<UA3FFieldVo>;
    /**
     * 일반 설정 객체로 면 색상을 변경하고 적용된 고정 범위를 상태 구독자에게 전달합니다. <br>
     * 실패 시 기존 표시·상태를 유지합니다.
     *
     * @param {import('../vo/UA3FSessionVos.js').UA3FColorOptions | import('../vo/UA3FSessionVos.js').UA3FColorOptionsVo} options 색상 설정, 필드 ID는 메타정보 기준·성분은 0 기반·palette는 #RRGGBB 5개 또는 null
     * @returns {Promise<void>} 적용 완료
     */
    configureColor(options: UA3FColorOptions | UA3FColorOptionsVo): Promise<void>;
    /**
     * 외부 UI가 변경해도 내부 상태에 영향을 주지 않는 연결·재생·경고 사본을 반환합니다.
     *
     * @returns {import('../vo/UA3FSessionVos.js').UA3FSessionStateVo} 외부 UI가 변경해도 내부 상태에 영향을 주지 않는 연결·재생·경고 사본
     */
    getState(): UA3FSessionStateVo;
    /**
     * 현재 상태를 즉시 전달하고 이후 변경을 구독합니다. <br>
     * 각 구독자는 독립 상태 사본을 받습니다.
     *
     * @param {import('./a3fTimeSeries.runtime.js').UA3FSessionListener} listener 상태 수신 함수
     * @returns {function():void} 구독 해제
     */
    subscribe(listener: UA3FSessionListener): () => void;
    /**
     * 진행 중 요청을 취소하고 모든 자료 열기 작업과 소유 레이어 정리를 기다립니다. <br>
     * 빌린 지도 앱은 종료하지 않습니다.
     *
     * @returns {Promise<void>} 진행 중 요청을 취소하고 모든 자료 열기 작업과 소유 레이어 정리를 기다립니다.
     */
    dispose(): Promise<void>;
    /**
     * 현재 데이터 소스의 동일 참조만 허용하며 재연결은 새 세션으로 수행합니다.
     *
     * @param {import('./UA3FDataSource.js').UA3FDataSource} value 생성 시 동일 참조만 허용
     */
    set dataSource(value: UA3FDataSource);
    /**
     * 요청에 사용하는 데이터 소스 참조를 반환합니다. <br>
     * 외부 인스턴스의 수명은 종료하지 않습니다.
     *
     * @returns {import('./UA3FDataSource.js').UA3FDataSource} 요청에 사용하는 데이터 소스 참조
     */
    get dataSource(): UA3FDataSource;
    /**
     * 같은 연결 참조만 허용하여 실행 중 자원의 연결 대상을 유지합니다.
     *
     * @param {import('./UA3FDataSource').UA3FMapAdapter} value 생성 시 동일 참조만 허용
     */
    set adapter(value: UA3FMapAdapter);
    /**
     * 세션이 빌린 지도 연결 어댑터를 반환합니다.
     *
     * @returns {import('./UA3FDataSource').UA3FMapAdapter} 세션이 빌린 지도 연결 어댑터
     */
    get adapter(): UA3FMapAdapter;
    /**
     * 소유 연결의 경로를 보호하기 위해 동일 참조만 허용합니다.
     *
     * @param {import('./UA3FDataSource.js').UA3FAssetResolver} value 생성 시 동일 참조
     */
    set assetResolver(value: UA3FAssetResolver);
    /**
     * 생성 시 고정한 세션 자원 주소 해석기를 반환합니다.
     *
     * @returns {import('./UA3FDataSource.js').UA3FAssetResolver} 생성 시 고정한 세션 자원 주소 해석기
     */
    get assetResolver(): UA3FAssetResolver;
    /**
     * 동일 지도 참조만 허용하여 실행 중 자원의 소유 경계를 유지합니다.
     *
     * @param {import('./a3fTimeSeries.runtime.js').UA3FSessionApp | null} value 생성 시 연결한 지도(외부 어댑터만 사용하면 null, 교체 불가)
     */
    set app(value: UA3FSessionApp | null);
    /**
     * 빌린 지도 앱 참조를 반환합니다. <br>
     * 외부 어댑터만 전달한 세션은 null이며 지도 호출은 어댑터를 사용합니다.
     *
     * @returns {import('@union3d/app/U3dApp').U3dApp | null} 빌린 지도 앱 참조
     */
    get app(): U3dApp | null;
    /**
     * 최초 자료 열기 전에만 세션 설정을 독립 사본으로 교체합니다.
     *
     * @param {import('../vo/UA3FSessionVos.js').UA3FSessionOptionsVo} value 다음 설정, generation이 0인 최초 준비 전에만 허용
     */
    set optionsVo(value: UA3FSessionOptionsVo);
    /**
     * 중첩 VO까지 복사한 세션 설정을 반환합니다.
     *
     * @returns {import('../vo/UA3FSessionVos.js').UA3FSessionOptionsVo} 중첩 VO까지 복사한 세션 설정
     */
    get optionsVo(): UA3FSessionOptionsVo;
    /**
     * 실행 상태 직접 교체를 거부하고 자료·재생·탐색·종료 API로 변경하도록 제한합니다.
     *
     * @param {import('../vo/UA3FSessionVos.js').UA3FSessionStateVo} value 교체 시도 상태
     */
    set state(value: UA3FSessionStateVo);
    /**
     * 내부 실행 자료 대신 외부 전달용 상태 사본을 반환합니다.
     *
     * @returns {import('../vo/UA3FSessionVos.js').UA3FSessionStateVo} 내부 실행 자료 대신 외부 전달용 상태 사본
     */
    get state(): UA3FSessionStateVo;
    #private;
}
type UA3FFlowConfiguration = UA3FFlowConfiguration$1;
type UA3FDatasetReaderCO = {
    /**
     * 공통 요청 설정 또는 빌린 인스턴스
     */
    dataSource?: UA3FDataSource | UA3FDataSourceCO | undefined;
    /**
     * 압축 해제된 메타정보의 바이트 상한
     */
    maxMetadataBytes?: number | undefined;
};
type UA3FDisplayOptions = UA3FDisplayOptions$1;
type UA3FSessionApp = U3dApp;
type UA3FPlaybackFactory = typeof createA3FPlayback;
type UA3FSessionPlayback = Awaited<ReturnType<UA3FPlaybackFactory>>;
type UA3FSessionListener = (arg0: UA3FSessionStateVo) => void;
type UA3FSessionCO = {
    /**
     * 기본 어댑터용 지도 앱, adapter 생략 시 필수, 빌린 참조
     */
    app?: U3dApp | undefined;
    /**
     * 외부 지도 연결 계약, 빌린 참조이며 세션이 종료하지 않음
     */
    adapter?: UA3FMapAdapter | undefined;
    /**
     * Worker 폴더·수면 이미지 주소, 복사·해석 후 고정
     */
    assetOptions?: UA3FAssetOptionsVo | UA3FAssetOptions | undefined;
    /**
     * 일반 데이터 소스 설정 또는 빌린 인스턴스, 생략 시 기본 fetch
     */
    dataSource?: UA3FDataSource | UA3FDataSourceCO | undefined;
    /**
     * 일반 세션 설정, 기본값 적용 후 복사
     */
    options?: UA3FSessionOptionsVo | UA3FSessionOptions | undefined;
};
type UA3FSessionEntry = {
    /**
     * 양의 요청 세대
     */
    generation: number;
    /**
     * 초기 형상 준비 취소 소유자
     */
    abort: AbortController;
    /**
     * 소유 공간 관리자
     */
    spatial: UA3FSpatialManager | null;
    /**
     * 소유 레이어
     */
    layer: U3dModelA3FLayer | null;
    /**
     * 앱 등록 시도 여부
     */
    attached: boolean;
    /**
     * 소유 프레임 공급자
     */
    playback: UA3FSessionPlayback | null;
    /**
     * 소유 재생 제어기
     */
    controller: UA3FTimelineController | null;
    /**
     * 소유 상태 구독 해제 함수
     */
    unsubscribe: null | (() => void);
    /**
     * 독립 프레임 정의
     */
    frames: Array<UA3FFrameVo>;
    /**
     * 등록 ID에서 0 기반 위치로의 조회표
     */
    positions: Map<number, number>;
    /**
     * 세션이 소유한 시계와 숨김 이벤트 연결
     */
    clock: UA3FSessionClock | null;
    /**
     * 진행 중 캐시 정책 변경
     */
    configuration: Promise<void> | null;
    /**
     * 진행 중 표시 설정 작업
     */
    displayConfigurations: Set<Promise<unknown>>;
    /**
     * 진행 중 흐름 설정 작업
     */
    flowConfigurations: Set<Promise<void>>;
    /**
     * 원본 JSON을 제외한 독립 자료 요약
     */
    datasetInfoVo: UA3FDatasetInfoVo | null;
    /**
     * 진행 중 정지 화면 공간 선택 갱신
     */
    spatialRefresh: Promise<void> | null;
};
type UA3FSessionClock = {
    /**
     * 빌린 RAF 예약 함수, 수동 모드에서는 null
     */
    request: typeof requestAnimationFrame | null;
    /**
     * 빌린 RAF 취소 함수, 수동 모드에서는 null
     */
    cancel: typeof cancelAnimationFrame | null;
    /**
     * 빌린 가시성 이벤트 문서
     */
    document: Document | null;
    /**
     * 원래 가시성 구독 참조
     */
    visibilityListener: null | (() => void);
    /**
     * 현재 예약 ID, 0도 유효하며 미예약은 null
     */
    raf: number | null;
    /**
     * 직전 RAF의 단조 증가 밀리초, 기준 미확정은 null
     */
    previous: number | null;
    /**
     * 취소한 콜백을 구분하는 시계 세대
     */
    revision: number;
    /**
     * 실제 프레임 적용을 포함한 진행 중 시간 갱신
     */
    pending: Promise<void> | null;
};
type UA3FSessionRuntime = {
    /**
     * 최신 자료 열기 순번
     */
    generation: number;
    /**
     * 종료 요청 여부
     */
    disposed: boolean;
    /**
     * 현재 또는 준비 중인 소유 자원
     */
    entry: UA3FSessionEntry | null;
    /**
     * 마지막 자료 열기 작업
     */
    pending: Promise<UA3FSessionStateVo> | null;
    /**
     * 반복 종료 호출이 공유하는 작업
     */
    disposal: Promise<void> | null;
    /**
     * 외부 상태 구독자
     */
    listeners: Set<UA3FSessionListener>;
    /**
     * 내부 상태 원본
     */
    info: UA3FSessionStateVo;
    /**
     * 중첩 상태 알림을 구분하는 내부 세대 표식, 생성·알림마다 새 객체이며 외부에 전달하지 않음
     */
    notificationToken: object;
};

/**
 * 공개 세션 API에 선택형 설정 패널을 연결합니다.
 */
declare class UA3FSettingsView {
    /**
     * UA3FSettingsView 클래스 생성자입니다. <br>
     * 컨테이너·세션을 빌려 보관하고 옵션만 복사합니다.
     *
     * @param {import('./a3fTimeSeries.js').UA3FSettingsViewCO} opt 생성 설정, container·session 필수
     */
    constructor(opt: UA3FSettingsViewCO);
    /** @type {HTMLElement} */ _container: HTMLElement;
    /** @type {UA3FSettingsViewCO['session']} */ _session: UA3FSettingsViewCO["session"];
    /**
     * @type {import('./vo/UA3FSessionVos.js').UA3FSettingsOptionsVo}
     */ _optionsVo: UA3FSettingsOptionsVo;
    /** @type {UA3FSettingsRuntime} */ _state: UA3FSettingsRuntime;
    /**
     * 소유 패널과 이벤트·구독을 연결합니다. <br>
     * 중복 호출은 무동작이며 실패하면 생성한 UI를 정리합니다.
     */
    mount(): void;
    /**
     * 현재 상태와 기능 목록을 다시 조회합니다. <br>
     * 입력 중인 영역의 초안은 보존하며 별도 타이머나 재생 루프를 만들지 않습니다.
     */
    refresh(): void;
    /**
     * 자기 DOM·이벤트·구독만 해제합니다. <br>
     * 진행 중 세션 명령은 소유하지 않으며 늦은 결과의 DOM 접근은 세대로 차단합니다.
     */
    dispose(): void;
    /**
     * 현재 컨테이너 참조만 허용합니다.
     *
     * @param {HTMLElement} value 생성 시 동일 참조만 허용
     */
    set container(value: HTMLElement);
    /**
     * 빌린 컨테이너를 반환합니다.
     *
     * @returns {HTMLElement} 빌린 컨테이너
     */
    get container(): HTMLElement;
    /**
     * 현재 세션 참조만 허용합니다.
     *
     * @param {import('./a3fTimeSeries').UA3FPlaybackSession} value 생성 시 동일 참조만 허용
     */
    set session(value: UA3FPlaybackSession);
    /**
     * 빌린 세션을 반환합니다.
     *
     * @returns {import('./a3fTimeSeries').UA3FPlaybackSession} 빌린 세션
     */
    get session(): UA3FPlaybackSession;
    /**
     * mount 전 옵션을 검증·복사합니다. <br>
     * mount 후 구성 변경은 새 View로 수행합니다.
     *
     * @param {undefined | import('./vo/UA3FSessionVos.js').UA3FSettingsOptions | import('./vo/UA3FSessionVos.js').UA3FSettingsOptionsVo} value 부착 전 적용할 설정, 영역 배열까지 복사하며 undefined이면 기본 설정으로 초기화
     */
    set optionsVo(value: undefined | UA3FSettingsOptions | UA3FSettingsOptionsVo);
    /**
     * 패널 옵션의 독립 사본을 반환합니다.
     *
     * @returns {import('./vo/UA3FSessionVos.js').UA3FSettingsOptionsVo} 패널 옵션의 독립 사본
     */
    get optionsVo(): UA3FSettingsOptionsVo;
    /**
     * 현재 UI 상태의 동일 참조만 허용합니다.
     *
     * @param {import('./a3fTimeSeries.js').UA3FSettingsRuntime} value 생성 시 연결한 UI 상태(교체 불가)
     */
    set state(value: UA3FSettingsRuntime);
    /**
     * 외부 변경 없이 점검할 소유 UI 상태 참조를 반환합니다.
     *
     * @returns {import('./a3fTimeSeries.js').UA3FSettingsRuntime} 외부 변경 없이 점검할 소유 UI 상태 참조
     */
    get state(): UA3FSettingsRuntime;
    #private;
}
/**
 * UA3FTimelineView 생성자 옵션입니다.
 *
 * @typedef {object} UA3FTimelineViewCO_Content
 * @property {HTMLElement} container 소유 섹션을 추가할 빌린 컨테이너
 * @property {import('./core/a3fTimeSeries.runtime.js').UA3FPlaybackSession} [session] 빌린 세션, 신규 외부 사용의 권장 연결
 * @property {import('./backend/UA3FTimelineController.js').UA3FTimelineController} [controller] 기존 예제 전환용 제어기, session과 동시 지정 불가
 * @typedef {UA3FTimelineViewCO_Content} UA3FTimelineViewCO
 */
/**
 * 기존 A3F 위젯 타입 이름은 공통 View의 같은 계약을 가리킵니다.
 *
 * @typedef {UTimelineClock} UA3FTimelineClock
 * @typedef {UTimelineSeekEvent} UA3FTimelineSeekEvent
 * @typedef {function(UTimelineSeekEvent):void} UA3FTimelineSeekListener
 * @typedef {UTimelineWidget} UA3FTimelineWidget
 * @typedef {UTimelineClockViewModel} UA3FTimelineClockViewModel
 * @typedef {UTimelineAnimationViewModel} UA3FTimelineAnimationViewModel
 * @typedef {UTimelineAnimationWidget} UA3FTimelineAnimationWidget
 * @typedef {UTimelineUnsubscribe} UA3FTimelineUnsubscribe
 * @typedef {{dispose:function():void}} UA3FTimelineAnimationSubscription
 * @typedef {{subscribe:function(function():void):UA3FTimelineAnimationSubscription}} UA3FTimelineObservable
 * @typedef {UTimelineCommandEvent} UA3FTimelineCommandEvent
 */
/**
 * View가 소유하는 표시 자원과 정리 참조입니다.
 *
 * @typedef {object} UA3FTimelineViewRuntime
 * @property {UA3FTimelineAdapter | null} adapter 소유 공통 포트 연결기
 * @property {import('../timeline/timeline.js').UTimelineView | null} commonView 소유 공통 HTML View
 * @property {number} commandGeneration 전용 명령 완료를 구분하는 세대
 * @property {Error|null} commonError 전용 오류와 구분한 공통 View의 마지막 명령 오류
 * @property {HTMLElement | null} root 소유 섹션
 * @property {UA3FTimelineClock | null} clock 가상 표시 시계
 * @property {UA3FTimelineWidget | null} timeline 소유 위젯
 * @property {number | null} epoch 가상 기준 날짜
 * @property {number | null} poll 상태 조회 interval ID, 재생 시간 진행 없음
 * @property {Array<import('./backend/vo/UA3FDataVos.js').UA3FFrameVo>} frames 읽기 전용 표시 목록
 * @property {string | null} sourceKey 표시 중인 자료 구분 키
 * @property {string | null} inputError 다음 입력 또는 명령 성공까지 보존할 UI 검증 오류
 * @property {boolean} disposed 종료 여부
 * @property {UA3FTimelineUnsubscribe | null} unsubscribe 상태 구독 해제
 * @property {UA3FTimelineSeekListener | null} seekListener 위젯의 원래 리스너 참조
 * @property {Array<{target: EventTarget, type: string, handler: EventListener}>} listeners DOM 리스너 원래 참조
 * @property {ResizeObserver | null} resizeObserver 소유 크기 감시
 * @property {UA3FTimelineClockViewModel | null} clockViewModel 소유 ClockViewModel
 * @property {UA3FTimelineAnimationViewModel | null} animationViewModel 원형 위젯의 모델
 * @property {(function(number):string)|null} animationTimeFormatter 자료 변경 때 재바인딩할 원래 공통 포맷터, 미부착 null
 * @property {UA3FTimelineAnimationWidget | null} animation 소유 원형 위젯
 * @property {Array<UA3FTimelineAnimationSubscription>} animationSubscriptions 배속·재생 UI 구독
 * @property {boolean} syncingAnimation 상태 반영을 입력으로 다시 처리하지 않도록 막는 구간
 * @property {boolean} animationQueued UI 복합 변경 전달 대기 여부
 * @property {UA3FTimelineUnsubscribe | null} realtimeUnsubscribe 실시간 명령 차단 구독 해제
 * @property {string} policyKey 마지막 적용 정책 표시 키
 * @property {number | null} lastTime 마지막으로 표시한0기반 연속 프레임 위치
 */
/**
 * A3F Session 또는 기존 Controller를 공통 재생 포트로 연결합니다.
 */
declare class UA3FTimelineAdapter {
    /**
     * @ignore
     */
    static OPT_KEYS: string[];
    /**
     * UA3FTimelineAdapter 클래스 생성자입니다. <br>
     * 단일 재생 대상의 공개 API를 검사하고 값 상태만 준비합니다.
     *
     * @param {import('./a3fTimeSeries.js').UA3FTimelineAdapterCO} opt 빌릴 재생기 설정
     */
    constructor(opt: UA3FTimelineAdapterCO);
    /** @type {import('./core/a3fTimeSeries.runtime.js').UA3FPlaybackSession|null} */ _session: UA3FPlaybackSession | null;
    /**
     * @type {import('./backend/UA3FTimelineController.js').UA3FTimelineController | null}
     */ _controller: UA3FTimelineController | null;
    /** @type {UA3FTimelineAdapterRuntime} */ _runtime: UA3FTimelineAdapterRuntime;
    /**
     * 현재 공개 상태와 전체 프레임·통계 값을 비교해 같은 길이의 manifest 변경도 식별하고 변경되지 않은 정의의 복사·직렬화는 재사용합니다. <br>
     * 요청 시각은 연속 목록 위치로, 실제 완료 ID는 정수 위치로 변환하며 동일 값 조회는 revision을 유지합니다.
     *
     * @returns {import('../timeline/timeline.js').UTimelineStateVo} 독립 공통 상태
     */
    getState(): UTimelineStateVo;
    /**
     * 캐시 진행처럼 별도 통지가 없는 값을 wrapper 조회 주기에 반영하고 변경된 공통 상태만 전달합니다. <br>
     * 시간 진행·명령 실행은 하지 않습니다.
     *
     * @returns {import('../timeline/timeline.js').UTimelineStateVo} 현재 사본
     */
    refresh(): UTimelineStateVo;
    /**
     * 첫 수신자에서 backend 구독 하나를 연결하고 수신자마다 즉시 독립 상태를 전달합니다. <br>
     * 마지막 해제는 자기 backend 구독만 제거하며 재연결을 허용합니다.
     *
     * @param {UTimelineStateListener} listener 동기 상태 수신 함수, 동기 상태 사본 수신 함수
     * @returns {UTimelineUnsubscribe} 자기 구독 해제
     */
    subscribe(listener: UTimelineStateListener): UTimelineUnsubscribe;
    /**
     * 기존 재생기에 재생을 요청하고 동기 예외·비동기 실패를 Promise로 전달합니다. <br>
     * 재생 Clock은 생성하지 않습니다.
     *
     * @returns {Promise<void>} 재생 요청 완료
     */
    play(): Promise<void>;
    /**
     * 기존 재생 의도만 정지합니다. <br>
     * 진행 중 프레임 준비와 빌린 재생기의 수명은 유지합니다.
     *
     * @returns {Promise<void>} 정지 요청 완료
     */
    pause(): Promise<void>;
    /**
     * 공통 정수 목록 위치를 공개 Session 탐색 또는 Controller의 비연속 원본 ID 탐색으로 전달합니다. <br>
     * 원본 수치 시간을 ID로 사용하지 않습니다.
     *
     * @param {number} position 0 기반 목록 위치, 0..frameCount-1의 안전 정수, null·소수·범위 밖 거부
     * @returns {Promise<void>} 실제 프레임 적용 완료
     */
    seek(position: number): Promise<void>;
    /**
     * 양·음수 유한 배속을 기존 공개 API에 전달합니다. <br>
     * 원본 시간 단위와 초당 시간량은 유지합니다.
     *
     * @param {number} value 배속, 0이 아닌 유한 배율
     * @returns {Promise<void>} 배속 변경 완료
     */
    setPlaybackRate(value: number): Promise<void>;
    /**
     * 기존 공개 step을 사용해 이전·다음 목록 프레임으로 이동합니다. <br>
     * 원본 ID의 증감량은 계산하지 않습니다.
     *
     * @param {1 | -1} direction 목록 이동 방향, null·다른 수치 거부
     * @returns {Promise<void>} 적용 완료
     */
    step(direction: 1 | -1): Promise<void>;
    /**
     * 자기 구독을 해제하고 마지막 축을 유지한 disposed 사본을 전달합니다. <br>
     * Session·Controller·지도·프레임 자원은 종료하지 않으며 통지 실패는 다른 구독과 분리합니다.
     */
    dispose(): void;
    /**
     * A3F 전용 프레임 읽기 영역에 사용할 원본 ID의 0 기반 위치를 반환합니다. <br>
     * 미적용·빈 목록·미등록 ID는 null입니다.
     *
     * @param {number | null} frameIndex 원본 ID, 원본 등록 ID 또는 미적용 null, 비연속 값 허용
     * @returns {number | null} 목록 위치
     */
    getFramePosition(frameIndex: number | null): number | null;
    /**
     * 연결 대상을 보호하며 같은 참조만 허용합니다.
     *
     * @param {import('./a3fTimeSeries').UA3FPlaybackSession | null} value 생성 시 동일 참조, 자원 소유권 이전 없음
     */
    set session(value: UA3FPlaybackSession | null);
    /**
     * 빌린 세션 또는 Controller 연결을 뜻하는 null을 반환합니다.
     *
     * @returns {import('./a3fTimeSeries').UA3FPlaybackSession | null} 빌린 세션 또는 Controller 연결을 뜻하는 null
     */
    get session(): UA3FPlaybackSession | null;
    /**
     * 연결 대상을 보호하며 같은 참조만 허용합니다.
     *
     * @param {import('./backend/UA3FTimelineController.js').UA3FTimelineController | null} value 생성 시 동일 참조, 자원 소유권 이전 없음
     */
    set controller(value: UA3FTimelineController | null);
    /**
     * 빌린 Controller 또는 Session 연결을 뜻하는 null을 반환합니다.
     *
     * @returns {import('./backend/UA3FTimelineController.js').UA3FTimelineController | null} 빌린 Controller 또는 Session 연결을 뜻하는 null
     */
    get controller(): UA3FTimelineController | null;
    /**
     * 실행 상태의 외부 대입을 거부합니다.
     *
     * @param {import('../timeline/vo/UTimelineStateVo.js').UTimelineStateVo} value 대입 불가
     */
    set runtime(value: UTimelineStateVo);
    /**
     * 진단용 독립 공통 상태를 반환하고 내부 구독·실행 참조는 노출하지 않습니다.
     *
     * @returns {import('../timeline/vo/UTimelineStateVo.js').UTimelineStateVo} 진단용 독립 공통 상태를 반환하고 내부 구독·실행 참조는 노출하지 않습니다.
     */
    get runtime(): UTimelineStateVo;
    /**
     * A3F 전용 표시에서 읽을 작은 프레임 정의 사본을 반환합니다.
     *
     * @returns {Array<import('./a3fTimeSeries.js').UA3FTimelineFrame>} 프레임 독립 사본
     */
    get frames(): Array<UA3FFrameVo>;
    #private;
}

type UA3FSettingsPanel = {
    form: HTMLFormElement;
    dirty: boolean;
    busy: boolean;
    error: string | null;
    appliedKey: string | null;
};
type UA3FSettingsRuntime = {
    /**
     * 소유 패널 루트
     */
    root: HTMLElement | null;
    /**
     * UI 종료 여부
     */
    disposed: boolean;
    /**
     * 상태 구독 해제
     */
    unsubscribe: null | (() => void);
    /**
     * 소유 위임 이벤트
     */
    listeners: Map<string, EventListener>;
    /**
     * 영역별 DOM·초안 상태
     */
    panels: Map<UA3FSettingsSection, UA3FSettingsPanel>;
    /**
     * 마지막 독립 상태 사본
     */
    lastState: UA3FSessionStateVo | null;
    /**
     * 자료 식별자
     */
    sourceKey: string | null;
    /**
     * 마지막 세션 상태
     */
    lastStatus: string | null;
    /**
     * 자료·수명 세대, 0 이상 정수
     */
    epoch: number;
    /**
     * 활성 탭
     */
    active: UA3FSettingsSection | null;
    /**
     * 마지막 기능 조회 시각, 밀리초
     */
    capabilityCheckedAt: number;
    /**
     * 영역별 기능 조회 실패
     */
    capabilityErrors: Map<UA3FSettingsSection, string>;
    /**
     * 색상 필드 사본
     */
    colors: Array<UA3FFieldVo>;
    /**
     * 표시 지원 사본
     */
    capabilities: UA3FDisplayCapabilitiesVo;
    /**
     * 명시한 메타 벡터 사본
     */
    metadataVectors: Array<UA3FVectorFieldVo>;
    /**
     * 메타 벡터와 현재 적용 벡터
     */
    vectors: Map<string, UA3FVectorFieldVo>;
};
type UA3FSettingsViewCO = {
    /**
     * 빌린 컨테이너
     */
    container: HTMLElement;
    /**
     * 빌린 공개 세션
     */
    session: UA3FPlaybackSession;
    /**
     * 패널 구성
     */
    options?: UA3FSettingsOptionsVo | UA3FSettingsOptions | undefined;
};
/**
 * UA3FTimelineView 생성자 옵션입니다.
 */
type UA3FTimelineViewCO_Content = {
    /**
     * 소유 섹션을 추가할 빌린 컨테이너
     */
    container: HTMLElement;
    /**
     * 빌린 세션, 신규 외부 사용의 권장 연결
     */
    session?: UA3FPlaybackSession | undefined;
    /**
     * 기존 예제 전환용 제어기, session과 동시 지정 불가
     */
    controller?: UA3FTimelineController | undefined;
};
/**
 * UA3FTimelineView 생성자 옵션입니다.
 */
type UA3FTimelineViewCO = UA3FTimelineViewCO_Content;
/**
 * 기존 A3F 위젯 타입 이름은 공통 View의 같은 계약을 가리킵니다.
 */
type UA3FTimelineClock = UTimelineClock;
/**
 * 기존 A3F 위젯 타입 이름은 공통 View의 같은 계약을 가리킵니다.
 */
type UA3FTimelineSeekEvent = UTimelineSeekEvent;
/**
 * 기존 A3F 위젯 타입 이름은 공통 View의 같은 계약을 가리킵니다.
 */
type UA3FTimelineSeekListener = (arg0: UTimelineSeekEvent) => void;
/**
 * 기존 A3F 위젯 타입 이름은 공통 View의 같은 계약을 가리킵니다.
 */
type UA3FTimelineWidget = UTimelineWidget;
/**
 * 기존 A3F 위젯 타입 이름은 공통 View의 같은 계약을 가리킵니다.
 */
type UA3FTimelineClockViewModel = UTimelineClockViewModel;
/**
 * 기존 A3F 위젯 타입 이름은 공통 View의 같은 계약을 가리킵니다.
 */
type UA3FTimelineAnimationViewModel = UTimelineAnimationViewModel;
/**
 * 기존 A3F 위젯 타입 이름은 공통 View의 같은 계약을 가리킵니다.
 */
type UA3FTimelineAnimationWidget = UTimelineAnimationWidget;
/**
 * 기존 A3F 위젯 타입 이름은 공통 View의 같은 계약을 가리킵니다.
 */
type UA3FTimelineUnsubscribe = UTimelineUnsubscribe;
/**
 * 기존 A3F 위젯 타입 이름은 공통 View의 같은 계약을 가리킵니다.
 */
type UA3FTimelineAnimationSubscription = {
    dispose: () => void;
};
/**
 * 기존 A3F 위젯 타입 이름은 공통 View의 같은 계약을 가리킵니다.
 */
type UA3FTimelineObservable = {
    subscribe: (arg0: () => void) => UA3FTimelineAnimationSubscription;
};
/**
 * 기존 A3F 위젯 타입 이름은 공통 View의 같은 계약을 가리킵니다.
 */
type UA3FTimelineCommandEvent = UTimelineCommandEvent;
/**
 * View가 소유하는 표시 자원과 정리 참조입니다.
 */
type UA3FTimelineViewRuntime = {
    /**
     * 소유 공통 포트 연결기
     */
    adapter: UA3FTimelineAdapter | null;
    /**
     * 소유 공통 HTML View
     */
    commonView: UTimelineView | null;
    /**
     * 전용 명령 완료를 구분하는 세대
     */
    commandGeneration: number;
    /**
     * 전용 오류와 구분한 공통 View의 마지막 명령 오류
     */
    commonError: Error | null;
    /**
     * 소유 섹션
     */
    root: HTMLElement | null;
    /**
     * 가상 표시 시계
     */
    clock: UA3FTimelineClock | null;
    /**
     * 소유 위젯
     */
    timeline: UA3FTimelineWidget | null;
    /**
     * 가상 기준 날짜
     */
    epoch: number | null;
    /**
     * 상태 조회 interval ID, 재생 시간 진행 없음
     */
    poll: number | null;
    /**
     * 읽기 전용 표시 목록
     */
    frames: Array<UA3FFrameVo>;
    /**
     * 표시 중인 자료 구분 키
     */
    sourceKey: string | null;
    /**
     * 다음 입력 또는 명령 성공까지 보존할 UI 검증 오류
     */
    inputError: string | null;
    /**
     * 종료 여부
     */
    disposed: boolean;
    /**
     * 상태 구독 해제
     */
    unsubscribe: UA3FTimelineUnsubscribe | null;
    /**
     * 위젯의 원래 리스너 참조
     */
    seekListener: UA3FTimelineSeekListener | null;
    /**
     * DOM 리스너 원래 참조
     */
    listeners: Array<{
        target: EventTarget;
        type: string;
        handler: EventListener;
    }>;
    /**
     * 소유 크기 감시
     */
    resizeObserver: ResizeObserver | null;
    /**
     * 소유 ClockViewModel
     */
    clockViewModel: UA3FTimelineClockViewModel | null;
    /**
     * 원형 위젯의 모델
     */
    animationViewModel: UA3FTimelineAnimationViewModel | null;
    /**
     * 자료 변경 때 재바인딩할 원래 공통 포맷터, 미부착 null
     */
    animationTimeFormatter: ((arg0: number) => string) | null;
    /**
     * 소유 원형 위젯
     */
    animation: UA3FTimelineAnimationWidget | null;
    /**
     * 배속·재생 UI 구독
     */
    animationSubscriptions: Array<UA3FTimelineAnimationSubscription>;
    /**
     * 상태 반영을 입력으로 다시 처리하지 않도록 막는 구간
     */
    syncingAnimation: boolean;
    /**
     * UI 복합 변경 전달 대기 여부
     */
    animationQueued: boolean;
    /**
     * 실시간 명령 차단 구독 해제
     */
    realtimeUnsubscribe: UA3FTimelineUnsubscribe | null;
    /**
     * 마지막 적용 정책 표시 키
     */
    policyKey: string;
    /**
     * 마지막으로 표시한0기반 연속 프레임 위치
     */
    lastTime: number | null;
};
type UA3FTimelineAdapterCO = {
    /**
     * 빌린 세션, controller와 정확히 하나 선택합니다.
     */
    session?: UA3FPlaybackSession | undefined;
    /**
     * 빌린 기존 제어기, 시간 진행은 호출자가 담당합니다.
     */
    controller?: UA3FTimelineController | undefined;
};

type UA3FTimelineNativeSnapshot = UA3FSessionStateVo | UA3FTimelineStateVo;
type UA3FTimelineAdapterSubscription = {
    listener: UTimelineStateListener;
};
type UA3FTimelineAdapterRuntime = {
    /**
     * 마지막 공통 상태 사본입니다.
     */
    state: UTimelineStateVo;
    /**
     * 실제 값 변화 판별 키입니다.
     */
    signature: string | null;
    /**
     * 값만 복사한 프레임 목록입니다.
     */
    frames: Array<UA3FFrameVo>;
    /**
     * 관찰한 자료 교체·열기 세대입니다.
     */
    sourceGeneration: number;
    /**
     * 직전 조회가 loading 상태인지 여부입니다.
     */
    loading: boolean;
    /**
     * 소유 수신 기록입니다.
     */
    subscriptions: Set<UA3FTimelineAdapterSubscription>;
    /**
     * 단일 backend 구독 해제 함수입니다.
     */
    unsubscribe: UTimelineUnsubscribe | null;
    /**
     * 수신자 통지 중 변경 명령 재진입 차단 여부입니다.
     */
    notifying: boolean;
    /**
     * 자기 연결 종료 여부입니다.
     */
    disposed: boolean;
    /**
     * 격리한 수신자 오류입니다.
     */
    notificationError: Error | null;
};
/**
 * 선택형 HTML 타임라인을 세션의 명령·상태 계약에 연결합니다.
 */
declare class UA3FTimelineView {
    /**
     * @ignore
     */
    static OPT_KEYS: string[];
    /**
     * UA3FTimelineView 클래스 생성자입니다. <br>
     * 컨테이너와 재생 대상의 참조를 보관하며 화면 부착은 mount에서 수행합니다.
     *
     * @param {import('./a3fTimeSeries.js').UA3FTimelineViewCO} opt 필수 container와 재생 대상, session 또는 controller 중 정확히 하나를 지정
     */
    constructor(opt: UA3FTimelineViewCO);
    /** @type {HTMLElement} */ _container: HTMLElement;
    /** @type {import('./core/a3fTimeSeries.runtime.js').UA3FPlaybackSession | null} */ _session: UA3FPlaybackSession | null;
    /**
     * @type {import('./backend/UA3FTimelineController.js').UA3FTimelineController | null}
     */ _controller: UA3FTimelineController | null;
    /** @type {UA3FTimelineViewRuntime} */ _state: UA3FTimelineViewRuntime;
    /** @type {boolean} */ _cleanupRunning: boolean;
    /**
     * 공통 위젯과 전용 설정 구독을 한 번 부착합니다. <br>
     * 조회 타이머는 캐시 표시만 갱신하며 재생 시계는 추가하지 않습니다.
     */
    mount(): void;
    /**
     * 공통 View의 소유 위젯만 현재 크기에 맞춥니다. <br>
     * 부착 전·종료 뒤에는 무동작입니다.
     */
    resize(): void;
    /**
     * 공통 View의 균등 프레임 축 전체를 표시합니다. <br>
     * 원본 시간·재생 범위는 유지합니다.
     */
    fitTimeline(): void;
    /**
     * 실패한 핸들을 보존해 다음 dispose에서만 재시도하고 성공 자원은 다시 해제하지 않습니다. <br>
     * 빌린 Session·Controller·지도·Clock은 종료하지 않습니다.
     */
    dispose(): void;
    /**
     * 내부 종료 상태의 외부 교체를 거부합니다.
     *
     * @param {boolean} value 직접 대입 요청으로 항상 거부하며 UI 상태·소유권을 변경하지 않습니다.
     */
    set cleanupRunning(value: boolean);
    /**
     * 동기 종료 작업의 재진입 차단 상태를 반환합니다.
     *
     * @returns {boolean} 동기 종료 작업의 재진입 차단 상태
     */
    get cleanupRunning(): boolean;
    /**
     * 현재 컨테이너 참조만 허용합니다.
     *
     * @param {HTMLElement} value 기존 컨테이너, 생성 시의 동일 참조만 허용
     */
    set container(value: HTMLElement);
    /**
     * 빌린 컨테이너 참조를 반환합니다.
     *
     * @returns {HTMLElement} 빌린 컨테이너 참조
     */
    get container(): HTMLElement;
    /**
     * 현재 세션 참조만 허용하며 재연결은 새 View로 수행합니다.
     *
     * @param {import('./core/a3fTimeSeries.runtime.js').UA3FPlaybackSession | null} value 기존 세션, 생성 시 동일 참조만 허용
     */
    set session(value: UA3FPlaybackSession | null);
    /**
     * 빌린 세션 또는 기존 예제 연결을 뜻하는 null을 반환합니다.
     *
     * @returns {import('./a3fTimeSeries').UA3FPlaybackSession | null} 빌린 세션 또는 기존 예제 연결을 뜻하는 null
     */
    get session(): UA3FPlaybackSession | null;
    /**
     * 현재 기존 제어기 참조만 허용합니다.
     *
     * @param {import('./backend/UA3FTimelineController.js').UA3FTimelineController | null} value 기존 제어기, 생성 시 동일 참조만 허용
     */
    set controller(value: UA3FTimelineController | null);
    /**
     * 전환용으로 빌린 기존 제어기 또는 세션 연결을 뜻하는 null을 반환합니다.
     *
     * @returns {import('./backend/UA3FTimelineController.js').UA3FTimelineController | null} 전환용으로 빌린 기존 제어기 또는 세션 연결을 뜻하는 null
     */
    get controller(): UA3FTimelineController | null;
    /**
     * 현재 UI 내부 상태 참조만 허용합니다.
     *
     * @param {import('./a3fTimeSeries.js').UA3FTimelineViewRuntime} value 기존 UI 상태, 동일 참조만 허용
     */
    set state(value: UA3FTimelineViewRuntime);
    /**
     * 외부 변경 없이 점검할 소유 UI 자원 참조를 반환합니다.
     *
     * @returns {import('./a3fTimeSeries.js').UA3FTimelineViewRuntime} 외부 변경 없이 점검할 소유 UI 자원 참조
     */
    get state(): UA3FTimelineViewRuntime;
    #private;
}

export { U3dModelA3FLayer, UA3FAssetOptionsVo, UA3FAssetResolver, UA3FColorOptionsVo, UA3FDataSource, UA3FDatasetInfoVo, UA3FDatasetReader, UA3FDisplayCapabilitiesVo, UA3FDisplayOptionsVo, UA3FFlowConfigurationVo, UA3FFlowStatusVo, UA3FPlaybackSession, UA3FRequestOptionsVo, UA3FSdkAdapter, UA3FSdkOptionsVo, UA3FSessionOptionsVo, UA3FSessionStateVo, UA3FFieldVo as UA3FSettingsField, UA3FSettingsOptionsVo, UA3FSessionStateVo as UA3FSettingsSessionState, UA3FVectorFieldVo as UA3FSettingsVector, UA3FSettingsView, UA3FTerrainChangeVo, UA3FTimelineAdapter, UA3FFrameVo as UA3FTimelineFrame, UA3FTimelineStateVo as UA3FTimelineNativeState, UA3FTimelineView, UA3FWaterOptionsVo };
export type { UA3FSettingsPanel, UA3FSettingsRuntime, UA3FSettingsSection, UA3FSettingsViewCO, UA3FTimelineAdapterCO, UA3FTimelineAdapterRuntime, UA3FTimelineAdapterSubscription, UA3FTimelineAnimationSubscription, UA3FTimelineAnimationViewModel, UA3FTimelineAnimationWidget, UA3FTimelineClock, UA3FTimelineClockViewModel, UA3FTimelineCommandEvent, UA3FTimelineNativeSnapshot, UA3FTimelineObservable, UA3FTimelineSeekEvent, UA3FTimelineSeekListener, UA3FTimelineUnsubscribe, UA3FTimelineViewCO, UA3FTimelineViewCO_Content, UA3FTimelineViewRuntime, UA3FTimelineWidget };

export type { createA3FPlayback };
export type { UA3FAssetOptions };
export type { UA3FColorOptions };
export type { UA3FDatasetInfo };
export type { UA3FDatasetReaderCO };
export type { UA3FDataSourceCO };
export type { UA3FDisplayCapabilities };
export type { UA3FDisplayOptions };
export type { UA3FFlowConfiguration };
export type { UA3FFlowStatus };
export type { UA3FMapAdapter };
export type { UA3FPlaybackFactory };
export type { UA3FRequestOptions };
export type { UA3FSdkAdapterCO };
export type { UA3FSdkApp };
export type { UA3FSdkOptions };
export type { UA3FSessionApp };
export type { UA3FSessionClock };
export type { UA3FSessionCO };
export type { UA3FSessionEntry };
export type { UA3FSessionListener };
export type { UA3FSessionOptions };
export type { UA3FSessionPlayback };
export type { UA3FSessionRuntime };
export type { UA3FSessionState };
export type { UA3FSessionStatus };
export type { UA3FSettingsOptions };
export type { UA3FSpatialManager };
export type { UA3FSpatialSelectionExecutor };
export type { UA3FTerrainChange };
export type { UA3FTerrainListener };
export type { UA3FTimelineController };
export type { UA3FWaterOptions };
export type {UTimelineView} from "../../types/extensions/Cz-zFqUa.js";
export type * from "../../types/extensions/Cz-zFqUa.js";
export type {UTimelineAxisVo, UTimelineCapabilitiesVo, UTimelineStateVo} from "../../types/extensions/BSwjxfuO.js";
export type * from "../../types/extensions/BSwjxfuO.js";
export type {UA3FArrayLayoutVo, UA3FArrayStatisticsVo, UA3FBufferVo, UA3FCacheBudgetOptionsVo, UA3FCacheBudgetStatusVo, UA3FChildMetadataVo, UA3FCoordinateVo, UA3FDecodedArrayVo, UA3FDecodedBufferVo, UA3FFieldVo, UA3FFlowOptionsVo, UA3FFrameCacheOptionsVo, UA3FFrameCacheStatusVo, UA3FFrameLeaseVo, UA3FFrameResourceVo, UA3FFrameVo, UA3FGeometryResultVo, UA3FGeometryVo, UA3FHeightDisplayVo, UA3FHeightPolicyVo, UA3FLayoutVo, UA3FMetadataLoader, UA3FMetadataVo, UA3FNodeVo, UA3FParticleFlowOptionsVo, UA3FSpatialOptionsVo, UA3FSpatialSelectionVo, UA3FSpatialViewVo, UA3FTaskContextVo, UA3FTaskManager, UA3FTimelineOptionsVo, UA3FTimelineStateVo, UA3FVectorFieldVo} from "../../types/extensions/DTddTPud.js";
export type * from "../../types/extensions/DTddTPud.js";
