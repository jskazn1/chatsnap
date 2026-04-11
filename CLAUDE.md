# Surge — Project Context for Claude

## Overview
Surge is a real-time chat/messaging web app built with React 18 + Firebase v10 + Vite + Tailwind CSS v4. It supports room-based chat, direct messages, voice messages, GIFs, markdown formatting, and more.

## Live App
**URL:** https://surge-bitfit.web.app

## Tech Stack
- **Frontend:** React 18, React Router v6, react-icons v5, Tailwind CSS v4
- **Backend:** Firebase v10 modular SDK (Firestore, Auth, Storage, Cloud Messaging)
- **Build:** Vite 5 with `@vitejs/plugin-react` and `vite-plugin-pwa`
- **Hosting:** Firebase Hosting (site: `surge-bitfit`, project: Firebase)
- **Cloud Functions:** Firebase Cloud Functions (in `/functions/`)

## Project Structure
```
surge/
├── index.html              # Vite entry HTML (root, not public/)
├── vite.config.js          # Vite config with React + PWA plugins
├── firebase.json           # Firebase hosting config (public: "build", site: "surge-bitfit")
├── .firebaserc             # Firebase project pointer (do not change)
├── package.json            # Dependencies and scripts
├── firestore.rules         # Firestore security rules
├── functions/              # Firebase Cloud Functions
│   └── index.js            # FCM notification triggers
└── src/
    ├── main.jsx            # React 18 createRoot entry point
    ├── App.jsx             # Main app shell (layout, routing)
    ├── App.css             # Intentionally empty (styles use Tailwind)
    ├── media.css           # Intentionally empty (styles use Tailwind)
    ├── index.css           # Tailwind v4 entry (@import "tailwindcss")
    ├── db.ts               # Firebase init + all Firestore/Storage operations
    ├── AuthContext.tsx     # Auth context/provider (Google popup + email/password)
    ├── Login.jsx           # Login page
    ├── Profile.jsx         # Profile editor (avatar, display name)
    ├── Sidebar.jsx         # Room list + DM conversations + user search
    ├── ChatView.jsx        # Main chat view (messages, input, actions)
    ├── RoomDirectory.jsx   # Room browsing, creation, and joining
    ├── MessageRenderer.jsx # Markdown-subset renderer (bold, italic, code, links)
    ├── GifPicker.jsx       # Tenor GIF search and picker
    ├── VoiceMessage.jsx    # Voice recorder + player components
    └── notifications.ts    # FCM client-side (permission, foreground messages)
```

## Key Architecture Decisions

### Styling
- **Tailwind CSS v4** — all styles via utility classes, no CSS modules or styled-components
- `@import "tailwindcss"` in `index.css`, plugin via `@tailwindcss/vite` in `vite.config.js`
- Design: dark slate-900/950 background, indigo-500/600 accent, purple gradients

### Firebase Auth
- Google sign-in uses `signInWithPopup` (NOT redirect — avoids cross-domain issues)
- `authDomain` set to `surge-bitfit.web.app` so popup shows the Surge domain
- Email/password auth also supported

### Firebase Data Model
- **`rooms` collection:** Room metadata. Fields: `name`, `slug`, `description`, `isPrivate`, `joinCode`, `memberCount`, `members`, `createdBy`
- **`rooms/{id}/messages` subcollection:** Room messages. Fields: `text`, `uid`, `displayName`, `photoURL`, `createdAt`, `reactions`, `replyTo`, `gifUrl`, `voiceUrl`, `imageUrl`
- **`conversations` collection:** DM conversations. Fields: `participants`, `lastMessage`, `lastAt`
- **`conversations/{id}/messages` subcollection:** DM messages (same shape as room messages)
- **`users` collection:** User profiles. Fields: `displayName`, `email`, `photoURL`, `blockedUsers`, `fcmToken`
- **`typing` collection:** Ephemeral typing indicators (map of uid → timestamp)
- **`reports` collection:** Message reports

## Commands
- `npm run dev` — Start Vite dev server
- `npm run build` — Production build (outputs to `build/`)
- `npm run preview` — Preview production build locally
- `firebase deploy --only hosting` — Deploy to surge-bitfit.web.app

