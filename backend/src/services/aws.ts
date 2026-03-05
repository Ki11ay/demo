import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";

const region = process.env.AWS_REGION || "us-east-1";

export const ddbClient = new DynamoDBClient({ region });
export const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
export const ebClient = new EventBridgeClient({ region });
