import { Chain, Hardfork, Common } from "@ethereumjs/common";
import { RunTxResult, VM } from "@ethereumjs/vm";
import { makeGenesisState, privateKeyToAddress } from "../util";
import { Block } from "@ethereumjs/block";
import AntibugChain from "./blockchain";
import { Address, bytesToHex, hexToBytes } from "@ethereumjs/util";
import {
  BlobEIP4844Transaction,
  FeeMarketEIP1559Transaction,
  LegacyTransaction,
} from "@ethereumjs/tx";
import { DEFAULT_ACCOUNTS } from "../util/config";

export default class AntibugNode {
  public common: Common;
  public blockchain: AntibugChain;
  public vm: VM;

  static async create() {
    const genesisHeader = {
      timestamp: "0x0",
      gasLimit: 300000000,
      difficulty: 0,
      nonce: "0x0000000000000000",
      extraData: "0x",
    };

    const common = Common.custom(
      {
        chainId: Chain.Mainnet,
        networkId: Chain.Mainnet,
        genesis: genesisHeader,
      },
      {
        hardfork: Hardfork.Shanghai,
        eips: [1559, 4895],
      }
    );

    const vm = await VM.create({
      common,
      activatePrecompiles: true,
      genesisState: makeGenesisState(DEFAULT_ACCOUNTS),
    });

    // 실제 vm과 연동되는 블록체인은 아님
    const genesisBlock = await vm.blockchain.getBlock(0);
    const blockchain = new AntibugChain({ common, genesisBlock });

    return new AntibugNode({ common, vm, blockchain });
  }

  constructor({
    common,
    vm,
    blockchain,
  }: {
    common: Common;
    vm: VM;
    blockchain: AntibugChain;
  }) {
    this.common = common;
    this.vm = vm;
    this.blockchain = blockchain;
  }

  public async getBalance(hexAddress: string): Promise<bigint> {
    // wallet address to Address
    const address = new Address(hexToBytes(hexAddress));
    const stateAccount = await this.vm.stateManager.getAccount(address);
    return stateAccount?.balance ?? 0n;
  }

  public async mine(
    tx: FeeMarketEIP1559Transaction | LegacyTransaction | BlobEIP4844Transaction
  ): Promise<{ block: Block; receipt: RunTxResult }> {
    const latestBlock = this.blockchain.getLatestBlock();
    const mineBlock = Block.fromBlockData(
      {
        header: {
          timestamp: latestBlock.header.timestamp + 1n,
          number: latestBlock.header.number + 1n,
          gasLimit: this.getEstimatedGasLimit(latestBlock),
        },
      },
      {
        common: this.common,
      }
    );

    const buildBlock = await this.vm.buildBlock({
      parentBlock: latestBlock,
      headerData: mineBlock.header,
      blockOpts: {
        freeze: false,
        putBlockIntoBlockchain: true,
      },
    });

    const receipt = await buildBlock.addTransaction(tx);
    const block = await buildBlock.build();

    this.blockchain.putReceipt(bytesToHex(tx.hash()), receipt);
    this.blockchain.putBlock(block);

    return {
      block,
      receipt,
    };
  }

  public async getNonce(privateKey: string): Promise<bigint> {
    const address = privateKeyToAddress(privateKey);
    const stateAccount = await this.vm.stateManager.getAccount(address);
    return stateAccount?.nonce ?? 0n;
  }

  private getEstimatedGasLimit(parentBlock: Block): bigint {
    const parentGasLimit = parentBlock.header.gasLimit;
    const a =
      parentGasLimit /
      this.common.paramByHardfork(
        "gasConfig",
        "gasLimitBoundDivisor",
        "london"
      );
    const maxGasLimit = parentGasLimit + a;
    const minGasLimit = parentGasLimit - a;

    return minGasLimit + (maxGasLimit - minGasLimit) / 2n;
  }
}
