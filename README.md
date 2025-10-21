## Work Kit of Design Fiction

A small interactive design-fiction tool that helps you combine deck-of-cards style inputs (ATTRIBUTE, OBJECT, ACTION, ARCHETYPE) into short speculative artifacts. The project runs as a Tauri desktop app (React + Vite frontend, Rust backend for LLM adapters) and can be adapted to run as a web-hosted app by replacing the local Tauri IPC with HTTP endpoints.

This README documents project structure, how to run and develop locally, environment variables, the prompt design, and migration options for web hosting.

---

## Quick links

- Frontend entry: `index.html` → `src/main.jsx`
- Main UI component: `src/components/ShuffleComponent.jsx`
- Response rendering: `src/components/ResponseViewer.jsx`
- Card UI: `src/components/CardFlipper.jsx`
- Data: `src/data/cardDescriptions.js`
- Tauri (Rust) backend: `src-tauri/src/` (commands, LLM adapters)

---

## Features

- Interactive card deck: flip cards and shuffle front images
- Provider selection (Ollama, OpenAI, LMStudio) and model listing via backend
- Structured prompt generation that treats `ARCHETYPE` as the artifact form (Mad Libs-style)
- ResponseViewer parses JSON output and renders sections with small copy buttons
- Client- and server-side sanitization strips Markdown code fences/backticks
- Tailwind CSS styling with custom select chevrons and single-editor-column scrolling

---

## Development — desktop (Tauri)

### Prerequisites

- Node.js (16+) and npm (or yarn)
- Rust toolchain (cargo)
- Tauri prerequisites for your OS (see https://tauri.app/v1/guides/getting-started/prerequisites)

### Install

```bash
# from project root
npm install
# or yarn
```

### Run frontend only

```bash
npm run dev
```

### Run Tauri (desktop) in dev

```bash
npm run tauri dev
```

Tauri dev will use Vite's dev server (configured on port 1420 in `vite.config.js`) so the frontend is hot-reloaded while the Rust backend reloads on change.

### Build for production

```bash
npm run build
npm run tauri build
```

Notes

- If you see Vite parse errors referencing template literals, check `src/components/ShuffleComponent.jsx` for unescaped characters — prompts are built with JS template strings and must not include raw backtick sequences.

---

## Environment variables

Backend secrets go in `src-tauri/.env` (not committed). A sample is provided in `src-tauri/.env.example`.

Important variables

- `OPENAI_API_KEY` — required for OpenAI provider
- `OLLAMA_URL` — optional URL for a remote/local Ollama instance
- `LMSTUDIO_URL` — optional LMStudio-compatible base URL
- `DEFAULT_MODEL` / `LLM_PROVIDER` — optional defaults

Create a local `.env` for dev:

```bash
cp src-tauri/.env.example src-tauri/.env
# edit src-tauri/.env
```

Restart Tauri after changing `.env` because the Rust backend reads env vars at startup.

---

## How prompts are built

The prompt builder lives in `src/components/ShuffleComponent.jsx` (`formatLlamaPrompt`). Key points:

- `ARCHETYPE` is the artifact form (Mad Libs-style). If ARCHETYPE is `receipt`, produce the artifact in receipt form; if `magazine article`, produce magazine-like output.
- The prompt requires a specific lead sentence that the model should include verbatim (with placeholders replaced):

	"I saw a <ARCHETYPE>. It seemed to be for an <OBJECT> that does <ACTION> while it also <ATTRIBUTE>."

	The model should replace the tokens and fix articles (`a` vs `an`) so the sentence reads naturally. This lead sentence should be the opening of the artifact description or the scenario.

- The model is instructed to return exactly one JSON object matching a schema. The project removed the Outcome/Extras card; current fields are: `elements`, `artifact`, `design`, `implications`, `scenario`, `additional`.

This design yields deterministic parseable outputs that the UI can render into separate sections.

---

## Converting to an online-hosted app

Because Tauri relies on a Rust backend that runs locally, an online version must replace the Tauri IPC layer with an HTTP API. Two practical approaches:

1) Recommended — Frontend + Node/Express server

- Keep the React frontend mostly unchanged. Replace `invoke()` calls with fetch POSTs to `/api/generate` and `/api/list_models`.
- Implement a small Node/Express server that proxies to provider APIs (OpenAI, LMStudio, or Ollama). Store API keys on the server.
- Deploy frontend as static site (Vercel/Netlify/Cloudflare) and server as serverless functions or a small container (Vercel functions, Render, Fly.io).

2) Rust server

- Port the existing Rust LLM adapter logic (`src-tauri/src/llm_client.rs`) into an HTTP server using `axum` or `actix-web`.
- Deploy as a container or to a host that supports Rust apps.

Security notes

- Keep API keys on the server; do not put them in client JS.
- Add rate-limiting and optional auth to avoid abuse and unexpected bills.

---

## Project structure (summary)

- `index.html`, `src/main.jsx` — app entry
- `src/components/ShuffleComponent.jsx` — main card UI, prompt builder, and generation flow
- `src/components/ResponseViewer.jsx` — JSON parsing and UI rendering with copy buttons
- `src/data/` — card deck descriptions
- `src-tauri/` — Rust/Tauri backend and LLM adapters

---

## Troubleshooting

- No models returned: ensure provider settings and `OPENAI_API_KEY` (if using OpenAI) are correctly set in `src-tauri/.env`.
- Nested scrollbars: ensure `.editor-column` in `src/App.css` is `overflow-y-auto` and inner content has `min-h-0` so the column is the single scroll container.
- Prompt parsing errors: verify `formatLlamaPrompt` doesn't include raw code-fence/backtick sequences.

---

## Contributing & roadmap

- Add or adjust prompt templates in `ShuffleComponent.jsx` (consider moving to a constant for easier tuning).
- Improve server-side sanitization and add unit tests for `llm_client.rs` adapters.
- Optionally add a Node/Express server and wire the frontend to it for web hosting.

If you want, I can implement a Node/Express proxy server and update the frontend to call it — pick a hosting target (Vercel, Render, Netlify) and I'll scaffold it.

---

## Related links

- Work Kit of Design Fiction (project page): https://nearfuturelaboratory.com/projects/en/work-kit-of-design-fiction-2023/
- Play the 2023 edition: https://nearfuturelaboratory.com/work-kit-of-design-fiction/play-2023-edition/
- Educational write-up on Medium: https://proudtaranat.medium.com/the-work-kit-of-design-fiction-educational-games-critique-48ead19acd10


## License

Add a `LICENSE` file if you want to open-source this project (MIT/Apache recommended).

---

If you'd like a `DEVELOPMENT.md` with step-by-step debug instructions for the Rust side or a scaffolded server for web deployment, say which you'd prefer and I'll create it.
