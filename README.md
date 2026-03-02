# Meals Backend

XomFit Meals API — AWS Lambda functions for meal tracking and ratings.

## Architecture

```
API Gateway (REST) → Lambda Authorizer → Lambda Functions → DynamoDB
```

Each endpoint is a separate Lambda function in the `functions/` directory, sharing utilities from `shared/`.

## Project Structure

```
meals-backend/
├── functions/
│   ├── authorizer/       # Token-based Lambda authorizer
│   ├── meals-list/       # GET    /meals/list
│   ├── meals-create/     # POST   /meals/create
│   ├── meals-get/        # GET    /meals/get?mealId=xxx
│   ├── meals-update/     # PUT    /meals/update
│   ├── meals-delete/     # DELETE /meals/delete
│   ├── meals-rate/       # POST   /meals/rate
│   └── meals-ratings/    # GET    /meals/ratings?mealId=xxx
├── shared/
│   ├── auth.js           # Extract userId from authorizer context
│   ├── dynamo.js         # DynamoDB document client
│   └── response.js       # Standardized API responses with CORS
├── package.json
├── .env.example
└── README.md
```

## API Reference

All endpoints require `Authorization: Bearer <token>` header. The Lambda authorizer validates the JWT and injects `userId` into the request context.

### Meals

#### List Meals
```
GET /meals/list
```
Returns all meals for the authenticated user.

**Response:**
```json
{ "meals": [{ "userId": "...", "mealId": "...", "name": "...", ... }] }
```

#### Create Meal
```
POST /meals/create
Content-Type: application/json

{
  "name": "Chicken Parm",
  "description": "Classic Italian-American",
  "ingredients": ["chicken", "mozzarella", "marinara"],
  "tags": ["italian", "dinner"],
  "imageUrl": "https://..."
}
```
`name` is required. All other fields are optional.

**Response (201):**
```json
{ "meal": { "userId": "...", "mealId": "uuid", "name": "Chicken Parm", ... } }
```

#### Get Meal
```
GET /meals/get?mealId=<uuid>
```

**Response:**
```json
{ "meal": { "userId": "...", "mealId": "...", "name": "...", ... } }
```

#### Update Meal
```
PUT /meals/update
Content-Type: application/json

{
  "mealId": "<uuid>",
  "name": "Updated Name",
  "description": "Updated description",
  "ingredients": ["updated"],
  "tags": ["updated"],
  "imageUrl": "https://new-image.jpg"
}
```
`mealId` is required. Only provided fields are updated. Allowed fields: `name`, `description`, `ingredients`, `tags`, `imageUrl`.

**Response:**
```json
{ "meal": { ...updatedMeal } }
```

#### Delete Meal
```
DELETE /meals/delete
Content-Type: application/json

{ "mealId": "<uuid>" }
```
Also accepts `mealId` as query parameter.

**Response:**
```json
{ "message": "Meal deleted" }
```

### Ratings

#### Rate a Meal
```
POST /meals/rate
Content-Type: application/json

{
  "mealId": "<uuid>",
  "rating": 5,
  "comment": "Incredible"
}
```
`mealId` and `rating` (1-5) are required. `comment` is optional. One rating per user per meal (upserts).

**Response (201):**
```json
{ "rating": { "userId": "...", "mealId": "...", "rating": 5, "comment": "Incredible", ... } }
```

#### Get Ratings
```
GET /meals/ratings?mealId=<uuid>
```
Returns all ratings for a meal with average.

**Response:**
```json
{
  "mealId": "<uuid>",
  "ratings": [...],
  "averageRating": 4.3,
  "totalRatings": 7
}
```

## Database Schema

### Meals Table (`meals`)

| Attribute     | Type   | Key  | Description           |
|---------------|--------|------|-----------------------|
| `userId`      | String | PK   | Authenticated user ID |
| `mealId`      | String | SK   | UUID                  |
| `name`        | String |      | Meal name             |
| `description` | String |      | Optional description  |
| `ingredients` | List   |      | List of strings       |
| `tags`        | List   |      | List of strings       |
| `imageUrl`    | String |      | Optional image URL    |
| `createdAt`   | String |      | ISO 8601 timestamp    |
| `updatedAt`   | String |      | ISO 8601 timestamp    |

