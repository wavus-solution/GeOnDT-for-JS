# ULineWorldPositionMaterial 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

선 재질의 화면 실루엣을 사용하면서 색상 대신 중심선의 카메라 상대 월드 좌표를 출력하는 재질을 생성한다.

### 1.2 책임 범위

- 원본 재질을 복제하여 위치 출력용 셰이더와 uniform을 구성한다.
- 원본 스타일과 현재 카메라·객체의 낮은 정밀도 보정 성분을 렌더 직전에 반영한다.
- 복제 재질별 상태를 재사용하여 기본 uniform 객체의 키 배열 생성과 변경 없는 defines의 복사·정렬을 생략한다.

### 1.3 주요 동작 방식

일반 소스는 재질 생성·설정과 렌더 연결을 유지하고, 비공개 구현은 셰이더 구성과 원본 상태 동기화를 담당한다. 선 중심선의 상대 위치를 RGB, 유효 마스크를 alpha 1로 기록하며 색상 AA와 후처리를 제외한다. defines는 마지막으로 반영한 소유 키와 문자열 값을 비교하고 변경된 경우에만 교체한다.

### 1.4 주요 사용처와 연계 대상

- `U3dLine`이 `customWorldPositionMaterial`로 사용한다.
- `ULineMaterial`의 색상 커버리지 모드와 데이터 출력 모드를 분리한다.

## 2. 요구사항과 품질 기준

```spec
원본 uniform·defines의 직접 변경과 객체 교체를 다음 렌더에서 반영해야 한다.
색상 AA 확장·블렌딩은 좌표 출력 마스크에 적용하지 않아야 한다.
원본 재질의 해상도를 변경하지 않아야 한다.
기본 uniform 객체에서 키 배열을 만들지 않고 변경 없는 defines의 복제·정렬을 생략해야 한다.
복제 재질마다 독립 상태를 소유하며 셰이더의 좌표 계산과 기존 해제 책임을 유지해야 한다.
```

## 3. 정규 자연어 수도코드

```spec
createLineSegmentsWorldPositionMaterial(sourceMaterial: LineMaterial) -> LineMaterial
    의존:
        LineMaterial — 독립 재질 복제와 렌더링 설정; 함수: {clone()}; 속성 읽기: {vertexShader, fragmentShader, defines}
        THREE — 보정 uniform과 블렌딩 설정; 생성자: {new Vector3(), new Matrix3()}; 상수: {NoBlending}
    동작:
        원본을 복제하여 이름을 ULineWorldPositionMaterial로 정한다.
        위치 출력용 vertex·fragment shader를 설정한다.
        호환 재질에 _setLineCoverageEnabled 함수가 있으면 false로 호출한다.
        transparent와 alphaToCoverage를 false, blending을 NoBlending, depthTest와 depthWrite를 true, toneMapped를 false로 설정한다.
        cameraPositionLow와 modelPositionLow Vector3 및 modelMatrix3 Matrix3 uniform을 생성한다.
        복제 재질의 defines로 독립 동기화 상태를 만든다.
        원본 재질과 상태를 보관하는 onBeforeRender 콜백을 등록한다.
        렌더 콜백에서 원본 스타일과 현재 renderer·카메라·객체를 동기화한다.
        복제 재질을 반환한다.

ULineWorldPositionSyncState 타입 정의
    viewport: Vector4
        실제 GL 뷰포트 조회에 재사용한다.
    defineValues: Map<string, string>
        마지막으로 반영한 defines의 소유 키와 문자열 값이며 재질별로 소유한다.

```

## 4. 공통 처리 기준과 제약

```spec
반환 재질의 해제는 호출자가 담당한다.
카메라나 객체의 행렬이 없으면 해당 보정 uniform은 변경하지 않는다.
숫자 1과 문자열 '1'처럼 문자열 값이 같은 defines는 기존과 같이 같은 설정으로 취급한다.
상속된 enumerable 키는 원본 uniform·defines 동기화에 포함하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
