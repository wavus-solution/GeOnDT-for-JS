# UGroupBoundaryHelper 명세

> 상태: 정규

## 1. 개요

### 1.1 목적과 의미

`UGroupBoundaryHelper`는 `THREE.Group`의 직접 자식, `THREE.Object3D` 배열 또는 `getVectorPosition()`을 제공하는 component 배열의 각 원소를 논리 객체로 보고, 객체들의 월드 원점 분포를 반투명한 닫힌 3D 경계와 외곽선으로 표시한다.

### 1.2 책임 범위

- 논리 객체의 월드 원점을 수집하고 객체 identity별 위치 오차를 완화한다.
- 연결 거리와 히스테리시스를 적용한 지속 골격과 연결 컴포넌트를 계산한다.
- 컴포넌트별 상면·측면·하면·외곽선 geometry를 계산한다.
- 네 렌더 객체, material, 이중 geometry bank와 반복 계산 작업 공간을 소유한다.
- 대상, 기하 옵션, 본체·외곽선 스타일과 렌더 순서 변경 API를 제공한다.

책임 경계: helper는 자신을 Scene에 추가하거나 제거하지 않고 대상 객체의 transform, animation, geometry와 material을 변경하지 않는다. 생성과 update()는 대상 및 helper 부모의 현재 matrixWorld를 읽으며 행렬 갱신은 대상 제어부가 먼저 완료한다. 외부에서 updateWorldMatrix()의 updateParents를 명시한 경우에만 helper 부모의 갱신을 요청한다. 별도 렌더 패스나 대상 객체의 공통 강체 변환도 요구하지 않는다.

### 1.3 주요 동작 방식

객체 identity별 지속 위치와 직전 성공 연결 이력을 이용해 골격을 만든다. 양의 `bufferSize`에서는 골격의 XY 외곽을 만든 뒤 기본 `plane` 방식의 평행 상·하면 또는 `skeleton` 방식의 고도 추종 상·하면과 측면을 구성한다. `bufferSize`가 0이면 3D convex hull을 구성한다. 위치와 기하 옵션이 바뀌지 않으면 계산을 생략하고, 변경 시에는 비활성 geometry bank 전체가 유효한 경우에만 렌더 결과와 성공 이력을 교체한다.

관찰된 실행 특성: 사용자는 렌더 직전 callback에서 `update()`를 반복 호출할 수 있으며, 작업 공간과 geometry attribute는 관측된 최대 용량까지 재사용된다.

### 1.4 주요 사용처와 연계 대상

