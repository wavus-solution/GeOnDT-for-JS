# UVisualizationLatencyMonitor 명세

> 상태: 구현 관찰 초안

## 1. 개요

객체 위치 입력부터 변경된 변환을 사용한 메인 장면의 후처리 호출 종료까지의 지연을 측정한다. 렌더 대기를 포함하는 엔진 관측 지표이며 GPU 완료·모니터 표시 완료를 측정하지 않는다.
측정기는 Mesh·부모 Group·입력 타이머·렌더 관측 함수와 결과 이력을 소유한다. UProcessManager가 수명을 관리하고 UDevToolView는 관리자를 통해 결과만 조회한다.
일반 소스에 측정 기준과 관측 흐름을 공개하여 결과의 의미와 누락 원인을 직접 검토할 수 있다. 작업 한도 결정이나 UI 갱신은 측정기의 책임이 아니다.

## 2. 요구사항과 품질 기준

```spec
SGM-RS-GIS-PFMC-0020의 데이터 입력은 측정 Mesh의 position 변경으로 해석하고, 50ms 미만 여부를 확인할 수 있는 지연을 기록한다.
입력과 렌더 관측은 독립적으로 실행하고 렌더 대기를 포함한다. 측정 때문에 렌더를 강제로 요청하거나 작업 한도를 바꾸지 않는다.
미완료 입력을 덮어쓰지 않고 한 입력을 한 번만 완료한다. 50ms 이상 표본을 잘라내거나 제외하지 않는다.
최근 완료 이력은 256개로 제한하고 외부 조회에 내부 가변 참조를 노출하지 않는다.
등록·입력·렌더 관측 실패는 측정 상태로 구분하고 기존 렌더링으로 전파하지 않는다.
```

## 3. 정규 자연어 수도코드

