// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dBIMControlData, U3dBIMControlFile, U3dBIMControlResponse, U3dBIMFile, U3dBIMLevelEntry, U3dBIMLocation, U3dBIMMesh, U3dBIMMetaNode, U3dBIMMetaRecord, U3dBIMPropertiesEntry, U3dBIMSourceFile, U3dModelBIMObjLayerCO } from "./U3dModelBIMObjLayer.types.js";
import type { U3dModelLayer } from "./U3dModelLayer.js";
import type { UGroup } from "../core/UGroup.js";
import type { GeoPositionVector3 } from "../types/global.types.js";

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 * BIM OBJ 파일의 배치·선택과 메타데이터 및 제어 케이스를 관리합니다.
 *
 * @extends {U3dModelLayer}
 *
 * @ignore
 */
declare class U3dModelBIMObjLayer extends U3dModelLayer {
    /**
     * MTL·OBJ와 메타데이터를 파일별로 관리하는 레이어를 생성합니다. 필수 옵션 누락 시 로그를 남기고 부분 초기화 상태로 종료합니다.
     *
     * @param {Partial<U3dModelBIMObjLayerCO>} [opt] 생성 옵션
     */
    constructor(opt?: Partial<U3dModelBIMObjLayerCO>);
    _useproxy: any;
    _proxyurl: any;
    _name: any;
    _layername: string;
    _metaData: {
        files: Record<string, U3dBIMSourceFile>;
    } & Partial<{
        cases: Array<string>;
    }>;
    _autoHeight: boolean;
    _object: UGroup;
    _getControlUrl: string;
    _setControlUrl: string;
    _serverUrl: string;
    _mergeFileUrlKey: any;
    _mergeFileKey: any;
    _metaFileKey: any;
    /** @type {Record<string, U3dBIMFile>} */
    _files: Record<string, U3dBIMFile>;
    _controlFileUrlList: string[];
    /** @type {Record<string, ControlCase>} */
    _controlCases: Record<string, ControlCase>;
    /**
     * 파일의 모델 경로·병합 파일·위치·경계가 정의되어 있는지 검사합니다. 값의 형식이나 내부 필드까지 검사하지는 않습니다.
     *
     * @param {string} name 이름
     * @param {U3dBIMSourceFile} [metaData] 검사할 원본 파일 정보
     * @returns {boolean} 필수 항목이 모두 정의되어 있는지 여부
     */
    isValidMetaData(name: string, metaData?: U3dBIMSourceFile): boolean;
    /**
     * 전체 객체의 경계를 처음 요청할 때 계산하여 보관합니다. setPosition에서 교체하기 전에는 같은 상자 참조를 반환합니다.
     *
     * @returns {import('three').Box3} 현재 경계 상자
     */
    getBoundingBox(): three.Box3;
    _bbox: three.Box3;
    /**
     * 현재 등록된 파일 이름을 새 배열로 반환합니다.
     *
     * @returns {Array<string>} 등록된 파일 이름
     */
    getFileNames(): Array<string>;
    /**
     * 이름별 제어 케이스 사전의 원본 참조를 반환합니다. 반환값을 수정하면 이후 조회와 저장에도 반영됩니다.
     *
     * @returns {Record<string, ControlCase>} 변경 가능한 케이스 사전
     */
    getControlCases(): Record<string, ControlCase>;
    /**
     * 파일별 배치 높이를 지형에 맞추거나 원본 높이로 되돌립니다. 해당 파일의 객체가 이미 로드되어 있어야 합니다.
     *
     * @param {boolean} autoHeight 지형 고도에 맞출지 여부
     */
    setAutoHeight(autoHeight: boolean): void;
    /**
     * 파일 이름과 일치하는 첫 직계 객체의 위치를 앱의 지리 좌표로 변환합니다. 일치 객체가 없으면 undefined를 반환합니다.
     *
     * @param {string} [fileName] 파일 이름
     * @returns {GeoPositionVector3 | undefined} 지리 좌표 또는 미조회
     */
    getPosition(fileName?: string): GeoPositionVector3 | undefined;
    /**
     * 파일 이름이 일치하는 직계 객체 모두의 위치와 행렬을 갱신합니다. 입력 객체의 문자열 좌표를 숫자로 바꾸며 전체 경계도 다시 계산합니다.
     *
     * @param {string | undefined} fileName 파일 이름
     * @param {U3dBIMLocation} location 적용할 위치; 문자열 성분은 입력 객체에서 숫자로 변경
     */
    setPosition(fileName: string | undefined, location: U3dBIMLocation): void;
    /**
     * 제어 케이스에 저장된 위치 변경값을 조회합니다. 렌더 객체의 현재 위치 조회와는 별개입니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string} [fileName] 파일 이름
     * @returns {U3dBIMLocation | undefined} 저장된 위치 또는 미조회
     */
    getPositionControl(controlCaseName: string, fileName?: string): U3dBIMLocation | undefined;
    /**
     * 제어 케이스의 위치 변경값을 저장합니다. 렌더 객체의 위치를 즉시 변경하지는 않습니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string | undefined} fileName 파일 이름
     * @param {U3dBIMLocation} position 설정할 위치
     * @returns {boolean} 변경 성공 여부
     */
    setPositionControl(controlCaseName: string, fileName: string | undefined, position: U3dBIMLocation): boolean;
    /**
     * 제어 케이스에 객체 ID가 제외 대상으로 등록되어 있는지 조회합니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @returns {boolean | undefined} 제외 여부; 케이스가 없으면 undefined
     */
    isExclusionControl(controlCaseName: string, fileName: string | undefined, objectName: string): boolean | undefined;
    /**
     * 제어 케이스의 제외 ID 배열을 그대로 반환합니다. 배열을 수정하면 케이스 저장 내용도 변경됩니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string} [fileName] 파일 이름
     * @returns {Array<string> | undefined} 제외 목록 또는 미조회
     */
    getExclusionControlList(controlCaseName: string, fileName?: string): Array<string> | undefined;
    /**
     * 제어 케이스의 객체별 시작 레벨 변경값을 조회합니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @returns {number | undefined} 시작 레벨 또는 미조회
     */
    getLevelControl(controlCaseName: string, fileName: string | undefined, objectName: string): number | undefined;
    /**
     * 제어 케이스의 객체별 레벨 변경값을 새 목록으로 반환합니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string} [fileName] 파일 이름
     * @returns {Array<U3dBIMLevelEntry> | undefined} 레벨 변경 목록
     */
    getLevelControlList(controlCaseName: string, fileName?: string): Array<U3dBIMLevelEntry> | undefined;
    /**
     * 저장된 변경 자료에서 대상 메타데이터의 속성 키에 해당하는 값을 반환합니다. 대상 메타데이터가 존재해야 합니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @returns {unknown} 저장된 속성 또는 미조회
     */
    getPropertiesControl(controlCaseName: string, fileName: string | undefined, objectName: string): unknown;
    /**
     * 변경 속성 목록을 대상 메타데이터의 속성 키로 해석하여 반환합니다. 파일과 대상 메타데이터가 존재해야 합니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string} [fileName] 파일 이름
     * @returns {Array<U3dBIMPropertiesEntry> | undefined} 속성 변경 목록
     */
    getPropertiesControlList(controlCaseName: string, fileName?: string): Array<U3dBIMPropertiesEntry> | undefined;
    /**
     * 메타데이터 ID의 제외 설정을 케이스에 저장합니다. 하위 적용이면 자신도 포함하며 개별 설정 결과와 무관하게 true를 반환합니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @param {boolean} [value] 제외 여부; 누락하면 변경하지 않고 false 반환
     * @param {boolean} [isSetChild] 자신과 하위 메타데이터에 함께 적용할지 여부
     * @returns {boolean} 설정 결과
     */
    setExclusionControl(controlCaseName: string, fileName: string | undefined, objectName: string, value?: boolean, isSetChild?: boolean): boolean;
    /**
     * 유한한 숫자로 변환 가능한 레벨을 케이스에 저장합니다. null 또는 undefined는 기존 설정을 삭제하는 의미입니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @param {number | string | null} [value] 설정값; nullish이면 기존 설정 삭제
     * @param {boolean} [isSetChild] 자신과 하위 메타데이터에 함께 적용할지 여부
     * @returns {boolean} 설정 결과
     */
    setLevelControl(controlCaseName: string, fileName: string | undefined, objectName: string, value?: number | string | null, isSetChild?: boolean): boolean;
    /**
     * 속성 변경을 케이스에 저장합니다. 비어 있지 않은 문자열은 JSON 해석 후 메타데이터 export 구조로 감싸고, 빈 문자열은 삭제로 처리합니다.
     *
     * @param {string} controlCaseName 제어 케이스 이름
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @param {unknown} [value] 설정값; nullish이면 기존 설정 삭제
     * @returns {boolean} 설정 결과
     */
    setPropertiesControl(controlCaseName: string, fileName: string | undefined, objectName: string, value?: unknown): boolean;
    /**
     * 파일별 빈 변경 자료로 케이스를 만들고 사전에 등록합니다. 같은 이름이 있으면 로그 후 undefined를 반환합니다. 기존 URL 목록이 비면 새 URL도 빈 문자열입니다.
     *
     * @param {string} [caseName] 제어 케이스 이름
     * @returns {ControlCase | undefined} 생성한 케이스 또는 미생성
     */
    createControlCase(caseName?: string): ControlCase | undefined;
    /**
     * 제어 케이스를 서버에 POST하고 같은 URL을 다시 읽어 사전에 반영합니다. XHR의 status가 200이 아니면 readyState와 무관하게 거부합니다.
     *
     * @param {string} [caseName] 제어 케이스 이름
     * @param {boolean} [useProxy] 저장 요청에 프록시를 사용할지 여부
     * @returns {Promise<void>} 저장과 재조회 완료
     */
    exportControlCase(caseName?: string, useProxy?: boolean): Promise<void>;
    /**
     * 이름에 대응하는 제어 케이스의 원본 참조를 반환합니다.
     *
     * @param {string} name 이름
     * @returns {ControlCase | undefined} 조회한 케이스
     */
    getControlCaseByName(name: string): ControlCase | undefined;
    /**
     * 등록된 파일의 메타데이터 트리를 그대로 반환합니다. 이름이 지정되었지만 파일이 미등록이면 속성 접근 예외가 발생합니다.
     *
     * @param {string} [fileNme] 파일 이름
     * @returns {MetaDataTree | undefined} 파일의 트리
     */
    getMateDataTree(fileNme?: string): MetaDataTree | undefined;
    /**
     * 파일의 객체 사전에서 ID에 대응하는 객체를 조회합니다. 파일이나 사전이 없으면 undefined를 반환합니다.
     *
     * @param {string} [fileName] 파일 이름
     * @param {string} [id] 객체 또는 메타데이터 ID
     * @returns {U3dBIMMesh | undefined} 조회한 객체
     */
    getObjectById(fileName?: string, id?: string): U3dBIMMesh | undefined;
    /**
     * 파일의 메타데이터 사전에서 ID를 조회합니다. 파일이나 트리가 없으면 undefined를 반환합니다.
     *
     * @param {string} [fileName] 파일 이름
     * @param {string} [id] 객체 또는 메타데이터 ID
     * @returns {MetaData | undefined} 조회한 메타데이터
     */
    getMetaById(fileName?: string, id?: string): MetaData | undefined;
    /**
     * 선택한 파일의 메시 재질에 불투명도를 적용하고 최초 값을 보관합니다. 파일 이름을 찾지 못하면 전체 객체에 적용합니다.
     *
     * @override
     *
     * @param {number} opacity 재질 불투명도
     * @param {string} [fileName] 파일 이름
     */
    override setOpacity(opacity: number, fileName?: string): void;
    /**
     * 선택한 파일의 메시 재질을 보관한 불투명도로 복구합니다. 파일 이름을 찾지 못하면 전체 객체에 적용합니다.
     *
     * @override
     *
     * @param {string} [fileName] 파일 이름
     */
    override resetOpacity(fileName?: string): void;
    /**
     * 원본 메타데이터 위치를 다시 적용합니다. 단일 파일을 지정하면 기존 구현대로 배열 키 0을 파일 이름으로 전달합니다.
     *
     * @param {string} [fileName] 파일 이름
     */
    resetPosition(fileName?: string): void;
    /**
     * 파일 내 개별 객체의 표시 여부를 변경합니다. visible을 생략하면 숨김 상태로 설정합니다.
     *
     * @param {string} [fileName] 파일 이름
     * @param {string} [id] 객체 또는 메타데이터 ID
     * @param {boolean} [visible] 객체 표시 여부; 생략하면 숨김
     */
    showObject(fileName?: string, id?: string, visible?: boolean): void;
    /**
     * 메타데이터 자신과 하위 객체의 재질을 복제하여 선택 색상을 적용합니다. opacity 인수와 무관하게 선택 불투명도는 1이며 원본 재질은 clear에서 복구합니다.
     *
     * @param {string} [fileName] 파일 이름
     * @param {string} [id] 객체 또는 메타데이터 ID
     * @param {import('three').ColorRepresentation} [color] 선택 색상; 생략하면 빨강
     * @param {number} [opacity] 기존 인수; 현재 선택 재질에는 항상 1 적용
     */
    select(fileName?: string, id?: string, color?: three.ColorRepresentation, opacity?: number): void;
    /**
     * 선택 재질을 해제하고 원본 재질과 표시 상태를 복구합니다. 선택 재질의 map도 해제하며, 보관한 불투명도는 truthy일 때만 복구합니다.
     */
    clear(): void;
    /**
     * 파일별로 MTL·OBJ·메타데이터·제어 케이스를 순서대로 로드합니다. 파일 목록이 비어 있으면 반환 완료 객체는 대기 상태로 남습니다.
     *
     * @returns {Promise<void>} 파일 목록 로드 완료
     */
    load(): Promise<void>;
    /**
     * 입력 순서에 따라 부모·자식 관계를 구성합니다. 각 입력 항목의 rootName을 변경하며 반환 트리와 노드는 복사본으로 보호되지 않습니다.
     *
     * @param {string} rootName 메타데이터의 루트 이름
     * @param {Array<U3dBIMMetaRecord>} metaList 메타데이터 목록; 각 원본 항목의 rootName을 변경
     * @returns {MetaDataTree | undefined} 생성한 트리 또는 입력 누락
     */
    makeMetaTree(rootName: string, metaList: Array<U3dBIMMetaRecord>): MetaDataTree | undefined;
}

