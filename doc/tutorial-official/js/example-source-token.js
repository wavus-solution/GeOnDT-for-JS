const TOKEN_ID_PATTERN = /^[A-Za-z][\w-]*(?:\.[A-Za-z][\w-]*)+$/;
const CODE_TOKEN_ATTRIBUTE = 'data-example-code-token';
const CODE_SOURCE_ATTRIBUTE = 'data-example-code-source';
const CODE_STATE_ATTRIBUTE = 'data-example-code-state';
const MARKER_PATTERN = /^\s*\/\/\s*@example-code:(start|end)\s+(\S+)\s*$/;
/** 도움말 Markdown에서 Source Token을 참조하는 표기입니다. */
const MARKDOWN_REFERENCE_PATTERN = /\{\{example-code:([^}:\s]+)(?::([^}\s]+))?}}/g;

/**
 * Source 내부 들여쓰기를 유지하되 Snippet 전체에 공통인 들여쓰기는 제거합니다.
 *
 * @param {string[]} lines Token 내부 Source 줄
 * @returns {string} 표시용 Source Code
 */
function normalizeSnippetIndentation(lines) {
    const contentLines = lines.filter(line => line.trim());
    const indentation = contentLines.length
        ? Math.min(...contentLines.map(line => line.match(/^\s*/)?.[0].length || 0))
        : 0;
    return lines.map(line => line.trim() ? line.slice(indentation) : '').join('\n');
}

/**
 * Example JavaScript Source에서 코드 Token을 추출합니다.
 *
 * @param {Array<Record<string, unknown>>} sources Source Manifest 항목
 * @returns {Record<string, Record<string, unknown>>} Token ID별 실제 코드 위치
 */
