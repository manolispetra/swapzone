import Navbar from "./Navbar";
import Head from "next/head";

export default function Layout({ children, title = "SwapZone DEX" }) {
  return (
    <>
      <Head>
        <title>{title} | SwapZone</title>
        <meta name="description" content="SwapZone — The next-gen DEX on Monad" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="grid-bg min-h-screen">
        <Navbar />
        <main className="pt-20 px-4 max-w-7xl mx-auto pb-16">
          {children}
        </main>
      </div>
    </>
  );
}
