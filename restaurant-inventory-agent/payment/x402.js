require('dotenv').config();
const { ethers } = require('ethers');

/**
 * Real Web3 Integration mirroring the facinet-sdk requirement.
 * This connects to a live testnet (Polygon/Ethereum) to process
 * cryptocurrency micro-payments before executing agent actions.
 */

// Basic ABI containing the functions we need
const CONTRACT_ABI = [
    "function payForAgentService() external payable",
    "function payForRestock(string memory orderReference) external payable",
    "event AgentFunded(address indexed user, uint256 amount)",
    "event OrderFunded(address indexed agent, string orderReference, uint256 amount)"
];

/**
 * Simulates a request for payment using actual Web3 logic (facinet-sdk style).
 * @param {number} amount - Amount in ETH/MATIC to pay (will be parsed to Wei).
 * @param {string} reason - The reason for the charge (used as orderReference).
 * @returns {Promise<boolean>} True if payment successful on the blockchain.
 */
async function processPayment(amount, reason) {
    console.log(`\n\x1b[35m[Web3 Protocol]\x1b[0m Initiating Blockchain Transaction...`);
    console.log(`\x1b[35m[Web3 Protocol]\x1b[0m Action: ${reason}`);
    
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    // Fallback exactly to simulation if the user hasn't configured their .env yet
    if (!privateKey || privateKey === "YOUR_WALLET_PRIVATE_KEY_HERE" || !rpcUrl || !contractAddress) {
        console.log(`\x1b[33m[Web3 Warning]\x1b[0m Missing .env configuration.`);
        console.log(`\x1b[33m[Web3 Warning]\x1b[0m Falling back to local simulation mode...\n`);
        return simulatePaymentFallback(amount, reason);
    }

    try {
        // 1. Connect to the blockchain network
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // 2. Load the Agent's Wallet
        const wallet = new ethers.Wallet(privateKey, provider);
        console.log(`\x1b[35m[Web3 Protocol]\x1b[0m Connected Agent Wallet: ${wallet.address}`);
        
        // 3. Connect to the RestaurantPayments Smart Contract
        const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);
        
        // We charge a tiny fraction of a token for the micro-transaction (e.g. 0.0001 ETH/MATIC)
        // Hard-coding a safe micro-fee for the hackathon demo rather than the raw 'amount' integer
        const paymentAmountWei = ethers.parseEther("0.0001");
        
        console.log(`\x1b[35m[Web3 Protocol]\x1b[0m Prompting smart contract payForRestock() signature...`);
        
        // 4. Execute the Transaction (Calls payForRestock on our Solidity contract)
        const tx = await contract.payForRestock(reason, { value: paymentAmountWei });
        
        console.log(`\x1b[35m[Web3 Protocol]\x1b[0m Tx Signed! Hash: ${tx.hash}`);
        console.log(`\x1b[35m[Web3 Protocol]\x1b[0m Waiting for block confirmation...`);
        
        // Wait for 1 confirmation
        await tx.wait(1);
        
        console.log(`\x1b[35m[Web3 Protocol]\x1b[0m \x1b[32mPayment Confirmed on Blockchain! ✅\x1b[0m`);
        return true;
        
    } catch (error) {
        console.error(`\x1b[31m[Web3 Protocol Error]\x1b[0m Payment failed:`, error.message);
        return false;
    }
}

// Fallback logic so the agent doesn't break if .env isn't set up yet
function simulatePaymentFallback(amount, reason) {
    let mockWalletBalance = 5000;
    return new Promise((resolve) => {
        setTimeout(() => {
            if (mockWalletBalance >= amount) {
                mockWalletBalance -= amount;
                console.log(`\x1b[35m[x402 Protocol]\x1b[0m Payment Successful! ✅ (Simulated)`);
                resolve(true);
            } else {
                console.log(`\x1b[31m[x402 Protocol]\x1b[0m Payment Failed! ❌ (Simulated)`);
                resolve(false);
            }
        }, 1500);
    });
}

/**
 * Simulates charging the user for the AI Agent's thought process/API usage.
 * In a full dApp, this would check `userBalances` on the smart contract, 
 * but for the CLI demo, we simulate the user approving the transaction.
 */
async function chargeUserService(feeAmount, serviceName) {
    console.log(`\n\x1b[36m[Agent Billing]\x1b[0m Charging user for service: ${serviceName}`);
    console.log(`\x1b[36m[Agent Billing]\x1b[0m Fee: ${feeAmount} tokens`);
    
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`\x1b[36m[Agent Billing]\x1b[0m \x1b[32mUser Payment Received! Agent Earned ${feeAmount} tokens ✅\x1b[0m`);
            resolve(true);
        }, 1200);
    });
}

module.exports = {
    processPayment,
    chargeUserService
};
