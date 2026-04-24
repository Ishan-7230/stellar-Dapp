# Stellar Node: Decentralized Workflow Engine

**Stellar Node** is a premium, fully decentralized task management application built on the Stellar blockchain. It leverages Soroban smart contracts to provide an immutable, transparent, and secure workflow environment.

![Project Preview](https://img.shields.io/badge/Network-Stellar_Testnet-blue?style=for-the-badge)
![Tech-Rust](https://img.shields.io/badge/Contract-Soroban_Rust-orange?style=for-the-badge)
![Tech-React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge)

##  Project Vision
updated

##  Key Features
- **Decentralized Storage**: Tasks are stored in Soroban Smart Contracts, not a central database.
- **Freighter Integration**: Secure login and transaction signing via the Freighter wallet.
- **Automated Funding**: One-click account initialization via Stellar Friendbot (10,000 Testnet XLM).
- **Premium UI**: A sleek, glassmorphic "Cipher-Slate" interface with real-time blockchain feedback.
- **Hybrid Logic**: Supports both legacy `ManageData` storage and advanced Soroban Smart Contracts.

##  Technology Stack
- **Frontend**: React.js (Vite), Vanilla CSS (Custom Design System).
- **Blockchain**: Stellar Testnet.
- **Smart Contract**: Soroban (Rust).
- **APIs**: Horizon API, Soroban RPC.
- **Wallet**: @stellar/freighter-api.

##  Project Structure
```text
├── contract/             # Soroban Smart Contract (Rust)
│   ├── src/lib.rs        # Core contract logic
│   └── Cargo.toml        # Contract configuration
├── src/
│   ├── stellar.js        # Blockchain communication layer (SDK)
│   ├── App.jsx           # Main application logic & UI
│   ├── index.css         # Glassmorphism & Cyberpunk styles
│   └── main.jsx          # Entry point
├── README_SOROBAN.md     # Detailed smart contract deployment guide
└── package.json          # Frontend dependencies
```

## Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **Freighter Wallet Extension** (installed in your browser)
- **Stellar CLI** (for contract deployment)

### 2. Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd Dapp

# Install dependencies
npm install
```

### 3. Running the App
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

### 4. Deploying the Smart Contract
To move from legacy storage to a "real" smart contract:
1. Navigate to the `contract` folder.
2. Build and deploy using the instructions in [README_SOROBAN.md](./README_SOROBAN.md).
3. Update the `CONTRACT_ID` in `src/stellar.js`.

##  Security & Disclaimer
This project is currently configured for the **Stellar Testnet**. Do not use real XLM or Mainnet accounts. The contract is for educational and demonstrational purposes.

##  License
Apache 2.0