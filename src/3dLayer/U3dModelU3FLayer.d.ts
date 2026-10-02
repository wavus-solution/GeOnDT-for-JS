// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayer } from "./U3dModelLayer.js";
import type { U3FParsedObj, U3dModelU3FLayerCO, U3dModelU3FLayerComposedInfo } from "./U3dModelU3FLayer.types.js";
import type { U3dQueue } from "../core/U3dQueue.js";
import type { UCheckTime } from "../core/UCheckTime.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UTaskProcessor } from "../core/UTaskProcessor.js";
import type { UFileLoader } from "../core/loader/UFileLoader.js";
import type { UTextureLoader } from "../core/loader/UTextureLoader.js";
import type { ModelMaterial } from "../core/mesh/UModelMesh.types.js";
import type { TileInfo, U3fPackagedInfo } from "../meta/U3fPackagedInfo.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { Common_Material, KeyValue, ModelMesh } from "../types/global.types.js";
import type { DeferredObject } from "../util/deferred.types.js";

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 *
 * U3F 모델을 타일 단위로 로드하고 표시·편집·해제하는 레이어입니다.
 *
 * @group 3dLayer
 *
 * @example
 *  let Layer = app.create3DFModelLayer({
 *      name: "chuncheon",
 *      basename: "chuncheon",
 *      baseurl: 'https://3d.geon.kr/data/model/gangwondo/chuncheon',
 *      minlevel: 17,
 *      maxlevel: 17,
 *      ext: '.u3f',
 *      useproxy: true
 *  });
 */
