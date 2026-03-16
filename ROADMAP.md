# ChatSnap Product Roadmap: Entering the Chat & Messaging Space

## Context
ChatSnap is a simple real-time chat app built in 2019 on React 16 + Firebase v7. It currently supports room-based text/photo messaging with no authentication. The goal is to evolve it into a competitive, modern messaging platform. The tech stack is severely outdated and the app lacks fundamental features users expect from chat apps (accounts, DMs, notifications, etc.).

---

## Phase 1: Foundation — "Make It Real"
**Theme:** Modernize the stack and add user accounts — the prerequisite for everything else.

### 1.1 Upgrade Dependencies
- Upgrade React 16 → React 18 (concurrent features, `useId`, improved Suspense)
- Upgrade Firebase v7 → Firebase v10+ modular SDK (tree-shaking, smaller bundle)
- Upgrade React Router v5 → v6 (data loaders, nested routes)
- Replace Create React App with Vite (faster builds, better DX)
- Replace `react-div-100vh` with CSS `dvh` units (native support now)
- Update `react-icons` to latest

**Files:** `package.json`, `src/db.js`, `src/App.js`, `src/index.js`, `vite.config.js` (new)

### 1.2 Firebase Authentication
- Add Firebase Auth (Google sign-in + email/password)
- Create auth context/provider wrapping the app
- Migrate from localStorage username to Firebase Auth user profiles
- Update Firestore rules to require authenticated users
- Store `uid`, `displayName`, `photoURL` on messages

**Files:** `src/auth.js` (new), `src/App.js`, `src/db.js`, `firestore.rules`

### 1.3 User Profiles
- Profile page with display name + avatar (from Google or uploaded)
- Store profiles in Firestore `users` collection
- Show avatars next to messages
- Online/offline presence indicator using Firebase Realtime Database

**Files:** `src/Profile.js` (new), `src/db.js`, `src/App.css`

### 1.4 Enable PWA
- Register the service worker
- Customize `manifest.json` with ChatSnap branding/icons
- Add install prompt for mobile users

**Files:** `src/index.js`, `public/manifest.json`

### Deliverable
A modern, authenticated chat app with user profiles and PWA install capability.

---

## Phase 2: Core Messaging — "Make It Useful"
**Theme:** Build the features users expect from any messaging app.

### 2.1 Direct Messages
- Add DM conversations (stored in `conversations` collection)
- User search/discovery to start new DMs
- Conversation list sidebar/page
- Unread message counts per conversation

**Files:** `src/DMs.js` (new), `src/ConversationList.js` (new), `src/db.js`

### 2.2 Enhanced Messages
- Message editing and deletion (author-only, update Firestore rules)
- Emoji reactions on messages (sub-collection or map field)
- Reply/quote threading (reference parent message ID)
- Link previews with Open Graph metadata
- File attachments beyond photos (PDF, docs — via Cloud Storage)
- Image gallery uploads from device (not just camera)

**Files:** `src/App.js`, `src/db.js`, `firestore.rules`, `storage.rules`

### 2.3 Real-Time Indicators
- Typing indicators (using Firestore or Realtime Database ephemeral docs)
- Read receipts (track `lastRead` timestamp per user per conversation)
- Online/offline status badges

**Files:** `src/TypingIndicator.js` (new), `src/db.js`

### 2.4 Push Notifications
- Firebase Cloud Messaging (FCM) integration
- Notify on new messages when app is backgrounded
- Notification preferences per conversation (mute/unmute)
- Requires a small Cloud Function to trigger notifications

**Files:** `src/notifications.js` (new), `functions/` (new directory for Cloud Functions)

### Deliverable
A fully functional messaging app with DMs, reactions, typing indicators, and push notifications.

---

## Phase 3: Community & Safety — "Make It Sticky"
**Theme:** Build features that create community and keep users safe.

### 3.1 Rooms 2.0
- Room creation UI with name, description, and avatar
- Public room directory (browse/join rooms)
- Private/invite-only rooms with join codes
- Room admin roles (kick, ban, pin messages)
- Pinned messages

**Files:** `src/RoomSettings.js` (new), `src/RoomDirectory.js` (new), `firestore.rules`

### 3.2 Moderation & Safety
- Block/mute users
- Report messages (stored in `reports` collection for review)
- Profanity filter (client-side or Cloud Function)
- Rate limiting on message sends (Firestore rules or Cloud Function)
- Admin dashboard for reviewing reports

**Files:** `src/moderation.js` (new), `functions/moderation.js` (new), `firestore.rules`

### 3.3 Search & History
- Full-text message search (Algolia or Firebase Extensions)
- Infinite scroll for message history (paginated queries beyond 100)
- Bookmarked/saved messages

**Files:** `src/Search.js` (new), `src/db.js`

### 3.4 Media & Rich Content
- GIF picker (Giphy/Tenor API integration)
- Voice messages (MediaRecorder API + Cloud Storage)
- Message formatting (bold, italic, code blocks — markdown subset)

**Files:** `src/GifPicker.js` (new), `src/VoiceMessage.js` (new), `src/MessageRenderer.js` (new)

### Deliverable
A community-ready platform with moderation tools, search, and rich media.

---

## Phase 4: Scale & Polish — "Make It Competitive"
**Theme:** Performance, polish, and platform expansion.

### 4.1 Performance & Reliability
- Code splitting and lazy loading for routes
- Image optimization (thumbnails via Cloud Function, lazy loading)
- Offline support with Firestore persistence
- Error monitoring (Sentry or Firebase Crashlytics)
- Analytics (Firebase Analytics or PostHog)

### 4.2 UX Polish
- Message animations and transitions
- Swipe gestures for reply/delete on mobile
- Drag-and-drop file sharing
- Keyboard shortcuts for power users
- Accessibility audit (WCAG 2.1 AA)

### 4.3 Platform Expansion
- React Native mobile app (sharing Firebase backend + Firestore logic)
- Desktop app via Electron or Tauri
- Or: keep it web-only PWA and optimize the mobile web experience

### 4.4 Monetization (Optional)
- Custom room themes/branding (premium)
- Increased file upload limits (premium)
- API access for integrations/bots

### Deliverable
A polished, performant, cross-platform messaging app ready for public launch.

---

## Implementation Priority Summary

| Priority | Item | Dependency |
|----------|------|------------|
| 1 | Upgrade dependencies (React 18, Firebase v10, Vite) | None |
| 2 | Firebase Authentication | Dependency upgrades |
| 3 | User profiles + avatars | Auth |
| 4 | Enable PWA | Dependency upgrades |
| 5 | Direct messages | Auth + profiles |
| 6 | Message editing/deletion + reactions | Auth |
| 7 | Typing indicators + read receipts | Auth |
| 8 | Push notifications | Auth + Cloud Functions |
| 9 | Room improvements | Auth |
| 10 | Moderation tools | Auth + rooms |
| 11 | Search | None (but better after scale) |
| 12 | Rich media (GIFs, voice, formatting) | None |
| 13 | Performance optimization | After feature complete |
| 14 | Mobile/desktop apps | After web is stable |

## Verification
After each phase:
- Run `npm run build` to verify no build errors
- Test all new features manually in browser
- Deploy to Firebase Hosting and verify in production
- Check Firestore rules with the Firebase Emulator Suite
- Monitor Firebase console for errors/usage
