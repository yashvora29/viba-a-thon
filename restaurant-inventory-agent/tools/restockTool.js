const inventoryTool = require('./inventoryTool');

/**
 * Simulates generating an order to suppliers for items that are low in stock.
 * @returns {object} Order details including items, quantities to order, and total estimated cost.
 */
function generateSupplierOrder() {
    const lowStockItems = inventoryTool.getLowStockItems();
    
    if (lowStockItems.length === 0) {
        return {
            needsRestock: false,
            message: "Inventory is healthy. No items below minimum threshold.",
            order: []
        };
    }

    let estimatedTotalCost = 0;
    const orderItems = [];
    
    // Simple heuristic: Order enough to bring stock to 1.5x the minimum threshold
    lowStockItems.forEach(item => {
        const targetStock = item.threshold * 1.5;
        const orderQuantity = Math.ceil(targetStock - item.currentStock);
        const itemCost = orderQuantity * item.cost_per_unit;
        
        estimatedTotalCost += itemCost;
        orderItems.push({
            ingredient: item.item,
            quantity: orderQuantity,
            unit: item.unit,
            cost: itemCost
        });
    });

    let message = "Recommended supplier order:\n";
    orderItems.forEach(i => {
        message += `- ${i.ingredient} x${i.quantity} ${i.unit}\n`;
    });
    message += `\nEstimated Cost: ₹${estimatedTotalCost}`;

    return {
        needsRestock: true,
        message,
        order: orderItems,
        totalCost: estimatedTotalCost
    };
}

module.exports = {
    generateSupplierOrder
};
