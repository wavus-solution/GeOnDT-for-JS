// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelBasicLayer } from "../../3dLayer/U3dModelBasicLayer.js";
import type { UDrawArg } from "../UDrawArg.js";
import type { UGroup } from "../UGroup.js";
import type { UMesh } from "../mesh/UMesh.js";
import type { Chunk, TDSLoader } from "../../lib/three/loaders/TDSLoader.js";
import type { ColorLike } from "../../types/global.js";

/**
 * ~extends import('@union3d/lib/three/loaders/TDSLoader').TDSLoader <br>
 *
 * 3DS(Autodesk 3D Studio) 파일을 읽어 `UGroup` 아래 `UMesh` 목록으로 만드는 로더입니다. <br>
 * Three.js `TDSLoader`를 상속하고 청크 파싱을 직접 구현하여 다음을 지원합니다.
 * 부모와 같은 Chunk 인자·반환값으로 읽기 메서드를 오버라이드하며 색상·백분율·재질 그룹 읽기는 부모 구현을 재사용합니다.
 * - keyframe 데이터(KFDATA)의 PIVOT·POS/ROT/SCL_TRACK을 읽어 프레임 0 값으로 각 mesh의 position·quaternion·scale을 설정합니다.
 * - 정점·MESH_MATRIX·keyframe 값을 모두 3DS 원좌표(Z-up) 그대로 사용합니다. 축 교환은 하지 않으므로 결과는 Z가 높이인 장면에 바로 놓을 수 있습니다.
 * - 재질 그룹(MSH_MAT_GROUP)이 여러 개인 객체는 그룹별로 `UMesh`를 나눕니다.
 * - 재질 텍스처를 파싱 뒤 비동기로 내려받으며, `load()`의 완료 콜백은 텍스처까지 준비된 뒤 호출됩니다.
 * - 외부 메타데이터(`updateMetaData`)로 mesh 위치 오프셋을 적용할 수 있습니다.
 *
 * 인스턴스는 한 파일 파싱 상태(`meshes`, `materials`, `nodes` 등)를 프로퍼티로 유지하므로 파일마다 새로 만들어 사용하십시오.
 *
 * @group core
 * @extends {TDSLoader}
 */
