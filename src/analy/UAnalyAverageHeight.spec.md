# UAnalyAverageHeight 명세

> 상태: 구현 관찰 초안

## 1. 개요

UAnaly를 상속하여 U3dSelect의 선택 메시 또는 병합 메시의 선택된 구성 모델에 대한 높이와 평균을 조회한다.
U3dApp의 AverageHeight 분석으로 등록·활성화하며 선택 결과 이벤트와 저장한 모델 ID의 선택 복원을 제공한다.

## 3. 정규 자연어 수도코드

```spec
UAnalyAverageHeight extends UAnaly 클래스 정의
    의존: UAnaly — 앱 연결·활성 상태·분석 이벤트 기반; 상속: {UAnaly}

    name: string = 'AverageHeight'
        앱의 분석 등록·조회에 사용하는 이름이며 외부에서도 변경할 수 있다.
    override _poiGroup: UGroup = 새 UGroup
        생성자가 부모의 표출 그룹을 새 그룹으로 교체하며 활성화·해제 때 주석 장면에 연결한다.
    #selectType: string = 'single'
        다음 선택기 생성에 사용할 원래 입력 모드다.
    #selector: U3dSelect | undefined = undefined
        현재 분석이 소유한 선택기다.
    #loadedListeners: Record<string, Function> = 빈 객체
        아직 조회되지 않은 모델의 로딩 리스너를 모델 ID만으로 보관한다.
    #clickId: string | undefined = undefined
        선택기가 반환한 클릭 식별자이며 해제 후에도 값을 유지한다.
    #dblClickId: string | undefined = undefined
        영역 선택기의 더블클릭 식별자이며 다른 모드 생성 때도 기존 값을 유지한다.

    constructor(opt?: UAnalyAverageHeightCO)
        인터페이스: opt: 분석 이름과 선택 모드이며 생략 시 AverageHeight·single을 사용한다.
        의존:
            UAnaly — 기반 분석 초기화; 생성자: {super()}
            defaultValue — undefined 기본값; 함수: {defaultValue()}
            UGroup — 표출 그룹 생성; 생성자: {new UGroup()}
        동작:
            부모를 opt 없이 초기화하고 opt가 falsy이면 빈 객체로 대체한다.
            name·#selectType을 각각 opt.name·opt.mode로 설정하되 undefined만 AverageHeight·single로 대체한다. null·빈 문자열·false·0은 그대로 저장한다.
            #selector·#measureFeature·두 클릭 식별자를 undefined로, #loadedListeners를 빈 객체로, #pickList를 빈 배열로, #isMove·#endPoint를 false로 초기화한다. #measureFeature·#pickList·#isMove·#endPoint는 이후 이 클래스에서 읽지 않는 보관 상태다.
            _poiGroup을 새 UGroup으로 교체한다.
            상속 옵션 type은 부모에게 전달하지 않는다. [확인 Q-004]

    override active() -> void
        역할: 분석 선택기를 생성하고 앱의 평균 높이 모드와 주석 장면을 연결한다.
        의존:
            UAnaly — 활성 전환·앱 연결; 함수: {super.active.call()}; 속성 읽기: {_app}; 속성 쓰기: {_isActive}
            UDEF — 분석 앱 모드; 속성 읽기: {APP_MODE._AVERAGEHEIGHT}
            U3dApp — 앱 모드·주석 장면; 속성 쓰기: {_mode}; 속성 읽기: {_sceneComment}
            UScene — 표출 그룹 등록; 함수: {add()}
        동작:
            부모 활성화를 먼저 실행한다.
            #clickId 또는 #dblClickId가 undefined가 아니면 이 분석을 비활성화한다.
            _app이 falsy이면 종료한다.
            _app이 truthy인 경우 다음 연결을 수행한다.
                앱 모드를 _AVERAGEHEIGHT로 바꾼 뒤 #selectType으로 선택기를 연결한다.
                앱의 _sceneComment가 null·undefined가 아니면 _poiGroup을 추가한다.
                _sceneComment의 유무와 관계없이 _isActive를 true로 한다.

    override deactive() -> void
        의존:
            UAnaly — 비활성 전환·분석 이벤트 해제; 함수: {super.deactive.call()}; 속성 읽기: {_isActive, _app}
            defined — 선택기 유무; 함수: {defined()}
            U3dSelect — 선택기 해제; 함수: {remove()}
            UGroup — 그룹 자식 정리; 함수: {clear()}
            U3dApp — 주석 장면; 속성 읽기: {_sceneComment}
            UScene — 표출 그룹 분리; 함수: {remove()}
        동작:
            _isActive가 falsy이면 종료하고 다음으로 _app이 falsy이면 종료한다.
            부모 비활성화를 실행한 뒤 #selector가 null·undefined가 아니면 remove()를 실행하고 참조를 undefined로 한다.
            _poiGroup의 자식을 비우고 앱의 _sceneComment가 null·undefined가 아니면 그룹을 분리한다.
            두 클릭 식별자와 로딩 리스너 보관 객체는 초기화하지 않는다. [확인 Q-007]
            중간 예외는 전파하며 이미 완료한 상태 변경을 되돌리지 않는다.

    override clear() -> void
        의존:
            UAnaly — 실행 인자; 속성 읽기: {_drawArg}
            defined — 선택기 유무; 함수: {defined()}
            U3dSelect — 선택 정리; 함수: {clear()}
            UDrawArg — 갱신 일시 표시; 함수: {setUpdateDate()}
        동작:
            _drawArg가 falsy이면 종료한다.
            #selector가 null·undefined가 아니면 선택기를 비운다.
            선택기의 유무와 관계없이 _drawArg의 갱신 일시를 설정한다.
            부모 clear()는 호출하지 않고 선택기 참조·로딩 리스너 보관 객체·활성 상태는 유지한다.

    override isActive() -> boolean
        의존: UAnaly — 활성 상태; 속성 읽기: {_isActive}
        동작: _isActive를 반환한다.

    getSelector() -> U3dSelect | undefined
        인터페이스: 반환: 현재 분석 소유 선택기의 원본 참조이며 생성 전이나 해제 후에는 undefined다.
        동작: #selector를 반환한다.

    setSelectType(type: string) -> void
        인터페이스: type: single은 점 선택, polygon은 영역 선택이며 그 밖의 값도 선택기에 그대로 전달한다.
        의존:
            defined — 선택기 유무; 함수: {defined()}
            U3dSelect — 선택 모드 설정; 함수: {setMode()}
        동작:
            입력 type을 먼저 #selectType에 저장한다.
            #selector가 null·undefined가 아니면 single을 point로, polygon을 area로 변환한 값을 setMode()에 전달한다. 저장한 #selectType은 변환하지 않는다.

    getSelectedModelHeight(key: string) -> Array<{id: string, height: number}> | undefined
        인터페이스: key: 선택기의 객체 식별 키다. 반환: 일반 메시 한 건 또는 병합 메시의 선택된 구성 모델별 ID·높이 목록이다.
        의존:
            U3dSelect — 선택 메시 조회; 함수: {getSelectedAsKey()}
            UMesh — 일반·병합 메시 판정과 ID; 속성 읽기: {material, _isMerged, userData.id}; 함수: {getUid()}
            U3DTilesMesh — 타일 메시 판정과 ID; 속성 읽기: {userData.id}; 함수: {getUid()}
        동작:
            #selector가 falsy이면 undefined를 반환한다.
            #selector가 truthy인 경우 다음 높이 조회를 진행한다.
                key로 조회한 대상이 falsy이거나 UMesh·U3DTilesMesh가 아니면 undefined를 반환한다.
                UMesh이면서 재질이 배열이고 _isMerged가 truthy이면 병합 높이 목록을 그대로 반환한다.
                나머지 대상은 getModelHeight() 결과와 userData.id를 담은 새 한 원소 배열을 반환하며 ID가 null·undefined일 때만 getUid()로 대체한다.
                U3DTilesMesh는 _isMerged가 truthy여도 일반 메시 경로를 따른다.

    getAverageHeight(u3dSelect?: U3dSelect) -> number | undefined
        인터페이스: u3dSelect: 생략하면 내부 선택기를 사용하며 내부 선택기가 생성된 경우에만 외부 선택 목록을 사용할 수 있다.
        의존:
            defined — 선택기 유무; 함수: {defined()}
            console — 미활성 안내; 함수: {error()}
            U3dSelect — 선택 모델 목록; 함수: {getSelected()}
        동작:
            내부 #selector가 falsy이면 외부 선택기를 전달해도 undefined로 종료한다. [확인 Q-001]
            #selector가 truthy인 경우 다음 평균 계산을 진행한다.
                그 다음 내부·외부 선택기가 모두 null·undefined이면 UAnalyAverageHeight is not active를 console.error로 출력하고 0을 반환하는 분기가 있지만 앞선 내부 선택기 검사 때문에 통상 도달하지 않는다.
                외부 선택기와 그 getSelected 멤버가 null·undefined가 아니면 외부 getSelected()를, 아니면 내부 getSelected()를 호출한다. 멤버가 함수인지는 검사하지 않는다.
    getModelHeight(model: UMesh | U3DTilesMesh) -> number
        인터페이스: model: 높이를 구할 메시다. 반환: 월드 축 정렬 경계의 Z축 길이이며 지형 높이를 차감하지 않는다.
        의존: THREE.Box3 — 메시 전체 경계; 생성자: {new THREE.Box3()}; 함수: {setFromObject()}; 속성 읽기: {min.z, max.z}
        동작: 새 Box3에 setFromObject(model)을 적용하고 max.z-min.z를 반환한다. 유효성 검사나 비유한 값 보정은 하지 않는다.

    getCalcResult(u3dSelect?: U3dSelect) -> Array<LayerHeightInfo>
        인터페이스: u3dSelect: 결과의 레이어·메시 목록을 제공할 외부 선택기다. 평균은 외부 선택기가 아닌 내부 전체 선택으로 산출한다. [확인 Q-002]
        의존:
            defined — 선택기·메시 유무; 함수: {defined()}
            console — 미활성 안내; 함수: {error()}
            U3dSelect — 선택 키·모델 조회; 함수: {getSelectedKey(), getSelectedAsKey()}
            UMesh — instanceof 판정의 메시 클래스 값; 상수: {UMesh}
            U3DTilesMesh — instanceof 판정의 타일 메시 클래스 값; 상수: {U3DTilesMesh}
        동작:
            레이어별 목록을 담는 일반 빈 객체를 만든다.
            내부·외부 선택기가 모두 null·undefined이면 UAnalyAverageHeight is not active를 출력하고 빈 배열을 반환한다.
            외부 선택기와 getSelectedKey 멤버가 null·undefined가 아니면 외부 선택기를 선택하며, 아니면 내부 선택기가 falsy일 때 빈 배열로 종료하고 내부 선택기를 사용한다.
            getSelectedKey() 순서대로 메시를 조회하여 null·undefined 또는 UMesh·U3DTilesMesh가 아닌 값은 건너뛴다.
            키의 첫 ^ 앞 문자열을 레이어 이름으로 사용하며 그 이름의 기존 값이 falsy일 때만 빈 배열로 대체하고 메시 원본 참조를 추가한다. prototype에서 상속한 truthy 값도 기존 값으로 사용한다. [확인 Q-005]
            일반 객체의 for-in 순서대로 새 결과 객체를 만들어 layerName과 목록 원본 참조를 넣는다.
            각 결과 객체마다 인수 없이 getAverageHeight()를 다시 호출하고 null·undefined일 때만 0으로 대체하여 averageHeight에 넣는다. 레이어별 목록으로 평균을 따로 계산하지 않는다.
            결과 배열을 반환한다. 조회·집계 예외는 전파한다.

    getSelected(u3dSelect?: U3dSelect) -> Record<string, UMesh | U3DTilesMesh> | undefined
        인터페이스: u3dSelect: 생략하면 내부 선택기다. 반환: 레이어명^userData.id를 키로 하는 메시 원본 참조의 새 객체다.
        의존:
            defined — 선택기·메시 유무; 함수: {defined()}
            console — 미활성 안내; 함수: {error()}
            U3dSelect — 선택 키·모델 조회; 함수: {getSelectedKey(), getSelectedAsKey()}
            UMesh — 대상 종류와 ID; 속성 읽기: {userData.id}
            U3DTilesMesh — 대상 종류와 ID; 속성 읽기: {userData.id}
        동작:
            내부·외부 선택기가 모두 null·undefined이면 UAnalyAverageHeight is not active를 출력하고 빈 객체를 반환한다.
            외부 선택기와 getSelectedKey 멤버가 null·undefined가 아니면 외부 선택기를, 아니면 내부 선택기를 사용한다. 선택된 선택기가 falsy이면 undefined를 반환한다.
            선택 키 순서대로 메시를 조회하여 null·undefined 또는 UMesh·U3DTilesMesh가 아닌 값은 제외한다.
            원래 키의 첫 ^ 앞 문자열과 메시의 userData.id를 ^로 연결하여 새 일반 객체에 저장한다. 같은 결과 키면 나중 메시로 덮어쓰며 ID의 UID 대체는 하지 않는다.
            새 객체를 반환한다.

    loadCalcResult(parma: {layerName: string, list: Array<string>, averageHeight: number}) -> number | undefined
        인터페이스: parma: 복원할 레이어명·모델 ID 목록·저장한 평균이다. getCalcResult()의 메시 목록과 달리 list는 ID 목록이다. 반환: 재계산하지 않은 저장 평균이다.
        의존:
            UAnaly — 실행 인자; 속성 읽기: {_drawArg}
            UDrawArg — 갱신 일시 표시; 함수: {setUpdateDate()}
        동작:
            _drawArg가 falsy이면 undefined로 종료한다.
            _drawArg가 truthy인 경우 다음 복원을 수행한다.
                parma의 layerName·list·averageHeight를 읽고 모델 선택 복원을 요청한다.
                복원이 정상 종료하면 갱신 일시를 설정하고 저장한 averageHeight를 반환한다. 아직 모델이 로드되지 않았어도 로드를 기다리지 않는다.

    #addSelectMode(type: string) -> void
        인터페이스: type: 선택 모드다. 선택 완료 callback은 분석 객체를 포획하며 이벤트의 data를 원본 참조로 전달한다.
        의존:
            U3dSelect — 선택기 생성·이벤트·앱·활성화·식별자; 생성자: {new U3dSelect()}; 함수: {on(), setApp(), active(), getClickId(), getDbClickId()}
            UAnaly — 앱과 분석 이벤트; 속성 읽기: {_app}; 함수: {hasEventType(), dispatchEvent()}
        동작:
            single을 point로, polygon을 area로 바꾸고 나머지는 그대로 사용하여 새 U3dSelect를 생성한다.
            선택기의 end 이벤트에 callback을 등록한다. 인수가 undefined이면 data가 undefined인 기본 객체를 사용한다.
                분석에 select 리스너가 있으면 select 이벤트를 전달하고, 그렇지 않고 end 리스너가 있으면 end 이벤트를 전달한다. 둘 다 있으면 select만 전달하며 둘 다 없으면 전달하지 않는다.
            새 선택기에 _app을 연결하고 활성화한다.
            활성화가 정상 종료한 뒤 #selector에 저장하고 getClickId() 결과를 #clickId에 저장한다.
            변환한 모드가 polygon 또는 area이면 getDbClickId() 결과를 #dblClickId에 저장한다. 나머지는 이전 값을 보존한다.

    #addSelected(layerName: string, list: Array<string>) -> void
        의존:
            UAnaly — 앱 연결; 속성 읽기: {_app}
            U3dApp — 레이어 검색; 함수: {getLayerByName()}
            defined — 레이어 유무; 함수: {defined()}
            U3dSelect — 모델 선택 추가; 함수: {addSelected()}
        동작:
            _app 또는 #selector가 falsy이면 종료한다.
            현재 선택기를 보관하고 앱에서 layerName의 레이어를 찾는다. null·undefined이면 [레이어명] 레이어가 없습니다. 오류를 던진다.
            list.forEach로 존재하는 각 ID에 대해 모델을 다시 검색한다.
                검색 결과가 정확히 undefined이면 로딩 리스너를 요청한다.
                그 밖의 값은 보관한 선택기의 addSelected에 두 번째 인수 undefined와 함께 전달한다.
            중간 오류가 나도 앞서 추가한 선택이나 리스너는 되돌리지 않는다.

    #addLoadedListener(layer: U3dLayer, id: string) -> void
        의존:
            defined — 보관 리스너 유무; 함수: {defined()}
            U3dEvent — 메시 로딩 이벤트; 속성 읽기: {MESH.LOADED}
            U3dLayer — 로딩 이벤트 연결; 함수: {addEventListener()}
        동작:
            #loadedListeners[id]가 null·undefined가 아닐 때 아무 작업도 하지 않는다. 레이어별로 키를 구분하지 않고 prototype에서 상속한 값도 검사에 포함한다. [확인 Q-006]
            그렇지 않으면 #loadedListener의 this를 이 분석으로, 선행 인수를 layer·id로 bind하여 보관 객체에 먼저 저장한다.
            layer.addEventListener에 로딩 이벤트·보관 함수·undefined·undefined를 전달한다. 등록 반환 식별자는 저장하지 않으며 등록 실패 시 보관 값을 되돌리지 않는다. [확인 Q-003]

    #loadedListener(layer: U3dLayer, id: string, e: {type: string, data: UMesh}) -> void
        인터페이스: layer·id는 등록할 때 bind한 값이며 this는 이 분석 객체다. e.data는 로드한 메시다.
        의존: U3dSelect — 로드한 모델 선택; 함수: {addSelected()}
        동작:
            #selector가 falsy이면 종료한다.
            #selector가 truthy인 경우 다음 로딩 처리를 수행한다.
                e.data.userData.id가 id와 엄격히 같으면 현재 선택기에 메시와 undefined를 전달하여 선택한 다음 보관 리스너 제거를 요청한다.
                ID가 다르면 무동작이며 선택 추가에서 예외가 나면 후속 제거하지 않는다.

    #findModel(layerName: string, id: string) -> UMesh | U3DTilesMesh | ModelMesh | undefined
        의존:
            UAnaly — 앱 연결; 속성 읽기: {_app}
            U3dApp — 레이어 조회; 함수: {getLayerByName()}
            defined — 레이어 유무; 함수: {defined()}
            U3dModelLayer — ID로 모델 조회; 함수: {getModelById()}
        동작:
            _app이 falsy이면 undefined로 종료한다.
            앱에서 layerName의 레이어를 다시 조회하고 null·undefined이면 undefined로 종료한다.
            getModelById가 null·undefined가 아니면 id로 호출한 결과를 그대로 반환하며 메서드가 없으면 undefined를 반환한다.

    #removeLoadedListener(layer: U3dLayer, key: string) -> void
        의존:
            defined — 보관 리스너 유무; 함수: {defined()}
            U3dEvent — 메시 로딩 이벤트; 속성 읽기: {MESH.LOADED}
            U3dLayer — 리스너 해제; 함수: {removeEventListener()}
        동작:
            #loadedListeners[key]가 null·undefined가 아니면 layer.removeEventListener에 로딩 이벤트와 문자열 key를 전달한 뒤 보관 속성을 삭제한다. 등록 함수나 등록 반환 식별자를 전달하지 않는다. [확인 Q-003]
            해제 호출에서 예외가 나면 보관 속성을 삭제하지 않는다.

    #getMergedModelHeight(mesh: UMesh) -> Array<{id: string, height: number}> | undefined
        인터페이스: mesh: 선택된 병합 메시다. 반환: 점 또는 영역에 포함되는 구성 모델의 높이·UID 목록이며 필요한 앱·선택기·실행 인자가 없으면 undefined다.
        의존:
            UAnaly — 연결 앱·실행 인자; 속성 읽기: {_app, _drawArg}
            U3dSelect — 선택 방식; 함수: {getMode()}
            UMesh — 교차점·레이어명; 함수: {getLayerName()}; 속성 읽기: {_intersect}
            U3dApp — 레이어 조회; 함수: {getLayerByName()}
            U3dModelU3FLayer — 구성 모델 경계 조회; 함수: {getBoundingBoxInfo()}
        동작:
            _app·#selector·_drawArg 중 하나가 falsy이면 undefined로 종료한다.
            선택 모드가 point이고 mesh._intersect가 truthy이면 그 point 원본 참조를 보관한다.
            mesh의 레이어명으로 앱에서 레이어를 찾고 새 결과 배열을 만든다.
            레이어의 getBoundingBoxInfo가 truthy일 때만 호출하며 null·undefined 반환은 빈 배열로 대체한다. 그 결과가 falsy이면 undefined로 종료하는 검사도 유지한다.
            경계 조회 API가 없으면 빈 배열을 반환하며 외부 조회·판정 오류는 전파한다.

UAnalyAverageHeightCO_Content 타입 정의
    name?: string = 'AverageHeight'
        분석 등록 이름이다.
    mode?: string = 'single'
        single은 단일 선택, polygon은 영역 선택이다.

UAnalyAverageHeightCO 타입 정의
    UAnalyCO와 UAnalyAverageHeightCO_Content를 합성한다. 부모 type 옵션은 이 생성자에서 전달되지 않는다. [확인 Q-004]

LayerHeightInfo 타입 정의
    layerName: string
        선택 키의 첫 ^ 앞 레이어 이름이다.
    list: Array<UMesh | U3DTilesMesh>
        조회한 메시 원본 참조의 목록이다.
    averageHeight: number
        내부 선택 전체의 평균이며 레이어별 평균이 아니다. [확인 Q-002]

UAnalyAverageHeightMergedHeightLookup callback 타입 정의
    (mesh: UMesh) -> Array<{id: string, height: number}> | undefined
        mesh는 현재 분석 상태로 높이를 조회할 병합 메시이며 결과는 선택된 구성 모델의 ID·높이 목록이다.
        앱·선택기·실행 인자가 없으면 undefined다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
