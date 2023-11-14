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

// export class WebviewProvider implements vscode.WebviewViewProvider {
//   private _panel: string | undefined;
//   private _title: string;
//   private _extensionUri: vscode.Uri;
//   private _viewType: string;
//   private _cssFile?: string;
//   private _scriptFile?: string;
//   private _htmlFile: string;
//   private _callback?: (data: { type: string; value: any }) => void;

//   public view?: vscode.WebviewView;

//   constructor({
//     panel,
//     title,
//     extensionUri,
//     viewType,
//     cssFile,
//     scriptFile,
//     htmlFile,
//   }: {
//     panel: string;
//     title: string;
//     extensionUri: vscode.Uri;
//     viewType: string;
//     cssFile?: string;
//     scriptFile?: string;
//     htmlFile: string;
//   }) {
//     this._panel = panel;
//     this._title = title;
//     this._extensionUri = extensionUri;
//     this._viewType = viewType;
//     this._cssFile = cssFile;
//     this._scriptFile = scriptFile;
//     this._htmlFile = htmlFile;
//   }

//   public resolveWebviewView(
//     webviewView: vscode.WebviewView,
//     context: vscode.WebviewViewResolveContext<unknown>,
//     token: vscode.CancellationToken
//   ): void | Thenable<void> {
//     this.view = webviewView;

//     webviewView.webview.options = {
//       enableScripts: true,
//       localResourceRoots: [this._extensionUri],
//     };

//     webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

//     webviewView.webview.onDidReceiveMessage((data) => {
//       if (this._callback) {
//         this._callback(data);
//       }
//     });
//   }

//   public getViewType(): string {
//     return this._viewType;
//   }

//   public setFiles ({
//     cssFile,
//     scriptFile,
//     htmlFile,
//   }: {
//     cssFile?: string;
//     scriptFile?: string;
//     htmlFile: string;
//   }) {
//     this._cssFile = cssFile;
//     this._scriptFile = scriptFile;
//     this._htmlFile = htmlFile;
//   }

//   public setCss(file: string) {
//     this._cssFile = file;
//   }

//   public setScript(file: string) {
//     this._scriptFile = file;
//   }

//   public setHtml(file: string) {
//     this._htmlFile = file;
//   }

//   public setListner(callback: (data: { type: string; value: any }) => void) {
//     this._callback = callback.bind(this);
//   }

//   private getHtmlForWebview(webview: vscode.Webview): string {
//     console.log("Webview rendering");

//     const htmlUri = webview.asWebviewUri(
//       vscode.Uri.joinPath(
//         this._extensionUri,
//         "src",
//         "pages",
//         this._htmlFile ?? ""
//       )
//     );
//     const html = fs.readFileSync(htmlUri.fsPath, "utf8");

//     const styleUri = webview.asWebviewUri(
//       vscode.Uri.joinPath(
//         this._extensionUri,
//         "src",
//         "pages",
//         "result_style",
//         this._cssFile ?? ""
//       )
//     );

//     const script = webview.asWebviewUri(
//       vscode.Uri.joinPath(
//         this._extensionUri,
//         "src",
//         "pages",
//         "result_script",
//         this._scriptFile ?? ""
//       )
//     );

//     const nonce = this.getNonce();

//     return ejs.render(
//       html,
//       {
//         styleUri: styleUri,
//         script: script,
//         nonce,
//       }
//     );
//   }

//   private getNonce() {
//     let text = "";
//     const possible =
//       "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//     for (let i = 0; i < 32; i++) {
//       text += possible.charAt(Math.floor(Math.random() * possible.length));
//     }
//     return text;
//   }
// }

// export class WebviewProvider implements vscode.WebviewViewProvider {
//   public static readonly viewType = 'antibug.resultView';
//   private _view?: vscode.WebviewView;
//   private _callback?: (data: { type: string; value: any }) => void;

//   constructor(
//     private readonly _extensionUri: vscode.Uri,
//   ) { }

//   public resolveWebviewView(
//     webviewView: vscode.WebviewView,
//     context: vscode.WebviewViewResolveContext,
//     _token: vscode.CancellationToken) {
//     this._view = webviewView;

//     webviewView.webview.options = {
//       enableScripts: true,
//       localResourceRoots: [this._extensionUri]
//     };

//     webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

//     // webviewView.webview.onDidReceiveMessage(data => {
//     //   switch (data.type) {
//     //     case "compiileResult":
//     //       {
//     //         break;
//     //       }
//     //     case "deployResult":
//     //       {
//     //         break;
//     //       }
//     //     case "securityResult":
//     //       {
//     //         break;
//     //       }
//     //   }
//     // });
//   }

//   // public compileResult() {
//   //   console.log("view-provider.ts -> WebviewProvider -> compileResult 실행중...");

//   // }

//   // public deployResult() {
//   //   console.log("view-provider.ts -> WebviewProvider -> deployResult 실행중...");

//   // }

//   // public securityResult() {
//   //   console.log("view-provider.ts -> WebviewProvider -> securityResult 실행중...");

//   // }


//   public setListner(callback: (data: { type: string; value: any }) => void) {
//     this._callback = callback.bind(this);
//   }

//   public getHtmlForWebview(webview: vscode.Webview,) {    // 여기 js css 루트도 바꿔야함

//     const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '../..', 'src/pages/result_script/deploy_result.js'));
//     const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '../..', 'src/pages/result_style/deploy_result.css'));

//     const nonce = getNonce();

//     return `<!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
//       <script nonce="${nonce}" src="${scriptUri}"></script>
//       <title>Deploy & Function interaction</title>
//     </head>
//     <body>
//       <div class="container">
//         <ul class="tabs">
//             <li class="tab-link current" data-tab="tab-1">function operation</li>
//             <li class="tab-link" data-tab="tab-2">history</li>
//         </ul>
//         <div id="tab-1" class="tab-content current">
//             <h3>Deployed Contract</h3>
//             <p>test-abis: </p>
//             <p id="test-abis"></p>
//             <p>test-bytecodes: </p>
//             <p id="test-bytecodes"></p>
//             <!-- contract interaction 동적생성 -->
//             <div class="contract__interaction"></div>
//         </div>
//         <div id="tab-2" class="tab-content">
//           <!-- contract interaction 동적생성 -->
//           <div class="contract__interaction"></div>
//         </div>
//       </div>
//     </body>
//   </html>`;
//   }
// }

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
    this._htmlFile = htmlFile;
    this._cssFile = cssFile;
    this._scriptFile = scriptFile;
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