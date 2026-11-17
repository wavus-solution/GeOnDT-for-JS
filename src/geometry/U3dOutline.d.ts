// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { USpeedModelFilterMesh } from "./USpeedModelFilter.js";

/**
     * 파이프 본체 표면을 기록했을 때의 렌더 조건입니다.
     */
    type UTubeOutlineSurfaceCapture = {
        /**
         * 본체 버퍼·재질·카메라 깊이·깊이 보정·클리핑 조건. 사용자 셰이더는 렌더 호출도 포함
         */
        key: string;
        /**
         * 본체 월드 행렬
         */
        world: three.Matrix4;
        /**
         * 카메라 뷰 행렬
         */
        view: three.Matrix4;
        /**
         * 카메라 투영 행렬
         */
        projection: three.Matrix4;
        /**
         * 출력의 물리 픽셀 뷰포트
         */
        viewport: three.Vector4;
    };

/**
     * 한 파이프가 빌린 화면 영역별 깊이·경로 버퍼입니다.
     */
    type UTubeOutlineSurfaceEntry = {
        /**
         * 깊이와 경로를 기록하는 타깃
         */
        target: three.WebGLRenderTarget;
        /**
         * 할당된 색상·깊이 버퍼의 픽셀 수
         */
        pixels: number;
        /**
         * 출력 픽셀에서의 원점 X·Y와 텍스처 폭·높이
         */
        region: three.Vector4;
        /**
         * 현재 타깃에 기록된 렌더 조건
         */
        capture?: UTubeOutlineSurfaceCapture;
    };

/**
     * 전체 화면 한 장 이내의 파이프 표면 기록 캐시입니다.
     */
    type UTubeOutlineSurfaceCache = {
        /**
         * 등록된 색상 재질과 반납 콜백
         */
        users: Map<three.Material, () => void>;
        /**
         * 최근 사용 순서의 파이프별 기록
         */
        entries: Map<three.Material, UTubeOutlineSurfaceEntry>;
        /**
         * 현재 할당 픽셀 합계
         */
        pixels: number;
        /**
         * 현재 출력 뷰포트의 전체 픽셀 수
         */
        budget: number;
        /**
         * 해제된 사용자의 GPU 버퍼 반납
         */
        release: () => void;
    };

/**
     * 구 외곽선들이 공유하는 기존 장면 깊이의 GPU 복사본입니다.
     */
    type USphereOutlineDepth = {
        /**
         * 복사본을 소유하는 깊이 텍스처
         */
        texture: three.DepthTexture | null;
        /**
         * 깊이만 연결한 복사 대상
         */
        framebuffer: WebGLFramebuffer | null;
        /**
         * 복사한 렌더 호출 번호
         */
        frame: number;
        /**
         * 원래 렌더 타깃
         */
        target: three.WebGLRenderTarget | null;
        /**
         * 복사한 카메라
         */
        camera: three.Camera | null;
        /**
         * 복사한 장면
         */
        scene: three.Scene | null;
        /**
         * 복사한 물리 픽셀 뷰포트
         */
        viewport: three.Vector4;
        /**
         * 복사한 뷰 행렬
         */
        view: three.Matrix4;
        /**
         * 복사한 투영 행렬
         */
        projection: three.Matrix4;
        /**
         * 복사한 큐브 면
         */
        face: number;
        /**
         * 복사한 밉 단계
         */
        mip: number;
        /**
         * 현재 색상 렌더 목록의 구 외곽선
         */
        objects: Array<three.Mesh>;
        /**
         * 복사 대상 목록의 장면
         */
        objectsScene: three.Scene | null;
        /**
         * 첫 투명 객체의 그리기 직전에 실행할 예약
         */
        beforeDraw: WeakMap<three.Object3D, (scene: three.Scene, camera: three.Camera, material: three.Material) => void>;
        /**
         * 기본 캔버스에서 확인한 깊이 형식
         */
        defaultFormat: {
            format: three.DepthTexture["format"];
            type: three.TextureDataType;
        } | null;
        /**
         * 깊이를 사용하는 외곽선과 반납 콜백
         */
        users: Map<three.Material, () => void>;
        /**
         * 미실행 그리기 예약 취소
         */
        clearReservations: () => void;
        /**
         * 마지막 사용자 이후 GPU 자원과 장면 참조 반납
         */
        release: () => void;
    };

