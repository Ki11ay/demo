import { GetCommand, PutCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { ddbDocClient, ebClient } from "./aws";
import { Item, CreateItemInput, UpdateItemInput } from "../types/item";

const TABLE_NAME = process.env.TABLE_NAME || "ItemsTable";
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || "default";

export class ItemService {
  async createItem(input: CreateItemInput): Promise<Item> {
    const item: Item = {
      ...input,
      createdAt: new Date().toISOString(),
    };

    // Conditional write: Only if id doesn't exist
    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: "attribute_not_exists(id)",
      })
    );

    await this.publishEvent("ItemCreated", item);
    return item;
  }

  async getItem(id: string): Promise<Item | null> {
    const response = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
      })
    );
    return (response.Item as Item) || null;
  }

  async updateItem(id: string, input: UpdateItemInput): Promise<Item> {
    const updateExpression = [];
    const expressionAttributeValues: Record<string, any> = {
      ":updatedAt": new Date().toISOString(),
    };
    const expressionAttributeNames: Record<string, string> = {
      "#name": "name", // name is a reserved keyword in some contexts
    };

    if (input.name !== undefined) {
      updateExpression.push("#name = :name");
      expressionAttributeValues[":name"] = input.name;
    }
    if (input.description !== undefined) {
      updateExpression.push("description = :description");
      expressionAttributeValues[":description"] = input.description;
    }
    updateExpression.push("updatedAt = :updatedAt");

    // Conditional write: Only if id exists
    const response = await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: "attribute_exists(id)",
        ReturnValues: "ALL_NEW",
      })
    );

    const updatedItem = response.Attributes as Item;
    await this.publishEvent("ItemUpdated", updatedItem);
    return updatedItem;
  }

  async deleteItem(id: string): Promise<void> {
    // Conditional write: Only if id exists
    await ddbDocClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id },
        ConditionExpression: "attribute_exists(id)",
      })
    );

    await this.publishEvent("ItemDeleted", { id });
  }

  private async publishEvent(detailType: string, detail: any) {
    await ebClient.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: "myapp.items",
            DetailType: detailType,
            Detail: JSON.stringify(detail),
            EventBusName: EVENT_BUS_NAME,
          },
        ],
      })
    );
  }
}

export const itemService = new ItemService();
