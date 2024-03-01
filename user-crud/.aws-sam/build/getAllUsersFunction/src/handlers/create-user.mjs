// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.tableName;
let response;
/**
 * A simple example includes a HTTP post method to add one item to a DynamoDB table.
 */
export const createUserHandler = async (event) => {
  try{
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    // Get id and name from the body of the request
    const body = JSON.parse(event.body);
    const id = uuidv4();
    const emailID = body.emailID;
    const password = body.password;
    const username = body.username;

    // Creates a new item, or replaces an old item with a new item
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
    var params = {
        TableName:  tableName,
        Item: { "user-id": id, emailID: emailID, password: password, username: username }
    };
        const data = await ddbDocClient.send(new PutCommand(params));
        console.log("Success - item added or updated", data); 
        const response = {
          statusCode: 200,
          headers: {
              'Access-Control-Allow-Origin': '', // Change '' to your desired origin
              'Access-Control-Allow-Headers': 'Content-Type',
              'Access-Control-Allow-Methods': 'OPTIONS,POST,GET' // Add other allowed methods as needed
          },
          body: JSON.stringify({ message: 'Success' })
      };
  }  catch (error) {
    console.error("Error in createUserHandler:", error);

    let errorMessage;
    let statusCode;

    if (error.message === "Missing required data in request body.") {
      errorMessage = "Required data missing in request body";
      statusCode = 400; // Bad Request
    } else {
      errorMessage = "Failed to create user";
      statusCode = 500; // Internal Server Error
      console.log(error.message);
    }

    return {
      statusCode,
      body: JSON.stringify({ error: errorMessage }),
    };
  }

  // All log statements are written to CloudWatch
  console.info(`response from: ${event?.path} statusCode: ${response?.statusCode} body: ${response?.body}`);
  return response;
};