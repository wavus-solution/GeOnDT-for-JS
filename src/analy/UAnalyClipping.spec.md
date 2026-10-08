# UAnalyClipping 명세

> 상태: 구현 관찰 초안

## 1. 개요

영상·모델 클리핑 필터를 관리하는 분석 클래스다. 입력 영역과 필터 옵션으로 영상 또는 모델 필터를 생성하고, 기존 레이어의 메시와 이후 로드된 메시에도 필터를 적용한다. 필터 삭제 시 해당 효과를 복원하고 남은 동종 필터를 재적용한다.

앱의 기본 분석 등록과 `activeAnalysis('Clipping')`에서 사용하며 `tutorial-official/analysisClipping.html`이 영역·축·필터 삭제의 대표 사용처다. 실제 절단·텍스처 변환은 `UClipImageFilter`, `UClipModelFilter`가 담당하고 이 단위는 대상 순회와 필터·이벤트 수명주기를 연결한다.

## 3. 정규 자연어 수도코드

```spec
UAnalyClipping extends UAnaly 클래스 정의
    의존: UAnaly — 분석 기반; 상속: {UAnaly}

    name: string = 'Clipping'
        분석 이름이며 외부 쓰기를 차단하지 않는다.
    _classtype: string = 'UAnalyClipping'
        클래스 식별 문자열
    _type: string = 'image'
        조회·설정 가능한 분석 타입이며 addFilter의 기본 타입을 결정하지 않는다.
    _poiGroup: UGroup
        활성화 시 앱 주석 장면에 연결하는 그룹
    _loadedListeners: Record<string, Function> = 빈 객체
        레이어 이름별 등록한 로드 이벤트 함수
    _filters: Record<string, UClipImageFilter | UClipModelFilter> = 빈 객체
        필터 ID별 원본 필터 저장소이며 외부 변경을 차단하지 않는다.
    _selector: U3dSelect | undefined = undefined
        setApp에서 한 번 생성하여 모델 필터에 전달하는 선택기
    _createKey: string | undefined = undefined
        마지막 활성화에서 반환한 레이어 생성 이벤트 등록 이름

    constructor(opt?: UAnalyClippingCO)
        인터페이스: opt는 분석 이름과 타입을 전달하며 생략하면 빈 옵션을 사용한다.
        의존:
            UAnaly — 기반 생성; 생성자: {new UAnaly()}
            defaultValue — undefined의 기본값 선택; 함수: {defaultValue()}
            UGroup — 표출 그룹 생성; 생성자: {new UGroup()}
        동작:
            부모 생성자를 옵션 없이 실행한다.
            falsy 옵션을 빈 객체로 대체하고 name과 type이 undefined일 때만 각각 'Clipping'과 'image'를 사용한다.
            클래스 식별값·새 그룹·빈 리스너 저장소와 빈 필터 저장소를 설정하고 선택기·생성 이벤트 키를 undefined로 둔다.

    override setApp(app: U3dApp) -> void
        의존:
            UAnaly — 앱·실행 인자·주석 장면 연결; 함수: {setApp()}
            U3dSelect — 수동 선택기 생성; 생성자: {new U3dSelect()}
        동작:
            부모 setApp에 app을 전달한 뒤 현재 선택기가 falsy이면 auto=false인 선택기를 생성한다.
            선택기에 setApp이나 active를 호출하지 않으며 기존 선택기는 교체하지 않는다.

    override active() -> void
        의존:
            UAnaly — 활성 상태와 앱; 함수: {active()}; 속성 읽기: {_app}
            U3dApp — 기존 레이어와 생성 알림; 함수: {getInstanceImageLayers(), getInstanceModelLayers(), on()}; 속성 읽기: {_sceneComment}
            UScene — 주석 그룹 연결; 함수: {add()}
            U3dEvent — 로드 이벤트 종류; 상수: {IMAGE.LOADED, MESH.LOADED}
            U3dAppEMD — 생성 알림 종류; 상수: {LAYER_CREATE}
            UDEF — 생성된 레이어 종류; 상수: {PROCESS.TYPE.IMAGE, PROCESS.TYPE.MODEL}
        동작:
            부모 active를 먼저 실행하며 앱이 falsy이면 활성 상태만 바꾼 채 종료한다.
            _app이 truthy인 경우 다음 연결을 수행한다.
                표출 그룹을 주석 장면에 연결한다.
                영상 레이어 다음 모델 레이어 순으로 각 종류의 로드 이벤트를 등록한다.
                레이어 생성 이벤트에 addEvent callback을 등록하고 반환한 이름을 _createKey에 저장하되 null·undefined이면 undefined로 저장한다.
                callback은 truthy 이벤트의 _tileName이 영상 또는 모델일 때 해당 한 레이어의 로드 이벤트를 등록하고 그 밖에는 아무 작업도 하지 않는다.

                반복 활성화에서도 새 생성 callback을 등록하며 마지막 이름만 저장한다. [확인 Q-004]

    override deactive() -> void
        의존:
            UAnaly — 앱과 비활성 상태·분석 리스너 해제; 함수: {deactive()}; 속성 읽기: {_app}
            U3dApp — 생성 이벤트 해제; 함수: {unkey()}
            U3dAppEMD — 생성 알림 종류; 상수: {LAYER_CREATE}
        동작:
            레이어 로드 리스너를 먼저 해제한다.
            _createKey와 앱이 모두 truthy이면 생성 이벤트를 저장한 이름으로 해제한다. [확인 Q-004]
            부모 deactive를 실행하며 필터·선택기·그룹·_createKey를 정리하거나 초기화하지 않는다.

    override clear() -> void
        동작: 전체 필터를 복원·삭제하며 부모 clear는 실행하지 않는다.

    override getType() -> string
        동작: 현재 _type을 그대로 반환한다. [확인 Q-002]

    override setType(type?: string) -> void
        동작: 입력을 검증하거나 기본값으로 대체하지 않고 _type에 그대로 저장한다. [확인 Q-002]

    addFilter(options?: UAnalyClippingFilterParam) -> UClipImageFilter | UClipModelFilter | undefined
        인터페이스: 입력 영역과 필터 설정을 전달하며 생성된 원본 필터 또는 미지원 타입이면 undefined를 반환한다.
        의존:
            defined — 필수 영역·중복 ID와 기본 타입 판정; 함수: {defined()}
            ol — 좌표 배열을 영역으로 변환; 생성자: {new geom.Polygon()}
            UClipImageFilter — 영상 필터 생성; 생성자: {new UClipImageFilter()}; 속성 읽기: {id}
            UClipModelFilter — 모델 필터 생성; 생성자: {new UClipModelFilter()}; 속성 읽기: {id}
            UAnaly — 앱 참조; 속성 읽기: {_app}
            UEventDispatcher — 필터 find 이벤트 등록; 함수: {on()}
        동작:
            falsy options를 빈 객체로 대체하되 truthy이면 원본 객체를 그대로 사용한다.
            geometry가 null·undefined이면 Error('options.geometry not defined')를 던진다.
            id가 undefined가 아니며 현재 저장소 항목이 null·undefined가 아니면 Error('duplicated id.')를 던진다.
            type이 null·undefined이면 원본 options의 type에 'image'를 저장한다. [확인 Q-001]
            geometry가 OpenLayers Geometry 인스턴스가 아니면서 Array 인스턴스이면 각 점의 x·y를 좌표로 사용한 한 개 링의 Polygon으로 원본 geometry를 교체한다.
            type='image'이면 id·type·geometry·layers·style·앱을 영상 필터 생성자에 전달한다.
            type='model'이면 같은 설정에 axis·size·선택기를 더하여 모델 필터 생성자에 전달한다.
            type='imageAndmodel' 분기는 구현되지 않았으며 다른 미지원 타입도 필터를 생성하지 않는다.
            생성한 필터와 그 id가 모두 truthy이면 저장소에 등록한다.
                find 이벤트에 이 분석을 this로 하고 필터를 첫 인수로 고정한 전체 레이어 적용을 등록한다. [확인 Q-005]
                해당 필터를 기존 레이어에 즉시 적용한다.
            생성된 필터를 반환한다. 즉시 적용 중 예외가 나면 등록을 되돌리지 않고 원래 예외를 전달한다.

    removeFilter(filter: UClipImageFilter | UClipModelFilter | string) -> void
        의존:
            UClipImageFilter — 필터 ID; 속성 읽기: {id}
            UClipModelFilter — 필터 ID; 속성 읽기: {id}
        동작: 문자열이면 그 값을, 객체이면 id를 필터 ID 삭제에 전달한다.

    resetFilter(filter: UClipImageFilter | UClipModelFilter) -> void
        의존:
            UAnaly — 앱 참조; 속성 읽기: {_app}
            U3dApp — 종류별 레이어 조회; 함수: {getInstanceImageLayers(), getInstanceModelLayers()}
            ClippingLayer — 영상 캐시와 모델 장면·분할 휴면 검사; 함수: {getCacheKeys(), getCacheByKey(), getScene(), checkDivisionMeshIdle()}
            Object3D — 모델 장면 순회; 함수: {traverse()}
            UMesh — 복원 대상 클래스 값; 상수: {UMesh}
            USharedMesh — 제외할 공유 메시 클래스 값; 상수: {USharedMesh}
            UClipImageFilter — 영상 복원과 동종 필터 선택; 함수: {reset()}; 속성 읽기: {type, id, result}; 속성 쓰기: {result}
            UClipModelFilter — 모델 복원과 동종 필터 선택; 함수: {reset()}; 속성 읽기: {type, id, result}; 속성 쓰기: {result}
        동작:
            앱이 falsy이면 필터 결과를 변경하지 않고 종료한다.
            _app이 truthy인 경우 다음 복원을 수행한다.
                filter.result가 truthy일 때 새 빈 배열로 교체한다.
                type='image'이면 영상 레이어의 캐시 키와 그 객체를 순서대로 조회한다.
                    객체 자체가 UMesh이면서 USharedMesh가 아닐 때 reset(object, layer)을 실행한 뒤 반환값과 무관하게 다른 영상 필터를 재적용한다.
                    캐시 객체의 자식은 순회하지 않으며 캐시가 비어도 장면으로 대체하지 않는다.
                type='model'이면 모델 레이어의 장면을 traverse로 순회한다.
                    UMesh이면서 USharedMesh가 아닌 객체에 reset(object, layer)을 실행한다.
                    reset의 반환이 truthy인 경우에만 다른 모델 필터를 재적용한다.
                    장면 순회를 마친 레이어의 checkDivisionMeshIdle이 truthy이면 호출한다.
                그 밖의 type이면 Error('filter type is error!')를 던진다.

    getFiltersById(id: string) -> UClipImageFilter | UClipModelFilter | undefined
        동작: 저장소의 id 항목을 원본 참조로 반환한다.

    removeFilterById(id: string) -> void
        의존:
            UAnaly — 앱 참조; 속성 읽기: {_app}
            U3dApp — 렌더러 조회; 함수: {getRenderer()}
            WebGLRenderer — 로컬 클리핑 비활성화; 속성 쓰기: {localClippingEnabled}
        동작:
            저장소 항목이 undefined가 아니면 해당 필터를 복원한 뒤 저장소에서 삭제한다.
            남은 키가 0개이고 앱이 truthy이면 렌더러의 localClippingEnabled를 false로 설정한다.
            필터의 find 리스너는 해제하지 않는다. [확인 Q-005]

    removeFilterAll() -> void
        의존:
            UAnaly — 앱 참조; 속성 읽기: {_app}
            U3dApp — 렌더러 조회; 함수: {getRenderer()}
            WebGLRenderer — 로컬 클리핑 비활성화; 속성 쓰기: {localClippingEnabled}
        동작:
            기존 저장소의 값 목록을 고정하고 undefined가 아닌 필터를 순서대로 복원한다.
            복원이 예외 없이 끝났고 앱이 truthy이면 localClippingEnabled를 false로 설정한다.
            저장소를 새 빈 객체로 교체하며 기존 저장소를 반환받은 외부 참조는 변경하지 않는다.
            필터의 find 리스너는 해제하지 않는다. [확인 Q-005]

    getFilters() -> Record<string, UClipImageFilter | UClipModelFilter | undefined>
        동작: 필터 저장소 원본 객체를 반환하며 외부 쓰기를 차단하지 않는다.

    #overwriteOtherFilter(id: string, mesh: UMesh, filterClass: typeof UClipImageFilter | typeof UClipModelFilter = UClipImageFilter) -> void
        의존:
            UClipImageFilter — 동종 판정과 재적용; 함수: {match()}; 속성 읽기: {id, result}; 속성 쓰기: {result}
            UClipModelFilter — 동종 판정과 재적용; 함수: {match()}; 속성 읽기: {id, result}; 속성 쓰기: {result}
        동작:
            현재 저장소 키를 고정한 뒤 각 키의 현재 값을 읽고 falsy 필터는 건너뛴다.
            filter.id가 제외 id와 다르고 지정 클래스의 인스턴스이면 truthy result를 새 빈 배열로 교체하고 mesh를 match에 전달한다.

    #findAllLayer(filter: UClipImageFilter | UClipModelFilter) -> void
        의존:
            UAnaly — 앱 참조; 속성 읽기: {_app}
            U3dApp — 영상·모델 레이어와 렌더러·화면 갱신; 함수: {getInstanceImageLayers(), getInstanceModelLayers(), getRenderer(), changeUpdate()}
            WebGLRenderer — 모델 로컬 클리핑 활성화; 속성 쓰기: {localClippingEnabled}
            UClipImageFilter — 종류·결과 초기화; 속성 읽기: {type, result}; 속성 쓰기: {result}
            UClipModelFilter — 종류·결과 초기화; 속성 읽기: {type, result}; 속성 쓰기: {result}
        동작:
            앱이 falsy이면 아무 작업도 하지 않는다.
            _app이 truthy인 경우 다음 적용을 수행한다.
                type='image'일 때 영상 레이어를 조회한다.
                type='model'일 때 localClippingEnabled를 true로 설정한 뒤 모델 레이어를 조회한다.
                type='imageAndmodel'이면 Error('ANALY_IMAGE_MODEL is not used'), 그 밖의 미지원 type이면 Error('filter type is error!')를 던진다.
                선택이 끝나면 truthy filter.result를 새 빈 배열로 교체한다.
                순회가 예외 없이 끝나면 앱 changeUpdate를 호출한다.

    #addLoadEventListener(layers: Array<any>, eventType: string) -> void
        의존:
            defined — 이름 중복 판정; 함수: {defined()}
            ClippingLayer — 이름과 이벤트 등록; 함수: {getName(), addEventListener()}
        동작:
            이 분석을 this로 하는 새 로드 함수를 바인딩한다.
            레이어 이름을 순서대로 읽고 저장된 리스너가 null·undefined가 아니면 메서드 전체를 즉시 종료한다. [확인 Q-003]
            중복이 아니면 이름별 저장소에 바인딩 함수를 먼저 저장한 뒤 해당 eventType으로 등록한다.

    #removeLoadListeners() -> void
        의존:
            UAnaly — 앱 참조; 속성 읽기: {_app}
            U3dApp — 이름별 현재 레이어 조회; 함수: {getLayerByName()}
            defined — 레이어 존재 판정; 함수: {defined()}
            ClippingLayer — 이벤트 해제; 함수: {removeEventListener()}
            U3dEvent — 양쪽 로드 이벤트 종류; 상수: {IMAGE.LOADED, MESH.LOADED}
        동작:
            앱이 falsy이면 저장소를 그대로 두고 종료한다.
            앱이 truthy이면 저장소 키마다 앱의 현재 레이어를 조회하고 null·undefined 레이어는 건너뛴다.
            존재하는 레이어에서 영상·모델 로드 이벤트 순으로 동일 저장 함수를 해제한다.
            순회가 끝나면 리스너 저장소를 새 빈 객체로 교체한다.

    #loadedObject(e: {data: UMesh, type: string}) -> void
        의존:
            UMesh — 로드 메시 식별; 함수: {getUid()}
            UClipImageFilter — 영상 종류와 재적용; 함수: {match()}; 속성 읽기: {type}
            UClipModelFilter — 모델 종류와 재적용; 함수: {match()}; 속성 읽기: {type}
            U3dEvent — 종류별 로드 이벤트; 상수: {IMAGE.LOADED, MESH.LOADED}
        동작:
            e.data를 메시로 사용하고 현재 저장소 키를 고정한 뒤 메시 getUid를 한 번 실행한다.
            각 키의 현재 필터를 읽고 falsy 필터는 건너뛴다.
            결과 정리 뒤 모델 타입·모델 로드 또는 영상 타입·영상 로드가 일치하면 해당 필터의 match에 메시를 전달한다.
            종류가 다르더라도 먼저 실행한 결과 항목 제거는 되돌리지 않는다.
            match·내부 결과 정리·메시 getUid의 예외를 잡지 않으며 별도의 화면 갱신을 요청하지 않는다.

UAnalyClippingCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
            분석 이름이며 기본값은 'Clipping'
        type?: string
            분석 타입이며 기본값은 'image'

UAnalyClippingCO extends UAnalyCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
            현재 단위에서 추가한 분석 이름
        type?: string
            생성자에서 저장할 분석 타입

ClippingLayer 부분 타입 명세
    이 명세에서 사용하는 필드:
        getName: function() -> string
        getCacheKeys: function() -> Array<string>
        getCacheByKey: function(key: string) -> Object3D
        getScene: function() -> Scene
        addEventListener: function(type: string, listener: Function) -> void
        removeEventListener: function(type: string, listener: Function) -> void
        resetStateTileByKey?: function(key: string) -> void
        checkDivisionMeshIdle?: function() -> void
    레이어 조회·등록·복원에 필요한 메서드 계약이며 resetStateTileByKey는 필터에 전달되는 레이어의 복원 기능이다.

UAnalyClippingFilterParam 부분 타입 명세
    이 명세에서 사용하는 필드:
        id?: string
            필터 ID이며 실제 생성된 필터의 truthy ID만 저장한다.
        type: string
            공개 선언상 필수지만 addFilter의 런타임은 null·undefined를 'image'로 대체한다. [확인 Q-001]
        geometry: OLGeometry | Array<{x: number, y: number}>
            기존 영역 또는 Polygon으로 변환할 점 목록
        layers?: Array<string>
            필터에 전달할 레이어 이름 목록
        style?: {color: number, opacity: number}
            필터 색상·투명도 설정
        axis?: string
            모델 필터에만 전달하는 기준 축이며 공개 설명의 기본값은 'height'
        size?: number
            모델 필터에만 전달하는 필터 크기이며 공개 설명의 기본값은 500000
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
