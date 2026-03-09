# Simple CRUD App with DynamoDB & EventBridge

A serverless CRUD (Create, Read, Update, Delete) application built with TypeScript, AWS Lambda, DynamoDB, and EventBridge, deployed using Terraform.

## Architecture
- **API Gateway (HTTP API):** Entry point for RESTful requests.
- **AWS Lambda:** Individual TypeScript functions acting as thin controllers.
- **Service Layer:** Business logic in `ItemService` for reusability and testability.
- **DynamoDB:** NoSQL database with **conditional writes** for data integrity.
- **EventBridge:** Custom Event Bus to broadcast item lifecycle events.
- **CloudWatch Logs:** Logs all events for auditing.

## Project Structure
```text
├── src/
│   ├── handlers/          # Thin Controllers (APIGateway Handlers)
│   │   └── __tests__/     # Unit & E2E tests (Jest + AWS Mock)
│   ├── services/          # Business Logic & Infrastructure
│   │   ├── __tests__/     # Service layer unit tests
│   │   ├── aws.ts         # AWS SDK v3 clients
│   │   └── items.service.ts # DynamoDB + EventBridge logic
│   ├── types/             # Shared TypeScript Interfaces
│   └── utils/             # Validation & API helpers
│       └── __tests__/     # Utility unit tests
├── terraform/             # Infrastructure as Code
├── build.mjs              # esbuild bundling script
├── smoke-test.sh          # Integration test script
└── package.json           # Dependencies and scripts
```

## Infrastructure & AWS Services
The application is deployed using Terraform and utilizes the following AWS services:

### 1. API Gateway (HTTP API)
- **Endpoint:** Exposes the Lambda functions via a public URL.
- **Routes:**
  - `POST /items`: Invokes `createItem`
  - `GET /items/{id}`: Invokes `getItem`
  - `PUT /items/{id}`: Invokes `updateItem`
  - `DELETE /items/{id}`: Invokes `deleteItem`

### 2. AWS Lambda
- **Runtime:** Node.js 20.x
- **Architecture:** Individual zip files bundled via `esbuild`.
- **Permissions:** Configured with IAM roles allowing access to DynamoDB and EventBridge.

### 3. DynamoDB
- **Table:** `demo-crud-items`
- **Partition Key:** `id` (String)
- **Billing Mode:** Pay-per-request (on-demand)
- **Features:** Conditional writes used to prevent duplicate IDs and ensure atomicity.

### 4. EventBridge
- **Event Bus:** Custom bus named `demo-crud-bus`.
- **Events:**
  - `Source: myapp.items`
  - `DetailType: ItemCreated | ItemUpdated | ItemDeleted`
- **Consumer:** A CloudWatch Log Group logs all events for auditing purposes.

### 5. CloudWatch Logs
- **Lambda Logs:** `/aws/lambda/demo-crud-*`
- **Event Logs:** `/aws/events/demo-crud-events`

## Infrastructure Deployment (Terraform)
The Terraform configuration is modularized into several files for clarity:
- `main.tf`: AWS provider and region setup.
- `variables.tf`: Project naming and region variables.
- `dynamodb.tf`: Table definition.
- `eventbridge.tf`: Custom bus, catch-all rules, and log targets.
- `lambda.tf`: Function definitions, code archiving, and environment variables.
- `api_gateway.tf`: HTTP API, routes, integrations, and permissions.
- `iam.tf`: Roles and policies for Lambda execution.
- `outputs.tf`: Exports the final API endpoint URL.

## Prerequisites
- Node.js 20+
- **AWS CLI**: Installed and configured.
  - To configure, run: `aws configure`
  - Ensure your IAM user has permissions for Lambda, DynamoDB, EventBridge, IAM, and API Gateway.
- **Terraform**: Installed.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
The project includes a comprehensive test suite using **Jest** and **aws-sdk-client-mock**:
- **Unit Tests:** For services and utility functions.
- **Handler Tests:** Individual tests for each Lambda entry point.
- **E2E Mimicry:** A suite that simulates a full item lifecycle through the handlers using realistic API Gateway events.

```bash
npm test
```

### 3. Build and Bundle
```bash
npm run build
```

### 4. Deploy with Terraform
```bash
cd terraform
terraform init
terraform apply
```

### 5. Integration Smoke Test
After deployment, run the smoke test script with your API URL. 

Example using the existing endpoint:
```bash
chmod +x smoke-test.sh
./smoke-test.sh "https://oga5v053w1.execute-api.us-east-1.amazonaws.com"
```

## API Usage

### Create an Item
**POST** `/items`
```json
{
  "id": "123",
  "name": "Sample Item",
  "description": "This is a test item"
}
```

### Get an Item
**GET** `/items/123`

### Update an Item
**PUT** `/items/123`
```json
{
  "name": "Updated Name"
}
```

### Delete an Item
**DELETE** `/items/123`
