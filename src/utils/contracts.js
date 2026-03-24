import { ethers } from "ethers";

export const AMM_POOL_ABI = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function getReserves() view returns (uint256,uint256)",
  "function totalSupply() view returns (uint256)",
  "function getPrice() view returns (uint256)",
  "function getAmountOut(address,uint256) view returns (uint256,uint256,uint256)",
  "function swap(address tokenIn, uint256 amountIn, uint256 amountOutMin, address to) returns (uint256)",
  "function addLiquidity(uint256,uint256,uint256,uint256,address) returns (uint256,uint256,uint256)",
  "function removeLiquidity(uint256,uint256,uint256,address) returns (uint256,uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
];

export const AMM_FACTORY_ABI = [
  "function allPoolsLength() view returns (uint256)",
  "function allPools(uint256) view returns (address)",
  "function getPool(address,address) view returns (address)",
  "function createPool(address,address) returns (address)",
  "event PoolCreated(address indexed token0, address indexed token1, address pool, uint256 totalPools)",
];

export const TOKEN_REGISTRY_ABI = [
  "function registerToken(address) returns (bool)",
  "function getToken(address) view returns (tuple(address tokenAddress,string name,string symbol,uint8 decimals,bool verified,bool blacklisted,uint256 registeredAt,address registeredBy))",
  "function totalTokens() view returns (uint256)",
  "function getTokensPaginated(uint256,uint256) view returns (tuple(address tokenAddress,string name,string symbol,uint8 decimals,bool verified,bool blacklisted,uint256 registeredAt,address registeredBy)[])",
  "function isRegistered(address) view returns (bool)",
];

export const FEE_MANAGER_ABI = [
  "function defaultTradingFeeBps() view returns (uint256)",
  "function protocolFeePercent() view returns (uint256)",
  "function protocolFeeWallet() view returns (address)",
  "function accumulatedProtocolFees(address) view returns (uint256)",
  "function calculateFees(address,uint256) view returns (uint256,uint256)",
  "function withdrawProtocolFees(address)",
  "function setDefaultTradingFee(uint256)",
  "function setProtocolFeePercent(uint256)",
  "function setProtocolFeeWallet(address)",
];

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function transfer(address,uint256) returns (bool)",
];

export const ADDRESSES = {
  ammFactory:    process.env.NEXT_PUBLIC_AMM_FACTORY_ADDRESS    || "",
  tokenRegistry: process.env.NEXT_PUBLIC_TOKEN_REGISTRY_ADDRESS || "",
  feeManager:    process.env.NEXT_PUBLIC_FEE_REWARD_MANAGER_ADDRESS || "",
};

export function getReadProvider() {
  return new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_MONAD_RPC || "https://rpc.monad.xyz");
}

export function getContract(address, abi, signerOrProvider) {
  return new ethers.Contract(address, abi, signerOrProvider);
}

export function fmt(val, decimals = 18, dp = 4) {
  try { return parseFloat(ethers.formatUnits(val, decimals)).toFixed(dp); }
  catch { return "0.0000"; }
}

export async function ensureAllowance(tokenAddress, owner, spender, amount, signer) {
  const token = getContract(tokenAddress, ERC20_ABI, signer);
  const allowance = await token.allowance(owner, spender);
  if (allowance < amount) {
    const tx = await token.approve(spender, amount);
    await tx.wait();
  }
}
