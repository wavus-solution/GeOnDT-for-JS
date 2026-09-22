// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UEventDispatcher } from "../core/UEventDispatcher.js";
import type { WorldPosition } from "../types/global.types.js";

/**
 * @classdesc `사용자 건물`(CustomModel) 모델 관련 클래스
 * @summary `사용자 건물`(CustomModel) 모델 관련 클래스
 * @memberOf Object
 * @constructor
 * @param {object} opt 생성자 옵션
 * @param {string} [opt.name=Guid()] 사용자 건물 이름
 * @param {Shape} opt.shape 사용자 건물 밑면 shape
 * @param {import('@UDrawArg').UDrawArg} opt.drawarg 사용자 건물 drawarg
 * @param {number} opt.extrudeheight 건물 모델 Mesh 높이
 * @param {number} [opt.zoffset] 해발고도 절대값. 모델 높이에 더하는 보정값.
 * @param {WorldPositionVector3} [opt.center] 사용자 건물 가운데 점 좌표 (월드 좌표, EPSG:3857)
 * @param {boolean} [opt.usebox=false] BoundingBox 사용여부
 * @param {WorldPosition[]} opt.vertex 사용자 건물 3D 월드 좌표 리스트
 * @param {GeoPosition[]} opt.points 사용자 건물 위경도 좌표 리스트
 * @param {object} [opt.style] 사용자 건물 스타일
 * @param {Color} [opt.style.color=0x3399CC] 건물 색상
 * @param {number} [opt.style.side=THREE.FrontSide] 렌더링 될 면 `THREE.FrontSide=0`(앞면) `THREE.BackSide=1`(뒷면) `THREE.DoubleSide=2`(양면)
 * @param {number} [opt.style.opacity=1] 건물 투명도
 * @param {boolean} [opt.style.transparent=false] 건물 투명도 적용 여부
 * @param {array} [opt.textureUrl] 사용자 건물 텍스처 URL 리스트
 * @param {boolean} [opt.textureVisible=false] 사용자 건물 텍스처 가시화 여부
 * @param {number} [opt.floorHeight=3.3] 사용자 건물 한 층당 높이
 * @param {string} [opt.labeltext=""]사용자 건물 라벨 Text
 * @param {number} [opt.landarea] 사용자 건물 대지면적 (건물을 지을 수 있도록 허가된 땅의 넓이)
 * @param {number} [opt.floorarearatio] 사용자 건물 용적률 (연면적/대지면적 X 100)
 * @param {number} [opt.buildingcoverageratio] 사용자 건물 건폐율 (건축면적/대지면적 X 100)
 *
 * @property {string} _modeltype 사용자 건물 타입 `extrude` `geometry` `group`
 * @property {number} _buildingArea  건축면적 (건물의 밑면 넓이, 제곱미터 m2)
 * @property {number} _floor 층수 (건물의 높이/3m), 3m는 통상 한 층의 높이
 * @property {number} _totalArea 연면적 (건물의 모든 층의 바닥면적을 합친 값)
 * @property {number} _landArea 대지면적 (건물을 지을 수 있도록 허가된 땅의 넓이)
 * @property {number} _floorAreaRatio 사용자 건물 용적률 (연면적/대지면적 X 100)
 * @property {number} _buildingCoverageRatio 사용자 건물 건폐율(건축면적/대지면적 X 100)
 *
 * @see GeOnDT.analysis.UAnalyCustomModel
 * @example
 *   var custom = new GeOnDT.object.U3dCustomModel({
 *             name: "Custom1",
 *             extrudeheight: 50,
 *             zoffset: 5,
 *             labeltext: "편집지형1",
 *             shape: new THREE.Shape(),
 *             drawarg: drawArg,
 *             buildingarea: 2318.6754120187584
 *             vertex: [
 *                 {x: -211946.4565308597, y: 103316.36033566981, z: 15.000000000000014, isVector3: true},
 *                 {x: -211955.36906110903, y: 103270.76752662908, z: 14, isVector3: true},
 *                 {x: -211846.47066378364, y: 103314.50966402487, z: 9.846043358071782, isVector3: true}
 *             ],
 *             points: [
 *                 {x: 126.93998060239859, y: 37.519023373269626, z: 15.000000000000014},
 *                 {x: 126.93988178771733, y: 37.518610122227656, z: 14},
 *                 {x: 126.94112146280959, y: 37.51900912327179, z: 9.846043358071782}
 *             ]
 *         });
 */
