// PLT 시계열 예제의 로컬 ASCII 입력을 처리합니다.
let sourceFile = null;
let zoneList = [];
let groundValues = null;
const fieldNames = ['E', 'N', 'z', 'eta', 'u', 'v', 'vmag', 'h'];
const dynamicNames = ['eta', 'u', 'v', 'vmag', 'h'];
const decoder = new TextDecoder('utf-8', { fatal: true });

// 요청 종류에 따라 색인 또는 프레임 읽기를 실행하고 오류를 전달합니다.
// event: PLT Worker 프로토콜의 MessageEvent입니다. data.kind와 요청 또는 응답 데이터가 들어 있습니다.
self.onmessage = async function handleRequest(event) {
    const request = event.data;
    try {
        if (request.kind === 'open') await openSource(request.file);
        else if (request.kind === 'frame') await sendFrame(request.index, request.requestId);
        else throw new Error('지원하지 않는 Worker 요청입니다.');
    } catch (error) {
        self.postMessage({ kind: 'error', requestId: request.requestId, message: error.message });
    }
};

// 입력 파일을 색인하고 검증된 첫 형상과 원본 시간 목록을 전달합니다.
async function openSource(file) {
    if (!(file instanceof Blob) || !file.size) throw new Error('비어 있거나 잘못된 파일입니다.');
    sourceFile = file;
    zoneList = [];
    groundValues = null;
    await indexSource();
    validateZones();
    const geometry = await readGeometry();
    self.postMessage({ kind: 'ready', zones: zoneList, geometry },
        [geometry.e.buffer, geometry.n.buffer, geometry.z.buffer, geometry.indices.buffer]);
}

// 8MB 청크와 마지막 미완성 행만 유지하여 파일 전체의 행 위치를 찾습니다.
async function indexSource() {
    const chunkSize = 8 * 1024 * 1024;
    let carry = new Uint8Array(0);
    let lineNumber = 0;
    let variablesSeen = false;
    for (let offset = 0; offset < sourceFile.size; offset += chunkSize) {
        const chunk = new Uint8Array(await sourceFile.slice(offset, offset + chunkSize).arrayBuffer());
        const bytes = new Uint8Array(carry.length + chunk.length);
        bytes.set(carry);
        bytes.set(chunk, carry.length);
        const baseOffset = offset - carry.length;
        let start = 0;
        for (let i = 0; i < bytes.length; i++) {
            if (bytes[i] !== 10) continue;
            variablesSeen = indexLine(bytes.subarray(start, i), baseOffset + start,
                baseOffset + i + 1, ++lineNumber, variablesSeen);
            start = i + 1;
        }
        carry = bytes.slice(start);
        if (carry.length > 64 * 1024) throw new Error('행 길이가 예제 지원 범위를 초과합니다.');
        self.postMessage({ kind: 'progress', percent: Math.min(100,
            Math.round((offset + chunk.length) / sourceFile.size * 100)), zones: zoneList.length });
    }
    if (carry.length) indexLine(carry, sourceFile.size - carry.length,
        sourceFile.size, ++lineNumber, variablesSeen);
    if (!variablesSeen) throw new Error('ASCII VARIABLES 헤더를 찾지 못했습니다.');
}

// 숫자 행은 디코드 없이 개수를 세고, 헤더만 해석해 ZONE 범위를 기록합니다.
function indexLine(bytes, start, end, lineNumber, variablesSeen) {
    let first = 0;
    while (first < bytes.length && bytes[first] <= 32) first++;
    if (first === bytes.length) return variablesSeen;
    const code = bytes[first];
    if ((code >= 48 && code <= 57) || code === 43 || code === 45 || code === 46) {
        indexNumericRow(start, end, lineNumber);
        return variablesSeen;
    }
    const text = decoder.decode(bytes).replace(/^\uFEFF/, '').trim();
    if (/^TITLE\s*=/i.test(text)) return variablesSeen;
    if (/^VARIABLES\s*=/i.test(text)) {
        validateVariables(text);
        return true;
    }
    if (!variablesSeen) throw new Error(`변수 헤더 이전에 데이터가 있습니다 (${lineNumber}줄).`);
    indexHeader(text, lineNumber);
    return variablesSeen;
}

// 실제 자료의 변수 순서를 확인해 지원하지 않는 입력을 분명히 거부합니다.
function validateVariables(text) {
    const names = Array.from(text.matchAll(/"([^"]+)"/g), variableName);
    if (names.join(',') !== fieldNames.join(',')) {
        throw new Error('이 예제는 E,N,z,eta,u,v,vmag,h 순서의 시계열 PLT를 지원합니다.');
    }
}

// 정규식 결과에서 변수 이름을 반환합니다.
function variableName(match) { return match[1]; }

