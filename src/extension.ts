import * as vscode from "vscode";
import * as fs from 'fs';

import { ViewProvider } from "./provider/view-provider";
import { privateKeyToAddress } from "./util";
import { DEFAULT_ACCOUNTS } from "./util/config";
import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";
import { hexToBytes } from "@ethereumjs/util";
import AntibugNode from "./blockchain/node";
import interactionListener from "./listener/interaction";
import deployListener from "./listener/deploy";
import securityListener from "./listener/security";
import testcodeListener from "./listener/testcode";

export async function activate(context: vscode.ExtensionContext) {
  const antibugNode = await AntibugNode.create();
  const primaryPanelInteractionProvider = new ViewProvider({
    extensionUri: context.extensionUri,
    viewType: "antibug.primaryPanel.interaction",
    cssFile: "custom.css",
    scriptFile: "interaction.js",
    htmlFile: "interaction.ejs",
    initialData: {
      accounts: DEFAULT_ACCOUNTS,
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
    cssFile: "custom.css",
    scriptFile: "deploy.js",
    htmlFile: "deploy.ejs",
  });

  primaryPanelDeployProvider.setListner((data) => {
    deployListener(context);
  });
  
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
    viewType: "antibug.testcode",
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

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      primaryPanelInteractionProvider.getViewType(),
      primaryPanelInteractionProvider
    )
  );

  
}
