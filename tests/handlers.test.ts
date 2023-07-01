import questionerHandler, {questionerRequest} from '../pages/api/questioner';
import {expectError, mockPostRequest, mockResponse} from "./utils";
import {ChatMessage, DataItem} from "../pages/lib/objectmodel";
import {getNextOpenAI} from "../pages/lib/server.lib";
import dotenv from "dotenv";

dotenv.config();

test('should return mock data', async () => {

    const messages = [
        new ChatMessage("assistant", "Hello, how can I help you?"),
        new ChatMessage("user", "Hello, my name is John"),
    ];

    const stateData = [
        new DataItem("name", "user's name", null),
        new DataItem("telephone", "user's telephone number", null),
    ];

    const req = mockPostRequest(messages, stateData, true);
    const res = mockResponse();

    await questionerHandler(req, res);

    // console.log(res.json.mock.calls.length);
    // console.log(res.json.mock.calls);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        result: {
            stateData: [
                new DataItem("name", "user's name", "John"),
                new DataItem("telephone", "user's telephone number", null),
            ],
            nextMessage: {
                content: "I understood you. Goodbye.",
                role: "assistant",
            },
        }
    });
});

test('live test: should not messes with names', async () => {

    const messages = [
        new ChatMessage("assistant", "Hello, how can I help you?"),
        new ChatMessage("user", "Hello, I'm Don McLean, I was writing a song how I miss my friend Richie Valens and now my finger hurts")
    ];

    const stateData = [
        new DataItem("name", "user's name", null),
        new DataItem("telephone", "user's telephone number", null),
    ];

    const req = mockPostRequest(messages, stateData, false);
    let nextOpenAi = getNextOpenAI(req);

    const res = mockResponse();

    await questionerHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        result: {
            stateData: [
                new DataItem("name", "user's name", "Don McLean"),
                new DataItem("telephone", "user's telephone number", null),
            ],
            nextMessage: {
                content: expect.any(String),
                role: "assistant",
            }
        }
    });

});

test('live test: should end quick', async () => {

    const messages = [
        new ChatMessage("assistant", "Hello, how can I help you?"),
        new ChatMessage("user", "This is Margaret Teacher calling, my phone is +38472518569, call me a doctor")
    ];

    const stateData = [
        new DataItem("name", "user's name", null),
        new DataItem("telephone", "user's telephone number", null),
    ];

    const req = mockPostRequest(messages, stateData, false);
    let nextOpenAi = getNextOpenAI(req);

    const res = mockResponse();

    await questionerHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        result: {
            stateData: [
                new DataItem("name", "user's name", "Margaret Teacher"),
                new DataItem("telephone", "user's telephone number", "+38472518569"),
            ],
            nextMessage: {
                content: expect.any(String),
                role: "assistant",
            },
            voucherId: expect.any(String),
        }
    });
});
