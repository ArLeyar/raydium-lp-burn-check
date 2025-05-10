import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { setTimeout } from 'timers/promises';

type Transaction = {
  type: string;
  signature: string;
  tokenTransfers: {
    mint: string;
    tokenAmount: number;
  }[];
}

const SLEEP_TIME_MS = 500; //2 RPS limit for Helius API

export class HeliusClient {
  private client;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error('Helius API key is required');

    this.client = axios.create({
      baseURL: 'https://api.helius.xyz/v0',
      params: { 'api-key': apiKey }
    });

    //Retry logic for Helius API, sometimes it fails due to rate limit
    axiosRetry(this.client, {
      retries: 5,
      retryDelay: (retryCount: number, error: AxiosError) => {
        const delay = 1000 * 2 ** retryCount
        console.warn(`Helius API: Retry attempt #${retryCount}, waiting ${delay} ms`);
        return delay;
      },
      retryCondition: (error: AxiosError) => {
        return error.response?.status === 429 || axiosRetry.isNetworkError(error);
      }
    });
  }

  async getAllTransactions(address: string, type?: string): Promise<Transaction[]> {
    const transactions: Transaction[] = [];
    let lastSignature: string | undefined;
    
    while (true) {
      await setTimeout(SLEEP_TIME_MS); //Sleep to avoid rate limit
      
      const { data } = await this.client.get<Transaction[]>(`/addresses/${address}/transactions`, {
        params: { 
          limit: 100, //Max limit for Helius API
          before: lastSignature 
        }
      });

      if (data.length === 0) break;
      
      const filteredData = type ? data.filter(tx => tx.type === type) : data;
      transactions.push(...filteredData);
      
      lastSignature = data[data.length - 1].signature;
    }
    
    return transactions;
  }
} 