// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelBIMObjLayer } from "./U3dModelBIMObjLayer.js";
import type { U3dModelLayerCO } from "./U3dModelLayer.types.js";

/**
     * 문자열 성분을 허용하는 BIM 배치 입력입니다. 위치 적용 시 문자열 성분을 숫자로 변경합니다.
     */
    type U3dBIMLocation = {
        /**
         * X 성분
         */
        x: number | string;
        /**
         * Y 성분
         */
        y: number | string;
        /**
         * Z 성분
         */
        z: number | string;
    };

/**
     * 파일 경로 키를 교체할 수 있는 BIM 원본 파일 정보입니다.
     */
    type U3dBIMSourceFile_Content = {
        /**
         * 원본 배치 위치
         */
        location: U3dBIMLocation;
        /**
         * 자동 고도에서 사용하는 원본 하단 경계
         */
        boundingbox: {
            minz: number;
        };
    };

/**
     * 파일 경로 키를 교체할 수 있는 BIM 원본 파일 정보입니다.
     */
    type U3dBIMSourceFile = Record<string, unknown> & U3dBIMSourceFile_Content;

/**
     * ~extends U3dModelLayerCO <br>
     * BIM OBJ 레이어의 생성 옵션입니다. 기존 소문자 옵션 이름을 유지합니다.
     */
    type U3dModelBIMObjLayerCO_Content = {
        /**
         * 레이어 고유 이름
         */
        layername: string;
        /**
         * 제어 케이스 서버 주소
         */
        serverurl: string;
        /**
         * 모델 기준 주소
         */
        baseurl: string;
        /**
         * 파일별 자료와 제어 케이스 경로
         */
        metaData: {
            files: Record<string, U3dBIMSourceFile>;
        } & Partial<{
            cases: Array<string>;
        }>;
        /**
         * 프록시 사용 여부
         */
        useproxy?: boolean;
        /**
         * 프록시 접두 주소
         */
        proxyurl?: string;
        /**
         * 레이어 표시 이름
         */
        name?: string;
        /**
         * 지형 고도에 맞춰 배치할지 여부
         */
        autoHeight?: boolean;
        /**
         * 파일 정보의 모델 경로 키
         */
        mergeFileUrlKey?: string;
        /**
         * 파일 정보의 병합 OBJ 파일 키
         */
        mergeFileKey?: string;
        /**
         * 파일 정보의 메타데이터 파일 키
         */
        metaFileKey?: string;
    };

/**
     * ~extends U3dModelLayerCO <br>
     * BIM OBJ 레이어의 생성 옵션입니다. 기존 소문자 옵션 이름을 유지합니다.
     */
    type U3dModelBIMObjLayerCO = Omit<Omit<U3dModelLayerCO, never> & U3dModelBIMObjLayerCO_Content, never>;

/**
     * 메타데이터 원본 레코드입니다. 필드 이름과 값은 입력 자료가 결정합니다.
     */
    type U3dBIMMetaRecord = Record<string, unknown>;

/**
     * 공개 조회 API가 반환하는 메타데이터 노드입니다.
     */
    type U3dBIMMetaNode = NonNullable<ReturnType<U3dModelBIMObjLayer["getMetaById"]>>;

/**
     * 공개 트리 API가 사용하는 루트·삽입 순서·ID 사전의 공유 상태입니다.
     */
    type U3dBIMTreeState = {
        /**
         * 루트 노드 목록
         */
        tree: Array<U3dBIMMetaNode>;
        /**
         * 삽입 순서 목록
         */
        list: Array<U3dBIMMetaNode>;
        /**
         * ID별 마지막 등록 노드
         */
        map: Record<string, U3dBIMMetaNode>;
    };

/**
     * ~extends import('three').Material <br>
     * BIM 선택·복원에 필요한 재질 상태입니다.
     */
    type U3dBIMMaterial_Content = {
        /**
         * 재질 색상
         */
        color: three.Color;
        /**
         * 재질 텍스처
         */
        map?: three.Texture | null;
        /**
         * 보관한 원본 색상
         */
        _oriColor?: three.Color;
        /**
         * 보관한 원본 불투명도
         */
        _oriOpacity?: number;
    };

/**
     * ~extends import('three').Material <br>
     * BIM 선택·복원에 필요한 재질 상태입니다.
     */
    type U3dBIMMaterial = three.Material & U3dBIMMaterial_Content;

