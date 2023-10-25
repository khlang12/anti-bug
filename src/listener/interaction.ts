import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";
import AntibugNode from "../blockchain/node";
import { bytesToHex, hexToBytes } from "@ethereumjs/util";
import { privateKeyToAddress } from "../util";
import { DEFAULT_ACCOUNTS } from "../util/config";

const BYTECODE =
  "0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550610215806100606000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80638da5cb5b1461003b578063f5a1f5b414610059575b600080fd5b610043610089565b6040516100509190610154565b60405180910390f35b610073600480360381019061006e919061010d565b6100ad565b604051610080919061016f565b60405180910390f35b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060019050919050565b600081359050610107816101c8565b92915050565b60006020828403121561011f57600080fd5b600061012d848285016100f8565b91505092915050565b61013f8161018a565b82525050565b61014e8161019c565b82525050565b60006020820190506101696000830184610136565b92915050565b60006020820190506101846000830184610145565b92915050565b6000610195826101a8565b9050919050565b60008115159050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6101d18161018a565b81146101dc57600080fd5b5056fea26469706673582212206dcd72df54690b8b5cdf0dab48c3f2bbef7b23ef7c01535142bfe4c32f0eacfc64736f6c63430008000033";

export default async function interactionListener(
  this: any,
  antibugNode: AntibugNode,
  data: { type: string; value: any }
) {
  const address1 = privateKeyToAddress(DEFAULT_ACCOUNTS[2].privateKey);
  const address2 = privateKeyToAddress(DEFAULT_ACCOUNTS[3].privateKey);

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
      break;
    }
    case "deploy": {
      const { callData, fromPrivateKey, value, to } = data.value;
      const contractTxData = {
        data: callData,
        gasLimit: 3000000000,
        maxPriorityFeePerGas: 0,
        maxFeePerGas: 0,
        nonce: await antibugNode.getNonce(fromPrivateKey),
      };
      const contractTx = FeeMarketEIP1559Transaction.fromTxData(
        contractTxData
      ).sign(hexToBytes(fromPrivateKey));
      const { receipt } = await antibugNode.mine(contractTx);
      console.log(receipt.createdAddress?.toString());
      break;
    }

    case "send": {
      const { callData, fromPrivateKey, value, to } = data.value;
      const txData = {
        data: callData,
        gasLimit: 3000000000,
        maxPriorityFeePerGas: 0,
        maxFeePerGas: 0,
        nonce: await antibugNode.getNonce(fromPrivateKey),
      };
      const tx = FeeMarketEIP1559Transaction.fromTxData(txData).sign(
        hexToBytes(fromPrivateKey)
      );
      const { receipt } = await antibugNode.mine(tx);
      console.log(receipt.createdAddress?.toString());
      break;
    }

    case "call": {
      const { callData, fromPrivateKey, to } = data.value;
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
  }
}
