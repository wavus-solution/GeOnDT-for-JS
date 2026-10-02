// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { KeyValue } from "./global.js";

/**
     * OpenLayers Geometry 인터페이스
     */
    type OLGeometry = {
        /**
         * Geometry 1차원 좌표
         */
        flatCoordinates: Array<number>;
        intersectsExtent: (extent: number[]) => boolean;
        /**
         * Geometry 복제
         */
        clone: () => OLGeometry;
        /**
         * 좌표계 변환
         */
        transform: (src: string, dst: string) => OLGeometry;
        /**
         * 1차원 좌표 배열 반환
         */
        getFlatCoordinates: () => Array<number>;
        /**
         * 1차원 좌표 설정
         */
        setFlatCoordinates: (layout: string, ary: Array<number>, ends?: Array<number>) => void;
        /**
         * 레이아웃(`XY`,`XYZ` 등) 반환
         */
        getLayout: () => string;
        /**
         * 좌표 설정 (MultiPolygon은 4중 배열)
         */
        setCoordinates: (coords: Array<number> | Array<Array<number>> | Array<Array<Array<number>>> | Array<Array<Array<Array<number>>>>) => void;
        /**
         * 좌표 반환
         */
        getCoordinates: (...args: Array<any>) => Array<number> | Array<Array<number>> | Array<Array<Array<number>>>;
        /**
         * (LineString) t-위치 좌표
         */
        getCoordinateAt?: (t: number) => Array<number>;
        /**
         * (Polygon) 내부점
         */
        getInteriorPoint?: () => OLGeometry;
        /**
         * 마지막 좌표
         */
        getLastCoordinate?: () => Array<number>;
        /**
         * 해제
         */
        dispose?: () => void;
        /**
         * extent 반환 [minX, minY, maxX, maxY]
         */
        getExtent: () => Array<number>;
        /**
         * OpenLayers Geometry 타입을 반환하는 함수
         */
        getType: () => string;
    };

/**
     * OpenLayers Feature 인터페이스
     */
    type OLFeature = {
        /**
         * Feature 아이디 반환
         */
        getId: () => string | number | undefined;
        /**
         * Feature 아이디 설정
         */
        setId: (id: string | number) => void;
        /**
         * Feature 스타일 설정
         */
        setStyle: (style: OLStyle | null) => void;
        /**
         * Feature Geometry 설정
         */
        setGeometry: (geometry: OLGeometry | undefined) => void;
        /**
         * Geometry 반환
         */
        getGeometry: () => OLGeometry;
        /**
         * 좌표 반환
         */
        getGeoVertex: () => Array<number> | Array<Array<number>> | Array<Array<Array<number>>>;
        /**
         * Feature 속성 설정
         */
        setProperties: (properties: KeyValue, silent?: boolean) => void;
        /**
         * 속성 반환
         */
        getProperties: () => KeyValue;
        /**
         * Feature 복제
         */
        clone: () => OLFeature;
        /**
         * Feature 해제
         */
        dispose?: () => void;
        /**
         * 이벤트 리스너 등록
         */
        on: (event: string, listener: Function) => {
            listener: Function;
        };
        /**
         * 변경 이벤트 발생
         */
        changed: () => void;
        /**
         * Feature 고유 식별자
         */
        getUid: () => string;
        /**
         * (내부 Feature) 영역 설정
         */
        setExtent?: (extent: three.Box3) => void;
        /**
         * 그리기 중인 임시 Feature 여부
         */
        isDrawing_?: boolean;
        /**
         * WGS84 change 리스너 핸들
         */
        wgs84Change_?: Function;
        /**
         * OpenLayers 내부 UID <hidden>
         */
        ol_uid: string;
        /**
         * 검색 제외 여부 <hidden>
         */
        _excludeSearch?: boolean;
        /**
         * 변경 불가 여부 <hidden>
         */
        _nonChanged?: boolean;
        /**
         * 하이라이트 여부 <hidden>
         */
        _ishighLight?: boolean;
        /**
         * 스타일 백업 <hidden>
         */
        _style?: OLStyle;
        /**
         * 라벨 POI <hidden>
         */
        _label?: object;
    };

/**
     * OpenLayers Fill(채움) 스타일 인터페이스
     */
    type OLFill = {
        /**
         * 채움 색상 설정
         */
        setColor: (color: string) => void;
        /**
         * 채움 색상 반환
         */
        getColor: () => string;
        /**
         * 채움 투명도 (0 투명 ~ 1 불투명).
         *  ol 본래 속성이 아니라 이 프로젝트가 색과 별도로 투명도를 전달하려고 덧붙인 필드입니다 <hidden>
         */
        opacity?: number;
    };

