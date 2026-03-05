# Simple CRUD App with DynamoDB & EventBridge

A serverless CRUD (Create, Read, Update, Delete) application built with TypeScript, AWS Lambda, DynamoDB, and EventBridge, deployed using Terraform.

## Architecture
- **API Gateway (HTTP API):** Entry point for RESTful requests.
- **AWS Lambda:** Individual TypeScript functions for each CRUD operation.
- **DynamoDB:** NoSQL database for item storage.
- **EventBridge:** Custom Event Bus to broadcast item lifecycle events (`ItemCreated`, `ItemUpdated`, `ItemDeleted`).
- **CloudWatch Logs:** Catch-all rule logs all events from the custom bus for auditing.

## Project Structure
```text
├── src/
│   ├── handlers/          # Lambda function entry points
│   │   ├── createItem.ts  # POST /items
│   │   ├── getItem.ts     # GET /items/{id}
│   │   ├── updateItem.ts  # PUT /items/{id}
│   │   └── deleteItem.ts  # DELETE /items/{id}
│   └── services/
│       └── aws.ts         # Shared AWS SDK v3 clients
├── terraform/             # Infrastructure as Code
│   ├── main.tf            # Provider configuration
│   ├── dynamodb.tf        # Table definitions
│   ├── eventbridge.tf     # Bus, Rules, and Logging
│   ├── lambda.tf          # Function definitions & bundling
│   ├── api_gateway.tf     # HTTP API & Routes
│   └── iam.tf             # Permissions and Roles
├── build.mjs              # esbuild bundling script
└── package.json           # Dependencies and scripts
```

## Prerequisites
- Node.js 20+
- AWS CLI configured with appropriate permissions
- Terraform installed

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Build and Bundle
This step uses `esbuild` to compile TypeScript and bundle dependencies into the `dist/` folder.
```bash
npm run build
```

### 3. Deploy with Terraform
```bash
cd terraform
terraform init
terraform apply
```
After completion, Terraform will output the `api_endpoint`.

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
  "name": "Updated Name",
  "description": "New description"
}
```

### Delete an Item
**DELETE** `/items/123`

## Event Monitoring
Whenever an item is modified, an event is sent to the custom EventBridge bus. You can view these events in the CloudWatch Log Group:
`/aws/events/demo-crud-events`
