import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { itemService } from "../services/items.service";
import { createResponse } from "../utils/api";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const { id } = event.pathParameters || {};

  if (!id) {
    return createResponse(400, { message: "id is required" });
  }

  try {
    await itemService.deleteItem(id);
    return createResponse(204);
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      return createResponse(404, { message: `Item with id ${id} not found` });
    }
    console.error("Error deleting item:", error);
    return createResponse(500, { message: "Internal server error" });
  }
};
