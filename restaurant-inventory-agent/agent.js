const readline = require('readline');
const inventoryTool = require('./tools/inventoryTool');
const recipeTool = require('./tools/recipeTool');
const restockTool = require('./tools/restockTool');
const supplierTool = require('./tools/supplierTool');
const x402 = require('./payment/x402');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const AGENT_PREFIX = "\x1b[36m[Agent]:\x1b[0m";
const SYSTEM_PREFIX = "\x1b[33m[System]:\x1b[0m";

console.log(`${SYSTEM_PREFIX} Starting Restaurant Inventory AI Agent...`);
console.log(`${SYSTEM_PREFIX} Type 'exit' to quit.\n`);
console.log(`${AGENT_PREFIX} Hello! I am your AI restaurant manager. How can I assist you today?\n`);

/**
 * Mock Model for Intent Detection using Regex heuristics.
 * In a full implementation, this routes the String to an LLM via API.
 */
function detectIntent(userInput) {
    const input = userInput.toLowerCase();
    
    if (input.includes('inventory') && (input.includes('check') || input.includes('show'))) {
        return 'inventory_check';
    } else if (input.includes('cook') || input.includes('make')) {
        return 'recipe_feasibility';
    } else if (input.includes('low stock') || input.includes('shortage')) {
        return 'low_stock_check';
    } else if ((input.includes('restock') || input.includes('order')) && (input.includes('generate') || input.includes('ingredients') || input.includes('supplier'))) {
        return 'generate_order';
    } else if (input === 'exit' || input === 'quit') {
        return 'exit';
    }
    return 'unknown';
}

/**
 * Main Agent Loop Event Handler
 */
async function processCommand(input) {
    const intent = detectIntent(input);
    console.log(`\n${SYSTEM_PREFIX} Intent detected: \x1b[32m${intent}\x1b[0m`);

    switch (intent) {
        case 'inventory_check':
            console.log(`${SYSTEM_PREFIX} Selected tool: inventoryTool`);
            console.log(`\n${AGENT_PREFIX} Here is the current inventory status:`);
            console.log(inventoryTool.checkInventoryStatus());
            break;

        case 'low_stock_check':
            console.log(`${SYSTEM_PREFIX} Selected tool: inventoryTool`);
            const lowItems = inventoryTool.getLowStockItems();
            console.log(`\n${AGENT_PREFIX} Checking for items below minimum threshold...`);
            if (lowItems.length === 0) {
                console.log(`${AGENT_PREFIX} All inventory levels are looking good!`);
            } else {
                console.log(`${AGENT_PREFIX} The following items are running low:`);
                lowItems.forEach(i => console.log(`- ${i.item}: ${i.currentStock} ${i.unit} (Threshold: ${i.threshold})`));
            }
            break;

        case 'recipe_feasibility':
            console.log(`${SYSTEM_PREFIX} Selected tool: recipeTool`);
            
            // 💰 AGENT EARNS MONEY HERE 💰
            console.log(`\n${AGENT_PREFIX} Analyzing recipes requires premium AI compute.`);
            const userPaid = await x402.chargeUserService(2, "Recipe Feasibility Analysis");
            
            if (!userPaid) {
                console.log(`${AGENT_PREFIX} \x1b[31mAnalysis aborted. Insufficient user funds.\x1b[0m`);
                break;
            }

            // Basic extraction logic: "can we cook 10 paneer butter masala" -> qty 10, dish "paneer butter masala"
            const match = input.match(/cook\s+(\d+)\s+(.+)/i) || input.match(/make\s+(\d+)\s+(.+)/i);
            
            let qty = 1;
            let dish = input; // fallback

            if (match) {
                qty = parseInt(match[1]);
                dish = match[2].replace('?', '').trim();
            } else {
                // If regex fails to catch number, just default to 1 and try to strip words
                dish = input.replace(/can we (cook|make)/i, '').replace('?', '').trim();
            }

            console.log(`\n${AGENT_PREFIX} Checking if we can cook ${qty}x ${dish}...`);
            const result = recipeTool.canCookDish(dish, qty);
            
            if (result.possible) {
                console.log(`${AGENT_PREFIX} ${result.explanation}`);
            } else {
                console.log(`\n${AGENT_PREFIX} \x1b[31m${result.explanation}\x1b[0m`);
            }
            break;

        case 'generate_order':
            console.log(`${SYSTEM_PREFIX} Selected tool: restockTool`);
            console.log(`\n${AGENT_PREFIX} Analyzing low stock to generate a supplier order...`);
            
            const orderDoc = restockTool.generateSupplierOrder();
            if (!orderDoc.needsRestock) {
                console.log(`${AGENT_PREFIX} ${orderDoc.message}`);
                break;
            }

            console.log(`\n${AGENT_PREFIX} AI Reasoning: Some required items are below threshold. We need an order to maintain operations.`);
            console.log(orderDoc.message);

            console.log(`\n${AGENT_PREFIX} Generating this supplier order requires executing a premium action.`);
            
            // Trigger facinet-sdk x402 payment
            const paymentSuccess = await x402.processPayment(10, "Generate and Execute RESTOCK_SUPPLIER_ORDER tool");
            
            if (paymentSuccess) {
                console.log(`${SYSTEM_PREFIX} Selected tool: supplierTool`);
                console.log(`${AGENT_PREFIX} Payment confirmed. Contacting suppliers...`);
                const orderStatus = supplierTool.placeOrder(orderDoc.order);
                
                console.log(`${AGENT_PREFIX} Order ${orderStatus.referenceId} Placed Successfully!`);
                console.log(`${AGENT_PREFIX} Expected deliveries:`);
                orderStatus.processedItems.forEach(i => {
                    console.log(`- ${i.ingredient}: ${i.quantity} ${i.unit} (ETA: ${i.estimatedDelivery})`);
                });
            } else {
                console.log(`${AGENT_PREFIX} Cannot place the order due to payment failure.`);
            }
            break;

        case 'exit':
            console.log(`${AGENT_PREFIX} Shutting down. Have a great day!`);
            process.exit(0);
            break;

        default:
            console.log(`\n${AGENT_PREFIX} I'm sorry, I didn't quite understand that. You can try asking me to "check inventory", "show low stock items", or check if we "can cook 10 paneer butter masala".`);
            break;
    }

    // Prompt again
    promptUser();
}

function promptUser() {
    rl.question('\n> ', (input) => {
        processCommand(input.trim());
    });
}

// Start the sequence
promptUser();
