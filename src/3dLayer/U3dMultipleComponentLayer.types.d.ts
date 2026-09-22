// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dComponentInstancedPosition } from "./U3dComponentInstancedPosition.js";
import type { U3dComponentPosition } from "./U3dComponentPosition.js";
import type { UInstancedBatchedSkinnedMesh } from "../core/mesh/UInstancedBatchedSkinnedMesh.js";
import type { UInstancedMesh, UInstancedMeshCO } from "../core/mesh/UInstancedMesh.js";
import type { ColorLike } from "../types/global.types.js";

/**
     * 컴포넌트로 배치할 원본 3D 에셋의 이름과 파일 정보를 지정합니다. <br>
     * loadModel에 전달하거나 getListModel과 getListModelByName에서 조회하는 정보입니다.
     */
    type U3dMultipleComponentModelInfo = {
        /**
         * 사용자가 지정한 3D 에셋 이름
         */
        name: string;
        /**
         * 3D 에셋 파일을 불러올 URL 경로
         */
        baseurl: string;
        /**
         * 확장자를 포함한 원본 파일명 (예: `"building.3ds"`)
         */
        fileName: string;
        /**
         * 3D 에셋 파일 포맷 (예: `"3ds"`, `"obj"`, `"glb"`, `"gltf"`, `"fbx"`). 대소문자를 구분하지 않고 판별하며 파일명에는 입력한 표기 그대로 붙습니다.
         */
        ext: string;
    };

/**
     * 일반 컴포넌트와 인스턴스 컴포넌트의 구현 타입을 하나로 묶은 타입입니다. <br>
     * 두 방식의 객체를 공통으로 참조하며, 실행 중 추가되는 속성까지 허용할 때는 ComponentObject를 사용합니다.
     * 타입 전용 선언이며 new로 직접 생성하는 클래스가 아닙니다.
     */
    type ComponentObjectBase = U3dComponentPosition | U3dComponentInstancedPosition;

/**
     * 3D 에셋 하나를 지도 위에 배치한 시설물 객체입니다. <br>
     * 일반 방식과 인스턴스 방식 중 어느 쪽으로 만들어졌든 같은 타입으로 다룹니다. <br>
     * 기본 속성 외에 실행 중에 붙는 임의 속성도 함께 허용합니다.
     * 타입 전용 선언이며 new로 직접 생성하는 클래스가 아닙니다.
     */
    type ComponentObject = ComponentObjectBase & Record<string, any>;

/**
     * 여러 인스턴스를 한 번에 그리는 메시이며 실행 중에 붙는 임의 속성도 함께 허용하는 타입입니다.
     */
    type TypedUInstancedMesh = UInstancedMesh<any, any, number, UInstancedMeshCO> & Record<string, any>;

/**
     * 인스턴스 컴포넌트를 그리는 데 쓰이는 메시 종류를 하나로 묶은 타입입니다. <br>
     * 뼈대 애니메이션이 없는 에셋은 일반 인스턴스 메시로, 있는 에셋은 뼈대용 인스턴스 메시로 만들어집니다.
     */
    type InstancedMeshLike = (TypedUInstancedMesh | (UInstancedBatchedSkinnedMesh & Record<string, any>));

/**
     * 레이어에 배치된 모든 컴포넌트에 일괄 적용할 스타일입니다. <br>
     * 지정한 속성만 변경하며 생략한 속성은 각 컴포넌트의 현재 값을 유지합니다.
     */
    type U3dMultipleComponentLayerStyle = {
        /**
         * 컴포넌트 색상 <br>
         */
        color?: ColorLike;
        /**
         * 불투명도이며 0은 완전 투명, 1은 완전 불투명 <br>
         */
        opacity?: number;
        /**
         * 컴포넌트 가시화 여부 <br>
         */
        visible?: boolean;
        /**
         * 밝기 배율이며 1은 원래 밝기, 0은 검정 <br>
         */
        brightness?: number;
        /**
         * 대비 배율이며 1은 원래 대비, 0은 중간 회색 <br>
         */
        contrast?: number;
    };

export type { ComponentObject, ComponentObjectBase, InstancedMeshLike, TypedUInstancedMesh, U3dMultipleComponentLayerStyle, U3dMultipleComponentModelInfo };
