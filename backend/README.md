# Simple CRUD App with DynamoDB & EventBridge

A serverless CRUD (Create, Read, Update, Delete) application built with TypeScript, AWS Lambda, DynamoDB, and EventBridge, deployed using Terraform.

## Architecture
- **API Gateway (HTTP API):** Entry point for RESTful requests.
- **AWS Lambda:** Individual TypeScript functions acting as thin controllers.
- **Service Layer:** Business logic moved to `ItemService` for reusability and testability.
- **DynamoDB:** NoSQL database with **conditional writes** for data integrity.
- **EventBridge:** Custom Event Bus to broadcast item lifecycle events.
- **CloudWatch Logs:** Logs all events for auditing.

## Project Structure
```text
├── src/
│   ├── handlers/          # Thin Controllers (APIGateway Handlers)
│   │   └── __tests__/     # Unit tests (Jest + AWS Mock)
│   ├── services/          # Business Logic & Infrastructure
│   │   ├── aws.ts         # AWS SDK v3 clients
│   │   └── items.service.ts # DynamoDB + EventBridge logic
│   ├── types/             # Shared TypeScript Interfaces
│   └── utils/             # Validation & API helpers
├── terraform/             # Infrastructure as Code
├── build.mjs              # esbuild bundling script
├── smoke-test.sh          # Integration test script
└── package.json           # Dependencies and scripts
```

## Features
- **Validation:** Shared utility for safe body parsing and schema validation.
- **Conditional Writes:**
  - `POST /items`: Fails with **409 Conflict** if ID already exists.
  - `PUT/DELETE`: Fails with **404 Not Found** if ID does not exist.
- **Security:** Raw internal errors are hidden; clients receive clean error messages.

## Prerequisites
- Node.js 20+
- AWS CLI configured
- Terraform installed

## CI/CD Pipeline (Recommended)

A GitHub Actions workflow (`.github/workflows/deploy.yml`) automates the full
build-and-deploy lifecycle so you never have to run Terraform manually.

### How it works

| Trigger | Jobs executed |
|---|---|
| Pull request → `main` | **Test & Build** → **Terraform Plan** (dry-run, no changes applied) |
| Push / merge → `main` | **Test & Build** → **Terraform Apply** (deploys to AWS) |

### Required GitHub Secrets

Add the following secrets to your repository
(**Settings → Secrets and variables → Actions**):

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user or role access key with deploy permissions |
| `AWS_SECRET_ACCESS_KEY` | Corresponding secret access key |

### Pipeline Stages

1. **Test & Build** – installs Node dependencies, runs Jest unit tests, and
   bundles all Lambda handlers with esbuild.  The compiled `dist/` artefacts are
   uploaded so downstream jobs can use them without rebuilding.
2. **Terraform Plan** *(PR only)* – initialises Terraform, validates the
   configuration, and produces a plan so reviewers can see infrastructure
   changes before merging.
3. **Terraform Apply** *(main branch only)* – applies the validated plan to AWS.
   Runs in the `production` GitHub Environment, which can be configured with
   required reviewers for an additional approval gate.

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
```bash
npm test
```

### 3. Build and Bundle
```bash
npm run build
```

### 4. Deploy with Terraform (manual)
```bash
cd terraform
terraform init
terraform apply
```

### 5. Integration Smoke Test
After deployment, run the smoke test script with your API URL:
```bash
chmod +x smoke-test.sh
./smoke-test.sh <api_endpoint_url>
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
