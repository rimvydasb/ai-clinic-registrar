import {NextApiRequest, NextApiResponse} from "next";
import {Message, StateDataItem} from "../pages/lib/objectmodel";


export function mockResponse() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    } as unknown as NextApiResponse & { json: jest.Mock };
}

export function mockPostRequest(messages: Message[] = null, stateData: StateDataItem[] = null, isMock: boolean = true) {
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
