import { ApiV3PoolInfoItem } from "@raydium-io/raydium-sdk-v2";
import { Connection } from "@solana/web3.js";
import { Raydium } from "@raydium-io/raydium-sdk-v2";

export class RaydiumSdkClient {
  private connection: Connection;
  private raydiumInstance: Raydium | null = null;
  
  constructor(connection: Connection) {
    this.connection = connection;
  }
  
  private async getRaydium(): Promise<Raydium> {
    if (!this.raydiumInstance) {
      this.raydiumInstance = await Raydium.load({
        connection: this.connection,
        disableLoadToken: false,
      });
    }
    return this.raydiumInstance;
  }
  
  async getLpBurnPercentage(poolAddress: string): Promise<number> {
    const poolInfo = await this.getPoolInfo(poolAddress);
    return poolInfo.burnPercent;
  }
  
  async getPoolInfo(poolAddress: string): Promise<ApiV3PoolInfoItem> {
    const raydium = await this.getRaydium();
    
    const poolsData = await raydium.api.fetchPoolById({ ids: poolAddress });
    
    if (!poolsData || !poolsData.length || poolsData[0] === null) {
      throw new Error("Pool not found");
    }
    
    return poolsData[0];
  }
}