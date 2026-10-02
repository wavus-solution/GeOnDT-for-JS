// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dComponentInstancedPosition } from "../3dLayer/U3dComponentInstancedPosition.js";
import type { U3dComponentPosition } from "../3dLayer/U3dComponentPosition.js";
import type { UDrawArg } from "./UDrawArg.js";
import type { UEventDispatcherCO } from "./UEventDispatcher.js";

/**
     * 렌더 부모를 바꾸지 않고 UGroup에 등록하는 논리 컴포넌트입니다.
     */
    type UGroupComponent = U3dComponentPosition | U3dComponentInstancedPosition;

type UGroupMember = three.Object3D | UGroupComponent;

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     *
     * UGroup을 만들 때 넘기는 생성 옵션입니다.
     */
    type UGroupCO_Content = {
        /**
         * 그룹을 구분하기 위해 붙이는 이름이며, 생략하면 빈 문자열이 됩니다
         */
        name?: string;
        /**
         * 그룹을 그릴 때 사용할 렌더링 실행 인자이며, 그룹은 값을 보관만 하고 스스로 사용하지 않습니다
         */
        drawarg?: UDrawArg | undefined;
    };

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     *
     * UGroup을 만들 때 넘기는 생성 옵션입니다.
     */
    type UGroupCO = Omit<Omit<UEventDispatcherCO, never> & UGroupCO_Content, never>;

/**
     * ~extends import('three').Material <br>
     */
    type UGroup_AlphaMaterial_Content = {
        alphaMap?: three.Texture | null;
        _alphaMap?: three.Texture | null;
        alphaTest?: number;
        _alphaTest?: number | null;
        /**
         * UGroup 변경 전 알파 테스트 값. Three.js 내부 _alphaTest와 분리합니다.
         */
        _groupAlphaTest?: number;
    };

/**
     * ~extends import('three').Material <br>
     */
    type UGroup_AlphaMaterial = three.Material & UGroup_AlphaMaterial_Content;

export type { UGroupCO, UGroupCO_Content, UGroupComponent, UGroupMember, UGroup_AlphaMaterial, UGroup_AlphaMaterial_Content };
