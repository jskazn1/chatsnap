# Surge — Product Roadmap

**Live:** https://surge-bitfit.web.app  
**Repo:** https://github.com/jskazn1/surge

---

## ✅ Phase 1: Foundation — COMPLETE

- [x] React 18 + Vite + Firebase v10 modular SDK
- [x] Tailwind CSS v4 (utility-first, no config file)
- [x] Firebase Authentication — Google OAuth popup + email/password
- [x] User profiles — avatar upload, camera capture, display name
- [x] PWA with service worker and web manifest
- [x] Firebase Hosting deployed at surge-bitfit.web.app
- [x] Renamed app from ChatSnap → Surge

---

## ✅ Phase 2: Core Messaging — COMPLETE

- [x] Room-based chat with real-time Firestore sync
- [x] Direct messages (1:1 conversations)
- [x] User search to start new DMs
- [x] Message editing and deletion (author-only)
- [x] Emoji reactions on messages
- [x] Reply/quote threading
- [x] Typing indicators
- [x] Push notifications (FCM + Cloud Functions)

---

## ✅ Phase 3: Community & Safety — COMPLETE

- [x] Room directory — browse, create, join public rooms
- [x] Private rooms with invite codes
- [x] Block/mute users
- [x] Report messages
- [x] Message search (client-side full-text)
- [x] GIF picker (Tenor API)
- [x] Voice messages (MediaRecorder + Firebase Storage)
- [x] Markdown rendering (bold, italic, code blocks, strikethrough, auto-links)
- [x] Message pinning

---

## 🚧 Phase 4: Scale & Polish — IN PROGRESS

**Theme:** Make Surge fast, polished, and ready for real users.

### 4.1 Performance
- [ ] Code splitting + lazy loading for routes (reduce initial bundle from ~825kb)
- [ ] Image thumbnails via Cloud Function (resize on upload, serve smaller previews)
- [ ] Lazy load images in chat (IntersectionObserver)
- [ ] Firestore offline persistence (`enableIndexedDbPersistence`)
- [ ] Paginated message history (infinite scroll beyond the 100-message limit)

### 4.2 UX Polish
- [ ] Message send/receive animations (subtle slide-in)
- [ ] Swipe left to reply on mobile
- [ ] Drag-and-drop file/image sharing into chat
- [ ] Keyboard shortcuts (e.g. `/` to search, `Esc` to close panels)
- [ ] Unread message counts + badge on rooms/DMs in sidebar
- [ ] Read receipts (show who's seen a message)
- [ ] Link previews with Open Graph metadata
- [ ] Accessibility audit (WCAG 2.1 AA)

### 4.3 Analytics & Monitoring
- [ ] Error monitoring — Sentry or Firebase Crashlytics
- [ ] Usage analytics — Firebase Analytics or PostHog
- [ ] Performance monitoring — Firebase Performance SDK

### 4.4 Moderation Upgrades
- [ ] Profanity filter (Cloud Function or client-side wordlist)
- [ ] Rate limiting on message sends (Firestore security rules)
- [ ] Admin dashboard for reviewing reports

---

## 🔮 Phase 5: Platform Expansion

**Theme:** Take Surge beyond the browser.

### 5.1 Mobile
- [ ] PWA optimization for iOS/Android (install prompt, splash screens, haptics)
- [ ] Or: React Native app sharing the Firebase backend

### 5.2 Power Features
- [ ] Threads / sub-conversations in rooms
- [ ] Message scheduling ("send later")
- [ ] File attachments beyond photos (PDF, docs via Cloud Storage)
- [ ] Room bots / webhooks API

### 5.3 Monetization (Optional)
- [ ] Custom room themes (premium)
- [ ] Increased file upload limits (premium)
- [ ] API access for integrations/bots

---

## Current Priority Order

| # | Item | Impact | Effort |
|---|------|--------|--------|
| 1 | Code splitting (lazy routes) | 🔥 High | Low |
| 2 | Unread counts in sidebar | 🔥 High | Medium |
| 3 | Message animations | Medium | Low |
| 4 | Offline persistence | Medium | Low |
| 5 | Error monitoring (Sentry) | 🔥 High | Low |
| 6 | Image thumbnails | Medium | High |
| 7 | Swipe to reply (mobile) | Medium | Medium |
| 8 | Link previews | Medium | High |
| 9 | Drag-and-drop uploads | Medium | Medium |
| 10 | Accessibility audit | Medium | High |

---

## Deployment Checklist (after each change)

```bash
git pull
npm run build        # must succeed with 0 errors
firebase deploy --only hosting
```

Then verify live at https://surge-bitfit.web.app
