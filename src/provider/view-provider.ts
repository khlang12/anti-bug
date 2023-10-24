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
    cssFile,
    scriptFile,
    htmlFile,
  }: {
    extensionUri: vscode.Uri;
    viewType: string;
    cssFile?: string;
    scriptFile?: string;
    htmlFile?: string;
  }) {
    this._extensionUri = extensionUri;
    this._viewType = viewType;
    this._cssFile = cssFile;
    this._scriptFile = scriptFile;
    this._htmlFile = htmlFile;
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

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // handle message
    webviewView.webview.onDidReceiveMessage((data) => {
      this._callback?.(data);
    });
  }

  public getViewType(): string {
    return this._viewType;
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

  public setListner(callback: (data: { type: string; value: any }) => void) {
    this._callback = callback;
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
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

    const tempalteUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "src", "template", "common")
    ).path;

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

    return ejs.render(
      html,
      {
        script,
        styleResetUri,
        styleCommonUri,
        styleMainUri,
        ...this._data,
        cspSource: webview.cspSource,
        nonce,
      },
      {
        views: [tempalteUri],
      }
    );
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
