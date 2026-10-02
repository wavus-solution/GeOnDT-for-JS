# U3dModelU3FLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dModelU3FLayer`는 U3F 모델을 타일 단위로 로드하여 장면에 배치하고, 거리별 텍스처 교체와 편집 결과의 재적용을 담당하는 모델 레이어다.

### 1.2 책임 범위

- 레이어 정보와 타일별 모델 목록을 읽고 모델 작업을 예약한다.
- Worker 또는 직접 파싱 결과를 공유 메시와 병합 메시로 구성한다.
- 추가 방식인 ADD와 대체 방식인 REPLACE 사이의 표시 범위를 재질 인덱스로 전환한다.
- 텍스처 해상도, 개별 건물 색상·분할 편집, 캐시 및 자원 해제를 관리한다.

### 1.3 주요 동작 방식

레이어 정보로 공간 범위를 초기화한 뒤 타일 정보를 요청한다. 모델 작업을 큐에 등록하고 파싱 결과에서 메시를 생성한다. 프레임 갱신은 거리와 처리 중인 작업 수를 확인하여 텍스처 갱신을 예약한다. 타일의 제거와 재등장은 공유하는 재질 범위의 숨김·복원을 동반한다. 작업 등록 완료와 모델·텍스처 다운로드 완료는 서로 다른 경계다.

### 1.4 주요 사용처와 연계 대상

- `U3dModelLayer`의 캐시·편집·작업 큐와 타일 상태 관리 기능을 확장한다.
- `U3fPackagedInfo`는 패키지 JSON의 타일 정보를 제공한다.
- `U3FParser`, `U3FPackageParser`와 `U3fParserTask`는 모델 데이터를 복원한다.
- `USharedMesh`, `UU3fMesh`는 공유 텍스처와 분할·병합 모델의 렌더 객체다.

## 3. 정규 자연어 수도코드

