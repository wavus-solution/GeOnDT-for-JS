// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../3dLayer/U3dLayer.js";
import type { U3dGeometryCO, U3dGeometryEMI } from "./U3dGeometry.types.js";
import type { U3dPOI } from "./U3dPOI.js";
import type { USpeedModelFilter } from "./USpeedModelFilter.js";

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * USpeedModelFilter 생성자 옵션 <br>
     */
    type USpeedModelFilterCO_Content = {
        /**
         * 필터 너비 <br>
         */
        width?: number;
        /**
         * 필터 높이 <br>
         */
        height?: number;
        /**
         * 너비 세분화 수 <br>
         */
        widthSegments?: number;
        /**
         * 높이 세분화 수 <br>
         */
        heightSegments?: number;
        /**
         * 전역 최소 밀도 <br>
         */
        globalMinDensity?: number;
        /**
         * 전역 최대 밀도 <br>
         */
        globalMaxDensity?: number;
        /**
         * 전역 밀도 사용 여부 <br>
         */
        useGlobalDensity?: boolean;
        /**
         * 최대 탐색 거리 <br>
         */
        maxDistance?: number;
        /**
         * 카메라로부터의 거리 <br>
         */
        distanceFromCamera?: number;
        /**
         * 카메라 추적 여부 <br>
         */
        followCamera?: boolean;
        /**
         * 카메라 객체 <br>
         */
        camera?: three.Camera;
        /**
         * 업데이트 최소 거리 <br>
         */
        updateMinDistance?: number;
        /**
         * 필터 데이터 목록 (각 점은 position 을 가진다) <br>
         */
        data?: Array<{
            position: three.Vector3Like;
        }>;
        /**
         * 업데이트 후 콜백 (필터 인스턴스와 갱신된 위치를 인자로 받음) <br>
         */
        onAfterUpdate?: (self: USpeedModelFilter, position: three.Vector3) => void;
        /**
         * 수직 스케일 <br>
         */
        verticalScale?: number;
        /**
         * 테두리 색상 <br>
         */
        borderColor?: three.ColorRepresentation;
        /**
         * 테두리 투명도 <br>
         */
        borderOpacity?: number;
    };

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * USpeedModelFilter 생성자 옵션 <br>
     */
    type USpeedModelFilterCO = Omit<Omit<U3dGeometryCO, never> & USpeedModelFilterCO_Content, never>;

/**
     * 마우스 검색 정보. 필터 위에서 마우스를 움직일 때 갱신되는 커서 위치·값과 표시용 POI들을 담는다. <br>
     */
    type USpeedModelFilterSearchInfo = {
        /**
         * mousemove 이벤트 식별 키 (검색 비활성 시 undefined) <br>
         */
        eventKey: string | null | undefined;
        /**
         * 깊이(수심)를 표시하는 POI <br>
         */
        depthPOI: U3dPOI | null | undefined;
        /**
         * 위치를 표시하는 POI <br>
         */
        positionPOI: U3dPOI | null | undefined;
        /**
         * 밀도 값을 표시하는 POI <br>
         */
        valuePOI: U3dPOI | null | undefined;
        /**
         * 커서가 가리키는 월드 좌표 <br>
         */
        cursorPosition: three.Vector3 | undefined;
        /**
         * 커서 위치의 UV 좌표 <br>
         */
        cursorUV: three.Vector2 | undefined;
        /**
         * 커서 위치의 밀도 값 <br>
         */
        cursorValue: number;
    };

/**
     * ~extends import('three').Mesh <br>
     *
     * 속도 모델 필터 메시. `THREE.Mesh`에 스케일·레이어 제어 메서드를 추가한 타입이다. <br>
     */
    type USpeedModelFilterMesh_Content = {
        /**
         * 수직 스케일 비율을 설정한다 <br>
         */
        setScaleRatio: (ratio: number) => void;
        /**
         * 레이어를 설정한다 (레이어의 app에 렌더 전 콜백을 등록) <br>
         */
        setLayer: (layer: U3dLayer) => void;
    };

