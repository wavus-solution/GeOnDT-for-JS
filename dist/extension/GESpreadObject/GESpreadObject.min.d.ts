import { GeOnDT, UParticleEngine, UGroup, UParticle, UPlaneBufferGeometry, UTaskProcessor } from "../../GeOnDT.modules.js";
import { ColorRepresentation, LineBasicMaterial, Object3D, Vector3, Points, Object3DEventMap, Mesh, ShaderMaterial, IUniform, WebGLRenderer, DataTexture, InstancedBufferGeometry, Vector2, BufferAttribute, WebGLRenderTarget, BufferGeometry, Scene, OrthographicCamera, PlaneGeometry, Vector4, InterleavedBufferAttribute, Box3, PerspectiveCamera } from "../../types/three/build/three.module.js";
import { UA3FCacheBudgetOptionsVo, UA3FParticleFlowOptionsVo, UA3FVectorFieldVo, UA3FGeometryVo, UA3FGeometryResultVo, UA3FFieldVo, UA3FHeightPolicyVo, UA3FHeightDisplayVo, UA3FFlowOptionsVo, UA3FDecodedArrayVo, UA3FCoordinateVo, UA3FTaskManager, UA3FTaskContextVo, UA3FBufferVo, UA3FLayoutVo, UA3FDecodedBufferVo, UA3FCacheBudgetStatusVo, UA3FFrameVo, UA3FFrameCacheOptionsVo, UA3FFrameLeaseVo, UA3FFrameResourceVo, UA3FFrameCacheStatusVo, UA3FMetadataLoader, UA3FSpatialOptionsVo, UA3FChildMetadataVo, UA3FMetadataVo, UA3FSpatialViewVo, UA3FSpatialSelectionVo, UA3FTimelineOptionsVo, UA3FTimelineStateVo, UA3FArrayLayoutVo, UA3FArrayStatisticsVo, UA3FNodeVo } from '../../types/extensions/DTddTPud.js';
import { UTimelineStateVo, UTimelineAxisVo, UTimelineCapabilitiesVo } from '../../types/extensions/BSwjxfuO.js';

declare class GELoader {
    static _version: string;
    static _compatibleVersion: any[];
    static extendTargets: any[];
    /**
     * 먼저 불러온 SDK의 준비 완료를 기다리고 실제 네임스페이스를 반환합니다.
     * 초기 로더 Promise의 완료값은 undefined일 수 있으므로 기다린 값을 SDK로 쓰지 않습니다.
     * 확장 내부에서 호출하며 사용자는 별도의 등록·Three 로딩을 수행하지 않습니다.
     * SDK 자체는 thenable이므로 객체로 감싸 반환하여 Promise의 재동화를 피합니다.
     * @returns {Promise<{sdk: typeof import('@union3d/app/GeOnDT').GeOnDT}>} 준비된 SDK를 가진 객체입니다.
     */
    static ready(): Promise<{
        sdk: typeof GeOnDT;
    }>;
    static get version(): string;
    /** @returns {string | Array<number>} 기본 표기 문자열 또는 기존 확장이 재정의한 버전 배열입니다. */
    static get compatibleVersion(): string | Array<number>;
    static checkVersion(GeonDT: any): boolean;
    static getModuleList(): any[];
    static applyAddon(GeonDT: any): any;
}

declare class GESpreadObject extends GELoader {
    static name: string;
    static version: string;
    static compatibleVersion: number[];
    static extendTargets: string[];
    /**
     * SDK의 동일 생성자에 기존 확장 메서드를 연결합니다. 다시 호출해도 별도 엔진 사본을 만들지 않습니다.
     * @param {typeof import('@union3d/app/GeOnDT').GeOnDT} GeonDT 준비된 SDK입니다.
     * @returns {ReturnType<typeof import('../GELoader/GELoader.js').GELoader.applyAddon>} 연결한 모듈 또는 호환 실패 false입니다.
     */
    static applyAddon(GeonDT: typeof GeOnDT): ReturnType<typeof GELoader.applyAddon>;
    get version(): string;
    get compatibleVersion(): string;
    /**
     * 확산객체에 오염확산 addon 기능을 사용 할수 있도록 확장 기능을 추가하는 함수
     * @param {import('@union3d/effect/UParticleEngine').UParticleEngine} particleEngine 대상 UParticleEngine 객체
     * @param {object} options UParticleEngine 객체 생성시 사용하는 속성 객체
     * @param {Array<unknown>} options.data grid 타입 생성시 사용되는 데이터 정보 (ex: 오염확산 - 오염도 정보 배열)
     * @param {boolean} options.showArrowHelper 데이터 기반으로 생성된 방향 객체에 대한 가시화 여부
     * @param {import('three').ColorRepresentation} options.arrowHelperColor 데이터 기반으로 생성된 방향 객체에 색상
     * @param {number} options.arrowLength 데이터 기반으로 생성된 방향 객체에 길이
     * @param {number} options.gridMeshOpacity grid Mesh의 투명도 수치
     * @param {number} options.gridMeshMaxHeight grid Mesh의 최대 제한 값
     * @param {number} options.gridMeshRatio grid Mesh의 수치에 대한 축척 비율 (1 : gridMeshRatio)
     * @param {number} [options.gridMeshLogConstant=1000] 오염도 수치를 지수로 변환시 사용된 상수 계수
     * @param {import('three').ColorRepresentation} [options.gridMeshSelectColor=0xffff00] grid Mesh picking 시 색상
     * @param {boolean} options.showGridBox 데이터 기반으로 생성된 각 격자의 수치를 Box로 표현한 객체의 가시화 여부
     * @param {boolean} options.showGridMesh 데이터 기반으로 생성된 각 격자의 수치를 Mesh로 표현한 객체의 가시화 여부
     * @returns {import('@union3d/effect/UParticleEngine').UParticleEngine} 확장기능이 추가된 UParticleEngine 객체
     */
    setGESpreadObject(particleEngine: UParticleEngine, options: {
        data: Array<unknown>;
        showArrowHelper: boolean;
        arrowHelperColor: ColorRepresentation;
        arrowLength: number;
        gridMeshOpacity: number;
        gridMeshMaxHeight: number;
        gridMeshRatio: number;
        gridMeshLogConstant?: number | undefined;
        gridMeshSelectColor?: ColorRepresentation | undefined;
        showGridBox: boolean;
        showGridMesh: boolean;
    }): UParticleEngine;
    _helperGroup: any;
    _showGridHelper: boolean | undefined;
    _showArrowHelper: boolean | undefined;
    _gridColor: ColorRepresentation | undefined;
    _lineBasicMaterial: LineBasicMaterial | undefined;
    _showGridMesh: boolean | undefined;
    _gridMeshOpacity: number | undefined;
    _gridMeshMaxHeight: any;
    _gridMeshRatio: any;
    _gridMeshLogConstant: any;
    _gridMeshSelectColor: ColorRepresentation | undefined;
    morphAnimationIds: {} | undefined;
    /**
     * 클릭된 면과 가장 가까운 grid data의 value를 찾고,
     * 해당 점을 공통으로 포함하는 face들과 해당 좌표의 데이터 정보를 반환하는 함수
     * @param {import('three').Object3D} gridMesh - 그리드 메시
     * @param {import('three').Vector3} clickPoint - 클릭 지점 (월드 좌표)
     * @returns {object} - 결과 객체 (가장 가까운 점, 해당 점의 값, 공유하는 면들의 인덱스 배열)
     */
    findNearestGridPointAndFaces(gridMesh: Object3D, clickPoint: Vector3): object;
    /**
     * Grid Mesh에 해당하는 좌표의 수치 값의 정보 및 해당 영역객체를 가시화 하는 함수
     * @param {WorldPosition} x 3D world의 좌표 x
     * @param {WorldPosition} y 3D world의 좌표 y
     * @param [createMesh = true] 해당영역 객체 생성 여부
     * @returns {object} 좌표에 해당하는 수치 및 데이터 정보 반환
     */
    getGridMeshDataAtPosition(x: WorldPosition, y: WorldPosition, createMesh?: boolean | undefined): object;
    _highlightedFaces: any;
    /**
     * grid Mesh 클릭 및 정보 조회시 생성된 객체를 담고 있는 그룹을 반환 하는 함수
     * @returns {import('@union3d/core/UGroup').UGroup} 정보조회시 생성된 객체를 담고 있는 그룹
     */
    getHighlightedFaces(): UGroup;
    /**
     * 입력 받은 idx 번호의 정보 조회시 생성된 객체 반환 하는 함수
     * @param {number} idx 해당 grid Data의 idx 번호
     * @returns {import('three').Object3D} 정보조회시 생성된 객체
     */
    getHighlightedFacesAtIndex(idx?: number): Object3D;
    /**
     * 전체 하이라이트 매쉬 제거
     */
    removeAllGridMeshHighlight(): void;
    /**
     * grid Mesh 클릭 및 정보 조회시 영역객체 제거
     * @param {number} idx 제거 대상 idx 번호
     */
    removeGridMeshHighlight(idx?: number): void;
    /**
     * 하이라이트 객체 가시화 설정 함수
     * @param {boolean} visible 가시화 여부
     */
    setVisibleHighlightedFaces(visible: boolean): void;
    /**
     * grid helper 가시화 여부
     * @param {boolean} val 가시화 여부
     */
    showGridHelper(val: boolean): void;
    /**
     * grid helper 객체 그룹 반환
     * @returns {import('@union3d/core/UGroup').UGroup} grid helper 그룹
     */
    getGridHelper(): UGroup;
    /**
     * Grid 데이터만으로 방향 ArrowHelper를 생성하는 함수
     * Particle 객체 생성 여부와 관계없이 options.data를 직접 사용한다.
     * @param {object} options 생성 옵션
     * @param {string} options.name 생성 대상 이름
     * @param {Array<unknown>} options.data Grid 데이터 목록
     * @param {import('three').ColorRepresentation} [options.arrowHelperColor=0xffffff] Arrow 색상
     * @param {number} [options.arrowLength=10] Arrow 길이
     * @param {number} [options.arrowHelperOpacity=1] Arrow 투명도
     * @param {boolean} [options.visible=true] 생성 후 가시화 여부
     * @returns {import('@union3d/core/UGroup').UGroup[]} 데이터 index별 생성된 ArrowHelper 그룹
     */
    createGridArrowHelper(options: {
        name: string;
        data: Array<unknown>;
        arrowHelperColor?: ColorRepresentation | undefined;
        arrowLength?: number | undefined;
        arrowHelperOpacity?: number | undefined;
        visible?: boolean | undefined;
    }): UGroup[];
    /**
     * createGridArrowHelper(options)로 생성된 방향 객체 제거
     * @param {string} name 생성시에 지정한 이름
     */
    removeGridArrowHelper(name: string): boolean;
    /**
     * 데이터 방향 객체를 생성하는 함수
     * initializeGrid에서는 ArrowHelper를 생성하지 않고 필요 시점에 개별 생성한다.
     * @param {string} [name] 대상 UParticleEngine 객체 이름
     * @param {number} [idx] 대상 UParticleEngine 객체 번호
     * @returns {import('@union3d/core/UGroup').UGroup|import('@union3d/core/UGroup').UGroup[]|undefined} 생성된 ArrowHelper 그룹
     */
    createArrowHelper(name?: string, idx?: number): UGroup | UGroup[] | undefined;
    /**
     * 데이터 방향 객체를 제거하는 함수
     * @param {string} [name] 대상 UParticleEngine 객체 이름
     * @param {number} [idx] 대상 UParticleEngine 객체 번호
     */
    removeArrowHelper(name?: string, idx?: number): boolean | undefined;
    /**
     * 데이터 방향 가시화 여부
     * 생성되지 않은 경우 val=true 시점에 lazy 생성
     * @param {boolean} val 가시화 여부
     * @param {string} [name] 대상 UParticleEngine 객체 이름
     * @param {number} [idx] 대상 UParticleEngine 객체 번호
     */
    showArrowHelper(val: boolean, name?: string, idx?: number): void;
    /**
     * grid Box 객체를 생성하는 함수
     * initializeGrid에서는 GridBox를 생성하지 않고 필요 시점에 개별 생성한다.
     * @param {string} options 대상 속정 정보
     * @returns {import('@union3d/core/UGroup').UGroup|import('@union3d/core/UGroup').UGroup[]|undefined} 생성된 GridBox 그룹
     */
    createGridBox(options: string): UGroup | UGroup[] | undefined;
    /**
     * grid Box 객체를 제거하는 함수
     * @param {string} [name] 대상 UParticleEngine 객체 이름
     * @param {number} [idx] 대상 UParticleEngine 객체 번호
     */
    removeGridBox(name?: string, idx?: number): boolean | undefined;
    _showGridBox: boolean | undefined;
    /**
     * grid type 시 data의 값을 box 형태 형상 출력
     * 생성되지 않은 경우 val=true 시점에 lazy 생성
     * @param {boolean} val 가시화 여부
     * @param {string} name 대상 이름
     * @param {number} idx 대상 번호
     */
    showGridBox(val: boolean, name: string, idx: number): void;
    getGridMesh(name: any): void;
    /**
     * grid type 시 data의 값을 mesh 형태 형상 출력
     * @param {boolean} val 가시화 여부
     * @param {string} name 대상 이름
     * @param {number} idx 대상 번호
     */
    showGridMesh(val: boolean, name: string, idx: number): void;
    setStartMorph(name: any, duration?: number, startHeight?: number, endHeight?: number): void;
    setStopMorph(): void;
    setResetMorph(name: any): void;
    setMorphRange(name: any, startHeight: any, endHeight: any): void;
    setGridMeshLogConstant(val: any): void;
    getGridMeshLogConstant(): any;
    /**
     * 데이터 방향 가시화 여부 ( data 목록의 index를 입력받아 해당 순서에 data arrow 가시화 )
     * @param {boolean} val 가시화 여부
     * @param {number} idx 가시화 대상 idx
     */
    showArrowHelperAtIndex(val: boolean, idx: number): void;
    /**
     * Particle Grid data 값으로 생성된 box 가시화 여부 ( grid type 의 경우 생성 )
     * @param {boolean} val 가시화 여부
     * @param {number} idx 가시화 대상 idx
     */
    showGridBoxAtIndex(val: boolean, idx: number): void;
    /**
     * grid helper 투명도 변경하는 함수
     * @param {number} opacity 그리드 격자 투명도
     */
    setGridMeshOpacity(opacity: number): void;
    setGridMeshMaxHeight(value: any): void;
    setGridMeshRatio(ratio: any): void;
    /**
     * grid helper color 변경하는 함수
     * @param {import('three').ColorRepresentation} color 그리드 격자 색상
     */
    setGridHelperColor(color: ColorRepresentation): void;
    /**
     * grid helper 투명도 변경하는 함수
     * @param {number} opacity 그리드 격자 투명도
     */
    setGridHelperOpacity(opacity: number): void;
    _gridOpacity: number | undefined;
    /**
     * 데이터 방향 색상 설정 함수
     * @param {import('three').ColorRepresentation} color 색상
     */
    setArrowHelperColor(color: ColorRepresentation): void;
    _arrowHelperColor: ColorRepresentation | undefined;
    /**
     * 데이터 방향 객체 길이 설정 함수
     * @param {number} length 길이
     */
    setArrowHelperLength(length: number): void;
    _arrowLength: number | undefined;
    /**
     * 데이터 방향 투명도 설정 함수
     * @param {number} opacity 투명도
     */
    setArrowHelperOpacity(opacity: number): void;
    _arrowHelperOpacity: number | undefined;
    /**
     * 오염도 정보를 기반으로 설정한 시간대의 형상을 출력하는 함수
     * @param {number} time 설정 시간
     * @param {string} name 대상 UParticleEngine 객체 이름
     * @param {number} idx 대상 idx 번호, 이름을 입력하지 않거나 이름으로 검색시 대상을 찾지 못할 경우 해당 속성값 사용
     */
    setTime(time: number, name: string, idx: number): void;
    /**
     * grid type particle 객체의 초기 값, grid value에 적용하는 함수 <br>
     * UParticleEngine.setValues(parameters) 를 통해서 설정된 값으로 생성
     * @param {Array<unknown>} data 오염도 정보를 담고 있는 배열
     * @param {Array<unknown>} extents 영역에 대한 정보를 담고 있는 배열
     * @param {Array<unknown>} gridValues 각 데이터의 오염도 수치에 대한 정보를 담고 있는 객체
     * @param {Array<unknown>} spreadInfo 각 데이터의 오염도 수치를 기반으로 정규화 결과를 담고 있는 객체
     * @returns {import('@union3d/effect/UParticleEngine').UParticleEngine} 오염도 데이터를 기반으로 생성된 UParticleEngine 객체
     */
    initializeGrid(data: Array<unknown>, extents: Array<unknown>, gridValues: Array<unknown>, spreadInfo: Array<unknown>): UParticleEngine;
    positionStyle: 4 | undefined;
    gridMode: 1 | undefined;
    _data: unknown[] | undefined;
    _extents: unknown[] | undefined;
    _spreadInfo: unknown[] | undefined;
    _gridPosition: any[] | undefined;
    time: number | undefined;
    timeIndex: number | undefined;
    speed: any;
    particleMesh: Points<any, any, Object3DEventMap> | undefined;
    /**
     * particle 객체를 생성하는 함수 ( grid type에 해당 ) <br>
     * UParticleEngine.setValues(parameters) 를 통해서 설정된 값으로 생성
     * @param {WorldPosition} pos 초기 위치
     * @param {string} key 격자 위치에 Index Key 값
     * @param {object} data 오염도 정보를 담은 객체
     * @param {boolean} isRecycle 재사용 여부
     * @param {boolean} idx 원래의 idx 번호
     * @returns {import('@union3d/effect/UParticle').UParticle} 점에 해당하는 UParticle 객체
     */
    createGridParticle(pos: WorldPosition, key: string, data: object, isRecycle: boolean | undefined, idx: boolean): UParticle;
    /**
     * Grid Type particle 객체 update 함수
     * @param dt clock의 delta
     */
    updateGrid(dt: any): void;
    _recycleIndices: any[] | undefined;
    /**
     * Grid 데이터 기반 ArrowHelper 그룹 생성
     * @param {number} [idx] 생성할 데이터 index. 미입력 시 전체 생성
     * @returns {import('@union3d/core/UGroup').UGroup|undefined} ArrowHelper root group
     */
    createParticleArrowHelperGroup(idx?: number): UGroup | undefined;
    /**
     * ArrowHelper 그룹 제거
     */
    removeParticleArrowHelperGroup(): void;
    _arrowGroup: any;
    /**
     * Grid 데이터 기반 Box 그룹 생성
     * @param {number} [idx] 생성할 데이터 index. 미입력 시 전체 생성
     * @returns {import('@union3d/core/UGroup').UGroup|undefined} GridBox root group
     */
    createParticleGridBoxGroup(idx?: number): UGroup | undefined;
    /**
     * GridBox 그룹 제거
     */
    removeParticleGridBoxGroup(): void;
    _boxGroup: any;
    /**
     * 데이터 방향 가시화 여부 ( grid type 의 경우 생성 )
     * @param {boolean} val 가시화 여부
     */
    showParticleArrowHelper(val: boolean): void;
    /**
     * grid Box 가시화 여부 ( grid type 의 경우 생성 )
     * @param {boolean} val 가시화 여부
     */
    showParticleGridBox(val: boolean): void;
    /**
     * Particle Grid data 값으로 생성된 box 가시화 여부 ( grid type 의 경우 생성 )
     * @param {boolean} val 가시화 여부
     * @param {number} idx 가시화 대상 idx
     */
    showParticleGridBoxAtIndex(val: boolean, idx: number): void;
    /**
     * 데이터 방향 객체 가시화 여부 ( grid type 의 경우 생성 )
     * @param {boolean} val 가시화 여부
     * @param {number} idx 가시화 대상 idx
     */
    showParticleArrowHelperAtIndex(val: boolean, idx: number): void;
    /**
     * 해당 Index의 데이터 가시화 여부 ( grid type의 확산모드 시 동작 -> type : 'grid', gridMode : 'spread' )
     * @param {boolean} val 가시화 여부
     * @param {number} idx 가시화 대상 idx
     */
    showGridParticleAtIndex(val: boolean, idx: number): void;
    /**
     * 데이터 방향 객체 색상 설정 함수
     * @param {import('three').ColorRepresentation} color 색상
     */
    setParticleArrowHelperColor(color: ColorRepresentation): void;
    /**
     * 데이터 방향 객체 투명도 설정 함수
     * @param {number} opacity 투명도
     */
    setParticleArrowHelperOpacity(opacity: number): void;
    /**
     * 데이터 방향 길이를 변경하는 함수
     * @param {number} length 데이터 방향 객체의 길이
     */
    setParticleArrowHelperLength(length: number): void;
    /**
     * grid Helper 그룹를 생성하는 함수
     */
    createGridHelper(option: any): void;
    /**
     * grid Helper 그룹를 삭제하는 함수
     */
    removeGridHelper(): void;
    createGridMesh(options: any): (Mesh<UPlaneBufferGeometry, ShaderMaterial, Object3DEventMap> | undefined)[];
    /**
     * gridMesh 제거함수 생성시 작성한 name으로 대상 지정하여 제거
     * @param {string} name 제거 대상 이름
     */
    removeGridMesh(name: string): void;
    /**
     * grid mesh 좌표 조회시에 해당 영역에 해당하는 cylinder 및 좌표 위치에 sphere 객체 생성 함수
     * @param {import('three').Object3D} mesh grid Mesh 객체
     * @param {object} info AnalyParticle.getGridMeshDataAtPosition() 결과로 나온 정보 객체
     * @param {WorldPosition} clickPosition 정보 조회 위치 좌표
     * @param {object} opt cylinder, sphere 객체 생성 옵셥 정보
     * @returns {import('@union3d/core/UGroup').UGroup} AnalyParticle._rangeHelperGroup 영역 객체를 담고 있는 그룹
     */
    createRangeHelper(mesh: Object3D, info: object, clickPosition: WorldPosition, opt?: object): UGroup;
    /**
     * 영역 객체 가시화 설정 함수
     * @param {boolean} visible 가시화 여부
     */
    setVisibleRangeHelper(visible: boolean): void;
    /**
     * 영역 객체 제거 함수
     */
    removeRangeHelper(): void;
    /**
     * 영역 객체 반환 함수
     * @returns {import('@union3d/core/UGroup').UGroup} 영역 객체를 담고 있는 그룹 객체
     */
    getRangeHelperGroup(): UGroup;
}

