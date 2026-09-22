// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelTilesLayerCO } from "./U3dModelTilesLayer.types.js";
import type { U3DTileset } from "../3dTiles/U3DTileset.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { DeferredObject } from "../util/deferred.types.js";

/**
     * ~extends import('@union3d/3dLayer/U3dModelTilesLayer').U3dModelTilesLayerCO <br>
     * 생성자 옵션
     */
    type U3dVectorTileLayerCO_Content = {
        /**
         * Tiles 데이터 URL
         */
        baseurl: string;
        /**
         * 레이어 이름
         */
        name: string;
        /**
         * 폰트 패밀리
         */
        font?: string;
        /**
         * 폰트 크기
         */
        fontSize?: number;
        /**
         * label 또는 point 객체의 이미지 파일 경로 주소
         */
        imgUrl?: string;
        /**
         * label 또는 point 객체의 이미지 파일 확장자
         */
        imgExt?: string;
        /**
         * 공간 좌표를 기반으로 그룹화하기 위해 사용하는 반경 값 ( 값이 작을수록 더 세밀한 그룹화가 이루어지고, 값이 클수록 더 넓은 그룹화가 이루어집니다. )
         */
        clusterRadius?: number;
        /**
         * 캐시 크기
         */
        cacheSize?: number;
    };

/**
     * ~extends import('@union3d/3dLayer/U3dModelTilesLayer').U3dModelTilesLayerCO <br>
     * 생성자 옵션
     */
    type U3dVectorTileLayerCO = Omit<Omit<U3dModelTilesLayerCO, never> & U3dVectorTileLayerCO_Content, never>;

type VctrTile_Content = {
        /**
         * 타일 타입
         */
        type?: string;
        /**
         * 자식 타일 목록
         */
        children?: Array<VctrTile>;
        /**
         * 타일 레벨
         */
        level?: number;
        /**
         * 타일 ID
         */
        id?: number;
        /**
         * 월드 박스
         */
        worldBox?: three.Box3;
        /**
         * 뷰 박스
         */
        viewBox?: object;
        /**
         * 가시화 여부
         */
        visible?: boolean;
        /**
         * 삭제 여부
         */
        disposed?: boolean;
        /**
         * 사용자 데이터
         */
        userData?: Partial<{
            meshes: Array<three.Object3D>;
            geographic: object;
            google: object;
            epsg4978: object;
            boxHelper: three.Object3D;
        }>;
        /**
         * 렌더링 방식
         */
        refine?: string;
        /**
         * 변환 행렬
         */
        transform?: {
            elements: Array<number>;
        };
        /**
         * 부모 타일
         */
        parent?: VctrTile | null;
        /**
         * 지리 좌표
         */
        geographic?: object;
        /**
         * 구글 좌표
         */
        google?: object;
        /**
         * EPSG:4978 좌표
         */
        epsg4978?: object;
        /**
         * 바운딩 볼륨
         */
        boundingVolume?: Partial<{
            region: Array<number>;
        }>;
        /**
         * 원본 바운딩 값
         */
        originBoundingValue?: object;
        /**
         * 위치 업데이트 필요 여부
         */
        needPositionUpdate?: boolean;
        /**
         * 실패 메시지
         */
        failMsg?: string;
        /**
         * 기하 오차
         */
        geometricError?: number;
        /**
         * 업데이트 ID
         */
        updateId?: number;
        /**
         * 비동기 처리 객체
         */
        promise?: DeferredObject<U3dQuadTile>;
        /**
         * 완료 여부
         */
        complete?: boolean;
    };

type VctrTile = U3DTileset & VctrTile_Content;

export type { U3dVectorTileLayerCO, U3dVectorTileLayerCO_Content, VctrTile, VctrTile_Content };
