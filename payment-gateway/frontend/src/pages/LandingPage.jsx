import { useState, useEffect, useRef } from "react";

const NAV_LINKS = ["Features", "Architecture", "API", "Stack"];

const FEATURES = [
  {
    icon: "⟳",
    title: "State Machine",
    desc: "Strict payment lifecycle enforced server-side with PostgreSQL row locking. Every transition is atomic.",
    tag: "created → captured → refunded",
  },
  {
    icon: "⌘",
    title: "Idempotent APIs",
    desc: "Idempotency-Key header prevents duplicate charges on retry — enforced at both DB and application layer.",
    tag: "UNIQUE constraint",
  },
  {
    icon: "↗",
    title: "Webhook Engine",
    desc: "Async delivery with exponential retry — 5s → 30s → 5min → 30min → 1hr. HMAC-SHA256 signed.",
    tag: "Stripe-style",
  },
  {
    icon: "⬡",
    title: "PostgreSQL Transactions",
    desc: "All state changes wrapped in BEGIN/COMMIT/ROLLBACK. Full audit trail on every status transition.",
    tag: "ACID compliant",
  },
  {
    icon: "⊕",
    title: "Dual Auth",
    desc: "JWT bearer tokens for UI sessions + API key authentication for server-to-server integration.",
    tag: "JWT + HMAC",
  },
  {
    icon: "◈",
    title: "Rate Limiting",
    desc: "200 requests per 15-minute window with express-rate-limit. Production-grade from day one.",
    tag: "200 req/15min",
  },
];

const LIFECYCLE = [
  { label: "created", color: "#4ade80", desc: "Payment intent initialized" },
  { label: "authorized", color: "#60a5fa", desc: "Funds reserved on card" },
  { label: "captured", color: "#a78bfa", desc: "Money collected" },
  { label: "refunded", color: "#f59e0b", desc: "Funds returned" },
  { label: "failed", color: "#f87171", desc: "10% simulated decline" },
];

const STACK = [
  { layer: "Backend", tech: "Node.js + Express.js", color: "#4ade80" },
  { layer: "Database", tech: "PostgreSQL 18", color: "#60a5fa" },
  { layer: "Auth", tech: "JWT + HMAC-SHA256", color: "#a78bfa" },
  { layer: "Frontend", tech: "React 18 + Tailwind", color: "#f59e0b" },
  { layer: "Charts", tech: "Recharts", color: "#fb7185" },
  { layer: "Deploy", tech: "Docker + Compose", color: "#34d399" },
];

const API_ROUTES = [
  { method: "POST", path: "/api/auth/register", desc: "Create merchant account" },
  { method: "POST", path: "/api/auth/login", desc: "Get JWT token" },
  { method: "POST", path: "/api/payments", desc: "Create payment intent" },
  { method: "GET", path: "/api/payments", desc: "List all payments" },
  { method: "POST", path: "/api/payments/:id/authorize", desc: "Authorize payment" },
  { method: "POST", path: "/api/payments/:id/capture", desc: "Capture funds" },
  { method: "POST", path: "/api/payments/:id/refund", desc: "Issue refund" },
  { method: "POST", path: "/api/webhooks/endpoints", desc: "Register webhook URL" },
];

const METHOD_COLORS = {
  GET: { bg: "#0f2e1a", text: "#4ade80", border: "#166534" },
  POST: { bg: "#1e1b4b", text: "#a78bfa", border: "#4338ca" },
  DELETE: { bg: "#2d1515", text: "#f87171", border: "#991b1b" },
};

function useTypewriter(texts, speed = 60) {
  const [display, setDisplay] = useState("");
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[idx];
    const timeout = setTimeout(() => {
      if (!deleting) {
        setDisplay(current.slice(0, charIdx + 1));
        if (charIdx + 1 === current.length) {
          setTimeout(() => setDeleting(true), 1800);
        } else {
          setCharIdx((c) => c + 1);
        }
      } else {
        setDisplay(current.slice(0, charIdx - 1));
        if (charIdx - 1 === 0) {
          setDeleting(false);
          setIdx((i) => (i + 1) % texts.length);
          setCharIdx(0);
        } else {
          setCharIdx((c) => c - 1);
        }
      }
    }, deleting ? 30 : speed);
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, idx, texts, speed]);

  return display;
}

function GridBg() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
      backgroundImage: `
        linear-gradient(rgba(74,222,128,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(74,222,128,0.04) 1px, transparent 1px)
      `,
      backgroundSize: "40px 40px",
    }} />
  );
}

