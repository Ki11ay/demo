import { handler as createHandler } from "../createItem";
import { mockClient } from "aws-sdk-client-mock";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { ddbDocClient, ebClient } from "../../services/aws";

const ddbMock = mockClient(ddbDocClient);
const ebMock = mockClient(ebClient);

describe("createItem handler", () => {
  beforeEach(() => {
    ddbMock.reset();
    ebMock.reset();
  });

  it("returns 201 on success", async () => {
    const event = {
      body: JSON.stringify({ id: "1", name: "Test Item" }),
    } as any;

    ddbMock.on(PutCommand).resolves({});
    ebMock.on(PutEventsCommand).resolves({});

    const result = await createHandler(event, {} as any, () => {}) as any;
    
    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.id).toBe("1");
    expect(body.name).toBe("Test Item");
  });

  it("returns 400 on validation failure", async () => {
    const event = {
      body: JSON.stringify({ id: "1" }), // Missing name
    } as any;

    const result = await createHandler(event, {} as any, () => {}) as any;
    
    expect(result.statusCode).toBe(400);
    expect(result.body).toContain("Validation failed");
  });

  it("returns 409 if item already exists", async () => {
    const event = {
      body: JSON.stringify({ id: "1", name: "Test Item" }),
    } as any;

    const error = new Error("Conditional check failed");
    error.name = "ConditionalCheckFailedException";
    ddbMock.on(PutCommand).rejects(error);

    const result = await createHandler(event, {} as any, () => {}) as any;
    
    expect(result.statusCode).toBe(409);
    expect(result.body).toContain("already exists");
  });

  it("returns 500 on internal error", async () => {
    const event = {
      body: JSON.stringify({ id: "1", name: "Test Item" }),
    } as any;

    ddbMock.on(PutCommand).rejects(new Error("Unknown error"));

    const result = await createHandler(event, {} as any, () => {}) as any;
    
    expect(result.statusCode).toBe(500);
    expect(result.body).toContain("Internal server error");
  });
});