// ZONE·시간·공유 헤더를 누적하며 미지원 헤더를 오류로 처리합니다.
function indexHeader(text, lineNumber) {
    if (/^ZONE\s/i.test(text)) {
        if (zoneList.length >= 20000) throw new Error('ZONE 수 제한을 초과했습니다.');
        zoneList.push({ number: zoneList.length + 1, nodeCount: readHeaderInteger(text, 'N'),
            elementCount: readHeaderInteger(text, 'E'), nodeRows: 0, elementRows: 0,
            packing: /DATAPACKING\s*=\s*POINT\b/i.test(text) ? 'POINT' : 'unsupported',
            nodeStart: null, nodeEnd: null, elementStart: null, elementEnd: null,
            shared: false, time: null, strandId: null, headerLine: lineNumber });
        return;
    }
    const zone = zoneList[zoneList.length - 1];
    if (!zone) throw new Error(`ZONE이 없는 헤더입니다 (${lineNumber}줄).`);
    if (/^ZONETYPE\s*=\s*FEQUADRILATERAL\s*$/i.test(text)) { zone.zoneType = 'FEQUADRILATERAL'; return; }
    if (/^VARSHARELIST/i.test(text)) {
        if (!/^VARSHARELIST\s*=\s*\(\s*\[1-2\]\s*=\s*1\s*\)\s+CONNECTIVITYSHAREZONE\s*=\s*1\s*$/i.test(text)) {
            throw new Error(`ZONE ${zone.number}: 예제는 E/N과 연결의 ZONE 1 공유만 지원합니다.`);
        }
        zone.shared = true;
        return;
    }
    if (/^STRANDID/i.test(text)) {
        zone.strandId = readHeaderInteger(text, 'STRANDID');
        const match = text.match(/SOLUTIONTIME\s*=\s*(\S+)/i);
        if (!match) throw new Error('SOLUTIONTIME이 없습니다.');
        zone.time = checkedNumber(match[1]);
        return;
    }
    throw new Error(`지원하지 않는 헤더입니다 (${lineNumber}줄): ${text.slice(0, 100)}`);
}

// 헤더의 양의 정수 값을 읽고 배열 할당 제한을 확인합니다.
function readHeaderInteger(text, name) {
    const match = text.match(new RegExp(`\\b${name}\\s*=\\s*(\\d+)`, 'i'));
    const value = match ? Number(match[1]) : 0;
    if (!Number.isSafeInteger(value) || value < 1 || value > 10000000) {
        throw new Error(`잘못되거나 과도한 ${name} 값입니다.`);
    }
    return value;
}

// 노드와 연결 행 개수 및 원본 파일의 바이트 범위를 기록합니다.
function indexNumericRow(start, end, lineNumber) {
    const zone = zoneList[zoneList.length - 1];
    if (!zone) throw new Error(`ZONE 이전의 숫자입니다 (${lineNumber}줄).`);
    if (zone.nodeRows < zone.nodeCount) {
        if (zone.nodeStart === null) zone.nodeStart = start;
        zone.nodeEnd = end;
        zone.nodeRows++;
        return;
    }
    if (zone.shared || zone.elementRows >= zone.elementCount) {
        throw new Error(`ZONE ${zone.number}: 예상보다 많은 데이터 행입니다 (${lineNumber}줄).`);
    }
    if (zone.elementStart === null) zone.elementStart = start;
    zone.elementEnd = end;
    zone.elementRows++;
}

// 단일 STRAND·증가 시간·동일 격자·공유 참조 프로파일을 검사합니다.
function validateZones() {
    if (zoneList.length < 2) throw new Error('시간 정보가 있는 다중 ZONE 원본을 선택하세요.');
    const first = zoneList[0];
    for (const zone of zoneList) validateZone(zone, first);
}

// 한 ZONE의 개수와 메타데이터를 첫 ZONE 및 직전 시간과 대조합니다.
function validateZone(zone, first) {
    if (zone.packing !== 'POINT' || zone.zoneType !== 'FEQUADRILATERAL') throw new Error('POINT/FEQUADRILATERAL만 지원합니다.');
    if (zone.time === null || zone.strandId === null) throw new Error(`ZONE ${zone.number}: 시간/STRANDID가 없습니다.`);
    if (zone.nodeCount !== first.nodeCount || zone.elementCount !== first.elementCount || zone.strandId !== first.strandId) {
        throw new Error('동일 격자와 하나의 STRANDID가 필요합니다.');
    }
    if (zone.nodeRows !== zone.nodeCount || zone.elementRows !== (zone.shared ? 0 : zone.elementCount)) {
        throw new Error(`ZONE ${zone.number}: 노드 또는 연결 행 개수가 다릅니다.`);
    }
    if (zone.shared !== (zone.number > 1)) throw new Error('첫 ZONE 격자와 이후 ZONE의 공유 헤더가 필요합니다.');
    if (zone.number > 1 && zone.time <= zoneList[zone.number - 2].time) throw new Error('시간이 엄격히 증가해야 합니다.');
}

// 공백 숫자 토큰을 순서대로 읽는 iterator를 만듭니다.
function numericTokens(text) { return text.matchAll(/\S+/g); }

