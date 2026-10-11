interface Statement {
  bind(...values: (string | number)[]): Statement;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
}
export interface RateDatabase { prepare(sql: string): Statement }

// Atomic counters in D1, shared across Cloudflare instances. No conversation storage.
export async function allowEscalation(db: RateDatabase, ip: string, secret: string, now = Date.now()): Promise<boolean> {
  const seconds = Math.floor(now / 1000);
  const window = Math.floor(seconds / 600);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${window}:${ip}`));
  const hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  await db.prepare("DELETE FROM escalation_limits WHERE expires_at < ?").bind(seconds).run();
  async function take(bucket: string, expires: number, limit: number) {
    const row = await db.prepare(`INSERT INTO escalation_limits (bucket, hits, expires_at) VALUES (?, 1, ?)
      ON CONFLICT(bucket) DO UPDATE SET hits = hits + 1 RETURNING hits`)
      .bind(bucket, expires).first<{ hits: number }>();
    if (!row || !Number.isFinite(row.hits)) throw new Error("rate_limit_unavailable");
    return row.hits <= limit;
  }
  if (!await take(`ip:${window}:${hash}`, (window + 1) * 600, 3)) return false;
  const minute = Math.floor(seconds / 60);
  return take(`global:${minute}`, (minute + 1) * 60, 20);
}
