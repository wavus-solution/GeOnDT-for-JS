// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dGeometry, U3dGeometryCO, U3dGeometryStyleParam, U3dOutlineAliasCO } from "./U3dGeometry.js";

/**
 * ~extends import('@U3dGeometry') <br>
 *
 * 지도 위 한 지점에 표시하는 육면체(Box) 3D 도형입니다. <br>
 * 너비·높이·깊이와 분할 수(segments)로 크기와 면 구성을 지정합니다. <br>
 * 단색 재질(`basic`) 또는 `topimageurl` 이미지를 적용한 6면 재질(`topimage`), 외곽선, 텍스처 이미지를 설정할 수 있습니다.
 *
 * 크기는 미터 단위이며 너비는 X축(동서), 높이는 Y축(남북), 깊이는 Z축(수직) 방향 길이입니다. <br>
 * 위경도 좌표가 있으면 첫 좌표의 위도에 따라 월드 좌표(EPSG:3857) 길이로 환산합니다. <br>
 * 위치는 `setVertex`로 월드 좌표(EPSG:3857)를, `setPositions`로 위경도 좌표계(EPSG:4326)를 지정합니다. <br>
 * 첫 번째 좌표가 육면체의 중심 위치입니다.
 *
 * 크기·분할 수·외곽선 같은 형상 필드에 직접 대입한 값은 곧바로 화면에 반영되지 않습니다. <br>
 * 다음 `setSize`·`setParam` 호출이나 좌표 갱신으로 형상을 다시 만들 때 사용되므로, 값을 바꿀 때는 `setSize`나 `setParam`을 사용하십시오. <br>
 * 크기 필드는 위도 환산 전 요청값을 보관하므로 화면에 그려진 실제 길이와 다를 수 있습니다. <br>
 * 분할 수는 지정하지 않으면 `undefined`이며 그 축을 나누지 않고, 값이 클수록 면을 이루는 삼각형 수가 늘어납니다. <br>
 *
 * @group geometry
 *
 * @extends {U3dGeometry}
 */
