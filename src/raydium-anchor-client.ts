import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { raydiumAmmProgram, RaydiumAmm } from "./raydium-amm/program";

export class RaydiumAnchorClient {
  private connection: Connection;
  private provider: AnchorProvider;
  private program: Program<RaydiumAmm>;
  
  constructor(connection: Connection) {
    this.connection = connection;
    this.provider = new AnchorProvider(
      connection, 
      {
        publicKey: PublicKey.default,
        signAllTransactions: async (txs) => txs,
        signTransaction: async (tx) => tx,
      },
      { commitment: "confirmed" }
    );
    this.program = raydiumAmmProgram({ provider: this.provider });
  }
  
  async getLpMintForPool(poolId: string): Promise<PublicKey> {
    try {
      const poolAccount = await this.program.account.ammInfo.fetch(new PublicKey(poolId));
      return poolAccount.lpMint;
    } catch (error) {
      throw new Error(`Failed to fetch LP mint for pool ${poolId}: ${error}`);
    }
  }
} 