import Navbar from "./Navbar";
import Head from "next/head";

export default function Layout({ children, title = "SwapZone DEX" }) {
  return (
    <>
      <Head>
        <title>{title} | SwapZone</title>
        <meta name="description" content="SwapZone — Next-gen DEX on Monad"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <meta name="theme-color" content="#0A0A0A"/>
        <meta property="og:title" content={`${title} | SwapZone`}/>
        <meta property="og:description" content="Next-gen DEX on Monad. Swap, provide liquidity, and earn."/>
        <meta name="twitter:card" content="summary_large_image"/>
      </Head>
      <div className="grid-bg min-h-screen flex flex-col">
        <Navbar />
        <main className="pt-20 px-3 sm:px-4 max-w-7xl w-full mx-auto pb-16 flex-1">
          {children}
        </main>
        {/* Footer */}
        <footer className="border-t border-border py-4 px-4 text-center">
          <p className="text-xs text-muted/50" style={{ fontFamily:"'Space Mono',monospace" }}>
            SwapZone DEX · Monad Mainnet ·{" "}
            <span className="text-muted/70">created by </span>
            <a href="https://twitter.com/Gcretanman" target="_blank" rel="noreferrer"
              className="text-primary/60 hover:text-primary transition-colors">
              Gcretanman
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
