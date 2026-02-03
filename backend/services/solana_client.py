"""
Solana Client Service
Handles all interactions with the Truth Chain Solana program on Devnet.
"""

import os
import json
from typing import Optional, List
from dataclasses import dataclass
from pathlib import Path
from models.document import DocumentMetadata, CATSRecord

# Core Solana Libraries
try:
    from solders.pubkey import Pubkey
    from solders.keypair import Keypair
    from solana.rpc.async_api import AsyncClient
    from anchorpy import Program, Provider, Wallet, Idl
    HAS_SOLANA = True
except ImportError:
    HAS_SOLANA = False

# Program ID (as deployed by user)
PROGRAM_ID_STR = "7r98Fey4c7KijkFT2VtjrdTyYvpnrACN3XJgnQAd4Rnf"

# RPC endpoints
DEVNET_RPC = "https://api.devnet.solana.com"
MAINNET_RPC = "https://api.mainnet-beta.solana.com"

@dataclass
class TransactionResult:
    signature: str
    document_pubkey: str

@dataclass
class PaginatedResult:
    items: List[DocumentMetadata]
    total: int

@dataclass
class RegistryStats:
    document_count: int
    modified_count: int
    unique_cats: int
    document_types: dict

class SolanaClient:
    """Client for interacting with the Truth Chain Solana program."""
    
    def __init__(self, network: str = "devnet"):
        self.network = network
        self.rpc_url = DEVNET_RPC if network == "devnet" else MAINNET_RPC
        self.program: Optional[Program] = None
        
        if not HAS_SOLANA:
            print("❌ ERROR: Solana libraries not installed. Run 'pip install solana solders anchorpy'")
            return

        self.client = AsyncClient(self.rpc_url)
        self.program_id = Pubkey.from_string(PROGRAM_ID_STR)
        
        # Load wallet
        wallet_path = os.environ.get("SOLANA_WALLET_PATH", os.path.expanduser("~/.config/solana/id.json"))
        if os.path.exists(wallet_path):
            with open(wallet_path) as f:
                secret = json.load(f)
            self.keypair = Keypair.from_bytes(bytes(secret))
        else:
            self.keypair = Keypair()
    
    async def _get_program(self) -> Program:
        if not HAS_SOLANA:
            raise RuntimeError("Solana libraries (solders/anchorpy) are not installed.")
            
        if self.program is None:
            # Try to load IDL from target directory
            idl_path = Path(__file__).parent.parent.parent / "target" / "idl" / "truth_chain.json"
            if idl_path.exists():
                with open(idl_path) as f:
                    idl = Idl.from_json(f.read())
            else:
                # Fetch from chain
                idl = await Program.fetch_idl(self.program_id, self.client)
            
            wallet = Wallet(self.keypair)
            provider = Provider(self.client, wallet)
            self.program = Program(idl, self.program_id, provider)
        
        return self.program
    
    def _get_registry_pda(self) -> Pubkey:
        seeds = [b"registry"]
        pda, _ = Pubkey.find_program_address(seeds, self.program_id)
        return pda
    
    def _get_document_pda(self, hash_bytes: bytes) -> Pubkey:
        seeds = [b"document", hash_bytes]
        pda, _ = Pubkey.find_program_address(seeds, self.program_id)
        return pda
    
    def get_solscan_url(self, pubkey: str) -> str:
        cluster = "" if self.network == "mainnet" else "?cluster=devnet"
        return f"https://solscan.io/account/{pubkey}{cluster}"
    
    async def get_document_by_hash(self, hash_bytes: bytes) -> Optional[DocumentMetadata]:
        if not HAS_SOLANA: return None
        
        program = await self._get_program()
        pda = self._get_document_pda(hash_bytes)
        
        try:
            account = await program.account["DocumentRecord"].fetch(pda)
            return DocumentMetadata(
                hash=bytes(account.hash).hex(),
                document_type=account.document_type,
                cats_number=account.cats_number,
                ipfs_cid=account.ipfs_cid,
                title=account.title,
                timestamp=account.timestamp,
                page_number=account.page_number,
                is_modified=account.is_modified,
                modification_count=account.modification_count,
                registrar=str(account.registrar),
                account_pubkey=str(pda)
            )
        except:
            return None

    async def search_documents(self, page: int = 1, limit: int = 20, document_type: Optional[str] = None, search_query: Optional[str] = None) -> PaginatedResult:
        if not HAS_SOLANA: return PaginatedResult(items=[], total=0)
        program = await self._get_program()
        try:
            all_accounts = await program.account["DocumentRecord"].all()
            if document_type:
                all_accounts = [a for a in all_accounts if a.account.document_type.lower() == document_type.lower()]
            if search_query:
                query = search_query.lower()
                all_accounts = [a for a in all_accounts if query in a.account.title.lower() or (a.account.cats_number and query in a.account.cats_number.lower())]
            
            total = len(all_accounts)
            start = (page - 1) * limit
            items = [DocumentMetadata(
                hash=bytes(a.account.hash).hex(),
                document_type=a.account.document_type,
                cats_number=a.account.cats_number,
                ipfs_cid=a.account.ipfs_cid,
                title=a.account.title,
                timestamp=a.account.timestamp,
                page_number=a.account.page_number,
                is_modified=a.account.is_modified,
                modification_count=a.account.modification_count,
                registrar=str(a.account.registrar),
                account_pubkey=str(a.public_key)
            ) for a in all_accounts[start:start+limit]]
            return PaginatedResult(items=items, total=total)
        except:
            return PaginatedResult(items=[], total=0)

    async def get_cats_record(self, cats_id: str) -> Optional[CATSRecord]:
        if not HAS_SOLANA: return None
        program = await self._get_program()
        try:
            all_accounts = await program.account["DocumentRecord"].all()
            matching = [a for a in all_accounts if a.account.cats_number == cats_id]
            if not matching: return None
            
            property_map = {"CATS-ZR": "Zorro Ranch", "CATS-LSJ": "Little St. James", "CATS-NYC": "New York"}
            property_name = next((v for k, v in property_map.items() if cats_id.startswith(k)), "Unknown Property")
            
            return CATSRecord(
                cats_id=cats_id,
                property_name=property_name,
                document_count=len(matching),
                document_hashes=[bytes(a.account.hash).hex() for a in matching]
            )
        except: return None

    async def register_document(self, hash: bytes, document_type: str, cats_number: Optional[str], ipfs_cid: str, page_number: int, title: str) -> TransactionResult:
        program = await self._get_program()
        registry_pda = self._get_registry_pda()
        document_pda = self._get_document_pda(hash)
        
        tx = await program.methods.register_document(
            list(hash), document_type, cats_number, ipfs_cid, page_number, title
        ).accounts({
            "registry": registry_pda,
            "document": document_pda,
            "authority": self.keypair.pubkey(),
            "system_program": Pubkey.from_string("11111111111111111111111111111111")
        }).rpc()
        
        return TransactionResult(signature=str(tx), document_pubkey=str(document_pda))

    async def get_registry_stats(self) -> RegistryStats:
        if not HAS_SOLANA: return RegistryStats(0,0,0,{})
        program = await self._get_program()
        try:
            registry_pda = self._get_registry_pda()
            registry = await program.account["Registry"].fetch(registry_pda)
            all_accounts = await program.account["DocumentRecord"].all()
            
            modified_count = sum(1 for a in all_accounts if a.account.is_modified)
            cats_set = set(a.account.cats_number for a in all_accounts if a.account.cats_number)
            
            dt_map = {}
            for a in all_accounts:
                dt_map[a.account.document_type] = dt_map.get(a.account.document_type, 0) + 1
                
            return RegistryStats(registry.document_count, modified_count, len(cats_set), dt_map)
        except: return RegistryStats(0,0,0,{})