declare global {
    type UA3FCacheBudgetManagerCO_Content = {
        /**
         * 전체 프레임 원시 바이트 예산; null 한도는 추가 제한 없음
         */
        optionsVo: UA3FCacheBudgetOptionsVo;
    };
    type UA3FCacheBudgetManagerCO = UA3FCacheBudgetManagerCO_Content;
    /**
     * 캐시별 회수와 재실행 연결입니다.
     */
    type UA3FCacheBudgetOwner = {
        /**
         * 준비 완료된 파일 ID를 실제 제거하면 true, HTTP/lease/full 항목은 false
         */
        evict: (arg0: string) => boolean;
        /**
         * 예약 반환 뒤 캐시 펌프를 재시도하는 호출, 관리자는 microtask로 묶음
         */
        notify: () => void;
        /**
         * 새 예약 차단 상태, 기존 토큰은 실제 반환까지 유지
         */
        closing: boolean;
    };
    /**
     * 고정 버퍼 한 개의 예약 또는 상주 상태입니다.
     */
    type UA3FCacheBudgetToken = {
        /**
         * 실제 캐시 인스턴스 고유 ID
         */
        ownerId: string;
        /**
         * 해당 캐시 파일 ID, URL로 할당을 합치지 않음
         */
        bufferId: string;
        /**
         * 양의 안전 정수인 원시 고정 버퍼 바이트
         */
        byteLength: number;
        /**
         * decode 완료 여부
         */
        resident: boolean;
        /**
         * lease/목표/full 보존 상태
         */
        protected: boolean;
        /**
         * 최근 사용 순서
         */
        sequence: number;
    };
    type UA3FCacheBudgetState = {
        /**
         * 등록/종료 대기 캐시
         */
        owners: Map<string, UA3FCacheBudgetOwner>;
        /**
         * 실제 할당별 예약
         */
        tokens: Map<string, UA3FCacheBudgetToken>;
        /**
         * 대기 중인 필수 요청의 캐시 ID
         */
        required: Set<string>;
        /**
         * 토큰·최근 사용 순서
         */
        sequence: number;
        /**
         * 예약 반환 통지 예약 여부
         */
        pending: boolean;
        /**
         * 동기 회수 재진입 차단
         */
        reclaiming: boolean;
        /**
         * 신규 예약 차단 여부
         */
        disposed: boolean;
    };
}

/**
 * 현재 프레임 삼각형 유속장을 GPU에 만들고 카메라 투영 크기에 맞춘 방향 물방울·부드러운 꼬리를 갱신합니다.
 *
 * @group A3F
 */
declare class UA3FParticleFlowExecutor {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * CSS sRGB 5색을 검증해 소유한 GPU uniform 묶음을 만듭니다. <br>
     * GPU 자원은 할당하지 않습니다.
     *
     * @param {Array<string> | null} colors 낮음→높음 등간격 #RRGGBB 5개 또는 기존 기본값 복원의 null, 입력 변경·참조 보관 없음, 낮음→높음 등간격 #RRGGBB 5개 또는 기본값 복원의 null
     * @returns {Record<string, import('three').IUniform>} flowUsePalette와 sRGB 0..1 Vector3 5개의 새 uniform
     */
    static createPaletteUniforms(colors: Array<string> | null): Record<string, IUniform>;
    /**
     * 옵션 타입·수치 범위와 texture 상한을 검증합니다.
     *
     * @param {import('./vo/UA3FPlaybackVos.js').UA3FParticleFlowOptionsVo} o 검사할 옵션, 변경 없음
     */
    static validate(o: UA3FParticleFlowOptionsVo): void;
    /**
     * UA3FParticleFlowExecutor 클래스 생성자입니다. <br>
     * 벡터·옵션과 예산 연결을 검증하고 할당 전 상태를 만듭니다.
     *
     * @param {UA3FParticleFlowCO} opt 확정된 벡터·입자 설정과 빌린 예산 연결
     */
    constructor(opt: UA3FParticleFlowCO);
    /** @type {import('./vo/UA3FPlaybackVos.js').UA3FVectorFieldVo} */ _vectorFieldVo: UA3FVectorFieldVo;
    /** @type {import('./vo/UA3FPlaybackVos.js').UA3FParticleFlowOptionsVo} */ _optionsVo: UA3FParticleFlowOptionsVo;
    /** @type {UA3FParticleFlowState} */ _state: UA3FParticleFlowState;
    /**
     * vectorFieldVo 보관값 교체의 허용 조건을 검사합니다.
     *
     * @param {import('./vo/UA3FPlaybackVos.js').UA3FVectorFieldVo} value 현재 동일 참조만 허용
     */
    set vectorFieldVo(value: UA3FVectorFieldVo);
    /**
     * vectorFieldVo 보관값을 읽기 용도로 반환합니다.
     *
     * @returns {import('./vo/UA3FPlaybackVos.js').UA3FVectorFieldVo} 현재 빌린 확정 정의, 외부 변경 금지
     */
    get vectorFieldVo(): UA3FVectorFieldVo;
    /**
     * optionsVo 보관값 교체의 허용 조건을 검사합니다.
     *
     * @param {import('./vo/UA3FPlaybackVos.js').UA3FParticleFlowOptionsVo} value 할당 전 옵션
     */
    set optionsVo(value: UA3FParticleFlowOptionsVo);
    /**
     * optionsVo 보관값을 읽기 용도로 반환합니다.
     *
     * @returns {import('./vo/UA3FPlaybackVos.js').UA3FParticleFlowOptionsVo} 현재 입자 옵션, 읽기 용도
     */
    get optionsVo(): UA3FParticleFlowOptionsVo;
    /**
     * state 보관값 교체의 허용 조건을 검사합니다.
     *
     * @param {Readonly<UA3FParticleFlowState>} value 현재 동일 참조만 허용
     */
    set state(value: Readonly<UA3FParticleFlowState>);
    /**
     * state 보관값을 읽기 용도로 반환합니다.
     *
     * @returns {Readonly<UA3FParticleFlowState>} 실제 상태 참조, 외부 변경 금지
     */
    get state(): Readonly<UA3FParticleFlowState>;
    /**
     * 입자와 꼬리의 팔레트를 바꾸고 null이면 기존 지정색·속력 명암을 복원합니다. <br>
     * 형상·장·이력은 보존합니다.
     *
     * @param {Array<string> | null} colors 낮은 값부터 높은 값 순서의 sRGB #RRGGBB 색상 5개(null이면 기본 팔레트)
     */
    setPalette(colors: Array<string> | null): void;
    /**
     * 실제 float framebuffer 지원과 파생 예산을 확인한 뒤 소유 GPU 자원을 만듭니다.
     *
     * @param {import('three').WebGLRenderer} renderer 현재 지도 renderer, 해제하지 않음
     * @param {import('./vo/UA3FSceneVos.js').UA3FGeometryVo} geometryVo 빌린 메타 형상
     * @param {import('./vo/UA3FSceneVos.js').UA3FGeometryResultVo} result 빌린 원본 geometry와 좌표
     * @param {Array<import('./vo/UA3FDataVos.js').UA3FFieldVo>} fields 빌린 필드 정의
     * @param {Float32Array} basisArrays 전체 정점4성분 기저, 빌린 배열이며 transfer 없음
     */
    initialize(renderer: WebGLRenderer, geometryVo: UA3FGeometryVo, result: UA3FGeometryResultVo, fields: Array<UA3FFieldVo>, basisArrays: Float32Array): void;
    /**
     * 현재 프레임과 젖은 seed를 연결하고 입자 위치·수명·꼬리를 유지합니다.
     *
     * @param {UA3FFlowFrame} frame renderer 소유 원시 texture·배열, 빌림
     * @param {number} frameToken 0이상 표시 token
     * @param {Array<number>} [seeds] 로컬 XY 좌표쌍(최대 8192개 지점, 생략하면 빈 배열)
     */
    stageFrame(frame: UA3FFlowFrame, frameToken: number, seeds?: Array<number>): void;
    /**
     * 동일 token의 후보를 계산·표시 대상으로 지정합니다.
     *
     * @param {number} frameToken stage와 같은 token
     */
    commitFrame(frameToken: number): void;
    /**
     * 표면과 같은 높이·마스크·깊이 설정을 연결합니다.
     *
     * @param {import('./vo/UA3FSceneVos.js').UA3FHeightPolicyVo} policy 빌린 높이 정책
     * @param {import('./vo/UA3FSceneVos.js').UA3FHeightDisplayVo} display 허용 m offset
     * @param {import('./vo/UA3FDataVos.js').UA3FFieldVo | null} mask 표면 scalar mask 또는 없음
     * @param {number} threshold 표면 mask 기준
     * @param {boolean} enabled 표면 mask 사용
     * @param {number} bias normalized depth 보정
     */
    setDisplay(policy: UA3FHeightPolicyVo, display: UA3FHeightDisplayVo, mask: UA3FFieldVo | null, threshold: number, enabled: boolean, bias: number): void;
    /**
     * 속력 색상·픽셀 폭·투명도 옵션을 연결합니다.
     *
     * @param {import('./vo/UA3FPlaybackVos.js').UA3FFlowOptionsVo} options 색상·폭·투명도 설정, 읽기 전용
     * @param {number} [opacityScale] 상위 표면 투명도0..1, 기본1
     */
    configureDisplay(options: UA3FFlowOptionsVo, opacityScale?: number): void;
    /**
     * 전체 배분에서 허용한 노드별 입자 상한을 적용합니다.
     *
     * @param {number} count 노드 입자 상한, 0이상 안전 정수
     */
    setLimit(count: number): void;
    /**
     * 보조 표시 객체의 가시성을 갱신합니다.
     *
     * @param {boolean} visible 표시 요청
     */
    setVisible(visible: boolean): void;
    /**
     * 재현 가능한 seed로 위치와 꼬리의 새 배치를 예약합니다.
     *
     * @param {number} [seed] 0..4294967295 안전 정수
     */
    reset(seed?: number): void;
    /**
     * 현재 유속장을 만들고 CFL 상한 안에서 GPU 입자와 꼬리를 갱신합니다.
     *
     * @param {import('three').WebGLRenderer} renderer 현재 renderer, 상태 복구
     * @param {number} deltaSeconds 표시 초, 유한한0이상
     * @returns {boolean} GPU 갱신 여부
     */
    step(renderer: WebGLRenderer, deltaSeconds: number): boolean;
    /**
     * 소유 GPU 자원과 원본 참조를 끊고 예약·상주 예산을 반납합니다.
     */
    dispose(): void;
    #private;
}

declare global {
    /**
     * 노드별 화살표 생성 설정입니다.
     */
    type UA3FFlowRendererCO_Content = {
        /**
         * 기준축까지 확정된 벡터 정의
         */
        vectorFieldVo: UA3FVectorFieldVo;
        /**
         * 검증할 표시 설정
         */
        optionsVo: UA3FFlowOptionsVo;
        /**
         * 흐름 입자 옵션, 생략 시 기본값
         */
        particleOptionsVo?: UA3FParticleFlowOptionsVo | undefined;
        /**
         * 빌린 정적 전처리 풀, renderer는 종료하지 않음
         */
        taskProcessor: UTaskProcessor;
        /**
         * 전체 세션의 파생 바이트 예약, 실패 시 throw
         */
        reserveDerived: (arg0: number) => void;
        /**
         * 예약/상주 바이트 반납, 입력은 0 이상
         */
        releaseDerived: (arg0: number) => void;
    };
    /**
     * 생성자 입력은 클래스 고유 생성 옵션과 같은 계약입니다.
     */
    type UA3FFlowRendererCO = UA3FFlowRendererCO_Content;
    /**
     * 원시 float texture와 해상도입니다.
     */
    type UA3FFlowTexture = {
        /**
         * renderer 소유 GPU 입력
         */
        texture: DataTexture;
        /**
         * 폭 texel
         */
        width: number;
        /**
         * 높이 texel
         */
        height: number;
    };
    /**
     * 같은 표시 프레임의 빌린 숫자 배열과 소유 파생 texture입니다.
     */
    type UA3FFlowFrame = {
        /**
         * 새 조회표, 원본 view는 빌림
         */
        arrays: Map<string, UA3FDecodedArrayVo>;
        /**
         * 소유 texture
         */
        textures: Map<string, UA3FFlowTexture>;
        /**
         * 파생 CPU padding과 GPU payload 합계
         */
        bytes: number;
        /**
         * 표시 요청의 0 이상 정수
         */
        token: number;
    };
    /**
     * 수명 페이드 대기 상태를 사용하지 않는 노드 renderer의 내부 상태입니다. 공개 getter 사용자는 읽기만 수행합니다.
     */
    type UA3FFlowRendererState = {
        /**
         * 빌린 공유 풀
         */
        processor: UTaskProcessor;
        /**
         * 파생 바이트 예약
         */
        reserve: (arg0: number) => void;
        /**
         * 파생 바이트 반납
         */
        release: (arg0: number) => void;
        /**
         * 입자 설정
         */
        particleOptions: UA3FParticleFlowOptionsVo;
        /**
         * 소유 GPU 실행기
         */
        particle: UA3FParticleFlowExecutor | null;
        /**
         * 재시도까지 흐름 오류 유지
         */
        particleFailed: boolean;
        /**
         * 실제 실패 설명
         */
        particleError: string;
        /**
         * 마지막 연결 프레임 token, 미연결은 -1
         */
        particleToken: number;
        /**
         * 빌린 정적 형상
         */
        result: UA3FGeometryResultVo | null;
        /**
         * 소유 전체 정점 방향 기저
         */
        vertexBases: Float32Array;
        /**
         * 소유한 CSS sRGB 5색 사본 또는 기존 표시 복원의 null, VO와 원본 자료는 변경하지 않음
         */
        palette: Array<string> | null;
        /**
         * 해제 진입 여부
         */
        disposed: boolean;
        /**
         * 늦은 전처리 결과 차단 세대
         */
        epoch: number;
        /**
         * 상주 정적 파생 payload
         */
        staticBytes: number;
        /**
         * 실제 worker 준비 중 예약 payload
         */
        pendingBytes: number;
        /**
         * 빌린 메타 형상
         */
        definition: UA3FGeometryVo | null;
        /**
         * 빌린 실제 월드 좌표(EPSG:3857) 계약
         */
        coordinates: UA3FCoordinateVo | null;
        /**
         * 빌린 정적 원본의 새 조회표
         */
        staticArrays: Map<string, UA3FDecodedArrayVo>;
        /**
         * 필드 정의의 새 조회표
         */
        fields: Map<string, UA3FFieldVo>;
        /**
         * 소유 정적 후보 ID
         */
        seedIds: Uint32Array;
        /**
         * 소유 정적 후보 위치
         */
        anchors: Float32Array;
        /**
         * 소유 정적 후보 기저
         */
        bases: Float32Array;
        /**
         * 소유 정적 후보 높이 배율
         */
        scales: Float32Array;
        /**
         * 표시 객체
         */
        object: Mesh<InstancedBufferGeometry, ShaderMaterial> | null;
        /**
         * 소유 인스턴스 형상
         */
        geometry: InstancedBufferGeometry | null;
        /**
         * 소유 화살표 재질
         */
        material: ShaderMaterial | null;
        /**
         * 정적 후보 위치·원본 ID·높이 배율 입력
         */
        seedAnchorTexture: DataTexture | null;
        /**
         * 정적 후보 방향 기저 입력
         */
        seedBasisTexture: DataTexture | null;
        /**
         * 현재 화면 선택 인덱스, 렌더 직전 upload
         */
        selectionTexture: DataTexture | null;
        /**
         * 숨긴 프레임 후보
         */
        staged: UA3FFlowFrame | null;
        /**
         * 공개 프레임 입력
         */
        current: UA3FFlowFrame | null;
        /**
         * 카메라/viewport 변경 감지값
         */
        stamp: string;
        /**
         * CSS px 크기 임시값
         */
        viewport: Vector2;
        /**
         * 후보 투영 임시값
         */
        point: Vector3;
        /**
         * 빌린 현재 높이 정책
         */
        policy: UA3FHeightPolicyVo | null;
        /**
         * 빌린 허용 offset 정의
         */
        display: UA3FHeightDisplayVo | null;
        /**
         * 추가 표시 마스크 또는 없음
         */
        mask: UA3FFieldVo | null;
        /**
         * 추가 표시 마스크 임계값, 필드 단위
         */
        threshold: number;
        /**
         * 추가 표시 마스크 사용
         */
        maskEnabled: boolean;
        /**
         * 절대 normalized depth 차
         */
        depthBias: number;
        /**
         * 요청한 노드 표시 여부
         */
        visible: boolean;
        /**
         * 세션이 배분한 화살표 개수
         */
        limit: number;
        /**
         * 현재 화면에서 선택한 화살표 개수
         */
        selected: number;
    };
}

declare global {
    /**
     * 검증한 동적 필드와 기존 wrapper를 보관하는 지역 적용 계획입니다.
     */
    type UA3FFrameAttributePlan = {
        /**
         * frame 저장 방식의 node 필드 식별자
         */
        fieldId: string;
        /**
         * 같은 wrapper를 공유할 실제 attribute 이름
         */
        names: Array<string>;
        /**
         * 검증한 원본 프레임 배열 참조
         */
        entry: UA3FDecodedArrayVo;
        /**
         * 이미 연결한 wrapper 또는 첫 연결이면 null
         */
        attribute: BufferAttribute | null;
    };
    /**
     * 첫 연결용 wrapper 생성까지 마친 동기 적용 계획입니다.
     */
    type UA3FFrameAttributeReadyPlan = UA3FFrameAttributePlan & {
        attribute: BufferAttribute;
    };
}

/**
 * 한 프레임 파일을 읽고 기존 워커에서 검증·해석하도록 연결합니다.
 *
 * @group A3F
 * @summary 한 프레임 파일을 읽고 기존 워커에서 검증·해석하도록 연결합니다.
 */
