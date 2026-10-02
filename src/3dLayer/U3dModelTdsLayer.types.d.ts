// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelBasicLayerCO } from "./U3dModelBasicLayer.types.js";
import type { U3dModelTdsLayer } from "./U3dModelTdsLayer.js";
import type { ModelMesh } from "../types/global.types.js";

/**
     * ~extends U3dModelBasicLayerCO <br>
     *
     * TDS 레이어의 배치와 사용자 그룹·메타데이터 옵션입니다. <br>
     * baseUrl이 정의된 경우 location 또는 position으로 위치를 전달하십시오. <br>
     * 정규화 목록에 등록된 옵션 키는 대소문자 구분 없이 처리하며 기존 baseurl·animationspeed 입력도 지원합니다. <br>
     * 정본 키와 다른 표기를 함께 전달하면 다른 표기의 값이 우선하며, 다른 표기가 여러 개면 입력 열거 순서의 마지막 값을 사용합니다. <br>
     * 부모와 다른 location·scale 입력 형태는 자식 계약으로 구체화합니다.
     */
    type U3dModelTdsLayerCO_Content = {
        /**
         * 모델 데이터를 받아올 주소
         */
        baseUrl?: string;
        /**
         * baseUrl의 기존 소문자 호환 키
         */
        baseurl?: string;
        /**
         * location이 falsy일 때 사용하는 모델 위치
         */
        position?: three.Vector3Like;
        /**
         * 모델 위치, Vector3이면 전달 참조 유지
         */
        location?: three.Vector3Like;
        /**
         * 모델 크기, undefined이면 새 단위벡터
         */
        scale?: three.Vector3Like;
        /**
         * 모델 회전, undefined이면 영좌표 객체
         */
        rotation?: three.Vector3Like;
        /**
         * 레이어 종류
         */
        type?: string;
        /**
         * 저장할 애니메이션 속도
         */
        animationSpeed?: number;
        /**
         * animationSpeed의 기존 소문자 호환 키
         */
        animationspeed?: number;
        /**
         * 파일 메타데이터 사용 여부
         */
        containMetaData?: boolean;
        /**
         * 메타데이터 위치 보정 사용 여부
         */
        usePositionOffset?: boolean;
        /**
         * 위치 갱신을 유발하는 메타데이터 키
         */
        positionOffsetName?: string;
        /**
         * 메타데이터 파일 이름
         */
        jsonFileName?: string;
        /**
         * 사용자 그룹 목록 저장 키
         */
        userGroupDataName?: string;
        /**
         * 로딩 후 평균 중심 배치 여부
         */
        setAveragePosition?: boolean;
        /**
         * 층 분류 함수, undefined이면 기본 분류 함수
         */
        setUserGroupFunction?: null | U3dModelTdsGroupFunction;
        /**
         * 분류 설정 객체, undefined이면 새 빈 객체
         */
        userGroupParams?: U3dModelTdsGroupParams;
    };

/**
     * ~extends U3dModelBasicLayerCO <br>
     *
     * TDS 레이어의 배치와 사용자 그룹·메타데이터 옵션입니다. <br>
     * baseUrl이 정의된 경우 location 또는 position으로 위치를 전달하십시오. <br>
     * 정규화 목록에 등록된 옵션 키는 대소문자 구분 없이 처리하며 기존 baseurl·animationspeed 입력도 지원합니다. <br>
     * 정본 키와 다른 표기를 함께 전달하면 다른 표기의 값이 우선하며, 다른 표기가 여러 개면 입력 열거 순서의 마지막 값을 사용합니다. <br>
     * 부모와 다른 location·scale 입력 형태는 자식 계약으로 구체화합니다.
     */
    type U3dModelTdsLayerCO = Omit<Omit<Omit<U3dModelBasicLayerCO, "location" | "scale">, never> & U3dModelTdsLayerCO_Content, never>;