function GlowOrb({ x, y, color, size = 300 }) {
  return (
    <div style={{
      position: "absolute", left: x, top: y,
      width: size, height: size,
      borderRadius: "50%",
      background: color,
      filter: "blur(80px)",
      opacity: 0.12,
      pointerEvents: "none",
    }} />
  );
}

function Badge({ children, color = "#4ade80" }) {
  return (
    <span style={{
      fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
      background: `${color}18`, color, border: `1px solid ${color}30`,
      borderRadius: 4, padding: "2px 8px", letterSpacing: "0.05em",
    }}>{children}</span>
  );
}

function FeatureCard({ icon, title, desc, tag }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(74,222,128,0.04)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 12, padding: "28px 24px",
        transition: "all 0.25s ease", cursor: "default",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 14, color: "#4ade80" }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>{title}</div>
      <div style={{ fontSize: 13.5, color: "#94a3b8", lineHeight: 1.7, marginBottom: 16 }}>{desc}</div>
      <Badge>{tag}</Badge>
    </div>
  );
}

export default function LandingPage() {
  const typed = useTypewriter([
    "payment infrastructure",
    "idempotent APIs",
    "webhook delivery",
    "state machines",
  ]);

  const [activeSection, setActiveSection] = useState("Features");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("docker-compose up --build");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080c10",
      color: "#e2e8f0",
      fontFamily: "'Inter', -apple-system, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <GridBg />

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(8,12,16,0.85)",
        backdropFilter: "blur(12px)",
        padding: "0 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 56,
      }}>
       <a href="/landing" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
  <div style={{
    width: 28, height: 28, borderRadius: 6,
    background: "linear-gradient(135deg, #4ade80, #22d3ee)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 700, color: "#080c10",
  }}>P</div>
  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>
    PayGateway
  </span>
  <Badge color="#4ade80">v1.0.0</Badge>
