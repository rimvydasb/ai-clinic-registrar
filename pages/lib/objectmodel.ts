import {ChatCompletionResponseMessage, ChatCompletionResponseMessageRoleEnum} from "openai";

export class Message implements ChatCompletionResponseMessage {
    content: string;
    role: ChatCompletionResponseMessageRoleEnum;

    constructor(role: ChatCompletionResponseMessageRoleEnum, content: string) {
        this.role = role;
        this.content = content;
    }
}

export class StateDataItem {
    constructor(public field: string, public label: string, public value: string | null) {
    }

    static validate(items: any): boolean {
        if (items === null || !Array.isArray(items)) {
            alert("Wrong state data: " + JSON.stringify(items));
            return false;
        }
        return true;
    }
}

export class AgentRequest {
    constructor(public messages: Message[], public stateData: StateDataItem[]) {
    }
}

export type ResponseData = {
    result: any;
    error?: { message: string };
}
