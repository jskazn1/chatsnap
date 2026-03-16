# ChatSnap — Project Context for Claude Code

## Overview
ChatSnap is a real-time chat/messaging web app built with React 18 + Firebase v10 + Vite. It supports room-based chat, direct messages, voice messages, GIFs, markdown formatting, and more.

## Tech Stack
- **Frontend:** React 18, React Router v6, react-icons v5
- **Backend:** Firebase v10 modular SDK (Firestore, Auth, Storage, Cloud Messaging)
- **Build:** Vite 5 with `@vitejs/plugin-react` and `vite-plugin-pwa`
- **Hosting:** Firebase Hosting
- **Cloud Functions:** Firebase Cloud Functions (in `/functions/`)

## Project Structure
```
chatsnap/
├── index.html              # Vite entry HTML (root, not public/)
├── vite.config.js          # Vite config with React + PWA plugins
├── package.json            # Dependencies and scripts
├── firestore.rules         # Firestore security rules
├── functions/              # Firebase Cloud Functions
│   └── index.js            # FCM notification triggers
├── src/
│   ├── main.jsx            # React 18 createRoot entry point
│   ├── App.jsx             # Main app shell (layout, routing, header)
│   ├── App.css             # All component styles + theme variables
│   ├── media.css           # Responsive breakpoints
│   ├── db.js               # Firebase init + all Firestore operations
│   ├── AuthContext.jsx      # Auth context/provider (Google + email/password)
│   ├── Login.jsx            # Login page
│   ├── Profile.jsx          # Profile editor (avatar, display name)
│   ├── Sidebar.jsx          # Room list + DM conversations + user search
│   ├── ChatView.jsx         # Main chat view (messages, input, actions)
│   ├── RoomDirectory.jsx    # Room browsing, creation, and joining
│   ├── MessageRenderer.jsx  # Markdown-subset renderer (bold, italic, code, links)
│   ├── GifPicker.jsx        # Tenor GIF search and picker
│   ├── VoiceMessage.jsx     # Voice recorder + player components
│   └── notifications.js     # FCM client-side (permission, foreground messages)
└── ROADMAP.md               # Product roadmap (4 phases)
```

## Key Architecture Decisions

### Firebase Data Model
- **`messages` collection:** Room messages. Fields: `room`, `ts`, `name`, `uid`, `text`, `image`, `gif`, `voiceUrl`, `voiceDuration`, `reactions`, `replyTo`, `edited`
- **`conversations` collection:** DM conversations. Fields: `participantIds`, `participants` (map), `lastMessage`, `updatedAt`
  - **`conversations/{id}/messages` subcollection:** DM messages (same shape as room messages minus `room`)
- **`rooms` collection:** Room metadata. Fields: `name`, `slug`, `description`, `isPrivate`, `joinCode`, `createdBy`, `admins`, `members`, `pinnedMessages`
- **`users` collection:** User profiles. Fields: `displayName`, `email`, `photoURL`, `blockedUsers`, `fcmToken`
- **`typing` collection:** Ephemeral typing indicators (map of uid → {name, ts})
- **`reports` collection:** Message reports. Fields: `reporterUid`, `messageId`, `reason`, `messageText`, `status`

### Authentication
- Firebase Auth with Google OAuth and email/password
- Auth state managed via React context (`AuthContext.jsx`)
- All Firestore operations require auth (`request.auth != null`)

### Theming
- CSS custom properties for light/dark themes
- Theme stored in localStorage, applied via `data-theme` attribute on `<body>`
- Theme variables defined in `App.css` at the top

### Message Identity (Backward Compatibility)
- Old messages (pre-auth) have no `uid` field, only `name`
- Identity check: `m.uid ? m.uid === currentUid : m.name === currentName`

### Default Rooms
- Three hardcoded rooms always appear: `home`, `general`, `random`
- Dynamic rooms from Firestore `rooms` collection are merged below them in sidebar

## Commands
- `npm run dev` — Start Vite dev server
- `npm run build` — Production build (outputs to `dist/`)
- `npm run preview` — Preview production build locally

## Implementation Status

### Completed (Phases 1-3)
- [x] Vite + React 18 + Firebase v10 + Router v6 migration
- [x] Firebase Authentication (Google + email/password)
- [x] User profiles with avatar upload
- [x] PWA with service worker
- [x] Direct messages
- [x] Message editing, deletion, reactions
- [x] Reply/quote threading
- [x] Typing indicators + real-time updates
- [x] Push notifications (FCM + Cloud Functions)
- [x] Room directory (create, browse, join, private rooms)
- [x] Room admin features (pin messages, kick/ban users)
- [x] Block/mute users
- [x] Report messages
- [x] Message search
- [x] GIF picker (Tenor API)
- [x] Voice messages (MediaRecorder + Firebase Storage)
- [x] Markdown message rendering

### Remaining (Phase 4 — Scale & Polish)
- [ ] Code splitting and lazy loading
- [ ] Image optimization (thumbnails)
- [ ] Offline support with Firestore persistence
- [ ] Error monitoring
- [ ] Message animations and transitions
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Mobile-optimized swipe gestures

## Firestore Collections Quick Reference
| Collection | Key Fields | Access |
|---|---|---|
| `messages` | room, ts, name, uid, text, image, reactions | Auth required, author-only write |
| `conversations` | participantIds, participants, lastMessage | Participant-only read/write |
| `conversations/{id}/messages` | ts, name, uid, text | Auth required, author-only write |
| `rooms` | name, slug, isPrivate, admins, members, pinnedMessages | Auth required |
| `users` | displayName, email, photoURL, blockedUsers, fcmToken | Owner-only write |
| `typing` | {uid: {name, ts}} | Auth required, any write |
| `reports` | reporterUid, messageId, reason, status | Auth required |

## Important Notes
- Firebase config is in `src/db.js` (project: `jordansk-chatter202020`)
- All styles are in `src/App.css` and `src/media.css` — no CSS modules or styled-components
- The app uses `column-reverse` for message lists (newest at bottom, auto-scroll)
- Image uploads go to Firebase Storage under `photos/` and `voice/` paths
- The Tenor GIF API key is Google's public key (in `GifPicker.jsx`)
