import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { createHmac } from "crypto";
import { WebhookEvent } from "./up/types";
import { transactionCreated, transactionUpdated } from "./processing";

const UP_WEBHOOK_SECRET = process.env.UP_WEBHOOK_SECRET || "";

const buildSignature = (body) => createHmac("sha256", UP_WEBHOOK_SECRET).update(body).digest("hex");

export async function upWebhook(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  const body = event.body || "";
  const headers = Object.entries(event.headers).reduce((acc, [key, val]) => ({ ...acc, [key.toLowerCase()]: val }), {});

  console.log(`Body: ${body}`);
  console.log(`Headers: ${JSON.stringify(headers, null, 2)}`);
  const expectedSignature = headers["x-up-authenticity-signature"];
  const actualSignature = buildSignature(body);
  if (expectedSignature !== actualSignature) {
    console.log(`Invalid signature - expected: ${expectedSignature}, actual: ${actualSignature}`);
    return { statusCode: 403, body: "" };
  }

  const parsedBody = JSON.parse(body);

  if (!parsedBody.data || parsedBody.data.type !== "webhook-events") {
    return { statusCode: 200, body: "" };
  }

  const webhookEventData = (parsedBody as WebhookEvent).data;

  if (webhookEventData.attributes.eventType === "TRANSACTION_CREATED") {
    await transactionCreated(webhookEventData.relationships.transaction);
  } else if (webhookEventData.attributes.eventType === "TRANSACTION_SETTLED") {
    await transactionUpdated(webhookEventData.relationships.transaction);
  } else if (webhookEventData.attributes.eventType === "TRANSACTION_DELETED") {
    console.log("Transaction deleted");
  } else {
    console.log("Skipping");
  }

  return { statusCode: 200, body: "" };
}