declare class UTDSLoader extends TDSLoader {
    /**
     * 로더를 생성합니다. `opt`는 생략할 수 없으며(`opt.drawarg`를 바로 읽음) 각 옵션의 기본값은 `UTDSLoaderCO`를 참고하십시오.
     *
     * @param {import('three').LoadingManager | undefined} manager 파일·텍스처 요청을 추적할 Three.js 로딩 매니저. 생략하면 `THREE.DefaultLoadingManager`
     * @param {UTDSLoaderCO} opt 생성 옵션
     */
    constructor(manager: three.LoadingManager | undefined, opt: UTDSLoaderCO);
    /**
     * 키프레임 전용 DataView 파서의 읽기 위치(파일 시작 기준 바이트 오프셋). 메시 파서는 각 Chunk의 독립적인 커서를 사용합니다.
     *
     * @type {number}
     */
    position: number;
    /**
     * keyframe 노드 맵. 키는 노드가 가리키는 객체 이름(NAMED_OBJECT 이름)이며 `$$$DUMMY` 노드는 담지 않습니다.
     * 같은 객체를 참조하는 노드가 여러 개면 마지막 노드만 남습니다.
     *
     * @type {Record<string, UTDSNode>}
     */
    nodes: Record<string, UTDSNode>;
    /**
     * 객체 이름 → 그 객체에서 만들어진 mesh 목록. `readFile`이 keyframe 노드를 mesh에 적용할 때 이 맵으로 짝을 찾습니다.
     *
     * @type {Record<string, Array<import('@UMesh').UMesh>>}
     */
    nodesMeshPair: Record<string, Array<UMesh>>;
    /**
     * 원본 메시와 재질 그룹별 분할 메시 목록을 연결합니다. `readMesh()`는 원본 메시 하나를 반환하고 `readNamedObject()`가 전체 목록을 등록합니다.
     *
     * @type {WeakMap<import('three').Mesh, Array<import('@UMesh').UMesh>>}
     */
    _meshParts: WeakMap<three.Mesh, Array<UMesh>>;
    /**
     * 생성 옵션 `loadtype`의 보관 값. 기본 `'XYZ'`. 현재 파싱 동작을 바꾸지 않습니다.
     *
     * @type {string}
     */
    loadtype: string;
    /**
     * `true`면 `readFile` 끝에서 재질이 참조하는 텍스처 이미지를 내려받아 연결합니다. 생성 옵션 `needtexture`, 기본 `true`.
     *
     * @type {boolean}
     */
    needTexture: boolean;
    /**
     * 텍스처 연결 뒤 화면 갱신에 사용할 컨텍스트입니다. 없으면 갱신 호출을 생략합니다.
     *
     * @type {import('@UDrawArg').UDrawArg | undefined}
     */
    drawArg: UDrawArg | undefined;
    /**
     * 재질에 적용할 렌더 면(생성 옵션 `side`). 재질 청크마다 복제되는 기본 재질의 `side`가 되며, 파일의 양면 플래그가 있으면 `DoubleSide`로 덮어씁니다.
     *
     * @type {import('three').Side | undefined}
     */
    side: three.Side | undefined;
    /**
     * 지정되어 있으면 파일의 재질 색상을 무시하고 모든 재질에 적용하는 색(생성 옵션 `color`).
     *
     * @type {ColorLike | undefined}
     */
    color: ColorLike | undefined;
    /**
     * 재질 청크마다 `clone()`되어 각 재질의 바탕이 되는 기본 재질. 회색(`0xc0c0c0`) `MeshStandardMaterial`이며 `UDEF.settingModelLayerMaterial`이 모델 레이어 공통 설정을 적용합니다.
     * 재질 그룹으로 분할된 mesh와 재질 정보가 없는 mesh는 이 재질을 그대로 공유합니다.
     *
     * @type {import('three').MeshStandardMaterial}
     */
    _defaultMaterial: three.MeshStandardMaterial;
    /**
     * `true`면 원점 중앙화를 생략합니다(생성 옵션 `needXml`, 기본 `false`). `readFile`의 좌표 처리 설명을 참고하십시오.
     *
     * @type {boolean}
     */
    needXml: boolean;
    /**
     * 마지막 parse()가 시작한 텍스처 준비를 기다리는 Promise입니다. 파싱 전에는 완료 상태이며, parse() 후에는 await loader.ready로 기다립니다.
     *
     * @type {Promise<void>}
     */
    ready: Promise<void>;
    /**
     * 네이티브 Promise로 3DS 파일을 읽고 `UGroup` 결과를 반환합니다.
     * `load()`가 반환하는 Promise를 사용하여 파싱·텍스처 준비·오류를 동일한 경로로 처리합니다.
     *
     * @override
     *
     * @param {string} url 내려받을 3DS 파일 경로
     * @param {(event: ProgressEvent) => void} [onProgress] 파일 다운로드 진행 콜백
     * @returns {Promise<import('@UGroup').UGroup>} 파싱과 텍스처 준비를 마친 결과 그룹
     */
    override loadAsync(url: string, onProgress?: (event: ProgressEvent) => void): Promise<UGroup>;
    /**
     * keyframe 노드를 외부에 전달할 수 있는 평범한 객체(`UTDSNodeInfo`)로 바꿉니다.
     * 트랙 배열은 복사하지 않고 같은 참조를 넣으므로 반환 객체를 수정하면 노드 내부 트랙도 바뀝니다.
     *
     * @param {UTDSNode} node 직렬화할 노드
     * @returns {UTDSNodeInfo} 노드 정보 객체
     *
     * @ignore
     */
    serializeNode(node: UTDSNode): UTDSNodeInfo;
    /**
     * keyframe 노드의 프레임 0 값으로 mesh의 position·quaternion·scale을 설정합니다.
     * `readMesh`가 MESH_MATRIX에서 분해해 넣어 둔 transform을 **덮어쓰며**, 노드에 없는 항목(`InvalidValue`)은 건드리지 않습니다.
     * 값은 3DS 원좌표 그대로이고 `mesh.userData.tds.node`에 `UTDSNodeInfo`를 기록한 뒤 `updateMatrix()`를 호출합니다.
     * pivot 이동은 여기서 하지 않으며 호출 전에 `readFile`이 지오메트리에 적용합니다.
     *
     * @param {import('@UMesh').UMesh} mesh transform을 설정할 대상 mesh
     * @param {UTDSNode} node 적용할 노드
     *
     * @ignore
     */
    applyNodeTransform(mesh: UMesh, node: UTDSNode): void;
    /**
     * 3DS 파일을 내려받아 파싱하고, 재질 텍스처까지 준비된 뒤 완료 콜백을 호출합니다. <br>
     * 파일 경로는 `setPath()`로 지정한 경로를 앞에 붙여 해석하고, 텍스처는 `setResourcePath()`(없으면 `setPath()`) 경로에서 찾습니다.
     * `onLoad`는 파싱 직후가 아니라 `needTexture`에 따른 텍스처 로딩이 모두 끝난 뒤(`ready` Promise 완료) 한 번 호출됩니다.
     * 반환 프로미스도 같은 시점에 결과 그룹으로 이행되며, 파일 요청이나 파싱이 실패하면 `onError`가 호출되고 프로미스는 거부됩니다.
     *
     * @override
     *
     * @param {string} url 내려받을 3DS 파일 경로. `setPath()` 값에 이어 붙여집니다
     * @param {(group: import('@UGroup').UGroup) => void} [onLoad] 완료 콜백. 인자는 `parse()` 결과 그룹
     * @param {(event: ProgressEvent) => void} [onProgress] 파일 다운로드 진행 콜백. 텍스처 진행은 전달되지 않습니다
     * @param {(error: unknown) => void} [onError] 파일 요청·파싱 실패 콜백
     * @returns {Promise<import('@UGroup').UGroup>} 완료 시 결과 그룹으로 이행되는 프로미스
     */
    override load(url: string, onLoad?: (group: UGroup) => void, onProgress?: (event: ProgressEvent) => void, onError?: (error: unknown) => void): Promise<UGroup>;
    /**
     * keyframe 노드 참조(`nodes`, `nodesMeshPair`)를 비워 파싱 중간 데이터를 해제합니다.
     * 결과 그룹·mesh·재질은 호출자가 소유하므로 해제하지 않으며 `group`, `meshes`, `materials`는 그대로 남습니다.
     * `load()` 완료 콜백 안에서 호출하는 것을 전제로 합니다.
     */
    dispose(): void;
    /**
     * 메모리에 있는 3DS 바이너리를 파싱해 mesh들이 담긴 `UGroup`을 만듭니다. <br>
     * 호출 시 `group`, `materials`, `meshes`, `nodes`, `nodesMeshPair`를 모두 새로 초기화하므로 이전 파싱 결과와의 연결은 끊어집니다.
     * 결과 그룹에는 `userData.tdsNodes`(모든 keyframe 노드의 `UTDSNodeInfo` 배열)와
     * 외부 메타데이터 적용용 `_updateMetaDataFn.update`(= `updateMetaData`)가 붙습니다.
     * 이 메서드는 동기적으로 반환하지만 텍스처 이미지는 이후 비동기로 채워지므로, 텍스처가 필요하면 `load()`를 사용하거나 `await loader.ready`로 텍스처 준비를 기다리십시오.
     *
     * @override
     *
     * @param {ArrayBuffer} arraybuffer 3DS 파일 전체 바이너리
     * @param {string} path 하위 파서에 전달되는 경로 인자. 현재 구현은 사용하지 않으며 텍스처 경로는 `setResourcePath()`/`setPath()` 값을 따릅니다
     * @returns {import('@UGroup').UGroup} `meshes` 순서대로 mesh가 추가된 새 그룹. 좌표는 3DS 원좌표(Z-up)
     */
    override parse(arraybuffer: ArrayBuffer, path: string): UGroup;
    /**
     * keyframe 데이터 청크(KFDATA, `0xB000`)를 읽어 하위 객체 노드를 `nodes`에 채웁니다. 카메라·라이트 노드는 무시합니다.
     * 호출 시 읽기 위치가 KFDATA 헤더 시작에 있어야 하며, 끝나면 청크 끝으로 이동합니다.
     *
     * @param {DataView} data 파일 전체를 감싼 DataView
     * @param {string} path 사용하지 않는 인자(상위 호출 형식 유지용)
     *
     * @ignore
     */
    readKeyFrameData(data: DataView, path: string): void;
    /**
     * 부모 청크 안의 다음 하위 청크 헤더를 읽고 부모의 커서(`cur`)를 그 하위 청크 끝으로 전진시킵니다.
     * 읽기 위치는 하위 청크의 본문 시작(헤더 직후)에 놓이므로 이어서 본문을 읽을 수 있습니다.
     * 부모 범위를 다 읽었거나 헤더가 손상(크기 6 미만, 부모 범위 초과)되어 더 진행할 수 없으면 `undefined`를 돌려 순회를 끝냅니다.
     *
     * @param {DataView} data 파일 전체를 감싼 DataView
     * @param {UTDSChunk} parentID 순회 중인 부모 청크. `cur`가 갱신됩니다
     * @returns {UTDSChunk | undefined} 다음 하위 청크. 더 없거나 손상되면 `undefined`
     *
     * @ignore
     */
    readChildChunk(data: DataView, parentID: UTDSChunk): UTDSChunk | undefined;
    /**
     * KFDATA의 하위 청크를 순회하며 객체 노드(OBJECT_NODE_TAG, `0xB002`)만 `readObjectNode`로 읽습니다. 나머지 청크는 건너뜁니다.
     *
     * @param {DataView} data 파일 전체를 감싼 DataView
     * @param {UTDSChunk} mainID KFDATA 청크
     *
     * @ignore
     */
    readKeyFrameSub(data: DataView, mainID: UTDSChunk): void;
    /**
     * 객체 노드 청크 하나를 읽어 `UTDSNode`를 만들고 객체 이름을 키로 `nodes`에 넣습니다. <br>
     * NODE_ID, NODE_HDR(객체 이름·부모 ID), PIVOT, INSTANCE_NAME, POS/ROT/SCL_TRACK_TAG를 인식하며,
     * 트랙은 `readTrack`으로 전체를 읽되 프레임 0(첫 키) 값만 노드의 위치·회전·스케일 필드에 복사합니다.
     * 이름이 `$$$DUMMY`인 노드와 이름 없는 노드는 `nodes`에 넣지 않습니다. 부모 ID는 보관만 하며 계층 transform은 적용하지 않습니다.
     *
     * @param {DataView} data 파일 전체를 감싼 DataView
     * @param {UTDSChunk} nodeChunk OBJECT_NODE_TAG 청크
     *
     * @ignore
     */
    readObjectNode(data: DataView, nodeChunk: UTDSChunk): void;
    /**
     * keyframe 트랙 청크(POS/ROT/SCL_TRACK_TAG)를 읽어 키 배열로 돌려줍니다. <br>
     * 헤더(flags 2바이트, 미사용 8바이트, 키 개수 4바이트) 뒤에 키가 이어지며, 각 키는 프레임 번호·스플라인 플래그·플래그에 따른 보간 값·`valueCount`개의 float 값으로 이루어집니다.
     * 청크 범위를 벗어나면 그 지점에서 읽기를 멈추므로 손상된 파일에서는 키 개수가 헤더보다 적을 수 있습니다.
     * 반환 배열에는 `trackFlags`, `unknown` 프로퍼티가 함께 붙습니다.
     *
     * @param {DataView} data 파일 전체를 감싼 DataView
     * @param {UTDSChunk} trackChunk 읽을 트랙 청크
     * @param {number} valueCount 키 하나의 값 개수. 위치·스케일은 3, 회전은 4(각도 + 축)
     * @returns {UTDSTrack} 키 배열. 헤더가 들어갈 공간이 없으면 빈 배열
     *
     * @ignore
     */
    readTrack(data: DataView, trackChunk: UTDSChunk, valueCount: number): UTDSTrack;
    /**
     * 재질의 한 텍스처 슬롯에 이미지 파일을 내려받아 연결합니다. <br>
     * `readMap`이 만든 자리표시 텍스처의 offset·repeat를 새 텍스처로 옮기고, 반복 래핑·밉맵 필터·색공간(`map`은 그림자 인코딩, 그 외는 `NoColorSpace`)을 설정한 뒤 `material[slotKey]`를 교체합니다.
     * `alphaMap` 슬롯이면 `material.alphaTest`를 0.5로 둡니다. 경로는 `resourcePath`(없으면 `path`)를 기준으로 합니다.
     * 이미지 요청이 실패해도 프로미스는 `false`로 **이행**되며, 인자가 부적절하거나 슬롯에 이미 이미지가 있으면 `false`로 거부됩니다.
     *
     * @param {string} name 이미지 파일 이름(3DS MAT_MAPNAME 값)
     * @param {import('three').Material} material 텍스처를 넣을 재질
     * @param {string} [slotKey='map'] 재질의 텍스처 슬롯 이름(`map`, `bumpMap`, `alphaMap`, `specularMap`, `normalMap`)
     * @returns {Promise<boolean>} 연결 성공이면 `true`, 요청 실패면 `false`로 이행. 전제조건 위반이면 `false`로 거부
     *
     * @ignore
     */
    loadTexture(name: string, material: three.Material, slotKey?: string): Promise<boolean>;
    /**
     * Chunk에서 정점·면·UV·MESH_MATRIX를 읽어 원본 UMesh 하나를 반환합니다. 재질별 분할 메시 목록은 _meshParts에 보관하며, 행렬과 좌표 보정은 모든 분할 메시에도 적용합니다.
     *
     * @override
     *
     * @param {import('@union3d/lib/three/loaders/TDSLoader').Chunk} chunk 읽을 청크. 커서는 본문 시작을 가리킵니다
     * @returns {import('@UMesh').UMesh} 원본 메시. 재질별 분할 메시는 readNamedObject()에서 함께 등록합니다
     *
     * @ignore
     */
    override readMesh(chunk: Chunk): UMesh;
    /**
     * 원본 지오메트리에서 주어진 정점 인덱스에 해당하는 정점·UV만 복사한 새 지오메트리를 만듭니다. 재질 그룹별 mesh 분할에 사용됩니다.
     * 인덱스 순서대로 정점을 펼쳐 담으므로 결과 지오메트리의 인덱스는 0부터 순번이 됩니다. 원본은 바꾸지 않습니다.
     *
     * @param {import('three').BufferGeometry} refgeometry 원본 지오메트리(`position`, 선택적으로 `uv` 속성 필요)
     * @param {Array<number>} refindice 복사할 정점 인덱스 목록(면 하나당 3개)
     * @returns {import('three').BufferGeometry | undefined} 새 지오메트리. 인자가 없으면 `undefined`
     *
     * @ignore
     */
    makeGeometryFromIndice(refgeometry: three.BufferGeometry, refindice: Array<number>): three.BufferGeometry | undefined;
    /**
     * 현재 읽기 위치에서 청크 헤더(ID 2바이트 + 크기 4바이트)를 읽어 청크 커서를 만듭니다. 읽기 위치는 헤더 직후(본문 시작)로 6바이트 전진합니다.
     * 파일 끝이라 헤더를 읽을 수 없으면 `null`을 돌려줍니다. 크기 값의 유효성은 검사하지 않으므로 호출자가 `size < 6`을 확인해야 합니다.
     *
     * @param {DataView} data 파일 전체를 감싼 DataView
     * @returns {UTDSChunk | null} 새 청크 커서. 파일 끝이면 `null`
     *
     * @ignore
     */
    readChunk(data: DataView): UTDSChunk | null;
    /**
     * 모든 값이 0인 빈 청크 커서를 만듭니다. 현재 파싱 흐름에서는 사용되지 않습니다.
     *
     * @returns {UTDSChunk} 새 빈 청크 커서
     *
     * @ignore
     */
    newChunk(): UTDSChunk;
    /**
     * 읽기 위치를 주어진 청크의 끝으로 옮겨 남은 본문·하위 청크를 건너뜁니다.
     *
     * @param {UTDSChunk} chunk 건너뛸 청크
     *
     * @ignore
     */
    endChunk(chunk: UTDSChunk): void;
    /**
     * 부모 청크 안의 다음 하위 청크 헤더를 읽고 그 ID를 돌려줍니다. 부모의 커서(`cur`)는 하위 청크 끝으로 전진하고 읽기 위치는 하위 청크 본문 시작에 놓입니다.
     * 부모 범위를 다 읽었거나 헤더가 손상(크기 6 미만)되었으면 0을 돌려 `while (next !== 0)` 순회를 끝냅니다.
     * 본문 대신 청크 전체를 다시 읽어야 하는 하위 함수에 넘길 때는 먼저 `resetPosition()`으로 헤더 시작까지 되돌리십시오.
     *
     * @param {DataView} data 파일 전체를 감싼 DataView
     * @param {UTDSChunk} chunk 순회 중인 부모 청크. `cur`가 갱신됩니다
     * @returns {number} 다음 하위 청크의 ID. 더 없거나 손상되면 0
     *
     * @ignore
     */
    nextChunk(data: DataView, chunk: UTDSChunk): number;
    /**
     * 키프레임 전용 DataView 파서의 읽기 위치를 청크 헤더 길이인 6바이트만큼 되돌립니다.
     *
     * @ignore
     */
    resetPosition(): void;
    /**
     * 읽기 위치를 주어진 바이트만큼 앞으로 건너뜁니다.
     *
     * @param {number} length 건너뛸 바이트 수
     *
     * @ignore
     */
    skipPosition(length: number): void;
    /**
     * 부호 없는 8비트 정수 1바이트를 읽습니다. 현재 읽기 위치에서 리틀 엔디언으로 읽고 위치를 그만큼 전진시킵니다.
     *
     * @param {DataView} data 파일 전체를 감싼 DataView
     * @returns {number} 0~255 정수
     *
     * @ignore
     */
    readByte(data: DataView): number;
    /**
     * 32비트 부동소수(4바이트)를 읽습니다. 현재 읽기 위치에서 리틀 엔디언으로 읽고 위치를 그만큼 전진시킵니다.
     *
     * @param {DataView} data 파일 전체를 감싼 DataView
     * @returns {number} 읽은 실수 값
     *
     * @ignore
     */
    readFloat(data: DataView): number;
    /**
     * 부호 있는 32비트 정수(4바이트)를 읽습니다. 현재 읽기 위치에서 리틀 엔디언으로 읽고 위치를 그만큼 전진시킵니다.
     *
     * @param {DataView} data 파일 전체를 감싼 DataView
     * @returns {number} 읽은 정수 값
     *
     * @ignore
     */
    readInt(data: DataView): number;
    /**
     * 부호 있는 16비트 정수(2바이트)를 읽습니다. 노드 ID·부모 ID처럼 `-1`이 올 수 있는 값에 사용합니다. 현재 읽기 위치에서 리틀 엔디언으로 읽고 위치를 그만큼 전진시킵니다.
     *
     * @param {DataView} data 파일 전체를 감싼 DataView
     * @returns {number} -32768~32767 정수
     *
     * @ignore
     */
    readShort(data: DataView): number;
    /**
     * 부호 없는 32비트 정수(4바이트, 3DS의 DWORD)를 읽습니다. 청크 크기·키 개수·프레임 번호에 사용합니다. 현재 읽기 위치에서 리틀 엔디언으로 읽고 위치를 그만큼 전진시킵니다.
     *
     * @param {DataView} data 파일 전체를 감싼 DataView
     * @returns {number} 0 이상 정수
     *
     * @ignore
     */
    readDWord(data: DataView): number;
    /**
     * 부호 없는 16비트 정수(2바이트, 3DS의 WORD)를 읽습니다. 청크 ID·정점 개수·면 인덱스에 사용합니다. 현재 읽기 위치에서 리틀 엔디언으로 읽고 위치를 그만큼 전진시킵니다.
     *
     * @param {DataView} data 파일 전체를 감싼 DataView
     * @returns {number} 0~65535 정수
     *
     * @ignore
     */
    readWord(data: DataView): number;
    /**
     * NUL(0)로 끝나는 문자열을 읽습니다. NUL을 만나면 그 바이트까지 소비하고 멈추며, `maxLength`바이트 안에 NUL이 없으면 그만큼만 읽습니다.
     * 각 바이트를 문자 코드로 그대로 변환하므로 ASCII 이름을 전제로 합니다.
     *
     * @param {DataView} data 파일 전체를 감싼 DataView
     * @param {number} maxLength 최대로 읽을 바이트 수(NUL 포함)
     * @returns {string} 읽은 문자열(NUL 제외)
     *
     * @ignore
     */
    readString(data: DataView, maxLength: number): string;
    /**
     * 3DS 파일을 찾을 기준 경로를 지정합니다. `load(url)`은 이 경로에 `url`을 이어 붙여 요청하며, `setResourcePath()`가 없으면 텍스처도 이 경로에서 찾습니다.
     *
     * @override
     *
     * @param {string} path 기준 경로. 디렉터리 구분자로 끝나는 URL 또는 경로
     * @returns {this} 체이닝을 위한 로더 자신
     */
    override setPath(path: string): this;
    /**
     * 텍스처 이미지를 찾을 기준 경로를 지정합니다. 지정하면 `loadTexture`가 `setPath()` 경로 대신 이 경로를 사용합니다.
     *
     * @override
     *
     * @param {string} resourcePath 텍스처 기준 경로. 디렉터리 구분자로 끝나는 URL 또는 경로
     * @returns {this} 체이닝을 위한 로더 자신
     */
    override setResourcePath(resourcePath: string): this;
    /**
     * 텍스처 이미지 요청에 사용할 CORS 설정을 지정합니다. `TextureLoader.setCrossOrigin`에 그대로 전달됩니다.
     *
     * @override
     *
     * @param {string} crossOrigin `'anonymous'` 또는 `'use-credentials'`
     * @returns {this} 체이닝을 위한 로더 자신
     */
    override setCrossOrigin(crossOrigin: string): this;
    /**
     * `debug` 프로퍼티가 `true`일 때만 메시지를 `console.log`로 출력합니다. 파싱 중 청크 이름과 값 추적에 사용합니다.
     *
     * @override
     *
     * @param {string | undefined} message 출력할 메시지. 알 수 없는 청크 ID면 `undefined`가 올 수 있습니다
     *
     * @ignore
     */
    override debugMessage(message: string | undefined): void;
    /**
     * 외부 메타데이터(JSON)의 위치 오프셋을 mesh에 적용합니다. 결과 그룹의 `_updateMetaDataFn.update`로 노출되어 모델 레이어가 mesh마다 호출합니다. <br>
     * 호출 전 레이어가 로더에 `_metaDataObject`(파싱된 메타데이터 JSON), `_fileName`, `_useOffset`을 넣어 두어야 하며, 없으면 예외를 잡아 콘솔에 남기고 아무것도 바꾸지 않습니다.
     * mesh의 재질 이름(`_uMemoryMaterialName` 또는 `material.name`)으로 `files[파일명].objects[재질명]` 항목을 찾아 `mesh._metaDataObject`에 넣고,
     * 파일·그룹·객체 단계의 `position_offset`(또는 `layer._positionOffsetName`)을 모두 더한 값을 원래 위치(`mesh._oriPosition`, 첫 호출 때 보관)에 더해 `mesh.position`을 설정합니다.
     * `_useOffset`이 거짓이거나 오프셋 항목이 하나도 없으면 위치를 바꾸지 않습니다. `group._groupMetaData`에는 파일 메타데이터가 기록됩니다.
     *
     * @param {import('@UMesh').UMesh} mesh 오프셋을 적용할 mesh. `THREE.Mesh`가 아니거나 지오메트리·재질 이름이 없으면 무시
     * @param {import('@union3d/3dLayer/U3dModelBasicLayer').U3dModelBasicLayer} layer 호출한 모델 레이어. `_metaDataObject`, `_positionOffsetName`을 읽습니다
     */
    updateMetaData(mesh: UMesh, layer: U3dModelBasicLayer): void;
}

