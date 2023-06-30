import {NextApiRequest, NextApiResponse} from "next";
import {ChatMessage, DataItem} from "../pages/lib/objectmodel";


export function mockResponse() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    } as unknown as NextApiResponse & { json: jest.Mock };
}

export function mockPostRequest(messages: ChatMessage[] = null, stateData: DataItem[] = null, isMock: boolean = true) {
    return {
        method: 'POST',
        body: {
            mock: isMock,
            messages: messages,
            stateData: stateData,
        },
    } as unknown as NextApiRequest;
}

export function expectError(res: NextApiResponse, errorMessage: string) {
    expect(res.json).toHaveBeenCalledWith({
        error: {
            message: errorMessage,
        },
    });
}
