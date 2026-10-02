// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayerCO } from "./U3dModelLayer.types.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { UShpMesh } from "../core/mesh/UShpMesh.js";
import type { U3dPOI } from "../geometry/U3dPOI.js";
import type { UExtrudeGeometry } from "../geometry/UExtrudeGeometry.js";
import type { Double_Array, KeyValue, Triple_Array, WorldPositionVector3 } from "../types/global.types.js";
import type { DeferredObject } from "../util/deferred.types.js";

/**
     * `getParam()`이 반환하는 SHP 모델 레이어의 저장 가능한 설정입니다. <br>
     * FeatureCollection과 레이어의 높이·스타일 콜백 필드는 제외되지만, 공유 `style` 안의 `multiSideFunction`은 남을 수 있습니다.
     */
    type U3dModelShapeLayerParam = {
        /**
         * 레이어 이름
         */
        name: string;
        /**
         * 카메라 거리별 상세도를 나누는 타일 레벨 중 건물을 표시하기 시작하는 값
         */
        minlevel: number;
        /**
         * 건물을 표시하는 마지막 타일 레벨. <br>
         * 현재 구현은 `minlevel`과 같은 값
         */
        maxlevel: number;
        /**
         * 투명도 적용 여부. <br>
         * `true`면 불투명도가 `1` 미만
         */
        transparent: boolean;
        /**
         * 생성자에 전달한 데이터 URL
         */
        url: string | undefined;
        /**
         * 원본 데이터 좌표계로 보관한 EPSG 식별자
         */
        sourceCRS: string;
        /**
         * 모든 건물에 적용하는 내부 공통 스타일 객체의 공유 참조
         */
        style: U3dModelShapeStyle;
        /**
         * 건물 전체 높이를 읽는 Feature 속성 이름
         */
        fieldHeight: string | undefined;
        /**
         * 지면 기준 높이를 읽는 Feature 속성 이름
         */
        fieldLandHeight: string | undefined;
        /**
         * 라벨 문자열을 읽는 Feature 속성 이름
         */
        fieldLabelText: string | undefined;
        /**
         * 층수를 읽는 Feature 속성 이름
         */
        fieldFloor: string | undefined;
        /**
         * 공통 층 높이(m)
         */
        floorHeight: number;
        /**
         * 생성 시 텍스처를 적용하는지 여부
         */
        useTexture: boolean;
        /**
         * 내부에서 공유하는 텍스처 URL 또는 URL 배열. <br>
         * 배열을 변경하면 이후 재질 생성에도 반영됨
         */
        textureUrl: string | Array<string>;
        /**
         * 텍스처 요청 앞에 붙이는 프록시 URL
         */
        proxyurl: string;
        /**
         * 프록시 사용 여부. <br>
         * 현재 구현은 설정 경로가 없어 항상 `undefined`
         */
        useproxy: boolean | undefined;
    };

/**
     * 건물 Mesh에 적용하는 표시 스타일입니다. <br>
     * 공통 `style`은 전체 형태를 사용하고 `styleFunction`은 필요한 속성만 반환할 수 있습니다. <br>
     * 색상은 CSS 색상 문자열, 16진수 숫자 또는 `Color`이고 불투명도는 `0`(완전 투명)부터 `1`(완전 불투명)입니다.
     */
    type U3dModelShapeStyle = {
        /**
         * 건물 색상
         */
        color: three.ColorRepresentation;
        /**
         * 건물 불투명도
         */
        opacity: number;
        /**
         * 건물 표시 여부. <br>
         * `false`이면 Mesh를 만들되 화면에 그리지 않음
         */
        visible: boolean;
        /**
         * 재질의 렌더링 면. <br>
         * 기본 스타일에서만 사용
         */
        side?: three.Side;
        /**
         * 레이어 전체 바운딩 박스 중심에 표시할 공통 라벨. <br>
         * `setStyle()`에서 사용
         */
        label?: string;
        /**
         * `true`이면 레이어 옵션과 무관하게 텍스처 재질을 만들고, `false`이면 단색 재질을 만듦
         */
        imgvisible?: boolean;
        /**
         * 이 건물에만 사용할 텍스처 URL 또는 URL 배열. <br>
         * 생략하면 레이어의 `textureurl`을 사용
         */
        imgurl?: string | Array<string>;
        /**
         * `true`이면 `textureurl`의 모든 텍스처를 재질 배열로 만들고 `multiSideFunction`으로 면마다 재질을 고름
         */
        multipleTexture?: boolean;
        /**
         * 건물의 각 면에 사용할 재질 인덱스와 반복 설정을 반환하는 함수입니다.
         */
        multiSideFunction?: U3dModelShapeMultiSideFunction;
    };

