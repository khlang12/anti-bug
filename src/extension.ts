import * as vscode from "vscode";

import * as ejs from "ejs";
import * as fs from "fs";
import { ViewProvider } from "./view-provider";

export function activate(context: vscode.ExtensionContext) {
  const provider = new ViewProvider({
    extensionUri: context.extensionUri,
    viewType: "antibug.primarySidebar",
  });

  provider.setFiles({
    cssFile: "test.css",
    scriptFile: "main.js",
    htmlFile: "test.ejs",
  });
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(provider.getViewType(), provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("antibug.addText", () => {
      // vscode.window.showInformationMessage("addText");
      provider.addText();
    })
  );
}