</a>
        <div style={{ display: "flex", gap: 32 }}>
          {NAV_LINKS.map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{
              fontSize: 13, color: "#64748b", textDecoration: "none",
              transition: "color 0.15s",
            }}
              onMouseEnter={e => e.target.style.color = "#4ade80"}
              onMouseLeave={e => e.target.style.color = "#64748b"}
            >{l}</a>
          ))}
        </div>
        <a href="https://payment-gateway-frontend.up.railway.app/" style={{
          fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
          background: "#4ade80", color: "#080c10",
          border: "none", borderRadius: 6, padding: "7px 16px",
          textDecoration: "none", fontWeight: 600, cursor: "pointer",
          transition: "opacity 0.15s",
        }}>Open Dashboard →</a>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", textAlign: "center", padding: "120px 40px 100px", maxWidth: 860, margin: "0 auto" }}>
        <GlowOrb x="10%" y="-20%" color="#4ade80" size={500} />
        <GlowOrb x="60%" y="10%" color="#60a5fa" size={400} />

        <div style={{ marginBottom: 24 }}>
          <Badge color="#4ade80">Built by Karthik Rajesh Shet · MCA · Bengaluru</Badge>
        </div>

        <h1 style={{
          fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800,
          lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 16px",
          color: "#f8fafc",
        }}>
          Stripe-grade<br />
          <span style={{
            background: "linear-gradient(90deg, #4ade80, #22d3ee)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {typed}
            <span style={{ animation: "blink 1s step-end infinite", color: "#4ade80", WebkitTextFillColor: "#4ade80" }}>|</span>
          </span>
        </h1>

        <p style={{ fontSize: 18, color: "#64748b", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 48px" }}>
          A full-stack payment gateway simulation replicating how Stripe works under the hood — built to demonstrate distributed systems and payment infrastructure engineering.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="https://payment-gateway-frontend.up.railway.app/" style={{
            background: "#4ade80", color: "#080c10", fontWeight: 700,
            fontSize: 14, padding: "12px 28px", borderRadius: 8,
            textDecoration: "none", transition: "transform 0.15s",
          }}>Launch Dashboard</a>
          <div
            onClick={handleCopy}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, padding: "12px 20px", cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#94a3b8",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(74,222,128,0.4)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
          >
            <span style={{ color: "#4ade80" }}>$</span>
            docker-compose up --build
            <span style={{ marginLeft: 8, fontSize: 11, color: "#4ade80" }}>{copied ? "✓ copied" : "copy"}</span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 48,
          marginTop: 80, paddingTop: 48,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          {[["90%", "Auth success rate"], ["5×", "Webhook retry"], ["ACID", "DB transactions"], ["Dual", "Auth methods"]].map(([val, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "#4ade80" }}>{val}</div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <Badge color="#60a5fa">Features</Badge>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: "#f1f5f9", marginTop: 16, letterSpacing: "-0.02em" }}>
            Production-grade internals
          </h2>
          <p style={{ color: "#64748b", fontSize: 16, marginTop: 8 }}>Every component mirrors real payment infrastructure</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* Payment Lifecycle */}
      <section id="architecture" style={{ padding: "80px 40px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <Badge color="#a78bfa">Architecture</Badge>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: "#f1f5f9", marginTop: 16, letterSpacing: "-0.02em" }}>
            Payment lifecycle
          </h2>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16, padding: "40px 32px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0, justifyContent: "center", flexWrap: "wrap" }}>
            {LIFECYCLE.map((step, i) => (
              <div key={step.label} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    background: `${step.color}15`, border: `1px solid ${step.color}40`,
                    borderRadius: 8, padding: "10px 20px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13, color: step.color, fontWeight: 600,
                    marginBottom: 8,
                  }}>{step.label}</div>
                  <div style={{ fontSize: 11, color: "#475569", maxWidth: 100 }}>{step.desc}</div>
                </div>
                {i < LIFECYCLE.length - 1 && (
                  <div style={{
                    fontSize: 18, color: "#334155", margin: "0 8px",
                    marginBottom: 20,
                  }}>→</div>
                )}
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 32, padding: "16px 20px",
            background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)",
            borderRadius: 8, fontSize: 13, color: "#f87171",
            fontFamily: "'JetBrains Mono', monospace",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span>⚠</span>
            <span>10% simulated authorization failure rate — realistic card decline behavior</span>
          </div>
        </div>
      </section>

      {/* API */}
      <section id="api" style={{ padding: "80px 40px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <Badge color="#f59e0b">API</Badge>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: "#f1f5f9", marginTop: 16, letterSpacing: "-0.02em" }}>
            REST API reference
          </h2>
          <p style={{ color: "#64748b", marginTop: 8 }}>Base URL: <code style={{ color: "#4ade80", fontFamily: "'JetBrains Mono', monospace" }}>http://localhost:5000</code></p>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16, overflow: "hidden",
        }}>
          {API_ROUTES.map((route, i) => {
            const mc = METHOD_COLORS[route.method] || METHOD_COLORS.GET;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "14px 24px",
                borderBottom: i < API_ROUTES.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                transition: "background 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{
                  fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                  background: mc.bg, color: mc.text, border: `1px solid ${mc.border}`,
                  borderRadius: 4, padding: "2px 8px", minWidth: 44, textAlign: "center",
                }}>{route.method}</span>
                <code style={{ fontSize: 13, color: "#e2e8f0", fontFamily: "'JetBrains Mono', monospace", flex: 1 }}>
                  {route.path}
                </code>
                <span style={{ fontSize: 13, color: "#475569" }}>{route.desc}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stack */}
      <section id="stack" style={{ padding: "80px 40px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <Badge color="#34d399">Stack</Badge>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: "#f1f5f9", marginTop: 16, letterSpacing: "-0.02em" }}>
            Tech stack
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
          {STACK.map((s) => (
            <div key={s.layer} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10, padding: "16px 20px",
            }}>
              <span style={{ fontSize: 12, color: "#475569", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.layer}</span>
              <span style={{ fontSize: 14, color: s.color, fontWeight: 600 }}>{s.tech}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: "80px 40px 120px", textAlign: "center",
        position: "relative",
      }}>
        <GlowOrb x="30%" y="0%" color="#4ade80" size={600} />
        <div style={{
          maxWidth: 600, margin: "0 auto",
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(74,222,128,0.2)",
          borderRadius: 20, padding: "56px 40px", position: "relative",
        }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: "#f1f5f9", marginBottom: 16, letterSpacing: "-0.02em" }}>
            Ready to explore?
          </h2>
          <p style={{ color: "#64748b", fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
            Run the full stack locally and walk through a complete payment lifecycle — from intent to refund.
          </p>
          <a href="https://payment-gateway-frontend.up.railway.app/" style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #4ade80, #22d3ee)",
            color: "#080c10", fontWeight: 700, fontSize: 15,
            padding: "14px 36px", borderRadius: 10, textDecoration: "none",
            letterSpacing: "-0.01em",
          }}>Open Dashboard →</a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "24px 40px", textAlign: "center",
        fontSize: 13, color: "#334155",
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        Built by <span style={{ color: "#4ade80" }}>Karthik Rajesh Shet</span> · MCA Graduate · Bengaluru · 2026
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
