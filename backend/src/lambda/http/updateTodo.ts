import 'source-map-support/register';

import * as middy from 'middy';

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { cors, httpErrorHandler } from 'middy/middlewares';

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest';
import { getUserId } from '../utils';
import { updateTodo } from '../../businessLogic/todos';

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId;
    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body);
    // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
    const userId = getUserId(event);
    await updateTodo(userId, todoId, updatedTodo);

    return {
      statusCode: 204,
      body: ""
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
