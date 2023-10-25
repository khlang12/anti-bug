import * as vscode from "vscode";

import { Block } from "@ethereumjs/block";
import { Common, Chain, Hardfork } from "@ethereumjs/common";
import { VM } from "@ethereumjs/vm";
import { ViewProvider } from "./provider/view-provider";
import { makeGenesisState, privateKeyToAddress } from "./util";
import { DEFAULT_ACCOUNTS } from "./util/config";
import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";
import { hexToBytes } from "@ethereumjs/util";
import AntibugNode from "./blockchain/node";

export function activate(context: vscode.ExtensionContext) {

  // Interaction Sidebar Webview
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
}

async function interactionListener(data: { type: string; value: any }) {
  // const common = Common.custom(
  //   {
  //     chainId: Chain.Mainnet,
  //     networkId: Chain.Mainnet,
  //     genesis: {
  //       timestamp: "0x0",
  //       gasLimit: 300000000,
  //       difficulty: 0,
  //       nonce: "0x0000000000000000",
  //       extraData: "0x",
  //     },
  //   },
  //   {
  //     hardfork: Hardfork.Shanghai,
  //     eips: [1559, 4895],
  //   }
  // );

  // const vm = await VM.create({
  //   common,
  //   activatePrecompiles: true,
  //   genesisState: makeGenesisState(),
  // });

  const antibugNode = await AntibugNode.create();

  console.log(antibugNode.blockchain.getBlockByNumber(0n));
  const accountAddress1 = privateKeyToAddress(DEFAULT_ACCOUNTS[0].privateKey);
  const accountAddress2 = privateKeyToAddress(DEFAULT_ACCOUNTS[1].privateKey);

  const sendTx = {
    gasLimit: 21000,
    value: 1000000000000000000n,
    to: accountAddress2.toString(),
    maxFeePerGas: 7n,
  };

  let eip1559Tx = FeeMarketEIP1559Transaction.fromTxData(sendTx).sign(
    hexToBytes(DEFAULT_ACCOUNTS[0].privateKey)
  );

  await antibugNode.mine(eip1559Tx);

  console.log(
    (await antibugNode.getBalance(accountAddress1.toString())).toString()
  );
  console.log(
    (await antibugNode.getBalance(accountAddress2.toString())).toString()
  );

  const sendTx2 = {
    gasLimit: 21000,
    value: 1000000000000000000n,
    to: accountAddress2.toString(),
    maxFeePerGas: 7n,
    nonce: 1,
  };

  eip1559Tx = FeeMarketEIP1559Transaction.fromTxData(sendTx2, {
    common: antibugNode.common,
  }).sign(hexToBytes(DEFAULT_ACCOUNTS[0].privateKey));
  await antibugNode.mine(eip1559Tx);

  console.log(
    (await antibugNode.getBalance(accountAddress1.toString())).toString()
  );
  console.log(
    (await antibugNode.getBalance(accountAddress2.toString())).toString()
  );
  // console.log("stateAccount1After", stateAccount1After?.balance.toString());
  // console.log("stateAccount2After", stateAccount2After?.balance.toString());

  // console.log(await vm.blockchain.getBlock(1));
  switch (data.type) {
    case "sendEth": {
      const panel = vscode.window.createWebviewPanel(
        "resultView", // Identifies the type of the webview. Used internally
        "Result View", // Title of the panel displayed to the user
        vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
        {} // Webview options. More on these later.
      );
      panel.webview.html = `
        <div>123</div>
      `;
      break;
    }
  }
}

async function deployListener() {

}

async function securityListener() {

}

async function testcodeListener() {

}

