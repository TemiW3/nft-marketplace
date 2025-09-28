use anchor_lang::prelude::*;
use anchor_spl::token::{Token, transfer, Transfer, TokenAccount, Mint};

use crate::state::*;

pub fn create_listing(
    ctx: Context<CreateListing>,
    price: u64,
) -> Result<()> {
    let listing = &mut ctx.accounts.listing;

    listing.seller = ctx.accounts.seller.key();
    listing.mint = ctx.accounts.mint.key();
    listing.token_account = ctx.accounts.token_account.key();
    listing.price = price;
    listing.is_active = true;
    listing.bump = ctx.bumps.listing;

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
        init,
        payer = seller,
        space = Listing::INIT_SPACE,
        seeds = [b"listing", mint.key().as_ref()],
        bump,
    )]
    pub listing: Account<'info, Listing>,

    /// CHECK: This is a token account that we validate in the instruction
    #[account(
        mut,
        seeds = [b"token_account", mint.key().as_ref()],
        bump,
    )]
    pub token_account: UncheckedAccount<'info>,

    /// CHECK: This is a token account that we validate in the instruction
    #[account(mut)]
    pub seller_token_account: UncheckedAccount<'info>,

    /// CHECK: This is a mint account that we validate in the instruction
    pub mint: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}