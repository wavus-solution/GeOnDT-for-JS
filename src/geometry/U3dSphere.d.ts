// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dGeometry } from "./U3dGeometry.js";
import type { U3dGeometryCO, U3dOutlineAliasCO } from "./U3dGeometry.types.js";

/**
 * ~extends U3dGeometryCO <br>
 *
 * U3dSphere(구체) 생성자에 넘기는 옵션입니다. <br>
 * 외곽선 옵션(`outline`과 별칭)은 `U3dOutlineAliasCO`가, 색상·투명도 같은 도형 공통 옵션은 `U3dGeometryCO`가 정의합니다. <br>
 */
type U3dSphereCO_Content = {
    /**
     * 구체의 반지름 (미터). 화면에 그릴 때는 좌표가 지정된 위도의 보정 배율이 곱해집니다 <br>
     */
    radius?: number;
    /**
     * 가로(둘레) 방향 분할 수. 클수록 옆에서 본 윤곽이 원에 가까워지고 정점 수가 늘어납니다. <br>
     * 최소 3 <br>
     */
    widthSegments?: number;
    /**
     * 세로(위아래) 방향 분할 수. 클수록 표면이 매끄러워지고 정점 수가 늘어납니다. <br>
     * 최소 2 <br>
     */
    heightSegments?: number;
    /**
     * 가로 방향으로 그리기 시작할 각도 (라디안) <br>
     */
    phiStart?: number;
    /**
     * 가로 방향으로 그릴 각도 범위 (라디안). 기본값은 `Math.PI * 2`(360도)로 둘레 전체를 그리며, 줄이면 수박 조각처럼 일부만 남습니다 <br>
     */
    phiLength?: number;
    /**
     * 세로 방향으로 그리기 시작할 각도 (라디안) <br>
     */
    thetaStart?: number;
    /**
     * 세로 방향으로 그릴 각도 범위 (라디안). 기본값은 `Math.PI`(180도)로 위아래 전체를 그리며, `Math.PI / 2`를 넣으면 반구가 됩니다 <br>
     */
    thetaLength?: number;
    /**
     * 불투명도. 0이면 완전 투명, 1이면 불투명하며 1보다 작으면 투명 처리가 켜집니다 <br>
     */
    opacity?: number;
    /**
     * 카메라 거리에 따라 색과 밝기가 달라지는 셰이더 재질을 쓸지 여부. false면 단색 재질을 사용하며, 생성 시에만 적용되고 `setParam`으로는 바꿀 수 없습니다 <br>
     */
    setDistanceMaterial?: boolean;
    /**
     * 구체 표면 색상. 16진수 숫자(`0xff0000`), CSS 색 문자열(`'#ff0000'`) 또는 `THREE.Color`를 넣습니다 <br>
     */
    color?: three.ColorRepresentation;
    /**
     * 도형 종류 식별자 (기본값 `'basic'`). 구체는 이 값으로 재질이 달라지지 않으며, 재질 종류는 `setDistanceMaterial`이 정합니다 <br>
     */
    type?: string;
};

/**
 * ~extends U3dGeometryCO <br>
 *
 * U3dSphere(구체) 생성자에 넘기는 옵션입니다. <br>
 * 외곽선 옵션(`outline`과 별칭)은 `U3dOutlineAliasCO`가, 색상·투명도 같은 도형 공통 옵션은 `U3dGeometryCO`가 정의합니다. <br>
 */
type U3dSphereCO = Omit<Omit<U3dGeometryCO, never> & U3dOutlineAliasCO & U3dSphereCO_Content, never>;

