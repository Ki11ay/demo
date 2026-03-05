import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { ddbDocClient, ebClient } from "../services/aws";

const TABLE_NAME = process.env.TABLE_NAME || "ItemsTable";
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || "default";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const { id, name, description } = body;

  if (!id || !name) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "id and name are required" }),
    };
  }

  const item = { id, name, description, createdAt: new Date().toISOString() };

  try {
    // 1. Save to DynamoDB
    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    // 2. Publish event to EventBridge
    await ebClient.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: "myapp.items",
            DetailType: "ItemCreated",
            Detail: JSON.stringify(item),
            EventBusName: EVENT_BUS_NAME,
          },
        ],
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify(item),
    };
  } catch (error: any) {
    console.error("Error creating item:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error", error: error.message }),
    };
  }
};
