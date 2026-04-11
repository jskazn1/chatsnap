import { useState } from "react";

// ===== Design Tokens (matching Orbit's violet palette) =====
const tokens = {
  colors: {
    bg: "#0c0b10",
    bgPanel: "#0f0e14",
    bgSurface: "#161420",
    bgHover: "#1c1a24",
    bgActive: "#221f2e",
    border: "rgba(255,255,255,0.06)",
    borderStrong: "rgba(255,255,255,0.1)",
    violet: "#7c3aed",
    violetLight: "#a78bfa",
    violetFaint: "rgba(124,58,237,0.15)",
    violetGlow: "rgba(124,58,237,0.08)",
    white: "#ffffff",
    textPrimary: "#e2e0ec",
    textSecondary: "#8b87a0",
    textMuted: "#5a566b",
    textLink: "#a78bfa",
    green: "#22c55e",
    amber: "#f59e0b",
  },
  radius: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
  font: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
};

// ===== Room color dots =====
const ROOM_DOTS = {
  home: "#7c3aed",
  general: "#3b82f6",
  random: "#ec4899",
  announcements: "#f59e0b",
  design: "#06b6d4",
  dev: "#10b981",
};

// ===== Mock data =====
const NOW = Date.now();
const MSGS = [
  // Group 1 — Jordan, multiple consecutive
  { id: 1, uid: "u1", name: "Jordan K.", avatar: "J", ts: NOW - 1000 * 60 * 47, text: "hey everyone, just pushed the new sidebar redesign to the branch 🎉" },
  { id: 2, uid: "u1", name: "Jordan K.", avatar: "J", ts: NOW - 1000 * 60 * 46, text: "lemme know if anything looks off on mobile" },
  { id: 3, uid: "u1", name: "Jordan K.", avatar: "J", ts: NOW - 1000 * 60 * 45, text: "I tested on iPhone 14 and Pixel 7 — looks solid" },
  // Group 2 — Alex
  { id: 4, uid: "u2", name: "Alex R.", avatar: "A", ts: NOW - 1000 * 60 * 40, text: "nice! the compact channel rows are *much* better than the old cards" },
  { id: 5, uid: "u2", name: "Alex R.", avatar: "A", ts: NOW - 1000 * 60 * 39, text: "feels a lot more like Discord now", hasReactions: true, reactions: { "👍": ["u1", "u3"], "🔥": ["u1"] } },
  // Group 3 — Maya (with reply)
  { id: 6, uid: "u3", name: "Maya L.", avatar: "M", ts: NOW - 1000 * 60 * 32, text: "the message grouping is the best part — conversation actually reads like a conversation now", replyTo: { name: "Jordan K.", text: "lemme know if anything looks off on mobile" } },
  // Group 4 — Jordan again (>5min gap, new group)
  { id: 7, uid: "u1", name: "Jordan K.", avatar: "J", ts: NOW - 1000 * 60 * 20, text: "also added date separators and relative timestamps — helps with context a lot" },
  { id: 8, uid: "u1", name: "Jordan K.", avatar: "J", ts: NOW - 1000 * 60 * 19, text: "deploying in ~10 min" },
  // Group 5 — Alex
  { id: 9, uid: "u2", name: "Alex R.", avatar: "A", ts: NOW - 1000 * 60 * 12, text: "can't wait 🚀" },
  // Group 6 — Jordan (single)
  { id: 10, uid: "u1", name: "Jordan K.", avatar: "J", ts: NOW - 1000 * 60 * 2, text: "deployed! check it out at surge-bitfit.web.app" },
];

const ROOMS = [
  { slug: "home", name: "home", unread: false },
  { slug: "general", name: "general", unread: true },
  { slug: "random", name: "random", unread: true },
  { slug: "announcements", name: "announcements", unread: false },
  { slug: "design", name: "design", unread: false },
  { slug: "dev", name: "dev", unread: true },
];

