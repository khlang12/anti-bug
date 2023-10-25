import { Address, bigIntToHex, hexToBytes, intToHex } from "@ethereumjs/util";
import { DEFAULT_ACCOUNTS } from "./config";
export const privateKeyToAddress = (privateKey: string) => {
  const address = Address.fromPrivateKey(hexToBytes(privateKey));
  return address;
};

export const makeGenesisState = (accounts: any) => {
  const convertedAccounts = accounts.map((account: any) => {
    return {
      [privateKeyToAddress(account.privateKey).toString()]: [
        bigIntToHex(account.balance),
        "0x",
        [],
        "0x00",
      ],
    };
  });

  return Object.assign({}, ...convertedAccounts);
};
