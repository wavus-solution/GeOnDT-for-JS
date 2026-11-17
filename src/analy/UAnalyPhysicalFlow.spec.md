# UAnalyPhysicalFlow 명세

> 상태: 구현 관찰 초안

## 1. 개요

사용자가 그린 물리 분석 영역의 지형을 워커에 전달하고, 강우·유수 입자의 생성과 화면 갱신을 연결한다. 분석 영역은 지형 물리를 구성하는 범위이며 목표 영역은 유수 입자를 생성할 위치의 범위다.

- 책임 범위: 측정 입력·취소, 영역과 워커 초기화, 고도 수집, 시뮬레이션 등록·정지·재개, 공유 지오메트리·머터리얼과 입자의 수명 관리.
- 주요 동작 방식: 렌더 전 콜백에서 활성 시뮬레이션을 실행하고 워커 갱신 결과를 메시 위치·속도별 색상에 반영한다. 물리 영역의 완료는 네 워커 초기화 단계까지 기다린다.
- 주요 사용처와 연계 대상: U3dApp의 PhysicalFlow 분석 생성, UAnaly의 앱·렌더링 실행 인자, 측정 레이어와 UTaskProcessor의 UPhysicalFlow 작업.

## 3. 정규 자연어 수도코드

```spec
UAnalyPhysicalFlow extends UAnaly 클래스 정의
    의존: UAnaly — 분석 기반 기능; 상속: {UAnaly}

    static OPT_KEYS: Array<string> = 부모 OPT_KEYS와 'name'
        의존: UAnaly — 부모 옵션 키; 속성 읽기: {OPT_KEYS}
        생성자의 이름 옵션 키를 정규화한다.
    name: string = 'PhysicalFlow'
        외부에서 변경할 수 있는 분석 이름이다.
    _classtype: string = 'UAnalyPhysicalFlow'
    _clickId, _dblClickId: string | undefined = undefined
    _updateId: string = 'PhysicalFlowUpdate'
    _setMouseMove: boolean | undefined = undefined
    #drawRequest: {result: DeferredPromise<void>, feature: DeferredPromise<UMeasureFeature>} | undefined = undefined
    #areaGeneration: number = 0
        진행 요청의 소유권과 물리 초기화 세대를 구분한다.
    _feature, _flowFeature: UMeasureFeature | undefined = undefined
    _targetBox, _flowBox: Box3 | undefined = undefined
    _targetCenter: WorldPositionVector3 = 영벡터
    _targetWidth, _targetHeight: number | undefined = undefined
    _heightData: Float32Array | undefined = undefined
    _terrainMinHeight, _terrainMaxHeight: number | undefined = undefined
    _resolution: number = 2
    _gravity: number = -12
    _maxParticleNum: number = 6000
    _limitMinHeight: number = -10
    _limitTime: number = 40000
    _flowObject: Map<number, Mesh> = 빈 Map
    _clock: UClock
    _geometries: Map<string, BufferGeometry> = 빈 Map
    _materials: Map<string, Material | Array<Material>> = 빈 Map
    _worker: UTaskProcessor | undefined = undefined
    _taskNum: number = 0
    _maxTaskNum: number = 8
    _simulationList: Map<string, UPhysicalFlowSimulation> = 빈 Map
    _modelBoxList: Array<Box3>
        생성자에서 고정된 11개 월드 좌표 박스를 새로 만든다. 고도 수집 시 z=0인 표본이 포함되는 박스마다 높이 20을 더한다.
        각 박스의 z 범위는 0~200이며 최소 (x,y) → 최대 (x,y)는 다음 순서다.
            (-206106.25, 98744.1875) → (-206082.703125, 98771.203125)
            (-206152.015625, 98720.7578125) → (-206135.5859375, 98738.05078125)
            (-206135.5859375, 98720.7578125) → (-206119.15625, 98755.34375)
            (-206200.734375, 98690.015625) → (-206160.671875, 98725.421875)
            (-206243.375, 98662.828125) → (-206210.015625, 98695.734375)
            (-206283.390625, 98638.3046875) → (-206251.40625, 98670.59375)
            (-206323.21875, 98600.5078125) → (-206294.015625, 98623.7265625)
            (-206376.140625, 98580.25) → (-206346.25, 98608.5546875)
            (-206414.1875, 98560.75) → (-206384.234375, 98598.359375)
            (-206474.546875, 98521.515625) → (-206439.90625, 98565.296875)
            (-206515.671875, 98499.296875) → (-206478, 98542.0859375)
        밑줄 필드는 쓰기 차단이 없으며 후속 메서드는 현재 필드 값을 읽는다.

    constructor(opt: UAnalyPhysicalFlowCO = {})
        인터페이스: opt.name은 분석 이름이다. 호환용 수치 옵션은 생성자에서 읽지 않는다. [확인 Q-001]
        의존:
            UAnaly — 기반 초기화; 생성자: {new UAnaly()}; 속성 읽기: {_scene}
            defaultValue — undefined 기본값; 함수: {defaultValue()}
            normalizeOptionKeys — 이름 옵션 정규화; 함수: {normalizeOptionKeys()}
            THREE.Vector3 — 중심과 장애물 꼭짓점; 생성자: {new Vector3()}
            THREE.Box3 — 기본 장애물 범위; 생성자: {new Box3()}
            UClock — 시간차 측정; 생성자: {new UClock()}
        동작:
            옵션을 전달하지 않고 부모를 초기화한다.
            opt가 truthy이면 실제 생성 클래스의 OPT_KEYS를 사용하여 키를 정규화한다. 정본 이름 입력의 원본 참조는 유지하고 대소문자 키 변환이 필요할 때만 복사한다. 명시적인 null은 이후 name 읽기에서 기존대로 예외가 발생한다.
            opt.name이 undefined이면 'PhysicalFlow'를 사용하고 장면의 exceptAO를 true로 설정한다.
            입력·영역 참조와 시뮬레이션·입자·공유 자원 목록을 초기화한다. 수치 필드는 선언한 고정 기본값을 사용하고 시계와 11개 장애물 박스를 인스턴스마다 생성한다.

    async setOption(option: UAnalyPhysicalFlowOptions) -> Promise<boolean>
        인터페이스: resolution·gravity·maxParticleNum·limitMinHeight·limitTime을 읽는다. name은 변경하지 않는다.
        의존:
            UTaskProcessor — 워커 옵션 설정; 함수: {scheduleTask()}
            UWorkerParameter — 워커 요청; 생성자: {new UWorkerParameter()}
        동작:
            각 입력이 falsy이면 resolution=2, gravity=2, maxParticleNum=6000, limitMinHeight=-10, limitTime=40000을 저장한다. 중력의 대체값은 생성 직후의 -12와 다르다. [확인 Q-002]
            _worker가 truthy이면 보정한 복사본이 아닌 option 원본을 setOption 요청으로 보내고 완료를 기다린다.
            읽기·설정·요청 실패를 잡아 false로 완료하며 이미 변경한 필드는 복원하지 않는다. 나머지는 true로 완료한다.

    async override active() -> Promise<boolean>
        의존:
            UAnaly — 활성 상태와 앱; 함수: {active()}; 속성 읽기: {_app}
            U3dApp — 렌더 등록·주기; 함수: {getMeasureLayer(), setRenderBefore(), drawFast()}
            UMeasureLayer — 측정 불투명도; 함수: {setOpacity()}
        동작:
            부모 active()로 활성 상태를 먼저 설정한다. 앱·getMeasureLayer·결과가 있으면 측정 불투명도를 0.2로 설정한다.
            현재 updatePhysics를 이 분석 객체에 bind하여 _updateId로 렌더 전에 등록하고 drawFast()를 요청한 뒤 true로 완료한다. 예외는 거절로 전달한다.

    async override deactive() -> Promise<boolean>
        의존:
            UAnaly — 비활성화·등록 이벤트 정리와 연결 상태; 함수: {deactive()}; 속성 읽기: {_isActive, _app}
            U3dApp — 렌더 해제·주기; 함수: {removeRenderBefore(), drawDefault()}
        동작:
            _isActive가 falsy이면 false로 완료한다. 부모 deactive()를 먼저 실행하며 그 예외는 잡지 않는다.
            _isActive가 truthy이면:
                렌더 콜백을 해제하고 기본 렌더 주기로 돌아간 다음 그리기를 중단한다. 이 세 단계의 예외는 false, 정상 종료는 true로 완료한다. 워커와 시뮬레이션 데이터는 초기화하지 않는다.

    getInfo() -> UAnalyPhysicalFlowInfo
        동작: 현재 영역 정보를 새 객체로 반환하며 box·center는 원본 참조를 공유한다.

    async override clear() -> Promise<void>
        동작:
            진행 중인 입력과 공개 요청을 먼저 취소한다.
            영역 데이터를 정리한다. 워커 종료 Promise의 완료까지 기다리지는 않는다.

    #clearArea() -> void
        의존:
            UAnaly — 분석 장면; 속성 읽기: {_scene}
            Object3D — 입자 분리; 함수: {remove()}
            UClock — 새 시간차 측정; 생성자: {new UClock()}
            Material, BufferGeometry — 공유 자원 해제; 함수: {dispose()}
            __GError__ — 정리 실패 진단; 함수: {__GError__()}
        동작:
            시뮬레이션 목록을 비우고 작업 수를 0으로 만든 뒤 측정 입력을 확정·제거한다.
            분석·목표 피처를 제거한다.
            영역 박스·치수·고도 참조와 극값을 undefined로 만들고 공유 중인 중심 벡터를 영벡터로 변경하며 시계를 교체한다.
            입자를 장면에서 분리하고 목록을 비운다. 머터리얼이 Array이면 각 원소를, 아니면 단일 자원을 해제한 뒤 목록을 비우고 지오메트리도 해제·초기화한다.
            현재 워커를 분리·종료 요청한다. 어느 단계든 예외가 나면 이후 정리를 건너뛰고 초기화 오류를 기록하며 예외를 삼킨다.

    #disposeWorker() -> void
        의존:
            UTaskProcessor — 워커 해제; 함수: {dispose()}
            __GError__ — 종료 실패 진단; 함수: {__GError__()}
        동작: _worker를 먼저 undefined로 분리한다. 원래 워커가 없으면 종료하고 있으면 dispose()를 호출하며 비동기 거절을 문자열 진단으로 기록한다. 종료를 기다리지 않으며 동기 예외는 호출자에게 전달한다.

    stopDraw() -> UMeasureFeature | undefined
        의존: UAbortError — 요청 취소; 생성자: {new UAbortError()}
        동작:
            영역 세대를 증가시키고 #drawRequest를 분리한다. 기존 요청이 있으면 동일한 AbortError로 입력 대기와 공개 결과를 모두 거절한다.
            측정 입력을 종료하고 확정 피처 또는 undefined를 반환한다.

    #finishDraw() -> UMeasureFeature | undefined
        의존:
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 클릭 이벤트 해제; 함수: {unkey()}
            Web API(document) — 마우스 이벤트 해제; 함수: {removeEventListener()}
        동작:
            _clickId가 truthy이면 click 이벤트를 해제하고 _clickId를 undefined로 만든다.
            _dblClickId가 truthy이면 dblclick 이벤트를 해제하고 _dblClickId를 undefined로 만든다.
            mousemove 리스너를 해제하고 _setMouseMove를 false로 설정한다.
            측정 입력을 확정·분리한 결과를 반환한다.

    drawPhysicalArea() -> Promise<void>
        의존:
            UAnaly — 활성 상태와 앱; 함수: {isActive()}; 속성 읽기: {_app}
            deferredPromise — 완료 제어 가능한 표준 Promise; 함수: {deferredPromise()}
            U3dApp — 다각형 입력 등록; 함수: {setPolygonMeasureType(), on()}
            Web API(document) — 마우스 이벤트 등록; 함수: {addEventListener()}
            UAbortError — 취소; 생성자: {new UAbortError()}
            __GInfo__ — 입력 거부 진단; 함수: {__GInfo__()}
        동작:
            결과 Promise를 생성한다. isActive()가 false이면 8528578, 클릭 키 중 하나라도 undefined가 아니면 8528811을 기록하고 이유 undefined로 거절하여 반환한다.
            입력 Promise를 만들고 #drawRequest가 있으면 이전 요청을 취소한다.
            두 Promise를 현재 요청으로 저장하고 다각형 측정을 설정한다. click·dblclick·mousemove를 등록하며 이벤트 키의 null·undefined는 undefined로 저장한다. 등록 단계 동기 예외는 그대로 전달한다.
            입력 성공 콜백에서 현재 요청이 다르거나 비활성이면 AbortError로 거절한다. 유효하면 물리 영역 초기화 완료를 기다린 뒤 값 없이 성공한다. 실패는 원래 이유로 거절하고 현재 소유 요청만 분리한다. 입력 거절도 같은 소유 확인 후 그대로 전달한다.
            그리기 시작 직후 결과 Promise를 반환한다.

    drawTargetArea() -> Promise<void>
        의존:
            UAnaly — 활성 상태와 앱; 함수: {isActive()}; 속성 읽기: {_app}
            deferredPromise — 입력·결과 Promise; 함수: {deferredPromise()}
            U3dApp — 다각형 입력 등록; 함수: {setPolygonMeasureType(), on()}
            Web API(document) — 마우스 이벤트 등록; 함수: {addEventListener()}
            UAbortError — 취소; 생성자: {new UAbortError()}
            __GInfo__ — 입력 거부 진단; 함수: {__GInfo__()}
        동작:
            결과 Promise를 만들고 비활성은 8529758, 클릭 키 중 하나라도 undefined가 아닌 중복 입력은 8529991을 기록하며 이유 undefined로 거절한다.
            입력 Promise를 만들고 #drawRequest가 있으면 취소한 뒤 두 Promise를 현재 요청으로 저장한다.
            다각형 측정과 click·dblclick·mousemove 리스너를 설정한다. 이벤트 키의 null·undefined는 undefined로 저장하며 등록 단계 예외는 동기로 전달한다.
            입력 성공 후 현재 요청이 다르거나 비활성이면 AbortError로 거절한다. 유효하면 기존 목표 피처를 제거하고 입력의 범위 사각형 피처와 월드 박스를 순서대로 저장한 뒤 값 없이 성공한다. 실패는 원래 이유로 거절하며 성공·실패 모두 현재 요청만 분리한다. 입력 거절도 같은 소유 확인 후 전달한다.
            입력 시작 직후 결과 Promise를 반환한다.

    async createPhysicalArea(feature: UMeasureFeature | undefined) -> Promise<boolean>
        의존:
            UAnaly — 활성 상태; 함수: {isActive()}
            UTaskProcessor — 워커 초기화; 생성자: {new UTaskProcessor()}; 함수: {scheduleTask()}; 상수: {SOURCE_URL}
            UWorkerParameter — 워커 요청; 생성자: {new UWorkerParameter()}
            UAbortError — 비활성·세대 변경 취소; 생성자: {new UAbortError()}
            Box3 — 분석 중심 계산; 함수: {getCenter()}
            isWrong — 영역 크기 유효성; 함수: {isWrong()}
            Web API(performance) — 소요 시간; 함수: {now()}
            __GInfo__ — 정보·오류 진단; 함수: {__GInfo__()}
        동작:
            영역 세대를 증가시킨다. 비활성이면 AbortError, feature가 falsy이면 영역 누락 Error로 거절한다.
            시작 시각을 읽고 이전 영역을 정리한 뒤 세대·활성 상태·워커 소유가 아직 같은지 확인한다. 각 await 직후에도 동일한 소유 확인을 하며 달라지면 AbortError로 거절한다.
            task/physical/UPhysicalFlow.js 워커를 생성·보관하고 SOURCE_URL의 setRootPath 완료, 현재 limitTime·limitMinHeight·maxParticleNum의 setOption 완료를 순서대로 기다린다.
            입력 범위를 사각형 피처로 확장하고 월드 박스를 만들어 중심을 기존 벡터에 반영한다.
            박스 최솟점·크기·현재 해상도로 고도를 수집한다. 결과·data·min·max 중 하나라도 falsy이면 5212623을 기록하고 Error로 거절한다. 유효한 0 극값도 실패한다. [확인 Q-003]
            고도 배열과 극값을 보관하고 5212940 소요 시간을 기록한다. 현재 gravity의 initPhysics 완료 후 크기·해상도·고도 배열·극값·중심의 createTerrainShape 완료를 기다린다. 5213987 소요 시간을 기록한 뒤 true로 완료한다.
            실패 시 이 요청이 만든 워커가 아직 현재 워커인 경우 세대도 같으면 영역 전체를 정리하고 세대만 달라졌으면 워커만 분리한다. 새 요청이 소유한 워커·목표 영역은 지우지 않으며 원래 이유로 거절한다.

    removeTargetFeature() -> void
        의존:
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 피처 제거; 함수: {removeMeasureFeature()}
        동작: _feature가 truthy이면 앱에서 제거한 뒤 undefined로 만든다. 박스·크기·중심은 변경하지 않는다.

    removeFlowFeature() -> void
        의존:
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 피처 제거; 함수: {removeMeasureFeature()}
        동작: _flowFeature가 truthy이면 앱에서 제거한 뒤 undefined로 만든다. 목표 박스는 변경하지 않는다.

    updatePhysics() -> void
        의존:
            UAnaly — 장면; 속성 읽기: {_scene}
            UClock — 프레임 시간차; 함수: {getDelta()}
            UPhysicalFlowSimulation — 실행 함수; 콜백: {fnc()}
            UTaskProcessor — 물리 갱신·미존재 입자 제거; 함수: {scheduleTask()}
            UWorkerParameter — 워커 요청; 생성자: {new UWorkerParameter()}
            Object3D — 삭제 입자 분리; 함수: {remove()}
        동작:
            _taskNum이 _maxTaskNum보다 클 때 종료한다. 같으면 진행하여 기본 한도 8에서도 아홉 번째 작업을 요청할 수 있다.
            시계에서 delta를 읽고 현재 시뮬레이션 목록 중 active가 truthy인 항목의 fnc(delta)를 해당 simulation을 this로 호출한다.
            장면 자식이 없거나 _worker가 없으면 종료하고 아니면 작업 수를 증가시켜 현재 워커에 update(delta)를 요청한다.
            성공 콜백은 먼저 작업 수를 감소시킨 뒤 워커가 교체되었거나 결과가 falsy이면 종료한다. 요청 거절·콜백 예외는 삼키며 거절 경로에서는 작업 수가 감소하지 않는다. [확인 Q-004]
            없는 메시 id가 있으면 removeObject를 먼저 요청한다. 추가 위치가 있으면 생성 요청을 보내며 두 요청의 완료를 기다리지 않는다.
            deleteData의 존재 메시를 장면·입자 목록에서 제거한다. 공유 자원은 해제하지 않는다.

    async generateObject(option: UAnalyPhysicalFlowGenerateOptions = {}) -> Promise<Array<Mesh> | Mesh | boolean>
        인터페이스: 단일 또는 배열 position, geometry·material, radius·mass, type·simulationId를 받는다. 실패 시 실제 완료값과 선언의 충돌은 Q-007에 둔다.
        의존:
            CheckFloat16Array — 수치 배열 변환; 생성자: {new CheckFloat16Array()}
            UAnaly — 장면; 속성 읽기: {_scene}
            Object3D — 메시 등록; 함수: {add()}
            UTaskProcessor — 물리 입자 생성; 함수: {scheduleTask()}
            UWorkerParameter — 워커 요청; 생성자: {new UWorkerParameter()}
        동작:
            option 원본에서 mass가 truthy인 Array이면 CheckFloat16Array로 먼저 바꾸고 radius도 같은 조건으로 변환하여 원본 속성을 교체한다.
            radius가 undefined이면 2, mass가 undefined이면 radius × 5를 사용한다. position이 falsy이면 false를 던진 뒤 catch에서 false로 완료한다.
            메시 id를 Int16Array, 원래 위치를 Float32Array에 담으므로 각각 정수 범위 변환과 단정밀도 반올림이 적용된다. 생성 메시를 모두 장면·목록에 추가한 뒤 작업 수를 증가시켜 배열 워커 생성 완료를 기다리고 작업 수를 감소시켜 메시 배열로 완료한다.
            예외·워커 거절은 이유 값을 그대로 성공 완료값으로 반환한다. 실패 전에 생성한 메시·옵션 변경·작업 수는 복구하지 않는다. [확인 Q-007]

    getHeightData(origin: WorldPositionVector3, width: number, height: number, resolution: number) -> UAnalyPhysicalFlowHeightData | undefined
        의존:
            UAnaly — 고도 조회 실행 인자; 속성 읽기: {_drawArg}
        동작:
            origin·width·height·resolution 중 하나라도 falsy이면 undefined를 반환한다.
    simulateRain(option: UAnalyPhysicalFlowRainOptions = {}) -> string | undefined
        의존:
            Guid — 시뮬레이션 식별자; 함수: {Guid()}
            THREE.SphereGeometry — 공유 형상; 생성자: {new SphereGeometry()}
            THREE.MeshBasicMaterial — 공유 표시 자원; 생성자: {new MeshBasicMaterial()}
            Web API(performance) — 시작 시각; 함수: {now()}
        동작:
            _targetWidth·_targetHeight 중 하나라도 falsy이면 undefined를 반환한다.
            각 입력이 falsy이면 amount=4, initHeight=600, radius=1, mass=8, color=0x85D3F2, opacity=0.3을 사용한다. 폭·높이는 현재 값을 복사하고 center는 _targetCenter 원본을 공유하며 활성 상태로 구성한다.
            ID와 구형 지오메트리(분할 10×10), 기본 머터리얼을 만들고 각 자원 목록에 저장한다. opacity < 1이면 transparent를 켜고 시작 시각을 저장한다.
            프레임 함수는 RAIN 타입·공유 자원·위치 배열·radius·radius×mass·ID로 현재 generateObject를 호출하며 완료를 기다리지 않는다. 시뮬레이션을 목록에 등록하고 ID를 반환한다.

    simulateFlow(option: UAnalyPhysicalFlowFlowOptions = {}) -> string | undefined
        의존:
            UAnaly — 고도 조회 실행 인자; 속성 읽기: {_drawArg}
            Guid — 시뮬레이션 식별자; 함수: {Guid()}
            THREE.SphereGeometry — 공유 형상; 생성자: {new SphereGeometry()}
            THREE.MeshBasicMaterial — 단계별 표시 자원; 생성자: {new MeshBasicMaterial()}
            Web API(performance) — 시작 시각·실행 경과; 함수: {now()}
        동작:
            option.steps가 truthy이고 Array가 아니거나 빈 배열이면 option 원본의 steps를 갈색·불투명도 0.4의 한 단계 배열로 교체한다. 그 뒤 _flowFeature·_flowBox 중 하나라도 falsy이면 undefined를 반환한다.
            각 입력이 falsy이면 amount=8, initTime=5000, radius=1, mass=20, resolution=0.4, generateRatio=1, generateAmount=5를 사용한다. steps가 falsy이면 max 6·15·25 및 무한 구간의 파랑·초록·노랑·빨강 기본 네 단계를 사용하고 아니면 원본 배열을 공유한다.
            ID와 구형 지오메트리, 단계별 머터리얼 배열을 생성·보관하고 시작 시각과 활성 상태를 저장한다. opacity < 1인 머터리얼만 transparent를 켠다.
            프레임 실행 함수는 경과 시간이 initTime보다 크면 중단하고 종료한다.
            선택한 위치와 FLOW 타입·첫 머터리얼·radius·radius×mass·ID로 현재 generateObject를 호출하며 완료를 기다리지 않는다. 목록에 등록하고 ID를 반환한다.

    removeSimulation(simulationId: string) -> boolean
        의존:
            UAnaly — 장면; 속성 읽기: {_scene}
            Object3D — 입자 분리; 함수: {remove()}
            UTaskProcessor — 워커 입자 제거; 함수: {scheduleTask()}
            UWorkerParameter — 워커 요청; 생성자: {new UWorkerParameter()}
            Material, BufferGeometry — 공유 자원 해제; 함수: {dispose()}
        동작:
            ID가 목록에 없으면 false를 반환한다. 있으면 시뮬레이션부터 삭제하고 같은 ID 입자를 장면·입자 목록에서 제거한다.
            제거 id가 있고 _worker가 있으면 removeObject를 요청하며 완료를 기다리지 않는다.
            해당 머터리얼이 truthy이면 Array는 각 원소, 나머지는 단일 자원을 해제하고 머터리얼 목록에서 ID를 삭제한다.
            지오메트리가 truthy이면 해제하지만 지오메트리 Map의 항목은 남긴다. true를 반환하며 동기 예외는 전파한다. [확인 Q-009]

    stopSimulation(simulationId: string) -> boolean
        동작: ID가 없으면 false를 반환한다. 있으면 기존 시뮬레이션의 active를 false로 설정하고 true를 반환한다.

    startSimulation(simulationId: string) -> boolean
        의존: Web API(performance) — 시작 시각 재설정; 함수: {now()}
        동작: ID가 없으면 false를 반환한다. 있으면 기존 시뮬레이션의 startTime을 현재 시각으로 바꾸고 active를 true로 설정하여 true를 반환한다.

    getSimulation(simulationId: string) -> UPhysicalFlowSimulation | undefined
        동작: ID에 해당하는 원본 시뮬레이션 객체 또는 undefined를 반환한다. 반환 객체의 외부 변경은 후속 프레임에 반영된다.

    #mouseMove(e: MouseEvent) -> void
        의존:
            UAnaly — 활성·앱 연결; 함수: {isActive()}; 속성 읽기: {_app}
            U3dMouseEvent — 입력 정규화; 정적 함수: {computeNormalize()}
            U3dApp — 교차 조회·측정 레이어; 함수: {intersectInFrustum()}; 속성 읽기: {_measureLayer}
            UMeasureLayer — 마지막 점 갱신; 함수: {updateLastPosition()}
        동작: 비활성이거나 _setMouseMove가 falsy이면 종료한다. 마우스 정규 좌표로 화면 교차를 조회하고 첫 교차점이 있으면 측정 레이어의 마지막 위치를 변경한다.

    #drawAreaClick(promise: DeferredPromise<UMeasureFeature>, e: U3dMouseEvent) -> void
        의존:
            UAnaly — 지형 교차와 실행 인자; 함수: {intersectTerrain()}; 속성 읽기: {_drawArg}
            UDrawArg — 좌표 변환·측정점 추가; 함수: {getWorldToGeographic(), addMeasurePoint()}
            __GInfo__ — 위치 누락 진단; 함수: {__GInfo__()}
        동작: promise는 사용하지 않는다. 교차점이 없으면 5233069를 기록하고 종료한다. 지리 좌표로 바꾼 측정점을 추가하고 _setMouseMove가 falsy이면 같은 점을 한 번 더 추가한 뒤 이동 입력을 true로 설정한다.

    #drawAreaDblClick(promise: DeferredPromise<UMeasureFeature>) -> void
        동작:
            현재 요청의 입력 Promise가 아니면 종료한다. 이동 입력을 false로 만들고 측정을 끝낸다.
            확정 피처가 없으면 영역 누락 Error로, 있으면 그 피처로 입력 Promise를 종결한다. 동기 예외도 해당 Promise의 거절로 전달한다.

    #commitFeature() -> UMeasureFeature | undefined
        의존:
            UAnaly — 앱; 속성 읽기: {_app}
            U3dApp — 측정 확정·분리; 함수: {commitMeasurePoint(), removeMeasureFeature()}
        동작: 측정 입력을 확정하고 결과가 falsy이면 undefined를 반환한다. 아니면 앱에서 피처를 분리한 뒤 동일한 피처를 반환한다.

    #createExtendFeature(feature: UMeasureFeature | undefined) -> UMeasureFeature | undefined
        의존:
            UAnaly — 앱·실행 인자; 속성 읽기: {_app, _drawArg}
            UMeasureFeature — 입력 범위; 속성 읽기: {_extent}
            U3dApp — 지리 좌표 변환·측정 확정; 함수: {getGoogleToGeographic(), commitMeasurePoint()}
            UDrawArg — 측정점 추가; 함수: {addMeasurePoint()}
        동작: feature·_extent 중 하나라도 falsy이면 undefined를 반환한다. 범위의 최소·최소, 최소·최대, 최대·최대, 최대·최소 네 꼭짓점을 지리 좌표로 변환하여 순서대로 측정점에 추가하고 확정 피처를 반환한다.

    #createTargetBox(feature: UMeasureFeature | undefined) -> Box3 | undefined
        의존:
            UAnaly — 실행 인자; 속성 읽기: {_drawArg}
            UMeasureFeature — 입력 범위; 속성 읽기: {_extent}
            UDrawArg — 월드 변환; 함수: {getGoogleToWorld()}
            THREE.Box3 — 영역 생성; 생성자: {new Box3()}
        동작: feature·_extent 중 하나라도 falsy이면 undefined를 반환한다. 범위의 최소·최대 좌표를 월드 좌표로 변환하여 새 박스로 반환한다.

UPhysicalFlowSimulation 부분 타입 명세
    이 명세에서 사용하는 필드:
        active: boolean
            프레임 실행 여부다.
        startTime: number
            시작·재개 시각이며 유수의 제한 시간 비교 기준이다.
        fnc: (delta?: number) -> void
            simulation을 this로 호출하는 프레임 함수다.
        amount, initTime, radius, mass, resolution, generateRatio, generateAmount: number | undefined
        initHeight, width, height, opacity: number | undefined
        color: ColorLike | undefined
        center: WorldPositionVector3 | undefined
        positions: Array<{x: number, y: number, z: number}> | undefined
        steps: Array<{color: ColorLike, opacity: number, max?: number}> | undefined
            프레임 함수와 속도별 표시 계산은 현재 객체·배열 값을 읽는다.

UAnalyPhysicalFlowCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
            분석 이름이며 undefined이면 'PhysicalFlow'다.
        resolution, gravity, maxParticleNum, limitMinHeight, limitTime: number | undefined
            호환 입력이며 생성자에서는 적용하지 않는다.

UAnalyPhysicalFlowOptions 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
            적용하지 않는다.
        resolution, gravity, maxParticleNum, limitMinHeight, limitTime: number | undefined
            falsy 기본값과 워커 원본 전달은 setOption()에 따른다.

UAnalyPhysicalFlowInfo 부분 타입 명세
    이 명세에서 사용하는 필드:
        box: Box3 | undefined
        center: WorldPositionVector3
            분석 상태 원본 참조다.
        width, height, minHeight, maxHeight: number | undefined

UAnalyPhysicalFlowHeightData 부분 타입 명세
    이 명세에서 사용하는 필드:
        data: Float32Array
        min, max: number
            선언상 고도 극값이며 빈 결과와의 차이는 Q-008에 연결한다.

UAnalyPhysicalFlowRainOptions 부분 타입 명세
    이 명세에서 사용하는 필드:
        amount, initHeight, radius, mass, opacity: number | undefined
        color: ColorLike | undefined
            강우의 생성 수·높이·공유 자원·질량 계수를 지정한다.

UAnalyPhysicalFlowFlowOptions 부분 타입 명세
    이 명세에서 사용하는 필드:
        amount, initTime, radius, mass, resolution, generateRatio, generateAmount: number | undefined
        steps: Array<{color: ColorLike, opacity: number, max?: number}> | undefined
            생성 후보와 속도별 표시를 지정하며 원본 steps 배열을 공유한다.

UAnalyPhysicalFlowGenerateOptions 부분 타입 명세
    이 명세에서 사용하는 필드:
        type?: number
        geometry: BufferGeometry | Array<BufferGeometry> | undefined
        material: Material | Array<Material> | undefined
        position: Vector3Like | Array<Vector3Like> | undefined
        radius, mass: number | Array<number> | CheckFloat16Array | undefined
        simulationId: string | Array<string> | undefined
            단일·입자별 입력 선택과 원본 배열 변환은 generateObject()에 따른다.

UAnalyPhysicalFlowHeightContext 부분 타입 명세
    이 명세에서 사용하는 필드:
        _modelBoxList: Array<Box3>
            각 고도 조회 뒤 현재 장애물 목록을 읽는 계약이다.

UAnalyPhysicalFlowUpdateContext 부분 타입 명세
    이 명세에서 사용하는 필드:
        _flowObject: Map<number, Mesh>
        _materials: Map<string, Material | Array<Material>>
        getSimulation: UAnalyPhysicalFlowSimulationLookup
            context를 this로 호출하여 현재 상태를 조회한다.

UAnalyPhysicalFlowFlowContext 부분 타입 명세
    이 명세에서 사용하는 필드:
        _flowBox: Box3 | undefined
            후보 좌표마다 현재 박스를 읽는 계약이다.

UAnalyPhysicalFlowUpdateActions 부분 타입 명세
    이 명세에서 사용하는 필드:
        newFlowPosition: Array<Vector3Like>
        newFlowGeometry: Array<BufferGeometry>
        newFlowMaterial: Array<Material>
        newFlowMass, newFlowRadius, noMeshId: Array<number>
        newFlowSimulId: Array<string>
            공개 제어부가 계산 후 요청·삭제를 순서대로 수행할 배열이다.

UAnalyPhysicalFlowRainState 부분 타입 명세
    이 명세에서 사용하는 필드:
        amount, width, height, initHeight, radius: number
        center: WorldPositionVector3
            난수 생성 시 매번 현재 값을 읽는다.

UAnalyPhysicalFlowFlowState 부분 타입 명세
    이 명세에서 사용하는 필드:
        amount, resolution: number
        positions: Array<Vector3Like>
            구성 단계에서 배열을 교체하고 선택 단계에서 원본 위치를 공유한다.

UAnalyPhysicalFlowSimulationLookup 함수 타입 정의
    (simulationId: string) -> UPhysicalFlowSimulation | undefined
    인터페이스: 현재 문맥을 this로 호출하여 ID별 원본 상태 또는 undefined를 반환한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
