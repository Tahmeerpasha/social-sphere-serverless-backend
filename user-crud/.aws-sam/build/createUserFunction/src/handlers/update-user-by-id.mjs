// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.tableName;

export const updateUserByIdHandler = async (event) => {
    if (event.httpMethod !== 'PUT') {
        throw new Error(`putMethod only accept PUT method, you tried: ${event.httpMethod}`);
    }

    // All log statements are written to CloudWatch
    console.info('received:', event);

    // Get id from pathParameters from APIGateway because of `/{id}` at template.yaml
    const id = event.pathParameters.id;

    // Get the update values from the request body
    const { name, age, email } = JSON.parse(event.body);

    // Create the update expression and attribute values
    const updateExpression = 'SET #name = :name, #age = :age, #email = :email';
    const expressionAttributeNames = {
        '#name': 'name',
        '#age': 'age',
        '#email': 'email',
    };
    const expressionAttributeValues = {
        ':name': name,
        ':age': age,
        ':email': email,
    };

    // Build the update command
    const updateCommand = new UpdateCommand({
        TableName: tableName,
        Key: { 'user-id': id },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
    });

    // Update the item in DynamoDB
    const response = await ddbDocClient.send(updateCommand);
    console.info('update response:', response);

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'User updated successfully' }),
    };
};

