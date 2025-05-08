import { getRaydium } from "./raydium";
import { ApiV3PoolInfoItem } from "@raydium-io/raydium-sdk-v2";

export async function getLpBurnPercentage(poolAddress: string): Promise<number> {
    const poolInfo = await getPoolInfo(poolAddress);
    return poolInfo.burnPercent;
} 

export async function getPoolInfo(poolAddress: string): Promise<ApiV3PoolInfoItem> {
  const raydium = await getRaydium();
  
  const poolsData = await raydium.api.fetchPoolById({ ids: poolAddress });
  if (!poolsData || !poolsData.length) {
    throw new Error("Pool not found");
  }
  
  return poolsData[0];
}