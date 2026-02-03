"""
Pydantic models for Truth Chain API.
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DocumentMetadata(BaseModel):
    """Document record from the blockchain."""
    hash: str
    document_type: str
    cats_number: Optional[str]
    ipfs_cid: str
    title: str
    timestamp: int
    page_number: int
    is_modified: bool
    modification_count: int
    registrar: str
    account_pubkey: str


class VerificationResult(BaseModel):
    """Result of document verification."""
    verified: bool
    hash: str
    message: str
    document: Optional[DocumentMetadata]
    solscan_url: Optional[str]


class DocumentSearchResult(BaseModel):
    """Paginated document search results."""
    documents: List[DocumentMetadata]
    total: int
    page: int
    limit: int
    has_more: bool


class CATSRecord(BaseModel):
    """CATS (Consolidated Asset Tracking System) record."""
    cats_id: str
    property_name: Optional[str]
    document_count: int
    document_hashes: List[str]


class DocumentRegistration(BaseModel):
    """Request body for document registration."""
    hash: str
    document_type: str
    cats_number: Optional[str] = None
    ipfs_cid: str
    page_number: int
    title: str
