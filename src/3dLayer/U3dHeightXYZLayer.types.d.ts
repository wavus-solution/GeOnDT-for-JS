// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dHeightLayerCO, U3dHeightTileHeader } from "./U3dHeightLayer.types.js";

/**
     * ~extends import('@union3d/3dLayer/U3dHeightLayer').U3dHeightLayerCO <br>
     *
     * U3dHeightXYZLayer 생성자 옵션
     */
    type U3dHeightXYZLayerCO_Content = {
        /**
         * 레이어 이름
         */
        name: string;
        /**
         * 데이터 URL (camelCase)
         */
        baseUrl: string;
        /**
         * 파일 확장자 (ex : '.umf')
         */
        ext: string;
        /**
         * X축 반전 여부
         */
        reverseX?: boolean;
        /**
         * Y축 반전 여부
         */
        reverseY?: boolean;
        /**
         * 프록시 사용 여부이며, 참일 때만 proxyurl을 baseUrl 앞에 붙입니다
         */
        useproxy?: boolean;
        /**
         * 생성 시점에 baseUrl 앞에 한 번 붙는 접두사이며, useproxy가 거짓이면 쓰이지 않습니다
         */
        proxyurl?: string;
        /**
         * 타일 가로 크기
         */
        width?: number;
        /**
         * 타일 세로 크기
         */
        height?: number;
        /**
         * 고도 표본 하나의 바이트 수이며 2(Int16) 또는 4(Float32)
         */
        unitheight?: number;
        /**
         * 고도를 구하지 못한 지점에 사용할 기본 고도이며, 0이 아닌 값을 넣었을 때만 이 값이 쓰입니다
         */
        defaultheight?: number;
        /**
         * defaultheight의 대소문자 혼용 이름이며, defaultheight를 생략했거나 0으로 넣었을 때 이 값이 대신 쓰입니다
         */
        defaultHeight?: number;
        /**
         * 고도 표본 하나를 이루는 벡터 성분 수이며, 표본을 읽는 방식에는 관여하지 않고 getMetaData()가 돌려주는 설정으로만 보관합니다
         */
        unitvec3?: number;
        /**
         * 고도 표본의 숫자 자료 형식 이름이며 XML을 읽으면 그 값으로 대체
         */
        unittype?: string;
        /**
         * xml 파일 사용 여부
         */
        needXml?: boolean;
        /**
         * skirt 연산 여부
         */
        skirt?: boolean;
        /**
         * skirt 높이
         */
        skirtheight?: number;
        /**
         * 타일 검색 버퍼 크기
         */
        pTileSearchBuffer?: number;
        /**
         * 타일 서브 버퍼 크기
         */
        pTileSubBuffer?: number;
        /**
         * 바운딩 박스
         */
        boundingbox?: three.Box3;
        /**
         * 실제 최대 레벨
         */
        realmaxlevel?: number;
    };

/**
     * ~extends import('@union3d/3dLayer/U3dHeightLayer').U3dHeightLayerCO <br>
     *
     * U3dHeightXYZLayer 생성자 옵션
     */
    type U3dHeightXYZLayerCO = Omit<Omit<U3dHeightLayerCO, never> & U3dHeightXYZLayerCO_Content, never>;

/**
     * createUrl 함수에 전달하는 타일 좌표 파라미터
     */
    type TileUrlParam = {
        /**
         * 타일 중심의 월드 좌표(EPSG:3857) X
         */
        _centerX: number;
        /**
         * 타일 중심의 월드 좌표(EPSG:3857) Y
         */
        _centerY: number;
        /**
         * 타일 레벨
         */
        _level: number;
    };

/**
     * 고도 타일의 원시 표본과 해당 표본에 적용할 메타데이터입니다.
     *
     * 데이터와 헤더는 서로 분리해서 제거되면 안 되므로 하나의 캐시 값으로 관리합니다.
     */
    type U3dHeightTilePayload = {
        /**
         * 원시 고도 표본 배열
         */
        data: ArrayLike<number>;
        /**
         * 표본과 함께 사용하는 선택적 메타데이터
         */
        header: U3dHeightTileHeader | undefined;
        /**
         * 캐시 용량 계산에 사용하는 항목 크기
         */
        byteLength: number;
    };