declare class UA3FFrameLoader {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FFrameLoader 클래스 생성자입니다. <br>
     * 외부 I/O 없이 URL·빌린 작업 관리자·통신 함수를 확인합니다.
     *
     * @param {UA3FFrameLoaderCO} opt 필수 생성 설정, null 불가, 입력 원본은 변경하지 않음
     */
    constructor(opt: UA3FFrameLoaderCO);
    /** @type {string} */
    _metadataUrl: string;
    /** @type {import('./UA3FTaskManager.js').UA3FTaskManager} */
    _taskManager: UA3FTaskManager;
    /** @type {typeof fetch} */
    _fetchFunction: typeof fetch;
    /**
     * 한 파일을 정확한 기대 길이로 읽고 기존 워커 결과를 반환합니다. <br>
     * HTTP 취소는 signal로 처리하지만 decode에 넘긴 뒤의 signal 취소는 물리 작업을 중단하지 않습니다. <br>
     * 워커 취소는 AbortError에 code=A3F_DECODE_CANCELLED를 기록하여 예약 공간을 조기 재사용하지 않게 합니다.
     *
     * @param {import('./vo/UA3FDataVos.js').UA3FTaskContextVo} contextVo null 불가, 파일·노드·0 기반 프레임·현재 워커 세대의 작업 문맥
     * @param {import('./vo/UA3FDataVos.js').UA3FBufferVo} bufferVo null 불가, 기대 길이는 양의 안전 정수인 바이트
     * @param {import('./vo/UA3FDataVos.js').UA3FLayoutVo} layoutVo 파일의 layoutId와 일치하는 null 아닌 배치
     * @param {AbortSignal} signal 소유한 HTTP 요청의 취소 신호, null 불가, decode 이후에는 입력 버퍼 반환을 뜻하지 않음
     * @param {boolean} [verifyHash=true] SHA-256 검사 여부, false여도 파서의 배치·숫자 검증 유지
     * @returns {Promise<import('./vo/UA3FDataVos.js').UA3FDecodedBufferVo>} 워커가 검증한 원본 버퍼 참조, 소유권 이전으로 입력은 분리됨
     */
    load(contextVo: UA3FTaskContextVo, bufferVo: UA3FBufferVo, layoutVo: UA3FLayoutVo, signal: AbortSignal, verifyHash?: boolean): Promise<UA3FDecodedBufferVo>;
    /**
     * 관리 상태의 외부 교체를 거부합니다.
     *
     * @param {string} value 정규화한 메타정보 절대 URL, 기존 값 또는 참조와 동일한 경우만 허용
     */
    set metadataUrl(value: string);
    /**
     * 정규화한 메타정보 절대 URL 값을 반환합니다.
     *
     * @returns {string} 정규화한 메타정보 절대 URL
     */
    get metadataUrl(): string;
    /**
     * 관리 상태의 외부 교체를 거부합니다.
     *
     * @param {import('./UA3FTaskManager.js').UA3FTaskManager} value 레이어가 소유하고 로더가 빌린 작업 관리자, 기존 값 또는 참조와 동일한 경우만 허용
     */
    set taskManager(value: UA3FTaskManager);
    /**
     * 레이어가 소유하고 로더가 빌린 작업 관리자 값을 반환합니다.
     *
     * @returns {import('./UA3FTaskManager.js').UA3FTaskManager} 레이어가 소유하고 로더가 빌린 작업 관리자
     */
    get taskManager(): UA3FTaskManager;
    /**
     * 관리 상태의 외부 교체를 거부합니다.
     *
     * @param {typeof fetch} value 주입하거나 전역 fetch에서 얻은 통신 함수, 기존 값 또는 참조와 동일한 경우만 허용
     */
    set fetchFunction(value: typeof fetch);
    /**
     * 주입하거나 전역 fetch에서 얻은 통신 함수 값을 반환합니다.
     *
     * @returns {typeof fetch} 주입하거나 전역 fetch에서 얻은 통신 함수
     */
    get fetchFunction(): typeof fetch;
    #private;
}

/**
 * 한 playback 세션의 여러 캐시·후보·retired 프레임 원시 버퍼를 같은 예산으로 관리합니다.
 *
 * @group A3F
 */
declare class UA3FCacheBudgetManager {
    /**
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FCacheBudgetManager 클래스 생성자입니다. <br>
     * 검증한 바이트 한도를 독립 VO로 보관합니다.
     *
     * @param {UA3FCacheBudgetManagerCO} opt 예산 설정(optionsVo는 복사, 한도는 null 또는 양의 안전한 정수 바이트)
     */
    constructor(opt: UA3FCacheBudgetManagerCO);
    /** @type {import('./vo/UA3FPlaybackVos.js').UA3FCacheBudgetOptionsVo} */
    _optionsVo: UA3FCacheBudgetOptionsVo;
    /** @type {UA3FCacheBudgetState} */
    _state: UA3FCacheBudgetState;
    /**
     * 고유 캐시와 회수·재시도 콜백을 등록합니다.
     *
     * @param {string} ownerId 비어 있지 않은 실제 캐시 인스턴스 ID, 중복 불가
     * @param {function(string):boolean} evict 준비 완료 파일을 실제로 제거한 경우에만 true를 반환, 관리자가 자원 소유권을 받지 않음
     * @param {function():void} notify 예산 변화 후 캐시 펌프를 재시도하는 함수, 별도 인수 없음, 예산 변화 후 펌프 재시도
     */
    registerOwner(ownerId: string, evict: (arg0: string) => boolean, notify: () => void): void;
    /**
     * HTTP 이전에 실제 할당 하나의 바이트를 원자적으로 예약합니다.
     *
     * @param {string} ownerId 등록한 캐시 인스턴스 ID
     * @param {string} bufferId 해당 캐시의 고유 파일 ID, 같은 URL의 별도 할당은 별도 owner로 합산
     * @param {number} byteLength 예약할 바이트 수(양의 안전한 정수)
     * @param {'required' | 'full' | 'prefetch'} priority 필수 표시/전체 보관/선행 요청, 선행은 다른 버퍼를 회수하지 않음
     * @returns {string | null} 소유자가 실제 종료까지 보관할 토큰 또는 현재 입장 불가 null
     */
    tryReserve(ownerId: string, bufferId: string, byteLength: number, priority: "required" | "full" | "prefetch"): string | null;
    /**
     * 예약을 같은 토큰의 상주 바이트로 전환합니다.
     *
     * @param {string} token 등록된 예약 토큰, 중복 전환은 무동작
     */
    markResident(token: string): void;
    /**
     * lease·목표 준비·full 정책의 회수 보호를 갱신합니다.
     *
     * @param {string} token 등록된 토큰
     * @param {boolean} value 보호하면 true, 진행 중 예약은 false여도 물리 종료 전 회수 불가
     */
    setProtected(token: string, value: boolean): void;
    /**
     * 회수 우선순위의 최근 사용 순서를 기록합니다.
     *
     * @param {string} token 등록된 토큰, 원시 버퍼 복사 없음
     */
    touch(token: string): void;
    /**
     * 실제 보유와 물리 처리가 끝난 예약을 한 번 반환합니다.
     *
     * @param {string} token 등록된 토큰, 중복 반환은 false
     * @returns {boolean} 최초 반환이면 true
     */
    release(token: string): boolean;
    /**
     * 캐시의 신규 예약을 차단하고 잔여 토큰이 없을 때 등록을 제거합니다.
     *
     * @param {string} ownerId 등록한 인스턴스 ID, 이미 제거됐으면 무동작
     */
    unregisterOwner(ownerId: string): void;
    /**
     * 실제 할당의 예약/상주/보호 합계를 독립 VO로 반환합니다.
     *
     * @returns {import('./vo/UA3FPlaybackVos.js').UA3FCacheBudgetStatusVo} 바이트 상태 사본, GPU와 정적 형상 제외
     */
    getStatus(): UA3FCacheBudgetStatusVo;
    /**
     * 신규 예약을 차단하고 기존 토큰을 실제 반납까지 추적합니다.
     */
    dispose(): void;
    /**
     * 설정의 실행 중 교체를 막습니다.
     *
     * @param {import('./vo/UA3FPlaybackVos.js').UA3FCacheBudgetOptionsVo} value 생성 시 설정과 같은 한도만 허용, 실행 중 축소/확대 불가, 실행 중 변경 불가
     */
    set optionsVo(value: UA3FCacheBudgetOptionsVo);
    /**
     * 고정 설정 사본을 반환합니다.
     *
     * @returns {import('./vo/UA3FPlaybackVos.js').UA3FCacheBudgetOptionsVo} 고정 설정 사본
     */
    get optionsVo(): UA3FCacheBudgetOptionsVo;
    /**
     * 운영 상태의 외부 교체를 거부합니다.
     *
     * @param {import('./vo/UA3FPlaybackVos.js').UA3FCacheBudgetStatusVo} value 직접 교체할 수 없는 상태 사본, 항상 TypeError
     */
    set state(value: UA3FCacheBudgetStatusVo);
    /**
     * 내부 Map을 노출하지 않는 상태 사본을 반환합니다.
     *
     * @returns {import('./vo/UA3FPlaybackVos.js').UA3FCacheBudgetStatusVo} 내부 Map을 노출하지 않는 상태 사본
     */
    get state(): UA3FCacheBudgetStatusVo;
    #private;
}

declare global {
    /**
     * UA3FFrameCacheManager 생성자 옵션입니다.
     */
    type UA3FFrameCacheManagerCO_Content = {
        /**
         * 로더와 같은 데이터셋 식별자
         */
        datasetId: string;
        /**
         * 선택한 공간 노드 식별자
         */
        nodeId: string;
        /**
         * 105의 양의 안전 정수인 등록 토큰
         */
        nodeRevision: number;
        /**
         * 공용 형상 식별자
         */
        geometryId: string;
        /**
         * 순번 오름차순 프레임 정의
         */
        frames: Array<UA3FFrameVo>;
        /**
         * 메타정보 파일 목록
         */
        buffers: Array<UA3FBufferVo>;
        /**
         * 메타정보 배치 목록
         */
        layouts: Array<UA3FLayoutVo>;
        /**
         * 같은 데이터셋의 프레임 로더, 해제하지 않음
         */
        loader: UA3FFrameLoader;
        /**
         * 호출자 명시값 > metadata 기본값 > streaming/3 순서로 정규화한 정책
         */
        optionsVo: UA3FFrameCacheOptionsVo;
        /**
         * 모든 노드와 공유하는 빌린 예산 관리자, 캐시 dispose로 해제하지 않음
         */
        budgetManager?: UA3FCacheBudgetManager | null | undefined;
    };
    /**
     * UA3FFrameCacheManager 생성자 옵션입니다.
     */
    type UA3FFrameCacheManagerCO = UA3FFrameCacheManagerCO_Content;
    /**
     * 캐시 구현의 UA3FFrameCacheEntry 자료입니다.
     */
    type UA3FFrameCacheEntry = {
        /**
         * 파일 정의 사본
         */
        buffer: UA3FBufferVo;
        /**
         * 고정한 작업 문맥
         */
        context: UA3FTaskContextVo;
        /**
         * HTTP 이전에 확보한 할당별 예산 토큰
         */
        budgetToken: string | null;
        /**
         * 소유 HTTP 취소 제어
         */
        controller: AbortController;
        /**
         * 실제 파이프라인 미완료 여부
         */
        loading: boolean;
        /**
         * 준비된 고정 버퍼 또는 null
         */
        decoded: UA3FDecodedBufferVo | null;
        /**
         * 버퍼 보존 식별자
         */
        leases: Set<string>;
        /**
         * 최근 사용 순번
         */
        sequence: number;
    };
    /**
     * 캐시 구현의 UA3FFrameCacheWaiter 자료입니다.
     */
    type UA3FFrameCacheWaiter = {
        /**
         * 선택 요청 순번
         */
        requestId: number;
        /**
         * 요청한 등록 순번
         */
        requestedFrameIndex: number;
        /**
         * 실제 유효 프레임
         */
        frame: UA3FFrameVo;
        /**
         * 성공 통지
         */
        resolve: (value: UA3FFrameLeaseVo) => void;
        /**
         * 실패 통지
         */
        reject: (reason: unknown) => void;
    };
    /**
     * 캐시 구현의 UA3FFrameCacheLease 자료입니다.
     */
    type UA3FFrameCacheLease = {
        /**
         * 반환 권한 객체
         */
        vo: UA3FFrameLeaseVo;
        /**
         * 권한 발급 시 선택 순번
         */
        requestId: number;
        /**
         * 요청한 등록 순번
         */
        frameIndex: number;
        /**
         * 발급한 자원 참조
         */
        resource: UA3FFrameResourceVo;
        /**
         * 보호 파일 식별자
         */
        bufferId: string;
    };
    /**
     * 캐시 구현의 UA3FFrameCachePreload 자료입니다.
     */
    type UA3FFrameCachePreload = {
        /**
         * 동시 호출이 합류하는 완료
         */
        promise: Promise<UA3FFrameCacheStatusVo>;
        /**
         * 전체 성공 통지
         */
        resolve: (value: UA3FFrameCacheStatusVo) => void;
        /**
         * 전체 실패 통지
         */
        reject: (reason: unknown) => void;
        /**
         * 실패 통지 후 물리 파이프라인 정리 중 여부
         */
        failed: boolean;
    };
    /**
     * 캐시 구현의 UA3FFrameCacheState 자료입니다.
     */
    type UA3FFrameCacheState = {
        /**
         * 데이터셋 식별자
         */
        datasetId: string;
        /**
         * 공간 노드 식별자
         */
        nodeId: string;
        /**
         * 105 노드 등록 토큰
         */
        nodeRevision: number;
        /**
         * 공용 형상 식별자
         */
        geometryId: string;
        /**
         * 생성 시 공유 워커 세대
         */
        generation: number;
        /**
         * 고정한 정책 사본
         */
        options: UA3FFrameCacheOptionsVo;
        /**
         * 프레임 순서
         */
        frames: Array<UA3FFrameVo>;
        /**
         * 등록 순번 조회
         */
        frameMap: Map<number, UA3FFrameVo>;
        /**
         * previous-frame 해석 결과
         */
        effective: Map<number, UA3FFrameVo | null>;
        /**
         * 현재 노드 고유 파일
         */
        buffers: Map<string, UA3FBufferVo>;
        /**
         * 고유 파일의 대표 문맥
         */
        bufferFrames: Map<string, UA3FFrameVo>;
        /**
         * 배치 사본
         */
        layouts: Map<string, UA3FLayoutVo>;
        /**
         * 준비 또는 진행 항목
         */
        entries: Map<string, UA3FFrameCacheEntry>;
        /**
         * 발급한 보존 권한
         */
        leases: Map<string, UA3FFrameCacheLease>;
        /**
         * 빌린 세션 예산 관리자
         */
        budgetManager: UA3FCacheBudgetManager | null;
        /**
         * 예산 때문에 회수되어 즉시 재요청하지 않는 선행 파일 ID
         */
        budgetPaused: Set<string>;
        /**
         * 목표와 선행 파일 창
         */
        wanted: Array<string>;
        /**
         * 현재 선택에서 실패해 자동 재시도를 막은 파일
         */
        blocked: Set<string>;
        /**
         * 선택 순번, 선택 전 0
         */
        requestId: number;
        /**
         * 현재 요청 또는 null
         */
        requestedFrameIndex: number | null;
        /**
         * 최신 선택 대기
         */
        waiter: UA3FFrameCacheWaiter | null;
        /**
         * 전체 준비 대기
         */
        preload: UA3FFrameCachePreload | null;
        /**
         * 작업과 권한 발급 순번
         */
        sequence: number;
        /**
         * 작업 식별자 충돌을 막는 UUID
         */
        instanceId: string;
        /**
         * 소유 캐시 종료 여부
         */
        disposed: boolean;
        /**
         * 공유 워커 세대·취소로 인한 무효 상태
         */
        invalidated: boolean;
        /**
         * 펌프 재진입 방지
         */
        pumping: boolean;
        /**
         * 최근 실제 오류
         */
        lastError: Error | null;
    };
}

declare global {
    /**
     * UA3FFrameLoader 생성자 옵션입니다.
     */
    type UA3FFrameLoaderCO_Content = {
        /**
         * 절대 메타정보 URL, 각 파일 uri의 기준
         */
        metadataUrl: string;
        /**
         * 레이어가 소유한 빌린 작업 관리자, 로더는 해제하지 않음
         */
        taskManager: UA3FTaskManager;
        /**
         * 주입한 fetch 함수, 생략 시 전역 fetch
         */
        fetchFunction?: typeof fetch | undefined;
    };
    /**
     * UA3FFrameLoader 생성자 옵션입니다.
     */
    type UA3FFrameLoaderCO = UA3FFrameLoaderCO_Content;
}

declare global {
    /**
     * 정적 연결과 시간별 대기 필드를 보관하는 내부 처리 자료입니다.
     */
    type UA3FGeometryFactoryBindings = {
        /**
         * attribute 이름 → 정적 fieldId
         */
        staticBindings: Map<string, string>;
        /**
         * 프레임 수신 시 연결할 중복 없는 fieldId
         */
        pendingFieldIds: Array<string>;
    };
    /**
     * Geometry의 position 공간에 맞춘 표시 경계입니다.
     */
    type UA3FGeometryFactoryBounds = {
        /**
         * 보수적인 경계 최솟값
         */
        min: [number, number, number];
        /**
         * 보수적인 경계 최댓값
         */
        max: [number, number, number];
    };
    /**
     * 형상 구성에 사용할 배열과 출력 좌표를 보관합니다.
     */
    type UA3FGeometryFactoryPrepared = {
        /**
         * 원본 world view 또는 새 환산 배열
         */
        position: Float32Array;
        /**
         * 원본 인덱스 view
         */
        index: Uint16Array | Uint32Array;
        /**
         * 실제 position 공간을 표현하는 출력 좌표
         */
        coordinates: UA3FCoordinateVo;
        /**
         * 출력 공간의 표시 경계 최솟값
         */
        boundsMin: [number, number, number];
        /**
         * 출력 공간의 표시 경계 최댓값
         */
        boundsMax: [number, number, number];
        /**
         * projected 환산에서 만든 정점별 배율 또는 null
         */
        scaleArray: Float32Array | null;
        /**
         * 새 배율 attribute 이름 또는 null
         */
        scaleName: string | null;
    };
}

declare global {
    /**
     * 셰이더에 연결한 실제 attribute의 작은 사본입니다.
     */
    type UA3FHeightAttribute = {
        /**
         * 실제 GLSL attribute 이름
         */
        name: string;
        /**
         * Float32 벡터 폭, 1~4
         */
        itemSize: number;
    };
    /**
     * 순서와 중복을 유지하는 높이 피연산자입니다.
     */
    type UA3FHeightOperand = UA3FHeightAttribute & {
        component: number;
    };
    /**
     * 생성 시 입력 VO에서 복사한 셰이더 설정입니다.<br>
     * 배열은 이 팩토리에서 새로 만들며 geometry와 원본 필드는 보관하지 않습니다.
     */
    type UA3FHeightShaderProfile = {
        /**
         * 연산 순서와 0 기반 성분을 보관한 입력 목록
         */
        inputs: Array<UA3FHeightOperand>;
        /**
         * 중복을 제거한 실제 attribute 이름과 벡터 폭
         */
        declarations: Array<[string, number]>;
        /**
         * 정점별 배율 attribute 이름 또는 공통 배율이면 null
         */
        scaleName: string | null;
        /**
         * 공통 월드 배율, 정점별 방식이면 사용하지 않는 1
         */
        scaleValue: number;
        /**
         * 정규화한 출력 좌표의 배율 방식
         */
        mode: "per-node-latitude" | "reference-y";
        /**
         * local이면 출력 origin의 Z, absolute이면 0, 월드 좌표(EPSG:3857) 단위
         */
        originZ: number;
        /**
         * 배율 적용 전에 더하는 표시 오프셋, 미터 단위
         */
        offset: number;
    };
}

declare global {
    /**
     * UA3FMetadataLoader 생성자 옵션입니다.
     */
    type UA3FMetadataLoaderCO_Content = {
        /**
         * globalThis receiver로 실행할 통신 함수, 생략 시 전역 fetch
         */
        fetchFunction?: typeof fetch | undefined;
    };
    /**
     * UA3FMetadataLoader 생성자 옵션입니다.
     */
    type UA3FMetadataLoaderCO = UA3FMetadataLoaderCO_Content;
}

