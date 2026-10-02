# U3dModelLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

모델 레이어가 공유하는 작업 등록, 캐시·라벨 관리 및 모델 편집·분리·복원을 담당하는 기반 클래스다.

## 3. 정규 자연어 수도코드

```spec
U3dModelLayer extends U3dLayer 클래스 정의
    의존: U3dLayer — 기반 레이어 상태·확장 계약; 상속: {U3dLayer}

    static OPT_KEYS: Array<string> = U3dLayer.OPT_KEYS와 모델 공통 옵션의 정본 키 목록
        의존: U3dLayer — 부모 옵션 목록 확장; 속성 읽기: {OPT_KEYS}
        부모 목록을 재정의하여 useTexture, setWireframe, compressModel, ext, toonImgUrl, emissiveColor, useEditMode를 추가한다.

    removedList: Array<string> = 빈 배열
        삭제·분리 표시를 보관한다. 외부 변경과 반환 참조의 변경이 필터·복원 결과에 반영된다.
    editedList: Array<string> = 빈 배열
        편집 ID 목록이며 비어 있으면 editedEvent에 값이 있어도 조회되지 않는다.
    editedEvent: Record<string, EditedEvent> = 빈 객체
        편집 정보와 메시·타일 참조를 보관하며 외부 변경을 허용한다.
    #divisionRequests: WeakMap<Object3D, object> = 빈 WeakMap
        원본별 현재 분리 요청 표식이다. 휴면 해제로 표식을 제거하면 이전 응답은 적용되지 않는다.
    _workProcess, _workProcess2, _workProcess3: WorkProcess | undefined = undefined
        앱에서 제공한 세 작업 처리기를 참조한다.
    _cacheTiles, _cacheModelInTile, _cacheModeles: UCache
        타일 자료, 타일별 모델 URL, 모델 URL 직접 조회용 캐시다.
    _useTexture: boolean = true
    _setWireframe: boolean | undefined = false
    _compressModel: boolean = false
    _toonImgUrl: string | undefined = undefined
    _labelGroup: UGroup | undefined
    _labelVisible: boolean = true
    _emissiveColor: RGBColor
    _emissive: Color
        재질들이 공유하는 발광 색상 참조다.
    _useEditMode: boolean = true

    constructor(opt: U3dModelLayerCO = {})
        의존:
            normalizeOptionKeys — 실제 생성 클래스의 옵션 정규화; 함수: {normalizeOptionKeys()}
            U3dLayer — 기반 초기화; 생성자: {super()}
            UDEF — 모델 분류·렌더 순서·기본 발광색; 상수: {LAYER_TYPE.MODEL, PROCESS.TYPE.MODEL, RENDER_ORDER.MODEL, DEFAULT_MODEL_EMISSIVE_COLOR}
            defaultValue — 기본값 선택; 함수: {defaultValue()}
            UCache — 자료 캐시; 생성자: {new UCache()}
            UGroup — 라벨 그룹; 생성자: {new UGroup()}
            THREE — 발광 색상; 생성자: {new THREE.Color()}
        동작:
            new.target의 OPT_KEYS를 기준으로 옵션 키의 대소문자 별칭을 camelCase로 정규화하고 그 결과를 부모에 전달한다.
            입력 객체 자신의 열거 가능한 키만 별칭 대상으로 삼는다. 별칭이 있으면 복사본을 사용하며 원본 옵션에 키를 추가하거나 값을 대입하지 않는다.
            정본 키와 다른 대소문자 별칭을 함께 지정하면 별칭 값이 undefined여도 정본 값을 덮어쓴다. 여러 별칭이 있으면 입력 객체의 열거 순서에서 마지막 별칭을 사용한다.
            부모 초기화 후 모델 종류·클래스 이름·작업 종류를 설정하고 기존 렌더 순서에 모델 순서를 더한다.
            작업 처리기를 undefined로, 삭제·편집 목록과 편집 사전을 새 빈 컬렉션으로 설정한다.
            useTexture=true, setWireframe=false, compressModel=false, ext=.u3f를 undefined 입력의 기본값으로 읽으며 false·0·빈 문자열·null을 기본값으로 대체하지 않는다.
            압축이 참이면 지정 ext와 무관하게 .u3f.gz를 사용한다. 부모 ext 기본값 .png는 여기서 .u3f로 재설정된다.
            세 캐시와 라벨 그룹을 생성하고 라벨을 표시 상태로 초기화한다.
            toonImgUrl, emissiveColor 또는 기본 발광색, useEditMode=true를 저장하고 RGB 값으로 공유 Color를 생성한다.

    override setOpacity(val: number) -> void
        의존:
            U3dLayer — 불투명도 상태와 캐시·장면 조회; 함수: {super.setOpacity(), getCacheKeys(), getScene(), getCacheByKey()}; 속성 읽기: {_transparent, _opacity}
            defined — 재질 존재 판정; 함수: {defined()}
            Object3D — 재질 순회; 함수: {traverse()}
        동작:
            부모에 val을 반영한 뒤 캐시 키가 배열이 아니거나 비면 장면을, 아니면 키별 캐시 객체를 순회한다.
            재질 배열과 단일 재질에 같은 처리를 적용한다. transparent가 레이어와 다르고 userData._keepTransparent가 참이 아니면 transparent와 needsUpdate를 변경한다.
            _oriOpacity가 truthy이면 그 원본값을 레이어 불투명도로 바꾸고, 아니면 opacity를 바꾼다.

    override refresh() -> void
        의존:
            U3dLayer — 부모 갱신과 drawArg; 함수: {super.refresh()}; 속성 읽기: {_drawArg}
            UCache(drawArg._cacheModelTiles) — 모델 타일 열거; 함수: {items()}
            defined — drawArg 판정; 함수: {defined()}
        동작:
            부모 갱신 후 drawArg가 없으면 종료한다.
            모델 타일마다 createModel 결과를 확인한다. Promise이면 성공 후 장면에 추가하고, 동기 true이면 즉시 추가한다. 그 외 결과는 추가하지 않으며 실패를 잡지 않는다.

    override __testStateTile() -> boolean
        의존:
            U3dLayer — 타일 상태·drawArg; 속성 읽기: {_stateTiles, _drawArg}
            UCache(drawArg._cacheModelTiles) — 타일 수; 함수: {keys()}
            UDEF — 종료 상태; 상수: {TILE_STATE._end}
            defined — drawArg 판정; 함수: {defined()}
        동작:
            drawArg가 있고 모델 캐시 키 수가 상태 값 수보다 작으면 false로 판정한다.
            상태 중 하나라도 _end보다 작으면 false이며, 그 외에는 true를 반환한다.

    override dispose() -> Promise<boolean>
        의존:
            UCache — 캐시 비우기와 그룹 삭제 콜백 실행; 함수: {clear(), deleteAll()}
            UGroup — 라벨 분리; 함수: {clear()}
            U3dLayer — 기반 해제; 함수: {super.dispose()}; 속성 읽기: {_cache}; 속성 쓰기: {_disposed}
            defined — 자원 존재 판정; 함수: {defined()}
        동작:
            _cacheTiles가 UCache이면 비우고 나머지 두 모델 캐시는 무조건 비운다.
            기반 캐시가 있으면 현재 레이어를 receiver로 그룹 삭제 콜백을 전달한다.
            _labelGroup이 정의되면 clear 후 _labelGroup을 undefined로 바꾼다.
            부모 dispose를 호출한 뒤 _disposed=true로 설정하고 부모 Promise를 그대로 반환한다.

    override setApp(app: U3dApp) -> void
        의존:
            U3dLayer — 앱 연결; 함수: {super.setApp()}; 속성 읽기: {_classtype}
            U3dApp — 작업 처리기 제공; 속성 읽기: {_modelWorkProcesses}
            UDEF — 필요 처리기 수; 상수: {PROCESS.WORK_NUM}
            U3dMessage — 앱 준비 오류; 정적 함수: {error()}; 상수: {CNT.CMM.NOT_READY_APP}
            defined — 처리기 존재 판정; 함수: {defined()}
        동작:
            부모 앱 연결 후 처리기 목록이 없거나 길이가 WORK_NUM보다 작으면 6854743 오류를 기록하고 종료한다.
            그 외에는 목록의 0·1·2번 참조를 세 작업 처리기에 저장한다.

    addWork(work: U3dQuadTileWork) -> void
        의존: defined — 처리기 존재 판정; 함수: {defined()}
        동작: 첫 처리기가 있으면 작업을 등록하고 helper 반환값은 버린다.

    addWork2(work: U3dQuadTileWork) -> void
        의존: defined — 처리기 존재 판정; 함수: {defined()}
        동작: 둘째 처리기가 있으면 작업을 등록하고 helper 반환값은 버린다.

    addWork3(work: U3dQuadTileWork) -> void
        의존: defined — 처리기 존재 판정; 함수: {defined()}
        동작: 셋째 처리기가 있으면 작업을 등록하고 helper 반환값은 버린다.

    override process(curTime: number) -> number
        의존: U3dLayer — 기반 작업 처리; 함수: {super.process()}
        동작: curTime을 부모에 전달하고 결과를 그대로 반환한다.

    processWork(curTime: number) -> number | void
        의존:
            defined — 처리기 존재 판정; 함수: {defined()}
            U3dQuadTileWorkProcess — 작업 실행; 함수: {process()}
        동작: 첫 처리기가 있으면 process(curTime)의 결과를 반환하고 없으면 undefined로 종료한다.

    processWork2(curTime: number) -> number | void
        의존:
            defined — 처리기 존재 판정; 함수: {defined()}
            U3dQuadTileWorkProcess — 작업 실행; 함수: {process()}
        동작: 둘째 처리기가 있으면 process(curTime)의 결과를 반환하고 없으면 undefined로 종료한다.

    override getWorkingLevel2() -> number
        의존:
            U3dLayer — 기반 작업 수; 함수: {super.getWorkingLevel2()}
            U3dQuadTileWorkProcess — 첫 처리기 작업 수; 함수: {getWorkingLevel2()}
            defined — 처리기 판정; 함수: {defined()}
        동작: 첫 처리기의 작업 수 또는 0에 부모 작업 수를 더해 반환한다.

    override getWorkingLevel3() -> number
        의존:
            U3dQuadTileWorkProcess(self._workProcess2) — 둘째 처리기 작업 수; 함수: {getWorkingLevel2()}
            U3dQuadTileWorkProcess(self._workProcess3) — 셋째 처리기 작업 수; 함수: {getWorkingLevel2()}
            defined — 처리기 판정; 함수: {defined()}
        동작: 자신의 level2 결과에 둘째·셋째 처리기의 level2 작업 수를 더해 반환하며 없는 처리기는 0으로 센다.

    containByPosition(key: string, position: WorldPositionVector3, limit: number, drawArg: UDrawArg, maxHeight?: number) -> boolean
        의존:
            U3dLayer — 기반 캐시; 속성 읽기: {_cache}
            UCache — 거리 포함 판정; 함수: {containByPosition()}
            defined — 캐시 판정; 함수: {defined()}
        동작: 캐시가 있으면 모든 인수를 그대로 전달한 포함 결과를 반환하고, 없으면 true를 반환한다.

    registerRemovedUidList(uid: string | Array<string>) -> void
        동작: 배열이면 각 ID를, 그 외이면 uid 하나를 현재 removedList에 중복 검사 없이 추가한다.

    deleteRemovedUidList(uid: string | Array<string>) -> void
        동작:
            배열이면 순서대로 삭제 helper를 실행한다. 삭제 성공 시 반복 인덱스를 0으로 대입한 뒤 반복문의 증가가 적용된다.
            단일 값이면 같은 helper를 한 번 실행한다.

    #removeListProcess(uid: string) -> boolean
        의존: defined — 목록·검색 결과 판정; 함수: {defined()}
        동작:
            removedList가 없거나 비면 false를 반환한다.
            각 값과 uid를 대문자로 비교해 첫 일치 원본 문자열을 찾으며 없으면 false를 반환한다.
            그 문자열의 index가 -1보다 크면 정확히 같은 원본 문자열들을 제외한 새 배열로 removedList를 교체하고 true를 반환한다. 그 외에는 false다.

    removeModelByUid(uid: string) -> void
        의존:
            USharedMesh — 공유 모델 제외; 상속: {USharedMesh}
            ModelMesh — 모델 식별·병합 판정; 함수: {getUid(), isMerged()}; 속성 읽기: {_disposed}; 속성 쓰기: {_sleeping, visible}
            UDEF — 분리 모델 표시와 포맷; 상수: {U3F_DETACHED_TOKEN}
            U3dLayer — 앱·장면; 함수: {getScene()}; 속성 읽기: {_app}
            U3dApp — 좌표 변환·교차 검색; 함수: {getGoogleToGeographic(), intersectModelAtGeographicPoint()}
            defined — 대상 판정; 함수: {defined()}
        동작:
            ID로 모델을 찾고 USharedMesh이면 종료한다. 대상이 있되 이미 해제됐으면 종료하며, 아니면 자원을 해제하지 않고 휴면·숨김으로 바꾼다.
            self.getModelById(uid)._disposed가 falsy(false·undefined 등)인 기존 대상에서 isMerged가 있고 false이면 편집 정보를 조회한다.
            편집 정보의 split 원본을 삭제 목록에 추가하고, 편집 정보가 있으면 대상 ID에 분리 표시를 붙인다. 삭제 필터는 대상 미검색 경로와 최종 ID 등록에서도 사용한다.
            isMerged가 있고 true이면 분리 처리를 실행하고 원본 ID를 목록에 추가한 뒤 대상 ID에 분리 표시를 붙인다.
            대상이 없으면 ID의 앞 두 밑줄 조각을 숫자로 해석한다. 앱이 없으면 종료하며 변환 좌표가 있으면 장면 교차 결과 중 병합 모델을 분리한다.
            대상이 없는 경로에서 확장자가 정확히 .u3f이면 분리 표시를 붙인다. 마지막 ID가 목록에 없을 때 추가한다.

    refreshTileFromModel(id: string) -> void
        의존:
            U3dLayer — drawArg·캐시·편집 작업·종류; 속성 읽기: {_drawArg, _cache, _editWorkBuffer, _classtype}
            UDrawArg — 타일 조회·갱신; 함수: {getTile(), setUpdateDate()}
            U3dQuadTile — 타일 키; 함수: {getKey()}
            UDEF — 모델 타일 종류; 상수: {TILE_TYPE.MODEL}
            UCache — 그룹 조회; 함수: {get()}
            Group — 편집 메시 등록; 함수: {add()}
            String — 프로젝트 문자열 비교; 함수: {equalIgnoreCase()}
            defined — 준비 상태 판정; 함수: {defined()}
        동작:
            편집 정보·이동 전후 타일·drawArg 중 필요한 값이 없으면 종료한다. 양쪽 키로 타일을 조회하며 이동 후 키가 없을 때만 원본 타일을 대체로 쓴다.
            이동 후 타일과 캐시가 있으면 그룹이 없을 때 그룹을 만들고 그 자식에서 ID를 검색한다. 그룹이 이미 있는 경우에는 이 검색을 하지 않는다.
            검색 결과가 없으면 편집 메시의 _tile을 _opt._tile로 바꾸고 그룹에 추가한다. 이동 후 키와 원본 키의 타일을 차례로 해제한다.
            이동 후 타일의 편집 작업 중 대소문자 무시 ID가 일치하는 항목을 제거하고 빈 버킷을 삭제한다.
            split이 undefined이면 편집 목록과 사전에서 제거하고, 아니면 editData를 split만 가진 객체로 바꾸고 mode를 undefined로 둔다.
            분리 모델의 유휴 상태를 확인한다.
            두 타일이 모두 있으면 WFS 종류에서는 createModel, 그 외에서는 createModelByFrustum으로 이동 후·원본 순서로 재생성하고 drawArg 갱신일을 변경한다.

    removeEditModelAll() -> void
        의존:
            U3dLayer — 편집 작업과 앱; 속성 쓰기: {_editWorkBuffer}; 속성 읽기: {_app}
            U3dApp — 타일 트리 재시작; 함수: {restartQuadTree()}
            defined — 앱 판정; 함수: {defined()}
        동작: 편집·삭제 목록과 편집 사전·작업 버퍼를 새 빈 컬렉션으로 교체하고 앱이 있으면 쿼드트리를 재시작한다.

    removeFilter(featureId: string) -> boolean
        의존: defined — ID 판정; 함수: {defined()}
        동작: ID가 정의되면 removedList의 정확한 includes 결과를, 아니면 false를 반환한다.

    editFilter(featureId: string) -> boolean
        의존: defined — ID 판정; 함수: {defined()}
        동작: ID가 정의되면 editedList의 정확한 includes 결과를, 아니면 false를 반환한다.

    addFaceIndexInfo(object: ModelMesh, info: FaceIndexInfo, faceIndex: number) -> EditedEvent | undefined
        의존:
            ModelMesh — 대상 ID·재질; 함수: {getUid()}; 속성 읽기: {id, material}
            defined — 입력·편집 정보 판정; 함수: {defined()}
        동작:
            info 또는 faceIndex가 정의되지 않으면 종료한다. 모델 ID는 getUid가 있으면 그 결과, 아니면 object.id를 사용한다.
            편집 목록에 없는 ID를 추가한다.
            composedInfo.id, materialIndex, tileMaxKey를 가진 splitInfo를 만들고 편집 이벤트의 materialSplit Map에 faceIndex로 넣는다. 기존 이벤트가 없으면 새 이벤트를 만든다.
            object.material이 배열이고 composedInfo.id가 정의되면 자식 ID의 편집 이벤트도 등록·갱신하여 materialColor에 부모 ID, 재질 번호, start·count·타일 키를 보관한다.
            부모 ID의 편집 이벤트 원본 참조를 반환한다.

    cancelRemoveByUid(uid: string) -> void
        의존:
            UDEF — 분리 모델 표시; 상수: {U3F_DETACHED_TOKEN}
            ModelMesh — 복원 대상 상태·스타일; 속성 읽기: {_disposed, userData.styleinfo.visible}; 속성 쓰기: {visible}
            U3dLayer — 레이어 표시 상태; 함수: {getVisible()}
            defined — 값·함수 존재 판정; 함수: {defined()}
        동작:
            removedList에서 문자열에 uid를 포함하는 값들을 찾는다. 있으면 각 값을 현재 목록에서 splice로 제거한다.
            분리 표시가 있으면 첫 표시를 제거한 ID로 비병합 모델을 찾아 일단 숨긴다. 편집 정보에 split이 있으면 원본 ID도 목록에서 한 번 제거한다.
            각 ID의 모델이 해제되지 않았고 진행 중 분리 표식이 없으면 휴면을 해제한다. userData.styleinfo.visible이 정의되면 그 truthy 결과로, 아니면 레이어 가시성으로 표시한다.
            처리 후 checkDivisionMeshIdle 참조를 defined에 전달해 존재를 판정하고 정의되면 호출하고 종료한다.
            포함 결과가 없으면 정확히 같은 값을 다시 찾아 없을 때 종료한다. 남은 복원 경로에서도 같은 해제·요청·스타일 조건을 적용한 뒤 목록에서 첫 결과를 제거한다.

    cancelRemoveAll() -> void
        의존:
            UDEF — 분리 표시 제거; 상수: {U3F_DETACHED_TOKEN}
            ModelMesh — 해제 상태·가시성; 속성 읽기: {_disposed}; 속성 쓰기: {visible}
            defined — 모델 판정; 함수: {defined()}
        동작:
            삭제 ID의 첫 분리 표시를 제거해 모델을 찾고 해제되지 않았으며 진행 중 분리 표식이 없으면 휴면을 해제하고 무조건 표시한다.
            removedList를 새 빈 배열로 교체하고 분리 모델의 유휴 상태를 확인한다.

    getRemovedUidList() -> Array<string>
        동작: 현재 removedList의 원본 참조를 반환한다.

    override disposeTileByKey(key: string) -> void
        의존: U3dLayer — 키별 해제; 함수: {super.disposeTileByKey()}
        동작: 부모에 key를 전달하고 부모 반환값을 그대로 반환한다.

    override disposeTile(tile: U3dQuadTile) -> void
        의존:
            U3dLayer — drawArg·캐시; 속성 읽기: {_drawArg, _cache}
            U3dQuadTile — 타일 drawArg; 속성 읽기: {_drawArg}
            UCache — 키 생성; 함수: {createKeyByTile()}
            defined — 준비 상태 판정; 함수: {defined()}
        동작: 타일 또는 양쪽 drawArg가 없으면 종료하며, 타일이 해제 대상으로 판정되고 캐시가 있을 때만 캐시 키를 생성해 해제한다.

    deleteMesh(mesh: Object3D) -> void
        의존:
            U3dModelU3FLayer(self) — 파생 레이어가 제공할 수 있는 선택 공유 재질; 속성 읽기: {_sharedMaterial}
            UDEF — 소유 객체 해제; 정적 함수: {disposeObject3D()}
            UGroup — 라벨 분리; 함수: {remove()}
            ModelMesh — 자식 정리·분리 모델 정리; 함수: {clear(), getUid(), removeDivisionMeshes()}; 속성 읽기: {userData, children, createModelMesh, material}
            U3dLayer — drawArg; 속성 읽기: {_drawArg}
            defined — 자원 판정; 함수: {defined()}
        동작:
            mesh가 없으면 종료한다. 라벨이 있으면 해제·그룹 분리 후 라벨 참조를 undefined로 바꾼다.
            자식 목록의 복사본을 재귀적으로 삭제한 뒤 mesh.clear를 실행한다.
            createModelMesh가 정의되어 있으면 편집 split ID를 조회한다. 원본이 삭제 목록에 없으면 removeDivisionMeshes를 실행하고 성공 시 원본 삭제 ID를 제거한다.
            레이어의 _sharedMaterial과 같은 재질 참조이면 mesh.material을 undefined로 바꾼 뒤 UDEF.disposeObject3D로 모델 자체를 해제한다.

    override fncDeleteGroup(object?: Object3D) -> void
        인터페이스: 캐시의 receiver 지정 호출에서 this는 레이어다.
        의존:
            U3dLayer — 그룹; 속성 읽기: {_group}
            UGroup — 그룹 분리; 함수: {remove()}
            THREE — 해제 가능한 객체 종류; 상속: {THREE.Group, THREE.Mesh}
            defined — 대상 판정; 함수: {defined()}
        동작: object가 없으면 종료하고 그룹에서 제거한 뒤 Group 또는 Mesh인 경우에만 모델 삭제를 실행한다.

    override getTileFromScene(tile: U3dQuadTile) -> Object3D | undefined
        의존:
            U3dLayer — 장면·캐시·그룹; 함수: {getScene(), getCache()}; 속성 읽기: {_group}
            UGroup — 그룹 포함 판정; 함수: {has()}
            defined — 타일·장면 판정; 함수: {defined()}
        동작: tile과 장면이 있고 캐시 결과가 truthy이며 그룹에 포함돼 있을 때만 캐시 객체를 반환한다. 그 외에는 undefined다.

    override addTileFromScene(tile: U3dQuadTile) -> Object3D | void
        의존:
            U3dLayer — 장면·캐시·그룹; 함수: {getScene(), getCache()}; 속성 읽기: {_cache, _group}
            UGroup — 장면 등록; 함수: {add()}
            defined — 준비 상태 판정; 함수: {defined()}
        동작: 캐시와 장면이 있고 조회한 객체와 그룹이 정의되면 그룹에 추가하고 객체를 반환한다. 그 외에는 undefined다.

    override removeTileFromScene(tile: U3dQuadTile) -> Object3D | void
        의존:
            U3dLayer — 장면·캐시·그룹; 함수: {getScene(), getCache()}; 속성 읽기: {_cache, _group}
            UGroup — 장면 분리; 함수: {remove()}
            defined — 준비 상태 판정; 함수: {defined()}
        동작: 캐시와 장면이 있고 조회한 객체와 그룹이 정의되면 그룹에서 제거하고 객체를 반환한다. 그 외에는 undefined다.

    createGroup(tile: U3dQuadTile) -> boolean
        의존:
            U3dLayer — 타일 키·캐시; 함수: {createKeyFromTile()}; 속성 읽기: {_cache}
            UCache — 그룹 조회·보관; 함수: {get(), add()}
            UGroup — 그룹 생성; 생성자: {new UGroup()}
            defined — 캐시 판정; 함수: {defined()}
        동작: 캐시가 있고 타일 키의 기존 값이 falsy이면 tile._drawArg를 drawarg 옵션으로 그룹을 생성·캐시하고 true를 반환한다. 그 외에는 false다. 장면에는 직접 추가하지 않는다.

    createGroupByKey(key: string) -> boolean
        의존:
            U3dLayer — 캐시; 속성 읽기: {_cache}
            UCache — 그룹 조회·보관; 함수: {get(), add()}
            UGroup — 그룹 생성; 생성자: {new UGroup()}
            defined — 캐시 판정; 함수: {defined()}
        동작: 캐시가 있고 key의 기존 값이 falsy이면 기본 그룹을 생성해 name=key로 설정·캐시하고 true를 반환한다. 그 외에는 false다.

    override show(show: boolean, refresh?: boolean) -> void
        의존: U3dLayer — 표시 변경; 함수: {super.show()}
        동작: 두 인수를 부모에 전달하고 반환값은 버린다.

    override createModel(tile: U3dQuadTile) -> boolean | Promise<unknown> | undefined
        의존:
            U3dLayer — 레이어 가시성·영역·상태; 함수: {intersects3D(), resetStateTile()}; 속성 읽기: {_visible}
            U3dQuadTile — 타일 앱·부모 갱신 가능 여부; 함수: {getParent(), updatePossible()}; 속성 읽기: {_drawArg, _rectangle3d}
            defined — 입력 상태 판정; 함수: {defined()}
        동작:
            tile._drawArg와 앱을 먼저 확인한다. 따라서 tile 자체가 nullish이면 보호 분기 전에 예외가 발생한다. [확인 Q-001]
            타일 폐기, 레이어 visible===false, 타일 메시 부재 판정을 순서대로 검사한다.
            부모가 있으나 갱신 불가이거나 레이어 영역과 교차하지 않으면 거부한다.
            모두 통과하면 true이며 거부 경로에서는 타일 상태를 초기화하고 false를 반환한다. 이 구현 자체는 Promise를 만들지 않는다.

    createModelByFrustum(tile: U3dQuadTile, drawArg: UDrawArg, force?: boolean) -> boolean
        의존:
            U3dLayer — CRS·레벨·가시성·영역; 함수: {intersects3D()}; 속성 읽기: {_crs, _minlevel, _maxlevel, _visible}
            U3dQuadTile — 타일 앱·부모; 함수: {getParent(), updatePossible()}; 속성 읽기: {_drawArg, _rlevel, _rectangle3d}
            defined — 입력 상태 판정; 함수: {defined()}
        동작:
            tile._drawArg와 앱을 tile 자체 판정보다 먼저 읽는다. [확인 Q-001]
            drawArg·force 인수는 사용하지 않고 타일 drawArg를 사용한다. 앱 부재, 타일 폐기, 부모 갱신 불가, 메시 부재, visible===false 순서로 false를 반환한다.
            CRS가 EPSG:3857이 아니거나 레벨이 min보다 작거나 max보다 크거나 영역이 교차하지 않으면 false이며 그 외 true다. 실제 프러스텀 박스 검사는 하지 않는다.

    disposeTileModelAll(drawArg?: UDrawArg) -> void
        의존:
            U3dLayer — 기본 drawArg·캐시; 속성 읽기: {_drawArg, _cache}
            UDrawArg — 타일 조회; 함수: {getTile()}
            UCache — 키 열거; 함수: {keys()}
            UDEF — 모델 타일 종류; 상수: {TILE_TYPE.MODEL}
            defined — 준비 상태 판정; 함수: {defined()}
        동작: drawArg가 없으면 레이어 값을 쓰며 drawArg 또는 캐시가 없으면 종료한다. 캐시 키에 대응하는 모델 타일이 없을 때 키별 해제를 실행한다.

    disposeTileFromDistance(limit: number) -> void
        의존:
            U3dLayer — drawArg·캐시·타일 상태; 함수: {resetStateTile()}; 속성 읽기: {_drawArg, _cache}
            UDrawArg — 거리 기준·정지 모드·타일; 함수: {getFrustumNearCenter(), getStopModel(), getTile()}
            UCache — 키 열거; 함수: {keys()}
            UDEF — 모델 타일 종류; 상수: {TILE_TYPE.MODEL}
            defined — 입력 판정; 함수: {defined()}
        동작:
            drawArg·limit·캐시 중 하나라도 없으면 종료한다. 근거리 중심을 얻고 모델 정지 모드일 때만 캐시를 순회한다.
            중심이 없거나 거리 포함 판정이 false이면 해당 타일이 있을 때 상태를 초기화한 뒤 키별로 해제한다.

    isTileDisposed(tile: U3dQuadTile, drawArg: UDrawArg) -> boolean
        의존:
            UDrawArg — 모델 정지 모드·타일; 함수: {getStopModel(), getTile()}
            UDEF — 모델 타일 종류; 상수: {TILE_TYPE.MODEL}
            defined — drawArg 판정; 함수: {defined()}
        동작: drawArg가 없거나 모델 정지 모드이면 false다. 그 외에는 tile._key에 대응하는 타일 조회 결과가 falsy이면 true, 아니면 tile._disposed를 반환한다.

    isTileMeshDisposed(tile: U3dQuadTile, drawArg: UDrawArg) -> boolean
        의존:
            UDrawArg — 모델 정지 모드; 함수: {getStopModel()}
            defined — 메시 판정; 함수: {defined()}
        동작: 모델 정지 모드가 아니면서 tile._mesh가 정의되지 않았을 때만 true를 반환한다.

    updateDetailByFrustum(tile: U3dQuadTile, drawArg?: UDrawArg, force?: boolean) -> boolean
        의존:
            U3dLayer — CRS·레벨·가시성·영역; 함수: {intersects3D()}; 속성 읽기: {_crs, _minlevel, _maxlevel, _visible}
            UFrustum — 박스 포함 판정; 함수: {intersectsBox()}
            defined — 준비 상태 판정; 함수: {defined()}
        동작:
            tile._drawArg와 앱을 tile 자체 판정보다 먼저 읽는다. [확인 Q-001]
            앱 부재, 타일 폐기, 타일 메시 부재, visible===false이면 false를 반환한다.
            CRS가 EPSG:3857이 아니거나 레벨 범위 밖이거나 영역 비교차이면 false다.
            drawArg가 없으면 tile._drawArg를 쓰며 drawArg·프러스텀이 없으면 false다. 프러스텀과 타일 경계가 비교차이거나 다시 검사한 폐기 결과가 정확히 true이면 false이고 그 외 true다. force는 사용하지 않는다.

    override isUpdate() -> boolean
        의존:
            U3dLayer — 부모 갱신 판정·drawArg; 함수: {super.isUpdate()}; 속성 읽기: {_drawArg}
            UDrawArg — 모델 정지 모드; 함수: {getStopModel()}
            defined — 버퍼·drawArg 판정; 함수: {defined()}
        동작: 부모가 갱신 필요이면 true, _tileBuffer가 있고 length>0이면 true, drawArg가 있고 모델 정지 모드이면 true, 그 외 false를 반환한다.

    override update(drawArg: UDrawArg) -> void
        의존:
            U3dLayer — 부모 갱신; 함수: {super.update()}
            UDrawArg — 정지 모드·최대 거리; 함수: {getStopModel(), getMaxDistanceModel()}
            defined — 인수·공유 시각 판정; 함수: {defined()}
        동작:
            drawArg가 없으면 종료한다. 공유 _curTime이 없거나 _curTime<_updatedTime일 때만 이하를 실행한다.
            _curTime을 현재 시각으로 갱신하고 _updatedTime이 없으면 같은 값으로 초기화한다.
            모델 정지 모드이고 최대 거리가 정의되면 거리 밖 타일을 정리한다.
            부모 update를 실행한 뒤 _updatedTime=_curTime+1로 설정한다.

    override change(drawArg: UDrawArg) -> void
        동작: 아무 동작 없이 undefined로 종료한다.

    override updateHeight(tile: U3dQuadTile, drawArg?: UDrawArg, force?: boolean) -> void
        동작: 아무 동작 없이 undefined로 종료한다.

    override getMetaData() -> UMeta
        의존:
            U3dLayer — 부모 메타와 투명 설정; 함수: {super.getMetaData()}; 속성 읽기: {_transparent}
            UMeta — 메타 자식 추가; 함수: {addChild()}
        동작: 부모 메타에 현재 transparent 정보를 자식으로 추가하고 같은 메타 참조를 반환한다.

    setOriginCenter(mesh: ModelMesh) -> void
        의존:
            U3dLayer — 좌표 변환기; 속성 읽기: {_drawArg}
            UDrawArg — 좌표 변환; 함수: {getGoogleToGeographic(), getGeographicToWorld()}
            BufferGeometry — 경계·중심 재설정; 함수: {computeBoundingBox(), center()}
            Vector3 — 변환된 중심 보상; 함수: {addVectors(), divideScalar(), clone(), multiply(), applyQuaternion(), add()}
            defined — 입력 판정; 함수: {defined()}
        동작:
            geometry가 없으면 종료한다. userData.centerGoogle이 있으면 drawArg 없을 때 종료하며 지리 좌표 변환 결과가 있으면 월드 좌표를 기존 position에 더하고 경계 계산 후 종료한다.
            그 외에는 geometry 경계의 중심을 공용 centroid에 계산하고 geometry.center로 정점을 이동한다.
            중심을 mesh.scale과 quaternion으로 변환한 보상 벡터를 position에 더해 기존 객체 변환 결과를 보존한다.

    editedModel(mesh: ModelMesh, editedEvent: EditedEvent) -> boolean | void
        의존:
            ModelMesh — 모델 식별; 함수: {getUid()}; 속성 읽기: {userData.id}
            defined — 입력·이력 판정; 함수: {defined()}
        동작:
            mesh가 없으면 종료한다. getUid가 정의되어 있으면 그 결과, 아니면 userData.id를 쓰며 그 값도 없으면 editedEvent.id를 사용한다.
            목록에 없고 이벤트가 정의되면 ID를 추가하고 이전 이벤트를 조회한다.
            이전 이벤트가 있으면 Object.assign으로 이전 editData 원본을 변경하고 새 이벤트.editData에 같은 참조를 넣는다.
            사전에 입력 이벤트 자체를 저장하고 mesh와 _isAdd=false를 기록한다. 다시 조회 가능하면 true이며 false를 반환하는 경로는 없다.

    getModelById(id: string, isMerged?: boolean) -> ModelMesh | undefined
        의존:
            U3dLayer — 모델 장면; 속성 읽기: {_scene}
            THREE — 메시 판정; 상속: {THREE.Mesh}
            Object3D — 장면 순회; 함수: {traverse()}
            ModelMesh — ID·병합 속성; 함수: {getUid(), isMerged()}; 속성 읽기: {userData.oid}
            defined — 선택값·ID 판정; 함수: {defined()}
        동작:
            isMerged가 정의되지 않으면 true로 설정한다. 장면을 순회하며 찾은 뒤의 객체 처리는 생략한다.
            Mesh 중 getUid 결과가 정의되고 문자열 ID가 정확히 일치할 때 선택한다. isMerged가 truthy이면 병합 여부를 제한하지 않으며 false이면 isMerged 메서드 결과도 false여야 한다.
            userData.oid가 있으면 쉼표로 나눈 옛 ID도 확인한다. id.split이 Function 인스턴스일 때만 입력의 첫 밑줄 조각과 비교하며 같은 병합 조건을 적용한다.
            선택한 메시 참조 또는 undefined를 반환한다.

    setEmissiveColor(r: number, g: number, b: number) -> boolean
        의존:
            Color — 공유 발광색 변경; 함수: {setRGB()}
            U3dLayer — drawArg; 속성 읽기: {_drawArg}
            U3dApp — 렌더 갱신 요청; 함수: {setUpdateDate()}
            defined — 상태 판정; 함수: {defined()}
        동작: _emissive가 없으면 false다. 있으면 RGB를 변경하고 drawArg가 있을 때 앱 갱신일을 변경한 뒤 true를 반환한다.

    getEmissiveColor() -> Color
        동작: 공유 _emissive 원본 참조를 반환한다.

    getToonImgUrl() -> string | undefined
        동작: 현재 _toonImgUrl을 반환한다.

    setToonImgUrl(url: string) -> void
        의존: defined — 입력 판정; 함수: {defined()}
        동작: url이 정의된 경우에만 _toonImgUrl을 교체하며 빈 문자열도 저장한다.

    settingModelLayerMaterial(material: ModelMaterial) -> void
        의존:
            UDEF — 기본 발광색·공통 재질 설정; 정적 함수: {settingModelLayerMaterial()}; 상수: {DEFAULT_MODEL_EMISSIVE_COLOR}
            THREE — 발광색 생성; 생성자: {new THREE.Color()}
            defined — 발광색 판정; 함수: {defined()}
        동작: _emissive가 없으면 _emissiveColor 또는 기본값으로 Color를 만든다. 공통 재질 설정 후 material.emissive에 레이어 Color 참조를 대입한다.

    setWireframe(setWireframe: boolean) -> void
        의존:
            U3dLayer — 장면; 속성 읽기: {_scene}
            Object3D — 재질 순회; 함수: {traverse()}
            defined — 장면·재질 판정; 함수: {defined()}
        동작:
            장면이 없으면 상태도 바꾸지 않고 종료한다. type이 정확히 Mesh인 객체의 재질을 처리한다.
            재질 배열이면 모든 항목의 wireframe과 needsUpdate를 설정하고 단일 재질이면 정의되어 있고 값이 다를 때만 설정한다.
            입력이 truthy이면 _setWireframe에 입력을 저장하고 그 외에는 undefined로 둔다.

    setTileFromEditedModel(mesh: ModelMesh, layer: U3dModelLayer, drawArg: UDrawArg) -> Promise<U3dQuadTile>
        의존:
            deferred — 완료 객체; 함수: {deferred()}
            UDrawArg — 편집 위치의 타일 검색; 함수: {getLevelTileFromWorld()}
            ModelMesh — 모델 ID·소속 타일; 함수: {getUid()}; 속성 읽기: {_tile, _preTile}; 속성 쓰기: {_preTile}
            defined — 타일 판정; 함수: {defined()}
        동작:
            모델 위치와 기존 타일 레벨로 새 타일을 검색한다. layer 인수는 사용하지 않는다.
            검색 타일이 있으면 기존 _preTile이 정의되고 키가 다를 때 새 키로 바꾸며, _preTile이 없으면 기존 _tile의 키를 먼저 저장한다.
            해당 편집 이벤트의 _oriTile과 _afterTile을 기존 타일로 설정한다. 검색 결과가 있으면 _afterTile을 검색 타일로 바꾸고, 여전히 _preTile이 없으면 기존 키를 넣는다.
            검색 타일 또는 기존 타일로 deferred를 즉시 resolve하고 반환한다. 필요한 기존 타일·편집 이벤트가 없을 때의 예외를 잡지 않는다.

    getEditedEventById(id: string) -> EditedEvent | undefined
        의존: defined — ID·이벤트 판정; 함수: {defined()}
        동작: id가 없거나 editedList가 비면 undefined다. 그 외에는 사전에 정의된 id의 원본 이벤트를 반환하며 해당 id의 목록 포함 여부는 별도로 검사하지 않는다.

    mergedMeshDivision(object: ModelMesh, afterFunction?: function) -> Array<Object3D> | undefined
        인터페이스: afterFunction은 텍스처 적용 후 자식과 drawArg를 받으며 직접 함수 호출이므로 레이어 receiver를 지정하지 않는다. 반환은 분리 직후 목록이며 텍스처 완료를 기다리지 않는다.
        의존:
            UMesh — 분리 가능한 모델; 상속: {UMesh}
            ModelMesh — 모델 분리·식별·재질; 함수: {mergedMeshDivision(), getUid()}; 속성 읽기: {_disposed, _isMerged, _opt, parent}; 속성 쓰기: {_sleeping, _isMerged, _uImageUrls, visible, _curImagelevel}
            Material — 편집용 재질 복제; 함수: {clone()}
            Texture — 교체·미사용 텍스처 해제; 함수: {dispose()}
            U3dLayer — 레이어 상태·drawArg; 속성 읽기: {_disposed, _drawArg}
            UDEF — 분리 표시; 상수: {U3F_DETACHED_TOKEN}
            afterFunction — 완료 콜백; 콜백: {afterFunction()}
            DeferredObject(loadTexturePromise) — 텍스처 완료·실패 콜백 등록; 함수: {then(), catch()}
            __GInfo__ — 텍스처 실패 기록; 함수: {__GInfo__()}
            defined — 입력·편집 상태 판정; 함수: {defined()}
        동작:
            대상이 없거나 해제됐거나 원본 ID가 삭제 목록에 있으면 종료한다. 기존 편집 split 원본도 삭제 목록에 있으면 종료한다.
            _isMerged가 정의되고 truthy인 UMesh에서만 메시 자체의 분리를 실행한다. 결과 자식이 없으면 undefined다.
            원본을 휴면으로 바꾸고 새 요청 표식을 보관한다. 현재 요청 판정은 레이어·원본 미해제, 원본 휴면, 같은 표식이라는 조건을 모두 요구한다.
            텍스처 레벨은 부모가 정의되면 부모 값, 아니면 원본 값이다.
            _opt.images가 truthy이면 URL 구성에 원본 옵션과 빈 결과 배열을 전달한다. 이 호출은 각 image.baseurl 원본도 직접 보정하므로 반복 분리에서도 변경된 옵션을 읽는다.
            같은 이미지 조건 안에서 UMesh 자식을 결과 목록에 모으고 비병합으로 바꾼다. 편집 이벤트가 없으면 split 이벤트를 만들고, 있으면 기존 editData 원본에 split을 추가하며 위치·메시·타일·콜백을 갱신한다.
            자식에 공용 URL 배열 참조를 저장한다. 자식 재질이 원본과 같은 참조이면 단일 재질 또는 배열 원소를 clone한 것으로 교체한 뒤 직접 map이 있으면 비우고 자식을 숨긴다.
            마지막 URL을 로딩하고 성공 콜백을 등록한다. 요청이 오래됐으면 받은 텍스처를 해제하고 종료한다.
            자식마다 현재 요청·미해제·비휴면을 재확인한다. 단일 재질의 _oriMap이 정의되면 map을 비우고 URL 최종 인덱스를 레벨로 설정한다.
            그 외에는 재질별 기존 map을 해제하고 원본 재질의 truthy _oriColor·_oriOpacity를 전달한다. 배열의 barrierMaterial은 건너뛰며 나머지 재질은 받은 texture를 공유한다.
            _exceptTexture가 정의되어 있으면 false라도 map을 _oriMap에 보관할 수 있으며 map을 비운다. 재질 needsUpdate를 켜고 이 경로의 자식 레벨을 앞서 선택한 레벨로 설정한다.
            분리 표시 ID가 삭제 목록에 없고 자식이 미해제·비휴면이면 표시한다. 부모가 합성 메시이면 다시 숨긴다. afterFunction과 drawArg가 있으면 콜백을 실행한다.
            자식 목록을 예외 없이 처리한 뒤에도 현재 요청이면 원본 ID를 삭제 목록에 등록하고 원본을 숨긴다. 아무 재질도 texture를 사용하지 않았으면 해제한다.
            텍스처 로딩 실패는 catch에서 8949013 로그로 전달한다. 일반 function catch의 this를 로그 receiver 인수로 쓰며 레이어로 바인딩하지 않는다.
            완료를 기다리며 등록한 성공 콜백에서 발생한 예외는 deferred가 __GSError__로 기록하며 위 catch로 전달하지 않는다.
            afterFunction에서 예외가 발생하면 남은 자식 처리, 원본 ID의 삭제 목록 등록·원본 숨김 및 콜백 끝의 미사용 텍스처 해제에 도달하지 않는다.
            중복 ID 그룹이 있으면 동기적으로 합성 처리를 실행하여 결과 children을 반환하고, 없으면 모아 둔 UMesh 목록을 반환한다. 이미지 옵션이 없으면 후자 목록은 비어 있다.

    checkDivisionMeshIdle() -> void
        의존:
            U3dLayer — drawArg; 속성 읽기: {_drawArg}
            ModelMesh — 분리 자식 정리; 함수: {removeDivisionMeshes()}; 속성 읽기: {_curImagelevel, _tile}
            Queue(_tileBuffer) — 타일 재처리; 함수: {enqueue()}
            UDrawArg — 갱신 요청; 함수: {setUpdateDate()}
            defined — 편집·메시 상태 판정; 함수: {defined()}
        동작:
            drawArg가 없거나 편집 목록·이벤트 값 배열 중 하나가 비면 종료한다.
            목록 ID의 편집 정보와 split ID가 있어야 진행한다. 메시의 removeDivisionMeshes가 있으면 앱·새 제거 목록·원본 ID를 전달한다.
            분리 정리가 성공하면 원본 모델을 찾고 타일이 있으면 현재 자식 텍스처 레벨로 원본을 복원하며 중복 없이 갱신 타일 목록에 모은다. 성공 시 반복 인덱스를 하나 감소시켜 변경된 편집 목록을 다시 확인한다.
            모은 타일을 _tileBuffer에 enqueue하고 _tileBufferMap이 truthy이면 같은 참조를 키로 기록한다. drawArg가 있으면 갱신일을 변경한다.

    setEditEvent(meshes: Array<Object3D>) -> void
        인터페이스: 편집 정보의 afterFunction은 editInfo의 멤버 호출이므로 this가 해당 editInfo다.
        의존:
            ModelMesh — ID·변환·재질·가시성; 함수: {getUid()}; 속성 읽기: {position, rotation, scale, material}; 속성 쓰기: {visible}
            Color — 원본 색상 보관·적용; 함수: {clone(), set()}
            U3dLayer — drawArg; 속성 읽기: {_drawArg}
            EditedEvent — 편집 후 콜백; 콜백: {afterFunction()}
            UDEF — 분리 표시; 상수: {U3F_DETACHED_TOKEN}
            defined — 입력·편집 데이터 판정; 함수: {defined()}
        동작:
            meshes가 없으면 종료한다. 각 메시의 편집 정보가 있을 때만 이하를 수행한다.
            editInfo.position과 editData가 정의되면 위치 거리가 0보다 크고 translate가 정의된 경우에만 현재 위치를 _oriPosition에 복사·저장하고 편집 위치로 바꾼다.
            같은 조건 안에서 rotate의 내부 _x·_y·_z 중 하나라도 0이 아니면 rotation 각 축에 그대로 대입하며, scale의 x·y·z 중 하나라도 0이 아니면 scale 각 축에 그대로 대입한다.
            재질이 truthy이면 단일·배열 원소에 색상과 텍스처 제외를 차례로 적용한다. material.color가 있고 isSetColor와 color가 모두 truthy이면 최초 truthy 판정에 따라 원본 색상·불투명도를 보관하고 color를 설정한다.
            같은 색상 조건에서 Number(editInfo.opacity)를 opacity로 쓰고 opacity<1 결과를 transparent에 넣는다. 색상 0은 이 경로를 통과하지 않는다.
            exceptTexture가 truthy이면 _oriMap이 정의되지 않았고 map이 정의됐을 때 원본 map을 보관하고 map을 undefined, _exceptTexture를 true로 만든다.
            editInfo.mesh를 현재 메시로 바꾸고 분리 표시 ID가 삭제 목록에 있으면 숨긴다. afterFunction과 drawArg가 있으면 editInfo receiver로 콜백을 실행한다.

    removeEdit(modelId: string) -> void
        의존:
            ModelMesh — 분리 정리·식별·변환; 함수: {removeDivisionMeshes(), getUid()}; 속성 읽기: {_disposed, _tile}; 속성 쓰기: {visible}
            U3dLayer — drawArg; 속성 읽기: {_drawArg}
            Queue(_tileBuffer) — 타일 재처리; 함수: {enqueue()}
            defined — 입력·편집 상태 판정; 함수: {defined()}
        동작:
            modelId가 없으면 종료하고 이벤트가 있으면 mode를 undefined로 대입한 뒤 삭제한다.
            메시가 있고 split 원본 ID·분리 정리 메서드가 있으면 정리를 시도한다. 성공하면 원본을 찾아 미해제일 때 삭제 ID를 제거하고 휴면을 해제·표시하며 원본 타일을 버퍼와 가능한 버퍼 맵에 등록한다.
            분리 정리가 성공하지 않았으면 _oriPosition이 있을 때 position을 복원하고 translate·_oriPosition을 삭제한다.
            같은 실패·미실행 경로에서 rotate가 있으면 각 축을 빼고 rotate를 삭제하며 scale이 있으면 각 축을 나누고 scale을 삭제한다. 편집 목록·이벤트 전체를 제거하지 않는다.

    getMaterialIndexByFace(object: Object3D, faceIndex: number) -> SplitInfo | void
        의존:
            ModelMesh — 모델 식별; 함수: {getUid()}; 속성 읽기: {id}
            defined — 입력·이벤트 판정; 함수: {defined()}
        동작: object·faceIndex가 없으면 종료한다. getUid 또는 object.id로 이벤트를 찾고 materialSplit이 truthy이면 faceIndex 값의 원본 참조를 반환한다. 그 외에는 undefined다.

    removeMaterialIndex(object: ModelMesh, materialIndex: number) -> boolean
        의존:
            ModelMesh — ID·선택 재질·원본 상태; 함수: {getUid()}; 속성 읽기: {id, material}; 속성 쓰기: {_pickMaterials}
            defined — 입력·편집 정보 판정; 함수: {defined()}
        동작:
            object 또는 materialIndex가 정의되지 않으면 false다. ID로 이벤트를 찾고 materialSplit이 있으면 재질 번호가 일치하는 모든 항목을 삭제한다.
            Map이 비면 materialSplit 속성을 삭제하고 editData의 키도 없으면 editedList에서 indexOf 결과로 한 항목을 splice한 뒤 이벤트를 삭제한다.
            _pickMaterials가 falsy이면 빈 배열로 만든다. material 배열이 truthy이고 지정 원소의 _oriColor·_oriOpacity가 truthy이면 각각 복원하고 원본 속성을 삭제한다.
            _pickMaterials에서 indexOf(materialIndex)의 한 항목을 splice하고 true를 반환한다. 없는 인덱스 -1의 splice와 재질 원소 부재 예외는 별도로 방어하지 않는다. [확인 Q-002]

    setSplitEvent(parent: ModelMesh, child: ModelMesh) -> EditedEvent | undefined
        의존:
            ModelMesh — ID·위치·타일; 함수: {getUid()}; 속성 읽기: {position, _tile}
        동작: 자식 ID가 편집 목록에 있으면 undefined다. 아니면 목록에 추가하고 부모 ID를 split로, 자식 position·mesh와 부모 타일 참조·_isAdd=false를 가진 새 이벤트를 저장·반환한다.

    #divisionMesh(object: ModelMesh) -> void
        의존:
            ModelMesh — 자식 ID·휴면·표시; 함수: {getUid()}; 속성 쓰기: {_sleeping, visible}
            UDEF — 분리 표시; 상수: {U3F_DETACHED_TOKEN}
        동작:
            대상의 분리 함수를 먼저 호출한다.
            결과 자식 중 obj.getUid가 truthy인 경우 분리 표시 ID를 삭제 필터로 검사하며, 목록에 있으면 휴면·숨김으로 바꾼다.

    #loadTexture(url: string) -> Promise<UTexture | UCanvasTexture>
        의존:
            deferred — 텍스처 완료 객체; 함수: {deferred()}
            UTextureLoader — 텍스처 로딩; 생성자: {new UTextureLoader()}; 함수: {load()}
            UDEF — 크기 변경 방지; 정적 함수: {noResizeTexture()}
            U3dLayer — 로더 분류; 속성 읽기: {_classtype}
            console — 실패 알림; 함수: {info()}
            defined — URL 판정; 함수: {defined()}
        동작: URL이 없으면 url undefined! 로그와 인수 없는 reject 후 deferred를 반환한다. 그 외에는 레이어 종류로 로더를 생성해 요청하며 성공 시 noResizeTexture 후 texture로 resolve, 실패 시 texture load error 로그와 인수 없는 reject를 실행한다.

    #addComposedMesh(meshList: Object3D, infoList: Record<string, Array<ModelMesh>>, imageUrls: Array<string>, isCurrentDivision: function) -> Object3D | undefined
        의존:
            ModelMesh — 자식 위치·수동 변환·등록; 함수: {setManualUpdate(), add()}
            Object3D — 합성 결과 등록; 함수: {add()}
            Texture — 텍스처 복제·해제; 함수: {clone(), dispose()}
            isCurrentDivision — 요청 유효성; 콜백: {isCurrentDivision()}
            DeferredObject(loadTexturePromise) — 텍스처 완료·실패 콜백 등록; 함수: {then(), catch()}
            __GInfo__ — 실패 기록; 함수: {__GInfo__()}
        동작:
            infoList 값이 없거나 meshList 자식이 없으면 undefined다. 그 외에는 ID별 원본 메시 목록을 순회한다.
            조립 결과가 truthy일 때만 이하의 자식 이동·로딩·등록을 수행하며 빈 목록의 undefined 결과는 건너뛴다.
                각 원본 메시의 position에서 반환된 독립 중심을 빼고 숨긴 뒤 합성 메시의 자식으로 옮기고 수동 변환을 갱신한다.
                마지막 이미지 URL을 로딩하고 합성 메시를 숨긴다.
                성공 시 현재 요청이 아니거나 합성 메시가 해제·휴면이면 받은 map을 해제하고 종료한다. 그 외에는 각 합성 재질에 map.clone을 적용하고 needsUpdate를 켠 뒤 원본 map을 해제하고 합성 메시를 표시한다.
                텍스처 로딩 실패는 catch에서 레이어를 receiver 인수로 8949013 로그에 전달한다.
                완료를 기다리며 등록한 성공 콜백에서 발생한 예외는 deferred가 __GSError__로 기록하며 위 catch로 전달하지 않는다. 예외 지점 이후의 재질 적용·원본 map 해제·합성 메시 표시는 이어서 실행되지 않는다.
                비동기 완료를 기다리지 않고 합성 메시를 meshList에 추가한다.
            최종 meshList 원본 참조를 반환한다.

    #restoreMergedMesh(mergedMesh: ModelMesh, level: number) -> void
        의존:
            ModelMesh — ID·텍스처 갱신; 함수: {getUid(), changeTextureImage()}; 속성 읽기: {_disposed, material, _opt, _uImageUrls}; 속성 쓰기: {visible, _curImagelevel}
            defined — 이미지 목록 판정; 함수: {defined()}
        동작:
            mergedMesh._disposed가 truthy이면 종료한다.
            mergedMesh._disposed가 falsy(false·undefined 등)이면 삭제 목록의 원본 ID를 제거하고 표시한 뒤 휴면·이전 요청을 해제한다.
            재질·map·source가 없으면 종료한다. source.data의 width 또는 height가 0일 때만 _curImagelevel=-1로 바꾼다.
            같은 조건에서 옵션이 있고 URL 배열이 비어 있으면 images의 baseurl+'/'+name을 추가한 뒤 changeTextureImage가 있으면 level로 호출한다.

    #wakeModel(mesh: ModelMesh) -> void
        동작: 이미 해제된 메시이면 종료한다. 아니면 _sleeping=false로 바꾸고 현재 분리 요청 표식을 제거하며 가시성은 바꾸지 않는다.

centroid: Vector3
    의존: THREE — 중심 계산용 공용 임시 벡터; 생성자: {new THREE.Vector3()}
    모듈 평가 시 한 번 생성하며 setOriginCenter가 동기 계산에 재사용한다.

_curTime, _updatedTime: number | undefined = undefined
    모든 인스턴스의 update가 공유하는 모듈 상태다.

addWork_(workprocess: WorkProcess, work: U3dQuadTileWork) -> boolean
    의존:
        defined — 처리기 판정; 함수: {defined()}
        U3dQuadTileWorkProcess — 작업 등록; 함수: {add()}
    동작: 처리기가 없으면 false이며 있으면 add(work)를 호출하고 true를 반환한다.

U3dModelLayerComposedMesh 부분 타입 명세
    이 명세에서 사용하는 필드:
        geometry: BufferGeometry
        material: Array<ModelMaterial>
        _sphere: Sphere
        _utype: number
        _ulayername: string
        getBBox: () -> Box3
    ModelMesh와 위 필드들의 교집합이다.

U3dModelLayerComposedResult 타입 정의
    mesh: U3dModelLayerComposedMesh
    position: Vector3
        자식 위치 보상용 독립 중심이다.

U3dModelLayerCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        useTexture: boolean = true
        setWireframe: boolean = false
        compressModel: boolean = false
        ext: string = .u3f
        toonImgUrl?: string
        emissiveColor?: RGBColor
        useEditMode: boolean = true
        usetexture?: boolean
            useTexture의 하위 호환 별칭이다.
        compressmodel?: boolean
            compressModel의 하위 호환 별칭이다.

U3dModelLayerCO 타입 정의
    U3dLayerCO와 U3dModelLayerCO_Content의 교집합이다.

SplitInfo 타입 정의
    childId: string
    materialIndex: number
    tileMaxKey?: string

MaterialColorInfo 타입 정의
    id: string
    materialIndex, start, count: number
    tileMaxKey?: string

EditData 부분 타입 명세
    이 명세에서 사용하는 필드:
        translate?: Vector3
        rotate?: Euler | Vector3
        scale?: Vector3
        _oriPosition?: Vector3
        split?: string
        materialSplit?: Map<number, SplitInfo>
        materialColor?: MaterialColorInfo

EditedEvent 부분 타입 명세
    이 명세에서 사용하는 필드:
        id: string
        position?: Vector3
        editData: EditData
        mode?: string
        axis?: Vector3
        mesh?: ModelMesh
        _oriTile, _afterTile?: U3dQuadTile
        _isAdd, isSetColor, exceptTexture?: boolean
        color?: string | number | ColorRepresentation
        opacity?: number | string
        afterFunction?: (mesh: Object3D, drawArg: UDrawArg) -> void

FaceIndexInfo 타입 정의
    composedInfo: object
        id: string
        start, count: number
    materialIndex: number
    tileMaxKey?: string

RGBColor 타입 정의
    r, g, b: number

DrawArgExt 부분 타입 명세
    이 명세에서 사용하는 필드:
        _cacheModelTiles: UCache
        _app: U3dApp
        _frustum: UFrustum

DrawArg 타입 정의
    UDrawArg와 DrawArgExt의 교집합이다.

LayerSelfExt 부분 타입 명세
    이 명세에서 사용하는 필드:
        _tileBuffer: object
            enqueue: (tile: U3dQuadTile) -> void
            length: number
        _tileBufferMap?: Record<string, U3dQuadTile>

WorkProcessExt 부분 타입 명세
    이 명세에서 사용하는 필드:
        getWorkingLevel2, getWorkingLevel3: () -> number
        add: (work: U3dQuadTileWork, customIndex?: number) -> void
        process: (curTime: number) -> number

WorkProcess 타입 정의
    U3dQuadTileWorkProcess와 WorkProcessExt의 교집합이다.

MeshUserDataExt 부분 타입 명세
    이 명세에서 사용하는 필드:
        id, oid?: string
        label?: Object3D
        centerGoogle?: object
            x, y, z: number

ImageOpt 부분 타입 명세
    이 명세에서 사용하는 필드:
        images?: Array<object>
            baseurl, name: string
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
