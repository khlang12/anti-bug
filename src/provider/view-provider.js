"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewProvider = void 0;
const vscode = require("vscode");
const ejs = require("ejs");
const fs = require("fs");
class ViewProvider {
    constructor({ extensionUri, viewType, cssFile, scriptFile, htmlFile, initialData, }) {
        this._extensionUri = extensionUri;
        this._viewType = viewType;
        this._cssFile = cssFile;
        this._scriptFile = scriptFile;
        this._htmlFile = htmlFile;
        this._initialData = initialData;
    }
    resolveWebviewView(webviewView, context, token) {
        this.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
        // handle message
        webviewView.webview.onDidReceiveMessage((data) => {
            if (this._callback) {
                this._callback(data);
            }
        });
    }
    getViewType() {
        return this._viewType;
    }
    setFiles({ cssFile, scriptFile, htmlFile, }) {
        this._cssFile = cssFile;
        this._scriptFile = scriptFile;
        this._htmlFile = htmlFile;
    }
    setInitialData(data) {
        this._initialData = data;
    }
    setCss(file) {
        this._cssFile = file;
    }
    setScript(file) {
        this._scriptFile = file;
    }
    setHtml(file) {
        this._htmlFile = file;
    }
    setListner(callback) {
        this._callback = callback.bind(this);
    }
    getHtmlForWebview(webview) {
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "src", "style", "reset.css"));
        const styleCommonUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "src", "style", "common.css"));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "src", "style", this._cssFile ?? ""));
        const tempalteUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "src", "template", "common")).path;
        const htmlUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "src", "template", this._htmlFile ?? "")).path;
        const html = fs.readFileSync(htmlUri, "utf8");
        const script = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "src", "controller", this._scriptFile ?? ""));
        const nonce = this.getNonce();
        return ejs.render(html, {
            script,
            styleResetUri,
            styleCommonUri,
            styleMainUri,
            ...this._initialData,
            cspSource: webview.cspSource,
            nonce,
        }, {
            views: [tempalteUri],
        });
    }
    getNonce() {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
exports.ViewProvider = ViewProvider;
//# sourceMappingURL=view-provider.js.map