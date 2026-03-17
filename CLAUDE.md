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

### Remaining (Phase 4 — Scale & Polish)
- [ ] Code splitting and lazy loading
- [ ] Image optimization (thumbnails)
- [x] Offline support with Firestore persistence
- [ ] Error monitoring
- [ ] Message animations and transitions
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Mobile-optimized swipe gestures
