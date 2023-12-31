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
    }
  }
}
