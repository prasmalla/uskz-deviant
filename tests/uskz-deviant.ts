import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { UskzDeviant } from "../target/types/uskz_deviant";

describe("uskz-deviant", () => {
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as anchor.Wallet;
  anchor.setProvider(provider);

  const program = anchor.workspace.UskzDeviant as Program<UskzDeviant>;

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey( // mpl-metadata
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );
  const METADATA_SEED = "metadata";
  const EDITION_SEED = "edition";
  const MINT_SEED = "mint";
  const ID = 1;

  const [mint] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(MINT_SEED), new anchor.BN(ID).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  const name = "uskz deviant";
  const symbol = "USKZ";
  const uri =
    "https://gist.githubusercontent.com/prasmalla/447c6cf49f50bd25616d20b09f9db446/raw/c142d0af6f239bbceedec47ccc7ccb46162b1e1b/marbles-1.json";

  it("Mint!", async () => {
    // Derive the mint address and the associated token account address

    const tokenAddress = anchor.utils.token.associatedAddress({
      mint,
      owner: wallet.publicKey,
    });

    // Derive the metadata and master edition addresses

    const [metadataAddress] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from(METADATA_SEED),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    console.log(`Metadata address: ${metadataAddress}`);

    const [masterEditionAddress] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from(METADATA_SEED),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from(EDITION_SEED),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    console.log(`Master edition address: ${masterEditionAddress}`);

    // Transact with the "mint" function in our on-chain program

    await program.methods
      .createSingleNft(new anchor.BN(ID), name, symbol, uri)
      .accounts({
        mint,
        tokenAccount: tokenAddress,
        metadataProgram: TOKEN_METADATA_PROGRAM_ID,
        masterEditionAccount: masterEditionAddress,
        nftMetadata: metadataAddress,
      })
      .rpc();
  });
});
