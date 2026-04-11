import { useState } from "react";

// ── Design Tokens ──────────────────────────────────────────────
const t = {
  bg: {
    base: "#020617",       // slate-950
    surface: "#0f172a",    // slate-900  – sidebar, header
    elevated: "#1e293b",   // slate-800  – cards, hover
    input: "#1e293b",      // input backgrounds
    hover: "#334155",      // slate-700
    overlay: "rgba(2,6,23,0.7)",
  },
  accent: {
    cyan: "#22d3ee",        // cyan-400
    cyanDim: "#0891b2",     // cyan-600
    cyanGlow: "rgba(34,211,238,0.15)",
    blue: "#60a5fa",        // blue-400
    indigo: "#818cf8",      // indigo-400
    purple: "#a78bfa",      // violet-400
  },
  text: {
    primary: "#f1f5f9",     // slate-100
    secondary: "#94a3b8",   // slate-400
    muted: "#475569",       // slate-600
    accent: "#22d3ee",      // cyan-400
  },
  border: {
    subtle: "rgba(148,163,184,0.08)",
    default: "rgba(148,163,184,0.12)",
    focus: "rgba(34,211,238,0.4)",
  },
  radius: {
    sm: "6px", md: "10px", lg: "16px", xl: "20px", full: "9999px",
  },
  shadow: {
    glow: "0 0 20px rgba(34,211,238,0.12)",
    card: "0 4px 24px rgba(0,0,0,0.4)",
    input: "0 2px 8px rgba(0,0,0,0.3)",
  },
};

// ── Mock Data ──────────────────────────────────────────────────
const rooms = [
  { id: 1, name: "general", unread: 3, active: false },
  { id: 2, name: "announcements", unread: 0, active: false },
  { id: 3, name: "design", unread: 0, active: true },
  { id: 4, name: "dev", unread: 12, active: false },
  { id: 5, name: "random", unread: 1, active: false },
];

const dms = [
  { id: 1, name: "Maya Chen", avatar: "MC", color: "#22d3ee", status: "online", unread: 0 },
  { id: 2, name: "Alex Rivera", avatar: "AR", color: "#818cf8", status: "away", unread: 2 },
  { id: 3, name: "Sam Park", avatar: "SP", color: "#f472b6", status: "offline", unread: 0 },
];

const messages = [
  {
    id: 1, sender: "Maya Chen", avatar: "MC", color: "#22d3ee",
    time: "9:41 AM", cluster: "start",
    text: "Hey team! I've been looking at the new design system tokens and I think we should revisit the border radius values.",
  },
  {
    id: 2, sender: "Maya Chen", avatar: "MC", color: "#22d3ee",
    time: "9:41 AM", cluster: "mid",
    text: "The 4px rounding feels a bit dated for what we're going for with Orbit.",
  },
  {
    id: 3, sender: "Maya Chen", avatar: "MC", color: "#22d3ee",
    time: "9:42 AM", cluster: "end",
    text: "Thoughts? 👀",
    reactions: [{ emoji: "👀", count: 3 }, { emoji: "💯", count: 2 }],
  },
  {
    id: 4, sender: "Alex Rivera", avatar: "AR", color: "#818cf8",
    time: "9:45 AM", cluster: "start",
    text: "Agreed — I think going full MD3 with `rounded-full` for interactive elements makes total sense for a chat app. The pill shape reads as 'touchable'.",
  },
  {
    id: 5, sender: "Alex Rivera", avatar: "AR", color: "#818cf8",
    time: "9:46 AM", cluster: "end",
    text: "I can update the component tokens this afternoon if you want to see it in the prototype.",
    reactions: [{ emoji: "🙌", count: 4 }],
  },
  {
    id: 6, sender: "Jordan", avatar: "JK", color: "#34d399", isSelf: true,
    time: "9:48 AM", cluster: "start",
    text: "Yes please! Also thinking we should bump the sidebar background to slate-900 to give it more depth vs the main content area.",
  },
  {
    id: 7, sender: "Jordan", avatar: "JK", color: "#34d399", isSelf: true,
    time: "9:48 AM", cluster: "end",
    text: "The current flat gray is making everything feel samey.",
  },
  {
    id: 8, sender: "Maya Chen", avatar: "MC", color: "#22d3ee",
    time: "10:02 AM", cluster: "solo",
    text: "Love that direction. Also — should we add an ambient glow behind the Orbit logo mark? Something subtle with the cyan accent.",
    isTimeDivider: true, dividerLabel: "10:00 AM",
    reactions: [{ emoji: "✨", count: 5 }, { emoji: "❤️", count: 2 }],
  },
];

