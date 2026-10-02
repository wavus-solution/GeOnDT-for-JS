// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelBasicLayer } from "./U3dModelBasicLayer.js";
import type { U3dModelTdsGroupEntry, U3dModelTdsGroupFunction, U3dModelTdsGroupParams, U3dModelTdsLayerCO, U3dModelTdsMeshMetaData } from "./U3dModelTdsLayer.types.js";
import type { UClock } from "../core/UClock.js";
import type { UGroup } from "../core/UGroup.js";
import type { U3dSelect } from "../select/U3dSelect.js";
import type { GeoPosition, ModelMesh } from "../types/global.types.js";

/**
 * ~extends import('@union3d/3dLayer/U3dModelBasicLayer').U3dModelBasicLayer <br>
 *
 * XML·모델 목록 로딩과 층별 사용자 그룹을 관리하는 레이어입니다. <br>
 * 모델 로더는 부모에 위임하고 사용자 그룹 배치·선택·메타데이터 연결을 제공합니다.
 *
 * @group 3dLayer
 * @extends {U3dModelBasicLayer}
 */
declare class U3dModelTdsLayer extends U3dModelBasicLayer {
    /**
     * U3dModelTdsLayer 클래스 생성자입니다. <br>
     * 모델 배치와 사용자 그룹·메타데이터 옵션을 보관합니다. <br>
     * baseUrl이 없으면 자식 초기화를 중단하며 주소가 있으면 location 또는 position이 필요합니다.
     *
     * @param {Partial<U3dModelTdsLayerCO>} [opt={}] 모델 주소·배치·층 분류 설정
     */
    constructor(opt?: Partial<U3dModelTdsLayerCO>);
    _position: any;
    /** @type {Array<import('three').AnimationMixer>} */
    _mixers: Array<three.AnimationMixer>;
    _clock: UClock;
    /** @type {import('three').AnimationAction | undefined} */
    _action: three.AnimationAction | undefined;
    _animationSpeed: any;
    /** @type {Array<import('@UGroup').UGroup>} */
    _userGroupList: Array<UGroup>;
    _positionOffsetName: any;
    _jsonFileName: any;
    _userGroupDataName: any;
    /** @type {undefined | null | U3dModelTdsGroupFunction} */
    _setUserGroupFunction: undefined | null | U3dModelTdsGroupFunction;
    _userGroupParams: any;
    /**
     * 층 분류 함수가 사용할 설정 객체를 저장합니다. <br>
     * 객체를 복사하지 않으며 null·undefined 입력은 무시합니다.
     *
     * @param {U3dModelTdsGroupParams} params 층 이름·간격·분리 문자 설정
     */
    setUserGroupParams(params: U3dModelTdsGroupParams): void;
    /**
     * 현재 층 분류 설정을 반환합니다.
     *
     * @returns {U3dModelTdsGroupParams | undefined} 저장 객체 자체, 부분 초기화 상태에서는 undefined
     */
    getUserGroupParams(): U3dModelTdsGroupParams | undefined;
    /**
     * 층별 원본 목록을 결정하는 함수를 교체합니다. <br>
     * 호출 시 this는 레이어이며 null·undefined 입력은 기존 함수를 유지합니다.
     *
     * @param {U3dModelTdsGroupFunction} func 그룹 이름별 원본 목록을 반환하는 함수
     */
    setUserGroupFunction(func: U3dModelTdsGroupFunction): void;
    /**
     * 현재 층 분류 함수의 참조를 반환합니다.
     *
     * @returns {undefined | null | U3dModelTdsGroupFunction} 등록된 함수 또는 미설정 값
     */
    getUserGroupFunction(): undefined | null | U3dModelTdsGroupFunction;
    /**
     * 모델을 삭제·장면에서 분리하고 사용자 그룹 목록과 이동 타이머를 정리합니다. <br>
     * 기존 계약에 따라 상위 해제 Promise는 반환하지 않습니다.
     *
     * @override
     */
    override dispose(): void;
    /**
     * 위경도 좌표계(EPSG:4326)의 위치를 월드 좌표(EPSG:3857)로 변환하여 경계와 직접 자식 위치를 이동합니다. <br>
     * z가 주어졌을 때만 높이를 함께 변경하며 위치 변경 뒤 행렬을 직접 갱신하지 않습니다.
     *
     * @param {GeoPosition} geo 지리 좌표 x·y와 선택 높이 z
     */
    setPosition(geo: GeoPosition): void;
    /**
     * 모델 그룹과 그 직접 자식 메시의 현재 위치를 원위치로 복제하여 저장합니다. <br>
     * 그룹이 초기화된 이후 호출하며 더 깊은 자손을 재귀적으로 방문하지 않습니다.
     */
    setGroupOriginPosition(): void;
    /**
     * 등록된 사용자 그룹 목록의 참조를 반환합니다.
     *
     * @returns {Array<import('@UGroup').UGroup> | undefined} 사용자 그룹 배열 자체 또는 미초기화 상태
     */
    getAllUserGroupList(): Array<UGroup> | undefined;
    /**
     * 층 분류 결과에 맞춰 원본 그룹을 이동하고 자식을 복제한 그룹 목록을 만듭니다. <br>
     * 분류 함수가 있으면 반환 키 순서로 배치하며 결과를 등록 목록에 자동 추가하지 않습니다. <br>
     * 기본 분류 함수를 사용하면 commonName이 필요하며, 생략한 채 분류를 실행하면 TypeError가 발생합니다. <br>
     * 사용자 분류 함수의 반환 조건은 U3dModelTdsGroupFunction을 따릅니다. <br>
     * 호출 전에 setGroupOriginPosition으로 원위치를 준비하십시오.
     *
     * @param {number} floorCount 분류할 최상위 층 번호
     * @param {number} [height=0] 층간 z 이동량
     * @param {string} [commonName] 결과 그룹 이름의 공통 접미사, 기본 분류 함수 사용 시 필수이며 빈 문자열 허용
     * @param {string} [commonChar='0'] 층 번호 앞 비교 문자
     * @param {string} [seperator] 이름 분리 문자, 생략하면 밑줄 자동 분리
     * @returns {Array<import('@UGroup').UGroup> | undefined} 자식이 있는 복제 그룹 목록(빈 배열 가능) 또는 조기 종료의 undefined
     */
    setFloorFromGroupName(floorCount: number, height?: number, commonName?: string, commonChar?: string, seperator?: string): Array<UGroup> | undefined;
    /**
     * 50ms 간격으로 층간 이동량을 증가시키는 타이머를 시작합니다. <br>
     * 반복 경계는 interval*10이며 종료 회차에도 이동을 적용합니다. <br>
     * 기존 구현에서 y·z 생략은 해당 축 대신 x를 0으로 만들므로 세 좌표를 함께 전달하십시오.
     *
     * @param {number | String} interval 반복 회수를 결정하는 값
     * @param {number} [x] 최종 x 이동량
     * @param {number} [y] 최종 y 이동량
     * @param {number} [z] 최종 z 이동량
     */
    animateInterval(interval: number | string, x?: number, y?: number, z?: number): void;
    _activeInterval: number;
    /**
     * 활성 이동 타이머를 정지하고 요청 시 원위치 이동량을 적용합니다.
     *
     * @param {boolean} [positionInit] truthy이면 층간 이동량을 모두 0으로 설정
     */
    stopAnimation(positionInit?: boolean): void;
    /**
     * 등록 그룹 순서에 따라 층간 이동량을 적용합니다. <br>
     * 등록 이름으로 조회한 원본 목록을 이동하므로 원위치와 그룹 연결이 준비되어야 합니다.
     *
     * @param {number} [x=0] 층간 x 이동량
     * @param {number} [y=0] 층간 y 이동량
     * @param {number} [z=0] 층간 z 이동량
     */
    moveUserGroupPosition(x?: number, y?: number, z?: number): void;
    /**
     * 원위치에 층별 이동량을 더해 전달한 원본 객체 목록을 배치합니다. <br>
     * 활성 그림자의 재계산을 요청하며 객체 행렬은 직접 갱신하지 않습니다.
     *
     * @param {Array<ModelMesh>} group 원위치가 저장된 원본 객체 목록
     * @param {import('three').Vector3Like} [position] 층간 이동량, 생략하면 영벡터
     * @param {number} [floorCount=1] 전체 층 수
     * @param {number} [order=0] 이동량에서 제외할 층 순서
     */
    setUserGroupPosition(group: Array<ModelMesh>, position?: three.Vector3Like, floorCount?: number, order?: number): void;
    /**
     * 같은 이름이 없는 사용자 그룹을 등록합니다. <br>
     * 전달된 그룹 자체를 저장하며 복제하지 않습니다.
     *
     * @param {import('@UGroup').UGroup} group 등록할 그룹
     */
    addUserGroup(group: UGroup): void;
    /**
     * 선택 메시들을 이름이 있는 사용자 그룹으로 구성합니다. <br>
     * 복제·기존 그룹 병합·등록은 createUserGroup의 처리 계약을 따릅니다.
     *
     * @param {Array<ModelMesh>} group 선택 메시 목록
     * @param {string} groupName 구성할 사용자 그룹 이름
     * @returns {import('@UGroup').UGroup | undefined} 구성된 그룹 또는 생성되지 않은 결과
     */
    setSelectGrouping(group: Array<ModelMesh>, groupName: string): UGroup | undefined;
    /**
     * 사용자 그룹에 대응하는 원본 목록 또는 원본 이름 그룹을 조회합니다. <br>
     * origin이 truthy이면 원본 그룹을 우선 찾고, 이름을 생략하면 등록 목록을 반환합니다. <br>
     * 조회 예외는 로그로 기록하고 undefined를 반환합니다.
     *
     * @param {string} [groupName] 조회할 그룹 이름
     * @param {boolean} [origin=false] 원본 그룹 이름을 우선 조회할지 여부
     * @returns {import('three').Object3D | Array<ModelMesh> | Array<import('@UGroup').UGroup> | undefined} 이름·조회 방식에 따른 원본 객체나 목록
     */
    getUserGroupList(groupName?: string, origin?: boolean): three.Object3D | Array<ModelMesh> | Array<UGroup> | undefined;
    /**
     * 사용자 그룹의 원본 연결과 메타데이터를 제거합니다. <br>
     * 저장 키 조회 후 createUserGroup.remove에 현재 레이어를 전달합니다.
     *
     * @param {import('@UGroup').UGroup} group 제거할 사용자 그룹
     */
    removeSelectGroup(group: UGroup): void;
    /**
     * 저장된 재질 이름을 우선하여 메시 이름을 반환합니다. <br>
     * 저장 이름이 비어 있으면 단일 재질 이름을 다시 저장하며 재질 배열은 펼치지 않습니다.
     *
     * @param {ModelMesh} mesh 이름을 조회할 메시
     * @returns {string | undefined} 저장 이름 또는 재질 이름, 조회할 수 없으면 undefined
     */
    getMeshName(mesh: ModelMesh): string | undefined;
    /**
     * 메시와 관련된 파일·그룹·사용자 그룹 메타데이터를 조회합니다. <br>
     * 메타데이터 사용이 켜져 있어야 하며 그룹 존재·메시 부재는 undefined입니다. <br>
     * 그룹 자체가 없으면 그룹·메시 항목이 undefined인 결과 객체를 반환합니다.
     *
     * @override
     *
     * @param {ModelMesh} obj 메타데이터를 조회할 메시
     * @returns {U3dModelTdsMeshMetaData | undefined} 조회 결과 또는 처리 조건이 맞지 않는 결과
     */
    override getMeshMetaData(obj: ModelMesh): U3dModelTdsMeshMetaData | undefined;
    /**
     * 그룹 또는 그룹#메시의 메타데이터 항목에 JSON 문자열을 해석하여 저장합니다. <br>
     * 위치 오프셋 키이면 연결된 메시와 행렬을 갱신하며 실패 전 변경은 되돌리지 않습니다. <br>
     * JSON 해석·갱신 중 예외는 로그로 기록합니다.
     *
     * @param {string} target 그룹 이름 또는 그룹#메시 이름
     * @param {string} key 갱신할 메타데이터 키
     * @param {string} value JSON으로 해석할 문자열
     */
    setMetaDataByUser(target: string, key: string, value: string): void;
    /**
     * 사용자 그룹의 메시 이름과 원본 그룹 이름 목록을 메타데이터에 저장합니다. <br>
     * 동일 키의 기존 항목을 교체하며 서버 저장은 수행하지 않습니다.
     *
     * @param {import('@UGroup').UGroup} group 자식 정보를 기록할 사용자 그룹
     * @param {string} key 파일 메타데이터의 저장 키
     */
    applyUserGroup(group: UGroup, key: string): void;
    /**
     * 사용자 그룹 메타데이터의 저장 키를 반환합니다.
     *
     * @returns {string} 설정된 이름, null·undefined이면 userGroupData
     */
    getUserGroupDataName(): string;
    /**
     * 현재 파일 메타데이터의 사용자 그룹 항목을 반환합니다.
     *
     * @returns {Record<string, Array<U3dModelTdsGroupEntry>> | undefined} 저장 항목 자체 또는 해당 항목 없음
     */
    getUserGroupData(): Record<string, Array<U3dModelTdsGroupEntry>> | undefined;
    /**
     * 입력 메시와 연결된 사용자 그룹의 원본들을 선택기에 등록합니다. <br>
     * 동일 이름 메시에는 선택 색과 반투명을 적용하고 원본 스타일을 처음 한 번 보관합니다. <br>
     * 각 그룹 전에 U3dSelect의 선택을 비우며 생성한 선택기를 반환하지 않습니다.
     *
     * @param {ModelMesh} mesh 사용자 그룹 이름이 연결된 입력 메시
     * @param {import('@union3d/select/U3dSelect').U3dSelect} [selector] 생략하면 생성하는 point 모드 선택기
     * @param {Array<ModelMesh>} [group] uuid 중복을 제외하고 원본을 누적할 배열
     */
    getUserGroupMesh(mesh: ModelMesh, selector?: U3dSelect, group?: Array<ModelMesh>): void;
    /**
     * 모델 그룹의 직접 자식 배열을 반환합니다.
     *
     * @returns {Array<ModelMesh> | undefined} 자식 배열 자체 또는 그룹·목록 미정의
     */
    getGroupMeshes(): Array<ModelMesh> | undefined;
}

export type { U3dModelTdsLayer };
