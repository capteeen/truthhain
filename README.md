# Truth Chain

**Permanent, tamper-proof registry for the 2026 Epstein file releases on Solana blockchain.**

## 🎯 Mission

Ensure historical integrity by providing immutable verification of every page from the 3-million-page DOJ release. No file can be silently altered without public record.

## ✨ Features

- **Drag & Drop Verification**: Upload any PDF to verify authenticity in <3 seconds
- **On-Chain Proof**: Every document hash stored on Solana with timestamps
- **CATS Tracker**: Track Consolidated Asset Tracking System numbers to properties
- **Metadata Explorer**: Search/filter by document type without downloading 300GB
- **Stealth Redaction Detection**: Automatically flags if DOJ updates files

## 🏗️ Architecture

```
truthhain/
├── programs/truth_chain/     # Solana/Anchor program (Rust)
├── backend/                  # FastAPI Python backend
│   ├── services/            # Hasher, Solana client, OCR, AI
│   └── models/              # Pydantic models
├── frontend/                # Vite + React UI
│   └── src/components/      # DragDropVerifier, Explorer, CATS
└── tests/                   # Anchor TypeScript tests
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Rust & Anchor CLI
- Solana CLI

### 1. Install Dependencies

```bash
# Root (Anchor/Solana)
npm install

# Backend
cd backend && pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

### 2. Build & Deploy Solana Program

```bash
anchor build
anchor deploy --provider.cluster devnet
```

### 3. Start Backend

```bash
cd backend
uvicorn main:app --reload
```

### 4. Start Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3000

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/verify` | POST | Verify document hash |
| `/api/hash` | POST | Compute SHA-256 of PDF |
| `/api/documents` | GET | List/search documents |
| `/api/cats/{id}` | GET | CATS number lookup |
| `/api/stats` | GET | Registry statistics |

## 🔐 Solana Program

Instructions:
- `initialize_registry` - One-time setup
- `register_document` - Store document hash on-chain
- `verify_document` - Check hash matches
- `flag_modification` - Mark stealth redactions

## 📄 License

MIT License - Open source for transparency.
