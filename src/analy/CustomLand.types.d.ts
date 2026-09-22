// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dHeightXYZLayer } from "../3dLayer/U3dHeightXYZLayer.js";
import type { UBox3 } from "../core/UBox3.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { Double_Array, GeoPosition, WorldPosition } from "../types/global.types.js";

type CustomLandCO = {
        /**
         * 편집지형 ID
         */
        id?: string;
        /**
         * 편집지형 이름
         */
        name?: string;
        /**
         * 편집지형 drawArg
         */
        drawarg?: UDrawArg;
        /**
         * 편집지형 높이
         */
        height?: string | number;
        /**
         * 편집지형 vertex 좌표 리스트 (월드, EPSG:3857)
         */
        vertex?: Array<WorldPosition>;
        /**
         * 편집지형 vertex 좌표(위경도) 리스트
         */
        geoVertex?: Array<GeoPosition>;
        /**
         * 텍스처 매핑용 좌표(위경도)
         */
        textureGeoVertex?: Array<GeoPosition>;
        /**
         * 사용자 최초 입력 원본 좌표(위경도)
         */
        oriVertex?: Array<GeoPosition>;
        /**
         * 편집지형의 Bounding Box
         */
        box?: UBox3;
        /**
         * 편집지형의 가운데점 좌표 (월드, EPSG:3857)
         */
        center?: WorldPosition;
        /**
         * 편집지형의 가운데점 좌표(위경도)
         */
        geoCenter?: GeoPosition;
        /**
         * 지형 데이터가 저장되어 있는 URL 경로
         */
        url?: string;
        /**
         * UMF 1.x에 적용하는 레이어 전역 고도 복원 배율
         */
        heightScale?: number;
        /**
         * UMF 1.x에 적용하는 레이어 전역 고도 복원 오프셋
         */
        heightOffset?: number;
        unitHeight?: number;
        /**
         * 가시화 레벨
         */
        dataLevel?: number;
        dataLayer?: U3dHeightXYZLayer;
        /**
         * 미터단위
         */
        fixedResolution?: number | null;
        insideError?: boolean;
        /**
         * 경사도
         */
        inclineRate?: number;
        /**
         * 경사면 분석 여부
         */
        inclineEdit?: boolean;
        /**
         * 생성시 이미지를 덮어씌울건지 여부
         */
        useTexture?: boolean;
        /**
         * 덮어씌울 이미지의 URL
         */
        textureUrl?: string;
        /**
         * 경사면 vertex 좌표 리스트 (월드, EPSG:3857)
         */
        inclineVertex?: Array<WorldPosition>;
        /**
         * 경사면 vertex 좌표(위경도) 리스트
         */
        inclineGeoVertex?: Array<GeoPosition>;
        /**
         * 경사면 Bounding Box
         */
        inclineBox?: UBox3;
        insideIncline?: boolean;
        insidePrecision?: number;
        inclineBevelThickness?: number;
        inclineBevelSize?: number;
        /**
         * 경사면 시각화용 외곽 좌표(위경도)
         */
        drawGeoVertex?: Array<GeoPosition>;
    };

/**
     * Dem 데이터를 파싱하여 생성한 tile 데이터. <br>
     * 타일의 크기, 해상도, 면적, 바운딩 박스, 인덱스 등의 정보가 담겨 있다.
     */
    type DemTile = {
        /**
         * 기존 호환용 X축 타일 그리드 크기
         */
        size: number;
        /**
         * X축 표본 수
         */
        width: number;
        /**
         * Y축 표본 수
         */
        height: number;
        /**
         * 양자화를 풀기 전의 원시 높이 데이터 배열
         */
        data: ArrayLike<number>;
        /**
         * 이 타일에 적용할 고도 복원 배율
         */
        heightScale: number;
        /**
         * 이 타일에 적용할 고도 복원 오프셋
         */
        heightOffset: number;
        /**
         * UMF 2.0 헤더에 선언된 원시 NoData 표본값
         */
        noData: number | undefined;
        /**
         * x축 셀 해상도
         */
        dx: number;
        /**
         * y축 셀 해상도
         */
        dy: number;
        /**
         * 셀당 면적
         */
        areaPerCell: number;
        /**
         * 타일 바운딩 박스 [minX, minY, maxX, maxY]
         */
        box: Array<number>;
        /**
         * 타일 x 인덱스
         */
        x: number;
        /**
         * 타일 y 인덱스
         */
        y: number;
        /**
         * 타일 zoom 레벨
         */
        z: number;
        /**
         * 역방향 y 인덱스
         */
        reverseY: number;
    };

type DemMask = {
        /**
         * 원본 영역에 포함되는 그리드 인덱스 리스트
         */
        original: Double_Array<number>;
        /**
         * 경사면 영역 인덱스 리스트
         */
        incline?: Array<{
            tileIndex: {
                x: number;
                y: number;
            };
            worldCoord: {
                x: number;
                y: number;
            };
        }>;
    };

type VolumeResult = {
        /**
         * 원본 부피
         */
        before: number;
        /**
         * 편집 부피
         */
        after: number;
        /**
         * 절토량
         */
        cut: number;
        /**
         * 성토량
         */
        fill: number;
        /**
         * 포함된 셀 수
         */
        containShellCount: number;
        /**
         * 평균 높이
         */
        averageHeight: number;
        /**
         * 최저 높이
         */
        minHeight: number;
        /**
         * 최고 높이
         */
        maxHeight: number;
        /**
         * 경사면 원본 부피
         */
        inclineBefore?: number;
        /**
         * 경사면 편집 부피
         */
        inclineAfter?: number;
        /**
         * 경사면 절토량
         */
        inclineCut?: number;
        /**
         * 경사면 성토량
         */
        inclineFill?: number;
        /**
         * 경사면 포함된 셀 수
         */
        inclineShellCount?: number;
    };

export type { CustomLandCO, DemMask, DemTile, VolumeResult };
