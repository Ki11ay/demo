import { parseBody, createResponse, validateCreateItem, validateUpdateItem } from "../api";

describe("api utils", () => {
  describe("parseBody", () => {
    it("should parse valid JSON", () => {
      const body = JSON.stringify({ id: "1", name: "Test" });
      const result = parseBody<{ id: string; name: string }>(body);
      expect(result).toEqual({ id: "1", name: "Test" });
    });

    it("should return null for invalid JSON", () => {
      const result = parseBody("invalid-json");
      expect(result).toBeNull();
    });

    it("should return null for null input", () => {
      const result = parseBody(null);
      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      const result = parseBody(undefined);
      expect(result).toBeNull();
    });
  });

  describe("createResponse", () => {
    it("should create a response with status code and body", () => {
      const body = { message: "Success" };
      const response = createResponse(200, body) as any;
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(JSON.stringify(body));
      expect(response.headers).toEqual({ "Content-Type": "application/json" });
    });

    it("should create a response with empty body if not provided", () => {
      const response = createResponse(204) as any;
      expect(response.statusCode).toBe(204);
      expect(response.body).toBe("");
    });
  });

  describe("validateCreateItem", () => {
    it("should return no errors for valid data", () => {
      const data = { id: "1", name: "Item" };
      const errors = validateCreateItem(data);
      expect(errors).toHaveLength(0);
    });

    it("should return errors for missing id", () => {
      const data = { name: "Item" };
      const errors = validateCreateItem(data);
      expect(errors).toContain("id is required and must be a string");
    });

    it("should return errors for non-string id", () => {
      const data = { id: 123, name: "Item" };
      const errors = validateCreateItem(data);
      expect(errors).toContain("id is required and must be a string");
    });

    it("should return errors for missing name", () => {
      const data = { id: "1" };
      const errors = validateCreateItem(data);
      expect(errors).toContain("name is required and must be a string");
    });
  });

  describe("validateUpdateItem", () => {
    it("should return no errors for valid data", () => {
      const data = { name: "Updated", description: "New description" };
      const errors = validateUpdateItem(data);
      expect(errors).toHaveLength(0);
    });

    it("should return no errors for empty data", () => {
      const data = {};
      const errors = validateUpdateItem(data);
      expect(errors).toHaveLength(0);
    });

    it("should return errors for non-string name", () => {
      const data = { name: 123 };
      const errors = validateUpdateItem(data);
      expect(errors).toContain("name must be a string");
    });

    it("should return errors for non-string description", () => {
      const data = { description: true };
      const errors = validateUpdateItem(data);
      expect(errors).toContain("description must be a string");
    });
  });
});
