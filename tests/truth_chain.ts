import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TruthChain } from "../target/types/truth_chain";
import { expect } from "chai";
import * as crypto from "crypto";

describe("truth_chain", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TruthChain as Program<TruthChain>;

  // Test document data
  const testDocument = {
    content: "This is a test document for Truth Chain verification.",
    type: "FD-302",
    catsNumber: "CATS-2026-0001",
    ipfsCid: "QmTestCid123456789",
    pageNumber: 1,
    title: "FBI Interview Transcript - Test Subject"
  };

  // Generate SHA-256 hash
  const documentHash = crypto.createHash("sha256")
    .update(testDocument.content)
    .digest();
  const hashArray = Array.from(documentHash);

  let registryPda: anchor.web3.PublicKey;
  let documentPda: anchor.web3.PublicKey;

  before(async () => {
    // Derive PDAs
    [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId
    );

    [documentPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("document"), Buffer.from(hashArray)],
      program.programId
    );
  });

  it("Initializes the registry", async () => {
    try {
      const tx = await program.methods
        .initializeRegistry()
        .accounts({
          registry: registryPda,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Registry initialized. TX:", tx);

      const registry = await program.account.registry.fetch(registryPda);
      expect(registry.authority.toString()).to.equal(provider.wallet.publicKey.toString());
      expect(registry.documentCount.toNumber()).to.equal(0);
    } catch (e) {
      // Registry might already exist from previous test run
      console.log("Registry may already exist:", e.message);
    }
  });

  it("Registers a new document", async () => {
    const tx = await program.methods
      .registerDocument(
        hashArray,
        testDocument.type,
        testDocument.catsNumber,
        testDocument.ipfsCid,
        testDocument.pageNumber,
        testDocument.title
      )
      .accounts({
        registry: registryPda,
        document: documentPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Document registered. TX:", tx);

    const document = await program.account.documentRecord.fetch(documentPda);
    expect(document.documentType).to.equal(testDocument.type);
    expect(document.catsNumber).to.equal(testDocument.catsNumber);
    expect(document.ipfsCid).to.equal(testDocument.ipfsCid);
    expect(document.pageNumber).to.equal(testDocument.pageNumber);
    expect(document.title).to.equal(testDocument.title);
    expect(document.isModified).to.equal(false);
    expect(document.modificationCount).to.equal(0);

    // Verify registry count increased
    const registry = await program.account.registry.fetch(registryPda);
    expect(registry.documentCount.toNumber()).to.be.greaterThan(0);
  });

  it("Verifies a document hash", async () => {
    // Test with correct hash
    const result = await program.methods
      .verifyDocument(hashArray)
      .accounts({
        document: documentPda,
      })
      .view();

    expect(result).to.equal(true);
    console.log("Document verification successful!");
  });

  it("Flags a document modification (stealth redaction)", async () => {
    // Simulate a modified document with new hash
    const modifiedContent = "This document has been secretly modified.";
    const newHash = crypto.createHash("sha256")
      .update(modifiedContent)
      .digest();
    const newHashArray = Array.from(newHash);

    const tx = await program.methods
      .flagModification(newHashArray)
      .accounts({
        document: documentPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Modification flagged. TX:", tx);

    const document = await program.account.documentRecord.fetch(documentPda);
    expect(document.isModified).to.equal(true);
    expect(document.modificationCount).to.equal(1);
    expect(document.previousHash).to.deep.equal(hashArray);
  });

  it("Rejects verification with wrong hash after modification", async () => {
    // Original hash should no longer match
    const result = await program.methods
      .verifyDocument(hashArray)
      .accounts({
        document: documentPda,
      })
      .view();

    expect(result).to.equal(false);
    console.log("Correctly detected hash mismatch after modification!");
  });
});
