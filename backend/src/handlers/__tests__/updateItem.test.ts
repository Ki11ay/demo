import { handler as updateHandler } from "../updateItem";
import { mockClient } from "aws-sdk-client-mock";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { ddbDocClient, ebClient } from "../../services/aws";

const ddbMock = mockClient(ddbDocClient);
const ebMock = mockClient(ebClient);

describe("updateItem handler", () => {
  beforeEach(() => {
    ddbMock.reset();
    ebMock.reset();
  });

  it("returns 200 on success", async () => {
    const event = {
      pathParameters: { id: "1" },
      body: JSON.stringify({ name: "Updated Name" }),
    } as any;

    ddbMock.on(UpdateCommand).resolves({
      Attributes: { id: "1", name: "Updated Name" },
    });
    ebMock.on(PutEventsCommand).resolves({});

    const result = await updateHandler(event, {} as any, () => {}) as any;
    
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.name).toBe("Updated Name");
  });

  it("returns 404 if item doesn't exist", async () => {
    const event = {
      pathParameters: { id: "1" },
      body: JSON.stringify({ name: "Updated Name" }),
    } as any;

    const error = new Error("Conditional check failed");
    error.name = "ConditionalCheckFailedException";
    ddbMock.on(UpdateCommand).rejects(error);

    const result = await updateHandler(event, {} as any, () => {}) as any;
    
    expect(result.statusCode).toBe(404);
  });
});