/**
 * 서버로 저장할 파일별 변경 자료를 보관합니다. 반환 자료와 공개 필드는 원본 상태를 공유합니다.
 */
declare class ControlCase {
    /**
     * json, time, url 순서로 정의 여부를 검사하여 첫 누락이면 오류 로그 후 부분 초기화 상태로 종료합니다. 정상 입력이면 url, flag(기본 'update'), json의 name·description·files 원본 참조와 time을 저장합니다.
     *
     * @param {Partial<U3dBIMControlResponse>} [opt] 생성 옵션
     */
    constructor(opt?: Partial<U3dBIMControlResponse>);
    url: string;
    flag: any;
    name: string;
    description: string;
    files: Record<string, U3dBIMControlFile>;
    lastModifyTime: string;
    /**
     * name·description·files를 가진 새 객체를 반환합니다. files는 원본 참조입니다.
     *
     * @returns {U3dBIMControlData} files를 공유하는 새 저장 객체
     */
    export(): U3dBIMControlData;
    /**
     * name에 입력 name 값을 저장합니다.
     *
     * @param {string} name 이름
     */
    setName(name: string): void;
    /**
     * name 값을 그대로 반환합니다.
     *
     * @returns {string | undefined} 현재 저장값 또는 미조회
     */
    getName(): string | undefined;
    /**
     * url 값을 그대로 반환합니다.
     *
     * @returns {string | undefined} 현재 저장값 또는 미조회
     */
    getUrl(): string | undefined;
    /**
     * url에 입력 url 값을 저장합니다.
     *
     * @param {string} url 케이스 경로
     */
    setUrl(url: string): void;
    /**
     * flag에 입력 flag 값을 저장합니다.
     *
     * @param {string} flag 서버 저장 상태
     */
    setFlag(flag: string): void;
    /**
     * flag 값을 그대로 반환합니다.
     *
     * @returns {string | undefined} 현재 저장값 또는 미조회
     */
    getFlag(): string | undefined;
    /**
     * description에 입력 description 값을 저장합니다.
     *
     * @param {string} description 케이스 설명
     */
    setDescription(description: string): void;
    /**
     * description 값을 그대로 반환합니다.
     *
     * @returns {string | undefined} 현재 저장값 또는 미조회
     */
    getDescription(): string | undefined;
    /**
     * fileName이나 파일이 없으면 undefined를 반환합니다. change_position과 longitude·latitude·transHeight가 모두 정의된 경우 각각 x·y·z인 새 객체를 반환하고 아니면 undefined를 반환합니다.
     *
     * @param {string} [fileName] 파일 이름
     * @returns {U3dBIMLocation | undefined} 현재 저장값 또는 미조회
     */
    getPosition(fileName?: string): U3dBIMLocation | undefined;
    /**
     * fileName, position.x·y·z 또는 파일이 정의되지 않으면 false를 반환합니다. change_position이 없으면 생성하고 longitude·latitude·transHeight에 입력 성분을 그대로 저장한 뒤 true를 반환합니다. position 자체의 누락은 방어하지 않습니다.
     *
     * @param {string | undefined} fileName 파일 이름
     * @param {U3dBIMLocation} position 설정할 위치
     * @returns {boolean} 처리 결과
     */
    setPosition(fileName: string | undefined, position: U3dBIMLocation): boolean;
    /**
     * fileName이나 파일이 정의되지 않으면 undefined를 반환하고 그 외에는 exclusion_globalids 원본 배열을 반환합니다.
     *
     * @param {string} [fileName] 파일 이름
     * @returns {Array<string> | undefined} 현재 저장값 또는 미조회
     */
    getExclusionList(fileName?: string): Array<string> | undefined;
    /**
     * 제외 목록이 없거나 길이가 0이면 false를 반환합니다. 항목 중 objectName과 엄격히 같은 값이 있으면 true, 없으면 false를 반환합니다.
     *
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @returns {boolean} 처리 결과
     */
    isExclusion(fileName: string | undefined, objectName: string): boolean;
    /**
     * 파일의 현재 제외 목록을 조회합니다.
     * 제외 목록·objectName·value 중 정의되지 않은 값이 있으면 false를 반환합니다.
     * value가 truthy이면 이미 있는 값은 그대로 두고 아니면 추가합니다. falsy이면 앞에서 뒤로 순회하면서 일치 항목을 splice하되 인덱스를 되돌리지 않습니다. 처리 후 true를 반환합니다.
     *
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @param {boolean} [value] 제외 여부; 누락하면 변경하지 않고 false 반환
     * @returns {boolean} 처리 결과
     */
    setExclusion(fileName: string | undefined, objectName: string, value?: boolean): boolean;
    /**
     * 파일이나 objectName이 정의되지 않으면 false를 반환합니다.
     * value가 정의되면 Number로 변환하고 NaN이 아니며 유한할 때만 change_level에 start_level을 저장합니다. 유효하지 않은 숫자는 변경 없이 true를 반환합니다. nullish value이면 해당 키를 삭제한 뒤 true를 반환합니다.
     *
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @param {number | string | null} [value] 설정값; nullish이면 기존 설정 삭제
     * @returns {boolean} 처리 결과
     */
    setChangeLevel(fileName: string | undefined, objectName: string, value?: number | string | null): boolean;
    /**
     * 파일이 정의되지 않아도 종료하지 않고 change_level에 접근합니다. change_level과 해당 objectName 항목이 정의되면 start_level을 반환하고 그 외에는 undefined를 반환합니다.
     *
     * @param {string | undefined} fileName 파일 이름
     * @param {string} ObjectName 객체 ID
     * @returns {number | undefined} 현재 저장값 또는 미조회
     */
    getChangeLevel(fileName: string | undefined, ObjectName: string): number | undefined;
    /**
     * 파일이 없으면 undefined를 반환합니다. change_level의 키 순서대로 id·level 객체를 새 배열에 담아 반환합니다. change_level 자체의 누락은 방어하지 않습니다.
     *
     * @param {string} [fileName] 파일 이름
     * @returns {Array<U3dBIMLevelEntry> | undefined} 현재 저장값 또는 미조회
     */
    getChangeLevelList(fileName?: string): Array<U3dBIMLevelEntry> | undefined;
    /**
     * 파일이나 objectName이 없으면 false를 반환합니다. value가 정의되고 문자열이면 JSON 해석을 시도하여 실패 시 false를 반환합니다.
     * 정의된 value는 change_attributes에 저장하고 nullish 값은 키를 삭제합니다. 처리 후 true를 반환합니다.
     *
     * @param {string | undefined} fileName 파일 이름
     * @param {string} objectName 객체 ID
     * @param {unknown} [value] 설정값; nullish이면 기존 설정 삭제
     * @returns {boolean} 처리 결과
     */
    setChangeProperties(fileName: string | undefined, objectName: string, value?: unknown): boolean;
    /**
     * 파일이 없으면 undefined를 반환하고 아니면 change_attributes의 원본 값을 반환합니다.
     *
     * @param {string | undefined} fileName 파일 이름
     * @param {string} ObjectName 객체 ID
     * @returns {unknown} 현재 저장값 또는 미조회
     */
    getChangeProperties(fileName: string | undefined, ObjectName: string): unknown;
    /**
     * 파일이 없으면 undefined를 반환합니다. change_attributes의 키 순서로 id·properties 객체를 새 배열에 담아 반환하며 각 properties는 원본 참조입니다.
     *
     * @param {string} [fileName] 파일 이름
     * @returns {Array<U3dBIMPropertiesEntry> | undefined} 현재 저장값 또는 미조회
     */
    getChangePropertiesList(fileName?: string): Array<U3dBIMPropertiesEntry> | undefined;
}