/**
     * `multiSideFunction`의 반환값입니다. <br>
     * `undefined`이면 해당 면을 재질 그룹에 넣지 않아 그리지 않습니다.
     */
    type U3dModelShapeFaceStyleResult = undefined | U3dModelShapeFaceStyle;

/**
     * `multiSideFunction`이 한 면에 대해 반환하는 재질 선택 결과입니다.
     */
    type U3dModelShapeFaceStyle = {
        /**
         * `textureurl` 배열 범위 안의 재질 인덱스 1~2개. <br>
         * 두 개면 두 번째 텍스처를 첫 번째 위에 합성함
         */
        materialIndex: Array<number>;
        /**
         * 두 텍스처를 합성할 때 두 번째 이미지의 상대 크기. <br>
         * 기본값 `1`
         */
        imageScale?: number;
        /**
         * `repeat`이 `1`보다 클 때 필요한 캔버스 한 변의 양수 픽셀 크기
         */
        imageSize?: number;
        /**
         * 텍스처를 가로·세로로 반복할 횟수. <br>
         * `1` 초과일 때만 적용
         */
        repeat?: number;
    };

/**
     * 건물 Mesh의 한 층을 구성하는 삼각형 면 정보입니다. <br>
     * 정점과 법선은 Mesh 중심을 기준으로 한 로컬 좌표입니다.
     */
    type U3dModelShapeFloorFace = {
        /**
         * 1부터 시작하는 층 번호. <br>
         * 수평면은 `'roof'`
         */
        floor: number | "roof";
        /**
         * 면을 이루는 세 정점의 로컬 좌표
         */
        vertices: Array<three.Vector3>;
        /**
         * 세 정점의 법선 벡터
         */
        normals: Array<three.Vector3>;
        /**
         * 삼각형의 가장 긴 변에서 층 높이를 제거해 계산한 가로 폭(월드 단위)
         */
        width: number;
    };

/**
     * 층 순회 콜백입니다. <br>
     * 인접한 두 삼각형을 한 면으로 묶어 호출하며, 층 정보가 없으면 모든 인수가 `undefined`인 채 한 번 호출됩니다.
     */
    type U3dModelShapeFloorCallback = (mesh: U3dModelShapeMesh | undefined, vertices: Array<WorldPositionVector3> | undefined, width: number | undefined, floor: number | "roof" | undefined, normal: three.Vector3 | undefined) => void;

/**
     * 면마다 재질을 선택하는 사용자 함수입니다. <br>
     * Mesh, 월드 좌표(EPSG:3857) 정점, 월드 단위 폭, 1부터 시작하는 층 번호와 Mesh 로컬 법선을 받습니다. <br>
     * `undefined`를 반환하면 그 면을 그리지 않습니다.
     */
    type U3dModelShapeMultiSideFunction = (mesh: U3dModelShapeMesh, vertices: Array<WorldPositionVector3>, width: number, floor: number | "roof", normal: three.Vector3) => U3dModelShapeFaceStyleResult;

/**
     * `styleFunction`의 반환값입니다. <br>
     * `undefined`이면 공통 `style`을 사용합니다.
     */
    type U3dModelShapeStyleResult = undefined | Partial<U3dModelShapeStyle>;

/**
     * Feature별 표시 스타일을 정하는 사용자 함수입니다.
     */
    type U3dModelShapeStyleFunction = (feature: U3dModelShapeFeature) => U3dModelShapeStyleResult;

/**
     * ~extends import('@union3d/geometry/UExtrudeGeometry').UExtrudeGeometry <br>
     *
     * 평면 윤곽을 높이 방향으로 늘려 만든 건물 지오메트리가 층 선택을 위해 보관하는 층별 면 목록입니다.
     */
    type U3dModelShapeGeometry_Content = {
        /**
         * 층 번호 또는 `'roof'`를 키로 하는 면 목록. <br>
         * `multiSideFunction` 적용 시 생성됨
         */
        _floor?: Record<string, Array<U3dModelShapeFloorFace>>;
    };