- `UGroup` 또는 일반 `Object3D` 대형의 경계 표시
- 일반 component와 instanced component 배열의 경계 표시
- `U3dApp.setRenderBefore()`를 이용한 이동 객체의 렌더 직전 갱신
- 호출자가 선택한 `Scene` 또는 `app.getExternalScene()`의 렌더 객체

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
대상은 UGroup을 포함한 THREE.Group 또는 THREE.Object3D와 UGroupBoundaryPositionSource로 구성한 배열이어야 한다.
Group은 직접 자식 하나를, 배열은 원소 하나를 논리 객체 하나로 사용해야 한다.
같은 객체 identity가 배열에 반복되면 한 번만 수집하고 같은 위치의 서로 다른 identity는 별도 객체로 유지해야 한다.
Object3D 위치는 geometry 정점이나 bounding volume이 아니라 matrixWorld translation이어야 한다.
생성·update()와 이를 호출하는 setter는 대상 및 조상의 행렬과 갱신 표시를 변경하지 않고 대상 제어부가 준비한 현재 월드 좌표를 사용해야 한다.
getVectorPosition()을 제공하는 component는 일반·instanced 여부와 관계없이 반환한 유한한 월드 XYZ를 사용해야 한다.
height는 0보다 큰 유한한 수이고 각 객체 원점 아래·위에 절반씩 적용하는 전체 수직 높이여야 한다.
bufferSize, connectionDistance와 positionTolerance는 0 이상의 유한한 수여야 한다.
bufferSize의 기본값은 5이고 지속 골격 바깥의 XY 여유에만 사용해야 한다.
connectionDistance의 기본값은 20이고 같은 경계로 연결할 새 골격 간선의 3D 공간 거리여야 한다.
positionTolerance의 기본값은 1이고 위치 필터의 공간 기준과 기존 간선 제거의 히스테리시스 폭이어야 한다.
surfaceMode는 plane 또는 skeleton이어야 하고 기본값은 plane이어야 한다.
surfaceMode는 양의 bufferSize에서 Z 배치만 바꾸고 XY 외곽·삼각분할·material 구성을 바꾸지 않아야 한다.
positionTolerance가 0이면 관측 위치를 그대로 사용하고 양수이면 실제 경과 시간을 반영한 동일 alpha로 각 객체를 독립 추종해야 한다.
새 골격 간선은 connectionDistance 이내에서 만들고 직전 성공 간선은 connectionDistance + positionTolerance를 넘을 때 제거해야 한다.
직접 또는 연쇄적으로 연결되지 않은 위치 묶음은 독립된 닫힌 경계로 분리하고 다시 가까워지면 합쳐야 한다.
bufferSize 변경은 연결 판정을 바꾸지 않고 connectionDistance 변경은 이전 임계값의 골격·삼각분할 이력을 초기화해야 한다.
양의 bufferSize에서는 V·X형 같은 가지 분포의 오목한 영역을 전체 볼록껍질로 메우지 않아야 한다.
plane 방식의 상면과 하면은 각각 하나의 평면이며 모든 객체의 Z + height / 2와 Z - height / 2를 포함해야 한다.
skeleton 방식의 상면과 하면은 각 외곽점의 최근접 골격 고도를 기준으로 height / 2를 위·아래에 적용해야 한다.
상면·측면·하면은 같은 원본 contour edge를 공유하는 닫힌 체적이고 모든 triangle은 바깥쪽 winding과 양의 유효 면적을 가져야 한다.
상부와 하부 contour를 각각 한 폐곡선으로 표시하고 내부 삼각분할 edge는 외곽선으로 표시하지 않아야 한다.
renderOrder를 생략해 성공적으로 생성한 첫 helper의 기준 순서는 50이고 이후 생략 생성마다 기준 순서를 1씩 높여야 한다.
사용자가 renderOrder를 명시한 생성, 생성 실패와 생성 후 setRenderOrder() 호출은 다음 자동 기준 순서를 증가시키지 않아야 한다.
사용자가 기준 renderOrder를 바꾸면 상면·측면·하면·외곽선의 +0, +1, +2, +3 간격을 유지해야 한다.
대상이나 기하 옵션 setter는 입력을 검증하고 필요한 이력을 초기화한 뒤 즉시 update()해야 한다.
스타일과 renderOrder setter는 geometry를 다시 계산하지 않아야 한다.
유효 논리 객체가 없거나 어떤 컴포넌트도 체적을 만들 수 없으면 helper를 숨겨야 한다.
공개 update()에서 계산 오류가 발생하면 __GError__로 원인을 한 번 기록하고 같은 오류 객체를 다시 전달해야 한다.
```

### 2.2 성능 및 품질 요구사항

```spec
실행 맥락: 독립적으로 움직이는 논리 객체를 따라 사용자가 update()를 매 렌더 프레임 호출할 수 있다.
우선순위: 현재 월드 위치와 닫힌 형상 정확성을 유지하면서 전체 계산 횟수, 임시 할당과 GPU 자원 교체를 최소화한다.
제한 조건: helper는 대상 객체 이동을 보정하거나 별도 렌더 패스·공통 강체 변환을 요구하지 않는다.
재사용 기준: identity Set, 위치·골격·union-find·JSTS 입력 pool, contour·삼각분할·surface 배열과 geometry attribute는 관측된 최대 입력에 맞춰 재사용해야 한다.
상태 기준: 직전 성공 골격과 삼각분할 이력은 다음 성공 결과에 필요한 항목만 활성 상태로 취급하고 실패한 계산은 활성 geometry와 직전 성공 이력을 바꾸지 않아야 한다.
자원 기준: helper가 만든 geometry와 material은 dispose()에서 한 번씩 해제하고 대상·pool·이력의 강한 참조를 제거해야 한다.
검증 기준: 준비 후 고정된 입력 상한에서 JS heap과 렌더 자원 수가 update 누적 횟수에 따라 단조 증가하지 않는지 장시간 환경에서 확인해야 한다.
```

## 3. 정규 자연어 수도코드

```spec
UGroupBoundaryPositionSource 부분 타입 명세
    이 명세에서 사용하는 필드:
        getVectorPosition() -> Vector3Like
            일반 또는 instanced component의 현재 3D 월드 좌표를 제공한다.

