// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class UDefaultSource {
    static WATER_NORMAL_IMAGE: any;
    static CLOUD_IMAGE: string;
    static PATTERN_TILE: string;
    static SPRITE_GRID_IMAGE: any;
    static CURSOR_IMAGE: any;
    static PARTICLE_RAIN_IMAGE: any;
    static PARTICLE_SNOW_IMAGE: any;
    static PARTICLE_CIRCLE_IMAGE: any;
    static FIRE_TEXTURE_IMAGE: any;
    static FIRE_NOISE_IMAGE: any;
    static SMOKE_PARTICLE_IMAGE: any;
    static EXPLOSION_IMAGE: any;
    static PATH_SAMPLE_LIST: any;
    static WIND_DATA: any;
    static BUSAN_GEOJSON_DATA: any;
    static POLLUTION_DEGREE_DATA: any;
    static POLLUTION_DEGREE_MAX_DATA: any;
    static CUSTOM_LAND_IMAGE: any;
    static TERRAIN_NORMAL: string;
    static BLUE_NOSIE: string;
    static ANCHOR_POINT: string;
}

export type { UDefaultSource };
