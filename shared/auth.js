'use strict';

/**
 * Extract userId from the Lambda authorizer context.
 * The authorizer sets context.userId after validating X-Auth-Hash.
 */
const getUserId = (event) => {
  const userId = event.requestContext?.authorizer?.userId;
  if (!userId) throw new Error('Missing userId in authorizer context');
  return userId;
};

module.exports = { getUserId };
