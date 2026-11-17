# U2dGeometry 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

원본 OpenLayers Feature의 위치·형상·스타일·사용자 속성을 공통 객체 API로 편집한다.

### 1.2 책임 범위

원본 생성·채택·소유권, 좌표 변환·미리보기, 개별 스타일과 연결 라벨을 관리한다. 타일 합성과 GPU 자원은 연결 레이어와 terrain manager가 담당한다.

### 1.3 주요 동작 방식

원본 Feature를 편집하고 변경 이벤트를 통지한다. sourceFeature를 빌린 경로는 실제 OL 스타일 조회 전까지 기본 스타일 생성을 미룬다.

### 1.4 주요 사용처와 연계 대상

U2dPoint·U2dLine·U2dPolygon의 기반이며 U2dVectorShaderLayer와 U3dShaderMeasureLayer가 원본 변경을 표시로 연결한다.

## 3. 정규 자연어 수도코드

```spec
U2dGeometry 클래스 정의

    name: string
        도형 이름이며 직접 쓰기는 Feature의 name 속성에 자동 반영되지 않는다.

    fillColor: string
        채움의 편의 색상이며 스타일 동기화 때 원본 값으로 바뀔 수 있다.

    strokeColor: string
        외곽선의 편의 색상이다.

    strokeWidth: number
        편의 선 두께다.

    coordinates: U2dCoordinate
        순차 입력의 확정 좌표이며 미리보기 점과 구분한다.

    meta: KeyValue | undefined
        사용자 메타데이터 보관 참조다.

    geom: OLGeometry | undefined
        현재 원본 형상 참조이며 공개 조회에서 원본 교체를 확인한다.

    feature: OLFeature | undefined
        편집 원본 Feature 참조다.

    fill: OLFill | undefined
        현재 채움 스타일 참조다.

    stroke: OLStroke | undefined
        현재 외곽선 스타일 참조다.

    style: OLStyle | undefined
        도형이 보관한 현재 또는 복원용 단일 스타일이다.

    lastCoordinate: Array<number> | undefined
        미리보기 마지막 좌표이며 setPosition에서 undefined로 초기화한다. U2dPolygon._syncCoordinates는 이 값의 존재를 읽어 확정점 분리 조건을 판정한다.

    excludeSearch: boolean
        검색 제외의 도형 편의 값이다.

    nonChanged: boolean
        스타일 편집 잠금의 도형 편의 값이다.

    _visible: boolean
        도형 표시 상태다.

    _label: U2dLabel | undefined
        연결된 라벨 참조다.

    constructor(opt: U2dGeometryCO = {})
        의존:
            ol — 입력·형상·스타일 처리; 생성자: {new ol.style.Fill()}
            ol — 입력·형상·스타일 처리; 생성자: {new ol.style.Stroke()}
            ol — 입력·형상·스타일 처리; 생성자: {new ol.style.Style()}
            defaultValue — 입력·형상·스타일 처리; 함수: {defaultValue()}
            defined — 입력·형상·스타일 처리; 함수: {defined()}
            Guid — 입력·형상·스타일 처리; 함수: {Guid()}
        동작:
            이름은 opt.name이 falsy이면 Guid()를 사용하고 채움·외곽선 색·두께의 기본값과 빈 확정 좌표를 보관한다.
            sourceFeature가 없으면 Fill·Stroke·Style을 만들고 명시 불투명도를 색상과 별도로 보관한다.
            검색 제외·스타일 잠금·표시·해제·원본 소유권과 해제 구독 Set을 초기화한다.
            opt.sourceFeature가 truthy이면 기반 setFeature를 직접 호출하여 빈 형상과 기본 스타일 없이 원본을 빌려 연결한다. opt.sourceFeature가 falsy이면 하위 createGeometry를 호출한다.

    buildCoordinates(coords: U2dCoordinate = []) -> U2dCoordinate | Quad_Array<number>
        동작:
            coords 참조를 그대로 반환한다. 하위 도형은 좌표 포장을 재정의한다.

    createGeometry() -> void
        의존:
            ol — 입력·형상·스타일 처리; 생성자: {new ol.Feature()}
            defined — 입력·형상·스타일 처리; 함수: {defined()}
        동작:
            이름을 가진 OL Feature를 만들고 ID가 미지정이면 ol_uid를 ID로 지정한다.
            Feature._excludeSearch에 boolean 검색 제외를 기록한다.
            nonChanged가 truthy이면 Feature._nonChanged를 true로 기록한다.
            현재 geom과 style을 원본에 연결한다.

    dispose() -> void
        동작:
            _disposed가 truthy이면 반환한다.
            _disposed가 falsy이면
                _disposed를 true로 바꾸고 해제 구독을 순서대로 호출한 뒤 구독 Set을 비운다.
                _ownsFeature가 true인 경우에만 Feature와 geom의 dispose를 호출한다.
                coordinates가 존재하고 길이가 0보다 크면 coordinates를 빈 배열로 바꾼다. meta가 truthy이면 meta를 undefined로 바꾼다. 외부 원본은 파괴하지 않으며 참조 필드 전체를 비우지는 않는다.
                구독 또는 원본 dispose가 던진 예외를 삼키지 않으므로 이후 정리 단계는 실행되지 않을 수 있다.

    addDisposeListener(listener: function(): void) -> function(): void
        동작:
            listener를 해제 구독 Set에 추가하고 같은 listener를 삭제하는 함수를 반환한다.

    setExcludeSearch(excludeSearch: boolean) -> void
        동작:
            excludeSearch를 보관하고 Feature가 있으면 _excludeSearch에 같은 값을 기록한 뒤 changed를 호출한다.

    getExcludeSearch() -> boolean
        동작:
            원본의 _excludeSearch가 nullish가 아니면 그 값을, 아니면 도형의 excludeSearch를 반환한다.

    setNonChanged(nonChanged: boolean) -> void
        동작:
            nonChanged를 보관하고 Feature가 있으면 _nonChanged에 같은 값을 기록한 뒤 changed를 호출한다.

    getNonChanged() -> boolean
        동작:
            원본의 _nonChanged가 nullish가 아니면 그 값을, 아니면 도형의 nonChanged를 반환한다.

    getParam() -> U2dGeometryParam
        동작:
            현재 명시 스타일 값과 검색 제외·잠금·연결된 라벨 표시를 새 객체로 반환한다. 좌표·회전·배율은 포함하지 않는다.

    setParam(param: U2dGeometryParam = {}) -> void
        의존:
            assertBoolean — 입력·형상·스타일 처리; 함수: {assertBoolean()}
            assertNonNegative — 입력·형상·스타일 처리; 함수: {assertNonNegative()}
            assertRange — 입력·형상·스타일 처리; 함수: {assertRange()}
            defined — 입력·형상·스타일 처리; 함수: {defined()}
        동작:
            param이 null·배열·객체 아닌 값이면 TypeError를 던진다. 색상·불투명도 0~1·비음수 두께와 boolean 항목을 모두 검증한 뒤 변경한다.
            _disposed가 truthy이면 검증 뒤 반환한다.
            _disposed가 falsy이면
                getNonChanged 결과로 현재 잠금을 읽고 nonChanged:false이면 먼저 잠금을 해제한다.
                param.fillColor가 nullish가 아니면 OL 문자열로 변환하여 setFillColor로 적용한다.
                param.strokeColor가 nullish가 아니면 OL 문자열로 변환하여 setStrokeColor로 적용한다.
                param.strokeWidth가 nullish가 아니면 setStrokeWidth로 적용한다.
                param.fillOpacity가 nullish가 아니면 setFillOpacity로 적용한다.
                param.strokeOpacity가 nullish가 아니면 setStrokeOpacity로 적용한다.
                param.visible이 정확히 true·false이면 각각 show·hide로 반영한다.
                param.excludeSearch가 nullish가 아니면 setExcludeSearch로 반영한다.
                param.showLabel이 nullish가 아니면 setShowLabel로 반영한다.
                param.nonChanged가 true이면 이번 편집 뒤 잠근다. 잠금 중에도 표시·검색 제외·라벨은 별도 처리한다.

    _getSourceStyle() -> OLStyle|undefined
        동작:
            현재 Feature 스타일과 _style 백업을 읽는다.
            숨김 또는 강조 중에는 getFill을 가진 백업을 우선하고, 그런 백업이 없으면 현재 원본 스타일이 있을 때 도형 style을 반환한다.
            평상시에는 원본의 단일 스타일만 반환하고 배열·함수·미지정은 undefined로 반환한다. 조회만으로 OL 자원을 만들지 않는다.

    _getStyleValues() -> U2dGeometryParam & Partial<{fillColor: string, strokeColor: string}>
        의존:
            defined — 입력·형상·스타일 처리; 함수: {defined()}
        동작:
            편집 대상 단일 스타일을 읽고, 그 스타일이 없을 때만 getFill을 갖지 않은 _style 값 객체를 사용한다.
            이미지의 채움·외곽선을 스타일 본체보다 우선하여 색·두께를 읽고 색상은 OL 문자열로 바꾼다.
            불투명도는 별도 opacity를 먼저, 없으면 색상 알파를 사용한다. 미지정 색상은 undefined를 유지한다.
            표시는 도형 _visible이 true이고 style.visible, 값 객체 visible, true 순의 첫 nullish 아닌 값이 참일 때만 true다.

    getFillColor() -> string|undefined
        동작:
            현재 원본 명시 스타일의 채움 색을 반환하며 미지정이면 undefined다.

    getStrokeColor() -> string|undefined
        동작:
            현재 원본 명시 스타일의 외곽선 색을 반환하며 미지정이면 undefined다.

    getStrokeWidth() -> number|undefined
        동작:
            현재 원본 명시 스타일의 선 두께를 반환하며 미지정이면 undefined다.

    getFillOpacity() -> number|undefined
        동작:
            현재 채움의 별도 불투명도 또는 색상 알파를 반환하며 미지정이면 undefined다.

    getStrokeOpacity() -> number|undefined
        동작:
            현재 외곽선의 별도 불투명도 또는 색상 알파를 반환하며 미지정이면 undefined다.

    setFillOpacity(opacity: number) -> void
        의존:
            assertRange — 입력·형상·스타일 처리; 함수: {assertRange()}
            defined — 입력·형상·스타일 처리; 함수: {defined()}
        동작:
            opacity의 유한 숫자·0~1 범위를 검증한다. opacity가 nullish가 아니면 getNonChanged로 잠금을 읽는다. opacity가 nullish이거나 잠금 또는 해제 상태이면 반환한다.
            기존 _isSetStyle 표식이 있으면 명시 편집으로 지정하고, 현재 편집 스타일이 있으면 현재 채움 색을 setter로 연결한다.
            준비된 Fill의 opacity와 지연 편집 값을 기록한 뒤 원본 변경을 통지한다.

    setStrokeOpacity(opacity: number) -> void
        의존:
            assertRange — 입력·형상·스타일 처리; 함수: {assertRange()}
            defined — 입력·형상·스타일 처리; 함수: {defined()}
        동작:
            opacity의 유한 숫자·0~1 범위를 검증한다. opacity가 nullish가 아니면 getNonChanged로 잠금을 읽는다. opacity가 nullish이거나 잠금 또는 해제 상태이면 반환한다.
            기존 _isSetStyle 표식이 있으면 명시 편집으로 지정하고, 현재 편집 스타일이 있으면 현재 외곽선 색을 setter로 연결한다.
            준비된 Stroke의 opacity와 지연 편집 값을 기록한 뒤 원본 변경을 통지한다.

    getProperties() -> KeyValue
        동작:
            해제됐거나 Feature가 없으면 빈 객체를 반환한다. 원본 속성의 얕은 복사본에서 현재 geometry 속성 이름을 제거하여 반환한다.

    setProperties(input: KeyValue|string) -> void
        의존:
            OLFeature — geometry 이름·속성 교체와 변경 통지; 함수: {getGeometryName(), unset(), setProperties(), this.feature.getProperties(), changed()}
        동작:
            해제됐거나 Feature가 없으면 반환한다. 문자열은 JSON으로 해석하고 null·배열·객체 아닌 입력은 TypeError로 거부한다.
            현재 geometry 이름의 항목을 제외한 속성을 JSON으로 깊은 복사하고 __proto__ 예약 키를 거부한다. JSON 해석·직렬화 실패는 원본 속성을 지우기 전에 전달한다.
            기존 사용자 키를 silent로 제거한 뒤 복사본을 silent로 반영한다. Feature ID와 geometry는 유지하고 meta를 다시 읽은 뒤 changed를 호출한다.

    addProperties(key: string, value: unknown) -> void
        의존:
            defined — 입력·형상·스타일 처리; 함수: {defined()}
        동작:
            빈 키 또는 nullish 값이면 반환한다. 현재 사용자 속성에 키가 이미 있으면 반환하고, 없으면 그 값을 합친 객체로 전체 속성 교체를 호출한다.

    changeProperties(key: string, value: unknown) -> void
        의존:
            defined — 입력·형상·스타일 처리; 함수: {defined()}
        동작:
            빈 키 또는 nullish 값이면 반환한다. 현재 사용자 속성이 그 키를 직접 가진 경우에만 값을 합쳐 전체 속성을 교체한다.

    removeProperties(key: string) -> void
        동작:
            현재 사용자 속성에 직접 존재하는 키만 제거한 뒤 나머지 사용자 속성으로 전체 교체한다.

    getMeta() -> KeyValue|undefined
        동작:
            해제됐으면 undefined, 아니면 원본 전체 속성이 있으면 그 값, 없으면 보관한 meta를 반환한다. geometry 속성도 포함할 수 있다.

    setMeta(meta: KeyValue) -> void
        의존:
            defined — 입력·형상·스타일 처리; 함수: {defined()}
        동작:
            Feature가 있으면 전달 속성을 silent로 병합하고 전체 속성을 meta에 보관한 뒤 changed를 호출한다. Feature가 없으면 입력 meta 참조만 보관한다.

    getFeature() -> OLFeature|undefined
        동작:
            보관한 Feature 참조를 그대로 반환한다. 해제 상태만으로 이 참조를 지우지 않는다.

    setFeature(feature: OLFeature, ownsFeature: boolean = false) -> void
        의존:
            defined — 입력·형상·스타일 처리; 함수: {defined()}
            UMeasureFeature — 원본 Feature 해석; 함수: {getSourceFeature(), getOLFeature()}
            OLFeature — 원본 연결·속성·형상·스타일·ID와 해제; 함수: {getId(), setId(), getStyle(), setStyle(), getGeometry(), getProperties(), dispose()}
        동작:
            입력이 nullish이면 console.error를 기록하고 반환한다.
            UMeasureFeature 입력은 getSourceFeature 또는 getOLFeature로 해석하고 OL Feature가 아니면 TypeError를 던진다.
            같은 원본이면 ownsFeature가 true일 때만 소유권을 true로 올리고 반환한다. 다른 원본이고 해제 구독이 남아 있으면 기존 원본을 변경하기 전에 Error를 던진다.
            기존 원본을 소유했으면 기존 Feature를 해제한 뒤 this.feature를 입력 feature로, _ownsFeature를 ownsFeature로 보관한다. ID가 미지정이면 ol_uid를 사용한다.
            원본 스타일이 없고 도형 style이 있으면 연결한다. 원본이 단일 스타일이면 그 스타일의 채움·외곽선·편의 값을 채택하고 배열·함수 스타일을 단일 스타일로 바꾸지 않는다.
            meta에 원본 속성을, geom에 원본 형상을, excludeSearch·nonChanged에 원본 확장 상태를 보관한다. lastCoordinate를 undefined로 바꾸고 확정 좌표를 맞춘다.

    getGeometry() -> OLGeometry|undefined
        의존:
            OLFeature — 현재 원본 형상 조회; 함수: {getGeometry()}
        동작:
            해제됐으면 undefined를 반환한다.
            _disposed가 falsy이고 feature가 truthy이면 Feature의 현재 geometry를 읽는다. 보관한 geom과 다르면 새 geom을 보관하고 이전 미리보기를 종료한 뒤 확정 좌표를 맞춘다.
            현재 geom 참조를 반환한다.

    setStyle(style: OLStyle) -> void
        의존:
            defined — 입력·형상·스타일 처리; 함수: {defined()}
        동작:
            잠금 상태이면 반환한다. _isSetStyle 표식이 존재하면 true로 지정하여 같은 값의 재지정도 개별 편집으로 구분한다.
            style을 보관하고 원본이 강조 또는 숨김 중이면 _style에 백업하며, 평상시에는 원본 setStyle을 호출한다.
            입력의 채움·외곽선이 존재하는 항목만 편의 객체·색·두께에 반영하고 원본 changed를 호출한다.

    getStyle() -> OLStyle
        의존:
            ol — 입력·형상·스타일 처리; 생성자: {new ol.style.Fill()}
            ol — 입력·형상·스타일 처리; 생성자: {new ol.style.Stroke()}
            ol — 입력·형상·스타일 처리; 생성자: {new ol.style.Style()}
            OLStyle — 현재 이미지와 채움·외곽선 조회; 함수: {getImage(), getFill(), getStroke()}
        동작:
            평상시 원본에 단일 스타일이 있으면 그 참조를 채택한다. 강조·숨김 중이거나 원본이 배열·함수이면 이 채택을 하지 않는다.
            도형 style이 없으면 원본의 지연 값 객체에 명시된 색·두께·표시·불투명도를 적용해 Fill·Stroke·Style을 한 번 만들고 도형에 보관한다. 조회만으로 새 기본 Style을 원본에 지정하지 않는다.
            현재 이미지의 Fill·Stroke를 Style 본체보다 우선하여 선택한다. this.fill은 선택한 fill 또는 기존 this.fill로, this.stroke는 선택한 stroke 또는 기존 this.stroke로 맞춘다. 원본 스타일이 없으면 실제로 달라진 fillColor·strokeColor·strokeWidth와 숫자인 별도 불투명도만 지연 값에 기록한다.
            편의 색·두께를 최신 참조에서 읽어 보관하고 같은 Style 객체를 반환한다. 채움 부재를 임의의 명시 opacity 0으로 기록하지 않는다.

    _setStyleValue(key: 'fillColor' | 'fillOpacity' | 'strokeColor' | 'strokeOpacity' | 'strokeWidth' | 'visible' | 'isDynamicRadius', value: string | number | boolean) -> void
        동작:
            Feature가 없으면 반환한다. 원본 스타일이 없거나 _style이 단일 OL Style 아닌 값 객체일 때만 기록한다.
            기존 값 객체에서 항목 값이 같으면 반환하고, 다르면 기존 항목을 보존한 새 객체에 key와 value를 넣어 _style에 보관한다.

    setGeometryName(name: string) -> void
        동작:
            도형 name만 변경하며 Feature에 생성 시 기록한 name 속성은 변경하지 않는다.

    getName() -> string
        동작:
            현재 도형 name을 반환한다.

    setPosition(position: U2dCoordinate, srs: string = 'EPSG:3857') -> void
        동작:
            srs가 EPSG:3857·EPSG:4326 중 하나가 아니면 TypeError를 던진다.
            현재 원본을 확인하고 미리보기를 종료한 뒤 입력 position 참조를 확정 좌표로 보관해 형상에 적용한다.
            EPSG:4326 입력은 적용된 형상을 EPSG:3857로 변환한 뒤 확정 좌표를 다시 맞춘다.

    getPosition() -> U2dCoordinate
        동작:
            현재 원본의 좌표를 반환하며 원본이 없으면 빈 배열을 반환한다. 조회만으로 순차 입력의 확정점 수를 변경하지 않는다.

    _syncCoordinates() -> void
        동작:
            coordinates를 현재 원본 좌표로 바꾼다. 빈 형상 또는 원본 부재는 빈 coordinates 배열을 유지한다.
            lastCoordinate가 있고 새 coordinates 수가 이전 확정 좌표 수보다 정확히 하나 많으며 마지막 항목이 숫자 좌표 배열이면 그 점을 lastCoordinate로 보관하고 coordinates에서 제거한다.

    translate(x: number, y: number) -> void
        동작:
            현재 geometry가 있으면 x·y만큼 지도 좌표에서 이동하고 확정 좌표·미리보기를 맞춘다.

    rotate(angle: number, anchor: Array<number>) -> void
        동작:
            현재 geometry가 없으면 반환한다. anchor가 nullish이면 경계 상자의 중심을 사용하여 라디안 angle만큼 회전하고 확정 좌표·미리보기를 맞춘다.

    scale(x: number, y: number, anchor: Array<number>) -> void
        동작:
            y가 정확히 undefined일 때만 x를 y 배율로 사용한다. 현재 geometry를 배율·anchor로 확대 또는 축소한 뒤 확정 좌표·미리보기를 맞춘다. Point의 마커 반경은 좌표 배율과 별개다.

    addPosition(position: Array<number>, srs: string = "EPSG:4326") -> void
        의존:
            defined — 입력·형상·스타일 처리; 함수: {defined()}
        동작:
            position이 nullish이면 반환한다.
            position이 nullish가 아니면
                srs를 대문자로 바꾸고 EPSG:4326이면 변환하며 EPSG:3857이면 입력 좌표 참조를 사용한다.
                그 밖의 좌표계는 console.error를 기록하고 좌표를 변경하지 않는다.
                현재 원본을 확인한 뒤 미리보기를 종료하고 변환 좌표 한 개를 확정 배열에 추가하여 형상을 다시 적용한다.

    transformPoint(point: Array<number>, sourceCRS: string = 'EPSG:4326') -> Array<number>
        의존:
            ol — 입력·형상·스타일 처리; 함수: {ol.proj.transform()}
        동작:
            OpenLayers proj.transform에 point·sourceCRS·EPSG:3857을 전달한 결과를 반환한다. 별도 지원 좌표계 검사를 추가하지 않는다.

    setFillColor(color: string) -> void
        의존:
            ol — 입력·형상·스타일 처리; 생성자: {new ol.style.Fill()}
        동작:
            잠금 상태이면 반환하고 기존 _isSetStyle 표식이 있으면 true로 지정한다.
            nonChanged가 falsy이면
                도형 또는 원본 스타일이 있으면 현재 스타일을 동기화하고 편의 fillColor와 지연 값에 입력 색을 기록한다.
                Style이 준비되어 있으면 Fill을 필요 시 생성하여 색을 변경하고 Style에 연결한다. 원본 changed를 호출한다.

    setStrokeColor(color: string) -> void
        의존:
            ol — 입력·형상·스타일 처리; 생성자: {new ol.style.Stroke()}
        동작:
            잠금 상태이면 반환하고 기존 _isSetStyle 표식이 있으면 true로 지정한다.
            nonChanged가 falsy이면
                도형 또는 원본 스타일이 있으면 현재 스타일을 동기화하고 편의 strokeColor와 지연 값에 입력 색을 기록한다.
                Style이 준비되어 있으면 Stroke를 필요 시 생성하여 색을 변경하고 Style에 연결한다. 원본 changed를 호출한다.

    setStrokeWidth(width: number) -> void
        의존:
            ol — 입력·형상·스타일 처리; 생성자: {new ol.style.Stroke()}
        동작:
            잠금 상태이면 반환하고 기존 _isSetStyle 표식이 있으면 true로 지정한다.
            nonChanged가 falsy이면
                도형 또는 원본 스타일이 있으면 현재 스타일을 동기화하고 편의 strokeWidth와 지연 값에 입력 두께를 기록한다.
                Style이 준비되어 있으면 Stroke를 필요 시 생성하여 두께를 변경하고 Style에 연결한다. 원본 changed를 호출한다.

    setLastCoordinate(coord: Array<number>) -> void
        동작:
            현재 원본을 읽고 coord를 기본 EPSG:4326에서 변환하여 lastCoordinate로 보관한다. 확정 좌표 뒤에 임시점 한 개를 더한 배열을 하위 좌표 형식으로 포장하고 원본이 있으면 적용·변경 통지한다.

    getCenter() -> Array<number>
        동작:
            현재 원본의 extent에서 최소·최대 x·y의 평균을 배열로 반환한다. 무게중심이 아니며 원본 부재에 대한 별도 방어는 없다.

    setLabel(poi: U2dLabel) -> void
        동작:
            Feature가 있으면 _label에 poi를 기록하고 도형에도 같은 라벨 참조를 보관한다.

    removeLabel() -> void
        동작:
            원본과 도형의 라벨 참조를 undefined로 바꾼다. 라벨 객체 자체를 dispose하지 않는다.

    getLabel() -> U2dLabel|undefined
        동작:
            현재 연결된 라벨 참조를 반환한다.

    showLabel() -> void
        동작:
            연결된 라벨 표시를 true로 변경한다.

    hideLabel() -> void
        동작:
            연결된 라벨 표시를 false로 변경한다.

    setShowLabel(visible: boolean) -> void
        의존:
            assertBoolean — 입력·형상·스타일 처리; 함수: {assertBoolean()}
            defined — 입력·형상·스타일 처리; 함수: {defined()}
        동작:
            visible의 boolean 형식을 검증한다. nullish 입력 또는 해제 상태이면 반환하고 연결된 라벨이 있을 때만 그 visible 속성을 변경한다.

    getShowLabel() -> boolean
        동작:
            라벨이 존재하고 라벨 visible이 truthy인 경우에만 true를 반환한다.

    show() -> void
        동작:
            _visible을 true로 지정한다. OL Style 백업이 없으면 지연 visible 값을 true로 기록하고 준비된 도형 Style의 visible도 true로 바꾼다.
            Feature의 현재 스타일 또는 OL Style 백업이 있고 도형 style이 있으면 원본에 그 style을 적용한다. 그 밖에는 원본 changed만 호출한다.

    hide() -> void
        의존:
            ol — 입력·형상·스타일 처리; 생성자: {new ol.style.Style()}
        동작:
            원본 스타일이 있으면 최신 스타일을 먼저 동기화한다.
            _visible을 false로 바꾸고 지연 visible을 기록한다. 원본 스타일이 있으면 visible=false인 빈 OL Style을 새로 적용하며, 없으면 원본 changed만 호출한다.
            검색 제외나 라벨 표시를 함께 변경하지 않는다.

    #updateFeatureGeometry(coords: U2dCoordinate) -> void
        동작:
            하위 buildCoordinates로 coords를 포장하고 현재 geometry가 있으면 setCoordinates로 반영한다.

getOlStyleColor(color: THREE.ColorRepresentation|Array<number>) -> string
    동작:
        배열은 RGB와 알파 또는 기본 알파 1의 rgba 문자열로, transparent는 rgba(0,0,0,0)로, 숫자는 하위 24비트의 6자리 16진 색으로 변환한다. 그 밖의 문자열은 그대로, 색상 객체는 getStyle 결과로 반환한다.

getU2dOpacity(color: THREE.ColorRepresentation|Array<number>|undefined, opacity: number|undefined) -> number|undefined
    의존:
        ol — 입력·형상·스타일 처리; 함수: {ol.color.asArray()}
        defined — 입력·형상·스타일 처리; 함수: {defined()}
    동작:
        opacity가 nullish가 아니면 그 값을 그대로 우선 반환한다.
        opacity가 nullish이면
            color가 nullish가 아니면
                배열은 네 번째 값 또는 1을 반환한다. 그 밖의 색은 getOlStyleColor로 바꾸고 hsla 알파를 0~1로 제한하거나 rgba의 ol.color.asArray 알파를 사용하며 다른 색은 1이다.
            color도 nullish이면 undefined를 반환한다.

assertU2dColor(name: string, color: THREE.ColorRepresentation|Array<number>|undefined) -> void
    의존:
        assertColor — 입력·형상·스타일 처리; 함수: {assertColor()}
        assertRange — 입력·형상·스타일 처리; 함수: {assertRange()}
        defined — 입력·형상·스타일 처리; 함수: {defined()}
    동작:
        nullish 색은 허용한다. 배열은 길이 3·4와 숫자 성분을 검사하고 RGB 0~255·알파 0~1을 검증한다. transparent 외의 비배열 값은 assertColor로 검증하며 실패를 그대로 전달한다. 배열 길이 또는 성분 형식이 맞지 않으면 TypeError를 던지며 수치 범위 오류도 그대로 전달한다.

U2dGeometryCO 타입 정의
    sourceFeature?: OLFeature
    name?: string
    fillColor?: string|number|Array<number> = 'rgba(255,255,255,0.4)'
    fillOpacity?: number
    strokeColor?: string|number|Array<number> = '#3399CC'
    strokeOpacity?: number
    strokeWidth?: number = 1.25
    excludeSearch?: boolean = false
    nonChanged?: boolean = false

U2dCoordinate 타입 정의
    Array<number> | Double_Array<number> | Triple_Array<number> | Quad_Array<number>

U2dLabel 타입 정의
    import('@union3d/geometry/U3dPOI').U3dPOI | import('@UCssBilboard').UCssBilboard

U2dGeometryParam 타입 정의
    fillColor?: THREE.ColorRepresentation|Array<number>
    fillOpacity?: number
    strokeColor?: THREE.ColorRepresentation|Array<number>
    strokeOpacity?: number
    strokeWidth?: number
    visible?: boolean
    excludeSearch?: boolean
    nonChanged?: boolean
    showLabel?: boolean

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
