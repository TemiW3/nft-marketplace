#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
pub mod instructions;
pub mod state;
pub mod errors;

use instructions::*;

declare_id!("EKReNxVoonN5sRAVgvNQiMWFfvkyRYSqWnNoYgAUaQRW");

#[program]
pub mod nftmarketplace {
    use super::*;

    pub fn initialize_marketplace(
        ctx: Context<InitializeMarketplace>,
        fee_percentage: u16,
    ) -> Result<()> {
        initialize(ctx, fee_percentage)
    }

    pub fn create_nft_listing(
        ctx: Context<CreateListing>,
        price: u64,
    ) -> Result<()> {
            create_listing(ctx, price)
        }

    pub fn buy(
        ctx: Context<BuyNft>,
    ) -> Result<()> {
        buy_nft(ctx)
    }

    pub fn cancel_nft_listing(
        ctx: Context<CancelListing>,
    ) -> Result<()> {
        cancel_listing(ctx)
    }
}