UGroupBoundaryTarget 타입 정의
    Group | Array<Object3D | UGroupBoundaryPositionSource>

UGroupBoundarySurfaceMode 타입 정의
    'plane' | 'skeleton'

UGroupBoundaryHelperOutlineStyle 부분 타입 명세
    이 명세에서 사용하는 필드:
        visible?: boolean = true
        color?: ColorRepresentation = 0x00ffff
        opacity?: number = 1
        lineWidth?: number = 2
        worldUnits?: boolean = false
        dashed?: boolean = true
        dashSize?: number = 10
        gapSize?: number = 6

UGroupBoundaryHelperCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        height: number
        bufferSize?: number = 5
        connectionDistance?: number = 20
        positionTolerance?: number = 1
        surfaceMode?: UGroupBoundarySurfaceMode = 'plane'
        color?: ColorRepresentation = 0x00ffff
        opacity?: number = 0.2
        renderOrder?: number
            생략하면 성공한 helper 생성 순서에 따라 50부터 1씩 증가하는 상면 기준 순서를 사용한다.
        outline?: UGroupBoundaryHelperOutlineStyle | false
        name?: string = 'UGroupBoundaryHelper'

UGroupBoundaryHelper extends Mesh 클래스 정의
    의존: Mesh — 상면 렌더 객체와 자식 렌더 객체 소유; 상속: {Mesh}; 함수: {add(), remove(), updateMatrixWorld(), updateWorldMatrix()}; 속성 읽기·쓰기: {geometry, material, matrix, matrixWorldNeedsUpdate, name, parent, position, quaternion, renderOrder, scale, type, visible}

    constructor(target: UGroupBoundaryTarget, options: UGroupBoundaryHelperCO)
        역할: 렌더 자원과 계산 작업 공간을 만들고 최초 경계를 완전하게 초기화한다.
        처리 기준:
            필수 입력과 옵션은 자원을 만들기 전에 검증한다.
            생성 도중 실패하면 이미 만든 소유 자원을 해제하고 원래 오류를 전달한다.
        의존:
            MeshBasicMaterial — 상면·측면·하면의 독립 material; 생성자: {new MeshBasicMaterial()}; 함수: {clone()}
            LineMaterial — 외곽선 material; 생성자: {new LineMaterial()}
            LineSegments2 — 외곽선 렌더 객체; 생성자: {new LineSegments2()}
            Mesh — 측면·하면 렌더 객체; 생성자: {new Mesh()}
        동작:
            대상과 옵션을 검증하고 기본값을 포함한 기하·스타일·렌더 순서를 확정한다.
            두 geometry bank와 인스턴스별 계산 작업 공간을 만든다.
            독립된 상면·측면·하면 material과 외곽선 material을 만들고 네 렌더 객체를 구성한다.
            기준 렌더 순서와 +1·+2·+3 자식 순서를 적용한다.
            대상과 기하 옵션을 저장하고 측면·하면·외곽선을 자식으로 연결한다.
            최초 경계를 계산한다.
            최초 계산이 실패하면 소유 자원을 해제하고 같은 오류를 전달한다.
            renderOrder를 생략한 성공 생성이면 다음 자동 기준 순서를 1 높인다.

    update() -> UGroupBoundaryHelper
        역할: 현재 논리 객체 위치로 경계 geometry와 helper 배치를 갱신한다.
        처리 기준:
            dispose되었거나 대상이 없으면 변경하지 않고 자신을 반환한다.
            위치와 기하 옵션 snapshot이 같으면 geometry 계산을 생략한다.
        의존: __GError__ — 공개 API 경계의 계산 오류 기록; 함수: {__GError__()}
        동작:
            대상의 원시 월드 위치를 수집하고 객체별 지속 위치를 계산한다.
            유효 위치가 있으면 평균 XY와 최저 Z를 helper의 월드 기준점으로 적용한다.
            snapshot이 같으면 현재 결과를 반환한다.
            유효 위치가 없으면 helper를 숨기고 현재 무출력 상태를 snapshot으로 확정한다.
            변경된 입력은 비활성 geometry bank에 전체 경계를 준비한다.
            유효한 체적이 없으면 helper를 숨기고 무출력 상태를 확정한다.
            준비가 성공하면 네 geometry 참조와 활성 bank를 함께 교체하고 helper를 표시한 뒤 snapshot을 확정한다.
            계산이 실패하면 helper를 숨기고 snapshot을 무효화하며 __GError__로 원인을 기록한 뒤 같은 오류를 전달한다.

    setTarget(target: UGroupBoundaryTarget) -> UGroupBoundaryHelper
        처리 기준: dispose된 helper에는 변경을 수행하지 않는다.
        동작:
            새 대상을 검증하여 저장하고 이전 객체의 지속 위치·골격·삼각분할 이력을 초기화한다.
            snapshot을 무효화하고 즉시 갱신 결과를 반환한다.

    기하 옵션 변경 책임 그룹
        역할: 경계 계산 옵션을 검증하여 저장하고 현재 대상으로 즉시 다시 계산한다.

        setBufferSize(bufferSize: number) -> UGroupBoundaryHelper
            처리 기준: dispose된 helper에는 변경을 수행하지 않는다.
            동작:
                0 이상의 XY buffer 거리를 검증하여 저장한다.
                즉시 갱신 결과를 반환한다.

        getConnectionDistance() -> number
            동작: 현재 3D 공간 연결 거리 속성을 반환한다.

        setConnectionDistance(connectionDistance: number) -> UGroupBoundaryHelper
            처리 기준: dispose된 helper에는 변경을 수행하지 않는다.
            동작:
                0 이상의 연결 거리를 검증하여 저장하고 이전 임계값의 골격·삼각분할 이력을 초기화한다.
                snapshot을 무효화하고 즉시 갱신 결과를 반환한다.

        getPositionTolerance() -> number
            동작: 현재 위치 완화·연결 히스테리시스 거리 속성을 반환한다.

        setPositionTolerance(positionTolerance: number) -> UGroupBoundaryHelper
            처리 기준: dispose된 helper에는 변경을 수행하지 않는다.
            동작:
                0 이상의 위치 완화 기준을 검증하여 저장하고 지속 위치·골격·삼각분할 이력을 초기화한다.
                snapshot을 무효화하고 즉시 갱신 결과를 반환한다.

        getSurfaceMode() -> UGroupBoundarySurfaceMode
            동작: 현재 양의 buffer 경계의 상·하면 Z 배치 방식 속성을 반환한다.

        setSurfaceMode(surfaceMode: UGroupBoundarySurfaceMode) -> UGroupBoundaryHelper
            처리 기준: dispose된 helper에는 변경을 수행하지 않는다.
            동작:
                plane 또는 skeleton을 검증하여 저장한다.
                즉시 갱신 결과를 반환한다.

        setHeight(height: number) -> UGroupBoundaryHelper
            처리 기준: dispose된 helper에는 변경을 수행하지 않는다.
            동작:
                상·하 절반을 Float32로 구분할 수 있는 양의 전체 높이를 검증하여 저장한다.
                즉시 갱신 결과를 반환한다.

    렌더 스타일 변경 책임 그룹
        역할: geometry를 다시 계산하지 않고 소유 material과 렌더 순서를 변경한다.

        setColor(color: ColorRepresentation) -> UGroupBoundaryHelper
            처리 기준: dispose된 helper에는 변경을 수행하지 않는다.
            의존: Color — 세 surface material의 색상 변경; 함수: {set()}
            동작:
                상면·측면·하면 material에 같은 색상을 적용한다.
                현재 helper를 반환한다.

        setOpacity(opacity: number) -> UGroupBoundaryHelper
            처리 기준:
                dispose된 helper에는 변경을 수행하지 않는다.
                opacity는 0 이상 1 이하여야 한다.
            의존: MeshBasicMaterial — 세 surface material의 투명도 상태 변경; 속성 읽기·쓰기: {needsUpdate, opacity, transparent}
            동작:
                상면·측면·하면 material에 같은 opacity와 transparent 상태를 적용한다.
                현재 helper를 반환한다.

        setOutlineStyle(style: UGroupBoundaryHelperOutlineStyle = {}) -> UGroupBoundaryHelper
            처리 기준:
                dispose된 helper에는 변경을 수행하지 않는다.
                전달한 속성만 변경하고 각 값의 공개 허용 범위를 검증한다.
            의존:
                Color — 외곽선 색상 변경; 함수: {set()}
                LineMaterial — 외곽선 material 속성 변경; 속성 쓰기: {dashSize, dashed, gapSize, linewidth, opacity, transparent, visible, worldUnits}
            동작:
                외곽선 스타일을 검증하고 전달된 속성만 material에 적용한다.
                현재 helper를 반환한다.

        getRenderOrder() -> number
            동작: 상면 Mesh에 적용한 기준 renderOrder를 반환한다.

        setRenderOrder(renderOrder: number) -> UGroupBoundaryHelper
            처리 기준:
                dispose된 helper에는 변경을 수행하지 않는다.
                입력값과 외곽선용 +3 값은 서로 구분되는 유한한 수여야 한다.
            의존:
                Mesh — 상면·측면·하면의 렌더 순서 변경; 속성 쓰기: {renderOrder}
                LineSegments2 — 외곽선의 렌더 순서 변경; 속성 쓰기: {renderOrder}
            동작:
                상면에 기준값을 적용하고 측면·하면·외곽선에 각각 +1·+2·+3 값을 적용한다.
                현재 helper를 반환한다.

    override updateMatrixWorld(force?: boolean) -> void
        역할: 부모가 변경된 일반 렌더 갱신에서도 helper의 월드 기준점과 축을 유지한다.
        의존: Mesh — 하위 트리 월드 행렬 갱신; 함수: {updateMatrixWorld()}
        동작:
            유효한 월드 기준점이 있으면 현재 부모에 맞는 로컬 행렬을 동기화한다.
            기반 Mesh의 하위 트리 갱신을 실행한다.

    override updateWorldMatrix(updateParents: boolean, updateChildren: boolean, force: boolean = false) -> void
        역할: 명시적인 월드 행렬 갱신에서도 helper의 월드 기준점과 축을 유지한다.
        의존: Mesh — 부모와 하위 트리 월드 행렬 갱신; 함수: {updateWorldMatrix()}; 속성 읽기: {parent}
        동작:
            요청되었으면 부모의 월드 행렬을 먼저 갱신한다.
            유효한 월드 기준점이 있으면 현재 부모에 맞는 로컬 행렬을 동기화한다.
            부모 중복 갱신 없이 updateChildren과 force를 기반 Mesh에 전달하여 helper 및 요청한 하위 트리를 갱신한다.

    override dispose() -> void
        역할: helper가 소유한 렌더 자원과 반복 계산 참조를 해제한다.
        처리 기준:
            _disposed가 true이면 종료하므로 여러 번 호출해도 처음 한 번만 해제한다.
            Scene 부모 관계와 입력 대상의 자원은 변경하지 않는다.
        의존:
            Mesh — 부모 해제 이벤트 전달; 함수: {dispose()}
            BufferGeometry — 소유한 상면·측면·하면 geometry 해제; 함수: {dispose()}
            LineSegmentsGeometry — 소유한 외곽선 geometry 해제; 함수: {dispose()}
            MeshBasicMaterial — 소유한 상면·측면·하면 material 해제; 함수: {dispose()}
            LineMaterial — 소유한 외곽선 material 해제; 함수: {dispose()}
        동작:
            _disposed를 true로 먼저 확정하고 부모 dispose로 해제 이벤트를 전달한 뒤 두 bank의 네 geometry와 네 material을 각각 해제한다.
            측면·하면·외곽선 자식을 제거하고 대상을 해제한다.
            관측·지속 위치, snapshot, 골격·삼각분할 이력과 모든 재사용 pool의 강한 참조를 제거한다.
            helper를 숨긴다.

    #setWorldAnchor(x: number, y: number, z: number) -> void
        동작:
            월드 기준 좌표를 저장하고 유효 상태로 표시한다.
            부모의 현재 월드 행렬을 기준으로 helper의 로컬 행렬을 동기화한다.

    #syncWorldAnchorMatrix() -> void
        역할: 저장한 월드 translation을 현재 부모 공간의 정확한 로컬 행렬로 변환한다.
        의존:
            Matrix4 — 월드 translation과 부모 역변환 조합; 함수: {makeTranslation(), copy(), invert(), multiply(), decompose()}
            Mesh — 부모의 현재 행렬 조회와 helper의 로컬 transform 저장; 속성 읽기: {matrixWorld, parent}; 속성 쓰기: {matrix, matrixWorldNeedsUpdate, position, quaternion, scale}
        동작:
            월드 기준 translation 행렬을 만든다.
            부모가 있으면 현재 부모 행렬의 역행렬을 곱한 로컬 행렬을 저장하며 부모 행렬과 갱신 표시는 변경하지 않는다.
            부모가 없으면 월드 translation과 단위 회전·scale을 직접 저장한다.
            조회용 TRS를 동기화하되 렌더에는 shear를 보존한 matrix를 사용하고 월드 행렬 갱신 필요 상태를 설정한다.

    #matchesSnapshot() -> boolean
        동작:
            기하 옵션, 객체 identity와 지속 위치 배열을 직전 snapshot과 순서대로 비교한다.
            모든 값이 같을 때만 true를 반환한다.

    #commitSnapshot() -> void
        동작:
            현재 지속 위치와 객체 identity를 기존 snapshot 배열에 복사한다.
            현재 기하 옵션을 저장하고 snapshot 유효 상태를 설정한다.

