import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { itemService } from "../services/items.service";
import { createResponse } from "../utils/api";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const { id } = event.pathParameters || {};

  if (!id) {
    return createResponse(400, { message: "id is required" });
  }

  try {
    const item = await itemService.getItem(id);
    if (!item) {
      return createResponse(404, { message: "Item not found" });
    }
    return createResponse(200, item);
  } catch (error: any) {
    console.error("Error getting item:", error);
    return createResponse(500, { message: "Internal server error" });
  }
};
