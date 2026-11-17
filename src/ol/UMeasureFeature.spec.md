# UMeasureFeature 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

편집 원본과 지형 표시·검색 자료를 연결하는 매개체다.

### 1.2 책임 범위

원본 조회·스타일 변경 전달, 표시 좌표와 경계, 변경 번호·그리기 순서를 관리한다. 원본 등록·요청·구독과 GPU 자원 수명은 등록 문맥 및 terrain manager의 책임이다.

### 1.3 주요 동작 방식

표시 조각은 대표 매개체를 참조하고 대표는 연결된 U2dGeometry를 조회한다. 내부 검색 스냅샷과 외부 편집용 형상을 분리하고 기존 THREE 입력에만 호환 함수를 연결한다.

형식과 무관한 표시 입력은 내부 Float64 평탄 좌표를 보유할 수 있다. 공통 입력 생성기는 기존 메타데이터 객체에 스타일 접근자와 좌표 형상을 연결하며 완성된 측정 피처를 먼저 만들지 않는다. 원본 좌표와 표시 링 번호만 보관하고 공개 복원 후 이전 평탄 배열을 캡처한 참조를 남기지 않는다. getMeasureVectors는 최초 공개 조회에서 Vector3 배열을 한 번 복원하고 평탄 참조를 비운다. 승인된 대표·조각은 같은 지연 상태를 공유하여 기존 공개 배열 참조 계약을 유지하며, 서로 다른 표시 타일은 복원 배열을 공유하지 않는다. setMeasureVectors는 해당 매개체의 지연 상태를 해제하고 형상 버전을 증가시킨다. 등록 해제 시 레이어가 내부 평탄 참조도 정리한다.

### 1.4 주요 사용처와 연계 대상

U2dVectorShaderLayer·U3dShaderMeasureLayer가 생성하며 UShaderTerrainDecalManager의 등록된 편집 창구와 연결된다.

## 3. 정규 자연어 수도코드

