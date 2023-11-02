"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeGenesisState = exports.privateKeyToAddress = void 0;
const util_1 = require("@ethereumjs/util");
const privateKeyToAddress = (privateKey) => {
    const address = util_1.Address.fromPrivateKey((0, util_1.hexToBytes)(privateKey));
    return address;
};
exports.privateKeyToAddress = privateKeyToAddress;
const makeGenesisState = (accounts) => {
    const convertedAccounts = accounts.map((account) => {
        return {
            [(0, exports.privateKeyToAddress)(account.privateKey).toString()]: [
                (0, util_1.bigIntToHex)(account.balance),
                "0x",
                [],
                "0x00",
            ],
        };
    });
    return Object.assign({}, ...convertedAccounts);
};
exports.makeGenesisState = makeGenesisState;
//# sourceMappingURL=index.js.map