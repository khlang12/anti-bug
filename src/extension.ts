import * as vscode from "vscode";

import { ViewProvider } from "./provider/view-provider";
import { DEFAULT_ACCOUNTS } from "./util/config";
import AntibugNode from "./blockchain/node";
import interactionListener from "./listener/interaction";
import testcodeListener from "./listener/testcode";
import securityListener from "./listener/security";
import deployListener from "./listener/deploy";

export async function activate(context: vscode.ExtensionContext) {
  const antibugNode = await AntibugNode.create();

  const workspaceFolders = vscode.workspace.workspaceFolders;
  const solFiles: vscode.Uri[] = [];

  if (workspaceFolders) {
    for (const folder of workspaceFolders) {
      const files = await vscode.workspace.findFiles(
        new vscode.RelativePattern(folder, "**/*.sol"),
        "**/node_modules/**"
      );
      solFiles.push(...files);
    }
  }

  const primaryPanelInteractionProvider = new ViewProvider({
    extensionUri: context.extensionUri,
    viewType: "antibug.primaryPanel.interaction",
    cssFile: "interaction.css",
    scriptFile: "interaction.js",
    htmlFile: "interaction.ejs",
    initialData: {
      accounts: DEFAULT_ACCOUNTS,
      solFiles,
    },
  });

  const bindedInteractionListener = interactionListener.bind(
    primaryPanelInteractionProvider,
    antibugNode
  );
  primaryPanelInteractionProvider.setListner(bindedInteractionListener);

  // Deploy Sidebar Webview
  const primaryPanelDeployProvider = new ViewProvider({
    extensionUri: context.extensionUri,
    viewType: "antibug.deploy",
    cssFile: "",
    scriptFile: "deploy.js",
    htmlFile: "deploy.ejs",
  });

  primaryPanelDeployProvider.setListner(deployListener);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      primaryPanelDeployProvider.getViewType(),
      primaryPanelDeployProvider
    )
  );

  // Security Analysis Sidebar Webview
  const primaryPanelSecurityProvider = new ViewProvider({
    extensionUri: context.extensionUri,
    viewType: "antibug.security",
    cssFile: "",
    scriptFile: "security.js",
    htmlFile: "security.ejs",
  });

  primaryPanelSecurityProvider.setListner(securityListener);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      primaryPanelSecurityProvider.getViewType(),
      primaryPanelSecurityProvider
    )
  );

  // Testcode Sidebar Webview
  const primaryPanelTestcodeProvider = new ViewProvider({
    extensionUri: context.extensionUri,
    viewType: "antibug.testcode",
    cssFile: "",
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

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      primaryPanelInteractionProvider.getViewType(),
      primaryPanelInteractionProvider
    )
  );
}
