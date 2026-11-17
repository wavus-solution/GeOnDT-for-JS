# U3dHeatManager 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dHeatManager`는 대상 객체마다 등록된 열원을 모아, 대상 재질에 온도·거리 기반 색상 오버레이를 합성한다. 열원의 위치·온도·반경은 부동소수점 센서 텍스처로, 색상·알파는 팔레트 텍스처로 전달한다.

### 1.2 책임 범위

- 대상 식별자별 열원 집합, 센서 텍스처, 대상별 온도 팔레트와 재질 복원 참조를 관리한다.
- 기존 재질의 컴파일 콜백에 열원 셰이더를 연결하며 인스턴스 메시의 재질 참조를 유지한다.
- 마지막 열원 등록이 해제되면 해당 대상의 재질과 대상 전용 GPU 자원을 정리한다.

### 1.3 주요 동작 방식

`registerHeat()`는 등록만 수행한다. `update()`가 열원의 현재 대상 목록을 읽어 재질 패치와 센서 텍스처를 반영한다. 열원 비활성화는 센서 개수를 바꾸며, 마지막 등록 해제는 재질 복원으로 이어진다. 동일 대상의 재등록에서는 이전 uniform 객체를 다시 사용하여 이미 컴파일된 인스턴스 프로그램의 참조를 보존한다.

### 1.4 주요 사용처와 연계 대상

- `union3d/geometry/U3dHeatGeometry.js`: 공용 HeatManager로 열원 대상 등록·해제와 CHANGE 이벤트의 갱신을 전달한다.
- `union3d/3dLayer/U3dComponentPosition.js`: 논리 컴포넌트의 렌더 객체와 월드 행렬을 제공한다.
- `union3d/core/UHighLowPatch.js`, `union3d/core/mesh/UInstancedMesh.js`: 기존 고정밀 좌표·인스턴스 컴파일 패치가 합성되는 재질을 제공한다.

## 3. 정규 자연어 수도코드

