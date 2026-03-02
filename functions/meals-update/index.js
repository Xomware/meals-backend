'use strict';

const { GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../../shared/dynamo');
const { getUserId } = require('../../shared/auth');
const { ok, notFound, serverError } = require('../../shared/response');

exports.handler = async (event) => {
  try {
    const userId = getUserId(event);
    const mealId = event.pathParameters?.id;

    // Get current state
    const { Item } = await docClient.send(
      new GetCommand({
        TableName: process.env.MEALS_TABLE_NAME,
        Key: { userId, mealId },
      })
    );

    if (!Item) return notFound('Meal not found');

    // Toggle cooked
    const { Attributes } = await docClient.send(
      new UpdateCommand({
        TableName: process.env.MEALS_TABLE_NAME,
        Key: { userId, mealId },
        UpdateExpression: 'SET cooked = :val',
        ExpressionAttributeValues: { ':val': !Item.cooked },
        ReturnValues: 'ALL_NEW',
      })
    );

    return ok(Attributes);
  } catch (err) {
    console.error('meals-update error:', err);
    return serverError(err.message);
  }
};
