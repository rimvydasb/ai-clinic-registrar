import questionerHandler from '../pages/api/questioner';
import {mockPostRequest, mockResponse} from "./utils";
import {AgentRequest, ChatMessage, DataItem, DataItemType} from "../lib/objectmodel";
import dotenv from "dotenv";
import {AGENT_GREETING, CLIENT_SYMPTOMS_DATA, REGISTRATION_CLIENT_DATA} from "../configuration/configuration";

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
}, 10000);

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

// test('function call test', async () => {
//
//     let functionCall = new FunctionCall("asdfasdfas",function (object: any) {
//         console.info("function call", object);
//     })
//
//     functionCall.call({a: 1, b: 2});
// });
