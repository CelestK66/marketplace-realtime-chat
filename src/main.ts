import { InfraiClient } from "./infra-client.js";
import { handoffOrder } from "./chat-room-service.js";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before running the example");
const result = await handoffOrder(new InfraiClient(key), { orderId: "order-42", sellerId: "seller-7", buyerId: "buyer-9", assetUrl: "https://cdn.example.test/assets/order-42.zip", note: "Final files are ready for review" });
console.log(JSON.stringify(result, null, 2));
