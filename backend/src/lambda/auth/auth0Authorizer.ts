import 'source-map-support/register';

import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent, APIGatewayTokenAuthorizerHandler } from 'aws-lambda';
import { decode, verify } from 'jsonwebtoken';

import Axios from 'axios';
import { Jwt } from '../../auth/Jwt';
import { JwtPayload } from '../../auth/JwtPayload';
import { createLogger } from '../../utils/logger';

const logger = createLogger('auth');

const jwksUrl = 'https://dev-uychih4qa80snabs.us.auth0.com/.well-known/jwks.json';

export const handler: APIGatewayTokenAuthorizerHandler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken);
  try {
    const jwtToken = await verifyToken(event.authorizationToken);
    logger.info('User was authorized', jwtToken);

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    };
  } catch (e) {
    logger.error('User not authorized', { error: e.message });

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    };
  }
};

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  logger.info('Verifying Token');
  const token = getToken(authHeader);
  const jwt: Jwt = decode(token, { complete: true }) as Jwt;

  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/

  const response = await Axios.get(jwksUrl);
  logger.info('jwksUrl response', response);
  const { keys } = response.data;
  const signingKeys = keys.find(key => key.kid === jwt.header.kid);
  logger.info('signingKeys', signingKeys);

  if (!signingKeys) {
    throw new Error('The JWKS endpoint did not contain any keys');
  }

  const pemData = signingKeys.x5c[0];

  const cert = `-----BEGIN CERTIFICATE-----\n${pemData}\n-----END CERTIFICATE-----`;

  const verifiedToken = verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload;
  logger.info('Verified Token', verifiedToken);

  return verifiedToken;
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header');

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header');

  const split = authHeader.split(' ');
  const token = split[1];

  return token;
}