/**
 * ~extends U3dGeometryCO <br>
 *
 * U3dSphere(구체) 생성자에 넘기는 옵션입니다. <br>
 * 외곽선 옵션(`outline`과 별칭)은 `U3dOutlineAliasCO`가, 색상·투명도 같은 도형 공통 옵션은 `U3dGeometryCO`가 정의합니다. <br>
 *
 * @memberof U3dSphere
 * @inner
 *
 * @typedef {object} U3dSphereCO_Content
 * @property {number} [radius=5] 구체의 반지름 (미터). 화면에 그릴 때는 좌표가 지정된 위도의 보정 배율이 곱해집니다 <br>
 * @property {number} [widthSegments=8] 가로(둘레) 방향 분할 수. 클수록 옆에서 본 윤곽이 원에 가까워지고 정점 수가 늘어납니다. <br>
 * 최소 3 <br>
 * @property {number} [heightSegments=6] 세로(위아래) 방향 분할 수. 클수록 표면이 매끄러워지고 정점 수가 늘어납니다. <br>
 * 최소 2 <br>
 * @property {number} [phiStart=0] 가로 방향으로 그리기 시작할 각도 (라디안) <br>
 * @property {number} [phiLength] 가로 방향으로 그릴 각도 범위 (라디안). 기본값은 `Math.PI * 2`(360도)로 둘레 전체를 그리며, 줄이면 수박 조각처럼 일부만 남습니다 <br>
 * @property {number} [thetaStart=0] 세로 방향으로 그리기 시작할 각도 (라디안) <br>
 * @property {number} [thetaLength] 세로 방향으로 그릴 각도 범위 (라디안). 기본값은 `Math.PI`(180도)로 위아래 전체를 그리며, `Math.PI / 2`를 넣으면 반구가 됩니다 <br>
 * @property {number} [opacity=1] 불투명도. 0이면 완전 투명, 1이면 불투명하며 1보다 작으면 투명 처리가 켜집니다 <br>
 * @property {boolean} [setDistanceMaterial=false] 카메라 거리에 따라 색과 밝기가 달라지는 셰이더 재질을 쓸지 여부. false면 단색 재질을 사용하며, 생성 시에만 적용되고 `setParam`으로는 바꿀 수 없습니다 <br>
 * @property {import('three').ColorRepresentation} [color] 구체 표면 색상. 16진수 숫자(`0xff0000`), CSS 색 문자열(`'#ff0000'`) 또는 `THREE.Color`를 넣습니다 <br>
 * @property {string} [type] 도형 종류 식별자 (기본값 `'basic'`). 구체는 이 값으로 재질이 달라지지 않으며, 재질 종류는 `setDistanceMaterial`이 정합니다 <br>
 *
 * @typedef {Omit<U3dGeometryCO, never> & U3dOutlineAliasCO & U3dSphereCO_Content} U3dSphereCO
 */
/**
 * ~extends import('@U3dGeometry') <br>
 *
 * 지정한 좌표에 구체(Sphere) 형태의 3D 도형을 생성하는 클래스입니다. <br>
 * 반지름·세그먼트로 크기와 매끄러움을, phi/theta 각도로 반구·부분 구 등을 표현할 수 있으며, 색상·투명도·외곽선 등도 지정할 수 있습니다. <br>
 * 좌표는 생성 후 `setVertex`(월드) 또는 `setPositions`(위경도)로 지정하며, 첫 번째 좌표에 구체가 놓입니다. <br>
 *
 * 반지름·분할 수·각도 범위 같은 형상 필드에 직접 대입한 값은 곧바로 화면에 반영되지 않습니다. <br>
 * 다음 `setParam` 호출이나 좌표 갱신으로 형상을 다시 만들 때 사용되므로, 값을 바꿀 때는 `setParam`을 사용하십시오. <br>
 *
 * @group geometry
 * @extends {U3dGeometry}
 */
