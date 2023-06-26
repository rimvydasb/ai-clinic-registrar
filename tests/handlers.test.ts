import observerHandler from '../pages/api/observer';
import questionerHandler from '../pages/api/questioner';
import {expectError, mockPostRequest, mockResponse} from "./utils";
import {Message, StateDataItem} from "../pages/lib/objectmodel";

test('fail if no data', async () => {

    const req = mockPostRequest(null, null, true);
    const res = mockResponse();

    await observerHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expectError(res, "Server error: Messages are not valid");
});

test('observer handler returns state data', async () => {

    const messages = [
        new Message("assistant", "Hello, how can I help you?"),
        new Message("user", "Hello, my name is John"),
    ];

    const stateData = [
        new StateDataItem("name", "user's name", null),
        new StateDataItem("telephone", "user's telephone number", null),
    ];

    const req = mockPostRequest(messages, stateData, true);
    const res = mockResponse();

    await observerHandler(req, res);

    // console.log(res.json.mock.calls.length);
    // console.log(res.json.mock.calls);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        result: [
            new StateDataItem("name", "user's name", "John"),
            new StateDataItem("telephone", "user's telephone number", null),
        ],
    });
});

test('questioner handler returns single message', async () => {

    const messages = [
        new Message("assistant", "Hello, how can I help you?"),
        new Message("user", "Hello, my name is John"),
    ];

    const stateData = [
        new StateDataItem("name", "user's name", null),
        new StateDataItem("telephone", "user's telephone number", null),
    ];

    const req = mockPostRequest(messages, stateData, true);
    const res = mockResponse();

    await questionerHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        result: new Message("assistant", "I understood you. Goodbye."),
    });
});
