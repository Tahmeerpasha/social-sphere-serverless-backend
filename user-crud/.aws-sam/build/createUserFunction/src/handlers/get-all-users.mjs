// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.tableName;
let response;
/**
 * A HTTP get method to get all users from a DynamoDB table.
 */
export const getAllUsersHandler = async (event) => {
    try {
    if (event.httpMethod !== 'GET') {
        throw new Error(`getAllItems only accept GET method, you tried: ${event.httpMethod}`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    // get all items from the table (only first 1MB data, you can use `LastEvaluatedKey` to get the rest of data)
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property
    // https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html
    var params = {
        TableName: tableName
    };

    let items = [];
    let data;
    do {
      data = await ddbDocClient.send(new ScanCommand(params));
      items = [...items, ...data.Items];
      params.ExclusiveStartKey = data.LastEvaluatedKey;
    } while (typeof data.LastEvaluatedKey !== 'undefined');


        const response = {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '', // Change '' to your desired origin
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET' // Add other allowed methods as needed
            },
            body: JSON.stringify(items)
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