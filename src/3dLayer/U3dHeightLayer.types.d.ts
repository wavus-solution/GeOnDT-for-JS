// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayerCO } from "./U3dLayer.types.js";

/**
     * ~extends import('@U3dLayer').U3dLayerCO <br>
     *
     * U3dHeightLayer 생성자 옵션입니다.
     */
    type U3dHeightLayerCO_Content = {
        /**
         * 부모 타일의 고도를 대신 사용할 타일 레벨 번호 목록
         */
        burnlevels?: Array<number>;
    };

/**
     * ~extends import('@U3dLayer').U3dLayerCO <br>
     *
     * U3dHeightLayer 생성자 옵션입니다.
     */
    type U3dHeightLayerCO = Omit<Omit<U3dLayerCO, never> & U3dHeightLayerCO_Content, never>;

/**
     * 부모 타일 고도 생성 작업의 진행 상황과 결과를 전달받기 위한 옵션입니다.
     */
    type U3dHeightWorkOption = {
        /**
         * 실패 사유 등 작업 상태 메시지를 받는 객체
         */
        work: {
            setMsg: (msg: string) => void;
        };
        /**
         * 생성 성공 여부를 true 또는 false로 받는 객체
         */
        promise?: {
            resolve: (value: boolean) => void;
        };
    };

/**
     * 보관된 고도를 다시 적용할 타일을 지정하는 값 묶음입니다.
     */
    type U3dHeightUserTileInfoOption = {
        /**
         * 타일의 X축 인덱스
         */
        x: number;
        /**
         * 타일의 Y축 인덱스
         */
        y: number;
        /**
         * 타일의 레벨
         */
        level: number;
        /**
         * 타일 영역의 최소 X 월드 좌표(EPSG:3857), 현재 재적용 처리에서는 사용하지 않음
         */
        minx: number;
        /**
         * 타일 영역의 최소 Y 월드 좌표(EPSG:3857), 현재 재적용 처리에서는 사용하지 않음
         */
        miny: number;
        /**
         * 타일 영역의 최대 X 월드 좌표(EPSG:3857), 현재 재적용 처리에서는 사용하지 않음
         */
        maxx: number;
        /**
         * 타일 영역의 최대 Y 월드 좌표(EPSG:3857), 현재 재적용 처리에서는 사용하지 않음
         */
        maxy: number;
    };

/**
     * 지형 적용과 조회에 전달하는 해석된 표본 메타데이터입니다. <br>
     * 파일의 바이너리 배치가 아닌, 호출자가 표본과 함께 보관·전달하는 값의 계약입니다.
     */
    type U3dHeightTileHeader = {
        /**
         * 자료의 주 버전
         */
        major: number;
        /**
         * 자료의 부 버전
         */
        minor: number;
        /**
         * 고도 타일 X축 사이즈
         */
        width: number;
        /**
         * 고도 타일 Y축 사이즈
         */
        height: number;
        /**
         * 고도 표본의 자료형 식별값
         */
        sampleType: number;
        /**
         * 원본 고도 표본에 곱하는 배율, 레이어 기본 배율보다 먼저 적용됨
         */
        scale: number;
        /**
         * 배율을 적용한 고도 표본에 더하는 값, 레이어 기본 오프셋보다 먼저 적용됨
         */
        offset: number;
        /**
         * 값이 없는 표본을 나타내는 원본 표본값, 지정하지 않으면 undefined
         */
        noData: number | undefined;
        /**
         * 헤더에 기록된 실제 고도 표본 개수
         */
        count: number;
    };

/**
     * 고도 정점 갱신에 필요한 상태 조회 계약입니다. <br>
     * 실제 레이어의 현재 값을 참조합니다.
     */
    type U3dHeightSampleState = {
        /**
         * 현재 레이어 이름
         */
        _name: string | undefined;
        /**
         * 헤더가 없을 때의 표본 배율
         */
        _dataScale: number;
        /**
         * 헤더가 없을 때의 표본 오프셋
         */
        _dataOffset: number;
        /**
         * 가장자리 기본 고도
         */
        _defaultHeight: number | undefined;
    };

/**
     * 공유 정점 배열 갱신 후 일반 제어부가 반영할 결과입니다.
     */
    type U3dHeightSampleResult = {
        /**
         * 스커트 가장자리를 제외한 정점의 최대 고도, 집계할 정점이 없으면 undefined
         */
        maxHeight: number | undefined;
        /**
         * 스커트 가장자리를 제외한 정점의 최소 고도, 집계할 정점이 없으면 undefined
         */
        minHeight: number | undefined;
        /**
         * 다른 레이어의 기존 고도와 병합했는지 여부
         */
        merged: boolean;
    };

export type { U3dHeightLayerCO, U3dHeightLayerCO_Content, U3dHeightSampleResult, U3dHeightSampleState, U3dHeightTileHeader, U3dHeightUserTileInfoOption, U3dHeightWorkOption };