const DMS = [
  { id: "dm1", name: "Alex Rivera", avatar: "A", ts: NOW - 1000 * 60 * 5, last: "sounds good, I'll review later", unread: true },
  { id: "dm2", name: "Maya Lee", avatar: "M", ts: NOW - 1000 * 60 * 60, last: "thanks for the heads up!", unread: false },
  { id: "dm3", name: "Sam Torres", avatar: "S", ts: NOW - 1000 * 60 * 60 * 3, last: "let me check the PR", unread: false },
];

// ===== Helpers =====
function relTime(ts) {
  const diff = Math.floor((NOW - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function timeStr(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Group messages: same uid, < 5 min apart
function groupMessages(msgs) {
  const GROUP_GAP = 5 * 60 * 1000;
  return msgs.map((msg, i) => {
    const prev = msgs[i - 1];
    const isGrouped =
      prev &&
      prev.uid === msg.uid &&
      msg.ts - prev.ts < GROUP_GAP &&
      !msg.replyTo; // replies always start a new group visually
    return { ...msg, isGrouped };
  });
}

// ===== Avatar =====
function Avatar({ letter, size = 32, color = tokens.colors.violet }) {
  const colors = { J: "#7c3aed", A: "#3b82f6", M: "#ec4899", S: "#10b981" };
  const bg = colors[letter] || color;
  return (
    <div style={{
      width: size, height: size, borderRadius: tokens.radius.full,
      background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: size * 0.4, fontWeight: 700,
      flexShrink: 0, fontFamily: tokens.font,
    }}>
      {letter}
    </div>
  );
}

// ===== Reaction pill =====
function ReactionPill({ emoji, count, active }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: tokens.radius.full,
      background: active ? tokens.colors.violetFaint : "rgba(255,255,255,0.05)",
      border: `1px solid ${active ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.08)"}`,
      fontSize: 12, color: active ? tokens.colors.violetLight : tokens.colors.textSecondary,
      cursor: "pointer",
    }}>
      {emoji} {count}
    </span>
  );
}

// ===== Date separator =====
function DateSeparator({ label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      margin: "16px 0 8px", padding: "0 16px",
    }}>
      <div style={{ flex: 1, height: 1, background: tokens.colors.border }} />
      <span style={{
        fontSize: 11, fontWeight: 600, color: tokens.colors.textMuted,
        letterSpacing: "0.05em", textTransform: "uppercase",
        fontFamily: tokens.font,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: tokens.colors.border }} />
    </div>
  );
}

