// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U2dVectorShaderLayer } from "../../2dLayer/U2dVectorShaderLayer.js";
import type { U3dImageLayer } from "../../3dLayer/U3dImageLayer.js";
import type { U3dLayer } from "../../3dLayer/U3dLayer.js";
import type { U3dApp } from "../../app/U3dApp.js";
import type { TerrainDecalConfig } from "./UShaderTerrainDecalConfig.js";
import type { TerrainCompositeStepStopReason } from "./UTerrainDecalCompositeComposer.types.js";
import type { TerrainDecalCompositionPlan, TerrainDecalCompositionStability } from "./UTerrainDecalCompositionPlan.types.js";

/**
     * terrain decal에서 사용하는 3차원 좌표입니다.
     */
    type TerrainPoint = {
        /**
         * X 좌표입니다.
         */
        x: number;
        /**
         * Y 좌표입니다.
         */
        y: number;
        /**
         * Z 좌표입니다.
         */
        z?: number;
    };

/**
     * RGB 채널로 표현한 색상입니다.
     */
    type TerrainColorChannels = {
        /**
         * 빨강 채널입니다.
         */
        r?: number;
        /**
         * 초록 채널입니다.
         */
        g?: number;
        /**
         * 파랑 채널입니다.
         */
        b?: number;
    };

type TerrainColor = three.Color | Array<number> | TerrainColorChannels | three.ColorRepresentation;

/**
     * terrain decal LOD level 구간입니다.
     */
    type TerrainDecalLodBand = {
        /**
         * 적용할 최소 tile level입니다.
         */
        minLevel?: number;
        /**
         * 적용할 최대 tile level입니다.
         */
        maxLevel?: number;
        /**
         * 표시할 최소 feature 우선순위입니다.
         */
        minPriority?: number;
        /**
         * 표시할 최대 feature 수입니다.
         */
        maxFeatures?: number;
    };

type TerrainLodFilter = (feature: TerrainFeature, tileLevel: number) => boolean;

/**
     * 서버 LOD 질의를 구성할 때 전달하는 tile 문맥입니다.
     */
    type TerrainLodQueryContext = {
        /**
         * WFS BBOX 범위입니다.
         */
        extent: Array<number>;
        /**
         * 기본 WFS layer 이름입니다.
         */
        layerName?: string;
        /**
         * 기본 CQL 조건입니다.
         */
        cql?: string;
    };

/**
     * 서버 LOD 질의의 선택적 변경값입니다.
     */
    type TerrainLodQueryResult = {
        /**
         * tile level에 사용할 WFS layer 이름입니다.
         */
        layerName?: string;
        /**
         * tile level에 사용할 CQL 조건입니다.
         */
        cql?: string;
        /**
         * 추가 WFS query parameter입니다.
         */
        params?: Record<string, string | number | boolean>;
    };

type TerrainLodQuery = (tileLevel: number, profile: TerrainDecalLodProfile, context: TerrainLodQueryContext) => TerrainLodQueryResult | undefined;

/**
     * terrain decal LOD 설정입니다.
     */
    type TerrainDecalLodProfile = {
        /**
         * profile 식별자입니다.
         */
        id?: string;
        /**
         * profile 변경 버전입니다.
         */
        version?: number;
        /**
         * tile level별 선별 구간입니다.
         */
        bands?: Array<TerrainDecalLodBand>;
        /**
         * 추가 feature 선별 함수입니다.
         */
        filter?: TerrainLodFilter;
    };

/**
     * terrain decal LOD 선별 결과입니다.
     */
    type TerrainDecalLodSelection = {
        /**
         * 실제 렌더링할 feature 목록입니다.
         */
        features: Array<TerrainFeature>;
        /**
         * 선별 전 feature 수입니다.
         */
        sourceFeatureCount: number;
        /**
         * 선별 후 feature 수입니다.
         */
        renderFeatureCount: number;
        /**
         * 적용된 profile 식별자입니다.
         */
        profileId: string;
        /**
         * 적용된 profile 버전입니다.
         */
        profileVersion: number;
    };

/**
     * 부모 decal texture의 UV 변환입니다.
     */
    type TerrainDecalUvTransform = {
        /**
         * UV 축척입니다.
         */
        scale: Array<number>;
        /**
         * UV 이동값입니다.
         */
        offset: Array<number>;
    };

/**
     * bucket 격자의 index 범위입니다.
     */
    type TerrainBounds = {
        /**
         * 최소 X index입니다.
         */
        minX: number;
        /**
         * 최소 Y index입니다.
         */
        minY: number;
        /**
         * 최대 X index입니다.
         */
        maxX: number;
        /**
         * 최대 Y index입니다.
         */
        maxY: number;
    };

/**
     * terrain decal 스타일입니다.
     */
    type TerrainStyle = {
        /**
         * 면 색상입니다.
         */
        fillColor?: TerrainColor;
        /**
         * 선 색상입니다.
         */
        strokeColor?: TerrainColor;
        /**
         * 기본 색상입니다.
         */
        color?: TerrainColor;
        /**
         * 면 투명도입니다.
         */
        fillOpacity?: number;
        /**
         * 선 투명도입니다.
         */
        strokeOpacity?: number;
        /**
         * 선 두께입니다.
         */
        strokeWidth?: number;
        /**
         * 기본 투명도입니다.
         */
        opacity?: number;
        /**
         * 표시 여부입니다.
         */
        visible?: boolean;
        /**
         * 강조 여부입니다.
         */
        highlight?: boolean;
    };

/**
     * 즉시 생성에 사용할 정규화된 스타일입니다.
     */
    type TerrainPreparedStyle = {
        /**
         * 면 RGBA 색상입니다.
         */
        fillColor: Array<number>;
        /**
         * 선 RGBA 색상입니다.
         */
        strokeColor: Array<number>;
        /**
         * 면 투명도입니다.
         */
        fillOpacity: number;
        /**
         * 선 투명도입니다.
         */
        strokeOpacity: number;
        /**
         * 선 두께입니다.
         */
        strokeWidth: number;
        /**
         * 표시 여부입니다.
         */
        visible: boolean;
    };

