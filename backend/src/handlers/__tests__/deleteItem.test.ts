import { handler as deleteHandler } from "../deleteItem";
import { mockClient } from "aws-sdk-client-mock";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { ddbDocClient, ebClient } from "../../services/aws";

const ddbMock = mockClient(ddbDocClient);
const ebMock = mockClient(ebClient);

describe("deleteItem handler", () => {
  beforeEach(() => {
    ddbMock.reset();
    ebMock.reset();
  });

  it("returns 204 on success", async () => {
    const event = {
      pathParameters: { id: "1" },
    } as any;

    ddbMock.on(DeleteCommand).resolves({});
    ebMock.on(PutEventsCommand).resolves({});

    const result = await deleteHandler(event, {} as any, () => {}) as any;
    
    expect(result.statusCode).toBe(204);
  });

  it("returns 404 if item doesn't exist", async () => {
    const event = {
      pathParameters: { id: "1" },
    } as any;

    const error = new Error("Conditional check failed");
    error.name = "ConditionalCheckFailedException";
    ddbMock.on(DeleteCommand).rejects(error);

    const result = await deleteHandler(event, {} as any, () => {}) as any;
    
    expect(result.statusCode).toBe(404);
  });
});