/**
     * ~extends import('@union3d/geometry/UExtrudeGeometry').UExtrudeGeometry <br>
     *
     * 평면 윤곽을 높이 방향으로 늘려 만든 건물 지오메트리가 층 선택을 위해 보관하는 층별 면 목록입니다.
     */
    type U3dModelShapeGeometry = UExtrudeGeometry & U3dModelShapeGeometry_Content;

/**
     * 건물 Mesh의 `userData`에 레이어가 기록하는 값입니다.
     */
    type U3dModelShapeMeshUserData = {
        /**
         * 건물 라벨 POI. <br>
         * 라벨을 끄면 제거됨
         */
        label?: U3dPOI;
        /**
         * 월드 스케일로 변환한 지면 기준 높이
         */
        landHeight?: number;
        /**
         * 월드 스케일로 변환한 건물 전체 높이
         */
        buildHeight?: number;
        /**
         * Feature `id` 또는 위치 기반 생성 키
         */
        id?: string;
        /**
         * 마지막으로 적용한 스타일의 표시 여부
         */
        styleinfo?: {
            visible: boolean;
        };
        /**
         * 층 분리 복제 Mesh가 가리키는 원본 Mesh의 `uuid`
         */
        originMeshID?: string;
        /**
         * 마지막으로 지면 높이를 맞춘 타일 레벨
         */
        _rlevel?: number;
    };

/**
     * ~extends import('@union3d/core/mesh/UShpMesh').UShpMesh <br>
     *
     * 레이어가 건물 Mesh에 추가로 기록하는 속성과 런타임 확장 메서드입니다.
     */
    type U3dModelShapeMesh_Content = {
        /**
         * 바운딩 박스 중심(월드 좌표(EPSG:3857))
         */
        _center?: three.Vector3;
        /**
         * `setGroupOriginPosition()`이 저장한 층 분리 이동 기준 위치
         */
        _oriPosition?: three.Vector3;
        /**
         * 층 분리 이동이 적용된 상태인지 여부
         */
        _isFloorSet?: boolean;
        /**
         * 라벨 필드가 없을 때 라벨로 사용하는 이름
         */
        _name?: string;
        /**
         * Mesh를 만든 원본 Feature의 공유 참조. <br>
         * Mesh 해제 뒤에는 사용하지 않음
         */
        _ufeature: U3dModelShapeFeature | undefined;
        /**
         * 원본 Feature 속성 객체의 공유 참조
         */
        _uproperties: KeyValue | undefined;
        /**
         * 층 정보를 포함하는 압출 지오메트리
         */
        geometry: U3dModelShapeGeometry;
        /**
         * 레이어가 기록하는 사용자 데이터
         */
        userData: U3dModelShapeMeshUserData;
        /**
         * 행렬 자동 갱신을 끄고 현재 행렬을 확정하는 함수입니다.
         */
        setManualUpdate: () => void;
    };

/**
     * ~extends import('@union3d/core/mesh/UShpMesh').UShpMesh <br>
     *
     * 레이어가 건물 Mesh에 추가로 기록하는 속성과 런타임 확장 메서드입니다.
     */
    type U3dModelShapeMesh = UShpMesh & U3dModelShapeMesh_Content;

/**
     * ~extends import('@UMesh').UMesh <br>
     *
     * 선택한 층을 덮는 강조 Mesh입니다. <br>
     * Mesh는 화면에 그릴 지오메트리와 재질을 묶은 객체이며, 이 타입은 한 층 높이로 압출한 지오메트리를 사용합니다.
     */
    type U3dModelShapeHighlightMesh_Content = {
        /**
         * 강조 색상과 불투명도를 가진 재질
         */
        material: three.MeshBasicMaterial;
        /**
         * 한 층 높이의 압출 지오메트리
         */
        geometry: UExtrudeGeometry;
        /**
         * 행렬 자동 갱신을 끄고 현재 행렬을 확정하는 함수입니다.
         */
        setManualUpdate: () => void;
    };

