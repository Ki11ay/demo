import { APIGatewayProxyResultV2 } from "aws-lambda";

export const parseBody = <T>(body: string | null | undefined): T | null => {
  if (!body) return null;
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
};

export const createResponse = (
  statusCode: number,
  body?: any
): APIGatewayProxyResultV2 => {
  return {
    statusCode,
    body: body ? JSON.stringify(body) : "",
    headers: {
      "Content-Type": "application/json",
    },
  };
};

export const validateCreateItem = (data: any): string[] => {
  const errors: string[] = [];
  if (!data?.id || typeof data.id !== "string") errors.push("id is required and must be a string");
  if (!data?.name || typeof data.name !== "string") errors.push("name is required and must be a string");
  return errors;
};

export const validateUpdateItem = (data: any): string[] => {
  const errors: string[] = [];
  if (data?.name !== undefined && typeof data.name !== "string") errors.push("name must be a string");
  if (data?.description !== undefined && typeof data.description !== "string") errors.push("description must be a string");
  return errors;
};
