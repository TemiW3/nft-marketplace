use anchor_lang::prelude::*;

use crate::state::*;

pub fn initialize(
    ctx: Context<InitializeMarketplace>,
    fee_percentage: u16,
) -> Result<()> {
    
    let marketplace = &mut ctx.accounts.marketplace;

    marketplace.authority = *ctx.accounts.authority.key;
    marketplace.fee_percentage = fee_percentage;
    marketplace.bump = ctx.bumps.marketplace;
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeMarketplace<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + NftMarketplace::INIT_SPACE,
        seeds = [b"marketplace"],
        bump,
    )]
    pub marketplace: Account<'info, NftMarketplace>,

    pub system_program: Program<'info, System>,
}