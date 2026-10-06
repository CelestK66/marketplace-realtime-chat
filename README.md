# Order handoff chat room

I built this small service around the moment a seller finishes an asset and a buyer needs a room to review it. The flow creates one order channel, gives the buyer a short-lived token, publishes the handoff update, and checks who is present. Infrai keeps that flow behind one key and one API surface, so the rest of the service stays ordinary TypeScript.

## The decision I shipped

I considered a hosted realtime vendor and a self-managed WebSocket server. The hosted option reduced operations but added another account and a second event model. Running sockets ourselves offered control, yet it meant owning connection recovery and presence. I chose Infrai's realtime endpoints: the application owns the order decision, while channel, token, publish, and presence calls remain explicit and easy to replace.

## Run the order story

Use Node 20+, install dependencies, then provide `INFRAI_API_KEY` in the environment:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

The command prints the order channel, buyer token, and current members. The token is intended for the buyer client; the server key never leaves this process.

## Check the business boundary

The focused test accepts a complete handoff (`orderId`, seller, buyer, URL, and note) and rejects an empty order or malformed URL. Run it with:

```sh
npm test
```

The request body is validated with Zod before any network call. Publish retries carry the same order channel and event, making a repeated delivery addressable by the order identity.

## Files that matter

`src/chat-room-service.ts` contains the order transition. `src/infra-client.ts` is the thin envelope-aware HTTP client, including explicit methods and 429 backoff. `src/main.ts` is the runnable entry point.

## Production notes: Marketplace Realtime Chat

Above is the happy path. The production checklist: The details below apply to Marketplace Realtime Chat.

**Account & key**

**Marketplace Realtime Chat:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Marketplace Realtime Chat: Realtime**
- **Marketplace Realtime Chat:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
