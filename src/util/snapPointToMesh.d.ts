// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { GeoPosition, WorldPositionVector3 } from "../types/global.js";

/**
 * 위경도(geo) 좌표를 mesh의 면(face)에 스냅(투영)해 월드 좌표상의 위치로 변환합니다.
 *
 * - 입력 mesh는 `UMesh`, `UU3fMesh`, `UWfsMesh` 등 `Mesh` 기반 클래스 어떤 것이든 가능합니다.
 * - 입력 좌표(geo)는 `{x:lon, y:lat, z:height}` 또는 `{lon, lat, height}` 형태를 모두 허용합니다.
 * - 클래스 인스턴스 없이 함수만 import해서 독립적으로 사용할 수 있습니다.
 *
 * 스냅 방식 (options.lockHeight):
 *   - false(기본): mesh 표면에서 입력점에 가장 가까운 점(3D 최단점)으로 스냅.
 *   - true       : 먼저 입력점에 가장 가까운 건물을 찾고, '그 건물' 안에서만
 *                  입력 높이(z)의 단면(벽)을 찾는다. 단면이 있으면 그 높이로 수평 스냅하고,
 *                  없으면 z 고정을 적용하지 않고 3D 스냅 결과를 쓴다.
 *
 * @param {import('three').Mesh} mesh UMesh / UU3fMesh / UWfsMesh
 * @param {GeoPosition} geo 위경도 좌표 `{x:경도, y:위도, z:높이}` (높이 생략 시 0)
 * @param {SnapOptions} [options]
 * @return {SnapResult | null} 스냅 실패시 null
 *
 * @example
 *   import {snapPointToMesh} from '@union3d/util/snapPointToMesh';
 *   const geo = UMathEngine.getGoogleToGeographic(wx, wy, wz); // {x:lon, y:lat, z:height}
 *   const result = snapPointToMesh(uu3fMesh, geo);                       // 3D 최단점
 *   const flat   = snapPointToMesh(uu3fMesh, geo, {lockHeight: true});   // 높이 고정, 수평 스냅
 */
declare function snapPointToMesh(mesh: three.Mesh, geo: GeoPosition, options?: SnapOptions): SnapResult | null;

/**
 * 이미 월드 좌표로 변환된 점을 mesh face에 스냅합니다.
 *
 * @param {import('three').Mesh} mesh
 * @param {WorldPositionVector3} worldPoint
 * @param {SnapOptions} [options]
 * @return {SnapResult | null}
 */
declare function snapWorldPointToMesh(mesh: three.Mesh, worldPoint: WorldPositionVector3, options?: SnapOptions): SnapResult | null;

/**
 * 점 → mesh 스냅 결과
 */
type SnapResult = {
    /**
     * 스냅된 월드 좌표
     */
    position: three.Vector3;
    /**
     * 선택된 face의 법선
     */
    normal: three.Vector3;
    /**
     * 선택된 face의 인덱스 (triangle 단위)
     */
    faceIndex: number;
    /**
     * 입력점과 snap된 점 사이의 거리 (lockHeight면 수평 거리)
     */
    distance: number;
    /**
     * z축 고정이 실제로 적용됐는지
     */
    lockHeightApplied: boolean;
};

/**
 * 점 → mesh 스냅 옵션
 */
type SnapOptions = {
    /**
     * true면 입력 높이(z)를 고정하고 수평(x,y)으로만 스냅한다.
     */
    lockHeight?: boolean;
    /**
     * z고정 허용 거리(정밀도, m). z고정 단면이 입력점에서
     * 이 거리 이내일 때만 z고정을 적용하고, 초과하면 3D 스냅으로 폴백한다.
     * 미설정 시: group, BATCHID가 없는 단일 mesh는 기본값(50m)을 적용하고,
     * 격리 키가 있는 건물/3D Tiles는 캡 없이 해당 건물 범위에서 단면을 찾는다.
     */
    lockHeightMaxDistance?: number;
};

export type { SnapOptions, SnapResult, snapPointToMesh, snapWorldPointToMesh };
