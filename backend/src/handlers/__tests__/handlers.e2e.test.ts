import { handler as createHandler } from "../createItem";
import { handler as getHandler } from "../getItem";
import { handler as updateHandler } from "../updateItem";
import { handler as deleteHandler } from "../deleteItem";
import { mockClient } from "aws-sdk-client-mock";
import { ddbDocClient, ebClient } from "../../services/aws";
import { GetCommand, PutCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { APIGatewayProxyEventV2 } from "aws-lambda";

const ddbMock = mockClient(ddbDocClient);
const ebMock = mockClient(ebClient);

const createEvent = (options: {
  body?: any;
  pathParameters?: Record<string, string>;
  method: string;
  path: string;
}): APIGatewayProxyEventV2 => {
  return {
    version: "2.0",
    routeKey: `${options.method} ${options.path}`,
    rawPath: options.path,
    rawQueryString: "",
    headers: {
      "content-type": "application/json",
    },
    requestContext: {
      http: {
        method: options.method,
        path: options.path,
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "jest-test",
      },
    } as any,
    body: options.body ? JSON.stringify(options.body) : undefined,
    pathParameters: options.pathParameters,
    isBase64Encoded: false,
  } as any;
};

describe("Handlers E2E Flow (Mimicked)", () => {
  const itemId = "e2e-test-item";
  const testItem = { id: itemId, name: "E2E Item", description: "Integration test" };

  beforeEach(() => {
    ddbMock.reset();
    ebMock.reset();
  });

  it("should complete the full lifecycle: Create -> Get -> Update -> Delete -> Get (404)", async () => {
    // 1. Create Item
    ddbMock.on(PutCommand).resolves({});
    ebMock.on(PutEventsCommand).resolves({});

    const createReq = createEvent({
      method: "POST",
      path: "/items",
      body: testItem,
    });

    const createRes = await createHandler(createReq, {} as any, () => {}) as any;
    expect(createRes.statusCode).toBe(201);
    expect(JSON.parse(createRes.body).id).toBe(itemId);

    // 2. Get Item
    ddbMock.on(GetCommand).resolves({ Item: { ...testItem, createdAt: new Date().toISOString() } });

    const getReq = createEvent({
      method: "GET",
      path: `/items/${itemId}`,
      pathParameters: { id: itemId },
    });

    const getRes = await getHandler(getReq, {} as any, () => {}) as any;
    expect(getRes.statusCode).toBe(200);
    expect(JSON.parse(getRes.body).name).toBe("E2E Item");

    // 3. Update Item
    const updatedItem = { ...testItem, name: "Updated E2E Item" };
    ddbMock.on(UpdateCommand).resolves({ Attributes: updatedItem });

    const updateReq = createEvent({
      method: "PUT",
      path: `/items/${itemId}`,
      pathParameters: { id: itemId },
      body: { name: "Updated E2E Item" },
    });

    const updateRes = await updateHandler(updateReq, {} as any, () => {}) as any;
    expect(updateRes.statusCode).toBe(200);
    expect(JSON.parse(updateRes.body).name).toBe("Updated E2E Item");

    // 4. Delete Item
    ddbMock.on(DeleteCommand).resolves({});

    const deleteReq = createEvent({
      method: "DELETE",
      path: `/items/${itemId}`,
      pathParameters: { id: itemId },
    });

    const deleteRes = await deleteHandler(deleteReq, {} as any, () => {}) as any;
    expect(deleteRes.statusCode).toBe(204);

    // 5. Get Item (Not Found)
    ddbMock.on(GetCommand).resolves({ Item: undefined });

    const getFinalRes = await getHandler(getReq, {} as any, () => {}) as any;
    expect(getFinalRes.statusCode).toBe(404);
  });

  it("should return 400 when creating item with invalid body", async () => {
    const invalidReq = createEvent({
      method: "POST",
      path: "/items",
      body: { id: itemId }, // Missing name
    });

    const res = await createHandler(invalidReq, {} as any, () => {}) as any;
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain("Validation failed");
  });

  it("should return 409 when creating an existing item", async () => {
    const error = new Error("Conditional check failed");
    error.name = "ConditionalCheckFailedException";
    ddbMock.on(PutCommand).rejects(error);

    const req = createEvent({
      method: "POST",
      path: "/items",
      body: testItem,
    });

    const res = await createHandler(req, {} as any, () => {}) as any;
    expect(res.statusCode).toBe(409);
  });
});
