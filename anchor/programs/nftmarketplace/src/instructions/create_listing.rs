use anchor_lang::prelude::*;
use anchor_spl::token::{Token, transfer, Transfer, TokenAccount, Mint};

use crate::state::*;
use crate::errors::NftMarketplaceError;

pub fn create_listing(
    ctx: Context<CreateListing>,
    price: u64,
) -> Result<()> {
    let listing = &mut ctx.accounts.listing;

    // Prevent creating an already-active listing
    if listing.is_active {
        return err!(NftMarketplaceError::ListingAlreadyActive);
    }

    // (Re)initialize listing data
    listing.seller = ctx.accounts.seller.key();
    listing.mint = ctx.accounts.mint.key();
    listing.token_account = ctx.accounts.token_account.key();
    listing.price = price;
    listing.is_active = true;

    let (_pda, listing_bump) = Pubkey::find_program_address(
        &[b"listing", ctx.accounts.mint.key().as_ref()],
        ctx.program_id,
    );
    listing.bump = listing_bump;

    // Transfer the NFT from the seller to the marketplace's token account
    let cpi_accounts = Transfer {
        from: ctx.accounts.seller_token_account.to_account_info(),
        to: ctx.accounts.token_account.to_account_info(),
        authority: ctx.accounts.seller.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    transfer(cpi_ctx, 1)?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(price: u64)]
pub struct CreateListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        init_if_needed,
        payer = seller,
        space = 8 + Listing::INIT_SPACE,
        seeds = [b"listing", mint.key().as_ref()],
        bump,
    )]
    pub listing: Account<'info, Listing>,

    #[account(
        seeds = [b"marketplace"],
        bump = marketplace.bump,
    )]
    pub marketplace: Account<'info, NftMarketplace>,

    #[account(
        init_if_needed,
        payer = seller,
        token::mint = mint,
        token::authority = marketplace,
        seeds = [b"token_account", mint.key().as_ref()],
        bump,
    )]
    pub token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}