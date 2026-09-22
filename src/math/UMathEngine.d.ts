// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UGPoint } from "./UGPoint.js";
import type { UGeoRect } from "./UGeoRect.js";
import type { UMercator } from "./UMercator.js";

/**
 * 3D 공간·지도 좌표 변환과 거리·면적 계산을 제공하는 정적 유틸리티 클래스입니다.
 *
 * @summary 3D 및 지도 좌표 연산 유틸리티
 */
declare class UMathEngine {
    /**
     * Web Mercator 좌표 변환 유틸 객체를 반환하는 함수
      *
     * @returns {import('@union3d/math/UMercator').UMercator} Web Mercator 좌표 변환 유틸 객체
     */
    static getMercator(): UMercator;
    /**
     * 월드 좌표(EPSG:3857)를 픽셀 좌표로 변환합니다.
     *
     * @param {number} mx 월드 좌표(EPSG:3857)의 x 값
     * @param {number} my 월드 좌표(EPSG:3857)의 y 값
     * @param {number} zoom 타일 줌 레벨
     * @returns {{x: number, y: number}} 픽셀 좌표
     */
    static MetersToPixels(mx: number, my: number, zoom: number): {
        x: number;
        y: number;
    };
    /**
     * 픽셀 좌표를 월드 좌표(EPSG:3857)로 변환합니다.
     *
     * @param {number} mx 픽셀 x 좌표
     * @param {number} my 픽셀 y 좌표
     * @param {number} zoom 타일 줌 레벨
     * @returns {{x: number, y: number}} 월드 좌표(EPSG:3857)의 x·y 값
     */
    static PixelsToMeters(mx: number, my: number, zoom: number): {
        x: number;
        y: number;
    };
    /**
     * 월드 좌표(EPSG:3857)가 속한 타일 인덱스를 반환합니다.
     *
     * @param {number} mx 월드 좌표(EPSG:3857)의 x 값
     * @param {number} my 월드 좌표(EPSG:3857)의 y 값
     * @param {number} zoom 타일 줌 레벨
     * @returns {{x: number, y: number}} 타일 인덱스 좌표
     */
    static MetersToTile(mx: number, my: number, zoom: number): {
        x: number;
        y: number;
    };
    /**
     * 픽셀 좌표를 래스터 좌표로 변환하는 함수
     *
     * @param {number} mx 픽셀 x 좌표
     * @param {number} my 픽셀 y 좌표
     * @param {number} zoom 타일 줌 레벨
     * @returns {{x: number, y: number}} 래스터 좌표
     */
    static PixelsToRaster(mx: number, my: number, zoom: number): {
        x: number;
        y: number;
    };
    /**
     * 타일 인덱스에 해당하는 월드 좌표(EPSG:3857) 영역을 반환합니다.
     *
     * @param {number} mx 타일 x 인덱스
     * @param {number} my 타일 y 인덱스
     * @param {number} zoom 타일 줌 레벨
     * @returns {Array<number>} 월드 좌표(EPSG:3857) 영역 [minX, minY, maxX, maxY]
     */
    static TileBounds(mx: number, my: number, zoom: number): Array<number>;
    /**
     * 타일 인덱스와 줌 레벨로 해당 타일의 월드 좌표(EPSG:3857) 영역을 반환합니다.
     *
     * @param {number} [x=1] 구글맵 타일의 x 인덱스
     * @param {number} [y=0] 구글맵 타일의 y 인덱스
     * @param {number} [level=1] 구글맵 타일의 줌 레벨
     * @returns {import('@UGeoRect').UGeoRect} 타일의 영역정보
     */
    static getGoogleRectangleDefine(x?: number, y?: number, level?: number): UGeoRect;
    /**
     * 월드 좌표(EPSG:3857)가 속한 타일 인덱스와 레벨을 반환합니다.
     *
     * @param {number} googleX 월드 좌표(EPSG:3857)의 x 값
     * @param {number} googleY 월드 좌표(EPSG:3857)의 y 값
     * @param {number} level 타일 레벨
     * @returns {{x: number, y: number, level: number}} 타일의 인덱스 정보
     */
    static getGoogleToIndexXY(googleX: number, googleY: number, level: number): {
        x: number;
        y: number;
        level: number;
    };
    /**
     * 타일 줌 레벨의 월드 좌표(EPSG:3857) 해상도를 반환합니다.
     *
     * @param {number} level 타일 줌 레벨
     * @returns {number} 픽셀 하나에 대응하는 월드 좌표(EPSG:3857) 거리
     */
    static googleResolution(level: number): number;
    /**
     * 월드 좌표(EPSG:3857)가 속한 타일 인덱스 배열을 반환합니다.
     *
     * @param {number} googleX 월드 좌표(EPSG:3857)의 x 값
     * @param {number} googleY 월드 좌표(EPSG:3857)의 y 값
     * @param {number} tilelevel 타일 레벨
     * @param {boolean} reverseX x축 타일 인덱스 반전 여부
     * @param {boolean} reverseY y축 타일 인덱스 반전 여부
     * @returns {Array<number>} 타일 인덱스 [x, y]
     */
    static getIndexXY(googleX: number, googleY: number, tilelevel: number, reverseX: boolean, reverseY: boolean): Array<number>;
    /**
     * 월드 좌표(EPSG:3857)에 맞는 이미지 타일 URL을 만듭니다.<br>
     * 축 반전 옵션을 적용한 뒤 확장자를 포함한 URL 문자열을 반환합니다.
     *
     * @param {number} googleX 월드 좌표(EPSG:3857)의 x 값
     * @param {number} googleY 월드 좌표(EPSG:3857)의 y 값
     * @param {string} baseUrl 타일 서버의 기본 URL
     * @param {number} startlevel 기본 줌 레벨
     * @param {number} tilelevel 기본 줌 레벨에 더할 타일 레벨
     * @param {boolean} reverseX x 타일 인덱스를 반전할지 여부
     * @param {boolean} reverseY y 타일 인덱스를 반전할지 여부
     * @param {string} [ext='.jpeg'] URL 끝에 붙일 파일 확장자
     * @returns {string} 계산한 줌 레벨과 타일 인덱스를 포함한 URL
     */
    static createUrl(googleX: number, googleY: number, baseUrl: string, startlevel: number, tilelevel: number, reverseX: boolean, reverseY: boolean, ext?: string): string;
    /**
     * 월드 좌표(EPSG:3857)에 맞는 3DF 형식 파일의 URL을 생성합니다.
     *
     * @param {number} googleX 월드 좌표(EPSG:3857)의 x 값
     * @param {number} googleY 월드 좌표(EPSG:3857)의 y 값
     * @param {string} baseUrl 타일 서버의 기본 URL
     * @param {number} tilelevel 사용할 줌 레벨
     * @param {boolean} reverseX x 타일 인덱스를 반전할지 여부
     * @param {boolean} reverseY y 타일 인덱스를 반전할지 여부
     * @param {string} [filename] URL 끝에 붙일 파일 이름
     * @returns {string} 계산한 타일 경로와 파일 이름을 포함한 URL
     */
    static createUrl3DF(googleX: number, googleY: number, baseUrl: string, tilelevel: number, reverseX: boolean, reverseY: boolean, filename?: string): string;
    /**
     * 영역(Rectangle) 생성 함수
     *
     * @param {number} minx 영역의 최소값 x
     * @param {number} miny 영역의 최소값 y
     * @param {number} maxx 영역의 최대값 x
     * @param {number} maxy 영역의 최대값 y
     * @param {number} width 영역의 너비
     * @param {number} height 영역의 높이
     * @param {string} [modelname] 영역의 이름
     * @returns {import('@union3d/math/UGeoRect').UGeoRect} 영역(Rectangle)
     */
    static createUGeoRect(minx: number, miny: number, maxx: number, maxy: number, width: number, height: number, modelname?: string): UGeoRect;
    /**
     * WGS84 위경도 좌표계(EPSG:4326)를 웹 메르카토르(Web Mercator) 월드 좌표(EPSG:3857)로 변환합니다.<br>
     * x는 경도(도), y는 위도(도), height는 실제 높이(m)입니다.
     *
     * @param {number} GeographicX WGS84 위경도 좌표계(EPSG:4326)의 경도(도)
     * @param {number} GeographicY WGS84 위경도 좌표계(EPSG:4326)의 위도(도)
     * @param {number} [height=0] 실제 높이(m)
     * @returns {import('@UGPoint').UGPoint} 웹 메르카토르(Web Mercator) 월드 좌표(EPSG:3857)의 x·y와 위도별 축척으로 환산한 z 값
     */
    static getGeographicToGoogle(GeographicX: number, GeographicY: number, height?: number): UGPoint;
    /**
     * 웹 메르카토르(Web Mercator) 월드 좌표(EPSG:3857)를 WGS84 위경도 좌표계(EPSG:4326)로 변환합니다.<br>
     * height는 월드 좌표(EPSG:3857)의 z 값이며, 반환 z 값은 실제 높이(m)입니다.
     *
     * @param {number} GoogleX 웹 메르카토르(Web Mercator) 월드 좌표(EPSG:3857)의 x 값
     * @param {number} GoogleY 웹 메르카토르(Web Mercator) 월드 좌표(EPSG:3857)의 y 값
     * @param {number} [height=0] 웹 메르카토르(Web Mercator) 월드 좌표(EPSG:3857)의 z 값
     * @returns {import('@UGPoint').UGPoint} WGS84 위경도 좌표계(EPSG:4326)의 경도·위도와 실제 높이(m)
     */
    static getGoogleToGeographic(GoogleX: number, GoogleY: number, height?: number): UGPoint;
    /**
     * 웹 메르카토르(Web Mercator) 월드 좌표(EPSG:3857)의 y 값을 WGS84 위경도 좌표계(EPSG:4326)의 위도(도)로 변환합니다.
     *
     * @param {number} googleY 웹 메르카토르(Web Mercator) 월드 좌표(EPSG:3857)의 y 값
     * @returns {number} WGS84 위경도 좌표계(EPSG:4326)의 위도(도)
     */
    static getGoogleToGeographicY(googleY: number): number;
    /**
     * 웹 메르카토르(Web Mercator) 월드 좌표(EPSG:3857)의 x 값을 WGS84 위경도 좌표계(EPSG:4326)의 경도(도)로 변환합니다.
     *
     * @param {number} googleX 웹 메르카토르(Web Mercator) 월드 좌표(EPSG:3857)의 x 값
     * @returns {number} WGS84 위경도 좌표계(EPSG:4326)의 경도(도)
     */
    static getGoogleToGeographicX(googleX: number): number;
    /**
     * 도(degree) 값을 라디안(radian)으로 변환하는 함수
     *
     * @param {number} degrees 도(degree) 값
     * @returns {number} 변환된 라디안(radian) 값
     */
    static DegreesToRadians(degrees: number): number;
    /**
     * 라디안(radian) 값을 도(degree)로 변환하는 함수
     *
     * @param {number} radians 라디안 값
     * @returns {number} 변환된 도(degree) 값
     */
    static RadiansToDegrees(radians: number): number;
    /**
     * 좌표 객체를 새 Vector3로 변환합니다.<br>
     * 누락된 x·y·z는 0으로 기록하므로 입력 객체도 변경됩니다.
     *
     * @param {Partial<import('three').Vector3Like> | undefined} obj 변환할 좌표 객체 또는 undefined
     * @returns {import('three').Vector3 | undefined} 변환한 새 Vector3 또는 입력이 undefined일 때 undefined
     */
    static objectToVector3(obj: Partial<three.Vector3Like> | undefined): three.Vector3 | undefined;
    /**
     * 세 점으로 정의한 평면 계수를 소수점 첫째 자리까지 반올림해 반환합니다.<br>
     * first를 전달하면 v1·v2·v3의 x·y에서 first의 x·y를 빼므로 세 벡터가 변경됩니다.
     *
     * @param {import('three').Vector3Like | '' | undefined} first 원점으로 뺄 기준점 또는 생략
     * @param {import('three').Vector3Like} v1 첫 번째 점이며 first가 있으면 x·y가 변경됨
     * @param {import('three').Vector3Like} v2 두 번째 점이며 first가 있으면 x·y가 변경됨
     * @param {import('three').Vector3Like} v3 세 번째 점이며 first가 있으면 x·y가 변경됨
     * @returns {{aValue: number, bValue: number, cValue: number, dValue: number}} 계산한 평면 계수
     */
    static Point3ToPlaneEquation(first: three.Vector3Like | "" | undefined, v1: three.Vector3Like, v2: three.Vector3Like, v3: three.Vector3Like): {
        aValue: number;
        bValue: number;
        cValue: number;
        dValue: number;
    };
    /**
     * 위도에서 월드 좌표(EPSG:3857) 한 단위를 실제 미터로 환산하는 배율을 반환합니다.<br>
     * 숫자를 넣으면 위도(도)로, 벡터를 넣으면 y 성분을 위도로 사용합니다.
     *
     * @param {import('three').Vector3Like | number} geographicVector 위도(도) 또는 y 성분에 위도를 담은 벡터
     * @returns {number} 0.001 이상 1 이하의 미터 환산 배율
     */
    static getRealScaleAtGeographic(geographicVector: three.Vector3Like | number): number;
    /**
     * 월드 좌표(EPSG:3857)의 y 값에서 한 단위를 실제 미터로 환산하는 배율을 반환합니다.<br>
     * 숫자를 넣으면 월드 좌표(EPSG:3857)의 y 값으로, 벡터를 넣으면 y 성분으로 사용합니다.
     *
     * @param {import('three').Vector3Like | number} googleVector 월드 좌표(EPSG:3857)의 y 값 또는 y 성분을 담은 벡터
     * @returns {number} 0.001 이상 1 이하의 미터 환산 배율
     */
    static getRealScaleAtGoogle(googleVector: three.Vector3Like | number): number;
    /**
     * 두 월드 좌표(EPSG:3857) 사이의 3차원 실제 거리를 미터로 반환합니다.<br>
     * x·y는 WGS84 측지 거리로, 월드 좌표(EPSG:3857)의 z는 두 지점의 평균 환산 배율로 실제 높이 차로 계산합니다.
     *
     * @param {import('three').Vector3Like} googleVec1 첫 번째 월드 좌표(EPSG:3857)
     * @param {import('three').Vector3Like} googleVec2 두 번째 월드 좌표(EPSG:3857)
     * @returns {number} 두 점 사이의 실제 거리(m)
     */
    static getMeterDistanceByGooglePoints(googleVec1: three.Vector3Like, googleVec2: three.Vector3Like): number;
    /**
     * 월드 좌표(EPSG:3857) 점 목록으로 만든 다각형의 수평 면적을 반환합니다.<br>
     * z 값은 사용하지 않으며, 유효한 점이 세 개 미만이면 0을 반환합니다.<br>
     * 마지막 점은 첫 점과 같아도 되며, 반환 면적은 항상 0 이상입니다.
     *
     * @param {Array<import('three').Vector3Like>} googleVectors 다각형을 이루는 월드 좌표(EPSG:3857) 점 목록
     * @returns {number} 실제 수평 면적(m²)
     */
    static getMeterAreaByGooglePoints(googleVectors: Array<three.Vector3Like>): number;
    /**
     * 월드 좌표(EPSG:3857)의 시작점에서 방향 벡터를 따라 실제 거리만큼 이동한 점을 반환합니다.<br>
     * 시작점과 예상 도착점의 평균 환산 배율을 사용하며, 방향 벡터 길이는 정규화합니다.<br>
     * 방향 벡터가 영벡터이면 시작점을 반환하고, 음수 meter는 반대 방향으로 이동합니다.
     *
     * @param {import('three').Vector3Like} googleVec 시작 월드 좌표(EPSG:3857)
     * @param {import('three').Vector3Like} normalVec 이동 방향을 나타내는 벡터
     * @param {number} meter 이동할 실제 거리(m)
     * @param {import('three').Vector3} [target] 결과를 기록하고 반환할 Vector3이며, 생략하면 새 Vector3를 생성함
     * @returns {import('three').Vector3} 이동 결과가 기록된 target
     */
    static moveGooglePointByLongMeter(googleVec: three.Vector3Like, normalVec: three.Vector3Like, meter: number, target?: three.Vector3): three.Vector3;
    /**
     * 월드 좌표(EPSG:3857)의 시작점에서 방향 벡터를 따라 실제 거리만큼 이동한 점을 빠르게 반환합니다.<br>
     * 시작점 환산 배율만 사용하며, 방향 벡터 길이는 정규화합니다.<br>
     * 방향 벡터가 영벡터이면 시작점을 반환하고, 음수 meter는 반대 방향으로 이동합니다.
     *
     * @param {import('three').Vector3Like} googleVec 시작 월드 좌표(EPSG:3857)
     * @param {import('three').Vector3Like} normalVec 이동 방향을 나타내는 벡터
     * @param {number} meter 이동할 실제 거리(m)
     * @param {import('three').Vector3} [target] 결과를 기록하고 반환할 Vector3이며, 생략하면 새 Vector3를 생성함
     * @returns {import('three').Vector3} 이동 결과가 기록된 target
     */
    static moveGooglePointByShortMeter(googleVec: three.Vector3Like, normalVec: three.Vector3Like, meter: number, target?: three.Vector3): three.Vector3;
    /**
     * 월드 좌표(EPSG:3857) 배열에서 지정한 점과 가장 가까운 선분을 찾습니다.<br>
     * 유효한 선분이 없으면 target을 변경하지 않고 undefined를 반환합니다.<br>
     * 반환 t는 0 이상 1 이하이며, distanceSq는 월드 좌표(EPSG:3857) 차이의 제곱입니다.
     *
     * @param {Array<import('three').Vector3Like>} worldPositions 월드 좌표(EPSG:3857) 배열
     * @param {import('three').Vector3Like} worldPoint 검사할 월드 좌표(EPSG:3857)
     * @param {import('three').Vector3} [target] 가장 가까운 점을 받을 재사용 Vector3
     * @returns {{index: number, t: number, point: import('three').Vector3, distanceSq: number} | undefined} 선분 시작 인덱스, 선분 비율, 최근접점, 거리 제곱 또는 undefined
     */
    static getClosestSegmentInfo(worldPositions: Array<three.Vector3Like>, worldPoint: three.Vector3Like, target?: three.Vector3): {
        index: number;
        t: number;
        point: three.Vector3;
        distanceSq: number;
    } | undefined;
    /**
     * 월드 좌표(EPSG:3857) 배열에서 지정한 점과 가장 가까운 점을 찾습니다.<br>
     * 유효한 점이 없으면 target을 변경하지 않고 undefined를 반환합니다.<br>
     * distanceSq는 월드 좌표(EPSG:3857) 차이의 제곱입니다.
     *
     * @param {Array<import('three').Vector3Like>} worldPositions 월드 좌표(EPSG:3857) 배열
     * @param {import('three').Vector3Like} worldPoint 검사할 월드 좌표(EPSG:3857)
     * @param {import('three').Vector3} [target] 가장 가까운 점을 받을 재사용 Vector3
     * @returns {{index: number, point: import('three').Vector3, distanceSq: number} | undefined} 점 인덱스, 최근접점, 거리 제곱 또는 undefined
     */
    static getClosestPointInfo(worldPositions: Array<three.Vector3Like>, worldPoint: three.Vector3Like, target?: three.Vector3): {
        index: number;
        point: three.Vector3;
        distanceSq: number;
    } | undefined;
}

export type { UMathEngine };
