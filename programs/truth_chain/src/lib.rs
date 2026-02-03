use anchor_lang::prelude::*;

declare_id!("7r98Fey4c7KijkFT2VtjrdTyYvpnrACN3XJgnQAd4Rnf");

/// Maximum length for document type string (e.g., "FD-302", "Flight Log")
const MAX_DOC_TYPE_LEN: usize = 32;
/// Maximum length for CATS number string
const MAX_CATS_LEN: usize = 64;
/// Maximum length for IPFS CID
const MAX_CID_LEN: usize = 64;
/// Maximum length for document title
const MAX_TITLE_LEN: usize = 128;

#[program]
pub mod truth_chain {
    use super::*;

    /// Initialize the main registry - called once at program setup
    pub fn initialize_registry(ctx: Context<InitializeRegistry>) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        registry.authority = ctx.accounts.authority.key();
        registry.document_count = 0;
        registry.bump = ctx.bumps.registry;
        
        msg!("Truth Chain Registry initialized");
        Ok(())
    }

    /// Register a new document hash on-chain
    pub fn register_document(
        ctx: Context<RegisterDocument>,
        hash: [u8; 32],
        document_type: String,
        cats_number: Option<String>,
        ipfs_cid: String,
        page_number: u32,
        title: String,
    ) -> Result<()> {
        require!(document_type.len() <= MAX_DOC_TYPE_LEN, TruthChainError::DocumentTypeTooLong);
        require!(ipfs_cid.len() <= MAX_CID_LEN, TruthChainError::CidTooLong);
        require!(title.len() <= MAX_TITLE_LEN, TruthChainError::TitleTooLong);
        
        if let Some(ref cats) = cats_number {
            require!(cats.len() <= MAX_CATS_LEN, TruthChainError::CatsNumberTooLong);
        }

        let document = &mut ctx.accounts.document;
        let registry = &mut ctx.accounts.registry;
        let clock = Clock::get()?;

        document.hash = hash;
        document.document_type = document_type;
        document.cats_number = cats_number;
        document.ipfs_cid = ipfs_cid;
        document.title = title;
        document.timestamp = clock.unix_timestamp;
        document.page_number = page_number;
        document.is_modified = false;
        document.modification_count = 0;
        document.registrar = ctx.accounts.authority.key();
        document.bump = ctx.bumps.document;

        registry.document_count = registry.document_count.checked_add(1)
            .ok_or(TruthChainError::Overflow)?;

        msg!("Document registered: page {} at timestamp {}", page_number, document.timestamp);
        emit!(DocumentRegistered {
            hash,
            page_number,
            timestamp: document.timestamp,
            registrar: ctx.accounts.authority.key(),
        });

        Ok(())
    }

    /// Flag a document as modified (stealth redaction detected)
    pub fn flag_modification(
        ctx: Context<FlagModification>,
        new_hash: [u8; 32],
    ) -> Result<()> {
        let document = &mut ctx.accounts.document;
        let clock = Clock::get()?;

        document.is_modified = true;
        document.modification_count = document.modification_count.checked_add(1)
            .ok_or(TruthChainError::Overflow)?;
        document.last_modified_at = Some(clock.unix_timestamp);
        document.previous_hash = Some(document.hash);
        document.hash = new_hash;

        msg!("Document flagged as modified. New hash recorded.");
        emit!(ModificationFlagged {
            document_key: ctx.accounts.document.key(),
            new_hash,
            modification_count: document.modification_count,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Verify if a given hash matches a registered document
    pub fn verify_document(
        ctx: Context<VerifyDocument>,
        hash_to_verify: [u8; 32],
    ) -> Result<bool> {
        let document = &ctx.accounts.document;
        let matches = document.hash == hash_to_verify;
        
        emit!(VerificationPerformed {
            document_key: ctx.accounts.document.key(),
            hash_verified: hash_to_verify,
            matches,
            is_modified: document.is_modified,
        });

        Ok(matches)
    }
}

// ============================================================================
// ACCOUNTS
// ============================================================================

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Registry::INIT_SPACE,
        seeds = [b"registry"],
        bump
    )]
    pub registry: Account<'info, Registry>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(hash: [u8; 32])]
pub struct RegisterDocument<'info> {
    #[account(
        mut,
        seeds = [b"registry"],
        bump = registry.bump
    )]
    pub registry: Account<'info, Registry>,

    #[account(
        init,
        payer = authority,
        space = 8 + DocumentRecord::INIT_SPACE,
        seeds = [b"document", hash.as_ref()],
        bump
    )]
    pub document: Account<'info, DocumentRecord>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FlagModification<'info> {
    #[account(mut)]
    pub document: Account<'info, DocumentRecord>,

    #[account(
        constraint = authority.key() == document.registrar @ TruthChainError::Unauthorized
    )]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct VerifyDocument<'info> {
    pub document: Account<'info, DocumentRecord>,
}

// ============================================================================
// STATE
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct Registry {
    pub authority: Pubkey,
    pub document_count: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct DocumentRecord {
    /// SHA-256 hash of the document
    pub hash: [u8; 32],
    
    /// Document type (e.g., "FD-302", "Flight Log", "Deposition")
    #[max_len(32)]
    pub document_type: String,
    
    /// Optional CATS (Consolidated Asset Tracking System) number
    #[max_len(64)]
    pub cats_number: Option<String>,
    
    /// IPFS Content ID for decentralized storage reference
    #[max_len(64)]
    pub ipfs_cid: String,
    
    /// Document title or description
    #[max_len(128)]
    pub title: String,
    
    /// Unix timestamp when the document was registered
    pub timestamp: i64,
    
    /// Page number in the overall document set
    pub page_number: u32,
    
    /// Flag indicating if a stealth redaction was detected
    pub is_modified: bool,
    
    /// Number of times modifications have been detected
    pub modification_count: u8,
    
    /// Timestamp of last modification (if any)
    pub last_modified_at: Option<i64>,
    
    /// Previous hash (stored when modification detected)
    pub previous_hash: Option<[u8; 32]>,
    
    /// Public key of the account that registered this document
    pub registrar: Pubkey,
    
    /// PDA bump seed
    pub bump: u8,
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct DocumentRegistered {
    pub hash: [u8; 32],
    pub page_number: u32,
    pub timestamp: i64,
    pub registrar: Pubkey,
}

#[event]
pub struct ModificationFlagged {
    pub document_key: Pubkey,
    pub new_hash: [u8; 32],
    pub modification_count: u8,
    pub timestamp: i64,
}

#[event]
pub struct VerificationPerformed {
    pub document_key: Pubkey,
    pub hash_verified: [u8; 32],
    pub matches: bool,
    pub is_modified: bool,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum TruthChainError {
    #[msg("Document type string exceeds maximum length")]
    DocumentTypeTooLong,
    
    #[msg("CATS number string exceeds maximum length")]
    CatsNumberTooLong,
    
    #[msg("IPFS CID string exceeds maximum length")]
    CidTooLong,
    
    #[msg("Title string exceeds maximum length")]
    TitleTooLong,
    
    #[msg("Arithmetic overflow")]
    Overflow,
    
    #[msg("Unauthorized: only the registrar can modify this document")]
    Unauthorized,
}
