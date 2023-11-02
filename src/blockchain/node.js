"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@ethereumjs/common");
const vm_1 = require("@ethereumjs/vm");
const util_1 = require("../util");
const block_1 = require("@ethereumjs/block");
const blockchain_1 = require("./blockchain");
const util_2 = require("@ethereumjs/util");
const config_1 = require("../util/config");
class AntibugNode {
    static async create() {
        const genesisHeader = {
            timestamp: "0x0",
            gasLimit: 300000000,
            difficulty: 0,
            nonce: "0x0000000000000000",
            extraData: "0x",
        };
        const common = common_1.Common.custom({
            chainId: common_1.Chain.Mainnet,
            networkId: common_1.Chain.Mainnet,
            genesis: genesisHeader,
        }, {
            hardfork: common_1.Hardfork.Shanghai,
            eips: [1559, 4895],
        });
        const vm = await vm_1.VM.create({
            common,
            activatePrecompiles: true,
            genesisState: (0, util_1.makeGenesisState)(config_1.DEFAULT_ACCOUNTS),
        });
        // 실제 vm과 연동되는 블록체인은 아님
        const genesisBlock = await vm.blockchain.getBlock(0);
        const blockchain = new blockchain_1.default({ common, genesisBlock });
        return new AntibugNode({ common, vm, blockchain });
    }
    constructor({ common, vm, blockchain, }) {
        this.common = common;
        this.vm = vm;
        this.blockchain = blockchain;
    }
    async getBalance(hexAddress) {
        // wallet address to Address
        const address = new util_2.Address((0, util_2.hexToBytes)(hexAddress));
        const stateAccount = await this.vm.stateManager.getAccount(address);
        return stateAccount?.balance ?? 0n;
    }
    async mine(tx) {
        const latestBlock = this.blockchain.getLatestBlock();
        const mineBlock = block_1.Block.fromBlockData({
            header: {
                timestamp: latestBlock.header.timestamp + 1n,
                number: latestBlock.header.number + 1n,
                gasLimit: this.getEstimatedGasLimit(latestBlock),
            },
        }, {
            common: this.common,
        });
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
        this.blockchain.putReceipt((0, util_2.bytesToHex)(tx.hash()), receipt);
        this.blockchain.putBlock(block);
        return {
            block,
            receipt,
        };
    }
    async getNonce(privateKey) {
        const address = (0, util_1.privateKeyToAddress)(privateKey);
        const stateAccount = await this.vm.stateManager.getAccount(address);
        return stateAccount?.nonce ?? 0n;
    }
    getEstimatedGasLimit(parentBlock) {
        const parentGasLimit = parentBlock.header.gasLimit;
        const a = parentGasLimit /
            this.common.paramByHardfork("gasConfig", "gasLimitBoundDivisor", "london");
        const maxGasLimit = parentGasLimit + a;
        const minGasLimit = parentGasLimit - a;
        return minGasLimit + (maxGasLimit - minGasLimit) / 2n;
    }
}
exports.default = AntibugNode;
//# sourceMappingURL=node.js.map