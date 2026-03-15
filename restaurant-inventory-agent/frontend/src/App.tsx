import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

declare global { interface Window { ethereum: any; } }

// Read backend base URL from Vite env var (VITE_API_URL). If empty, fall back to relative /api (local dev with proxy)
const API_BASE = ((import.meta.env as any).VITE_API_URL as string) || '';

interface InventoryItem {
  stock: number; unit: string; minimum_threshold: number;
  cost_per_unit: number; expiry?: string; store?: string;
}
interface ChatMessage { from: 'user' | 'ai'; text: string; }

// ============ MOCK DATA FOR MODULES ============
const STAFF = [
  { name: 'Ravi Kumar', role: 'Head Chef', shift: '08:00 - 16:00', status: 'active', store: 'Main Branch' },
  { name: 'Priya Singh', role: 'Sous Chef', shift: '12:00 - 20:00', status: 'active', store: 'Main Branch' },
  { name: 'Ankit Sharma', role: 'Cashier', shift: '09:00 - 17:00', status: 'active', store: 'Downtown' },
  { name: 'Neha Gupta', role: 'Waiter', shift: '14:00 - 22:00', status: 'off-duty', store: 'Downtown' },
  { name: 'Suresh Patel', role: 'Inventory Manager', shift: '06:00 - 14:00', status: 'active', store: 'Main Branch' },
];

const CUSTOMERS = [
  { name: 'Amit Verma', orders: 23, spent: 14250, lastOrder: '2026-03-13', status: 'VIP' },
  { name: 'Sneha Khanna', orders: 18, spent: 9800, lastOrder: '2026-03-14', status: 'Regular' },
  { name: 'Raj Malhotra', orders: 41, spent: 28990, lastOrder: '2026-03-12', status: 'VIP' },
  { name: 'Divya Nair', orders: 7, spent: 3200, lastOrder: '2026-03-10', status: 'Regular' },
  { name: 'Vikram Bhatt', orders: 55, spent: 42600, lastOrder: '2026-03-14', status: 'VIP' },
];

const TXNS = [
  { id: '0xa1b2c...', type: 'Payment', amount: '0.0001 ETH', desc: 'AI Agent Subscription', time: '13:40', status: 'confirmed' },
  { id: '0xd3e4f...', type: 'Restock', amount: '₹2,400', desc: 'White Truffle Order', time: '12:10', status: 'confirmed' },
  { id: '0xf5a6b...', type: 'Payment', amount: '0.0001 ETH', desc: 'Smart Insights Unlock', time: '11:20', status: 'confirmed' },
  { id: '0xc7d8e...', type: 'Restock', amount: '₹480', desc: 'Organic Tomatoes', time: '10:00', status: 'pending' },
  { id: '0xb9c0d...', type: 'Sale', amount: '₹3,200', desc: 'POS Checkout - Table 4', time: '09:30', status: 'confirmed' },
];

const DELIVERIES = [
  { id: 'DRN-001', item: 'Japanese Wagyu A5', drone: 'Alpha-7', status: 'In Transit', eta: '14 min', dist: '2.3 km' },
  { id: 'DRN-002', item: 'Saffron Threads', drone: 'Beta-3', status: 'Delivered', eta: '—', dist: '1.1 km' },
  { id: 'DRN-003', item: 'White Truffle', drone: 'Gamma-5', status: 'Loading', eta: '32 min', dist: '5.6 km' },
];

const MENU_ITEMS = [
  { name: 'Truffle Risotto', price: 850, ingredients: ['white truffle', 'organic tomatoes'] },
  { name: 'Wagyu Steak', price: 2400, ingredients: ['japanese wagyu a5', 'fresh basil'] },
  { name: 'Paneer Masala', price: 350, ingredients: ['paneer', 'organic tomatoes'] },
  { name: 'Saffron Biryani', price: 480, ingredients: ['saffron threads'] },
  { name: 'Mango Lassi', price: 180, ingredients: ['mango lassi mix'] },
  { name: 'Caviar Toast', price: 1100, ingredients: ['black caviar'] },
];

