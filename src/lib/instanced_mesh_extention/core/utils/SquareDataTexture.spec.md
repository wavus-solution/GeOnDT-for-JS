# SquareDataTexture 명세

> 상태: 구현 관찰 초안

## 1. 개요

인스턴스별 행렬·색상·uniform 값을 정사각형 DataTexture에 저장한다. 변경된 행과 열을 병합하여 업로드하고, shader에서 인스턴스 ID로 데이터를 조회할 GLSL을 제공한다. InstancedMesh2의 행렬·색상·uniform 데이터 갱신에서 사용한다.

## 3. 정규 자연어 수도코드

```spec
getSquareTextureSize(capacity, pixelsPerInstance) -> number
    동작: capacity를 수용하는 한 변 길이를 계산하여 pixelsPerInstance의 배수로 올림하고 최소 pixelsPerInstance를 반환한다.

getSquareTextureInfo(arrayType, channels, pixelsPerInstance, capacity) -> object
    동작:
        channels가 3이면 경고하고 4로 바꾼다.
        한 변 길이를 구하고 길이의 제곱에 channels를 곱한 typed array를 만든다.
        생성자 이름에 Float가 있으면 FloatType, Uint가 있으면 UnsignedIntType, 그 외는 IntType을 사용한다.
        채널 수 1·2·4와 부동소수 여부로 Red·RG·RGBA의 일반 또는 정수 format을 선택한다.
        array, size, type, format을 반환하며 그 밖의 채널 수에서는 format이 undefined이다.

SquareDataTextureArrayConstructor 타입 정의
    Int8ArrayConstructor | Uint8ArrayConstructor | Uint8ClampedArrayConstructor | Int16ArrayConstructor | Uint16ArrayConstructor | Int32ArrayConstructor | Uint32ArrayConstructor | Float32ArrayConstructor | Float64ArrayConstructor

SquareDataTexture extends DataTexture 클래스 정의
    의존: DataTexture — 데이터 텍스처 기반; 상속: {DataTexture}

    partialUpdate: boolean = true
        enqueueUpdate에서 false이면 dirty 행 추적을 생략하고, update의 조건 분기에서 true이면 부분 갱신, false이면 전체 갱신을 선택한다.
    _fetchUniformsInFragmentShader: boolean
        uniform 값을 fragment에서 조회할지 여부이다.
    maxUpdateCalls: number = 8
        병합할 dirty range 개수의 상한이며 Infinity를 허용한다. 구형 context의 행별 fallback 호출 수 상한은 아니다.
    maxMergeGapRows: number = 2
        바로 병합하는 범위 사이의 빈 행 수이며 Infinity를 허용한다.
    fullUpdateRowRatio: number = 0.8
        병합 사각형의 픽셀 합이 전체 픽셀의 이 비율 이상이면 전체 전송으로 바꾼다.
    needsUpdate: boolean
        상속 setter를 통해 텍스처 버전을 올려 초기화·재업로드를 요청한다.
    image: object
        width·height와 typed array data를 갖는 상속 텍스처 이미지이다.

    constructor(arrayType: SquareDataTextureArrayConstructor, channels: number, pixelsPerInstance: number, capacity: number, uniformMap: Map, fetchInFragmentShader: boolean)
        의존: DataTexture — GPU 데이터 저장소; 생성자: {new DataTexture()}
        동작:
            channels가 3이면 4로 바꾸고 배열·크기·format·type을 계산하여 기반 텍스처를 만든다.
            _data에 CPU 배열, _channels·_pixelsPerInstance와 원소 stride를 저장한다.
            dirty 행·행별 최소 최대 열 배열과 재사용 range·전체 range·마지막 업로드 통계를 초기화한다.
            uniformMap은 참조로 보관하고 fragment 조회 여부와 부분 갱신 기본값을 저장한다.
            _needsUpdate를 true, _lastWidth를 -1로 두고 needsUpdate를 설정하여 최초 업로드를 요청한다.

    resize(count: number) -> void
        의존: DataTexture — 크기 교체; 함수: {dispose()}; 속성 읽기·쓰기: {image}
        동작:
            count에서 새 한 변 길이를 구하고 현재 image.width와 같으면 종료한다.
            새 CPU 배열에 기존 버퍼의 새 길이와 기존 길이 중 작은 범위만 복사한다.
            dirty 추적 배열을 새 크기로 초기화하고 dispose로 GPU 등록을 해제한 뒤 image와 _data를 교체한다.
            전체 range 크기를 갱신하고 _lastWidth를 -1, _needsUpdate와 needsUpdate를 true로 설정한다.

    enqueueUpdate(index: number) -> void
        의존: DataTexture — 행 배치; 속성 읽기: {image}
        동작:
            _needsUpdate를 true로 설정하고 partialUpdate가 false이면 종료한다.
            image.width와 인스턴스당 texel 수로 index의 행·열을 구한다.
            해당 행의 기존 dirty 범위와 이번 인스턴스 범위를 합치고 dirty 행 표식을 설정한다.

    bindToProgram(renderer, gl, programUniforms, materialUniforms, uniformName) -> void
        의존: WebGLRenderer — 텍스처 바인딩; 함수: {properties.get(), state.bindTexture()}
        동작:
            materialUniforms에 uniformName이 없으면 종료한다.
            uniform 값을 현재 텍스처로 설정하고 programUniforms의 slot을 구한다.
            slot이 undefined이면 종료하며, 그 외에는 renderer 속성의 WebGL 텍스처를 해당 slot에 바인딩한다.

    update(renderer: WebGLRenderer, materialProperties: object, uniformName: string) -> void
        의존:
            WebGLRenderer — 텍스처 초기화·속성; 함수: {properties.get(), initTexture()}; 속성 읽기: {capabilities.maxTextures}
            DataTexture — 버전·크기; 속성 읽기: {version, image}
        동작:
            _needsUpdate가 false이고 renderer 등록 버전이 현재 version과 같으면 종료한다.
            GPU 텍스처가 없거나 image.width가 _lastWidth와 다르면 initTexture로 전체를 올리고 dirty 표식을 지우며 전체 업로드 통계를 기록한다.
            그 외에는 uniform slot을 구하고 undefined이면 마지막 texture unit을 사용한다.
                partialUpdate가 true이면 부분 갱신한다.
                partialUpdate가 false이면 전체 갱신한다.
                renderer 등록 버전을 현재 version으로 맞춘다.
            _lastWidth를 image.width로 맞추고 _needsUpdate를 false로 설정한다.

    getSlot(programUniforms: object, uniformName: string) -> number | undefined
        동작: programUniforms의 해당 uniform이 있으면 cache[0], 없으면 undefined를 반환한다.

    updateFull(textureProperties: object, renderer: object, slot: number) -> void
        의존: DataTexture — 전체 범위; 속성 읽기: {image}
        동작:
            재사용하는 전체 range를 image의 전체 행·열 크기로 맞춘 뒤 전송한다.
            dirty 행 표식을 모두 지운다.

    updatePartial(textureProperties: object, renderer: object, slot: number) -> void
        동작:
            dirty 행을 병합한 범위 배열을 구한다.
            범위가 비었으면 호출·행·픽셀·range 수를 0, full·usedUnpackWindow를 false로 기록하고 종료한다.
            범위들을 전송한 뒤 dirty 행 표식을 모두 지운다.

    getUpdateRowsInfo() -> Array<object>
        의존: DataTexture — 사각형 크기; 속성 읽기: {image}
        동작:
            dirty 행을 순회하여 연속된 행과 그 행들의 최소·최대 dirty 열을 재사용 range 배열로 만든다.
            range가 0 또는 1개이면 즉시 그 배열을 반환한다.
            maxMergeGapRows는 Infinity를 유지하고 유한 값은 0 이상 정수, 그 외는 2를 사용한다.
            설정 이하의 빈 행을 사이에 둔 인접 range들을 병합한다.
            maxUpdateCalls는 Infinity를 유지하고 유한 값은 1 이상 정수, 그 외는 8을 사용한다.
            range 개수가 상한을 넘으면 가장 작은 행 간격부터 병합한다.
            병합 사각형의 픽셀 합이 전체 픽셀 수에 fullUpdateRowRatio를 곱한 값 이상이면 전체 range 하나로 바꾼다.
            비율은 유한 값이면 0~1로 제한하고 그 외는 0.8을 사용하며, 최종 재사용 배열을 반환한다.

    #mergeUpdateRangesAt(ranges: Array<object>, rangeCount: number, index: number) -> number
        동작: index의 두 인접 범위를 감싸는 사각형을 앞 범위에 저장하고 뒤 항목을 당긴 다음 rangeCount에서 1을 뺀 값을 반환한다.

    updateRows(textureProperties: object, renderer: object, info: Array<object>, slot: number) -> void
        의존:
            WebGLRenderer — context·상태·확장; 함수: {getContext(), state.activeTexture(), state.bindTexture(), state.pixelStorei()}; 속성 읽기: {extensions, capabilities}
            WebGLUtils — GL 형식; 생성자: {new WebGLUtils()}; 함수: {convert()}
            ColorManagement — 색 공간 판정; 정적 함수: {getPrimaries()}; 속성 읽기: {workingColorSpace}
            DataTexture — 전송 설정; 속성 읽기: {format, type, image, colorSpace, flipY, premultiplyAlpha, unpackAlignment}; 콜백: {onUpdate()}
            WebGL API — unpack 설정과 전송; 함수: {pixelStorei(), texSubImage2D()}
        동작:
            context와 형식 변환기를 준비하고 텍스처를 slot에 바인딩한다.
            작업·텍스처 색 공간의 primaries가 같거나 색 공간이 없으면 NONE, 그 외는 BROWSER_DEFAULT_WEBGL을 unpack 변환으로 선택한다.
            renderer.state.pixelStorei가 함수이면 해당 상태 API로, 없으면 context의 pixelStorei로 flipY·premultiplyAlpha·unpackAlignment·색 공간 변환을 설정한다.
            unpack window의 행 길이와 시작 행·열도 같은 경로로 설정하여 Three.js 상태 캐시와 실제 GL 값을 일치시킨다.
            info가 비었으면 전송하지 않고, 각 범위의 행·개수가 유한하고 행이 이미지 안에 있으며 개수가 양수인 항목만 진행한다.
            행·열과 폭을 이미지 경계에 맞춰 제한하고 원본 CPU 배열을 넘는 범위는 건너뛴다.
            unpack window를 지원하면 원본 stride와 시작 행·열을 지정하여 사각형을 한 번 전송한다.
            지원하지 않고 전체 폭이면 원본 배열의 source offset으로 한 번 전송하고, 부분 폭이면 행별 subarray로 전송한다.
            unpack window를 사용했으면 ROW_LENGTH·SKIP_ROWS·SKIP_PIXELS를 0으로 돌린다.
            호출·행·픽셀·range 수와 전체 전송 여부를 _lastUploadStats에 기록하고 onUpdate가 있으면 현재 텍스처를 인수로 호출한다.

    setUniformAt(id, name, value) -> void
        동작: uniformMap의 offset·size를 찾아 size가 1이면 CPU 배열에 값을 대입하고 그 외에는 value.toArray로 기록한다. dirty 표시는 별도이다.

    getUniformAt(id, name, target)
        동작: uniformMap의 offset·size를 찾아 size가 1이면 CPU 배열의 값을 반환하고 그 외에는 target.fromArray의 결과를 반환한다.

    getUniformsGLSL(textureName, indexName, indexType) -> object
        동작: vertex와 fragment 코드를 각각 구하여 두 문자열을 갖는 객체로 반환한다.

    getUniformsVertexGLSL(textureName, indexName, indexType) -> string
        동작:
            _fetchUniformsInFragmentShader가 true이면 flat varying 인덱스 선언과 인덱스 대입만 반환한다.
            _fetchUniformsInFragmentShader가 false이면 texel 조회·uniform 복원과 varying 선언·대입 코드를 결합하여 vertex 코드를 반환한다.

    getUniformsFragmentGLSL(textureName, indexName, indexType) -> string
        동작:
            _fetchUniformsInFragmentShader가 false이면 varying 선언과 varying에서 local uniform으로 복원하는 코드를 반환한다.
            앞 분기에서 반환되지 않은 경우 flat varying 인덱스와 sampler 선언, texel 조회·uniform 복원 코드를 결합하여 반환한다.

    texelsFetchGLSL(textureName, indexName) -> string
        동작: textureSize와 인스턴스 인덱스에서 x·y를 계산하고 인스턴스당 texel 수만큼 texelFetch하여 ez_texel 변수에 저장하는 코드를 반환한다.

    getFromTexelsGLSL() -> string
        동작:
            uniformMap을 순회하여 offset과 채널 수로 시작 texel을 계산한다.
            mat3이면 세 texel의 rgb·a·rg·ba·r을 결합하고 mat4이면 네 texel을 결합한다.
            그 외에는 offset·size의 성분 문자열을 구하여 해당 형식의 변수를 만드는 코드를 누적해 반환한다.

    getVarying() -> object
        동작: uniformMap의 이름·type으로 flat varying 선언, local 값의 varying 대입, varying의 local 복원 문자열을 만들어 declareVarying·assignVarying·getVarying으로 반환한다.

    getUniformComponents(offset, size) -> string
        동작: offset을 채널 수로 나눈 나머지부터 size개의 r·g·b·a 성분을 연결하여 반환한다.

    override copy(source: SquareDataTexture) -> this
        의존: DataTexture — 기본 텍스처 복사; 함수: {copy()}; 속성 읽기: {image}
        동작:
            기반 copy를 호출하고 부분 갱신 정책·채널·stride를 복사한다.
            dirty 행·열 배열은 새 배열로 복사하고 range pool·전체 범위·통계는 현재 이미지 크기로 초기화한다.
            uniformMap은 참조로, fragment 조회 여부는 값으로 복사하고 현재 객체를 반환한다.
            _data를 source._data 또는 새 image.data로 교체하지는 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
