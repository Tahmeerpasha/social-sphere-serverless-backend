import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// ... other imports and client setup

/**
 * A HTTP get method to check if a user with a given email exists in the DynamoDB table.
 */
export const getUserByEmailHandler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      throw new Error(`checkUserByEmailHandler only accepts GET method, you tried: ${event.httpMethod}`);
    }

    const id = event.queryStringParameters['user-id']; // User ID is passed as query parameter

    // console.log(event);
    console.log(id);
    if (!id) {
      throw new Error("Missing required parameter: ID");
    }

    const tableName = process.env.tableName;
    const params = {
      TableName: tableName,
      KeyConditionExpression: "user-id = :id", // Query based on id
      ExpressionAttributeNames: {
        "user-id": "id" // Assuming "id" is your attribute name
      },
      ExpressionAttributeValues: {
        ":user-id": id
      }
    };

    const data = await ddbDocClient.send(new GetCommand(params));

    const response = {
      statusCode: data.Item ? 200 : 204, // 200 if user exists, 204 if not
      body: data.Item ? JSON.stringify({ message: "User found" }) : ''
    };
  } catch (err) {
    console.error("Error:", err);

    let errorMessage;
    let statusCode = 500; // Internal Server Error

    // Handle specific DynamoDB errors
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
      // Catch-all for other errors
      console.error(err.stack); // Log full error stack for debugging
      errorMessage = "An unexpected error occurred.";
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