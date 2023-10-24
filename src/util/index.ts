import { Trie } from "@ethereumjs/trie";
import {
  Account,
  Address,
  hexToBytes,
  privateToAddress,
} from "@ethereumjs/util";

type GenesisAccount = {
  privateKey: string;
  balance: bigint;
};

export async function makeTrie(genesisAccounts: GenesisAccount[]) {
  const trie = new Trie({
    useKeyHashing: true,
  });

  for (const acc of genesisAccounts) {
    const { address, account } = makeAccount(acc);
    await trie.put(address.toBytes(), account.serialize());
  }

  return trie;
}

export function makeAccount(genesisAccount: GenesisAccount) {
  let balance = BigInt(genesisAccount.balance);
  const account = Account.fromAccountData({ balance });
  const pk = hexToBytes(genesisAccount.privateKey);
  const address = new Address(privateToAddress(pk));
  return { account, address };
}
