// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelBasicLayer } from "./U3dModelBasicLayer.js";
import type { U3dModelLayerCO } from "./U3dModelLayer.types.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UGroup } from "../core/UGroup.js";
import type { GeoPosition, KeyValue } from "../types/global.types.js";

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

export type { BoundingBox2D, ModelInfo, ModelObject3D, U3dModelBasicLayerCO, U3dModelBasicLayerCO_Content, U3dModelBasicLayerCompletion, U3dModelBasicLayerU3fTarget, U3dModelBasicMeshMetaData };
