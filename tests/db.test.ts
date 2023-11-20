import {logger} from "../lib/logger.lib";

test('can connect to db', async () => {

    const AWS = require('aws-sdk');

    AWS.config.update({
        region: 'eu-central-1', // Specify 'local' as the region
        credentials: new AWS.Credentials({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }),
    }); // as ConfigurationOptions

    const dynamodb = new AWS.DynamoDB();

    dynamodb.listTables({}, function (err, data) {
        if (err) {
            console.error('Error listing tables:', err);
        } else {
            console.log('Tables in database:', data.TableNames);
        }
    });

    // Define the parameters for the putItem operation
    const params = {
        TableName: 'ai-clinic-registrar-table',
        Item: {
            id: {S: '4asd6f46asdf4asd6'},
            timestamp: {N: Date.now().toString()},
            data: {
                S: JSON.stringify({
                    name: 'John',
                })
            },
        },
    };

    // Store the item in the DynamoDB table
    dynamodb.putItem(params, function (err, data) {
        if (err) {
            logger.error('Error storing data:', err);
        } else {
            logger.info('Data stored successfully:', data);
        }
    });
});
