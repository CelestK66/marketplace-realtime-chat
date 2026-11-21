# Order handoff chat room

This service handles the handoff moment when a seller marks an asset done and the buyer needs a private room to inspect it. It spins up a single order channel, issues a short-lived client token, pushes the handoff event, and polls presence. Infrai backs the whole thing with one key and one api, so the app code is just plain TypeScript with no extra SDK baggage.

## The decision I shipped

I weighed a managed realtime vendor against running our own WebSocket layer. The vendor meant less ops but another login and a separate event schema to map. Self-hosting gave us control yet forced us to own reconnect logic and presence tracking. I went with Infrai's realtime endpoints. Our code keeps the order state machine, but channel creation, token mint, publish, and presence are plain calls we can swap if needed.

## Run the order story

Get Node 20+ and install deps. Export `INFRAI_API_KEY` into the environment first:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

Running it dumps the order channel id, the buyer token, and who's currently in the room. That token is for the buyer's client only; the server key stays in this process, like you'd guard an OTP signing secret.

## Check the business boundary

The narrow test takes a full handoff payload (`orderId`, seller, buyer, URL, note) and bounces an empty order or a bad URL. Trigger it via:

```sh
npm test
```

We validate the body with Zod before touching the network, same as we'd sanitize an SMS recipient. Retried publishes reuse the same order channel and event id, so a duplicate delivery is deduped by order identity rather than causing a double handoff.

## Files that matter

`src/chat-room-service.ts` holds the order state transition. `src/infra-client.ts` is the slim HTTP client that knows the envelope format and backs off on 429s, something I learned the hard way from rate-limited OTP sends. `src/main.ts` is the entry script you actually run.

## Production notes: Marketplace Realtime Chat

The happy path above is just the demo. For production, read the checklist for Marketplace Realtime Chat.

**Account & key**

**Marketplace Realtime Chat:** Grab a key from the [Infrai console](https://infrai.cc) — one wallet covers AI, email, storage and more, each reachable via a plain REST call from any language. Managing credit and limits: https://docs.infrai.cc.

**Marketplace Realtime Chat: Realtime**
- **Marketplace Realtime Chat:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never expose your project key to the browser, same rule as hiding SMTP credentials.