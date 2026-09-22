// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayerCO } from "./U3dLayer.types.js";
import type { UCanvasTexture } from "../core/texture/UCanvasTexture.js";
import type { UTexture } from "../core/texture/UTexture.js";

/**
     * ~extends import('@U3dLayer').U3dLayerCO <br>
     * 생성자 옵션
     */
    type U3dImageLayerCO_Content = {
        /**
         * 레이어 투명 여부 `false`일 경우 `투명도`가 적용되지 않습니다.
         */
        transparent?: boolean;
        /**
         * 설정된 레벨의 타일 이미지는 부모 타일의 이미지를 내부적으로 렌더링하여 표출합니다.
         */
        burnLevels?: Array<number>;
        /**
         * 텍스쳐 UV Y축 반전 여부
         */
        flipY?: boolean;
        /**
         * 텍스처 파싱 커스텀 함수
         */
        parseFunction?: Function | null;
        /**
         * 데이터 캐시 사용 여부
         */
        useDataCache?: boolean;
        /**
         * 레이어가 출력하는 객체의 밝기 값
         */
        brightness?: number;
        /**
         * 레이어가 출력하는 객체의 대비 값
         */
        contrast?: number;
        /**
         * 레이어가 출력하는 객체의 채도 값
         */
        saturation?: number;
        /**
         * 레이어가 출력하는 객체의 색조각도 값
         */
        hueRotation?: number;
        /**
         * 레이어가 출력하는 객체의 색상톤 값
         */
        lightColorTone?: three.ColorRepresentation;
        /**
         * 어두운 영역에 적용할 색상톤 값
         */
        darkColorTone?: three.ColorRepresentation;
        /**
         * 밝은 색상톤 적용 여부
         */
        lightColorToneEnabled?: boolean;
        /**
         * 어두운 색상톤 적용 여부
         */
        darkColorToneEnabled?: boolean;
        /**
         * 밝은 색 적용 민감도
         */
        lightColorToneExposure?: number;
        /**
         * 어두운 색 적용 민감도
         */
        darkColorToneExposure?: number;
    };

/**
     * ~extends import('@U3dLayer').U3dLayerCO <br>
     * 생성자 옵션
     */
    type U3dImageLayerCO = Omit<Omit<U3dLayerCO, never> & U3dImageLayerCO_Content, never>;

/**
     * 텍스쳐 맵을 가진 머터리얼 확장 타입
     */
    type MaterialWithMap_Content = {
        map?: UTexture | UCanvasTexture | undefined;
        _oriMap?: UTexture | UCanvasTexture | undefined;
        transparent?: boolean;
        needsUpdate?: boolean;
        opacity?: number;
        /**
         * 이미지 레이어 기준 투명 상태 설정 함수
         */
        setTerrainBaseTransparent?: (transparent: boolean) => void;
        clippingPlanes?: Array<three.Plane> | null;
        depthWrite?: boolean;
    };

/**
     * 텍스쳐 맵을 가진 머터리얼 확장 타입
     */
    type MaterialWithMap = three.Material & MaterialWithMap_Content;

/**
     * 매쉬/머터리얼 통합 입력 타입
     */
    type MeshWithMaterial_Content = {
        material?: MaterialWithMap | Array<MaterialWithMap> | undefined;
        geometry?: three.BufferGeometry | undefined;
    };

/**
     * 매쉬/머터리얼 통합 입력 타입
     */
    type MeshWithMaterial = three.Object3D & MeshWithMaterial_Content;

/**
     * 이미지 타일 URL 작업의 선택 동작입니다. <br>
     * 이미지 타일은 화면에서 제외된 뒤 응답이 도착해도 더 이상 사용할 수 없으므로 요청별 취소를 기본으로
     * 사용합니다. 자체 worker나 외부 렌더러가 요청 수명을 관리하는 특수 하위 레이어만 `abortNetwork:false`를
     * 명시하여 기존 호환 경로를 선택합니다. 현재 실제 네트워크 AbortController는 일반 래스터 이미지 요청에
     * 적용되며, PBF/MVT처럼 별도 파일 로더를 사용하는 경로는 논리 작업만 취소되고 네트워크 중단은 후속 개선
     * 대상입니다.
     */
    type ImageTextureProcessOptions = {
        /**
         * 요청별 취소 경로를 사용할지 여부. 일반 래스터 이미지는 네트워크도 중단
         */
        abortNetwork?: boolean;
    };

/**
     * 하나의 타일 키에 대응하는 현재 이미지 요청 상태입니다. <br>
     * `_activeTextureRequests`에 저장되는 객체 형식을 문서화하여 하위 이미지 레이어가 요청 상태를 검사하거나
     * 전용 관측값을 추가할 때 기존 종료 규칙을 훼손하지 않도록 합니다.
     */
    type ImageTextureRequestState = {
        /**
         * 동일/상이 URL 교체 통계에 사용하는 관측용 요청 URL
         */
        url?: string;
        /**
         * 현재 로그 generation 안에서 요청을 구분하는 관측용 식별자
         */
        requestId?: number;
        /**
         * 취소가 요청되었는지 여부
         */
        cancelled: boolean;
        /**
         * deferred와 디버그 로그가 최종 종료되었는지 여부
         */
        logicalFinished: boolean;
        /**
         * `_countloadingTile` 증가분을 이 요청이 소유하는지 여부
         */
        loadingCounted: boolean;
        /**
         * 증가분을 이미 반환했는지 여부
         */
        loadingReleased: boolean;
        /**
         * 이 요청에 연결된 성능 관측 항목
         */
        debugEntry?: Record<string, any>;
        /**
         * 요청 전용 네트워크 제어 객체
         */
        networkHandle: undefined | ({
            cancel: () => boolean;
        } & Partial<{
            isCancelled: () => boolean;
            isSettled: () => boolean;
        }>);
        /**
         * 현재 요청을 멱등하게 취소하는 함수
         */
        cancel: (reason?: string) => void;
    };

/**
     * 머터리얼에 클리핑을 반영할 때 조회하는 최소 상태입니다.
     * 평면 배열은 레이어가 소유하며 반영 과정에서는 복사하거나 해제하지 않습니다.
     */
    type U3dImageLayerClippingState = {
        /**
         * 현재 클리핑 평면 목록입니다.
         */
        _clippingPlanes: Array<three.Plane> | null;
    };

export type { ImageTextureProcessOptions, ImageTextureRequestState, MaterialWithMap, MaterialWithMap_Content, MeshWithMaterial, MeshWithMaterial_Content, U3dImageLayerCO, U3dImageLayerCO_Content, U3dImageLayerClippingState };
