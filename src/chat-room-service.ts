import { z } from "zod";
import { InfraiClient } from "./infra-client.js";

export const Handoff = z.object({ orderId: z.string().min(1), sellerId: z.string().min(1), buyerId: z.string().min(1), assetUrl: z.string().url(), note: z.string().min(1) });
export type Handoff = z.infer<typeof Handoff>;

export async function handoffOrder(client: InfraiClient, input: unknown) {
  const handoff = Handoff.parse(input);
  const channel = `order-${handoff.orderId}`;
  await client.createChannel({ channel, type: "presence" });
  const token = await client.issueToken({ client_id: handoff.buyerId, channels: [channel], capabilities: ["publish", "subscribe"], ttl_seconds: 3600 });
  await client.publish({ channel, event: "asset.ready", data: { sellerId: handoff.sellerId, assetUrl: handoff.assetUrl, note: handoff.note }, account_id: handoff.sellerId });
  const presence = await client.presence(channel);
  return { channel, clientToken: token.token, presentMembers: presence.members };
}
