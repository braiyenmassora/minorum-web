# Minorum Web

Web chat client for Minorum — ported from the Flutter app. Set up your API once, then chat with streaming, markdown, image upload, and model selection.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional: create `.env.local` to prefill the setup form:

```env
MINORUM_DEFAULT_API_URL=https://api.example.com/v1
MINORUM_DEFAULT_API_KEY=sk-...
MINORUM_DEFAULT_MODEL=model-name
```

API keys are stored in the browser **localStorage**, not on the server.

Reset setup: open `/?reset`

## Scripts

```bash
npm run lint          # ESLint
npm run build         # production build
npm run start         # run production build locally
```