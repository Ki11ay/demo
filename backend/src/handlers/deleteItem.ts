import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { ddbDocClient, ebClient } from "../services/aws";

const TABLE_NAME = process.env.TABLE_NAME || "ItemsTable";
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || "default";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const { id } = event.pathParameters || {};

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "id is required" }),
    };
  }

  try {
    await ddbDocClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id },
      })
    );

    // Publish event
    await ebClient.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: "myapp.items",
            DetailType: "ItemDeleted",
            Detail: JSON.stringify({ id }),
            EventBusName: EVENT_BUS_NAME,
          },
        ],
      })
    );

    return {
      statusCode: 204,
      body: "",
    };
  } catch (error: any) {
    console.error("Error deleting item:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error", error: error.message }),
    };
  }
};
