# U3DTilesMesh 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

3D Tiles 메시를 렌더링하면서 batch ID에 따른 선택 색상·속성 조회와 BIM 그룹 계층 탐색을 제공한다.

### 1.2 책임 범위

U3dObject 메타데이터를 Three.js Mesh에 혼합하고 재로딩 식별값 조회, 메시 또는 batch별 선택 표현·복원, BIM 부모 조회와 삼각형 좌표 탐색을 담당한다. 원본 콘텐츠 로딩과 puid의 부여는 데이터 사용자가 담당한다.

### 1.3 주요 동작 방식

부모의 batchTable 여부에 따라 선택 표현을 나눈다. 부모 그룹이 batch별 메시를 보유하면 해당 자식 재질을 바꾸고, 그렇지 않으면 한 메시의 _BATCHID 정점 속성에서 같은 batch의 정점 색상을 바꾼다. BIM 부모는 그룹 이름의 접두 길이를 비교하여 찾는다.

### 1.4 주요 사용처와 연계 대상

3D Tiles 모델 로딩 결과와 U3dSelect의 선택 경로에서 사용한다. Three.js Mesh·BufferGeometry, UGroup과 U3dObject가 직접 협력 대상이다.

## 3. 정규 자연어 수도코드

```spec
HIGH_LIGHT_COLOR: string = '#fe5f55'
    선택 재질의 기본 색상
HIGH_LIGHT_OPACITY: number = 0.6
    선택 재질의 기본 투명도

U3DTilesMesh extends THREE.Mesh 클래스 정의
    의존: THREE.Mesh — 렌더 메시 기반; 상속: {Mesh}

    puid: string | undefined
        데이터 사용자가 지정하는 원본 데이터·사용 위치의 재로딩 식별값
    castShadow, receiveShadow: boolean = true
        그림자 생성과 수신을 허용한다.
    _ulayername = undefined
        소속 레이어 이름
    _utype
        엔진 메시 종류
    _disposed: boolean = false
        해제 상태
    _backgroundColor: Color
        정점 색상 복원에 사용하는 배경색
    _isBIM: boolean = false
        BIM 메시 여부
    _pickMesh = undefined
        부모 batch 그룹에서 현재 선택한 메시
    _makeLevel = undefined
        객체 생성 시 사용한 BIM 레벨
    _BIMLevelLengthList = undefined
        BIM 단계별 그룹명 접두 길이 배열

    constructor(geometry, material, opt)
        의존:
            THREE — 기반 메시와 기본 흰색 생성; 생성자: {super(), new Color()}
            U3dObject — 엔진 객체 속성 생성; 생성자: {new U3dObject()}
            assign — 생성한 엔진 속성 혼합; 함수: {assign()}
            defaultValue — 종류·배경색의 undefined 기본값; 함수: {defaultValue()}
            UDEF — 기본 건물 메시 종류; 상수: {UMESH_TYPE._building}
        동작:
            geometry·material로 기반 Mesh를 만들고 falsy인 opt는 빈 객체로 바꾼다.
            opt로 만든 U3dObject의 속성을 현재 메시로 복사한다.
            그림자 생성·수신을 켜고 종류는 opt.type 또는 건물, 배경색은 opt.backgroundcolor 또는 흰색으로 정한다.
            레이어 이름·선택 메시·BIM 생성 레벨·단계 길이는 undefined, 해제 상태와 BIM 여부는 false로 초기화한다.

    getUid() -> string
        의존: THREE.Object3D — 현재 인스턴스 식별자; 속성 읽기: {uuid}
        동작: puid가 null 또는 undefined가 아니면 그 값을 반환하고, 아니면 현재 객체 uuid를 반환한다.

    get BackgroudColor()
        동작: _backgroundColor를 반환한다.

    set BackgroudColor(clr) -> void
        동작: _backgroundColor에 clr을 저장한다.

    isPickEnabled() -> boolean
        의존:
            UDEF — 정점 자료 유효성 단언; 정적 함수: {assert()}
            defined — geometry와 batch 속성 존재 확인; 함수: {defined()}
            THREE.Mesh — 선택용 geometry 조회; 속성 읽기: {geometry}
        동작: geometry와 position 속성을 단언한 다음 _BATCHID가 정의되어 있으면 true, 없으면 false를 반환한다.

    restoreMaterial() -> void
        의존:
            defined — geometry·부모·원본 값·정점 색상 존재 확인; 함수: {defined()}
            UDEF — 정점 자료 단언; 정적 함수: {assert()}
            THREE.Mesh — 메시 재질과 정점 자료; 속성 읽기: {geometry, material}; 속성 쓰기: {material.color, material.opacity, material.vertexColors, material.needsUpdate}
            THREE.Object3D — 부모 batch 여부·선택 정보; 속성 읽기: {parent}; 속성 쓰기: {userData.pickedInfo}
            THREE.BufferAttribute — 정점 색상 반영; 함수: {setXYZW()}; 속성 쓰기: {needsUpdate}
        동작:
            geometry가 없으면 종료하고 geometry와 position 존재를 단언한다.
            geometry.attributes._BATCHID가 없으면 isBIM으로 BIM 여부를 확인하고 false이면 종료한다.
            부모에 userData.batchTable이 있으면 _pickMesh만 복원 대상으로 삼는다.
                선택 메시가 있는데 재질 _oriColor가 없으면 오류를 던진다.
                pickMesh.material._oriColor가 정의되어 있으면 color로 되돌리고 _oriColor를 undefined로 바꾼 뒤 삭제한다.
                pickMesh.material._oriOpacity가 정의되어 있으면 opacity로 되돌리고 _oriOpacity를 undefined로 바꾼 뒤 삭제한다.
                선택 메시의 pickedInfo를 undefined로 지운다.
                _pickMesh를 undefined로 지운다.
            부모 batchTable이 없으면 현재 재질을 복원한다.
                material._oriColor가 정의되어 있으면 color에 저장값을 되돌리고 _oriColor를 undefined로 바꾼 뒤 삭제한다.
                material._oriOpacity가 정의되어 있으면 opacity에 저장값을 되돌리고 _oriOpacity를 undefined로 바꾼 뒤 삭제한다.
                vertexColors를 false로 바꾼다.
                geometry.attributes.color가 없으면 정점 수에 맞는 4성분 색상 버퍼를 만든다.
                모든 정점 색상을 _backgroundColor의 RGB와 알파 1로 채우고 색상 버퍼·재질 갱신 플래그를 켠다.
                현재 메시의 userData.pickedInfo를 undefined로 지운다.
            어느 경로에서도 선택 시 설정한 transparent 값을 원본 값으로 되돌리지는 않는다.

    pickMaterial(intersectInfo: any, color: ColorRepresentation = HIGH_LIGHT_COLOR, opacity: number = HIGH_LIGHT_OPACITY) -> void
        인터페이스: intersectInfo.object는 그룹에서 선택할 실제 메시이며 face.b는 단일 메시의 batch ID를 읽을 정점 인덱스다.
        의존:
            defined — geometry·batch·원본 색상·속성 존재 확인; 함수: {defined()}
            UDEF — 정점 자료 단언; 정적 함수: {assert()}
            UGroup — 그룹 내 선택 메시 탐색; 함수: {traverse()}
            THREE — 선택 색상 생성 및 재질 변경; 생성자: {new Color()}; 함수: {Color.set(), BufferAttribute.setXYZW()}
            THREE.Mesh — batch 정점과 선택 재질; 속성 읽기: {geometry, material}
            THREE.Object3D — 그룹·선택 메타데이터; 속성 읽기: {parent, userData}; 속성 쓰기: {userData.pickedInfo}
            Web API — 선택 불가·정보 오류 출력; 함수: {console.info(), console.error()}
        동작:
            geometry가 없거나 intersectInfo가 falsy이면 종료하고 position 존재를 단언한다.
            _BATCHID가 없으면 선택 불가 로그를 출력하고 종료한다.
            기존 선택 표현을 먼저 복원한다.
            부모에 userData.batchTable이 있으면 부모가 UGroup일 때만 내부 메시를 순회한다.
                U3DTilesMesh 순회 순번을 batchId로 세며 intersectInfo.object와 동일한 메시를 선택하고 찾지 못하면 오류를 던진다.
                findMesh.material._oriColor가 없으면 현재 color를 복제하여 _oriColor에 저장한다.
                findMesh.material._oriOpacity가 없으면 현재 opacity를 _oriOpacity에 저장한다.
                선택 메시 재질에 color·opacity를 적용하고 opacity < 1 여부를 transparent에 저장한다.
                batchId가 0 이상이고 batchTable_.content.name이 배열이며 길이가 batchId - 1보다 크면 현재 메시 pickedInfo에 name[batchId]를 저장한다. 아니면 정보 오류를 출력한다.
                선택 메시를 _pickMesh로 보관한다. 부모가 UGroup이 아니면 이 선택 분기의 후속 변경은 없다.
            부모 batchTable이 없으면 현재 메시의 정점 색상을 변경한다.
                material._oriColor가 없으면 현재 color를 복제하여 _oriColor에 저장한다.
                material._oriOpacity가 없으면 현재 opacity를 _oriOpacity에 저장한다.
                material.vertexColors를 true로 설정한다.
                face.b 위치의 _BATCHID를 parseInt로 변환하여 대상 batchId로 정한다.
                geometry.attributes.color가 없으면 정점 색상 속성을 생성한다.
                동일 batchId를 가진 정점의 RGB를 선택색, 알파를 1로 바꾼 뒤 버퍼·재질 갱신 플래그를 켠다.
                batchTable_.content의 MODEL_NAME이 배열이면 해당 값을, 아니면 name이 배열이면 해당 값을 pickedInfo로 기록한다.
                이 경로는 opacity 인수로 재질 투명도를 변경하지 않는다.

    getUType()
        동작: _utype을 반환한다.

    setUType(type) -> void
        동작: _utype에 type을 저장한다.

    override raycast(a, b) -> void
        의존: THREE — 실제 메시 교차 검사; 함수: {Mesh.prototype.raycast.call()}; 속성 읽기: {visible}
        동작: visible이 truthy일 때만 현재 객체를 this로 기반 Mesh.raycast에 a·b를 전달한다.

    getLayerName()
        동작: _ulayername을 반환한다.

    setLayerName(name) -> void
        동작: _ulayername에 name을 저장한다.

    getBatchGroupName()
        의존:
            defined — 메타데이터 존재 확인; 함수: {defined()}
            THREE.Object3D — batch 그룹 이름; 속성 읽기: {userData._groupName}
        동작: userData와 _groupName이 정의되어 있으면 해당 값을 반환하고 아니면 undefined를 반환한다.

    getBatchMeshName()
        의존:
            defined — 메타데이터 존재 확인; 함수: {defined()}
            THREE.Object3D — batch 메시 이름; 속성 읽기: {userData._meshName}
        동작: userData와 _meshName이 정의되어 있으면 해당 값을 반환하고 아니면 undefined를 반환한다.

    getBatchGroupMeshNames()
        의존:
            defined — batch 그룹 존재 확인; 함수: {defined()}
            THREE.Object3D — batch 그룹 항목; 속성 읽기: {userData._batchGroup}
        동작: userData와 _batchGroup이 정의되어 있으면 Items 값을 반환하고 아니면 undefined를 반환한다.

    getParent()
        의존:
            defined — 부모 존재 확인; 함수: {defined()}
            THREE.Object3D — 계층 부모; 속성 읽기: {parent}
        동작: parent가 정의되어 있으면 반환하고 아니면 undefined를 반환한다.

    getChildren() -> Array
        의존:
            defined — 자식 목록 존재 확인; 함수: {defined()}
            THREE.Object3D — 계층 자식 목록; 속성 읽기: {children}
        동작: children이 정의되어 있으면 그 참조를 반환하고 아니면 새 빈 배열을 반환한다.

    setBIMLevelLengthList(list) -> void
        의존: defined — 입력 존재 확인; 함수: {defined()}
        동작:
            list가 정의되지 않았으면 기존 값을 유지하고 종료한다.
            Object.keys(list) 순서대로 각 값을 새 배열에 담는다.
            값 배열이 비어 있으면 기존 값을 유지하고, 아니면 _BIMLevelLengthList를 새 배열로 교체한다.

    isBIM() -> boolean
        동작: _isBIM을 boolean으로 변환하여 반환한다.

    getBIMLevelLengthList()
        의존: defined — 단계 길이 목록 존재 확인; 함수: {defined()}
        동작: _BIMLevelLengthList가 정의되어 있으면 그 참조를 반환하고 아니면 undefined를 반환한다.

    setMakeLevel(level) -> void
        의존: defined — 입력 레벨 존재 확인; 함수: {defined()}
        동작: level이 정의되어 있을 때만 _makeLevel을 바꾼다.

    getMakeLevel()
        의존: defined — 생성 레벨 존재 확인; 함수: {defined()}
        동작: _makeLevel이 정의되어 있으면 반환하고 아니면 undefined를 반환한다.

    getBBox() -> Box3
        의존: THREE.Box3 — 현재 객체 계층의 경계; 생성자: {new Box3()}; 함수: {setFromObject()}
        동작: 새 Box3에서 현재 객체 경계를 계산하여 반환한다.

    getParentfromLevel(level)
        의존:
            defined — 레벨·그룹 정보 존재 확인; 함수: {defined()}
            U3dMessage — 요청 레벨 범위 초과 안내; 정적 함수: {info()}
            String 확장 — BIM 그룹명의 대소문자 무시 비교; 함수: {equalIgnoreCase()}
            UGroup — 상위 계층 이동; 함수: {getParent()}; 속성 읽기: {name}
        동작:
            level이 정의되지 않았으면 4로 삼고 Number(level)이 -1이면 현재 메시를 즉시 반환하며 나머지는 숫자로 변환한다.
            BIM 단계 길이 배열이 없으면 undefined를 반환하고 생성 레벨이 없으면 현재 메시를 반환한다.

            요청 level이 생성 레벨보다 크거나 배열 마지막 인덱스보다 크면 안내 로그를 출력하고 undefined를 반환한다.
            batch 그룹 이름이 없으면 undefined를 반환한다.
            그룹명 첫 글자가 F와 대소문자 없이 같으면 길이 배열의 0번 값을 4로 바꾼다.
            요청 level의 접두 길이로 그룹명을 잘라 비교할 이름을 만든다.
            배열 길이 - level까지 양끝 포함하여 부모로 한 단계씩 이동하고 이름 길이와 대소문자 무시 비교가 모두 같으면 그 부모를 반환한다.
            일치하는 부모를 찾지 못하면 현재 메시를 반환한다. 순회 중 부모 부재를 별도로 검사하지 않는다.

    traverseFace(callback) -> void
        인터페이스: 정상 face callback은 현재 메시를 this로 받고 정점 인덱스 3개 배열을 받는다. 자료 부재 알림은 callback(undefined)로 직접 호출한다.
        의존:
            defined — geometry·position·index 존재 확인; 함수: {defined()}
            THREE.Mesh — 순회할 정점 자료; 속성 읽기: {geometry}
            THREE.BufferGeometry — position 조회; 함수: {getAttribute()}
            U3dMessage — 자료 부재 오류 로그; 함수: {__GError__()}
            callback — 삼각형 전달; 콜백: {callback(), callback.call()}
        동작:
            geometry가 없으면 오류 로그와 callback(undefined)를 실행하지만 함수에서 반환하지 않고 이어서 geometry를 읽는다. [확인 Q-001]
            position 속성이 없을 때도 오류 로그와 callback(undefined)를 실행한 뒤 진행한다.
            index가 있으면 기존 인덱스 배열을 쓰고 없으면 0부터 position.count - 1 미만까지의 인덱스를 새로 만든다. [확인 Q-002]
            배열을 3개씩 묶되 마지막 불완전 묶음은 건너뛰고 callback.call(this, face)로 전달한다.

    getVertexAsFace(face, isAbsolute)
        의존:
            U3dMessage — 잘못된 face 안내; 함수: {__GInfo__()}
            THREE — 정점 좌표를 벡터로 구성하고 월드 변환; 생성자: {new Vector3()}; 함수: {BufferAttribute.getX(), BufferAttribute.getY(), BufferAttribute.getZ(), Vector3.applyMatrix4()}
            THREE.Mesh — position 속성 읽기; 속성 읽기: {geometry}
            THREE.Object3D — 월드 변환 행렬; 속성 읽기: {matrixWorld}
        동작:
            face가 배열이 아니거나 원소가 3개 미만이면 안내 로그를 출력하고 undefined를 반환한다.
            isAbsolute는 falsy이면 false로 삼고 face의 모든 정점 인덱스에서 XYZ를 읽어 새 벡터를 만든다.
            isAbsolute가 truthy이면 각 벡터에 matrixWorld를 적용하고 아니면 로컬 좌표를 유지하여 배열로 반환한다.

    getAbsoluteVertex(vertexX, vertexY, vertexZ) -> Vector3
        의존:
            THREE.Vector3 — 결과 벡터 생성; 생성자: {new Vector3()}
            THREE.Object3D — 객체 위치; 속성 읽기: {position}
        동작: 입력 XYZ 각각에 현재 position 성분만 더한 새 벡터를 반환하며 회전·스케일·부모 행렬을 적용하지 않는다.

createColors_() -> void
    인터페이스: this는 색상 속성을 만들 U3DTilesMesh이다.
    의존: THREE — 정점 색상 버퍼 설치; 생성자: {new BufferAttribute()}; 함수: {BufferGeometry.setAttribute()}
    동작: this.geometry의 position 정점 수에 4를 곱한 길이의 Float32Array를 만들고 itemSize 4인 color 속성으로 설치한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
