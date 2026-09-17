// /api/_lib/redis.js
// Client Redis condiviso (Upstash) — usato da tutte le funzioni serverless.
// Il prefisso "_lib" fa sì che Vercel NON lo tratti come un endpoint a sé.

import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.OFFSIDE_KV_REST_API_URL,
  token: process.env.OFFSIDE_KV_REST_API_TOKEN,
});