/**
     * ~extends import('@UMesh').UMesh <br>
     *
     * 선택한 층을 덮는 강조 Mesh입니다. <br>
     * Mesh는 화면에 그릴 지오메트리와 재질을 묶은 객체이며, 이 타입은 한 층 높이로 압출한 지오메트리를 사용합니다.
     */
    type U3dModelShapeHighlightMesh = UMesh & U3dModelShapeHighlightMesh_Content;

/**
     * `setSelectFloor()`가 건물별로 보관하는 층 선택 상태입니다. <br>
     * 클리핑 평면은 카메라에 표시할 공간을 경계면 기준으로 잘라내는 렌더링 설정입니다.
     */
    type U3dModelShapeSelectedFloor = {
        /**
         * 선택한 층을 덮는 강조 Mesh
         */
        highLight: U3dModelShapeHighlightMesh;
        /**
         * 투명 선택 시 위쪽 클리핑 평면
         */
        upPlane?: three.Plane;
        /**
         * 투명 선택 시 아래쪽 클리핑 평면
         */
        downPlane?: three.Plane;
    };

/**
     * 타일 키별로 어떤 건물이 걸쳐 있는지와 건물별로 어떤 타일이 그려졌는지 기록하는 색인 항목입니다.
     */
    type U3dModelShapeModelIndex = {
        model: U3dModelShapeMesh;
    } & Record<string, boolean | U3dModelShapeMesh>;

/**
     * `createLabel()`에 전달하는 라벨 생성 옵션입니다. <br>
     * `label` 또는 `image` 중 하나는 있어야 합니다.
     */
    type U3dModelShapeLabelOptions = {
        /**
         * 라벨 POI 이름
         */
        name?: string;
        /**
         * 라벨 문자열
         */
        label?: string;
        /**
         * 이미지 데이터 URL
         */
        image?: string;
        /**
         * 라벨 위치(월드 좌표(EPSG:3857)). 생략하면 건물 중심 위
         */
        position?: three.Vector3;
        /**
         * 라벨 색상
         */
        color?: three.ColorRepresentation;
        /**
         * 화면에 그릴 텍스트 크기
         */
        size?: number;
        /**
         * POI 캔버스 안에서 라벨을 세로로 보정하는 픽셀 값
         */
        heightOffset?: number;
        /**
         * 화면에 그릴 이미지의 픽셀 크기
         */
        imageSize?: number;
    };

/**
     * `setSideStyle()`과 `setTopStyle()`에 전달하는 재질 옵션입니다.
     */
    type U3dModelShapeMaterialOptions = {
        /**
         * 재질 색상. <br>
         * 기본값 `0xfaebd7`
         */
        color?: three.ColorRepresentation;
        /**
         * 발광 색상. <br>
         * 기본값 `0x000000`
         */
        emissive?: three.ColorRepresentation;
        /**
         * `0`부터 `1`까지의 금속성. <br>
         * 기본값 `0`
         */
        metalness?: number;
        /**
         * `0`부터 `1`까지의 표면 거칠기. <br>
         * 기본값 `0.8`
         */
        roughness?: number;
        /**
         * `0`부터 `1`까지의 불투명도. <br>
         * 옆면 기본값 `1`, 윗면 기본값은 레이어 불투명도
         */
        opacity?: number;
        /**
         * 투명 처리 여부. <br>
         * 생략하면 `opacity < 1`
         */
        transparent?: boolean;
        /**
         * 카메라를 향한 앞면·뒷면 중 렌더링할 방향. <br>
         * 기본값 `DoubleSide`
         */
        side?: three.Side;
        /**
         * `true`이면 색상을 회색조로 바꾸고 발광색으로도 사용
         */
        setGrayscale?: boolean;
        /**
         * 다른 물체와의 앞뒤 판정에 쓰는 깊이 버퍼 기록 여부. <br>
         * 기본값 `true`
         */
        depthWrite?: boolean;
        /**
         * 겹친 면의 깜빡임을 줄이는 깊이 보정 계수. <br>
         * `0`이 아니면 `polygonOffsetFactor`로 사용
         */
        polygonOffset?: number;
        /**
         * 양수인 Mesh 크기 배율. <br>
         * 숫자면 세 축에 같은 값, 객체면 축별 값
         */
        scale?: number | three.Vector3Like;
    };