/**
     * ~extends import('three').Mesh <br>
     *
     * 속도 모델 필터 메시. `THREE.Mesh`에 스케일·레이어 제어 메서드를 추가한 타입이다. <br>
     */
    type USpeedModelFilterMesh = three.Mesh & USpeedModelFilterMesh_Content;

/**
     * ~extends Record<number, Float32Array> <br>
     *
     * 밀도 데이터를 담는 3중(triple) 버퍼 관리 객체. 숫자 인덱스(0/1/2)로 각 버퍼(Float32Array)에 접근하며, `buffer()`로 다음 버퍼를 순환 반환한다. <br>
     */
    type USpeedModelFilterDataBuffer_Content = {
        /**
         * 버퍼 개수 (3) <br>
         */
        total: number;
        /**
         * 현재 사용 중인 버퍼 인덱스 <br>
         */
        now: number;
        /**
         * 다음 버퍼로 순환하며 해당 Float32Array를 반환한다 <br>
         */
        buffer: () => Float32Array;
    };

/**
     * ~extends Record<number, Float32Array> <br>
     *
     * 밀도 데이터를 담는 3중(triple) 버퍼 관리 객체. 숫자 인덱스(0/1/2)로 각 버퍼(Float32Array)에 접근하며, `buffer()`로 다음 버퍼를 순환 반환한다. <br>
     */
    type USpeedModelFilterDataBuffer = Record<number, Float32Array> & USpeedModelFilterDataBuffer_Content;

/**
     * ~extends Float32Array <br>
     *
     * 밀도 값이 채워진 단일 버퍼. `Float32Array` 에 최소/최대 밀도 값이 부가된 형태이다. <br>
     */
    type USpeedModelFilterDensityBuffer_Content = {
        /**
         * 버퍼 내 최소 밀도 값 <br>
         */
        min: number;
        /**
         * 버퍼 내 최대 밀도 값 <br>
         */
        max: number;
    };

/**
     * ~extends Float32Array <br>
     *
     * 밀도 값이 채워진 단일 버퍼. `Float32Array` 에 최소/최대 밀도 값이 부가된 형태이다. <br>
     */
    type USpeedModelFilterDensityBuffer = Float32Array & USpeedModelFilterDensityBuffer_Content;

/**
     * ~extends U3dGeometryEMI <br>
     *
     * 밀도 필터가 발생시키는 이벤트 이름 모음입니다. <br>
     * `filter.on(USpeedModelFilter.EVENT.UPDATE, handler)`처럼 리스너를 등록할 때 사용합니다. <br>
     */
    type USpeedModelFilterEMI_Content = {
        /**
         * `getFilterValue`로 조회한 밀도 값을 커서에 반영한 뒤 발생합니다. <br>
         * `data`에 조회 위치와 밀도 값이 담깁니다 <br>
         */
        SEARCH: string;
        /**
         * 카메라 이동으로 필터 위치를 갱신하기 직전에 발생합니다. <br>
         * `data`에 갱신 전 필터 위치가 담깁니다 <br>
         */
        BEFORE_UPDATE: string;
        /**
         * 밀도 계산이 끝나 필터 위치와 텍스처를 갱신한 뒤 발생합니다. <br>
         * `data`에 갱신된 위치가 담깁니다 <br>
         */
        UPDATE: string;
    };

/**
     * ~extends U3dGeometryEMI <br>
     *
     * 밀도 필터가 발생시키는 이벤트 이름 모음입니다. <br>
     * `filter.on(USpeedModelFilter.EVENT.UPDATE, handler)`처럼 리스너를 등록할 때 사용합니다. <br>
     */
    type USpeedModelFilterEMI = U3dGeometryEMI & USpeedModelFilterEMI_Content;

export type { USpeedModelFilterCO, USpeedModelFilterCO_Content, USpeedModelFilterDataBuffer, USpeedModelFilterDataBuffer_Content, USpeedModelFilterDensityBuffer, USpeedModelFilterDensityBuffer_Content, USpeedModelFilterEMI, USpeedModelFilterEMI_Content, USpeedModelFilterMesh, USpeedModelFilterMesh_Content, USpeedModelFilterSearchInfo };
