// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayer, U3dModelLayerCO } from "./U3dModelLayer.js";
import type { U3dVideoLayer } from "./U3dVideoLayer.js";
import type { UBox3 } from "../core/UBox3.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UGroup } from "../core/UGroup.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { GeoPosition, KeyValue, ModelMesh } from "../types/global.js";
import type { DeferredObject } from "../util/deferred.js";

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 * OBJ·3DS·FBX·GLB와 이미지 자료의 로딩·배치를 연결하는 기본 모델 레이어입니다.
 * 형식별 로더 결과를 표시 객체로 반영하며 하위 레이어의 초기화·배치 연결을 지원합니다.
 *
 * @group 3dLayer
 * @extends {U3dModelLayer}
 */
declare class U3dModelBasicLayer extends U3dModelLayer {
    /**
     * 모델 목록과 배치 옵션을 보관하고 부모 모델 그룹을 표시 객체로 공유합니다.
     * XML 사용 여부에 따라 배치 정보의 초기화 시점이 달라집니다.
     *
     * @param {Partial<U3dModelBasicLayerCO>} [opt={}] 모델 목록·주소와 XML·배치 설정
     */
    constructor(opt?: Partial<U3dModelBasicLayerCO>);
    /**@type{number}*/
    _defaultHeight: number;
    /**@type{import('three').Vector3}*/
    _averagePos: three.Vector3;
    /**@type{boolean}*/
    _setAveragePosition: boolean;
    /**@type{{
     * metadata: object
     * files: Array<any>
     * }}*/
    _metaDataObject: {
        metadata: object;
        files: Array<any>;
    };
    /**@type{import('three').AnimationMixer}*/
    _mixer: three.AnimationMixer;
    /** @type {boolean} */
    _isLoaded: boolean;
    _objectCenter: three.Vector3;
    _isGroup: boolean;
    _hasVideoTexture: boolean;
    _object: ModelObject3D;
    _drawObject: UGroup;
    /**@type {Array<ModelObject3D>} */
    _objectList: Array<ModelObject3D>;
    _center: three.Vector3;
    /**@type {Array<string>} */
    _xmlList: Array<string>;
    _color: any;
    _side: any;
    _drawLine: any;
    _needTexture: any;
    _needXml: any;
    _listModel: any;
    _path: any;
    _useLOD: any;
    _yUp: any;
    _srs: any;
    _title: any;
    _height: any;
    _useU3f: any;
    _u3fUrl: any;
    _xmlUrl: any;
    /**@type {Array<import('@union3d/3dLayer/U3dVideoLayer').U3dVideoLayer>} */
    _videoLayer: Array<U3dVideoLayer>;
    _containMetaData: any;
    _usePositionOffset: any;
    modelType: {
        OBJ: string;
        TDS: string;
        DAE: string;
        U3F: string;
        FBX: string;
        JPG: string;
        PNG: string;
        GLB: string;
        GLTF: string;
        UMESH: string;
    };
    _printSprite: any;
    /**
     * 현재 모델 목록을 다시 로드하고 완료 객체를 반환합니다.
     * 기존 공개 선언은 문자열 결과이지만 현재 성공 경로는 값을 전달하지 않습니다.
     *
     * @returns {Promise<string>}
     */
    reLoad(): Promise<string>;
    /**
     * U3F 자료로 표시 객체를 구성하고 레이어 배치 설정을 적용합니다.
     * 텍스처 요청은 별도로 진행하며 그 완료를 기다리지 않습니다. 일부 로드 실패는 로그만 남깁니다.
     *
     * @returns {Promise<boolean>}
     */
    initializeU3f(): Promise<boolean>;
    /**
     * 이 레이어는 타일별 생성 작업을 하지 않으므로 true를 반환합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일. 이 레이어는 사용하지 않습니다.
     * @returns {boolean} 항상 true
     */
    override createModel(tile: U3dQuadTile): boolean;
    /**
     * XML의 파일 목록과 배치 정보를 현재 레이어에 반영합니다.
     * 기존 목록에 파일을 추가하며 필요한 XML 노드가 없을 때 별도로 복구하지 않습니다.
     *
     * @param {XMLHttpRequest} xml xml 문서
     */
    parseXML(xml: XMLHttpRequest): void;
    _scale: {
        x: number;
        y: number;
        z: number;
    };
    _geoLocation: {
        x: number;
        y: number;
        z: number;
    };
    _location: {
        x: number;
        y: number;
        z: number;
    };
    _rotation: {
        x: number;
        y: number;
        z: number;
    };
    _bbox3D: UBox3;
    /**
     * 타일 그룹의 직계 자식을 부모 지형의 교차 높이에 맞춥니다.
     * 그룹의 높이 처리 표시가 정의되어 있으면 다시 처리하지 않습니다.
     *
     * @param {KeyValue} tile 고도 타일 (_mesh 등 내부 구조 접근)
     * @param {KeyValue} parent 부모 타일 (_group / _parent 접근)
     * @param {import('@UDrawArg').UDrawArg} drawArg
     *
     * @ignore
     */
    updateHeightTile(tile: KeyValue, parent: KeyValue, drawArg: UDrawArg): void;
    /**
     * 이 기반 구현에서는 고도를 변경하지 않고 false를 반환합니다.
     *
     * @override
     *
     */
    override updateHeight(): boolean;
    /**
     * 이 기반 구현에서는 상세 고도를 변경하지 않고 false를 반환합니다.
     */
    updateHeightDetail(): boolean;
    /**
     * 현재 표시 객체와 자손의 경계를 새 상자에 계산하여 반환합니다.
     *
     * @returns {import('three').Box3} 바운딩박스 객체
     */
    getBoundingBox(): three.Box3;
    /**
     * 이름과 선택한 기준 주소에 맞는 모델 정보가 등록되어 있는지 확인합니다.
     *
     * @param {string} name 모델 이름
     * @param {string} [baseurl] 모델 url, 미입력 시 name 만으로 검색
     * @returns {boolean} 모델 레이어 중복 여부
     */
    checkIsExistModel(name: string, baseurl?: string): boolean;
    /**
     * 현재 목록에서 이름과 선택한 기준 주소가 일치하는 첫 모델 정보를 반환합니다.
     * 복사하지 않은 목록 항목이며, 기준 주소가 falsy이면 이름만 비교합니다.
     *
     * @param {string} name 모델 이름
     * @param {string} [baseurl] 모델 url, 미입력 시 name 만으로 검색
     * @returns {ModelInfo | undefined} 등록된 모델 정보
     */
    getModelInfo(name: string, baseurl?: string): ModelInfo | undefined;
    /**
     * 파일 확장자로 로더를 선택하고 형식별 후처리 결과를 전달합니다.
     * 입력 항목을 목록과 공유하고 파일 이름·완료 인터페이스를 보완할 수 있습니다.
     * 성공 결과와 실패 전달은 형식별 기존 계약을 따릅니다. 모든 오류가 반환 객체의 거부로 전달되지는 않습니다.
     * GLB의 로더 실패와 장면 후처리 예외는 반환 객체 및 모델의 실패 콜백에 전달합니다.
     *
     * @param {ModelInfo} model 모델 데이터
     * @param {string} [textureUrl=undefined] 텍스처 URL
     * @returns {Promise<ModelObject3D>} promise 함수. 작업 성공 시 Load한 3D Object들을 반환한다.
     */
    load(model: ModelInfo, textureUrl?: string): Promise<ModelObject3D>;
    /**
     * 모델 자료를 요청하고 파서와 공유하는 완료 객체를 반환합니다.
     * 기존 초기화 경로가 반환 객체의 resolve/reject도 사용하므로 완료 제어 인터페이스를 유지합니다.
     * 입력 타입과 달리 요청 구현은 model.baseurl을 직접 읽습니다.
     *
     * @param {ModelInfo | KeyValue | string | undefined} model U3F 모델 파라미터
     * @param {string} baseurl U3F 모델 URL
     * @returns {DeferredObject<any>} promise 함수. 작업 성공 시 Load한 U3F 3D Object 배열을 반환한다.
     */
    getU3FInfo(model: ModelInfo | KeyValue | string | undefined, baseurl: string): DeferredObject<any>;
    /**
     * 텍스처를 요청하여 완료 결과를 반환합니다.
     * 기존 동작상 로드 오류뿐 아니라 진행 콜백이 호출되어도 거부합니다.
     *
     * @param {string} url 텍스처 URL
     * @returns {Promise<import('three').Texture>} promise 함수. 작업 성공 시 Load한 텍스처를 반환.
     */
    getTexture(url: string): Promise<three.Texture>;
    /**
     * 현재 표시 객체의 경계 중심을 내부 재사용 벡터에 기록하고 같은 참조를 반환합니다.
     *
     * @returns {import('three').Vector3}  Object의 가운데점 좌표
     */
    getObjectCenter(): three.Vector3;
    /**
     * 표시 객체의 자원을 해제하고 장면에서 분리한 뒤 부모의 처분 결과를 반환합니다.
     *
     * @override
     *
     */
    override dispose(): any;
    /**
     * 모델 로딩이 완료되었으면 메타데이터와 고도 레이어에 맞춰 높이를 갱신합니다.
     *
     * @override
     *
     */
    override update(): void;
    /**
     * 편집 모드에서는 위치를 유지하고 그 외에는 고도 레이어 상태에 맞춰 높이를 반영합니다.
     * 계산한 Z가 현재 값과 다를 때만 객체를 변경하고 수동 갱신을 알립니다.
     */
    updateHeightByMetadata(): void;
    /**
     * 앱과 장면이 연결되어 있으면 표시 객체를 추가하거나 분리합니다.
     * 기즈모 UI를 정리한 뒤 부모의 표시 상태를 반영하며 부모 반환값은 전달하지 않습니다.
     *
     * @override
     *
     * @param {boolean} show true이면 표시, false이면 장면에서 분리
     */
    override show(show: boolean): void;
    /**
     * 현재 표시 객체를 장면에서 빼고 전달된 객체 참조로 교체합니다.
     * 기존 객체를 dispose하지 않으므로 자원 소유권은 호출 경로에서 관리해야 합니다.
     *
     * @param {ModelObject3D} object 되돌리기에 사용할 원본 객체 참조
     */
    editUndo(object: ModelObject3D): void;
    /**
     * 이름이 일치하는 메시의 재질 alphaTest로 표시 여부를 설정합니다.
     * Object3D.visible은 변경하지 않습니다.
     *
     * @param {string} name 모델 이름
     * @param {boolean} visible 가시화 설정 변수. show면 true, hide면 false를 넣는다.
     */
    setVisibleByName(name: string, visible: boolean): void;
    /**
     * XY 경계와 선택한 Z 경계로 새 3D 상자를 만듭니다.
     * Z 경계가 null 또는 undefined이면 0을 사용합니다.
     *
     * @param {BoundingBox2D} googleBox GoogleBox
     * @returns {import('@union3d/core/UBox3').UBox3} 3DBox
     */
    get3DBoxFromGoogleBox(googleBox: BoundingBox2D): UBox3;
    /**
     * 부모 메타데이터에 파일 형식과 목록·주소 설정을 추가하여 반환합니다.
     *
     * @override
     *
     * @returns {any} 메타데이터
     *
     * @ignore
     */
    override getMetaData(): any;
    /**
     * 메시에 연결된 파일·그룹·객체 메타데이터를 조회합니다. <br>
     * 그룹이 없으면 false이고, 그룹은 있으나 객체별 메타데이터가 없으면 `meshMetaData`가 undefined인 결과를 돌려줍니다. <br>
     * 메타데이터를 쓰지 않거나 조회 조건이 맞지 않거나 처리 중 실패하면 undefined입니다.
     *
     * @param {ModelMesh} obj 메타데이터를 조회할 메시
     * @returns {U3dModelBasicMeshMetaData | false | undefined} 파일·그룹·객체별 조회 결과, 그룹 부재 시 false, 조회 불가 시 undefined
     */
    getMeshMetaData(obj: ModelMesh): U3dModelBasicMeshMetaData | false | undefined;
    /**
     * 스킨과 공유 자원 연결을 처리하는 복제 함수에 모델을 전달합니다.
     *
     * @param {ModelMesh} source 복제할 원본 모델
     * @returns {any} 기존 복제 함수가 반환한 객체
     */
    skClone(source: ModelMesh): any;
    /**
     * 표시 대상 메시의 정점을 병합하고 선택에 따라 별도 복제 그룹을 만듭니다.
     * 복제 모드에서는 원본 재질을 숨깁니다. 기존 병합 그룹은 자원 해제 후 장면에서 제거합니다.
     *
     * @param {number} tolerance 정점 병합 허용 오차
     * @param {boolean} useClone 별도 복제 그룹을 만들어 표시할지 여부
     */
    mergeVertices(tolerance: number, useClone: boolean): void;
}

