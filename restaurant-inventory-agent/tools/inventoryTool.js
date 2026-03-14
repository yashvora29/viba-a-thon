const fs = require('fs');
const path = require('path');

const INVENTORY_FILE = path.join(__dirname, '../inventory.json');

// Helper to read inventory
function getInventory() {
    return JSON.parse(fs.readFileSync(INVENTORY_FILE, 'utf8'));
}

// Helper to write inventory
function saveInventory(data) {
    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(data, null, 4));
}

/**
 * Checks overall inventory status.
 * @returns {string} Formatted inventory status string.
 */
function checkInventoryStatus() {
    const inv = getInventory();
    let result = "Current Inventory:\n";
    for (const [item, details] of Object.entries(inv)) {
        result += `- ${item}: ${details.stock} ${details.unit}\n`;
    }
    return result;
}

/**
 * Identifies items that are below their minimum threshold.
 * @returns {Array} List of low stock items.
 */
function getLowStockItems() {
    const inv = getInventory();
    const lowStock = [];
    for (const [item, details] of Object.entries(inv)) {
        if (details.stock < details.minimum_threshold) {
            lowStock.push({
                item,
                currentStock: details.stock,
                threshold: details.minimum_threshold,
                deficit: details.minimum_threshold - details.stock,
                unit: details.unit,
                cost_per_unit: details.cost_per_unit
            });
        }
    }
    return lowStock;
}

module.exports = {
    getInventory,
    saveInventory,
    checkInventoryStatus,
    getLowStockItems
};
