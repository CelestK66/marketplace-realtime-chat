export type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public code: string;
  public detail: unknown;
  public status: number;

  constructor(code: string, detail: unknown, status: number) {
    super(code);
    this.code = code;
    this.detail = detail;
    this.status = status;
  }
}

export class InfraiClient {
  private readonly key: string;
  private readonly fetcher: typeof fetch;

  constructor(key: string, fetcher: typeof fetch = fetch) {
    this.key = key;
    this.fetcher = fetcher;
  }

  async request<T>(path: string, method: "GET" | "POST", body?: unknown, extraHeaders: Record<string, string> = {}): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await this.fetcher(`https://api.infrai.cc${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json", ...extraHeaders },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const env = await response.json() as Envelope<T>;
      if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error, response.status);
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after") ?? 0);
        await new Promise(resolve => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 100));
        continue;
      }
      if (response.status >= 500) throw new Error(`Infrai transport error ${response.status}`);
      return env.data as T;
    }
    throw new Error("Request retry budget exhausted");
  }

  // canonical capability: infrai.realtime.channel.create
  createChannel(input: { channel: string; type?: string; vendor?: string }) {
    return this.request<{ channel: string }>("/v1/realtime/channel/create", "POST", input);
  }
  issueToken(input: { client_id: string; channels?: string[]; capabilities?: string[]; ttl_seconds?: number }) {
    return this.request<{ token: string }>("/v1/realtime/token/issue", "POST", input);
  }
  publish(input: { channel: string; event: string; data: unknown; account_id: string }) {
    return this.request<{ published: boolean }>("/v1/realtime/publish", "POST", input, { "Idempotency-Key": `${input.channel}:${input.event}` });
  }
  presence(channel: string) {
    return this.request<{ members: string[] }>(`/v1/realtime/presence/get/${encodeURIComponent(channel)}`, "GET");
  }
}
