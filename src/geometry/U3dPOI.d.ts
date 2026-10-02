// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UCssBilboard } from "../annotation/UCssBilboard.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UGroup } from "../core/UGroup.js";

/**
 * ~extends import('@union3d/core/UGroup') <br>
 *
 * 3D 화면의 특정 위치에 POI(관심지점, Point of Interest)를 표시합니다. <br>
 * 이미지 마커·텍스트 라벨·지형까지의 수직선·선택 박스를 조합해 지점을 강조하며, 생성·수정·삭제를 지원합니다.
 *
 * @group view
 * @summary 3D POI(Point of interest) 관련 클래스
 * @extends {UGroup}
 */
declare class U3dPOI extends UGroup {
    /**
     * POI를 생성합니다. <br>
     * `position`(월드 좌표(EPSG:3857))은 필수이며, 지정하지 않으면 콘솔에 오류를 출력하고 초기화를 중단합니다. <br>
     * 이때 예외는 발생하지 않고 위치가 없는 객체가 그대로 반환되므로, 화면에는 아무것도 표시되지 않습니다. <br>
     * 이미지·라벨·선택 박스는 옵션이 있을 때만 함께 만들어집니다.
     *
     * @param {U3dPOICO} [opt={}] 생성 옵션 (위치·이름·색상·이미지·라벨 등)
     */
    constructor(opt?: U3dPOICO);
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _disposed: boolean;
    /**
     * 이미지 마커에 적용하는 색상입니다. <br>
     * 생성 옵션 `imageColor`를 지정하지 않으면 `color` 값을 그대로 사용합니다.
     *
     * @type {import('three').ColorRepresentation}
     */
    imageColor: three.ColorRepresentation;
    /**
     * 텍스트 라벨에 적용하는 색상입니다. <br>
     * 생성 옵션 `labelColor`를 지정하지 않으면 `color` 값을 그대로 사용합니다.
     *
     * @type {import('three').ColorRepresentation}
     */
    labelColor: three.ColorRepresentation;
    _classtype: string;
    _options: U3dPOICO;
    /** @type {import('three').Vector3} */
    _position: three.Vector3;
    name: any;
    /** @type {import('three').ColorRepresentation} */
    color: three.ColorRepresentation;
    /** @type {string|undefined} */
    image: string | undefined;
    /** @type {number} */
    imageSize: number;
    /** @type {{x: number, y: number}} */
    imageOffset: {
        x: number;
        y: number;
    };
    /** @type {string|undefined} */
    label: string | undefined;
    /** @type {{x: number, y: number}} */
    labelOffset: {
        x: number;
        y: number;
    };
    /** @type {import('@union3d/annotation/UCssBilboard').UCssBilboard|undefined} */
    imagePoi: UCssBilboard | undefined;
    /** @type {import('@union3d/annotation/UCssBilboard').UCssBilboard|undefined} */
    labelPoi: UCssBilboard | undefined;
    /** @type {boolean} */
    depthTest: boolean;
    /** @type {boolean} */
    select: boolean;
    /** @type {{x: number, y: number, z: number}|undefined} */
    _geoPosition: {
        x: number;
        y: number;
        z: number;
    } | undefined;
    /** @type {number|undefined} */
    size: number | undefined;
    /** @type {string|undefined} */
    font: string | undefined;
    /** @type {number} */
    heightOffset: number;
    /** @type {import('three').Mesh|undefined} */
    selectBox: three.Mesh | undefined;
    /** @type {import('three').Line|undefined} */
    _line: three.Line | undefined;
    /** @type {number} */
    zOffset: number;
    /**
     * POI 지점에서 지형 표면까지 이어지는 수직선을 생성합니다. <br>
     * 해당 위치의 지형 높이를 조회해, POI 위치부터 지면까지 붉은 선을 그어 지점을 지면과 연결해 보여 줍니다. <br>
     * 기존 수직선이 있으면 해당 선과 렌더링 리소스를 정리한 뒤 새로 생성합니다.
     */
    setLine(): void;
    /**
     * POI의 위치를 지정한 월드 좌표(EPSG:3857)로 옮깁니다. <br>
     * 이미지·라벨은 물론 선택 박스와 지형 수직선까지 함께 갱신됩니다.
     *
     * @param {import('three').Vector3} position 옮겨 갈 지점의 월드 좌표(EPSG:3857)
     */
    setPosition(position: three.Vector3): void;
    /**
     * POI에 이미지 마커를 설정합니다. <br>
     * 이미지 마커가 아직 없으면 새로 만들어 표시하고, 있으면 이미지를 교체합니다.
     *
     * @param {string} image 이미지 데이터 URL
     */
    setImage(image: string): void;
    /**
     * POI 이미지 마커의 크기를 설정합니다.
     *
     * @param {number} size 이미지 크기
     */
    setImageSize(size: number): void;
    /**
     * POI에 라벨(텍스트)을 설정합니다. <br>
     * 라벨이 아직 없으면 새로 만들어 표시하고, 있으면 텍스트를 교체합니다.
     *
     * @param {string} label 라벨 텍스트
     */
    setLabel(label: string): void;
    /**
     * POI 라벨 텍스트의 크기(폰트 크기)를 설정합니다. <br>
     * 라벨이 아직 만들어지지 않았으면 아무 변화도 일어나지 않습니다.
     *
     * @param {number} size 텍스트 크기
     */
    setLabelSize(size: number): void;
    /**
     * POI 라벨 텍스트의 폰트 스타일을 설정합니다. <br>
     * 라벨이 아직 만들어지지 않았으면 아무 변화도 일어나지 않습니다.
     *
     * @param {string} font 라벨의 폰트 스타일 (CSS font 값)
     */
    setFont(font: string): void;
    /**
     * POI 라벨 텍스트의 글꼴을 설정합니다. <br>
     * 라벨이 아직 만들어지지 않았으면 아무 변화도 일어나지 않습니다.
     *
     * @param {string} fontFamily 라벨의 폰트-family 스타일
     */
    setFontFamily(fontFamily: string): void;
    /**
     * POI를 화면에 표시합니다(이미지·라벨·선택 박스·수직선을 모두 함께 표시).
     */
    show(): void;
    /**
     * POI를 화면에서 숨깁니다(이미지·라벨·선택 박스·수직선을 모두 함께 숨김).
     */
    hide(): void;
    /**
     * POI의 현재 위치를 위경도 좌표계(EPSG:4326) 값으로 반환합니다. <br>
     * 월드 좌표(EPSG:3857)를 위경도 좌표계(EPSG:4326)로 변환하며, 변환에 필요한 정보(`drawArg`)나 위치가 없으면 undefined를 반환합니다.
     *
     * @returns {{x: number, y: number, z: number}|undefined} 위경도 좌표계(EPSG:4326) 값 (x=경도, y=위도, z=높이), 변환 불가 시 undefined
     */
    getPosition(): {
        x: number;
        y: number;
        z: number;
    } | undefined;
    /**
     * POI에 이벤트 리스너를 등록합니다. <br>
     * U3dPOI가 정의한 이벤트 타입은 POI의 표시 내용이 바뀌었음을 알리는 'change' 하나입니다. <br>
     * 등록한 콜백은 해당 이벤트가 발생할 때 호출됩니다.
     *
     * @param {string} type 등록할 이벤트 타입, U3dPOI가 정의한 값은 'change'
     * @param {(event: {type: string, data: U3dPOI}) => void} callback 이벤트 발생 시 호출되는 콜백, 인자의 type은 이벤트 타입이고 data는 이벤트를 발생시킨 U3dPOI 객체
     */
    on(type: string, callback: (event: {
        type: string;
        data: U3dPOI;
    }) => void): void;
    /**
     * POI에 등록한 이벤트 리스너를 제거합니다. <br>
     * `on`으로 등록할 때 넘긴 것과 동일한 콜백을 전달해야 제거됩니다.
     *
     * @param {string} type 제거할 리스너의 이벤트 타입
     * @param {(event: {type: string, data: U3dPOI}) => void} callback 등록할 때 사용한 것과 동일한 콜백 함수
     */
    off(type: string, callback: (event: {
        type: string;
        data: U3dPOI;
    }) => void): void;
    /**
     * POI의 현재 위치·이름·색상·이미지·라벨 설정을 모아 생성 옵션 형태로 반환합니다. <br>
     * `position`, `name`, `color`, `image`, `imageSize`, `imageOffset`, `label`, `labelOffset`만 채워지며 `imageColor`, `labelColor`, `size`, `font`, `heightOffset`, `depthTest`, `select`, `drawArg`는 빠집니다. <br>
     * 따라서 이 값만으로 다시 만든 POI는 빠진 항목이 기본값으로 돌아갑니다. <br>
     * `position`과 두 오프셋은 복사본이 아니라 이 POI가 사용 중인 객체를 그대로 반환하므로, 받은 쪽에서 값을 바꾸면 POI 표시도 함께 바뀝니다.
     *
     * @returns {U3dPOICO} 위에 적은 여덟 개 항목만 채워진 생성 옵션 객체
     */
    getParameter(): U3dPOICO;
    /**
     * POI 라벨 test 함수 — setInterval로 라벨과 이미지 값을 변경 <br>
     * 5초당 count 수량에 대한 렌더링 및 속성값 변경 성능 테스트
     *
     * @param {boolean} showLog 진행사항 로그 출력 여부
     * @param {import('@U3dApp').U3dApp} u3dApp test 진행 U3dApp
     * @param {number} count test 생성 갯수

     * @private
     */
    private __testIntervalPOI;
    #private;
}

