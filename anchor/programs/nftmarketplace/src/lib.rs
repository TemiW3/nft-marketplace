#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("Count3AcZucFDPSFBAeHkQ6AvttieKUkyJ8HiQGhQwe");

#[program]
pub mod nftmarketplace {
    use super::*;

    pub fn close(_ctx: Context<CloseNftmarketplace>) -> Result<()> {
        Ok(())
    }

    pub fn decrement(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.nftmarketplace.count = ctx.accounts.nftmarketplace.count.checked_sub(1).unwrap();
        Ok(())
    }

    pub fn increment(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.nftmarketplace.count = ctx.accounts.nftmarketplace.count.checked_add(1).unwrap();
        Ok(())
    }

    pub fn initialize(_ctx: Context<InitializeNftmarketplace>) -> Result<()> {
        Ok(())
    }

    pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
        ctx.accounts.nftmarketplace.count = value.clone();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeNftmarketplace<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
  init,
  space = 8 + Nftmarketplace::INIT_SPACE,
  payer = payer
    )]
    pub nftmarketplace: Account<'info, Nftmarketplace>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseNftmarketplace<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
  mut,
  close = payer, // close account and return lamports to payer
    )]
    pub nftmarketplace: Account<'info, Nftmarketplace>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub nftmarketplace: Account<'info, Nftmarketplace>,
}

#[account]
#[derive(InitSpace)]
pub struct Nftmarketplace {
    count: u8,
}