declare class U3dBox extends U3dGeometry {
    /**
     * 너비·높이·깊이의 기본값입니다. <br>
     * 단위는 미터입니다.
     *
     * @type {number}
     */
    static DEFAULT_SIZE: number;
    /**
     * 외곽선(outline)으로 표시할 모서리를 판정하는 기준 각도입니다. <br>
     * 단위는 도입니다. <br>
     * 인접한 두 면의 각도가 이 값 이상인 모서리만 표시하므로, 같은 평면 안의 분할선(segments)은 외곽선에 포함되지 않습니다.
     *
     * @type {number}
     */
    static OUTLINE_THRESHOLD_ANGLE: number;
    /**
     * `topimage` 타입에서 이미지를 적용하는 면의 재질 인덱스입니다. <br>
     * `BoxGeometry` 면 순서 기준 +Y 윗면에 해당합니다.
     *
     * @type {number}
     */
    static TOP_FACE_MATERIAL_INDEX: number;
    /**
     * U3dBox 클래스 생성자입니다. <br>
     * 크기·분할 수(segments)·재질 종류·외곽선(outline) 여부를 검증하여 저장한 후 재질과 형상을 생성합니다. <br>
     * 크기가 0 이하이거나 유한한 수가 아니면 경고를 출력하고 기본값 10미터를 사용합니다. <br>
     * 분할 수가 1 이상의 정수가 아니면 경고를 출력하고 미지정으로 처리합니다. <br>
     * 좌표를 지정하기 전에는 위도 환산 없이 요청한 크기를 그대로 적용합니다.
     *
     * @param {U3dBoxCO} [opt={}] 크기·분할 수·색상·투명도·재질 종류·외곽선을 지정하는 생성 옵션
     */
    constructor(opt?: U3dBoxCO);
    /**
     * 육면체의 너비입니다. <br>
     * X축(동서) 방향 길이이며 단위는 미터입니다.
     *
     * @type {number}
     */
    width: number;
    /**
     * 육면체의 높이입니다. <br>
     * Y축(남북) 방향 길이이며 단위는 미터입니다.
     *
     * @type {number}
     */
    height: number;
    /**
     * 육면체의 깊이입니다. <br>
     * Z축(수직) 방향 길이이며 단위는 미터입니다.
     *
     * @type {number}
     */
    depth: number;
    /**
     * X축 방향 분할 수(segments)입니다.
     *
     * @type {number | undefined}
     */
    widthSegments: number | undefined;
    /**
     * Y축 방향 분할 수(segments)입니다.
     *
     * @type {number | undefined}
     */
    heightSegments: number | undefined;
    /**
     * Z축 방향 분할 수(segments)입니다.
     *
     * @type {number | undefined}
     */
    depthSegments: number | undefined;
    /**
     * `topimage` 재질에 적용할 이미지 URL입니다. <br>
     * 생성 시에만 적용되며, 이후 이 값을 변경해도 재질에 반영되지 않습니다.
     *
     * @type {string | undefined}
     */
    topimageurl: string | undefined;
    /**
     * 윗면 이미지 로더입니다. <br>
     * `type: 'topimage'`일 때 생성 시 `topimageurl`을 한 번 읽는 데 사용하며, 그 뒤로는 참조만 남고 다시 사용하지 않습니다.
     *
     * @deprecated 내부 구현용 필드이므로 외부 사용을 권장하지 않습니다. 이미지 적용에는 `setImage` 또는 `setTexture`를 사용합니다.
     *
     * @type {import('three').TextureLoader | undefined}
     */
    loader: three.TextureLoader | undefined;
    /**
     * 재질 종류입니다. <br>
     * `basic`은 단색 단일 재질, `topimage`는 6면 재질 배열입니다. <br>
     * 생성 시에만 적용되며, `topimage`에 `topimageurl`이 없거나 지원하지 않는 값이면 이 필드가 `basic`으로 바뀝니다.
     *
     * @override
     *
     * @type {'basic' | 'topimage'}
     */
    override type: "basic" | "topimage";
    /**
     * 외곽선(outline) 표시 여부입니다. <br>
     * 생성 옵션과 `setParam`에서는 `outline`(또는 별칭 `useline`·`useLine`·`edge`) 이름을 사용합니다. <br>
     * `getParam`은 이 값을 `outline` 이름으로 반환합니다.
     *
     * @type {boolean}
     */
    useline: boolean;
    /**
     * 첫 위경도 좌표의 위도로 계산한 크기 보정 배율 (월드 좌표(EPSG:3857) 1단위 → 실거리 환산의 역수)
     *
     * @type {number}
     *
     * @ignore
     */
    _googleScale: number;
    /**
     * 현재 외곽선 객체. 부모 `U3dGeometry.setLineColor`가 이 필드를 읽어 색상을 바꿉니다.
     *
     * @type {import('three').LineSegments | undefined}
     *
     * @ignore
     */
    _outline: three.LineSegments | undefined;
    /**
     * 해제 여부. `UMesh.dispose()`가 true로 바꾸며, 그 뒤 도착한 비동기 텍스처 로드 결과를 버리는 데 사용합니다.
     *
     * @type {boolean}
     *
     * @ignore
     */
    _disposed: boolean;
    /**
     * 육면체의 너비·높이·깊이를 변경합니다. <br>
     * 값이 실제로 바뀐 경우에만 형상과 외곽선(outline)을 다시 생성합니다. <br>
     * 0 이하, NaN, 무한대 값은 경고를 출력하고 해당 축의 현재 값을 유지합니다. <br>
     * 생략한 인자도 현재 값을 유지합니다.
     *
     * @param {number} [width] X축(동서) 방향 길이 (미터)
     * @param {number} [height] Y축(남북) 방향 길이 (미터)
     * @param {number} [depth] Z축(수직) 방향 길이 (미터)
     */
    setSize(width?: number, height?: number, depth?: number): void;
    /**
     * 육면체의 현재 크기를 반환합니다. <br>
     * 반환값은 위도 환산 전 요청값이므로 화면에 그려진 실제 길이와 다를 수 있습니다.
     *
     * @returns {U3dBoxSize} 너비·높이·깊이 (미터) <br>
     *                       호출할 때마다 새로 만든 객체이므로 값을 고쳐도 도형에 반영되지 않습니다
     */
    getSize(): U3dBoxSize;
    /**
     * 단일 재질 육면체에 텍스처(texture) 이미지를 적용합니다. <br>
     * 한 장을 면 크기에 맞춰 늘려 붙이며, 이미지의 방향은 보정하지 않습니다. <br>
     * `type: 'basic'`(단일 재질)에서만 동작하며, 6면 재질(`type: 'topimage'`)에서는 경고를 출력하고 적용하지 않습니다. <br>
     * 6면 재질에 이미지를 넣거나 이미지의 위아래 방향을 맞춰야 하면 `setImage`를 사용하십시오. <br>
     * 이미지는 로드가 끝난 뒤에 화면에 나타나므로 이 메서드가 끝난 시점에는 아직 반영되지 않습니다. <br>
     * URL이 문자열이 아니거나 빈 문자열이면 경고를 출력합니다. <br>
     * 로드에 실패하면 오류를 출력하며 이때 기존 이미지는 그대로 남습니다.
     *
     * @param {string} textureUrl 텍스처 이미지 URL
     *
     * @see setImage
     */
    setTexture(textureUrl: string): void;
    /**
     * 도형 공통 속성과 육면체 고유 속성을 일괄 변경합니다. <br>
     * 육면체 고유 속성은 크기·분할 수(segments)·외곽선(outline) 여부·와이어프레임 표시 여부입니다. <br>
     * 지정하지 않은 항목은 현재 값을 유지합니다. <br>
     * 크기·분할 수·외곽선 여부가 실제로 바뀐 경우에만 형상을 다시 생성합니다. <br>
     * `type`과 `topimageurl`은 생성 시에만 적용되므로 이 메서드로 변경되지 않으며, 넣어도 경고 없이 무시됩니다.
     *
     * @override
     *
     * @param {U3dBoxCO} [param] 변경할 속성. 도형 공통 속성과 크기·분할 수·외곽선 여부·와이어프레임 표시 여부
     */
    override setParam(param?: U3dBoxCO): void;
    /**
     * 현재 도형 공통 속성과 육면체 고유 속성을 반환합니다. <br>
     * 반환값을 `setParam`에 그대로 전달하면 크기·분할 수(segments)·외곽선(outline) 여부가 동일하게 적용됩니다. <br>
     * 재질 종류(`type`)와 `topimageurl`은 반환값에 포함되지 않습니다.
     *
     * @override
     *
     * @returns {U3dBoxParam} 현재 속성 <br>
     *                        호출할 때마다 새로 만든 객체이므로 항목을 바꿔 넣어도 도형은 바뀌지 않습니다 <br>
     *                        다만 `color`는 도형이 보관한 값을 그대로 담습니다 <br>
     *                        `THREE.Color` 인스턴스를 `setColor`에 넘겼다면 재질도 같은 인스턴스를 쓰므로, 색을 바꿀 때는 반환값을 고치지 말고 새 색을 `setColor`에 넘기십시오
     */
    override getParam(): U3dBoxParam;
    /**
     * 초기화 함수. 재질을 먼저 만들고(단일/6면 판정이 지오메트리 그룹 처리에 필요) 지오메트리·외곽선을 생성한 뒤 투명도·와이어프레임을 반영합니다.
     *
     * @ignore
     */
    _initBox(): void;
    /**
     * 현재 크기·세그먼트·스케일·외곽선 여부로 지오메트리를 다시 만들고 외곽선을 재생성합니다. <br>
     * 마지막 생성 조합과 같으면 아무 것도 하지 않습니다.
     *
     * @ignore
     */
    _updateBoxGeometry(): void;
    /**
     * 기존 외곽선을 해제하고 `useline`이면 현재 지오메트리로 외곽선을 다시 만들어 자식으로 추가합니다.
     *
     * @ignore
     */
    _updateOutline(): void;
    #private;
}

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dBox` 생성자와 `setParam`에 전달하는 옵션입니다. <br>
     * 여기에는 육면체(Box) 고유 옵션만 적었으며, 이름·색상·투명도·좌표 같은 도형 공통 옵션은 `U3dGeometryCO`가 함께 제공합니다. <br>
     * 외곽선(outline) 표시 옵션과 그 예전 이름들은 `U3dOutlineAliasCO`가 제공하며, 지정하지 않으면 육면체는 외곽선을 표시하지 않습니다. <br>
     * `type`과 `topimageurl`은 생성 시에만 적용되고 `setParam`으로는 바뀌지 않습니다.
     */
    type U3dBoxCO_Content = {
        /**
         * 너비. X축(동서) 방향 길이 (미터) <br>
         *  0 이하이거나 유한한 수가 아니면 경고를 출력하고 기본값을 사용합니다
         */
        width?: number;
        /**
         * 높이. Y축(남북) 방향 길이 (미터) <br>
         *  0 이하이거나 유한한 수가 아니면 경고를 출력하고 기본값을 사용합니다
         */
        height?: number;
        /**
         * 깊이. Z축(수직) 방향 길이 (미터) <br>
         *  0 이하이거나 유한한 수가 아니면 경고를 출력하고 기본값을 사용합니다
         */
        depth?: number;
        /**
         * X축 방향 분할 수(segments). 1 이상의 정수 <br>
         *  지정하지 않으면 그 축으로 면을 나누지 않습니다
         */
        widthSegments?: number;
        /**
         * Y축 방향 분할 수(segments). 1 이상의 정수 <br>
         *  지정하지 않으면 그 축으로 면을 나누지 않습니다
         */
        heightSegments?: number;
        /**
         * Z축 방향 분할 수(segments). 1 이상의 정수 <br>
         *  지정하지 않으면 그 축으로 면을 나누지 않습니다
         */
        depthSegments?: number;
        /**
         * 육면체(Box) 윗면 이미지 URL <br>
         *  `type`이 `topimage`일 때 필수이며, 없으면 오류를 출력하고 `basic`으로 생성됩니다
         */
        topimageurl?: string;
        /**
         * 재질 종류 <br>
         *  `basic`은 모든 면이 같은 단색이고, `topimage`는 윗면에만 `topimageurl` 이미지를 넣은 6면 재질입니다
         */
        type?: "basic" | "topimage";
    };

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dBox` 생성자와 `setParam`에 전달하는 옵션입니다. <br>
     * 여기에는 육면체(Box) 고유 옵션만 적었으며, 이름·색상·투명도·좌표 같은 도형 공통 옵션은 `U3dGeometryCO`가 함께 제공합니다. <br>
     * 외곽선(outline) 표시 옵션과 그 예전 이름들은 `U3dOutlineAliasCO`가 제공하며, 지정하지 않으면 육면체는 외곽선을 표시하지 않습니다. <br>
     * `type`과 `topimageurl`은 생성 시에만 적용되고 `setParam`으로는 바뀌지 않습니다.
     */
    type U3dBoxCO = Omit<Omit<U3dGeometryCO, never> & U3dOutlineAliasCO & U3dBoxCO_Content, never>;