```spec
U3dHeatManager 클래스 정의
    역할: 대상별 열원과 재질·GPU 자원의 연결을 관리하며 export된다.

    #heatGroup: Map<string, HeatGroupEntry>
        uuid 또는 name으로 찾는 활성 대상 엔트리다.
    #targetUniforms: WeakMap<Object3D, HeatUniforms>
        등록 해제 후 재연결할 때 재사용하는 대상별 uniform 객체다.
    #paletteTex: DataTexture
        매니저가 보유한 공용 RGBA 팔레트다.
    #paletteSize: number = 128
        팔레트 텍셀 수다.
    #palette: Array<{temp: number, color: Color, opacity: number}> | undefined
        온도 기반 팔레트이며 undefined이면 공용 색상 팔레트를 사용한다.
    static #_TMP: Vector3
        의존: THREE.Vector3 — 행렬 위치 분해; 생성자: {new Vector3()}
    static #_TMP_Q: Quaternion
        의존: THREE.Quaternion — 행렬 회전 분해; 생성자: {new Quaternion()}
    static #_TMP_S: Vector3
        의존: THREE.Vector3 — 행렬 스케일 분해; 생성자: {new Vector3()}

    constructor()
        의존: THREE.DataTexture — 공용 팔레트 소유; 생성자: {new DataTexture()}; 상수: {THREE.RGBAFormat}
        동작:
            대상 Map과 uniform WeakMap을 생성하고 크기 128의 RGBA Uint8 팔레트 텍스처를 만든다.
            공용 텍스처를 업로드 대상으로 표시하고 온도 팔레트를 undefined로 둔다.
            보라·파랑·청록·초록·노랑·주황·빨강의 기본 팔레트를 설정한다.

    #getEntry(target: Object3D) -> HeatGroupEntry | undefined
        의존: defined — 식별자 존재 판정; 함수: {defined()}
        동작:
            target이 없으면 undefined를 반환한다.
            target.uuid를 우선하고 null 또는 undefined일 때 target.name으로 대체하며 키가 정의되지 않았으면 undefined를 반환한다.
            기존 엔트리가 있으면 같은 참조를 반환한다.
            없으면 빈 heats Set, 재사용 uniform 또는 null, texture·paletteTexture·buffer의 null, 빈 originM Map과 materialPatched=false를 저장하여 반환한다.

    #parseColor(input: ColorRepresentation | undefined) -> Color | undefined
        의존: THREE.Color — 색상 해석; 생성자: {new Color()}; 함수: {set()}
        동작:
            input이 falsy이면 undefined를 반환하므로 숫자 0도 제외한다. [확인 Q-002]
            input.isColor가 truthy이면 입력 Color 참조를 그대로 반환한다.
            유한한 숫자이면 새 Color를 생성하여 반환한다.
            문자열이면 trim하고 빈 값은 undefined를 반환한다. 새 Color에 문자열을 적용한 뒤 RGB 중 유한하지 않은 값이 있으면 undefined, 아니면 Color를 반환한다.
            나머지 입력은 undefined를 반환한다.

    setHeatPaletteByTemp(palette: Array<TempPalette>) -> void
        의존:
            defined — 입력 항목과 opacity 존재 판정; 함수: {defined()}
            MathUtils — 알파 범위 제한; 정적 함수: {clamp()}
        동작:
            배열이 아니거나 항목이 2개 미만이면 #palette를 undefined로 바꾸고 종료한다. 기존 대상 텍스처는 이 분기에서 갱신하지 않는다.
            정의된 항목의 temp를 Number로 변환하고 색상을 파싱하며 opacity가 정의되었으면 0~1로 제한하고 아니면 1로 정한다.
            temp가 유한하지 않거나 파싱 색상이 없으면 해당 항목을 제외한다.
            온도 오름차순 정렬 후 유효 항목이 2개 미만이면 #palette를 undefined로 바꾸고 종료한다.
            정렬한 배열을 #palette에 저장하고 각 대상 팔레트에 반영한다.

    #rebuildPalette(tempMin: number, tempMax: number, texture: DataTexture) -> void
        의존: defined — 보간점 opacity 존재 판정; 함수: {defined()}
        동작:
            온도 팔레트가 없거나 2개 미만이면 종료한다.
            max(tempMax-tempMin, 1e-6)를 분모로 온도를 정규화하되 범위 밖 보간점도 보존한다.
            없는 항목·Color가 아닌 색상을 제외하고 opacity 미정의 값은 1로 둔다. 유효 보간점이 2개 미만이면 종료한다.
            t 오름차순 정렬 후 인접 t의 차이가 1e-6 미만이면 마지막 항목을 남긴다. 정리 후 2개 미만이면 종료한다.
            첫 t가 0보다 크면 t=0에 첫 색상을 추가하고 마지막 t가 1보다 작으면 t=1에 마지막 색상을 추가한다.
            정리한 보간점을 전달하여 지정 텍스처를 채운다.

    #fillPalette(palette: Array<PaletteStop>, texture: DataTexture = this.#paletteTex) -> void
        의존:
            defined — opacity 존재 판정; 함수: {defined()}
            THREE.MathUtils — 보간 비율 제한; 정적 함수: {clamp()}
        동작:
            texture.image.data를 직접 수정하며 #paletteSize개 텍셀을 t=n/(size-1)로 순회한다.
            t가 다음 보간점보다 커지면 마지막 구간 전까지 구간을 이동한다.
            구간 분모를 1e-6 이상으로 두고 보간 비율을 0~1로 제한하여 RGB와 기본값 1인 opacity를 선형 보간한다.
            각 채널에 255를 곱해 반올림하여 RGBA 버퍼에 기록하고 texture.needsUpdate를 true로 둔다.

    #updatePalette(entry: HeatGroupEntry) -> void
        의존: THREE.DataTexture — 대상 팔레트 소유·해제; 생성자: {new DataTexture()}; 함수: {dispose()}; 상수: {THREE.RGBAFormat}
        동작:
            entry.uniforms가 없으면 종료한다.
            entry.uniforms가 truthy이고 #palette가 truthy이면 대상 전용 RGBA Uint8 텍스처를 없을 때 생성하고 대상의 uTempMin·uTempMax로 보간한다.
            온도 팔레트 분기에서는 uPaletteTex를 대상 전용 텍스처로 연결한다.
            #palette가 없으면 대상 전용 텍스처를 해제하고 null로 바꾸며 uPaletteTex를 공용 텍스처로 연결한다.

    setHeatPalette(colors: Array<ColorRepresentation>) -> void
        동작:
            배열이 아니거나 항목이 2개 미만이면 상태를 바꾸지 않고 종료한다.
            색상을 파싱하고 유효한 결과만 모은다. 결과가 2개 미만이면 종료한다.
            t=i/(개수-1)의 균등 보간점을 만들고 #palette를 undefined로 바꾼 뒤 공용 텍스처를 채운다.
            기존 모든 대상의 팔레트 참조를 갱신한다.

    registerHeat(heat: U3dSphere, target: Object3D) -> void
        동작:
            대상 엔트리를 조회·생성하고 없으면 종료한다.
            엔트리의 heats Set에 heat를 추가한다. 이 호출 자체에서는 재질이나 텍스처를 갱신하지 않는다.

    unregisterHeatTarget(heat: U3dSphere, target: Object3D) -> void
        동작:
            target.uuid를 우선하고 null 또는 undefined일 때 target.name으로 대체하여 엔트리를 찾고 없으면 종료한다.
            heats Set에서 heat를 제거한다.
            남은 등록이 0개이면 대상 재질과 전용 자원을 복원·해제한 뒤 Map에서 엔트리를 삭제한다.
            등록이 남았으면 센서 텍스처만 다시 구성한다.

    update(heat: U3dSphere) -> void
        인터페이스: heat는 런타임에 getTargets()를 제공해야 한다.
        의존: U3dHeatGeometry(heat) — 현재 대상 조회; 함수: {getTargets()}
        동작:
            heat.getTargets()가 반환한 Set을 순회한다.
            각 대상의 엔트리를 조회·생성하고 없으면 해당 대상을 건너뛴다.
            재질 패치를 보장한 뒤 센서 텍스처를 다시 갱신한다.

    #ensureMaterialPatched(target: Object3D, entry: HeatGroupEntry) -> void
        의존:
            U3dComponentPosition — 논리 컴포넌트의 렌더 객체 조회; 함수: {getObject()}; 속성 읽기: {isComponent}
            THREE.Object3D — 렌더 객체 순회; 함수: {traverse()}
            THREE.Material — 열원 전용 복제·컴파일 연결; 함수: {clone()}; 콜백: {onBeforeCompile(), onBeforeRender(), customProgramCacheKey()}; 속성 쓰기: {needsUpdate, userData}
            console — 지원하지 않는 프래그먼트 셰이더 알림; 함수: {warn()}
        동작:
            target이 없으면 종료한다.
            target이 truthy이면 센서 갱신 결과 uniform 참조를 준비한다.
            target.isComponent가 truthy이면 getObject() 결과를 순회하고 아니면 target을 순회한다.
            메시가 아니거나 material이 없거나 entry.originM에 이미 등록된 메시는 건너뛴다.
            mesh._oriMaterial이 truthy이면 선택 강조가 복원할 재질을 원본으로 선택하고 아니면 mesh.material을 선택하여 originM에 저장한다.
            단일 재질은 1개 목록으로, 배열 재질은 각 슬롯으로 순회하며 일반 메시는 각 재질을 clone하고 인스턴스 메시는 기존 재질을 그대로 사용한다.
            일반 복제 재질의 userData는 얕은 복사로 교체하고 기존 컴파일·렌더 콜백과 프로그램 캐시 키를 유지한다. 원본 _oriMap이 truthy이면 같은 텍스처 복원 참조도 보존한다.
            기존 onBeforeCompile을 같은 this와 shader·renderer로 먼저 실행한 뒤 열원 패치를 실행하는 콜백을 만든다.
            열원 패치는 sensor·온도·불투명도·대상 역행렬·스케일·팔레트 uniform 참조를 연결한다.
            버텍스 셰이더에 vLocalPos가 이미 있으면 주입을 종료한다. modelPositionLow uniform이 있으면 USE_HEAT_MODEL_LOW define을 추가한다.
            배칭·인스턴스·High/Low 좌표를 반영한 월드 위치를 대상 역행렬로 변환하여 vLocalPos를 생성한다.
            프래그먼트에 varying과 센서·반경·팔레트 샘플링 함수를 없을 때 삽입한다.
            opaque_fragment include가 없으면 경고하고 색상 합성을 건너뛴다. heat overlay begin 표식이 있으면 중복 합성을 건너뛴다.
            최대 64개 센서에 대해 로컬 차이에 대상 스케일을 곱한 거리로 영향도를 계산한다. 내부 반경 이하는 1, 외부 반경 미만은 smoothstep 감쇠이며 1e-4 이하 영향은 제외한다.
            유효 온도는 최저 온도와 센서 온도의 영향도 보간값 중 최댓값을 사용하며 영향도를 합산한다.
            영향 합이 양수이면 온도 범위를 0~1로 정규화하고 지수 0.6, 채도 배율 1.5를 적용한 팔레트 RGB를 만든다.
            영향 합을 0~1로 제한한 값에 uOpacity와 팔레트 알파를 곱해 outgoingLight와 혼합한다.
            콜백에 원래 컴파일·캐시 키 참조를 저장하고 캐시 키에 |heat-overlay-v1을 추가한다.
            각 패치 재질의 갱신을 표시한다.
            일반 메시는 원본의 단일·배열 형태를 유지하여 패치 재질을 연결한다. mesh._oriMaterial이 truthy이면 그 복원 대상만 바꾸어 표시 중인 강조를 유지하고 아니면 mesh.material을 교체한다.

    #updateSensorTexture(target: Object3D, entry: HeatGroupEntry) -> HeatUniforms
        의존:
            THREE.DataTexture — 센서 float 텍스처 소유·재할당; 생성자: {new DataTexture()}; 함수: {dispose()}; 상수: {THREE.RGBAFormat, THREE.FloatType, THREE.NearestFilter, THREE.ClampToEdgeWrapping}
            THREE.Matrix4 — 대상 역행렬; 생성자: {new Matrix4()}; 함수: {invert(), decompose()}
            THREE.Vector3 — 대상 스케일; 생성자: {new Vector3()}
            U3dHeatGeometry — 활성·온도·반경 조회; 함수: {getAvailable(), getTemperature(), getMinTemperature(), getMaxTemperature()}; 속성 읽기: {temperature, buffer, outerFactor}
            U3dComponentPosition — 논리 대상의 월드 행렬; 함수: {getMatrixWorld()}; 속성 읽기: {isComponent}
            THREE.Object3D — 일반 대상의 최신 행렬; 함수: {updateMatrixWorld()}; 속성 읽기: {matrixWorld}
        동작:
            uniforms가 없으면 센서 참조 null, 개수·너비 0, 온도 범위 0~100, opacity 1, 단위 역행렬·스케일과 공용 팔레트 참조를 생성하고 #targetUniforms에 보관한다. [확인 Q-003]
            heats 중 getAvailable()이 truthy인 열원만 선택한다.
            각 열원당 RGBA 텍셀 2개를 사용하며 최소 너비 1에서 필요한 너비를 2의 거듭제곱으로 올림한다.
            기존 버퍼 크기가 다르거나 텍스처·버퍼가 없으면 이전 텍스처를 해제하고 Float32 버퍼·텍스처를 생성하여 nearest·clamp 설정 후 uSensorTex에 연결한다.
            각 활성 열원의 월드 위치를 대상 로컬 좌표로 변환한다.
            온도는 getTemperature() 결과, temperature, 0 순서로 null·undefined를 대체한다. 최소 온도는 getMinTemperature(), temperature, 0 순서이며 최대는 getMaxTemperature(), temperature, 100 순서다.
            첫 텍셀에 로컬 xyz와 온도를 기록하고 둘째 텍셀에 buffer 기본값 1과 buffer*outerFactor 기본 배율 3, 나머지 0을 기록한다.
            사용하지 않은 버퍼 구간을 0으로 채우고 텍스처 업로드와 uSensorCount·uSensorTexSize를 갱신한다.
            전체 최소·최대 온도가 유한하지 않으면 각각 0·1을 사용한다. 대상 팔레트를 갱신하고 uOpacity를 1로 설정한다.
            컴포넌트는 getMatrixWorld()가 있으면 그 역행렬과 분해 스케일을 기록한다. 일반 대상은 matrixWorld가 있으면 updateMatrixWorld(true) 후 역행렬·스케일을 기록한다.
            같은 uniform 객체를 반환한다.

    #restoreMaterials(target: Object3D, entry: HeatGroupEntry) -> void
        의존:
            THREE.Material — 일반 복제 재질 해제·인스턴스 콜백 복원; 함수: {dispose()}; 콜백: {onBeforeCompile(), customProgramCacheKey()}; 속성 쓰기: {needsUpdate}
            THREE.DataTexture — 대상 전용 텍스처 해제; 함수: {dispose()}
        동작:
            target·entry·originM 중 없는 값이 있으면 종료한다.
            originM의 각 메시를 순회하며 pickable._oriMaterial이 truthy이면 선택 강조의 복원 대상을, 아니면 mesh.material을 현재 열원 재질로 선택한다.
            현재 단일 재질은 1개 목록으로 바꾸며 배열은 그대로 사용하고 같은 재질 참조는 Set으로 중복을 제거한다.
            mesh.isInstancedMesh가 truthy이면:
                mat.onBeforeCompile._originOBC가 undefined가 아니면 mat.onBeforeCompile을 저장 원본 콜백 또는 null로 복원한다.
                저장 캐시 키가 truthy이면 customProgramCacheKey를 복원한다.
                mat.needsUpdate를 true로 설정한다.
            일반 메시이면 각 mat이 truthy이고 저장 원본과 다르며 원본 배열에도 포함되지 않은 재질만 dispose한다.
            일반 메시의 pickable._oriMaterial이 truthy이면 그 복원 대상을 저장 원본으로 돌려 표시 중인 선택 재질을 유지하고 아니면 mesh.material을 원본으로 복원한다.
            entry.texture가 truthy이면 센서 텍스처를 해제하고 entry.texture를 null로 바꾼다.
            entry.buffer를 null로 바꾼다.
            entry.uniforms가 truthy이면 센서 참조를 null, 개수를 0, 팔레트를 공용 참조로 바꾼다.
            entry.uniforms를 null로 둔다. WeakMap의 uniform 객체는 남긴다.
            대상 팔레트 텍스처를 해제하고 entry.paletteTexture를 null로 바꾼다.
            originM을 비우고 entry.materialPatched를 false로 둔다.

    #getLocalFromTarget(target: Object3D, heat: Object3D) -> Vector3
        의존:
            THREE.Vector3 — 열원 위치 결과; 생성자: {new Vector3()}
            THREE.Object3D — 열원 월드 위치와 일반 대상 로컬 변환; 함수: {getWorldPosition(), worldToLocal()}
            U3dComponentPosition — 논리 컴포넌트 월드 행렬; 함수: {getMatrixWorld()}; 속성 읽기: {isComponent}
        동작:
            열원의 getWorldPosition()으로 월드 위치를 구하고 복사한다.
            target.isComponent가 truthy이면 getMatrixWorld() 결과가 있을 때만 역행렬을 적용하며 없으면 월드 위치 복사본을 유지한다.
            일반 대상이면 worldToLocal()로 변환한 벡터를 반환한다.

PaletteStop 부분 타입 명세
    이 명세에서 사용하는 필드:
        t: number
        color: Color
        opacity?: number

HeatUniforms 부분 타입 명세
    이 명세에서 사용하는 필드:
        uSensorTex: {value: DataTexture | null}
        uSensorCount, uSensorTexSize, uTempMin, uTempMax, uOpacity: {value: number}
        uTargetWorldInv: {value: Matrix4}
        uTargetScale: {value: Vector3}
        uPaletteTex: {value: DataTexture}

HeatGroupEntry 부분 타입 명세
    이 명세에서 사용하는 필드:
        heats: Set<U3dSphere>
        uniforms: HeatUniforms | null
        texture, paletteTexture: DataTexture | null
        buffer: Float32Array | null
        originM: Map<Mesh, Material | Array<Material>>
        materialPatched: boolean
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
