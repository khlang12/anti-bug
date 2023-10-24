import * as vscode from "vscode";

import { Common } from "@ethereumjs/common";
import { VM } from "@ethereumjs/vm";
import { ViewProvider } from "./provider/view-provider";
import { makeGenesisState } from "./util";

export function activate(context: vscode.ExtensionContext) {
  const primaryPanelInteractionProvider = new ViewProvider({
    extensionUri: context.extensionUri,
    viewType: "antibug.primaryPanel.interaction",
    cssFile: "",
    scriptFile: "interaction.js",
    htmlFile: "interaction.ejs",
  });

  primaryPanelInteractionProvider.setListner(interactionListener);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      primaryPanelInteractionProvider.getViewType(),
      primaryPanelInteractionProvider
    )
  );
}

async function interactionListener(data: { type: string; value: any }) {
  const common = Common.custom(
    {
      chainId: 1234,
      networkId: 4567,
    },
    {
      hardfork: "shanghai",
      eips: [1559],
    }
  );

  const vm = await VM.create({
    common,
    activatePrecompiles: true,
    genesisState: makeGenesisState(),
  });

  switch (data.type) {
    case "sendEth": {
      const panel = vscode.window.createWebviewPanel(
        "resultView", // Identifies the type of the webview. Used internally
        "Result View", // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {} // Webview options. More on these later.
      );
      panel.webview.html = `
        <div>123</div>
      `;
      break;
    }
  }
}
