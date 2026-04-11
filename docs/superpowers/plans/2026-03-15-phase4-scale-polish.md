# Phase 4: Scale & Polish Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Phase 4 of the ChatSnap roadmap — performance optimization, UX polish, accessibility, and bug fixes.

**Architecture:** Apply lazy loading to route-level components, add CSS transitions/animations throughout the UI, fix ARIA/accessibility gaps for WCAG 2.1 AA compliance, and fix known bugs (CSS class mismatch, voice message field naming). All changes are client-side React/CSS — no backend changes needed.

**Tech Stack:** React 18 (lazy/Suspense), Vite (code splitting via dynamic imports), CSS transitions/animations, ARIA attributes

---

## Chunk 1: Bug Fixes

### Task 1: Fix search bar CSS class mismatch

**Files:**
- Modify: `src/ChatView.jsx:260` — change `className="search-bar"` to `className="chat-search-bar"`
- Modify: `src/ChatView.jsx:269` — change `className="search-count"` to `className="chat-search-count"`

- [ ] **Step 1:** In `ChatView.jsx`, replace the search bar `<div className="search-bar">` with `<div className="chat-search-bar">` and `<span className="search-count">` with `<span className="chat-search-count">` to match the CSS classes in App.css (lines 1368-1412).

- [ ] **Step 2:** Verify: `npm run build`

- [ ] **Step 3:** Commit: `fix: correct search bar CSS class names to match App.css`

---

## Chunk 2: Performance — Code Splitting & Lazy Loading

### Task 2: Add lazy loading for route-level components

**Files:**
- Modify: `src/App.jsx` — wrap Login, Profile, RoomDirectory with React.lazy + Suspense

- [ ] **Step 1:** In `App.jsx`, replace static imports of `Login`, `Profile`, `RoomDirectory` with `React.lazy()` dynamic imports. Add a `Suspense` boundary with a loading fallback around `AppShell`.

```jsx
import { useState, useEffect, lazy, Suspense } from 'react'

const Login = lazy(() => import('./Login'))
const Profile = lazy(() => import('./Profile'))
const RoomDirectory = lazy(() => import('./RoomDirectory'))
```

- [ ] **Step 2:** Wrap the `<Login />` render in AppShell and the `<Profile />` and `<RoomDirectory />` renders in MainApp with `<Suspense fallback={<div className="loading-screen">Loading...</div>}>`.

- [ ] **Step 3:** Verify: `npm run build` — confirm separate chunks are created.

- [ ] **Step 4:** Commit: `perf: add lazy loading for Login, Profile, and RoomDirectory`

### Task 3: Enable Firestore offline persistence

**Files:**
- Modify: `src/db.js:38` — add `enableMultiTabIndexedDbPersistence` after Firestore init

- [ ] **Step 1:** In `db.js`, after `const store = getFirestore(app)`, add:

```js
import { enableMultiTabIndexedDbPersistence } from 'firebase/firestore'

enableMultiTabIndexedDbPersistence(store).catch(() => {
  // Multi-tab persistence not supported or already enabled
})
```

- [ ] **Step 2:** Verify: `npm run build`

- [ ] **Step 3:** Commit: `perf: enable Firestore offline persistence`

### Task 4: Add lazy loading for message images

**Files:**
- Modify: `src/ChatView.jsx:405` — add `loading="lazy"` to message images

- [ ] **Step 1:** In the `msg-text` div of `MessageItem`, add `loading="lazy"` to the `<img>` tags for `m.img` and `m.gif`.

- [ ] **Step 2:** Verify: `npm run build`

- [ ] **Step 3:** Commit: `perf: add lazy loading to message images`

---

## Chunk 3: UX Polish — Animations & Transitions

### Task 5: Add message fade-in animation

**Files:**
- Modify: `src/App.css` — add `@keyframes fadeInUp` and apply to `.message-wrap`

- [ ] **Step 1:** Add animation CSS after the `.message-wrap` rule:

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.message-wrap {
  animation: fadeInUp 0.2s ease-out;
}
```

- [ ] **Step 2:** Verify: `npm run build`

- [ ] **Step 3:** Commit: `polish: add fade-in animation for messages`

### Task 6: Add smooth transitions to modals and overlays

**Files:**
- Modify: `src/App.css` — add transition to `.directory-overlay`, `.profile-overlay`, `.sidebar-overlay`, `.gif-picker`, `.msg-actions`, `.emoji-picker-mini`

- [ ] **Step 1:** Add `animation: fadeIn 0.15s ease-out` to overlay elements and a `@keyframes fadeIn` rule. Add scale animation for `.gif-picker`, `.msg-actions`, `.emoji-picker-mini`.

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}
```

Apply `animation: fadeIn 0.15s ease-out` to `.directory-overlay`, `.sidebar-overlay`.
Apply `animation: scaleIn 0.15s ease-out` to `.gif-picker`, `.msg-actions`, `.emoji-picker-mini`, `.directory-card`, `.profile-card`.

- [ ] **Step 2:** Verify: `npm run build`

- [ ] **Step 3:** Commit: `polish: add smooth animations to modals, overlays, and action menus`

### Task 7: Add theme transition smoothing

**Files:**
- Modify: `src/App.css` — add transition to key color properties

- [ ] **Step 1:** The body already has `transition: background 0.2s, color 0.2s`. Add similar transitions to header, sidebar-container, and chat-view to make theme toggle feel smoother. These already have individual transition rules — verify they cover `background` and `border-color`.

