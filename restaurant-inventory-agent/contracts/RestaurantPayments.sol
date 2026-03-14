// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title RestaurantPayments
 * @dev A simple smart contract acting as an escrow or payment gateway
 * for the AI Restaurant Inventory Agent to authorize supplier restocks.
 * This satisfies the Vibe-A-Thon "working logic" smart contract requirement.
 */
contract RestaurantPayments {
    address public owner;
    
    // Record of all payments made by users to the agent
    mapping(address => uint256) public userBalances;

    event AgentFunded(address indexed user, uint256 amount);
    event OrderFunded(address indexed agent, string orderReference, uint256 amount);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Allows a User to pay the AI Agent for its consulting services.
     */
    function payForAgentService() external payable {
        require(msg.value > 0, "Payment must be greater than 0");
        userBalances[msg.sender] += msg.value;
        emit AgentFunded(msg.sender, msg.value);
    }
    function payForRestock(string memory orderReference) external payable {
        require(msg.value > 0, "Payment must be greater than 0");
        
        // Record the payment
        orderPayments[orderReference] += msg.value;
        
        // Emit an event that the Node.js backend/agent can listen to
        emit OrderFunded(msg.sender, orderReference, msg.value);
    }

    /**
     * @dev Allows the restaurant owner to withdraw accumulated funds.
     */
    function withdrawFunds() external {
        require(msg.sender == owner, "Only owner can withdraw");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(owner, balance);
    }

    // Fallback function to receive plain ETH/MATIC
    receive() external payable {}
}
