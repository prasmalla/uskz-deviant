import fs from "fs";
import os from "os";
import path from "path";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  irysStorage,
  Metaplex,
  keypairIdentity,
  toMetaplexFile,
} from "@metaplex-foundation/js";
import { Connection, Keypair } from "@solana/web3.js";
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

  // setup metaplex
  const metaplex = Metaplex.make(
    new Connection("https://api.devnet.solana.com", "confirmed")
  )
    .use(
      keypairIdentity(
        Keypair.fromSecretKey(
          Buffer.from(
            JSON.parse(
              fs.readFileSync(os.homedir() + "/.config/solana/id.json", "utf-8")
            )
          )
        )
      )
    )
    .use(
      irysStorage({
        address: "https://devnet.bundlr.network",
      })
    );

  let name = "uskz deviant";
  let symbol = "USKZ";
  let description = "uskz deviant master edition";

  it("Mint!", async () => {
    // upload metadata
    const { uri } = await metaplex.nfts().uploadMetadata({
      name,
      symbol,
      description,
      image: toMetaplexFile(
        fs.readFileSync(path.join(__dirname, "../assets/collection.jpeg")),
        name,
        {
          contentType: "image",
        }
      ),
    });
    console.log(`ASSET: ${name.padEnd(18, " ")} URI: ${uri}`);

    // Derive the associated token account address

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

    // Transact with the on-chain program's mint function

    await program.methods
      .createSingleNft(new anchor.BN(ID), name, symbol, uri, true) // true sets mint as the collection
      .accounts({
        mint,
        tokenAccount: tokenAddress,
        metadataProgram: TOKEN_METADATA_PROGRAM_ID,
        masterEditionAccount: masterEditionAddress,
        nftMetadata: metadataAddress,
      })
      .rpc();
  });

  it("Mint to Collection", async () => {
    // Define new NFT details
    const NFTID = 1; // ID for the new NFT
    name = `uskz deviant #${NFTID}`;
    symbol = `USKZ${NFTID}`;
    description = `uskz deviant #${NFTID}`;
    const newAssetPath = `../assets/${NFTID}.jpeg`;

    // Upload new NFT metadata
    const { uri } = await metaplex.nfts().uploadMetadata({
      name,
      symbol,
      description,
      image: toMetaplexFile(
        fs.readFileSync(path.join(__dirname, newAssetPath)),
        name,
        {
          contentType: "image",
        }
      ),
    });
    console.log(`ASSET: ${name.padEnd(18, " ")} URI: ${uri}`);

    // Derive new NFT's mint address
    const [newMint] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from(MINT_SEED),
        new anchor.BN(ID + 1).toArrayLike(Buffer, "le", 8),
        new anchor.BN(NFTID).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    console.log(`New mint address: ${newMint}`);

    // Derive the metadata and master edition addresses

    const [metadataAddress] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from(METADATA_SEED),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        newMint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    console.log(`Metadata address: ${metadataAddress}`);

    const [masterEditionAddress] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from(METADATA_SEED),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        newMint.toBuffer(),
        Buffer.from(EDITION_SEED),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    console.log(`Master edition address: ${masterEditionAddress}`);

    // Derive the associated token account address for the new NFT
    const tokenAddress = anchor.utils.token.associatedAddress({
      mint: newMint,
      owner: wallet.publicKey,
    });
    console.log(`Token address: ${tokenAddress}`);

    // Transact with the on-chain program's function mint_to_collection

    await program.methods
      .mintToCollection(
        new anchor.BN(ID + 1),
        new anchor.BN(NFTID),
        name,
        symbol,
        uri
      )
      .accounts({
        mint: newMint,
        tokenAccount: tokenAddress,
        metadataProgram: TOKEN_METADATA_PROGRAM_ID,
        masterEditionAccount: masterEditionAddress,
        nftMetadata: metadataAddress,
        collection: mint,
      })
      .rpc();
    console.log("New NFT minted into the collection successfully");
  });
});
