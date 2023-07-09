import questionerHandler from '../pages/api/questioner';
import {mockPostRequest, mockResponse} from "./utils";
import {AgentRequest, ChatMessage, DataItem, DataItemType} from "../lib/objectmodel";
import dotenv from "dotenv";
import {AGENT_GREETING, CLIENT_SYMPTOMS_DATA, REGISTRATION_CLIENT_DATA} from "../configuration/configuration";
import {ConfigurationOptions} from "aws-sdk/lib/config-base";
import {KeyObject} from "crypto";
import {logger} from "../lib/logger.lib";

dotenv.config();

test('should return mock data', async () => {

    const messages = [
        new ChatMessage("assistant", AGENT_GREETING),
        new ChatMessage("user", "Hello, my name is John"),
    ];

    const req = mockPostRequest(new AgentRequest(messages, REGISTRATION_CLIENT_DATA, CLIENT_SYMPTOMS_DATA, "someid"));
    const res = mockResponse();
    await questionerHandler(req, res);

    //console.log(res.json.mock.calls.length);
    //console.log(JSON.stringify(res.json.mock.calls));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        result: {
            stateData: [
                new DataItem("name", "user's name", null, DataItemType.String, "John"),
                new DataItem("telephone", "user's telephone number"),
            ],
            symptoms: CLIENT_SYMPTOMS_DATA,
            nextMessage: new ChatMessage("assistant", "I understood you. Goodbye."),
            voucherId: null,
        }
    });
});

test('live test: should not messes with names', async () => {

    const messages = [
        new ChatMessage("assistant", AGENT_GREETING),
        new ChatMessage("user", "Hello, I'm Don McLean, I was writing a song how I miss my friend Richie Valens and now my finger hurts")
    ];

    const req = mockPostRequest(new AgentRequest(messages, REGISTRATION_CLIENT_DATA, CLIENT_SYMPTOMS_DATA));
    const res = mockResponse();
    await questionerHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        result: {
            stateData: [
                new DataItem("name", "user's name", null, DataItemType.String, "Don McLean"),
                new DataItem("telephone", "user's telephone number"),
            ],
            symptoms: CLIENT_SYMPTOMS_DATA,
            nextMessage: {
                content: expect.any(String),
                role: "assistant",
                ignored: expect.any(Boolean),
            } as ChatMessage,
            voucherId: null,
        }
    });
});

test('live test: ask for symptoms', async () => {

    const messages = [
        new ChatMessage("assistant", AGENT_GREETING),
        new ChatMessage("user", "This is Margaret Teacher calling, need doctor's help"),
        new ChatMessage("assistant", "Of course, Margaret. I'm here to assist you. Could you please let me know if you're experiencing any pain?"),
        new ChatMessage("user", "My finger hurts"),
    ];

    const req = mockPostRequest(new AgentRequest(messages, REGISTRATION_CLIENT_DATA, CLIENT_SYMPTOMS_DATA));
    const res = mockResponse();
    await questionerHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        result: {
            stateData: [
                new DataItem("name", "user's name", null, DataItemType.String, null), // taking just last two messages
                new DataItem("telephone", "user's telephone number"),
            ],
            symptoms: expect.arrayContaining([
                new DataItem("pain", "does user feel pain?", null, DataItemType.Boolean, "true"),
            ]),
            nextMessage: {
                content: expect.any(String),
                role: "assistant",
                ignored: expect.any(Boolean),
            } as ChatMessage,
            voucherId: null,
        }
    });
});

test('live test: should end quick', async () => {

    const messages = [
        new ChatMessage("assistant", AGENT_GREETING),
        new ChatMessage("user", "This is Margaret Teacher calling, my phone is +38472518569, call me a doctor. Everything is fine, nothing hurts.")
    ];

    const req = mockPostRequest(new AgentRequest(messages, REGISTRATION_CLIENT_DATA, CLIENT_SYMPTOMS_DATA));
    const res = mockResponse();
    await questionerHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        result: {
            stateData: [
                new DataItem("name", "user's name", null, DataItemType.String, "Margaret Teacher"),
                new DataItem("telephone", "user's telephone number", null, DataItemType.String, "+38472518569"),
            ],
            symptoms: CLIENT_SYMPTOMS_DATA,
            nextMessage: {
                content: expect.any(String),
                role: "assistant",
                ignored: expect.any(Boolean),
            } as ChatMessage,
            voucherId: expect.any(String),
        }
    });
}, 10000);

test('can connect to db', async () => {

    const AWS = require('aws-sdk');

    AWS.config.update({
        region: 'eu-central-1', // Specify 'local' as the region
        credentials: new AWS.Credentials({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }),
    } as ConfigurationOptions);

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
