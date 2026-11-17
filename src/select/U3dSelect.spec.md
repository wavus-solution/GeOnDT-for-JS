# U3dSelect 명세

> 상태: 구현 관찰 초안

## 1. 개요

화면 입력 또는 프로그램 호출로 모델을 선택하고 외곽선·색상·링 강조와 모델 재로딩 구독을 관리한다. POINT·AREA·LINE·CIRCLE·BOX 입력을 실제 선택 대상으로 연결하며, hover는 클릭 선택 목록과 별도로 임시 표시·복원을 관리한다.

앱에 연결한 뒤 입력을 활성화하거나 `addSelected()`를 직접 호출하여 사용한다. `UAnalySection` 같은 호출자는 입력 구독 없이 선택·강조 기능만 재사용할 수 있다. 외곽선과 링의 실제 표시는 각각 `U3dObjectBarrier`와 `U3dSelectionRing`, 모델 분리·재로딩은 해당 모델 레이어가 담당한다.

영속 재로딩 대상은 이미 부여된 `puid`로 연결하고, 일반 객체는 현재 객체 참조의 식별값으로 구분한다. 선택기가 새 영속 식별자를 만들거나 위치로 동일 객체를 추정하지 않는다. 같은 부모 데이터의 로드 구독은 선택기별로 분리하고 그 안의 선택 대상별로 유지·해제한다.

## 3. 정규 자연어 수도코드