declare global {
    /**
     * 입자 실행기 생성 연결입니다.
     */
    type UA3FParticleFlowCO_Content = {
        /**
         * 확정 벡터 정의, 빌림
         */
        vectorFieldVo: UA3FVectorFieldVo;
        /**
         * 검증할 입자 옵션
         */
        optionsVo: UA3FParticleFlowOptionsVo;
        /**
         * 전체 파생 payload 사전 예약
         */
        reserveDerived: (arg0: number) => void;
        /**
         * 예약·상주 payload 반납
         */
        releaseDerived: (arg0: number) => void;
    };
    /**
     * 생성 옵션 별칭입니다.
     */
    type UA3FParticleFlowCO = UA3FParticleFlowCO_Content;
    /**
     * 노드별 입자 실행 상태입니다. 외부는 읽기만 수행합니다.
     */
    type UA3FParticleFlowState = {
        /**
         * 빌린 사전 예약 함수
         */
        reserve: (arg0: number) => void;
        /**
         * 빌린 반납 함수
         */
        release: (arg0: number) => void;
        /**
         * 소유 payload와 예약 바이트
         */
        bytes: number;
        /**
         * 빌린 현재 renderer
         */
        renderer: WebGLRenderer | null;
        /**
         * context 손실 관찰 여부
         */
        lost: boolean;
        /**
         * 소유한 CSS sRGB 5색 사본 또는 기존 표시 복원의 null, VO와 원본 자료는 변경하지 않음
         */
        palette: Array<string> | null;
        /**
         * 해제 완료 여부
         */
        disposed: boolean;
        /**
         * 소유 field/state/history target; 모든 target은 단일 RGBA float 색상 attachment이며 state는 로컬 XY·나이 초·세대를 보관
         */
        targets: Map<string, WebGLRenderTarget>;
        /**
         * 소유 계산·표시 재질
         */
        materials: Array<ShaderMaterial>;
        /**
         * 소유 정적 GPU 입력
         */
        textures: Array<DataTexture>;
        /**
         * 소유 quad·꼬리 geometry
         */
        ownedGeometry: Array<BufferGeometry>;
        /**
         * 계산 전용 장면
         */
        scene: Scene;
        /**
         * 계산 전용 카메라
         */
        camera: OrthographicCamera;
        /**
         * 소유 계산 quad
         */
        quad: Mesh<PlaneGeometry, ShaderMaterial> | null;
        /**
         * 원본 geometry를 빌린 계산 mesh
         */
        fieldMesh: Mesh<BufferGeometry, ShaderMaterial> | null;
        /**
         * 소유 꼬리 표시 객체
         */
        object: Mesh<InstancedBufferGeometry, ShaderMaterial> | null;
        /**
         * 원본 정점 방향 기저의 GPU 입력
         */
        basis: DataTexture | null;
        /**
         * 젖은 로컬 XY 후보의 GPU 입력
         */
        seed: DataTexture | null;
        /**
         * 로컬 월드 좌표(EPSG:3857)의 minX/minY/폭/높이
         */
        box: Vector4;
        /**
         * 유속장 texture 폭·높이 texel
         */
        fieldSize: Vector2;
        /**
         * 입자 texture 폭·높이 texel
         */
        stateSize: Vector2;
        /**
         * 현재 parent renderer가 소유한 원시 입력
         */
        frame: UA3FFlowFrame | null;
        /**
         * 새 프레임 token, 미연결 -1
         */
        token: number;
        /**
         * 승인한 표시 token, 미연결 -1
         */
        committed: number;
        /**
         * GPU 필드의 token, 미생성 -1
         */
        fieldToken: number;
        /**
         * 필드 ping-pong0/1
         */
        fieldIndex: number;
        /**
         * 입자 ping-pong0/1
         */
        stateIndex: number;
        /**
         * 이력 ping-pong0/1
         */
        historyIndex: number;
        /**
         * 최근 이력 ring 슬롯
         */
        historySlot: number;
        /**
         * 다음 이력 기록까지 누적한 표시 초
         */
        historyTime: number;
        /**
         * 재배치 seed 세대
         */
        epoch: number;
        /**
         * 새 입자 배치 필요 여부
         */
        reset: boolean;
        /**
         * 유효 seed 후보 개수
         */
        seedCount: number;
        /**
         * 노드에 배분한 입자 수
         */
        limit: number;
        /**
         * 원본 전체 정점의 월드 속력 보수 상한
         */
        maxWorldSpeed: number;
        /**
         * CFL·분할 상한으로 표시 이동 시간을 제한했는지
         */
        timeLimited: boolean;
        /**
         * 빌린 높이 연산
         */
        policy: UA3FHeightPolicyVo | null;
        /**
         * 빌린 허용 m offset
         */
        display: UA3FHeightDisplayVo | null;
        /**
         * 추가 표면 mask
         */
        mask: UA3FFieldVo | null;
        /**
         * 추가 mask 임계값, 원래 단위
         */
        threshold: number;
        /**
         * 추가 mask 사용
         */
        maskEnabled: boolean;
        /**
         * normalized depth 보정
         */
        bias: number;
        /**
         * 빌린 출력 좌표 계약
         */
        coordinates: UA3FCoordinateVo | null;
        /**
         * 메타 필드 조회표
         */
        fields: Map<string, UA3FFieldVo>;
        /**
         * 필드 재생성 필요
         */
        dirty: boolean;
        /**
         * 빌린 공유 월드 Z 표시 보정, 미연결 undefined
         */
        terrainAttribute: BufferAttribute | InterleavedBufferAttribute | undefined;
        /**
         * 마지막 요청한 표시 보정 세대, 미연결 -1
         */
        terrainVersion: number;
        /**
         * 노드 표시 요청
         */
        visible: boolean;
        /**
         * 상위 표면의0..1 투명도 배율
         */
        opacityScale: number;
        /**
         * 완료한 GPU 표시 갱신 횟수
         */
        steps: number;
        /**
         * 빌린 색상·폭·투명도 설정
         */
        renderOptions: UA3FFlowOptionsVo | null;
    };
    /**
     * initialize 성공 후 확인한 GPU 상태입니다.
     */
    type UA3FParticleFlowInitialized = UA3FParticleFlowState & {
        renderer: WebGLRenderer;
        object: Mesh<InstancedBufferGeometry, ShaderMaterial>;
        basis: DataTexture;
        seed: DataTexture;
        fieldMesh: Mesh<BufferGeometry, ShaderMaterial>;
        quad: Mesh<PlaneGeometry, ShaderMaterial>;
        coordinates: UA3FCoordinateVo;
    };
    /**
     * 현재 프레임과 높이 정책까지 확인한 실행 상태입니다.
     */
    type UA3FParticleFlowActive = UA3FParticleFlowInitialized & {
        frame: UA3FFlowFrame;
        policy: UA3FHeightPolicyVo;
        display: UA3FHeightDisplayVo;
    };
}

declare global {
    /**
     * UA3FSpatialManager 생성자 옵션입니다.
     */
    type UA3FSpatialManagerCO_Content = {
        /**
         * 빌린 metadata 로더, 해제하지 않음
         */
        metadataLoader: UA3FMetadataLoader;
        /**
         * 값 범위가 유효한 정책, 생성 시 사본 보관
         */
        optionsVo: UA3FSpatialOptionsVo;
    };
    /**
     * UA3FSpatialManager 생성자 옵션입니다.
     */
    type UA3FSpatialManagerCO = UA3FSpatialManagerCO_Content;
    /**
     * 공간 선택 내부의 UA3FSpatialRequest 자료입니다.
     */
    type UA3FSpatialRequest = {
        /**
         * 정규화한 요청 URL
         */
        url: string;
        /**
         * 부모 요청 URL 또는 루트의 null
         */
        parentUrl: string | null;
        /**
         * 부모 참조 또는 null
         */
        reference: UA3FChildMetadataVo | null;
        /**
         * 루트 0 기준 깊이
         */
        depth: number;
        /**
         * 순환 검사에 사용할 조상 요청/응답 URL
         */
        ancestors: Array<string>;
    };
    /**
     * metadata 요청과 물리 완료·raw 길이를 보관합니다.
     */
    type UA3FSpatialEntry = UA3FSpatialRequest & {
        bytes: number;
        doc: UA3FMetadataVo | null;
        loading: boolean;
        controller: AbortController;
        task: Promise<void> | null;
        sequence: number;
    };
    /**
     * 공간 선택 내부의 UA3FSpatialCover 자료입니다.
     */
    type UA3FSpatialCover = {
        /**
         * 현재 표시할 커버 노드
         */
        keys: Array<string>;
        /**
         * 같은 콘텐츠로 유효한 공간 커버 여부
         */
        ready: boolean;
    };
    /**
     * 공간 선택 내부의 UA3FSpatialPass 자료입니다.
     */
    type UA3FSpatialPass = {
        /**
         * 선택 시점의 카메라 사본
         */
        view: UA3FSpatialViewVo;
        /**
         * 같은 콘텐츠의 준비 완료 키
         */
        ready: Set<string>;
        /**
         * 빌린 노드별 절대 월드 표시 경계, undefined면 기존 metadata 사용
         */
        renderBounds: Map<string, Box3> | undefined;
        /**
         * 준비·보존할 형상 문서
         */
        required: Map<string, UA3FMetadataVo>;
        /**
         * 보호할 metadata 요청 URL
         */
        pins: Set<string>;
        /**
         * 요청할 현재 문서
         */
        demand: Map<string, UA3FSpatialRequest>;
        /**
         * 아직 필요한 metadata URL
         */
        pending: Set<string>;
        /**
         * 이번 상세화 노드
         */
        expanded: Set<string>;
    };
    /**
     * 공간 선택 내부의 UA3FSpatialState 자료입니다.
     */
    type UA3FSpatialState = {
        /**
         * 이 관리자가 발급한 계획
         */
        selections: WeakSet<UA3FSpatialSelectionVo>;
        /**
         * 고정한 정책
         */
        options: UA3FSpatialOptionsVo;
        /**
         * 준비·진행 metadata
         */
        entries: Map<string, UA3FSpatialEntry>;
        /**
         * 현재 요구 문서
         */
        demand: Map<string, UA3FSpatialRequest>;
        /**
         * 보호된 문서 경로
         */
        pins: Set<string>;
        /**
         * 현재 요구의 실패
         */
        failures: Map<string, Error>;
        /**
         * 응답 URL별 요청 소유자
         */
        canonicalOwners: Map<string, string>;
        /**
         * 준비·표시 유지 중인 노드
         */
        retained: Map<string, UA3FMetadataVo>;
        /**
         * 직전 표시 커버
         */
        visible: Map<string, UA3FMetadataVo>;
        /**
         * 직전 상세화 상태
         */
        expanded: Set<string>;
        /**
         * 고정한 루트 요청 URL
         */
        rootUrl: string | null;
        /**
         * 루트 준비 공유 Promise
         */
        rootPromise: Promise<UA3FMetadataVo> | null;
        /**
         * 선택 전 0인 순번
         */
        selectionId: number;
        /**
         * 최근 사용 순번
         */
        sequence: number;
        /**
         * 요청 펌프 재진입 방지
         */
        pumping: boolean;
        /**
         * 종료 여부
         */
        disposed: boolean;
        /**
         * 현재 보류 용량 오류
         */
        capacityError: Error | null;
        /**
         * 선택 콘텐츠 기준 또는 미선택 null
         */
        contentKey: string | null;
    };
}

declare global {
    /**
     * 공간 선택에서 지원하는 Three 카메라입니다.
     */
    type UA3FSpatialCamera = PerspectiveCamera | OrthographicCamera;
}

declare global {
    /**
     * 한 레이어가 소유하는 A3F 작업 관리자의 생성자 옵션입니다.<br>
     * 워커 수와 대기 한도는 첫 작업 등록 전에만 변경할 수 있습니다.
     */
    type UA3FTaskManagerCO_Content = {
        /**
         * 비어 있지 않은 데이터셋 식별자
         */
        datasetId: string;
        /**
         * 절대 Worker 폴더 URL, 끝 슬래시 필요, null은 기존 SDK 기본 경로
         */
        workerBaseUrl?: string | null | undefined;
        /**
         * 양의 안전 정수인 물리 워커 수와 동시 실행 상한
         */
        workerCount?: number | undefined;
        /**
         * 0 이상의 안전 정수인 실행 전 대기 수 상한
         */
        maxQueuedTasks?: number | undefined;
        /**
         * 0 이상의 안전 정수인 대기 backing buffer 바이트 상한
         */
        maxQueuedBytes?: number | undefined;
    };
    /**
     * 한 레이어가 소유하는 A3F 작업 관리자의 생성자 옵션입니다.<br>
     * 워커 수와 대기 한도는 첫 작업 등록 전에만 변경할 수 있습니다.
     */
    type UA3FTaskManagerCO = UA3FTaskManagerCO_Content;
    /**
     * A3F 워커 해석 요청의 선택 옵션입니다.<br>
     * 입력을 전송하면 기존 버퍼는 분리되며 실패·취소 시 입력을 반환하지 않습니다.
     */
    type UA3FTaskManagerDecodeOptions = {
        /**
         * 워커 파서에서 SHA-256 확인 여부이며 false여도 배치와 숫자 검증 유지
         */
        verifyHash?: boolean | undefined;
        /**
         * 실제 전송 시 입력 버퍼 소유권 이전 여부이며 false이면 구조화 복사
         */
        transferInput?: boolean | undefined;
    };
    /**
     * 인코딩 요청의 선택 옵션입니다.
     */
    type UA3FTaskManagerEncodeOptions = {
        /**
         * true이면 입력 backing buffer 전체를 이전하고 모든 공유 view가 분리됨
         */
        transferInput?: boolean | undefined;
    };
    /**
     * Manager 안에서 Promise 종결과 실제 워커 슬롯을 추적하는 구현 자료입니다.
     */
    type UA3FTaskManagerEntry = {
        /**
         * 등록 시 고정한 작업 문맥
         */
        context: UA3FTaskContextVo;
        /**
         * 워커 코덱 메서드 이름
         */
        subType: ("decode" | "encode");
        /**
         * 전송 정의이며 실제 종결 후 참조 해제를 위해 null
         */
        data: (UA3FParserTaskDecodeRequest | UA3FParserTaskEncodeRequest | null);
        /**
         * 중복 없는 입력 이전 목록이며 구조화 복사 요청은 빈 배열
         */
        transferList: Array<ArrayBuffer>;
        /**
         * 공유 backing buffer를 요청 안에서 한 번씩 합산한 바이트 수
         */
        byteLength: number;
        /**
         * 양의 안전 정수인 등록 순번
         */
        sequence: number;
        /**
         * 전송 준비 대기를 포함하는 물리 작업 상태
         */
        state: ("queued" | "running");
        /**
         * 대기 중 -1이며 실행 시 0 기반 물리 슬롯
         */
        workerIndex: number;
        /**
         * 입력 참조와 실제 슬롯이 반환될 때 알릴 완료 함수 목록
         */
        physicalWaiters: Array<() => void>;
        /**
         * 호출자 Promise의 종결 여부이며 취소된 실행 작업은 응답까지 Map에 유지
         */
        settled: boolean;
        /**
         * 성공 시 한 번 호출할 완료 함수
         */
        resolve: (value: UA3FDecodedBufferVo | ArrayBuffer) => void;
        /**
         * 실패·취소 시 한 번 호출할 거부 함수
         */
        reject: (reason: unknown) => void;
    };
}

declare global {
    /**
     * UA3FTimelineController 생성자 옵션입니다.
     */
    type UA3FTimelineControllerCO_Content = {
        /**
         * 등록 순번 오름차순·시각 비감소 목록
         */
        frames: Array<UA3FFrameVo>;
        /**
         * 기본값이 정규화된 재생 정책
         */
        optionsVo: UA3FTimelineOptionsVo;
        /**
         * 빌린 단일 표시 공급자, 자체 수명은 owner 책임
         */
        playbackApi: UA3FTimelinePlaybackApi;
    };
    /**
     * UA3FTimelineController 생성자 옵션입니다.
     */
    type UA3FTimelineControllerCO = UA3FTimelineControllerCO_Content;
    /**
     * 재생 주요 상태입니다.
     */
    type UA3FTimelineStatus = "idle" | "paused" | "playing" | "buffering" | "configuring" | "error" | "ended" | "disposed";
    /**
     * UA3FTimelinePlaybackApi의 계약입니다.
     */
    type UA3FTimelinePlaybackApi = {
        /**
         * 정책 원자 적용, full은 전체 준비 완료까지 대기, 실패 시 기존 정책 유지
         */
        configure: (optionsVo: UA3FFrameCacheOptionsVo) => Promise<void>;
        /**
         * 등록 프레임 선택과 보존 권한 발급
         */
        select: (frameIndex: number, direction: UA3FTimelineDirection) => Promise<UA3FFrameLeaseVo>;
        /**
         * 공급자의 최신 권한인지 확인
         */
        isCurrent: (leaseVo: UA3FFrameLeaseVo) => boolean;
        /**
         * 동기 적용, 실패 시 직전 표시 보존
         */
        apply: (leaseVo: UA3FFrameLeaseVo) => void;
        /**
         * 권한을 발급했던 원래 캐시 소유자에게 반납
         */
        release: (leaseVo: UA3FFrameLeaseVo) => void;
        /**
         * 현재 준비·예약 상태 조회
         */
        getStatus: () => UA3FFrameCacheStatusVo;
        /**
         * 현재 표시 경로만 제거/원복, 공유 자원 수명 종료 금지
         */
        clearDisplay: () => void;
    };
    /**
     * UA3FTimelineRuntime의 계약입니다.
     */
    type UA3FTimelineRuntime = {
        /**
         * 독립 적용 정책
         */
        options: UA3FTimelineOptionsVo;
        /**
         * 현재 주요 상태
         */
        status: UA3FTimelineStatus;
        /**
         * 공급자 최초 정책 준비 성공 여부
         */
        initialized: boolean;
        /**
         * 실제 종료 여부
         */
        disposed: boolean;
        /**
         * 재생 의도
         */
        playing: boolean;
        /**
         * 목표 원본 시간
         */
        time: number | null;
        /**
         * 목표 등록 frameIndex
         */
        index: number | null;
        /**
         * 실제 유효 원본 시간
         */
        displayedTime: number | null;
        /**
         * 실제 적용 frameIndex
         */
        displayedIndex: number | null;
        /**
         * 요청 순번
         */
        requestId: number;
        /**
         * 현재 원인 참조
         */
        error: Error | null;
        /**
         * 현재 표시 보존 권한
         */
        lease: UA3FFrameLeaseVo | null;
        /**
         * 현재 선택 파이프라인
         */
        pending: Promise<void> | null;
        /**
         * 현재 정책 설정 파이프라인
         */
        configuration: Promise<void> | null;
        /**
         * 상태 구독 함수 집합
         */
        listeners: Set<UA3FTimelineStateListener>;
    };
    /**
     * 등록 목록 탐색 방향입니다.
     */
    type UA3FTimelineDirection = 1 | -1;
    /**
     * 재생 상태의 구독과 해제 함수입니다.
     */
    type UA3FTimelineStateListener = (stateVo: UA3FTimelineStateVo) => void;
    /**
     * 재생 상태의 구독과 해제 함수입니다.
     */
    type UA3FTimelineSubscription = () => void;
}

