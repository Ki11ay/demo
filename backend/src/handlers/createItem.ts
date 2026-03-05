import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { itemService } from "../services/items.service";
import { parseBody, createResponse, validateCreateItem } from "../utils/api";
import { CreateItemInput } from "../types/item";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const body = parseBody<CreateItemInput>(event.body);
  const errors = validateCreateItem(body);

  if (errors.length > 0) {
    return createResponse(400, { message: "Validation failed", errors });
  }

  try {
    const item = await itemService.createItem(body!);
    return createResponse(201, item);
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      return createResponse(409, { message: `Item with id ${body!.id} already exists` });
    }
    console.error("Error creating item:", error);
    return createResponse(500, { message: "Internal server error" });
  }
};
