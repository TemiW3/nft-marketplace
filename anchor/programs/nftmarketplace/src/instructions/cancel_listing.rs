use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Transfer, transfer};
use crate::state::*;
use crate::errors::*;

pub fn cancel_listing(
    ctx: Context<CancelListing>,
) -> Result<()> {
    let listing = &mut ctx.accounts.listing;

    require!(listing.is_active, NftMarketplaceError::ListingNotActive);
    require!(listing.seller == ctx.accounts.seller.key(), NftMarketplaceError::Unauthorized);

     let seeds = &[
        b"token_account",
        listing.mint.as_ref(),
        &[ctx.bumps.token_account],
    ];
    let signer = &[&seeds[..]];

    // Transfer the NFT back to the seller
    let cpi_accounts = Transfer {
        from: ctx.accounts.token_account.to_account_info(),
        to: ctx.accounts.seller_token_account.to_account_info(),
        authority: ctx.accounts.token_account.to_account_info(),
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

    #[account(
        mut,
        seeds = [b"listing", listing.mint.as_ref()],
        bump = listing.bump,
    )]
    pub listing: Account<'info, Listing>,

    /// CHECK: This is a token account that we validate in the instruction
    #[account(
        mut,
        seeds = [b"token_account", listing.mint.as_ref()],
        bump,
    )]
    pub token_account: UncheckedAccount<'info>,

    /// CHECK: This is a token account that we validate in the instruction
    #[account(mut)]
    pub seller_token_account: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}