import * as vscode from "vscode";
import { ViewProvider, WebviewProvider } from "./provider/view-provider";
import AntibugNode from "./blockchain/node";
import interactionListener from "./listener/interaction";
import testcodeListener from "./listener/testcode";
import securityListener from "./listener/security";
import exp = require("constants");
import deployPanelListener from "./pages/result_listener/deploy_result";

export let deployPanel: vscode.WebviewPanel;
export let securityPanel: vscode.WebviewPanel;

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



  // Deploy Result Webview
  deployPanel = vscode.window.createWebviewPanel(
    'deployResultView',
    "Deploy Result",
    {
      preserveFocus: false,
      viewColumn: 2,
    },
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  const deployProvider = new WebviewProvider({
    extensionUri: context.extensionUri,
    viewType: 'antibug.webviewPanel.interaction',
    cssFile: "deploy_result.css",
    scriptFile: "deploy_result.js",
    htmlFile: "deploy_result.ejs",
  });

  const disposal = vscode.window.registerWebviewViewProvider(deployProvider.getViewType(), deployProvider);
  vscode.commands.executeCommand('setContext', 'webviewVisible', true);
  deployPanel.onDidDispose(() => vscode.commands.executeCommand('setContext', 'webviewVisible', false));
  deployPanel.webview.onDidReceiveMessage(message => {
    vscode.window.showInformationMessage(`Received message from webview: ${message}`);
  });

  deployPanel.webview.html = deployProvider.getHtmlForWebview(deployPanel.webview);


  // Security Result Webview
  securityPanel = vscode.window.createWebviewPanel(
    'securityResultView',
    'Security Result',
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );
}

export function deactivate() {
  // Clean up resources, if needed
}
