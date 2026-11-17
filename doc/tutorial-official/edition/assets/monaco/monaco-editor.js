import { a as e, c as t, d as n, f as r, g as i, h as a, i as o, l as s, m as c, n as l, o as u, p as d, r as f, s as p, t as m, u as h } from "./chunks/toggleHighContrast-CDBvUtAQ.js";
import { t as g } from "./chunks/monaco.contribution-Gn-Pqpqd.js";
//#region node_modules/monaco-editor/esm/vs/editor/internal/initialize.js
function _() {
	return c;
}
globalThis.MonacoEnvironment?.globalAPI && (globalThis.monaco = _());
//#endregion
//#region node_modules/monaco-editor/esm/vs/editor/editor.api.js
var v = /* @__PURE__ */ i({
	CancellationTokenSource: () => m,
	Emitter: () => l,
	KeyCode: () => f,
	KeyMod: () => o,
	MarkerSeverity: () => e,
	MarkerTag: () => u,
	Position: () => p,
	Range: () => t,
	Selection: () => s,
	SelectionDirection: () => h,
	Token: () => n,
	Uri: () => r,
	editor: () => d,
	languages: () => a
}), y = {}, b = {}, x = class e {
	static getOrCreate(t) {
		return b[t] || (b[t] = new e(t)), b[t];
	}
	constructor(e) {
		this._languageId = e, this._loadingTriggered = !1, this._lazyLoadPromise = new Promise((e, t) => {
			this._lazyLoadPromiseResolve = e, this._lazyLoadPromiseReject = t;
		});
	}
	load() {
		return this._loadingTriggered || (this._loadingTriggered = !0, y[this._languageId].loader().then((e) => this._lazyLoadPromiseResolve(e), (e) => this._lazyLoadPromiseReject(e))), this._lazyLoadPromise;
	}
};
function S(e) {
	let t = e.id;
	y[t] = e, a.register(e);
	let n = x.getOrCreate(t);
	a.registerTokensProviderFactory(t, { create: async () => (await n.load()).language }), a.onLanguageEncountered(t, async () => {
		let e = await n.load();
		a.setLanguageConfiguration(t, e.conf);
	});
}
//#endregion
//#region node_modules/monaco-editor/esm/vs/basic-languages/css/css.contribution.js
S({
	id: "javascript",
	extensions: [
		".js",
		".es6",
		".jsx",
		".mjs",
		".cjs"
	],
	firstLine: "^#!.*\\bnode",
	filenames: ["jakefile"],
	aliases: [
		"JavaScript",
		"javascript",
		"js"
	],
	mimetypes: ["text/javascript"],
	loader: () => import("./chunks/javascript-DFHVJT21.js")
}), S({
	id: "html",
	extensions: [
		".html",
		".htm",
		".shtml",
		".xhtml",
		".mdoc",
		".jsp",
		".asp",
		".aspx",
		".jshtm"
	],
	aliases: [
		"HTML",
		"htm",
		"html",
		"xhtml"
	],
	mimetypes: [
		"text/html",
		"text/x-jshtm",
		"text/template",
		"text/ng-template"
	],
	loader: () => import("./chunks/html-3Lzq13Ei.js")
}), S({
	id: "css",
	extensions: [".css"],
	aliases: ["CSS", "css"],
	mimetypes: ["text/css"],
	loader: () => import("./chunks/css-C4rVu8Bf.js")
});
//#endregion
//#region node_modules/monaco-editor/esm/vs/language/html/monaco.contribution.js
var C = class {
	constructor(e, t, n) {
		this._onDidChange = new l(), this._languageId = e, this.setOptions(t), this.setModeConfiguration(n);
	}
	get onDidChange() {
		return this._onDidChange.event;
	}
	get languageId() {
		return this._languageId;
	}
	get options() {
		return this._options;
	}
	get modeConfiguration() {
		return this._modeConfiguration;
	}
	setOptions(e) {
		this._options = e || /* @__PURE__ */ Object.create(null), this._onDidChange.fire(this);
	}
	setModeConfiguration(e) {
		this._modeConfiguration = e || /* @__PURE__ */ Object.create(null), this._onDidChange.fire(this);
	}
}, w = {
	format: {
		tabSize: 4,
		insertSpaces: !1,
		wrapLineLength: 120,
		unformatted: "default\": \"a, abbr, acronym, b, bdo, big, br, button, cite, code, dfn, em, i, img, input, kbd, label, map, object, q, samp, select, small, span, strong, sub, sup, textarea, tt, var",
		contentUnformatted: "pre",
		indentInnerHtml: !1,
		preserveNewLines: !0,
		maxPreserveNewLines: void 0,
		indentHandlebars: !1,
		endWithNewline: !1,
		extraLiners: "head, body, /html",
		wrapAttributes: "auto"
	},
	suggest: {},
	data: { useDefaultDataProvider: !0 }
};
function T(e) {
	return {
		completionItems: !0,
		hovers: !0,
		documentSymbols: !0,
		links: !0,
		documentHighlights: !0,
		rename: !0,
		colors: !0,
		foldingRanges: !0,
		selectionRanges: !0,
		diagnostics: e === E,
		documentFormattingEdits: e === E,
		documentRangeFormattingEdits: e === E
	};
}
var E = "html", D = "handlebars", O = "razor";
A(E, w, T(E)).defaults, A(D, w, T(D)).defaults, A(O, w, T(O)).defaults;
function k() {
	return import("./chunks/htmlMode-CrovRK1O.js");
}
function A(e, t = w, n = T(e)) {
	let r = new C(e, t, n), i, o = a.onLanguage(e, async () => {
		i = (await k()).setupMode(r);
	});
	return {
		defaults: r,
		dispose() {
			o.dispose(), i?.dispose(), i = void 0;
		}
	};
}
//#endregion
//#region node_modules/monaco-editor/esm/vs/language/css/monaco.contribution.js
var j = class {
	constructor(e, t, n) {
		this._onDidChange = new l(), this._languageId = e, this.setOptions(t), this.setModeConfiguration(n);
	}
	get onDidChange() {
		return this._onDidChange.event;
	}
	get languageId() {
		return this._languageId;
	}
	get modeConfiguration() {
		return this._modeConfiguration;
	}
	get diagnosticsOptions() {
		return this.options;
	}
	get options() {
		return this._options;
	}
	setOptions(e) {
		this._options = e || /* @__PURE__ */ Object.create(null), this._onDidChange.fire(this);
	}
	setDiagnosticsOptions(e) {
		this.setOptions(e);
	}
	setModeConfiguration(e) {
		this._modeConfiguration = e || /* @__PURE__ */ Object.create(null), this._onDidChange.fire(this);
	}
}, M = {
	validate: !0,
	lint: {
		compatibleVendorPrefixes: "ignore",
		vendorPrefix: "warning",
		duplicateProperties: "warning",
		emptyRules: "warning",
		importStatement: "ignore",
		boxModel: "ignore",
		universalSelector: "ignore",
		zeroUnits: "ignore",
		fontFaceProperties: "warning",
		hexColorLength: "error",
		argumentsInColorFunction: "error",
		unknownProperties: "warning",
		ieHack: "ignore",
		unknownVendorSpecificProperties: "ignore",
		propertyIgnoredDueToDisplay: "warning",
		important: "ignore",
		float: "ignore",
		idSelector: "ignore"
	},
	data: { useDefaultDataProvider: !0 },
	format: {
		newlineBetweenSelectors: !0,
		newlineBetweenRules: !0,
		spaceAroundSelectorSeparator: !1,
		braceStyle: "collapse",
		maxPreserveNewLines: void 0,
		preserveNewLines: !0
	}
}, N = {
	completionItems: !0,
	hovers: !0,
	documentSymbols: !0,
	definitions: !0,
	references: !0,
	documentHighlights: !0,
	rename: !0,
	colors: !0,
	foldingRanges: !0,
	diagnostics: !0,
	selectionRanges: !0,
	documentFormattingEdits: !0,
	documentRangeFormattingEdits: !0
}, P = new j("css", M, N), F = new j("scss", M, N), I = new j("less", M, N);
function L() {
	return import("./chunks/cssMode-B64LMBkB.js");
}
a.onLanguage("less", () => {
	L().then((e) => e.setupMode(I));
}), a.onLanguage("scss", () => {
	L().then((e) => e.setupMode(F));
}), a.onLanguage("css", () => {
	L().then((e) => e.setupMode(P));
});
//#endregion
//#region node_modules/monaco-editor/esm/vs/editor/editor.worker.js?worker
function R(e) {
	return new Worker(new URL("assets/editor.worker-BsqKV1DS.js", import.meta.url).href, { name: e?.name });
}
//#endregion
//#region node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js?worker
function z(e) {
	return new Worker(new URL("assets/ts.worker-CYhxGg0r.js", import.meta.url).href, { name: e?.name });
}
//#endregion
//#region node_modules/monaco-editor/esm/vs/language/html/html.worker.js?worker
function B(e) {
	return new Worker(new URL("assets/html.worker-CO5LvJpF.js", import.meta.url).href, { name: e?.name });
}
//#endregion
//#region node_modules/monaco-editor/esm/vs/language/css/css.worker.js?worker
function V(e) {
	return new Worker(new URL("assets/css.worker-niORQtzO.js", import.meta.url).href, { name: e?.name });
}
self.MonacoEnvironment = { getWorker(e, t) {
	return t === "typescript" || t === "javascript" ? new z() : t === "html" || t === "handlebars" || t === "razor" ? new B() : t === "css" || t === "scss" || t === "less" ? new V() : new R();
} }, window.monaco = v;
//#endregion
export { v as monaco, g as monacoTypescript };
