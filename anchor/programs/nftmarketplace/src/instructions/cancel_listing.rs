use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Transfer, transfer, TokenAccount, Mint};
use crate::state::*;
use crate::errors::*;

pub fn cancel_listing(
    ctx: Context<CancelListing>,
) -> Result<()> {
    let listing = &mut ctx.accounts.listing;
    let marketplace = &ctx.accounts.marketplace;

    require!(listing.is_active, NftMarketplaceError::ListingNotActive);
    require!(listing.seller == ctx.accounts.seller.key(), NftMarketplaceError::Unauthorized);

    // Use marketplace PDA as authority to transfer NFT back to seller
    let marketplace_seeds = &[
        b"marketplace".as_ref(),
        &[marketplace.bump] as &[u8],
    ];
    let signer = &[&marketplace_seeds[..]];

    // Transfer the NFT back to the seller
    let cpi_accounts = Transfer {
        from: ctx.accounts.token_account.to_account_info(),
        to: ctx.accounts.seller_token_account.to_account_info(),
        authority: ctx.accounts.marketplace.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    transfer(cpi_ctx, 1)?;

    // Mark the listing as inactive
    listing.is_active = false;

    Ok(())
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"listing", mint.key().as_ref()],
        bump = listing.bump,
    )]
    pub listing: Account<'info, Listing>,

    #[account(
        seeds = [b"marketplace"],
        bump = marketplace.bump,
    )]
    pub marketplace: Account<'info, NftMarketplace>,

    #[account(
        mut,
        seeds = [b"token_account", mint.key().as_ref()],
        bump,
    )]
    pub token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}