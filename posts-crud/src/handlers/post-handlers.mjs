import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.tableName;

export const getAllPostsByUserEmailHandler = async (event) => {
    if (event.httpMethod !== 'GET') return { statusCode: 400, body: JSON.stringify({ message: 'GET method is required' }) };

    if (!event.pathParameters.userEmail) return { statusCode: 400, body: JSON.stringify({ message: 'User email is required' }) };

    try {
        const email = event.pathParameters.userEmail;
        const params = {
            TableName: tableName,
            IndexName: 'EmailIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': email }
        };
        const data = await docClient.send(new QueryCommand(params));
        return {
            statusCode: 200,
            body: JSON.stringify(data.Items)
        };
    } catch (error) {
        console.error('Error fetching posts:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error fetching posts' })
        };
    }
};


export const getPostByIdHandler = async (event) => {
    if (event.httpMethod !== 'GET') return { statusCode: 400, body: JSON.stringify({ message: 'GET method is required' }) };

    if (!event.pathParameters.id) return { statusCode: 400, body: JSON.stringify({ message: 'Post ID is required' }) };

    try {
        const postId = event.pathParameters.id;
        const params = {
            TableName: tableName,
            Key: { 'id': postId }
        };
        const data = await docClient.send(new GetCommand(params));
        if (!data.Item) {
            return { statusCode: 404, body: JSON.stringify({ message: 'Post not found' }) };
        }
        return { statusCode: 200, body: JSON.stringify(data.Item) };
    } catch (error) {
        console.error('Error fetching post:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Error fetching post' }) };
    }
};

export const createPostHandler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 400, body: JSON.stringify({ message: 'POST method is required' }) };

    if (!event.body) return { statusCode: 400, body: JSON.stringify({ message: 'Request body is required' }) };
    try {
        const body = JSON.parse(event.body);
        // Validation of body fields can be added here
        const id = `${new Date().getTime()} | + | ${body.email}`;
        const email = body.email;
        const postContent = body.postContent;
        const createdTime = `${new Date().toISOString()}`
        const scheduledTime = body.scheduledTime;
        const channelPostedTo = body.channelPostedTo;
        const assets = body.assets;
        const params = {
            TableName: tableName,
            Item: { id, email, postContent, createdTime, scheduledTime, channelPostedTo, assets }
        };
        const data = await docClient.send(new PutCommand(params));
        return { statusCode: 201, body: JSON.stringify({ message: 'Post created successfully', body: data }) };
    } catch (error) {
        console.error('Error creating post:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Error creating post' }) };
    }
};

export const updatePostByIdHandler = async (event) => {
    if (event.httpMethod !== 'PUT') return { statusCode: 400, body: JSON.stringify({ message: 'PUT method is required' }) };

    if (!event.pathParameters.id) return { statusCode: 400, body: JSON.stringify({ message: 'Post ID is required' }) };

    try {
        const postId = event.pathParameters.id;
        const body = JSON.parse(event.body);
        // Validation of body fields can be added here
        const params = {
            TableName: tableName,
            Key: { 'id': postId },
            UpdateExpression: 'set postContent = :content, scheduledTime = :scheduled, channelPostedTo = :channels, assets = :assets',
            ExpressionAttributeValues: {
                ':content': body.postContent,
                ':scheduled': body.scheduledTime,
                ':channels': body.channelPostedTo,
                ':assets': body.assets
            },
            ReturnValues: 'UPDATED_NEW'
        };
        const data = await docClient.send(new UpdateCommand(params));
        return { statusCode: 200, body: JSON.stringify(data.Attributes) };
    } catch (error) {
        console.error('Error updating post:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Error updating post' }) };
    }
};

export const deletePostByIdHandler = async (event) => {
    if (event.httpMethod !== 'DELETE') return { statusCode: 400, body: JSON.stringify({ message: 'DELETE method is required' }) };

    if (!event.pathParameters.id) return { statusCode: 400, body: JSON.stringify({ message: 'Post ID is required' }) };

    try {
        const postId = event.pathParameters.id;
        const params = {
            TableName: tableName,
            Key: { 'id': postId }
        };
        const data = await docClient.send(new GetCommand(params));
        if (!data.Item) {
            console.error('Post does not exists');
            return {
                "statusCode": 404,
                "body": JSON.stringify({ message: "POST does not exists" }),
                "headers": {
                    "Content-Type": "application/json",
                    "Custom-Header": "value"
                }
            }
                ;
        } else {
            const result = await docClient.send(new DeleteCommand(params));
            console.info("Deleted item:", JSON.stringify(result));
            return {
                "statusCode": 204,
                "body": "",
                "headers": {
                    "Content-Type": "application/json",
                    "Custom-Header": "value"
                }
            }
                ;
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Error deleting post' }) };
    }
};
