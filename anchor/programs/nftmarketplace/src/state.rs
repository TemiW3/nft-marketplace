use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct NftMarketplace {
    pub authority: Pubkey,
    pub fee_percentage: u16,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Listing {
    pub seller: Pubkey,
    pub mint: Pubkey,
    pub token_account: Pubkey,
    pub price: u64,
    pub is_active: bool,
    pub bump: u8,
}
