import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { createClient } from "@vercel/kv";

const API_URL = process.env?.API_URL || "http://127.0.0.1:8080";
const API_TOKEN = process.env?.API_TOKEN || "";

// Base64 encoded sketches are uploaded inline; anything beyond this is a
// malformed or abusive request and is rejected before hitting the GPU.
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 60_000;

const kv =
  process.env?.KV_REST_API_URL && process.env?.KV_REST_API_TOKEN
    ? createClient({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    : null;

const ratelimit = kv
  ? new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(100, "1 s"),
    })
  : null;

export async function POST(req: NextRequest) {
  const ip = req.ip ?? "::1";

  if (ratelimit) {
    const { remaining } = await ratelimit.limit(ip);

    if (remaining < 1) {
      return new Response("Too many requests", {
        status: 429,
      });
    }
  }

  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) {
    return new Response("Payload too large", { status: 413 });
  }

  const headers = new Headers();
  headers.set("Accept", `image/jpeg`);
  headers.set("Authorization", `Bearer ${API_TOKEN}`);
  headers.set(
    "Content-Type",
    req.headers.get("Content-Type") || "application/json",
  );
  const url = new URL("/run", API_URL);

  try {
    const upstream = await fetch(url.toString(), {
      body: req.body,
      method: req.method,
      headers,
      duplex: "half",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    } as unknown as RequestInit);

    if (!upstream.ok) {
      return new Response(`Upstream error: ${upstream.status}`, {
        status: 502,
      });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: { "Content-Type": "image/jpeg" },
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown";
    return new Response(`Backend unavailable: ${reason}`, { status: 504 });
  }
}
