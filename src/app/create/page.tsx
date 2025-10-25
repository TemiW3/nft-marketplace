export default function CreateListingPage() {
  return (
    <div className="create-listing">
      <h1 className="section-title">Create NFT Listing</h1>
      <p className="text-center text-gray mb-8">List your NFT for sale on the marketplace</p>

      <div className="create-form">
        <div className="form-group">
          <label>NFT Mint Address</label>
          <input type="text" placeholder="Enter your NFT mint address" className="input" />
        </div>

        <div className="form-group">
          <label>Price (SOL)</label>
          <input type="number" placeholder="0.5" step="0.01" className="input" />
        </div>

        <button className="btn btn-primary" style={{ width: '100%' }}>
          Create Listing
        </button>
      </div>
    </div>
  )
}
