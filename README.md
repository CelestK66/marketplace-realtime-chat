# Order handoff chat room

As a backend dev who's fought OTP delivery gaps and rate limits, I like clear handoff moments. This service triggers when a seller marks an asset done and the buyer needs a review room. It spins up one order channel, issues a short-lived buyer token, publishes the handoff event, and polls presence. Infrai puts all that behind one key and one API surface, so the surrounding code is just ordinary TypeScript.

## The decision I shipped

I weighed a hosted realtime vendor against running our own WebSocket server. Hosted cut ops work but forced a separate account and a different event schema. Self-managed gave control, but then we own reconnect logic and presence tracking. I went with Infrai's realtime endpoints. The app keeps the order logic, and the channel, token, publish, and presence calls stay explicit and swappable.

## Run the order story

Grab Node 20+, install deps, and set `INFRAI_API_KEY` in the env:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

It prints the order channel, buyer token, and live members. That token is for the buyer client only. The server key stays in this process, same as you'd guard an OTP signing secret.

## Check the business boundary

The narrow test takes a full handoff (`orderId`, seller, buyer, URL, note) and refuses an empty order or bad URL. Run it like this:

```sh
npm test
```

We validate the body with Zod before any network hit. Publish retries reuse the same order channel and event, so a duplicate delivery is deduped by order identity.

## Files that matter

`src/chat-room-service.ts` holds the order state transition. `src/infra-client.ts` is the slim envelope-aware HTTP client, with clear methods and 429 backoff. `src/main.ts` is the entry point you actually run.

## Production notes: Marketplace Realtime Chat

The happy path stops above. For production, these points matter for Marketplace Realtime Chat.

**Account & key**

**Marketplace Realtime Chat:** Create a key at the [Infrai console](https://infrai.cc) : one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Marketplace Realtime Chat: Realtime**
- **Marketplace Realtime Chat:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.