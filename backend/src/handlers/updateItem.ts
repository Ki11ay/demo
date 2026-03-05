import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { itemService } from "../services/items.service";
import { parseBody, createResponse, validateUpdateItem } from "../utils/api";
import { UpdateItemInput } from "../types/item";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const { id } = event.pathParameters || {};
  const body = parseBody<UpdateItemInput>(event.body);

  if (!id) {
    return createResponse(400, { message: "id is required" });
  }

  const errors = validateUpdateItem(body);
  if (errors.length > 0) {
    return createResponse(400, { message: "Validation failed", errors });
  }

  try {
    const item = await itemService.updateItem(id, body || {});
    return createResponse(200, item);
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      return createResponse(404, { message: `Item with id ${id} not found` });
    }
    console.error("Error updating item:", error);
    return createResponse(500, { message: "Internal server error" });
  }
};
