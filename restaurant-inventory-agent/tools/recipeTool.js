const fs = require('fs');
const path = require('path');
const inventoryTool = require('./inventoryTool');

const RECIPES_FILE = path.join(__dirname, '../recipes.json');

function getRecipes() {
    return JSON.parse(fs.readFileSync(RECIPES_FILE, 'utf8'));
}

/**
 * Checks if a specific quantity of a dish can be cooked based on current inventory.
 * @param {string} dishName - Name of the dish.
 * @param {number} quantity - Number of portions.
 * @returns {object} Object containing feasibility status, missing items, and explanation.
 */
function canCookDish(dishName, quantity) {
    dishName = dishName.toLowerCase();
    const recipes = getRecipes();
    
    if (!recipes[dishName]) {
        return {
            possible: false,
            explanation: `I don't have a recipe for "${dishName}".`
        };
    }

    const recipe = recipes[dishName];
    const inventory = inventoryTool.getInventory();
    const missingIngredients = [];
    
    // Check required quantities against actual stock
    for (const [ingredient, amountPerPortion] of Object.entries(recipe.ingredients)) {
        const requiredAmount = amountPerPortion * quantity;
        
        if (!inventory[ingredient]) {
             missingIngredients.push({
                ingredient,
                requiredAmount,
                currentStock: 0,
                unit: 'unknown'
             });
        } else if (inventory[ingredient].stock < requiredAmount) {
            missingIngredients.push({
                ingredient,
                requiredAmount,
                currentStock: inventory[ingredient].stock,
                unit: inventory[ingredient].unit
            });
        }
    }

    if (missingIngredients.length > 0) {
        let explanation = "Cannot cook requested amount. Insufficient stock:\n";
        missingIngredients.forEach(item => {
            explanation += `- ${item.ingredient}: Need ${item.requiredAmount} ${item.unit}, but only have ${item.currentStock} ${item.unit}.\n`;
        });
        
        return {
            possible: false,
            missingIngredients,
            explanation
        };
    }

    return {
        possible: true,
        explanation: `Yes, we have sufficient ingredients to cook ${quantity} ${dishName}.`
    };
}

module.exports = {
    getRecipes,
    canCookDish
};
