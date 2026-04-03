
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  void: "#03040A",
  deep: "#080D1A",
  panel: "#0D1428",
  panelBorder: "#1A2540",
  gold: "#C9A84C",
  goldLight: "#F0CC7A",
  goldDim: "#8A6F2E",
  cyan: "#00D4FF",
  cyanDim: "#0097B8",
  green: "#00FF88",
  greenDim: "#00A855",
  red: "#FF3D6A",
  redDim: "#A8001F",
  purple: "#9B5DE5",
  text: "#E8EAF0",
  textDim: "#6B7A99",
  textMid: "#9AA3BC",
};

const PHASES = [
  { id: 1, label: "The Seed", icon: "🌱", subtitle: "Youth & Habits", color: C.green },
  { id: 2, label: "The Engine", icon: "⚙️", subtitle: "System Mastery", color: C.cyan },
  { id: 3, label: "The Horizon", icon: "🌐", subtitle: "Market Mechanics", color: C.purple },
  { id: 4, label: "The Legacy", icon: "👑", subtitle: "Family Office", color: C.gold },
];

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: ${C.void}; color: ${C.text}; font-family: 'Inter', sans-serif; overflow: hidden; height: 100%; }
    ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${C.deep}; } ::-webkit-scrollbar-thumb { background: ${C.goldDim}; border-radius: 2px; }
    .cinzel { font-family: 'Cinzel', serif; }
    .mono { font-family: 'Space Mono', monospace; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes spin { to{transform:rotate(360deg)} }
    @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes glow { 0%,100%{box-shadow:0 0 8px rgba(201,168,76,.3)} 50%{box-shadow:0 0 24px rgba(201,168,76,.7)} }
    .fade-in { animation: fadeIn .4s ease forwards; }
    .glow-gold { animation: glow 2.5s ease infinite; }
    button { cursor: pointer; border: none; background: none; font-family: inherit; }
    input, select, textarea { font-family: 'Space Mono', monospace; background: ${C.deep}; color: ${C.text}; border: 1px solid ${C.panelBorder}; border-radius: 6px; padding: 8px 12px; font-size: 13px; outline: none; transition: border-color .2s; }
    input:focus, select:focus { border-color: ${C.goldDim}; }
    input[type=range] { appearance: none; background: ${C.panelBorder}; height: 4px; border: none; padding: 0; border-radius: 2px; }
    input[type=range]::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; border-radius: 50%; background: ${C.gold}; cursor: pointer; }
  `}</style>
);

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────────
const fmt = (n, dec = 0) => new Intl.NumberFormat("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
const fmtUSD = (n) => "$" + fmt(Math.abs(n), n % 1 !== 0 ? 2 : 0);
const fmtPct = (n, dec = 1) => (n * 100).toFixed(dec) + "%";
const lerp = (a, b, t) => a + (b - a) * t;

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const Panel = ({ children, style, className = "" }) => (
  <div className={`fade-in ${className}`} style={{
    background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: 12,
    padding: 20, ...style
  }}>{children}</div>
);

const PanelTitle = ({ children, icon, accent = C.gold }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
    {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
    <h3 className="cinzel" style={{ fontSize: 13, letterSpacing: 2, color: accent, textTransform: "uppercase" }}>{children}</h3>
  </div>
);

const StatCard = ({ label, value, sub, color = C.gold, icon }) => (
  <div style={{ background: C.deep, border: `1px solid ${C.panelBorder}`, borderRadius: 10, padding: "14px 16px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <span style={{ fontSize: 11, color: C.textDim, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'Space Mono'" }}>{label}</span>
      {icon && <span>{icon}</span>}
    </div>
    <div className="mono" style={{ fontSize: 22, color, fontWeight: 700, marginTop: 6 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", size = "md", style: s }) => {
  const base = { fontFamily: "'Cinzel',serif", letterSpacing: 1.5, borderRadius: 8, cursor: "pointer", border: "none", transition: "all .2s", textTransform: "uppercase" };
  const sizes = { sm: { fontSize: 10, padding: "7px 14px" }, md: { fontSize: 11, padding: "10px 20px" }, lg: { fontSize: 12, padding: "13px 28px" } };
  const vars = {
    primary: { background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`, color: C.void, fontWeight: 700 },
    outline: { background: "transparent", border: `1px solid ${C.goldDim}`, color: C.gold },
    ghost: { background: "transparent", color: C.textMid },
    danger: { background: `linear-gradient(135deg, ${C.red}, ${C.redDim})`, color: "#fff", fontWeight: 700 },
    success: { background: `linear-gradient(135deg, ${C.green}, ${C.greenDim})`, color: C.void, fontWeight: 700 },
    cyan: { background: `linear-gradient(135deg, ${C.cyan}, ${C.cyanDim})`, color: C.void, fontWeight: 700 },
  };
  return <button onClick={onClick} style={{ ...base, ...sizes[size], ...vars[variant], ...s }}>{children}</button>;
};

const ProgressBar = ({ value, max, color = C.gold, height = 6 }) => (
  <div style={{ background: C.panelBorder, borderRadius: 99, height, overflow: "hidden" }}>
    <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: "100%", background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 99, transition: "width .5s ease" }} />
  </div>
);

// ─── PHASE 1: THE SEED ────────────────────────────────────────────────────────
const CHORE_LIST = [
  { name: "Wash Dishes", reward: 5 },
  { name: "Mow Lawn", reward: 20 },
  { name: "Clean Bedroom", reward: 8 },
  { name: "Help with Groceries", reward: 10 },
  { name: "Study Session (1hr)", reward: 15 },
  { name: "Walk the Dog", reward: 7 },
];

const SPEND_CATEGORIES = [
  { raw: "McDonald's", label: "Fast Food", type: "Liability", icon: "🍔", color: C.red },
  { raw: "Starbucks", label: "Coffee", type: "Liability", icon: "☕", color: C.red },
  { raw: "Gym", label: "Health", type: "Asset", icon: "💪", color: C.green },
  { raw: "Books", label: "Education", type: "Asset", icon: "📚", color: C.green },
  { raw: "Gaming", label: "Entertainment", type: "Liability", icon: "🎮", color: C.red },
  { raw: "Groceries", label: "Nutrition", type: "Asset", icon: "🥦", color: C.green },
  { raw: "Uber Eats", label: "Food Delivery", type: "Liability", icon: "📱", color: C.red },
  { raw: "Course / Class", label: "Skill-Building", type: "Asset", icon: "🎓", color: C.green },
];

