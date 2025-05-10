import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { raydiumAmmProgram, RaydiumAmm } from "./raydium-amm/program";
import { getMint } from "@solana/spl-token";
import { setTimeout } from 'timers/promises';

export class RaydiumAnchorClient {
  private connection: Connection;
  private provider: AnchorProvider;
  private program: Program<RaydiumAmm>;
  private rpcRpsLimit: number;

  constructor(connection: Connection, rpcRpsLimit: number) {
    this.connection = connection;
    this.rpcRpsLimit = rpcRpsLimit;
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

  async getLpBurnPercentage(poolId: string): Promise<number> {
    try {
      console.log(`[START] Calculating burn percentage for pool ${poolId}`);
      
      const lpMint = await this.getLpMintForPool(poolId);
      console.log(`[INFO] LP mint for pool ${poolId}: ${lpMint.toString()}`);
      
      const totalSupply = await this.getLpTotalSupply(lpMint);
      console.log(`[INFO] Total supply for LP mint: ${totalSupply}`);
      
      const burnedAmount = await this.getBurnedAmount(lpMint);
      console.log(`[INFO] Burned amount for LP mint: ${burnedAmount}`);
      
      const supplyWithBurned = totalSupply + burnedAmount;
      const burnPercentage = (burnedAmount / supplyWithBurned) * 100;
      console.log(`[RESULT] Burn percentage: ${burnPercentage.toFixed(2)}%`);
      
      return burnPercentage;
    } catch (error) {
      console.error(`[ERROR] Failed to calculate LP burn percentage: ${error}`);
      throw new Error(`Failed to calculate LP burn percentage for pool ${poolId}: ${error}`);
    }
  }
  
  private async getLpMintForPool(poolId: string): Promise<PublicKey> {
    try {
      console.log(`[INFO] Fetching LP mint for pool ${poolId}`);
      return (await this.program.account.ammInfo.fetch(new PublicKey(poolId))).lpMint;
    } catch (error) {
      console.error(`[ERROR] Failed to fetch LP mint: ${error}`);
      throw new Error(`Failed to fetch LP mint for pool ${poolId}: ${error}`);
    }
  }

  private async getLpTotalSupply(lpMint: PublicKey): Promise<number> {
    console.log(`[INFO] Fetching total supply for LP mint ${lpMint.toString()}`);
    const mintInfo = await getMint(this.connection, lpMint);
    return Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals);
  }

  private async getAllSignaturesForAddress(address: PublicKey): Promise<Array<{signature: string}>> {
    console.log(`[INFO] Starting to fetch all signatures for ${address.toString()}`);
    const SIGNATURE_LIMIT = 1000;
    let allSignatures = [];
    let lastSignature = null;
    let batchCount = 0;
    
    while (true) {
      batchCount++;
      console.log(`[INFO] Fetching signature batch #${batchCount}, last signature: ${lastSignature || 'none'}`);
      
      const options: any = { limit: SIGNATURE_LIMIT };
      if (lastSignature) options.before = lastSignature;
      
      const signatures = await this.connection.getSignaturesForAddress(address, options, "finalized");
      console.log(`[INFO] Batch #${batchCount}: Found ${signatures.length} signatures`);
      
      if (signatures.length === 0) {
        console.log(`[INFO] No more signatures found, ending pagination`);
        break;
      }
      
      allSignatures.push(...signatures);
      lastSignature = signatures[signatures.length - 1].signature;
      console.log(`[INFO] New last signature: ${lastSignature}`);
      
      if (signatures.length < SIGNATURE_LIMIT) {
        console.log(`[INFO] Reached end of signatures (batch size < limit)`);
        break;
      }
      
      console.log(`[INFO] Waiting before fetching next batch...`);
      await setTimeout(1000 / this.rpcRpsLimit);
    }
    
    console.log(`[INFO] Total signatures fetched: ${allSignatures.length}`);
    return allSignatures;
  }

  private async getBurnedAmount(lpMint: PublicKey): Promise<number> {
    console.log(`[INFO] Calculating burned amount for LP mint ${lpMint.toString()}`);
    let totalBurned = 0n;
    const mintInfo = await getMint(this.connection, lpMint);
    const decimals = mintInfo.decimals;
    let processedCount = 0;
    let burnCount = 0;

    try {
      console.log(`[INFO] Fetching signatures for LP mint...`);
      const allSignatures = await this.getAllSignaturesForAddress(lpMint);
      console.log(`[INFO] Processing ${allSignatures.length} transactions for burn operations`);

      for (const sig of allSignatures) {
        processedCount++;
        if (processedCount % 50 === 0 || processedCount === 1) {
          console.log(`[INFO] Processing transaction ${processedCount}/${allSignatures.length} (${(processedCount/allSignatures.length*100).toFixed(1)}%)`);
        }
        
        await setTimeout(1000 / this.rpcRpsLimit);
        
        const tx = await this.connection.getParsedTransaction(sig.signature, {
          commitment: "confirmed", 
          maxSupportedTransactionVersion: 0 
        });
        
        if (!tx || !tx.meta) {
          console.log(`[WARN] Transaction ${sig.signature} could not be parsed, skipping`);
          continue;
        }

        for (const ix of tx.transaction.message.instructions) {
          if (
            "programId" in ix &&
            ix.programId.toString() === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" &&
            "parsed" in ix &&
            ix.parsed?.type === "burn"
          ) {
            const amount = BigInt(ix.parsed.info.amount);
            totalBurned += amount;
            burnCount++;
            console.log(`[INFO] Found burn in transaction ${sig.signature}: ${amount.toString()} tokens`);
          }
        }
      }

      console.log(`[INFO] Processing complete. Found ${burnCount} burn operations totaling ${totalBurned.toString()} tokens`);
      return Number(totalBurned) / Math.pow(10, decimals);
    } catch (error) {
      console.error(`[ERROR] Failed to fetch burned amount: ${error}`);
      throw new Error(`Failed to fetch burned amount for LP mint ${lpMint.toString()}: ${error}`);
    }
  }
} 