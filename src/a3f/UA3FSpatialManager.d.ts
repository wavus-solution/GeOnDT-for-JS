// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FMetadataLoader } from "./UA3FMetadataLoader.js";
import type { UA3FChildMetadataVo } from "./vo/UA3FChildMetadataVo.js";
import type { UA3FMetadataVo } from "./vo/UA3FMetadataVo.js";
import type { UA3FSpatialOptionsVo } from "./vo/UA3FSpatialOptionsVo.js";
import type { UA3FSpatialSelectionVo } from "./vo/UA3FSpatialSelectionVo.js";
import type { UA3FSpatialViewVo } from "./vo/UA3FSpatialViewVo.js";

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

export type { UA3FSpatialCover, UA3FSpatialEntry, UA3FSpatialManagerCO, UA3FSpatialManagerCO_Content, UA3FSpatialPass, UA3FSpatialRequest, UA3FSpatialState };