/**
 * 루트 목록·입력 순서·ID 사전을 함께 제공하는 메타데이터 트리입니다.
 */
declare class MetaDataTree {
    /** @type {Array<MetaData>} */
    tree: Array<MetaData>;
    /** @type {Array<MetaData>} */
    list: Array<MetaData>;
    /** @type {Record<string, MetaData>} */
    map: Record<string, MetaData>;
    /**
     * tree 원본 배열을 반환합니다.
     *
     * @returns {Array<MetaData>} 변경 가능한 원본 컬렉션
     */
    getTree(): Array<MetaData>;
    /**
     * list 원본 배열을 반환합니다.
     *
     * @returns {Array<MetaData>} 변경 가능한 원본 컬렉션
     */
    getList(): Array<MetaData>;
    /**
     * map 원본 객체를 반환합니다.
     *
     * @returns {Record<string, MetaData>} 변경 가능한 원본 컬렉션
     */
    getMap(): Record<string, MetaData>;
    /**
     * 현재 루트 tree 중 부모 ID가 입력 meta의 ID와 같은 노드를 순서대로 meta.children에 옮기고 tree에서 제거합니다.
     * 누적 list에서 ID가 meta의 부모 ID인 첫 노드에 meta를 자식으로 추가합니다. 부모가 없으면 tree에 루트로 추가합니다.
     * map의 입력 ID 항목은 meta로 덮어쓰고 list에는 중복 검사 없이 추가합니다.
     *
     * @param {U3dBIMMetaNode} meta 추가하거나 순회할 메타데이터
     */
    add(meta: U3dBIMMetaNode): void;
    /**
     * getTree 결과의 각 루트를 현재 순서대로 선행 순회합니다.
     *
     * @param {function} callback 각 메타데이터를 받는 순회 콜백
     */
    traverse(callback: Function): void;
}