/**
     * 생성자 밖에서 필요할 때만 기록되는 레이어 런타임 필드입니다. <br>
     * 값이 없을 수 있으므로 모두 선택 속성입니다.
     */
    type U3dModelShapeLayerRuntimeFields = Partial<{
        _activeInterval: U3dModelShapeActiveInterval;
        _allModelIsAddScene: boolean;
        _useproxy: boolean;
    }>;

/**
     * `animateInterval()`이 진행 중인 층 분리 애니메이션을 보관하는 상태입니다.
     */
    type U3dModelShapeActiveInterval = {
        /**
         * 진행 중인 타이머
         */
        timer: ReturnType<typeof setInterval>;
        /**
         * 애니메이션 완료를 알리는 대기 객체
         */
        promise: DeferredObject<void>;
    };

/**
     * `addFeature()`가 처리하는 GeoJSON 도형입니다. <br>
     * 좌표는 `[경도, 위도]` 순서의 위경도 좌표계(EPSG:4326)이며 현재 구현은 첫 외곽선만 건물 윤곽으로 사용합니다.
     */
    type U3dModelShapeGeoJSONGeometry = {
        /**
         * 현재 지원하는 GeoJSON 도형 종류
         */
        type: "Polygon" | "MultiPolygon" | "LineString";
        /**
         * 도형 종류에 맞게 중첩된 `[경도, 위도]` 좌표 배열. <br>
         * 빈 배열은 처리하지 않음
         */
        coordinates: Double_Array<number> | Triple_Array<number> | Array<Triple_Array<number>>;
    };

/**
     * 건물 윤곽과 속성을 전달하는 피처(Feature)입니다. <br>
     * Feature 구조를 기반으로 하는 단일 도형 요소입니다. <br>
     * `uuid`는 건물 생성 시 레이어가 Mesh의 `uuid`로 채웁니다.
     */
    type U3dModelShapeFeature = {
        /**
         * 연결된 건물 Mesh의 uuid. <br>
         * 건물 생성 전에는 없음
         */
        uuid?: string;
        /**
         * Feature를 식별하거나 라벨·Mesh 키를 만드는 데 쓰는 문자열 ID
         */
        id?: string;
        /**
         * 높이·라벨·층과 사용자 속성을 읽는 객체. <br>
         * 생략하면 건물 생성 시 빈 객체로 채움
         */
        properties?: KeyValue;
        /**
         * 피처 geometry 정보
         */
        geometry: U3dModelShapeGeoJSONGeometry;
    };

/**
     * 건물로 생성할 피처를 묶은 컬렉션(FeatureCollection)입니다. <br>
     * 여러 개의 Feature를 하나로 묶은 컬렉션입니다. <br>
     * `uuid`는 `addFeatureCollection()`이 채웁니다.
     */
    type U3dModelShapeFeatureCollection = {
        /**
         * GeoJSON 종류. <br>
         * 보통 `FeatureCollection`
         */
        type?: string;
        /**
         * 레이어가 등록 시 부여하는 컬렉션 식별자
         */
        uuid?: string;
        /**
         * 컬렉션에 속한 Feature 목록
         */
        features: Array<U3dModelShapeFeature>;
    };