- [ ] **Step 2:** Commit: `polish: smooth theme transition on all surfaces`

---

## Chunk 4: Accessibility (WCAG 2.1 AA)

### Task 8: Add ARIA landmarks and labels

**Files:**
- Modify: `src/App.jsx` — add `role` and `aria-label` to layout regions
- Modify: `src/ChatView.jsx` — add `role` and `aria-label` to message list, typing indicator
- Modify: `src/Sidebar.jsx` — add `role="navigation"` and `aria-label`

- [ ] **Step 1:** In `App.jsx`:
  - Add `role="banner"` to `<header>`
  - Add `role="navigation" aria-label="Sidebar"` to sidebar container div
  - Add `role="main"` to `.main-container`

- [ ] **Step 2:** In `ChatView.jsx`:
  - Add `role="log" aria-label="Chat messages" aria-live="polite"` to `<ul className="messages">`
  - Add `aria-live="polite"` to the typing indicator div
  - Add `aria-label` descriptors to emoji picker buttons: `aria-label={e + ' reaction'}`
  - Add `role="search"` to the search bar div

- [ ] **Step 3:** In `Sidebar.jsx`:
  - Add `role="navigation" aria-label="Channels and conversations"` to the sidebar root div

- [ ] **Step 4:** Verify: `npm run build`

- [ ] **Step 5:** Commit: `a11y: add ARIA landmarks, roles, and live regions`

### Task 9: Fix keyboard accessibility for message actions

**Files:**
- Modify: `src/ChatView.jsx:428-462` — make message actions accessible on focus, not just hover
- Modify: `src/App.css` — add `:focus-within` trigger for `.msg-actions`

- [ ] **Step 1:** In `App.css`, add a CSS rule so `.msg-actions` also shows when the parent `.message-wrap` receives focus-within:

```css
.message-wrap:focus-within .msg-actions {
  display: flex;
}
```

But since `msg-actions` is conditionally rendered in React, we need a different approach. In `ChatView.jsx`, change the `MessageItem` component to show actions on focus as well as hover:

```jsx
onFocus={() => setShowActions(true)}
onBlur={(e) => {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    setShowActions(false)
    setShowEmojis(false)
  }
}}
tabIndex={0}
```

- [ ] **Step 2:** Add `aria-label` attributes to all action buttons: Edit, Delete, Reply, React, Report, Block, Pin.

- [ ] **Step 3:** Verify: `npm run build`

- [ ] **Step 4:** Commit: `a11y: make message actions keyboard accessible`

### Task 10: Add focus trapping to modals

**Files:**
- Modify: `src/RoomDirectory.jsx` — trap focus within modal
- Modify: `src/App.jsx` — handle Escape key for modals

- [ ] **Step 1:** In `RoomDirectory.jsx`, add `onKeyDown` handler to `directory-overlay` div to close on Escape:

```jsx
onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
```

- [ ] **Step 2:** In `App.jsx`, for the `showProfile` state, wrap Profile in a div that handles Escape to close.

- [ ] **Step 3:** Add `role="dialog" aria-modal="true" aria-label="Room Directory"` to directory overlay, and equivalent for Profile overlay.

- [ ] **Step 4:** Verify: `npm run build`

- [ ] **Step 5:** Commit: `a11y: add dialog roles and Escape key support to modals`

### Task 11: Fix color contrast and focus indicators

**Files:**
- Modify: `src/App.css` — adjust muted text colors, add focus-visible outlines

- [ ] **Step 1:** Add global focus-visible style:

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

- [ ] **Step 2:** Adjust `--text-muted` in light theme from `#65676b` to `#555759` for better contrast against white/light backgrounds (4.5:1 ratio).

- [ ] **Step 3:** Verify: `npm run build`

- [ ] **Step 4:** Commit: `a11y: improve color contrast and add focus-visible outlines`

### Task 12: Add descriptive alt text and screen reader context

**Files:**
- Modify: `src/ChatView.jsx` — fix avatar alt text, reaction button labels
- Modify: `src/Sidebar.jsx` — fix avatar alt text
- Modify: `src/App.jsx` — fix header avatar alt text

- [ ] **Step 1:** In `ChatView.jsx` `MessageItem`:
  - Change avatar `alt=""` to `alt={m.name + "'s avatar"}`
  - Add `aria-label` to reaction chips: `aria-label={\`${emoji} reaction, ${uids.length} \${uids.length === 1 ? 'person' : 'people'}\`}`

- [ ] **Step 2:** In `App.jsx`:
  - Change header avatar `alt=""` to `alt="Your avatar"`

- [ ] **Step 3:** In `Sidebar.jsx`:
  - Change DM avatar `alt=""` to `alt={otherData.name + "'s avatar"}`
  - Change search result avatar `alt=""` to `alt={u.displayName + "'s avatar"}`

- [ ] **Step 4:** Verify: `npm run build`

- [ ] **Step 5:** Commit: `a11y: add descriptive alt text and ARIA labels for screen readers`

---

## Chunk 5: Final Build Verification

### Task 13: Run final build and verify

- [ ] **Step 1:** Run `npm run build` to verify no build errors.
- [ ] **Step 2:** Run `npm run preview` to test locally.
- [ ] **Step 3:** Commit plan update marking Phase 4 items as complete in CLAUDE.md.
