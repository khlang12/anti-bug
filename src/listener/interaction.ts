import * as fs from "fs";
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
import { off } from "process";

let deployPanel: vscode.WebviewPanel | undefined;
let securityPanel: vscode.WebviewPanel | undefined;

export default async function interactionListener(
  this: any,
  antibugNode: AntibugNode,
  event: { type: string; value: any },
  // context: vscode.ExtensionContext,
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
    
    case "webview": {
      console.log("webview 실행중...");
      const { panel, title, filePath } = event.value;
      console.log("webview panel --- ", panel);
      console.log("webview title --- ", title);
      console.log("webview filePath --- ", filePath);
      openPanel(panel, title, filePath);
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

      console.log("send 실행중...");
      console.log("data --- ", data);
      console.log("callData --- ", callData);
      console.log("maxFeePerGas --- ", maxFeePerGas);
      console.log("gasLimit --- ", gasLimit);
      console.log("fromPrivateKey --- ", fromPrivateKey);
      console.log("value --- ", value);
      console.log("to --- ", to);

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
      console.log("compile 실행중...");
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

          console.log("jsonFile compile --- ", jsonFile);

          const contractData: Record<string, { abis: any[], bytecodes: string, contract: any }> = {};
          for (const contractName in jsonFile) {
            if (jsonFile.hasOwnProperty(contractName)) {
              const contractInfo = jsonFile[contractName];
              const { abis, bytecodes } = contractInfo;
              const contract = contractName;
              contractData[contractName] = { abis, bytecodes, contract };
              const newABIs = makeABIEncode(contractData[contractName].abis);

              console.log("contractData deploy --- ", contractData);

              // 여기서 contract 개수 만큼 (지금은 2개) compileJson 이벤트를 보낸단 말이지
              // this.view.webview.postMessage({
              //   type: "compileJson",
              //   value: contractData
              // });
            }
          }
          this.view.webview.postMessage({
            type: "compileJson",
            value: contractData
          });

          // 여기서 웹뷰 열어도 될듯


        });
      } catch (e) {
        console.log(e);
      }
      break;
    }

    case "deploy": {
      console.log("deploy 실행중...");
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

          const contractData: Record<string, { abis: any[], bytecodes: string, contract: any }> = {};
          for (const contractName in jsonFile) {
            if (jsonFile.hasOwnProperty(contractName)) {
              const contractInfo = jsonFile[contractName];
              const { abis, bytecodes } = contractInfo;
              const contract = contractName;
              contractData[contractName] = { abis, bytecodes, contract };
              const newABIs = makeABIEncode(contractData[contractName].abis);
              console.log("contractData[contractName] deploy --- ", contractData[contractName]);

              this.view.webview.postMessage({
                type: "compiled",
                value: {
                  abis: newABIs,
                  bytecodes,
                  contract,
                },
              });

            }
          }
        });
      } catch (e) {
        console.log(e);
      }
    }
  }
}

function makeABIEncode(abis: any) {
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

// 이더리움 docs에서 어떻게 붙이는지 인자마다 32바이트 인코딩
function encodeCallData(signature: string, name: string, args: any[]) {
  const iface = new ethers.utils.Interface([signature]);  // 이거 찾아보기 // 결과가 이상해도 에러로 안 뜸
  const data = iface.encodeFunctionData(name, args);
  return data;
}

async function openPanel(panel: string | undefined, title: string, filePath: string) {

  if (panel === "deployPanel") {
    if (deployPanel) {
      deployPanel.reveal(vscode.ViewColumn.Two);
    } else {
      deployPanel = vscode.window.createWebviewPanel(
        'ResultView',
        `${title}`,
        vscode.ViewColumn.Two,
        { enableScripts: true }
      );

      try {
        const htmlFilePath = vscode.Uri.file(path.join(__dirname, '../..', filePath));
        console.log("htmlFilePath --- ", htmlFilePath);
        const htmlContent = await fs.promises.readFile(htmlFilePath.fsPath);
        deployPanel.webview.html = htmlContent.toString();
      } catch (error) {
        console.error('Error loading Webview Panel: ', error);
      }
      deployPanel.onDidDispose(() => {
        deployPanel = undefined;
      });
    }
  } else if (panel === "securityPanel") {
    if (securityPanel) {
      securityPanel.reveal(vscode.ViewColumn.Two);
    } else {
      securityPanel = vscode.window.createWebviewPanel(
        'ResultView',
        `${title}`,
        vscode.ViewColumn.Two,
        { enableScripts: true }
      );

      try {
        const htmlFilePath = vscode.Uri.file(path.join(__dirname, '../..', filePath));
        console.log("htmlFilePath --- ", htmlFilePath);
        const htmlContent = await fs.promises.readFile(htmlFilePath.fsPath);
        securityPanel.webview.html = htmlContent.toString();
      } catch (error) {
        console.error('Error loading Webview Panel: ', error);
      }
      securityPanel.onDidDispose(() => {
        securityPanel = undefined;
      });
    }
  }
}

