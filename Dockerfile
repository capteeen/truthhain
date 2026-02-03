# Truth Chain - Solana Build Environment
# Uses compatible Solana/Anchor toolchain versions

FROM rust:1.82-slim-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libudev-dev \
    libssl-dev \
    build-essential \
    curl \
    git \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install Solana CLI (v1.18.x has compatible platform tools)
RUN sh -c "$(curl -sSfL https://release.solana.com/v1.18.23/install)" && \
    echo 'export PATH="/root/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc

ENV PATH="/root/.local/share/solana/install/active_release/bin:$PATH"

# Install Anchor CLI (0.28.0 - compatible with Solana 1.18.x)
RUN cargo install --git https://github.com/coral-xyz/anchor --tag v0.28.0 anchor-cli --locked

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Configure Solana for devnet
RUN solana config set --url devnet

# Build command
CMD ["anchor", "build"]
