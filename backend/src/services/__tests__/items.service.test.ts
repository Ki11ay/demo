import { ItemService } from "../items.service";
import { mockClient } from "aws-sdk-client-mock";
import { ddbDocClient, ebClient } from "../aws";
import { GetCommand, PutCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";

const ddbMock = mockClient(ddbDocClient);
const ebMock = mockClient(ebClient);

describe("ItemService", () => {
  const itemService = new ItemService();
  const testItem = { id: "1", name: "Test Item", description: "Test" };

  beforeEach(() => {
    ddbMock.reset();
    ebMock.reset();
  });

  describe("createItem", () => {
    it("should create an item and publish an event", async () => {
      ddbMock.on(PutCommand).resolves({});
      ebMock.on(PutEventsCommand).resolves({});

      const result = await itemService.createItem(testItem);

      expect(result.id).toBe(testItem.id);
      expect(result.name).toBe(testItem.name);
      expect(result.createdAt).toBeDefined();
      expect(ddbMock.calls()).toHaveLength(1);
      expect(ebMock.calls()).toHaveLength(1);
      const ebInput = ebMock.call(0).args[0].input as any;
      expect(ebInput.Entries?.[0].DetailType).toBe("ItemCreated");
    });

    it("should throw error if PutCommand fails", async () => {
      ddbMock.on(PutCommand).rejects(new Error("DDB Error"));

      await expect(itemService.createItem(testItem)).rejects.toThrow("DDB Error");
    });
  });

  describe("getItem", () => {
    it("should return the item if found", async () => {
      ddbMock.on(GetCommand).resolves({ Item: testItem });

      const result = await itemService.getItem("1");

      expect(result).toEqual(testItem);
      expect(ddbMock.calls()).toHaveLength(1);
    });

    it("should return null if item not found", async () => {
      ddbMock.on(GetCommand).resolves({ Item: undefined });

      const result = await itemService.getItem("1");

      expect(result).toBeNull();
    });
  });

  describe("updateItem", () => {
    it("should update an item and publish an event", async () => {
      const updatedItem = { ...testItem, name: "Updated Name" };
      ddbMock.on(UpdateCommand).resolves({ Attributes: updatedItem });
      ebMock.on(PutEventsCommand).resolves({});

      const result = await itemService.updateItem("1", { name: "Updated Name" });

      expect(result.name).toBe("Updated Name");
      expect(ddbMock.calls()).toHaveLength(1);
      expect(ebMock.calls()).toHaveLength(1);
      const ebInput = ebMock.call(0).args[0].input as any;
      expect(ebInput.Entries?.[0].DetailType).toBe("ItemUpdated");
    });

    it("should throw error if item does not exist (conditional failure)", async () => {
      const error = new Error("Conditional check failed");
      error.name = "ConditionalCheckFailedException";
      ddbMock.on(UpdateCommand).rejects(error);

      await expect(itemService.updateItem("1", { name: "Updated Name" })).rejects.toThrow("Conditional check failed");
    });
  });

  describe("deleteItem", () => {
    it("should delete an item and publish an event", async () => {
      ddbMock.on(DeleteCommand).resolves({});
      ebMock.on(PutEventsCommand).resolves({});

      await itemService.deleteItem("1");

      expect(ddbMock.calls()).toHaveLength(1);
      expect(ebMock.calls()).toHaveLength(1);
      const ebInput = ebMock.call(0).args[0].input as any;
      expect(ebInput.Entries?.[0].DetailType).toBe("ItemDeleted");
    });

    it("should throw error if DeleteCommand fails", async () => {
      ddbMock.on(DeleteCommand).rejects(new Error("DDB Error"));

      await expect(itemService.deleteItem("1")).rejects.toThrow("DDB Error");
    });
  });
});
