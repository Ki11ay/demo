import { handler as getHandler } from "../getItem";
import { mockClient } from "aws-sdk-client-mock";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "../../services/aws";

const ddbMock = mockClient(ddbDocClient);

describe("getItem handler", () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  it("returns 200 on success", async () => {
    const event = {
      pathParameters: { id: "1" },
    } as any;

    ddbMock.on(GetCommand).resolves({
      Item: { id: "1", name: "Test Item" },
    });

    const result = await getHandler(event, {} as any, () => {}) as any;
    
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.id).toBe("1");
  });

  it("returns 404 if not found", async () => {
    const event = {
      pathParameters: { id: "2" },
    } as any;

    ddbMock.on(GetCommand).resolves({
      Item: undefined,
    });

    const result = await getHandler(event, {} as any, () => {}) as any;
    
    expect(result.statusCode).toBe(404);
  });
});
