// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayerCO } from "./U3dModelLayer.types.js";
import type { U3dPOI } from "../geometry/U3dPOI.js";

/**
     * DXF 파서가 제공하는 원본 엔티티입니다. 종류별 추가 필드는 입력 자료에서 결정합니다.
     */
    type U3dDxfEntity = Record<string, unknown>;

/**
     * DXF 로더에 전달하는 파싱 결과입니다. 엔티티 종류에 필요한 tables·blocks·header 등의 추가 자료도 함께 전달합니다.
     * 로더가 처리 도중 임시 속성을 추가·제거하므로 읽기 전용 객체로 취급하지 않습니다.
     */
    type U3dDxfData = Record<string, unknown> & {
        entities: Array<U3dDxfEntity>;
    };

/**
     * DXF 기본 표시 스타일입니다. 생성 시 일부 속성만 주면 나머지 속성을 보충하지 않습니다.
     * setStyle은 이 객체에 병합하며 color=0은 기존 색을 유지하고 opacity=0은 1로 적용합니다.
     */
    type U3dDxfStyle = {
        /**
         * 메시 색상
         */
        color?: three.ColorRepresentation;
        /**
         * 불투명도; 별도 범위 검증 없음
         */
        opacity?: number;
        /**
         * 라벨 문구; 경계 라벨 변경은 truthy 문구에만 적용
         */
        label?: string;
    };

/**
     * 선 객체에서 연결된 라벨을 조회하는 함수입니다. 라벨이 없으면 undefined를 반환합니다.
     */
    type U3dDxfLabelGetter = () => U3dPOI | undefined;

/**
     * ~extends import('three').Object3D <br>
     * 스타일 callback에 전달되는 객체입니다. 형상과 재질은 Mesh·Line·삽입 객체 등의 종류에서 결정합니다.
     * userData.entity와 userData.label은 원본 엔티티와 생성된 라벨을 공유합니다.
     */
    type U3dDxfObject_Content = {
        /**
         * DXF 객체 종류
         */
        _type?: string;
        /**
         * 객체 형상
         */
        geometry?: three.BufferGeometry;
        /**
         * 단일 색상 재질
         */
        material?: three.Material & {
            color: three.Color;
        };
        /**
         * 현재 레이어 이름 조회
         */
        getLayerName?: () => string;
        /**
         * 연결된 라벨 조회
         */
        getLabel?: U3dDxfLabelGetter;
        /**
         * 재질의 불투명도 설정
         */
        setOpacity?: (arg0: number) => void;
        /**
         * 재질 색상 설정
         */
        setColor?: (arg0: three.ColorRepresentation) => void;
    };

/**
     * ~extends import('three').Object3D <br>
     * 스타일 callback에 전달되는 객체입니다. 형상과 재질은 Mesh·Line·삽입 객체 등의 종류에서 결정합니다.
     * userData.entity와 userData.label은 원본 엔티티와 생성된 라벨을 공유합니다.
     */
    type U3dDxfObject = three.Object3D & U3dDxfObject_Content;

/**
     * 원본 엔티티와 표시 객체에 스타일을 적용하는 callback입니다. 반환값은 사용하지 않습니다.
     * addDxfInfo·setUseExtrude에서는 this가 레이어이며 setStyleFunction의 즉시 순회에서는 this를 지정하지 않습니다.
     */
    type U3dDxfStyleFunction = (entity: U3dDxfEntity | undefined, mesh: U3dDxfObject) => any;

/**
     * ~extends U3dModelLayerCO <br>
     * DXF 레이어 생성 옵션입니다. 기존 minlevel·dxfinfo 키는 소문자를 유지합니다.
     * style을 생략하면 color=0x3399CC, opacity=1, label=''인 새 객체를 사용합니다.
     */
    type U3dModelDxfLayerCO_Content = {
        /**
         * 레이어 이름; nullish이면 생성한 Guid 사용
         */
        name?: string;
        /**
         * 저장할 선 표시 설정; 이 클래스에서 직접 선 생성 조건으로 사용하지 않음
         */
        drawLine?: boolean;
        /**
         * 레이어 좌표계 설정
         */
        crs?: string;
        /**
         * DXF 입력 XY 좌표계
         */
        sourceCRS?: string;
        /**
         * 최소 레벨; 최대 레벨도 같은 값으로 설정
         */
        minlevel?: number;
        /**
         * 저장할 DXF 주소; 생성자에서 자동 요청하지 않음
         */
        url?: string;
        /**
         * 레이어 종류; nullish이면 UDEF.LAYER_TYPE.MODEL
         */
        type?: string;
        /**
         * 보관할 DXF 자료; 형상 생성은 addDxfInfo에서 수행
         */
        dxfinfo?: U3dDxfData;
        /**
         * 저장할 라벨 정보; nullish이면 빈 배열
         */
        labelInfo?: Array<unknown>;
        /**
         * 메시 라벨 배치 시 외곽선 추가 여부
         */
        useEdge?: boolean;
        /**
         * 폴리라인을 돌출 메시로 표시할지 여부
         */
        useExtrude?: boolean;
        /**
         * 돌출 geometry의 depth
         */
        extrudeHeight?: number;
        /**
         * addDxfInfo 후 다음 LOADED에서 고도를 보정할지 여부
         */
        setAutoHeight?: boolean;
        /**
         * 폴리라인 그룹의 Z 보정값
         */
        heightOffset?: number;
        /**
         * 기본 스타일; 전달한 객체를 공유
         */
        style?: U3dDxfStyle;
        /**
         * 객체별 스타일 callback
         */
        styleFunction?: U3dDxfStyleFunction;
    };

/**
     * ~extends U3dModelLayerCO <br>
     * DXF 레이어 생성 옵션입니다. 기존 minlevel·dxfinfo 키는 소문자를 유지합니다.
     * style을 생략하면 color=0x3399CC, opacity=1, label=''인 새 객체를 사용합니다.
     */
    type U3dModelDxfLayerCO = Omit<Omit<U3dModelLayerCO, never> & U3dModelDxfLayerCO_Content, never>;

/**
     * getParam에서 반환하는 현재 설정의 일부입니다. 전체 생성 옵션과는 구분하여 사용하십시오.
     */
    type U3dDxfLayerParam = {
        /**
         * 레이어 이름
         */
        name: string;
        /**
         * 최소 레벨
         */
        minlevel: number;
        /**
         * 최대 레벨
         */
        maxlevel: number;
        /**
         * 상속 레이어의 투명 설정
         */
        transparent: boolean;
        /**
         * 저장된 주소
         */
        url: string | undefined;
        /**
         * 공유 스타일 객체
         */
        style: U3dDxfStyle;
        /**
         * 공유 callback
         */
        styleFunction: U3dDxfStyleFunction | undefined;
        /**
         * 입력 좌표계
         */
        sourceCRS: string;
    };

export type { U3dDxfData, U3dDxfEntity, U3dDxfLabelGetter, U3dDxfLayerParam, U3dDxfObject, U3dDxfObject_Content, U3dDxfStyle, U3dDxfStyleFunction, U3dModelDxfLayerCO, U3dModelDxfLayerCO_Content };
