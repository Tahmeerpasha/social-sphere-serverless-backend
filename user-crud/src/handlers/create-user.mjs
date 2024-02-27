// Imports for DynamoDB client and DocumentClient
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// Create a DocumentClient from the DynamoDB client
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get DynamoDB table name from environment variables
const tableName = user;

/**
 * Handles creating a new user in the DynamoDB table.
 *
 * @param {Object} event The HTTP event object with request details.
 * @returns {Promise<Object>} A Promise resolving to the response object.
 */
export const createUserHandler = async (event) => {
  try {
    // Check for valid HTTP method (POST only)
    if (event.httpMethod !== 'POST') {
      throw new Error(`Method Not Allowed: ${event.httpMethod}`);
    }

    // Parse request body and extract user data
    const body = JSON.parse(event.body);
    const { id, emailID, password, displayName, teamRole, teamID } = body;

    // Validate required fields (optional, add checks for each field)

    // Construct parameters for the PutCommand
    const params = {
      TableName: tableName,
      Item: {
        "user-id": id,
        emailID,
        password,
        displayName,
        teamRole,
        teamID,
      },
    };

    // Send the PutCommand to DynamoDB
    const data = await ddbDocClient.send(new PutCommand(params));

    console.log("Success - item added or updated:", data);

    // Return successful response with created user data (optional)
    return {
      statusCode: 201, // Created
      body: JSON.stringify(body),
    };
  } catch (err) {
    console.error("Error:", err.stack);

    // Use error-specific status code or 500 for general errors
    const statusCode = err.statusCode || 500;

    // Provide informative error message in response
    const message = err.message || "Internal server error";

    return {
      statusCode,
      body: JSON.stringify({ error: message }),
    };
  }
};