/**
     * ~extends import('three').Mesh <br>
     * BIM 객체 사전과 선택 복원에서 사용하는 메시입니다.
     */
    type U3dBIMMesh_Content = {
        /**
         * 선택 전 재질
         */
        _orlMaterial?: U3dBIMMaterial | Array<U3dBIMMaterial>;
        /**
         * 연결한 메타데이터
         */
        _meta?: U3dBIMMetaNode;
        /**
         * 연결한 메타데이터 조회
         */
        getMeta?: () => U3dBIMMetaNode;
        /**
         * 엔진 메시 종류
         */
        _utype?: number;
        /**
         * 레이어 이름
         */
        _ulayername?: string;
    };

/**
     * ~extends import('three').Mesh <br>
     * BIM 객체 사전과 선택 복원에서 사용하는 메시입니다.
     */
    type U3dBIMMesh = three.Mesh<three.BufferGeometry, U3dBIMMaterial | Array<U3dBIMMaterial>> & U3dBIMMesh_Content;

/**
     * 파일별 로드 입력과 로드 후 조회 상태입니다.
     */
    type U3dBIMFile = {
        /**
         * 파일 식별 이름
         */
        name: string;
        /**
         * 모델 기준 주소
         */
        modelUrl: string;
        /**
         * 메타데이터 주소
         */
        metaFileUrl?: string;
        /**
         * OBJ 파일 이름
         */
        mergeFile: string;
        /**
         * MTL 파일 이름
         */
        materialsFile: string;
        /**
         * 원본 배치 위치의 공유 참조
         */
        location: U3dBIMLocation;
        /**
         * 원본 경계의 공유 참조
         */
        boundingBox: {
            minz: number;
        };
        /**
         * 로드한 메시 수
         */
        _objectLength?: number;
        /**
         * 메시 이름별 객체
         */
        _objectMap?: Record<string, U3dBIMMesh>;
        /**
         * 연결하지 못한 메타데이터
         */
        _nonMatchMeta?: U3dBIMMetaRecord;
        /**
         * 연결한 메타데이터 트리
         */
        _objectMetaTree?: NonNullable<ReturnType<U3dModelBIMObjLayer["makeMetaTree"]>>;
    };

/**
     * 제어 케이스에서 파일별로 저장하는 변경 자료입니다.
     */
    type U3dBIMControlFile = {
        /**
         * 객체 ID별 변경 속성
         */
        change_attributes: Record<string, unknown>;
        /**
         * 객체 ID별 시작 레벨
         */
        change_level: Record<string, {
            start_level: number;
        }>;
        /**
         * 위치 변경
         */
        change_position: Partial<{
            longitude: number | string;
            latitude: number | string;
            transHeight: number | string;
        }>;
        /**
         * 제외 ID 목록
         */
        exclusion_globalids: Array<string>;
    };

/**
     * 제어 케이스의 저장 가능한 내용입니다. files는 케이스와 공유됩니다.
     */
    type U3dBIMControlData = {
        /**
         * 케이스 이름
         */
        name?: string;
        /**
         * 케이스 설명
         */
        description?: string;
        /**
         * 파일별 변경 자료
         */
        files: Record<string, U3dBIMControlFile>;
    };

/**
     * 서버 응답과 케이스 생성에 사용하는 자료입니다.
     */
    type U3dBIMControlResponse = {
        /**
         * 케이스 내용
         */
        json: U3dBIMControlData;
        /**
         * 마지막 변경 시각
         */
        time: string;
        /**
         * 서버 케이스 경로
         */
        url: string;
        /**
         * 저장 상태
         */
        flag?: string;
    };

/**
     * 객체별 레벨 변경 조회 항목입니다.
     */
    type U3dBIMLevelEntry = {
        /**
         * 객체 ID
         */
        id: string;
        /**
         * 시작 레벨
         */
        level: number;
    };

/**
     * 객체별 속성 변경 조회 항목입니다. properties는 저장 자료와 공유될 수 있습니다.
     */
    type U3dBIMPropertiesEntry = {
        /**
         * 객체 ID
         */
        id: string;
        /**
         * 속성 값
         */
        properties: unknown;
    };

export type { U3dBIMControlData, U3dBIMControlFile, U3dBIMControlResponse, U3dBIMFile, U3dBIMLevelEntry, U3dBIMLocation, U3dBIMMaterial, U3dBIMMaterial_Content, U3dBIMMesh, U3dBIMMesh_Content, U3dBIMMetaNode, U3dBIMMetaRecord, U3dBIMPropertiesEntry, U3dBIMSourceFile, U3dBIMSourceFile_Content, U3dBIMTreeState, U3dModelBIMObjLayerCO, U3dModelBIMObjLayerCO_Content };
