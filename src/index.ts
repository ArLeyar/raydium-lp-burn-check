import { getLpBurnPercentage } from './lpBurnChecker';

const poolAddress = "4YekqhuTmgBq7Fy6qtmpCQL4Kgqp1TUcGNbXMvEt4BtR";

getLpBurnPercentage(poolAddress)
  .then((burnPercentage) => {
    console.log(`Pool ${poolAddress} burn percentage: ${burnPercentage.toFixed(2)}%`);
  })
  .catch((error) => {
    console.error(`Error checking pool ${poolAddress}:`, error);
  });