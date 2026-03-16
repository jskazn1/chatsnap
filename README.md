# Surge

Real-time messaging that moves at the speed of thought.

**Live:** https://surge-bitfit.web.app

## Tech Stack

- React 18 + Vite + Tailwind CSS v4
- Firebase v10 (Firestore, Auth, Storage, Cloud Messaging)
- PWA with service worker

## Features

- Room-based chat and direct messages
- Google and email/password sign-in
- Voice messages, GIF picker, image sharing
- Markdown rendering (bold, italic, code, links)
- Message reactions, replies, editing, pinning
- Typing indicators and real-time updates
- Push notifications
- Private rooms with join codes
- User profiles with avatar upload

## Development

```bash
npm install
npm run dev        # dev server at localhost:5173
npm run build      # production build → build/
firebase deploy --only hosting  # deploy to surge-bitfit.web.app
```