declare global {
    /**
     * 파일과 공용 배치를 연결하는 UA3FBufferVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 VO는 파일 요청과 해시 검증을 수행하지 않습니다.
     */
    type UA3FBufferVoCO_Content = {
        /**
         * 바이너리 파일 식별자
         */
        bufferId: string;
        /**
         * metadata URL 기준으로 해석할 파일 URI
         */
        uri: string;
        /**
         * 바이트 단위 길이
         */
        byteLength: number;
        /**
         * 파일의 SHA-256을 나타내는 64자리 소문자 16진수
         */
        sha256: string;
        /**
         * 공용 배열 배치 식별자
         */
        layoutId: string;
    };
    /**
     * 파일과 공용 배치를 연결하는 UA3FBufferVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 VO는 파일 요청과 해시 검증을 수행하지 않습니다.
     */
    type UA3FBufferVoCO = UA3FBufferVoCO_Content;
    /**
     * 배열 배치를 보관하는 UA3FArrayLayoutVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 값의 범위와 필드 간 일관성은 파서가 검증합니다.
     */
    type UA3FArrayLayoutVoCO_Content = {
        /**
         * 필드 식별자
         */
        fieldId: string;
        /**
         * Float32·Float64·Uint16·Uint32 중 바이너리 성분 타입
         */
        componentType: ("Float32" | "Float64" | "Uint16" | "Uint32");
        /**
         * node·index·triangle 중 값의 연결 대상
         */
        association: ("node" | "index" | "triangle");
        /**
         * 항목 수인 양의 안전 정수
         */
        count: number;
        /**
         * 배열 너비인 양의 안전 정수
         */
        width: number;
        /**
         * 배열 높이인 양의 안전 정수
         */
        height: number;
        /**
         * 항목당 성분 수인 1~4의 정수
         */
        itemSize: (1 | 2 | 3 | 4);
        /**
         * 정수 attribute 정규화 여부
         */
        normalized: boolean;
        /**
         * 파일 시작부터의 바이트 위치인 0 기반 8의 배수
         */
        byteOffset: number;
        /**
         * 바이트 단위 길이
         */
        byteLength: number;
    };
    /**
     * 배열 배치를 보관하는 UA3FArrayLayoutVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 값의 범위와 필드 간 일관성은 파서가 검증합니다.
     */
    type UA3FArrayLayoutVoCO = UA3FArrayLayoutVoCO_Content;
    /**
     * 공용 배치를 보관하는 UA3FLayoutVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 값 검증은 사용하는 모듈이 담당합니다.<br>
     * 배열 배치 목록과 목록의 VO는 복사하지 않고 참조로 보관합니다.
     */
    type UA3FLayoutVoCO_Content = {
        /**
         * 공용 배열 배치 식별자
         */
        layoutId: string;
        /**
         * 바이트 단위 길이
         */
        byteLength: number;
        /**
         * 원소를 복사하지 않고 참조하는 배열 VO 목록
         */
        arrays: Array<UA3FArrayLayoutVo>;
    };
    /**
     * 공용 배치를 보관하는 UA3FLayoutVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 값 검증은 사용하는 모듈이 담당합니다.<br>
     * 배열 배치 목록과 목록의 VO는 복사하지 않고 참조로 보관합니다.
     */
    type UA3FLayoutVoCO = UA3FLayoutVoCO_Content;
    /**
     * 필드 의미와 저장 구분을 보관하는 UA3FFieldVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 값 검증은 사용하는 모듈이 담당합니다.<br>
     * 성분 이름 배열과 통계 VO는 복사하지 않고 참조로 보관합니다.
     */
    type UA3FFieldVoCO_Content = {
        /**
         * 필드 식별자
         */
        fieldId: string;
        /**
         * 화면 표시 이름
         */
        label: string;
        /**
         * 필드의 의미 설명
         */
        description: string;
        /**
         * 값의 단위 또는 미확정 상태의 null
         */
        unit: (string | null);
        /**
         * node·index·triangle 중 값의 연결 대상
         */
        association: ("node" | "index" | "triangle");
        /**
         * static·frame 중 저장 구분
         */
        storage: ("static" | "frame");
        /**
         * 1~4개 성분 이름 배열
         */
        components: Array<string>;
        /**
         * 성분별 통계 VO 또는 통계가 없을 때의 null
         */
        statistics: (UA3FArrayStatisticsVo | null);
    };
    /**
     * 필드 의미와 저장 구분을 보관하는 UA3FFieldVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 값 검증은 사용하는 모듈이 담당합니다.<br>
     * 성분 이름 배열과 통계 VO는 복사하지 않고 참조로 보관합니다.
     */
    type UA3FFieldVoCO = UA3FFieldVoCO_Content;
    /**
     * 성분별 통계를 보관하는 UA3FArrayStatisticsVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 세 통계 배열은 필드의 성분 순서에 맞춥니다.<br>
     * 배열은 복사하지 않고 참조로 보관하며 값 검증은 사용하는 모듈이 담당합니다.
     */
    type UA3FArrayStatisticsVoCO_Content = {
        /**
         * 필드 식별자
         */
        fieldId: string;
        /**
         * 성분 순서별 최솟값 배열
         */
        minimum: Array<number>;
        /**
         * 성분 순서별 최댓값 배열
         */
        maximum: Array<number>;
        /**
         * 성분 순서별 최대 절대 오차 배열
         */
        maxAbsoluteError: Array<number>;
    };
    /**
     * 성분별 통계를 보관하는 UA3FArrayStatisticsVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 세 통계 배열은 필드의 성분 순서에 맞춥니다.<br>
     * 배열은 복사하지 않고 참조로 보관하며 값 검증은 사용하는 모듈이 담당합니다.
     */
    type UA3FArrayStatisticsVoCO = UA3FArrayStatisticsVoCO_Content;
    /**
     * 배열 배치와 숫자 배열을 보관하는 UA3FDecodedArrayVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 배치 VO와 TypedArray는 복사하지 않고 참조로 보관합니다.<br>
     * TypedArray의 기반 버퍼는 공유되며 VO 자체는 버퍼 소유권을 이전하지 않습니다.
     */
    type UA3FDecodedArrayVoCO_Content = {
        /**
         * 해석에 사용한 배열 배치 VO
         */
        layout: UA3FArrayLayoutVo;
        /**
         * 원본 버퍼를 참조하는 TypedArray
         */
        array: (Float32Array | Float64Array | Uint16Array | Uint32Array);
    };
    /**
     * 배열 배치와 숫자 배열을 보관하는 UA3FDecodedArrayVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 배치 VO와 TypedArray는 복사하지 않고 참조로 보관합니다.<br>
     * TypedArray의 기반 버퍼는 공유되며 VO 자체는 버퍼 소유권을 이전하지 않습니다.
     */
    type UA3FDecodedArrayVoCO = UA3FDecodedArrayVoCO_Content;
    /**
     * 파일 하나의 해석 결과를 보관하는 UA3FDecodedBufferVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 기반 버퍼와 배열 목록은 복사하지 않고 참조로 보관합니다.<br>
     * 기반 버퍼와 각 TypedArray의 연결은 사용하는 모듈이 유지하며 VO 자체는 소유권을 이전하지 않습니다.
     */
    type UA3FDecodedBufferVoCO_Content = {
        /**
         * 바이너리 파일 식별자
         */
        bufferId: string;
        /**
         * 공용 배열 배치 식별자
         */
        layoutId: string;
        /**
         * 해석 결과 배열들이 참조하는 ArrayBuffer
         */
        arrayBuffer: ArrayBuffer;
        /**
         * 원소를 복사하지 않고 참조하는 배열 VO 목록
         */
        arrays: Array<UA3FDecodedArrayVo>;
    };
    /**
     * 파일 하나의 해석 결과를 보관하는 UA3FDecodedBufferVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 기반 버퍼와 배열 목록은 복사하지 않고 참조로 보관합니다.<br>
     * 기반 버퍼와 각 TypedArray의 연결은 사용하는 모듈이 유지하며 VO 자체는 소유권을 이전하지 않습니다.
     */
    type UA3FDecodedBufferVoCO = UA3FDecodedBufferVoCO_Content;
    /**
     * UA3FFrameVo의 필수 생성자 옵션입니다.<br>
     * 값의 유효성과 프레임 연결은 실행 모듈이 검증하며 배열·객체는 참조로 보관합니다.
     */
    type UA3FFrameVoCO_Content = {
        /**
         * 대상 공간 노드의 공용 형상 식별자
         */
        geometryId: string;
        /**
         * 0 기반 프레임 순번, 0 이상의 안전 정수
         */
        frameIndex: number;
        /**
         * 원본 숫자 시각, 시간 단위와 기준을 임의 환산하지 않음
         */
        time: number;
        /**
         * 바이너리 파일 식별자 또는 데이터 없는 프레임의 null
         */
        bufferId: string | null;
        /**
         * 성분별 원본 통계 목록, 배열 참조
         */
        statistics: Array<UA3FArrayStatisticsVo>;
    };
    /**
     * UA3FFrameVo의 필수 생성자 옵션입니다.<br>
     * 값의 유효성과 프레임 연결은 실행 모듈이 검증하며 배열·객체는 참조로 보관합니다.
     */
    type UA3FFrameVoCO = UA3FFrameVoCO_Content;
    /**
     * UA3FFrameApplyResultVo의 필수 생성자 옵션입니다.<br>
     * 값의 유효성과 프레임 연결은 실행 모듈이 검증하며 배열·객체는 참조로 보관합니다.
     */
    type UA3FFrameApplyResultVoCO_Content = {
        /**
         * 적용한 공용 형상 식별자
         */
        geometryId: string;
        /**
         * 적용한 0 기반 프레임 순번
         */
        frameIndex: number;
        /**
         * 변환하지 않은 원본 숫자 시각
         */
        time: number;
        /**
         * 적용한 바이너리 파일 식별자, null 불가
         */
        bufferId: string;
        /**
         * 이 프레임의 원본 배열 참조 조회표, CPU 필드 포함
         */
        sourceArrays: Map<string, UA3FDecodedArrayVo>;
        /**
         * GPU attribute에 연결한 중복 없는 frame 필드 식별자
         */
        updatedFieldIds: Array<string>;
        /**
         * 연결한 실제 attribute 이름, 같은 필드의 alias도 포함
         */
        updatedAttributeNames: Array<string>;
    };
    /**
     * UA3FFrameApplyResultVo의 필수 생성자 옵션입니다.<br>
     * 값의 유효성과 프레임 연결은 실행 모듈이 검증하며 배열·객체는 참조로 보관합니다.
     */
    type UA3FFrameApplyResultVoCO = UA3FFrameApplyResultVoCO_Content;
    /**
     * UA3FFrameResourceVo 생성자 옵션입니다.
     */
    type UA3FFrameResourceVoCO_Content = {
        /**
         * previous-frame 정책으로 선택한 실제 유효 프레임, null 불가
         */
        frameVo: UA3FFrameVo;
        /**
         * 해당 프레임의 파일 정의, null 불가
         */
        bufferVo: UA3FBufferVo;
        /**
         * 워커 결과 참조, 사용 중 변경·분리·재전송 금지
         */
        decodedBufferVo: UA3FDecodedBufferVo;
    };
    /**
     * UA3FFrameResourceVo 생성자 옵션입니다.
     */
    type UA3FFrameResourceVoCO = UA3FFrameResourceVoCO_Content;
    /**
     * UA3FFrameLeaseVo 생성자 옵션입니다.
     */
    type UA3FFrameLeaseVoCO_Content = {
        /**
         * 관리자 안에서 재사용하지 않는 보존 권한 식별자
         */
        leaseId: string;
        /**
         * 선택 요청 순번, 양의 안전 정수
         */
        requestId: number;
        /**
         * 요청한 등록 프레임의 0 기반 순번, 실제 유효 프레임과 다를 수 있음
         */
        requestedFrameIndex: number;
        /**
         * 공유 워커의 0 이상 요청 세대
         */
        taskGeneration: number;
        /**
         * 보호하는 빌린 프레임 참조, release 후 보관하면 회수 지연 가능
         */
        resourceVo: UA3FFrameResourceVo;
    };
    /**
     * UA3FFrameLeaseVo 생성자 옵션입니다.
     */
    type UA3FFrameLeaseVoCO = UA3FFrameLeaseVoCO_Content;
    /**
     * 작업 문맥을 보관하는 UA3FTaskContextVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 값의 범위와 프레임·세대의 연결은 UA3FTaskManager가 검증합니다.
     */
    type UA3FTaskContextVoCO_Content = {
        /**
         * 호출자가 지정한 작업 식별자
         */
        taskId: string;
        /**
         * 공간 노드 식별자
         */
        nodeId: string;
        /**
         * 처리 대상 바이너리 식별자
         */
        bufferId: string;
        /**
         * 0 기반 프레임 순번이며 공용 형상은 null
         */
        frameIndex: number | null;
        /**
         * 0 이상의 요청 세대이며 공용 형상은 null
         */
        generation: number | null;
        /**
         * 작은 값부터 처리하는 0 이상의 우선순위
         */
        priority: number;
    };
    /**
     * 작업 문맥을 보관하는 UA3FTaskContextVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 값의 범위와 프레임·세대의 연결은 UA3FTaskManager가 검증합니다.
     */
    type UA3FTaskContextVoCO = UA3FTaskContextVoCO_Content;
}