/**
     * terrain decal feature입니다.
     */
    type TerrainFeature = {
        /**
         * feature 식별자입니다.
         */
        featureId: string | number;
        /**
         * 구버전 고유 식별자입니다.
         */
        uid?: string | number;
        /**
         * 구버전 식별자입니다.
         */
        id?: string | number;
        /**
         * feature 캐시 key입니다.
         */
        featureCacheKey?: string;
        /**
         * source 범위가 포함된 feature key입니다.
         */
        scopedFeatureKey?: string;
        /**
         * source key입니다.
         */
        sourceKey?: string;
        /**
         * source identity와 collection epoch를 결합한 Base Cache 범위입니다.
         */
        sourceIdentityKey?: string;
        /**
         * 도형 유형입니다.
         */
        type?: string;
        /**
         * source 도형 유형입니다.
         */
        sourceType?: string;
        /**
         * 스타일입니다.
         */
        style?: TerrainStyle;
        /**
         * 기준 좌표입니다.
         */
        origin?: TerrainPoint;
        /**
         * 좌표 목록입니다.
         */
        vectors?: Array<TerrainPoint | Array<number>>;
        /**
         * path와 area를 제한할 평면 범위입니다.
         */
        clipBounds?: Array<number>;
        /**
         * path 단순화 허용 거리입니다.
         */
        pathSimplifyTolerance?: number;
        /**
         * 강조 여부입니다.
         */
        highlight?: boolean;
        /**
         * 표시 여부입니다.
         */
        visible?: boolean;
        /**
         * 표시 순서입니다.
         */
        renderOrder?: number;
        /**
         * 같은 표시 순서에서 사용할 Layer-local 최초 등록 순번입니다.
         */
        featureCompositionOrdinal?: number;
        /**
         * feature가 속한 terrain composition group key입니다.
         */
        compositionGroupKey?: string;
        /**
         * polygon outer·hole을 하나로 묶는 atomic 합성 feature key입니다.
         */
        compositionFeatureKey?: string;
        /**
         * Layer 공개 renderOrder에서 파생한 group 사이 합성 순서입니다.
         */
        compositionRenderOrder?: number;
        /**
         * Layer group의 최초 등록 순번입니다.
         */
        compositionGroupOrder?: number;
        /**
         * 합성 계획이 부여한 batch 순번입니다.
         */
        compositionBatchIndex?: number;
        /**
         * feature를 적용할 shader layer 순서입니다.
         */
        shaderLayerRenderOrder?: number;
        /**
         * 변경 버전입니다.
         */
        revision?: number;
        /**
         * geometry 변경 버전입니다.
         */
        geometryRevision?: number;
        /**
         * style 변경 버전입니다.
         */
        styleRevision?: number;
        /**
         * 표시 property 변경 버전입니다.
         */
        propertyRevision?: number;
        /**
         * 임계값입니다.
         */
        threshold?: number;
        /**
         * 투명도입니다.
         */
        opacity?: number;
        /**
         * 반경입니다.
         */
        radius?: number;
        /**
         * 구멍 여부입니다.
         */
        isHole?: boolean;
        /**
         * 표시를 시작할 최소 terrain tile level입니다.
         */
        minTerrainLevel?: number;
        /**
         * LOD 선별 우선순위입니다.
         */
        lodPriority?: number;
        /**
         * 함께 선별할 feature 그룹 key입니다.
         */
        lodGroupKey?: string;
        /**
         * 실행 중 추가된 feature 여부입니다.
         */
        runtime?: boolean;
        /**
         * 선택 상태 여부입니다.
         */
        selected?: boolean;
        /**
         * 기존 측정 feature의 강조 상태입니다.
         */
        _ishighLight?: boolean;
        /**
         * 기존 feature의 style 변경 버전입니다.
         */
        _styleRevision?: number;
        /**
         * feature 해시입니다.
         */
        featureHash?: number;
        /**
         * tile 위치와 clipping을 제외하여 재사용할 수 있는 feature 해시입니다.
         */
        immutableFeatureHash?: number;
        /**
         * 추정 바이트 크기입니다.
         */
        byteLength?: number;
        /**
         * 즉시 생성용 정규화 여부입니다.
         */
        __terrainPrepared?: boolean;
        /**
         * 즉시 생성용 캐시입니다.
         */
        __preparedImmediateBase?: TerrainPreparedEntry;
    };

/**
     * 즉시 생성을 위해 준비된 feature의 공통 상태입니다.
     */
    type TerrainPreparedEntryBase = {
        /**
         * feature 식별자입니다.
         */
        featureId?: string | number;
        /**
         * source 범위 feature key입니다.
         */
        scopedFeatureKey?: string;
        /**
         * local path와 area 제한 범위입니다.
         */
        clipBounds?: Array<number>;
        /**
         * path 단순화 허용 거리입니다.
         */
        pathSimplifyTolerance?: number;
        /**
         * 정규화된 스타일입니다.
         */
        style: TerrainPreparedStyle;
        /**
         * 표시 여부입니다.
         */
        visible: boolean;
        /**
         * 표시 순서입니다.
         */
        renderOrder: number;
        /**
         * feature를 적용할 shader layer 순서입니다.
         */
        shaderLayerRenderOrder: number;
        /**
         * 변경 버전입니다.
         */
        revision: number;
        /**
         * 평면 범위입니다.
         */
        bounds?: Array<number>;
        /**
         * 선분의 시작 X 좌표입니다.
         */
        x1?: number;
        /**
         * 선분의 시작 Y 좌표입니다.
         */
        y1?: number;
        /**
         * 선분의 종료 X 좌표입니다.
         */
        x2?: number;
        /**
         * 선분의 종료 Y 좌표입니다.
         */
        y2?: number;
        /**
         * path 스타일 순번입니다.
         */
        pathStyleIndex?: number;
        /**
         * 교차 순서를 유지할 합성 batch 순번입니다.
         */
        compositionBatchIndex?: number;
    };

type TerrainPreparedPathEntry = TerrainPreparedEntryBase & {
        type: "path";
        points: Array<TerrainPoint>;
    };

type TerrainPreparedAreaEntry = TerrainPreparedEntryBase & {
        type: "area";
        points: Array<TerrainPoint>;
    };

type TerrainPreparedCircleEntry = TerrainPreparedEntryBase & {
        type: "circle";
        center: TerrainPoint;
        radius: number;
    };

/**
     * 도형 유형별 필수 좌표 계약을 보존하는 준비된 feature입니다.
     */
    type TerrainPreparedEntry = TerrainPreparedPathEntry | TerrainPreparedAreaEntry | TerrainPreparedCircleEntry;

/**
     * tile-local 좌표와 평면 범위까지 확정된 준비 항목입니다.
     */
    type TerrainPreparedLocalEntry = TerrainPreparedEntry & {
        bounds: Array<number>;
    };

/**
     * path 선분을 평탄화한 결과입니다.
     */
    type TerrainFlattenedPathState = {
        /**
         * 선분 목록입니다.
         */
        items: Array<TerrainPathSegment>;
        /**
         * path 스타일 목록입니다.
         */
        styles: Array<TerrainPreparedStyleEntry>;
        /**
         * 전체 평면 범위입니다.
         */
        fullBounds: Array<number>;
    };

type TerrainPreparedStyleEntry = {
        style: TerrainPreparedStyle;
        visible: boolean;
        renderOrder: number;
        shaderLayerRenderOrder: number;
        revision: number;
        compositionBatchIndex?: number;
    };

type TerrainPathSegment = {
        type: "path";
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        bounds: Array<number>;
        pathStyleIndex: number;
    };

/**
     * bucket index texture를 생성하기 위한 중간 상태입니다.
     */
    type TerrainBucketIndexState = {
        /**
         * bucket 메타 정보입니다.
         */
        bucketMeta: Array<Array<number>>;
        /**
         * bucket index 배열입니다.
         */
        bucketIndexArray: Float32Array;
        /**
         * bucket index texture 높이입니다.
         */
        bucketIndexHeight?: number;
    };

/**
     * terrain bucket 상태입니다.
     */
    type TerrainBucketState = {
        /**
         * 항목 수입니다.
         */
        count: number;
        /**
         * 데이터 texture 너비입니다.
         */
        dataWidth: number;
        /**
         * 데이터 texture 높이입니다.
         */
        dataHeight: number;
        /**
         * 데이터 배열입니다. area는 선형 레이아웃으로 texel [0, count)가 행 header
         * vec4(pointCount, shaderLayerRenderOrder, compositionBatchIndex, pointStart)이고 그 뒤에 entry별 점 목록이 한 번씩 이어집니다.
         */
        dataArray: Float32Array;
        /**
         * area 상태에서 header 뒤에 이어지는 점 texel 수입니다(bucket 중복 행은 같은 점 목록을 공유합니다).
         */
        pointTexelCount?: number;
        /**
         * 스타일 texture 너비입니다. area·circle 은 행당 3 texel 을 선형 2차원 배치한 물리 크기라 논리 행 수와 다릅니다.
         */
        styleWidth: number;
        /**
         * 스타일 texture 높이입니다. 논리 행 수는 `count` 를 사용합니다.
         */
        styleHeight: number;
        /**
         * 스타일 배열입니다. area·circle 은 행마다 12 성분(`row * 12`)이며 texture capacity 만큼 0 으로 패딩됩니다.
         */
        styleArray: Float32Array;
        /**
         * 전체 평면 범위입니다.
         */
        fullBounds: Array<number>;
        /**
         * 별도 bucket 메타 정보입니다.
         */
        bucketMeta?: Array<Array<number> | Partial<{
            x: number;
            y: number;
            z: number;
            w: number;
        }>>;
        /**
         * bucket 격자 크기입니다.
         */
        bucketGrid: Array<number>;
        /**
         * bucket index texture 너비입니다.
         */
        bucketIndexWidth?: number;
        /**
         * bucket index texture 높이입니다.
         */
        bucketIndexHeight?: number;
        /**
         * path에서는 bucket meta texel 뒤에 segment index가 이어지는 배열입니다.
         */
        bucketIndexArray?: Float32Array;
        /**
         * 선분 메타 texture 너비입니다.
         */
        segmentMetaWidth?: number;
        /**
         * 선분 메타 texture 높이입니다.
         */
        segmentMetaHeight?: number;
        /**
         * 선분 메타 배열입니다.
         */
        segmentMetaArray?: Float32Array;
        /**
         * 범위 texture 너비입니다. area 는 행당 1 texel 을 선형 2차원 배치한 물리 크기입니다.
         */
        boundsWidth?: number;
        /**
         * 범위 texture 높이입니다.
         */
        boundsHeight?: number;
        /**
         * 범위 배열입니다. area 는 행마다 4 성분(`row * 4`)이며 texture capacity 만큼 0 으로 패딩됩니다.
         */
        boundsArray?: Float32Array;
        /**
         * bucket 사용 여부입니다.
         */
        useBuckets?: number;
    };

