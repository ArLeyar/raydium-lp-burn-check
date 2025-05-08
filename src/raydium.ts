import { Connection } from "@solana/web3.js";
import { Raydium } from "@raydium-io/raydium-sdk-v2";

const RPC_URL = "https://api.mainnet-beta.solana.com";
const connection = new Connection(RPC_URL);
let raydiumInstance: Raydium | null = null;

export async function getRaydium(): Promise<Raydium> {
  if (!raydiumInstance) {
    raydiumInstance = await Raydium.load({
      connection,
      disableLoadToken: false,
    });
  }
  return raydiumInstance;
}