// ── Micro Components ───────────────────────────────────────────
const Avatar = ({ initials, color, size = 32, status }) => (
  <div style={{ position: "relative", flexShrink: 0 }}>
    <div style={{
      width: size, height: size, borderRadius: t.radius.full,
      background: `linear-gradient(135deg, ${color}40, ${color}80)`,
      border: `1.5px solid ${color}50`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 600, color: color,
      letterSpacing: "-0.02em",
    }}>
      {initials}
    </div>
    {status && (
      <div style={{
        position: "absolute", bottom: 0, right: 0,
        width: 9, height: 9, borderRadius: t.radius.full,
        background: status === "online" ? "#22c55e" : status === "away" ? "#f59e0b" : t.bg.hover,
        border: `1.5px solid ${t.bg.surface}`,
      }} />
    )}
  </div>
);

const UnreadBadge = ({ count }) => count === 0 ? null : (
  <div style={{
    minWidth: 18, height: 18, borderRadius: t.radius.full,
    background: `linear-gradient(135deg, ${t.accent.cyan}, ${t.accent.blue})`,
    color: "#020617", fontSize: 10, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "0 5px",
  }}>
    {count > 99 ? "99+" : count}
  </div>
);

const StatusDot = ({ status }) => (
  <div style={{
    width: 7, height: 7, borderRadius: t.radius.full,
    background: status === "online" ? "#22c55e" : status === "away" ? "#f59e0b" : t.border.default,
    flexShrink: 0,
  }} />
);