/**
     * worker가 생성한 terrain 결과입니다.
     */
    type TerrainWorkerResult = {
        /**
         * tile key입니다.
         */
        tileKey: string;
        /**
         * 변경 버전입니다.
         */
        revision: number;
        /**
         * feature 구성 서명입니다.
         */
        featureSignature: string;
        /**
         * feature 수입니다.
         */
        featureCount: number;
        /**
         * 임계값입니다.
         */
        threshold: number;
        /**
         * 투명도입니다.
         */
        opacity: number;
        /**
         * 선 도형 bucket 상태입니다.
         */
        path?: TerrainBucketState;
        /**
         * 면 도형 bucket 상태입니다.
         */
        area?: TerrainBucketState;
        /**
         * 원 도형 bucket 상태입니다.
         */
        circle?: TerrainBucketState;
        /**
         * 이 결과를 packing 할 때 실제로 쓴 tile-local 기준점의 값 사본입니다. packed 좌표는 이 기준점에 묶여 있으므로 다른 기준점의 tile 에 재생하면 좌표가 어긋납니다.
         */
        tileOrigin?: TerrainPoint;
        /**
         * 즉시 생성된 결과 여부입니다.
         */
        immediatePrepared?: boolean;
        /**
         * 결과의 바이트 크기입니다.
         */
        byteLength?: number;
    };

/**
     * GPU에 적용할 terrain 버퍼 상태입니다.
     */
    type TerrainBufferState = {
        /**
         * shader 정의입니다.
         */
        defines?: Record<string, number>;
        /**
         * shader uniform입니다.
         */
        uniforms?: Record<string, three.IUniform>;
        /**
         * 1 미만 알파를 사용하는 decal 포함 여부입니다.
         */
        hasTranslucentDecal?: boolean;
        /**
         * material 강제 갱신 여부입니다.
         */
        forceMaterialUpdate?: boolean;
        /**
         * 변경 버전입니다.
         */
        revision?: number;
        /**
         * 버퍼의 바이트 크기입니다.
         */
        byteLength?: number;
        /**
         * packing 뒤 실제로 남은 feature 수입니다. 0 이면 decal define 없이 적용이 끝나는 빈 상태입니다. 값이 없는 상태는 이 계약 이전에 만들어진 결과입니다.
         */
        featureCount?: number;
        /**
         * 이 상태를 만든 packed 결과의 tile-local 기준점 값 사본입니다. 표시 좌표는 mesh 원점 기준이므로 현재 tile 원점과 다른 상태를 재사용하면 decal 이 그 차이만큼 어긋나 보입니다. 값이 없는 상태는 이 계약 이전에 만들어진 direct 결과입니다.
         */
        tileOrigin?: TerrainPoint;
        /**
         * precomposed 결과의 host variant별 RenderTarget입니다.
         */
        compositeVariants?: Array<TerrainCompositeVariant>;
        /**
         * 합성기가 batch 범위를 계산할 때 참조할 packed 원본입니다.
         */
        packedStates?: Partial<{
            path: TerrainBucketState;
            area: TerrainBucketState;
            circle: TerrainBucketState;
        }>;
        /**
         * 합성 결과가 packed direct 입력의 소유권까지 가져왔는지 여부입니다. hybrid 결과만 `true`이며 이 경우 scheduler는 packed 입력을 따로 해제하지 않습니다.
         */
        sourceStateAbsorbed?: boolean;
        /**
         * 정적 합성 결과를 다시 쓸 수 있는지 판정하는 cache key입니다. 정적 대상의 membership·순서, 정적 Feature 해시, tile-local 기준점을 담습니다.
         */
        staticCompositeKey?: string;
        /**
         * 이 합성 결과를 만든 합성기 참조입니다. 합성기가 바뀌면 해상도 정책이 달라지므로 다시 쓰지 않습니다.
         */
        staticCompositeComposer?: object;
        /**
         * 이 합성 결과를 만들 때의 renderer texture 한 변 상한입니다. 값이 달라지면 target 해상도가 달라지므로 다시 쓰지 않습니다.
         */
        staticCompositeMaxTextureSize?: number;
        /**
         * 이 결과가 보유한 합성 target만의 추정 바이트 크기입니다. packed 입력 크기는 포함하지 않으므로 다음 revision이 target을 물려받을 때 그대로 더할 수 있습니다.
         */
        staticCompositeByteLength?: number;
        /**
         * 정적 합성을 다시 실행하지 않고 이전 target을 물려받은 결과인지 여부입니다.
         */
        staticCompositeReused?: boolean;
    };

/**
     * 하나의 image host 구간을 담당하는 precomposed 결과입니다.
     */
    type TerrainCompositeVariant = {
        /**
         * host image material의 렌더 순서입니다.
         */
        materialRenderOrder: number;
        /**
         * 다음 준비된 image material의 렌더 순서입니다.
         */
        nextRenderOrder: number;
        /**
         * 담당 host 구간을 식별하는 key입니다.
         */
        hostKey?: string;
        /**
         * texture 준비 구성이 바뀔 때 증가하는 revision입니다.
         */
        textureReadyRevision?: number;
        /**
         * 합성 결과를 담은 offscreen RenderTarget입니다.
         */
        renderTarget?: {
            texture: three.Texture;
            dispose: () => void;
        };
    };

/**
     * precomposed 합성 실행에 전달하는 불변 입력입니다.
     */
    type TerrainCompositeInput = {
        /**
         * 합성 대상 terrain tile key입니다.
         */
        tileKey: string;
        /**
         * 합성 요청이 속한 tile 세대입니다.
         */
        generation: number;
        /**
         * 합성 요청이 속한 tile revision입니다.
         */
        revision: number;
        /**
         * tile-local 좌표 기준점입니다.
         */
        tileOrigin?: TerrainPoint;
        /**
         * tile mesh가 실제로 덮는 tile-local 범위 `[minX, minY, maxX, maxY]`입니다. 합성 범위를 이 안으로 잘라 해상도를 tile에 집중합니다.
         */
        tileLocalBounds?: Array<number>;
        /**
         * 기존 packed DataTexture를 담은 direct buffer 상태입니다.
         */
        sourceState: TerrainBufferState;
        /**
         * batch 범위를 담은 합성 계획입니다.
         */
        compositionPlan?: TerrainDecalCompositionPlan;
        /**
         * 합성할 host 구간 목록입니다.
         */
        variants: Array<TerrainCompositeVariant>;
        /**
         * 합성을 실행할 현재 frame renderer입니다.
         */
        renderer?: three.WebGLRenderer;
        /**
         * 취소·dispose 시 중단을 알리는 신호입니다.
         */
        signal?: AbortSignal;
    };

