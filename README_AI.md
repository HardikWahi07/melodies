# AI Setup (Groq + Llama 4 Scout)

This app uses Groq's OpenAI-compatible API with the model:
`meta-llama/llama-4-scout-17b-16e-instruct`.

## 1) Configure env

Copy `.env.example` to `.env` and set:

```env
VITE_GROQ_API_KEY=your_groq_key
VITE_AI_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
```

Optional:

- `VITE_AI_BASE_URL` (default `https://api.groq.com/openai/v1`)
- `VITE_GEMINI_API_KEY` (fallback for playlist recommendations only)

## 2) Run

```bash
npm install
npm run dev
```

Note: Vite `VITE_*` env vars are bundled into the client; don’t ship real API keys to production without a backend/proxy.
