# Meals Backend API

Serverless backend for the Meals tracking application. Built with AWS Lambda, API Gateway, and DynamoDB.

## Architecture

- **Runtime:** Node.js 20.x (CommonJS)
- **Database:** DynamoDB (meals + meal-ratings tables)
- **Auth:** `X-Auth-Hash` header validated by Lambda authorizer against AWS SSM Parameter Store
- **Infrastructure:** Defined in [`meals-infra`](https://github.com/Xomware/meals-infra)

## Project Structure

```
functions/
  authorizer/index.js      # X-Auth-Hash validation against SSM
  meals-list/index.js       # GET /meals
  meals-create/index.js     # POST /meals
  meals-get/index.js        # GET /meals/{id}
  meals-update/index.js     # PATCH /meals/{id}/toggle-cooked
  meals-delete/index.js     # DELETE /meals/{id}
  meals-rate/index.js       # PATCH /meals/{id}/rate
  meals-ratings/index.js    # GET /meals/{id}/ratings
shared/
  auth.js                   # Extract userId from authorizer context
  dynamo.js                 # DynamoDB DocumentClient singleton
  response.js               # Standardized CORS response helpers
```

## API Reference

All endpoints require the `X-Auth-Hash` header for authentication.

### List Meals

```
GET /meals
```

Returns an array of all meals for the authenticated user.

**Response:** `200 OK`
```json
[
  {
    "userId": "abc123",
    "mealId": "uuid",
    "id": "uuid",
    "name": "Chicken Stir Fry",
    "timeMinutes": 25,
    "difficulty": "Easy",
    "proteinSource": "Chicken",
    "ingredients": ["chicken breast", "broccoli", "soy sauce"],
    "macros": { "calories": 450, "protein": 40, "carbs": 20, "fat": 15 },
    "cooked": false,
    "createdAt": "2026-03-01T12:00:00.000Z"
  }
]
```

### Create Meal

```
POST /meals
```

**Body:**
```json
{
  "name": "Chicken Stir Fry",
  "timeMinutes": 25,
  "difficulty": "Easy",
  "proteinSource": "Chicken",
  "ingredients": ["chicken breast", "broccoli", "soy sauce"],
  "macros": { "calories": 450, "protein": 40, "carbs": 20, "fat": 15 }
}
```

**Response:** `201 Created` — returns the created meal object.

### Get Meal

```
GET /meals/{id}
```

**Response:** `200 OK` — returns a single meal object.

### Toggle Cooked

```
PATCH /meals/{id}/toggle-cooked
```

Toggles the `cooked` boolean on the meal.

**Response:** `200 OK` — returns the updated meal object.

### Rate Meal

```
PATCH /meals/{id}/rate
```

**Body:**
```json
{
  "taste": 4,
  "ease": 5,
  "speed": 3,
  "healthiness": 4,
  "notes": "Great weeknight meal"
}
```

Rating values are 1-5. Saves to both the meal record (embedded) and the ratings table.

**Response:** `200 OK` — returns the updated meal object with rating.

### Delete Meal

```
DELETE /meals/{id}
```

**Response:** `204 No Content`

### Get Ratings

```
GET /meals/{id}/ratings
```

**Response:** `200 OK` — returns an array of rating records for the meal.

## Authentication

All requests must include the `X-Auth-Hash` header. The Lambda authorizer validates this hash against an SSM parameter (`AUTH_HASH_PARAM`). A consistent `userId` is derived from the hash for data partitioning.

## Setup

```bash
npm install
cp .env.example .env  # Edit with your values
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions and [SCHEMA.md](./SCHEMA.md) for DynamoDB schema details.