export function parseExampleCodeTokens(sources) {
    /** @type {Record<string, Record<string, unknown>>} */
    const tokens = {};

    for (const source of sources || []) {
        if (source?.language !== 'javascript') continue;
        const sourceId = String(source.id || '');
        const file = String(source.path || '');
        const label = String(source.label || file || sourceId);
        const lines = String(source.content || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n');
        /** @type {{id: string, markerLine: number}|undefined} */
        let active;

        for (const [index, line] of lines.entries()) {
            const marker = line.match(MARKER_PATTERN);
            if (!marker) {
                if (/^\s*\/\//.test(line) && line.includes('@example-code:')) {
                    throw new Error(`[Example Code] Invalid marker:\n\n${file}:${index + 1}`);
                }
                continue;
            }
            const [, type, tokenId] = marker;
            if (!TOKEN_ID_PATTERN.test(tokenId)) {
                throw new Error(`[Example Code] Invalid token ID:\n\n${tokenId}`);
            }
            if (type === 'start') {
                if (active) {
                    throw new Error(`[Example Code] Nested token is not supported:\n\nouter: ${active.id}\ninner: ${tokenId}`);
                }
                if (tokens[tokenId]) throw new Error(`[Example Code] Duplicate token:\n\n${tokenId}`);
                active = {id: tokenId, markerLine: index + 1};
                continue;
            }
            if (!active || active.id !== tokenId) {
                throw new Error(`[Example Code] Unexpected end marker:\n\n${tokenId}`);
            }

            const code = normalizeSnippetIndentation(lines.slice(active.markerLine, index));
            if (!code.trim()) throw new Error(`[Example Code] Empty token:\n\n${tokenId}`);
            tokens[tokenId] = {
                id: tokenId,
                sourceId,
                file,
                label,
                startLine: active.markerLine + 1,
                endLine: index,
                code
            };
            active = undefined;
        }

        if (active) throw new Error(`[Example Code] Missing end marker:\n\n${active.id}`);
    }

    return tokens;
}

/**
 * API Help 항목의 표시 Mode를 결정합니다.
 *
 * @param {Record<string, unknown>} entry API Help 항목
 * @returns {'source'|'dynamic'|'hybrid'} 표시 Mode
 */
export function resolveApiHelpMode(entry) {
    const explicitMode = String(entry?.mode || '');
    if (explicitMode === 'source' || explicitMode === 'dynamic' || explicitMode === 'hybrid') return explicitMode;
    const hasSource = Boolean(entry?.source);
    const hasDynamic = typeof entry?.getCode === 'function' || Object.prototype.hasOwnProperty.call(entry || {}, 'code');
    return hasSource && hasDynamic ? 'hybrid' : hasSource ? 'source' : 'dynamic';
}

/**
 * API Help Registry가 유효한 JavaScript Source Token만 참조하는지 확인합니다.
 *
 * @param {Record<string, Record<string, unknown>>} registry API Help Registry
 * @param {Record<string, Record<string, unknown>>} tokens Source Token Registry
 * @param {Array<Record<string, unknown>>} sources Source Manifest 항목
 * @returns {true} 검증 완료
 */
export function validateApiHelpSourceReferences(registry, tokens, sources) {
    const sourceMap = Object.fromEntries((sources || []).map(source => [source.id, source]));

    for (const [helpKey, entry] of Object.entries(registry || {})) {
        const mode = resolveApiHelpMode(entry);
        const reference = entry?.source && typeof entry.source === 'object'
            ? /** @type {Record<string, unknown>} */ (entry.source)
            : undefined;
        if ((mode === 'source' || mode === 'hybrid') && !reference) {
            throw new Error(`[API Help] Source reference is required\n\nhelp key: ${helpKey}`);
        }
        if (!reference) continue;
        const sourceId = String(reference.sourceId || '');
        const tokenId = String(reference.token || '');
        const source = sourceMap[sourceId];
        if (!source) throw new Error(`[API Help] Source ID not found\n\nhelp key: ${helpKey}\nsource: ${sourceId}`);
        if (source.language !== 'javascript') {
            throw new Error(`[API Help] Source is not JavaScript\n\nhelp key: ${helpKey}\nsource: ${sourceId}`);
        }
        const token = tokens?.[tokenId];
        if (!token) {
            throw new Error(`[API Help] Source token not found\n\nhelp key: ${helpKey}\nsource: ${sourceId}\ntoken: ${tokenId}`);
        }
        if (token.sourceId !== sourceId) {
            throw new Error(`[API Help] Token belongs to another Source\n\nhelp key: ${helpKey}\nsource: ${sourceId}\ntoken: ${tokenId}\nactual source: ${token.sourceId}`);
        }
    }

    return true;
}

/**
 * 도움말 Markdown이 참조하는 Source Token 표기를 모두 읽습니다.
 *
 * 치환 전에 참조를 정적으로 검증할 수 있도록 원문 위치도 함께 반환합니다.
 *
 * @param {string} markdown Markdown 원문
 * @returns {Array<{reference: string, sourceId: string, tokenId: string, index: number}>} Token 참조 목록
 */
export function collectExampleCodeReferences(markdown) {
    const references = [];
    for (const match of String(markdown || '').matchAll(MARKDOWN_REFERENCE_PATTERN)) {
        const [reference, first, second] = match;
        references.push({
            reference,
            sourceId: second ? first : '',
            tokenId: second || first,
            index: match.index || 0
        });
    }
    return references;
}

/**
 * Markdown의 Source Token 참조를 Token 참조 Placeholder로 치환합니다.
 * 생성 HTML에는 실제 코드를 넣지 않고, Runtime이 canonical Source에서 읽은
 * 현재 Token Registry로 renderExampleCodeReferences()가 코드를 채웁니다.
 *
 * @param {string} markdown Markdown 원문
 * @param {Record<string, Record<string, unknown>>} tokens Source Token Registry
 * @returns {string} Placeholder가 반영된 Markdown
 */
export function replaceExampleCodeReferences(markdown, tokens) {
    return String(markdown || '').replace(
        MARKDOWN_REFERENCE_PATTERN,
        (reference, first, second) => {
            const sourceId = second ? first : '';
            const tokenId = second || first;
            const token = tokens?.[tokenId];
            if (!token) throw new Error(`[Example Code] Token not found in Markdown:\n\n${tokenId}`);
            if (sourceId && token.sourceId !== sourceId) {
                throw new Error(`[Example Code] Markdown token belongs to another Source:\n\nsource: ${sourceId}\ntoken: ${tokenId}\nactual source: ${token.sourceId}`);
            }
            // 속성에는 사용자 입력이 아니라 Token ID 규칙과 Manifest Source ID 규칙으로 검증된 값만 넣는다.
            return `<pre><code class="language-javascript" ${CODE_TOKEN_ATTRIBUTE}="${token.id}" ${CODE_SOURCE_ATTRIBUTE}="${token.sourceId}"></code></pre>`;
        }
    );
}

/**
 * 도움말 DOM의 Token 참조 Placeholder를 현재 Source Token 코드로 채웁니다.
 * 코드가 HTML로 해석되지 않도록 textContent만 사용합니다.
 *
 * @param {ParentNode|null|undefined} root 도움말 DOM 루트
 * @param {Record<string, Record<string, unknown>>} tokens 현재 Source Token Registry
 * @returns {number} 코드를 채운 Placeholder 수
 */
export function renderExampleCodeReferences(root, tokens) {
    const targets = root?.querySelectorAll?.(`[${CODE_TOKEN_ATTRIBUTE}]`);
    if (!targets) return 0;
    let rendered = 0;

    for (const target of targets) {
        const tokenId = String(target.getAttribute(CODE_TOKEN_ATTRIBUTE) || '');
        const sourceId = String(target.getAttribute(CODE_SOURCE_ATTRIBUTE) || '');
        const token = tokens?.[tokenId];
        if (!token || (sourceId && token.sourceId !== sourceId)) {
            // Source Token을 해석하지 못해도 나머지 도움말은 그대로 읽을 수 있어야 한다.
            target.textContent = `[Example Code] 현재 Source에서 Token을 찾을 수 없습니다: ${tokenId}`;
            target.setAttribute(CODE_STATE_ATTRIBUTE, 'missing');
            continue;
        }
        target.textContent = String(token.code || '');
        target.removeAttribute(CODE_STATE_ATTRIBUTE);
        rendered += 1;
    }

    return rendered;
}
