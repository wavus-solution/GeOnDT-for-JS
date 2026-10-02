// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UDrawArg } from "../UDrawArg.js";
import type { ColorLike } from "../../types/global.js";

/**
     * `UTDSLoader` 생성 옵션입니다. 3DS 파일을 어떤 좌표 해석·재질·텍스처 정책으로 읽을지 정합니다.
     * 모든 속성이 선택이지만 옵션 객체 자체는 반드시 전달해야 합니다(내부에서 `opt.drawarg`를 바로 읽습니다).
     */
    type UTDSLoaderCO = {
        /**
         * 좌표 해석 방식 표식. 현재 구현은 값을 보관만 하며 파싱 동작을 바꾸지 않습니다.
         */
        loadtype?: string;
        /**
         * `true`면 재질이 참조하는 텍스처 이미지를 파싱 후 비동기로 내려받아 재질에 연결합니다. `false`면 이미지 없이 색상만 적용합니다.
         */
        needtexture?: boolean;
        /**
         * 결과 mesh를 그릴 렌더 컨텍스트. 로더는 `drawArg` 프로퍼티에 보관만 합니다.
         */
        drawarg?: UDrawArg;
        /**
         * 재질의 렌더 면. 3DS 재질 청크마다 복제되는 기본 재질에 적용되며, 파일에 양면 플래그(`MAT_TWO_SIDE`)가 있으면 `DoubleSide`로 덮어씁니다.
         */
        side?: three.Side;
        /**
         * 지정하면 파일의 재질 색상을 무시하고 모든 재질을 이 색으로 통일합니다.
         */
        color?: ColorLike;
        /**
         * `true`면 외부 XML 메타데이터로 위치를 배치할 것으로 보고 원점 중앙화(월드 좌표 지오메트리를 원점으로 옮기는 처리)를 생략합니다. `false`면 좌표 절댓값이 10000을 넘는 지오메트리를 원점 기준으로 옮깁니다.
         */
        needXml?: boolean;
    };

/**
     * 3DS 파일의 청크 하나를 가리키는 읽기 커서입니다. 3DS 파일은 `id(2바이트) + size(4바이트)` 헤더와 본문으로 이루어진 청크가 중첩된 트리 구조이며,
     * 이 객체는 파일(ArrayBuffer) 안에서 한 청크의 바이트 위치를 나타냅니다. 모든 위치는 파일 시작 기준 바이트 오프셋입니다.
     */
    type UTDSChunk = {
        /**
         * 청크 종류 코드(예: `0x4160` MESH_MATRIX, `0xB020` POS_TRACK_TAG)
         */
        id: number;
        /**
         * 헤더 6바이트를 포함한 청크 전체 길이(바이트)
         */
        size: number;
        /**
         * 아직 읽지 않은 하위 청크의 시작 위치. 헤더 직후에서 시작하며 하위 청크를 읽을 때마다 전진합니다
         */
        cur: number;
        /**
         * 청크가 끝나는 위치(다음 형제 청크의 시작)
         */
        end: number;
    };

/**
     * keyframe 트랙(POS/ROT/SCL_TRACK_TAG)의 키 하나입니다. 3DS 원좌표(Z-up, 축 교환 없음)를 그대로 담습니다.
     */
    type UTDSTrackKey = {
        /**
         * 키가 놓인 애니메이션 프레임 번호(0부터)
         */
        frame: number;
        /**
         * 어떤 스플라인 보간 값이 함께 기록됐는지 나타내는 비트 플래그(0x01 tension, 0x02 continuity, 0x04 bias, 0x08 easeTo, 0x10 easeFrom)
         */
        splineFlags: number;
        /**
         * `splineFlags`에 켜진 항목만 담긴 보간 값
         */
        spline: Partial<{
            tension: number;
            continuity: number;
            bias: number;
            easeTo: number;
            easeFrom: number;
        }>;
        /**
         * 키 값. 위치·스케일 트랙은 `[x, y, z]`, 회전 트랙은 `[각도(라디안), 축x, 축y, 축z]` 순서입니다
         */
        values: Array<number>;
    };

/**
     * keyframe 트랙 전체입니다. 키 배열에 트랙 헤더 정보가 프로퍼티로 함께 붙어 있습니다.
     * `JSON.stringify`로 직렬화하면 배열 요소만 남고 `trackFlags`·`unknown`은 사라집니다.
     */
    type UTDSTrack = Array<UTDSTrackKey> & Partial<{
        trackFlags: number;
        unknown: Array<number>;
    }>;

/**
     * keyframe 노드(OBJECT_NODE_TAG) 하나를 직렬화한 정보입니다. `UTDSLoader#serializeNode`가 만들며
     * 결과 그룹의 `userData.tdsNodes`와 각 mesh의 `userData.tds.node`에 담깁니다.
     * 위치·회전·스케일은 첫 키(프레임 0)의 값이며, 해당 트랙이 없으면 `-9999`가 들어갑니다.
     */
    type UTDSNodeInfo = {
        /**
         * 노드 ID(NODE_ID). 없으면 `-9999`
         */
        id: number;
        /**
         * 부모 노드 ID(NODE_HDR의 hierarchy 값). 최상위 노드는 `-1`, 헤더가 없으면 `-9999`
         */
        parentId: number;
        /**
         * 노드가 가리키는 mesh 객체 이름(NAMED_OBJECT 이름과 일치)
         */
        objectName: string;
        /**
         * 인스턴스 이름(INSTANCE_NAME). 없으면 빈 문자열
         */
        instanceName: string;
        /**
         * 회전·스케일의 기준점 `[x, y, z]`. 객체 로컬 좌표이며 지오메트리는 이 점이 원점이 되도록 이동된 뒤 transform이 적용됩니다
         */
        pivot: Array<number>;
        /**
         * 프레임 0의 위치 `[x, y, z]`(3DS 원좌표)
         */
        position: Array<number>;
        /**
         * 프레임 0의 회전. `angle`은 라디안, `axis`는 회전축 `[x, y, z]`(길이 0이면 회전 없음)
         */
        rotation: {
            angle: number;
            axis: Array<number>;
        };
        /**
         * 프레임 0의 축별 배율 `[x, y, z]`
         */
        scale: Array<number>;
        /**
         * 위치 트랙 전체
         */
        positionTrack: UTDSTrack;
        /**
         * 회전 트랙 전체
         */
        rotationTrack: UTDSTrack;
        /**
         * 스케일 트랙 전체
         */
        scaleTrack: UTDSTrack;
    };

/**
     * 하나의 재질 그룹(MSH_MAT_GROUP)이 담당하는 면 목록입니다. `UTDSLoader#readMaterialGroup`이 반환합니다.
     */
    type UTDSMaterialGroup = {
        /**
         * 재질 이름. `UTDSLoader#materials`의 키와 같습니다
         */
        name: string;
        /**
         * 이 재질로 그릴 면들의 정점 인덱스. 면 하나당 3개씩 이어져 있으며 `BufferGeometry.setIndex`에 그대로 넣을 수 있습니다
         */
        index: Array<number>;
    };

export type { UTDSChunk, UTDSLoaderCO, UTDSMaterialGroup, UTDSNodeInfo, UTDSTrack, UTDSTrackKey };
