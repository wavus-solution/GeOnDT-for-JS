// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { KmlStyleFunction, U3dModelKmlLayerCO, U3dModelKmlLayerEMI } from "./U3dModelKmlLayer.types.js";
import type { U3dVectorLayer } from "./U3dVectorLayer.js";
import type { U3dVectorLayerEMI } from "./U3dVectorLayer.types.js";
import type { U3dGeometry } from "../geometry/U3dGeometry.js";

/**
 * ~extends import('@union3d/3dLayer/U3dVectorLayer').U3dVectorLayer <br>
 *
 * KML 또는 KMZ 파일의 지리 형상을 3D 객체로 변환해 표시하는 레이어 클래스입니다.
 *
 * @group 3dLayer
 * @extends {U3dVectorLayer}
 */
declare class U3dModelKmlLayer extends U3dVectorLayer {
    /**
     * 이 레이어가 발생시키는 이벤트 이름 모음입니다. <br>
     * 부모 레이어의 이벤트 이름에 `U3dModelKmlLayerEMD`의 이름을 더한 객체입니다.
     *
     * @override
     *
     * @type {U3dVectorLayerEMI & U3dModelKmlLayerEMI}
     */
    static override EVENT: U3dVectorLayerEMI & U3dModelKmlLayerEMI;
    /**
     * KML 피처에 개별 스타일이 없을 때 적용할 점·선·폴리곤의 기본 표시 설정입니다.
     *
     * @type {{pointSize: number, pointColor: import('three').ColorRepresentation, lineWidth: number, lineColor: import('three').ColorRepresentation, polygonColor: import('three').ColorRepresentation, polygonOpacity: number, polygonHeight: number}}
     */
    static DefaultStyle: {
        pointSize: number;
        pointColor: three.ColorRepresentation;
        lineWidth: number;
        lineColor: three.ColorRepresentation;
        polygonColor: three.ColorRepresentation;
        polygonOpacity: number;
        polygonHeight: number;
    };
    /**
     * 이 레이어가 단일 형상으로 변환해 처리하는 KML 형상 종류 목록입니다.
     *
     * @type {Array<string>}
     */
    static GeometryType: Array<string>;
    /**
     * U3dModelKmlLayer 클래스 생성자입니다.<br>
     * KML 텍스트·바이너리 데이터 또는 파일 경로 중 제공된 입력으로 3D 형상 변환을 시작합니다.<br>
     * kmlText, kmlData, baseUrl 순서로 먼저 제공된 입력을 사용합니다.
     *
     * @param {U3dModelKmlLayerCO} opt 레이어 생성 설정
     */
    constructor(opt: U3dModelKmlLayerCO);
    /**
     * 현재 KML 또는 KMZ 파일을 불러와 변환하는 작업입니다.
     *
     * @type {Promise<U3dModelKmlLayer> | null}
     */
    _loadingPromise: Promise<U3dModelKmlLayer> | null;
    /**
     * 생성한 3D 형상을 고유 ID로 찾기 위한 목록입니다.
     *
     * @type {Map<string, import('@U3dGeometry').U3dGeometry>}
     */
    _geometryIdMap: Map<string, U3dGeometry>;
    /**
     * 다음에 생성할 3D 형상의 ID에 붙일 순번입니다.
     *
     * @type {number}
     */
    _geometrySequence: number;
    /**
     * 폴리곤 높이를 읽을 KML 속성 이름입니다.
     *
     * @type {string}
     */
    _heightField: string;
    /**
     * KML 피처별 표시 설정을 반환하는 사용자 스타일 함수입니다.
     *
     * @type {KmlStyleFunction | undefined}
     */
    _styleFunction: KmlStyleFunction | undefined;
    /**
     * KMZ 압축을 풀어 얻은 엔트리 경로와 바이트의 대응표입니다.<br>
     * KML 입력에서는 null입니다.
     *
     * @type {Record<string, Uint8Array> | null}
     */
    _kmzAssets: Record<string, Uint8Array> | null;
    /**
     * KMZ 내부 리소스에서 만든 object URL을 엔트리 경로로 관리하는 목록입니다.
     *
     * @type {Map<string, string>}
     */
    _kmzObjectUrls: Map<string, string>;
    _baseUrl: any;
    /**
     * 현재 파일 경로의 KML 또는 KMZ를 다시 불러와 레이어 형상을 교체합니다.<br>
     * 파일 경로 없이 텍스트 또는 바이너리 데이터로 생성한 레이어에서는 사용할 수 없습니다.
     *
     * @returns {Promise<U3dModelKmlLayer>} 변환이 끝난 현재 레이어
     */
    reload(): Promise<U3dModelKmlLayer>;
    /**
     * ID 값으로 해당하는 Geometry를 반환하는 메서드입니다.
     *
     * @param {string} geometryId Geometry ID
     *
     * @returns {import('@U3dGeometry').U3dGeometry | undefined} 일치하는 3D 형상이며 없으면 undefined
     */
    getGeometryById(geometryId: string): U3dGeometry | undefined;
    #private;
}

export type { U3dModelKmlLayer };
