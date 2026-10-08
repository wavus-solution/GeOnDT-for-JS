# UAnalyCustomModel 명세

> 상태: 구현 관찰 초안

## 1. 개요

`UAnalyCustomModel`은 지면·객체 선택점에서 사용자 모델을 만들고, 단일 모델·그룹·메시 입력의 생성과 병합 결과의 재입력을 연결한다. 선택점·보조 선·라벨과 생성 모델 목록을 관리하며 모델 자체의 형상·스타일·해제는 각 모델 클래스에 맡긴다.

앱의 기본 분석 등록과 `activeAnalysis('CustomModel')`에서 사용한다. 대표 사용처는 `tutorial-official/examples/customModel`과 `tutorial-official/examples/customMergeModel`이며 생성·편집·병합·파라미터 저장을 연결한다.

## 3. 정규 자연어 수도코드

```spec
CustomModelEntry 타입 정의
    U3dCustomModel | U3dCustomModelGroup | U3dCustomModelMesh
    생성 목록과 조회·삭제 API가 공유하는 사용자 모델 항목

UAnalyCustomModelInput 타입 정의
    선택 속성: name·modeltype·models, vertex·uv·position·points, extrudeheight·zoffset·labeltext·center·color·opacity, rotation·scale·style, mesh·drawarg
    모델 조립의 입력 구조이며 공개 addCustomModel()의 object | Array<object> 계약을 축소하지 않는다.
    vertex는 Vector3 배열 또는 수치 ArrayLike, uv는 수치 ArrayLike, points는 GeoPosition 배열이다.
    외부 모델에 전달하는 기존 스키마의 키 이름을 보존한다.

UAnalyCustomModelSetup 타입 정의
    setRotate(rotation?: object), setScale(scale?: object), setStyle(style?: KeyValue) -> void
    실제 모델 구현이 수용하는 생략값 설정의 국소 호출 view이며 반환 모델 타입을 대체하지 않는다.

UAnalyCustomModel extends UAnaly 클래스 정의
    static OPT_KEYS: Array<string> = UAnaly.OPT_KEYS + ['name', 'lineColor3d']
        의존: UAnaly — 부모 옵션 목록; 속성 읽기: {OPT_KEYS}
        생성자 옵션의 정본 키 목록
    name: string = 'CustomModel'
        분석 이름이며 외부 쓰기가 가능하다.
    _clickId, _dblClickId: string | undefined = undefined
        앱에 등록한 클릭·더블클릭 이벤트 식별자
    _modelList: Array<CustomModelEntry> = 빈 배열
        생성 모델 목록이며 getCustomModels()로 원본을 반환한다.
    _pickList: Array<Vector3> = 빈 배열
        선택한 원본 점의 참조 목록
    _poiGroup: UGroup = 새 그룹
        선택점 표출 그룹
    _drawType: string = UDEF.CUSTOM_MODEL.DRAW.GROUND
        선택 모드이며 setDrawType()은 값을 검증하지 않는다.
    _lineColor3d: string = '#ff0000'
        생성 옵션 저장값이며 현재 선 생성·갱신에 읽히지 않는다.
    _line3D: U3dLine | undefined = 새 선
        객체 선택의 보조 선
    _vertexList3D: Array<Vector3> = 빈 배열
        보조 선의 원본 꼭짓점 참조
    _endPoint: boolean | undefined = undefined
        다음 클릭 전에 전체 clear()를 수행할지 결정하는 상태

    constructor(opt?: object)
        인터페이스: name은 분석 이름, lineColor3d는 저장할 선 색상이며 기존 linecolor3d 입력도 수용한다. 저장 색상은 현재 선 생성에 적용되지 않는다.
        의존:
            UAnaly — 기반 초기화; 생성자: {super()}
            defaultValue — undefined 기본값; 함수: {defaultValue()}
            normalizeOptionKeys — 생성자 옵션 정규화; 함수: {normalizeOptionKeys()}
            UGroup — 선택점 그룹; 생성자: {new UGroup()}
            UDEF — 기본 선택 모드; 상수: {CUSTOM_MODEL.DRAW.GROUND}
        동작:
            옵션을 부모에 전달하지 않고 기반 객체를 생성한다.
            falsy opt는 빈 객체로 대체하고 new.target의 키 목록으로 정규화한다.
            정규화에서 복사한 옵션은 원래 prototype을 이어 받는다. 정본 lineColor3d가 없고 기존 상속 linecolor3d가 있으면 그 값을 별도 view의 정본 키로 이어 준다. 원본 옵션은 수정하지 않는다.
            name·lineColor3d는 undefined일 때만 각각 'CustomModel'·'#ff0000'으로 대체한다.
            이벤트 식별자·모델·선택점 목록과 표출 그룹을 초기화하고 지면 선택 모드를 저장한다.
            보조 선을 초기화하고 선 꼭짓점 목록을 다시 비우며 _endPoint를 undefined로 둔다.

    override active() -> void
        의존:
            defined — null·undefined 판별; 함수: {defined()}
            UAnaly — 활성 상태·분석 이벤트; 함수: {prototype.active.call(), off()}; 속성 읽기: {_app}
            U3dApp — 앱 모드·선택 방식·이벤트·주석 장면; 함수: {setMode(), setPolygonMeasureType(), on(), getSceneComment()}
            UDEF — 모드; 상수: {APP_MODE._CUSTOMMODEL, CUSTOM_MODEL.DRAW.OBJECT}
            UScene — 주석 객체 등록; 함수: {add()}
        동작:
            부모 active()를 현재 객체에 적용한다.
            기존 클릭·더블클릭 식별자 중 하나라도 undefined가 아니면 분석 객체의 off()를 호출한다. 기존 앱 이벤트를 이 단계에서 unkey()하지는 않는다. [확인 Q-001]
            앱을 사용자 모델·다각형 측정 모드로 전환한다.
            현재 객체를 this로 고정한 클릭·더블클릭 함수를 앱에 등록하고 반환 식별자를 _clickId·_dblClickId에 각각 저장한다.
            선택점 그룹을 주석 장면에 추가한다.
            현재 선택 모드를 조회한다.
            선택 모드가 OBJECT인 경우:
                _line3D가 defined가 아니면:
                    새 선을 _line3D에 저장한다.
                _line3D가 truthy이면 주석 장면에 추가한다.

    override deactive() -> void
        의존:
            UAnaly — 활성 해제·표출 정리; 함수: {prototype.deactive.call(), prototype.clear.call()}; 속성 읽기: {_isActive, _app}
            U3dApp — 이벤트·측정·주석 장면; 함수: {unkey(), getMeasureLayer(), getSceneComment()}
            U3dShaderMeasureLayer — 측정 도형 정리; 함수: {clearDrawFeature()}
            UScene — 선 분리; 함수: {remove()}
        동작:
            _isActive가 truthy인 경우:
                부모 deactive()를 호출한 뒤 현재 저장된 두 앱 이벤트 식별자를 unkey()하고 undefined로 만든다.
                측정 도형과 부모 clear()의 표출을 정리한다.
                보조 선을 새로 초기화하고 _line3D가 truthy이면 새 선을 주석 장면에서 분리한다. 모델 목록·선택점 목록은 직접 비우지 않는다.
            _isActive가 falsy이면 아무 작업 없이 종료한다.

    getDrawType() -> string
        동작: 현재 _drawType을 반환한다.

    setDrawType(type: string) -> void
        동작: type을 검증·모드 전환 없이 _drawType에 저장한다.

    override clear() -> void
        의존:
            UAnaly — 하이라이트 해제; 함수: {removeAllHighlight()}; 속성 읽기: {_app}
            UGroup — 선택점 그룹 비우기; 함수: {clear()}
            U3dApp — 주석·측정 장면; 함수: {getSceneComment(), getMeasureLayer()}
            UScene — 선택점 그룹 분리; 함수: {remove()}
            U3dShaderMeasureLayer — 측정 도형 정리; 함수: {clearDrawFeature()}
        동작:
            하이라이트를 해제하고 _pickList를 새 빈 배열로 교체하며 _endPoint를 false로 설정한다.
            선택점 그룹을 비우고 주석 장면에서 분리한 뒤 측정 도형을 지운다.
            보조 선을 초기화한 다음 생성 모델을 모두 해제한다. 이벤트·활성 상태는 바꾸지 않는다.

    getParam() -> Array<object>
        의존: CustomModelEntry — 모델 파라미터 조회; 함수: {getParameter()}
        동작: 현재 모델 순서대로 getParameter()의 반환값을 새 배열에 넣어 반환한다. 반환 파라미터의 복사 여부는 모델 구현에 따른다.

    merge(name: string, meshBase: Mesh, meshes: Mesh | Array<Mesh>, useDelete?: boolean) -> object | undefined
        의존:
            defined — null·undefined 판별; 함수: {defined()}
            UDEF — 입력 확인; 함수: {assert()}
            BufferGeometry — 병합 결과 해제; 함수: {dispose()}
            Material — 병합 결과 재료 해제; 함수: {dispose()}
        동작:
            meshBase·meshes가 defined인지 assert하고 useDelete가 null 또는 undefined이면 true로 설정한다.
            defined name이 기존 모델 이름과 중복이면 오류 로그를 남기고 undefined로 종료한다.
            병합 메시를 구한다.
            결과가 defined인 경우:
                결과 geometry·단일 material을 순서대로 dispose()한 뒤 옵션을 반환한다. 원본 메시가 병합 결과인 경로에서도 같은 해제를 수행한다. [확인 Q-002]
            결과가 defined가 아니면 'merge fail!!' 오류를 던진다.

    mergeMesh(meshBase: Mesh, meshes: Mesh | Array<Mesh>, useDelete?: boolean) -> Mesh
        의존:
            defined — null·undefined 판별; 함수: {defined()}
            UDEF — 입력 확인; 함수: {assert()}
            U3dGeometryUtil — 메시 병합; 함수: {mergeByMesh()}
            Mesh — 중간 병합 결과 해제; 함수: {dispose()}
        동작:
            두 메시 입력의 defined 여부를 assert하고 null 또는 undefined인 useDelete는 true로 설정한다.
            meshes가 instanceof Array이면 원래 순서대로 meshBase와 동일한 항목을 건너뛴다.
                누적 결과가 defined가 아니면 meshBase와 해당 메시를 병합한다.
                누적 결과가 defined이면 누적 결과와 해당 메시를 먼저 병합하고 이전 결과를 dispose()한 뒤 새 결과를 저장한다.
            배열이 아닌 instanceof Object이면 meshBase와 다른 경우에만 한 번 병합한다. 그 밖에는 assert(false)를 호출한다.
            병합 결과가 falsy이면 meshBase를 그대로 반환하며 삭제를 하지 않는다.
            병합 결과가 truthy이고 useDelete가 truthy인 경우:
                입력 메시의 원래 순서대로 meshBase 이외의 모델을 삭제하고 마지막에 meshBase의 모델을 삭제한다.
            병합 결과를 반환한다.

    addCustomModel(option: object | Array<object>) -> Array<CustomModelEntry>
        의존:
            defined — null·undefined 판별; 함수: {defined()}
            UDEF — 파싱 결과 확인; 함수: {assert()}
        동작:
            반환할 빈 모델 배열을 만든다.
            option이 defined인 경우:
                instanceof Array이면 각 항목 opt의 name을 확인한다.
                    opt.name이 defined인 경우:
                        기존 목록과 이름이 중복이면 해당 인덱스·이름을 오류 로그로 남기고 나머지 처리를 중단한다. 이미 생성한 모델은 남는다.
                    opt.name이 defined가 아니면 오류 로그를 남기고 그 항목만 건너뛴다.
                    건너뛰지 않는 항목은 파싱하고 결과가 defined인지 assert하여 truthy 결과를 반환 목록에 추가한다.
                배열이 아닌 instanceof Object인 경우:
                    name이 defined가 아니면 오류 로그 후 빈 배열을 반환한다.
                    그 다음 이름 중복을 조회하여 중복이면 오류 로그 후 빈 배열을 반환한다.
                    검사를 통과한 단일 옵션을 파싱·assert하여 결과를 반환 목록에 넣는다.
            반환 목록을 반환한다. 다른 입력과 defined가 아닌 입력은 빈 배열이며, 예외를 잡거나 이미 생성한 항목을 롤백하지 않는다.

    isExistModelName(name: string) -> boolean
        의존: CustomModelEntry — 최상위 모델 이름; 함수: {getName()}
        동작: 최상위 목록에서 getName()이 name과 엄격히 같은 항목이 있으면 true, 없으면 false를 반환한다.

    isPolygon() -> void
        동작: 아무 작업 없이 undefined로 종료한다.

    addModel(option: object) -> void
        인터페이스: point는 좌표 목록, buldheight는 Number()로 변환할 깊이, landheight는 모델 높이 옵션이다. name·labeltext는 선택 입력이다.
        의존:
            UAnaly — 기반 실행 상태·화면 갱신 요청; 함수: {update()}; 속성 읽기: {_drawArg, _scene}
            makeShape — 선택점 형상 조립; 함수: {makeShape()}
            U3dApp — 점 변환; 함수: {geographicToVector3()}
            U3dCustomModel — 모델 생성; 생성자: {new U3dCustomModel()}
            Guid — falsy 이름 대체; 함수: {Guid()}
            UScene — 모델 등록; 함수: {add()}
        동작:
            option.point의 각 점을 앱 좌표 변환으로 _pickList의 기존 내용 뒤에 추가한다.
            누적 선택점으로 shape을 만들고 steps=1, Number(buldheight) 깊이, bevelEnabled=true, bevelThickness·bevelSize·bevelOffset=0, bevelSegments=1인 extrudeSettings를 만든다.
            truthy name 또는 Guid() 문자열, shape·drawarg·landheight·원본 _pickList와 truthy labeltext 또는 원래 name으로 모델을 생성한다.
            생성 모델을 목록·장면에 등록한 직후 clear()를 호출하여 이 모델을 포함한 목록을 해제·교체하고 update()를 요청한다. [확인 Q-003]

    getCustomModels() -> Array<CustomModelEntry>
        동작: _modelList의 원본 배열을 반환한다. 호출자의 배열 변경은 후속 조회·삭제에 반영된다.

    getModelByName(name: string) -> CustomModelEntry | undefined
        의존: U3dCustomModelGroup — 그룹 판별·자식 이름; 함수: {instanceof}; 속성 읽기: {_customModels, _customModels._name}
        동작:
            목록을 순서대로 검색한다.
            그룹 및 그 하위 인스턴스는 자식의 _name이 엄격히 같을 때 그룹 자체를 반환하며 그룹 자신의 이름은 비교하지 않는다.
            그 밖에는 항목의 _name을 비교한다. 첫 일치 항목 또는 undefined를 반환한다.

    getModelByUid(uid: string) -> CustomModelEntry | undefined
        의존: CustomModelEntry — 식별자 조회; 함수: {getUid()}
        동작: 입력과 각 getUid() 결과를 각각 String()으로 변환하여 첫 일치 항목을 반환하며 없으면 undefined다.

    removeAll() -> void
        의존: CustomModelEntry — 항목 해제; 함수: {dispose()}
        동작: 원본 목록을 for-of로 순회하며 각 모델을 dispose()하고, 모두 정상 종료하면 _modelList를 새 빈 배열로 교체한다. 예외가 나면 교체를 실행하지 않는다.

    showLabel(visible: boolean) -> void
        의존:
            defined — null·undefined 판별; 함수: {defined()}
            UAnaly — 기반 실행 상태; 속성 읽기: {_drawArg, _scene}
            UDEF — 앱 연결 확인; 함수: {assert()}
            Object3D — 장면 자식 순회; 함수: {traverse()}
            Mesh — 메시 판별; 함수: {instanceof}
            U3dApp — 주석 장면·데이터 갱신; 함수: {getSceneComment(), updateData()}
            UScene — 라벨 등록·분리; 함수: {add(), remove()}
        동작:
            drawArg와 drawArg._app의 defined 여부를 assert한다.
            _scene이 defined이면 현재 children을 인덱스로 순회하며 defined 자식의 전체 하위 객체를 traverse()한다.
                Mesh 및 하위 인스턴스의 userData.label이 defined이면 visible의 truthiness에 따라 주석 장면에 추가하거나 분리한다.
            라벨을 하나라도 찾았으면 updateData()를 한 번 호출한다. 주석 장면이 없어도 찾은 라벨 수는 증가한다.

    removeModelByUid(uid: string) -> boolean
        의존:
            defined — null·undefined 판별; 함수: {defined()}
            CustomModelEntry — 식별자·해제; 함수: {getUid(), dispose()}
        동작:
            getUid() 결과가 입력 uid와 엄격히 같은 첫 항목을 찾는다. getModelByUid()와 달리 문자열로 변환하지 않는다.
            없으면 false를 반환한다. 원본 목록에서 index가 0 이상이면 dispose() 후 splice()하여 true를 반환하며, 그렇지 않으면 false다.

    removeModel(model: CustomModelEntry) -> void
        의존: CustomModelEntry — 식별자·해제; 함수: {getUid(), dispose()}
        동작: model의 uid로 목록 삭제를 시도하고 false일 때만 입력 model을 직접 dispose()한다.

    removeModelByMesh(mesh: Mesh) -> void
        동작:
            목록 순서대로 _object가 truthy인 모델의 직접 children만 비교한다.
            같은 mesh를 찾으면 해당 모델을 삭제하고 종료한다. 중첩 자손은 검색하지 않는다.

    #initLine3D() -> U3dLine
        의존:
            UAnaly — 기반 실행 상태; 속성 읽기: {_app}
            U3dApp — 주석 장면; 함수: {getSceneComment()}
            UScene — 기존 선 분리; 함수: {remove()}
            BufferGeometry — 기존 선 형상 해제; 함수: {dispose()}
            Material — 기존 선 재료 해제; 함수: {dispose()}
            U3dLine — 빈 선 생성; 생성자: {new U3dLine()}
        동작:
            _vertexList3D를 새 빈 배열로 교체한다.
            기존 _line3D가 truthy이면 앱이 truthy일 때 주석 장면에서 분리하고 geometry·단일 material을 해제한다.
            새 빈 U3dLine을 _line3D에 저장하여 반환한다.

    #updateLine3D(array: Array<Vector3>) -> void
        의존:
            defined — null·undefined 판별; 함수: {defined()}
            UAnaly — 기반 실행 상태; 속성 읽기: {_app}
            U3dApp — 주석 장면; 함수: {getSceneComment()}
            UScene — 선 분리·등록; 함수: {remove(), add()}
            BufferGeometry — 이전 형상 해제; 함수: {dispose()}
            Material — 이전 재료 해제; 함수: {dispose()}
            U3dLine — 폐합 선; 생성자: {new U3dLine()}; 함수: {updateVertex()}; 속성 쓰기: {_vertices}
        동작:
            기존 선이 truthy이면 주석 장면에서 분리하고 geometry·재료를 해제한다.
            새 선에 defined array의 원본 점 참조를 순서대로 넣고 array[0]을 한 번 더 넣어 폐합한 뒤 updateVertex()를 호출한다. 빈 배열이면 undefined 점도 넣는다.
            _line3D를 새 선으로 교체하고 주석 장면에 추가한다. 중간 예외를 복구하지 않는다.

    #addPositionLine3D(pos: Vector3) -> void
        의존: defined — 보조 선의 null·undefined 판별; 함수: {defined()}
        동작:
            _line3D가 null 또는 undefined이면 'line3d is error!'를 던지고 점을 추가하지 않는다.
            입력 pos의 원본 참조를 _vertexList3D 끝에 추가한다.
            누적한 꼭짓점 목록을 전달하여 보조 선을 다시 구성한다.

    #clearLine3D() -> void
        의존: defined — 선의 null·undefined 판별; 함수: {defined()}
        동작:
            _line3D가 defined가 아니면 'line3d is error!'를 던진다.
            선을 초기화한다.

    #click(e: U3dMouseEvent) -> void
        의존:
            defined — null·undefined 판별; 함수: {defined()}
            UAnaly — 기반 실행 상태; 속성 읽기: {_drawArg, _app}
            U3dApp — 측정·교차·주석 장면; 함수: {getMeasureLayer(), intersectAtPixel(), getSceneComment()}
            UDEF — 선택 방식·진단; 상수: {CUSTOM_MODEL.DRAW.GROUND, CUSTOM_MODEL.DRAW.OBJECT}; 속성 읽기: {debug}
            U3dBilboard — 선택점 표시; 정적 함수: {makeBilboard()}
            UGroup — 표시 객체 등록; 함수: {add()}
            UScene — 표시 그룹 등록; 함수: {add()}
            UDrawArg — 선택점 좌표 변환; 함수: {getWorldToGeographic()}
            U3dShaderMeasureLayer — 지면 측정점 추가; 함수: {addMeasurePoint()}
        동작:
            선택 모드·drawArg·그 앱·측정 레이어를 먼저 조회한다.
            _endPoint가 truthy이면 clear()하고 false를 저장한다.
            GROUND이면 intersectAtPixel(e, true), OBJECT이면 intersectAtPixel(e, false, true)를 호출하고 다른 모드이면 'type is error'를 던진다.
            첫 교차점이 있으면 그 원본 point의 z가 isNaN()이거나 0 미만일 때 원본 z를 0으로 변경한다.
            point가 defined가 아니면 debug일 때 'picking is null'을 기록하고 종료한다.
            원본 point를 위치로 하는 'click' 표시를 그룹·주석 장면에 추가한다.
            원본 point를 _pickList에 넣고 XY를 변환한 좌표를 GROUND의 측정 레이어에 추가한다.
            OBJECT이면 원본 point를 전달하여 보조 선의 꼭짓점 목록에 추가하고 선을 갱신한다.

    #dblClick() -> void
        의존:
            UAnaly — 기반 실행 상태; 속성 읽기: {_app}
            UGroup — 선택점 표시 비우기; 함수: {clear()}
            U3dApp — 측정 레이어; 함수: {getMeasureLayer()}
            U3dShaderMeasureLayer — 도형 정리; 함수: {clearDrawFeature()}
        동작: 선택점 표시와 측정 도형을 비우고 선을 초기화한다. _pickList와 생성 모델은 그대로 둔다.

    #getOptionType(option: any, check?: boolean) -> string | false
        의존:
            defined — null·undefined 판별; 함수: {defined()}
            UDEF — 모델 종류; 상수: {CUSTOM_MODEL.TYPE.GROUP, CUSTOM_MODEL.TYPE.GEOMETRY, CUSTOM_MODEL.TYPE.EXTRUDE}
        동작:
            GROUP 조건을 판별하여 참이면 GROUP을 반환한다.
            그렇지 않고 modeltype이 GEOMETRY이며 vertex·uv·position·extrudeheight가 모두 defined이면 GEOMETRY를 반환한다.
            그렇지 않고 modeltype이 EXTRUDE이면 EXTRUDE를 반환한다.
            check가 null 또는 undefined이면 false로 설정한다. check가 falsy이면 'not supported!!'를 던지고 truthy이면 false를 반환한다.

    #parseCustomModel(option: any) -> CustomModelEntry | undefined
        의존:
            defined — null·undefined 판별; 함수: {defined()}
            UDEF — 생성 경로; 상수: {CUSTOM_MODEL.TYPE.GROUP, CUSTOM_MODEL.TYPE.GEOMETRY, CUSTOM_MODEL.TYPE.EXTRUDE}
        동작:
            Array.isArray(option)이면 undefined로 종료한다.
            check=true로 종류를 검사하여 false이면 원본 option.modeltype을 EXTRUDE로 변경한다. 이후 다시 종류를 판정한다.
            GROUP이면 그룹 생성 결과를 반환한다.
            그 밖에는 defined modeltype 또는 EXTRUDE를 선택해 GEOMETRY이면 메시 생성, 그 외에는 돌출 모델 생성 결과를 반환한다.

    #addCustomModelGrouping_(options: any) -> U3dCustomModelGroup
        의존:
            defined — null·undefined 판별; 함수: {defined()}
            UAnaly — 기반 실행 상태; 속성 읽기: {_drawArg, _scene}
            U3dCustomModelGroup — 그룹 생성·항목 연결; 생성자: {new U3dCustomModelGroup()}; 함수: {addCustomModel()}
            UDEF — 그룹 종류·생성 선택; 상수: {CUSTOM_MODEL.TYPE.GROUP, CUSTOM_MODEL.TYPE.GEOMETRY, CUSTOM_MODEL.TYPE.EXTRUDE}
            CustomModelEntry — 자식 간 변경 연결; 함수: {addChangeEvent()}
            UGroup — 그룹 자식 등록; 함수: {add()}
            UScene — 그룹 장면 등록; 함수: {add()}
        동작:
            options.name·현재 drawArg·GROUP 종류로 그룹을 생성한다.
            펼친 각 항목마다 options.modeltype이 defined이면 그 상위 값을, 아니면 EXTRUDE를 사용한다.
            상위 값이 GEOMETRY이면 메시 모델, 그 밖에는 돌출 모델을 add=false로 생성해 그룹 객체에 넣는다. 유효 GROUP 입력에서는 자식의 modeltype과 무관하게 돌출 생성 경로가 선택된다. [확인 Q-004]
            자식마다 다른 모든 자식에 addChangeEvent()를 순서대로 연결한다. 같은 객체 자신과는 연결하지 않는다.
            그룹에 자식 목록을 전달하고 최상위 목록·장면에 그룹을 등록하여 반환한다. 직접 update()는 호출하지 않는다.

    #addCustomModelMeshByObject_(option: any, add?: boolean) -> U3dCustomModelMesh
        의존:
            defined — null·undefined 판별; 함수: {defined()}
            UAnaly — 기반 실행 상태·화면 갱신; 함수: {update()}; 속성 읽기: {_drawArg, _scene}
            UScene — 모델 장면 등록; 함수: {add()}
        동작:
            null 또는 undefined인 add를 true로 설정하고 현재 drawArg를 가져온다.
            add가 truthy이면 최상위 목록·장면에 추가하고 update()한다. 생성 모델을 반환한다.

    #addCustomModel_(option: any, add?: boolean) -> U3dCustomModel
        의존:
            defined — null·undefined 판별; 함수: {defined()}
            UAnaly — 기반 실행 상태·화면 갱신; 함수: {update()}; 속성 읽기: {_drawArg, _scene, _app}
            makeShape — 선택점 형상 조립; 함수: {makeShape()}
            U3dApp — 점 변환·측정 레이어; 함수: {vector3ToGeoGraphic(), geographicToVector3(), getMeasureLayer()}
            U3dShaderMeasureLayer — 현재 측정 면적; 함수: {getMeasureArea()}
            UScene — 모델 장면 등록; 함수: {add()}
        동작:
            null 또는 undefined인 add는 true로 설정하고 현재 drawArg를 먼저 가져온다.
            option.vertex가 defined이면 그 원본을 shape 입력으로 사용하고 각 점을 앱의 vector3ToGeoGraphic()으로 변환한 새 points 배열을 만든다.
            그렇지 않으면 option.points의 각 점을 geographicToVector3()으로 변환한 새 shape 입력을 만들고 points에는 원본 option.points를 사용한다.
            shape을 만들고 현재 측정 레이어의 면적을 조회한다.
            add가 truthy인 경우:
                최상위 목록·장면에 추가한 뒤 update()한다.
            생성 모델을 반환한다.

isGroupingParam(option: any) -> boolean
    의존:
        defined — 그룹 조건의 null·undefined 판별; 함수: {defined()}
        UDEF — 그룹 종류; 상수: {CUSTOM_MODEL.TYPE.GROUP}
    동작: modeltype이 defined이고 GROUP과 엄격히 같으며 models가 defined이고 Array.isArray()가 참일 때만 true, 그 밖에는 false를 반환한다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