/**
     * ~extends Record<string, unknown> <br>
     *
     * 기본 층 분류 함수와 사용자 교체 함수에 전달되는 설정입니다. <br>
     * 추가 설정은 교체 함수가 직접 해석하며 이 타입은 기본 분류에 필요한 키만 설명합니다.
     */
    type U3dModelTdsGroupParams_Content = {
        /**
         * 분류를 시작할 최상위 층 번호
         */
        floorCount?: number;
        /**
         * 층간 z 이동량
         */
        height?: number;
        /**
         * 결과 그룹 이름의 공통 접미사, 기본 분류 함수 사용 시 필수이며 빈 문자열 허용
         */
        commonName?: string;
        /**
         * 층 번호 앞 비교 문자
         */
        commonChar?: string;
        /**
         * 원본 이름의 분리 문자, 생략하면 밑줄 자동 분리
         */
        seperator?: string;
    };

/**
     * ~extends Record<string, unknown> <br>
     *
     * 기본 층 분류 함수와 사용자 교체 함수에 전달되는 설정입니다. <br>
     * 추가 설정은 교체 함수가 직접 해석하며 이 타입은 기본 분류에 필요한 키만 설명합니다.
     */
    type U3dModelTdsGroupParams = Record<string, unknown> & U3dModelTdsGroupParams_Content;

/**
     * 레이어를 this로 호출하여 층 이름별 원본 목록을 반환하는 교체 지점입니다. <br>
     * setFloorFromGroupName에서 정상 처리하려면 그룹 이름별 원본 배열을 담은 객체를 반환하십시오. <br>
     * 빈 객체나 빈 원본 배열은 허용하며, 반환 객체의 키 순서대로 복제 그룹을 구성합니다. <br>
     * undefined·null을 반환하면 setFloorFromGroupName에서 TypeError가 발생합니다.
     */
    type U3dModelTdsGroupFunction = (this: U3dModelTdsLayer) => Record<string, Array<ModelMesh>> | undefined;

/**
     * 사용자 그룹 메타데이터에 저장하는 원본 메시 연결 정보입니다.
     */
    type U3dModelTdsGroupEntry = {
        /**
         * 저장된 재질 이름 또는 재질 이름
         */
        meshName: string | undefined;
        /**
         * 원본의 메타데이터 그룹 이름
         */
        oriGroupName: string | undefined;
    };

/**
     * 메시 조회에서 반환하는 파일·그룹·메시별 메타데이터 묶음입니다. <br>
     * 각 메타데이터 값의 내부 키는 외부 파일과 사용자 JSON 입력에 의해 결정됩니다.
     */
    type U3dModelTdsMeshMetaData = {
        /**
         * 파일 전체 메타데이터
         */
        fileMetaData: unknown;
        /**
         * 그룹 메타데이터 객체, 그룹 부재 시 undefined
         */
        groupMetaData: unknown;
        /**
         * 메시별 메타데이터, 그룹 부재 시 undefined
         */
        meshMetaData: unknown;
        /**
         * 현재 저장 키의 사용자 그룹 데이터
         */
        userGroupData: unknown;
    };

/**
     * 층별 복제 조립에 필요한 원본 그룹과 메시 이름 조회 권한입니다.
     */
    type U3dModelTdsFloorOwner = Pick<U3dModelTdsLayer, "_group" | "getMeshName">;

/**
     * ~extends import('three').Material <br>
     *
     * 선택 표시 시 보관하는 원래 재질 스타일입니다. <br>
     * 원본 투명도 유지 요청은 material.userData의 _keepTransparent로 읽습니다.
     */
    type U3dModelTdsStyledMaterial_Content = {
        /**
         * 현재 재질 색
         */
        color: three.Color;
        /**
         * 최초 선택 시 복제한 원래 색
         */
        _oriColor?: three.Color;
        /**
         * 최초 선택 시 저장한 원래 불투명도
         */
        _oriOpacity?: number;
    };

/**
     * ~extends import('three').Material <br>
     *
     * 선택 표시 시 보관하는 원래 재질 스타일입니다. <br>
     * 원본 투명도 유지 요청은 material.userData의 _keepTransparent로 읽습니다.
     */
    type U3dModelTdsStyledMaterial = three.Material & U3dModelTdsStyledMaterial_Content;

export type { U3dModelTdsFloorOwner, U3dModelTdsGroupEntry, U3dModelTdsGroupFunction, U3dModelTdsGroupParams, U3dModelTdsGroupParams_Content, U3dModelTdsLayerCO, U3dModelTdsLayerCO_Content, U3dModelTdsMeshMetaData, U3dModelTdsStyledMaterial, U3dModelTdsStyledMaterial_Content };
