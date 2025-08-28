
# Manager Chat (Vite + Express)

Simple Vite + React app that provides a manager-facing chat UI and a small Express backend proxy for the Gemini (Generative Language) API.

## Overview
This repository contains a frontend (Vite + React) and a backend (Express) that proxies requests to the Gemini API. The app includes a small UI to store a Gemini API key in the browser for local testing.

## Contents
- `src/` — frontend source (Vite + React)
- `backend/` — Express server and static file serving (`backend/server.js`)

## Prerequisites
- Node.js (18+ recommended)
- npm

## Install
From the project root:

```powershell
npm install
cd backend; npm install
```

## Run locally

Build the frontend so `dist/` exists, then start the backend (which serves the built static files and the API):

```powershell
# from project root — build frontend into `dist/`
npx vite build
# then start the backend which serves `dist/` and the API
node backend/server.js
# or, from the backend folder:
cd backend; npm start
```

For development you can also run the frontend dev server:

```powershell
npm run dev
```

The backend listens on port 3000 by default. In dev mode you can point the client to `http://localhost:3000` or configure a Vite proxy.

## Gemini API key (how to set)

Options:

- Server-side (recommended for production): set the `GEMINI_API_KEY` environment variable for the backend process.
- Local (quick testing): open the Manager Chat page and use the small key editor in the Session details header to paste and save your Gemini key. The key is stored in browser localStorage under `manager_chat_gemini_key_v1` and is sent with each `/api/assistant` request.

Security note: storing API keys in localStorage exposes them to the browser. Prefer server-side keys for production.

## Troubleshooting

- If the assistant replies with an API-key error, set the key via the UI or export `GEMINI_API_KEY` and restart the backend.
- If you have dev-mode network/CORS issues, ensure the frontend calls the correct backend origin or configure Vite's dev proxy.

## The source

[Check out the source code](https://github.com/mui/toolpad/tree/master/examples/core/vite/)