/**
     * 2D 경계 영역 (2D AABB BoundingBox)
     */
    type BoundingBox2D = {
        /**
         * X 최솟값
         */
        minx: number;
        /**
         * Y 최솟값
         */
        miny: number;
        /**
         * Z 최솟값
         */
        minz?: number;
        /**
         * X 최댓값
         */
        maxx: number;
        /**
         * Y 최댓값
         */
        maxy: number;
        /**
         * Z 최댓값
         */
        maxz?: number;
    };

/**
     * 서버에서 다운로드 할 모델 정보
     */
    type ModelInfo = {
        /**
         * 모델 이름 (사용자 정의)
         */
        name: string;
        /**
         * 모델 데이터 경로
         */
        baseurl: string;
        /**
         * 모델 데이터 이름 (파일 이름)
         */
        fileName: string;
        /**
         * 모델 데이터 형식
         */
        ext: string;
        /**
         * 형식별 로드 결과를 받는 콜백
         */
        resolve?: (value: unknown) => void;
        /**
         * 실패 이유를 받는 콜백
         */
        reject?: (arg0: unknown | undefined) => void;
    };

/**
     * ~extends U3dModelLayerCO <br>
     * U3dModelBasicLayer 생성자 옵션
     */
    type U3dModelBasicLayerCO_Content = {
        /**
         * 레이어 이름
         */
        name: string;
        /**
         * 모델 데이터(3DS,OBJ,FBX,GLB 등)를 받아올 요청 URL
         */
        baseUrl?: string;
        /**
         * 레이어 제목 <hidden>
         */
        title?: string;
        /**
         * 레이어의 노드 ID <hidden>
         */
        node?: number;
        /**
         * 레이어의 색상 <hidden>
         */
        color?: string;
        /**
         * 기본값 DoubleSide
         */
        side?: number;
        /**
         * 레이어 타입
         */
        type?: string;
        /**
         * 레이어 모델 기본 형식
         */
        ext?: string;
        /**
         * 레이어에 올라가는 모델들의 외곽선 생성 여부. true면 생성한다.
         */
        drawLine?: boolean;
        /**
         * 모델 텍스처 출력 여부
         */
        needTexture?: boolean;
        /**
         * xml 사용 여부
         */
        needXml?: boolean;
        /**
         * 서버에서 다운로드할 모델 정보 배열
         */
        listModel?: Array<ModelInfo>;
        /**
         * 레이어의 데이터 경로 정보
         */
        path?: string;
        /**
         * 레이어 LOD 사용 여부
         */
        useLod?: boolean;
        /**
         * 레이어 모델의 Y축 up 여부
         */
        yUp?: boolean;
        /**
         * 레이어 기본 좌표계 <hidden>
         */
        srs?: string;
        /**
         * 레이어 크기값
         */
        scale?: three.Vector3;
        /**
         * 레이어의 위치 좌표 (EPSG:3857)
         */
        location?: string;
        /**
         * 레이어의 위경도 좌표 (EPSG:4326)
         */
        geoLocation?: GeoPosition;
        /**
         * 레이어 회전값
         */
        rotation?: three.Vector3Like;
        /**
         * `2D` 경계 영역 (2D AABB BoundingBox)
         */
        boundingBox?: BoundingBox2D;
        /**
         * 레이어 높이
         */
        height?: number;
        /**
         * U3F모델 사용 여부
         */
        useU3f?: boolean;
        /**
         * xml 요청 URL
         */
        xmlUrl?: string;
        /**
         * 메타 데이터 사용 여부. baseurl + metaData.json 형식의 파일이 있을때 사용.
         */
        containMetaData?: boolean;
        /**
         * `3ds` 사용 시, 좌표 보정 값을 사용할 지 여부 <hidden>
         */
        usePositionOffset?: boolean;
        /**
         * u3f 요청 URL  <hidden>
         */
        u3fUrl?: string;
        /**
         * 복제할 원본 모델 그룹
         */
        object?: UGroup;
        /**
         * PNG를 Sprite로 표시할지 여부 <hidden>
         */
        printSprite?: boolean;
    };

