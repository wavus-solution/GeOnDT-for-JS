import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/html/html.contribution';
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution';
import * as monacoTypescript from 'monaco-editor/esm/vs/language/typescript/monaco.contribution';
import 'monaco-editor/esm/vs/language/html/monaco.contribution';
import 'monaco-editor/esm/vs/language/css/monaco.contribution';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import TypeScriptWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';

self.MonacoEnvironment = {
    /**
     * 편집 언어에 맞는 Monaco Worker를 생성합니다.
     * @param {string} _moduleId Monaco 내부 모듈 ID
     * @param {string} label 언어 Worker 라벨
     * @returns {Worker} 언어별 Worker
     */
    getWorker(_moduleId, label) {
        if (label === 'typescript' || label === 'javascript') return new TypeScriptWorker();
        if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker();
        if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker();
        return new EditorWorker();
    }
};

window.monaco = monaco;

// ESM 빌드의 TypeScript Contribution은 monaco 객체에 자기를 연결하지 않고 export만 한다.
// monaco 0.55의 monaco.languages.typescript는 deprecated이면서 readonly로 선언돼 있고
// 최상위 monaco.typescript도 ESM 런타임에서는 채워지지 않으므로,
// monaco 객체를 고쳐 쓰지 않고 이 Module의 export를 그대로 넘겨 사용한다.
export {monaco, monacoTypescript};
