import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';


const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.tableName;

export const registerUserHandler = async (event) => {
  let response;
  try {
    // Check if the method is POST or not
    if (event.httpMethod !== 'POST') {
      throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }

    console.info('received:', event);

    // If body is missing, throw an error
    if (!event.body) {
      throw new Error("Missing required data in request body.");
    }

    // Extract data from the event
    const body = JSON.parse(event.body);
    const emailID = body.emailID;
    const password = body.password;

    // Check if user already exists
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: {
        emailID
      },
    });
    const existingUser = await ddbDocClient.send(getCommand);

    if (existingUser.Item) {
      throw new Error("User already exists");
    }

    // Create the object to add user item in database
    const putCommand = new PutCommand({
      TableName: tableName,
      Item: {
        emailID,
        password
      }
    });

    // Add user item in database
    const data = await ddbDocClient.send(putCommand);

    console.log("Success - item added or updated", data);

    // Define the response object with success message
    response = {
      statusCode: 201,
      'headers': {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
        "Accept": "*/*",
        "Content-Type": "application/json"
      },
      // TODO: Remove password from response
      'body': JSON.stringify({ message: 'User Created Successfully', data: data })
    };
  } catch (error) {

    console.error("Error in createUserHandler:", error);

    let errorMessage;
    let statusCode;

    if (error.message === "Missing required data in request body.") {
      errorMessage = "Required data missing in request body";
      statusCode = 400; // Bad Request
    } else if (error.message === "User already exists") {
      errorMessage = "User already exists";
      statusCode = 409; // Conflict
    } else {
      errorMessage = "Failed to create user";
      statusCode = 500; // Internal Server Error
    }
    console.log(error.message);

    response = {
      statusCode,
      'headers': {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
        "Accept": "*/*",
        "Content-Type": "application/json"
      },
      'body': JSON.stringify({ error: errorMessage }),
    };
  }

  console.info(`response from: ${event?.path} statusCode: ${response?.statusCode} body: ${response?.body}`);

  return response;
};


