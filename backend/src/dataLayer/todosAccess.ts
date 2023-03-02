import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';

import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { TodoItem } from '../models/TodoItem';
import { TodoUpdate } from '../models/TodoUpdate';
import { createLogger } from '../utils/logger';

const XAWS = AWSXRay.captureAWS(AWS);

const logger = createLogger('TodosAccess');



export class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly todosIndex = process.env.TODOS_CREATED_AT_INDEX,
    ) { }

    async getAllTodos(userId: string): Promise<TodoItem[]> {
        logger.info('Getting all todos');

        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.todosIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise();

        const items = result.Items;
        return items as TodoItem[];
    }

    async createTodoItem(todoItem: TodoItem): Promise<TodoItem> {
        logger.info('Creating a todo');

        await this.docClient.put({
            TableName: this.todosTable,
            Item: todoItem
        }).promise();

        return todoItem;
    }

    async updateTodoItem(userId: string, todoId: string, todoUpdate: TodoUpdate): Promise<TodoUpdate> {
        logger.info(`Updating todo with id ${todoId}`);

        await this.docClient.update({
            TableName: this.todosTable,
            Key: { userId, todoId },
            UpdateExpression: 'SET #todoName = :name, dueDate = :dueDate, done = :done',
            ExpressionAttributeNames: {
                '#todoName': 'name'
            },
            ExpressionAttributeValues: {
                ':name': todoUpdate.name,
                ':dueDate': todoUpdate.dueDate,
                ':done': todoUpdate.done
            },
            ReturnValues: 'UPDATED_NEW'
        }).promise();
        // TODO: Update expression 5 - 48:32
        return todoUpdate;
    }
}

// function createDynamoDBClient() {
//     if (process.env.IS_OFFLINE) {
//         console.log('Creating a local DynamoDB instance');
//         return new XAWS.DynamoDB.DocumentClient({
//             region: 'localhost',
//             endpoint: 'http://localhost:8000'
//         });
//     }

//     return new XAWS.DynamoDB.DocumentClient() ;
// }