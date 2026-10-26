# UAnalyParticle 명세

> 상태: 구현 관찰 초안

## 1. 개요

파티클 엔진의 생성·활성화·프레임 갱신과 모델 기반 마스크 생성을 연결하는 분석 클래스다. 기본 확산, 바람, 격자 확산 모드를 선택하고 앱의 파티클 목록을 공유한다.

- 책임 범위: 생성 옵션 보관, 이름·인덱스 기반 제어, 카메라 추적에 따른 재생성, 마스크 타일 수집·값 생성과 취소 복원.
- 주요 동작 방식: 활성 분석은 보이는 실행 중 파티클을 갱신한다. 모델 강제 로딩 이벤트로 마스크 타일을 수집하고 값 생성까지 기다린 뒤 완료를 통지한다.
- 주요 사용처와 연계 대상: U3dApp의 파티클 분석 갱신, UParticleEngine, U3dMaskLayer 및 모델 쿼드트리.

## 3. 정규 자연어 수도코드

```spec
UAnalyParticle extends UAnaly 클래스 정의
    의존: UAnaly — 분석 기반 기능; 상속: {UAnaly}

    static OPT_KEYS: Array<string> = 부모 OPT_KEYS와 'name'
        의존: UAnaly — 부모 옵션 키; 속성 읽기: {OPT_KEYS}
        생성자에서 정규화할 정본 옵션 키 목록이다.
    name: string = 'Particle'
        분석 이름이며 외부에서 변경할 수 있다.
    BASE_TYPE: string = 'base'
    WIND_TYPE: string = 'wind'
    GRID_TYPE: string = 'grid'
        생성 모드 비교에 사용하는 변경 가능한 문자열이다.
    grid: Array<unknown> = 빈 배열
    resultGrid: Array<unknown> = 빈 배열
    position: Vector3 | undefined = undefined
        격자 확산 연계 상태이며 clear()가 새 배열과 undefined로 초기화한다.
    _clock: UClock
    _options: Array<UAnalyParticleCO> = 빈 배열
        initialize()에 전달한 옵션 원본을 순서대로 보관한다.
    _particles: Array<UParticleEngine> = 빈 배열
        setApp() 시 앱 목록을 참조하지만 앱 목록 교체 시 자동 재연결하지 않는다.
    _maskLayer: U3dMaskLayer | undefined = undefined
    _extentBox: Box3 | undefined = undefined
    _helperGroup: Group | undefined = undefined
    _clickId: string | undefined = undefined

    constructor(opt?: UAnalyParticleCO)
        의존:
            UAnaly — 기반 초기화; 생성자: {new UAnaly()}
            UClock — 시간차 측정; 생성자: {new UClock()}
            defaultValue — undefined 기본값; 함수: {defaultValue()}
            normalizeOptionKeys — 생성 옵션 키 호환; 함수: {normalizeOptionKeys()}
        동작:
            인수 없이 부모를 초기화한다.
            opt가 falsy이면 빈 객체를 사용하고 실제 생성 클래스의 OPT_KEYS로 옵션 키를 정규화한다.
            정규화는 필요한 경우에만 복사하며 정본 입력은 원본 참조를 사용하고 opt.type이 undefined이면 그 객체에 'base'를 쓴다.
            opt.name이 undefined이면 'Particle'을 이름으로 사용하며 모드 문자열과 시계·빈 목록·미설정 참조를 초기화한다.

    setExtentBox(box: Box3) -> void
        동작: box 원본 참조를 _extentBox에 보관한다.

    override setApp(app: U3dApp) -> void
        의존:
            UAnaly — 앱 연결; 함수: {setApp()}
            U3dApp(app) — 파티클 공유; 속성 읽기: {_particles}
        동작: 부모 setApp()을 호출한 뒤 app._particles 원본 배열을 _particles에 보관한다.

    getExtentBox() -> Box3 | undefined
        동작: _extentBox 원본 참조를 반환한다.

    initialize(opt: UAnalyParticleCO) -> UParticleEngine | undefined
        인터페이스: base는 기본 확산이며 wind는 windData, grid는 data와 setGESpreadObject 확장이 필요하다.
        의존:
            UAnaly — 앱 연결; 속성 읽기: {_app}
            defined — null·undefined 판정; 함수: {defined()}
            defaultValue — undefined 기본값; 함수: {defaultValue()}
            UParticleEngine — 엔진 생성·구성; 생성자: {new UParticleEngine()}; 함수: {setValues(), initialize(), setWindValues(), initializeWind(), setDynamicParameter(), setOriginExtentBox(), getExtentsBoxByPosition(), setExtentBox()}; 속성 읽기: {setEffect, setDynamic}; 속성 쓰기: {name}
            U3dApp — 엔진 등록·검색 이벤트; 함수: {on()}; 속성 읽기: {_particles}
            U3dEvent — 검색 이벤트; 상수: {APP.SEARCHED}
            StringAddon — 대소문자 무시 비교; 함수: {equalIgnoreCase()}
            __GInfo__ — 생성 불가 알림; 함수: {__GInfo__()}
        동작:
            opt가 null·undefined이면 2481742 로그를 남기고 undefined를 반환하며 _app이 falsy이면 바로 undefined를 반환한다.
            _options에 opt 원본을 먼저 추가하고 opt.type이 undefined이면 현재 BASE_TYPE을 선택한 뒤 엔진을 생성한다.
            BASE_TYPE과 대소문자를 무시하여 같으면 옵션을 설정하고 기본 엔진을 초기화하여 이름을 쓰고 앱 목록에 추가한 뒤 반환한다.
            그렇지 않고 WIND_TYPE과 같으면:
                windData의 null·undefined 여부를 검사하며 없으면 2482431 로그 후 undefined를 반환한다.
                segments가 undefined이면 5, height가 undefined이면 10을 적용하고 extents·windData와 옵션으로 바람 엔진을 구성한다.
                initializeWind() 결과에 이름을 쓰고 앱 목록에 먼저 추가한다.
                _app이 truthy이고 setEffect가 truthy이면 검색 시 카메라 변경을 알리는 함수를 등록한다.
                setDynamic이 truthy이면 옵션을 동적 설정하고 extents가 truthy일 때 원본 범위를 설정한 뒤 위치 기준 범위를 구한다.
                _app이 truthy인 이 wind 경로에서 현재 범위 박스를 조회하고 박스가 truthy이면 엔진에 전달한 뒤 엔진을 반환한다.
            그렇지 않고 GRID_TYPE과 같으면 data가 null·undefined일 때 1625552 로그 후 undefined를 반환한다.
                setGESpreadObject가 null·undefined이면 0475368 로그 후 undefined를 반환한다.
                확장을 이 분석 객체를 this로 하여 engine·opt로 호출하고 결과를 앱 목록에 추가하여 반환한다.
            어떤 모드도 아니면 옵션 보관과 엔진 생성은 남고 undefined를 반환한다.

    #changingEvent() -> void
        의존:
            UAnaly — 연결 상태; 속성 읽기: {_app}
            U3dApp — 지도 변경 통지; 속성 읽기: {_mapControl}; 속성 쓰기: {_mapControl._isChanging}
        동작: _app이 truthy이면 현재 앱의 지도 컨트롤 _isChanging을 true로 설정한다.

    override active() -> void
        의존:
            UAnaly — 활성 상태·앱 연결; 함수: {active()}; 속성 읽기: {_app}
            U3dApp — 파티클 목록; 속성 읽기: {_particles}
            UParticleEngine — 표시 유지; 함수: {isShow(), show()}
        동작:
            부모 active()를 실행하고 앱이 없으면 종료한다.
            앱 목록의 truthy 항목마다 현재 isShow() 값을 show()에 전달한다.

    override update() -> void
        의존:
            UAnaly — 앱 연결; 속성 읽기: {_app}
            U3dApp — 작업 렌더 주기; 함수: {drawWork()}
            UClock — 시간차 조회; 함수: {getDelta()}
        동작:
            앱이 없으면 종료한다.
            drawWork(100)을 요청하고 시계의 시간차를 읽는다.
            _app이 truthy이고 시간차가 1을 초과하지 않은 경우 프레임 갱신에 전달한다.

    #update(dt: number) -> void
        의존:
            defined — 값 유무; 함수: {defined()}
            UAnaly — 활성·연결 상태; 속성 읽기: {_isActive, _app}
            U3dApp — 엔진 목록·카메라·렌더 요청; 속성 읽기: {_particles}; 함수: {getCameraPosition(), drawFast()}
            UParticleEngine — 갱신 조건과 실행; 함수: {update()}; 속성 읽기: {isStop, particleMesh.visible, speed, useTraceCamera, positionBase, name}
            Vector3 — 카메라 위치 대체값; 생성자: {new Vector3()}
            Yield — 작업권 양보; 함수: {Yield()}
        동작:
            _isActive가 falsy이거나 앱이 없으면 종료한다.
            앱 파티클 목록이 null·undefined이거나 비어 있으면 종료한다.
            _isActive와 _app이 truthy이고 목록이 정의된 비어 있지 않은 배열인 경우:
                목록을 async callback의 forEach로 순회하며 callback 완료를 기다리지 않는다.
                    p.isStop이 falsy이고 particleMesh가 정의되어 있으며 visible이 truthy인 경우:
                        speed를 읽고 _maskLayer가 정의되어 있으면 마스크 적용 완료 후 dt × speed로 갱신하는 후속 작업을 등록한다.
                        _maskLayer가 정의되어 있지 않으면 dt × speed로 즉시 갱신한다.
                            p.useTraceCamera가 truthy이면:
                                현재 카메라 위치를 읽으며 앱이 없어졌으면 영벡터를 사용한다.
                        해당 엔진에 대해 Yield()를 기다리지만 바깥 순회·재생성·drawFast()는 그 완료를 기다리지 않는다.
                재생성 목록에서 particle.name이 truthy인 경우:
                    같은 이름의 첫 옵션 원본을 찾아 position에 현재 카메라 위치 또는 undefined를 쓴다.
                    옵션을 다시 초기화하여 새 엔진을 먼저 추가한 뒤 이름에 해당하는 첫 엔진을 제거한다.
            현재 앱이 있으면 drawFast()를 요청하며 마스크 후속 갱신의 완료를 기다리지 않는다.

    #getOptionByName(name: string) -> UAnalyParticleCO | undefined
        의존:
            defined — 조회 결과 판정; 함수: {defined()}
            StringAddon — 이름 비교; 함수: {equalIgnoreCase()}
        동작: _options에서 name이 truthy이고 문자열 변환 후 대소문자 무시 비교가 같은 첫 옵션의 원본을 반환하며 없으면 undefined를 반환한다.

    #setMaskAtParticle(particle: UParticleEngine) -> Promise<void>
        동작:
    override deactive() -> void
        의존:
            UAnaly — 활성 해제; 함수: {deactive()}; 속성 읽기: {_isActive, _app}
            U3dApp — 렌더·이벤트 복원; 함수: {drawDefault(), unkey(), off()}; 속성 읽기: {_particles}
            UParticleEngine — 표시 해제; 함수: {show()}
            U3dEvent — 검색 이벤트; 상수: {APP.SEARCHED}
            defined — 클릭 등록 유무; 함수: {defined()}
        동작:
            _isActive가 falsy이면 종료한다.
            부모 deactive()를 호출하고 앱이 없으면 종료한다.
            기본 렌더 주기를 요청하고 _clickId가 정의되어 있으면 click 이벤트 키를 해제하고 undefined로 비운다.
            _isActive와 _app이 truthy이면 모든 엔진에 show(false)를 호출하고 동일한 검색 callback을 해제한다.
            _isActive와 _app이 truthy이면 내부 정리를 실행한다.

    getParticleByName(name?: string | undefined) -> UParticleEngine | undefined
        의존:
            UAnaly — 앱 연결; 속성 읽기: {_app}
            defined — 입력·목록 유무; 함수: {defined()}
            U3dApp — 파티클 조회; 속성 읽기: {_particles}
            UParticleEngine — 이름; 속성 읽기: {name}
            StringAddon — 이름 비교; 함수: {equalIgnoreCase()}
        동작:
            name이 null·undefined·빈 문자열이거나 앱이 없거나 앱 파티클 목록이 null·undefined·빈 배열이면 undefined를 반환한다.
            엔진 name이 truthy이고 문자열 변환 후 대소문자 무시 비교가 같은 첫 엔진의 원본을 반환하며 없으면 undefined를 반환한다.

    removeParticleByName(name: string, _suppress?: boolean) -> void
        인터페이스: _suppress는 현재 실행에 사용하지 않는다.
        의존:
            UAnaly — 앱 연결; 속성 읽기: {_app}
            defined — 입력·조회 유무; 함수: {defined()}
            U3dApp — 목록 제거; 속성 읽기: {_particles}
            UParticleEngine — 엔진 해제; 함수: {destroy()}; 속성 읽기: {_scene}; 속성 쓰기: {setEffect}
        동작:
            name이 null·undefined·빈 문자열이거나 앱이 없으면 종료한다.
            _app이 truthy인 유효 이름 경로에서 엔진을 조회하고 정의된 경우 앱 목록에서 다시 인덱스를 찾는다.
            인덱스가 -1보다 크면 엔진의 _scene을 인수로 destroy()를 실행하고 setEffect를 false로 쓴 뒤 목록에서 한 항목을 제거한다.

    removeAllParticle() -> void
        의존:
            UAnaly — 앱·장면 연결; 속성 읽기: {_app, _scene}
            defined — 목록 유무; 함수: {defined()}
            U3dApp — 목록 교체; 속성 읽기·쓰기: {_particles}
            UParticleEngine — 엔진 해제; 함수: {destroy()}; 속성 읽기: {_scene}; 속성 쓰기: {setEffect}
            UDEF — 헬퍼 자원 해제; 함수: {disposeObject3D()}
            UScene — 헬퍼 분리; 함수: {remove()}
        동작:
            앱이 없으면 종료한다.
            앱 목록이 정의되어 있으면 각 엔진의 _scene을 인수로 destroy()를 호출하고 setEffect를 false로 쓴 뒤 앱 목록을 새 빈 배열로 교체한다.
            _helperGroup이 truthy이면 자원을 해제하고 분석 장면에서 제거한 뒤 참조를 undefined로 비운다.

    override clear() -> void
        의존:
            UAnaly — 앱 연결; 속성 읽기: {_app}
            U3dApp — 갱신 시각 반영; 함수: {setUpdateDate()}
        동작:
            grid·resultGrid를 각각 새 빈 배열로 교체하고 position을 undefined로 비운다.
            파티클·헬퍼 정리를 수행하고 현재 앱이 있으면 갱신 시각을 한 번 더 반영한다.

    #clear() -> void
        의존:
            UAnaly — 앱·장면 연결; 속성 읽기: {_app, _scene}
            U3dApp — 목록·갱신 시각; 속성 읽기·쓰기: {_particles}; 함수: {setUpdateDate()}
            UParticleEngine — 엔진 해제; 함수: {destroy()}
            UDEF — 헬퍼 자원 해제; 함수: {disposeObject3D()}
            UScene — 헬퍼 분리; 함수: {remove()}
        동작:
            앱이 없으면 종료한다.
            모든 엔진의 destroy()를 인수 없이 호출하고 앱 목록을 새 빈 배열로 교체한 뒤 갱신 시각을 반영한다.
            _helperGroup이 truthy이면 visible을 false로 쓰고 자원을 해제하며 장면에서 제거한 뒤 참조를 undefined로 비운다.

    createMask(opt: UAnalyParticleMaskOption) -> Promise<void>
        인터페이스: 반환은 마스크 값 생성의 완료·거절을 통지하며 강제 로딩을 사용하지 않으면 레이어 준비 뒤 즉시 완료된다.
        의존:
            UAnaly — 앱·기본 렌더 인자·로그 식별; 속성 읽기: {_app, _drawArg, _classtype}
            deferredPromise — 외부 완료 제어; 함수: {deferredPromise()}
            defaultValue — undefined 기본값; 함수: {defaultValue()}
            UDEF — 이벤트 이름·타일 종류; 함수: {createUUID()}; 상수: {TILE_TYPE.MODEL}
            U3dMaskLayer — 레이어 생성·마스크 값 구축; 생성자: {new U3dMaskLayer()}; 함수: {createMaskValue()}
            U3dApp — 레이어·모델 로딩; 함수: {isDisposed(), isStopUpdate(), getLayerByName(), addLayer(), showLayer(), setMaxQuadTreeLevel(), forceLoadModel()}; 속성 읽기: {_quadtreeSet, _quadTreeChanging, _mapRegionApplying}; 속성 읽기·쓰기: {_modelMaxLevel}
            U3dQuadSet — 모델 루트·이벤트; 함수: {hasQuadTree(), getQuadTrees(), on(), off()}
            U3dQuadModelTile — 루트 취소·해제 상태; 함수: {on(), off()}; 속성 읽기: {_disposed}
            U3dEvent — 타일 이벤트; 상수: {TILE.DISPOSE, TILE.FORCE_MODEL_LOADED}
            Web API — 취소 신호; 생성자: {new AbortController()}; 함수: {abort()}
            __GInfo__ — 값 생성 실패 알림; 함수: {__GInfo__()}
            U3dMessage — 실패 문구; 상수: {CNT.MASK.ERROR_ADD_MASK_2}
        동작:
            완료 제어 객체와 고유 이벤트 이름을 생성한다.
            opt 원본의 level·infoLayer·extent·drawarg·visible에 undefined 기본값 17·undefined·빈 배열·현재 _drawArg·true를 쓰며 원본 이름을 사용한다.
            opt가 null·undefined이면 원본 속성 접근에서 동기 예외가 발생한다.
            앱이 없으면 완료되지 않은 객체를 반환한다. [확인 Q-003]
            모델 트리가 없거나 앱이 해제 중·트리 변경 중·영역 적용 중이거나 useForceLoad가 false가 아닌 상태에서 갱신이 중지되어 있으면 Error로 거절한다.
            현재 모델 루트와 원래 모델 상한을 포착하고 취소 컨트롤러·일회 정리를 준비한다.
            정리는 이미 cleaned이면 무동작이고 아니면 cleaned를 true로 바꾸고 취소 신호를 발생시킨 뒤 포착 루트의 DISPOSE callback·트리의 수집 이벤트를 해제하며 원래 모델 상한을 undefined까지 복원한다.
            완료·실패는 먼저 정리를 실행한 뒤 값 없이 이행하거나 원래 원인으로 거절하며 취소는 타일 트리 변경 Error로 실패시킨다.
            루트 DISPOSE에 취소 함수를 등록한다. 완료·실패 함수가 직접 정리하며 별도 finally 체인을 만들지 않는다. showLayer의 비동기 실패도 실패 함수로 전달한다.
            이후 동기 예외는 정리한 뒤 실패로 전달한다.
            같은 이름의 레이어가 없으면 생성하여 _maskLayer에 먼저 저장하고 앱에 추가한다.
            이미 있으면 같은 이름으로 다시 조회하여 _maskLayer에 저장하며 이 참조를 후속 작업이 포착한다.
            visible이 truthy이면 레이어를 표시하고 정리가 이미 실행되었으면 반환한다.
            opt.useForceLoad가 undefined이면 true를 사용한다.
            _app이 truthy이며 정리가 아직 실행되지 않은 상태에서 useForceLoad가 truthy이면 forceLoadVisible의 undefined 기본값 true와 modelExtents를 읽는다.
                _app이 truthy인 강제 로딩 경로에서 반환한 박스를 보관한다.
                현재 앱 쿼드셋의 모델 강제 로딩 이벤트에 수집 함수를 이름으로 등록한다.
                    정리 완료·트리 변경 중·포착 루트 중 해제된 항목 존재·타일 없음이면 무시한다.
                모델 최대 레벨 설정이 실패하면 RangeError를 발생시킨다.
                정렬 범위로 forceLoadModel()을 호출하고 결과가 falsy이면 Error를 발생시킨다.
                강제 로딩 거절은 실패 함수로 전달한다.
                강제 로딩 이행 시 정리 완료이면 무시하고 앱·포착 루트가 해제되었으면 취소한다.
                수집 키마다 createMaskValue(key, signal)를 Promise로 예약하고 모두 관찰한 뒤 실행한다. 값 생성 전체와 레이어 표시 요청을 함께 기다린다.
                값 생성 호출의 동기 예외와 반환 Promise의 거절을 같은 실패 경로로 전달한다.
                전체 이행 뒤 정리 완료이면 무시하고 해제 상태이면 취소하며 그 외에는 완료한다.
                값 생성 거절은 1268050 로그 후 실패로 전달한다.
            useForceLoad가 falsy이면 레이어 표시 요청의 완료·실패를 기다려 완료·실패 함수로 전달한다.
            완료 제어 객체를 반환한다.

    setMaskLayer(layer: U3dMaskLayer) -> void
        동작: _maskLayer에 layer 원본을 보관한다.

    getMaskLayer() -> U3dMaskLayer | undefined
        의존: defined — 레이어 유무; 함수: {defined()}
        동작: _maskLayer가 정의되어 있으면 원본을 반환하고 아니면 undefined를 반환한다.

    setStart(name?: string | undefined, idx?: number) -> void
        의존:
            UAnaly — 앱 연결; 속성 읽기: {_app}
            U3dApp — 인덱스 대체 조회; 속성 읽기: {_particles}
            UParticleEngine — 실행 시작; 함수: {setStart()}
        동작:
            name·idx가 모두 undefined이거나 앱이 없으면 종료한다.
            _app이 truthy이고 인수가 적어도 하나 지정된 경우 이름 조회 결과가 truthy이면 사용하고 아니면 앱 목록의 idx 항목을 사용한다.
            대상이 truthy이면 setStart()를 호출한다.

    setStop(name?: string | undefined, idx?: number) -> void
        의존:
            UAnaly — 앱 연결; 속성 읽기: {_app}
            U3dApp — 인덱스 대체 조회; 속성 읽기: {_particles}
            UParticleEngine — 실행 정지; 함수: {setStop()}
        동작:
            name·idx가 모두 undefined이거나 앱이 없으면 종료한다.
            _app이 truthy이고 인수가 적어도 하나 지정된 경우 이름 조회 결과가 truthy이면 사용하고 아니면 앱 목록의 idx 항목을 사용한다.
            대상이 truthy이면 setStop()를 호출한다.

UAnalyParticleCO extends UAnalyCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        type?: string
            undefined이면 생성자에서는 'base', initialize()에서는 현재 BASE_TYPE을 사용한다.
        name?: string
            생성자 분석 이름 또는 initialize() 엔진 이름으로 사용한다.
        position?: Vector3
            재생성 시 원본 옵션에 현재 카메라 위치를 쓴다.
        positionSpread?: Vector3
        velocityBase?: Vector3
        velocitySpread?: Vector3
        acceleration?: Vector3
        colorBase?: Vector3
        colorSpread?: Vector3
        angleBase?: number
        angleSpread?: number
        angleVelocityBase?: number
        angleVelocitySpread?: number
        particleImage?: string
        particlesPerSecond?: number
        particleDeathAge?: number
        emitterDeathAge?: number
        opacityBase?: number
        opacitySpread?: number
        opacityTween?: [Array<number>, Array<number>]
        colorTween?: [Array<number>, Array<number>]
        sizeBase?: number
        sizeSpread?: number
        sizeTween?: [Array<number>, Array<number>]
        legend?: function(): void
            생성 위치·속도·색상·회전·생명·보간·범례 설정을 엔진에 원본 옵션 그대로 전달한다.
        windData?: object
        segments?: number
        extents?: Double_Array<number>
        height?: number
            wind 생성에 사용하며 segments·height의 undefined 기본값은 각각 5·10이다.
        data?: Array<object>
            grid 확장 호출 전 존재 여부를 검사한다.
        gridMode?: string
        gridBoxMaxHeight?: number
        arrowLength?: number
            격자 확장에 모드·높이·헬퍼 길이를 원본 옵션으로 전달한다.
        speed?: number
        useTraceCamera?: boolean
        setEffect?: boolean
        setDynamic?: boolean
            엔진에 갱신 속도·기본 확산 카메라 추적·부가 효과·바람 동적 생성 설정을 전달한다.

UAnalyParticleMaskOption 부분 타입 명세
    이 명세에서 사용하는 필드:
        level?: number
        name?: string
        height?: number
        useForceLoad?: boolean
        forceLoadVisible?: boolean
        modelExtents?: UAnalyParticleModelExtents
        infoLayer?: object
        extent?: Array<number>
        drawarg?: UDrawArg
        visible?: boolean
            level·infoLayer·extent·drawarg·visible는 원본에 기본값을 보완하며 나머지는 마스크 레이어·강제 로딩에 전달한다.

UAnalyParticleEngine extends UParticleEngine 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string | undefined
        useTraceCamera?: boolean
        setDynamic?: boolean
        setDynamicParameter?: (options: UAnalyParticleCO) -> void
        setOriginExtentBox?: () -> void
        getExtentsBoxByPosition?: () -> void
        setMask?: (particle: object, mask: object) -> void
            엔진·확장 메서드는 해당 활성 분기에서 존재한다고 전제하고 호출한다.

UAnalyParticleModelExtents 부분 타입 명세
    이 명세에서 사용하는 필드:
        minx, miny, maxx, maxy: number
            강제 모델 로딩에 사용하는 두 경계이며 정렬 전 입력도 허용한다.

UAnalyParticleMaskBounds 부분 타입 명세
    이 명세에서 사용하는 필드:
        minx, miny, maxx, maxy: number
        box: Box3
            정렬한 좌표와 마스크 판정에 사용하는 박스다.

UAnalyParticleTarget 부분 타입 명세
    이 명세에서 사용하는 필드:
        position: Vector3 | undefined
        _setMask?: boolean
            위치가 없으면 건너뛰고 조회한 마스크가 없으면 _setMask를 false로 쓴다.

```

## 4. 공통 처리 기준과 제약

```spec
옵션·범위·마스크와 파티클 조회는 별도 복사 없이 원본 참조를 사용한다.
앱 파티클 목록의 교체는 _particles 별칭과 _options를 비우지 않으며 clear()도 _maskLayer·_extentBox·_options를 유지한다.
마스크 적용 후 엔진 갱신과 작업권 양보는 update()의 반환·drawFast()와 별도 비동기 완료 경계를 갖는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
