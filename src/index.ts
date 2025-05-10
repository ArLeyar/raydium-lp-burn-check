import { Connection } from "@solana/web3.js";
import { RaydiumSdkClient } from './raydium-sdk-client';
import { RaydiumClient } from './raydium-client';
import { HeliusClient } from './helius-client';
import * as dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";

const connection = new Connection(RPC_URL);
const heliusClient = new HeliusClient(HELIUS_API_KEY);
const raydiumClient = new RaydiumClient(connection, heliusClient);
const raydiumSdkClient = new RaydiumSdkClient(connection);

const poolAddresses = [
  "4YekqhuTmgBq7Fy6qtmpCQL4Kgqp1TUcGNbXMvEt4BtR", // ADA-WSOL - 100%
  "F6L22zNLPUV2uQjENLnBN89NUay1pyMXhVxa3HT3XUEz", // WSOL-XWH - 99.98%
  "3PsWheVt2Z23DVvqaS9eyB3rJP96sxVaueFKBXw6ZSpD", // WSOL-BUMBANA - 93.76%
  "Hd7WiNZzZiGGhsHQa79n3mTrFoMkfJnJn619iTqkRkcQ", // WSOL-LIGMA - 0%
  "Ap975tKrfdTyXWtFjYkHs8KqgTmQpqRU8aMzLgijdRiQ", // Tom&Jerry-WSOL - 0%
  "CJVLgaSSuGarPWLx57f79T1EEMKg26fM1o3MMm1afD6J", // IQ50-WSOL - 57.96%
  "FXvEbWbzGxKMFBa9vT18YhJ2GzvHkz4E1BBN7Tr5Aur4", // RED-WSOL - 100%
  "HbWYJ7kSAhbg42rMQM7en38BnYyTpMrwDu6fCquD1TAt", // SHOL-WSOL - 100%
  "FEhz48ovHkjKGAjLmRVqsDc8r6T9hXCZf8N4GSzw3dv3", // SKING-WSOL - 100%
];

function formatTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round(ms / 60000)}m`;
}

async function checkPoolsBurnRate() {
  console.log('PAIR - SDK BURN % - HELIUS BURN % - RPC BURN % - MATCH - ADDRESS');
  
  for (const poolAddress of poolAddresses) {
    try {
      const poolInfo = await raydiumSdkClient.getPoolInfo(poolAddress);
      const pairName = `${poolInfo.mintA.symbol}-${poolInfo.mintB.symbol}`;
      
      const sdkStart = performance.now();
      const sdkBurnPercentage = await raydiumSdkClient.getLpBurnPercentage(poolAddress);
      const sdkTime = formatTime(performance.now() - sdkStart);
      
      const heliusStart = performance.now();
      const heliusBurnPercentage = await raydiumClient.getLpBurnPercentageHelius(poolAddress);
      const heliusTime = formatTime(performance.now() - heliusStart);
      
      const rpcStart = performance.now();
      const rpcBurnPercentage = await raydiumClient.getLpBurnPercentageRpc(poolAddress);
      const rpcTime = formatTime(performance.now() - rpcStart);
      
      const heliusMatch = Math.abs(sdkBurnPercentage - heliusBurnPercentage) < 0.01;
      const rpcMatch = Math.abs(sdkBurnPercentage - rpcBurnPercentage) < 0.01;
      const indicator = heliusMatch && rpcMatch ? '✅' : '❌';
      
      console.log(
        `${pairName} - ` +
        `${sdkBurnPercentage.toFixed(2)}% (${sdkTime}) - ` +
        `${heliusBurnPercentage.toFixed(2)}% (${heliusTime}) - ` +
        `${rpcBurnPercentage.toFixed(2)}% (${rpcTime}) ${indicator} - ` +
        poolAddress
      );
    } catch (error) {
      console.error(`Error processing pool ${poolAddress}: ${error}`);
    }
  }
}

checkPoolsBurnRate();