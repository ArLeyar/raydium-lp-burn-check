# Raydium LP Burn Check

A TypeScript utility to verify and compare burn percentages of Raydium liquidity pools using multiple methods.

## Overview

This tool calculates LP token burn percentages for Raydium liquidity pools using three different methods and compares the results:

1. **Raydium SDK** - Uses the official Raydium SDK to fetch burn percentages
2. **Helius API** - Uses Helius API to find burn transactions
3. **RPC API** - Uses direct Solana RPC calls to calculate burns

The tool displays results with timing information and indicates whether all methods produce matching results.

## Features

- Rate-limited API calls to prevent throttling (500ms between Helius requests, 150ms between RPC requests)
- Pagination support for transaction history
- Axios with retry functionality for API resilience
- Efficient filtering of burn transactions
- Comparative analysis of burn percentages from different sources
- Performance timing for each method

## Example Output

```
PAIR - SDK BURN % - HELIUS BURN % - RPC BURN % - MATCH - ADDRESS
ADA-WSOL - 100.00% (229ms) - 100.00% (5s) - 100.00% (1s) ✅ - 4YekqhuTmgBq7Fy6qtmpCQL4Kgqp1TUcGNbXMvEt4BtR
WSOL-XWH - 99.98% (128ms) - 99.99% (4s) - 99.99% (17s) ✅ - F6L22zNLPUV2uQjENLnBN89NUay1pyMXhVxa3HT3XUEz
WSOL-BUMBANA - 93.76% (122ms) - 93.76% (4s) - 93.76% (2s) ✅ - 3PsWheVt2Z23DVvqaS9eyB3rJP96sxVaueFKBXw6ZSpD
```

## Performance

- **Helius API**: Faster for pools with many transactions (>100)
- **RPC API**: More efficient for pools with fewer transactions (<100)
- **Note**: Pools with very large transaction counts (>1000) may have long query times

## Setup

1. Create a `.env` file with the following variables:
```
RPC_URL="https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY"
HELIUS_API_KEY="YOUR_API_KEY"
```

2. Install dependencies and run:
```bash
npm install
npm run start
```

## Technical Notes

- Uses code from [raydium-idl](https://github.com/raydium-io/raydium-idl/tree/master/raydium_amm) to interact with Raydium AMM v4
- Custom decoders are required for working with the non-Anchor based Raydium AMM program
- For production use with many pools, a dedicated indexer would provide more efficient data access