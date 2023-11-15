import * as vscode from "vscode";
import * as ejs from "ejs";
import * as fs from "fs";

export class ViewProvider implements vscode.WebviewViewProvider {
  private _extensionUri: vscode.Uri;
  private _viewType: string;
  private _cssFile?: string;
  private _scriptFile?: string;
  private _htmlFile?: string;
  private _callback?: (data: { type: string; value: any }) => void;

  public view?: vscode.WebviewView;

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
    this._callback = callback.bind(this);
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    console.log("Sidebar rendering");

    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "style",
        "common",
        "reset.css"
      )
    );

    const styleCommonUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "style",
        "common",
        "global.css"
      )
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

    const nonce = getNonce();

    return ejs.render(
      html,
      {
        script,
        styleResetUri,
        styleCommonUri,
        styleMainUri,
        cspSource: webview.cspSource,
        nonce,
      },
      {
        views: [tempalteUri],
      }
    );
  }
}

export class WebviewProvider implements vscode.WebviewViewProvider {
  private _extensionUri: vscode.Uri;
  private _viewType: string;
  private _cssFile?: string;
  private _scriptFile?: string;
  private _htmlFile?: string;

  constructor({
    extensionUri,
    viewType,
    cssFile,
    scriptFile,
    htmlFile,
  }: {
    extensionUri: vscode.Uri;
    viewType: string;
    cssFile: string;
    scriptFile: string;
    htmlFile: string;
  }) {
    this._extensionUri = extensionUri;
    this._viewType = viewType;
    this._cssFile = cssFile;
    this._scriptFile = scriptFile;
    this._htmlFile = htmlFile;
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(message => {
      vscode.window.showInformationMessage(`Received message from webview: ${message}`);
    });
  }

  public getViewType(): string {
    return this._viewType;
  }

  public getHtmlForWebview(webview: vscode.Webview): string {
    console.log("Webview Panel rendering");

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "pages",
        "result_style",
        this._cssFile ?? ""
      )
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "pages",
        "result_script",
        this._scriptFile ?? ""
      )
    );

    const htmlUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src",
        "pages",
        this._htmlFile ?? ""
      )
    ).path;

    const html = fs.readFileSync(htmlUri, "utf-8");

    const nonce = getNonce();

    return ejs.render(
      html,
      {
        styleUri,
        scriptUri,
        cspSource: webview.cspSource,
        nonce,
      }
    );
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}