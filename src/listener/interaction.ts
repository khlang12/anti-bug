import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";
import AntibugNode from "../blockchain/node";
import {
  bigIntToHex,
  bytesToHex,
  hexToBytes,
  intToHex,
} from "@ethereumjs/util";
import { privateKeyToAddress } from "../util";
import { DEFAULT_ACCOUNTS } from "../util/config";

export default async function interactionListener(
  this: any,
  antibugNode: AntibugNode,
  event: { type: string; value: any }
) {
  const address1 = privateKeyToAddress(DEFAULT_ACCOUNTS[2].privateKey);
  const address2 = privateKeyToAddress(DEFAULT_ACCOUNTS[3].privateKey);

  switch (event.type) {
    case "send": {
      const { data, maxFeePerGas, gasLimit, fromPrivateKey, value, to } =
        event.value;

      const txData = {
        to,
        value: bigIntToHex(BigInt(value)),
        maxFeePerGas: BigInt(maxFeePerGas),
        gasLimit: BigInt(gasLimit),
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
    // case "deploy": {
    //   const { callData, fromPrivateKey, value } = data.value;
    //   const contractTxData = {
    //     data: callData,
    //     gasLimit: 3000000,
    //     maxPriorityFeePerGas: 0,
    //     maxFeePerGas: 3000000, // TODO
    //     value,
    //     nonce: await antibugNode.getNonce(fromPrivateKey),
    //   };
    //   const contractTx = FeeMarketEIP1559Transaction.fromTxData(
    //     contractTxData
    //   ).sign(hexToBytes(fromPrivateKey));
    //   const { receipt } = await antibugNode.mine(contractTx);

    //   this.view.webview.postMessage({
    //     type: "setContractAddress",
    //     value: {
    //       address: receipt.createdAddress?.toString(),
    //     },
    //   });

    //   break;
    // }

    // case "send": {
    //   const { callData, fromPrivateKey, value, to } = data.value;
    //   const txData = {
    //     data: callData,
    //     gasLimit: 3000000000,
    //     maxPriorityFeePerGas: 0,
    //     maxFeePerGas: 0,
    //     nonce: await antibugNode.getNonce(fromPrivateKey),
    //   };
    //   const tx = FeeMarketEIP1559Transaction.fromTxData(txData).sign(
    //     hexToBytes(fromPrivateKey)
    //   );
    //   const { receipt } = await antibugNode.mine(tx);
    //   console.log(receipt.createdAddress?.toString());
    //   break;
    // }

    // case "call": {
    //   const { callData, fromPrivateKey, to } = data.value;
    //   const callTxData = {
    //     data: callData,
    //     to,
    //     maxFeePerGas: 3000000n,
    //     gasLimit: 3000000n,
    //     nonce: await antibugNode.getNonce(fromPrivateKey),
    //   };
    //   const callTx = FeeMarketEIP1559Transaction.fromTxData(callTxData).sign(
    //     hexToBytes(fromPrivateKey)
    //   );
    //   const result = await antibugNode.runTx({ tx: callTx });
    //   console.log(bytesToHex(result.execResult.returnValue));
    //   break;
    // }
  }
}
