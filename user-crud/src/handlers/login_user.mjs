import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';


const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.tableName;

export const loginUsersHandler = async (event) => {
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

        if (!existingUser.Item) {
            throw new Error("User does not exist");
        }

        if (existingUser.Item.password !== password) {
            throw new Error("Invalid password");
        }

        // Define the response object with success message
        response = {
            statusCode: 200,
            'headers': {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*",
                "Accept": "*/*",
                "Content-Type": "application/json"
            },
            'body': JSON.stringify({ message: "Login Successful" }),
        }
    } catch (error) {

        console.error("Error in loginUsersHandler:", error);

        let errorMessage;
        let statusCode;

        if (error.message === "Missing required data in request body.") {
            errorMessage = "Required data missing in request body";
            statusCode = 400; // Bad Request
        } else if (error.message === "User does not exist") {
            errorMessage = "User does not exist";
            statusCode = 404; // Not Found
        } else if (error.message === "Invalid password") {
            errorMessage = "Invalid password";
            statusCode = 401; // Unauthorized
        } else {
            errorMessage = "Failed to login user";
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
    return response;
}