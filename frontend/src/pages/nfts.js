import Layout from "../components/ui/Layout";
import NFTGallery from "../components/nfts/NFTGallery";
export default function NFTsPage() {
  return (
    <Layout title="NFTs">
      <div className="pt-8">
        <NFTGallery />
      </div>
    </Layout>
  );
}
