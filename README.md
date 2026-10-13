<div align="center">
<h1 align="center">ImgPilot</h1>

Image pilot with the power of Real-Time Latent Consistency Model.

[Live demo](https://imgpilot.com/)
</div>

## Features

- Complete front-end and back-end code.
- Runs locally or in the cloud.
- Open source, usable commercially.
- Latent-consistency sketch-to-image editing powered by a Lepton photon service.

## Architecture

```
Browser (Next.js app router)
  -> POST /api/run           src/app/api/run/route.ts   (rate limit + proxy)
     -> POST /run            photon/main.py             (LCM inference)
```

- `src/app` - Next.js 14 UI (TypeScript, Tailwind, Radix).
- `src/util/generation.ts` - sampler defaults and payload builder.
- `photon/` - Lepton AI photon service that runs the model.

## Requirements

- Node.js 18+
- Python 3.9+
- A GPU backend for local inference (Lepton AI or any photon host)

## Install

```bash
# Web dependencies
npm install

# Server dependencies
pip install -r requirements.txt -U
```

Copy `.env.example` to `.env.local` and fill in `API_URL` / `API_TOKEN`.

## Development

```bash
# Model server on :8080
lep photon runlocal -n imgpilot -m photon/main.py

# Web server on :3000
npm run dev
```

```bash
# Lint and type-check
npm run lint
npx tsc --noEmit
```

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `API_URL` | no | Base URL of the photon service (default `http://127.0.0.1:8080`) |
| `API_TOKEN` | yes in production | Bearer token forwarded to the backend |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | no | Enables the Upstash rate limiter on `/api/run` |

## Troubleshooting

- **"Backend unavailable" (504)** - the photon service is not reachable at `API_URL`.
- **"Payload too large" (413)** - the encoded sketch exceeds the 5 MB limit.
- **Excalidraw assets missing** - `npm run dev`/`build` copies them automatically;
  run `node scripts/copy-excalidraw.mjs` manually if you invoke Next.js directly.
- **429 responses** - the Upstash sliding window allows 100 requests/second/IP;
  unset the KV variables to disable it locally.

## License

Apache-2.0. See [LICENSE](LICENSE).

## Built with

- [Lepton AI](https://github.com/leptonai/leptonai)
- [Excalidraw](https://github.com/excalidraw/excalidraw)
- [Real-Time-Latent-Consistency-Model](https://huggingface.co/spaces/radames/Real-Time-Latent-Consistency-Model)
