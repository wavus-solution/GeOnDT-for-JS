// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayerCO } from "./U3dModelLayer.types.js";
import type { U3dModelU3FLayer } from "./U3dModelU3FLayer.js";
import type { KeyValue, ModelMesh } from "../types/global.types.js";

/**
     * U3F 파서가 생성한 불투명한 복원 입력입니다. <br>
     * 입력은 메시 생성 과정에서 소비되므로 완료 뒤 원본 버퍼의 보존을 기대하지 마십시오.
     */
    type U3FParsedObj = KeyValue;

/**
     * 모델의 개별 편집 대상을 식별하는 결합 구간 정보입니다.
     */
    type U3dModelU3FLayerComposedInfo = {
        id: string;
        start: number;
        count: number;
    } & KeyValue;

/**
     * ~extends U3dModelLayerCO <br>
     *
     * U3F 모델 레이어의 로딩과 표시를 설정하는 생성자 옵션입니다. <br>
     * 옵션 키는 대소문자를 구분하지 않으며 기존 소문자 표기도 사용할 수 있습니다.
     */
    type U3dModelU3FLayerCO_Content = {
        /**
         * 레이어 이름
         */
        name?: string;
        /**
         * 레이어 기본 이름
         */
        baseName?: string;
        /**
         * U3F 모델 기본 URL
         */
        baseUrl?: string;
        /**
         * 건물 이미지 포맷
         */
        ext?: string;
        /**
         * Y축반전 여부
         */
        reverseY?: boolean;
        /**
         * 레이어 가시화 최소 레벨
         */
        minLevel?: number;
        /**
         * 레이어 가시화 최대 레벨
         */
        maxLevel?: number;
        /**
         * 이미지 리소스 투명도
         */
        opacity?: number;
        /**
         * 레이어 투명 여부 `false`일 경우 `opacity`가 적용되지 않습니다.
         */
        transparent?: boolean;
        /**
         * `three.js`의 basematerial 사용여부
         */
        useBaseMaterial?: boolean;
        /**
         * 0 level 타일의 높이
         */
        zeroLevelHeight?: number;
        /**
         * Split Model 사용 여부
         */
        useSplitModel?: boolean;
        /**
         * startimagelevel
         */
        startImageLevel?: number;
        /**
         * xml 사용 여부
         */
        needXml?: boolean;
        /**
         * 프록시 URL
         */
        proxyUrl?: string;
        /**
         * 프록시 사용 여부
         */
        useProxy?: boolean;
        /**
         * U3F 모델 boundingbox
         */
        boundingBox?: KeyValue;
        /**
         * Box Helper 사용 여부
         */
        useBoxHelper?: boolean;
        /**
         * 거리에 따라 건물이미지 갱신주기 최우선으로 바꾸는 설정
         */
        immediateUpdateImage?: boolean;
        /**
         * 병합된 u3f.package 파일을 사용할 건지의 여부 (1 사용, 0 미사용)
         */
        makeU3FPackage?: number;
        /**
         * 텍스쳐가 없는 u3f일경우 머터리얼을 공유할건지의 여부 (1 사용, 0 미사용)
         */
        isShareMaterial?: boolean | number;
        /**
         * 텍스쳐가 있는 u3f일경우 텍스쳐 업데이트를 사용하는지의 여부
         */
        isTextureUpdate?: boolean;
        /**
         * 텍스처 업데이트 시 업데이트 거리 강제 설정
         */
        textureDistance?: number;
        /**
         * 텍스처 품질의 최대 해상도를 설정하는 옵션 ['low':최저 품질, 'high':최고 품질]
         */
        textureLevel?: string;
        /**
         * 텍스처 wrapping 모드
         */
        wrapping?: number;
        /**
         * 모델/텍스처 동시 사용 여부
         */
        useModelAndTexture?: boolean;
        /**
         * min/max 모델 사용 여부
         */
        useMinMixModel?: boolean;
        /**
         * 이미지 레벨 다운 값
         */
        minusMaxLevel?: number;
        /**
         * 머터리얼 스타일
         */
        style?: string;
        /**
         * 메쉬 색상
         */
        meshColor?: string;
        /**
         * 웹워커 사용 여부
         */
        useWorker?: boolean;
    };

/**
     * ~extends U3dModelLayerCO <br>
     *
     * U3F 모델 레이어의 로딩과 표시를 설정하는 생성자 옵션입니다. <br>
     * 옵션 키는 대소문자를 구분하지 않으며 기존 소문자 표기도 사용할 수 있습니다.
     */
    type U3dModelU3FLayerCO = Omit<Omit<U3dModelLayerCO, never> & U3dModelU3FLayerCO_Content, never>;

/**
     * parseTileInfo에 필요한 레이어 상태와 호출 권한입니다.
     */
    type U3FParseTileInfoOwner = Pick<U3dModelU3FLayer, "_cache" | "_cacheModelInTile" | "_drawArg" | "_ext" | "_maxlevel" | "_minlevel" | "_useMinMaxModel" | "_zeroLevelHeight">;

/**
     * validationMeshInfo에 필요한 레이어 상태와 호출 권한입니다.
     */
    type U3FValidationMeshInfoOwner = Pick<U3dModelU3FLayer, "_composedCache">;