/**
     * precomposed 합성을 실행하는 offscreen composer입니다.
     */
    type TerrainDecalComposer = {
        /**
         * 한 번에 전체 batch를 합성합니다.
         */
        compose?: (input: TerrainCompositeInput) => TerrainBufferState | Promise<TerrainBufferState>;
        /**
         * frame 단위로 진행할 합성 job을 생성합니다.
         */
        createJob?: (input: TerrainCompositeInput) => TerrainCompositeJobHandle;
        /**
         * 한 frame 예산만큼 합성을 진행합니다.
         */
        step?: (job: TerrainCompositeJobHandle, renderer: three.WebGLRenderer, opt?: Partial<{
            maxDrawCalls: number;
            deadlineMs: number;
            remainingWeightedMp: number;
            frameAdmitted: boolean;
        }>) => TerrainCompositeStepResult | undefined;
        /**
         * 미완료 합성 job의 자원을 정리합니다.
         */
        disposeJob?: (job: TerrainCompositeJobHandle) => void;
        /**
         * hybrid 실행에서 정적 합성 결과가 자기 범위 밖으로 번질 수 있는 최대 폭을 tile-local 단위로 계산합니다. 계산할 수 없으면 `NaN`을 반환해야 하며, 이 함수가 없으면 호출부가 hybrid를 쓰지 않습니다.
         */
        resolveTerrainCompositeSeparationMargin?: (contentBounds: Array<number> | undefined, maxTextureSize: number) => number;
        /**
         * composer가 소유한 GPU 자원을 정리합니다.
         *
         * `compose`가 반환한 Promise는 반드시 settle해야 하지만, settle하지 않아도 scheduler는 `input.signal`로
         * 중단을 알린 뒤 자신이 소유한 자원을 즉시 회수합니다. 이때 늦게 도착한 결과는 화면에 반영하지 않고
         * 결과가 만든 GPU 자원만 정리하므로, composer는 `signal`이 중단된 뒤 입력 texture를 참조하면 안 됩니다.
         */
        dispose?: () => void;
    };

/**
     * custom incremental composer가 내부에서 정의하는 불투명 job handle입니다.
     * 구현마다 구조가 달라 공용 manager는 생성·전달·폐기 외에는 내부 필드에 접근하지 않습니다.
     */
    type TerrainCompositeJobHandle = any;

/**
     * incremental composer의 frame 단위 진행 결과입니다.
     */
    type TerrainCompositeStepResult = {
        /**
         * 전체 합성 완료 여부입니다.
         */
        done?: boolean;
        /**
         * 이번 frame에 사용한 draw call 수입니다.
         */
        drawCalls?: number;
        /**
         * 이번 frame에 합성이 진행됐는지 여부입니다.
         */
        progressed?: boolean;
        /**
         * 이번 frame에 소비한 가중 픽셀(메가픽셀)입니다. 지원하지 않는 composer는 생략할 수 있으며 그때는 픽셀 예산이 차감되지 않습니다.
         */
        weightedMpUsed?: number;
        /**
         * 더 진행하지 못한 사유입니다. 생략하면 호출자는 기존 진행 처리와 같게 다룹니다.
         */
        stopReason?: TerrainCompositeStepStopReason;
        /**
         * 완료된 합성 결과입니다.
         */
        state?: TerrainBufferState;
    };

/**
     * terrain material의 확장 기능입니다.
     */
    type TerrainMaterialContent = {
        /**
         * decal 상태 정리 함수입니다.
         */
        clearTerrainDecalState?: () => void;
        /**
         * 이미지 레이어 기준 투명 상태 설정 함수입니다.
         */
        setTerrainBaseTransparent?: (transparent: boolean) => void;
        /**
         * decal 상태 적용 함수입니다.
         */
        applyTerrainDecalState?: (state: Partial<{
            defines: Record<string, number>;
            uniforms: Record<string, three.IUniform>;
            hasTranslucentDecal: boolean;
            forceMaterialUpdate: boolean;
        }>) => void;
        /**
         * terrain texture입니다.
         */
        map?: three.Texture;
        /**
         * terrain normal texture입니다.
         */
        normalMap?: three.Texture | null;
        /**
         * terrain normal texture 유형입니다.
         */
        normalMapType?: three.NormalMapTypes;
        /**
         * shader 정의입니다.
         */
        defines?: Record<string, number>;
        /**
         * 이미지 레이어 기준 투명 상태입니다.
         */
        _terrainBaseTransparent?: boolean;
        /**
         * 반투명 decal 적용 상태입니다.
         */
        _terrainDecalHasTranslucentFeature?: boolean;
        /**
         * 적용된 terrain decal 상태입니다.
         */
        _terrainDecalState?: Partial<{
            defines: Record<string, number>;
            uniforms: Record<string, three.IUniform>;
            hasTranslucentDecal: boolean;
        }>;
    };

/**
     * terrain material의 확장 기능입니다.
     */
    type TerrainMaterial = three.Material & TerrainMaterialContent;

/**
     * 전환 상태와 분리된 terrain source 데이터 식별자입니다.
     */
    type TerrainSourceIdentity = {
        /**
         * source collection 식별자입니다.
         */
        sourceId: string;
        /**
         * source를 제공하는 layer 식별자입니다.
         */
        sourceLayerId: string;
        /**
         * feature ID namespace 버전입니다.
         */
        featureNamespaceVersion: number;
        /**
         * property schema 버전입니다.
         */
        propertySchemaVersion: number;
        /**
         * geometry encoding 버전입니다.
         */
        geometryEncodingVersion: number;
        /**
         * source collection 전체 교체 시에만 증가하는 epoch입니다.
         */
        sourceCollectionEpoch: number;
        /**
         * source collection의 권위 있는 변경 revision입니다.
         */
        sourceCollectionRevision: number;
    };

/**
     * feature loop 전에 비교하는 tile-local source snapshot입니다.
     */
    type TerrainSourceSyncSnapshot = {
        /**
         * 정규화된 source identity입니다.
         */
        sourceIdentity: TerrainSourceIdentity;
        /**
         * manager source revision입니다.
         */
        sourceRevision: number;
        /**
         * tile local 좌표 기준점입니다.
         */
        origin: TerrainPoint;
        /**
         * LOD profile 식별자입니다.
         */
        lodProfileId: string;
        /**
         * LOD profile 버전입니다.
         */
        lodProfileVersion: number;
        /**
         * LOD 선별 전 feature 수입니다.
         */
        sourceFeatureCount: number;
        /**
         * 실제 렌더링할 feature 수입니다.
         */
        renderFeatureCount: number;
        /**
         * 레이어가 요청한 원래 image layer 순서입니다.
         */
        requestedTargetRenderOrder?: number;
        /**
         * source를 적용할 image layer 순서 상한입니다.
         */
        targetRenderOrder?: number;
    };

/**
     * Full Payload를 선택한 명시적 사유입니다.
     */
    type TerrainPayloadFullReason = "full:no-snapshot" | "full:source-identity-changed" | "full:source-collection-epoch-changed" | "full:delta-cost" | "full:worker-state-miss";

/**
     * terrain source 요청의 현재 상태입니다.
     */
    type TerrainSourceStatus = "unknown" | "pending" | "available" | "confirmed-empty" | "failed" | "cancelled" | "disposed";

