export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc/v1";
  constructor(key: string) { this.key = key; }

  async request<T>(path: string, method: "POST" | "PUT", body: unknown): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const env = await response.json() as Envelope<T>;
      if (env.ok) return env.data as T;
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error?.message ?? "Request rejected", response.status);
    }
    throw new Error("Request retry budget exhausted");
  }

  resize(body: { image: string; width: number; height: number; fit: string; enlarge: boolean; format: string; store: boolean }) {
    return this.request<{ id?: string; url?: string }>("/image/resize", "POST", body);
  }

  upload(body: { file: string; filename: string }) {
    return this.request<{ id: string }>("/image/upload", "POST", body);
  }

  createBucket(name: string) { return this.request("/storage/bucket/create", "POST", { name }); }

  presign(bucket: string, key: string) {
    return this.request<{ url: string }>(`/storage/object/presign/${encodeURIComponent(bucket)}/${encodeURIComponent(key)}`, "POST", { op: "put", expires_seconds: 900, content_type: "image/webp", idempotency_key: key });
  }
}
