import React from 'react'
import './Home.css'

const Home: React.FC = () => {
  return (
    <section className="home">
      <div className="home-content">
        <h1 className="home-title">
          Discover, Create & Trade
          <span className="home-highlight"> Unique NFTs</span>
        </h1>
        <p className="home-description">
          Experience the future of digital ownership on Solana. Buy, sell, and discover amazing NFTs with lightning-fast
          transactions and minimal fees.
        </p>
        <div className="home-stats">
          <div className="stat">
            <div className="stat-number">10K+</div>
            <div className="stat-label">NFTs Listed</div>
          </div>
          <div className="stat">
            <div className="stat-number">5K+</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat">
            <div className="stat-number">2.5%</div>
            <div className="stat-label">Platform Fee</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Home
