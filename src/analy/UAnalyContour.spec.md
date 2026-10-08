# UAnalyContour 명세

> 상태: 구현 관찰 초안

## 1. 개요

`UAnalyContour`는 공유 HEIGHT 후처리 패스의 등고선 표시와 간격·색상·두께·투명도·거리 감쇠·고도 구간 스타일을 관리한다. 구간 스타일은 고도순으로 보관하고 패스에 전달할 텍스처로 변환한다. 화면 합성과 제외 대상 처리는 `HeightPass`가 담당한다.

앱의 기본 분석 등록과 `getAnalysis('Contour')`에서 사용하며, `tutorial-official/examples/analysisHeightLegend/analysisHeightLegend.main.js`가 스타일 설정과 표시 전환의 대표 사용처다. 클릭 높이 측정·고도 범례 스타일·제외 목록 API는 `UAnalyHeight`에서 상속하지만, `setHeightVisible()`는 등고선 표시를 제어하도록 재정의한다. 고도 색상 표시는 Height 분석에서 제어하고, 등고선 상태는 `isTopoVisible()`, 고도 색상 상태는 상속된 `isHeightVisible()`로 확인한다.

## 3. 정규 자연어 수도코드

```spec
UAnalyContourStyleEntry 부분 타입 명세
    이 명세에서 사용하는 필드:
        height: number
            구간 시작 고도
        interval: number
            구간 등고선 간격
        color: ColorRepresentation
            구간 색상이며 Color 입력은 참조로 보관한다.
        opacity?: number
            구간 투명도이며 undefined이면 1을 사용한다.

UAnalyContourCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
            분석 이름이며 undefined이면 'Contour'를 사용한다.
        isTopo?: boolean
            초기 저장 플래그이며 undefined이면 true다. 생성만으로 패스를 켜지는 않는다.
        topoInterval?: number
            기본 간격이며 undefined이면 100이다.
        topoColor?: ColorRepresentation
            기본 색상이며 undefined이면 RGB(0, 0.7, 0.7)이다.
        topoWidth?: number
            기본 선 두께이며 undefined이면 3이다.
        topoOpacity?: number
            전체 투명도이며 undefined이면 1이다.
        topoStyle?: Array<UAnalyContourStyleEntry>
            구간별 스타일 입력
        topoFadeStartDistance?: number
            감쇠 시작 카메라 거리이며 생략 또는 비유한 값이면 2000이다.
        topoFadeEndDistance?: number
            감쇠 종료 카메라 거리이며 생략 또는 비유한 값이면 80000이다.

UAnalyContourCO extends UAnalyHeightCO 부분 타입 명세
    UAnalyContourCO_Content를 합성한 생성 옵션이다. 부모 생성에는 opt를 전달하지 않는다.

UAnalyContour extends UAnalyHeight 클래스 정의
    의존: UAnalyHeight — 높이 측정·범례·제외 목록 API; 상속: {UAnalyHeight}

    name: string = 'Contour'
        분석 이름이며 외부 쓰기를 차단하지 않는다.
    _isTopo: boolean = true
        setTopo에서 보관하는 값이며 setHeightVisible은 이 값을 읽거나 변경하지 않고 전달한 visible을 사용한다.
    _topoInterval: number = 100
        표시를 켤 때 적용하는 기본 간격
    _topoColor: Color
        옵션 색상에서 생성한 별도 Color이며 기본값은 RGB(0, 0.7, 0.7)이다.
    _topoWidth: number = 3
        표시를 켤 때 적용하는 선 두께
    _topoOpacity: number = 1
        전체 투명도
    _topoStyle: Array<UAnalyContourStyleEntry> = 빈 배열
        정렬된 구간 목록이며 항목 객체는 새로 만들지만 color는 참조를 보관한다.
    _topoStyleDirty: boolean = true
        스타일 uniform 반영 필요 상태
    _topoFadeStartDistance: number = 2000
        보정한 감쇠 시작 거리
    _topoFadeEndDistance: number = 80000
        시작 거리보다 최소 1 크게 보정한 감쇠 종료 거리

    constructor(opt?: UAnalyContourCO)
        인터페이스: opt는 분석 이름과 등고선 표현 설정을 전달한다.
        의존:
            UAnalyHeight — 부모 기본 초기화; 생성자: {new UAnalyHeight()}
            defaultValue — undefined에만 기본값 적용; 함수: {defaultValue()}
            THREE.Color — 기본색과 옵션 색상 생성; 생성자: {new THREE.Color()}
            THREE.MathUtils — 전체 투명도 보정; 정적 함수: {clamp()}
        동작:
            옵션 없이 부모를 생성한 뒤 opt가 falsy이면 빈 객체로 대체한다.
            이름·사용 플래그·간격·색상·두께에 undefined 기본값을 적용하고 전체 투명도를 0~1로 clamp한다. 생성자의 투명도는 유한성 검사를 하지 않는다.
            스타일을 빈 배열과 dirty 상태로 초기화한다.
            opt.topoStyle이 truthy이면 다음을 수행한다.
                공개 설정 메서드에 옵션 스타일을 전달한다.
            시작 거리는 유한하면 0 이상으로 보정하고 아니면 2000을 사용한다.
            종료 거리는 유한 입력 또는 80000 중 선택한 값을 시작 거리 + 1 이상으로 보정한다.

    override setHeightVisible(visible: boolean) -> boolean
        역할: 공유 HEIGHT 패스에서 등고선 표시를 전환한다.
        인터페이스: 반환값은 적용 성공 여부이며, 표시할 패스가 없는 상태의 끄기도 성공으로 처리한다.
        처리 기준:
            고도 색상 uniform인 isApply는 변경하지 않는다.
            패스 부재를 이유로 로그를 출력하거나 패스 생성·비동기 대기·자동 재시도를 하지 않는다.
            표시 해제 때문에 패스나 공유 텍스처를 해제하지 않는다.
        의존:
            UAnaly — 연결 앱 참조; 속성 읽기: {_app}
            UAnalyHeight — 저장한 제외 목록을 공유 패스에 전달; 함수: {_syncExceptObjects()}
            U3dApp — 렌더러 조회; 함수: {getRenderer()}
            URenderer — 공유 패스 활성 전환; 함수: {activePass()}
            UDEF — 패스 식별자; 상수: {POSTPASS.HEIGHT}
        동작:
            visible이 boolean이 아니면 상태와 리소스를 변경하지 않고 false를 반환한다.
            현재 패스를 얻은 다음 연결 앱의 렌더러를 조회한다.
            앱 미연결·해제 후 또는 초기화 전으로 패스나 렌더러가 없으면 visible이 false일 때 true, true일 때 false를 반환한다.
            isTopo uniform에 visible을 설정한다.
            visible이 true이면 다음을 수행한다.
                저장한 간격·Color·두께·전체 투명도·감쇠 시작·종료 거리를 차례로 uniform에 기록한다.
                dirty 스타일을 패스에 반영한다.
                상속한 제외 목록 동기화에 true를 전달한다. 저장된 목록이 있으면 현재 패스에 전달하고, 비어 있으면 다른 분석이 적용한 공유 목록을 유지한다.
                HEIGHT 패스를 활성화하고 true를 반환한다.
            visible이 false이면 다음을 수행한다.
                isApply uniform이 존재하고 그 value가 falsy인 경우에만 HEIGHT 패스를 비활성화한다.
                isApply가 없거나 켜져 있으면 패스 활성 상태를 유지한다.
                제외 목록을 변경하지 않고 true를 반환한다.

    override drawHeight(val: boolean) -> void
        역할: 반환값 없는 기존 등고선 표시 호출을 호환한다.
        동작: setHeightVisible에 val을 전달하고 성공·실패 반환값을 전달하지 않는다.

    isTopoVisible() -> boolean
        인터페이스: 현재 패스의 등고선 uniform 상태이며 저장한 _isTopo나 클릭 측정 활성 상태가 아니다.
        동작: 현재 패스를 조회하여 uniforms.isTopo.value를 boolean으로 반환하고 경로가 없으면 false를 반환한다.

    setTopo(val: boolean) -> void
        동작: _isTopo에 val을 저장하고 isTopo uniform 반영을 시도한다. 렌더러의 패스 활성화는 하지 않는다.

    setTopoInterval(interval: number) -> void
        동작: 간격을 검증·보정 없이 저장하고 topoInterval uniform 반영을 시도한다.

    setTopoColor(color: ColorRepresentation) -> void
        의존: THREE.Color — 입력 색상 복사·해석; 생성자: {new THREE.Color()}
        동작: 입력으로 새 Color를 생성해 저장하고 같은 객체를 topoColor uniform에 전달한다.

    setTopoWidth(value: number) -> void
        의존: HeightPass — 선 두께 변경에 따른 texel 갱신; 함수: {updateTexelSize()}
        동작:
            현재 패스를 먼저 조회한 뒤 두께를 검증·보정 없이 저장한다.
            패스가 falsy이면 종료한다.
            패스가 truthy이면 두께 uniform을 반영한 다음 updateTexelSize를 호출한다. uniform이 없어도 texel 갱신은 호출한다.

    setTopoOpacity(opacity: number) -> void
        의존: THREE.MathUtils — 투명도 보정; 정적 함수: {clamp()}
        동작: 입력이 비유한 값이면 상태를 유지하고 종료한다. 유한 값이면 0~1로 clamp하여 저장하고 uniform에 반영한다.

    setTopoStyle(style: Array<UAnalyContourStyleEntry>) -> void
        의존:
            U3dMessage — 초과 입력 경고; 정적 함수: {warn()}
            defaultValue — 구간 투명도의 undefined 기본값; 함수: {defaultValue()}
            THREE.MathUtils — 구간 투명도 보정; 정적 함수: {clamp()}
        동작:
            입력이 배열이 아니면 상태를 유지하고 종료한다.
            유효 항목을 걸러내기 전 원본 length가 256을 초과하면 입력 개수를 포함한 'contour-style-limit' 경고를 false 옵션으로 전달하고 상태를 유지한다.
            height와 interval이 유한하고 interval > 0인 항목만 남긴다.
            각 항목의 height·interval·color와 0~1로 clamp한 opacity를 새 객체로 만들고 고도 오름차순으로 정렬하여 저장한다. opacity는 undefined일 때만 1로 대체하고 color는 검증하거나 복사하지 않는다.
            dirty를 true로 바꾸고 즉시 패스 반영을 시도한다. 빈 배열도 기존 스타일을 비우는 유효 입력이다.

    setTopoFadeDistance(startDistance: number, endDistance: number) -> void
        인터페이스: 감쇠 시작·종료의 월드 좌표 기준 카메라 거리
        동작:
            두 입력 중 하나라도 비유한 값이면 상태를 유지하고 종료한다.
            시작을 0 이상으로, 종료를 보정한 시작 + 1 이상으로 보정해 저장한다.
            시작·종료 uniform을 순서대로 반영하며 각 반영에서 현재 패스를 별도로 조회한다.

    #updateTopoStyleUniforms(pass?: any) -> void
        역할: dirty 스타일을 현재 패스에 반영하고 교체한 텍스처를 해제한다.
        의존:
            UAnaly — 연결 앱 참조; 속성 읽기: {_app}
            U3dApp — 갱신 시각 변경; 함수: {setUpdateDate()}
            DataTexture(previousTexture) — 교체한 텍스처 해제; 함수: {dispose()}
        동작:
            _topoStyleDirty가 falsy이면 종료한다.
            _topoStyleDirty가 truthy이면 다음을 수행한다.
                pass가 falsy이면 현재 패스를 조회한다.
                pass.uniforms가 falsy이면 dirty를 유지하고 종료한다.
                pass.uniforms가 truthy이면 다음을 수행한다.
                    uniforms.topoStyleCount가 truthy이면 저장한 스타일 개수를 기록한다.
                    uniforms.topoStyleData가 truthy이면 다음을 수행한다.
                        이전 texture를 읽는다.
                        반환한 texture를 uniform에 대입한다.
                        이전 texture의 dispose가 null 또는 undefined가 아니면 호출한다.
                    두 uniform이 없더라도 dirty를 false로 바꾸고 연결 앱의 setUpdateDate가 있으면 호출한다.
            texture 생성·대입·이전 texture 해제에서 발생한 예외는 그대로 전달되며 이후 dirty 해제와 갱신 요청은 수행되지 않는다.

    #getPass() -> HeightPass | undefined
        의존:
            UAnaly — 연결 앱 참조; 속성 읽기: {_app}
            U3dApp — 렌더러 조회; 함수: {getRenderer()}
            URenderer — 패스 조회; 함수: {getPass()}
            UDEF — 패스 식별자; 상수: {POSTPASS.HEIGHT}
        동작: 앱이 falsy이면 undefined를 반환하고, 아니면 현재 렌더러의 HEIGHT 패스 instance를 반환한다. 렌더러·패스가 없으면 undefined다.

    #setUniformValue(key: string, value: boolean | number | Color | DataTexture | {x: number, y: number}, pass?: any) -> void
        의존: defined — null·undefined 제외 판정; 함수: {defined()}
        동작:
            pass가 falsy이면 현재 패스를 조회한다.
            패스가 null·undefined이거나 uniforms가 falsy이면 종료한다.
            uniforms[key]가 null·undefined이 아니면 그 value에 입력을 그대로 대입한다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