```spec
UVisualizationLatencyRenderCallback 함수 타입 정의
    (renderer: WebGLRenderer, scene: Scene, camera: Camera) -> void
    renderer·scene·camera는 해당 메인 렌더의 인자다. 반환값을 사용하지 않는다.

UVisualizationLatencySubscribe 함수 타입 정의
    (beforeRender: UVisualizationLatencyRenderCallback, afterRender: UVisualizationLatencyRenderCallback) -> function(): void
    두 관측 함수를 등록하고 모두 해제할 함수를 반환한다. 등록 실패 시 부분 등록도 해제한 뒤 오류를 전달한다.

UVisualizationLatencySample 타입 정의
    sampleId: number
        입력마다 증가하는 번호이며 reset 이후에도 재사용하지 않는다.
    inputAtMs: number
        performance.now 기준 위치 입력 직전 시각, 밀리초다.
    observedAtMs: number
        같은 기준의 렌더 후 관측 시각, 밀리초다.
    latencyMs: number
        observedAtMs에서 inputAtMs를 뺀 지연이며 렌더 대기를 포함한다.

UVisualizationLatencyState 타입 정의
    status: 'stopped' | 'running' | 'error' | 'disposed'
        측정 수명 상태다.
    error: string | null
        마지막 오류 문자열이며 정상 시작 시 null로 비운다.
    intervalMs: number
        독립 타이머의 입력 시도 간격 250ms다.
    thresholdMs: number
        요구 기준 50ms이며 같은 값도 미만 조건을 만족하지 않는다.
    sampleCount: number
        마지막 reset 이후 누적 완료 건수다.
    retainedSampleCount: number
        최근 통계에 포함된 완료 건수이며 최대 256개다.
    cancelledCount: number
        stop으로 취소한 미완료 입력 수이며 reset으로 초기화한다.
    exceededCount: number
        마지막 reset 이후 지연이 50ms 이상인 누적 완료 건수다.
    lastMs, meanMs, p95Ms, maxMs: number | null
        마지막·최근 평균·최근 P95·최근 최대 지연이다. 완료 표본이 없으면 null이다.
    pendingId, pendingMs: number | null
        미완료 입력 번호와 현재까지의 대기 밀리초다. 미완료 입력이 없으면 null이다.
    latest: UVisualizationLatencySample | null
        마지막 완료 표본의 복사본이며 완료 표본이 없으면 null이다.

UVisualizationLatencyMonitor 클래스 정의
    #scene: Object3D | null
        빌려온 측정 객체의 부모 장면 또는 그룹이다.
    #getCamera: function(): Camera | undefined
        현재 메인 카메라 조회 연결이다.
    #subscribe: UVisualizationLatencySubscribe | undefined
        메인 렌더 전후 등록 연결이다.
    #unsubscribe: function(): void | undefined
        실행 중 등록의 해제 연결이다.
    #timer: number | undefined
        입력 예약 타이머다.
    #status: 'stopped' | 'running' | 'error' | 'disposed' = 'stopped'
        수명 상태다.
    #error: string | null = null
        측정 실패 사유다.
    #root: Group
        카메라 기준 화면 배치를 담당하는 소유 부모다.
    #mesh: Mesh
        2×2 PlaneGeometry와 청록색 MeshBasicMaterial로 만든 소유 표식이다. 깊이 검사·깊이 쓰기·안개·톤 매핑을 끈다.
    #anchor, #pixel, #scale: Vector3
        화면 고정 배치 계산에 재사용한다.
    #expectedWorld, #localMatrix: Matrix4
        예상 그리기 행렬과 재사용 계산 행렬이다.
    #cycleCamera: Camera | null = null
        현재 유효 메인 렌더 구간의 카메라다.
    #observed: boolean = false
        같은 구간에서 입력 변환으로 그렸는지 나타낸다.
    #sequence: number = 0
        인스턴스 수명 동안 단조 증가하는 입력 번호다.
    #pending: object | null = null
        미완료 입력의 번호·입력 시각·x 좌표 한 건이다.
    #samples: Array<UVisualizationLatencySample>
        최근 256개 원형 이력이다.
    #sampleCount, #cancelledCount, #exceededCount: number = 0
        완료·취소·50ms 이상 누적 건수다.
    #latest: UVisualizationLatencySample | null = null
        마지막 완료 표본이다.
    #meanMs, #p95Ms, #maxMs: number | null = null
        최근 완료 이력에서 계산한 통계다.

    constructor(scene: Object3D, getCamera: function(): Camera, subscribeRenderCycle: UVisualizationLatencySubscribe)
        의존:
            three — 측정 자원 생성; 생성자: {new Group(), new Mesh(), new PlaneGeometry(), new MeshBasicMaterial(), new Vector3(), new Matrix4()}; 함수: {Group.add()}
        동작:
            scene.isObject3D가 참이 아니거나 두 연결 인자가 함수가 아니면 소유 자원을 해제하고 TypeError를 던진다.
            장면·카메라 조회·구독 함수를 보관한다. root는 첫 입력 배치 전까지 숨기고 matrixAutoUpdate를 끈다.
            mesh의 절두체 제외를 끄고 renderOrder를 최대로 설정한다. raycast를 무동작으로 만들어 사용자 선택을 가로채지 않는다. 객체 렌더 후 관측을 인스턴스에 바인딩하고 root에 mesh를 추가한다.

    start() -> void
        의존:
            three — 측정 장면 연결; 함수: {Object3D.add()}
        동작:
            폐기 또는 실행 중이거나 장면·구독 연결이 없으면 반환한다. 오류를 비운다.
            try에서 root를 장면에 추가하고 바인딩한 렌더 전후 관측을 등록한다. 반환된 해제 함수가 함수가 아니면 TypeError를 던진다.
            등록이 성공하면 running으로 바꾸고 입력을 예약한다. catch에서 측정 실패 처리를 호출한다.

    stop() -> void
        의존:
            Web API — 입력 예약 취소; 함수: {clearTimeout()}
            three — 측정 장면 분리; 함수: {Group.removeFromParent()}
        동작:
            폐기 상태이면 반환한다. stopped로 바꾸고 예약 타이머를 취소·해제한다.
            해제 함수를 지역에 옮겨 내부 참조를 비우고 현재 렌더 구간·관측 플래그를 초기화한다. 미완료 입력이 있으면 취소 수를 올린 뒤 입력을 비운다.
            try에서 해제 함수를 호출한다. catch에서는 error 상태와 오류 문자열을 저장한다. finally에서는 root를 부모에서 분리한다.

    getSnapshot() -> UVisualizationLatencyState
        의존:
            Web API — 현재 대기 경과 시간; 함수: {performance.now()}
        동작:
            수명·오류·250ms 간격·50ms 기준과 누적 건수·최근 통계의 새 객체를 반환한다.
            대기 입력이 있으면 현재 시각에서 입력 시각을 뺀 값과 0 중 큰 값을 pendingMs로 반환하고 없으면 null이다. latest도 복사해 내부 참조를 노출하지 않는다.

    getSamples() -> Array<UVisualizationLatencySample>
        동작:
            완료 수가 256을 넘으면 완료 수를 256으로 나눈 나머지 위치부터, 그렇지 않으면 처음부터 이력을 두 구간으로 이어 입력 순서를 복원한다.
            각 표본도 복사한 새 배열을 반환한다.

    reset() -> void
        동작:
            폐기 상태이면 반환한다. 미완료 입력·현재 렌더 구간·관측 여부와 표본 배열·누적 건수·마지막 표본·최근 통계를 비운다.
            수명 상태·타이머·오류·입력 번호는 유지한다.

    dispose() -> void
        동작:
            이미 폐기됐으면 반환한다. try에서 중지한다.
            finally에서 disposed로 바꾸고 빌려온 연결을 해제한 뒤 소유 자원을 반납한다. 완료 이력은 보존한다.

    #scheduleInput() -> void
        의존:
            Web API — 독립 위치 입력; 함수: {setTimeout(), performance.now()}
            three — 측정 객체 위치 입력; 함수: {Vector3.set()}
        동작:
            250ms 뒤 실행할 타이머를 등록한다. 콜백은 타이머 참조를 비우고 running이 아니면 반환한다.
            try에서 미완료 입력이 없을 때만 번호를 증가시키고 홀수 -3·짝수 3인 x 좌표와 현재 입력 시각을 저장하여 mesh.position에 입력한다. 행렬 갱신이나 렌더 요청은 하지 않는다.
            대기 입력이 있어도 다음 입력 시도는 다시 예약하며 덮어쓰지 않는다. catch에서는 실패 처리한다.

    #beforeRender(renderer: WebGLRenderer, scene: Scene, camera: Camera) -> void
        의존:
            three — 화면 기준 배치와 예상 행렬; 함수: {Vector3.set(), Vector3.applyMatrix4(), Matrix4.makeScale(), Matrix4.setPosition(), Matrix4.copy(), Matrix4.multiply(), Matrix4.premultiply(), Matrix4.invert(), Matrix4.makeTranslation()}
        동작:
            root를 숨기고 이전 렌더 구간과 관측 여부를 지운다. running·미완료 입력·부모·카메라 조회 연결이 없으면 반환한다. 이전 입력의 카메라 기준 배치를 다시 그리지 않는다.
            try에서 현재 메인 카메라와 다른 카메라이거나 캔버스 크기가 0 이하면 반환한다.
            NDC (-0.94, -0.92)와 캔버스 1픽셀 차이를 투영 역행렬로 변환하여 화면 구석의 기준점과 픽셀 크기를 구한다.
            카메라 world 행렬에 기준점·크기를 곱하고 부모 world 역행렬을 앞에 곱하여 root의 local 행렬로 저장한다. root의 world 갱신을 표시한다.
            부모·root·입력 x 이동 행렬을 곱해 예상 world 행렬을 저장하고 표식을 보이게 한다. 해당 카메라로 관측 구간을 연다.
            catch에서는 실패 처리한다.

    #observe(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: object) -> void
        동작:
            running과 미완료 입력이 없거나 카메라가 현재 구간과 다르거나 재질이 소유 재질과 다르거나 overrideMaterial이 있으면 반환한다.
            mesh.matrixWorld의 모든 값이 유한하고 예상 값과의 차이가 max(1, 예상 절댓값)×1e-10 이하이며 local 행렬 x 이동이 입력 x와 같을 때만 observed를 참으로 설정한다.

    #afterRender(renderer: WebGLRenderer, scene: Scene, camera: Camera) -> void
        의존:
            Web API — 렌더 후 관측 시각; 함수: {performance.now()}
        동작:
            running·미완료 입력이 없거나 카메라가 현재 구간과 다르면 반환한다. 현재 구간을 닫고 observed가 거짓이면 반환한다.
            진입 시 #observed가 true이면:
                observed를 비운 뒤 try에서 종료 시각을 먼저 기록하고 입력 시각과의 차이로 완료 표본을 만든다.
                미완료 입력을 비우고 root를 숨긴 뒤 완료 수를 증가시키면서 256개 원형 이력에 저장한다. latest를 갱신하고 50ms 이상이면 초과 건수를 올린다.
                최근 지연을 정렬하여 평균·올림(개수×0.95) 위치의 P95·최대를 갱신한다. catch에서는 실패 처리한다.

    #fail(error: unknown) -> void
        의존:
            __GWarn__ — 전역 로거를 통한 측정 중단 알림; 함수: {__GWarn__()}
        동작:
            Error.message 또는 문자열 변환으로 원래 오류를 보관한다. stop 호출의 오류를 격리하고 error 상태와 원래 문자열을 저장한다.
            __GWarn__으로 측정 중단을 알리며 로거 오류도 격리한다.

    #releaseResources() -> void
        의존:
            three — 소유 자원 반납; 함수: {Mesh.dispose(), PlaneGeometry.dispose(), MeshBasicMaterial.dispose(), Group.dispose(), Group.clear()}
        동작:
            소유 mesh·geometry·material·root를 순서대로 dispose하고 root의 자식 연결을 비운다. 빌려온 장면과 카메라는 해제하지 않는다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