/**
 * 3DS keyframe 데이터(KFDATA)의 객체 노드(OBJECT_NODE_TAG) 하나를 담는 내부 컨테이너입니다.
 * `readObjectNode`가 채우고 `UTDSLoader#nodes`에 객체 이름을 키로 보관합니다. 값은 모두 3DS 원좌표(Z-up)이며
 * 트랙이 없는 항목은 `InvalidValue`(-9999)로 남습니다. 외부에는 `serializeNode`가 만든 `UTDSNodeInfo` 형태로 전달됩니다.
 *
 * @ignore
 */
declare class UTDSNode {
    _nodeID: number;
    _instanceName: string;
    _objectName: string;
    _hierarchyValue: number;
    _posX: number;
    _posY: number;
    _posZ: number;
    _rotAxisX: number;
    _rotAxisY: number;
    _rotAxisZ: number;
    _rotRadian: number;
    _scaleX: number;
    _scaleY: number;
    _scaleZ: number;
    _pivot: three.Vector3;
    _positionTrack: any[];
    _rotationTrack: any[];
    _scaleTrack: any[];
    _children: any[];
    _userData: {};
    _extent: any[];
}

/**
     * `UTDSLoader` 생성 옵션입니다. 3DS 파일을 어떤 좌표 해석·재질·텍스처 정책으로 읽을지 정합니다.
     * 모든 속성이 선택이지만 옵션 객체 자체는 반드시 전달해야 합니다(내부에서 `opt.drawarg`를 바로 읽습니다).
     */
    type UTDSLoaderCO = {
        /**
         * 좌표 해석 방식 표식. 현재 구현은 값을 보관만 하며 파싱 동작을 바꾸지 않습니다.
         */
        loadtype?: string;
        /**
         * `true`면 재질이 참조하는 텍스처 이미지를 파싱 후 비동기로 내려받아 재질에 연결합니다. `false`면 이미지 없이 색상만 적용합니다.
         */
        needtexture?: boolean;
        /**
         * 텍스처 연결 뒤 화면을 갱신할 렌더 컨텍스트. 생략하면 갱신 호출을 건너뜁니다.
         */
        drawarg?: UDrawArg;
        /**
         * 재질의 렌더 면. 3DS 재질 청크마다 복제되는 기본 재질에 적용되며, 파일에 양면 플래그(`MAT_TWO_SIDE`)가 있으면 `DoubleSide`로 덮어씁니다.
         */
        side?: three.Side;
        /**
         * 지정하면 파일의 재질 색상을 무시하고 모든 재질을 이 색으로 통일합니다.
         */
        color?: ColorLike;
        /**
         * `true`면 외부 XML 메타데이터로 위치를 배치할 것으로 보고 원점 중앙화(월드 좌표 지오메트리를 원점으로 옮기는 처리)를 생략합니다. `false`면 좌표 절댓값이 10000을 넘는 지오메트리를 원점 기준으로 옮깁니다.
         */
        needXml?: boolean;
    };

