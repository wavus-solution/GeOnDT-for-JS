// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FParserDecodeOptions } from "../../../../core/parser/UA3FParser.js";

/**
     * 워커에서 사용하는 일반 파일 정의입니다.
     */
    type UA3FParserTaskBufferData = {
        /**
         * metadata의 바이너리 식별자
         */
        bufferId: string;
        /**
         * 파일 참조이며 이 태스크에서는 네트워크 요청을 실행하지 않음
         */
        uri: string;
        /**
         * 양의 안전 정수인 전체 바이트 수
         */
        byteLength: number;
        /**
         * 파일의 64자리 16진 SHA-256
         */
        sha256: string;
        /**
         * 공용 배치 식별자
         */
        layoutId: string;
    };

/**
     * 일반 객체로 전송하는 한 필드의 바이너리 배치입니다.
     */
    type UA3FParserTaskArrayLayoutData = {
        /**
         * 대소문자를 구분하는 동적 필드 식별자
         */
        fieldId: string;
        /**
         * 숫자 성분 타입
         */
        componentType: ("Float32" | "Float64" | "Uint16" | "Uint32");
        /**
         * 값의 연결 대상
         */
        association: ("node" | "index" | "triangle");
        /**
         * 양의 안전 정수인 항목 수이며 width*height와 같음
         */
        count: number;
        /**
         * 양의 안전 정수인 배열 너비
         */
        width: number;
        /**
         * 양의 안전 정수인 배열 높이
         */
        height: number;
        /**
         * 항목당 성분 수
         */
        itemSize: (1 | 2 | 3 | 4);
        /**
         * 정수 attribute 정규화 여부
         */
        normalized: boolean;
        /**
         * 파일 시작부터 0 기반 바이트 위치이며 8의 배수
         */
        byteOffset: number;
        /**
         * 성분 타입·항목 수·itemSize와 일치하는 바이트 수
         */
        byteLength: number;
    };

/**
     * 여러 파일에서 참조하는 공용 배치의 전송 정의입니다.
     */
    type UA3FParserTaskLayoutData = {
        /**
         * 공용 배치 식별자
         */
        layoutId: string;
        /**
         * 양의 안전 정수인 전체 바이트 수
         */
        byteLength: number;
        /**
         * 필드별 배치 목록이며 원래 순서를 보존
         */
        arrays: Array<UA3FParserTaskArrayLayoutData>;
    };

/**
     * 배치와 실제 숫자 view의 연결입니다.
     */
    type UA3FParserTaskDecodedArrayData = {
        /**
         * 숫자 배열의 배치 정의
         */
        layout: UA3FParserTaskArrayLayoutData;
        /**
         * 숫자 view이며 인코딩 입력은 부분 view 허용
         */
        array: (Float32Array | Float64Array | Uint16Array | Uint32Array);
    };

/**
     * decode 정적 메서드에 전달할 일반 객체 요청입니다.
     * 입력 버퍼를 전송하면 메인의 원본과 같은 버퍼를 공유한 모든 view가 분리됩니다.
     */
    type UA3FParserTaskDecodeRequest = {
        /**
         * 파일 정의
         */
        buffer: UA3FParserTaskBufferData;
        /**
         * 공용 배치
         */
        layout: UA3FParserTaskLayoutData;
        /**
         * 고정·미분리 버퍼이며 완료까지 변경 금지
         */
        arrayBuffer: ArrayBuffer;
        /**
         * 기본값은 빈 객체이며 verifyHash 기본값 true
         */
        opt?: UA3FParserDecodeOptions;
    };

/**
     * decode 결과이며 모든 숫자 view가 반환 버퍼를 공유합니다.
     * UWorker는 내부 전송 목록을 제거하고 버퍼 소유권을 수신자에게 이전합니다.
     */
    type UA3FParserTaskDecodeResult = {
        /**
         * 해석한 파일 식별자
         */
        bufferId: string;
        /**
         * 해석한 배치 식별자
         */
        layoutId: string;
        /**
         * 원본 버퍼이며 UWorker 반환 전송 후 수신자 소유
         */
        arrayBuffer: ArrayBuffer;
        /**
         * 숫자 복사 없이 같은 버퍼를 공유하는 필드 목록
         */
        arrays: Array<UA3FParserTaskDecodedArrayData>;
        /**
         * 내부 전송 지시이며 태스크 반환 시 버퍼 한 개, 메인 수신 시 제거됨
         */
        _transferables?: Array<ArrayBuffer>;
    };

/**
     * encode 정적 메서드에 전달할 출력 배치와 숫자 목록입니다.
     * 요청에서 이전한 입력 버퍼는 자동 반환하지 않으며 원본 보존은 호출자가 관리합니다.
     */
    type UA3FParserTaskEncodeRequest = {
        /**
         * 출력 공용 배치
         */
        layout: UA3FParserTaskLayoutData;
        /**
         * 필드별 배치와 숫자 view이며 순서가 달라도 fieldId로 연결
         */
        arrays: Array<UA3FParserTaskDecodedArrayData>;
    };

/**
     * encode가 할당한 새 바이너리 버퍼입니다.
     */
    type UA3FParserTaskEncodeResult = {
        /**
         * 출력 버퍼이며 UWorker 반환 전송 후 수신자 소유
         */
        arrayBuffer: ArrayBuffer;
        /**
         * 내부 전송 지시이며 태스크 반환 시 버퍼 한 개, 메인 수신 시 제거됨
         */
        _transferables?: Array<ArrayBuffer>;
    };

export type { UA3FParserTaskArrayLayoutData, UA3FParserTaskBufferData, UA3FParserTaskDecodeRequest, UA3FParserTaskDecodeResult, UA3FParserTaskDecodedArrayData, UA3FParserTaskEncodeRequest, UA3FParserTaskEncodeResult, UA3FParserTaskLayoutData };
