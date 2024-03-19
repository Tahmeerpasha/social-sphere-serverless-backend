import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import multer from 'multer'
import { uploadImageToS3 } from '../utils/s3.mjs';
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.tableName;

// Set up multer to handle form data
const upload = multer();
const parseFormData = upload.none();


export const createIdeaHandler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 400, body: JSON.stringify({ message: 'Idea method is required' }) };

    if (!event.body) return { statusCode: 400, body: JSON.stringify({ message: 'Request body is required' }) };
    try {
        console.info("Event body received", event.body)
        // Parse form data using multer middleware
        await new Promise((resolve, reject) => {
            parseFormData(event, {}, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        // Access form data from event.body
        const formData = event.body;
        // Validation of body fields can be added here
        const id = `${new Date().getTime()}`;
        const IdeaContent = formData.IdeaContent;
        // TODO: Upload assets to S3 and get the URL
        const IdeaImage = formData.IdeaImage;
        const IdeaImageURL = await uploadImageToS3(IdeaImage, `${id}.jpg`, process.env.bucketName);
        const params = {
            TableName: tableName,
            Item: { id, IdeaContent, IdeaImageURL }
        };
        const data = await docClient.send(new PutCommand(params));
        return { statusCode: 201, body: JSON.stringify({ message: 'Idea created successfully', body: data }) };
    } catch (error) {
        console.error('Error creating Idea:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Error creating Idea' }) };
    }
};


export const getAllIdeasByUserEmailHandler = async (event) => {
    if (event.httpMethod !== 'GET') return {
        statusCode: 400,
        body: JSON.stringify({ message: 'GET method is required' })
    };

    if (!event.pathParameters.userEmail) return {
        statusCode: 400,
        body: JSON.stringify({ message: 'User email is required' })
    };

    try {
        const email = event.pathParameters.userEmail;
        const params = {
            TableName: tableName,
            IndexName: 'IdeasIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': email }
        };
        const data = await docClient.send(new QueryCommand(params));
        console.info("Ideas Fetched Successfully: ", data)
        return {
            statusCode: 200,
            body: JSON.stringify(data.Items)
        };
    } catch (error) {
        console.error('Error fetching ideas:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error fetching ideas' })
        };
    }
};

export const getIdeaByIdHandler = async (event) => {
    if (event.httpMethod !== 'GET') return {
        statusCode: 400,
        body: JSON.stringify({ message: 'GET method is required' })
    };

    if (!event.pathParameters.id) return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Idea ID is required' })
    };

    try {
        const ideaId = event.pathParameters.id;
        const params = {
            TableName: tableName,
            Key: { 'id': ideaId }
        };
        const data = await docClient.send(new GetCommand(params));
        if (!data.Item) {
            console.error('Idea not found');
            return { statusCode: 404, body: JSON.stringify({ message: 'Idea not found' }) };
        }
        console.info('Idea fetched successfully')
        return { statusCode: 200, body: JSON.stringify(data.Item) };
    } catch (error) {
        console.error('Error fetching Idea:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Error fetching Idea' }) };
    }
};


export const updateIdeaByIdHandler = async (event) => {
    if (event.httpMethod !== 'PUT') return { statusCode: 400, body: JSON.stringify({ message: 'PUT method is required' }) };

    if (!event.pathParameters.id) return { statusCode: 400, body: JSON.stringify({ message: 'Idea ID is required' }) };

    try {
        await new Promise((resolve, reject) => {
            parseFormData(event, {}, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        // Access form data from event.body
        const ideaID = event.pathParameters.id;
        const getCommandParams = {
            TableName: tableName,
            Key: { 'id': ideaID }
        };
        const getIdea = await docClient.send(new GetCommand(getCommandParams));
        if (!getIdea.Item) {
            console.error('Idea not found');
            return { statusCode: 404, body: JSON.stringify({ message: 'Idea not found' }) };
        }
        // TODO: Delete the old image from S3


        const formData = event.body;
        const IdeaContent = formData.IdeaContent;
        // TODO: Upload assets to S3 and get the URL
        const IdeaImage = formData.IdeaImage;
        const IdeaImageURL = await uploadImageToS3(IdeaImage, `${id}.jpg`, process.env.bucketName);
        // Validation of body fields can be added here
        const params = {
            TableName: tableName,
            Key: { 'id': ideaID },
            UpdateExpression: 'set IdeaContent = :content, IdeaImageURL = :image',
            ExpressionAttributeValues: {
                ':content': IdeaContent,
                ':image': IdeaImageURL,
            },
            ReturnValues: 'UPDATED_NEW'
        };
        const data = await docClient.send(new UpdateCommand(params));
        return { statusCode: 200, body: JSON.stringify(data.Attributes) };
    } catch (error) {
        console.error('Error updating post:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Error updating idea' }) };
    }
};

export const deleteIdeaByIdHandler = async (event) => {
    if (event.httpMethod !== 'DELETE') return { statusCode: 400, body: JSON.stringify({ message: 'DELETE method is required' }) };

    if (!event.pathParameters.id) return { statusCode: 400, body: JSON.stringify({ message: 'Idea ID is required' }) };

    try {
        const ideaID = event.pathParameters.id;
        const params = {
            TableName: tableName,
            Key: { 'id': ideaID }
        };
        const data = await docClient.send(new GetCommand(params));
        if (!data.Item) {
            console.error('Idea does not exists');
            return {
                "statusCode": 404,
                "body": JSON.stringify({ message: "Idea does not exists" }),
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
        console.error('Error deleting idea:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Error deleting idea' }) };
    }
};
