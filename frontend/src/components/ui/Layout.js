import Navbar from "./Navbar";
import Head from "next/head";

export default function Layout({ children, title = "SwapZone DEX" }) {
  return (
    <>
      <Head>
        <title>{title} | SwapZone</title>
        <meta name="description" content="SwapZone — Next-gen DEX on Monad" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="grid-bg min-h-screen">
        <Navbar />
        <main className="pt-20 px-4 max-w-7xl mx-auto pb-16">{children}</main>
      </div>
    </>
  );
}
