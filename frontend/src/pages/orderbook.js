import Layout from "../components/ui/Layout";
import OrderBook from "../components/orderbook/OrderBook";
export default function OrderBookPage() {
  return (
    <Layout title="Orders">
      <div className="pt-8">
        <div className="text-center mb-8">
          <h1 className="neon-text text-3xl font-bold mb-1" style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:"0.06em" }}>LIMIT ORDERS</h1>
          <p className="text-muted text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>Off-chain orders · AMM execution · Fees auto-collected on-chain</p>
        </div>
        <OrderBook />
      </div>
    </Layout>
  );
}
