// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayer } from "./U3dModelLayer.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { I3FTile } from "../i3f/I3FTile.js";

/**
 * @memberOf GeOnDT.model
 * @summary `I3F 모델` 레이어 클래스
 * @classdesc `I3F 모델` 레이어 클래스
 * @param opt I3F 모델 레이어 생성 옵션
 * @param opt.baseurl I3F 모델 기본 URL
 * @param {number} [opt.limitdistance=220] 카메라 위치를 기반으로 모델 검색시 제한 범위
 * @param {number} [opt.searchoffestz=-200] 카메라 위치를 기반으로 모델 검색시 제한 높이 범위
 * @param {boolean} [opt.usebox=false] 모델 범위 Box 객체 가시화 여부
 * @param {number} [opt.minlevel=15] 레이어 최소 레벨
 * @param {number} [opt.maxlevel=17] 레이어 최대 레벨
 * @param {number} [opt._mindatalevel=17] 레이어 최소 데이터 레벨
 * @param {number} [opt.maxdatalevel=17] 레이어 최대 데이터 레벨
 * @param {string} [opt.modelDetail="high"] 모델의 표면 재질 해상도를 결정하는 옵션 ( "high" / "low" )
 * @param {string} [opt.proxyurl='./proxy.jsp?url='] 프록시 URL
 * @param {boolean} [opt.useproxy=true] 프록시 사용 여부
 * @param {string} [opt.typedeletemesh=immediate] 모델 삭제 방식 설정 ( "default" / "immediate" )
 * @param {boolean} [opt.needXml=true] xml 사용 여부
 * @param {function} [opt.metaDataFunction=undefined] I3F 모델 메타데이터를 load하는 함수
 *
 * @constructor
 * @extends {U3dModelLayer}
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/i3fModel.html}
 */
declare class U3dModelI3FLayer extends U3dModelLayer {
    static g_TaskProcessor: any;
    constructor(opt?: {});
    _limitDistance: any;
    _searchOffsetZ: any;
    _useBox: any;
    _materials: {};
    _mindatalevel: any;
    _maxdatalevel: any;
    _modelDetail: any;
    _modelMaterial: typeof three.MeshLambertMaterial | typeof three.MeshStandardMaterial;
    _fixColor: any;
    _proxyurl: any;
    _useproxy: any;
    _typeDeleteMesh: any;
    _needXml: any;
    _url: any;
    _rootItem: any;
    _objects: {};
    _stateObjects: {};
    _useGlobalMaterial: any;
    metaDataFunction: any;
    _prevCamPosition: three.Vector3;
    _checkTime: any;
    _items: any[];
    _rBush: {
        toBBox(i3fTile: I3FTile): {
            minX: number;
            minY: number;
            maxX: number;
            maxY: number;
        };
        compareMinX(a: I3FTile, b: I3FTile): number;
        compareMinY(a: I3FTile, b: I3FTile): number;
        _maxEntries: number;
        _minEntries: number;
        all(): any;
        search(bbox: any): any[];
        collides(bbox: any): boolean;
        load(data: any): /*elided*/ any;
        data: any;
        insert(item: any): /*elided*/ any;
        clear(): /*elided*/ any;
        remove(item: any, equalsFn: any): /*elided*/ any;
        toJSON(): any;
        fromJSON(data: any): /*elided*/ any;
        _all(node: any, result: any): any;
        _build(items: any, left: any, right: any, height: any): {
            children: any;
            height: number;
            leaf: boolean;
            minX: number;
            minY: number;
            maxX: number;
            maxY: number;
        };
        _chooseSubtree(bbox: any, node: any, level: any, path: any): any;
        _insert(item: any, level: any, isNode: any): void;
        _split(insertPath: any, level: any): void;
        _splitRoot(node: any, newNode: any): void;
        _chooseSplitIndex(node: any, m: any, M: any): any;
        _chooseSplitAxis(node: any, m: any, M: any): void;
        _allDistMargin(node: any, m: any, M: any, compare: any): number;
        _adjustParentBBoxes(bbox: any, path: any, level: any): void;
        _condense(path: any): void;
    };
    _manager: three.LoadingManager;
    _loader: any;
    _cancel: any;
    _change: boolean;
    _curPosition: any;
    _deleteMeshes: any;
    _modelUrlMap: {};
    _useMerge: boolean;
    get BaseUrl(): string;
    get ProxyUrl(): any;
    get StateObjects(): {};
    get Objects(): {};
    set MinLevel(value: number);
    get MinLevel(): number;
    set MaxLevel(value: number);
    get MaxLevel(): number;
    set MinDataLevel(value: any);
    get MinDataLevel(): any;
    set MaxDataLevel(value: any);
    get MaxDataLevel(): any;
    set UseGlobalMaterial(value: any);
    get UseGlobalMaterial(): any;
    set loader(value: any);
    get loader(): any;
    set limitDistance(value: any);
    get limitDistance(): any;
    set curPosition(value: any);
    get curPosition(): any;
    set useBox(value: any);
    get useBox(): any;
    set typeDeleteMesh(value: any);
    get typeDeleteMesh(): any;
    set deleteMeshes(value: any);
    get deleteMeshes(): any;
    set fixColor(value: any);
    get fixColor(): any;
    set searchOffsetZ(value: any);
    get searchOffsetZ(): any;
    show(show: any, refresh: any): void;
    clear(): void;
    /**
     * 카메라 주변의 표시 타일을 갱신하고 삭제 정책에 따라 대기 자원을 해제합니다.
     * force는 갱신 간격 검사를 생략하지 않습니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg | undefined} drawArg 검색에 사용할 프레임 인수. 기본값 this._drawArg
     * @param {number} [curTime] 현재 구현에서 사용하지 않는 프레임 시각
     * @param {boolean} [force=false] 이전 카메라 위치 초기화 여부
     */
    override update(drawArg?: UDrawArg | undefined, curTime?: number, force?: boolean): void;
    addQueueByMeshUrl(result: any): void;
    addQueueByParsedMesh(url: any, tile: any, meshes: any): void;
    getBoundingBox(): three.Box3;
    /**
     * 모델 정보를 요청하여 검색용 타일을 구성하고 원본 응답으로 완료합니다.
     * 메시와 텍스처의 로딩 완료를 뜻하지 않습니다.
     *
     * @param {string} url 모델 정보 URL
     * @returns {Promise<object>} 모델 정보 응답의 완료 객체
     */
    getLayerInfo(url: string): Promise<object>;
    /**
     * 표시 대상의 정점을 병합하며 선택에 따라 복제 그룹을 만듭니다.
     *
     * @param {number} tolerance 정점 병합 허용 오차
     * @param {boolean} useClone 별도 복제 그룹 생성 여부
     */
    mergeVertices(tolerance: number, useClone: boolean): void;
    /**
     * 메시의 메타데이터 URL을 비동기로 읽어 callback과 메시 속성에 반영합니다.
     * 요청 준비 중 예외가 발생하면 false를 반환하며 완료를 기다리는 Promise는 반환하지 않습니다.
     *
     * @param {import('@UMesh').UMesh} mesh 메타데이터를 반영할 메시
     * @returns {false | undefined} 요청 준비 실패 여부이며 그 외에는 undefined
     */
    setMetaData(mesh: UMesh): false | undefined;
    #private;
}

export type { U3dModelI3FLayer };
