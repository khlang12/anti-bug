"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tx_1 = require("@ethereumjs/tx");
const util_1 = require("@ethereumjs/util");
const util_2 = require("../util");
const config_1 = require("../util/config");
async function interactionListener(antibugNode, data) {
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
            const tx = tx_1.FeeMarketEIP1559Transaction.fromTxData(txData).sign((0, util_1.hexToBytes)(fromPrivateKey));
            await antibugNode.mine(tx);
            const from = (0, util_2.privateKeyToAddress)(fromPrivateKey).toString();
            const fromBalance = await antibugNode.getBalance(from);
            const toBalance = await antibugNode.getBalance(to);
            const accounts = config_1.DEFAULT_ACCOUNTS.map((account) => {
                return {
                    privateKey: account.privateKey,
                    address: account.address,
                    balance: to === account.address
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
exports.default = interactionListener;
//# sourceMappingURL=interaction.js.map