declare global {
    /**
     * 예산 설정값만 보관의 생성 설정입니다.
     */
    type UA3FCacheBudgetOptionsVoCO_Content = {
        /**
         * 양의 안전 정수 바이트 한도. null은 추가 합산 제한 없음. 개별 캐시 maxCacheBytes/cacheFrames는 계속 적용.
         */
        maxTotalCacheBytes?: number | null | undefined;
    };
    /**
     * 예산 설정값만 보관의 생성 설정입니다.
     */
    type UA3FCacheBudgetOptionsVoCO = UA3FCacheBudgetOptionsVoCO_Content;
    /**
     * 합산 상태 사본만 전달의 생성 설정입니다.
     */
    type UA3FCacheBudgetStatusVoCO_Content = {
        /**
         * 적용 중인 전체 원시 프레임 바이트 상한
         */
        maxTotalCacheBytes?: number | null | undefined;
        /**
         * 0 이상 정수 바이트, HTTP/decode 물리 종료 전 고정 버퍼 예약 합계
         */
        reservedBytes?: number | undefined;
        /**
         * 0 이상 정수 바이트, 준비 완료 고정 backing buffer 합계
         */
        residentBytes?: number | undefined;
        /**
         * reservedBytes + residentBytes, GPU/정적 형상/브라우저 전체 메모리를 뜻하지 않음
         */
        usedBytes?: number | undefined;
        /**
         * 준비 완료 버퍼 중 lease·현재 목표 준비·full 정책으로 회수할 수 없는 바이트, residentBytes의 부분집합
         */
        protectedBytes?: number | undefined;
        /**
         * residentBytes - protectedBytes, 기존 cache eviction 콜백으로 회수 가능한 준비 완료 버퍼
         */
        reclaimableBytes?: number | undefined;
        /**
         * 한도가 있으면 maxTotalCacheBytes-usedBytes, 무제한이면 null
         */
        availableBytes?: number | null | undefined;
        /**
         * 0 이상 안전 정수, 신규 허용 또는 아직 토큰을 보유한 캐시 인스턴스 수
         */
        ownerCount?: number | undefined;
        /**
         * 0 이상 안전 정수, reserved/resident 토큰의 고유 개수, 같은 버퍼의 여러 attribute/lease는 중복 합산하지 않음
         */
        bufferCount?: number | undefined;
        /**
         * 신규 예약이 차단된 종료 상태. true이어도 종료 대기 토큰이 남으면 바이트를 계속 표시
         */
        disposed?: boolean | undefined;
    };
    /**
     * 합산 상태 사본만 전달의 생성 설정입니다.
     */
    type UA3FCacheBudgetStatusVoCO = UA3FCacheBudgetStatusVoCO_Content;
    /**
     * UA3FFrameCacheOptionsVo 생성자 옵션입니다.
     */
    type UA3FFrameCacheOptionsVoCO_Content = {
        /**
         * 로딩 모드, 기본 streaming
         */
        loadMode?: "streaming" | "full" | undefined;
        /**
         * streaming의 표시·진행 중·준비 완료를 합친 고유 버퍼 슬롯 상한, 기본 3, 2 이상의 안전 정수
         */
        cacheFrames?: number | undefined;
        /**
         * HTTP부터 decode 완료까지 동시 파이프라인 상한, 기본 2, 양의 안전 정수
         */
        maxConcurrentLoads?: number | undefined;
        /**
         * 원시 backing buffer와 진행 중 예약의 바이트 상한, 기본 null, 지정 시 양의 안전 정수
         */
        maxCacheBytes?: number | null | undefined;
        /**
         * SHA-256 검사 여부, 기본 true
         */
        verifyHash?: boolean | undefined;
    };
    /**
     * UA3FFrameCacheOptionsVo 생성자 옵션입니다.
     */
    type UA3FFrameCacheOptionsVoCO = UA3FFrameCacheOptionsVoCO_Content;
    /**
     * UA3FFrameCacheStatusVo 생성자 옵션입니다.
     */
    type UA3FFrameCacheStatusVoCO_Content = {
        /**
         * 생성 시 고정한 로딩 모드
         */
        loadMode: ("streaming" | "full");
        /**
         * 빈 프레임을 포함한 등록 수
         */
        totalFrameCount: number;
        /**
         * 현재 준비 완료 버퍼로 제공 가능한 등록 프레임 수, 누적 수가 아님
         */
        readyFrameCount: number;
        /**
         * 준비 완료한 고유 backing buffer 수
         */
        residentBufferCount: number;
        /**
         * HTTP 또는 decode 중인 고유 버퍼 수
         */
        inFlightBufferCount: number;
        /**
         * 하나 이상 lease로 보호하는 준비 완료 고유 버퍼 수
         */
        leasedBufferCount: number;
        /**
         * 준비 완료한 고유 backing buffer 길이 합, 바이트
         */
        residentBytes: number;
        /**
         * 진행 중 파일의 기대 길이 예약 합, 바이트
         */
        reservedBytes: number;
        /**
         * 마지막 선택한 0 기반 순번 또는 아직 선택하지 않은 null
         */
        requestedFrameIndex: number | null;
        /**
         * 선택 전 0, 이후 양의 요청 순번
         */
        requestId: number;
        /**
         * null 아닌 모든 등록 고유 파일이 준비 완료했는지 여부
         */
        preloadComplete: boolean;
        /**
         * 최근 로딩 오류 또는 null, 의도된 탐색 취소는 제외
         */
        lastError: Error | null;
    };
    /**
     * UA3FFrameCacheStatusVo 생성자 옵션입니다.
     */
    type UA3FFrameCacheStatusVoCO = UA3FFrameCacheStatusVoCO_Content;
    /**
     * UA3FTimelineOptionsVo 생성자 옵션입니다.
     */
    type UA3FTimelineOptionsVoCO_Content = {
        /**
         * 원본 시간 단위 또는 미확정 null, 기본 null
         */
        sourceTimeUnit?: string | null | undefined;
        /**
         * 실제 경과 1초마다 진행할 원본 수치 시간량, 양의 유한값, 기본1
         */
        sourceUnitsPerSecond?: number | undefined;
        /**
         * 0 아닌 유한 배속, 양수 정방향·음수 역방향, 기본1
         */
        playbackRate?: number | undefined;
        /**
         * 시간 범위 끝에서 반복할지 여부, 기본false
         */
        loop?: boolean | undefined;
        /**
         * 기존109의 로딩 정책, 기본 streaming/3/2/null/true
         */
        cacheOptionsVo?: UA3FFrameCacheOptionsVo | undefined;
    };
    /**
     * UA3FTimelineOptionsVo 생성자 옵션입니다.
     */
    type UA3FTimelineOptionsVoCO = UA3FTimelineOptionsVoCO_Content;
    /**
     * UA3FTimelineStateVo 생성자 옵션입니다.
     */
    type UA3FTimelineStateVoCO_Content = {
        /**
         * idle/paused/playing/buffering/configuring/error/ended/disposed의 주요 상태
         */
        status: UA3FTimelineStatus;
        /**
         * 현재 목표 원본 시각, 미선택 null
         */
        requestedTime: number | null;
        /**
         * 실제 적용한 유효 프레임 원본 시각, 표시 전 null
         */
        displayedTime: number | null;
        /**
         * 요청한 등록 frameIndex, 미선택 null, 목록 위치와 구분
         */
        requestedFrameIndex: number | null;
        /**
         * 실제 적용한 유효 frameIndex, 표시 전 null
         */
        displayedFrameIndex: number | null;
        /**
         * 등록 프레임 수, 양의 안전 정수
         */
        frameCount: number;
        /**
         * 사용자의 재생 의도, 로딩 중에는 true여도 시계 정지
         */
        playing: boolean;
        /**
         * 최신 요청 순번, 선택 전0 이후 양의 안전 정수
         */
        requestId: number;
        /**
         * 적용한 재생 정책의 독립 작은 사본
         */
        optionsVo: UA3FTimelineOptionsVo;
        /**
         * 현재 캐시 준비·예약 순간 사본, 미초기화 null
         */
        cacheStatusVo: UA3FFrameCacheStatusVo | null;
        /**
         * 현재 실패 원래 원인 참조 또는 null
         */
        error: Error | null;
    };
    /**
     * UA3FTimelineStateVo 생성자 옵션입니다.
     */
    type UA3FTimelineStateVoCO = UA3FTimelineStateVoCO_Content;
    /**
     * 방향 화살표와 공통 표시/파생 자원 예산 설정. 실행·파일 접근 없음.
     */
    type UA3FFlowOptionsVoCO_Content = {
        /**
         * off·arrows·flow 중 표시 모드 기본값 "off".
         */
        mode?: "off" | "arrows" | "flow" | undefined;
        /**
         * CSS px 기준 화살표 목표 간격, 허용 범위 16..512 기본값 80.
         */
        spacingPixels?: number | undefined;
        /**
         * 전체 표시 데이터셋 기준 상한. 노드마다 2000개씩 무제한 배정하지 않음 기본값 2000.
         */
        maxArrowCount?: number | undefined;
        /**
         * CSS px, 허용 범위 4..128 기본값 24.
         */
        arrowLengthPixels?: number | undefined;
        /**
         * CSS px, 허용 범위 1..16 기본값 2.
         */
        arrowWidthPixels?: number | undefined;
        /**
         * 물리 유속 m/s; 미만이면 방향 불안정/정체 화살표 숨김 기본값 0.01.
         */
        minSpeedMps?: number | undefined;
        /**
         * maskFieldId 필드의 원래 단위; 홍수 h이면 m. 이하 값 숨김. 기존 표시 설정 마스크가 있으면 동일한 확정값을 공유 기본값 0.01.
         */
        maskThreshold?: number | undefined;
        /**
         * 고정 색상 모드의 CSS 색상 기본값 "#ffffff".
         */
        color?: string | undefined;
        /**
         * 0..1 기본값 0.9.
         */
        opacity?: number | undefined;
        /**
         * m/s 고정 전체 범례. null이면 검증된 전체 통계 사용, 프레임마다 자동 범위 변경하지 않음 기본값 null.
         */
        speedColorRange?: [number, number] | null | undefined;
        /**
         * 전체 세션의 계산 가능한 파생 CPU/GPU payload 합산 상한 기본 32MiB. 실제 driver overhead/프로세스 RAM 상한을 뜻하지 않음. 노드별 단순 중복 배정 금지 기본값 33554432.
         */
        maxDerivedBytes?: number | undefined;
    };
    /**
     * 방향 화살표와 공통 표시/파생 자원 예산 설정. 실행·파일 접근 없음.
     */
    type UA3FFlowOptionsVoCO = UA3FFlowOptionsVoCO_Content;
    /**
     * 현재 장의 입자 흐름 옵션입니다.
     */
    type UA3FParticleFlowOptionsVoCO_Content = {
        /**
         * 전체 가시 노드에 배분하는 입자 합산 상한. 안전 정수 256..16384. 임의 하향 시 실제 적용 개수 표시 기본값 4096
         */
        particleCount?: number | undefined;
        /**
         * 목표 물리 격자 간격 m. 유한한 양수. 실제 texture 상한·위도·예산으로 해상도가 달라지며 적용 간격 표시 기본값 10
         */
        fieldCellSizeMeters?: number | undefined;
        /**
         * 노드별 필드 texture 폭/높이 texel 상한. 각각 안전 정수 16..2048 및 실제 GPU 한도. 전체32MiB 파생 예산과 함께 사전 검증 기본값 [512,512]
         */
        maxFieldTextureSize?: [number, number] | undefined;
        /**
         * 표시 이동 배율. 유한한 양수 0.1..1000. 원본 m/s와 별도로 UI에 표시. 타임라인 원본 시간 단위로 해석하지 않음 기본값 100
         */
        visualSpeedScale?: number | undefined;
        /**
         * 표시 애니메이션 초 기준 수명. 유한한 양수 0.1..30. 종료 시 유효한 젖은 위치로 재배치 기본값 4
         */
        lifeSeconds?: number | undefined;
        /**
         * 입자당 이력 수. 안전 정수 2..32. 수명 구간에 일정 간격으로 기록하여 단순 8렌더프레임보다 길이가 안정적이게 함 기본값 8
         */
        trailSamples?: number | undefined;
        /**
         * 표시 한 프레임의 적분 분할 상한. 안전 정수 1..32. CFL 이동 상한을 지키고 초과 시간은 누적 폭주 없이 제한 상태로 표시 기본값 8
         */
        maxSubsteps?: number | undefined;
        /**
         * 타임라인을 멈춰도 현재 프레임의 고정 유속장을 미리보기. 기본값은 true. 별도 흐름 일시정지 가능 기본값 true
         */
        animateWhenPaused?: boolean | undefined;
        /**
         * 0..4294967295 안전 정수 난수 seed. 같은 frameToken·설정으로 초기 배치 재현 기본값 1
         */
        seed?: number | undefined;
    };
    /**
     * 생성 옵션 별칭입니다.
     */
    type UA3FParticleFlowOptionsVoCO = UA3FParticleFlowOptionsVoCO_Content;
    /**
     * 동적 필드와 벡터의 물리 의미를 선언하는 데이터 VO. 클래스 내부 변수는 _camelCase이며 각 필드에 getter/setter를 모두 제공.
     */
    type UA3FVectorFieldVoCO_Content = {
        /**
         * 데이터셋 안에서 고유한 비어 있지 않은 ID; prepare 전에 필수 기본값 null.
         */
        vectorId?: string | null | undefined;
        /**
         * UI 표시 이름 기본값 "".
         */
        label?: string | undefined;
        /**
         * 첫 번째 성분의 메타 필드 ID; 실행 코드에 u를 고정하지 않음 기본값 null.
         */
        uFieldId?: string | null | undefined;
        /**
         * 0 기반 성분 인덱스; 실제 itemSize 미만 기본값 0.
         */
        uComponent?: number | undefined;
        /**
         * 두 번째 성분의 메타 필드 ID 기본값 null.
         */
        vFieldId?: string | null | undefined;
        /**
         * 0 기반 성분 인덱스 기본값 0.
         */
        vComponent?: number | undefined;
        /**
         * 유속 크기 필드. 없으면 physical 성분에서 hypot으로 산출; world 좌표율에서 물리 속력을 직접 추정하지 않음 기본값 null.
         */
        speedFieldId?: string | null | undefined;
        /**
         * 0 기반 속력 성분 인덱스 기본값 0.
         */
        speedComponent?: number | undefined;
        /**
         * 보일 영역을 결정하는 정점 scalar. 홍수 샘플은 h, 바람 등에는 null 가능 기본값 null.
         */
        maskFieldId?: string | null | undefined;
        /**
         * 0 기반 마스크 성분 인덱스 기본값 0.
         */
        maskComponent?: number | undefined;
        /**
         * 성분 방향 기준. null이면 임의 추정하지 않고 방향 표시 준비를 거부 기본값 null.
         */
        basisType?: "world" | "source-grid" | "east-north" | null | undefined;
        /**
         * source-grid일 때 성분이 정의된 투영 CRS. 지원하는 기준축·단위 조합은 실행 모듈이 검증 기본값 null.
         */
        basisCrs?: string | null | undefined;
        /**
         * physical은 실제 거리/초 성분, coordinate-rate는 CRS 좌표값 변화율. 원본 의미 확인 후 필수 기본값 null.
         */
        componentSemantics?: "physical" | "coordinate-rate" | null | undefined;
        /**
         * 실제 물리 단위와 좌표율을 구분. 현재 sample 필드는 m/s 기본값 null.
         */
        velocityUnit?: "m/s" | "world-unit/s" | null | undefined;
        /**
         * null은 별도 sentinel 없음. NaN/Infinity와 지정 nodata는 표시·적분에서 제외 기본값 null.
         */
        noDataValue?: number | null | undefined;
    };
    /**
     * 동적 필드와 벡터의 물리 의미를 선언하는 데이터 VO. 클래스 내부 변수는 _camelCase이며 각 필드에 getter/setter를 모두 제공.
     */
    type UA3FVectorFieldVoCO = UA3FVectorFieldVoCO_Content;
}

declare global {
    /**
     * UA3FCoordinateVo의 필수 생성자 옵션입니다.<br>
     * 값 검증과 자원 수명 관리는 사용하는 모듈이 담당하며 객체와 배열은 참조로 보관합니다.
     */
    type UA3FCoordinateVoCO_Content = {
        /**
         * 원본 좌표계 식별자이며 현재 자료는 EPSG:5187
         */
        sourceCrs: string;
        /**
         * 월드 좌표(EPSG:3857)의 출력 CRS
         */
        targetCrs: "EPSG:3857";
        /**
         * projected는 XY 투영 좌표·미터 Z, world는 엔진 월드 Z
         */
        coordinateType: "projected" | "world";
        /**
         * world의 높이 배율 프로파일, projected는 null
         */
        worldProfile: string | null;
        /**
         * local은 origin을 뺀 배열, absolute는 origin [0,0,0]
         */
        positionSpace: "local" | "absolute";
        /**
         * 저장한 position과 같은 공간의 고정 XYZ 기준점
         */
        origin: [number, number, number];
        /**
         * position Z의 표현 단위
         */
        heightEncoding: "meters" | "mercator-world";
        /**
         * 실제 metadata 2.0 이름 유지
         */
        heightScaleMode: "none" | "per-node-latitude" | "reference-y";
        /**
         * 정점별 배율 필드 식별자
         */
        heightScaleFieldId: string | null;
        /**
         * reference-y의 기준 월드 Y
         */
        heightScaleReferenceY: number | null;
        /**
         * 미터 높이에 곱하는 공통 월드 배율
         */
        heightScaleValue: number | null;
        /**
         * 월드 좌표(EPSG:3857)의 minX,minY,maxX,maxY
         */
        projectedBounds: [number, number, number, number];
        /**
         * 저장된 바탕 position 공간의 최솟값
         */
        baseRenderBoundsMin: [number, number, number];
        /**
         * 저장된 바탕 position 공간의 최댓값
         */
        baseRenderBoundsMax: [number, number, number];
    };
    /**
     * UA3FCoordinateVo의 필수 생성자 옵션입니다.<br>
     * 값 검증과 자원 수명 관리는 사용하는 모듈이 담당하며 객체와 배열은 참조로 보관합니다.
     */
    type UA3FCoordinateVoCO = UA3FCoordinateVoCO_Content;
    /**
     * UA3FGeometryVo의 필수 생성자 옵션입니다.<br>
     * 값 검증과 자원 수명 관리는 사용하는 모듈이 담당하며 객체와 배열은 참조로 보관합니다.
     */
    type UA3FGeometryVoCO_Content = {
        /**
         * 공용 형상 식별자
         */
        geometryId: string;
        /**
         * 정적 형상 바이너리 식별자
         */
        bufferId: string;
        /**
         * 'indexed-triangles'
         */
        topology: "indexed-triangles";
        /**
         * 양의 안전 정수인 정점 수
         */
        vertexCount: number;
        /**
         * 양의 안전 정수인 삼각형 수
         */
        triangleCount: number;
        /**
         * 삼각형 수의 3배인 인덱스 개수
         */
        indexCount: number;
        /**
         * 정수 인덱스 필드 식별자
         */
        indexFieldId: string;
        /**
         * 실제 attribute 이름 → fieldId, position 키 필수
         */
        attributeBindings: Record<string, string>;
        /**
         * CPU 조회로 유지할 정적 필드 식별자
         */
        cpuFieldIds: Array<string>;
        /**
         * 원본 메타정보의 좌표 정의
         */
        coordinates: UA3FCoordinateVo;
        /**
         * coordinates.positionSpace와 같은 공간의 표시 경계 최솟값
         */
        renderBoundsMin: [number, number, number];
        /**
         * coordinates.positionSpace와 같은 공간의 표시 경계 최댓값
         */
        renderBoundsMax: [number, number, number];
        /**
         * 'base-position' | 'all-frames-and-height-policies'
         */
        renderBoundsScope: "base-position" | "all-frames-and-height-policies";
        /**
         * 'base-position' | 'conservative-interval'
         */
        renderBoundsMethod: "base-position" | "conservative-interval";
    };
    /**
     * UA3FGeometryVo의 필수 생성자 옵션입니다.<br>
     * 값 검증과 자원 수명 관리는 사용하는 모듈이 담당하며 객체와 배열은 참조로 보관합니다.
     */
    type UA3FGeometryVoCO = UA3FGeometryVoCO_Content;
    /**
     * UA3FGeometryResultVo의 필수 생성자 옵션입니다.<br>
     * 값 검증과 자원 수명 관리는 사용하는 모듈이 담당하며 객체와 배열은 참조로 보관합니다.
     */
    type UA3FGeometryResultVoCO_Content = {
        /**
         * 생성한 공용 형상 식별자
         */
        geometryId: string;
        /**
         * 호출자가 수명을 소유하는 생성 결과
         */
        geometry: BufferGeometry;
        /**
         * 실제 geometry 배열에 대응하는 출력 world 좌표 정의
         */
        coordinates: UA3FCoordinateVo;
        /**
         * 디코딩한 정적 원본 배열 참조, CPU 필드와 인덱스 포함
         */
        sourceArrays: Map<string, UA3FDecodedArrayVo>;
        /**
         * attributeBindings에 선언됐지만 시간 프레임이 와야 연결할 필드 식별자
         */
        pendingFieldIds: Array<string>;
    };
    /**
     * UA3FGeometryResultVo의 필수 생성자 옵션입니다.<br>
     * 값 검증과 자원 수명 관리는 사용하는 모듈이 담당하며 객체와 배열은 참조로 보관합니다.
     */
    type UA3FGeometryResultVoCO = UA3FGeometryResultVoCO_Content;
    /**
     * UA3FHeightPolicyVo의 필수 생성자 옵션입니다.<br>
     * 값 검증은 사용하는 모듈이 담당하며 배열은 복사하지 않고 참조로 보관합니다.
     */
    type UA3FHeightPolicyVoCO_Content = {
        /**
         * 높이 정책 식별자
         */
        policyId: string;
        /**
         * 화면 표시 이름
         */
        label: string;
        /**
         * 필드 하나 선택 또는 둘 이상 순서대로 합산하는 연산
         */
        operation: "absolute-field" | "sum-fields";
        /**
         * 연산 순서의 미터 단위 필드 식별자 배열, 중복 허용
         */
        fieldIds: Array<string>;
        /**
         * fieldIds와 1:1 대응하는 0 기반 성분 인덱스 배열
         */
        componentIndices: Array<number>;
    };
    /**
     * UA3FHeightPolicyVo의 필수 생성자 옵션입니다.<br>
     * 값 검증은 사용하는 모듈이 담당하며 배열은 복사하지 않고 참조로 보관합니다.
     */
    type UA3FHeightPolicyVoCO = UA3FHeightPolicyVoCO_Content;
    /**
     * UA3FHeightDisplayVo의 필수 생성자 옵션입니다.<br>
     * 값 검증은 사용하는 모듈이 담당하며 배열은 복사하지 않고 참조로 보관합니다.
     */
    type UA3FHeightDisplayVoCO_Content = {
        /**
         * 배율 적용 전에 더하는 표시 높이, 미터 단위
         */
        displayZOffset: number;
        /**
         * 빌더가 전체 렌더 경계에 반영한 오프셋 최솟값·최댓값, 미터 단위
         */
        displayZOffsetRange: [number, number];
    };
    /**
     * UA3FHeightDisplayVo의 필수 생성자 옵션입니다.<br>
     * 값 검증은 사용하는 모듈이 담당하며 배열은 복사하지 않고 참조로 보관합니다.
     */
    type UA3FHeightDisplayVoCO = UA3FHeightDisplayVoCO_Content;
    /**
     * UA3FMetadataVo 생성자 옵션입니다.
     */
    type UA3FMetadataVoCO_Content = {
        /**
         * 정규화한 응답 절대 URL, 각 상대 파일 주소의 기준
         */
        metadataUrl: string;
        /**
         * URL과 원본 root.nodeId로 구성한 충돌 없는 클라이언트 키
         */
        nodeKey: string;
        /**
         * 이 문서 원본의 데이터셋 식별자
         */
        datasetId: string;
        /**
         * 원본 공간 정의 사본, 독립 문서의 parentNodeId는 null
         */
        nodeVo: UA3FNodeVo;
        /**
         * 형상 ID를 더해 정규화한 프레임·원본 시각·통계
         */
        frames: Array<UA3FFrameVo>;
        /**
         * 현재 문서 URL 기준 외부 metadata 참조
         */
        children: Array<UA3FChildMetadataVo>;
        /**
         * 원본 필드·배치·파일·형상·시간·재질을 보존한 독립 JSON 사본
         */
        source: UA3FMetadataDocumentData;
    };
    /**
     * UA3FMetadataVo 생성자 옵션입니다.
     */
    type UA3FMetadataVoCO = UA3FMetadataVoCO_Content;
    /**
     * 동적인 원본 metadata JSON의 독립 사본입니다.
     */
    type UA3FMetadataDocumentData = Record<string, unknown>;
    /**
     * metadata 2.0의 공간 경계입니다.<br>
     * 수평 경계는 월드 좌표(EPSG:3857)이며 zRange는 월드 Z로 환산하지 않은 원본 미터 높이 범위입니다.
     */
    type UA3FNodeBoundingBoxData = {
        /**
         * 수평 경계의 월드 좌표(EPSG:3857)
         */
        crs: "EPSG:3857";
        /**
         * 유한한 minX·minY·maxX·maxY이며 각 min은 max 이하
         */
        xy: [number, number, number, number];
        /**
         * 유한한 미터 높이 min·max 또는 높이 범위 없음
         */
        zRange: [number, number] | null;
        /**
         * zRange가 있으면 m, 없으면 null
         */
        zUnit: "m" | null;
        /**
         * zRange가 있으면 비어 있지 않은 기준 이름, 없으면 null이며 unknown을 보존
         */
        verticalReference: string | null;
    };
    /**
     * 공간 노드를 보관하는 UA3FNodeVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 공간 경계는 참조로 보관합니다.<br>
     * 노드 연결과 경계 검증 및 등록 시 사본 생성은 U3dModelA3FLayer가 담당합니다.
     */
    type UA3FNodeVoCO_Content = {
        /**
         * 레이어 안에서 유일한 노드 키
         */
        nodeId: string;
        /**
         * 부모 노드 키이며 루트는 null
         */
        parentNodeId: string | null;
        /**
         * 공용 형상 식별자이며 공간 컨테이너는 null
         */
        geometryId: string | null;
        /**
         * 월드 좌표(EPSG:3857)의 XY와 원본 높이 범위
         */
        boundingBox: UA3FNodeBoundingBoxData;
        /**
         * 유한한 0 이상의 공간 오차
         */
        geometricError: number;
        /**
         * 공간 상세화 방식
         */
        refine: "ADD" | "REPLACE";
    };
    /**
     * 공간 노드를 보관하는 UA3FNodeVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 공간 경계는 참조로 보관합니다.<br>
     * 노드 연결과 경계 검증 및 등록 시 사본 생성은 U3dModelA3FLayer가 담당합니다.
     */
    type UA3FNodeVoCO = UA3FNodeVoCO_Content;
    /**
     * UA3FChildMetadataVo 생성자 옵션입니다.
     */
    type UA3FChildMetadataVoCO_Content = {
        /**
         * 하위 root.nodeId와 대조할 비어 있지 않은 식별자
         */
        nodeId: string;
        /**
         * 현재 부모 JSON 기준 상대 metadata URI
         */
        metadataUri: string;
        /**
         * 월드 좌표(EPSG:3857) XY와 원본 미터 Z 범위
         */
        boundingBox: UA3FNodeBoundingBoxData;
        /**
         * 유한한 0 이상 월드 좌표(EPSG:3857) 투영 평면 단위 오차
         */
        geometricError: number;
        /**
         * UTF-8 JSON 기대 바이트 길이 또는 null, sha256과 함께 지정
         */
        byteLength: number | null;
        /**
         * raw bytes의 64자리 SHA-256 또는 null
         */
        sha256: string | null;
    };
    /**
     * UA3FChildMetadataVo 생성자 옵션입니다.
     */
    type UA3FChildMetadataVoCO = UA3FChildMetadataVoCO_Content;
    /**
     * UA3FSpatialOptionsVo 생성자 옵션입니다.
     */
    type UA3FSpatialOptionsVoCO_Content = {
        /**
         * 상세화 진입 오차, 기본 16 CSS pixel, 양의 유한값
         */
        maximumScreenSpaceError?: number | undefined;
        /**
         * 직전 상세화의 축소 비율, 기본 0.75, 0 초과 1 이하
         */
        hysteresisRatio?: number | undefined;
        /**
         * 루트 0 기준 최대 깊이, 기본 32, 0 이상 안전 정수
         */
        maxDepth?: number | undefined;
        /**
         * metadata HTTP부터 해석까지 동시 수, 기본 2, 양의 안전 정수
         */
        maxConcurrentMetadataLoads?: number | undefined;
        /**
         * JSON 한 파일의 raw 바이트 상한, 기본 4194304, 양의 안전 정수
         */
        maxMetadataBytes?: number | undefined;
        /**
         * 준비·진행 metadata 수 상한, 기본 64, 양의 안전 정수
         */
        maxCachedMetadataCount?: number | undefined;
        /**
         * 준비 raw 길이와 진행 예약 바이트 합 상한, 기본 16777216, 양의 안전 정수
         */
        maxCachedMetadataBytes?: number | undefined;
    };
    /**
     * UA3FSpatialOptionsVo 생성자 옵션입니다.
     */
    type UA3FSpatialOptionsVoCO = UA3FSpatialOptionsVoCO_Content;
    /**
     * UA3FSpatialViewVo 생성자 옵션입니다.
     */
    type UA3FSpatialViewVoCO_Content = {
        /**
         * 절대 월드 좌표(EPSG:3857)의 갱신 완료 카메라, 빌린 참조이며 변경·해제 금지
         */
        camera: UA3FSpatialCamera;
        /**
         * 양의 유한 CSS pixel 높이, DPR을 중복 적용하지 않음
         */
        viewportHeight: number;
        /**
         * 보수적인 월드 좌표(EPSG:3857) minX,minY,maxX,maxY 또는 선행 XY 필터를 생략하는 null
         */
        viewBoundsXY: [number, number, number, number] | null;
        /**
         * 프레임·높이 정책 등 준비 결과를 구분하는 비어 있지 않은 상태 키
         */
        contentKey: string;
    };
    /**
     * UA3FSpatialViewVo 생성자 옵션입니다.
     */
    type UA3FSpatialViewVoCO = UA3FSpatialViewVoCO_Content;
    /**
     * UA3FSpatialSelectionVo 생성자 옵션입니다.
     */
    type UA3FSpatialSelectionVoCO_Content = {
        /**
         * 관리자 안에서 증가하는 양의 선택 순번
         */
        selectionId: number;
        /**
         * 계획에 해당하는 프레임·높이 상태 키
         */
        contentKey: string;
        /**
         * 준비할 목표·대체 표시 형상 노드, 컨테이너 제외
         */
        requiredNodes: Array<UA3FMetadataVo>;
        /**
         * 현재 표시할 준비 완료 또는 보존 중인 노드 키
         */
        visibleNodeKeys: Array<string>;
        /**
         * 아직 필요한 metadata URL, a3f 파일 요청 목록이 아님
         */
        pendingMetadataUrls: Array<string>;
        /**
         * 더 이상 준비·표시·대체에 필요 없어 소유자가 회수할 이전 노드
         */
        releaseNodeKeys: Array<string>;
        /**
         * 하위 metadata·용량 오류의 참조 목록
         */
        errors: Array<Error>;
    };
    /**
     * UA3FSpatialSelectionVo 생성자 옵션입니다.
     */
    type UA3FSpatialSelectionVoCO = UA3FSpatialSelectionVoCO_Content;
}

