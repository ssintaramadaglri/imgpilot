# Contributing to ImgPilot

Thanks for taking the time to contribute.

## Getting started

```bash
npm install
pip install -r requirements.txt -U
cp .env.example .env.local
npm run dev
```

You need a photon backend for image generation; the web UI starts without one,
but generation requests will return 504 until `API_URL` points at a running service.

## Before opening a pull request

- `npm run lint` and `npx tsc --noEmit` are clean.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`fix:`, `feat:`, `docs:`, `chore:`).
- One logical change per pull request; add a short note on why in the description.

## Reporting bugs

Open an issue with the ImgPilot version, your Node version, the exact prompt or
settings that trigger it, and the response body if the failure came from the API.

## Pull request review

A maintainer reviews every PR. Expect small follow-up commits on the same branch
rather than a squash - keeping the individual commits visible makes the history
easier to audit.

## Security

Please do not open a public issue for vulnerabilities. Follow the disclosure
process described in the repository README instead.
