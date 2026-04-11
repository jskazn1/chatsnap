# Orbit Codebase Audit Report
**Date:** 2026-03-19
**Scope:** Full source audit — React/TypeScript frontend + Firebase backend
**Stack:** React 19, Vite 6, Firebase v11, Tailwind CSS v4, TypeScript 5.8

---

## Executive Summary

The codebase is well-structured and covers a solid feature set. However, **7 confirmed bugs were found** — 3 are critical blockers that silently break core functionality (unread tracking, push notifications, DM privacy). Most issues are straightforward fixes.

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 4 |
| 🟠 HIGH | 6 |
| 🟡 MEDIUM | 7 |
| 🟢 LOW | 9 |
| **Total** | **26** |

---

## 🔴 CRITICAL — Must Fix

### C-1 · Cloud Functions: Wrong Field Names
**File:** `functions/index.js` — lines 31, 75

Push notifications are **broken in production**. The functions reference fields that don't exist in the message schema.

```js
// ❌ BROKEN (line 31)
title: `${message.name} in #${message.room}`,

// ✅ CORRECT
title: `${message.displayName} in a room`,
```

```js
// ❌ BROKEN (line 75) — schema uses `participants`, not `participantIds`
const otherUids = convo.participantIds.filter(...)

// ✅ CORRECT
const otherUids = convo.participants.filter(...)
```

Also, `onNewRoomMessage` listens to `messages/{messageId}` (top-level), but room messages live at `rooms/{id}/messages/{messageId}`. The trigger path is wrong.

```js
// ❌ Wrong trigger path
onDocumentCreated("messages/{messageId}", ...)