declare global {
    /**
     * ~extends U3dModelLayerCO <br>
     *
     * A3F 레이어의 선택 설정입니다. 공간/시계열 요청과 표면 로딩 설정은 후속 모듈에서 확장합니다.
     */
    type U3dModelA3FLayerCO_Content = {
        /**
         * 비어 있지 않은 데이터셋 식별자이며 생략 시 bindDataset으로 나중에 연결
         */
        datasetId?: string | undefined;
        /**
         * 절대 Worker 폴더, 끝 슬래시 필요, null은 기존 SDK 경로
         */
        workerBaseUrl?: string | null | undefined;
        /**
         * 양의 안전 정수인 물리 워커 수
         */
        workerCount?: number | undefined;
        /**
         * 0 이상의 안전 정수인 대기 작업 수 상한
         */
        maxQueuedTasks?: number | undefined;
        /**
         * 0 이상의 안전 정수인 대기 backing buffer 바이트 상한
         */
        maxQueuedBytes?: number | undefined;
        /**
         * 레이어 초기 표시 여부
         */
        visible?: boolean | undefined;
        /**
         * A3F 파일 확장자
         */
        ext?: ".a3f" | undefined;
        /**
         * 엔진 MODEL 압축 경로 사용 안 함
         */
        compressModel?: false | undefined;
        /**
         * 메타정보의 수평 경계에 사용하는 월드 좌표(EPSG:3857)
         */
        crs?: "EPSG:3857" | undefined;
    };
    /**
     * ~extends U3dModelLayerCO <br>
     *
     * A3F 레이어의 선택 설정입니다. 공간/시계열 요청과 표면 로딩 설정은 후속 모듈에서 확장합니다.
     */
    type U3dModelA3FLayerCO = Omit<U3dModelLayerCO, never> & U3dModelA3FLayerCO_Content;
    /**
     * 데이터셋 연결 전에 조정하는 작업 관리자 설정입니다.
     */
    type U3dModelA3FLayerTaskOptions = {
        /**
         * 양의 안전 정수인 물리 워커 수
         */
        workerCount: number;
        /**
         * 0 이상의 안전 정수인 대기 작업 수
         */
        maxQueuedTasks: number;
        /**
         * 0 이상의 안전 정수인 대기 바이트 수
         */
        maxQueuedBytes: number;
        /**
         * 이 레이어의 Worker 폴더, null은 기존 SDK 경로
         */
        workerBaseUrl?: string | null | undefined;
    };
    /**
     * 성공적으로 연결한 표시 객체의 소유자가 GPU 및 공유 자원을 반납하는 동기 함수입니다.
     * 레이어는 연결을 먼저 끊고 이 함수를 정확히 한 번 호출합니다. 객체의 자원은 직접 해제하지 않습니다.
     */
    type U3dModelA3FLayerRelease = () => void;
    /**
     * 노드 등록과 렌더 결과 연결을 추적하는 레이어 내부 자료입니다.
     */
    type U3dModelA3FLayerNodeEntry = {
        /**
         * 검증한 공간 정의 사본
         */
        node: UA3FNodeVo;
        /**
         * 양의 안전 정수인 등록 토큰
         */
        revision: number;
        /**
         * 레이어 바로 아래의 형제 그룹
         */
        group: UGroup;
        /**
         * 연결 완료한 표시 객체 또는 null
         */
        object: Object3D | null;
        /**
         * 연결 완료한 객체의 자원 반납 함수 또는 null
         */
        release: U3dModelA3FLayerRelease | null;
        /**
         * 연결 진행 중이며 소유권을 아직 넘겨받지 않은 객체
         */
        candidate: Object3D | null;
    };
    /**
     * 부모 레이어의 ready Promise 완료 API와 이벤트 전달을 사용하는 내부 인터페이스입니다.
     */
    type U3dModelA3FLayerCompletion = {
        /**
         * deferred가 이미 종결되었는지 확인
         */
        isReady: () => boolean;
        /**
         * 부모 ready Promise의 초기화 성공 통지
         */
        _resolveReady: () => unknown;
        /**
         * 부모 ready Promise의 초기화 실패 또는 해제 통지
         */
        _rejectReady: (reason: unknown) => unknown;
        /**
         * 상속한 레이어 SHOW/HIDE 이벤트 통지
         */
        dispatch: (type: string) => void;
    };
}

declare global {
    /**
     * A3F 2.0 바이너리 디코딩의 무결성 검사 옵션입니다.
     */
    type UA3FParserDecodeOptions = {
        /**
         * SHA-256 대조 여부. false여도 배치·패딩·숫자 검사는 수행
         */
        verifyHash?: boolean | undefined;
    };
    /**
     * 코덱이 취급하는 숫자 배열 생성자입니다.
     */
    type UA3FParserArrayConstructor = (Float32ArrayConstructor | Float64ArrayConstructor | Uint16ArrayConstructor | Uint32ArrayConstructor);
    /**
     * 비동기 디코딩 중 호출자가 배치 VO를 변경해도 영향을 받지 않는 배치 사본입니다.
     * 숫자 버퍼는 복사하지 않습니다.
     */
    type UA3FParserLayoutSnapshot = {
        /**
         * 입력 목록 순서의 배치 사본
         */
        layout: UA3FLayoutVo;
        /**
         * byteOffset 순으로 정렬한 배치 참조 목록
         */
        ranges: Array<UA3FArrayLayoutVo>;
    };
}

declare global {
    /**
     * 워커에서 사용하는 일반 파일 정의입니다.
     */
    type UA3FParserTaskBufferData = {
        /**
         * metadata의 바이너리 식별자
         */
        bufferId: string;
        /**
         * 파일 참조이며 이 태스크에서는 네트워크 요청을 실행하지 않음
         */
        uri: string;
        /**
         * 양의 안전 정수인 전체 바이트 수
         */
        byteLength: number;
        /**
         * 파일의 64자리 16진 SHA-256
         */
        sha256: string;
        /**
         * 공용 배치 식별자
         */
        layoutId: string;
    };
    /**
     * 일반 객체로 전송하는 한 필드의 바이너리 배치입니다.
     */
    type UA3FParserTaskArrayLayoutData = {
        /**
         * 대소문자를 구분하는 동적 필드 식별자
         */
        fieldId: string;
        /**
         * 숫자 성분 타입
         */
        componentType: ("Float32" | "Float64" | "Uint16" | "Uint32");
        /**
         * 값의 연결 대상
         */
        association: ("node" | "index" | "triangle");
        /**
         * 양의 안전 정수인 항목 수이며 width*height와 같음
         */
        count: number;
        /**
         * 양의 안전 정수인 배열 너비
         */
        width: number;
        /**
         * 양의 안전 정수인 배열 높이
         */
        height: number;
        /**
         * 항목당 성분 수
         */
        itemSize: (1 | 2 | 3 | 4);
        /**
         * 정수 attribute 정규화 여부
         */
        normalized: boolean;
        /**
         * 파일 시작부터 0 기반 바이트 위치이며 8의 배수
         */
        byteOffset: number;
        /**
         * 성분 타입·항목 수·itemSize와 일치하는 바이트 수
         */
        byteLength: number;
    };
    /**
     * 여러 파일에서 참조하는 공용 배치의 전송 정의입니다.
     */
    type UA3FParserTaskLayoutData = {
        /**
         * 공용 배치 식별자
         */
        layoutId: string;
        /**
         * 양의 안전 정수인 전체 바이트 수
         */
        byteLength: number;
        /**
         * 필드별 배치 목록이며 원래 순서를 보존
         */
        arrays: Array<UA3FParserTaskArrayLayoutData>;
    };
    /**
     * 배치와 실제 숫자 view의 연결입니다.
     */
    type UA3FParserTaskDecodedArrayData = {
        /**
         * 숫자 배열의 배치 정의
         */
        layout: UA3FParserTaskArrayLayoutData;
        /**
         * 숫자 view이며 인코딩 입력은 부분 view 허용
         */
        array: (Float32Array | Float64Array | Uint16Array | Uint32Array);
    };
    /**
     * decode 정적 메서드에 전달할 일반 객체 요청입니다.
     * 입력 버퍼를 전송하면 메인의 원본과 같은 버퍼를 공유한 모든 view가 분리됩니다.
     */
    type UA3FParserTaskDecodeRequest = {
        /**
         * 파일 정의
         */
        buffer: UA3FParserTaskBufferData;
        /**
         * 공용 배치
         */
        layout: UA3FParserTaskLayoutData;
        /**
         * 고정·미분리 버퍼이며 완료까지 변경 금지
         */
        arrayBuffer: ArrayBuffer;
        /**
         * 기본값은 빈 객체이며 verifyHash 기본값 true
         */
        opt?: UA3FParserDecodeOptions | undefined;
    };
    /**
     * decode 결과이며 모든 숫자 view가 반환 버퍼를 공유합니다.
     * UWorker는 내부 전송 목록을 제거하고 버퍼 소유권을 수신자에게 이전합니다.
     */
    type UA3FParserTaskDecodeResult = {
        /**
         * 해석한 파일 식별자
         */
        bufferId: string;
        /**
         * 해석한 배치 식별자
         */
        layoutId: string;
        /**
         * 원본 버퍼이며 UWorker 반환 전송 후 수신자 소유
         */
        arrayBuffer: ArrayBuffer;
        /**
         * 숫자 복사 없이 같은 버퍼를 공유하는 필드 목록
         */
        arrays: Array<UA3FParserTaskDecodedArrayData>;
        /**
         * 내부 전송 지시이며 태스크 반환 시 버퍼 한 개, 메인 수신 시 제거됨
         */
        _transferables?: ArrayBuffer[] | undefined;
    };
    /**
     * encode 정적 메서드에 전달할 출력 배치와 숫자 목록입니다.
     * 요청에서 이전한 입력 버퍼는 자동 반환하지 않으며 원본 보존은 호출자가 관리합니다.
     */
    type UA3FParserTaskEncodeRequest = {
        /**
         * 출력 공용 배치
         */
        layout: UA3FParserTaskLayoutData;
        /**
         * 필드별 배치와 숫자 view이며 순서가 달라도 fieldId로 연결
         */
        arrays: Array<UA3FParserTaskDecodedArrayData>;
    };
    /**
     * encode가 할당한 새 바이너리 버퍼입니다.
     */
    type UA3FParserTaskEncodeResult = {
        /**
         * 출력 버퍼이며 UWorker 반환 전송 후 수신자 소유
         */
        arrayBuffer: ArrayBuffer;
        /**
         * 내부 전송 지시이며 태스크 반환 시 버퍼 한 개, 메인 수신 시 제거됨
         */
        _transferables?: ArrayBuffer[] | undefined;
    };
}

declare global {
    /**
     * 워커에 전송하는 숫자 배열 레코드입니다.
     */
    type UA3FVectorArrayData = {
        /**
         * 단일 숫자 배열 배치
         */
        layout: UA3FArrayLayoutVoCO;
        /**
         * 전송 소유권이 명확한 숫자 view
         */
        array: Float32Array | Uint32Array;
    };
    /**
     * 정적 벡터 전처리 입력입니다.
     */
    type UA3FVectorPrepareRequest = {
        /**
         * 위치 Float32 XYZ 1개, worker 소유 복사본
         */
        arrays: Array<UA3FVectorArrayData>;
        /**
         * local 위치에 더할 절대 월드 원점 XYZ
         */
        origin: Array<number>;
        /**
         * 후보 정점 개수 상한 1..20000
         */
        maxSamples: number;
        /**
         * true이면 전체 정점 Float32 방향 기저도 반환, 기본 false
         */
        includeVertexBasis?: boolean | undefined;
        /**
         * 확정된 벡터 방향 의미
         */
        vector: UA3FVectorFieldVoCO;
    };
    /**
     * 정적 전처리 결과입니다.
     */
    type UA3FVectorPrepareResult = {
        /**
         * 정점 ID·anchor·2차원 기저의 새 배열
         */
        arrays: Array<UA3FVectorArrayData>;
        /**
         * UWorker가 소비할 출력 버퍼 목록
         */
        _transferables: Array<ArrayBufferLike>;
    };
}

declare global {
    /**
     * backend 상태 사본을 받는 동기 UI 구독자입니다.
     */
    type UTimelineStateListener = (state: UTimelineStateVo) => void;
    /**
     * 자신의 구독만 멱등적으로 해제합니다.
     */
    type UTimelineUnsubscribe = () => void;
    /**
     * 공통 UI와 Sequence/A3F 재생기를 연결하는 구조적 포트입니다.
     * Clock·RAF·프레임 로딩은 backend가 소유하고 View는 상태와 명령만 연결합니다.
     * 명령은 capability를 확인한 뒤 호출하며 동기 backend도 연결기에서 Promise<void>로 정규화합니다.
     */
    type UTimelinePlaybackPort = {
        /**
         * 독립 상태 사본을 동기로 반환합니다. Promise를 반환하지 않습니다.
         */
        getState: () => UTimelineStateVo;
        /**
         * 상태 구독자를 등록합니다. 해제 함수는 자기 구독만 제거하고 반복 호출을 허용합니다.
         */
        subscribe: (arg0: UTimelineStateListener) => UTimelineUnsubscribe;
        /**
         * capability가 허용할 때 재생을 요청합니다. 완료는 명령 처리 완료이며 전체 시퀀스 종료가 아닙니다.
         */
        play: () => Promise<void>;
        /**
         * 재생 의도를 멈춥니다. 이미 요청한 A3F 프레임은 완료될 수 있습니다.
         */
        pause: () => Promise<void>;
        /**
         * 현재 축 범위의 유한 위치를 탐색하고 적용 완료 시 이행합니다. 시간축은 상대 초, 프레임축 입력은 0 기반 정수 목록 위치이며 ID가 아닙니다.
         */
        seek: (arg0: number) => Promise<void>;
        /**
         * 0이 아닌 유한 배속을 지정합니다. 음수는 canReverse가 필요하고 0 입력은 UI에서 pause로 전달합니다. 원본 단위/초를 변경하지 않습니다.
         */
        setPlaybackRate: (arg0: number) => Promise<void>;
        /**
         * canStep=true일 때 필수입니다. 다음은 1, 이전은 -1이며 프레임 ID 증가량이 아닙니다.
         */
        step?: ((arg0: 1 | -1) => Promise<void>) | undefined;
    };
}