/**
     * sourceKey별 최신 요청과 종료 상태입니다.
     */
    type TerrainSourceState = {
        /**
         * 최신 요청 식별자입니다.
         */
        requestToken?: string;
        /**
         * 최신 source revision입니다.
         */
        revision?: number;
        /**
         * 요청 상태입니다.
         */
        status: TerrainSourceStatus;
        /**
         * 실패 또는 취소 사유입니다.
         */
        errorReason?: string;
        /**
         * 최신 권위 source identity입니다.
         */
        sourceIdentity?: TerrainSourceIdentity;
        /**
         * 마지막으로 승인한 tile-local source snapshot입니다.
         */
        syncSnapshot?: TerrainSourceSyncSnapshot;
        /**
         * source가 직접 소유한 image binding을 찾기 위한 레이어입니다.
         */
        ownerLayer?: U3dLayer;
        /**
         * 레이어가 요청한 원래 image layer 순서입니다.
         */
        requestedTargetRenderOrder?: number;
        /**
         * source를 적용할 image layer 순서 상한입니다.
         */
        targetRenderOrder?: number;
        /**
         * source가 속한 terrain composition group key입니다.
         */
        compositionGroupKey?: string;
        /**
         * Layer 공개 renderOrder에서 파생한 group 사이 합성 순서입니다.
         */
        compositionRenderOrder?: number;
        /**
         * Layer group의 최초 등록 순번입니다.
         */
        compositionGroupOrder?: number;
        /**
         * source payload 보존 여부와 독립적인 worker 합성 참여 상태입니다.
         */
        visible?: boolean;
    };

/**
     * 한 레이어가 parent fallback 해제를 기다리는 범위입니다.
     */
    type TerrainVisibilityHandoff = {
        /**
         * 레이어 고유 이름입니다.
         */
        ownerKey: string;
        /**
         * 표시 준비 상태를 확인할 레이어입니다.
         */
        ownerLayer?: U3dLayer;
        /**
         * 해당 레이어가 소유한 source key입니다.
         */
        sourceKeys: Array<string>;
    };

/**
     * terrain tile 상태입니다.
     */
    type TerrainTileEntry = {
        /**
         * tile key입니다.
         */
        tileKey?: string;
        /**
         * 같은 tile key의 재생성 세대입니다.
         */
        generation?: number;
        /**
         * 요청 버전입니다.
         */
        revision?: number;
        /**
         * 활성 버전입니다.
         */
        activeRevision?: number;
        /**
         * 적용 버전입니다.
         */
        appliedRevision?: number;
        /**
         * CPU/Worker build가 완료된 최신 버전입니다.
         */
        builtRevision?: number;
        /**
         * owner 유실 복구를 예약한 버전입니다.
         */
        recoveryRevision?: number;
        /**
         * false-complete를 계측한 버전입니다.
         */
        falseCompleteRevision?: number;
        /**
         * 실제 처리 오류로 종료된 버전입니다.
         */
        failedRevision?: number;
        /**
         * 마지막 처리 실패 사유입니다.
         */
        lastFailureReason?: string;
        /**
         * feature 구성 서명입니다.
         */
        featureSignature?: string;
        /**
         * 적용된 feature 서명입니다.
         */
        appliedSignature?: string;
        /**
         * 재생성 필요 여부입니다.
         */
        dirty?: boolean;
        /**
         * 표시 여부입니다.
         */
        visible?: boolean;
        /**
         * LOD commit이 요구하는 표시 여부입니다.
         */
        desiredVisible?: boolean;
        /**
         * 등록 여부입니다.
         */
        registered?: boolean;
        /**
         * feature 수입니다.
         */
        featureCount: number;
        /**
         * 표시 feature 수입니다.
         */
        renderFeatureCount?: number;
        /**
         * source별 선별 전 feature 수입니다.
         */
        sourceFeatureCounts: Map<string, number>;
        /**
         * source별 실제 표시 feature 수입니다.
         */
        sourceRenderFeatureCounts: Map<string, number>;
        /**
         * source별 LOD profile 상태입니다.
         */
        sourceLodProfiles: Map<string, {
            id: string;
            version: number;
        }>;
        /**
         * 생성 대기 여부입니다.
         */
        pendingBuild?: boolean;
        /**
         * source 대기 여부입니다.
         */
        pendingSourceData?: boolean;
        /**
         * source 대기 key입니다.
         */
        pendingSourceKeys: Set<string>;
        /**
         * source별 최신 요청 상태입니다.
         */
        sourceStates: Map<string, TerrainSourceState>;
        /**
         * decal 준비 여부입니다.
         */
        decalReady?: boolean;
        /**
         * texture 준비 여부입니다.
         */
        textureReady?: boolean;
        /**
         * texture 준비 상태를 계산한 feature 서명입니다.
         */
        textureReadySignature?: string;
        /**
         * texture 준비 상태를 계산한 revision입니다.
         */
        textureReadyRevision?: number;
        /**
         * 해제 요청 여부입니다.
         */
        disposeRequested?: boolean;
        /**
         * 해제 요청 시점의 등록 material입니다(같은 키의 새 등록과 구분하는 기준).
         */
        disposeRequestedMaterial?: TerrainMaterial;
        /**
         * handoff 동안 화면에 남긴 이미지 레이어별 잔여물 메시입니다.
         */
        handoffResidues?: Map<U3dImageLayer, Array<three.Object3D>>;
        /**
         * terrain mesh입니다.
         */
        mesh?: three.Mesh;
        /**
         * terrain material입니다.
         */
        material?: TerrainMaterial;
        /**
         * tile에 연결된 material binding 목록입니다.
         */
        materialBindings?: Map<TerrainMaterial, TerrainMaterialBinding>;
        /**
         * layer 이름입니다.
         */
        layerName?: string;
        /**
         * 지형 메시와 LOD 표시 전환 대기 상태를 보유한 타일입니다.
         */
        tile?: Partial<{
            _mesh: three.Mesh;
            _lodPresentPending: boolean;
        }>;
        /**
         * 해제 대기 layer입니다.
         */
        pendingDisposeLayers: Set<object>;
        /**
         * 활성 버퍼입니다.
         */
        activeBuffer?: TerrainBufferState;
        /**
         * 활성 material입니다.
         */
        activeMaterial?: TerrainMaterial;
        /**
         * 같은 buffer를 사용하는 활성 material 목록입니다.
         */
        activeMaterials?: Set<TerrainMaterial>;
        /**
         * 비활성 버퍼입니다.
         */
        inactiveBuffer?: TerrainBufferState;
        /**
         * 부모 tile key입니다.
         */
        parentTileKey?: string;
        /**
         * 자식 tile key입니다.
         */
        childTileKeys?: Set<string>;
        /**
         * 취소 여부입니다.
         */
        cancelled?: boolean;
        /**
         * 표시 전환 대기 여부입니다.
         */
        pendingVisibilityHandoff?: boolean;
        /**
         * 레이어별 표시 전환 대기 상태입니다.
         */
        visibilityHandoffs: Map<string, TerrainVisibilityHandoff>;
        /**
         * Quadtree 부모 복구 중 제거를 막는 lease입니다.
         */
        handoffLease?: {
            tile: object;
            generation: number;
            direction?: "refine" | "coarsen";
        };
        /**
         * source별 버전입니다.
         */
        sourceRevisions: Map<string, number>;
        /**
         * 화면에 적용된 source별 버전입니다.
         */
        appliedSourceRevisions: Map<string, number>;
        /**
         * 준비된 버전입니다.
         */
        preparedRevision?: number;
        /**
         * 준비된 feature 서명입니다.
         */
        preparedFeatureSignature?: string;
        /**
         * 준비된 tile 기준 좌표입니다.
         */
        preparedTileOrigin?: TerrainPoint;
        /**
         * 준비된 feature 기본 정보입니다.
         */
        preparedFeatureBases?: Array<TerrainFeature>;
        /**
         * 준비된 tile별 feature 참조입니다.
         */
        preparedFeatureRefs?: Array<TerrainFeatureRef>;
        /**
         * 준비된 Feature 합성 계획입니다.
         */
        preparedCompositionPlan?: TerrainDecalCompositionPlan;
        /**
         * 준비된 정적 합성 재사용 cache key입니다. hybrid 계획이 아니면 없습니다.
         */
        preparedStaticCompositeKey?: string;
        /**
         * tile 기준 좌표입니다.
         */
        origin?: TerrainPoint;
        /**
         * material 강제 갱신 여부입니다.
         */
        forceMaterialUpdate?: boolean;
        /**
         * 마지막 변경 유형입니다.
         */
        lastChangeType?: string;
        /**
         * 부모 기준 사분면입니다.
         */
        quadrant?: "northWest" | "northEast" | "southWest" | "southEast";
        /**
         * 적용 중인 LOD profile 식별자입니다.
         */
        lodProfileId?: string;
        /**
         * 적용 중인 LOD profile 버전입니다.
         */
        lodProfileVersion?: number;
        /**
         * tile 위치와 무관한 렌더 동등성 서명입니다.
         */
        renderEquivalenceSignature?: string;
        /**
         * 다음 Worker Payload를 full로 보낼 명시적 사유입니다.
         */
        pendingFullReason?: TerrainPayloadFullReason;
        /**
         * 마지막 Feature 순회 전 Fast Skip 거절 사유입니다.
         */
        lastPayloadFastSkipRejectReason?: string;
        /**
         * 현재 revision이 속한 원자 표시 그룹입니다.
         */
        presentationGroup?: TerrainPresentationGroupMembership;
        /**
         * Presentation 적용 횟수를 집계한 revision입니다.
         */
        presentationCountedRevision?: number;
        /**
         * 같은 revision의 Presentation 적용 횟수입니다.
         */
        presentationSameRevisionApplyCount?: number;
        /**
         * 숨은 자식의 quadtree 재평가를 요청한 generation/revision key입니다.
         */
        lodReevaluationKey?: string;
        /**
         * 부모 texture의 사분면별 렌더 동등성 서명입니다.
         */
        quadrantRenderEquivalenceSignatures?: Partial<Record<"northWest" | "northEast" | "southWest" | "southEast", string>>;
        /**
         * 독립적으로 생성한 decal texture입니다.
         */
        decalTexture?: three.Texture;
        /**
         * decal texture를 상속한 부모 tile key입니다.
         */
        inheritedDecalTextureTileKey?: string;
        /**
         * 자식 tile의 texture 참조 수입니다.
         */
        decalTextureReferenceCount?: number;
        /**
         * 부모 texture sampling UV 변환입니다.
         */
        decalUvTransform?: TerrainDecalUvTransform;
    };

