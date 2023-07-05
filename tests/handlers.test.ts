import questionerHandler from '../pages/api/questioner';
import {mockPostRequest, mockResponse} from "./utils";
import {AgentRequest, ChatMessage, DataItem} from "../lib/objectmodel";
import dotenv from "dotenv";
import {AGENT_GREETING, CLIENT_SYMPTOMS_DATA, REGISTRATION_CLIENT_DATA} from "../configuration/configuration";

dotenv.config();

test('should return mock data', async () => {

    const messages = [
        new ChatMessage("assistant", AGENT_GREETING),
        new ChatMessage("user", "Hello, my name is John"),
    ];

    const req = mockPostRequest(new AgentRequest(messages, REGISTRATION_CLIENT_DATA, CLIENT_SYMPTOMS_DATA, true));
    const res = mockResponse();
    await questionerHandler(req, res);

    //console.log(res.json.mock.calls.length);
    //console.log(JSON.stringify(res.json.mock.calls));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        result: {
            stateData: [
                new DataItem("name", "user's name", null, null,"John"),
                new DataItem("telephone", "user's telephone number"),
            ],
            symptoms: CLIENT_SYMPTOMS_DATA,
            nextMessage: {
                content: "I understood you. Goodbye.",
                role: "assistant",
            },
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
                new DataItem("name", "user's name", null, null,"Don McLean"),
                new DataItem("telephone", "user's telephone number"),
            ],
            symptoms: CLIENT_SYMPTOMS_DATA,
            nextMessage: {
                content: expect.any(String),
                role: "assistant",
            }
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
                new DataItem("name", "user's name", null, null, "Margaret Teacher"),
                new DataItem("telephone", "user's telephone number"),
            ],
            symptoms: [],
            nextMessage: {
                content: expect.any(String),
                role: "assistant",
            }
        }
    });
});

test('live test: should end quick', async () => {

    const messages = [
        new ChatMessage("assistant", AGENT_GREETING),
        new ChatMessage("user", "This is Margaret Teacher calling, my phone is +38472518569, call me a doctor")
    ];

    const req = mockPostRequest(new AgentRequest(messages, REGISTRATION_CLIENT_DATA, CLIENT_SYMPTOMS_DATA));
    const res = mockResponse();
    await questionerHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        result: {
            stateData: [
                new DataItem("name", "user's name", null, null,"Margaret Teacher"),
                new DataItem("telephone", "user's telephone number", null, null,"+38472518569"),
            ],
            nextMessage: {
                content: expect.any(String),
                role: "assistant",
            },
            voucherId: expect.any(String),
        }
    });
});