/**
     * 3DS 파일의 청크 하나를 가리키는 읽기 커서입니다. 3DS 파일은 `id(2바이트) + size(4바이트)` 헤더와 본문으로 이루어진 청크가 중첩된 트리 구조이며,
     * 이 객체는 파일(ArrayBuffer) 안에서 한 청크의 바이트 위치를 나타냅니다. 모든 위치는 파일 시작 기준 바이트 오프셋입니다.
     */
    type UTDSChunk = {
        /**
         * 청크 종류 코드(예: `0x4160` MESH_MATRIX, `0xB020` POS_TRACK_TAG)
         */
        id: number;
        /**
         * 헤더 6바이트를 포함한 청크 전체 길이(바이트)
         */
        size: number;
        /**
         * 아직 읽지 않은 하위 청크의 시작 위치. 헤더 직후에서 시작하며 하위 청크를 읽을 때마다 전진합니다
         */
        cur: number;
        /**
         * 청크가 끝나는 위치(다음 형제 청크의 시작)
         */
        end: number;
    };

/**
     * keyframe 트랙(POS/ROT/SCL_TRACK_TAG)의 키 하나입니다. 3DS 원좌표(Z-up, 축 교환 없음)를 그대로 담습니다.
     */
    type UTDSTrackKey = {
        /**
         * 키가 놓인 애니메이션 프레임 번호(0부터)
         */
        frame: number;
        /**
         * 어떤 스플라인 보간 값이 함께 기록됐는지 나타내는 비트 플래그(0x01 tension, 0x02 continuity, 0x04 bias, 0x08 easeTo, 0x10 easeFrom)
         */
        splineFlags: number;
        /**
         * `splineFlags`에 켜진 항목만 담긴 보간 값
         */
        spline: Partial<{
            tension: number;
            continuity: number;
            bias: number;
            easeTo: number;
            easeFrom: number;
        }>;
        /**
         * 키 값. 위치·스케일 트랙은 `[x, y, z]`, 회전 트랙은 `[각도(라디안), 축x, 축y, 축z]` 순서입니다
         */
        values: Array<number>;
    };

