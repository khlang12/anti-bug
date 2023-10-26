import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";
import AntibugNode from "../blockchain/node";
import {
  bigIntToHex,
  bytesToHex,
  hexToBytes,
  intToHex,
} from "@ethereumjs/util";
import { privateKeyToAddress } from "../util";
import { spawn } from "child_process";
import * as path from "path";

export default async function interactionListener(
  this: any,
  antibugNode: AntibugNode,
  event: { type: string; value: any }
) {
  switch (event.type) {
    case "send": {
      const { data, maxFeePerGas, gasLimit, fromPrivateKey, value, to } =
        event.value;
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
      const { callData, fromPrivateKey, to } = event.value;
      const callTxData = {
        data: callData,
        to,
        maxFeePerGas: 3000000n,
        gasLimit: 3000000n,
        nonce: await antibugNode.getNonce(fromPrivateKey),
      };
      const callTx = FeeMarketEIP1559Transaction.fromTxData(callTxData).sign(
        hexToBytes(fromPrivateKey)
      );
      const result = await antibugNode.runTx({ tx: callTx });
      console.log(bytesToHex(result.execResult.returnValue));
      break;
    }

    case "compile": {
      const { solFile } = event.value;
      console.log(process.env.PATH);
      const absolutePathToFile = path.join(
        __dirname,
        "/Users/p1n9/Desktop/bl0ckp1n9/protocol-camp/vsc-extension/SafeDevAnalyzer/test/reentrancy.sol"
      );
      console.log(absolutePathToFile);
      const command = spawn("antibug", ["deploy", absolutePathToFile]);

      command.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
      });

      command.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
      });

      command.on("close", (code) => {
        console.log(`child process exited with code ${code}`);
      });
      command.on("error", (err) => {
        console.error("Failed to start process:", err);
      });
    }
  }
}