function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [inventory, setInventory] = useState<Record<string, InventoryItem>>({});
  const [loading, setLoading] = useState(false);
  const [activeModule, setActiveModule] = useState('inventory');

  // New Item Form State
  const [newItemName, setNewItemName] = useState("");
  const [newItemStock, setNewItemStock] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("units");
  const [newItemStore, setNewItemStore] = useState("Main Branch");
  const [newItemExpiry, setNewItemExpiry] = useState("");
  const [selectedStore, setSelectedStore] = useState("All");

  // Premium
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { from: 'ai', text: "👋 Hi! I'm your AI inventory agent. Ask me about low stock, expiry risks, or capital value!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Voice
  const [isListening, setIsListening] = useState(false);

  // PoS Order
  const [posOrder, setPosOrder] = useState<Record<string, number>>({});
  const [posSuccess, setPosSuccess] = useState('');

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    try {
      const url = API_BASE ? `${API_BASE}/api/inventory` : '/api/inventory';
      const res = await fetch(url);
      const data = await res.json();
      setInventory(data);
    } catch { console.error("Failed to fetch inventory"); }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setWalletAddress(accounts[0]);
      } catch (e) { console.error("Wallet error", e); }
    } else { alert("Please install MetaMask!"); }
  };

  const payAgentForAnalysis = async () => {
    if (!walletAddress) return alert("Connect Wallet First!");
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({ to: walletAddress, value: ethers.parseEther("0.0001") });
      await tx.wait(1);
      setIsPremiumUnlocked(true);
      alert(`✅ Payment Successful!\nHash: ${tx.hash}\n\nYou have unlocked:\n• Smart Business Insights\n• Voice Commands\n• AI Chatbox Agent\n• Predictive Sales\n• Drone Delivery`);
    } catch (e: any) { alert("Payment Failed: " + e.message); }
    setLoading(false);
  };

  const handleAddItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName) return;
    try {
  const url = API_BASE ? `${API_BASE}/api/inventory` : '/api/inventory';
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newItemName, stock: Number(newItemStock) || 1, unit: newItemUnit, store: newItemStore, expiry: newItemExpiry, minimum_threshold: 10, cost_per_unit: 50 }) });
      if (!res.ok) throw new Error('Failed');
      fetchInventory();
      setNewItemName(""); setNewItemStock(""); setNewItemExpiry("");
      alert(`✅ "${newItemName}" added successfully!`);
    } catch { alert("❌ Failed to add item. Is the backend running?"); }
  };

  const handleDeleteItem = async (name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { const url = API_BASE ? `${API_BASE}/api/inventory/${name}` : `/api/inventory/${name}`; await fetch(url, { method: 'DELETE' }); fetchInventory(); }
    catch { console.error("Delete failed"); }
  };

  const updateStock = async (name: string, currentStock: number, change: number) => {
    const newStock = Math.max(0, currentStock + change);
    if (newStock === currentStock) return;
    try { const url = API_BASE ? `${API_BASE}/api/inventory/${name}` : `/api/inventory/${name}`; await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock: newStock }) }); fetchInventory(); }
    catch { console.error("Update failed"); }
  };

  const startVoiceCommand = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Browser does not support Voice Recognition.");
    const rec = new SR(); rec.continuous = false; setIsListening(true);
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript.toLowerCase();
      const m = t.match(/add\s+(\d+)\s+(?:units? of\s+)?(?:liters? of\s+)?(.+)/);
      if (m) { setNewItemStock(m[1]); setNewItemName(m[2].trim()); alert(`Voice: Ready to add ${m[1]} of "${m[2].trim()}". Click submit!`); }
      else { alert(`Heard: "${t}". Try "Add 10 units of tomatoes"`); }
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.start();
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatMessages(p => [...p, { from: 'user', text: msg }]);
    setChatInput('');
    setChatLoading(true);
    try {
  const url = API_BASE ? `${API_BASE}/api/chat` : '/api/chat';
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) });
      const data = await res.json();
      setChatMessages(p => [...p, { from: 'ai', text: data.response || 'No response' }]);
    } catch { setChatMessages(p => [...p, { from: 'ai', text: '❌ Backend error. Restart server.js!' }]); }
    setChatLoading(false);
  };

  const addToPos = (item: string, delta: number) => {
    setPosOrder(p => { const n = { ...p }; n[item] = Math.max(0, (n[item] || 0) + delta); if (n[item] === 0) delete n[item]; return n; });
  };

  const checkoutPos = async () => {
    const items = Object.keys(posOrder);
    if (!items.length) return alert('Add items to the order first!');
    for (const item of items) {
      const details = inventory[item.toLowerCase()];
      if (details && posOrder[item] > details.stock) { alert(`❌ Not enough "${item}" in stock!`); return; }
    }
    for (const item of items) {
      const details = inventory[item.toLowerCase()];
      if (details) await updateStock(item.toLowerCase(), details.stock, -posOrder[item]);
    }
    setPosOrder({});
    setPosSuccess(`✅ Order placed! Table served. Stock updated.`);
    setTimeout(() => setPosSuccess(''), 4000);
  };

  const generateInsights = () => {
    const items = Object.entries(inventory);
    if (items.length === 0) return ["Add inventory items to generate insights."];
    const insights: string[] = [];
    const totalValue = items.reduce((acc, [_, d]) => acc + d.stock * d.cost_per_unit, 0);
    insights.push(`💰 Capital Insight: You have ₹${totalValue} tied up in inventory.`);
    const today = new Date();
    const expiring = items.filter(([_, d]) => { if (!d.expiry) return false; const diff = Math.ceil((new Date(d.expiry).getTime() - today.getTime()) / 86400000); return diff > 0 && diff <= 7; });
    if (expiring.length > 0) insights.push(`⚠️ Waste Risk: ${expiring.length} item(s) expire in 7 days. Promote dishes using ${expiring[0][0]}.`);
    const sorted = [...items].sort((a, b) => b[1].stock * b[1].cost_per_unit - a[1].stock * a[1].cost_per_unit);
    if (sorted.length > 0) insights.push(`📈 Top Asset: "${sorted[0][0]}" holds most capital. Restock only what you need.`);
    const lowItems = items.filter(([_, d]) => d.stock < d.minimum_threshold);
    if (lowItems.length > 0) insights.push(`🚨 ${lowItems.length} item(s) below threshold. Place orders for: ${lowItems.map(([n]) => n).join(', ')}.`);
    return insights;
  };

  const filteredInventory = Object.entries(inventory).filter(([_, d]) => selectedStore === "All" || d.store === selectedStore);
  const today = new Date();
  const lowStockCount = Object.values(inventory).filter(d => d.stock < d.minimum_threshold).length;
  const expiryCount = Object.values(inventory).filter(d => { if (!d.expiry) return false; const diff = Math.ceil((new Date(d.expiry).getTime() - today.getTime()) / 86400000); return diff > 0 && diff <= 7; }).length;
  const totalCapital = Object.values(inventory).reduce((a, d) => a + d.stock * d.cost_per_unit, 0);
  const posTotal = MENU_ITEMS.filter(m => posOrder[m.name]).reduce((a, m) => a + m.price * (posOrder[m.name] || 0), 0);

  const MODULE_TITLES: Record<string, string> = {
    inventory: '📦 Live Inventory Dashboard', chat: '🤖 AI Chat Agent',
    accounting: '💰 Accounting & Web3 Ledger', hr: '👥 HR & Shift Management',
    crm: '📈 CRM — Customer Intelligence', pos: '🧾 Point of Sale Terminal',
    sales: '🔮 Predictive Sales AI', delivery: '🚚 Drone Delivery Tracker',
  };

  return (
    <div className="erp-layout">
      {/* Sidebar */}
      <aside className="erp-sidebar">
        <div className="sidebar-brand">
          {/* Brand logo (place the provided image at frontend/public/quantory-logo.png) */}
          <img src="/quantory-logo.png" alt="QUANTORY logo" className="brand-logo" />
          <h2>QUANTORY</h2>
          <span className="badge version">Web3 + AI</span>
        </div>
        <nav className="sidebar-nav">
          <span className="nav-group">Core Modules</span>
          {[
            { key: 'inventory', label: '📦 Inventory AI' },
            { key: 'chat', label: '🤖 AI Chat Agent' },
            { key: 'accounting', label: '💰 Accounting Web3' },
            { key: 'hr', label: '👥 HR & Shifts' },
            { key: 'crm', label: '📈 CRM Agent' },
            { key: 'pos', label: '🧾 PoS Terminal' },
          ].map(m => (
            <a key={m.key} href="#" className={activeModule === m.key ? 'active' : ''} onClick={e => { e.preventDefault(); setActiveModule(m.key); }}>
              {m.label}
              {(m.key === 'chat') && !isPremiumUnlocked && <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>🔒</span>}
            </a>
          ))}
          <span className="nav-group" style={{ marginTop: '1.5rem' }}>Premium Add-ons</span>
          {[
            { key: 'sales', label: '🔮 Predictive Sales' },
            { key: 'delivery', label: '🚚 Drone Delivery' },
          ].map(m => (
            <a key={m.key} href="#" className={activeModule === m.key ? 'active' : ''} onClick={e => { e.preventDefault(); setActiveModule(m.key); }}>
              {m.label}
              {!isPremiumUnlocked && <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>🔒</span>}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="wallet-btn" onClick={connectWallet} style={{ width: '100%' }}>
            {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : '🔗 Connect Wallet'}
          </button>
        </div>
      </aside>

      {/* Workspace */}
      <main className="erp-workspace">
        <header className="main-header">
          <div className="header-content">
            <h2>{MODULE_TITLES[activeModule]}</h2>
            <div className="user-profile">
              <div className="avatar">chef</div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>{walletAddress ? `${walletAddress.substring(0, 6)}...` : 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Stats Bar */}
        <div className="stats-bar">
          {[
            { num: Object.keys(inventory).length, label: 'Total Items', cls: '' },
            { num: lowStockCount, label: '🚨 Low Stock', cls: lowStockCount > 0 ? 'stat-warning' : '' },
            { num: expiryCount, label: '⏰ Expiring Soon', cls: expiryCount > 0 ? 'stat-danger' : '' },
            { num: `₹${totalCapital}`, label: '💰 Capital Value', cls: 'stat-success' },
            { num: STAFF.filter(s => s.status === 'active').length, label: '👥 Staff Active', cls: '' },
            { num: isPremiumUnlocked ? '✅ Active' : '🔒 Locked', label: 'Premium', cls: '' },
          ].map((s, i) => (
            <div key={i} className={`stat-card ${s.cls}`}>
              <span className="stat-number">{s.num}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="dashboard-container">

          {/* ========== INVENTORY MODULE ========== */}
          {activeModule === 'inventory' && (
            <div className="dashboard-grid">
              <div className="action-panel">
                <div className="glass-card insights-card">
                  <h2 style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    💡 Smart Business Insights
                    {!isPremiumUnlocked && <span style={{ fontSize: '0.8rem', color: '#fbbf24' }}>🔒</span>}
                  </h2>
                  {isPremiumUnlocked ? (
                    <ul className="insights-list">{generateInsights().map((ins, i) => <li key={i}>{ins}</li>)}</ul>
                  ) : (
                    <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.5)', borderRadius: '12px', textAlign: 'center' }}>
                      <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>AI analytics on your inventory — expiry, capital, and restock recommendations.</p>
                      <p style={{ color: 'var(--accent)' }}>Pay subscription below to unlock.</p>
                    </div>
                  )}
                </div>

                <div className="glass-card">
                  <div className="card-header-row">
                    <h2>➕ Add New Item</h2>
                    {isPremiumUnlocked ? (
                      <button type="button" onClick={startVoiceCommand} className={`voice-btn ${isListening ? 'listening' : ''}`}>
                        {isListening ? '🔴 Listening...' : '🎙️ Voice'}
                      </button>
                    ) : (
                      <button type="button" className="voice-btn" disabled style={{ opacity: 0.5 }}>🔒 Voice</button>
                    )}
                  </div>
                  <form onSubmit={handleAddItem} className="add-item-form">
                    <input type="text" placeholder="Item name (anything)" value={newItemName} onChange={e => setNewItemName(e.target.value)} required />
                    <div className="row">
                      <input type="number" placeholder="Stock quantity" value={newItemStock} onChange={e => setNewItemStock(e.target.value)} required />
                      <select value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)}>
                        <option value="units">Units</option><option value="kg">Kg</option>
                        <option value="liters">Liters</option><option value="packs">Packs</option>
                      </select>
                    </div>
                    <div className="row">
                      <select value={newItemStore} onChange={e => setNewItemStore(e.target.value)}>
                        <option value="Main Branch">Main Branch</option><option value="Downtown">Downtown</option>
                      </select>
                      <input type="date" title="Expiry Date" value={newItemExpiry} onChange={e => setNewItemExpiry(e.target.value)} />
                    </div>
                    <button type="submit" className="primary-btn">+ Add to Inventory</button>
                  </form>
                </div>

                <div className="glass-card premium-card">
                  <h2>🔐 AI Workspace Subscription</h2>
                  <div className="consult-box" style={{marginBottom:'1.5rem'}}>
                    <span>One-time Fee: <strong>0.0001 ETH</strong></span>
                    {isPremiumUnlocked ? <strong style={{ color: 'var(--success)' }}>✅ Subscribed</strong> :
                      <button onClick={payAgentForAnalysis} disabled={loading} className="pay-btn">{loading ? '⏳ Processing...' : '💳 Pay via Web3'}</button>}
                  </div>
                  <p style={{color:'var(--text-dim)', fontSize:'0.85rem', marginBottom:'1rem', textTransform:'uppercase', letterSpacing:'1px', fontWeight:700}}>
                    {isPremiumUnlocked ? '✅ Features Unlocked' : '🔒 Features Unlocked After Payment'}
                  </p>
                  <ul className="feature-unlock-list">
                    <li className={isPremiumUnlocked ? 'unlocked' : ''}>
                      <span className="feature-icon">💡</span>
                      <div><strong>Smart Business Insights</strong><span>AI analysis of capital, expiry risks & restock advice</span></div>
                    </li>
                    <li className={isPremiumUnlocked ? 'unlocked' : ''}>
                      <span className="feature-icon">🎙️</span>
                      <div><strong>Voice Commands</strong><span>Hands-free inventory management via microphone</span></div>
                    </li>
                    <li className={isPremiumUnlocked ? 'unlocked' : ''}>
                      <span className="feature-icon">🤖</span>
                      <div><strong>AI Chat Agent</strong><span>Ask questions about your live inventory data in natural language</span></div>
                    </li>
                    <li className={isPremiumUnlocked ? 'unlocked' : ''}>
                      <span className="feature-icon">🔮</span>
                      <div><strong>Predictive Sales AI</strong><span>7-day sales forecast & demand predictions</span></div>
                    </li>
                    <li className={isPremiumUnlocked ? 'unlocked' : ''}>
                      <span className="feature-icon">🚚</span>
                      <div><strong>Drone Delivery Tracker</strong><span>Real-time delivery status for restocking & orders</span></div>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="data-panel glass-card">
                <div className="inventory-header">
                  <h2>Live Multi-Store Monitor</h2>
                  <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} className="store-filter">
                    <option value="All">All Stores</option>
                    <option value="Main Branch">Main Branch</option>
                    <option value="Downtown">Downtown</option>
                  </select>
                </div>
                <div className="inventory-list">
                  {filteredInventory.length === 0 && <p className="loading-text">No items. Add one using the form!</p>}
                  {filteredInventory.map(([item, details]) => {
                    const isLow = details.stock < details.minimum_threshold;
                    const diffDays = details.expiry ? Math.ceil((new Date(details.expiry).getTime() - today.getTime()) / 86400000) : 999;
                    const isExpiring = diffDays > 0 && diffDays <= 7;
                    return (
                      <div key={item} className={`inventory-item ${isLow ? 'low-stock' : ''} ${isExpiring ? 'expiring-soon' : ''}`}>
                        <div className="item-info">
                          <span className="item-name">{item}<span className="sub-store"> ({details.store || 'Main Branch'})</span></span>
                          <div className="badges">
                            {isLow && <span className="badge warning">Low Stock</span>}
                            {isExpiring && <span className="badge danger">Exp: {details.expiry}</span>}
                          </div>
                        </div>
                        <div className="item-actions">
                          <button className="crud-btn" onClick={() => updateStock(item, details.stock, -1)}>−</button>
                          <span className="stock">{details.stock}<span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{details.unit.substring(0, 1)}</span></span>
                          <button className="crud-btn" onClick={() => updateStock(item, details.stock, 1)}>+</button>
                          <button className="del-btn" onClick={() => handleDeleteItem(item)}>🗑️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========== AI CHAT MODULE ========== */}
          {activeModule === 'chat' && (
            <div className="chat-module">
              {!isPremiumUnlocked ? (
                <div className="chat-locked">
                  <div className="lock-icon">🔒</div>
                  <h2>AI Chat Agent — Premium Feature</h2>
                  <p>Ask the AI agent about low stock, expiry risks, capital value, and restock recommendations using your live inventory data.</p>
                  <p className="locked-note">Pay <strong>0.0001 ETH</strong> to unlock all premium features including this chatbox.</p>
                  <button className="pay-btn" onClick={payAgentForAnalysis} disabled={loading} style={{ marginTop: '1rem', padding: '1rem 2rem' }}>
                    {loading ? 'Processing...' : '🔓 Pay & Unlock AI Agent'}
                  </button>
                </div>
              ) : (
                <div className="chat-container glass-card">
                  <div className="chat-messages">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`chat-bubble ${msg.from}`}>
                        {msg.from === 'ai' && <span className="bubble-icon">🤖</span>}
                        <span className="bubble-text" style={{ whiteSpace: 'pre-line' }}>{msg.text}</span>
                        {msg.from === 'user' && <span className="bubble-icon">👤</span>}
                      </div>
                    ))}
                    {chatLoading && <div className="chat-bubble ai"><span className="bubble-icon">🤖</span><span className="bubble-text typing">Analyzing</span></div>}
                  </div>
                  <div className="chat-input-row">
                    <div className="chat-suggestions">
                      {['Check low stock', 'Expiry risks?', 'Total capital value', 'How many items?'].map(s => (
                        <button key={s} className="suggestion-chip" onClick={() => setChatInput(s)}>{s}</button>
                      ))}
                    </div>
                    <div className="chat-input-bar">
                      <input type="text" className="chat-input" placeholder="Ask about stock, expiry, capital..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage()} />
                      <button className="chat-send-btn" onClick={sendChatMessage} disabled={chatLoading}>Send ➤</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== ACCOUNTING MODULE ========== */}
          {activeModule === 'accounting' && (
            <div className="module-grid">
              <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
                <h2>💳 Transaction Ledger</h2>
                <div className="table-wrap">
                  <table className="erp-table">
                    <thead><tr><th>TX Hash</th><th>Type</th><th>Description</th><th>Amount</th><th>Time</th><th>Status</th></tr></thead>
                    <tbody>
                      {TXNS.map((tx, i) => (
                        <tr key={i}>
                          <td style={{ color: 'var(--accent-secondary)', fontFamily: 'monospace' }}>{tx.id}</td>
                          <td><span className={`badge ${tx.type === 'Restock' ? 'warning' : 'success-badge'}`}>{tx.type}</span></td>
                          <td>{tx.desc}</td>
                          <td style={{ fontWeight: 700 }}>{tx.amount}</td>
                          <td style={{ color: 'var(--text-dim)' }}>{tx.time}</td>
                          <td><span className={`status-dot ${tx.status}`}>{tx.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="glass-card">
                <h2>📊 Revenue Summary</h2>
                <div className="kpi-grid">
                  <div className="kpi"><span className="kpi-val" style={{ color: 'var(--success)' }}>₹17,400</span><span className="kpi-label">Total Sales Today</span></div>
                  <div className="kpi"><span className="kpi-val" style={{ color: 'var(--danger)' }}>₹8,650</span><span className="kpi-label">Restock Costs</span></div>
                  <div className="kpi"><span className="kpi-val" style={{ color: 'var(--accent-secondary)' }}>₹8,750</span><span className="kpi-label">Net Profit</span></div>
                  <div className="kpi"><span className="kpi-val">0.0002 ETH</span><span className="kpi-label">Web3 Payments</span></div>
                </div>
              </div>
              <div className="glass-card">
                <h2>🔗 Web3 Wallet Status</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="info-row"><span>Connected Wallet:</span><span style={{ color: 'var(--accent-secondary)', fontFamily: 'monospace' }}>{walletAddress ? `${walletAddress.substring(0, 14)}...` : 'Not Connected'}</span></div>
                  <div className="info-row"><span>Network:</span><span style={{ color: 'var(--success)' }}>Ethereum Testnet</span></div>
                  <div className="info-row"><span>Contract:</span><span style={{ color: 'var(--accent-secondary)', fontFamily: 'monospace' }}>RestaurantPayments.sol</span></div>
                  <div className="info-row"><span>Premium Status:</span><span style={{ color: isPremiumUnlocked ? 'var(--success)' : 'var(--warning)' }}>{isPremiumUnlocked ? '✅ Subscribed' : '🔒 Locked'}</span></div>
                  {!walletAddress && <button className="pay-btn" onClick={connectWallet} style={{ marginTop: '1rem' }}>Connect MetaMask</button>}
                </div>
              </div>
            </div>
          )}

          {/* ========== HR MODULE ========== */}
          {activeModule === 'hr' && (
            <div className="module-grid">
              <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
                <h2>👥 Staff & Shift Overview</h2>
                <div className="table-wrap">
                  <table className="erp-table">
                    <thead><tr><th>Name</th><th>Role</th><th>Store</th><th>Shift</th><th>Status</th></tr></thead>
                    <tbody>
                      {STAFF.map((s, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td style={{ color: 'var(--accent-secondary)' }}>{s.role}</td>
                          <td>{s.store}</td>
                          <td style={{ fontFamily: 'monospace' }}>{s.shift}</td>
                          <td><span className={`status-dot ${s.status}`}>{s.status === 'active' ? '🟢 Active' : '🔴 Off Duty'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="glass-card">
                <h2>📅 Today's Roster</h2>
                <div className="kpi-grid">
                  <div className="kpi"><span className="kpi-val" style={{ color: 'var(--success)' }}>{STAFF.filter(s => s.status === 'active').length}</span><span className="kpi-label">On Duty</span></div>
                  <div className="kpi"><span className="kpi-val" style={{ color: 'var(--danger)' }}>{STAFF.filter(s => s.status !== 'active').length}</span><span className="kpi-label">Off Duty</span></div>
                  <div className="kpi"><span className="kpi-val">{STAFF.length}</span><span className="kpi-label">Total Staff</span></div>
                  <div className="kpi"><span className="kpi-val">2</span><span className="kpi-label">Stores Open</span></div>
                </div>
              </div>
              <div className="glass-card">
                <h2>🏆 Roles Breakdown</h2>
                <ul className="insights-list">
                  {['Head Chef', 'Sous Chef', 'Cashier', 'Waiter', 'Inventory Manager'].map(role => (
                    <li key={role} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{role}</span>
                      <span style={{ color: 'var(--accent-secondary)' }}>{STAFF.filter(s => s.role === role).length} staff</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ========== CRM MODULE ========== */}
          {activeModule === 'crm' && (
            <div className="module-grid">
              <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
                <h2>🎯 Customer Intelligence</h2>
                <div className="table-wrap">
                  <table className="erp-table">
                    <thead><tr><th>Customer</th><th>Total Orders</th><th>Total Spent</th><th>Last Order</th><th>Tier</th></tr></thead>
                    <tbody>
                      {CUSTOMERS.map((c, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{c.name}</td>
                          <td>{c.orders}</td>
                          <td style={{ color: 'var(--success)', fontWeight: 700 }}>₹{c.spent.toLocaleString()}</td>
                          <td style={{ color: 'var(--text-dim)' }}>{c.lastOrder}</td>
                          <td><span className={`badge ${c.status === 'VIP' ? 'danger' : 'warning'}`}>{c.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="glass-card">
                <h2>📊 Customer Stats</h2>
                <div className="kpi-grid">
                  <div className="kpi"><span className="kpi-val">{CUSTOMERS.length}</span><span className="kpi-label">Total Customers</span></div>
                  <div className="kpi"><span className="kpi-val" style={{ color: '#fbbf24' }}>{CUSTOMERS.filter(c => c.status === 'VIP').length}</span><span className="kpi-label">VIP Members</span></div>
                  <div className="kpi"><span className="kpi-val" style={{ color: 'var(--success)' }}>₹{CUSTOMERS.reduce((a, c) => a + c.spent, 0).toLocaleString()}</span><span className="kpi-label">Lifetime Revenue</span></div>
                  <div className="kpi"><span className="kpi-val">₹{Math.round(CUSTOMERS.reduce((a, c) => a + c.spent, 0) / CUSTOMERS.reduce((a, c) => a + c.orders, 0))}</span><span className="kpi-label">Avg Order Value</span></div>
                </div>
              </div>
              <div className="glass-card">
                <h2>🤖 AI Recommendations</h2>
                <ul className="insights-list">
                  <li>📣 Send loyalty rewards to <strong>Vikram Bhatt</strong> (55 orders, highest spend).</li>
                  <li>💌 Re-engage <strong>Divya Nair</strong> who hasn't ordered in 4 days.</li>
                  <li>🎁 Offer VIP discount to top 3 customers to boost retention by 23%.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ========== POS MODULE ========== */}
          {activeModule === 'pos' && (
            <div className="dashboard-grid">
              <div className="action-panel">
                <div className="glass-card">
                  <h2>🧾 New Order</h2>
                  {posSuccess && <div style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid var(--success)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', color: 'var(--success)' }}>{posSuccess}</div>}
                  <div className="pos-item-list">
                    {MENU_ITEMS.map(m => (
                      <div key={m.name} className="pos-item">
                        <div>
                          <div style={{ fontWeight: 600 }}>{m.name}</div>
                          <div style={{ color: 'var(--success)', fontSize: '0.9rem' }}>₹{m.price}</div>
                        </div>
                        <div className="item-actions">
                          <button className="crud-btn" onClick={() => addToPos(m.name, -1)}>−</button>
                          <span className="stock">{posOrder[m.name] || 0}</span>
                          <button className="crud-btn" onClick={() => addToPos(m.name, 1)}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="data-panel glass-card">
                <h2>🧮 Order Summary</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                  {Object.keys(posOrder).length === 0 ? (
                    <p className="loading-text">Add items from the menu to begin an order.</p>
                  ) : (
                    Object.entries(posOrder).map(([name, qty]) => {
                      const item = MENU_ITEMS.find(m => m.name === name);
                      return (
                        <div key={name} className="info-row">
                          <span>{name} × {qty}</span>
                          <span style={{ fontWeight: 700, color: 'var(--success)' }}>₹{(item?.price || 0) * qty}</span>
                        </div>
                      );
                    })
                  )}
                  <div style={{ marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                    <div className="info-row" style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                      <span>Total</span><span style={{ color: 'var(--success)' }}>₹{posTotal}</span>
                    </div>
                    <button className="primary-btn" style={{ marginTop: '1rem' }} onClick={checkoutPos}>
                      ✅ Checkout & Deduct Stock
                    </button>
                    <button onClick={() => setPosOrder({})} style={{ background: 'transparent', color: 'var(--danger)', marginTop: '0.5rem', width: '100%', padding: '0.8rem' }}>
                      🗑️ Clear Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== PREDICTIVE SALES (PREMIUM) ========== */}
          {activeModule === 'sales' && (
            <div>
              {!isPremiumUnlocked ? (
                <div className="chat-locked">
                  <div className="lock-icon">🔮</div>
                  <h2>Predictive Sales AI — Premium</h2>
                  <p>AI-generated sales forecasts based on your inventory usage patterns and customer order history.</p>
                  <p className="locked-note">Pay <strong>0.0001 ETH</strong> to unlock all premium modules.</p>
                  <button className="pay-btn" onClick={payAgentForAnalysis} disabled={loading} style={{ marginTop: '1rem', padding: '1rem 2rem' }}>{loading ? 'Processing...' : '🔓 Unlock Premium'}</button>
                </div>
              ) : (
                <div className="module-grid">
                  <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
                    <h2>🔮 7-Day Sales Forecast</h2>
                    <div className="forecast-chart">
                      {[{ day: 'Mon', val: 65 }, { day: 'Tue', val: 82 }, { day: 'Wed', val: 71 }, { day: 'Thu', val: 90 }, { day: 'Fri', val: 95 }, { day: 'Sat', val: 100 }, { day: 'Sun', val: 88 }].map(d => (
                        <div key={d.day} className="bar-col">
                          <span className="bar-val">₹{Math.round(d.val * 170)}</span>
                          <div className="bar" style={{ height: `${d.val}%` }}></div>
                          <span className="bar-day">{d.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="glass-card">
                    <h2>📈 Top Predicted Sellers</h2>
                    <ul className="insights-list">
                      <li>🥩 <strong>Wagyu Steak</strong> — ↑ 32% demand spike (Weekend)</li>
                      <li>🍚 <strong>Saffron Biryani</strong> — Steady ₹4,800/day</li>
                      <li>🫧 <strong>Mango Lassi</strong> — ↑ 18% (Hot weather forecast)</li>
                    </ul>
                  </div>
                  <div className="glass-card">
                    <h2>⚠️ Restock Recommendations</h2>
                    <ul className="insights-list">
                      {Object.entries(inventory).filter(([_, d]) => d.stock < d.minimum_threshold).map(([name, d]) => (
                        <li key={name}>🚨 <strong>{name}</strong> — Only {d.stock} {d.unit} left. Order {d.minimum_threshold * 2}.</li>
                      ))}
                      {Object.values(inventory).every(d => d.stock >= d.minimum_threshold) && <li>✅ All stock levels sufficient for projected demand!</li>}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== DRONE DELIVERY (PREMIUM) ========== */}
          {activeModule === 'delivery' && (
            <div>
              {!isPremiumUnlocked ? (
                <div className="chat-locked">
                  <div className="lock-icon">🚚</div>
                  <h2>Drone Delivery Tracker — Premium</h2>
                  <p>Real-time drone delivery tracking for restocking and customer deliveries across your branches.</p>
                  <p className="locked-note">Unlock with <strong>0.0001 ETH</strong> payment.</p>
                  <button className="pay-btn" onClick={payAgentForAnalysis} disabled={loading} style={{ marginTop: '1rem', padding: '1rem 2rem' }}>{loading ? 'Processing...' : '🔓 Unlock Premium'}</button>
                </div>
              ) : (
                <div className="module-grid">
                  {DELIVERIES.map((d, i) => (
                    <div key={i} className="glass-card">
                      <h2 style={{ fontSize: '1.1rem' }}>{d.id} — {d.drone}</h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                        <div className="info-row"><span>📦 Item:</span><span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{d.item}</span></div>
                        <div className="info-row"><span>📍 Distance:</span><span>{d.dist}</span></div>
                        <div className="info-row"><span>⏱️ ETA:</span><span style={{ color: 'var(--accent-secondary)' }}>{d.eta}</span></div>
                        <div className="info-row"><span>Status:</span>
                          <span className={`status-dot ${d.status === 'Delivered' ? 'active' : d.status === 'In Transit' ? 'transit' : ''}`}>
                            {d.status === 'Delivered' ? '✅' : d.status === 'In Transit' ? '🚁' : '⏳'} {d.status}
                          </span>
                        </div>
                        <div className="drone-progress">
                          <div className="drone-bar" style={{ width: d.status === 'Delivered' ? '100%' : d.status === 'In Transit' ? '60%' : '10%' }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="main-footer">
          <div className="footer-content">
            <p>© 2026 Omniscience AI ERP — Built on Web3. Replacing legacy restaurant software.</p>
            <div className="footer-links">
              <a href="#">Smart Contract</a><a href="#">AI Logs</a><a href="#">Docs</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
