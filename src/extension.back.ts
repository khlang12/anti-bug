import * as vscode from "vscode";

import * as ejs from "ejs";
import * as fs from "fs";
import { ViewProvider } from "./provider/view-provider";

export function activate(context: vscode.ExtensionContext) {
  const sidePanel = vscode.window.createWebviewPanel(
    "resultView", // Identifies the type of the webview. Used internally
    "Result View", // Title of the panel displayed to the user
    vscode.ViewColumn.One, // Editor column to show the new webview panel in.
    {} // Webview options. More on these later.
  );
  const provider = new ViewProvider({
    extensionUri: context.extensionUri,
    viewType: "antibug.primarySidebar",
  });

  provider.setData({
    testData: "배고픔",
    person: "사람",
  });
  provider.setFiles({
    cssFile: "test.css",
    scriptFile: "test.js",
    htmlFile: "test.ejs",
  });

  provider.setFunction(testFunction);

  // vsc custom view 넣어주는 거
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(provider.getViewType(), provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("antibug.addText", () => {
      // vscode.window.showInformationMessage("addText");
      provider.addText();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("antibug.resultView", () => {
      sidePanel.webview.html = `
        <html>
          <body><h1>Test</h1></body>
        </html
      `;
    })
  );
}

function testFunction(data: { type: string; value: any }) {
  console.log(data);
  switch (data.type) {
    case "showText": {
      vscode.window.activeTextEditor?.insertSnippet(
        new vscode.SnippetString(`#${data.value}`)
      );
      vscode.window.showInformationMessage(`#${data.value}`);
      break;
    }
    default: {
      vscode.window.showInformationMessage(`unknown message type`);
    }
  }
}
