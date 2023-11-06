import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";
import AntibugNode from "../blockchain/node";
import { hexToBytes } from "@ethereumjs/util";
import { privateKeyToAddress } from "../util";
import { DEFAULT_ACCOUNTS } from "../util/config";

export default async function interactionListener(
  this: any,
  antibugNode: AntibugNode,
  data: { type: string; value: any }
) {
  switch (data.type) {
    case "sendEth": {
      console.log("sendEth 실행중...");
      const { fromPrivateKey, value, to } = data.value;

      const txData = {
        gasLimit: 21000,
        value: BigInt(value),
        to,
        maxFeePerGas: 300000n,
        nonce: await antibugNode.getNonce(fromPrivateKey),
      };

      const tx = FeeMarketEIP1559Transaction.fromTxData(txData).sign(
        hexToBytes(fromPrivateKey)
      );

      await antibugNode.mine(tx);

      const from = privateKeyToAddress(fromPrivateKey).toString();
      const fromBalance = await antibugNode.getBalance(from);
      const toBalance = await antibugNode.getBalance(to);
      const accounts = DEFAULT_ACCOUNTS.map((account) => {
        return {
          privateKey: account.privateKey,
          address: account.address,
          balance:
            to === account.address
              ? toBalance.toString()
              : from === account.address
                ? fromBalance.toString()
                : account.balance.toString(),
        };
      });

      this.view.webview.postMessage({
        type: "changeAddressState",
        value: accounts,
      });
      break;
    }
    case "getSolFiles": {
      console.log("getSolFiles 실행중...");
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceFolder = workspaceFolders[0];
        const workspaceFolderPath = workspaceFolder.uri.fsPath;
        const solFiles = await findSolFiles(workspaceFolderPath);
        this.view.webview.postMessage({
          type: "solFiles",
          value: solFiles,
        });
      } else {
        console.error("No workspace folders found.");
      }
      break;
    }
  }
}

async function findSolFiles(folderPath: string): Promise<{ value: string; text: string }[]> {
  vscode.window.showInformationMessage("findSolFiles 실행중...");
  const solFiles: { value: string; text: string }[] = [];
  async function findFilesRecursively(folderPath: string) {
    const entries = await fs.promises.readdir(folderPath);
    for (const entry of entries) {
      const entryPath = path.join(folderPath, entry);
      const stats = await fs.promises.stat(entryPath);
      if (stats.isDirectory()) {
        await findFilesRecursively(entryPath);
      } else if (path.extname(entry) === ".sol") {
        solFiles.push({ value: entryPath, text: entry });
      }
    }
  }
  await findFilesRecursively(folderPath);
  return solFiles;
}