declare global {
    type UTimelineClock = {
        startTime: number;
        stopTime: number;
        currentTime: number;
        multiplier: number;
        shouldAnimate: boolean;
    };
    type UTimelineSeekEvent = {
        position?: number;
        detail?: {
            position: number;
        };
    };
    type UTimelineCommandEvent = {
        cancel: boolean;
    };
    type UTimelineCommandTicket = {
        source: number;
        command: number;
    };
    /**
     * 백엔드 재생 상태를 숫자로 표시하는 모델입니다. 자체 tick·RAF는 실행하지 않습니다.
     */
    type UTimelineClockViewModel = {
        /**
         * 표시 상태입니다.
         */
        clock: UTimelineClock;
        /**
         * 입력 배속입니다.
         */
        multiplier: number;
        /**
         * 입력 재생 의도입니다.
         */
        shouldAnimate: boolean;
        /**
         * 포트 상태를 입력 요소에 다시 표시합니다.
         */
        synchronize: () => void;
        /**
         * 소유 표시 연결을 해제합니다.
         */
        destroy: () => void;
    };
    type UTimelineAnimationViewModel = {
        /**
         * 날짜 또는 축 이름 포맷터입니다.
         */
        dateFormatter: (arg0: number) => string;
        /**
         * 숫자 위치 포맷터입니다.
         */
        timeFormatter: (arg0: number) => string;
        /**
         * 현재 축의 날짜 또는 이름입니다.
         */
        dateLabel: string;
        /**
         * 현재 위치의 표시 문자열입니다.
         */
        timeLabel: string;
        /**
         * 입력 모델입니다.
         */
        clockViewModel: UTimelineClockViewModel;
        /**
         * 정방향 재생 명령입니다.
         */
        playForwardViewModel: {
            command: () => Promise<void>;
        };
        /**
         * 역방향 재생 명령입니다.
         */
        playReverseViewModel: {
            command: () => Promise<void>;
        };
        /**
         * 정지 명령입니다.
         */
        pauseViewModel: {
            command: () => Promise<void>;
        };
        /**
         * 문서 시간축을 유지하는 무동작 명령입니다.
         */
        playRealtimeViewModel: {
            command: () => void;
        };
    };
    type UTimelineAnimationWidget = {
        /**
         * 숫자 위치 표시 모델입니다.
         */
        viewModel: UTimelineAnimationViewModel;
        /**
         * 표시를 갱신합니다.
         */
        resize: () => void;
        /**
         * 소유 표시 연결만 해제합니다.
         */
        destroy: () => void;
        /**
         * 해제 여부입니다.
         */
        isDestroyed: () => boolean;
    };
    type UTimelineWidget = {
        /**
         * 눈금 포맷터입니다.
         */
        makeLabel: (arg0: number) => string;
        /**
         * 보이는 숫자 범위를 변경합니다.
         */
        zoomTo: (arg0: number, arg1: number) => void;
        /**
         * 눈금과 탐색 입력을 다시 표시합니다.
         */
        resize: () => void;
        /**
         * 현재 위치를 갱신합니다.
         */
        updateFromClock: () => void;
        /**
         * 탐색 이벤트를 연결합니다.
         */
        addEventListener: HTMLElement["addEventListener"];
        /**
         * 탐색 이벤트를 제거합니다.
         */
        removeEventListener: HTMLElement["removeEventListener"];
        /**
         * 소유 표시 연결만 해제합니다.
         */
        destroy: () => void;
        /**
         * 해제 여부입니다.
         */
        isDestroyed: () => boolean;
        /**
         * 표시 범위 시작입니다.
         */
        visibleStart: number;
        /**
         * 표시 범위 끝입니다.
         */
        visibleEnd: number;
    };
    type UTimelineViewCO = {
        /**
         * 재생 조작 요소를 넣을 빌린 컨테이너입니다.
         */
        animationContainer: HTMLElement;
        /**
         * 시간축 요소를 넣을 별도 컨테이너입니다.
         */
        timelineContainer: HTMLElement;
        /**
         * 상태·명령을 제공하는 포트입니다.
         */
        playbackPort: UTimelinePlaybackPort;
        /**
         * 선택한 숫자 표시 상태이며 기본 null입니다. 별도의 라이브러리 객체는 받지 않습니다.
         */
        borrowedClock?: UTimelineClock | null | undefined;
    };
    type UTimelineRuntime = {
        /**
         * 부착 여부입니다.
         */
        mounted: boolean;
        /**
         * 종료 여부입니다.
         */
        disposed: boolean;
        /**
         * 숫자 표시 상태입니다.
         */
        clock: UTimelineClock | null;
        /**
         * 입력 상태입니다.
         */
        clockViewModel: UTimelineClockViewModel | null;
        /**
         * 날짜·위치 포맷터입니다.
         */
        animationViewModel: UTimelineAnimationViewModel | null;
        /**
         * 재생 조작입니다.
         */
        animation: UTimelineAnimationWidget | null;
        /**
         * 시간축입니다.
         */
        timeline: UTimelineWidget | null;
        /**
         * 소유 조작 루트입니다.
         */
        animationHost: HTMLElement | null;
        /**
         * 소유 시간축 루트입니다.
         */
        timelineHost: HTMLElement | null;
        /**
         * 소유 크기 구독입니다.
         */
        resizeObserver: ResizeObserver | null;
        /**
         * 절대 시간 기준의 밀리초입니다.
         */
        epoch: number | null;
        /**
         * 독립 상태 사본입니다.
         */
        state: UTimelineStateVo | null;
        /**
         * 표시축 변경 키입니다.
         */
        axisKey: string | null;
        /**
         * 자료 세대입니다.
         */
        sourceGeneration: number;
        /**
         * 명령 세대입니다.
         */
        commandGeneration: number;
        /**
         * 포트 상태 표시 중 여부입니다.
         */
        syncing: boolean;
        /**
         * 입력 명령 대기 여부입니다.
         */
        queued: boolean;
        /**
         * 미완료 해제 함수입니다.
         */
        cleanups: Array<() => void>;
        /**
         * 마지막 현재 명령 오류입니다.
         */
        lastError: Error | null;
        /**
         * 탐색 수신자입니다.
         */
        seekListener: ((event: UTimelineSeekEvent) => void) | null;
        /**
         * 크기 수신자입니다.
         */
        resizeListener: (() => void) | null;
        /**
         * 이전 조회 계약의 비활성 해제 핸들이며 기본 null입니다.
         */
        removeRealtimeBlock: (() => void) | null;
    };
}

declare global {
    /**
     *
     * 시간·날짜·프레임 표시축을 독립 값으로 보관합니다. 연결기가 원본 자료를 이 축에 대응시키고 공통 View가 눈금과 탐색 범위를 표시할 때 사용합니다. 시간 진행·날짜 변환·DOM·Clock 생성은 수행하지 않으며 의미 검증은 공통 포트 경계에서 수행합니다.
     */
    type UTimelineAxisMode = "relativeTime" | "absoluteTime" | "framePosition";
    type UTimelineAxisVoCO = {
        /**
         * 표시축 종류. relativeTime·absoluteTime·framePosition 중 하나이며 원본 시간 변환은 연결기가 담당합니다. 생략 시: 'relativeTime'.
         */
        mode?: UTimelineAxisMode | undefined;
        /**
         * 표시축 시작 위치. 시간축은 기준 날짜부터 상대 초이고 프레임축은 0 기반 위치입니다. 유한 숫자이며 프레임축은 0입니다. 생략 시: 0.
         */
        start?: number | undefined;
        /**
         * 표시축 종료 위치. 시작 이상인 유한 숫자입니다. 시간축은 상대 초이고 프레임축은 마지막 0 기반 안전 정수 위치입니다. 생략 시: 0.
         */
        end?: number | undefined;
        /**
         * 표시축 단위. 시간축은 second, 프레임축은 frame입니다. A3F 원본 수치 시간 단위는 변경하지 않습니다. 생략 시: 'second'.
         */
        unit?: string | undefined;
        /**
         * 표시 기준 날짜. absoluteTime에서만 시간대가 있는 ISO 8601 날짜 문자열이며 나머지 축은 null입니다. 날짜 계산은 연결기와 View가 담당합니다. 생략 시: null.
         */
        epoch?: string | null | undefined;
    };
}

declare global {
    /**
     * 현재 허용하는 재생·탐색 입력을 원시 boolean 값으로 전달합니다. Sequence/A3F 연결기가 상태와 지원 기능을 반영하여 구성하고 공통 View가 입력 활성화를 결정할 때 사용합니다. 명령 실행과 backend 자원 관리는 수행하지 않습니다.
     */
    type UTimelineCapabilitiesVoCO = {
        /**
         * 재생 가능 여부. boolean 값이며 기본 false입니다. 현재 상태에서 허용하는 입력만 true로 전달합니다. 생략 시: false.
         */
        canPlay?: boolean | undefined;
        /**
         * 일시정지 가능 여부. boolean 값이며 기본 false입니다. 현재 상태에서 허용하는 입력만 true로 전달합니다. 생략 시: false.
         */
        canPause?: boolean | undefined;
        /**
         * 탐색 가능 여부. boolean 값이며 기본 false입니다. 현재 상태에서 허용하는 입력만 true로 전달합니다. 생략 시: false.
         */
        canSeek?: boolean | undefined;
        /**
         * 역방향 가능 여부. boolean 값이며 기본 false입니다. 현재 상태에서 허용하는 입력만 true로 전달합니다. 생략 시: false.
         */
        canReverse?: boolean | undefined;
        /**
         * 이전·다음 이동 가능 여부. boolean 값이며 기본 false입니다. 현재 상태에서 허용하는 입력만 true로 전달합니다. 생략 시: false.
         */
        canStep?: boolean | undefined;
        /**
         * 배속 변경 가능 여부. boolean 값이며 기본 false입니다. 현재 상태에서 허용하는 입력만 true로 전달합니다. 생략 시: false.
         */
        canChangeRate?: boolean | undefined;
    };
}

declare global {
    /**
     *
     * 자료 식별·시간축·요청 위치와 실제 표시 완료 위치·재생 상태를 독립 사본으로 전달합니다. 연결기의 상태 조회와 구독에서 생성하여 공통 View에 전달하며 중첩 VO를 복사합니다. 비동기 로딩·재생·이벤트 발행·엔진 자원 관리는 수행하지 않습니다.
     */
    type UTimelineStatus = "idle" | "loading" | "ready" | "playing" | "paused" | "buffering" | "configuring" | "error" | "ended" | "disposed";
    type UTimelineStateVoCO = {
        /**
         * 표시축 사본. UTimelineAxisVo 또는 생성 옵션이며 null을 허용하지 않습니다. 입력과 getter 반환값을 중첩 복사합니다. 생략 시: new UTimelineAxisVo().
         */
        axis?: UTimelineAxisVo | UTimelineAxisVoCO | undefined;
        /**
         * 현재 자료 식별 키. 비어 있지 않은 string 또는 자료 미연결 null입니다. 자료 교체를 구분하고 엔진 자원을 보관하지 않습니다. 생략 시: null.
         */
        sourceKey?: string | null | undefined;
        /**
         * 상태 세대. 0 이상 안전 정수이며 같은 자료의 상태 순서를 구분합니다. 증가 정책은 연결기가 담당합니다. 생략 시: 0.
         */
        revision?: number | undefined;
        /**
         * 요청한 표시축 위치. axis 범위의 유한 숫자 또는 준비 전 null입니다. 프레임축 재생 커서는 소수 위치도 허용합니다. 생략 시: null.
         */
        requestedPosition?: number | null | undefined;
        /**
         * 실제 적용한 표시축 위치. axis 범위의 유한 숫자 또는 아직 표시되지 않은 null입니다. 프레임축은 0 기반 안전 정수 목록 위치입니다. 생략 시: null.
         */
        displayedPosition?: number | null | undefined;
        /**
         * 재생 의도. boolean이며 기본 false입니다. 버퍼링 중 true일 수 있으며 실제 프레임 적용 완료를 뜻하지 않습니다. 생략 시: false.
         */
        playing?: boolean | undefined;
        /**
         * 재생 배속. 유한 number이며 음수는 역방향, 0은 정지 상태를 표현합니다. 원본 시간량/실제 초 설정과 구분합니다. 생략 시: 1.
         */
        playbackRate?: number | undefined;
        /**
         * 재생 처리 상태. idle·loading·ready·playing·paused·buffering·configuring·error·ended·disposed 중 하나입니다. 생략 시: 'idle'.
         */
        status?: UTimelineStatus | undefined;
        /**
         * 지원 입력 사본. UTimelineCapabilitiesVo 또는 생성 옵션이며 null 불가입니다. 입력과 getter 반환값을 중첩 복사합니다. 생략 시: new UTimelineCapabilitiesVo().
         */
        capabilities?: UTimelineCapabilitiesVo | UTimelineCapabilitiesVoCO | undefined;
        /**
         * 화면용 오류 설명. string 또는 오류 없음 null이며 Error·Clock·DOM 등 실행 자원을 포함하지 않습니다. 생략 시: null.
         */
        errorMessage?: string | null | undefined;
    };
}

export { GESpreadObject };

export type { GELoader };
export type { U3dModelA3FLayerCO };
export type { U3dModelA3FLayerCO_Content };
export type { U3dModelA3FLayerCompletion };
export type { U3dModelA3FLayerNodeEntry };
export type { U3dModelA3FLayerRelease };
export type { U3dModelA3FLayerTaskOptions };
export type { UA3FArrayLayoutVoCO };
export type { UA3FArrayLayoutVoCO_Content };
export type { UA3FArrayStatisticsVoCO };
export type { UA3FArrayStatisticsVoCO_Content };
export type { UA3FBufferVoCO };
export type { UA3FBufferVoCO_Content };
export type { UA3FCacheBudgetManager };
export type { UA3FCacheBudgetManagerCO };
export type { UA3FCacheBudgetManagerCO_Content };
export type { UA3FCacheBudgetOptionsVoCO };
export type { UA3FCacheBudgetOptionsVoCO_Content };
export type { UA3FCacheBudgetOwner };
export type { UA3FCacheBudgetState };
export type { UA3FCacheBudgetStatusVoCO };
export type { UA3FCacheBudgetStatusVoCO_Content };
export type { UA3FCacheBudgetToken };
export type { UA3FChildMetadataVoCO };
export type { UA3FChildMetadataVoCO_Content };
export type { UA3FCoordinateVoCO };
export type { UA3FCoordinateVoCO_Content };
export type { UA3FDecodedArrayVoCO };
export type { UA3FDecodedArrayVoCO_Content };
export type { UA3FDecodedBufferVoCO };
export type { UA3FDecodedBufferVoCO_Content };
export type { UA3FFieldVoCO };
export type { UA3FFieldVoCO_Content };
export type { UA3FFlowFrame };
export type { UA3FFlowOptionsVoCO };
export type { UA3FFlowOptionsVoCO_Content };
export type { UA3FFlowRendererCO };
export type { UA3FFlowRendererCO_Content };
export type { UA3FFlowRendererState };
export type { UA3FFlowTexture };
export type { UA3FFrameApplyResultVoCO };
export type { UA3FFrameApplyResultVoCO_Content };
export type { UA3FFrameAttributePlan };
export type { UA3FFrameAttributeReadyPlan };
export type { UA3FFrameCacheEntry };
export type { UA3FFrameCacheLease };
export type { UA3FFrameCacheManagerCO };
export type { UA3FFrameCacheManagerCO_Content };
export type { UA3FFrameCacheOptionsVoCO };
export type { UA3FFrameCacheOptionsVoCO_Content };
export type { UA3FFrameCachePreload };
export type { UA3FFrameCacheState };
export type { UA3FFrameCacheStatusVoCO };
export type { UA3FFrameCacheStatusVoCO_Content };
export type { UA3FFrameCacheWaiter };
export type { UA3FFrameLeaseVoCO };
export type { UA3FFrameLeaseVoCO_Content };
export type { UA3FFrameLoader };
export type { UA3FFrameLoaderCO };
export type { UA3FFrameLoaderCO_Content };
export type { UA3FFrameResourceVoCO };
export type { UA3FFrameResourceVoCO_Content };
export type { UA3FFrameVoCO };
export type { UA3FFrameVoCO_Content };
export type { UA3FGeometryFactoryBindings };
export type { UA3FGeometryFactoryBounds };
export type { UA3FGeometryFactoryPrepared };
export type { UA3FGeometryResultVoCO };
export type { UA3FGeometryResultVoCO_Content };
export type { UA3FGeometryVoCO };
export type { UA3FGeometryVoCO_Content };
export type { UA3FHeightAttribute };
export type { UA3FHeightDisplayVoCO };
export type { UA3FHeightDisplayVoCO_Content };
export type { UA3FHeightOperand };
export type { UA3FHeightPolicyVoCO };
export type { UA3FHeightPolicyVoCO_Content };
export type { UA3FHeightShaderProfile };
export type { UA3FLayoutVoCO };
export type { UA3FLayoutVoCO_Content };
export type { UA3FMetadataDocumentData };
export type { UA3FMetadataLoaderCO };
export type { UA3FMetadataLoaderCO_Content };
export type { UA3FMetadataVoCO };
export type { UA3FMetadataVoCO_Content };
export type { UA3FNodeBoundingBoxData };
export type { UA3FNodeVoCO };
export type { UA3FNodeVoCO_Content };
export type { UA3FParserArrayConstructor };
export type { UA3FParserDecodeOptions };
export type { UA3FParserLayoutSnapshot };
export type { UA3FParserTaskArrayLayoutData };
export type { UA3FParserTaskBufferData };
export type { UA3FParserTaskDecodedArrayData };
export type { UA3FParserTaskDecodeRequest };
export type { UA3FParserTaskDecodeResult };
export type { UA3FParserTaskEncodeRequest };
export type { UA3FParserTaskEncodeResult };
export type { UA3FParserTaskLayoutData };
export type { UA3FParticleFlowActive };
export type { UA3FParticleFlowCO };
export type { UA3FParticleFlowCO_Content };
export type { UA3FParticleFlowExecutor };
export type { UA3FParticleFlowInitialized };
export type { UA3FParticleFlowOptionsVoCO };
export type { UA3FParticleFlowOptionsVoCO_Content };
export type { UA3FParticleFlowState };
export type { UA3FSpatialCamera };
export type { UA3FSpatialCover };
export type { UA3FSpatialEntry };
export type { UA3FSpatialManagerCO };
export type { UA3FSpatialManagerCO_Content };
export type { UA3FSpatialOptionsVoCO };
export type { UA3FSpatialOptionsVoCO_Content };
export type { UA3FSpatialPass };
export type { UA3FSpatialRequest };
export type { UA3FSpatialSelectionVoCO };
export type { UA3FSpatialSelectionVoCO_Content };
export type { UA3FSpatialState };
export type { UA3FSpatialViewVoCO };
export type { UA3FSpatialViewVoCO_Content };
export type { UA3FTaskContextVoCO };
export type { UA3FTaskContextVoCO_Content };
export type { UA3FTaskManagerCO };
export type { UA3FTaskManagerCO_Content };
export type { UA3FTaskManagerDecodeOptions };
export type { UA3FTaskManagerEncodeOptions };
export type { UA3FTaskManagerEntry };
export type { UA3FTimelineControllerCO };
export type { UA3FTimelineControllerCO_Content };
export type { UA3FTimelineDirection };
export type { UA3FTimelineOptionsVoCO };
export type { UA3FTimelineOptionsVoCO_Content };
export type { UA3FTimelinePlaybackApi };
export type { UA3FTimelineRuntime };
export type { UA3FTimelineStateListener };
export type { UA3FTimelineStateVoCO };
export type { UA3FTimelineStateVoCO_Content };
export type { UA3FTimelineStatus };
export type { UA3FTimelineSubscription };
export type { UA3FVectorArrayData };
export type { UA3FVectorFieldVoCO };
export type { UA3FVectorFieldVoCO_Content };
export type { UA3FVectorPrepareRequest };
export type { UA3FVectorPrepareResult };
export type { UTimelineAnimationViewModel };
export type { UTimelineAnimationWidget };
export type { UTimelineAxisMode };
export type { UTimelineAxisVoCO };
export type { UTimelineCapabilitiesVoCO };
export type { UTimelineClock };
export type { UTimelineClockViewModel };
export type { UTimelineCommandEvent };
export type { UTimelineCommandTicket };
export type { UTimelinePlaybackPort };
export type { UTimelineRuntime };
export type { UTimelineSeekEvent };
export type { UTimelineStateListener };
export type { UTimelineStateVoCO };
export type { UTimelineStatus };
export type { UTimelineUnsubscribe };
export type { UTimelineViewCO };
export type { UTimelineWidget };
export type {UTimelineAxisVo, UTimelineCapabilitiesVo, UTimelineStateVo} from "../../types/extensions/BSwjxfuO.js";
export type * from "../../types/extensions/BSwjxfuO.js";
export type {UA3FArrayLayoutVo, UA3FArrayStatisticsVo, UA3FBufferVo, UA3FCacheBudgetOptionsVo, UA3FCacheBudgetStatusVo, UA3FChildMetadataVo, UA3FCoordinateVo, UA3FDecodedArrayVo, UA3FDecodedBufferVo, UA3FFieldVo, UA3FFlowOptionsVo, UA3FFrameCacheOptionsVo, UA3FFrameCacheStatusVo, UA3FFrameLeaseVo, UA3FFrameResourceVo, UA3FFrameVo, UA3FGeometryResultVo, UA3FGeometryVo, UA3FHeightDisplayVo, UA3FHeightPolicyVo, UA3FLayoutVo, UA3FMetadataLoader, UA3FMetadataVo, UA3FNodeVo, UA3FParticleFlowOptionsVo, UA3FSpatialOptionsVo, UA3FSpatialSelectionVo, UA3FSpatialViewVo, UA3FTaskContextVo, UA3FTaskManager, UA3FTimelineOptionsVo, UA3FTimelineStateVo, UA3FVectorFieldVo} from "../../types/extensions/DTddTPud.js";
export type * from "../../types/extensions/DTddTPud.js";
