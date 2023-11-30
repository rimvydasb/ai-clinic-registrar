import {logger} from "../logger.lib";
import {fromEnv} from "@aws-sdk/credential-provider-env";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {PutCommand} from "@aws-sdk/lib-dynamodb"; // Import PutCommand for DynamoDB operations

const ddbClient = new DynamoDBClient({
    region: "eu-central-1",
    credentials: fromEnv(),
});

function getID() {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();

    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));

    return `${currentDay}${currentHour}${currentMinute}${randomLetter}`;
}

export async function storeData(tableName: string, data: any): Promise<string> {
    const id = getID();
    const params = {
        TableName: tableName,
        Item: {
            id: {S: id},
            timestamp: {N: Date.now().toString()},
            data: {
                S: JSON.stringify(data)
            },
        },
    };

    try {
        await ddbClient.send(new PutCommand(params));
        logger.info('Data stored successfully');
    } catch (err) {
        logger.error('Error storing data:', err);
    }

    return id;
}