/**
     * terrain manager 메서드의 공통 옵션입니다.
     */
    type TerrainManagerOption = {
        /**
         * manager를 소유한 앱입니다.
         */
        app?: U3dApp;
        /**
         * 프레임 예산·한도 override입니다. 생성자에서만 사용합니다.
         */
        config?: Partial<TerrainDecalConfig>;
        /**
         * layer 이름입니다.
         */
        layerName?: string;
        /**
         * terrain mesh입니다.
         */
        mesh?: three.Mesh;
        /**
         * tile 객체입니다.
         */
        tile?: Partial<{
            _mesh: three.Mesh;
        }>;
        /**
         * 표시 여부입니다.
         */
        visible?: boolean;
        /**
         * 소유 layer입니다.
         */
        ownerLayer?: U3dLayer;
        /**
         * dispose가 보류될 때 화면에 남길 잔여물 메시입니다.
         */
        residue?: three.Object3D;
        /**
         * 부모 tile key입니다.
         */
        parentTileKey?: string;
        /**
         * feature 목록입니다.
         */
        features?: Array<TerrainFeature>;
        /**
         * 표시 상태 강제 정리 여부입니다.
         */
        forcePresentationClear?: boolean;
        /**
         * 요청 사유입니다.
         */
        reason?: string;
        /**
         * source key입니다.
         */
        sourceKey?: string;
        /**
         * 전환 상태와 분리된 권위 source identity입니다.
         */
        sourceIdentity?: TerrainSourceIdentity;
        /**
         * 정규화 중 Base Cache 범위에 결합할 내부 key입니다.
         */
        sourceIdentityKey?: string;
        /**
         * handoff 판정 대상 source key입니다.
         */
        sourceKeys?: Array<string>;
        /**
         * handoff owner 식별자입니다.
         */
        ownerKey?: string;
        /**
         * source 최신 요청 식별자입니다.
         */
        sourceRequestToken?: string;
        /**
         * `pending=false`인 clear/cancel 종료에서 현재 source와 같은 owner가 이전 비동기 응답을 폐기할 때만 요청 식별자를 강제로 교체합니다.
         */
        replaceSourceRequestToken?: boolean;
        /**
         * 요청 종료 상태입니다.
         */
        sourceStatus?: TerrainSourceStatus;
        /**
         * 요청 실패 또는 취소 사유입니다.
         */
        sourceErrorReason?: string;
        /**
         * confirmed-empty source만 clear할지 여부입니다.
         */
        requireConfirmedEmpty?: boolean;
        /**
         * 명시적 폐기/삭제에서 Source 상태와 무관하게 빈 payload를 반영합니다.
         */
        allowUnconfirmedEmpty?: boolean;
        /**
         * LOD 선별 전 source feature 수입니다.
         */
        sourceFeatureCount?: number;
        /**
         * 실제 렌더링할 source feature 수입니다.
         */
        renderFeatureCount?: number;
        /**
         * source에 적용한 LOD profile 식별자입니다.
         */
        lodProfileId?: string;
        /**
         * source에 적용한 LOD profile 버전입니다.
         */
        lodProfileVersion?: number;
        /**
         * 부모 기준 사분면입니다.
         */
        quadrant?: "northWest" | "northEast" | "southWest" | "southEast";
        /**
         * 모든 source 대기 상태 정리 여부입니다.
         */
        clearAllSourcePending?: boolean;
        /**
         * tile key 목록입니다.
         */
        tileKeys?: Array<string> | Set<string>;
        /**
         * source 버전입니다.
         */
        sourceRevision?: number;
        /**
         * 레이어가 요청한 원래 image layer 순서입니다.
         */
        requestedTargetRenderOrder?: number;
        /**
         * source를 적용할 image layer 순서 상한입니다.
         */
        targetRenderOrder?: number;
        /**
         * source가 속한 terrain composition group key입니다.
         */
        compositionGroupKey?: string;
        /**
         * Layer 공개 renderOrder에서 파생한 group 사이 합성 순서입니다.
         */
        compositionRenderOrder?: number;
        /**
         * precomposed 합성을 실행할 offscreen composer입니다.
         */
        terrainCompositeComposer?: TerrainDecalComposer;
        /**
         * Source 등록 경계가 알려 주는 이 source의 Feature 변경 안정성입니다. WFS·PBF처럼 revision이 바뀔 때만 갱신되는 source는 `static`, runtime·Measure처럼 자주 바뀌는 source는 `dynamic`입니다. 값을 주지 않으면 미분류로 남아 기존 판정을 그대로 사용합니다.
         */
        compositionStability?: TerrainDecalCompositionStability;
        /**
         * 변경 유형입니다.
         */
        changeType?: string;
        /**
         * 즉시 반영 여부입니다.
         */
        immediateFlush?: boolean;
        /**
         * Worker 전송 전에 메인 스레드 작업권을 양보할지 여부입니다.
         */
        deferWorkerSchedule?: boolean;
        /**
         * Worker Admission을 통과한 내부 재진입인지 여부입니다.
         */
        workerAdmissionGranted?: boolean;
        /**
         * Worker 단계별 성능 계측 시각입니다.
         */
        workerPhaseTiming?: {
            admissionRequestedAt: number;
            admissionAcceptedAt?: number;
            queueInsertedAt?: number;
            queueDequeuedAt?: number;
            payloadRequestedAt?: number;
            payloadReadyAt?: number;
            workerSlotRequestedAt?: number;
            workerDispatchedAt?: number;
            workerSlotAcquiredAt?: number;
            dispatchCompletedAt?: number;
        };
        /**
         * 반영 지연 여부입니다.
         */
        deferFlush?: boolean;
        /**
         * 같은 transaction의 최종 flush 전까지 ownerless 진행 복구를 미룰지 여부입니다.
         */
        deferProgressEnsure?: boolean;
        /**
         * 같은 transaction에서 이미 생성한 tile dirty revision을 재사용할지 여부입니다.
         */
        reuseDirtyRevision?: boolean;
        /**
         * Quadtree handoff 전환 방향입니다.
         */
        handoffDirection?: "refine" | "coarsen";
        /**
         * 호출자가 소유한 prepared feature를 추가 복사 없이 정규화할지 여부입니다.
         */
        consumePreparedFeatures?: boolean;
        /**
         * 기준 좌표입니다.
         */
        origin?: TerrainPoint;
        /**
         * 재사용 판정 시점에 새로 계산한 현재 tile-local 기준점입니다. GPU 상태·worker 결과 cache 의 기준점과 비교하는 데만 쓰며 빌드 기준점(`origin`)을 대신하지 않습니다.
         */
        currentTileOrigin?: TerrainPoint;
        /**
         * 이번 빌드의 합성 계획이 precomposed 또는 hybrid 인지 여부입니다. 참이면 기준점을 확인할 수 없는 cache 재생을 안전한 적중으로 세지 않습니다.
         */
        compositeBuild?: boolean;
        /**
         * material 강제 갱신 여부입니다.
         */
        forceMaterialUpdate?: boolean;
        /**
         * texture 준비 여부입니다.
         */
        textureReady?: boolean;
        /**
         * image layer 렌더 순서입니다.
         */
        renderOrder?: number;
        /**
         * worker 강제 사용 여부입니다.
         */
        forceWorkerBuild?: boolean;
        /**
         * 즉시 생성 강제 여부입니다.
         */
        forceImmediateBuild?: boolean;
        /**
         * 관련 타일을 한 render-before에서 전환할 측정 표시 단위입니다.
         */
        presentationBatch?: TerrainPresentationBatch;
        /**
         * tile entry 유지 여부입니다.
         */
        preserveEntry?: boolean;
        /**
         * 임계값입니다.
         */
        threshold?: number;
        /**
         * 투명도입니다.
         */
        opacity?: number;
        /**
         * 깊이 보정값입니다.
         */
        depthOffset?: number;
        /**
         * 동적 원형 반경입니다.
         */
        radius?: number;
        /**
         * tile key입니다.
         */
        tileKey?: string;
        /**
         * 원래 tile을 소유하고 있는 레이어에서의 dispose 동작을 실행했을 경우에 manager에서 dispose 호출 반영 여부입니다.
         */
        skipLayerDispose?: boolean;
        /**
         * 갱신하거나 해제할 material binding입니다.
         */
        material?: TerrainMaterial;
        /**
         * handoff를 우회해 즉시 해제할지 여부입니다.
         */
        forceImmediateDispose?: boolean;
        /**
         * 취소 시 parent/child handoff 대상을 함께 제거할지 여부입니다.
         */
        removeTransitionTargets?: boolean;
        /**
         * swap-ready를 기다릴 최대 시간입니다.
         */
        timeoutMs?: number;
        /**
         * 최신 revision 이 아니어도 대상 material 에 presentation 이 적용돼 있으면 swap-ready 로 인정할지 여부입니다. 애니메이션처럼 revision 이 계속 앞서는 tile 의 texture 교체가 영원히 기다리지 않게 하는 image host 용 완화 조건입니다.
         */
        acceptAppliedPresentation?: boolean;
        /**
         * 직전 revision 이 적용됐고 현재 revision 의 build·present 가 진행 중인 한 단계 지연을 swap-ready 로 인정할지 여부입니다. 연속 갱신 tile 은 어느 프레임에서도 최신 revision 이 적용된 상태가 되지 않으므로, 화면에 없는 자식을 붙여야 하는 LOD 훅이 사용하는 완화 조건입니다.
         */
        acceptInFlightRevision?: boolean;
        /**
         * swap-ready 대기를 취소할 신호입니다.
         */
        signal?: AbortSignal;
        /**
         * 요청이 속한 tile 세대입니다.
         */
        generation?: number;
        /**
         * presentation 상태 조회 시 해당 source에 payload가 존재해야 하는지 여부입니다.
         */
        expectsPayload?: boolean;
        /**
         * 우선순위 수치
         */
        priority?: number;
        /**
         * 타일 우선순위 수치
         */
        tilePriority?: number;
        /**
         * 최신 타일 상태의 우선순위 조회 함수입니다.
         */
        resolvePriority?: () => number;
        /**
         * Worker Payload를 full로 보낼 명시적 사유입니다.
         */
        forceFullReason?: TerrainPayloadFullReason;
    };