// 토큰의 존재와 유한한 실수 형식을 확인합니다.
function nextNumber(tokens) {
    const token = tokens.next();
    if (token.done) throw new Error('숫자 레코드가 부족합니다.');
    return checkedNumber(token.value[0]);
}

// 유한한 숫자만 반환하며 NaN/Infinity를 수용하지 않습니다.
function checkedNumber(token) {
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(token)) {
        throw new Error(`지원하지 않는 숫자 형식입니다: ${token}`);
    }
    const value = Number(token);
    if (!Number.isFinite(value)) throw new Error(`잘못된 숫자입니다: ${token}`);
    return value;
}

// 예상 개수 뒤에 남은 토큰이 없음을 확인합니다.
function requireEnd(tokens) {
    if (!tokens.next().done) throw new Error('예상보다 많은 숫자 토큰이 있습니다.');
}

// 첫 ZONE의 원본 double E/N/z와 삼각형 연결을 읽습니다.
async function readGeometry() {
    const zone = zoneList[0];
    const e = new Float64Array(zone.nodeCount);
    const n = new Float64Array(zone.nodeCount);
    groundValues = new Float64Array(zone.nodeCount);
    const tokens = numericTokens(await sourceFile.slice(zone.nodeStart, zone.nodeEnd).text());
    for (let i = 0; i < zone.nodeCount; i++) {
        e[i] = nextNumber(tokens);
        n[i] = nextNumber(tokens);
        groundValues[i] = nextNumber(tokens);
        for (let column = 3; column < 8; column++) nextNumber(tokens);
    }
    requireEnd(tokens);
    const indices = await readIndices(zone);
    return { e, n, z: groundValues.slice(), indices };
}

// 원본 1 기반 연결을 검사하고 c=d 삼각형/사각형을 0 기반 삼각형으로 변환합니다.
async function readIndices(zone) {
    const tokens = numericTokens(await sourceFile.slice(zone.elementStart, zone.elementEnd).text());
    const result = new Uint32Array(zone.elementCount * 6);
    let count = 0;
    for (let i = 0; i < zone.elementCount; i++) {
        const a = nextNodeId(tokens, zone.nodeCount);
        const b = nextNodeId(tokens, zone.nodeCount);
        const c = nextNodeId(tokens, zone.nodeCount);
        const d = nextNodeId(tokens, zone.nodeCount);
        validateElement(a, b, c, d);
        result[count++] = a; result[count++] = b; result[count++] = c;
        if (c !== d) { result[count++] = a; result[count++] = c; result[count++] = d; }
    }
    requireEnd(tokens);
    const used = result.subarray(0, count);
    return zone.nodeCount < 65536 ? new Uint16Array(used) : used.slice();
}

// 원본 연결 ID의 정수/범위를 확인한 뒤 0 기반으로 반환합니다.
function nextNodeId(tokens, nodeCount) {
    const token = tokens.next();
    if (token.done || !/^\+?\d+$/.test(token.value[0])) throw new Error('연결 번호는 정수 토큰이어야 합니다.');
    const id = Number(token.value[0]);
    if (!Number.isInteger(id) || id < 1 || id > nodeCount) throw new Error(`연결 번호 범위 오류: ${id}`);
    return id - 1;
}

// 지원하는 반복 삼각형과 네 고유 정점 사각형인지 검사합니다.
function validateElement(a, b, c, d) {
    const unique = new Set([a, b, c, d]).size;
    if ((c === d && unique !== 3) || (c !== d && unique !== 4)) throw new Error('지원하지 않는 퇴화 요소입니다.');
}

// 요청한 ZONE만 읽고 물리량을 Float32 배열로 전달합니다.
async function sendFrame(index, requestId) {
    if (!groundValues || !Number.isInteger(index) || !zoneList[index]) throw new Error('잘못된 프레임 요청입니다.');
    const zone = zoneList[index];
    const fields = {};
    for (const name of dynamicNames) fields[name] = new Float32Array(zone.nodeCount);
    const tokens = numericTokens(await sourceFile.slice(zone.nodeStart, zone.nodeEnd).text());
    for (let i = 0; i < zone.nodeCount; i++) readFrameNode(tokens, zone, fields, i);
    requireEnd(tokens);
    const buffers = dynamicNames.map(fieldBuffer.bind(null, fields));
    self.postMessage({ kind: 'frame', index, requestId, time: zone.time, fields }, buffers);
}

// 한 노드의 공유/비공유 행을 읽고 고정 지반 높이 계약을 검사합니다.
function readFrameNode(tokens, zone, fields, index) {
    if (!zone.shared) { nextNumber(tokens); nextNumber(tokens); }
    const z = nextNumber(tokens);
    if (z !== groundValues[index]) throw new Error(`ZONE ${zone.number}, NodeId ${index + 1}: z가 변경되었습니다.`);
    for (const name of dynamicNames) fields[name][index] = nextNumber(tokens);
}

// 전달할 필드의 ArrayBuffer를 반환합니다.
function fieldBuffer(fields, name) { return fields[name].buffer; }
