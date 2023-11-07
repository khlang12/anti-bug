import * as path from "path";
import * as vscode from "vscode";
import * as ethers from "ethers";

import {
  BlobEIP4844Transaction,
  FeeMarketEIP1559Transaction,
  LegacyTransaction,
} from "@ethereumjs/tx";
import AntibugNode from "../blockchain/node";
import { bigIntToHex, bytesToHex, hexToBytes } from "@ethereumjs/util";
import { privateKeyToAddress } from "../util";
import { exec } from "child_process";
import { DEFAULT_ACCOUNTS } from "../util/config";

export default async function interactionListener(
  this: any,
  antibugNode: AntibugNode,
  event: { type: string; value: any }
) {
  switch (event.type) {
    case "init": {
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

      this.view.webview.postMessage({
        type: "init",
        value: {
          accounts: DEFAULT_ACCOUNTS.map((account) => ({
            address: account.address,
            privateKey: account.privateKey,
            balance: account.balance.toString(),
          })),
          solFiles,
        },
      });
      break;
    }

    case "send": {
      const {
        data,
        callData,
        maxFeePerGas,
        gasLimit,
        fromPrivateKey,
        value,
        to,
      } = event.value;
      const latestBlock = antibugNode.getLatestBlock();
      const estimatedGasLimit = antibugNode.getEstimatedGasLimit(latestBlock);
      const baseFee = latestBlock.header.calcNextBaseFee();

      const txData = {
        to,
        value: bigIntToHex(BigInt(value)),
        maxFeePerGas: baseFee,
        gasLimit: estimatedGasLimit,
        nonce: await antibugNode.getNonce(fromPrivateKey),
        data,
      };

      const tx = FeeMarketEIP1559Transaction.fromTxData(txData).sign(
        hexToBytes(fromPrivateKey)
      );

      const { receipt } = await antibugNode.mine(tx);

      const from = privateKeyToAddress(fromPrivateKey).toString();
      const fromBalance = await antibugNode.getBalance(from);
      const toBalance = to ? await antibugNode.getBalance(to) : 0n;

      this.view.webview.postMessage({
        type: "receipt",
        value: {
          accounts: {
            from,
            to,
            fromBalance: fromBalance.toString(),
            toBalance: toBalance.toString(),
          },
          contractAddress: receipt.createdAddress?.toString(),
          exectResult: bytesToHex(receipt.execResult.returnValue),
          totalGasSpent: receipt.totalGasSpent.toString(),
          amountSpent: receipt.amountSpent.toString(),
        },
      });
      break;
    }
    case "call": {
      const { signature, name, args, value, fromPrivateKey, to } = event.value;

      const latestBlock = antibugNode.getLatestBlock();
      const estimatedGasLimit = antibugNode.getEstimatedGasLimit(latestBlock);
      const baseFee = latestBlock.header.calcNextBaseFee();
      const callData = encodeCallData(signature, name, args);

      const callTxData = {
        to,
        data: callData,
        maxFeePerGas: baseFee,
        gasLimit: estimatedGasLimit,
        nonce: await antibugNode.getNonce(fromPrivateKey),
      };

      const callTx = FeeMarketEIP1559Transaction.fromTxData(callTxData).sign(
        hexToBytes(fromPrivateKey)
      );
      const result = await antibugNode.runTx({ tx: callTx });
      console.log(bytesToHex(result.execResult.returnValue).toString());
      break;
    }

    case "compile": {
      const { solFile } = event.value;
      try {
        exec(`antibug deploy ${solFile}`, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          if (stderr) {
            console.error(`stderr: ${stderr}`);
          }
          const directoryPath = stdout.split(":")[1].trim();
          const jsonFileName = solFile
            .split("/")
            .pop()
            ?.split(".")[0]
            .concat(".json");
          const jsonFilePath = path.join(directoryPath, jsonFileName);
          const jsonFile = require(jsonFilePath);
          const { abis, bytecodes, contract } = jsonFile;
          const newABIs = makeABIEnocde(abis);

          this.view.webview.postMessage({
            type: "compiled",
            value: {
              abis: newABIs,
              bytecodes,
              contract,
            },
          });
        });
      } catch (e) {
        console.log(e);
      }
    }
  }
}

function makeABIEnocde(abis: any) {
  const ABI = abis.map((data: any) => {
    const { name, inputs, type } = data;
    if (type !== "function") { return data; }

    const inputsTypes = inputs.map(({ type }: any) => type).join(",");
    const signature = `function ${name}(${inputsTypes})`;
    const newABI = {
      ...data,
      signature,
    };

    return newABI;
  });
  return ABI;
}

function encodeCallData(signature: string, name: string, args: any[]) {
  const iface = new ethers.utils.Interface([signature]);
  const data = iface.encodeFunctionData(name, args);
  return data;
}