```spec
U3dModelU3FLayer extends U3dModelLayer 클래스 정의
    의존: U3dModelLayer — 모델 레이어 기반 기능; 상속: {U3dModelLayer}

    static OPT_KEYS: Array<string>
        의존: U3dModelLayer — 부모 옵션 키; 속성 읽기: {OPT_KEYS}
        부모 옵션 목록과 U3F 옵션의 카멜 표기 키를 합친다.

    static TEXTURE_LEVEL: Record<string, string> = HIGH는 high, LOW는 low인 객체
        외부에서 변경할 수 있으며 텍스처 선택과 입력 검사에서 현재 값을 읽는다.

    static g_TaskProcessor: UTaskProcessor
        의존: UTaskProcessor — 모델 Worker 실행; 생성자: {new UTaskProcessor()}
        모듈 평가 시 task/model/u3f/U3fParserTask.js와 동시 작업 수 5로 생성한다.

    static nonDrawMaterial: ModelMaterial | undefined
        모든 인스턴스가 재사용하는 표시하지 않는 재질이며 최초 생성자에서 설정한다.

    constructor(opt: U3dModelU3FLayerCO = {})
        인터페이스: opt는 레이어 주소·가시 범위·모델 및 텍스처 로딩·편집 옵션이다.
        의존:
            U3dModelLayer — 부모 초기화; 생성자: {super()}
            normalizeOptionKeys — 옵션의 대소문자 호환; 함수: {normalizeOptionKeys()}
            defined — nullish 입력 검사; 함수: {defined()}
            defaultValue — 옵션 기본값; 함수: {defaultValue()}
            U3dMessage — 초기화 실패 안내; 정적 함수: {info()}
            U3dQueue — 텍스처 갱신 대기열; 생성자: {new U3dQueue()}
            UFileLoader — 바이너리 요청; 생성자: {new UFileLoader()}; 함수: {setResponseType()}; 속성 쓰기: {crossOrigin}
            UTextureLoader — 텍스처 요청; 생성자: {new UTextureLoader()}
            U3fPackagedInfo — 패키지 정보; 생성자: {new U3fPackagedInfo()}
            UCheckTime — 이미지 갱신 간격; 생성자: {new UCheckTime()}
            THREE — 경계와 공통 재질; 생성자: {new Box3(), new MeshBasicMaterial()}; 상수: {ClampToEdgeWrapping}
            UDEF — 상세 수준 캐시 구분; 상수: {TILE_REFINE.ADD, TILE_REFINE.REPLACE}
        동작:
            원래 opt의 nullish 여부를 보관하고 new.target의 OPT_KEYS로 옵션 키를 정규화한 뒤 부모를 초기화한다. 원래 입력 또는 정규화된 opt.baseUrl이 nullish이면 각각 4364476 또는 4364687 로그 후 자식 초기화를 중단한다. [확인 Q-001]
            원본 최소·최대 레벨을 -9999로, 정보·이전 위치·현재 위치를 undefined로 초기화한다.
            옵션별 기본값을 적용하고 텍스처 대기열·타일 URL·모델 식별자·ADD와 REPLACE 범위·합성 정보 저장소를 빈 상태로 만든다.
            useProxy가 false이면 프록시 접두사를 빈 문자열로 바꾸며 boundingBox가 있으면 이를 원형으로 하는 새 객체를 보관한다.
            파일 로더는 anonymous와 arraybuffer로 설정하고 텍스처 로더 및 패키지 정보 객체를 생성한다.
            makeU3FPackage는 undefined, isShareMaterial은 false로 대체하며 style은 전달값 그대로 저장한다. [확인 Q-015]
            nonDrawMaterial이 없으면 MeshBasicMaterial을 생성한다.
                V25_TEST가 false이면 레이어 재질 설정을 적용한 뒤 visible을 false로 설정한다. 현재 V25_TEST는 false다.

    updateShadow(updateTime: number) -> void
        의존:
            U3dModelLayer — 렌더 그룹과 앱; 속성 읽기: {_group, _app}
            UGroup — 순환 그룹 선택; 함수: {next()}
            UMesh — 그림자 갱신; 함수: {hasReachedShadowTime(), applyShadow()}
            UFrustum — 가시성 검사; 함수: {intersectsObject()}
        동작:
            자식이 없으면 종료하며 자식 수의 절반을 내림한 횟수까지 순환 그룹을 조회한다.
            그룹이 없거나 exceptShadowUpdate가 참이면 건너뛴다.
            각 공유 그룹의 메시에서 그림자 갱신 시간이 된 경우에만 visible과 절두체 교차 결과를 applyShadow에 전달한다.
            처리한 그룹 수가 4를 초과하면 종료하므로 한 호출에서 최대 5개 그룹을 처리한다.

    setTextureLevel(textureLevel: string) -> void
        의존:
            __GInfo__ — 입력 안내; 함수: {__GInfo__()}
            U3dModelLayer — 갱신 요청; 함수: {refresh()}
        동작:
            TEXTURE_LEVEL의 소유 키가 아니면 4539695 안내를 출력하지만 값을 거부하지 않는다. [확인 Q-003]
            _textureLevel을 저장하고 refresh가 존재하면 호출한다.

    clearTextureLevel() -> void
        동작: _textureLevel을 undefined로 변경하며 즉시 새로 고침하지 않는다.

    testMesh() -> void
        의존:
            U3dModelLayer — 장면과 이름; 속성 읽기: {_scene, _name}
            Object3D — 장면 순회; 함수: {traverse()}
            THREE — 진단 재질; 생성자: {new MeshBasicMaterial(), new Color()}
            Texture — 기존 텍스처 해제; 함수: {dispose()}
            Material — 기존 재질 해제; 함수: {dispose()}
            Web API — 집계 출력; 함수: {console.log()}
        동작:
            position 배열이 비어 있지 않은 장면 객체의 정점·지오메트리 수를 누적한다.
            기존 map과 재질을 해제하고 여섯 색상을 순환하는 Basic 재질, opacity 0.8 및 transparent true를 적용한다.
            레이어 이름과 집계 결과를 콘솔에 출력한다.

    override initialize(drawArg?: UDrawArg) -> Promise<unknown> | undefined
        의존:
            defined — 정보 유무 검사; 함수: {defined()}
            U3dModelLayer — 기반 초기화와 주소; 함수: {prototype.initialize.call()}; 속성 읽기: {_baseUrl}
            UDEF — 패키지 방식; 상수: {NON_PACKAGED_MODEL, PACKAGED_MODEL}
            U3fPackagedInfo — JSON 반영; 함수: {set()}
            U3dMessage — 로딩 실패; 정적 함수: {error()}
            DeferredObject — 외부에서 부착한 초기화 종결 함수; 콜백: {resolve(), reject()}
        동작:
            _needXml이 참이면 다음 정보 요청 체인을 반환한다.
                basename에 .u3g가 포함되지 않았을 때만 접미사를 추가하고 정보를 요청한다.
                정보의 bbox가 있으면 경계와 _info를 저장하고 패키지 사용 여부 및 makeJson을 반영한 뒤 영역을 계산한다.
                패키지 방식이며 makeJson이 참이면 JSON 로딩을 별도로 시작한다. 성공 시 패키지 정보를 설정하고 실패 시 makeJson을 0으로 변경한다.
                    JSON 요청의 finally에서 부모 initialize를 인수 없이 호출한 뒤 외부 resolve가 있으면 self를 전달한다. JSON 완료는 반환 체인에 연결하지 않는다.
                그 외 정보 성공 경로는 부모 initialize를 인수 없이 호출한 뒤 외부 resolve가 있으면 self를 전달한다.
                정보 요청 체인 실패 시 3610581 오류를 출력하고 외부 reject가 있으면 self를 전달한다.
            _needXml이 거짓이면 영역을 계산하고 부모 초기화·외부 resolve를 실행한 뒤 undefined를 반환한다.

    getBoundingBox() -> Box3
        동작: _box3 원본 참조를 반환한다.

    createU3GURL() -> string
        의존: U3dModelLayer — 기본 주소; 속성 읽기: {_baseUrl}
        동작: proxyurl, baseUrl, 슬래시, basename과 .u3g를 연결하며 기존 접미사 중복을 검사하지 않는다.

    getInfo() -> KeyValue | undefined
        동작: _info 원본 참조를 반환한다.

    getLayerInfo(url?: string, drawArg?: UDrawArg) -> Promise<object>
        인터페이스: drawArg는 현재 구현에서 사용하지 않는다.
        의존:
            defined — URL 확인; 함수: {defined()}
            deferred — 결과 종결; 함수: {deferred()}
            UFileLoader — 정보 파일 요청; 함수: {load()}
        동작:
            url이 nullish이면 기본 정보 주소를 만들고 기존 파일 로더로 요청한다.
            응답의 레이어 정보를 복원하고 같은 완료 객체에 전달한다.
            progress 콜백은 null이며 로딩 실패와 취소는 false 사유로 거부한다. 해석 예외는 별도로 잡지 않는다.

    getLayerJson(url: string) -> Promise<object>
        의존:
            UFileLoader — JSON 요청; 생성자: {new UFileLoader()}; 함수: {setResponseType(), load()}; 속성 쓰기: {crossOrigin}
            deferred — 결과 종결; 함수: {deferred()}
        동작: 새 anonymous JSON 로더로 요청하고 결과를 resolve하며 오류·취소는 사유 없이 reject한다.

    getTileInfo(tile: U3dQuadTile, indexX: number, indexY: number, level: number, url: string) -> Promise<TileInfo>
        의존:
            defined — 기록 유무 검사; 함수: {defined()}
            deferred — 결과 종결; 함수: {deferred()}
            UDEF — 패키지 판정; 상수: {PACKAGED_MODEL}
            U3fPackagedInfo — JSON 타일 조회; 함수: {isValidTile(), setInfo()}
            TileInfo — 정보 객체; 생성자: {new TileInfo()}
            UMathEngine — 타일 경로 계산; 정적 함수: {createUrl3DF()}
            U3dQuadTile — 타일 중심; 속성 읽기: {_rectangle3d, _rlevel}
            UGeoRect — 중심 계산; 함수: {centerMap()}
            U3dModelLayer — 타일 키와 데이터 캐시; 함수: {createKeyByTile()}; 속성 읽기: {_baseUrl, _cacheTiles}
            UCache — 바이너리 조회·저장; 함수: {get(), add()}
            UFileLoader — 정보 요청; 함수: {load()}
        동작:
            makeJson이 참이고 패키지 방식이면 유효 타일의 TileInfo를 채워 resolve하고, 유효하지 않으면 undefined로 resolve한다. [확인 Q-004]
            그 외에는 타일 중심·레벨·축 반전으로 기본 경로를 계산한다.
            URL 캐시가 있으면 즉시 파싱하고 같은 deferred를 반환한다.
            미캐시 응답은 타일 키의 URL 목록과 캐시에 등록한 뒤 파싱한다.
            오류는 전달받은 사유로, 취소는 loader abort 문자열로 reject한다.

    getModelInfo(tile: U3dQuadTile, index: number, url: string, baseurl: string, drawArg: UDrawArg, tileInfo: TileInfo) -> Promise<unknown> | undefined
        의존:
            defined — 결과 확인; 함수: {defined()}
            deferred — 호출 결과; 함수: {deferred()}
            U3dModelLayer — 타일 유효성과 캐시; 함수: {isTileDisposed(), getCache()}; 속성 읽기: {_cacheModeles, _compressModel}
            U3dQuadTile — 부모 진행 가능 여부; 함수: {getParent(), updatePossible()}
            UCache — 로딩 중복 표식; 함수: {get(), add(), remove()}
            UTaskProcessor — Worker 로딩; 함수: {scheduleTask()}
            UWorkerParameter — Worker 입력; 생성자: {new UWorkerParameter()}
            UFileLoader — 직접 로딩; 함수: {load()}
            U3FParser — 모델 복원; 생성자: {new U3FParser()}; 함수: {parse()}
            U3FPackageParser — 패키지 복원; 생성자: {new U3FPackageParser()}; 함수: {parse()}
            UDEF — 변환 체인; 정적 함수: {createPromise()}; 상수: {PACKAGED_MODEL}
            U3dMessage — 일부 모델 실패; 정적 함수: {error()}
            Web API — 전역 압축 도구; 속성 읽기: {globalThis.__UNION3D__}; 함수: {pako.inflate()}
        동작:
            타일이 해제되었거나 URL이 모델 캐시에 있으면 undefined를 반환한다.
            Worker 사용 시 현재 레이어 정보·인덱스·분할·압축·패키지 옵션으로 작업을 예약한다.
            Worker 결과 도착 시 타일 해제 또는 부모 갱신 불가이면 타일을 정리하고 reject한다.
            직접 로딩은 응답 후 타일 해제 여부만 확인하며 압축 시 inflate하고 패키지 또는 단일 파서를 선택한다.
            파싱 결과가 도착하면 URL 캐시에 true를 먼저 등록한다. undefined 또는 빈 결과는 false로 거부한다.
            패키지는 하위 배열마다 modelurl·baseurl·index를 첫 항목에 기록하여 메시 변환을 시작한다. Worker 경로만 빈 첫 항목을 false로 거부한다.
            패키지 성공·비치명 실패 수를 누적하며 마지막 성공 경로에서 mergeInfos가 있으면 병합을 기다린 뒤 결과 배열을 resolve한다. Worker의 V25_TEST 경로는 병합 대신 캐시 그룹을 숨긴다.
            truthy 실패는 URL 표식을 제거하고 즉시 reject한다. 그 외 실패는 로그 후 누적하며 모두 끝났을 때 일부 성공이 있으면 resolve하고 없으면 표식을 제거하여 reject한다.
            단일 모델은 첫 항목의 주소·인덱스를 설정하고 변환 결과를 전달한다. 변환 실패 시 URL 표식을 제거한다.
            Worker 예약 실패와 직접 다운로드 실패는 URL 표식을 제거하고 false로 reject한다. 직접 파싱 체인의 실패와 다운로드 취소는 바깥 deferred로 연결되지 않는 경로가 있다. [확인 Q-005]

    setForceUpdate(force: boolean) -> void
        동작: _forceUpdate를 전달값으로 변경한다.

    getForceUpdate() -> boolean
        동작: _forceUpdate를 반환한다.

    override disposeTileByKey(key: string) -> void
        의존:
            defined — 자원 유무 검사; 함수: {defined()}
            U3dModelLayer — 편집·캐시·기반 해제; 함수: {getEditedEventById(), getCacheByKey(), prototype.disposeTileByKey.call()}; 속성 읽기: {editedList, _cacheModeles, _cacheTiles, _cacheModelInTile, _group, _drawArg}
            UTaskProcessor — URL별 Worker 취소; 함수: {allExecTask()}
            UWorkerParameter — 취소 입력; 생성자: {new UWorkerParameter()}
            UCache — URL 및 타일 기록 제거; 함수: {get(), remove()}
            THREE — 그룹 판정; 상속: {Group}
            USharedMesh — 공유 컨테이너 제외; 상속: {USharedMesh}
            Object3D — 하위 메시 순회; 함수: {traverse()}
            ModelMesh — 렌더 반영; 함수: {setManualUpdate()}
            BufferGeometry — 공간 탐색 자원 해제; 함수: {disposeBoundsTree()}
            Gizmo — 연결 해제; 함수: {detach()}
            UDEF — 범위 종류; 상수: {TILE_REFINE.ADD, TILE_REFINE.REPLACE}
            편집 이벤트 — 사용자 후처리; 콜백: {afterFunction()}
        동작:
            편집 이벤트의 _isAdd를 false로 바꾸고 해당 타일의 기록된 모든 URL에 Worker abort를 보낸 뒤 URL 목록을 삭제한다.
            캐시가 Group이면 자식 모델 URL 표식·기즈모 연결·boundsTree를 정리한다.
            캐시 그룹이 REPLACE이면 같은 키의 ADD 범위 materialIndex를 originIndex로 복원한다. 분할된 childMeshId는 중복 제거한다.
                대응 그룹과 색상 편집 정보가 있는 각 분할 범위에서 비공유 메시의 재질과 isSetColor가 있으면 색상을 적용하고 수동 갱신한다.
                그 외 color와 afterFunction이 있으면 그 이벤트 객체를 this로 하여 mesh·drawArg·childMeshId를 전달한다.
                REPLACE 캐시 표식을 삭제한다.
            캐시 그룹이 ADD이고 _tileMaxKeys가 있으면 같은 gid의 범위를 제거하고 키별 수를 감소시키며 빈 ADD 목록을 삭제한다. 종료 비교는 _tileMaxKeys 객체 자체와 0을 비교한다. [확인 Q-006]
            해당 그룹의 합성 캐시, 타일 정보 URL 캐시, 타일별 모델 URL 및 모델 식별자를 제거한다.
            부모 disposeTileByKey를 마지막에 호출하며 반환값은 전달하지 않는다.

    deletekeys() -> void
        동작:
            보존 키가 있으면 순서대로 타일을 해제하고 보존 목록을 새 빈 배열로 교체한다.

    override disposeTile(tile: U3dQuadTile) -> void
        의존:
            defined — 타일 확인; 함수: {defined()}
            U3dModelLayer — 범위와 해제 판정; 함수: {isTileDisposed(), createKeyByTile()}; 속성 읽기: {_minlevel, _maxlevel}
        동작:
            타일이 nullish이거나 레벨이 허용 범위 밖이면 종료한다.
            isTileDisposed가 참일 때만 키를 계산하여 해제한다.

    override dispose(drawArg?: UDrawArg) -> Promise<boolean>
        인터페이스: drawArg는 사용하지 않으며 반환 Promise는 부모 정리 후 공유 재질 해제까지 연결한다.
        의존:
            defined — 공간 인덱스 확인; 함수: {defined()}
            U3dModelLayer — 기반 해제; 함수: {prototype.dispose.call()}
            UDEF — 공간 인덱스와 공유 자원; 속성 읽기: {RBUSH}; 정적 함수: {disposeResource()}
            UDEF.RBUSH — 전역 인덱스 초기화; 함수: {clear()}
        동작:
            부모 dispose를 먼저 호출하고 전역 RBUSH가 있으면 즉시 비운다.
            부모 성공 후 _sharedMaterial 참조를 undefined로 끊고 재질이 있으면 해제하며 부모 결과를 반환한다. 부모 실패 시 성공 콜백은 실행하지 않는다.

    getTexture(self: U3dModelU3FLayer, tile: U3dQuadTile, url: string) -> Promise<Texture>
        인터페이스: 명시적으로 전달한 self의 로더를 사용하며 tile은 사용하지 않는다.
        의존:
            UDEF — 비동기 결과; 정적 함수: {createPromise()}
            UTextureLoader — 텍스처 로딩; 함수: {load()}
        동작: 로딩 결과를 resolve하며 오류·취소는 사유 없이 reject한다.

    override show(show: boolean, refresh?: boolean) -> void
        의존: U3dModelLayer — 표시 변경; 함수: {prototype.show.call()}
        동작:
            부모 show를 호출하고 show가 falsy이면 메모리를 정리하며 부모 결과는 반환하지 않는다.

    cleanMemory() -> void
        의존:
            defined — 자원 확인; 함수: {defined()}
            U3dModelLayer — 작업과 캐시; 함수: {cancelAllTile()}; 콜백: {fncDeleteGroup()}; 속성 읽기: {_cache, _cacheModeles, _cacheModelInTile, _cacheTiles, _group, _labelGroup}; 속성 쓰기: {_labelGroup}
            UCache — 캐시 해제; 함수: {deleteAll(), clear()}
            Object3D — 그룹 비우기; 함수: {clear()}
            UDEF — 범위 저장소 구분; 상수: {TILE_REFINE.ADD, TILE_REFINE.REPLACE}
        동작:
            모든 타일 작업을 취소한다.
            _cache가 UCache이면 self와 fncDeleteGroup으로 deleteAll하며 나머지 세 캐시도 각각 UCache일 때만 clear한다.
            _group이 있으면 clear하고 _labelGroup이 있으면 clear한 뒤 undefined로 변경한다.
            _modelIds·_tileModelMap·_refineCache·_composedCache를 새 빈 객체로 교체하고 ADD와 REPLACE 범위 저장소도 초기화한다. 텍스처 대기열과 _tileBufferMap은 여기서 비우지 않는다.

    override update(drawArg: UDrawArg, curTime?: number) -> void
        의존:
            defined — 입력과 상태 확인; 함수: {defined()}
            U3dModelLayer — 기본 갱신·캐시·유효성; 함수: {prototype.update.call(), getCacheByKey(), isTileDisposed()}; 속성 읽기: {_visible, _checkUpdateTime, _workProcess, _drawArg, _cacheModeles}
            UCheckTime — 갱신 간격; 함수: {isUpdate(), updateTime()}
            WorkProcess — 처리량 검사; 함수: {getWorkingLevel2()}
            UDrawArg — 타일과 거리·가시성; 함수: {intersectsBox(), getModelImageDistance(), getTile()}; 속성 읽기: {_app}
            U3dQuadTile — 카메라 거리; 함수: {distanceToCameraPosition()}
            UCache — 모델 키 조회; 함수: {getKeys()}
            U3dQueue — 텍스처 대기열; 함수: {enqueue(), dequeue()}; 속성 읽기: {_length}
            UDEF — 비동기 작업과 기준; 정적 함수: {createPromise()}; 상수: {MODEL_IMAGE_UPDATE_DISTANCE, TILE_TYPE.MODEL}
            Yield — 반복 중 양보; 함수: {Yield()}
        동작:
            drawArg·앱이 없거나 레이어가 숨겨졌거나 isTextureUpdate가 거짓이면 종료한다.
            _visible이 참이고 _isTextureUpdate가 참일 때 다음 갱신을 처리한다.
                기본 갱신 시간이 되었거나 강제 갱신이면 부모 update를 실행한다.
                    강제 갱신은 플래그를 false로 초기화하고 탐색 제한을 건너뛴다.
                    일반 탐색은 2순위 작업 수가 40 초과, 레이어 경계 미교차, 모델 타일 키 없음이면 탐색만 종료한다. 이전 모델 수가 truthy이고 모델 수·마지막 키가 모두 같을 때도 탐색만 종료한다.
                    모델 수·마지막 키를 저장한다. 빈 모델 키 배열은 수 0과 마지막 키 undefined를 저장하며 다음 탐색의 동일 수·키 생략 조건을 만족하지 않는다.
                    textureDistance, drawArg 거리, 공통 거리 순서로 truthy 값을 선택한다.
                    텍스처 사용 그룹의 유효 타일 중 경계 교차·미해제·거리 이하이며 미등록인 타일을 대기열과 _tileBufferMap에 넣는다.
                기본 갱신 시간을 10으로 갱신한다.
                대기열이 있으면 이미지 갱신 시간 도달 시 비동기 반복을 시작하고 이미지 갱신 시간은 5로 갱신한다.
                    반복마다 Yield를 기다린 후 진행 중 수가 3 이상이거나 큐가 비면 중단한다.
                    미해제 또는 경계 교차인 타일은 진행 수를 늘려 상세 갱신을 시작한다. 완료 finally에서 등록을 지우고 진행 수를 줄인다.
                    그 외 타일은 등록만 지우고 반복 인덱스를 되돌린다. 반환은 작업 완료를 기다리지 않는 void다.

    override updateDetailByFrustum(tile: U3dQuadTile, opt?: UDrawArg, curTime?: boolean | number, resolve?: any) -> any
        인터페이스: resolve는 인수와 명시적 수신 객체 없이 call하며 메시별로 여러 번 실행될 수 있다. curTime은 사용하지 않는다.
        의존:
            defined — 입력과 메시 확인; 함수: {defined()}
            U3dModelLayer — 기반 판정과 캐시; 함수: {isTileDisposed(), prototype.updateDetailByFrustum.call(), getCache()}; 속성 읽기: {_app}
            UDrawArg — 카메라·거리·기본 해상도; 함수: {getCameraPosition(), getModelImageDistance(), getModelImageDefaultLevel()}
            U3dApp — 모델 좌표 오프셋; 함수: {getModelUpdateOffset()}
            USharedMesh — 공유 메시 판정; 상속: {USharedMesh}
            String 확장 — 색상 비교; 함수: {equalIgnoreCase()}
            resolve — 진행 종결 통지; 콜백: {call()}
        동작:
            타일 무효·해제, 부모 판정 실패, 그룹·drawArg·자식 부재이면 resolve가 있을 때 호출하고 종료한다.
            카메라 위치와 truthy 거리 설정 또는 렌더 문맥의 기본 거리 및 기본 이미지 레벨을 읽는다.
            타일별 선택 상태를 만들고 메시별 이미지 레벨을 받는다. 같은 선택 상태의 distance는 메시 순서대로 이어진다.
            meshColor가 있으면 공유 자식 재질을 직접 갱신하거나 비공유 메시의 색상 갱신 필요를 기록한다. # 분리의 첫 값, 다음 x 분리의 두 번째 값을 비교한다.
            선택 레벨이 다르고 _changingTexture가 정확히 false이면 교체 작업을 등록하며 그 외에는 resolve를 호출한다.
            필요하면 비공유 메시 재질 색상도 갱신한다. 예외는 잡아서 resolve만 호출하고 undefined로 끝낸다.

    override createModel(tile: U3dQuadTile) -> boolean | Promise<unknown> | undefined
        의존: U3dModelLayer — 레벨 범위와 상태; 함수: {resetStateTile()}; 속성 읽기: {_minlevel, _maxlevel, _drawArg}
        동작:
            타일 레벨이 허용 범위 밖이면 상태를 초기화하고 undefined를 반환한다.
            그 외에는 저장된 drawArg로 생성 요청한 결과를 반환한다.

    override addTileFromScene(tile: U3dQuadTile) -> void
        의존:
            U3dModelLayer — 장면 추가; 함수: {prototype.addTileFromScene.call()}
            UDEF — 범위 방식; 상수: {TILE_REFINE.ADD, TILE_REFINE.REPLACE}
        동작: 부모가 반환한 객체가 REPLACE이면 같은 타일의 ADD 범위 materialIndex를 0으로 변경한다. 부모 객체는 반환하지 않는다.

    override removeTileFromScene(tile: U3dQuadTile) -> void
        의존:
            U3dModelLayer — 장면 제거; 함수: {prototype.removeTileFromScene.call()}
            UDEF — 범위 방식; 상수: {TILE_REFINE.ADD, TILE_REFINE.REPLACE}
        동작: 부모가 반환한 객체가 REPLACE이면 같은 타일의 ADD 범위 materialIndex를 originIndex로 복원한다. 부모 객체는 반환하지 않는다.

    override createModelByFrustum(tile: U3dQuadTile, drawArg: UDrawArg, force?: boolean) -> any
        인터페이스: force는 사용하지 않으며 Promise 성공은 모델 작업 등록 완료를 나타낸다.
        의존:
            defined — 캐시 및 결과 검사; 함수: {defined()}
            deferred — 등록 및 작업 종결; 함수: {deferred()}
            U3dModelLayer — 기반 판정·상태·큐; 함수: {prototype.createModelByFrustum.call(), getStateTile(), setStateTile(), isTileDisposed(), resetStateTile(), createGroupByKey(), addWork()}; 속성 읽기: {_cache, _baseUrl, _compressModel, _cacheModeles}
            UDEF — 상태·작업 종류; 상수: {TILE_STATE._failed, TILE_STATE._loading, TILE_STATE._end, PACKAGED_MODEL, _MSG_WORK._UPDATE_MESH_BUILDING}
            UMathEngine — 모델 주소; 정적 함수: {createUrl3DF()}
            UGeoRect — 중심; 함수: {centerMap()}
            UCache — 타일·모델 조회; 함수: {get(), createKeyByTile()}
            U3dQuadTileWork — 취소·필터가 있는 작업; 생성자: {new U3dQuadTileWork()}
        동작:
            부모 판정이 거짓이면 undefined로 종료한다. failed 상태는 undefined로 초기화하고 loading 상태이면 종료하며 그 외는 loading으로 변경한다.
            타일 중심·레벨·반전 설정으로 주소를 만든다. 캐시 그룹이 있으면 end 상태로 바꾸고 false로 resolve한 deferred를 반환한다.
            타일 정보를 요청한다.
            결과 시 타일이 해제되었으면 상태 초기화와 종료 콜백을 실행하고 false로 resolve한다. 종료 함수는 배열로 전달한다.
            결과 또는 levels가 없으면 상태를 초기화하여 false로 resolve한다.
            캐시 그룹이 없으면 생성하고 end 상태로 변경한다.
            패키지는 패키지 인덱스·확장자·package 접미사, 일반 모델은 전체 범위의 인덱스로 URL을 만든다. 압축 설정이면 .gz를 덧붙인다.
            캐시된 모델은 건너뛰며 미캐시 URL을 취소 목록에 등록하고 모델 작업을 큐에 넣는다. 작업의 취소는 작업 deferred를 resolve하며 필터는 타일 미해제 여부다.
            작업 finally는 패키지의 타일 URL 목록 전체 또는 일반 모델의 해당 URL만 제거한다.
            작업 등록 직후 true로 resolve한다. 타일 정보 실패는 상태 초기화 후 false 사유로 reject한다.

    loadBlockModel(self: U3dModelU3FLayer, baseurl: string, startindex: number, endindex: number, blocksize: number, max: number, tile: U3dQuadTile, drawArg: UDrawArg, endPromise: DeferredObject<boolean>) -> void
        의존:
            UDEF — 모델 작업 종류; 상수: {_MSG_WORK._UPDATE_MESH_BUILDING}
            U3dModelLayer — 유효성·상태·큐; 함수: {isTileDisposed(), resetStateTile(), addWork()}
            U3dQuadTileWork — 작업 등록; 생성자: {new U3dQuadTileWork()}
        동작:
            startindex 이상 endindex 미만을 순회하고 i가 max와 같으면 true로 resolve하고 반복을 끝낸다.
            타일 해제 시 상태 초기화와 종료 콜백을 실행하고 false로 resolve하여 반환한다. 종료 함수는 배열로 전달한다.
            각 URL에 대한 모델 작업을 등록한다. 필터는 타일 미해제 여부이며 blocksize는 작업 입력으로만 전달한다.

    setMeshColor(color: string | number) -> void
        의존:
            defined — 색상·타일 확인; 함수: {defined()}
            U3dModelLayer — 캐시·타일 유효성; 함수: {getCacheKeys(), isTileDisposed()}; 속성 읽기: {_drawArg}
            UDrawArg — 모델 타일과 경계; 함수: {getTile(), intersectsBox()}
            UDEF — 타일 종류; 상수: {TILE_TYPE.MODEL}
        동작:
            색상이 nullish이면 종료하고 그 외에는 문자열 변환 없이 _meshColor에 저장한다. [확인 Q-007]
            캐시 키의 유효 타일 중 미해제 또는 경계 교차인 타일에 상세 갱신을 요청한다.

    override mergedMeshDivision(mesh: ModelMesh, faceIndex?: number | function(Object3D, UDrawArg): void, onAfterFunction?: function(Object3D, UDrawArg, string): void) -> any
        의존:
            defined — 인수 판정; 함수: {defined()}
            U3dModelLayer — 기존 분할·편집 등록; 함수: {prototype.mergedMeshDivision.call(), addFaceIndexInfo()}
        동작:
            faceIndex가 nullish 또는 함수이면 함수만 후처리로 부모에 전달하고 부모 결과를 반환한다.
            숫자이면 면의 분할 정보를 구해 addFaceIndexInfo로 후처리와 함께 등록한 뒤 원본 mesh를 반환한다.

    setPickMaterial(key: string, color: string | number, opacity: number, meshId: string, isSetOutline: boolean = false) -> Array<ModelMesh> | void
        의존:
            UDEF — ADD 범위; 상수: {TILE_REFINE.ADD}
            U3dModelLayer — 표시 그룹; 속성 읽기: {_group}
            USharedMesh — 공유 컨테이너 제외; 상속: {USharedMesh}
            Object3D — 메시 순회; 함수: {traverse()}
        동작:
            ADD 캐시의 키가 없으면 종료한다. gid를 중복 제거하고 해당 합성 항목 중 id가 meshId와 같은 원본 항목에 color·opacity를 저장한다.
            합성 목록이 있는 경우에만 임시 composedInfo를 초기화한다. 목록이 없는 gid는 초기화되지 않거나 이전 값을 재사용하는 경로가 있다. [확인 Q-008]
            합성 항목과 장면 그룹이 있으면 모으고 비공유 메시마다 픽 재질을 적용한다.
            isSetOutline이 참일 때만 결과 배열에 메시를 추가한다. 처리 그룹이 있으면 배열, 없으면 undefined를 반환한다.

    override removeMaterialIndex(object: ModelMesh, materialIndex: number) -> any
        의존:
            defined — 인덱스 판정; 함수: {defined()}
            U3dModelLayer — 편집 조회·기반 제거; 함수: {getEditedEventById(), getModelById(), prototype.removeMaterialIndex.call()}; 속성 읽기: {_group, editedEvent, editedList}
            UDEF — ADD 범위; 상수: {TILE_REFINE.ADD}
            ModelMesh — 모델 식별·렌더 반영; 함수: {getUid(), setManualUpdate()}
            USharedMesh — 공유 컨테이너 제외; 상속: {USharedMesh}
            Object3D — 메시 순회; 함수: {traverse()}
        동작:
            geometry 그룹이 있으면 _preTile, 편집 materialColor의 tileMaxKey, originIndex가 일치한 그룹의 tileMaxKey 순으로 키를 덮어쓴다. 최종 키가 없으면 undefined를 반환한다.
            그룹이 없으면 materialSplit의 키 목록 또는 _preTile을 사용하고 빈 목록이면 false를 반환한다.
            각 키의 ADD 캐시를 조회한다.
            각 캐시 범위 refineRange의 isDivided가 참이면 다음 처리를 실행한다.
                대응 그룹이 없으면 건너뛴다.
                분리 자식과 합성 부모 재질을 복원하고 합성 항목의 color·opacity를 삭제한다.
                비공유 메시의 originIndex 재질이 있으면 복원하고 수동 갱신한다. materialIndex가 nullish일 때 픽 목록과 materialSplit·materialColor 편집을 제거하고 빈 이벤트를 삭제한다.
                자식 편집의 색상 표식·재질 편집을 지우고 범위의 isDivided·childMeshId를 삭제하여 removed를 true로 만든다.
            materialIndex가 정의되어 있으면 마지막에 부모 결과로 removed를 덮어쓰고 반환한다.

    getBoundingBoxInfo(mesh: ModelMesh) -> Array<{id: string, info: object}> | void
        동작:
            mesh가 없거나 재질이 배열이 아니면 종료한다.
            geometry 그룹 중 materialIndex가 0이 아닌 gid를 중복 제거하고 그 gid의 합성 항목을 id와 원본 info 참조로 모아 반환한다.

    getComposedInfo(gid: string, childId: string) -> U3dModelU3FLayerComposedInfo | undefined
        동작: 두 식별자 또는 gid 캐시가 falsy이면 undefined이며 그 외에는 id가 childId인 첫 원본 항목을 반환한다.

    computeRectangle() -> void
        의존:
            U3dModelLayer — 상속 공간 범위 저장; 속성 쓰기: {_rectangle, _rectangle3d}
            defined — 경계 확인; 함수: {defined()}
            U3dMessage — 누락 오류; 정적 함수: {error()}; 상수: {CNT.CMM.NON_BBOX}
            UMathEngine — 사각형 생성; 정적 함수: {createUGeoRect()}
            UDEF — 좌표계; 상수: {GOOGLE}
            THREE — 바운딩 박스; 생성자: {new Box3()}
        동작:
            boundingBox가 nullish이면 3615063 오류 후 종료한다.
            x·y 최소·최대와 차이의 절댓값으로 Google 사각형을 만들어 _rectangle과 _rectangle3d에 같은 참조를 저장한다.
            _box3가 없거나 isBox3가 거짓이면 새 Box3로 바꾼다. 이후 min·max는 입력 x·y·z를 그대로 반영하며 z의 기본값은 보완하지 않는다.

    applyEditedTextures(tile: U3dQuadTile, level: number) -> void
        의존:
            U3dModelLayer — 편집 및 캐시; 함수: {getCache(), editFilter()}; 속성 읽기: {editedList}
            ModelMesh — 편집 식별·텍스처 교체; 함수: {getUid(), changeSharedTextureImage(), changeTextureImage()}
        동작:
            편집 목록이 비면 종료한다. 캐시 컨테이너의 자식 중 id·oid·getUid가 편집된 그룹만 선택한다.
            _opt가 있고 비합성·미교체 자식에서 이미지 URL이 비고 원본 이미지가 있으면 URL을 복원한다.
            첫 자식이 비병합인 그룹은 공유 그룹으로, 병합 자식은 Set으로 모은다.
            공유 그룹에서 교체 중 자식이 하나라도 있으면 건너뛰며 미해제·비휴면·다른 레벨인 첫 자식으로 그룹 교체를 시작한다.
            병합 메시는 미해제·비휴면·다른 레벨이면 메시별로 한 번 교체한다.

    createTextureFromImageRaw(thumbimage: string | ArrayBuffer, promise: any) -> void
        의존:
            defined — 데이터와 종결 객체 확인; 함수: {defined()}
            UTextureLoader — 이미지 로딩; 함수: {load()}
            U3dModelLayer — 앱; 속성 읽기: {_app}
            U3dApp — 품질·렌더러; 함수: {getImproveValue()}; 속성 읽기: {_renderer}
            UDEF — 텍스처 품질; 정적 함수: {setTextureImprovement(), noResizeTexture()}; 상수: {IMPROVE_TEXTURE_LEVEL.none}
        동작:
            썸네일이 정의되어 있으면 로드하고 앱 개선 값이 none보다 클 때만 개선 설정, 그 외에는 리사이즈 금지를 적용한다.
            promise가 있으면 성공 텍스처로 resolve하고 로딩 오류는 reject한다. 썸네일이 nullish이면 promise를 undefined로 resolve한다.

    setMaterial(material: ModelMaterial, texture?: Texture) -> void
        의존:
            defined — 색상·텍스처 확인; 함수: {defined()}
            U3dModelLayer — 공통 재질; 함수: {settingModelLayerMaterial()}
        동작:
            부모의 공통 재질 설정을 적용한다.
            style이 truthy이면 스타일을 적용하며 그 외에는 정의된 meshColor 또는 0xf9f9ff 색상을 설정한다.
            texture가 정의되어 있으면 map으로 지정하며 이전 map 해제나 needsUpdate 설정은 하지 않는다.

    createModelMesh(objs: Array<U3FParsedObj>, texture: Texture | Array<Texture> | undefined, tile: U3dQuadTile, drawArg: UDrawArg, tileInfo: TileInfo) -> ModelMesh | undefined
        인터페이스: 입력 버퍼는 복원 과정에서 소비되며 배열 텍스처는 ADD 병합 입력에서 사용한다.
        의존:
            defined — 입력 확인; 함수: {defined()}
            U3dModelLayer — 타일 그룹 조회; 함수: {getCache()}
        동작:
            타일 캐시 그룹이 없거나 objs가 nullish·빈 배열이거나 drawArg가 없으면 undefined로 종료한다.
            같은 인스턴스·입력·타일·그룹과 공개 연결부 및 진단 설정을 전달하여 복원 결과를 그대로 반환한다.

    async mergeModelMesh(objs: Array<U3FParsedObj>, tile: U3dQuadTile, drawArg: UDrawArg) -> Promise<ModelMesh | undefined>
        동작: 원래 클래스의 공유 재질 보유자와 공개 해제·이벤트 연결부를 전달하고 병합 결과를 반환한다.

    divisionMeshFromFace(mesh: ModelMesh, faceIndex: number) -> {materialIndex: number, composedInfo: U3dModelU3FLayerComposedInfo, tileMaxKey: string} | void
        의존: defined — 인덱스·분할 결과 확인; 함수: {defined()}
        동작:
            mesh·geometry가 없거나 faceIndex가 nullish이면 종료한다.
            면 인덱스의 3배가 속한 그룹을 찾고 해당 gid의 합성 목록이 있으며 길이가 0보다 클 때만 순서대로 분할을 시도한다.
            첫 유효 결과에서 중단하고 _pickMaterials를 확보하여 재질 인덱스·원본 합성 항목·tileMaxKey를 반환한다. 결과가 없으면 undefined다.

    setGroupsDivisionRefine(mesh: ModelMesh, index: number, composedInfo: U3dModelU3FLayerComposedInfo, targetIndex: number) -> number | undefined
        동작: 재질 구간 분할과 복원 캐시 갱신 결과를 반환한다.

    applyPickMaterial(mesh: ModelMesh, group: Object3D, composedInfo: Array<U3dModelU3FLayerComposedInfo>, isSetOutline: boolean = false) -> void
        의존:
            defined — 인덱스 확인; 함수: {defined()}
            U3dModelLayer — 면 편집 기록; 함수: {addFaceIndexInfo()}
        동작:
            mesh·group·geometry·composedInfo가 없으면 종료하고 _pickMaterials를 확보한다.
            composedInfo가 있고 composedInfo[i].color가 truthy이면 다음 처리를 실행한다.
                start + count / 2를 내림하여 그룹을 찾고 분할한다.
                유효한 새 인덱스에서 재질이 있고 isSetOutline이 거짓일 때만 색상·불투명도를 적용한다.
                새 인덱스가 유효하면 재질 유무와 무관하게 해당 분할의 면 인덱스를 내림하여 편집 기록에 추가한다.

    setPickMaterialByComposedInfo(mesh: ModelMesh, composedInfo: U3dModelU3FLayerComposedInfo, color: string | number | ColorRepresentation, opacity: number, isSetColor: boolean = true) -> void
        의존:
            defined — 인덱스 확인; 함수: {defined()}
            U3dModelLayer — 면 편집 기록; 함수: {addFaceIndexInfo()}
        동작:
            합성 범위의 가운데를 내림하여 그룹을 찾고 없으면 종료하며 있으면 분할한다.
            새 인덱스가 정의되고 해당 material이 있으면 픽 목록에 중복 없이 추가한다.
                isSetColor가 참이면 색상·불투명도를 적용한 뒤 material.visible을 false로 변경한다.
                isSetColor와 무관하게 원본 composedInfo에 color·opacity를 저장한다.
            새 인덱스가 정의되면 재질 유무와 무관하게 면 인덱스 편집 기록을 추가한다.

    getRefineCache(type: string, key: string) -> Array<KeyValue> | void
        동작: 해당 type 캐시가 있으면 key의 원본 배열을 반환하고 없으면 undefined다.

    validationMeshInfo(meshInfo: Array<{id: string | number, oid: string | number}>, list: Array<string>, mesh: ModelMesh) -> void
        동작: 전달한 모델 정보와 합성 캐시의 대응 관계를 검사하며 내부 예외도 그대로 전달한다. [확인 Q-009]

disposeU3FModel(self: U3dModelU3FLayer, tile: U3dQuadTile) -> void
    동작: 전달한 self의 타일 해제 메서드를 호출한다.

endTileWork(self: U3dModelU3FLayer, tile: U3dQuadTile, callbacks: Array<function(U3dModelU3FLayer, U3dQuadTile): void>, force?: boolean) -> void
    인터페이스: callback의 this는 callbacks 배열이며 self·tile을 인수로 받는다. force는 사용하지 않는다.
    의존:
        defined — 목록 유무 검사; 함수: {defined()}
        callbacks — 종료 처리; 콜백: {callbacks[i]()}
    동작: callbacks가 정의되어 있으면 순서대로 실행한다. 실행할 함수는 전달받은 배열 항목이며 이 함수에서 특정 종료 함수를 선택하지 않는다.

changeTexture(opt: KeyValue) -> Promise<boolean> | null
    의존:
        defined — 옵션·자원 확인; 함수: {defined()}
        UDEF — 결과와 품질; 정적 함수: {createPromise(), setTextureImprovement(), noResizeTexture()}; 상수: {IMPROVE_TEXTURE_LEVEL.none}
        U3dModelLayer — 캐시·타일·편집; 함수: {getCache(), isTileDisposed(), removeFilter()}; 속성 읽기: {_name, _app, removedList}
        U3dApp — 품질·렌더러; 함수: {getImproveValue()}; 속성 읽기: {_renderer}
        USharedMesh — 공유 교체; 함수: {changeTextures()}
        Texture — 기존 map 해제; 함수: {dispose()}
        opt.resolve — 갱신 통지; 콜백: {call()}
    동작:
        falsy opt를 빈 객체로 바꾸며 self·mesh·modellevel·tile이 nullish이거나 mesh가 해제·휴면·geometry 부재·교체 중이면 resolve를 호출하고 null을 반환한다.
        소속 레이어 이름이 같고 레벨이 다르며 교체 중이 아닐 때만 Promise를 생성한다. 그 외 null 경로는 resolve를 호출하지 않는다.
        현재 레벨이 -1이면 초기 이미지 표식을 설정한다. URL 목록이 없으면 갱신 통지 후 false로 reject한다.
        요청 레벨과 현재 클래스의 품질 상수를 전달하여 선택한 이미지 번호를 받는다.
        선택 URL 또는 타일 캐시 그룹이 없으면 갱신 통지 후 false로 reject한다.
        _changingTexture를 true로 하고 로딩한다.
        도착 시 타일 또는 메시가 해제·휴면이면 플래그를 false로 바꾸고 새 텍스처를 해제한다. 내부 성공 체인으로 이어져 외부 결과는 true다.
        material이 있는 경로에서만 품질을 설정하고 공유 메시는 changeTextures로, 그 외는 기존 map을 dispose한 뒤 새 map과 needsUpdate를 적용한다.
            _curImagelevel을 갱신하고 useModelAndTexture와 초기 이미지가 모두 참이면 visible을 true로 한다. 제거된 병합 메시이면 다시 숨긴다.
            편집 텍스처를 재적용한다.
        성공 시 갱신 통지·true resolve·교체 플래그 해제 순서다. 실패는 갱신 통지 후 false reject와 플래그 해제를 수행하며 경로별 순서를 보존한다.

modelProcess(opt: KeyValue) -> DeferredObject<boolean>
    인터페이스: 반환값은 opt.endPromise 원본이다. resolve 값 true는 로딩 결과 처리 완료, false는 처리된 중단·실패를 뜻하며, 객체 반환 자체가 비동기 처리 완료를 뜻하지 않는다.
    의존:
        defined — 입력·결과 확인; 함수: {defined()}
        U3dModelLayer — 타일과 캐시; 함수: {isTileDisposed()}; 속성 읽기: {_cache}
        U3dQuadTile — 부모 갱신; 함수: {getParent(), updatePossible()}
        UCache — 결과 그룹; 함수: {get()}
        UDEF — 패키지·범위; 상수: {PACKAGED_MODEL, TILE_REFINE.ADD, TILE_REFINE.REPLACE}
        U3dMessage — 결과 누락; 정적 함수: {error()}; 상수: {CNT.CMM.NON_OBJECT_1}
    동작:
        opt를 읽고 self·tile의 유효성 검사보다 먼저 타일 해제 및 부모 갱신 가능 여부에 접근한다. [확인 Q-016]
        해제·부모 갱신 불가·필수 주소나 drawArg 부재이면 endPromise를 false로 resolve하고 그 객체를 반환한다.
        모델 로딩을 시작하며 결과 Promise가 없으면 false로 resolve한다.
        성공 결과에서 패키지는 첫 하위 배열, 단일 모델은 첫 객체의 index를 읽는다. 결과가 없거나 배열이 아니거나 index가 없으면 로그 후 false로 resolve한다.
        완료 시 타일이 해제되었으면 타일을 정리하고 false로 resolve한다.
        캐시 객체가 REPLACE이면 같은 타일 ADD 범위를 재질 인덱스 0으로 숨기고 REPLACE 표식을 저장한다. 그 뒤 true로 resolve한다.
        로딩 실패나 로딩 성공 후 처리 중 발생한 예외는 false로 resolve한다. 함수 자체는 이 비동기 처리 완료를 기다리지 않고 endPromise를 반환한다.

async createTextureFromImageRawArray(self: U3dModelU3FLayer, thumbimages: Array<any>, promLast: any) -> Promise<void>
    의존:
        defined — 입력 검증; 함수: {defined()}
        UDEF — 입력 단언; 정적 함수: {assert()}
        deferred — 이미지별 결과; 함수: {deferred()}
    동작:
        로더·비어 있지 않은 이미지 배열·종결 객체를 검증한다.
        IS_SERIAL이 true이면 복사 URL 배열로 직렬 로더를 호출한다.
        IS_SERIAL이 false이면 이미지별 deferred를 만들어 로딩하고 Promise.all 성공에서 결과가 하나면 단일 텍스처, 여러 개면 배열로 promLast를 resolve한다. 현재 상수는 false다.
        실패는 promLast를 reject하며 반환 Promise는 이미지 완료를 기다리지 않는다.

_LoadImageChainAsync(self: U3dModelU3FLayer, arrayUrl: Array<string>, promLast: DeferredObject<Texture | Array<Texture>>, curUrl?: string, textures?: Array<Texture>) -> void
    의존:
        defined — 인수·로더 확인; 함수: {defined()}
        UDEF — 입력과 품질; 정적 함수: {assert(), setTextureImprovement(), noResizeTexture()}; 상수: {IMPROVE_TEXTURE_LEVEL.none}
        UTextureLoader — 직렬 로딩; 함수: {loadAsync()}
        U3dModelLayer — 앱; 속성 읽기: {_app}
        U3dApp — 품질·렌더러; 함수: {getImproveValue()}; 속성 읽기: {_renderer}
        Texture — 부분 성공 해제; 함수: {dispose()}
        Web API — 오류 출력; 함수: {console.info()}
    동작:
        현재 IS_SERIAL이 false이므로 활성 호출은 없다. 입력을 검증하고 curUrl이 없으면 원본 arrayUrl에서 shift하며 textures가 없으면 새 배열로 둔다.
        URL 로딩 후 품질을 설정하고 textures에 추가한다. 남은 URL이 없으면 한 개는 단일 값, 여러 개는 배열로 resolve한다.
        남은 URL이 있으면 shift한 다음 자기 자신에 후속 로딩을 맡긴다.
        오류는 출력·reject 후 누적 텍스처를 모두 dispose한다.

deleteTexture(texture: Texture | Array<Texture> | undefined) -> void
    의존:
        defined — 자원 유무; 함수: {defined()}
        Texture — 텍스처 해제; 함수: {dispose()}
    동작: nullish이면 종료하고 instanceof Array이면 항목별로, 그 외에는 단일 dispose를 호출한다.

setMaterialStyle(material: ModelMaterial, style: any) -> void
    동작:
        material이 없거나 isMaterial이 거짓, style이 없거나 열거 값이 비면 종료한다. [확인 Q-015]
        color가 truthy이면 색상에 적용하고 emissive가 truthy이면 emissive가 있는 경우 동일 값을 세 인수로 set한다.

convertObj2Mesh(self: U3dModelU3FLayer, objs: any, tile: U3dQuadTile, drawArg: UDrawArg, tileInfo: TileInfo) -> Promise<Array<U3FParsedObj>> | undefined
    의존:
        defined — 입력·그룹 확인; 함수: {defined()}
        UDEF — 변환 체인; 정적 함수: {createPromise()}
        U3dModelLayer — 타일·캐시; 함수: {isTileDisposed(), getCache(), createKeyFromTile()}; 속성 읽기: {_useTexture}
        UDrawArg — 장면; 속성 읽기: {_scene}
        U3dMessage — 입력 누락; 정적 함수: {error(), info()}
    동작:
        objs 또는 drawArg가 nullish이면 즉시 오류를 던진다.
        비동기 체인에서 타일이 없거나 해제이면 정리 후 true 사유로 reject한다. 장면이 없으면 오류를 출력하고 true로 reject하며, 그룹이 없어도 true로 reject한다.
        복원 입력의 중심 정보가 없으면 안내 메시지를 출력하고 true로 reject한다.
        타일 모델 저장소를 확보한다. 내부 이미지 없음 판정이 참이면 텍스처 없이 진행한다.
        useTexture가 참이면 내부 조회한 미리보기 입력 부재는 텍스처 없이 진행하고 배열 입력은 배열 로더, 그 외는 단일 로더로 변환한다. useTexture가 거짓이고 imagecount가 0이 아니면 종결되지 않는다. [확인 Q-013]
        텍스처 완료 시 타일이 해제되었으면 타일·텍스처를 정리하고 true로 reject한다.
        유효하면 타일 저장소를 재확보하고 메시 생성 반환값과 무관하게 원본 objs로 resolve한다. 후속 실패는 true로 reject한다.

processChangeTexture(self: U3dModelU3FLayer, mesh: ModelMesh, modellevel: number, tile: U3dQuadTile, force3: boolean, resolve?: any) -> boolean | void
    의존:
        defined — 입력·플래그 확인; 함수: {defined()}
        U3dModelLayer — 타일·큐; 함수: {isTileDisposed(), addWork(), addWork2()}; 속성 읽기: {_useTexture, _drawArg}
        USharedMesh — 썸네일 전환; 함수: {changeThumbTextures()}
        U3dQuadTileWork — 텍스처 작업; 생성자: {new U3dQuadTileWork()}
        UDEF — 우선순위 설정; 상수: {_MSG_WORK._UPDATE_IMAGE_BUILDING}; 속성 읽기: {isImmediateUpdateImageModel}
        UDrawArg — 작업 필터; 함수: {intersectsSphere()}
        resolve — 완료 통지; 콜백: {call()}
    동작:
        텍스처 미사용·drawArg 부재·해제 타일이면 resolve를 호출하고 종료한다.
        공유 메시이며 thumbs가 정의되고 요청 레벨이 thumbcount 미만이면 resolve를 먼저 호출한다. 저장된 drawArg 기준 해제이면 플래그를 false로 바꾸고 false를 반환하며 그 외는 교체 중 표식을 설정하고 썸네일을 전환한다.
        다른 경로는 교체 작업을 만든다. 취소는 resolve이며 force3가 정의되고 true와 느슨하게 같으면 필터를 통과시킨다. 그 외는 교체 중·해제·동일 레벨·구 미교차 시 거부한다.
        force3가 정의되어 있으면 즉시 갱신 설정만으로 addWork와 addWork2를 선택한다. 정의되지 않았으면 최초 레벨 -1도 addWork 조건이다.
        예외는 잡아서 resolve를 호출한다.

setMaterialColor(material: ModelMaterial, color: string | number | ColorRepresentation, opacity: number) -> void
    동작:
        _oriColor가 falsy이면 현재 색상을 복사해 저장한 뒤 color를 적용한다.
        _oriOpacity가 falsy이면 현재 opacity를 Number로 저장한다. 입력 opacity도 Number로 바꿔 적용하고 변환된 값이 1 미만인지로 transparent를 설정한다.

resetMaterialColor(material: ModelMaterial) -> void
    동작:
        truthy _oriColor만 복원·삭제한다.
        truthy _oriOpacity만 Number로 복원·삭제하고 transparent를 다시 계산한다. 원래 불투명도가 0이면 이 복원 분기를 실행하지 않는다.
        truthy _oriMap만 map으로 복원·삭제한다.

MODEL_HOOKS: U3FModelHooks
    finishMesh는 finishRestoredMesh, deleteTexture는 같은 이름의 함수, notifyLoadedModel은 같은 이름의 함수다.

finishRestoredMesh(self: U3FFinishModelOwner, mesh: ModelMesh, obj: U3FParsedObj) -> boolean | undefined
    의존:
        defined — 메시 기능과 공간 색인 확인; 함수: {defined()}
        U3dModelLayer — 삭제·편집·이벤트; 함수: {removeFilter(), editFilter(), setEditEvent(), setSplitEvent(), dispatchEvent()}; 속성 읽기: {removedList}
        UU3fMesh — 편집 분할과 수동 갱신; 함수: {getUid(), isMerged(), mergedMeshDivision(), setManualUpdate()}
        UDEF — 삭제 식별자와 공간 탐색; 상수: {U3F_DETACHED_TOKEN, BOUNDING_METHOD, BOUNDING_TYPE.TREE}; 속성 읽기: {RBUSH}
        THREE — 공간 등록 구; 생성자: {new Sphere()}
        UDEF.RBUSH — 공간 등록; 함수: {insert()}
        UBufferGeometry — 공간 트리; 함수: {computeBoundsTree()}
        U3dEvent — 로드 이벤트; 상수: {MESH.LOADED}
    동작:
        isMerged 기능이 있으면 getUid와 삭제 접미사를 결합해 제거 여부를 검사한다. 일치하면 숨기고 isMerged가 거짓인 분리 모델은 휴면으로 둔다.
        기능이 없으면 id 또는 oid 제거 필터가 일치하고 병합된 메시일 때만 숨긴다.
        복원 입력에서 색상 편집된 항목의 위치를 구한다.
        id·oid 편집 필터 또는 편집 위치가 유효하고 병합된 메시이면 숨긴 뒤 분할한다. 분할 자식이 있으면 편집 이벤트, 각 자식 분할 이벤트, 수동 갱신 순서로 처리하고 true를 반환한다.
        그 외는 수동 갱신하고 RBUSH가 정의되면 복사 경계와 새 Sphere 및 mesh를 insert한다. TREE 방식이며 geometry.boundsTree가 없을 때만 트리를 만든다.
        MESH.LOADED 이벤트를 발행하고 undefined를 반환한다. 콜백 예외는 잡지 않는다.

notifyLoadedModel(self: Pick<U3dModelU3FLayer, 'dispatchEvent'>, mesh: ModelMesh) -> void
    의존:
        U3dModelLayer — 이벤트 전달; 함수: {dispatchEvent()}
        U3dEvent — 로드 이벤트; 상수: {MESH.LOADED}
    동작: 전달받은 mesh를 data로 MESH.LOADED 이벤트를 즉시 발행한다.

U3FParseTileInfoOwner 타입 정의
    기반 타입: Pick<U3dModelU3FLayer, '_cache' | '_cacheModelInTile' | '_drawArg' | '_ext' | '_maxlevel' | '_minlevel' | '_useMinMaxModel' | '_zeroLevelHeight'>

U3FValidationMeshInfoOwner 타입 정의
    기반 타입: Pick<U3dModelU3FLayer, '_composedCache'>

U3FReadLayerInfoOwner 타입 정의
    기반 타입: Pick<U3dModelU3FLayer, '_srcmaxlevel' | '_srcminlevel'>

U3FSetGroupsDivisionRefineOwner 타입 정의
    기반 타입: Pick<U3dModelU3FLayer, '_refineCache'>

U3FGetEditedModelIndexOwner 타입 정의
    기반 타입: Pick<U3dModelU3FLayer, 'editedEvent' | 'editedList'>

U3FRestoreModelMeshesOwner 타입 정의
    기반 타입: U3FFinishModelOwner & Pick<U3dModelU3FLayer, '_animation' | '_classtype' | '_drawArg' | '_isShareMaterial' | '_modelIds' | '_name' | '_opacity' | '_renderOrder' | '_sharedMaterial' | '_tileModelMap' | '_transparent' | '_useBaseMaterial' | '_useBoxHelper' | '_useEditMode' | 'createKeyFromTile' | 'createModelMesh' | 'setMaterial' | 'validationMeshInfo'>

U3FMergeModelMesh24Owner 타입 정의
    기반 타입: Pick<U3dModelU3FLayer, '_classtype' | '_composedCache' | '_modelIds' | '_name' | '_opacity' | '_refineCache' | '_renderOrder' | '_tileModelMap' | '_transparent' | '_useBoxHelper' | 'applyPickMaterial' | 'createKeyFromTile' | 'editFilter' | 'getCache' | 'getEditedEventById' | 'isTileDisposed' | 'setMaterial'>

U3FMergeModelMesh25Owner 타입 정의
    기반 타입: Pick<U3dModelU3FLayer, '_classtype' | '_composedCache' | '_modelIds' | '_name' | '_opacity' | '_refineCache' | '_renderOrder' | '_tileModelMap' | '_transparent' | '_useBoxHelper' | 'applyPickMaterial' | 'createKeyFromTile' | 'dispatchEvent' | 'editFilter' | 'getCache' | 'getEditedEventById' | 'isTileDisposed' | 'setMaterial'>

U3FMergeModelOwner 타입 정의
    기반 타입: U3FMergeModelMesh24Owner & U3FMergeModelMesh25Owner

U3FModelRuntime 타입 정의
    기반 타입: Pick<typeof U3dModelU3FLayer, 'nonDrawMaterial'>

U3FModelHooks 타입 정의
    기반 타입: object
    이 명세에서 사용하는 필드:
        finishMesh: U3FFinishModelCallback
            복원 메시의 편집·등록 완료 처리.
        deleteTexture: (texture: Texture | Array<Texture> | undefined) => void
            실패 경로의 텍스처 해제.
        notifyLoadedModel: (owner: Pick<U3dModelU3FLayer, 'dispatchEvent'>, mesh: ModelMesh) => void
            로드 이벤트 전달.

U3FPreviewInput 타입 정의
    기반 타입: string | ArrayBuffer | Array<string | ArrayBuffer> | undefined

U3FFinishModelOwner 타입 정의
    기반 타입: Pick<U3dModelU3FLayer, 'removeFilter' | 'editFilter' | 'removedList' | 'editedList' | 'editedEvent' | 'setEditEvent' | 'setSplitEvent' | 'dispatchEvent'>

U3FImageSelectionState 타입 정의
    기반 타입: object
    이 명세에서 사용하는 필드:
        distance: number
            메시 선택 과정에서 갱신되는 타일 거리.
        maxDistance: number
            이미지 상세 전환 거리.
        defaultImageLevel: number
            기본 이미지 레벨.

U3FFinishModelCallback 함수 타입 정의
    (owner: U3FFinishModelOwner, mesh: ModelMesh, obj: U3FParsedObj) -> boolean | undefined
    인터페이스:
        owner는 편집 상태와 이벤트 처리를 제공하는 레이어다.
        mesh는 복원된 메시이며 obj는 편집 대조에 사용하는 복원 입력이다.
        반환값이 true이면 남은 복원을 중단하며, 그 외에는 계속한다.

U3FParsedObj 타입 정의
    기반 타입: KeyValue
    파서가 반환한 동적 모델 객체다.

U3dModelU3FLayerComposedInfo 타입 정의
    기반 타입: {id: string, start: number, count: number} & KeyValue
    합성 메시의 인덱스 범위와 동적 편집 정보다.

U3dModelU3FLayerCO 타입 정의
    기반 타입: U3dModelLayerCO & U3dModelU3FLayerCO_Content

U3dModelU3FLayerCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
            레이어 이름이다.
        baseName?: string
            레이어 정보 기본 이름이며 needXml 경로에서 문자열 메서드를 사용한다. [확인 Q-001]
        baseUrl?: string
            모델 기본 주소이며 자식 초기화에 필요하다. [확인 Q-001]
        ext: string = '.u3f'
            모델 확장자다.
        reverseY: boolean = false
            타일 주소 Y축 반전 여부다.
        minLevel: number = 0
            부모의 최소 표시 레벨이다.
        maxLevel: number = 19
            부모의 최대 표시 레벨이다.
        opacity: number = 1
            레이어 불투명도다.
        transparent: boolean = false
            투명 렌더 사용 여부다.
        useBaseMaterial: boolean = false
            Basic 재질을 사용한다.
        zeroLevelHeight: number = 40
            첫 단계에 포함할 모델의 높이 초과 기준이다.
        useSplitModel: boolean = false
            파서에 전달하는 분할 옵션이다.
        startImageLevel: number = 0
            초기 이미지 레벨 저장값이다.
        needXml: boolean = true
            레이어 정보 요청 사용 여부다.
        proxyUrl: string = './proxy.jsp?url='
            프록시 접두사다.
        useProxy: boolean = false
            false이면 프록시 접두사를 사용하지 않는다.
        boundingBox?: KeyValue
            minx·miny·minz·maxx·maxy·maxz 공간 범위다.
        useBoxHelper: boolean = false
            모델 경계 선 표시 여부다.
        immediateUpdateImage: boolean = false
            이미지 작업의 우선 큐 선택에 사용한다.
        makeU3FPackage?: number
            생략 시 undefined이며 원본 레이어 정보로 보완된다.
        isShareMaterial: boolean | number = false
            기존 숫자 입력과 boolean을 모두 유지하며 truthy 값이면 공유 재질을 사용한다.
        isTextureUpdate: boolean = true
            프레임 텍스처 갱신 실행 여부다.
        textureDistance?: number
            truthy일 때 사용하는 강제 갱신 거리다.
        textureLevel?: string
            high 또는 low의 텍스처 선택 설정이다.
        wrapping?: number
            생략 시 ClampToEdgeWrapping을 저장한다.
        useModelAndTexture: boolean = true
            첫 이미지 적용 후 모델 표시 여부다.
        useMinMixModel: boolean = true
            중간 모델 단계의 개수 정책이다.
        minusMaxLevel: number = 1
            최대 텍스처 단계에서 뺄 값이다.
        style?: string
            선언은 문자열이나 구현은 color·emissive 속성을 읽는다. [확인 Q-015]
        meshColor?: string
            레이어 메시 색상이다.
        useWorker: boolean = true
            Worker 파싱 사용 여부다.
```

## 4. 공통 처리 기준과 제약

```spec
타일 작업 등록, 모델 변환 완료, 텍스처 교체 완료와 장면 이벤트는 별도 완료 경계다.
ADD 범위 객체는 geometry.groups와 refine 캐시에 공유되므로 materialIndex 변경은 같은 객체에 반영된다.
레이어가 소유한 _sharedMaterial은 메시가 빌려 쓰고 부모 dispose 성공 후 레이어가 해제한다.
모델 파싱 결과는 소비 과정에서 원시 배열과 썸네일 참조가 변경·삭제될 수 있으며 불변 입력이 아니다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