/**
     * ~extends U3dModelLayerCO <br>
     *
     * U3dModelShapeLayer의 초기 표시·높이·스타일 설정입니다.
     */
    type U3dModelShapeLayerCO_Content = {
        /**
         * 레이어 이름
         */
        name?: string;
        /**
         * SHP 모델 외관선 생성 여부
         */
        drawline?: boolean;
        /**
         * 레이어의 월드 좌표(EPSG:3857) 식별자
         */
        crs?: string;
        /**
         * SHP 모델 원본 소스의 좌표계
         */
        sourceCRS?: string;
        /**
         * 레이어를 출력할 최소 타일 레벨
         */
        minlevel?: number;
        /**
         * `0`부터 `1`까지의 레이어 불투명도
         */
        opacity?: number;
        /**
         * 호환용 부모 옵션. <br>
         * 현재 구현은 전달값 대신 `opacity < 1`로 결정함
         */
        transparent?: boolean;
        /**
         * SHP 모델 Data source URL
         */
        url?: string;
        /**
         * 설정값으로 보관할 SHP 모델 featureCollection. <br>
         * 건물 Mesh는 만들지 않음
         */
        featureCollection?: U3dModelShapeFeatureCollection;
        /**
         * 라벨 정보 목록. <br>
         * 현재 구현은 보관만 함
         */
        labelInfo?: Array<KeyValue>;
        /**
         * 모든 건물에 적용할 공통 스타일
         */
        style?: U3dModelShapeStyle;
        /**
         * SHP 모델 출력 시 Mesh의 윗면과 옆면의 스타일을 별도로 지정할지 여부
         */
        setTopSideStyle?: boolean;
        /**
         * SHP 모델에 POI Label을 출력할지 여부
         */
        showLabel?: boolean;
        /**
         * 건물 전체 높이를 읽을 Feature 속성 이름
         */
        fieldheight?: string;
        /**
         * 지면(지형)에서 띄울 높이를 읽을 Feature 속성 이름
         */
        fieldlandheight?: string;
        /**
         * 라벨 문자열을 읽을 Feature 속성 이름
         */
        fieldlabeltext?: string;
        /**
         * 층수를 읽을 Feature 속성 이름
         */
        fieldFloor?: string;
        /**
         * 공통 층 높이(m). 층수로 전체 높이를 계산하고 층 선택 경계를 나눌 때 사용
         */
        floorHeight?: number;
        /**
         * 건물마다 층 높이를 읽을 Feature 속성 이름. <br>
         * 지정하면 `floorHeight`보다 우선
         */
        fieldFloorHeight?: string;
        /**
         * Feature별 건물 전체 높이(m)를 반환하는 함수입니다.
         */
        heightFunction?: (feature: U3dModelShapeFeature) => number;
        /**
         * Feature별 지면 기준 높이(m)를 반환하는 함수입니다.
         */
        landHeightFunction?: (feature: U3dModelShapeFeature) => number;
        /**
         * 윗면·옆면이 겹쳐 깜빡이는 Z-fighting을 줄이는 깊이 보정 계수
         */
        depthOffset?: number;
        /**
         * Feature별 표시 스타일을 반환하는 함수입니다.
         */
        styleFunction?: U3dModelShapeStyleFunction;
        /**
         * SHP 모델에 텍스처를 지정할지 여부
         */
        usetexture?: boolean;
        /**
         * 미리 불러올 텍스처 URL 또는 URL 배열. <br>
         * 두 값을 모두 생략하면 빈 배열
         */
        textureurl?: string | Array<string>;
        /**
         * `textureurl`의 별칭
         */
        textureUrl?: string | Array<string>;
        /**
         * 텍스처 요청 앞에 붙일 프록시 URL. <br>
         * 현재 생성 경로에는 프록시 활성 옵션이 없어 빈 문자열로 초기화됨
         */
        proxyurl?: string;
    };

/**
     * ~extends U3dModelLayerCO <br>
     *
     * U3dModelShapeLayer의 초기 표시·높이·스타일 설정입니다.
     */
    type U3dModelShapeLayerCO = Omit<Omit<U3dModelLayerCO, never> & U3dModelShapeLayerCO_Content, never>;

export type { U3dModelShapeActiveInterval, U3dModelShapeFaceStyle, U3dModelShapeFaceStyleResult, U3dModelShapeFeature, U3dModelShapeFeatureCollection, U3dModelShapeFloorCallback, U3dModelShapeFloorFace, U3dModelShapeGeoJSONGeometry, U3dModelShapeGeometry, U3dModelShapeGeometry_Content, U3dModelShapeHighlightMesh, U3dModelShapeHighlightMesh_Content, U3dModelShapeLabelOptions, U3dModelShapeLayerCO, U3dModelShapeLayerCO_Content, U3dModelShapeLayerParam, U3dModelShapeLayerRuntimeFields, U3dModelShapeMaterialOptions, U3dModelShapeMesh, U3dModelShapeMeshUserData, U3dModelShapeMesh_Content, U3dModelShapeModelIndex, U3dModelShapeMultiSideFunction, U3dModelShapeSelectedFloor, U3dModelShapeStyle, U3dModelShapeStyleFunction, U3dModelShapeStyleResult };
