// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dComponentPosition } from "../3dLayer/U3dComponentPosition.js";
import type { U3dObject } from "../core/U3dObject.js";
import type { UEventDispatcherCO } from "../core/UEventDispatcher.js";
import type { UGroup } from "../core/UGroup.js";
import type { U3DTilesMesh } from "../core/mesh/U3DTilesMesh.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { U3dSelectionBox } from "./U3dSelectionBox.js";
import type { KeyValue, WorldPosition } from "../types/global.types.js";

/**
     * SelectPointerEvent 추가 멤버
     */
    type SelectPointerEventExt = {
        origin?: MouseEvent;
    };

/**
     * 선택 클릭 처리에 전달되는 포인터 이벤트입니다. <br>
     * 정규화 장치 좌표(`NormalizedPosition`)에 원본 `MouseEvent`(`origin`)를 덧붙인 형태입니다. <br>
     * `origin.shiftKey`가 눌려 있으면 기존 선택을 유지한 채 추가 선택합니다.
     */
    type SelectPointerEvent = NormalizedPosition & SelectPointerEventExt;

/**
     * `U3dSelect`가 선택 대상으로 다루는 3D 객체의 합집합 타입입니다. <br>
     * `addSelected`/`removeSelected`/`setColor` 등의 입력과 `getSelected()`의 반환 원소가 이 타입입니다. <br>
     * 일반 three.js `Mesh`, GeOnDT 메시(`UMesh`), 그룹(`UGroup`), 컴포넌트 배치 객체, 3D Tiles 메시가 포함됩니다. <br>
     * `USharedMesh`(공유 메시)는 선택 대상에서 제외됩니다.
     */
    type USelect = (three.Mesh | UMesh | UGroup | three.BufferGeometry | U3dComponentPosition | U3DTilesMesh);

/**
     * 레이캐스트(picking) 교차 결과를 나타내는 최소 형태입니다. <br>
     * three.js `Intersection`과 호환되며 `addSelected`·`setColor`의 `intersect` 인자로 전달되어, 병합 메시의 어느 면(`faceIndex`)이나 인스턴스(`instanceId`)를 강조할지 결정하는 데 쓰입니다. <br>
     * 모든 속성이 선택이며 없는 정보는 생략합니다.
     */
    type U3dIntersectLike = {
        /**
         * 교차한 대상 객체
         */
        object?: U3dObject;
        /**
         * 교차한 삼각형 면의 인덱스. 병합 메시에서 부분 강조 범위를 찾는 데 사용
         */
        faceIndex?: number;
        /**
         * 교차 지점의 월드 좌표(EPSG:3857)
         */
        point?: WorldPosition;
        /**
         * 카메라(레이 원점)에서 교차 지점까지의 월드 좌표(EPSG:3857) 거리
         */
        distance?: number;
        /**
         * 영역 선택에서 교차 판정에 사용된 지오메트리
         */
        geom?: three.BufferGeometry;
        /**
         * 인스턴스 메시에서 교차한 인스턴스의 인덱스
         */
        instanceId?: number;
    };

/**
     * BOX 선택 모드의 상태 묶음입니다. <br>
     * `U3dSelect.selectBoxEvent` 필드의 형태로, 드래그 사각형을 그리는 선택 박스 객체와 앱에 등록한 마우스 리스너 식별자를 보관해 모드 종료 시 해제할 수 있게 합니다. <br>
     * BOX 모드가 아니면 모두 undefined입니다.
     */
    type SelectBoxEvent = {
        /**
         * 화면에 사각형을 그리고 그 안의 객체를 찾는 선택 박스. BOX 모드 진입 시 생성
         */
        selectBox?: U3dSelectionBox;
        /**
         * 앱 `mousedown` 리스너 식별자(`uuid + '_pointerDown'`)
         */
        pointerDownId?: string;
        /**
         * 앱 `mousemove` 리스너 식별자. 드래그 중에만 등록됨
         */
        pointerMoveId?: string;
        /**
         * 앱 `mouseup` 리스너 식별자
         */
        pointerUpId?: string;
    };

/**
     * 영역 선택 도형(AREA/LINE/CIRCLE 모드에서 그려지는 측정 도형)의 외곽선 스타일입니다. <br>
     * `SelectorColorOption.stroke`에 사용합니다.
     */
    type SelectorStroke = {
        /**
         * 외곽선 색상. CSS 색상 문자열(예: `'#ff0000'`, `'rgba(255,0,0,0.8)'`). 생략하면 측정 레이어 기본 색
         */
        color?: string;
        /**
         * 외곽선 두께(화면 픽셀). 생략하면 측정 레이어 기본 두께
         */
        width?: number;
    };

