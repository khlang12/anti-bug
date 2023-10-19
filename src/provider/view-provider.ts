import * as vscode from "vscode";
import * as ejs from "ejs";
import * as fs from "fs";

export class ViewProvider implements vscode.WebviewViewProvider {
  private _extensionUri: vscode.Uri;
  private _viewType: string;
  private _view?: vscode.WebviewView;
  private _cssFile?: string;
  private _scriptFile?: string;
  private _htmlFile?: string;
  private _callback?: (data: { type: string; value: any }) => void;
  private _data?: {
    [key: string]: any;
  };
  constructor({
    extensionUri,
    viewType,
  }: {
    extensionUri: vscode.Uri;
    viewType: string;
  }) {
    this._extensionUri = extensionUri;
    this._viewType = viewType;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // handle message
    webviewView.webview.onDidReceiveMessage((data) => {
      this._callback?.(data);
    });
  }

  public setFunction(callback: (data: { type: string; value: any }) => void) {
    this._callback = callback;
  }

  public getViewType(): string {
    return this._viewType;
  }

  public addText() {
    if (this._view) {
      this._view.show?.(true);
      this._view.webview.postMessage({ type: "addText" });
    }
  }

  public setFiles({
    cssFile,
    scriptFile,
    htmlFile,
  }: {
    cssFile: string;
    scriptFile: string;
    htmlFile: string;
  }) {
    this._cssFile = cssFile;
    this._scriptFile = scriptFile;
    this._htmlFile = htmlFile;
  }

  public setData(data: { [key: string]: any }) {
    this._data = data;
  }

  public setCss(file: string) {
    this._cssFile = file;
  }

  public setScript(file: string) {
    this._scriptFile = file;
  }

  public setHtml(file: string) {
    this._htmlFile = file;
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "src", "style", "reset.css")
    );

    const styleCommonUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "src", "style", "common.css")
    );

    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "style",
        this._cssFile ?? ""
      )
    );

    const htmlUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "template",
        this._htmlFile ?? ""
      )
    ).path;
    const html = fs.readFileSync(htmlUri, "utf8");

    const script = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "controller",
        this._scriptFile ?? ""
      )
    );

    const nonce = this.getNonce();
    return ejs.render(html, {
      script,
      styleResetUri,
      styleCommonUri,
      styleMainUri,
      ...this._data,
      cspSource: webview.cspSource,
      nonce,
    });
  }

  private getNonce() {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