declare class U3dSphere extends U3dGeometry {
    /**
     * `setDistanceMaterial: true`로 만든 구체들이 공유하는 셰이더 재질 원본입니다. <br>
     * 처음 필요할 때 한 번만 만들어지고, 각 구체는 이 재질을 복제(clone)해 사용합니다. <br>
     * 참조 수를 세어 마지막 구체가 `dispose`될 때 함께 해제되므로 **직접 `dispose`하지 않습니다.** <br>
     *
     * @type {import('three').ShaderMaterial | undefined}
     */
    static distanceMaterial: three.ShaderMaterial | undefined;
    /**
     * 구체(Sphere) 도형을 생성합니다. <br>
     * 좌표는 생성 후 `setVertex`(월드) 또는 `setPositions`(위경도)로 지정합니다. <br>
     *
     * @param {U3dSphereCO} [opt={}] 생성 옵션 (반지름·세그먼트·각도·색상·투명도·외곽선 등) <br>
     */
    constructor(opt?: U3dSphereCO);
    /**
     * @type {import('three').Vector3}
     *
     * @ignore
     */
    position: three.Vector3;
    /**
     * @type {import('three').Vector3}
     *
     * @ignore
     */
    scale: three.Vector3;
    /**
     * @type {import('three').Euler}
     *
     * @ignore
     */
    rotation: three.Euler;
    /**
     * @type {import('three').Object3D | null}
     *
     * @ignore
     */
    parent: three.Object3D | null;
    /**
     * @type {Array<import('three').Object3D>}
     *
     * @ignore
     */
    children: Array<three.Object3D>;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _disposed: boolean;
    /**
     * @type {import('three').Matrix4}
     *
     * @ignore
     */
    matrixWorld: three.Matrix4;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    matrixAutoUpdate: boolean;
    /**
     * @type {Record<string, *>}
     *
     * @ignore
     */
    userData: Record<string, any>;
    /**
     * 구체의 반지름 (미터, 기본값 5). <br>
     * 위경도 좌표를 지정한 구체는 화면에 그릴 때 그 위도의 보정 배율이 곱해지므로 실제 지오메트리 반지름과 다를 수 있습니다. <br>
     *
     * @type {number}
     */
    radius: number;
    /**
     * 가로(둘레) 방향 분할 수 (기본값 8, 최소 3). <br>
     * 클수록 옆에서 본 윤곽이 원에 가까워지고 정점 수가 늘어납니다. <br>
     *
     * @type {number}
     */
    widthSegments: number;
    /**
     * 세로(위아래) 방향 분할 수 (기본값 6, 최소 2). <br>
     * 클수록 표면이 매끄러워지고 정점 수가 늘어납니다. <br>
     *
     * @type {number}
     */
    heightSegments: number;
    /**
     * 가로 방향으로 그리기 시작할 각도 (라디안, 기본값 0). <br>
     *
     * @type {number}
     */
    phiStart: number;
    /**
     * 가로 방향으로 그릴 각도 범위 (라디안, 기본값 `Math.PI * 2`). <br>
     * 360도면 둘레 전체를 그리고, 줄이면 수박 조각처럼 일부만 남습니다. <br>
     *
     * @type {number}
     */
    phiLength: number;
    /**
     * 세로 방향으로 그리기 시작할 각도 (라디안, 기본값 0). <br>
     *
     * @type {number}
     */
    thetaStart: number;
    /**
     * 세로 방향으로 그릴 각도 범위 (라디안, 기본값 `Math.PI`). <br>
     * `Math.PI / 2`를 넣으면 반구가 됩니다. <br>
     *
     * @type {number}
     */
    thetaLength: number;
    /**
     * 외곽선(모서리 선) 표시 여부 (기본값 false). <br>
     * 켜면 구체의 모서리를 따라 선 객체가 자식으로 추가되며, 선 색은 `lineColor` 옵션 값(없으면 검정)을 사용합니다. <br>
     * 생성 옵션과 `setParam`에서는 `outline`(별칭 `useline`/`useLine`/`edge`) 이름을 사용합니다. <br>
     *
     * @type {boolean}
     */
    useline: boolean;
    /**
     * 카메라 거리에 따라 색과 밝기가 달라지는 셰이더 재질을 사용하는지 여부 (기본값 false). <br>
     * false면 단색 재질을 사용합니다. **생성 시에만 적용되며 `setParam`으로는 바꿀 수 없습니다.** <br>
     *
     * @type {boolean}
     */
    setDistanceMaterial: boolean;
    /**
     * @type {number}
     *
     * @ignore
     */
    _googleScale: number;
    /**
     * @type {import('three').LineSegments | undefined}
     *
     * @ignore
     */
    _outline: three.LineSegments | undefined;
    opacity: any;
    /**
     * 구체의 속성(색상·투명도·반지름·세그먼트·각도·외곽선)을 한 번에 변경합니다. <br>
     * 전달한 값만 반영되고 나머지는 기존 값이 유지되며, 형태 관련 값을 바꾸면 지오메트리가 즉시 다시 생성됩니다. <br>
     * `setDistanceMaterial`은 생성 시에만 적용되어 여기서 변경되지 않습니다. <br>
     * 좌표(`vertices`·`coordinates`)와 `name`·`showLabel`·`properties`도 생성 옵션 전용이라 넣어도 오류 없이 무시됩니다. <br>
     *
     * @override
     *
     * @param {U3dSphereCO} [param] 변경할 속성 객체. 생략한 속성은 현재 값을 유지합니다 <br>
     */
    override setParam(param?: U3dSphereCO): void;
    /**
     * 구체의 현재 속성을 반환합니다(`setParam`에 다시 넘길 수 있습니다). <br>
     * 호출할 때마다 새 객체를 만들어 돌려주며, 이 객체의 항목을 바꿔 넣어도 구체는 바뀌지 않습니다. <br>
     * 다만 `color`는 구체가 보관한 값을 그대로 담습니다. <br>
     * `THREE.Color` 인스턴스를 `setColor`에 넘겼다면 재질도 같은 인스턴스를 쓰므로, 색을 바꿀 때는 반환값을 고치지 말고 새 색을 `setColor`에 넘기십시오. <br>
     *
     * @override
     *
     * @returns {object} 현재 속성 객체 (`radius`, `widthSegments`, `heightSegments`, `phiStart`, `phiLength`, `thetaStart`, `thetaLength`, `outline`과 도형 공통 속성) <br>
     */
    override getParam(): object;
    /**
     * 구체와 관련 리소스(지오메트리·재질·자식 객체)를 해제합니다. <br>
     * 더 이상 사용하지 않는 구체는 이 함수로 정리하면 메모리 누수를 방지할 수 있습니다. <br>
     * 자원 정리에 앞서 `DISPOSE` 이벤트가 발생하며, **호출한 뒤에는 같은 구체를 다시 사용할 수 없습니다.** <br>
     */
    dispose(): void;
    #private;
}

export type { U3dSphere, U3dSphereCO, U3dSphereCO_Content };