/**
     * ~extends U3dModelLayerCO <br>
     * U3dModelBasicLayer 생성자 옵션
     */
    type U3dModelBasicLayerCO = Omit<Omit<U3dModelLayerCO, never> & U3dModelBasicLayerCO_Content, never>;

/**
     * 모델 3D 오브젝트 (Object3D + 레이어 확장 멤버)
     */
    type ModelObject3D = three.Object3D & Partial<{
        _xml: KeyValue;
        _name: string;
        _ext: string;
        _drawArg: UDrawArg;
        _nodeID: number;
        af: boolean;
        animations: Array<three.AnimationClip>;
        hasGizmo: {
            removeGizmoUI: () => void;
        };
        setManualUpdate: () => void;
    }>;

/**
     * 형식별 로더와 초기화 경로가 공유하는 완료 제어 인터페이스입니다.
     * 성공값은 모델 형식별로 달라 기존 로더 연결의 any 범위를 이 경계에 한정합니다.
     */
    type U3dModelBasicLayerCompletion = {
        /**
         * 형식별 완료값 전달
         */
        resolve: (arg0: any | undefined) => void;
        /**
         * 기존 실패 이유 전달
         */
        reject: (arg0: any | undefined) => void;
    };

/**
     * 파서 결과를 표시 그룹으로 연결하는 데 필요한 레이어 상태와 재질 확장 지점입니다.
     * 레이어 전체 대신 복원 단계가 읽고 호출하는 권한만 표현합니다.
     */
    type U3dModelBasicLayerU3fTarget = Pick<U3dModelBasicLayer, "_classtype" | "_opacity" | "_name" | "_drawLine" | "_object" | "settingModelLayerMaterial">;

/**
     * `getMeshMetaData`가 반환하는 파일·그룹·객체별 메타데이터 묶음입니다. <br>
     * 각 값의 내부 구조는 모델과 함께 배포된 메타데이터 파일이 정합니다. 그룹은 있으나 객체별 메타데이터가 없으면 `meshMetaData`만 undefined입니다.
     */
    type U3dModelBasicMeshMetaData = {
        /**
         * 파일 전체 메타데이터
         */
        fileMetaData: unknown;
        /**
         * 메시가 속한 그룹의 메타데이터
         */
        groupMetaData: unknown;
        /**
         * 메시별 메타데이터. 객체별 항목이 없으면 undefined
         */
        meshMetaData: unknown;
    };

export type { BoundingBox2D, ModelInfo, ModelObject3D, U3dModelBasicLayer, U3dModelBasicLayerCO, U3dModelBasicLayerCO_Content, U3dModelBasicLayerCompletion, U3dModelBasicLayerU3fTarget, U3dModelBasicMeshMetaData };