```spec
U3dSelect extends UEventDispatcher 클래스 정의
    의존: UEventDispatcher — 이벤트 기반; 상속: {UEventDispatcher}
    uuid: string
    style: KeyValue|undefined
        생성자 입력 또는 기본값을 보관한다. 현재 선택 재질 처리에서는 이 속성을 읽지 않는다. [확인 Q-002]
    mode: string
    exceptTexture: boolean
    _auto: boolean
    _manualSelects: Array<any>
    _selected: KeyValue
    _reset: Record<string, boolean>
    _loadedListeners: Record<string, EventCallBack | undefined>
    _divisionSelection: {owner: U3dSelect | undefined, pending: Set<Promise<Array<Object3D>>>, cleanups: Set<function>, end: function | undefined}
        현재 영역 검색의 분리 대기·취소 정리·보류 완료 이벤트를 소유한다.
    _clickId: string | undefined
    _dblClickId: string | undefined
    _selectLayer: U3dShaderMeasureLayer | undefined
    _poiGroup: UGroup
    _measureFeature: UMeasureFeature | undefined
    _isActive: boolean
    _posList: Array<GeoPosition>
    _defaultColor: ColorRepresentation
    _defaultOpacity: number
    _oriSelectColor: ColorRepresentation
    _oriSelectOpacity: number
    _selectColor: ColorRepresentation
    _selectOpacity: number
    _workEvent: string
    selectBoxEvent: SelectBoxEvent
    _rayOption: KeyValue
    _selectType: string
    _selectTypeOption: KeyValue|undefined
    _selectedPulse: boolean
    _setVerticalObject: boolean
    _verticalObjects: Record<string, UGroup | undefined>
    _app: U3dApp
    _drawArg: UDrawArg
        setApp에서 연결한 앱의 그리기 인자이며 좌표 변환·모델 장면 조회·표시 갱신에 사용한다.
    _effector: U3dObjectBarrier
    _ringEffector: U3dSelectionRing | undefined
    static EVENT: {START: string, CHANGE: string, END: string, HOVER_CHANGE: string}
    static TYPE: {COLOR: string, OUTLINE: string, RING: string}
    #searchLog: Map<any, any>
    #targetLayer: Array<string>|undefined
    #pickBufferPx: number
    #pickBufferVisible: boolean
    #bufferCircle: HTMLDivElement | undefined
    #bufferWindow: Window | null | undefined
    #hoverEnabled: boolean
    #hoverAutoHighlight: boolean
    #hoverColor: Color
    #hoverPointer: SelectPointerEvent | undefined
    #hoverTarget: U3dSelectHoverTarget | null
    #hoverRestore: (() => void) | undefined
    #hoverCleanup: (() => void) | undefined
    #hoverListeners: Array<{type: string, key: string}>
    #hoverDragging: boolean
    #hoverStopping: boolean
    _measureGeom: unknown

    static _retainLoadedTarget(listener: Function, key: string, object: ModelMesh) -> boolean
        역할: 다른 소비자가 보관한 로드 callback에 선택 한 건의 재로딩 연결을 유지한다.
        인터페이스: listener는 기존 구독 callback, key는 유지할 선택 키, object는 현재 선택 객체이다. 반환값은 선택기가 관리하는 callback인지 나타낸다.
        의존:
            U3dModelLayer — 같은 등록 이름으로 로드 구독 복원; 함수: {addEventListener()}
            U3dEvent — 로드 이벤트; 상수: {MESH.LOADED}
        동작:
            LOAD_SUBSCRIPTIONS에 listener가 없으면 false를 반환한다.
            현재 객체와 그 _intersect로 복원 기준을 만들어 구독의 targets[key]를 교체하고 소유 선택기의 _loadedListeners[key]에 같은 listener를 저장한다.
            구독 레이어에 같은 listener를 등록한다. 부모 ID로 등록 이름을 덮어쓰지 않고 true를 반환한다.

    static _releaseLoadedTarget(listener: Function, key: string) -> boolean
        역할: 다른 대상의 재로딩 연결을 보존하면서 공유 구독에서 선택 한 건만 해제한다.
        인터페이스: listener는 기존 구독 callback, key는 해제할 선택 키이다. 반환값은 선택기가 관리하는 callback인지 나타낸다.
        의존:
            U3dModelLayer — 마지막 대상의 구독 해제; 함수: {off()}
            U3dEvent — 로드 이벤트; 상수: {MESH.LOADED}
        동작:
            LOAD_SUBSCRIPTIONS에 listener가 없으면 false를 반환한다.
            targets에서 key를 삭제한다. 소유 선택기의 같은 키에 여전히 이 listener가 저장된 경우에만 그 참조도 삭제한다.
            targets가 비었을 때만 레이어의 로드 이벤트를 해제한다. 다른 선택 대상이 남으면 listener를 유지하며 true를 반환한다.

    #bufferResize() -> void
        동작:
            현재 범위 원의 위치와 크기를 갱신한다.
            보조 처리를 실행한다.

    constructor(opt: U3dSelectCO = {})
        의존:
            THREE.Color — 직접 사용하는 기능; 생성자: {new Color()}
            UDEF — 직접 사용하는 기능; 정적 함수: {createUUID()}
            defaultValue — 직접 사용하는 기능; 함수: {defaultValue()}
            UGroup — 직접 사용하는 기능; 생성자: {new UGroup()}
        동작:
            부모를 초기화한다. pickBufferPx가 nullish이면 0이며 유한한 0 이상 숫자가 아니면 RangeError를 던진다. pickBufferVisible의 nullish 기본값은 false이다.
            hover.autoHighlight가 제공되었는데 boolean이 아니면 TypeError를 던진다. hover.enabled 기본값은 false, autoHighlight는 true, 색은 초록이다.
            uuid를 만들고 style 입력 또는 기본 재질 값을 보관한다. 현재 단위의 선택 재질 처리에는 style을 전달하지 않는다. [확인 Q-002]
            mode의 undefined 기본값 point·대상 레이어 목록·텍스처 제외 false·자동 선택 true를 저장한다. 선택·복원·로딩 구독 사전과 수동 목록·위치 목록을 비우고 입력 키와 측정 피처를 undefined, 활성 상태를 false로 둔다. 라벨 그룹을 생성한다.
            기본 복원 색은 흰색·불투명도 1, 원래 강조색은 빨강·불투명도 1이다. 작업 이벤트는 빈 문자열, 박스 입력 정보는 undefined 값들, 광선 옵션은 빈 객체이다.
            selectType이 falsy이면 outline을 적용하며 외곽선 옵션을 정규화한다. selectedPulse의 nullish 기본값은 true, setVerticalObject는 false이고 true일 때 수직 객체 사전을 만든다.
            보조 처리를 실행한다.

    addTargetLayer(layerName: string) -> void
        동작:
            대상 목록이 falsy이면 빈 배열을 만들고 같은 이름이 없을 때만 추가한다.

    removeTargetLayer(layerName: string) -> void
        동작:
            대상 목록이 없으면 반환하고 이름의 첫 인덱스가 0 이상일 때 그 항목만 제거한다.

    addRayOption(key: string, value: any) -> void
        동작:
            광선 옵션의 해당 키를 주어진 값으로 덮어쓴다.

    getSelectBox() -> U3dSelectionBox | undefined
        동작:
            selectBoxEvent.selectBox 원본을 반환한다.

    #normalizeSelectTypeOption(type: string, option?: KeyValue) -> KeyValue | undefined
        동작:
            outline이 아니면 option 원본을 반환한다. farPoint가 null이면 option을 복사하고 farPoint를 null로 둔다. farPoint가 제공되었는데 객체가 아니거나 배열이면 TypeError를 던진다.
            외곽선 farPoint 기본값은 enabled=true, thresholdSizePx=24, minSizePx=5, simplifyTolerancePx=0.1이다. 입력 필드를 덮어쓰되 thresholdSizePx 없이 enterSizePx 또는 exitSizePx만 제공하면 thresholdSizePx를 제거한다. minSizePx 없이 pointSizePx를 주면 minSizePx로 옮기며 pointSizePx는 제거한다. 옵션을 복사하여 반환한다.

    setSelectType(val: string, typeOption?: KeyValue | U3dSelectRingOption) -> void
        의존:
            U3dSelectionRing(this._ringEffector) — 직접 사용하는 기능; 함수: {dispose()}
        동작:
            옵션을 먼저 정규화한다. 타입이 바뀌며 전후 타입 중 하나가 ring이면 앱이 있을 때 선택을 비우고 링을 해제한다. 타입과 옵션을 저장하고 ring이면 현재 선택 객체마다 링을 적용한다.
            보조 처리를 실행한다.
            _app가 truthy이면:
                보조 처리를 실행한다.

    getSelectType() -> string
        동작:
            현재 강조 타입을 반환한다.

    getSelectTypeOption() -> KeyValue
        동작:
            저장 옵션이 truthy이면 원본을, 아니면 새 빈 객체를 반환한다.

    setPickBufferPx(radius: number) -> this
        의존:
            U3dApp(this._app) — 직접 사용하는 기능; 함수: {updateData()}
        동작:
            유한한 0 이상 숫자가 아니면 RangeError를 던진다. 이전 값과 같으면 this를 반환한다. 다르면 저장하고 범위 원과 앱 표시를 갱신한 뒤 this를 반환한다.
            보조 처리를 실행한다.

    getPickBufferPx() -> number
        동작:
            검색 반경을 반환한다.

    setPickBufferVisible(visible: boolean) -> this
        의존:
            U3dApp(this._app) — 직접 사용하는 기능; 함수: {updateData()}
        동작:
            boolean이 아니면 TypeError를 던진다. 값을 저장하고 false이면 범위 DOM을 제거한다. hover 또는 표시가 켜졌으면 구독을 시작하고 그 외에는 정리한다. 범위와 앱을 갱신한 뒤 this를 반환한다.
            보조 처리를 실행한다.

    getPickBufferVisible() -> boolean
        동작:
            범위 원 표시 설정을 반환한다.

    setHover(options: U3dSelectHoverOption = {}) -> this
        의존:
            THREE.Color — 직접 사용하는 기능; 생성자: {new Color()}
            U3dApp(this._app) — 직접 사용하는 기능; 함수: {updateData()}
        동작:
            options가 없거나 객체가 아니거나 배열이거나 제공된 enabled·autoHighlight가 boolean이 아니면 TypeError를 던진다. 색을 먼저 해석하고 생략한 설정은 유지한다.
            검색을 끄거나 자동 강조 설정을 바꾸면 기존 hover를 해제한다. 그 외에 색이 바뀌고 자동 강조와 대상이 있으면 현재 대상을 다시 적용한다. finally에서 검색·범위 표시 설정에 맞춰 구독을 시작하거나 정리하고 앱을 갱신한다. this를 반환한다.
            보조 처리를 실행한다.

    getHover() -> {enabled: boolean, autoHighlight: boolean, color: number}
        동작:
            enabled·autoHighlight·현재 색 숫자를 담은 새 객체를 반환한다.

    #addEventListener() -> void
        의존:
            U3dApp(this._app) — 직접 사용하는 기능; 함수: {on()}
            defined — 직접 사용하는 기능; 함수: {defined()}
            __GInfo__ — 직접 사용하는 기능; 함수: {__GInfo__()}
        동작:
            POINT이면 click과 hover 구독을 연결한다. AREA·LINE·CIRCLE이면 click·dblclick을 연결한다. BOX이면 조작 제한 안내를 남기고 박스 입력을 준비한다.
            보조 처리를 실행한다.
            보조 처리를 실행한다.

    #removeEventListener() -> void
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
            U3dApp(this._app) — 직접 사용하는 기능; 함수: {unkey()}
        동작:
            click·dblclick 키가 defined이면 앱에서 해제하고 undefined로 만든다. 선택 박스가 있으면 박스 구독과 도구를 제거한다. hover 구독을 정리한다.
            보조 처리를 실행한다.

    #removeSelectBoxEventListener() -> void
        의존:
            U3dApp(self._app) — 직접 사용하는 기능; 함수: {off(), disableCameraMove()}
            U3dSelectionBox(selectBox) — 직접 사용하는 기능; 함수: {dispose()}
        동작:
            앱이 있으면 저장한 마우스 세 종류의 구독을 해제한다. 박스를 dispose하고 박스·키를 undefined로 만든다. 살아 있는 앱에서만 카메라 조작을 다시 허용한다.
            보조 처리를 실행한다.

    #intersectsGeomBox(geom: OLGeometry, box3: Box3) -> boolean
        의존: UDrawArg(this._drawArg) — 경계 상자의 월드 좌표를 영역 판정 좌표로 변환; 함수: {getWorldToGoogle()}
        동작:
            상자·min·max가 없으면 false이다. 두 모서리를 Google 좌표로 변환하여 형상의 intersectsExtent 결과를 boolean으로 반환한다.

    #checkSharedObject(intersect: any) -> boolean
        동작:
            교차 대상이 USharedMesh이면 true, 아니면 false를 반환한다.

    #checkTilesObject(intersect: any) -> boolean
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
        동작:
            isBIM이 defined이며 호출 결과가 false인 대상은 true, 나머지는 false를 반환한다.

    #checkMergeGroupsObject(intersect: any, result: Array<any>, event: any) -> boolean
        의존:
            U3dApp(self._app) — 직접 사용하는 기능; 함수: {getLayerByName()}
            U3dModelLayer(modelLayer) — 병합 객체의 부분 선택·분리와 편집 상태; 함수: {getEditedEventById(), mergedMeshDivision(), getMaterialIndexByFace()}
            U3dModelU3FLayer(modelLayer) — 구성 부품 경계 조회와 부분 재질 지정; 함수: {getBoundingBoxInfo(), setPickMaterialByComposedInfo()}
            defined — 직접 사용하는 기능; 함수: {defined()}
            U3dModelU3FLayer(u3flayer) — 직접 사용하는 기능; 함수: {getMaterialIndexByFace(), getEditedEventById(), editFilter()}
            U3dModelU3FLayer(u3fLayer) — 직접 사용하는 기능; 함수: {getMaterialIndexByFace(), removeMaterialIndex()}
        동작:
            병합 상태·레이어 조회 기능·소속 레이어·배열 재질·geometry 그룹·분할 함수가 없거나 자식이 있으면 false이다.
            faceIndex가 defined이면 해당 면을 분할하고 재질 인덱스를 찾는다. 결과가 없으면 true로 마치고 인덱스를 _pickMaterials에 중복 없이 넣어 원본 교차를 결과에 추가한다.
            면 정보 없이 영역 형상이 있으면 건물별 경계와 범위를 검사한다. 유효한 start·count의 중간 면 번호로 선택 재질을 등록하고 자동 강조 또는 선택 등록을 수행한다. 자동 선택이 아니면 객체의 현재 색·불투명도를 사용한다. 편집 목록과 스타일을 기록하며 색상 방식이 아니면 후속 로딩 콜백을 저장한다. 범위 밖 그룹은 색·불투명도 기록과 분할 재질을 제거한다.
            분할 후 콜백은 등록 당시 검색의 소유자와 앱이 살아 있을 때만 실행한다. outline·ring이고 대상 puid의 편집 색 정보가 있으면 대상 강조와 비토글 선택을 요청한다. 편집 콜백별 정리 함수를 등록하여 선택 취소 시 자신이 등록한 콜백만 제거한다. 진입한 병합 그룹 경로는 true로 끝난다.
            event.intersectsExtent가 truthy이면:
                intersect.faceIndex가 defined가 아니면:
                    layer.mergedMeshDivision가 truthy이면:
                        object.getLayerName가 truthy이면:
                            보조 처리를 실행한다.
            layer.mergedMeshDivision가 truthy이면:
                object.getLayerName가 truthy이면:
                    보조 처리를 실행한다.
            layer.mergedMeshDivision가 truthy이면:
                object.getLayerName가 truthy이면:
                    보조 처리를 실행한다.

    #checkMergeObject(intersect: any, result: Array<any>, event: any) -> boolean
        의존:
            U3dApp — 레이어·지리 좌표 교차 조회; 함수: {getLayerByName(), intersectModelAtGeographicPoint()}; 속성 읽기: {_camera}
            U3dModelLayer — 병합 메시 분리와 장면; 함수: {mergedMeshDivision(), getScene()}
            UDrawArg — 월드점의 지리 좌표 변환; 함수: {getWorldToGoogle()}
            THREE.Vector2 — 마우스 정규화 좌표; 생성자: {new Vector2()}
            URaycaster — 분리 메시 광선 검사; 함수: {setFromCamera(), intersectObjects()}
            defined — 입력 존재 판정; 함수: {defined()}
        동작:
            event·병합 상태·레이어 조회 기능·소속 레이어·분리 함수가 없으면 false이다. 레이어의 분리 함수를 호출한다.
            영역 검색의 분리 완료를 기다리기 시작했거나 이미 기다리는 경우 true로 반환한다. 그 외에는 분리 결과가 undefined이거나 카메라가 없으면 false다.
            정규화 좌표가 있으면 해당 좌표로 광선을 만들어 분리 메시를 검사한다. 그 외 event.x와 y가 truthy이면 지정 레이어 장면 또는 전체 모델에서 지리 좌표 교차를 구한다. 영역 형상이면 각 분리 메시의 경계를 검사한다.
            교차 결과가 없으면 true이다. 결과 중 isMerged가 false인 분리 메시만 result에 추가한 뒤 true를 반환한다.

    #watchDivision(object: ModelMesh, geom: OLGeometry) -> boolean
        의존:
            U3dApp — 원본 소유 레이어; 함수: {getLayerByName()}
            ModelMesh — 레이어 이름·현재 경계; 함수: {getLayerName(), getBBox()}
            U3dModelLayer — 분리 완료 대기와 취소 정리; 함수: {_getMeshDivisionPromise(), checkDivisionMeshIdle()}
        동작:
            영역 교차 함수나 원본의 레이어 이름 함수가 없으면 false다. 원본의 진행 중인 분리 Promise와 레이어가 없으면 false이고, 같은 Promise를 현재 검색에서 이미 기다리면 true다.
            대기 집합에 Promise와 취소 정리 함수를 등록한다. 취소 정리는 요청받았고 레이어가 살아 있을 때만 분리 자원을 점검한다.
            완료 시 이 검색의 대기·정리 등록을 제거한다. 검색 소유자가 없어졌거나 앱이 사용 불가능하면 보류 end를 지우고 선택을 변경하지 않는다.
            현재 _measureGeom 또는 최초 영역과 교차하는 미해제·비휴면·표시 중 결과만 고른다. 자동 모드는 그 결과를, 수동 모드는 기존 수동 목록에 없는 결과만 비토글·다중 선택으로 반영한다.
            모든 분리가 끝나면 보류 end를 꺼내 비운 뒤 실행한다. 등록 직후에는 true를 반환하며 텍스처 로딩 자체는 레이어가 소유한다.

    #checkHelperObject(intersect: any, result: Array<any>) -> boolean
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
        동작:
            helper가 아니거나 barrier 메시이면 false이다. 원래 대상이 defined이면 교차 object를 원본으로 교체하고 결과에 추가한다. helper 경로는 true를 반환한다.

    #checkRootObject(intersect: any, result: Array<any>) -> boolean
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
        동작:
            대상의 _rootObject가 defined이면 교차 대상을 교체하여 결과에 추가하고 true, 아니면 false이다. 현재 주 호출부의 이 검사 연결은 주석 처리되어 있다.

    #checkComponent(intersect: any, result: Array<any>) -> boolean
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
            U3dApp(this._app) — 직접 사용하는 기능; 함수: {getLayerByName()}
            U3dMultipleComponentLayer(componentLayer) — 직접 사용하는 기능; 함수: {getComponentByIntersect()}
        동작:
            유효 컴포넌트 렌더 객체가 아니면 false이다. 필요한 geometry 경계를 계산한다. 다중 컴포넌트 레이어이면 교차에서 논리 컴포넌트를 조회하여 object를 바꾸고 궤적은 renderObject를 보관한다. 같은 object·instanceId·geom이 이미 검색되었으면 true이다. 결과와 중복 기록에 추가한다. 다른 레이어의 화면 거리 교차는 false이며 그 외에는 true이다. object.geometry.boundingBox가 defined가 아니면 computeBoundingBox()로 경계를 계산한다.
            intersect.object가 truthy이면:
                보조 처리를 실행한다.
            보조 처리를 실행한다.

    #checkIntersects(intersects: Array<any>, event: any) -> Array<any>
        동작:
            중복 검색 기록을 비운다. disposed 객체는 건너뛰고 sleeping 객체는 해당 영역의 분리 완료 대기를 연결한 뒤 건너뛴다. 메시·엔진 도형과 화면 거리를 가진 선·점에 대해 공유 메시, 병합 그룹, 병합 객체, 컴포넌트, helper 순서로 검사하고 처리 완료이면 다음 교차로 넘어간다. 나머지를 결과에 넣고 distance 오름차순으로 정렬한다. root 검사는 호출하지 않는다.
            보조 처리를 실행한다.

    checkGeom(scene: Object3D| Group| Scene|  UMesh, geom: OLGeometry) -> Array<{object: any, geom: OLGeometry} & Partial<{instanceId: number}>>
        인터페이스: geom은 영역 교차 판정용 OLGeometry이며 결과의 geom에도 같은 원본을 담는다. U3dIntersectLike.geom의 선언 타입과는 다르다. [확인 Q-004]
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
            THREE.Box3 — 직접 사용하는 기능; 생성자: {new Box3()}
            U3dMessage — 직접 사용하는 기능; 정적 함수: {info()}
        동작:
            숨긴 객체라도 미해제·휴면 상태이고 getBBox가 있으며 영역과 교차하면 분리 완료 대기를 연결한다. 그 밖의 숨긴 객체는 검사하지 않는다.
            scene이 없으면 빈 배열이다. 장면을 순회하면서 숨긴 객체·Scene·Group을 제외한다. Tiles 제외가 발생하면 마지막에 안내한다. 컴포넌트 렌더 객체는 필요한 경계를 계산하고 인스턴스별 visible 상태·위치로 영역 교차를 검사하여 instanceId를 붙인다. 일반 객체는 getBBox 또는 setFromObject 경계로 검사한다. 수집 결과를 공통 교차 정규화에 전달한다. scene이 truthy인 경우 순회 대상 mesh.visible가 truthy이면 컴포넌트 경계가 누락된 분기에서 computeBoundingBox()를 호출한다.
            mesh.visible가 truthy이면:
                scene가 truthy이면:
                    보조 처리를 실행한다.
            scene가 truthy이면:
                보조 처리를 실행한다.

    #searchAtScreen(e: SelectPointerEvent, hover: boolean = false) -> Array<Intersection & {screenDistance?: number}>
        의존:
            U3dApp(app) — 직접 사용하는 기능; 함수: {getCamera(), getRenderer(), getLayerByName(), getInstanceScenesFromModelLayers(), intersectFromScene(), intersectAtPixel()}
            U3dLayer(layer) — 직접 사용하는 기능; 함수: {getScene()}
            UDrawArg(app._drawArg) — 대상 미지정 시 모델 레이어 목록; 함수: {getInstanceModelLayers()}
            U3dMultipleComponentLayer — 궤적 렌더 메시의 소유 컴포넌트 조회; 함수: {getComponentByName()}
            U3dCumulativePath — 컴포넌트의 궤적 객체 조회; 함수: {getTail()}
            USimpleTail — 현재 표시 메시·월드 선분 조회; 함수: {getMesh(), getDrawSegments()}
        동작:
            카메라가 없으면 빈 배열이다. 대상 레이어가 지정되었으면 그 레이어와 장면을, 아니면 모델 레이어와 모델 장면을 읽는다. 반경 0이면 지정 장면 또는 전체 앱 광선 교차를 반환한다.
            양수 반경은 화면 원형 검색에 장면·카메라·포인터·캔버스 CSS 크기·광선 옵션을 전달한다. 궤적 선분은 객체의 직접 조회를 우선하고 다중 컴포넌트의 cumulativePath tail이 같은 메시이면 해당 선분을 쓴다. hover이면 가까운 유효 대상 하나를 요청하며 객체·논리 교차 판정 콜백을 추가한다.
            보조 처리를 실행한다.
            보조 처리를 실행한다.

    #pickAtScreen(e: SelectPointerEvent) -> Array<any>
        의존:
            U3dApp(this._app) — 직접 사용하는 기능; 함수: {getCamera()}
        동작:
            화면 후보를 구한 뒤 카메라가 없으면 빈 배열이다. 각 점을 투영하여 공통 교차 정규화에 전달하고 같은 논리 객체는 한 번만 넣는다. 누락한 점·거리 값은 원래 후보에서 보완한다. 자동 모드에서는 첫 유효 결과 이후 중단한다. 점은 intersect.point를 우선하고 null 또는 undefined일 때 hit.point를 쓰며, 거리는 intersect.distance를 우선하고 null 또는 undefined일 때 hit.distance를 쓴다.
            보조 처리를 실행한다.

    #startHover() -> void
        의존:
            U3dApp(app) — 직접 사용하는 기능; 함수: {updateData(), on(), setRenderBefore(), getRenderer()}
            Web API — 캔버스 소유 창의 크기 변경 구독; 함수: {addEventListener()}
        동작:
            hover와 범위 표시가 모두 꺼졌거나 비활성·종료 중·POINT 이외·이미 구독됨·앱 없음이면 반환한다.
            mousemove는 드래그 또는 눌린 버튼이 있으면 포인터와 강조를 비우며, 그 외에는 NDC만 저장하고 표시를 갱신한다. mousedown은 드래그 상태로 바꾸고 포인터·강조를 지운다. mouseup은 드래그를 끝내고 위치를 저장하며 mouseout은 위치·드래그·강조를 비운다.
            선택기 uuid를 붙인 이벤트 키와 렌더 전 갱신을 등록하고 캔버스 창의 resize에 범위 갱신을 연결한다.
            보조 처리를 실행한다.

    #stopHover() -> void
        의존:
            U3dApp(this._app) — 직접 사용하는 기능; 함수: {off(), removeRenderBefore()}
            Web API — 창 구독과 표시 DOM 정리; 함수: {removeEventListener(), remove()}
        동작:
            이전 종료 상태를 저장하고 종료 중으로 표시한다. 구독 목록·포인터·드래그 상태를 비우고 resize 구독·범위 DOM을 제거한다. 이전 구독이 있고 앱이 있으면 자기 앱 이벤트와 렌더 갱신만 제거한다. hover를 해제하고 finally에서 이전 종료 상태를 복원한다.
            보조 처리를 실행한다.
            보조 처리를 실행한다.

    #renderBufferCircle() -> void
        의존:
            U3dApp(this._app) — 직접 사용하는 기능; 함수: {getRenderer()}
            Web API — 표시 원 생성과 화면 배치; 함수: {createElement(), setAttribute(), appendChild(), getBoundingClientRect()}; 속성 쓰기: {hidden, style}
        동작:
            표시 꺼짐·비활성·POINT 이외·포인터 없음·드래그·반경 0·캔버스 크기 없음·유효하지 않은 NDC에서는 기존 원을 숨긴다. 원이 없으면 document.body가 있을 때만 고정 위치의 노란 원 DOM을 만들고 uuid를 기록한다.
            캔버스 화면 사각형과 CSS 크기의 비율로 NDC 위치 및 지름 2*반경을 화면 좌표로 설정한다. 사각형 크기가 0이면 숨긴다.

    #isHoverCandidate(object: Object3D) -> boolean
        동작:
            disposed·sleeping·공유 메시·타일·barrier는 false이며 그 외에는 true이다.

    #resolveHoverTarget(intersect: Intersection & {screenDistance?: number}) -> U3dSelectHoverTarget | null
        의존:
            U3dApp(this._app) — 직접 사용하는 기능; 함수: {getLayerByName()}
            U3dMultipleComponentLayer(componentLayer) — 직접 사용하는 기능; 함수: {getComponentByIntersect()}
            U3dLayer(layer) — 직접 사용하는 기능; 함수: {getBoundingBoxInfo()}
            BufferGeometry(geometry) — 직접 사용하는 기능; 함수: {getAttribute()}
        동작:
            후보가 아니면 null이다. helper는 원래 대상으로, 다중 컴포넌트 레이어는 논리 컴포넌트로 대응한다. 대상이 없으면 null이다.
            병합 메시이면 faceIndex가 안전한 0 이상 정수여야 한다. 면*3이 속한 geometry 그룹에서 U3F composed 범위 또는 레이어 boundingBoxInfo 범위를 찾는다. start·count가 안전한 정수이며 start>=0·count>0·3의 배수이고 버퍼 범위를 넘지 않아야 하며 실패하면 null이다. 논리 대상·인스턴스·부분 시작 번호로 hover 키를 만들고 원본 교차와 part를 반환한다.
            대상 식별값은 puid·현재 객체 키의 공통 규칙으로 구한다. 실제 렌더 메시 자체를 대상으로 할 때만 instanceId를 추가하고 부분 선택이면 part.start도 연결한다.
            mesh._ulayername가 defined가 아니면:
                보조 처리를 실행한다.

    #updateHover() -> void
        동작:
            범위 원은 먼저 갱신한다. hover가 꺼졌거나 비활성·POINT 이외·포인터 없음·드래그이면 검색하지 않는다. 첫 유효 논리 대상을 찾고 이전 키·논리 객체·원본 교차 객체가 모두 같으면 유지한다. 그 외에는 새 hover로 바꾼다.
            보조 처리를 실행한다.
            #hoverEnabled가 truthy이면:
                보조 처리를 실행한다.

    #setHover(next: U3dSelectHoverTarget | null) -> void
        의존:
            BufferGeometry(geometry) — 직접 사용하는 기능; 함수: {addEventListener(), removeEventListener()}
            U3dApp(this._app) — 직접 사용하는 기능; 함수: {updateData()}
            UEventDispatcher — 직접 사용하는 기능; 함수: {dispatchEvent()}
        동작:
            이전 상태와 복원·해제 함수를 잡은 뒤 새 대상을 저장하고 이전 구독과 재질을 복원한다. 재진입으로 대상이 달라졌으면 반환한다. 앱이 사용할 수 없으면 대상을 null로 만든다.
            새 대상이 있으면 원본 객체 removed와 geometry dispose를 구독하여 아직 같은 대상일 때 hover를 비운다. 자동 강조이면 색을 적용한다. 전후 대상이 모두 없으면 반환한다. 앱을 갱신하고 전후 논리 키·객체·원본 객체가 모두 같으면 이벤트를 생략한다. 그 외에는 previous·current·intersection과 현재 대상에만 작용하는 applyColor를 담아 hoverchange를 발송한다.
            보조 처리를 실행한다.
            next가 truthy이면:
                보조 처리를 실행한다.
            next가 truthy이면:
                보조 처리를 실행한다.

    #applyHoverColor(hit: U3dSelectHoverTarget, color: ColorRepresentation) -> void
        의존:
            THREE.Color — 직접 사용하는 기능; 생성자: {new Color()}
            U3dApp(this._app) — 직접 사용하는 기능; 함수: {updateData()}
        동작:
            현재 hover가 아니거나 클릭 선택이 같은 논리 대상을 포함하면 적용하지 않는다. 인스턴스 선택에 instanceId가 있으면 같은 인스턴스만 제외한다. 이전 강조를 복원한 뒤 재진입 여부를 확인하고 내부 임시 색상 적용을 요청한다. 대상이 유지되면 반환한 복원 함수를 저장하고 아니면 즉시 해제한다. 앱을 갱신한다.
            보조 처리를 실행한다.
            보조 처리를 실행한다.

    #containsHoverTarget(object: USelect, hit: U3dSelectHoverTarget) -> boolean
        의존: U3dComponentPosition — 인스턴스 배치의 독립 선택 여부와 실제 객체 조회; 함수: {getInstanced(), getObject()}
        동작:
            같은 논리 객체이면 true이다. 인스턴스 컴포넌트가 다른 논리 대상이면 false이다. getObject 결과 또는 원본을 루트로 보고 교차 객체의 부모를 올라가 같은 루트를 만나면 true, 아니면 false이다.

    clearHover(object?: USelect | Array<USelect>) -> void
        동작:
            인수가 있고 현재 hover가 있으면 입력 객체들 중 hover를 포함하는 대상이 하나도 없을 때 유지한다. 그 외에는 hover를 null로 바꾼다.
            보조 처리를 실행한다.
            보조 처리를 실행한다.

    #singleClick(e: SelectPointerEvent) -> boolean|void
        의존:
            UEventDispatcher — 직접 사용하는 기능; 함수: {dispatchEvent()}
            U3dApp(app) — 직접 사용하는 기능; 함수: {getLayerByName(), intersectFromScene(), intersectAtPixel()}
            U3dLayer(layer) — 직접 사용하는 기능; 함수: {getScene()}
        동작:
            앱이 없으면 반환한다. hover를 비우고 이전 측정 피처가 있으면 clear한다. Shift가 아니면 선택을 비우며 start(data=null)를 발송한다.
            양수 반경은 화면 검색을, 반경 0은 지정 레이어 장면 또는 전체 앱 광선을 쓰며 공통 교차 정규화를 한다. 교차가 없으면 선택을 비우고 end를 발송하여 false를 반환한다. 있으면 단일 토글 선택·작업 정보를 만들고 change와 end를 발송한다.
            _app가 truthy이면:
                보조 처리를 실행한다.

    #polygonClick(e: SelectPointerEvent) -> boolean|void
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
            UEventDispatcher — 직접 사용하는 기능; 함수: {dispatchEvent()}
            U3dApp(app) — 직접 사용하는 기능; 함수: {intersectAtPixel(), geographicToVector3(), getLayerByName()}
            UDrawArg(drawArg) — 직접 사용하는 기능; 함수: {getWorldToGeographic(), getInstanceScenesFromModelLayers()}
            U3dShaderMeasureLayer(selectLayer) — 직접 사용하는 기능; 함수: {addMeasurePoint()}
            UDEF — 직접 사용하는 기능; 정적 함수: {disposeObject3D()}
            U3dBilboard — 직접 사용하는 기능; 정적 함수: {makeBilboard()}
            U3dLayer(layer) — 직접 사용하는 기능; 함수: {getScene()}
            UMeasureFeature(feature) — 직접 사용하는 기능; 함수: {getGeometry()}
        동작:
            앱·측정 레이어가 없으면 반환한다. 이전 피처가 있으면 clear하고 start를 발송한다. 첫 교차점의 z가 NaN 또는 음수이면 0으로 보정한다. 점이 없으면 디버그 로그 후 반환한다.
            LINE의 첫 측정점 또는 그 외 모드에서 선택을 비운다. 측정점과 라벨을 추가하며 CIRCLE의 두 번째 이후 점은 라벨을 정리하고 중심·현재 라벨을 만든다. 주석 장면에 그룹을 연결한다. 지정 레이어 또는 모델 장면을 영역 검사하여 비토글 선택하고 _measureGeom과 change 작업을 갱신한다. true를 반환한다.
            보조 처리를 실행한다.

    #polygonDblclick() -> void
        동작:
            라벨 자원을 해제·분리하고 end 작업 이벤트를 발송한다. 측정점을 확정하고 피처가 있으면 geometry를 저장한다.
            보조 처리를 실행한다.

    #setSelected(intersects: Array<any>, isSingle: boolean = true, togglable: boolean = true) -> void
        동작:
            자동 모드에서 빈 입력은 무동작이다. 각 교차의 선택 여부에 따라 토글 해제/추가 또는 미선택 추가를 수행하며 isSingle이면 첫 항목 뒤 반환한다. 수동 모드이면 모든 object를 수동 목록에 추가한다.
            _auto가 truthy이면:
                보조 처리를 실행한다.
            _auto가 truthy이면:
                togglable가 truthy이면:
                    보조 처리를 실행한다.

    #setWork(intersects: Array<any> = []) -> {type:string, points:Array<GeoPosition|NormalizedPosition>, worlds:Array<WorldPosition>}
        의존:
            U3dApp(self._app) — 직접 사용하는 기능; 함수: {vector3ToGeoGraphic()}
            U3dSelectionBox(selectBox) — 직접 사용하는 기능; 함수: {getStartPointNormalized(), getEndPointNormalized()}
        동작:
            POINT는 _posList 원본에 교차점을 위경도로 추가하고 worlds에 월드점을 담는다. 자동 모드는 첫 교차만 읽고 수동 모드는 전부 읽는다. BOX는 선택 박스가 있으면 시작·끝 정규화 좌표를 사용한다. 나머지는 측정점 목록이 있을 때 CIRCLE은 첫·끝, 나머지는 원본 목록을 쓴다. type·points·worlds를 반환한다.
            보조 처리를 실행한다.

    #raiseEvent(type: string, work?: any) -> void
        의존:
            UEventDispatcher — 직접 사용하는 기능; 함수: {dispatchEvent()}
        동작:
            END이고 분리 대기가 남았으면 같은 type·work로 다시 발송할 함수를 저장하고 즉시 발송하지 않는다. 다른 이벤트와 대기가 없는 END는 바로 발송한다.
            _workEvent를 저장하고 자동 모드이면 선택 사전의 값 배열, 수동이면 수동 목록 원본을 data로 하는 type·work 이벤트를 발송한다.

    #setSelectBoxMode() -> void
        의존:
            UGroup — 직접 사용하는 기능; 생성자: {new UGroup()}
            U3dApp(self._app) — 직접 사용하는 기능; 함수: {getLayerByName(), getInstanceScenesFromModelLayers(), disableCameraMove(), getRenderer()}
            U3dLayer(layer) — 직접 사용하는 기능; 함수: {getScene(), getComponentList()}
            UDrawArg(drawArg) — 직접 사용하는 기능; 함수: {getInstanceModelLayers()}
            U3dSelectionBox — 직접 사용하는 기능; 생성자: {new U3dSelectionBox()}
            defined — 직접 사용하는 기능; 함수: {defined()}
            U3dApp(app) — 직접 사용하는 기능; 함수: {on(), off()}
            UEventDispatcher — 직접 사용하는 기능; 함수: {dispatchEvent()}
        동작:
            지정 레이어가 있으면 그 장면과 컴포넌트 목록을, 없으면 모델 레이어의 컴포넌트와 앱의 모델 장면을 사용한다. 검색용 그룹은 scene을 children에 빌려 담는다. 카메라 조작을 막는다.
            박스가 없으면 현재 카메라로 만들고 renderer helper를 연결한다. down은 선택을 비우고 현재 카메라와 포인터를 반영한 뒤 pointerdown을 발송하며 move 구독을 한 번 등록한다. move는 카메라·포인터를 갱신하고 결과가 있을 때 change 작업과 pointermove를 발송한다. up은 결과가 있을 때 선택을 확정하고 end·pointerup을 발송한 후 move 구독을 제거한다. 기존 박스이면 현재 카메라와 검색 장면을 갱신한다.
            보조 처리를 실행한다.
            boxEvent.selectBox가 defined이면:
                보조 처리를 실행한다.
            boxEvent.pointerMoveId가 falsy이면:
                boxEvent.selectBox가 defined이면:
                    보조 처리를 실행한다.

    #getInstancesToComponent(instances: Record<string, Array<any>>, componentList: Array<U3dComponentPosition>) -> Array<U3dComponentPosition>
        의존:
            U3dComponentPosition — 배치 방식·번호와 실제 객체; 함수: {getInstanced()}; 속성 읽기: {instanceId, _object}
            U3dComponentInstancedPosition — 다중 인스턴스의 렌더 그룹; 속성 읽기: {instancedGroup}
            Object3D — 렌더 그룹의 UUID 대응 검색; 함수: {traverse()}
        동작:
            인스턴스 UUID별 번호 목록이 비어 있지 않을 때 컴포넌트의 인스턴스 그룹 또는 일반 그룹을 순회한다. 같은 UUID와 인스턴스 번호 또는 일반 객체의 대응을 찾은 컴포넌트를 추가하여 반환한다.

    #getSelectBoxChangeEvent(selectResults: any, componentList: Array<U3dComponentPosition>) -> Array<U3dComponentPosition>
        인터페이스: 선언 반환형은 컴포넌트 배열이다. 실제 반환 배열은 일반 객체의 교차 정보와 논리 컴포넌트를 함께 포함한다. [확인 Q-003]
        동작:
            선택을 비우고 인스턴스의 논리 컴포넌트를 구한다. 일반 객체를 교차 형식으로 만들어 공통 정규화를 거친 뒤 논리 컴포넌트를 붙여 반환한다. 이 단계에서 강조 추가는 하지 않는다.
            보조 처리를 실행한다.

    #addSelectBoxEvent(selectResults: any, componentList: Array<U3dComponentPosition>) -> Array<any>
        동작:
            선택을 비우고 논리 컴포넌트와 정규화한 일반 객체를 자동이면 선택, 수동이면 목록에 추가한다. 교차 결과에 논리 컴포넌트 원본을 붙여 반환한다.
            보조 처리를 실행한다.
            _auto가 truthy이면:
                보조 처리를 실행한다.

    #validateMode(mode: string) -> boolean
        동작:
            point·area·line·circle·box만 true이고 다른 값은 false이다.

    setOutline(selected: USelect) -> void
        의존:
            U3dObjectBarrier — 직접 사용하는 기능; 생성자: {new U3dObjectBarrier()}
            U3dObjectBarrier(self._effector) — 직접 사용하는 기능; 함수: {setBarrier()}
        동작:
            외곽선 관리자가 없으면 앱으로 생성한다. _selectedPulse를 지역 값으로 읽지만 관리자 생성이나 스타일에 전달하지 않는다. [확인 Q-001]
            현재 강조색·불투명도와 옵션의 mode 기본 BASIC·renderOrder 기본 PASS1 및 bounceSpeed·farPoint·lineWidth·width를 setBarrier에 전달한다.
            보조 처리를 실행한다.

    setRing(selected: USelect) -> void
        의존:
            U3dSelectionRing — 직접 사용하는 기능; 생성자: {new U3dSelectionRing()}
            U3dSelectionRing(this._ringEffector) — 직접 사용하는 기능; 함수: {set()}
        동작:
            앱·대상이 없거나 객체가 아니거나 BufferGeometry·타일·지형 평면이면 반환한다. 링 관리자를 지연 생성한다. 이미 선택한 동일 객체의 저장 키를 우선하고 없으면 객체 키를 구해 대상·현재 스타일로 링을 갱신한다.
            보조 처리를 실행한다.

    setMode(mode: string) -> void
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
            U3dShaderMeasureLayer(this._selectLayer) — 직접 사용하는 기능; 함수: {setMeasureType()}
        동작:
            지원하지 않는 모드면 Error를 던진다. hover 구독을 정리하고 mode를 저장한다. 측정 레이어가 없으면 반환한다. 모드에 따라 측정 형식을 정하고 입력 구독을 교체한 뒤 clear한다.
            보조 처리를 실행한다.
            _selectLayer가 defined이면:
                보조 처리를 실행한다.

    active() -> void
        동작:
            이미 활성이면 반환한다. 입력 키가 남아 있으면 먼저 deactive한다. 활성 상태를 true로 하고 현재 모드 입력을 연결한다.
            _isActive가 falsy이면:
                보조 처리를 실행한다.

    deactive() -> void
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
        동작:
            try에서 입력을 해제한다. 앱이 사용할 수 없으면 측정·장면 처리 없이 반환한다. 측정 피처를 확정하고 작업 이벤트가 defined이며 end가 아니면 clear한다. finally에서 활성 상태를 false로 만든다.
            보조 처리를 실행한다.

    remove() -> void
        의존:
            UEventDispatcher — 직접 사용하는 기능; 함수: {removeEventListenerAll()}
        동작:
            deactive를 시도하고 성공·실패와 무관하게 clear를 시도한다. clear의 결과와 무관하게 자기 이벤트를 모두 제거하고 내부 관리 자원을 해제한다.
            보조 처리를 실행한다.

    drawByWork(work: {type:string, points:Array<GeoPosition>}) -> boolean|undefined
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
            U3dShaderMeasureLayer(this._selectLayer) — 직접 사용하는 기능; 함수: {setMeasureType()}
            U3dApp(self._app) — 직접 사용하는 기능; 함수: {getLayerByName()}
            U3dLayer(layer) — 직접 사용하는 기능; 함수: {getScene()}
            U3dApp(app) — 직접 사용하는 기능; 함수: {intersectModelAtGeographicPoint(), geographicToVector3()}
            U3dShaderMeasureLayer(selectLayer) — 직접 사용하는 기능; 함수: {addMeasurePoint()}
            U3dBilboard — 직접 사용하는 기능; 정적 함수: {makeBilboard()}
            UMeasureFeature(feature) — 직접 사용하는 기능; 함수: {getGeometry()}
            UDrawArg(drawArg) — 직접 사용하는 기능; 함수: {getInstanceScenesFromModelLayers()}
            U3dShaderMeasureLayer(self._selectLayer) — 직접 사용하는 기능; 함수: {setMeasureType()}
        동작:
            work·type·points 또는 측정 레이어가 없으면 반환한다. 이전 분리 대기가 남았으면 먼저 선택을 비워 이전 검색의 늦은 완료를 무효화한다. 모드에 맞는 측정 형식을 정한다. POINT는 각 위경도 점에서 모델을 조회·정규화·비토글 선택하고 end를 발송한 뒤 반환한다.
            CIRCLE에서 두 점 이상이면 첫·끝 점을 측정점과 중심·현재 라벨로 만들며 AREA·LINE은 모든 점을 추가한다. 주석 장면에 그룹을 연결하고 피처가 없으면 반환한다. 모델 장면을 영역 검사하여 선택한다. 라벨을 정리·분리하고 피처를 확정하여 geometry를 저장한 뒤 end를 발송하고 현재 측정 형식을 다시 설정하여 true를 반환한다.
            _selectLayer가 defined이면:
                보조 처리를 실행한다.

    createVerticalObject(result: USelect) -> UGroup|undefined
        의존:
            UDrawArg — 객체 위치의 표시 지면 높이; 함수: {getRenderHeightAtPoint()}
            defined — 직접 사용하는 기능; 함수: {defined()}
            THREE.Vector3 — 직접 사용하는 기능; 생성자: {new Vector3()}
            THREE.Box3 — 직접 사용하는 기능; 생성자: {new Box3()}
            THREE.Color — 직접 사용하는 기능; 생성자: {new Color()}
            UGroup — 직접 사용하는 기능; 생성자: {new UGroup()}
            U3dApp(self._app) — 직접 사용하는 기능; 함수: {getScene()}
            UDEF — 직접 사용하는 기능; 정적 함수: {disposeObject3D()}
        동작:
            타일 또는 geometry·경계 조회가 없는 대상이면 undefined이다. 표시 지면 높이가 없거나 INVALID·NO_DATA이면 0으로 둔다. geometry의 월드 경계 또는 getBoundingBox로 크기와 위치를 얻고 길이가 0이면 1을 사용한다.
            빔 반경은 min(길이,100)/4이고 지면 반경은 그 값+1, 빔 불투명도 0.75·지면 부드러움 0.6이다. 빔과 평면을 그룹에 묶어 앱 장면에 추가하고 대상 userData.verticalObjects의 이 선택기 항목을 기록한다. 이전 그룹이 있으면 자원 해제·분리 후 교체하며 새 그룹을 반환한다.
            보조 처리를 실행한다.

    #createBeam(markerParams: any, object: any) -> Mesh
        의존:
            verticalShader — 수직 빔 표현; 속성 읽기: {vertexShader, fragmentShader}
            THREE.CylinderGeometry — 직접 사용하는 기능; 생성자: {new CylinderGeometry()}
            THREE.ShaderMaterial — 직접 사용하는 기능; 생성자: {new ShaderMaterial()}
            THREE.Mesh — 직접 사용하는 기능; 생성자: {new Mesh()}
            THREE.Vector3 — 직접 사용하는 기능; 생성자: {new Vector3()}
        동작:
            열린 24분할 단위 원기둥과 수직 셰이더 재질을 만든다. 지면과 객체 높이 차의 절댓값을 최소 0.001로 하여 Y축 길이를 설정하고 X 회전으로 Z축에 맞춘다. 반경·중간점·경계 높이·최대 깊이를 반영하고 renderOrder=1, exceptAO=true로 둔다. 높이가 5 미만이면 숨겨 반환한다.

    #createGroundHighLight(markerParams: any, object: any) -> Mesh
        의존:
            planeShader — 지표면 강조 표현; 속성 읽기: {vertexShader, fragmentShader}
            THREE.PlaneGeometry — 직접 사용하는 기능; 생성자: {new PlaneGeometry()}
            THREE.ShaderMaterial — 직접 사용하는 기능; 생성자: {new ShaderMaterial()}
            THREE.Mesh — 직접 사용하는 기능; 생성자: {new Mesh()}
        동작:
            5*5 평면과 지표 셰이더로 강조 메시를 만든다. transparent=true·depthWrite=false·polygonOffsetFactor=-4이며 불투명도는 0.45이다. 반경의 두 배를 scale에 반영하고 XY 위치와 지면+0.01 높이에 배치하여 visible=true로 반환한다.

    removeVerticalObject(key: string, selected: USelect) -> void
        의존:
            UDEF — 직접 사용하는 기능; 정적 함수: {disposeObject3D()}
        동작:
            선택 키의 수직 그룹이 있으면 자원을 해제하고 부모에서 분리한다. 대상 userData의 선택기별 그룹 연결도 해제하고 사전의 키를 제거한다.

    getMode() -> string
        동작:
            mode가 truthy이면 그 값을 반환하고, 아니면 빈 문자열을 반환한다.

    setExceptTexture(exceptTexture: boolean) -> void
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
            U3dApp(self._app) — 직접 사용하는 기능; 함수: {updateData()}
        동작:
            입력이 defined이면 설정을 갱신한다. 모든 선택 모델에서 병합 기능이 있으면 편집 스타일을 갱신하고 텍스처 제외를 적용한다. 앱을 갱신한다.
            model.isMerged가 truthy이면:
                보조 처리를 실행한다.
            보조 처리를 실행한다.

    isExceptTexture() -> boolean|undefined
        동작:
            설정이 truthy이면 그 값을 반환하며 꺼진 경우 undefined이다.

    isActive() -> boolean
        동작:
            현재 활성 상태를 반환한다.

    clear() -> void
        의존:
            UGroup — 라벨 그룹 정리; 함수: {clear()}
            U3dShaderMeasureLayer — 측정 중인 도형 정리; 함수: {clearMeasure()}
            Object3D — 주석 장면에서 라벨 그룹 분리; 함수: {remove()}
        동작:
            선택과 hover를 해제하고 라벨 자원을 정리한다. 앱이 사용 가능할 때만 주석 장면 분리와 측정 레이어의 clearMeasure를 수행한다. 측정 피처를 undefined로 만든다.
            보조 처리를 실행한다.

    setApp(app: U3dApp) -> void
        의존:
            U3dSelectionRing(this._ringEffector) — 직접 사용하는 기능; 함수: {dispose()}
            defined — 직접 사용하는 기능; 함수: {defined()}
            U3dShaderMeasureLayer(this._selectLayer) — 직접 사용하는 기능; 함수: {setMeasureType(), show()}
        동작:
            다른 앱으로 바꾸며 현재 활성이면 deactive한다. hover를 비우고 링 관리자를 해제한다. 앱·그리기 인자·측정 레이어를 연결하고 측정 레이어가 없으면 반환한다. AREA·LINE·CIRCLE에 맞는 측정 형식을 정하고 레이어를 표시한 뒤 clear한다.
            보조 처리를 실행한다.
            _selectLayer가 defined이면:
                보조 처리를 실행한다.

    getSelectCount() -> number
        동작:
            선택 사전 키의 개수를 반환한다.

    getMeasurePointList() -> undefined | Array<GeoPosition>
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
        동작:
            측정 레이어와 측정점 배열이 defined이며 길이가 양수이면 원본 배열을 반환하고 그 외에는 undefined이다.

    getSelectWork() -> {type:string, points:Array<GeoPosition>}|void
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
            UMeasureFeature(measureFeature) — 직접 사용하는 기능; 함수: {getMeasureVectors()}
            U3dApp(self._app) — 직접 사용하는 기능; 함수: {vector3ToGeoGraphic()}
        동작:
            모드가 falsy이면 반환한다. POINT는 type·_posList 원본으로 작업을 반환하고 내부 목록을 새 빈 배열로 교체한다. 다른 모드는 피처가 없으면 반환한다. 각 측정 벡터를 위경도로 바꾼 type·points 작업을 반환한다.
            보조 처리를 실행한다.

    clearDrawnSelect() -> void
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
            U3dApp(self._app) — 직접 사용하는 기능; 함수: {removeMeasureFeature()}
            U3dShaderMeasureLayer — 확정된 측정 도형 정리; 함수: {clearDrawFeature()}
        동작:
            선택을 비우고 피처가 있으면 앱에서 제거하여 undefined로 둔다. 라벨 그룹을 비워 주석 장면에서 분리하고 측정 그리기 도형을 정리한다.
            보조 처리를 실행한다.

    clearSelect(isCheckIdle: boolean = false) -> void
        의존:
            U3dSelectionRing(this._ringEffector) — 직접 사용하는 기능; 함수: {dispose()}
            UDrawArg(this._drawArg) — 선택 해제 후 표시 갱신; 함수: {setUpdateDate()}
        동작:
            현재 검색의 owner·보류 end를 비우고 pending을 제거한다. 등록된 정리를 isCheckIdle과 앱 가용성에 따라 실행한 뒤 새 검색 상태로 교체하여 늦은 분리 결과가 취소된 선택을 복원하지 못하게 한다.
            hover를 비우고 모든 저장 키의 선택을 isCheckIdle과 함께 제거한다. 선택 사전을 새로 비우고 링을 해제하며 수동 목록·위치 목록을 비운다. 앱이 사용 가능할 때만 그리기를 갱신한다.
            보조 처리를 실행한다.

    getSelected() -> Array<USelect>
        동작:
            선택 사전 값의 새 배열을 반환한다.

    getSelectedKey() -> Array<string>
        동작:
            선택 사전 키의 새 배열을 반환한다.

    getSelectedAsKey(key: string) -> USelect|undefined
        동작:
            해당 키의 현재 값 또는 undefined를 반환한다.

    setSelectedAsKey(key: string, select: USelect) -> void
        동작:
            해당 키를 주어진 원본 참조로 직접 덮어쓴다. 강조·구독·이벤트는 추가하지 않는다.

    getObjectKey(object: USelect) -> string | undefined
        인터페이스: object는 선택 대상으로 식별할 객체이다. 반환 문자열은 레이어 이름과 객체 식별값을 결합한 선택 사전의 키이며 원본 데이터의 속성 ID와는 다르다.
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
        동작:
            makeObjectKey로 키를 만든다. 결과가 null·undefined가 아니면 그대로 반환하고, 그 외에는 undefined를 반환한다.

    setSelectorColor(opt?: SelectorColorOption) -> void
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
            U3dShaderMeasureLayer(self._selectLayer) — 직접 사용하는 기능; 함수: {setStyle()}
        동작:
            측정 레이어 또는 옵션이 undefined이면 반환한다. fill·stroke에서 정의된 값은 입력을, 그 외에는 레이어 기본 색·너비를 사용하여 setStyle한다.

    resetSelectorColor() -> void
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
            U3dShaderMeasureLayer(self._selectLayer) — 직접 사용하는 기능; 함수: {resetStyle()}
        동작:
            측정 레이어가 defined이면 기본 영역 스타일로 복원한다.

    setSelectedColor(color: ColorRepresentation, opacity: number) -> void
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
            U3dApp(self._app) — 직접 사용하는 기능; 함수: {updateData()}
        동작:
            선택 사전이 없으면 반환한다. ring은 색·불투명도 0도 저장하며 다른 방식은 truthy 입력만 갱신한다. 불투명도를 Number로 변환한다. 각 모델의 편집 스타일과 현재 강조 방식 및 수직 객체 uniform 색을 갱신하고 앱 표시를 요청한다.
            self._selected가 defined이면:
                보조 처리를 실행한다.
            model.isMerged가 truthy이면:
                self._selected가 defined이면:
                    보조 처리를 실행한다.

    resetSelectedColor() -> void
        의존:
            U3dApp(self._app) — 직접 사용하는 기능; 함수: {updateData()}
        동작:
            ring이면 원래 강조색·불투명도로 갱신하여 반환한다. 다른 방식은 강조색을 원래 값으로 저장한다. 궤적은 setColor로 처리하고 일반 단일·배열 재질은 원래 강조색·불투명도를 직접 설정하여 needsUpdate로 만든다. 앱을 갱신한다.
            보조 처리를 실행한다.

    clearHighlights() -> void
        의존:
            U3dSelectionRing(self._ringEffector) — 직접 사용하는 기능; 함수: {dispose()}
            U3dApp(self._app) — 직접 사용하는 기능; 함수: {updateData()}
            U3dObjectBarrier(self._effector) — 직접 사용하는 기능; 함수: {removeBarrier()}
        동작:
            ring이면 링 관리자만 해제하고 갱신한다. outline은 각 외곽선을 제거하고 텍스처를 복원한다. 그 외에는 대상의 restoreMaterial 또는 자식 재질 복원을 수행한다. 선택 사전은 유지하고 앱을 갱신한다.
            보조 처리를 실행한다.
            보조 처리를 실행한다.

    override on(type: string, listener: EventCallBack) -> string | null
        의존:
            UEventDispatcher.prototype.on — 직접 사용하는 기능; 정적 함수: {call()}
        동작:
            부모 UEventDispatcher의 on에 type·listener를 전달하고 등록 결과를 반환한다.

    override off(type?: string, listener?: function | string) -> void
        의존:
            UEventDispatcher.prototype.off — 직접 사용하는 기능; 정적 함수: {call()}
        동작:
            부모 UEventDispatcher의 off에 type·listener를 전달한다.

    removeSelected(object: USelect) -> void
        의존: UDrawArg(this._drawArg) — 선택 해제 후 표시 갱신; 함수: {setUpdateDate()}
        동작:
            해당 대상의 hover를 비운다. ring이면 저장한 동일 원본 참조의 키를 우선하여 제거한다. 그 외에는 계산한 키가 선택되어 있을 때 제거한다. 앱이 사용 가능할 때만 그리기를 갱신한다.
            보조 처리를 실행한다.

    getClickId() -> string|undefined
        동작:
            저장한 click 키를 반환한다.

    getDbClickId() -> string|undefined
        동작:
            저장한 dblclick 키를 반환한다.

    addSelected(object: USelect | Array<USelect>, intersect?: U3dIntersectLike) -> Promise<void>
        의존:
            deferredPromise — 직접 사용하는 기능; 함수: {deferredPromise()}
            defined — 직접 사용하는 기능; 함수: {defined()}
            UDrawArg(this._drawArg) — 선택 반영 후 표시 갱신; 함수: {setUpdateDate()}
        동작:
            앱이 사용 가능하지 않으면 이미 이행된 Promise를 반환한다. 대상 hover를 비우고 deferredPromise를 생성한다. 허용하는 그룹·메시·선·점·도형·컴포넌트·Tiles이면 공유 메시를 제외하여 선택 처리하고 배열이면 각 항목을 재귀 호출한다.
            배열 내부의 반환 Promise가 있으면 모두 수집하고 Promise.all로 기다린다. 하나라도 실패하면 바깥 완료 객체도 같은 이유로 거부하며, 모든 항목이 성공해야 바깥 Promise를 이행한다. 그 밖에는 선택 사전이 defined이면 완료 객체를 이행하고 아니면 거부한다. 그리기 갱신은 호출 중에 실행하고 완료 Promise를 반환한다. 내부 선택의 동기 예외는 Promise로 변환하지 않고 밖으로 전달된다.
            보조 처리를 실행한다.

    setTexture(model: USelect, exceptTexture: boolean) -> void
        의존:
            defined — 직접 사용하는 기능; 함수: {defined()}
            U3dMessage — 직접 사용하는 기능; 정적 함수: {info()}
        동작:
            대상이 null·undefined이면 반환한다. 텍스처 제외 기능을 제공하면 해당 함수에 위임하여 반환하고, 그 외에는 순회 가능한 대상만 처리한다.
            자식 메시·엔진 도형의 재질에서 map·normalMap을 처음에만 백업하여 감추거나 백업으로 복원한 뒤 제거한다. 배열 재질에 _pickMaterials가 있으면 그 목록의 인덱스만 처리하며 빈 목록이면 아무 재질도 처리하지 않는다.
            제외 요청 중 비BIM U3DTilesMesh는 안내 후 그 메시를 건너뛴다. 적용 재질의 갱신을 요청하고 _exceptTexture를 설정하거나 복원 시 삭제한다.
            model가 defined이면:
                보조 처리를 실행한다.

    setColor(selected: USelect, color: ColorRepresentation, opacity: number, intersect?: U3dIntersectLike) -> void
        동작:
            강조 색상 처리 대상을 정한다. pickMaterial 함수가 있고 isBIM 기능이 없거나 호출 결과가 falsy일 때만 pickMaterial에 위임하여 반환한다.
            그 밖에는 순회 가능한 대상의 메시·선·점·엔진 도형마다 재질 색상을 적용한다. 순회 기능이 없으면 반환한다.
            보조 처리를 실행한다.
            보조 처리를 실행한다.

isValidComponentModelType(mesh: any) -> boolean
    동작:
        인스턴스·배치 메시, isInstancedMesh, type이 component 또는 userData.type이 trailMesh이면 true이다.

pointDispose(poiGroup: any) -> void
    의존:
        defined — 직접 사용하는 기능; 함수: {defined()}
    동작:
        그룹이 undefined이거나 UGroup이 아니거나 자식이 없으면 반환한다. 자식과 한 단계 하위 객체의 geometry·map·material 및 직접 dispose를 호출한다. 부모 children 배열을 직접 비우지는 않는다.

dispose() -> void
    의존:
        U3dObjectBarrier(self._effector) — 직접 사용하는 기능; 함수: {dispose()}
        U3dSelectionRing(self._ringEffector) — 직접 사용하는 기능; 함수: {dispose()}
    동작:
        style을 undefined로 하고 선택·복원 사전을 비우며 측정 geometry를 undefined로 만든다. 외곽선 관리자가 있으면 dispose하고 링을 dispose하여 링 참조를 undefined로 만든다. 외곽선 참조를 undefined로 바꾸지는 않는다.

clearMeasureFeature() -> void
    의존:
        defined — 직접 사용하는 기능; 함수: {defined()}
        U3dApp(self._app) — 직접 사용하는 기능; 함수: {removeMeasureFeature()}
    동작:
        측정점을 먼저 확정한다. 피처가 defined이면 앱에서 제거하고 undefined로 만든다.
        보조 처리를 실행한다.

commitFeature() -> void
    의존:
        U3dApp(this._app) — 직접 사용하는 기능; 함수: {commitMeasurePoint()}
        defined — 직접 사용하는 기능; 함수: {defined()}
    동작:
        앱에서 측정점을 확정하고 결과가 defined이면 측정 피처로 저장한다.

addSelected_(object: USelect, intersect?: U3dIntersectLike, isChangeStyle: boolean = true) -> void
    의존:
        defined — 직접 사용하는 기능; 함수: {defined()}
        U3dApp(self._app) — 직접 사용하는 기능; 함수: {getLayer()}
    동작:
        입력이 undefined이면 반환한다. ring의 동일 원본 중복 선택은 필요할 때 링만 갱신하여 반환한다. 레이어와 식별자를 구해 레이어 존재에 따라 선택을 등록한다.
        새 등록 결과가 defined이며 스타일 변경 요청이면 현재 방식의 강조·텍스처 제외를 적용하고 수직 객체 옵션이 켜졌으면 키별 보조 객체를 만든다. 결과에 원본 intersect를 저장한다.
        object가 defined이면:
            보조 처리를 실행한다.
        isChangeStyle가 truthy이면:
            object가 defined이면:
                보조 처리를 실행한다.
        _setVerticalObject가 truthy이면:
            isChangeStyle가 truthy이면:
                object가 defined이면:
                    보조 처리를 실행한다.

addSelectedOnLayer(object: any, layerName: string, id: string | number | undefined, intersect: any) -> any
    의존:
        U3dApp(self._app) — 직접 사용하는 기능; 함수: {getLayer()}
        defined — 직접 사용하는 기능; 함수: {defined()}
    동작:
        레이어가 없으면 Error를 던진다.
        object가 defined이면:
            선택 키가 이미 등록되어 있으면 반환값 없이 마친다. 신규 키이면 사전에 원본을 저장한다.
            새로 저장한 객체의 puid가 비어 있지 않은 문자열이고 getBBox와 그 결과가 defined인 경우에만 다음 재로딩 연결을 수행한다.
                puid를 로드 대상 ID로 사용한다. auto=false이면 객체의 현재 색·불투명도를 사용한다.
                분리 모델은 병합 원본 관계와 편집 스타일을 반영하여 로드 대상 ID를 얻는다.
                병합 모델이며 재질이 배열이고 intersect.faceIndex가 defined이면 부분 재질 처리를 수행한다. faceIndex 0도 포함하며 교차 정보가 없으면 전체 모델 선택으로 유지한다.
                선택 키와 대상별 교차 정보로 로드 구독을 연결한다.
            신규 선택은 재로딩 연결 여부와 관계없이 객체를 반환한다.
        object가 null·undefined이면 true 대기 표식을 저장한다.

handleMergedObject(object: any, layer: U3dModelLayer, color: ColorRepresentation, opacity: number, eventName: string) -> string
    의존:
        defined — 직접 사용하는 기능; 함수: {defined()}
        U3dLayer(layer) — 직접 사용하는 기능; 함수: {setPickMaterial()}
    동작:
        현재 모델의 puid로 split 편집 기록을 조회하고 U3F 레이어이면 원래 병합 ID를 로드 대상 ID로 사용한다. 단일 재질 또는 자식이 있는 모델은 선택 재질을 요청하고 분할 결과의 재질·외곽선을 보완한다. 편집 정보에 현재 방식의 색상 적용 여부·색·불투명도·텍스처 제외를 저장한다. 나머지는 입력 로드 대상 ID를 반환한다.
        보조 처리를 실행한다.
        _auto가 truthy이면:
            보조 처리를 실행한다.

handleMaterialSplit(object: any, layer: any, color: ColorRepresentation, opacity: number, intersect: any) -> void
    의존:
        U3dLayer(layer) — 직접 사용하는 기능; 함수: {getMaterialIndexByFace(), editFilter()}
    동작:
        intersect.faceIndex로 재질 분할 정보를 조회한다. 정보가 있으면 미등록 자식 ID를 편집 목록에 추가한다. 기존 편집 기록에는 색 적용 여부·색·불투명도만 갱신하며, 새 기록을 만들 때는 텍스처 제외도 함께 저장한다. 교차 정보가 없으면 faceIndex 접근에서 동기 오류가 발생한다.
        보조 처리를 실행한다.

handleLoadEvent(object: any, layer: any, key: string, eventName: string, intersect: any) -> void
    의존:
        U3dModelLayer — 기존 구독 조회·새 구독 등록; 속성 읽기: {_listeners}; 함수: {addEventListener()}
        U3dObjectBarrier — 이전 객체의 외곽선만 제거; 함수: {removeBarrier()}
        UDEF — 다른 구독과 구분할 이벤트 이름; 정적 함수: {createUUID()}
        U3dEvent — 로드 이벤트; 상수: {MESH.LOADED}
    동작:
        현재 선택기와 같은 parentId의 구독을 찾는다. 있으면 그 구독의 targets에 key별 복원 기준을 저장하고 _loadedListeners[key]에 기존 listener를 연결한 뒤 종료한다.
        없으면 owner·layer·parentId와 빈 targets·divisions를 가진 구독을 만들고 현재 대상의 복원 기준을 저장한다.
        새 listener는 event.data가 없거나 puid가 문자열이 아니면 종료한다. targets의 복사 목록을 순회하며 자기 listener에 연결되어 있고 아직 선택된 대상만 처리한다.
            이전 선택 참조를 보관하고 이번 로드 이벤트에서 복원할 실제 대상을 구한다. 결과가 없거나 해제·휴면 상태이거나 결과의 선택 키가 다르면 건너뛴다.
            복원 중 동기 이벤트로 대상이 해제되었거나 listener·선택 참조가 바뀌었으면 건너뛴다.
            _reset[key]가 falsy이고 _auto가 truthy이면 스타일을 복원한다. 객체가 교체되었고 outline 방식일 때 이전 외곽선만 제거하며 이전 메시 자체는 dispose하지 않는다.
                저장한 intersect의 사본을 만들고 incoming이 병합 모델이면 그 사본의 faceIndex만 지운다. 선택 방식에 따라 외곽선·색·링을 적용한 뒤 텍스처 제외를 반영한다.
            대상·listener·이전 참조가 아직 동일할 때만 _selected[key]를 복원 객체로 교체한다.
        listener와 구독을 LOAD_SUBSCRIPTIONS에 연결한다. 새 UUID를 이벤트 등록 이름으로 사용하고 키별 listener를 보관한다. parentId는 복원 관계용이며 다른 선택기의 등록 이름과 공유하지 않는다.

createLoadTarget(object: ModelMesh, intersect: U3dIntersectLike | undefined) -> U3dSelectLoadTarget
    의존: defined — 교차 면 존재 판정; 함수: {defined()}
    동작:
        id에 object.puid를 기록한다. 병합 모델이고 배열 재질이며 faceIndex가 null·undefined인 경우만 wholeMerged를 true로 둔다. faceIndex 0은 부분 선택이다.
        intersect가 truthy이면 얕게 복사하고 아니면 undefined로 보관한 새 복원 기준을 반환한다.

resolveLoadedTarget(subscription: U3dSelectLoadSubscription, incoming: ModelMesh, target: U3dSelectLoadTarget, previous: ModelMesh) -> ModelMesh | null
    의존: U3dModelLayer — 현재 분리 모델 조회·병합 모델 분리; 함수: {getModelById(), mergedMeshDivision()}
    동작:
        incoming.puid가 target.id와 같은지 판정하고 incoming의 편집 기록을 조회한다. 직접 대상도 parentId도 아니며 편집 자식 관계에 parentId·target.id가 없으면 null을 반환한다.
        직접 대상이고 비병합 또는 wholeMerged이면 material이 있을 때 incoming, 없을 때 레이어의 target.id 조회 결과 또는 null을 반환한다.
        직접 대상이 아니면 레이어의 비병합 target.id를 먼저 찾는다. 이전 선택과 다른 객체이고 해제·휴면 상태가 아니면 그 객체를 반환하여 부모를 다시 분리하지 않는다.
        incoming이 병합 모델이면 다음 경로로 처리한다.
            재질이 비어 있지 않은 배열이면 선택 재질을 복원한다. 복원 성공이며 직접 대상일 때 incoming을 반환한다.
            그 밖에 레이어 분리 함수가 있으면 incoming별 divisions 캐시를 조회한다. 캐시가 없으면 빈 배열을 먼저 기록하여 중첩 로드 이벤트의 재분리를 막고 분리 함수를 실행한다.
                분리 반환값이 배열이 아니면 빈 배열로 취급한다. 결과가 비면 캐시를 지워 다음 이벤트에서 재시도하고, 비어 있지 않으면 보관한다. 예외가 나면 캐시를 지우고 같은 오류를 전달한다.
            분리 결과에서 puid가 target.id와 같은 메시가 있으면 반환한다.
        마지막으로 비병합 target.id를 다시 조회한다. 이전 객체와 다르고 해제·휴면 상태가 아니면 반환하며 나머지는 null이다. 부모를 선택 자식의 대체물로 반환하지 않는다.

getEditedEventInfo(layer: U3dLayer, modelID: string) -> any
    의존:
        U3dLayer(layer) — 직접 사용하는 기능; 함수: {getEditedEventById()}
    동작:
        레이어의 getEditedEventById가 함수이면 해당 모델 편집 정보를 반환하고 그 외에는 null이다.

getChildIdList(layer: U3dModelLayer, editInfo: any) -> Array<string>
    동작:
        editInfo 또는 editData 또는 materialSplit이 null·undefined이면 빈 배열을 반환한다.
        materialSplit의 각 childId로 편집 기록을 조회한다. 그 editData.split이 truthy이면 split, 아니면 원래 childId를 결과 배열에 추가한다. 순서를 유지하며 중복 제거나 재귀 추적은 하지 않는다.

findEventListenerIndex(layer: U3dModelLayer, eventName: string) -> number
    의존: U3dEvent — 로드 리스너 목록; 상수: {MESH.LOADED}
    동작:
        레이어의 로드 리스너 목록이 없으면 -1을 반환한다. 있으면 LOAD_SUBSCRIPTIONS에 기록된 owner가 현재 선택기와 같고 parentId가 eventName과 같은 첫 listener의 인덱스를 반환한다. 다른 선택기와 등록 이름이 같은지만 비교하지 않는다.

addSelectedNotLayer_(object: any, id: string | number | undefined) -> any
    의존:
        defined — 직접 사용하는 기능; 함수: {defined()}
    동작:
        object._ulayername과 id를 ^로 연결하여 키를 만든다. 키가 아직 없고 object가 defined이면 원본을 저장하여 반환하며 중복 등록은 값을 반환하지 않는다.
        null·undefined 입력은 키 생성 중 속성 접근에서 예외가 발생하므로, 뒤의 true 대기 표식 대입에는 도달하지 않는다.

restoreMaterial(mesh: any) -> void
    의존:
        defined — 백업과 재질의 null·undefined 판정; 함수: {defined()}
        THREE.Color — 일반 재질의 백업 색 복원; 생성자: {new Color()}
    동작:
        mesh가 falsy이면 반환한다. polygonOffset을 해제한 뒤 material이 null·undefined이면 나머지 복원을 하지 않는다.
        단일 재질과 배열의 각 재질을 구분하여 처리한다.
            셰이더는 강조 uniform을 복원한다. 백업한 색·불투명도가 있으면 메시의 setColor·setOpacity를 우선하고, 해당 함수가 없으면 color·opacity uniform에 값을 돌려놓는다. 복원한 백업을 삭제한다.
            단일 셰이더에서만 _oriColorGradation 백업이 있으면 colorGradation uniform이 있을 때 복원하고 백업을 삭제한다. 배열 셰이더는 이 백업을 처리하지 않는다.
            일반 재질은 _oriColor가 defined이면 새 Color로 복원하고, _oriOpacity가 defined이면 불투명도와 opacity<1에 따른 transparent를 복원한다. 각각의 백업을 삭제한다.
            셰이더·일반 재질 모두 _oriMap·_oriNormalMap이 각각 defined이면 해당 텍스처를 복원하고 백업을 삭제한다.
            백업 삭제는 먼저 undefined를 대입한 다음 delete하는 순서이다. 처리한 단일 재질 또는 배열의 각 재질에 needsUpdate=true를 기록한다.

removeSelectedByKey(key: string, isCheckIdle: boolean = false) -> void
    의존:
        U3dSelectionRing(self._ringEffector) — 직접 사용하는 기능; 함수: {remove()}
        defined — 직접 사용하는 기능; 함수: {defined()}
        U3dObjectBarrier(self._effector) — 직접 사용하는 기능; 함수: {removeBarrier()}
    동작:
        ring 항목을 제거하고 선택 값이 undefined이면 반환한다. 색상 처리 대상을 정하고 intersect가 defined이면 삭제한다. outline은 레이어 해제 전에 텍스처를 복원한다. 앱이 살아 있으면 로딩 콜백·편집 재질·선택한 isCheckIdle 처리를 수행한다. 레이어가 없어도 키별 보관 콜백을 지운다. outline은 외곽선을 제거하고 color는 restoreMaterial 또는 순회 재질 복원을 수행한다. 수직 객체 옵션이 켜져 있으면 보조 객체를 제거하고 선택 사전의 키를 삭제한다. _reset 사전은 이 함수에서 비우지 않는다.
        앱 종료 등으로 레이어 정리를 하지 못해도 남은 listener가 있으면 구독이 기억하는 레이어에서 현재 대상만 해제한 뒤 키별 참조를 삭제한다.
        보조 처리를 실행한다.
        보조 처리를 실행한다.
        self._setVerticalObject가 truthy이면:
            보조 처리를 실행한다.

setMaterial(mesh: any, color: ColorRepresentation, opacity: number, intersect?: U3dIntersectLike) -> void
    의존:
        defined — 직접 사용하는 기능; 함수: {defined()}
        U3dApp(self._app) — 직접 사용하는 기능; 함수: {getLayerByName()}
        U3dModelLayer — 교차 면에 해당하는 부분 재질 조회; 함수: {getMaterialIndexByFace()}
    동작:
        mesh·material·color·opacity 중 하나라도 falsy이면 반환한다. 따라서 숫자 색상 0과 불투명도 0도 이 경로에서는 적용하지 않는다.
        배열 재질이며 intersect.faceIndex가 defined이고 병합 기능이 있으면 소속 레이어의 해당 재질 인덱스를 조회한다. 유효한 인덱스를 찾으면 그 재질만 적용하고 반환한다.
        해당 면을 처리하지 못한 배열 재질은 _pickMaterials가 있으면 그 안의 인덱스만, 없으면 전체 재질을 적용한다. 단일 재질은 바로 적용한다.
        보조 처리를 실행한다.

getColorTarget(selected: USelect, intersect?: U3dIntersectLike) -> USelect
    동작:
        교차 정보의 renderObject를 우선하고 null·undefined이면 object를 읽는다. 그 원본이 Three.js Mesh이고 userData.type이 trailMesh일 때만 원본을 반환하며 그 외에는 입력 selected를 반환한다.

restoreHighlightUniforms(uniforms: Record<string, any> | undefined) -> void
    의존:
        defined — 직접 사용하는 기능; 함수: {defined()}
    동작:
        uniform의 강조 이전 값이 있으면 원래 값으로 복원하고 백업을 삭제한다.

isSelected(object: any) -> boolean
    의존:
        defined — 직접 사용하는 기능; 함수: {defined()}
    동작:
        객체 키에 대응하는 선택 값이 defined인지 반환한다.
        보조 처리를 실행한다.

makeObjectKey(object: any) -> string
    동작:
        소유 레이어 이름과 대상의 공통 선택 식별값을 ^로 연결하여 반환한다. 호출자가 식별 정책을 선택하는 옵션은 없다.
        보조 처리를 실행한다.

hasTraverse(target: USelect) -> boolean
    동작:
        입력이 truthy인 객체이고 traverse가 함수이면 true이다.

hasPickMaterial(target: USelect) -> boolean
    동작:
        입력이 truthy인 객체이고 pickMaterial이 함수이면 true이다.

hasExceptTexture(target: USelect) -> boolean
    동작:
        입력이 truthy인 객체이고 exceptTexture가 함수이면 true이다.

searchLayerName(object: any) -> string | undefined
    의존:
        defined — 직접 사용하는 기능; 함수: {defined()}
    동작:
        대상이 null·undefined이면 빈 문자열이다. getLayerName이 truthy이면 호출한다. 그 결과가 null·undefined이면 _ulayername, 그 값도 null·undefined이면 layerName을 사용하여 반환한다. 빈 문자열은 defined이므로 다음 이름으로 대체하지 않는다.

makeId(object: any) -> string
    의존:
        UMesh — 일반 Object3D 조회 키; 정적 함수: {_getObjectId()}
        UDEF — 비 Object3D의 임시 참조 키; 정적 함수: {createUUID()}
    동작:
        puid가 비어 있지 않은 문자열이면 반환한다. 아니면 uuid가 비어 있지 않은 문자열일 때 UMesh 공통 조회 키를 반환한다.
        두 값이 없는 객체는 RUNTIME_SELECTION_IDS의 기존 키를 조회한다. 없으면 '@runtime:'과 새 UUID를 연결한 키를 WeakMap에 기록하고 반환한다.
        원본 객체에 puid·uuid를 생성하지 않는다. 좌표·경계·이름·원본 데이터 속성으로 동일성을 추정하지 않으며 임시 키는 같은 객체 참조에만 유지된다.

setObjectPolygonOffset(object: any, value: boolean) -> void
    의존:
        defined — 직접 사용하는 기능; 함수: {defined()}
    동작:
        object나 material이 undefined이면 반환한다. value가 undefined이면 true이다. true이고 아직 켜지지 않았으면 polygonOffset=true, polygonOffsetUnit=1, polygonOffsetFactor=-10으로 둔다. false이고 켜져 있으면 끄고 unit·factor를 0으로 둔다. material 배열을 별도로 순회하지 않는다.

getObjectPosition(object: any) -> Vector3
    의존:
        THREE.Vector3 — 직접 사용하는 기능; 생성자: {new Vector3()}
        defined — 직접 사용하는 기능; 함수: {defined()}
    동작:
        새 영벡터를 만들고 object가 undefined이면 그대로 반환한다. geometry의 경계 상자가 없으면 계산한다. 경계의 중간점을 구한 뒤 matrixWorld를 적용하여 반환한다.
        object가 defined이면:
            object.geometry.boundingBox가 defined가 아니면 computeBoundingBox()를 호출한다.

getPickMaterial(layer: U3dModelLayer, object: any) -> boolean
    의존:
        UMesh — 편집 정보를 찾을 현재 조회 키; 정적 함수: {_getObjectId()}
        defined — 직접 사용하는 기능; 함수: {defined()}
        U3dLayer(layer) — 직접 사용하는 기능; 함수: {mergedMeshDivision(), getMaterialIndexByFace()}
    동작:
        공통 조회 키로 모델 편집 기록을 조회하고 없으면 false이다. editData.materialSplit이 있으면 _pickMaterials를 준비하고 각 재질 키에 mergedMeshDivision을 적용해 지역 object 참조를 교체한다. 그 결과의 재질 인덱스를 중복 없이 추가한다. materialSplit이 있으면 true, 없으면 false이다.
        보조 처리를 실행한다.

setSelectedStyle(mesh: any, color: ColorRepresentation, opacity: number, type: string) -> void
    의존:
        UMesh — 현재 모델의 편집 키; 정적 함수: {_getObjectId()}
        U3dApp(self._app) — 직접 사용하는 기능; 함수: {getLayerByName()}
        defined — 직접 사용하는 기능; 함수: {defined()}
        U3dModelLayer — 연결된 부모·자식의 현재 모델 조회; 함수: {getModelById()}
    동작:
        mesh·병합 기능·소속 레이어·편집 기록이 없으면 반환한다. 공통 조회 키로 찾은 현재 모델의 편집 기록에 색·불투명도를 먼저 저장한다.
        editData.materialColor가 있으면 연결된 부모의 편집 색·불투명도를 갱신한다. 부모 모델과 materialIndex가 있으면 선택 재질 인덱스에 중복 없이 추가하고 color 작업은 outline 또는 color만, texture 작업은 텍스처 제외만 적용한다.
        materialColor가 없고 materialSplit이 있으면 각 자식의 편집 색·불투명도를 갱신하고 존재하는 자식 모델에 같은 방식의 표시를 적용한다. 자식 순회 뒤 현재 mesh에도 적용한다. ring은 여기서 직접 갱신하지 않는다.
        보조 처리를 실행한다.
        editInfo.editData가 truthy이면:
            보조 처리를 실행한다.
        보조 처리를 실행한다.
        editInfo.editData가 truthy이면:
            보조 처리를 실행한다.

setMaterialColor(mesh: UMesh, material: Material, color: ColorRepresentation, opacity: number) -> void
    의존:
        THREE.Color — 직접 사용하는 기능; 생성자: {new Color()}
    동작:
        전달된 재질 한 개를 처리한다. 궤적 셰이더에 highlightColor·highlightEnabled가 있으면 이전 값을 처음에만 백업하고 강조 색·활성값만 변경한 뒤 반환한다. 이 경로는 불투명도·transparent·needsUpdate를 변경하지 않는다.
        다른 셰이더는 메시의 setColor·setOpacity가 있으면 각각 위임하고, 없으면 해당 uniform의 이전 값을 처음에만 백업하여 교체한다. colorGradation uniform이 있으면 백업하고 false로 둔다.
        일반 재질은 기존 색의 복제본과 불투명도를 처음에만 백업하고 새 Color와 입력 opacity를 그대로 저장한다. _keepTransparent가 truthy가 아니면 opacity<1로 transparent를 정하며 needsUpdate=true로 만든다.

isSelectAppAvailable(selector: U3dSelect) -> boolean
    의존:
        defined — 직접 사용하는 기능; 함수: {defined()}
        U3dApp(selector._app) — 앱 종료 여부; 함수: {isDisposed()}
    동작:
        _app이 null·undefined가 아니고 isDisposed의 선택 호출 결과가 true가 아닐 때 true이다. isDisposed가 없거나 undefined를 반환해도 사용 가능으로 판정한다.

releaseSelectedLayer(key: string, selected: ModelMesh, isCheckIdle: boolean) -> ModelMesh
    의존:
        U3dApp(this._app) — 직접 사용하는 기능; 함수: {getLayer()}
        defined — 직접 사용하는 기능; 함수: {defined()}
        U3dLayer(layer) — 직접 사용하는 기능; 함수: {off(), removeMaterialIndex(), getModelById(), checkDivisionMeshIdle()}
    동작:
        소속 레이어와 키별 콜백이 defined이지 않으면 원래 선택 참조를 반환한다.
        공유 구독에서 현재 선택만 해제한다. 선택기가 관리하지 않는 콜백일 때만 레이어에서 직접 off하고 키별 참조를 지운다.
        _pickMaterials가 있으면 복사한 인덱스 목록을 해제한다. selected.puid로 조회한 편집 색 기록이 있으면 재질이 없을 때 같은 puid·병합 상태의 원본 모델을 조회하고 임시 편집 스타일을 삭제한다.
        isCheckIdle이며 기능이 있으면 분할 idle을 점검한 뒤 최종 모델 참조를 반환한다.

LOAD_SUBSCRIPTIONS: WeakMap<Function, U3dSelectLoadSubscription>
    로드 listener의 소유 선택기·부모 ID·대상별 복원 기준을 보관한다. 다른 선택기의 같은 부모 구독과 분리한다.
RUNTIME_SELECTION_IDS: WeakMap<object, string>
    puid·uuid가 없는 비 Object3D의 현재 참조 키만 보관한다. 영속 재로딩 키를 만들지 않는다.

U3dSelectLoadTarget 부분 타입 명세
    이 명세에서 사용하는 필드:
        id: string
            선택한 데이터 대상의 puid
        wholeMerged: boolean
            교차 면 정보 없이 병합 객체 전체를 선택했는지 여부
        intersect: U3dIntersectLike | undefined
            대상별 교차 정보의 얕은 사본

U3dSelectLoadSubscription 부분 타입 명세
    이 명세에서 사용하는 필드:
        owner: U3dSelect
        layer: U3dModelLayer
        parentId: string
            부모 또는 직접 선택 대상의 puid이며 이벤트 등록 이름이 아니다.
        targets: Map<string, U3dSelectLoadTarget>
        divisions: WeakMap<Object3D, Array<ModelMesh>>
            로드 객체별 분리 결과와 중첩 이벤트 재분리 방지용 빈 배열

const invisibleRay: unknown
    의존:
        URaycaster — 직접 사용하는 기능; 생성자: {new URaycaster()}
    숨긴 객체도 검색하는 공유 광선이다.
const TEMP_BOX: unknown
    의존:
        THREE.Box3 — 직접 사용하는 기능; 생성자: {new Box3()}
    병합 그룹과 인스턴스 범위 판정의 공유 상자이다.
TriangleBVHCache 타입 정의
    기반 타입: {version: number, array: ArrayLike<number>, count: number, index: BufferAttribute | null, indexVersion: number, indexArray: ArrayLike<number> | undefined, indexCount: number, tree: MeshBVH}
ScreenPickObject 타입 정의
    기반 타입: Object3D & Partial<{ geometry: BufferGeometry, material: Material | Array<Material>, isMesh: boolean, isSkinnedMesh: boolean, morphTargetInfluences: Array<number>, isLine: boolean, isLineSegments: boolean, isLineLoop: boolean, isPoints: boolean, isInstancedMesh: boolean, _disposed: boolean, _sleeping: boolean, count: number, instances: Array<{id: number, visible?: boolean}>, getMatrixAt: (index: number, matrix: Matrix4) => void, getVisibilityAt: (index: number) => boolean, getActiveAt: (index: number) => boolean, getDrawSegments: () => Array<{a: Vector3Like, b: Vector3Like}>, getVertexPosition: (index: number, target: Vector3) => Vector3 }>
PickVertex 타입 정의
    기반 타입: {world: Vector3, clip: Vector4, screen?: Vector2, clipCode?: number}
ScreenPickScratch 타입 정의
    기반 타입: {vertices: Map<number, PickVertex & {generation: number, screen: Vector2}>, lookup: Array<(PickVertex & {generation: number, screen: Vector2}) | undefined>, generation: number, projection?: ScreenPickProjection, overflow?: ScreenPickOverflow, segmentVertices?: Array<PickVertex & {screen: Vector2}>}
ScreenPickOverflow 타입 정의
    기반 타입: {keys: Float64Array, values: Float64Array, generations: Float64Array, codes: Uint8Array, vertices: Array<PickVertex & {generation: number, screen: Vector2}>, ordinal: number}
ScreenPickProjection 타입 정의
    기반 타입: {sources: WeakSet<object>, version: number, count: number, itemSize: number, normalized: boolean, stride: number, offset: number, matrix: Matrix4, projection: Matrix4, width: number, height: number}
ScreenPickOptions 타입 정의
    noLine?: boolean
        선 제외 여부
    noPoint?: boolean
        점 제외 여부
    nearestOnly?: boolean
        가까운 유효 결과 하나만 반환할지 여부
    acceptObject?: (object: ScreenPickObject) => boolean
        정점 조회 전 검색 가능 객체 판정
    acceptHit?: (hit: Intersection & {screenDistance: number}) => boolean
        nearestOnly 검색의 논리 대상 판정이다. 거부한 결과는 거리 상한에 사용하지 않으며 일반 검색에서는 이 callback을 호출하지 않는다.
SelectPointerEventExt 타입 정의
    origin?: MouseEvent
        해당 이름의 선택 설정 또는 데이터
SelectPointerEvent 타입 정의
    기반 타입: NormalizedPosition & SelectPointerEventExt
USelect 타입 정의
    기반 타입: (Mesh | Line | Points | UMesh | UGroup | BufferGeometry | U3dComponentPosition | U3DTilesMesh )
U3dIntersectLike 타입 정의
    object?: U3dObject
        교차한 대상 객체
    renderObject?: Object3D
        궤적 검색 결과를 소유 컴포넌트로 연결하기 전의 실제 메시. 경로 색상 강조와 복원에 사용
    faceIndex?: number
        교차한 삼각형 면의 인덱스. 병합 메시에서 부분 강조 범위를 찾는 데 사용
    point?: WorldPosition
        교차 지점의 월드 좌표(EPSG:3857)
    distance?: number
        카메라(레이 원점)에서 교차 지점까지의 월드 좌표(EPSG:3857) 거리
    screenDistance?: number
        원형 화면 검색에서 마우스와 실제 형상 사이의 거리(CSS 픽셀)
    geom?: BufferGeometry
        공개 선언상 영역 교차 지오메트리이다. checkGeom에서 실제 저장하는 값은 OLGeometry이다. [확인 Q-004]
    instanceId?: number
        인스턴스 메시에서 교차한 인스턴스의 인덱스
SelectBoxEvent 타입 정의
    selectBox?: U3dSelectionBox
        화면에 사각형을 그리고 그 안의 객체를 찾는 선택 박스. BOX 모드 진입 시 생성
    pointerDownId?: string
        앱 `mousedown` 리스너 식별자(`uuid + '_pointerDown'`)
    pointerMoveId?: string
        앱 `mousemove` 리스너 식별자. 드래그 중에만 등록됨
    pointerUpId?: string
        앱 `mouseup` 리스너 식별자
SelectorStroke 타입 정의
    color?: string
        외곽선 색상. CSS 색상 문자열(예: `'#ff0000'`, `'rgba(255,0,0,0.8)'`). 생략하면 측정 레이어 기본 색
    width?: number
        외곽선 두께(화면 픽셀). 생략하면 측정 레이어 기본 두께
SelectorFill 타입 정의
    color?: string
        채움 색상. CSS 색상 문자열. 생략하면 측정 레이어 기본 색
SelectorColorOption 타입 정의
    stroke?: SelectorStroke
        외곽선 색·두께
    fill?: SelectorFill
        채움 색
U3dSelectCO_Content 타입 정의
    mode?: string = 'point'
        선택 모드 - point : 단일 객체 선택 - area : 영역을 그려서 영역에 교차되는 객체 선택 - circle : 원을 그려서 반경에 교차되는 객체 선택 - line : 선을 그려서 선과 교차되는 객체 선택 - box : 화면에서 드래그한 사각형 안에 들어오는 객체 선택
    style?: KeyValue
        공개 선언상 색상 강조 재질의 스타일이다. 생성자 기본값은 `{color: 0x7f0000, side: THREE.FrontSide, metalness: 0, roughness: 1, transparent: false}`이며 현재 구현은 입력 객체를 그대로 보관한다. [확인 Q-002]
    exceptTexture?: boolean = false
        true면 강조 표시 중 모델의 텍스처를 감춥니다.
    targetLayer?: string | Array<string>
        선택 검색 대상 레이어 이름 문자열 하나 또는 배열로 지정하며, 생략하면 모든 모델 레이어를 검색합니다.
    pickBufferPx?: number = 0
        POINT 모드에서 마우스 주변을 검색할 원형 반경(CSS 픽셀). 유한한 0 이상의 숫자이며, 생성 후 setPickBufferPx()로 변경할 수 있습니다. 0이면 기존 레이 검색을 사용합니다. 양수이면 표시 중인 점·선분·삼각형의 화면 거리로 검색하며, 같은 거리에서는 카메라에 가까운 대상을 우선합니다. USimpleTail 궤적은 양수 반경에서 현재 표시 중인 중심 선분을 직접 검색합니다. auto=true이면 가장 가까운 대상 하나를 선택하고, false이면 범위 안의 결과를 화면 거리순으로 전달합니다. 깊이 버퍼를 읽지 않아 다른 객체에 가려진 대상도 포함될 수 있습니다.
    pickBufferVisible?: boolean = false
        POINT 모드에서 실제 검색 반경의 노란색 범위 원을 표시합니다. hover와 독립적이며 setPickBufferVisible()로 변경할 수 있습니다. 반경 0·드래그·지도 이탈·비활성화에서는 숨기고, 선택기가 DOM과 이벤트를 생성·정리합니다.
    hover?: U3dSelectHoverOption
        POINT 모드의 원형 검색 결과를 임시 색상으로 표시할 설정. 클릭 선택 목록과 독립적으로 동작합니다.
    selectType?: string = 'outline'
        선택 시 하이라이트 타입 설정 - color : 선택 객체 색상을 변경해서 하이라이트 - outline : 선택 객체의 외곽선을 생성해서 하이라이트 - ring : 지정한 크기의 링 위에서 밝은 호가 회전하는 하이라이트
    selectTypeOption?: KeyValue | U3dSelectRingOption
        선택 타입별 옵션. outline은 mode·renderOrder·lineWidth·width·farPoint를 사용하며 farPoint는 {@link UOutlineFarPointOption} 참조. 생략한 farPoint 필드는 enabled=true·thresholdSizePx=24·minSizePx=5·simplifyTolerancePx=0.1로 보완합니다. 두께는 farPoint.lineWidthPx가 우선하며 lineWidth·width도 활성 경로에서 CSS 픽셀로 사용할 수 있습니다. null 또는 enabled=false로 간략 윤곽을 해제할 수 있습니다. 기존 두 전환 기준만 지정하면 thresholdSizePx를 추가하지 않으며 pointSizePx 입력은 minSizePx로 변환합니다. 링은 {@link U3dSelectRingOption} 참조
    selectedPulse?: boolean = true
        공개 선언상 outline 외곽선 애니메이션의 활성 여부이다. 현재 구현에서는 저장한 값이 외곽선 관리자에 전달되지 않는다. [확인 Q-001]
    setVerticalObject?: boolean = false
        선택 시 지표면과 맞닿는 수직선 객체 생성 여부 true면 수직선 객체를 생성합니다.
    auto?: boolean = true
        true면 선택된 객체를 내부 선택 목록에 넣고 하이라이트까지 자동 적용합니다. false면 하이라이트 없이 이벤트 `data`로 선택 객체만 전달하므로 호출자가 직접 처리합니다.
U3dSelectCO 타입 정의
    기반 타입: UEventDispatcherCO & U3dSelectCO_Content
U3dSelectHoverOption 타입 정의
    enabled?: boolean = false
        hover 기능 활성화 여부. 선택기의 active()와 POINT 모드에서만 동작하며 setHover()로 실행 중 변경할 수 있습니다.
    autoHighlight?: boolean = true
        엔진이 자동으로 색상을 적용할지 여부. false이면 hoverchange에서 applyColor()를 호출해 표시를 결정합니다. 실행 중 변경하면 현재 표시를 복원하고 다음 검색에서 다시 이벤트를 전달합니다.
    color?: ColorRepresentation = 0x00ff00
        자동 강조 및 이벤트 applyColor()의 기본 색상. 원래 투명도는 유지합니다.
U3dSelectHoverEvent 타입 정의
    type: string
        이벤트 이름('hoverchange')
    previous: USelect | null
        이전 대상
    current: USelect | null
        현재 대상
    intersection: (Intersection & {screenDistance?: number}) | null
        현재 대상의 원본 교차 정보. 이탈 시 null
    applyColor: (color?: ColorRepresentation) => void
        현재 이벤트의 대상에만 임시 색상을 적용합니다. 생략하면 hover.color를 사용하며, 전환·이탈·비활성화·삭제 시 엔진이 복원합니다. 클릭 선택 대상·이탈 이벤트·지난 대상의 이벤트에서는 적용하지 않습니다.
U3dSelectHoverTarget 타입 정의
    object: USelect
        논리 선택 대상
    intersect: Intersection & {screenDistance?: number}
        원본 메시와 교차 지점
    key: string
        인스턴스·병합 부분까지 구분한 식별자
    part?: {start: number, count: number}
        병합 모델에서 강조할 인덱스 범위
U3dSelectRingOption 타입 정의
    width?: number
        링 두께(월드 단위, 최소 0.001). 평면에서는 띠 너비, 입체에서는 벽 두께입니다. height와 함께 사용하며 기존 thickness·bandWidth보다 우선합니다. 최대값은 내접원 반지름의 99%입니다. 생략 시 기존 크기 속성으로 환산합니다.
    height?: number
        링 높이(월드 단위, 0~4096). 0이면 평면, 양수이면 입체입니다. bandHeight보다 우선하며 width와 함께 지정하면 별도의 두께 비율을 곱하지 않습니다.
    headScale?: number = 1
        머리 단면 크기 배율(0~10). 1은 링 두께·높이와 같은 크기, 1.5는 1.5배입니다. 개별 스타일 사용 여부와 관계없이 적용하며 head.thickness·headThickness보다 우선합니다. 네온 전용 모드에서는 무시합니다.
    tailScale?: number = 1
        꼬리 단면 크기 배율(0~10). 새 공통 크기 설정은 개별 스타일 여부와 관계없이 한 바퀴 돌아 머리와 맞닿는 끝에 적용하며 tail.thickness보다 우선합니다. 머리부터 꼬리까지 단면 크기를 보간하고 네온 전용 모드에서는 무시합니다.
    tailShape?: 'default' | 'flat' | 'round' | 'taper' = 'default'
        꼬리 끝 모양. default는 기존 표현을 유지하며 개별 tail.shape가 지정되면 그 설정이 우선합니다. 네온 전용 모드에서는 무시합니다.
    headShape?: 'default' | 'flat' | 'round' | 'taper' = 'default'
        머리 끝 모양. default는 기존 표현이며 나머지는 평평한 끝·반원 끝·뾰족한 끝입니다. 개별 스타일에서도 적용되지만 head.shape가 지정되면 그 설정이 우선합니다. animate=false일 때 무시합니다.
    headThickness?: number = 1
        호환용 기본 머리 단면 배율(0~10). 새 설정은 headScale을 사용합니다. 개별 스타일 또는 animate=false일 때 무시합니다.
    head?: U3dSelectRingEndStyle
        진행 방향의 앞쪽 끝 스타일. 기본값 round는 단면 반폭에 맞는 반원이며 taper는 앞 20% 구간에서 뾰족해집니다. head·tail을 모두 생략하면 기존 표현을 유지합니다.
    tail?: U3dSelectRingTailStyle
        머리에서 한 바퀴 돌아 머리와 맞닿는 끝의 스타일. 모양 기본값은 taper입니다. 링 전체 둘레에 걸쳐 머리부터 꼬리까지 색상·두께·투명도를 연속 보간합니다. animate=false일 때 head·tail은 무시합니다.
    bandHeight?: number = 0
        호환용 링 높이(월드 단위, 0~4096). 새 설정은 height를 사용합니다. ground는 기준 높이에서 월드 +Z 방향으로, screen은 카메라 쪽으로 돌출됩니다.
    bandWidth?: number = 0
        호환용 벽 두께(월드 단위). 새 설정은 width를 사용합니다. 높이가 0이면 평평한 고리, 양수이면 파이프입니다. 0이면 기존 표현을 유지하며 최대값은 내접원 반지름의 99%입니다.
    animate?: boolean = true
        false이면 회전 강조 구간 없이 전체 테두리를 균일한 네온으로 표시하고 애니메이션용 연속 렌더 요청을 중지합니다. 대상 위치 추적과 speed 설정은 유지합니다.
    depthTest?: boolean = false
        true이면 장면의 깊이를 검사하여 건물 등 뒤에 있는 링을 가립니다. false이면 항상 앞에 표시합니다. 선택 대상뿐 아니라 깊이를 기록하는 모든 객체에 적용하며 링 자체는 깊이를 기록하지 않습니다.
    heightOffset?: number = 0
        ground에서 대상의 현재 월드 Z 좌표에 더할 높이(월드 좌표 단위). 양수는 위, 음수는 아래이며 screen에서는 무시합니다. 유한하지 않은 값은 0으로 처리합니다.
    orientation?: 'screen' | 'ground' = 'ground'
        screen은 카메라 정면, ground는 대상 위치에서 지면과 평행한 월드 XY 평면입니다. ground는 측면에서 타원으로 보이며 완전한 수평 시점에서는 선으로 축소됩니다. 지면 높이로 위치를 내리지 않습니다.
    shape?: 'circle' | 'triangle' | 'square' | 'polygon' = 'circle'
        테두리 형태. 삼각형·정사각형·정다각형의 변을 따라 강조 구간이 회전합니다.
    pattern?: 'solid' | 'dashed' = 'solid'
        실선 또는 짧은 선과 빈칸이 반복되는 점선. 네온 전용 모드에서도 적용합니다. 애니메이션 중에는 패턴이 머리와 함께 이동합니다.
    dashCount?: number = 24
        한 바퀴의 점선 개수(1~128). 소수는 반올림하며 다각형도 변 길이 기준으로 균일하게 배치합니다.
    dashRatio?: number = 0.6
        반복 구간에서 선이 차지하는 비율(0.05~1). 1이면 빈칸 없는 실선과 같습니다. pattern=dashed에서만 사용합니다.
    sides?: number = 6
        shape='polygon'일 때만 적용하는 변 개수(3~64). 소수는 반올림합니다. circle·triangle·square에서는 지정해도 무시하며 triangle은 3변, square는 4변으로 고정됩니다.
    size?: number = 80
        원 또는 다각형 외접원의 월드 지름(1~4096). ground와 screen 모두 월드 좌표 단위로 고정하여 줌에 따라 대상과 함께 확대·축소됩니다.
    speed?: number = 1.5
        초당 회전 각도(라디안, -20~20). 음수는 반대 방향, 0은 정지
    thickness?: number = 0.025
        호환용 두께 비율(0.005~0.08). 새 설정은 width를 사용합니다. width·height가 없으면 기존 평면 반두께 및 입체 단면 배율 계산을 유지합니다.
U3dSelectRingEndStyle 타입 정의
    shape?: 'flat' | 'round' | 'taper'
        평평한 끝, 반원 끝, 뾰족한 끝. round는 리본의 넓은 면을 반원으로 마감합니다. 벽 두께가 높이보다 크면 너비 방향, 그렇지 않으면 높이 방향을 둥글게 하고 좁은 축은 유지합니다.
    color?: ColorRepresentation
        생략하면 현재 선택 색상을 따릅니다.
    opacity?: number = 1
        강조 투명도 배율(0~1). 머리부터 페이드 종료 지점의 꼬리까지 보이는 전체 길이에서 각각의 값을 보간한 뒤 페이드와 전체 선택 투명도를 곱합니다. 페이드 경계가 같아도 머리·꼬리 투명도는 각각 적용됩니다.
    thickness?: number = 1
        호환용 강조 단면 배율(0~10). 새 설정은 headScale·tailScale을 사용합니다. 1은 기본 크기, 1.5는 기본 링 두께와 옆면 높이의 1.5배이며 0은 강조 없음입니다. 단면 중심을 기준으로 확대·축소하며 머리부터 꼬리까지 보간합니다. 평면 링은 링 thickness에 곱하고, 파이프는 bandWidth·bandHeight에 곱합니다. 안쪽 반지름은 역전되지 않도록 제한합니다.
U3dSelectRingTailStyle 타입 정의
    기반 타입: U3dSelectRingEndStyle & {fadeIn?: number, fadeOut?: number}
NormalizedPosition 타입 정의
    normalizedX: number|undefined
        가로 위치(-1 ~ 1). 계산 전이면 undefined
    normalizedY: number|undefined
        세로 위치(-1 ~ 1, 위가 +). 계산 전이면 undefined

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
