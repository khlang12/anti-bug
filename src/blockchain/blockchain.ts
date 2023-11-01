import { Block } from "@ethereumjs/block";
import { Common } from "@ethereumjs/common";
import { RunTxResult } from "@ethereumjs/vm";

export default class AntibugChain {
  private common: Common;
  private chain: Block[];
  private blockByNumber: Map<bigint, Block> = new Map();
  private receiptByTxHash: Map<string, any> = new Map();
  constructor({ common, genesisBlock, }: { common: Common; genesisBlock: Block; }) {
    this.common = common;
    this.chain = [genesisBlock];
    this.blockByNumber.set(genesisBlock.header.number, genesisBlock);
  }

  public getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  public getBlockByNumber(number: bigint): Block | undefined {
    return this.blockByNumber.get(number);
  }

  public getReceiptByTxHash(txHash: string): any | undefined {
    return this.receiptByTxHash.get(txHash);
  }

  public putBlock(block: Block) {
    this.chain.push(block);
    this.blockByNumber.set(block.header.number, block);
  }

  public putReceipt(txHash: string, receipt: RunTxResult) {
    this.receiptByTxHash.set(txHash, receipt);
  }
}
