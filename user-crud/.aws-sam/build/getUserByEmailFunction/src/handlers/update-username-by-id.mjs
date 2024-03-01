import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// ...other imports and client setup

/**
 * A HTTP put method to update a user by id in a DynamoDB table.
 */
export const updateUserByIdHandler = async (event) => {
  try {
    if (event.httpMethod !== 'PUT') {
      throw new Error(`updateUserByIdHandler only accepts PUT method, you tried: ${event.httpMethod}`);
    }

    const id = event.pathParameters.id;
    const updatedUser = JSON.parse(event.body); // Parse the updated user data from the request body

    const params = {
      TableName: tableName,
      Key: { "user-id": id },
      UpdateExpression: "SET #username = :username", // Example expression for common fields
      ExpressionAttributeNames: {
        "#username": "username",
      },

      ExpressionAttributeValues: {
        ":username": updatedUser.username,
      }
    };

    const data = await ddbDocClient.send(new UpdateCommand(params));

    const response = {
      statusCode: 204, // No Content, as the updated user is not returned
      body: ''
    };

    return response;

  } catch (err) {
    console.error("Error:", err);

    let errorMessage;
    let statusCode = 500; // Internal Server Error

    if (err instanceof DynamoDBError) {
      // Handle specific DynamoDB errors
      errorMessage = 'Failed to retrieve users from DynamoDB';
      if (err.code === 'ResourceNotFoundException') {
        errorMessage = 'Table not found';
        statusCode = 404; // Not Found
      } else if (err.code === 'AccessDeniedException') {
        errorMessage = 'Access denied to table';
        statusCode = 403; // Forbidden
      } else if (err.code === 'ProvisionedThroughputExceededException') {
        errorMessage = 'Provisioned throughput exceeded';
        statusCode = 429; // Too Many Requests
      } else {
        console.error(err.stack); // Log full error stack for debugging
      }
    } else {
      errorMessage = 'Internal server error';
    }

    return {
      statusCode,
      body: JSON.stringify({ error: errorMessage })
    };
  }

  // All log statements are written to CloudWatch
  console.info(`response from: ${event?.path} statusCode: ${response?.statusCode} body: ${response?.body}`);
  return response;
};