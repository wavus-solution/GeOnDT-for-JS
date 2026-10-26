// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class UDefaultSource {
    static WATER_NORMAL_IMAGE: string;
    static CLOUD_IMAGE: string;
    static PATTERN_TILE: string;
    static SPRITE_GRID_IMAGE: string;
    static CURSOR_IMAGE: string;
    static PARTICLE_RAIN_IMAGE: string;
    static PARTICLE_SNOW_IMAGE: string;
    static PARTICLE_CIRCLE_IMAGE: string;
    static FIRE_TEXTURE_IMAGE: string;
    static FIRE_NOISE_IMAGE: string;
    static SMOKE_PARTICLE_IMAGE: string;
    static EXPLOSION_IMAGE: string;
    static PATH_SAMPLE_LIST: {
        name: string;
        startPort: {
            portId: string;
            name: string;
            position: {
                x: number;
                y: number;
                z: number;
                grounded_: boolean;
            };
            objectKey: string;
            height: number;
            minHeight: number;
            maxHeight: number;
            visible: boolean;
        };
        endPort: {
            portId: string;
            name: string;
            position: {
                x: number;
                y: number;
                z: number;
                grounded_: boolean;
            };
            objectKey: string;
            height: number;
            minHeight: number;
            maxHeight: number;
            visible: boolean;
        };
        fov: number;
        angleX: number;
        angleZ: number;
        pointList: ({
            x: number;
            y: number;
            z: number;
            grounded_: boolean;
            meshed_?: undefined;
        } | {
            x: number;
            y: number;
            z: number;
            meshed_: boolean;
            grounded_?: undefined;
        })[];
        height: number;
        maxHeight: number;
    }[];
    static WIND_DATA: {
        lat: number;
        lon: number;
        ugrd: number;
        vgrd: number;
        index: number;
    }[];
    static BUSAN_GEOJSON_DATA: {
        type: string;
        features: {
            type: string;
            geometry: {
                type: string;
                coordinates: number[][][];
            };
        }[];
    }[];
    static POLLUTION_DEGREE_DATA: {
        time: number;
        gridHeight: number;
        widthSize: number;
        minGridHeight: number;
        width: number;
        heightSize: number;
        height: number;
        windDirection: number;
        windSpeed: number;
        maxGridHeight: number;
        originY: number;
        originX: number;
        grid: number[];
    };
    static POLLUTION_DEGREE_MAX_DATA: number[];
    static CUSTOM_LAND_IMAGE: string;
    static TERRAIN_NORMAL: string;
    static BLUE_NOSIE: string;
    static ANCHOR_POINT: string;
}

export type { UDefaultSource };
