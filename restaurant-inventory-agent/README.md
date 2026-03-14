# Restaurant Inventory AI Agent

An autonomous AI agent designed to act like a smart manager. It tracks ingredient stock, monitors custom thresholds, reasons about dish feasibility based on recipes, and automatically generates required supplier orders.

**Built for the Vibe-A-Thon Hackathon.**

## 🚀 Problem Statement
Managing restaurant inventory manually is time-consuming and prone to human error, leading to out-of-stock ingredients. This project introduces an autonomous agent that monitors inventory and automatically re-orders stock using the x402 payment protocol.

## 🧠 Architecture
- **Agent Core (`agent.js`)**: Runs a CLI Read-Eval-Print Loop (REPL), parses user intent, and selects the appropriate tool for the job.
- **Data Stores (`*.json`)**: Simple local file-based data structures holding current ingredients and dish recipes.
- **Tool Modules (`tools/`)**:
  - `inventoryTool.js`: Reads and reports on stock thresholds.
  - `recipeTool.js`: Calculates ingredient deltas to determine if specific dishes can be reliably cooked.
  - `restockTool.js`: Aggregates low-stock data and prepares order manifests.
  - `supplierTool.js`: Mock API interacting with external local suppliers to finalize physical orders.
- **Payment Layer (`payment/x402.js`)**: Uses `facinet-sdk` conventions to authorize micropayments before performing high-value operations like placing orders.

## 📦 Setup Instructions

1. **Clone the repository:**
   ```bash
   cd restaurant-inventory-agent
   ```
2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```
   *(Note: This project relies on vanilla Node.js to stay lightweight for the CLI, so `npm install` just sets up the basic package.json state).*

3. **Run the AI Agent:**
   ```bash
   node agent.js
   ```

## 💻 Demo Commands

Once the agent is running in your terminal, try pasting the following commands to see its AI intent detection, tool routing, and reasoning:

1. **"check inventory"** 
   *-> Triggers `inventoryTool` to output current stock.*
2. **"show low stock items"**
   *-> Triggers `inventoryTool` to strictly identify things below minimum safe thresholds.*
3. **"can we cook 12 paneer butter masala"** 
   *-> Triggers `recipeTool` to run a deep analysis on recipe ingredients vs active stock, outputting the reasoning logic for any shortages.*
4. **"generate supplier order"**
   *-> Triggers the `restockTool`. Because ordering costs money, this triggers the **x402** intent framework. You will see a payment request simulated before the `supplierTool` handles the simulated API restock.*