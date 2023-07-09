import {ConfigurationOptions} from "aws-sdk/lib/config-base";
import {logger} from "./logger.lib";

const AWS = require('aws-sdk');

AWS.config.update({
    region: 'eu-central-1', // Specify 'local' as the region
    credentials: new AWS.Credentials({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }),
} as ConfigurationOptions);

const dynamodb = new AWS.DynamoDB();

function getID() {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();

    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));

    return `${currentDay}${currentHour}${currentMinute}${randomLetter}`;
}

export function storeData(tableName: string, data: any): string {
    const params = {
        TableName: tableName,
        Item: {
            id: {S: getID()},
            timestamp: {N: Date.now().toString()},
            data: {
                S: JSON.stringify(data)
            },
        },
    };

    dynamodb.putItem(params, function (err, data) {
        if (err) {
            logger.error('Error storing data:', err);
        } else {
            logger.info('Data stored successfully:', data);
        }
    });

    return params.Item.id.S;
}
