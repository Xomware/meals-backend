# DynamoDB Schema

## `meals` Table

| Attribute | Type | Key |
|-----------|------|-----|
| userId | String | Partition Key (PK) |
| mealId | String | Sort Key (SK) |
| id | String | Same as mealId (frontend compat) |
| name | String | |
| timeMinutes | Number | |
| difficulty | String | `Easy` / `Medium` / `Hard` |
| proteinSource | String | |
| ingredients | List\<String\> | |
| macros | Map | `{ calories, protein, carbs, fat }` |
| cooked | Boolean | |
| rating | Map | Optional `{ taste, ease, speed, healthiness, notes }` |
| createdAt | String | ISO 8601 timestamp |

## `meal-ratings` Table

| Attribute | Type | Key |
|-----------|------|-----|
| userId | String | Partition Key (PK) |
| mealId | String | Sort Key (SK) |
| taste | Number | 1-5 |
| ease | Number | 1-5 |
| speed | Number | 1-5 |
| healthiness | Number | 1-5 |
| notes | String | |
| ratedAt | String | ISO 8601 timestamp |

### GSI: `mealId-userId-index`

| Attribute | Key |
|-----------|-----|
| mealId | Partition Key |
| userId | Sort Key |

Allows querying all ratings for a given meal across users.