/**
     * terrain tile에 연결된 mesh와 material의 레이어별 상태입니다.
     */
    type TerrainMaterialBinding = {
        /**
         * terrain material입니다.
         */
        material: TerrainMaterial;
        /**
         * terrain mesh입니다.
         */
        mesh?: three.Mesh;
        /**
         * tile 객체입니다.
         */
        tile?: Partial<{
            _mesh: three.Mesh;
        }>;
        /**
         * 소유 레이어입니다.
         */
        ownerLayer?: U3dLayer;
        /**
         * 레이어 이름입니다.
         */
        layerName?: string;
        /**
         * image layer 렌더 순서입니다.
         */
        renderOrder?: number;
        /**
         * 논리적 가시 상태입니다.
         */
        visible?: boolean;
        /**
         * LOD가 가시 상태를 명시적으로 commit했는지 여부입니다.
         */
        visibilityCommitted?: boolean;
        /**
         * texture 준비 여부입니다.
         */
        textureReady?: boolean;
        /**
         * mesh dispose 보류 여부입니다.
         */
        disposeRequested?: boolean;
    };

/**
     * 한 번의 render-before에서 함께 전환할 표시 요청입니다.
     */
    type TerrainPresentationBatch = {
        /**
         * 표시 요청 소유자 식별자입니다.
         */
        ownerKey: string;
        /**
         * 표시 요청 버전입니다.
         */
        revision?: number;
        /**
         * 한 프레임에 함께 교체할 tile key입니다. 생략하면 flush 대상 전체가 표시 그룹에 들어가고, 지정하면 나머지 tile은 데이터 갱신만 수행합니다.
         */
        tileKeys?: Iterable<string>;
    };

/**
     * tile revision과 원자 표시 그룹의 연결 정보입니다.
     */
    type TerrainPresentationGroupMembership = {
        /**
         * 표시 그룹 식별자입니다.
         */
        id: string;
        /**
         * 표시 그룹 소유자 식별자입니다.
         */
        ownerKey: string;
        /**
         * 소유자 표시 버전입니다.
         */
        ownerRevision: number;
        /**
         * tile 세대입니다.
         */
        generation: number;
        /**
         * tile revision입니다.
         */
        revision: number;
        /**
         * 최신 flush가 직접 지정한 표시 대상이면 `true`, 이전 그룹에서 넘어온 멤버면 `false`입니다.
         */
        explicit?: boolean;
    };

type TerrainAtomicPresentationOutcome = "pending" | "presented" | "superseded" | "target-disposed" | "failed" | "disposed";

