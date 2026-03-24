import "../styles/globals.css";
import { WalletProvider } from "../hooks/useWallet";

export default function App({ Component, pageProps }) {
  return (
    <WalletProvider>
      <Component {...pageProps} />
    </WalletProvider>
  );
}
