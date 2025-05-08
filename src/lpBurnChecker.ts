import { getRaydium } from "./raydium";

export async function getLpBurnPercentage(poolAddress: string): Promise<number> {
    const poolInfo = await getPoolInfo(poolAddress);
    return typeof poolInfo.burnPercent === 'number' ? poolInfo.burnPercent : 0;
  } 

async function getPoolInfo(poolAddress: string) {
  const raydium = await getRaydium();
  
  const poolsData = await raydium.api.fetchPoolById({ ids: poolAddress });
  if (!poolsData || !poolsData.length) {
    throw new Error("Pool not found");
  }
  
  return poolsData[0] as any;
}