/**
     * readLayerInfo에 필요한 레이어 상태와 호출 권한입니다.
     */
    type U3FReadLayerInfoOwner = Pick<U3dModelU3FLayer, "_srcmaxlevel" | "_srcminlevel">;

/**
     * setGroupsDivisionRefine에 필요한 레이어 상태와 호출 권한입니다.
     */
    type U3FSetGroupsDivisionRefineOwner = Pick<U3dModelU3FLayer, "_refineCache">;

/**
     * getEditedModelIndex에 필요한 레이어 상태와 호출 권한입니다.
     */
    type U3FGetEditedModelIndexOwner = Pick<U3dModelU3FLayer, "editedEvent" | "editedList">;

/**
     * restoreModelMeshes에 필요한 레이어 상태와 호출 권한입니다.
     */
    type U3FRestoreModelMeshesOwner = Omit<Omit<U3FFinishModelOwner, never> & Pick<U3dModelU3FLayer, "_animation" | "_classtype" | "_drawArg" | "_isShareMaterial" | "_modelIds" | "_name" | "_opacity" | "_renderOrder" | "_sharedMaterial" | "_tileModelMap" | "_transparent" | "_useBaseMaterial" | "_useBoxHelper" | "_useEditMode" | "createKeyFromTile" | "createModelMesh" | "setMaterial" | "validationMeshInfo">, never>;

/**
     * mergeModelMesh24에 필요한 레이어 상태와 호출 권한입니다.
     */
    type U3FMergeModelMesh24Owner = Pick<U3dModelU3FLayer, "_classtype" | "_composedCache" | "_modelIds" | "_name" | "_opacity" | "_refineCache" | "_renderOrder" | "_tileModelMap" | "_transparent" | "_useBoxHelper" | "applyPickMaterial" | "createKeyFromTile" | "editFilter" | "getCache" | "getEditedEventById" | "isTileDisposed" | "setMaterial">;

/**
     * mergeModelMesh25에 필요한 레이어 상태와 호출 권한입니다.
     */
    type U3FMergeModelMesh25Owner = Pick<U3dModelU3FLayer, "_classtype" | "_composedCache" | "_modelIds" | "_name" | "_opacity" | "_refineCache" | "_renderOrder" | "_tileModelMap" | "_transparent" | "_useBoxHelper" | "applyPickMaterial" | "createKeyFromTile" | "dispatchEvent" | "editFilter" | "getCache" | "getEditedEventById" | "isTileDisposed" | "setMaterial">;

/**
     * 두 병합 경로가 공유하는 레이어 상태와 호출 권한입니다.
     */
    type U3FMergeModelOwner = Omit<Omit<U3FMergeModelMesh24Owner, never> & U3FMergeModelMesh25Owner, never>;

/**
     * 병합 시점에 조회할 공유 재질 보유자입니다.
     */
    type U3FModelRuntime = Pick<typeof U3dModelU3FLayer, "nonDrawMaterial">;

/**
     * 복원 구현에서 사용하는 공개 편집·이벤트·해제 연결입니다.
     */
    type U3FModelHooks = {
        /**
         * 복원 메시의 편집·등록 완료 처리
         */
        finishMesh: U3FFinishModelCallback;
        /**
         * 실패 경로의 텍스처 해제
         */
        deleteTexture: (texture: three.Texture | Array<three.Texture> | undefined) => void;
        /**
         * 로드 이벤트 전달
         */
        notifyLoadedModel: (owner: Pick<U3dModelU3FLayer, "dispatchEvent">, mesh: ModelMesh) => void;
    };

/**
     * 복원 입력에서 제공한 미리보기 이미지입니다.
     */
    type U3FPreviewInput = string | ArrayBuffer | Array<string | ArrayBuffer> | undefined;

/**
     * 복원된 메시의 삭제·편집·이벤트를 연결하는 레이어 권한입니다.
     */
    type U3FFinishModelOwner = Pick<U3dModelU3FLayer, "removeFilter" | "editFilter" | "removedList" | "editedList" | "editedEvent" | "setEditEvent" | "setSplitEvent" | "dispatchEvent">;

/**
     * 한 타일의 이미지 갱신에서 공유하는 거리와 품질 기준입니다.
     */
    type U3FImageSelectionState = {
        /**
         * 메시 선택 과정에서 갱신되는 타일 거리
         */
        distance: number;
        /**
         * 이미지 상세 전환 거리
         */
        maxDistance: number;
        /**
         * 기본 이미지 레벨
         */
        defaultImageLevel: number;
    };

/**
     * 복원 메시의 편집 상태를 적용하고 나머지 생성의 중단 여부를 반환합니다.
     */
    type U3FFinishModelCallback = (owner: U3FFinishModelOwner, mesh: ModelMesh, obj: U3FParsedObj) => boolean | undefined;

export type { U3FFinishModelCallback, U3FFinishModelOwner, U3FGetEditedModelIndexOwner, U3FImageSelectionState, U3FMergeModelMesh24Owner, U3FMergeModelMesh25Owner, U3FMergeModelOwner, U3FModelHooks, U3FModelRuntime, U3FParseTileInfoOwner, U3FParsedObj, U3FPreviewInput, U3FReadLayerInfoOwner, U3FRestoreModelMeshesOwner, U3FSetGroupsDivisionRefineOwner, U3FValidationMeshInfoOwner, U3dModelU3FLayerCO, U3dModelU3FLayerCO_Content, U3dModelU3FLayerComposedInfo };
