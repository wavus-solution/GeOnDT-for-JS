# U3dPatternXYZLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

기본 색·패턴·알파 텍스처와 위경도 영역 데칼을 타일 지면에 합성한다. 레이어와 데칼 설정은 commit을 통해 반영하며 타일별 합성 이력을 재사용한다.

주요 사용처는 U3dApp의 패턴 레이어 추가 경로와 tutorial-official/customImageLayer.html이다.

## 3. 정규 자연어 수도코드

```spec
U3dPatternXYZLayerCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        baseurl?: string
        baseUrl?: string
            기본 패턴 URL이며 default는 기본 제공 패턴을 뜻한다.
        alphabaseurl?: string
        alphaBaseUrl?: string
            알파 이미지 URL이다.
        isConvertGrayScale?: boolean
        isconvertgrayscale?: boolean
            알파 이미지의 명도를 이진 알파로 변환할지 정한다.
        usebasetexture?: boolean
        useBaseTexture?: boolean
        usealphatexture?: boolean
        useAlphaTexture?: boolean
            기본·알파 이미지 사용 여부이다.
        color?: string | number
            기본 색상이다.
        decalinfos?: Array<DecalOption>
        decalInfos?: Array<DecalOption>
            초기 데칼 옵션이다.

U3dPatternXYZLayerCO 타입 정의
    기반 레이어 옵션과 이 단위의 패턴 옵션을 합성한다.

DecalOption 부분 타입 명세
    이 명세에서 사용하는 필드:
        decalArea: Array<Vector2Like>
            위경도 영역이며 최소 세 점이 필요하다.
        name?: string
            데칼 조회 이름이다.
        opacity: number = 1.0
            합성 투명도이다.
        textureUrl?: string | null | undefined
        alphaTextureUrl?: string | null | undefined
            패턴과 알파 이미지 URL이다.
        color?: string | number | null | undefined
            데칼 색상이다.
        isConvertGrayScale?: boolean
            데칼 알파를 명도에서 변환할지 정한다.
        patternStrength: number = 2
            패턴의 반복 강도이다.
        minPatternPixel: number = 2
            패턴 캔버스의 최소 크기이다.
        useTexture: boolean = true
        useAlphaTexture: boolean = true
            이미지 사용 여부이다.
        minLevel: number = 15
            최소 출력 레벨이다.
        maxLevel?: number
            최대 출력 레벨이다.

UPatternDecalCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
            조회 이름이다.
        isConvertGrayScale: boolean = false
            명도 알파 변환 여부이다.
        patternStrength: number = 2
            패턴 강도이다.
        minPatternPixel: number = 2
            패턴 최소 픽셀이다.
        useTexture: boolean = true
        useAlphaTexture: boolean = true
            기본·알파 이미지 사용 여부이다.
        minLevel: number = 15
            최소 출력 레벨이다.
        maxLevel?: number | null | undefined
            최대 출력 레벨이다.
        area: Array<Vector3Like>
            위경도 영역이다. 레이어 생성 경로는 Vector2Like 배열을 넘긴다. [확인 Q-001]
        opacity: number
            공개 선언은 필수이지만 런타임은 생략 시 1을 사용한다. [확인 Q-001]
        textureUrl: string | null
        alphaTextureUrl: string | null
            공개 선언은 필수이지만 런타임은 생략을 허용한다. [확인 Q-001]
        color: Color
            공개 선언은 Color이지만 레이어는 색상 표현값을 전달한다. [확인 Q-001]
        app: U3dApp
            좌표 변환과 최대 레벨 제공자이다.
        layer: U3dPatternXYZLayer
            이미지 조회와 갱신 버전의 소유자이다.

U3dPatternDecalSelectionState 부분 타입 명세
    이 명세에서 사용하는 필드:
        decalInfos: Array<UPatternDecal> | null
            현재 등록 목록의 조회 권한이다.

U3dPatternLayerCanvasState 부분 타입 명세
    이 명세에서 사용하는 필드:
        _opacity: number
            레이어 투명도이다.
        color: Color
            기본 색상이다.
        useBaseTexture: boolean
            기본 이미지 사용 여부이다.
        useAlphaTexture: boolean
            알파 이미지 사용 여부이다.

UPatternDecalCanvasState 부분 타입 명세
    이 명세에서 사용하는 필드:
        color: Color
            데칼 색상이다.
        useTexture: boolean
            기본 이미지 사용 여부이다.
        useAlphaTexture: boolean
            알파 이미지 사용 여부이다.
        textureUrl: string | null
            기본 이미지 주소이다.
        alphaTextureUrl: string | null
            알파 이미지 주소이다.
        layer: Pick<U3dPatternXYZLayer, 'getDecalTexture' | 'getDecalAlphaTexture'>
            이미지 조회 API만 사용하는 경계이다.

UPatternDecalSizeState 부분 타입 명세
    이 명세에서 사용하는 필드:
        patternStrength: number
            패턴 강도이다.
        minPatternPixel: number
            최소 패턴 크기이다.
        app: {_maxlevel: number}
            앱 최대 레벨을 조회하는 경계이다.

U3dPatternWorkLog 부분 타입 명세
    이 명세에서 사용하는 필드:
        uuid: string
            데칼 식별자이다.
        version: number
            합성 시점의 변경 버전이다.

UPatternDecalAreaState 부분 타입 명세
    이 명세에서 사용하는 필드:
        area: Array<Vector3Like>
            조회하는 원본 위경도 영역이다.
        app: Pick<U3dApp, 'getGeographicToWorld' | 'getGeographicToGoogle'>
            좌표 변환 API 경계이다.
        _decalWorldArea: Array<Vector3Like>
            확장할 월드 좌표 배열이다.
        _decalGoogleArea: Array<Vector3Like>
            확장할 구글 좌표 배열이다.
        boundingBox: Box3
            확장할 영역 경계이다.

U3dPatternResourceInfo 부분 타입 명세
    이 명세에서 사용하는 필드:
        workHistory: Array<U3dPatternWorkLog>
            전체 데칼의 순서·변경 이력이다.
        decalTexture: UCanvasTexture | null
            이전 합성 텍스처이다.
        layerTexture: UCanvasTexture | null
            합성에 사용한 기본 텍스처 참조이다.

U3dPatternBakeResult 부분 타입 명세
    이 명세에서 사용하는 필드:
        type: string
            all은 전체 합성, append는 추가 합성, none은 기존 결과 사용이다.
        texture: UCanvasTexture | null
            합성 바탕 또는 기존 결과이다.
        startIndex: number
            추가 합성을 시작할 위치이다.

U3dPatternXYZLayer extends U3dImageLayer 클래스 정의
    의존: U3dImageLayer — 기반 이미지 레이어; 상속: {U3dImageLayer}

    #texture, #oriTexture, #alphaTexture: UCanvasTexture | null = null
        합성 기본 텍스처와 원본 기본·알파 텍스처이다.
    #decalTextures, #decalAlphaTextures: Record<string, Texture> | null = null
        URL별 데칼 이미지이다.
    #loader: UTextureLoader
        의존: UTextureLoader — 이미지 로딩; 생성자: {new UTextureLoader()}
    #rectangleCache, #resourceCache: LRUCache
        의존: LRUCache — 타일 사각형과 합성 결과 보관; 생성자: {new LRUCache()}
    #patternPromise: DeferredObject
        의존: deferred — 패턴 준비 완료; 함수: {deferred()}
    _lastUpdateVersion: number = 0
    _updateVersion: number = 0
        반영 완료 버전과 요청 버전이다.
    userOption: U3dPatternXYZLayerCO | null = null
        보관한 생성 옵션이며 initialize에서 초기 decalInfos 등록 조건으로 읽는다.
    decalInfos: Array<UPatternDecal> = 빈 배열
        등록된 데칼 객체 참조 목록이다. 외부 쓰기를 차단하지 않는다.
    isConvertGrayScale: boolean = false
        기본 필드값이며 생성자에서는 기본 true로 설정한다.
    _alphaBaseUrl: string | null = null
        알파 이미지 주소이다.
    color: Color
        의존: Color — 초기 흰색; 생성자: {new Color()}
    useBaseTexture: boolean = true
        외부 변경 가능하며 createLayerCanvas의 기본 이미지 사용 조건으로 읽는다.
    useAlphaTexture: boolean = true
        외부 변경 가능하며 createLayerCanvas의 알파 이미지 사용 조건으로 읽는다.

    constructor(opt: U3dPatternXYZLayerCO = {})
        인터페이스: 기반 레이어 옵션과 패턴·알파·데칼 출력 옵션을 받는다.
        의존:
            U3dImageLayer — 부모 생성; 생성자: {super()}
            UDEF — 기본 리소스 경로; 속성 읽기: {path}
            UDefaultSource — 기본 패턴; 상수: {PATTERN_TILE}
            Color — 색상 구성; 생성자: {new Color()}
            UTextureLoader — 로그 이름; 함수: {setName()}
            UCache — 자원 축출 보류; 함수: {has()}
            U3dLayer — 부모 메시 캐시; 속성 읽기: {_cache}
        동작:
            baseurl 또는 baseUrl이 truthy이면 null 병합으로 baseurl을 우선 선택한다.
            선택한 주소가 default이면 원본 opt.baseurl을 기본 패턴으로 바꾸고 opt.baseUrl을 undefined로 바꾼다.
            부모를 초기화한 뒤 클래스 이름을 설정한다.
            opt.alphabaseurl을 opt.alphaBaseUrl보다 null 병합 우선하여 저장하고 둘 다 없으면 null이다.
            opt.usebasetexture를 opt.useBaseTexture보다 null 병합 우선하여 저장하고 둘 다 없으면 true이다.
            opt.usealphatexture를 opt.useAlphaTexture보다 null 병합 우선하여 저장하고 둘 다 없으면 true이다.
            opt.isConvertGrayScale를 opt.isconvertgrayscale보다 null 병합 우선하며 생략하면 true이다.
            falsy color는 원본 옵션에 흰색을 써 넣고 Color를 만든다.
            decalinfos가 truthy이고 decalInfos가 falsy일 때 원본 옵션의 카멜 필드로 옮기고 소문자 필드를 삭제한다.
            원본 옵션을 userOption으로 보관하고 로더 이름을 설정한다.
            자원 축출 callback은 메시 캐시에 같은 키가 있으면 해제를 건너뛰고, 없으면 데칼 텍스처와 현재 기본 텍스처가 아닌 이전 기본 텍스처를 해제한다.

    override initialize() -> boolean
        의존:
            U3dImageLayer — 부모 초기화; 함수: {initialize()}
            U3dLayer — 앱·기본 주소·준비 완료; 속성 읽기: {_app, _baseUrl}; 함수: {resolve()}
            U3dObject — 레이어 이름; 속성 읽기: {_name}
            UTextureLoader — 이미지 요청; 함수: {load()}
            deferred — 완료 상태; 함수: {deferred()}
            UDEF — 알파 품질 적용; 함수: {setTextureImprovement()}
            U3dApp — 렌더러; 속성 읽기: {_renderer}
            UEventDispatcher — 데칼 추가 통지; 함수: {dispatchEvent()}
            __GError__ — 로딩 오류 통지; 함수: {__GError__()}
        동작:
            _app이 없으면 false를 반환한다.
            _app이 있으면:
                초기 decalInfos가 있으면 데칼을 등록한다.
                기본 URL이 있으면 로딩 성공 후 이름과 원본 텍스처를 저장하고, 실패하면 0948373 로그와 오류값으로 완료한다. URL이 없으면 즉시 완료한다.
                _alphaBaseUrl이 있으면 로딩하고 isConvertGrayScale가 true일 때 명도 변환 결과를 사용한다.

                알파 성공은 품질을 적용하여 완료하고 실패는 0949618 로그와 오류값으로 완료한다.
                데칼 이미지 요청을 같은 대기 목록에 추가한다.
                모든 요청 종결 뒤 finally에서 기본 합성 텍스처를 저장한다.
                패턴 준비와 레이어 준비를 완료한 다음 데칼별 캔버스를 굽고 addDecal 이벤트를 전달한다.
            부모 initialize의 즉시 결과를 반환하며 비동기 이미지 완료까지 기다리는 반환값은 아니다.

    override update() -> void
        의존:
            U3dImageLayer — 부모 갱신; 함수: {update()}
            U3dLayer — 앱·해제·투명도·메시 캐시; 속성 읽기: {_app, _disposed, _transparent, _cache}
            defined — 버전 존재; 함수: {defined()}
            UCache — 메시 목록; 함수: {items()}
            UTerrainMesh — 타일; 함수: {getTile()}
            U3dQuadTile — 타일 키; 함수: {getKey()}
            LRUCache — 합성·사각형 캐시; 함수: {has(), get(), delete()}
            Texture — 기존 map 해제; 함수: {dispose()}
        동작:
            _app이 없거나 패턴 준비가 안 됐거나 _disposed가 true이면 종료한다.
            _app이 truthy이면:
                _disposed가 false이고 패턴이 준비되었으면:
                    부모 update를 인수 없이 호출한다.
                    _lastUpdateVersion과 _updateVersion이 다를 때만 메시를 순회하며 같은 updateVersion인 메시를 건너뛴다.
                    타일에 해당하는 데칼을 조회한다.
                    데칼이 있으면 합성 결과를 머티리얼에 연결한다.
                    데칼이 없으면 다른 map을 해제하고 현재 기본 텍스처로 바꿔 needsUpdate를 설정한다.
                    데칼이 없고 자원 캐시가 있으면 다른 layerTexture에 dipose를 호출하고 layerTexture를 null로 바꾼다. [확인 Q-002]
                    같은 자원 항목의 decalTexture를 해제하고 null로 바꾼 뒤 캐시를 제거한다.
                    데칼이 없는 타일의 사각형 캐시도 제거한다.
                    알파 텍스처 또는 데칼 알파 저장소가 truthy이면 transparent를 true로, 아니면 레이어 _transparent로 설정한다.
                    각 메시 updateVersion과 최종 _lastUpdateVersion을 요청 버전으로 저장한다.

    override setOpacity(opacity: number) -> this
        의존:
            MathUtils — 투명도 보정; 정적 함수: {clamp()}
            U3dLayer — 레이어 투명 상태; 속성 쓰기: {_opacity, _transparent}
        동작: 0~1로 보정한 opacity를 _opacity에 저장하고 1 미만이면 _transparent를 true로 설정한 뒤 자신을 반환한다.

    setColor(color: string | number) -> this
        의존: Color — 색상 구성; 생성자: {new Color()}
        동작: falsy 입력이면 자신만 반환하고 아니면 새 Color를 저장한 뒤 자신을 반환한다.
    getColor() -> number
        의존: Color — RGB 정수; 함수: {getHex()}
        동작: 현재 color의 RGB 정수를 반환한다.
    setUseBaseTexture(use: boolean = true) -> this
        동작: useBaseTexture를 저장하고 자신을 반환한다.
    setUseAlphaTexture(use: boolean = true) -> this
        동작: useAlphaTexture를 저장하고 자신을 반환한다.
    commit() -> this
        동작:
            현재 원본 기본·알파 이미지로 새 기본 텍스처를 저장한다.
            _updateVersion을 증가시키고 자신을 반환한다.

    override createTexture(tile: U3dQuadTile) -> Promise<U3dQuadTile> | undefined
        의존:
            U3dLayer — 레벨·캐시 조회; 속성 읽기: {_maxlevel, _minlevel, _cache}; 함수: {getCache()}
            U3dQuadTile — 타일 상태; 속성 읽기: {_disposed, _rlevel, _key}
            deferred — 타일 완료; 함수: {deferred()}
            UCache — 메시 저장; 함수: {add()}
        동작:
            타일이 없거나 처분되었거나 허용 레벨 밖이면 undefined를 반환한다.
            캐시가 있으면 타일로 완료한 deferred를 반환한다.
            패턴이 준비되었으면 메시를 만들고 저장한 뒤 타일로 완료한다.
            준비 전이면 패턴 완료 후 타일이 살아 있을 때 메시를 만들고 저장하여 타일로 완료하고, 처분되었으면 인수 없이 reject한다.

            타일 완료 deferred를 반환한다.

    createMesh(tile: U3dQuadTile) -> UTerrainMesh
        의존:
            UDEF — 이미지 머티리얼; 함수: {createOrSetImageLayerMaterial()}
            UTerrainMesh — 지형 메시; 생성자: {new UTerrainMesh()}; 함수: {animationOpacity()}
            U3dLayer — 출력 설정; 함수: {getRenderOrder()}; 속성 읽기: {_animation, _transparent}
            U3dObject — 레이어 이름; 속성 읽기: {_name}
        동작:
            머티리얼을 만들고 기본 map과 알파·레이어 투명 상태를 설정하며 toneMapped를 false로 설정한다.
            ownerLayer를 자신으로 전달하여 지형 메시를 만들고 출력 순서와 레이어 이름을 저장한다.
            _animation이 true이면 0.3 인수로 애니메이션을 시작한다.
            타일의 해당 데칼을 조회한다.
            데칼이 있으면 머티리얼 map을 합성한다.
            메시 updateVersion을 저장하고 메시를 반환한다.

    override disposeTile(tile: U3dQuadTile) -> boolean | undefined
        인터페이스: 공개 반환 선언은 boolean도 허용하지만 정상 해제 후 값은 반환하지 않는다. [확인 Q-005]
        의존:
            U3dLayer — 메시 캐시·그룹; 속성 읽기: {_cache, _group}
            UCache — 메시 조회·삭제; 함수: {get(), delete()}
            U3dQuadTile — 키; 함수: {getKey()}; 속성 읽기: {_key}
            LRUCache — 합성 결과 보유 확인; 함수: {has()}
            Material — 머티리얼 해제; 함수: {dispose()}
            Texture — 독립 map 해제; 함수: {dispose()}
            UPlaneBufferGeometry — geometry 공유분 반환; 함수: {dispose()}
            UGroup — 장면 제거; 함수: {remove()}
        동작:
            캐시 메시가 없으면 종료한다.
            머티리얼을 해제하고 현재 기본 텍스처도 아니고 자원 캐시도 없는 map을 해제한다.
            geometry가 있으면 공유분을 반환하고 geometry를 undefined로 설정한다.
            그룹에서 제거한 뒤 레이어·타일 키 인수로 메시 캐시를 삭제한다.

    override dispose() -> void
        의존:
            U3dImageLayer — 기반 해제; 함수: {dispose()}
            LRUCache — 사각형·합성 캐시 해제; 함수: {clear()}
            Texture — 이미지 해제; 함수: {dispose()}
            UCache — 메시 목록·제거; 함수: {items(), clear()}
            Material — 머티리얼 해제; 함수: {dispose()}
            U3dLayer — 메시 캐시; 속성 읽기: {_cache}
        동작:
            부모를 해제하고 사각형·자원 캐시를 비운다.
            합성·원본·알파 텍스처가 있으면 해제한다.
            URL별 데칼·알파 텍스처를 해제하고 저장소를 null로 설정한다.
            decalInfos를 null로 바꾸지만 개별 데칼 dispose는 호출하지 않는다.
            남은 캐시 메시 머티리얼을 해제하고 메시 캐시를 비운다.

    override addTileFromScene(tile: U3dQuadTile) -> boolean
        의존:
            U3dLayer — 캐시·그룹; 함수: {getCache()}; 속성 읽기: {_group}
            UGroup — 장면 추가; 함수: {add()}
        동작: tile.visible이 true이고 캐시 객체가 있으면 그룹에 추가하고 visible을 true로 바꿔 true를 반환하며 아니면 false를 반환한다.
    override removeTileFromScene(tile: U3dQuadTile) -> boolean
        의존:
            U3dLayer — 캐시·그룹; 함수: {getCache()}; 속성 읽기: {_group}
            UGroup — 장면 제거; 함수: {remove()}
        동작: tile.visible이 false이고 캐시 객체가 있으면 그룹에서 제거하고 visible을 false로 바꿔 true를 반환하며 아니면 false를 반환한다.

    addDecal(decalInfos: Array<DecalOption> | Array<UPatternDecal>) -> Promise<Array<UPatternDecal>>
        의존:
            deferred — 대기 상태 교체; 함수: {deferred()}
            UEventDispatcher — 데칼 추가 통지; 함수: {dispatchEvent()}
        동작:
            패턴이 대기 중이면 새 deferred로 대기자를 인계하고 이전 것을 reset하며, 아니면 새 deferred를 만든다.
            isUPatternDecal이 truthy이고 disposed가 false인 객체는 그대로 등록하고, 그 외는 decalArea가 Array인 옵션만 모은다.
            decalOptionList.length가 truthy이면 옵션으로 데칼을 만들어 기존 객체와 함께 결과 목록에 모은다.
            결과가 비었으면 빈 배열로 패턴을 완료하고 반환한다.
            등록된 전체 데칼의 미보유 이미지를 요청한다.
            요청이 없으면 각 결과 데칼을 굽고 addDecal 이벤트를 보낸 뒤 결과로 패턴을 완료한다.
            요청이 있으면 Promise.all 성공 후 같은 처리를 하고, catch에서는 이벤트 없이 결과로 패턴을 완료한다.
            현재 패턴 deferred를 반환한다.
    getDecal(name: string) -> UPatternDecal | null
        동작: falsy 이름이면 null이며 아니면 decalInfos에서 첫 이름 일치 객체를 찾아 없으면 null을 반환한다.
    getDecals() -> Array<UPatternDecal>
        동작: 목록이 없으면 빈 배열이며 아니면 등록 객체 참조를 담은 새 배열을 반환한다.
    removeDecal(patternDecal: UPatternDecal) -> boolean
        동작: falsy 객체면 false이고 아니면 첫 동일 참조를 제거하며 찾지 못해도 버전을 증가시키고 true를 반환한다.
    removeAllDecal(doDispose: boolean = false) -> boolean
        동작:
            doDispose가 true이면 등록 데칼을 각각 해제한다.
            doDispose와 무관하게 등록 목록 길이를 0으로 바꾸고 버전을 증가시켜 true를 반환한다.
    getDecalTexture(textureUrl: string) -> Texture | null | undefined
        동작: 저장소가 없으면 null이고 아니면 해당 URL 값을 그대로 반환한다.
    getDecalAlphaTexture(textureUrl: string) -> Texture | null | undefined
        동작: 알파 저장소가 없으면 null이고 아니면 해당 URL 값을 그대로 반환한다.

    #loadDecalTexture(promiseList: Array<Promise<unknown>> = []) -> Array<Promise<unknown>>
        의존:
            deferred — 로딩 완료; 함수: {deferred()}
            UTextureLoader — 이미지 요청; 함수: {load()}
            UDEF — 품질 적용; 함수: {setTextureImprovement()}
            U3dApp — 렌더러; 속성 읽기: {_renderer}
            __GError__ — 실패 통지; 함수: {__GError__()}
            U3dLayer — 앱 연결; 속성 읽기: {_app}
        동작:
            데칼이 없으면 받은 promiseList 원본 배열을 반환한다.
            URL이 없거나 이미 텍스처를 보유한 요청은 건너뛰고, 새 요청의 deferred를 원본 목록에 추가한다.
            기본 이미지 성공 시 이름·품질을 적용하고 URL별 저장소에 넣어 완료한다.
            알파 이미지 성공 시 데칼 isConvertGrayScale가 true이면 변환한 뒤 이름·품질·저장과 완료를 수행한다.

            실패 callback은 일반 함수의 실제 this로 기본 9423906 또는 알파 9425157 로그를 기록하고 오류값으로 완료한다.
            원본 목록을 반환하며 진행 중 동일 URL 요청을 따로 중복 제거하지 않는다.

    #setDecalInfos(infos: Array<DecalOption>) -> Array<UPatternDecal>
        의존:
            __GError__ — 형식·앱 오류; 함수: {__GError__()}
            __GInfo__ — 영역 점 부족; 함수: {__GInfo__()}
            U3dLayer — 앱 연결; 속성 읽기: {_app}
        동작:
            infos가 Array가 아니면 9425598 오류와 빈 배열을 반환한다.
            앱이 없으면 9425723 오류와 빈 배열을 반환한다.
            등록 목록이 없으면 빈 배열로 만든다.
            각 옵션의 decalArea가 Array가 아니면 9426050 오류 후 건너뛰고 길이가 3 미만이면 9426219 정보 후 건너뛴다.
            옵션값과 앱·레이어를 넣어 데칼을 만든다.
            같은 새 객체를 등록·결과 배열에 넣어 결과를 반환한다. [확인 Q-001]

    #getContainDecalBound(tile: U3dQuadTile) -> Array<UPatternDecal> | null
        동작:
    #setTexture(texture: UCanvasTexture | null | undefined, alphaTexture: UCanvasTexture | null | undefined) -> UCanvasTexture
        의존:
            UCanvasTexture — 합성 이미지; 생성자: {new UCanvasTexture()}
            U3dApp — 품질·렌더러; 함수: {getImproveValue()}; 속성 읽기: {_renderer}
            UDEF — 품질; 상수: {IMPROVE_TEXTURE_LEVEL.none}; 함수: {setTextureImprovement(), noResizeTexture()}
            U3dLayer — 품질 설정용 앱; 속성 읽기: {_app}
            U3dObject — 레이어 이름; 속성 읽기: {_name}
        동작:
            새 텍스처에 품질 설정 또는 noResizeTexture를 적용하고 이미지 _imageFlipY를 true로 바꾼다.
            원본 이름 또는 레이어 이름에 _texture를 붙여 반환한다.

    #createDecalTexture(decalInfos: Array<UPatternDecal>, tile: U3dQuadTile, targetMaterial: TerrainMaterial) -> void
        의존:
            Web API — 합성 바탕 캔버스; 함수: {document.createElementNS(), getContext(), drawImage()}
            UCanvasTexture — 합성 텍스처; 생성자: {new UCanvasTexture()}
            U3dQuadTile — 키; 함수: {getKey()}
            U3dApp — 품질·렌더러; 함수: {getImproveValue()}; 속성 읽기: {_renderer}
            UDEF — 품질; 상수: {IMPROVE_TEXTURE_LEVEL.none}; 함수: {setTextureImprovement(), noResizeTexture()}
            LRUCache — 합성 이력; 함수: {get(), delete(), put()}
            Texture — 이전 텍스처 해제; 함수: {dispose()}
            U3dLayer — 품질 설정용 앱; 속성 읽기: {_app}
            U3dObject — 레이어 이름; 속성 읽기: {_name}
        동작:
            데칼·타일·머티리얼이 없으면 종료하고 타일의 이미지 사각형을 구한다.
            사각형이 없으면 종료하고 기존 합성 이력을 비교한다.
            type이 none이고 texture가 있으면 map만 연결하여 종료한다.
            256 캔버스를 만들고 기존 합성 이미지가 있으면 바탕으로 사용하며 아니면 type을 all, startIndex를 0으로 바꾸고 기본 텍스처 객체 자체를 drawImage 입력으로 사용한다. [확인 Q-003]
            새 텍스처에 이름·품질을 적용하고 현재 기본 텍스처가 아닌 기존 map을 해제하여 map을 교체한다.
            기존 자원 항목에서 다른 layerTexture와 decalTexture를 해제하고 null로 바꾼 뒤 삭제한다.
            새 이력·합성 텍스처·현재 기본 텍스처를 같은 타일 키에 저장한다.

    #getTileRectangle(tile: U3dQuadTile) -> UGeoRect
        의존:
            LRUCache — 사각형 보관; 함수: {get(), put()}
            U3dQuadTile — 타일 중심·키·레벨; 속성 읽기: {_center}; 함수: {getKey(), getRealLevel()}
        동작:
            캐시 사각형이 있으면 그대로 반환한다.
            같은 사각형을 타일 키에 보관하여 반환한다.

    #checkBakeTexture(decalInfos: Array<UPatternDecal>, tile: U3dQuadTile) -> U3dPatternBakeResult
        의존:
            U3dQuadTile — 키; 함수: {getKey()}
            LRUCache — 작업 이력; 함수: {has(), get()}
        동작:
            기본 텍스처·startIndex 0·type all을 초기 결과로 사용한다.
            자원 캐시가 없거나 layerTexture가 현재 기본 텍스처와 다르면 초기 결과를 반환한다.
UPatternDecal 클래스 정의
    app: U3dApp
        좌표와 최대 레벨 제공자이다.
    layer: U3dPatternXYZLayer
        이미지와 갱신 버전 제공자이다.
    name: string
    uuid: string
        조회 이름과 작업 이력 식별자이다.
    area: Array<Vector3Like>
    _decalGoogleArea: Array<Vector3Like>
    _decalWorldArea: Array<Vector3Like>
        원본 영역·구글 좌표·월드 좌표이다.
    _localPoints: LRUCache
        의존: LRUCache — 로컬 좌표 보관; 생성자: {new LRUCache()}
    opacity: number = 1.0
    textureUrl: string | null = null
        외부 변경 가능하며 drawDecalCanvas의 기본 이미지 조회 조건으로 읽는다.
    alphaTextureUrl: string | null = null
        외부 변경 가능하며 drawDecalCanvas의 알파 이미지 조회 조건으로 읽는다.
    color: Color
    boundingBox: Box3
    minLevel: number = 15
    maxLevel: number | null | undefined = null
    version: number = 0
    disposed: boolean = false
    isConvertGrayScale: boolean = false
    decalCanvasCache: Map<number, HTMLCanvasElement> = 빈 Map
    patternStrength: number = 2
    useTexture: boolean = true
        외부 변경 가능하며 drawDecalCanvas의 기본 이미지 합성 조건으로 읽는다.
    useAlphaTexture: boolean = true
        외부 변경 가능하며 drawDecalCanvas의 알파 이미지 합성 조건으로 읽는다.
    minPatternPixel: number = 2
    isUPatternDecal: boolean = true
        공개 선언은 readonly이지만 런타임 필드 쓰기를 차단하지 않는다.

    UPatternDecal.constructor(options: UPatternDecalCO)
        인터페이스: 선언의 필수 옵션과 실제 기본값·레이어의 전달 타입에 차이가 있다. [확인 Q-001]
        의존:
            UDEF — 식별자·경로; 함수: {createUUID()}; 속성 읽기: {path}
            UDefaultSource — 기본 패턴; 상수: {PATTERN_TILE}
            defined — 설정값 존재; 함수: {defined()}
            Color — 데칼 색상; 생성자: {new Color()}
            Box3 — 영역 경계; 생성자: {new Box3()}
        동작:
            uuid를 만들고 name은 null 병합으로 uuid를 기본 사용하며 app·layer를 저장한다.
            textureUrl이 truthy이고 default이면 원본 options.textureUrl을 기본 제공 URL로 바꾼다.
            textureUrl은 null 병합으로, alphaTextureUrl은 truthy일 때 저장한다.
            defined(options.isConvertGrayScale)가 true이면 isConvertGrayScale를 저장한다.
            defined(options.useTexture)가 true이면 useTexture를 저장한다.
            defined(options.useAlphaTexture)가 true이면 useAlphaTexture를 저장한다.
            이 defined 검사는 false 값을 누락으로 취급하지 않는다.
            options.patternStrength가 truthy이면 patternStrength를 저장한다.
            options.minPatternPixel이 truthy이면 내림하여 minPatternPixel을 저장한다.
            opacity는 null 병합으로 1을 저장한다.
            options.color가 truthy이면 Color로 저장하고 falsy이면 흰색 Color를 저장한다.
            boundingBox와 _decalGoogleArea·_decalWorldArea 빈 배열을 만들고 minLevel은 15, maxLevel은 null을 기본 사용하며 area 원본 참조를 저장한다.
            영역을 변환한다.
            직접 생성에 단일 점 영역을 전달하면 변환 중 TypeError가 발생할 수 있다. 레이어 옵션 경로의 최소 세 점 검사와 구분한다.
            layer._updateVersion이 defined이면 증가시킨다.

    setColor(color: string | number) -> this
        의존: Color — 색상; 생성자: {new Color()}
        동작: falsy이면 자신을 반환하고 아니면 새 Color를 저장하고 자신을 반환한다.
    getColor() -> number
        의존: Color — 색상 정수; 함수: {getHex()}
        동작: color의 RGB 정수를 반환한다.
    setOpacity(opacity: number) -> this
        의존: MathUtils — 투명도; 정적 함수: {clamp()}
        동작: 0~1로 보정한 opacity를 저장하고 자신을 반환한다.
    getOpacity() -> number
        동작: opacity를 반환한다.
    setUseTexture(use: boolean = true) -> this
        동작: useTexture를 저장하고 자신을 반환한다.
    getUseTexture() -> boolean
        동작: useTexture를 반환한다.
    setUseAlphaTexture(use: boolean = true) -> this
        동작: useAlphaTexture를 저장하고 자신을 반환한다.
    getUseAlphaTexture() -> boolean
        동작: useAlphaTexture를 반환한다.
    setPatternStrength(patternStrength: number = 2) -> this
        동작: 보정 없이 patternStrength를 저장하고 자신을 반환한다.
    getPatternStrength() -> number
        동작: patternStrength를 반환한다.
    setMinPatternPixel(minPatternPixel: number = 2) -> this
        동작: 생성자와 달리 내림 없이 minPatternPixel을 저장하고 자신을 반환한다.
    getMinPatternPixel() -> number
        동작: minPatternPixel을 반환한다.
    commit() -> UPatternDecal
        인터페이스: 공개 반환 선언은 UPatternDecal이지만 런타임은 undefined이다. [확인 Q-004]
        의존: defined — 레이어 버전 존재; 함수: {defined()}
        동작:
            데칼 캔버스를 다시 굽는다.
            version과 defined인 layer._updateVersion을 증가시키며 값을 반환하지 않는다. [확인 Q-004]
    bakingDecalCanvas() -> void
        의존: U3dApp — 최대 레벨; 속성 읽기: {_maxlevel}
        동작:
            캔버스 캐시를 해제 호출 없이 clear한다.
            minLevel부터 maxLevel 또는 앱 최대 레벨까지 포함하여 캔버스를 구한다.
    getDecalCanvas(tileLevel: number) -> HTMLCanvasElement | undefined
        동작:
            레벨별 패턴 크기를 구한다.
            그 크기 키가 있으면 캐시 캔버스를 반환하며 아니면 새 캔버스를 같은 키에 저장하여 반환한다.
    createDecalCanvas(tileLevel: any) -> HTMLCanvasElement
        인터페이스: 기존 레벨 인수의 숫자 강제 변환을 유지하며 별도 입력 검증은 하지 않는다.
        의존:
            Web API — 캔버스; 함수: {document.createElementNS()}
        동작:
            먼저 새 캔버스를 만들고 패턴 크기를 계산하여 폭·높이를 설정한다.
    #getPatternSize(tileLevel: any) -> number
        동작:
    UPatternDecal.dispose() -> void
        의존:
            LRUCache — 좌표 캐시; 함수: {clear()}
            Web API — 캔버스 제거; 함수: {remove()}
        동작:
            disposed를 true로 바꾸고 좌표 캐시를 비운다.
            area 원본 배열과 변환 좌표 배열의 길이를 0으로 바꾼다.
            보관 캔버스마다 remove를 호출하고 캐시를 비운다.
    transArea() -> void
        동작:
            area가 없거나 비었으면 종료한다.
            기존 배열·경계를 비우지 않으므로 재호출하면 누적되며 버전·로컬 좌표 캐시는 갱신하지 않는다.
            변환 제공자 또는 영역 처리의 예외를 잡지 않으며 직접 생성의 단일 점 영역은 TypeError가 발생할 수 있다.
    getLocalPoints(tile: U3dQuadTile, tileRectangle: UGeoRect) -> Array<UGPoint>
        의존:
            U3dQuadTile — 키; 함수: {getKey()}
            LRUCache — 좌표 캐시; 함수: {has(), get(), put()}
            UGPoint — 로컬 점; 생성자: {new UGPoint()}
            UGeoRect — 이미지 좌표 변환; 함수: {MapToPoint()}
        동작:
            tile 또는 tileRectangle이 없으면 빈 배열을 반환한다.
            타일 키가 캐시에 있으면 같은 배열 참조를 반환한다.
            구글 좌표를 사각형의 이미지 좌표로 변환하여 새 배열을 만들고 캐시에 보관하여 반환한다.

```

## 4. 공통 처리 기준과 제약

```spec
레이어·데칼 setter는 설정만 변경한다. 출력 반영에는 각각 commit이 필요하다.
데칼 객체와 영역 입력 배열은 참조를 공유한다. 등록 목록·버전·색상·이미지 사용 설정은 런타임에서 외부 수정 가능하다.
타일 합성 재사용은 기본 텍스처 동일성과 데칼 순서·uuid·version에 의존한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
