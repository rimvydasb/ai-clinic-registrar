import questionerHandler from '../lib/server/questioner';
import {mockPostRequest, mockResponse} from "./utils";
import {AgentRequest, ChatMessage, DataItem, DataItemType} from "../lib/rules/objectmodel";
import dotenv from "dotenv";
import {AGENT_GREETING, CLIENT_SYMPTOMS_DATA, REGISTRATION_CLIENT_DATA} from "../lib/rules/configuration";

dotenv.config();

describe('Live handlers test', () => {

    test('should return mock data', async () => {

        const messages = [
            new ChatMessage("assistant", AGENT_GREETING),
            new ChatMessage("user", "Hello, my name is John"),
        ];

        const agentRequest = new AgentRequest();
        agentRequest.userData = REGISTRATION_CLIENT_DATA;
        agentRequest.symptomsData = CLIENT_SYMPTOMS_DATA;
        agentRequest.messages = messages;
        agentRequest.isMock = true;
        agentRequest.voucherId = "sometime";

        const request = mockPostRequest(agentRequest);
        const response = mockResponse();
        await questionerHandler(request, response);

        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith({
            userData: [
                new DataItem("name", "user's name", null, DataItemType.String, "John"),
                new DataItem("telephone", "user's telephone number"),
            ],
            symptomsData: CLIENT_SYMPTOMS_DATA,
            nextMessage: new ChatMessage("assistant", "I understood you. Goodbye."),
            voucherId: null,
        });
    }, 10000);

    test('live test: should not messes with names', async () => {

        const messages = [
            new ChatMessage("assistant", AGENT_GREETING),
            new ChatMessage("user", "Hello, I'm Don McLean, I was writing a song how I miss my friend Richie Valens and now my finger hurts")
        ];

        const agentRequest = new AgentRequest();
        agentRequest.userData = REGISTRATION_CLIENT_DATA;
        agentRequest.symptomsData = CLIENT_SYMPTOMS_DATA;
        agentRequest.messages = messages;

        const request = mockPostRequest(agentRequest);
        const response = mockResponse();
        await questionerHandler(request, response);

        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith({
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
    },30000);

    test('live test: ask for symptomsData', async () => {

        const messages = [
            new ChatMessage("assistant", AGENT_GREETING),
            new ChatMessage("user", "This is Margaret Teacher calling, need doctor's help"),
            new ChatMessage("assistant", "Of course, Margaret. I'm here to assist you. Could you please let me know if you're experiencing any pain?"),
            new ChatMessage("user", "My finger hurts"),
        ];

        const agentRequest = new AgentRequest();
        agentRequest.userData = REGISTRATION_CLIENT_DATA;
        agentRequest.symptomsData = CLIENT_SYMPTOMS_DATA;
        agentRequest.messages = messages;

        const req = mockPostRequest(agentRequest);
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
    }, 30000);

    test('live test: should end quick', async () => {

        const messages = [
            new ChatMessage("assistant", AGENT_GREETING),
            new ChatMessage("user", "This is Margaret Teacher calling, my phone is +38472518569, call me a doctor. Everything is fine, nothing hurts.")
        ];

        const agentRequest = new AgentRequest();
        agentRequest.userData = REGISTRATION_CLIENT_DATA;
        agentRequest.symptomsData = CLIENT_SYMPTOMS_DATA;
        agentRequest.messages = messages;

        const req = mockPostRequest(agentRequest);
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
    }, 30000);
});




// test('function call test', async () => {
//
//     let functionCall = new FunctionCall("asdfasdfas",function (object: any) {
//         console.info("function call", object);
//     })
//
//     functionCall.call({a: 1, b: 2});
// });
