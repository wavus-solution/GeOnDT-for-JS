// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { ModelInfo, U3dModelBasicLayer, U3dModelBasicLayerCO } from "./U3dModelBasicLayer.js";
import type { UGroup } from "../core/UGroup.js";

/**
 * ~extends import('@union3d/3dLayer/U3dModelBasicLayer').U3dModelBasicLayer <br>
 *
 * 모델 목록을 하나의 그룹으로 읽어 배치하고 표시·경계·정점 축 교환을 관리하는 레이어입니다. <br>
 * 모델 형식별 로딩은 기반 레이어를 사용하며 XML 사용 기본값은 false입니다.
 *
 * @group 3dLayer
 */
declare class U3dModelStaticLayer extends U3dModelBasicLayer {
    /**
     * U3dModelStaticLayer 클래스 생성자입니다. <br>
     * 실제 모델 요청은 initialize에서 시작하며 옵션 키는 대소문자 구분 없이 정규화합니다.
     *
     * @param {Partial<U3dModelStaticLayerCO>} [opt={}] 이름·모델 목록·좌표계·표시 설정과 XML 사용 옵션
     */
    constructor(opt?: Partial<U3dModelStaticLayerCO>);
    _renderBuffer: UGroup;
    _objectLoadCount: number;
    _bbox: three.Box3;
    /**
     * 앱이 있으면 정적 렌더 그룹을 장면에서 제거하고 기반 레이어를 정리합니다. <br>
     * 기반 dispose의 Promise는 반환하지 않습니다. <br>
     * _drawArg가 없는 인스턴스에서 호출하면 접근 예외가 발생합니다.
     *
     * @override
     */
    override dispose(): void;
    /**
     * 장면에서 이름으로 찾은 객체의 표시 여부를 변경합니다. <br>
     * 검색 범위는 이 레이어의 그룹으로 제한하지 않으며 _drawArg 또는 대상이 없으면 변경하지 않습니다.
     *
     * @param {string} name 장면에서 검색할 객체 이름
     * @param {boolean} show 객체의 visible에 지정할 표시 여부
     */
    showObject(name: string, show: boolean): void;
    /**
     * 레이어가 연결된 장면 전체에서 이름으로 객체를 검색합니다. <br>
     * 장면이 준비되지 않았다면 접근 예외가 발생합니다.
     *
     * @param {string} name 검색할 객체 이름
     * @returns {import('three').Object3D | undefined} 처음 찾은 객체의 원본 참조 또는 검색 실패 시 undefined
     */
    getObject(name: string): three.Object3D | undefined;
    /**
     * 렌더 그룹의 메시 정점에서 Y와 Z를 교환합니다. <br>
     * 축의 부호를 반전하는 기능은 아닙니다. <br>
     * position 속성과 형상·레이어 경계를 갱신하지만 normal·UV·index·boundingSphere는 갱신하지 않습니다. <br>
     * 공유 geometry에도 영향을 주며 중복 선택은 반복 적용됩니다. <br>
     * 기존 레이어 경계가 있어야 하고, position이 없으면 예외가 발생합니다.
     *
     * @param {Iterable<import('three').Object3D>} [mesh] uuid로 선택할 객체 목록. 생략하면 전체 메시를 처리하며 빈 목록은 정점을 바꾸지 않음
     */
    setFlipY(mesh?: Iterable<three.Object3D>): void;
    /**
     * 전달한 객체를 복제하지 않고 정적 렌더 그룹에 추가합니다. <br>
     * 로딩 후 배치 처리를 수행하지 않으며 경계·중심·로딩 수를 별도로 갱신하지 않습니다.
     *
     * @param {import('three').Object3D} mesh 추가할 모델 객체
     */
    addModel(mesh: three.Object3D): void;
}

/**
     * ~extends U3dModelBasicLayerCO <br>
     *
     * 정적 모델 레이어의 생성 옵션입니다. <br>
     * 기반 레이어 옵션을 지원하며 XML 사용 기본값만 false입니다. <br>
     * needxml 등 기존 소문자 키도 정규화되며, 정규 키와 함께 전달한 별칭은 해당 정규 키 값을 덮어씁니다.
     */
    type U3dModelStaticLayerCO_Content = {
        /**
         * 모델 XML을 사용할지 여부. undefined일 때만 기본값을 적용
         */
        needXml?: boolean;
        /**
         * 로딩할 모델 목록. 콜백 완료 시점의 각 항목에서 crs와 ext를 다시 조회
         */
        listModel?: Array<U3dModelStaticInfo>;
    };

/**
     * ~extends U3dModelBasicLayerCO <br>
     *
     * 정적 모델 레이어의 생성 옵션입니다. <br>
     * 기반 레이어 옵션을 지원하며 XML 사용 기본값만 false입니다. <br>
     * needxml 등 기존 소문자 키도 정규화되며, 정규 키와 함께 전달한 별칭은 해당 정규 키 값을 덮어씁니다.
     */
    type U3dModelStaticLayerCO = Omit<Omit<U3dModelBasicLayerCO, never> & U3dModelStaticLayerCO_Content, never>;

/**
     * ~extends ModelInfo <br>
     *
     * 기반 로더에 전달하는 모델 정보와 정적 배치에 사용할 입력 좌표계입니다.
     */
    type U3dModelStaticInfo_Content = {
        /**
         * 원본 중심의 좌표계. 생략하거나 빈 문자열이면 중심을 월드 좌표(EPSG:3857)로 직접 사용
         */
        crs?: string;
    };

/**
     * ~extends ModelInfo <br>
     *
     * 기반 로더에 전달하는 모델 정보와 정적 배치에 사용할 입력 좌표계입니다.
     */
    type U3dModelStaticInfo = ModelInfo & U3dModelStaticInfo_Content;

/**
     * ~extends import('three').Object3D <br>
     *
     * 로딩 후 정적 배치에 사용하는 객체입니다. <br>
     * 속성을 가진 메시에는 _oriCenter가 준비되어 있어야 합니다.
     */
    type U3dModelStaticObject_Content = {
        /**
         * 해당 모델 항목의 입력 좌표계
         */
        _crs?: string;
        /**
         * 해당 모델 항목의 확장자
         */
        _ext?: string;
    };

/**
     * ~extends import('three').Object3D <br>
     *
     * 로딩 후 정적 배치에 사용하는 객체입니다. <br>
     * 속성을 가진 메시에는 _oriCenter가 준비되어 있어야 합니다.
     */
    type U3dModelStaticObject = three.Object3D & U3dModelStaticObject_Content;

export type { U3dModelStaticInfo, U3dModelStaticInfo_Content, U3dModelStaticLayer, U3dModelStaticLayerCO, U3dModelStaticLayerCO_Content, U3dModelStaticObject, U3dModelStaticObject_Content };