```

## 4. 공통 처리 기준과 제약

```spec
helper geometry 좌표는 평균 XY와 최저 Z를 뺀 helper 로컬 좌표여야 한다.
helper transform은 부모 전체 역행렬을 적용하여 월드 기준점과 XY·Z축을 유지해야 한다.
본체의 기본 color는 0x00ffff, opacity는 0.2여야 한다.
외곽선 기본값은 color 0x00ffff, opacity 1, lineWidth 2, dashSize 10, gapSize 6의 점선이어야 한다.
본체와 외곽선은 depthTest를 사용하고 상면·측면·하면 material은 depthWrite, FrontSide와 polygonOffset을 사용해야 한다.
상면·측면·하면은 독립 Mesh와 독립 material을 사용해야 한다.
Scene 추가·제거와 대상 객체 수명은 호출자가 관리해야 한다.
입력 객체가 다른 부모를 갖더라도 수집된 월드 위치를 기준으로 같은 방식으로 계산해야 한다.
JSTS buffer 실패를 다른 형상으로 대체하지 않고 현재 update 실패로 전달해야 한다.
geometry attribute는 현재 capacity 안에서 재사용하고 부족할 때만 지수적으로 확장해야 한다.
상면·측면·하면·외곽선 geometry는 두 bank만 유지하고 비활성 bank 전체가 성공한 뒤 함께 교체해야 한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
