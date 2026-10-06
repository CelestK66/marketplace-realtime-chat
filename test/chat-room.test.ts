import assert from "node:assert/strict";
import { Handoff } from "../src/chat-room-service.js";

const parsed = Handoff.safeParse({ orderId: "o-1", sellerId: "s-1", buyerId: "b-1", assetUrl: "https://example.test/a.zip", note: "ready" });
assert.equal(parsed.success, true);
assert.equal(Handoff.safeParse({ orderId: "", sellerId: "s", buyerId: "b", assetUrl: "bad", note: "" }).success, false);
console.log("handoff input validation passed");
