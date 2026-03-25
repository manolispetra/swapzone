import "../styles/globals.css";
import { Web3Provider } from "../utils/web3";

export default function App({ Component, pageProps }) {
  return (
    <Web3Provider>
      <Component {...pageProps} />
    </Web3Provider>
  );
}
