"""
AI Analyzer Service
Uses Claude API for document classification and CATS extraction.
"""

import os
import re
from typing import Optional, List
from dataclasses import dataclass

try:
    from anthropic import Anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    print("Warning: Anthropic SDK not installed. Run: pip install anthropic")


@dataclass
class DocumentAnalysis:
    """Result of AI document analysis."""
    document_type: str
    cats_numbers: List[str]
    entities: List[str]
    suggested_title: str
    summary: Optional[str] = None


# Known document types in the Epstein files
DOCUMENT_TYPES = [
    "FD-302",           # FBI Interview Report
    "FD-1057",          # FBI Evidence Receipt
    "Flight Log",       # Aircraft passenger manifest
    "Deposition",       # Legal testimony
    "Court Filing",     # Legal documents
    "Financial Record", # Bank statements, transactions
    "Email",            # Electronic correspondence
    "Photograph",       # Image description
    "Letter",           # Written correspondence
    "Report",           # General investigative report
    "Subpoena",         # Legal demand
    "Contract",         # Legal agreement
    "Unknown"           # Unclassified
]

# CATS number pattern
CATS_PATTERN = r'CATS[-\s]?(?:\d{4}[-\s]?)?\d{4,}'


class AIAnalyzer:
    """Service for AI-powered document analysis using Claude."""
    
    def __init__(self):
        """Initialize the AI analyzer with Claude API."""
        self.api_key = os.environ.get("ANTHROPIC_API_KEY")
        
        if ANTHROPIC_AVAILABLE and self.api_key:
            self.client = Anthropic(api_key=self.api_key)
        else:
            self.client = None
    
    async def analyze_document(self, text: str) -> DocumentAnalysis:
        """
        Analyze document text to classify type and extract metadata.
        
        Args:
            text: Extracted document text
            
        Returns:
            DocumentAnalysis with classification and entities
        """
        # Extract CATS numbers with regex (works without API)
        cats_numbers = self._extract_cats_numbers(text)
        
        # If no API available, use rule-based classification
        if self.client is None:
            return self._rule_based_analysis(text, cats_numbers)
        
        # Use Claude for intelligent analysis
        return await self._claude_analysis(text, cats_numbers)
    
    def _extract_cats_numbers(self, text: str) -> List[str]:
        """Extract CATS numbers using regex."""
        matches = re.findall(CATS_PATTERN, text, re.IGNORECASE)
        # Normalize format
        return [m.replace(' ', '-').upper() for m in matches]
    
    def _rule_based_analysis(self, text: str, cats_numbers: List[str]) -> DocumentAnalysis:
        """
        Fallback rule-based document classification.
        """
        text_lower = text.lower()
        
        # Detect document type based on keywords
        doc_type = "Unknown"
        
        if "fd-302" in text_lower or "interview of" in text_lower:
            doc_type = "FD-302"
        elif "flight" in text_lower and ("log" in text_lower or "manifest" in text_lower):
            doc_type = "Flight Log"
        elif "deposition" in text_lower or "q." in text_lower and "a." in text_lower:
            doc_type = "Deposition"
        elif "subpoena" in text_lower:
            doc_type = "Subpoena"
        elif "bank" in text_lower or "transaction" in text_lower:
            doc_type = "Financial Record"
        elif "@" in text and ("from:" in text_lower or "to:" in text_lower):
            doc_type = "Email"
        elif "court" in text_lower or "docket" in text_lower:
            doc_type = "Court Filing"
        
        # Extract potential entity names (simple heuristic)
        entities = self._extract_simple_entities(text)
        
        # Generate title from first meaningful line
        lines = [l.strip() for l in text.split('\n') if l.strip() and len(l.strip()) > 10]
        suggested_title = lines[0][:128] if lines else "Untitled Document"
        
        return DocumentAnalysis(
            document_type=doc_type,
            cats_numbers=cats_numbers,
            entities=entities,
            suggested_title=suggested_title
        )
    
    def _extract_simple_entities(self, text: str) -> List[str]:
        """Extract potential entity names using simple patterns."""
        # Look for capitalized name patterns
        name_pattern = r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b'
        matches = re.findall(name_pattern, text)
        
        # Deduplicate and limit
        unique_names = list(set(matches))[:20]
        
        # Filter out common non-names
        stopwords = {'The United', 'New York', 'United States', 'Federal Bureau'}
        return [n for n in unique_names if n not in stopwords]
    
    async def _claude_analysis(self, text: str, cats_numbers: List[str]) -> DocumentAnalysis:
        """
        Use Claude for intelligent document analysis.
        """
        # Truncate text if too long
        max_chars = 50000
        truncated = text[:max_chars] + "..." if len(text) > max_chars else text
        
        prompt = f"""Analyze this document extracted from the DOJ Epstein file releases.

Document Text:
---
{truncated}
---

Please provide:
1. Document Type: Choose from {DOCUMENT_TYPES}
2. Key Entities: List up to 10 important names of people, organizations, or locations
3. Suggested Title: A concise, descriptive title for this document
4. Brief Summary: 1-2 sentences describing the document content

CATS numbers already found: {cats_numbers}

Respond in this exact format:
DOCUMENT_TYPE: [type]
ENTITIES: [comma-separated list]
TITLE: [title]
SUMMARY: [summary]
"""

        try:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}]
            )
            
            content = response.content[0].text
            
            # Parse response
            doc_type = self._parse_field(content, "DOCUMENT_TYPE") or "Unknown"
            entities_str = self._parse_field(content, "ENTITIES") or ""
            title = self._parse_field(content, "TITLE") or "Untitled Document"
            summary = self._parse_field(content, "SUMMARY")
            
            entities = [e.strip() for e in entities_str.split(',') if e.strip()]
            
            return DocumentAnalysis(
                document_type=doc_type,
                cats_numbers=cats_numbers,
                entities=entities,
                suggested_title=title,
                summary=summary
            )
        
        except Exception as e:
            print(f"Claude analysis error: {e}")
            return self._rule_based_analysis(text, cats_numbers)
    
    def _parse_field(self, text: str, field: str) -> Optional[str]:
        """Parse a field from Claude's response."""
        pattern = f"{field}:\\s*(.+?)(?=\\n[A-Z_]+:|$)"
        match = re.search(pattern, text, re.DOTALL)
        return match.group(1).strip() if match else None
