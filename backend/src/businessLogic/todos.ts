// import * as createError from 'http-errors';

import { AttachmentUtils } from '../helpers/attachmentUtils';
import { CreateTodoRequest } from '../requests/CreateTodoRequest';
import { TodoItem } from '../models/TodoItem';
import { TodosAccess } from '../dataLayer/todosAccess';
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';
import { createLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Implement businessLogic
const logger = createLogger('TodosBusinessLogic');
const attachmentUtils = new AttachmentUtils();
const todosAccess = new TodosAccess;

export async function createTodo(
    newTodo: CreateTodoRequest,
    userId: string
): Promise<TodoItem> {

    logger.info('Create Todo');

    const todoId = uuidv4();
    const createdAt = new Date().toISOString();
    const s3AttachmentUrl = attachmentUtils.getAttachmentUrl(todoId);

    const newItem: TodoItem = {
        userId,
        todoId,
        createdAt,
        done: false,
        attachmentUrl: s3AttachmentUrl,
        ...newTodo
    };

    return await todosAccess.createTodoItem(newItem);
}

export async function getTodosForUser(
    userId: string
): Promise<TodoItem[]> {

    logger.info('Get Todos for a user');
    return await todosAccess.getAllTodos(userId);
}

export async function updateTodo(
    userId: string,
    todoId: string,
    todoChange: UpdateTodoRequest
) {
    logger.info('Update Todo');
    return await todosAccess.updateTodoItem(userId, todoId, todoChange);
}

export async function deleteTodo(
    userId: string,
    todoId: string
) {
    logger.info('Delete Todo');
    return await todosAccess.deleteTodoItem(userId, todoId);
}

export async function createAttachmentPresignedUrl(
    todoId: string
): Promise<string> {
    logger.info('Create Attachment Presigned URL');
    const uploadUrl = await attachmentUtils.getUploadUrl(todoId);
    return uploadUrl;
}