## Implementation Status
### Completed
- [x] Vite + React 18 + Firebase v10 + Tailwind CSS v4
- [x] Firebase Authentication (Google popup + email/password)
- [x] User profiles with avatar upload and camera capture
- [x] PWA with service worker
- [x] Direct messages
- [x] Message editing, deletion, reactions
- [x] Reply/quote threading
- [x] Typing indicators + real-time updates
- [x] Push notifications (FCM + Cloud Functions)
- [x] Room directory (create, browse, join, private rooms with join codes)
- [x] Block/mute users
- [x] Report messages
- [x] Message search
- [x] GIF picker (Tenor API)
- [x] Voice messages (MediaRecorder + Firebase Storage)
- [x] Markdown message rendering (bold, italic, code blocks, strikethrough, auto-links)

### Completed (Phase 4 — Scale & Polish)
- [x] Code splitting and lazy loading (React.lazy + Suspense for Profile, RoomDirectory, JoinRoom, Settings, RoomSettings)
- [x] Image optimization — canvas compression (max 800px, JPEG 80%) before Firebase Storage upload
- [x] Offline support — Firestore IndexedDB persistence via `initializeFirestore` + `persistentLocalCache`
- [x] Error monitoring — `ErrorBoundary.jsx` (catches render errors) + `window.unhandledrejection` handler in `main.jsx`
- [x] Message animations — `msg-enter` keyframe, `reaction-pop`, `fade-up`, `slide-in-left`, `badge-pulse` in `index.css`
- [x] Accessibility (WCAG 2.1 AA) — `role="log"` on feed, `aria-label` on all icon buttons, `role="alert"` on error banners, `role="toolbar"` on message actions, Escape key closes mobile sidebar overlay
- [x] Dedicated routes: `/profile`, `/settings` (lazy-loaded, behind `ProtectedRoute`)

### Completed (Phase 5 — Brand & Navigation)
- [x] Rebrand to **violet** accent (`violet-*` / `purple-*`) across all components — distinct from Discord/Slack/Teams blue
- [x] **Inter** font loaded via Google Fonts for premium, modern typography
- [x] Updated `theme-color` and PWA manifest color to `#7c3aed` (violet-600)
- [x] **"Spaces" navigation** — Sidebar fully redesigned with card-based room grid and contact-card DM view. Tab switcher (Rooms | People) replaces the flat list paradigm. Room cards show icon, name, description, member count, and color-coded accents per room.
- [x] Settings page (`/settings`) — toggles for notifications, appearance, security; sign-out action

### Completed (Phase 6 — Moderation)
- [x] **Slow mode** — per-room cooldown (5s / 10s / 30s / 1min / 5min). Firestore field `slowMode` on room doc. Client shows amber countdown banner; input is disabled during cooldown.
- [x] **Word filter** — `blockedWords[]` on room doc. Client-side check before send. Room settings UI to manage the list.
- [x] **Timeout system** — `roomBans: { uid → { until: Timestamp, reason } }` on room doc. Moderators see a shield icon with 1/5/10/60min options on non-own messages.
- [x] **Room moderators** — `moderators[]` array on room doc. Mods can timeout users, delete any message.
- [x] **RoomSettings panel** (`RoomSettings.jsx`) — accessible to room owner/mods via shield button in channel header. Configures slow mode, word filter, and moderator list.
- [x] **Firestore security rules** updated — bans enforced at database level (banned users' `create` rejected); mod-only fields protected; message length capped at 4000 chars; `roomMeta` and `userReads` access tightened.

---

## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately – don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I now, implement the elegant solution"
- Skip this for simple, obvious fixes – don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests – then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.


## Session Protocol

Before ending any session on this project:
1. Commit all changes with a descriptive message
2. Update PROGRESS.md with what was done and what's next
3. Ensure the project builds/runs cleanly
4. Leave no half-implemented features — either complete the current task or revert

## Init Commands
```bash
npm run dev                           # Vite dev server (localhost:5173)
firebase deploy                       # deploy to surge-bitfit.web.app
firebase deploy --only functions      # Cloud Functions only
firebase deploy --only hosting        # hosting only
```