declare class U3dCustomModel extends UEventDispatcher {
    constructor(opt?: {});
    _name: any;
    _type: string;
    _isInitialized: boolean;
    _version: string;
    _modeltype: any;
    _shape: any;
    _drawArg: any;
    _object: any;
    _position: three.Vector3;
    _boundingBox: any;
    _bbox: any;
    _extrudeHeight: any;
    _zOffset: number;
    _center: any;
    _useBox: any;
    _vertex: any;
    _points: any;
    _style: any;
    _textureUrl: any;
    _textureVisible: any;
    _textures: {};
    _floorHeight: any;
    _helper: three.Box3Helper;
    _labelText: any;
    _buildingArea: any;
    _floor: number;
    _totalArea: number;
    _landArea: any;
    _floorAreaRatio: any;
    _buildingCoverageRatio: any;
    /**
     * 해당 모델의 영역 정보(건축면적, 대지면적 등...)를 반환하는 함수
     * @return {object} 모델이 포함하고 있는 영역 정보
     * @example
     * return {
     *     floor: 건물 높이,
     *     landArea: 대지면적,
     *     totalArea: 연면적,
     *     floorAreaRatio: 건물 용적률,
     *     buildingArea: 건축면적,
     *     buildingCoverageRatio:건물 건폐율
     * }
     */
    getAreaValue(): object;
    /**
     * 해당 모델의 영역 가이드(boxHelper)를 가시화하는 함수
     */
    showBox(): void;
    /**
     * 모델의 영역 가이드를(boxHelper) 제거하는 함수
     */
    hideBox(): void;
    /**
     * 모델의 텍스쳐을 설정하는 함수
     * @param {string} textureUrl 텍스쳐를 불러올수 있는 url
     */
    setTexture(textureUrl: string): void;
    /**
     * 모델의 텍스쳐을 제거하는 함수
     */
    removeTexture(): void;
    /**
     * 모델의 스타일을 설정하는 함수
     * @param {object} style 스타일 옵션
     * @param {string} style.color 색상 문자열(RGB 또는 HEX)
     * @param {number} style.metalness 금속성 (높을수록 금속재질 강도 상승)
     * @param {number} style.roughness 표면 거칠기(높을수록 반사광 강도 저하)
     * @param {number} style.opacity 투명도
     * @param {boolean} style.transparent 투명도 설정 여부
     */
    setStyle(style: {
        color: string;
        metalness: number;
        roughness: number;
        opacity: number;
        transparent: boolean;
    }): void;
    /**
     * 모델의 색상을 설정하는 함수
     * @param {import('three').ColorRepresentation} color 모델 색상
     */
    setColor(color: three.ColorRepresentation): void;
    /**
     * 모델의 투명도를 설정하는 함수
     * @param {number} opacity 모델 투명도 (0~1)
     */
    setOpacity(opacity: number): void;
    /**
     * 모델 좌표를 설정하는 함수
     * @param {WorldPosition} position 3차원 좌표
     */
    setPosition(position: WorldPosition): void;
    /**
     * 모델을 회전시키는 함수
     * @param {import('three').Vector3} rotate 회전값(˚)
     * @param {number} rotate.x x축 회전값
     * @param {number} rotate.y y축 회전값
     * @param {number} rotate.z z축 회전값
     */
    setRotate(rotate: three.Vector3): void;
    /**
     * 모델을 확대 또는 축소하는 함수
     * @param {import('three').Vector3} scale 크기값
     * @param {number} scale.x x축 크기값
     * @param {number} scale.y y축 크기값
     * @param {number} scale.z z축 크기값
     */
    setScale(scale: three.Vector3): void;
    /**
     * 모델의 Uid 반환 함수
     * @returns {string} 모델의 Uid
     */
    getUid(): string;
    createCustomModel(): any;
    /**
     * 모델의 라벨을 On/Off 하는 함수
     * @param {boolean} [show=true] 라벨 가시화 여부
     */
    showLabel(show?: boolean): void;
    /**
     * 사용자 건물을 처분(dispose)하는 함수
     */
    dispose(): void;
    _extrudeSettings: any;
    _height: any;
    /**
     * 모델의 생성 Parameter를 반환하는 함수
     * @return {object} 모델 생성 Parameter
     * @example
     * Parameter {
     *     center : {x: -211875.2421875, y: 103287.8515625, z: 27.40543608830194, isVector3: true},
     *     extrudeheight : 33,
     *     labeltext : "3",
     *     landHeight : 0,
     *     modeltype : "extrude",
     *     name : "model1",
     *     position : {x: -211875.2421875, y: 103287.8515625, z: 27.40543608830194},
     *     rotation : {x: 0, y: 0, z: 0},
     *     scale  : {x: 1, y: 1, z: 1},
     *     style : {
     *         color : "#fff000",
     *         opacity : 1
     *     },
     *     textureUrl : "../image/building1",
     *     version : "1.2",
     *     vertex : [13.22, 3.45, 0 .... ]
     * }
     */
    getParameter(): object;
    /**
     * 사용자 건물 모델의 라벨을 설정하는 함수
     * @param {string} labelText 라벨 텍스트
     */
    setLabelText(labelText: string): void;
    /**
     * 모델의 이름을 설정하는 함수
     * @param {string} name 모델이름
     */
    setName(name: string): void;
    /**
     * 모델의 라벨 텍스트를 반환하는 함수
     * @returns {string} 라벨 텍스트
     */
    getLabelText(): string;
    /**
     * 모델의 이름을 반환하는 함수
     * @returns {string} 모델의 이름
     */
    getName(): string;
    /**
     * 모델의 높이를 반환하는 함수
     * @returns {number} 모델의 높이
     */
    getHeight(): number;
    /**
     * 모델의 지상높이를 반환하는 함수 <br/>
     * (지상높이는 지면에 붙어있을 경우 0)
     * @returns {number} 모델의 지상높이
     */
    getLandHeight(): number;
    /**
     * 모델의 투명도를 반환하는 함수
     * @returns {number} 모델의 투명도
     */
    getOpacity(): number;
    /**
     * 모델의 색상을 반환하는 함수
     * @returns {import('three').ColorRepresentation} 모델의 색상
     */
    getColor(): three.ColorRepresentation;
    /**
     * 모델 가시화 함수
     */
    show(): void;
    /**
     * 모델 비가시화(hide) 함수
     */
    hide(): void;
    /**
     * 모델의 지상높이를 설정하는 함수 <br/>
     * (지상높이는 지면에 붙어있을 경우 0)
     * @param {number} landHeight 지상높이
     */
    setLandHeight(landHeight: number): void;
    /**
     * 모델의 높이를 설정하는 함수
     * @param {number} height 모델의 높이
     */
    setHeight(height: number): void;
    /**
     * 모델의 바닥 정점(vertex) 리스트를 반환하는 함수
     * @returns {import('three').Vector3[]} 모델 바닥 정점(vertex) 리스트
     */
    getBottomShapeVertex(): three.Vector3[];
    /**
     * 모델 object의 Mesh를 반환하는 함수
     * @returns {import('three').Object3D} 모델 object의 Mesh
     */
    getMesh(): three.Object3D;
    addChangeEvent(dstSelf: any): void;
    /**
     * 모델의 높이를 지형 정보에 따라 갱신하는 함수
     */
    updateHeight(): void;
}

export type { U3dCustomModel };
