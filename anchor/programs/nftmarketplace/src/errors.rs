use anchor_lang::prelude::*;

#[error_code]
pub enum NftMarketplaceError {
    #[msg("Listing is inactive")]
    ListingInactive,

    #[msg("Insufficient funds")]
    InsufficientFunds,

    #[msg("Listing is not active")]
    ListingNotActive,

    #[msg("Unauthorized")]
    Unauthorized,
}