import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { ddbDocClient, ebClient } from "../services/aws";

const TABLE_NAME = process.env.TABLE_NAME || "ItemsTable";
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || "default";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const { id } = event.pathParameters || {};
  const body = JSON.parse(event.body || "{}");
  const { name, description } = body;

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "id is required" }),
    };
  }

  try {
    const response = await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: "SET #name = :name, description = :description, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#name": "name",
        },
        ExpressionAttributeValues: {
          ":name": name,
          ":description": description,
          ":updatedAt": new Date().toISOString(),
        },
        ReturnValues: "ALL_NEW",
      })
    );

    const updatedItem = response.Attributes;

    // Publish event
    await ebClient.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: "myapp.items",
            DetailType: "ItemUpdated",
            Detail: JSON.stringify(updatedItem),
            EventBusName: EVENT_BUS_NAME,
          },
        ],
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(updatedItem),
    };
  } catch (error: any) {
    console.error("Error updating item:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error", error: error.message }),
    };
  }
};
