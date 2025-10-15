import { describe, it } from 'mocha'
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Nftmarketplace } from '../target/types/nftmarketplace'
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { createAssociatedTokenAccount, createMint, mintTo } from '@solana/spl-token'
import { expect } from 'chai'

describe('NFT-Marketplace', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.Nftmarketplace as Program<Nftmarketplace>
  const connection = provider.connection

  // Accounts
  let marketplaceAuthority: Keypair
  let seller: Keypair
  let buyer: Keypair
  let nftMint: PublicKey
  let marketplacePDA: PublicKey
  let marketplaceBump: number
  const FEE_PERCENTAGE = 250 // 2.5%

  before(async () => {
    marketplaceAuthority = Keypair.generate()
    seller = Keypair.generate()
    buyer = Keypair.generate()

    const airdropAmount = 2 * LAMPORTS_PER_SOL
    await connection.requestAirdrop(marketplaceAuthority.publicKey, airdropAmount)
    await connection.requestAirdrop(seller.publicKey, airdropAmount)
    await connection.requestAirdrop(buyer.publicKey, airdropAmount)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    nftMint = await createMint(connection, marketplaceAuthority, marketplaceAuthority.publicKey, null, 0)
    ;[marketplacePDA, marketplaceBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('marketplace')],
      program.programId,
    )
  })

  describe('Initialize Marketplace', () => {
    it('Initializes the marketplace Successfully', async () => {
      await program.methods
        .initializeMarketplace(FEE_PERCENTAGE)
        .accountsStrict({
          marketplace: marketplacePDA,
          authority: marketplaceAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([marketplaceAuthority])
        .rpc()

      const marketplaceAccount = await program.account.nftMarketplace.fetch(marketplacePDA)

      expect(marketplaceAccount.authority.toBase58()).to.equal(marketplaceAuthority.publicKey.toBase58())
      expect(marketplaceAccount.feePercentage).to.equal(FEE_PERCENTAGE)
      expect(marketplaceAccount.bump).to.equal(marketplaceBump)
    })

    it('Initialise the Marketplace Failing because one has already been created', async () => {
      try {
        await program.methods
          .initializeMarketplace(FEE_PERCENTAGE)
          .accountsStrict({
            marketplace: marketplacePDA,
            authority: marketplaceAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([marketplaceAuthority])
          .rpc()
        expect.fail('The marketplace was created twice')
      } catch (error: any) {
        expect(error.message).to.include('already in use')
      }
    })
  })

  describe('Create NFT Listing', () => {
    let sellerNftTokenAccount: PublicKey
    let nftTokenAccountPDA: PublicKey
    let listingPDA: PublicKey

    before(async () => {
      sellerNftTokenAccount = await createAssociatedTokenAccount(
        connection,
        marketplaceAuthority,
        nftMint,
        seller.publicKey,
      )

      await mintTo(connection, marketplaceAuthority, nftMint, sellerNftTokenAccount, marketplaceAuthority, 1)
      ;[nftTokenAccountPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('token_account'), nftMint.toBuffer()],
        program.programId,
      )
      ;[listingPDA] = PublicKey.findProgramAddressSync([Buffer.from('listing'), nftMint.toBuffer()], program.programId)
    })

    it('Creates a listing successfully', async () => {
      const price = new anchor.BN(0.5 * LAMPORTS_PER_SOL)

      await program.methods
        .createNftListing(price)
        .accountsStrict({
          listing: listingPDA,
          marketplace: marketplacePDA,
          tokenAccount: nftTokenAccountPDA,
          sellerTokenAccount: sellerNftTokenAccount,
          seller: seller.publicKey,
          mint: nftMint,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller])
        .rpc()

      const listingAccount = await program.account.listing.fetch(listingPDA)

      expect(listingAccount.seller.toBase58()).to.equal(seller.publicKey.toBase58())
      expect(listingAccount.mint.toBase58()).to.equal(nftMint.toBase58())
      expect(listingAccount.price.toNumber()).to.equal(price.toNumber())
      expect(listingAccount.isActive).to.equal(true)
    })
  })
})
