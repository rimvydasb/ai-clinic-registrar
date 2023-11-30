import {NextApiRequest, NextApiResponse} from "next";
import {AgentRequest, ChatMessage, DataItem} from "../lib/rules/objectmodel";


export function mockResponse() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    } as unknown as NextApiResponse & { json: jest.Mock };
}

export function mockPostRequest(request: AgentRequest) {
    return {
        method: 'POST',
        body: request,
    } as unknown as NextApiRequest;
}

export function expectError(res: NextApiResponse, errorMessage: string) {
    expect(res.json).toHaveBeenCalledWith({
        error: {
            message: errorMessage,
        },
    });
}