// ✅ Correct
onDocumentCreated("rooms/{roomId}/messages/{messageId}", ...)
```

---

### C-2 · Firestore Security: Any Authenticated User Can Read Any DM
**File:** `firestore.rules` — line 86

```
match /messages/{messageId} {
  allow read: if request.auth != null;  ← ❌ No participant check!
```

Any logged-in user can read *any* conversation's messages by knowing or guessing the `convoId`. The parent `conversations` document has a proper participant check (line 74–75) but the subcollection does not inherit it.

**Fix:**
```
match /messages/{messageId} {
  allow read: if request.auth != null
    && request.auth.uid in get(/databases/$(database)/documents/conversations/$(convoId)).data.participants;
```

---

### C-3 · ChatView: Room Messages Bypass Unread Tracking
**File:** `src/ChatView.jsx` — lines 168, 182, 221, 510

Room messages are sent via raw `addDoc`, skipping `sendRoomMessage()` which stamps `roomMeta/{slug}.lastMessageAt`. This means **unread badges never update for room messages**.

```js
// ❌ Current (4 places)
await addDoc(collection(db, 'rooms', roomName, 'messages'), { ...msg, createdAt: serverTimestamp() })

// ✅ Fix — use the wrapper that also updates roomMeta
import { sendRoomMessage } from './db'
await sendRoomMessage(roomName, msg)
```

---

### C-4 · TypeScript Error: `import.meta.env` type missing
**File:** `src/notifications.ts` — line 19
**Error:** `Property 'env' does not exist on type 'ImportMeta'`

The `tsconfig.json` is missing `"types": ["vite/client"]` so Vite's augmentations are not loaded.

**Fix in `tsconfig.json`:**
```json
"compilerOptions": {
  "types": ["vite/client"]
}
```

---

## 🟠 HIGH — Should Fix Soon

### H-1 · Client-Side Slow Mode Bypass
**File:** `src/ChatView.jsx` — lines 132–140

Slow mode is enforced only in the client with a `useRef`. Any user with browser dev tools can bypass it. **Move enforcement to Firestore rules** using `request.time` and `resource.data`.

---

### H-2 · Storage: Any File Can Be Uploaded to Root Path
**File:** `storage.rules` — line 3

The `match /{imageId}` rule allows any authenticated user to write *any file* to the root bucket path. While content-type is checked, there's no path scoping per user.

**Fix:** Add a user-scoped path:
```
match /images/{userId}/{filename} {
  allow write: if request.auth != null && request.auth.uid == userId
    && request.resource.size < 5 * 1024 * 1024
    && request.resource.contentType.matches('image/.*');
}
```

---

### H-3 · Hardcoded Tenor API Key
**File:** `src/GifPicker.jsx` — line 4

```js
const TENOR_KEY = 'AIzaSyAyImkuYQYF_FXVALexPuGQctUMRURdCHQ'
```

Move to `.env` as `VITE_TENOR_KEY` and update `GifPicker.jsx`:
```js
const TENOR_KEY = import.meta.env.VITE_TENOR_KEY || ''
```

Add `VITE_TENOR_KEY=your_key` to `.env`.

---

### H-4 · Unread Count: Missing Null Guards
**File:** `src/App.jsx` — lines 119–134

The unread comparison `lastMsg > lastRead` can fail if `lastMsg` is `undefined` (no messages yet in a room). This causes false unread badges.

```js
// Add null guard
const hasUnread = lastMsg && lastMsg.toMillis() > (lastRead?.toMillis?.() ?? 0)
```

---

### H-5 · Word Filter: Easily Bypassed
**File:** `src/ChatView.jsx` and `src/db.ts`

Client-side substring matching can be bypassed with Unicode lookalike characters, spaces, or multi-line breaks. Best practice: apply this server-side in a Cloud Function and add normalization before matching.

---

### H-6 · Settings Toggles: UI State Not Persisted
**File:** `src/Settings.jsx`

`notifMessages`, `notifMentions`, `soundEnabled`, `compactMode`, `showAvatars`, `twoFactor` are all `useState` but never written to Firestore/localStorage. Changing them has no effect — they reset on page reload.

Either implement persistence or remove these toggles from the UI to avoid misleading users.

---

## 🟡 MEDIUM — Fix in Next Iteration

### M-1 · Missing Error Handling in Send Functions
Several async calls have no try/catch:
- `ChatView.jsx:166` — `sendDM()` can throw
- `Sidebar.jsx:184` — `createOrGetConversation()` can throw
- `Profile.jsx:62–75` — avatar upload can fail silently
- `VoiceMessage.jsx` — upload failure is not surfaced to user

---

### M-2 · Room Trigger Path: Cloud Functions Won't Fire
**File:** `functions/index.js` — line 8

```js
// ❌ Wrong — this collection doesn't exist at root level
onDocumentCreated("messages/{messageId}", ...)

// ✅ Correct room message path
onDocumentCreated("rooms/{roomId}/messages/{messageId}", ...)
```

---

### M-3 · No Skeleton Loaders
Message list shows a spinner but no skeleton. This is a UX degradation, especially noticeable on slow connections.

---

### M-4 · Accessibility: Missing `aria-label` on Icon Buttons
Several icon-only buttons lack accessible labels. Example: reaction buttons, pin button, delete button in `ChatView.jsx`.

---

### M-5 · Password Validation Too Weak
**File:** `src/AuthContext.tsx`

Only `length >= 6` is checked. Consider enforcing at least 8 characters with mixed complexity.

---

### M-6 · Typing Listener Memory Leak Risk
**File:** `src/db.ts` — `useOnlineUsers()` line 457–477

Creates N individual snapshot listeners (one per DM partner UID). If a user has many DMs, this produces excessive real-time connections. Consolidate into a single `in` query.

---

### M-7 · `import.meta.env.VITE_FIREBASE_VAPID_KEY` Silent Failure
**File:** `src/notifications.ts`

If `VITE_FIREBASE_VAPID_KEY` is not set, `getToken()` silently fails. Add a startup warning:
```ts
if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) {
  console.warn('[notifications] VITE_FIREBASE_VAPID_KEY is not set — push notifications disabled')
}
```

---

## 🟢 LOW — Polish Items

| # | Issue | File |
|---|-------|------|
| L-1 | Magic numbers scattered (GROUP_GAP_MS, pagination 100, etc.) — extract to `constants.ts` | Various |
| L-2 | `placeholder="slur1&#10;spam phrase"` — HTML entity instead of newline | `RoomSettings.jsx:142` |
| L-3 | GIF images missing descriptive alt text (empty `content_description`) | `GifPicker.jsx:88` |
| L-4 | Timer leak if voice recorder component unmounts mid-recording | `VoiceMessage.jsx:52` |
| L-5 | Message character counter missing (Firestore 4000-char limit not surfaced to user) | `ChatView.jsx` |
| L-6 | Mod-add by raw UID — no validation that UID exists before adding | `RoomSettings.jsx:195` |
| L-7 | `Settings.jsx` has unused `useEffect` import after `theme` effect | `Settings.jsx` |
| L-8 | `LinkPreview.jsx` URL regex could match malformed URLs | `LinkPreview.jsx:5` |
| L-9 | `orbit-chat-mockup.jsx` / `orbit-mockup-render.jsx` at root are stale artifacts | Root dir |

---

## ✅ What's Working Well

- **Firestore rules for rooms and conversations** (parent documents) are correctly written
- **Conversation deduplication** correctly sorts UIDs before querying (`[uid1, uid2].sort()`)
- **Storage rules for avatars** are properly user-scoped
- **Error boundary** is in place (`ErrorBoundary.jsx`)
- **Unhandled rejection** global handler in `main.jsx`
- **TypeScript strict mode** is enabled
- **PWA / service worker** setup is correct
- **Offline persistence** via `initializeFirestore` + `persistentLocalCache`
- **Code splitting** with React.lazy on all heavy routes

---

## Recommended Fix Priority

```
Week 1 (blockers):
  C-1 Fix Cloud Functions field names + trigger path
  C-2 Fix DM message read security rule
  C-3 Replace addDoc with sendRoomMessage in ChatView
  C-4 Add "vite/client" types to tsconfig

Week 2 (important):
  H-3 Move Tenor API key to .env
  H-6 Implement or remove Settings toggles
  H-1 Move slow mode to server-side check

Week 3 (polish):
  M-1 Add error handling to send functions
  M-7 Add VAPID key startup warning
  L-1 Extract constants
```