/**
     * ~extends import('@U3dGeometry').U3dGeometryStyleParam <br>
     *
     * `U3dBox.getParam`이 반환하는 현재 속성입니다. <br>
     * 여기에는 육면체(Box) 고유 속성만 적었으며, 색상·투명도 같은 도형 공통 속성은 `U3dGeometryStyleParam`이 함께 제공합니다. <br>
     * `setParam`에 그대로 전달하면 크기·분할 수(segments)·외곽선(outline) 여부가 동일하게 적용됩니다.
     */
    type U3dBoxParam_Content = {
        /**
         * X축(동서) 방향 길이 (미터, 위도 환산 전 요청값)
         */
        width: number;
        /**
         * Y축(남북) 방향 길이 (미터, 위도 환산 전 요청값)
         */
        height: number;
        /**
         * Z축(수직) 방향 길이 (미터, 위도 환산 전 요청값)
         */
        depth: number;
        /**
         * X축 방향 분할 수(segments). 나누지 않았으면 `undefined`
         */
        widthSegments: number | undefined;
        /**
         * Y축 방향 분할 수(segments). 나누지 않았으면 `undefined`
         */
        heightSegments: number | undefined;
        /**
         * Z축 방향 분할 수(segments). 나누지 않았으면 `undefined`
         */
        depthSegments: number | undefined;
        /**
         * 외곽선(outline) 표시 여부
         */
        outline: boolean;
    };

/**
     * ~extends import('@U3dGeometry').U3dGeometryStyleParam <br>
     *
     * `U3dBox.getParam`이 반환하는 현재 속성입니다. <br>
     * 여기에는 육면체(Box) 고유 속성만 적었으며, 색상·투명도 같은 도형 공통 속성은 `U3dGeometryStyleParam`이 함께 제공합니다. <br>
     * `setParam`에 그대로 전달하면 크기·분할 수(segments)·외곽선(outline) 여부가 동일하게 적용됩니다.
     */
    type U3dBoxParam = U3dBoxParam_Content & Omit<U3dGeometryStyleParam, never>;

/**
     * `U3dBox.getSize`가 반환하는 육면체(Box) 크기입니다. <br>
     * 세 값 모두 위도 환산 전 요청값이며 단위는 미터입니다.
     */
    type U3dBoxSize = {
        /**
         * X축(동서) 방향 길이
         */
        width: number;
        /**
         * Y축(남북) 방향 길이
         */
        height: number;
        /**
         * Z축(수직) 방향 길이
         */
        depth: number;
    };

export type { U3dBox, U3dBoxCO, U3dBoxCO_Content, U3dBoxParam, U3dBoxParam_Content, U3dBoxSize };
