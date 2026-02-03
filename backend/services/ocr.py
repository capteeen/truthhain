"""
OCR Service
Extracts text from PDF documents using Tesseract.
"""

import io
import asyncio
from typing import Optional
from concurrent.futures import ThreadPoolExecutor

try:
    import pytesseract
    from pdf2image import convert_from_bytes
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("Warning: OCR dependencies not installed. Run: pip install pytesseract pdf2image")


class OCRService:
    """Service for extracting text from PDF documents."""
    
    def __init__(self, tesseract_cmd: Optional[str] = None):
        """
        Initialize OCR service.
        
        Args:
            tesseract_cmd: Path to tesseract executable (optional)
        """
        if tesseract_cmd and OCR_AVAILABLE:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
        
        self.executor = ThreadPoolExecutor(max_workers=4)
    
    def _extract_sync(self, pdf_bytes: bytes) -> str:
        """
        Synchronous text extraction (runs in thread pool).
        """
        if not OCR_AVAILABLE:
            return "[OCR not available - install pytesseract and pdf2image]"
        
        try:
            # Convert PDF pages to images
            images = convert_from_bytes(pdf_bytes, dpi=300)
            
            # Extract text from each page
            text_parts = []
            for i, image in enumerate(images):
                page_text = pytesseract.image_to_string(image)
                text_parts.append(f"--- Page {i + 1} ---\n{page_text}")
            
            return "\n\n".join(text_parts)
        except Exception as e:
            return f"[OCR Error: {str(e)}]"
    
    async def extract_text(self, pdf_bytes: bytes) -> str:
        """
        Extract text from a PDF document asynchronously.
        
        Args:
            pdf_bytes: Raw PDF file bytes
            
        Returns:
            Extracted text content
        """
        loop = asyncio.get_event_loop()
        text = await loop.run_in_executor(self.executor, self._extract_sync, pdf_bytes)
        return text
    
    async def extract_text_with_layout(self, pdf_bytes: bytes) -> dict:
        """
        Extract text with page-by-page layout information.
        
        Args:
            pdf_bytes: Raw PDF file bytes
            
        Returns:
            Dict with page numbers and text
        """
        if not OCR_AVAILABLE:
            return {"pages": [], "error": "OCR not available"}
        
        try:
            images = convert_from_bytes(pdf_bytes, dpi=300)
            
            pages = []
            for i, image in enumerate(images):
                # Get structured data
                data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
                text = pytesseract.image_to_string(image)
                
                pages.append({
                    "page_number": i + 1,
                    "text": text,
                    "word_count": len(text.split()),
                    "confidence": sum(data.get('conf', [])) / max(len(data.get('conf', [1])), 1)
                })
            
            return {"pages": pages, "total_pages": len(pages)}
        except Exception as e:
            return {"pages": [], "error": str(e)}