/**
 * 입력 키 이름에 따라 메타데이터 값을 보관합니다. 부모·자식 연결은 MetaDataTree가 구성합니다.
 */
declare class MetaData {
    /**
     * 키 이름은 metaIdKey='GlobalId', metaParentKey='Parent_GlobalId', metaNameKey='Name', fileNameKey='FileName', objectTypeKey='ObjectType', typeKey='Type', tagKey='Tag', propertiesKey='Properties'로 기본 설정합니다.
     * rootNameKey는 opt.rootNameKey가 아니라 opt.fileNameKey를 사용하며 그 값이 nullish이면 'rootName'입니다.
     * 각 키가 가리키는 원본 속성을 id·name·parentId·fileName·rootName·objectType·type·tag·properties에 저장하고 children을 빈 배열로 생성합니다.
     * name이 정의되고 빈 문자열이 아니면 text에 name을 저장하며 아니면 'unnamed'를 저장합니다.
     *
     * @param {U3dBIMMetaRecord} [opt] 원본 메타데이터 값과 키 이름 설정
     */
    constructor(opt?: U3dBIMMetaRecord);
    metaIdKey: any;
    metaParentKey: any;
    metaNameKey: any;
    fileNameKey: any;
    rootNameKey: any;
    objectTypeKey: any;
    typeKey: any;
    tagKey: any;
    propertiesKey: any;
    id: unknown;
    name: unknown;
    parentId: unknown;
    fileName: unknown;
    rootName: unknown;
    objectType: unknown;
    type: unknown;
    tag: unknown;
    properties: unknown;
    children: any[];
    text: {};
    /**
     * 현재 키 이름으로 id·name·parentId·fileName·objectType·type·tag·properties를 담은 새 객체를 반환합니다. rootName과 children은 포함하지 않고 properties는 같은 참조입니다.
     *
     * @returns {U3dBIMMetaRecord} 현재 키 이름으로 구성한 새 객체
     */
    export(): U3dBIMMetaRecord;
    /**
     * id의 현재 값을 그대로 반환합니다.
     *
     * @returns {unknown} 저장한 원본 값
     */
    getId(): unknown;
    /**
     * name의 현재 값을 그대로 반환합니다.
     *
     * @returns {unknown} 저장한 원본 값
     */
    getName(): unknown;
    /**
     * fileName의 현재 값을 그대로 반환합니다.
     *
     * @returns {unknown} 저장한 원본 값
     */
    getFileName(): unknown;
    /**
     * rootName의 현재 값을 그대로 반환합니다.
     *
     * @returns {unknown} 저장한 원본 값
     */
    getRootName(): unknown;
    /**
     * properties의 현재 값을 그대로 반환합니다.
     *
     * @returns {unknown} 저장한 원본 값
     */
    getProperties(): unknown;
    /**
     * parentId의 현재 값을 그대로 반환합니다.
     *
     * @returns {unknown} 저장한 원본 값
     */
    getParentId(): unknown;
    /**
     * metaIdKey의 현재 값을 그대로 반환합니다.
     *
     * @returns {string} 저장한 원본 값
     */
    getIdKey(): string;
    /**
     * metaParentKey의 현재 값을 그대로 반환합니다.
     *
     * @returns {string} 저장한 원본 값
     */
    getParentKey(): string;
    /**
     * children의 현재 값을 그대로 반환합니다.
     *
     * @returns {Array<MetaData>} 저장한 원본 값
     */
    getChildren(): Array<MetaData>;
    /**
     * rootName 속성에 입력값을 저장합니다.
     *
     * @param {string} rootName 메타데이터의 루트 이름
     */
    setRootName(rootName: string): void;
}

export type { ControlCase, MetaData, MetaDataTree, U3dModelBIMObjLayer };