// ── Sidebar ────────────────────────────────────────────────────
const Sidebar = ({ activeRoom, setActiveRoom }) => {
  const [showDMs, setShowDMs] = useState(true);
  const [showRooms, setShowRooms] = useState(true);

  return (
    <div style={{
      width: 240, flexShrink: 0, display: "flex", flexDirection: "column",
      background: t.bg.surface, borderRight: `1px solid ${t.border.subtle}`,
      height: "100%",
    }}>
      {/* Brand */}
      <div style={{
        padding: "18px 16px 14px", display: "flex", alignItems: "center", gap: 10,
        borderBottom: `1px solid ${t.border.subtle}`,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: `linear-gradient(135deg, ${t.accent.cyan}, ${t.accent.blue})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: t.shadow.glow, flexShrink: 0,
        }}>
          {/* Orbit icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="3" fill="white" opacity="0.9"/>
            <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.5" fill="none" opacity="0.6"/>
            <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4"
              strokeDasharray="3 2" transform="rotate(45 9 9)"/>
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: t.text.primary, letterSpacing: "-0.02em" }}>
          Orbit
        </span>
        <div style={{ flex: 1 }} />
        <div style={{
          width: 26, height: 26, borderRadius: t.radius.full, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: t.text.muted, fontSize: 16, transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = t.bg.elevated; e.currentTarget.style.color = t.text.secondary; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.text.muted; }}
        >
          ✏️
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "10px 12px 6px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: t.bg.elevated, borderRadius: t.radius.full,
          padding: "7px 12px", border: `1px solid ${t.border.subtle}`,
          cursor: "text",
        }}>
          <span style={{ color: t.text.muted, fontSize: 13 }}>🔍</span>
          <span style={{ color: t.text.muted, fontSize: 13 }}>Search…</span>
        </div>
      </div>

      {/* Nav Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>

        {/* Rooms */}
        <div style={{ marginBottom: 4 }}>
          <button
            onClick={() => setShowRooms(s => !s)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 6,
              padding: "5px 8px", borderRadius: t.radius.md, border: "none",
              background: "transparent", cursor: "pointer", marginBottom: 2,
            }}
          >
            <span style={{ color: t.text.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Rooms
            </span>
            <span style={{ color: t.text.muted, fontSize: 10, transform: showRooms ? "rotate(0deg)" : "rotate(-90deg)", transition: "0.15s", marginTop: 1 }}>▾</span>
            <div style={{ flex: 1 }} />
            <div style={{
              width: 20, height: 20, borderRadius: t.radius.full,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: t.text.muted, fontSize: 14,
            }}>+</div>
          </button>

          {showRooms && rooms.map(room => (
            <button key={room.id}
              onClick={() => setActiveRoom(room.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 9,
                padding: "7px 10px", borderRadius: t.radius.full, border: "none",
                background: activeRoom === room.id ? t.accent.cyanGlow : "transparent",
                cursor: "pointer", marginBottom: 1, transition: "all 0.12s",
              }}
              onMouseEnter={e => { if (activeRoom !== room.id) e.currentTarget.style.background = t.bg.elevated; }}
              onMouseLeave={e => { if (activeRoom !== room.id) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ color: activeRoom === room.id ? t.accent.cyan : t.text.muted, fontSize: 13 }}>#</span>
              <span style={{
                fontSize: 13.5, fontWeight: activeRoom === room.id ? 600 : 400,
                color: activeRoom === room.id ? t.text.primary : t.text.secondary,
                flex: 1, textAlign: "left",
              }}>
                {room.name}
              </span>
              <UnreadBadge count={room.unread} />
            </button>
          ))}
        </div>

        {/* DMs */}
        <div style={{ marginTop: 8 }}>
          <button
            onClick={() => setShowDMs(s => !s)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 6,
              padding: "5px 8px", borderRadius: t.radius.md, border: "none",
              background: "transparent", cursor: "pointer", marginBottom: 2,
            }}
          >
            <span style={{ color: t.text.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Direct Messages
            </span>
            <span style={{ color: t.text.muted, fontSize: 10, transform: showDMs ? "rotate(0deg)" : "rotate(-90deg)", transition: "0.15s", marginTop: 1 }}>▾</span>
          </button>

          {showDMs && dms.map(dm => (
            <button key={dm.id}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "6px 8px", borderRadius: t.radius.full, border: "none",
                background: "transparent", cursor: "pointer", marginBottom: 1, transition: "all 0.12s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = t.bg.elevated}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Avatar initials={dm.avatar} color={dm.color} size={24} status={dm.status} />
              <span style={{ fontSize: 13.5, color: t.text.secondary, flex: 1, textAlign: "left", fontWeight: 400 }}>
                {dm.name}
              </span>
              <UnreadBadge count={dm.unread} />
            </button>
          ))}
        </div>
      </div>

      {/* User Footer */}
      <div style={{
        padding: "10px 12px", borderTop: `1px solid ${t.border.subtle}`,
        display: "flex", alignItems: "center", gap: 9,
        background: t.bg.surface,
      }}>
        <Avatar initials="JK" color="#34d399" size={30} status="online" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.text.primary, lineHeight: 1.2 }}>Jordan K.</div>
          <div style={{ fontSize: 11, color: t.text.muted, lineHeight: 1.2 }}>Online</div>
        </div>
        <button style={{
          width: 28, height: 28, borderRadius: t.radius.full, border: "none",
          background: "transparent", cursor: "pointer", color: t.text.muted, fontSize: 15,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = t.bg.elevated; e.currentTarget.style.color = t.text.secondary; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.text.muted; }}
        >
          ⚙️
        </button>
      </div>
    </div>
  );
};

// ── Message Component ──────────────────────────────────────────
const Message = ({ msg, prevSender }) => {
  const [hovered, setHovered] = useState(false);
  const showAvatar = msg.cluster === "start" || msg.cluster === "solo";
  const showName = showAvatar;
  const isFirst = msg.cluster === "start" || msg.cluster === "solo";
  const topPad = isFirst ? 14 : 2;

  return (
    <>
      {msg.isTimeDivider && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "16px 20px 6px", margin: "4px 0",
        }}>
          <div style={{ flex: 1, height: 1, background: t.border.subtle }} />
          <span style={{
            fontSize: 11, color: t.text.muted, fontWeight: 500,
            padding: "3px 10px", borderRadius: t.radius.full,
            background: t.bg.surface, border: `1px solid ${t.border.subtle}`,
            letterSpacing: "0.03em",
          }}>
            {msg.dividerLabel}
          </span>
          <div style={{ flex: 1, height: 1, background: t.border.subtle }} />
        </div>
      )}

      <div
        style={{
          display: "flex", alignItems: "flex-start", gap: 12,
          padding: `${topPad}px 20px 2px`,
          background: hovered ? "rgba(148,163,184,0.03)" : "transparent",
          transition: "background 0.1s", position: "relative", cursor: "default",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Avatar column — always 36px wide for alignment */}
        <div style={{ width: 36, flexShrink: 0, paddingTop: showAvatar ? 2 : 0 }}>
          {showAvatar && <Avatar initials={msg.avatar} color={msg.color} size={36} />}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {showName && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
              <span style={{
                fontSize: 14, fontWeight: 600,
                color: msg.isSelf ? "#34d399" : msg.color,
              }}>{msg.sender}</span>
              <span style={{ fontSize: 11, color: t.text.muted }}>{msg.time}</span>
            </div>
          )}
          <div style={{
            fontSize: 14, color: t.text.primary, lineHeight: 1.55,
            wordBreak: "break-word",
          }}>
            {msg.text}
          </div>

          {/* Reactions */}
          {msg.reactions && (
            <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
              {msg.reactions.map((r, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "2px 8px", borderRadius: t.radius.full,
                  background: t.accent.cyanGlow,
                  border: `1px solid ${t.border.focus}`,
                  fontSize: 12, color: t.text.secondary, cursor: "pointer",
                  transition: "all 0.12s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${t.accent.cyan}25`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = t.accent.cyanGlow; }}
                >
                  <span style={{ fontSize: 13 }}>{r.emoji}</span>
                  <span style={{ fontWeight: 600, fontSize: 11, color: t.accent.cyan }}>{r.count}</span>
                </div>
              ))}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 24, height: 24, borderRadius: t.radius.full,
                border: `1px solid ${t.border.subtle}`, cursor: "pointer",
                color: t.text.muted, fontSize: 13,
                transition: "all 0.12s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.border.focus; e.currentTarget.style.color = t.accent.cyan; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border.subtle; e.currentTarget.style.color = t.text.muted; }}
              >+</div>
            </div>
          )}
        </div>

        {/* Hover action bar */}
        {hovered && (
          <div style={{
            position: "absolute", top: 6, right: 20,
            display: "flex", gap: 2,
            background: t.bg.elevated,
            border: `1px solid ${t.border.default}`,
            borderRadius: t.radius.full,
            padding: "3px 6px",
            boxShadow: t.shadow.card,
          }}>
            {["😄", "👍", "🙌", "💬", "✏️", "⋯"].map((icon, i) => (
              <button key={i} style={{
                width: 28, height: 28, borderRadius: t.radius.full, border: "none",
                background: "transparent", cursor: "pointer", fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: t.text.secondary, transition: "all 0.1s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = t.bg.hover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {icon}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

// ── Chat Input ─────────────────────────────────────────────────
const ChatInput = () => {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ padding: "12px 16px 16px" }}>
      <div style={{
        background: t.bg.elevated,
        border: `1.5px solid ${focused ? t.border.focus : t.border.default}`,
        borderRadius: t.radius.xl,
        transition: "border-color 0.15s",
        boxShadow: focused ? `0 0 0 3px ${t.accent.cyanGlow}` : t.shadow.input,
        overflow: "hidden",
      }}>
        {/* Text area */}
        <div style={{ padding: "10px 14px 0" }}>
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Message #design"
            rows={1}
            style={{
              width: "100%", background: "transparent", border: "none", outline: "none",
              color: t.text.primary, fontSize: 14, lineHeight: 1.5, resize: "none",
              fontFamily: "inherit", minHeight: 24,
              "::placeholder": { color: t.text.muted },
            }}
          />
        </div>

        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 2,
          padding: "6px 8px",
        }}>
          {[
            { icon: "😊", label: "Emoji" },
            { icon: "🎬", label: "GIF" },
            { icon: "🎤", label: "Voice" },
            { icon: "📎", label: "Attach" },
            { icon: "B", label: "Bold", mono: true },
            { icon: "/", label: "Code", mono: true },
          ].map((action) => (
            <button key={action.label} title={action.label} style={{
              width: 30, height: 30, borderRadius: t.radius.full, border: "none",
              background: "transparent", cursor: "pointer",
              color: t.text.muted, fontSize: action.mono ? 13 : 16,
              fontWeight: action.mono ? 700 : 400, fontFamily: action.mono ? "monospace" : "inherit",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.12s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = t.bg.hover; e.currentTarget.style.color = t.text.secondary; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.text.muted; }}
            >
              {action.icon}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {/* Send button */}
          <button style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: t.radius.full, border: "none",
            background: value.trim()
              ? `linear-gradient(135deg, ${t.accent.cyan}, ${t.accent.blue})`
              : t.bg.hover,
            cursor: value.trim() ? "pointer" : "default",
            color: value.trim() ? "#020617" : t.text.muted,
            fontSize: 14, fontWeight: 700, transition: "all 0.15s",
            boxShadow: value.trim() ? t.shadow.glow : "none",
          }}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Chat Area ──────────────────────────────────────────────────
const ChatArea = () => (
  <div style={{
    flex: 1, display: "flex", flexDirection: "column",
    background: t.bg.base, minWidth: 0,
  }}>
    {/* Channel Header */}
    <div style={{
      height: 52, display: "flex", alignItems: "center", gap: 10,
      padding: "0 20px", flexShrink: 0,
      borderBottom: `1px solid ${t.border.subtle}`,
      background: t.bg.base,
      backdropFilter: "blur(12px)",
    }}>
      <span style={{ color: t.accent.cyan, fontWeight: 700, fontSize: 17 }}>#</span>
      <span style={{ fontWeight: 700, fontSize: 15, color: t.text.primary, letterSpacing: "-0.01em" }}>design</span>
      <div style={{ width: 1, height: 16, background: t.border.default, margin: "0 4px" }} />
      <span style={{ fontSize: 12.5, color: t.text.muted }}>Design system, components & visual direction</span>
      <div style={{ flex: 1 }} />
      {/* Header actions */}
      {["🔍", "👥", "📌", "⋯"].map((icon, i) => (
        <button key={i} style={{
          width: 32, height: 32, borderRadius: t.radius.full, border: "none",
          background: "transparent", cursor: "pointer",
          color: t.text.muted, fontSize: 15,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.12s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = t.bg.elevated; e.currentTarget.style.color = t.text.secondary; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.text.muted; }}
        >
          {icon}
        </button>
      ))}
      {/* Member avatars */}
      <div style={{ display: "flex", marginLeft: 4 }}>
        {[{ i: "MC", c: "#22d3ee" }, { i: "AR", c: "#818cf8" }, { i: "JK", c: "#34d399" }].map((a, idx) => (
          <div key={idx} style={{ marginLeft: idx > 0 ? -6 : 0 }}>
            <Avatar initials={a.i} color={a.c} size={24} />
          </div>
        ))}
        <div style={{
          width: 24, height: 24, borderRadius: t.radius.full, marginLeft: -6,
          background: t.bg.elevated, border: `1.5px solid ${t.bg.base}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, color: t.text.muted, fontWeight: 600,
        }}>+4</div>
      </div>
    </div>

    {/* Messages */}
    <div style={{ flex: 1, overflowY: "auto", paddingTop: 8, paddingBottom: 4 }}>
      {messages.map((msg, i) => (
        <Message key={msg.id} msg={msg} prevSender={i > 0 ? messages[i - 1].sender : null} />
      ))}

      {/* Typing indicator */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 20px 4px", opacity: 0.85,
      }}>
        <div style={{ width: 36, display: "flex", justifyContent: "center", paddingTop: 2 }}>
          <Avatar initials="AR" color="#818cf8" size={22} />
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: t.radius.full,
          background: t.bg.elevated, border: `1px solid ${t.border.subtle}`,
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: t.radius.full,
              background: t.text.muted,
              animation: `bounce ${0.8}s ease ${i * 0.15}s infinite`,
            }} />
          ))}
        </div>
        <span style={{ fontSize: 12, color: t.text.muted }}>
          <span style={{ color: "#818cf8", fontWeight: 500 }}>Alex</span> is typing…
        </span>
      </div>
    </div>

    {/* Input */}
    <ChatInput />
  </div>
);

// ── App Shell ──────────────────────────────────────────────────
export default function OrbitChatMockup() {
  const [activeRoom, setActiveRoom] = useState(3);

  return (
    <div style={{
      width: "100%", height: "100vh", display: "flex", flexDirection: "column",
      background: t.bg.base, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: t.text.primary, overflow: "hidden",
      // Bounce animation keyframes via style tag injection
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        textarea::placeholder { color: #475569; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 9999px; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{
        height: 44, flexShrink: 0, display: "flex", alignItems: "center",
        padding: "0 16px", background: t.bg.surface,
        borderBottom: `1px solid ${t.border.subtle}`,
        gap: 8,
      }}>
        {/* Window controls (cosmetic) */}
        <div style={{ display: "flex", gap: 6, marginRight: 8 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
            <div key={i} style={{ width: 11, height: 11, borderRadius: t.radius.full, background: c }} />
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{
          fontSize: 12.5, fontWeight: 600, color: t.text.muted,
          letterSpacing: "0.04em",
        }}>
          orbit-msg
        </span>
        <div style={{ flex: 1 }} />
        {["🔔", "👤"].map((icon, i) => (
          <button key={i} style={{
            width: 30, height: 30, borderRadius: t.radius.full, border: "none",
            background: "transparent", cursor: "pointer", color: t.text.muted,
            fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = t.bg.elevated; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <Sidebar activeRoom={activeRoom} setActiveRoom={setActiveRoom} />
        <ChatArea />
      </div>
    </div>
  );
}
