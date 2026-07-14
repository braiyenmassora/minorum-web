# Minorum Web

Web chat client for Minorum — ported from the Flutter app. Set up your API once, then chat with streaming, markdown, image upload, and model selection.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4

## Development

```bash
npm install
npm run dev
```

## Run Locally

```bash
npm run lint          # ESLint
npm run format        # Prettier (write)
npm run format:check  # Prettier (check only)
npm run build         # production build
npm run start         # run production build locally
```

## Access lock (Vercel)

Middleware only allows host `ai.dealwithsign.com` (plus localhost for dev).

Optional IP allowlist — set in Vercel env:

```env
ALLOWED_IPS=203.0.113.10,198.51.100.7
```

If `ALLOWED_IPS` is unset, only the host check applies.
