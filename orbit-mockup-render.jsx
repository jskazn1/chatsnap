import { useState } from "react";

const tokens = {
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
  white: "#ffffff",
  textPrimary: "#e2e0ec",
  textSecondary: "#8b87a0",
  textMuted: "#5a566b",
  green: "#22c55e",
  font: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
};

const ROOM_DOTS = {
  home: "#7c3aed", general: "#3b82f6", random: "#ec4899",
  announcements: "#f59e0b", design: "#06b6d4", dev: "#10b981",
};
const AVATAR_COLORS = { J: "#7c3aed", A: "#3b82f6", M: "#ec4899", S: "#10b981" };

const NOW = Date.now();
const MSGS_RAW = [
  { id:1, uid:"u1", name:"Jordan K.", av:"J", ts: NOW-47*60000, text:"hey everyone, just pushed the new sidebar redesign to the branch 🎉" },
  { id:2, uid:"u1", name:"Jordan K.", av:"J", ts: NOW-46*60000, text:"lemme know if anything looks off on mobile" },
  { id:3, uid:"u1", name:"Jordan K.", av:"J", ts: NOW-45*60000, text:"tested on iPhone 14 and Pixel 7 — looks solid" },
  { id:4, uid:"u2", name:"Alex R.",   av:"A", ts: NOW-40*60000, text:"nice! the compact channel rows are *much* better than the old cards" },
  { id:5, uid:"u2", name:"Alex R.",   av:"A", ts: NOW-39*60000, text:"feels way more like Discord now", reactions:{"👍":["u1","u3"],"🔥":["u1"]} },
  { id:6, uid:"u3", name:"Maya L.",   av:"M", ts: NOW-32*60000, text:"message grouping is the best part — conversation actually reads like a conversation", replyTo:{name:"Jordan K.",text:"lemme know if anything looks off on mobile"} },
  { id:7, uid:"u1", name:"Jordan K.", av:"J", ts: NOW-20*60000, text:"also added date separators and relative timestamps — helps orient you in long chats" },
  { id:8, uid:"u1", name:"Jordan K.", av:"J", ts: NOW-19*60000, text:"deploying in ~10 min" },
  { id:9, uid:"u2", name:"Alex R.",   av:"A", ts: NOW-12*60000, text:"can't wait 🚀" },
  { id:10,uid:"u1", name:"Jordan K.", av:"J", ts: NOW- 2*60000, text:"deployed! surge-bitfit.web.app" },
];

function groupMsgs(msgs) {
  const GAP = 5*60*1000;
  return msgs.map((m,i) => {
    const p = msgs[i-1];
    return { ...m, grouped: p && p.uid===m.uid && m.ts-p.ts<GAP && !m.replyTo };
  });
}

