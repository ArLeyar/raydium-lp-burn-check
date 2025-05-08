import { getLpBurnPercentage, getPoolInfo } from './lpBurnChecker';

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
      const poolInfo = await getPoolInfo(poolAddress);
      const pairName = `${poolInfo.mintA.symbol}-${poolInfo.mintB.symbol}`;
      const poolType = getPoolType(poolInfo.programId);
      const burnPercentage = await getLpBurnPercentage(poolAddress);
      console.log(`${pairName} - ${poolType} - ${burnPercentage.toFixed(2)}%`);
    } catch (error) {
      console.error(`Error processing pool ${poolAddress}: ${error}`);
    }
  }
}

checkPools();