/**
     * 구가 있는 장면의 렌더 준비 콜백과 등록 재질입니다.
     */
    type USphereOutlineScene = {
        /**
         * 이 장면의 구 외곽선 재질
         */
        materials: Set<three.Material>;
        /**
         * 공유 장면 렌더 준비의 등록 해제
         */
        release: () => void;
    };

/**
     * 외곽선을 포함하는 엔진 렌더 본체입니다. 일반 도형의 UMesh와 별도 메시를 쓰는 속도 모델 필터를 포함합니다.
     */
    type UGeometryOutlineTarget = UMesh | USpeedModelFilterMesh;

/**
     * 도형별 외곽선 렌더 객체를 만드는 내부 생성 전략입니다.
     */
    type U3dOutlineFactory = (geometry: three.BufferGeometry) => three.Mesh | undefined;

/**
     * 모서리 연결부의 인접 정점과 재사용 투영 자료입니다.
     */
    type UOutlineCornerNode = {
        /**
         * 로컬 정점
         */
        position: three.Vector4;
        /**
         * 원근 나누기 전의 화면 X·Y와 clip W
         */
        screen: three.Vector3;
        /**
         * 근접면·원거리면 안의 유효 정점 여부
         */
        valid: boolean;
        /**
         * 화면 방향 또는 미터 원근 모드의 덮임 각도 구간
         */
        directions: Array<{
            neighbor: number;
            x: number;
            y: number;
            angle: number;
            endAngle: number;
        }>;
    };

/**
     * 보조 패스가 임시 교체한 재질과 이전 스타일 연결입니다.
     */
    type U3dOutlineMaterialState = {
        /**
         * 교체한 객체
         */
        object: three.Mesh;
        /**
         * 복원할 재질
         */
        material: three.Material | Array<three.Material>;
        /**
         * 이전 스타일 연결
         */
        styleMaterial: three.Material | Array<three.Material> | undefined;
    };

/**
     * 구의 축소 실루엣과 지형 가림을 기록하는 공유 마스크입니다.
     */
    type USphereOutlineMask = {
        /**
         * 색상 마스크 버퍼
         */
        target: three.WebGLRenderTarget;
        /**
         * 축소 구를 그리는 메시
         */
        mesh: three.Mesh;
        /**
         * 기존 지형 깊이 복사본
         */
        depth: {
            value: three.DepthTexture | null;
        };
        /**
         * 복사한 뷰포트
         */
        captured: {
            value: three.Vector4;
        };
        /**
         * 깊이 텍스처 크기
         */
        size: {
            value: three.Vector2;
        };
        /**
         * 마스크 크기
         */
        viewport: {
            value: three.Vector2;
        };
        /**
         * 지형 가림 검사 여부
         */
        enabled: {
            value: boolean;
        };
        /**
         * 마스크를 사용하는 외곽선과 반납 콜백
         */
        users: Map<three.Material, () => void>;
        /**
         * 사용자가 빌린 형상과 마지막 GPU 자원 반납
         */
        release: () => void;
    };

type UOutlineParentCullingRecord = {
        previous: three.Object3D["intersectsFrustum"];
        descriptor: PropertyDescriptor | undefined;
        check: three.Object3D["intersectsFrustum"];
        users: Set<three.Object3D>;
        epoch: number;
        frustum: three.Frustum | three.FrustumArray | undefined;
        visible: boolean;
    };

export type { U3dOutlineFactory, U3dOutlineMaterialState, UGeometryOutlineTarget, UOutlineCornerNode, UOutlineParentCullingRecord, USphereOutlineDepth, USphereOutlineMask, USphereOutlineScene, UTubeOutlineSurfaceCache, UTubeOutlineSurfaceCapture, UTubeOutlineSurfaceEntry };