function timeFmt(ts) {
  return new Date(ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
}

function Avatar({ letter, size=32 }) {
  const bg = AVATAR_COLORS[letter]||"#7c3aed";
  return (
    <div style={{width:size,height:size,borderRadius:9999,background:`linear-gradient(135deg,${bg},${bg}99)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:size*.38,fontWeight:700,flexShrink:0,fontFamily:tokens.font}}>
      {letter}
    </div>
  );
}

function Msg({ msg, me }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"flex",gap:12,padding:msg.grouped?"2px 20px":"6px 20px",background:hov?"rgba(255,255,255,0.025)":"transparent",borderRadius:12,transition:"background .1s",position:"relative",marginTop:msg.grouped?0:4}}>
      <div style={{width:36,flexShrink:0,display:"flex",alignItems:"flex-start",paddingTop:2}}>
        {!msg.grouped
          ? <Avatar letter={msg.av} size={36}/>
          : <span style={{display:hov?"block":"none",fontSize:10,color:tokens.textMuted,textAlign:"center",width:"100%",paddingTop:4,fontFamily:tokens.font}}>{timeFmt(msg.ts)}</span>
        }
      </div>
      <div style={{flex:1,minWidth:0}}>
        {!msg.grouped && (
          <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:2}}>
            <span style={{fontSize:14,fontWeight:600,color:tokens.textPrimary,fontFamily:tokens.font}}>{msg.name}</span>
            <span style={{fontSize:11,color:tokens.textMuted,fontFamily:tokens.font}}>{timeFmt(msg.ts)}</span>
          </div>
        )}
        {msg.replyTo && (
          <div style={{display:"flex",alignItems:"center",gap:6,borderLeft:`2px solid ${tokens.borderStrong}`,paddingLeft:8,marginBottom:4,fontSize:12,color:tokens.textSecondary,fontFamily:tokens.font}}>
            <span style={{color:tokens.violetLight,fontWeight:600}}>{msg.replyTo.name}:</span>
            <span style={{opacity:.7,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:220}}>{msg.replyTo.text}</span>
          </div>
        )}
        <p style={{margin:0,fontSize:14,color:tokens.textPrimary,lineHeight:1.5,fontFamily:tokens.font,wordBreak:"break-word"}}>{msg.text}</p>
        {msg.reactions && (
          <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>
            {Object.entries(msg.reactions).map(([e,u])=>(
              <span key={e} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:999,background:u.includes(me)?"rgba(124,58,237,.15)":"rgba(255,255,255,.05)",border:`1px solid ${u.includes(me)?"rgba(124,58,237,.4)":"rgba(255,255,255,.08)"}`,fontSize:12,color:u.includes(me)?tokens.violetLight:tokens.textSecondary,cursor:"pointer"}}>
                {e} {u.length}
              </span>
            ))}
          </div>
        )}
      </div>
      {hov && (
        <div style={{position:"absolute",right:20,top:"50%",transform:"translateY(-50%)",display:"flex",gap:2,background:tokens.bgSurface,border:`1px solid ${tokens.border}`,borderRadius:10,padding:"2px 4px",zIndex:10}}>
          {["😊","↩️","✏️","🗑️"].map(ic=>(
            <button key={ic} style={{background:"none",border:"none",cursor:"pointer",padding:"3px 6px",borderRadius:6,fontSize:13,opacity:.75}} onMouseEnter={e=>{e.target.style.opacity=1;e.target.style.background="rgba(255,255,255,.08)"}} onMouseLeave={e=>{e.target.style.opacity=.75;e.target.style.background="none"}}>{ic}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function DateSep({ label }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,margin:"16px 20px 8px"}}>
      <div style={{flex:1,height:1,background:tokens.border}}/>
      <span style={{fontSize:11,fontWeight:600,color:tokens.textMuted,letterSpacing:".06em",textTransform:"uppercase",fontFamily:tokens.font}}>{label}</span>
      <div style={{flex:1,height:1,background:tokens.border}}/>
    </div>
  );
}

function EmptyState({ room }) {
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:48,textAlign:"center"}}>
      <div style={{width:72,height:72,borderRadius:16,background:"rgba(124,58,237,.15)",border:"1px solid rgba(124,58,237,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,marginBottom:16}}>#</div>
      <h3 style={{margin:"0 0 8px",fontSize:18,fontWeight:700,color:tokens.textPrimary,fontFamily:tokens.font}}>Welcome to #{room}!</h3>
      <p style={{margin:0,fontSize:14,color:tokens.textSecondary,maxWidth:280,lineHeight:1.6,fontFamily:tokens.font}}>This is the very beginning of <strong style={{color:tokens.textPrimary}}>#{room}</strong>. Say something to kick things off.</p>
    </div>
  );
}

function ChanRow({ slug, name, active, unread, onClick }) {
  const [hov, setHov]=useState(false);
  const dot=ROOM_DOTS[slug]||tokens.textMuted;
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"5px 10px",borderRadius:8,background:active?tokens.bgActive:hov?tokens.bgHover:"transparent",border:"none",cursor:"pointer",textAlign:"left",transition:"background .1s"}}>
      <div style={{width:6,height:6,borderRadius:999,background:active||unread?dot:tokens.textMuted,opacity:active?1:unread?.8:.3,flexShrink:0,boxShadow:(active||unread)?`0 0 5px ${dot}80`:"none"}}/>
      <span style={{fontSize:13,color:active?tokens.violetLight:unread?tokens.textPrimary:tokens.textSecondary,fontFamily:tokens.font,fontWeight:active||unread?600:400,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}># {name}</span>
      {unread&&!active&&<div style={{width:8,height:8,borderRadius:999,background:tokens.violet,flexShrink:0}}/>}
    </button>
  );
}

function DMRow({ dm, active, onClick }) {
  const [hov,setHov]=useState(false);
  const bg=AVATAR_COLORS[dm.av]||tokens.violet;
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"5px 10px",borderRadius:8,background:active?tokens.bgActive:hov?tokens.bgHover:"transparent",border:"none",cursor:"pointer",textAlign:"left",transition:"background .1s"}}>
      <div style={{width:24,height:24,borderRadius:999,background:`linear-gradient(135deg,${bg},${bg}99)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700,flexShrink:0,fontFamily:tokens.font}}>{dm.av}</div>
      <span style={{fontSize:13,color:active?tokens.white:dm.unread?tokens.textPrimary:tokens.textSecondary,fontFamily:tokens.font,fontWeight:active||dm.unread?600:400,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dm.name}</span>
      {dm.unread&&!active&&<div style={{width:8,height:8,borderRadius:999,background:tokens.violet}}/>}
    </button>
  );
}

const ROOMS = [
  {slug:"home",name:"home",unread:false},{slug:"general",name:"general",unread:true},
  {slug:"random",name:"random",unread:true},{slug:"announcements",name:"announcements",unread:false},
  {slug:"design",name:"design",unread:false},{slug:"dev",name:"dev",unread:true},
];
const DMS=[
  {id:"d1",name:"Alex Rivera",av:"A",unread:true},
  {id:"d2",name:"Maya Lee",av:"M",unread:false},
  {id:"d3",name:"Sam Torres",av:"S",unread:false},
];

export default function Mockup() {
  const [room,setRoom]=useState("general");
  const [tab,setTab]=useState("rooms");
  const [dm,setDm]=useState(null);
  const [empty,setEmpty]=useState(false);
  const [input,setInput]=useState("");
  const msgs=groupMsgs(MSGS_RAW);

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:tokens.font,background:tokens.bg,color:tokens.textPrimary,overflow:"hidden"}}>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}} * { box-sizing: border-box; }`}</style>

      {/* SIDEBAR */}
      <aside style={{width:228,flexShrink:0,background:tokens.bg,borderRight:`1px solid ${tokens.border}`,display:"flex",flexDirection:"column"}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 14px 10px"}}>
          <div style={{width:30,height:30,borderRadius:10,background:"linear-gradient(135deg,#7c3aed,#9333ea)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,boxShadow:"0 2px 10px rgba(124,58,237,.3)"}}>🌀</div>
          <span style={{fontWeight:700,fontSize:15,color:tokens.white,fontFamily:tokens.font}}>Orbit</span>
          <div style={{flex:1}}/>
          <span style={{fontSize:12,color:tokens.textMuted}}>⊞</span>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",padding:"0 8px 8px",gap:2}}>
          {["rooms","people"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"6px 0",borderRadius:8,background:tab===t?"rgba(124,58,237,.15)":"none",border:"none",cursor:"pointer",color:tab===t?tokens.violetLight:tokens.textMuted,fontSize:12,fontWeight:600,fontFamily:tokens.font,textTransform:"capitalize",transition:"all .15s"}}>
              {t==="rooms"?"Rooms":"People"}
            </button>
          ))}
        </div>
        <div style={{height:1,background:tokens.border,margin:"0 10px 8px"}}/>

        {/* List */}
        <div style={{flex:1,overflowY:"auto",padding:"0 6px"}}>
          {tab==="rooms" && <>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:".08em",color:tokens.textMuted,textTransform:"uppercase",padding:"4px 10px 4px",marginBottom:2}}>Channels</div>
            {ROOMS.map(r=><ChanRow key={r.slug} {...r} active={!dm&&room===r.slug} onClick={()=>{setRoom(r.slug);setDm(null)}}/>)}
            <div style={{fontSize:10,fontWeight:700,letterSpacing:".08em",color:tokens.textMuted,textTransform:"uppercase",padding:"12px 10px 4px",cursor:"pointer"}}>＋ Add Channel</div>
          </>}
          {tab==="people" && <>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:".08em",color:tokens.textMuted,textTransform:"uppercase",padding:"4px 10px 4px",marginBottom:2}}>Direct Messages</div>
            {DMS.map(d=><DMRow key={d.id} dm={d} active={dm===d.id} onClick={()=>setDm(d.id)}/>)}
          </>}
        </div>

        {/* User chip */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderTop:`1px solid ${tokens.border}`}}>
          <Avatar letter="J" size={28}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:tokens.textPrimary,fontFamily:tokens.font}}>Jordan K.</div>
            <div style={{fontSize:10,color:tokens.green,fontFamily:tokens.font}}>● Online</div>
          </div>
          <span style={{color:tokens.textMuted,fontSize:14,cursor:"pointer"}}>⚙</span>
        </div>
      </aside>

      {/* CHAT */}
      <main style={{flex:1,display:"flex",flexDirection:"column",background:tokens.bgPanel,minWidth:0}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 20px",borderBottom:`1px solid ${tokens.border}`,flexShrink:0}}>
          <span style={{fontSize:16,color:tokens.textMuted}}>#</span>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:tokens.white,fontFamily:tokens.font}}>{dm?DMS.find(d=>d.id===dm)?.name:room}</div>
            <div style={{fontSize:11,color:tokens.textMuted,fontFamily:tokens.font}}>{dm?"Direct message":"6 members · team chat"}</div>
          </div>
          <div style={{flex:1}}/>
          <button onClick={()=>setEmpty(e=>!e)} style={{background:"rgba(124,58,237,.15)",border:"1px solid rgba(124,58,237,.25)",borderRadius:8,padding:"5px 10px",fontSize:11,color:tokens.violetLight,cursor:"pointer",fontFamily:tokens.font,fontWeight:600,whiteSpace:"nowrap"}}>
            {empty?"💬 Messages":"🌱 Empty state"}
          </button>
          <span style={{color:tokens.textMuted,fontSize:16,cursor:"pointer",marginLeft:4}}>🔍</span>
        </div>

        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",padding:"8px 0",display:"flex",flexDirection:"column"}}>
          {empty
            ? <EmptyState room={room}/>
            : <>
                <DateSep label="Yesterday"/>
                <Msg msg={{...msgs[0],grouped:false}} me="u1"/>
                <Msg msg={msgs[1]} me="u1"/>
                <Msg msg={msgs[2]} me="u1"/>
                <DateSep label="Today"/>
                {msgs.slice(3).map(m=><Msg key={m.id} msg={m} me="u1"/>)}
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 20px",marginTop:2}}>
                  <Avatar letter="A" size={20}/>
                  <div style={{display:"flex",gap:3}}>
                    {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:tokens.textMuted,animation:`bounce 1.2s ease ${i*.2}s infinite`}}/>)}
                  </div>
                  <span style={{fontSize:12,color:tokens.textMuted,fontFamily:tokens.font}}>Alex is typing…</span>
                </div>
              </>
          }
        </div>

        {/* Input */}
        <div style={{display:"flex",alignItems:"center",gap:4,padding:"10px 16px",borderTop:`1px solid ${tokens.border}`,background:tokens.bgPanel,flexShrink:0}}>
          {["📷","GIF"].map(ic=>(
            <button key={ic} style={{background:"none",border:"none",cursor:"pointer",padding:"6px",borderRadius:8,color:tokens.textSecondary,fontSize:ic==="GIF"?11:17,fontWeight:"GIF"===ic?700:400,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"color .1s"}} onMouseEnter={e=>e.currentTarget.style.color=tokens.textPrimary} onMouseLeave={e=>e.currentTarget.style.color=tokens.textSecondary}>{ic}</button>
          ))}
          <input value={input} onChange={e=>setInput(e.target.value)} placeholder={`Message #${dm?DMS.find(d=>d.id===dm)?.name:room}…`}
            style={{flex:1,background:"rgba(255,255,255,.05)",border:`1px solid ${tokens.border}`,borderRadius:20,padding:"8px 16px",color:tokens.textPrimary,fontSize:14,fontFamily:tokens.font,outline:"none",transition:"border-color .15s"}}
            onFocus={e=>e.target.style.borderColor=tokens.violet} onBlur={e=>e.target.style.borderColor=tokens.border}
          />
          <button title="Record voice" style={{background:"none",border:"none",cursor:"pointer",padding:"6px",borderRadius:8,color:tokens.textSecondary,fontSize:17,display:"flex",alignItems:"center",flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.color=tokens.textPrimary} onMouseLeave={e=>e.currentTarget.style.color=tokens.textSecondary}>🎙️</button>
          <button style={{background:input.trim()?tokens.violet:"rgba(255,255,255,.06)",border:"none",cursor:input.trim()?"pointer":"default",padding:"8px 11px",borderRadius:10,color:input.trim()?"#fff":tokens.textMuted,display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s,color .15s",fontSize:15,flexShrink:0}}>➤</button>
        </div>
      </main>

      {/* ANNOTATIONS */}
      <aside style={{width:236,flexShrink:0,background:tokens.bg,borderLeft:`1px solid ${tokens.border}`,padding:"20px 14px",overflowY:"auto"}}>
        <p style={{margin:"0 0 14px",fontSize:11,fontWeight:700,color:tokens.textMuted,letterSpacing:".08em",textTransform:"uppercase",fontFamily:tokens.font}}>Phase 7 Changes</p>
        {[
          {icon:"💬",title:"Message grouping",desc:"Consecutive messages collapse avatar + name + timestamp. Hover the left gutter to reveal the time. Groups break at 5+ min gaps or replies."},
          {icon:"📋",title:"Compact sidebar",desc:"Room cards → 36px channel rows with color dot. Fits 12+ channels vs 5 before. Color dot preserves room identity."},
          {icon:"📅",title:"Date separators",desc:"'Yesterday' / 'Today' dividers break the feed. Relative clock times keep context without date arithmetic."},
          {icon:"🌱",title:"Empty state",desc:"New rooms show a welcoming empty state. Click the toggle button above to preview it."},
          {icon:"🎙️",title:"Icon-only toolbar",desc:"Voice button is now an icon matching camera & GIF — no text label. All toolbar items have equal visual weight."},
          {icon:"⚡️",title:"Hover actions",desc:"Floating action pill appears on hover — react, reply, edit, delete. Zero permanent clutter in the feed."},
        ].map(it=>(
          <div key={it.title} style={{marginBottom:12,padding:"9px 11px",background:tokens.bgSurface,borderRadius:10,border:`1px solid ${tokens.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
              <span style={{fontSize:13}}>{it.icon}</span>
              <span style={{fontSize:12,fontWeight:700,color:tokens.textPrimary,fontFamily:tokens.font}}>{it.title}</span>
            </div>
            <p style={{margin:0,fontSize:11,color:tokens.textSecondary,lineHeight:1.55,fontFamily:tokens.font}}>{it.desc}</p>
          </div>
        ))}
        <div style={{padding:"9px 11px",background:"rgba(124,58,237,.1)",borderRadius:10,border:"1px solid rgba(124,58,237,.2)"}}>
          <p style={{margin:0,fontSize:11,color:tokens.violetLight,lineHeight:1.55,fontFamily:tokens.font}}>💡 <strong>Try it:</strong> Hover messages to see timestamps + action toolbar. Switch sidebar tabs, click rooms, toggle empty state.</p>
        </div>
      </aside>
    </div>
  );
}
