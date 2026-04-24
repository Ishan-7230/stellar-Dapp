# Soroban Smart Contract Deployment Guide

This project now includes a Soroban smart contract for a decentralized Todo list. To use the smart contract instead of the legacy `ManageData` storage, follow these steps:

## Prerequisites

1.  **Stellar CLI**: Install the Stellar CLI if you haven't already.
    ```bash
    cargo install --locked stellar-cli --features opt
    ```
2.  **Rust**: Ensure you have Rust and the `wasm32-unknown-unknown` target installed.
    ```bash
    rustup target add wasm32-unknown-unknown
    ```

## Deployment Steps

1.  **Build the Contract**:
    Navigate to the `contract` directory and build the WASM file.
    ```bash
    cd contract
    stellar contract build
    ```
    This will generate a file in `target/wasm32-unknown-unknown/release/todo_contract.wasm`.

2.  **Configure an Identity**:
    ```bash
    stellar keys generate --network testnet my-identity
    ```

3.  **Deploy to Testnet**:
    ```bash
    stellar contract deploy \
      --wasm target/wasm32-unknown-unknown/release/todo_contract.wasm \
      --source my-identity \
      --network testnet
    ```
    **Copy the Contract ID** (e.g., `CC3D5K4G...`) from the output.

4.  **Update Frontend**:
    Open `src/stellar.js` and replace the `CONTRACT_ID` placeholder with your new Contract ID:
    ```javascript
    const CONTRACT_ID = 'YOUR_CONTRACT_ID_HERE';
    ```

## How it Works

The frontend in `src/stellar.js` is programmed to automatically detect if a `CONTRACT_ID` is provided. If it starts with 'C', it will attempt to use Soroban RPC to call your smart contract functions (`add_task`, `get_tasks`, etc.). If no contract ID is provided, it falls back to the legacy Stellar `ManageData` storage logic.