/**
     * 좌표별 고도 계산에 필요한 격자 기본값과 복원 설정입니다.
     */
    type U3dHeightXYZSampleState = {
        /**
         * 헤더에 가로 크기가 없을 때 사용할 표본 수
         */
        _width: number | undefined;
        /**
         * 헤더에 세로 크기가 없을 때 사용할 표본 수
         */
        _height: number | undefined;
        /**
         * 헤더에 배율이 없을 때 사용할 값
         */
        _dataScale: number;
        /**
         * 헤더에 오프셋이 없을 때 사용할 값
         */
        _dataOffset: number;
    };

/**
     * 압축 해제 라이브러리가 반환하는 전체 버퍼 또는 버퍼의 일부 범위입니다.
     */
    type U3dHeightInflatedBuffer = ArrayBuffer | ArrayBufferView;

/**
     * 자료 해석과 기존 표본 재사용에 필요한 레이어 설정의 조회 계약입니다.<br>
     * 실제 고도는 원시 표본에 배율을 곱하고 오프셋을 더해 얻으며, 타일 헤더가 값을 가지고 있으면 헤더 쪽을 먼저 씁니다.<br>
     * 원시 표본이 유한하지 않거나 헤더가 지정한 무자료 값과 같으면 그 표본은 고도로 쓰지 않습니다.<br>
     * 현재 값을 읽기 위한 경계이며 파일의 바이너리 구조를 나타내지 않습니다.
     */
    type U3dHeightXYZFormatState = {
        /**
         * 표본 가로 크기
         */
        _width: number | undefined;
        /**
         * 표본 세로 크기
         */
        _height: number | undefined;
        /**
         * 고도 표본 하나의 바이트 수
         */
        _unitHeight: number;
        /**
         * 현재 자료의 주 버전이며, XML이 버전을 밝힌 상태에서 2.0이 아니면 타일 해석을 오류로 중단합니다
         */
        _majorVersion: number;
        /**
         * 현재 자료의 부 버전이며, 주 버전과 함께 2.0 여부와 2 미만의 옛 형식 여부를 가릅니다
         */
        _minorVersion: number;
        /**
         * 타일 헤더에 배율이 없을 때 사용할 기본 배율
         */
        _dataScale: number;
        /**
         * 타일 헤더에 오프셋이 없을 때 사용할 기본 오프셋
         */
        _dataOffset: number;
    };

/**
     * 검증을 마친 뒤 레이어에 반영할 타일맵 설정입니다.<br>
     * 선택 문자열의 null은 현재 설정을 덮어쓰지 않는다는 뜻입니다.
     */
    type U3dHeightXYZParsedSettings = {
        /**
         * 반영할 주 버전
         */
        parsedMajorVersion: number;
        /**
         * 반영할 부 버전
         */
        parsedMinorVersion: number;
        /**
         * 파일 설정에 버전을 명시했는지 여부
         */
        hasDeclaredVersion: boolean;
        /**
         * 반영할 표본 가로 크기
         */
        parsedWidth: number | undefined;
        /**
         * 반영할 표본 세로 크기
         */
        parsedHeight: number | undefined;
        /**
         * 반영할 표본 크기 설정
         */
        parsedUnitHeight: number;
        /**
         * 선택적 표본 형식 설정
         */
        unitType: string | null;
        /**
         * 선택적 압축 설정 문자열
         */
        compress: string | null;
        /**
         * 반영할 표본 배율
         */
        parsedDataScale: number;
        /**
         * 반영할 표본 오프셋
         */
        parsedDataOffset: number;
        /**
         * 반영할 공간 범위
         */
        parsedBoundingBox: {
            minx: number;
            miny: number;
            maxx: number;
            maxy: number;
        };
    };

export type { TileUrlParam, U3dHeightInflatedBuffer, U3dHeightTilePayload, U3dHeightXYZFormatState, U3dHeightXYZLayerCO, U3dHeightXYZLayerCO_Content, U3dHeightXYZParsedSettings, U3dHeightXYZSampleState };