function PhaseSeed() {
  const [balance, setBalance] = useState(250);
  const [deposits, setDeposits] = useState([
    { id: 1, date: "Mar 28", desc: "Birthday Gift", amount: 50, type: "deposit" },
    { id: 2, date: "Mar 30", desc: "Chore: Mow Lawn", amount: 20, type: "deposit" },
  ]);
  const [expenses, setExpenses] = useState([
    { id: 1, date: "Apr 1", desc: "McDonald's", amount: 12, category: SPEND_CATEGORIES[0] },
    { id: 2, date: "Apr 2", desc: "Books", amount: 18, category: SPEND_CATEGORIES[3] },
  ]);
  const [interest, setInterest] = useState(3.5);
  const [tab, setTab] = useState("ledger");
  const [newExpense, setNewExpense] = useState({ desc: "", amount: "" });

  const addChore = (chore) => {
    const entry = { id: Date.now(), date: "Today", desc: `Chore: ${chore.name}`, amount: chore.reward, type: "deposit" };
    setDeposits(d => [entry, ...d]);
    setBalance(b => b + chore.reward);
  };

  const categorizeExpense = (desc) => {
    const lower = desc.toLowerCase();
    return SPEND_CATEGORIES.find(c => lower.includes(c.raw.toLowerCase())) ||
      { raw: desc, label: "Uncategorized", type: "Neutral", icon: "💸", color: C.textMid };
  };

  const addExpense = () => {
    if (!newExpense.desc || !newExpense.amount) return;
    const amt = parseFloat(newExpense.amount);
    const cat = categorizeExpense(newExpense.desc);
    const entry = { id: Date.now(), date: "Today", desc: newExpense.desc, amount: amt, category: cat };
    setExpenses(e => [entry, ...e]);
    setBalance(b => b - amt);
    setNewExpense({ desc: "", amount: "" });
  };

  const monthlyInterest = (balance * interest / 100) / 12;
  const assetTotal = expenses.filter(e => e.category.type === "Asset").reduce((s, e) => s + e.amount, 0);
  const liabTotal = expenses.filter(e => e.category.type === "Liability").reduce((s, e) => s + e.amount, 0);

  // Compound interest projection
  const projection = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    value: balance * Math.pow(1 + interest / 100 / 12, i + 1)
  }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Left column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Panel>
          <PanelTitle icon="🌱" accent={C.green}>Shadow Ledger</PanelTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            <StatCard label="Balance" value={fmtUSD(balance)} color={C.green} icon="💰" />
            <StatCard label="Monthly Interest" value={fmtUSD(monthlyInterest)} sub={`${interest}% APY`} color={C.cyan} icon="📈" />
            <StatCard label="Annual Yield" value={fmtUSD(balance * interest / 100)} color={C.goldLight} icon="✨" />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span className="mono" style={{ fontSize: 11, color: C.textDim }}>INTEREST RATE: {interest}% APY</span>
              <span className="mono" style={{ fontSize: 11, color: C.gold }}>{interest}%</span>
            </div>
            <input type="range" min="0.5" max="8" step="0.5" value={interest}
              onChange={e => setInterest(parseFloat(e.target.value))} style={{ width: "100%" }} />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 14, background: C.deep, borderRadius: 8, padding: 4 }}>
            {["ledger", "chores"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: "7px", borderRadius: 6, fontSize: 11, fontFamily: "'Cinzel'", letterSpacing: 1,
                textTransform: "uppercase", border: "none", cursor: "pointer", transition: "all .2s",
                background: tab === t ? C.gold : "transparent", color: tab === t ? C.void : C.textDim, fontWeight: tab === t ? 700 : 400
              }}>{t}</button>
            ))}
          </div>

          {tab === "ledger" && (
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {deposits.map(d => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.panelBorder}` }}>
                  <div>
                    <div style={{ fontSize: 13 }}>{d.desc}</div>
                    <div className="mono" style={{ fontSize: 10, color: C.textDim }}>{d.date}</div>
                  </div>
                  <span className="mono" style={{ color: C.green, fontWeight: 700 }}>+{fmtUSD(d.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {tab === "chores" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {CHORE_LIST.map(c => (
                <button key={c.name} onClick={() => addChore(c)} style={{
                  background: C.deep, border: `1px solid ${C.panelBorder}`, borderRadius: 8, padding: "10px 12px",
                  textAlign: "left", cursor: "pointer", transition: "all .2s"
                }}>
                  <div style={{ fontSize: 12, color: C.text }}>{c.name}</div>
                  <div className="mono" style={{ fontSize: 13, color: C.green, fontWeight: 700, marginTop: 4 }}>+{fmtUSD(c.reward)}</div>
                </button>
              ))}
            </div>
          )}
        </Panel>

        {/* Growth Projection */}
        <Panel>
          <PanelTitle icon="📈" accent={C.cyan}>12-Month Growth Projection</PanelTitle>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80 }}>
            {projection.map((p, i) => {
              const maxVal = projection[projection.length - 1].value;
              const h = (p.value / maxVal) * 72;
              return (
                <div key={i} title={fmtUSD(p.value)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ width: "100%", height: h, background: `linear-gradient(180deg, ${C.cyan}, ${C.cyanDim}44)`, borderRadius: "2px 2px 0 0", transition: "height .5s" }} />
                  {i % 3 === 0 && <span className="mono" style={{ fontSize: 8, color: C.textDim }}>M{p.month}</span>}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            <span className="mono" style={{ fontSize: 11, color: C.textDim }}>Start: {fmtUSD(balance)}</span>
            <span className="mono" style={{ fontSize: 11, color: C.cyan }}>End: {fmtUSD(projection[11].value)}</span>
          </div>
        </Panel>
      </div>

      {/* Right column: Leak Detector */}
      <Panel>
        <PanelTitle icon="🔍" accent={C.red}>Leak Detector — AI Categorizer</PanelTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <StatCard label="Assets Spent" value={fmtUSD(assetTotal)} color={C.green} icon="✅" />
          <StatCard label="Liabilities Spent" value={fmtUSD(liabTotal)} color={C.red} icon="⚠️" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 6, fontSize: 11, color: C.textDim }}>ASSET RATIO</div>
          <ProgressBar value={assetTotal} max={assetTotal + liabTotal || 1} color={C.green} height={8} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span className="mono" style={{ fontSize: 10, color: C.green }}>Assets {fmtPct(assetTotal / (assetTotal + liabTotal || 1))}</span>
            <span className="mono" style={{ fontSize: 10, color: C.red }}>Liabilities {fmtPct(liabTotal / (assetTotal + liabTotal || 1))}</span>
          </div>
        </div>

        {/* Add expense */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input placeholder="What did you buy? (e.g. Starbucks)" value={newExpense.desc}
            onChange={e => setNewExpense(x => ({ ...x, desc: e.target.value }))}
            style={{ flex: 2, fontSize: 12 }} />
          <input placeholder="$" type="number" value={newExpense.amount}
            onChange={e => setNewExpense(x => ({ ...x, amount: e.target.value }))}
            style={{ flex: 1, fontSize: 12 }} />
          <Btn onClick={addExpense} size="sm" variant="outline">Log</Btn>
        </div>

        <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {expenses.map(e => (
            <div key={e.id} style={{
              background: C.deep, border: `1px solid ${e.category.type === "Asset" ? C.green + "44" : e.category.type === "Liability" ? C.red + "44" : C.panelBorder}`,
              borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{e.category.icon}</span>
                <div>
                  <div style={{ fontSize: 13 }}>{e.desc}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: e.category.color, background: e.category.color + "22", padding: "2px 7px", borderRadius: 99, fontFamily: "'Space Mono'" }}>{e.category.label}</span>
                    <span style={{ fontSize: 10, color: e.category.type === "Asset" ? C.green : e.category.type === "Liability" ? C.red : C.textDim, background: "transparent" }}>
                      {e.category.type}
                    </span>
                  </div>
                </div>
              </div>
              <span className="mono" style={{ color: e.category.type === "Asset" ? C.green : C.red, fontWeight: 700 }}>-{fmtUSD(e.amount)}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ─── PHASE 2: THE ENGINE ──────────────────────────────────────────────────────
function TaxLab() {
  const [incomeType, setIncomeType] = useState("salary");
  const [income, setIncome] = useState(50000);
  const [filingStatus, setFilingStatus] = useState("single");

  const calcTax = (amount, type, status) => {
    const brackets = {
      salary: {
        single: [[0, 11600, 0.10], [11600, 47150, 0.12], [47150, 100525, 0.22], [100525, 191950, 0.24], [191950, 243725, 0.32], [243725, 609350, 0.35], [609350, Infinity, 0.37]],
        married: [[0, 23200, 0.10], [23200, 94300, 0.12], [94300, 201050, 0.22], [201050, 383900, 0.24], [383900, 487450, 0.32], [487450, 731200, 0.35], [731200, Infinity, 0.37]],
      },
      capital_gains: {
        single: [[0, 47025, 0.00], [47025, 518900, 0.15], [518900, Infinity, 0.20]],
        married: [[0, 94050, 0.00], [94050, 583750, 0.15], [583750, Infinity, 0.20]],
      },
    };
    const br = brackets[type][status] || brackets[type].single;
    let tax = 0;
    let remaining = amount;
    const detail = [];
    for (const [low, high, rate] of br) {
      if (remaining <= 0) break;
      const taxable = Math.min(remaining, high - low);
      const t = taxable * rate;
      if (taxable > 0) detail.push({ rate, taxable, tax: t });
      tax += t;
      remaining -= taxable;
    }
    return { tax, detail, effectiveRate: tax / amount, takeHome: amount - tax };
  };

  const res = calcTax(income, incomeType, filingStatus);
  const altType = incomeType === "salary" ? "capital_gains" : "salary";
  const alt = calcTax(income, altType, filingStatus);
  const saving = Math.abs(res.tax - alt.tax);

  const typeNames = { salary: "W2 Salary", capital_gains: "Capital Gains" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <Panel>
        <PanelTitle icon="🧪" accent={C.cyan}>Tax Lab — What-If Calculator</PanelTitle>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["salary", "capital_gains"].map(t => (
              <button key={t} onClick={() => setIncomeType(t)} style={{
                flex: 1, padding: "10px", borderRadius: 8, fontSize: 11, fontFamily: "'Cinzel'", letterSpacing: 1,
                textTransform: "uppercase", border: `1px solid ${incomeType === t ? C.cyan : C.panelBorder}`,
                cursor: "pointer", background: incomeType === t ? C.cyan + "22" : "transparent",
                color: incomeType === t ? C.cyan : C.textDim, transition: "all .2s"
              }}>{t === "salary" ? "W2 Salary" : "Capital Gains"}</button>
            ))}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span className="mono" style={{ fontSize: 11, color: C.textDim }}>INCOME</span>
              <span className="mono" style={{ fontSize: 13, color: C.gold }}>{fmtUSD(income)}</span>
            </div>
            <input type="range" min="10000" max="500000" step="5000" value={income}
              onChange={e => setIncome(parseInt(e.target.value))} style={{ width: "100%" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span className="mono" style={{ fontSize: 9, color: C.textDim }}>$10K</span>
              <span className="mono" style={{ fontSize: 9, color: C.textDim }}>$500K</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {["single", "married"].map(s => (
              <button key={s} onClick={() => setFilingStatus(s)} style={{
                flex: 1, padding: "8px", borderRadius: 6, fontSize: 11, fontFamily: "'Space Mono'",
                border: `1px solid ${filingStatus === s ? C.goldDim : C.panelBorder}`,
                cursor: "pointer", background: filingStatus === s ? C.gold + "22" : "transparent",
                color: filingStatus === s ? C.gold : C.textDim, transition: "all .2s", textTransform: "capitalize"
              }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <StatCard label="Gross Income" value={fmtUSD(income)} color={C.text} />
          <StatCard label="Tax Owed" value={fmtUSD(res.tax)} color={C.red} />
          <StatCard label="Take-Home" value={fmtUSD(res.takeHome)} color={C.green} />
          <StatCard label="Effective Rate" value={fmtPct(res.effectiveRate)} color={C.cyan} />
        </div>

        {/* Tax brackets visualization */}
        <div>
          <div className="mono" style={{ fontSize: 10, color: C.textDim, marginBottom: 10, letterSpacing: 1 }}>TAX BRACKET BREAKDOWN</div>
          {res.detail.map((d, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span className="mono" style={{ fontSize: 11, color: C.textMid }}>{(d.rate * 100).toFixed(0)}% bracket</span>
                <span className="mono" style={{ fontSize: 11, color: C.red }}>{fmtUSD(d.tax)}</span>
              </div>
              <ProgressBar value={d.taxable} max={income} color={`hsl(${200 - d.rate * 400}, 80%, 60%)`} height={5} />
            </div>
          ))}
        </div>
      </Panel>

      {/* Comparison Panel */}
      <Panel>
        <PanelTitle icon="⚖️" accent={C.gold}>Income Type Comparison</PanelTitle>

        {/* Side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[{ type: incomeType, data: res }, { type: altType, data: alt }].map(({ type, data }) => (
            <div key={type} style={{ background: C.deep, borderRadius: 10, padding: 16, border: `1px solid ${type === incomeType ? C.cyan + "66" : C.panelBorder}` }}>
              <div className="cinzel" style={{ fontSize: 10, letterSpacing: 2, color: type === incomeType ? C.cyan : C.textDim, marginBottom: 12, textTransform: "uppercase" }}>{typeNames[type]}</div>
              <div className="mono" style={{ fontSize: 20, color: C.green, fontWeight: 700 }}>{fmtUSD(data.takeHome)}</div>
              <div className="mono" style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>take-home</div>
              <div style={{ height: 1, background: C.panelBorder, margin: "12px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="mono" style={{ fontSize: 10, color: C.textDim }}>Tax</span>
                <span className="mono" style={{ fontSize: 10, color: C.red }}>{fmtUSD(data.tax)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span className="mono" style={{ fontSize: 10, color: C.textDim }}>Rate</span>
                <span className="mono" style={{ fontSize: 10, color: C.cyan }}>{fmtPct(data.effectiveRate)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Savings call-out */}
        <div style={{ background: saving > 0 ? C.green + "11" : C.red + "11", border: `1px solid ${saving > 0 ? C.green + "44" : C.red + "44"}`, borderRadius: 10, padding: 16, marginBottom: 20, textAlign: "center" }}>
          <div className="cinzel" style={{ fontSize: 10, letterSpacing: 2, color: C.textDim, marginBottom: 6, textTransform: "uppercase" }}>
            {incomeType === "capital_gains" ? "You Save vs W2 Salary" : "W2 Costs You Extra"}
          </div>
          <div className="mono" style={{ fontSize: 28, color: saving > 0 && incomeType === "capital_gains" ? C.green : C.red, fontWeight: 700 }}>{fmtUSD(saving)}</div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>
            {incomeType === "capital_gains" ? "Capital gains treatment saves you this much annually" : "Switch to capital gains income to save this amount"}
          </div>
        </div>

        {/* Visual comparison bars */}
        <div>
          <div className="mono" style={{ fontSize: 10, color: C.textDim, marginBottom: 10, letterSpacing: 1 }}>VISUAL TAKE-HOME COMPARISON</div>
          {[{ type: incomeType, data: res }, { type: altType, data: alt }].map(({ type, data }) => (
            <div key={type} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: C.textMid }}>{typeNames[type]}</span>
                <span className="mono" style={{ fontSize: 11, color: C.green }}>{fmtUSD(data.takeHome)}</span>
              </div>
              <ProgressBar value={data.takeHome} max={income} color={type === incomeType ? C.cyan : C.goldDim} height={10} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function CreditArchitect() {
  const [loanAmount, setLoanAmount] = useState(300000);
  const [rate, setRate] = useState(7.0);
  const [missed, setMissed] = useState(0);
  const [creditScore, setCreditScore] = useState(780);

  const calcMortgage = (principal, annualRate, years = 30, missedPmts = 0) => {
    const r = annualRate / 100 / 12;
    const n = years * 12;
    const pmt = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const penalty = missedPmts * pmt * 0.05; // late fee ~5%
    const scorePenalty = missedPmts * 80;
    const rateIncrease = missedPmts > 0 ? missedPmts * 0.5 : 0; // future rate impact
    const totalCost = pmt * n + penalty;
    const totalInterest = totalCost - principal;
    return { pmt, totalCost, totalInterest, penalty, scorePenalty, rateIncrease };
  };

  const base = calcMortgage(loanAmount, rate, 30, 0);
  const current = calcMortgage(loanAmount, rate, 30, missed);
  const adjustedScore = Math.max(300, creditScore - current.scorePenalty);
  const extraCost = current.totalCost - base.totalCost;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <Panel>
        <PanelTitle icon="🏗️" accent={C.cyan}>Credit Architect</PanelTitle>
        <div style={{ marginBottom: 20 }}>
          {[
            { label: "Loan Amount", value: fmtUSD(loanAmount), min: 100000, max: 1000000, step: 10000, setter: setLoanAmount, display: fmtUSD },
            { label: "Interest Rate", value: `${rate}%`, min: 3, max: 15, step: 0.25, setter: setRate, isFloat: true, display: v => `${v}%` },
            { label: "Credit Score (Baseline)", value: creditScore, min: 580, max: 850, step: 10, setter: setCreditScore, display: v => v },
          ].map(({ label, value, min, max, step, setter, display, isFloat }) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span className="mono" style={{ fontSize: 11, color: C.textDim }}>{label.toUpperCase()}</span>
                <span className="mono" style={{ fontSize: 13, color: C.gold }}>{value}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={isFloat ? rate : (label.includes("Loan") ? loanAmount : creditScore)}
                onChange={e => setter(isFloat ? parseFloat(e.target.value) : parseInt(e.target.value))} style={{ width: "100%" }} />
            </div>
          ))}

          <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
            <span className="mono" style={{ fontSize: 11, color: C.textDim }}>MISSED PAYMENTS</span>
            <span className="mono" style={{ fontSize: 13, color: missed > 0 ? C.red : C.green }}>{missed}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1, 2, 3, 6, 12].map(n => (
              <button key={n} onClick={() => setMissed(n)} style={{
                flex: 1, padding: "8px 4px", borderRadius: 6, fontSize: 11, fontFamily: "'Space Mono'",
                border: `1px solid ${missed === n ? C.red : C.panelBorder}`,
                background: missed === n ? C.red + "22" : "transparent",
                color: missed === n ? C.red : C.textDim, cursor: "pointer", transition: "all .2s"
              }}>{n}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <StatCard label="Monthly Payment" value={fmtUSD(base.pmt)} color={C.cyan} />
          <StatCard label="30yr Total" value={fmtUSD(base.totalCost)} color={C.text} />
          <StatCard label="Total Interest" value={fmtUSD(base.totalInterest)} color={C.gold} />
          <StatCard label="Credit Score" value={adjustedScore} color={adjustedScore > 700 ? C.green : adjustedScore > 600 ? C.gold : C.red} />
        </div>
      </Panel>

      <Panel>
        <PanelTitle icon="💣" accent={C.red}>Missed Payment Impact</PanelTitle>
        {missed === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: C.textDim }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div className="cinzel" style={{ fontSize: 13, letterSpacing: 2 }}>PERFECT PAYMENT HISTORY</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>Simulate missed payments to see the true cost of credit.</div>
          </div>
        ) : (
          <>
            <div style={{ background: C.red + "11", border: `1px solid ${C.red}44`, borderRadius: 10, padding: 16, marginBottom: 16, textAlign: "center" }}>
              <div className="cinzel" style={{ fontSize: 10, color: C.textDim, letterSpacing: 2 }}>EXTRA LIFETIME COST</div>
              <div className="mono" style={{ fontSize: 32, color: C.red, fontWeight: 700, marginTop: 4 }}>+{fmtUSD(extraCost)}</div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>from {missed} missed payment{missed > 1 ? "s" : ""}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <StatCard label="Late Fees" value={fmtUSD(current.penalty)} color={C.red} icon="⚠️" />
              <StatCard label="Score Drop" value={`-${current.scorePenalty}`} color={C.red} icon="📉" />
              <StatCard label="Future Rate +" value={`+${current.rateIncrease.toFixed(1)}%`} color={C.gold} icon="📈" />
              <StatCard label="New Score Est." value={adjustedScore} color={adjustedScore > 700 ? C.green : C.red} icon="💳" />
            </div>

            {/* Score meter */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span className="mono" style={{ fontSize: 10, color: C.textDim }}>CREDIT SCORE TRAJECTORY</span>
              </div>
              <div style={{ background: C.deep, borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span className="mono" style={{ fontSize: 11, color: C.green }}>Before: {creditScore}</span>
                  <span className="mono" style={{ fontSize: 11, color: C.red }}>After: {adjustedScore}</span>
                </div>
                <div style={{ position: "relative", height: 20, background: `linear-gradient(90deg, ${C.red}, ${C.gold}, ${C.green})`, borderRadius: 4 }}>
                  {[creditScore, adjustedScore].map((score, i) => {
                    const pct = ((score - 300) / 550) * 100;
                    return (
                      <div key={i} style={{ position: "absolute", top: -4, left: `${pct}%`, transform: "translateX(-50%)", width: 12, height: 28, background: i === 0 ? C.green : C.red, borderRadius: 2, border: `2px solid ${C.void}` }} />
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span className="mono" style={{ fontSize: 9, color: C.textDim }}>300</span>
                  <span className="mono" style={{ fontSize: 9, color: C.textDim }}>580</span>
                  <span className="mono" style={{ fontSize: 9, color: C.textDim }}>670</span>
                  <span className="mono" style={{ fontSize: 9, color: C.textDim }}>740</span>
                  <span className="mono" style={{ fontSize: 9, color: C.textDim }}>850</span>
                </div>
              </div>
            </div>

            <div style={{ background: C.gold + "11", border: `1px solid ${C.gold}44`, borderRadius: 8, padding: 12, fontSize: 12, color: C.textMid, lineHeight: 1.6 }}>
              💡 A {missed}-payment delinquency can stay on your credit report for <strong style={{ color: C.gold }}>7 years</strong>, costing you an estimated <strong style={{ color: C.gold }}>{fmtUSD(extraCost)}</strong> over the life of this loan.
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}

function PhaseEngine() {
  const [sub, setSub] = useState("tax");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[{ id: "tax", label: "Tax Lab", icon: "🧪" }, { id: "credit", label: "Credit Architect", icon: "🏗️" }].map(s => (
          <button key={s.id} onClick={() => setSub(s.id)} style={{
            padding: "9px 20px", borderRadius: 8, fontSize: 11, fontFamily: "'Cinzel'", letterSpacing: 1.5,
            textTransform: "uppercase", border: `1px solid ${sub === s.id ? C.cyan : C.panelBorder}`,
            background: sub === s.id ? C.cyan + "22" : "transparent", color: sub === s.id ? C.cyan : C.textDim, cursor: "pointer", transition: "all .2s"
          }}>{s.icon} {s.label}</button>
        ))}
      </div>
      {sub === "tax" ? <TaxLab /> : <CreditArchitect />}
    </div>
  );
}

// ─── PHASE 3: 3D FOREST ───────────────────────────────────────────────────────
const PORTFOLIO_ASSETS = [
  { name: "Apple", symbol: "AAPL", value: 45000, change: 0.023, sigma: 0.18, type: "Tech", color: 0x00cc66 },
  { name: "Tesla", symbol: "TSLA", value: 22000, change: -0.041, sigma: 0.62, type: "EV", color: 0xff4466 },
  { name: "S&P ETF", symbol: "SPY", value: 80000, change: 0.008, sigma: 0.14, type: "Index", color: 0x00aaff },
  { name: "Gold ETF", symbol: "GLD", value: 35000, change: 0.011, sigma: 0.12, type: "Commodity", color: 0xffcc44 },
  { name: "Amazon", symbol: "AMZN", value: 38000, change: 0.019, sigma: 0.25, type: "Tech", color: 0xff8833 },
  { name: "T-Bonds", symbol: "TLT", value: 50000, change: -0.003, sigma: 0.08, type: "Bonds", color: 0x8844ff },
  { name: "NVIDIA", symbol: "NVDA", value: 60000, change: 0.051, sigma: 0.45, type: "Semiconductors", color: 0x55ff88 },
];

function ForestViz({ assets, crashed }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const treesRef = useRef([]);
  const frameRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dir = new THREE.DirectionalLight(0xffeedd, 1.2);
    dir.position.set(5, 10, 5);
    scene.add(dir);
    const point = new THREE.PointLight(0x4499ff, 0.8, 50);
    point.position.set(-5, 5, -5);
    scene.add(point);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
    camera.position.set(0, 8, 18);
    camera.lookAt(0, 0, 0);

    // Ground
    const groundGeo = new THREE.CircleGeometry(14, 64);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x0a1a0a });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    // Grid rings
    for (let r = 3; r <= 12; r += 3) {
      const ring = new THREE.RingGeometry(r, r + 0.04, 64);
      const rmat = new THREE.MeshBasicMaterial({ color: 0x1a3020, side: THREE.DoubleSide });
      const rm = new THREE.Mesh(ring, rmat);
      rm.rotation.x = -Math.PI / 2;
      scene.add(rm);
    }

    const total = assets.reduce((s, a) => s + a.value, 0);
    const trees = [];

    assets.forEach((asset, i) => {
      const angle = (i / assets.length) * Math.PI * 2;
      const radius = 5 + (asset.value / total) * 6;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const heightScale = crashed ? 0.2 : 0.4 + (asset.value / total) * 4;
      const trunkH = heightScale;
      const foliageR = 0.3 + (asset.value / total) * 2;

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.08, 0.12, trunkH, 8);
      const trunkMat = new THREE.MeshLambertMaterial({ color: crashed ? 0x331100 : 0x4a2e0e });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(x, trunkH / 2, z);

      // Foliage layers (stacked cones)
      const group = new THREE.Group();
      const baseColor = crashed ? 0x882222 : asset.color;
      const numLayers = 3;
      for (let l = 0; l < numLayers; l++) {
        const layerR = foliageR * (1 - l * 0.2);
        const layerH = foliageR * 1.2;
        const coneGeo = new THREE.ConeGeometry(layerR, layerH, 8);
        const coneMat = new THREE.MeshLambertMaterial({ color: baseColor });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.set(0, trunkH + l * (layerH * 0.6), 0);
        group.add(cone);
      }
      group.add(trunk);
      group.position.set(x, 0, z);
      scene.add(group);

      trees.push({ group, asset, baseAngle: angle, sigma: asset.sigma, crashed });
    });
    treesRef.current = trees;

    // Particles (floating leaves)
    const partGeo = new THREE.BufferGeometry();
    const count = 120;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 24;
    }
    partGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const partMat = new THREE.PointsMaterial({ color: 0x44ff88, size: 0.08, transparent: true, opacity: 0.6 });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    let t = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      t += 0.016;

      // Sway trees by volatility
      trees.forEach(({ group, sigma, crashed }) => {
        const swayAmt = crashed ? 0.4 : sigma * 0.15;
        const swaySpeed = crashed ? 8 : 1 + sigma * 3;
        group.rotation.z = Math.sin(t * swaySpeed) * swayAmt;
        group.rotation.x = Math.cos(t * swaySpeed * 0.7) * swayAmt * 0.5;
      });

      // Orbit camera slowly
      camera.position.x = Math.sin(t * 0.08) * 18;
      camera.position.z = Math.cos(t * 0.08) * 18;
      camera.lookAt(0, 2, 0);

      // Float particles
      const pos = partGeo.attributes.position.array;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] += 0.01 + Math.sin(t + i) * 0.002;
        if (pos[i * 3 + 1] > 10) pos[i * 3 + 1] = 0;
      }
      partGeo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [assets, crashed]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%", borderRadius: 12, overflow: "hidden" }} />;
}

function PhaseHorizon() {
  const [crashed, setCrashed] = useState(false);
  const [crashPct, setCrashPct] = useState(20);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const displayAssets = useMemo(() => crashed
    ? PORTFOLIO_ASSETS.map(a => ({ ...a, value: a.value * (1 - crashPct / 100), change: a.change - crashPct / 100 }))
    : PORTFOLIO_ASSETS
  , [crashed, crashPct]);

  const totalValue = displayAssets.reduce((s, a) => s + a.value, 0);
  const totalGain = PORTFOLIO_ASSETS.reduce((s, a) => s + a.value * a.change, 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16, height: "calc(100vh - 200px)", minHeight: 500 }}>
      {/* Left: Portfolio list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, overflow: "hidden" }}>
        <Panel style={{ flex: "none" }}>
          <PanelTitle icon="🌐" accent={C.purple}>Portfolio Forest</PanelTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <StatCard label="Total Value" value={fmtUSD(totalValue)} color={crashed ? C.red : C.green} />
            <StatCard label="Today P&L" value={(totalGain >= 0 ? "+" : "") + fmtUSD(totalGain)} color={totalGain >= 0 ? C.green : C.red} />
          </div>

          {/* Black Swan */}
          <div style={{ background: C.red + "11", border: `1px solid ${C.red}33`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span className="cinzel" style={{ fontSize: 10, letterSpacing: 2, color: C.red }}>⚡ SCENARIO RUNNER</span>
              <span className="mono" style={{ fontSize: 12, color: C.red }}>{crashPct}% crash</span>
            </div>
            <input type="range" min="5" max="60" step="5" value={crashPct}
              onChange={e => setCrashPct(parseInt(e.target.value))} style={{ width: "100%", marginBottom: 10 }} />
            <Btn onClick={() => setCrashed(c => !c)} variant={crashed ? "danger" : "outline"} size="sm" style={{ width: "100%" }}>
              {crashed ? "🔴 CRASH ACTIVE — RESTORE" : "🌪 TRIGGER BLACK SWAN EVENT"}
            </Btn>
            {crashed && (
              <div className="mono" style={{ fontSize: 11, color: C.red, marginTop: 8, textAlign: "center" }}>
                Portfolio down {fmtUSD(PORTFOLIO_ASSETS.reduce((s, a) => s + a.value, 0) * crashPct / 100)} · Watch the forest sway
              </div>
            )}
          </div>
        </Panel>

        <Panel style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <PanelTitle icon="🌳" accent={C.green}>Holdings</PanelTitle>
          {displayAssets.map((a, i) => (
            <div key={a.symbol} onClick={() => setSelectedAsset(selectedAsset?.symbol === a.symbol ? null : a)}
              style={{
                background: selectedAsset?.symbol === a.symbol ? a.color.toString(16).padStart(6, "0") === "ff4466" ? C.red + "22" : C.green + "11" : C.deep,
                border: `1px solid ${selectedAsset?.symbol === a.symbol ? "#" + a.color.toString(16).padStart(6, "0") + "66" : C.panelBorder}`,
                borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: "pointer", transition: "all .2s"
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#" + a.color.toString(16).padStart(6, "0"), boxShadow: `0 0 6px #${a.color.toString(16).padStart(6, "0")}` }} />
                  <div>
                    <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{a.symbol}</span>
                    <span style={{ fontSize: 10, color: C.textDim, marginLeft: 6 }}>{a.type}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: 12 }}>{fmtUSD(a.value)}</div>
                  <div className="mono" style={{ fontSize: 10, color: a.change >= 0 ? C.green : C.red }}>
                    {a.change >= 0 ? "+" : ""}{(a.change * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 9, color: C.textDim }}>VOLATILITY σ={a.sigma}</span>
                  <span style={{ fontSize: 9, color: a.sigma > 0.3 ? C.red : a.sigma > 0.15 ? C.gold : C.green }}>
                    {a.sigma > 0.3 ? "HIGH" : a.sigma > 0.15 ? "MED" : "LOW"}
                  </span>
                </div>
                <ProgressBar value={a.sigma} max={0.7} color={a.sigma > 0.3 ? C.red : a.sigma > 0.15 ? C.gold : C.green} height={4} />
              </div>
            </div>
          ))}
        </Panel>
      </div>

      {/* Right: 3D Forest */}
      <Panel style={{ padding: 0, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: 16, left: 16, zIndex: 10 }}>
          <div className="cinzel" style={{ fontSize: 10, letterSpacing: 3, color: C.purple, textShadow: `0 0 10px ${C.purple}` }}>3D MARKET FOREST</div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>Tree height = value · Sway = volatility</div>
        </div>
        {crashed && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 20, textAlign: "center", pointerEvents: "none" }}>
            <div className="cinzel" style={{ fontSize: 18, color: C.red, letterSpacing: 4, textShadow: `0 0 30px ${C.red}`, animation: "pulse 1s infinite" }}>BLACK SWAN</div>
            <div className="mono" style={{ fontSize: 13, color: C.red, marginTop: 4 }}>-{crashPct}% CRASH EVENT</div>
          </div>
        )}
        <ForestViz assets={displayAssets} crashed={crashed} />
      </Panel>
    </div>
  );
}

