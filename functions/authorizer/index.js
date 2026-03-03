'use strict';

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const crypto = require('crypto');

const ssm = new SSMClient({});
let cachedHash = null;

const getExpectedHash = async () => {
  if (cachedHash) return cachedHash;
  const { Parameter } = await ssm.send(
    new GetParameterCommand({
      Name: process.env.AUTH_HASH_PARAM,
      WithDecryption: true,
    })
  );
  cachedHash = Parameter.Value;
  return cachedHash;
};

exports.handler = async (event) => {
  const token = event.headers?.['x-auth-hash'] || event.headers?.['X-Auth-Hash'];

  if (!token) {
    return { isAuthorized: false };
  }

  try {
    const expectedHash = await getExpectedHash();
    const isValid = crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(expectedHash)
    );

    if (!isValid) return { isAuthorized: false };

    // Derive a userId from the hash (consistent per hash)
    const userId = crypto.createHash('sha256').update(token).digest('hex').slice(0, 16);

    return {
      isAuthorized: true,
      context: { userId },
    };
  } catch (err) {
    console.error('Auth error:', err);
    return { isAuthorized: false };
  }
};
