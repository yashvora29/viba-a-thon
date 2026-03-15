const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { getInventory, saveInventory } = require('./tools/inventoryTool');

const app = express();
const PORT = process.env.PORT || 3001;

// Allow the React frontend to fetch data
app.use(cors());
app.use(express.json());

// Health check for platforms and quick verification
app.get('/health', (req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});

// Get all inventory
app.get('/api/inventory', (req, res) => {
    try {
        const inventory = getInventory();
        res.json(inventory);
    } catch (e) {
        res.status(500).json({ error: "Failed to read inventory" });
    }
});

// Add a new inventory item
app.post('/api/inventory', (req, res) => {
    try {
        const { name, stock, unit, minimum_threshold, cost_per_unit, expiry, store } = req.body;
        
        if (!name || isNaN(stock)) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const inventory = getInventory();
        const itemName = name.toLowerCase();
        
        inventory[itemName] = {
            stock: Number(stock),
            unit: unit || 'units',
            minimum_threshold: Number(minimum_threshold) || 10,
            cost_per_unit: Number(cost_per_unit) || 0,
            expiry: expiry || null,
            store: store || "Main Branch"
        };

        saveInventory(inventory);
        res.json({ success: true, item: itemName, details: inventory[itemName] });
        
    } catch (e) {
        console.error("API Error adding item:", e);
        res.status(500).json({ error: "Failed to update inventory" });
    }
});

// Delete an inventory item
app.delete('/api/inventory/:name', (req, res) => {
    try {
        const itemName = req.params.name.toLowerCase();
        const inventory = getInventory();

        if (!inventory[itemName]) {
            return res.status(404).json({ error: "Item not found" });
        }

        delete inventory[itemName];
        saveInventory(inventory);
        
        res.json({ success: true, message: `Deleted ${itemName}` });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete item" });
    }
});

// Update an existing inventory item
app.put('/api/inventory/:name', (req, res) => {
    try {
        const itemName = req.params.name.toLowerCase();
        const updates = req.body;
        const inventory = getInventory();

        if (!inventory[itemName]) {
            return res.status(404).json({ error: "Item not found" });
        }

        // Merge existing with updates
        inventory[itemName] = { ...inventory[itemName], ...updates };
        saveInventory(inventory);

        res.json({ success: true, item: itemName, details: inventory[itemName] });
    } catch (e) {
        res.status(500).json({ error: "Failed to update item" });
    }
});

// AI Chat Endpoint — Premium Feature
app.post('/api/chat', (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        const inventory = getInventory();
        const msg = message.toLowerCase();
        const items = Object.entries(inventory);
        let response = '';

        if (msg.includes('low') || msg.includes('stock') || msg.includes('restock')) {
            const low = items.filter(([_, v]) => v.stock < v.minimum_threshold);
            if (low.length > 0) {
                response = `⚠️ Low Stock Alert: **${low.length} items** need urgent restocking!\n\nItems: ${low.map(([n, v]) => `${n} (${v.stock} ${v.unit} left)`).join(', ')}.\n\nRecommendation: Place a supplier order immediately to avoid service disruption.`;
            } else {
                response = `✅ All stock levels are currently healthy! No items are below their minimum threshold.`;
            }
        } else if (msg.includes('expir') || msg.includes('date') || msg.includes('waste')) {
            const today = new Date();
            const expiring = items.filter(([_, v]) => {
                if (!v.expiry) return false;
                const diff = (new Date(v.expiry).getTime() - today.getTime()) / (1000 * 3600 * 24);
                return diff > 0 && diff <= 7;
            });
            if (expiring.length > 0) {
                response = `🚨 Expiry Risk Detected: **${expiring.length} items** expire within 7 days!\n\nItems: ${expiring.map(([n, v]) => `${n} (expires ${v.expiry})`).join(', ')}.\n\nRecommendation: Run a discount promotion on these items or create special dishes to reduce waste.`;
            } else {
                response = `✅ No immediate expiry risks found in the next 7 days. Your inventory is well-managed!`;
            }
        } else if (msg.includes('capital') || msg.includes('value') || msg.includes('money') || msg.includes('cost')) {
            const total = items.reduce((acc, [_, v]) => acc + (v.stock * v.cost_per_unit), 0);
            const mostValuable = [...items].sort((a, b) => (b[1].stock * b[1].cost_per_unit) - (a[1].stock * a[1].cost_per_unit))[0];
            response = `💰 Capital Analysis:\n\nTotal inventory value: **₹${total}**\n\nMost capital-intensive item: **${mostValuable ? mostValuable[0] : 'N/A'}** (₹${mostValuable ? mostValuable[1].stock * mostValuable[1].cost_per_unit : 0})\n\nRecommendation: Optimize ordering cycles for high-cost items to reduce tied-up capital.`;
        } else if (msg.includes('how many') || msg.includes('count') || msg.includes('total item')) {
            response = `📊 Inventory Summary:\n\nTotal unique items: **${items.length}**\nStores tracked: **${new Set(items.map(([_, v]) => v.store).filter(Boolean)).size + 1}**\nLow stock items: **${items.filter(([_, v]) => v.stock < v.minimum_threshold).length}**`;
        } else if (msg.includes('help') || msg.includes('what can') || msg.includes('command')) {
            response = `🤖 Omniscience AI Agent — I can help you with:\n\n• **Low Stock** — ask about items that need restocking\n• **Expiry Risks** — find items about to expire\n• **Capital Value** — calculate money tied in inventory\n• **Item Count** — total items across all stores\n\nJust ask naturally!`;
        } else {
            response = `🤖 Analyzing: "${message}"\n\nBased on your current inventory of **${items.length} items**, I recommend:\n1. Review the ${items.filter(([_, v]) => v.stock < v.minimum_threshold).length} low-stock items\n2. Check items expiring this week\n3. Consider optimizing your ordering frequency to reduce waste and capital lock-up.`;
        }

        res.json({ response });
    } catch (e) {
        res.status(500).json({ error: 'AI Agent error' });
    }
});

app.listen(PORT, () => {
    console.log(`[Dashboard API] Server running on http://localhost:${PORT}`);
});

// If a production build of the frontend exists, serve it as static files.
// This allows deploying the whole app as a single service (optional).
const distPath = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // Serve index.html for any unknown routes (SPA fallback)
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Dashboard API] Serving static frontend from', distPath);
}
