// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { EventCallBack } from "../types/global.js";
import type { IterableWeakMap } from "../util/IterableWeakMap.js";

/**
 * 화면에 그리는 데 사용 중인 텍스처(texture)와 지오메트리(geometry), 머티리얼(material), 그리고 등록된 이벤트 리스너(listener)를 한곳에 모아 두는 관리자입니다.<br>
 * 모아 둔 자원으로 종류별 개수와 GPU 메모리 사용량을 확인하고 필요한 시점에 한 번에 해제할 수 있습니다.
 *
 * 자원 목록은 호출자가 채우지 않아도 엔진이 자동으로 채웁니다.<br>
 * 렌더러가 어떤 자원을 처음 GPU에 올릴 때 그 자원에 dispose 이벤트 수신기를 달고, 그 순간 자원이 목록에 들어옵니다.<br>
 * 자원을 dispose해서 렌더러가 수신기를 뗄 때 목록에서 빠집니다.<br>
 * 따라서 개수 조회 결과는 한 번이라도 그려진 뒤 아직 해제하지 않은 자원의 수이며, 만들기만 하고 아직 그리지 않은 자원은 세지 않습니다.
 */
declare class UResourceManager {
    _classtype: string;
    _useManage: boolean;
    _useEventManage: boolean;
    _listenEvent: {};
    _textureResource: Set<any>;
    _geometryResource: Set<any>;
    _materialResource: Set<any>;
    _objectResource: any[][];
    _objectResourceWriteCursor: number;
    _resourceSize: string;
    /**
     * 가장 최근의 estimateGPUMemory 호출이 계산해 둔 GPU 메모리 사용량을 문자열로 반환합니다.<br>
     * 이 메서드는 계산을 다시 하지 않으므로 값을 갱신하려면 estimateGPUMemory를 먼저 호출하십시오.<br>
     * 계산에 바로 쓸 숫자 값이 필요하면 estimateGPUMemory의 반환값을 사용하십시오.
     *
     * @returns {string} 단위 표기 없이 숫자만 담은 메가바이트 값이며, 계산한 적이 있으면 `12.34`처럼 소수점 둘째 자리까지, 한 번도 계산하지 않았으면 `0`입니다.
     */
    getResourceSize(): string;
    /**
     * addEvent로 모아 둔 이벤트 리스너(listener) 보관소를 그대로 반환합니다.<br>
     * 보관소는 리스너를 약한 참조로 담기 때문에 다른 곳에서 참조가 사라진 리스너는 자동으로 빠집니다.<br>
     * 내부 보관소를 그대로 돌려주므로 반환값을 직접 고치면 집계 대상도 함께 바뀝니다.<br>
     * 수집이 꺼진 환경에서는 순회할 항목이 없는 일반 객체가 돌아오므로 항목을 읽기 전에 getListenEventCount로 0인지 확인하십시오.
     *
     * @returns {import('@union3d/util/IterableWeakMap').IterableWeakMap|Record<string, never>} 리스너를 키로, 등록된 이벤트 타입 이름을 값으로 담은 보관소이며 수집이 꺼진 환경에서는 비어 있는 일반 객체입니다.
     */
    getListenEvent(): IterableWeakMap | Record<string, never>;
    /**
     * 현재 보관소에 남아 있는 이벤트 리스너(listener)의 개수를 반환합니다.<br>
     * 다른 곳에서 참조가 사라져 회수된 리스너는 개수에서 제외됩니다.
     *
     * @returns {number} 살아 있는 리스너 개수이며 수집이 꺼진 환경에서는 항상 0입니다.
     */
    getListenEventCount(): number;
    /**
     * add로 모아 둔 텍스처(texture) 집합을 그대로 반환합니다.<br>
     * 내부 집합을 그대로 돌려주므로 반환값을 직접 고치면 관리 대상도 함께 바뀝니다.
     *
     * @returns {Set<import('three').Texture>} 관리 중인 텍스처 집합입니다.
     */
    getTextures(): Set<three.Texture>;
    /**
     * 목록에 들어와 있는 텍스처(texture)의 개수를 반환합니다.<br>
     * 만들기만 하고 아직 그리지 않은 텍스처와 이미 해제한 텍스처는 세지 않습니다.
     *
     * @returns {number} 한 번이라도 그려진 뒤 아직 해제하지 않은 텍스처의 개수입니다.
     */
    getTextureCount(): number;
    /**
     * add로 모아 둔 지오메트리(geometry) 집합을 그대로 반환합니다.<br>
     * 내부 집합을 그대로 돌려주므로 반환값을 직접 고치면 관리 대상도 함께 바뀝니다.
     *
     * @returns {Set<import('three').BufferGeometry>} 관리 중인 지오메트리 집합입니다.
     */
    getGeometries(): Set<three.BufferGeometry>;
    /**
     * 목록에 들어와 있는 지오메트리(geometry)의 개수를 반환합니다.<br>
     * 만들기만 하고 아직 그리지 않은 지오메트리와 이미 해제한 지오메트리는 세지 않습니다.
     *
     * @returns {number} 한 번이라도 그려진 뒤 아직 해제하지 않은 지오메트리의 개수입니다.
     */
    getGeometryCount(): number;
    /**
     * add로 모아 둔 머티리얼(material) 집합을 그대로 반환합니다.<br>
     * 내부 집합을 그대로 돌려주므로 반환값을 직접 고치면 관리 대상도 함께 바뀝니다.
     *
     * @returns {Set<import('three').Material>} 관리 중인 머티리얼 집합입니다.
     */
    getMaterials(): Set<three.Material>;
    /**
     * 목록에 들어와 있는 머티리얼(material)의 개수를 반환합니다.<br>
     * 만들기만 하고 아직 그리지 않은 머티리얼과 이미 해제한 머티리얼은 세지 않습니다.
     *
     * @returns {number} 한 번이라도 그려진 뒤 아직 해제하지 않은 머티리얼의 개수입니다.
     */
    getMaterialCount(): number;
    /**
     * 이벤트 리스너(listener)를 보관소에 약한 참조로 모아 getListenEventCount로 개수를 확인할 수 있게 합니다.<br>
     * 개수를 세기 위해 기록만 할 뿐 실제 이벤트 등록은 하지 않으므로, 이벤트 등록은 호출자가 따로 처리해야 합니다.<br>
     * 이미 모아 둔 리스너를 다시 전달하면 처음 등록한 이벤트 타입 이름이 그대로 남습니다.<br>
     * 리스너 수집이 꺼진 환경에서는 호출해도 아무것도 기록하지 않습니다.
     *
     * @param {EventCallBack} target 보관소에 모아 둘 이벤트 콜백 함수입니다.
     * @param {string} value 해당 콜백 함수가 등록된 이벤트 타입 이름입니다.
     */
    addEvent(target: EventCallBack, value: string): void;
    /**
     * 렌더 오브젝트 기록용 이중 버퍼(buffer)를 교체하고 새로 기록할 쪽을 비웁니다.<br>
     * 호출한 뒤의 addObjectResource는 비워진 쪽에 기록하고, getRenderObjects는 교체 직전까지 채워 둔 쪽을 반환합니다.<br>
     * 프레임(frame)을 마칠 때마다 엔진이 한 번씩 호출하므로 보통은 직접 부를 일이 없습니다.
     */
    readyToWriteObjectResource(): void;
    /**
     * 그려진 오브젝트를 현재 기록 중인 버퍼(buffer)에 추가하고 환산 수량을 함께 누적합니다.<br>
     * 오브젝트가 그려진 직후 스스로 호출하므로 보통은 밖에서 직접 부를 일이 없습니다.<br>
     * 여기에 기록한 내용은 다음 readyToWriteObjectResource 호출로 버퍼가 교체된 뒤부터 getRenderObjects로 조회할 수 있습니다.
     *
     * @param {import('three').Object3D} object 기록할 오브젝트입니다.
     * @param {number} [amount=1] getRenderObjectAmount에 더할 환산 수량이며 오브젝트 하나가 여러 개 몫을 차지할 때 1보다 큰 값을 전달합니다.
     */
    addObjectResource(object: three.Object3D, amount?: number): void;
    /**
     * 기록이 마감된 쪽 버퍼(buffer)에 담긴 렌더 오브젝트 배열을 반환합니다.<br>
     * 지금 기록 중인 쪽이 아니라 직전 readyToWriteObjectResource 호출로 교체되면서 기록이 끝난 쪽을 돌려줍니다.<br>
     * 내부 배열을 그대로 돌려주므로 반환값을 직접 고치면 이후 조회 결과도 함께 바뀝니다.<br>
     * 두 버퍼는 번갈아 다시 채워지므로 받아 둔 배열은 다음다음 교체 시점에 내용이 덮어써집니다.
     *
     * @returns {Array<import('three').Object3D> & {resourceAmount: number}} 기록이 마감된 오브젝트 배열이며 resourceAmount 프로퍼티에 누적된 환산 수량이 들어 있습니다.
     */
    getRenderObjects(): Array<three.Object3D> & {
        resourceAmount: number;
    };
    /**
     * 기록이 마감된 쪽 버퍼(buffer)에 addObjectResource로 추가된 오브젝트의 개수를 반환합니다.<br>
     * 전달한 환산 수량과 무관하게 추가한 횟수만큼만 셉니다.<br>
     * 스스로 addObjectResource를 호출하는 오브젝트만 기록되고 인스턴스 메시(instanced mesh)는 빠지므로, 그 프레임(frame)에 그려진 전체 개수는 아닙니다.
     *
     * @returns {number} 기록이 마감된 오브젝트 개수입니다.
     */
    getRenderObjectCount(): number;
    /**
     * 기록이 마감된 쪽 버퍼(buffer)에 누적된 환산 수량의 합계를 반환합니다.<br>
     * addObjectResource에 전달한 amount를 모두 더한 값이므로 오브젝트 개수보다 클 수 있습니다.<br>
     * 스스로 addObjectResource를 호출하는 오브젝트만 더해지고 인스턴스 메시(instanced mesh)는 빠지므로, 그 프레임(frame)에 그려진 전체 수량은 아닙니다.
     *
     * @returns {number} 기록이 마감된 오브젝트의 누적 환산 수량입니다.
     */
    getRenderObjectAmount(): number;
    /**
     * 전달한 자원을 텍스처(texture)와 지오메트리(geometry), 머티리얼(material) 가운데 해당하는 종류의 관리 집합에 담습니다.<br>
     * 렌더러가 자원을 처음 그릴 때 엔진이 대신 호출하므로 보통은 직접 부를 일이 없습니다.<br>
     * 담아 둔 자원은 개수 조회의 대상이 되고 clear 계열 메서드를 호출할 때 함께 해제됩니다.<br>
     * 세 종류 중 어디에도 해당하지 않거나 uuid가 없는 값은 담지 않습니다.<br>
     * 이미 dispose된 텍스처를 전달하면 안내 로그를 남긴 뒤 그대로 담습니다.
     *
     * @param {import('three').Texture|import('three').BufferGeometry|import('three').Material} target 관리 집합에 담을 자원입니다.
     */
    add(target: three.Texture | three.BufferGeometry | three.Material): void;
    /**
     * addEvent로 모아 둔 이벤트 리스너(listener)를 보관소에서 제거해 getListenEventCount의 결과에서 빼냅니다.<br>
     * 갯수 집계에서만 빼낼 뿐 실제 이벤트 해제는 하지 않으므로, 이벤트 해제는 호출자가 따로 처리해야 합니다.<br>
     * addEvent에 전달했던 것과 같은 함수를 넘겨야 하며 이름만 같은 다른 함수를 넘기면 보관소는 그대로 유지됩니다.<br>
     * 리스너 수집이 꺼진 환경에서는 호출해도 아무것도 바뀌지 않습니다.
     *
     * @param {EventCallBack} target 보관소에서 제거할 이벤트 콜백 함수입니다.
     */
    removeEvent(target: EventCallBack): void;
    /**
     * add로 담아 둔 자원을 관리 집합에서 빼내 개수 조회와 일괄 해제의 대상에서 제외합니다.<br>
     * 자원을 dispose하면 엔진이 대신 호출하므로 보통은 직접 부를 일이 없습니다.<br>
     * 이 메서드 자체는 자원을 dispose하지 않으므로 목록에서만 빼고 싶을 때 호출하여 사용합니다.<br>
     * 담긴 적이 없거나 uuid가 없는 값을 전달하면 아무 변화도 일어나지 않습니다.
     *
     * @param {import('three').Texture|import('three').BufferGeometry|import('three').Material} target 관리 집합에서 빼낼 자원입니다.
     */
    remove(target: three.Texture | three.BufferGeometry | three.Material): void;
    /**
     * 관리 중인 텍스처(texture)와 지오메트리(geometry), 머티리얼(material)을 차례로 해제합니다.<br>
     * 지오메트리 가운데 갱신 대기 표시가 있는 것은 건너뛰므로 전부가 해제되지는 않습니다.<br>
     * 해제한 자원은 목록에서도 빠지므로 호출 직후에는 건너뛴 지오메트리만 목록에 남습니다.<br>
     * 그 뒤 다시 그려지는 자원은 목록에 새로 들어오므로 개수는 다시 늘어납니다.<br>
     * 아직 화면에 사용 중인 자원도 함께 해제되므로 렌더링을 끝낸 시점에만 호출하여 사용합니다.
     */
    clear(): void;
    /**
     * 관리 중인 모든 텍스처(texture)의 dispose를 호출해 GPU에 올라간 사본을 버립니다.<br>
     * 사용 여부를 가리지 않으므로 화면에 표시 중인 텍스처도 함께 해제됩니다.<br>
     * 해제한 텍스처는 목록에서도 빠지므로 getTextureCount가 줄어듭니다.<br>
     * 이어서 allocate 메서드가 있는 텍스처는 다시 쓸 수 있는 상태로 되돌리므로, 그 텍스처가 다음에 그려질 때 GPU에 새로 올라가면서 목록에도 다시 들어옵니다.
     */
    clearTexture(): void;
    /**
     * 관리 중인 지오메트리(geometry) 가운데 갱신 대기 표시가 없는 것만 dispose를 호출합니다.<br>
     * 해제한 지오메트리는 목록에서도 빠지므로 getGeometryCount가 줄어듭니다.<br>
     * 갱신을 기다리는 지오메트리는 건너뛰므로 해제되지 않고 목록에도 그대로 남습니다.
     */
    clearGeometry(): void;
    /**
     * 관리 중인 모든 머티리얼(material)의 dispose를 호출합니다.<br>
     * 사용 여부를 가리지 않으므로 화면에 사용 중인 머티리얼도 함께 해제됩니다.<br>
     * 해제한 머티리얼은 목록에서도 빠지므로 getMaterialCount가 줄어듭니다.
     */
    clearMaterial(): void;
    /**
     * 관리 중인 지오메트리(geometry)와 텍스처(texture)가 차지하는 GPU 메모리 사용량을 어림잡아 계산하고 그 값을 안에 저장합니다.<br>
     * 지오메트리는 실제 정점(vertex) 자료의 크기로 재지만 텍스처는 픽셀 형식을 확인하지 않고 어림잡으므로 실제 사용량과 차이가 납니다.<br>
     * 머티리얼(material)이 차지하는 양은 계산에 넣지 않으므로 getMaterialCount가 세는 대상과 계산 대상이 다릅니다.<br>
     * 호출할 때마다 관리 중인 모든 지오메트리와 텍스처를 처음부터 훑으므로 매 프레임(frame) 호출하기에는 부담이 큽니다.<br>
     * 저장한 값은 다시 계산하지 않고 getResourceSize로 조회할 수 있습니다.
     *
     * @returns {number} 소수점 둘째 자리까지 나타낸 메가바이트 단위의 어림 사용량입니다.
     */
    estimateGPUMemory(): number;
}

export type { UResourceManager };
