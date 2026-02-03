# Truth Chain - Deployment Guide

Since your local Solana Platform Tools have a Cargo version incompatibility, here are alternative deployment methods:

## Option 1: Solana Playground (Recommended - No Setup Required)

1. **Go to** [beta.solpg.io](https://beta.solpg.io)

2. **Create new project** → Select "Anchor (Rust)"

3. **Copy the program code** from `programs/truth_chain/src/lib.rs` into the editor

4. **Build** → Click the "Build" button (hammer icon)

5. **Deploy** → Click "Deploy" → Select "Devnet"

6. **Copy Program ID** → The deployed program ID will be shown

7. **Update your config** → Add the Program ID to:
   - `Anchor.toml` → `[programs.devnet]`
   - `frontend/src/App.tsx` or create an `.env` file

## Option 2: Install Docker Desktop

1. Download Docker Desktop from https://www.docker.com/products/docker-desktop/

2. Install and start Docker

3. Run:
   ```bash
   cd /Users/jafarliman/Desktop/truthhain
   docker-compose run builder
   docker-compose run deploy
   ```

## Option 3: Update Solana CLI

When Solana CLI 3.1+ is released with Platform Tools v1.52+, run:
```bash
solana-install update
anchor build
anchor deploy --provider.cluster devnet
```

## Your Wallet Details

- **Devnet Address**: ZWMcVVarxTb7ziPC9haKJ2ykSeDjhpbbizDM1QqLcLP
- **Keypair Path**: ~/.config/solana/id.json

Get devnet SOL: https://faucet.solana.com/ (paste your address)

## After Deployment

1. Update the Program ID in `Anchor.toml`:
   ```toml
   [programs.devnet]
   truth_chain = "YOUR_NEW_PROGRAM_ID"
   ```

2. Update the frontend to use the real Program ID

3. Start the frontend and backend to test:
   ```bash
   cd backend && uvicorn main:app --reload &
   cd frontend && npm run dev
   ```
