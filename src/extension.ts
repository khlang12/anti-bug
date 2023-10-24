import * as vscode from "vscode";
import * as ejs from "ejs";
import * as fs from "fs";

import { Address, bytesToHex, hexToBytes } from "@ethereumjs/util";
import { Chain, Common, Hardfork } from "@ethereumjs/common";
import { VM } from "@ethereumjs/vm";
import { LegacyTransaction } from "@ethereumjs/tx";
import { ViewProvider } from "./provider/view-provider";

import { makeTrie } from "./util";
import { DEFAULT_ACCOUNTS } from "./util/config";

export function activate(context: vscode.ExtensionContext) {
  const primaryPanelDeployProvider = new ViewProvider({
    extensionUri: context.extensionUri,
    viewType: "antibug.primaryPanel.deploy",
  });

  primaryPanelDeployProvider.setFiles({
    cssFile: "",
    scriptFile: "",
    htmlFile: "deploy.ejs",
  });

  const primaryPanelInteractionProvider = new ViewProvider({
    extensionUri: context.extensionUri,
    viewType: "antibug.primaryPanel.interaction",
  });

  primaryPanelInteractionProvider.setFiles({
    cssFile: "",
    scriptFile: "interaction.js",
    htmlFile: "interaction.ejs",
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("antibug.test", async () => {
      const trie = await makeTrie(DEFAULT_ACCOUNTS);

      const addr = Address.fromPrivateKey(
        hexToBytes(DEFAULT_ACCOUNTS[0].privateKey)
      );
      const data = await trie.get(addr.toBytes());
      console.log(bytesToHex(data ?? Buffer.alloc(0)));
    })
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      primaryPanelDeployProvider.getViewType(),
      primaryPanelDeployProvider
    ),
    vscode.window.registerWebviewViewProvider(
      primaryPanelInteractionProvider.getViewType(),
      primaryPanelInteractionProvider
    )
  );
}