```spec
UMeasureFeature 클래스 정의

    _extent: UMeasureFeatureExtent | undefined
        표시·검색 경계 참조다.

    static _createCoordinateFeature<T>(source: UMeasureCoordinateSource, feature: T, type: string, styleType: string = type) -> T & UMeasureCoordinateFeature
        역할: 원본 형식과 무관한 좌표 입력을 만들되 측정 피처 등록은 레이어에 남긴다.
        동작:
            원본 좌표·속성과 입력 식별자·메타데이터를 공통 생성기에 전달하고 같은 입력 객체를 반환한다.
            공개 GeoJSON 좌표와 기존 스타일 함수의 getId·get·getProperties·getGeometry().getType() 계약을 유지한다. 그 자체로 측정 생성자·좌표 소유 등록·편집 원본 연결을 실행하지 않는다.

    constructor(opt: object = {})
        의존:
            Guid — 입력·형상·스타일 처리; 함수: {Guid()}
        동작:
            초기 입력을 보관하고 uid를 Guid로 새로 발급한다.
            _style이 truthy이면 초기 스타일을 변환·연결한다.
            검색·잠금·스타일 revision과 전체 revision을 입력 상태로 반영한다.
            유한한 그리기 순서만 설정한 뒤 생성 과정에서 바뀔 수 있는 geometry·property revision을 초기 입력값으로 다시 설정한다.
            내부 검색 형상이 native OL Geometry가 아니면 기존 THREE 입력 호환 함수를 연결한다. native 또는 미지정 형상은 원본 메서드를 바꾸지 않고 타일 좌표 판정의 소유자를 등록한다.

    #create(opt: object) -> void
        동작:
            sourceFeature는 opt.sourceFeature ?? opt.feature를 사용한다. olFeature·fid·properties는 해당 키의 직접 존재 여부가 우선이므로 명시 undefined도 원본 fallback을 막는다.
            ID fallback은 sourceFeature.getId(), id, ol_uid 순서다. 원본 속성은 getProperties 또는 properties에서 읽는다.
            전역 증가 sequence를 한 번 발급하고 extent·worldExtent·geometry·검색 스냅샷·좌표계·타입·월드 좌표 배열·원본 참조를 보관한다. 누락 좌표 배열은 빈 배열이다.
            style·nonChanged·excludeSearch·styleRevision·revision·geometryRevision·propertyRevision·drawSequence·isInner는 직접 키가 있으면 입력을 사용하고 아니면 원본 값을 사용한다. geometry/property revision의 원본 값도 없으면 발급 sequence를 사용한다.

    get uid() -> string
        동작:
            getUid의 결과를 반환한다.

    set uid(uid: string) -> void
        동작:
            setUid에 입력 uid을 전달한다.

    get extent() -> UMeasureFeatureExtent | undefined
        동작:
            getExtent의 결과를 반환한다.

    set extent(box: UMeasureFeatureExtent | undefined) -> void
        동작:
            setExtent에 입력 box을 전달한다.

    get worldExtent() -> UMeasureFeatureExtent | undefined
        동작:
            getWorldExtent의 결과를 반환한다.

    set worldExtent(box: UMeasureFeatureExtent | undefined) -> void
        동작:
            setWorldExtent에 입력 box을 전달한다.

    get geometry() -> OLGeometry | object | undefined
        동작:
            getGeometry의 결과를 반환한다.

    set geometry(geometry: OLGeometry | object | undefined) -> void
        동작:
            setGeometry에 입력 geometry을 전달한다.

    get geometryRevision() -> number
        동작:
            getGeometryRevision의 결과를 반환한다.

    set geometryRevision(revision: number) -> void
        동작:
            setGeometryRevision에 입력 revision을 전달한다.

    get srs() -> string | undefined
        동작:
            보관한 _srs 참조를 반환한다.

    set srs(srs: string | undefined) -> void
        동작:
            입력 srs을 _srs에 보관한다.

    get type() -> number | undefined
        동작:
            getType의 결과를 반환한다.

    set type(type: number | undefined) -> void
        동작:
            setType에 입력 type을 전달한다.

    get measureVectors() -> Array<THREE.Vector3>
        동작:
            getMeasureVectors의 결과를 반환한다.

    set measureVectors(vectors: Array<THREE.Vector3>) -> void
        동작:
            setMeasureVectors에 입력 vectors을 전달한다.

    get fid() -> string | number | undefined
        동작:
            getId의 결과를 반환한다.

    set fid(id: string | number | undefined) -> void
        동작:
            setId에 입력 id을 전달한다.

    get olFeature() -> object | undefined
        동작:
            getOLFeature의 결과를 반환한다.

    set olFeature(olFeature: object | undefined) -> void
        동작:
            setOLFeature에 입력 olFeature을 전달한다.

    get style() -> object | undefined
        동작:
            getStyle의 결과를 반환한다.

    set style(style: object | undefined) -> void
        동작:
            setStyle에 입력 style을 전달한다.

    get propertyRevision() -> number
        동작:
            getPropertyRevision의 결과를 반환한다.

    set propertyRevision(revision: number) -> void
        동작:
            setPropertyRevision에 입력 revision을 전달한다.

    get oriStyle() -> object | undefined
        동작:
            보관한 _oriStyle 참조를 반환한다.

    set oriStyle(style: object | undefined) -> void
        동작:
            입력 style을 _oriStyle에 보관한다.

    get properties() -> KeyValue | undefined
        동작:
            getProperties의 결과를 반환한다.

    set properties(properties: KeyValue | undefined) -> void
        동작:
            setProperties에 입력 properties을 전달한다.

    get drawArg() -> object | undefined
        동작:
            보관한 _drawArg 참조를 반환한다.

    set drawArg(drawArg: object | undefined) -> void
        동작:
            입력 drawArg을 _drawArg에 보관한다.

    get nonChanged() -> boolean
        동작:
            getNonChanged의 결과를 반환한다.

    set nonChanged(val: boolean) -> void
        동작:
            setNonChanged에 입력 val을 전달한다.

    get excludeSearch() -> boolean
        동작:
            getExcludeSearch의 결과를 반환한다.

    set excludeSearch(val: boolean) -> void
        동작:
            setExcludeSearch에 입력 val을 전달한다.

    get styleRevision() -> number | undefined
        동작:
            getStyleRevision의 결과를 반환한다.

    set styleRevision(revision: number | undefined) -> void
        동작:
            setStyleRevision에 입력 revision을 전달한다.

    get revision() -> number
        동작:
            getRevision의 결과를 반환한다.

    set revision(revision: number) -> void
        동작:
            setRevision에 입력 revision을 전달한다.

    get drawSequence() -> number | undefined
        동작:
            getDrawSequence의 결과를 반환한다.

    set drawSequence(sequence: number | undefined) -> void
        동작:
            setDrawSequence에 입력 sequence을 전달한다.

    get isInner() -> boolean
        동작:
            보관한 _isInner 참조를 반환한다.

    set isInner(isInner: boolean) -> void
        동작:
            setInner에 입력 isInner을 전달한다.

    #setMeasureFunction(geometry: object) -> void
        의존:
            UDEF — 기존 측정 타입별 교차 분기; 속성 읽기: {MEASURE_TYPE}
        동작:
            native OL Geometry가 아닌 기존 입력에만 intersectsExtent·setCoordinates·getFeature·getExtent 호환 함수를 연결한다.
            교차 함수는 좌표가 2개 미만이면 false다. LINESTRING은 선분과 경계, POLYGON·MULTIPOLYGON은 점 포함과 변 교차, POINTBUFFER는 첫점과 마지막점의 거리 반경으로 원-사각형 교차를 계산하며 다른 타입은 false다.
            타일 선택 중에는 구간별 좌표 스냅샷을 사용하고 좌표 제공 함수와 교차 판정의 소유자를 등록한다.
            setCoordinates는 POLYGON일 때 geometry.setFromPoints를 실행한 뒤 셰이더용 좌표를 교체한다. getFeature는 매개체, getExtent는 매개체의 보관 경계를 반환한다.

    getGeometry() -> OLGeometry | object | undefined
        동작:
            원본 getGeometry 결과가 native OL Geometry이면 그 원본 참조를 반환한다.
            그 원본이 없고 공개 _geometry도 없으나 공유 검색 스냅샷이 있으면 최초 공개 조회에만 clone하여 _geometry에 보관하고 공유 참조를 비운다.
            보관된 공개 형상을 반환하고 없으면 undefined다. 반복 조회는 같은 참조를 반환하며 조회만으로 revision을 올리지 않는다.

    _getSearchGeometry() -> OLGeometry | object | undefined
        동작:
            공개 getGeometry가 사용자 재정의 함수이면 그 함수를 호출한다. 그렇지 않으면 native 원본 geometry, 보관 공개 형상, 공유 검색 스냅샷 순서로 반환하며 공개 편집용 clone을 만들지 않는다.

    setGeometry(geometry: OLGeometry | null | undefined) -> void
        동작:
            같은 _geometry이고 공유 검색 참조도 없으면 반환한다. 새 geometry를 보관하고 공유 검색 참조를 비운다.
            _olFeature가 실제 OL Feature이며 geometry가 다를 때만 원본 setGeometry도 호출한다.
            기존 THREE 입력에는 호환 함수를, native 또는 빈 형상에는 타일 좌표 소유자 기록을 적용한다. geometry revision과 전체 revision을 각각 증가시킨다. 빌린 형상을 dispose하지 않는다.

    getExtent() -> UMeasureFeatureExtent | undefined
        동작:
            보관된 _extent 참조를 반환한다. OL geometry의 숫자 배열 extent와 달리 표시 경계 객체일 수 있다.

    setExtent(box: UMeasureFeatureExtent | undefined) -> void
        동작:
            전달 box 참조를 _extent에 보관한다. geometry나 revision을 계산하지 않는다.

    getWorldExtent() -> UMeasureFeatureExtent | undefined
        동작:
            보관된 _worldExtent 참조를 반환한다.

    setWorldExtent(box: UMeasureFeatureExtent | undefined) -> void
        동작:
            전달 box 참조를 _worldExtent에 보관한다.

    getGoogleCoordinates() -> Array<THREE.Vector3>
        의존:
            drawArg — 월드 좌표의 지도 투영; 함수: {getWorldToGoogle()}
        동작:
            drawArg가 없으면 빈 배열을 반환한다. 월드 좌표 각 점의 x·y를 drawArg.getWorldToGoogle로 변환한 뒤 원래 z를 보존하여 새 좌표 배열을 반환한다.

    getType() -> number | undefined
        동작:
            보관한 _type을 반환한다.

    setType(type: number) -> void
        동작:
            같은 타입이면 반환하고, 다르면 타입을 보관한 뒤 geometry revision과 전체 revision을 증가시킨다.

    getMeasureVectors() -> Array<THREE.Vector3>
        동작:
            보관한 월드 좌표 배열 참조를 그대로 반환한다.

    setMeasureVectors(vectors: Array<THREE.Vector3>) -> void
        동작:
            입력 vectors 참조를 보관하고 geometry revision과 전체 revision을 증가시킨다.

    getUid() -> string
        동작:
            현재 매개체 _uid를 반환한다.

    setUid(uid: string) -> void
        동작:
            매개체 _uid만 변경한다. 원본 피처의 안정 ID와 별개다.

    getId() -> string | number | undefined
        동작:
            보관한 원본 식별자 _fid를 반환한다.

    setId(id: string | number) -> void
        동작:
            매개체 _fid만 변경한다. 원본 Feature.setId를 호출하지 않는다.

    setOLFeature(olFeature: object | undefined) -> void
        동작:
            전달 원본 참조를 _olFeature에 보관한다. 기존 geometry를 해제하거나 새 원본의 geometry를 즉시 채택하지 않는다.

    getOLFeature() -> object | undefined
        동작:
            보관한 OL Feature 또는 일반 데이터 객체 참조를 반환한다.

    _getSourceMeasure() -> UMeasureFeature | undefined
        동작:
            표시 조각의 _sourceMeasure가 있으면 그 대표를 반환한다. 없고 _sourceContext가 있으면 자기 자신, 그 밖에는 undefined다.

    getSourceFeature() -> object | undefined
        의존:
            U2dGeometry — 편집 원본 Feature 조회; 함수: {getFeature()}
        동작:
            연결된 대표가 있으면 _sourceExposed를 true로 표시한다. 대표 원본 도형의 Feature가 있으면 그 Feature, 없으면 현재 _olFeature를 반환한다.

    getSourceGeometry() -> U2dGeometry | undefined
        동작:
            연결된 대표가 있으면 _sourceExposed를 true로 표시하고 이미 준비된 대표 _sourceGeometry만 반환한다. 조회 자체로 도형이나 요청을 만들지 않는다.

    loadSourceGeometry() -> Promise<U2dGeometry | undefined>
        의존:
            _sourceContext — 등록 원본의 전체 도형 요청; 함수: {loadSourceGeometry()}
        동작:
            대표가 없거나 해제됐으면 undefined로 완료되는 Promise를 반환한다. 그 밖에는 대표를 외부 노출로 표시하고 _sourceContext.loadSourceGeometry에 대표를 전달한 Promise를 그대로 반환한다. 요청 공유·취소·제공 오류는 등록된 창구의 계약을 따른다.

    getStyle() -> object | undefined
        동작:
            보관한 _style 참조를 반환한다.

    setStyle(style: object, notify: boolean = true) -> void
        의존:
            THREE — 입력·형상·스타일 처리; 생성자: {new THREE.Color()}
            defined — 입력·형상·스타일 처리; 함수: {defined()}
            _sourceContext — 등록 원본의 스타일 편집; 함수: {setStyle()}
        동작:
            notify가 true이고 대표가 있으면 해제된 대표와 안정 ID가 nullish인 WFS 편집을 Error로 거부한다. 대표 갱신 중이 아닐 때 등록 문맥 setStyle에 대표·style을 전달하고 종료한다.
            직접 적용 경로는 기존 _oriStyle이 falsy일 때만 이전 _style을 보관한다.
            style이 OL Style이면 Fill·Stroke의 유한한 별도 opacity를 가장 먼저 사용하고 색상의 RGBA·HSLA 또는 배열 알파를 그 다음에 해석한다. 확장 fillColor·strokeColor는 truthy일 때만 초기값으로 사용하며 0·누락은 각각 흰색·노란색을 사용한다. 실제 Fill·Stroke의 color_가 정의되어 있으면 이 초기 색을 다시 대체한다. 별도 opacity도 확장 불투명도도 없으면 1이고 Stroke가 없으면 두께는 1이다. 해석한 THREE.Color와 편의 값을 같은 입력 Style에 기록한다.
            _style을 교체하고 대표 없는 단독 매개체에 원본 참조가 있으면 원본 _style에도 같은 객체를 기록한다.
            채움·외곽선 색/알파·두께·표시·강조·동적 모드/반경이 이전 스타일과 다르면 property revision만 증가시킨다. 같은 객체 참조는 동일 스타일로 본다.

    getProperties() -> KeyValue | undefined
        동작:
            보관한 사용자 속성 참조를 반환한다. 복사본이나 원본 getProperties 재조회가 아니다.

    setProperties(properties: KeyValue | undefined) -> void
        동작:
            전달 properties 참조를 보관한다. 원본 속성과 revision은 이 메서드만으로 갱신하지 않는다.

    updateMeasureData(opt: object = {}) -> UMeasureFeature
        동작:
            각 입력이 undefined가 아닌 항목만 extent·worldExtent·원본 참조·geometry·좌표계·타입·좌표·ID·속성·drawArg·구멍 여부 순으로 적용하고 자기 자신을 반환한다. 원본 참조를 geometry보다 먼저 교체한다. opt.revision은 이 경로에서 적용하지 않는다.

    applyTypedMeasureData(opt: object = {}) -> UMeasureFeature
        동작:
            type·geometry 키의 직접 존재 여부로 입력값 또는 현재값을 선택한 뒤 나머지 항목과 함께 updateMeasureData로 전달하고 그 자기 자신 반환값을 반환한다. 명시 undefined geometry도 updateMeasureData에서 건너뛰므로 이 경로로 형상을 비우지는 않는다.

    applyRuntimeState(opt: object = {}) -> UMeasureFeature
        동작:
            style·잠금·검색 제외·style revision·그리기 순서·구멍 여부·전체 revision 키가 직접 존재하는 항목만 적용한다. 스타일은 notify=false로 적용하여 등록 편집으로 재귀하지 않으며 자기 자신을 반환한다.

    changed() -> void
        의존:
            U2dGeometry — 연결된 원본의 변경 통지; 함수: {getFeature()}
            OLFeature — 원본 변경 이벤트; 함수: {changed()}
        동작:
            대표가 해제됐으면 반환한다. 대표의 원본 도형이 있으면 그 Feature.changed를, 없고 편집 스타일이 있으면 대표 setStyle을, 그 밖에는 보관 원본 changed를 호출한다. 대표 없는 단독 매개체는 보관 원본 changed가 있을 때 호출한다.

    getNonChanged() -> boolean
        동작:
            보관한 _nonChanged 값을 반환한다.

    setNonChanged(val: boolean) -> void
        동작:
            대표 연결 없는 단독 원본에만 _nonChanged를 함께 기록하고 매개체에도 입력 값을 보관한다.

    getExcludeSearch() -> boolean
        동작:
            보관한 _excludeSearch를 boolean으로 반환한다.

    setExcludeSearch(val: boolean) -> void
        동작:
            입력 val을 boolean으로 바꾸어 보관하고 대표 연결 없는 단독 원본에도 같은 _excludeSearch를 기록한다.

    getStyleRevision() -> number | undefined
        동작:
            보관한 _styleRevision을 반환한다.

    setStyleRevision(revision: number) -> void
        동작:
            nullish 입력은 0으로 바꾸어 매개체와 보관 원본 _styleRevision에 기록한다. 유한한 값이면 현재 전체 revision과의 최댓값으로 전체 revision을 반영한다.

    getRevision() -> number
        동작:
            보관 revision이 nullish이면 0을 사용하여 Number로 변환해 반환한다.

    setRevision(revision: number) -> number
        동작:
            입력이 Number.isFinite를 통과하면 숫자로, 아니면 0으로 보정한다. 보관 원본의 _revision과 매개체에 기록하고 숫자 값을 반환한다.

    bumpRevision() -> number
        동작:
            현재 전체 revision에 1을 더하여 setRevision으로 반영한 숫자를 반환한다.

    getGeometryRevision() -> number
        동작:
            보관 geometry revision이 nullish이면 0을 사용하여 Number로 변환해 반환한다.

    setGeometryRevision(revision: number) -> number
        동작:
            입력이 유한 숫자이면 그대로 숫자로, 아니면 0으로 보정하여 원본과 매개체의 geometry revision을 기록하고 반환한다.

    bumpGeometryRevision() -> number
        동작:
            현재 geometry revision에 1을 더하여 반영한 숫자를 반환한다.

    getPropertyRevision() -> number
        동작:
            보관 property revision이 nullish이면 0을 사용하여 Number로 변환해 반환한다.

    setPropertyRevision(revision: number) -> number
        동작:
            입력이 유한 숫자이면 그대로 숫자로, 아니면 0으로 보정하여 원본과 매개체의 property revision을 기록하고 반환한다.

    bumpPropertyRevision() -> number
        동작:
            현재 property revision에 1을 더하여 반영한 숫자를 반환한다.

    setInner(isInner: boolean) -> boolean
        동작:
            isInner를 boolean으로 바꾼 값이 같으면 그대로 반환한다. 다르면 _isInner를 갱신하고 property revision을 증가시킨 뒤 boolean을 반환한다.

    getDrawSequence() -> number | undefined
        동작:
            보관한 _drawSequence를 반환한다.

    setDrawSequence(sequence: number) -> number | undefined
        동작:
            sequence가 유한 숫자가 아니거나 현재 값과 같으면 현재 그리기 순서를 반환한다. 다르면 원본과 매개체에 새 순서를 기록하고 property revision을 증가시켜 반환한다.

    ensureDrawSequence(sequence: number) -> number | undefined
        동작:
            현재 순서가 유한 숫자가 아니고 입력 sequence가 유한 숫자일 때만 setDrawSequence로 설정한다. 최종 순서를 반환한다.

hasOwn(obj: object | null | undefined, key: string) -> boolean
    동작:
        obj가 truthy이고 Object.prototype.hasOwnProperty.call이 key를 직접 속성으로 판정하면 true를 반환한다.

isSameMeasurePropertyStyle(left: object | undefined, right: object | undefined) -> boolean
    동작:
        같은 참조이면 true, 한쪽이 없으면 false다. 채움·외곽선 색과 opacity·fillOpacity·strokeOpacity·strokeWidth·visible·highlight·isDynamicRadius·dynamicRadius를 비교해 모두 같을 때 true다.

isSameMeasureStyleColor(left: unknown, right: unknown) -> boolean
    동작:
        Object.is가 같으면 true다. 양쪽 THREE.Color는 RGB를, 양쪽 배열은 길이와 각 성분을, 그 밖의 객체 둘은 r·g·b 값을 비교한다. 다른 경우는 false다.

normalizeNonStringColor(value: unknown) -> object
    의존:
        THREE — 입력·형상·스타일 처리; 생성자: {new THREE.Color()}
    동작:
        배열의 RGB가 유한 숫자가 아니면 color·opacity를 undefined로 반환한다. 유효 RGB는 상한 255로 제한해 255로 나눈 THREE.Color를 만들고 유한 알파만 반환한다. 배열 아닌 값은 색상 참조를 그대로 반환한다.

validationStyleColor(color: string) -> object
    의존:
        THREE — 입력·형상·스타일 처리; 생성자: {new THREE.Color()}
        defined — 입력·형상·스타일 처리; 함수: {defined()}
    동작:
        HSLA는 RGB 해석용 hsl 문자열과 별도 알파로 나누고 유한 알파만 0~1로 제한한다. 지원하는 RGBA 정규식은 RGB 상한 255의 THREE.Color와 선택 알파로 변환한다. 다른 문자열은 원래 color로 반환한다.

isLineIntersectingExtent(lineCoordinates: Array<THREE.Vector3>, extent: Array<number>) -> boolean
    의존:
        THREE — 입력·형상·스타일 처리; 생성자: {new THREE.Vector2()}
    동작:
        선 좌표 중 경계 사각형 내부 또는 경계 위의 점이 있으면 true다. 없으면 인접 선분과 사각형 네 변의 교차를 검사하여 하나라도 교차하면 true, 끝까지 없으면 false다.

isSegmentIntersecting(p1: THREE.Vector2Like, p2: THREE.Vector2Like, q1: THREE.Vector2Like, q2: THREE.Vector2Like) -> boolean
    동작:
        두 선분 끝점의 엄격한 반시계 판정 조합이 양쪽에서 서로 다를 때 true다. 공선·끝점 접촉을 별도 허용하는 보정을 추가하지 않는다.

isPolygonIntersectingExtent(coords: Array<THREE.Vector3>, list: Array<number>) -> boolean
    의존:
        THREE — 입력·형상·스타일 처리; 생성자: {new THREE.Vector2()}
    동작:
        사각형 꼭짓점의 다각형 내부 포함, 다각형 점의 사각형 내부 포함, 닫힌 각 변과 사각형 네 변의 교차 순으로 검사하여 처음 성립하면 true를 반환한다. 없으면 false다.

isPointInsidePolygon(point: THREE.Vector2Like, coords: Array<THREE.Vector3>) -> boolean
    동작:
        수평 광선과 각 변이 만나는 횟수를 세어 count % 2 === 1이면 true를 반환한다. 빈 좌표는 0회여서 false다. 엄격한 x·y 비교를 사용하며 구멍 목록을 별도로 해석하지 않는다.

doLinesIntersect(p1: THREE.Vector2Like, p2: THREE.Vector2Like, p3: THREE.Vector2Like, p4: THREE.Vector2Like) -> boolean
    동작:
        각 선분의 끝점에 대한 엄격한 반시계 판정이 양쪽에서 서로 달라지는지 반환한다.

isCircleIntersectingExtent(center: THREE.Vector2, radius: number, extent: number[]) -> boolean
    의존:
        THREE — 입력·형상·스타일 처리; 생성자: {new THREE.Vector2()}
    동작:
        원 경계 상자가 사각형과 완전히 분리되면 false다. 중심이 사각형 내부면 true, 아니면 사각형 꼭짓점의 원 내부 포함과 네 변의 원 교차 순으로 검사하여 하나라도 성립하면 true다. 없으면 false다.

isPointInsideCircle(point: THREE.Vector2Like, center: THREE.Vector2Like, radius: number) -> boolean
    동작:
        point.distanceTo(center)가 radius 이하이면 true를 반환한다. radius가 음수이면 비음수 거리와 비교하므로 false다.

isCircleEdgeIntersecting(center: THREE.Vector2, radius: number, p1: THREE.Vector2, p2: THREE.Vector2) -> boolean
    동작:
        선분 방향과 중심에서 시작점까지의 벡터로 이차 방정식의 a·b·c와 판별식을 계산한다. 판별식이 0 미만이면 false다. 그 밖에는 두 근의 선분 비율 중 하나가 0 이상 1 이하일 때 true다. 길이 0인 변은 별도 보정하지 않아 0 나눗셈 뒤 비교 결과가 false가 된다.

UMeasureCoordinateSource 타입 정의
    coordinates: Array<number> | Double_Array<number> | Triple_Array<number> | Array<Triple_Array<number>>
    _flatCoordinates: Array<Float64Array> | undefined
    properties: KeyValue

UMeasureCoordinateGeometry 타입 정의
    역할: GeoJSON 종류·공개 좌표·선택적 점 반경과 내부 파트 조회·분할을 제공하는 공통 형상이다.

UMeasureCoordinateFeature 타입 정의
    역할: ID·속성·좌표 형상과 기존 스타일용 조회 메서드를 제공하는 공통 입력이다.

UMeasureFeatureExtent 타입 정의
    min: THREE.Vector3Like
    max: THREE.Vector3Like
    getCenter: function

MeasureFeature 타입 정의
    UMeasureFeature

MeasureCoordinates 타입 정의
    Array<THREE.Vector3>

```

## 4. 공통 처리 기준과 제약

```spec
원본 등록·표시 조각 목록·변경 구독·요청 취소·원본 도형 회수는 terrain manager와 등록 레이어 어댑터가 소유한다. 매개체는 그 자원을 직접 dispose하지 않는다.
공개 형상이 아직 조회되지 않은 표시 조각도 수신 검색 스냅샷을 보관한다. 다른 원본의 회수와 한 조각의 좌표 편집은 다른 조각의 수신 형상을 변경하지 않는다.
대표 원본 조회·편집으로 외부에 노출된 원본의 보존 여부는 등록부가 판단한다. 이 단위의 조회는 _sourceExposed로 해당 사용을 알린다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
