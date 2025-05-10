import { Connection } from "@solana/web3.js";
import { RaydiumSdkClient } from './raydium-sdk-client';
import { RaydiumAnchorClient } from './raydium-anchor-client';
import * as dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
const RPC_RPS_LIMIT = Number(process.env.RPC_RPS_LIMIT) || 1;

const connection = new Connection(RPC_URL);
const raydiumSdkClient = new RaydiumSdkClient(connection);
const raydiumAnchorClient = new RaydiumAnchorClient(connection, RPC_RPS_LIMIT);

const poolAddresses = [
  "4YekqhuTmgBq7Fy6qtmpCQL4Kgqp1TUcGNbXMvEt4BtR",
  "AUUXZxw1uizZZqna65fdM1ct1f2GWqkivSGyqm55mWQK",
  "Bzc9NZfMqkXR6fz1DBph7BDf9BroyEf6pnzESP7v5iiw",
  "J333LZ5UhEjwxb64dcD756viUFXr164dVNxQpXuMPH9V",
  "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2",
  "4AZRPNEfCJ7iw28rJu5aUyeQhYcvdcNm8cswyL51AY9i",
  "AS5MV3ear4NZPMWXbCsEz3AdbCaXEnq4ChdaWsvLgkcM",
  "4fnrjdmQcfC1AcmH2qbq52QH6xa1MYo9212Ue6fhXN63",
  "zZHEShHcuD5QyA3LNc5FGzT4MS7zK2NPx5dQt1u5sw2",
  "ZShgFP9NUJfDZ4RyQkn337GS73VtJjPQfpRFMKndvUZ",
  "6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeBtbt7rxWo1mg",
  "5yZUYGpnhsuaAQ3jKRLDVSXunDXTgkRUJrYoeP6aNctZ", //wrong pool address
];

const getPoolType = (programId: string): string => {
  switch (programId) {
    case 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C':
      return 'Standard AMM (CP-Swap)';
    case '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8':
      return 'Legacy AMM v4 (OpenBook)';
    case 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK':
      return 'Concentrated Liquidity (CLMM)';
    default:
      return 'Unknown';
  }
};

async function checkPools() {
  console.log('PAIR - TYPE - BURNT PERCENTAGE');
  
  for (const poolAddress of poolAddresses) {
    try {
      const poolInfo = await raydiumSdkClient.getPoolInfo(poolAddress);
      const pairName = `${poolInfo.mintA.symbol}-${poolInfo.mintB.symbol}`;
      const poolType = getPoolType(poolInfo.programId);
      const burnPercentage = await raydiumSdkClient.getLpBurnPercentage(poolAddress);
      console.log(`${pairName} - ${poolType} - ${burnPercentage.toFixed(2)}% - ${poolAddress}`);
    } catch (error) {
      console.error(`Error processing pool ${poolAddress}: ${error}`);
    }
  }
}

async function testIdlClient() {
  const testPool = "4AZRPNEfCJ7iw28rJu5aUyeQhYcvdcNm8cswyL51AY9i";
  try {
    console.log(`\n----- Testing RaydiumAnchorClient with pool ${testPool} -----`);
    const burnPercentage = await raydiumAnchorClient.getLpBurnPercentage(testPool);
    console.log(`LP burn percentage: ${burnPercentage.toFixed(2)}%`);
    console.log(`\n----- End of tests -----`);
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

//checkPools();
testIdlClient();