### Meal Ratings Table (`meal-ratings`)

| Attribute   | Type   | Key       | Description               |
|-------------|--------|-----------|---------------------------|
| `userId`    | String | PK        | Rater's user ID           |
| `mealId`    | String | SK        | Meal being rated          |
| `rating`    | Number |           | 1-5                       |
| `comment`   | String |           | Optional comment          |
| `createdAt` | String |           | ISO 8601 timestamp        |
| `updatedAt` | String |           | ISO 8601 timestamp        |

**GSI:** `mealId-userId-index` (PK: `mealId`, SK: `userId`) — enables querying all ratings for a meal.

## Environment Variables

| Variable                  | Required | Description                        | Example            |
|---------------------------|----------|------------------------------------|--------------------|
| `AWS_REGION`              | Yes      | AWS region                         | `us-east-1`        |
| `MEALS_TABLE_NAME`        | Yes      | DynamoDB meals table name          | `meals`            |
| `MEAL_RATINGS_TABLE_NAME` | Yes      | DynamoDB ratings table name        | `meal-ratings`     |
| `APP_NAME`                | No       | App name for SSM parameter paths   | `meals`            |

The authorizer reads the API secret key from SSM Parameter Store at `/${APP_NAME}/api/API_SECRET_KEY`.

## Deployment

Each function is deployed as a separate AWS Lambda. Infrastructure is managed in [meals-infrastructure](https://github.com/Xomware/meals-infrastructure) via Terraform.

### Manual Deployment (per function)

```bash
# Install dependencies
npm install

# Package a function (example: meals-create)
cd functions/meals-create
zip -r ../../meals-create.zip index.js
cd ../../shared
zip -r ../meals-create.zip .
cd ..

# Deploy
aws lambda update-function-code \
  --function-name meals-create \
  --zip-file fileb://meals-create.zip
```

### Lambda Configuration
- **Runtime:** Node.js 18.x+
- **Handler:** `index.handler`
- **Timeout:** 10s recommended
- **Memory:** 128MB (sufficient for CRUD operations)

## Test Examples (curl)

Replace `$API_URL` with your API Gateway endpoint and `$TOKEN` with a valid JWT.

```bash
export API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
export TOKEN="your-jwt-token"

# List meals
curl -s "$API_URL/meals/list" \
  -H "Authorization: Bearer $TOKEN" | jq

# Create a meal
curl -s -X POST "$API_URL/meals/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chicken Parm",
    "description": "Classic Italian-American",
    "ingredients": ["chicken breast", "mozzarella", "marinara sauce"],
    "tags": ["italian", "dinner", "comfort food"]
  }' | jq

# Get a meal
curl -s "$API_URL/meals/get?mealId=MEAL_ID_HERE" \
  -H "Authorization: Bearer $TOKEN" | jq

# Update a meal
curl -s -X PUT "$API_URL/meals/update" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mealId": "MEAL_ID_HERE",
    "name": "Updated Chicken Parm",
    "tags": ["italian", "dinner", "updated"]
  }' | jq

# Delete a meal
curl -s -X DELETE "$API_URL/meals/delete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mealId": "MEAL_ID_HERE"}' | jq

# Rate a meal
curl -s -X POST "$API_URL/meals/rate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mealId": "MEAL_ID_HERE",
    "rating": 5,
    "comment": "Best chicken parm ever"
  }' | jq

# Get ratings for a meal
curl -s "$API_URL/meals/ratings?mealId=MEAL_ID_HERE" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Error Responses

All errors follow this format:
```json
{ "error": "Error message here" }
```

| Status | Meaning                    |
|--------|----------------------------|
| 400    | Bad request / validation   |
| 401    | Unauthorized               |
| 404    | Resource not found         |
| 500    | Internal server error      |

## License

Private — Xomware