// ─── PHASE 4: THE LEGACY ──────────────────────────────────────────────────────
const FAMILY_MEMBERS = [
  { id: 1, name: "Alexander Voss", role: "Patriarch / CIO", avatar: "👴", votes: 3 },
  { id: 2, name: "Marina Voss", role: "Co-Trustee", avatar: "👩", votes: 2 },
  { id: 3, name: "Ethan Voss", role: "Heir / Analyst", avatar: "👦", votes: 1 },
  { id: 4, name: "Sofia Chen", role: "External Advisor", avatar: "👩‍💼", votes: 1 },
];

const PROPOSALS = [
  { id: 1, title: "Acquire 2 Residential Rentals — Austin, TX", amount: 1400000, type: "Real Estate", risk: "Medium", status: "voting" },
  { id: 2, title: "Series B Investment — FinTech Startup", amount: 500000, type: "Private Equity", risk: "High", status: "approved" },
  { id: 3, title: "Treasury Bond Ladder — 10yr", amount: 2000000, type: "Bonds", risk: "Low", status: "voting" },
];

const SANDBOX_ALLOCATIONS = [
  { label: "Public Equities", icon: "📊", color: C.cyan, pct: 35 },
  { label: "Real Estate", icon: "🏠", color: C.gold, pct: 25 },
  { label: "Private Equity", icon: "💼", color: C.purple, pct: 20 },
  { label: "Bonds", icon: "📜", color: C.green, pct: 15 },
  { label: "Cash / Liquidity", icon: "💵", color: C.textMid, pct: 5 },
];