/**
     * keyframe 트랙 전체입니다. 키 배열에 트랙 헤더 정보가 프로퍼티로 함께 붙어 있습니다.
     * `JSON.stringify`로 직렬화하면 배열 요소만 남고 `trackFlags`·`unknown`은 사라집니다.
     */
    type UTDSTrack = Array<UTDSTrackKey> & Partial<{
        trackFlags: number;
        unknown: Array<number>;
    }>;

/**
     * keyframe 노드(OBJECT_NODE_TAG) 하나를 직렬화한 정보입니다. `UTDSLoader#serializeNode`가 만들며
     * 결과 그룹의 `userData.tdsNodes`와 각 mesh의 `userData.tds.node`에 담깁니다.
     * 위치·회전·스케일은 첫 키(프레임 0)의 값이며, 해당 트랙이 없으면 `-9999`가 들어갑니다.
     */
    type UTDSNodeInfo = {
        /**
         * 노드 ID(NODE_ID). 없으면 `-9999`
         */
        id: number;
        /**
         * 부모 노드 ID(NODE_HDR의 hierarchy 값). 최상위 노드는 `-1`, 헤더가 없으면 `-9999`
         */
        parentId: number;
        /**
         * 노드가 가리키는 mesh 객체 이름(NAMED_OBJECT 이름과 일치)
         */
        objectName: string;
        /**
         * 인스턴스 이름(INSTANCE_NAME). 없으면 빈 문자열
         */
        instanceName: string;
        /**
         * 회전·스케일의 기준점 `[x, y, z]`. 객체 로컬 좌표이며 지오메트리는 이 점이 원점이 되도록 이동된 뒤 transform이 적용됩니다
         */
        pivot: Array<number>;
        /**
         * 프레임 0의 위치 `[x, y, z]`(3DS 원좌표)
         */
        position: Array<number>;
        /**
         * 프레임 0의 회전. `angle`은 라디안, `axis`는 회전축 `[x, y, z]`(길이 0이면 회전 없음)
         */
        rotation: {
            angle: number;
            axis: Array<number>;
        };
        /**
         * 프레임 0의 축별 배율 `[x, y, z]`
         */
        scale: Array<number>;
        /**
         * 위치 트랙 전체
         */
        positionTrack: UTDSTrack;
        /**
         * 회전 트랙 전체
         */
        rotationTrack: UTDSTrack;
        /**
         * 스케일 트랙 전체
         */
        scaleTrack: UTDSTrack;
    };

/**
     * 하나의 재질 그룹(MSH_MAT_GROUP)이 담당하는 면 목록입니다. 상속된 `UTDSLoader#readMaterialGroup`이 반환합니다.
     */
    type UTDSMaterialGroup = {
        /**
         * 재질 이름. `UTDSLoader#materials`의 키와 같습니다
         */
        name: string;
        /**
         * 이 재질로 그릴 면 번호. `readFaceArray()`가 전체 면 배열을 참조해 정점 인덱스로 변환합니다
         */
        index: Array<number>;
    };

export type { UTDSChunk, UTDSLoader, UTDSLoaderCO, UTDSMaterialGroup, UTDSNode, UTDSNodeInfo, UTDSTrack, UTDSTrackKey };
