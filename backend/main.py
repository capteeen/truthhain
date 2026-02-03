"""
Truth Chain Backend - FastAPI Application
Provides document hashing, verification, and Solana blockchain interaction.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import uvicorn

from services.hasher import compute_sha256, compute_sha256_bytes
from services.solana_client import SolanaClient
from services.ocr import OCRService
from services.ai_analyzer import AIAnalyzer
from models.document import (
    DocumentMetadata,
    VerificationResult,
    DocumentSearchResult,
    CATSRecord,
    DocumentRegistration
)

# Initialize FastAPI app
app = FastAPI(
    title="Truth Chain API",
    description="Immutable document verification system for the 2026 Epstein file releases",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
solana_client = SolanaClient()
ocr_service = OCRService()
ai_analyzer = AIAnalyzer()


# ==============================================================================
# HEALTH CHECK
# ==============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# ==============================================================================
# DOCUMENT HASHING
# ==============================================================================

@app.post("/api/hash", response_model=dict)
async def hash_document(file: UploadFile = File(...)):
    """
    Generate SHA-256 hash from an uploaded PDF document.
    Returns the hash as a hex string.
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    try:
        content = await file.read()
        hash_hex = compute_sha256_bytes(content)
        
        return {
            "filename": file.filename,
            "hash": hash_hex,
            "size_bytes": len(content),
            "computed_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hashing failed: {str(e)}")


# ==============================================================================
# DOCUMENT VERIFICATION
# ==============================================================================

@app.post("/api/verify", response_model=VerificationResult)
async def verify_document(file: UploadFile = File(...)):
    """
    Verify a document by checking its hash against on-chain records.
    Drag-and-drop endpoint for the verification UI.
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    try:
        content = await file.read()
        hash_hex = compute_sha256_bytes(content)
        hash_bytes = bytes.fromhex(hash_hex)
        
        # Query Solana for this hash
        document_record = await solana_client.get_document_by_hash(hash_bytes)
        
        if document_record is None:
            return VerificationResult(
                verified=False,
                hash=hash_hex,
                message="Document not found in Truth Chain registry",
                document=None,
                solscan_url=None
            )
        
        # Check if document was modified (stealth redaction)
        if document_record.is_modified:
            return VerificationResult(
                verified=True,
                hash=hash_hex,
                message="⚠️ Document found but has been flagged as MODIFIED (stealth redaction detected)",
                document=document_record,
                solscan_url=solana_client.get_solscan_url(document_record.account_pubkey)
            )
        
        return VerificationResult(
            verified=True,
            hash=hash_hex,
            message="✓ Document verified - matches original DOJ release",
            document=document_record,
            solscan_url=solana_client.get_solscan_url(document_record.account_pubkey)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


# ==============================================================================
# DOCUMENT METADATA
# ==============================================================================

@app.get("/api/documents", response_model=DocumentSearchResult)
async def list_documents(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    document_type: Optional[str] = None,
    search: Optional[str] = None
):
    """
    List registered documents with pagination and filtering.
    Supports filtering by document type and text search.
    """
    try:
        documents = await solana_client.search_documents(
            page=page,
            limit=limit,
            document_type=document_type,
            search_query=search
        )
        
        return DocumentSearchResult(
            documents=documents.items,
            total=documents.total,
            page=page,
            limit=limit,
            has_more=documents.total > page * limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@app.get("/api/documents/{hash_hex}", response_model=DocumentMetadata)
async def get_document(hash_hex: str):
    """
    Get detailed metadata for a specific document by its hash.
    """
    try:
        hash_bytes = bytes.fromhex(hash_hex)
        document = await solana_client.get_document_by_hash(hash_bytes)
        
        if document is None:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return document
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid hash format")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fetch failed: {str(e)}")


# ==============================================================================
# CATS TRACKER
# ==============================================================================

@app.get("/api/cats/{cats_id}", response_model=CATSRecord)
async def get_cats_record(cats_id: str):
    """
    Look up a CATS (Consolidated Asset Tracking System) number.
    Returns linked properties and associated documents.
    """
    try:
        record = await solana_client.get_cats_record(cats_id)
        
        if record is None:
            raise HTTPException(status_code=404, detail="CATS record not found")
        
        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CATS lookup failed: {str(e)}")


@app.get("/api/cats", response_model=List[CATSRecord])
async def search_cats(
    property_name: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100)
):
    """
    Search CATS records by property name.
    """
    try:
        records = await solana_client.search_cats(
            property_name=property_name,
            limit=limit
        )
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CATS search failed: {str(e)}")


# ==============================================================================
# STEALTH REDACTION FLAGGING
# ==============================================================================

class FlagRequest(BaseModel):
    original_hash: str
    new_hash: str
    evidence_description: str


@app.post("/api/flag")
async def flag_modification(request: FlagRequest):
    """
    Flag a document as having been modified (stealth redaction).
    Requires proof that the document has changed from the original.
    """
    try:
        original_bytes = bytes.fromhex(request.original_hash)
        new_bytes = bytes.fromhex(request.new_hash)
        
        result = await solana_client.flag_document_modification(
            original_hash=original_bytes,
            new_hash=new_bytes,
            evidence=request.evidence_description
        )
        
        return {
            "success": True,
            "message": "Modification flagged successfully",
            "transaction": result.signature,
            "solscan_url": f"https://solscan.io/tx/{result.signature}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Flagging failed: {str(e)}")


# ==============================================================================
# OCR & AI PROCESSING (for document ingestion)
# ==============================================================================

@app.post("/api/process")
async def process_document(file: UploadFile = File(...)):
    """
    Process a PDF through OCR and AI analysis.
    Extracts text, classifies document type, and identifies CATS numbers.
    Used for bulk document ingestion.
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    try:
        content = await file.read()
        
        # Compute hash
        hash_hex = compute_sha256_bytes(content)
        
        # Run OCR
        extracted_text = await ocr_service.extract_text(content)
        
        # AI analysis for classification
        analysis = await ai_analyzer.analyze_document(extracted_text)
        
        return {
            "hash": hash_hex,
            "filename": file.filename,
            "extracted_text_preview": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
            "document_type": analysis.document_type,
            "cats_numbers": analysis.cats_numbers,
            "entities": analysis.entities,
            "suggested_title": analysis.suggested_title
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


# ==============================================================================
# DOCUMENT REGISTRATION (Admin endpoint)
# ==============================================================================

@app.post("/api/register")
async def register_document(registration: DocumentRegistration):
    """
    Register a new document on the Solana blockchain.
    Admin endpoint for bulk registration.
    """
    try:
        hash_bytes = bytes.fromhex(registration.hash)
        
        result = await solana_client.register_document(
            hash=hash_bytes,
            document_type=registration.document_type,
            cats_number=registration.cats_number,
            ipfs_cid=registration.ipfs_cid,
            page_number=registration.page_number,
            title=registration.title
        )
        
        return {
            "success": True,
            "message": "Document registered on Truth Chain",
            "transaction": result.signature,
            "solscan_url": f"https://solscan.io/tx/{result.signature}",
            "account": result.document_pubkey
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


# ==============================================================================
# STATS
# ==============================================================================

@app.get("/api/stats")
async def get_stats():
    """
    Get overall Truth Chain statistics.
    """
    try:
        stats = await solana_client.get_registry_stats()
        return {
            "total_documents": stats.document_count,
            "modified_count": stats.modified_count,
            "unique_cats_numbers": stats.unique_cats,
            "document_types": stats.document_types
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats fetch failed: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
