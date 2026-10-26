# UAnalyAlarm 명세

> 상태: 구현 관찰 초안

## 1. 개요

POI·모델의 알람 목록과 다중 선택 그룹을 구성하고 깜박임·크기 변화·커서 왕복 애니메이션을 제공한다.
U3dApp의 Alarm 분석 또는 이름을 지정한 분석으로 생성하여 앱을 연결한 뒤, POI·모델 등록과 모드·이미지·세부 옵션을 설정한다.
활성화·선택·알람 실행과 중지·삭제를 분석 이벤트 및 모델 로딩 이벤트와 연결한다.
알람 횟수·속도는 각 모드의 프레임 계산 기준으로 사용하며 실제 시간 간격으로 정규화하지 않는다.

## 3. 정규 자연어 수도코드

```spec
UAnalyAlarm extends UAnaly 클래스 정의
    의존: UAnaly — 분석 기반 클래스; 상속: {UAnaly}

    name: string = 'Alarm'
        앱에서 사용하는 분석 이름이며 외부에서도 변경할 수 있다.
    _clickId, _dblClickId: string | undefined = undefined
        현재 입력 이벤트의 등록 식별자다.
    _poiGroup: UGroup
        POI 등록 그룹이다.
    _modelGroup: Array<UGroup | UMesh> = 빈 배열
        모델 또는 다중 선택 그룹 원본을 보관한다.
    _selected: Record<string, UMesh | true> = 빈 객체
        현재 선택 모델 또는 로딩 대기 true 표식이다.
    _selectedGroup: UGroup
        다음 그룹 확정 때 등록하는 원본 선택 그룹이며 필요할 때 _idList를 덧붙인다.
    _multiModelGroup: UGroup
        다중 선택점 표출 그룹이다.
    _activeAnimaition: number | undefined = undefined
        일부 모드의 마지막 예약 식별자이며 취소 기준은 ID별 저장소다.
    _type: string = 'POI'
        생성 옵션 또는 setType이 설정한 현재 등록 타입이다.
    _highlightColor: number = 0x00ff00
        생성 옵션을 저장한다. 현재 알람 실행의 색상 기본값에는 사용하지 않는다.
    _detailList: Array<string | number> = 빈 배열
        커서 세부 설정을 위한 등록 ID 목록이다.
    _detailOpt: Record<string, Alarm_DetailOpt | undefined> = 빈 객체
        POI별 커서 이미지·크기·높이 차다.
    _modelObject: Record<string, {layerName: string, tile: string}> = 빈 객체
        모델 UID별 소유 레이어와 원래 타일 주소다.
    _infoActiveAlarm: Record<string, number | undefined> = 빈 객체
        POI·모델 ID별 가장 최근 예약 식별자다.
    _disposedAlarmInfo: Record<string, {count: number, speed: number, color: string | number | undefined} | undefined> = 빈 객체
        모델이 해제될 때 남은 반복 설정을 저장한다.
    _loadedListeners: Record<string, Function | undefined> = 빈 객체
        레이어 이름으로 등록하는 재로딩 리스너 저장소다.
    _selector: U3dSelect | undefined = undefined
        model·group 선택 모드의 선택기다.
    _imageUrl: string | undefined = undefined
        이후 커서를 만들 때 사용하는 이미지 URL이다.
    _measureFeature: UMeasureFeature | undefined = undefined
        확정 측정 피처의 참조다.
    _pickList: Array<object> = 빈 배열
        다중 선택점의 위경도 변환 결과다.

    constructor(opt?: UAnalyAlarmCO)
        의존:
            UAnaly — 기반 분석 초기화; 생성자: {super()}
            defaultValue — undefined 기본값; 함수: {defaultValue()}
            UGroup — POI·선택·다중 그룹; 생성자: {new UGroup()}
        동작:
            부모를 opt 없이 초기화하고 opt가 falsy이면 빈 객체로 대체한다.
            name은 undefined일 때 Alarm, _type은 undefined일 때 POI, _highlightColor는 undefined일 때 0x00ff00을 사용한다. null·false·0·빈 문자열은 defaultValue에서 대체하지 않는다.
            클릭 식별자·마지막 공통 프레임·정보 목록·이미지 URL을 undefined로 하고 POI·선택·다중 그룹을 생성한다.
            모델·세부·선택점 목록과 선택·주소·활성 프레임·해제 정보·리스너·편집·삭제 저장소를 빈 값으로 초기화하며 _auto는 true로 설정한다. _selector·_measureFeature는 선언만 하고 초기값은 undefined이다.

    getSelecter() -> U3dSelect | undefined
        동작:
            현재 _selector의 원본 참조를 반환한다.

    override active() -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UAnaly — 부모 활성 상태; 함수: {prototype.active.call()}; 속성 읽기: {_app}; 속성 쓰기: {_isActive}
            U3dApp — 모드·클릭 등록·주석 장면; 함수: {on()}; 속성 읽기·쓰기: {_mode, _sceneComment}
            UDEF — 알람 앱 모드; 상수: {APP_MODE._ALARM}
            U3dSelect — 선택기 비활성화; 함수: {deactive()}
        동작:
            부모 active를 적용하고 앱 모드를 알람으로 설정한다.
    override deactive() -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UAnaly — 부모 비활성·이벤트 정리; 함수: {prototype.deactive.call()}; 속성 읽기: {_isActive}; 속성 읽기: {_app}
            U3dApp — 클릭 이벤트 정리; 함수: {unkey(), off()}
        동작:
            _isActive가 falsy이면 종료한다.
            부모 deactive를 적용한 뒤 click 식별자로 unkey하고 종류 전체를 off하며 _clickId를 undefined로 설정한다.
            self._dblClickId가 defined일 때만 dblclick을 unkey·off하고 _dblClickId를 undefined로 설정한다.
            _isActive가 truthy일 때 다중 모드 이벤트와 로딩 리스너를 해제한다.

    override clear() -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UAnaly — 부모 POI 자원 정리; 함수: {prototype.clear.call()}; 속성 읽기: {_app}
            UGroup — 새 선택·다중 그룹; 생성자: {new UGroup()}
            U3dApp — 화면 갱신; 함수: {setUpdateDate()}
            U3dSelect — 선택기 정리; 함수: {clear()}
        동작:
            등록 POI를 조회하고 각 POI의 프레임 예약을 취소한다.
            poi.userData.cursor가 truthy일 때만 해당 POI 커서를 정리한다.
            부모 clear를 적용하고 측정 레이어를 조회하며 없으면 남은 초기화를 생략한다.
            선택을 해제한 뒤 다중 그룹과 선택 그룹을 새 객체로 만들고 측정 피처를 정리한다.
            편집·삭제·세부 옵션·모델 주소·알람 프레임·해제 알람 정보를 빈 저장소로 교체하고 화면 갱신을 요청한다. _modelGroup 자체는 비우지 않는다.
            더블클릭 식별자가 defined이면 다중 모드를 해제하고 모듈 공유 그룹 번호를 1로 되돌린다.
            선택기가 있으면 clear를 호출한다.

    onMultiMode() -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            U3dApp — 다각형 모드·입력 이벤트 등록; 함수: {unkey(), off(), setPolygonMeasureType(), on()}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_app}
        동작:
            click 식별자가 defined이면 기존 click을 해제한다.
            다각형 측정 모드를 설정한 뒤 _polygonClick과 _polygonDblclick을 각각 click·dblclick에 bind하여 등록하고 식별자를 저장한다.

    offMultiMode() -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            U3dApp — 입력 이벤트 해제; 함수: {unkey(), off()}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_app}
        동작:
            dblclick, click 순으로 식별자가 defined인 이벤트를 unkey·off하고 해당 식별자를 undefined로 설정한다.
            로딩 이벤트 리스너를 해제한다.

    addDetailList(id: string | number) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UAnaly — 알람 목록 변경 이벤트; 함수: {dispatchEvent()}
        동작:
            id가 null 또는 undefined이면 종료한다.
            원본 세부 목록에 strict includes로 같은 id가 없을 때 추가하며, 중복 여부와 무관하게 click 이벤트를 발생시킨다.

    addPOI(poi: UGroup) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UGroup — POI 등록; 함수: {add()}
            UAnaly — 목록 변경 이벤트; 함수: {dispatchEvent()}
        동작:
            _type을 POI로 설정한 뒤 poi가 없거나 UGroup이 아니거나 자식이 0개 이하이면 종료한다.
            POI 그룹에 원본 객체를 추가하고 click 이벤트를 발생시킨다.

    addModel(model: UMesh) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UMesh — UID·소유 레이어; 함수: {getLayerName(), getUid()}; 속성 읽기: {_opt, _tile}
            U3dApp — 소유 레이어 존재 확인; 함수: {getLayer()}
            UAnaly — 변경 이벤트; 함수: {dispatchEvent()}; 속성 읽기: {_app}
        동작:
            타입을 model로 바꾸고 UMesh가 아니면 종료한다.
            레이어 이름이 없으면 종료한다. 앱의 해당 레이어가 truthy일 때만 모델 원본을 목록에 추가하고 UID별 레이어·타일 키를 기록한다.
            타일은 _opt._tile이 defined이면 그 _key, 아니면 _tile?._key를 읽는다.
            레이어가 없더라도 레이어 이름이 있으면 click 이벤트는 발생시킨다.

    getPOIGroupChildren() -> Array<UCssBilboard>
        동작:
            _poiGroup.children의 원본 배열을 반환하며 addPOI가 받은 UGroup도 이 배열에 들어갈 수 있다.

    getModelGroupChildren() -> Array<UGroup | UMesh>
        동작:
            _modelGroup 원본 배열을 반환한다.

    getDetailList() -> Array<string | number>
        동작:
            _detailList 원본 배열을 반환한다.

    getInstanceType(id: string | number) -> string | undefined
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UMesh — UID 조회; 함수: {getUid()}
        동작:
            id가 없으면 undefined를 반환한다.
            POI 목록을 조회한다.
    addDetailOpt(id: string, xsize?: number, ysize?: number, height?: number, image?: string) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UDefaultSource — 기본 커서 이미지; 상수: {CURSOR_IMAGE}
        동작:
            id가 없으면 종료한다. xsize·ysize·height가 null 또는 undefined이면 각각 40·40·50으로 대체하고 image가 없으면 기본 커서 이미지로 대체한다.
            _detailOpt[id]를 새 세부 옵션 객체로 저장하며 목록 등록이나 이벤트는 하지 않는다.

    removeDetailList(id: string) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            현재 세부 목록을 조회한 뒤 id가 없으면 종료한다.
            strict includes로 id가 있을 때만 동일 id를 모두 제외한 새 배열로 바꾸고 그 id의 옵션이 defined이면 undefined를 대입한 뒤 삭제한다.

    findPOI(idList: Array<string | number>) -> Array<UGroup> | UGroup | undefined
        의존:
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            idList가 없으면 undefined를 반환한다.
    findModel(idList: Array<string | number> | string | number) -> UGroup | UMesh | undefined
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UGroup — 배열 조회 결과 그룹; 생성자: {new UGroup()}
            U3dSelect(self._selector) — 선택 목록 참조 복사; 속성 읽기: {_selected}
            UMesh — UID 조회; 함수: {getUid()}
        동작:
            idList가 없으면 undefined를 반환하고 선택기가 있으면 그 _selected를 얕게 복사한다.
    alarmSetData(id: string, count: number, speed: number, type?: string, color?: number | string) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            Common_Material — 모델 원래 색상 보관; 속성 읽기·쓰기: {_oriColor, color}
        동작:
            id가 없으면 종료하고 count·speed가 null 또는 undefined이면 각각 5·30으로 대체한다.
            객체 타입을 확인한다.
    disposedStopModelAlarm(model: UMesh) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UMesh — UID·재질 확인; 함수: {getUid()}; 속성 읽기: {material}
            UDrawArg — 원래 타일 존재 조회; 함수: {getTile()}
            UDEF — 모델 타일 타입 값; 상수: {TILE_TYPE.MODEL}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_drawArg}
        동작:
            UMesh가 아니거나 UID가 없으면 종료한다.
            재질이 없을 때 저장 주소의 타일을 타입 인수 없이 조회하고 반환값과 MODEL 상수가 truthy이면 교차 모델로 대상만 대체한다. 그 밖에는 종료한다. 주소가 없으면 속성 접근 오류가 전파될 수 있다.
            해제 시 저장한 알람 정보가 있고 남은 count가 0보다 클 때만 대상 모델의 깜박임을 다시 시작한다.

    modelFlickerMode(model: UMesh | Array<UMesh>, count: number, speed: number, color?: number | string) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            model이 없으면 종료한다.
            배열이면 각 원소의 초기화를 순서대로 수행하고 단일 객체이면 한 번 초기화한다. 반환값은 수집하지 않는다.

    modelFlickerModeInit(model: UMesh, count: number, speed: number, color?: number | string) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UMesh — UID·재질·선택 상태; 함수: {getUid()}; 속성 읽기: {material}; 속성 삭제: {_isPicked}
            Common_Material — 원색 캐시와 투명도; 속성 읽기·쓰기·삭제: {_oriColor, opacity}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_app}
        동작:
            speed를 문자열화하여 parseInt하고 UMesh가 아니면 종료한다. count도 parseInt한 뒤 UID 알람을 중지하며 count가 0 이하이면 종료한다. NaN은 이 종료 조건을 통과한다.
            재질이 없으면 교차 모델이 있는지 확인하여 targetModel만 대체하며 없으면 종료한다. 이후 색상 변경 대상 alarmModel은 원본 그대로이다.
            oriColor는 흰색으로 시작하고 color가 없으면 녹색을 사용한다. 원본 재질의 _oriColor가 있으면 그 참조를 가져오고 캐시를 undefined 대입 후 삭제한다. 재질이 있으면 opacity를 1로 만들고 _isPicked를 삭제한다.
    flickerMode(poi: UCssBilboard | Array<UCssBilboard>, count: number, speed: number) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            poi가 없으면 종료한다. 배열이면 각 원소, 단일 객체이면 해당 객체의 깜박임을 시작한다.

    flickerModeAnimation(poi: UCssBilboard, count: number, speed: number) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_app}
        동작:
            speedSize를 parseInt(String(speed))의 두 배로, count를 parseInt(String(count))로 계산하고 poi.id의 기존 예약을 중지한다. poi를 검사하기 전에 id를 읽는다.
            poi가 없거나 count가 0 이하이면 종료하며 NaN은 종료 조건을 통과한다.
    sizeMode(poi: UCssBilboard | Array<UCssBilboard>, count: number, speed: number) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UCssBilboard — 기본 크기 복원; 함수: {getPointDefaultSize(), setPointSize()}
        동작:
            poi가 없으면 종료한다.
            배열이면 각 원소를 speed·count 순서로 실행하며 oriSize를 전달하지 않는다.
            단일 객체이면 기본 크기를 Number로 변환하여 적용한 뒤 그 크기를 oriSize로 전달한다.

    sizeModeAnimaition(poi: UCssBilboard, speed: number, count: number, oriSize?: number) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            poi가 없으면 종료하고 speed가 없으면 30으로 대체한다. count가 0 이하이면 기존 예약을 중지하지 않고 종료한다.
            speedSize는 floor(speed / 30)이며 oriSize가 없으면 8로 대체한다. POI 예약을 중지한다.
    cursorMode(poi: UCssBilboard | Array<UCssBilboard>, count: number, speed: number) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
        동작:
            poi가 없으면 종료한다. 배열이면 각 원소, 단일 객체이면 그 객체에 speed·count 순으로 커서 알람을 적용한다.

    cursorModeAnimation(poi: UCssBilboard, speed: number, count: number) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UDefaultSource — 기본 커서 이미지; 상수: {CURSOR_IMAGE}
            UScene — 커서 장면 등록; 함수: {add()}
            Web API — 이미지 누락·요청 실패 진단; 함수: {console.error(), console.log()}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_scene}; 속성 읽기: {_app}
        동작:
            count를 parseInt, speedSize를 floor(speed / 10)로 계산한다. poi가 없으면 종료하고 기존 커서를 정리한 뒤 해당 POI 예약을 취소한다. count가 0 이하라도 자원을 생성한다.
            크기는 40·40, 높이 차는 50으로 시작한다. _imageUrl이 없으면 기본 이미지를 선택하고 _imageUrl에도 저장한다.
            세부 옵션이 있으면 그 image로 대체한다. image가 없으면 console.error를 출력하고 종료하며, 있으면 xsize·ysize·height를 Number로 바꾼다.
            반환된 스프라이트를 분석 장면에 추가한다.
    isDisposedStopModel(model: UMesh) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UMesh — UID 조회; 함수: {getUid()}
            UDrawArg — 모델 타일 확인; 함수: {getTile()}; 속성 읽기: {_disposed}
            UDEF — 모델 타일 타입; 상수: {TILE_TYPE.MODEL}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_drawArg}
        동작:
            model이 없으면 종료한다. UID별 주소가 있을 때 MODEL 타입으로 타일을 조회한다.
            타일이 있고 _disposed가 falsy이며 교차 모델이 있으면 해제 알람 재개를 호출한 뒤 저장 정보를 undefined 대입·삭제한다.

    getIntersectModel(id: string) -> UMesh | undefined
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            U3dApp — 원래 레이어 조회; 함수: {getLayer()}
            ModelLayerLike — 현재 또는 편집 모델 조회; 함수: {getModelById()}; 속성 읽기: {editedList, editedEvent}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_app}
        동작:
            UID 주소가 있으면 저장 레이어 이름을 쓰고 없으면 undefined 이름으로 getLayer를 호출한다. 레이어가 없으면 undefined로 종료한다.
            getModelById(id, false)를 호출한다. 결과가 없고 editedList가 defined이며 비어 있지 않으면 editedEvent[id]의 mesh가 있으면 반환한다.
            편집 정보가 없거나 편집 목록 조건을 충족하지 않으면 원래 조회 결과를 반환한다.

    removeAllAlarm() -> Promise<boolean>
        의존:
            deferredPromise — 표준 Promise 완료 제어; 함수: {deferredPromise()}
            UMesh — 모델 UID; 함수: {getUid()}
            U3dApp — 강제 갱신; 함수: {forceUpdate()}
            UAnaly — 변경 이벤트; 함수: {dispatchEvent()}; 속성 읽기: {_app}
        동작:
            deferredPromise 객체를 만들고 모델 목록 원본을 조회한다.
            원본 목록이 비어 있지 않으면 그룹의 name 또는 모델 UID로 removeAlarm을 호출한 뒤 그 원본 배열의 원소를 splice하며 인덱스를 되돌려 순회한다. removeAlarm은 _modelGroup을 다른 배열로 바꿀 수 있다.
            원본 배열 길이가 0이면 clear를 호출하고 true로 resolve한 뒤 click 이벤트를 발생시킨다.
            forceUpdate를 호출하고 deferredPromise 원본을 반환한다. 공개 반환은 Promise<boolean>이며 완료값은 true다. 콜백은 현재 호출이 끝난 뒤 실행된다.

    removeAllDetailOpt() -> void
        의존:
            UAnaly — 목록 변경 이벤트; 함수: {dispatchEvent()}
        동작:
            세부 목록이 비어 있으면 종료한다. 아니면 각 ID의 옵션을 undefined 대입·삭제한 뒤 목록과 옵션 저장소를 빈 값으로 교체하고 click 이벤트를 발생시킨다.

    removeAlarm(id: string | number) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UDEF — POI 정리; 정적 함수: {disposeObject3D()}
            UGroup — POI 분리; 함수: {remove()}
            UMesh — UID·색상·투명도 복원; 함수: {getUid(), setColor(), setOpacity()}
            U3dApp — 화면 갱신; 함수: {setUpdateDate()}
            UAnaly — 변경 이벤트; 함수: {dispatchEvent()}; 속성 읽기: {_app}
        동작:
            POI 목록을 조회한다.
    stopAlarmById(id: string | number) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UMesh — UID·원색·투명도 복원; 함수: {getUid(), setColor(), setOpacity()}; 속성 읽기·삭제: {_isPicked}
            UCssBilboard — 기본 크기 복원; 함수: {getPointDefaultSize(), setPointSize()}
            U3dApp — POI 갱신; 함수: {setUpdateDate()}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_app}
        동작:
            id가 없으면 종료한다. ID 예약을 취소하고 등록 타입을 조회한다.
            POI 타입이면 POI 목록을 조회한다.
            model 타입이면 교차 모델을 조회하고 _isPicked가 truthy일 때만 삭제하며 재질이 있으면 흰색과 opacity 1을 적용한다.
            POI·model 이외 타입이면 모델 목록에서 대상을 찾는다.
    stopAllAlarm() -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UCssBilboard — 기본 크기 복원; 함수: {getPointDefaultSize(), setPointSize()}
            UMesh — UID 조회; 함수: {getUid()}
        동작:
            POI·모델 목록을 조회한다.
            각 POI 예약을 취소하고 visible을 true로 만들며 자식이 3개보다 많으면 마지막 자식만 pop하고 기본 크기를 적용한다. cursor 자원 정리 함수를 호출하지 않는다.
            모델 목록이 defined이면 그룹 name 또는 단일 모델 UID로 알람을 중지한다.

    stopActiveAlarm(id: string | number) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            Web API — 프레임 취소; 함수: {cancelAnimationFrame()}
        동작:
            id가 없으면 종료한다. 해당 프레임 기록이 defined이면 예약을 취소하고 undefined를 대입한 뒤 키를 삭제한다. 공통 마지막 식별자·가시성·크기·색상·커서는 바꾸지 않는다.

    override setType(type: string) -> void
        동작:
            _type을 입력 그대로 저장하며 기존 모드의 이벤트를 다시 연결하지 않는다.

    addSelected(object: UMesh | Array<UMesh>) -> void
        의존:
            UMesh — UID 조회; 함수: {getUid()}
            U3dApp — 레이어 존재 확인; 함수: {getLayer()}
            UDrawArg — 갱신 요청; 함수: {setUpdateDate()}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_app}; 속성 읽기: {_drawArg}
        동작:
            UMesh이면 소유 레이어와 모델 ID에 따라 선택을 연결한다.
            UMesh가 아닌 Array이면 각 원소를 재귀적으로 등록한다. 미지원 객체는 등록하지 않는다.
            각 호출 마지막에 drawArg의 갱신을 요청한다.

    clearSelect(isChecked?: boolean) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UDrawArg — 갱신 요청; 함수: {setUpdateDate()}
            U3dApp — 주석 장면; 속성 읽기: {_sceneComment}
            UScene — 다중 표출 그룹 분리; 함수: {remove()}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_drawArg}; 속성 읽기: {_app}
        동작:
            isChecked가 없으면 false로 대체한다. for-in으로 선택 키별 복원을 수행한 뒤 _selected를 빈 객체로 바꾼다.
            drawArg의 갱신을 요청하고 주석 장면이 있으면 다중 모델 그룹을 분리한다. 그룹 자식과 리스너 저장소 자체는 비우지 않는다.

    passToClickEvent(func: EventCallBack, event?: string) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UAnaly — 분석 이벤트 등록; 함수: {on()}
        동작:
            func가 없으면 종료한다. event가 null 또는 undefined이면 click, 그 밖에는 입력 event로 이벤트 함수를 등록한다.

    removeSelected(object: UMesh) -> void
        의존:
            UDrawArg — 갱신 요청; 함수: {setUpdateDate()}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_drawArg}
        동작:
            객체가 선택되어 있는지 조회한다.
            선택되어 있으면 다음을 수행한다.
            선택 여부와 무관하게 drawArg 갱신을 요청한다.

    setCursorImage(url: string) -> void
        동작:
            _imageUrl을 입력 그대로 저장한다. 이미 생성된 커서에는 소급 적용하지 않는다.

    _click(e: U3dMouseEvent) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UAnaly — 교차 조회·이벤트·갱신; 함수: {intersectModel(), intersectTerrain(), dispatchEvent(), update()}; 속성 읽기: {_app}
            U3dBilboard — 클릭 POI 생성; 정적 함수: {makeBilboard()}
            UGroup — POI 등록; 함수: {add()}
            U3dApp — 주석 장면·갱신; 함수: {setUpdateDate()}; 속성 읽기: {_sceneComment}
        동작:
            선택을 해제한다.
            _type이 정확히 POI이면 모델 교차 결과 중 z가 NaN이 아닌 첫 점을 보관한다. poi가 계속 undefined이므로 지형 교차로 그 점을 다시 대체하며 없으면 종료한다. [확인 Q-002]
            점의 x·y를 toFixed(0)으로 이어 붙인 text를 사용하여 POI를 만들고 POI 그룹에 추가한다.
            click 이벤트를 발생시킨 뒤 주석 장면이 있으면 POI 그룹을 등록하고 앱 갱신·분석 update를 호출한다. POI가 아닌 타입도 이 후속 경로는 수행한다.

    _polygonClick(e: U3dMouseEvent) -> boolean | undefined
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            U3dApp — 교차 조회·주석 장면; 함수: {intersectAtPixel()}; 속성 읽기: {_sceneComment}
            UDrawArg — 좌표·모델 장면 조회; 함수: {getWorldToGeographic(), getInstanceScenesFromModelLayers()}
            U3dBilboard — 다각형 꼭짓점 표출; 정적 함수: {makeBilboard()}
            UMeasureLayer — 측정점; 함수: {addMeasurePoint()}
            UMeasureFeature — 측정 기하 조회; 함수: {getGeometry()}
            U3dMessage — 미지원 선택 안내; 정적 함수: {info()}
            UDEF — 진단 설정; 속성 읽기: {debug}
            Web API — 진단; 함수: {console.info()}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_app}; 속성 읽기: {_drawArg}; 속성 읽기: {_sceneComment}
        동작:
            _sceneComment가 없으면 false를 반환하고 _measureFeature가 undefined가 아니면 clear를 호출한다. 측정 레이어를 조회한다.
            앱의 intersectAtPixel(e, true)에서 첫 결과만 사용한다. 그 원본 point의 z가 NaN 또는 음수이면 0으로 직접 바꾼다.
            점이 없으면 debug일 때만 진단을 출력하고 undefined로 종료한다.
            선택을 해제하고 점 표출 객체를 다중 그룹·주석 장면에 등록한다. 위경도 변환 결과를 _pickList에 보관하고 측정점으로 추가하여 기하를 얻는다. 레이어 또는 피처가 없으면 이후 getGeometry 접근 오류가 전파된다.
            모델 장면 목록을 구한다.
            UU3fMesh가 하나라도 있으면 미지원 안내를 출력한다. 정상 흐름 끝에는 true를 반환한다.

    _removeSelectedByKey(key: string, isChecked?: boolean) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            Common_Material — 선택 색상 복원; 속성 읽기·쓰기·삭제: {_oriColor, color}
            U3dApp — 소유 레이어 조회; 함수: {getLayer()}
            ModelLayerLike — 모델 로딩 리스너 해제; 함수: {off()}
            U3dEvent — 로딩 이벤트 종류; 상수: {MESH.LOADED}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_app}
        동작:
            선택값이 없거나 재질이 없으면 키도 지우지 않고 종료한다.
            _oriColor가 있으면 색상에 적용하고 캐시를 undefined 대입·삭제하며 없으면 흰색을 적용한다. 선택 키를 삭제한다.
            앱이 있고 isChecked가 truthy이면 로딩 연결을 정리한다.
    _addSelected_(layerName: string, id: string | number) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            U3dApp — 선택 레이어 조회; 함수: {getLayer()}
            UMesh — UID·타일 주소 조회; 함수: {getUid()}; 속성 읽기: {_opt, _tile}
            Common_Material — 선택 원색·강조; 속성 읽기·쓰기: {_oriColor, color, needsUpdate}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_app}
        동작:
            레이어가 없으면 '[레이어명] 레이어가 없습니다.' Error를 던진다.
            레이어 로딩 리스너를 등록한 뒤 layerName^id 키로 현재 모델을 조회한다.
            모델이 있고 아직 해당 키가 defined가 아니면 원본 모델을 선택 그룹 children에 직접 push한다. model.userData.id가 falsy이면 각 자식의 UID별 주소를, truthy이면 모델 UID별 주소를 저장한다.
            위 모델 신규 선택 경로에서 selMat._oriColor가 없을 때만 현재 색상을 clone하여 _oriColor에 저장한다. 그 뒤 색상을 빨간색으로 바꾸고 selMat.needsUpdate를 true로 설정한다.
            모델이 없으면 동일 키에 true 대기 표식을 저장한다.

    _addSelectedNotLayer_(object: UMesh) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            Common_Material — 선택 색상 적용; 속성 읽기·쓰기: {_oriColor, color, needsUpdate}
            UAnaly — 선택 이벤트; 함수: {dispatchEvent()}
        동작:
    _findModelSelect(layerName: string, id: string | number) -> UMesh | undefined
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            U3dApp — 레이어 조회; 함수: {getLayer()}
            ModelLayerLike — ID 모델 조회; 함수: {getModelById()}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_app}
        동작:
            레이어가 없으면 undefined를 반환하고 있으면 두 번째 인수 없이 getModelById(id)의 결과를 반환한다.

    _polygonDblclick(e: U3dMouseEvent) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            UGroup — 그룹 교체·표출 정리; 생성자: {new UGroup()}; 함수: {clear()}
            U3dApp — 갱신; 함수: {setUpdateDate()}
            UAnaly — 그룹 변경 이벤트; 함수: {dispatchEvent()}; 속성 읽기: {_drawArg}; 속성 읽기: {_app}
            Web API — 그룹명 입력; 함수: {window.prompt()}
        동작:
            측정 레이어를 조회하되 반환값은 사용하지 않는다.
            그룹 번호를 기본값으로 prompt하고 falsy 결과를 빈 문자열로 대체하여 선택 그룹 이름에 저장한 뒤 번호를 늘린다. 번호는 모든 인스턴스가 공유한다.
            문자열 이름이 defined이므로 취소·빈 입력도 모델 그룹에 등록한다. 선택 그룹을 새 객체로 만들고 다중 그룹 자식을 clear한다.
            측정 피처를 정리하고 앱 갱신을 요청하며 선택점 배열을 비운 뒤 click 이벤트를 발생시킨다. e는 사용하지 않는다.

    _getSelectLayer() -> UMeasureLayer | undefined
        의존:
            U3dApp — 측정 레이어 참조; 속성 읽기: {_measureLayer}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_app}
        동작:
            연결한 앱의 _measureLayer를 그대로 반환한다.

    _addLoadedListener(layer: ModelLayerLike) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            ModelLayerLike — 이름·로딩 구독; 함수: {getName(), addEventListener()}
        동작:
            레이어 이름이 없거나 그 이름의 리스너가 이미 defined이면 종료한다.
            _loadedListener를 현재 분석에 bind한 함수를 이름별 저장소에 기록하고 선택적 addEventListener로 loaded에 등록한다. [확인 Q-007]

    _removeAllLoadedListener() -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            U3dApp — 이름별 레이어 조회; 함수: {getLayerByName()}
            ModelLayerLike — 로딩 구독 해제; 함수: {removeEventListener()}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_app}
        동작:
            저장소의 own key마다 레이어를 조회하고 없으면 건너뛰며 있으면 loaded 리스너를 removeEventListener한다.
            저장소 키는 삭제하지 않아 다음 _addLoadedListener의 재등록을 막을 수 있다. [확인 Q-007]

    _loadedListener(e: DispatchInputEvent) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            Common_Material — 재로딩 모델 강조; 속성 읽기·쓰기: {_oriColor, color}
        동작:
            e.data를 모델로 사용하여 선택 여부를 조회한다.
            선택되어 있을 때만 원색을 한 번 보관하고 빨간색으로 바꾼다. needsUpdate는 설정하지 않는다.
    _isSelected(object: UMesh) -> boolean
        의존:
            defined — null·undefined 판정; 함수: {defined()}
        동작:
    _clearMeasureFeature() -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            U3dSelect(selector) — 현재 측정 피처; 속성 읽기: {_measureFeature}
            U3dApp — 측정 피처 제거; 함수: {removeMeasureFeature()}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_app}
        동작:
            측정점을 먼저 commit한다.
            선택기가 있고 그 _measureFeature가 defined이면 앱에서 선택기 피처를 제거하고 분석 객체의 _measureFeature만 undefined로 만든다. 선택기 필드는 직접 비우지 않는다.

    _commitFeature() -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            U3dApp — 측정점 확정; 함수: {commitMeasurePoint()}
            UAnaly — 기반 분석 연결 상태; 속성 읽기: {_app}
        동작:
            앱의 commitMeasurePoint 결과가 defined일 때만 _measureFeature에 저장하며 없으면 기존 필드를 보존한다.

    _addSelectMode(type: string) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            U3dSelect(selector) — 선택 모드·이벤트·활성화; 생성자: {new U3dSelect()}; 함수: {off(), setMode(), on(), setApp(), active(), getClickId(), getDbClickId()}; 속성 읽기·쓰기: {_selected, _reset}
            U3dSelect(self._selector) — 영역 선택 피처 참조; 속성 읽기: {_measureFeature}
            UAnaly — 이벤트 중계·등록; 함수: {hasEventType(), dispatchEvent(), on(), off()}; 속성 읽기: {_app}
            U3dApp — 재로딩 레이어 조회; 함수: {getLayerByName()}
            ModelLayerLike — 편집 이벤트·로딩 구독; 함수: {getEditedEventById(), addEventListener()}
            UMesh — 모델 ID; 함수: {getUid()}
            UU3fMesh — 병합 여부; 함수: {isMerged()}
            U3dEvent — 모델 로딩 종류; 상수: {MESH.LOADED}
        동작:
            type이 model이면 point, group이면 area로 바꾸며 그 밖의 값은 그대로 사용한다.
            선택기 end를 분석 select·end로 중계하는 콜백을 만든다. 각각 hasEventType이 참인 이벤트만 e.data를 전달하며 콜백 인수 생략 시 data undefined를 사용한다.
            기존 선택기가 있으면 새 bind 함수로 이전 end 해제를 시도하고 분석 end·select도 새 bind 함수로 해제를 시도한 뒤 mode를 설정한다. 같은 함수 참조의 재사용으로 임의 바꾸지 않는다.
            self._selector가 없으면 type 모드로 U3dSelect를 생성하여 _selector에 저장한다. 분석 select에 _selectEvent를 bind하여 등록한다.
            area이면 선택기 피처를 분석에 보관하고 분석 end에 그룹 확정 콜백을 등록한다.
            point이면 분석 end 콜백에서 분석 선택을 선택기에 얕게 복사하고 리스너 저장소 각 key의 선택 모델이 없으면 건너뛴다.
            point 후속 콜백에서 isMerged 멤버가 truthy이고 호출 결과가 falsy이면 편집 정보의 split 값이 defined일 때 이벤트 이름으로 대체한다. 레이어가 있으면 선택기 _reset[key]를 true로 하고 해당 저장 리스너를 MESH.LOADED에 false once와 계산 이름으로 등록한다.
            선택기 end에 중계 콜백을 현재 분석에 bind하여 등록하고 app을 연결한 뒤 active한다. _clickId에 getClickId 결과를 보관하고 type이 polygon 또는 area일 때만 _dblClickId에 getDbClickId 결과를 보관한다.

    _selectEvent(e: DispatchInputEvent) -> void
        의존:
            defined — null·undefined 판정; 함수: {defined()}
            U3dSelect(selector) — 선택 모드·선택·리스너 병합; 속성 읽기: {mode, _selected, _loadedListeners}
            U3dApp — 소유 레이어 조회; 함수: {getLayer()}
            UMesh — 모델 주소; 함수: {getUid()}; 속성 읽기: {_opt, _tile, children}
            UAnaly — 목록 변경 이벤트; 함수: {dispatchEvent()}; 속성 읽기: {_app}
        동작:
            선택기 또는 e.data가 없으면 종료한다. data.length가 0보다 클 때만 선택기 저장소를 분석 저장소에 Object.assign으로 병합한다.
            data.length가 0보다 크면 각 선택 객체에 다음 조회와 모드별 처리를 수행한다.
    _removeCursor(poi: UCssBilboard) -> void
        의존:
            THREE.Sprite — 공유 geometry 구분; 속성 읽기: {isSprite}
            BufferGeometry — 비스프라이트 자원 해제; 함수: {dispose()}
            Material — 커서 재질 해제; 함수: {dispose()}
            Texture — 커서 map 해제; 함수: {dispose()}
            Object3D — 부모에서 분리; 함수: {remove()}
        동작:
            poi.userData.cursor가 truthy일 때만 정리한다.
            Sprite이면 공유 geometry를 해제하지 않고 그 밖이면 geometry가 있을 때 dispose한다. material이 있으면 map을 선택적으로 dispose한 뒤 material을 dispose하며 parent가 있으면 분리한다.
            poi.userData.cursor 참조 자체는 삭제하지 않는다.

UAnalyAlarmCO extends UAnalyCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string = 'Alarm'
            분석 이름이다.
        _highlightColor?: number = 0x00ff00
            저장할 하이라이트 색상이다.
        _type?: string = 'POI'
            알람 등록 타입이다.

ModelEditInfo 부분 타입 명세
    이 명세에서 사용하는 필드:
        mesh?: UMesh
            편집 후 모델이다.
        editData: KeyValue
            split 등 편집 참조 정보다.

ModelLayerLike 부분 타입 명세
    이 명세에서 사용하는 필드:
        getName?: function() -> string
            로딩 리스너 등록 이름이다.
        getModelById: UAnalyAlarmModelLookup
            모델을 ID로 조회한다.
        editedList?: Array<string | number>
            편집 정보 대체 조회를 허용하는 목록이다.
        editedEvent?: Record<string, ModelEditInfo>
            ID별 편집 모델 참조다.
        off?: function(type: string, listener: Function) -> void
            선택 로딩 리스너를 해제한다.
        addEventListener?: function(type: string, listener: Function, once?: boolean, name?: string) -> void
            로딩 리스너를 등록한다.
        removeEventListener?: function(type: string, listener: Function) -> void
            등록 리스너를 제거한다.
        getEditedEventById?: UAnalyAlarmEditedLookup
            재로딩 이벤트 이름을 위한 편집 정보를 조회한다.

Alarm_DetailOpt 부분 타입 명세
    이 명세에서 사용하는 필드:
        xsize, ysize, height?: number
            커서 크기와 POI 대비 높이 차다.
        image?: string
            커서 이미지 주소다.

UAnalyAlarmModelLookup 함수 타입 정의
    (id: string | number, create?: boolean) -> UMesh | undefined
    모델 레이어의 ID 조회 시그니처이며 결과가 없으면 undefined이다.

UAnalyAlarmEditedLookup 함수 타입 정의
    (id: string) -> ModelEditInfo | undefined
    모델 레이어의 편집 정보 조회 시그니처이며 결과가 없으면 undefined이다.

UAnalyAlarmAnimationOwner 타입 정의
    UAnalyAlarm에서 _activeAnimaition·_infoActiveAlarm·_disposedAlarmInfo·stopActiveAlarm·isDisposedStopModel만 선택한 Pick 타입이다. 전달한 원본 분석의 상태와 취소·재개 동작에 접근한다.

UAnalyAlarmSelectionOwner 타입 정의
    UAnalyAlarm에서 _selected·getIntersectModel·_isSelected만 선택한 Pick 타입이다. 원본 선택 상태와 교차 모델·선택 조회에 접근한다.

UAnalyAlarmCursorResult 타입 정의
    sprite: Sprite
        새로 조립하여 poi.userData.cursor에 연결한 스프라이트다.
    poiPosition: Vector3
        POI position의 원본 참조이며 위치 이동 뒤 커서 복원에도 현재 z를 읽는다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