// ===== Message item =====
function MessageItem({ msg, currentUid }) {
  const [hovered, setHovered] = useState(false);
  const isOwn = msg.uid === currentUid;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", gap: 12, padding: msg.isGrouped ? "2px 16px" : "6px 16px",
        background: hovered ? "rgba(255,255,255,0.025)" : "transparent",
        borderRadius: tokens.radius.lg,
        transition: "background 0.1s",
        position: "relative",
        marginTop: msg.isGrouped ? 0 : 4,
      }}
    >
      {/* Left column — avatar or spacer */}
      <div style={{ width: 36, flexShrink: 0 }}>
        {!msg.isGrouped ? (
          <Avatar letter={msg.avatar} size={36} />
        ) : (
          // Hover-reveal timestamp in the avatar slot
          <span style={{
            display: hovered ? "block" : "none",
            fontSize: 10, color: tokens.colors.textMuted,
            lineHeight: "36px", textAlign: "center",
            fontFamily: tokens.font,
          }}>
            {timeStr(msg.ts)}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header row — only on first message of group */}
        {!msg.isGrouped && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
            <span style={{
              fontSize: 14, fontWeight: 600, color: tokens.colors.textPrimary,
              fontFamily: tokens.font,
            }}>
              {msg.name}
            </span>
            <span style={{
              fontSize: 11, color: tokens.colors.textMuted,
              fontFamily: tokens.font,
            }}>
              {timeStr(msg.ts)}
            </span>
          </div>
        )}

        {/* Reply quote */}
        {msg.replyTo && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            borderLeft: `2px solid ${tokens.colors.borderStrong}`,
            paddingLeft: 8, marginBottom: 4,
            color: tokens.colors.textSecondary, fontSize: 12,
            fontFamily: tokens.font,
          }}>
            <span style={{ color: tokens.colors.violetLight, fontWeight: 600 }}>{msg.replyTo.name}:</span>
            <span style={{ opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>
              {msg.replyTo.text}
            </span>
          </div>
        )}

        {/* Text */}
        <p style={{
          margin: 0, fontSize: 14, color: tokens.colors.textPrimary,
          lineHeight: 1.5, fontFamily: tokens.font, wordBreak: "break-word",
        }}>
          {msg.text}
        </p>

        {/* Reactions */}
        {msg.hasReactions && (
          <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
            {Object.entries(msg.reactions).map(([emoji, uids]) => (
              <ReactionPill key={emoji} emoji={emoji} count={uids.length} active={uids.includes(currentUid)} />
            ))}
          </div>
        )}
      </div>

      {/* Hover actions */}
      {hovered && (
        <div style={{
          position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
          display: "flex", gap: 2,
          background: tokens.colors.bgSurface,
          border: `1px solid ${tokens.colors.border}`,
          borderRadius: tokens.radius.lg,
          padding: "2px 4px",
        }}>
          {["😊", "↩", "✏️", "🗑️"].map(icon => (
            <button key={icon} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "4px 6px", borderRadius: tokens.radius.md,
              fontSize: 13, opacity: 0.7,
              transition: "opacity 0.1s, background 0.1s",
            }}
              onMouseEnter={e => { e.target.style.opacity = 1; e.target.style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={e => { e.target.style.opacity = 0.7; e.target.style.background = "none"; }}
            >
              {icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Empty state =====
function EmptyState({ roomName }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 48, textAlign: "center",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: tokens.radius.xl,
        background: tokens.colors.violetFaint,
        border: `1px solid rgba(124,58,237,0.2)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 32, marginBottom: 16,
      }}>
        #
      </div>
      <h3 style={{
        margin: "0 0 8px", fontSize: 18, fontWeight: 700,
        color: tokens.colors.textPrimary, fontFamily: tokens.font,
      }}>
        Welcome to #{roomName}!
      </h3>
      <p style={{
        margin: 0, fontSize: 14, color: tokens.colors.textSecondary,
        maxWidth: 280, lineHeight: 1.6, fontFamily: tokens.font,
      }}>
        This is the very beginning of the <strong style={{ color: tokens.colors.textPrimary }}>#{roomName}</strong> channel. Say something to get the conversation started.
      </p>
    </div>
  );
}

// ===== Compact channel row =====
function ChannelRow({ room, isActive, onClick }) {
  const [hovered, setHovered] = useState(false);
  const dotColor = ROOM_DOTS[room.slug] || tokens.colors.textMuted;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8,
        padding: "5px 10px", borderRadius: tokens.radius.md,
        background: isActive ? tokens.colors.bgActive : hovered ? tokens.colors.bgHover : "transparent",
        border: "none", cursor: "pointer", textAlign: "left",
        transition: "background 0.1s",
      }}
    >
      {/* Color dot */}
      <div style={{
        width: 6, height: 6, borderRadius: tokens.radius.full,
        background: isActive ? dotColor : room.unread ? dotColor : tokens.colors.textMuted,
        opacity: isActive ? 1 : room.unread ? 0.8 : 0.35,
        flexShrink: 0,
        boxShadow: (isActive || room.unread) ? `0 0 6px ${dotColor}80` : "none",
      }} />

      {/* Hash icon */}
      <span style={{
        fontSize: 14, color: isActive ? tokens.colors.violetLight : room.unread ? tokens.colors.textPrimary : tokens.colors.textMuted,
        fontFamily: tokens.font, fontWeight: isActive ? 600 : room.unread ? 600 : 400,
        flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        # {room.name}
      </span>

      {/* Unread badge */}
      {room.unread && !isActive && (
        <div style={{
          width: 8, height: 8, borderRadius: tokens.radius.full,
          background: tokens.colors.violet, flexShrink: 0,
        }} />
      )}
    </button>
  );
}

// ===== DM row =====
function DMRow({ dm, isActive, onClick }) {
  const [hovered, setHovered] = useState(false);
  const colors = { A: "#3b82f6", M: "#ec4899", S: "#10b981", J: "#7c3aed" };
  const avatarBg = colors[dm.avatar] || tokens.colors.violet;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8,
        padding: "5px 10px", borderRadius: tokens.radius.md,
        background: isActive ? tokens.colors.bgActive : hovered ? tokens.colors.bgHover : "transparent",
        border: "none", cursor: "pointer", textAlign: "left",
        transition: "background 0.1s",
      }}
    >
      {/* Mini avatar */}
      <div style={{
        width: 24, height: 24, borderRadius: tokens.radius.full,
        background: `linear-gradient(135deg, ${avatarBg}, ${avatarBg}bb)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0,
        fontFamily: tokens.font,
      }}>
        {dm.avatar}
      </div>

      <span style={{
        fontSize: 13, color: isActive ? tokens.colors.white : dm.unread ? tokens.colors.textPrimary : tokens.colors.textSecondary,
        fontFamily: tokens.font, fontWeight: isActive ? 600 : dm.unread ? 600 : 400,
        flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {dm.name}
      </span>

      {dm.unread && !isActive && (
        <div style={{
          width: 8, height: 8, borderRadius: tokens.radius.full,
          background: tokens.colors.violet, flexShrink: 0,
        }} />
      )}
    </button>
  );
}

// ===== Input bar =====
function InputBar({ placeholder }) {
  const [value, setValue] = useState("");

  const iconBtn = (icon, label) => (
    <button
      key={label}
      title={label}
      style={{
        background: "none", border: "none", cursor: "pointer",
        padding: "6px", borderRadius: tokens.radius.md,
        color: tokens.colors.textSecondary, fontSize: 18,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "color 0.1s, background 0.1s",
        flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.color = tokens.colors.textPrimary; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
      onMouseLeave={e => { e.currentTarget.style.color = tokens.colors.textSecondary; e.currentTarget.style.background = "none"; }}
    >
      {icon}
    </button>
  );

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4,
      padding: "10px 16px", borderTop: `1px solid ${tokens.colors.border}`,
      background: tokens.colors.bgPanel,
    }}>
      {iconBtn("📷", "Take photo")}
      {iconBtn("GIF", "Send GIF")}

      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, background: "rgba(255,255,255,0.05)",
          border: `1px solid ${tokens.colors.border}`,
          borderRadius: tokens.radius.xl, padding: "8px 16px",
          color: tokens.colors.textPrimary, fontSize: 14,
          fontFamily: tokens.font, outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={e => e.target.style.borderColor = tokens.colors.violet}
        onBlur={e => e.target.style.borderColor = tokens.colors.border}
      />

      {iconBtn("🎙️", "Record voice")}
      <button
        style={{
          background: value.trim() ? tokens.colors.violet : tokens.colors.bgSurface,
          border: "none", cursor: value.trim() ? "pointer" : "default",
          padding: "8px 10px", borderRadius: tokens.radius.lg,
          color: value.trim() ? "#fff" : tokens.colors.textMuted,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.15s, color 0.15s",
          fontSize: 16, flexShrink: 0,
        }}
      >
        ➤
      </button>
    </div>
  );
}

// ===== Main mockup =====
export default function OrbitPhase7() {
  const [activeRoom, setActiveRoom] = useState("general");
  const [activeTab, setActiveTab] = useState("rooms");
  const [activeDM, setActiveDM] = useState(null);
  const [showEmpty, setShowEmpty] = useState(false);

  const grouped = groupMessages(MSGS);
  const currentUid = "u1";

  return (
    <div style={{
      display: "flex", height: "100vh", fontFamily: tokens.font,
      background: tokens.colors.bg, color: tokens.colors.textPrimary,
      overflow: "hidden",
    }}>

      {/* ══════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════ */}
      <aside style={{
        width: 232, flexShrink: 0,
        background: tokens.colors.bg,
        borderRight: `1px solid ${tokens.colors.border}`,
        display: "flex", flexDirection: "column",
      }}>

        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 16px 10px",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: tokens.radius.lg,
            background: "linear-gradient(135deg, #7c3aed, #9333ea)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, boxShadow: "0 2px 10px rgba(124,58,237,0.3)",
          }}>
            🌀
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: tokens.colors.white }}>
            Orbit
          </span>
          <div style={{ flex: 1 }} />
          <button style={{
            background: "none", border: "none", cursor: "pointer",
            color: tokens.colors.textMuted, fontSize: 14, padding: 4,
            borderRadius: tokens.radius.sm,
          }}>⊞</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", padding: "0 8px 8px", gap: 2 }}>
          {["rooms", "people"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: "6px 0", borderRadius: tokens.radius.md,
                background: activeTab === tab ? tokens.colors.violetFaint : "none",
                border: "none", cursor: "pointer",
                color: activeTab === tab ? tokens.colors.violetLight : tokens.colors.textMuted,
                fontSize: 12, fontWeight: 600, fontFamily: tokens.font,
                textTransform: "capitalize", transition: "all 0.15s",
              }}
            >
              {tab === "rooms" ? "Rooms" : "People"}
            </button>
          ))}
        </div>

        <div style={{ height: 1, background: tokens.colors.border, margin: "0 12px 8px" }} />

        {/* Channel/DM list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
          {activeTab === "rooms" && (
            <>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                color: tokens.colors.textMuted, textTransform: "uppercase",
                padding: "4px 10px 4px", marginBottom: 2,
              }}>
                Channels
              </div>
              {ROOMS.map(room => (
                <ChannelRow
                  key={room.slug}
                  room={room}
                  isActive={!activeDM && activeRoom === room.slug}
                  onClick={() => { setActiveRoom(room.slug); setActiveDM(null); }}
                />
              ))}

              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                color: tokens.colors.textMuted, textTransform: "uppercase",
                padding: "12px 10px 4px", marginBottom: 2,
              }}>
                + Add Channel
              </div>
            </>
          )}

          {activeTab === "people" && (
            <>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                color: tokens.colors.textMuted, textTransform: "uppercase",
                padding: "4px 10px 4px", marginBottom: 2,
              }}>
                Direct Messages
              </div>
              {DMS.map(dm => (
                <DMRow
                  key={dm.id}
                  dm={dm}
                  isActive={activeDM === dm.id}
                  onClick={() => { setActiveDM(dm.id); }}
                />
              ))}
            </>
          )}
        </div>

        {/* User area */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 12px",
          borderTop: `1px solid ${tokens.colors.border}`,
        }}>
          <Avatar letter="J" size={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.textPrimary, fontFamily: tokens.font }}>
              Jordan K.
            </div>
            <div style={{ fontSize: 10, color: tokens.colors.green, fontFamily: tokens.font }}>
              ● Online
            </div>
          </div>
          <button style={{
            background: "none", border: "none", cursor: "pointer",
            color: tokens.colors.textMuted, fontSize: 15, padding: 2,
          }}>⚙</button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN CHAT AREA
      ══════════════════════════════════════════ */}
      <main style={{
        flex: 1, display: "flex", flexDirection: "column",
        background: tokens.colors.bgPanel, minWidth: 0,
      }}>

        {/* Channel header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 20px",
          borderBottom: `1px solid ${tokens.colors.border}`,
          background: tokens.colors.bgPanel,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 18, color: tokens.colors.textMuted }}>#</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: tokens.colors.white, fontFamily: tokens.font }}>
              {activeDM ? DMS.find(d => d.id === activeDM)?.name : activeRoom}
            </div>
            <div style={{ fontSize: 11, color: tokens.colors.textMuted, fontFamily: tokens.font }}>
              {activeDM ? "Direct message" : "6 members · Real-time team chat"}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button style={{
            background: "none", border: "none", cursor: "pointer",
            color: tokens.colors.textMuted, fontSize: 15,
            padding: "4px 8px", borderRadius: tokens.radius.md,
            fontFamily: tokens.font, fontSize: 13,
          }}
            onClick={() => setShowEmpty(e => !e)}
          >
            🔄 {showEmpty ? "Show messages" : "Show empty state"}
          </button>
          <button style={{
            background: "none", border: "none", cursor: "pointer",
            color: tokens.colors.textMuted, fontSize: 15,
          }}>🔍</button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "8px 0",
          display: "flex", flexDirection: "column",
        }}>
          {showEmpty ? (
            <EmptyState roomName={activeRoom} />
          ) : (
            <>
              <DateSeparator label="Yesterday" />
              <MessageItem msg={{ ...grouped[0], isGrouped: false }} currentUid={currentUid} />
              <MessageItem msg={grouped[1]} currentUid={currentUid} />
              <MessageItem msg={grouped[2]} currentUid={currentUid} />
              <DateSeparator label="Today" />
              {grouped.slice(3).map(msg => (
                <MessageItem key={msg.id} msg={msg} currentUid={currentUid} />
              ))}
              {/* Typing indicator */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "6px 16px", marginTop: 4,
              }}>
                <Avatar letter="A" size={20} />
                <div style={{
                  display: "flex", gap: 3, alignItems: "center",
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: tokens.colors.textMuted,
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: tokens.colors.textMuted, fontFamily: tokens.font }}>
                  Alex is typing…
                </span>
              </div>
            </>
          )}
        </div>

        {/* Input */}
        <InputBar placeholder={`Message #${activeRoom}`} />
      </main>

      {/* ══════════════════════════════════════════
          ANNOTATIONS PANEL
      ══════════════════════════════════════════ */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: tokens.colors.bg,
        borderLeft: `1px solid ${tokens.colors.border}`,
        padding: "20px 16px",
        overflowY: "auto",
      }}>
        <h3 style={{
          margin: "0 0 16px", fontSize: 12, fontWeight: 700,
          color: tokens.colors.textMuted, letterSpacing: "0.08em",
          textTransform: "uppercase", fontFamily: tokens.font,
        }}>
          Phase 7 Changes
        </h3>

        {[
          {
            icon: "💬",
            title: "Message grouping",
            desc: "Consecutive messages from the same user collapse the avatar+name+timestamp. Hover shows the time. New group on >5min gap or reply.",
          },
          {
            icon: "📋",
            title: "Compact sidebar",
            desc: "Room cards replaced with 36px single-line rows. Color dot preserves identity. 12+ channels visible vs 5 before.",
          },
          {
            icon: "📅",
            title: "Date separators",
            desc: '"Yesterday", "Today" dividers break the feed into scannable chunks. Relative timestamps ("3h ago") replace absolute clock times.',
          },
          {
            icon: "🌱",
            title: "Empty state",
            desc: "New rooms now show a welcoming empty state instead of a blank dark void. Toggle the button in the header to preview.",
          },
          {
            icon: "🎙️",
            title: "Icon-only input bar",
            desc: 'Voice button is now an icon (🎙️) matching camera and GIF — no more text label. Consistent visual weight across all toolbar actions.',
          },
          {
            icon: "✨",
            title: "Hover actions",
            desc: "Message action toolbar appears as a floating pill on hover — react, reply, edit, delete. No permanent clutter.",
          },
        ].map(item => (
          <div key={item.title} style={{
            marginBottom: 16, padding: "10px 12px",
            background: tokens.colors.bgSurface,
            borderRadius: tokens.radius.lg,
            border: `1px solid ${tokens.colors.border}`,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6, marginBottom: 4,
            }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span style={{
                fontSize: 12, fontWeight: 700, color: tokens.colors.textPrimary,
                fontFamily: tokens.font,
              }}>
                {item.title}
              </span>
            </div>
            <p style={{
              margin: 0, fontSize: 11, color: tokens.colors.textSecondary,
              lineHeight: 1.55, fontFamily: tokens.font,
            }}>
              {item.desc}
            </p>
          </div>
        ))}

        <div style={{
          padding: "10px 12px",
          background: tokens.colors.violetFaint,
          borderRadius: tokens.radius.lg,
          border: `1px solid rgba(124,58,237,0.2)`,
        }}>
          <p style={{
            margin: 0, fontSize: 11, color: tokens.colors.violetLight,
            lineHeight: 1.55, fontFamily: tokens.font,
          }}>
            💡 <strong>Tip:</strong> Hover over messages to see the grouped timestamp and action toolbar. Click "Show empty state" to preview the new first-time room experience.
          </p>
        </div>
      </aside>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
