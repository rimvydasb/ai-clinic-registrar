import observerHandler from '../pages/api/observer';
import questionerHandler from '../pages/api/questioner';
import {expectError, mockPostRequest, mockResponse} from "./utils";
import {ChatMessage, DataItem} from "../pages/lib/objectmodel";
import {getNextOpenAI} from "../pages/lib/server.lib";
import dotenv from "dotenv";

dotenv.config();

test('fail if no data', async () => {

    const req = mockPostRequest(null, null, true);
    const res = mockResponse();

    await observerHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expectError(res, "Server error: Messages are not valid");
});

test('observer handler returns state data', async () => {

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

    await observerHandler(req, res);

    // console.log(res.json.mock.calls.length);
    // console.log(res.json.mock.calls);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        result: [
            new DataItem("name", "user's name", "John"),
            new DataItem("telephone", "user's telephone number", null),
        ],
    });
});

test('questioner handler returns single message', async () => {

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

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        result: ChatMessage.asChatCompletionRequestMessage(new ChatMessage("assistant", "I understood you. Goodbye.")),
    });
});

test('function call', async () => {

    const functionCall1 = {
        "name": "save_user_name",
        "description": "Save user's name",
        "parameters": {
            "type": "object",
            "properties": {
                "userName": {
                    "type": "string",
                    "description": "user's name"
                }
            }
        }
    }

    const functionCall2 = {
        "name": "save_user_telephone",
        "description": "Save user's telephone number",
        "parameters": {
            "type": "object",
            "properties": {
                "telephoneNumber": {
                    "type": "string",
                    "description": "user's telephone number"
                }
            }
        }
    }

    const functionCall3 = {
        "name": "extract_data",
        "description": "Extract data if found",
        "parameters": {
            "type": "object",
            "properties": {
                "userName": {
                    "type": "string",
                    "description": "user's name"
                },
                "telephoneNumber": {
                    "type": "string",
                    "description": "user's telephone number"
                }
            }
        }
    }

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

    //let result = await nextOpenAi.createChatCompletion(messages,[functionCall1, functionCall2]);

    let result = await nextOpenAi.extractDataFromChat(messages, stateData)

    console.log(result);

});
