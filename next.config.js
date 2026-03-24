/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_MONAD_RPC:                    process.env.NEXT_PUBLIC_MONAD_RPC,
    NEXT_PUBLIC_CHAIN_ID:                     process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_AMM_FACTORY_ADDRESS:          process.env.NEXT_PUBLIC_AMM_FACTORY_ADDRESS,
    NEXT_PUBLIC_ORDER_BOOK_ADDRESS:           process.env.NEXT_PUBLIC_ORDER_BOOK_ADDRESS,
    NEXT_PUBLIC_TOKEN_REGISTRY_ADDRESS:       process.env.NEXT_PUBLIC_TOKEN_REGISTRY_ADDRESS,
    NEXT_PUBLIC_FEE_REWARD_MANAGER_ADDRESS:   process.env.NEXT_PUBLIC_FEE_REWARD_MANAGER_ADDRESS,
    NEXT_PUBLIC_BACKEND_URL:                  process.env.NEXT_PUBLIC_BACKEND_URL,
  },
};

module.exports = nextConfig;