/**
     * U3dPOI 생성자 옵션
     */
    type U3dPOICO = {
        /**
         * POI를 세울 지점의 월드 좌표(EPSG:3857), 지정하지 않으면 POI가 만들어지지 않습니다.
         */
        position?: three.Vector3;
        /**
         * POI 이름
         */
        name?: string;
        /**
         * POI 색상 (이미지 + 라벨)
         */
        color?: three.ColorRepresentation;
        /**
         * 이미지 마커에만 적용할 색상, 생략하면 `color` 값을 사용합니다.
         */
        imageColor?: three.ColorRepresentation;
        /**
         * 라벨 텍스트에만 적용할 색상, 생략하면 `color` 값을 사용합니다.
         */
        labelColor?: three.ColorRepresentation;
        /**
         * 이미지 데이터 URL
         */
        image?: string;
        /**
         * 이미지 크기
         */
        imageSize?: number;
        /**
         * 이미지 마커를 지점에서 밀어내는 정도, 1이 마커 자신의 한 변 크기이고 x는 오른쪽, y는 음수일 때 위쪽으로 이동하며 기본값은 {x:0, y:-1}
         */
        imageOffset?: {
            x: number;
            y: number;
        };
        /**
         * 라벨 텍스트
         */
        label?: string;
        /**
         * 라벨 텍스트, `label`을 함께 지정하면 `label` 값이 쓰입니다.
         */
        text?: string;
        /**
         * 라벨을 지점에서 밀어내는 정도, 1이 라벨 자신의 한 변 크기이고 x는 오른쪽, y는 음수일 때 위쪽으로 이동하며 기본값은 {x:0, y:0}
         */
        labelOffset?: {
            x: number;
            y: number;
        };
        /**
         * 텍스트 크기
         */
        size?: number;
        /**
         * 폰트 스타일
         */
        font?: string;
        /**
         * 이미지와 라벨을 POI 지점보다 위로 띄울 높이(미터), 지도 축척에 맞춰 월드 좌표(EPSG:3857) 높이로 환산해 적용합니다.
         */
        heightOffset?: number;
        /**
         * 깊이(원근감) 적용 여부
         */
        depthTest?: boolean;
        /**
         * true이면 마우스로 POI를 집을 수 있도록 지점 위에 보이지 않는 상자를 함께 만듭니다.
         */
        select?: boolean;
        /**
         * 좌표 변환과 지형 높이 조회에 쓰는 드로우 아규먼트(drawArg) 객체, U3dApp의 POI 추가 기능을 쓰면 자동으로 지정됩니다.
         */
        drawArg?: UDrawArg;
    };

export type { U3dPOI, U3dPOICO };
