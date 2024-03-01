// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.tableName;
let response;
/**
 * A HTTP get method to get one user by id from a DynamoDB table.
 */
export const getUserByIdHandler = async (event) => {
  try{
  if (event.httpMethod !== 'GET') {
    throw new Error(`getMethod only accept GET method, you tried: ${event.httpMethod}`);
  }
  // All log statements are written to CloudWatch
  console.info('received:', event);

  // Get id from pathParameters from APIGateway because of `/{id}` at template.yaml
  const id = event.pathParameters.id;

  // Get the item from the table
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property
  var params = {
    TableName: tableName,
    Key: { "user-id": id },
  };

    const data = await ddbDocClient.send(new GetCommand(params));
    var item = data.Item;

    const response = {
      statusCode: 200,
      body: JSON.stringify(item)
    };

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
