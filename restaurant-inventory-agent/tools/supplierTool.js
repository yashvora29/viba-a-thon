/**
 * Simulates an external supplier API.
 */

// Simulated supplier catalog with availability
const supplierCatalog = {
    "paneer": { available: true, deliveryDays: 1 },
    "tomato": { available: true, deliveryDays: 1 },
    "onion": { available: true, deliveryDays: 1 },
    "butter": { available: true, deliveryDays: 2 },
    "rice": { available: true, deliveryDays: 3 },
    "spices": { available: true, deliveryDays: 2 }
};

/**
 * Simulates placing an order.
 * @param {Array} orderItems - Array of items to order.
 * @returns {object} Status of the placed order.
 */
function placeOrder(orderItems) {
    console.log("\n[Supplier API] Connecting to local suppliers...");
    
    let processedItems = [];
    let delayedItems = [];

    orderItems.forEach(item => {
        const catalogItem = supplierCatalog[item.ingredient];
        if (catalogItem && catalogItem.available) {
            processedItems.push({
                ...item,
                estimatedDelivery: `${catalogItem.deliveryDays} day(s)`
            });
        } else {
            delayedItems.push(item);
        }
    });

    return {
        success: true,
        referenceId: `ORD-${Math.floor(Math.random() * 100000)}`,
        processedItems,
        delayedItems,
        message: "Order placed successfully."
    };
}

module.exports = {
    placeOrder
};