/**
     * 영역 선택 도형의 채움 스타일입니다. <br>
     * `SelectorColorOption.fill`에 사용합니다.
     */
    type SelectorFill = {
        /**
         * 채움 색상. CSS 색상 문자열. 생략하면 측정 레이어 기본 색
         */
        color?: string;
    };

/**
     * `setSelectorColor()`에 넘기는 영역 선택 도형 스타일입니다. <br>
     * 생략한 항목은 측정 레이어의 기본 스타일을 유지합니다.
     */
    type SelectorColorOption = {
        /**
         * 외곽선 색·두께
         */
        stroke?: SelectorStroke;
        /**
         * 채움 색
         */
        fill?: SelectorFill;
    };

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     *
     * `U3dSelect` 생성자 옵션입니다. <br>
     * 모든 항목이 선택이며, 생성 후 `setApp()`으로 앱을 연결해야 동작합니다.
     */
    type U3dSelectCO_Content = {
        /**
         * 선택 모드  <br>
         * - point : 단일 객체 선택 <br>
         * - area : 영역을 그려서 영역에 교차되는 객체 선택 <br>
         * - circle : 원을 그려서 반경에 교차되는 객체 선택 <br>
         * - line : 선을 그려서 선과 교차되는 객체 선택 <br>
         * - box : 화면에서 드래그한 사각형 안에 들어오는 객체 선택
         */
        mode?: string;
        /**
         * 선택 객체를 색상으로 강조할 때 재질에 적용할 스타일 <br>
         * 기본값은 `{color: 0x7f0000, side: THREE.FrontSide, metalness: 0, roughness: 1, transparent: false}`이며 같은 키를 덮어씁니다.
         */
        style?: KeyValue;
        /**
         * true면 강조 표시 중 모델의 텍스처를 감춥니다.
         */
        exceptTexture?: boolean;
        /**
         * 선택 검색 대상 레이어 이름 <br>
         * 문자열 하나 또는 배열로 지정하며, 생략하면 모든 모델 레이어를 검색합니다.
         */
        targetLayer?: string | Array<string>;
        /**
         * 선택 시 하이라이트 타입 설정 <br>
         * - color : 선택 객체 색상을 변경해서 하이라이트 <br>
         * - outline : 선택 객체의 외곽선을 생성해서 하이라이트
         */
        selectType?: string;
        /**
         * selectType 별 옵션 설정 {mode, renderOrder 와 같은 옵션값 설정}
         */
        selectTypeOption?: KeyValue;
        /**
         * 'outline' 선택 시 외곽선 애니메이션 설정 여부 <br>
         * true면 애니메이션 효과를 적용합니다.
         */
        selectedPulse?: boolean;
        /**
         * 선택 시 지표면과 맞닿는 수직선 객체 생성 여부 <br>
         * true면 수직선 객체를 생성합니다.
         */
        setVerticalObject?: boolean;
        /**
         * true면 선택된 객체를 내부 선택 목록에 넣고 하이라이트까지 자동 적용합니다. <br>
         * false면 하이라이트 없이 이벤트 `data`로 선택 객체만 전달하므로 호출자가 직접 처리합니다.
         */
        auto?: boolean;
    };

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     *
     * `U3dSelect` 생성자 옵션입니다. <br>
     * 모든 항목이 선택이며, 생성 후 `setApp()`으로 앱을 연결해야 동작합니다.
     */
    type U3dSelectCO = Omit<Omit<UEventDispatcherCO, never> & U3dSelectCO_Content, never>;

/**
     * 정규화 장치 좌표(NDC)로 나타낸 화면 위치입니다. <br>
     * 화면 왼쪽 아래가 (-1, -1), 오른쪽 위가 (1, 1)이며 픽셀이 아닙니다. <br>
     * 포인터 이벤트와 BOX 선택의 시작·끝점이 이 형태로 전달됩니다.
     */
    type NormalizedPosition = {
        /**
         * 가로 위치(-1 ~ 1). 계산 전이면 undefined
         */
        normalizedX: number | undefined;
        /**
         * 세로 위치(-1 ~ 1, 위가 +). 계산 전이면 undefined
         */
        normalizedY: number | undefined;
    };

export type { NormalizedPosition, SelectBoxEvent, SelectPointerEvent, SelectPointerEventExt, SelectorColorOption, SelectorFill, SelectorStroke, U3dIntersectLike, U3dSelectCO, U3dSelectCO_Content, USelect };
