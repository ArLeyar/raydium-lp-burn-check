import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { raydiumAmmProgram, RaydiumAmm } from "./raydium-amm/program";
import { getMint } from "@solana/spl-token";
import { HeliusClient } from "./helius-client";
import { setTimeout } from 'timers/promises';

const RPC_TIMEOUT_MS = 150;

export class RaydiumClient {
  private connection: Connection;
  private program: Program<RaydiumAmm>;
  private heliusClient: HeliusClient;

  constructor(connection: Connection, heliusClient: HeliusClient) {
    this.connection = connection;
    this.heliusClient = heliusClient;
    
    const provider = new AnchorProvider(
      connection,
      {
        publicKey: PublicKey.default,
        signAllTransactions: async (txs) => txs,
        signTransaction: async (tx) => tx,
      },
      { commitment: "confirmed" }
    );
    
    this.program = raydiumAmmProgram({ provider });
  }

  //Get the burn percentage of the LP using pure Node RPC Api
  async getLpBurnPercentageRpc(poolId: string): Promise<number> {
    const lpMint = await this.getLpMintForPool(poolId);
    const totalSupply = await this.getLpTotalSupply(lpMint);
    if (totalSupply === 0) return 100;

    const burnedAmount = await this.getBurnedAmountRpc(lpMint);
    return (burnedAmount / (totalSupply + burnedAmount)) * 100;
  }

  private async getBurnedAmountRpc(lpMint: PublicKey): Promise<number> {
    const mintInfo = await getMint(this.connection, lpMint);
    const decimals = mintInfo.decimals;
    let totalBurned = 0n;
    let lastSignature: string | null = null;

    while (true) {
      const options: any = { limit: 1000 };
      if (lastSignature) options.before = lastSignature;
      
      const signatures = await this.connection.getSignaturesForAddress(lpMint, options, "confirmed");
      if (signatures.length === 0) break;
      
      for (const sig of signatures) {
        await setTimeout(RPC_TIMEOUT_MS);
        
        const tx = await this.connection.getParsedTransaction(sig.signature, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0
        });
        
        if (!tx?.meta) continue;

        for (const ix of tx.transaction.message.instructions) {
          if ("programId" in ix) {
            const programId = ix.programId.toString();
            if (programId === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") {
              if ("parsed" in ix) {
                if (ix.parsed?.type === "burn" || ix.parsed?.type === "burnChecked") {
                  const amount = BigInt(ix.parsed.info.tokenAmount?.amount || ix.parsed.info.amount);
                  totalBurned += amount;
                }
              }
            }
          }
        }
      }
      
      lastSignature = signatures[signatures.length - 1].signature;
      if (signatures.length < 1000) break;
    }
    
    return Number(totalBurned) / Math.pow(10, decimals);
  }
  
  private async getLpMintForPool(poolId: string): Promise<PublicKey> {
    const ammInfo = await this.program.account.ammInfo.fetch(new PublicKey(poolId));
    return ammInfo.lpMint;
  }

  private async getLpTotalSupply(lpMint: PublicKey): Promise<number> {
    const mintInfo = await getMint(this.connection, lpMint);
    return Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals);
  }

  //Get the burn percentage of the LP using Helius API
  async getLpBurnPercentageHelius(poolId: string): Promise<number> {
    const lpMint = await this.getLpMintForPool(poolId);
    const totalSupply = await this.getLpTotalSupply(lpMint);
    if (totalSupply === 0) return 100;

    const burnedAmount = await this.getBurnedAmountHelius(lpMint);
    return (burnedAmount / (totalSupply + burnedAmount)) * 100;
  }

  private async getBurnedAmountHelius(lpMint: PublicKey): Promise<number> {
    const transactions = await this.heliusClient.getAllTransactions(lpMint.toString(), 'BURN');
    let totalBurned = 0;
    
    for (const tx of transactions) {
      for (const transfer of tx.tokenTransfers) {
        if (transfer.mint === lpMint.toString()) {
          totalBurned += Math.abs(transfer.tokenAmount);
        }
      }
    }
    
    return totalBurned;
  }
} 