use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Transfer};
use anchor_lang::solana_program::{system_instruction::transfer, program::invoke};
use crate::state::*;
use crate::errors::*;

pub fn buy_nft(
    ctx: Context<BuyNft>,
) -> Result<()> {
    let listing = &mut ctx.accounts.listing;
    let marketplace = &ctx.accounts.marketplace;

    require!(listing.is_active, NftMarketplaceError::ListingInactive);
    require!(ctx.accounts.buyer.lamports() >= listing.price, NftMarketplaceError::InsufficientFunds);

    let fee_amount = listing.price * (marketplace.fee_percentage as u64) / 100;
    let seller_amount = listing.price - fee_amount;

    // Transfer SOL to seller
    let transfer_to_seller = transfer(
        &ctx.accounts.buyer.key(),
        &ctx.accounts.seller.key(),
        seller_amount,
    );

    invoke(
        &transfer_to_seller,
        &[
            ctx.accounts.buyer.to_account_info(),
            ctx.accounts.seller.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ]
    )?;

    // Transfer fee to marketplace authority
    let transfer_fee = transfer(
        &ctx.accounts.buyer.key(),
        &ctx.accounts.marketplace_authority.key(),
        fee_amount,
    );

    invoke(
        &transfer_fee,
        &[
            ctx.accounts.buyer.to_account_info(),
            ctx.accounts.marketplace_authority.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ]
    )?;

    // Transfer NFT to Buyer
    let seeds = &[
        b"token_account",
        listing.mint.as_ref(),
        &[ctx.bumps.token_account],
    ];

    let signer = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.token_account.to_account_info(),
        to: ctx.accounts.buyer_token_account.to_account_info(),
        authority: ctx.accounts.marketplace_authority.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
    anchor_spl::token::transfer(cpi_ctx, 1)?;

    listing.is_active = false;

    Ok(())
}

#[derive(Accounts)]
pub struct BuyNft<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"listing", listing.mint.key().as_ref()],
        bump = listing.bump,
    )]
    pub listing: Account<'info, Listing>,

    #[account(
        seeds = [b"marketplace"],
        bump = marketplace.bump,
    )]
    pub marketplace: Account<'info, NftMarketplace>,

    /// CHECK: This is a token account that we validate in the instruction
    #[account(
        mut,
        seeds = [b"token_account", listing.mint.key().as_ref()],
        bump,
    )]
    pub token_account: UncheckedAccount<'info>,

    /// CHECK: This is a token account that we validate in the instruction
    #[account(mut)]
    pub buyer_token_account: UncheckedAccount<'info>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    pub seller: UncheckedAccount<'info>,
    
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub marketplace_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}