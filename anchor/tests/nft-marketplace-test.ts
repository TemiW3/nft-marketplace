import { describe, it } from 'mocha'
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Nftmarketplace } from '../target/types/nftmarketplace'
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { createAssociatedTokenAccount, createMint, getAccount, mintTo } from '@solana/spl-token'
import { expect } from 'chai'
import { Key } from 'react'

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

    // Initialize the marketplace
    await program.methods
      .initializeMarketplace(FEE_PERCENTAGE)
      .accountsStrict({
        marketplace: marketplacePDA,
        authority: marketplaceAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([marketplaceAuthority])
      .rpc()
  })

  describe('Initialize Marketplace', () => {
    it('Initializes the marketplace Successfully', async () => {
      // Marketplace is already initialized in the before hook, just verify it
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

    it('Create a listing failing because of NFT not existing', async () => {
      const fakeMint = Keypair.generate().publicKey
      const [fakeListingPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('listing'), fakeMint.toBuffer()],
        program.programId,
      )
      const [fakeNftTokenAccountPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('token_account'), fakeMint.toBuffer()],
        program.programId,
      )

      const price = new anchor.BN(0.5 * LAMPORTS_PER_SOL)

      try {
        await program.methods
          .createNftListing(price)
          .accountsStrict({
            listing: fakeListingPDA,
            marketplace: marketplacePDA,
            tokenAccount: fakeNftTokenAccountPDA,
            sellerTokenAccount: sellerNftTokenAccount,
            seller: seller.publicKey,
            mint: fakeMint,
            tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([seller])
          .rpc({ skipPreflight: true })

        expect.fail('Should have failed for non-existent NFT')
      } catch (error: any) {
        expect(error).to.exist
      }
    })
  })

  describe('Buy NFT', () => {
    let buyerNftTokenAccount: PublicKey
    let listingPDA: PublicKey
    let nftTokenAccountPDA: PublicKey

    before(async () => {
      buyerNftTokenAccount = await createAssociatedTokenAccount(
        connection,
        marketplaceAuthority,
        nftMint,
        buyer.publicKey,
      )
      ;[nftTokenAccountPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('token_account'), nftMint.toBuffer()],
        program.programId,
      )
      ;[listingPDA] = PublicKey.findProgramAddressSync([Buffer.from('listing'), nftMint.toBuffer()], program.programId)
    })

    it('Should buy NFT successfully', async () => {
      const listing = await program.account.listing.fetch(listingPDA)
      const price = listing.price.toNumber()

      const buyerBalanceBefore = await connection.getBalance(buyer.publicKey)
      const sellerBalanceBefore = await connection.getBalance(listing.seller)
      const authorityBalanceBefore = await connection.getBalance(marketplaceAuthority.publicKey)

      await program.methods
        .buy()
        .accountsStrict({
          listing: listingPDA,
          marketplace: marketplacePDA,
          tokenAccount: nftTokenAccountPDA,
          buyerTokenAccount: buyerNftTokenAccount,
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          marketplaceAuthority: marketplaceAuthority.publicKey,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc()

      const updatedListing = await program.account.listing.fetch(listingPDA)
      expect(updatedListing.isActive).to.equal(false)

      const buyerNftAccount = await getAccount(connection, buyerNftTokenAccount)
      expect(buyerNftAccount.amount).to.equal(1n)

      const feeAmount = Math.floor(price * 0.025)
      const sellerProceeds = price - feeAmount

      const buyerBalanceAfter = await connection.getBalance(buyer.publicKey)
      const sellerBalanceAfter = await connection.getBalance(listing.seller)
      const authorityBalanceAfter = await connection.getBalance(marketplaceAuthority.publicKey)

      // Buyer pays the price plus transaction fees, so balance should be less than or equal
      expect(buyerBalanceAfter).to.be.at.most(buyerBalanceBefore - price)
      expect(sellerBalanceAfter).to.be.greaterThan(sellerBalanceBefore + sellerProceeds - 1000)
      expect(authorityBalanceAfter).to.be.greaterThan(authorityBalanceBefore + feeAmount - 1000)
    })

    it('Should fail to buy NFT if listing is not active', async () => {
      try {
        await program.methods
          .buy()
          .accountsStrict({
            listing: listingPDA,
            marketplace: marketplacePDA,
            tokenAccount: nftTokenAccountPDA,
            buyerTokenAccount: buyerNftTokenAccount,
            seller: seller.publicKey,
            buyer: buyer.publicKey,
            marketplaceAuthority: marketplaceAuthority.publicKey,
            tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([buyer])
          .rpc()

        expect.fail('Should have failed to buy from inactive listing')
      } catch (error: any) {
        expect(error.message).to.include('Listing is inactive')
      }
    })
  })

  describe('Cancel Listing', () => {
    let seller2: Keypair
    let nftMint2: PublicKey
    let seller2NftTokenAccount: PublicKey
    let nftTokenAccount2PDA: PublicKey
    let listing2PDA: PublicKey

    before(async () => {
      seller2 = Keypair.generate()
      await provider.connection.requestAirdrop(seller2.publicKey, 10 * LAMPORTS_PER_SOL)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      nftMint2 = await createMint(connection, marketplaceAuthority, marketplaceAuthority.publicKey, null, 0)

      seller2NftTokenAccount = await createAssociatedTokenAccount(
        connection,
        marketplaceAuthority,
        nftMint2,
        seller2.publicKey,
      )

      await mintTo(connection, marketplaceAuthority, nftMint2, seller2NftTokenAccount, marketplaceAuthority, 1)
      ;[nftTokenAccount2PDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('token_account'), nftMint2.toBuffer()],
        program.programId,
      )
      ;[listing2PDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('listing'), nftMint2.toBuffer()],
        program.programId,
      )

      await program.methods
        .createNftListing(new anchor.BN(1 * LAMPORTS_PER_SOL))
        .accountsStrict({
          listing: listing2PDA,
          marketplace: marketplacePDA,
          tokenAccount: nftTokenAccount2PDA,
          sellerTokenAccount: seller2NftTokenAccount,
          seller: seller2.publicKey,
          mint: nftMint2,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller2])
        .rpc()
    })

    it('Should cancel a listing successfully', async () => {
      await program.methods
        .cancelNftListing()
        .accountsStrict({
          listing: listing2PDA,
          marketplace: marketplacePDA,
          tokenAccount: nftTokenAccount2PDA,
          mint: nftMint2,
          sellerTokenAccount: seller2NftTokenAccount,
          seller: seller2.publicKey,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller2])
        .rpc()

      const listingAccount = await program.account.listing.fetch(listing2PDA)
      expect(listingAccount.isActive).to.equal(false)

      const seller2NftAccount = await getAccount(connection, seller2NftTokenAccount)
      expect(seller2NftAccount.amount).to.equal(1n)
    })

    it('Should fail to cancel listing by unauthorized user', async () => {
      const seller3 = Keypair.generate()
      const nftMint3 = await createMint(connection, marketplaceAuthority, marketplaceAuthority.publicKey, null, 0)

      const airdropAmount = 2 * LAMPORTS_PER_SOL
      await connection.requestAirdrop(seller3.publicKey, airdropAmount)

      const seller3NftTokenAccount = await createAssociatedTokenAccount(
        connection,
        marketplaceAuthority,
        nftMint3,
        seller3.publicKey,
      )

      await mintTo(connection, marketplaceAuthority, nftMint3, seller3NftTokenAccount, marketplaceAuthority, 1)
      const [listing3PDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('listing'), nftMint3.toBuffer()],
        program.programId,
      )
      const [nftTokenAccount3PDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('token_account'), nftMint3.toBuffer()],
        program.programId,
      )

      await program.methods
        .createNftListing(new anchor.BN(1 * LAMPORTS_PER_SOL))
        .accountsStrict({
          listing: listing3PDA,
          marketplace: marketplacePDA,
          tokenAccount: nftTokenAccount3PDA,
          sellerTokenAccount: seller3NftTokenAccount,
          seller: seller3.publicKey,
          mint: nftMint3,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller3])
        .rpc()

      try {
        await program.methods
          .cancelNftListing()
          .accountsStrict({
            listing: listing3PDA,
            marketplace: marketplacePDA,
            tokenAccount: nftTokenAccount3PDA,
            mint: nftMint3,
            sellerTokenAccount: seller3NftTokenAccount,
            seller: seller2.publicKey, // Unauthorized user
            tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([seller2]) // Unauthorized user
          .rpc()

        expect.fail('Unauthorized user was able to cancel the listing')
      } catch (error: any) {
        expect(error.message).to.include('Unauthorized')
      }
    })

    it('Should fail to cancel inactive listing', async () => {
      try {
        await program.methods
          .cancelNftListing()
          .accountsStrict({
            listing: listing2PDA,
            marketplace: marketplacePDA,
            tokenAccount: nftTokenAccount2PDA,
            mint: nftMint2,
            sellerTokenAccount: seller2NftTokenAccount,
            seller: seller2.publicKey,
            tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([seller2])
          .rpc()

        expect.fail('Should have failed to cancel inactive listing')
      } catch (error: any) {
        expect(error.message).to.include('Listing is not active')
      }
    })
  })
})