declare class U3dModelU3FLayer extends U3dModelLayer {
    /**
     * 텍스처 품질 선택에 사용하는 변경 가능한 상수 모음입니다. HIGH는 high, LOW는 low입니다.
     *
     * @type {Record<string, string>}
     */
    static TEXTURE_LEVEL: Record<string, string>;
    /**
     * 모든 U3F 레이어가 공유하는 모델 복원 Worker 실행기입니다.
     *
     * @type {import('@union3d/core/UTaskProcessor').UTaskProcessor}
     */
    static g_TaskProcessor: UTaskProcessor;
    /**
     * 병합 모델에서 숨긴 구간에 재사용하는 공용 재질입니다.
     *
     * @type {ModelMaterial | undefined}
     */
    static nonDrawMaterial: ModelMaterial | undefined;
    /**
     * U3dModelU3FLayer 클래스 생성자입니다. <br>
     * 실제 데이터 요청은 initialize에서 시작합니다. <br>
     * baseUrl이 없으면 안내 로그를 남기고 자식 초기화를 중단합니다.
     *
     * @param {U3dModelU3FLayerCO} [opt={}] 모델 주소와 타일·이미지 로딩 및 표시 옵션
     */
    constructor(opt?: U3dModelU3FLayerCO);
    /**
     * 원본 레이어 정보에서 읽은 최소 타일 레벨입니다.
     *
     * @type {number}
     */
    _srcminlevel: number;
    /**
     * 원본 레이어 정보에서 읽은 최대 타일 레벨입니다.
     *
     * @type {number}
     */
    _srcmaxlevel: number;
    /**
     * 타일별 모델 작업 연결을 보관합니다.
     *
     * @type {Record<string, Array<string>>}
     */
    _u3fTiles: Record<string, Array<string>>;
    /**
     * 정리 시 보존할 타일 키 목록입니다.
     *
     * @type {Array<string>}
     */
    _keysPreserved: Array<string>;
    /**
     * 초기화 때 읽은 레이어 정보 참조입니다.
     *
     * @type {KeyValue | undefined}
     */
    _info: KeyValue | undefined;
    /**
     * 텍스처 경계의 반복 방식을 지정하는 Three.js 값입니다.
     *
     * @type {number}
     */
    _wrapping: number;
    /**
     * 최초 텍스처 적용 시 모델 표시도 함께 켤지 결정합니다.
     *
     * @type {boolean}
     */
    _useModelAndTexture: boolean;
    /**
     * 중간 타일 레벨에서 최소 모델 범위를 유지할지 결정합니다.
     *
     * @type {boolean}
     */
    _useMinMaxModel: boolean;
    /**
     * 압축 모델 요청에 사용하는 확장자입니다.
     *
     * @type {string}
     */
    _compressExt: string;
    /**
     * 타일 요청의 Y 인덱스를 반전할지 결정합니다.
     *
     * @type {boolean}
     */
    _reverseY: boolean;
    /**
     * 타일 요청의 X 인덱스를 반전할지 결정합니다.
     *
     * @type {boolean}
     */
    _reverseX: boolean;
    /**
     * 다음 갱신에서 시간 간격 검사와 관계없이 상세 갱신할지 결정합니다.
     *
     * @type {boolean}
     */
    _forceUpdate: boolean;
    /**
     * 최대 이미지 레벨에서 낮출 단계 수입니다.
     *
     * @type {number}
     */
    _minusMaxlevel: number;
    /**
     * 모델에 조명 계산 없는 기본 재질을 사용할지 결정합니다.
     *
     * @type {boolean}
     */
    _useBaseMaterial: boolean;
    /**
     * 파서에 전달할 모델 분할 요청 여부입니다.
     *
     * @type {boolean}
     */
    _useSplitModel: boolean;
    /**
     * 가장 낮은 모델 레벨에 포함할 건물의 높이 기준입니다.
     *
     * @type {number}
     */
    _zeroLevelHeight: number;
    /**
     * 이 레이어가 사용하는 모델 형식 식별자입니다.
     *
     * @type {string}
     */
    _format: string;
    /**
     * 최초 모델 생성 시 사용할 이미지 레벨입니다.
     *
     * @type {number}
     */
    _startImageLevel: number;
    /**
     * 텍스처 상세 갱신을 기다리는 타일 대기열입니다.
     *
     * @type {import('@union3d/core/U3dQueue').U3dQueue}
     */
    _tileBuffer: U3dQueue;
    /**
     * 대기열에 등록한 타일을 키로 찾는 표입니다.
     *
     * @type {Record<string, import('@U3dQuadTile').U3dQuadTile>}
     */
    _tileBufferMap: Record<string, U3dQuadTile>;
    /**
     * 초기화 시 원본 레이어 정보를 요청할지 결정합니다.
     *
     * @type {boolean}
     */
    _needXml: boolean;
    /**
     * 프록시 사용 시 요청 주소 앞에 붙일 접두 URL입니다.
     *
     * @type {string}
     */
    _proxyurl: string;
    /**
     * 모델 요청에 프록시를 사용할지 결정합니다.
     *
     * @type {boolean}
     */
    _useproxy: boolean;
    /**
     * 레이어 정보 요청에 사용할 파일의 기본 이름입니다.
     *
     * @type {string}
     */
    _basename: string;
    /**
     * 타일별로 복원된 모델 식별자를 기록합니다.
     *
     * @type {KeyValue}
     */
    _tileModelMap: KeyValue;
    /**
     * 레이어에 복원된 모델 식별자를 기록합니다.
     *
     * @type {KeyValue}
     */
    _modelIds: KeyValue;
    /**
     * 복원된 모델에 경계 상자 표시를 추가할지 결정합니다.
     *
     * @type {boolean}
     */
    _useBoxHelper: boolean;
    /**
     * 이미지 갱신 작업을 우선 대기열에 등록할지 결정합니다.
     *
     * @type {boolean}
     */
    _immediateUpdateImage: boolean;
    /**
     * 앞선 갱신에서 관찰한 카메라 위치입니다.
     *
     * @type {import('three').Vector3 | undefined}
     */
    _prevPostion: three.Vector3 | undefined;
    /**
     * 현재 갱신에서 관찰한 카메라 위치입니다.
     *
     * @type {import('three').Vector3 | undefined}
     */
    _curPostion: three.Vector3 | undefined;
    /**
     * 카메라 이동 이후 수행한 상세 갱신 횟수입니다.
     *
     * @type {number}
     */
    _updateCount: number;
    /**
     * 모델 재질에 적용할 색상 문자열입니다.
     *
     * @type {string | undefined}
     */
    _meshColor: string | undefined;
    /**
     * 레이어·타일·모델 바이너리를 요청하는 로더입니다.
     *
     * @type {import('@union3d/core/loader/UFileLoader').UFileLoader}
     */
    _loader: UFileLoader;
    /**
     * 이 레이어가 요청한 텍스처의 로딩을 담당합니다.
     *
     * @type {import('@UTextureLoader').UTextureLoader}
     */
    _textureLoader: UTextureLoader;
    /**
     * 패키지 모델 요청 여부이며 초기화 시 원본 정보로 보완됩니다.
     *
     * @type {number | undefined}
     */
    _makeU3FPackage: number | undefined;
    /**
     * 패키지 모델 요청에서 사용할 번호입니다.
     *
     * @type {number}
     */
    _packageIndex: number;
    /**
     * 패키지 모델 요청에서 사용할 기본 이름입니다.
     *
     * @type {string}
     */
    _packageName: string;
    /**
     * 텍스처가 없는 모델 사이에 재질을 공유할지 결정합니다.
     *
     * @type {boolean | number}
     */
    _isShareMaterial: boolean | number;
    /**
     * 모델 복원을 Worker에 요청할지 결정합니다.
     *
     * @type {boolean}
     */
    _useWorker: boolean;
    /**
     * 패키지 타일 정보 JSON의 파일 이름입니다.
     *
     * @type {string | undefined}
     */
    _jsonname: string | undefined;
    /**
     * 패키지 타일 목록의 조회 상태를 보관합니다.
     *
     * @type {import('@union3d/meta/U3fPackagedInfo').U3fPackagedInfo}
     */
    _packagedInfo: U3fPackagedInfo;
    /**
     * 거리별 텍스처 상세 갱신을 사용할지 결정합니다.
     *
     * @type {boolean}
     */
    _isTextureUpdate: boolean;
    /**
     * 이미지 상세 전환 거리를 지정하며 0이면 렌더링 문맥의 값을 사용합니다.
     *
     * @type {number | undefined}
     */
    _textureDistance: number | undefined;
    /**
     * 복원 재질에 전달할 스타일 설정입니다.
     *
     * @type {string | undefined}
     */
    _style: string | undefined;
    /**
     * 이미지 갱신 작업의 실행 간격을 관리합니다.
     *
     * @type {import('@union3d/core/UCheckTime').UCheckTime}
     */
    _checkUpdateImage: UCheckTime;
    /**
     * 원본 레이어 정보에서 읽은 패키지 JSON 사용 상태입니다.
     *
     * @type {number | boolean}
     */
    _makeJson: number | boolean;
    /**
     * 타일 표시와 개별 모델 편집 시 복원할 재질 구간을 보관합니다.
     *
     * @type {KeyValue}
     */
    _refineCache: KeyValue;
    /**
     * 결합 그룹별 개별 모델의 편집 정보를 보관합니다.
     *
     * @type {KeyValue}
     */
    _composedCache: KeyValue;
    /**
     * 타일별로 요청한 모델 URL 목록입니다.
     *
     * @type {Record<string, Array<string>>}
     */
    _modelUrlMap: Record<string, Array<string>>;
    /**
     * 이미지 상세 선택에 적용할 품질 설정입니다.
     *
     * @type {string | undefined}
     */
    _textureLevel: string | undefined;
    /**
     * 이 레이어의 모델들이 재사용하며 dispose에서 해제하는 재질입니다.
     *
     * @type {Common_Material | undefined}
     */
    _sharedMaterial: Common_Material | undefined;
    /**
     * 앞선 상세 갱신에서 관찰한 모델 처리 개수입니다.
     *
     * @type {number | undefined}
     */
    _preUpdateCount: number | undefined;
    /**
     * 앞선 상세 갱신에서 마지막으로 처리한 타일 키입니다.
     *
     * @type {string | undefined}
     */
    _preUpdateLastTile: string | undefined;
    /**
     * 그림자 갱신 대상 그룹을 순회해 메시의 가시 상태와 갱신 시간을 반영합니다.
     *
     * @param {number} updateTime 각 메시의 갱신 여부 검사와 그림자 적용에 전달할 시간
     */
    updateShadow(updateTime: number): void;
    /**
     * 모델 텍스처의 품질 설정을 저장하고 화면 갱신을 요청합니다. <br>
     * high 또는 low 값은 품질 선택에 사용되지만 현재 입력 검사에서는 안내 로그도 출력됩니다. <br>
     * 안내 로그가 발생해도 입력값은 저장됩니다.
     *
     * @param {string} textureLevel 적용할 텍스처 품질
     */
    setTextureLevel(textureLevel: string): void;
    /**
     * 텍스처 품질 고정을 해제하여 거리별 자동 선택으로 돌아갑니다. <br>
     * 이 메서드는 별도의 화면 갱신을 요청하지 않습니다.
     */
    clearTextureLevel(): void;
    /**
     * 메쉬 정점/지오메트리 수를 집계하고 테스트 머터리얼을 적용합니다.
     *
     * @ignore
     */
    testMesh(): void;
    /**
     * 원본 레이어 정보를 읽어 표시 범위와 패키지 로딩 설정을 초기화합니다. <br>
     * needXml이 false이면 부모 초기화와 완료 통지만 수행하며 Promise를 반환하지 않습니다. <br>
     * 패키지 JSON을 요청하는 경우 반환된 Promise와 별도로 초기화가 진행됩니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} [drawArg] 상위 호출부와 호환되는 렌더링 문맥
     * @returns {Promise<unknown> | undefined} 원본 정보 요청을 연결한 Promise, 원본 정보를 요청하지 않으면 undefined
     */
    override initialize(drawArg?: UDrawArg): Promise<unknown> | undefined;
    /**
     * 초기화된 레이어의 경계 상자를 반환합니다. <br>
     * 반환 객체는 복사본이 아니라 레이어가 보관한 원본 참조입니다.
     *
     * @returns {import('three').Box3} 레이어 경계 상자
     */
    getBoundingBox(): three.Box3;
    /**
     * 프록시·기본 주소·기본 이름을 결합한 레이어 정보 요청 URL을 반환합니다. <br>
     * 이름에 확장자가 이미 있어도 확장자를 다시 덧붙입니다.
     *
     * @returns {string} 레이어 정보 요청 URL
     */
    createU3GURL(): string;
    /**
     * 초기화에서 저장한 원본 레이어 정보를 반환합니다. <br>
     * 반환 객체를 변경하면 레이어가 사용하는 정보에도 반영됩니다.
     *
     * @returns {KeyValue | undefined} 저장된 레이어 정보, 초기화 전이면 undefined
     */
    getInfo(): KeyValue | undefined;
    /**
     * 레이어 정보를 요청하고 원본 최소·최대 타일 레벨을 기록합니다. <br>
     * 요청 실패·중단은 false로, 형식 식별 실패는 undefined로 거부합니다. <br>
     * 바이너리 해석 중 발생한 예외는 이 메서드에서 복구하지 않습니다.
     *
     * @param {string} [url] 요청 URL이며 생략하면 createU3GURL의 결과 사용
     * @param {import('@UDrawArg').UDrawArg} [drawArg] 호출부 호환용 렌더링 문맥이며 현재 구현에서는 사용하지 않음
     * @returns {Promise<object>} 해석한 레이어 정보가 전달되는 완료 객체
     */
    getLayerInfo(url?: string, drawArg?: UDrawArg): Promise<object>;
    /**
     * 레이어 JSON 정보를 로드합니다.
     *
     * @param {string} url JSON 요청 URL
     * @returns {Promise<object>} JSON 정보 Promise
     *
     * @ignore
     */
    getLayerJson(url: string): Promise<object>;
    /**
     * 타일 정보를 로드/파싱합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @param {number} indexX 타일 X 인덱스
     * @param {number} indexY 타일 Y 인덱스
     * @param {number} level 타일 레벨
     * @param {string} url 타일 정보 요청 URL
     * @returns {Promise<import('@union3d/meta/U3fPackagedInfo').TileInfo>} 타일 정보 Promise
     *
     * @ignore
     */
    getTileInfo(tile: U3dQuadTile, indexX: number, indexY: number, level: number, url: string): Promise<TileInfo>;
    /**
     * 모델 정보를 로드/파싱하여 mesh로 변환합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @param {number} index 모델 인덱스
     * @param {string} url 모델 요청 URL
     * @param {string} baseurl 모델 기본 URL
     * @param {import('@UDrawArg').UDrawArg} drawArg draw 인자
     * @param {import('@union3d/meta/U3fPackagedInfo').TileInfo} tileInfo 타일 정보
     * @returns {Promise<unknown> | undefined} 모델 정보 Promise
     *
     * @ignore
     */
    getModelInfo(tile: U3dQuadTile, index: number, url: string, baseurl: string, drawArg: UDrawArg, tileInfo: TileInfo): Promise<unknown> | undefined;
    /**
     * 다음 상세 갱신에서 시간 간격 제한을 건너뛸지 설정합니다.
     *
     * @param {boolean} force 시간 간격과 관계없이 갱신할지 여부
     *
     * @ignore
     */
    setForceUpdate(force: boolean): void;
    /**
     * 다음 상세 갱신에서 시간 간격 제한을 건너뛸지 반환합니다.
     *
     * @returns {boolean} ForceUpdate 여부
     *
     * @ignore
     */
    getForceUpdate(): boolean;
    /**
     * 보존 목록에 기록된 타일을 순서대로 해제하고 목록을 비웁니다.
     */
    deletekeys(): void;
    /**
     * 부모 레이어 해제를 시작하고 공간 색인 및 이 레이어의 공유 재질을 해제합니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} [drawArg] 호출부 호환용 인수이며 부모 해제에는 전달하지 않음
     * @returns {Promise<boolean>} 부모 레이어가 반환한 해제 완료 Promise
     */
    override dispose(drawArg?: UDrawArg): Promise<boolean>;
    /**
     * 텍스처를 로드합니다.
     *
     * @param {import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer} self 레이어 인스턴스
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @param {string} url 텍스처 URL
     * @returns {Promise<import('three').Texture>} 텍스처 promise
     *
     * @ignore
     */
    getTexture(self: U3dModelU3FLayer, tile: U3dQuadTile, url: string): Promise<three.Texture>;
    /**
     * 메모리/캐시를 정리합니다.
     *
     * @ignore
     */
    cleanMemory(): void;
    /**
     * 레이어 업데이트 함수
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} drawArg draw 인자
     * @param {number} [curTime] 현재 시간
     *
     * @ignore
     */
    override update(drawArg: UDrawArg, curTime?: number): void;
    /**
     * 절두체 기준 타일 상세 업데이트 함수
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {import('@UDrawArg').UDrawArg} [opt]
     * @param {boolean | number} [curTime] 현재 시간 또는 force 플래그
     * @param {any} [resolve] resolve 콜백 (.call() 동적 호출 패턴)
     * @returns {any}
     *
     * @ignore
     */
    override updateDetailByFrustum(tile: U3dQuadTile, opt?: UDrawArg, curTime?: boolean | number, resolve?: any): any;
    /**
     * 입력받은 타일에 속한 모델을 레이어 위에 생성합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @returns {boolean | Promise<unknown> | undefined}
     *
     * @ignore
     */
    override createModel(tile: U3dQuadTile): boolean | Promise<unknown> | undefined;
    /**
     * 타일을 씬에 추가합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     *
     * @ignore
     */
    override addTileFromScene(tile: U3dQuadTile): void;
    /**
     * 타일을 씬에서 제거합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     *
     * @ignore
     */
    override removeTileFromScene(tile: U3dQuadTile): void;
    /**
     * 절두체 기준 모델 생성 함수
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {import('@UDrawArg').UDrawArg} drawArg
     * @param {boolean} [force]
     * @returns {any}
     *
     * @ignore
     */
    override createModelByFrustum(tile: U3dQuadTile, drawArg: UDrawArg, force?: boolean): any;
    /**
     * 블록 단위로 모델을 로드합니다.
     *
     * @param {import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer} self
     * @param {string} baseurl
     * @param {number} startindex
     * @param {number} endindex
     * @param {number} blocksize
     * @param {number} max
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {import('@UDrawArg').UDrawArg} drawArg
     * @param {DeferredObject<boolean>} endPromise
     *
     * @ignore
     */
    loadBlockModel(self: U3dModelU3FLayer, baseurl: string, startindex: number, endindex: number, blocksize: number, max: number, tile: U3dQuadTile, drawArg: UDrawArg, endPromise: DeferredObject<boolean>): void;
    /**
     * 메쉬 색상을 설정합니다.
     *
     * @param {string | number} color
     *
     * @ignore
     */
    setMeshColor(color: string | number): void;
    /**
     * 면 단위로 메쉬를 분할하여 병합합니다.
     *
     * @override
     *
     * @param {ModelMesh} mesh
     * @param {number | function(import('three').Object3D, import('@UDrawArg').UDrawArg): void} [faceIndex] faceIndex 또는 afterFunction
     * @param {function(import('three').Object3D, import('@UDrawArg').UDrawArg, string): void} [onAfterFunction]
     * @returns {any}
     *
     * @ignore
     */
    override mergedMeshDivision(mesh: ModelMesh, faceIndex?: number | ((arg0: three.Object3D, arg1: UDrawArg) => void), onAfterFunction?: (arg0: three.Object3D, arg1: UDrawArg, arg2: string) => void): any;
    /**
     * 키에 해당하는 모델에 픽 재질을 설정합니다.
     *
     * @param {string} key
     * @param {string | number} color
     * @param {number} opacity
     * @param {string} meshId
     * @param {boolean} [isSetOutline=false]
     * @returns {Array<ModelMesh> | void}
     *
     * @ignore
     */
    setPickMaterial(key: string, color: string | number, opacity: number, meshId: string, isSetOutline?: boolean): Array<ModelMesh> | void;
    /**
     * 재질 인덱스를 제거합니다.
     *
     * @override
     *
     * @param {ModelMesh} object
     * @param {number} materialIndex
     * @returns {any}
     *
     * @ignore
     */
    override removeMaterialIndex(object: ModelMesh, materialIndex: number): any;
    /**
     * 메쉬의 바운딩 박스 정보를 구합니다.
     *
     * @param {ModelMesh} mesh
     * @returns {Array<{id: string, info: object}> | void}
     *
     * @ignore
     */
    getBoundingBoxInfo(mesh: ModelMesh): Array<{
        id: string;
        info: object;
    }> | void;
    /**
     * 결합 그룹에서 지정 모델의 편집 정보를 찾습니다. <br>
     * 반환값은 저장된 정보의 원본 참조입니다.
     *
     * @param {string} gid 결합 그룹 식별자
     * @param {string} childId 찾을 모델 식별자
     * @returns {U3dModelU3FLayerComposedInfo | undefined} 해당 모델의 편집 정보, 그룹이나 모델을 찾지 못하면 undefined
     */
    getComposedInfo(gid: string, childId: string): U3dModelU3FLayerComposedInfo | undefined;
    /**
     * 레이어의 영역(Rectangle)과 Box3 를 계산합니다.
     *
     * @ignore
     */
    computeRectangle(): void;
    /**
     * 편집된 텍스처를 타일에 적용합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @param {number} level 모델 레벨
     *
     * @ignore
     */
    applyEditedTextures(tile: U3dQuadTile, level: number): void;
    /**
     * 썸네일 raw 이미지로부터 텍스처를 생성합니다.
     *
     * @param {string | ArrayBuffer} thumbimage 썸네일 이미지 데이터
     * @param {any} promise 완료 promise 객체
     *
     * @ignore
     */
    createTextureFromImageRaw(thumbimage: string | ArrayBuffer, promise: any): void;
    /**
     * 머터리얼에 기본 색상/텍스처/스타일을 설정합니다.
     *
     * @param {ModelMaterial} material 머터리얼
     * @param {import('three').Texture} [texture] 재질에 적용할 단일 텍스처
     *
     * @ignore
     */
    setMaterial(material: ModelMaterial, texture?: three.Texture): void;
    /**
     * 파서의 복원 입력을 타일 그룹의 렌더링 메시로 생성합니다. <br>
     * 입력의 버퍼를 소비하며 공유 재질·타일 경계·편집 상태를 함께 갱신합니다. <br>
     * 타일 그룹·입력·렌더링 문맥이 없으면 생성하지 않습니다. <br>
     * 생성한 개별 메시마다 로드 이벤트를 발행하며 편집 분할로 중단한 경우에는 이후 메시를 생성하지 않습니다. <br>
     * 병합 대기 입력은 타일 정보에 등록하고 여기서는 메시를 반환하지 않습니다.
     *
     * @param {Array<U3FParsedObj>} objs 파서가 전달한 복원 입력
     * @param {import('three').Texture | Array<import('three').Texture> | undefined} texture 모델에 적용할 텍스처이며 배열은 ADD 병합 입력에서 사용
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 등록 대상 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg 좌표 변환과 렌더링 문맥
     * @param {import('@union3d/meta/U3fPackagedInfo').TileInfo} tileInfo 타일의 표시 방식과 병합 대기 상태
     * @returns {ModelMesh | undefined} 생성된 루트 메시, 생성하지 않았으면 undefined
     *
     * @ignore
     */
    createModelMesh(objs: Array<U3FParsedObj>, texture: three.Texture | Array<three.Texture> | undefined, tile: U3dQuadTile, drawArg: UDrawArg, tileInfo: TileInfo): ModelMesh | undefined;
    /**
     * 병합 대기 입력을 타일 그룹의 렌더링 메시로 복원합니다. <br>
     * 입력 버퍼를 소비하며 취소로 중단하면 남은 입력의 텍스처와 버퍼 참조를 정리합니다. <br>
     * 지원하지 않는 복원 입력은 오류로 거부됩니다.
     *
     * @param {Array<U3FParsedObj>} objs 병합 대기 입력
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 등록 대상 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg 렌더링 문맥
     * @returns {Promise<ModelMesh | undefined>} 생성된 루트 메시, 중단되었으면 undefined
     *
     * @ignore
     */
    mergeModelMesh(objs: Array<U3FParsedObj>, tile: U3dQuadTile, drawArg: UDrawArg): Promise<ModelMesh | undefined>;
    /**
     * face 인덱스 기준으로 mesh 를 분할합니다.
     *
     * @param {ModelMesh} mesh 대상 mesh
     * @param {number} faceIndex face 인덱스
     * @returns {{materialIndex: number, composedInfo: U3dModelU3FLayerComposedInfo, tileMaxKey: string} | void} 분할 정보
     *
     * @ignore
     */
    divisionMeshFromFace(mesh: ModelMesh, faceIndex: number): {
        materialIndex: number;
        composedInfo: U3dModelU3FLayerComposedInfo;
        tileMaxKey: string;
    } | void;
    /**
     * geometry group 분할 정보를 갱신합니다.
     *
     * @param {ModelMesh} mesh 대상 mesh
     * @param {number} index group 인덱스
     * @param {U3dModelU3FLayerComposedInfo} composedInfo 합성 메시 정보
     * @param {number} targetIndex 대상 머터리얼 인덱스
     * @returns {number | undefined} 적용한 재질 인덱스, 해당 범위가 없으면 undefined
     *
     * @ignore
     */
    setGroupsDivisionRefine(mesh: ModelMesh, index: number, composedInfo: U3dModelU3FLayerComposedInfo, targetIndex: number): number | undefined;
    /**
     * 합성 메시 정보 기준으로 pick 머터리얼을 적용합니다.
     *
     * @param {ModelMesh} mesh 대상 mesh
     * @param {import('three').Object3D} group group 객체
     * @param {Array<U3dModelU3FLayerComposedInfo>} composedInfo 합성 메시 정보
     * @param {boolean} [isSetOutline=false] 외곽선 설정 여부
     *
     * @ignore
     */
    applyPickMaterial(mesh: ModelMesh, group: three.Object3D, composedInfo: Array<U3dModelU3FLayerComposedInfo>, isSetOutline?: boolean): void;
    /**
     * 합성 메시 정보 기준으로 pick 머터리얼을 설정합니다.
     *
     * @param {ModelMesh} mesh
     * @param {U3dModelU3FLayerComposedInfo} composedInfo 합성 메시 정보
     * @param {string | number | import('three').ColorRepresentation} color
     * @param {number} opacity
     * @param {boolean} [isSetColor=true]
     *
     * @ignore
     */
    setPickMaterialByComposedInfo(mesh: ModelMesh, composedInfo: U3dModelU3FLayerComposedInfo, color: string | number | three.ColorRepresentation, opacity: number, isSetColor?: boolean): void;
    /**
     * refine 캐시를 조회합니다.
     *
     * @param {string} type refine 타입
     * @param {string} key 타일 키
     * @returns {Array<KeyValue> | void} refine 캐시
     *
     * @ignore
     */
    getRefineCache(type: string, key: string): Array<KeyValue> | void;
    /**
     * meshInfo 의 유효성을 검증합니다.
     *
     * @param {Array<{id: string | number, oid: string | number}>} meshInfo mesh 정보 배열
     * @param {Array<string>} list 검증 대상 리스트
     * @param {ModelMesh} mesh 대상 mesh
     *
     * @ignore
     */
    validationMeshInfo(meshInfo: Array<{
        id: string | number;
        oid: string | number;
    }>, list: Array<string>, mesh: ModelMesh): void;
}

export type { U3dModelU3FLayer };
