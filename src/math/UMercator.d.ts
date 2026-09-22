// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class UMercator {
    constructor(tilesize?: number);
    _tileSize: number;
    _originShift: number;
    _initialResolution: number;
    _zeroX: number;
    _zeroY: number;
    _zeroTiles: number;
    LatLonToMeters(lat: any, lon: any, mx: any, my: any, simple: any): void;
    MetersToLatLon(mx: any, my: any, lon: any, lat: any): void;
    PixelsToMeters(px: any, py: any, zoom: any, mx: any, my: any): void;
    MetersToPixels(mx: any, my: any, zoom: any, px: any, py: any): void;
    PixelsToTile(px: any, py: any, tx: any, ty: any): void;
    PixelsToRaster(px: any, py: any, zoom: any, px2: any, py2: any): void;
    MetersToTile(mx: any, my: any, zoom: any, px: any, py: any): void;
    TileBounds(tx: any, ty: any, zoom: any): number[];
    TileLatLonBounds(tx: any, ty: any, zoom: any): any[];
    Resolution(zoom: any): number;
    ZoomForPixelSize(pixelSize: any): number;
    GoogleTile(tx: any, ty: any, zoom: any, tx2: any, ty2: any): void;
    QuadTree(tx: any, ty: any, zoom: any): string;
}

export type { UMercator };
