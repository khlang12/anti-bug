import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { ViewProvider, WebviewProvider } from "./provider/view-provider";
import AntibugNode from "./blockchain/node";
import interactionListener from "./listener/interaction";
import testcodeListener from "./listener/testcode";
import securityListener from "./listener/security";
import exp = require("constants");
import { subscribe } from "diagnostics_channel";
import { DEFAULT_ACCOUNTS } from "./util/config";
import { exec } from "child_process";

export async function activate(context: vscode.ExtensionContext) {
  const antibugNode = await AntibugNode.create();

  // Deploy Sidebar Webview
  const primaryPanelInteractionProvider = new ViewProvider({
    extensionUri: context.extensionUri,
    viewType: "antibug.primaryPanel.interaction",
    cssFile: "custom.css",
    scriptFile: "interaction.js",
    htmlFile: "interaction.ejs",
  });

  const bindedInteractionListener = interactionListener.bind(
    primaryPanelInteractionProvider,
    antibugNode,
  );
  primaryPanelInteractionProvider.setListner(bindedInteractionListener);

  const disposalPrimaryPanelInteraction =
    vscode.window.registerWebviewViewProvider(
      primaryPanelInteractionProvider.getViewType(),
      primaryPanelInteractionProvider
    );

  context.subscriptions.push(disposalPrimaryPanelInteraction);

  // Security Analysis Sidebar Webview
  const primaryPanelSecurityProvider = new ViewProvider({
    extensionUri: context.extensionUri,
    viewType: "antibug.primaryPanel.security",
    cssFile: "custom.css",
    scriptFile: "security.js",
    htmlFile: "security.ejs",
  });

  primaryPanelSecurityProvider.setListner((data) => {
    securityListener(context, data);
  });

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      primaryPanelSecurityProvider.getViewType(),
      primaryPanelSecurityProvider
    )
  );

  // Testcode Sidebar Webview
  const primaryPanelTestcodeProvider = new ViewProvider({
    extensionUri: context.extensionUri,
    viewType: "antibug.primaryPanel.testcode",
    cssFile: "custom.css",
    scriptFile: "testcode.js",
    htmlFile: "testcode.ejs",
  });

  primaryPanelTestcodeProvider.setListner(testcodeListener);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      primaryPanelTestcodeProvider.getViewType(),
      primaryPanelTestcodeProvider
    )
  );


  // Welcome Webview Panel
  const welcomePanel = vscode.window.createWebviewPanel(
    'welcomePage',
    'Welcome',
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  const welcomeProvider = new WebviewProvider({
    extensionUri: context.extensionUri,
    viewType: 'antibug.webviewPanel.welcome',
    cssFile: "",
    scriptFile: "",
    htmlFile: "welcome.html"
  });

  welcomePanel.webview.html = welcomeProvider.getHtmlForWebview(welcomePanel.webview);


  // Ganache local chain Starting
  try {
    let ganacheCommand = 'ganache-cli';
    
    for (const account of DEFAULT_ACCOUNTS) {
      ganacheCommand += ` --account="${account.privateKey},${account.balance}"`;
    }

    exec(ganacheCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting ganache-cli: ${error.message}`);
        return;
      }
      console.log(`ganache-cli output: ${stdout}`);
      console.error(`ganache-cli errors: ${stderr}`);
    });

    console.log("Ganache starting");
  } catch (e) {
    console.log(e);
  }
}

export function deactivate() {
  // Clean up resources, if needed
}
