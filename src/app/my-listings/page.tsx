export default function MyListingsPage() {
  return (
    <div className="my-listings">
      <h1 className="section-title">My Listings</h1>
      <p className="text-center text-gray mb-8">Manage your NFT listings</p>

      <div className="marketplace-grid">
        {/* User's listings will go here */}
        <p className="text-center text-gray">Connect your wallet to view your listings</p>
      </div>
    </div>
  )
}
