import { ethers } from "ethers";

export const PROTOCOL_FEE_WALLET = "0x31615DCce644668F4F94B8073c658C54a43A8571";
export const PROTOCOL_FEE_BPS   = 6n; // 0.06% auto-sent on every swap

export const AMM_FACTORY_ABI = [
  "function allPoolsLength() view returns (uint256)",
  "function allPools(uint256) view returns (address)",
  "function getPool(address,address) view returns (address)",
  "function createPool(address,address) returns (address)",
];

export const AMM_POOL_ABI = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function getReserves() view returns (uint256,uint256)",
  "function totalSupply() view returns (uint256)",
  "function getPrice() view returns (uint256)",
  "function getAmountOut(address,uint256) view returns (uint256,uint256,uint256)",
  "function swap(address,uint256,uint256,address) returns (uint256)",
  "function addLiquidity(uint256,uint256,uint256,uint256,address) returns (uint256,uint256,uint256)",
  "function removeLiquidity(uint256,uint256,uint256,address) returns (uint256,uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
];

export const TOKEN_REGISTRY_ABI = [
  "function registerToken(address) returns (bool)",
  "function getToken(address) view returns (tuple(address tokenAddress,string name,string symbol,uint8 decimals,bool verified,bool blacklisted,uint256 registeredAt,address registeredBy))",
  "function totalTokens() view returns (uint256)",
  "function getTokensPaginated(uint256,uint256) view returns (tuple(address tokenAddress,string name,string symbol,uint8 decimals,bool verified,bool blacklisted,uint256 registeredAt,address registeredBy)[])",
  "function isRegistered(address) view returns (bool)",
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
  ammFactory:    process.env.NEXT_PUBLIC_AMM_FACTORY_ADDRESS         || "",
  tokenRegistry: process.env.NEXT_PUBLIC_TOKEN_REGISTRY_ADDRESS      || "",
  feeManager:    process.env.NEXT_PUBLIC_FEE_REWARD_MANAGER_ADDRESS  || "",
};

// Known Monad Mainnet tokens
export const MONAD_TOKENS = [
  { address: "native",                                         symbol: "MON",   name: "Monad",        decimals: 18, logoColor: "#836EF9" },
  { address: "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",    symbol: "WMON",  name: "Wrapped Monad", decimals: 18, logoColor: "#836EF9" },
  { address: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",    symbol: "USDC",  name: "USD Coin",      decimals: 6,  logoColor: "#2775CA" },
  { address: "0x5D876D73f4441D5f2438B1A3e2A51771B337F27A",    symbol: "USDT",  name: "Tether USD",    decimals: 6,  logoColor: "#26A17B" },
  { address: "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37",    symbol: "WETH",  name: "Wrapped ETH",   decimals: 18, logoColor: "#627EEA" },
  { address: "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d",    symbol: "WBTC",  name: "Wrapped BTC",   decimals: 8,  logoColor: "#F7931A" },
  { address: "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50",    symbol: "shMON", name: "Shmonad",       decimals: 18, logoColor: "#00FFD1" },
];

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
    const tx = await token.approve(spender, amount * 10n);
    await tx.wait();
  }
}

// Auto-send protocol fee to fee wallet on every swap
export async function sendProtocolFee(tokenAddress, amountIn, signer) {
  try {
    if (!tokenAddress || tokenAddress === "native") return;
    const fee = (amountIn * PROTOCOL_FEE_BPS) / 10000n;
    if (fee === 0n) return;
    const token = getContract(tokenAddress, ERC20_ABI, signer);
    await token.transfer(PROTOCOL_FEE_WALLET, fee);
  } catch {
    // Non-blocking — swap still succeeds even if fee transfer fails
  }
}
