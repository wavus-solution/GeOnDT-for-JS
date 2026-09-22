// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dImageXYZLayerCO } from "./U3dImageXYZLayer.types.js";

/**
     * ~extends import('@union3d/3dLayer/U3dImageXYZLayer').U3dImageXYZLayerCO <br>
     *
     * U3dImagePBFLayer 클래스 생성자 옵션입니다.
     */
    type U3dImagePBFLayerCO_Content = {
        /**
         * 타일 서버가 제공하는 `metadata.json` 을 읽어 이 레이어의 최소·최대 타일 레벨과 경계 상자를 그 값으로 덮어쓸지 여부입니다. <br>
         * `false` 이면 생성자에 전달한 값을 그대로 사용합니다.
         */
        needJson?: boolean;
        /**
         * `readSLD()` 가 내려받을 SLD(Styled Layer Descriptor) 스타일 파일 주소입니다. <br>
         * 생략하면 `https://3d.geon.kr/geoserver/rest/styles/poi.sld` 를 사용하며, 레이어가 스스로 읽지 않으므로 `readSLD()` 를 직접 호출해야 요청합니다. <br>
         * 내려받은 SLD 는 아직 그리기에 반영되지 않으므로 화면에 보이는 색과 선은 `styleFunction` 만 정합니다.
         */
        styleSldUrl?: string;
        /**
         * 타일 서버가 실제로 타일을 제공하는 마지막 레벨입니다. <br>
         * 이 레벨보다 깊은 타일은 새로 요청하지 않고 이 레벨의 조상 타일 데이터를 잘라 그리며, 생략하면 `maxLevel` 과 같은 값이 됩니다.
         */
        realMaxLevel?: number;
        /**
         * PBF 해석과 타일 이미지 그리기를 워커 스레드에서 수행할지 여부입니다. <br>
         * `false` 이면 같은 작업을 메인 스레드에서 수행합니다.
         */
        useTestWorker?: boolean;
        /**
         * 피처마다 채울 색과 선 모양을 결정하는 스타일 함수입니다. <br>
         * `useTestWorker` 가 `true` 이면 함수 원문이 워커로 전달되어 워커 안에서 다시 만들어지므로, 바깥 변수를 참조하지 않는 함수를 전달하십시오.
         */
        styleFunction?: PBFStyleFunction;
        /**
         * 타일 재질의 알파 합성을 켤지 여부이며, 이 레이어는 기본으로 켭니다.
         */
        transparent?: boolean;
    };

/**
     * ~extends import('@union3d/3dLayer/U3dImageXYZLayer').U3dImageXYZLayerCO <br>
     *
     * U3dImagePBFLayer 클래스 생성자 옵션입니다.
     */
    type U3dImagePBFLayerCO = Omit<Omit<U3dImageXYZLayerCO, never> & U3dImagePBFLayerCO_Content, never>;

/**
     * PBF(MVT) 타일에서 읽은 피처 하나를 어떤 색과 선으로 그릴지 결정하는 함수입니다. <br>
     * 첫 번째 인자는 MVT 에서 읽은 피처, 두 번째 인자는 그 타일 레벨의 해상도(픽셀 하나가 나타내는 월드 좌표(EPSG:3857) 거리, m/px)입니다. <br>
     * 반환 배열의 첫 스타일만 사용해 그리며, 빈 배열을 돌려주면 그 피처는 그리지 않습니다. <br>
     * 인자로 오는 피처는 OpenLayers Feature 처럼 `getType()`, `get(key)`, `getProperties()`, `getGeometry()` 를 제공하고 반환 배열의 원소는 OpenLayers Style 이며, 프로젝트에 OpenLayers 타입 선언이 없어 타입만 `unknown` 으로 둡니다. <br>
     * `useTestWorker` 가 `true` 이면 이 함수의 원문이 워커로 전달되어 워커 안에서 다시 만들어지므로 바깥 변수를 참조하지 마십시오.
     */
    type PBFStyleFunction = (feature: unknown, resolution: number) => Array<unknown>;

/**
     * PBF(MVT) 타일 하나를 해석한 결과입니다. <br>
     * 첫 번째 원소는 타일 내부 좌표계의 경계 `[minX, minY, maxX, maxY]`, 두 번째 원소는 그 타일에서 읽은 피처 목록입니다. <br>
     * 피처 목록의 원소는 OpenLayers 가 MVT 를 읽어 만든 Feature 이며, 프로젝트에 OpenLayers 타입 선언이 없어 타입은 `unknown` 으로 둡니다.
     */
    type ParsedPBFResult = [Array<number>, Array<unknown>];

export type { PBFStyleFunction, ParsedPBFResult, U3dImagePBFLayerCO, U3dImagePBFLayerCO_Content };