/**
     * OpenLayers Stroke(외곽선) 스타일 인터페이스
     */
    type OLStroke = {
        /**
         * 외곽선 색상 설정
         */
        setColor: (color: string) => void;
        /**
         * 외곽선 두께 설정
         */
        setWidth: (width: number) => void;
        /**
         * 외곽선 색상 반환
         */
        getColor: () => string;
        /**
         * 외곽선 두께 반환
         */
        getWidth: () => number;
        /**
         * 외곽선 투명도 (0 투명 ~ 1 불투명).
         *  ol 본래 속성이 아니라 이 프로젝트가 색과 별도로 투명도를 전달하려고 덧붙인 필드입니다 <hidden>
         */
        opacity?: number;
    };

/**
     * OpenLayers Image 스타일 인터페이스
     */
    type OLImageStyle = {
        getSrc?: () => (string | undefined);
        getScale?: () => (number | undefined);
        getSize?: () => (Array<number> | undefined);
        getColor?: () => string | number | undefined;
    };

/**
     * OpenLayers Text 스타일 인터페이스
     */
    type OLTextStyle = {
        getText?: () => (string | undefined);
        getFill?: () => OLFill;
        getStroke?: () => OLStroke;
        getFont?: () => (string | undefined);
    };

/**
     * OpenLayers Style 인터페이스
     */
    type OLStyle = {
        /**
         * Fill 반환
         */
        getFill: () => OLFill;
        /**
         * Stroke 반환
         */
        getStroke: () => OLStroke;
        /**
         * ImageStyle 반환
         */
        getImage: () => (OLImageStyle | null | undefined);
        /**
         * TextStyle 반환
         */
        getText: () => (OLTextStyle | null | undefined);
        /**
         * geometry 설정
         */
        setGeometry: (geometry: OLGeometry | undefined) => void;
    };

/**
     * OpenLayers 타일 Source 인터페이스 (`ol.source.TileImage` 계열: `ol.source.WMTS`, `ol.source.XYZ`, `ol.source.TileWMS` 등). <br>
     * U3dOpenLayer·U3dImageWMTSLayer의 callback이 반환하는 OL layer가 보유하는 source로, 레이어가 타일 캐시 정리와
     * 네트워크 요청 추적·취소, 공유 수명 관리에 사용하는 멤버만 정의합니다.
     */
    type OLTileSource = {
        /**
         * 이벤트 리스너 등록(`tileloadstart`, `tileloadend`, `tileloaderror` 등). 해제용 키를 반환
         */
        on: (event: string | Array<string>, listener: Function) => any;
        /**
         * 이벤트 리스너 해제
         */
        un: (event: string | Array<string>, listener: Function) => void;
        /**
         * 내부 타일 캐시 비우기
         */
        clear: () => void;
        /**
         * source 해제. 이후 재사용할 수 없습니다
         */
        dispose: () => void;
        /**
         * source 좌표계(`ol.proj.Projection`)
         */
        getProjection: () => any;
        /**
         * 타일 격자(`ol.tilegrid.TileGrid`). WMTS는 `getMatrixIds()`를 가진 `ol.tilegrid.WMTS`
         */
        getTileGrid?: () => any;
        /**
         * 요청 URL 템플릿 목록
         */
        getUrls?: () => (Array<string> | null);
        /**
         * 타일 객체(`ol.ImageTile`) 조회
         */
        getTile: (z: number, x: number, y: number, pixelRatio: number, projection: any) => any;
        /**
         * 타일 이미지 로더 반환
         */
        getTileLoadFunction: () => (tile: any, src: string) => void;
        /**
         * 타일 이미지 로더 교체
         */
        setTileLoadFunction: (fn: (tile: any, src: string) => void) => void;
        /**
         * 현재 타일 이미지 로더 <hidden>
         */
        tileLoadFunction: (tile: any, src: string) => void;
        /**
         * source 좌표계 기준 타일 LRU 캐시(`ol.TileCache`) <hidden>
         */
        tileCache: any;
        /**
         * 재투영 대상 좌표계별 타일 캐시 <hidden>
         */
        tileCacheForProjection?: Record<string, any>;
        /**
         * source 상태(`ready`, `loading`, `error`)
         */
        getState: () => string;
        /**
         * 캐시를 비우고 다시 그리기 요청
         */
        refresh: () => void;
    };

export type { OLFeature, OLFill, OLGeometry, OLImageStyle, OLStroke, OLStyle, OLTextStyle, OLTileSource };
