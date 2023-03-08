import 'source-map-support/register';

import * as middy from 'middy';

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { cors, httpErrorHandler } from 'middy/middlewares';
import { createAttachmentPresignedUrl, updateAttachmentUrl } from '../../businessLogic/todos';

import { getUserId } from '../utils';
import { v4 as uuidv4 } from 'uuid';

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId = getUserId(event);
    const todoId = event.pathParameters.todoId;
    const attachmentId = uuidv4();

    const uploadUrl = await createAttachmentPresignedUrl(attachmentId);

    await updateAttachmentUrl(userId, todoId, attachmentId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        uploadUrl
      })
    };
  }
);

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  );
