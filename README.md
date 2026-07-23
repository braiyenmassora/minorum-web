# Minorum

Private chat UI — streaming, markdown, attachments, model picker. Built on Next.js App Router.

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:3000` → first-time setup at `/welcome` (password + name).

> **Note:** localhost skips the cookie gate. Production requires login and a signed session cookie.

## Environment Variables

| Key | Required | Description |
|---|---|---|
| `MINORUM_DEFAULT_API_URL` | Always | Backend base URL (no `/v1` suffix — added server-side) |
| `MINORUM_DEFAULT_API_KEY` | Always | API key injected by the proxy. Never exposed to the browser |
| `MINORUM_DEFAULT_MODEL` | Optional | Default model id used after login |
| `GATE_PASSWORD` | Always | Login password. Set locally, never commit |
| `GATE_SESSION_SECRET` | Production | HMAC secret for the session cookie — generate with `openssl rand -base64 32` |
| `MINORUM_ALLOWED_HOSTS` | Production | Comma-separated hostnames allowed to serve the app (e.g. `chat.example.com`) |


## Scripts

```bash
npm run dev                      # Local development
npm run build && npm run start   # Production build + smoke test
npm run lint                     # Lint check
npm run check:config             # Validate env/config setup
npm run check:chat                # Smoke test chat flow
npm run check:storage             # Verify storage/attachments setup
```