function PhaseLegacy() {
  const [tab, setTab] = useState("boardroom");
  const [votes, setVotes] = useState({ 1: {}, 3: {} });
  const [allocs, setAllocs] = useState(SANDBOX_ALLOCATIONS);
  const totalFund = 10000000;

  const castVote = (proposalId, memberId, vote) => {
    setVotes(v => ({ ...v, [proposalId]: { ...v[proposalId], [memberId]: vote } }));
  };

  const voteResult = (proposalId) => {
    const v = votes[proposalId] || {};
    const yea = FAMILY_MEMBERS.filter(m => v[m.id] === "yea").reduce((s, m) => s + m.votes, 0);
    const nay = FAMILY_MEMBERS.filter(m => v[m.id] === "nay").reduce((s, m) => s + m.votes, 0);
    const total = FAMILY_MEMBERS.reduce((s, m) => s + m.votes, 0);
    return { yea, nay, total, passed: yea > total / 2, quorum: yea + nay >= 4 };
  };

  const totalAlloc = allocs.reduce((s, a) => s + a.pct, 0);
  const annualReturn = allocs.reduce((s, a, i) => s + a.pct * [0.1, 0.08, 0.18, 0.04, 0.05][i] / 100, 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[{ id: "boardroom", label: "The Boardroom", icon: "🏛️" }, { id: "sandbox", label: "$10M Challenge", icon: "💰" }].map(s => (
          <button key={s.id} onClick={() => setTab(s.id)} style={{
            padding: "9px 20px", borderRadius: 8, fontSize: 11, fontFamily: "'Cinzel'", letterSpacing: 1.5,
            textTransform: "uppercase", border: `1px solid ${tab === s.id ? C.gold : C.panelBorder}`,
            background: tab === s.id ? C.gold + "22" : "transparent", color: tab === s.id ? C.gold : C.textDim, cursor: "pointer", transition: "all .2s"
          }}>{s.icon} {s.label}</button>
        ))}
      </div>

      {tab === "boardroom" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 16 }}>
          {/* Members */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Panel>
              <PanelTitle icon="👥" accent={C.gold}>Family Office Council</PanelTitle>
              {FAMILY_MEMBERS.map(m => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.panelBorder}` }}>
                  <span style={{ fontSize: 28 }}>{m.avatar}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: C.textDim }}>{m.role}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="mono" style={{ fontSize: 16, color: C.gold, fontWeight: 700 }}>{m.votes}</div>
                    <div style={{ fontSize: 9, color: C.textDim }}>VOTES</div>
                  </div>
                </div>
              ))}
            </Panel>

            <Panel>
              <PanelTitle icon="📋" accent={C.cyan}>Investment Policy Statement</PanelTitle>
              {[
                { label: "Target Return", value: "8–12% annually" },
                { label: "Risk Tolerance", value: "Moderate" },
                { label: "Liquidity Reserve", value: "≥ 5% cash" },
                { label: "ESG Mandate", value: "Tier 2 screening" },
                { label: "Rebalance", value: "Quarterly" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.panelBorder}` }}>
                  <span style={{ fontSize: 12, color: C.textDim }}>{r.label}</span>
                  <span className="mono" style={{ fontSize: 12, color: C.gold }}>{r.value}</span>
                </div>
              ))}
            </Panel>
          </div>

          {/* Proposals */}
          <Panel>
            <PanelTitle icon="🗳️" accent={C.gold}>Capital Deployment Proposals</PanelTitle>
            {PROPOSALS.map(p => {
              const res = p.status === "voting" ? voteResult(p.id) : null;
              return (
                <div key={p.id} style={{ background: C.deep, border: `1px solid ${p.status === "approved" ? C.green + "44" : C.panelBorder}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{p.title}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <span style={{ fontSize: 10, color: C.cyan, background: C.cyan + "22", padding: "2px 8px", borderRadius: 99, fontFamily: "'Space Mono'" }}>{p.type}</span>
                        <span style={{ fontSize: 10, color: p.risk === "High" ? C.red : p.risk === "Medium" ? C.gold : C.green, background: (p.risk === "High" ? C.red : p.risk === "Medium" ? C.gold : C.green) + "22", padding: "2px 8px", borderRadius: 99, fontFamily: "'Space Mono'" }}>{p.risk} Risk</span>
                      </div>
                    </div>
                    <div className="mono" style={{ fontSize: 18, color: C.gold, fontWeight: 700 }}>{fmtUSD(p.amount)}</div>
                  </div>

                  {p.status === "approved" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.green }}>
                      <span>✅</span>
                      <span className="mono" style={{ fontSize: 11 }}>APPROVED — PREVIOUSLY VOTED</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                        {FAMILY_MEMBERS.map(m => (
                          <div key={m.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 14 }}>{m.avatar}</span>
                            <span style={{ fontSize: 10, flex: 1, color: C.textDim }}>{m.name.split(" ")[0]}</span>
                            <button onClick={() => castVote(p.id, m.id, "yea")} style={{ padding: "3px 8px", borderRadius: 4, fontSize: 10, fontFamily: "'Space Mono'", border: `1px solid ${votes[p.id]?.[m.id] === "yea" ? C.green : C.panelBorder}`, background: votes[p.id]?.[m.id] === "yea" ? C.green + "33" : "transparent", color: votes[p.id]?.[m.id] === "yea" ? C.green : C.textDim, cursor: "pointer" }}>YEA</button>
                            <button onClick={() => castVote(p.id, m.id, "nay")} style={{ padding: "3px 8px", borderRadius: 4, fontSize: 10, fontFamily: "'Space Mono'", border: `1px solid ${votes[p.id]?.[m.id] === "nay" ? C.red : C.panelBorder}`, background: votes[p.id]?.[m.id] === "nay" ? C.red + "33" : "transparent", color: votes[p.id]?.[m.id] === "nay" ? C.red : C.textDim, cursor: "pointer" }}>NAY</button>
                          </div>
                        ))}
                      </div>
                      {res && (
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <div style={{ flex: 1 }}>
                            <ProgressBar value={res.yea} max={res.total} color={C.green} height={6} />
                          </div>
                          <span className="mono" style={{ fontSize: 10, color: res.quorum ? (res.passed ? C.green : C.red) : C.textDim, minWidth: 100 }}>
                            {res.quorum ? (res.passed ? "✅ PASSED" : "❌ REJECTED") : `${res.yea}/${res.total} votes`}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </Panel>
        </div>
      )}

      {tab === "sandbox" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Panel>
            <PanelTitle icon="💰" accent={C.gold}>$10M Portfolio Sandbox</PanelTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              <StatCard label="Total AUM" value="$10,000,000" color={C.gold} icon="💎" />
              <StatCard label="Est. Annual Return" value={fmtPct(annualReturn)} color={annualReturn > 0.08 ? C.green : C.gold} icon="📈" />
              <StatCard label="Est. Annual Income" value={fmtUSD(totalFund * annualReturn)} color={C.cyan} icon="💸" />
              <StatCard label="Allocation Check" value={totalAlloc === 100 ? "✅ 100%" : `${totalAlloc}%`} color={totalAlloc === 100 ? C.green : C.red} icon="⚖️" />
            </div>

            <div className="mono" style={{ fontSize: 10, color: C.textDim, marginBottom: 12, letterSpacing: 1 }}>ASSET ALLOCATION</div>
            {allocs.map((a, i) => (
              <div key={a.label} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>{a.icon} {a.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="mono" style={{ fontSize: 11, color: C.textDim }}>{fmtUSD(totalFund * a.pct / 100)}</span>
                    <span className="mono" style={{ fontSize: 13, color: a.color, fontWeight: 700, minWidth: 36 }}>{a.pct}%</span>
                  </div>
                </div>
                <input type="range" min="0" max="70" step="5" value={a.pct}
                  onChange={e => setAllocs(prev => prev.map((x, j) => j === i ? { ...x, pct: parseInt(e.target.value) } : x))}
                  style={{ width: "100%" }} />
                <ProgressBar value={a.pct} max={100} color={a.color} height={4} />
              </div>
            ))}
          </Panel>

          <Panel>
            <PanelTitle icon="🥧" accent={C.purple}>Allocation Breakdown</PanelTitle>
            {/* Donut chart approximation */}
            <div style={{ position: "relative", width: 200, height: 200, margin: "0 auto 24px" }}>
              <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%" }}>
                {(() => {
                  let offset = 0;
                  const cx = 100, cy = 100, r = 70, inner = 42;
                  const circ = 2 * Math.PI * r;
                  return allocs.map((a, i) => {
                    const dash = (a.pct / 100) * circ;
                    const gap = circ - dash;
                    const rotation = (offset / 100) * 360 - 90;
                    offset += a.pct;
                    return (
                      <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                        stroke={a.color} strokeWidth={inner - 10}
                        strokeDasharray={`${dash} ${gap}`}
                        strokeDashoffset={0}
                        transform={`rotate(${rotation} ${cx} ${cy})`}
                        style={{ transition: "all .5s" }} />
                    );
                  });
                })()}
                <circle cx="100" cy="100" r="35" fill={C.panel} />
                <text x="100" y="96" textAnchor="middle" fill={C.gold} fontSize="11" fontFamily="'Cinzel'" fontWeight="700">$10M</text>
                <text x="100" y="112" textAnchor="middle" fill={C.textDim} fontSize="9" fontFamily="'Space Mono'">TOTAL AUM</text>
              </svg>
            </div>

            {allocs.map(a => (
              <div key={a.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: a.color }} />
                  <span style={{ fontSize: 12 }}>{a.label}</span>
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  <span className="mono" style={{ fontSize: 11, color: C.textDim }}>{fmtUSD(totalFund * a.pct / 100)}</span>
                  <span className="mono" style={{ fontSize: 11, color: a.color, fontWeight: 700, minWidth: 36, textAlign: "right" }}>{a.pct}%</span>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 20, background: C.gold + "11", border: `1px solid ${C.gold}33`, borderRadius: 10, padding: 14 }}>
              <div className="cinzel" style={{ fontSize: 10, letterSpacing: 2, color: C.gold, marginBottom: 8 }}>IPS COMPLIANCE</div>
              {[
                { label: "Liquidity ≥ 5%", ok: allocs[4].pct >= 5 },
                { label: "Bonds ≥ 10%", ok: allocs[3].pct >= 10 },
                { label: "Allocation = 100%", ok: totalAlloc === 100 },
                { label: "No single >50%", ok: allocs.every(a => a.pct <= 50) },
              ].map(c => (
                <div key={c.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: C.textMid }}>{c.label}</span>
                  <span style={{ fontSize: 11, color: c.ok ? C.green : C.red }}>{c.ok ? "✅ Pass" : "❌ Fail"}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function AstraFinance() {
  const [phase, setPhase] = useState(1);
  const [unlockedPhase, setUnlockedPhase] = useState(4);

  const phaseComponents = { 1: PhaseSeed, 2: PhaseEngine, 3: PhaseHorizon, 4: PhaseLegacy };
  const PhaseComp = phaseComponents[phase];

  const totalNetWorth = 330000;
  const xpPct = 68;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: C.void }}>
      <GlobalStyle />

      {/* Sidebar */}
      <div style={{ width: 240, background: C.deep, borderRight: `1px solid ${C.panelBorder}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${C.panelBorder}` }}>
          <div className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: C.gold, letterSpacing: 3, lineHeight: 1.2 }}>ASTRA</div>
          <div className="cinzel" style={{ fontSize: 10, color: C.goldDim, letterSpacing: 4 }}>FINANCE</div>
          <div style={{ fontSize: 9, color: C.textDim, marginTop: 4, fontFamily: "'Space Mono'" }}>THE LEGACY SANDBOX</div>
        </div>

        {/* Net worth */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.panelBorder}` }}>
          <div style={{ fontSize: 10, color: C.textDim, fontFamily: "'Space Mono'", marginBottom: 4 }}>NET WORTH</div>
          <div className="mono" style={{ fontSize: 22, color: C.gold, fontWeight: 700 }}>{fmtUSD(totalNetWorth)}</div>
          <div style={{ marginTop: 8, marginBottom: 4, fontSize: 10, color: C.textDim, display: "flex", justifyContent: "space-between" }}>
            <span>XP Progress</span><span style={{ color: C.cyan }}>{xpPct}%</span>
          </div>
          <ProgressBar value={xpPct} max={100} color={C.cyan} height={5} />
        </div>

        {/* Phases nav */}
        <div style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
          <div style={{ fontSize: 9, color: C.textDim, fontFamily: "'Space Mono'", letterSpacing: 2, padding: "4px 8px 8px" }}>PHASES</div>
          {PHASES.map(p => {
            const locked = p.id > unlockedPhase;
            const active = phase === p.id;
            return (
              <button key={p.id} onClick={() => !locked && setPhase(p.id)} style={{
                width: "100%", padding: "12px 12px", borderRadius: 10, marginBottom: 6, textAlign: "left",
                background: active ? p.color + "22" : "transparent",
                border: `1px solid ${active ? p.color + "66" : "transparent"}`,
                cursor: locked ? "not-allowed" : "pointer", opacity: locked ? 0.4 : 1, transition: "all .2s"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{locked ? "🔒" : p.icon}</span>
                  <div>
                    <div className="cinzel" style={{ fontSize: 10, letterSpacing: 1.5, color: active ? p.color : C.textMid, textTransform: "uppercase" }}>
                      Phase {p.id}
                    </div>
                    <div style={{ fontSize: 11, color: active ? C.text : C.textDim, marginTop: 1 }}>{p.label}</div>
                    <div style={{ fontSize: 9, color: C.textDim }}>{p.subtitle}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom stats */}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.panelBorder}` }}>
          {[
            { label: "Monthly Cash Flow", val: "+$2,840", color: C.green },
            { label: "Tax Efficiency", val: "73%", color: C.cyan },
            { label: "Credit Score", val: "798", color: C.gold },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: C.textDim }}>{s.label}</span>
              <span className="mono" style={{ fontSize: 10, color: s.color, fontWeight: 700 }}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ padding: "14px 24px", borderBottom: `1px solid ${C.panelBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: C.deep }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>{PHASES[phase - 1].icon}</span>
              <div>
                <h1 className="cinzel" style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: PHASES[phase - 1].color }}>
                  {PHASES[phase - 1].label}
                </h1>
                <div style={{ fontSize: 11, color: C.textDim }}>{PHASES[phase - 1].subtitle}</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {PHASES.map(p => (
                <div key={p.id} style={{ width: 8, height: 8, borderRadius: "50%", background: p.id === phase ? p.color : p.id < phase ? C.goldDim : C.panelBorder, transition: "all .3s" }} />
              ))}
            </div>
            <div style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: 8, padding: "6px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>🏆</span>
              <span className="mono" style={{ fontSize: 11, color: C.gold }}>Level {phase} · {["Seedling", "Engineer", "Trader", "Patriarch"][phase - 1]}</span>
            </div>
          </div>
        </div>

        {/* Phase content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <PhaseComp />
        </div>

        {/* Phase nav bottom */}
        <div style={{ padding: "10px 24px", borderTop: `1px solid ${C.panelBorder}`, display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
          <Btn onClick={() => setPhase(p => Math.max(1, p - 1))} variant="ghost" size="sm" style={{ opacity: phase === 1 ? 0.3 : 1 }}>← Previous Phase</Btn>
          <Btn onClick={() => setPhase(p => Math.min(4, p + 1))} variant={phase < 4 ? "primary" : "ghost"} size="sm" style={{ opacity: phase === 4 ? 0.3 : 1 }}>
            {phase < 4 ? `Advance to Phase ${phase + 1} →` : "Final Phase Reached 👑"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