/**
     * 여러 terrain tile을 한 번의 render-before에서 전환하는 표시 그룹입니다.
     */
    type TerrainAtomicPresentationGroup = {
        /**
         * 표시 그룹 식별자입니다.
         */
        id: string;
        /**
         * 표시 그룹 소유자 식별자입니다.
         */
        ownerKey: string;
        /**
         * 소유자 표시 버전입니다.
         */
        ownerRevision: number;
        /**
         * 표시 그룹에 포함된 tile key입니다.
         */
        tileKeys: Set<string>;
        /**
         * tile rebuild 요청 완료 Promise입니다.
         */
        completion: Promise<Array<boolean>>;
        /**
         * material 표시 완료 Promise입니다.
         */
        presentationCompletion: Promise<boolean>;
        /**
         * material 표시 완료 처리 함수입니다.
         */
        resolvePresentation: (presented: boolean) => void;
        /**
         * 표시 그룹의 현재 완료 상태입니다.
         */
        presentationOutcome: TerrainAtomicPresentationOutcome;
        /**
         * tile rebuild 요청 완료 여부입니다.
         */
        ready: boolean;
        /**
         * 표시 그룹 material commit 진행 여부입니다.
         */
        committing: boolean;
        /**
         * 준비된 그룹이 마지막으로 커밋되지 못한 사유와 tile입니다.
         */
        lastBlock?: {
            reason: string;
            tileKey?: string;
            at: number;
            count: number;
        };
    };

type TerrainPendingWorkerJob = {
        revision: number;
        generation: number;
        promise: Promise<boolean>;
    } & Partial<{
        cancelled: boolean;
    }>;

type TerrainPresentEntry = Partial<{
        type: "apply" | "clear";
        revision: number;
        generation: number;
        featureSignature: string;
        targetActiveBuffer: TerrainBufferState;
        targetAppliedSignature: string;
        presentationOwnerKey: string;
        presentationOwnerRevision: number;
        presentationGroupId: string;
    }>;

type TerrainGpuCacheEntry = {
        state: TerrainBufferState;
    } & Partial<{
        byteLength: number;
        appliedRevision: number;
        tileKey: string;
    }>;

type TerrainDynamicRadiusEntry = {
        layer: U2dVectorShaderLayer;
        lastUpdateTime: number;
    } & Partial<{
        radius: number;
        lastCameraPosition: three.Vector3;
        lastProjectionScale: number;
        lastDrawingBufferHeight: number;
    }>;

/**
     * 구버전 terrain payload의 도형 항목입니다.
     */
    type TerrainLegacyElement = {
        /**
         * 좌표 목록입니다.
         */
        points?: Array<TerrainPoint | Array<number>>;
        /**
         * 원의 중심입니다.
         */
        center?: TerrainPoint;
        /**
         * 원의 반경입니다.
         */
        radius?: number;
        /**
         * 면 색상입니다.
         */
        fillColor?: TerrainColor;
        /**
         * 선 색상입니다.
         */
        strokeColor?: TerrainColor;
        /**
         * 선 두께입니다.
         */
        strokeWidth?: number;
        /**
         * 투명도입니다.
         */
        opacity?: number;
        /**
         * 표시 여부입니다.
         */
        visible?: boolean;
        /**
         * 강조 여부입니다.
         */
        highlight?: boolean;
        /**
         * 표시 순서입니다.
         */
        renderOrder?: number;
        /**
         * 구멍 여부입니다.
         */
        isHole?: boolean;
    };

/**
     * 구버전 terrain payload입니다.
     */
    type TerrainLegacyPayload = {
        /**
         * 선분 목록입니다.
         */
        lineSegments?: Array<TerrainLegacyElement>;
        /**
         * 복합 선 목록입니다.
         */
        multiLines?: Array<TerrainLegacyElement>;
        /**
         * 면 목록입니다.
         */
        polygons?: Array<TerrainLegacyElement>;
        /**
         * 복합 면 목록입니다.
         */
        multiPolygons?: Array<TerrainLegacyElement>;
        /**
         * 원 목록입니다.
         */
        circles?: Array<TerrainLegacyElement>;
        /**
         * 임계값입니다.
         */
        threshold?: number;
        /**
         * 투명도입니다.
         */
        opacity?: number;
    };

type TerrainCacheValue = TerrainWorkerResult | TerrainGpuCacheEntry;

/**
     * binding별 terrain 표시 준비 완료를 기다리는 항목입니다.
     */
    type TerrainSwapWaiter = {
        /**
         * 준비 또는 취소 결과를 전달할 함수입니다.
         */
        resolve: (value: boolean) => void;
        /**
         * 대기 대상 material binding 범위입니다.
         */
        opt?: TerrainManagerOption;
        /**
         * 제한 시간 timer입니다.
         */
        timeoutId?: ReturnType<typeof setTimeout>;
        /**
         * 취소 신호 처리 함수입니다.
         */
        abortHandler: () => void;
    };

/**
     * worker의 불변 feature base에 tile별 조건을 결합하는 참조입니다.
     */
    type TerrainFeatureRef = {
        /**
         * worker의 불변 feature base key입니다.
         */
        featureCacheKey: string;
        /**
         * tile별 정규화 결과 cache key입니다.
         */
        featureEntryCacheKey: string;
        /**
         * source 범위가 포함된 feature key입니다.
         */
        scopedFeatureKey?: string;
        /**
         * tile clipping 범위입니다.
         */
        clipBounds?: Array<number>;
        /**
         * path 단순화 허용 거리입니다.
         */
        pathSimplifyTolerance?: number;
        /**
         * feature를 적용할 shader layer 순서입니다.
         */
        shaderLayerRenderOrder?: number;
        /**
         * 합성 계획이 부여한 batch 순번입니다.
         */
        compositionBatchIndex?: number;
    };

/**
     * tile buffer 생성에 필요한 준비 데이터입니다.
     */
    type TerrainPreparedBuild = {
        /**
         * feature 구성 서명입니다.
         */
        featureSignature: string;
        /**
         * tile 기준 좌표입니다.
         */
        tileOrigin: TerrainPoint;
        /**
         * feature 기본 정보입니다.
         */
        featureBases: Array<TerrainFeature>;
        /**
         * tile별 feature 참조입니다.
         */
        featureRefs: Array<TerrainFeatureRef>;
        /**
         * Feature 총순서와 batch를 담은 합성 계획입니다.
         */
        compositionPlan?: TerrainDecalCompositionPlan;
        /**
         * 정적 합성 결과 재사용 판정에 쓸 cache key입니다. hybrid 계획이 아니면 없습니다.
         */
        staticCompositeKey?: string;
        /**
         * immediate build에서 재사용할 feature 기본 정보입니다.
         */
        immediateFeatureBases?: Array<TerrainFeature>;
    };

export type { TerrainAtomicPresentationGroup, TerrainAtomicPresentationOutcome, TerrainBounds, TerrainBucketIndexState, TerrainBucketState, TerrainBufferState, TerrainCacheValue, TerrainColor, TerrainColorChannels, TerrainCompositeInput, TerrainCompositeJobHandle, TerrainCompositeStepResult, TerrainCompositeVariant, TerrainDecalComposer, TerrainDecalLodBand, TerrainDecalLodProfile, TerrainDecalLodSelection, TerrainDecalUvTransform, TerrainDynamicRadiusEntry, TerrainFeature, TerrainFeatureRef, TerrainFlattenedPathState, TerrainGpuCacheEntry, TerrainLegacyElement, TerrainLegacyPayload, TerrainLodFilter, TerrainLodQuery, TerrainLodQueryContext, TerrainLodQueryResult, TerrainManagerOption, TerrainMaterial, TerrainMaterialBinding, TerrainMaterialContent, TerrainPathSegment, TerrainPayloadFullReason, TerrainPendingWorkerJob, TerrainPoint, TerrainPreparedAreaEntry, TerrainPreparedBuild, TerrainPreparedCircleEntry, TerrainPreparedEntry, TerrainPreparedEntryBase, TerrainPreparedLocalEntry, TerrainPreparedPathEntry, TerrainPreparedStyle, TerrainPreparedStyleEntry, TerrainPresentEntry, TerrainPresentationBatch, TerrainPresentationGroupMembership, TerrainSourceIdentity, TerrainSourceState, TerrainSourceStatus, TerrainSourceSyncSnapshot, TerrainStyle, TerrainSwapWaiter, TerrainTileEntry, TerrainVisibilityHandoff, TerrainWorkerResult };
